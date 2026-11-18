/* JIZURA Cavalry Pack: decor themes (54 theme decor recipes: hr*, hz*, kn*, kz*, ty*, tz*, wz*) */
(function (N, G, C, R, V, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, TAU = H.TAU, DEG = H.DEG;

function reg(key, src, build) {
  N.register('decor', key, {
    source: src + ' (' + key + ')',
    scope: 'cut',
    build: build,
    differences: ['Native Cavalry editable geometry faithful to ' + src + '.']
  });
}

function acc(c) { return H.accCol(c.sc, c.sc.bg, false); }
function sub(c) { return H.subCol(c.sc, c.sc.bg); }
function darkBg(c) { return H.dark(c.sc.bg); }
function dimC(c, k) { return H.layC(c.sc, darkBg(c) ? Math.min(k, 0.36) : Math.min(k, 0.35)); }
function glowC(c) { return darkBg(c) ? H.mixHex(c.sc.fg, c.sc.accent || c.sc.fg, 0.25) : H.mixHex(c.sc.bg, '#fff8e8', 0.85); }
function lightOf(c) { return H.lum(c.sc.fg) > H.lum(c.sc.bg) ? c.sc.fg : c.sc.bg; }
function nightC(c) { return H.mixHex(c.sc.bg, '#000000', darkBg(c) ? 0.72 : 0.9); }
function pad2(n) { return String(Math.max(0, Math.floor(n))).padStart(2, '0'); }
function wrap(v, m) { return ((v % m) + m) % m; }
function rr(a, b, s, i, k) { return a + (b - a) * R.hash01(s, i, k); }
function rs(s, i, k) { return R.hash01(s, i, k) * 2 - 1; }
function cutText(c) {
  var src = c.cut.source || {}, n0 = c.cut.nodes && c.cut.nodes[0];
  return String(src.text || (n0 && n0.text) || '').replace(/\s+/g, ' ').trim();
}
function lineText(c) {
  var src = c.cut.source || {};
  return String(src.lineText || cutText(c)).replace(/\s+/g, ' ').trim();
}
function fmtTime(sec) {
  var s = Math.max(0, sec || 0), m = Math.floor(s / 60), r = s - m * 60;
  return pad2(m) + ':' + pad2(Math.floor(r)) + '.' + pad2(Math.floor((r % 1) * 100));
}
function tw(str, fs, tr) { return Array.from(String(str || '')).length * fs * (0.62 + (tr == null ? 0.08 : tr)); }
function noise1(x, s) {
  var i = Math.floor(x), f = x - i; f = f * f * (3 - 2 * f);
  return mix(rs(s, i, 71), rs(s, i + 1, 71), f);
}
function lamp(t, seed, rate) {
  var st = Math.floor(t * 24), run = st >> 2;
  if (R.hash01(seed, run, 7) < 0.1 * (rate || 1)) return R.hash01(seed, st, 8) < 0.5 ? 0.15 : 0.55;
  return 0.88 + 0.12 * R.hash01(seed, st, 9);
}
function distBB(bb, x, y) {
  var dx = Math.max(bb.x0 - x, 0, x - bb.x1), dy = Math.max(bb.y0 - y, 0, y - bb.y1);
  return Math.hypot(dx, dy);
}
function farSpot(c, bb, s, k, wFrac, hFrac) {
  var W = c.comp.width, Hh = c.comp.height, pad = Math.min(W, Hh) * 0.07;
  var best = { x: pad, y: pad, d: 0 };
  for (var i = 0; i < 16; i++) {
    var x = pad + (W - pad * 2) * R.hash01(s, k, i, 11);
    var y = pad + (Hh - pad * 2) * R.hash01(s, k, i, 12);
    var d = distBB(bb, x, y);
    if (d > best.d) best = { x: x, y: y, d: d };
    if (d > Math.min(W, Hh) * Math.max(wFrac || 0.08, hFrac || 0.08) * 1.6) break;
  }
  return best;
}
function glyphCells(c, bb) {
  var gs = c.node ? V.glyphs(c, c.node) : [], out = [];
  var vert = bb.h > bb.w * 1.2;
  if (gs && gs.length && gs.length <= 40) {
    for (var i = 0; i < gs.length; i++) {
      var g = gs[i]; if (!String(g.ch || '').trim()) continue;
      out.push({ x: g.x, y: g.y, w: Math.max(4, g.w || g.size * 0.8), h: Math.max(4, g.h || g.size) });
    }
    if (out.length) {
      out.vert = vert && out.length > 1 && Math.abs(out[1].y - out[0].y) > Math.abs(out[1].x - out[0].x);
      return out;
    }
  }
  var n = cl(Array.from(cutText(c).replace(/\s+/g, '')).length, 1, 30), w = Math.max(10, bb.w), h = Math.max(10, bb.h);
  var best = 1, bv = 1e9;
  for (var r = 1; r <= Math.min(6, n); r++) {
    var a = vert ? w / r : w / Math.ceil(n / r), b = vert ? h / Math.ceil(n / r) : h / r;
    var v = Math.abs(Math.log(Math.max(0.01, a / Math.max(1, b))));
    if (v < bv - 1e-6) { bv = v; best = r; }
  }
  var per = Math.ceil(n / best);
  for (var j = 0; j < n; j++) {
    var a0 = Math.floor(j / per), b0 = j % per;
    if (!vert) out.push({ x: bb.x0 + (b0 + 0.5) * w / per, y: bb.y0 + (a0 + 0.5) * h / best, w: w / per, h: h / best });
    else out.push({ x: bb.x1 - (a0 + 0.5) * w / best, y: bb.y0 + (b0 + 0.5) * h / per, w: w / best, h: h / best });
  }
  out.vert = vert;
  return out;
}
function wordTimes(c, nMax) {
  var cut = c.cut, gs = c.node ? V.glyphs(c, c.node) : [];
  var ws = H.wordsOf(c, gs).words;
  var n = Math.max(1, Math.min(nMax || 6, ws.length || 1));
  if (n < 2 && cut.sourceEnd - cut.origin > c.comp.fps * 1.2) n = 2;
  var dur = (cut.sourceEnd - cut.origin) / c.comp.fps;
  var last = Math.max(0, Math.min(dur * 0.5, (n - 1) * 0.38)), out = [];
  for (var i = 0; i < n; i++) out.push(n > 1 ? last * i / (n - 1) : 0);
  return out;
}
function curIdx(ts, lt) {
  var k = 0; for (var i = 0; i < ts.length; i++) if (lt >= ts[i]) k = i; return k;
}
function spr(tau, f, d) {
  if (tau <= 0) return 0;
  return 1 - Math.exp(-d * tau) * Math.cos(f * tau);
}
function pls(tau, f, d) {
  if (tau <= 0) return 0;
  return Math.exp(-d * tau) * Math.sin(f * tau);
}
function axisOf(c, bb, pref) {
  var v = bb.h > bb.w * 1.3, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh);
  var roomA = v ? W - bb.x1 : bb.y0, roomB = v ? bb.x0 : Hh - bb.y1;
  var s = pref || 1;
  if ((s < 0 ? roomA : roomB) < u * 0.13 && (s < 0 ? roomB : roomA) > (s < 0 ? roomA : roomB)) s = -s;
  var room = s < 0 ? roomA : roomB;
  return {
    v: v, s: s, room: room, len: v ? bb.h : bb.w,
    nrm: v ? [s < 0 ? 1 : -1, 0] : [0, s < 0 ? -1 : 1],
    dirv: v ? [0, 1] : [1, 0],
    at: function (t, d) {
      return v ? [s < 0 ? bb.x1 + d : bb.x0 - d, mix(bb.y0, bb.y1, t)]
        : [mix(bb.x0, bb.x1, t), s < 0 ? bb.y0 - d : bb.y1 + d];
    }
  };
}

/* ==================== HORROR (7 hr* from 11p_horror3.js) ==================== */

/* 1. hrScratches */
reg('hrScratches', 'src/11p_horror3.js', function (c) {
  var P = c.preset.params || {}, sc = c.sc, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh);
  var bb = H.decBB(c), s = H.p(P, 'seed', 1) | 0, n = cl(H.p(P, 'n', 2) | 0, 1, 4), v = H.p(P, 'v', 0) | 0;
  for (var g = 0; g < n; g++) {
    (function (gg) {
      var corner = (gg + v) % 4, right = corner % 2 === 1, low = corner >= 2;
      var L = u * rr(0.28, 0.42, s, gg, 1), ang = (right ? -1 : 1) * rr(55, 75, s, gg, 2) * DEG * (low ? -1 : 1);
      var cx = right ? rr(W * 0.72, W * 0.9, s, gg, 3) : rr(W * 0.1, W * 0.28, s, gg, 3);
      var cy = low ? rr(Hh * 0.72, Hh * 0.88, s, gg, 4) : rr(Hh * 0.12, Hh * 0.28, s, gg, 4);
      if (H.hitBB(cx - L / 2, cy - L / 2, cx + L / 2, cy + L / 2, bb, u * 0.02)) {
        cy = low ? Math.max(cy, bb.y1 + L * 0.6) : Math.min(cy, bb.y0 - L * 0.6);
      }
      var dx = Math.sin(ang), dy = -Math.cos(ang), px = Math.cos(ang), py = Math.sin(ang);
      var col = (gg % 2 && H.contrast(sc.accent, sc.bg) > 1.8) ? sc.accent : sc.fg;
      for (var k = 0; k < 4; k++) {
        (function (kk) {
          var off = (kk - 1.5) * u * 0.042, len = L * (0.75 + 0.3 * R.hash01(s, gg, kk, 5)), st = R.hash01(s, gg, kk, 6) * L * 0.1;
          var x0 = cx + px * off - dx * L / 2 + dx * st, y0 = cy + py * off - dy * L / 2 + dy * st;
          var m = 8, pts = [], lw = Math.max(1.2, u * 0.0085);
          for (var i = 0; i <= m; i++) {
            var f = i / m, j = rs(s, gg * 7 + kk, i) * u * 0.004;
            pts.push([x0 + dx * len * f + px * j, y0 + dy * len * f + py * j]);
          }
          var rig = c.graph.add('null', c.cut.id + ' / hrScratches g' + gg + 'k' + kk, c.parent, c.cut.start, c.cut.end, {
            position: H.toScene(c, x0, y0)
          });
          var localPts = pts.map(function (pt) { return [pt[0] - x0, -(pt[1] - y0)]; });
          var cmds = localPts.map(function (pt, idx) { return [idx ? 'L' : 'M', pt[0], pt[1]]; });
          var sh = C.shape(c.graph, c.cut, c.cut.id + ' / hrScratches s' + gg + 'k' + kk, rig, cmds, { stroke: col, width: lw, alpha: 0.85 });
          C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
            var env = R.env(c, f0), out = 1 - E.inCubic(env.pOut || 0);
            var e = E.outExpo(cl((env.lt - 0.08 - gg * 0.18) / 0.16)) * out;
            return { 'scale.x': Math.max(0.01, e), 'scale.y': Math.max(0.01, e) };
          });
          C.sample(c.graph, sh, c.cut.start, c.cut.end, function (f0) {
            var env = R.env(c, f0), out = 1 - E.inCubic(env.pOut || 0);
            var e = E.outExpo(cl((env.lt - 0.08 - gg * 0.18) / 0.16)) * out;
            return { alpha: e > 0.01 ? 0.85 * out : 0 };
          });
        })(k);
      }
    })(g);
  }
  return { count: n };
});

/* 2. hrSigil */
reg('hrSigil', 'src/11p_horror3.js', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = Math.min(c.comp.width, c.comp.height);
  var bb = H.decBB(c), s = H.p(P, 'seed', 1) | 0, right = !!P.right;
  var cx = bb.cx, cy = bb.cy, R0 = Math.min(u * 0.46, Math.max(bb.w, bb.h) * 0.62 + u * 0.08);
  var col = H.layC(sc, darkBg(c) ? 0.3 : 0.28), lw = Math.max(1.2, u * 0.0022);
  var n0 = c.graph.layers.length;
  var rig = c.graph.add('null', c.cut.id + ' / hrSigil rig', c.parent, c.cut.start, c.cut.end, {
    position: H.toScene(c, cx, cy)
  });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
    var env = R.env(c, f0);
    return { rotation: -(env.ltb * 4 * (right ? -1 : 1)) };
  });
  var scPts = function (pts) { return pts.map(function (pt) { return [pt[0], -pt[1]]; }); };
  var rings = [[R0, lw * 1.4, 1], [R0 * 0.9, lw, 1], [R0 * 0.62, lw, 0.8]];
  rings.forEach(function (rg, idx) {
    var pts = H.arcPts(0, 0, rg[0], -90, 270, 48);
    var sh = C.shape(c.graph, c.cut, c.cut.id + ' / hrSigil r' + idx, rig, scPts(pts).map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }), {
      stroke: col, width: rg[1], alpha: rg[2]
    });
    C.sample(c.graph, sh, c.cut.start, c.cut.end, function (f0) {
      var env = R.env(c, f0), e = E.inOutSine(cl(env.lt / 1.2)), out = 1 - E.inCubic(env.pOut || 0);
      return { alpha: out * rg[2] * e, 'scale.x': 0.85 + 0.15 * e, 'scale.y': 0.85 + 0.15 * e };
    });
  });
  var starPts = [];
  for (var i = 0; i <= 7; i++) {
    var an = -Math.PI / 2 + (i * 3 % 7) / 7 * TAU;
    starPts.push([Math.cos(an) * R0 * 0.9, -Math.sin(an) * R0 * 0.9]);
  }
  var star = C.shape(c.graph, c.cut, c.cut.id + ' / hrSigil heptagram', rig, starPts.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }), {
    stroke: col, width: lw, alpha: 0.9
  });
  C.sample(c.graph, star, c.cut.start, c.cut.end, function (f0) {
    var env = R.env(c, f0), out = 1 - E.inCubic(env.pOut || 0), pe = cl((env.lt - 0.3) / 1.2);
    return { alpha: out * pe };
  });
  var markCmds = [];
  for (var m = 0; m < 42; m++) {
    var a0 = m / 42 * TAU, t = R.hash(s, m, 3) % 4, r0 = R0 * 0.915, r1 = R0 * 0.985, cs = Math.cos(a0), sn = Math.sin(a0);
    if (t === 0) {
      markCmds.push(['M', cs * r0, -sn * r0], ['L', cs * r1, -sn * r1]);
    } else if (t === 1) {
      var ell = G.ellipse(cs * (r0 + r1) / 2, -sn * (r0 + r1) / 2, R0 * 0.012, R0 * 0.012);
      markCmds = markCmds.concat(ell);
    } else if (t === 2) {
      var q = (r0 + r1) / 2, d = R0 * 0.018;
      markCmds.push(['M', cs * q - sn * d, -(sn * q + cs * d)], ['L', cs * q + sn * d, -(sn * q - cs * d)]);
    }
  }
  if (markCmds.length) {
    var mSh = C.shape(c.graph, c.cut, c.cut.id + ' / hrSigil marks', rig, markCmds, { stroke: col, width: lw, alpha: 0.85 });
    C.sample(c.graph, mSh, c.cut.start, c.cut.end, function (f0) {
      var env = R.env(c, f0), e = E.inOutSine(cl(env.lt / 1.2)), out = 1 - E.inCubic(env.pOut || 0);
      return { alpha: out * e * 0.85 };
    });
  }
  H.placeBackFrom(c, n0);
  return { r: R0 };
});

/* 3. hrWatchEye */
reg('hrWatchEye', 'src/11p_horror3.js', function (c) {
  var P = c.preset.params || {}, sc = c.sc, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh);
  var bb = H.decBB(c), s = H.p(P, 'seed', 1) | 0;
  var ew = u * (P.big ? 0.22 : 0.16), eh = ew * 0.26, lw = Math.max(1.2, u * 0.003);
  var x = P.right ? W - u * 0.07 - ew / 2 : u * 0.07 + ew / 2;
  var y = P.low ? Hh - u * 0.08 - eh : u * 0.08 + eh;
  if (H.hitBB(x - ew / 2, y - eh, x + ew / 2, y + eh, bb, u * 0.02)) {
    y = P.low ? Math.max(y, Math.min(Hh - eh * 1.2, bb.y1 + eh * 1.6)) : Math.min(y, Math.max(eh * 1.2, bb.y0 - eh * 1.6));
  }
  var an = Math.atan2(bb.cy - y, bb.cx - x), look = Math.min(1, Math.hypot(bb.cx - x, bb.cy - y) / u);
  var openFn = function (env) {
    var open = E.outCubic(cl((env.lt - 0.2) / 0.6)) * (1 - E.inCubic(env.pOut || 0));
    for (var k = 0; k < 3; k++) {
      var at = 0.9 + R.hash01(s, k, 5) * 3 + k * 1.3, d = Math.abs(env.ltb - at);
      if (d < 0.08) open *= d / 0.08;
    }
    return open;
  };
  var eyeRig = c.graph.add('null', c.cut.id + ' / hrWatchEye rig', c.parent, c.cut.start, c.cut.end, {
    position: H.toScene(c, x, y)
  });
  var topPts = [], botPts = [], lashCmds = [];
  for (var i = 0; i <= 16; i++) {
    var f = i / 16, xx = -ew / 2 + ew * f, yy = Math.sin(Math.PI * f) * eh;
    topPts.push([xx, yy]); botPts.push([xx, -yy]);
  }
  for (var k = 0; k < 5; k++) {
    var fk = 0.2 + k * 0.15, p = topPts[Math.round(fk * 16)];
    lashCmds.push(['M', p[0], p[1]], ['L', p[0] + (fk - 0.5) * ew * 0.12, p[1] + eh * 0.35]);
  }
  var topSh = C.shape(c.graph, c.cut, c.cut.id + ' / hrWatchEye top', eyeRig, topPts.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }), { stroke: sc.fg, width: lw * 1.3 });
  var botSh = C.shape(c.graph, c.cut, c.cut.id + ' / hrWatchEye bot', eyeRig, botPts.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }), { stroke: sc.fg, width: lw });
  var lashSh = C.shape(c.graph, c.cut, c.cut.id + ' / hrWatchEye lash', eyeRig, lashCmds, { stroke: sc.fg, width: lw * 0.8, alpha: 0.8 });
  [topSh, botSh, lashSh].forEach(function (id, idx) {
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
      var env = R.env(c, f0), op = openFn(env), out = 1 - E.inCubic(env.pOut || 0);
      return { 'scale.y': Math.max(0.02, op), alpha: idx === 2 ? 0.8 * op : out * cl(env.lt / 0.2) };
    });
  });
  var irisRig = c.graph.add('null', c.cut.id + ' / hrWatchEye iris rig', eyeRig, c.cut.start, c.cut.end, {});
  C.shape(c.graph, c.cut, c.cut.id + ' / hrWatchEye iris', irisRig, G.ellipse(0, 0, eh * 0.72, eh * 0.72), { stroke: sc.fg, width: lw });
  C.shape(c.graph, c.cut, c.cut.id + ' / hrWatchEye pupil', irisRig, G.ellipse(0, 0, eh * 0.32, eh * 0.32), { fill: darkBg(c) ? acc(c) : sc.fg });
  C.sample(c.graph, irisRig, c.cut.start, c.cut.end, function (f0) {
    var env = R.env(c, f0), op = openFn(env);
    var ox = Math.cos(an) * ew * 0.18 * look + noise1(env.ltb * 0.8, s) * ew * 0.03;
    var oy = Math.sin(an) * eh * 0.3 * look;
    return { 'position.x': ox, 'position.y': -oy, 'scale.y': Math.max(0.01, cl(op * 1.1)), alpha: op > 0.05 ? 1 : 0 };
  });
  return { x: x, y: y };
});

/* 4. hrStaticPatch */
reg('hrStaticPatch', 'src/11p_horror3.js', function (c) {
  var P = c.preset.params || {}, sc = c.sc, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh);
  var bb = H.decBB(c), s = H.p(P, 'seed', 1) | 0, n = 3 + cl(H.p(P, 'n', 2) | 0, 1, 3) * 2;
  for (var k = 0; k < n; k++) {
    (function (kk) {
      var w = u * rr(0.06, 0.2, s, kk, 2), h = u * rr(0.02, 0.07, s, kk, 3), edge = R.hash(s, kk, 4) % 4;
      var x = R.hash01(s, kk, 5) * (W - w), y = R.hash01(s, kk, 6) * (Hh - h);
      if (edge === 0) y = rr(0.02, 0.18, s, kk, 7) * Hh;
      else if (edge === 1) y = Hh - h - rr(0.02, 0.18, s, kk, 7) * Hh;
      else if (edge === 2) x = rr(0.01, 0.1, s, kk, 7) * W;
      else x = W - w - rr(0.01, 0.1, s, kk, 7) * W;
      if (H.hitBB(x, y, x + w, y + h, bb, u * 0.02)) return;
      var scP = H.toScene(c, x + w / 2, y + h / 2);
      var rig = c.graph.add('null', c.cut.id + ' / hrStaticPatch ' + kk, c.parent, c.cut.start, c.cut.end, { position: scP });
      var cmds1 = [], cmds2 = [];
      for (var r = 0; r < 14; r++) {
        var bw0 = w * rr(0.12, 0.45, s, kk * 17 + r, 21), bh0 = h * rr(0.12, 0.35, s, kk * 17 + r, 22);
        var bx = (R.hash01(s, kk * 17 + r, 23) - 0.5) * (w - bw0), by = (R.hash01(s, kk * 17 + r, 24) - 0.5) * (h - bh0);
        var cr = G.rect(bx - bw0 / 2, by - bh0 / 2, bw0, bh0);
        if (r % 2) cmds1 = cmds1.concat(cr); else cmds2 = cmds2.concat(cr);
      }
      var s1 = C.shape(c.graph, c.cut, c.cut.id + ' / hrStaticPatch fg ' + kk, rig, cmds1, { fill: sc.fg, alpha: 0.7 });
      var s2 = C.shape(c.graph, c.cut, c.cut.id + ' / hrStaticPatch sub ' + kk, rig, cmds2, { fill: sub(c), alpha: 0.55 });
      C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), st = Math.floor(env.lt * 12);
        var a0 = H.io(c, f0, 0.2), show = R.hash01(s, kk, st, 1) >= 0.35 ? 1 : 0;
        var jx = rs(s, kk, st >> 1) * u * 0.02;
        return { 'position.x': scP[0] + jx, alpha: a0 * show * rr(0.45, 0.85, s, kk, st, 11) };
      });
      [s1, s2].forEach(function (id, idx) {
        C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
          var env = R.env(c, f0), st = Math.floor(env.lt * 12);
          var a0 = H.io(c, f0, 0.2), on = R.hash01(s, kk, st, 1) >= 0.35 ? 1 : 0;
          return { alpha: a0 * on * (idx ? 0.55 : 0.75) * rr(0.45, 0.85, s, kk, st, 11) };
        });
      });
    })(k);
  }
  return { count: n };
});

/* 5. hrDustBeam */
reg('hrDustBeam', 'src/11p_horror3.js', function (c) {
  var P = c.preset.params || {}, sc = c.sc, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh);
  var s = H.p(P, 'seed', 1) | 0, right = !!P.right, n0 = c.graph.layers.length;
  var x0 = right ? W * 0.78 : W * 0.22, w0 = W * 0.12, w1 = W * 0.34, sl = (right ? -1 : 1) * W * 0.28;
  var polyPts = [[x0 - w0 / 2, -2], [x0 + w0 / 2, -2], [x0 + sl + w1 / 2, Hh + 2], [x0 + sl - w1 / 2, Hh + 2]];
  var L = lightOf(c), dk = nightC(c), kBeam = darkBg(c) ? 0.11 : 0.22;
  if (!darkBg(c)) {
    var dimPts = [[-10, -10], [W + 10, -10], [W + 10, Hh + 10], [-10, Hh + 10]];
    var dimId = H.poly(c, 'hrDustBeam dim', dimPts, true, { fill: dk, alpha: 0.1 });
    C.sample(c.graph, dimId, c.cut.start, c.cut.end, function (f0) { return { alpha: 0.1 * H.io(c, f0, 0.8) }; });
  }
  var beamId = H.poly(c, 'hrDustBeam beam', polyPts, true, { fill: L, alpha: kBeam });
  C.sample(c.graph, beamId, c.cut.start, c.cut.end, function (f0) { return { alpha: kBeam * H.io(c, f0, 0.8) }; });
  var dustC = darkBg(c) ? L : sc.sub;
  for (var i = 0; i < 28; i++) {
    (function (ii) {
      var baseFy = R.hash01(s, ii, 1), rate = rr(0.008, 0.024, s, ii, 2), fx = R.hash01(s, ii, 3), r = Math.max(1, u * rr(0.0014, 0.0036, s, ii, 4));
      var dId = C.shape(c.graph, c.cut, c.cut.id + ' / hrDustBeam p' + ii, c.parent, G.ellipse(0, 0, r, r), { fill: dustC, alpha: 0.5 });
      C.sample(c.graph, dId, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), a = H.io(c, f0, 0.8), t = env.ltb;
        var fy = wrap(baseFy + t * rate, 1), y = fy * Hh, cx = x0 + sl * fy, ww = w0 + (w1 - w0) * fy;
        var x = cx + (fx - 0.5) * ww + Math.sin(t * 0.7 + ii) * u * 0.01, scP = H.toScene(c, x, y);
        return { 'position.x': scP[0], 'position.y': scP[1], alpha: cl(a * (0.35 + 0.35 * Math.sin(t * 1.5 + ii)) * (1 - fy * 0.6)) };
      });
    })(i);
  }
  H.placeBackFrom(c, n0);
  return { x0: x0 };
});

/* 6. hrDrips */
reg('hrDrips', 'src/11p_horror3.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh);
  var bb = H.decBB(c), s = H.p(P, 'seed', 1) | 0, n = 7 + (H.p(P, 'n', 1) | 0) * 3;
  var col = darkBg(c) ? H.mixHex(c.sc.accent, c.sc.bg, 0.35) : nightC(c);
  var bandMax = u * 0.03, bandPts = [[-4, -4], [W + 4, -4]];
  for (var i = 28; i >= 0; i--) bandPts.push([W * i / 28, bandMax * (0.6 + 0.6 * R.hash01(s, i, 1))]);
  var bandSc = bandPts.map(function (pt) { return [pt[0] - W / 2, -pt[1]]; });
  var bandRig = c.graph.add('null', c.cut.id + ' / hrDrips band rig', c.parent, c.cut.start, c.cut.end, { position: [0, Hh / 2] });
  var bandSh = C.shape(c.graph, c.cut, c.cut.id + ' / hrDrips band', bandRig, bandSc.map(function (p, k) { return [k ? 'L' : 'M', p[0], p[1]]; }).concat([['Z']]), { fill: col, alpha: 0.9 });
  C.sample(c.graph, bandRig, c.cut.start, c.cut.end, function (f0) {
    var env = R.env(c, f0), out = 1 - E.inCubic(env.pOut || 0);
    return { 'scale.y': Math.max(0.02, E.outCubic(cl(env.lt / 0.4))) };
  });
  C.sample(c.graph, bandSh, c.cut.start, c.cut.end, function (f0) {
    var env = R.env(c, f0); return { alpha: 0.9 * (1 - E.inCubic(env.pOut || 0)) };
  });
  var lim = Math.max(bandMax * 2, bb.y0 - u * 0.05);
  for (var k = 0; k < n; k++) {
    (function (kk) {
      var x = W * (0.03 + 0.94 * R.hash01(s, kk, 2)), delay = R.hash01(s, kk, 3) * 0.8, dur = 2.5 + R.hash01(s, kk, 4) * 3;
      var L = u * rr(0.06, 0.3, s, kk, 5);
      if (x > bb.x0 - u * 0.03 && x < bb.x1 + u * 0.03) L = Math.min(L, lim - bandMax);
      if (L <= 4) return;
      var w = u * rr(0.004, 0.012, s, kk, 6), y0 = bandMax * 0.5;
      var rig = c.graph.add('null', c.cut.id + ' / hrDrips d' + kk, c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, x, y0) });
      var stalkPts = [[-w, 0], [w, 0], [w * 0.7, -L], [-w * 0.7, -L]];
      var stalk = C.shape(c.graph, c.cut, c.cut.id + ' / hrDrips s' + kk, rig, stalkPts.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }).concat([['Z']]), { fill: col, alpha: 0.9 });
      var drop = C.shape(c.graph, c.cut, c.cut.id + ' / hrDrips c' + kk, rig, G.ellipse(0, 0, w * 1.35, w * 1.35), { fill: col, alpha: 0.9 });
      C.sample(c.graph, stalk, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), out = 1 - E.inCubic(env.pOut || 0), g = E.outCubic(cl((env.lt - delay) / dur));
        return { 'scale.y': Math.max(0.01, g), alpha: g > 0.01 ? 0.9 * out : 0 };
      });
      C.sample(c.graph, drop, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), out = 1 - E.inCubic(env.pOut || 0), g = E.outCubic(cl((env.lt - delay) / dur));
        return { 'position.y': -L * g, alpha: g > 0.01 ? 0.9 * out : 0 };
      });
    })(k);
  }
  return { count: n };
});

/* 7. hrCracks */
reg('hrCracks', 'src/11p_horror3.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh);
  var bb = H.decBB(c), s = H.p(P, 'seed', 1) | 0, ox = P.right ? W : 0, oy = P.low ? Hh : 0;
  var col = c.sc.fg, lw = Math.max(1, u * 0.0018), base = Math.atan2(Hh / 2 - oy, W / 2 - ox);
  function branch(x, y, an, len, depth, id) {
    var pts = [[x, y]], cx = x, cy = y, m = 7;
    for (var i = 1; i <= m; i++) {
      var a = an + rs(s, id, i) * 0.5;
      cx += Math.cos(a) * len / m; cy += Math.sin(a) * len / m;
      if (H.hitBB(cx, cy, cx, cy, bb, u * 0.03)) break;
      pts.push([cx, cy]);
    }
    if (pts.length >= 2) {
      var scPts = pts.map(function (pt) { return H.toScene(c, pt[0], pt[1]); });
      var sh = C.shape(c.graph, c.cut, c.cut.id + ' / hrCracks d' + depth + '_' + id, c.parent, scPts.map(function (p, idx) { return [idx ? 'L' : 'M', p[0], p[1]]; }), {
        stroke: col, width: lw * (1.4 - depth * 0.35), alpha: 0.75
      });
      C.sample(c.graph, sh, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), out = 1 - E.inCubic(env.pOut || 0), e = E.outCubic(cl(env.lt / 1.6));
        var k = cl(e * (1 + depth * 0.2) - depth * 0.25);
        return { alpha: 0.75 * out * k };
      });
    }
    if (depth < 2 && pts.length >= 2) {
      for (var k = 0; k < 2; k++) {
        var j = Math.min(pts.length - 1, 2 + (R.hash(s, id, k * 3 + 1) % (pts.length - 1)));
        var pt = pts[j];
        branch(pt[0], pt[1], an + (k ? 0.6 : -0.6) * rr(0.6, 1.2, s, id, k + 4), len * 0.5, depth + 1, id * 3 + k + 1);
      }
    }
  }
  for (var r = 0; r < 3; r++) branch(ox, oy, base + (r - 1) * 0.35 + rs(s, r, 9) * 0.15, u * rr(0.28, 0.42, s, r, 10), 0, r + 1);
  return { ox: ox, oy: oy };
});

/* ==================== HORROR X2 (10 hz* from 11p_x2_horrorA.js) ==================== */

/* 8. hzPairEyes */
reg('hzPairEyes', 'src/11p_x2_horrorA.js', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = Math.min(c.comp.width, c.comp.height);
  var bb = H.decBB(c), s = H.p(P, 'seed', 1) | 0, n = Math.min(4, 1 + (H.p(P, 'n', 1) | 0));
  for (var k = 0; k < n; k++) {
    (function (kk) {
      var sp = farSpot(c, bb, s, kk, 0.07, 0.09); if (sp.d < u * 0.1) return;
      var t0 = 0.45 + kk * 0.6 + R.hash01(s, kk, 3) * 0.5, r = u * (P.big ? 0.011 : 0.0085) * (1 - kk * 0.12), gap = r * 4.4, tilt = rs(s, kk, 5) * 0.2;
      var scP = H.toScene(c, sp.x, sp.y);
      var rig = c.graph.add('null', c.cut.id + ' / hzPairEyes ' + kk, c.parent, c.cut.start, c.cut.end, {
        position: scP, rotation: -tilt / DEG
      });
      var cmds = G.ellipse(-gap / 2, 0, r, r * 0.82).concat(G.ellipse(gap / 2, 0, r, r * 0.82));
      var sh = C.shape(c.graph, c.cut, c.cut.id + ' / hzPairEyes e' + kk, rig, cmds, { fill: sc.fg, alpha: 0.9 });
      C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), tr = env.ltb;
        var open = E.outCubic(cl((env.lt - t0) / 0.18)) * (1 - cl((env.pOut || 0) * (1.6 + kk * 0.5)));
        for (var b = 0; b < 4; b++) { var at = t0 + 0.7 + b * 1.25 + R.hash01(s, kk, b + 4) * 0.9, d = Math.abs(tr - at); if (d < 0.07) open *= d / 0.07; }
        var gx = rs(s, kk, Math.floor(tr * 0.7) + 6) * r * 0.8, gy = rs(s, kk, Math.floor(tr * 0.7) + 7) * r * 0.4;
        return { 'position.x': scP[0] + gx, 'position.y': scP[1] - gy, 'scale.y': Math.max(0.05, open) };
      });
      C.sample(c.graph, sh, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), tr = env.ltb;
        var open = E.outCubic(cl((env.lt - t0) / 0.18)) * (1 - cl((env.pOut || 0) * (1.6 + kk * 0.5)));
        for (var b = 0; b < 4; b++) { var at = t0 + 0.7 + b * 1.25 + R.hash01(s, kk, b + 4) * 0.9, d = Math.abs(tr - at); if (d < 0.07) open *= d / 0.07; }
        return { alpha: open > 0.02 ? 0.9 : 0 };
      });
    })(k);
  }
  return { count: n };
});

/* 9. hzPeeker */
reg('hzPeeker', 'src/11p_x2_horrorA.js', function (c) {
  var P = c.preset.params || {}, sc = c.sc, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh);
  var bb = H.decBB(c), s = H.p(P, 'seed', 1) | 0, dir = P.right ? -1 : 1;
  var r = u * (P.big ? 0.085 : 0.065), ex = P.right ? W : 0, y = Hh * (P.low ? 0.68 : 0.3) + rs(s, 1, 2) * Hh * 0.06;
  if ((P.right ? bb.x1 > W - r * 2.4 : bb.x0 < r * 2.4) && y > bb.y0 - r * 1.6 && y < bb.y1 + r * 1.6) {
    y = bb.cy > Hh / 2 ? Math.max(r * 1.2, bb.y0 - r * 2) : Math.min(Hh - r * 1.2, bb.y1 + r * 2);
  }
  var fc = darkBg(c) ? H.mixHex(sc.bg, sc.fg, 0.13) : H.mixHex(sc.bg, '#000000', 0.72);
  var rig = c.graph.add('null', c.cut.id + ' / hzPeeker rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, ex, y) });
  C.shape(c.graph, c.cut, c.cut.id + ' / hzPeeker body', rig, G.ellipse(-dir * r * 1.5, -r * 2.3, r * 1.7, r * 1.5), { fill: fc, alpha: 0.95 });
  C.shape(c.graph, c.cut, c.cut.id + ' / hzPeeker head', rig, G.ellipse(0, 0, r * 0.82, r), { fill: fc, alpha: 0.95, rotation: -(dir * 0.12) / DEG });
  var eyeId = C.shape(c.graph, c.cut, c.cut.id + ' / hzPeeker eye', rig, G.ellipse(dir * r * 0.38, r * 0.12, r * 0.075, r * 0.075), {
    fill: darkBg(c) ? sc.fg : sc.bg, alpha: 0.9
  });
  var leanAt = function (env) {
    var lean = E.inOutSine(cl((env.lt - 0.3) / 1.4));
    var fl = env.lt - (2.2 + R.hash01(s, 2, 1) * 1.5);
    if (fl > 0 && fl < 0.9) lean *= 0.25 + 0.75 * E.inOutSine(cl(Math.abs(fl - 0.3) / 0.6));
    return lean * (1 - E.outCubic(cl((env.pOut || 0) * 3)));
  };
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
    var env = R.env(c, f0), lean = leanAt(env);
    var cx = ex + dir * (-r * 1.1 + lean * r * 1.75), cy = y + Math.sin(env.ltb * 0.8) * r * 0.05;
    var scP = H.toScene(c, cx, cy);
    return { 'position.x': scP[0], 'position.y': scP[1], alpha: lean > 0.01 ? 0.95 : 0 };
  });
  C.sample(c.graph, eyeId, c.cut.start, c.cut.end, function (f0) {
    var env = R.env(c, f0), lean = leanAt(env);
    var blink = Math.abs(env.ltb - 1.9 - R.hash01(s, 3, 1)) < 0.07 ? 0.15 : 1;
    return { 'scale.y': blink, alpha: 0.9 * cl(lean * 1.4 - 0.4) };
  });
  return { x: ex, y: y };
});

/* 10. hzFootprints */
reg('hzFootprints', 'src/11p_x2_horrorA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh);
  var bb = H.decBB(c), s = H.p(P, 'seed', 1) | 0, below = Hh - bb.y1 > bb.y0;
  var sx = W * (P.right ? 0.95 : 0.05), sy = below ? Hh * 0.95 : Hh * 0.05;
  var tx = cl(bb.cx + rs(s, 1, 2) * u * 0.1, W * 0.2, W * 0.8), ty = below ? Math.min(Hh * 0.93, bb.y1 + u * 0.1) : Math.max(Hh * 0.07, bb.y0 - u * 0.1);
  var D = Math.hypot(tx - sx, ty - sy), ang = Math.atan2(ty - sy, tx - sx), st = u * 0.1, nSteps = Math.min(14, Math.max(3, Math.floor(D / st)));
  var col = dimC(c, 0.34), fl = u * 0.042, n0 = c.graph.layers.length;
  for (var i = 0; i < nSteps; i++) {
    (function (ii) {
      var t0 = 0.2 + ii * 0.24, f = (ii + 0.5) / nSteps, sd = ii % 2 ? 1 : -1;
      var px = mix(sx, tx, f) - Math.sin(ang) * sd * fl * 0.55, py = mix(sy, ty, f) + Math.cos(ang) * sd * fl * 0.55;
      var rot = -(ang + sd * 0.12 + rs(s, ii, 2) * 0.1) / DEG;
      var cmds = G.ellipse(fl * 0.2, 0, fl * 0.5, fl * 0.26).concat(G.ellipse(-fl * 0.48, 0, fl * 0.2, fl * 0.18));
      var scP = H.toScene(c, px, py);
      var sh = C.shape(c.graph, c.cut, c.cut.id + ' / hzFootprints ' + ii, c.parent, cmds, {
        fill: col, position: scP, rotation: rot, alpha: 0.7
      });
      C.sample(c.graph, sh, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), out = 1 - E.inCubic(env.pOut || 0), a = cl((env.lt - t0) / 0.1);
        if (a <= 0) return { alpha: 0 };
        var age = Math.max(0, env.lt - t0);
        return { alpha: a * out * (0.32 + 0.5 * Math.exp(-age * 0.5)) };
      });
    })(i);
  }
  H.placeBackFrom(c, n0);
  return { count: nSteps };
});

/* 11. hzStrayGlyph */
reg('hzStrayGlyph', 'src/11p_x2_horrorA.js', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = Math.min(c.comp.width, c.comp.height);
  var bb = H.decBB(c), s = H.p(P, 'seed', 1) | 0;
  var gl = Array.from(cutText(c)).filter(function (ch) { return !/[\s\u3000.,!?。、！？「」『』()（）[\]【】…—\-]/.test(ch); });
  if (!gl.length) return { empty: true };
  var n = Math.min(2, 1 + ((H.p(P, 'n', 1) | 0) >> 1));
  for (var k = 0; k < n; k++) {
    (function (kk) {
      var sp = farSpot(c, bb, s, kk + 5, 0.1, 0.13), size = u * (P.big ? 0.15 : 0.11) * (1 - kk * 0.2);
      if (sp.d < size * 0.9) return;
      var ch = gl[R.hash(s, kk, 4) % gl.length], rot = rs(s, kk, 6) * 14 + (kk ? 180 : 0), t0 = 0.5 + kk * 0.7;
      var scP = H.toScene(c, sp.x, sp.y);
      var id = H.addText(c, 'hzStrayGlyph ' + kk, ch, sp.x, sp.y, size, {
        role: 'serif', color: sc.sub || sc.fg, rotation: rot, alpha: 0.5
      });
      if (!id) return;
      c.graph.byId[id].attrs['scale.x'] = -1;
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), st = Math.floor(env.lt * 12);
        var a = cl((env.lt - t0) / 0.08) * (1 - cl((env.pOut || 0) * 2.5));
        if (env.lt - t0 < 0.5 && R.hash01(s, kk, st, 1) < 0.45) a *= 0.2;
        if (R.hash01(s, kk, st >> 1, 2) < 0.07) a *= 0.3;
        var tw = R.hash01(s, kk, st >> 2, 3) < 0.18;
        return { 'position.x': scP[0] + (tw ? rs(s, kk, st, 5) * size * 0.08 : 0), alpha: 0.5 * a };
      });
    })(k);
  }
  return { count: n };
});

/* 12. hzFingers */
reg('hzFingers', 'src/11p_x2_horrorA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh);
  var bb = H.decBB(c), s = H.p(P, 'seed', 1) | 0, ox = P.right ? W : 0, oy = P.low ? Hh : 0;
  var base = Math.atan2(bb.cy - oy, bb.cx - ox);
  var col = darkBg(c) ? H.mixHex(c.sc.bg, c.sc.fg, 0.15) : H.mixHex(c.sc.bg, '#000000', 0.7);
  var nF = 4 + (P.big ? 1 : 0), reach = Math.max(u * 0.12, distBB(bb, ox, oy) - u * 0.05);
  var scO = H.toScene(c, ox, oy);
  for (var k = 0; k < nF; k++) {
    (function (kk) {
      var an0 = base + (kk - (nF - 1) / 2) * 0.2 + rs(s, kk, 2) * 0.05;
      var Lf = Math.min(reach, u * rr(0.3, 0.6, s, kk, 3)) * rr(0.72, 1, s, kk, 4), w0 = u * rr(0.026, 0.04, s, kk, 5);
      var dur = 1.5 + R.hash01(s, kk, 1) * 1.5;
      var rig = c.graph.add('null', c.cut.id + ' / hzFingers r' + kk, c.parent, c.cut.start, c.cut.end, { position: scO });
      var m = 12, Lp = [], Rp = [], x = 0, y = 0, an = an0;
      for (var i = 0; i <= m; i++) {
        var f = i / m, w = w0 * (1 - f * 0.8) * (i === m ? 0.25 : 1) * (1 + 0.18 * Math.sin(f * 9.4));
        Lp.push([x - Math.sin(an) * w, -(y + Math.cos(an) * w)]);
        Rp.push([x + Math.sin(an) * w, -(y - Math.cos(an) * w)]);
        an = an0 + noise1(f * 2.2, s + kk * 7) * 0.45 * f;
        x += Math.cos(an) * Lf / m; y += Math.sin(an) * Lf / m;
        if (H.hitBB(ox + x, oy + y, ox + x, oy + y, bb, u * 0.03)) { Lp.push([x, -y]); break; }
      }
      var all = Lp.concat(Rp.reverse());
      var sh = C.shape(c.graph, c.cut, c.cut.id + ' / hzFingers f' + kk, rig, all.map(function (p, idx) { return [idx ? 'L' : 'M', p[0], p[1]]; }).concat([['Z']]), {
        fill: col, alpha: 0.92
      });
      C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), grow = E.outCubic(cl((env.lt - 0.1 - kk * 0.12) / dur)) * (1 - E.inCubic(cl((env.pOut || 0) * 1.4)));
        return { 'scale.x': Math.max(0.01, grow), 'scale.y': Math.max(0.01, grow), rotation: Math.sin(env.ltb * 0.5 + kk) * 1.8 };
      });
      C.sample(c.graph, sh, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), grow = E.outCubic(cl((env.lt - 0.1 - kk * 0.12) / dur)) * (1 - E.inCubic(cl((env.pOut || 0) * 1.4)));
        return { alpha: grow > 0.01 ? 0.92 : 0 };
      });
    })(k);
  }
  return { nF: nF };
});

/* 13. hzHandprints */
reg('hzHandprints', 'src/11p_x2_horrorA.js', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = Math.min(c.comp.width, c.comp.height);
  var bb = H.decBB(c), s = H.p(P, 'seed', 1) | 0, n = Math.min(5, 2 + (H.p(P, 'n', 1) | 0));
  var col = darkBg(c) ? H.mixHex(sc.bg, sc.fg, 0.42) : H.mixHex(sc.bg, sc.fg, 0.3);
  for (var k = 0; k < n; k++) {
    (function (kk) {
      var sp = farSpot(c, bb, s, kk + 11, 0.09, 0.12), R0 = u * (P.big ? 0.07 : 0.055) * rr(0.85, 1.15, s, kk, 1);
      if (sp.d < R0 * 2.6) return;
      var t0 = 0.25 + kk * 0.5 + R.hash01(s, kk, 2) * 0.3, rot = -rs(s, kk, 3) * 0.6 / DEG, flip = R.hash01(s, kk, 4) < 0.5 ? -1 : 1;
      var rig = c.graph.add('null', c.cut.id + ' / hzHandprints ' + kk, c.parent, c.cut.start, c.cut.end, {
        position: H.toScene(c, sp.x, sp.y), rotation: rot
      });
      var cmds = G.ellipse(0, -R0 * 0.25, R0 * 0.62, R0 * 0.7);
      for (var f = 0; f < 4; f++) {
        var fa = -0.42 + f * 0.28, len = R0 * [0.95, 1.12, 1.05, 0.82][f], cyF = -R0 * 0.55 - len * 0.5;
        var ptsF = H.arcPts(0, 0, 1, 0, 360, 14).map(function (pt) {
          var ex = pt[0] * R0 * 0.14, ey = cyF + pt[1] * len * 0.5;
          var rx = ex * Math.cos(fa) - ey * Math.sin(fa), ry = ex * Math.sin(fa) + ey * Math.cos(fa);
          return [rx, -ry];
        });
        ptsF.forEach(function (p, idx) { cmds.push([idx ? 'L' : 'M', p[0], p[1]]); });
        cmds.push(['Z']);
      }
      var thumbPts = H.arcPts(0, 0, 1, 0, 360, 12).map(function (pt) {
        var ex = pt[0] * R0 * 0.15, ey = -R0 * 0.8 + pt[1] * R0 * 0.42, ta = -1.15;
        return [ex * Math.cos(ta) - ey * Math.sin(ta), -(ex * Math.sin(ta) + ey * Math.cos(ta))];
      });
      thumbPts.forEach(function (p, idx) { cmds.push([idx ? 'L' : 'M', p[0], p[1]]); });
      cmds.push(['Z']);
      var handSh = C.shape(c.graph, c.cut, c.cut.id + ' / hzHandprints h' + kk, rig, cmds, { fill: col, alpha: 0.35 });
      C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), pr = cl((env.lt - t0) / 0.12), sc0 = 0.93 + 0.07 * E.outCubic(pr);
        return { 'scale.x': flip * sc0, 'scale.y': sc0 };
      });
      C.sample(c.graph, handSh, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), out = 1 - E.inCubic(env.pOut || 0), pr = cl((env.lt - t0) / 0.12), age = Math.max(0, env.lt - t0);
        return { alpha: pr <= 0 ? 0 : out * pr * (0.2 + 0.2 * Math.exp(-age * 0.6)) };
      });
      for (var d = 0; d < 3; d++) {
        (function (dd) {
          var dx = sp.x + (dd - 1) * R0 * 0.42 + rs(s, kk * 5 + dd, 5) * R0 * 0.1, Ld = R0 * rr(0.8, 2.2, s, kk * 5 + dd, 6);
          if (Ld <= 2 || H.hitBB(dx, sp.y + R0 * 0.9, dx, sp.y + R0 * 0.9 + Ld, bb, u * 0.02)) return;
          var drig = c.graph.add('null', c.cut.id + ' / hzHandprints drig ' + kk + '_' + dd, c.parent, c.cut.start, c.cut.end, {
            position: H.toScene(c, dx, sp.y + R0 * 0.9)
          });
          var dsh = C.shape(c.graph, c.cut, c.cut.id + ' / hzHandprints d' + kk + '_' + dd, drig, [['M', 0, 0], ['L', 0, -Ld]], {
            stroke: col, width: Math.max(1.2, R0 * 0.07), alpha: 0.3
          });
          C.sample(c.graph, dsh, c.cut.start, c.cut.end, function (f0) {
            var env = R.env(c, f0), out = 1 - E.inCubic(env.pOut || 0), pr = cl((env.lt - t0) / 0.12), age = Math.max(0, env.lt - t0);
            var a = pr <= 0 ? 0 : out * pr * (0.2 + 0.2 * Math.exp(-age * 0.6));
            return { 'scale.y': Math.max(0.01, E.outCubic(cl(age / 4))), alpha: a * 0.8 };
          });
        })(d);
      }
    })(k);
  }
  return { count: n };
});

/* 14. hzBareBulb */
reg('hzBareBulb', 'src/11p_x2_horrorA.js', function (c) {
  var P = c.preset.params || {}, sc = c.sc, W = c.comp.width, u = Math.min(W, c.comp.height);
  var bb = H.decBB(c), s = H.p(P, 'seed', 1) | 0;
  var x = W * (P.right ? 0.84 : 0.16) + rs(s, 1, 2) * W * 0.04, Lc = u * (P.big ? 0.2 : 0.14);
  if (bb.y0 < Lc + u * 0.12 && x > bb.x0 - u * 0.1 && x < bb.x1 + u * 0.1) {
    var nx = P.right ? bb.x1 + u * 0.12 : bb.x0 - u * 0.12;
    if (nx > u * 0.06 && nx < W - u * 0.06) x = nx; else Lc = Math.max(u * 0.02, bb.y0 - u * 0.11);
  }
  var r = u * 0.018, col = dimC(c, 0.5), Lg = glowC(c), lw = Math.max(1.2, u * 0.0022), mk = 0.4 + 0.6 * H.motionAmt(c);
  var ph = R.hash01(s, 2, 1) * 6;
  var rig = c.graph.add('null', c.cut.id + ' / hzBareBulb rig', c.parent, c.cut.start, c.cut.end, {
    position: H.toScene(c, x, -2)
  });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
    var env = R.env(c, f0), g = E.outCubic(cl(env.lt / 0.5)) * (1 - E.inCubic(cl((env.pOut || 0) * 1.2 - 0.2)));
    var ang = Math.sin(env.ltb * 1.9 + ph) * (5 + 8 * Math.exp(-Math.max(0, env.ltb) * 0.35)) * mk;
    return { rotation: ang, 'scale.y': Math.max(0.01, g) };
  });
  C.shape(c.graph, c.cut, c.cut.id + ' / hzBareBulb cord', rig, [['M', 0, 0], ['L', 0, -Lc]], { stroke: col, width: lw });
  C.shape(c.graph, c.cut, c.cut.id + ' / hzBareBulb sock', rig, [['M', 0, -(Lc - r * 1.5)], ['L', 0, -Lc]], { stroke: col, width: r * 0.8 });
  var cy = -(Lc + r * 0.9);
  var halo = C.shape(c.graph, c.cut, c.cut.id + ' / hzBareBulb halo', rig, G.ellipse(0, cy, u * 0.11, u * 0.11), { fill: Lg, alpha: 0.2 });
  C.shape(c.graph, c.cut, c.cut.id + ' / hzBareBulb glass', rig, G.ellipse(0, cy, r, r), { fill: Lg, stroke: col, width: Math.max(1, u * 0.002) });
  var dimOverlay = C.shape(c.graph, c.cut, c.cut.id + ' / hzBareBulb dim', rig, G.ellipse(0, cy, r * 0.93, r * 0.93), { fill: sc.bg, alpha: 0.4 });
  function lvAt(env, f0) {
    var st = Math.floor(env.lt * 24);
    var lv = env.lt < 0.75 ? (env.lt > 0.3 && R.hash01(s, st, 3) < 0.55 ? 1 : 0.08) : lamp(f0 / c.comp.fps, s, 1.3);
    if (env.pOut > 0) lv *= (R.hash01(s, st, 4) < 0.5 ? 0.15 : 1) * (1 - cl(env.pOut * 2));
    return lv;
  }
  C.sample(c.graph, halo, c.cut.start, c.cut.end, function (f0) { return { alpha: 0.24 * lvAt(R.env(c, f0), f0) }; });
  C.sample(c.graph, dimOverlay, c.cut.start, c.cut.end, function (f0) { return { alpha: cl(1 - lvAt(R.env(c, f0), f0)) * 0.85 }; });
  return { x: x, L: Lc };
});

/* 15. hzDoorAjar */
reg('hzDoorAjar', 'src/11p_x2_horrorA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh);
  var bb = H.decBB(c), s = H.p(P, 'seed', 1) | 0, dw = u * (P.big ? 0.12 : 0.095), dh = dw * 2.15, right = !!P.right;
  var gy = Hh - u * 0.05, xOf = function (r) { return r ? W - u * 0.06 - dw : u * 0.06; };
  if (H.hitBB(xOf(right), gy - dh, xOf(right) + dw, gy, bb, u * 0.03)) {
    right = !right;
    if (H.hitBB(xOf(right), gy - dh, xOf(right) + dw, gy, bb, u * 0.03)) {
      var k = cl((gy - bb.y1 - u * 0.04) / dh, 0, 1); if (k < 0.35) return { skipped: true };
      dw *= k; dh *= k;
    }
  }
  var x = xOf(right), y = gy - dh, col = dimC(c, 0.4), lw = Math.max(1.2, u * 0.0024), Lg = glowC(c);
  var frId = H.poly(c, 'hzDoorAjar frame', [[x, gy], [x, y], [x + dw, y], [x + dw, gy]], false, { stroke: col, width: lw });
  var flId = H.line(c, 'hzDoorAjar floor', [[x - dw * 0.5, gy], [x + dw * 1.5, gy]], col, lw, 0.6);
  var hinge = right ? x + dw : x, dir = right ? -1 : 1, dDelay = R.hash01(s, 1, 2);
  var opAt = function (env) {
    return (0.07 * E.outCubic(cl((env.lt - 0.5) / 0.5)) + 0.24 * E.inOutSine(cl((env.lt - 1.5 - dDelay) / 1.8))) * (1 - E.outExpo(cl((env.pOut || 0) * 2.5)));
  };
  var slitRig = c.graph.add('null', c.cut.id + ' / hzDoorAjar slit rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, hinge, y + lw) });
  C.shape(c.graph, c.cut, c.cut.id + ' / hzDoorAjar slit', slitRig, G.rect(dir > 0 ? 0 : -dw, -(dh - lw), dw, dh - lw), { fill: Lg, alpha: 0.85 });
  C.sample(c.graph, slitRig, c.cut.start, c.cut.end, function (f0) {
    var env = R.env(c, f0), op = opAt(env), st = Math.floor(env.lt * 12), lv = 0.85 + 0.15 * R.hash01(s, st, 2);
    return { 'scale.x': Math.max(0.005, op), alpha: op > 0.003 ? 0.85 * lv : 0 };
  });
  var spill = C.shape(c.graph, c.cut, c.cut.id + ' / hzDoorAjar spill', c.parent, [], { fill: Lg, alpha: 0.14 });
  spill.commands = H.polyCmds(c, [[[hinge, gy], [hinge + dir * dw * 0.3, gy], [hinge + dir * (dw * 0.72 + dw * 0.5), gy + u * 0.045], [hinge + dir * dw * 0.2, gy + u * 0.045]]], true);
  var knob = H.circle(c, 'hzDoorAjar knob', hinge + dir * (dw * 0.2), y + dh * 0.55, Math.max(1.5, dw * 0.035), Math.max(1.5, dw * 0.035), { fill: col });
  [frId, flId, spill, knob].forEach(function (id, idx) {
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
      var env = R.env(c, f0), out = 1 - E.inCubic(env.pOut || 0), e = E.outCubic(cl(env.lt / 0.5));
      if (idx === 0) return { alpha: out * e };
      if (idx === 1) return { alpha: 0.6 * e * out };
      if (idx === 2) { var op = opAt(env); return { alpha: op > 0.003 ? 0.14 * out : 0 }; }
      return { alpha: opAt(env) > 0.003 ? out : 0 };
    });
  });
  return { x: x, y: y };
});

/* 16. hzCobweb */
reg('hzCobweb', 'src/11p_x2_horrorA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh);
  var bb = H.decBB(c), s = H.p(P, 'seed', 1) | 0, right = !!P.right, low = bb.y0 < u * 0.2 && bb.y1 < Hh - u * 0.2;
  var ox = right ? W : 0, oy = low ? Hh : 0, dx = right ? -1 : 1, dy = low ? -1 : 1;
  var R0 = Math.min(u * (P.big ? 0.36 : 0.27), Math.max(u * 0.1, distBB(bb, ox, oy) - u * 0.03));
  var col = dimC(c, 0.42), lw = Math.max(1, u * 0.0016), nR = 6, ends = [];
  for (var i = 0; i < nR; i++) {
    var an = (i / (nR - 1)) * Math.PI / 2 + (i > 0 && i < nR - 1 ? rs(s, i, 1) * 0.07 : 0);
    var len = R0 * (i === 0 || i === nR - 1 ? 1.12 : rr(0.8, 1.05, s, i, 2));
    ends.push([Math.cos(an) * dx, Math.sin(an) * dy, len]);
    (function (ii, e0) {
      var lId = H.line(c, 'hzCobweb rad ' + ii, [[ox, oy], [ox + e0[0] * e0[2], oy + e0[1] * e0[2]]], col, lw, 1);
      C.sample(c.graph, lId, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), out = 1 - E.inCubic(env.pOut || 0);
        return { alpha: out * E.outCubic(cl((env.lt - ii * 0.05) / 0.45)) };
      });
    })(i, ends[i]);
  }
  for (var q = 0; q < 5; q++) {
    (function (qq) {
      var f = 0.24 + 0.17 * qq, pts = [];
      for (var i = 0; i < nR; i++) {
        var a = ends[i], r1 = Math.min(a[2], R0 * f * (1 + rs(s, qq, i + 3) * 0.05));
        pts.push([ox + a[0] * r1, oy + a[1] * r1]);
        if (i < nR - 1) {
          var b = ends[i + 1], r2 = Math.min(b[2], R0 * f), mx = (a[0] * r1 + b[0] * r2) / 2, my = (a[1] * r1 + b[1] * r2) / 2;
          pts.push([ox + mx * 0.9, oy + my * 0.9]);
        }
      }
      var rId = H.line(c, 'hzCobweb ring ' + qq, pts, col, lw, 0.85);
      C.sample(c.graph, rId, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), out = 1 - E.inCubic(env.pOut || 0);
        return { alpha: out * 0.85 * cl((env.lt - 0.4 - qq * 0.22) / 0.5) };
      });
    })(q);
  }
  if (!low) {
    var e2 = ends[2], hx = ox + e2[0] * e2[2] * 0.7, hy = oy + e2[1] * e2[2] * 0.7, tl = u * 0.16;
    if (!H.hitBB(hx, hy, hx, hy + tl, bb, u * 0.03)) {
      var drig = c.graph.add('null', c.cut.id + ' / hzCobweb drop rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, hx, hy) });
      var dline = C.shape(c.graph, c.cut, c.cut.id + ' / hzCobweb drop line', drig, [['M', 0, 0], ['L', 0, -tl]], { stroke: col, width: lw });
      var ddot = C.shape(c.graph, c.cut, c.cut.id + ' / hzCobweb spider', drig, G.ellipse(0, 0, u * 0.005, u * 0.005), { fill: col });
      C.sample(c.graph, dline, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), out = 1 - E.inCubic(env.pOut || 0), k = E.inOutSine(cl((env.lt - 1.4) / 2.6)) * out;
        return { 'scale.y': Math.max(0.01, k), alpha: out };
      });
      C.sample(c.graph, ddot, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), out = 1 - E.inCubic(env.pOut || 0), k = E.inOutSine(cl((env.lt - 1.4) / 2.6)) * out;
        return { 'position.x': Math.sin(env.ltb * 1.4) * u * 0.004, 'position.y': -tl * k, alpha: k > 0.02 ? out : 0 };
      });
    }
  }
  return { ox: ox, oy: oy };
});

/* 17. hzFilmDirt */
reg('hzFilmDirt', 'src/11p_x2_horrorA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh);
  var bb = H.decBB(c), s = H.p(P, 'seed', 1) | 0, col = c.sc.fg, lw = Math.max(1, u * 0.0014), pd = u * 0.02;
  var nScr = 2 + cl(H.p(P, 'n', 1) | 0, 1, 3);
  for (var i = 0; i < nScr; i++) {
    (function (ii) {
      var x = W * (0.1 + 0.8 * R.hash01(s, ii, 2)), y0 = Hh * R.hash01(s, ii, 5) * 0.3, y1 = Hh * (0.7 + 0.3 * R.hash01(s, ii, 6));
      var segs = [];
      if (x > bb.x0 - pd && x < bb.x1 + pd) {
        if (bb.y0 - pd > y0) segs.push([x, y0, x, bb.y0 - pd]);
        if (y1 > bb.y1 + pd) segs.push([x, bb.y1 + pd, x, y1]);
      } else segs.push([x, y0, x, y1]);
      if (!segs.length) return;
      var sh = C.shape(c.graph, c.cut, c.cut.id + ' / hzFilmDirt scr ' + ii, c.parent, H.segCmds(c, segs), { stroke: col, width: lw, alpha: 0.3 });
      C.sample(c.graph, sh, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), st = Math.floor(env.lt * 12), run = (st + ii * 5) >> 3;
        var k = E.outCubic(cl(env.lt / 0.3)) * (1 - E.inCubic(env.pOut || 0));
        var on = R.hash01(s, ii, run + 1) >= 0.35 ? 1 : 0;
        return { 'position.x': rs(s, ii, st + 3) * u * 0.003, alpha: on * 0.3 * k * (0.5 + 0.5 * R.hash01(s, ii, st + 4)) };
      });
    })(i);
  }
  var nDust = 6 + (H.p(P, 'n', 1) | 0) * 3;
  for (var j = 0; j < nDust; j++) {
    (function (jj) {
      var x = W * R.hash01(s, jj, 7), y = Hh * R.hash01(s, jj, 8);
      if (H.hitBB(x, y, x, y, bb, u * 0.035)) return;
      var r = u * rr(0.0015, 0.006, s, jj, 9), sh;
      if (jj % 3 === 0) {
        var an = R.hash01(s, jj, 10) * TAU, l = r * 5;
        sh = H.line(c, 'hzFilmDirt hair ' + jj, [[x, y], [x + Math.cos(an) * l, y + Math.sin(an) * l], [x + Math.cos(an + 0.7) * l * 1.6, y + Math.sin(an + 0.7) * l * 1.6]], col, lw, 0.55);
      } else {
        sh = H.circle(c, 'hzFilmDirt speck ' + jj, x, y, r, r, { fill: col, alpha: 0.55 });
      }
      if (sh) {
        C.sample(c.graph, sh, c.cut.start, c.cut.end, function (f0) {
          var env = R.env(c, f0), st = Math.floor(env.lt * 12), k = E.outCubic(cl(env.lt / 0.3)) * (1 - E.inCubic(env.pOut || 0));
          var blink = R.hash01(s, jj, st >> 1, 12) < 0.4 ? 1 : 0;
          return { alpha: 0.55 * k * blink };
        });
      }
    })(j);
  }
  return { count: nScr + nDust };
});

/* ==================== KINETIC (2 kn* + 10 kz*) ==================== */

/* 18. knSpeedTrail */
reg('knSpeedTrail', 'src/11p_kinetic3.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh);
  var bb = H.decBB(c), vert = bb.h > bb.w * 1.3, s = H.p(P, 'seed', 1) | 0;
  var roomA = vert ? bb.y0 : bb.x0, roomB = vert ? Hh - bb.y1 : W - bb.x1;
  var side = Math.abs(roomA - roomB) < u * 0.05 ? (P.right ? 1 : -1) : (roomB > roomA ? 1 : -1);
  var N = 8 + (H.p(P, 'n', 1) | 0) * 3, col = H.subCol(c.sc, c.sc.bg);
  var span = vert ? bb.w : bb.h, len = vert ? bb.h : bb.w, tight = Math.max(roomA, roomB) < u * 0.14;
  for (var i = 0; i < N; i++) {
    (function (ii) {
      var f = (ii + 0.5) / N, lw = Math.max(1.5, u * (0.003 + R.hash01(s, ii, 1) * 0.006));
      var L = u * (0.18 + R.hash01(s, ii, 2) * 0.3), st = tight ? len * (0.2 + R.hash01(s, ii, 3) * 0.3) : -u * (0.015 + 0.02 * R.hash01(s, ii, 3));
      var cc = tight ? (ii % 2 ? (vert ? bb.x1 : bb.y1) + span * (0.05 + 0.3 * f) : (vert ? bb.x0 : bb.y0) - span * (0.05 + 0.3 * f))
        : mix(vert ? bb.x0 : bb.y0, vert ? bb.x1 : bb.y1, 0.08 + 0.84 * f) + (R.hash01(s, ii, 7) - 0.5) * span * 0.04;
      var e0 = side < 0 ? (vert ? bb.y0 : bb.x0) : (vert ? bb.y1 : bb.x1);
      var scO = vert ? H.toScene(c, cc, e0) : H.toScene(c, e0, cc);
      var rig = c.graph.add('null', c.cut.id + ' / knSpeedTrail ' + ii, c.parent, c.cut.start, c.cut.end, { position: scO });
      var pts = vert ? [[0, 0], [0, -side * L]] : [[0, 0], [side * L, 0]];
      var sh = C.shape(c.graph, c.cut, c.cut.id + ' / knSpeedTrail s' + ii, rig, [['M', pts[0][0], pts[0][1]], ['L', pts[1][0], pts[1][1]]], {
        stroke: col, width: lw, alpha: 0.6
      });
      var spd = 1.3 + R.hash01(s, ii, 4) * 1.5, ph0 = R.hash01(s, ii, 5), aBase = 0.35 + 0.35 * R.hash01(s, ii, 6);
      C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), o = E.outCubic(cl(env.lt / 0.3)) * (1 - E.inCubic(env.pOut || 0));
        var ph = (env.ltb * spd + ph0) % 1, s0 = st * -1 + ph * L * o * 0.6, scLen = o * (0.35 + 0.65 * (1 - ph));
        return vert ? { 'position.y': scO[1] - side * s0, 'scale.y': Math.max(0.01, scLen) } : { 'position.x': scO[0] + side * s0, 'scale.x': Math.max(0.01, scLen) };
      });
      C.sample(c.graph, sh, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), o = E.outCubic(cl(env.lt / 0.3)) * (1 - E.inCubic(env.pOut || 0));
        var ph = (env.ltb * spd + ph0) % 1;
        return { alpha: aBase * o * (1 - ph * 0.5) };
      });
    })(i);
  }
  return { count: N };
});

/* 19. knWordTicks */
reg('knWordTicks', 'src/11p_kinetic3.js', function (c) {
  var sc = c.sc, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh), bb = H.decBB(c);
  var ts = wordTimes(c, 8), n = ts.length;
  var segW = u * 0.06, segH = Math.max(4, u * 0.011), g = u * 0.014, tot = n * segW + (n - 1) * g;
  var below = bb.y1 + u * 0.08 < Hh * 0.93, y = below ? bb.y1 + u * 0.06 : bb.y0 - u * 0.06;
  var cx = cl(bb.cx, tot / 2 + W * 0.06, W * 0.94 - tot / 2), x0 = cx - tot / 2, ac = acc(c);
  for (var i = 0; i < n; i++) {
    (function (ii) {
      var x = x0 + ii * (segW + g);
      var bgId = H.rect(c, 'knWordTicks bg ' + ii, x, y - segH / 2, segW, segH, { fill: sc.sub, alpha: 0.35 });
      C.sample(c.graph, bgId, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), o = E.outCubic(cl(env.lt / 0.35)) * (1 - E.inCubic(env.pOut || 0));
        return { alpha: 0.35 * o };
      });
      var rig = c.graph.add('null', c.cut.id + ' / knWordTicks fg rig ' + ii, c.parent, c.cut.start, c.cut.end, {
        position: H.toScene(c, x, y - segH / 2)
      });
      var fId = C.shape(c.graph, c.cut, c.cut.id + ' / knWordTicks fg ' + ii, rig, G.rect(0, -segH, segW, segH), { fill: ac, alpha: 1 });
      C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), k = curIdx(ts, env.lt), on = ii <= k;
        var f = on ? E.outExpo(cl((env.lt - ts[ii]) / 0.18)) : 0;
        var scY = ii === k && f > 0 ? 1 + 1.2 * (1 - f) : 1;
        return { 'scale.x': Math.max(0.01, f), 'scale.y': scY };
      });
      C.sample(c.graph, fId, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), o = E.outCubic(cl(env.lt / 0.35)) * (1 - E.inCubic(env.pOut || 0)), k = curIdx(ts, env.lt);
        return { alpha: ii <= k && env.lt >= ts[ii] ? o : 0 };
      });
    })(i);
  }
  var fs = cl(u * 0.028, 14, 32);
  H.stepText(c, 'knWordTicks cnt', x0 + tot + u * 0.02, y, fs, {
    role: 'mono', align: 'left', color: sc.sub,
    animFn: function (env) {
      return { alpha: E.outCubic(cl(env.lt / 0.35)) * (1 - E.inCubic(env.pOut || 0)) };
    }
  }, function (env) {
    var k = curIdx(ts, env.lt);
    return pad2(k + 1) + ' / ' + pad2(n);
  }, n + 2);
  return { count: n };
});

/* 20. kzImpactTicks */
reg('kzImpactTicks', 'src/11p_x2_kineticA.js', function (c) {
  var P = c.preset.params || {}, u = Math.min(c.comp.width, c.comp.height), bb = H.decBB(c);
  var ts = wordTimes(c), n = ts.length, A = axisOf(c, bb, P.low ? -1 : 1), col = acc(c), N0 = 5 + (H.p(P, 'n', 1) | 0);
  var lw = Math.max(2, u * 0.0065), s = H.p(P, 'seed', 1) | 0, base = Math.atan2(A.nrm[1], A.nrm[0]) / DEG;
  for (var j = 0; j < n; j++) {
    (function (jj) {
      var pt = A.at((jj + 0.5) / n, u * 0.02), scP = H.toScene(c, pt[0], pt[1]);
      var bar = C.shape(c.graph, c.cut, c.cut.id + ' / kzImpactTicks b' + jj, c.parent, [
        ['M', -A.dirv[0] * u * 0.07, A.dirv[1] * u * 0.07], ['L', A.dirv[0] * u * 0.07, -A.dirv[1] * u * 0.07]
      ], { stroke: col, width: lw, position: scP, alpha: 0 });
      C.sample(c.graph, bar, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), tau = env.lt - ts[jj] - 0.04, o = H.io(c, f0, 0.1);
        if (tau < 0 || tau > 0.5) return { alpha: 0 };
        var q = tau / 0.5, e = E.outExpo(q);
        return { 'scale.x': Math.max(0.01, e), 'scale.y': Math.max(0.01, e), alpha: (1 - q) * o };
      });
      for (var m = 0; m < N0; m++) {
        (function (mm) {
          var a = (base + mix(-72, 72, (mm + 0.5) / N0) + rs(s, jj, mm) * 7) * DEG;
          var rMax = u * (0.065 + 0.04 * R.hash01(s, mm, jj + 2)), len = u * 0.05 * (0.6 + 0.6 * R.hash01(s, mm, jj + 3));
          var tk = C.shape(c.graph, c.cut, c.cut.id + ' / kzImpactTicks t' + jj + '_' + mm, c.parent, [
            ['M', 0, 0], ['L', Math.cos(a) * len, -Math.sin(a) * len]
          ], { stroke: col, width: lw, position: scP, alpha: 0 });
          C.sample(c.graph, tk, c.cut.start, c.cut.end, function (f0) {
            var env = R.env(c, f0), tau = env.lt - ts[jj] - 0.04, o = H.io(c, f0, 0.1);
            if (tau < 0 || tau > 0.5) return { alpha: 0 };
            var q = tau / 0.5, e = E.outExpo(q), r0 = u * 0.016 + rMax * e;
            return { 'position.x': scP[0] + Math.cos(a) * r0, 'position.y': scP[1] - Math.sin(a) * r0, 'scale.x': Math.max(0.05, 1 - q), 'scale.y': Math.max(0.05, 1 - q), alpha: (1 - q * q) * o };
          });
        })(m);
      }
    })(j);
  }
  return { count: n };
});

/* 21. kzBounceDot */
reg('kzBounceDot', 'src/11p_x2_kineticA.js', function (c) {
  var P = c.preset.params || {}, u = Math.min(c.comp.width, c.comp.height), bb = H.decBB(c);
  var ts = wordTimes(c), n = ts.length, A = axisOf(c, bb, P.low ? 1 : -1), col = acc(c), sb = sub(c);
  var r = u * 0.019, gap = u * 0.024, hopH = Math.min(u * 0.075, Math.max(u * 0.02, A.room - gap - r * 3));
  for (var j = 0; j < n; j++) {
    (function (jj) {
      var pt = A.at((jj + 0.5) / n, gap * 0.45), scP = H.toScene(c, pt[0], pt[1]), hw = u * 0.016;
      var mId = C.shape(c.graph, c.cut, c.cut.id + ' / kzBounceDot m' + jj, c.parent, [
        ['M', -A.dirv[0] * hw, A.dirv[1] * hw], ['L', A.dirv[0] * hw, -A.dirv[1] * hw]
      ], { stroke: jj === 0 ? col : sb, width: Math.max(2, u * 0.004), position: scP, alpha: 0 });
      C.sample(c.graph, mId, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), o = H.io(c, f0, 0.15), tj = env.lt - ts[jj];
        if (tj < 0) return { alpha: 0 };
        var sc0 = Math.max(0.05, E.outBack(cl(tj / 0.2), 2.5));
        return { 'scale.x': sc0, 'scale.y': sc0, alpha: o * 0.85 };
      });
    })(j);
  }
  var dot = C.shape(c.graph, c.cut, c.cut.id + ' / kzBounceDot ball', c.parent, G.ellipse(0, 0, r, r), { fill: col, alpha: 1 });
  C.sample(c.graph, dot, c.cut.start, c.cut.end, function (f0) {
    var env = R.env(c, f0), lt = env.lt, o = H.io(c, f0, 0.15), k = 0;
    for (var j = 0; j < n; j++) if (lt >= ts[j] - Math.min(0.3, j ? (ts[j] - ts[j - 1]) * 0.8 : 0.3)) k = j;
    var hd = k ? Math.min(0.3, (ts[k] - ts[k - 1]) * 0.8) : 0.22, q = cl((lt - (ts[k] - hd)) / hd);
    var t0 = k ? (k - 0.5) / n : 0.5 / n, t1 = (k + 0.5) / n;
    var h = k ? hopH * 4 * q * (1 - q) : hopH * 2.4 * (1 - q) * (1 - q), tl = lt - ts[k];
    if (q >= 1 && k === n - 1) h = hopH * 0.45 * Math.abs(Math.sin(tl * 6.5)) * Math.exp(-tl * 1.3);
    var sq = q >= 1 ? 0.35 * Math.exp(-tl * 14) : 0, pt = A.at(mix(t0, t1, k ? q : 1), gap + r + h);
    var scP = H.toScene(c, pt[0] - A.nrm[0] * r * sq, pt[1] - A.nrm[1] * r * sq);
    return { 'position.x': scP[0], 'position.y': scP[1], 'scale.x': A.v ? 1 - sq : 1 + sq * 0.7, 'scale.y': A.v ? 1 + sq * 0.7 : 1 - sq, alpha: o };
  });
  return { count: n };
});

/* 22. kzUnderRun */
reg('kzUnderRun', 'src/11p_x2_kineticA.js', function (c) {
  var P = c.preset.params || {}, u = Math.min(c.comp.width, c.comp.height), bb = H.decBB(c);
  var ts = wordTimes(c), n = ts.length, A = axisOf(c, bb, P.low ? -1 : 1), col = acc(c), sb = sub(c);
  var d = u * 0.035, lw = Math.max(3, u * 0.007), ah = u * 0.018;
  var p0 = A.at(0, d), pe = A.at(1, d);
  var trk = H.line(c, 'kzUnderRun track', [p0, pe], sb, Math.max(1.5, u * 0.002), 0.45);
  var tickSegs = [];
  for (var j = 1; j < n; j++) {
    var tp = A.at(j / n, d);
    tickSegs.push([tp[0] - A.nrm[0] * ah * 0.4, tp[1] - A.nrm[1] * ah * 0.4, tp[0] + A.nrm[0] * ah * 0.4, tp[1] + A.nrm[1] * ah * 0.4]);
  }
  var tks = tickSegs.length ? C.shape(c.graph, c.cut, c.cut.id + ' / kzUnderRun ticks', c.parent, H.segCmds(c, tickSegs), { stroke: sb, width: Math.max(1.5, u * 0.002), alpha: 0.6 }) : null;
  var scP0 = H.toScene(c, p0[0], p0[1]), scPe = H.toScene(c, pe[0], pe[1]);
  var runRig = c.graph.add('null', c.cut.id + ' / kzUnderRun run rig', c.parent, c.cut.start, c.cut.end, { position: scP0 });
  var barId = C.shape(c.graph, c.cut, c.cut.id + ' / kzUnderRun bar', runRig, [['M', 0, 0], ['L', scPe[0] - scP0[0], scPe[1] - scP0[1]]], { stroke: col, width: lw });
  var tipPts = [
    [A.dirv[0] * ah * 1.3, -A.dirv[1] * ah * 1.3],
    [A.nrm[0] * ah * 0.8, -A.nrm[1] * ah * 0.8],
    [-A.nrm[0] * ah * 0.8, A.nrm[1] * ah * 0.8]
  ];
  var headId = C.shape(c.graph, c.cut, c.cut.id + ' / kzUnderRun head', c.parent, tipPts.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }).concat([['Z']]), {
    fill: col, position: scP0
  });
  function frac(env) {
    var k = Math.max(0, curIdx(ts, env.lt));
    return cl(mix(k / n, (k + 1) / n, spr(env.lt - ts[k], 9, 15)), 0, 1.03);
  }
  C.sample(c.graph, barId, c.cut.start, c.cut.end, function (f0) {
    var env = R.env(c, f0), f = Math.max(0.01, frac(env)), o = H.io(c, f0, 0.25);
    return A.v ? { 'scale.y': f, alpha: o } : { 'scale.x': f, alpha: o };
  });
  C.sample(c.graph, headId, c.cut.start, c.cut.end, function (f0) {
    var env = R.env(c, f0), p1 = A.at(frac(env), d), sc1 = H.toScene(c, p1[0], p1[1]);
    return { 'position.x': sc1[0], 'position.y': sc1[1], alpha: H.io(c, f0, 0.25) };
  });
  [trk, tks].forEach(function (id, idx) {
    if (id) C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) { return { alpha: (idx ? 0.6 : 0.45) * H.io(c, f0, 0.25) }; });
  });
  return { n: n };
});

/* 23. kzWobbleArcs */
reg('kzWobbleArcs', 'src/11p_x2_kineticA.js', function (c) {
  var P = c.preset.params || {}, sc = c.sc, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh);
  var bb = H.decBB(c), ts = wordTimes(c), col = P.accent ? acc(c) : sub(c), v = bb.h > bb.w * 1.3;
  var span = v ? bb.w : bb.h, R0 = Math.max(u * 0.13, span * 0.85), N0 = 2 + Math.min(2, H.p(P, 'n', 1) | 0);
  var s = H.p(P, 'seed', 1) | 0;
  for (var m = 0; m < N0; m++) {
    (function (mm) {
      var half = 30 - mm * 5, lw = Math.max(2.5, u * (0.009 - mm * 0.002));
      [-1, 1].forEach(function (sg) {
        var cx0 = v ? bb.cx : (sg < 0 ? bb.x0 - u * (0.034 + 0.036 * mm) - sg * R0 : bb.x1 + u * (0.034 + 0.036 * mm) - sg * R0);
        var cy0 = v ? (sg < 0 ? bb.y0 - u * (0.034 + 0.036 * mm) - sg * R0 : bb.y1 + u * (0.034 + 0.036 * mm) - sg * R0) : bb.cy;
        if (v ? (cy0 + sg * R0 < Hh * 0.02 || cy0 + sg * R0 > Hh * 0.98) : (cx0 + sg * R0 < W * 0.02 || cx0 + sg * R0 > W * 0.98)) return;
        var aMid = v ? 90 * sg : (sg < 0 ? 180 : 0);
        var pts = H.arcPts(0, 0, R0, aMid - half, aMid + half, 18).map(function (pt) { return [pt[0], -pt[1]]; });
        var scP = H.toScene(c, cx0, cy0);
        var sh = C.shape(c.graph, c.cut, c.cut.id + ' / kzWobbleArcs m' + mm + '_' + sg, c.parent, pts.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }), {
          stroke: col, width: lw, position: scP, alpha: 0.7
        });
        C.sample(c.graph, sh, c.cut.start, c.cut.end, function (f0) {
          var env = R.env(c, f0), o = H.io(c, f0, 0.2), k = Math.max(0, curIdx(ts, env.lt)), tau = env.lt - ts[k];
          var kick = Math.exp(-Math.max(0, tau - mm * 0.04) * 6) * (tau >= mm * 0.04 ? 1 : 0);
          var wob = rs(s, Math.floor(env.lt * 12), mm) * 2.5 * kick, off = sg * u * 0.04 * kick;
          return {
            'position.x': scP[0] + (v ? 0 : off), 'position.y': scP[1] - (v ? off : 0),
            rotation: -wob, alpha: (0.4 + 0.6 * kick) * o * (1 - mm * 0.18)
          };
        });
      });
    })(m);
  }
  return { layers: N0 };
});

/* 24. kzMarchFrame */
reg('kzMarchFrame', 'src/11p_x2_kineticA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh);
  var bb = H.decBB(c), ts = wordTimes(c), pad = u * 0.045;
  var x0 = Math.max(W * 0.025, bb.x0 - pad), y0 = Math.max(Hh * 0.025, bb.y0 - pad);
  var x1 = Math.min(W * 0.975, bb.x1 + pad), y1 = Math.min(Hh * 0.975, bb.y1 + pad);
  var bw = Math.max(20, x1 - x0), bh = Math.max(20, y1 - y0), dash = u * 0.022, per = dash * 2, L = 2 * (bw + bh);
  function pointOnRect(dist) {
    var d = wrap(dist, L);
    if (d < bw) return [x0 + d, y0];
    if (d < bw + bh) return [x1, y0 + (d - bw)];
    if (d < 2 * bw + bh) return [x1 - (d - bw - bh), y1];
    return [x0, y1 - (d - 2 * bw - bh)];
  }
  var nDashes = Math.min(36, Math.max(8, Math.floor(L / per))), sb = sub(c), ac = acc(c);
  for (var i = 0; i < nDashes; i++) {
    (function (ii) {
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / kzMarchFrame d' + ii, c.parent, [['M', -dash * 0.35, 0], ['L', dash * 0.35, 0]], {
        stroke: sb, width: Math.max(2, u * 0.004), alpha: 0.8
      });
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), o = H.io(c, f0, 0.3), ph = env.ltb * u * 0.02;
        for (var j = 0; j < ts.length; j++) if (env.ltb > ts[j]) ph += per * 2.5 * (1 - Math.exp(-(env.ltb - ts[j]) * 5));
        ph *= P.right ? -1 : 1;
        var pos = (ii / nDashes) * L + ph, pA = pointOnRect(pos), pB = pointOnRect(pos + dash * 0.7);
        var scM = H.toScene(c, (pA[0] + pB[0]) / 2, (pA[1] + pB[1]) / 2), ang = Math.atan2(pB[1] - pA[1], pB[0] - pA[0]) / DEG;
        return { 'position.x': scM[0], 'position.y': scM[1], rotation: -ang, alpha: 0.8 * o };
      });
    })(i);
  }
  var accentDash = C.shape(c.graph, c.cut, c.cut.id + ' / kzMarchFrame hero', c.parent, [['M', -dash * 1.4, 0], ['L', dash * 1.4, 0]], {
    stroke: ac, width: Math.max(3, u * 0.007), alpha: 1
  });
  C.sample(c.graph, accentDash, c.cut.start, c.cut.end, function (f0) {
    var env = R.env(c, f0), o = H.io(c, f0, 0.3), ph = env.ltb * u * 0.02;
    for (var j = 0; j < ts.length; j++) if (env.ltb > ts[j]) ph += per * 2.5 * (1 - Math.exp(-(env.ltb - ts[j]) * 5));
    ph *= P.right ? -1 : 1;
    var pA = pointOnRect(ph * 2), pB = pointOnRect(ph * 2 + dash * 2.8);
    var scM = H.toScene(c, (pA[0] + pB[0]) / 2, (pA[1] + pB[1]) / 2), ang = Math.atan2(pB[1] - pA[1], pB[0] - pA[0]) / DEG;
    return { 'position.x': scM[0], 'position.y': scM[1], rotation: -ang, alpha: o };
  });
  return { nDashes: nDashes };
});

/* 25. kzMetronome */
reg('kzMetronome', 'src/11p_x2_kineticA.js', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = Math.min(c.comp.width, c.comp.height);
  var bb = H.decBB(c), Lr = u * 0.18, sp = H.cornerSpot(c, bb, Lr * 1.5, Lr * 1.2, P, 1);
  if (!sp.ok) return { skipped: true };
  var ts = wordTimes(c), A0 = 30, sb = sub(c), col = acc(c), lw = Math.max(2.5, u * 0.006);
  var px = sp.cx, py = sp.cy + Lr * 0.5, rig = c.graph.add('null', c.cut.id + ' / kzMetronome rig', c.parent, c.cut.start, c.cut.end, {
    position: H.toScene(c, px, py)
  });
  var arcPts = H.arcPts(0, 0, Lr, -90 - A0 - 4, -90 + A0 + 4, 18).map(function (p) { return [p[0], -p[1]]; });
  var arcId = C.shape(c.graph, c.cut, c.cut.id + ' / kzMetronome arc', rig, arcPts.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }), {
    stroke: sb, width: Math.max(1.5, u * 0.0025), alpha: 0.7
  });
  var tSegs = [];
  for (var m = -2; m <= 2; m++) {
    var a = (-90 + m * A0 / 2) * DEG, r0 = Lr * (m % 2 ? 0.95 : 0.9);
    tSegs.push(['M', Math.cos(a) * r0, -Math.sin(a) * r0], ['L', Math.cos(a) * Lr, -Math.sin(a) * Lr]);
  }
  var ticksId = C.shape(c.graph, c.cut, c.cut.id + ' / kzMetronome ticks', rig, tSegs, { stroke: sb, width: Math.max(1.5, u * 0.0025), alpha: 0.7 });
  var armRig = c.graph.add('null', c.cut.id + ' / kzMetronome arm rig', rig, c.cut.start, c.cut.end, {});
  C.shape(c.graph, c.cut, c.cut.id + ' / kzMetronome arm', armRig, [['M', 0, 0], ['L', 0, Lr * 0.9]], { stroke: sc.fg, width: lw });
  C.shape(c.graph, c.cut, c.cut.id + ' / kzMetronome bob', armRig, G.ellipse(0, Lr * 0.9 * 0.62, u * 0.018, u * 0.018), { fill: col });
  C.shape(c.graph, c.cut, c.cut.id + ' / kzMetronome piv', rig, G.ellipse(0, 0, u * 0.007, u * 0.007), { fill: sc.fg });
  C.shape(c.graph, c.cut, c.cut.id + ' / kzMetronome base', rig, [['M', -Lr * 0.3, -u * 0.012], ['L', Lr * 0.3, -u * 0.012]], { stroke: sb, width: lw, alpha: 0.8 });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
    var env = R.env(c, f0), e = E.outExpo(cl(env.lt / 0.35)), o = H.io(c, f0, 0.3);
    return { 'scale.x': Math.max(0.01, e), 'scale.y': Math.max(0.01, e), alpha: o };
  });
  C.sample(c.graph, armRig, c.cut.start, c.cut.end, function (f0) {
    var env = R.env(c, f0), k = Math.max(0, curIdx(ts, env.lt)), tg = function (j) { return (j % 2 ? 1 : -1) * A0; }, tau = env.lt - ts[k];
    var ang = k === 0 ? tg(0) * E.outBack(cl(env.lt / 0.3), 1.6) : mix(tg(k - 1), tg(k), E.inOutCubic(cl(tau / 0.2))) + (tau > 0.2 ? tg(k) * 0.12 * pls(tau - 0.2, 7, 22) : 0);
    return { rotation: -ang };
  });
  [arcId, ticksId].forEach(function (id) {
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) { return { alpha: 0.7 * H.io(c, f0, 0.3) }; });
  });
  return { x: px, y: py };
});

/* 26. kzSpringCoils */
reg('kzSpringCoils', 'src/11p_x2_kineticA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh);
  var bb = H.decBB(c), ts = wordTimes(c), horiz = bb.h > bb.w * 1.3;
  var gap = u * 0.03, lw = Math.max(2, u * 0.004), N0 = 7 + 2 * Math.min(2, H.p(P, 'n', 1) | 0), amp = u * 0.022;
  var cPos = horiz ? cl(bb.cy, Hh * 0.08, Hh * 0.92) : cl(bb.cx, W * 0.08, W * 0.92), ph = u * 0.035;
  var sb = sub(c), col = acc(c);
  [-1, 1].forEach(function (sg) {
    var wall = horiz ? (sg < 0 ? W * 0.03 : W * 0.97) : (sg < 0 ? Hh * 0.03 : Hh * 0.97);
    var inner = (horiz ? (sg < 0 ? bb.x0 : bb.x1) : (sg < 0 ? bb.y0 : bb.y1)) + sg * gap;
    if ((inner - wall) * -sg < u * 0.04) return;
    var L = inner - wall, pt = function (a, b) { return horiz ? [a, b] : [b, a]; };
    var pWall = pt(wall, cPos), scW = H.toScene(c, pWall[0], pWall[1]);
    var rig = c.graph.add('null', c.cut.id + ' / kzSpringCoils ' + sg, c.parent, c.cut.start, c.cut.end, { position: scW });
    var pts = [[0, 0]];
    var toLoc = function (px, py) { return horiz ? [px - wall, -(py - cPos)] : [px - cPos, -(py - wall)]; };
    pts.push(toLoc.apply(null, pt(wall + L * 0.06, cPos)));
    for (var m = 0; m < N0; m++) {
      var off = (m % 2 ? 1 : -1) * amp * cl(u * 0.3 / Math.max(1, Math.abs(L)) + 0.5, 0.7, 1.5);
      pts.push(toLoc.apply(null, pt(wall + L * (0.08 + 0.84 * (m + 0.5) / N0), cPos + off)));
    }
    pts.push(toLoc.apply(null, pt(wall + L * 0.94, cPos)));
    pts.push(toLoc.apply(null, pt(inner, cPos)));
    C.shape(c.graph, c.cut, c.cut.id + ' / kzSpringCoils coil ' + sg, rig, pts.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }), {
      stroke: sb, width: lw, alpha: 0.9
    });
    var pIn0 = toLoc.apply(null, pt(inner, cPos - ph)), pIn1 = toLoc.apply(null, pt(inner, cPos + ph));
    C.shape(c.graph, c.cut, c.cut.id + ' / kzSpringCoils cap ' + sg, rig, [['M', pIn0[0], pIn0[1]], ['L', pIn1[0], pIn1[1]]], {
      stroke: col, width: lw * 1.6
    });
    var w0 = H.toScene(c, pt(wall, cPos - ph * 1.3)[0], pt(wall, cPos - ph * 1.3)[1]);
    var w1 = H.toScene(c, pt(wall, cPos + ph * 1.3)[0], pt(wall, cPos + ph * 1.3)[1]);
    var wSh = C.shape(c.graph, c.cut, c.cut.id + ' / kzSpringCoils wall ' + sg, c.parent, [['M', w0[0], w0[1]], ['L', w1[0], w1[1]]], { stroke: sb, width: lw * 1.6, alpha: 0.9 });
    C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
      var env = R.env(c, f0), o = H.io(c, f0, 0.3), e = E.outExpo(cl(env.lt / 0.4));
      var k = Math.max(0, curIdx(ts, env.lt)), jig = pls(env.lt - ts[k], 6, 26);
      var kLen = Math.max(0.02, e + (u * 0.018 * jig) / Math.max(1, Math.abs(L)));
      return horiz ? { 'scale.x': kLen, alpha: o } : { 'scale.y': kLen, alpha: o };
    });
    C.sample(c.graph, wSh, c.cut.start, c.cut.end, function (f0) { return { alpha: 0.9 * H.io(c, f0, 0.3) }; });
  });
  return { horiz: horiz };
});

/* 27. kzChevronRun */
reg('kzChevronRun', 'src/11p_x2_kineticA.js', function (c) {
  var P = c.preset.params || {}, u = Math.min(c.comp.width, c.comp.height), bb = H.decBB(c);
  var ts = wordTimes(c), n = ts.length, A = axisOf(c, bb, P.low ? -1 : 1), col = acc(c), sb = sub(c);
  var g = u * 0.036, M = Math.max(3, Math.min(28, Math.floor(A.len / g))), sz = u * 0.015, lw = Math.max(2, u * 0.005), d = u * 0.05;
  var chPts = [
    [-A.dirv[0] * sz * 0.6 + A.nrm[0] * sz, -(-A.dirv[1] * sz * 0.6 + A.nrm[1] * sz)],
    [A.dirv[0] * sz * 0.6, -A.dirv[1] * sz * 0.6],
    [-A.dirv[0] * sz * 0.6 - A.nrm[0] * sz, -(-A.dirv[1] * sz * 0.6 - A.nrm[1] * sz)]
  ];
  for (var m = 0; m < M; m++) {
    (function (mm) {
      var idSub = C.shape(c.graph, c.cut, c.cut.id + ' / kzChevronRun s' + mm, c.parent, chPts.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }), {
        stroke: sb, width: lw, alpha: 0.3
      });
      var idHot = C.shape(c.graph, c.cut, c.cut.id + ' / kzChevronRun h' + mm, c.parent, chPts.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }), {
        stroke: col, width: lw, alpha: 0
      });
      function evalM(f0) {
        var env = R.env(c, f0), lt = env.ltb, k = Math.max(0, curIdx(ts, lt)), o = H.io(c, f0, 0.3);
        var ph = lt * 0.55; for (var j = 0; j < ts.length; j++) if (lt > ts[j]) ph += 1.2 * (1 - Math.exp(-(lt - ts[j]) * 6));
        var t = (mm + (ph % 1)) / M, edge = cl(Math.min(t, 1 - t) * 7);
        var head = mix(k / n, (k + 1) / n, 0.5) + (k ? -(1 / n) * spr(lt - ts[k], 8, 12) : 0);
        var hot = Math.exp(-Math.pow((t - head) * n * 1.3, 2));
        var pt = A.at(t, d), scP = H.toScene(c, pt[0], pt[1]);
        return { scP: scP, a: (0.3 + 0.7 * hot) * edge * o, hot: hot > 0.5 };
      }
      C.sample(c.graph, idSub, c.cut.start, c.cut.end, function (f0) {
        var r = evalM(f0); return { 'position.x': r.scP[0], 'position.y': r.scP[1], alpha: r.hot ? 0 : r.a };
      });
      C.sample(c.graph, idHot, c.cut.start, c.cut.end, function (f0) {
        var r = evalM(f0); return { 'position.x': r.scP[0], 'position.y': r.scP[1], alpha: r.hot ? r.a : 0 };
      });
    })(m);
  }
  return { M: M };
});

/* 28. kzWhooshCurls */
reg('kzWhooshCurls', 'src/11p_x2_kineticA.js', function (c) {
  var P = c.preset.params || {}, u = Math.min(c.comp.width, c.comp.height), bb = H.decBB(c);
  var ts = wordTimes(c), n = ts.length, col = P.accent ? acc(c) : sub(c), lw = Math.max(2.5, u * 0.006);
  var dur = (c.cut.sourceEnd - c.cut.origin) / c.comp.fps, s = H.p(P, 'seed', 1) | 0, life = 0.8;
  var ev = ts.map(function (t, j) { return [t, j]; });
  for (var m = 1, te = ts[n - 1] + 0.9; m <= 5 && te < dur - 0.4; m++, te += 0.9) ev.push([te, n + m]);
  ev.forEach(function (pair) {
    var t0 = pair[0], j = pair[1], side = (j + (P.low ? 1 : 0)) % 2 ? 1 : -1, A = axisOf(c, bb, side), late = j >= n;
    var f = late ? R.hash01(s, j, 1) : (j + 0.5) / n, oPt = A.at(f, u * 0.035), sc0 = u * (0.032 + 0.012 * R.hash01(s, j, 2)) * (late ? 0.8 : 1);
    var bk = P.right ? 1 : -1, pts = [];
    for (var k = 0; k <= 28; k++) {
      var th = mix(-1.4, 7.7, k / 28), a = th - 1.9 * Math.sin(th), b = 1 - 1.9 * Math.cos(th) + 0.9;
      pts.push([(A.dirv[0] * a * bk + A.nrm[0] * b * 0.55) * sc0, -(A.dirv[1] * a * bk + A.nrm[1] * b * 0.55) * sc0]);
    }
    var scO = H.toScene(c, oPt[0], oPt[1]);
    var sh = C.shape(c.graph, c.cut, c.cut.id + ' / kzWhooshCurls ' + j, c.parent, pts.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }), {
      stroke: col, width: lw, position: scO, alpha: 0
    });
    C.sample(c.graph, sh, c.cut.start, c.cut.end, function (f0) {
      var env = R.env(c, f0), tau = env.lt - t0 - 0.03, o = H.io(c, f0, 0.1);
      if (tau < 0 || tau > life) return { alpha: 0 };
      var q = tau / life, fade = E.outCubic(cl(q * 2.5)) * (1 - E.inCubic(cl((q - 0.35) / 0.65)));
      return {
        'position.x': scO[0] + A.dirv[0] * bk * sc0 * 2 * q,
        'position.y': scO[1] - A.dirv[1] * bk * sc0 * 2 * q,
        alpha: (late ? 0.55 : 0.9) * o * fade
      };
    });
  });
  return { count: ev.length };
});

/* 29. kzPushRods */
reg('kzPushRods', 'src/11p_x2_kineticA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh);
  var bb = H.decBB(c), ts = wordTimes(c), sb = sub(c), col = acc(c);
  var horiz = (bb.h > bb.w * 1.3) !== !!((H.p(P, 'v', 0) | 0) % 2 && Math.min(bb.x0, W - bb.x1) > u * 0.16 && Math.min(bb.y0, Hh - bb.y1) > u * 0.16);
  var th = Math.max(4, u * 0.012), rest = u * 0.06, span = horiz ? bb.h : bb.w, hp = cl(span * 0.3, u * 0.03, u * 0.09);
  var cPos = horiz ? cl(bb.cy, Hh * 0.08, Hh * 0.92) : cl(bb.cx, W * 0.08, W * 0.92);
  [-1, 1].forEach(function (sg) {
    var edge = horiz ? (sg < 0 ? 0 : W) : (sg < 0 ? 0 : Hh);
    var baseTgt = (horiz ? (sg < 0 ? bb.x0 : bb.x1) : (sg < 0 ? bb.y0 : bb.y1)) + sg * (u * 0.014 + rest);
    if ((baseTgt - edge) * -sg < u * 0.03) return;
    var scEdge = horiz ? H.toScene(c, edge, cPos) : H.toScene(c, cPos, edge);
    var rig = c.graph.add('null', c.cut.id + ' / kzPushRods r' + sg, c.parent, c.cut.start, c.cut.end, { position: scEdge });
    var rodLen = Math.max(10, Math.abs(baseTgt - edge)), dirS = sg < 0 ? 1 : -1;
    var rodRect = horiz ? G.rect(dirS > 0 ? 0 : -rodLen, -th / 2, rodLen, th) : G.rect(-th / 2, dirS > 0 ? -rodLen : 0, th, rodLen);
    var rodId = C.shape(c.graph, c.cut, c.cut.id + ' / kzPushRods rod ' + sg, rig, rodRect, { fill: sb, alpha: 0.9 });
    var headRect = horiz ? G.rect(sg < 0 ? -th : 0, -hp, th, hp * 2) : G.rect(-hp, sg < 0 ? 0 : -th, hp * 2, th);
    var headId = C.shape(c.graph, c.cut, c.cut.id + ' / kzPushRods head ' + sg, c.parent, headRect, { fill: col });
    function evalRod(f0) {
      var env = R.env(c, f0), o = H.io(c, f0, 0.3), e = E.outExpo(cl(env.lt / 0.4)), push = 0;
      for (var j = 0; j < ts.length; j++) {
        if (j && (j % 2 ? 1 : -1) !== sg) continue;
        var tau = env.lt - ts[j] + 0.05;
        if (tau > 0) push = Math.max(push, tau < 0.05 ? tau / 0.05 : Math.exp(-(tau - 0.05) * 6));
      }
      var tgt = (horiz ? (sg < 0 ? bb.x0 : bb.x1) : (sg < 0 ? bb.y0 : bb.y1)) + sg * (u * 0.014 + rest * (1 - push));
      var tip = mix(edge, tgt, e);
      return { tip: tip, ratio: Math.max(0.01, Math.abs(tip - edge) / rodLen), o: o };
    }
    C.sample(c.graph, rodId, c.cut.start, c.cut.end, function (f0) {
      var r = evalRod(f0); return horiz ? { 'scale.x': r.ratio, alpha: 0.9 * r.o } : { 'scale.y': r.ratio, alpha: 0.9 * r.o };
    });
    C.sample(c.graph, headId, c.cut.start, c.cut.end, function (f0) {
      var r = evalRod(f0), scH = horiz ? H.toScene(c, r.tip, cPos) : H.toScene(c, cPos, r.tip);
      return { 'position.x': scH[0], 'position.y': scH[1], alpha: r.o };
    });
  });
  return { horiz: horiz };
});

/* ==================== TYPO (5 ty* from 11p_typo3.js) ==================== */

function tyU(c) { return Math.min(c.comp.width, c.comp.height) / 1080; }
function tyMG(c) { return Math.round(Math.min(c.comp.width, c.comp.height) * 0.05); }
function tyFS(c) { return Math.max(11, 16 * tyU(c)); }
function tyOut(env) { return 1 - E.inCubic(env.pOut || 0); }
function tyIn(env, d, delay) { return E.outExpo(cl((env.lt - (delay || 0)) / (d || 0.4))); }
function tyKeyChar(txt) {
  var arr = Array.from(String(txt || ''));
  for (var i = 0; i < arr.length; i++) if (/[\u4E00-\u9FFF\u3400-\u4DBF]/.test(arr[i])) return arr[i];
  for (var j = 0; j < arr.length; j++) if (arr[j].trim() && !/^[.,!?。、！？「」『』()（）[\]【】…—\-]$/.test(arr[j])) return arr[j];
  for (var k = 0; k < arr.length; k++) if (arr[k].trim()) return arr[k];
  return null;
}
function tyLabel(c, name, str, x, y, opts) {
  opts = opts || {};
  return H.addText(c, name, str, x, y, opts.size || tyFS(c), {
    role: opts.role || 'mono', align: opts.align || 'left',
    color: opts.color || sub(c), rotation: opts.rot || 0, alpha: opts.alpha == null ? 1 : opts.alpha
  }, opts.animFn);
}

/* 30. tyColophon */
reg('tyColophon', 'src/11p_typo3.js', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = tyU(c), bb = H.decBB(c), cut = c.cut, src = cut.source || {};
  var fs = tyFS(c) * 1.1, lead = fs * 1.7, txt = cutText(c), lt = lineText(c);
  var chCnt = Array.from(txt.replace(/\s+/g, '')).length;
  var lArr = Array.from(lt), lDisp = lArr.length > 18 ? lArr.slice(0, 17).join('') + '...' : lt;
  var l1 = lDisp || 'LYRIC';
  var l2 = 'No.' + pad2((src.line | 0) + 1) + '  ' + fmtTime(cut.origin / c.comp.fps) + ' - ' + fmtTime(cut.sourceEnd / c.comp.fps);
  var l3 = chCnt + ' CHARS';
  var rows = [[l1, 'body', sc.fg], [l2, 'mono', sub(c)], [l3, 'mono', sub(c)]];
  var w = 0; rows.forEach(function (r) { w = Math.max(w, tw(r[0], fs, 0.12)); });
  var h = lead * rows.length;
  var sp = H.cornerSpot(c, bb, w + fs * 1.4, h, Object.assign({}, P, { low: P.low !== false }), 1);
  if (!sp.ok) return { skipped: true };
  var x = sp.x + fs * 1.4;
  var ruleRig = c.graph.add('null', cut.id + ' / tyColophon rule rig', c.parent, cut.start, cut.end, {
    position: H.toScene(c, sp.x, sp.y)
  });
  var ruleId = C.shape(c.graph, cut, cut.id + ' / tyColophon rule', ruleRig, [['M', 0, 0], ['L', 0, -h]], {
    stroke: acc(c), width: Math.max(1.5, 2 * u)
  });
  C.sample(c.graph, ruleRig, cut.start, cut.end, function (f0) {
    var env = R.env(c, f0), e = tyIn(env, 0.6) * tyOut(env);
    return { 'scale.y': Math.max(0.01, e) };
  });
  C.sample(c.graph, ruleId, cut.start, cut.end, function (f0) { return { alpha: tyOut(R.env(c, f0)) }; });
  rows.forEach(function (row, idx) {
    var arr = Array.from(row[0]);
    H.stepText(c, 'tyColophon r' + idx, x, sp.y + lead * (idx + 0.5), fs, {
      role: row[1], align: 'left', color: row[2],
      animFn: function (env) { return { alpha: tyOut(env) * (idx ? 0.85 : 1) }; }
    }, function (env) {
      var k = Math.floor(arr.length * cl((env.lt - 0.1 - idx * 0.14) / 0.45));
      return k > 0 ? arr.slice(0, k).join('') : '';
    }, Math.min(10, arr.length + 1));
  });
  return { x: sp.x, y: sp.y };
});

/* 31. tyRunningHead */
reg('tyRunningHead', 'src/11p_typo3.js', function (c) {
  var P = c.preset.params || {}, sc = c.sc, W = c.comp.width, Hh = c.comp.height, u = tyU(c), m = tyMG(c);
  var bb = H.decBB(c), cut = c.cut, src = cut.source || {}, fs = tyFS(c) * 0.9, lw = Math.max(1, u);
  var yH = m + fs * 0.6;
  if (!H.hitBB(0, yH - fs, W, yH + fs, bb, 8 * u)) {
    var head = pad2((src.line | 0) + 1) + '  ' + (lineText(c) || 'LYRIC');
    var hs = Array.from(head).slice(0, 30).join(''), headW = tw(hs, fs, 0.2), right = !!P.right;
    var x0 = right ? W - m - headW : m;
    tyLabel(c, 'tyRunningHead head', hs, x0, yH, {
      role: 'body', size: fs, color: sub(c),
      animFn: function (env) { return { alpha: tyIn(env, 0.7) * tyOut(env) }; }
    });
    var a0 = right ? x0 - fs : x0 + headW + fs, a1 = right ? m : W - m;
    if ((a1 - a0) * (right ? -1 : 1) > 20) {
      var rRig = c.graph.add('null', cut.id + ' / tyRunningHead rule rig', c.parent, cut.start, cut.end, {
        position: H.toScene(c, a0, yH)
      });
      var rSh = C.shape(c.graph, cut, cut.id + ' / tyRunningHead rule', rRig, [['M', 0, 0], ['L', a1 - a0, 0]], {
        stroke: sub(c), width: lw, alpha: 0.6
      });
      C.sample(c.graph, rRig, cut.start, cut.end, function (f0) {
        return { 'scale.x': Math.max(0.01, tyIn(R.env(c, f0), 0.7)) };
      });
      C.sample(c.graph, rSh, cut.start, cut.end, function (f0) {
        return { alpha: 0.6 * tyOut(R.env(c, f0)) };
      });
    }
  }
  var yF = Hh - m - fs * 0.2, idx = (src.index != null ? src.index : 0) | 0;
  var folio = String(idx + 1).padStart(3, '0'), fw = tw(folio, fs * 1.3, 0.2);
  var xF = P.right ? m + fw / 2 : W - m - fw / 2;
  if (!H.hitBB(xF - fw, yF - fs * 1.2, xF + fw, yF + fs, bb, 8 * u)) {
    tyLabel(c, 'tyRunningHead folio', folio, xF, yF, {
      size: fs * 1.3, align: 'center', color: sc.fg,
      animFn: function (env) { return { alpha: E.outCubic(cl((env.lt - 0.2) / 0.4)) * tyOut(env) }; }
    });
    var fLine = H.line(c, 'tyRunningHead fbar', [[xF - fw * 0.9, yF - fs * 1.1], [xF + fw * 0.9, yF - fs * 1.1]], acc(c), Math.max(1.5, 2 * u), 1);
    C.sample(c.graph, fLine, cut.start, cut.end, function (f0) {
      return { alpha: E.outCubic(cl((R.env(c, f0).lt - 0.2) / 0.4)) * tyOut(R.env(c, f0)) };
    });
  }
  return { folio: folio };
});

/* 32. tyTextRule */
reg('tyTextRule', 'src/11p_typo3.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = tyU(c), m = tyMG(c);
  var bb = H.decBB(c), fs = tyFS(c) * 0.72, role = (H.p(P, 'v', 0) | 0) % 2 ? 'mono' : 'body';
  var unit = (lineText(c) || 'JIZURA') + '  /  ', per = Math.max(40, tw(unit, fs, 0.18));
  var rows = (H.p(P, 'n', 1) | 0) >= 2 ? [m * 0.75, Hh - m * 0.75] : [P.low ? Hh - m * 0.75 : m * 0.75];
  var rep = unit.repeat(Math.min(18, Math.ceil(W * 1.4 / per) + 2));
  rows.forEach(function (y, k) {
    if (H.hitBB(0, y - fs, W, y + fs, bb, 6 * u)) return;
    var dir = k % 2 ? 1 : -1, txtW = tw(rep, fs, 0.18);
    var tId = tyLabel(c, 'tyTextRule t' + k, rep, W / 2, y, {
      role: role, size: fs, align: 'center', color: sub(c), alpha: 0.8
    });
    if (tId) {
      var frames = [];
      for (var f = c.cut.start; f < c.cut.end; f++) {
        var env = R.env(c, f), e = E.outExpo(cl((env.lt - k * 0.1) / 0.8));
        var hw = (W - m * 1.2) * e / 2, scC = H.toScene(c, W / 2, y);
        var cx = scC[0], cy = scC[1];
        frames.push([[cx - hw, cy - fs], [cx + hw, cy - fs], [cx + hw, cy + fs], [cx - hw, cy + fs]]);
      }
      V.clipDeformer(c.graph, tId, frames, false, 'TextRule clip', c.options);
      C.sample(c.graph, tId, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), o = tyOut(env), off = wrap(env.ltb * 26 * u * dir, per) - per / 2;
        return { 'position.x': cl(off, -txtW * 0.4, txtW * 0.4), alpha: 0.8 * o };
      });
    }
    var ry = y + (k || P.low ? -1 : 1) * fs * 1.05, rW = W - m * 1.2;
    var rRig = c.graph.add('null', c.cut.id + ' / tyTextRule rrig ' + k, c.parent, c.cut.start, c.cut.end, {
      position: H.toScene(c, W / 2, ry)
    });
    var rSh = C.shape(c.graph, c.cut, c.cut.id + ' / tyTextRule r' + k, rRig, [['M', -rW / 2, 0], ['L', rW / 2, 0]], {
      stroke: sub(c), width: Math.max(1, 0.8 * u), alpha: 0.5
    });
    C.sample(c.graph, rRig, c.cut.start, c.cut.end, function (f0) {
      return { 'scale.x': Math.max(0.01, E.outExpo(cl((R.env(c, f0).lt - k * 0.1) / 0.8))) };
    });
    C.sample(c.graph, rSh, c.cut.start, c.cut.end, function (f0) { return { alpha: 0.5 * tyOut(R.env(c, f0)) }; });
  });
  return { rows: rows.length };
});

/* 33. tyTypeScale */
reg('tyTypeScale', 'src/11p_typo3.js', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = tyU(c), bb = H.decBB(c);
  var ch = tyKeyChar(cutText(c)); if (!ch) return { empty: true };
  var S0 = Math.min(c.comp.width, c.comp.height) * 0.085, ks = [1, 0.72, 0.52, 0.37, 0.26];
  var role = (H.p(P, 'v', 0) | 0) % 2 ? 'serif' : 'display', gapK = 0.18, w = 0;
  ks.forEach(function (k) { w += S0 * k * (1 + gapK); });
  var fs = tyFS(c) * 0.7, h = S0 + fs * 2.2, sp = H.cornerSpot(c, bb, w, h, P, 1);
  if (!sp.ok) return { skipped: true };
  var yb = sp.y + S0 * 0.95, x = sp.x;
  ks.forEach(function (k, i) {
    var s = S0 * k, gx = x + s / 2;
    tyLabel(c, 'tyTypeScale g' + i, ch, gx, yb - s * 0.46, {
      role: role, size: s, align: 'center', color: i ? sub(c) : sc.fg,
      animFn: function (env) { return { alpha: E.outCubic(cl((env.lt - 0.1 - i * 0.07) / 0.3)) * tyOut(env) }; }
    });
    tyLabel(c, 'tyTypeScale n' + i, String(Math.round(s / u * 0.75)), gx, yb + fs * 1.1, {
      size: fs, align: 'center', color: sub(c),
      animFn: function (env) { return { alpha: E.outCubic(cl((env.lt - 0.1 - i * 0.07) / 0.3)) * tyOut(env) * 0.9 }; }
    });
    x += s * (1 + gapK);
  });
  var rRig = c.graph.add('null', c.cut.id + ' / tyTypeScale rule rig', c.parent, c.cut.start, c.cut.end, {
    position: H.toScene(c, sp.x, yb + fs * 0.25)
  });
  var rId = C.shape(c.graph, c.cut, c.cut.id + ' / tyTypeScale rule', rRig, [['M', 0, 0], ['L', x - sp.x, 0]], {
    stroke: acc(c), width: Math.max(1, u), alpha: 0.8
  });
  C.sample(c.graph, rRig, c.cut.start, c.cut.end, function (f0) { return { 'scale.x': Math.max(0.01, tyIn(R.env(c, f0), 0.6)) }; });
  C.sample(c.graph, rId, c.cut.start, c.cut.end, function (f0) { return { alpha: 0.8 * tyOut(R.env(c, f0)) }; });
  return { ch: ch };
});

/* 34. tyBigPunct */
reg('tyBigPunct', 'src/11p_typo3.js', function (c) {
  var P = c.preset.params || {}, sc = c.sc, W = c.comp.width, Hh = c.comp.height;
  var bb = H.decBB(c), v = (H.p(P, 'v', 0) | 0) % 3;
  var pairs = [['\u300c', '\u300d'], ['\u300e', '\u300f'], ['\u201c', '\u201d']];
  var a0 = pairs[v][0], a1 = pairs[v][1], quote = v === 2;
  var S = cl(bb.h * (quote ? 1.6 : 2.1), Math.min(W, Hh) * 0.22, Math.min(W, Hh) * 0.55), gap = S * 0.04;
  var col = P.accent ? H.mixHex(sc.bg, sc.accent, 0.42) : H.mixHex(sc.bg, sc.fg, 0.2);
  var xl = quote ? bb.x0 - gap - 0.22 * S : bb.x0 - gap - 0.2 * S;
  var yt = quote ? bb.y0 + 0.42 * S : bb.y0 - gap + 0.4 * S;
  var xr = quote ? bb.x1 + gap + 0.22 * S : bb.x1 + gap + 0.2 * S;
  var yb = quote ? bb.y1 + 0.12 * S : bb.y1 + gap - 0.4 * S;
  var scL = H.toScene(c, xl, yt), scR = H.toScene(c, xr, yb);
  tyLabel(c, 'tyBigPunct open', a0, xl, yt, {
    role: 'serif', size: S, align: 'center', color: col,
    animFn: function (env) {
      var e = E.outCubic(cl(env.lt / 0.7)), sl = (1 - e) * S * 0.25;
      return { 'position.x': scL[0] - sl, 'position.y': scL[1] + sl, alpha: e * tyOut(env) };
    }
  });
  tyLabel(c, 'tyBigPunct close', a1, xr, yb, {
    role: 'serif', size: S, align: 'center', color: col,
    animFn: function (env) {
      var e = E.outCubic(cl(env.lt / 0.7)), sl = (1 - e) * S * 0.25;
      return { 'position.x': scR[0] + sl, 'position.y': scR[1] - sl, alpha: e * tyOut(env) };
    }
  });
  return { pair: v };
});

/* ==================== TYPO X2 (10 tz* from 11p_x2_typoA.js) ==================== */

/* 35. tzNoteMark */
reg('tzNoteMark', 'src/11p_x2_typoA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = tyU(c), m = tyMG(c), fs = tyFS(c);
  var bb = H.decBB(c), cut = c.cut, src = cut.source || {};
  var mk = ['\u203b', '\uff0a', '\u2020'][(H.p(P, 'v', 0) | 0) % 3], num = String(cl(H.p(P, 'n', 1) | 0, 1, 3)), ac = acc(c);
  var ms = fs * 1.9, x = bb.x1 + ms * 0.55, y = bb.y0 + ms * 0.15;
  if (x + ms * 1.2 > W - m * 0.5) { x = bb.x1 - ms * 0.6; y = bb.y0 - ms * 0.75; }
  if (y > m * 0.5) {
    tyLabel(c, 'tzNoteMark mk', mk, x, y, {
      role: 'body', size: ms, align: 'center', color: ac,
      animFn: function (env) {
        var a = E.outBack(cl((env.lt - 0.15) / 0.35), 1.6) * tyOut(env), sc = cl(0.6 + 0.4 * cl(a), 0.1, 1.3);
        return { 'scale.x': sc, 'scale.y': sc, alpha: cl(a) };
      }
    });
    tyLabel(c, 'tzNoteMark num', num, x + ms * 0.62, y - ms * 0.22, {
      size: ms * 0.55, align: 'left', color: ac,
      animFn: function (env) { return { alpha: cl(E.outBack(cl((env.lt - 0.15) / 0.35), 1.6) * tyOut(env)) }; }
    });
  }
  var chCnt = Array.from(cutText(c).replace(/\s+/g, '')).length;
  var note = num + '  ' + fmtTime(cut.origin / c.comp.fps) + ' - L' + pad2((src.line | 0) + 1) + ' / ' + pad2(chCnt);
  var nw = tw(note, fs * 0.9, 0.12) + fs * 1.4, right = !!P.right;
  var yCand = P.low === false ? [m + fs * 1.4, Hh - m - fs * 0.5] : [Hh - m - fs * 0.5, m + fs * 1.4];
  for (var i = 0; i < yCand.length; i++) {
    var yF = yCand[i], x0 = right ? W - m - nw : m;
    if (H.hitBB(x0, yF - fs * 2, x0 + nw, yF + fs, bb, 10 * u)) continue;
    var rLen = Math.min(nw, W * 0.16);
    var rRig = c.graph.add('null', cut.id + ' / tzNoteMark rule rig', c.parent, cut.start, cut.end, {
      position: H.toScene(c, x0, yF - fs * 1.25)
    });
    var rId = C.shape(c.graph, cut, cut.id + ' / tzNoteMark rule', rRig, [['M', 0, 0], ['L', rLen, 0]], {
      stroke: sub(c), width: Math.max(1, u), alpha: 0.7
    });
    C.sample(c.graph, rRig, cut.start, cut.end, function (f0) {
      return { 'scale.x': Math.max(0.01, E.outExpo(cl((R.env(c, f0).lt - 0.25) / 0.6))) };
    });
    C.sample(c.graph, rId, cut.start, cut.end, function (f0) { return { alpha: 0.7 * tyOut(R.env(c, f0)) }; });
    tyLabel(c, 'tzNoteMark fmk', mk, x0 + fs * 0.45, yF, {
      role: 'body', size: fs * 0.95, align: 'center', color: ac,
      animFn: function (env) { return { alpha: E.outExpo(cl((env.lt - 0.25) / 0.6)) * tyOut(env) }; }
    });
    var arr = Array.from(note);
    H.stepText(c, 'tzNoteMark note', x0 + fs * 1.2, yF, fs * 0.9, {
      role: 'mono', align: 'left', color: sub(c),
      animFn: function (env) { return { alpha: 0.9 * tyOut(env) }; }
    }, function (env) {
      var k = Math.floor(arr.length * cl((env.lt - 0.3) / 0.5));
      return k > 0 ? arr.slice(0, k).join('') : '';
    }, Math.min(10, arr.length + 1));
    break;
  }
  return { mk: mk };
});

/* 36. tzProgRule */
reg('tzProgRule', 'src/11p_x2_typoA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = tyU(c), m = tyMG(c), fs = tyFS(c);
  var bb = H.decBB(c), cut = c.cut, horiz = bb.w >= bb.h * 0.8, gap = 16 * u + (horiz ? bb.h : bb.w) * 0.07;
  var dur = (cut.sourceEnd - cut.origin) / c.comp.fps, outDur = cut.outFrames / c.comp.fps;
  var lw = Math.max(1, u), col = P.accent ? acc(c) : c.sc.fg;
  var a0, a1, cPos, side;
  if (horiz) {
    var mid = bb.cx, half = Math.max(bb.w, W * 0.24) / 2;
    a0 = Math.max(m, mid - half); a1 = Math.min(W - m, mid + half);
    side = P.low === false ? -1 : 1; cPos = side > 0 ? bb.y1 + gap : bb.y0 - gap;
    if (cPos > Hh - m - fs * 2 || cPos < m + fs * 2) { side = -side; cPos = side > 0 ? bb.y1 + gap : bb.y0 - gap; }
    if (cPos > Hh - m * 0.6 || cPos < m * 0.6) return { skipped: true };
  } else {
    var midY = bb.cy, halfY = Math.max(bb.h, Hh * 0.24) / 2;
    a0 = Math.max(m, midY - halfY); a1 = Math.min(Hh - m, midY + halfY);
    side = P.right === false ? -1 : 1; cPos = side > 0 ? bb.x1 + gap : bb.x0 - gap;
    if (cPos > W - m - fs * 3 || cPos < m + fs * 3) { side = -side; cPos = side > 0 ? bb.x1 + gap : bb.x0 - gap; }
    if (cPos > W - m * 0.6 || cPos < m * 0.6) return { skipped: true };
  }
  var pt = function (a, b) { return horiz ? [a, b] : [b, a]; }, t = 5 * u, len = Math.max(10, a1 - a0);
  var scStart = H.toScene(c, pt(a0, cPos)[0], pt(a0, cPos)[1]);
  var trkRig = c.graph.add('null', cut.id + ' / tzProgRule trk rig', c.parent, cut.start, cut.end, { position: scStart });
  var trkId = C.shape(c.graph, cut, cut.id + ' / tzProgRule trk', trkRig, [['M', 0, 0], horiz ? ['L', len, 0] : ['L', 0, -len]], { stroke: sub(c), width: lw, alpha: 0.45 });
  var tk0 = H.line(c, 'tzProgRule tk0', [pt(a0, cPos - t), pt(a0, cPos + t)], sub(c), lw, 0.8);
  var tk1 = H.line(c, 'tzProgRule tk1', [pt(a1, cPos - t), pt(a1, cPos + t)], sub(c), lw, 0.8);
  var barRig = c.graph.add('null', cut.id + ' / tzProgRule bar rig', c.parent, cut.start, cut.end, { position: scStart });
  var barId = C.shape(c.graph, cut, cut.id + ' / tzProgRule bar', barRig, [['M', 0, 0], horiz ? ['L', len, 0] : ['L', 0, -len]], { stroke: col, width: Math.max(2, 3 * u) });
  function prog(env) {
    var e = E.outExpo(cl(env.lt / 0.6)), q = cl(env.lt / Math.max(0.3, dur - outDur * 0.5));
    return { e: e, q: q, o: tyOut(env) };
  }
  C.sample(c.graph, trkRig, cut.start, cut.end, function (f0) {
    var r = prog(R.env(c, f0)); return horiz ? { 'scale.x': Math.max(0.01, r.e) } : { 'scale.y': Math.max(0.01, r.e) };
  });
  C.sample(c.graph, trkId, cut.start, cut.end, function (f0) { return { alpha: 0.45 * tyOut(R.env(c, f0)) }; });
  C.sample(c.graph, tk0, cut.start, cut.end, function (f0) { return { alpha: 0.8 * tyOut(R.env(c, f0)) }; });
  C.sample(c.graph, tk1, cut.start, cut.end, function (f0) { var r = prog(R.env(c, f0)); return { alpha: r.e > 0.9 ? 0.8 * r.o : 0 }; });
  C.sample(c.graph, barRig, cut.start, cut.end, function (f0) {
    var r = prog(R.env(c, f0)); return horiz ? { 'scale.x': Math.max(0.005, r.q * r.e) } : { 'scale.y': Math.max(0.005, r.q * r.e) };
  });
  C.sample(c.graph, barId, cut.start, cut.end, function (f0) { return { alpha: tyOut(R.env(c, f0)) }; });
  var isTime = (H.p(P, 'v', 0) | 0) % 2 === 1;
  H.stepText(c, 'tzProgRule lbl', horiz ? (a0 + a1) / 2 : cPos + side * fs * 0.9, horiz ? cPos + side * fs * 1.25 : (a0 + a1) / 2, fs, {
    role: 'mono', align: horiz ? 'center' : (side > 0 ? 'left' : 'right'), color: c.sc.fg,
    animFn: function (env) {
      var r = prog(env), aQ = cl(mix(a0, a1, r.q * r.e), a0 + fs, a1 - fs);
      var scL = horiz ? H.toScene(c, aQ, cPos + side * fs * 1.25) : H.toScene(c, cPos + side * fs * 0.9, aQ);
      return { 'position.x': scL[0], 'position.y': scL[1], alpha: E.outCubic(cl((env.lt - 0.15) / 0.3)) * r.o };
    }
  }, function (env) {
    var r = prog(env);
    return isTime ? fmtTime(cut.origin / c.comp.fps + env.lt) : pad2(Math.round(r.q * 100));
  }, 10);
  return { horiz: horiz };
});

/* 37. tzTrackMarks */
reg('tzTrackMarks', 'src/11p_x2_typoA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = tyU(c), m = tyMG(c), fs = tyFS(c) * 0.88;
  var bb = H.decBB(c), cells = glyphCells(c, bb), vert = !!cells.vert;
  if (!vert) {
    var yl = -1e9; cells.forEach(function (g) { yl = Math.max(yl, g.y); });
    cells = cells.filter(function (g) { return Math.abs(g.y - yl) < g.h * 0.5; }).sort(function (a, b) { return a.x - b.x; });
  } else {
    var xl = -1e9; cells.forEach(function (g) { xl = Math.max(xl, g.x); });
    cells = cells.filter(function (g) { return Math.abs(g.x - xl) < g.w * 0.5; }).sort(function (a, b) { return a.y - b.y; });
  }
  var n = cells.length; if (!n) return { empty: true };
  var sz = vert ? cells[0].w : cells[0].h, gap = 12 * u + sz * 0.1, lw = Math.max(1, u), ac = acc(c);
  var side = vert ? 1 : (P.low === false ? -1 : 1), cPos = vert ? bb.x1 + gap : (side > 0 ? bb.y1 + gap : bb.y0 - gap);
  if (!vert && (cPos > Hh - m - fs * 2.4 || cPos < m + fs * 2.4)) { side = -side; cPos = side > 0 ? bb.y1 + gap : bb.y0 - gap; }
  if (vert && cPos > W - m - fs * 3) { side = -1; cPos = bb.x0 - gap; }
  if ((vert ? W : Hh) - cPos < m * 0.6 || cPos < m * 0.6) return { skipped: true };
  var pt = function (a, b) { return vert ? [b, a] : [a, b]; };
  var lo = function (g) { return vert ? g.y - g.h / 2 : g.x - g.w / 2; };
  var hi = function (g) { return vert ? g.y + g.h / 2 : g.x + g.w / 2; };
  var t = 4 * u;
  cells.forEach(function (g, i) {
    var a0 = lo(g) + sz * 0.06, a1 = hi(g) - sz * 0.06, mid = (a0 + a1) / 2;
    var pMid = pt(mid, cPos), scM = H.toScene(c, pMid[0], pMid[1]), hl = Math.max(2, (a1 - a0) / 2);
    var rig = c.graph.add('null', c.cut.id + ' / tzTrackMarks r' + i, c.parent, c.cut.start, c.cut.end, { position: scM });
    var sh = C.shape(c.graph, c.cut, c.cut.id + ' / tzTrackMarks b' + i, rig, vert ? [['M', 0, hl], ['L', 0, -hl]] : [['M', -hl, 0], ['L', hl, 0]], {
      stroke: sub(c), width: lw, alpha: 0.85
    });
    C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
      var e = E.outExpo(cl((R.env(c, f0).lt - 0.08 - i * 0.03) / 0.45));
      return vert ? { 'scale.y': Math.max(0.01, e) } : { 'scale.x': Math.max(0.01, e) };
    });
    C.sample(c.graph, sh, c.cut.start, c.cut.end, function (f0) {
      var env = R.env(c, f0); return { alpha: 0.85 * E.outExpo(cl((env.lt - 0.08 - i * 0.03) / 0.45)) * tyOut(env) };
    });
    if (i < n - 1) {
      var gm = (hi(g) + lo(cells[i + 1])) / 2;
      var cPts = [pt(gm - t, cPos + side * t * 1.5), pt(gm, cPos), pt(gm + t, cPos + side * t * 1.5)];
      var caret = H.line(c, 'tzTrackMarks c' + i, cPts, ac, lw, 1);
      C.sample(c.graph, caret, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0); return { alpha: E.outExpo(cl((env.lt - 0.08 - i * 0.03) / 0.45)) * tyOut(env) };
      });
      if (n <= 9) {
        var v = Math.round((lo(cells[i + 1]) - hi(g)) / Math.max(1, sz) * 1000);
        var txt = (v >= 0 ? '+' : '-') + Math.abs(v);
        tyLabel(c, 'tzTrackMarks v' + i, txt, vert ? cPos + side * (t * 1.5 + fs * 0.5) : gm, vert ? gm : cPos + side * (t * 1.5 + fs), {
          size: fs, align: vert ? (side > 0 ? 'left' : 'right') : 'center',
          animFn: function (env) { return { alpha: 0.9 * E.outExpo(cl((env.lt - 0.08 - i * 0.03) / 0.45)) * tyOut(env) }; }
        });
      }
    }
  });
  if (n > 9 || n === 1) {
    var span = Math.round((hi(cells[n - 1]) - lo(cells[0])) / u);
    tyLabel(c, 'tzTrackMarks span', (vert ? 'H ' : 'W ') + span, vert ? cPos + side * fs * 0.8 : lo(cells[0]), vert ? lo(cells[0]) + fs : cPos + side * fs * 1.5, {
      size: fs, align: vert && side <= 0 ? 'right' : 'left',
      animFn: function (env) { return { alpha: 0.9 * E.outCubic(cl((env.lt - 0.3) / 0.3)) * tyOut(env) }; }
    });
  }
  return { n: n };
});

/* 38. tzSideCaption */
reg('tzSideCaption', 'src/11p_x2_typoA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = tyU(c), m = tyMG(c), fs = tyFS(c);
  var bb = H.decBB(c), cut = c.cut, src = cut.source || {}, gap = 18 * u + Math.min(bb.w, bb.h) * 0.05;
  var side = P.right ? 1 : -1, x = 0, ok = false;
  for (var k = 0; k < 2 && !ok; k++) { x = side > 0 ? bb.x1 + gap + fs : bb.x0 - gap - fs; ok = x > m * 0.7 && x < W - m * 0.7; if (!ok) side = -side; }
  if (!ok) return { skipped: true };
  var idx = (src.index != null ? src.index : 0) | 0, chCnt = Array.from(cutText(c).replace(/\s+/g, '')).length;
  var cap = 'FIG.' + pad2(idx + 1) + ' - ' + fmtTime(cut.origin / c.comp.fps) + ' - ' + pad2(chCnt) + ' GLYPHS';
  if (tw(cap, fs, 0.16) > Hh - m * 2) cap = 'FIG.' + pad2(idx + 1) + ' - ' + fmtTime(cut.origin / c.comp.fps);
  var L = tw(cap, fs, 0.16), y0 = Math.max(m, bb.y0), y1 = Math.min(Hh - m, bb.y1), cy = cl((y0 + y1) / 2, m + L / 2, Hh - m - L / 2);
  var xr = x - side * fs * 0.95, ya = Math.min(y0, cy - L / 2), yb = Math.max(y1, cy + L / 2), yStart = side > 0 ? ya : yb, yEnd = side > 0 ? yb : ya;
  var rRig = c.graph.add('null', cut.id + ' / tzSideCaption rrig', c.parent, cut.start, cut.end, { position: H.toScene(c, xr, yStart) });
  var rId = C.shape(c.graph, cut, cut.id + ' / tzSideCaption rule', rRig, [['M', 0, 0], ['L', 0, -(yEnd - yStart)]], { stroke: sub(c), width: Math.max(1, u), alpha: 0.7 });
  C.sample(c.graph, rRig, cut.start, cut.end, function (f0) { return { 'scale.y': Math.max(0.01, tyIn(R.env(c, f0), 0.6)) }; });
  C.sample(c.graph, rId, cut.start, cut.end, function (f0) { return { alpha: 0.7 * tyOut(R.env(c, f0)) }; });
  var t = 5 * u;
  var tk = H.line(c, 'tzSideCaption tick', [[xr, yStart], [xr + side * t * 2, yStart]], acc(c), Math.max(1.5, 2 * u), 1);
  C.sample(c.graph, tk, cut.start, cut.end, function (f0) { return { alpha: tyIn(R.env(c, f0), 0.6) * tyOut(R.env(c, f0)) }; });
  var arr = Array.from(cap);
  H.stepText(c, 'tzSideCaption txt', x, cy, fs, {
    role: 'mono', align: 'center', rot: side > 0 ? 90 : -90, color: sub(c),
    animFn: function (env) {
      var k2 = Math.floor(arr.length * cl((env.lt - 0.12) / 0.6)), part = arr.slice(0, k2).join(''), pw = tw(part, fs, 0.16);
      var yc = side > 0 ? cy - L / 2 + pw / 2 : cy + L / 2 - pw / 2;
      return { 'position.y': H.toScene(c, x, yc)[1], alpha: 0.9 * tyOut(env) };
    }
  }, function (env) {
    var k2 = Math.floor(arr.length * cl((env.lt - 0.12) / 0.6));
    return k2 > 0 ? arr.slice(0, k2).join('') : '';
  }, Math.min(12, arr.length + 1));
  return { x: x };
});

/* 39. tzHeadEnd */
reg('tzHeadEnd', 'src/11p_x2_typoA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = tyU(c), m = tyMG(c);
  var bb = H.decBB(c), cells = glyphCells(c, bb), g0 = cells[0], g1 = cells[cells.length - 1];
  var hh = g0 ? Math.min(g0.h, g0.w * 1.4) : bb.h, S = cl(hh * 0.5, 30 * u, 96 * u), gap = 10 * u + S * 0.18, ac = acc(c);
  var mk = ['\u00b6', '\u00a7', '\u00b6'][(H.p(P, 'v', 0) | 0) % 3];
  var x = bb.x0 - gap - S * 0.3, y = (g0 ? g0.y - g0.h / 2 : bb.y0) + S * 0.5;
  if (x - S * 0.4 < m * 0.6) { x = bb.x0 + S * 0.3; y = bb.y0 - gap - S * 0.45; }
  if (y - S * 0.5 > m * 0.4) {
    var scMk = H.toScene(c, x, y);
    tyLabel(c, 'tzHeadEnd mk', mk, x, y, {
      role: 'serif', size: S, align: 'center', color: P.accent ? ac : sub(c),
      animFn: function (env) {
        var sl = (1 - E.outExpo(cl(env.lt / 0.5))) * S * 0.5;
        return { 'position.x': scMk[0] - sl, alpha: E.outCubic(cl(env.lt / 0.45)) * tyOut(env) };
      }
    });
  }
  var q = cl(hh * 0.13, 8 * u, 22 * u), ex = bb.x1 + gap * 0.8, ey = (g1 ? g1.y + g1.h / 2 : bb.y1) - q - hh * 0.1;
  if (ex + q > W - m * 0.6) { ex = bb.x1 - q; ey = bb.y1 + gap * 0.8; }
  if (ey + q < Hh - m * 0.4) {
    var cx = ex + q / 2, cy = ey + q / 2, outlined = (H.p(P, 'v', 0) | 0) % 2 === 1;
    var endId = C.shape(c.graph, c.cut, c.cut.id + ' / tzHeadEnd end', c.parent, G.rect(-q / 2, -q / 2, q, q), {
      fill: outlined ? undefined : (P.accent ? c.sc.fg : ac),
      stroke: outlined ? c.sc.fg : undefined, width: Math.max(1.5, 2 * u), position: H.toScene(c, cx, cy)
    });
    C.sample(c.graph, endId, c.cut.start, c.cut.end, function (f0) {
      var env = R.env(c, f0), p = E.outBack(cl((env.lt - 0.3) / 0.35), 2) * tyOut(env);
      var s0 = cl(p, 0.01, 1.2);
      return { 'scale.x': s0, 'scale.y': s0, alpha: p > 0.01 ? tyOut(env) : 0 };
    });
  }
  return { mk: mk };
});

/* 40. tzNumStrip */
reg('tzNumStrip', 'src/11p_x2_typoA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = tyU(c), m = tyMG(c), fs = tyFS(c);
  var bb = H.decBB(c), cut = c.cut, src = cut.source || {}, vert = (H.p(P, 'v', 0) | 0) % 3 === 2 && W > Hh;
  var pitch = vert ? fs * 2.3 : fs * 3.5, L = vert ? Hh : W, k = Math.max(1, Math.min(5, Math.floor((L * 0.5 - m) / pitch - 0.5)));
  var cPos = 0, ok = false, ord = vert ? [!!P.right, !P.right] : [P.low !== false, P.low === false];
  for (var i = 0; i < ord.length; i++) {
    var ls = ord[i];
    cPos = vert ? (ls ? W - m - fs * 1.3 : m + fs * 1.3) : (ls ? Hh - m - fs * 0.5 : m + fs * 0.5);
    ok = vert ? !H.hitBB(cPos - fs * 1.6, Hh / 2 - (k + 1) * pitch, cPos + fs * 1.6, Hh / 2 + (k + 1) * pitch, bb, 8 * u)
      : !H.hitBB(W / 2 - (k + 1) * pitch, cPos - fs * 1.4, W / 2 + (k + 1) * pitch, cPos + fs * 1.4, bb, 8 * u);
    if (ok) break;
  }
  if (!ok) return { skipped: true };
  var idx = ((src.index != null ? src.index : 0) | 0) + 1;
  for (var j = -k - 1; j <= k + 1; j++) {
    (function (jj) {
      var num = idx + jj; if (num < 1) return;
      var cur = jj === 0, txt = String(num).padStart(3, '0');
      var bx = vert ? cPos : W / 2 + jj * pitch, by = vert ? Hh / 2 + jj * pitch : cPos;
      var scB = H.toScene(c, bx, by);
      tyLabel(c, 'tzNumStrip n' + jj, txt, bx, by, {
        size: fs * (cur ? 1.05 : 0.9), align: 'center', color: cur ? c.sc.fg : sub(c),
        animFn: function (env) {
          var slide = (1 - E.outExpo(cl(env.lt / 0.55))) * pitch, d = jj * pitch + slide;
          var f = cl(1 - Math.abs(d) / ((k + 0.6) * pitch)), a0 = E.outCubic(cl(env.lt / 0.3)) * tyOut(env);
          return vert ? { 'position.y': scB[1] - slide, alpha: (cur ? 1 : 0.55 * f) * a0 }
            : { 'position.x': scB[0] + slide, alpha: (cur ? 1 : 0.55 * f) * a0 };
        }
      });
    })(j);
  }
  var lw = Math.max(1.5, 2 * u), ac = acc(c);
  var ux = vert ? cPos + (cPos > W / 2 ? -1 : 1) * fs * 1.5 : W / 2, uy = vert ? Hh / 2 : cPos + (cPos > Hh / 2 ? -1 : 1) * fs * 1.0;
  var uSh = C.shape(c.graph, cut, cut.id + ' / tzNumStrip underline', c.parent, vert ? [['M', 0, fs * 0.8], ['L', 0, -fs * 0.8]] : [['M', -fs * 1.2, 0], ['L', fs * 1.2, 0]], {
    stroke: ac, width: lw, position: H.toScene(c, ux, uy)
  });
  C.sample(c.graph, uSh, cut.start, cut.end, function (f0) {
    var env = R.env(c, f0), e = E.outExpo(cl((env.lt - 0.2) / 0.5)) * tyOut(env);
    return vert ? { 'scale.y': Math.max(0.01, e), alpha: e > 0.01 ? 1 : 0 } : { 'scale.x': Math.max(0.01, e), alpha: e > 0.01 ? 1 : 0 };
  });
  return { idx: idx };
});

/* 41. tzDotLeader */
reg('tzDotLeader', 'src/11p_x2_typoA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = tyU(c), m = tyMG(c), fs = tyFS(c);
  var bb = H.decBB(c), cut = c.cut, src = cut.source || {}, cells = glyphCells(c, bb), g1 = cells[cells.length - 1], g0 = cells[0];
  var num = (H.p(P, 'v', 0) | 0) % 2 ? 'p.' + (((src.index | 0) + 1)) : pad2((src.line | 0) + 1);
  var ns = fs * 1.25, nw = tw(num, ns, 0.08), gap = 14 * u + Math.min(bb.w, bb.h) * 0.06;
  var dir = 0, xa = 0, xb = 0, y = 0;
  function tryR() { var a = bb.x1 + gap, b = W - m - nw - fs * 0.7; if (b - a > W * 0.07) { dir = 1; xa = a; xb = b; y = g1 ? g1.y + g1.h * 0.3 : bb.y1 - bb.h * 0.2; } }
  function tryL() { var a = bb.x0 - gap, b = m + nw + fs * 0.7; if (a - b > W * 0.07) { dir = -1; xa = a; xb = b; y = g0 ? g0.y + g0.h * 0.3 : bb.y0 + bb.h * 0.8; } }
  if (P.right === false) { tryL(); if (!dir) tryR(); } else { tryR(); if (!dir) tryL(); }
  if (!dir) return { skipped: true };
  y = cl(y, m, Hh - m);
  var pitch = Math.max(fs * 0.8, Math.abs(xb - xa) / 36), cnt = Math.min(36, Math.max(1, Math.floor(Math.abs(xb - xa) / pitch)));
  var r = Math.max(1.3 * u, fs * 0.08);
  for (var i = 0; i <= cnt; i++) {
    (function (ii) {
      var dId = H.rect(c, 'tzDotLeader d' + ii, xa + dir * ii * pitch - r, y - r, r * 2, r * 2, { fill: sub(c), alpha: 0.8 });
      C.sample(c.graph, dId, cut.start, cut.end, function (f0) {
        var env = R.env(c, f0), vis = Math.floor(cnt * E.outCubic(cl((env.lt - 0.1) / 0.8)));
        return { alpha: ii <= vis ? 0.8 * tyOut(env) : 0 };
      });
    })(i);
  }
  tyLabel(c, 'tzDotLeader num', num, dir > 0 ? W - m : m, y - ns * 0.12, {
    size: ns, align: dir > 0 ? 'right' : 'left', color: c.sc.fg,
    animFn: function (env) { return { alpha: E.outCubic(cl((env.lt - 0.75) / 0.3)) * tyOut(env) }; }
  });
  return { cnt: cnt };
});

/* 42. tzEmBox */
reg('tzEmBox', 'src/11p_x2_typoA.js', function (c) {
  var P = c.preset.params || {}, u = tyU(c), bb = H.decBB(c), cells = glyphCells(c, bb).slice(0, 28);
  var lw = Math.max(1, u), fs = tyFS(c) * 0.8, pad = 1.02 + ((H.p(P, 'v', 0) | 0) % 2) * 0.05;
  cells.forEach(function (g, i) {
    var hw = g.w * pad / 2, hh = g.h * pad / 2, t = Math.max(4 * u, Math.min(hw, hh) * 0.09);
    var scG = H.toScene(c, g.x, g.y);
    var rig = c.graph.add('null', c.cut.id + ' / tzEmBox r' + i, c.parent, c.cut.start, c.cut.end, { position: scG });
    var box = C.shape(c.graph, c.cut, c.cut.id + ' / tzEmBox box ' + i, rig, G.rect(-hw, -hh, hw * 2, hh * 2), { stroke: sub(c), width: lw, alpha: 0.6 });
    var tickCmds = [
      ['M', 0, hh], ['L', 0, hh + t], ['M', 0, -hh], ['L', 0, -hh - t],
      ['M', -hw, 0], ['L', -hw + t * 0.6, 0], ['M', hw, 0], ['L', hw - t * 0.6, 0]
    ];
    var tks = C.shape(c.graph, c.cut, c.cut.id + ' / tzEmBox tk ' + i, rig, tickCmds, { stroke: sub(c), width: lw, alpha: 0.8 });
    C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
      var e = E.outExpo(cl((R.env(c, f0).lt - 0.1 - i * 0.035) / 0.6));
      return { 'scale.x': Math.max(0.02, e), 'scale.y': Math.max(0.02, e) };
    });
    C.sample(c.graph, box, c.cut.start, c.cut.end, function (f0) { return { alpha: 0.6 * tyOut(R.env(c, f0)) * E.outExpo(cl((R.env(c, f0).lt - 0.1 - i * 0.035) / 0.6)) }; });
    C.sample(c.graph, tks, c.cut.start, c.cut.end, function (f0) { return { alpha: 0.8 * tyOut(R.env(c, f0)) * E.outExpo(cl((R.env(c, f0).lt - 0.1 - i * 0.035) / 0.6)) }; });
  });
  var g0 = cells[0];
  if (g0 && g0.y - g0.h * pad / 2 - fs * 2.2 > 0) {
    tyLabel(c, 'tzEmBox lbl', 'EM ' + Math.round(Math.max(g0.w, g0.h) / u), g0.x - g0.w * pad / 2, g0.y - g0.h * pad / 2 - fs * 1.3, {
      size: fs, color: P.accent ? acc(c) : sub(c),
      animFn: function (env) { return { alpha: 0.9 * E.outCubic(cl((env.lt - 0.35) / 0.3)) * tyOut(env) }; }
    });
  }
  return { count: cells.length };
});

/* 43. tzCornerNums */
reg('tzCornerNums', 'src/11p_x2_typoA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = tyU(c), m = tyMG(c), fs = tyFS(c);
  var bb = H.decBB(c), cut = c.cut, src = cut.source || {}, chCnt = Array.from(cutText(c).replace(/\s+/g, '')).length;
  var items = [
    [0, 0, 'L.' + pad2((src.line | 0) + 1)],
    [1, 0, null],
    [0, 1, pad2(chCnt) + ' CH'],
    [1, 1, String(((src.index | 0) + 1)).padStart(3, '0')]
  ];
  var two = (H.p(P, 'n', 1) | 0) <= 1, lw = Math.max(1, u), ac = acc(c);
  items.forEach(function (it, i) {
    var r = it[0], b = it[1], tStr = it[2];
    if (two && (P.right ? r === b : r !== b)) return;
    var x = r ? W - m : m, y = b ? Hh - m - fs * 0.5 : m + fs * 0.5;
    var w = tw(tStr || '00:00.00', fs, 0.12) + fs;
    if (H.hitBB(r ? x - w : x, y - fs * 1.6, r ? x : x + w, y + fs * 1.6, bb, 8 * u)) return;
    var yl = y + (b ? -1 : 1) * fs * 1.05, d = r ? -1 : 1;
    var rRig = c.graph.add('null', cut.id + ' / tzCornerNums rrig ' + i, c.parent, cut.start, cut.end, { position: H.toScene(c, x, yl) });
    var rId = C.shape(c.graph, cut, cut.id + ' / tzCornerNums r' + i, rRig, [['M', 0, 0], ['L', d * fs * 2.6, 0]], {
      stroke: i === 0 ? ac : sub(c), width: i === 0 ? Math.max(1.5, 2 * u) : lw, alpha: 0.9
    });
    C.sample(c.graph, rRig, cut.start, cut.end, function (f0) { return { 'scale.x': Math.max(0.01, E.outExpo(cl((R.env(c, f0).lt - i * 0.07) / 0.5))) }; });
    C.sample(c.graph, rId, cut.start, cut.end, function (f0) { return { alpha: 0.9 * tyOut(R.env(c, f0)) }; });
    if (i === 1) {
      H.stepText(c, 'tzCornerNums time', x, y, fs, {
        role: 'mono', align: 'right', color: c.sc.fg,
        animFn: function (env) { return { alpha: 0.95 * E.outExpo(cl((env.lt - i * 0.07) / 0.5)) * tyOut(env) }; }
      }, function (env) { return fmtTime(cut.origin / c.comp.fps + env.lt); }, 10);
    } else {
      var arr = Array.from(tStr);
      H.stepText(c, 'tzCornerNums t' + i, x, y, fs, {
        role: 'mono', align: r ? 'right' : 'left', color: sub(c),
        animFn: function (env) { return { alpha: 0.95 * E.outExpo(cl((env.lt - i * 0.07) / 0.5)) * tyOut(env) }; }
      }, function (env) {
        var k = Math.ceil(arr.length * cl((env.lt - 0.1 - i * 0.07) / 0.35));
        return k > 0 ? arr.slice(0, k).join('') : '';
      }, arr.length + 1);
    }
  });
  return { count: items.length };
});

/* 44. tzReadCaret */
reg('tzReadCaret', 'src/11p_x2_typoA.js', function (c) {
  var W = c.comp.width, Hh = c.comp.height, u = tyU(c), m = tyMG(c), fs = tyFS(c) * 0.88;
  var bb = H.decBB(c), cut = c.cut, cells = glyphCells(c, bb), n = cells.length; if (!n) return { empty: true };
  var vert = !!cells.vert, ac = acc(c), dur = (cut.sourceEnd - cut.origin) / c.comp.fps;
  var g0 = cells[0], t = cl((vert ? g0.w : g0.h) * 0.1, 7 * u, 14 * u), gap = 8 * u + t;
  function evalCaret(env) {
    var f = cl((env.lt - 0.1) / Math.max(0.3, dur * 0.86 - 0.1)) * n, i = Math.min(n - 1, Math.floor(f));
    var k = E.outCubic(cl((f - i) * 3.5)), g = cells[i], p = cells[Math.max(0, i - 1)];
    var far = vert ? Math.abs(g.x - p.x) > g.w * 0.5 : Math.abs(g.y - p.y) > g.h * 0.5, kk = far ? 1 : k;
    var x = vert ? mix(p.x, g.x, kk) + (g.x + g.w / 2 + gap + t * 2 + fs * 3 < W - m * 0.4 ? 1 : -1) * (g.w / 2 + gap) : mix(p.x, g.x, kk);
    var y = vert ? mix(p.y, g.y, kk) : mix(p.y + p.h / 2, g.y + g.h / 2, kk) + gap;
    var side = g.x + g.w / 2 + gap + t * 2 + fs * 3 < W - m * 0.4 ? 1 : -1;
    return { i: i, g: g, x: x, y: y, side: side, a: E.outBack(cl(env.lt / 0.35), 1.8) * tyOut(env) };
  }
  var cPts = vert ? [[0, 0], [t * 1.7, t], [t * 1.7, -t]] : [[0, 0], [-t, -t * 1.7], [t, -t * 1.7]];
  var caret = C.shape(c.graph, cut, cut.id + ' / tzReadCaret tri', c.parent, cPts.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }).concat([['Z']]), {
    fill: ac
  });
  C.sample(c.graph, caret, cut.start, cut.end, function (f0) {
    var r = evalCaret(R.env(c, f0)), scP = H.toScene(c, r.x, r.y);
    return { 'position.x': scP[0], 'position.y': scP[1], 'scale.x': vert ? r.side : 1, alpha: cl(r.a) };
  });
  if (!vert && g0.y + g0.h / 2 + gap + t * 2 <= Hh - m * 0.4) {
    var rLine = H.line(c, 'tzReadCaret rule', [[bb.x0, bb.y1 + gap - t * 0.35], [bb.x1, bb.y1 + gap - t * 0.35]], sub(c), Math.max(1, u), 0.5);
    C.sample(c.graph, rLine, cut.start, cut.end, function (f0) { return { alpha: 0.5 * tyOut(R.env(c, f0)) }; });
  }
  H.stepText(c, 'tzReadCaret cnt', g0.x, g0.y + gap + t * 2 + fs, fs, {
    role: 'mono', align: vert ? 'left' : 'center', color: sub(c),
    animFn: function (env) {
      var r = evalCaret(env);
      var lx = vert ? r.x + r.side * (t * 1.7 + fs * 0.5) : r.x, ly = vert ? r.y : r.y + t * 1.7 + fs * 0.95;
      var scL = H.toScene(c, lx, ly);
      return { 'position.x': scL[0], 'position.y': scL[1], alpha: cl(r.a) * 0.9 };
    }
  }, function (env) {
    var r = evalCaret(env);
    return pad2(r.i + 1) + '/' + pad2(n);
  }, Math.min(12, n + 1));
  return { n: n };
});

/* ==================== WA X2 (10 wz* from 11p_x2_waA.js) ==================== */

function wzStartT(c) { return cl(((c.cut.inFrames / c.comp.fps) || 0) * 0.5, 0, 0.3); }
function wzEin(t, d, delay, ease) { return (ease || E.outExpo)(cl((t - (delay || 0)) / (d || 0.4))); }
function wzEback(t, d, delay, s) {
  var k = cl((t - (delay || 0)) / (d || 0.4));
  return k <= 0 ? 0 : k >= 1 ? 1 : E.outBack(k, s || 1.6);
}
function wzSpotFit(c, bb, w, h, P, gap) {
  var ks = [1, 0.78, 0.6, 0.46];
  for (var i = 0; i < ks.length; i++) {
    var k = ks[i], sp = P.corner ? H.cornerSpot(c, bb, w * k, h * k, P, 0.7) : H.nearBB(c, bb, w * k, h * k, P, gap * k);
    if (sp.ok) return { x: sp.x, y: sp.y, cx: sp.cx, cy: sp.cy, k: k };
  }
  return null;
}

/* 45. wzShippo */
reg('wzShippo', 'src/11p_x2_waA.js', function (c) {
  var P = c.preset.params || {}, u = tyU(c), bb = H.decBB(c), r = 30 * u * (P.big ? 1.3 : 1), shape = (H.p(P, 'v', 0) | 0) % 3;
  var w0 = shape === 0 ? r * 6.2 : shape === 1 ? cl(bb.w * 0.8, r * 8, c.comp.width * 0.7) : r * 8;
  var h0 = shape === 0 ? r * 6.2 : shape === 1 ? r * 3 : r * 4.4;
  var sp = wzSpotFit(c, bb, w0, h0, P, 26 * u); if (!sp) return { skipped: true };
  var w = w0 * sp.k, h = h0 * sp.k, x0 = sp.x, y0 = sp.y, cCol = P.accent ? acc(c) : c.sc.fg, ac = P.accent ? c.sc.fg : acc(c);
  var s0 = wzStartT(c), scC = H.toScene(c, x0 + w / 2, y0 + h / 2), mo = H.motionAmt(c);
  var ni = Math.min(18, Math.ceil(w / r) + 3), nj = Math.min(14, Math.ceil(h / r) + 3);
  var rings = [], dots = [];
  for (var j = -1; j < nj; j++) {
    for (var i = -1; i < ni; i++) {
      if ((i + j) & 1) continue;
      var cx = x0 + i * r, cy = y0 + j * r;
      if (cx + r < x0 || cx - r > x0 + w || cy + r < y0 || cy - r > y0 + h) continue;
      if (shape === 0 && Math.hypot(cx - (x0 + w / 2), cy - (y0 + h / 2)) > w / 2 + r * 0.5) continue;
      rings.push([cx, cy, r]);
      dots.push([cx, cy, r * 0.17, i + j]);
    }
  }
  var ringSh = C.shape(c.graph, c.cut, c.cut.id + ' / wzShippo rings', c.parent, H.ringCmds(c, rings, 20), { stroke: cCol, width: 2 * u, alpha: 0.85 });
  var dotSh = C.shape(c.graph, c.cut, c.cut.id + ' / wzShippo dots', c.parent, H.dotCmds(c, dots.map(function (d) { return [d[0], d[1], d[2]]; })), { fill: ac, alpha: 0.85 });
  var borderCmds = shape === 0 ? H.ringCmds(c, [[x0 + w / 2, y0 + h / 2, w / 2]], 36) : H.rectCmds(c, [[x0, y0, w, h]]);
  var borderSh = C.shape(c.graph, c.cut, c.cut.id + ' / wzShippo border', c.parent, borderCmds, { stroke: cCol, width: 3 * u });
  var clipFrames = [];
  for (var f = c.cut.start; f < c.cut.end; f++) {
    var env = R.env(c, f), t = env.lt - s0, e = wzEin(t, 0.6, 0, E.inOutCubic);
    if (shape === 0) {
      var rad = Math.max(2, w / 2 * e), pts = [];
      for (var k = 0; k < 24; k++) { var a = k / 24 * TAU; pts.push([scC[0] + Math.cos(a) * rad, scC[1] + Math.sin(a) * rad]); }
      clipFrames.push(pts);
    } else {
      var sx = scC[0] - w / 2 + (P.right ? w * (1 - e) : 0), ww = Math.max(2, w * e);
      clipFrames.push([[sx, scC[1] - h / 2], [sx + ww, scC[1] - h / 2], [sx + ww, scC[1] + h / 2], [sx, scC[1] + h / 2]]);
    }
  }
  [ringSh, dotSh, borderSh].forEach(function (id, idx) {
    if (idx < 2) V.clipDeformer(c.graph, id, clipFrames, false, 'Shippo clip', c.options);
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
      var env = R.env(c, f0), t = env.lt - s0, o = 1 - E.inCubic(env.pOut || 0);
      var ox = idx < 2 ? wrap(env.ltb * 7 * u * mo, 2 * r) - r : 0;
      return t > 0 ? { 'position.x': ox, alpha: (idx < 2 ? 0.85 : 1) * o } : { alpha: 0 };
    });
  });
  return { rings: rings.length };
});

/* 46. wzYagasuri */
reg('wzYagasuri', 'src/11p_x2_waA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = tyU(c), m = tyMG(c) * 0.7;
  var bb = H.decBB(c), sw = 46 * u * (P.big ? 1.3 : 1), gap = 14 * u, g0 = 30 * u, horiz = false, plus = !!P.right;
  var fr = [W - m - bb.x1 - g0, bb.x0 - g0 - m, Hh - m - bb.y1 - g0, bb.y0 - g0 - m];
  if ((plus ? fr[0] : fr[1]) < sw) plus = !plus;
  var free = plus ? fr[0] : fr[1];
  if (free < sw) { horiz = true; plus = !!P.low; if ((plus ? fr[2] : fr[3]) < sw) plus = !plus; free = plus ? fr[2] : fr[3]; if (free < sw) return { skipped: true }; }
  var n = Math.max(1, Math.min(cl(H.p(P, 'n', 1) | 0, 1, 3), Math.floor((free + gap) / (sw + gap)))), AM = horiz ? W : Hh;
  var h = horiz ? cl(bb.w * 1.02, 280 * u, W - m * 2) : cl(bb.h * 1.25, 280 * u, Hh * 0.8);
  var mid = cl(horiz ? bb.cx : bb.cy, h / 2 + m, Math.max(h / 2 + m, AM - h / 2 - m));
  var cCol = P.accent ? acc(c) : c.sc.fg, ph = sw * 0.8, e0 = horiz ? (plus ? bb.y1 : bb.y0) : (plus ? bb.x1 : bb.x0);
  var s0 = wzStartT(c), mo = H.motionAmt(c);
  for (var k = 0; k < n; k++) {
    (function (kk) {
      var ec = e0 + (plus ? 1 : -1) * (g0 + sw / 2 + kk * (sw + gap)), dir = kk % 2 ? -1 : 1, x0 = -sw / 2;
      var scPos = horiz ? H.toScene(c, mid, ec) : H.toScene(c, ec, mid);
      var rig = c.graph.add('null', c.cut.id + ' / wzYagasuri r' + kk, c.parent, c.cut.start, c.cut.end, {
        position: scPos, rotation: horiz ? 90 : 0
      });
      var bL = C.shape(c.graph, c.cut, c.cut.id + ' / wzYagasuri bL' + kk, rig, G.rect(x0 - 3 * u, -h / 2, 2 * u, h), { fill: cCol });
      var bR = C.shape(c.graph, c.cut, c.cut.id + ' / wzYagasuri bR' + kk, rig, G.rect(x0 + sw + u, -h / 2, 2 * u, h), { fill: cCol });
      var sl = dir * sw * 0.5, gp = 1.5 * u, chevPolys = [];
      for (var y = -h / 2 - ph * 2; y < h / 2 + ph * 2; y += ph * 2) {
        chevPolys.push([[x0, -y], [-gp, -(y + sl)], [-gp, -(y + sl + ph)], [x0, -(y + ph)]]);
        chevPolys.push([[x0 + sw, -y], [gp, -(y + sl)], [gp, -(y + sl + ph)], [x0 + sw, -(y + ph)]]);
      }
      var chevCmds = [];
      chevPolys.forEach(function (poly) {
        poly.forEach(function (pt, i) { chevCmds.push([i ? 'L' : 'M', pt[0], pt[1]]); });
        chevCmds.push(['Z']);
      });
      var chev = C.shape(c.graph, c.cut, c.cut.id + ' / wzYagasuri ch' + kk, rig, chevCmds, {
        fill: kk === 1 && !P.accent ? acc(c) : cCol, alpha: 0.85
      });
      var clipF = [];
      for (var f = c.cut.start; f < c.cut.end; f++) {
        var env = R.env(c, f), t = env.lt - s0, e = wzEin(t, 0.55, kk * 0.09), hh = Math.max(2, h * e);
        var cx = scPos[0], cy = scPos[1];
        clipF.push(horiz ? [[cx - hh / 2, cy - sw / 2], [cx + hh / 2, cy - sw / 2], [cx + hh / 2, cy + sw / 2], [cx - hh / 2, cy + sw / 2]]
          : [[cx - sw / 2, cy - hh / 2], [cx + sw / 2, cy - hh / 2], [cx + sw / 2, cy + hh / 2], [cx - sw / 2, cy + hh / 2]]);
      }
      V.clipDeformer(c.graph, chev, clipF, false, 'Yagasuri clip', c.options);
      [bL, bR].forEach(function (id) {
        C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
          var env = R.env(c, f0), t = env.lt - s0, o = 1 - E.inCubic(env.pOut || 0), e = wzEin(t, 0.55, kk * 0.09);
          return { 'scale.y': Math.max(0.01, e), alpha: t > 0 ? o : 0 };
        });
      });
      C.sample(c.graph, chev, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), t = env.lt - s0, o = 1 - E.inCubic(env.pOut || 0);
        var off = wrap(env.ltb * 22 * u * mo * dir, ph * 2);
        return { 'position.y': -off, alpha: t > 0 ? 0.85 * o : 0 };
      });
    })(k);
  }
  return { count: n };
});

/* 47. wzUroko */
reg('wzUroko', 'src/11p_x2_waA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = tyU(c), m = tyMG(c) * 0.7;
  var bb = H.decBB(c), b = 42 * u * (P.big ? 1.3 : 1), th = b * 0.82, g0 = 24 * u;
  var roomB = Hh - m - bb.y1 - g0, roomT = bb.y0 - g0 - m, low = !!P.low;
  if ((low ? roomB : roomT) < th) low = !low;
  var room = low ? roomB : roomT; if (room < th) return { skipped: true };
  var rows = Math.max(1, Math.min(cl(H.p(P, 'n', 1) | 0, 1, 3), Math.floor(room / th))), wd = cl(bb.w, 5 * b, W - m * 2);
  var n = Math.min(20, Math.floor(wd / b)), x0 = cl(bb.cx - n * b / 2, m, Math.max(m, W - m - n * b));
  var cCol = P.accent ? acc(c) : c.sc.fg, ac = P.accent ? c.sc.fg : acc(c), s0 = wzStartT(c), mo = H.motionAmt(c);
  for (var r = 0; r < rows; r++) {
    var cnt = n - (r % 2), yb = low ? bb.y1 + g0 + (r + 1) * th : bb.y0 - g0 - r * th, col = r % 2 ? ac : cCol;
    for (var i = 0; i < cnt; i++) {
      (function (rr0, ii, yyB, ccCol, cnt0) {
        var idx = P.right ? cnt0 - 1 - ii : ii, cx = x0 + (ii + 0.5 + (rr0 % 2) * 0.5) * b, cyy = yyB - th / 3;
        var triCmds = [['M', 0, th * 2 / 3], ['L', b / 2, -th / 3], ['L', -b / 2, -th / 3], ['Z']];
        var sh = C.shape(c.graph, c.cut, c.cut.id + ' / wzUroko ' + rr0 + '_' + ii, c.parent, triCmds, {
          fill: ccCol, position: H.toScene(c, cx, cyy)
        });
        C.sample(c.graph, sh, c.cut.start, c.cut.end, function (f0) {
          var env = R.env(c, f0), t = env.lt - s0, o = 1 - E.inCubic(env.pOut || 0);
          var e = wzEback(t, 0.3, idx * 0.022 + rr0 * 0.1) * o;
          if (e <= 0.01) return { 'scale.x': 0.01, 'scale.y': 0.01, alpha: 0 };
          var al = Math.min(1, o * (0.62 + 0.38 * Math.sin(env.ltb * 3 * (0.4 + mo) - idx * 0.5 - rr0)));
          return { 'scale.x': e, 'scale.y': e, alpha: al };
        });
      })(r, i, yb, col, cnt);
    }
  }
  return { rows: rows };
});

/* 48. wzMizuhiki */
reg('wzMizuhiki', 'src/11p_x2_waA.js', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = tyU(c), bb = H.decBB(c), s00 = 112 * u * (P.big ? 1.25 : 1);
  var sp = wzSpotFit(c, bb, s00 * 3.1, s00 * 2.1, P, 26 * u); if (!sp) return { skipped: true };
  var s = s00 * sp.k, cx = sp.x + s * 1.55, cy = sp.y + s * 1.1, cA = acc(c), cB = sc.fg === cA ? sub(c) : sc.fg;
  var lw = 4.2 * u * Math.max(0.7, sp.k), s0 = wzStartT(c), mo = H.motionAmt(c), scP = H.toScene(c, cx, cy);
  var rig = c.graph.add('null', c.cut.id + ' / wzMizuhiki rig', c.parent, c.cut.start, c.cut.end, { position: scP });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
    var env = R.env(c, f0), t = env.lt - s0;
    return { 'position.y': scP[1] - Math.sin(env.ltb * 1.4) * 3 * u * mo, alpha: t > 0 ? 1 - E.inCubic(env.pOut || 0) : 0 };
  });
  for (var k = 0; k < 3; k++) {
    var q = 1 - k * 0.17;
    [-1, 1].forEach(function (d) {
      var loopCol = d < 0 ? cA : cB, tilt = d * 0.42;
      var lPts = H.arcPts(0, 0, 1, 0, 360, 28).map(function (pt) {
        var lx = pt[0] * s * 0.5 * q, ly = pt[1] * s * 0.37 * q;
        return [d * s * 0.47 + lx * Math.cos(tilt) - ly * Math.sin(tilt), -(s * 0.1 + lx * Math.sin(tilt) + ly * Math.cos(tilt))];
      });
      var lSh = C.shape(c.graph, c.cut, c.cut.id + ' / wzMizuhiki L' + k + '_' + d, rig, lPts.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }).concat([['Z']]), {
        stroke: loopCol, width: lw
      });
      var p0x = d * s * 0.2, p0y = s * 0.42, cpx = d * s * (0.9 + k * 0.05), cpy = s * (0.75 - k * 0.1);
      var p1x = d * s * (1.4 + k * 0.05), p1y = s * (-0.15 - k * 0.14), tailPts = [];
      for (var t = 0; t <= 12; t++) {
        var f = t / 12, mf = 1 - f;
        var qx = mf * mf * p0x + 2 * mf * f * cpx + f * f * p1x, qy = mf * mf * p0y + 2 * mf * f * cpy + f * f * p1y;
        tailPts.push([qx, -qy]);
      }
      var tSh = C.shape(c.graph, c.cut, c.cut.id + ' / wzMizuhiki T' + k + '_' + d, rig, tailPts.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }), {
        stroke: loopCol, width: lw
      });
      C.sample(c.graph, lSh, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), t = env.lt - s0, e1 = wzEin(t, 0.7, 0, E.inOutCubic);
        return { 'scale.x': Math.max(0.01, e1), 'scale.y': Math.max(0.01, e1), alpha: t > 0 ? 1 - E.inCubic(env.pOut || 0) : 0 };
      });
      C.sample(c.graph, tSh, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), t = env.lt - s0, e2 = wzEin(t, 0.5, 0.35, E.outCubic);
        return { 'scale.x': Math.max(0.01, e2), 'scale.y': Math.max(0.01, e2), alpha: e2 > 0.01 ? 1 - E.inCubic(env.pOut || 0) : 0 };
      });
    });
    var topPts = H.arcPts(0, 0, 1, 0, 360, 26).map(function (pt) { return [pt[0] * s * 0.52 * q, s * 0.3 + pt[1] * s * 0.42 * q]; });
    var topSh = C.shape(c.graph, c.cut, c.cut.id + ' / wzMizuhiki top' + k, rig, topPts.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }).concat([['Z']]), {
      stroke: k % 2 ? cA : cB, width: lw
    });
    C.sample(c.graph, topSh, c.cut.start, c.cut.end, function (f0) {
      var env = R.env(c, f0), t = env.lt - s0, e1 = wzEin(t, 0.7, 0, E.inOutCubic);
      return { 'scale.x': Math.max(0.01, e1), 'scale.y': Math.max(0.01, e1), alpha: t > 0 ? 1 - E.inCubic(env.pOut || 0) : 0 };
    });
  }
  return { cx: cx, cy: cy };
});

/* 49. wzRyusui */
reg('wzRyusui', 'src/11p_x2_waA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, u = tyU(c), bb = H.decBB(c), n0 = c.graph.layers.length;
  var L = 3 + cl(H.p(P, 'n', 1) | 0, 1, 3), xa = Math.max(-20 * u, bb.x0 - 200 * u), xb = Math.min(W + 20 * u, bb.x1 + 200 * u);
  var len = xb - xa, sp = 26 * u * (P.big ? 1.3 : 1), s = H.p(P, 'seed', 1) | 0, s0 = wzStartT(c), mo = H.motionAmt(c);
  var y0 = (P.low ? bb.y1 : bb.y0) - (L - 1) * sp / 2, lam = 150 * u, A = 15 * u;
  for (var i = 0; i < L; i++) {
    (function (ii) {
      var startX = xa + len * 0.28 * R.hash01(s, ii, 1), endX = xb - len * 0.28 * R.hash01(s, ii, 2);
      var col = ii === 1 ? acc(c) : sub(c), lw = (ii % 2 ? 2.6 : 3.8) * u, baseA = ii === 1 ? 0.8 : 0.55;
      var scO = H.toScene(c, startX, y0 + ii * sp);
      var pts = [];
      for (var x = startX; x <= endX; x += 14 * u) {
        var yy = A * Math.sin(x / lam + ii * 0.25) + A * 0.4 * Math.sin(x / lam * 2.3);
        pts.push([x - startX, -yy]);
      }
      if (ii % 2 === 0 && pts.length) {
        var last = pts[pts.length - 1], cr = 16 * u;
        for (var a = 0; a <= 12; a++) {
          var an = a / 12 * 4.6, rr0 = cr * (1 - a / 18);
          pts.push([last[0] + Math.sin(an) * rr0, last[1] + cr - Math.cos(an) * rr0 - (cr - rr0) * 0.4]);
        }
      }
      var sh = C.shape(c.graph, c.cut, c.cut.id + ' / wzRyusui ' + ii, c.parent, pts.map(function (p, idx) { return [idx ? 'L' : 'M', p[0], p[1]]; }), {
        stroke: col, width: lw, position: scO, alpha: baseA
      });
      C.sample(c.graph, sh, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), t = env.lt - s0, o = 1 - E.inCubic(env.pOut || 0);
        var e = wzEin(t, 0.8, ii * 0.07, E.inOutCubic), dx = Math.sin(env.ltb * 0.9 * (0.3 + mo) + ii) * 10 * u * (P.right ? -1 : 1);
        return { 'position.x': scO[0] + dx, 'scale.x': Math.max(0.01, e), alpha: t > 0 ? baseA * o : 0 };
      });
    })(i);
  }
  H.placeBackFrom(c, n0);
  return { L: L };
});

/* 50. wzYukiwa */
reg('wzYukiwa', 'src/11p_x2_waA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = tyU(c), m = tyMG(c), bb = H.decBB(c);
  var n0 = c.graph.layers.length, n = 2 + cl(H.p(P, 'n', 1) | 0, 1, 3), cCol = P.accent ? acc(c) : c.sc.fg;
  var s = H.p(P, 'seed', 1) | 0, rParam = H.p(P, 'r', 0.5), s0 = wzStartT(c), mo = H.motionAmt(c);
  function yukiwaPts(R0) {
    var N = 48, out = [];
    for (var i = 0; i < N; i++) {
      var th = i / N * TAU, u0 = (th / (TAU / 6)) % 1, d = Math.min(u0, 1 - u0) * (TAU / 6);
      var rad = R0 * (1 - 0.17 * Math.exp(-(d / 0.075) * (d / 0.075)));
      out.push([Math.cos(th) * rad, -Math.sin(th) * rad]);
    }
    return out;
  }
  for (var k = 0; k < n; k++) {
    (function (kk) {
      var R0 = (46 + 60 * R.hash01(s, kk, 1)) * u * (P.big ? 1.3 : 1);
      var a = (kk / n + rParam) * TAU + rs(s, kk, 2) * 0.3;
      var x = cl(bb.cx + Math.cos(a) * (bb.w / 2 + R0 * 1.05), m + R0, W - m - R0);
      var y = cl(bb.cy + Math.sin(a) * (bb.h / 2 + R0 * 1.05), m + R0, Hh - m - R0);
      var scP = H.toScene(c, x, y);
      var rig = c.graph.add('null', c.cut.id + ' / wzYukiwa r' + kk, c.parent, c.cut.start, c.cut.end, { position: scP });
      var yPts = yukiwaPts(R0);
      C.shape(c.graph, c.cut, c.cut.id + ' / wzYukiwa crest ' + kk, rig, yPts.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }).concat([['Z']]), {
        fill: cCol, stroke: cCol, width: 2.2 * u, alpha: 0.6
      });
      var spk = [];
      for (var i = 0; i < 6; i++) {
        var an = i / 6 * TAU;
        spk.push(['M', Math.cos(an) * R0 * 0.2, -Math.sin(an) * R0 * 0.2], ['L', Math.cos(an) * R0 * 0.62, -Math.sin(an) * R0 * 0.62]);
      }
      C.shape(c.graph, c.cut, c.cut.id + ' / wzYukiwa spokes ' + kk, rig, spk, { stroke: kk === 0 ? acc(c) : cCol, width: 2 * u, alpha: 0.5 });
      C.shape(c.graph, c.cut, c.cut.id + ' / wzYukiwa hub ' + kk, rig, G.ellipse(0, 0, R0 * 0.1, R0 * 0.1), { fill: kk === 0 ? acc(c) : cCol, alpha: 0.5 });
      C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), t = env.lt - s0, o = 1 - E.inCubic(env.pOut || 0);
        var e = wzEback(t, 0.5, kk * 0.1, 1.3), dy = Math.sin(env.ltb * 0.9 + kk * 2) * 6 * u * mo;
        var rot = (kk % 2 ? -1 : 1) * env.ltb * 0.16 * (0.3 + mo) / DEG + kk * 57;
        return { 'position.y': scP[1] - dy, 'scale.x': Math.max(0.01, e), 'scale.y': Math.max(0.01, e), rotation: -rot, alpha: e > 0.01 ? 0.65 * o : 0 };
      });
    })(k);
  }
  H.placeBackFrom(c, n0);
  return { count: n };
});

/* 51. wzChidori */
reg('wzChidori', 'src/11p_x2_waA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = tyU(c), m = tyMG(c) * 0.7;
  var bb = H.decBB(c), n = 2 + cl(H.p(P, 'n', 1) | 0, 1, 3), sz = 44 * u * (P.big ? 1.25 : 1), need = sz * 2.9;
  var up = !P.low; if ((up ? bb.y0 - m : Hh - m - bb.y1) < need) up = !up;
  if ((up ? bb.y0 - m : Hh - m - bb.y1) < need) return { skipped: true };
  var yb = up ? bb.y0 - sz * 1.1 : bb.y1 + sz * 1.9, xa = Math.max(m + sz, bb.x0 - 60 * u), xb = Math.min(W - m - sz, bb.x1 + 60 * u);
  var dir = P.right ? 1 : -1, cCol = P.accent ? acc(c) : c.sc.fg, s = H.p(P, 'seed', 1) | 0, s0 = wzStartT(c), mo = H.motionAmt(c);
  for (var k = 0; k < n; k++) {
    (function (kk) {
      var rig = c.graph.add('null', c.cut.id + ' / wzChidori ' + kk, c.parent, c.cut.start, c.cut.end, {});
      var birdCol = kk === 1 ? acc(c) : cCol;
      C.shape(c.graph, c.cut, c.cut.id + ' / wzChidori body ' + kk, rig, G.ellipse(0, 0, 0.5 * sz, 0.5 * sz), { fill: birdCol });
      var polyOf = function (pts, nm, col) {
        var cmds = pts.map(function (p, i) { return [i ? 'L' : 'M', p[0] * sz, -p[1] * sz]; }).concat([['Z']]);
        return C.shape(c.graph, c.cut, c.cut.id + ' / wzChidori ' + nm + kk, rig, cmds, { fill: col || birdCol });
      };
      polyOf([[0.4, -0.16], [0.92, -0.02], [0.4, 0.14]], 'beak');
      var w1 = polyOf([[-0.05, -0.3], [-0.5, -1.15], [0.32, -0.4]], 'w1');
      var w2 = polyOf([[-0.28, -0.25], [-1.2, -0.62], [-0.38, 0.12]], 'w2');
      polyOf([[-0.36, 0.1], [-0.98, 0.42], [-0.25, 0.42]], 'tail');
      C.shape(c.graph, c.cut, c.cut.id + ' / wzChidori eye ' + kk, rig, G.ellipse(0.2 * sz, 0.12 * sz, 0.08 * sz, 0.08 * sz), { fill: c.sc.bg });
      var scaleK = 0.8 + 0.4 * R.hash01(s, kk, 1);
      C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), t = env.lt - s0, o = 1 - E.inCubic(env.pOut || 0);
        var f = wrap((kk + 0.5) / n + env.ltb * 0.03 * (0.3 + mo), 1);
        var e = wzEback(t, 0.4, kk * 0.08) * o * cl(Math.sin(f * Math.PI) * 4);
        var x = dir > 0 ? mix(xa, xb, f) : mix(xb, xa, f);
        var y = yb - Math.sin(f * Math.PI) * sz * 0.6 * (up ? 1 : -0.5) + Math.sin(env.ltb * 2.3 + kk * 1.7) * 5 * u * mo;
        var scP = H.toScene(c, x, y), rot = (-0.15 + 0.1 * Math.sin(env.ltb * 1.6 + kk)) / DEG;
        var sF = Math.max(0.01, scaleK * e);
        return { 'position.x': scP[0], 'position.y': scP[1], 'scale.x': dir * sF, 'scale.y': sF, rotation: -rot, alpha: cl(e) };
      });
      [w1, w2].forEach(function (wid) {
        C.sample(c.graph, wid, c.cut.start, c.cut.end, function (f0) {
          var env = R.env(c, f0), fl = 1 + 0.3 * Math.sin(env.ltb * 7 * (0.4 + mo) + kk * 2.1);
          return { 'scale.y': fl };
        });
      });
    })(k);
  }
  return { count: n };
});

/* 52. wzUme */
reg('wzUme', 'src/11p_x2_waA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = tyU(c), bb = H.decBB(c);
  var S = 400 * u * (P.big ? 1.25 : 1), best = null;
  [[P.right, P.low], [!P.right, P.low], [P.right, !P.low], [!P.right, !P.low]].forEach(function (pair) {
    var r = pair[0], l = pair[1], ax = (r ? W - bb.x1 : bb.x0) - 22 * u, ay = (l ? Hh - bb.y1 : bb.y0) - 22 * u, sc0 = Math.max(ax, ay);
    if (!best || (sc0 > best.sc * 1.6 && best.sc < 150 * u)) best = { sc: sc0, ax: ax, ay: ay, r: r, l: l };
  });
  if (!best || best.sc < 90 * u) return { skipped: true };
  var byX = best.ax >= best.ay, cx0 = best.r ? W : 0, cy0 = best.l ? Hh : 0, sx = best.r ? -1 : 1, sy = best.l ? -1 : 1;
  var cw = byX ? Math.min(S, best.ax) : Math.min(S, W * 0.5), ch = byX ? Math.min(S, Hh * 0.5) : Math.min(S, best.ay);
  var X = function (ux, uy) { return [cx0 + sx * ux * cw, cy0 + sy * uy * ch]; }, k = Math.min(cw, ch) / (400 * u);
  var br = sub(c), col = acc(c), s0 = wzStartT(c), mo = H.motionAmt(c);
  var paths = [[[0, 0.1], [0.3, 0.2], [0.5, 0.42], [0.78, 0.5], [0.93, 0.74]], [[0.3, 0.2], [0.44, 0.06], [0.66, 0.1]], [[0.5, 0.42], [0.42, 0.66], [0.52, 0.88]], [[0.78, 0.5], [0.95, 0.4]]];
  paths.forEach(function (pa, pi) {
    var delay = pi ? 0.25 + pi * 0.1 : 0;
    for (var i = 0; i < pa.length - 1; i++) {
      (function (ii, aPt, bPt, pIdx) {
        var a = X(aPt[0], aPt[1]), b = X(bPt[0], bPt[1]), scA = H.toScene(c, a[0], a[1]), scB = H.toScene(c, b[0], b[1]);
        var lw = Math.max(1.5, (pIdx ? 7 : 13) * u * Math.max(0.5, k) * (1 - ii * 0.2));
        var sh = C.shape(c.graph, c.cut, c.cut.id + ' / wzUme b' + pIdx + '_' + ii, c.parent, [['M', 0, 0], ['L', scB[0] - scA[0], scB[1] - scA[1]]], {
          stroke: br, width: lw, position: scA, alpha: 0.95
        });
        C.sample(c.graph, sh, c.cut.start, c.cut.end, function (f0) {
          var env = R.env(c, f0), t = env.lt - s0, o = 1 - E.inCubic(env.pOut || 0);
          var e = wzEin(t, 0.7, delay, E.inOutCubic) * (pa.length - 1), f = cl(e - ii);
          return { 'scale.x': Math.max(0.01, f), 'scale.y': Math.max(0.01, f), alpha: f > 0.01 ? 0.95 * o : 0 };
        });
      })(i, pa[i], pa[i + 1], pi);
    }
  });
  var fl = [[0.93, 0.74, 1], [0.66, 0.1, 0.9], [0.52, 0.88, 0.85], [0.5, 0.42, 0.75], [0.3, 0.2, 0.6], [0.95, 0.4, 0.7], [0.78, 0.5, 0.5], [0.42, 0.66, 0.45], [0.44, 0.06, 0.4]];
  fl.forEach(function (f, i) {
    var q = X(f[0], f[1]), R0 = 34 * u * Math.max(0.6, k) * f[2], scQ = H.toScene(c, q[0], q[1]);
    var rig = c.graph.add('null', c.cut.id + ' / wzUme fl ' + i, c.parent, c.cut.start, c.cut.end, { position: scQ });
    if (f[2] < 0.55) {
      C.shape(c.graph, c.cut, c.cut.id + ' / wzUme bud ' + i, rig, G.ellipse(0, 0, R0 * 0.75, R0 * 0.75), { fill: col });
    } else {
      var petCmds = [], staCmds = G.ellipse(0, 0, R0 * 0.13, R0 * 0.13);
      for (var j = 0; j < 5; j++) {
        var an = j / 5 * TAU, sa = (j + 0.5) / 5 * TAU;
        petCmds = petCmds.concat(G.ellipse(Math.cos(an) * R0 * 0.62, -Math.sin(an) * R0 * 0.62, R0 * 0.56, R0 * 0.56));
        staCmds = staCmds.concat(G.ellipse(Math.cos(sa) * R0 * 0.34, -Math.sin(sa) * R0 * 0.34, R0 * 0.07, R0 * 0.07));
      }
      C.shape(c.graph, c.cut, c.cut.id + ' / wzUme pet ' + i, rig, petCmds, { fill: col });
      C.shape(c.graph, c.cut, c.cut.id + ' / wzUme sta ' + i, rig, staCmds, { fill: c.sc.bg });
    }
    C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
      var env = R.env(c, f0), t = env.lt - s0, o = 1 - E.inCubic(env.pOut || 0);
      var e = wzEback(t, 0.4, 0.55 + i * 0.08) * o, rot = (i * 1.3 + Math.sin(env.ltb * 1.2 + i) * 0.12 * mo) / DEG;
      return { 'scale.x': Math.max(0.01, e), 'scale.y': Math.max(0.01, e), rotation: -rot, alpha: e > 0.01 ? cl(o) : 0 };
    });
  });
  return { flowers: fl.length };
});

/* 53. wzTake */
reg('wzTake', 'src/11p_x2_waA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = tyU(c), bb = H.decBB(c);
  var n0 = c.graph.layers.length, g0 = 26 * u, freeR = W - bb.x1 - g0, freeL = bb.x0 - g0, right = !!P.right;
  if ((right ? freeR : freeL) < 80 * u && (right ? freeL : freeR) >= 80 * u) right = !right;
  var free = right ? freeR : freeL, tight = free < 80 * u, al = tight ? 0.26 : 0.9, pN = cl(H.p(P, 'n', 1) | 0, 1, 3);
  var n = tight ? Math.min(pN, 2) : Math.max(1, Math.min(pN, Math.floor((free - 20 * u) / (64 * u))));
  var cCol = P.accent ? acc(c) : c.sc.fg, lc = P.accent ? c.sc.fg : acc(c), dir = right ? -1 : 1, s = H.p(P, 'seed', 1) | 0;
  var s0 = wzStartT(c), mo = H.motionAmt(c);
  for (var k = 0; k < n; k++) {
    (function (kk) {
      var x = (right ? W : 0) + dir * (38 * u + kk * 64 * u), sw = (28 - kk * 5) * u * (P.big ? 1.25 : 1);
      var top = Hh * (0.07 + 0.13 * kk + 0.05 * R.hash01(s, kk, 1)), seg = (150 + 30 * R.hash01(s, kk, 2)) * u;
      var full = Hh - top, culmCmds = [], nodeCmds = [];
      for (var j = 0, y = Hh + seg * 0.3 * R.hash01(s, kk, 3); j < 20 && y > top; j++, y -= seg) {
        var y1 = Math.max(top, y - seg + 5 * u);
        if (y - y1 > 1) {
          var rCmds = G.rect(-sw / 2, Hh - y, sw, y - y1);
          culmCmds = culmCmds.concat(rCmds);
        }
        if (y - seg > top) {
          var nCmds = G.rect(-sw * 0.62, Hh - (y - seg + 4 * u), sw * 1.24, 5 * u);
          nodeCmds = nodeCmds.concat(nCmds);
        }
        if (j % 2 === (kk % 2) && y - seg > top + 10 * u && y - seg < Hh - 40 * u) {
          var ly = y - seg + 2 * u, ll = tight ? 90 * u : Math.min(120 * u, free - (38 + kk * 64 + 4) * u);
          if (ll >= 20 * u) {
            (function (lY, lL, jj) {
              var lRig = c.graph.add('null', c.cut.id + ' / wzTake leaf ' + kk + '_' + jj, c.parent, c.cut.start, c.cut.end, {
                position: H.toScene(c, x, lY)
              });
              for (var q = 0; q < 3; q++) {
                var an = (dir > 0 ? 0 : Math.PI) + dir * (-0.3 + q * 0.45), ca = Math.cos(an), sa = Math.sin(an);
                var l2 = lL * (1 - q * 0.14), wv = l2 * 0.15;
                var lPts = [[0, 0], [ca * l2 * 0.5 - sa * wv, -(sa * l2 * 0.5 + ca * wv)], [ca * l2, -sa * l2], [ca * l2 * 0.5 + sa * wv, -(sa * l2 * 0.5 - ca * wv)]];
                C.shape(c.graph, c.cut, c.cut.id + ' / wzTake lf ' + kk + '_' + jj + '_' + q, lRig, lPts.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }).concat([['Z']]), { fill: lc });
              }
              C.sample(c.graph, lRig, c.cut.start, c.cut.end, function (f0) {
                var env = R.env(c, f0), t = env.lt - s0, o = 1 - E.inCubic(env.pOut || 0);
                var hh = full * wzEin(t, 0.9, kk * 0.12, E.outCubic), le = cl((hh - (Hh - lY)) / (60 * u));
                var rot = Math.sin(env.ltb * 1.5 + kk + jj) * 0.07 * mo / DEG;
                return { 'scale.x': Math.max(0.01, le), 'scale.y': Math.max(0.01, le), rotation: -rot, alpha: le > 0.02 ? al * o : 0 };
              });
            })(ly, ll, j);
          }
        }
      }
      var stalkRig = c.graph.add('null', c.cut.id + ' / wzTake stalk ' + kk, c.parent, c.cut.start, c.cut.end, {
        position: H.toScene(c, x, Hh)
      });
      C.shape(c.graph, c.cut, c.cut.id + ' / wzTake culm ' + kk, stalkRig, culmCmds.concat(nodeCmds), { fill: cCol, alpha: al });
      C.sample(c.graph, stalkRig, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), t = env.lt - s0, o = 1 - E.inCubic(env.pOut || 0);
        var e = wzEin(t, 0.9, kk * 0.12, E.outCubic);
        return { 'scale.y': Math.max(0.01, e), alpha: t > 0 ? al * o : 0 };
      });
    })(k);
  }
  H.placeBackFrom(c, n0);
  return { stalks: n };
});

/* 54. wzKazaguruma */
reg('wzKazaguruma', 'src/11p_x2_waA.js', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = tyU(c), bb = H.decBB(c), s00 = 66 * u * (P.big ? 1.25 : 1);
  var n = cl(H.p(P, 'n', 1) | 0, 1, 3), sp = wzSpotFit(c, bb, n * s00 * 2.3, s00 * 3.5, P, 24 * u);
  if (!sp) return { skipped: true };
  var s = s00 * sp.k, cA = acc(c), cB = sc.fg === cA ? sub(c) : sc.fg, s0 = wzStartT(c), mo = H.motionAmt(c);
  for (var k = 0; k < n; k++) {
    (function (kk) {
      var cx = sp.x + s * 1.15 + kk * s * 2.3, cy = sp.y + s * (1.1 + (kk % 2) * 0.35), stickLen = s * (2.3 - (kk % 2) * 0.35);
      var scP = H.toScene(c, cx, cy);
      var stickRig = c.graph.add('null', c.cut.id + ' / wzKazaguruma srig ' + kk, c.parent, c.cut.start, c.cut.end, { position: scP });
      var stick = C.shape(c.graph, c.cut, c.cut.id + ' / wzKazaguruma stick ' + kk, stickRig, [['M', 0, 0], ['L', 0, -stickLen]], {
        stroke: sub(c), width: 4 * u * Math.max(0.7, sp.k)
      });
      var wheel = c.graph.add('null', c.cut.id + ' / wzKazaguruma wheel ' + kk, c.parent, c.cut.start, c.cut.end, { position: scP });
      for (var b = 0; b < 4; b++) {
        var ang = b * Math.PI / 2, ca = Math.cos(ang), sa = Math.sin(ang);
        var rotPt = function (x, y) { return [x * ca - y * sa, -(x * sa + y * ca)]; };
        var pMain = [rotPt(0, 0), rotPt(s, 0), rotPt(s * 0.5, s * 0.5)], pSub = [rotPt(0, 0), rotPt(s * 0.5, s * 0.5), rotPt(0, s * 0.5)];
        var col = (b + kk) % 2 ? cA : cB;
        C.shape(c.graph, c.cut, c.cut.id + ' / wzKazaguruma bM' + kk + '_' + b, wheel, pMain.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }).concat([['Z']]), { fill: col });
        C.shape(c.graph, c.cut, c.cut.id + ' / wzKazaguruma bS' + kk + '_' + b, wheel, pSub.map(function (p, i) { return [i ? 'L' : 'M', p[0], p[1]]; }).concat([['Z']]), { fill: col, alpha: 0.55 });
      }
      C.shape(c.graph, c.cut, c.cut.id + ' / wzKazaguruma hub1 ' + kk, wheel, G.ellipse(0, 0, s * 0.13, s * 0.13), { fill: sc.bg });
      C.shape(c.graph, c.cut, c.cut.id + ' / wzKazaguruma hub2 ' + kk, wheel, G.ellipse(0, 0, s * 0.07, s * 0.07), { fill: cA });
      C.sample(c.graph, stick, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), t = env.lt - s0, o = 1 - E.inCubic(env.pOut || 0);
        return { 'scale.y': Math.max(0.01, wzEin(t, 0.4, kk * 0.12)), alpha: t > 0 ? o : 0 };
      });
      C.sample(c.graph, wheel, c.cut.start, c.cut.end, function (f0) {
        var env = R.env(c, f0), t = env.lt - s0, o = 1 - E.inCubic(env.pOut || 0), e = wzEback(t, 0.45, kk * 0.12);
        var rot = ((kk % 2 ? -1 : 1) * (env.ltb * 3.4 * (0.25 + mo) + (1 - wzEin(t, 1.2, kk * 0.12, E.outCubic)) * 5) + kk) / DEG;
        return { 'scale.x': Math.max(0.01, e), 'scale.y': Math.max(0.01, e), rotation: -rot, alpha: e > 0.01 ? o : 0 };
      });
    })(k);
  }
  return { count: n };
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZHelpers);
