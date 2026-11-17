/* Native scalar/glyph animation recipes. Source math: src/01_util.js + src/05_anim.js. */
(function(N){
'use strict';
var cl=N.clamp, oe=N.outExpo, R=N.random, tau=Math.PI*2;
function oc(x){x=cl(x);return 1-Math.pow(1-x,3);}
function back(x){x=cl(x);return 1+3.6*Math.pow(x-1,3)+2.6*Math.pow(x-1,2);}
function bounce(x){var n=7.5625,d=2.75;if(x<1/d)return n*x*x;if(x<2/d)return n*(x-=1.5/d)*x+.75;if(x<2.5/d)return n*(x-=2.25/d)*x+.9375;return n*(x-=2.625/d)*x+.984375;}
function reg(group,name,fn){N.register(group,name,{source:'src/05_anim.js',scope:'glyph',build:function(c){
  return function(s,g,gs,f){
    var ct=c.cut, node=c.node, appear=ct.origin+(node.delayFrames||0), pin=cl((f-appear)/ct.inFrames),pout=cl((f-(ct.sourceEnd-ct.outFrames))/ct.outFrames);
    var t=(f-ct.origin)/c.comp.fps, amt=cl((f-appear-ct.inFrames*.85)/(c.comp.fps*.25))*(1-pout);
    fn(s,g,gs,group==='enter'?pin:group==='exit'?pout:amt,{time:t,seed:node.seed==null?ct.source.seed:node.seed,size:node.size,W:c.comp.width,H:c.comp.height,
      motion:c.assembly.style.fx&&c.assembly.style.fx.motion!=null?c.assembly.style.fx.motion:.7,duration:(ct.sourceEnd-ct.origin)/c.comp.fps,step:Math.floor(t*24+1e-6)});
  };},differences:['Native font metrics can differ; web glyph payload is preferred.']});}
['enter','exit'].forEach(function(group){reg(group,'cut',function(s){s.a*=1;});reg(group,'fade',function(s,g,gs,p){s.a*=group==='enter'?p:1-p;});});
reg('hold','still',function(s){s.a*=1;});
reg('enter','type',function(s,g,gs,p){if(g.i>=Math.floor(p*(gs.length+.999)))s.a=0;});
reg('enter','pop',function(s,g,gs,p,c){var d=gs.length>1?g.i/(gs.length-1)*.45:0,q=cl((p-d)/.55);if(q<=0)s.a=0;var k=back(q);s.sx*=k;s.sy*=k;s.rot+=(1-oc(q))*(R(c.seed,g.i,9)*2-1)*28;});
reg('enter','drop',function(s,g,gs,p,c){var d=gs.length>1?R(c.seed,g.i,4)*.5:0,q=cl((p-d)/.5);if(q<=0)s.a=0;s.dy-=(1-bounce(q))*c.size*2.4;s.sy*=1+(1-q)*.5;s.sx*=1-(1-q)*.2;});
reg('enter','spin',function(s,g,gs,p,c){var d=gs.length>1?g.i/(gs.length-1)*.4:0,q=cl((p-d)/.6),e=oe(q);if(q<=0)s.a=0;s.rot+=(1-e)*(R(c.seed,g.i)>.5?1:-1)*200;s.sx*=.15+.85*e;s.sy*=.15+.85*e;s.a*=Math.min(1,q*3);});
reg('enter','flicker',function(s,g,gs,p,c){if(p<1&&R(c.seed,c.step,g.i)>=p*1.25)s.a=0;});
reg('hold','jitter',function(s,g,gs,a,c){var amp=c.size*.025*a*c.motion;if(amp<.2)return;s.dx+=(R(c.seed,c.step,g.i,1)*2-1)*amp;s.dy+=(R(c.seed,c.step,g.i,2)*2-1)*amp;s.rot+=(R(c.seed,c.step,g.i,3)*2-1)*4*a;});
reg('hold','wave',function(s,g,gs,a,c){s.dy+=Math.sin(c.time*7+g.i*.75)*c.size*.07*a;s.rot+=Math.cos(c.time*7+g.i*.75)*5*a;});
reg('hold','drift',function(s,g,gs,a,c){var u=c.time/Math.max(.3,c.duration),k=1+.05*u*c.motion;s.dx+=(c.seed%2?1:-1)*(u-.5)*c.W*.035*c.motion+g.x*(k-1);s.dy+=g.y*(k-1);s.sx*=k;s.sy*=k;});
reg('hold','breathe',function(s,g,gs,a,c){var k=1+.035*Math.sin(c.time*tau*.9)*a,track=.03*Math.sin(c.time*tau*.6)*a*c.size;var row=gs.filter(function(x){return x.li===g.li;}),ix=row.indexOf(g)-(row.length-1)/2;s.dx+=g.x*(k-1)+ix*track;s.dy+=g.y*(k-1);s.sx*=k;s.sy*=k;});
reg('exit','scatter',function(s,g,gs,p,c){var d=R(c.seed,g.i,51)*.35,q=cl((p-d)/.65),e=q*q*q,ang=R(c.seed,g.i,52)*tau;s.dx+=Math.cos(ang)*c.W*.7*e;s.dy+=Math.sin(ang)*c.W*.45*e;s.rot+=(R(c.seed,g.i,53)*2-1)*540*e;s.sx*=1+e*.8;s.sy*=1+e*.8;s.a*=1-q*q;});
})(JZNative);
