/* Hold execution is installed after runtime.js by the builder. */
(function(P){
'use strict';
function cl(x){return Math.max(0,Math.min(1,x));}
P.register('hold','still',function(c){
  if(api.getInFrame(c.text)>c.cut.end-1||api.getOutFrame(c.text)<c.cut.start)throw new Error('Still text is outside its cut');
},{source:'src/05_anim.js: still (clip-based identity)',hostVerified:false});
P.register('hold','xkTallBreath',function(c){
  var id=c.text,cut=c.cut,node=c.node,comp=c.comp,frame=api.getFrame();
  api.setFrame(Math.max(cut.start,cut.origin+node.delayFrames));
  var b=api.getBoundingBox(id,false),parent=api.getParent(id),rest={
    position:[api.get(id,'position.x'),api.get(id,'position.y')],
    scale:[api.get(id,'scale.x'),api.get(id,'scale.y')],rotation:api.get(id,'rotation')};
  [b.centre.x,b.centre.y,b.width,b.height,rest.position[0],rest.position[1],rest.scale[0],rest.scale[1],rest.rotation].forEach(P.finite);
  var place=P.nullLayer(node.id+' / Hold Placement',parent,cut),hold=P.nullLayer(node.id+' / Tall Breath',place,cut);
  api.set(place,rest);api.parent(id,hold);api.set(id,{position:[0,0],scale:[1,1],rotation:0});
  var px=b.centre.x,py=node.vertical?b.centre.y:b.centre.y-b.height/2,motion=c.assembly.style.fx&&c.assembly.style.fx.motion;
  motion=motion==null?.7:motion;
  for(var f=Math.max(cut.start,cut.origin+node.delayFrames);f<cut.end;f++){
    var t=(f-cut.origin)/comp.fps,po=cl((f-(cut.sourceEnd-cut.outFrames))/cut.outFrames),amt=cl((f-cut.origin-node.delayFrames-cut.inFrames*.85)/(.25*comp.fps))*(1-po);
    var u=((t/3.8)%1+1)%1,w=u<.62?-(Math.cos(Math.PI*u/.62)-1)/2:1+(Math.cos(Math.PI*(u-.62)/.38)-1)/2;
    var k=1+.1*w*amt*Math.max(0,Math.min(1.6,motion/.7)),sx=node.vertical?k:1,sy=node.vertical?1:k;
    P.key(hold,f,{'scale.x':sx,'scale.y':sy,'position.x':(1-sx)*px,'position.y':(1-sy)*py});
  }
  api.setFrame(frame);
},{source:'ae/p_x2_hold.jsx: xkTallBreath',hostVerified:false,differences:['Legacy runtime still lays vertical text horizontally; vertical typesetting is not fixed by this hold pack.']});
P.applyHolds=function(a,result){
 var byName={};result.layerIds.forEach(function(id){byName[api.getNiceName(id)]=id;});
 a.cuts.forEach(function(cut){var p=cut.presets&&cut.presets.hold;if(!p)return;if(typeof p==='string')p={name:p,params:{}};
  var key='hold:'+p.name,r=P.resolve('hold',p.name);if(!r){result.report.missing[key]=1;return;}
  try{cut.nodes.forEach(function(node){var text=byName[node.id];if(text)r.fn({assembly:a,comp:a.composition,cut:cut,node:node,text:text,preset:p});});result.report.built[key]=1;}
  catch(e){result.report.errors.push(key+': '+e.message);}
 });
};
})(JZPack);
