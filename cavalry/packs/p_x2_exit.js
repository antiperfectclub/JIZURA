/* Native glyph exits from src/11p_x2_exA.js; no clipping/blur approximations. */
(function(R){
'use strict';
var E=R.E,cl=R.clamp,m=R.mix,st=R.stagger,T=R.T,PI=Math.PI;
var hide={hide:true};
function reg(k,fn){R.motion('exit',k,'src/11p_x2_exA.js',fn);}
function seg(x,a,b){return cl((x-a)/(b-a));}
function lr(g,gs,e){return R.order(g,gs,e);}
function ctr(g,gs,e){var u=gs.length===1?lr(g,gs,e):g.n>1?g.ci/(g.n-1):.5;return Math.abs(u-.5)*2;}
function side(g,gs,e){return Math.sign((gs.length===1?lr(g,gs,e):g.n>1?g.ci/(g.n-1):.5)-.5);}
function mk(e){return cl(.55+e.M*.65,.5,1.3);}
reg('xhCentreThin',function(p,g,gs,e){var q=st(p,ctr(g,gs,e),.5);if(q<=0)return null;if(q>=1)return hide;var a=E.inOutCubic(seg(q,0,.6)),b=E.inQuad(seg(q,.5,1));return e.node.vertical?{sy:Math.max(.03,m(1,.05,a)),sx:Math.max(.02,1-b)}:{sx:Math.max(.03,m(1,.05,a)),sy:Math.max(.02,1-b)};});
reg('xhEndsOut',function(p,g,gs,e){var q=st(p,1-ctr(g,gs,e),.62);if(q<=0)return null;if(q>=1)return hide;var sd=side(g,gs,e);if(!sd)return {s:Math.max(.01,1+Math.sin(seg(q,0,.4)*PI)*.12-E.inCubic(seg(q,.3,1))),a:1-E.inCubic(q)};var v=E.inCubic(q),o=R.mv(e,sd*v*e.size*2.6*mk(e),0);o.a=1-E.inQuad(seg(q,.35,1));if(e.node.vertical)o.sy=1+v*1.3;else o.sx=1+v*1.3;return o;});
reg('xhHopFar',function(p,g,gs,e){var q=st(p,lr(g,gs,e),.3);if(q<=0)return null;if(q>=1)return hide;var S=[1,.6,.3,.04],h=Math.min(2,Math.floor(q*3)),f=q*3-h,s=m(S[h],S[h+1],E.inOutCubic(f)),far=1-s,land=Math.max(0,1-f/.14)+Math.max(0,(f-.86)/.14),sy=1+Math.sin(f*PI)*.16-land*.2;return {s:s,sy:sy,sx:1+land*.12,dx:-g.x*far*.32,dy:-g.y*far*.32-Math.sin(f*PI)*e.size*S[h]*.85-far*e.size*.18+(1-sy)*g.h*s*.5,a:h<2?1:1-E.inQuad(seg(f,.3,1))};});
reg('xhCoinSpin',function(p,g,gs,e){var q=st(p,lr(g,gs,e),.4);if(q<=0)return null;if(q>=1)return hide;var c=Math.cos(q*q*T*2.25),sp=(c<0?-1:1)*Math.max(.03,Math.abs(c)),o={s:Math.max(.01,1-E.inCubic(q)),dy:-(1.5*q-.5*q*q)*e.size*.9,a:1-E.inCubic(seg(q,.6,1))};if(e.node.vertical&&!g.r90)o.sy=sp;else o.sx=sp;return o;});
reg('xhPageTurn',function(p,g,gs,e){var q=st(p,lr(g,gs,e),.62);if(q<=0)return null;if(q>=1)return hide;var th=E.inOutCubic(q)*PI,c=Math.cos(th),s=(c<0?-1:1)*Math.max(.03,Math.abs(c)),a=th<PI/2?1:1-seg(th,PI*.5,PI*.92);if(a<=.003)return hide;return e.node.vertical&&!g.r90?{sy:s,dy:-(1-c)*g.h*.5,a:a}:{sx:s,dx:-(1-c)*g.w*.5,sy:1+Math.sin(th)*.08,a:a};});
reg('xhTiltSlide',function(p,g,gs,e){var dir=JZNative.random(e.seed,111,5)<.5?-1:1,k=dir>0?lr(g,gs,e):1-lr(g,gs,e),t=st(seg(p,0,.5),1-k,.55),q=st(seg(p,.3,1),1-k,.45);if(t<=0)return null;if(q>=1)return hide;var d=E.inQuad(q)*Math.max(e.W,e.H)*.55*mk(e);return {rot:dir*22*E.outBack(t,2.6),dx:dir*Math.cos(22*R.D)*d,dy:Math.sin(22*R.D)*d,a:1-E.inQuad(seg(q,.45,1))};});
reg('xhStairs',function(p,g,gs,e){var n=Math.max(2,gs.length),step=Math.min(e.size*.24,e.size*2.2/n),x=seg(p,0,.42)*(n-1),fk=Math.floor(x),v=fk+E.outBack(seg(x-fk,0,.7),2.2),ci=lr(g,gs,e)*(n-1),down=step*Math.min(ci,v),q=st(seg(p,.36,1),1-ci/(n-1),.4);if(q>=1)return hide;var d=E.inQuad(q)*e.size*4.2*mk(e),o=e.node.vertical?{dx:-down-d*.5,dy:d}:{dx:d,dy:down+d*.5};o.rot=q>0?Math.min(1,q*4)*(e.node.vertical?-10:10):0;o.a=1-E.inQuad(seg(q,.4,1));return o;});
reg('xhStomp',function(p,g,gs,e){var k=lr(g,gs,e),q=st(p,k,.55);if(q>=1)return hide;var dk=1/Math.max(1,gs.length-1),qp=st(p,k-dk,.55),jt=k-dk>=-1e-6?seg(qp,.26,.56):0,jolt=jt>0&&jt<1&&q<.26?Math.sin(jt*PI)*(1-jt)*e.size*.12:0;if(q<=0)return jolt?{dy:-jolt}:null;var hit=E.inCubic(seg(q,0,.26)),wob=seg(q,.26,.5),back=E.inQuad(seg(q,.5,1)),sy=Math.max(.035,m(1,.07,hit)),sx=(1+hit*.5-Math.sin(wob*PI)*.08*(q>.26?1:0))*(1-back);if(sx<=.01)return hide;return {sx:sx,sy:sy,dy:(1-sy)*g.h*.5-jolt,a:1-E.inCubic(seg(q,.8,1))};});
})(JZRecipeTools);
