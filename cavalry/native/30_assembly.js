/* Assembly -> registered native recipes -> validated graph -> Cavalry API. */
var JZCavalry=(function(N,G,C){
'use strict';
function name(p){return typeof p==='string'?p:p&&p.name;}
function copy(v){return JSON.parse(JSON.stringify(v));}
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
function scaleAlpha(node,mult){
  if(node.keys.alpha){Object.keys(node.keys.alpha).forEach(function(f){node.keys.alpha[f].value*=mult;});}
  else node.attrs.alpha=(node.attrs.alpha==null?1:node.attrs.alpha)*mult;
}
function shiftKeys(node,lag){
  if(!lag)return;
  var nextKeys={};
  Object.keys(node.keys).forEach(function(attr){
    var src=node.keys[attr], dst={};
    Object.keys(src).map(Number).sort(function(a,b){return a-b;}).forEach(function(f){
      var tf=Math.max(node.start,Math.min(node.end-1,f+lag));
      dst[tf]=copy(src[f]);
    });
    nextKeys[attr]=dst;
  });
  node.keys=nextKeys;
}
function insertBefore(graph,nodeId,targetId){
  var node=graph.byId[nodeId], target=graph.byId[targetId];
  var i=graph.layers.indexOf(node), j=graph.layers.indexOf(target);
  if(i>=0&&j>=0&&i>j){graph.layers.splice(i,1);graph.layers.splice(j,0,node);}
}
/* Remove only the layers/edges added by one failed recipe or text item. */
function truncate(graph,layerCount,edgeCount){
  graph.layers.splice(layerCount).forEach(function(n){delete graph.byId[n.id];});
  graph.edges.splice(edgeCount);
}
function record(report,kind,label,error,cut){
  report.errors.push({kind:kind,label:label,cut:cut||null,message:String(error&&error.message||error)});
}
function fontNotice(report,node,cut,options){
  var info=C.font(node,options);
  if(!info||!info.fallback)return;
  var used=info.family?info.family+' / '+info.style:'Cavalry default font';
  var requested=info.requested&&info.requested.family?info.requested.family+' / '+info.requested.style:'missing metadata';
  report.fontFallbacks.push({node:node.id,cut:cut.id,requested:requested,used:used,reason:info.reason});
  report.notices.push(node.id+': font '+requested+' -> '+used);
}
function addGhosts(graph,comp,cut,cam,textIds,sc,ghostAmt,events,notices){
  if(!(ghostAmt>0.02)||!textIds.length)return;
  var u=Math.min(comp.width,comp.height)/1080, k=ghostAmt*u;
  var chroma=(events||[]).filter(function(e){return (e.type||e.name)==='chroma';});
  var specs=[
    {label:'Ghost B',lag:Math.max(1,Math.round(1.6/24*comp.fps)),off:[-3.4,-1.3],color:sc.ghostB||sc.accent2||sc.accent},
    {label:'Ghost A',lag:Math.max(1,Math.round(0.8/24*comp.fps)),off:[3.2,1.9],color:sc.ghostA||sc.accent}
  ];
  var anchorId=graph.byId[textIds[0]].parent||textIds[0];
  var alphaScale=N.clamp(0.45*ghostAmt,0.18,0.65);
  specs.forEach(function(sp){
    var gNull=graph.add('null',cut.id+' / '+sp.label,cam,cut.start,cut.end,{});
    insertBefore(graph,gNull,anchorId);
    if(chroma.length){
      for(var f=cut.start;f<cut.end;f++){
        var s=1, t=f/comp.fps;
        for(var ci=0;ci<chroma.length;ci++){
          var dt=(t-chroma[ci].t)*24;
          if(dt>=0&&dt<14)s+=(chroma[ci].amp==null?1:chroma[ci].amp)*Math.pow(0.55,dt);
        }
        graph.key(gNull,'position.x',f,sp.off[0]*k*s,1);
        graph.key(gNull,'position.y',f,-sp.off[1]*k*s,1);
      }
    } else {
      graph.byId[gNull].attrs.position=[sp.off[0]*k,-sp.off[1]*k];
    }
    var placeMap=Object.create(null);
    textIds.forEach(function(tid){
      var src=graph.byId[tid];
      if(!src||src.type!=='textShape')return;
      var pId=src.parent, clonedParent=gNull;
      if(pId&&pId!==cam&&graph.byId[pId]){
        if(!placeMap[pId]){
          var spNode=graph.byId[pId];
          var cpId=graph.add(spNode.type,spNode.name+' / '+sp.label,gNull,spNode.start,spNode.end,copy(spNode.attrs));
          graph.byId[cpId].keys=copy(spNode.keys);
          insertBefore(graph,cpId,anchorId);
          placeMap[pId]=cpId;
        }
        clonedParent=placeMap[pId];
      }
      var cid=graph.add(src.type,src.name+' / '+sp.label,clonedParent,src.start,src.end,copy(src.attrs),src.commands?copy(src.commands):null);
      var cn=graph.byId[cid];
      cn.keys=copy(src.keys);
      cn.attrs['material.materialColor']=sp.color;
      if(cn.attrs.stroke)cn.attrs['stroke.strokeColor']=sp.color;
      scaleAlpha(cn,alphaScale);
      shiftKeys(cn,sp.lag);
      insertBefore(graph,cid,anchorId);
    });
  });
  notices.push(cut.id+': chromatic ghost copies built as lagged tinted graph layers');
}
function addGlow(graph,cut,textIds,glowAmt,notices){
  if(!(glowAmt>0.02)||!textIds.length)return;
  var alphaScale=N.clamp(0.22*glowAmt,0.05,0.35);
  textIds.forEach(function(tid){
    var src=graph.byId[tid];
    if(!src||src.type!=='textShape')return;
    var hid=graph.add(src.type,src.name+' / Glow halo',src.parent,src.start,src.end,copy(src.attrs));
    var hn=graph.byId[hid];
    hn.keys=copy(src.keys);
    hn.attrs.fill=false;hn.attrs.stroke=true;
    hn.attrs['stroke.strokeColor']=src.attrs['material.materialColor'];
    hn.attrs['stroke.width']=Math.max(2,(src.attrs.fontSize||24)*0.08*glowAmt);
    scaleAlpha(hn,alphaScale);
    insertBefore(graph,hid,tid);
  });
  notices.push(cut.id+': style.glow built as editable stroke halo (blur glow requires hostProfile.glow)');
}
function addTextures(graph,comp,root,sc,tex,texScale,notices){
  var u=Math.min(comp.width,comp.height)/1080, W=comp.width, H=comp.height;
  var cut={start:0,end:comp.frameCount};
  var scanAmt=(tex.scan||0)*texScale;
  if(scanAmt>0.02){
    var step=Math.max(6,Math.round(H/120)), bars=[];
    for(var y=-H/2;y<H/2;y+=step)bars=bars.concat(G.rect(-W/2,y,W,Math.max(1,step*0.35)));
    C.shape(graph,cut,'Style / Scanlines',root,bars,{fill:sc.fg,alpha:N.clamp(0.08*scanAmt,0.02,0.22)});
    notices.push('style.texture.scan built as editable scanline geometry');
  }
  var paperAmt=(tex.paper||0)*texScale;
  if(paperAmt>0.02){
    var fibers=[];
    for(var i=0;i<64;i++){
      var x0=(N.random(701,i,1)-0.5)*W, y0=(N.random(701,i,2)-0.5)*H;
      var ang=N.random(701,i,3)*Math.PI*2, len=(12+N.random(701,i,4)*32)*u;
      fibers.push(['M',x0,y0],['L',x0+Math.cos(ang)*len,y0+Math.sin(ang)*len]);
    }
    C.shape(graph,cut,'Style / Paper fiber',root,fibers,{stroke:sc.sub||sc.fg,width:Math.max(1,u),alpha:N.clamp(0.1*paperAmt,0.02,0.2)});
    notices.push('style.texture.paper built as editable fiber strokes');
  }
  var grainAmt=(tex.grain||0)*texScale;
  if(grainAmt>0.02){
    var dots=[];
    for(var j=0;j<96;j++){
      var gx=(N.random(907,j,1)-0.5)*W*0.95, gy=(N.random(907,j,2)-0.5)*H*0.95, sz=Math.max(1.5,2.5*u);
      dots=dots.concat(G.rect(gx,gy,sz,sz));
    }
    var gid=C.shape(graph,cut,'Style / Film grain',root,dots,{fill:sc.fg,alpha:N.clamp(0.06*grainAmt,0.02,0.16)});
    for(var f=0;f<comp.frameCount;f+=Math.max(1,Math.round(comp.fps/12))){
      graph.key(gid,'position.x',f,(N.random(907,f,3)-0.5)*24*u,2);
      graph.key(gid,'position.y',f,(N.random(907,f,4)-0.5)*24*u,2);
    }
    notices.push('style.texture.grain built as stepped seeded grain geometry');
  }
}
function compile(a,options){
  options=options||{};
  /* Recipes can extend clips or add transition layers; never mutate the caller's assembly. */
  a=JSON.parse(JSON.stringify(a));
  var report=preflight(a), missingMap={};
  report.errors=[];report.fontFallbacks=[];
  report.missing.forEach(function(r){missingMap[r.group+':'+r.name]=1;});
  if(options.strict&&report.missing.length){var e=new Error('Unimplemented native recipes: '+report.missing.map(function(r){return r.group+':'+r.name+' ['+r.cut+']';}).join(', '));e.report=report;throw e;}
  var fx=a.style.fx||{};
  var chromaScale=fx.chroma==null?0.7:N.finite(fx.chroma,'fx.chroma');
  var texScale=fx.texture==null?0.6:N.finite(fx.texture,'fx.texture');
  var ghostAmt=chromaScale*(a.style.ghost==null?0:N.finite(a.style.ghost,'style.ghost'));
  var glowAmt=(a.style.glow==null?0:N.finite(a.style.glow,'style.glow'))*texScale;
  var graph=new G.Graph(a.composition), root=graph.add('null','JIZURA / '+(a.title||''),null,0,a.composition.frameCount,{});
  var cutsRoot=graph.add('null','JIZURA / Cuts',root,0,a.composition.frameCount,{});
  var built={}, notices=[], contexts=[], fxCounter=0;
  report.notices=notices;
  function dispatch(group,p,c){var k=name(p);if(!k||k==='none')return null;
    if(!N.get(group,k)){missingMap[group+':'+k]=1;return (group==='enter'||group==='hold'||group==='exit')?function(){}:null;}
    var layerCount=graph.layers.length, edgeCount=graph.edges.length;
    try{
      var out=JZPresets.build(group,p,c);if(out===null)return null;built[group+':'+k]=1;return out;
    }catch(error){
      truncate(graph,layerCount,edgeCount);
      record(report,'recipe',group+':'+k,error,c&&c.cut&&c.cut.id);
      return (group==='enter'||group==='hold'||group==='exit')?function(){}:null;
    }
  }
  function addFxRig(label){
    var cr=graph.byId[cutsRoot], prevParent=cr.parent;
    var rigId=graph.add('null','FX Rig '+(++fxCounter)+' / '+label,prevParent,0,a.composition.frameCount,{});
    insertBefore(graph,rigId,cutsRoot);
    cr.parent=rigId;
    return rigId;
  }
  a.cuts.forEach(function(cut){
    var firstLayer=graph.layers.length;
    var P=cut.presets||{},group=graph.add('null',cut.id,cutsRoot,cut.start,cut.end,{}),sc=a.style.schemes[P.scheme||0]||a.style.schemes[0];
    /* three-node camera rig so shear can be decomposed into rotation > scale > rotation/scale (see packs/p_camera.js) */
    var outer=graph.add('null',cut.id+' / Camera Rotation',group,cut.start,cut.end,{});
    var stretch=graph.add('null',cut.id+' / Camera Stretch',outer,cut.start,cut.end,{});
    var cam=graph.add('null',cut.id+' / Camera',stretch,cut.start,cut.end,{});
    var ctx={graph:graph,assembly:a,cut:cut,comp:a.composition,parent:cam,rig:cam,camOuter:outer,camStretch:stretch,sc:sc,options:options,texts:[],sceneRoot:root};
    if(cut.background)C.shape(graph,cut,cut.id+' / Background',group,G.rect(-a.composition.width/2,-a.composition.height/2,a.composition.width,a.composition.height),cut.background);
    dispatch('bg',P.bg,ctx);
    dispatch('layout',cut.layoutInstruction||{name:cut.source.layout},ctx);
    cut.nodes.forEach(function(node){
      var m=Object.assign({},ctx,{node:node});
      var effects=['enter','hold','exit'].map(function(k){return dispatch(k,P[k]||{name:k==='hold'?'still':'cut'},m);});
      var animate=function(s,g,gs,f){effects.forEach(function(fn){if(typeof fn==='function')fn(s,g,gs,f);});};
      var layerCount=graph.layers.length, edgeCount=graph.edges.length, ids;
      try{
        ids=C.text(graph,cut,node,cam,options,animate);
        ctx.texts=ctx.texts.concat(ids);
        if(!node.glyphs)notices.push(node.id+': host ink metrics used; web advance metrics absent');
        fontNotice(report,node,cut,options);
      }catch(error){
        truncate(graph,layerCount,edgeCount);
        record(report,'text',node.id,error,cut.id);
        try{
          var fallback=JSON.parse(JSON.stringify(node));
          delete fallback.glyphs;fallback.font=null;
          ids=C.text(graph,cut,fallback,cam,options,animate);
          ctx.texts=ctx.texts.concat(ids);
          notices.push(node.id+': failed text rebuilt with default glyph placement');
          fontNotice(report,fallback,cut,options);
        }catch(error2){
          truncate(graph,layerCount,edgeCount);
          record(report,'text-fallback',node.id,error2,cut.id);
        }
      }
    });
    var styleLayers=graph.layers.length,styleEdges=graph.edges.length;
    try{addGlow(graph,cut,ctx.texts,glowAmt,notices);}
    catch(error){truncate(graph,styleLayers,styleEdges);record(report,'style','glow',error,cut.id);}
    styleLayers=graph.layers.length;styleEdges=graph.edges.length;
    try{addGhosts(graph,a.composition,cut,cam,ctx.texts,sc,ghostAmt,a.events,notices);}
    catch(error){truncate(graph,styleLayers,styleEdges);record(report,'style','ghost',error,cut.id);}
    dispatch('treat',P.treat,ctx);(P.decor||[]).forEach(function(p){dispatch('decor',p,ctx);});dispatch('cam',P.cam,ctx);
    /* Transitions are cut-pair recipes: they need the next cut assembled and must not be built in cut order. */
    ctx.layerIds=graph.layers.slice(firstLayer).map(function(n){return n.id;});
    contexts.push(ctx);
  });
  contexts.forEach(function(ctx,index){
    ctx.previous=index?contexts[index-1]:null;
    var transition=(ctx.cut.presets||{}).trans;
    if(transition)dispatch('trans',transition,ctx);
  });
  (a.events||[]).forEach(function(e){
    var fk=e.type||e.name;
    dispatch('fx',{name:fk,params:e},{graph:graph,assembly:a,comp:a.composition,parent:root,fxRig:null,addFxRig:addFxRig,options:options});
  });
  var textureLayers=graph.layers.length,textureEdges=graph.edges.length;
  try{addTextures(graph,a.composition,root,a.style.schemes[0],a.style.texture||{},texScale,notices);}
  catch(error){truncate(graph,textureLayers,textureEdges);record(report,'style','texture',error,null);}
  graph.validate();report.built=built;report.missingRecipes=missingMap;report.fallback={};report.errors=report.errors||[];report.notices=notices;report.createdLayers=graph.layers.length;report.connections=graph.edges.length;
  report.build=typeof JZCavalryBuild==='undefined'?null:JZCavalryBuild;
  return {graph:graph,report:report};
}
function run(a,o){o=o||{};var result=compile(a,o),scene=result.graph.emit(Object.assign({},o,{title:a.title}));
  if(scene.errors&&scene.errors.length)result.report.errors=result.report.errors.concat(scene.errors);
  scene.report=result.report;
  console.log('JIZURA native build report: '+JSON.stringify(result.report));
  var missKeys=Object.keys(result.report.missingRecipes||{});
  if(missKeys.length)console.warn('JIZURA: unimplemented native recipes skipped (composition still built): '+missKeys.join(', '));
  if(!o.timingPaths)console.warn('Set composition timing manually: '+a.composition.fps+' fps, 0-'+(a.composition.frameCount-1));
  return scene;
}
return {run:run,compile:compile,preflight:preflight};
})(JZNative,JZGraph,JZComponents);
