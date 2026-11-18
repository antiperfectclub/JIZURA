/* Editable geometry ports: AE bg1, outline treatment and pushSlide transition. */
(function (N,G,C,R,V) {
'use strict';
function add(g,k,source,scope,build,differences) {
  N.register(g,k,{source:source,scope:scope,build:build,differences:differences||[]});
}
function node(c,label,path,color,alpha,range,parent) {
  return C.shape(c.graph,range||c.cut,c.cut.id+' / '+label,parent||c.parent,path,{fill:color,alpha:alpha});
}
function num(P,k,d) { return N.finite(P[k]==null?d:P[k],k); }
function wrap(x,n) { return ((x%n)+n)%n; }
function bgClock(c) {
  var fps=c.comp.fps, cut=c.cut, origin=cut.origin, cuts=c.assembly.cuts;
  var i=cuts.findIndex(function(k){return k.id===cut.id;});
  var seed=(c.preset.params||{}).seed;
  while(--i>=0){
    var old=cuts[i], p=old.presets&&old.presets.bg;
    if(!p||p.name!==c.preset.name||(p.params||{}).seed!==seed||Math.abs(old.sourceEnd-origin)/fps>=.06) break;
    origin=old.origin;
  }
  return function(f){return (f-origin)/fps;};
}
['splitH','splitV'].forEach(function(key){
  add('bg',key,'ae/p_bg1.jsx:bg1_split','cut',function(c){
    var p=c.preset.params||{}, W=c.comp.width,H=c.comp.height,vert=key==='splitV',L=vert?W:H;
    var t=bgClock(c),far=num(p,'side',1)>0,px=Math.min(W,H)/1080,pos=num(p,'pos',.5), tint=p.c==='tint';
    var alpha=num(p,'k',.08)*(tint?1.8:1), fg=tint?c.sc.accent:c.sc.fg, axis=vert?'position.x':'position.y';
    var panel=node(c,key+' panel',G.rect(-W/2-px,-H/2-px,W+2*px,H+2*px),fg,N.clamp(alpha));
    var edge=node(c,key+' edge',G.rect(vert?-px:-W/2,vert?-H/2:-px,vert?2*px:W,vert?H:2*px),c.sc.accent,.27);
    function position(f){
      var e=R.E.outExpo(t(f)/.5), x=L*(pos+.012*Math.sin(f/c.comp.fps*(vert?.6:.5)));
      return (vert?1:-1)*((far?L+(x-L)*e:x*e)-L/2);
    }
    V.animate(c,panel,function(e,f){var q={};q[axis]=position(f)+(far?1:-1)*(vert?1:-1)*(L/2+px);return q;});
    V.animate(c,edge,function(e,f){var q={alpha:.27*R.E.outExpo(t(f)/.5)};q[axis]=position(f);return q;});
  },['Uses transparent foreground/accent paint rather than a baked scheme-background mix.']);
});
add('bg','checker','ae/p_bg1.jsx:checker','cut',function(c){
  var p=c.preset.params||{}, W=c.comp.width,H=c.comp.height,n=num(p,'n',6),rot=num(p,'rot',0);
  if(!Number.isInteger(n)||n<1||n>16) throw new Error('checker.n must be an integer in [1,16]');
  var cell=Math.min(W,H)/n*(rot?1.2:1), r=Math.ceil(Math.hypot(W,H)/(2*cell))+3, path=[];
  if(r>100) throw new Error('checker exceeds geometry budget');
  for(var y=-r;y<r;y++) for(var x=-r;x<r;x++)
    if(wrap(x+y,2)) path=path.concat(G.rect(x*cell,-(y+1)*cell,cell,cell));
  var k=N.clamp(num(p,'k',.05)), speed=num(p,'spd',.15), t=bgClock(c);
  var id=node(c,'Checker tiles',path,c.sc.fg,k), a=-rot*Math.PI/180;
  V.animate(c,id,function(e,f){
    var d=wrap(f/c.comp.fps*cell*speed,2*cell);
    return {'position.x':d*(Math.cos(a)+Math.sin(a)),'position.y':d*(Math.sin(a)-Math.cos(a)),rotation:-rot,alpha:k*R.E.outCubic(t(f)/.4)};
  });
},['Repeater is expanded to editable paths; tile paint preserves transparency.']);
add('treat','outline','AE outline treatment','glyph',function(c){
  var p=c.preset.params||{},k=num(p,'k',.03),base=1.4*c.comp.height/1080;
  if(k<=0) throw new Error('outline.k must be positive');
  c.texts.forEach(function(id){
    var n=c.graph.byId[id];
    if(!n||n.type!=='textShape') throw new Error('Outline needs a text shape');
    n.attrs.fill=false;n.attrs.stroke=true;n.attrs['stroke.strokeColor']=n.attrs['material.materialColor'];
    n.attrs['stroke.width']=Math.max(base,n.attrs.fontSize*k);
    if(n.keys['material.materialColor']) n.keys['stroke.strokeColor']=JSON.parse(JSON.stringify(n.keys['material.materialColor']));
  });
});
add('trans','pushSlide','ae/p_trans.jsx:pushSlide','cut-pair',function(c){
  if(!c.previous) throw new Error('pushSlide requires a preceding cut');
  var p=c.preset.params||{},dir=p.dir||'L',W=c.comp.width,H=c.comp.height;
  if(['L','R','U','D'].indexOf(dir)<0) throw new Error('Invalid pushSlide.dir');
  var start=c.cut.start, duration=num(p,'frames',c.preset.frames||Math.max(2,Math.round(.35*c.comp.fps)));
  if(!Number.isInteger(duration)||duration<1) throw new Error('Invalid pushSlide frame count');
  var end=Math.min(c.cut.end,start+duration), a=c.previous, g=c.graph;
  if(a.cut.end<start) throw new Error('pushSlide cannot bridge a timeline gap');
  var horizontal=dir==='L'||dir==='R', axis=horizontal?'position.x':'position.y';
  var length=horizontal?W:H, sign=dir==='L'||dir==='D'?-1:1;
  function progress(f){return end-start<2?1:R.clamp((f-start)/(end-start-1));}
  function delta(f){return Math.round(R.E.inOutCubic(progress(f))*length)*sign;}
  a.layerIds.forEach(function(id){var n=g.byId[id];if(n.end===a.cut.end)n.end=Math.max(n.end,end);});
  [a,c].forEach(function(ctx,i){
    var layer=g.byId[ctx.layerIds[0]], id=g.add('null',layer.name+' / Push rig',layer.parent,layer.start,layer.end,{});
    var at=g.layers.indexOf(layer), rig=g.layers.pop();g.layers.splice(at,0,rig);layer.parent=id;ctx.layerIds.push(id);
    if(layer.start<start)g.key(id,axis,layer.start,0,1);
    if(layer.start<start-1)g.key(id,axis,start-1,0,1);
    for(var f=start;f<end;f++)g.key(id,axis,f,delta(f)-(i?sign*length:0),1);
  });
  var w=Math.max(1,Math.min(W,H)*.005), seam=node(c,'Push seam',G.rect(horizontal?-w/2:-W/2,horizontal?-H/2:-w/2,horizontal?w:W,horizontal?H:w),c.sc.accent,1,{start:start,end:end},c.sceneRoot);
  C.sample(g,seam,start,end,function(f){var q={alpha:Math.pow(Math.max(0,Math.sin(Math.PI*progress(f))),.6)};q[axis]=-sign*length/2+delta(f);return q;});
  return seam;
},['The outgoing graph holds its final sampled pose when extended into the transition.']);
})(JZNative,JZGraph,JZComponents,JZRecipeTools,JZRecipeComponents);
