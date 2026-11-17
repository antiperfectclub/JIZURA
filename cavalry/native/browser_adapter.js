/* Keep the existing export controls, but use the native registry, glyph payload and audit. */
(function(C){
'use strict';
var previous=C.assemble;
C.assemble=function(input){
  var out=previous(Object.assign({},input,{strict:false})), plan=input.plan, offset=out.audioOffset||0, fps=out.composition.fps;
  out.version=3;out.buildId=C.buildInfo.buildId;out.nativeManifest=C.buildInfo.recipes;
  out.events=JSON.parse(JSON.stringify(plan.events||[])).map(function(e){e.t-=offset;return e;});
  out.beats=(plan.beats||[]).map(function(t){return t-offset;});out.typeset=!!plan.typeset;
  var oldLang=J.lang,oldTypeset=J.TYPESET;
  try {
    if(J.setLang)J.setLang(plan.lang||'ja');if(J.setTypeset)J.setTypeset(plan.typeset);
    out.cuts.forEach(function(c){
      var index=Number(c.id.slice(4)),original=plan.cuts[index];
      c.source.text=original.text;c.source.lineText=original.lineText;c.source.note=original.note;
      /* Text nodes already carry final glyph geometry, and auxiliary rules/plates travel as cut.graphics.
         One layout recipe therefore resolves the whole layout: 'graphics'. */
      c.layoutInstruction={name:'graphics'};
      if(!Array.isArray(c.graphics))c.graphics=[];
      ['enter','hold','exit'].forEach(function(k){var old=c.presets[k];c.presets[k]={name:typeof old==='string'?old:old&&old.name,params:original[k+'P']||{}};});
      c.nodes.forEach(function(n,i){
        n.seed=(original.seed|0)+i*101;
        n.glyphs=Array.from(J.layoutText({text:n.text,font:n.font.key,size:n.size,track:n.track,lead:n.lead,vertical:n.vertical,align:n.align}));
      });
    });
  } finally {if(J.setLang)J.setLang(oldLang);if(J.setTypeset)J.setTypeset(oldTypeset);}
  var report=JZCavalry.preflight(out);
  out.nativeReport=report;
  /* The page classifies every requested preset name; the host lists it per cut. Only a name the page did
     not predict is news, so the same miss is not printed twice. */
  var predicted=out.presetReport&&out.presetReport.missing||{};
  report.missing.forEach(function(r){
    var key=r.group+':'+r.name;
    if(!predicted[key])out.blockingWarnings.push(key+' ['+r.cut+'] has no native builder');
  });
  out.blockingWarnings=[].concat.apply([],out.blockingWarnings.map(function(w){return String(w).split('\n');}));
  out.blockingWarnings=out.blockingWarnings.filter(function(w,i,a){return a.indexOf(w)===i;});
  out.warnings=out.hostChecks.concat(out.approxWarnings,out.blockingWarnings);
  if(input.strict&&out.blockingWarnings.length)throw new Error(out.blockingWarnings.join('\n'));
  return out;
};
C.CAPABILITIES=Object.assign({},C.CAPABILITIES,{nativeManifest:C.buildInfo.recipes,shapes:true,text:['multiline','vertical','tracking','leading'],hostVerified:false});
})(J.Cavalry);
