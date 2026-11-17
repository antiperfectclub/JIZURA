/* Native hold recipes that are not already in p_motion.js. A hold is a glyph sampler, never a host
   read-modify-write pass: the glyph transform track already exists, so the hold only adds to it.
   Source math: ae/p_x2_hold.jsx: xkTallBreath. */
(function (N) {
'use strict';
var cl=N.clamp;
N.register('hold','xkTallBreath',{
  source:'ae/p_x2_hold.jsx: xkTallBreath',
  scope:'glyph',
  differences:['The web recipe pivots on a measured text bbox; this port pivots on each glyph box.',
    'Vertical text scales around the glyph centre, horizontal text around the glyph baseline.'],
  hostVerified:false,
  build:function(c){
    var motion=c.assembly.style.fx&&c.assembly.style.fx.motion;
    motion=motion==null?.7:motion;
    return function(s,g,gs,f){
      var ct=c.cut,node=c.node,appear=ct.origin+(node.delayFrames||0);
      if(f<appear)return;
      var t=(f-ct.origin)/c.comp.fps;
      var po=cl((f-(ct.sourceEnd-ct.outFrames))/ct.outFrames);
      var amt=cl((f-appear-ct.inFrames*.85)/(.25*c.comp.fps))*(1-po);
      var u=(((t/3.8)%1)+1)%1;
      var w=u<.62?-(Math.cos(Math.PI*u/.62)-1)/2:1+(Math.cos(Math.PI*(u-.62)/.38)-1)/2;
      var k=1+.1*w*amt*Math.max(0,Math.min(1.6,motion/.7));
      if(node.vertical){s.sx*=k;}
      else{s.sy*=k;s.dy+=(k-1)*g.h/2;}
    };
  }
});
})(JZNative);
