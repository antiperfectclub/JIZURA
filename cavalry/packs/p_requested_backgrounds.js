/* Native backgrounds. Reference formulas: ae/p_bg3.jsx and ae/p_x2_bg1.jsx/ae/p_x2_bg2.jsx. */
(function (N, G, C, R, V) {
'use strict';
function register(key, build, differences) {
  N.register('bg', key, {source:'AE background recipe '+key, scope:'cut', build:build, differences:differences});
}
function num(p,k,d) { return N.finite(p[k]==null?d:p[k],k); }
function clock(c,key,P) {
  var cut=c.cut, fps=c.comp.fps, origin=cut.origin, cuts=c.assembly.cuts;
  var i=cuts.findIndex(function(row){return row.id===cut.id;});
  while (--i>=0) {
    var prev=cuts[i], bg=prev.presets&&prev.presets.bg;
    if (!bg || bg.name!==key || (bg.params||{}).seed!==P.seed || Math.abs(prev.sourceEnd-origin)/fps>=.06) break;
    origin=prev.origin;
  }
  return {time:function(f){return f/fps;}, enter:function(f){return R.E.outCubic((f-origin)/fps/.9);}};
}
function fill(c,label,cmds,color,alpha) {
  return C.shape(c.graph,c.cut,c.cut.id+' / '+label,c.parent,cmds,{fill:color,alpha:alpha});
}
function luminance(hex) {
  var h=String(hex||'#000').replace(/^#/,'');
  if(h.length===3) h=h.replace(/./g,function(ch){return ch+ch;});
  var n=parseInt(h.slice(0,6),16);
  return ((n>>16&255)*.2126+(n>>8&255)*.7152+(n&255)*.0722)/255;
}
register('xpRingDots',function(c){
  var P=c.preset.params||{}, W=c.comp.width,H=c.comp.height,U=Math.min(W,H), timer=clock(c,'xpRingDots',P);
  var k=num(P,'k',.15),cy=num(P,'cy',.5),speed=num(P,'spd',6),rings=Math.min(9,Math.ceil(Math.hypot(W,H)/(2*U*.135)));
  for(var ring=0;ring<rings;ring++) (function(r){
    var radius=U*(.16+.135*r), count=8+8*r, path=[];
    for(var i=0;i<count;i++){
      var angle=i*2*Math.PI/count, size=U*(i%4===0?.01:.0055);
      path=path.concat(G.ellipse(Math.cos(angle)*radius,-Math.sin(angle)*radius,size,size));
    }
    var id=fill(c,'Ring dots '+r,path,c.sc.fg,k);
    V.animate(c,id,function(e,f){
      var q=timer.enter(f),scale=.8+.2*q;
      return {'position.y':H*(.5-cy),'scale.x':scale,'scale.y':scale,
        rotation:-timer.time(f)*speed/(1+r*.6)*(r%2?-1:1),alpha:k*q};
    });
  })(ring);
},['Repeated dots are editable paths rather than AE repeaters.']);

register('skyline',function(c){
  var P=c.preset.params||{}, W=c.comp.width,H=c.comp.height,U=Math.min(W,H),px=U/1080, timer=clock(c,'skyline',P);
  var seed=num(P,'seed',1), k=num(P,'k',.09),dir=num(P,'dir',1),win=num(P,'win',.28);
  if (Math.abs(dir)>1 || win<0 || win>1) throw new Error('Invalid skyline direction or window probability');
  var T0=timer.time(c.cut.origin),T1=T0+c.comp.frameCount/c.comp.fps,Tm=(T0+T1)/2,L=Math.max(W,H)*1.5;
  var lum=luminance(c.sc.bg),dark=lum<.45,glowColor=dark?[c.sc.accent,c.sc.accent2,c.sc.ghostA,c.sc.ghostB,c.sc.fg].find(function(col){return col&&luminance(col)>lum+.25;})||c.sc.fg:c.sc.accent;
  var bands=24, dy=H*.5/bands;
  for(var i=0;i<bands;i++) (function(j){
    var u=(j+.5)/bands, alpha=(dark?.1:.08)*u*u*(3-2*u);
    var id=fill(c,'Skyline horizon '+j,G.rect(-W/2,-(j+1)*dy,W,dy),glowColor,alpha);
    V.animate(c,id,function(e,f){return {alpha:alpha*timer.enter(f)};});
  })(i);
  [[.6,.12,.34,.012],[1.1,.06,.20,.03]].forEach(function(l,j){
    var sp=U*l[3]*dir, first=c.cut.start*sp/c.comp.fps,last=(c.cut.end-1)*sp/c.comp.fps;
    var lo=Math.min(first,last),hi=Math.max(first,last),o0=T0*sp,city=[],windows=[],x=0,cw=U*.022,ch=U*.03;
    for(var b=0;b<80&&x<L;b++){
      function rand(salt){return N.random(seed,j,b,salt);}
      var w=U*(.05+.07*rand(1)),gap=U*.012*rand(2),h=H*(l[1]+(l[2]-l[1])*rand(3))*(W<H?.75:1);
      var top=h-H/2,tier=rand(4)<.35,ant=rand(5)<.25;
      for(var r=Math.ceil((lo-x-w)/L);r<=Math.floor((hi+W-x)/L);r++){
        var left=x+r*L-o0-W/2;
        city=city.concat(G.rect(left,-H/2-2*px,w,h+2*px));
        if(tier) city=city.concat(G.rect(left+w*.2,top-px,w*.6,h*.12+px));
        if(ant) city=city.concat(G.rect(left+w*.5-px,top+h*(tier?.12:0),Math.max(1.5*px,U*.002),h*.2));
        var nx=Math.floor((w-cw*.4)/cw),ny=Math.min(30,Math.floor((h-ch)/ch));
        for(var wy=0;wy<ny;wy++) for(var wx=0;wx<nx;wx++){
          var ph=Math.floor(Tm*.25+N.random(seed,j,b,wx,wy)*7);
          if(N.random(seed+ph,j*97+b,wx,wy)>win) continue;
          windows=windows.concat(G.rect(left+(w-nx*cw)/2+wx*cw+cw*.3,top-ch*(.7+wy+.45),cw*.4,ch*.45));
        }
      }
      x+=w+gap;
    }
    var ids=[fill(c,'Skyline buildings '+j,city,c.sc.fg,k*l[0])];
    if(windows.length) ids.push(fill(c,'Skyline windows '+j,windows,c.sc.accent2||c.sc.accent,j?.8:.5));
    ids.forEach(function(id){V.animate(c,id,function(e,f){return {'position.x':o0-timer.time(f)*sp,'position.y':-(1-timer.enter(f))*H*.25};});});
  });
},['The transparent horizon is approximated with 24 editable opacity bands, not AE mask feathering.',
  'Building and window paint is kept transparent instead of compositing the scheme background into the fill.',
  'Absolute phase is on the exported assembly timeline.']);
})(JZNative,JZGraph,JZComponents,JZRecipeTools,JZRecipeComponents);
