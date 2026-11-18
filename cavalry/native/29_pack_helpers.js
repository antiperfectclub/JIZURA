/* Shared Cavalry pack primitives matching AE/web formulas in Cavalry's native graph format.
 * Loaded after 28_registry_identity.js and before all packs (cavalry/packs/p_*.js).
 */
var JZHelpers = (function (N, G, C, R, V, S) {
'use strict';

var EPS = 1e-6;
var TAU = Math.PI * 2;
var DEG = Math.PI / 180;
var cl = R.clamp;
var mix = R.mix;
var E = R.E;

function p(P, k, d) {
  var v = P && P[k] != null ? P[k] : d;
  if (typeof v === 'number') N.finite(v, 'param ' + k);
  return v;
}

function arrN(a) { return Array.isArray(a) ? a : []; }

function hexRgb(hex) {
  var h = String(hex || '#000000').replace(/^#/, '');
  if (h.length === 3) h = h.replace(/./g, function (c) { return c + c; });
  if (h.length < 6) h = (h + '000000').slice(0, 6);
  var n = parseInt(h.slice(0, 6), 16);
  if (!isFinite(n)) return [0, 0, 0];
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

function rgbHex(r, g, b) {
  function ch(v) {
    var n = Math.max(0, Math.min(255, Math.round(v * 255)));
    return (n < 16 ? '0' : '') + n.toString(16);
  }
  return '#' + ch(r) + ch(g) + ch(b);
}

function mixHex(c1, c2, t) {
  t = cl(t);
  var a = hexRgb(c1), b = hexRgb(c2);
  return rgbHex(mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t));
}

function lum(hex) {
  var c = hexRgb(hex).map(function (v) {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function dark(hex) { return lum(hex) < 0.45; }

function contrast(a, b) {
  var l1 = lum(a), l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function fitContrast(col, bg, minRatio) {
  minRatio = minRatio || 2.0;
  if (contrast(col, bg) >= minRatio) return col;
  var target = dark(bg) ? '#ffffff' : '#000000';
  for (var i = 1; i <= 10; i++) {
    var m = mixHex(col, target, i / 10);
    if (contrast(m, bg) >= minRatio) return m;
  }
  return target;
}

function accCol(sc, bg, second) {
  bg = bg || sc.bg || '#101010';
  var list = second ? [sc.accent2, sc.accent, sc.fg] : [sc.accent, sc.accent2, sc.fg];
  for (var i = 0; i < list.length; i++) {
    if (list[i] && contrast(list[i], bg) >= 1.8) return list[i];
  }
  return sc.fg || '#ffffff';
}

function transAcc(c, second) {
  var sc = c.sc, pb = (c.previous && c.previous.sc && c.previous.sc.bg) || sc.bg;
  var list = second ? [sc.accent2, sc.accent, sc.fg] : [sc.accent, sc.accent2, sc.fg];
  for (var i = 0; i < list.length; i++) {
    if (list[i] && contrast(list[i], sc.bg) >= 1.8 && contrast(list[i], pb) >= 1.4) return list[i];
  }
  return sc.fg || '#ffffff';
}

function subCol(sc, bg) {
  bg = bg || sc.bg || '#101010';
  if (sc.sub && contrast(sc.sub, bg) >= 1.5) return sc.sub;
  return sc.fg || '#ffffff';
}

function layC(sc, k) { return mixHex(sc.bg || '#101010', sc.fg || '#ffffff', k); }
function tintC(sc, k) { return mixHex(sc.bg || '#101010', sc.accent || sc.fg || '#ffffff', k); }

function textOn(bg, pref, sc) {
  if (pref && contrast(pref, bg) >= 2.6) return pref;
  if (sc && sc.bg && contrast(sc.bg, bg) >= 2.6) return sc.bg;
  if (sc && sc.fg && contrast(sc.fg, bg) >= 2.6) return sc.fg;
  return dark(bg) ? '#ffffff' : '#111111';
}

/* Additional easings used throughout AE packs */
function inOutQuart(x) { x = cl(x); return x < 0.5 ? 8 * x * x * x * x : 1 - 8 * Math.pow(1 - x, 4); }
function outBounce(x) {
  x = cl(x);
  var n = 7.5625, d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) { x -= 1.5 / d; return n * x * x + 0.75; }
  if (x < 2.5 / d) { x -= 2.25 / d; return n * x * x + 0.9375; }
  x -= 2.625 / d;
  return n * x * x + 0.984375;
}
function bell(x) { return Math.sin(Math.PI * cl(x)); }
function smoothstep(a, b, x) { x = cl((x - a) / Math.max(EPS, b - a)); return x * x * (3 - 2 * x); }

/* Motion & fx scale matching AE */
function styleFx(c) { return (c.assembly && c.assembly.style && c.assembly.style.fx) || {}; }
function motionAmt(c) { var fx = styleFx(c); return fx.motion == null ? 0.7 : N.finite(fx.motion, 'fx.motion'); }
function mk(c) { return cl(motionAmt(c) / 0.7, 0, 1.6); }
function decorAmt(c) { var fx = styleFx(c); return fx.decor == null ? 0.65 : N.finite(fx.decor, 'fx.decor'); }
function glitchAmt(c) { var fx = styleFx(c); return fx.glitch == null ? 0.4 : N.finite(fx.glitch, 'fx.glitch'); }

/* Convert design coords (top-left origin, y down) to Cavalry scene coords (center origin, y up). */
function toScene(c, x, y) {
  return [x - c.comp.width / 2, c.comp.height / 2 - y];
}

function roundRectCmds(cx, cy, w, h, r) {
  w = Math.max(0.5, w); h = Math.max(0.5, h);
  r = Math.max(0, Math.min(r || 0, w / 2 - 0.01, h / 2 - 0.01));
  if (r < 0.25) return G.rect(cx - w / 2, cy - h / 2, w, h);
  var x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  var k = 0.5522847498 * r;
  return [
    ['M', x0 + r, y0], ['L', x1 - r, y0],
    ['C', x1 - r + k, y0, x1, y0 + r - k, x1, y0 + r], ['L', x1, y1 - r],
    ['C', x1, y1 - r + k, x1 - r + k, y1, x1 - r, y1], ['L', x0 + r, y1],
    ['C', x0 + r - k, y1, x0, y1 - r + k, x0, y1 - r], ['L', x0, y0 + r],
    ['C', x0, y0 + r - k, x0 + r - k, y0, x0 + r, y0], ['Z']
  ];
}

function rect(c, name, x, y, w, h, paint, parent, range) {
  if (!(w > 0 && h > 0)) return null;
  var W = c.comp.width, H = c.comp.height;
  var rad = paint && paint.round ? paint.round : 0;
  var cmds = rad > 0
    ? roundRectCmds(x + w / 2 - W / 2, H / 2 - (y + h / 2), w, h, rad)
    : G.rect(x - W / 2, H / 2 - (y + h), w, h);
  return C.shape(c.graph, range || c.cut, c.cut.id + ' / ' + name, parent || c.parent, cmds, paint);
}

function circle(c, name, cx, cy, rx, ry, paint, parent, range) {
  if (!(rx > 0 && ry > 0)) return null;
  var p0 = toScene(c, cx, cy);
  return C.shape(c.graph, range || c.cut, c.cut.id + ' / ' + name, parent || c.parent, G.ellipse(p0[0], p0[1], rx, ry), paint);
}

function poly(c, name, points, closed, paint, parent, range) {
  if (!points || points.length < 2) return null;
  var W = c.comp.width, H = c.comp.height;
  var cmds = points.map(function (pt, idx) {
    N.finite(pt[0], 'poly x'); N.finite(pt[1], 'poly y');
    return [idx ? 'L' : 'M', pt[0] - W / 2, H / 2 - pt[1]];
  });
  if (closed) cmds.push(['Z']);
  return C.shape(c.graph, range || c.cut, c.cut.id + ' / ' + name, parent || c.parent, cmds, paint);
}

function line(c, name, points, color, width, alpha, parent, range) {
  if (!points || points.length < 2 || (alpha != null && !(alpha > 0))) return null;
  return poly(c, name, points, false, { stroke: color, width: Math.max(0.5, width || 1), alpha: alpha == null ? 1 : alpha }, parent, range);
}

function arcPts(cx, cy, r, a0Deg, a1Deg, steps) {
  var n = Math.max(4, steps || 24), out = [];
  for (var i = 0; i <= n; i++) {
    var a = (a0Deg + (a1Deg - a0Deg) * i / n) * DEG;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

function starPts(cx, cy, rOuter, rInner, count, rotDeg) {
  var out = [], n = Math.max(3, count || 4), r0 = (rotDeg || 0) * DEG;
  for (var i = 0; i < n * 2; i++) {
    var r = (i % 2 === 0) ? rOuter : rInner;
    var a = r0 + i * Math.PI / n - Math.PI / 2;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

function primaryFont(c, role) {
  if (role && c.options && c.options.decorFonts && c.options.decorFonts[role]) {
    return c.options.decorFonts[role];
  }
  var n0 = c.cut && c.cut.nodes && c.cut.nodes[0];
  if (n0 && n0.font) return V.font(c, n0);
  if (c.options && c.options.fontOverrides) {
    var ks = Object.keys(c.options.fontOverrides);
    if (ks.length) return c.options.fontOverrides[ks[0]];
  }
  return { key: 'body', family: 'Noto Sans', style: 'Regular' };
}

function addText(c, name, str, x, y, size, opts, animFn) {
  opts = opts || {};
  var s = String(str == null ? '' : str);
  if (!s) return null;
  var f = opts.font || primaryFont(c, opts.role);
  var align = opts.align === 'left' ? 0 : opts.align === 'right' ? 2 : 1;
  var range = opts.range || c.cut;
  var start = Math.max(0, range.start), end = Math.min(c.comp.frameCount, range.end);
  if (end <= start) return null;
  var p0 = toScene(c, x, y);
  var id = c.graph.add('textShape', c.cut.id + ' / ' + name, opts.parent || c.parent, start, end, {
    text: s,
    font: { font: f.family, style: f.style },
    fontSize: Math.max(1, size || 16),
    autoWidth: true, autoHeight: true,
    horizontalAlignment: align, verticalAlignment: 1,
    position: p0,
    rotation: -(opts.rotation || 0),
    fill: opts.fill !== false,
    stroke: !!opts.stroke,
    'material.materialColor': opts.color || c.sc.fg,
    'stroke.strokeColor': opts.strokeColor || opts.color || c.sc.fg,
    'stroke.width': opts.strokeWidth || 1,
    alpha: opts.alpha == null ? 1 : opts.alpha
  });
  if (animFn) {
    C.sample(c.graph, id, start, end, function (frame) {
      var res = animFn(R.env(c, frame), frame) || {};
      if (res.text != null) {
        /* Handled cleanly by step key below if text changes; ignore in scalar sampler */
      }
      return res;
    });
  }
  return id;
}

function io(c, frame, inDur) {
  var cut = c.cut;
  var t = (frame - cut.origin) / c.comp.fps;
  var outStart = cut.sourceEnd - cut.outFrames;
  var pout = cl((frame - outStart) / Math.max(1, cut.outFrames));
  return E.outCubic(t / Math.max(0.05, inDur || 0.3)) * (1 - E.inCubic(pout));
}

function pop(c, frame, delay, outToo) {
  var cut = c.cut;
  var t = (frame - cut.origin) / c.comp.fps - (delay || 0);
  var q = cl(t / 0.24);
  var s = q <= 0 ? 0 : E.outBack(q, 1.9);
  if (outToo !== false) {
    var outStart = cut.sourceEnd - cut.outFrames;
    var pout = cl((frame - outStart) / Math.max(1, cut.outFrames));
    s *= (1 - E.inCubic(pout));
  }
  return Math.max(0, s);
}

/* Continuous cross-cut bg clock matching AE/web bgClock */
function bgClock(c, key) {
  var cut = c.cut, fps = c.comp.fps, origin = cut.origin, cuts = c.assembly.cuts;
  var i = cuts.findIndex(function (row) { return row.id === cut.id; });
  var P = (c.preset && c.preset.params) || {};
  while (--i >= 0) {
    var prev = cuts[i], bg = prev.presets && prev.presets.bg;
    if (!bg || bg.name !== key || (bg.params || {}).seed !== P.seed || Math.abs(prev.sourceEnd - origin) / fps >= 0.06) break;
    origin = prev.origin;
  }
  return {
    time: function (f) { return (f - origin) / fps; },
    absTime: function (f) { return f / fps; },
    enter: function (f, dur) { return E.outCubic((f - origin) / fps / (dur || 0.6)); }
  };
}

function fxSpan(c) {
  var P = c.preset && c.preset.params || {};
  var fps = c.comp.fps, fc = c.comp.frameCount;
  var t = N.finite(P.t == null ? 0 : P.t, 'fx.t');
  var dur = Math.max(1 / fps, N.finite(P.dur == null ? 0.25 : P.dur, 'fx.dur'));
  var f0 = Math.max(0, Math.min(fc - 1, Math.round(t * fps)));
  var f1 = Math.max(f0 + 1, Math.min(fc, Math.round((t + dur) * fps)));
  var amp = Math.max(0.05, N.finite(P.amp == null ? 1 : P.amp, 'fx.amp'));
  var sc = (c.assembly.style && c.assembly.style.schemes && c.assembly.style.schemes[0]) || { bg: '#101010', fg: '#ffffff', accent: '#ff5577', accent2: '#55ccff', sub: '#999999' };
  var fx = (c.assembly.style && c.assembly.style.fx) || {};
  var seed = Math.round(t * 1000) ^ (P.seed || 6143);
  return { f0: f0, f1: f1, dur: dur, amp: amp, sc: sc, fx: fx, seed: seed, W: c.comp.width, H: c.comp.height,
    u: Math.min(c.comp.width, c.comp.height) / 1080, fps: fps, fc: fc };
}

function rigTarget(c, key, s) {
  return typeof c.addFxRig === 'function' ? c.addFxRig(key + ' @' + s.f0) : (c.fxRig || c.parent);
}

function fullRect(c, s, name, color, alphaFn) {
  var cut = { start: s.f0, end: s.f1 };
  var id = C.shape(c.graph, cut, name, c.parent, G.rect(-s.W / 2, -s.H / 2, s.W, s.H), { fill: color, alpha: 1 });
  C.sample(c.graph, id, s.f0, s.f1, function (f) {
    var p0 = (f - s.f0) / Math.max(1, s.f1 - s.f0);
    return { alpha: cl(alphaFn(p0, f - s.f0, f)) };
  });
  return id;
}

/* Word segmentation supporting English, Korean Hangul, CJK/Kana, and explicit cut/node words */
function wordsOf(c, gs) {
  var node = c.node, supplied = (node && node.words) || (c.cut && c.cut.words) || (c.cut && c.cut.source && c.cut.source.words);
  var chunks = null;
  if (Array.isArray(supplied) && supplied.length) {
    chunks = supplied.map(String);
    var expected = chunks.join('').replace(/[\s\u3000]/g, '');
    var actual = gs.map(function (g) { return g.ch; }).join('').replace(/[\s\u3000]/g, '');
    if (expected !== actual) chunks = null;
  }
  if (!chunks) {
    var txt = (node && node.text) || '';
    chunks = txt.match(/[A-Za-z0-9\u2019']+|[가-힣]+|[\u3400-\u9FFF]+[\u3040-\u309F]*|[\u30A0-\u30FF\u30FC]+|[\u3040-\u309F]+|[^\s\u3000]/gu) || [];
  }
  var cursor = 0, membership = Object.create(null), words = [];
  chunks.forEach(function (chunk) {
    var chars = Array.from(chunk.replace(/[\s\u3000]/g, ''));
    if (!chars.length) return;
    var members = [];
    while (members.length < chars.length && cursor < gs.length) {
      var g = gs[cursor++];
      if (/^[\s\u3000]$/.test(g.ch)) continue;
      members.push(g);
    }
    if (!members.length) return;
    var b = V.bounds(members);
    var w = { gs: members, b: b, li: members[0].li || 0, index: words.length };
    members.forEach(function (g) { membership[g.i] = w.index; });
    words.push(w);
  });
  return { words: words, membership: membership };
}

/* Wrap a cut group layer with a dedicated transition rig null without touching camera keys. */
function wrapCutRig(c, ctx, label, start, end) {
  var g = c.graph;
  var layer = g.byId[ctx.layerIds[0]];
  var rigStart = Math.min(layer.start, start == null ? layer.start : start);
  var rigEnd = Math.max(layer.end, end == null ? layer.end : end);
  var rigId = g.add('null', layer.name + ' / ' + label, layer.parent, rigStart, rigEnd, {});
  var at = g.layers.indexOf(layer);
  var rig = g.layers.pop();
  g.layers.splice(at, 0, rig);
  layer.parent = rigId;
  ctx.layerIds.push(rigId);
  return rigId;
}

function transWindow(c, defSec, key) {
  if (!c.previous) throw new Error((key || 'transition') + ' requires a preceding cut');
  var P = (c.preset && c.preset.params) || {};
  var dur = P.frames != null ? P.frames
    : (c.preset && c.preset.frames != null ? c.preset.frames : Math.max(2, Math.round((defSec || 0.42) * c.comp.fps)));
  if (!Number.isInteger(dur) || dur < 1) throw new Error('Invalid transition frame count');
  var start = c.cut.start;
  var end = Math.min(c.cut.end, c.comp.frameCount, start + dur);
  if (c.previous.cut.end < start) throw new Error((key || 'transition') + ' cannot bridge an unrendered timeline gap');
  return { P: P, start: start, end: end, dur: dur, a: c.previous, b: c };
}

function extendCut(graph, ctx, end) {
  ctx.layerIds.forEach(function (id) {
    var n = graph.byId[id];
    if (n && n.end === ctx.cut.end) n.end = Math.max(n.end, end);
  });
}

function clipCut(c, ctx, polygons, profile) {
  ctx.layerIds.slice().forEach(function (id) {
    var layer = c.graph.byId[id];
    if (layer && (layer.type === 'path' || layer.type === 'textShape')) {
      S.clip(c.graph, id, polygons, profile);
    }
  });
}

function multiClipCut(c, ctx, contoursByFrame, difference, label, options) {
  ctx.layerIds.slice().forEach(function (id) {
    var layer = c.graph.byId[id];
    if (layer && (layer.type === 'path' || layer.type === 'textShape')) {
      multiClip(c.graph, id, contoursByFrame, difference, label, options);
    }
  });
}

function paintablesOf(graph, ctx) {
  var out = [];
  ctx.layerIds.forEach(function (id) {
    var n = graph.byId[id];
    if (n && (n.type === 'path' || n.type === 'textShape')) out.push(id);
  });
  return out;
}

function scaleCutAlphaDuring(graph, ctx, start, end, fn) {
  ctx.layerIds.forEach(function (id) {
    var n = graph.byId[id];
    if (!n || (n.type !== 'path' && n.type !== 'textShape')) return;
    var base = n.attrs.alpha == null ? 1 : n.attrs.alpha;
    var orig = n.keys.alpha ? V.copy(n.keys.alpha) : null;
    if (!n.keys.alpha) n.keys.alpha = {};
    var f0 = Math.max(n.start, start), f1 = Math.min(n.end, end);
    function origAt(frame) {
      if (!orig) return base;
      if (Object.prototype.hasOwnProperty.call(orig, frame)) return orig[frame].value;
      var keys = Object.keys(orig).map(Number).sort(function (a, b) { return a - b; });
      if (!keys.length) return base;
      var best = keys[0];
      for (var i = 0; i < keys.length; i++) if (keys[i] <= frame) best = keys[i]; else break;
      return orig[best].value;
    }
    for (var f = f0; f < f1; f++) {
      var mul = cl(fn(f), 0, 1);
      n.keys.alpha[f] = { value: cl(origAt(f) * mul, 0, 1), type: 1 };
    }
    if (f1 < n.end && !Object.prototype.hasOwnProperty.call(n.keys.alpha, f1)) {
      n.keys.alpha[f1] = { value: origAt(f1), type: 1 };
    }
  });
}

function hideCutDuring(graph, ctx, start, end) {
  scaleCutAlphaDuring(graph, ctx, start, end, function () { return 0; });
}

/* Multi-polygon JavaScript Deformer clip in scene coordinates (each frame maps to array of closed contours). */
function multiClip(graph, target, contoursByFrame, difference, label, options) {
  var node = graph.byId[target];
  if (!node) throw new Error('Unknown multiClip target ' + target);
  var profile = options && options.hostProfile && options.hostProfile.javaScriptDeformer || { layerType: 'javaScriptDeformer' };
  var method = difference ? 'difference' : 'intersect';
  var frames = Object.create(null);
  for (var f = node.start; f < node.end; f++) {
    var polys = contoursByFrame[f];
    if (!polys) continue;
    var inv = S.inverse(S.matrix(graph, target, f));
    if (!polys.length || !inv) {
      frames[f] = [[[-99999, -99999], [-99998, -99999], [-99999, -99998]]];
    } else {
      frames[f] = polys.map(function (poly) {
        return poly.map(function (pt) {
          var loc = S.point(inv, pt);
          N.finite(loc[0], 'multiClip x'); N.finite(loc[1], 'multiClip y');
          return loc;
        });
      });
    }
  }
  if (!Object.keys(frames).length) return null;
  var expression = [
    '(function(){', 'var F=', JSON.stringify(frames), ';',
    'var polys=F[Math.floor(n0)];', 'if(!polys)return;',
    'var clip=new cavalry.Path();',
    'polys.forEach(function(q){',
    'if(!q||q.length<2)return;',
    'q.forEach(function(p,i){if(i)clip.lineTo(p[0],p[1]);else clip.moveTo(p[0],p[1]);});',
    'clip.close();',
    '});',
    'var depth=def.highestDepthWithPath();', 'var meshes=def.getMeshesAtDepth(depth);',
    'meshes.forEach(function(mesh){', 'for(var i=0;i<mesh.count();i++){',
    'var path=mesh.getPathAtIndex(i);', 'path.' + method + '(clip);', 'mesh.setPathAtIndex(i,path);',
    '}', '});', 'def.setMeshesAtDepth(depth,meshes);', '})();'
  ].join('');
  var id = graph.add(profile.layerType, node.name + ' / ' + (label || 'Multi clip'), target, node.start, node.end,
    { expression: expression, 'array.0': node.start });
  graph.key(id, 'array.0', node.start, node.start, 1);
  if (node.end > node.start + 1) graph.key(id, 'array.0', node.end - 1, node.end - 1, 1);
  graph.connect(id, 'id', target, 'deformers');
  return id;
}

/* Clone a cut subtree into a new parent null for tile/split/overlay transitions.
 * Outgoing cuts whose layers ended at ctx.cut.end (= start) are held at their last pose across [start, end). */
function cloneCutSubtree(graph, ctx, label, start, end, extraLayerIds) {
  var rootLayer = graph.byId[ctx.layerIds[0]];
  var rigId = graph.add('null', ctx.cut.id + ' / ' + label, rootLayer.parent, start, end, {});
  if (extraLayerIds) extraLayerIds.push(rigId);
  var map = Object.create(null);
  var clonedPaintables = [];
  ctx.layerIds.forEach(function (srcId) {
    var src = graph.byId[srcId];
    if (!src) return;
    if (src.type !== 'null' && src.type !== 'path' && src.type !== 'textShape') return;
    if (src.start >= end) return;
    if (src.end < start && src.end !== ctx.cut.end) return;
    if (src.end < start) return;
    var parentId = srcId === ctx.layerIds[0] ? rigId : (map[src.parent] || rigId);
    var s = Math.max(start, src.start);
    var e = src.end === ctx.cut.end ? end : Math.min(end, src.end);
    if (e <= s) return;
    var nid = graph.add(src.type, src.name + ' / ' + label, parentId, s, e,
      V.copy(src.attrs), src.commands ? V.copy(src.commands) : null);
    var dst = graph.byId[nid];
    Object.keys(src.keys).forEach(function (attr) {
      var trk = src.keys[attr], outT = {}, held = null;
      var fkList = Object.keys(trk).map(Number).sort(function (a, b) { return a - b; });
      fkList.forEach(function (f) {
        if (f <= s) held = trk[f];
        if (f >= s && f < e) outT[f] = V.copy(trk[f]);
      });
      if (!Object.prototype.hasOwnProperty.call(outT, s) && held != null) outT[s] = V.copy(held);
      if (Object.keys(outT).length) dst.keys[attr] = outT;
    });
    map[srcId] = nid;
    if (extraLayerIds) extraLayerIds.push(nid);
    if (src.type === 'path' || src.type === 'textShape') clonedPaintables.push(nid);
  });
  return { rigId: rigId, paintables: clonedPaintables };
}

/* Extend C.text once to materialize node._jzTwins after glyph layers are created. */
var prevText = C.text;
C.text = function (graph, cut, node, parent, options, sampler) {
  var ids = prevText(graph, cut, node, parent, options, sampler);
  if (!node || !Array.isArray(node._jzTwins) || !node._jzTwins.length || !ids.length) return ids;
  var gs = V.glyphs(Object.assign({}, { options: options }, { cut: cut }), node);
  node._jzTwins.forEach(function (spec) {
    ids.forEach(function (srcId, idx) {
      var src = graph.byId[srcId];
      if (!src || src.type !== 'textShape') return;
      var clone = V.cloneLayer(graph, srcId, spec.label || 'Twin');
      if (spec.below) {
        var i = graph.layers.indexOf(clone), j = graph.layers.indexOf(src);
        if (i > j && j >= 0) { graph.layers.splice(i, 1); graph.layers.splice(j, 0, clone); }
      }
      if (typeof spec.setup === 'function') spec.setup(graph, clone, src, gs[idx], gs, idx, cut);
    });
  });
  return ids;
};

return {
  EPS: EPS, TAU: TAU, DEG: DEG, cl: cl, mix: mix, E: E,
  p: p, arrN: arrN,
  hexRgb: hexRgb, rgbHex: rgbHex, mixHex: mixHex, lum: lum, dark: dark,
  contrast: contrast, fitContrast: fitContrast, accCol: accCol, transAcc: transAcc, subCol: subCol,
  layC: layC, tintC: tintC, textOn: textOn,
  inOutQuart: inOutQuart, outBounce: outBounce, bell: bell, smoothstep: smoothstep,
  styleFx: styleFx, motionAmt: motionAmt, mk: mk, decorAmt: decorAmt, glitchAmt: glitchAmt,
  toScene: toScene, roundRectCmds: roundRectCmds, rect: rect, circle: circle, poly: poly, line: line,
  arcPts: arcPts, starPts: starPts, primaryFont: primaryFont, addText: addText,
  io: io, pop: pop, bgClock: bgClock, fxSpan: fxSpan, rigTarget: rigTarget, fullRect: fullRect,
  wordsOf: wordsOf, wrapCutRig: wrapCutRig, transWindow: transWindow, extendCut: extendCut,
  clipCut: clipCut, multiClipCut: multiClipCut, paintablesOf: paintablesOf,
  scaleCutAlphaDuring: scaleCutAlphaDuring, hideCutDuring: hideCutDuring,
  multiClip: multiClip, cloneCutSubtree: cloneCutSubtree
};
})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools);
