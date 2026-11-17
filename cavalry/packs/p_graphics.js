/* Geometry recipes, built in the unanimated cut's design space. */
(function(N,G,C){
'use strict';
function reg(g,k,fn){N.register(g,k,{source:'cavalry/presets.js (native geometry port)',scope:'cut',build:fn,differences:[]});}
function shape(c,name,commands,color,width,alpha){return C.shape(c.graph,c.cut,c.cut.id+' / '+name,c.parent,commands,color,width,alpha);}
function bb(c){var xs=[],ys=[];c.cut.nodes.forEach(function(n){var f=(c.options.fontOverrides||{})[n.font.key]||n.font;C.glyphs(n,f).forEach(function(g){
  var r=-(n.rotation||0)*Math.PI/180,cs=Math.cos(r),sn=Math.sin(r),sx=n.sx==null?1:n.sx;
  [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(function(z){var x=(g.x+(g.vx||0)+z[0]*g.w/2)*sx,y=-g.y-(g.vy||0)+z[1]*g.h/2;
    xs.push(n.x-c.comp.width/2+x*cs-y*sn);ys.push(c.comp.height/2-n.y+x*sn+y*cs);});
});});if(!xs.length)throw new Error('No rest geometry');return {x0:Math.min.apply(null,xs),x1:Math.max.apply(null,xs),y0:Math.min.apply(null,ys),y1:Math.max.apply(null,ys)};}
reg('layout','graphics',function(c){(c.cut.graphics||[]).forEach(function(s,i){
  if(!s||!Array.isArray(s.path))throw new Error('Malformed layout graphic '+i);
  var commands=s.path.map(function(cmd){var q=cmd.slice();for(var k=1;k<q.length;k+=2){q[k]-=c.comp.width/2;q[k+1]=c.comp.height/2-q[k+1];}return q;});
  shape(c,s.name||('Graphic '+(i+1)),commands,{fill:s.fill,stroke:s.stroke,width:s.width,alpha:s.alpha==null?1:s.alpha});
});});
reg('treat','underline',function(c){var b=bb(c),h=Math.max(4,c.comp.height*.006);shape(c,'Underline',G.rect(b.x0,b.y0-h*3,b.x1-b.x0,h),c.sc.accent);});
reg('treat','boxed',function(c){var b=bb(c),m=14;shape(c,'Box',G.rect(b.x0-m,b.y0-m,b.x1-b.x0+2*m,b.y1-b.y0+2*m),c.sc.accent,5);});
reg('treat','marker',function(c){var b=bb(c);shape(c,'Marker',G.rect(b.x0,b.y0,b.x1-b.x0,(b.y1-b.y0)*.45),c.sc.accent2||c.sc.accent,0,.45);});
reg('decor','cropMarks',function(c){var W=c.comp.width,H=c.comp.height,m=40,L=36,t=3,p=[];[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(s){var x=s[0]*(W/2-m),y=s[1]*(H/2-m);p=p.concat(G.rect(x-(s[0]>0?L:0),y-t/2,L,t),G.rect(x-t/2,y-(s[1]>0?L:0),t,L));});shape(c,'Crop marks',p,c.sc.sub);});
reg('decor','ruler',function(c){var W=c.comp.width,H=c.comp.height,p=[];for(var i=0;i<=40;i++){var x=-W/2+W*i/40,h=i%5===0?28:14;p=p.concat(G.rect(x-1,H/2-30-h,2,h));}shape(c,'Ruler',p,c.sc.sub);});
reg('bg','frame',function(c){var W=c.comp.width,H=c.comp.height,m=36;shape(c,'Frame',G.rect(-W/2+m,-H/2+m,W-2*m,H-2*m),c.sc.fg,4);});
reg('bg','split',function(c){shape(c,'Split',G.rect(-c.comp.width/2,-c.comp.height/2,c.comp.width,c.comp.height/2),c.sc.accent,0,.9);});
})(JZNative,JZGraph,JZComponents);
