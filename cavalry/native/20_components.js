/* Layout/text/timeline components. Design coordinates are x-right/y-down. */
var JZComponents = (function(N,G){
'use strict';
/* Fallback order is explicit: requested style, same family's installed style, installed fallback families,
   then Cavalry's default font. A missing font never aborts the import; it is reported as a substitution. */
var STYLE_ORDER=['Regular','Medium','Bold','Light','Black','SemiBold','ExtraBold','ExtraLight','Thin','Italic','Oblique'];
function namesOf(value,key){
  var out=[];
  (Array.isArray(value)?value:[value]).forEach(function(item){
    if(typeof item==='string')out.push(item);
    else if(item&&typeof item==='object'){
      var name=item[key]||item.style||item.name||item.fontStyle||item.family;
      if(typeof name==='string'&&name)out.push(name);
    }
  });
  return out;
}
function apiList(methods,arg){
  for(var i=0;i<methods.length;i++){
    var fn=cavalry[methods[i]];
    if(typeof fn!=='function')continue;
    try{var value=fn.call(cavalry,arg);if(value!=null)return value;}catch(e){}
  }
  return null;
}
function stylesOf(family){
  return namesOf(apiList(['getFontStyles','fontStyles','getStylesForFont'],family),'style');
}
function familiesOf(){
  var list=apiList(['getFontFamilies','fontFamilies','getFamilies','getFonts','fonts']);
  if(!list)return [];
  var out=[];
  (Array.isArray(list)?list:[list]).forEach(function(item){
    if(typeof item==='string')out.push(item);
    else if(item&&typeof item==='object'&&typeof item.family==='string')out.push(item.family);
    else if(item&&typeof item==='object'&&typeof item.name==='string')out.push(item.name);
  });
  return out.filter(function(v,i,a){return a.indexOf(v)===i;});
}
function exists(family,style){
  if(!family||!style)return false;
  if(typeof cavalry.fontExists!=='function')return true;
  try{return !!cavalry.fontExists(family,style);}catch(e){return false;}
}
function pick(family,preferred){
  if(!family)return null;
  if(preferred&&exists(family,preferred))return {family:family,style:preferred};
  var styles=stylesOf(family);
  var order=(styles.length?styles:STYLE_ORDER).filter(function(v,i,a){return a.indexOf(v)===i&&v!==preferred;});
  for(var i=0;i<order.length;i++)if(exists(family,order[i]))return {family:family,style:order[i]};
  return null;
}
function candidate(value){
  if(typeof value==='string')return {family:value,style:null};
  if(value&&typeof value==='object'){
    var family=value.family||value.name;
    var style=value.style||value.fontStyle||null;
    return family?{family:family,style:style}:null;
  }
  return null;
}
function font(node,options){
  if(node._jzFont)return node._jzFont;
  options=options||{};
  var overrides=options.fontOverrides||{};
  var requested=overrides[node.font&&node.font.key]||node.font||{};
  var family=requested.family,style=requested.style;
  var info;
  if(family&&exists(family,style))info={family:family,style:style,fallback:false,reason:'exact'};
  else if(family){
    var same=pick(family,style);
    info=same?{family:same.family,style:same.style,fallback:true,reason:'style'}
      :{family:null,style:null,fallback:true,reason:'family',default:true};
  }else info={family:null,style:null,fallback:true,reason:'metadata',default:true};
  if(info.fallback&&!info.family){
    var candidates=[];
    function add(value){var c=candidate(value);if(c&&c.family!==family)candidates.push(c);}
    if(Array.isArray(options.fontFallbacks))options.fontFallbacks.forEach(add);
    else add(options.fontFallbacks);
    add(options.fontFallback);add(options.defaultFont);
    Object.keys(overrides).forEach(function(k){add(overrides[k]);});
    familiesOf().slice(0,48).forEach(function(f){add(f);});
    for(var i=0;i<candidates.length;i++){
      var picked=pick(candidates[i].family,candidates[i].style);
      if(picked){info={family:picked.family,style:picked.style,fallback:true,reason:'fallback'};break;}
    }
  }
  info.requested={family:requested.family||null,style:requested.style||null,
    key:node.font&&node.font.key||null};
  node._jzFont=info;
  return info;
}
function glyphs(node,f) {
  if(Array.isArray(node.glyphs)) {
    var joined=node.glyphs.map(function(g){return g.ch;}).join('');
    if(joined!==node.text.replace(/\n/g,''))throw new Error('Glyph payload does not preserve text '+node.id);
    return node.glyphs.map(function(g){return Object.assign({},g);});
  }
  var lines=node.text.split('\n'), lead=(node.lead||1.3)*node.size, out=[], index=0;
  lines.forEach(function(line,li){
    var chars=Array.from(line), widths=chars.map(function(ch){
      if(node.vertical&&!/[A-Za-z0-9]/.test(ch))return node.size;
      if(f&&f.family&&f.style&&typeof cavalry.measureText==='function'){
        try{var m=cavalry.measureText(ch,f.family,f.style,node.size);if(m&&N.finite(m.width)>0)return m.width;}catch(e){}
      }
      return node.size*(ch===' '?0.33:0.62);
    });
    var total=widths.reduce(function(a,b){return a+b;},0)+Math.max(0,chars.length-1)*(node.track||0)*node.size;
    var at=node.vertical?(node.align==='left'?0:-total/2):(node.align==='left'?0:node.align==='right'?-total:-total/2);
    chars.forEach(function(ch,ci){
      var small='ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ'.indexOf(ch)>=0;
      var punct='、。，．'.indexOf(ch)>=0, v=node.vertical;
      out.push({ch:ch,i:index++,li:li,ci:ci,n:chars.length,x:v?-(li-(lines.length-1)/2)*lead:at+widths[ci]/2,
        y:v?at+widths[ci]/2:(li-(lines.length-1)/2)*lead,w:v?node.size:widths[ci],h:v?widths[ci]:node.size,
        vx:v?(small?.11*node.size:punct?.3*node.size:0):0,vy:v?(small?-.11*node.size:punct?-.3*node.size:0):0,
        r90:v&&('ー〜～…‥―—-()（）「」『』【】〈〉《》〔〕[]［］→←:：;；=＝'.indexOf(ch)>=0||/[A-Za-z0-9]/.test(ch)),fs:1});
      at+=widths[ci]+(node.track||0)*node.size;
    });
  }); return out;
}
function sample(g,id,start,end,fn) {
  var previous={}, pending={}, last={}, buf={};
  function put(attr,f,v,tp){(buf[attr]=buf[attr]||[]).push({f:f,v:v,tp:tp||1});last[attr]=f;}
  for(var frame=start;frame<end;frame++) {
    var state=fn(frame); Object.keys(state).forEach(function(attr){
      var v=state[attr];
      if (typeof v==='string') {
        if (!(attr in previous) || previous[attr]!==v) { put(attr,frame,v,2); previous[attr]=v; }
        pending[attr]=frame; return;
      }
      N.finite(v,attr);
      if(!(attr in previous)){put(attr,frame,v,1);previous[attr]=v;pending[attr]=frame;return;}
      if(Math.abs(previous[attr]-v)>1e-9){if(pending[attr]>last[attr])put(attr,pending[attr],previous[attr],1);put(attr,frame,v,1);previous[attr]=v;pending[attr]=frame;}
      else pending[attr]=frame;
    });
  }
  var layer=g.byId[id];
  Object.keys(buf).forEach(function(attr){
    if(layer&&layer.keys&&layer.keys[attr]){
      Object.keys(layer.keys[attr]).forEach(function(k){
        var kf=+k; if(kf>=start&&kf<end) delete layer.keys[attr][k];
      });
    }
    buf[attr].forEach(function(k){g.key(id,attr,k.f,k.v,k.tp);});
  });
}
function text(graph,cut,node,parent,options,animate) {
  var f=font(node,options), gs=glyphs(node,f), start=Math.max(cut.start,cut.origin+(node.delayFrames||0));
  if(start>=cut.end)return [];
  var place=graph.add('null',node.id+' / Placement',parent,start,cut.end,{
    position:[node.x-graph.comp.width/2,graph.comp.height/2-node.y],rotation:-(node.rotation||0),scale:[node.sx==null?1:node.sx,1]});
  var ids=[];
  gs.forEach(function(glyph,i){
    var attrs={text:glyph.ch,fontSize:node.size*(glyph.fs||1),autoWidth:true,autoHeight:true,
      horizontalAlignment:1,verticalAlignment:1,position:[glyph.x+(glyph.vx||0),-glyph.y-(glyph.vy||0)],
      rotation:glyph.r90?-90:0,scale:[1,1],fill:true,stroke:false,'material.materialColor':node.color};
    if(f.family&&f.style)attrs.font={font:f.family,style:f.style};
    var id=graph.add('textShape',node.id+' / '+i,place,start,cut.end,attrs);
    sample(graph,id,start,cut.end,function(frame){
      var s={dx:0,dy:0,rot:0,sx:1,sy:1,a:1};animate(s,glyph,gs,frame);
      return {'position.x':glyph.x+(glyph.vx||0)+s.dx,'position.y':-glyph.y-(glyph.vy||0)-s.dy,
        rotation:-(glyph.r90?90:0)-s.rot,'scale.x':s.sx,'scale.y':s.sy,alpha:N.clamp(s.a)};
    }); ids.push(id);
  }); return ids;
}
/* One editable path. `paint` is either an object {fill, stroke, width, alpha} or the legacy
   (color, width, alpha) arguments. A shape with no paint is an error, never an empty layer. */
function shape(graph,cut,name,parent,commands,paint,width,alpha) {
  if(!Array.isArray(commands)||commands.length<2)throw new Error('Missing geometry: '+name);
  var fill=null, stroke=null, w=null, a=1;
  if (paint && typeof paint==='object') {
    fill=paint.fill||null; stroke=paint.stroke||null; w=paint.width; a=paint.alpha==null?1:paint.alpha;
  } else if (width>0) { stroke=paint||null; w=width; a=alpha==null?1:alpha; }
  else { fill=paint||null; a=alpha==null?1:alpha; }
  if (!fill&&!stroke) throw new Error('Shape has no paint: '+name);
  if (stroke&&!(N.finite(w,'stroke width')>0)) throw new Error('Stroke without a positive width: '+name);
  N.finite(a,'shape alpha');
  if (!(a>0)) throw new Error('Invisible shape: '+name);
  return graph.add('path',name,parent,cut.start,cut.end,{position:[0,0],fill:!!fill,stroke:!!stroke,
    'material.materialColor':fill||stroke,'stroke.strokeColor':stroke||fill,alpha:a,'stroke.width':stroke?w:1},commands);
}
return {text:text,glyphs:glyphs,font:font,sample:sample,shape:shape};
})(JZNative,JZGraph);
