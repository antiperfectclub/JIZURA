/* 35 exit recipes from src/11p_x2_exA.js (19) and src/11p_x2_exB.js part 1 (16). */
(function (N, G, C, R, V, S, H) {
'use strict';

var E = R.E, cl = R.clamp, mix = R.mix, TAU = R.T, PI = Math.PI, DEG = PI / 180, rand = N.random;
var HIDE = { hide: true };
var BIG = 5000;

function oCubic(x) { return 1 - Math.pow(1 - cl(x), 3); }
function oQuart(x) { return 1 - Math.pow(1 - cl(x), 4); }
function iQuad(x) { x = cl(x); return x * x; }
function iCubic(x) { x = cl(x); return x * x * x; }
function ioCubic(x) { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function oBack(x, s) { x = cl(x); return x <= 0 ? 0 : x >= 1 ? 1 : E.outBack(x, s); }
function seg(x, a, b) { return cl((x - a) / Math.max(1e-6, b - a)); }
function stg(p, k, spread) { return cl((p - spread * k) / Math.max(0.01, 1 - spread)); }
function win(p, o, spread) { return cl((p - o * spread) / Math.max(0.01, 1 - spread)); }
function rs(a, b, c2, d) { return rand(a, b, c2, d) * 2 - 1; }
function seedOf(c) { return c.node.seed == null ? ((c.cut.source || {}).seed || 1) : c.node.seed; }
function cutSeed(c) { return (c.cut && c.cut.seed) || seedOf(c); }
function cutBit(c, salt) { return rand(cutSeed(c), salt, 991) < 0.5; }
function isBlank(ch) { return /^[\s\u3000]$/.test(ch); }
function cutN(c) { return Array.from(String((c.cut && c.cut.text) || (c.node && c.node.text) || '').replace(/[\s\u3000]/g, '')).length || 1; }
function isKanji(ch) { return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(ch || ''); }
function gpos(g, node) { return [(g.x + (g.vx || 0)) * (node.sx == null ? 1 : node.sx), g.y + (g.vy || 0)]; }
function hotOf(c) {
  var sc = c.sc, col = c.node.color || sc.fg || '#ffffff';
  if (col === sc.accent) return sc.accent2 || sc.fg || '#ffffff';
  return sc.accent || sc.accent2 || sc.fg || '#ffffff';
}
function rot2(x, y, rad) { var cs = Math.cos(rad), sn = Math.sin(rad); return [x * cs - y * sn, x * sn + y * cs]; }

function orders(c, gs) {
  var Np = cutN(c), mi = cl(+c.node.mi || 0, 0, Math.max(0, Np - 1));
  var single = gs.length <= 1 && Np > 1;
  return {
    single: single, N: single ? Np : gs.length,
    idx: function (i) { return single ? mi : i; },
    ci: function (g) { return single ? mi : g.ci; },
    lr: function (i, n) { return single ? (Np > 1 ? mi / (Np - 1) : 0) : (n > 1 ? i / (n - 1) : 0); }
  };
}
function linePos(gs, node) {
  var L = Object.create(null);
  gs.forEach(function (g) {
    if (!L[g.li]) L[g.li] = [];
    L[g.li][g.ci] = gpos(g, node);
  });
  return L;
}
function posAt(row, f) {
  var keys = [];
  for (var i = 0; i < row.length; i++) if (row[i]) keys.push(row[i]);
  var n = keys.length;
  if (!n) return [0, 0];
  if (n === 1) return keys[0];
  var a = cl(Math.floor(f), 0, n - 2), t = f - a, A = keys[a], B = keys[a + 1];
  return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
}

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
function reg(key, source, factory) {
  N.register('exit', key, {
    source: source + ' / exit:' + key, scope: 'glyph', differences: [],
    build: function (c) {
      var fn = factory(c);
      return function (s, g, gs, frame) {
        var env = V.envelope(c, c.node, frame);
        var e = { W: c.comp.width, H: c.comp.height, size: c.node.size, seed: seedOf(c),
          vertical: !!c.node.vertical, M: cl(0.55 + (H.motionAmt(c) * 0.65), 0.5, 1.3), step: Math.floor(env.t * 24 + 1e-6), frame: frame };
        var p = env.pout;
        if (p >= 0.998) { s.a = 0; return; }
        applyState(s, fn(p, g, gs, e), g);
      };
    }
  });
}
function regPost(key, source, setupFn) {
  N.register('exit', key, {
    source: source + ' / exit:' + key, scope: 'node', differences: [],
    build: function (c) { setupFn(c); return function () {}; }
  });
}

function lineBounds(gs) {
  var b = V.bounds(gs);
  return { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1, w: b.w, h: b.h, cx: b.cx, cy: b.cy };
}
function frameOf(c, bx, pad) {
  var v = !!c.node.vertical;
  var x0 = bx.x0 - pad, x1 = bx.x1 + pad, y0 = bx.y0 - pad, y1 = bx.y1 + pad;
  var F = v
    ? { v: true, a0: y0, a1: y1, b0: x0, b1: x1, bb: { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 } }
    : { v: false, a0: x0, a1: x1, b0: y0, b1: y1, bb: { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 } };
  F.len = F.a1 - F.a0; F.cr = F.b1 - F.b0; F.ac = (F.a0 + F.a1) / 2; F.bc = (F.b0 + F.b1) / 2;
  return F;
}
function polyAB(v, a0, b0, a1, b1) { return v ? V.polygon(b0, a0, b1, a1) : V.polygon(a0, b0, a1, b1); }
function PT(v, a, b) { return v ? [b, a] : [a, b]; }
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

function applyExitWindowClip(c, difference, polysFn) {
  var rng = outRange(c);
  if (!rng.ok) return;
  post(c, function (graph, ids, gs, cut, parent, options) {
    var placeId = rootPlaceNull(graph, ids, cut, c.node, c.comp, parent);
    var b = lineBounds(gs), byFrame = Object.create(null);
    for (var f = rng.start; f < cut.end; f++) {
      var p = poutAt(c, f);
      if (p <= 0) continue;
      if (p >= 0.998) {
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

function applyExitSliceTwins(c, slicesFn) {
  var rng = outRange(c);
  if (!rng.ok) return;
  post(c, function (graph, ids, gs, cut, parent, options) {
    var placeId = rootPlaceNull(graph, ids, cut, c.node, c.comp, parent);
    var b = lineBounds(gs), specs = slicesFn(b);
    ids.forEach(function (tid) {
      for (var f = rng.start; f < cut.end; f++) setKey(graph, tid, 'alpha', f, 0, 2);
    });
    specs.forEach(function (sp, idx) {
      var sliceRig = graph.add('null', cut.id + ' / ' + c.node.id + ' / ExitSlice ' + idx, placeId, rng.start, rng.end, {});
      insertBeforeLayer(graph, sliceRig, ids[0]);
      var byFrame = Object.create(null), twinIds = [];
      ids.forEach(function (srcId) {
        var src = graph.byId[srcId];
        var cid = graph.add(src.type, src.name + ' / XS' + idx, sliceRig, rng.start, rng.end,
          V.copy(src.attrs), src.commands ? V.copy(src.commands) : null);
        var dst = graph.byId[cid];
        Object.keys(src.keys).forEach(function (attr) {
          var t = {};
          for (var f = rng.start; f < rng.end; f++) if (src.keys[attr][f]) t[f] = V.copy(src.keys[attr][f]);
          if (Object.keys(t).length) dst.keys[attr] = t;
        });
        insertBeforeLayer(graph, cid, ids[0]);
        twinIds.push(cid);
      });
      for (var f = rng.start; f < rng.end; f++) {
        var p = poutAt(c, f), st2 = sp.sample(p, f);
        var dx = st2.dx || 0, dy = st2.dy || 0, rot = st2.rot || 0, a = st2.a == null ? 1 : cl(st2.a);
        var sx = Math.max(0.02, st2.sx == null ? 1 : st2.sx), sy = Math.max(0.02, st2.sy == null ? 1 : st2.sy);
        if (rot) {
          var px = st2.px == null ? b.cx : st2.px, py = st2.py == null ? b.cy : st2.py;
          var rad = rot * DEG, cs = Math.cos(rad), sn = Math.sin(rad);
          graph.key(sliceRig, 'position.x', f, dx + px - (px * cs - (-py) * sn), 1);
          graph.key(sliceRig, 'position.y', f, -dy - py - (px * sn + (-py) * cs), 1);
          graph.key(sliceRig, 'rotation', f, -rot, 1);
        } else {
          graph.key(sliceRig, 'position.x', f, dx, 1);
          graph.key(sliceRig, 'position.y', f, -dy, 1);
        }
        if (sx !== 1) graph.key(sliceRig, 'scale.x', f, sx, 1);
        if (sy !== 1) graph.key(sliceRig, 'scale.y', f, sy, 1);
        twinIds.forEach(function (cid) {
          var cn = graph.byId[cid];
          setKey(graph, cid, 'alpha', f, getKeyVal(cn, 'alpha', f, 1) * a, 1);
        });
        var polys = sp.clip(p, b, f) || [];
        var mPlace = S.matrix(graph, placeId, f), mSlice = S.matrix(graph, sliceRig, f);
        byFrame[f] = polys.filter(function (q) { return q && q.length >= 3; }).map(function (q) {
          var mtx = sp.fixed ? mPlace : mSlice;
          return q.map(function (pt) { return S.point(mtx, [pt[0], -pt[1]]); });
        });
      }
      twinIds.forEach(function (cid) { H.multiClip(graph, cid, byFrame, false, 'Exit slice', options); });
    });
  });
}

/* =====================================================================
   PART 1: src/11p_x2_exA.js (19)
   ===================================================================== */

reg('xhKanaFirst', 'src/11p_x2_exA.js', function (c) {
  var gs0 = V.glyphs(c, c.node), O = orders(c, gs0);
  var heavyCh = function (ch) { return isKanji(ch) || /[A-Z0-9]/.test(ch || ''); };
  var all = Array.from(String((c.cut && c.cut.text) || c.node.text || '')).filter(function (ch) { return !isBlank(ch) && ch !== '\n'; });
  var nh = all.filter(heavyCh).length, natural = nh > 0 && nh < all.length;
  return function (p, g, gs, e) {
    var heavy = natural ? heavyCh(g.ch) : (O.idx(g.i) % 3 === 1);
    if (!heavy) {
      var q1 = stg(seg(p, 0, 0.55), O.lr(g.i, gs.length), 0.45);
      if (q1 <= 0) return null; if (q1 >= 1) return HIDE;
      return { dy: iQuad(q1) * e.size * 0.3, s: 1 - 0.2 * q1, a: 1 - iQuad(q1) };
    }
    var q2 = stg(seg(p, 0.5, 1), O.lr(g.i, gs.length), 0.4);
    if (q2 <= 0) return null; if (q2 >= 1) return HIDE;
    var up = Math.sin(seg(q2, 0, 0.35) * PI / 2) * 0.16, dn = iCubic(seg(q2, 0.3, 1));
    return { s: Math.max(0.01, (1 + up) * (1 - dn)), a: 1 - iCubic(seg(q2, 0.6, 1)) };
  };
});

reg('xhCombOut', 'src/11p_x2_exA.js', function (c) {
  var gs0 = V.glyphs(c, c.node), O = orders(c, gs0), isx = c.node.sx == null ? 1 : c.node.sx, isy = 1;
  return function (p, g, gs) {
    var odd = O.ci(g) % 2 === 1;
    var q = stg(odd ? seg(p, 0.38, 1) : seg(p, 0, 0.62), O.lr(g.i, gs.length), 0.3);
    if (q <= 0) return null; if (q >= 1) return HIDE;
    var d = ioCubic(q) * 1.3, sg = odd ? 1 : -1;
    if (c.node.vertical && !g.r90) return { dx: -sg * d * g.w * isx, clipX: sg > 0 ? [-0.65 + d, 0.65] : [-0.65, 0.65 - d] };
    if (g.r90) return { dx: -sg * d * g.w * isx, a: 1 - iQuad(q) };
    return { dy: sg * d * g.h * isy, clipY: sg > 0 ? [-0.65, 0.65 - d] : [-0.65 + d, 0.65] };
  };
});

reg('xhRollCall', 'src/11p_x2_exA.js', function (c) {
  var gs0 = V.glyphs(c, c.node), O = orders(c, gs0), sd = O.single ? cutSeed(c) : seedOf(c), hot = hotOf(c), Np = Math.max(1, O.N);
  function rankAt(k) {
    var r = 0, v = rand(sd, k, 71);
    for (var j = 0; j < Np; j++) if (rand(sd, j, 71) < v) r++;
    return Np > 1 ? r / (Np - 1) : 0;
  }
  return function (p, g) {
    var q = stg(p, rankAt(O.idx(g.i)), 0.72);
    if (q <= 0) return null; if (q >= 1) return HIDE;
    var up = oBack(seg(q, 0, 0.45), 2.4), dn = iCubic(seg(q, 0.55, 1));
    return { s: 1 + up * 0.24, sy: Math.max(0.02, 1 - dn), color: hot };
  };
});

reg('xhCeiling', 'src/11p_x2_exA.js', function (c) {
  var gs0 = V.glyphs(c, c.node), O = orders(c, gs0), r = (c.node.rotation || 0) * DEG, cr = Math.cos(r), sr = Math.sin(r);
  var crN = Math.cos(-r), srN = Math.sin(-r);
  return function (p, g, gs) {
    var q = stg(p, O.lr(g.i, gs.length), 0.5);
    if (q <= 0) return null; if (q >= 1) return HIDE;
    var gp = gpos(g, c.node), gh = g.h, Y = c.node.y + gp[0] * sr + gp[1] * cr;
    var flat = 0.2, rise = Math.max(0, Y - gh * flat * 0.5 - 2);
    var sq = seg(q, 0, 0.14), fl = iQuad(seg(q, 0.14, 0.4)), hit = seg(q, 0.4, 0.52), out = iQuad(seg(q, 0.62, 1));
    var sy, sx;
    if (q < 0.14) { sy = 1 - 0.22 * Math.sin(sq * PI / 2); sx = 1 + 0.1 * sq; }
    else if (q < 0.4) { sy = mix(0.78, 1.5, oCubic(seg(q, 0.14, 0.24))); sx = 0.86; }
    else { sy = mix(1.5, flat, oCubic(hit * 2.5)) + Math.sin(hit * PI) * 0.06; sx = mix(0.86, 1.4, oBack(hit, 2)); }
    var d = (q < 0.14 ? (1 - sy) * gh * 0.5 : -rise * fl) - out * gh * 0.45;
    return { dx: -d * srN, dy: d * crN, sx: sx, sy: sy, a: 1 - iCubic(seg(q, 0.7, 1)) };
  };
});

reg('xhFlick', 'src/11p_x2_exA.js', function (c) {
  var gs0 = V.glyphs(c, c.node), O = orders(c, gs0), sd = seedOf(c), dir = rand(sd, 81, 5) < 0.5 ? -1 : 1;
  return function (p, g, gs, e) {
    var k = dir > 0 ? 1 - O.lr(g.i, gs.length) : O.lr(g.i, gs.length), q = stg(p, k, 0.6);
    if (q <= 0) return null; if (q >= 1) return HIDE;
    if (q < 0.2) { var a = Math.sin(seg(q, 0, 0.2) * PI / 2); return { dx: -dir * a * e.size * 0.07, rot: -dir * a * 9, sx: 1 - a * 0.08 }; }
    var u = seg(q, 0.2, 1), ev = oQuart(u), lift = 0.6 + rand(sd, g.i, 82) * 0.9, dist = Math.max(e.W, e.H) * 0.42 * e.M;
    return { dx: dir * (ev * dist - (1 - u) * e.size * 0.07 * (u < 0.1 ? 1 : 0)), dy: (-lift * u + 0.9 * u * u) * e.size * 1.6,
      rot: dir * (ev * 620 - 9 * (1 - u)), s: 1 - 0.72 * ev, a: 1 - iQuad(seg(u, 0.45, 1)) };
  };
});

reg('xhConveyor', 'src/11p_x2_exA.js', function (c) {
  var gs0 = V.glyphs(c, c.node), O = orders(c, gs0), L = linePos(gs0, c.node), per = Math.max(1, Math.ceil(O.N / 7));
  var steps = Math.ceil(O.N / per) + 1.4;
  return function (p, g, gs, e) {
    var x = p * steps, k = Math.floor(x), f = x - k, s = (k + oCubic(seg(f, 0, 0.55))) * per;
    function drop(t, ax, ay) {
      var u = t / per;
      var vx = e.vertical ? Math.min(1.1, u * 1.6) * e.size * 0.95 : -u * e.size * 0.5;
      var vy = e.vertical ? -Math.min(u, 0.5) * e.size * 0.5 + u * u * e.size * 2.4 : u * u * e.size * 2.4;
      return { dx: ax + vx, dy: ay + vy, rot: (e.vertical ? 1 : -1) * Math.min(1.4, u) * 80, a: 1 - iQuad(seg(u, 0.35, 1.3)) };
    }
    if (O.single) {
      var t = s - O.idx(g.i);
      if (t <= 0) return f < 0.55 && k > 0 ? { dx: -Math.sin(seg(f, 0, 0.55) * PI) * e.size * 0.05 } : null;
      return t >= per * 1.3 ? HIDE : drop(t, 0, 0);
    }
    var row = L[g.li] || [], gp = row[g.ci] || gpos(g, c.node), head = row[0] || gp, t2 = s - g.ci;
    if (t2 <= 0) { var q = posAt(row, s); return { dx: head[0] - q[0], dy: head[1] - q[1] }; }
    if (t2 >= per * 1.3) return HIDE;
    return drop(t2, head[0] - gp[0], head[1] - gp[1]);
  };
});

reg('xhGather', 'src/11p_x2_exA.js', function (c) {
  var gs0 = V.glyphs(c, c.node), O = orders(c, gs0), L = linePos(gs0, c.node), sd = seedOf(c);
  return function (p, g, gs, e2) {
    if (p >= 1) return HIDE;
    var fl = iCubic(seg(p, 0.72, 1)), flipSx = Math.max(0.02, 1 - fl), flipA = 1 - iCubic(seg(p, 0.86, 1));
    if (O.single) { var qs = stg(p, O.lr(g.i, gs.length), 0.6); return qs <= 0 ? null : qs >= 1 ? HIDE : { sx: Math.max(0.02, 1 - iCubic(qs)), rot: qs * 14 }; }
    var row = L[g.li] || [], gp = row[g.ci] || gpos(g, c.node), head = row[0] || gp, k = g.n > 1 ? g.ci / (g.n - 1) : 0;
    var q = g.ci === 0 ? 0 : stg(seg(p, 0, 0.72), k, 0.62);
    if (q <= 0 && fl <= 0) return null;
    var e = ioCubic(q), arc = Math.sin(e * PI) * e2.size * 0.22;
    var tx = head[0] + rs(sd, g.i, 91, 1) * e2.size * 0.05 - gp[0], ty = head[1] + rs(sd, g.i, 92, 1) * e2.size * 0.05 - gp[1];
    return { dx: tx * e + (e2.vertical ? arc : 0), dy: ty * e + (e2.vertical ? 0 : -arc) - fl * e2.size * 0.25,
      rot: rs(sd, g.i, 93, 1) * 9 * e, sx: flipSx, a: flipA };
  };
});

reg('xhEatAlong', 'src/11p_x2_exA.js', function (c) {
  var gs0 = V.glyphs(c, c.node), O = orders(c, gs0), L = linePos(gs0, c.node);
  function gulp(q) { return { s: Math.max(0.01, (1 + Math.sin(seg(q, 0, 0.45) * PI / 2) * 0.3) * (1 - iCubic(seg(q, 0.35, 1)))) }; }
  return function (p, g, gs) {
    if (O.single) { var qs = stg(p, O.lr(g.i, gs.length), 0.6); return qs <= 0 ? null : qs >= 1 ? HIDE : gulp(qs); }
    var row = L[g.li] || [], nn = g.n, f = seg(p, 0, 0.78) * (nn - 1);
    var bulge = g.ci > 0 ? Math.sin(seg(f - (g.ci - 1), 0.35, 1.25) * PI) * 0.26 : 0;
    if (g.ci === nn - 1) {
      var q = seg(p, 0.74, 1);
      if (q >= 1) return HIDE;
      var grow = nn > 1 ? seg(f / (nn - 1), 0, 1) * 0.14 : 0;
      if (q <= 0) return bulge || grow ? { s: 1 + bulge + grow } : null;
      var o = gulp(q); o.s *= 1 + grow; return o;
    }
    var t = f - g.ci;
    if (t >= 1) return HIDE;
    if (t <= 0) return bulge ? { s: 1 + bulge } : null;
    var e = iQuad(t), gp = row[g.ci] || gpos(g, c.node), T = row[g.ci + 1] || gp;
    return { dx: (T[0] - gp[0]) * e, dy: (T[1] - gp[1]) * e, s: (1 + bulge) * (1 - 0.6 * e), a: 1 - iCubic(t) };
  };
});

reg('xhShuffle', 'src/11p_x2_exA.js', function (c) {
  var gs0 = V.glyphs(c, c.node), O = orders(c, gs0), L = linePos(gs0, c.node);
  return function (p, g, gs, e2) {
    if (p >= 1) return HIDE;
    var e1 = ioCubic(seg(p, 0, 0.42)), e2v = ioCubic(seg(p, 0.4, 0.8)), end = iCubic(seg(p, 0.62, 1));
    var sg = O.ci(g) % 2 ? 1 : -1, arc = (Math.sin(e1 * PI) + Math.sin(e2v * PI) * 0.8) * e2.size * 0.5 * sg;
    var tailS = Math.max(0.01, 1 - end * 0.7), tailA = (1 - 0.3 * e1) * (1 - end);
    if (O.single || g.n < 2) {
      return { dx: e2.vertical ? -arc : 0, dy: e2.vertical ? 0 : arc, s: tailS, a: tailA, rot: sg * (e1 + e2v) * 25 };
    }
    var row = L[g.li] || [], n = g.n, s0 = g.ci, s1 = s0 ^ 1; if (s1 >= n) s1 = s0;
    var s2 = s1 % 2 ? s1 + 1 : s1 - 1; if (s2 < 0 || s2 >= n) s2 = s1;
    var A = row[s0] || gpos(g, c.node), B = row[s1] || A, Cv = row[s2] || B;
    var x = mix(mix(A[0], B[0], e1), Cv[0], e2v), y = mix(mix(A[1], B[1], e1), Cv[1], e2v);
    return { dx: x - A[0] + (e2.vertical ? -arc : 0), dy: y - A[1] + (e2.vertical ? 0 : arc), s: tailS, a: tailA };
  };
});

reg('xhShutters', 'src/11p_x2_exA.js', function (c) {
  var gs0 = V.glyphs(c, c.node), O = orders(c, gs0), sd = O.single ? cutSeed(c) : seedOf(c);
  return function (p, g) {
    var k = O.idx(g.i), q = stg(p, rand(sd, k, 101), 0.55);
    if (q <= 0) return null; if (q >= 1) return HIDE;
    var w = 0.62 * (1 - ioCubic(seg(q, 0, 0.8)) * 0.94) * (1 - iQuad(seg(q, 0.8, 1)));
    if (w <= 0.004) return HIDE;
    return k % 2 ? { clipY: [-w, w] } : { clipX: [-w, w] };
  };
});

reg('xhConcertina', 'src/11p_x2_exA.js', function (c) {
  var gs0 = V.glyphs(c, c.node), O = orders(c, gs0), L = linePos(gs0, c.node), isx = c.node.sx == null ? 1 : c.node.sx, isy = 1;
  return function (p, g, gs) {
    if (p >= 1) return HIDE;
    var shut = iQuad(seg(p, 0.5, 0.94));
    var e = ioCubic(stg(seg(p, 0, 0.6), 1 - O.lr(g.i, gs.length), 0.25)), sg = O.ci(g) % 2 ? 1 : -1, thin = Math.max(0.03, 1 - e * 0.88);
    var o = { a: 1 - iCubic(seg(p, 0.85, 1)) };
    if (!O.single && L[g.li]) {
      var row = L[g.li], gp = row[g.ci] || gpos(g, c.node), H0 = row[0] || gp, half = (c.node.vertical ? g.h * isy : g.w * isx) * 0.5 * (1 - thin);
      o.dx = (H0[0] - gp[0]) * e * 0.9 - (c.node.vertical ? 0 : (g.ci === 0 ? half : 0));
      o.dy = (H0[1] - gp[1]) * e * 0.9 - (c.node.vertical ? (g.ci === 0 ? half : 0) : 0);
    }
    if (c.node.vertical && !g.r90) { o.sy = thin; o.rot = sg * e * 10; o.sx = Math.max(0.02, 1 - shut); }
    else { o.sx = thin; o.skew = sg * e * 30; o.sy = Math.max(0.02, 1 - shut); }
    return o;
  };
});

reg('xhBarcode', 'src/11p_x2_exA.js', function (c) {
  var gs0 = V.glyphs(c, c.node), O = orders(c, gs0), sd = O.single ? cutSeed(c) : seedOf(c), vert = !!c.node.vertical;
  return function (p, g, gs) {
    var k = O.lr(g.i, gs.length), id = O.idx(g.i);
    var a = stg(seg(p, 0, 0.55), k, 0.5), b = stg(seg(p, 0.5, 1), k, 0.55);
    if (a <= 0) return null; if (b >= 1) return HIDE;
    var wk = 0.07 + 0.2 * rand(sd, id, 121) * rand(sd, id, 122) + (rand(sd, id, 123) < 0.3 ? 0.14 : 0);
    var bar = a >= 0.5, thin = bar ? mix(0.34, wk, oCubic(seg(a, 0.5, 1))) : mix(1, 0.3, iQuad(seg(a, 0, 0.5)));
    var lng = (bar ? mix(0.9, 1.12, oCubic(seg(a, 0.5, 1))) : 1) * Math.max(0.02, 1 - ioCubic(b));
    var cell = vert ? g.w : g.h, off = (bar ? 1.12 : 1) * ioCubic(b) * cell * 0.5;
    var o = vert ? { sy: thin, sx: lng, dx: -off } : { sx: thin, sy: lng, dy: off };
    if (bar) { o.ch = '\u25a0'; o.s = 1 / (g.fs || 1); if (g.r90) o.rot = -90; }
    return o;
  };
});

reg('xhMorse', 'src/11p_x2_exA.js', function (c) {
  var gs0 = V.glyphs(c, c.node), O = orders(c, gs0), sd = O.single ? cutSeed(c) : seedOf(c), hot = hotOf(c), vert = !!c.node.vertical;
  return function (p, g, gs) {
    var k = O.lr(g.i, gs.length), id = O.idx(g.i);
    var a = stg(seg(p, 0, 0.5), k, 0.5), b = stg(seg(p, 0.5, 1), k, 0.6);
    if (a <= 0) return null; if (b >= 1) return HIDE;
    if (a < 0.5) return { s: Math.max(0.05, 1 - iQuad(a * 2) * 0.9), a: 1 - iQuad(a * 2) * 0.5 };
    if (b > 0.45 && b < 0.72) return HIDE;
    var dash = rand(sd, id, 131) < 0.42, u = oBack(seg(a, 0.5, 1), 2.2), fs = 1 / (g.fs || 1);
    var o = { ch: '\u25cf', color: hot, s: 0.24 * u * fs * (b >= 0.72 ? 0.8 : 1), rot: g.r90 ? -90 : 0 };
    if (dash) { if (vert) o.sy = 3.1; else o.sx = 3.1; }
    return o;
  };
});

reg('xhFullStop', 'src/11p_x2_exA.js', function (c) {
  var gs0 = V.glyphs(c, c.node), O = orders(c, gs0), last = -1;
  gs0.forEach(function (g) { if (!isBlank(g.ch)) last = g.i; });
  return function (p, g, gs, e) {
    var isLast = O.single ? O.idx(g.i) >= O.N - 1 : g.i === last;
    if (!isLast) {
      var q = stg(seg(p, 0, 0.62), O.lr(g.i, gs.length), 0.55);
      if (q <= 0) return null; if (q >= 1) return HIDE;
      var ev = iQuad(q);
      return { s: Math.max(0.01, 1 - ev), dy: ev * g.h * 0.42, a: 1 - iCubic(q) };
    }
    if (p >= 1) return HIDE;
    var fall = iQuad(seg(p, 0.84, 1)), dyEnd = fall * e.size * 0.55, aEnd = 1 - fall;
    if ('\u3002\uff0e.'.indexOf(g.ch) >= 0) return p > 0.84 ? { dy: dyEnd, a: aEnd } : null;
    var a = seg(p, 0.42, 0.6);
    if (a <= 0) return null;
    if (a < 1) { var ev2 = iQuad(a); return { s: Math.max(0.01, 1 - ev2), dy: ev2 * g.h * 0.42 }; }
    var latin = /^[A-Za-z0-9]$/.test(g.ch), u = oBack(seg(p, 0.6, 0.72), 2.6);
    var o = { ch: latin ? '.' : '\u3002', s: Math.max(0.01, u) / (g.fs || 1), dx: 0, dy: dyEnd, a: aEnd };
    if (e.vertical && !latin) { o.dx += e.size * 0.3; o.dy -= e.size * 0.3; }
    if (g.r90) o.rot = -90;
    return o;
  };
});

regPost('xhPieceStrata', 'src/11p_x2_exA.js', function (c) {
  var sz = c.node.size, mk = cl(0.55 + H.motionAmt(c) * 0.65, 0.5, 1.3);
  applyExitSliceTwins(c, function (b) {
    var rows = [];
    for (var row = 0; row < 5; row++) {
      (function (r) {
        rows.push({
          fixed: false,
          sample: function (p) {
            var u = seg(p, (r / 4) * 0.42, (r / 4) * 0.42 + 0.58), e = iCubic(u);
            return { dx: (r % 2 ? 1 : -1) * e * sz * 1.7 * mk, dy: 0, sx: 1 + e * 1.3, a: 1 - iQuad(seg(u, 0.35, 1)) };
          },
          clip: function () {
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

regPost('xhPieceThin', 'src/11p_x2_exA.js', function (c) {
  var sd = seedOf(c), sz = c.node.size;
  applyExitSliceTwins(c, function (b) {
    var cols = [];
    for (var row = 0; row < 4; row++) {
      (function (r) {
        var big = (r / 3) * 0.45 + rand(sd, r, 141) * 0.12;
        cols.push({
          fixed: false,
          sample: function (p) {
            var u = seg(p, big, big + 0.42), s = Math.max(0.02, 1 - ioCubic(u));
            return { sx: s, sy: s, a: u >= 1 ? 0 : 1 };
          },
          clip: function () {
            var x0 = b.x0 + (r / 4) * b.w - (r === 0 ? sz * 0.3 : 0);
            var x1 = b.x0 + ((r + 1) / 4) * b.w + (r === 3 ? sz * 0.3 : 0.6);
            return [V.polygon(x0, b.y0 - sz * 2, x1, b.y1 + sz * 2)];
          }
        });
      })(row);
    }
    return cols;
  });
});

regPost('xhPieceSpin', 'src/11p_x2_exA.js', function (c) {
  var sd = seedOf(c), sz = c.node.size;
  applyExitSliceTwins(c, function (b) {
    var qds = [[0, 0, -1, -1], [1, 0, 1, -1], [0, 1, -1, 1], [1, 1, 1, 1]], specs = [];
    qds.forEach(function (qd, idx) {
      var d = rand(sd, idx, 151) * 0.22, dir = (idx % 2) ? 1 : -1;
      specs.push({
        fixed: false,
        sample: function (p) {
          var u = seg(p, d, d + 0.78);
          if (u <= 0) return {};
          var out = iQuad(u) * sz * 0.22, sc = Math.max(0.02, 1 - iCubic(seg(u, 0.35, 1)));
          return { dx: qd[2] * out * 0.7, dy: qd[3] * out * 0.7, rot: dir * u * u * 760, sx: sc, sy: sc, a: 1 - iCubic(seg(u, 0.6, 1)) };
        },
        clip: function () {
          var x0 = qd[0] === 0 ? b.x0 - sz : b.cx, x1 = qd[0] === 0 ? b.cx + 0.4 : b.x1 + sz;
          var y0 = qd[1] === 0 ? b.y0 - sz : b.cy, y1 = qd[1] === 0 ? b.cy + 0.4 : b.y1 + sz;
          return [V.polygon(x0, y0, x1, y1)];
        }
      });
    });
    return specs;
  });
});

regPost('xhPieceHeap', 'src/11p_x2_exA.js', function (c) {
  var sd = seedOf(c), sz = c.node.size;
  applyExitSliceTwins(c, function (b) {
    var specs = [];
    for (var j = 0; j < 4; j++) {
      (function (jj) {
        var cy = (jj + 0.5) / 4 - 0.5, t0 = cl(0.5 - cy) * 0.3;
        var dy0 = (0.44 - cy) * sz - rand(sd, jj, 161) * sz * 0.1, dx0 = rs(sd, jj, 162, 1) * sz * 0.16;
        var rotMax = rs(sd, jj, 163, 1) * 120;
        specs.push({
          fixed: false,
          sample: function (p) {
            if (p >= 1) return { a: 0 };
            var u = seg(p, t0, t0 + 0.3), sink = iQuad(seg(p, 0.68, 1));
            if (u <= 0) return {};
            var e = iQuad(u), land = seg(p, t0 + 0.3, t0 + 0.42);
            var hop = u >= 1 && land < 1 ? Math.sin(land * PI) * sz * 0.05 : 0;
            var s = 1 - sink * 0.4;
            return { dx: dx0 * e, dy: dy0 * e - hop + sink * sz * 0.3, rot: rotMax * e, sx: s, sy: s, a: 1 - sink };
          },
          clip: function () {
            var y0 = b.y0 + (jj / 4) * b.h - (jj === 0 ? sz * 0.3 : 0);
            var y1 = b.y0 + ((jj + 1) / 4) * b.h + (jj === 3 ? sz * 0.3 : 0.6);
            return [V.polygon(b.x0 - sz * 2, y0, b.x1 + sz * 2, y1)];
          }
        });
      })(j);
    }
    return specs;
  });
});

regPost('xhPieceParts', 'src/11p_x2_exA.js', function (c) {
  var sz = c.node.size, mk = cl(0.55 + H.motionAmt(c) * 0.65, 0.5, 1.3), far = Math.max(c.comp.width, c.comp.height) * 0.4 * mk;
  applyExitSliceTwins(c, function (b) {
    return [-1, 1].map(function (side) {
      return {
        fixed: false,
        sample: function (p) {
          var d = oCubic(seg(p, 0, 0.32)) * sz * 0.13 + iCubic(seg(p, 0.42, 1)) * far;
          return { dx: side * d, sx: 1 + iCubic(seg(p, 0.42, 1)) * 1.2, a: 1 - iQuad(seg(p, 0.55, 1)) };
        },
        clip: function () {
          return [side < 0 ? V.polygon(b.x0 - sz, b.y0 - sz, b.cx + 0.4, b.y1 + sz) : V.polygon(b.cx, b.y0 - sz, b.x1 + sz, b.y1 + sz)];
        }
      };
    });
  });
});

/* =====================================================================
   PART 2: src/11p_x2_exB.js first 16 (xiCentreOut .. xiPistons)
   ===================================================================== */

function barW(c) { return Math.max(3, c.node.size * 0.045); }

regPost('xiCropTurns', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, acc = hotOf(c), th = barW(c), rng = outRange(c);
  function cropAt(p, bx) {
    var F = frameOf(c, bx, sz * 0.3), u = p * 11, n = [0, 0, 0, 0];
    for (var s = 0; s < 11; s++) n[s % 4] += ioCubic(seg(u - s, 0, 0.8));
    var a0 = mix(F.a0, F.ac, n[0] / 3), b0 = mix(F.b0, F.bc, n[1] / 3), a1 = mix(F.a1, F.ac, n[2] / 3), b1 = mix(F.b1, F.bc, n[3] / 3);
    return { F: F, u: u, a0: a0, b0: b0, a1: a1, b1: b1 };
  }
  applyExitWindowClip(c, false, function (p, bx) {
    var st = cropAt(p, bx);
    if (st.a1 - st.a0 < 0.5 || st.b1 - st.b0 < 0.5) return [];
    return [polyAB(v, st.a0, st.b0, st.a1, st.b1)];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var bx = lineBounds(gs), loc = V.local(c, c.node, 'XiCropBar');
      addLocalShape(c, loc, rng, 'CropTick', G.rect(0, 0, 1, 1), { fill: acc, alpha: 0 }, function (p) {
        var st = cropAt(p, bx);
        if (st.a1 - st.a0 < 0.5 || st.b1 - st.b0 < 0.5) return { alpha: 0 };
        var s = Math.floor(st.u), j = s % 4, fr = st.u - s;
        if (fr >= 0.86) return { alpha: 0 };
        var xa, ya, w, h;
        if (j === 0) { xa = st.a0 - th; ya = st.b0; w = th; h = st.b1 - st.b0; }
        else if (j === 1) { xa = st.a0; ya = st.b0 - th; w = st.a1 - st.a0; h = th; }
        else if (j === 2) { xa = st.a1; ya = st.b0; w = th; h = st.b1 - st.b0; }
        else { xa = st.a0; ya = st.b1; w = st.a1 - st.a0; h = th; }
        return v ? { 'position.x': ya, 'position.y': -xa, 'scale.x': Math.max(1, h), 'scale.y': -Math.max(1, w), alpha: 1 }
          : { 'position.x': xa, 'position.y': -ya, 'scale.x': Math.max(1, w), 'scale.y': -Math.max(1, h), alpha: 1 };
      });
    });
  }
});

regPost('xiFinder', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, acc = hotOf(c), lw = Math.max(2, sz * 0.028), rev = cutBit(c, 5), rng = outRange(c);
  function winAt(p, bx) {
    var F = frameOf(c, bx, sz * 0.3), len = F.len, hb = F.cr / 2;
    var wl = Math.min(Math.max(sz * 0.95, len * 0.22), len * 0.55);
    var q1 = ioCubic(seg(p, 0, 0.3)), q2 = ioCubic(seg(p, 0.3, 0.78)), q3 = iCubic(seg(p, 0.78, 1));
    var s0 = F.a0 + (len - wl) * q2 + wl * q3, s1 = mix(F.a1, F.a0 + wl, q1) + (len - wl) * q2 + wl * q3;
    if (rev) { var t = s0; s0 = F.a0 + F.a1 - s1; s1 = F.a0 + F.a1 - t; }
    var h = hb * (1 - q3), b0 = F.bc - h, b1 = F.bc + h;
    return { s0: s0, s1: s1, b0: b0, b1: b1, h: h };
  }
  applyExitWindowClip(c, false, function (p, bx) {
    var w = winAt(p, bx);
    if (w.h < 0.4 || w.s1 - w.s0 < 0.4) return [];
    return [polyAB(v, w.s0, w.b0, w.s1, w.b1)];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var bx = lineBounds(gs), loc = V.local(c, c.node, 'XiFinder'), g = lw * 0.5;
      var corners = [[0, 1, 0, 1], [1, -1, 0, 1], [0, 1, 1, -1], [1, -1, 1, -1]];
      corners.forEach(function (sp, idx) {
        addLocalShape(c, loc, rng, 'Bracket_' + idx, G.rect(0, 0, 1, 1), { stroke: acc, width: lw, alpha: 0 }, function (p) {
          var w = winAt(p, bx), a = seg(p, 0, 0.14) * (1 - seg(p, 0.93, 1));
          if (w.h < 0.4 || w.s1 - w.s0 < 0.4 || a <= 0.01) return { alpha: 0 };
          var m = Math.min(sz * 0.24, (w.s1 - w.s0) * 0.3, w.h * 0.7);
          var ca = sp[0] ? w.s1 + g : w.s0 - g, cb = sp[2] ? w.b1 + g : w.b0 - g;
          var x0 = sp[1] > 0 ? ca : ca - m, y0 = sp[3] > 0 ? cb : cb - m;
          return v ? { 'position.x': y0, 'position.y': -x0, 'scale.x': Math.max(1, m), 'scale.y': -Math.max(1, m), alpha: a }
            : { 'position.x': x0, 'position.y': -y0, 'scale.x': Math.max(1, m), 'scale.y': -Math.max(1, m), alpha: a };
        });
      });
    });
  }
});

regPost('xiCounterWipe', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, th = barW(c), acc = hotOf(c), rng = outRange(c);
  applyExitWindowClip(c, false, function (p, bx) {
    var F = frameOf(c, bx, sz * 0.3), e1 = ioCubic(seg(p, 0, 0.84)), e2 = ioCubic(seg(p, 0.16, 1));
    var x1 = mix(F.a0, F.a1, e1), x2 = mix(F.a1, F.a0, e2), out = [];
    if (e1 < 1) out.push(polyAB(v, x1, F.b0 - BIG, F.a1 + BIG, F.bc));
    if (e2 < 1) out.push(polyAB(v, F.a0 - BIG, F.bc, x2, F.b1 + BIG));
    return out;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var bx = lineBounds(gs), F = frameOf(c, bx, sz * 0.3), loc = V.local(c, c.node, 'XiCounterWipe');
      var i0 = F.b0 + sz * 0.16, i1 = F.b1 - sz * 0.16;
      [0, 1].forEach(function (idx) {
        addLocalShape(c, loc, rng, 'Bar_' + idx, v ? G.rect(0, 0, Math.max(1, (idx === 0 ? F.bc - i0 : i1 - F.bc)), th) : G.rect(0, 0, th, Math.max(1, (idx === 0 ? F.bc - i0 : i1 - F.bc))),
          { fill: acc, alpha: 0 }, function (p) {
            var ev = idx === 0 ? ioCubic(seg(p, 0, 0.84)) : ioCubic(seg(p, 0.16, 1));
            if (ev <= 0 || ev >= 1) return { alpha: 0 };
            var x = idx === 0 ? mix(F.a0, F.a1, ev) - th : mix(F.a1, F.a0, ev);
            var b = idx === 0 ? i0 : F.bc;
            return v ? { 'position.x': b, 'position.y': -x, alpha: 1 } : { 'position.x': x, 'position.y': -b, alpha: 1 };
          });
      });
    });
  }
});

regPost('xiCentreOut', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, th = barW(c), acc = hotOf(c), rng = outRange(c);
  applyExitWindowClip(c, false, function (p, bx) {
    var F = frameOf(c, bx, sz * 0.3), g = (F.len / 2) * ioCubic(seg(p, 0.08, 1));
    if (F.len / 2 - g < 0.4) return [];
    return [polyAB(v, F.a0 - BIG, F.b0 - BIG, F.ac - g, F.b1 + BIG), polyAB(v, F.ac + g, F.b0 - BIG, F.a1 + BIG, F.b1 + BIG)];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var bx = lineBounds(gs), F = frameOf(c, bx, sz * 0.3), loc = V.local(c, c.node, 'XiCentreOut');
      [-1, 1].forEach(function (side) {
        addLocalShape(c, loc, rng, 'Bar_' + (side < 0 ? 'L' : 'R'), v ? G.rect(-0.5, 0, 1, th) : G.rect(0, -0.5, th, 1), { fill: acc, alpha: 0 }, function (p) {
          var g = (F.len / 2) * ioCubic(seg(p, 0.08, 1));
          var k = oCubic(seg(p, 0, 0.12)) * (1 - iCubic(seg(p, 0.9, 1))), h = (F.cr / 2 - sz * 0.12) * k;
          if (h < 0.5 || F.len / 2 - g < 0.4) return { alpha: 0 };
          var pos = side < 0 ? F.ac - g - th : F.ac + g;
          return v ? { 'position.x': F.bc, 'position.y': -pos, 'scale.x': h * 2, alpha: 1 } : { 'position.x': pos, 'position.y': -F.bc, 'scale.y': h * 2, alpha: 1 };
        });
      });
    });
  }
});

regPost('xiDiagPinch', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, acc = hotOf(c), lw = Math.max(2, sz * 0.03), flip = cutBit(c, 11), rng = outRange(c);
  var ang = ((v ? 90 : 0) + (flip ? 34 : -34)) * DEG, dv = [Math.cos(ang), Math.sin(ang)], tv = [-dv[1], dv[0]];
  function geom(p, bx) {
    var F = frameOf(c, bx, sz * 0.25), bb = F.bb;
    var cs = [[bb.x0, bb.y0], [bb.x1, bb.y0], [bb.x0, bb.y1], [bb.x1, bb.y1]];
    var us = cs.map(function (q) { return q[0] * dv[0] + q[1] * dv[1]; });
    var ws = cs.map(function (q) { return q[0] * tv[0] + q[1] * tv[1]; });
    var u0 = Math.min.apply(null, us), u1 = Math.max.apply(null, us), w0 = Math.min.apply(null, ws), w1 = Math.max.apply(null, ws), uc = (u0 + u1) / 2;
    return { u0: u0, u1: u1, w0: w0, w1: w1, s0: mix(u0, uc, ioCubic(seg(p, 0, 0.86))), s1: mix(u1, uc, ioCubic(seg(p, 0.14, 1))) };
  }
  function pt(u, w) { return [dv[0] * u + tv[0] * w, dv[1] * u + tv[1] * w]; }
  applyExitWindowClip(c, false, function (p, bx) {
    var gm = geom(p, bx);
    if (gm.s1 - gm.s0 < 0.5) return [];
    return [[pt(gm.s0, gm.w0 - BIG), pt(gm.s0, gm.w1 + BIG), pt(gm.s1, gm.w1 + BIG), pt(gm.s1, gm.w0 - BIG)]];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var bx = lineBounds(gs), loc = V.local(c, c.node, 'XiDiagPinch'), gm0 = geom(0, bx), ex = sz * 0.12;
      var lineLen = (gm0.w1 - gm0.w0) + ex * 2, wMid = (gm0.w0 + gm0.w1) / 2, rotDeg = Math.atan2(tv[1], tv[0]) / DEG;
      [-1, 1].forEach(function (side) {
        addLocalShape(c, loc, rng, 'PinchEdge_' + (side < 0 ? 'L' : 'R'), G.rect(-lineLen / 2, -lw / 2, lineLen, lw), { fill: acc, alpha: 0 }, function (p) {
          var gm = geom(p, bx), a = seg(p, 0, 0.1) * (1 - seg(p, 0.92, 1));
          if (gm.s1 - gm.s0 < 0.5 || a <= 0.01) return { alpha: 0 };
          var u = side < 0 ? gm.s0 - lw / 2 : gm.s1 + lw / 2, pos = pt(u, wMid);
          return { 'position.x': pos[0], 'position.y': -pos[1], rotation: -rotDeg, alpha: a };
        });
      });
    });
  }
});

regPost('xiMothHoles', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, sd = seedOf(c);
  function circlePoly(cx, cy, r) {
    var pts = [];
    for (var k = 0; k < 12; k++) { var a = k / 12 * TAU; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return pts;
  }
  applyExitWindowClip(c, true, function (p, bx) {
    var F = frameOf(c, bx, sz * 0.15), v = F.v, n = cl(Math.round(F.len / (sz * 0.6)) + 3, 5, 12);
    var rm = Math.hypot(F.len / n * 0.96, F.cr * 0.86) + 2, polys = [];
    for (var i = 0; i < n; i++) {
      var a = F.a0 + F.len * cl((i + 0.5 + rs(sd, i, 71, 1) * 0.45) / n), b = F.b0 + F.cr * (0.15 + 0.7 * rand(sd, i, 72));
      var q = seg(p, i === 0 ? 0 : rand(sd, i, 73) * 0.4, 1);
      if (q <= 0) continue;
      var r0 = sz * (0.16 + 0.2 * rand(sd, i, 74)), r = r0 * oCubic(seg(q, 0, 0.35)) + (rm - r0) * iQuad(seg(q, 0.3, 1));
      var pt = PT(v, a, b);
      polys.push(circlePoly(pt[0], pt[1], r));
    }
    return polys;
  });
});

regPost('xiRadialBlinds', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, dir = cutBit(c, 21) ? 1 : -1;
  applyExitWindowClip(c, false, function (p, bx) {
    var F = frameOf(c, bx, sz * 0.25), bb = F.bb, n = 12, R = Math.hypot(bb.w, bb.h) / 2 + sz * 0.2;
    var turn = dir * 42 * DEG * ioCubic(p), polys = [];
    for (var k = 0; k < n; k++) {
      var h = (PI / n) * (1 - ioCubic(win(p, (k % 2) * 0.62 + (k % 3) * 0.12, 0.5)));
      if (h <= 0.002) continue;
      var midA = k * TAU / n + turn, hw = h + (h > PI / n * 0.995 ? 0.004 : 0), a0 = midA - hw, a1 = midA + hw;
      var pts = [[bb.cx, bb.cy]];
      for (var s = 0; s <= 4; s++) { var ang = mix(a0, a1, s / 4); pts.push([bb.cx + Math.cos(ang) * R, bb.cy + Math.sin(ang) * R]); }
      polys.push(pts);
    }
    return polys;
  });
});

regPost('xiPortholes', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, acc = hotOf(c), lw = Math.max(2, sz * 0.03), rng = outRange(c);
  function circles(p, bx) {
    var F = frameOf(c, bx, sz * 0.2), n = cl(Math.round(F.len / (F.cr * 0.95)), 1, 16), cw = F.len / n;
    var R0 = Math.hypot(cw / 2, F.cr / 2) * 1.03, rp = Math.min(F.cr * 0.4, cw * 0.46), mid = (n - 1) / 2, out = [];
    for (var i = 0; i < n; i++) {
      var o = n > 1 ? 1 - Math.abs(i - mid) / mid : 0, q = win(p, o, 0.3);
      var r = mix(R0, rp, ioCubic(seg(q, 0, 0.42))) * (1 - iCubic(seg(q, 0.58, 1)));
      if (r < 0.3) continue;
      var center = PT(v, F.a0 + (i + 0.5) * cw, F.bc);
      out.push({ x: center[0], y: center[1], r: r, ringA: seg(q, 0.2, 0.42) * (1 - seg(q, 0.9, 1)) });
    }
    return out;
  }
  applyExitWindowClip(c, false, function (p, bx) {
    return circles(p, bx).map(function (h) {
      var pts = [];
      for (var k = 0; k < 14; k++) { var a = k / 14 * TAU; pts.push([h.x + Math.cos(a) * h.r, h.y + Math.sin(a) * h.r]); }
      return pts;
    });
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var bx = lineBounds(gs), cs0 = circles(0, bx), loc = V.local(c, c.node, 'XiPortholeRings');
      cs0.forEach(function (h0, i) {
        addLocalShape(c, loc, rng, 'Ring_' + i, G.ellipse(0, 0, 1, 1), { stroke: acc, width: lw, alpha: 0 }, function (p) {
          var hs = circles(p, bx)[i];
          if (!hs || hs.r < 0.3 || hs.ringA <= 0.01) return { alpha: 0 };
          var r = hs.r + lw / 2;
          return { 'position.x': hs.x, 'position.y': -hs.y, 'scale.x': r, 'scale.y': r, alpha: hs.ringA };
        });
      });
    });
  }
});

regPost('xiLattice', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical;
  applyExitWindowClip(c, false, function (p, bx) {
    var F = frameOf(c, bx, sz * 0.2), bb = F.bb;
    var f1 = mix(1, 0.17, ioCubic(seg(p, 0, 0.4))) * (1 - iQuad(seg(p, 0.42, 0.9)));
    var f2 = mix(1, 0.17, ioCubic(seg(p, 0.06, 0.46))) * (1 - iQuad(seg(p, 0.5, 1)));
    if (f1 < 0.004 && f2 < 0.004) return [];
    var pitch = Math.max(Math.min(F.cr * 0.75, sz * 1.1), sz * 0.55), span = bb.w + bb.h;
    if (span / pitch > 18) pitch = span / 18;
    var cs = [[bb.x0, bb.y0], [bb.x1, bb.y0], [bb.x0, bb.y1], [bb.x1, bb.y1]], polys = [];
    [[(v ? 90 : 0) + 52, f1], [(v ? 90 : 0) - 52, f2]].forEach(function (pair) {
      var deg = pair[0], fv = pair[1]; if (fv < 0.004) return;
      var d = [Math.cos(deg * DEG), Math.sin(deg * DEG)], nr = [-d[1], d[0]];
      var os = cs.map(function (pt) { return (pt[0] - bb.cx) * nr[0] + (pt[1] - bb.cy) * nr[1]; });
      var lo = Math.min.apply(null, os), hi = Math.max.apply(null, os), hw = pitch / 2 * fv + (fv > 0.995 ? 0.4 : 0);
      var qPt = function (l, w) { return [bb.cx + d[0] * l + nr[0] * w, bb.cy + d[1] * l + nr[1] * w]; };
      for (var k = Math.floor(lo / pitch); k <= Math.ceil(hi / pitch); k++) {
        var o = k * pitch;
        polys.push([qPt(-BIG, o - hw), qPt(BIG, o - hw), qPt(BIG, o + hw), qPt(-BIG, o + hw)]);
      }
    });
    return polys;
  });
});

regPost('xiPicket', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, dir = cutBit(c, 41) ? 1 : -1;
  applyExitWindowClip(c, false, function (p, bx) {
    var F = frameOf(c, bx, sz * 0.3), pitch = Math.max(sz * 0.3, F.len / 32);
    var open = pitch * mix(1, 0.42, ioCubic(seg(p, 0, 0.34))) * (1 - iQuad(seg(p, 0.36, 0.96)));
    if (open < 0.3) return [];
    var off = dir * pitch * 3.2 * (-(Math.cos(PI * cl(p)) - 1) / 2), ex = open > pitch * 0.995 ? 0.5 : 0;
    var polys = [];
    for (var a = F.a0 - pitch * 5 + off; a < F.a1 + pitch; a += pitch) {
      polys.push(polyAB(v, a + (pitch - open) / 2, F.b0 - BIG, a + (pitch + open) / 2 + ex, F.b1 + BIG));
    }
    return polys;
  });
});

regPost('xiEyelid', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, acc = hotOf(c), lw = Math.max(2, sz * 0.028), rng = outRange(c);
  function lidData(p, bx) {
    var F = frameOf(c, bx, sz * 0.25), L = F.len * 0.5 + sz * 0.9, xc = F.len / 2, yc = F.cr / 2;
    var yy = function (x, h) { var R = (L * L + h * h) / (2 * h); return Math.sqrt(Math.max(0, R * R - x * x)) - (R - h); };
    var h0 = F.cr * 0.9 + sz * 0.3;
    for (var k = 0; k < 8 && yy(xc, h0) < yc; k++) h0 *= 1.3;
    var hA = yc * 0.5, hB = yc * 0.92;
    var h = p < 0.3 ? mix(h0, hA, ioCubic(p / 0.3)) : p < 0.46 ? mix(hA, hB, ioCubic(seg(p, 0.3, 0.46))) : hB * (1 - ioCubic(seg(p, 0.46, 0.8)));
    if (h < 0.6) return { closed: true, L: L, F: F };
    var K = 16, up = [], dn = [];
    for (var i = 0; i <= K; i++) {
      var x = L * (i / K * 2 - 1), y = yy(x, h);
      up.push(PT(v, F.ac + x, F.bc - y)); dn.push(PT(v, F.ac + x, F.bc + y));
    }
    return { closed: false, up: up, dn: dn, L: L, F: F };
  }
  applyExitWindowClip(c, false, function (p, bx) {
    var d = lidData(p, bx);
    if (d.closed) return [];
    return [d.up.concat(d.dn.slice().reverse())];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var bx = lineBounds(gs), F = frameOf(c, bx, sz * 0.25), loc = V.local(c, c.node, 'XiEyelid');
      [-1, 1].forEach(function (side) {
        var id = addLocalShape(c, loc, rng, 'Lid_' + (side < 0 ? 'U' : 'D'), G.rect(-0.5, -lw / 2, 1, lw), { stroke: acc, width: lw, alpha: 0 }, null);
        if (!id) return;
        for (var f = rng.start; f < rng.end; f++) {
          var p = poutAt(c, f), d = lidData(p, bx), a = seg(p, 0.02, 0.14);
          if (a <= 0.01) { setKey(graph, id, 'alpha', f, 0, 1); continue; }
          if (d.closed) {
            if (side > 0) { setKey(graph, id, 'alpha', f, 0, 1); continue; }
            var e = d.L * (1 - ioCubic(seg(p, 0.8, 1)));
            if (e <= 1) { setKey(graph, id, 'alpha', f, 0, 1); continue; }
            setKey(graph, id, 'alpha', f, a, 1);
            setKey(graph, id, 'path', f, V.commands([PT(v, F.ac - e, F.bc), PT(v, F.ac + e, F.bc)], false), 2);
          } else {
            setKey(graph, id, 'alpha', f, a, 1);
            setKey(graph, id, 'path', f, V.commands(side < 0 ? d.up : d.dn, false), 2);
          }
        }
      });
    });
  }
});

regPost('xiFields', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical;
  var far = (v ? c.comp.height : c.comp.width) * 1.1;
  applyExitSliceTwins(c, function (bx) {
    var F = frameOf(c, bx, sz * 0.3), pitch = Math.max(3, sz * 0.08);
    if (F.cr / pitch > 18) pitch = F.cr / 18;
    var n = Math.ceil(F.cr / pitch);
    return [0, 1].map(function (par) {
      return {
        fixed: false,
        sample: function (p) {
          var d = par === 1
            ? sz * 0.11 * oCubic(seg(p, 0, 0.14)) + far * iCubic(seg(p, 0.34, 0.9))
            : -sz * 0.11 * oCubic(seg(p, 0.2, 0.34)) - far * iCubic(seg(p, 0.42, 0.98));
          return { dx: v ? 0 : d, dy: v ? d : 0, a: p >= 0.98 ? 0 : 1 };
        },
        clip: function () {
          var polys = [];
          for (var j = par; j < n; j += 2) polys.push(polyAB(v, -BIG, F.b0 + j * pitch, BIG, F.b0 + (j + 1) * pitch));
          if (!par) { polys.push(polyAB(v, -BIG, F.b0 - BIG, BIG, F.b0)); polys.push(polyAB(v, -BIG, F.b0 + n * pitch, BIG, F.b1 + BIG)); }
          return polys;
        }
      };
    });
  });
});

regPost('xiDrawers', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, s0 = cutBit(c, 45) ? 1 : -1;
  applyExitSliceTwins(c, function (bx) {
    var F = frameOf(c, bx, sz * 0.2), n = cl(Math.round(F.cr / (sz * 0.28)), 4, 9), h = F.cr / n;
    var far = (v ? c.comp.height : c.comp.width) + F.len, d = 0.44, stp = (1 - d) / (n - 1), specs = [];
    for (var k = 0; k < n; k++) {
      (function (kk) {
        specs.push({
          fixed: false,
          sample: function (p) {
            var q = seg(p, kk * stp, kk * stp + d), sh = (kk % 2 ? 1 : -1) * s0 * (sz * 0.24 * oCubic(seg(q, 0, 0.24)) + far * iCubic(seg(q, 0.44, 1)));
            return { dx: v ? 0 : sh, dy: v ? sh : 0, a: q >= 1 ? 0 : 1 };
          },
          clip: function () { return [polyAB(v, -BIG, F.b0 + kk * h - (kk === 0 ? sz : 0), BIG, F.b0 + (kk + 1) * h + (kk < n - 1 ? 0.6 : sz))]; }
        });
      })(k);
    }
    return specs;
  });
});

regPost('xiCounterScroll', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, s0 = cutBit(c, 51) ? 1 : -1, acc = hotOf(c), th = barW(c), rng = outRange(c);
  applyExitSliceTwins(c, function (bx) {
    var F = frameOf(c, bx, sz * 0.25), n = cl(Math.round(F.cr / (sz * 0.55)), 2, 8), h = F.cr / n, dist = F.len + 2, specs = [];
    for (var k = 0; k < n; k++) {
      (function (kk) {
        specs.push({
          fixed: true,
          sample: function (p) {
            var sh = (kk % 2 ? 1 : -1) * s0 * dist * ioCubic(win(seg(p, 0.06, 0.96), kk / Math.max(1, n - 1), 0.3));
            return { dx: v ? 0 : sh, dy: v ? sh : 0, a: p >= 0.99 ? 0 : 1 };
          },
          clip: function () { return [polyAB(v, F.a0, F.b0 + kk * h - (kk === 0 ? sz : 0), F.a1, F.b0 + (kk + 1) * h + (kk < n - 1 ? 0.6 : sz))]; }
        });
      })(k);
    }
    return specs;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var F = frameOf(c, lineBounds(gs), sz * 0.25), loc = V.local(c, c.node, 'XiCounterRails');
      [F.a0 - th, F.a1].forEach(function (pos, idx) {
        addLocalShape(c, loc, rng, 'Rail_' + idx, v ? G.rect(-0.5, 0, 1, th) : G.rect(0, -0.5, th, 1), { fill: acc, alpha: 0 }, function (p) {
          var hh = (F.cr / 2 - sz * 0.1) * oCubic(seg(p, 0, 0.12)) * (1 - iCubic(seg(p, 0.86, 1)));
          if (hh < 0.5) return { alpha: 0 };
          return v ? { 'position.x': F.bc, 'position.y': -pos, 'scale.x': hh * 2, alpha: 1 }
            : { 'position.x': pos, 'position.y': -F.bc, 'scale.y': hh * 2, alpha: 1 };
        });
      });
    });
  }
});

regPost('xiPistons', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, acc = hotOf(c), th = barW(c) * 0.7, rng = outRange(c);
  applyExitSliceTwins(c, function (bx) {
    var F = frameOf(c, bx, sz * 0.25), n = cl(Math.round(F.len / (sz * 0.5)), 3, 14), w = F.len / n, dist = F.cr + 2, specs = [];
    for (var k = 0; k < n; k++) {
      (function (kk) {
        var dir = kk % 2 ? 1 : -1;
        specs.push({
          fixed: true,
          sample: function (p) {
            var q = win(seg(p, 0.05, 0.95), kk / Math.max(1, n - 1), 0.52);
            var sh = dir * (-sz * 0.09 * Math.sin(PI * seg(q, 0, 0.32)) + dist * iCubic(seg(q, 0.26, 1)));
            return { dx: v ? -sh : 0, dy: v ? 0 : sh, a: q >= 1 ? 0 : 1 };
          },
          clip: function () { return [polyAB(v, F.a0 + kk * w - (kk === 0 ? sz : 0), F.b0, F.a0 + (kk + 1) * w + (kk < n - 1 ? 0.6 : sz), F.b1)]; }
        });
      })(k);
    }
    return specs;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var F = frameOf(c, lineBounds(gs), sz * 0.25), loc = V.local(c, c.node, 'XiPistonRails');
      [F.b0 - th, F.b1].forEach(function (pos, idx) {
        addLocalShape(c, loc, rng, 'Rail_' + idx, v ? G.rect(0, -0.5, th, 1) : G.rect(-0.5, 0, 1, th), { fill: acc, alpha: 0 }, function (p) {
          var hl = (F.len / 2) * oCubic(seg(p, 0, 0.12)) * (1 - iCubic(seg(p, 0.88, 1)));
          if (hl < 0.5) return { alpha: 0 };
          return v ? { 'position.x': pos, 'position.y': -F.ac, 'scale.y': hl * 2, alpha: 1 }
            : { 'position.x': F.ac, 'position.y': -pos, 'scale.x': hl * 2, alpha: 1 };
        });
      });
    });
  }
});

regPost('xiInverseBand', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, col = c.node.color || c.sc.fg || '#ffffff', inv = c.sc.bg || '#101010', rng = outRange(c);
  function bandAt(p, bx) {
    var F = frameOf(c, bx, sz * 0.14), q1 = E.outExpo(seg(p, 0, 0.26)), q2 = ioCubic(seg(p, 0.38, 1));
    var a0 = mix(F.a0, F.ac, q2), a1 = mix(F.a1, F.ac, q2), hb = F.cr / 2 * q1;
    return { a0: a0, a1: a1, b0: F.bc - hb, b1: F.bc + hb, hb: hb, F: F };
  }
  applyExitWindowClip(c, false, function (p) {
    return seg(p, 0, 0.26) >= 1 ? [] : [[-BIG, -BIG], [BIG, -BIG], [BIG, BIG], [-BIG, BIG]];
  });
  (c.node._jzTwins = c.node._jzTwins || []).push({
    label: 'InverseText', below: false,
    setup: function (graph, clone, src, g, gs) {
      var cut = c.cut, parent = c.parent, options = c.options;
      clone.attrs['material.materialColor'] = inv;
      clone.keys = {};
      var placeId = rootPlaceNull(graph, [clone.id], cut, c.node, c.comp, parent);
      var bx = lineBounds(gs), byFrame = Object.create(null);
      for (var f = rng.start; f < cut.end; f++) {
        var p = poutAt(c, f), bd = bandAt(p, bx);
        if (bd.a1 - bd.a0 < 0.4 || bd.hb < 0.2 || p >= 0.998) { byFrame[f] = []; continue; }
        byFrame[f] = [toScenePoly(graph, placeId, f, polyAB(v, bd.a0, bd.b0, bd.a1, bd.b1))];
      }
      C.sample(graph, clone.id, clone.start, clone.end, function (f) {
        if (f < rng.start) return { alpha: 0 };
        var p = poutAt(c, f), bd = bandAt(p, bx);
        return { alpha: (bd.a1 - bd.a0 >= 0.4 && bd.hb >= 0.2 && p < 0.998) ? 1 : 0 };
      });
      H.multiClip(graph, clone.id, byFrame, false, 'Inverse clip', options);
    }
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var bx = lineBounds(gs), loc = V.local(c, c.node, 'XiInverseBar');
      var id = addLocalShape(c, loc, rng, 'Band', G.rect(0, 0, 1, 1), { fill: col, alpha: 0 }, function (p) {
        var bd = bandAt(p, bx);
        if (bd.a1 - bd.a0 < 0.4 || bd.hb < 0.2 || p >= 0.998) return { alpha: 0 };
        return v ? { 'position.x': bd.b0, 'position.y': -bd.a0, 'scale.x': bd.hb * 2, 'scale.y': -(bd.a1 - bd.a0), alpha: 1 }
          : { 'position.x': bd.a0, 'position.y': -bd.b0, 'scale.x': bd.a1 - bd.a0, 'scale.y': -(bd.hb * 2), alpha: 1 };
      });
      if (id) { insertBeforeLayer(graph, loc, ids[0]); insertBeforeLayer(graph, id, ids[0]); }
    });
  }
});

regPost('xiFillDrop', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, lw0 = Math.max(1, sz * 0.022), acc = hotOf(c), th = Math.max(2, sz * 0.03), rng = outRange(c);
  (c.node._jzTwins = c.node._jzTwins || []).push({
    label: 'OutlineEcho', below: false,
    setup: function (graph, clone, src) {
      clone.attrs.fill = false; clone.attrs.stroke = true;
      clone.attrs['stroke.strokeColor'] = src.attrs['material.materialColor'] || c.node.color || c.sc.fg;
      clone.attrs['stroke.width'] = lw0;
      clone.keys = {};
      C.sample(graph, clone.id, clone.start, clone.end, function (f) {
        if (f < rng.start) return { alpha: 0 };
        var p = poutAt(c, f), fade = 1 - H.smoothstep(0.92, 1, p), ud = seg(p, 0.38, 0.97);
        var a = cl(p * 10) * fade * (1 - iCubic(ud));
        return { alpha: a };
      });
    }
  });
  post(c, function (graph, ids, gs, cut, parent, options) {
    var placeId = rootPlaceNull(graph, ids, cut, c.node, c.comp, parent);
    var bb = frameOf(c, lineBounds(gs), sz * 0.12).bb, byFrame = Object.create(null);
    for (var f = rng.start; f < cut.end; f++) {
      var p = poutAt(c, f), q = seg(p, 0, 0.56);
      if (q >= 1) { byFrame[f] = []; continue; }
      byFrame[f] = [toScenePoly(graph, placeId, f, V.polygon(-BIG, -BIG, BIG, bb.y1))];
    }
    ids.forEach(function (tid) {
      H.multiClip(graph, tid, byFrame, false, 'FillDrop clip', options);
      var trk = graph.byId[tid].keys['position.y'];
      var y0 = graph.byId[tid].attrs['position.y'] || 0;
      for (var f = rng.start; f < cut.end; f++) {
        var p = poutAt(c, f), q = seg(p, 0, 0.56);
        var drop = (bb.h + sz * 0.3) * (iQuad(q) * 1.02 - 0.02 * Math.sin(PI * seg(q, 0, 0.3)));
        var prev = (trk && trk[f] != null) ? trk[f].value : y0;
        setKey(graph, tid, 'position.y', f, prev - drop, 1);
        if (q >= 1) setKey(graph, tid, 'alpha', f, 0, 1);
      }
    });
    if (rng.ok) {
      var loc = V.local(c, c.node, 'XiFillDropSlot');
      addLocalShape(c, loc, rng, 'Slot', G.rect(0, 0, Math.max(1, bb.w), th), { fill: acc, alpha: 0 }, function (p) {
        var la = seg(p, 0.02, 0.12) * (1 - seg(p, 0.5, 0.62));
        return { 'position.x': bb.x0, 'position.y': -bb.y1, alpha: la };
      });
    }
  });
});

regPost('xiDotted', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, rev = cutBit(c, 65), lw0 = Math.max(1, sz * 0.024), rng = outRange(c);
  applyExitWindowClip(c, false, function (p, bx) {
    var F = frameOf(c, bx, sz * 0.3), e = ioCubic(seg(p, 0, 0.4)), x = rev ? mix(F.a1, F.a0, e) : mix(F.a0, F.a1, e);
    if (e >= 1) return [];
    return [rev ? polyAB(v, F.a0 - BIG, F.b0 - BIG, x, F.b1 + BIG) : polyAB(v, x, F.b0 - BIG, F.a1 + BIG, F.b1 + BIG)];
  });
  (c.node._jzTwins = c.node._jzTwins || []).push({
    label: 'OutlineDotted', below: true,
    setup: function (graph, clone, src) {
      clone.attrs.fill = false; clone.attrs.stroke = true;
      clone.attrs['stroke.strokeColor'] = src.attrs['material.materialColor'] || c.node.color || c.sc.fg;
      clone.attrs['stroke.width'] = lw0;
      clone.keys = {};
      C.sample(graph, clone.id, clone.start, clone.end, function (f) {
        if (f < rng.start) return { alpha: 0 };
        var p = poutAt(c, f), k = 1 - ioCubic(seg(p, 0.3, 0.96)), fade = 1 - H.smoothstep(0.9, 1, p);
        return { alpha: k < 0.02 ? 0 : cl(p * 10) * fade * k };
      });
    }
  });
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
