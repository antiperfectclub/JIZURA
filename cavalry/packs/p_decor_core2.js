/* JIZURA Cavalry Pack: decor core2 (55 recipes from src/11p_decorB.js) */
(function (N, G, C, R, V, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, TAU = H.TAU, DEG = H.DEG;

function reg(key, layerType, build) {
  N.register('decor', key, {
    source: 'src/11p_decorB.js DEF.' + key,
    scope: 'cut',
    build: function (c) {
      var n0 = c.graph.layers.length;
      var res = build(c);
      if (layerType === 'back') H.placeBackFrom(c, n0);
      return res;
    },
    differences: ['Native Cavalry editable shape/text geometry following src/11p_decorB.js.']
  });
}

function inE(env, d, delay, ease) { return (ease || E.outExpo)(cl((env.lt - (delay || 0)) / (d || 0.4))); }
function outE(env) { return 1 - E.inCubic(env.pOut); }
function FS(c) { return Math.max(12, 16 * H.decU(c)); }
function dark(c) { return H.dark(c.sc.bg); }
function pad2(n, k) { return String(Math.max(0, Math.floor(n))).padStart(k || 2, '0'); }
function wrap(v, lo, span) { return lo + (((v - lo) % span) + span) % span; }
function spot(c, bb, w, h, P, gap) { return P.corner ? H.cornerSpot(c, bb, w, h, P, 1) : H.nearBB(c, bb, w, h, P, gap); }
function acc(c) { return H.accCol(c.sc, c.sc.bg, false); }
function acc2(c) { return H.accCol(c.sc, c.sc.bg, true); }
function bez(p0, p1, p2, p3, n) {
  n = n || 16;
  var o = [];
  for (var i = 0; i <= n; i++) {
    var t = i / n, mt = 1 - t;
    o.push([
      mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0],
      mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1]
    ]);
  }
  return o;
}
function freeRects(c, bb, gap) {
  var W = c.comp.width, Hh = c.comp.height, m = H.decMG(c) * 0.8;
  var out = [
    { x: m, y: m, w: W - 2 * m, h: bb.y0 - gap - m, side: 't' },
    { x: m, y: bb.y1 + gap, w: W - 2 * m, h: Hh - m - bb.y1 - gap, side: 'b' },
    { x: m, y: m, w: bb.x0 - gap - m, h: Hh - 2 * m, side: 'l' },
    { x: bb.x1 + gap, y: m, w: W - m - bb.x1 - gap, h: Hh - 2 * m, side: 'r' }
  ].filter(function (r) { return r.w > 30 && r.h > 30; });
  out.sort(function (a, b) { return Math.min(b.w, b.h * 1.5) - Math.min(a.w, a.h * 1.5); });
  return out;
}
function bandSpot(c, bb, w, h, P, gap) {
  var W = c.comp.width, Hh = c.comp.height, m = H.decMG(c) * 0.8;
  var order = P.low ? [false, true] : [true, false];
  for (var i = 0; i < order.length; i++) {
    var y = order[i] ? bb.y1 + gap : bb.y0 - gap - h;
    if (y >= m && y + h <= Hh - m) {
      var x = cl(bb.cx - w / 2, m, W - m - w);
      return { x: x, y: y, cx: x + w / 2, cy: y + h / 2, ok: true };
    }
  }
  return spot(c, bb, w, h, P, gap);
}
function xfPts(pts, cx, cy, ang, s) {
  var cc = Math.cos(ang || 0), ss = Math.sin(ang || 0), k = s == null ? 1 : s;
  return pts.map(function (pt) { return [cx + (pt[0] * cc - pt[1] * ss) * k, cy + (pt[0] * ss + pt[1] * cc) * k]; });
}

/* 1. kamon */
var KAMON_NAMES = ['\u4e38\u306b\u4e09\u3064\u5df4', '\u4e38\u306b\u4e03\u5b9d', '\u4e38\u306b\u6885\u9262', '\u4e38\u306b\u8f2a\u9055\u3044', '\u4e38\u306b\u4e09\u3064\u8f2a'];
function kamonPaths(kind) {
  var out = [];
  if (kind === 0) {
    for (var k = 0; k < 3; k++) {
      var th0 = (-90 + k * 120) * DEG, sw = 150 * DEG, h0 = 0.27, M = 18, outer = [], inner = [];
      for (var i = 0; i <= M; i++) {
        var t = i / M, th = th0 + t * sw, rc = 0.38 + 0.46 * t, w = h0 * Math.pow(1 - t, 0.85);
        outer.push([Math.cos(th) * (rc + w), Math.sin(th) * (rc + w)]);
        inner.push([Math.cos(th) * (rc - w), Math.sin(th) * (rc - w)]);
      }
      out.push(outer.concat(inner.reverse(), [outer[0]]));
    }
  } else if (kind === 1) {
    for (var k1 = 0; k1 < 4; k1++) { var a1 = k1 * 90; out.push(H.arcPts(Math.cos(a1 * DEG) * 0.5, Math.sin(a1 * DEG) * 0.5, 0.5, 0, 360, 24)); }
    out.push(H.arcPts(0, 0, 0.13, 0, 360, 16));
  } else if (kind === 2) {
    for (var k2 = 0; k2 < 5; k2++) { var a2 = -90 + k2 * 72; out.push(H.arcPts(Math.cos(a2 * DEG) * 0.6, Math.sin(a2 * DEG) * 0.6, 0.3, 0, 360, 20)); }
    out.push(H.arcPts(0, 0, 0.17, 0, 360, 16));
  } else if (kind === 3) {
    out.push(H.arcPts(-0.3, 0, 0.55, 0, 360, 28), H.arcPts(0.3, 0, 0.55, 0, 360, 28));
  } else {
    for (var k3 = 0; k3 < 3; k3++) { var a3 = -90 + k3 * 120; out.push(H.arcPts(Math.cos(a3 * DEG) * 0.4, Math.sin(a3 * DEG) * 0.4, 0.46, 0, 360, 24)); }
  }
  return out;
}
reg('kamon', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var Rr = cl(Math.min(W, Hh) * 0.075, 48 * u, 96 * u), fs = FS(c) * 0.85;
  var sp = spot(c, bb, Rr * 2.3, Rr * 2.3 + fs * 2.2, P, 24 * u), a0 = sp.ok ? 1 : 0.35;
  var cx = sp.cx, cy = sp.y + Rr * 1.15, kind = (H.p(P, 'v', 0) | 0) % 5, lw = Math.max(1, 1.5 * u);
  var ringId = H.circle(c, 'Kamon ring', cx, cy, Rr, Rr, { stroke: sc.fg, width: lw, alpha: a0 });
  H.circle(c, 'Kamon ring2', cx, cy, Rr * 0.9, Rr * 0.9, { stroke: sc.fg, width: Math.max(1, 0.8 * u), alpha: 0.55 * a0 });
  var rig = c.graph.add('null', c.cut.id + ' / Kamon crest', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, cx, cy) });
  var mCmds = [];
  kamonPaths(kind).forEach(function (pts) {
    for (var i = 0; i < pts.length; i++) mCmds.push([i ? 'L' : 'M', pts[i][0] * Rr * 0.8, -pts[i][1] * Rr * 0.8]);
  });
  var crest = C.shape(c.graph, c.cut, c.cut.id + ' / Kamon inner', rig, mCmds, { stroke: P.accent ? acc(c) : sc.fg, width: lw * 1.1, alpha: a0 });
  var spinSpeed = (kind === 0 || kind === 4) ? 8 * (P.right ? 1 : -1) : 0, r0 = kind === 0 ? H.p(P, 'r', 0) * 120 : 0;
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), e = E.outExpo(cl(env.lt / 0.9));
    return { rotation: -((1 - e) * -70 + env.ltb * spinSpeed + r0), 'scale.x': Math.max(0.05, e), 'scale.y': Math.max(0.05, e) };
  });
  C.sample(c.graph, crest, c.cut.start, c.cut.end, function (f) { return { alpha: a0 * outE(R.env(c, f)) }; });
  C.sample(c.graph, ringId, c.cut.start, c.cut.end, function (f) { return { alpha: a0 * E.inOutCubic(cl(R.env(c, f).lt / 0.6)) * outE(R.env(c, f)) }; });
  H.addText(c, 'Kamon title', KAMON_NAMES[kind], cx, cy + Rr + fs * 1.35, fs, { role: 'serif', align: 'center', color: sc.sub }, function (env) {
    return { alpha: a0 * inE(env, 0.4, 0.45, E.outCubic) * outE(env) };
  });
  return { ring: ringId };
});

/* 2. seigaiha (back) */
reg('seigaiha', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), seed = H.p(P, 'seed', c.cut.seed || 19);
  var r = cl(Math.min(W, Hh) * 0.05, 34 * u, 60 * u), sx = P.right ? 1 : -1, sy = P.low ? 1 : -1;
  var pw = W * R.rr(0.42, 0.62, seed, 1), ph = Hh * R.rr(0.45, 0.65, seed, 2);
  var y0 = sy > 0 ? Hh - ph : 0, x0 = sx > 0 ? W - pw : 0, rows = Math.min(12, Math.ceil(ph / (r / 2)) + 1), cols = Math.min(14, Math.ceil(pw / (2 * r)) + 1);
  var polys = [];
  for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
    var x = x0 + i * 2 * r + (j % 2) * r, y = y0 + j * r / 2;
    for (var k = 0; k < 4; k++) polys.push(H.arcPts(x, y, r * (1 - k / 4), 195, 345, 10));
  }
  var col = P.accent ? acc(c) : sc.sub, al = (P.accent ? 0.45 : 0.4) * (dark(c) ? 1 : 0.8);
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Seigaiha', c.parent, H.polyCmds(c, polys, false), { stroke: col, width: Math.max(1, 1.3 * u), alpha: al });
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f); return { 'position.x': ((env.ltb * 7 * u) % (2 * r)) * -sx, alpha: al * E.outCubic(cl(env.lt / 0.8)) * outE(env) };
  });
  return { layer: id };
});

/* 3. asanoha (back) */
reg('asanoha', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), seed = H.p(P, 'seed', c.cut.seed || 29);
  var M = Math.min(W, Hh), R0 = M * R.rr(0.27, 0.36, seed, 1), portrait = Hh > W * 1.1;
  var cx = portrait ? W * (0.5 + (P.right ? 0.14 : -0.14)) : W * (0.5 + (P.right ? 0.22 : -0.22));
  var cy = portrait ? Hh * (P.low ? 0.66 : 0.34) : Hh * (0.5 + (P.low ? 0.07 : -0.07));
  var s = R0 / 3.2, h3 = s * Math.sqrt(3) / 2, n = Math.min(4, Math.ceil(R0 * 1.4 / s)), grid = [];
  for (var j = -n; j <= n; j++) for (var i = -n; i <= n; i++) {
    var px = i * s + j * s / 2, py = j * h3;
    if (Math.hypot(px, py) > R0 * 1.15) continue;
    var A = [px, py], B = [px + s, py], Cp = [px + s / 2, py + h3], g = [(A[0] + B[0] + Cp[0]) / 3, (A[1] + B[1] + Cp[1]) / 3];
    grid.push([A[0], A[1], B[0], B[1]], [A[0], A[1], Cp[0], Cp[1]], [B[0], B[1], Cp[0], Cp[1]], [g[0], g[1], A[0], A[1]], [g[0], g[1], B[0], B[1]], [g[0], g[1], Cp[0], Cp[1]]);
  }
  var col = P.accent ? acc(c) : sc.sub, al = (dark(c) ? 0.3 : 0.34), lw = Math.max(1, 1.1 * u);
  var rig = c.graph.add('null', c.cut.id + ' / Asanoha rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, cx, cy) });
  var cmds = [];
  grid.forEach(function (g) { cmds.push(['M', g[0], -g[1]], ['L', g[2], -g[3]]); });
  var gid = C.shape(c.graph, c.cut, c.cut.id + ' / Asanoha mesh', rig, cmds, { stroke: col, width: lw, alpha: al });
  var rim = C.shape(c.graph, c.cut, c.cut.id + ' / Asanoha rim', rig, P.corner ? G.rect(-R0, -R0, R0 * 2, R0 * 2) : G.ellipse(0, 0, R0, R0), { stroke: col, width: lw * 1.3, alpha: al * 1.5 });
  var r0 = H.p(P, 'r', 0) * 60;
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), e = E.outCubic(cl(env.lt / 0.8));
    return { 'scale.x': Math.max(0.05, e), 'scale.y': Math.max(0.05, e), rotation: -(r0 + env.ltb * 2.5) };
  });
  [gid, rim].forEach(function (id, k) {
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) { return { alpha: al * (k ? 1.5 : 1) * outE(R.env(c, f)) }; });
  });
  return { mesh: gid };
});

/* 4. hanabi */
reg('hanabi', 'front', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), fr = freeRects(c, bb, 26 * u);
  if (!fr.length) return { skip: true };
  var seed = H.p(P, 'seed', c.cut.seed || 37), cols = [acc(c), acc2(c), sc.fg], nB = 2 + ((H.p(P, 'n', 0) | 0) % 2);
  for (var k = 0; k < nB; k++) {
    (function (idx) {
      var regR = fr[idx % Math.min(2, fr.length)];
      var Rr = cl(Math.min(regR.w * 0.5, regR.h) * 0.5, 44 * u, 190 * u) * (0.75 + 0.3 * R.random(seed, idx, 3));
      var x = regR.x + Rr * 0.9 + Math.max(0, regR.w - Rr * 1.8) * R.random(seed, idx, 1);
      var y = regR.y + Rr * 0.8 + Math.max(0, regR.h - Rr * 1.7) * R.random(seed, idx, 2);
      var cmds = [];
      for (var i = 0; i < 24; i++) {
        var th = i / 24 * TAU, sp = 0.65 + 0.35 * R.random(seed, idx, i, 4);
        cmds.push(['M', Math.cos(th) * Rr * 0.25, -Math.sin(th) * Rr * 0.25], ['L', Math.cos(th) * Rr * sp, -Math.sin(th) * Rr * sp]);
      }
      var fid = C.shape(c.graph, c.cut, c.cut.id + ' / Hanabi ' + idx, c.parent, cmds, { stroke: cols[idx % 3], width: 1.5 * u, alpha: 1 });
      c.graph.byId[fid].attrs.position = H.toScene(c, x, y);
      C.sample(c.graph, fid, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), T = 2.2, all = env.ltb - 0.02 - idx * 0.6;
        if (all < 0) return { alpha: 0 };
        var tau = (all % T) / 1.4;
        if (tau > 1) return { alpha: 0 };
        var e = E.outCubic(tau), fade = 1 - cl((tau - 0.4) / 0.6);
        return { 'scale.x': Math.max(0.05, e), 'scale.y': Math.max(0.05, e), 'position.y': H.toScene(c, x, y + tau * tau * Rr * 0.22)[1], alpha: fade * outE(env) };
      });
    })(k);
  }
  return { bursts: nB };
});

/* 5. chochin */
reg('chochin', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), m = H.decMG(c), bb = H.decBB(c);
  var lw0 = cl(Math.min(W, Hh) * 0.066, 42 * u, 86 * u), lh = lw0 * 1.32, want = Math.min(4, 2 + ((H.p(P, 'n', 1) | 0) % 2));
  var body = acc(c), cap = dark(c) ? sc.fg : (sc.ink || sc.fg), txtC = H.lum(body) > 0.55 ? '#000000' : sc.bg;
  var room = Math.max(40 * u, bb.y0 - 24 * u - lh * 1.3);
  for (var j = 0; j < want; j++) {
    (function (idx) {
      var x = mix(m + lw0, W - m - lw0, (idx + 0.5) / want), Lf = Math.min(room, room * (0.35 + 0.4 * R.random(P.seed || 7, idx, 2)));
      var rig = c.graph.add('null', c.cut.id + ' / Chochin ' + idx, c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, x, 0) });
      C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), amp = 2.5 + 8 * Math.exp(-env.lt * 1.5);
        return { rotation: -(amp * Math.sin(env.ltb * (1.7 + idx * 0.23) + idx * 1.3)) };
      });
      var cord = C.shape(c.graph, c.cut, c.cut.id + ' / Chochin cord ' + idx, rig, [['M', 0, 0], ['L', 0, -Lf]], { stroke: sc.sub, width: Math.max(1, u), alpha: 0.8 });
      var lantern = C.shape(c.graph, c.cut, c.cut.id + ' / Chochin body ' + idx, rig, G.ellipse(0, -Lf - lh / 2, lw0 / 2, lh * 0.42), { fill: body, alpha: 0.94 });
      C.shape(c.graph, c.cut, c.cut.id + ' / Chochin caps ' + idx, rig, G.rect(-lw0 * 0.27, -Lf - lh * 0.08, lw0 * 0.54, lh * 0.1).concat(G.rect(-lw0 * 0.27, -Lf - lh * 0.92, lw0 * 0.54, lh * 0.1)), { fill: cap, alpha: 1 });
      var ch = H.lyricChar(c, idx * 7 + 1);
      if (ch) H.addText(c, 'Chochin glyph ' + idx, ch, W / 2, Hh / 2 + Lf + lh / 2, lw0 * 0.5, { role: 'serif', align: 'center', color: txtC, parent: rig });
      [cord, lantern].forEach(function (id) {
        C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
          var env = R.env(c, f), q = cl((env.lt - 0.03 - idx * 0.08) / 0.6);
          return { alpha: (id === lantern ? 0.94 : 0.8) * E.outCubic(q) * outE(env) };
        });
      });
    })(j);
  }
  return { count: want };
});

/* 6. shimenawa */
reg('shimenawa', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), m = H.decMG(c), bb = H.decBB(c);
  var gap = 30 * u, topRoom = bb.y0 - gap - m * 0.3, botRoom = Hh - m * 0.4 - bb.y1 - gap;
  var top = P.low ? !(botRoom >= 140 * u || botRoom > topRoom) : (topRoom >= 140 * u || topRoom >= botRoom);
  var room = top ? topRoom : botRoom;
  if (room < 60 * u) return { skip: true };
  var k = cl(room / (210 * u), 0.4, 1.15), T0 = 17 * u * k, sag = 46 * u * k, shL = 112 * u * k, shW = shL * 0.17;
  var ya = top ? m * 0.3 + T0 * 0.6 : bb.y1 + gap + T0 * 0.6;
  function Y(x) { return ya + sag * 4 * (x / W) * (1 - x / W); }
  function TK(x) { return T0 * (0.45 + 0.55 * Math.sin(Math.PI * cl(x / W))); }
  var col = dark(c) ? sc.fg : (sc.ink || sc.fg), twist = [], step = T0 * 1.05;
  for (var x = 0; x < W; x += step) {
    var x1 = Math.min(W, x + step * 0.82), sl = TK(x) * 0.7;
    twist.push([[x, Y(x) - TK(x) / 2], [x1, Y(x1) - TK(x1) / 2], [x1 + sl, Y(x1) + TK(x1) / 2], [x + sl, Y(x) + TK(x) / 2]]);
  }
  var rope = C.shape(c.graph, c.cut, c.cut.id + ' / Shimenawa rope', c.parent, H.polyCmds(c, twist, true), { fill: col, alpha: 0.82 });
  C.sample(c.graph, rope, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), e = E.inOutCubic(cl(env.lt / 0.8));
    return { 'scale.x': Math.max(0.01, e), alpha: 0.82 * outE(env) };
  });
  var ns = 3 + ((H.p(P, 'n', 0) | 0) % 2), paperC = dark(c) ? sc.fg : sc.bg;
  for (var i = 0; i < ns; i++) {
    var sx = W * (i + 1) / (ns + 1), sy = Y(sx) + TK(sx) / 2, h = shL / 4, rs = [];
    for (var s = 0; s < 4; s++) {
      var dx = (s % 2 ? shW * 0.62 : 0) - shW / 2;
      rs.push([[sx + dx, sy + s * h], [sx + dx + shW, sy + s * h], [sx + dx + shW, sy + (s + 1) * h], [sx + dx, sy + (s + 1) * h]]);
    }
    var pid = C.shape(c.graph, c.cut, c.cut.id + ' / Shide ' + i, c.parent, H.polyCmds(c, rs, true), { fill: paperC, stroke: dark(c) ? null : sc.fg, width: 1, alpha: 0.94 });
    C.sample(c.graph, pid, c.cut.start, c.cut.end, function (f) {
      var env = R.env(c, f), q = E.outBack(cl((env.lt - 0.25) / 0.45), 1.6);
      return { alpha: 0.94 * cl(q) * outE(env) };
    });
  }
  return { rope: rope };
});

/* 7. sensu */
reg('sensu', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var Rr = cl(Math.min(W, Hh) * 0.105, 62 * u, 124 * u), r0 = Rr * 0.36;
  var sp = spot(c, bb, Rr * 2.05, Rr * 1.2, P, 22 * u), a0 = sp.ok ? 1 : 0.35;
  var tilt = (P.right ? 1 : -1) * (5 + H.p(P, 'r', 0.2) * 9), px = sp.cx, py = sp.y + Rr * 1.12;
  var Nn = 14, spread = 140, outer = [], inner = [], ribs = [];
  for (var i = 0; i <= Nn; i++) {
    var an = (-90 + tilt - spread / 2 + spread * i / Nn) * DEG, cc = Math.cos(an), ss = Math.sin(an), rr = Rr * (i % 2 ? 0.965 : 1);
    outer.push([cc * rr, ss * rr]); inner.push([cc * r0, ss * r0]);
    ribs.push([cc * Rr * 0.06, ss * Rr * 0.06, cc * rr, ss * rr]);
  }
  var rig = c.graph.add('null', c.cut.id + ' / Sensu rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, px, py) });
  var leafPts = outer.concat(inner.slice().reverse()).map(function (pt, idx) { return [idx ? 'L' : 'M', pt[0], -pt[1]]; }).concat([['Z']]);
  C.shape(c.graph, c.cut, c.cut.id + ' / Sensu leaf', rig, leafPts, { fill: acc(c), alpha: 0.15 * a0 });
  var rCmds = [];
  ribs.forEach(function (rb) { rCmds.push(['M', rb[0], -rb[1]], ['L', rb[2], -rb[3]]); });
  C.shape(c.graph, c.cut, c.cut.id + ' / Sensu ribs', rig, rCmds, { stroke: sc.fg, width: Math.max(1, 1.2 * u), alpha: 0.85 * a0 });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), open = Math.max(0.08, E.outBack(cl((env.lt - 0.05) / 0.65), 1.1) * (1 - 0.85 * E.inCubic(env.pOut)));
    return { 'scale.x': open, 'scale.y': 0.7 + 0.3 * open };
  });
  return { rig: rig };
});

/* 8. tsukiKumo */
reg('tsukiKumo', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var Rm = cl(Math.min(W, Hh) * 0.064, 40 * u, 84 * u), sp = spot(c, bb, Rm * 4.6, Rm * 2.9, P, 24 * u), a0 = sp.ok ? 1 : 0.35;
  var flip = sp.cx < W / 2 ? -1 : 1, mx = sp.cx + flip * Rm * 0.9, my = sp.y + Rm * 1.3;
  var moonC = dark(c) ? sc.fg : acc(c), cres = (H.p(P, 'v', 0) | 0) % 2 === 1;
  var moonPts = cres ? (function () {
    var outer = H.arcPts(mx, my, Rm, 60, 300, 24), inner = [];
    for (var i = 0; i <= 24; i++) { var an = (300 - 240 * i / 24) * DEG; inner.push([mx + Rm * 0.42 + Math.cos(an) * Rm * 0.62 * 1.12, my + Math.sin(an) * Rm * 0.93]); }
    return outer.concat(inner);
  })() : H.arcPts(mx, my, Rm, 0, 360, 28);
  var mid = C.shape(c.graph, c.cut, c.cut.id + ' / Tsuki moon', c.parent, H.polyCmds(c, [moonPts], true), { fill: moonC, alpha: 0.95 * a0 });
  H.circle(c, 'Tsuki halo', mx, my, Rm * 1.28, Rm * 1.28, { stroke: sc.sub, width: Math.max(1, u), alpha: 0.5 * a0 });
  var L = Rm * 3.3, hc = Rm * 0.7, x0 = mx - L * 0.55, yb = my + Rm * 0.62;
  var cloudPts = [[x0, yb], [x0 + L * 0.18, yb - hc * 0.45], [x0 + L * 0.48, yb - hc * 0.78], [x0 + L * 0.78, yb - hc * 0.55], [x0 + L, yb]];
  var cid = C.shape(c.graph, c.cut, c.cut.id + ' / Tsuki cloud', c.parent, H.polyCmds(c, [cloudPts], true), { fill: sc.bg, stroke: sc.fg, width: Math.max(1, 1.4 * u), alpha: 0.9 * a0 });
  C.sample(c.graph, mid, c.cut.start, c.cut.end, function (f) { return { alpha: 0.95 * a0 * E.outCubic(cl(R.env(c, f).lt / 0.6)) * outE(R.env(c, f)) }; });
  C.sample(c.graph, cid, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), drift = Math.sin(env.ltb * 0.5) * Rm * 0.35;
    return { 'position.x': drift, alpha: 0.9 * a0 * E.outCubic(cl((env.lt - 0.2) / 0.7)) * outE(env) };
  });
  return { moon: mid };
});

/* 9. momiji */
var MAPLE = (function () {
  var lobes = [[-125, 0.36], [-82, 0.66], [-42, 0.9], [0, 1], [42, 0.9], [82, 0.66], [125, 0.36]], pts = [];
  function P2(a, r) { return [Math.sin(a * DEG) * r, -Math.cos(a * DEG) * r]; }
  pts.push(P2(180, 0.1));
  lobes.forEach(function (pair, i) {
    var a = pair[0], l = pair[1];
    pts.push(P2(a - 17, l * 0.6), P2(a, l), P2(a + 17, l * 0.6));
    var nx = i < lobes.length - 1 ? lobes[i + 1][0] : 180;
    pts.push(P2((a + nx) / 2, i < lobes.length - 1 ? 0.3 : 0.1));
  });
  return pts;
})();
reg('momiji', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var seed = H.p(P, 'seed', c.cut.seed || 43), Nn = 4 + (H.p(P, 'n', 1) | 0) + (P.big ? 1 : 0);
  var ac = acc(c), cols = [ac, H.mixHex(ac, sc.fg, 0.3), H.mixHex(ac, sc.bg, 0.3)];
  for (var i = 0; i < Nn; i++) {
    (function (idx) {
      var L = (40 + R.random(seed, idx, 2) * 26) * u * (idx === 0 ? 1.35 : 1), v = (38 + R.random(seed, idx, 3) * 30) * u;
      var om = 1.3 + R.random(seed, idx, 4) * 0.9, ph = R.random(seed, idx, 5) * TAU, span = Hh + L * 4;
      var x0 = W * (idx + 0.5) / Nn + R.rs(seed, idx, 7) * W * 0.4 / Nn, y0 = R.random(seed, idx, 6) * span, A = (26 + R.random(seed, idx, 8) * 34) * u;
      var cmds = MAPLE.map(function (pt, j) { return [j ? 'L' : 'M', pt[0] * L, -pt[1] * L]; }).concat([['Z']]);
      var mid = C.shape(c.graph, c.cut, c.cut.id + ' / Momiji ' + idx, c.parent, cmds, { fill: cols[idx % 3], alpha: 0.92 });
      var rot0 = R.rs(seed, idx, 9) * 40, dly = R.random(seed, idx, 1) * 0.35;
      C.sample(c.graph, mid, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), q = E.outCubic(cl((env.lt - dly) / 0.45)), s = Math.sin(env.ltb * om + ph);
        var x = x0 + A * s, y = wrap(y0 + v * env.ltb, -L * 2, span), sp = H.toScene(c, x, y);
        var al = H.clearOf(bb, x, y, 12 * u + L * 0.5, 30 * u);
        return { 'position.x': sp[0], 'position.y': sp[1], rotation: -(rot0 + s * 38), 'scale.x': Math.max(0.05, q * (0.55 + 0.45 * Math.abs(Math.cos(env.ltb * om * 0.5 + ph)))), 'scale.y': Math.max(0.05, q), alpha: 0.92 * al * outE(env) };
      });
    })(i);
  }
  return { leaves: Nn };
});

/* 10. namiGashira */
reg('namiGashira', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), m = H.decMG(c), bb = H.decBB(c);
  var room = Hh - m * 0.6 - (bb.y1 + 26 * u); if (room < 34 * u) return { skip: true };
  var h = Math.min(Math.min(W, Hh) * 0.085, room * 0.72), w = h * 2.3, yb = Hh - m * 0.6;
  var n = Math.ceil(W / w) + 2, crests = [];
  for (var i = -1; i < n; i++) {
    var x = i * w - w * 0.5, hh = h * (0.82 + 0.18 * Math.sin(i * 1.7));
    crests.push(bez([x - w / 2, yb], [x - w * 0.18, yb], [x - w * 0.28, yb - hh], [x, yb - hh], 10).concat(H.arcPts(x, yb - hh * 0.6, hh * 0.4, -90, 140, 10)));
  }
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Nami crests', c.parent, H.polyCmds(c, crests, false), { stroke: sc.fg, width: Math.max(1, 1.5 * u), alpha: 0.9 });
  var dir = P.right ? 1 : -1;
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), e = E.outCubic(cl(env.lt / 0.6));
    return { 'position.x': ((env.ltb * 16 * u * dir) % w), 'position.y': -((1 - e) * h * 1.2 + E.inCubic(env.pOut) * h * 0.8), alpha: 0.9 * outE(env) };
  });
  return { waves: id };
});

/* 11. kasumi (back) */
reg('kasumi', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), seed = H.p(P, 'seed', c.cut.seed || 47);
  var n = 2 + ((H.p(P, 'n', 1) | 0) % 2), hb = cl(Math.min(W, Hh) * 0.046, 28 * u, 58 * u);
  var fill = sc.dim || sc.sub, line = acc(c), fa = dark(c) ? 0.85 : 0.7;
  for (var k = 0; k < n; k++) {
    (function (idx) {
      var dir = (idx + (P.right ? 1 : 0)) % 2 ? 1 : -1, Lm = W * (0.34 + R.random(seed, idx, 1) * 0.22);
      var yc = Hh * ((idx + 0.5) / n) + (R.random(seed, idx, 2) - 0.5) * Hh * 0.16;
      var xc = W * (0.5 + dir * (0.2 + R.random(seed, idx, 3) * 0.18));
      var cmds = H.roundRectCmds(0, 0, Lm, hb, hb / 2).concat(H.roundRectCmds(-Lm * 0.18, hb * 0.8, Lm * 0.5, hb * 0.8, hb * 0.4));
      var kid = C.shape(c.graph, c.cut, c.cut.id + ' / Kasumi ' + idx, c.parent, cmds, { fill: fill, stroke: line, width: Math.max(1, 1.1 * u), alpha: fa });
      var sp0 = H.toScene(c, xc, yc);
      C.sample(c.graph, kid, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), e = E.outCubic(cl((env.lt - idx * 0.12) / 0.8));
        return { 'position.x': sp0[0] + dir * (1 - e) * W * 0.25 + dir * env.ltb * 7 * u, 'position.y': sp0[1], alpha: fa * e * outE(env) };
      });
    })(k);
  }
  return { count: n };
});

/* 12. hexGrid */
reg('hexGrid', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var rc = cl(Math.min(W, Hh) * 0.021, 13 * u, 24 * u), cols = 5 + (H.p(P, 'n', 1) | 0), rows = 3 + ((H.p(P, 'v', 0) | 0) % 2);
  var dx = rc * 1.5, dy = rc * Math.sqrt(3), fs = FS(c) * 0.72, w = (cols - 1) * dx + rc * 2, h = rows * dy + dy / 2 + fs * 1.8;
  var sp = spot(c, bb, w, h, P, 24 * u), a0 = sp.ok ? 1 : 0.35, x0 = sp.x + rc, y0 = sp.y + fs * 1.8 + dy / 2;
  var polys = [], lits = [], seed = H.p(P, 'seed', c.cut.seed || 53);
  for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
    var cx = x0 + i * dx, cy = y0 + j * dy + (i % 2 ? dy / 2 : 0), hx = [];
    for (var k = 0; k < 6; k++) hx.push([cx + Math.cos(k * 60 * DEG) * rc * 0.88, cy + Math.sin(k * 60 * DEG) * rc * 0.88]);
    polys.push(hx);
    if (R.random(seed, i, j, 4) < 0.28) lits.push(hx.map(function (pt) { return [mix(cx, pt[0], 0.62), mix(cy, pt[1], 0.62)]; }));
  }
  var oid = C.shape(c.graph, c.cut, c.cut.id + ' / HexGrid outl', c.parent, H.polyCmds(c, polys, true), { stroke: sc.sub, width: Math.max(1, u), alpha: 0.6 * a0 });
  var lid = lits.length ? C.shape(c.graph, c.cut, c.cut.id + ' / HexGrid lit', c.parent, H.polyCmds(c, lits, true), { fill: acc(c), alpha: 0.85 * a0 }) : null;
  [oid, lid].forEach(function (id, idx) {
    if (id) C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) { return { alpha: (idx ? 0.85 : 0.6) * a0 * inE(R.env(c, f), 0.4, 0.1) * outE(R.env(c, f)) }; });
  });
  H.addText(c, 'Hex sector', 'SECTOR ' + pad2(((c.cut.line != null ? c.cut.line : 0) | 0) + 1), sp.x, sp.y + fs * 0.5, fs, { role: 'mono', align: 'left', color: sc.sub }, function (env) {
    return { alpha: a0 * inE(env, 0.3, 0.35) * outE(env) };
  });
  return { hex: oid };
});

/* 13. spectrumRing */
reg('spectrumRing', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var R0 = cl(Math.min(W, Hh) * 0.052, 34 * u, 66 * u), Lm = R0 * 0.95, seed = H.p(P, 'seed', c.cut.seed || 59);
  var sp = spot(c, bb, (R0 + Lm) * 2.1, (R0 + Lm) * 2.1, P, 18 * u), a0 = sp.ok ? 1 : 0.35, Nn = 48;
  var bars = [], hot = [];
  for (var i = 0; i < Nn; i++) {
    var k = i < Nn / 2 ? i : Nn - 1 - i, v = cl((0.55 + 0.45 * R.noise(k * 0.5, seed)) * (1 - k / (Nn / 2) * 0.55));
    var an = i / Nn * TAU, cc = Math.cos(an), ss = Math.sin(an), r1 = R0 + 3 * u + Lm * v;
    (v > 0.78 ? hot : bars).push([sp.cx + cc * (R0 + 3 * u), sp.cy + ss * (R0 + 3 * u), sp.cx + cc * r1, sp.cy + ss * r1]);
  }
  var rig = c.graph.add('null', c.cut.id + ' / SpecRing rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, sp.cx, sp.cy) });
  function localSegs(list) { return H.segCmds(c, list).map(function (cmd) { var p0 = H.toScene(c, sp.cx, sp.cy); return [cmd[0], cmd[1] - p0[0], cmd[2] - p0[1]]; }); }
  var bid = C.shape(c.graph, c.cut, c.cut.id + ' / SpecRing bars', rig, localSegs(bars), { stroke: sc.fg, width: 2 * u, alpha: 0.85 * a0 });
  var hid = hot.length ? C.shape(c.graph, c.cut, c.cut.id + ' / SpecRing hot', rig, localSegs(hot), { stroke: acc(c), width: 2 * u, alpha: a0 }) : null;
  H.circle(c, 'SpecRing inner', sp.cx, sp.cy, R0, R0, { stroke: sc.sub, width: Math.max(1, u), alpha: 0.7 * a0 });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), s = 0.85 + 0.25 * Math.sin(env.ltb * 7);
    return { rotation: -(env.ltb * 6), 'scale.x': s, 'scale.y': s };
  });
  [bid, hid].forEach(function (id, ix) { if (id) C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) { return { alpha: (ix ? 1 : 0.85) * a0 * outE(R.env(c, f)) }; }); });
  var fs = R0 * 0.42;
  H.addText(c, 'SpecRing num', pad2(((c.cut.line != null ? c.cut.line : 0) | 0) + 1), sp.cx, sp.cy - fs * 0.1, fs, { role: 'mono', align: 'center', color: sc.fg });
  H.addText(c, 'SpecRing Hz', 'Hz', sp.cx, sp.cy + fs * 0.75, fs * 0.42, { role: 'mono', align: 'center', color: sc.sub });
  return { ring: bid };
});

/* 14. dataColumns */
reg('dataColumns', 'front', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), fs = FS(c) * 0.9, rh = fs * 1.55;
  var nR = 6 + (H.p(P, 'n', 1) | 0), w = 22 * fs * 0.65, h = nR * rh + fs * 2.2, seed = H.p(P, 'seed', c.cut.seed || 61);
  var sp = spot(c, bb, w, h, P, 24 * u), a0 = sp.ok ? 1 : 0.35, yTop = sp.y + fs * 2.2;
  H.addText(c, 'MEM header', 'MEM', sp.x, sp.y + fs * 0.6, fs, { role: 'mono', align: 'left', color: acc(c) }, function (env) { return { alpha: a0 * outE(env) }; });
  H.addText(c, 'MEM line', 'LYRIC_' + pad2(((c.cut.line != null ? c.cut.line : 0) | 0) + 1), sp.x + w, sp.y + fs * 0.6, fs, { role: 'mono', align: 'right', color: sc.sub }, function (env) { return { alpha: a0 * outE(env) }; });
  H.line(c, 'MEM rule', [[sp.x, sp.y + fs * 1.4], [sp.x + w, sp.y + fs * 1.4]], sc.sub, Math.max(1, u), 0.7 * a0);
  function hex(v, k) { return (v >>> 0).toString(16).toUpperCase().padStart(k, '0').slice(-k); }
  for (var k = 0; k < Math.min(6, nR); k++) {
    (function (idx) {
      var addr = '0x' + hex(((R.hash(seed, 7) & 0xff) << 8) + idx * 16, 4);
      var bytes = [0, 1, 2, 3].map(function (j) { return hex(R.hash(seed, idx, j), 2); }).join(' ');
      H.addText(c, 'MEM row ' + idx, addr + '  ' + bytes, sp.x + 12 * u, yTop + idx * rh, fs, {
        role: 'mono', align: 'left', color: idx === 0 ? sc.fg : sc.sub
      }, function (env) { return { alpha: a0 * (idx === 0 ? 1 : 0.4 + 0.5 * (1 - idx / nR)) * inE(env, 0.3, idx * 0.04) * outE(env) }; });
    })(k);
  }
  return { rows: nR };
});

/* 15. spinner */
reg('spinner', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var Rr = cl(Math.min(W, Hh) * 0.036, 22 * u, 44 * u), fs = FS(c) * 0.95, w = Rr * 2 + 120 * u, h = Rr * 2 + 4 * u;
  var sp = spot(c, bb, w, h, P, 22 * u), a0 = sp.ok ? 1 : 0.35, left = sp.cx < W / 2 || !sp.ok;
  var cx = left ? sp.x + Rr : sp.x + w - Rr, cy = sp.cy, lw = Math.max(1.4, 2.2 * u);
  var rig = c.graph.add('null', c.cut.id + ' / Spinner rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, cx, cy) });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f) { return { rotation: -(R.env(c, f).ltb * 280) }; });
  var cmds = [];
  for (var i = 0; i < 12; i++) {
    var an = i * 30 * DEG;
    cmds.push(['M', Math.cos(an) * Rr * 0.5, -Math.sin(an) * Rr * 0.5], ['L', Math.cos(an) * Rr, -Math.sin(an) * Rr]);
  }
  var sid = C.shape(c.graph, c.cut, c.cut.id + ' / Spinner blades', rig, cmds, { stroke: sc.fg, width: lw, alpha: a0 });
  C.sample(c.graph, sid, c.cut.start, c.cut.end, function (f) { return { alpha: a0 * outE(R.env(c, f)) }; });
  var lx = left ? cx + Rr + 12 * u : cx - Rr - 12 * u;
  H.stepText(c, 'Spinner label', lx, cy - fs * 0.35, fs, {
    role: 'mono', align: left ? 'left' : 'right', color: sc.fg,
    animFn: function (env) { return { alpha: a0 * outE(env) }; }
  }, function (env) {
    var d = Math.floor(env.ltb * 3) % 4;
    return 'LOADING' + '...'.slice(0, d);
  }, 8);
  H.stepText(c, 'Spinner pct', lx, cy + fs * 0.75, fs * 0.72, {
    role: 'mono', align: left ? 'left' : 'right', color: sc.sub,
    animFn: function (env) { return { alpha: 0.8 * a0 * outE(env) }; }
  }, function (env) { return pad2(Math.min(99, Math.floor(env.lt * 45)), 3) + '%'; }, 8);
  return { rig: rig };
});

/* 16. headingTape */
reg('headingTape', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), m = H.decMG(c), bb = H.decBB(c);
  var fs = FS(c) * 0.85, gap = 22 * u, ht = fs * 1.4 + 34 * u, above = !P.low;
  var yT = above ? Math.max(m * 0.6, bb.y0 - gap - ht) : bb.y1 + gap;
  var Wt = Math.min(W * 0.56, 620 * u, W - 2 * m), cx = cl(bb.cx, m + Wt / 2, W - m - Wt / 2), base = yT + fs * 1.4 + 14 * u;
  var segs = [];
  for (var i = -10; i <= 10; i++) { var x = cx + i * (Wt / 20); segs.push([x, base, x, base - (i % 3 === 0 ? 12 : 6) * u]); }
  segs.push([cx - Wt / 2, base, cx + Wt / 2, base]);
  C.shape(c.graph, c.cut, c.cut.id + ' / Heading ticks', c.parent, H.segCmds(c, segs), { stroke: sc.fg, width: Math.max(1, u), alpha: 0.8 });
  var py = base + 3 * u, pw = 6 * u;
  H.poly(c, 'Heading ptr', [[cx, py], [cx - pw, py + pw * 1.3], [cx + pw, py + pw * 1.3]], true, { fill: acc(c), alpha: 1 });
  var r0 = H.p(P, 'r', 0.25) * 360;
  H.stepText(c, 'Heading deg', cx, py + pw * 1.3 + fs * 1.1, fs * 1.1, { role: 'mono', align: 'center', color: sc.fg }, function (env) {
    var hdg = ((r0 + env.ltb * 7 * (P.right ? 1 : -1)) % 360 + 360) % 360;
    return pad2(hdg, 3) + '\u00b0';
  }, 10);
  return { base: base };
});

/* 17. glyphLock */
reg('glyphLock', 'front', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), ac = acc(c), lw = Math.max(1.2, 1.9 * u);
  var pad = 12 * u + bb.h * 0.07, n0 = c.cut.nodes && c.cut.nodes[0], raw = String((c.cut.source && c.cut.source.text) || (n0 && n0.text) || '').replace(/\s+/g, '');
  var Nn = Math.max(1, Math.min(10, Array.from(raw).length)), Lh = Math.min(bb.w / Nn * 0.36, 22 * u), Lv = pad * 0.8;
  var bracketCmds = [['M', -Lh, -Lv], ['L', -Lh, 0], ['L', 0, 0], ['M', 0, 0], ['L', Lh, 0], ['L', Lh, -Lv]];
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / GlyphLock', c.parent, bracketCmds, { stroke: ac, width: lw, alpha: 1 });
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), k = Math.floor(Math.max(0, env.lt - 0.15) / 0.34) % Nn;
    var gx = mix(bb.x0, bb.x1, (k + 0.5) / Nn), sp = H.toScene(c, gx, bb.y0 - pad);
    return { 'position.x': sp[0], 'position.y': sp[1], alpha: E.outExpo(cl(env.lt / 0.3)) * outE(env) };
  });
  H.stepText(c, 'GlyphLock tag', bb.cx, bb.y0 - pad - 18 * u, FS(c) * 0.9, { role: 'mono', align: 'center', color: sc.fg }, function (env) {
    var k = (Math.floor(Math.max(0, env.lt - 0.15) / 0.34) % Nn) + 1;
    return 'TGT ' + pad2(k) + '/' + pad2(Nn);
  }, 8);
  return { lock: id };
});

/* 18. atomOrbit */
reg('atomOrbit', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var Rr = cl(Math.min(W, Hh) * 0.072, 46 * u, 92 * u), ry = Rr * 0.34, fs = FS(c) * 0.75;
  var sp = spot(c, bb, Rr * 2.3, Rr * 2.3 + fs * 1.6, P, 22 * u), a0 = sp.ok ? 1 : 0.35, cx = sp.cx, cy = sp.y + Rr * 1.15;
  var rig = c.graph.add('null', c.cut.id + ' / Atom rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, cx, cy) });
  for (var k = 0; k < 3; k++) {
    (function (idx) {
      var oRig = c.graph.add('null', c.cut.id + ' / Orbit plane ' + idx, rig, c.cut.start, c.cut.end, { rotation: -(idx * 60 + H.p(P, 'r', 0) * 180) });
      C.shape(c.graph, c.cut, c.cut.id + ' / Atom path ' + idx, oRig, G.ellipse(0, 0, Rr, ry), { stroke: sc.fg, width: Math.max(1, 1.1 * u), alpha: 0.55 * a0 });
      var eid = C.shape(c.graph, c.cut, c.cut.id + ' / Electron ' + idx, oRig, G.ellipse(0, 0, 3.6 * u, 3.6 * u), { fill: idx === 0 ? acc(c) : sc.fg, alpha: a0 });
      var w = (1.4 + idx * 0.35) * (idx % 2 ? -1 : 1), ph = R.random(P.seed || 11, idx) * 360;
      C.sample(c.graph, eid, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), an = (ph + env.ltb * w * 90) * DEG;
        return { 'position.x': Math.cos(an) * Rr, 'position.y': -Math.sin(an) * ry, alpha: a0 * outE(env) };
      });
    })(k);
  }
  C.shape(c.graph, c.cut, c.cut.id + ' / Nucleus', rig, G.ellipse(0, 0, 6 * u, 6 * u), { fill: acc(c), alpha: a0 });
  H.addText(c, 'Atom label', 'ORB-3  e\u207b3', cx, cy + Rr * 1.15 + fs * 0.4, fs, { role: 'mono', align: 'center', color: sc.sub });
  return { rig: rig };
});

/* 19. sonarArcs */
reg('sonarArcs', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var vert = bb.h > bb.w * 1.25, g0 = 16 * u + (vert ? bb.w : bb.h) * 0.04;
  var sides = vert ? [[bb.cx, bb.y0 - g0, -90], [bb.cx, bb.y1 + g0, 90]] : [[bb.x0 - g0, bb.cy, 180], [bb.x1 + g0, bb.cy, 0]];
  var rMax = Math.min(160 * u, Math.max(48 * u, (vert ? Hh * 0.2 : W * 0.2))), span = vert ? 40 : 34;
  sides.forEach(function (side, si) {
    for (var k = 0; k < 3; k++) {
      (function (idx) {
        var pts = H.arcPts(0, 0, 12 * u, side[2] - span, side[2] + span, 14).map(function (pt, j) { return [j ? 'L' : 'M', pt[0], -pt[1]]; });
        var sid = C.shape(c.graph, c.cut, c.cut.id + ' / Sonar ' + si + '_' + idx, c.parent, pts, { stroke: idx === 0 ? acc(c) : sc.fg, width: 2 * u, alpha: 0.9 });
        c.graph.byId[sid].attrs.position = H.toScene(c, side[0], side[1]);
        C.sample(c.graph, sid, c.cut.start, c.cut.end, function (f) {
          var env = R.env(c, f), len = 0.62, since = ((env.ltb % len) + len) % len, p = (since + idx * len) / (len * 3);
          if (p >= 1) return { alpha: 0 };
          var sck = mix(1, rMax / (12 * u), E.outCubic(p));
          return { 'scale.x': sck, 'scale.y': sck, alpha: Math.pow(1 - p, 1.3) * outE(env) };
        });
      })(k);
    }
  });
  return { sides: 2 };
});

/* 20. circuit */
reg('circuit', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var gap = 18 * u + Math.min(bb.w, bb.h) * 0.05, seed = H.p(P, 'seed', c.cut.seed || 71);
  var right = P.right ? (W - bb.x1 - gap > 70 * u) : (bb.x0 - gap < 70 * u), sEnd = right ? W - bb.x1 - gap : bb.x0 - gap;
  if (sEnd < 40 * u) sEnd = Math.max(W - bb.x1 - gap, bb.x0 - gap);
  var n = 4 + ((H.p(P, 'n', 1) | 0) % 3), traces = [], pads = [];
  function Mx(s, t) { return [right ? W - s : s, t]; }
  for (var i = 0; i < n; i++) {
    var k = i - (n - 1) / 2, t0 = bb.cy + k * 24 * u, t1 = bb.cy + k * 14 * u, d = Math.abs(t1 - t0), sa = Math.max(10 * u, sEnd * 0.45 - d / 2);
    var pEnd = Mx(Math.max(14 * u, sEnd - (i % 2 ? 14 * u : 0)), t1);
    traces.push([Mx(-6 * u, t0), Mx(sa, t0), Mx(sa + d, t1), pEnd]);
    pads.push([pEnd[0], pEnd[1], 4 * u]);
  }
  var tid = C.shape(c.graph, c.cut, c.cut.id + ' / Circuit traces', c.parent, H.polyCmds(c, traces, false), { stroke: sc.sub, width: Math.max(1, 1.3 * u), alpha: 0.85 });
  var pid = C.shape(c.graph, c.cut, c.cut.id + ' / Circuit pads', c.parent, H.dotCmds(c, pads), { fill: acc(c), alpha: 1 });
  [tid, pid].forEach(function (id, ix) {
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) { return { alpha: (ix ? 1 : 0.85) * E.inOutCubic(cl(R.env(c, f).lt / 0.6)) * outE(R.env(c, f)) }; });
  });
  return { traces: n };
});

/* 21. swatches */
reg('swatches', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var cols = [[sc.accent, 'ACC'], [sc.accent2, 'AC2'], [sc.fg, 'FG'], [sc.sub, 'SUB'], [sc.ink, 'INK'], [sc.dim, 'DIM']].filter(function (x) { return !!x[0]; }).slice(0, 6);
  var sq = cl(Math.min(W, Hh) * 0.037, 24 * u, 44 * u), g = 2 * u, fs = FS(c) * 0.7;
  var sp = spot(c, bb, cols.length * (sq + g) + sq * 1.4, sq * 1.7 + fs * 3.4, P, 24 * u), a0 = sp.ok ? 1 : 0.35;
  var x0 = sp.x, y0 = sp.y + fs * 1.6;
  H.addText(c, 'Swatch hdr', 'COLOR BAR  ' + pad2(cols.length), x0, sp.y + fs * 0.6, fs, { role: 'mono', align: 'left', color: sc.sub });
  cols.forEach(function (pair, i) {
    var x = x0 + i * (sq + g);
    var r1 = H.rect(c, 'Swatch ' + pair[1], x, y0, sq, sq, { fill: pair[0], alpha: a0 });
    var r2 = H.rect(c, 'Swatch tint ' + pair[1], x, y0 + sq + g, sq, sq * 0.7, { fill: H.mixHex(sc.bg, pair[0], 0.5), alpha: a0 });
    H.addText(c, 'Swatch tag ' + pair[1], pair[1], x + sq / 2, y0 + sq * 1.7 + g + fs * 0.9, fs, { role: 'mono', align: 'center', color: sc.sub });
    [r1, r2].forEach(function (id) { if (id) C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) { return { alpha: a0 * E.outExpo(cl((R.env(c, f).lt - i * 0.06) / 0.35)) * outE(R.env(c, f)) }; }); });
  });
  return { count: cols.length };
});

/* 22. ruledLines (back) */
reg('ruledLines', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c);
  var s = cl(Math.min(W, Hh) * 0.078, 44 * u, 96 * u), al = dark(c) ? 0.36 : 0.42, lw = Math.max(1, 1.2 * u);
  var y0 = s * 1.6, rows = Math.min(28, Math.floor((Hh - y0) / s)), list = [];
  for (var i = 0; i <= rows; i++) list.push([0, y0 + i * s, W, y0 + i * s]);
  var gid = C.shape(c.graph, c.cut, c.cut.id + ' / Ruled lines', c.parent, H.segCmds(c, list), { stroke: sc.sub, width: lw, alpha: al });
  var mx = P.right ? W * 0.91 : W * 0.09, mid = H.line(c, 'Ruled margin', [[mx, 0], [mx, Hh]], acc(c), lw, 0.55);
  [gid, mid].forEach(function (id, ix) {
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) { return { alpha: (ix ? 0.55 : al) * E.inOutCubic(cl(R.env(c, f).lt / 0.6)) * outE(R.env(c, f)) }; });
  });
  return { rows: rows };
});

/* 23. registration */
reg('registration', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var Rr = cl(Math.min(W, Hh) * 0.045, 28 * u, 56 * u), fs = FS(c) * 0.72;
  var sp = spot(c, bb, Rr * 3.2, Rr * 3.2 + fs * 2, P, 22 * u), a0 = sp.ok ? 1 : 0.35, cx = sp.cx, cy = sp.y + Rr * 1.6;
  var cols = [acc(c), acc2(c), sc.fg], dirs = [[-1, -0.6], [0.9, -0.5], [0.1, 1]], lw = Math.max(1, 1.3 * u);
  cols.forEach(function (col, k) {
    var cmds = G.ellipse(0, 0, Rr * 0.98, Rr * 0.98).concat(G.ellipse(0, 0, Rr * 0.62, Rr * 0.62), [['M', -Rr * 1.45, 0], ['L', Rr * 1.45, 0], ['M', 0, -Rr * 1.45], ['L', 0, Rr * 1.45]]);
    var id = C.shape(c.graph, c.cut, c.cut.id + ' / Reg plate ' + k, c.parent, cmds, { stroke: col, width: lw, alpha: 0.9 * a0 });
    var sc0 = H.toScene(c, cx, cy);
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
      var env = R.env(c, f), lock = E.outExpo(cl((env.lt - 0.05) / 0.9)), D = 18 * u * (1 - lock);
      return { 'position.x': sc0[0] + dirs[k][0] * D, 'position.y': sc0[1] - dirs[k][1] * D, alpha: 0.9 * a0 * outE(env) };
    });
  });
  H.addText(c, 'Reg status', 'REG', cx, cy + Rr * 1.6 + fs * 0.5, fs, { role: 'mono', align: 'center', color: acc(c) });
  return { plates: 3 };
});

/* 24. punchHoles */
reg('punchHoles', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), m = H.decMG(c), bb = H.decBB(c);
  var r = cl(Math.min(W, Hh) * 0.016, 10 * u, 19 * u), n = (H.p(P, 'v', 0) | 0) % 3 === 2 ? 3 : 2;
  var right = !!P.right, cx = right ? W - m * 0.9 - r : m * 0.9 + r, spc = Math.min(Hh * 0.3, 260 * u) * (n === 3 ? 0.8 : 1);
  for (var i = 0; i < n; i++) {
    var py = Hh / 2 + (i - (n - 1) / 2) * spc;
    if (H.hitBB(cx - r * 2, py - r * 2, cx + r * 2, py + r * 2, bb, 4)) continue;
    H.circle(c, 'Punch ring ' + i, cx, py, r * 1.85, r * 1.85, { stroke: sc.sub, width: r * 0.75, alpha: 0.18 });
    H.circle(c, 'Punch hole ' + i, cx, py, r, r, { fill: sc.dim || sc.sub, stroke: sc.fg, width: Math.max(1, 1.2 * u), alpha: 0.92 });
  }
  return { holes: n };
});

/* 25. staple */
reg('staple', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), m = H.decMG(c), bb = H.decBB(c);
  var Ls = cl(Math.min(W, Hh) * 0.058, 38 * u, 70 * u), padP = Ls * 0.7 + 14 * u, sx = P.right ? 1 : -1, sy = P.low ? 1 : -1;
  var X = cl(sx < 0 ? bb.x0 - padP : bb.x1 + padP, m * 0.5, W - m * 0.5), Y = cl(sy < 0 ? bb.y0 - padP : bb.y1 + padP, m * 0.5, Hh - m * 0.5);
  var L = Math.min(Ls * 3.4, Math.max(bb.w, bb.h) * 0.45);
  H.poly(c, 'Sheet corner', [[X - sx * L, Y], [X, Y], [X, Y - sy * L]], false, { stroke: sc.sub, width: Math.max(1, u), alpha: 0.8 });
  var cx = X - sx * Ls * 0.3, cy = Y - sy * Ls * 0.3, ang = sx * sy > 0 ? -45 : 45, t = 2.6 * u;
  var stId = C.shape(c.graph, c.cut, c.cut.id + ' / Staple wire', c.parent, H.roundRectCmds(0, 0, Ls, t * 2, t), { fill: sc.fg, alpha: 0.95 });
  var sc0 = H.toScene(c, cx, cy);
  C.sample(c.graph, stId, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), q = cl((env.lt - 0.3) / 0.18), eq = E.outCubic(q), s = 1 + 0.6 * (1 - eq);
    return { 'position.x': sc0[0], 'position.y': sc0[1], rotation: -(ang + (1 - q) * 14), 'scale.x': s, 'scale.y': s, alpha: 0.95 * cl(q * 3) * outE(env) };
  });
  return { staple: stId };
});

/* 26. paperClip */
var CLIP = (function () {
  var p = [];
  function seg(a, b) { for (var i = 0; i <= 4; i++) p.push([mix(a[0], b[0], i / 4), mix(a[1], b[1], i / 4)]); }
  function arc(cx, cy, r, a0, a1) { for (var i = 0; i <= 10; i++) { var an = (a0 + (a1 - a0) * i / 10) * DEG; p.push([cx + Math.cos(an) * r, cy + Math.sin(an) * r]); } }
  seg([-0.2, 0.95], [-0.2, 2.45]); arc(0.05, 2.45, 0.25, 180, 0);
  seg([0.3, 2.45], [0.3, 0.42]); arc(-0.02, 0.42, 0.32, 0, -180);
  seg([-0.34, 0.42], [-0.34, 2.62]); arc(0.06, 2.62, 0.4, 180, 0);
  seg([0.46, 2.62], [0.46, 0.85]);
  return p.map(function (pt) { return [pt[0], pt[1] - 1.5]; });
})();
reg('paperClip', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), m = H.decMG(c), bb = H.decBB(c);
  var S = cl(Math.min(W, Hh) * 0.035, 22 * u, 40 * u), hc = S * 3.3, low = !!P.low && Hh - bb.y1 > hc * 1.2 + m;
  var Y = low ? bb.y1 + hc * 0.42 + 10 * u : Math.max(m * 0.5 + hc * 0.55, bb.y0 - hc * 0.42 - 10 * u);
  var sx = P.right ? 1 : -1, cx = cl(sx < 0 ? bb.x0 + S * 2 : bb.x1 - S * 2, m, W - m), sy = low ? 1 : -1;
  var cmds = CLIP.map(function (pt, i) { return [i ? 'L' : 'M', pt[0] * S, -(low ? -pt[1] : pt[1]) * S]; });
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / PaperClip', c.parent, cmds, { stroke: sc.fg, width: Math.max(1.4, 2.1 * u), alpha: 0.95 });
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), slide = (1 - E.outCubic(cl((env.lt - 0.1) / 0.45))) * 24 * u;
    var sp = H.toScene(c, cx, Y + sy * hc * 0.12 - sy * slide);
    return { 'position.x': sp[0], 'position.y': sp[1], rotation: -(sx * 7), alpha: 0.95 * outE(env) };
  });
  return { clip: id };
});

/* 27. indexTabs */
reg('indexTabs', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c);
  var n = 5, th = cl(Math.min(W, Hh) * 0.066, 42 * u, 76 * u), tw = th * 0.8, g = 6 * u, fs = FS(c) * 1.05;
  var span = n * th + (n - 1) * g, right = !!P.right, mid = Hh * (P.low ? 0.58 : 0.42), cur = (((c.cut.line != null ? c.cut.line : 0) | 0) % n + n) % n;
  var labs = ['01', '02', '03', '04', '05'], ac = acc(c);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var isC = idx === cur, d = tw + (isC ? 16 * u : 0), along = mid - span / 2 + idx * (th + g);
      var x = right ? W - d : -12 * u, w = d + 12 * u, col = isC ? ac : (sc.dim || sc.sub);
      var rid = H.rect(c, 'Index tab ' + idx, x, along, w, th, { fill: col, stroke: isC ? null : sc.sub, width: 1, round: 6 * u, alpha: isC ? 0.95 : 0.9 });
      var tx = right ? W - d * 0.5 : d * 0.5, ty = along + th / 2;
      var tc = isC ? (H.lum(col) > 0.55 ? '#000000' : sc.bg) : sc.fg;
      H.addText(c, 'Tab txt ' + idx, labs[idx], tx, ty, fs, { role: 'mono', align: 'center', color: tc });
      if (rid) C.sample(c.graph, rid, c.cut.start, c.cut.end, function (f) {
        return { alpha: (isC ? 0.95 : 0.9) * E.outCubic(cl((R.env(c, f).lt - idx * 0.06) / 0.35)) * outE(R.env(c, f)) };
      });
    })(i);
  }
  return { tabs: n };
});

/* 28. vines */
reg('vines', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var sx = P.right ? 1 : -1, sy = P.low ? 1 : -1, x0 = sx > 0 ? W * 0.92 : W * 0.08, y0 = sy > 0 ? Hh : 0;
  var th = Math.atan2(-sy, -sx * 0.55), x = x0, y = y0, step = 12 * u, pts = [[x, y]], leaves = [];
  for (var s = 0; s < Math.min(W, Hh) * 0.6 && pts.length < 40; s += step) {
    th += Math.sin(s / (90 * u)) * 0.08;
    x += Math.cos(th) * step; y += Math.sin(th) * step;
    if (H.clearOf(bb, x, y, 20 * u, 1) < 1) break;
    pts.push([x, y]);
    if (pts.length % 4 === 0) {
      var lx = x + Math.cos(th + 0.9) * 14 * u, ly = y + Math.sin(th + 0.9) * 14 * u;
      leaves.push([[x, y], [mix(x, lx, 0.5) - 5 * u, mix(y, ly, 0.5) - 4 * u], [lx, ly], [mix(x, lx, 0.5) + 5 * u, mix(y, ly, 0.5) + 4 * u]]);
    }
  }
  var vid = pts.length >= 2 ? H.poly(c, 'Vine stem', pts, false, { stroke: sc.fg, width: Math.max(1.2, 1.7 * u), alpha: 0.9 }) : null;
  var lid = leaves.length ? C.shape(c.graph, c.cut, c.cut.id + ' / Vine leaves', c.parent, H.polyCmds(c, leaves, true), { fill: acc(c), alpha: 0.9 }) : null;
  [vid, lid].forEach(function (id) { if (id) C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) { return { alpha: 0.9 * E.outCubic(cl(R.env(c, f).lt / 0.8)) * outE(R.env(c, f)) }; }); });
  return { vine: vid };
});

/* 29. cloudPuffs */
reg('cloudPuffs', 'front', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), fr = freeRects(c, bb, 20 * u);
  if (!fr.length) return { skip: true };
  var regR = fr[0], n = 2 + ((H.p(P, 'n', 0) | 0) % 2), seed = H.p(P, 'seed', c.cut.seed || 73);
  for (var i = 0; i < n; i++) {
    var Wc = Math.min(cl(regR.w * 0.42, 90 * u, 240 * u), regR.h / 0.56);
    if (Wc < 45 * u) continue;
    var cx = regR.x + regR.w * ((i + 0.5) / n), by = regR.y + Wc * 0.52;
    var cs = [[-0.3, 0.18], [0, 0.25], [0.28, 0.18]].map(function (b) { return [cx + b[0] * Wc, by - b[1] * Wc * 0.6, b[1] * Wc]; });
    var id = C.shape(c.graph, c.cut, c.cut.id + ' / Cloud ' + i, c.parent, H.dotCmds(c, cs), { fill: sc.dim || sc.sub, stroke: sc.fg, width: 1.4 * u, alpha: 0.8 });
    var dir = (P.right ? 1 : -1) * (i % 2 ? -1 : 1);
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
      var env = R.env(c, f); return { 'position.x': dir * env.ltb * 8 * u, alpha: 0.8 * E.outBack(cl(env.lt / 0.45), 1.5) * outE(env) };
    });
  }
  return { clouds: n };
});

/* 30. starField (back) */
reg('starField', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c);
  var col = dark(c) ? sc.fg : sc.sub, dkMul = dark(c) ? 1 : 0.7, seed = H.p(P, 'seed', c.cut.seed || 79);
  for (var lvl = 0; lvl < 3; lvl++) {
    (function (li) {
      var dots = [];
      for (var i = 0; i < 32; i++) {
        dots.push([R.random(seed, li, i, 2) * W, R.random(seed, li, i, 3) * Hh, [1.2, 1.9, 2.8][li] * u]);
      }
      var al = [0.45, 0.65, 0.9][li] * dkMul;
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Stars ' + li, c.parent, H.dotCmds(c, dots), { fill: col, alpha: al });
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), tw = 0.65 + 0.35 * Math.sin(env.ltb * (2 + li) + li);
        return { alpha: al * tw * cl(env.lt / 0.4) * outE(env) };
      });
    })(lvl);
  }
  return { layers: 3 };
});

/* 31. moonPhases */
var MOON_NAMES = ['\u65b0\u6708', '\u4e09\u65e5\u6708', '\u4e0a\u5f26', '\u5341\u4e09\u591c', '\u6e80\u6708', '\u5c45\u5f85\u6708', '\u4e0b\u5f26', '\u6709\u660e'];
reg('moonPhases', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), m = H.decMG(c), bb = H.decBB(c);
  var n = 8, fs = FS(c) * 0.95, r = cl(Math.min(W, Hh) * 0.025, 14 * u, 27 * u), dx = r * 2.8;
  var w = dx * (n - 1) + r * 2, h = r * 2 + fs * 2.6, sp = bandSpot(c, bb, w, h, P, 26 * u), a0 = sp.ok ? 1 : 0.35, cy = sp.y + r;
  var rings = [], lits = [];
  for (var k = 0; k < n; k++) {
    var cx = sp.x + r + k * dx, p = k / n, f = (1 - Math.cos(p * TAU)) / 2, wax = p <= 0.5;
    rings.push([cx, cy, r]);
    if (f > 0.05) {
      var kx = 1 - 2 * f, pts = [];
      for (var i = 0; i <= 12; i++) { var t = (-90 + 180 * i / 12) * DEG; pts.push([cx + (wax ? 1 : -1) * Math.cos(t) * r, cy + Math.sin(t) * r]); }
      for (var j = 12; j >= 0; j--) { var t2 = (-90 + 180 * j / 12) * DEG; pts.push([cx + (wax ? 1 : -1) * kx * Math.cos(t2) * r, cy + Math.sin(t2) * r]); }
      lits.push(pts);
    }
  }
  C.shape(c.graph, c.cut, c.cut.id + ' / Moon outlines', c.parent, H.ringCmds(c, rings, 20), { stroke: sc.sub, width: Math.max(1, u), alpha: 0.8 * a0 });
  C.shape(c.graph, c.cut, c.cut.id + ' / Moon phases', c.parent, H.polyCmds(c, lits, true), { fill: sc.fg, alpha: 0.92 * a0 });
  var target = R.hash(c.cut.seed || 7, 3) % n, hx = sp.x + r + target * dx;
  H.circle(c, 'Moon highlight', hx, cy, r * 1.45, r * 1.45, { stroke: acc(c), width: Math.max(1.2, 1.6 * u), alpha: a0 });
  H.addText(c, 'Moon name', MOON_NAMES[target], hx, cy + r * 1.8 + fs * 1.1, fs, { role: 'serif', align: 'center', color: sc.fg });
  return { target: target };
});

/* 32. sunRays (back) */
reg('sunRays', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c);
  var bottom = (H.p(P, 'v', 0) | 0) % 3 === 2;
  var cx = bottom ? W / 2 : (P.right ? W * 1.02 : -W * 0.02), cy = bottom ? Hh * 1.08 : (P.low ? Hh * 1.03 : -Hh * 0.03);
  var Nn = 16 + (H.p(P, 'n', 0) | 0) * 4, Rr = Math.hypot(W, Hh) * 1.05, polys = [];
  for (var i = 0; i < Nn; i++) {
    var a0 = i / Nn * TAU, a1 = a0 + TAU / Nn * 0.5;
    polys.push([[0, 0], [Math.cos(a0) * Rr, -Math.sin(a0) * Rr], [Math.cos(a1) * Rr, -Math.sin(a1) * Rr]]);
  }
  var al = (P.accent ? 0.1 : (dark(c) ? 0.45 : 0.6));
  var cmds = polys.map(function (tri) { return ['M', tri[0][0], tri[0][1], 'L', tri[1][0], tri[1][1], 'L', tri[2][0], tri[2][1], 'Z']; });
  var flatCmds = [];
  polys.forEach(function (tri) { flatCmds.push(['M', tri[0][0], tri[0][1]], ['L', tri[1][0], tri[1][1]], ['L', tri[2][0], tri[2][1]], ['Z']); });
  var rid = C.shape(c.graph, c.cut, c.cut.id + ' / SunRays', c.parent, flatCmds, { fill: P.accent ? acc(c) : (sc.dim || sc.sub), alpha: al });
  c.graph.byId[rid].attrs.position = H.toScene(c, cx, cy);
  var r0 = H.p(P, 'r', 0) * 30, dir = P.right ? -1 : 1;
  C.sample(c.graph, rid, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), e = E.outCubic(cl(env.lt / 0.8));
    return { rotation: -(r0 + env.ltb * 2.2 * dir), 'scale.x': Math.max(0.05, e), 'scale.y': Math.max(0.05, e), alpha: al * outE(env) };
  });
  return { rays: rid };
});

/* 33. rainRipples (back) */
reg('rainRipples', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c);
  var col = dark(c) ? sc.fg : sc.sub, kCol = dark(c) ? 0.55 : 0.6, seed = H.p(P, 'seed', c.cut.seed || 83);
  var Nn = 8 + (H.p(P, 'n', 0) | 0) * 2;
  for (var i = 0; i < Nn; i++) {
    (function (idx) {
      var x = W * R.rr(0.05, 0.95, seed, idx, 3), ff = R.random(seed, idx, 4), y = mix(Hh * 0.62, Hh * 0.96, ff);
      var depth = 0.45 + 0.55 * ff, Rm = (70 + R.random(seed, idx, 5) * 80) * u * depth;
      var rid = H.circle(c, 'Rain ripple ' + idx, x, y, Rm, Rm * 0.28, { stroke: col, width: Math.max(1, 1.1 * u), alpha: kCol });
      var T = 1.5 + R.random(seed, idx, 1) * 0.9, off = R.random(seed, idx, 2) * T;
      C.sample(c.graph, rid, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), tau = ((env.ltb + off) % T) / T;
        var s = Math.max(0.05, E.outCubic(tau));
        return { 'scale.x': s, 'scale.y': s, alpha: kCol * Math.pow(1 - tau, 1.4) * outE(env) * inE(env, 0.4, 0, E.outCubic) };
      });
    })(i);
  }
  return { ripples: Nn };
});

/* 34. bubbles */
reg('bubbles', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), m = H.decMG(c), bb = H.decBB(c);
  var Nn = Math.min(12, 7 + (H.p(P, 'n', 0) | 0) * 2), seed = H.p(P, 'seed', c.cut.seed || 89);
  for (var i = 0; i < Nn; i++) {
    (function (idx) {
      var Rr = (14 + R.random(seed, idx, 3) * 26) * u, x0 = m + (W - 2 * m) * R.random(seed, idx, 5), v = (50 + R.random(seed, idx, 4) * 50) * u;
      var bid = C.shape(c.graph, c.cut, c.cut.id + ' / Bubble ' + idx, c.parent, G.ellipse(0, 0, Rr, Rr), { stroke: sc.fg, width: Math.max(1, 1.2 * u), alpha: 0.7 });
      var ph = R.random(seed, idx, 2) * 3;
      C.sample(c.graph, bid, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), y = Hh + Rr - ((env.ltb + ph) * v) % (Hh + Rr * 2);
        var x = x0 + Math.sin(env.ltb * 1.4 + idx) * 16 * u, al = H.clearOf(bb, x, y, 8 * u + Rr, 1);
        var sp = H.toScene(c, x, y);
        return { 'position.x': sp[0], 'position.y': sp[1], alpha: 0.7 * al * outE(env) };
      });
    })(i);
  }
  return { bubbles: Nn };
});

/* 35. smoke (back) */
reg('smoke', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c);
  var dkMul = dark(c) ? 0.5 : 0.6, col = dark(c) ? sc.fg : sc.sub, seed = H.p(P, 'seed', c.cut.seed || 97);
  var nW = 2 + ((H.p(P, 'n', 0) | 0) % 2);
  for (var w = 0; w < nW; w++) {
    var xb = W * R.rr(0.18, 0.82, seed, w, 1), pts = [];
    for (var d = 0; d <= Hh * 0.72; d += 18 * u) {
      var x = xb + R.noise(d / (130 * u), seed + w * 31) * (10 * u + d * 0.16);
      pts.push([x, Hh - d]);
    }
    var id = H.poly(c, 'Smoke wisp ' + w, pts, false, { stroke: col, width: 1.8 * u, alpha: 0.45 * dkMul });
    if (id) C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
      var env = R.env(c, f); return { 'position.x': Math.sin(env.ltb + w) * 8 * u, alpha: 0.45 * dkMul * E.outCubic(cl(env.lt / 0.9)) * outE(env) };
    });
  }
  return { wisps: nW };
});

/* 36. dandelion */
reg('dandelion', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var dir = P.right ? 1 : -1, Nn = 6 + (H.p(P, 'n', 1) | 0) * 2, seed = H.p(P, 'seed', c.cut.seed || 101);
  var cmds = [['M', 0, -2 * u], ['L', 0, 24 * u]];
  for (var k = 0; k < 9; k++) {
    var an = (-90 + (k - 4) * 18) * DEG;
    cmds.push(['M', 0, 24 * u], ['L', Math.cos(an) * 16 * u, 24 * u - Math.sin(an) * 12 * u]);
  }
  for (var i = 0; i < Nn; i++) {
    (function (idx) {
      var did = C.shape(c.graph, c.cut, c.cut.id + ' / Dandelion ' + idx, c.parent, cmds, { stroke: sc.fg, width: Math.max(1, 0.9 * u), alpha: 0.75 });
      var v = (40 + R.random(seed, idx, 2) * 50) * u, x0 = R.random(seed, idx, 3) * W, y0 = Hh * (0.15 + 0.7 * R.random(seed, idx, 5));
      C.sample(c.graph, did, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), x = wrap(x0 + dir * v * env.ltb, -60 * u, W + 120 * u);
        var y = wrap(y0 - 22 * u * env.ltb + Math.sin(env.ltb * 1.4 + idx) * 16 * u, -40 * u, Hh + 80 * u);
        var sp = H.toScene(c, x, y), al = H.clearOf(bb, x, y, 14 * u, 26 * u);
        return { 'position.x': sp[0], 'position.y': sp[1], rotation: -(dir * 12 + Math.sin(env.ltb * 1.2 + idx) * 18), alpha: 0.75 * al * outE(env) };
      });
    })(i);
  }
  return { seeds: Nn };
});

/* 37. fireflies */
reg('fireflies', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), m = H.decMG(c), bb = H.decBB(c);
  var col = acc(c), Nn = Math.min(12, 8 + (H.p(P, 'n', 0) | 0) * 2), seed = H.p(P, 'seed', c.cut.seed || 103);
  for (var i = 0; i < Nn; i++) {
    (function (idx) {
      var fid = C.shape(c.graph, c.cut, c.cut.id + ' / Firefly ' + idx, c.parent, G.ellipse(0, 0, 4 * u, 4 * u), { fill: col, alpha: 0.9 });
      var th = R.random(seed, idx, 2) * TAU, rad = 0.55 + 0.45 * R.random(seed, idx, 3), fq = 1.6 + R.random(seed, idx, 4) * 1.4, ph = R.random(seed, idx, 5) * 6;
      C.sample(c.graph, fid, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), a0 = th + Math.sin(env.ltb * 0.4 + idx) * 0.6;
        var x = cl(bb.cx + Math.cos(a0) * (W * 0.5 - m) * rad, m * 0.5, W - m * 0.5);
        var y = cl(bb.cy + Math.sin(a0) * (Hh * 0.5 - m) * rad, m * 0.5, Hh - m * 0.5);
        var al = H.clearOf(bb, x, y, 10 * u, 34 * u), pulse = 0.15 + 0.85 * Math.pow(Math.max(0, Math.sin(env.ltb * fq + ph)), 2);
        var sp = H.toScene(c, x, y);
        return { 'position.x': sp[0], 'position.y': sp[1], alpha: pulse * al * cl(env.lt / 0.4) * outE(env) };
      });
    })(i);
  }
  return { fireflies: Nn };
});

/* 38. memphis */
reg('memphis', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var K = 6, pad = 34 * u + bb.h * 0.22, X0 = bb.x0 - pad, X1 = bb.x1 + pad, Y0 = bb.y0 - pad, Y1 = bb.y1 + pad;
  var per = 2 * (X1 - X0 + Y1 - Y0), cols = [acc(c), acc2(c), sc.fg], S = cl(Math.min(W, Hh) * 0.036, 24 * u, 44 * u);
  var seed = H.p(P, 'seed', c.cut.seed || 107);
  for (var i = 0; i < K; i++) {
    var t = (i + 0.35) / K * per, x, y;
    if (t < X1 - X0) { x = X0 + t; y = Y0; }
    else if ((t -= X1 - X0) < Y1 - Y0) { x = X1; y = Y0 + t; }
    else if ((t -= Y1 - Y0) < X1 - X0) { x = X1 - t; y = Y1; }
    else { t -= X1 - X0; x = X0; y = Y1 - t; }
    x = cl(x, S * 1.6, W - S * 1.6); y = cl(y, S * 1.6, Hh - S * 1.6);
    if (H.clearOf(bb, x, y, S * 1.2, 1) < 1) continue;
    var cmds = i % 3 === 0 ? [['M', -S, -S * 0.3], ['L', -S * 0.3, S * 0.3], ['L', S * 0.3, -S * 0.3], ['L', S, S * 0.3]] : i % 3 === 1 ? [['M', 0, S * 0.8], ['L', S * 0.7, -S * 0.4], ['L', -S * 0.7, -S * 0.4], ['Z']] : G.ellipse(0, 0, S * 0.45, S * 0.45);
    var id = C.shape(c.graph, c.cut, c.cut.id + ' / Memphis ' + i, c.parent, cmds, i % 3 === 2 ? { fill: cols[i % 3], alpha: 1 } : { stroke: cols[i % 3], width: 3.2 * u, alpha: 1 });
    c.graph.byId[id].attrs.position = H.toScene(c, x, y);
    c.graph.byId[id].attrs.rotation = -(R.random(seed, i, 3) * 360);
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
      var env = R.env(c, f), q = E.outBack(cl(env.lt / 0.4), 2);
      return { 'scale.x': Math.max(0.05, q), 'scale.y': Math.max(0.05, q), alpha: outE(env) };
    });
  }
  return { count: K };
});

/* 39. zigzagRibbon */
reg('zigzagRibbon', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var rw = cl(Math.min(W, Hh) * 0.3, 200 * u, 420 * u), rh = rw * 0.42, sp = H.cornerSpot(c, bb, rw, rh, P, 0.6), a0 = sp.ok ? 1 : 0.3;
  var ox = sp.sx > 0 ? W + 20 * u : -20 * u, oy = sp.sy > 0 ? sp.y + rh * 0.75 : sp.y + rh * 0.25;
  var ix = sp.sx > 0 ? sp.x : sp.x + rw, iy = sp.sy > 0 ? sp.y + rh * 0.2 : sp.y + rh * 0.8;
  var seg = 7, wv = rh * 0.3, front = [], back = [];
  for (var k = 0; k < seg; k++) {
    var p0 = [mix(ox, ix, k / seg), mix(oy, iy, k / seg) + (k % 2 ? 20 : -20) * u];
    var p1 = [mix(ox, ix, (k + 1) / seg), mix(oy, iy, (k + 1) / seg) + ((k + 1) % 2 ? 20 : -20) * u];
    (k % 2 ? back : front).push([p0, p1, [p1[0], p1[1] + wv], [p0[0], p0[1] + wv]]);
  }
  var c1 = acc(c), c2 = H.mixHex(c1, sc.bg, 0.4);
  var bId = C.shape(c.graph, c.cut, c.cut.id + ' / Ribbon back', c.parent, H.polyCmds(c, back, true), { fill: c2, alpha: 0.95 * a0 });
  var fId = C.shape(c.graph, c.cut, c.cut.id + ' / Ribbon front', c.parent, H.polyCmds(c, front, true), { fill: c1, alpha: 0.95 * a0 });
  [bId, fId].forEach(function (id) { C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) { return { alpha: 0.95 * a0 * E.outCubic(cl(R.env(c, f).lt / 0.6)) * outE(R.env(c, f)) }; }); });
  return { ribbon: fId };
});

/* 40. polkaPatch */
reg('polkaPatch', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var cols = 6 + (H.p(P, 'n', 0) | 0), rows = 3 + ((H.p(P, 'v', 0) | 0) % 2), s = cl(Math.min(W, Hh) * 0.03, 20 * u, 36 * u);
  var sp = spot(c, bb, (cols - 0.5) * s, (rows - 1) * s * 0.87 + s, P, 24 * u), a0 = sp.ok ? 1 : 0.35, dots = [];
  for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) dots.push([sp.x + s * 0.5 + i * s + (j % 2 ? s * 0.5 : 0), sp.y + s * 0.5 + j * s * 0.87, s * 0.32]);
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / PolkaPatch', c.parent, H.dotCmds(c, dots), { fill: P.accent ? acc(c) : sc.fg, alpha: 0.9 * a0 });
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) { return { alpha: 0.9 * a0 * inE(R.env(c, f), 0.35, 0) * outE(R.env(c, f)) }; });
  return { dots: id };
});

/* 41. stripeCircle */
reg('stripeCircle', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var Rr = cl(Math.min(W, Hh) * 0.062, 40 * u, 80 * u), sp = spot(c, bb, Rr * 2.4, Rr * 2.4, P, 22 * u), a0 = sp.ok ? 1 : 0.35;
  var cx = sp.cx - 3 * u, cy = sp.cy - 3 * u;
  H.circle(c, 'StripeCircle sh', cx + 7 * u, cy + 7 * u, Rr, Rr, { stroke: sc.sub, width: Math.max(1, u), alpha: 0.7 * a0 });
  var rig = c.graph.add('null', c.cut.id + ' / StripeCircle rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, cx, cy) });
  var segs = [], sp2 = 8 * u;
  for (var d = -Rr * 0.9; d <= Rr * 0.9; d += sp2) {
    var chord = Math.sqrt(Math.max(0, Rr * Rr - d * d));
    segs.push(['M', d, -chord], ['L', d, chord]);
  }
  C.shape(c.graph, c.cut, c.cut.id + ' / StripeCircle fill', rig, segs, { stroke: acc(c), width: 3.2 * u, alpha: a0 });
  C.shape(c.graph, c.cut, c.cut.id + ' / StripeCircle rim', rig, G.ellipse(0, 0, Rr, Rr), { stroke: sc.fg, width: Math.max(1, 1.5 * u), alpha: a0 });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), e = E.outBack(cl(env.lt / 0.45), 1.5);
    return { rotation: -(45 + env.ltb * 18 * (P.right ? 1 : -1)), 'scale.x': Math.max(0.05, e), 'scale.y': Math.max(0.05, e) };
  });
  return { rig: rig };
});

/* 42. decoCorners */
reg('decoCorners', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), m = H.decMG(c), bb = H.decBB(c);
  var Lc = cl(Math.min(W, Hh) * 0.15, 90 * u, 190 * u), g = 9 * u, lw = Math.max(1, 1.3 * u);
  var cs = P.big ? [[-1, -1], [1, -1], [1, 1], [-1, 1]] : P.corner ? [[-1, -1], [1, 1]] : [[1, -1], [-1, 1]];
  var lines = [], diamonds = [];
  cs.forEach(function (pair) {
    var sx = pair[0], sy = pair[1], X = sx < 0 ? m * 0.7 : W - m * 0.7, Y = sy < 0 ? m * 0.7 : Hh - m * 0.7;
    if (H.hitBB(Math.min(X, X - sx * Lc), Math.min(Y, Y - sy * Lc), Math.max(X, X - sx * Lc), Math.max(Y, Y - sy * Lc), bb, 6 * u)) return;
    var ix = -sx, iy = -sy;
    lines.push([X + ix * Lc, Y, X, Y], [X, Y, X, Y + iy * Lc], [X + ix * Lc * 0.62, Y + iy * g, X + ix * g, Y + iy * g], [X + ix * g, Y + iy * g, X + ix * g, Y + iy * Lc * 0.62]);
    diamonds.push([[X + ix * Lc, Y - 4 * u], [X + ix * Lc + 4 * u, Y], [X + ix * Lc, Y + 4 * u], [X + ix * Lc - 4 * u, Y]]);
  });
  if (!lines.length) return { skip: true };
  var lid = C.shape(c.graph, c.cut, c.cut.id + ' / DecoCorners lines', c.parent, H.segCmds(c, lines), { stroke: sc.fg, width: lw, alpha: 0.85 });
  var did = C.shape(c.graph, c.cut, c.cut.id + ' / DecoCorners dia', c.parent, H.polyCmds(c, diamonds, true), { fill: acc(c), alpha: 1 });
  [lid, did].forEach(function (id) { C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) { return { alpha: E.outCubic(cl(R.env(c, f).lt / 0.5)) * outE(R.env(c, f)) }; }); });
  return { corners: lid };
});

/* 43. halfCircles */
reg('halfCircles', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var Rr = cl(Math.min(W, Hh) * 0.058, 38 * u, 74 * u), sp = spot(c, bb, Rr * 2.2, Rr * 2.5, P, 24 * u), a0 = sp.ok ? 1 : 0.35;
  var yb = sp.y + Rr * 2.5;
  for (var k = 0; k < 4; k++) {
    var rad = Rr * (1 - k * 0.2), pts = H.arcPts(sp.cx, yb, rad, 180, 360, 20);
    var id = C.shape(c.graph, c.cut, c.cut.id + ' / HalfCircle ' + k, c.parent, H.polyCmds(c, [pts], k % 2 === 0), k % 2 === 0 ? { fill: k === 0 ? acc(c) : sc.fg, alpha: 0.95 * a0 } : { stroke: sc.fg, width: 1.6 * u, alpha: a0 });
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) { return { alpha: a0 * E.outBack(cl(R.env(c, f).lt / 0.35), 1.6) * outE(R.env(c, f)) }; });
    yb -= rad * 0.62;
  }
  return { domes: 4 };
});

/* 44. loopArrows */
reg('loopArrows', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var Rr = cl(Math.min(W, Hh) * 0.055, 36 * u, 70 * u), sp = spot(c, bb, Rr * 2.8, Rr * 2.8, P, 22 * u), a0 = sp.ok ? 1 : 0.35;
  var n = 2 + ((H.p(P, 'n', 0) | 0) % 2), dir = P.right ? 1 : -1, rig = c.graph.add('null', c.cut.id + ' / LoopArrows rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, sp.cx, sp.cy) });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f) { return { rotation: -(dir * R.env(c, f).ltb * 70) }; });
  var seg = 360 / n, sw = seg - 38;
  for (var k = 0; k < n; k++) {
    var a0Deg = k * seg, a1Deg = a0Deg + dir * sw, pts = H.arcPts(0, 0, Rr, a0Deg, a1Deg, 20).map(function (pt, i) { return [i ? 'L' : 'M', pt[0], -pt[1]]; });
    C.shape(c.graph, c.cut, c.cut.id + ' / Loop arc ' + k, rig, pts, { stroke: sc.fg, width: Math.max(1.4, 2.4 * u), alpha: a0 });
  }
  H.circle(c, 'Loop rim', sp.cx, sp.cy, Rr * 1.32, Rr * 1.32, { stroke: sc.sub, width: Math.max(1, 0.8 * u), alpha: 0.35 * a0 });
  H.addText(c, 'Loop count', '\u00d71', sp.cx, sp.cy, Rr * 0.5, { role: 'mono', align: 'center', color: sc.fg });
  return { rig: rig };
});

/* 45. starburst */
reg('starburst', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var Rr = cl(Math.min(W, Hh) * 0.068, 44 * u, 88 * u), sp = H.nearBB(c, bb, Rr * 2.2, Rr * 2.2, P, 14 * u), a0 = sp.ok ? 1 : 0.35;
  var rig = c.graph.add('null', c.cut.id + ' / Starburst rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, sp.cx, sp.cy) });
  var cmds = H.starPts(0, 0, Rr, Rr * 0.83, 22, 0).map(function (pt, i) { return [i ? 'L' : 'M', pt[0], -pt[1]]; }).concat([['Z']]);
  var ac = acc(c), txtC = H.lum(ac) > 0.55 ? '#000000' : sc.bg;
  C.shape(c.graph, c.cut, c.cut.id + ' / Starburst badge', rig, cmds, { fill: ac, alpha: 0.97 * a0 });
  C.shape(c.graph, c.cut, c.cut.id + ' / Starburst rim', rig, G.ellipse(0, 0, Rr * 0.7, Rr * 0.7), { stroke: txtC, width: Math.max(1, 1.2 * u), alpha: 0.55 * a0 });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), q = E.outBack(cl((env.lt - 0.05) / 0.4), 2.2);
    return { rotation: -(env.ltb * 9 + (1 - q) * -120), 'scale.x': Math.max(0.05, q), 'scale.y': Math.max(0.05, q) };
  });
  var v = (H.p(P, 'v', 0) | 0) % 5, ch = H.lyricChar(c, 9) || '\u266a';
  var txt = ['No.' + pad2(((c.cut.line != null ? c.cut.line : 0) | 0) + 1), 'NEW', 'HIT!', ch, 'LOVE'][v];
  H.addText(c, 'Starburst txt', txt, W / 2, Hh / 2, Rr * 0.4, { role: 'display', align: 'center', color: txtC, parent: rig });
  return { rig: rig };
});

/* 46. tally */
var SEI = [[[0.1, 0.12], [0.9, 0.12]], [[0.5, 0.12], [0.5, 0.9]], [[0.5, 0.5], [0.84, 0.5]], [[0.22, 0.46], [0.22, 0.9]], [[0.02, 0.9], [0.98, 0.9]]];
reg('tally', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var nC = 2 + ((H.p(P, 'n', 0) | 0) % 2), S = cl(Math.min(W, Hh) * 0.064, 40 * u, 76 * u), gp = S * 0.3, fs = FS(c) * 1.05;
  var sp = spot(c, bb, nC * S + (nC - 1) * gp + fs * 3.2, S * 1.1, P, 24 * u), a0 = sp.ok ? 1 : 0.35;
  var col = P.accent ? acc(c) : sc.fg, lw = Math.max(1.6, 3 * u);
  for (var cc = 0; cc < nC; cc++) {
    var x0 = sp.x + cc * (S + gp), y0 = sp.y;
    SEI.forEach(function (seg, k) {
      var pts = [[x0 + seg[0][0] * S, y0 + seg[0][1] * S], [x0 + seg[1][0] * S, y0 + seg[1][1] * S]];
      var sid = H.poly(c, 'Tally ' + cc + '_' + k, pts, false, { stroke: col, width: lw, alpha: 0.95 * a0 });
      if (sid) C.sample(c.graph, sid, c.cut.start, c.cut.end, function (f) { return { alpha: 0.95 * a0 * E.outCubic(cl((R.env(c, f).lt - (cc * 5 + k) * 0.14) / 0.14)) * outE(R.env(c, f)) }; });
    });
  }
  var lx = sp.x + nC * (S + gp) - gp + fs * 0.8;
  H.addText(c, 'Tally mul', '\u00d7', lx, sp.y + S * 0.55, fs, { role: 'mono', align: 'center', color: sc.sub });
  H.stepText(c, 'Tally count', lx + fs * 0.9, sp.y + S * 0.55, fs * 1.3, { role: 'mono', align: 'center', color: sc.fg }, function (env) {
    return pad2(Math.min(nC * 5, Math.floor(env.lt / 0.14)));
  }, 10);
  return { tally: nC };
});

/* 47. cursorClick */
var CURSOR = [[0, 0], [0, 1], [0.27, 0.76], [0.45, 1.13], [0.6, 1.06], [0.42, 0.7], [0.74, 0.7]];
reg('cursorClick', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), m = H.decMG(c), bb = H.decBB(c);
  var Sc = cl(Math.min(W, Hh) * 0.034, 24 * u, 42 * u), sx = P.right ? 1 : -1;
  var tx = cl(sx > 0 ? bb.x1 + 10 * u : bb.x0 - 10 * u - Sc * 0.7, m * 0.5, W - m * 0.5 - Sc);
  var ty = cl((P.low ? bb.y1 : bb.y0) + (P.low ? 8 * u : -Sc * 1.2), m * 0.5, Hh - m * 0.5 - Sc * 1.2);
  var fx0 = tx + sx * W * 0.22, fy0 = ty + Hh * 0.18;
  var cmds = CURSOR.map(function (pt, i) { return [i ? 'L' : 'M', pt[0] * Sc, -pt[1] * Sc]; }).concat([['Z']]);
  var pid = C.shape(c.graph, c.cut, c.cut.id + ' / Cursor arrow', c.parent, cmds, { fill: sc.fg, stroke: sc.bg, width: Math.max(1, 1.4 * u), alpha: 1 });
  C.sample(c.graph, pid, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), mv = E.outCubic(cl(env.lt / 0.55));
    var x = mix(fx0, tx, mv) + Math.sin(mv * Math.PI) * 30 * u, y = mix(fy0, ty, mv);
    var sp = H.toScene(c, x, y), s = env.lt > 0.62 && env.lt < 0.74 ? 0.86 : 1;
    return { 'position.x': sp[0], 'position.y': sp[1], 'scale.x': s, 'scale.y': s, alpha: outE(env) };
  });
  var rip = H.circle(c, 'Cursor ripple', tx, ty, 24 * u, 24 * u, { stroke: acc(c), width: 2 * u, alpha: 1 });
  C.sample(c.graph, rip, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), q = cl((env.lt - 0.62) / 0.5);
    if (env.lt < 0.62 || q >= 1) return { alpha: 0 };
    var s = 0.25 + 0.8 * E.outCubic(q);
    return { 'scale.x': s, 'scale.y': s, alpha: (1 - q) * outE(env) };
  });
  return { cursor: pid };
});

/* 48. windowChrome */
reg('windowChrome', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), m = H.decMG(c), bb = H.decBB(c);
  var bar = cl(Math.min(W, Hh) * 0.036, 26 * u, 44 * u), px = 30 * u + bb.w * 0.03, py = 20 * u + bb.h * 0.08;
  var x0 = Math.max(bb.x0 - px, m * 0.35), x1 = Math.min(bb.x1 + px, W - m * 0.35);
  var y0 = Math.max(bb.y0 - py - bar, m * 0.35), y1 = Math.min(bb.y1 + py + bar * 0.6, Hh - m * 0.35);
  if (y0 + bar > bb.y0 - 4 * u) y0 = bb.y0 - 4 * u - bar;
  var lw = Math.max(1, 1.4 * u), rad = 8 * u;
  var fid = H.rect(c, 'Window frame', x0, y0, x1 - x0, y1 - y0, { stroke: sc.fg, width: lw, round: rad, alpha: 0.9 });
  H.rect(c, 'Window bar', x0, y0, x1 - x0, bar, { fill: sc.fg, round: rad, alpha: 0.1 });
  H.line(c, 'Window divider', [[x0, y0 + bar], [x1, y0 + bar]], sc.fg, lw, 0.8);
  var by = y0 + bar / 2, br = bar * 0.17;
  [acc(c), acc2(c), sc.sub].forEach(function (col, k) { H.circle(c, 'Win btn ' + k, x0 + bar * 0.55 + k * br * 3, by, br, br, { fill: col, alpha: 1 }); });
  H.addText(c, 'Window title', 'lyric_' + pad2(((c.cut.line != null ? c.cut.line : 0) | 0) + 1) + '.txt', (x0 + x1) / 2, by, FS(c) * 0.92, { role: 'mono', align: 'center', color: sc.fg });
  return { frame: fid };
});

/* 49. progressBar */
reg('progressBar', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var fs = FS(c) * 0.9, th = cl(Math.min(W, Hh) * 0.014, 10 * u, 18 * u), w = Math.min(W * 0.4, 460 * u, Math.max(bb.w * 0.65, 260 * u));
  var sp = bandSpot(c, bb, w, th + fs * 3.2, P, 26 * u), a0 = sp.ok ? 1 : 0.35, ty = sp.y + fs * 1.5, dur = Math.max(0.5, (c.cut.end - c.cut.start) / c.comp.fps);
  H.rect(c, 'ProgBar track', sp.x, ty, w, th, { stroke: sc.fg, width: Math.max(1, 1.2 * u), round: th / 2, alpha: 0.8 * a0 });
  var spL = H.toScene(c, sp.x + 2 * u, ty + th / 2);
  var fid = C.shape(c.graph, c.cut, c.cut.id + ' / ProgBar fill', c.parent, H.roundRectCmds((w - 4 * u) / 2, 0, w - 4 * u, Math.max(2, th - 4 * u), th / 3), { fill: acc(c), alpha: a0 });
  c.graph.byId[fid].attrs.position = spL;
  C.sample(c.graph, fid, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), p = Math.max(0.01, cl(env.lt / (dur * 0.85)));
    return { 'scale.x': E.inOutCubic(p), alpha: a0 * outE(env) };
  });
  H.addText(c, 'ProgBar title', 'Loading...', sp.x, sp.y + fs * 0.6, fs, { role: 'body', align: 'left', color: sc.fg });
  H.stepText(c, 'ProgBar pct', sp.x + w, sp.y + fs * 0.6, fs, { role: 'mono', align: 'right', color: sc.fg }, function (env) {
    return Math.min(100, Math.floor(cl(env.lt / (dur * 0.85)) * 100)) + '%';
  }, 10);
  return { fill: fid };
});

/* 50. toggleSwitch */
var TOGGLE_LABELS = [['SHUFFLE', 'REPEAT', 'LYRICS'], ['LOVE', 'MEMORY', 'REPLAY']];
reg('toggleSwitch', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var n = 2 + ((H.p(P, 'n', 0) | 0) % 2), th = cl(Math.min(W, Hh) * 0.034, 24 * u, 44 * u), tw = th * 1.8, rowH = th * 1.7, fs = th * 0.58;
  var labs = TOGGLE_LABELS[(H.p(P, 'v', 0) | 0) % TOGGLE_LABELS.length], sp = spot(c, bb, fs * 6 + 16 * u + tw, n * rowH, P, 24 * u), a0 = sp.ok ? 1 : 0.35;
  var ac = acc(c), knobC = H.lum(ac) > 0.6 ? '#000000' : sc.bg;
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var y = sp.y + idx * rowH + (rowH - th) / 2, x = sp.x + fs * 6 + 16 * u;
      H.addText(c, 'Toggle lbl ' + idx, labs[idx], sp.x, y + th / 2, fs, { role: 'body', align: 'left', color: sc.fg });
      H.rect(c, 'Toggle pill ' + idx, x, y, tw, th, { fill: ac, stroke: ac, width: Math.max(1, 1.2 * u), round: th / 2, alpha: a0 });
      var kid = C.shape(c.graph, c.cut, c.cut.id + ' / Toggle knob ' + idx, c.parent, G.ellipse(0, 0, th * 0.38, th * 0.38), { fill: knobC, alpha: a0 });
      C.sample(c.graph, kid, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), on = E.outBack(cl((env.lt - 0.45 - idx * 0.32) / 0.25), 1.6);
        var p = H.toScene(c, x + th / 2 + (tw - th) * on, y + th / 2);
        return { 'position.x': p[0], 'position.y': p[1], alpha: a0 * outE(env) };
      });
    })(i);
  }
  return { switches: n };
});

/* 51. notifBell */
reg('notifBell', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var S = cl(Math.min(W, Hh) * 0.075, 48 * u, 92 * u), fs = FS(c) * 0.95;
  var sp = spot(c, bb, S * 1.9, S * 1.7 + fs * 1.8, P, 22 * u), a0 = sp.ok ? 1 : 0.35, cx = sp.cx - S * 0.15, cy = sp.y + S * 0.95;
  var rig = c.graph.add('null', c.cut.id + ' / Bell rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, cx, cy - S * 0.5) });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), since = Math.max(0, (env.lt - 0.35) % 0.5), ring = env.lt > 0.35 ? Math.exp(-since * 5) * Math.sin(since * 30) * 16 : 0;
    return { rotation: -ring };
  });
  var bPts = [[-0.44, -0.86], [-0.34, -0.38], [0, -0.03], [0.34, -0.38], [0.44, -0.86]].map(function (pt, i) { return [i ? 'L' : 'M', pt[0] * S, pt[1] * S]; }).concat([['Z']]);
  C.shape(c.graph, c.cut, c.cut.id + ' / Bell body', rig, bPts, { stroke: sc.fg, width: Math.max(1.4, 2 * u), alpha: a0 });
  var ac = acc(c), br = S * 0.26;
  H.circle(c, 'Bell badge', cx + S * 0.36, cy - S * 0.42, br, br, { fill: ac, stroke: sc.bg, width: 2 * u, alpha: a0 });
  H.stepText(c, 'Bell count', cx + S * 0.36, cy - S * 0.42, br * 1.15, { role: 'display', align: 'center', color: H.lum(ac) > 0.6 ? '#000000' : sc.bg }, function (env) {
    return String(Math.min(9, 1 + Math.floor(Math.max(0, env.lt - 0.35) / 0.5)));
  }, 6);
  return { bell: rig };
});

/* 52. likeCounter */
reg('likeCounter', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var S = cl(Math.min(W, Hh) * 0.042, 28 * u, 52 * u), fs = S * 0.85, seed = H.p(P, 'seed', c.cut.seed || 109);
  var base = 1000 + R.hash(seed, 5) % 90000, sp = spot(c, bb, S * 2.4 + fs * 4, S * 2.4, P, 20 * u), a0 = sp.ok ? 1 : 0.35;
  var hx = sp.x + S * 1.2, hy = sp.cy;
  var hPts = [];
  for (var i = 0; i < 28; i++) {
    var t = i / 28 * TAU, x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    hPts.push([i ? 'L' : 'M', x * S / 17, y * S / 17]);
  }
  hPts.push(['Z']);
  var hid = C.shape(c.graph, c.cut, c.cut.id + ' / Like heart', c.parent, hPts, { fill: acc(c), stroke: acc(c), width: Math.max(1.4, 2 * u), alpha: a0 });
  c.graph.byId[hid].attrs.position = H.toScene(c, hx, hy);
  C.sample(c.graph, hid, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), liked = cl((env.lt - 0.45) / 0.3), s = liked > 0 ? 1 + 0.35 * Math.sin(Math.PI * cl(liked * 1.4)) : E.outBack(cl(env.lt / 0.3), 1.6);
    return { 'scale.x': Math.max(0.05, s), 'scale.y': Math.max(0.05, s), alpha: a0 * outE(env) };
  });
  H.stepText(c, 'Like count', hx + S * 1.25, hy, fs, { role: 'mono', align: 'left', color: sc.fg }, function (env) {
    return String(base + Math.floor(Math.max(0, env.lt - 0.45) / 0.38));
  }, 8);
  return { heart: hid };
});

/* 53. mediaControls */
reg('mediaControls', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var Rr = cl(Math.min(W, Hh) * 0.04, 28 * u, 52 * u), fs = FS(c) * 0.9, sp = bandSpot(c, bb, Rr * 6.4, Rr * 2.2 + fs * 1.8, P, 34 * u), a0 = sp.ok ? 1 : 0.35;
  var cx = sp.cx, cy = sp.y + Rr * 1.1;
  H.circle(c, 'Media ring', cx, cy, Rr, Rr, { stroke: sc.fg, width: Math.max(1.2, 1.6 * u), alpha: a0 });
  var s = Rr * 0.42;
  H.rect(c, 'Pause L', cx - s * 0.4, cy - s * 0.5, s * 0.28, s, { fill: sc.fg, alpha: a0 });
  H.rect(c, 'Pause R', cx + s * 0.12, cy - s * 0.5, s * 0.28, s, { fill: sc.fg, alpha: a0 });
  [-1, 1].forEach(function (dir) {
    var x = cx + dir * Rr * 2.3, ss = Rr * 0.36;
    H.poly(c, 'Skip ' + dir, [[x - dir * ss * 0.6, cy - ss], [x + dir * ss * 0.9, cy], [x - dir * ss * 0.6, cy + ss]], true, { fill: sc.fg, alpha: a0 });
  });
  H.addText(c, 'Media time', '0:00 / 3:20', cx, cy + Rr * 1.1 + fs * 1.1, fs, { role: 'mono', align: 'center', color: sc.sub });
  return { controls: cx };
});

/* 54. volumeBars */
reg('volumeBars', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var S = cl(Math.min(W, Hh) * 0.042, 28 * u, 52 * u), nB = 8, bwid = S * 0.3, gap = S * 0.18, fs = FS(c) * 0.9;
  var sp = spot(c, bb, S * 1.9 + nB * (bwid + gap), S * 1.8 + fs * 1.6, P, 22 * u), a0 = sp.ok ? 1 : 0.35;
  var x0 = sp.x, yb = sp.y + S * 1.6, cy = yb - S * 0.55;
  H.poly(c, 'Vol speaker', [[x0, cy - S * 0.2], [x0 + S * 0.25, cy - S * 0.2], [x0 + S * 0.6, cy - S * 0.48], [x0 + S * 0.6, cy + S * 0.48], [x0 + S * 0.25, cy + S * 0.2], [x0, cy + S * 0.2]], true, { fill: sc.fg, alpha: a0 });
  for (var i = 0; i < nB; i++) {
    var bh0 = S * (0.3 + 1.3 * (i + 1) / nB), bx = x0 + S * 1.5 + i * (bwid + gap);
    H.rect(c, 'Vol bar ' + i, bx, yb - bh0, bwid, bh0, { fill: i === nB - 2 ? acc(c) : sc.fg, alpha: (i < nB - 1 ? 0.9 : 0.3) * a0 });
  }
  H.addText(c, 'Vol label', 'VOL 07', x0, yb + fs * 1.0, fs, { role: 'mono', align: 'left', color: sc.sub });
  return { bars: nB };
});

/* 55. musicNotes */
reg('musicNotes', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var Nn = Math.min(8, 5 + (H.p(P, 'n', 0) | 0) * 2), S = cl(Math.min(W, Hh) * 0.036, 24 * u, 44 * u), pad = 26 * u + bb.h * 0.15;
  var X0 = bb.x0 - pad, X1 = bb.x1 + pad, Y0 = bb.y0 - pad, Y1 = bb.y1 + pad, per = 2 * (X1 - X0 + Y1 - Y0);
  var cols = [sc.fg, acc(c), acc2(c)], seed = H.p(P, 'seed', c.cut.seed || 113);
  for (var i = 0; i < Nn; i++) {
    (function (idx) {
      var pt = ((idx + R.random(seed, idx, 3)) / Nn) * per, x, y;
      if (pt < X1 - X0) { x = X0 + pt; y = Y0; }
      else if ((pt -= X1 - X0) < Y1 - Y0) { x = X1; y = Y0 + pt; }
      else if ((pt -= Y1 - Y0) < X1 - X0) { x = X1 - pt; y = Y1; }
      else { pt -= X1 - X0; x = X0; y = Y1 - pt; }
      x = cl(x, S, W - S); y = cl(y, S * 1.5, Hh - S);
      var nid = C.shape(c.graph, c.cut, c.cut.id + ' / Music note ' + idx, c.parent, G.ellipse(0, 0, S * 0.28, S * 0.2).concat([['M', S * 0.24, 0], ['L', S * 0.24, S * 0.9]]), { fill: cols[idx % 3], stroke: cols[idx % 3], width: Math.max(1.2, S * 0.08), alpha: 0.9 });
      C.sample(c.graph, nid, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), tau = ((env.ltb + idx * 0.35) % 2.4) / 2.4;
        var nx = x + Math.sin(tau * TAU + idx) * 12 * u, ny = y - tau * 80 * u;
        var sp = H.toScene(c, nx, ny);
        return { 'position.x': sp[0], 'position.y': sp[1], rotation: -(Math.sin(tau * 5 + idx) * 14 - 6), alpha: Math.sin(Math.PI * tau) * outE(env) };
      });
    })(i);
  }
  return { notes: Nn };
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZHelpers);
