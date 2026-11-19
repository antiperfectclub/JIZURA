"""Build dist/JIZURA_Cavalry.js; the web payload is assembled in memory on request. AE is read-only."""
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
    core=['native/00_registry.js','native/10_graph.js','native/20_components.js','native/25_recipe_tools.js','native/26_recipe_components.js','native/27_registry_bridge.js']
    extensions=sorted(p.relative_to(base).as_posix() for p in (base/'native').glob('*.js') if p.name not in ('00_registry.js','10_graph.js','20_components.js','25_recipe_tools.js','26_recipe_components.js','27_registry_bridge.js','30_assembly.js','browser_adapter.js'))
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
    args=[node,'--check'] if check else [node,'-']
    p=subprocess.run(args,input=source,text=True,encoding='utf-8',capture_output=True,timeout=120)
    if p.returncode: raise ValueError(label+'\n'+p.stderr)
    return p.stdout

def catalog_summary(root,data):
    if not isinstance(data,dict) or data.get('format')!='jizura.cavalry.ae-source-catalog' or not isinstance(data.get('entries'),list):
        raise ValueError('Invalid AE catalog')
    groups={}
    for entry in data['entries']:
        group,name=entry.get('group'),entry.get('name')
        if group not in GROUPS or not isinstance(name,str) or not name: raise ValueError('Invalid AE catalog entry')
        groups.setdefault(group,set()).add(name)
    return {'source':(root/'ae').relative_to(root).as_posix()+' (extract_ae_catalog.js --stdout)','total':len(data['entries']),
            'counts':data.get('counts') or {g:len(v) for g,v in groups.items()},
            'groups':{g:sorted(groups.get(g,[])) for g in GROUPS},
            'implementationStatus':'not-ported'}

def coverage(manifest,refs,catalog):
    out={}
    for g in GROUPS:
        registered=sorted(manifest[g])
        missing=sorted(set(refs[g])-set(registered))
        row={'registered':registered,'referenceCount':len(refs[g]),'missing':missing,
             'additional':sorted(set(registered)-set(refs[g])),
             # A layout is still an unported native recipe unless its own name is registered; the
             # browser's graphics capture is a separate export path, not a native implementation.
             'method':'native','blockingMissing':missing}
        if catalog:
            names=set(catalog['groups'][g])
            row['catalog']={'count':len(names),'registeredInCatalog':len(names&set(registered)),
                            'notPorted':sorted(names-set(registered)),'registeredNotInCatalog':sorted(set(registered)-names)}
        out[g]=row
    return out

def assemble(root,release=False,*,web=False):
    root=root.resolve(); before=protected(root); node=shutil.which('node')
    if not node: raise ValueError('Node.js is required')
    modules=module_order(root)
    runtime_names=['cavalry/'+m for m in modules]
    names=runtime_names+['cavalry/browser.js','cavalry/native/browser_adapter.js','cavalry/panel.js','VERSION','build_cavalry.py','ae/data.json']
    names+=sorted(p.relative_to(root).as_posix() for pattern in ('src/11p_*.js','ae/p_*.jsx') for p in root.glob(pattern))
    if (root/'cavalry/build.json').exists(): names.append('cavalry/build.json')
    names.append('cavalry/tools/test_requested_native.js')
    raw={}
    for n in dict.fromkeys(names):
        p=root/n
        if not p.resolve().is_relative_to(root) or not p.is_file(): raise ValueError('Invalid input '+n)
        raw[n]=p.read_bytes()
    text={n:b.decode('utf-8-sig').replace('\r\n','\n') for n,b in raw.items()}
    for n in runtime_names+['cavalry/browser.js','cavalry/native/browser_adapter.js','cavalry/panel.js']:
        run_node(node,text[n],n,check=True)
    body='\n;\n'.join(text[n] for n in runtime_names)+'\n;\n'
    required={'layout':['center','vcols','dictionary','xbTwistFrames'],
              'enter':['xgComet','tyKeyFirst','blur','zoom','wipe'],'exit':['xjFocusPull','xiPlateCarry','knCloseGap','blur','shrink','wipe'],
              'hold':['tzKernNudge','tzCounterRules'],'bg':['skyline','xpRingDots'],
              'treat':['inline','outlineOffset','xoDoublePrint'],
              'decor':['xlLadder','romajiLine','tyGlyphBody'],
              'fx':['shake','slice','invert','flash','zoom','chroma','xrDropBounce'],
              'trans':['xqPolyIris']}
    probe=body+'\n(function(){var R='+literal(required)+';Object.keys(R).forEach(function(g){R[g].forEach(function(k){var d=JZNative.get(g,k);if(!d||typeof d.build!=="function")throw new Error("Missing executable recipe: "+g+":"+k);if(JZPresets.get(g,k)!==d)throw new Error("Registry divergence: "+g+":"+k);});});process.stdout.write(JSON.stringify(JZNative.manifest()));})();'
    manifest=json.loads(run_node(node,probe+'\nif(JZPresets!==JZNative)throw new Error("Registry identity mismatch");','Native registration'))
    absent=['%s:%s'%(g,k) for g,names in required.items() for k in names if k not in manifest[g]]
    if absent: raise ValueError('Requested native recipes missing: '+', '.join(absent))
    refs=json.loads(text['ae/data.json']).get('names')
    if not isinstance(refs,dict) or any(g not in refs for g in GROUPS): raise ValueError('Invalid reference vocabulary')
    scan=subprocess.run([node,str(root/'cavalry/tools/extract_ae_catalog.js'),'--stdout'],cwd=root,text=True,encoding='utf-8',capture_output=True,timeout=120)
    if scan.returncode: raise ValueError('AE registry audit failed\n'+scan.stderr)
    catalog=catalog_summary(root,json.loads(scan.stdout))
    refs={g:sorted(set(refs[g])|set(catalog['groups'][g])) for g in GROUPS}
    cov=coverage(manifest,refs,catalog)
    blocking=sum(len(v['blockingMissing']) for v in cov.values())
    if release and blocking: raise ValueError('Release refused: '+str(blocking)+' recipes still lack native implementations')
    hashes={n:sha(b) for n,b in sorted(raw.items())}
    info={'format':'jizura.cavalry.native-build','version':text['VERSION'].strip(),'buildId':sha(literal(hashes).encode()),'sourceHashes':hashes,'moduleOrder':modules,'recipes':manifest,'coverage':cov,
          'catalog':None if not catalog else {'source':catalog['source'],'total':catalog['total'],'counts':catalog['counts'],
            'groups':{g:{k:v for k,v in cov[g]['catalog'].items() if k!='notPorted' and k!='registeredNotInCatalog'} for g in GROUPS}},
          'blockingMissing':blocking,'status':'preview' if blocking else 'implementation-coverage-only','hostVerified':False,'renderVerified':False,
          'inventoryBasis':'ae/data.json names snapshot plus the live AE registry audit (extract_ae_catalog.js --stdout); source files hashed, dynamic registrations not independently audited'}
    runtime=(
        '/* JIZURA Cavalry | Host/render verification pending. */\n'
        'var JZCavalryBuild='+literal(info)+';\n'+body
    )
    artifact='dist/JIZURA_Cavalry.js'
    panel=text['cavalry/panel.js']
    standalone=runtime+'\n;\n'+panel+'\n'

    run_node(node,standalone,artifact,check=True)
    regression=subprocess.run([node,str(root/'cavalry/tools/test_requested_native.js'),'--stdin'],cwd=root,input=standalone,text=True,encoding='utf-8',capture_output=True,timeout=120)
    if regression.returncode: raise ValueError('Recipe graph regression failed\n'+regression.stderr)
    if json.loads(regression.stdout).get('requestedRecipeGraphCompilation')!='passed': raise ValueError('Recipe graph regression did not pass')
    if protected(root)!=before or any(
        (root/name).read_bytes()!=contents
        for name,contents in raw.items()
    ):
        raise ValueError('Build inputs changed')

    if not web:
        return {artifact:standalone},before

    vocabulary=(
        'var JZFamilies=(function(M){return {'
        'built:function(g){return Object.keys(M[g]||{}).sort();},'
        'resolve:function(g,k){var ok=M[g]&&'
        'Object.prototype.hasOwnProperty.call(M[g],k);'
        'return {state:ok?"exact":"missing",as:ok?k:null};}'
        '};})('+literal(manifest)+');\n'
    )
    browser=vocabulary+text['cavalry/browser.js']+'\n;\n'
    for key,value in (
        ('runtimeSource',runtime),
        ('panelSource',panel),
        ('standaloneSource',standalone),
        ('buildInfo',info),
    ):
        browser+='J.Cavalry.'+key+'='+literal(value)+';\n'

    browser+=body+'\n;\n'+text['cavalry/native/browser_adapter.js']+'\n;\n'
    # The existing web UI may still call this hook; it does not create a loader or a project-specific JS file.
    browser+=(
        'J.Cavalry.downloadLoader=function(){'
        'return J.Cavalry.downloadPanel("JIZURA_Cavalry");};\n'
        'J.Cavalry.download=J.Cavalry.downloadJson;\n'
    )
    run_node(node,browser,'in-memory Cavalry web module',check=True)
    return browser,before

def write_outputs(root,outputs,check=False):
    root=root.resolve()
    files={n:s for n,s in outputs.items() if not n.startswith('@')}
    stale=[n for n,s in files.items() if not (root/n).is_file() or (root/n).read_bytes()!=s.encode()]
    if check:
        if stale: raise ValueError('Stale outputs: '+', '.join(stale))
        return []
    for n in stale:
        p=root/n
        if not p.resolve().is_relative_to(root): raise ValueError('Output escapes root')
        p.parent.mkdir(parents=True,exist_ok=True); temp=None
        try:
            with tempfile.NamedTemporaryFile(dir=p.parent,delete=False) as f:
                temp=Path(f.name);f.write(files[n].encode())
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
    print('Artifact: dist/JIZURA_Cavalry.js — the web module is assembled in memory by build.py when needed. Host/render verification pending.');return 0
if __name__=='__main__': raise SystemExit(main())
