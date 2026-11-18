/* JIZURA Cavalry Pack: x2decB (30 particle/geometric/back-layer decor recipes from src/11p_x2_decB.js) */
(function (N, G, C, R, V, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, TAU = H.TAU, DEG = H.DEG;

function reg(key, layerType, build) {
  N.register('decor', key, {
    source: 'src/11p_x2_decB.js D(' + key + ')',
    scope: 'cut',
    build: function (c) {
      var n0 = c.graph.layers.length;
      var res = build(c);
      if (layerType === 'back') H.placeBackFrom(c, n0);
      return res;
    },
    differences: ['Native Cavalry editable shape/text geometry following src/11p_x2_decB.js.']
  });
}

function acc(c) { return H.accCol(c.sc, c.sc.bg, false); }
function acc2(c) { return H.accCol(c.sc, c.sc.bg, true); }
function sub(c) { return H.subCol(c.sc, c.sc.bg); }
function colOf(c, P) { return P && P.accent ? acc(c) : c.sc.fg; }
function dimC(c) {
  var sc = c.sc, d = sc.dim, ct = d ? H.contrast(d, sc.bg) : 0;
  return ct >= 1.3 && ct <= 2.4 ? d : H.mixHex(sc.bg, sc.fg, 0.2);
}
function lnC(c) { return H.mixHex(c.sc.bg, c.sc.fg, 0.36); }
function ein(t, d, delay, ease) { return (ease || E.outExpo)(cl((t - (delay || 0)) / (d || 0.4))); }
function mod(a, n) { return ((a % n) + n) % n; }
function tri(x) { return 1 - Math.abs(2 * mod(x, 1) - 1); }
function spFactor(c) { return 0.45 + 0.8 * H.motionAmt(c); }
function phaseOf(c, f, isFront) {
  var env = R.env(c, f);
  var s = isFront ? cl((c.cut.inDur || 0) * 0.6, 0, 0.35) : 0;
  var t = env.lt - s, o = 1 - E.inCubic(env.pOut || 0);
  return { env: env, t: t, o: o, ltb: env.ltb, ok: t > 0 && o > 0.003 };
}
function padBB(bb, u, k) { return (24 * u + Math.min(bb.w, bb.h) * 0.14) * (k == null ? 1 : k); }
function frameBox(c, bb, pad) {
  var m = H.decMG(c) * 0.35, W = c.comp.width, Hh = c.comp.height;
  var x0 = Math.max(m, bb.x0 - pad), y0 = Math.max(m, bb.y0 - pad);
  var x1 = Math.min(W - m, bb.x1 + pad), y1 = Math.min(Hh - m, bb.y1 + pad);
  return { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
function spotBox(c, bb, w, h, P, gap) {
  var sp = P && P.corner ? H.cornerSpot(c, bb, w, h, P, 0.8) : H.nearBB(c, bb, w, h, P, gap);
  return sp ? { x: sp.x, y: sp.y, w: w, h: h, cx: sp.x + w / 2, cy: sp.y + h / 2, ok: sp.ok } : null;
}
function bandBox(c, bb, h, low, gap) {
  var Hh = c.comp.height, m = H.decMG(c) * 0.5;
  var dn = bb.y1 + gap + h <= Hh - m, up = bb.y0 - gap - h >= m;
  if (low ? dn : up) return low ? { y: bb.y1 + gap, h: h, s: 1 } : { y: bb.y0 - gap - h, h: h, s: -1 };
  if (low ? up : dn) return low ? { y: bb.y0 - gap - h, h: h, s: -1 } : { y: bb.y1 + gap, h: h, s: 1 };
  var m2 = H.decMG(c);
  return { y: low ? Hh - m2 - h : m2, h: h, s: low ? 1 : -1 };
}

/* 1. xmSettle */
reg('xmSettle', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var s = H.p(P, 'seed', c.cut.seed || 1), sz = (P.big ? 17 : 13) * u, gap = 8 * u;
  var top = bb.y0 - gap > sz * 5, xa = top ? bb.x0 : 0, xw = top ? bb.w : W, base = top ? bb.y0 - gap : Hh;
  var nb = cl(Math.round(xw / (sz * 1.2)), 3, 64), N = Math.min(22 + cl(H.p(P, 'n', 1) | 0, 1, 3) * 10, nb * 4);
  var lev = []; for (var b0 = 0; b0 < nb; b0++) lev.push(0);
  var span = cl(((c.cut && c.cut.dur) || 2) * 0.32, 0.5, 2), cols = [sc.fg, acc(c), acc2(c)];
  var ids = [];
  for (var i = 0; i < N; i++) {
    (function (idx) {
      var b = Math.min(nb - 1, Math.floor(R.random(s, idx, 1) * nb)), L = lev[b]++;
      var x = xa + (b + 0.5 + R.rs(s, idx, 2) * 0.16) * (xw / nb), yr = base - (L + 0.5) * sz;
      var col = cols[idx % 5 === 0 ? 1 : idx % 7 === 0 ? 2 : 0], hr = sz * 0.43;
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / xmSettle ' + idx, c.parent, G.rect(-hr, -hr, hr * 2, hr * 2), { fill: col, alpha: 0.92 });
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
        var ph = phaseOf(c, f0, true); if (!ph.ok) return { alpha: 0 };
        var q = cl((ph.t - R.random(s, idx, 3) * span) / 0.6); if (q <= 0) return { alpha: 0 };
        var out = 1 - ph.o, b2 = cl((ph.t - R.random(s, idx, 3) * span - 0.6) / 0.22);
        var y = mix(Math.min(-sz * 2, yr - Hh * 0.3), yr, E.inQuad(q)) - Math.sin(Math.PI * b2) * sz * 0.4 - out * Hh * 0.07 * R.random(s, idx, 6);
        var xp = x + out * R.rs(s, idx, 5) * W * 0.1;
        var a = (top ? 1 : H.clearOf(bb, xp, y, 0, sz * 2.5)) * ph.o * 0.92;
        var pt = H.toScene(c, xp, y);
        return { 'position.x': pt[0], 'position.y': pt[1], rotation: -((1 - q) * R.rs(s, idx, 4) * 5 + out * R.rs(s, idx, 7) * 2) / DEG, alpha: a };
      });
      ids.push(id);
    })(i);
  }
  return { count: ids.length };
});

/* 2. xmSwarm */
reg('xmSwarm', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var s = H.p(P, 'seed', c.cut.seed || 2), M = 28 + cl(H.p(P, 'n', 1) | 0, 1, 3) * 10, dir = P.right ? 1 : -1, gap = 26 * u;
  var a = bb.w / 2 * 1.35 + gap * 2, B = (bb.h / 2 + gap) / 0.72, m = 40 * u, span = W + 2 * m, sp = spFactor(c);
  function pos(i, tt) {
    var x = mod(R.random(s, i, 1) * span + dir * tt * W * R.rr(0.1, 0.2, s, i, 2) * sp, span) - m, d = Hh * R.rr(0.03, 0.97, s, i, 3) - bb.cy;
    var k = (x - bb.cx) / a, hy = B * Math.exp(-k * k * k * k);
    return [x, bb.cy + (d >= 0 ? 1 : -1) * Math.sqrt(d * d + hy * hy)];
  }
  var dashL = 22 * u;
  for (var i = 0; i < M; i++) {
    (function (idx) {
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / xmSwarm ' + idx, c.parent, [['M', -dashL / 2, 0], ['L', dashL / 2, 0]], {
        stroke: idx % 6 === 0 ? acc(c) : sc.fg, width: Math.max(1, (idx % 6 === 0 ? 5.5 : 3.6) * u), alpha: 0.8
      });
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
        var ph = phaseOf(c, f0, true); if (!ph.ok) return { alpha: 0 };
        var e = ein(ph.t, 0.5, 0, E.outCubic), q = pos(idx, ph.t), q0 = pos(idx, ph.t - 0.1 * e);
        if (Math.abs(q[0] - q0[0]) > W * 0.5 || q[1] < -20 || q[1] > Hh + 20) return { alpha: 0 };
        var pt = H.toScene(c, (q[0] + q0[0]) / 2, (q[1] + q0[1]) / 2);
        return { 'position.x': pt[0], 'position.y': pt[1], rotation: -(Math.atan2(q[1] - q0[1], q[0] - q0[0]) / DEG), alpha: 0.8 * e * ph.o };
      });
    })(i);
  }
  return { count: M };
});

/* 3. xmBounce */
reg('xmBounce', 'front', function (c) {
  var P = c.preset.params || {}, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var gap = 10 * u, r = (P.big ? 22 : 16) * u, m = H.decMG(c) * 0.4;
  var up = bb.y0 - gap - 2 * r - m, dn = Hh - m - bb.y1 - gap - 2 * r;
  var top = !P.low; if ((top ? up : dn) < 44 * u) top = !top;
  var room = top ? up : dn; if (room < 16 * u) room = 44 * u;
  var hh = Math.min(130 * u, room), yB = top ? bb.y0 - gap : bb.y1 + gap + hh + 2 * r;
  var xa = bb.x0 + r, xb = Math.max(xa + 1, bb.x1 - r), hops = cl(Math.round((xb - xa) / (150 * u)), 2, 9);
  var Th = 0.5 / (0.6 + 0.6 * H.motionAmt(c)), cnt = cl(H.p(P, 'n', 1) | 0, 1, 3);
  if (!top) H.line(c, 'xmBounce floor', [[xa - r, yB], [xb + r, yB]], sub(c), 1.6 * u, 0.8);
  for (var k = 0; k < cnt; k++) {
    (function (idx) {
      var col = idx === 0 ? colOf(c, P) : idx === 1 ? acc(c) : sc.fg;
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / xmBounce ' + idx, c.parent, G.ellipse(0, 0, r, r), { fill: col, alpha: 1 });
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
        var q = phaseOf(c, f0, true); if (!q.ok) return { alpha: 0 };
        var e = ein(q.t, 0.45, 0, E.outCubic);
        var ph = q.t / Th + idx * (0.37 + 2 * hops / cnt), j = Math.floor(ph), fr = ph - j, cp = Math.min(fr, 1 - fr);
        var s2 = 1 - 0.34 * Math.exp(-cp * 20), x = mix(xa, xb, tri(ph / (2 * hops)));
        var y = yB - r * s2 - hh * 4 * fr * (1 - fr) - (1 - e) * hh;
        var pt = H.toScene(c, x, y);
        return { 'position.x': pt[0], 'position.y': pt[1], 'scale.x': Math.max(0.05, q.o / s2), 'scale.y': Math.max(0.05, q.o * s2), alpha: cl(e * 1.5) * q.o };
      });
    })(k);
  }
  return { count: cnt };
});

/* 4. xmFuse */
reg('xmFuse', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var s = H.p(P, 'seed', c.cut.seed || 4), gap = 24 * u, m = H.decMG(c) * 0.5, vert = bb.h > bb.w * 1.25;
  var A, B, nx = 0, ny = 0;
  if (!vert) {
    var low = !!P.low; if (low ? bb.y1 + gap > Hh - m : bb.y0 - gap < m) low = !low;
    var y = low ? bb.y1 + gap : bb.y0 - gap; A = [bb.x0, y]; B = [bb.x1, y]; ny = low ? 1 : -1;
  } else {
    var rt = !!P.low; if (rt ? bb.x1 + gap > W - m : bb.x0 - gap < m) rt = !rt;
    var x = rt ? bb.x1 + gap : bb.x0 - gap; A = [x, bb.y0]; B = [x, bb.y1]; nx = rt ? 1 : -1;
  }
  if (!P.right) { var sw = A; A = B; B = sw; }
  var L = Math.hypot(B[0] - A[0], B[1] - A[1]), n = cl(Math.round(L / (12 * u)), 8, 80);
  function ptAt(q) { var w = Math.sin(q * L / (40 * u)) * 5 * u; return [mix(A[0], B[0], q) + nx * w, mix(A[1], B[1], q) + ny * w]; }
  var pts = []; for (var i = 0; i <= n; i++) pts.push(ptAt(i / n));
  var fuseId = H.poly(c, 'xmFuse cord', pts, false, { stroke: sc.fg, width: Math.max(1, 3.2 * u), alpha: 1 });
  var sparkId = C.shape(c.graph, c.cut, c.cut.id + ' / xmFuse spark', c.parent, G.ellipse(0, 0, 6.5 * u, 6.5 * u), { fill: acc(c), alpha: 1 });
  var dur = (c.cut && c.cut.dur) || 2;
  C.sample(c.graph, fuseId, c.cut.start, c.cut.end, function (f0) {
    var ph = phaseOf(c, f0, true); if (!ph.ok) return { alpha: 0 };
    return { alpha: ph.o * ein(ph.t, 0.4, 0, E.outCubic) };
  });
  C.sample(c.graph, sparkId, c.cut.start, c.cut.end, function (f0) {
    var ph = phaseOf(c, f0, true); if (!ph.ok) return { alpha: 0 };
    var e = ein(ph.t, 0.4, 0, E.outCubic), q = cl((ph.t - 0.3) / Math.max(0.6, dur - ((c.cut && c.cut.outDur) || 0) - 1)) * 0.93;
    if (e <= q) return { alpha: 0 };
    var p = ptAt(q), scP = H.toScene(c, p[0], p[1]);
    return { 'position.x': scP[0], 'position.y': scP[1], alpha: ph.o };
  });
  for (var j = 0; j < 6; j++) {
    (function (idx) {
      var sid = C.shape(c.graph, c.cut, c.cut.id + ' / xmFuse ray ' + idx, c.parent, [['M', 0, 0], ['L', 24 * u, 0]], { stroke: idx % 3 ? acc(c) : sc.fg, width: Math.max(1, 2.4 * u), alpha: 1 });
      C.sample(c.graph, sid, c.cut.start, c.cut.end, function (f0) {
        var ph = phaseOf(c, f0, true); if (!ph.ok) return { alpha: 0 };
        var q = cl((ph.t - 0.3) / Math.max(0.6, dur - ((c.cut && c.cut.outDur) || 0) - 1)) * 0.93;
        var p = ptAt(q), scP = H.toScene(c, p[0], p[1]), an = R.random(s, Math.floor(f0 / 2), idx, 1) * TAU;
        return { 'position.x': scP[0], 'position.y': scP[1], rotation: -(an / DEG), 'scale.x': 0.5 + R.random(s, idx, f0, 2) * 0.7, alpha: ph.o };
      });
    })(j);
  }
  return { fuse: fuseId };
});

/* 5. xmMagnet */
reg('xmMagnet', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var s = H.p(P, 'seed', c.cut.seed || 5), f = frameBox(c, bb, padBB(bb, u)), N = 34 + cl(H.p(P, 'n', 1) | 0, 1, 3) * 14, Lp = 2 * (f.w + f.h), mn = Math.min(W, Hh);
  function per(d) {
    d = mod(d, Lp);
    if (d < f.w) return [f.x0 + d, f.y0, 0, -1]; d -= f.w;
    if (d < f.h) return [f.x1, f.y0 + d, 1, 0]; d -= f.h;
    if (d < f.w) return [f.x1 - d, f.y1, 0, 1]; d -= f.w;
    return [f.x0, f.y1 - d, -1, 0];
  }
  for (var i = 0; i < N; i++) {
    (function (idx) {
      var big = idx % 5 === 0, r = (big ? 5.5 : 3.4) * u;
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / xmMagnet ' + idx, c.parent, G.ellipse(0, 0, r, r), { fill: big ? acc(c) : sc.fg, alpha: 0.95 });
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
        var ph = phaseOf(c, f0, true); if (!ph.ok) return { alpha: 0 };
        var dr = ph.t * 12 * u * spFactor(c) * (P.right ? 1 : -1);
        var a = per((idx + R.random(s, idx, 1) * 0.6) / N * Lp + dr);
        var q = E.outCubic(cl((ph.t - R.random(s, idx, 2) * 0.45) / 0.6)), out = 1 - ph.o;
        var k = (1 - q) + out * 1.2, dist = R.rr(0.16, 0.5, s, idx, 3) * mn * k, tg = R.rs(s, idx, 4) * dist * 0.5;
        var wob = Math.sin(ph.t * 3 + idx * 1.7) * 2.5 * u * q;
        var x = a[0] + a[2] * (dist + wob) - a[3] * tg, y = a[1] + a[3] * (dist + wob) + a[2] * tg;
        var pt = H.toScene(c, x, y);
        return { 'position.x': pt[0], 'position.y': pt[1], alpha: cl(q * 3) * ph.o * 0.95 };
      });
    })(i);
  }
  return { count: N };
});

/* 6. xmPendulum */
reg('xmPendulum', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var gap = 16 * u, rb = 8.5 * u, m = H.decMG(c) * 0.5;
  var dn = Hh - m - bb.y1 - gap - rb * 2, up = bb.y0 - gap - rb * 2 - m;
  var low = !!P.low; if ((low ? dn : up) < 64 * u) low = !low;
  var room = Math.max(40 * u, low ? dn : up), Lmax = Math.min((P.big ? 200 : 150) * u, room);
  var py = low ? bb.y1 + gap : Math.max(m, bb.y0 - gap - rb * 2 - Lmax);
  var wid = Math.min(Math.max(bb.w, 280 * u), W - m * 4), xa = cl(bb.cx - wid / 2, m * 2, W - m * 2 - wid), xb = xa + wid;
  var N = cl(Math.round(wid / (46 * u)), 5, 17), k0 = 8, Tc = 16 / spFactor(c);
  H.line(c, 'xmPendulum bar', [[xa, py], [xb, py]], sc.fg, 2.2 * u, 1);
  for (var i = 0; i < N; i++) {
    (function (idx) {
      var x = mix(xa, xb, (idx + 0.5) / N), fq = k0 + idx * 8 / N, L = Lmax * Math.pow(k0 / fq, 2);
      var rig = c.graph.add('null', c.cut.id + ' / xmPendulum rig ' + idx, c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, x, py) });
      C.shape(c.graph, c.cut, c.cut.id + ' / xmPendulum wire ' + idx, rig, [['M', 0, 0], ['L', 0, -L]], { stroke: sub(c), width: Math.max(0.8, 1.6 * u), alpha: 0.85 });
      C.shape(c.graph, c.cut, c.cut.id + ' / xmPendulum bob ' + idx, rig, G.ellipse(0, -L, rb, rb), { fill: idx % 4 === 0 ? acc(c) : sc.fg, alpha: 1 });
      C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
        var ph = phaseOf(c, f0, true); if (!ph.ok) return { 'scale.y': 0.01 };
        var e = ein(ph.t, 0.5, 0, E.outCubic) * ph.o;
        var an = 24 * Math.cos(TAU * fq * ph.t / Tc);
        return { rotation: -an, 'scale.y': Math.max(0.01, e) };
      });
    })(i);
  }
  return { count: N };
});

/* 7. xmFountain */
reg('xmFountain', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var s = H.p(P, 'seed', c.cut.seed || 7), M = 28 + cl(H.p(P, 'n', 1) | 0, 1, 3) * 8, Tl = 1.25 / spFactor(c), Tf = Tl * 0.94;
  var ems = P.corner ? [0.12, 0.88] : [P.right ? 0.86 : 0.14], count = 0;
  ems.forEach(function (em, k) {
    for (var i = 0; i < M; i++) {
      (function (emX, idx, kIdx) {
        var r = R.rr(5.5, 10, s, idx, kIdx + 7) * u, col = idx % 3 === 0 ? acc(c) : idx % 5 === 0 ? acc2(c) : sc.fg;
        var id = C.shape(c.graph, c.cut, c.cut.id + ' / xmFountain ' + kIdx + '_' + idx, c.parent, G.ellipse(0, 0, r, r), { fill: col, alpha: 1 });
        C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
          var q = phaseOf(c, f0, true); if (!q.ok) return { alpha: 0 };
          var ph = q.t / Tl + (idx + R.random(s, idx, kIdx, 9)) / M, j = Math.floor(ph), a = (ph - j) * Tl;
          if (q.t - a < 0 || a > Tf) return { alpha: 0 };
          var h = Hh * R.rr(0.22, 0.5, s, idx, j, kIdx + 1), v = 4 * h / Tf, g = 2 * v / Tf;
          var x = W * emX + R.rs(s, idx, j, kIdx + 4) * Math.min(W, Hh) * 0.11 * a, y = Hh + 6 * u - v * a + g * a * a / 2;
          var al = H.clearOf(bb, x, y, 0, 40 * u) * q.o * cl(a * 8), pt = H.toScene(c, x, y), s0 = 1 - 0.45 * a / Tf;
          return { 'position.x': pt[0], 'position.y': pt[1], 'scale.x': s0, 'scale.y': s0, alpha: al };
        });
        count++;
      })(em, i, k);
    }
  });
  return { count: count };
});

/* 8. xmDominoes */
reg('xmDominoes', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var gap = 14 * u, h = (P.big ? 68 : 52) * u, w = 8.5 * u, m = H.decMG(c) * 0.4;
  var dn = Hh - m - bb.y1 - gap - h, up = bb.y0 - gap - h - m;
  var low = !!P.low; if ((low ? dn : up) < 0) low = !low;
  var yb = cl(low ? bb.y1 + gap + h : bb.y0 - gap, m + h, Hh - m), dir = P.right ? 1 : -1;
  var xa = bb.x0 + w, xb = bb.x1 - w;
  if (xb - xa < 220 * u) { var c0 = cl((xa + xb) / 2, m + 110 * u, W - m - 110 * u); xa = c0 - 110 * u; xb = c0 + 110 * u; }
  var lenAll = Math.max(40 * u, xb - xa - h * 0.9), N = cl(Math.ceil(lenAll / (h * 0.66)) + 1, 4, 32), pitch = lenAll / (N - 1);
  var thMax = Math.min(Math.acos(cl(w / pitch, 0, 1)) * 0.985 / DEG, 86), rate = 15 * spFactor(c), Tf = (N + 3) / rate, T = 2 * Tf + 1.3;
  H.line(c, 'xmDominoes floor', [[xa, yb], [xb, yb]], sub(c), 1.4 * u, 0.7);
  for (var i = 0; i < N; i++) {
    (function (idx) {
      var x = dir > 0 ? xa + idx * pitch : xb - idx * pitch;
      var rig = c.graph.add('null', c.cut.id + ' / xmDomino rig ' + idx, c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, x + dir * w / 2, yb) });
      var x0 = dir > 0 ? -w : 0;
      C.shape(c.graph, c.cut, c.cut.id + ' / xmDomino bar ' + idx, rig, G.rect(x0, 0, w, h), { fill: idx === 0 ? acc(c) : sc.fg, alpha: idx === 0 ? 1 : 0.9 });
      C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
        var ph = phaseOf(c, f0, true); if (!ph.ok) return { 'scale.y': 0.001 };
        var he = ein(ph.t, 0.3, idx * 0.012, E.outBack) * ph.o;
        var tc = ph.t > 0.5 ? mod(ph.t - 0.5, T) : -1, wf = tc * rate, wr = (tc - Tf - 0.7) * rate;
        var an = tc < 0 ? 0 : (idx === N - 1 ? 90 : thMax) * E.inQuad(cl((wf - idx) / 2.2)) * (1 - H.smoothstep(0, 2.2, wr - (N - 1 - idx)));
        return { rotation: -(dir * an), 'scale.y': Math.max(0.005, he) };
      });
    })(i);
  }
  return { count: N };
});

/* 9. xmPong */
reg('xmPong', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, sc = c.sc, u = H.decU(c), bb = H.decBB(c), m = H.decMG(c);
  var hB = (P.big ? 210 : 160) * u, bd = bandBox(c, bb, hB, P.low, 20 * u);
  var xa = m * 1.2, xb = W - m * 1.2, pw = 13 * u, ph = 66 * u, bs = 11 * u, sp = spFactor(c);
  var y0 = bd.y + bs, y1 = bd.y + bd.h - bs, mid = (y0 + y1) / 2;
  function ballAt(tt) { var k = tri(tt * sp / 2.3 + H.p(P, 'r', 0.3)); return [mix(xa + pw + bs, xb - pw - bs, k), mix(y0, y1, tri(tt * sp / 1.37 + H.p(P, 'r', 0.3) * 3)), k]; }
  var padL = C.shape(c.graph, c.cut, c.cut.id + ' / xmPong padL', c.parent, G.rect(-pw / 2, -ph / 2, pw, ph), { fill: sc.fg, alpha: 1 });
  var padR = C.shape(c.graph, c.cut, c.cut.id + ' / xmPong padR', c.parent, G.rect(-pw / 2, -ph / 2, pw, ph), { fill: sc.fg, alpha: 1 });
  var netRects = [];
  for (var y = bd.y + 4 * u; y < bd.y + bd.h - 8 * u; y += 22 * u) netRects.push([W / 2 - 2 * u, y, 4 * u, 11 * u]);
  if (netRects.length) C.shape(c.graph, c.cut, c.cut.id + ' / xmPong net', c.parent, H.rectCmds(c, netRects), { fill: sub(c), alpha: 0.55 });
  var ballId = C.shape(c.graph, c.cut, c.cut.id + ' / xmPong ball', c.parent, G.rect(-bs, -bs, bs * 2, bs * 2), { fill: colOf(c, P), alpha: 1 });
  C.sample(c.graph, padL, c.cut.start, c.cut.end, function (f0) {
    var ph0 = phaseOf(c, f0, true); if (!ph0.ok) return { alpha: 0 };
    var e = ein(ph0.t, 0.45), b = ballAt(ph0.t), off = (1 - e) * 120 * u + (1 - ph0.o) * 120 * u;
    var yl = cl(mix(b[1], mid, b[2] * 0.85), y0 + ph / 2 - bs, y1 - ph / 2 + bs);
    var pt = H.toScene(c, xa + pw / 2 - off, yl);
    return { 'position.x': pt[0], 'position.y': pt[1], alpha: ph0.o };
  });
  C.sample(c.graph, padR, c.cut.start, c.cut.end, function (f0) {
    var ph0 = phaseOf(c, f0, true); if (!ph0.ok) return { alpha: 0 };
    var e = ein(ph0.t, 0.45), b = ballAt(ph0.t), off = (1 - e) * 120 * u + (1 - ph0.o) * 120 * u;
    var yr = cl(mix(mid, b[1], 0.15 + b[2] * 0.85), y0 + ph / 2 - bs, y1 - ph / 2 + bs);
    var pt = H.toScene(c, xb - pw / 2 + off, yr);
    return { 'position.x': pt[0], 'position.y': pt[1], alpha: ph0.o };
  });
  C.sample(c.graph, ballId, c.cut.start, c.cut.end, function (f0) {
    var ph0 = phaseOf(c, f0, true); if (!ph0.ok) return { alpha: 0 };
    var b = ballAt(ph0.t), pt = H.toScene(c, b[0], b[1]);
    return { 'position.x': pt[0], 'position.y': pt[1], alpha: cl(ein(ph0.t, 0.45) * 1.2) * ph0.o };
  });
  return { ball: ballId };
});

/* 10. xmConveyor */
reg('xmConveyor', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, sc = c.sc, u = H.decU(c), bb = H.decBB(c), m = H.decMG(c);
  var s = H.p(P, 'seed', c.cut.seed || 8), bd = bandBox(c, bb, 140 * u, P.low, 14 * u), dir = P.right ? 1 : -1;
  var sz = 17 * u, v = 90 * u * spFactor(c), spc = 120 * u;
  var xa = Math.max(m, bb.x0 - 30 * u), xb = Math.min(W - m, bb.x1 + 30 * u);
  if (xb - xa < 340 * u) { var c0 = cl((xa + xb) / 2, m + 170 * u, W - m - 170 * u); xa = c0 - 170 * u; xb = c0 + 170 * u; }
  var len = xb - xa, yT = bd.y + 58 * u, bt = 16 * u, cx = (xa + xb) / 2;
  var beltId = C.shape(c.graph, c.cut, c.cut.id + ' / xmConveyor belt', c.parent, H.roundRectCmds(cx - W / 2, c.comp.height / 2 - (yT + bt / 2), len, bt, bt / 2), { stroke: sc.fg, width: Math.max(1, 2.6 * u), alpha: 1 });
  var cnt = Math.ceil(len / spc) + 1, loop = cnt * spc, cols = [sc.fg, acc(c), acc2(c)];
  for (var i = 0; i < cnt; i++) {
    (function (idx) {
      var ty = Math.floor(R.random(s, idx, 1) * 3), col = cols[Math.floor(R.random(s, idx, 2) * 3)];
      var cmds = ty === 0 ? G.ellipse(0, 0, sz, sz) : ty === 1 ? G.rect(-sz * 0.9, -sz * 0.9, sz * 1.8, sz * 1.8)
        : [['M', 0, sz * 1.2], ['L', sz * 1.04, -sz * 0.6], ['L', -sz * 1.04, -sz * 0.6], ['Z']];
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / xmConveyor item ' + idx, c.parent, cmds, { fill: col, alpha: 1 });
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
        var ph = phaseOf(c, f0, true); if (!ph.ok) return { alpha: 0 };
        var d = mod(idx * spc + ph.t * v, loop), over = d - len;
        var x = (dir > 0 ? xa : xb) + dir * Math.min(d, len), y = yT - sz - 2 * u, rot = 0, a = cl(d / (26 * u));
        if (over > 0) { var tt = over / v; x += dir * over * 0.75; y += Math.min(tt * tt * 900 * u, 60 * u); rot = dir * tt * 5 / DEG; a = 1 - cl(over / (spc * 0.55)); }
        var pt = H.toScene(c, x, y);
        return { 'position.x': pt[0], 'position.y': pt[1], rotation: -rot, alpha: a * ph.o };
      });
    })(i);
  }
  C.sample(c.graph, beltId, c.cut.start, c.cut.end, function (f0) {
    var ph = phaseOf(c, f0, true); if (!ph.ok) return { alpha: 0 };
    return { 'scale.x': Math.max(0.01, ein(ph.t, 0.45, 0, E.outCubic)), alpha: ph.o };
  });
  return { belt: beltId };
});

/* 11. xmStairs */
reg('xmStairs', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var b = (P.big ? 56 : 44) * u, S = 4 + cl(H.p(P, 'n', 1) | 0, 1, 3), g = 3 * u, sx = P.right ? -1 : 1, sy = P.low ? -1 : 1;
  var X0 = P.right ? W : 0, Y0 = P.low ? Hh : 0, idx = 0;
  function cellX(j) { return sx > 0 ? X0 + j * b : X0 - (j + 1) * b; }
  function cellY(i) { return sy > 0 ? Y0 + i * b : Y0 - (i + 1) * b; }
  for (var i = 0; i < S; i++) {
    for (var j = 0; j < S - i; j++, idx++) {
      (function (ii, jj, k) {
        var x = cellX(jj) + g / 2, y = cellY(ii) + g / 2;
        if (H.hitBB(x, y, x + b, y + b, bb, 8 * u)) return;
        var diag = ii === S - 1 - jj, bid = H.rect(c, 'xmStairs blk ' + ii + '_' + jj, x, y, b - g, b - g, { fill: diag ? acc(c) : sc.fg, alpha: 1 });
        C.sample(c.graph, bid, c.cut.start, c.cut.end, function (f0) {
          var ph = phaseOf(c, f0, true); if (!ph.ok) return { alpha: 0 };
          var q = cl((ph.t - k * 0.022) / 0.34); if (q <= 0) return { alpha: 0 };
          var dy = sy * (1 - E.outCubic(q)) * b * 3 - sy * (1 - ph.o) * b * (S + 1);
          return { 'position.y': -dy, alpha: cl(q * 2) * (diag ? 1 : 0.86) };
        });
      })(i, j, idx);
    }
  }
  var r = 9.5 * u, ball = C.shape(c.graph, c.cut, c.cut.id + ' / xmStairs dot', c.parent, G.ellipse(0, 0, r, r), { fill: sc.fg, alpha: 1 });
  C.sample(c.graph, ball, c.cut.start, c.cut.end, function (f0) {
    var ph0 = phaseOf(c, f0, true); if (!ph0.ok) return { alpha: 0 };
    var ph = (ph0.t - 0.5 - S * S * 0.018) / (0.34 / spFactor(c)); if (ph < 0) return { alpha: 0 };
    var jj = Math.floor(ph) % (S + 1), fr = ph - Math.floor(ph); if (jj >= S - 1) return { alpha: 0 };
    var ja = S - 1 - jj, jb = ja - 1, topY = function (k) { return Y0 + sy * ((S - k) * b + r + 2 * u); }, cxS = function (k) { return X0 + sx * (k + 0.5) * b; };
    var xp = mix(cxS(ja), cxS(jb), fr), yp = mix(topY(ja), topY(jb), fr) + sy * 4 * fr * (1 - fr) * b * 0.7;
    var pt = H.toScene(c, xp, yp);
    return { 'position.x': pt[0], 'position.y': pt[1], alpha: H.clearOf(bb, xp, yp, 0, 10 * u) * ph0.o };
  });
  return { steps: S };
});

/* 12. xmIsoCubes */
reg('xmIsoCubes', 'front', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), s = H.p(P, 'seed', c.cut.seed || 12);
  var a = (P.big ? 46 : 36) * u, sp = spotBox(c, bb, a * 5.4, a * 6.2, P, 14 * u);
  var ox = sp.cx, oy = sp.y + a * 3.6, kx = a * 0.866;
  var cL = H.mixHex(sc.fg, sc.bg, 0.55), cR = H.mixHex(sc.fg, sc.bg, 0.28), count = 0;
  for (var x = 0; x < 3; x++) {
    for (var y = 0; y < 3; y++) {
      var hgt = x + y === 0 ? 3 : cl(3 - x - y + Math.floor(R.random(s, x, y, 1) * 2.3), 0, 3);
      for (var z = 0; z < hgt; z++) {
        (function (xx, yy, zz, isTop) {
          var cx = ox + (xx - yy) * kx, cy = oy + (xx + yy) * a / 2 - zz * a - a;
          var rig = c.graph.add('null', c.cut.id + ' / xmIsoCube ' + xx + yy + zz, c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, cx, cy) });
          function face(pts, col) {
            return C.shape(c.graph, c.cut, c.cut.id + ' / xmIsoFace', rig, pts.map(function (pt, idx) { return [idx ? 'L' : 'M', pt[0], -pt[1]]; }).concat([['Z']]), { fill: col, alpha: 1 });
          }
          var fL = face([[-kx, 0], [0, a / 2], [0, a * 1.5], [-kx, a]], cL);
          var fR = face([[kx, 0], [0, a / 2], [0, a * 1.5], [kx, a]], cR);
          var fT = face([[0, -a / 2], [kx, 0], [0, a / 2], [-kx, 0]], isTop && R.random(s, xx, yy, 2) < 0.3 ? acc(c) : sc.fg);
          C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
            var ph = phaseOf(c, f0, true); if (!ph.ok) return { 'position.y': 0 };
            var q = cl((ph.t - (zz + (xx + yy) * 0.3) * 0.2) / 0.36);
            var dy = -(1 - E.outCubic(q)) * a * 2.5 - (1 - ph.o) * a * 1.5;
            return { 'position.y': H.toScene(c, cx, cy)[1] - dy };
          });
          [fL, fR, fT].forEach(function (fid) {
            C.sample(c.graph, fid, c.cut.start, c.cut.end, function (f0) {
              var ph = phaseOf(c, f0, true); if (!ph.ok) return { alpha: 0 };
              var q = cl((ph.t - (zz + (xx + yy) * 0.3) * 0.2) / 0.36);
              return { alpha: q <= 0 ? 0 : cl(q * 2.5) * ph.o };
            });
          });
          count++;
        })(x, y, z, z === hgt - 1);
      }
    }
  }
  return { count: count };
});

/* 13. xmSlide */
reg('xmSlide', 'front', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), s = H.p(P, 'seed', c.cut.seed || 13);
  var ts = (P.big ? 60 : 46) * u, g = 7 * u, wd = ts * 3 + g * 2, sp = spotBox(c, bb, wd, wd, P, 16 * u);
  var stepT = 0.48 / spFactor(c);
  function boardAt(tt) {
    var grid = [0, 1, 2, 3, 4, 5, 6, 7, -1], ph = Math.max(0, (tt - 0.55) / stepT), m = Math.min(Math.floor(ph), 200);
    var hole = 8, prev = -1, mvFrom = -1;
    function next(q) {
      var ca = [], hx = hole % 3, hy = (hole / 3) | 0;
      if (hx > 0) ca.push(hole - 1); if (hx < 2) ca.push(hole + 1);
      if (hy > 0) ca.push(hole - 3); if (hy < 2) ca.push(hole + 3);
      var d = ca.filter(function (k) { return k !== prev; });
      return d[R.hash(s, q, 7) % d.length];
    }
    for (var q = 0; q <= m; q++) {
      var k = next(q);
      if (q === m) { mvFrom = k; break; }
      grid[hole] = grid[k]; grid[k] = -1; prev = hole; hole = k;
    }
    var fr = tt < 0.55 ? 0 : E.inOutCubic(cl((ph - m) / 0.62)), posMap = {};
    for (var cell = 0; cell < 9; cell++) {
      var tid = grid[cell]; if (tid < 0) continue;
      var dst = cell === mvFrom ? hole : cell;
      posMap[tid] = [mix(cell % 3, dst % 3, cell === mvFrom ? fr : 0), mix((cell / 3) | 0, (dst / 3) | 0, cell === mvFrom ? fr : 0)];
    }
    return posMap;
  }
  for (var idNum = 0; idNum < 8; idNum++) {
    (function (tid) {
      var tile = C.shape(c.graph, c.cut, c.cut.id + ' / xmSlide tile ' + tid, c.parent, H.roundRectCmds(0, 0, ts, ts, 7 * u), { fill: tid === 0 ? acc(c) : sc.fg, alpha: 1 });
      C.sample(c.graph, tile, c.cut.start, c.cut.end, function (f0) {
        var ph0 = phaseOf(c, f0, true); if (!ph0.ok) return { alpha: 0 };
        var pos = boardAt(ph0.t)[tid] || [tid % 3, (tid / 3) | 0];
        var e = ein(ph0.t, 0.3, tid * 0.035, E.outBack) * ph0.o;
        var pt = H.toScene(c, sp.x + pos[0] * (ts + g) + ts / 2, sp.y + pos[1] * (ts + g) + ts / 2);
        return { 'position.x': pt[0], 'position.y': pt[1], 'scale.x': Math.max(0.01, e), 'scale.y': Math.max(0.01, e), alpha: (tid === 0 ? 1 : 0.6 + 0.3 * (tid % 2)) * (e > 0.01 ? 1 : 0) };
      });
    })(idNum);
  }
  return { spot: sp };
});

/* 14. xmGears */
reg('xmGears', 'front', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var k = P.big ? 1.9 : 1.5, R1 = 56 * u * k, N1 = 12, N2 = 7, R2 = R1 * N2 / N1, md = 9 * u * k, phi = -28 * DEG;
  var w = R1 + (R1 + R2) * Math.cos(phi) + R2 + md * 2 + 8 * u, h = R1 * 2 + md * 2 + 26 * u * k;
  var sp = spotBox(c, bb, w, h, P, 14 * u), fl = P.right ? -1 : 1;
  var c1x = fl > 0 ? sp.x + md + 4 * u + R1 : sp.x + w - md - 4 * u - R1, c1y = sp.y + h - md - 4 * u - R1;
  var c2x = c1x + fl * (R1 + R2) * Math.cos(phi), c2y = c1y + (R1 + R2) * Math.sin(phi), ph2 = fl > 0 ? phi : Math.PI - phi;
  function gearCmds(Rp, N) {
    var ro = Rp + md * 0.5, ri = Rp - md * 0.6, Pt = TAU / N, cmds = [];
    for (var i = 0; i < N; i++) {
      [[0.2, ri], [0.31, ro], [0.69, ro], [0.8, ri]].forEach(function (pair, j) {
        var a = (i + pair[0]) * Pt;
        cmds.push([i || j ? 'L' : 'M', Math.cos(a) * pair[1], -Math.sin(a) * pair[1]]);
      });
    }
    cmds.push(['Z']);
    return cmds;
  }
  var rig1 = c.graph.add('null', c.cut.id + ' / xmGear1 rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, c1x, c1y) });
  C.shape(c.graph, c.cut, c.cut.id + ' / xmGear1 teeth', rig1, gearCmds(R1, N1), { stroke: sc.fg, width: Math.max(1, 2.4 * u), alpha: 1 });
  C.shape(c.graph, c.cut, c.cut.id + ' / xmGear1 hub', rig1, G.ellipse(0, 0, R1 * 0.2, R1 * 0.2), { stroke: sc.fg, width: Math.max(1, 2.4 * u), alpha: 1 });
  var rig2 = c.graph.add('null', c.cut.id + ' / xmGear2 rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, c2x, c2y) });
  C.shape(c.graph, c.cut, c.cut.id + ' / xmGear2 body', rig2, gearCmds(R2, N2), { fill: P.accent ? sc.fg : acc(c), alpha: 1 });
  C.shape(c.graph, c.cut, c.cut.id + ' / xmGear2 hole', rig2, G.ellipse(0, 0, R2 * 0.26, R2 * 0.26), { fill: sc.bg, alpha: 1 });
  C.sample(c.graph, rig1, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0, true); if (!q.ok) return { 'scale.x': 0.01, 'scale.y': 0.01 };
    var e = ein(q.t, 0.5, 0, E.outBack) * q.o, w0 = q.t * 0.75 * spFactor(c) + (1 - ein(q.t, 0.9, 0, E.outCubic)) * 3;
    return { rotation: -((ph2 + w0) / DEG), 'scale.x': Math.max(0.01, e), 'scale.y': Math.max(0.01, e) };
  });
  C.sample(c.graph, rig2, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0, true); if (!q.ok) return { 'scale.x': 0.01, 'scale.y': 0.01 };
    var e2 = ein(q.t, 0.5, 0.12, E.outBack) * q.o, w0 = q.t * 0.75 * spFactor(c) + (1 - ein(q.t, 0.9, 0, E.outCubic)) * 3;
    return { rotation: -((ph2 + Math.PI - 0.5 * TAU / N2 - w0 * N1 / N2) / DEG), 'scale.x': Math.max(0.01, e2), 'scale.y': Math.max(0.01, e2) };
  });
  return { gear1: rig1, gear2: rig2 };
});

/* 15. xmSortBars */
reg('xmSortBars', 'front', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), s = H.p(P, 'seed', c.cut.seed || 15);
  var N = 8 + cl(H.p(P, 'n', 1) | 0, 1, 3) * 2, k = P.big ? 1.9 : 1.5, bwid = 9 * u * k, pit = 15 * u * k, hm = 84 * u * k;
  var sp = spotBox(c, bb, N * pit, hm + 8 * u, P, 14 * u), yb = sp.y + sp.h - 3 * u;
  var arr = []; for (var i = 0; i < N; i++) arr.push(i);
  for (var i2 = N - 1; i2 > 0; i2--) { var j = R.hash(s, i2, 3) % (i2 + 1), tmp = arr[i2]; arr[i2] = arr[j]; arr[j] = tmp; }
  H.line(c, 'xmSortBars base', [[sp.x, yb + 3 * u], [sp.x + N * pit, yb + 3 * u]], sub(c), 1.4 * u, 0.8);
  var sw = [], cArr = arr.slice();
  for (var a = 0; a < N; a++) for (var b = 0; b < N - 1 - a; b++) if (cArr[b] > cArr[b + 1]) { var t = cArr[b]; cArr[b] = cArr[b + 1]; cArr[b + 1] = t; sw.push(b); }
  var stepT = cl((((c.cut && c.cut.dur) || 3) - 1.3) / Math.max(1, sw.length), 0.05, 0.2);
  for (var bi = 0; bi < N; bi++) {
    (function (val) {
      var barH = hm * (val + 1) / N;
      var bid = C.shape(c.graph, c.cut, c.cut.id + ' / xmSortBar ' + val, c.parent, G.rect(-bwid / 2, 0, bwid, barH), { fill: val === N - 1 ? acc(c) : sc.fg, alpha: 0.9 });
      C.sample(c.graph, bid, c.cut.start, c.cut.end, function (f0) {
        var ph0 = phaseOf(c, f0, true); if (!ph0.ok) return { alpha: 0 };
        var ph = Math.max(0, (ph0.t - 0.5) / stepT), m = Math.min(Math.floor(ph), sw.length), cur = arr.slice();
        for (var q = 0; q < m; q++) { var b2 = sw[q], t2 = cur[b2]; cur[b2] = cur[b2 + 1]; cur[b2 + 1] = t2; }
        var posIdx = cur.indexOf(val), swIdx = m < sw.length && ph0.t > 0.5 ? sw[m] : -1, fr = E.inOutCubic(cl((ph - m) / 0.8));
        var dx = posIdx === swIdx ? fr : (swIdx >= 0 && posIdx === swIdx + 1 ? -fr : 0);
        var e = ein(ph0.t, 0.35, posIdx * 0.02, E.outBack) * ph0.o;
        var pt = H.toScene(c, sp.x + (posIdx + dx) * pit + pit / 2, yb);
        return { 'position.x': pt[0], 'position.y': pt[1], 'scale.y': Math.max(0.01, e), alpha: 0.9 * (e > 0.01 ? 1 : 0) };
      });
    })(arr[bi]);
  }
  return { count: N };
});

/* 16. xmPie */
reg('xmPie', 'front', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), s = H.p(P, 'seed', c.cut.seed || 16);
  var Rd = (P.big ? 124 : 96) * u, sp = spotBox(c, bb, Rd * 2 + 50 * u, Rd * 2 + 50 * u, P, 14 * u);
  var K = 3 + cl(H.p(P, 'n', 1) | 0, 1, 3), fr = [], sum = 0;
  for (var i = 0; i < K; i++) { fr.push(R.rr(0.6, 1.7, s, i, 1)); sum += fr[i]; }
  var cols = [acc(c), sc.fg, sub(c), sc.fg, acc2(c), sub(c)];
  var rig = c.graph.add('null', c.cut.id + ' / xmPie rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, sp.cx, sp.cy) });
  var a0 = H.p(P, 'r', 0.3) * TAU;
  for (var k = 0; k < K; k++) {
    (function (idx, sa, ea) {
      var am = (sa + ea) / 2, gp = 1.6 * DEG, pts = [], n = 16;
      for (var q = 0; q <= n; q++) { var a = mix(sa + gp, ea - gp, q / n); pts.push([Math.cos(a) * Rd, Math.sin(a) * Rd]); }
      for (var q2 = n; q2 >= 0; q2--) { var a2 = mix(sa + gp * 2, ea - gp * 2, q2 / n); pts.push([Math.cos(a2) * Rd * 0.44, Math.sin(a2) * Rd * 0.44]); }
      var wid = C.shape(c.graph, c.cut, c.cut.id + ' / xmPie wedge ' + idx, rig,
        pts.map(function (pt, m) { return [m ? 'L' : 'M', pt[0], -pt[1]]; }).concat([['Z']]),
        { fill: cols[idx % cols.length], alpha: idx === 0 ? 1 : 0.85 });
      C.sample(c.graph, wid, c.cut.start, c.cut.end, function (f0) {
        var q = phaseOf(c, f0, true); if (!q.ok) return { alpha: 0 };
        var e = ein(q.t, 0.36, idx * 0.07, E.outBack) * q.o;
        var off = idx === 0 ? (12 + 10 * Math.exp(-mod(q.t, 0.5) * 7)) * u : 0;
        return { 'position.x': Math.cos(am) * off, 'position.y': -Math.sin(am) * off, 'scale.x': Math.max(0.01, e), 'scale.y': Math.max(0.01, e), alpha: e > 0.01 ? (idx === 0 ? 1 : 0.85) : 0 };
      });
    })(k, a0, a0 + fr[k] / sum * TAU);
    a0 += fr[k] / sum * TAU;
  }
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0, true);
    return { rotation: -(q.t * 9 * spFactor(c) * (P.right ? 1 : -1)) };
  });
  return { wedges: K };
});

/* 17. xmScatter */
reg('xmScatter', 'front', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), s = H.p(P, 'seed', c.cut.seed || 17);
  var w = (P.big ? 330 : 260) * u, h = w * 0.72, sp = spotBox(c, bb, w, h, P, 14 * u);
  var x0 = sp.x + 10 * u, y0 = sp.y + h - 10 * u, pw = w - 18 * u, phh = h - 18 * u, M = 10 + cl(H.p(P, 'n', 1) | 0, 1, 3) * 5;
  var up = (H.p(P, 'v', 0) | 0) % 2 === 0;
  function fy(x) { return up ? 0.14 + 0.7 * x : 0.86 - 0.7 * x; }
  var axId = H.poly(c, 'xmScatter axes', [[x0, y0 - phh], [x0, y0], [x0 + pw, y0]], false, { stroke: sc.fg, width: Math.max(1, 2.6 * u), alpha: 1 });
  C.sample(c.graph, axId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0, true); return { alpha: q.ok ? q.o * ein(q.t, 0.45, 0, E.outCubic) : 0 };
  });
  for (var i = 0; i < M; i++) {
    (function (idx) {
      var xp = 0.06 + 0.88 * R.random(s, idx, 1), yp = cl(fy(xp) + R.rs(s, idx, 2) * 0.15, 0.04, 0.97);
      var did = H.circle(c, 'xmScatter pt ' + idx, x0 + xp * pw, y0 - yp * phh, 5.5 * u, 5.5 * u, { fill: idx % 6 === 2 ? acc2(c) : sc.fg, alpha: 0.95 });
      C.sample(c.graph, did, c.cut.start, c.cut.end, function (f0) {
        var q = phaseOf(c, f0, true); if (!q.ok) return { alpha: 0 };
        var s0 = ein(q.t, 0.26, 0.3 + idx * 0.05, E.outBack) * q.o;
        return { 'scale.x': Math.max(0.01, s0), 'scale.y': Math.max(0.01, s0), alpha: s0 > 0.01 ? 0.95 : 0 };
      });
    })(i);
  }
  var trendId = H.line(c, 'xmScatter trend', [[x0 + 0.03 * pw, y0 - fy(0.03) * phh], [x0 + 0.97 * pw, y0 - fy(0.97) * phh]], acc(c), 3.2 * u, 1);
  C.sample(c.graph, trendId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0, true); if (!q.ok) return { alpha: 0 };
    var l = ein(q.t, 0.5, 0.45 + M * 0.05, E.inOutCubic);
    return { 'scale.x': Math.max(0.01, l), alpha: l > 0.01 ? q.o : 0 };
  });
  return { count: M };
});

/* 18. xmBeatSteps */
reg('xmBeatSteps', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, sc = c.sc, u = H.decU(c), bb = H.decBB(c), m = H.decMG(c);
  var K = 8, s2 = (P.big ? 40 : 30) * u, g = s2 * 0.55, wid = K * s2 + (K - 1) * g;
  var bd = bandBox(c, bb, s2 * 1.7, P.low, 18 * u), cx = cl(bb.cx, m + wid / 2, W - m - wid / 2), yc = bd.y + bd.h / 2;
  for (var i = 0; i < K; i++) {
    (function (idx) {
      var x = cx - wid / 2 + idx * (s2 + g) + s2 / 2, pt = H.toScene(c, x, yc);
      var offId = C.shape(c.graph, c.cut, c.cut.id + ' / xmBeatStep box ' + idx, c.parent, G.rect(-s2 * 0.4, -s2 * 0.4, s2 * 0.8, s2 * 0.8), { stroke: sc.fg, width: Math.max(1, 2.2 * u), alpha: 0.8 });
      var onId = C.shape(c.graph, c.cut, c.cut.id + ' / xmBeatStep on ' + idx, c.parent, G.rect(-s2 / 2, -s2 / 2, s2, s2), { fill: acc(c), alpha: 1 });
      c.graph.byId[offId].attrs.position = pt; c.graph.byId[onId].attrs.position = pt;
      C.sample(c.graph, offId, c.cut.start, c.cut.end, function (f0) {
        var ph = phaseOf(c, f0, true); if (!ph.ok) return { alpha: 0 };
        var cur = mod(Math.floor(ph.t / 0.5), K), e = ein(ph.t, 0.3, idx * 0.03, E.outBack) * ph.o;
        return { alpha: idx === cur ? 0 : (idx < cur ? 0.6 : 0.8) * e };
      });
      C.sample(c.graph, onId, c.cut.start, c.cut.end, function (f0) {
        var ph = phaseOf(c, f0, true); if (!ph.ok) return { alpha: 0 };
        var cur = mod(Math.floor(ph.t / 0.5), K); if (idx !== cur) return { alpha: 0 };
        var pulse = Math.exp(-mod(ph.t, 0.5) * 7), sc0 = (1 + 0.4 * pulse) * ein(ph.t, 0.3, idx * 0.03, E.outBack) * ph.o;
        return { 'scale.x': sc0, 'scale.y': sc0, alpha: ph.o };
      });
    })(i);
  }
  return { steps: K };
});

/* 19. xmGauge */
reg('xmGauge', 'front', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), s = H.p(P, 'seed', c.cut.seed || 19);
  var Rd = (P.big ? 140 : 108) * u, sp = spotBox(c, bb, Rd * 2 + 24 * u, Rd + 30 * u, P, 14 * u);
  var cx = sp.cx, cy = sp.y + sp.h - 14 * u;
  var arcId = H.poly(c, 'xmGauge arc', H.arcPts(cx, cy, Rd, 180, 360, 28), false, { stroke: sc.fg, width: Math.max(1, 2.6 * u), alpha: 1 });
  var redId = H.poly(c, 'xmGauge hot', H.arcPts(cx, cy, Rd - 7 * u, 310, 360, 12), false, { stroke: acc(c), width: Math.max(2, 6 * u), alpha: 1 });
  var tk = [];
  for (var i = 0; i <= 10; i++) {
    var a = (180 + i * 18) * DEG, l = (i % 5 === 0 ? 22 : 12) * u;
    tk.push([cx + Math.cos(a) * (Rd - 3 * u), cy + Math.sin(a) * (Rd - 3 * u), cx + Math.cos(a) * (Rd - 3 * u - l), cy + Math.sin(a) * (Rd - 3 * u - l)]);
  }
  C.shape(c.graph, c.cut, c.cut.id + ' / xmGauge ticks', c.parent, H.segCmds(c, tk), { stroke: sc.fg, width: Math.max(0.8, 1.8 * u), alpha: 1 });
  var needle = C.shape(c.graph, c.cut, c.cut.id + ' / xmGauge needle', c.parent, [['M', -10 * u, 0], ['L', Rd * 0.84, 0]], { stroke: acc(c), width: Math.max(1.5, 4 * u), alpha: 1 });
  c.graph.byId[needle].attrs.position = H.toScene(c, cx, cy);
  H.circle(c, 'xmGauge pivot', cx, cy, 8 * u, 8 * u, { fill: sc.fg, alpha: 1 });
  C.sample(c.graph, needle, c.cut.start, c.cut.end, function (f0) {
    var ph = phaseOf(c, f0, true); if (!ph.ok) return { alpha: 0 };
    var e = cl(0.42 + 0.3 * R.noise1(ph.env.t * 1.7, s) + 0.3 * Math.exp(-mod(ph.t, 0.5) * 6));
    var v = mix(1 - Math.abs(1 - cl(ph.t / 0.5) * 2), e, cl((ph.t - 0.45) / 0.25));
    return { rotation: -(180 + cl(v, 0.02, 0.98) * 180), alpha: ph.o * cl(ph.t / 0.15) };
  });
  [arcId, redId].forEach(function (id, idx) {
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
      var ph = phaseOf(c, f0, true); if (!ph.ok) return { alpha: 0 };
      var e = ein(ph.t, 0.5, 0, E.outCubic);
      return { alpha: ph.o * (idx ? (e > 0.72 ? e : 0) : e) };
    });
  });
  return { needle: needle };
});

/* 20. xmHatch */
reg('xmHatch', 'front', function (c) {
  var P = c.preset.params || {}, u = H.decU(c), bb = H.decBB(c);
  var f = frameBox(c, bb, padBB(bb, u, 0.8)), d = (18 + cl(H.p(P, 'n', 1) | 0, 1, 3) * 11) * u;
  var dx = P.right ? d : -d, dy = P.low ? d : -d, x0 = f.x0 + dx, y0 = f.y0 + dy, sp = 11 * u;
  var cnt = Math.min(80, Math.ceil((f.w + f.h) / sp) + 1), segs = [];
  for (var k = 0; k < cnt; k++) {
    var xs = x0 + k * sp;
    segs.push([xs, y0, xs - f.h, y0 + f.h]);
  }
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / xmHatch', c.parent, H.segCmds(c, segs), { stroke: colOf(c, P), width: Math.max(1, 2.2 * u), alpha: 0.85 });
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
    var ph = phaseOf(c, f0, true); if (!ph.ok) return { alpha: 0 };
    return { alpha: 0.85 * ph.o * ein(ph.t, 0.55, 0, E.inOutCubic) };
  });
  return { layer: id };
});

/* 21. xmPolyGrow (back) */
reg('xmPolyGrow', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = H.decU(c), col = lnC(c);
  var m = Math.min(W, Hh), dir = P.right ? 1 : -1;
  var cx = P.corner ? W * (P.right ? 0.8 : 0.2) : W * 0.5, cy = P.corner ? Hh * (P.low ? 0.74 : 0.26) : Hh * 0.5;
  var R0 = m * (P.corner ? 0.25 : 0.4) * (P.big ? 1.12 : 1), rig = c.graph.add('null', c.cut.id + ' / xmPolyGrow rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, cx, cy) });
  var sides = 5 + ((H.p(P, 'v', 0) | 0) % 4), ptsA = [], ptsB = [];
  for (var i = 0; i < sides; i++) {
    var a = i * TAU / sides - 90 * DEG;
    ptsA.push([Math.cos(a) * R0, Math.sin(a) * R0]);
    ptsB.push([Math.cos(a) * R0 * 0.62, Math.sin(a) * R0 * 0.62]);
  }
  var polyA = C.shape(c.graph, c.cut, c.cut.id + ' / xmPolyGrow outer', rig, ptsA.map(function (pt, idx) { return [idx ? 'L' : 'M', pt[0], -pt[1]]; }).concat([['Z']]), { stroke: col, width: Math.max(1.5, 4.5 * u), alpha: 0.9 });
  var polyB = C.shape(c.graph, c.cut, c.cut.id + ' / xmPolyGrow inner', rig, ptsB.map(function (pt, idx) { return [idx ? 'L' : 'M', pt[0], -pt[1]]; }).concat([['Z']]), { stroke: col, width: Math.max(1, 2.4 * u), alpha: 0.8 });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
    var ph = phaseOf(c, f0, false); if (!ph.ok) return { 'scale.x': 0.01, 'scale.y': 0.01 };
    var e = ein(ph.t, 0.5, 0, E.outCubic);
    return { rotation: -(dir * ph.t * 6), 'scale.x': Math.max(0.01, e), 'scale.y': Math.max(0.01, e) };
  });
  C.sample(c.graph, polyA, c.cut.start, c.cut.end, function (f0) { return { alpha: 0.9 * phaseOf(c, f0, false).o }; });
  C.sample(c.graph, polyB, c.cut.start, c.cut.end, function (f0) { return { alpha: 0.8 * phaseOf(c, f0, false).o, rotation: dir * phaseOf(c, f0, false).t * 15 }; });
  return { rig: rig };
});

/* 22. xmTriLattice (back) */
reg('xmTriLattice', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = H.decU(c), s = H.p(P, 'seed', c.cut.seed || 22);
  var m = Math.min(W, Hh), sd = m * 0.088 * (P.big ? 1.2 : 1), hT = sd * 0.866, col = dimC(c);
  var ox = P.right ? W : 0, oy = P.low ? Hh : 0, sx = P.right ? -1 : 1, sy = P.low ? -1 : 1;
  var reach = m * (0.5 + 0.06 * cl(H.p(P, 'n', 1) | 0, 1, 3)), rows = Math.min(10, Math.ceil(reach / hT)), cols = Math.min(12, Math.ceil(reach / (sd / 2)));
  var fillTris = [], strokeTris = [], accTris = [];
  for (var r = 0; r < rows; r++) for (var q = -1; q < cols; q++) {
    var upT = (q + r) % 2 === 0, gx = (q + 1) * sd / 2, gy = (r + 0.5) * hT, dd = Math.hypot(gx, gy) / reach;
    if (dd > 0.98) continue;
    var ya = (upT ? r + 1 : r) * hT, yb = (upT ? r : r + 1) * hT;
    var pts = [[ox + sx * q * sd / 2, oy + sy * ya], [ox + sx * (q + 2) * sd / 2, oy + sy * ya], [ox + sx * gx, oy + sy * yb]];
    var h = R.random(s, r, q, 2);
    if (h < 0.08) accTris.push(pts);
    else if (h < 0.48) fillTris.push(pts);
    else strokeTris.push(pts);
  }
  var id1 = fillTris.length ? C.shape(c.graph, c.cut, c.cut.id + ' / xmTriFill', c.parent, H.polyCmds(c, fillTris, true), { fill: col, alpha: 0.45 }) : null;
  var id2 = strokeTris.length ? C.shape(c.graph, c.cut, c.cut.id + ' / xmTriLine', c.parent, H.polyCmds(c, strokeTris, true), { stroke: col, width: Math.max(0.8, 1.6 * u), alpha: 0.65 }) : null;
  var id3 = accTris.length ? C.shape(c.graph, c.cut, c.cut.id + ' / xmTriAcc', c.parent, H.polyCmds(c, accTris, true), { fill: acc(c), alpha: 0.28 }) : null;
  [id1, id2, id3].forEach(function (id, idx) {
    if (!id) return;
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
      var ph = phaseOf(c, f0, false); if (!ph.ok) return { alpha: 0 };
      return { alpha: (idx === 0 ? 0.45 : idx === 1 ? 0.65 : 0.28) * ph.o * ein(ph.t, 0.5, idx * 0.08, E.outCubic) };
    });
  });
  return { count: fillTris.length + strokeTris.length + accTris.length };
});

/* 23. xmDotWave (back) */
reg('xmDotWave', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, m = Math.min(W, Hh), d = m * 0.042;
  var strip = (H.p(P, 'v', 0) | 0) >= 3, cols = Math.min(36, Math.floor(W * 0.92 / d)), rows = Math.min(18, Math.max(3, Math.round(Hh * (strip ? 0.2 : 0.52) / d)));
  var cy = strip ? Hh * (P.low ? 0.82 : 0.18) : Hh * 0.5, x0 = W / 2 - (cols - 1) * d / 2, y0 = cy - (rows - 1) * d / 2;
  var dots = [], lit = [];
  for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
    var x = x0 + i * d, y = y0 + j * d;
    dots.push([x, y, d * 0.14]);
    if ((i + j) % 5 === 0) lit.push([x, y, d * 0.22]);
  }
  var id1 = C.shape(c.graph, c.cut, c.cut.id + ' / xmDotWave base', c.parent, H.dotCmds(c, dots), { fill: dimC(c), alpha: 0.9 });
  var id2 = lit.length ? C.shape(c.graph, c.cut, c.cut.id + ' / xmDotWave hi', c.parent, H.dotCmds(c, lit), { fill: colOf(c, P), alpha: 0.3 }) : null;
  C.sample(c.graph, id1, c.cut.start, c.cut.end, function (f0) {
    var ph = phaseOf(c, f0, false); return { alpha: ph.ok ? 0.9 * ph.o * ein(ph.t, 0.4) : 0 };
  });
  if (id2) C.sample(c.graph, id2, c.cut.start, c.cut.end, function (f0) {
    var ph = phaseOf(c, f0, false); if (!ph.ok) return { alpha: 0 };
    return { alpha: 0.3 * ph.o * (0.5 + 0.5 * Math.sin(ph.t * 2.6 * spFactor(c))) };
  });
  return { dots: dots.length };
});

/* 24. xmContour (back) */
reg('xmContour', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = H.decU(c), s = H.p(P, 'seed', c.cut.seed || 24);
  var m = Math.min(W, Hh), col = lnC(c), ax = W > Hh ? 1.4 : 1, ay = Hh > W ? 1.4 : 1, M = 48;
  var hills = cl(H.p(P, 'n', 1) | 0, 1, 3) >= 2 ? 2 : 1, ids = [];
  for (var hI = 0; hI < hills; hI++) {
    var cx = W * (hI ? R.rr(0.12, 0.88, s, hI, 1) : R.rr(0.38, 0.62, s, 0, 1));
    var cy = Hh * (hI ? R.rr(0.15, 0.85, s, hI, 2) : R.rr(0.4, 0.6, s, 0, 2));
    var Rm = m * (hI ? 0.24 : 0.5), K = hI ? 4 : (P.big ? 7 : 6);
    var f1 = R.random(s, hI, 3) * TAU, f2 = R.random(s, hI, 4) * TAU, f3 = R.random(s, hI, 5) * TAU;
    for (var k = 0; k < K; k++) {
      (function (ringIdx, delay) {
        var rad = Rm * (ringIdx + 0.6) / K, pts = [], wk = 0.5 + 0.5 * ringIdx / K;
        for (var i = 0; i <= M; i++) {
          var th = i / M * TAU + f1, wob = 0.17 * Math.sin(2 * th + f1 + ringIdx * 0.25) + 0.1 * Math.sin(3 * th + f2 - ringIdx * 0.2) + 0.05 * Math.sin(5 * th + f3 + ringIdx * 0.3);
          pts.push([cx + Math.cos(th) * rad * (1 + wob * wk) * ax, cy + Math.sin(th) * rad * (1 + wob * wk) * ay]);
        }
        var id = H.poly(c, 'xmContour ' + hI + '_' + ringIdx, pts, true, { stroke: col, width: Math.max(1, (ringIdx % 3 === 0 ? 3.4 : 2) * u), alpha: 0.9 });
        C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
          var ph = phaseOf(c, f0, false); if (!ph.ok) return { alpha: 0 };
          var e = ein(ph.t, 0.8, delay, E.inOutCubic);
          return { alpha: 0.9 * ph.o * e };
        });
        ids.push(id);
      })(k, (K - 1 - k) * 0.06 + hI * 0.2);
    }
  }
  return { rings: ids.length };
});

/* 25. xmMoire (back) */
reg('xmMoire', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = H.decU(c), m = Math.min(W, Hh), col = lnC(c);
  var K = 12 + cl(H.p(P, 'n', 1) | 0, 1, 3) * 2, spc = m * 0.03;
  var cx = P.corner ? W * (P.right ? 0.78 : 0.22) : W * 0.5, cy = P.corner ? Hh * (P.low ? 0.72 : 0.28) : Hh * 0.5;
  var rings = []; for (var k = 0; k < K; k++) rings.push([W / 2, Hh / 2, spc * (k + 1)]);
  var cmds = H.ringCmds(c, rings, 36);
  var rA = c.graph.add('null', c.cut.id + ' / xmMoire rigA', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, cx, cy) });
  var rB = c.graph.add('null', c.cut.id + ' / xmMoire rigB', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, cx, cy) });
  var idA = C.shape(c.graph, c.cut, c.cut.id + ' / xmMoire A', rA, cmds, { stroke: col, width: Math.max(1, 2.4 * u), alpha: 0.75 });
  var idB = C.shape(c.graph, c.cut, c.cut.id + ' / xmMoire B', rB, cmds, { stroke: col, width: Math.max(1, 2.4 * u), alpha: 0.75 });
  var scCenter = H.toScene(c, cx, cy), dir = P.right ? 1 : -1, ph0 = H.p(P, 'r', 0.5) * TAU;
  [rA, rB].forEach(function (rg, q) {
    C.sample(c.graph, rg, c.cut.start, c.cut.end, function (f0) {
      var ph = phaseOf(c, f0, false), an = ph.t * 0.4 * spFactor(c) * dir + ph0, d = spc * 1.5 * ein(ph.t, 0.8, 0, E.outCubic);
      var sgn = q ? 1 : -1;
      return { 'position.x': scCenter[0] + Math.cos(an) * d * sgn, 'position.y': scCenter[1] - Math.sin(an) * d * sgn };
    });
  });
  [idA, idB].forEach(function (id) {
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
      var ph = phaseOf(c, f0, false); return { alpha: ph.ok ? 0.75 * ph.o * ein(ph.t, 0.5) : 0 };
    });
  });
  return { rings: K * 2 };
});

/* 26. xmTruchet (back) */
reg('xmTruchet', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = H.decU(c), s = H.p(P, 'seed', c.cut.seed || 26);
  var m = Math.min(W, Hh), cell = m * 0.092 * (P.big ? 1.2 : 1), col = lnC(c);
  var ox = P.right ? W : 0, oy = P.low ? Hh : 0, sx = P.right ? -1 : 1, sy = P.low ? -1 : 1;
  var reach = m * (0.5 + 0.05 * cl(H.p(P, 'n', 1) | 0, 1, 3)), nn = Math.min(8, Math.ceil(reach / cell));
  var arcA = H.arcPts(-cell / 2, -cell / 2, cell / 2, 0, 90, 10), arcB = H.arcPts(cell / 2, cell / 2, cell / 2, 180, 270, 10);
  var cmds = [];
  arcA.forEach(function (pt, i) { cmds.push([i ? 'L' : 'M', pt[0], -pt[1]]); });
  arcB.forEach(function (pt, i) { cmds.push([i ? 'L' : 'M', pt[0], -pt[1]]); });
  var T = 2.8 / spFactor(c), count = 0;
  for (var j = 0; j < nn; j++) for (var i = 0; i < nn; i++) {
    var gx = (i + 0.5) * cell, gy = (j + 0.5) * cell, dd = Math.hypot(gx, gy) / reach, fall = cl((1 - dd) * 1.7);
    if (fall <= 0) continue;
    (function (ii, jj, xPos, yPos, dNorm, fl) {
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / xmTruchet ' + ii + '_' + jj, c.parent, cmds, { stroke: col, width: Math.max(1.2, 3.6 * u), alpha: fl * 0.9 });
      c.graph.byId[id].attrs.position = H.toScene(c, xPos, yPos);
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
        var ph = phaseOf(c, f0, false); if (!ph.ok) return { alpha: 0 };
        var e = ein(ph.t, 0.4, dNorm * 0.55 + R.random(s, ii, jj, 1) * 0.2, E.outBack);
        if (e <= 0.01) return { alpha: 0 };
        var phT = (ph.t + R.random(s, ii, jj, 2) * T) / T, fl0 = Math.floor(phT);
        var turn = (R.hash(s, ii, jj, 3) & 1) + fl0 - 1 + E.inOutCubic(cl((phT - fl0) * T / 0.4));
        return { rotation: -(turn * 90), 'scale.x': e, 'scale.y': e, alpha: fl * ph.o * 0.9 };
      });
      count++;
    })(i, j, ox + sx * gx, oy + sy * gy, dd, fall);
  }
  return { tiles: count };
});

/* 27. xmSpiro (back) */
reg('xmSpiro', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = H.decU(c), m = Math.min(W, Hh);
  var tbl = [[5, 3, 2.2], [7, 3, 2.4], [8, 5, 3.6], [7, 2, 1.6], [9, 4, 3], [10, 3, 2.4]][mod(H.p(P, 'v', 0) | 0, 6)];
  var a = tbl[0], b = tbl[1], d = tbl[2], cx = P.corner ? W * (P.right ? 0.78 : 0.22) : W * 0.5, cy = P.corner ? Hh * (P.low ? 0.72 : 0.28) : Hh * 0.5;
  var S = m * (P.corner ? 0.25 : 0.4) * (P.big ? 1.1 : 1) / (a - b + d), n = Math.min(220, 48 * b), pts = [];
  for (var i = 0; i <= n; i++) {
    var th = i / n * TAU * b;
    pts.push([((a - b) * Math.cos(th) + d * Math.cos((a - b) / b * th)) * S, -((a - b) * Math.sin(th) - d * Math.sin((a - b) / b * th)) * S]);
  }
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / xmSpiro', c.parent, pts.map(function (pt, idx) { return [idx ? 'L' : 'M', pt[0], pt[1]]; }), { stroke: lnC(c), width: Math.max(1, 2.6 * u), alpha: 0.95 });
  c.graph.byId[id].attrs.position = H.toScene(c, cx, cy);
  var dir = P.right ? 1 : -1, r0 = H.p(P, 'r', 0) * 360;
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
    var ph = phaseOf(c, f0, false); if (!ph.ok) return { alpha: 0 };
    var q = E.inOutCubic(cl(ph.t / 1.9));
    return { rotation: -(ph.t * 4 * spFactor(c) * dir + r0), 'scale.x': 0.8 + 0.2 * q, 'scale.y': 0.8 + 0.2 * q, alpha: 0.95 * ph.o * cl(q * 2) };
  });
  return { layer: id };
});

/* 28. xmIris (back) */
reg('xmIris', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = H.decU(c), m = Math.min(W, Hh), col = lnC(c);
  var N = 5 + cl(H.p(P, 'n', 1) | 0, 1, 3), cx = P.corner ? W * (P.right ? 0.78 : 0.22) : W * 0.5, cy = P.corner ? Hh * (P.low ? 0.7 : 0.3) : Hh * 0.5;
  var Rd = m * (P.corner ? 0.27 : 0.42) * (P.big ? 1.08 : 1), rig = c.graph.add('null', c.cut.id + ' / xmIris rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, cx, cy) });
  C.shape(c.graph, c.cut, c.cut.id + ' / xmIris ring1', rig, G.ellipse(0, 0, Rd, Rd), { stroke: col, width: Math.max(1.5, 4 * u), alpha: 0.9 });
  C.shape(c.graph, c.cut, c.cut.id + ' / xmIris ring2', rig, G.ellipse(0, 0, Rd * 1.05, Rd * 1.05), { stroke: col, width: Math.max(1, 1.8 * u), alpha: 0.7 });
  var r = Rd * 0.42, I = [];
  for (var k = 0; k < N; k++) { var a = k * TAU / N; I.push([Math.cos(a) * r, Math.sin(a) * r]); }
  var bladeCmds = [];
  for (var k2 = 0; k2 < N; k2++) {
    var A = I[k2], B = I[(k2 + 1) % N], L = Math.hypot(A[0] - B[0], A[1] - B[1]) || 1, dx = (A[0] - B[0]) / L, dy = (A[1] - B[1]) / L;
    var pd = A[0] * dx + A[1] * dy, sN = -pd + Math.sqrt(Math.max(0, pd * pd - (r * r - Rd * Rd)));
    bladeCmds.push(['M', B[0], -B[1]], ['L', A[0] + dx * sN, -(A[1] + dy * sN)]);
  }
  C.shape(c.graph, c.cut, c.cut.id + ' / xmIris blades', rig, bladeCmds, { stroke: col, width: Math.max(1.2, 3 * u), alpha: 0.9 });
  var dir = P.right ? 1 : -1;
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
    var ph = phaseOf(c, f0, false); if (!ph.ok) return { 'scale.x': 0.01, 'scale.y': 0.01 };
    var e = ein(ph.t, 0.6, 0, E.outCubic);
    return { rotation: -((ph.t * 8 * spFactor(c) + (1 - e) * 70) * dir), 'scale.x': Math.max(0.05, e * ph.o), 'scale.y': Math.max(0.05, e * ph.o) };
  });
  return { rig: rig };
});

/* 29. xmWhirl (back) */
reg('xmWhirl', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = H.decU(c), m = Math.min(W, Hh), col = lnC(c);
  var K = 11 + cl(H.p(P, 'n', 1) | 0, 1, 3) * 2, cx = P.corner ? W * (P.right ? 0.8 : 0.2) : W * 0.5, cy = P.corner ? Hh * (P.low ? 0.72 : 0.28) : Hh * 0.5;
  var dl = 8 * DEG, k2 = 1 / (Math.cos(dl) + Math.sin(dl)), hf = m * (P.corner ? 0.22 : 0.37) * (P.big ? 1.1 : 1) * Math.SQRT2;
  var dir = P.right ? 1 : -1, scP = H.toScene(c, cx, cy);
  for (var k = 0; k < K; k++, hf *= k2) {
    (function (idx, rad) {
      var pts = []; for (var i = 0; i < 4; i++) { var a = 45 * DEG + i * TAU / 4; pts.push([Math.cos(a) * rad, -Math.sin(a) * rad]); }
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / xmWhirl ' + idx, c.parent,
        pts.map(function (pt, i) { return [i ? 'L' : 'M', pt[0], pt[1]]; }).concat([['Z']]),
        { stroke: col, width: Math.max(1, (idx % 4 === 0 ? 3 : 2) * u), alpha: 0.9 });
      c.graph.byId[id].attrs.position = scP;
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
        var ph = phaseOf(c, f0, false); if (!ph.ok) return { alpha: 0 };
        var e = ein(ph.t, 0.45, idx * 0.035, E.outCubic); if (e <= 0) return { alpha: 0 };
        var dA = (8 + 5 * Math.sin(ph.t * 0.5 * spFactor(c) + H.p(P, 'r', 0) * TAU)) * dir;
        var s = 0.85 + 0.15 * e;
        return { rotation: -(idx * dA + ph.t * 3), 'scale.x': s, 'scale.y': s, alpha: 0.9 * ph.o * e };
      });
    })(k, hf);
  }
  return { count: K };
});

/* 30. xmWaves (back) */
reg('xmWaves', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, col = dimC(c);
  var sy = P.low ? 1 : -1, edge = P.low ? Hh + 4 : -4, sp = spFactor(c), n = 36, nVal = cl(H.p(P, 'n', 1) | 0, 1, 3);
  for (var k = 0; k < 3; k++) {
    (function (idx) {
      var yb = Hh * (P.low ? 0.8 + 0.055 * idx : 0.2 - 0.055 * idx), wl = W / (1.25 + 0.55 * idx + 0.2 * nVal), amp = Hh * 0.02 * (1 + 0.25 * idx);
      var pts = [[0, edge]];
      for (var i = 0; i <= n; i++) {
        var x = W * i / n, ph = idx * 1.7 + H.p(P, 'r', 0) * 6;
        pts.push([x, yb + Math.sin(x / wl * TAU + ph) * amp + Math.sin(x / wl * TAU * 0.47 - ph * 0.6) * amp * 0.5]);
      }
      pts.push([W, edge]);
      var id = H.poly(c, 'xmWaves ' + idx, pts, true, { fill: col, alpha: 0.5 });
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
        var q = phaseOf(c, f0, false); if (!q.ok) return { alpha: 0 };
        var e = ein(q.t, 0.6, idx * 0.08, E.outCubic) * q.o;
        return { 'position.y': -(sy * (1 - e) * Hh * 0.26), 'position.x': Math.sin(q.t * (0.9 + 0.5 * idx) * sp) * 28, alpha: 0.5 * (e > 0.01 ? 1 : 0) };
      });
    })(k);
  }
  return { layers: 3 };
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZHelpers);
