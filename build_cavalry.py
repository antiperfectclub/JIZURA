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
    args=[node,'--check'] if check else [node,'-e',source]
    p=subprocess.run(args,input=source if check else None,text=True,encoding='utf-8',capture_output=True,timeout=120)
    if p.returncode: raise ValueError(label+'\n'+p.stderr)
    return p.stdout

def catalog_summary(root):
    path=root/'cavalry/catalog/ae-presets.json'
    if not path.is_file(): return None
    data=json.loads(path.read_text(encoding='utf-8'))
    if data.get('format')!='jizura.cavalry.ae-source-catalog' or not isinstance(data.get('entries'),list):
        raise ValueError('Invalid AE catalog')
    groups={}
    for entry in data['entries']:
        group,name=entry.get('group'),entry.get('name')
        if group not in GROUPS or not isinstance(name,str) or not name: raise ValueError('Invalid AE catalog entry')
        groups.setdefault(group,set()).add(name)
    return {'source':'cavalry/catalog/ae-presets.json','total':len(data['entries']),
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

def assemble(root,release=False):
    root=root.resolve(); before=protected(root); node=shutil.which('node')
    if not node: raise ValueError('Node.js is required')
    modules=module_order(root)
    runtime_names=['cavalry/'+m for m in modules]
    names=runtime_names+['cavalry/browser.js','cavalry/native/browser_adapter.js','cavalry/panel.js','VERSION','build_cavalry.py','ae/data.json']
    names+=sorted(p.relative_to(root).as_posix() for pattern in ('src/11p_*.js','ae/p_*.jsx') for p in root.glob(pattern))
    for n in ('cavalry/build.json','cavalry/bridge.js','cavalry/loader.js'):
        if (root/n).exists(): names.append(n)
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
    regression=subprocess.run([node,str(root/'cavalry/tools/test_requested_native.js')],cwd=root,text=True,encoding='utf-8',capture_output=True,timeout=120)
    if regression.returncode: raise ValueError('Recipe graph regression failed\n'+regression.stderr)
    graph_tests=json.loads(regression.stdout)
    if graph_tests.get('requestedRecipeGraphCompilation')!='passed': raise ValueError('Recipe graph regression did not pass')
    absent=['%s:%s'%(g,k) for g,names in required.items() for k in names if k not in manifest[g]]
    if absent: raise ValueError('Requested native recipes missing: '+', '.join(absent))
    refs=json.loads(text['ae/data.json']).get('names')
    if not isinstance(refs,dict) or any(g not in refs for g in GROUPS): raise ValueError('Invalid reference vocabulary')
    catalog=catalog_summary(root)
    cov=coverage(manifest,refs,catalog)
    blocking=sum(len(v['blockingMissing']) for v in cov.values())
    if release and blocking: raise ValueError('Release refused: '+str(blocking)+' recipes still lack native implementations')
    hashes={n:sha(b) for n,b in sorted(raw.items())}
    info={'format':'jizura.cavalry.native-build','version':text['VERSION'].strip(),'buildId':sha(literal(hashes).encode()),'sourceHashes':hashes,'moduleOrder':modules,'recipes':manifest,'coverage':cov,
          'catalog':None if not catalog else {'source':catalog['source'],'total':catalog['total'],'counts':catalog['counts'],
            'groups':{g:{k:v for k,v in cov[g]['catalog'].items() if k!='notPorted' and k!='registeredNotInCatalog'} for g in GROUPS}},
          'blockingMissing':blocking,'status':'preview' if blocking else 'implementation-coverage-only','hostVerified':False,'renderVerified':False,
          'inventoryBasis':'ae/data.json names snapshot; cavalry/catalog/ae-presets.json when present; source files hashed, dynamic registrations not independently audited'}
    runtime='/* GENERATED: host/render verification pending. */\nvar JZCavalryBuild='+literal(info)+';\n'+body
    panel=text.get('cavalry/bridge.js','')+'\n'+text['cavalry/panel.js']
    standalone=runtime+'\n'+panel+'\n'
    browser='var JZFamilies=(function(M){return {built:function(g){return Object.keys(M[g]||{}).sort();},resolve:function(g,k){return {state:M[g]&&M[g][k]?"exact":"missing",as:M[g]&&M[g][k]?k:null};}};})('+literal(manifest)+');\n'+text['cavalry/browser.js']+'\n;\n'
    loader=text.get('cavalry/bridge.js','')+'\n'+text.get('cavalry/loader.js','')
    for key,value in [('runtimeSource',runtime),('panelSource',panel),('buildInfo',info),('loaderSource',loader)]:
        browser+='J.Cavalry.'+key+'='+literal(value)+';\n'
    browser+=body+'\n'+text['cavalry/native/browser_adapter.js']+'\n'
    browser+='J.Cavalry.standaloneSource=J.Cavalry.runtimeSource+"\\n"+J.Cavalry.panelSource+"\\n";\nJ.Cavalry.downloadPanel=function(name){return J.saveFile(String(name||"JIZURA_CV").replace(/[\\\\/:*?"<>|]/g,"_")+".js",new Blob([J.Cavalry.standaloneSource],{type:"text/javascript;charset=utf-8"}));};\nJ.Cavalry.downloadLoader=function(name){return J.saveFile(String(name||"JIZURA_CV_Loader").replace(/[\\\\/:*?"<>|]/g,"_")+".js",new Blob([J.Cavalry.loaderSource],{type:"text/javascript;charset=utf-8"}));};\n'
    outputs={n:standalone for n in ('JIZURA_CV.js','dist/cavalry/JIZURA_CV.js')}
    outputs['dist/cavalry/JIZURA_CV_Loader.js']=runtime+'\n'+loader+'\n'
    outputs['src/11r_cavalry.js']=browser
    build_manifest={'format':'jizura.cavalry.build-manifest','version':info['version'],'buildId':info['buildId'],
        'modules':modules,'recipes':manifest,'coverage':{g:{k:cov[g][k] for k in ('registered','referenceCount','method','blockingMissing')} for g in GROUPS},
        'catalog':None if not catalog else {'total':catalog['total'],'counts':catalog['counts'],
            'groups':{g:cov[g]['catalog'] for g in GROUPS}},
        'blockingMissing':blocking,'status':info['status'],'hostVerified':False,'renderVerified':False}
    for n,s in outputs.items(): run_node(node,s,n,check=True)
    report=dict(info,recipeGraphTests=graph_tests,protectedHashes=before,syntaxCheck='passed',outputHashes={n:sha(s.encode()) for n,s in outputs.items()})
    outputs['dist/cavalry/build-report.json']=json.dumps(report,ensure_ascii=True,sort_keys=True,indent=2)+'\n'
    outputs['dist/cavalry/build-manifest.json']=json.dumps(build_manifest,ensure_ascii=True,sort_keys=True,indent=2)+'\n'
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
