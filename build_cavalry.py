"""Build the standalone Cavalry plugin and identical web payload; AE is read-only."""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

GROUPS=('layout','enter','hold','exit','decor','treat','bg','cam','fx','trans')
def literal(v):
    return json.dumps(v,ensure_ascii=True,sort_keys=True,separators=(',',':')).replace('<','\\u003c')
def sha(b):
    return hashlib.sha256(b).hexdigest()
def protected(root):
    paths={p for pat in ('ae/**/*','cep/**/*','JIZURA_AE*','JIZURA_CEP*','build_ae.py','build_cep.py') for p in root.glob(pat) if p.is_file()}
    return {p.relative_to(root).as_posix():sha(p.read_bytes()) for p in sorted(paths)}
def module_order(root):
    base=root/'cavalry'
    core=['native/00_registry.js','native/10_graph.js','native/20_components.js']
    extensions=sorted(p.relative_to(base).as_posix() for p in (base/'native').glob('*.js') if p.name not in ('00_registry.js','10_graph.js','20_components.js','30_assembly.js','browser_adapter.js'))
    packs=sorted(p.relative_to(base).as_posix() for p in (base/'packs').glob('p_*.js'))
    if not packs: raise ValueError('No native recipe packs found')
    names=core+extensions+packs+['native/30_assembly.js']
    deps={n:set() for n in names}
    for i,n in enumerate(core): deps[n].update(core[:i])
    for n in extensions: deps[n].update(core)
    for n in packs: deps[n].update(core+extensions)
    deps[names[-1]].update(names[:-1])
    config=base/'build.json'
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
        ordered.extend(ready)
        for n in ready: del deps[n]
        for req in deps.values(): req.difference_update(ready)
    return ordered

def run_node(node,source,label,check=False):
    args=[node,'--check'] if check else [node,'-e',source]
    p=subprocess.run(args,input=source if check else None,text=True,encoding='utf-8',capture_output=True,timeout=120)
    if p.returncode: raise ValueError(label+'\n'+p.stderr)
    return p.stdout

def assemble(root,release=False):
    root=root.resolve(); before=protected(root); node=shutil.which('node')
    if not node: raise ValueError('Node.js is required')
    modules=module_order(root)
    runtime_names=['cavalry/'+m for m in modules]
    names=runtime_names+['cavalry/browser.js','cavalry/native/browser_adapter.js','cavalry/panel.js','VERSION','build_cavalry.py','ae/data.json']
    names+=sorted(p.relative_to(root).as_posix() for pattern in ('src/11p_*.js','ae/p_*.jsx') for p in root.glob(pattern))
    for n in ('cavalry/build.json','cavalry/bridge.js','cavalry/loader.js'):
        if (root/n).exists(): names.append(n)
    raw={}
    for n in dict.fromkeys(names):
        p=root/n
        if not p.resolve().is_relative_to(root) or not p.is_file(): raise ValueError('Invalid input '+n)
        raw[n]=p.read_bytes()
    text={n:b.decode('utf-8-sig').replace('\r\n','\n') for n,b in raw.items()}
    for n in runtime_names+['cavalry/browser.js','cavalry/native/browser_adapter.js','cavalry/panel.js']:
        run_node(node,text[n],n,check=True)
    body='\n;\n'.join(text[n] for n in runtime_names)+'\n;\n'
    manifest=json.loads(run_node(node,body+'process.stdout.write(JSON.stringify(JZNative.manifest()));','Native registration'))
    refs=json.loads(text['ae/data.json']).get('names')
    if not isinstance(refs,dict) or any(g not in refs for g in GROUPS): raise ValueError('Invalid reference vocabulary')
    coverage={g:{'registered':sorted(manifest[g]),'referenceCount':len(refs[g]),'missing':sorted(set(refs[g])-set(manifest[g])),'additional':sorted(set(manifest[g])-set(refs[g]))} for g in GROUPS}
    missing=sum(len(v['missing']) for v in coverage.values())
    if release and missing: raise ValueError('Release refused: '+str(missing)+' recipes still lack native implementations')
    hashes={n:sha(b) for n,b in sorted(raw.items())}
    info={'format':'jizura.cavalry.native-build','version':text['VERSION'].strip(),'buildId':sha(literal(hashes).encode()),'sourceHashes':hashes,'moduleOrder':modules,'recipes':manifest,'coverage':coverage,'status':'preview' if missing else 'implementation-coverage-only','hostVerified':False,'renderVerified':False,'inventoryBasis':'ae/data.json names snapshot; source files hashed, dynamic registrations not independently audited'}
    runtime='/* GENERATED: host/render verification pending. */\nvar JZCavalryBuild='+literal(info)+';\n'+body
    panel=text.get('cavalry/bridge.js','')+'\n'+text['cavalry/panel.js']
    standalone=runtime+'\n'+panel+'\n'
    browser='var JZFamilies=(function(M){return {built:function(g){return Object.keys(M[g]||{}).sort();},resolve:function(g,k){return {state:M[g]&&M[g][k]?"exact":"missing",as:M[g]&&M[g][k]?k:null};}};})('+literal(manifest)+');\n'+text['cavalry/browser.js']+'\n;\n'
    for key,value in [('runtimeSource',runtime),('panelSource',panel),('buildInfo',info),('loaderSource',text.get('cavalry/loader.js',''))]:
        browser+='J.Cavalry.'+key+'='+literal(value)+';\n'
    browser+=body+'\n'+text['cavalry/native/browser_adapter.js']+'\n'
    browser+='J.Cavalry.standaloneSource=J.Cavalry.runtimeSource+"\\n"+J.Cavalry.panelSource+"\\n";\nJ.Cavalry.downloadPanel=function(name){return J.saveFile(String(name||"JIZURA_CV").replace(/[\\\\/:*?"<>|]/g,"_")+".js",new Blob([J.Cavalry.standaloneSource],{type:"text/javascript;charset=utf-8"}));};\n'
    outputs={n:standalone for n in ('JIZURA_CV.js','dist/cavalry/JIZURA_CV.js','dist/cavalry/JIZURA_Cavalry.js')}
    outputs['src/11r_cavalry.js']=browser
    for n,s in outputs.items(): run_node(node,s,n,check=True)
    report=dict(info,protectedHashes=before,syntaxCheck='passed',outputHashes={n:sha(s.encode()) for n,s in outputs.items()})
    outputs['dist/cavalry/build-report.json']=json.dumps(report,ensure_ascii=True,sort_keys=True,indent=2)+'\n'
    if protected(root)!=before or any((root/n).read_bytes()!=b for n,b in raw.items()): raise ValueError('Build inputs changed')
    return outputs,before

def write_outputs(root,outputs,check=False):
    root=root.resolve(); stale=[n for n,s in outputs.items() if not (root/n).is_file() or (root/n).read_bytes()!=s.encode()]
    if check:
        if stale: raise ValueError('Stale outputs: '+', '.join(stale))
        return []
    for n in stale:
        p=root/n
        if not p.resolve().is_relative_to(root): raise ValueError('Output escapes root')
        p.parent.mkdir(parents=True,exist_ok=True); temp=None
        try:
            with tempfile.NamedTemporaryFile(dir=p.parent,delete=False) as f:
                temp=Path(f.name);f.write(outputs[n].encode())
            os.replace(temp,p)
        finally:
            if temp: temp.unlink(missing_ok=True)
    return stale

def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--root',type=Path,default=Path(__file__).resolve().parent);p.add_argument('--check',action='store_true');p.add_argument('--release',action='store_true');a=p.parse_args(argv)
    root=a.root.resolve()
    try:
        outputs,before=assemble(root,a.release);changed=write_outputs(root,outputs,a.check)
        if before!=protected(root): raise ValueError('Protected files changed')
    except (OSError,ValueError,UnicodeError,subprocess.SubprocessError) as error:
        print('Cavalry build failed: '+str(error),file=sys.stderr);return 1
    print('Cavalry outputs verified' if a.check else 'Cavalry outputs updated: '+str(len(changed)))
    print('Host/render verification pending; coverage is in build-report.json');return 0
if __name__=='__main__': raise SystemExit(main())
