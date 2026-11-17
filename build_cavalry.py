"""Assemble Cavalry components, explicit native packs, engine and Script UI. AE is read-only."""
from __future__ import annotations
import argparse, hashlib, json, os
from pathlib import Path
import shutil, subprocess, sys, tempfile

GROUPS = ('layout','enter','hold','exit','decor','treat','bg','cam','fx','trans')
def literal(v):
    return json.dumps(v, ensure_ascii=True, sort_keys=True, separators=(',',':')).replace('<', '\\u003c')
def sha(b):
    return hashlib.sha256(b).hexdigest()
def protected(root):
    patterns=('ae/**/*','cep/**/*','JIZURA_AE*','JIZURA_CEP*','build_ae.py','build_cep.py')
    paths={p for pattern in patterns for p in root.glob(pattern) if p.is_file()}
    return {p.relative_to(root).as_posix():sha(p.read_bytes()) for p in sorted(paths)}
def module_order(root):
    fixed=['native/00_registry.js','native/10_graph.js','native/20_components.js']
    packs=sorted(p.relative_to(root/'cavalry').as_posix() for p in (root/'cavalry/packs').glob('p_*.js'))
    if not packs: raise ValueError('No native recipe packs found')
    names=fixed+packs+['native/30_assembly.js']; deps={n:set() for n in names}
    for i,n in enumerate(fixed): deps[n].update(fixed[:i])
    for n in packs: deps[n].update(fixed)
    deps[names[-1]].update(names[:-1])
    config=root/'cavalry/build.json'
    if config.exists():
        cfg=json.loads(config.read_text(encoding='utf-8-sig'))
        if set(cfg)-{'dependencies'}: raise ValueError('Unknown build configuration field')
        for n,req in cfg.get('dependencies',{}).items():
            if n not in deps or not isinstance(req,list) or any(x not in deps for x in req): raise ValueError('Unknown module dependency')
            deps[n].update(req)
    ordered=[]
    while deps:
        ready=sorted(n for n,req in deps.items() if not req)
        if not ready: raise ValueError('Cyclic native module dependencies')
        ordered+=ready
        for n in ready: del deps[n]
        for req in deps.values(): req.difference_update(ready)
    return ordered

def assemble(root, release=False):
    before=protected(root); node=shutil.which('node')
    if not node: raise ValueError('Node.js required for syntax and registration checks')
    modules=module_order(root)
    names=['cavalry/'+p for p in modules]+['cavalry/browser.js','cavalry/native/browser_adapter.js','cavalry/panel.js','VERSION','build_cavalry.py','ae/data.json']
    for optional in ('cavalry/build.json','cavalry/bridge.js','cavalry/loader.js'):
        if (root/optional).exists(): names.append(optional)
    raw={}
    for name in names:
        p=root/name
        if not p.resolve().is_relative_to(root) or not p.is_file(): raise ValueError('Invalid input '+name)
        raw[name]=p.read_bytes()
    text={n:b.decode('utf-8-sig').replace('\r\n','\n') for n,b in raw.items()}
    for n,source in text.items():
        if n.endswith('.js'):
            p=subprocess.run([node,'--check'],input=source,text=True,capture_output=True)
            if p.returncode: raise ValueError(n+'\n'+p.stderr)
    body='\n;\n'.join(text['cavalry/'+p] for p in modules)+'\n;\n'
    p=subprocess.run([node,'-e',body+'process.stdout.write(JSON.stringify(JZNative.manifest()));'],text=True,capture_output=True)
    if p.returncode: raise ValueError('Native registration failure: '+p.stderr)
    manifest=json.loads(p.stdout)
    data=json.loads(text['ae/data.json']); refs=data.get('names')
    if not isinstance(refs,dict) or any(g not in refs for g in GROUPS): raise ValueError('Invalid reference vocabulary')
    coverage={g:{'registered':sorted(manifest[g]),'referenceCount':len(refs[g]),'missing':sorted(set(refs[g])-set(manifest[g])),'additional':sorted(set(manifest[g])-set(refs[g]))} for g in GROUPS}
    missing=sum(len(v['missing']) for v in coverage.values())
    if release and missing: raise ValueError('Release refused: '+str(missing)+' reference recipes have no native implementation')
    hashes={n:sha(b) for n,b in sorted(raw.items())}
    info={'format':'jizura.cavalry.native-build','version':text['VERSION'].strip(),'buildId':sha(literal(hashes).encode()),'sourceHashes':hashes,'moduleOrder':modules,
          'recipes':manifest,'coverage':coverage,'status':'preview' if missing else 'implementation-coverage-only','hostVerified':False,'renderVerified':False,
          'inventoryBasis':'ae/data.json names snapshot; dynamic source registrations are not independently audited'}
    header='/* GENERATED native Cavalry engine; host/render verification pending. */\nvar JZCavalryBuild='+literal(info)+';\n'
    runtime=header+body
    bridge=text.get('cavalry/bridge.js',''); panel=bridge+'\n'+text['cavalry/panel.js']; standalone=runtime+'\n'+panel+'\n'
    vocabulary='var JZFamilies=(function(M){return {built:function(g){return Object.keys(M[g]||{}).sort();},resolve:function(g,k){return {state:M[g]&&M[g][k]?"exact":"missing",as:M[g]&&M[g][k]?k:null};}};})('+literal(manifest)+');\n'
    browser=vocabulary+text['cavalry/browser.js']+'\n;\n'
    browser+='J.Cavalry.runtimeSource='+literal(runtime)+';\nJ.Cavalry.panelSource='+literal(panel)+';\nJ.Cavalry.buildInfo='+literal(info)+';\n'
    browser+='J.Cavalry.loaderSource='+literal(text.get('cavalry/loader.js',''))+';\n'
    browser+=body+'\n'+text['cavalry/native/browser_adapter.js']+'\n'
    browser+='J.Cavalry.standaloneSource=J.Cavalry.runtimeSource+"\\n"+J.Cavalry.panelSource+"\\n";\nJ.Cavalry.downloadPanel=function(name){return J.saveFile(String(name||"JIZURA_CV").replace(/[\\\\/:*?"<>|]/g,"_")+".js",new Blob([J.Cavalry.standaloneSource],{type:"text/javascript;charset=utf-8"}));};\n'
    outputs={n:standalone for n in ('JIZURA_CV.js','dist/cavalry/JIZURA_CV.js','dist/cavalry/JIZURA_Cavalry.js')}
    outputs['src/11r_cavalry.js']=browser
    for n,s in outputs.items():
        p=subprocess.run([node,'--check'],input=s,text=True,capture_output=True)
        if p.returncode: raise ValueError(n+'\n'+p.stderr)
    report=dict(info,protectedHashes=before,syntaxCheck='passed',outputHashes={n:sha(s.encode()) for n,s in outputs.items()})
    outputs['dist/cavalry/build-report.json']=json.dumps(report,ensure_ascii=True,sort_keys=True,indent=2)+'\n'
    if protected(root)!=before or any((root/n).read_bytes()!=b for n,b in raw.items()): raise ValueError('Build input/protected file changed')
    return outputs,before

def write_outputs(root,outputs,check=False):
    stale=[n for n,s in outputs.items() if not (root/n).is_file() or (root/n).read_bytes()!=s.encode()]
    if check:
        if stale: raise ValueError('Stale outputs: '+', '.join(stale))
        return []
    for n in stale:
        p=root/n
        if not p.resolve().is_relative_to(root): raise ValueError('Output escapes root')
        p.parent.mkdir(parents=True,exist_ok=True)
        tmp=None
        try:
            with tempfile.NamedTemporaryFile(dir=p.parent,delete=False) as f:
                tmp=Path(f.name);f.write(outputs[n].encode())
            os.replace(tmp,p)
        finally:
            if tmp: tmp.unlink(missing_ok=True)
    return stale

def main(argv=None):
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--root',type=Path,default=Path(__file__).resolve().parent)
    ap.add_argument('--check',action='store_true');ap.add_argument('--release',action='store_true');a=ap.parse_args(argv);root=a.root.resolve()
    try:
        outputs,before=assemble(root,a.release);changed=write_outputs(root,outputs,a.check)
        if protected(root)!=before: raise ValueError('Protected files changed')
    except (OSError,ValueError,UnicodeError,subprocess.SubprocessError) as e:
        print('Cavalry build failed: '+str(e),file=sys.stderr);return 1
    print('Cavalry outputs verified' if a.check else 'Cavalry outputs updated: '+str(len(changed)))
    print('Native implementation coverage: see build-report.json; host/render verification pending');return 0
if __name__=='__main__': raise SystemExit(main())
