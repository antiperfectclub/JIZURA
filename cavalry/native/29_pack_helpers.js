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

/* Extend C.text once to materialize node._jzTwins and node._jzPost after glyph layers are created. */
var prevText = C.text;
C.text = function (graph, cut, node, parent, options, sampler) {
  var ids = prevText(graph, cut, node, parent, options, sampler);
  if (!node || !ids.length) return ids;
  var gs = null;
  if (Array.isArray(node._jzTwins) && node._jzTwins.length) {
    gs = V.glyphs(Object.assign({}, { options: options }, { cut: cut }), node);
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
  }
  if (Array.isArray(node._jzPost) && node._jzPost.length) {
    if (!gs) gs = V.glyphs(Object.assign({}, { options: options }, { cut: cut }), node);
    node._jzPost.forEach(function (fn) { fn(graph, ids, gs, cut, parent, options); });
  }
  return ids;
};

/* ---- Shared decor & layout helpers ---- */
function decU(c) { return Math.min(c.comp.width, c.comp.height) / 1080; }
function decMG(c) { return Math.round(Math.min(c.comp.width, c.comp.height) * 0.05); }

function decBB(c) {
  var b = V.rest(c), W = c.comp.width, H = c.comp.height;
  if (!b || !isFinite(b.x0 + b.x1 + b.y0 + b.y1) || !(b.x1 > b.x0 && b.y1 > b.y0)) {
    return { x0: W * 0.35, x1: W * 0.65, y0: H * 0.4, y1: H * 0.6, cx: W / 2, cy: H / 2, w: W * 0.3, h: H * 0.2, boxes: [] };
  }
  var x0 = Math.max(b.x0, -W * 0.1), x1 = Math.min(b.x1, W * 1.1);
  var y0 = Math.max(b.y0, -H * 0.1), y1 = Math.min(b.y1, H * 1.1);
  if (x1 <= x0) { x0 = b.x0; x1 = b.x1; }
  if (y1 <= y0) { y0 = b.y0; y1 = b.y1; }
  return { x0: x0, x1: x1, y0: y0, y1: y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0, boxes: b.boxes || [] };
}

function hitBB(x0, y0, x1, y1, bb, pad) {
  pad = pad || 0;
  return !(x1 < bb.x0 - pad || x0 > bb.x1 + pad || y1 < bb.y0 - pad || y0 > bb.y1 + pad);
}

function cornerSpot(c, bb, w, h, P, mkMul) {
  P = P || {};
  var W = c.comp.width, H = c.comp.height, m = decMG(c) * (mkMul == null ? 1 : mkMul);
  var sx0 = P.right ? 1 : -1, sy0 = P.low ? 1 : -1;
  var order = [[sx0, sy0], [-sx0, sy0], [sx0, -sy0], [-sx0, -sy0]];
  var best = null, bestA = 1e18;
  for (var i = 0; i < order.length; i++) {
    var sx = order[i][0], sy = order[i][1];
    var X = sx > 0 ? W - m - w : m, Y = sy > 0 ? H - m - h : m;
    if (!hitBB(X, Y, X + w, Y + h, bb, 8)) return { x: X, y: Y, cx: X + w / 2, cy: Y + h / 2, ok: true, sx: sx, sy: sy };
    var ov = Math.max(0, Math.min(X + w, bb.x1) - Math.max(X, bb.x0)) * Math.max(0, Math.min(Y + h, bb.y1) - Math.max(Y, bb.y0));
    if (ov < bestA) { bestA = ov; best = { x: X, y: Y, cx: X + w / 2, cy: Y + h / 2, ok: false, sx: sx, sy: sy }; }
  }
  return best;
}

function nearBB(c, bb, w, h, P, gap) {
  P = P || {};
  var W = c.comp.width, H = c.comp.height, m = decMG(c) * 0.8;
  var sx0 = P.right ? 1 : -1, sy0 = P.low ? 1 : -1;
  var order = P.corner ? [[sx0, sy0], [-sx0, sy0], [sx0, -sy0], [-sx0, -sy0]] : [[sx0, sy0], [sx0, -sy0], [-sx0, sy0], [-sx0, -sy0]];
  var tries = [];
  for (var i = 0; i < order.length; i++) {
    var sx = order[i][0], sy = order[i][1];
    var ax = sx > 0 ? bb.x1 - w : bb.x0, ox = sx > 0 ? bb.x1 + gap : bb.x0 - gap - w;
    var ay = sy > 0 ? bb.y1 + gap : bb.y0 - gap - h, iy = sy > 0 ? bb.y1 - h : bb.y0;
    if ((P.v | 0) % 2) tries.push([ox, iy, sx, sy], [ax, ay, sx, sy], [ox, ay, sx, sy]);
    else tries.push([ax, ay, sx, sy], [ox, iy, sx, sy], [ox, ay, sx, sy]);
  }
  for (var j = 0; j < tries.length; j++) {
    var t = tries[j];
    var X = cl(t[0], m, Math.max(m, W - m - w)), Y = cl(t[1], m, Math.max(m, H - m - h));
    if (!hitBB(X, Y, X + w, Y + h, bb, gap * 0.4)) return { x: X, y: Y, cx: X + w / 2, cy: Y + h / 2, ok: true, sx: t[2], sy: t[3] };
  }
  return cornerSpot(c, bb, w, h, P, 1);
}

function freeBand(c, bb, low) {
  var H = c.comp.height, u = decU(c), m = decMG(c);
  var above = bb.y0 - m * 0.5, below = H - m * 0.5 - bb.y1;
  var lo = !!low;
  if ((lo ? below : above) < 60 * u && (lo ? above : below) > (lo ? below : above)) lo = !lo;
  var room = lo ? below : above;
  var d = Math.min(room * 0.5, 40 * u + room * 0.22);
  return { low: lo, room: room, y: lo ? bb.y1 + d : bb.y0 - d };
}

function clearOf(bb, x, y, pad, soft) {
  var dx = Math.max(bb.x0 - pad - x, 0, x - bb.x1 - pad);
  var dy = Math.max(bb.y0 - pad - y, 0, y - bb.y1 - pad);
  return cl(Math.hypot(dx, dy) / Math.max(EPS, soft || 1));
}

function placeBackFrom(c, startCount) {
  var g = c.graph, added = g.layers.splice(startCount);
  if (!added.length) return;
  var anchorIdx = g.layers.length;
  var pfx = c.cut.id + ' / ';
  for (var i = 0; i < g.layers.length; i++) {
    var l = g.layers[i];
    if ((l.type === 'textShape' || l.name.indexOf(pfx + 'Ghost') === 0 || (c.texts && c.texts.indexOf(l.id) >= 0)) && l.start >= c.cut.start && l.end <= c.cut.end) {
      anchorIdx = i;
      break;
    }
  }
  var camIdx = g.layers.indexOf(g.byId[c.parent]);
  if (camIdx >= 0 && anchorIdx <= camIdx) anchorIdx = camIdx + 1;
  g.layers.splice.apply(g.layers, [anchorIdx, 0].concat(added));
}

function segCmds(c, list) {
  var W = c.comp.width, H = c.comp.height, out = [];
  for (var i = 0; i < list.length; i++) {
    var s = list[i];
    if (!s || s.length < 4) continue;
    N.finite(s[0], 'seg x0'); N.finite(s[1], 'seg y0'); N.finite(s[2], 'seg x1'); N.finite(s[3], 'seg y1');
    out.push(['M', s[0] - W / 2, H / 2 - s[1]], ['L', s[2] - W / 2, H / 2 - s[3]]);
  }
  return out;
}

function polyCmds(c, polysList, closed) {
  var W = c.comp.width, H = c.comp.height, out = [];
  for (var i = 0; i < polysList.length; i++) {
    var pts = polysList[i];
    if (!pts || pts.length < 2) continue;
    for (var j = 0; j < pts.length; j++) {
      N.finite(pts[j][0], 'poly x'); N.finite(pts[j][1], 'poly y');
      out.push([j ? 'L' : 'M', pts[j][0] - W / 2, H / 2 - pts[j][1]]);
    }
    if (closed) out.push(['Z']);
  }
  return out;
}

function rectCmds(c, rectsList) {
  var W = c.comp.width, H = c.comp.height, out = [];
  for (var i = 0; i < rectsList.length; i++) {
    var r = rectsList[i];
    if (!r || !(r[2] > 0 && r[3] > 0)) continue;
    var cmds = G.rect(r[0] - W / 2, H / 2 - (r[1] + r[3]), r[2], r[3]);
    for (var j = 0; j < cmds.length; j++) out.push(cmds[j]);
  }
  return out;
}

function dotCmds(c, dotsList) {
  var W = c.comp.width, H = c.comp.height, out = [];
  for (var i = 0; i < dotsList.length; i++) {
    var d = dotsList[i];
    if (!d || !(d[2] > 0.05)) continue;
    var cmds = G.ellipse(d[0] - W / 2, H / 2 - d[1], d[2], d[2]);
    for (var j = 0; j < cmds.length; j++) out.push(cmds[j]);
  }
  return out;
}

function ringCmds(c, ringsList, segsN) {
  var W = c.comp.width, H = c.comp.height, out = [], n = segsN || 28;
  for (var i = 0; i < ringsList.length; i++) {
    var rg = ringsList[i], r = rg[2];
    if (!(r > 0.05)) continue;
    var cx = rg[0] - W / 2, cy = H / 2 - rg[1];
    for (var k = 0; k <= n; k++) {
      var a = k / n * TAU;
      out.push([k ? 'L' : 'M', cx + Math.cos(a) * r, cy - Math.sin(a) * r]);
    }
    out.push(['Z']);
  }
  return out;
}

function partPts(pts, e0, e1) {
  e0 = cl(e0); e1 = cl(e1);
  if (e1 <= e0 || !pts || pts.length < 2) return [];
  var d = [0];
  for (var i = 1; i < pts.length; i++) {
    d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  var L = d[d.length - 1]; if (!(L > 0)) return [];
  var A = e0 * L, B = e1 * L;
  function at(s) {
    var idx = 1;
    while (idx < d.length - 1 && d[idx] < s) idx++;
    var k = cl((s - d[idx - 1]) / Math.max(EPS, d[idx] - d[idx - 1]));
    return [mix(pts[idx - 1][0], pts[idx][0], k), mix(pts[idx - 1][1], pts[idx][1], k)];
  }
  var out = [at(A)];
  for (var j = 1; j < pts.length - 1; j++) if (d[j] > A && d[j] < B) out.push(pts[j]);
  out.push(at(B));
  return out;
}

function lyricChar(c, salt) {
  var n0 = c.cut.nodes && c.cut.nodes[0];
  var txt = (c.cut.source && c.cut.source.text) || (n0 && n0.text) || '';
  var arr = Array.from(String(txt)).filter(function (ch) { return ch.trim() && !/^[\s\u3000.,!?。、！？「」『』()（）\[\]【】…—\-]$/.test(ch); });
  if (!arr.length) return '';
  var kan = arr.filter(function (ch) { return /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(ch); });
  var pool = kan.length ? kan : arr;
  return pool[R.hash(c.cut.seed || (c.preset && c.preset.params && c.preset.params.seed) || 1, salt | 0, 5) % pool.length];
}

function stepText(c, name, x, y, size, opts, textAtFrame, maxSlices) {
  opts = opts || {};
  var range = opts.range || c.cut;
  var s0 = Math.max(0, range.start), e0 = Math.min(c.comp.frameCount, range.end);
  if (e0 <= s0) return [];
  var runs = [], cur = null;
  for (var f = s0; f < e0; f++) {
    var str = String(textAtFrame(R.env(c, f), f) || '');
    if (!cur || cur.text !== str) {
      cur = { text: str, start: f, end: f + 1 };
      runs.push(cur);
    } else {
      cur.end = f + 1;
    }
  }
  var lim = maxSlices || 12;
  if (runs.length > lim) {
    var merged = [], step = Math.ceil((e0 - s0) / lim);
    for (var sf = s0; sf < e0; sf += step) {
      var ef = Math.min(e0, sf + step);
      var mid = Math.floor((sf + ef - 1) / 2);
      var sMid = String(textAtFrame(R.env(c, mid), mid) || '');
      merged.push({ text: sMid, start: sf, end: ef });
    }
    runs = merged;
  }
  var ids = [];
  for (var i = 0; i < runs.length; i++) {
    var rn = runs[i];
    if (!rn.text) continue;
    var subOpts = Object.assign({}, opts, { range: { start: rn.start, end: rn.end } });
    var id = addText(c, name + (runs.length > 1 ? ' #' + i : ''), rn.text, x, y, size, subOpts, opts.animFn);
    if (id) ids.push(id);
  }
  return ids;
}

function sampleShape(c, name, cmdsFn, paint, alphaFn, parent) {
  var cut = c.cut;
  if (!(cut.end > cut.start)) return null;
  var f0 = Math.floor((cut.start + cut.end) / 2);
  var baseCmds = cmdsFn(R.env(c, f0), f0);
  if (!baseCmds || baseCmds.length < 2) {
    for (var t = cut.start; t < cut.end; t++) {
      baseCmds = cmdsFn(R.env(c, t), t);
      if (baseCmds && baseCmds.length >= 2) break;
    }
  }
  if (!baseCmds || baseCmds.length < 2) return null;
  var id = C.shape(c.graph, cut, cut.id + ' / ' + name, parent || c.parent, baseCmds, paint);
  if (alphaFn) {
    C.sample(c.graph, id, cut.start, cut.end, function (frame) {
      return alphaFn(R.env(c, frame), frame);
    });
  }
  return id;
}

/* ---- Shared layout helpers (measurement, splitting, node creation, centered animated vector primitives) ---- */
function layBase(c) {
  var ns = c.cut && c.cut.nodes;
  if (ns && ns.length) {
    return ns.slice().sort(function (a, b) { return (b.size || 0) - (a.size || 0); })[0];
  }
  return {
    id: (c.cut && c.cut.id || 'cut') + '-t0',
    text: String((c.cut && c.cut.source && c.cut.source.text) || ''),
    font: primaryFont(c),
    x: c.comp.width / 2, y: c.comp.height / 2,
    size: Math.max(12, Math.min(c.comp.width, c.comp.height) * 0.1),
    sx: 1, rotation: 0, delayFrames: 0, track: 0.04, lead: 1.2, align: 'center',
    color: (c.sc && c.sc.fg) || '#ffffff'
  };
}
function layText(c) {
  var n0 = c.cut && c.cut.nodes && c.cut.nodes[0];
  var s = (c.cut && c.cut.source && c.cut.source.text) || (n0 && n0.text) || '';
  return String(s).trim();
}
function layLineText(c) {
  var s = (c.cut && c.cut.source && c.cut.source.lineText) || layText(c);
  return String(s).trim();
}
function layNote(c) {
  var src = c.cut && c.cut.source;
  return String((src && (src.note || src.romaji)) || '').trim();
}
function layStrip(s) { return String(s || '').replace(/[\s\u3000]+/g, ''); }
function layHasLatin(s) { return /[A-Za-z]/.test(String(s || '')); }
function layFlat(s) { return layHasLatin(s) ? String(s || '').trim().replace(/[\s\u3000]+/g, ' ') : layStrip(s); }
function layPad2(n) { return String(Math.max(0, n | 0)).padStart(2, '0'); }
function layLineNo(c) { return layPad2(((c.cut && c.cut.source && c.cut.source.line) | 0) + 1); }
function laySeed(c) { return ((c.cut && c.cut.source && c.cut.source.seed) || (c.cut && c.cut.seed) || 1) | 0; }
function layAltCopy(c) {
  var t = layStrip(layText(c)), lt = layLineText(c);
  if (lt && layStrip(lt) !== t) return layFlat(lt);
  var nt = layNote(c);
  if (nt) return nt;
  return 'No.' + layLineNo(c);
}
function layFmtTime(sec) {
  var s = Math.max(0, sec || 0);
  return layPad2(Math.floor(s / 60)) + ':' + layPad2(Math.floor(s % 60));
}
function layIsPunct(ch) { return /^[.,!?;:\-'"()\u3001\u3002\uff0c\uff0e\uff01\uff1f\u30fb\u2026\u2025\u300c\u300d\u300e\u300f\uff08\uff09\u3010\u3011\[\]\u2018\u2019\u201c\u201d]$/.test(ch); }
function layIsSmall(ch) { return '\u3041\u3043\u3045\u3047\u3049\u3063\u3083\u3085\u3087\u308e\u30a1\u30a3\u30a5\u30a7\u30a9\u30c3\u30e3\u30e5\u30e7\u30ee\u30f5\u30f6\u30fc'.indexOf(ch) >= 0; }
function layIsKanji(ch) { return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(ch); }
function laySplitLines(text, maxPer) {
  var s = String(text || '').trim();
  if (!s) return '';
  if (s.indexOf('\n') >= 0) return s;
  maxPer = Math.max(1, maxPer | 0);
  var arr = Array.from(s);
  if (arr.length <= maxPer) return s;
  if (/\s/.test(s)) {
    var ws = s.split(/[\s\u3000]+/).filter(Boolean);
    if (ws.length > 1) {
      var nL = Math.min(ws.length, Math.max(2, Math.ceil(arr.length / maxPer)));
      var per = arr.length / nL, lines = [], cur = '';
      ws.forEach(function (w) {
        if (cur && Array.from(cur + ' ' + w).length > Math.max(maxPer, Math.ceil(per)) && lines.length < nL - 1) {
          lines.push(cur); cur = w;
        } else {
          cur = cur ? cur + ' ' + w : w;
        }
      });
      if (cur) lines.push(cur);
      return lines.join('\n');
    }
  }
  var nLines = Math.ceil(arr.length / maxPer), step = arr.length / nLines;
  var out = [], idx = 0;
  for (var l = 1; l < nLines; l++) {
    var tgt = Math.round(step * l);
    if (tgt <= idx) tgt = idx + 1;
    while (tgt < arr.length - 1 && (layIsSmall(arr[tgt]) || layIsPunct(arr[tgt]))) tgt++;
    out.push(arr.slice(idx, tgt).join(''));
    idx = tgt;
  }
  if (idx < arr.length) out.push(arr.slice(idx).join(''));
  return out.filter(Boolean).join('\n');
}
function laySplitK(text, k) {
  var s = String(text || '').trim();
  if (!s) return [''];
  k = Math.max(1, k | 0);
  if (k === 1) return [s];
  if (/\s/.test(s)) {
    var ws = s.split(/[\s\u3000]+/).filter(Boolean);
    if (ws.length >= k) {
      var out = [], per = ws.length / k, prev = 0;
      for (var i = 1; i <= k; i++) {
        var next = i === k ? ws.length : Math.min(ws.length - (k - i), Math.max(prev + 1, Math.round(per * i)));
        out.push(ws.slice(prev, next).join(' '));
        prev = next;
      }
      return out.filter(Boolean);
    }
  }
  var arr = Array.from(layStrip(s));
  if (arr.length <= 1) return [s];
  var kk = Math.min(k, arr.length), res = [], p0 = 0;
  for (var j = 1; j <= kk; j++) {
    var p1 = j === kk ? arr.length : Math.min(arr.length - (kk - j), Math.max(p0 + 1, Math.round(arr.length * j / kk)));
    res.push(arr.slice(p0, p1).join(''));
    p0 = p1;
  }
  return res.filter(Boolean);
}
function layChars(text) {
  var s = layStrip(text);
  return s ? Array.from(s) : Array.from(String(text || ' ')).slice(0, 1);
}
function layFontObj(c, role) {
  var base = layBase(c);
  if (role && c.options && c.options.decorFonts && c.options.decorFonts[role]) {
    return c.options.decorFonts[role];
  }
  return base.font || primaryFont(c, role);
}
function layMeasure(c, text, size, opts) {
  opts = opts || {};
  var s = String(text || '');
  if (!s) return { w: 1, h: 1, cx: 0, cy: 0, gs: [] };
  var sz = Math.max(1, size || 24), sx = opts.sx == null ? 1 : Math.abs(opts.sx), sy = opts.sy == null ? 1 : Math.abs(opts.sy);
  var f = opts.font || layFontObj(c, opts.role);
  var probe = {
    id: '_probe', text: s, font: f, x: 0, y: 0, size: sz,
    sx: 1, rotation: 0, delayFrames: 0,
    track: opts.track == null ? 0.04 : opts.track,
    lead: opts.lead == null ? 1.2 : opts.lead,
    vertical: !!opts.vertical, align: opts.align || 'center'
  };
  var gs = C.glyphs(probe, V.font(c, probe));
  if (!gs.length) return { w: sz * sx, h: sz * sy, cx: 0, cy: 0, gs: [] };
  var b = V.bounds(gs);
  return { w: Math.max(1, b.w * sx), h: Math.max(1, b.h * sy), cx: b.cx * sx, cy: b.cy * sy, gs: gs };
}
function layFitSize(c, text, maxW, maxH, opts) {
  opts = opts || {};
  var m0 = layMeasure(c, text, 100, opts);
  var kw = Math.max(1, maxW || c.comp.width * 0.8) / Math.max(1, m0.w);
  var kh = Math.max(1, maxH || c.comp.height * 0.5) / Math.max(1, m0.h);
  var sz = 100 * Math.min(kw, kh);
  if (opts.maxSize != null) sz = Math.min(sz, opts.maxSize);
  sz = Math.max(opts.minSize || 6, sz);
  return N.finite(sz, 'layFitSize');
}
function laySetNodes(c, specs) {
  var base = layBase(c), maxDelay = Math.max(0, c.cut.end - c.cut.origin - 1);
  var list = [];
  for (var i = 0; i < specs.length; i++) {
    var sp = specs[i];
    var txt = sp && sp.text != null ? String(sp.text) : '';
    if (!txt || !txt.trim()) continue;
    var n = V.copy(base);
    n.id = base.id + '-l' + i;
    n.text = txt;
    n.font = sp.font || base.font;
    n.x = N.finite(sp.x == null ? c.comp.width / 2 : sp.x, 'node.x');
    n.y = N.finite(sp.y == null ? c.comp.height / 2 : sp.y, 'node.y');
    n.size = Math.max(4, N.finite(sp.size == null ? base.size : sp.size, 'node.size'));
    n.sx = N.finite(sp.sx == null ? 1 : sp.sx, 'node.sx');
    n.rotation = N.finite(sp.rot != null ? sp.rot : (sp.rotation || 0), 'node.rotation');
    n.align = sp.align || 'center';
    n.vertical = !!sp.vertical;
    n.track = N.finite(sp.track == null ? 0.04 : sp.track, 'node.track');
    n.lead = N.finite(sp.lead == null ? 1.2 : sp.lead, 'node.lead');
    n.color = sp.color || base.color || c.sc.fg;
    if (sp.mi != null) n.mi = sp.mi;
    var df = sp.delayFrames != null ? Math.round(sp.delayFrames)
      : sp.delaySec != null ? Math.round(sp.delaySec * c.comp.fps) : (base.delayFrames || 0);
    n.delayFrames = Math.max(0, Math.min(maxDelay, df));
    delete n.glyphs;
    n.glyphs = V.glyphs(c, n);
    (function (spec, nd) {
      var needPost = (spec.sy != null && spec.sy !== 1) || spec.fill === false || spec.stroke ||
        (spec.alpha != null && spec.alpha < 1) || spec.animPlace || spec.clipRectFn || spec.clipPolyFn || spec.post;
      if (!needPost) return;
      nd._jzPost = nd._jzPost || [];
      nd._jzPost.push(function (graph, ids, gs, cut, parent, options) {
        if (!ids.length) return;
        var g0 = graph.byId[ids[0]];
        var placeId = g0 && g0.parent;
        var place = placeId && graph.byId[placeId];
        if (spec.fill === false || spec.stroke) {
          ids.forEach(function (id) {
            var l = graph.byId[id];
            if (!l) return;
            l.attrs.fill = spec.fill === true;
            l.attrs.stroke = true;
            l.attrs['stroke.strokeColor'] = spec.strokeColor || nd.color;
            l.attrs['stroke.width'] = Math.max(0.5, spec.strokeWidth || Math.max(1.2, nd.size * 0.02));
          });
        }
        if (spec.alpha != null && spec.alpha < 1) {
          var mul = cl(spec.alpha, 0, 1);
          ids.forEach(function (id) {
            var l = graph.byId[id];
            if (!l) return;
            if (l.keys.alpha) Object.keys(l.keys.alpha).forEach(function (f) { l.keys.alpha[f].value *= mul; });
            else l.attrs.alpha = (l.attrs.alpha == null ? 1 : l.attrs.alpha) * mul;
          });
        }
        if (spec.sy != null && spec.sy !== 1 && place && !spec.animPlace) {
          place.attrs.scale = [nd.sx, spec.sy];
        }
        if (spec.animPlace && place) {
          var bpx = nd.x - c.comp.width / 2, bpy = c.comp.height / 2 - nd.y;
          var bsy = spec.sy == null ? 1 : spec.sy;
          C.sample(graph, placeId, place.start, place.end, function (f) {
            var o = spec.animPlace(R.env(c, f), f) || {};
            var sc0 = o.s == null ? 1 : o.s;
            var res = {
              'position.x': o.x != null ? o.x - c.comp.width / 2 : bpx + (o.dx || 0),
              'position.y': o.y != null ? c.comp.height / 2 - o.y : bpy - (o.dy || 0),
              rotation: -(nd.rotation || 0) - (o.rot || 0),
              'scale.x': nd.sx * sc0 * (o.sx == null ? 1 : o.sx),
              'scale.y': bsy * sc0 * (o.sy == null ? 1 : o.sy)
            };
            if (o.a != null) res.alpha = cl(o.a, 0, 1);
            return res;
          });
        }
        if (spec.clipRectFn || spec.clipPolyFn) {
          var polys = Object.create(null);
          var f0 = g0.start, f1 = g0.end;
          for (var f = f0; f < f1; f++) {
            var env = R.env(c, f);
            var pts = null;
            if (spec.clipPolyFn) {
              var raw = spec.clipPolyFn(env, f);
              if (raw && raw.length >= 3) pts = raw.map(function (pt) { return [pt[0] - c.comp.width / 2, c.comp.height / 2 - pt[1]]; });
            } else {
              var rc = spec.clipRectFn(env, f);
              if (rc && rc[2] > rc[0] && rc[3] > rc[1]) {
                pts = [
                  [rc[0] - c.comp.width / 2, c.comp.height / 2 - rc[1]],
                  [rc[2] - c.comp.width / 2, c.comp.height / 2 - rc[1]],
                  [rc[2] - c.comp.width / 2, c.comp.height / 2 - rc[3]],
                  [rc[0] - c.comp.width / 2, c.comp.height / 2 - rc[3]]
                ];
              }
            }
            polys[f] = pts || [[-99999, -99999], [-99998, -99999], [-99999, -99998]];
          }
          var prof = options && options.hostProfile && options.hostProfile.javaScriptDeformer;
          ids.forEach(function (id) { S.clip(graph, id, polys, prof); });
        }
        if (typeof spec.post === 'function') spec.post(graph, ids, gs, cut, parent, options, placeId);
      });
    })(sp, n);
    list.push(n);
  }
  if (!list.length) {
    var fb = V.copy(base);
    fb.id = base.id + '-fb';
    delete fb.glyphs; fb.glyphs = V.glyphs(c, fb);
    list.push(fb);
  }
  c.cut.nodes = list;
  return list;
}
function laySampleAt(c, id, cx, cy, animFn, baseAlpha) {
  if (!id || !animFn) return id;
  var p0 = toScene(c, cx, cy), ba = baseAlpha == null ? 1 : baseAlpha;
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
    var o = animFn(R.env(c, f), f) || {}, s = o.s == null ? 1 : o.s;
    var res = {};
    if (o.x != null || o.dx != null) res['position.x'] = o.x != null ? o.x - c.comp.width / 2 : p0[0] + (o.dx || 0);
    if (o.y != null || o.dy != null) res['position.y'] = o.y != null ? c.comp.height / 2 - o.y : p0[1] - (o.dy || 0);
    if (o.rot != null) res.rotation = -o.rot;
    if (o.s != null || o.sx != null) res['scale.x'] = s * (o.sx == null ? 1 : o.sx);
    if (o.s != null || o.sy != null) res['scale.y'] = s * (o.sy == null ? 1 : o.sy);
    if (o.a != null) res.alpha = cl(o.a * ba, 0, 1);
    return res;
  });
  return id;
}
function layRectAt(c, name, cx, cy, w, h, paint, animFn, parent) {
  if (!(w > 0 && h > 0)) return null;
  var rad = paint && paint.round ? paint.round : 0;
  var cmds = rad > 0 ? roundRectCmds(0, 0, w, h, rad) : G.rect(-w / 2, -h / 2, w, h);
  var p = paint && typeof paint === 'object' ? Object.assign({}, paint) : { fill: paint };
  var ba = p.alpha == null ? 1 : p.alpha;
  if (animFn && !(ba > 0)) p.alpha = 1;
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / ' + name, parent || c.parent, cmds, p);
  c.graph.byId[id].attrs.position = toScene(c, cx, cy);
  if (p.rot) c.graph.byId[id].attrs.rotation = -p.rot;
  return laySampleAt(c, id, cx, cy, animFn, ba);
}
function layRRect(c, name, x, y, w, h, r, paint, animFn, parent) {
  var p = paint && typeof paint === 'object' ? Object.assign({}, paint, { round: r || 0 }) : { fill: paint, round: r || 0 };
  return layRectAt(c, name, x + w / 2, y + h / 2, w, h, p, animFn, parent);
}
function layCircleAt(c, name, cx, cy, rx, ry, paint, animFn, parent) {
  if (!(rx > 0 && ry > 0)) return null;
  var p = paint && typeof paint === 'object' ? Object.assign({}, paint) : { fill: paint };
  var ba = p.alpha == null ? 1 : p.alpha;
  if (animFn && !(ba > 0)) p.alpha = 1;
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / ' + name, parent || c.parent, G.ellipse(0, 0, rx, ry), p);
  c.graph.byId[id].attrs.position = toScene(c, cx, cy);
  return laySampleAt(c, id, cx, cy, animFn, ba);
}
function layPolyAt(c, name, cx, cy, pts, closed, paint, animFn, parent) {
  if (!pts || pts.length < 2) return null;
  var cmds = pts.map(function (pt, idx) {
    N.finite(pt[0], 'layPoly x'); N.finite(pt[1], 'layPoly y');
    return [idx ? 'L' : 'M', pt[0] - cx, cy - pt[1]];
  });
  if (closed !== false) cmds.push(['Z']);
  var p = paint && typeof paint === 'object' ? Object.assign({}, paint) : { fill: paint };
  var ba = p.alpha == null ? 1 : p.alpha;
  if (animFn && !(ba > 0)) p.alpha = 1;
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / ' + name, parent || c.parent, cmds, p);
  c.graph.byId[id].attrs.position = toScene(c, cx, cy);
  return laySampleAt(c, id, cx, cy, animFn, ba);
}
function layPlateCol(sc, pref, against, minR) {
  var bgc = against || sc.bg || '#101010', mr = minR || 1.5;
  for (var i = 0; i < pref.length; i++) if (pref[i] && contrast(pref[i], bgc) >= mr) return pref[i];
  return contrast(sc.fg || '#ffffff', bgc) >= contrast(sc.bg || '#101010', bgc) ? (sc.fg || '#ffffff') : (sc.bg || '#101010');
}
function layPaper(c, name, x, y, w, h, r, fill, edgeCol, shadowK, animFn) {
  var dk = lum(c.sc.fg || '#ffffff') > lum(c.sc.bg || '#101010') ? (c.sc.bg || '#101010') : (c.sc.fg || '#101010');
  var sh = Math.min(c.comp.width, c.comp.height) * (shadowK == null ? 0.01 : shadowK);
  if (sh > 0.5) layRRect(c, name + ' shadow', x + sh * 0.6, y + sh, w, h, r, { fill: mixHex(c.sc.bg || '#101010', dk, 0.7), alpha: dark(c.sc.bg) ? 0.45 : 0.2 }, animFn);
  var p = { fill: fill, alpha: 1 };
  if (edgeCol) { p.stroke = edgeCol; p.width = Math.max(1, Math.min(c.comp.width, c.comp.height) * 0.0018); }
  return layRRect(c, name, x, y, w, h, r, p, animFn);
}
function layTin(c, frame, d, len, easeFn) {
  var t = (frame - c.cut.origin) / c.comp.fps;
  return (easeFn || E.outExpo)(cl((t - (d || 0)) / Math.max(0.01, len || 0.4)));
}
function layTout(c, frame) {
  var pout = cl((frame - c.cut.sourceEnd + c.cut.outFrames) / Math.max(1, c.cut.outFrames));
  return 1 - E.inCubic(pout);
}

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
  multiClip: multiClip, cloneCutSubtree: cloneCutSubtree,
  decU: decU, decMG: decMG, decBB: decBB, hitBB: hitBB, cornerSpot: cornerSpot, nearBB: nearBB,
  freeBand: freeBand, clearOf: clearOf, placeBackFrom: placeBackFrom,
  segCmds: segCmds, polyCmds: polyCmds, rectCmds: rectCmds, dotCmds: dotCmds, ringCmds: ringCmds,
  partPts: partPts, lyricChar: lyricChar, stepText: stepText, sampleShape: sampleShape,
  layBase: layBase, layText: layText, layLineText: layLineText, layNote: layNote,
  layStrip: layStrip, layHasLatin: layHasLatin, layFlat: layFlat, layPad2: layPad2,
  layLineNo: layLineNo, laySeed: laySeed, layAltCopy: layAltCopy, layFmtTime: layFmtTime,
  layIsPunct: layIsPunct, layIsSmall: layIsSmall, layIsKanji: layIsKanji,
  laySplitLines: laySplitLines, laySplitK: laySplitK, layChars: layChars, layFontObj: layFontObj,
  layMeasure: layMeasure, layFitSize: layFitSize, laySetNodes: laySetNodes,
  laySampleAt: laySampleAt, layRectAt: layRectAt, layRRect: layRRect, layCircleAt: layCircleAt,
  layPolyAt: layPolyAt, layPlateCol: layPlateCol, layPaper: layPaper, layTin: layTin, layTout: layTout
};
})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools);
