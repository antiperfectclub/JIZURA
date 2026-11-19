#!/usr/bin/env python3
'''Apply the single-file JIZURA Cavalry build and import fixes to feature/cavalry-export.'''
import argparse
from pathlib import Path
import os
import shutil
import subprocess
import sys
import tempfile


def swap(s, old, new):
    if s.count(old) != 1:
        raise ValueError('Unexpected branch source around: '+repr(old[:105]))
    return s.replace(old, new, 1)


def block(s, begin, end, replacement):
    i = s.index(begin)
    return s[:i] + replacement + s[s.index(end, i):]


def build(s):
    s=swap(s,'Build the standalone Cavalry plugin and identical web payload; AE is read-only.', 'Build dist/JIZURA_CV.js only; AE and Web Editor files are read-only.')
    s=swap(s,"'cavalry/browser.js','cavalry/native/browser_adapter.js','cavalry/panel.js','VERSION'", "'cavalry/panel.js','VERSION'")
    s=swap(s,"('cavalry/build.json','cavalry/bridge.js','cavalry/loader.js')", "('cavalry/build.json',)")
    s=swap(s,"runtime_names+['cavalry/browser.js','cavalry/native/browser_adapter.js','cavalry/panel.js']", "runtime_names+['cavalry/panel.js']")
    s=swap(s,"'cavalry/tools/test_requested_native.js')],cwd=root,text=True", "'cavalry/tools/test_requested_native.js'),'--bundle-stdin'],cwd=root,input=body,text=True")
    s=swap(s,"if graph_tests.get('requestedRecipeGraphCompilation')!='passed':", "if any(graph_tests.get(k)!='passed' for k in ('requestedRecipeGraphCompilation','partialImport')):")
    s=block(s,"    panel=text.get('cavalry/bridge.js'",'    if protected(root)!=before',r'''    standalone=runtime+'\n'+text['cavalry/panel.js']+'\n'
    run_node(node,standalone,'dist/JIZURA_CV.js',check=True)
    outputs={'dist/JIZURA_CV.js':standalone}
''')
    return swap(s,"print('Host/render verification pending; coverage is in build-report.json');return 0", "print('dist/JIZURA_CV.js; coverage embedded, host/render verification pending');return 0")


def graph(s):
    s=swap(s,'  this.validate(); options=options||{};', '  options=options||{};')
    s=swap(s,"compId=api.createComp(options.title||'JIZURA'); created.push(compId); api.setActiveComp(compId);", "compId=api.createComp(options.title||'JIZURA');\n    if(!compId)throw new Error('Cavalry did not create a composition');\n    created.push(compId); api.setActiveComp(compId);\n    if(api.getActiveComp()!==compId)throw new Error('Cavalry did not activate the new composition');")
    s=block(s,"  try { api.set(compId,{'resolution.x'",'\n  this.layers.forEach(function(n){',r'''  function issue(kind,label,error) {
    errors.push({kind:kind,label:label,message:String(error&&error.message||error)});
  }
  function has(id,attr) { return typeof api.hasAttribute!=='function'||api.hasAttribute(id,attr); }
  var t=options.timingPaths||{fps:'fps',start:'startFrame',end:'endFrame'};
  [['resolution.x',this.comp.width],['resolution.y',this.comp.height],
   [t.fps,this.comp.fps],[t.start,0],[t.end,this.comp.frameCount-1]].forEach(function(pair){
    if(!pair[0])return;
    try{
      if(!has(compId,pair[0]))throw new Error('Attribute unavailable');
      var data={};data[pair[0]]=pair[1];api.set(compId,data);
      var actual=api.get(compId,pair[0]);
      if(typeof actual!=='number'||!isFinite(actual)||Math.abs(actual-pair[1])>0.001)
        throw new Error('Expected '+pair[1]+', got '+actual);
    }catch(error){issue('composition',pair[0],error);}
  });
''')
    s=swap(s,"      id=n.type==='path'?", "      check(n.attrs);\n      id=n.type==='path'?")
    s=swap(s,"      map[n.id]=id; created.push(id);", "      if(!id)throw new Error('Host rejected layer type '+n.type);\n      map[n.id]=id;")
    s=swap(s,'      api.set(id,attrs);',r'''      if(n.type==='textShape') {
        var text=attrs.text, face=attrs.font;
        delete attrs.text; delete attrs.font;
        api.set(id,{text:text});
        var actual=api.get(id,'text');
        if(actual!==text)throw new Error('Unicode readback mismatch: '+n.name+' expected '+codepoints(text)+' got '+codepoints(actual));
        Object.keys(attrs).forEach(function(attr){
          try{
            if(!has(id,attr))throw new Error('Attribute unavailable');
            var data={};data[attr]=attrs[attr];
            if(api.set(id,data)===false)throw new Error('Attribute write rejected');
          }catch(error){issue('text-attribute',n.name+' / '+attr,error);}
        });
        if(face)try{
          if(!has(id,'font')||api.set(id,{font:face})===false)throw new Error('Font write rejected');
          var applied=api.get(id,'font');
          if(applied&&typeof applied==='object'){
            var family=applied.font||applied.family;
            if((typeof family==='string'&&family!==face.font)||(typeof applied.style==='string'&&applied.style!==face.style))
              throw new Error('Host substituted a different font');
          }
        }catch(error){
          issue('font-write',n.name,error);
          try{if(typeof api.resetAttribute==='function'&&has(id,'font'))api.resetAttribute(id,'font');}
          catch(resetError){issue('font-reset',n.name,resetError);}
        }
      }else if(Object.keys(attrs).length)api.set(id,attrs);''')
    s=block(s,"      if(n.type==='textShape'&&api.get(id,'text')",'      Object.keys(n.keys)', '')
    s=swap(s,'        Object.keys(n.keys[attr]).map(Number).sort(function(a,b){return a-b;}).forEach(function(f){', '        compactTrack(n.keys[attr]).forEach(function(f){')
    s=swap(s,"          api.keyframe(id,f,data); meta[attr==='alpha'?'opacity':attr]={frame:f,type:k.type}; api.modifyKeyframe(id,meta);", r'''          try{
            if(!has(id,attr==='alpha'?'opacity':attr))throw new Error('Attribute unavailable');
            if(api.keyframe(id,f,data)===false)throw new Error('Keyframe write rejected');
            meta[attr==='alpha'?'opacity':attr]={frame:f,type:k.type};api.modifyKeyframe(id,meta);
          }catch(error){issue('keyframe',n.name+' / '+attr+' @ '+f,error);}''')
    s=swap(s,'function codepoints(s)',r'''/* Collinear linear samples share a segment. Keep hold/Bezier keys and endpoints. */
function compactTrack(track){
  var frames=Object.keys(track).map(Number).sort(function(a,b){return a-b;}), out=[];
  for(var i=0;i<frames.length;i++){
    var f=frames[i];out.push(f);
    if(out.length<3)continue;
    var a=out[out.length-3], b=out[out.length-2], u=track[a],v=track[b],w=track[f];
    if(u.type!==1||v.type!==1||w.type!==1||[u,v,w].some(function(k){return typeof k.value!=='number'||!isFinite(k.value);}))continue;
    var good=true;
    for(var j=i-1;j>=0&&frames[j]>a;j--){
      if(i-j>128){good=false;break;}
      var k=frames[j], x=u.value+(w.value-u.value)*(k-a)/(f-a);
      if(!isFinite(x)||Math.abs(track[k].value-x)>1e-9){good=false;break;}
    }
    if(good){out.pop();out.pop();out.push(f);}
  }
  return out;
}
function codepoints(s)''')
    s=swap(s,"        full=api.get(id,'opacity'); N.finite(full,'native opacity');\n        if(!(full>0))throw new Error('Invalid native opacity range');\n        if(n.attrs.alpha!=null)api.set(id,{opacity:full*n.attrs.alpha});", r'''        try{
          if(!has(id,'opacity'))throw new Error('Opacity attribute unavailable');
          full=api.get(id,'opacity');N.finite(full,'native opacity');
          if(!(full>0))throw new Error('Invalid native opacity range');
          if(n.attrs.alpha!=null)api.set(id,{opacity:full*n.attrs.alpha});
        }catch(error){full=null;issue('opacity',n.name,error);}''')
    s=swap(s,"        compactTrack(n.keys[attr]).forEach(function(f){","        if(attr==='alpha'&&full===null)return;\n        compactTrack(n.keys[attr]).forEach(function(f){")
    return swap(s,'rootId:ids[0],layerIds:ids,errors:errors',"rootId:ids[0],layerIds:ids,textLayerCount:this.layers.filter(function(n){return n.type==='textShape'&&map[n.id];}).length,errors:errors")


def components(s):
    # Prefer configured fonts and known CJK fallbacks, not the first installed family.
    s=block(s,'function familiesOf(){','function exists(', '')
    return swap(s,'    familiesOf().slice(0,48).forEach(function(f){add(f);});',r'''    if(/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/.test(node.text||''))
      ['Noto Sans KR','Noto Sans CJK KR','Apple SD Gothic Neo','Malgun Gothic'].forEach(add);
    else if(/[\u3040-\u30ff]/.test(node.text||''))
      ['Noto Sans JP','Noto Sans CJK JP','Hiragino Sans','Yu Gothic','Meiryo'].forEach(add);''')


def assembly(s):
    s=swap(s,"if(typeof n.text!=='string'||!n.font)throw new Error('Invalid text node');", "if(typeof n.text!=='string')throw new Error('Invalid text node');")
    s=swap(s,'  var fx=a.style.fx||{};', "  a.cuts.forEach(function(c){c.nodes.forEach(function(n){if(!n.font)n.font={};});});\n  var fx=a.style.fx||{};")
    s=swap(s,'delete fallback.glyphs;fallback.font=null;', 'delete fallback.glyphs;delete fallback._jzComet;fallback.font=null;')
    s=swap(s,'ids=C.text(graph,cut,fallback,cam,options,animate);','ids=C.text(graph,cut,fallback,cam,options,function(){});')
    s=swap(s,'  graph.validate();report.built=','  if(options.strict)graph.validate();report.built=')
    return swap(s,"  if(!o.timingPaths)console.warn('Set composition timing manually: '+a.composition.fps+' fps, 0-'+(a.composition.frameCount-1));\n", '')


def recipe_components(s):
    return block(s,'function font(c, node) {','\nfunction glyphs(c, node)', '''function font(c,node) {
  return C.font(node,c.options||{});
}
''')


def backgrounds(s):
    s=swap(s,"    V.animate(c,id,function(e,f){\n      var q=timer.enter(f),scale=.8+.2*q;\n      return {'position.y':H*(.5-cy),'scale.x':scale,'scale.y':scale,\n        rotation:-timer.time(f)*speed/(1+r*.6)*(r%2?-1:1),alpha:k*q};\n    });",r'''    var node=c.graph.byId[id], start=c.cut.start, end=c.cut.end-1;
    var turn=function(f){return -timer.time(f)*speed/(1+r*.6)*(r%2?-1:1);};
    node.attrs.position=[0,H*(.5-cy)];
    node.attrs.rotation=turn(start);
    if(end>start&&speed!==0){
      c.graph.key(id,'rotation',start,turn(start),1);
      c.graph.key(id,'rotation',end,turn(end),1);
    }
    V.animate(c,id,function(e,f){
      var q=timer.enter(f),scale=.8+.2*q;
      return {'scale.x':scale,'scale.y':scale,alpha:k*q};
    });''')
    return swap(s, "['Repeated dots are editable paths rather than AE repeaters.']", "['One editable compound path per ring; linear rotation uses two endpoint keys.']")


PANEL = r'''/* Standalone JIZURA Cavalry importer: local JSON, no companion script. */
(function(){
  'use strict';
  if(typeof ui==='undefined'||typeof api==='undefined'||typeof JZCavalry==='undefined')return;
  ui.setTitle('JIZURA CV');
  var status=new ui.Label('JIZURA에서 내보낸 Cavalry JSON을 선택하세요.');
  var button=new ui.Button('JSON으로 컴포지션 만들기');
  button.onClick=function(){
    try{
      var folder='';
      try{folder=api.getFolderFromPath(api.getSceneFilePath()||'')||'';}catch(ignored){}
      var file=api.presentOpenFile(folder,'JIZURA Cavalry JSON','JIZURA Assembly (*.json)');
      if(!file)return;
      var input=JSON.parse(api.readFromFile(file).replace(/^\uFEFF/,''));
      if(!input||input.format!=='jizura.cavalry.assembly')throw new Error('Web Editor에서 Cavalry용 JSON으로 내보내세요.');
      var scene=JZCavalry.run(input,{}), r=scene.report;
      var missing=Object.keys(r.missingRecipes||{}).length, fonts=(r.fontFallbacks||[]).length;
      var expected=input.cuts.some(function(c){return c.nodes.some(function(n){return !!n.text.trim();});});
      var mode=expected&&!scene.textLayerCount?'텍스트 생성 실패 — 콘솔 확인':
        (missing||fonts||r.errors.length?'일부 대체/누락 — 콘솔 확인':'가져오기 완료');
      status.setText(mode+' / 텍스트 레이어 '+scene.textLayerCount+' / 전체 '+scene.layerIds.length+
        ' / 미지원 '+missing+' / 폰트 대체 '+fonts+' / 오류 '+r.errors.length);
    }catch(error){
      status.setText('실패: '+String(error&&error.message||error));
      console.error('JIZURA: '+String(error&&error.stack||error));
    }
  };
  ui.add(status);ui.add(button);ui.addStretch();ui.show();
})();
'''


def tests(s):
    s=swap(s,'for (const file of natives.concat',"if (process.argv.includes('--bundle-stdin')) {\n  vm.runInContext(fs.readFileSync(0,'utf8'),sandbox,{filename:'bundle-runtime.js',timeout:10000});\n} else for (const file of natives.concat")
    s=swap(s,"if (failText && type === 'textShape')", "if (failText && type === 'textShape' && name === 'text-0 / 0')")
    s=block(s,'function runWith(','const report = {',r'''function runWith({ fontOk = () => true, failText = false, rejectFont = false,
  missingFont = false, badGlyphs = false, rejectKey = false } = {}) {
  const host = hostApi(failText);
  const previousApi = sandbox.api, previousCavalry = sandbox.cavalry, previousConsole = sandbox.console;
  if (rejectFont) {
    const set = host.api.set;
    host.api.set = (id, values) => {
      if (values.font) throw new Error('host rejects font despite positive fontExists');
      return set(id, values);
    };
  }
  if (rejectKey) host.api.keyframe = () => { throw new Error('host rejects keyframe'); };
  sandbox.api = host.api; sandbox.console = {log() {}, warn() {}, error() {}};
  sandbox.cavalry = Object.assign({}, previousCavalry, {Path: MockPath, fontExists: fontOk});
  try {
    const input = assembly();
    if (missingFont) delete input.cuts[0].nodes[0].font;
    if (badGlyphs) input.cuts[0].nodes[0].glyphs = [{ch:'wrong'}];
    const scene = sandbox.JZCavalry.run(input, {});
    assert(host.layers.has(scene.compositionId));
    const settings = host.layers.get(scene.compositionId).attrs;
    assert.strictEqual(settings.fps, 24);
    assert.strictEqual(settings.startFrame, 0);
    assert.strictEqual(settings.endFrame, 95);
    const text = i => [...host.layers.values()].filter(l => l.type === 'textShape' && l.name.startsWith(`text-${i} / `))
      .map(l => l.attrs.text).join('');
    assert.strictEqual(text(1), '透明なまま');
    assert.strictEqual(text(0), failText ? '明なまま' : '透明なまま');
    assert.strictEqual(scene.textLayerCount, failText ? 9 : 10);
    checks += 7;
    return scene.report;
  } finally {sandbox.api = previousApi; sandbox.cavalry = previousCavalry; sandbox.console = previousConsole;}
}
assert(runWith({fontOk: () => false}).fontFallbacks.length > 0);
assert(runWith({missingFont: true}).fontFallbacks.length > 0);
assert(runWith({rejectFont: true}).errors.some(e => e.kind === 'font-write'));
assert(runWith({failText: true}).errors.some(e => e.kind === 'layer'));
assert(runWith({badGlyphs: true}).errors.some(e => e.kind === 'text'));
assert(runWith({rejectKey: true}).errors.some(e => e.kind === 'keyframe'));
checks += 6;

''')
    return swap(s,'  inputMutation:',"  partialImport: 'passed',\n  inputMutation:")


EDITS = {
    'build_cavalry.py': build,
    'cavalry/native/10_graph.js': graph,
    'cavalry/native/20_components.js': components,
    'cavalry/native/30_assembly.js': assembly,
    'cavalry/native/26_recipe_components.js': recipe_components,
    'cavalry/packs/p_requested_backgrounds.js': backgrounds,
    'cavalry/panel.js': lambda s: swap(s, s, PANEL) if 'JZBridge.start' in s else s,
    'cavalry/tools/test_requested_native.js': tests,
}


def write(path, data):
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as stream:
        tmp=Path(stream.name)
        stream.write(data)
    try:
        os.chmod(tmp,path.stat().st_mode & 0o777)
        os.replace(tmp,path)
    finally:
        tmp.unlink(missing_ok=True)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=Path.cwd())
    parser.add_argument('--apply',action='store_true',help='Modify the worktree and build; restore edits if build fails')
    args=parser.parse_args()
    root=args.root.resolve()
    node=shutil.which('node')
    if not node: raise ValueError('Node.js is required')
    before={}; after={}
    for name,edit in EDITS.items():
        path=root/name
        if path.resolve()!=path or not path.is_file(): raise ValueError('Missing or symlinked source: '+name)
        raw=path.read_bytes(); src=raw.decode('utf-8-sig').replace('\r\n','\n')
        before[path]=raw; after[path]=edit(src).encode('utf-8')
    compile(after[root/'build_cavalry.py'],'build_cavalry.py','exec')
    for path,data in after.items():
        if path.suffix=='.js': subprocess.run([node,'--check'],input=data,check=True)
    for path in after:
        if before[path]!=after[path]: print(path.relative_to(root),flush=True)
    if not args.apply: return
    written=[]
    try:
        for path,data in after.items():
            if before[path]==data: continue
            if path.read_bytes()!=before[path]: raise ValueError('Source changed: '+str(path))
            write(path,data);written.append(path)
        subprocess.run([sys.executable,'build_cavalry.py'],cwd=root,check=True)
    except BaseException:
        for path in reversed(written):
            if path.read_bytes()==after[path]: write(path,before[path])
        raise


if __name__=='__main__':
    try: main()
    except (OSError, ValueError, subprocess.SubprocessError) as exc:
        sys.exit('Cavalry update failed: '+str(exc))
