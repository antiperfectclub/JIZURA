/* Layout/text/timeline components. Design coordinates are x-right/y-down. */
var JZComponents = (function(N,G){
'use strict';
function font(node,options) {
  var f=(options.fontOverrides||{})[node.font.key]||node.font;
  if(!f||!f.family||!f.style)throw new Error('Invalid font '+node.id);
  if(!cavalry.fontExists(f.family,f.style))throw new Error('Missing font '+f.family+' / '+f.style);
  return f;
}
function glyphs(node,f) {
  if(Array.isArray(node.glyphs)) {
    var joined=node.glyphs.map(function(g){return g.ch;}).join('');
    if(joined!==node.text.replace(/\n/g,''))throw new Error('Glyph payload does not preserve text '+node.id);
    return node.glyphs.map(function(g){return Object.assign({},g);});
  }
  var lines=node.text.split('\n'), lead=(node.lead||1.3)*node.size, out=[], index=0;
  lines.forEach(function(line,li){
    var chars=Array.from(line), widths=chars.map(function(ch){
      if(node.vertical&&!/[A-Za-z0-9]/.test(ch))return node.size;
      var m=cavalry.measureText(ch,f.family,f.style,node.size); return N.finite(m.width,'glyph width');
    });
    var total=widths.reduce(function(a,b){return a+b;},0)+Math.max(0,chars.length-1)*(node.track||0)*node.size;
    var at=node.vertical?(node.align==='left'?0:-total/2):(node.align==='left'?0:node.align==='right'?-total:-total/2);
    chars.forEach(function(ch,ci){
      var small='ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ'.indexOf(ch)>=0;
      var punct='、。，．'.indexOf(ch)>=0, v=node.vertical;
      out.push({ch:ch,i:index++,li:li,ci:ci,n:chars.length,x:v?-(li-(lines.length-1)/2)*lead:at+widths[ci]/2,
        y:v?at+widths[ci]/2:(li-(lines.length-1)/2)*lead,w:v?node.size:widths[ci],h:v?widths[ci]:node.size,
        vx:v?(small?.11*node.size:punct?.3*node.size:0):0,vy:v?(small?-.11*node.size:punct?-.3*node.size:0):0,
        r90:v&&('ー〜～…‥―—-()（）「」『』【】〈〉《》〔〕[]［］→←:：;；=＝'.indexOf(ch)>=0||/[A-Za-z0-9]/.test(ch)),fs:1});
      at+=widths[ci]+(node.track||0)*node.size;
    });
  }); return out;
}
function sample(g,id,start,end,fn) {
  var previous={}, pending={}, last={};
  function put(attr,f,v){g.key(id,attr,f,v,1);last[attr]=f;}
  for(var frame=start;frame<end;frame++) {
    var state=fn(frame); Object.keys(state).forEach(function(attr){
      var v=state[attr];N.finite(v,attr);
      if(!(attr in previous)){put(attr,frame,v);previous[attr]=v;pending[attr]=frame;return;}
      if(Math.abs(previous[attr]-v)>1e-9){if(pending[attr]>last[attr])put(attr,pending[attr],previous[attr]);put(attr,frame,v);previous[attr]=v;pending[attr]=frame;}
      else pending[attr]=frame;
    });
  }
}
function text(graph,cut,node,parent,options,animate) {
  var f=font(node,options), gs=glyphs(node,f), start=Math.max(cut.start,cut.origin+(node.delayFrames||0));
  if(start>=cut.end)return [];
  var place=graph.add('null',node.id+' / Placement',parent,start,cut.end,{
    position:[node.x-graph.comp.width/2,graph.comp.height/2-node.y],rotation:-(node.rotation||0),scale:[node.sx==null?1:node.sx,1]});
  var ids=[];
  gs.forEach(function(glyph,i){
    var id=graph.add('textShape',node.id+' / '+i,place,start,cut.end,{
      text:glyph.ch,font:{font:f.family,style:f.style},fontSize:node.size*(glyph.fs||1),autoWidth:true,autoHeight:true,
      horizontalAlignment:1,verticalAlignment:1,position:[glyph.x+(glyph.vx||0),-glyph.y-(glyph.vy||0)],
      rotation:glyph.r90?-90:0,scale:[1,1],fill:true,stroke:false,'material.materialColor':node.color});
    sample(graph,id,start,cut.end,function(frame){
      var s={dx:0,dy:0,rot:0,sx:1,sy:1,a:1};animate(s,glyph,gs,frame);
      return {'position.x':glyph.x+(glyph.vx||0)+s.dx,'position.y':-glyph.y-(glyph.vy||0)-s.dy,
        rotation:-(glyph.r90?90:0)-s.rot,'scale.x':s.sx,'scale.y':s.sy,alpha:N.clamp(s.a)};
    }); ids.push(id);
  }); return ids;
}
/* One editable path. `paint` is either an object {fill, stroke, width, alpha} or the legacy
   (color, width, alpha) arguments. A shape with no paint is an error, never an empty layer. */
function shape(graph,cut,name,parent,commands,paint,width,alpha) {
  var fill=null, stroke=null, w=null, a=1;
  if (paint && typeof paint==='object') {
    fill=paint.fill||null; stroke=paint.stroke||null; w=paint.width; a=paint.alpha==null?1:paint.alpha;
  } else if (width>0) { stroke=paint||null; w=width; a=alpha==null?1:alpha; }
  else { fill=paint||null; a=alpha==null?1:alpha; }
  if (!fill&&!stroke) throw new Error('Shape has no paint: '+name);
  if (stroke&&!(N.finite(w,'stroke width')>0)) throw new Error('Stroke without a positive width: '+name);
  N.finite(a,'shape alpha');
  if (!(a>0)) throw new Error('Invisible shape: '+name);
  return graph.add('path',name,parent,cut.start,cut.end,{position:[0,0],fill:!!fill,stroke:!!stroke,
    'material.materialColor':fill||stroke,'stroke.strokeColor':stroke||fill,alpha:a,'stroke.width':stroke?w:1},commands);
}
return {text:text,glyphs:glyphs,sample:sample,shape:shape};
})(JZNative,JZGraph);
