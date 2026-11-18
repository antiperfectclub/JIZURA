/* Native recipe math and rig components. Source: src/01_util.js, 05_anim.js. */
var JZRecipeTools=(function(N,C){
'use strict';
var T=Math.PI*2, D=Math.PI/180;
function clamp(x,a,b){a=a==null?0:a;b=b==null?1:b;return Math.max(a,Math.min(b,x));}
function mix(a,b,t){return a+(b-a)*t;}
function signed(){return N.random.apply(null,arguments)*2-1;}
function hash(){return Math.round(N.random.apply(null,arguments)*4294967296)>>>0;}
function random(){return N.random.apply(null,arguments);}
function rr(a,b){var args=Array.prototype.slice.call(arguments,2);return mix(a,b,N.random.apply(null,args));}
function rs(){return signed.apply(null,arguments);}
function noise(x,seed){var i=Math.floor(x),f=x-i;return mix(signed(seed,i),signed(seed,i+1),f*f*(3-2*f));}
var E={clamp:clamp,lerp:mix,inQuad:function(x){x=clamp(x);return x*x;},outQuad:function(x){x=clamp(x);return 1-(1-x)*(1-x);},inCubic:function(x){x=clamp(x);return x*x*x;},outCubic:function(x){return 1-Math.pow(1-clamp(x),3);},outQuart:function(x){return 1-Math.pow(1-clamp(x),4);},inOutCubic:function(x){x=clamp(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;},inOutSine:function(x){return .5-.5*Math.cos(Math.PI*clamp(x));},inExpo:function(x){x=clamp(x);return x<=0?0:Math.pow(2,10*(x-1));},outExpo:N.outExpo,outBack:function(x,s){x=clamp(x);s=s==null?1.9:s;return 1+(s+1)*Math.pow(x-1,3)+s*Math.pow(x-1,2);}};
function motion(c){var fx=c.assembly.style.fx||{};return fx.motion==null?.7:N.finite(fx.motion,'motion');}
function beat(c,t,period){var bs=c.assembly.beats||[],absolute=c.cut.origin/c.comp.fps+t,i=-1;for(var j=0;j<bs.length&&bs[j]<=absolute;j++)i=j;if(i<0)return {index:Math.floor(t/period),since:((t%period)+period)%period,len:period};var len=i+1<bs.length?bs[i+1]-bs[i]:i>0?bs[i]-bs[i-1]:period;return {index:i,since:absolute-bs[i],len:Math.max(.001,len)};}
function env(c,f){var t=(f-c.cut.origin)/c.comp.fps,dur=(c.cut.sourceEnd-c.cut.origin)/c.comp.fps,Q=(c.preset||{}).params||{},pOut=clamp((f-(c.cut.sourceEnd-c.cut.outFrames))/Math.max(1,c.cut.outFrames));return {t:t,lt:t,ltb:t+(Q.lag||0),pOut:pOut,dur:dur,u:clamp(t/Math.max(.3,dur)),W:c.comp.width,H:c.comp.height,seed:((c.cut.source||{}).seed||0)|0,energy:Array.isArray(c.assembly.energy)&&c.assembly.energy.length?c.assembly.energy[Math.max(0,Math.min(c.assembly.energy.length-1,Math.floor(f/c.comp.fps*(c.assembly.energyRate||1))))]:null,M:motion(c),Q:Q,beat:function(p){return beat(c,t,p);}};}
function reg(group,key,source,scope,build,differences){N.register(group,key,{source:source,scope:scope,build:build,differences:differences||[]});}
function rig(c,label,fn){var id=c.rig;C.sample(c.graph,id,c.cut.start,c.cut.end,function(f){var o=fn(env(c,f))||{},s=o.s==null?1:o.s;return {'position.x':o.x||0,'position.y':-(o.y||0),rotation:-(o.rot||0),'scale.x':s*(o.sx==null?1:o.sx),'scale.y':s*(o.sy==null?1:o.sy)};});return id;}
function camera(key,fn){reg('cam',key,'src/11p_x2_camtr.js','cut-camera',function(c){return rig(c,key,fn);});}
function rows(gs,g){return gs.filter(function(x){return x.li===g.li;});}
function bounds(gs){var xs=[],ys=[];gs.forEach(function(g){xs.push(g.x+(g.vx||0)-g.w/2,g.x+(g.vx||0)+g.w/2);ys.push(g.y+(g.vy||0)-g.h/2,g.y+(g.vy||0)+g.h/2);});return {x0:Math.min.apply(null,xs),x1:Math.max.apply(null,xs),y0:Math.min.apply(null,ys),y1:Math.max.apply(null,ys)};}
function apply(s,o){if(!o)return;if(o.hide){s.a=0;return;}s.dx+=o.dx||0;s.dy+=o.dy||0;s.rot+=o.rot||0;var k=o.s==null?1:o.s;s.sx*=k*(o.sx==null?1:o.sx);s.sy*=k*(o.sy==null?1:o.sy);s.a*=o.a==null?1:o.a;}
function motionRecipe(group,key,source,fn){reg(group,key,source,'glyph',function(c){return function(s,g,gs,f){var e=env(c,f),start=c.cut.origin+(c.node.delayFrames||0),pin=clamp((f-start)/c.cut.inFrames),pout=clamp((f-(c.cut.sourceEnd-c.cut.outFrames))/c.cut.outFrames),a=clamp((f-start-c.cut.inFrames*.85)/(c.comp.fps*.25))*(1-pout);e.size=c.node.size;e.node=c.node;e.seed=c.node.seed==null?e.seed:c.node.seed;apply(s,fn(group==='enter'?pin:group==='exit'?pout:a,g,gs,e));};});}
function mv(e,along,cross){return e.node.vertical?{dx:-cross,dy:along}:{dx:along,dy:cross};}
function order(g,gs,e){var total=Array.from(String((e.node.cutText)||e.node.text||'').replace(/\n/g,'')).length,solo=gs.length===1&&total>1;return solo?clamp((e.node.mi||0)/(total-1)):gs.length>1?g.i/(gs.length-1):0;}
return {E:E,T:T,D:D,clamp:clamp,mix:mix,signed:signed,random:random,rr:rr,rs:rs,hash:hash,hash01:function(){return N.random.apply(null,arguments);},noise:noise,noise1:noise,reg:reg,camera:camera,motion:motionRecipe,env:env,beat:beat,rows:rows,bounds:bounds,mv:mv,order:order,stagger:function(p,k,spread){return clamp((p-spread*k)/(1-spread));}};
})(JZNative,JZComponents);
