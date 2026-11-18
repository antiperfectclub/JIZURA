/* 73 remaining x2 enter recipes: xe* (14), xf* (30), xg* (29).
 * Completes 100% of enter presets in Cavalry native scene-graph format.
 */
(function (N, G, C, R, V, S, H) {
'use strict';

var E = R.E, cl = R.clamp, mix = R.mix, st = R.stagger, TAU = R.T, PI = Math.PI, DEG = PI / 180, rand = N.random;
var HIDE = { hide: true };
var PERM3 = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];

function oQuad(x) { x = cl(x); return 1 - (1 - x) * (1 - x); }
function oCubic(x) { return 1 - Math.pow(1 - cl(x), 3); }
function oQuart(x) { return 1 - Math.pow(1 - cl(x), 4); }
function oQuint(x) { return 1 - Math.pow(1 - cl(x), 5); }
function iQuad(x) { x = cl(x); return x * x; }
function iCubic(x) { x = cl(x); return x * x * x; }
function ioCubic(x) { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function ioSine(x) { return -(Math.cos(PI * cl(x)) - 1) / 2; }
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
function spring(t, k, f) { t = cl(t); return Math.exp(-k * t) * Math.cos(f * PI * t) * (1 - t * t * t); }
function bounce(x) {
  x = cl(x);
  var n1 = 7.5625, d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) { x -= 1.5 / d1; return n1 * x * x + 0.75; }
  if (x < 2.5 / d1) { x -= 2.25 / d1; return n1 * x * x + 0.9375; }
  x -= 2.625 / d1; return n1 * x * x + 0.984375;
}

function seedOf(c) { return c.node.seed == null ? ((c.cut.source || {}).seed || 1) : c.node.seed; }
function dirOf(c, salt) { return rand(seedOf(c), salt, 5) < 0.5 ? -1 : 1; }
function lr(g, gs) { return gs.length > 1 ? g.i / (gs.length - 1) : 0; }
function isBlank(ch) { return /^[\\s\\u3000]$/.test(ch); }
function nonSpace(gs) { return gs.filter(function (g) { return !isBlank(g.ch); }); }
function hotOf(c) { return c.node.color === c.sc.accent ? (c.sc.accent2 || c.sc.fg) : (c.sc.accent || c.sc.fg); }
function isKanji(ch) { return /[\u3400-\u9FFF\uF900-\uFAFF]/.test(ch); }
function gx(g, node) { return (g.x + (g.vx || 0)) * (node.sx == null ? 1 : node.sx); }
function gy(g, node) { return g.y + (g.vy || 0); }
function inkW(g) { return g.r90 ? g.h : g.w; }
function slotK(g, node) { return cl(inkW(g) / Math.max(1, node.size * (g.fs || 1)), 0.3, 1); }

function inRange(c) {
  var start = Math.max(c.cut.start, c.cut.origin + (c.node.delayFrames || 0));
  var end = Math.min(c.cut.end, start + Math.max(1, c.cut.inFrames) + 1);
  return { start: start, end: end, ok: end > start };
}
function pinAt(c, f) { return V.envelope(c, c.node, f).pin; }

/* Shear decomposition R(u) * diag(s, 1/s) * R(-v) */
function decompShear(k) {
  if (Math.abs(k) < 1e-6) return [0, 1, 1, 0];
  var v = 0.5 * Math.atan2(2 * k, -k * k);
  var a = Math.cos(v) + k * Math.sin(v), b = Math.sin(v), s = Math.max(0.05, Math.hypot(a, b));
  return [Math.atan2(b, a) / DEG, s, 1 / s, -v / DEG];
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
  if (o.blur != null) s.blur = (s.blur || 0) + o.blur;
  if (o.ch != null) s.ch = o.ch;
  if (o.color) s.color = o.color;
}

function reg(key, source, factory, diffs) {
  N.register('enter', key, {
    source: source + ' / enter:' + key,
    scope: 'glyph',
    differences: diffs || [],
    build: function (c) {
      var fn = factory(c);
      return function (s, g, gs, frame) {
        var env = V.envelope(c, c.node, frame);
        var e = { W: c.comp.width, H: c.comp.height, size: c.node.size, seed: seedOf(c),
          vertical: !!c.node.vertical, M: H.motionAmt(c) / 0.7, step: Math.floor(env.t * 24 + 1e-6), frame: frame };
        applyState(s, fn(env.pin, g, gs, e), g);
      };
    }
  });
}

function post(c, fn) {
  (c.node._jzPost = c.node._jzPost || []).push(fn);
}

function regPost(key, source, setupFn, diffs) {
  N.register('enter', key, {
    source: source + ' / enter:' + key,
    scope: 'node',
    differences: diffs || [],
    build: function (c) {
      setupFn(c);
      return function () {};
    }
  });
}

function lineBounds(gs) {
  var b = V.bounds(gs);
  return { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1, w: b.w, h: b.h, cx: b.cx, cy: b.cy };
}

function isPrimaryNode(c, gs) {
  var total = Array.from(String((c.cut && c.cut.source && c.cut.source.text) || c.node.text || '').replace(/\s+/g, '')).length;
  var myN = nonSpace(gs).length;
  return (c.node.alpha == null ? 1 : c.node.alpha) >= 0.85 && c.node.fill !== false && !(myN <= 1 && total > 2);
}

function localPlacementNull(graph, ids, cut, node, comp) {
  var pId = ids.length && graph.byId[ids[0]] ? graph.byId[ids[0]].parent : null;
  if (pId && graph.byId[pId] && graph.byId[pId].type === 'null') return pId;
  var nid = graph.add('null', cut.id + ' / ' + node.id + ' / Place', pId, cut.start, cut.end, {
    position: [node.x - comp.width / 2, comp.height / 2 - node.y],
    rotation: -(node.rotation || 0), scale: [node.sx == null ? 1 : node.sx, 1]
  });
  return nid;
}

function uvBox(c, b, m) {
  var vert = !!c.node.vertical;
  m = m == null ? c.node.size * 0.2 : m;
  var U0 = (vert ? b.y0 : b.x0) - m, U1 = (vert ? b.y1 : b.x1) + m;
  var V0 = (vert ? b.x0 : b.y0) - m, V1 = (vert ? b.x1 : b.y1) + m;
  return { vert: vert, U0: U0, U1: U1, V0: V0, V1: V1, L: Math.max(1, U1 - U0), T: Math.max(1, V1 - V0),
    uc: (U0 + U1) / 2, vc: (V0 + V1) / 2, big: c.node.size * 40 + (U1 - U0) + (V1 - V0) };
}

function P2(g, u, v) { return g.vert ? [v, u] : [u, v]; }
function uvRect(g, u0, v0, u1, v1) {
  if (u1 <= u0 || v1 <= v0) return null;
  var p0 = P2(g, u0, v0), p1 = P2(g, u1, v0), p2 = P2(g, u1, v1), p3 = P2(g, u0, v1);
  return [p0, p1, p2, p3];
}
function uvPoly(g, pts) { return pts.map(function (q) { return P2(g, q[0], q[1]); }); }

/* Transform node-local design polygon [x, y (down)] -> scene coordinates via node's rest matrix at frame f */
function toScenePoly(graph, placeId, f, poly) {
  var mtx = S.matrix(graph, placeId, f);
  return poly.map(function (pt) { return S.point(mtx, [pt[0], -pt[1]]); });
}

function addLocalShape(c, loc, rng, name, cmds, paint, sampleFn) {
  if (!rng.ok) return null;
  var id = C.shape(c.graph, { start: rng.start, end: rng.end }, c.cut.id + ' / ' + c.node.id + ' / ' + name, loc, cmds, paint);
  if (sampleFn) C.sample(c.graph, id, rng.start, rng.end, function (f) { return sampleFn(pinAt(c, f), f); });
  return id;
}

function insertBeforeLayer(graph, nodeId, targetId) {
  var n = graph.byId[nodeId], t = graph.byId[targetId];
  var i = graph.layers.indexOf(n), j = graph.layers.indexOf(t);
  if (i >= 0 && j >= 0 && i > j) { graph.layers.splice(i, 1); graph.layers.splice(j, 0, n); }
}

/* Attach multi-polygon clip during enter range [rng.start..rng.end) on existing glyph layers. */
function applyWindowClip(c, difference, polysFn) {
  var rng = inRange(c);
  if (!rng.ok) return;
  post(c, function (graph, ids, gs, cut, parent, options) {
    var placeId = localPlacementNull(graph, ids, cut, c.node, c.comp);
    var b = lineBounds(gs), g = uvBox(c, b);
    var byFrame = Object.create(null);
    for (var f = cut.start; f < cut.end; f++) {
      var p = pinAt(c, f);
      if (p >= 1) {
        if (difference) byFrame[f] = [];
        continue;
      }
      var locPolys = polysFn(p, b, g, f) || [];
      byFrame[f] = locPolys.filter(function (q) { return q && q.length >= 3; })
        .map(function (q) { return toScenePoly(graph, placeId, f, q); });
    }
    ids.forEach(function (tid) { H.multiClip(graph, tid, byFrame, difference, 'Enter clip', options); });
  });
}

/* Attach sliced clones of glyphs during [rng.start..rng.end); hide base glyphs until rng.end. */
function applySliceTwins(c, slicesFn) {
  var rng = inRange(c);
  if (!rng.ok) return;
  post(c, function (graph, ids, gs, cut, parent, options) {
    var placeId = localPlacementNull(graph, ids, cut, c.node, c.comp);
    var b = lineBounds(gs), g = uvBox(c, b), specs = slicesFn(b, g);
    /* Hide original glyphs while slices animate; show from rng.end - 1 onwards */
    if (rng.end - 1 > cut.start) {
      ids.forEach(function (tid) {
        var n = graph.byId[tid], orig = n.keys.alpha ? V.copy(n.keys.alpha) : null;
        var baseA = n.attrs.alpha == null ? 1 : n.attrs.alpha;
        if (!n.keys.alpha) n.keys.alpha = {};
        for (var f = cut.start; f < rng.end - 1; f++) n.keys.alpha[f] = { value: 0, type: 2 };
        var restA = orig && orig[rng.end - 1] ? orig[rng.end - 1].value : baseA;
        if (rng.end - 1 < n.end) n.keys.alpha[rng.end - 1] = { value: restA, type: 1 };
      });
    }
    specs.forEach(function (sp, idx) {
      var sliceRig = graph.add('null', cut.id + ' / ' + c.node.id + ' / Slice ' + idx, placeId, cut.start, Math.min(cut.end, rng.end), {});
      insertBeforeLayer(graph, sliceRig, ids[0]);
      var byFrame = Object.create(null);
      var twinIds = [];
      ids.forEach(function (srcId) {
        var src = graph.byId[srcId];
        var cid = graph.add(src.type, src.name + ' / S' + idx, sliceRig, cut.start, Math.min(cut.end, rng.end),
          V.copy(src.attrs), src.commands ? V.copy(src.commands) : null);
        var dst = graph.byId[cid];
        Object.keys(src.keys).forEach(function (attr) {
          var t = {};
          for (var f = cut.start; f < Math.min(cut.end, rng.end); f++) {
            if (src.keys[attr][f]) t[f] = V.copy(src.keys[attr][f]);
          }
          if (Object.keys(t).length) dst.keys[attr] = t;
        });
        insertBeforeLayer(graph, cid, ids[0]);
        twinIds.push(cid);
      });
      for (var f = cut.start; f < Math.min(cut.end, rng.end); f++) {
        var p = pinAt(c, f), st = sp.sample(p, f);
        var du = st.du || 0, dv = st.dv || 0, rot = st.rot || 0, a = st.a == null ? 1 : cl(st.a);
        var dxy = P2(g, du, dv), sx = Math.max(0.02, st.sx == null ? 1 : st.sx), sy = Math.max(0.02, st.sy == null ? 1 : st.sy);
        if (rot) {
          var rad = rot * DEG, cs = Math.cos(rad), sn = Math.sin(rad);
          var cx = b.cx, cy = -b.cy;
          graph.key(sliceRig, 'position.x', f, dxy[0] + cx - (cx * cs - cy * sn), 1);
          graph.key(sliceRig, 'position.y', f, -dxy[1] + cy - (cx * sn + cy * cs), 1);
          graph.key(sliceRig, 'rotation', f, -rot, 1);
        } else {
          graph.key(sliceRig, 'position.x', f, dxy[0], 1);
          graph.key(sliceRig, 'position.y', f, -dxy[1], 1);
        }
        if (sx !== 1) graph.key(sliceRig, 'scale.x', f, sx, 1);
        if (sy !== 1) graph.key(sliceRig, 'scale.y', f, sy, 1);
        twinIds.forEach(function (cid) {
          var cn = graph.byId[cid];
          setKey(graph, cid, 'alpha', f, getKeyVal(cn, 'alpha', f, 1) * a, 1);
        });
        var polys = sp.clip(p, b, g, f) || [];
        var mPlace = S.matrix(graph, placeId, f);
        var mSlice = S.matrix(graph, sliceRig, f);
        byFrame[f] = polys.filter(function (q) { return q && q.length >= 3; }).map(function (q) {
          var mtx = sp.fixed ? mPlace : mSlice;
          return q.map(function (pt) { return S.point(mtx, [pt[0], -pt[1]]); });
        });
      }
      twinIds.forEach(function (cid) { H.multiClip(graph, cid, byFrame, false, 'Slice clip', options); });
    });
  });
}

/* Whole-item rig helper for xg* recipes */
function applyWholeRig(c, fn) {
  post(c, function (graph, ids, gs, cut, parent) {
    var placeId = localPlacementNull(graph, ids, cut, c.node, c.comp);
    var rigOuter = graph.add('null', cut.id + ' / ' + c.node.id + ' / Rig Outer', placeId, cut.start, cut.end, {});
    var rigStretch = graph.add('null', cut.id + ' / ' + c.node.id + ' / Rig Stretch', rigOuter, cut.start, cut.end, {});
    var rigInner = graph.add('null', cut.id + ' / ' + c.node.id + ' / Rig Inner', rigStretch, cut.start, cut.end, {});
    insertBeforeLayer(graph, rigOuter, ids[0]);
    insertBeforeLayer(graph, rigStretch, ids[0]);
    insertBeforeLayer(graph, rigInner, ids[0]);
    var rng = inRange(c), endF = Math.min(cut.end, rng.end + 1);
    var b = lineBounds(gs), base = Object.create(null);
    ids.forEach(function (tid) {
      var n = graph.byId[tid];
      n.parent = rigInner;
      base[tid] = { a: n.attrs.alpha == null ? 1 : n.attrs.alpha, col: n.attrs['material.materialColor'] || c.node.color };
    });
    var hasBlur = false, blurVals = [], lastColor = null;
    for (var f = cut.start; f < endF; f++) {
      var p = pinAt(c, f), s = fn(p, b, f) || {};
      var ax = s.ax == null ? 0 : s.ax, ay = s.ay == null ? 0 : s.ay;
      var sx = s.sx == null ? 1 : s.sx, sy = s.sy == null ? 1 : s.sy;
      var rot = s.rot || 0, dx = s.dx || 0, dy = s.dy || 0, skew = s.skew || 0;
      var sc = decompShear(Math.tan(skew * DEG));
      var px = dx + ax, py = -(dy + ay);
      graph.key(rigOuter, 'position.x', f, px, 1);
      graph.key(rigOuter, 'position.y', f, py, 1);
      graph.key(rigOuter, 'rotation', f, -rot + sc[0], 1);
      graph.key(rigStretch, 'scale.x', f, sc[1], 1);
      graph.key(rigStretch, 'scale.y', f, sc[2], 1);
      graph.key(rigInner, 'rotation', f, sc[3], 1);
      graph.key(rigInner, 'scale.x', f, Math.abs(sx) < 0.01 ? (sx < 0 ? -0.01 : 0.01) : sx, 1);
      graph.key(rigInner, 'scale.y', f, Math.abs(sy) < 0.01 ? (sy < 0 ? -0.01 : 0.01) : sy, 1);
      graph.key(rigInner, 'position.x', f, -ax, 1);
      graph.key(rigInner, 'position.y', f, ay, 1);
      var am = s.a == null ? 1 : cl(s.a);
      ids.forEach(function (tid) {
        var tn = graph.byId[tid];
        setKey(graph, tid, 'alpha', f, getKeyVal(tn, 'alpha', f, base[tid].a) * am, 1);
        if (s.color && s.color !== lastColor) setKey(graph, tid, 'material.materialColor', f, s.color, 2);
      });
      if (s.color) lastColor = s.color;
      var br = s.blur || 0;
      blurVals.push(br); if (br > 0.05) hasBlur = true;
    }
    if (hasBlur) {
      ids.forEach(function (tid) {
        var filter = graph.add('$gaussianBlur', graph.byId[tid].name + ' / Focus blur', tid, cut.start, cut.end, { radius: 0 });
        for (var i = 0; i < blurVals.length; i++) graph.key(filter, 'radius', cut.start + i, blurVals[i], 1);
        graph.connect(filter, 'id', tid, '$gaussianBlur');
      });
    }
  });
}

/* =====================================================================
   PART 1: Remaining xe* (14)
   ===================================================================== */

/* 1. xeFillGaps */
reg('xeFillGaps', 'ae/p_x2_entA.jsx', function (c) {
  function t0(i, N) { return 0.36 + (N > 1 ? i / (N - 1) : 0) * 0.34; }
  function fallen(p, j, gs) {
    if (j < 0 || j >= gs.length || gs[j].ci % 2 !== 1) return -1;
    return (p - t0(j, gs.length) - 0.26) / 0.2;
  }
  return function (p, g, gs, e) {
    if (g.ci % 2 === 0) {
      var q = cl((p - lr(g, gs) * 0.18) / 0.28);
      if (q <= 0) return HIDE;
      var jolt = 0;
      [g.i - 1, g.i + 1].forEach(function (j) {
        var v = fallen(p, j, gs);
        if (v > 0 && v < 1) jolt += Math.sin(v * PI) * (1 - v);
      });
      if (q >= 1 && !jolt) return null;
      return { s: mix(0.82, 1, oCubic(q)), a: ioSine(q), dy: jolt * e.size * 0.09, rot: jolt * (g.ci % 4 ? 3 : -3) };
    }
    var u = (p - t0(g.i, gs.length)) / 0.26;
    if (u <= 0) return HIDE;
    if (u < 1) return { dy: -(1 - iQuad(u)) * e.size * 1.5, a: cl(u * 5) };
    var v = cl((u - 1) * 0.26 / 0.14);
    if (v >= 1) return null;
    var sq = 1 - 0.2 * Math.sin(v * PI);
    return { sy: Math.max(0.05, sq), sx: 1 + (1 - sq) * 0.6, dy: (1 - sq) * g.h * 0.5 };
  };
});

/* 2. xeKanjiFirst */
reg('xeKanjiFirst', 'ae/p_x2_entA.jsx', function (c) {
  var gs0 = V.glyphs(c, c.node), vis = nonSpace(gs0).length;
  var heavy = gs0.map(function (g) { return isKanji(g.ch); }), cnt = heavy.filter(Boolean).length;
  if (!cnt || cnt === vis) {
    heavy = gs0.map(function (g, i) { return !isBlank(g.ch) && (g.ci === 0 || isBlank(gs0[i - 1].ch)); });
    cnt = heavy.filter(Boolean).length;
  }
  if (vis > 3 && (cnt <= 1 || cnt === vis)) heavy = gs0.map(function (g) { return g.ci % 3 === 0; });
  return function (p, g, gs, e) {
    if (heavy[g.i]) {
      var q = cl((p - lr(g, gs) * 0.22) / 0.42);
      if (q <= 0) return HIDE;
      if (q >= 1) return null;
      var f = iQuad(cl(q / 0.55)), v = cl((q - 0.55) / 0.45);
      return { dy: -(1 - f) * e.size * 1.1 - Math.sin(v * PI) * (1 - v) * e.size * 0.1,
        s: mix(1.55, 1, f) * (1 + 0.08 * Math.sin(v * PI) * (1 - v)), a: cl(q * 6) };
    }
    var q2 = cl((p - 0.36 - lr(g, gs) * 0.26) / 0.38);
    if (q2 <= 0) return HIDE;
    if (q2 >= 1) return null;
    return { dy: (1 - oCubic(q2)) * e.size * 0.42, a: ioSine(q2), s: mix(0.9, 1, oCubic(q2)) };
  };
});

/* 3. xeTripleBeat */
reg('xeTripleBeat', 'ae/p_x2_entA.jsx', function (c) {
  var hot = hotOf(c);
  return function (p, g, gs, e) {
    var grp = gs.length < 3 ? g.i % 3 : PERM3[Math.floor(rand(e.seed, Math.floor(g.i / 3), 41) * 6) % 6][g.i % 3];
    var u = (p - 0.03 - grp * 0.31) / 0.3;
    if (u <= 0) return HIDE;
    if (u >= 1) return null;
    var k = Math.pow(1 - u, 3);
    var out = { s: 1 + 0.5 * k, dy: -k * e.size * 0.06 };
    if (u < 0.3) out.color = hot;
    return out;
  };
});

/* 4. xeSkewFlap (with per-glyph shear rig decomposition in _jzPost) */
N.register('enter', 'xeSkewFlap', {
  source: 'ae/p_x2_entA.jsx / enter:xeSkewFlap',
  scope: 'glyph',
  build: function (c) {
    var rng = inRange(c);
    if (rng.ok) {
      post(c, function (graph, ids, gs, cut) {
        var placeId = localPlacementNull(graph, ids, cut, c.node, c.comp);
        ids.forEach(function (tid, idx) {
          var g = gs[idx], src = graph.byId[tid];
          if (!src) return;
          var px = g.x + (g.vx || 0), py = -(g.y + (g.vy || 0));
          var r1 = graph.add('null', src.name + ' / Flap R1', placeId, cut.start, cut.end, { position: [px, py] });
          var r2 = graph.add('null', src.name + ' / Flap S', r1, cut.start, cut.end, {});
          insertBeforeLayer(graph, r1, tid);
          insertBeforeLayer(graph, r2, tid);
          src.parent = r2;
          var endF = Math.min(cut.end, rng.end + 1);
          for (var f = cut.start; f < endF; f++) {
            var p = pinAt(c, f), q = st(p, lr(g, gs), 0.42);
            var s = spring(q, 2.6, 3.4) * (g.i % 2 ? 1 : -1);
            var d = decompShear(Math.tan(s * 46 * DEG));
            var curX = getKeyVal(src, 'position.x', f, px), curY = getKeyVal(src, 'position.y', f, py);
            var curRot = getKeyVal(src, 'rotation', f, -(g.r90 ? 90 : 0));
            graph.key(r1, 'position.x', f, curX, 1);
            graph.key(r1, 'position.y', f, curY, 1);
            graph.key(r1, 'rotation', f, d[0], 1);
            graph.key(r2, 'scale.x', f, d[1], 1);
            graph.key(r2, 'scale.y', f, d[2], 1);
            setKey(graph, tid, 'position.x', f, 0, 1);
            setKey(graph, tid, 'position.y', f, 0, 1);
            setKey(graph, tid, 'rotation', f, curRot + d[3], 1);
          }
          for (var f2 = endF; f2 < cut.end; f2++) {
            var curX2 = getKeyVal(src, 'position.x', f2, px), curY2 = getKeyVal(src, 'position.y', f2, py);
            graph.key(r1, 'position.x', f2, curX2, 1);
            graph.key(r1, 'position.y', f2, curY2, 1);
            setKey(graph, tid, 'position.x', f2, 0, 1);
            setKey(graph, tid, 'position.y', f2, 0, 1);
          }
        });
      });
    }
    return function (s, g, gs, frame) {
      var p = pinAt(c, frame), q = st(p, lr(g, gs), 0.42);
      if (q <= 0) { s.a = 0; return; }
      if (q >= 1) return;
      var sp = spring(q, 2.6, 3.4) * (g.i % 2 ? 1 : -1);
      s.sx *= Math.max(0.05, 1 - 0.45 * Math.abs(sp));
      s.a *= cl(q * 5);
    };
  }
});

/* 5. xeGlyphCurtain */
reg('xeGlyphCurtain', 'ae/p_x2_entA.jsx', function () {
  return function (p, g, gs, e) {
    var q = st(p, gs.length > 1 ? (lr(g, gs) * 0.6 + rand(e.seed, g.i, 29) * 0.4) : 0, 0.5);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    var k = 0.02 + 0.8 * ioCubic(q), str = mix(1.3, 1, oCubic(q));
    return e.vertical ? { clipY: [-k, k], clipX: [-2, 2], sy: str } : { clipX: [-k, k], clipY: [-2, 2], sx: str };
  };
});

/* 6. xeCellSlide */
reg('xeCellSlide', 'ae/p_x2_entA.jsx', function () {
  return function (p, g, gs, e) {
    var q = st(p, lr(g, gs), 0.5);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    var off = (g.i % 2 ? 1 : -1) * (1 - oQuart(q)) * 1.15;
    return e.vertical ? { dx: off * g.w, clipX: [-0.62 - off, 0.62 - off], clipY: [-2, 2] }
                      : { dy: off * g.h, clipY: [-0.62 - off, 0.62 - off], clipX: [-2, 2] };
  };
});

/* 7. xeBellows (with per-glyph alternating shear in _jzPost) */
N.register('enter', 'xeBellows', {
  source: 'ae/p_x2_entA.jsx / enter:xeBellows',
  scope: 'glyph',
  build: function (c) {
    var gs0 = V.glyphs(c, c.node), vert = !!c.node.vertical, rng = inRange(c);
    var lineHead = Object.create(null);
    gs0.forEach(function (g) { if (!lineHead[g.li]) lineHead[g.li] = { x: gx(g, c.node), y: gy(g, c.node) }; });
    if (rng.ok && !vert) {
      post(c, function (graph, ids, gs, cut) {
        var placeId = localPlacementNull(graph, ids, cut, c.node, c.comp);
        ids.forEach(function (tid, idx) {
          var g = gs[idx], src = graph.byId[tid];
          if (!src) return;
          var px0 = g.x + (g.vx || 0), py0 = -(g.y + (g.vy || 0));
          var r1 = graph.add('null', src.name + ' / Bellows R1', placeId, cut.start, cut.end, { position: [px0, py0] });
          var r2 = graph.add('null', src.name + ' / Bellows S', r1, cut.start, cut.end, {});
          insertBeforeLayer(graph, r1, tid); insertBeforeLayer(graph, r2, tid);
          src.parent = r2;
          var lh = lineHead[g.li] || { x: g.x, y: g.y }, endF = Math.min(cut.end, rng.end + 1);
          for (var f = cut.start; f < endF; f++) {
            var p = pinAt(c, f), q = st(p, g.n > 1 ? g.ci / (g.n - 1) : 0, 0.28);
            var e = E.outBack(cl(q), 1.3), k = 1 - e;
            var d = decompShear(Math.tan((g.ci % 2 ? 1 : -1) * 38 * k * DEG));
            var curX = getKeyVal(src, 'position.x', f, px0), curY = getKeyVal(src, 'position.y', f, py0);
            var curRot = getKeyVal(src, 'rotation', f, -(g.r90 ? 90 : 0));
            graph.key(r1, 'position.x', f, curX + (lh.x - gx(g, c.node)) * k * 0.9, 1);
            graph.key(r1, 'position.y', f, curY - (lh.y - gy(g, c.node)) * k * 0.9, 1);
            graph.key(r1, 'rotation', f, d[0], 1);
            graph.key(r2, 'scale.x', f, d[1], 1);
            graph.key(r2, 'scale.y', f, d[2], 1);
            setKey(graph, tid, 'position.x', f, 0, 1);
            setKey(graph, tid, 'position.y', f, 0, 1);
            setKey(graph, tid, 'rotation', f, curRot + d[3], 1);
          }
          for (var f2 = endF; f2 < cut.end; f2++) {
            graph.key(r1, 'position.x', f2, getKeyVal(src, 'position.x', f2, px0), 1);
            graph.key(r1, 'position.y', f2, getKeyVal(src, 'position.y', f2, py0), 1);
            setKey(graph, tid, 'position.x', f2, 0, 1);
            setKey(graph, tid, 'position.y', f2, 0, 1);
          }
        });
      });
    }
    return function (s, g, gs, frame) {
      var p = pinAt(c, frame), a = cl(p * 6), q = st(p, g.n > 1 ? g.ci / (g.n - 1) : 0, 0.28);
      if (q >= 1) { s.a *= a; return; }
      var e = E.outBack(cl(q), 1.3), k = 1 - e, thin = Math.max(0.12, mix(0.12, 1, e));
      var lh = lineHead[g.li] || { x: g.x, y: g.y };
      s.a *= a;
      if (vert) {
        s.dx += (lh.x - gx(g, c.node)) * k * 0.9; s.dy += (lh.y - gy(g, c.node)) * k * 0.9;
        s.sy *= thin; s.rot += (g.ci % 2 ? 1 : -1) * 22 * k;
      } else {
        s.sx *= thin;
      }
    };
  }
});

/* 8. xeRedact */
reg('xeRedact', 'ae/p_x2_entA.jsx', function (c) {
  var node = c.node;
  return function (p, g, gs, e) {
    var qa = cl((p - lr(g, gs) * 0.16) / 0.1);
    if (qa <= 0) return HIDE;
    var u = (p - 0.3 - (gs.length > 1 ? rand(e.seed, g.i, 37) : 0) * 0.5) / 0.2;
    if (u >= 1) return null;
    var k = slotK(g, node);
    if (u < 0.5) {
      var cs = u <= 0 ? 1 : Math.max(0.05, Math.cos(u * PI));
      var qb = Math.max(0.05, E.outBack(cl(qa), 2));
      return e.vertical && !g.r90 ? { ch: '\u25A0', sx: k, sy: cs * qb } : { ch: '\u25A0', sx: k * cs * qb, sy: qb };
    }
    var sn = Math.max(0.05, Math.sin((u - 0.5) * PI));
    return e.vertical && !g.r90 ? { sy: sn } : { sx: sn };
  };
});

/* 9. xeBlanks */
reg('xeBlanks', 'ae/p_x2_entA.jsx', function (c) {
  var sub = H.subCol(c.sc), node = c.node;
  return function (p, g, gs, e) {
    var qa = cl(p / 0.16);
    if (qa <= 0) return HIDE;
    var u = (p - 0.24 - lr(g, gs) * 0.5) / 0.26;
    if (u >= 1) return null;
    if (u <= 0) return { ch: '\u25A1', sx: slotK(g, node) * mix(0.8, 0.94, oCubic(qa)), sy: mix(0.8, 0.94, oCubic(qa)), a: 0.75 * qa, color: sub };
    return { s: Math.max(0.05, mix(0.45, 1, E.outBack(cl(u), 2.4))), a: cl(0.4 + u * 3), dy: -(1 - oCubic(u)) * e.size * 0.12 };
  };
});

/* 10. xeCloneMorph */
reg('xeCloneMorph', 'ae/p_x2_entA.jsx', function (c) {
  var gs0 = V.glyphs(c, c.node), first = gs0.find(function (g) { return !isBlank(g.ch); });
  if (!first) return function () { return null; };
  var fx = gx(first, c.node), fy = gy(first, c.node), fw = Math.max(1, inkW(first));
  return function (p, g, gs) {
    if (isBlank(g.ch)) return null;
    var lead = g.i === first.i;
    var qa = lead ? cl(p / 0.12) : st(cl(p / 0.34), lr(g, gs), 0.55);
    if (qa <= 0) return HIDE;
    if (lead) return qa < 1 ? { s: Math.max(0.05, E.outBack(cl(qa), 2.2)), a: cl(qa * 3) } : null;
    var u = (p - 0.4 - lr(g, gs) * 0.4) / 0.2;
    if (u >= 1) return null;
    var sq = Math.max(0.15, u > 0 ? 1 - 0.55 * Math.sin(u * PI) : 1);
    if (u < 0.5) {
      var k = 1 - oCubic(qa);
      return { ch: first.ch, dx: (fx - gx(g, c.node)) * k, dy: (fy - gy(g, c.node)) * k, sx: cl(inkW(g) / fw, 0.35, 1), sy: sq, a: 0.5 };
    }
    return { sy: sq, a: mix(0.5, 1, cl((u - 0.5) * 4)) };
  };
});

/* 11. xePieceRain */
reg('xePieceRain', 'ae/p_x2_entA.jsx', function () {
  return function (p, g, gs, e) {
    var q = st(p, lr(g, gs), 0.5);
    if (q <= 0) return HIDE; if (q >= 1) return null;
    return { dy: -(1 - iQuad(q)) * e.size * 1.3, a: cl(q * 4), sy: 1 + (1 - q) * 0.4 };
  };
});

/* 12. xePieceVortex */
reg('xePieceVortex', 'ae/p_x2_entA.jsx', function () {
  return function (p, g, gs) {
    var q = st(p, lr(g, gs), 0.45);
    if (q <= 0) return HIDE; if (q >= 1) return null;
    return { rot: (g.i % 2 ? 1 : -1) * (1 - oCubic(q)) * 160, s: mix(1.6, 1, oCubic(q)), a: cl(q * 3) };
  };
});

/* 13. xePiecePile */
reg('xePiecePile', 'ae/p_x2_entA.jsx', function () {
  return function (p, g, gs) {
    var q = st(p, lr(g, gs), 0.4);
    if (q <= 0) return HIDE; if (q >= 1) return null;
    var sy = Math.max(0.06, E.outBack(cl(q), 1.8));
    return { sy: sy, dy: (1 - sy) * g.h * 0.5, a: cl(q * 5) };
  };
});

/* 14. xePieceStrata (5 horizontal row slices sliding alternately) */
regPost('xePieceStrata', 'ae/p_x2_entA.jsx', function (c) {
  var sz = c.node.size;
  applySliceTwins(c, function (b, g) {
    var rows = [];
    for (var row = 0; row < 5; row++) {
      (function (r) {
        rows.push({
          fixed: false,
          sample: function (p) {
            var q = st(p, 0, 0);
            var u = cl((cl((q - 0.175) / 0.65) - (r / 4) * 0.42) / 0.58);
            var k = 1 - oQuart(u);
            return { du: (r % 2 ? 1 : -1) * k * sz * 1.25, dv: 0, sx: 1 + k * 1.1, a: cl(u * 4) };
          },
          clip: function (p, bx, gx0) {
            var y0 = b.y0 + (r / 5) * b.h - (r === 0 ? sz * 0.3 : 0);
            var y1 = b.y0 + ((r + 1) / 5) * b.h + (r === 4 ? sz * 0.3 : 0.6);
            return [V.polygon(b.x0 - sz * 2, y0, b.x1 + sz * 2, y1)];
          }
        });
      })(row);
    }
    return rows;
  });
});

/* =====================================================================
   PART 2: All xf* (30)
   ===================================================================== */

/* 15. xfCornerBloom */
regPost('xfCornerBloom', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, corner = Math.floor(rand(seedOf(c), 301, 1) * 4) & 3;
  var m = sz * 0.25, rng = inRange(c), hot = hotOf(c), lw = Math.max(2, sz * 0.03);
  function circlePts(cx, cy, r) {
    var pts = [];
    for (var i = 0; i < 24; i++) { var a = (i / 24) * TAU; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return pts;
  }
  applyWindowClip(c, false, function (p, b) {
    var e = ioCubic(p); if (e <= 0.005) return [];
    var cx = (corner & 1) ? b.x1 + m : b.x0 - m, cy = (corner & 2) ? b.y0 - m : b.y1 + m;
    var r = (Math.hypot(b.w + m * 2, b.h + m * 2) + 2) * e;
    return [circlePts(cx, cy, r)];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs, cut) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'CornerBloom'), b = lineBounds(gs);
      var cx = (corner & 1) ? b.x1 + m : b.x0 - m, cy = (corner & 2) ? b.y0 - m : b.y1 + m;
      var rm = Math.hypot(b.w + m * 2, b.h + m * 2) + 2;
      var a0 = (corner & 1) ? ((corner & 2) ? 90 : 180) : ((corner & 2) ? 0 : 270);
      var pts = H.arcPts(0, 0, 1, a0, a0 + 90, 16).map(function (pt, idx) { return [idx ? 'L' : 'M', pt[0], -pt[1]]; });
      [1, 0.82].forEach(function (k, j) {
        addLocalShape(c, loc, rng, 'Arc ' + j, pts, { stroke: hot, width: lw * (j ? 0.5 : 1), alpha: 1 }, function (p) {
          var r = rm * ioCubic(p) * k, a = (1 - H.smoothstep(0.5, 0.92, p)) * (j ? 0.5 : 1);
          return { 'position.x': cx, 'position.y': -cy, 'scale.x': Math.max(0.05, r), 'scale.y': Math.max(0.05, r), alpha: r < 1 ? 0 : a };
        });
      });
    });
  }
});

/* 16. xfChevron */
regPost('xfChevron', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, dir = dirOf(c, 302), k = 0.6, rng = inRange(c), hot = hotOf(c), lw = Math.max(2, sz * 0.03);
  function chevAt(p, g) {
    var hv = g.T / 2, tip = (g.L + k * hv + 1) * ioCubic(p);
    function u(s) { return dir > 0 ? g.U0 + s : g.U1 - s; }
    return { hv: hv, tip: tip, u: u };
  }
  applyWindowClip(c, false, function (p, b, g) {
    if (p <= 0.005) return [];
    var G = chevAt(p, g);
    return [uvPoly(g, [[G.u(-g.big), g.V0], [G.u(G.tip - k * G.hv), g.V0], [G.u(G.tip), g.vc], [G.u(G.tip - k * G.hv), g.V1], [G.u(-g.big), g.V1]])];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'Chevron'), b = lineBounds(gs), g = uvBox(c, b), hv = g.T / 2;
      var basePts = [[P2(g, -k * hv * dir, -hv)], [P2(g, 0, 0)], [P2(g, -k * hv * dir, hv)]];
      var cmds = basePts.map(function (q, i) { return [i ? 'L' : 'M', q[0][0], -q[0][1]]; });
      [0, 1].forEach(function (j) {
        addLocalShape(c, loc, rng, 'Lead ' + j, cmds, { stroke: hot, width: lw * (j ? 0.6 : 1.2), alpha: 1 }, function (p) {
          var G = chevAt(p, g), o = G.tip + sz * (0.16 + 0.3 * j), scPos = P2(g, G.u(o), g.vc);
          return { 'position.x': scPos[0], 'position.y': -scPos[1], alpha: cl(p * 8) * (1 - H.smoothstep(0.72, 0.96, p)) * (j ? 0.5 : 1) };
        });
      });
    });
  }
});

/* 17. xfJaws */
regPost('xfJaws', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, rng = inRange(c), hot = hotOf(c), lw = Math.max(2, sz * 0.03);
  function jawData(p, g) {
    var e = ioCubic(p / 0.94), nT = Math.max(2, Math.min(40, Math.round(g.L / (sz * 0.62)))), tw = g.L / nT, am = Math.min(g.T * 0.2, sz * 0.26);
    var D = (g.T / 2 + am * 0.5) * (1 - e), z = [];
    for (var j = 0; j <= nT * 2; j++) z.push([g.U0 + j * tw / 2, g.vc + (j % 2 ? am : -am)]);
    z[0][0] -= g.big; z[z.length - 1][0] += g.big;
    return { D: D, z: z };
  }
  applyWindowClip(c, false, function (p, b, g) {
    if (p <= 0.005) return [];
    var J = jawData(p, g);
    var pTop = uvPoly(g, [[g.U0 - g.big, g.V0 - g.big], [g.U1 + g.big, g.V0 - g.big]].concat(J.z.slice().reverse().map(function (q) { return [q[0], q[1] - J.D + 0.4]; })));
    var pBot = uvPoly(g, J.z.map(function (q) { return [q[0], q[1] + J.D - 0.4]; }).concat([[g.U1 + g.big, g.V1 + g.big], [g.U0 - g.big, g.V1 + g.big]]));
    return [pTop, pBot];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'Jaws'), b = lineBounds(gs), g = uvBox(c, b, sz * 0.06);
      var base = jawData(1, g), z = base.z.slice(); z[0] = [g.U0, z[0][1]]; z[z.length - 1] = [g.U1, z[z.length - 1][1]];
      var cmds = z.map(function (q, i) { var pt = P2(g, q[0], q[1]); return [i ? 'L' : 'M', pt[0], -pt[1]]; });
      [-1, 1].forEach(function (sgn) {
        addLocalShape(c, loc, rng, sgn < 0 ? 'Upper' : 'Lower', cmds, { stroke: hot, width: lw, alpha: 1 }, function (p) {
          var J = jawData(p, g), a = cl(p * 6) * (1 - H.smoothstep(0.8, 1, p)), off = P2(g, 0, sgn * J.D);
          return { 'position.x': off[0], 'position.y': -off[1], alpha: a };
        });
      });
    });
  }
});

/* 18. xfSlantLouver */
regPost('xfSlantLouver', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, dir = dirOf(c, 304), k = 0.75 * dirOf(c, 305);
  applyWindowClip(c, false, function (p, b, g) {
    var ak = Math.abs(k) * g.T / 2, lo = g.U0 - ak, hi = g.U1 + ak;
    var pitch = Math.max(sz * 0.46, (hi - lo) / 70), drift = (1 - oCubic(p)) * pitch * 2.5 * dir;
    var j0 = Math.floor((lo - drift) / pitch) - 1, j1 = Math.ceil((hi - drift) / pitch) + 1, out = [];
    for (var j = j0; j <= j1; j++) {
      var cc = j * pitch + drift, f = cl((cc - lo) / Math.max(1, hi - lo));
      var d = ioCubic(st(p, dir > 0 ? 1 - f : f, 0.45));
      if (d <= 0.005) continue;
      var hw = pitch * 0.5 * d + 0.5;
      out.push(uvPoly(g, [[cc - hw - k * g.T / 2, g.V0], [cc + hw - k * g.T / 2, g.V0], [cc + hw + k * g.T / 2, g.V1], [cc - hw + k * g.T / 2, g.V1]]));
    }
    return out;
  });
});

/* 19. xfHolesMerge */
regPost('xfHolesMerge', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, sd = seedOf(c), rng = inRange(c), hot = hotOf(c), lw = Math.max(2, sz * 0.03);
  function holesAt(p, g) {
    var n = cl(Math.round(g.L / (sz * 1.2)), 2, 7), cw = g.L / n, out = [];
    for (var k = 0; k < n; k++) {
      var ju = (rand(sd, k, 311) * 2 - 1) * cw * 0.28, jv = (rand(sd, k, 312) * 2 - 1) * g.T * 0.28;
      var q = st(p, rand(sd, k, 313), 0.4), pt = P2(g, g.U0 + (k + 0.5) * cw + ju, g.vc + jv);
      out.push({ x: pt[0], y: pt[1], q: q, r: (Math.hypot(cw / 2 + Math.abs(ju), g.T / 2 + Math.abs(jv)) * 1.03 + 1) * ioCubic(q),
        rm: Math.hypot(cw / 2 + Math.abs(ju), g.T / 2 + Math.abs(jv)) * 1.03 + 1 });
    }
    return out;
  }
  applyWindowClip(c, false, function (p, b, g) {
    var out = [];
    holesAt(p, g).forEach(function (h) {
      if (h.r <= 0.05) return;
      var pts = [];
      for (var i = 0; i < 16; i++) { var a = (i / 16) * TAU; pts.push([h.x + Math.cos(a) * h.r, h.y + Math.sin(a) * h.r]); }
      out.push(pts);
    });
    return out;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'Holes'), b = lineBounds(gs), g = uvBox(c, b), hs = holesAt(1, g);
      hs.forEach(function (h, k) {
        addLocalShape(c, loc, rng, 'Ring ' + k, G.ellipse(0, 0, 1, 1), { stroke: hot, width: lw * 0.8, alpha: 1 }, function (p) {
          var q = st(p, rand(sd, k, 313), 0.4), r = h.rm * ioCubic(q);
          return { 'position.x': h.x, 'position.y': -h.y, 'scale.x': Math.max(0.05, r), 'scale.y': Math.max(0.05, r), alpha: q <= 0 ? 0 : (1 - H.smoothstep(0.25, 0.8, q)) };
        });
      });
    });
  }
});

/* 20. xfSunburst */
regPost('xfSunburst', 'ae/p_x2_entB.jsx', function (c) {
  var n = 8, dir = dirOf(c, 321), a0 = rand(seedOf(c), 322, 1) * TAU, rng = inRange(c), hot = hotOf(c), lw = Math.max(2, c.node.size * 0.03);
  applyWindowClip(c, false, function (p, b, g) {
    var ha = (PI / n) * ioCubic(p) * 1.03; if (ha <= 0.004) return [];
    var baseA = a0 + (1 - oCubic(p)) * 0.8 * dir, Rm = Math.hypot(g.L, g.T) / 2 + 2;
    var r = Rm / Math.cos(Math.min(ha, PI / n - 0.001)), out = [];
    for (var k = 0; k < n; k++) {
      var a = baseA + k * TAU / n;
      out.push(uvPoly(g, [[g.uc, g.vc], [g.uc + Math.cos(a - ha) * r, g.vc + Math.sin(a - ha) * r], [g.uc + Math.cos(a + ha) * r, g.vc + Math.sin(a + ha) * r]]));
    }
    return out;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'Sunburst'), b = lineBounds(gs), g = uvBox(c, b), Rm = Math.hypot(g.L, g.T) / 2 + 2;
      var cmds = [];
      for (var k = 0; k < n; k++) {
        var an = a0 + k * TAU / n, p1 = P2(g, Math.cos(an) * Rm, Math.sin(an) * Rm);
        cmds.push(['M', 0, 0], ['L', p1[0], -p1[1]]);
      }
      var cc = P2(g, g.uc, g.vc);
      addLocalShape(c, loc, rng, 'Rays', cmds, { stroke: hot, width: lw * 0.6, alpha: 1 }, function (p) {
        var s = Math.max(0.02, oCubic(p * 2.2)), rot = (1 - oCubic(p)) * 0.8 * dir / DEG * (g.vert ? -1 : 1);
        return { 'position.x': cc[0], 'position.y': -cc[1], rotation: -rot, 'scale.x': s, 'scale.y': s, alpha: cl(p * 10) * (1 - H.smoothstep(0.15, 0.6, p)) };
      });
    });
  }
});

/* 21. xfTriptych */
regPost('xfTriptych', 'ae/p_x2_entB.jsx', function (c) {
  var ORD = [1, 0, 2], rng = inRange(c), hot = hotOf(c), lw = Math.max(2, c.node.size * 0.03);
  function paneRect(k, p, g) {
    var w = g.L / 3, q = st(p, ORD[k] / 2, 0.45), e = oQuart(q), cc = g.U0 + (k + 0.5) * w;
    return { q: q, u0: cc - (w / 2 + 0.5) * e, u1: cc + (w / 2 + 0.5) * e, v0: g.vc - g.T / 2 * e, v1: g.vc + g.T / 2 * e };
  }
  applyWindowClip(c, false, function (p, b, g) {
    var out = [];
    for (var k = 0; k < 3; k++) {
      var w = paneRect(k, p, g), r = uvRect(g, w.u0, w.v0, w.u1, w.v1);
      if (r) out.push(r);
    }
    return out;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'Triptych'), b = lineBounds(gs), g = uvBox(c, b), w = g.L / 3;
      for (var k = 0; k < 3; k++) {
        (function (kk) {
          var cc = P2(g, g.U0 + (kk + 0.5) * w, g.vc), sz2 = P2(g, w, g.T);
          addLocalShape(c, loc, rng, 'Pane ' + kk, G.rect(-sz2[0] / 2, -sz2[1] / 2, sz2[0], sz2[1]), { stroke: hot, width: lw * 0.8, alpha: 1 }, function (p) {
            var q = st(p, ORD[kk] / 2, 0.45), e = Math.max(0.02, oQuart(q));
            return { 'position.x': cc[0], 'position.y': -cc[1], 'scale.x': e, 'scale.y': e, alpha: q <= 0 ? 0 : (1 - H.smoothstep(0.55, 1, q)) };
          });
        })(k);
      }
    });
  }
});

/* 22. xfRovingWindow */
regPost('xfRovingWindow', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, dir = dirOf(c, 331), rng = inRange(c), hot = hotOf(c), lw = Math.max(2, sz * 0.03);
  function winAt(p, g) {
    var w0 = Math.min(cl(g.L * 0.28, sz * 0.9, sz * 2.6), g.L * 0.6);
    var t1 = ioCubic(p / 0.5), t2 = ioCubic((p - 0.5) / 0.5);
    var a = p < 0.5 ? mix(-w0, g.L - w0, t1) : mix(g.L - w0, 0, t2), z = p < 0.5 ? a + w0 : g.L;
    a = Math.max(0, a); z = Math.min(g.L, z);
    return { u0: dir > 0 ? g.U0 + a : g.U1 - z, u1: dir > 0 ? g.U0 + z : g.U1 - a };
  }
  applyWindowClip(c, false, function (p, b, g) {
    var W0 = winAt(p, g), r = uvRect(g, W0.u0, g.V0, W0.u1, g.V1);
    return r ? [r] : [];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'RovingWin'), b = lineBounds(gs), g = uvBox(c, b);
      var boxSz = P2(g, 1, g.T);
      addLocalShape(c, loc, rng, 'Frame', G.rect(g.vert ? -boxSz[0] / 2 : -0.5, g.vert ? -0.5 : -boxSz[1] / 2, g.vert ? boxSz[0] : 1, g.vert ? 1 : boxSz[1]),
        { stroke: hot, width: lw, alpha: 1 }, function (p) {
          var W0 = winAt(p, g), len = W0.u1 - W0.u0;
          if (len < 1) return { alpha: 0 };
          var pos = P2(g, (W0.u0 + W0.u1) / 2, g.vc);
          return g.vert ? { 'position.x': pos[0], 'position.y': -pos[1], 'scale.y': len, alpha: 1 - H.smoothstep(0.78, 1, p) }
                        : { 'position.x': pos[0], 'position.y': -pos[1], 'scale.x': len, alpha: 1 - H.smoothstep(0.78, 1, p) };
        });
    });
  }
});

/* 23. xfStaircase */
regPost('xfStaircase', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, rev = dirOf(c, 341) < 0, up = dirOf(c, 342) < 0, sp = 0.75, rng = inRange(c), hot = hotOf(c), lw = Math.max(2, sz * 0.03);
  function colsAt(p, g) {
    var N = cl(Math.round(g.L / (sz * 0.62)), 4, 14), w = g.L / N, out = [];
    for (var k = 0; k < N; k++) out.push({ u0: g.U0 + k * w, u1: g.U0 + (k + 1) * w, f: ioCubic(cl(p * (1 + sp) - sp * (rev ? N - 1 - k : k) / (N - 1))) });
    return out;
  }
  applyWindowClip(c, false, function (p, b, g) {
    var out = [];
    colsAt(p, g).forEach(function (col) {
      if (col.f <= 0.005) return;
      var r = up ? uvRect(g, col.u0, g.V1 - g.T * col.f, col.u1 + 0.6, g.V1 + g.big)
                 : uvRect(g, col.u0, g.V0 - g.big, col.u1 + 0.6, g.V0 + g.T * col.f);
      if (r) out.push(r);
    });
    return out;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'Staircase'), b = lineBounds(gs), g = uvBox(c, b), N = cl(Math.round(g.L / (sz * 0.62)), 4, 14), w = g.L / N;
      for (var k = 0; k < N; k++) {
        (function (kk) {
          var dim = P2(g, w, lw), cmds = G.rect(-dim[0] / 2, -dim[1] / 2, dim[0], dim[1]);
          addLocalShape(c, loc, rng, 'Bar ' + kk, cmds, { fill: hot, alpha: 1 }, function (p) {
            var f = ioCubic(cl(p * (1 + sp) - sp * (rev ? N - 1 - kk : kk) / (N - 1)));
            if (f <= 0 || f >= 1) return { alpha: 0 };
            var v = up ? g.V1 - g.T * f : g.V0 + g.T * f, pos = P2(g, g.U0 + (kk + 0.5) * w, v);
            return { 'position.x': pos[0], 'position.y': -pos[1], alpha: Math.min(1, f * 6, (1 - f) * 6) };
          });
        })(k);
      }
    });
  }
});

/* 24. xfQuadRelay */
regPost('xfQuadRelay', 'ae/p_x2_entB.jsx', function (c) {
  var flip = dirOf(c, 351) < 0, rng = inRange(c), hot = hotOf(c), lw = Math.max(2, c.node.size * 0.03) * 1.3;
  function quadsAt(p, g0) {
    var g = flip ? { U0: g0.U0, U1: g0.U1, uc: g0.uc, V0: g0.V1, V1: g0.V0, vc: g0.vc } : g0;
    function ek(k) { return ioCubic(cl((p - k * 0.22) / 0.34)); }
    var U = [g.U0, g.uc, g.U1], V0 = [g.V0, g.vc, g.V1];
    return [
      { e: ek(0), r: [U[0], mix(U[0], U[1], ek(0)), V0[0], V0[1]], bar: 'u' },
      { e: ek(1), r: [U[1], U[2], V0[0], mix(V0[0], V0[1], ek(1))], bar: 'v' },
      { e: ek(2), r: [U[2], mix(U[2], U[1], ek(2)), V0[2], V0[1]], bar: 'u' },
      { e: ek(3), r: [U[1], U[0], V0[2], mix(V0[2], V0[1], ek(3))], bar: 'v' }
    ];
  }
  function norm(r) { return [Math.min(r[0], r[1]), Math.max(r[0], r[1]), Math.min(r[2], r[3]), Math.max(r[2], r[3])]; }
  applyWindowClip(c, false, function (p, b, g) {
    var out = [];
    quadsAt(p, g).forEach(function (q) {
      if (q.e <= 0.005) return;
      var rn = norm(q.r), rp = uvRect(g, rn[0] - 0.4, rn[2] - 0.4, rn[1] + 0.4, rn[3] + 0.4);
      if (rp) out.push(rp);
    });
    return out;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'QuadRelay'), b = lineBounds(gs), g = uvBox(c, b);
      quadsAt(1, g).forEach(function (q, k) {
        var isU = q.bar === 'u', dim = P2(g, isU ? lw : g.L / 2, isU ? g.T / 2 : lw);
        addLocalShape(c, loc, rng, 'Bar ' + k, G.rect(-dim[0] / 2, -dim[1] / 2, dim[0], dim[1]), { fill: hot, alpha: 1 }, function (p) {
          var qk = quadsAt(p, g)[k];
          if (qk.e <= 0 || qk.e >= 1) return { alpha: 0 };
          var rn = norm(qk.r), pos = isU ? P2(g, qk.r[1], (rn[2] + rn[3]) / 2) : P2(g, (rn[0] + rn[1]) / 2, qk.r[3]);
          return { 'position.x': pos[0], 'position.y': -pos[1], alpha: 1 };
        });
      });
    });
  }
});

/* 25. xfWiper */
regPost('xfWiper', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, dir = dirOf(c, 361), rng = inRange(c), hot = hotOf(c), lw = Math.max(2, sz * 0.03);
  function wiperGeo(p, g) {
    var e = ioCubic(p / 0.94), d = g.T * 0.55 + sz * 0.5, pv = g.V1 + d;
    var aL = Math.atan2(-d, -g.L / 2) - 0.03, aR = Math.atan2(-d, g.L / 2) + 0.03;
    var A0 = dir > 0 ? aL : aR, A1 = dir > 0 ? aR : aL;
    return { e: e, pv: pv, A0: A0, a: mix(A0, A1, e), R: Math.hypot(g.L / 2, g.T + d) * 1.04 };
  }
  applyWindowClip(c, false, function (p, b, g) {
    var G0 = wiperGeo(p, g); if (G0.e <= 0.005) return [];
    var n = Math.max(3, Math.ceil(Math.abs(G0.a - G0.A0) / 0.06)), pts = [[g.uc, G0.pv]];
    for (var k = 0; k <= n; k++) {
      var a = mix(G0.A0, G0.a, k / n);
      pts.push([g.uc + Math.cos(a) * G0.R * 1.02, G0.pv + Math.sin(a) * G0.R * 1.02]);
    }
    return [uvPoly(g, pts)];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'Wiper'), b = lineBounds(gs), g = uvBox(c, b), G0 = wiperGeo(1, g);
      var pvPt = P2(g, g.uc, G0.pv), tip = P2(g, G0.R, 0);
      addLocalShape(c, loc, rng, 'Arm', [['M', 0, 0], ['L', tip[0], -tip[1]]], { stroke: hot, width: lw * 1.6, alpha: 1 }, function (p) {
        var W0 = wiperGeo(p, g), aDeg = W0.a / DEG * (g.vert ? -1 : 1);
        return { 'position.x': pvPt[0], 'position.y': -pvPt[1], rotation: -aDeg, alpha: cl(p * 10) * (1 - H.smoothstep(0.82, 0.98, p)) };
      });
      addLocalShape(c, loc, rng, 'Pivot', G.ellipse(pvPt[0], -pvPt[1], lw * 2.2, lw * 2.2), { fill: hot, alpha: 1 }, function (p) {
        return { alpha: cl(p * 10) * (1 - H.smoothstep(0.82, 0.98, p)) };
      });
    });
  }
});

/* 26. xfSpiral */
regPost('xfSpiral', 'ae/p_x2_entB.jsx', function (c) {
  var dir = dirOf(c, 371), th0 = rand(seedOf(c), 372, 1) * TAU, turns = 3, rng = inRange(c), hot = hotOf(c), lw = Math.max(2, c.node.size * 0.03);
  function spirAt(p, g) {
    var eL = oCubic(p / 0.7), eW = ioCubic((p - 0.3) / 0.7), kx = cl(g.L / g.T, 1, 3.2), Rm = Math.hypot(g.L / 2 / kx, g.T / 2) + 1, pitch = Rm / turns;
    return { kx: kx, pitch: pitch, tm: TAU * turns * eL, hw: pitch * mix(0.15, 1.02, eW) };
  }
  function at(g, S0, th, r) { return [g.uc + Math.cos(th0 + dir * th) * r * S0.kx, g.vc + Math.sin(th0 + dir * th) * r]; }
  applyWindowClip(c, false, function (p, b, g) {
    var S0 = spirAt(p, g); if (S0.tm <= 0.04) return [];
    var n = Math.max(4, Math.ceil(S0.tm / 0.2)), outer = [], inner = [];
    for (var k = 0; k <= n; k++) {
      var th = S0.tm * k / n, r = S0.pitch * th / TAU;
      outer.push(at(g, S0, th, r + S0.hw)); inner.push(at(g, S0, th, Math.max(0, r - S0.hw)));
    }
    return [uvPoly(g, outer.concat(inner.reverse()))];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'Spiral'), b = lineBounds(gs), g = uvBox(c, b), S1 = spirAt(1, g);
      var n = Math.max(8, Math.ceil(S1.tm / 0.17)), cmds = [];
      for (var k = 0; k <= n; k++) {
        var th = S1.tm * k / n, q = at(g, S1, th, S1.pitch * th / TAU), pt = P2(g, q[0], q[1]);
        cmds.push([k ? 'L' : 'M', pt[0], -pt[1]]);
      }
      addLocalShape(c, loc, rng, 'Trace', cmds, { stroke: hot, width: lw * 0.7, alpha: 1 }, function (p) {
        return { alpha: 1 - H.smoothstep(0.35, 0.8, p) };
      });
    });
  }
});

/* 27. xfCrossOpen */
regPost('xfCrossOpen', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, rng = inRange(c), hot = hotOf(c), lw = Math.max(2, sz * 0.03), arm = sz * 0.22;
  applyWindowClip(c, false, function (p, b, g) {
    var e1 = ioCubic(p), e2 = ioCubic(p * 1.15 - 0.15), hu = (g.L / 2 + 0.5) * e2, hv = (g.T / 2 + 0.5) * e1;
    var r1 = uvRect(g, g.U0 - 1, g.vc - hv, g.U1 + 1, g.vc + hv), r2 = uvRect(g, g.uc - hu, g.V0 - 1, g.uc + hu, g.V1 + 1);
    return [r1, r2].filter(Boolean);
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'CrossOpen'), b = lineBounds(gs), g = uvBox(c, b);
      [-1, 1].forEach(function (su) {
        [-1, 1].forEach(function (sv) {
          var pU0 = P2(g, 0, 0), pU1 = P2(g, su * arm, 0), pV1 = P2(g, 0, sv * arm);
          var cmds = [['M', pU1[0], -pU1[1]], ['L', pU0[0], -pU0[1]], ['L', pV1[0], -pV1[1]]];
          addLocalShape(c, loc, rng, 'Corner ' + su + '_' + sv, cmds, { stroke: hot, width: lw, alpha: 1 }, function (p) {
            var e1 = ioCubic(p), e2 = ioCubic(p * 1.15 - 0.15), pos = P2(g, g.uc + su * (g.L / 2 + 0.5) * e2, g.vc + sv * (g.T / 2 + 0.5) * e1);
            return { 'position.x': pos[0], 'position.y': -pos[1], alpha: cl(p * 8) * (1 - H.smoothstep(0.7, 0.95, p)) };
          });
        });
      });
    });
  }
});

/* 28. xfClosingHole (difference ellipse shrinking to 0) */
regPost('xfClosingHole', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, rng = inRange(c), hot = hotOf(c), lw = Math.max(2, sz * 0.03);
  function holeR(p, b) {
    var e = 0.5 * oCubic(p) + 0.5 * ioCubic(p);
    return { rx: (b.w / 2 * 1.42 + 2) * (1 - e), ry: (b.h / 2 * 1.42 + 2) * (1 - e) };
  }
  applyWindowClip(c, true, function (p, b) {
    var H0 = holeR(p, b); if (H0.rx < 0.3 || H0.ry < 0.3) return [];
    var pts = [];
    for (var i = 0; i < 24; i++) { var a = (i / 24) * TAU; pts.push([b.cx + Math.cos(a) * H0.rx, b.cy + Math.sin(a) * H0.ry]); }
    return [pts];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'ClosingHole'), b = lineBounds(gs);
      addLocalShape(c, loc, rng, 'Rim', G.ellipse(0, 0, 1, 1), { stroke: hot, width: lw * 0.8, alpha: 1 }, function (p) {
        var H0 = holeR(p, b), a = cl(p * 3.5) * (1 - H.smoothstep(0.75, 1, p));
        if (H0.rx < 1 || H0.ry < 1) return { 'scale.x': 1, 'scale.y': 1, alpha: 0 };
        return { 'position.x': b.cx, 'position.y': -b.cy, 'scale.x': H0.rx, 'scale.y': H0.ry, alpha: a };
      });
    });
  }
});

/* 29. xfWeave */
regPost('xfWeave', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size;
  applyWindowClip(c, false, function (p, b, g) {
    var x1 = ioCubic(p / 0.55), x2 = ioCubic((p - 0.1) / 0.55), d = mix(0.42, 1, ioCubic((p - 0.5) / 0.5)), out = [];
    var nH = cl(Math.round(g.T / (sz * 0.34)), 3, 12), ph = g.T / nH, nV = cl(Math.round(g.L / (sz * 0.34)), 3, 44), pw = g.L / nV;
    if (x1 > 0.005) for (var j = 0; j < nH; j++) {
      var cj = g.V0 + (j + 0.5) * ph, hwj = ph * d / 2 + 0.4;
      var rj = (j % 2) ? uvRect(g, g.U1 - g.L * x1, cj - hwj, g.U1 + 1, cj + hwj) : uvRect(g, g.U0 - 1, cj - hwj, g.U0 + g.L * x1, cj + hwj);
      if (rj) out.push(rj);
    }
    if (x2 > 0.005) for (var k = 0; k < nV; k++) {
      var ck = g.U0 + (k + 0.5) * pw, hwk = pw * d / 2 + 0.4;
      var rk = (k % 2) ? uvRect(g, ck - hwk, g.V1 - g.T * x2, ck + hwk, g.V1 + 1) : uvRect(g, ck - hwk, g.V0 - 1, ck + hwk, g.V0 + g.T * x2);
      if (rk) out.push(rk);
    }
    return out;
  });
});

/* 30. xfPassingWipes */
regPost('xfPassingWipes', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, dir = dirOf(c, 381), rng = inRange(c), hot = hotOf(c), t = Math.max(4, sz * 0.07);
  applyWindowClip(c, false, function (p, b, g) {
    var e = ioCubic(p); if (e <= 0.005) return [];
    var a = dir > 0 ? g.U0 + g.L * e : g.U1 - g.L * e, z = dir > 0 ? g.U1 - g.L * e : g.U0 + g.L * e;
    var r1 = dir > 0 ? uvRect(g, g.U0 - g.big, g.V0 - g.big, a, g.vc + 0.4) : uvRect(g, a, g.V0 - g.big, g.U1 + g.big, g.vc + 0.4);
    var r2 = dir > 0 ? uvRect(g, z, g.vc, g.U1 + g.big, g.V1 + g.big) : uvRect(g, g.U0 - g.big, g.vc, z, g.V1 + g.big);
    return [r1, r2].filter(Boolean);
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'PassWipes'), b = lineBounds(gs), g = uvBox(c, b);
      var dim = P2(g, t, g.T / 2);
      [0, 1].forEach(function (idx) {
        addLocalShape(c, loc, rng, 'Bar ' + idx, G.rect(-dim[0] / 2, -dim[1] / 2, dim[0], dim[1]), { fill: hot, alpha: 1 }, function (p) {
          var e = ioCubic(p), uPos = idx === 0 ? (dir > 0 ? g.U0 + g.L * e : g.U1 - g.L * e) : (dir > 0 ? g.U1 - g.L * e : g.U0 + g.L * e);
          var pos = P2(g, uPos, idx === 0 ? (g.V0 + g.vc) / 2 : (g.vc + g.V1) / 2);
          return { 'position.x': pos[0], 'position.y': -pos[1], alpha: cl(p * 12) };
        });
      });
    });
  }
});

/* 31. xfPrintHead */
regPost('xfPrintHead', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, first = dirOf(c, 391), rng = inRange(c), hot = hotOf(c);
  function rowsAt(p, g) {
    var N = cl(Math.round(g.T / (sz * 0.36)), 3, 8), h = g.T / N, out = [];
    for (var k = 0; k < N; k++) {
      var q = cl(p * N - k), e = ioSine(q), d = (k % 2 ? -1 : 1) * first;
      out.push({ q: q, v0: g.V0 + k * h, v1: g.V0 + (k + 1) * h, edge: d > 0 ? g.U0 + g.L * e : g.U1 - g.L * e, d: d, h: h });
    }
    return out;
  }
  applyWindowClip(c, false, function (p, b, g) {
    var out = [];
    rowsAt(p, g).forEach(function (r) {
      if (r.q <= 0.005) return;
      var rp = uvRect(g, r.d > 0 ? g.U0 - 1 : r.edge, r.v0 - 0.4, r.d > 0 ? r.edge : g.U1 + 1, r.v1 + 0.4);
      if (rp) out.push(rp);
    });
    return out;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'PrintHead'), b = lineBounds(gs), g = uvBox(c, b), N = cl(Math.round(g.T / (sz * 0.36)), 3, 8), h = g.T / N;
      var dim = P2(g, sz * 0.22, h + sz * 0.08);
      addLocalShape(c, loc, rng, 'Head', G.rect(-dim[0] / 2, -dim[1] / 2, dim[0], dim[1]), { fill: hot, alpha: 1 }, function (p) {
        var rows = rowsAt(p, g), active = rows.find(function (r) { return r.q > 0 && r.q < 1; });
        if (!active) return { alpha: 0 };
        var pos = P2(g, active.edge, (active.v0 + active.v1) / 2);
        return { 'position.x': pos[0], 'position.y': -pos[1], alpha: 1 };
      });
    });
  }
});

/* 32. xfTwoFields */
regPost('xfTwoFields', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, dir = dirOf(c, 401);
  applySliceTwins(c, function (b, g) {
    var D = sz * 1.4 + g.L * 0.18;
    function makeClip(fIdx) {
      return function (p, bx, gx0) {
        var hr = Math.max(sz * 0.075, 3, gx0.T / 120), n = Math.ceil(gx0.T / hr), out = [];
        for (var k = fIdx; k < n; k += 2) {
          var rp = uvRect(gx0, gx0.U0 - gx0.big, gx0.V0 + k * hr - (k < 2 ? gx0.big : 0),
            gx0.U1 + gx0.big, gx0.V0 + (k + 1) * hr + 0.6 + (k >= n - 2 ? gx0.big : 0));
          if (rp) out.push(rp);
        }
        return out;
      };
    }
    return [
      { fixed: true, sample: function (p) { return { du: -dir * D * (1 - oQuart(p / 0.66)), a: cl(p * 6) }; }, clip: makeClip(0) },
      { fixed: true, sample: function (p) { return { du: dir * D * (1 - oQuart((p - 0.3) / 0.7)), a: cl((p - 0.3) * 6) }; }, clip: makeClip(1) }
    ];
  });
});

/* 33. xfThreeTier */
regPost('xfThreeTier', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, dir = dirOf(c, 411), D = sz * 1.7;
  applySliceTwins(c, function (b, g) {
    var out = [];
    for (var k = 0; k < 3; k++) {
      (function (kk) {
        out.push({
          fixed: false,
          sample: function (p) { var q = st(p, kk / 2, 0.3); return { du: dir * D * spring(q, 3.4, 2.5), a: cl(q * 5) }; },
          clip: function (p, bx, gx0) {
            var r = uvRect(gx0, gx0.U0 - gx0.big, kk ? gx0.V0 + kk * gx0.T / 3 : gx0.V0 - gx0.big,
              gx0.U1 + gx0.big, kk < 2 ? gx0.V0 + (kk + 1) * gx0.T / 3 + 0.6 : gx0.V1 + gx0.big);
            return r ? [r] : [];
          }
        });
      })(k);
    }
    return out;
  });
});

/* 34. xfStripSort */
regPost('xfStripSort', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, sd = seedOf(c);
  applySliceTwins(c, function (b, g) {
    var N = cl(Math.round(g.L / (sz * 0.95)), 3, 7), w = g.L / N;
    var sh = 1 + (Math.floor(rand(sd, 421, 1) * (N - 1)) % Math.max(1, N - 1));
    var slot = []; for (var k = 0; k < N; k++) slot.push((k + sh) % N);
    var sw = Math.floor(rand(sd, 422, 1) * (N - 1)) % Math.max(1, N - 1);
    if (N > 1) { var tmp = slot[sw]; slot[sw] = slot[sw + 1]; slot[sw + 1] = tmp; }
    var out = [];
    for (var j = 0; j < N; j++) {
      (function (kk) {
        out.push({
          fixed: false,
          sample: function (p) {
            var q = st(p, N > 1 ? kk / (N - 1) : 0, 0.4), e = ioCubic(q);
            return { du: (slot[kk] - kk) * w * (1 - e), dv: -Math.sin(PI * q) * sz * 0.5 * (kk % 2 ? 1 : -1), a: cl(p * 7) };
          },
          clip: function (p, bx, gx0) {
            var r = uvRect(gx0, gx0.U0 + kk * w - (kk ? 0 : gx0.big), gx0.V0 - gx0.big,
              gx0.U0 + (kk + 1) * w + (kk < N - 1 ? 0.6 : gx0.big), gx0.V1 + gx0.big);
            return r ? [r] : [];
          }
        });
      })(j);
    }
    return out;
  });
});

/* 35. xfEqualizer */
regPost('xfEqualizer', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, sd = seedOf(c), rng = inRange(c), hot = hotOf(c), lw = Math.max(2, sz * 0.03);
  applySliceTwins(c, function (b, g) {
    var N = cl(Math.round(g.L / (sz * 0.5)), 4, 14), w = g.L / N, out = [];
    for (var k = 0; k < N; k++) {
      (function (kk) {
        out.push({
          fixed: true,
          sample: function (p) { var q = st(p, rand(sd, kk, 431), 0.5); return { dv: (g.T + sz * 0.1) * (1 - E.outBack(cl(q), 1.5)), a: q > 0 ? 1 : 0 }; },
          clip: function (p, bx, gx0) {
            var r = uvRect(gx0, gx0.U0 + kk * w - (kk ? 0 : gx0.big), gx0.V0 - gx0.big,
              gx0.U0 + (kk + 1) * w + (kk < N - 1 ? 0.6 : gx0.big), gx0.V1);
            return r ? [r] : [];
          }
        });
      })(k);
    }
    return out;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'Equalizer'), b = lineBounds(gs), g = uvBox(c, b), dim = P2(g, g.L, lw), pos = P2(g, g.uc, g.V1);
      addLocalShape(c, loc, rng, 'Rule', G.rect(-dim[0] / 2, -dim[1] / 2, dim[0], dim[1]), { fill: hot, alpha: 1 }, function (p) {
        var hl = Math.max(0.02, oQuart(p / 0.2)), a = 1 - H.smoothstep(0.8, 1, p);
        return g.vert ? { 'position.x': pos[0], 'position.y': -pos[1], 'scale.y': hl, alpha: a }
                      : { 'position.x': pos[0], 'position.y': -pos[1], 'scale.x': hl, alpha: a };
      });
    });
  }
});

/* 36. xfDiagStrips */
regPost('xfDiagStrips', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, k = 0.6 * dirOf(c, 441);
  applySliceTwins(c, function (b, g) {
    var ak = Math.abs(k) * g.T / 2, lo = g.U0 - ak, hi = g.U1 + ak;
    var N = cl(Math.round((hi - lo) / (sz * 1.15)), 3, 7), sw = (hi - lo) / N;
    var nrm = Math.hypot(k, 1), D = g.T + sz * 1.4, out = [];
    for (var j = 0; j < N; j++) {
      (function (jj) {
        out.push({
          fixed: false,
          sample: function (p) {
            var q = st(p, N > 1 ? jj / (N - 1) : 0, 0.42), e = oQuint(q), sg = jj % 2 ? 1 : -1;
            return { du: sg * k / nrm * D * (1 - e), dv: sg / nrm * D * (1 - e), a: cl(q * 4) };
          },
          clip: function (p, bx, gx0) {
            var a = jj ? lo + jj * sw : lo - gx0.big, z = jj < N - 1 ? lo + (jj + 1) * sw + 0.6 : hi + gx0.big, Y = gx0.big;
            return [uvPoly(gx0, [[a - k * Y, gx0.vc - Y], [z - k * Y, gx0.vc - Y], [z + k * Y, gx0.vc + Y], [a + k * Y, gx0.vc + Y]])];
          }
        });
      })(j);
    }
    return out;
  });
});

/* 37. xfRingDial */
regPost('xfRingDial', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, n = 4, dir = dirOf(c, 451), rng = inRange(c), hot = hotOf(c), lw = Math.max(2, sz * 0.03);
  function ringContour(cx, cy, r, ccw) {
    var pts = [];
    for (var i = 0; i < 24; i++) {
      var a = (ccw ? -i : i) / 24 * TAU;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return pts;
  }
  applySliceTwins(c, function (b, g) {
    var Rm = Math.hypot(b.w, b.h) / 2 + sz * 0.15, out = [];
    for (var j = 0; j < n; j++) {
      (function (jj) {
        out.push({
          fixed: true,
          sample: function (p) {
            var q = st(p, jj / (n - 1), 0.4);
            return { rot: dir * (jj % 2 ? -1 : 1) * (52 - 9 * jj) * (1 - oQuint(q)), a: cl(q * 4) };
          },
          clip: function (p, bx, gx0) {
            var r1 = jj < n - 1 ? Rm * (jj + 1) / n + 0.6 : Rm + gx0.big, r0 = Rm * jj / n;
            var res = [ringContour(b.cx, b.cy, r1, false)];
            if (jj) res.push(ringContour(b.cx, b.cy, r0, true));
            return res;
          }
        });
      })(j);
    }
    return out;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'RingDial'), b = lineBounds(gs), Rm = Math.hypot(b.w, b.h) / 2 + sz * 0.15;
      for (var j = 1; j < n; j++) {
        addLocalShape(c, loc, rng, 'Ring ' + j, G.ellipse(b.cx, -b.cy, Rm * j / n, Rm * j / n), { stroke: hot, width: lw * 0.5, alpha: 1 }, function (p) {
          return { alpha: 0.5 * cl(p * 8) * (1 - H.smoothstep(0.6, 0.95, p)) };
        });
      }
    });
  }
});

/* 38. xfStackStrips */
regPost('xfStackStrips', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, N = 4;
  applySliceTwins(c, function (b, g) {
    var h = g.T / N, out = [];
    for (var k = 0; k < N; k++) {
      (function (kk) {
        out.push({
          fixed: false,
          sample: function (p) { var q = st(p, (N - 1 - kk) / (N - 1), 0.5); return { dv: -(g.T + sz * 0.9) * (1 - bounce(q)), a: cl(q * 8) }; },
          clip: function (p, bx, gx0) {
            var r = uvRect(gx0, gx0.U0 - gx0.big, kk ? gx0.V0 + kk * h : gx0.V0 - gx0.big,
              gx0.U1 + gx0.big, kk < N - 1 ? gx0.V0 + (kk + 1) * h + 0.6 : gx0.V1 + gx0.big);
            return r ? [r] : [];
          }
        });
      })(k);
    }
    return out;
  });
});

/* 39. xfUnderSweep */
regPost('xfUnderSweep', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, dir = dirOf(c, 501), rng = inRange(c), hot = hotOf(c);
  applyWindowClip(c, false, function (p, b, g) {
    var lf = ioCubic((p - 0.12) / 0.7); if (lf <= 0.005) return [];
    var r = uvRect(g, g.U0 - g.big, mix(g.V1, g.V0, lf), g.U1 + g.big, g.V1 + g.big);
    return r ? [r] : [];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'UnderSweep'), b = lineBounds(gs), g = uvBox(c, b), t = Math.max(3, sz * 0.055);
      var dim = P2(g, 1, t);
      addLocalShape(c, loc, rng, 'Bar', G.rect(g.vert ? -dim[0] / 2 : -0.5, g.vert ? -0.5 : -dim[1] / 2, g.vert ? dim[0] : 1, g.vert ? 1 : dim[1]),
        { fill: hot, alpha: 1 }, function (p) {
          var grow = oQuart(p / 0.2), lift = ioCubic((p - 0.12) / 0.7), away = iCubic((p - 0.82) / 0.18);
          var s0 = g.L * away, s1 = g.L * grow, len = s1 - s0;
          if (len < 0.5) return { alpha: 0 };
          var u0 = dir > 0 ? g.U0 + s0 : g.U1 - s1, u1 = dir > 0 ? g.U0 + s1 : g.U1 - s0;
          var pos = P2(g, (u0 + u1) / 2, mix(g.V1, g.V0, lift));
          return g.vert ? { 'position.x': pos[0], 'position.y': -pos[1], 'scale.y': len, alpha: 1 }
                        : { 'position.x': pos[0], 'position.y': -pos[1], 'scale.x': len, alpha: 1 };
        });
    });
  }
});

/* 40. xfTapeOff */
regPost('xfTapeOff', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, sd = seedOf(c), first = dirOf(c, 511), rng = inRange(c);
  function tapeAt(k, p, g) {
    var ex = sz * 0.07, d = (k % 2 ? -1 : 1) * first, lay = oQuart(cl((p - k * 0.05) / 0.18)), off = ioCubic(cl((p - 0.3 - k * 0.13) / 0.42));
    var s0 = (g.L + ex * 2) * off, s1 = (g.L + ex * 2) * lay;
    return { d: d, lay: lay, off: off, s0: s0, s1: s1, ex: ex, v0: g.V0 + k * g.T / 3, v1: g.V0 + (k + 1) * g.T / 3,
      tilt: (rand(sd, k, 512) * 2 - 1) * ex * 0.7, u: function (s) { return d > 0 ? g.U0 - ex + s : g.U1 + ex - s; } };
  }
  applyWindowClip(c, false, function (p, b, g) {
    var out = [];
    for (var k = 0; k < 3; k++) {
      var t = tapeAt(k, p, g); if (t.lay <= 0.005) continue;
      var e = t.lay >= 1 ? g.big : (g.L + t.ex * 2) * t.lay - 2;
      var rp = uvRect(g, Math.min(t.u(-g.big), t.u(e)), t.v0 - (k === 0 ? g.big : 0.4), Math.max(t.u(-g.big), t.u(e)), t.v1 + (k === 2 ? g.big : 0.4));
      if (rp) out.push(rp);
    }
    return out;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'TapeOff'), b = lineBounds(gs), g = uvBox(c, b, sz * 0.14);
      var cols = [hotOf(c), c.sc.accent2 || c.sc.sub || c.sc.fg, hotOf(c)];
      for (var k = 0; k < 3; k++) {
        (function (kk) {
          var t0 = tapeAt(kk, 0, g), dim = P2(g, 1, t0.v1 - t0.v0 + t0.ex * 2);
          var ang = Math.atan2(t0.tilt, g.L / 2 + t0.ex) / DEG * (t0.d > 0 ? 1 : -1);
          addLocalShape(c, loc, rng, 'Tape ' + kk, G.rect(g.vert ? -dim[0] / 2 : -0.5, g.vert ? -0.5 : -dim[1] / 2, g.vert ? dim[0] : 1, g.vert ? 1 : dim[1]),
            { fill: cols[kk], alpha: 1 }, function (p) {
              var t = tapeAt(kk, p, g), len = t.s1 - t.s0;
              if (len < 0.5) return { alpha: 0 };
              var pos = P2(g, (t.u(t.s0) + t.u(t.s1)) / 2, (t.v0 + t.v1) / 2);
              return g.vert ? { 'position.x': pos[0], 'position.y': -pos[1], rotation: -ang, 'scale.y': len, alpha: 1 }
                            : { 'position.x': pos[0], 'position.y': -pos[1], rotation: -ang, 'scale.x': len, alpha: 1 };
            });
        })(k);
      }
    });
  }
});

/* 41. xfScanner */
regPost('xfScanner', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, rng = inRange(c), hot = hotOf(c), lw = Math.max(2, sz * 0.03);
  function scanV(p, g) {
    var down = ioCubic(p / 0.46), up = ioCubic((p - 0.52) / 0.48);
    return { up: up, v: p < 0.5 ? mix(g.V0, g.V1, down) : mix(g.V1, g.V0, up) };
  }
  applyWindowClip(c, false, function (p, b, g) {
    var sc = scanV(p, g); if (sc.up <= 0.005) return [];
    var r = uvRect(g, g.U0 - g.big, sc.v, g.U1 + g.big, g.V1 + g.big);
    return r ? [r] : [];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs, cut, parent, options) {
      if (!isPrimaryNode(c, gs)) return;
      var placeId = localPlacementNull(graph, ids, cut, c.node, c.comp);
      var b = lineBounds(gs), g = uvBox(c, b), sw = Math.max(1.2, sz * 0.02);
      var twinByF = Object.create(null);
      for (var f = cut.start; f < rng.end; f++) {
        var sc = scanV(pinAt(c, f), g), r = uvRect(g, g.U0 - g.big, g.V0 - g.big, g.U1 + g.big, sc.v);
        twinByF[f] = r ? [toScenePoly(graph, placeId, f, r)] : [];
      }
      ids.forEach(function (srcId) {
        var clone = V.cloneLayer(graph, srcId, 'Scan Outline');
        clone.attrs.fill = false; clone.attrs.stroke = true;
        clone.attrs['stroke.strokeColor'] = c.node.color; clone.attrs['stroke.width'] = sw;
        insertBeforeLayer(graph, clone.id, ids[0]);
        for (var f = cut.start; f < cut.end; f++) setKey(graph, clone.id, 'alpha', f, f < rng.end ? 0.8 : 0, 1);
        H.multiClip(graph, clone.id, twinByF, false, 'Scan outline clip', options);
      });
      var loc = V.local(c, c.node, 'Scanner'), dim = P2(g, g.L + sz * 0.4, lw), tailDim = P2(g, g.L + sz * 0.4, sz * 0.22);
      addLocalShape(c, loc, rng, 'Bar', G.rect(-dim[0] / 2, -dim[1] / 2, dim[0], dim[1]), { fill: hot, alpha: 1 }, function (p) {
        var pos = P2(g, g.uc, scanV(p, g).v);
        return { 'position.x': pos[0], 'position.y': -pos[1], alpha: cl(p * 14) * (1 - H.smoothstep(0.9, 1, p)) };
      });
      addLocalShape(c, loc, rng, 'Glow', G.rect(-tailDim[0] / 2, -tailDim[1] / 2, tailDim[0], tailDim[1]), { fill: hot, alpha: 1 }, function (p) {
        var pos = P2(g, g.uc, scanV(p, g).v + sz * 0.11 * (p < 0.5 ? -1 : 1));
        return { 'position.x': pos[0], 'position.y': -pos[1], alpha: cl(p * 14) * (1 - H.smoothstep(0.9, 1, p)) * 0.18 };
      });
    });
  }
});

/* 42. xfRollerShutter */
regPost('xfRollerShutter', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, rng = inRange(c), hot = hotOf(c);
  function edgeV(p, g) {
    return p < 0.3 ? mix(g.V0, g.V1, oCubic(p / 0.2)) : mix(g.V1, g.V0, ioCubic((p - 0.3) / 0.7));
  }
  applyWindowClip(c, false, function (p, b, g) {
    if (p < 0.3) {
      var r = uvRect(g, g.U0, g.V0, g.U1, edgeV(p, g) - 2);
      return r ? [r] : [];
    }
    var full = uvRect(g, g.U0 - g.big, g.V0 - g.big, g.U1 + g.big, g.V1 + g.big);
    return full ? [full] : [];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'Shutter'), b = lineBounds(gs), g = uvBox(c, b), m = sz * 0.1;
      var plateDim = P2(g, g.L + m * 2, 1), barDim = P2(g, g.L + m * 3.2, Math.max(2, sz * 0.09));
      addLocalShape(c, loc, rng, 'Curtain', G.rect(g.vert ? -0.5 : -plateDim[0] / 2, g.vert ? -plateDim[1] / 2 : -0.5, g.vert ? 1 : plateDim[0], g.vert ? plateDim[1] : 1),
        { fill: hot, alpha: 1 }, function (p) {
          var v = edgeV(p, g), h = v - g.V0;
          if (h < 0.5) return { alpha: 0 };
          var pos = P2(g, g.uc, (g.V0 + v) / 2);
          return g.vert ? { 'position.x': pos[0], 'position.y': -pos[1], 'scale.x': h, alpha: 1 }
                        : { 'position.x': pos[0], 'position.y': -pos[1], 'scale.y': h, alpha: 1 };
        });
      addLocalShape(c, loc, rng, 'Handle', G.rect(-barDim[0] / 2, -barDim[1] / 2, barDim[0], barDim[1]), { fill: c.sc.fg || '#ffffff', alpha: 1 }, function (p) {
        var v = edgeV(p, g), h = v - g.V0;
        if (h < 0.5) return { alpha: 0 };
        var pos = P2(g, g.uc, v - Math.min(h, sz * 0.09) / 2);
        return { 'position.x': pos[0], 'position.y': -pos[1], alpha: 1 };
      });
    });
  }
});

/* 43. xfOutlineLead */
regPost('xfOutlineLead', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, dir = dirOf(c, 601), rng = inRange(c), hot = hotOf(c);
  function spansAt(p, g) {
    var e1 = ioCubic(p / 0.7), e2 = ioCubic((p - 0.3) / 0.7);
    function sp(a, z) { return [dir > 0 ? g.U0 + a : g.U1 - z, dir > 0 ? g.U0 + z : g.U1 - a]; }
    return { e1: e1, e2: e2, sFill: sp(-g.big, g.L * e2), sOut: sp(g.L * e2 - 0.5, e1 >= 1 ? g.big : g.L * e1) };
  }
  applyWindowClip(c, false, function (p, b, g) {
    var S0 = spansAt(p, g); if (S0.e2 <= 0.005) return [];
    var r = uvRect(g, S0.sFill[0], g.V0 - g.big, S0.sFill[1], g.V1 + g.big);
    return r ? [r] : [];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs, cut, parent, options) {
      if (!isPrimaryNode(c, gs)) return;
      var placeId = localPlacementNull(graph, ids, cut, c.node, c.comp), b = lineBounds(gs), g = uvBox(c, b), sw = Math.max(1.2, sz * 0.024);
      var twinByF = Object.create(null);
      for (var f = cut.start; f < rng.end; f++) {
        var S0 = spansAt(pinAt(c, f), g), r = (S0.e1 > 0 && S0.e2 < 1) ? uvRect(g, S0.sOut[0], g.V0 - g.big, S0.sOut[1], g.V1 + g.big) : null;
        twinByF[f] = r ? [toScenePoly(graph, placeId, f, r)] : [];
      }
      ids.forEach(function (srcId) {
        var clone = V.cloneLayer(graph, srcId, 'Outline Lead');
        clone.attrs.fill = false; clone.attrs.stroke = true;
        clone.attrs['stroke.strokeColor'] = c.node.color; clone.attrs['stroke.width'] = sw;
        insertBeforeLayer(graph, clone.id, ids[0]);
        for (var f = cut.start; f < cut.end; f++) {
          var S0 = spansAt(pinAt(c, f), g);
          setKey(graph, clone.id, 'alpha', f, (f < rng.end && S0.e1 > 0 && S0.e2 < 1) ? 1 : 0, 1);
        }
        H.multiClip(graph, clone.id, twinByF, false, 'Outline lead clip', options);
      });
      var loc = V.local(c, c.node, 'OutlineLead'), t = Math.max(3, sz * 0.05), dim = P2(g, t, g.T);
      [0, 1].forEach(function (idx) {
        addLocalShape(c, loc, rng, 'Bar ' + idx, G.rect(-dim[0] / 2, -dim[1] / 2, dim[0], dim[1]), { fill: hot, alpha: 1 }, function (p) {
          var e = idx === 0 ? ioCubic(p / 0.7) : ioCubic((p - 0.3) / 0.7);
          if (e <= 0 || e >= 1) return { alpha: 0 };
          var pos = P2(g, dir > 0 ? g.U0 + g.L * e : g.U1 - g.L * e, g.vc);
          return { 'position.x': pos[0], 'position.y': -pos[1], alpha: idx === 0 ? 0.7 : 1 };
        });
      });
    });
  }
});

/* 44. xfTraceFlood */
regPost('xfTraceFlood', 'ae/p_x2_entB.jsx', function (c) {
  var sz = c.node.size, dir = dirOf(c, 611), k = 0.5, rng = inRange(c), hot = hotOf(c);
  function floodS(p, g) {
    var fl = ioCubic((p - 0.46) / 0.54), hv = g.T / 2;
    return { fl: fl, hv: hv, s: -k * hv + (g.L + 2 * k * hv + 1) * fl, u: function (s) { return dir > 0 ? g.U0 + s : g.U1 - s; } };
  }
  applyWindowClip(c, false, function (p, b, g) {
    var G = floodS(p, g); if (G.fl <= 0.005) return [];
    return [uvPoly(g, [[G.u(-g.big), g.V0], [G.u(G.s + k * G.hv), g.V0], [G.u(G.s - k * G.hv), g.V1], [G.u(-g.big), g.V1]])];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs, cut) {
      if (!isPrimaryNode(c, gs)) return;
      var sw = Math.max(1.2, sz * 0.022);
      ids.forEach(function (srcId) {
        var clone = V.cloneLayer(graph, srcId, 'Trace Outline');
        clone.attrs.fill = false; clone.attrs.stroke = true;
        clone.attrs['stroke.strokeColor'] = c.node.color; clone.attrs['stroke.width'] = sw;
        insertBeforeLayer(graph, clone.id, ids[0]);
        for (var f = cut.start; f < cut.end; f++) {
          var p = pinAt(c, f), d = oQuad(cl(p / 0.58)), oa = (1 - H.smoothstep(0.84, 1, p)) * cl(d * 2.5);
          setKey(graph, clone.id, 'alpha', f, f < rng.end ? oa : 0, 1);
        }
      });
      var loc = V.local(c, c.node, 'TraceFlood'), b = lineBounds(gs), g = uvBox(c, b), hv = g.T / 2, w = sz * 0.09;
      var pts = uvPoly(g, [[k * hv, -hv], [k * hv + w, -hv], [-k * hv + w, hv], [-k * hv, hv]]);
      var cmds = pts.map(function (q, i) { return [i ? 'L' : 'M', q[0], -q[1]]; }).concat([['Z']]);
      addLocalShape(c, loc, rng, 'Band', cmds, { fill: hot, alpha: 1 }, function (p) {
        var G = floodS(p, g); if (G.fl <= 0 || G.fl >= 1) return { alpha: 0 };
        var pos = P2(g, G.u(G.s), g.vc);
        return { 'position.x': pos[0], 'position.y': -pos[1], alpha: Math.min(1, G.fl * 8, (1 - G.fl) * 8) };
      });
    });
  }
});

/* =====================================================================
   PART 3: All 29 missing xg*
   ===================================================================== */

/* 45. xgGate */
regPost('xgGate', 'ae/p_x2_entC.jsx', function (c) {
  var vert = !!c.node.vertical, dir = dirOf(c, 11), sz = c.node.size, rng = inRange(c), hot = c.sc.accent || c.sc.fg;
  applyWholeRig(c, function (p, b) {
    var th = 88 * Math.abs(spring(p, 1.6, 2.2)), k = Math.max(0.02, Math.cos(th * DEG));
    var col = H.mixHex(c.node.color, c.sc.bg || '#101010', (1 - k) * 0.5);
    return {
      ax: vert ? b.cx : (dir > 0 ? b.x0 : b.x1), ay: vert ? (dir > 0 ? b.y0 : b.y1) : b.cy,
      sx: vert ? 1 : k, sy: vert ? k : 1, a: cl(p * 8), color: col
    };
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'Gate'), b = lineBounds(gs), t = Math.max(2, sz * 0.035), m = sz * 0.12;
      var cmds = vert ? G.rect(b.x0 - m, (dir > 0 ? b.y0 : b.y1) - (dir > 0 ? t + m : -m), b.w + m * 2, t)
                      : G.rect((dir > 0 ? b.x0 : b.x1) - (dir > 0 ? t + m : -m), b.y0 - m, t, b.h + m * 2);
      addLocalShape(c, loc, rng, 'Hinge', cmds, { fill: hot, alpha: 1 }, function (p) { return { alpha: 1 - H.smoothstep(0.55, 0.95, p) }; });
    });
  }
});

/* 46. xgSignSpin */
regPost('xgSignSpin', 'ae/p_x2_entC.jsx', function (c) {
  var vert = !!c.node.vertical;
  applyWholeRig(c, function (p, b) {
    var th = (1 - oCubic(p)) * 540, cs = Math.cos(th * DEG), k = Math.max(0.03, Math.abs(cs)), sg = cs < 0 ? -1 : 1;
    var col = H.mixHex(c.node.color, c.sc.bg || '#101010', cs < 0 ? 0.55 : (1 - k) * 0.35);
    return { ax: b.cx, ay: b.cy, sx: vert ? 1 : sg * k, sy: vert ? sg * k : 1, a: cl(p * 5), color: col };
  });
});

/* 47. xgNoseDive */
regPost('xgNoseDive', 'ae/p_x2_entC.jsx', function (c) {
  var dir = dirOf(c, 13), sz = c.node.size, mk = H.motionAmt(c) / 0.7;
  applyWholeRig(c, function (p, b) {
    var D = Math.min(c.comp.width * 0.45, Math.max(sz * 3, b.w * 0.6)) * (0.7 + 0.35 * mk);
    var e = oCubic(p / 0.5), t = (p - 0.26) / 0.74;
    var pitch = t <= 0 ? 0 : (t < 0.28 ? oCubic(t / 0.28) : 1 - bounce((t - 0.28) / 0.72));
    var amp = cl(sz * 30 / Math.max(1, b.w), 5, 15);
    return { ax: dir > 0 ? b.x1 : b.x0, ay: b.y1, rot: dir * amp * pitch, dx: -dir * D * (1 - e), a: cl(p * 7) };
  });
});

/* 48. xgQuarterTurn */
regPost('xgQuarterTurn', 'ae/p_x2_entC.jsx', function (c) {
  var dir = dirOf(c, 15);
  applyWholeRig(c, function (p, b) {
    var s = mix(0.5, 1, oCubic(p));
    return { ax: b.cx, ay: b.cy, rot: dir * 90 * (1 - E.outBack(cl(p), 1.5)), sx: s, sy: s, a: cl(p * 5) };
  });
});

/* 49. xgCornerUnfurl */
regPost('xgCornerUnfurl', 'ae/p_x2_entC.jsx', function (c) {
  var corner = Math.floor(rand(seedOf(c), 17, 1) * 4) % 4;
  var sgn = ((corner & 1) ^ ((corner >> 1) & 1)) ? 1 : -1;
  applyWholeRig(c, function (p, b) {
    var s = Math.max(0.04, E.outBack(cl(p), 1.3));
    return { ax: (corner & 1) ? b.x1 : b.x0, ay: (corner & 2) ? b.y1 : b.y0,
      rot: sgn * 40 * spring(p, 2.8, 1.5), sx: s, sy: s, a: cl(p * 6) };
  });
});

/* 50. xgWiper */
regPost('xgWiper', 'ae/p_x2_entC.jsx', function (c) {
  var dir = dirOf(c, 19), up = Math.floor(rand(seedOf(c), 20, 1) * 2) & 1;
  applyWholeRig(c, function (p, b) {
    var R = Math.max(Math.min(c.comp.width, c.comp.height) * 0.85, b.w * 0.7);
    return { ax: b.cx, ay: b.cy + (up ? -R : R), rot: dir * 40 * (1 - E.outBack(cl(p), 1.2)), a: cl(p * 6) };
  });
});

/* 51. xgJelly */
regPost('xgJelly', 'ae/p_x2_entC.jsx', function (c) {
  function os(v) { return v < 0 ? v * 0.35 : v; }
  applyWholeRig(c, function (p, b) {
    var d = Math.exp(-4 * p) * (1 - p * p * p), ph = 1.0;
    var sx = Math.max(0.03, 1 - os(d * Math.cos(3 * PI * p)));
    var sy = Math.max(0.03, 1 - os(d * Math.cos(3 * PI * p - ph) / Math.cos(ph)) * (1 - 0.3 * H.smoothstep(0, 0.5, p)));
    return { ax: b.cx, ay: b.y1, sx: sx, sy: sy, a: cl(p * 8) };
  });
});

/* 52. xgShearUp */
regPost('xgShearUp', 'ae/p_x2_entC.jsx', function (c) {
  var dir = dirOf(c, 23), sz = c.node.size;
  applyWholeRig(c, function (p, b) {
    var tn = dir * Math.min(2.2, sz * 2.6 / Math.max(1, b.h)) * spring(p, 3.0, 2.3);
    return { ax: 0, ay: b.y1, skew: Math.atan(tn) / DEG, a: cl(p * 5) };
  });
});

/* 53. xgNewsSpin */
regPost('xgNewsSpin', 'ae/p_x2_entC.jsx', function (c) {
  var dir = dirOf(c, 25);
  applyWholeRig(c, function (p, b) {
    var s = Math.max(0.03, H.smoothstep(0, 1, p));
    return { ax: b.cx, ay: b.cy, rot: dir * 720 * (1 - oCubic(p)), sx: s, sy: s, a: cl(p * 4) };
  });
});

/* 54. xgCoinSettle */
regPost('xgCoinSettle', 'ae/p_x2_entC.jsx', function (c) {
  var vert = !!c.node.vertical;
  applyWholeRig(c, function (p, b) {
    var ph = TAU * (1.5 * p + 4.5 * p * p), d = Math.pow(1 - p, 1.3), k = Math.max(0.05, 1 - 0.88 * d * (0.5 + 0.5 * Math.cos(ph)));
    return { ax: b.cx, ay: b.cy, rot: 5 * d * Math.sin(ph / 2) * (1 - p), sx: vert ? k : 1, sy: vert ? 1 : k,
      a: cl(p * 7), color: H.mixHex(c.node.color, c.sc.bg || '#101010', (1 - k) * 0.4) };
  });
});

/* 55. xgPumpUp */
regPost('xgPumpUp', 'ae/p_x2_entC.jsx', function (c) {
  var L = [0.02, 0.45, 0.75, 1];
  applyWholeRig(c, function (p, b) {
    var x3 = p * 3, k = Math.min(2, Math.floor(x3)), f = x3 - k;
    var s = mix(L[k], L[k + 1], E.outBack(cl(f / 0.5), 2.4));
    if (k < 2) s -= 0.06 * H.smoothstep(0.55, 1, f);
    s = Math.max(0.02, s);
    var puff = Math.sin(PI * cl(f / 0.5)) * 0.07;
    return { ax: b.cx, ay: b.cy, sx: s * (1 + puff), sy: s * (1 - puff * 0.6), a: cl(p * 10) };
  });
});

/* 56. xgHeavyDrop */
regPost('xgHeavyDrop', 'ae/p_x2_entC.jsx', function (c) {
  var sz = c.node.size, rng = inRange(c), hot = c.sc.accent || c.sc.fg;
  function seg(p, a, b0) { return cl((p - a) / (b0 - a)); }
  applyWholeRig(c, function (p, b) {
    var D = sz * 2.6 + b.h * 0.5, dy = 0, sy = 1;
    if (p < 0.3) { var t = p / 0.3; dy = -(1 - t * t) * D; sy = 1 + 0.22 * t; }
    else if (p < 0.42) sy = 1 - 0.34 * Math.sin(PI * seg(p, 0.3, 0.42));
    else if (p < 0.7) { var u = seg(p, 0.42, 0.7); dy = -4 * u * (1 - u) * sz * 0.55; sy = 1 + 0.1 * Math.sin(PI * u); }
    else if (p < 0.78) sy = 1 - 0.2 * Math.sin(PI * seg(p, 0.7, 0.78));
    else if (p < 0.92) { var u2 = seg(p, 0.78, 0.92); dy = -4 * u2 * (1 - u2) * sz * 0.14; }
    else sy = 1 - 0.07 * Math.sin(PI * seg(p, 0.92, 1));
    sy = Math.max(0.1, sy);
    return { ax: b.cx, ay: b.y1, dy: dy, sx: 1 / Math.pow(sy, 0.35), sy: sy, a: cl(p * 10) };
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'HeavyDrop'), b = lineBounds(gs), h = Math.max(2, sz * 0.035);
      addLocalShape(c, loc, rng, 'Dust', G.rect(-b.w / 2, -h / 2, b.w, h), { fill: hot, alpha: 1 }, function (p) {
        if (p < 0.3) return { alpha: 0 };
        var t = cl((p - 0.3) / 0.4);
        return { 'position.x': b.cx, 'position.y': -(b.y1 + sz * 0.06), 'scale.x': 0.6 + 0.6 * oCubic(t), 'scale.y': Math.max(0.05, 1 - t), alpha: (1 - t) * 0.9 };
      });
    });
  }
});

/* 57. xgPushBar */
regPost('xgPushBar', 'ae/p_x2_entC.jsx', function (c) {
  var vert = !!c.node.vertical, dir = dirOf(c, 29), sz = c.node.size, tP = 0.6, a0 = 0.25, v = 1 / (1 - a0 / 2), rng = inRange(c), hot = c.sc.accent || c.sc.fg;
  function stAt(p, b) {
    var D = Math.min((vert ? c.comp.height : c.comp.width) * 0.42, (vert ? b.h : b.w) * 0.35 + sz * 2.4);
    var off = 0, sq = 1, t2 = 0;
    if (p < tP) {
      var t = p / tP, e = t < a0 ? v * t * t / (2 * a0) : v * (t - a0 / 2);
      off = -dir * D * (1 - e); sq = 1 - 0.09 * H.smoothstep(0, 0.15, t);
    } else {
      t2 = (p - tP) / (1 - tP); sq = 1 - 0.09 * spring(t2, 3.5, 3);
    }
    return { off: off, sq: sq, t2: t2 };
  }
  applyWholeRig(c, function (p, b) {
    var s = stAt(p, b);
    return vert ? { ax: b.cx, ay: dir > 0 ? b.y0 : b.y1, dy: s.off, sy: s.sq, a: cl(p * 8) }
                : { ax: dir > 0 ? b.x0 : b.x1, ay: b.cy, dx: s.off, sx: s.sq, a: cl(p * 8) };
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'PushBar'), b = lineBounds(gs), bw = Math.max(6, sz * 0.09), m = sz * 0.2;
      var cmds = vert ? G.rect(b.x0 - m, -bw / 2, b.w + m * 2, bw) : G.rect(-bw / 2, -(b.y1 + m), bw, b.h + m * 2);
      addLocalShape(c, loc, rng, 'Bar', cmds, { fill: hot, alpha: 1 }, function (p) {
        var s = stAt(p, b), gap = sz * 0.06 + iCubic(s.t2) * sz * 3, edge = (vert ? (dir > 0 ? b.y0 - gap - bw / 2 : b.y1 + gap + bw / 2) : (dir > 0 ? b.x0 - gap - bw / 2 : b.x1 + gap + bw / 2)) + s.off;
        var al = p < tP ? 1 : (1 - H.smoothstep(0.25, 0.85, s.t2));
        return vert ? { 'position.x': 0, 'position.y': -edge, alpha: al * cl(p * 8) }
                    : { 'position.x': edge, 'position.y': 0, alpha: al * cl(p * 8) };
      });
    });
  }
});

/* 58. xgWallHit */
regPost('xgWallHit', 'ae/p_x2_entC.jsx', function (c) {
  var dir = dirOf(c, 31), sz = c.node.size, tI = 0.4, mk = H.motionAmt(c) / 0.7, rng = inRange(c), hot = c.sc.accent || c.sc.fg;
  applyWholeRig(c, function (p, b) {
    var D = Math.min(c.comp.width * 0.45, Math.max(sz * 3.5, b.w * 0.5)) * (0.7 + 0.35 * mk);
    var off, sq;
    if (p < tI) {
      var u = p / tI; off = -dir * D * (1 - u * u * u); sq = 1 + 0.18 * u * u;
    } else {
      var t = (p - tI) / (1 - tI), u2 = cl((t - 0.16) / 0.84);
      sq = t < 0.16 ? 1 - 0.36 * Math.sin(PI / 2 * t / 0.16) : 1 - 0.36 * spring(u2, 3.2, 2.6);
      off = -dir * sz * 0.4 * Math.sin(PI * u2) * (1 - u2);
    }
    sq = Math.max(0.2, sq);
    return { ax: dir > 0 ? b.x1 : b.x0, ay: b.cy, dx: off, sx: sq, sy: 1 / Math.pow(sq, 0.5), a: cl(p * 6) };
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'WallHit'), b = lineBounds(gs), bw = Math.max(4, sz * 0.06), wx = dir > 0 ? b.x1 + sz * 0.05 + bw / 2 : b.x0 - sz * 0.05 - bw / 2;
      addLocalShape(c, loc, rng, 'Wall', G.rect(-bw / 2, -b.h / 2, bw, b.h), { fill: hot, alpha: 1 }, function (p) {
        if (p < tI) return { alpha: 0 };
        var t = (p - tI) / (1 - tI), m = 1 + (sz * (0.25 + 0.5 * oCubic(t)) * 2) / Math.max(1, b.h);
        return { 'position.x': wx, 'position.y': -b.cy, 'scale.y': m, alpha: Math.exp(-t * 5) * (1 - t) };
      });
    });
  }
});

/* 59. xgHangSign */
regPost('xgHangSign', 'ae/p_x2_entC.jsx', function (c) {
  var sz = c.node.size, dir = dirOf(c, 33), rng = inRange(c);
  function signGeo(p, b) {
    var L = sz * 0.9 + b.h * 0.5, amp = cl(sz * 34 / Math.max(1, b.w), 3.5, 12);
    return { L: L, ang: dir * amp * spring(p, 2.2, 4.4), lift: -sz * 1.2 * (1 - oCubic(p / 0.3)) };
  }
  applyWholeRig(c, function (p, b) {
    var G0 = signGeo(p, b);
    return { ax: b.cx, ay: b.cy - G0.L, rot: G0.ang, dy: G0.lift, a: cl(p * 6) };
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'HangSign'), b = lineBounds(gs), lw = Math.max(1.5, sz * 0.02), ix = b.w * 0.1;
      [b.x0 + ix, b.x1 - ix].forEach(function (hx, k) {
        addLocalShape(c, loc, rng, 'Chain ' + k, [['M', 0, 0], ['L', 0, 1]], { stroke: c.sc.sub || c.sc.fg, width: lw, alpha: 1 }, function (p) {
          var G0 = signGeo(p, b), r = G0.ang * DEG, cs = Math.cos(r), sn = Math.sin(r), px = hx - b.cx, py = (b.y0 - (b.cy - G0.L));
          var rx = b.cx + px * cs - py * sn, ry = b.cy - G0.L + px * sn + py * cs + G0.lift;
          var topY = b.y0 - sz * 2.4, len = Math.max(2, ry - topY);
          return { 'position.x': rx, 'position.y': -ry, 'scale.y': len, alpha: 0.75 * (1 - H.smoothstep(0.7, 0.98, p)) };
        });
      });
    });
  }
});

/* 60. xgStampLift */
regPost('xgStampLift', 'ae/p_x2_entC.jsx', function (c) {
  var dir = dirOf(c, 35), sz = c.node.size, tI = 0.3, hot = hotOf(c), rng = inRange(c);
  applyWholeRig(c, function (p, b) {
    if (p < tI) {
      var t = iCubic(p / tI), s = mix(1.45, 0.93, t);
      return { ax: b.cx, ay: b.cy, rot: -dir * 7 * (1 - t), sx: s, sy: s, a: cl(p / tI * 2.5) };
    }
    var u = (p - tI) / (1 - tI), s2 = mix(0.93, 1, oCubic(u / 0.5));
    return { ax: b.cx, ay: b.cy, sx: s2, sy: s2, a: 1 };
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs, cut) {
      if (!isPrimaryNode(c, gs)) return;
      var placeId = localPlacementNull(graph, ids, cut, c.node, c.comp), b = lineBounds(gs), sw = Math.max(1.5, sz * 0.03);
      var rig = graph.add('null', cut.id + ' / ' + c.node.id + ' / Die Rig', placeId, cut.start, rng.end, {});
      ids.forEach(function (srcId) {
        var clone = V.cloneLayer(graph, srcId, 'Stamp Die');
        clone.parent = rig; clone.attrs.fill = false; clone.attrs.stroke = true;
        clone.attrs['stroke.strokeColor'] = hot; clone.attrs['stroke.width'] = sw;
        for (var f = cut.start; f < rng.end; f++) {
          var p = pinAt(c, f), t = (p - tI) / (1 - tI), lt = cl(t / 0.85);
          setKey(graph, clone.id, 'alpha', f, (p >= tI && lt < 1) ? 0.8 * Math.pow(1 - lt, 1.4) : 0, 1);
        }
      });
      for (var f = cut.start; f < rng.end; f++) {
        var p = pinAt(c, f), t = (p - tI) / (1 - tI), lt = cl(t / 0.85), e = p >= tI ? oCubic(lt) : 0, sc = 1 + 0.45 * e;
        graph.key(rig, 'position.x', f, b.cx, 1); graph.key(rig, 'position.y', f, -b.cy, 1);
        graph.key(rig, 'rotation', f, -dir * 5 * e, 1); graph.key(rig, 'scale.x', f, sc, 1); graph.key(rig, 'scale.y', f, sc, 1);
      }
    });
  }
});

/* 61. xgPaperFall */
regPost('xgPaperFall', 'ae/p_x2_entC.jsx', function (c) {
  var sz = c.node.size, dir = dirOf(c, 37);
  applyWholeRig(c, function (p, b) {
    var ph = p * TAU * 1.75, d = Math.pow(1 - p, 1.2);
    return { ax: b.cx, ay: b.cy, rot: -dir * 12 * Math.cos(ph) * d * H.smoothstep(0, 0.15, 1 - p),
      sy: Math.max(0.2, 1 - 0.3 * Math.abs(Math.sin(ph)) * d),
      dx: dir * sz * 0.9 * Math.sin(ph) * d, dy: -sz * 2.3 * (1 - Math.sin(p * PI / 2)), a: cl(p * 4) };
  });
});

/* 62. xgRatchet */
regPost('xgRatchet', 'ae/p_x2_entC.jsx', function (c) {
  var vert = !!c.node.vertical, sz = c.node.size, dir = dirOf(c, 39), N = 4, mk = H.motionAmt(c) / 0.7;
  applyWholeRig(c, function (p, b) {
    var x4 = p * N, k = Math.min(N - 1, Math.floor(x4)), f = x4 - k;
    var e = (k + E.outBack(cl(f / 0.4), 2.6)) / N, D = Math.min((vert ? c.comp.height : c.comp.width) * 0.4, sz * 2.6) * (0.7 + 0.35 * mk);
    var rot = dir * 2.4 * Math.exp(-f * 7) * Math.sin(f * 18) * (1 - f);
    return { ax: b.cx, ay: b.cy, rot: rot, dx: vert ? 0 : -dir * D * (1 - e), dy: vert ? -dir * D * (1 - e) : 0, a: cl(p * N * 2.5) };
  });
});

/* 63. xgZipLine */
regPost('xgZipLine', 'ae/p_x2_entC.jsx', function (c) {
  var sz = c.node.size, dir = dirOf(c, 41), tS = 0.55, slope = 0.42, hang = sz * 0.7, rng = inRange(c);
  function zipGeo(p, b) {
    var D = Math.max(sz * 3, c.comp.width * 0.42), e = Math.pow(cl(p / tS), 1.6), t = (p - tS) / (1 - tS);
    var amp = cl(sz * 40 / Math.max(1, b.w), 4, 13);
    var ang = p < tS ? dir * amp * H.smoothstep(0, 0.4, p / tS) : dir * amp * Math.cos(PI * 2.4 * t) * Math.pow(1 - t, 1.4);
    return { ox: -dir * D * (1 - e), oy: -slope * D * (1 - e), ang: ang };
  }
  applyWholeRig(c, function (p, b) {
    var Z0 = zipGeo(p, b);
    return { ax: b.cx, ay: b.y0 - hang, rot: Z0.ang, dx: Z0.ox, dy: Z0.oy, a: cl(p * 6) };
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimaryNode(c, gs)) return;
      var loc = V.local(c, c.node, 'ZipLine'), b = lineBounds(gs), lw = Math.max(1.5, sz * 0.02), far = Math.max(c.comp.width, c.comp.height) * 1.5;
      var py0 = b.y0 - hang;
      addLocalShape(c, loc, rng, 'Cable', [['M', b.cx - dir * far, -(py0 - slope * far)], ['L', b.cx + dir * sz * 0.5, -(py0 + slope * sz * 0.5)]],
        { stroke: c.sc.sub || c.sc.fg, width: lw, alpha: 1 }, function (p) { return { alpha: 0.8 * (1 - H.smoothstep(0.72, 0.98, p)) }; });
      addLocalShape(c, loc, rng, 'Pulley', G.ellipse(0, 0, lw * 2.4, lw * 2.4), { fill: c.sc.accent || c.sc.fg, alpha: 1 }, function (p) {
        var Z0 = zipGeo(p, b);
        return { 'position.x': b.cx + Z0.ox, 'position.y': -(py0 + Z0.oy), alpha: 0.8 * (1 - H.smoothstep(0.72, 0.98, p)) };
      });
    });
  }
});

/* 64. xgFocusHunt */
regPost('xgFocusHunt', 'ae/p_x2_entC.jsx', function (c) {
  var sz = c.node.size;
  applyWholeRig(c, function (p, b) {
    var f = p < 0.45 ? 1 - ioCubic(p / 0.45) : (p < 0.85 ? 0.42 * Math.sin(PI * (p - 0.45) / 0.4) : 0);
    var s = 1 + 0.08 * f;
    return { ax: b.cx, ay: b.cy, sx: s, sy: s, a: Math.pow(cl(p * 3), 0.7) * (1 - 0.35 * f), blur: Math.min(24, sz * 0.12) * f };
  });
});

/* 65. xgStrobe */
regPost('xgStrobe', 'ae/p_x2_entC.jsx', function (c) {
  var sz = c.node.size, dir = dirOf(c, 45), hot = hotOf(c);
  var poses = [[1.3, 0.34, -0.2], [1.13, -0.16, 0.09], [1, 0, 0]];
  applyWholeRig(c, function (p, b) {
    var x3 = p * 3, k = Math.min(2, Math.floor(x3)), f = x3 - k, ps = poses[k];
    var tintAmt = k < 2 ? 0.5 : 0.9 * Math.exp(-f * 5) * (1 - f);
    var a = k < 2 ? 0.9 * Math.exp(-f * 3.2) * cl(p * 25) : 1;
    return { ax: b.cx, ay: b.cy, sx: ps[0], sy: ps[0], dx: dir * sz * ps[1], dy: sz * ps[2], a: a,
      color: H.mixHex(c.node.color, hot, cl(tintAmt)) };
  });
});

/* 66. xgDoubleVision */
regPost('xgDoubleVision', 'ae/p_x2_entC.jsx', function (c) {
  var sz = c.node.size, vert = !!c.node.vertical, rng = inRange(c);
  applyWholeRig(c, function (p, b) {
    var d = sz * 0.8 * Math.pow(1 - p, 1.5) * Math.cos(2.5 * PI * p);
    return { dx: vert ? 0 : d, dy: vert ? d : 0, a: cl(p * 4) * mix(0.55, 1, H.smoothstep(0.6, 1, p)) };
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs, cut) {
      var placeId = localPlacementNull(graph, ids, cut, c.node, c.comp);
      var rig = graph.add('null', cut.id + ' / ' + c.node.id + ' / Ghost2', placeId, cut.start, rng.end, {});
      insertBeforeLayer(graph, rig, ids[0]);
      ids.forEach(function (srcId) {
        var clone = V.cloneLayer(graph, srcId, 'Double Vision');
        clone.parent = rig; clone.keys = V.copy(graph.byId[srcId].keys);
        insertBeforeLayer(graph, clone.id, ids[0]);
        for (var f = cut.start; f < rng.end; f++) {
          var p = pinAt(c, f), ca = 0.55 * (1 - H.smoothstep(0.7, 1, p)) * cl(p * 4);
          setKey(graph, clone.id, 'alpha', f, ca, 1);
        }
      });
      for (var f = cut.start; f < rng.end; f++) {
        var p = pinAt(c, f), d = -sz * 0.8 * Math.pow(1 - p, 1.5) * Math.cos(2.5 * PI * p);
        graph.key(rig, 'position.x', f, vert ? 0 : d, 1);
        graph.key(rig, 'position.y', f, vert ? -d : 0, 1);
      }
    });
  }
});

/* 67. xgFillDock */
regPost('xgFillDock', 'ae/p_x2_entC.jsx', function (c) {
  var sz = c.node.size, dir = dirOf(c, 51), rng = inRange(c);
  applyWholeRig(c, function (p, b) {
    var q = cl((p - 0.22) / 0.78), k = 1 - E.outBack(q, 1.6);
    return { dx: dir * sz * 0.5 * k, dy: sz * 0.32 * k, a: c.node.fill === false ? cl(q * 4) : cl(q * 5) * mix(0.8, 1, q) };
  });
  if (rng.ok && c.node.fill !== false) {
    post(c, function (graph, ids, gs, cut) {
      var sw = Math.max(1.2, sz * 0.022);
      ids.forEach(function (srcId) {
        var clone = V.cloneLayer(graph, srcId, 'FillDock Outline');
        clone.attrs.fill = false; clone.attrs.stroke = true;
        clone.attrs['stroke.strokeColor'] = c.node.color; clone.attrs['stroke.width'] = sw;
        insertBeforeLayer(graph, clone.id, ids[0]);
        for (var f = cut.start; f < cut.end; f++) {
          var p = pinAt(c, f);
          setKey(graph, clone.id, 'alpha', f, f < rng.end ? cl(p * 7) * (1 - H.smoothstep(0.8, 1, p)) : 0, 1);
        }
      });
    });
  }
});

/* 68. xgColorPour */
regPost('xgColorPour', 'ae/p_x2_entC.jsx', function (c) {
  var up = (Math.floor(rand(seedOf(c), 53, 1) * 2) & 1) === 1, alt = hotOf(c), rng = inRange(c);
  var band = alt === c.sc.accent ? (c.sc.accent2 || c.sc.fg) : (c.sc.accent || c.sc.fg);
  applyWholeRig(c, function (p, b) {
    var s = Math.max(0.05, mix(0.8, 1, E.outBack(cl(p / 0.3), 2)));
    return { ax: b.cx, ay: b.cy, sx: s, sy: s, a: cl(p * 8) };
  });
  if (rng.ok && c.node.fill !== false) {
    post(c, function (graph, ids, gs, cut, parent, options) {
      var placeId = localPlacementNull(graph, ids, cut, c.node, c.comp), b = lineBounds(gs), g = uvBox(c, b);
      var altByF = Object.create(null);
      for (var f = cut.start; f < rng.end; f++) {
        var p = pinAt(c, f), k = cl(ioCubic((p - 0.22) / 0.72) * 1.12);
        var yEdge = up ? mix(b.y1, b.y0, k) : mix(b.y0, b.y1, k);
        var poly = up ? V.polygon(b.x0 - g.big, b.y0 - g.big, b.x1 + g.big, yEdge) : V.polygon(b.x0 - g.big, yEdge, b.x1 + g.big, b.y1 + g.big);
        altByF[f] = k < 1 ? [toScenePoly(graph, placeId, f, poly)] : [];
      }
      ids.forEach(function (srcId) {
        var clone = V.cloneLayer(graph, srcId, 'Pour Alt');
        clone.attrs['material.materialColor'] = alt;
        for (var f = cut.start; f < cut.end; f++) {
          var k = cl(ioCubic((pinAt(c, f) - 0.22) / 0.72) * 1.12);
          setKey(graph, clone.id, 'alpha', f, (f < rng.end && k < 1) ? 1 : 0, 1);
        }
        H.multiClip(graph, clone.id, altByF, false, 'Color pour clip', options);
      });
      var loc = V.local(c, c.node, 'ColorPour'), bh = Math.max(3, c.node.size * 0.08);
      addLocalShape(c, loc, rng, 'Band', G.rect(-b.w / 2, -bh / 2, b.w, bh), { fill: band, alpha: 1 }, function (p) {
        var k = cl(ioCubic((p - 0.22) / 0.72) * 1.12);
        if (k <= 0 || k >= 1) return { alpha: 0 };
        var y = up ? mix(b.y1, b.y0, k) : mix(b.y0, b.y1, k);
        return { 'position.x': b.cx, 'position.y': -y, alpha: 0.9 };
      });
    });
  }
});

/* 69. xgBlockSink */
regPost('xgBlockSink', 'ae/p_x2_entC.jsx', function (c) {
  var sz = c.node.size, dir = dirOf(c, 55), rng = inRange(c), col = H.mixHex(hotOf(c), c.sc.bg || '#101010', 0.3);
  applyWholeRig(c, function (p) { return { a: cl(p * 6) }; });
  if (rng.ok) {
    post(c, function (graph, ids, gs, cut) {
      var placeId = localPlacementNull(graph, ids, cut, c.node, c.comp), layers = 6;
      for (var k = layers; k >= 1; k--) {
        (function (kk) {
          var rig = graph.add('null', cut.id + ' / ' + c.node.id + ' / Block ' + kk, placeId, cut.start, rng.end, {});
          insertBeforeLayer(graph, rig, ids[0]);
          ids.forEach(function (srcId) {
            var clone = V.cloneLayer(graph, srcId, 'Extrude ' + kk);
            clone.parent = rig; clone.attrs['material.materialColor'] = col;
            insertBeforeLayer(graph, clone.id, ids[0]);
            for (var f = cut.start; f < rng.end; f++) {
              var p = pinAt(c, f), L = sz * 1.3 * (1 - oQuart(p)) * cl(p * 5 + 0.25);
              var a = L >= 0.5 ? cl(p * 6) * cl(L / (sz * 0.18)) * (1 - kk / (layers + 1) * 0.65) : 0;
              setKey(graph, clone.id, 'alpha', f, a, 1);
            }
          });
          for (var f = cut.start; f < rng.end; f++) {
            var p = pinAt(c, f), L = sz * 1.3 * (1 - oQuart(p)) * cl(p * 5 + 0.25);
            graph.key(rig, 'position.x', f, dir * L * 0.72 * kk / layers, 1);
            graph.key(rig, 'position.y', f, -(L * 0.7 * kk / layers), 1);
          }
        })(k);
      }
    });
  }
});

/* 70. xgLensFringe */
regPost('xgLensFringe', 'ae/p_x2_entC.jsx', function (c) {
  var cols = [c.sc.ghostA || c.sc.accent, c.sc.ghostB || c.sc.accent2 || c.sc.sub], rng = inRange(c);
  applyWholeRig(c, function (p, b) {
    var k = Math.pow(1 - p, 2), s = 1 + 0.05 * k;
    return { ax: b.cx, ay: b.cy, sx: s, sy: s, a: cl(p * 3) };
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs, cut) {
      var placeId = localPlacementNull(graph, ids, cut, c.node, c.comp), b = lineBounds(gs);
      [0, 1].forEach(function (j) {
        var rig = graph.add('null', cut.id + ' / ' + c.node.id + ' / Fringe ' + j, placeId, cut.start, rng.end, {});
        insertBeforeLayer(graph, rig, ids[0]);
        ids.forEach(function (srcId) {
          var clone = V.cloneLayer(graph, srcId, 'Fringe ' + j);
          clone.parent = rig; clone.attrs['material.materialColor'] = cols[j] || '#ffffff';
          insertBeforeLayer(graph, clone.id, ids[0]);
          for (var f = cut.start; f < rng.end; f++) {
            var p = pinAt(c, f), k = Math.pow(1 - p, 2);
            setKey(graph, clone.id, 'alpha', f, 0.75 * Math.min(1, k * 3) * cl(p * 6), 1);
          }
        });
        for (var f = cut.start; f < rng.end; f++) {
          var p = pinAt(c, f), k = Math.pow(1 - p, 2), s = 1 + (j ? 0.16 : 0.32) * k;
          graph.key(rig, 'position.x', f, b.cx * (1 - s), 1);
          graph.key(rig, 'position.y', f, -b.cy * (1 - s), 1);
          graph.key(rig, 'scale.x', f, s, 1); graph.key(rig, 'scale.y', f, s, 1);
        }
      });
    });
  }
});

/* 71. xgAfterimage */
regPost('xgAfterimage', 'ae/p_x2_entC.jsx', function (c) {
  var hot = hotOf(c), tF = 0.1;
  applyWholeRig(c, function (p, b) {
    if (p < tF) return { ax: b.cx, ay: b.cy, sx: 1.05, sy: 1.05, color: H.mixHex(c.node.color, hot, 0.85), a: cl(p / 0.03) };
    var drop = H.smoothstep(tF, tF + 0.1, p), rise = ioSine((p - 0.28) / 0.72), s = 1 + 0.05 * (1 - drop);
    return { ax: b.cx, ay: b.cy, sx: s, sy: s, color: H.mixHex(c.node.color, hot, 0.85 * (1 - drop)), a: mix(mix(1, 0.14, drop), 1, rise) };
  });
});

/* 72. xgKeyPoses */
regPost('xgKeyPoses', 'ae/p_x2_entC.jsx', function (c) {
  var sz = c.node.size, dir = dirOf(c, 61);
  var K = [[0.26, -1.0, 0.45, -13, 0.7], [0.52, 0.34, -0.3, 8, 1.1], [0.74, -0.14, 0.08, -3.5, 0.95], [1, 0, 0, 0, 1]];
  applyWholeRig(c, function (p, b) {
    var k = 0; while (k < 3 && p >= K[k][0]) k++;
    var t0 = k ? K[k - 1][0] : 0, f = (p - t0) / (K[k][0] - t0), row = K[k];
    var settle = k === 3 ? 0.06 * (1 - oCubic(f / 0.6)) : 0, s = row[4] + settle;
    return { ax: b.cx, ay: b.cy, rot: dir * row[3], sx: s, sy: s, dx: dir * sz * row[1], dy: sz * row[2], a: cl(p * 20) };
  });
});

/* 73. xgRoughCut */
regPost('xgRoughCut', 'ae/p_x2_entC.jsx', function (c) {
  var sz = c.node.size, sd = seedOf(c), rng = inRange(c), col = c.node.color;
  var pencil = H.mixHex(col, c.sc.sub || c.sc.fg, 0.5), W0 = [1, 0.85, 0.7, 0.4, 0.22];
  applyWholeRig(c, function (p, b) {
    var k = Math.min(5, Math.floor(p * 6));
    if (k >= 5) return { a: 1 };
    var w = W0[k], s = 1 + (rand(sd, k, 72) * 2 - 1) * 0.045 * w;
    var a = c.node.fill === false ? [0.45, 0.6, 0.75, 0.9, 1][k] : (k < 3 ? 0.01 : (k === 3 ? 0.45 : 0.8));
    return { ax: b.cx, ay: b.cy, rot: (rand(sd, k, 71) * 2 - 1) * 3 * w, sx: s, sy: s,
      dx: (rand(sd, k, 73) * 2 - 1) * sz * 0.05 * w, dy: (rand(sd, k, 74) * 2 - 1) * sz * 0.05 * w,
      skew: (rand(sd, k, 75) * 2 - 1) * 5 * w, a: cl(p * 14) * a };
  });
  if (rng.ok && c.node.fill !== false) {
    post(c, function (graph, ids, gs, cut) {
      var sw = Math.max(1, sz * 0.02);
      ids.forEach(function (srcId) {
        var clone = V.cloneLayer(graph, srcId, 'Rough Pencil');
        clone.attrs.fill = false; clone.attrs.stroke = true;
        clone.attrs['stroke.strokeColor'] = pencil; clone.attrs['stroke.width'] = sw;
        insertBeforeLayer(graph, clone.id, ids[0]);
        for (var f = cut.start; f < cut.end; f++) {
          var p = pinAt(c, f), k = Math.min(5, Math.floor(p * 6));
          var pa = f < rng.end && k < 5 ? (k < 3 ? [0.6, 0.8, 0.95][k] : 1) * cl(p * 14) : 0;
          setKey(graph, clone.id, 'alpha', f, pa, 1);
        }
      });
    });
  }
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
