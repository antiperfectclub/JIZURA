/* Explicit pack registry. No substring aliases and no host calls during loading. */
var JZPack=(function(Z){
'use strict';
var groups=['layout','enter','hold','exit','decor','treat','bg','cam','fx','trans'], R={}, baseBuilt=Z.built, baseResolve=Z.resolve, made=[];
groups.forEach(function(g){R[g]=Object.create(null);});
function base(g){try{return baseBuilt(g);}catch(e){return [];}}
function built(g){return Array.from(new Set(base(g).concat(Object.keys(R[g]||{})))).sort();}
function resolve(g,k){if(R[g]&&R[g][k])return {fn:R[g][k].build,exact:true,as:k,metadata:R[g][k].metadata};return base(g).indexOf(k)>=0?baseResolve(g,k):null;}
function register(g,k,fn,metadata){if(!R[g]||typeof fn!=='function'||R[g][k])throw new Error('Invalid/duplicate Cavalry pack recipe '+g+':'+k);R[g][k]={build:fn,metadata:Object.assign({hostVerified:false},metadata)};}
function manifest(){var m={};groups.forEach(function(g){m[g]={};built(g).forEach(function(k){m[g][k]=R[g][k]?R[g][k].metadata:{source:'cavalry/presets.js',hostVerified:false};});});return m;}
function finite(v){if(typeof v!=='number'||!isFinite(v))throw new Error('Non-finite pack value');return v;}
function param(p,k,d){var v=p[k]||d;return finite(v);}
function key(id,f,data){var meta={};Object.keys(data).forEach(function(k){finite(data[k]);meta[k]={frame:f,type:1};});api.keyframe(id,f,data);api.modifyKeyframe(id,meta);}
function nullLayer(name,parent,cut){var id=api.create('null',name);made.push(id);api.parent(id,parent);api.setInFrame(id,cut.start);api.setOutFrame(id,cut.end-1);return id;}
function install(engine){if(engine.__packsInstalled)return;engine.__packsInstalled=true;var run=engine.run;
 engine.run=function(a,o){made=[];o=o||{};var result=run(a,Object.assign({},o,{componentPath:null}));
 if(typeof JZPack.applyHolds==='function')JZPack.applyHolds(a,result);
 result.layerIds=Array.from(new Set(result.layerIds.concat(made)));result.report.packManifest=manifest();
 result.report.complete=Object.keys(result.report.missing).length===0&&Object.keys(result.report.fallback).length===0&&result.report.errors.length===0;
 if(o.componentPath&&!api.writeToFile(o.componentPath,api.serialise(result.layerIds,true),false))throw new Error('Failed to serialise pack layers');return result;};
}
Z.resolve=resolve;Z.built=built;Z.has=function(g,k){return !!resolve(g,k);};
return {register:register,manifest:manifest,built:built,resolve:resolve,finite:finite,param:param,key:key,nullLayer:nullLayer,install:install};
})(JZPresets);
/* The original registry consults this only for exact legacy names. */
var JZFamilies={built:JZPack.built,resolve:function(g,k){return {state:JZPack.built(g).indexOf(k)>=0?'exact':'missing',as:JZPack.built(g).indexOf(k)>=0?k:null};}};
