/* JIZURA Cavalry Pack: x2decA (29 line-work decor recipes from src/11p_x2_decA.js; xlLadder is in p_requested_decor.js) */
(function (N, G, C, R, V, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, TAU = H.TAU, DEG = H.DEG;

function reg(key, build) {
  N.register('decor', key, {
    source: 'src/11p_x2_decA.js D(' + key + ')',
    scope: 'cut',
    build: build,
    differences: ['Native Cavalry editable shape/text geometry following src/11p_x2_decA.js.']
  });
}

function acc(c) { return H.accCol(c.sc, c.sc.bg, false); }
function colOf(c, P) { return P && P.accent ? acc(c) : c.sc.fg; }
function subOf(c) { return H.subCol(c.sc, c.sc.bg); }
function FS(c) { return Math.max(12, 16 * H.decU(c)); }
function ein(t, d, delay, ease) { return (ease || E.outExpo)(cl((t - (delay || 0)) / (d || 0.4))); }
function mod(a, n) { return ((a % n) + n) % n; }
function phaseOf(c, f) {
  var env = R.env(c, f);
  var s = cl((c.cut.inDur || 0) * 0.6, 0, 0.35);
  var t = env.lt - s;
  var o = 1 - E.inCubic(env.pOut || 0);
  return { env: env, t: t, o: o, ltb: env.ltb, ok: t > 0 && o > 0.003 };
}
function padBB(bb, u, k) { return (24 * u + Math.min(bb.w, bb.h) * 0.14) * (k == null ? 1 : k); }
function frameBox(c, bb, pad) {
  var m = H.decMG(c) * 0.35, W = c.comp.width, Hh = c.comp.height;
  var x0 = Math.max(m, bb.x0 - pad), y0 = Math.max(m, bb.y0 - pad);
  var x1 = Math.min(W - m, bb.x1 + pad), y1 = Math.min(Hh - m, bb.y1 + pad);
  if (x1 <= x0) { x0 = m; x1 = W - m; }
  if (y1 <= y0) { y0 = m; y1 = Hh - m; }
  return { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
function axesOf(c, bb, forceH) {
  var W = c.comp.width, Hh = c.comp.height;
  var vert = !forceH && bb.h > bb.w * 1.25;
  return vert
    ? { vert: true, L0: bb.y0, L1: bb.y1, C0: bb.x0, C1: bb.x1, AM: Hh, CM: W, M: function (a, z) { return [z, a]; } }
    : { vert: false, L0: bb.x0, L1: bb.x1, C0: bb.y0, C1: bb.y1, AM: W, CM: Hh, M: function (a, z) { return [a, z]; } };
}
function sideBand(c, ax, h, plus, gap) {
  var m = H.decMG(c) * 0.5;
  var rp = ax.CM - m - (ax.C1 + gap), rm = ax.C0 - gap - m;
  var s = plus ? 1 : -1;
  if ((s > 0 ? rp : rm) < h) {
    if ((s > 0 ? rm : rp) >= h) s = -s;
    else s = rp >= rm ? 1 : -1;
  }
  var room = Math.max(s > 0 ? rp : rm, 4), hh = Math.min(h, room);
  var edge = s > 0 ? ax.C1 + gap : ax.C0 - gap;
  return { s: s, room: room, edge: edge, c: edge + s * hh / 2, h: hh };
}
function mkPath(pts, closed) {
  var q = closed ? pts.concat([pts[0]]) : pts.slice();
  var cum = [0];
  for (var i = 1; i < q.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]));
  }
  return { pts: q, cum: cum, L: cum[cum.length - 1] || 1e-6 };
}
function atPath(pa, s) {
  var pts = pa.pts, cum = pa.cum;
  s = cl(s, 0, pa.L);
  var i = 1;
  while (i < cum.length - 1 && cum[i] < s) i++;
  var d = cum[i] - cum[i - 1] || 1e-6, k = (s - cum[i - 1]) / d;
  return [mix(pts[i - 1][0], pts[i][0], k), mix(pts[i - 1][1], pts[i][1], k), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])];
}
function spanPts(pa, s0, s1, wrap) {
  var out = []; if (!(s1 > s0)) return out;
  var pts = pa.pts, cum = pa.cum, L = pa.L;
  if (!wrap) {
    s0 = Math.max(0, s0); s1 = Math.min(L, s1); if (!(s1 > s0)) return out;
    var p0 = atPath(pa, s0); out.push([p0[0], p0[1]]);
    for (var i = 0; i < pts.length; i++) if (cum[i] > s0 && cum[i] < s1) out.push(pts[i]);
    var p1 = atPath(pa, s1); out.push([p1[0], p1[1]]);
    return out;
  }
  if (s1 - s0 >= L) return pts;
  var q0 = atPath(pa, mod(s0, L)); out.push([q0[0], q0[1]]);
  for (var k = Math.floor(s0 / L) * L, g = 0; k < s1 && g < 4; k += L, g++) {
    for (var j = 0; j < pts.length - 1; j++) {
      var v = cum[j] + k;
      if (v > s0 && v < s1) out.push(pts[j]);
    }
  }
  var q1 = atPath(pa, mod(s1, L) || (s1 > 0 ? L : 0)); out.push([q1[0], q1[1]]);
  return out;
}
function rrectPts(x0, y0, x1, y1, r, n) {
  n = n || 8;
  r = Math.max(0, Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2));
  if (r < 0.6) return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  var out = [], cs = [[x0 + r, y0 + r, 180], [x1 - r, y0 + r, 270], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90]];
  cs.forEach(function (cp) {
    for (var i = 0; i <= n; i++) {
      var a = (cp[2] + 90 * i / n) * DEG;
      out.push([cp[0] + Math.cos(a) * r, cp[1] + Math.sin(a) * r]);
    }
  });
  return out;
}
function quadPts(a, b, cp, n) {
  n = n || 10;
  var out = [];
  for (var i = 0; i <= n; i++) {
    var t = i / n, k = 1 - t;
    out.push([k * k * a[0] + 2 * k * t * b[0] + t * t * cp[0], k * k * a[1] + 2 * k * t * b[1] + t * t * cp[1]]);
  }
  return out;
}
function segStroke(c, name, x0, y0, x1, y1, color, width, alphaFn, parent) {
  var dx = x1 - x0, dy = y1 - y0;
  if (Math.hypot(dx, dy) < 0.5) return null;
  var sp = H.toScene(c, x0, y0);
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / ' + name, parent || c.parent, [['M', 0, 0], ['L', dx, -dy]], {
    stroke: color, width: Math.max(0.5, width), cap: 'butt', alpha: 1
  });
  c.graph.byId[id].attrs.position = sp;
  if (alphaFn) {
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
      return alphaFn(phaseOf(c, f), sp, dx, dy, f);
    });
  }
  return id;
}

/* 1. xlGapFrame */
reg('xlGapFrame', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), sc = c.sc;
  var f = frameBox(c, bb, padBB(bb, u, 1.15)), col = colOf(c, P);
  var pts = [[f.x0, f.y0], [f.x1, f.y0], [f.x1, f.y1], [f.x0, f.y1]];
  var sh = (H.p(P, 'v', 0) | 0) % 4;
  pts = pts.slice(sh).concat(pts.slice(0, sh));
  if (!P.right) pts = [pts[0]].concat(pts.slice(1).reverse());
  var pa = mkPath(pts, true), k = cl(H.p(P, 'n', 1) | 0, 1, 3) + 1;
  var segs = [];
  var gap = cl(pa.L * 0.045, 18 * u, 64 * u), cell = pa.L / k;
  for (var i = 0; i < k; i++) {
    var sub = spanPts(pa, i * cell, (i + 1) * cell - gap, true);
    for (var j = 1; j < sub.length; j++) segs.push([sub[j - 1][0], sub[j - 1][1], sub[j][0], sub[j][1]]);
  }
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / xlGapFrame', c.parent, H.segCmds(c, segs), { stroke: col, width: Math.max(1, 3 * u), alpha: 1 });
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
    var q = phaseOf(c, f);
    if (!q.ok) return { alpha: 0 };
    var e = ein(q.t, 0.55, 0, E.inOutCubic);
    return { alpha: Math.min(1, q.o * 1.6) * e, 'scale.x': 0.94 + 0.06 * e, 'scale.y': 0.94 + 0.06 * e };
  });
  if (P.big) {
    var d = 9 * u, outerPts = pts.map(function (pt) { return [pt[0] + (pt[0] < f.cx ? -d : d), pt[1] + (pt[1] < f.cy ? -d : d)]; });
    var pb = mkPath(outerPts, true), segs2 = [];
    for (var m = 0; m < k; m++) {
      var s2 = spanPts(pb, (m + 0.5) * pb.L / k, (m + 1.5) * pb.L / k - gap, true);
      for (var n = 1; n < s2.length; n++) segs2.push([s2[n - 1][0], s2[n - 1][1], s2[n][0], s2[n][1]]);
    }
    var id2 = C.shape(c.graph, c.cut, c.cut.id + ' / xlGapFrame outer', c.parent, H.segCmds(c, segs2), { stroke: subOf(c), width: Math.max(0.8, 1.1 * u), alpha: 0.7 });
    C.sample(c.graph, id2, c.cut.start, c.cut.end, function (f) {
      var q = phaseOf(c, f); if (!q.ok) return { alpha: 0 };
      return { alpha: 0.7 * q.o * ein(q.t, 0.55, 0.15, E.inOutCubic) };
    });
  }
  return { layer: id };
});

/* 2. xlHopCorners */
reg('xlHopCorners', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), sc = c.sc;
  var f = frameBox(c, bb, padBB(bb, u)), col = colOf(c, P);
  var corners = [[f.x0, f.y0], [f.x1, f.y0], [f.x1, f.y1], [f.x0, f.y1]];
  var arm = Math.min(f.w, f.h) * 0.2 + 10 * u, cnt = (H.p(P, 'n', 1) | 0) >= 2 ? 2 : 1;
  var dirs = [[1, 0, 0, 1], [-1, 0, 0, 1], [-1, 0, 0, -1], [1, 0, 0, -1]];
  var ids = [];
  for (var j = 0; j < cnt; j++) {
    for (var k = 0; k < 4; k++) {
      (function (cornerIdx, pass) {
        var pt = corners[cornerIdx], d = dirs[cornerIdx];
        var pts = [[pt[0] + d[0] * arm, pt[1] + d[1] * arm], pt, [pt[0] + d[2] * arm, pt[1] + d[3] * arm]];
        var id = H.poly(c, 'xlHopCorner ' + pass + '_' + cornerIdx, pts, false, { stroke: col, width: Math.max(1, 3.6 * u), alpha: 1 });
        C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
          var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
          var T = 0.85, st = Math.floor(q.t / T), dir = P.right ? 1 : -1;
          var active = mod((H.motionAmt(c) > 0.05 ? st : 0) * dir + pass * 2 + (H.p(P, 'v', 0) | 0), 4) === cornerIdx;
          var e = ein(q.t, 0.35) * q.o;
          return { alpha: active ? e : 0 };
        });
        ids.push(id);
      })(k, j);
    }
  }
  corners.forEach(function (pt, idx) {
    var did = H.circle(c, 'xlHopDot ' + idx, pt[0], pt[1], 2.4 * u, 2.4 * u, { fill: subOf(c), alpha: 0.7 });
    C.sample(c.graph, did, c.cut.start, c.cut.end, function (f0) {
      var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
      return { alpha: 0.7 * q.o * ein(q.t, 0.3, idx * 0.05) };
    });
  });
  return { count: ids.length };
});

/* 3. xlSketchBox */
reg('xlSketchBox', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c);
  var f = frameBox(c, bb, padBB(bb, u, 1.1)), col = colOf(c, P), sd = H.p(P, 'seed', c.cut.seed || 11);
  var ed = [[f.x0, f.y0, f.x1, f.y0], [f.x1, f.y0, f.x1, f.y1], [f.x1, f.y1, f.x0, f.y1], [f.x0, f.y1, f.x0, f.y0]];
  var ids = [];
  for (var ps = 0; ps < 2; ps++) {
    for (var k = 0; k < 4; k++) {
      (function (pass, side) {
        var e0 = ed[side], L = Math.hypot(e0[2] - e0[0], e0[3] - e0[1]) || 1;
        var dx = (e0[2] - e0[0]) / L, dy = (e0[3] - e0[1]) / L, nx = -dy, ny = dx;
        var o0 = (6 + 14 * R.random(sd, side, pass, 1)) * u, o1 = (6 + 14 * R.random(sd, side, pass, 2)) * u;
        var pts = [];
        for (var i = 0; i <= 6; i++) {
          var s = i / 6, a = -o0 + (L + o0 + o1) * s;
          var jit = (R.rs(sd, side, pass, i, 3) * 2.6 + (pass ? 3 : -1) * Math.sin(s * Math.PI) + R.rs(sd, side, pass, 5) * 4 * (s - 0.5)) * u;
          pts.push([e0[0] + dx * a + nx * jit, e0[1] + dy * a + ny * jit]);
        }
        var sp = H.toScene(c, pts[0][0], pts[0][1]);
        var cmds = pts.map(function (pt, idx) { return [idx ? 'L' : 'M', pt[0] - pts[0][0], -(pt[1] - pts[0][1])]; });
        var id = C.shape(c.graph, c.cut, c.cut.id + ' / xlSketch ' + pass + '_' + side, c.parent, cmds, {
          stroke: col, width: Math.max(0.8, (pass ? 1.8 : 2.8) * u), alpha: 1
        });
        c.graph.byId[id].attrs.position = sp;
        C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
          var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
          var ev = ein(q.t, 0.24, side * 0.12 + pass * 0.5, E.inOutCubic);
          var frac = Math.max(0.001, ev - (1 - q.o));
          return {
            'scale.x': Math.abs(dx) > 0.5 ? frac : 1,
            'scale.y': Math.abs(dy) > 0.5 ? frac : 1,
            alpha: ev > (1 - q.o) ? (pass ? 0.6 : 0.95) * Math.min(1, q.o * 2) : 0
          };
        });
        ids.push(id);
      })(ps, k);
    }
  }
  return { count: ids.length };
});

/* 4. xlDashTrack */
reg('xlDashTrack', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), sc = c.sc;
  var f = frameBox(c, bb, padBB(bb, u, 1.7)), dir = P.right ? 1 : -1;
  var pa = mkPath(rrectPts(f.x0, f.y0, f.x1, f.y1, Math.min(f.w, f.h) / 2, 10), true);
  var step = 19 * u, dashLen = 11 * u, segs = [];
  for (var s = 0; s < pa.L; s += step) {
    var sub = spanPts(pa, s, Math.min(pa.L, s + dashLen), true);
    if (sub.length >= 2) segs.push([sub[0][0], sub[0][1], sub[sub.length - 1][0], sub[sub.length - 1][1]]);
  }
  var trackId = C.shape(c.graph, c.cut, c.cut.id + ' / xlDashTrack loop', c.parent, H.segCmds(c, segs), { stroke: sc.fg, width: Math.max(1, 2.2 * u), alpha: 0.9 });
  C.sample(c.graph, trackId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
    var e = ein(q.t, 0.6, 0, E.inOutCubic);
    return { alpha: 0.9 * q.o * e };
  });
  var st = atPath(pa, pa.L * 0.07), nx = -Math.sin(st[2]), ny = Math.cos(st[2]), g = 11 * u;
  var startId = C.shape(c.graph, c.cut, c.cut.id + ' / xlDashTrack start', c.parent, H.segCmds(c, [
    [st[0] - nx * g, st[1] - ny * g, st[0] + nx * g, st[1] + ny * g],
    [st[0] - nx * g + Math.cos(st[2]) * 4 * u, st[1] - ny * g + Math.sin(st[2]) * 4 * u, st[0] + nx * g + Math.cos(st[2]) * 4 * u, st[1] + ny * g + Math.sin(st[2]) * 4 * u]
  ]), { stroke: sc.fg, width: Math.max(0.8, 1.6 * u), alpha: 1 });
  C.sample(c.graph, startId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
    return { alpha: q.o * ein(q.t, 0.25, 0.1) };
  });
  var r = 13 * u, runPts = [[r * 1.3, 0], [Math.cos(2.5) * r * 0.9, Math.sin(2.5) * r * 0.9], [Math.cos(-2.5) * r * 0.9, Math.sin(-2.5) * r * 0.9]];
  var runner = C.shape(c.graph, c.cut, c.cut.id + ' / xlDashTrack runner', c.parent,
    [['M', runPts[0][0], -runPts[0][1]], ['L', runPts[1][0], -runPts[1][1]], ['L', runPts[2][0], -runPts[2][1]], ['Z']],
    { fill: acc(c), alpha: 1 });
  C.sample(c.graph, runner, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0), ra = q.ok ? ein(q.t, 0.25, 0.45) * q.o : 0;
    if (ra <= 0.005) return { alpha: 0 };
    var sl = pa.L * 0.07 + dir * Math.max(0, q.t - 0.45) * (90 + 160 * H.motionAmt(c)) * u;
    var pt = atPath(pa, mod(sl, pa.L)), sp = H.toScene(c, pt[0], pt[1]);
    return { 'position.x': sp[0], 'position.y': sp[1], rotation: -((pt[2] + (dir < 0 ? Math.PI : 0)) / DEG), alpha: ra };
  });
  return { track: trackId, runner: runner };
});

/* 5. xlBubbleLine */
reg('xlBubbleLine', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), m = H.decMG(c) * 0.35, Hh = c.comp.height;
  var f0 = frameBox(c, bb, padBB(bb, u, 1.5)), col = colOf(c, P);
  var r = Math.min(f0.h * 0.38, 44 * u, f0.w / 2);
  var rb = Hh - m - f0.y1, rt = f0.y0 - m;
  var side = P.low ? (rb >= 22 * u ? 1 : rt >= 22 * u ? -1 : 0) : (rt >= 22 * u ? -1 : rb >= 22 * u ? 1 : 0);
  var tw = Math.min(46 * u, Math.max(0, f0.w - 2 * r) * 0.6);
  if (tw < 10 * u) side = 0;
  var tl = Math.min((side > 0 ? rb : rt) * 0.8, 64 * u);
  var tx = cl(f0.cx + (P.right ? 0.2 : -0.2) * f0.w, f0.x0 + r + tw / 2, f0.x1 - r - tw / 2);
  var sk = (P.right ? 1 : -1) * 26 * u, thought = (H.p(P, 'v', 0) | 0) % 2 === 1;
  var rig = c.graph.add('null', c.cut.id + ' / xlBubble rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, f0.cx, f0.cy) });
  function arc(cx, cy, a0) {
    var o = [];
    for (var i = 0; i <= 8; i++) {
      var a = (a0 + 90 * i / 8) * DEG;
      o.push([cx - f0.cx + Math.cos(a) * r, cy - f0.cy + Math.sin(a) * r]);
    }
    return o;
  }
  var pts = arc(f0.x0 + r, f0.y0 + r, 180);
  if (side < 0 && !thought) pts.push([tx - tw / 2 - f0.cx, f0.y0 - f0.cy], [tx + sk - f0.cx, f0.y0 - tl - f0.cy], [tx + tw / 2 - f0.cx, f0.y0 - f0.cy]);
  pts = pts.concat(arc(f0.x1 - r, f0.y0 + r, 270), arc(f0.x1 - r, f0.y1 - r, 0));
  if (side > 0 && !thought) pts.push([tx + tw / 2 - f0.cx, f0.y1 - f0.cy], [tx + sk - f0.cx, f0.y1 + tl - f0.cy], [tx - tw / 2 - f0.cx, f0.y1 - f0.cy]);
  pts = pts.concat(arc(f0.x0 + r, f0.y1 - r, 90));
  var cmds = pts.map(function (pt, i) { return [i ? 'L' : 'M', pt[0], -pt[1]]; });
  cmds.push(['Z']);
  var bid = C.shape(c.graph, c.cut, c.cut.id + ' / xlBubble outline', rig, cmds, { stroke: col, width: Math.max(1, 3.2 * u), alpha: 1 });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f) {
    var q = phaseOf(c, f), s = mix(0.9, 1, E.outBack(cl(q.t / 0.4), 2));
    return { 'scale.x': s, 'scale.y': s };
  });
  C.sample(c.graph, bid, c.cut.start, c.cut.end, function (f) {
    var q = phaseOf(c, f); if (!q.ok) return { alpha: 0 };
    return { alpha: Math.min(1, q.o * 1.5) * ein(q.t, 0.55, 0, E.inOutCubic) };
  });
  if (thought && side) {
    var yBase = side > 0 ? f0.y1 : f0.y0;
    [[0.28, 13], [0.66, 8.5], [1, 5]].forEach(function (pair, i) {
      var dotId = H.circle(c, 'xlBubble dot ' + i, tx + sk * pair[0] * 1.4, yBase + side * tl * pair[0], pair[1] * u, pair[1] * u, { stroke: col, width: Math.max(0.8, 2.2 * u), alpha: 1 });
      C.sample(c.graph, dotId, c.cut.start, c.cut.end, function (f) {
        var q = phaseOf(c, f); if (!q.ok) return { alpha: 0 };
        var sc2 = E.outBack(cl((q.t - 0.35 - i * 0.1) / 0.25), 2) * q.o;
        return { 'scale.x': Math.max(0.01, sc2), 'scale.y': Math.max(0.01, sc2), alpha: sc2 > 0.02 ? q.o : 0 };
      });
    });
  }
  return { rig: rig };
});

/* 6. xlTransformBox */
reg('xlTransformBox', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), sc = c.sc, m = H.decMG(c) * 0.35;
  var f = frameBox(c, bb, padBB(bb, u));
  var segs = [[f.x0, f.y0, f.x1, f.y0], [f.x1, f.y0, f.x1, f.y1], [f.x1, f.y1, f.x0, f.y1], [f.x0, f.y1, f.x0, f.y0]];
  var boxId = C.shape(c.graph, c.cut, c.cut.id + ' / xlTransform frame', c.parent, H.segCmds(c, segs), { stroke: sc.fg, width: Math.max(0.8, 1.6 * u), alpha: 0.9 });
  var hs = 6 * u;
  var handles = [[f.x0, f.y0], [f.cx, f.y0], [f.x1, f.y0], [f.x1, f.cy], [f.x1, f.y1], [f.cx, f.y1], [f.x0, f.y1], [f.x0, f.cy]];
  var hIds = handles.map(function (pt, i) {
    return H.rect(c, 'xlHandle ' + i, pt[0] - hs, pt[1] - hs, hs * 2, hs * 2, { fill: sc.bg, stroke: sc.fg, width: Math.max(0.8, 1.5 * u), alpha: 1 });
  });
  var up = f.y0 - 34 * u > m, ry = up ? f.y0 - 28 * u : f.y1 + 28 * u;
  var stalkId = H.line(c, 'xlTransform stalk', [[f.cx, up ? f.y0 - hs : f.y1 + hs], [f.cx, ry]], sc.fg, Math.max(0.8, 1.2 * u), 1);
  var knobId = H.circle(c, 'xlTransform knob', f.cx, ry, 5 * u, 5 * u, { stroke: acc(c), width: Math.max(0.8, 1.8 * u), alpha: 1 });
  var below = f.y1 + 30 * u < c.comp.height - m;
  var fs = Math.max(11, 16 * u);
  H.addText(c, 'xlTransform size', Math.round(f.w) + ' x ' + Math.round(f.h), f.x1, below ? f.y1 + 18 * u : f.y0 - 18 * u, fs, {
    role: 'mono', align: 'right', color: P.accent ? acc(c) : subOf(c)
  }, function (env) {
    var t = env.lt - cl((c.cut.inDur || 0) * 0.6, 0, 0.35), o = 1 - E.inCubic(env.pOut || 0);
    return { alpha: t > 0 ? ein(t, 0.3, 0.15) * o : 0 };
  });
  C.sample(c.graph, boxId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
    var e = ein(q.t, 0.5);
    return { alpha: 0.9 * q.o * e, 'scale.x': 0.2 + 0.8 * e, 'scale.y': 0.2 + 0.8 * e };
  });
  [stalkId, knobId].concat(hIds).forEach(function (hid) {
    if (!hid) return;
    C.sample(c.graph, hid, c.cut.start, c.cut.end, function (f0) {
      var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
      return { alpha: ein(q.t, 0.2, 0.1) * q.o };
    });
  });
  return { box: boxId };
});

/* 7. xlFocusHunt */
reg('xlFocusHunt', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), sc = c.sc;
  var f = frameBox(c, bb, padBB(bb, u, 1.35));
  var rr = cl(Math.min(f.w, f.h) * 0.24, 12 * u, 48 * u), hw = f.w / 2, hh = f.h / 2;
  var rig = c.graph.add('null', c.cut.id + ' / xlFocusHunt rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, f.cx, f.cy) });
  var cmds = [];
  [[-1, -1, 180], [1, -1, 270], [1, 1, 0], [-1, 1, 90]].forEach(function (cp) {
    var cx = cp[0] * (hw - rr), cy = cp[1] * (hh - rr);
    for (var i = 0; i <= 10; i++) {
      var a = (cp[2] + 90 * i / 10) * DEG;
      cmds.push([i ? 'L' : 'M', cx + Math.cos(a) * rr, -(cy + Math.sin(a) * rr)]);
    }
  });
  var tk = 9 * u;
  [[0, -hh, 0, -hh - tk], [0, hh, 0, hh + tk], [-hw, 0, -hw - tk, 0], [hw, 0, hw + tk, 0]].forEach(function (s) {
    cmds.push(['M', s[0], -s[1]], ['L', s[2], -s[3]]);
  });
  var mainId = C.shape(c.graph, c.cut, c.cut.id + ' / xlFocusHunt corners', rig, cmds, { stroke: sc.fg, width: Math.max(1, 2.8 * u), alpha: 1 });
  var accId = C.shape(c.graph, c.cut, c.cut.id + ' / xlFocusHunt locked', rig, cmds, { stroke: acc(c), width: Math.max(1, 2.8 * u), alpha: 0 });
  var dx = (P.right ? hw + 14 * u : -hw - 14 * u), dy = (P.low ? 1 : -1) * (hh - rr * 0.4);
  var dotId = C.shape(c.graph, c.cut, c.cut.id + ' / xlFocusHunt dot', rig, G.ellipse(dx, -dy, 5.5 * u, 5.5 * u), { fill: acc(c), alpha: 0 });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok) return { 'scale.x': 1, 'scale.y': 1 };
    var hunt = 1 + (0.2 * Math.exp(-q.t * 4.5) * Math.cos(q.t * 15) + 0.3 * (1 - ein(q.t, 0.3))) * (0.35 + 0.65 * H.motionAmt(c));
    return { 'scale.x': hunt, 'scale.y': hunt };
  });
  C.sample(c.graph, mainId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok || q.t > 0.78) return { alpha: 0 };
    return { alpha: ein(q.t, 0.25, 0, E.outCubic) * q.o };
  });
  C.sample(c.graph, accId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok || q.t <= 0.78) return { alpha: 0 };
    return { alpha: ein(q.t, 0.25, 0, E.outCubic) * q.o };
  });
  C.sample(c.graph, dotId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok || q.t <= 0.78) return { alpha: 0 };
    var bl = q.t < 1.25 ? (Math.floor((q.t - 0.78) * 10) % 2 === 0 ? 1 : 0.2) : 1;
    return { alpha: bl * q.o };
  });
  return { rig: rig };
});

/* 8. xlCurlyBrace */
reg('xlCurlyBrace', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c);
  var ax = axesOf(c, bb), col = colOf(c, P), m = H.decMG(c) * 0.3;
  var c0 = ax.C0 - 8 * u, c1 = ax.C1 + 8 * u, sp = c1 - c0, mid = (c0 + c1) / 2, g = 22 * u;
  var ids = [];
  [-1, 1].forEach(function (sd) {
    var base = sd < 0 ? ax.L0 - g : ax.L1 + g, room = sd < 0 ? base - m : ax.AM - m - base;
    var d = Math.min(cl(sp * 0.13, 10 * u, 38 * u), Math.max(5 * u, room / 2)), q = Math.min(d * 1.4, sp / 4);
    var X = function (x) { return base + sd * x; };
    var raw = quadPts([X(0), c0], [X(d), c0], [X(d), c0 + q], 6)
      .concat(quadPts([X(d), mid - q], [X(d), mid], [X(2 * d), mid], 6))
      .concat(quadPts([X(2 * d), mid], [X(d), mid], [X(d), mid + q], 6))
      .concat(quadPts([X(d), c1 - q], [X(d), c1], [X(0), c1], 6))
      .map(function (v) { return ax.M(v[0], v[1]); });
    var anchor = ax.M(base, mid), scAnchor = H.toScene(c, anchor[0], anchor[1]);
    var cmds = raw.map(function (pt, idx) { return [idx ? 'L' : 'M', pt[0] - anchor[0], -(pt[1] - anchor[1])]; });
    var id = C.shape(c.graph, c.cut, c.cut.id + ' / xlCurlyBrace ' + sd, c.parent, cmds, {
      stroke: col, width: Math.max(1, (P.big ? 4 : 3) * u), alpha: 1
    });
    c.graph.byId[id].attrs.position = scAnchor;
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
      var q0 = phaseOf(c, f0); if (!q0.ok) return { alpha: 0 };
      var e = ein(q0.t, 0.55), sl = (1 - e) * 36 * u, off = ax.M(sd * sl, 0);
      return {
        'position.x': scAnchor[0] + off[0],
        'position.y': scAnchor[1] - off[1],
        'scale.x': ax.vert ? 1 : Math.max(0.05, Math.min(e, q0.o)),
        'scale.y': ax.vert ? Math.max(0.05, Math.min(e, q0.o)) : 1,
        alpha: Math.min(1, q0.o * 2) * e
      };
    });
    ids.push(id);
  });
  return { count: ids.length };
});

/* 9. xlNestBracket */
reg('xlNestBracket', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c);
  var ax = axesOf(c, bb), col = colOf(c, P), mid = (ax.C0 + ax.C1) / 2, sp = ax.C1 - ax.C0, m = H.decMG(c) * 0.3;
  var ids = [];
  [-1, 1].forEach(function (sd) {
    for (var k = 0; k < 3; k++) {
      (function (side, idx) {
        var aRest = cl((side < 0 ? ax.L0 : ax.L1) + side * (28 * u + idx * 18 * u), m, ax.AM - m);
        var hk = sp * (1 - idx * 0.2) / 2 + 8 * u, arm = 14 * u;
        var pts = [[aRest - side * arm, mid - hk], [aRest, mid - hk], [aRest, mid + hk], [aRest - side * arm, mid + hk]].map(function (v) { return ax.M(v[0], v[1]); });
        var anchor = ax.M(aRest, mid), scA = H.toScene(c, anchor[0], anchor[1]);
        var cmds = pts.map(function (pt, i) { return [i ? 'L' : 'M', pt[0] - anchor[0], -(pt[1] - anchor[1])]; });
        var id = C.shape(c.graph, c.cut, c.cut.id + ' / xlNestBracket ' + side + '_' + idx, c.parent, cmds, {
          stroke: col, width: Math.max(1, (4.6 - idx * 1.2) * u), alpha: 1
        });
        c.graph.byId[id].attrs.position = scA;
        C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
          var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
          var e = ein(q.t, 0.4, idx * 0.07); if (e <= 0) return { alpha: 0 };
          var pulse = Math.pow(Math.max(0, Math.sin(q.t * 3.4 - idx * 0.9)), 2);
          var sl = side * ((1 - e) * 60 * u + (1 - q.o) * 30 * u), off = ax.M(sl, 0);
          return { 'position.x': scA[0] + off[0], 'position.y': scA[1] - off[1], alpha: e * q.o * (0.5 + 0.5 * pulse) };
        });
        ids.push(id);
      })(sd, k);
    }
  });
  return { count: ids.length };
});

/* 10. xlRepeatBars */
reg('xlRepeatBars', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c);
  var ax = axesOf(c, bb), col = colOf(c, P), mid = (ax.C0 + ax.C1) / 2, sp = ax.C1 - ax.C0, hh = sp / 2 + 8 * u, m = H.decMG(c) * 0.3;
  var ids = [];
  [-1, 1].forEach(function (sd) {
    var base = sd < 0 ? ax.L0 : ax.L1;
    function X(d) { return cl(base + sd * d * u, m, ax.AM - m); }
    [38, 52].forEach(function (offD, k) {
      var pA = ax.M(X(offD), mid - hh), pB = ax.M(X(offD), mid + hh);
      var id = segStroke(c, 'xlRepeat bar ' + sd + '_' + k, pA[0], pA[1], pB[0], pB[1], col, (k ? 9 : 2.2) * u, function (q) {
        if (!q.ok) return { alpha: 0 };
        var e = ein(q.t, 0.35, k ? 0.15 : 0.05) * q.o;
        return { 'scale.x': ax.vert ? e : 1, 'scale.y': ax.vert ? 1 : e, alpha: e > 0.01 ? 1 : 0 };
      });
      if (id) ids.push(id);
    });
    [-1, 1].forEach(function (dy, di) {
      var pt = ax.M(X(20), mid + dy * Math.max(10 * u, sp * 0.14));
      var did = H.circle(c, 'xlRepeat dot ' + sd + '_' + di, pt[0], pt[1], 6 * u, 6 * u, { fill: acc(c), alpha: 1 });
      C.sample(c.graph, did, c.cut.start, c.cut.end, function (f0) {
        var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
        var bt = Math.pow(Math.max(0, Math.sin(q.t * 5)), 6) * 0.6;
        var ed = E.outBack(cl((q.t - 0.3) / 0.25), 2.5) * q.o;
        var s = Math.max(0.01, ed * (1 + 0.4 * bt * H.motionAmt(c)));
        return { 'scale.x': s, 'scale.y': s, alpha: ed > 0.01 ? 1 : 0 };
      });
    });
  });
  return { count: ids.length };
});

/* 11. xlDoubleRule */
reg('xlDoubleRule', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c);
  var ax = axesOf(c, bb), col = colOf(c, P), m = H.decMG(c) * 0.4;
  var ext = 26 * u + (P.big ? (ax.L1 - ax.L0) * 0.1 : 0);
  var a0 = Math.max(m, ax.L0 - ext), a1 = Math.min(ax.AM - m, ax.L1 + ext), am = (a0 + a1) / 2;
  var g = 16 * u + (ax.C1 - ax.C0) * 0.1, sep = 10 * u, v = (H.p(P, 'v', 0) | 0) % 3, k = v === 1 ? 0.5 : 1;
  var cT = Math.max(m + sep, ax.C0 - g), cB = Math.min(ax.CM - m - sep, ax.C1 + g);
  [cT - sep, cB + sep].forEach(function (cc, idx) {
    var pA = ax.M(am - (am - a0) * k, cc), pB = ax.M(am + (a1 - am) * k, cc);
    segStroke(c, 'xlDouble thick ' + idx, pA[0], pA[1], pB[0], pB[1], col, 7 * u, function (q) {
      if (!q.ok) return { alpha: 0 };
      var e1 = ein(q.t, 0.5) * q.o;
      return { 'scale.x': ax.vert ? 1 : Math.max(0.001, e1), 'scale.y': ax.vert ? Math.max(0.001, e1) : 1, alpha: e1 > 0.01 ? 1 : 0 };
    });
  });
  [cT, cB].forEach(function (cc, idx) {
    var pA = ax.M(idx ? a1 : a0, cc), pB = ax.M(idx ? a0 : a1, cc);
    segStroke(c, 'xlDouble thin ' + idx, pA[0], pA[1], pB[0], pB[1], col, 1.8 * u, function (q, sp, dx, dy) {
      if (!q.ok) return { alpha: 0 };
      var e2 = ein(q.t, 0.5, 0.12, E.inOutCubic), f0 = 1 - q.o, lenF = Math.max(0.001, e2 - f0);
      return {
        'position.x': sp[0] + dx * f0, 'position.y': sp[1] - dy * f0,
        'scale.x': ax.vert ? 1 : lenF, 'scale.y': ax.vert ? lenF : 1,
        alpha: e2 > f0 ? q.o : 0
      };
    });
  });
  if (v === 2) {
    [[a0, cT], [a1, cT], [a0, cB], [a1, cB]].forEach(function (pt, idx) {
      var q = ax.M(pt[0], pt[1]), r = 5 * u;
      var did = H.poly(c, 'xlDouble diamond ' + idx, [[q[0] - r, q[1]], [q[0], q[1] - r], [q[0] + r, q[1]], [q[0], q[1] + r]], true, { fill: acc(c), alpha: 1 });
      C.sample(c.graph, did, c.cut.start, c.cut.end, function (f0) {
        var q0 = phaseOf(c, f0); if (!q0.ok) return { alpha: 0 };
        var sc2 = E.outBack(cl((q0.t - 0.45) / 0.25), 2) * q0.o;
        return { 'scale.x': Math.max(0.01, sc2), 'scale.y': Math.max(0.01, sc2), alpha: sc2 > 0.01 ? 1 : 0 };
      });
    });
  }
  return { style: v };
});

/* 12. xlArrowRules */
reg('xlArrowRules', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c);
  var ax = axesOf(c, bb), col = colOf(c, P), m = H.decMG(c) * 0.5, g = 22 * u + (ax.C1 - ax.C0) * 0.08;
  var a0 = Math.max(m, ax.L0 - 30 * u), a1 = Math.min(ax.AM - m, ax.L1 + 30 * u), fl = P.right ? 1 : -1;
  var one = (H.p(P, 'v', 0) | 0) % 3 === 2;
  var rows = [[Math.min(ax.CM - m, ax.C1 + g), fl, 0], [Math.max(m, ax.C0 - g), -fl, 0.2]];
  var pick = one ? [rows[P.low ? 0 : 1]] : rows;
  pick.forEach(function (row, idx) {
    var cc = row[0], dir = row[1], dl = row[2];
    var from = dir > 0 ? a0 : a1, to = dir > 0 ? a1 : a0;
    var pFrom = ax.M(from, cc), pTo = ax.M(to, cc), hs = 20 * u;
    segStroke(c, 'xlArrowRule shaft ' + idx, pFrom[0], pFrom[1], pTo[0], pTo[1], col, 3 * u, function (q, sp, dx, dy) {
      if (!q.ok) return { alpha: 0 };
      var e = ein(q.t, 0.5, dl), f0 = 1 - q.o, lf = Math.max(0.001, e - f0);
      return {
        'position.x': sp[0] + dx * f0, 'position.y': sp[1] - dy * f0,
        'scale.x': ax.vert ? 1 : lf, 'scale.y': ax.vert ? lf : 1,
        alpha: e > f0 ? q.o : 0
      };
    });
    var hw1 = ax.M(-dir * hs, -hs * 0.62), hw2 = ax.M(-dir * hs, hs * 0.62);
    var headId = C.shape(c.graph, c.cut, c.cut.id + ' / xlArrowRule head ' + idx, c.parent,
      [['M', hw1[0], -hw1[1]], ['L', 0, 0], ['L', hw2[0], -hw2[1]]], { stroke: col, width: Math.max(1, 3 * u), alpha: 1 });
    C.sample(c.graph, headId, c.cut.start, c.cut.end, function (f0) {
      var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
      var e = ein(q.t, 0.5, dl); if (e <= 0.01) return { alpha: 0 };
      var hd = mix(from, to, e), Hpt = ax.M(hd, cc), spH = H.toScene(c, Hpt[0], Hpt[1]), s = Math.min(1, e * 3);
      return { 'position.x': spH[0], 'position.y': spH[1], 'scale.x': s, 'scale.y': s, alpha: q.o };
    });
  });
  return { count: pick.length };
});

/* 13. xlHairpin */
reg('xlHairpin', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c);
  var ax = axesOf(c, bb), col = colOf(c, P), len = ax.L1 - ax.L0, m = H.decMG(c) * 0.5;
  var hp = cl(len * 0.07, 30 * u, 84 * u), b = sideBand(c, ax, hp + 8 * u, !ax.vert || !!P.low, 18 * u + (ax.C1 - ax.C0) * 0.06);
  var dec = (H.p(P, 'v', 0) | 0) % 2 === 1, open = Math.max(4 * u, Math.min(hp, b.h - 6 * u)) / 2;
  var A = dec ? ax.L1 : ax.L0, B = dec ? ax.L0 : ax.L1;
  [-1, 1].forEach(function (sgn, idx) {
    var p0 = ax.M(A, b.c), p1 = ax.M(B, b.c + sgn * open);
    segStroke(c, 'xlHairpin arm ' + idx, p0[0], p0[1], p1[0], p1[1], col, 2.6 * u, function (q, sp, dx, dy) {
      if (!q.ok) return { alpha: 0 };
      var e = ein(q.t, 0.65, 0, E.outCubic);
      return { 'scale.x': Math.max(0.001, e), 'scale.y': Math.max(0.001, e), alpha: Math.min(1, q.o * 2) * (e > 0.01 ? 1 : 0) };
    });
  });
  var fs = Math.max(16, 30 * u);
  function addDyn(txt, posX) {
    if (posX <= m || posX >= ax.AM - m) return;
    var qPt = ax.M(posX, b.c);
    H.addText(c, 'xlHairpin ' + txt, txt, qPt[0], qPt[1], fs, { role: 'serif', align: 'center', color: col }, function (env) {
      var t = env.lt - cl((c.cut.inDur || 0) * 0.6, 0, 0.35), o = 1 - E.inCubic(env.pOut || 0);
      return { alpha: t > 0 ? ein(t, 0.3, 0.35) * o : 0 };
    });
  }
  addDyn(dec ? 'f' : 'p', ax.L0 - fs * 0.8);
  addDyn(dec ? 'p' : 'f', ax.L1 + fs * 0.8);
  return { decrescendo: dec };
});

/* 14. xlSlur */
reg('xlSlur', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c);
  var ax = axesOf(c, bb), col = colOf(c, P), len = ax.L1 - ax.L0, hs = cl(len * 0.07, 16 * u, 56 * u);
  var dash = (H.p(P, 'v', 0) | 0) % 2 === 1, sides = P.big ? [false, true] : [!!P.low];
  sides.forEach(function (plus, si) {
    var b = sideBand(c, ax, hs + 6 * u, plus, 10 * u + (ax.C1 - ax.C0) * 0.05);
    if (si && b.s !== (plus ? 1 : -1)) return;
    var h = Math.min(hs, b.h), a0 = ax.L0 + len * 0.03, a1 = ax.L1 - len * 0.03, n = 28, th = 7 * u;
    var out = [], inn = [];
    for (var i = 0; i <= n; i++) {
      var s = i / n, y = 4 * s * (1 - s);
      out.push(ax.M(mix(a0, a1, s), b.edge + b.s * h * y));
      inn.push(ax.M(mix(a0, a1, s), b.edge + b.s * (h * y - th * Math.sin(Math.PI * s))));
    }
    if (dash) {
      var segs = [];
      for (var k = 0; k < n; k += 2) segs.push([out[k][0], out[k][1], out[k + 1][0], out[k + 1][1]]);
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / xlSlur dash ' + si, c.parent, H.segCmds(c, segs), { stroke: col, width: Math.max(1, 2.8 * u), alpha: 1 });
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
        var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
        return { alpha: q.o * ein(q.t, 0.6, si * 0.15, E.inOutCubic) };
      });
    } else {
      var id2 = H.poly(c, 'xlSlur ' + si, out.concat(inn.reverse()), true, { fill: col, stroke: col, width: Math.max(0.5, u), alpha: 1 });
      C.sample(c.graph, id2, c.cut.start, c.cut.end, function (f0) {
        var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
        var e = ein(q.t, 0.6, si * 0.15, E.inOutCubic);
        return { alpha: Math.min(1, q.o * 2) * e };
      });
    }
  });
  return { count: sides.length };
});

/* 15. xlWingLines */
reg('xlWingLines', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c);
  var ax = axesOf(c, bb), col = colOf(c, P), m = H.decMG(c) * 0.5, mid = (ax.C0 + ax.C1) / 2, sp = ax.C1 - ax.C0, len = ax.L1 - ax.L0;
  var K = 5, gc = cl(sp / 6, 9 * u, 22 * u), sym = (H.p(P, 'v', 0) | 0) % 2 === 1;
  var count = 0;
  [-1, 1].forEach(function (sd) {
    var base = (sd < 0 ? ax.L0 : ax.L1) + sd * 16 * u, room = sd < 0 ? base - m : ax.AM - m - base;
    var Lm = Math.min(room, len * 0.25 + 70 * u, 260 * u); if (Lm < 22 * u) return;
    for (var i = 0; i < K; i++) {
      (function (idx) {
        var f = sym ? 1 - Math.abs(idx - 2) * 0.3 : 1 - idx * 0.17;
        var L = Lm * f, cc = mid + (idx - 2) * gc;
        var p0 = ax.M(base, cc), p1 = ax.M(base + sd * L, cc);
        var cBar = idx === (sym ? 2 : 0) && P.accent ? acc(c) : col;
        var w = (sym ? 4 - Math.abs(idx - 2) * 0.8 : 4.2 - idx * 0.55) * u;
        var id = segStroke(c, 'xlWing ' + sd + '_' + idx, p0[0], p0[1], p1[0], p1[1], cBar, w, function (q) {
          if (!q.ok) return { alpha: 0 };
          var e = ein(q.t, 0.45, idx * 0.05); if (e <= 0) return { alpha: 0 };
          var pulse = (1 + 0.07 * Math.sin(q.t * 3 - idx * 0.7) * H.motionAmt(c)) * e * q.o;
          return { 'scale.x': ax.vert ? 1 : Math.max(0.01, pulse), 'scale.y': ax.vert ? Math.max(0.01, pulse) : 1, alpha: Math.min(1, q.o * 2) };
        });
        if (id) count++;
      })(i);
    }
  });
  return { count: count };
});

/* 16. xlCaliper */
reg('xlCaliper', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), sc = c.sc;
  var ax = axesOf(c, bb), m = H.decMG(c) * 0.45, hB = 22 * u, len = ax.L1 - ax.L0, sp = ax.C1 - ax.C0, M = ax.M;
  var b = sideBand(c, ax, hB + 36 * u, !!P.low, 18 * u + sp * 0.06), s = b.s, ci = b.edge, co = b.edge + s * hB;
  var jl = 18 * u + sp * 0.06 + Math.min(sp * 0.45, 80 * u), sw = 44 * u;
  var xa = Math.max(m + 14 * u, ax.L0 - 10 * u), xbT = Math.min(ax.AM - m - sw, ax.L1 + 10 * u);
  var X0 = xa - 14 * u, X1 = Math.min(ax.AM - m, xbT + 110 * u);
  if (X1 <= X0 + 10) return { skip: true };
  var beamPts = [M(X1, ci), M(X0, ci), M(X0, co), M(X1, co), M(X1, ci)];
  var beamId = H.poly(c, 'xlCaliper beam', beamPts, false, { stroke: sc.fg, width: Math.max(0.8, 1.8 * u), alpha: 1 });
  var tk = [];
  for (var i = 0, x = xa; x < X1 - 2 * u && i < 120; i++, x += 11 * u) {
    var A = M(x, ci), B = M(x, ci + s * (i % 5 ? 6 : 12) * u);
    tk.push([A[0], A[1], B[0], B[1]]);
  }
  var ticksId = C.shape(c.graph, c.cut, c.cut.id + ' / xlCaliper ticks', c.parent, H.segCmds(c, tk), { stroke: sc.fg, width: Math.max(0.6, 1.2 * u), alpha: 0.8 });
  function jawPts(jx, d) {
    return [M(jx - d * 13 * u, ci), M(jx - d * 13 * u, ci - s * jl * 0.55), M(jx, ci - s * jl), M(jx, ci)];
  }
  var jawFixId = H.poly(c, 'xlCaliper jawFix', jawPts(xa, 1), false, { stroke: sc.fg, width: Math.max(1, 2.4 * u), alpha: 1 });
  var slideRig = c.graph.add('null', c.cut.id + ' / xlCaliper slideRig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, M(xbT, ci)[0], M(xbT, ci)[1]) });
  var slideAnchor = M(xbT, ci);
  var jawMovPts = jawPts(xbT, -1).map(function (pt) { return [pt[0] - slideAnchor[0], -(pt[1] - slideAnchor[1])]; });
  var boxPts = [M(xbT, ci - 4 * u * s), M(xbT + sw, ci - 4 * u * s), M(xbT + sw, co + 4 * u * s), M(xbT, co + 4 * u * s)].map(function (pt) { return [pt[0] - slideAnchor[0], -(pt[1] - slideAnchor[1])]; });
  C.shape(c.graph, c.cut, c.cut.id + ' / xlCaliper jawMov', slideRig, jawMovPts.map(function (p, k) { return [k ? 'L' : 'M', p[0], p[1]]; }), { stroke: acc(c), width: Math.max(1, 2.4 * u), alpha: 1 });
  C.shape(c.graph, c.cut, c.cut.id + ' / xlCaliper vernier', slideRig, boxPts.map(function (p, k) { return [k ? 'L' : 'M', p[0], p[1]]; }).concat([['Z']]), { stroke: acc(c), width: Math.max(1, 2.4 * u), alpha: 1 });
  C.sample(c.graph, slideRig, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0);
    var k = E.outBack(cl((Math.max(0, q.t) - 0.15) / 0.55), 1.1);
    var xb = mix(X1 - sw, xbT, k), pt = M(xb, ci), sp = H.toScene(c, pt[0], pt[1]);
    return { 'position.x': sp[0], 'position.y': sp[1] };
  });
  var lp = M(xbT + sw / 2, co + s * 22 * u);
  H.addText(c, 'xlCaliper readout', ((xbT - xa) / 10).toFixed(1), lp[0], lp[1], Math.max(11, 16 * u), {
    role: 'mono', align: 'center', color: P.accent ? acc(c) : sc.fg
  }, function (env) {
    var q = phaseOf(c, Math.round(env.t * c.comp.fps));
    return { alpha: q.ok ? ein(q.t, 0.3, 0.3) * q.o : 0 };
  });
  [beamId, ticksId, jawFixId].forEach(function (id, idx) {
    if (!id) return;
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
      var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
      return { alpha: (idx === 1 ? 0.8 : 1) * ein(q.t, 0.3, 0, E.outCubic) * q.o };
    });
  });
  return { beam: beamId };
});

/* 17. xlProtractor */
reg('xlProtractor', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), sc = c.sc;
  var ax = axesOf(c, bb), sp = bb.h, len = ax.L1 - ax.L0, b = sideBand(c, ax, 180 * u, !!P.low, 18 * u + (ax.C1 - ax.C0) * 0.05);
  var Rr = cl(Math.min(len * 0.45, Math.max(44 * u, b.room - 28 * u)), 34 * u, 260 * u);
  var ca = cl((ax.L0 + ax.L1) / 2, Rr + 10 * u, ax.AM - Rr - 10 * u);
  function pt(d, r) { return ax.M(ca + Math.cos(d * DEG) * r, b.edge + b.s * Math.sin(d * DEG) * r); }
  var origin = pt(0, 0), arc = [];
  for (var i = 0; i <= 40; i++) arc.push(pt(180 * i / 40, Rr));
  var k = Rr / (150 * u), tk = [];
  for (var d = 0; d <= 180; d += 5) {
    var l = (d % 30 === 0 ? 17 : d % 10 === 0 ? 10 : 6) * u * cl(k, 0.6, 1.2), A = pt(d, Rr), B = pt(d, Rr - l);
    tk.push([A[0], A[1], B[0], B[1]]);
  }
  var baseA = ax.M(ca - Rr, b.edge), baseB = ax.M(ca + Rr, b.edge);
  var baseId = H.line(c, 'xlProtractor base', [baseA, baseB], sc.fg, 1.8 * u, 1);
  var arcId = H.poly(c, 'xlProtractor arc', arc, false, { stroke: sc.fg, width: Math.max(1, 2.2 * u), alpha: 1 });
  var ticksId = C.shape(c.graph, c.cut, c.cut.id + ' / xlProtractor ticks', c.parent, H.segCmds(c, tk), { stroke: sc.fg, width: Math.max(0.6, 1.2 * u), alpha: 0.85 });
  var tg = 25 + H.p(P, 'r', 0.5) * 130, N = pt(tg, Rr * 0.84);
  var needleId = segStroke(c, 'xlProtractor needle', origin[0], origin[1], N[0], N[1], acc(c), 3 * u, function (q) {
    if (!q.ok) return { alpha: 0 };
    var ang = tg * E.outBack(cl((q.t - 0.3) / 0.6), 1.5) + 2 * Math.sin(q.t * 2.1) * H.motionAmt(c);
    var dAng = (ang - tg) * (ax.vert ? 1 : -1) * b.s;
    return { rotation: dAng, alpha: ein(q.t, 0.2, 0.3) * q.o };
  });
  H.circle(c, 'xlProtractor hub', origin[0], origin[1], 5 * u, 5 * u, { stroke: acc(c), width: 2.2 * u, alpha: 1 });
  if (Rr > 60 * u) {
    var lp = pt(tg, Rr + 20 * u);
    H.addText(c, 'xlProtractor deg', Math.round(tg) + '°', lp[0], lp[1], Math.max(11, 15 * u), { role: 'mono', align: 'center', color: subOf(c) }, function (env) {
      var t = env.lt - cl((c.cut.inDur || 0) * 0.6, 0, 0.35), o = 1 - E.inCubic(env.pOut || 0);
      return { alpha: t > 0 ? ein(t, 0.3, 0.5) * o : 0 };
    });
  }
  [baseId, arcId, ticksId].forEach(function (id, idx) {
    if (!id) return;
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
      var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
      return { alpha: (idx === 2 ? 0.85 : 1) * Math.min(1, q.o * 1.5) * ein(q.t, 0.65, 0, E.inOutCubic) };
    });
  });
  return { arc: arcId, needle: needleId };
});

/* 18. xlAngleMark */
reg('xlAngleMark', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), sc = c.sc, W = c.comp.width, Hh = c.comp.height, m = H.decMG(c) * 0.6;
  var col = colOf(c, P), sx = P.right ? 1 : -1, sy = P.low ? 1 : -1;
  function vx(s) { return s > 0 ? bb.x1 + 10 * u : bb.x0 - 10 * u; }
  function rm(s) { return s > 0 ? W - m - vx(s) : vx(s) - m; }
  function vy(s) { return s > 0 ? bb.y1 + 10 * u : bb.y0 - 10 * u; }
  function rv(s) { return s > 0 ? Hh - m - vy(s) : vy(s) - m; }
  if (rv(sy) < 34 * u && rv(-sy) > rv(sy)) sy = -sy;
  var dir = sx, len;
  if (rm(sx) >= 120 * u) len = rm(sx);
  else if (rm(-sx) >= 120 * u) { sx = -sx; dir = sx; len = rm(sx); }
  else { dir = -sx; len = bb.w * 0.55; }
  len = cl(len * 0.8, 90 * u, 230 * u);
  var Vpt = [vx(sx), vy(sy)], room = Math.max(8 * u, rv(sy));
  var th = cl(Math.min(22 + H.p(P, 'r', 0.5) * 38, Math.atan2(room, len * 0.85) / DEG), 7, 60);
  function ray(d, r) { return [Vpt[0] + dir * Math.cos(d * DEG) * r, Vpt[1] + sy * Math.sin(d * DEG) * r]; }
  var A = ray(0, len), B = ray(th, len), ra = len * 0.42, arc = [];
  for (var i = 0; i <= 14; i++) arc.push(ray(th * i / 14, ra));
  var dSegs = [];
  for (var d = 0; d < len; d += 14 * u) {
    var p0 = ray(0, d), p1 = ray(0, Math.min(len, d + 8 * u));
    dSegs.push([p0[0], p0[1], p1[0], p1[1]]);
  }
  var baseId = C.shape(c.graph, c.cut, c.cut.id + ' / xlAngle base', c.parent, H.segCmds(c, dSegs), { stroke: sc.fg, width: Math.max(0.8, 1.8 * u), alpha: 0.7 });
  var rayId = segStroke(c, 'xlAngle ray', Vpt[0], Vpt[1], B[0], B[1], col, 3 * u, function (q) {
    if (!q.ok) return { alpha: 0 };
    var e = ein(q.t, 0.4) * q.o;
    return { 'scale.x': Math.max(0.01, e), 'scale.y': Math.max(0.01, e), alpha: Math.min(1, q.o * 1.5) };
  });
  var arcId = H.poly(c, 'xlAngle arc', arc, false, { stroke: col, width: Math.max(0.8, 2 * u), alpha: 1 });
  H.circle(c, 'xlAngle vertex', Vpt[0], Vpt[1], 5 * u, 5 * u, { fill: acc(c), alpha: 1 });
  var Lp = ray(th / 2, ra + 30 * u);
  H.addText(c, 'xlAngle label', Math.round(th) + '°', Lp[0], Lp[1], Math.max(11, 17 * u), { role: 'mono', align: 'center', color: col }, function (env) {
    var t = env.lt - cl((c.cut.inDur || 0) * 0.6, 0, 0.35), o = 1 - E.inCubic(env.pOut || 0);
    return { alpha: t > 0 ? ein(t, 0.3, 0.4) * o : 0 };
  });
  [baseId, arcId].forEach(function (id, idx) {
    if (!id) return;
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
      var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
      return { alpha: (idx ? 1 : 0.7) * Math.min(1, q.o * 1.5) * ein(q.t, 0.4) };
    });
  });
  return { ray: rayId };
});

/* 19. xlLevel */
reg('xlLevel', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), sc = c.sc, m = H.decMG(c) * 0.5;
  var ax = axesOf(c, bb, true), b = sideBand(c, ax, 40 * u, !!P.low, 16 * u + bb.h * 0.07);
  var cx = bb.cx, w = cl(bb.w * 0.4, 150 * u, 290 * u), h = Math.min(34 * u, b.h), y = b.c;
  var spRig = H.toScene(c, cx, y);
  var rig = c.graph.add('null', c.cut.id + ' / xlLevel rig', c.parent, c.cut.start, c.cut.end, { position: spRig });
  var tube = C.shape(c.graph, c.cut, c.cut.id + ' / xlLevel tube', rig, H.roundRectCmds(0, 0, w, h, h / 2), { stroke: sc.fg, width: Math.max(1, 2.4 * u), alpha: 1 });
  var marks = C.shape(c.graph, c.cut, c.cut.id + ' / xlLevel marks', rig, [
    ['M', -24 * u, -h / 2], ['L', -24 * u, h / 2], ['M', 24 * u, -h / 2], ['L', 24 * u, h / 2]
  ], { stroke: sc.fg, width: Math.max(0.8, 1.8 * u), alpha: 1 });
  var bwd = 19 * u, bhh = Math.max(2 * u, Math.min(11 * u, h / 2 - 4 * u));
  var bubble = C.shape(c.graph, c.cut, c.cut.id + ' / xlLevel bubble', rig, H.roundRectCmds(0, 0, bwd * 2, bhh * 2, bhh), { stroke: acc(c), width: Math.max(1, 2.6 * u), alpha: 1 });
  C.sample(c.graph, bubble, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
    var bx = ((w / 2 - 30 * u) * Math.exp(-q.t * 1.5) * Math.cos(q.t * 5.5) * (P.right ? 1 : -1) + 2.5 * u * Math.sin(q.t * 1.3)) * (0.3 + 0.7 * H.motionAmt(c));
    return { 'position.x': bx, alpha: ein(q.t, 0.25, 0.15) * q.o };
  });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok) return { 'scale.x': 0.01 };
    return { 'scale.x': Math.max(0.01, ein(q.t, 0.45)) };
  });
  [tube, marks].forEach(function (id) {
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
      var q = phaseOf(c, f0); return { alpha: q.ok ? Math.min(1, q.o * 1.5) : 0 };
    });
  });
  return { rig: rig };
});

/* 20. xlPlumb */
reg('xlPlumb', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), sc = c.sc, W = c.comp.width, Hh = c.comp.height, m = H.decMG(c);
  var wr = W - bb.x1, wl = bb.x0, bob = 46 * u, x, L, lim;
  var side = (P.right ? wr >= 90 * u : wl < 90 * u) ? 1 : -1;
  if (Math.max(wr, wl) >= 90 * u) {
    var spR = side > 0 ? wr : wl;
    x = side > 0 ? bb.x1 + spR * 0.5 : spR * 0.5;
    L = cl(bb.cy + bb.h * 0.2, Hh * 0.25, Hh * 0.72);
    lim = spR * 0.5 - 16 * u;
  } else if (bb.y0 >= 110 * u) {
    x = bb.cx + (P.right ? 1 : -1) * bb.w * 0.3;
    L = bb.y0 - 22 * u - bob;
    lim = L * 0.3;
  } else {
    x = P.right ? W - m * 0.5 : m * 0.5;
    L = Hh * 0.4; lim = m * 0.3;
  }
  var anchor = H.toScene(c, x, 0);
  var rig = c.graph.add('null', c.cut.id + ' / xlPlumb rig', c.parent, c.cut.start, c.cut.end, { position: anchor });
  H.line(c, 'xlPlumb ceiling', [[x - 12 * u, 2 * u], [x + 12 * u, 2 * u]], sc.fg, 4 * u, 1);
  C.shape(c.graph, c.cut, c.cut.id + ' / xlPlumb string', rig, [['M', 0, 0], ['L', 0, -L]], { stroke: sc.fg, width: Math.max(0.8, 1.8 * u), alpha: 1 });
  var w = 13 * u;
  C.shape(c.graph, c.cut, c.cut.id + ' / xlPlumb bob', rig, [
    ['M', -w, -L], ['L', w, -L], ['L', w, -(L + bob * 0.35)], ['L', 0, -(L + bob)], ['L', -w, -(L + bob * 0.35)], ['Z']
  ], { fill: colOf(c, P), alpha: 1 });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok) return { 'scale.y': 0.001 };
    var A = Math.min(9, Math.atan2(Math.max(2, lim), L) / DEG);
    var th = (A * Math.exp(-q.t * 0.9) * Math.cos(q.t * 4.2) + 1.2 * Math.sin(q.t * 1.7)) * (0.25 + 0.75 * H.motionAmt(c)) * (P.low ? -1 : 1);
    var lFrac = E.outBack(cl(q.t / 0.55), 1.2) * mix(0.2, 1, q.o);
    return { rotation: th, 'scale.y': Math.max(0.01, lFrac) };
  });
  return { rig: rig };
});

/* 21. xlCompass */
reg('xlCompass', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), sc = c.sc;
  var mn = Math.min(c.comp.width, c.comp.height), Rr = cl(mn * 0.095, 50 * u, 112 * u), hg = Rr * 2.1;
  var sp = H.nearBB(c, bb, Rr * 2 + 12 * u, hg + Rr + 28 * u, P, 22 * u);
  var px = sp.x + sp.cx - sp.x, py = sp.y + hg + 22 * u, dir = P.right ? 1 : -1;
  var ringId = H.circle(c, 'xlCompass circle', px, py, Rr, Rr, { stroke: colOf(c, P), width: Math.max(1, 3 * u), alpha: 1 });
  var armId = H.poly(c, 'xlCompass legs', [[px, py], [px, py - hg], [px + Rr, py]], false, { stroke: sc.fg, width: Math.max(1, 2.6 * u), alpha: 1 });
  var hubId = H.circle(c, 'xlCompass hub', px, py - hg, 7 * u, 7 * u, { fill: sc.bg, stroke: sc.fg, width: 2.2 * u, alpha: 1 });
  var tipId = H.circle(c, 'xlCompass tip', px + Rr, py, 4.5 * u, 4.5 * u, { fill: acc(c), alpha: 1 });
  C.sample(c.graph, ringId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
    var sw = E.inOutCubic(cl((q.t - 0.25) / 1.2));
    return { alpha: ein(q.t, 0.3, 0, E.outCubic) * q.o * cl(sw + 0.15) };
  });
  C.sample(c.graph, tipId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
    var ph = (-90 + H.p(P, 'r', 0.5) * 360) * DEG + (TAU * E.inOutCubic(cl((q.t - 0.25) / 1.2)) + Math.max(0, q.t - 1.45) * 0.25 * H.motionAmt(c)) * dir;
    var pt = H.toScene(c, px + Math.cos(ph) * Rr, py + Math.sin(ph) * Rr);
    return { 'position.x': pt[0], 'position.y': pt[1], alpha: ein(q.t, 0.3, 0, E.outCubic) * q.o };
  });
  [armId, hubId].forEach(function (id) {
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
      var q = phaseOf(c, f0); return { alpha: q.ok ? ein(q.t, 0.3, 0, E.outCubic) * q.o : 0 };
    });
  });
  return { circle: ringId };
});

/* 22. xlBezier */
reg('xlBezier', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), sc = c.sc, m = H.decMG(c) * 0.5;
  var ax = axesOf(c, bb), len = ax.L1 - ax.L0, hh0 = cl(len * 0.14, 54 * u, 130 * u);
  var b = sideBand(c, ax, hh0 + 8 * u, !!P.low, 18 * u + (ax.C1 - ax.C0) * 0.06), hh = Math.max(6 * u, b.h - 8 * u), s = b.s;
  var a0 = Math.max(m, ax.L0 - 10 * u), a1 = Math.min(ax.AM - m, ax.L1 + 10 * u);
  var A = [a0, b.edge], B = [a1, b.edge], HA = [a0 + len * 0.28, b.edge + s * hh * 0.6], HB = [a1 - len * 0.28, b.edge + s * hh * 0.6];
  var cv = [];
  for (var i = 0; i <= 32; i++) {
    var q = i / 32, k = 1 - q;
    cv.push(ax.M(k * k * k * A[0] + 3 * k * k * q * HA[0] + 3 * k * q * q * HB[0] + q * q * q * B[0],
      k * k * k * A[1] + 3 * k * k * q * HA[1] + 3 * k * q * q * HB[1] + q * q * q * B[1]));
  }
  var curveId = H.poly(c, 'xlBezier curve', cv, false, { stroke: colOf(c, P), width: Math.max(1, 3 * u), alpha: 1 });
  var mA = ax.M(A[0], A[1]), mB = ax.M(B[0], B[1]), mHA = ax.M(HA[0], HA[1]), mHB = ax.M(HB[0], HB[1]);
  var hLineA = H.line(c, 'xlBezier hA', [mA, mHA], subOf(c), 1.6 * u, 1);
  var hLineB = H.line(c, 'xlBezier hB', [mB, mHB], subOf(c), 1.6 * u, 1);
  [mA, mB].forEach(function (pt, idx) {
    H.rect(c, 'xlBezier anchor ' + idx, pt[0] - 6 * u, pt[1] - 6 * u, 12 * u, 12 * u, { fill: acc(c), alpha: 1 });
  });
  [mHA, mHB].forEach(function (pt, idx) {
    H.circle(c, 'xlBezier knob ' + idx, pt[0], pt[1], 6 * u, 6 * u, { fill: sc.bg, stroke: acc(c), width: 2 * u, alpha: 1 });
  });
  C.sample(c.graph, curveId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
    return { alpha: Math.min(1, q.o * 1.5) * ein(q.t, 0.55, 0.2, E.inOutCubic) };
  });
  [hLineA, hLineB].forEach(function (id) {
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
      var q = phaseOf(c, f0); return { alpha: q.ok ? Math.min(1, q.o * 1.5) * ein(q.t, 0.3, 0.1) : 0 };
    });
  });
  return { curve: curveId };
});

/* 23. xlEdgeTether */
reg('xlEdgeTether', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), sc = c.sc, W = c.comp.width, Hh = c.comp.height;
  var f = frameBox(c, bb, padBB(bb, u, 0.8)), dirs = [[1, 0], [-1, 0], [0, -1], [0, 1]], n = cl(H.p(P, 'n', 1) | 0, 1, 3) + 1;
  var seed = H.p(P, 'seed', c.cut.seed || 7), sh = (H.p(P, 'v', 0) | 0) + (P.right ? 0 : 1);
  var count = 0;
  for (var k = 0; k < n; k++) {
    (function (idx) {
      var d = dirs[(idx + sh) % 4], dx = d[0], dy = d[1], lat = R.rs(seed, idx, 1) * 0.3;
      var ax = dx ? (dx > 0 ? f.x1 : f.x0) : f.cx + lat * f.w;
      var ay = dy ? (dy > 0 ? f.y1 : f.y0) : f.cy + lat * f.h;
      var ex = dx ? (dx > 0 ? W : 0) : ax, ey = dy ? (dy > 0 ? Hh : 0) : ay;
      if (Math.hypot(ex - ax, ey - ay) < 12 * u) return;
      segStroke(c, 'xlTether ' + idx, ax, ay, ex, ey, sc.fg, 2 * u, function (q) {
        if (!q.ok) return { alpha: 0 };
        var e = ein(q.t, 0.3, idx * 0.07, E.outCubic);
        return { 'scale.x': dx ? Math.max(0.01, e) : 1, 'scale.y': dy ? Math.max(0.01, e) : 1, alpha: 0.9 * q.o * (e > 0.01 ? 1 : 0) };
      });
      var nid = H.circle(c, 'xlTether node ' + idx, ax, ay, 5.5 * u, 5.5 * u, { fill: sc.bg, stroke: acc(c), width: 2.2 * u, alpha: 1 });
      C.sample(c.graph, nid, c.cut.start, c.cut.end, function (f0) {
        var q = phaseOf(c, f0); return { alpha: q.ok ? ein(q.t, 0.3, idx * 0.07, E.outCubic) * q.o : 0 };
      });
      count++;
    })(k);
  }
  return { count: count };
});

/* 24. xlHandArrow */
reg('xlHandArrow', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), W = c.comp.width, Hh = c.comp.height, m = H.decMG(c) * 0.8;
  var col = colOf(c, P), sx = P.right ? 1 : -1, sy = P.low ? 1 : -1;
  var rooms = { r: W - m - bb.x1, l: bb.x0 - m, t: bb.y0 - m, b: Hh - m - bb.y1 };
  var hs = sx > 0 ? ['r', 'l'] : ['l', 'r'], vs = sy > 0 ? ['b', 't'] : ['t', 'b'];
  var ord = (H.p(P, 'v', 0) | 0) % 2 ? [hs[0], vs[0], hs[1], vs[1]] : [vs[0], hs[0], vs[1], hs[1]];
  var sd = ord.find(function (k) { return rooms[k] >= 110 * u; }) || ord.slice().sort(function (a, b) { return rooms[b] - rooms[a]; })[0];
  var room = Math.max(rooms[sd], 30 * u), len = cl(room * 0.75, 30 * u, 240 * u);
  var T, S, Cp;
  if (sd === 'r' || sd === 'l') {
    var d = sd === 'r' ? 1 : -1;
    T = [(d > 0 ? bb.x1 : bb.x0) + d * 16 * u, bb.cy + sy * bb.h * 0.15];
    S = [T[0] + d * len, cl(T[1] + sy * len * 0.6, m, Hh - m)];
    Cp = [mix(T[0], S[0], 0.8), T[1] - sy * len * 0.1];
  } else {
    var d2 = sd === 'b' ? 1 : -1;
    T = [bb.cx + sx * bb.w * 0.2, (d2 > 0 ? bb.y1 : bb.y0) + d2 * 16 * u];
    S = [cl(T[0] + sx * len * 0.7, m, W - m), T[1] + d2 * len];
    Cp = [T[0] - sx * len * 0.12, mix(T[1], S[1], 0.8)];
  }
  var raw = quadPts(S, Cp, T, 22).map(function (pt, i) {
    var k = Math.sin(i / 22 * Math.PI) * 2.6 * u;
    return [pt[0] + R.noise1(i * 0.45, H.p(P, 'seed', 3)) * k, pt[1] + R.noise1(i * 0.45 + 9, H.p(P, 'seed', 3)) * k];
  });
  var shaft = H.poly(c, 'xlHandArrow shaft', raw, false, { stroke: col, width: Math.max(1, 3.2 * u), alpha: 1 });
  var an = Math.atan2(Cp[1] - T[1], Cp[0] - T[0]), hl = Math.min(26 * u, len * 0.4);
  var headPts = [
    [T[0] + Math.cos(an - 0.52) * hl, T[1] + Math.sin(an - 0.52) * hl],
    T,
    [T[0] + Math.cos(an + 0.48) * hl * 0.85, T[1] + Math.sin(an + 0.48) * hl * 0.85]
  ];
  var head = H.poly(c, 'xlHandArrow head', headPts, false, { stroke: col, width: Math.max(1, 3.2 * u), alpha: 1 });
  C.sample(c.graph, shaft, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); return { alpha: q.ok ? Math.min(1, q.o * 1.6) * ein(q.t, 0.5, 0, E.inOutCubic) : 0 };
  });
  C.sample(c.graph, head, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); return { alpha: q.ok ? Math.min(1, q.o * 1.6) * ein(q.t, 0.2, 0.45) : 0 };
  });
  return { shaft: shaft, head: head };
});

/* 25. xlAccentTicks */
reg('xlAccentTicks', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c);
  var sx = P.right ? 1 : -1, col = colOf(c, P), k0 = cl(bb.h / (170 * u), 0.8, 1.7);
  var cs = [[sx, -1], [-sx, 1], [-sx, -1]].slice(0, cl(H.p(P, 'n', 1) | 0, 1, 3));
  var count = 0;
  cs.forEach(function (pair, ci) {
    var cxs = pair[0], cys = pair[1];
    var ox = (cxs > 0 ? bb.x1 : bb.x0) - cxs * 6 * u, oy = (cys > 0 ? bb.y1 : bb.y0) - cys * 6 * u, base = Math.atan2(cys * 0.75, cxs);
    [-0.46, 0, 0.46].forEach(function (da, i) {
      var an = base + da * cxs * cys, L = (i === 1 ? 42 : 30) * u * k0, rb = 20 * u * k0;
      var p0 = [ox + Math.cos(an) * rb, oy + Math.sin(an) * rb], p1 = [ox + Math.cos(an) * (rb + L), oy + Math.sin(an) * (rb + L)];
      var id = segStroke(c, 'xlTick ' + ci + '_' + i, p0[0], p0[1], p1[0], p1[1], col, 4.4 * u * Math.min(k0, 1.3), function (q) {
        var tau = q.t - ci * 0.12; if (!q.ok || tau <= 0) return { alpha: 0 };
        var cyc = tau % 1.5, nud = 7 * u * Math.exp(-cyc * 7) * (tau > 1.5 ? 1 : 0) * H.motionAmt(c);
        var e = ein(tau, 0.28, i * 0.03), sp0 = H.toScene(c, ox + Math.cos(an) * (rb + nud), oy + Math.sin(an) * (rb + nud));
        return { 'position.x': sp0[0], 'position.y': sp0[1], 'scale.x': Math.max(0.01, e), 'scale.y': Math.max(0.01, e), alpha: Math.min(1, q.o * 2) };
      });
      if (id) count++;
    });
  });
  return { count: count };
});

/* 26. xlPennant */
reg('xlPennant', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), sc = c.sc, W = c.comp.width, Hh = c.comp.height, m = H.decMG(c) * 0.5;
  var rt = bb.y0 - m, rb = Hh - m - bb.y1, sy = rt >= 60 * u || rt >= rb ? -1 : 1, room = sy < 0 ? rt : rb;
  var hgt = cl(room * 0.8, 24 * u, 120 * u), xs = P.big ? [P.right ? 1 : -1, P.right ? -1 : 1] : [P.right ? 1 : -1];
  var col = colOf(c, { accent: !P.accent });
  xs.forEach(function (sx, k) {
    var x = cl(sx > 0 ? bb.x1 + 6 * u : bb.x0 - 6 * u, m, W - m), y0 = sy < 0 ? bb.y0 - 6 * u : bb.y1 + 6 * u;
    var yT = y0 + sy * hgt;
    segStroke(c, 'xlPennant pole ' + k, x, y0, x, yT, sc.fg, 2.4 * u, function (q) {
      if (!q.ok) return { alpha: 0 };
      var rise = E.outBack(cl((q.t - k * 0.12) / 0.4), 1.4) * q.o;
      return { 'scale.y': Math.max(0.01, rise), alpha: rise > 0.01 ? 1 : 0 };
    });
    H.circle(c, 'xlPennant base ' + k, x, y0, 3.6 * u, 3.6 * u, { fill: sc.fg, alpha: 1 });
    var fl = cl(hgt * 0.8, 26 * u, 96 * u), fh = cl(hgt * 0.42, 14 * u, 50 * u);
    var dir = (sx > 0 ? x + fl * 1.05 < W - m * 0.6 : x - fl * 1.05 < m * 0.6) ? 1 : -1;
    var ym = yT - sy * fh * 0.5;
    var fid = H.poly(c, 'xlPennant flag ' + k, [[x, yT], [x + dir * fl, ym], [x, yT - sy * fh]], true, { fill: col, alpha: 0.95 });
    C.sample(c.graph, fid, c.cut.start, c.cut.end, function (f0) {
      var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
      var e = ein(q.t, 0.45, 0.2 + k * 0.12) * q.o;
      return { 'scale.x': Math.max(0.01, e), alpha: e > 0.01 ? 0.95 : 0 };
    });
  });
  return { count: xs.length };
});

/* 27. xlCheckBox */
reg('xlCheckBox', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), sc = c.sc;
  var s = cl(Math.min(bb.w, bb.h) * 0.5, 46 * u, 92 * u), sp = H.nearBB(c, bb, s * 1.25, s * 1.25, P, 18 * u);
  var x = sp.x + s * 0.05, y = sp.y + s * 0.2, sd = H.p(P, 'seed', c.cut.seed || 3), k = s / (44 * u);
  var j = function (idx) { return R.rs(sd, idx) * s * 0.035; }, pts = [];
  if ((H.p(P, 'v', 0) | 0) % 2) {
    for (var i = 0; i <= 30; i++) {
      var an = -2 + i / 30 * TAU * 1.07, r = s * 0.5 * (1 + 0.04 * Math.sin(i * 0.9 + sd % 7));
      pts.push([x + s / 2 + Math.cos(an) * r, y + s / 2 + Math.sin(an) * r]);
    }
  } else {
    pts = [[x + j(1), y + j(2)], [x + s + j(3), y + j(4)], [x + s + j(5), y + s + j(6)], [x + j(7), y + s + j(8)], [x + j(1) - 1, y + j(2) - s * 0.08]];
  }
  var boxId = H.poly(c, 'xlCheckBox outline', pts, false, { stroke: sc.fg, width: Math.max(1, 2.4 * u * Math.max(0.8, k)), alpha: 1 });
  var ckPts = quadPts([x + s * 0.2, y + s * 0.5], [x + s * 0.34, y + s * 0.62], [x + s * 0.44, y + s * 0.8], 4)
    .concat(quadPts([x + s * 0.44, y + s * 0.8], [x + s * 0.66, y + s * 0.2], [x + s * 1.12, y - s * 0.14], 8));
  var tickId = H.poly(c, 'xlCheckBox tick', ckPts, false, { stroke: acc(c), width: Math.max(1.5, 4.6 * u * Math.max(0.8, k)), alpha: 1 });
  C.sample(c.graph, boxId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); return { alpha: q.ok ? Math.min(1, q.o * 1.6) * ein(q.t, 0.4, 0, E.inOutCubic) : 0 };
  });
  C.sample(c.graph, tickId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); return { alpha: q.ok ? Math.min(1, q.o * 1.6) * ein(q.t, 0.28, 0.42, E.inOutCubic) : 0 };
  });
  return { box: boxId, tick: tickId };
});

/* 28. xlCutLine */
reg('xlCutLine', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), sc = c.sc;
  var ax = axesOf(c, bb), b = sideBand(c, ax, 56 * u, !!P.low, 16 * u + (ax.C1 - ax.C0) * 0.08), rev = !!P.right;
  function X(a) { return rev ? ax.AM - a : a; }
  var segs = [], step = 23 * u;
  for (var a = ax.AM * 0.03; a < ax.AM * 0.88; a += step) {
    var p0 = ax.M(X(a), b.c), p1 = ax.M(X(Math.min(ax.AM * 0.88, a + 14 * u)), b.c);
    segs.push([p0[0], p0[1], p1[0], p1[1]]);
  }
  var dashId = C.shape(c.graph, c.cut, c.cut.id + ' / xlCutLine dashes', c.parent, H.segCmds(c, segs), { stroke: sc.fg, width: Math.max(1, 2.2 * u), alpha: 0.9 });
  var rig = c.graph.add('null', c.cut.id + ' / xlCutLine scissors', c.parent, c.cut.start, c.cut.end, {
    rotation: -((ax.vert ? 90 : 0) + (rev ? 180 : 0))
  });
  var scCol = P.accent ? acc(c) : sc.fg, scScale = u * 1.7;
  [-1, 1].forEach(function (sg, idx) {
    var bladeRig = c.graph.add('null', c.cut.id + ' / xlCutLine blade ' + idx, rig, c.cut.start, c.cut.end, {});
    C.shape(c.graph, c.cut, c.cut.id + ' / xlCutLine blade line ' + idx, bladeRig, [['M', 24 * scScale, 0], ['L', -13 * scScale, 0]], { stroke: scCol, width: Math.max(1, 2.2 * u), alpha: 1 });
    C.shape(c.graph, c.cut, c.cut.id + ' / xlCutLine loop ' + idx, bladeRig, G.ellipse(-19.5 * scScale, sg * 2.5 * scScale, 6.5 * scScale, 6.5 * scScale), { stroke: scCol, width: Math.max(1, 2.2 * u), alpha: 1 });
    C.sample(c.graph, bladeRig, c.cut.start, c.cut.end, function (f0) {
      var q = phaseOf(c, f0), mv = E.inOutCubic(cl(q.t / 0.85));
      var ang = (9 + 15 * Math.abs(Math.sin(q.t * (mv < 1 ? 11 : 3.5)))) * (0.4 + 0.6 * H.motionAmt(c));
      return { rotation: -(sg * ang) };
    });
  });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0), mv = E.inOutCubic(cl(q.t / 0.85));
    var s = ax.AM * mix(0.03, 0.88, mv) + Math.max(0, q.t - 0.85) * 5 * u * H.motionAmt(c);
    var pt = ax.M(X(s), b.c), spPt = H.toScene(c, pt[0], pt[1]);
    return { 'position.x': spPt[0], 'position.y': spPt[1] };
  });
  C.sample(c.graph, dashId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); return { alpha: q.ok ? 0.9 * q.o * ein(q.t, 0.5) : 0 };
  });
  return { dash: dashId, scissors: rig };
});

/* 29. xlSeam */
reg('xlSeam', function (c) {
  var P = c.preset.params || {}, bb = H.decBB(c), u = H.decU(c), W = c.comp.width, Hh = c.comp.height, ins = H.decMG(c) * 0.55;
  var col = colOf(c, P), v = (H.p(P, 'v', 0) | 0) % 3;
  var pa = mkPath(rrectPts(ins, ins, W - ins, Hh - ins, 20 * u, 5), true), L = pa.L;
  var segs = [], step = v === 0 ? 28 * u : (v === 1 ? 12 * u : 27 * u) * Math.max(1, L / (400 * (v === 1 ? 12 : 27) * u));
  if (v === 0) {
    for (var s = 0; s < L; s += step) {
      var sub = spanPts(pa, s, Math.min(L, s + 17 * u), true);
      if (sub.length >= 2) segs.push([sub[0][0], sub[0][1], sub[sub.length - 1][0], sub[sub.length - 1][1]]);
    }
  } else if (v === 1) {
    var zz = [];
    for (var i = 0; i * step <= L && i < 360; i++) {
      var q0 = atPath(pa, mod(i * step, L)), nx = -Math.sin(q0[2]), ny = Math.cos(q0[2]), d = 5 * u;
      zz.push([q0[0] + nx * d * (i % 2 ? 1 : -1), q0[1] + ny * d * (i % 2 ? 1 : -1)]);
    }
    for (var j = 1; j < zz.length; j++) segs.push([zz[j - 1][0], zz[j - 1][1], zz[j][0], zz[j][1]]);
  } else {
    for (var k = 0; k * step <= L && k < 240; k++) {
      var q1 = atPath(pa, mod(k * step, L)), nx2 = -Math.sin(q1[2]), ny2 = Math.cos(q1[2]), tx2 = Math.cos(q1[2]), ty2 = Math.sin(q1[2]), d2 = 5 * u;
      segs.push(
        [q1[0] - tx2 * d2 - nx2 * d2, q1[1] - ty2 * d2 - ny2 * d2, q1[0] + tx2 * d2 + nx2 * d2, q1[1] + ty2 * d2 + ny2 * d2],
        [q1[0] - tx2 * d2 + nx2 * d2, q1[1] - ty2 * d2 + ny2 * d2, q1[0] + tx2 * d2 - nx2 * d2, q1[1] + ty2 * d2 - ny2 * d2]
      );
    }
  }
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / xlSeam', c.parent, H.segCmds(c, segs), { stroke: col, width: Math.max(1, (v === 0 ? 2.8 : 2.2) * u), alpha: 0.85 });
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); return { alpha: q.ok ? 0.85 * Math.min(1, q.o * 1.5) * ein(q.t, 0.8, 0, E.inOutCubic) : 0 };
  });
  return { layer: id };
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZHelpers);
