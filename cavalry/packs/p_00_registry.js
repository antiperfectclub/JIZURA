/* JZNative <- JZPresets integration. Legacy cavalry/presets.js recipes without a native counterpart are re-implemented here as
   native graph recipes; JZPresets/JZFamilies become exact-name views of the JZNative registry (no aliases, no family
   substitution, no host access while loading). Source: cavalry/presets.js (legacy builders). */
(function (N, R, C, G) {
'use strict';
var E = R.E, cl = R.clamp;
function fixLegacy(group, key) { var d = N.get(group, key); d.differences.push('Legacy presets.js recipe ported to glyph tracks; opacity envelope reproduced as a 4x ramp (enter) or linear fade (exit).'); }
function legacy(group, key, fn) { R.motion(group, key, 'cavalry/presets.js (legacy port)', fn); fixLegacy(group, key); }
function left(e) { return e.node.x < e.W / 2 ? 1 : -1; }
legacy('enter', 'slide', function (p, g, gs, e) { return { dx: -e.W * 0.12 * left(e) * (1 - E.outExpo(p)), a: cl(p * 4) }; });
legacy('exit', 'slide', function (p, g, gs, e) { return { dx: e.W * 0.12 * -left(e) * p, a: 1 - p }; });
legacy('enter', 'rise', function (p, g, gs, e) { return { dy: e.node.size * 0.8 * (1 - E.outExpo(p)), a: cl(p * 4) }; });
legacy('exit', 'rise', function (p, g, gs, e) { return { dy: -e.node.size * 0.8 * p, a: 1 - p }; });
legacy('enter', 'flip', function (p, g, gs, e) { return { sx: R.mix(0.02, 1, E.outExpo(p)), a: cl(p * 4) }; });
legacy('exit', 'flip', function (p, g, gs, e) { return { sx: R.mix(1, 0.02, p), a: 1 - p }; });
legacy('exit', 'pop', function (p, g, gs, e) { return { s: 1 + 0.4 * p, a: 1 - p }; });

function rng(seed) { var a = (seed >>> 0) || 1; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function firstFont(c) {
  var n0 = c.cut.nodes[0]; if (!n0 || !n0.font) throw new Error('Recipe needs a text node font in ' + c.cut.id);
  var f = (c.options.fontOverrides || {})[n0.font.key] || n0.font;
  if (!f.family || !f.style || !cavalry.fontExists(f.family, f.style)) throw new Error('Missing font ' + f.family + ' / ' + f.style);
  return { node: n0, font: f };
}
N.register('bg', 'dots', { source: 'cavalry/presets.js bg:dots (halftone)', scope: 'cut', differences: [], build: function (c) {
  var P = (c.preset && c.preset.params) || {}, r = rng(P.seed || (c.cut.source || {}).seed || 1), W = c.comp.width, H = c.comp.height;
  var cell = Math.max(24, (P.cell || 0.04) * W), dir = (P.dir || 135) * Math.PI / 180, dx = Math.cos(dir), dy = Math.sin(dir), cmds = [];
  for (var y = -H / 2; y <= H / 2; y += cell) for (var x = -W / 2; x <= W / 2; x += cell) {
    var gr = ((x * dx + y * dy) / (W * 0.5) + 1) / 2, rad = cell * 0.5 * cl(gr) * (0.6 + 0.4 * r());
    if (rad > 1) cmds = cmds.concat(G.ellipse(x, y, rad, rad));
  }
  if (!cmds.length) throw new Error('bg:dots produced no dots');
  C.shape(c.graph, c.cut, c.cut.id + ' / Halftone', c.parent, cmds, c.sc.dim || c.sc.sub, 0, 0.55);
} });
N.register('bg', 'bigChar', { source: 'cavalry/presets.js bg:bigChar', scope: 'cut', differences: [], build: function (c) {
  var f = firstFont(c), ch = Array.from(String(f.node.text).replace(/\n/g, ''))[0];
  if (!ch) throw new Error('bg:bigChar needs a character');
  c.graph.add('textShape', c.cut.id + ' / Big Char', c.parent, c.cut.start, c.cut.end, { text: ch, font: { font: f.font.family, style: f.font.style }, fontSize: c.comp.height * 1.1,
    autoWidth: true, autoHeight: true, horizontalAlignment: 1, verticalAlignment: 1, position: [0, 0], fill: true, stroke: false, 'material.materialColor': c.sc.dim || c.sc.sub, alpha: 0.5 });
} });
N.register('decor', 'indexNum', { source: 'cavalry/presets.js decor:indexNum', scope: 'cut', differences: [], build: function (c) {
  var f = firstFont(c), num = parseInt(String(c.cut.id).replace(/\D/g, ''), 10);
  if (!isFinite(num)) throw new Error('decor:indexNum needs a numeric cut id: ' + c.cut.id);
  c.graph.add('textShape', c.cut.id + ' / Index', c.parent, c.cut.start, c.cut.end, { text: 'No.' + ('0' + (num + 1)).slice(-2), font: { font: f.font.family, style: f.font.style }, fontSize: 28,
    autoWidth: true, autoHeight: true, horizontalAlignment: 1, verticalAlignment: 1, position: [-c.comp.width / 2 + 90, c.comp.height / 2 - 60], fill: true, stroke: false, 'material.materialColor': c.sc.sub });
} });
})(JZNative, JZRecipeTools, JZComponents, JZGraph);

/* Compatibility views for legacy callers (panel/bridge/loader). Exact names only. */
var JZPresets = (function (N) {
  function built(kind) { var m = N.manifest()[kind]; return m ? Object.keys(m).sort() : []; }
  function resolve(kind, name) { var d = name ? N.get(kind, name) : null; return d ? { fn: d.build, exact: true, as: name } : null; }
  return { has: function (kind, name) { return !!resolve(kind, name); }, resolve: resolve, built: built };
})(JZNative);
var JZFamilies = { built: JZPresets.built, resolve: function (g, k) { var ok = !!JZPresets.resolve(g, k); return { state: ok ? 'exact' : 'missing', as: ok ? k : null }; } };
