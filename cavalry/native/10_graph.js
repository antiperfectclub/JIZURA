/* Editable native graph components; API effects happen only in emit(). */
var JZGraph = (function (N) {
'use strict';
function Graph(comp) { this.comp=comp; this.layers=[]; this.byId=Object.create(null); this.edges=[]; this.serial=0; }
Graph.prototype.add=function(type,name,parent,start,end,attrs,commands) {
  var id='n'+(++this.serial), n={id:id,type:type,name:name,parent:parent,start:start,end:end,attrs:attrs||{},commands:commands||null,keys:{}};
  if (!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start||end>this.comp.frameCount) throw new Error('Invalid clip '+name);
  if(parent&&!this.byId[parent]) throw new Error('Unknown parent '+parent);
  this.layers.push(n); this.byId[id]=n; return id;
};
Graph.prototype.key=function(id,attr,frame,value,type) {
  var n=this.byId[id]; if(!n) throw new Error('Unknown layer '+id);
  if(!Number.isInteger(frame)||frame<n.start||frame>=n.end) throw new Error('Key outside clip '+n.name);
  check(value); var track=n.keys[attr]||(n.keys[attr]={});
  if(Object.prototype.hasOwnProperty.call(track,frame)) throw new Error('Conflicting key '+id+'.'+attr+'@'+frame);
  track[frame]={value:value,type:type==null?1:type};
};
Graph.prototype.connect=function(from,output,to,input) {
  if(!this.byId[from]||!this.byId[to]) throw new Error('Dangling connection');
  this.edges.push({from:from,output:output,to:to,input:input});
};
function check(v) {
  if(typeof v==='number') N.finite(v,'graph value');
  else if(Array.isArray(v)) v.forEach(check);
  else if(v&&typeof v==='object') Object.keys(v).forEach(function(k){check(v[k]);});
  else if(typeof v!=='string'&&typeof v!=='boolean'&&v!==null) throw new Error('Invalid graph value');
}
var verbs={M:['moveTo',2],L:['lineTo',2],Q:['quadTo',4],C:['cubicTo',6],Z:['close',0]};
function path(commands) {
  if(!Array.isArray(commands)||commands.length<2||commands[0][0]!=='M') throw new Error('Empty/invalid path');
  var p=new cavalry.Path(), points=0;
  commands.forEach(function(c){ var v=verbs[c[0]]; if(!v||c.length!==v[1]+1) throw new Error('Unsupported path verb '+c[0]);
    c.slice(1).forEach(function(x){N.finite(x,'path coordinate');}); p[v[0]].apply(p,c.slice(1)); if(v[1]) points++; });
  if(points<2||p.empty()) throw new Error('Empty native path'); return p;
}
function rect(x,y,w,h) {
  [x,y,w,h].forEach(function(v){N.finite(v,'rectangle');}); if(w<=0||h<=0) throw new Error('Degenerate rectangle');
  return [['M',x,y],['L',x+w,y],['L',x+w,y+h],['L',x,y+h],['Z']];
}
function ellipse(cx,cy,rx,ry) {
  if(!(rx>0&&ry>0)) throw new Error('Degenerate ellipse'); var k=.5522847498307936;
  return [['M',cx+rx,cy],['C',cx+rx,cy+k*ry,cx+k*rx,cy+ry,cx,cy+ry],['C',cx-k*rx,cy+ry,cx-rx,cy+k*ry,cx-rx,cy],['C',cx-rx,cy-k*ry,cx-k*rx,cy-ry,cx,cy-ry],['C',cx+k*rx,cy-ry,cx+rx,cy-k*ry,cx+rx,cy],['Z']];
}
Graph.prototype.validate=function() {
  var self=this;
  this.layers.forEach(function(n){check(n.attrs); if(n.parent&&!self.byId[n.parent]) throw new Error('Dangling parent');
    if(n.type==='path') {
      if(!n.commands||n.commands.length<2) throw new Error('Missing geometry '+n.name);
      n.commands.forEach(function(c){var v=verbs[c[0]];if(!v||c.length!==v[1]+1)throw new Error('Bad path command');c.slice(1).forEach(function(x){N.finite(x,'path');});});
    }
  }); return this;
};
Graph.prototype.emit=function(options) {
  this.validate(); options=options||{};
  var self=this, map={}, created=[], errors=(this.emitErrors||[]).slice(), failed=Object.create(null);
  var oldComp=api.getActiveComp(), oldFrame=api.getFrame(), compId;
  try {
    compId=api.createComp(options.title||'JIZURA'); created.push(compId); api.setActiveComp(compId);
  } catch(error) {
    /* Only an impossible composition creation aborts the whole import. */
    if(created.length) created.slice().reverse().forEach(function(id){try{api.deleteLayer(id);}catch(e){}});
    if(oldComp)try{api.setActiveComp(oldComp);api.setFrame(oldFrame);}catch(e2){}
    throw error;
  }
  try { api.set(compId,{'resolution.x':this.comp.width,'resolution.y':this.comp.height}); }
  catch(error) { errors.push({kind:'composition',label:'resolution',message:String(error&&error.message||error)}); }
  var timing=options.timingPaths||{fps:'fps',start:'startFrame',end:'endFrame'};
  if(timing) {
    [
      [timing.fps,this.comp.fps],
      [timing.start,0],
      [timing.end,this.comp.frameCount-1]
    ].forEach(function(pair){
      var key=pair[0], value=pair[1];
      if(!key)return;
      try{
        if(typeof api.hasAttribute==='function'&&!api.hasAttribute(compId,key))throw new Error('Attribute unavailable: '+key);
        var data={}; data[key]=value; api.set(compId,data);
        if(typeof api.hasAttribute==='function'&&api.get(compId,key)!==value)throw new Error('Readback differs from requested value '+value);
      }catch(error){errors.push({kind:'composition',label:key,message:String(error)});}
    });
  }

  this.layers.forEach(function(n){
    if(n.parent&&failed[n.parent]) {
      failed[n.id]=true;
      errors.push({kind:'layer',label:n.name,message:'parent layer failed'});
      return;
    }
    var id=null;
    try {
      id=n.type==='path'?api.createEditable(path(n.commands),n.name):api.create(n.type,n.name);
      var attrs = Object.assign({}, n.attrs);
      var isText = n.type === 'textShape';
      var isPath = n.type === 'path';
      if (!id) throw new Error('Cavalry did not create ' + n.type);
      map[n.id]=id; created.push(id);
      if(n.parent)api.parent(id,map[n.parent]); api.setInFrame(id,n.start); api.setOutFrame(id,n.end-1);

      delete attrs.fill;
      delete attrs.stroke;
      delete attrs.alpha;

      /* Writing and reading back the string is the only mandatory step. Font, colour and animation
         failures are recorded; they must never delete a lyric that was created successfully. */
      function checkAttr(key) {
        if (typeof api.hasAttribute === 'function' && !api.hasAttribute(id, key)) {
          throw new Error('Attribute unavailable: ' + key);
        }
      }
      function put(key, value) {
        checkAttr(key);
        var data = {};
        data[key] = value;
        api.set(id, data);
      }
      function attempt(stage, fn) {
        if (!isText) { fn(); return; }
        try { fn(); }
        catch (error) {
          errors.push({
            kind: 'text-attribute', label: n.name + ' / ' + stage,
            message: String(error && error.message || error)
          });
        }
      }

      if (isText) {
        put('text', attrs.text);
        var actual = api.get(id, 'text');
        if (actual !== attrs.text) {
          throw new Error('Unicode readback mismatch: expected ' +
            codepoints(attrs.text) + '; got ' + codepoints(actual));
        }
        delete attrs.text;
      }

      if (isPath || isText) {
        attempt('fill', function () { api.setFill(id, n.attrs.fill !== false); });
        attempt('stroke', function () { api.setStroke(id, !!n.attrs.stroke); });
      }
      if (isText) {
        Object.keys(attrs).forEach(function (key) {
          attempt(key, function () { put(key, attrs[key]); });
        });
      } else if (Object.keys(attrs).length) {
        api.set(id, attrs);
      }

      var full = 100;
      if (n.attrs.alpha != null || n.keys.alpha) {
        attempt('opacity range', function () {
          checkAttr('opacity');
          var value = api.get(id, 'opacity');
          if (typeof value === 'number' && isFinite(value) && value > 0) full = value;
        });
        if (n.attrs.alpha != null) {
          attempt('opacity', function () { put('opacity', full * n.attrs.alpha); });
        }
      }

      Object.keys(n.keys).forEach(function (attr) {
        var key = attr === 'alpha' ? 'opacity' : attr;
        var track = n.keys[attr];
        var frames = Object.keys(track).map(Number).sort(function (a, b) { return a - b; });

        attempt(key + ' animation', function () {
          checkAttr(key);
          if (frames.length === 1 && track[frames[0]].type === 1) {
            var value = track[frames[0]].value;
            put(key, attr === 'alpha' ? full * value : value);
            return;
          }
          frames.forEach(function (frame) {
            var k = track[frame], data = {}, meta = {};
            data[key] = attr === 'alpha' ? full * k.value : k.value;
            api.keyframe(id, frame, data);
            meta[key] = { frame: frame, type: k.type };
            api.modifyKeyframe(id, meta);
          });
        });
      });
    } catch(error) {
      failed[n.id]=true;
      delete map[n.id];
      if(id)try{api.deleteLayer(id);}catch(cleanup){errors.push({kind:'cleanup',label:n.name,message:String(cleanup&&cleanup.message||cleanup)});}
      errors.push({kind:'layer',label:n.name,message:String(error&&error.message||error)});
    }
  });
  this.edges.forEach(function(e){
    var from=map[e.from], to=map[e.to];
    if(!from||!to){errors.push({kind:'connection',label:e.from+' -> '+e.to,message:'endpoint layer missing'});return;}
    try{api.connect(from,e.output,to,e.input);}
    catch(error){errors.push({kind:'connection',label:e.from+' -> '+e.to,message:String(error&&error.message||error)});}
  });
  var ids=this.layers.filter(function(n){return !!map[n.id];}).map(function(n){return map[n.id];});
  if(options.componentPath) {
    try { if(!api.writeToFile(options.componentPath,api.serialise(ids,true),false)) throw new Error('Component write failed'); }
    catch(error) { errors.push({kind:'component',label:options.componentPath,message:String(error&&error.message||error)}); }
  }
  var texts = this.layers.filter(function (n) {
    return n.type === 'textShape' && map[n.id] && /\S/.test(n.attrs.text);
  });
  var first = texts.reduce(function (frame, n) {
    return Math.min(frame, n.start);
  }, Infinity);
  try {
    api.setFrame(isFinite(first) ? first : 0);
    if (texts.length) api.select([map[texts[0].id]]);
    else if (ids.length) api.select([ids[0]]);
  } catch (error) {
    errors.push({ kind: 'selection', label: 'composition', message: String(error) });
  }
  return {
    compositionId: compId, rootId: ids[0], layerIds: ids,
    textLayerIds: texts.map(function (n) { return map[n.id]; }),
    errors: errors
  };
};
function codepoints(s) {return Array.from(String(s)).map(function(c){return 'U+'+c.codePointAt(0).toString(16).toUpperCase();}).join(' ');}
return {Graph:Graph,rect:rect,ellipse:ellipse,codepoints:codepoints};
})(JZNative);
