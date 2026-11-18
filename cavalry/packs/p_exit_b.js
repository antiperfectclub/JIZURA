/* 55 exit recipes from horror2 (7), x2_horrorB (8), kinetic2 (8), x2_kineticB (8), typo2 (8), x2_typoB (8), x2_waB (8). */
(function (N, G, C, R, V, S, H) {
'use strict';

var E = R.E, cl = R.clamp, mix = R.mix, st = R.stagger, TAU = R.T, PI = Math.PI, DEG = PI / 180, rand = N.random;
var HIDE = { hide: true };

function oQuad(x) { x = cl(x); return 1 - (1 - x) * (1 - x); }
function oCubic(x) { return 1 - Math.pow(1 - cl(x), 3); }
function iQuad(x) { x = cl(x); return x * x; }
function iCubic(x) { x = cl(x); return x * x * x; }
function ioCubic(x) { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function ioSine(x) { return -(Math.cos(PI * cl(x)) - 1) / 2; }
function stg(p, k, spread) { return cl((p - spread * k) / Math.max(0.01, 1 - spread)); }
function stgN(p, k, n, spread) { return cl((p - (n > 1 ? k / (n - 1) : 0) * spread) / Math.max(0.01, 1 - spread)); }
function frac(x) { return x - Math.floor(x); }
function rs(a, b, c2, d) { return rand(a, b, c2, d) * 2 - 1; }
function seedOf(c) { return c.node.seed == null ? ((c.cut.source || {}).seed || 1) : c.node.seed; }
function cutSeed(c) { return (c.cut && c.cut.seed) || seedOf(c); }
function isBlank(ch) { return /^[\s\u3000]$/.test(ch); }
function nonSpace(gs) { return gs.filter(function (g) { return !isBlank(g.ch); }); }
function cutN(c) { return Array.from(String((c.cut && c.cut.text) || (c.node && c.node.text) || '').replace(/[\s\u3000]/g, '')).length || 1; }
function soloInfo(c, gs) {
  var plain = nonSpace(gs), cn = cutN(c);
  return { solo: plain.length <= 1 && cn > 1, mi: Math.round(+c.node.mi || 0), cn: cn };
}
function isPrimary(c, gs) {
  return (c.node.alpha == null ? 1 : c.node.alpha) >= 0.85 && c.node.fill !== false && !(nonSpace(gs).length <= 1 && cutN(c) > 2);
}
function ordAt(c, gs, i) {
  var plain = nonSpace(gs), n = plain.length;
  if (n <= 1) { var cn = cutN(c); return cn > 1 ? cl((+c.node.mi || 0) / (cn - 1)) : 0; }
  for (var k = 0; k < n; k++) if (plain[k].i === i) return k / (n - 1);
  return gs.length > 1 ? i / (gs.length - 1) : 0;
}
function idxAt(c, gs, i) {
  var plain = nonSpace(gs), cn = cutN(c);
  if (plain.length <= 1 && cn > 1) return Math.min(cn - 1, Math.round(+c.node.mi || 0));
  return i;
}
function isKanji(ch) { return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(ch || ''); }
function keyGlyph(gs) {
  var best = -1, bl = 0, wb = -1, wl = 0;
  for (var i = 0; i < gs.length; i++) {
    if (!isKanji(gs[i].ch)) continue;
    var j = i; while (j < gs.length && isKanji(gs[j].ch)) j++;
    if (j - i > bl) { bl = j - i; best = i; }
    i = j;
  }
  if (best >= 0) return gs[best].i;
  for (var i2 = 0; i2 < gs.length; i2++) {
    if (!/[A-Za-z0-9]/.test(gs[i2].ch)) continue;
    var j2 = i2; while (j2 < gs.length && /[A-Za-z0-9'\u2019]/.test(gs[j2].ch)) j2++;
    if (j2 - i2 > wl) { wl = j2 - i2; wb = i2; }
    i2 = j2;
  }
  if (wb >= 0) return gs[wb].i;
  for (var k = 0; k < gs.length; k++) if (!isBlank(gs[k].ch)) return gs[k].i;
  return gs.length ? gs[0].i : 0;
}
function nightCol(sc) { return H.mixHex(sc.bg || '#101010', '#000000', H.dark(sc.bg || '#101010') ? 0.72 : 0.9); }
function hotOf(c) {
  var sc = c.sc, col = c.node.color || sc.fg || '#ffffff';
  if (col === sc.accent) return sc.accent2 || sc.fg || '#ffffff';
  return sc.accent || sc.accent2 || sc.fg || '#ffffff';
}
function sealOf(sc, col) {
  var list = [sc.accent, sc.accent2, sc.fg];
  for (var i = 0; i < list.length; i++) if (list[i] && list[i] !== col && H.contrast(list[i], sc.bg || '#101010') >= 1.5) return list[i];
  for (var j = 0; j < list.length; j++) if (list[j] && list[j] !== col) return list[j];
  return sc.fg || '#ffffff';
}
function quietOf(sc, col) {
  if (sc.sub && H.contrast(sc.sub, sc.bg || '#101010') >= 1.4) return sc.sub;
  return H.mixHex(sc.bg || '#101010', col, 0.5);
}
function rot2(x, y, deg) { var a = deg * DEG, c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; }
function gcx(g, node) { return (g.x + (g.vx || 0)) * (node.sx == null ? 1 : node.sx); }
function gcy(g, node) { return g.y + (g.vy || 0); }
function kick(t, k, f) { return t <= 0 ? 0 : Math.exp(-(k || 9) * t) * Math.sin((f || 26) * t); }

function setKey(graph, id, attr, f, v, type) {
  var n = graph.byId[id];
  if (typeof v === 'number') N.finite(v, attr);
  if (!n.keys[attr]) n.keys[attr] = {};
  n.keys[attr][f] = { value: v, type: type == null ? 1 : type };
}
function getKeyVal(n, attr, f, fallback) {
  var trk = n.keys[attr];
  if (trk && Object.prototype.hasOwnProperty.call(trk, f)) return trk[f].value;
  return n.attrs[attr] == null ? fallback : n.attrs[attr];
}
function outRange(c) {
  var start = Math.max(c.cut.start, c.cut.sourceEnd - Math.max(1, c.cut.outFrames));
  var end = c.cut.end;
  return { start: start, end: end, ok: end > start };
}
function poutAt(c, f) { return V.envelope(c, c.node, f).pout; }
function post(c, fn) { (c.node._jzPost = c.node._jzPost || []).push(fn); }
function regPost(key, source, setupFn, diffs) {
  N.register('exit', key, {
    source: source + ' / exit:' + key, scope: 'node', differences: diffs || [],
    build: function (c) { setupFn(c); return function () {}; }
  });
}
function applyState(s, o, g) {
  if (!o) return;
  if (o.hide) { s.a = 0; return; }
  s.dx += o.dx || 0; s.dy += o.dy || 0; s.rot += o.rot || 0;
  var sc = o.s == null ? 1 : o.s;
  s.sx *= sc * (o.sx == null ? 1 : o.sx);
  s.sy *= sc * (o.sy == null ? 1 : o.sy);
  s.a *= o.a == null ? 1 : o.a;
  if (o.clipX || o.clipY) {
    var cx0 = o.clipX ? o.clipX[0] : -2, cx1 = o.clipX ? o.clipX[1] : 2;
    var cy0 = o.clipY ? o.clipY[0] : -2, cy1 = o.clipY ? o.clipY[1] : 2;
    var hw = Math.max(2, g.w), hh = Math.max(2, g.h);
    var px = g.x + (g.vx || 0), py = g.y + (g.vy || 0);
    s.clipPolygon = V.polygon(px + cx0 * hw, py + cy0 * hh, px + cx1 * hw, py + cy1 * hh);
  }
  if (o.ch != null) s.ch = o.ch;
  if (o.color) s.color = o.color;
  if (o.skew) s.rot += o.skew * 0.28;
}
function reg(key, source, factory, diffs) {
  N.register('exit', key, {
    source: source + ' / exit:' + key, scope: 'glyph', differences: diffs || [],
    build: function (c) {
      var fn = factory(c);
      return function (s, g, gs, frame) {
        var env = V.envelope(c, c.node, frame);
        var e = { W: c.comp.width, H: c.comp.height, size: c.node.size, seed: seedOf(c),
          vertical: !!c.node.vertical, M: H.motionAmt(c) / 0.7, step: Math.floor(env.t * 24 + 1e-6),
          frame: frame, time: env.t, outDur: c.cut.outFrames / Math.max(1, c.comp.fps) };
        applyState(s, fn(env.pout, g, gs, e), g);
      };
    }
  });
}

function lineBounds(gs) {
  var b = V.bounds(gs);
  return { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1, w: b.w, h: b.h, cx: b.cx, cy: b.cy };
}
function rootPlaceNull(graph, ids, cut, node, comp, camParent) {
  var cur = ids.length && graph.byId[ids[0]] ? graph.byId[ids[0]].parent : null;
  while (cur && graph.byId[cur] && graph.byId[cur].parent !== camParent) {
    if (String(graph.byId[cur].name || '').slice(-8) === ' / Place') return cur;
    cur = graph.byId[cur].parent;
  }
  if (cur && graph.byId[cur] && graph.byId[cur].type === 'null') return cur;
  var pId = ids.length && graph.byId[ids[0]] ? graph.byId[ids[0]].parent : camParent;
  return graph.add('null', cut.id + ' / ' + node.id + ' / Place', pId, cut.start, cut.end, {
    position: [node.x - comp.width / 2, comp.height / 2 - node.y],
    rotation: -(node.rotation || 0), scale: [node.sx == null ? 1 : node.sx, 1]
  });
}
function insertBeforeLayer(graph, nodeId, targetId) {
  var n = graph.byId[nodeId], t = graph.byId[targetId];
  var i = graph.layers.indexOf(n), j = graph.layers.indexOf(t);
  if (i >= 0 && j >= 0 && i > j) { graph.layers.splice(i, 1); graph.layers.splice(j, 0, n); }
}
function toScenePoly(graph, placeId, f, poly) {
  var mtx = S.matrix(graph, placeId, f);
  return poly.map(function (pt) { return S.point(mtx, [pt[0], -pt[1]]); });
}
function addLocalShape(c, loc, rng, name, cmds, paint, sampleFn) {
  if (!rng.ok) return null;
  var safePaint = (paint && typeof paint === 'object' && !(paint.alpha > 0))
    ? Object.assign({}, paint, { alpha: 1 }) : paint;
  var id = C.shape(c.graph, { start: rng.start, end: rng.end }, c.cut.id + ' / ' + c.node.id + ' / ' + name, loc, cmds, safePaint);
  if (sampleFn) C.sample(c.graph, id, rng.start, rng.end, function (f) { return sampleFn(poutAt(c, f), f); });
  else if (paint && typeof paint === 'object' && paint.alpha === 0) setKey(c.graph, id, 'alpha', rng.start, 0, 1);
  return id;
}
function decompShear(k) {
  if (Math.abs(k) < 1e-6) return [0, 1, 1, 0];
  var v = 0.5 * Math.atan2(2 * k, -k * k);
  var a = Math.cos(v) + k * Math.sin(v), b = Math.sin(v), s = Math.max(0.05, Math.hypot(a, b));
  return [Math.atan2(b, a) / DEG, s, 1 / s, -v / DEG];
}
function applyExitWindowClip(c, difference, polysFn) {
  var rng = outRange(c);
  if (!rng.ok) return;
  post(c, function (graph, ids, gs, cut, parent, options) {
    var placeId = rootPlaceNull(graph, ids, cut, c.node, c.comp, parent);
    var b = lineBounds(gs);
    var byFrame = Object.create(null);
    for (var f = rng.start; f < cut.end; f++) {
      var p = poutAt(c, f);
      if (p <= 0) continue;
      if (p >= 1) {
        if (!difference) byFrame[f] = [];
        else ids.forEach(function (tid) { setKey(graph, tid, 'alpha', f, 0, 2); });
        continue;
      }
      var locPolys = polysFn(p, b, f) || [];
      byFrame[f] = locPolys.filter(function (q) { return q && q.length >= 3; })
        .map(function (q) { return toScenePoly(graph, placeId, f, q); });
    }
    ids.forEach(function (tid) { H.multiClip(graph, tid, byFrame, difference, 'Exit clip', options); });
  });
}
function applyExitWholeRig(c, fn) {
  post(c, function (graph, ids, gs, cut, parent) {
    var curParent = ids.length && graph.byId[ids[0]] ? graph.byId[ids[0]].parent : rootPlaceNull(graph, ids, cut, c.node, c.comp, parent);
    var rigOuter = graph.add('null', cut.id + ' / ' + c.node.id + ' / Exit Outer', curParent, cut.start, cut.end, {});
    var rigStretch = graph.add('null', cut.id + ' / ' + c.node.id + ' / Exit Stretch', rigOuter, cut.start, cut.end, {});
    var rigInner = graph.add('null', cut.id + ' / ' + c.node.id + ' / Exit Inner', rigStretch, cut.start, cut.end, {});
    insertBeforeLayer(graph, rigOuter, ids[0]);
    insertBeforeLayer(graph, rigStretch, ids[0]);
    insertBeforeLayer(graph, rigInner, ids[0]);
    var rng = outRange(c), b = lineBounds(gs), base = Object.create(null);
    ids.forEach(function (tid) {
      var n = graph.byId[tid];
      n.parent = rigInner;
      base[tid] = { a: n.attrs.alpha == null ? 1 : n.attrs.alpha };
    });
    var lastColor = null;
    for (var f = cut.start; f < cut.end; f++) {
      var p = f >= rng.start ? poutAt(c, f) : 0, s = p > 0 ? (fn(p, b, f) || {}) : {};
      var ax = s.ax == null ? 0 : s.ax, ay = s.ay == null ? 0 : s.ay;
      var sx = s.sx == null ? 1 : s.sx, sy = s.sy == null ? 1 : s.sy;
      var rot = s.rot || 0, dx = s.dx || 0, dy = s.dy || 0, skew = s.skew || 0;
      var sc = decompShear(Math.tan(skew * DEG));
      graph.key(rigOuter, 'position.x', f, dx + ax, 1);
      graph.key(rigOuter, 'position.y', f, -(dy + ay), 1);
      graph.key(rigOuter, 'rotation', f, -rot + sc[0], 1);
      graph.key(rigStretch, 'scale.x', f, sc[1], 1);
      graph.key(rigStretch, 'scale.y', f, sc[2], 1);
      graph.key(rigInner, 'rotation', f, sc[3], 1);
      graph.key(rigInner, 'scale.x', f, Math.abs(sx) < 0.01 ? (sx < 0 ? -0.01 : 0.01) : sx, 1);
      graph.key(rigInner, 'scale.y', f, Math.abs(sy) < 0.01 ? (sy < 0 ? -0.01 : 0.01) : sy, 1);
      graph.key(rigInner, 'position.x', f, -ax, 1);
      graph.key(rigInner, 'position.y', f, ay, 1);
      if (p > 0) {
        var am = s.a == null ? 1 : cl(s.a);
        ids.forEach(function (tid) {
          var tn = graph.byId[tid];
          setKey(graph, tid, 'alpha', f, getKeyVal(tn, 'alpha', f, base[tid].a) * am, 1);
          if (s.color && s.color !== lastColor) setKey(graph, tid, 'material.materialColor', f, s.color, 2);
        });
        if (s.color) lastColor = s.color;
      }
    }
  });
}

function rigidWord(g, b, o) {
  var px = o.px != null ? o.px : b.cx, py = o.py != null ? o.py : b.cy;
  var sc = o.s == null ? 1 : o.s, sx = sc * (o.sx == null ? 1 : o.sx), sy = sc * (o.sy == null ? 1 : o.sy);
  var rx = (g.x - px) * sx, ry = (g.y - py) * sy;
  if (o.rot) { var rv = rot2(rx, ry, o.rot); rx = rv[0]; ry = rv[1]; }
  return { dx: px + rx - g.x + (o.tx || 0), dy: py + ry - g.y + (o.ty || 0), rot: o.rot || 0, sx: sx, sy: sy, a: o.a == null ? 1 : o.a, color: o.color };
}
function uneasyTimes(seed, n, span) {
  var gaps = [], tot = 0;
  for (var k = 0; k < n; k++) { var r = rand(seed, k, 901), gap = 0.25 + (r < 0.25 ? 2.2 : r * 1.1); gaps.push(gap); tot += gap; }
  var out = [], acc = 0;
  for (var k2 = 0; k2 < n; k2++) { out.push(acc / tot * span); acc += gaps[k2]; }
  return out;
}
function lineInfoList(gs, vert, node) {
  var sx = node.sx == null ? 1 : node.sx, sy = 1, map = Object.create(null), out = [];
  gs.forEach(function (g) {
    if (isBlank(g.ch)) return;
    var a0 = vert ? (g.y - g.h / 2) * sy : (g.x - g.w / 2) * sx;
    var a1 = vert ? (g.y + g.h / 2) * sy : (g.x + g.w / 2) * sx;
    var c = vert ? g.x * sx : g.y * sy;
    if (!map[g.li]) { map[g.li] = { li: g.li, a0: a0, a1: a1, c: c }; out.push(map[g.li]); }
    else { map[g.li].a0 = Math.min(map[g.li].a0, a0); map[g.li].a1 = Math.max(map[g.li].a1, a1); }
  });
  out.sort(function (a, b) { return a.li - b.li; });
  return out;
}

/* =====================================================================
   PART 1: horror2 (7)
   ===================================================================== */

reg('hrPulledDown', 'src/11p_horror2.js', function (c) {
  var gs0 = V.glyphs(c, c.node), cs = cutSeed(c), cn = cutN(c);
  var last = Math.floor(rand(cs, 41, 1) * 1000) % cn;
  return function (p, g, gs, e) {
    var ix = idxAt(c, gs0, g.i);
    var t0 = ix === last ? 0.7 : rand(cs, ix, 42) * 0.5, q = (p - t0) / 0.28;
    if (q < 0) {
      var tr = cl(1 + q * 1.5) * (ix === last ? 1.6 : 0.6);
      return tr > 0 ? { dx: rs(cs, ix, e.step, 43) * e.size * 0.03 * tr, dy: rs(cs, ix, e.step, 44) * e.size * 0.02 * tr, rot: rs(cs, ix, e.step, 45) * 6 * tr } : null;
    }
    if (q >= 1) return HIDE;
    return { dy: q * q * e.H * 1.1, sy: 1 + q * 1.8, sx: 1 - q * 0.3, rot: rs(cs, ix, 46, 1) * 12 * q, a: 1 - iCubic(q) };
  };
});

reg('hrLookBack', 'src/11p_horror2.js', function (c) {
  var gs0 = V.glyphs(c, c.node), cs = cutSeed(c), cn = cutN(c);
  var txt = Array.from(String((c.cut && c.cut.text) || '').replace(/\s+/g, ''));
  var pick = Math.floor(rand(cs, 51, 1) * 1000) % cn;
  for (var k = 0; k < cn; k++) { var j = (pick + k) % cn; if (isKanji(txt[j]) || /[A-Za-z]/.test(txt[j] || '')) { pick = j; break; } }
  var dir = rand(cs, 52, 1) < 0.5 ? -1 : 1, acc = c.sc.accent || c.node.color;
  return function (p, g, gs, e) {
    if (idxAt(c, gs0, g.i) !== pick) return p < 0.06 ? { a: 0.4 } : HIDE;
    if (p >= 0.86) return HIDE;
    var q = ioSine(cl((p - 0.12) / 0.55));
    var tw = rand(cs, e.step, 53) < 0.12 ? rs(cs, e.step, 54, 1) * 6 : 0;
    return { rot: dir * 24 * q + tw, s: 1 + 0.16 * q, dx: rs(cs, e.step, 55, 1) * e.size * 0.01 * q, color: q > 0.3 ? acc : null };
  };
});

reg('hrTurnAway', 'src/11p_horror2.js', function (c) {
  var gs0 = V.glyphs(c, c.node), c0 = c.node.color || c.sc.fg, dk = nightCol(c.sc);
  return function (p, g, gs, e) {
    var q = cl((p - ordAt(c, gs0, g.i) * 0.4) / 0.6);
    if (q <= 0) return null;
    if (q >= 1) return HIDE;
    var sx = Math.cos(q * PI * 0.95);
    return { sx: Math.abs(sx) < 0.04 ? (sx < 0 ? -0.04 : 0.04) : sx, color: q > 0.5 ? H.mixHex(c0, dk, 0.35 + q * 0.5) : null, a: 1 - H.smoothstep(0.6, 1, q), dy: q * e.size * 0.08 };
  };
});

reg('hrShiver', 'src/11p_horror2.js', function (c) {
  var gs0 = V.glyphs(c, c.node), cs = cutSeed(c);
  return function (p, g, gs, e) {
    var ix = idxAt(c, gs0, g.i), t0 = 0.3 + rand(cs, ix, 61) * 0.62;
    if (p >= t0) return HIDE;
    var amp = e.size * (0.025 + 0.13 * p);
    return { dx: rs(cs, ix, e.step, 62) * amp, dy: rs(cs, ix, e.step, 63) * amp, rot: rs(cs, ix, e.step, 64) * 14 * p };
  };
});

reg('hrSwallow', 'src/11p_horror2.js', function (c) {
  var sd = seedOf(c), sz = c.node.size, dk = nightCol(c.sc), rng = outRange(c);
  function stainPoly(p, b) {
    var cx = mix(b.x0, b.x1, 0.15 + 0.7 * rand(sd, 71, 1)), cy = mix(b.y0, b.y1, 0.3 + 0.4 * rand(sd, 72, 1));
    var Rmax = Math.hypot(Math.max(cx - b.x0, b.x1 - cx), Math.max(cy - b.y0, b.y1 - cy)) + sz * 0.2;
    var R = Rmax * iCubic(cl(p / 0.75)) * 1.08, pts = [], m = 22;
    for (var k = 0; k < m; k++) {
      var a = k / m * TAU, r = R * (0.72 + 0.4 * rand(sd, k, 73) + 0.08 * Math.sin(p * 9 + k));
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return { pts: pts, R: R, cx: cx, cy: cy };
  }
  applyExitWindowClip(c, true, function (p, b) {
    var st2 = stainPoly(p, b);
    return st2.R > 0.5 ? [st2.pts] : [];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var b = lineBounds(gs), loc = V.local(c, c.node, 'SwallowStain'), m = 22;
      var cx = mix(b.x0, b.x1, 0.15 + 0.7 * rand(sd, 71, 1)), cy = mix(b.y0, b.y1, 0.3 + 0.4 * rand(sd, 72, 1));
      var Rmax = Math.hypot(Math.max(cx - b.x0, b.x1 - cx), Math.max(cy - b.y0, b.y1 - cy)) + sz * 0.2;
      var unitPts = [];
      for (var k = 0; k < m; k++) { var a = k / m * TAU, r = 0.72 + 0.4 * rand(sd, k, 73); unitPts.push([Math.cos(a) * r, Math.sin(a) * r]); }
      addLocalShape(c, loc, rng, 'DarkStain', V.commands(unitPts, true), { fill: dk, alpha: 0 }, function (p) {
        var R = Rmax * iCubic(cl(p / 0.75)) * 1.08, fade = 1 - H.smoothstep(0.62, 0.95, p);
        return { 'position.x': cx, 'position.y': -cy, 'scale.x': Math.max(0.01, R), 'scale.y': Math.max(0.01, R), alpha: R > 0.5 && p <= 0.97 ? 0.85 * fade : 0 };
      });
    });
  }
  return function () { return null; };
});

reg('hrFlickerDie', 'src/11p_horror2.js', function (c) {
  var sd = seedOf(c), gs0 = V.glyphs(c, c.node), b = V.bounds(gs0), acc = c.sc.accent || c.node.color;
  return function (p, g, gs, e) {
    var stp = e.step, r = rand(sd, stp, 81);
    if (p > 0.92 || r > Math.pow(1 - p, 1.3) * 0.95) return HIDE;
    if (rand(sd, stp, 82) < 0.22 && p > 0.15) {
      return { sx: -1, dx: (b.cx - g.x) * 2, dy: rs(sd, stp, 83, 1) * e.size * 0.1, color: acc };
    }
    return { a: 0.55 + 0.45 * rand(sd, stp, 84) };
  };
});

reg('hrDrain', 'src/11p_horror2.js', function (c) {
  var gs0 = V.glyphs(c, c.node), cs = cutSeed(c), sz = c.node.size, col = c.node.color || c.sc.fg, rng = outRange(c);
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var loc = V.local(c, c.node, 'DrainDrips'), sx = c.node.sx == null ? 1 : c.node.sx, sy = 1;
      gs.slice(0, 18).forEach(function (g) {
        if (isBlank(g.ch)) return;
        var ix = idxAt(c, gs0, g.i), nd = 1 + (Math.floor(rand(cs, ix, 91) * 100) % 2);
        for (var d = 0; d < nd; d++) {
          (function (dd, gx, yb, len) {
            var lw = Math.max(1, sz * 0.035), r = sz * 0.03;
            addLocalShape(c, loc, rng, 'Drip_' + g.i + '_' + dd, G.rect(-lw / 2, -1, lw, 1), { fill: col, alpha: 0 }, function (p) {
              var q = ioSine(cl((p - ordAt(c, gs0, g.i) * 0.25) / 0.72));
              if (q <= 0.02 || q >= 1) return { alpha: 0 };
              var L = len * oCubic(q), a = 1 - H.smoothstep(0.75, 1, q);
              return { 'position.x': gx, 'position.y': -(yb - sz * 0.05), 'scale.y': Math.max(1, L + sz * 0.05), alpha: a };
            });
            addLocalShape(c, loc, rng, 'Drop_' + g.i + '_' + dd, G.ellipse(0, 0, r, r), { fill: col, alpha: 0 }, function (p) {
              var q = ioSine(cl((p - ordAt(c, gs0, g.i) * 0.25) / 0.72));
              if (q <= 0.02 || q >= 1) return { alpha: 0 };
              var L = len * oCubic(q), a = 1 - H.smoothstep(0.75, 1, q);
              return { 'position.x': gx, 'position.y': -(yb + L), alpha: a };
            });
          })(d, (g.x + rs(cs, ix, d, 1) * g.w * 0.3) * sx, (g.y + g.h * 0.4) * sy, sz * (0.3 + 1.4 * rand(cs, ix, d, 2)));
        }
      });
    });
  }
  return function (p, g) {
    var q = ioSine(cl((p - ordAt(c, gs0, g.i) * 0.25) / 0.72));
    if (q <= 0) return null;
    if (q >= 0.995) return HIDE;
    return { clipY: [-0.7 + q * 1.4, 0.7] };
  };
});

/* =====================================================================
   PART 2: x2_horrorB (8)
   ===================================================================== */

reg('hzOutOfLight', 'src/11p_x2_horrorB.js', function (c) {
  var sz = c.node.size, c0 = c.node.color || c.sc.fg, dk = nightCol(c.sc), Hh = c.comp.height;
  applyExitWindowClip(c, false, function (p, b) {
    var edge = mix(b.y0 - sz * 0.4, b.y1 + sz * 0.75, ioSine(cl(p / 0.92)));
    return [V.polygon(b.x0 - sz * 2, edge, b.x1 + sz * 2, edge + Hh * 3)];
  });
  applyExitWholeRig(c, function (p) {
    return { dy: iQuad(p) * sz * 0.45, a: 1 - H.smoothstep(0.8, 1, p) };
  });
  return function (p) {
    var d = H.smoothstep(0, 0.75, p);
    return p > 0 ? { color: H.mixHex(c0, dk, d * 0.7) } : null;
  };
});

reg('hzTaken', 'src/11p_x2_horrorB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), cs = cutSeed(c), cn = cutN(c);
  var rk = []; for (var i = 0; i < cn; i++) rk.push(i);
  rk.sort(function (a, b) { return rand(cs, a, 311) - rand(cs, b, 311); });
  var times = uneasyTimes(cs, cn, 0.8), side = rand(cs, 312, 1) < 0.5 ? -1 : 1;
  return function (p, g, gs, e) {
    var ix = idxAt(c, gs0, g.i), q = (p - (times[rk[ix]] || 0)) / 0.1;
    if (q >= 1) return HIDE;
    if (q < 0) {
      var tr = cl(1 + q / 2.5);
      return tr > 0 ? { dx: -side * e.size * 0.05 * tr + rs(cs, ix, e.step, 313) * e.size * 0.02 * tr, rot: rs(cs, ix, e.step, 314) * 5 * tr } : null;
    }
    return { dx: side * iCubic(q) * e.W * 0.85, sx: 1 + q * 3.5, sy: 1 - q * 0.35, a: 1 - 0.6 * q };
  };
});

reg('hzThumbSmear', 'src/11p_x2_horrorB.js', function (c) {
  var cs = cutSeed(c), sz = c.node.size, L = [1, 0.62, 0.3, 0];
  [1, 2, 3, 4].forEach(function (idx) {
    (c.node._jzTwins = c.node._jzTwins || []).push({
      label: 'Smear_' + idx, below: true,
      setup: function (graph, clone, src, g) {
        clone.keys = {};
        var rng = outRange(c), sx0 = src.attrs['scale.x'] || 1, sy0 = src.attrs['scale.y'] || 1;
        C.sample(graph, clone.id, clone.start, clone.end, function (f) {
          if (f < rng.start) return { alpha: 0 };
          var p = poutAt(c, f);
          if (p >= 0.9) return { alpha: 0 };
          var k = Math.min(2, Math.floor(p / 0.3)), v = p / 0.3 - k;
          var dir = ((Math.floor(rand(cs, 321, 1) * 100) + k) & 1) ? 1 : -1, sw = Math.sin(v * PI);
          var off = -dir * sz * 0.13 * sw * idx * 0.28;
          return { 'position.x': g.x + (g.vx || 0) + off, 'position.y': -g.y - (g.vy || 0),
            rotation: -(g.r90 ? 90 : 0), 'scale.x': sx0, 'scale.y': sy0, alpha: 0.5 * sw * Math.pow(0.75, idx - 1) * mix(L[k], L[k + 1], H.smoothstep(0.15, 0.85, v)) };
        });
      }
    });
  });
  applyExitWholeRig(c, function (p) {
    if (p >= 0.9) return { a: 0 };
    var k = Math.min(2, Math.floor(p / 0.3)), v = p / 0.3 - k;
    var dir = ((Math.floor(rand(cs, 321, 1) * 100) + k) & 1) ? 1 : -1, sw = Math.sin(v * PI);
    return { dx: dir * sw * sz * 0.1, dy: sw * sz * 0.015 * (k - 1), a: mix(L[k], L[k + 1], H.smoothstep(0.15, 0.85, v)) };
  });
  return function () { return null; };
});

reg('hzRetinal', 'src/11p_x2_horrorB.js', function (c) {
  var sz = c.node.size, col = H.mixHex(c.node.color || c.sc.fg, c.sc.bg || '#101010', 0.3), lw = Math.max(1, sz * 0.018);
  (c.node._jzTwins = c.node._jzTwins || []).push({
    label: 'RetinalBurn', below: false,
    setup: function (graph, clone, src, g) {
      clone.attrs.fill = false; clone.attrs.stroke = true;
      clone.attrs['stroke.strokeColor'] = col; clone.attrs['stroke.width'] = lw;
      clone.keys = {};
      var rng = outRange(c), sx0 = src.attrs['scale.x'] || 1, sy0 = src.attrs['scale.y'] || 1;
      C.sample(graph, clone.id, clone.start, clone.end, function (f) {
        if (f < rng.start) return { alpha: 0 };
        var p = poutAt(c, f);
        if (p < 0.06) return { alpha: 0 };
        var q = (p - 0.06) / 0.94, a = 0.85 * (1 - oQuad(q)), s = 1 + 0.05 * q;
        return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0) + sz * 0.04 * q,
          rotation: -(g.r90 ? 90 : 0), 'scale.x': sx0 * s, 'scale.y': sy0 * s, alpha: a };
      });
    }
  });
  return function (p) { return p >= 0.06 ? HIDE : null; };
});

reg('hzDragCorner', 'src/11p_x2_horrorB.js', function (c) {
  var cs = cutSeed(c), W = c.comp.width, Hh = c.comp.height, sz = c.node.size;
  var sxn = rand(cs, 331, 1) < 0.5 ? -1 : 1, syn = rand(cs, 332, 1) < 0.75 ? 1 : -1;
  applyExitWholeRig(c, function (p, b, f) {
    var stp = Math.floor(f * 24 / Math.max(1, c.comp.fps));
    var g = p < 0.3 ? 0.07 * oCubic(cl((p - 0.04) / 0.14)) : p < 0.58 ? mix(0.07, 0.24, oCubic(cl((p - 0.3) / 0.14))) : mix(0.24, 1, iCubic((p - 0.58) / 0.42));
    var rest = (p > 0.2 && p < 0.3) || (p > 0.46 && p < 0.58) ? 1 : 0;
    var s = 1 - 0.45 * g, cx = W / 2 - c.node.x, cy = Hh / 2 - c.node.y;
    var ang = sxn * syn * -16 * g;
    return { ax: cx, ay: cy, rot: ang, sx: s, sy: s,
      dx: sxn * W * 0.62 * g + rest * rs(cs, stp, 333, 1) * sz * 0.012, dy: syn * Hh * 0.62 * g,
      a: 1 - H.smoothstep(0.7, 0.97, p) };
  });
  return function () { return null; };
});

reg('hzFlatline', 'src/11p_x2_horrorB.js', function (c) {
  var vert = !!c.node.vertical;
  function bump(p, c2, w) { return Math.exp(-Math.pow((p - c2) / w, 2)); }
  applyExitWholeRig(c, function (p, b) {
    if (p < 0.46) {
      var s = 1 + 0.08 * bump(p, 0.08, 0.035) + 0.045 * bump(p, 0.27, 0.04);
      return { ax: b.cx, ay: b.cy, sx: s, sy: s };
    }
    var flat = mix(1, 0.035, E.outExpo(cl((p - 0.46) / 0.14))), k = 1, al = 1;
    if (p > 0.8) { var q = (p - 0.8) / 0.2; k = Math.max(0.02, 1 - ioCubic(q)); al = 1 - H.smoothstep(0.6, 1, q); }
    return { ax: b.cx, ay: b.cy, sx: vert ? flat : k, sy: vert ? k : flat, a: al };
  });
  return function () { return null; };
});

reg('hzShadowOff', 'src/11p_x2_horrorB.js', function (c) {
  var cs = cutSeed(c), sz = c.node.size, c0 = c.node.color || c.sc.fg;
  var dir = rand(cs, 341, 1) < 0.5 ? -1 : 1;
  var shc = H.mixHex(c0, c.sc.bg || '#101010', H.dark(c.sc.bg || '#101010') ? 0.62 : 0.45);
  post(c, function (graph, ids, gs, cut, parent) {
    var placeId = rootPlaceNull(graph, ids, cut, c.node, c.comp, parent);
    var shNull = graph.add('null', cut.id + ' / ' + c.node.id + ' / ShadowWalk', placeId, cut.start, cut.end, {});
    insertBeforeLayer(graph, shNull, ids[0]);
    ids.forEach(function (srcId) {
      var src = graph.byId[srcId];
      var cid = graph.add(src.type, src.name + ' / ShadowTwin', shNull, cut.start, cut.end, V.copy(src.attrs), src.commands ? V.copy(src.commands) : null);
      graph.byId[cid].attrs['material.materialColor'] = shc;
      graph.byId[cid].keys = V.copy(src.keys);
      delete graph.byId[cid].keys.alpha;
      insertBeforeLayer(graph, cid, ids[0]);
      C.sample(graph, cid, cut.start, cut.end, function (f) {
        var p = poutAt(c, f);
        if (p <= 0) return { alpha: 0 };
        var sa = 0.75 * H.smoothstep(0, 0.2, p) * (1 - H.smoothstep(0.72, 1, p));
        return { alpha: sa };
      });
    });
    var rng = outRange(c);
    C.sample(graph, shNull, cut.start, cut.end, function (f) {
      if (f < rng.start) return { 'position.x': 0, 'position.y': 0 };
      var p = poutAt(c, f), slip = oCubic(cl(p / 0.3)), walk = iQuad(cl((p - 0.3) / 0.7));
      var dx = dir * (sz * 0.22 * slip + c.comp.width * 0.55 * walk);
      var dy = sz * 0.1 * slip + (walk > 0 ? Math.abs(Math.sin(walk * 14)) * sz * 0.04 : 0);
      return { 'position.x': dx, 'position.y': -dy };
    });
  });
  return function (p) { return p > 0.08 ? { a: 1 - H.smoothstep(0.08, 0.5, p) } : null; };
});

reg('hzBackAway', 'src/11p_x2_horrorB.js', function (c) {
  var cs = cutSeed(c), c0 = c.node.color || c.sc.fg, bg = c.sc.bg || '#101010', at = [0.06, 0.28, 0.5, 0.72];
  function stepsAt(p) {
    var L = 0, sh = 0;
    for (var k = 0; k < 4; k++) { var e = E.outExpo(cl((p - at[k]) / 0.08)); L += e; sh += e * rs(cs, k, 351, 1); }
    return [L, sh];
  }
  applyExitWholeRig(c, function (p, b) {
    if (p >= 0.92) return { a: 0 };
    var ls = stepsAt(p), L = ls[0], sh = ls[1], s = Math.pow(0.88, L);
    return { ax: b.cx, ay: b.cy, sx: s, sy: s, dx: sh * c.comp.width * 0.012, dy: -L * c.comp.height * 0.008, a: Math.pow(0.7, L) };
  });
  return function (p) {
    if (p >= 0.92) return HIDE;
    var L = stepsAt(p)[0];
    return L > 0 ? { color: H.mixHex(c0, bg, cl(0.12 * L)) } : null;
  };
});

/* =====================================================================
   PART 3: kinetic2 (8)
   ===================================================================== */

reg('knWordKick', 'src/11p_kinetic2.js', function (c) {
  var gs0 = V.glyphs(c, c.node), wi = H.wordsOf(c, gs0), n = wi.words.length, sp = n > 1 ? 0.4 : 0;
  return function (p, g, gs, e) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var q = stgN(p, j, n, sp); if (q <= 0) return null;
    if (q >= 1) return HIDE;
    var b = wi.words[j].b, up = j % 2 ? 1 : -1, ev = iCubic(q), th = up * 70 * ev;
    return rigidWord(g, b, { rot: th, tx: up * e.size * 0.6 * ev, ty: up * e.H * 0.9 * ev - up * e.size * 0.25 * H.bell(q * 2), a: 1 - iQuad(cl((q - 0.45) / 0.55)) });
  };
});

reg('knPushOut', 'src/11p_kinetic2.js', function (c) {
  var gs0 = V.glyphs(c, c.node), wi = H.wordsOf(c, gs0), vert = !!c.node.vertical;
  return function (p, g) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var li = wi.words[j].li, rowWords = wi.words.filter(function (w) { return w.li === li; });
    var m = rowWords.length, stFn = function (w) { return vert ? w.b.y0 : w.b.x0; }, enFn = function (w) { return vert ? w.b.y1 : w.b.x1; };
    var s0 = stFn(rowWords[0]), f = p * m, k0 = Math.min(m - 1, Math.floor(f)), ev = E.outBack(cl((f - k0) / 0.8), 1.6);
    var to = function (q) { return q >= m ? enFn(rowWords[m - 1]) - s0 + Math.max(2, c.node.size * 0.2) : stFn(rowWords[q]) - s0; };
    var sh = mix(to(k0), to(k0 + 1), ev);
    var pos = (vert ? gcy(g, c.node) : gcx(g, c.node)) - sh, over = s0 - pos;
    var a = (1 - cl(over / Math.max(4, c.node.size * 0.45))) * (1 - H.smoothstep(0.72, 1, p)) * (p > 0.97 ? 1 - cl((p - 0.97) / 0.03) : 1);
    if (a <= 0.01) return HIDE;
    return vert ? { dy: -sh, a: a } : { dx: -sh, a: a };
  };
});

reg('knDiveGlyph', 'src/11p_kinetic2.js', function (c) {
  var gs0 = V.glyphs(c, c.node), plain = nonSpace(gs0), one = plain.length <= 1;
  var pick = plain.find(function (g) { return isKanji(g.ch); }) || plain[Math.floor(plain.length / 2)] || gs0[0];
  var fi = pick ? pick.i : 0, fx = pick ? gcx(pick, c.node) : 0, fy = pick ? gcy(pick, c.node) : 0;
  var logS = Math.log(one ? 3 : 34);
  if (!one) {
    applyExitWholeRig(c, function (p) {
      var e = ioCubic(p);
      return { dx: (c.comp.width / 2 - (c.node.x + fx)) * e, dy: (c.comp.height / 2 - (c.node.y + fy)) * e };
    });
  }
  return function (p, g) {
    var sc = Math.exp(Math.pow(p, 1.7) * logS);
    var a = one ? (1 - H.smoothstep(0.3, 1, p)) : (g.i === fi ? 1 - H.smoothstep(0.6, 1, p) : 1 - H.smoothstep(0.25, 0.7, p));
    if (a <= 0.01) return HIDE;
    return { s: sc, dx: (gcx(g, c.node) - fx) * (sc - 1), dy: (gcy(g, c.node) - fy) * (sc - 1), a: a };
  };
});

reg('knLaunch', 'src/11p_kinetic2.js', function (c) {
  var vert = !!c.node.vertical, cs = cutSeed(c), dir = rand(cs, c.node.mi || 0, 71) < 0.5 ? 1 : -1;
  var D = (vert ? c.comp.height : c.comp.width) * 1.25;
  return function (p, g, gs) {
    var n = gs.length, back = n > 1 ? (dir > 0 ? (n - 1 - g.i) / (n - 1) : g.i / (n - 1)) : 0;
    var q = cl((p - back * 0.35) / 0.65);
    if (q >= 1) return HIDE;
    var antic = -0.06 * H.bell(cl(p / 0.18)), e = iCubic(q) + antic, v = 3 * q * q, stf = 1 + Math.min(1.2, v * 0.35);
    return vert ? { dy: dir * D * e, sy: stf, sx: 1 / Math.sqrt(stf) } : { dx: dir * D * e, sx: stf, sy: 1 / Math.sqrt(stf) };
  };
});

reg('knWordBlink', 'src/11p_kinetic2.js', function (c) {
  var gs0 = V.glyphs(c, c.node), wi = H.wordsOf(c, gs0), n = wi.words.length, cs = cutSeed(c);
  var rev = rand(cs, 73, 1) < 0.5, acc = c.sc.accent || c.node.color;
  return function (p, g) {
    var j0 = wi.membership[g.i]; if (j0 == null) return null;
    var j = rev ? n - 1 - j0 : j0;
    var w0 = n > 1 ? j / n : rand(cs, c.node.mi || 0, 74) * 0.6, w1 = n > 1 ? (j + 1) / n : w0 + 0.4;
    if (p >= w1 || p >= 0.999) return HIDE;
    if (p < w0) return null;
    var q = (p - w0) / Math.max(1e-4, w1 - w0), b = wi.words[j0].b, s = 1 + 0.16 * H.bell(q * 1.4);
    return { s: s, dx: (gcx(g, c.node) - b.cx) * (s - 1), dy: (gcy(g, c.node) - b.cy) * (s - 1), color: q > 0.25 ? acc : null, a: q > 0.7 ? 0.35 : 1 };
  };
});

reg('knJumpCutOut', 'src/11p_kinetic2.js', function (c) {
  var cs = cutSeed(c), side = rand(cs, c.node.mi || 0, 79) < 0.5 ? -1 : 1;
  var states = [[1.22, 0.05 * side, -0.02, 0], [0.8, -0.07 * side, 0.03, 0], [1.5, 0.02 * side, 0, 3 * side]];
  applyExitWholeRig(c, function (p, b) {
    var st2 = Math.floor(cl(p) * 4);
    if (st2 >= 3) return { a: 0 };
    var sv = states[st2];
    return { ax: b.cx, ay: b.cy, sx: sv[0], sy: sv[0], dx: sv[1] * c.comp.width, dy: sv[2] * c.comp.height, rot: sv[3] };
  });
  return function () { return null; };
});

reg('knStackAway', 'src/11p_kinetic2.js', function (c) {
  var gs0 = V.glyphs(c, c.node), wi = H.wordsOf(c, gs0), n = wi.words.length, T = 0.62, Hh = c.comp.height, vert = !!c.node.vertical;
  var B = V.bounds(gs0), lh = vert ? null : B.h;
  return function (p, g) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var b = wi.words[j].b, fall = cl((p - T) / (1 - T));
    if (fall >= 1) return HIDE;
    var q = ioCubic(cl((p * (1 / T) - j / Math.max(1, n) * 0.7) / 0.3));
    var h = vert ? b.w : Math.max(1e-3, b.h);
    var tx = vert ? B.cx - (j - (n - 1) / 2) * h * 1.05 : B.cx, ty = vert ? B.cy : B.cy - (j - (n - 1) / 2) * h * 1.05;
    var hop = -H.bell(q) * (lh || h) * 0.8;
    return { dx: (tx - b.cx) * q, dy: (ty - b.cy) * q + hop + iQuad(fall) * Hh * 1.2, rot: fall * (j % 2 ? 8 : -8), a: 1 - H.smoothstep(0.8, 1, fall) };
  };
});

/* =====================================================================
   PART 4: x2_kineticB (8)
   ===================================================================== */

reg('kzBatAway', 'src/11p_x2_kineticB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), wi = H.wordsOf(c, gs0), B = V.bounds(gs0), cs = cutSeed(c);
  var sg = rand(cs, c.node.mi || 0, 831) < 0.5 ? -1 : 1, T = 0.16, acc = c.sc.accent || c.node.color;
  return function (p, g, gs, e) {
    if (wi.membership[g.i] == null) return null;
    if (p >= 0.999) return HIDE;
    var o;
    if (p < T) {
      var bl = H.bell(p / T);
      o = { px: B.cx, py: B.cy, sx: 1 - 0.16 * bl, sy: 1 + 0.1 * bl, tx: sg * e.size * 0.14 * bl, color: p > T * 0.35 ? acc : null };
    } else {
      var t = (p - T) / (1 - T), ev = Math.pow(t, 0.85);
      o = { px: B.cx, py: B.cy, tx: sg * e.W * ev, ty: -e.H * 0.55 * ev + e.H * 0.5 * ev * ev, rot: sg * 230 * ev, s: 1 - 0.35 * ev, a: 1 - H.smoothstep(0.72, 1, t) };
    }
    return rigidWord(g, B, o);
  };
});

reg('kzYankOut', 'src/11p_x2_kineticB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), wi = H.wordsOf(c, gs0), n = wi.words.length, vert = !!c.node.vertical;
  var sp = n > 1 ? 0.55 : 0, cs = cutSeed(c), d0 = rand(cs, c.node.mi || 0, 833) < 0.5 ? -1 : 1, D = (vert ? c.comp.height : c.comp.width) * 1.1;
  return function (p, g) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var r = n - 1 - j, q = stgN(p, r, n, sp);
    if (q >= 1) return HIDE;
    if (q <= 0) return null;
    var b = wi.words[j].b, sg = r % 2 ? -d0 : d0, stf, a = 0, al = 1;
    if (q < 0.4) stf = 1 + 0.55 * oCubic(q / 0.4);
    else { var t = (q - 0.4) / 0.6; stf = 1.55 + 0.9 * t; a = sg * D * 1.2 * Math.pow(t, 1.7); al = 1 - H.smoothstep(0.7, 1, t); }
    return rigidWord(g, b, vert ? { py: sg > 0 ? b.y0 : b.y1, sy: stf, ty: a, a: al } : { px: sg > 0 ? b.x0 : b.x1, sx: stf, tx: a, a: al });
  };
});

reg('kzSwingFling', 'src/11p_x2_kineticB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), wi = H.wordsOf(c, gs0), B = V.bounds(gs0), cs = cutSeed(c);
  var sg = rand(cs, c.node.mi || 0, 835) < 0.5 ? -1 : 1, L = 3.2 * c.node.size, T = 0.66;
  return function (p, g, gs, e) {
    if (wi.membership[g.i] == null) return null;
    if (p >= 0.999) return HIDE;
    var o;
    if (p < T) {
      var u = p / T;
      o = { px: B.cx, py: B.y0 - L, rot: sg * 24 * Math.pow(u, 1.3) * Math.sin(TAU * 1.5 * u) };
    } else {
      var t = (p - T) / (1 - T), v0 = 6.5 * e.size;
      o = { px: B.cx, py: B.cy, tx: sg * (v0 * t + Math.max(0, e.W * 1.15 - v0) * t * t),
        ty: -e.size * 1.6 * t + (e.H * 0.45 + e.size * 1.6) * t * t, rot: -sg * (116 * t + 70 * t * t), a: 1 - H.smoothstep(0.78, 1, t) };
    }
    return rigidWord(g, B, o);
  };
});

reg('kzCrouchDive', 'src/11p_x2_kineticB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), wi = H.wordsOf(c, gs0), n = wi.words.length, sp = n > 1 ? 0.4 : 0;
  return function (p, g, gs, e) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var q = stgN(p, j, n, sp); if (q >= 1) return HIDE; if (q <= 0) return null;
    var b = wi.words[j].b;
    if (q < 0.3) { var cv = oCubic(q / 0.3); return rigidWord(g, b, { py: b.y1, sy: 1 - 0.42 * cv, sx: 1 + 0.31 * cv }); }
    var t = (q - 0.3) / 0.7, v = 7 * e.size, acc = Math.max(17.5 * e.size, e.H * 1.2 + v), sy = 0.58 + 0.8 * oCubic(cl(t / 0.12));
    return rigidWord(g, b, { py: b.y1, ty: -v * t + acc * t * t, sy: sy, sx: 1 / Math.sqrt(sy), a: 1 - H.smoothstep(0.7, 1, t) });
  };
});

reg('kzSlingAway', 'src/11p_x2_kineticB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), wi = H.wordsOf(c, gs0), B = V.bounds(gs0), vert = !!c.node.vertical;
  var half = Math.max(1e-3, vert ? B.h : B.w) / 2, cs = cutSeed(c), sg = rand(cs, c.node.mi || 0, 837) < 0.5 ? -1 : 1, T = 0.58;
  return function (p, g, gs, e) {
    if (wi.membership[g.i] == null) return null;
    if (p >= 0.999) return HIDE;
    var A, shoot = 0, stf = 1, al = 1;
    if (p < T) { var cv = ioSine(p / T); A = e.size * 1.25 * cv * (1 + 0.035 * Math.sin(p * 90) * cv); }
    else {
      var t = (p - T) / (1 - T);
      A = e.size * 1.25 * mix(1, -0.55, oCubic(cl(t * 3.5)));
      shoot = (vert ? e.W : e.H) * 1.3 * Math.pow(t, 1.5); stf = 1 + 0.5 * t; al = 1 - H.smoothstep(0.8, 1, t);
    }
    var u = cl(((vert ? gcy(g, c.node) - B.cy : gcx(g, c.node) - B.cx)) / half, -1, 1);
    var d = sg * (A * (1 - u * u) - shoot), sl = Math.atan(-2 * u * sg * A / half) / DEG;
    return vert ? { dx: -d, rot: sl, sx: stf, a: al } : { dy: d, rot: sl, sy: stf, a: al };
  };
});

reg('kzHammerDown', 'src/11p_x2_kineticB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), wi = H.wordsOf(c, gs0), n = wi.words.length, sp = n > 1 ? 0.4 : 0, gap = (1 - sp) / 3.4;
  function hit(j, m) { return (n > 1 ? j / (n - 1) : 0) * sp + m * gap + 0.02; }
  return function (p, g, gs, e) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var d = 0, jolt = 0;
    for (var m = 0; m < 3; m++) d += E.outExpo(cl((p - hit(j, m)) / 0.07));
    d /= 3;
    for (var j2 = 0; j2 < Math.min(n, 12); j2++) for (var m2 = 0; m2 < 3; m2++) jolt += Math.abs(kick((p - hit(j2, m2)) * e.outDur, 13, 38));
    jolt = Math.min(1.2, jolt) * e.size * 0.07;
    if (d >= 0.999) return HIDE;
    if (d <= 0) return jolt > 0.3 ? { dy: -jolt } : null;
    var b = wi.words[j].b, ty = d * b.h * 1.06, floor = b.y1 + e.size * 0.06, c1 = (floor - (gcy(g, c.node) + ty)) / Math.max(1, g.h);
    if (c1 <= -0.6) return HIDE;
    return { dy: ty, clipY: [-0.95, Math.min(0.95, c1)] };
  };
});

reg('kzCrashApart', 'src/11p_x2_kineticB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), wi = H.wordsOf(c, gs0), n = wi.words.length, B = V.bounds(gs0);
  var T = 0.36, acc = c.sc.accent || c.node.color, cs = cutSeed(c), far = Math.max(c.comp.width, c.comp.height) * 0.8;
  return function (p, g) {
    var j = wi.membership[g.i]; if (j == null) return null;
    if (p >= 0.999) return HIDE;
    var b = wi.words[j].b, hx = (B.cx - b.cx) * 0.8, hy = (B.cy - b.cy) * 0.8;
    if (p < T) { var cv = iCubic(p / T); return rigidWord(g, b, { tx: hx * cv, ty: hy * cv, s: 1 - 0.12 * cv }); }
    var t = (p - T) / (1 - T), ev = oCubic(t), tw = j % 2 ? 1 : -1;
    var ang = n > 1 ? Math.atan2(b.cy - B.cy, b.cx - B.cx) + tw * (0.45 + 0.5 * rand(cs, j, 3)) : TAU * rand(cs, c.node.mi || 0, 5);
    return rigidWord(g, b, { tx: hx + Math.cos(ang) * far * ev, ty: hy + Math.sin(ang) * far * ev,
      rot: tw * 250 * ev, s: 0.88 + 0.3 * H.bell(t * 2.5), a: 1 - H.smoothstep(0.55, 1, t), color: t < 0.16 ? acc : null });
  };
});

reg('kzPinchShoot', 'src/11p_x2_kineticB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), wi = H.wordsOf(c, gs0), B = V.bounds(gs0), vert = !!c.node.vertical;
  var cs = cutSeed(c), sg = rand(cs, c.node.mi || 0, 841) < 0.5 ? -1 : 1, T = 0.44;
  return function (p, g, gs, e) {
    if (wi.membership[g.i] == null) return null;
    if (p >= 0.999) return HIDE;
    var cv, shoot = 0, lng, al = 1;
    if (p < T) { var t = p / T; cv = t < 0.25 ? -0.07 * Math.sin(PI * t / 0.25) : ioCubic((t - 0.25) / 0.75); lng = 1 + 0.3 * Math.max(0, cv); }
    else { var t2 = (p - T) / (1 - T); cv = 1; shoot = (vert ? e.W : e.H) * 1.3 * Math.pow(t2, 1.6); lng = 1.3 + 1.7 * t2; al = 1 - H.smoothstep(0.7, 1, t2); }
    var thin = 1 - 0.93 * cv;
    return vert ? { dy: (gcy(g, c.node) - B.cy) * (thin - 1), sy: thin, sx: lng, dx: sg * shoot, a: al }
      : { dx: (gcx(g, c.node) - B.cx) * (thin - 1), sx: thin, sy: lng, dy: -sg * shoot, a: al };
  };
});

/* =====================================================================
   PART 5: typo2 (8)
   ===================================================================== */

reg('tyStrike', 'src/11p_typo2.js', function (c) {
  var gs0 = V.glyphs(c, c.node), vert = !!c.node.vertical, sz = c.node.size;
  var lines = lineInfoList(gs0, vert, c.node), rng = outRange(c), ac = H.accCol(c.sc);
  if (rng.ok && lines.length) {
    var loc = V.local(c, c.node, 'TyStrike'), lw = Math.max(2.5, sz * 0.07), sx = c.node.sx == null ? 1 : c.node.sx, sy = 1;
    lines.forEach(function (L, k) {
      var pad = sz * 0.1, a0 = L.a0 - pad, a1 = L.a1 + pad, off = L.c + sz * (vert ? sx : sy) * 0.04;
      addLocalShape(c, loc, rng, 'Strike_' + k, vert ? G.rect(-lw / 2, -1, lw, 1) : G.rect(0, -lw / 2, 1, lw), { fill: ac, alpha: 0 }, function (p) {
        var ql = E.outExpo(cl(p / 0.38)), qr = iCubic(cl((p - 0.74) / 0.26));
        var a = mix(a0, a1, qr), b = mix(a0, a1, ql), len = b - a;
        if (len < 1) return { alpha: 0 };
        return vert ? { 'position.x': off, 'position.y': -a, 'scale.y': len, alpha: 1 } : { 'position.x': a, 'position.y': -off, 'scale.x': len, alpha: 1 };
      });
    });
  }
  return function (p, g) {
    var q = cl((p - 0.3 - ordAt(c, gs0, g.i) * 0.3) / 0.4);
    if (q <= 0) return null;
    if (q >= 1) return HIDE;
    var e = iCubic(q);
    return vert ? { sx: 1 - e * 0.95, a: 1 - e * e } : { sy: 1 - e * 0.95, a: 1 - e * e };
  };
});

reg('tyToDot', 'src/11p_typo2.js', function (c) {
  var gs0 = V.glyphs(c, c.node), ac = H.accCol(c.sc);
  return function (p, g) {
    var q = cl((p - ordAt(c, gs0, g.i) * 0.4) / 0.6);
    if (q <= 0) return null;
    if (q >= 1) return HIDE;
    if (q < 0.5) return { s: mix(1, 0.3, iCubic(q / 0.5)) };
    var u = (q - 0.5) / 0.5;
    return { ch: '\u30fb', color: ac, s: 1.5 * (1 - iCubic(u)), a: 1 - u * u };
  };
});

reg('tyLineFeed', 'src/11p_typo2.js', function (c) {
  var gs0 = V.glyphs(c, c.node), b = lineBounds(gs0), vert = !!c.node.vertical, sz = c.node.size, pad = sz * 0.12;
  var dist = (vert ? b.w : b.h) + sz * 0.3;
  applyExitWindowClip(c, false, function () {
    return [vert ? V.polygon(b.x0 - pad, b.y0 - sz * 2, b.x1 + pad, b.y1 + sz * 2) : V.polygon(b.x0 - sz * 2, b.y0 - pad, b.x1 + sz * 2, b.y1 + pad)];
  });
  applyExitWholeRig(c, function (p) {
    var k = cl(p) * 3, st2 = Math.min(3, Math.floor(k)), f = k - st2, step = Math.min(1, (st2 + oCubic(cl(f * 2.6))) / 3);
    return vert ? { dx: dist * step, a: p >= 0.999 ? 0 : 1 } : { dy: -dist * step, a: p >= 0.999 ? 0 : 1 };
  });
  return function () { return null; };
});

reg('tyBracketClose', 'src/11p_typo2.js', function (c) {
  var gs0 = V.glyphs(c, c.node), b = lineBounds(gs0), vert = !!c.node.vertical, sz = c.node.size, pad = sz * 0.12;
  var rng = outRange(c), stInfo = soloInfo(c, gs0);
  if (rng.ok && !stInfo.solo) {
    var loc = V.local(c, c.node, 'BracketsClose'), lw = Math.max(2, sz * 0.055), gPad = sz * 0.18;
    var L = Math.max(sz * 0.28, (vert ? b.w : b.h) * 0.3), col = H.accCol(c.sc);
    [-1, 1].forEach(function (side) {
      var pts = vert
        ? [[-b.w / 2 - gPad * 0.5, -side * L], [side < 0 ? b.w / 2 + gPad * 0.5 : -b.w / 2 - gPad * 0.5, 0], [side < 0 ? b.w / 2 + gPad * 0.5 - L : -b.w / 2 - gPad * 0.5 + L, 0]]
        : [[-side * L, side < 0 ? -b.h / 2 - gPad * 0.5 : b.h / 2 + gPad * 0.5], [0, side < 0 ? -b.h / 2 - gPad * 0.5 : b.h / 2 + gPad * 0.5], [0, side < 0 ? -b.h / 2 - gPad * 0.5 + L : b.h / 2 + gPad * 0.5 - L]];
      if (!vert) {
        pts = side < 0 ? [[0, -b.h / 2 - gPad * 0.5 + L], [0, -b.h / 2 - gPad * 0.5], [L, -b.h / 2 - gPad * 0.5]]
          : [[0, b.h / 2 + gPad * 0.5 - L], [0, b.h / 2 + gPad * 0.5], [-L, b.h / 2 + gPad * 0.5]];
      } else {
        pts = side < 0 ? [[b.w / 2 + gPad * 0.5 - L, 0], [b.w / 2 + gPad * 0.5, 0], [b.w / 2 + gPad * 0.5, L]]
          : [[-b.w / 2 - gPad * 0.5 + L, 0], [-b.w / 2 - gPad * 0.5, 0], [-b.w / 2 - gPad * 0.5, -L]];
      }
      addLocalShape(c, loc, rng, 'BracketClose_' + (side < 0 ? 'A' : 'B'), V.commands(pts, false), { stroke: col, width: lw, alpha: 0 }, function (p) {
        var e = ioCubic(cl((p - 0.12) / 0.7)), half = ((vert ? b.h : b.w) / 2 + pad) * (1 - e);
        var a = cl(p / 0.12) * (1 - cl((p - 0.84) / 0.16));
        return vert ? { 'position.x': b.cx, 'position.y': -(b.cy + side * (half + gPad)), alpha: a }
          : { 'position.x': b.cx + side * (half + gPad), 'position.y': -b.cy, alpha: a };
      });
    });
  }
  applyExitWindowClip(c, false, function (p, bx) {
    var e = ioCubic(cl((p - 0.12) / 0.7)), half = ((vert ? bx.h : bx.w) / 2 + pad) * (1 - e);
    if (e >= 1 || half <= 0.5) return [];
    return [vert ? V.polygon(bx.x0 - sz, bx.cy - half, bx.x1 + sz, bx.cy + half) : V.polygon(bx.cx - half, bx.y0 - sz, bx.cx + half, bx.y1 + sz)];
  });
  return function () { return null; };
});

reg('tyToIndex', 'src/11p_typo2.js', function (c) {
  var gs0 = V.glyphs(c, c.node), plain = nonSpace(gs0), sub = H.subCol(c.sc), vert = !!c.node.vertical;
  var base = plain.length <= 1 ? Math.round(+c.node.mi || 0) : 0, num = Object.create(null);
  plain.forEach(function (g, k) { var s = String(base + k + 1); num[g.i] = s.length < 2 ? '0' + s : s; });
  return function (p, g) {
    var q = cl((p - ordAt(c, gs0, g.i) * 0.4) / 0.6);
    if (q <= 0) return null;
    if (q >= 1) return HIDE;
    if (q < 0.3) return { s: mix(1, 0.55, iCubic(q / 0.3)) };
    var u = (q - 0.3) / 0.7, o = { ch: num[g.i] || '00', s: 0.42, color: sub, a: 1 - iCubic(u) };
    if (vert) o.dx = -g.w * 0.2 * u; else o.dy = -g.h * 0.2 * u;
    return o;
  };
});

reg('tyKeyLast', 'src/11p_typo2.js', function (c) {
  var gs0 = V.glyphs(c, c.node), plain = nonSpace(gs0), stInfo = soloInfo(c, gs0);
  var ki = plain.length > 1 ? keyGlyph(gs0) : (plain[0] ? plain[0].i : 0);
  var gk = gs0.find(function (g) { return g.i === ki; }) || plain[0] || gs0[0];
  var md = 1; plain.forEach(function (g) { md = Math.max(md, Math.abs(g.i - ki)); });
  var soloKeep = stInfo.solo && isKanji((plain[0] || {}).ch) && ((Math.floor(rand(cutSeed(c), stInfo.mi, 5) * 100) % 2) === 0);
  return function (p, g) {
    if (stInfo.solo) {
      if (!soloKeep) { var qs = cl(p / 0.5); return qs >= 1 ? HIDE : { s: 1 - 0.6 * iCubic(qs), a: 1 - qs }; }
      var qk = cl((p - 0.4) / 0.6); return qk >= 1 ? HIDE : { s: 1 + iCubic(qk) * 1.4, a: 1 - iCubic(qk) };
    }
    if (g.i === ki) {
      var qm = cl((p - 0.45) / 0.55);
      return qm >= 1 ? HIDE : { s: 1 + iCubic(qm) * 1.8, a: 1 - iCubic(qm) };
    }
    var d = Math.abs(g.i - ki) / md, q = cl((p - (1 - d) * 0.2) / 0.45);
    if (q <= 0) return null; if (q >= 1) return HIDE;
    var e = iCubic(q);
    return { dx: (gcx(gk, c.node) - gcx(g, c.node)) * e, dy: (gcy(gk, c.node) - gcy(g, c.node)) * e, s: 1 - 0.6 * e, a: 1 - e };
  };
});

reg('tyUnderSink', 'src/11p_typo2.js', function (c) {
  var gs0 = V.glyphs(c, c.node), vert = !!c.node.vertical, sz = c.node.size;
  var lines = lineInfoList(gs0, vert, c.node), rng = outRange(c), ac = H.accCol(c.sc), sx = c.node.sx == null ? 1 : c.node.sx, sy = 1;
  if (rng.ok && lines.length) {
    var loc = V.local(c, c.node, 'TyUnderSink'), lw = Math.max(2.5, sz * 0.05);
    lines.forEach(function (L, k) {
      var off = vert ? L.c - sz * sx * 0.56 : L.c + sz * sy * 0.56;
      addLocalShape(c, loc, rng, 'UnderLine_' + k, vert ? G.rect(-lw / 2, -1, lw, 1) : G.rect(0, -lw / 2, 1, lw), { fill: ac, alpha: 0 }, function (p) {
        var qb = E.outExpo(cl(p / 0.28)), qr = iCubic(cl((p - 0.78) / 0.22));
        var a = mix(L.a0, L.a1, qr), b = mix(L.a0, L.a1, qb), len = b - a;
        if (len < 1) return { alpha: 0 };
        return vert ? { 'position.x': off, 'position.y': -a, 'scale.y': len, alpha: 1 } : { 'position.x': a, 'position.y': -off, 'scale.x': len, alpha: 1 };
      });
    });
  }
  return function (p, g) {
    var q = cl((p - 0.2 - ordAt(c, gs0, g.i) * 0.4) / 0.35);
    if (q <= 0) return null; if (q >= 1) return HIDE;
    var e = iCubic(q), d = e * 1.25;
    return vert ? { dx: -g.w * sx * d, clipX: [-0.55 + d, 0.7] } : { dy: g.h * sy * d, clipY: [-0.7, 0.55 - d] };
  };
});

reg('tyFoldVert', 'src/11p_typo2.js', function (c) {
  var gs0 = V.glyphs(c, c.node), vert = !!c.node.vertical, sx = c.node.sx == null ? 1 : c.node.sx, sy = 1;
  var ln = Object.create(null);
  gs0.forEach(function (g) {
    if (isBlank(g.ch)) return;
    if (!ln[g.li]) ln[g.li] = { gs: [], c0: 1e9, c1: -1e9 };
    var L = ln[g.li], cv = vert ? g.y : g.x;
    L.gs.push(g); L.c0 = Math.min(L.c0, cv); L.c1 = Math.max(L.c1, cv);
  });
  return function (p, g, gs, e2) {
    var e = ioCubic(cl(p / 0.5)), f = cl((p - 0.36) / 0.5);
    if (f >= 1) return HIDE;
    var L = ln[g.li]; if (!L) return null;
    var k = Math.max(0, L.gs.findIndex(function (q) { return q.i === g.i; })), n = L.gs.length, mid = (L.c0 + L.c1) / 2;
    var pitch = Math.min(1.02, (vert ? e2.W : e2.H) * 0.82 / Math.max(1, n * (vert ? g.w * sx : g.h * sy)));
    var off = (k - (n - 1) / 2) * pitch;
    var dx = !vert ? (mid - g.x) * sx : off * g.w * sx;
    var dy = !vert ? off * g.h * sy : (mid - g.y) * sy;
    var drift = iQuad(f) * e2.size * 0.25;
    return { dx: dx * e - (vert ? drift : 0), dy: dy * e + (vert ? 0 : drift), a: 1 - iQuad(f) };
  };
});

/* =====================================================================
   PART 6: x2_typoB (8)
   ===================================================================== */

reg('tzCondense', 'src/11p_x2_typoB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), vert = !!c.node.vertical, sz = c.node.size;
  var lines = lineInfoList(gs0, vert, c.node), lm = Object.create(null);
  lines.forEach(function (L) { lm[L.li] = L; });
  var rng = outRange(c), ac = H.accCol(c.sc), crossK = sz * 1.15;
  if (rng.ok && lines.length) {
    var loc = V.local(c, c.node, 'TzCondense'), lw = Math.max(2, sz * 0.028);
    lines.slice(0, 6).forEach(function (L, k) {
      var mid = (L.a0 + L.a1) / 2;
      addLocalShape(c, loc, rng, 'Rule_' + k, vert ? G.rect(-0.5, -lw / 2, 1, lw) : G.rect(-lw / 2, -0.5, lw, 1), { fill: ac, alpha: 0 }, function (p) {
        var ra = cl((p - 0.28) / 0.2), sh = 1 - iCubic(cl((p - 0.6) / 0.4)), hh = crossK * 0.58 * sh;
        if (ra <= 0.01 || hh <= 0.5) return { alpha: 0 };
        return vert ? { 'position.x': L.c, 'position.y': -mid, 'scale.x': hh * 2, alpha: ra }
          : { 'position.x': mid, 'position.y': -L.c, 'scale.y': hh * 2, alpha: ra };
      });
    });
  }
  return function (p, g) {
    if (p >= 0.55) return HIDE;
    var L = lm[g.li]; if (!L) return null;
    var e = ioCubic(cl(p / 0.55)), d = ((L.a0 + L.a1) / 2 - (vert ? gcy(g, c.node) : gcx(g, c.node))) * e, k = Math.max(0.04, 1 - 0.96 * e);
    return vert ? { dy: d, sy: k } : { dx: d, sx: k };
  };
});

reg('tzProofDelete', 'src/11p_x2_typoB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), plain = nonSpace(gs0), sx = c.node.sx == null ? 1 : c.node.sx, sy = 1;
  var rng = outRange(c), ac = H.accCol(c.sc), lw = Math.max(2, c.node.size * 0.035);
  if (rng.ok) {
    var loc = V.local(c, c.node, 'TzProofDelete');
    plain.slice(0, 40).forEach(function (g) {
      var ord = ordAt(c, gs0, g.i), t0 = ord * 0.5, cx = g.x * sx, cy = g.y * sy, hw = g.w * sx * 0.5, hh = g.h * sy * 0.56;
      var len = Math.hypot(hw * 2, hh * 2), ang = Math.atan2(-hh * 2, hw * 2) / DEG;
      addLocalShape(c, loc, rng, 'Slash_' + g.i, G.rect(0, -lw / 2, 1, lw), { fill: ac, alpha: 0 }, function (p) {
        if (p <= t0 || p >= t0 + 0.42) return { alpha: 0 };
        var d = cl((p - t0) / 0.09), r = cl((p - t0 - 0.32) / 0.1), span = d - r;
        if (span <= 0.01) return { alpha: 0 };
        return { 'position.x': cx - hw + 2 * hw * r, 'position.y': -(cy + hh - 2 * hh * r), rotation: -ang, 'scale.x': len * span, alpha: 1 };
      });
    });
  }
  return function (p, g) { return p >= ordAt(c, gs0, g.i) * 0.5 + 0.16 ? HIDE : null; };
});

reg('tzHalfCut', 'src/11p_x2_typoB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), vert = !!c.node.vertical, sz = c.node.size;
  var lines = lineInfoList(gs0, vert, c.node), plain = nonSpace(gs0), stInfo = soloInfo(c, gs0), rank = Object.create(null);
  plain.forEach(function (g, j) { rank[g.i] = stInfo.solo ? stInfo.mi : j; });
  var rng = outRange(c), ac = H.accCol(c.sc);
  if (rng.ok && !stInfo.solo && lines.length) {
    var loc = V.local(c, c.node, 'TzHalfCut'), lw = Math.max(1.5, sz * 0.022), pad = sz * 0.14;
    lines.slice(0, 6).forEach(function (L, k) {
      var a0 = L.a0 - pad, a1 = L.a1 + pad, mid = (a0 + a1) / 2;
      addLocalShape(c, loc, rng, 'HalfRule_' + k, vert ? G.rect(-lw / 2, -1, lw, 1) : G.rect(0, -lw / 2, 1, lw), { fill: ac, alpha: 0 }, function (p) {
        var qb = E.outExpo(cl(p / 0.24)), sh = 1 - iCubic(cl((p - 0.56) / 0.44));
        var a = p < 0.56 ? a0 : mid - (mid - a0) * sh, b = p < 0.56 ? mix(a0, a1, qb) : mid + (a1 - mid) * sh, len = b - a;
        if (len <= 1) return { alpha: 0 };
        return vert ? { 'position.x': L.c, 'position.y': -a, 'scale.y': len, alpha: 1 } : { 'position.x': a, 'position.y': -L.c, 'scale.x': len, alpha: 1 };
      });
    });
  }
  return function (p, g) {
    if (p < 0.26) return null;
    if (p >= 0.54) return HIDE;
    var top = ((rank[g.i] || 0) & 1) === 0;
    return vert ? { clipX: top ? [0, 0.7] : [-0.7, 0] } : { clipY: top ? [0, 0.7] : [-0.7, 0] };
  };
});

reg('tzSelectDelete', 'src/11p_x2_typoB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), vert = !!c.node.vertical, sz = c.node.size;
  var lines = lineInfoList(gs0, vert, c.node), nL = Math.max(1, lines.length), stInfo = soloInfo(c, gs0), rng = outRange(c), ac = H.accCol(c.sc);
  if (rng.ok && lines.length) {
    var locPre = V.local(c, c.node, 'TzSelBox'), hh = sz * 0.62, pad = sz * 0.08;
    lines.slice(0, 8).forEach(function (L, k) {
      var id = addLocalShape(c, locPre, rng, 'Sel_' + k, vert ? G.rect(-hh, -1, hh * 2, 1) : G.rect(0, -hh, 1, hh * 2), { fill: ac, alpha: 0 }, function (p) {
        if (p >= 0.62) return { alpha: 0 };
        var q = ioCubic(cl(p / 0.5)), u = cl(q * nL - k);
        if (u <= 0) return { alpha: 0 };
        var a = L.a0 - pad, len = (L.a1 + pad - a) * u;
        return vert ? { 'position.x': L.c, 'position.y': -a, 'scale.y': Math.max(1, len), alpha: 0.42 }
          : { 'position.x': a, 'position.y': -L.c, 'scale.x': Math.max(1, len), alpha: 0.42 };
      });
      if (id) post(c, function (graph, ids) { insertBeforeLayer(graph, locPre, ids[0]); insertBeforeLayer(graph, id, ids[0]); });
    });
    if (!stInfo.solo) {
      var L0 = lines[0], locPost = V.local(c, c.node, 'TzSelCaret'), lw = Math.max(2, sz * 0.03), ch = sz * 0.56;
      var a0 = L0.a0 - pad;
      addLocalShape(c, locPost, rng, 'Caret', vert ? G.rect(-ch, -lw / 2, ch * 2, lw) : G.rect(-lw / 2, -ch, lw, ch * 2), { fill: ac, alpha: 0 }, function (p) {
        var on = p >= 0.62 && p < 0.96 && !(p >= 0.76 && p < 0.86);
        return vert ? { 'position.x': L0.c, 'position.y': -a0, alpha: on ? 1 : 0 } : { 'position.x': a0, 'position.y': -L0.c, alpha: on ? 1 : 0 };
      });
    }
  }
  return function (p) { return p >= 0.62 ? HIDE : null; };
});

reg('tzOverset', 'src/11p_x2_typoB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), stInfo = soloInfo(c, gs0), b = lineBounds(gs0), vert = !!c.node.vertical, sz = c.node.size, pad = sz * 0.1;
  var steps = cl(nonSpace(gs0).length, 2, 7), dist = (vert ? b.h : b.w) + sz * 0.2, ac = H.accCol(c.sc), rng = outRange(c);
  if (!stInfo.solo) {
    applyExitWindowClip(c, false, function (p, bx) {
      if (p >= 0.9) return [];
      return [vert ? V.polygon(bx.x0 - sz, bx.y0 - pad, bx.x1 + sz, bx.y1 + pad) : V.polygon(bx.x0 - pad, bx.y0 - sz, bx.x1 + pad, bx.y1 + sz)];
    });
    applyExitWholeRig(c, function (p) {
      if (p >= 0.9) return { a: 0 };
      var k = cl(p / 0.9) * steps, st2 = Math.min(steps, Math.floor(k)), f = k - st2;
      var step = Math.min(1, (st2 + E.outExpo(cl(f * 2.4))) / steps);
      return vert ? { dy: dist * step } : { dx: dist * step };
    });
    if (rng.ok) {
      var loc = V.local(c, c.node, 'TzOversetMark'), lw = Math.max(1.5, sz * 0.022), ex = sz * 0.15, hs = Math.max(6, sz * 0.16);
      var rPts = vert
        ? [[-hs / 2, b.y1 + pad], [hs / 2, b.y1 + pad], [0, b.y1 + pad], [0, b.y1 + pad - hs * 0.28], [0, b.y1 + pad + hs * 0.28]]
        : null;
      addLocalShape(c, loc, rng, 'MarginRule', vert ? G.rect(-1, -lw / 2, 1, lw) : G.rect(-lw / 2, -1, lw, 1), { fill: ac, alpha: 0 }, function (p) {
        var qa = E.outExpo(cl(p / 0.12)), qr = iCubic(cl((p - 0.88) / 0.12));
        if (qa <= qr) return { alpha: 0 };
        if (!vert) {
          var y0 = b.y0 - ex, y1 = b.y1 + ex, a = mix(y0, y1, qr), b2 = mix(y0, y1, qa);
          return { 'position.x': b.x1 + pad, 'position.y': -a, 'scale.y': Math.max(1, b2 - a), alpha: 1 };
        }
        var x0 = b.x0 - ex, x1 = b.x1 + ex, av = mix(x1, x0, qa), bv = mix(x1, x0, qr);
        return { 'position.x': av, 'position.y': -(b.y1 + pad), 'scale.x': Math.max(1, bv - av), alpha: 1 };
      });
      var cxm = vert ? b.x0 - ex - hs * 0.8 : b.x1 + pad, cym = vert ? b.y1 + pad : b.y1 + ex + hs * 0.8;
      var boxCmds = G.rect(-hs / 2, -hs / 2, hs, hs).concat(G.rect(-hs * 0.28, -lw / 2, hs * 0.56, lw)).concat(G.rect(-lw / 2, -hs * 0.28, lw, hs * 0.56));
      addLocalShape(c, loc, rng, 'PlusBox', G.rect(-hs / 2, -hs / 2, hs, hs), { stroke: ac, width: lw, alpha: 0 }, function (p) {
        return { 'position.x': cxm, 'position.y': -cym, alpha: p > 0.1 && p < 0.9 ? 1 : 0 };
      });
      addLocalShape(c, loc, rng, 'PlusH', G.rect(-hs * 0.28, -lw / 2, hs * 0.56, lw), { fill: ac, alpha: 0 }, function (p) {
        return { 'position.x': cxm, 'position.y': -cym, alpha: p > 0.1 && p < 0.9 ? 1 : 0 };
      });
      addLocalShape(c, loc, rng, 'PlusV', G.rect(-lw / 2, -hs * 0.28, lw, hs * 0.56), { fill: ac, alpha: 0 }, function (p) {
        return { 'position.x': cxm, 'position.y': -cym, alpha: p > 0.1 && p < 0.9 ? 1 : 0 };
      });
      if (rPts && rPts.length < 0) void 0;
    }
    return function () { return null; };
  }
  return function (p) {
    var o = ordAt(c, gs0, gs0[0].i), q = cl((p - (1 - o) * 0.6) / 0.3);
    if (q >= 1) return HIDE;
    var d = sz * 0.45 * (q <= 0 ? 0 : q < 0.5 ? 0.5 : 1);
    return vert ? { dy: d } : { dx: d };
  };
});

reg('tzRulesClose', 'src/11p_x2_typoB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), stInfo = soloInfo(c, gs0), b = lineBounds(gs0), vert = !!c.node.vertical, sz = c.node.size, pad = sz * 0.14;
  var rng = outRange(c), ac = H.accCol(c.sc), lw = Math.max(1.5, sz * 0.022);
  applyExitWindowClip(c, false, function (p, bx) {
    var e = ioCubic(cl((p - 0.16) / 0.5));
    if (e >= 1) return [];
    var lo = vert ? mix(bx.x0 - pad, bx.cx, e) : mix(bx.y0 - pad, bx.cy, e);
    var hi = vert ? mix(bx.x1 + pad, bx.cx, e) : mix(bx.y1 + pad, bx.cy, e);
    return [vert ? V.polygon(lo, bx.y0 - sz, hi, bx.y1 + sz) : V.polygon(bx.x0 - sz, lo, bx.x1 + sz, hi)];
  });
  if (rng.ok && !stInfo.solo) {
    var loc = V.local(c, c.node, 'TzRulesClose');
    [-1, 1].forEach(function (side) {
      addLocalShape(c, loc, rng, 'Rule_' + (side < 0 ? 'Lo' : 'Hi'), vert ? G.rect(-lw / 2, -1, lw, 2) : G.rect(-1, -lw / 2, 2, lw), { fill: ac, alpha: 0 }, function (p) {
        var e = ioCubic(cl((p - 0.16) / 0.5));
        if (side > 0 && e >= 1) return { alpha: 0 };
        var half = ((vert ? b.h : b.w) / 2 + pad) * E.outExpo(cl(p / 0.2)) * (1 - iCubic(cl((p - 0.7) / 0.3)));
        if (half < 0.5) return { alpha: 0 };
        var pos = vert ? (side < 0 ? mix(b.x0 - pad, b.cx, e) : mix(b.x1 + pad, b.cx, e)) : (side < 0 ? mix(b.y0 - pad, b.cy, e) : mix(b.y1 + pad, b.cy, e));
        return vert ? { 'position.x': pos, 'position.y': -b.cy, 'scale.y': half, alpha: 1 } : { 'position.x': b.cx, 'position.y': -pos, 'scale.x': half, alpha: 1 };
      });
    });
  }
  return function () { return null; };
});

reg('tzToFootnote', 'src/11p_x2_typoB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), stInfo = soloInfo(c, gs0), b = lineBounds(gs0), vert = !!c.node.vertical, sz = c.node.size;
  var sub = H.subCol(c.sc), al = c.node.align, col = c.node.color, rng = outRange(c);
  applyExitWholeRig(c, function (p) {
    if (p >= 0.8) return { a: 0 };
    var e = ioCubic(cl(p / 0.45)), s = mix(1, 0.3, e);
    var ax = !vert ? (al === 'left' ? 0 : al === 'right' ? b.x1 : b.cx) : b.x1;
    var ay = !vert ? b.y1 : (al === 'left' ? 0 : b.y1);
    return { ax: ax, ay: ay, sx: s, sy: s, color: typeof col === 'string' ? H.mixHex(col, sub, e * 0.7) : null };
  });
  if (rng.ok && !stInfo.solo && !c.node.rot) {
    var loc = V.local(c, c.node, 'TzFootnoteRule'), lw = Math.max(1.5, sz * 0.02), g = sz * 0.12;
    addLocalShape(c, loc, rng, 'SepRule', vert ? G.rect(-lw / 2, 0, lw, 1) : G.rect(0, -lw / 2, 1, lw), { fill: sub, alpha: 0 }, function (p) {
      var qd = E.outExpo(cl((p - 0.25) / 0.3)), qr = iCubic(cl((p - 0.8) / 0.2));
      if (qd <= qr) return { alpha: 0 };
      if (!vert) {
        var y = b.y1 - b.h * 0.3 - g, len = Math.min(b.w * 0.5, sz * 2.4), span = len * (qd - qr);
        return { 'position.x': b.x0 + len * qr, 'position.y': -y, 'scale.x': Math.max(1, span), alpha: 1 };
      }
      var x = b.x1 - b.w * 0.3 - g, lenV = Math.min(b.h * 0.5, sz * 2.4), spanV = lenV * (qd - qr);
      return { 'position.x': x, 'position.y': -(b.y0 + lenV * qr), 'scale.y': Math.max(1, spanV), alpha: 1 };
    });
  }
  return function () { return null; };
});

reg('tzToTofu', 'src/11p_x2_typoB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), plain = nonSpace(gs0), sx = c.node.sx == null ? 1 : c.node.sx, sy = 1;
  var rng = outRange(c), col = c.node.color || c.sc.fg || '#ffffff', lw = Math.max(1.5, c.node.size * 0.022);
  if (rng.ok) {
    var loc = V.local(c, c.node, 'TzToTofu');
    plain.slice(0, 40).forEach(function (g) {
      var t0 = ordAt(c, gs0, g.i) * 0.45, cx = g.x * sx, cy = g.y * sy, hw = g.w * sx * 0.42, hh = g.h * sy * 0.42;
      addLocalShape(c, loc, rng, 'Tofu_' + g.i, G.rect(-hw, -hh, hw * 2, hh * 2), { stroke: col, width: lw, alpha: 0 }, function (p) {
        if (p < t0 || p >= t0 + 0.42) return { alpha: 0 };
        var u = (p - t0) / 0.42, k = u > 0.8 ? 1 - iCubic((u - 0.8) / 0.2) * 0.6 : 1;
        return { 'position.x': cx, 'position.y': -cy, 'scale.x': k, 'scale.y': k, alpha: 1 };
      });
    });
  }
  return function (p, g) { return p >= ordAt(c, gs0, g.i) * 0.45 + 0.05 ? HIDE : null; };
});

/* =====================================================================
   PART 7: x2_waB (8)
   ===================================================================== */

reg('wzShojiKage', 'src/11p_x2_waB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), vert = !!c.node.vertical, sz = c.node.size, dir = rand(cutSeed(c), 21, 5) < 0.5 ? -1 : 1;
  var main = isPrimary(c, gs0), col = c.node.color || c.sc.fg || '#ffffff';
  var paper = H.mixHex(c.sc.bg || '#101010', c.sc.fg || '#ffffff', H.dark(c.sc.bg || '#101010') ? 0.16 : 0.1);
  var silCol = H.mixHex(paper, H.dark(c.sc.bg || '#101010') ? '#000000' : col, 0.6);
  var rng = outRange(c), m = sz * 0.25, big = 5000;
  function uvBox(bx) {
    var U0 = (vert ? bx.y0 : bx.x0) - m, U1 = (vert ? bx.y1 : bx.x1) + m;
    var V0 = (vert ? bx.x0 : bx.y0) - m, V1 = (vert ? bx.x1 : bx.y1) + m;
    return { U0: U0, U1: U1, V0: V0, V1: V1, L: U1 - U0, T: V1 - V0 };
  }
  applyExitWindowClip(c, false, function (p, bx) {
    var e = ioCubic(cl(p / (main ? 0.5 : 0.92)));
    if (e >= 1) return [];
    var g = uvBox(bx), eu = dir > 0 ? mix(g.U0, g.U1, e) : mix(g.U1, g.U0, e);
    var u0 = dir > 0 ? eu : g.U0 - big, u1 = dir > 0 ? g.U1 + big : eu;
    return [vert ? V.polygon(g.V0 - big, u0, g.V1 + big, u1) : V.polygon(u0, g.V0 - big, u1, g.V1 + big)];
  });
  if (main) {
    (c.node._jzTwins = c.node._jzTwins || []).push({
      label: 'ShojiSilhouette', below: false,
      setup: function (graph, clone, src, g, gs) {
        var cut = c.cut, parent = c.parent, options = c.options;
        clone.attrs['material.materialColor'] = silCol;
        clone.keys = {};
        var placeId = rootPlaceNull(graph, [clone.id], cut, c.node, c.comp, parent);
        var b = lineBounds(gs), uv = uvBox(b), byFrame = Object.create(null);
        for (var f = rng.start; f < cut.end; f++) {
          var p = poutAt(c, f), e = ioCubic(cl(p / 0.5)), eu = dir > 0 ? mix(uv.U0, uv.U1, e) : mix(uv.U1, uv.U0, e);
          var c0 = dir > 0 ? uv.U0 : eu, c1 = dir > 0 ? eu : uv.U1;
          if (c1 - c0 < 0.5 || p >= 0.8) { byFrame[f] = []; continue; }
          var poly = vert ? V.polygon(uv.V0, c0, uv.V1, c1) : V.polygon(c0, uv.V0, c1, uv.V1);
          byFrame[f] = [toScenePoly(graph, placeId, f, poly)];
        }
        C.sample(graph, clone.id, clone.start, clone.end, function (f) {
          if (f < rng.start) return { alpha: 0 };
          var p = poutAt(c, f), sil = 1 - H.smoothstep(0.42, 0.8, p), pa = 1 - H.smoothstep(0.74, 1, p);
          return { alpha: sil * pa * 0.75 };
        });
        H.multiClip(graph, clone.id, byFrame, false, 'Shoji silhouette', options);
      }
    });
    if (rng.ok) {
      post(c, function (graph, ids, gs) {
        var bx = lineBounds(gs), g = uvBox(bx), loc = V.local(c, c.node, 'ShojiDoor');
        var nv = Math.max(2, Math.round(g.T / (sz * 0.5))), cu = sz * 0.78, lw = Math.max(1.5, sz * 0.02);
        var paperId = addLocalShape(c, loc, rng, 'ShojiPaper', vert ? G.rect(0, 0, 1, 1) : G.rect(0, 0, 1, 1), { fill: paper, alpha: 0 }, function (p) {
          var e = ioCubic(cl(p / 0.5)), pa = 1 - H.smoothstep(0.74, 1, p), eu = dir > 0 ? mix(g.U0, g.U1, e) : mix(g.U1, g.U0, e);
          var c0 = dir > 0 ? g.U0 : eu, c1 = dir > 0 ? eu : g.U1;
          if (c1 - c0 < 0.5 || pa <= 0.01) return { alpha: 0 };
          return vert ? { 'position.x': g.V0, 'position.y': -c0, 'scale.x': g.T, 'scale.y': -(c1 - c0), alpha: pa * 0.97 }
            : { 'position.x': c0, 'position.y': -g.V0, 'scale.x': c1 - c0, 'scale.y': -g.T, alpha: pa * 0.97 };
        });
        if (paperId) insertBeforeLayer(graph, loc, ids[0]);
        for (var k = 1; k < nv; k++) {
          (function (vPos, kk) {
            addLocalShape(c, loc, rng, 'KumikoV_' + kk, vert ? G.rect(-lw * 0.35, 0, lw * 0.7, 1) : G.rect(0, -lw * 0.35, 1, lw * 0.7), { fill: col, alpha: 0 }, function (p) {
              var e = ioCubic(cl(p / 0.5)), pa = 1 - H.smoothstep(0.74, 1, p), eu = dir > 0 ? mix(g.U0, g.U1, e) : mix(g.U1, g.U0, e);
              var c0 = dir > 0 ? g.U0 : eu, c1 = dir > 0 ? eu : g.U1;
              if (c1 - c0 < 1 || pa <= 0.01) return { alpha: 0 };
              return vert ? { 'position.x': vPos, 'position.y': -c0, 'scale.y': -(c1 - c0), alpha: pa * 0.6 }
                : { 'position.x': c0, 'position.y': -vPos, 'scale.x': c1 - c0, alpha: pa * 0.6 };
            });
          })(g.V0 + g.T * k / nv, k);
        }
        [0, 1].forEach(function (sideIdx) {
          addLocalShape(c, loc, rng, 'Rail_' + sideIdx, vert ? G.rect(-lw / 2, 0, lw, 1) : G.rect(0, -lw / 2, 1, lw), { fill: col, alpha: 0 }, function (p) {
            var e = ioCubic(cl(p / 0.5)), pa = 1 - H.smoothstep(0.74, 1, p), eu = dir > 0 ? mix(g.U0, g.U1, e) : mix(g.U1, g.U0, e);
            var c0 = dir > 0 ? g.U0 : eu, c1 = dir > 0 ? eu : g.U1;
            if (c1 - c0 < 1 || pa <= 0.01) return { alpha: 0 };
            var vp = sideIdx === 0 ? g.V0 + lw * 0.5 : g.V1 - lw * 0.5;
            return vert ? { 'position.x': vp, 'position.y': -c0, 'scale.y': -(c1 - c0), alpha: pa * 0.85 }
              : { 'position.x': c0, 'position.y': -vp, 'scale.x': c1 - c0, alpha: pa * 0.85 };
          });
        });
        addLocalShape(c, loc, rng, 'StileEdge', vert ? G.rect(0, -lw * 0.8, 1, lw * 1.6) : G.rect(-lw * 0.8, 0, lw * 1.6, 1), { fill: col, alpha: 0 }, function (p) {
          var e = ioCubic(cl(p / 0.5)), pa = 1 - H.smoothstep(0.74, 1, p), eu = dir > 0 ? mix(g.U0, g.U1, e) : mix(g.U1, g.U0, e);
          var c0 = dir > 0 ? g.U0 : eu, c1 = dir > 0 ? eu : g.U1;
          if (c1 - c0 < lw * 1.6 || pa <= 0.01) return { alpha: 0 };
          var xp = Math.max(c0, Math.min(c1 - lw * 1.6, dir > 0 ? eu - lw * 0.8 : eu + lw * 0.8));
          return vert ? { 'position.x': g.V0, 'position.y': -xp, 'scale.x': g.T, alpha: pa * 0.85 }
            : { 'position.x': xp, 'position.y': -g.V0, 'scale.y': -g.T, alpha: pa * 0.85 };
        });
      });
    }
  }
  return function () { return null; };
});

reg('wzSumiNijimi', 'src/11p_x2_waB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), sd = seedOf(c), col = c.node.color || c.sc.fg || '#ffffff', rng = outRange(c);
  function qf(i) { return stg(arguments[1], rand(sd, idxAt(c, gs0, i), 31), 0.45); }
  if (rng.ok && isPrimary(c, gs0)) {
    post(c, function (graph, ids, gs) {
      var loc = V.local(c, c.node, 'SumiNijimi'), sx = c.node.sx == null ? 1 : c.node.sx, sy = 1;
      gs.slice(0, 18).forEach(function (g) {
        if (isBlank(g.ch)) return;
        var unitPts = [];
        for (var k = 0; k < 10; k++) {
          var an = k / 10 * TAU, rr = 0.76 + 0.34 * rand(sd, g.i, k, 32);
          unitPts.push([Math.cos(an) * rr, Math.sin(an) * rr]);
        }
        var R0 = Math.max(g.w * sx, g.h * sy), gx = g.x * sx, gy = g.y * sy;
        addLocalShape(c, loc, rng, 'Blot_' + g.i, V.commands(unitPts, true), { fill: col, alpha: 0 }, function (p) {
          var q = stg(p, rand(sd, idxAt(c, gs0, g.i), 31), 0.45);
          if (q <= 0 || q >= 1) return { alpha: 0 };
          var R = R0 * mix(0.2, 0.72, oCubic(q)), a = Math.min(1, q * 3.2) * Math.pow(1 - q, 1.3) * 0.9;
          return { 'position.x': gx, 'position.y': -gy, 'scale.x': R, 'scale.y': R, alpha: a };
        });
        for (var d = 0; d < 2; d++) {
          (function (dd, an2, dm, rad) {
            addLocalShape(c, loc, rng, 'Splash_' + g.i + '_' + dd, G.ellipse(0, 0, rad, rad), { fill: col, alpha: 0 }, function (p) {
              var q = stg(p, rand(sd, idxAt(c, gs0, g.i), 31), 0.45);
              if (q <= 0 || q >= 1) return { alpha: 0 };
              var R = R0 * mix(0.2, 0.72, oCubic(q)), a = Math.min(1, q * 3.2) * Math.pow(1 - q, 1.3) * 0.72;
              return { 'position.x': gx + Math.cos(an2) * R * dm, 'position.y': -(gy + Math.sin(an2) * R * dm), 'scale.x': R, 'scale.y': R, alpha: a };
            });
          })(d, rand(sd, g.i, d, 34) * TAU, 1.05 + 0.5 * rand(sd, g.i, d, 35), 0.07 + 0.09 * rand(sd, g.i, d, 36));
        }
      });
    });
  }
  return function (p, g) {
    var q = qf(g.i, p);
    if (q <= 0) return null; if (q >= 1) return HIDE;
    return { a: 1 - H.smoothstep(0.05, 0.5, q), s: 1 + 0.12 * q };
  };
});

reg('wzHanaChiru', 'src/11p_x2_waB.js', function (c) {
  var PETAL = [[0, -1], [0.58, -0.3], [0.4, 0.75], [0, 0.5], [-0.4, 0.75], [-0.58, -0.3]];
  var gs0 = V.glyphs(c, c.node), stInfo = soloInfo(c, gs0), sd = seedOf(c), sz = c.node.size;
  var dir = rand(cutSeed(c), 41, 5) < 0.5 ? -1 : 1, c1 = hotOf(c), c2 = H.mixHex(c1, c.sc.fg || '#ffffff', 0.35), rng = outRange(c);
  function qfAt(p, g, gs) {
    var m = stInfo.solo ? stInfo.cn : gs.length, ix = stInfo.solo ? stInfo.mi : g.i;
    var o = m > 1 ? ix / (m - 1) : 0;
    return stg(p, cl(dir > 0 ? 1 - o : o), 0.45);
  }
  if (rng.ok && isPrimary(c, gs0)) {
    post(c, function (graph, ids, gs) {
      var loc = V.local(c, c.node, 'HanaChiru'), K = Math.round(cl(90 / Math.max(1, gs.length), 2, 5));
      var cmdP = V.commands(PETAL, true), sx = c.node.sx == null ? 1 : c.node.sx, sy = 1;
      gs.slice(0, 16).forEach(function (g) {
        if (isBlank(g.ch)) return;
        var gx = g.x * sx, gy = g.y * sy;
        for (var k = 0; k < K; k++) {
          (function (kk, pCol) {
            var r1 = rand(sd, g.i, kk, 42), ph = rand(sd, g.i, kk, 44) * TAU;
            var jx = rs(sd, g.i, kk, 45) * g.w * sx * 0.3, jy = rs(sd, g.i, kk, 46) * g.h * sy * 0.3;
            var r47 = rand(sd, g.i, kk, 47), ps = sz * 0.12 * (0.7 + 0.6 * rand(sd, g.i, kk, 48));
            addLocalShape(c, loc, rng, 'Petal_' + g.i + '_' + kk, cmdP, { fill: pCol, alpha: 0 }, function (p) {
              var q = qfAt(p, g, gs); if (q <= 0) return { alpha: 0 };
              var t = cl(q * 1.28 - 0.28 * rand(sd, g.i, kk, 43)); if (t <= 0 || t >= 1) return { alpha: 0 };
              var a = H.smoothstep(0, 0.12, t) * (1 - H.smoothstep(0.55, 1, t)); if (a <= 0.01) return { alpha: 0 };
              var px = gx + jx + dir * (sz * 2 + c.comp.width * 0.1) * Math.pow(t, 1.4) * (0.55 + 0.8 * r1) + Math.sin(t * 7 + ph) * sz * 0.18;
              var py = gy + jy - sz * 0.55 * Math.sin(t * PI * 0.9) * r1 + sz * 0.9 * t * t * (0.4 + r47);
              var rot = (ph + t * 6 * (r1 < 0.5 ? -1 : 1)) / DEG, fl = 0.3 + 0.7 * Math.abs(Math.cos(t * 9 + ph));
              return { 'position.x': px, 'position.y': -py, rotation: -rot, 'scale.x': ps * fl, 'scale.y': ps, alpha: a };
            });
          })(k, k % 2 ? c2 : c1);
        }
      });
    });
  }
  return function (p, g, gs, e) {
    var q = qfAt(p, g, gs);
    if (q <= 0) return null; if (q >= 1) return HIDE;
    return { a: 1 - H.smoothstep(0.05, 0.5, q), s: 1 - 0.25 * q, dx: dir * e.size * 0.3 * q * q, dy: -e.size * 0.08 * q };
  };
});

reg('wzKasumi', 'src/11p_x2_waB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), cs = cutSeed(c), sz = c.node.size, m = sz * 0.3, big = 5000, rng = outRange(c);
  function rowsOf(p, b) {
    var Y0 = b.y0 - m, Y1 = b.y1 + m, R = Math.round(cl((Y1 - Y0) / (sz * 0.36), 4, 18)), h = (Y1 - Y0) / R, r = h / 2, X0 = b.x0 - m, X1 = b.x1 + m, out = [];
    for (var j = 0; j < R; j++) {
      var sd = ((j + (cs & 1)) % 2) ? 1 : -1;
      var e = ioCubic(stg(p, frac(j * 0.618 + rand(cs, 51, 1)), 0.42));
      out.push({ y0: Y0 + j * h, y1: Y0 + (j + 1) * h, r: r, sd: sd, e: e, hx: sd > 0 ? mix(X0 - r * 2, X1 + 1, e) : mix(X1 + r * 2, X0 - 1, e), first: j === 0, last: j === R - 1 });
    }
    return out;
  }
  applyExitWindowClip(c, false, function (p, b) {
    var out = [];
    rowsOf(p, b).forEach(function (L) {
      var yT = L.first ? -big : L.y0 - 0.5, yB = L.last ? big : L.y1 + 0.5, yc = (L.y0 + L.y1) / 2;
      if (L.e <= 0) { out.push(V.polygon(-big, yT, big, yB)); return; }
      if (L.e >= 1) return;
      var pts = [];
      if (L.sd > 0) {
        pts.push([L.hx, yT], [big, yT], [big, yB], [L.hx, yB], [L.hx, L.y1]);
        for (var s = 1; s < 8; s++) { var ang = mix(PI / 2, -PI / 2, s / 8); pts.push([L.hx + Math.cos(ang) * L.r, yc + Math.sin(ang) * L.r]); }
        pts.push([L.hx, L.y0]);
      } else {
        pts.push([-big, yT], [L.hx, yT], [L.hx, L.y0]);
        for (var s2 = 1; s2 < 8; s2++) { var ang2 = mix(-PI / 2, PI / 2, s2 / 8); pts.push([L.hx + Math.cos(ang2) * L.r, yc + Math.sin(ang2) * L.r]); }
        pts.push([L.hx, L.y1], [L.hx, yB], [-big, yB]);
      }
      out.push(pts);
    });
    return out;
  });
  if (rng.ok && isPrimary(c, gs0)) {
    post(c, function (graph, ids, gs) {
      var bx = lineBounds(gs), lc = quietOf(c.sc, c.node.color || c.sc.fg || '#ffffff'), lw = Math.max(2, sz * 0.026), tail = sz * 2.6;
      var loc = V.local(c, c.node, 'KasumiMist'), rows0 = rowsOf(0, bx);
      rows0.forEach(function (L0, j) {
        var yc = (L0.y0 + L0.y1) / 2, rr = L0.r - lw / 2;
        var capPts = [];
        for (var s = 0; s <= 10; s++) {
          var a = L0.sd > 0 ? mix(-PI / 2, PI / 2, s / 10) : mix(PI / 2, 3 * PI / 2, s / 10);
          capPts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
        }
        var cmds = V.commands([[0, -rr], [-L0.sd * tail, -rr]], false).concat(V.commands([[0, rr], [-L0.sd * tail * 0.6, rr]], false)).concat(V.commands(capPts, false));
        addLocalShape(c, loc, rng, 'MistHead_' + j, cmds, { stroke: lc, width: lw, alpha: 0 }, function (p) {
          var L = rowsOf(p, bx)[j];
          if (!L || L.e <= 0 || L.e >= 1) return { alpha: 0 };
          var a = H.smoothstep(0, 0.12, L.e) * (1 - H.smoothstep(0.82, 1, L.e));
          return { 'position.x': L.hx, 'position.y': -yc, alpha: a };
        });
      });
    });
  }
  return function () { return null; };
});

reg('wzFuroshiki', 'src/11p_x2_waB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), sz = c.node.size, tW = 0.64, dir = rand(cutSeed(c), 61, 5) < 0.5 ? -1 : 1;
  var main = isPrimary(c, gs0), col = c.node.color || c.sc.fg || '#ffffff';
  var cloth = sealOf(c.sc, col), cloth2 = H.mixHex(cloth, c.sc.bg || '#101010', 0.24), seam = H.mixHex(cloth, c.sc.fg || '#111111', 0.35);
  var rng = outRange(c);
  if (main && rng.ok) {
    post(c, function (graph, ids, gs) {
      var bx = lineBounds(gs), mg = sz * 0.28, hw = bx.w / 2 + mg, hh = bx.h / 2 + mg, lw = Math.max(1.5, sz * 0.02);
      var loc = V.local(c, c.node, 'Furoshiki');
      var bundle = graph.add('null', c.cut.id + ' / ' + c.node.id + ' / FuroBundle', loc, rng.start, rng.end, {});
      C.sample(graph, bundle, rng.start, rng.end, function (f) {
        var p = poutAt(c, f), wrap = cl((p - tW) / (1 - tW)), s = Math.max(0.01, 1 - iCubic(wrap));
        return { 'position.x': bx.cx, 'position.y': -(bx.cy - sz * 0.7 * Math.sin(wrap * PI / 2)),
          rotation: -(dir * (0.3 / DEG) * wrap), 'scale.x': s, 'scale.y': s };
      });
      var flapSpecs = [
        [[-hw, -hh], [-hw, hh], [-hw, 0]], [[hw, -hh], [hw, hh], [hw, 0]],
        [[-hw, -hh], [hw, -hh], [0, -hh]], [[-hw, hh], [hw, hh], [0, hh]]
      ];
      flapSpecs.forEach(function (sp, k) {
        var fId = addLocalShape(c, bundle, rng, 'Flap_' + k, V.commands([sp[0], sp[1], sp[2]], true),
          { fill: k % 2 ? cloth2 : cloth, stroke: seam, width: lw, alpha: 0 }, null);
        if (!fId) return;
        for (var f = rng.start; f < rng.end; f++) {
          var p = poutAt(c, f), wrap = cl((p - tW) / (1 - tW)), s = 1 - iCubic(wrap);
          var fl = ioCubic(stg(cl(p / tW), k / 3, 0.5));
          if (s <= 0.003 || fl <= 0.002) { setKey(graph, fId, 'alpha', f, 0, 1); continue; }
          var ap = [sp[2][0] * (1 - fl), sp[2][1] * (1 - fl)];
          setKey(graph, fId, 'alpha', f, 1, 1);
          setKey(graph, fId, 'path', f, V.commands([sp[0], sp[1], ap], true), 2);
        }
      });
      addLocalShape(c, bundle, rng, 'KnotCenter', G.ellipse(0, 0, sz * 0.1, sz * 0.1), { fill: seam, alpha: 0 }, function (p) {
        var wrap = cl((p - tW) / (1 - tW)), s = 1 - iCubic(wrap), kk = Math.min(1, wrap * 4);
        return { 'position.x': 0, 'position.y': hh * 0.1, 'scale.x': kk, 'scale.y': kk, alpha: wrap > 0 && s > 0.003 ? 1 : 0 };
      });
      [-1, 1].forEach(function (side) {
        var e = sz * 0.34;
        addLocalShape(c, bundle, rng, 'KnotEar_' + (side < 0 ? 'L' : 'R'),
          V.commands([[0, -hh * 0.1], [side * e * 1.3, -hh * 0.1 - e], [side * e * 0.3, -hh * 0.1 - e * 0.2]], true),
          { fill: cloth2, alpha: 0 }, function (p) {
            var wrap = cl((p - tW) / (1 - tW)), s = 1 - iCubic(wrap), kk = Math.min(1, wrap * 4);
            return { 'scale.x': Math.max(0.01, kk), 'scale.y': Math.max(0.01, kk), alpha: wrap > 0 && s > 0.003 ? 1 : 0 };
          });
      });
    });
  }
  return function (p) {
    if (!main) return p >= tW ? HIDE : { a: 1 - H.smoothstep(0.25, tW, p) };
    return p >= tW ? HIDE : null;
  };
});

reg('wzOrizuru', 'src/11p_x2_waB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), stInfo = soloInfo(c, gs0), sz = c.node.size, dir = rand(cutSeed(c), 71, 5) < 0.5 ? -1 : 1;
  var c1 = c.node.color || c.sc.fg || '#ffffff', c2 = H.mixHex(c1, hotOf(c), 0.55), rng = outRange(c);
  function qfAt(p, g, gs) {
    var m = stInfo.solo ? stInfo.cn : gs.length, ix = stInfo.solo ? stInfo.mi : g.i;
    return stg(p, m > 1 ? cl(ix / (m - 1)) : 0, 0.42);
  }
  if (rng.ok && isPrimary(c, gs0)) {
    post(c, function (graph, ids, gs) {
      var loc = V.local(c, c.node, 'Orizuru'), every = Math.max(1, Math.ceil(gs.length / 16)), sx = c.node.sx == null ? 1 : c.node.sx, sy = 1;
      var bodyCmds = V.commands([[-0.2, 0], [-0.72, -0.3], [-0.3, 0.1]], true)
        .concat(V.commands([[0.2, 0.02], [0.62, -0.4], [0.3, 0.12]], true))
        .concat(V.commands([[0.62, -0.4], [0.8, -0.28], [0.58, -0.3]], true))
        .concat(V.commands([[-0.34, 0], [0.34, 0], [0, 0.26]], true));
      var farWingCmd = V.commands([[-0.12, 0], [0.2, 0], [-0.02, -0.72]], true);
      var nearWingCmd = V.commands([[-0.2, 0.02], [0.14, 0.02], [0.1, -0.58]], true);
      gs.forEach(function (g) {
        if (isBlank(g.ch) || (g.i % every)) return;
        var craneNull = graph.add('null', c.cut.id + ' / ' + c.node.id + ' / Crane_' + g.i, loc, rng.start, rng.end, {});
        var gx = g.x * sx, gy = g.y * sy, r1 = rand(seedOf(c), g.i, 72, 1);
        C.sample(graph, craneNull, rng.start, rng.end, function (f) {
          var p = poutAt(c, f), q = qfAt(p, g, gs);
          if (q <= 0.06 || q >= 1) return { 'scale.x': 0.01, 'scale.y': 0.01 };
          var k1 = H.smoothstep(0.06, 0.3, q), t = cl((q - 0.22) / 0.78);
          var px = gx + dir * (sz * 0.6 + c.comp.width * 0.3) * Math.pow(t, 1.8) * (0.7 + 0.6 * r1);
          var py = gy - (sz * 0.5 + c.comp.height * 0.2) * Math.pow(t, 1.4) + Math.sin(t * 10 + g.i) * sz * 0.07;
          var S = sz * 0.56 * k1 * (1 - 0.3 * t), rot = (-dir * 0.22 * t) / DEG;
          return { 'position.x': px, 'position.y': -py, rotation: -rot, 'scale.x': dir * S, 'scale.y': S };
        });
        addLocalShape(c, craneNull, rng, 'FarWing_' + g.i, farWingCmd, { fill: c2, alpha: 0 }, function (p) {
          var q = qfAt(p, g, gs); if (q <= 0.06 || q >= 1) return { alpha: 0 };
          var k1 = H.smoothstep(0.06, 0.3, q), t = cl((q - 0.22) / 0.78), a = k1 * (1 - H.smoothstep(0.7, 1, t));
          var fl = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(q * 40 + g.i * 1.7));
          return { 'scale.y': fl, alpha: a };
        });
        addLocalShape(c, craneNull, rng, 'Body_' + g.i, bodyCmds, { fill: c1, alpha: 0 }, function (p) {
          var q = qfAt(p, g, gs); if (q <= 0.06 || q >= 1) return { alpha: 0 };
          var k1 = H.smoothstep(0.06, 0.3, q), t = cl((q - 0.22) / 0.78);
          return { alpha: k1 * (1 - H.smoothstep(0.7, 1, t)) };
        });
        addLocalShape(c, craneNull, rng, 'NearWing_' + g.i, nearWingCmd, { fill: c1, alpha: 0 }, function (p) {
          var q = qfAt(p, g, gs); if (q <= 0.06 || q >= 1) return { alpha: 0 };
          var k1 = H.smoothstep(0.06, 0.3, q), t = cl((q - 0.22) / 0.78), a = k1 * (1 - H.smoothstep(0.7, 1, t));
          var fl = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(q * 40 + g.i * 1.7));
          return { 'scale.y': fl, alpha: a };
        });
      });
    });
  }
  return function (p, g, gs) {
    var q = qfAt(p, g, gs);
    if (q <= 0) return null; if (q >= 0.3) return HIDE;
    return { s: mix(1, 0.3, oCubic(q / 0.3)), a: 1 - H.smoothstep(0.1, 0.3, q) };
  };
});

reg('wzDoron', 'src/11p_x2_waB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), sd = seedOf(c), sz = c.node.size, tH = 0.2, primary = isPrimary(c, gs0);
  var col = c.node.color || c.sc.fg || '#ffffff', smoke = H.mixHex(c.sc.bg || '#101010', col, 0.2), rng = outRange(c);
  if (!primary) return function (p) { return p >= tH ? HIDE : { a: 1 - H.smoothstep(0, tH, p) }; };
  applyExitWholeRig(c, function (p, b) {
    if (p >= tH) return { a: 0 };
    var k = 1 - 0.08 * iQuad(p / tH);
    return { ax: b.cx, ay: b.cy, sx: k, sy: k };
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var bx = lineBounds(gs), tall = bx.h > bx.w, len = Math.max(bx.w, bx.h), th = Math.min(bx.w, bx.h);
      var n = Math.round(cl(len / (sz * 0.7) + 2, 4, 14)), lw = Math.max(1.5, sz * 0.022), R0 = Math.max(sz * 0.62, th * 0.62);
      var loc = V.local(c, c.node, 'DoronSmoke');
      for (var pass = 0; pass < 2; pass++) {
        for (var k = 0; k < n; k++) {
          (function (kk, isOutline) {
            var rMult = 0.8 + 0.45 * rand(sd, kk, 81), alOff = -sz * 0.15 + (kk + 0.5) / n * (len + sz * 0.3);
            var alJ = rs(sd, kk, 82, 1), crJ = rs(sd, kk, 83, 1) * th * 0.2, upJ = 0.4 + rand(sd, kk, 84);
            addLocalShape(c, loc, rng, (isOutline ? 'SmokeOut_' : 'SmokeFill_') + kk, G.ellipse(0, 0, 1, 1),
              { fill: isOutline ? col : smoke, alpha: 0 }, function (p) {
                var grow = E.outExpo(cl(p / 0.3)), dis = cl((p - 0.3) / 0.7), a = 1 - H.smoothstep(0.4, 1, dis);
                var r = R0 * rMult * grow * (1 - iCubic(dis));
                if (r < 0.5 || a <= 0.01) return { alpha: 0 };
                var al = alOff + alJ * sz * (0.15 + 0.5 * dis), up = sz * 0.7 * dis * upJ;
                var px = tall ? bx.cx + crJ : bx.x0 + al, py = tall ? bx.y0 + al - up : bx.cy + crJ - up;
                var rad = isOutline ? r + lw : r;
                return { 'position.x': px, 'position.y': -py, 'scale.x': rad, 'scale.y': rad, alpha: a };
              });
          })(k, pass === 0);
        }
      }
    });
  }
  return function () { return null; };
});

reg('wzToro', 'src/11p_x2_waB.js', function (c) {
  var gs0 = V.glyphs(c, c.node), stInfo = soloInfo(c, gs0), sz = c.node.size, dir = rand(cutSeed(c), 91, 5) < 0.5 ? -1 : 1;
  var own = c.node.color || c.sc.fg || '#ffffff', warm = hotOf(c), hasCol = typeof c.node.color === 'string';
  var lc = quietOf(c.sc, own), lw = Math.max(1.5, sz * 0.018), rng = outRange(c);
  function qfAt(p, g, gs) {
    var m = stInfo.solo ? stInfo.cn : gs.length, ix = stInfo.solo ? stInfo.mi : g.i;
    return stg(p, dir > 0 ? 1 - cl(ix / Math.max(1, m - 1)) : cl(ix / Math.max(1, m - 1)), 0.4);
  }
  function mv(q, i, W) {
    return { dx: dir * (sz * 0.8 + W * 0.12) * Math.pow(q, 1.5),
      dy: -sz * 0.35 * q + Math.sin(q * 9 + i) * sz * 0.045 * Math.min(1, q * 4), s: 1 - 0.5 * q };
  }
  if (rng.ok && isPrimary(c, gs0)) {
    post(c, function (graph, ids, gs) {
      var loc = V.local(c, c.node, 'ToroRipples'), sx = c.node.sx == null ? 1 : c.node.sx, sy = 1;
      gs.slice(0, 20).forEach(function (g) {
        if (isBlank(g.ch)) return;
        var gx = g.x * sx, gy = g.y * sy;
        [0, 1].forEach(function (rIdx) {
          addLocalShape(c, loc, rng, 'Ripple_' + g.i + '_' + rIdx, G.rect(-0.5, -lw / 2, 1, lw), { fill: lc, alpha: 0 }, function (p) {
            var q = qfAt(p, g, gs); if (q <= 0 || q >= 1) return { alpha: 0 };
            var M = mv(q, g.i, c.comp.width), a = Math.min(1, q * 5) * (1 - H.smoothstep(0.5, 1, q)) * (rIdx === 0 ? 0.8 : 0.48);
            var w = g.w * sx * (0.5 + 0.7 * q) * (rIdx === 0 ? 1 : 0.6);
            var cx = gx + M.dx - (rIdx === 0 ? 0 : dir * sz * 0.1), y = gy + M.dy + g.h * sy * M.s * 0.6 + (rIdx === 0 ? 0 : sz * 0.08);
            return { 'position.x': cx, 'position.y': -y, 'scale.x': Math.max(1, w), alpha: a };
          });
        });
      });
    });
  }
  return function (p, g, gs, e) {
    var q = qfAt(p, g, gs);
    if (q <= 0) return null; if (q >= 1) return HIDE;
    var M = mv(q, g.i, e.W);
    return { dx: M.dx, dy: M.dy, s: M.s, a: 1 - H.smoothstep(0.45, 1, q), color: hasCol ? H.mixHex(own, warm, 0.7 * Math.sin(q * PI)) : null };
  };
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
