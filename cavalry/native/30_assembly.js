/* Assembly -> registered native recipes -> validated graph -> Cavalry API. */
var JZCavalry=(function(N,G,C){
'use strict';
function name(p){return typeof p==='string'?p:p&&p.name;}
function required(a){var r=[];a.cuts.forEach(function(c){var P=c.presets||{};
  r.push({group:'layout',name:c.layoutInstruction&&c.layoutInstruction.name||c.source&&c.source.layout,cut:c.id});
  ['enter','hold','exit','bg','cam','treat','trans'].forEach(function(g){if(name(P[g])&&name(P[g])!=='none')r.push({group:g,name:name(P[g]),cut:c.id});});
  (P.decor||[]).forEach(function(p){r.push({group:'decor',name:name(p),cut:c.id});});
});(a.events||[]).forEach(function(e){r.push({group:'fx',name:e.type||e.name,cut:'event'});});return r;}
function preflight(a){
  if(!a||a.format!=='jizura.cavalry.assembly'||[1,2,3].indexOf(a.version)<0||!Array.isArray(a.cuts)||!a.composition)throw new Error('Invalid Cavalry assembly');
  var comp=a.composition;[comp.width,comp.height,comp.fps,comp.frameCount].forEach(function(x){if(!(N.finite(x,'composition')>0))throw new Error('Invalid composition');});
  if(!Number.isInteger(comp.frameCount)||!a.style||!Array.isArray(a.style.schemes)||!a.style.schemes.length)throw new Error('Invalid frame count/palette');
  var ids=Object.create(null);a.cuts.forEach(function(c){
    if(!c.id||ids[c.id])throw new Error('Duplicate/empty cut id');ids[c.id]=true;
    ['start','end','origin','sourceEnd','inFrames','outFrames'].forEach(function(k){if(!Number.isInteger(c[k]))throw new Error('Invalid cut '+k);});
    if(c.start<0||c.end<=c.start||c.end>comp.frameCount||c.sourceEnd<c.end||c.origin>c.start||c.inFrames<1||c.outFrames<1||!Array.isArray(c.nodes))throw new Error('Invalid cut range');
    c.nodes.forEach(function(n){if(!n.id||ids[n.id])throw new Error('Duplicate/empty node id');ids[n.id]=true;
      if(n.kind&&n.kind!=='text')throw new Error('Use explicit graphics commands for non-text nodes');
      if(typeof n.text!=='string'||!n.font)throw new Error('Invalid text node');
      ['x','y','size','sx','rotation','delayFrames'].forEach(function(k){N.finite(n[k],n.id+'.'+k);});
      if(n.size<=0||!Number.isInteger(n.delayFrames))throw new Error('Invalid text size/delay');
    });
    if(c.captureError)throw new Error(c.captureError);
  });
  var rows=required(a), missing=rows.filter(function(r){return !N.get(r.group,r.name);});
  return {required:rows,missing:missing,manifest:N.manifest(),hostVerified:false,renderVerified:false};
}
function compile(a,options){
  options=options||{};var report=preflight(a);if(report.missing.length){var e=new Error('Unimplemented native recipes: '+report.missing.map(function(r){return r.group+':'+r.name+' ['+r.cut+']';}).join(', '));e.report=report;throw e;}
  if(a.events&&a.events.length&&!N.get('fx',(a.events[0].type||a.events[0].name)))throw new Error('Unsupported events');
  if(a.style.glow||a.style.ghost||Object.keys(a.style.texture||{}).some(function(k){return a.style.texture[k];}))throw new Error('Native style effects are not implemented');
  if(a.style.fx&&['glitch','texture','chroma'].some(function(k){return a.style.fx[k]>0;}))throw new Error('Native screen FX are not implemented');
  var graph=new G.Graph(a.composition), root=graph.add('null','JIZURA / '+(a.title||''),null,0,a.composition.frameCount,{});
  var built={}, notices=[];
  function dispatch(group,p,c){var k=name(p);if(!k||k==='none')return null;var d=N.get(group,k);if(!d)throw new Error('No native builder '+group+':'+k);
    var out=d.build(Object.assign({},c,{preset:typeof p==='string'?{name:p}:p}));built[group+':'+k]=1;return out;}
  a.cuts.forEach(function(cut){
    var P=cut.presets||{},group=graph.add('null',cut.id,root,cut.start,cut.end,{}),sc=a.style.schemes[P.scheme||0]||a.style.schemes[0];
    /* outer (position + roll) -> stretch (shear decomposition) -> camera (scale + counter-rotation).
       Separate nulls keep every camera model expressible with documented transform attributes. */
    var outer=graph.add('null',cut.id+' / Camera Outer',group,cut.start,cut.end,{});
    var stretch=graph.add('null',cut.id+' / Camera Stretch',outer,cut.start,cut.end,{});
    var cam=graph.add('null',cut.id+' / Camera',stretch,cut.start,cut.end,{});
    var ctx={graph:graph,assembly:a,cut:cut,comp:a.composition,parent:cam,rig:cam,camOuter:outer,camStretch:stretch,sc:sc,options:options,texts:[]};
    if(cut.background)C.shape(graph,cut,cut.id+' / Background',group,G.rect(-a.composition.width/2,-a.composition.height/2,a.composition.width,a.composition.height),cut.background);
    dispatch('bg',P.bg,ctx);
    dispatch('layout',cut.layoutInstruction||{name:cut.source.layout},ctx);
    cut.nodes.forEach(function(node){
      var m=Object.assign({},ctx,{node:node});
      var effects=['enter','hold','exit'].map(function(k){return dispatch(k,P[k]||{name:k==='hold'?'still':'cut'},m);});
      var ids=C.text(graph,cut,node,cam,options,function(s,g,gs,f){effects.forEach(function(fn){if(typeof fn!=='function')throw new Error('Motion builder must return a sampler');fn(s,g,gs,f);});});
      ctx.texts=ctx.texts.concat(ids);
      if(!node.glyphs)notices.push(node.id+': host ink metrics used; web advance metrics absent');
    });
    dispatch('treat',P.treat,ctx);(P.decor||[]).forEach(function(p){dispatch('decor',p,ctx);});dispatch('cam',P.cam,ctx);
    if(P.trans)dispatch('trans',P.trans,ctx);
  });
  (a.events||[]).forEach(function(e){dispatch('fx',{name:e.type||e.name,params:e},{graph:graph,assembly:a,comp:a.composition,parent:root,options:options});});
  graph.validate();report.built=built;report.fallback={};report.errors=[];report.notices=notices;report.createdLayers=graph.layers.length;report.connections=graph.edges.length;
  report.build=typeof JZCavalryBuild==='undefined'?null:JZCavalryBuild;
  return {graph:graph,report:report};
}
function run(a,o){o=o||{};var result=compile(a,o),scene=result.graph.emit(Object.assign({},o,{title:a.title}));scene.report=result.report;
  console.log('JIZURA native build report: '+JSON.stringify(result.report));
  if(!o.timingPaths)console.warn('Set composition timing manually: '+a.composition.fps+' fps, 0-'+(a.composition.frameCount-1));
  return scene;
}
return {run:run,compile:compile,preflight:preflight};
})(JZNative,JZGraph,JZComponents);
