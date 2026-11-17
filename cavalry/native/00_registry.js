/* Native recipe registry. No family aliases; no host access at registration time. */
var JZNative = (function () {
'use strict';
var groups = ['layout','enter','hold','exit','decor','treat','bg','cam','fx','trans'];
var recipes = Object.create(null);
groups.forEach(function (g) { recipes[g] = Object.create(null); });
function register(group, name, def) {
  if (!recipes[group] || typeof name !== 'string' || !name || !def || typeof def.build !== 'function') throw new Error('Invalid native recipe: '+group+':'+name);
  if (recipes[group][name]) throw new Error('Duplicate native recipe: '+group+':'+name);
  if (!def.source || !def.scope) throw new Error('Recipe needs source and scope: '+group+':'+name);
  recipes[group][name] = def;
}
function get(group, name) { return recipes[group] && recipes[group][name] || null; }
function manifest() {
  var out = {};
  groups.forEach(function (g) { out[g] = {}; Object.keys(recipes[g]).sort().forEach(function (k) {
    var d = recipes[g][k]; out[g][k] = {source:d.source,scope:d.scope,exact:false,hostVerified:false,differences:d.differences || []};
  }); });
  return out;
}
function finite(v, label) { if (typeof v !== 'number' || !isFinite(v)) throw new Error('Non-finite '+label); return v; }
function clamp(x) { return Math.max(0,Math.min(1,x)); }
function outExpo(x) { x=clamp(x); return x===1?1:1-Math.pow(2,-10*x); }
function hash(a,b,c,d,e) {
  var h=0x9e3779b9^(a|0); h=Math.imul(h^(h>>>16),0x85ebca6b);
  h=(h+Math.imul((b|0)+0x632be5ab,0xc2b2ae35))|0; h=Math.imul(h^(h>>>13),0xc2b2ae35);
  h=(h+Math.imul((c|0)+0x5bd1e995,0x27d4eb2f))|0; h=Math.imul(h^(h>>>15),0x165667b1);
  h=(h+Math.imul((d|0)+0x1b873593,0x85ebca6b))|0; h=Math.imul(h^(h>>>16),0x27d4eb2f);
  h=(h+Math.imul((e|0)+0x68e31da4,0x9e3779b1))|0; h^=h>>>15; h=Math.imul(h,0x2c1b3c6d); h^=h>>>12; h=Math.imul(h,0x297a2d39); h^=h>>>15;
  return h>>>0;
}
return {register:register,get:get,manifest:manifest,groups:groups,finite:finite,clamp:clamp,outExpo:outExpo,
  random:function(a,b,c,d,e){return hash(a,b,c,d,e)/4294967296;}};
})();
