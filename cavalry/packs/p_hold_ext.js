/* Remaining 61 native hold recipes completing 102/102 of the ae/data.json hold catalog.
 * Sources: ae/p_horror3.jsx, ae/p_kinetic3.jsx, ae/p_typo3.jsx, ae/p_x2_hold.jsx,
 *          ae/p_x2_horrorB.jsx, ae/p_x2_kineticB1.jsx, ae/p_x2_typoB.jsx, ae/p_x2_waB2.jsx (read-only).
 */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = R.clamp, mix = R.mix, E = R.E, PI = Math.PI, TAU = R.T, rand = N.random;

function hh(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function xkNoise(x, s) {
  var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  var a = hh(i * 1.618 + s * 0.7311) * 2 - 1, b = hh((i + 1) * 1.618 + s * 0.7311) * 2 - 1;
  return mix(a, b, u);
}
function xkTanh(x) { x = cl(x, -9, 9); var e = Math.exp(2 * x); return (e - 1) / (e + 1); }
function xkLoud(t, rate, seed) { return cl(0.5 + 0.34 * Math.sin(t * rate + (seed % 7)) + 0.3 * xkNoise(t * rate * 1.9, seed)); }
function hzn(x, s) { return Math.sin(x * 1.13 + s * 1.7) * 0.55 + Math.sin(x * 2.31 + s * 3.1) * 0.3 + Math.sin(x * 4.7 + s * 0.9) * 0.15; }
function fract(x) { return x - Math.floor(x); }

function cutTotalChars(c) {
  var t = (c.cut && c.cut.source && c.cut.source.text) || (c.node && c.node.text) || '';
  return Math.max(1, Array.from(String(t).replace(/[\s\u3000]/g, '')).length);
}
function nonSpaceGlyphs(gs) {
  return gs.filter(function (g) { return !/^[\s\u3000]$/.test(g.ch); });
}
function isKanji(ch) {
  var cp = String(ch).codePointAt(0);
  return (cp >= 0x3400 && cp <= 0x9FFF) || (cp >= 0x20000 && cp <= 0x3134F);
}
function keyGlyphIndex(gs) {
  var best = -1, len = 0;
  [isKanji, function (ch) { return /[A-Za-z0-9]/.test(ch); }].some(function (test) {
    for (var i = 0; i < gs.length; i++) {
      if (!test(gs[i].ch)) continue;
      var j = i;
      while (j < gs.length && test(gs[j].ch)) j++;
      if (j - i > len) { best = i; len = j - i; }
      i = j - 1;
    }
    return best >= 0;
  });
  if (best >= 0) return best;
  for (var k = 0; k < gs.length; k++) if (!/^[\s\u3000\u3001\u3002\uff01\uff1f!?]$/.test(gs[k].ch)) return k;
  return 0;
}

/* Rotate glyph position & angle around pivot (px, py) */
function rotAbout(s, g, px, py, deg) {
  if (Math.abs(deg) < 1e-6) return;
  var th = deg * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
  var gx = g.x + (g.vx || 0), gy = g.y + (g.vy || 0);
  var rx = gx - px, ry = gy - py;
  s.dx = (s.dx || 0) + (rx * cs - ry * sn) - rx;
  s.dy = (s.dy || 0) + (rx * sn + ry * cs) - ry;
  s.rot = (s.rot || 0) + deg;
}

function scaleAbout(s, g, px, py, fx, fy) {
  var gx = g.x + (g.vx || 0), gy = g.y + (g.vy || 0);
  s.dx = (s.dx || 0) + (px + (gx - px) * fx) - gx;
  s.dy = (s.dy || 0) + (py + (gy - py) * fy) - gy;
  s.sx = (s.sx == null ? 1 : s.sx) * fx;
  s.sy = (s.sy == null ? 1 : s.sy) * fy;
}

function registerSimple(key, source, fn, diffs) {
  R.motion('hold', key, source + ' / hold:' + key, fn);
  if (diffs && diffs.length) N.get('hold', key).differences = diffs;
}

function registerCtx(key, source, build, diffs) {
  N.register('hold', key, {
    source: source + ' / hold:' + key,
    scope: 'glyph+graphics',
    differences: diffs || [],
    build: build
  });
}

function resampleTwin(graph, clone, src, fn) {
  var s = clone.start, e = clone.end;
  clone.keys = {};
  for (var f = s; f < e; f++) {
    var base = {
      px: S.value(src, 'position.x', f, src.attrs.position ? src.attrs.position[0] : 0),
      py: S.value(src, 'position.y', f, src.attrs.position ? src.attrs.position[1] : 0),
      rot: S.value(src, 'rotation', f, src.attrs.rotation || 0),
      sx: S.value(src, 'scale.x', f, src.attrs.scale ? src.attrs.scale[0] : 1),
      sy: S.value(src, 'scale.y', f, src.attrs.scale ? src.attrs.scale[1] : 1),
      a: S.value(src, 'alpha', f, src.attrs.alpha == null ? 1 : src.attrs.alpha)
    };
    var o = fn(base, f);
    if (!o) o = base;
    graph.key(clone.id, 'position.x', f, o.px != null ? o.px : base.px, 1);
    graph.key(clone.id, 'position.y', f, o.py != null ? o.py : base.py, 1);
    graph.key(clone.id, 'rotation', f, o.rot != null ? o.rot : base.rot, 1);
    graph.key(clone.id, 'scale.x', f, o.sx != null ? o.sx : base.sx, 1);
    graph.key(clone.id, 'scale.y', f, o.sy != null ? o.sy : base.sy, 1);
    graph.key(clone.id, 'alpha', f, cl(o.a != null ? o.a : base.a), 1);
  }
}

/* ================================================================ Horror holds (hr*, hz*) */
registerSimple('hrFlickerLight', 'ae/p_horror3.jsx', function (a, g, gs, e) {
  var kM = cl(e.M / 0.7, 0.4, 1.3), kk = a * kM;
  if (kk < 0.02) return null;
  var st = Math.floor(e.t * 24), run = Math.floor(st / 2);
  var lv = 0.9 + 0.1 * rand(e.seed, st, 3);
  if (rand(e.seed, run, 5) < 0.09 * kk) lv = rand(e.seed, st, 7) < 0.5 ? 0.08 : 0.35;
  else if (rand(e.seed, st, 11) < 0.05 * kk) lv = 0.5;
  var al = 1 - (1 - lv) * Math.min(1, kk);
  return { a: al };
});

registerSimple('hrLagOne', 'ae/p_horror3.jsx', function (a, g, gs, e) {
  var Ntot = gs.length, late = Math.floor(rand(e.seed, 121, 1) * Math.max(1, Ntot));
  var kk = a * cl(e.M / 0.7, 0, 1.6);
  var tt = e.t - (g.i === late ? 0.75 : 0);
  var sd = e.seed % 97;
  return {
    dx: R.noise(tt * 0.9, sd) * e.size * 0.1 * kk,
    dy: R.noise(tt * 0.7 + 5, sd + 1) * e.size * 0.06 * kk,
    rot: R.noise(tt * 0.5 + 9, sd + 2) * 4 * kk
  };
});

registerSimple('hrStare', 'ae/p_horror3.jsx', function (a, g, gs, e) {
  var t = e.t - 0.3, kk = a * cl(e.M / 0.7, 0, 1.6);
  if (t <= 0 || kk <= 0.02) return null;
  var cy = Math.floor(t / 2), u = (t - cy * 2) / 2;
  var tg = Math.floor(hh(cy * 111 + e.seed) * gs.length);
  if (g.i !== tg) return null;
  var dr = hh(cy * 112 + e.seed) < 0.5 ? 1 : -1;
  var v = u < 0.6 ? -(Math.cos(PI * u / 0.6) - 1) / 2 : (u < 0.85 ? 1 : 1 - N.outExpo((u - 0.85) / 0.15));
  return { rot: dr * 22 * v * kk, s: 1 + 0.12 * v * kk, dy: -e.size * 0.04 * v * kk };
});

registerSimple('hrTwitch', 'ae/p_horror3.jsx', function (a, g, gs, e) {
  var f = Math.floor(e.t * 12), kk = a * cl(e.M / 0.7, 0, 1.6);
  if (kk <= 0.02 || rand(e.seed, f, 13) >= 0.07 * kk * 2) return null;
  var wh = rand(e.seed, f, 14) < 0.25, tg = Math.floor(rand(e.seed, f, 15) * gs.length);
  if (!wh && g.i !== tg) return null;
  return {
    dx: (rand(e.seed, f, g.i, 16) * 2 - 1) * e.size * 0.22 * kk,
    dy: (rand(e.seed, f, g.i, 17) * 2 - 1) * e.size * 0.14 * kk,
    rot: (rand(e.seed, f, g.i, 18) * 2 - 1) * 28 * kk,
    s: 1 + 0.12 * rand(e.seed, f, g.i, 19) * kk
  };
});

registerSimple('hzLoneTremor', 'ae/p_x2_horrorB.jsx', function (a, g, gs, e) {
  var pick = Math.floor(rand(e.seed, 421, 1) * Math.max(1, gs.length));
  if (g.i !== pick) return null;
  var hk = a * cl(e.M / 0.7, 0, 1.6);
  var sw = Math.pow(0.5 - 0.5 * Math.cos(e.t * TAU / 3.4 + rand(e.seed, 422, 1) * TAU), 1.6);
  if (hk <= 0.02 || sw <= 0.02) return null;
  var f = Math.floor(e.t * 24);
  return {
    dx: (rand(e.seed, f, 11) * 2 - 1) * e.size * 0.04 * sw * hk,
    dy: (rand(e.seed, f, 12) * 2 - 1) * e.size * 0.03 * sw * hk,
    rot: (rand(e.seed, f, 13) * 2 - 1) * 6 * sw * hk
  };
});

registerCtx('hzLoom', 'ae/p_x2_horrorB.jsx', function (c) {
  var node = c.node, gs = V.glyphs(c, node), b = V.bounds(gs), seed = node.seed || 0;
  var col = H.mixHex(node.color || c.sc.fg, c.sc.bg, H.dark(c.sc.bg) ? 0.5 : 0.35);
  var ph = rand(seed, 451, 1) * 0.3;
  node._jzTwins = node._jzTwins || [];
  node._jzTwins.push({
    label: 'Loom shadow', below: true,
    setup: function (graph, clone, src, g) {
      clone.attrs['material.materialColor'] = col;
      resampleTwin(graph, clone, src, function (base, f) {
        var env = V.envelope(c, node, f), hk = env.amt * H.mk(c);
        var hu = fract(env.t / 4.8 + ph);
        var hv = hu < 0.8 ? E.inOutSine(hu / 0.8) : 1 - N.outExpo((hu - 0.8) / 0.2);
        var hs = 1 + 0.17 * hv * Math.min(1.2, hk);
        var gx = g.x + (g.vx || 0), gyUp = -(g.y + (g.vy || 0)), cx = b.cx, cyUp = -b.cy;
        return {
          px: base.px + (gx - cx) * (hs - 1),
          py: base.py + (gyUp - cyUp) * (hs - 1) + node.size * 0.1 * hv * hk,
          sx: base.sx * hs, sy: base.sy * hs,
          a: base.a * ((hk < 0.02 || hv < 0.02) ? 0 : 0.34 * Math.min(1, hk) * Math.sqrt(hv))
        };
      });
    }
  });
  return function () {};
});

registerSimple('hzPassing', 'ae/p_x2_horrorB.jsx', function (a, g, gs, e) {
  var b = V.bounds(gs), span = Math.max(e.W * 0.5, b.x1 - b.x0 + e.size * 4);
  var hk = a * cl(e.M / 0.7, 0, 1.6);
  var T = e.t / 3.6 + rand(e.seed, 431, 1) * 0.4, cyc = Math.floor(T), u = (T - cyc) / 0.62;
  if (u >= 1 || hk <= 0.02) return null;
  var bk = ((Math.floor(rand(e.seed, 432, 1) * 2) + cyc) % 2) === 1;
  var X = b.x0 - e.size * 2 + span * (bk ? 1 - u : u);
  var dd = (g.x - X) / Math.max(1, e.W * 0.15);
  if (dd <= -1 || dd >= 1) return null;
  var f = (1 - dd * dd) * (1 - dd * dd), sg = dd < 0 ? -1 : 1;
  return {
    dx: sg * e.size * 0.07 * f * hk,
    dy: e.size * 0.02 * f * hk,
    rot: sg * 8 * f * hk,
    a: 1 - 0.6 * f * Math.min(1, hk)
  };
});

registerSimple('hzPresence', 'ae/p_x2_horrorB.jsx', function (a, g, gs, e) {
  var hk = a * cl(e.M / 0.7, 0.5, 1.2);
  if (hk < 0.02) return null;
  var off = (g.i * 7.31) % 97;
  var d = H.smoothstep(0.05, 0.75, hzn((e.t * 0.42 + off) * 3, (e.seed + 441) % 97));
  return { dy: e.size * 0.035 * d * hk, a: 1 - 0.62 * d * Math.min(1, hk) };
});

registerSimple('hzSlowBreath', 'ae/p_x2_horrorB.jsx', function (a, g, gs, e) {
  var hk = a * cl(e.M / 0.7, 0, 1.6);
  var u = fract(e.t / 6.2 + rand(e.seed, 411, 1) * 0.25);
  var v = u < 0.55 ? E.inOutSine(u / 0.55) : (u < 0.8 ? 1 : (u < 0.86 ? 1 - N.outExpo((u - 0.8) / 0.06) : 0));
  var s = 1 + 0.05 * v * hk;
  var f = Math.floor(e.t * 24);
  var jx = (u >= 0.55 && u < 0.8) ? (rand(e.seed, f, 7) * 2 - 1) * e.size * 0.006 * hk : 0;
  var jy = (u >= 0.55 && u < 0.8) ? (rand(e.seed, f, 8) * 2 - 1) * e.size * 0.004 * hk : 0;
  var out = { dx: jx, dy: jy, a: 1 - 0.14 * v * Math.min(1, hk) };
  scaleAbout(out, g, 0, 0, s, s);
  return out;
});

/* ================================================================ Kinetic holds (kn*, kz*) */
registerSimple('knBeatLean', 'ae/p_kinetic3.jsx', function (a, g, gs, e) {
  var w = H.wordsOf({ node: e.node, cut: {} }, gs), j = w.membership[g.i];
  if (j == null) return null;
  var b = e.beat(0.55), A = 18 * a * (0.4 + e.M) * Math.exp(-b.since * 4.5) * Math.cos(b.since * 15);
  if (Math.abs(A) < 0.1) return null;
  var th = A * ((j + b.index) % 2 ? 1 : -1);
  return { rot: th * 0.5, dx: Math.sin(th * Math.PI / 180) * e.size * 0.12 };
});

registerSimple('knCounterRock', 'ae/p_kinetic3.jsx', function (a, g, gs, e) {
  var w = H.wordsOf({ node: e.node, cut: {} }, gs), j = w.membership[g.i];
  if (j == null) return null;
  var wd = w.words[j], nw = w.words.length;
  var A = 4 * a * (0.4 + e.M) * Math.sin(e.t * TAU * 0.55) * (j % 2 ? -1 : 1) * (nw === 1 ? 0.6 : 1);
  var out = { dx: 0, dy: 0, rot: 0 };
  rotAbout(out, g, wd.b.cx, wd.b.cy, A);
  return out;
});

registerSimple('knGapBreath', 'ae/p_kinetic3.jsx', function (a, g, gs, e) {
  var w = H.wordsOf({ node: e.node, cut: {} }, gs), j = w.membership[g.i], nw = w.words.length;
  if (j == null || nw < 2) return null;
  var A = e.size * 0.16 * a * (0.4 + e.M) * (0.5 - 0.5 * Math.cos(e.t * TAU * 0.4));
  var o = (j - (nw - 1) / 2) * A;
  return e.node.vertical ? { dy: o } : { dx: o };
});

registerSimple('knTickShift', 'ae/p_kinetic3.jsx', function (a, g, gs, e) {
  var b = e.beat(0.5), tdd = e.size * 0.05 * a * (0.4 + e.M), fr = b.index % 2 ? 1 : -1;
  var tx = (-fr + 2 * fr * E.outBack(cl(b.since / 0.09), 2.6)) * tdd;
  return e.node.vertical ? { dy: tx } : { dx: tx };
});

registerSimple('knWordPulse', 'ae/p_kinetic3.jsx', function (a, g, gs, e) {
  var w = H.wordsOf({ node: e.node, cut: {} }, gs), j = w.membership[g.i], nw = w.words.length;
  if (j == null || !nw) return null;
  var b = e.beat(0.52), cur = ((b.index % nw) + nw) % nw;
  if (j !== cur) return null;
  var pu = Math.exp(-b.since * 4) * 0.14 * a * (0.4 + e.M);
  if (pu < 0.002) return null;
  var wd = w.words[j], out = { dx: 0, dy: 0, sx: 1, sy: 1 };
  scaleAbout(out, g, wd.b.cx, wd.b.cy, 1 + pu, 1 + pu);
  return out;
});

registerSimple('knWordRide', 'ae/p_kinetic3.jsx', function (a, g, gs, e) {
  var w = H.wordsOf({ node: e.node, cut: {} }, gs), j = w.membership[g.i];
  if (j == null) return null;
  var wd = w.words[j], A = e.size * 0.07 * a * (0.4 + e.M), ph = e.t * 3.1 - j * 1.25;
  var off = A * Math.sin(ph), th = Math.cos(ph) * 3.5 * a;
  var out = { dx: 0, dy: 0, rot: 0 };
  rotAbout(out, g, wd.b.cx, wd.b.cy, th);
  if (e.node.vertical) out.dx += off; else out.dy += off;
  return out;
});

registerSimple('kzBeatSquat', 'ae/p_x2_kineticB1.jsx', function (a, g, gs, e) {
  var MM = a * (0.4 + e.M);
  if (MM < 0.01) return null;
  var w = H.wordsOf({ node: e.node, cut: {} }, gs), j = w.membership[g.i];
  if (j == null) return null;
  var b = e.beat(0.6), ss = b.since - Math.min(j, 6) * 0.045;
  if (ss < 0) return null;
  var v = 0.2 * MM * Math.exp(-ss * 4.2) * Math.cos(ss * 13);
  if (Math.abs(v) < 0.003) return null;
  var wd = w.words[j], out = { dx: 0, dy: 0, sx: 1, sy: 1 };
  scaleAbout(out, g, wd.b.cx, wd.b.y1, 1 + v * 0.5, 1 - v);
  return out;
});

registerSimple('kzDivingBoard', 'ae/p_x2_kineticB1.jsx', function (a, g, gs, e) {
  var MM = a * (0.4 + e.M), b = e.beat(1.15);
  var A = e.size * 0.45 * MM * Math.exp(-b.since * 2.5) * Math.sin(b.since * 12.5);
  if (Math.abs(A) < 0.25) return null;
  var box = V.bounds(gs), GV = !!e.node.vertical;
  var start = GV ? box.y0 : box.x0, len = Math.max(1, GV ? box.y1 - box.y0 : box.x1 - box.x0);
  var en = rand(e.seed, 851, 1) < 0.5 ? 1 : 0;
  var v = cl(((GV ? g.y : g.x) - start) / len);
  if (en) v = 1 - v;
  var d = A * v * v, rot = Math.atan(2 * A * v / len * (en ? -1 : 1)) * 180 / PI;
  return GV ? { dx: -d, rot: rot } : { dy: d, rot: rot };
});

registerSimple('kzInertiaSway', 'ae/p_x2_kineticB1.jsx', function (a, g, gs, e) {
  var MM = a * (0.4 + e.M);
  if (MM < 0.01) return null;
  var w = H.wordsOf({ node: e.node, cut: {} }, gs), j = w.membership[g.i];
  if (j == null) return null;
  var ph = TAU * 0.42 * (e.t - j * 0.15), off = e.size * 0.2 * MM * Math.sin(ph), v = Math.cos(ph);
  return e.node.vertical ? { dy: off, rot: 3 * MM * v } : { dx: off, rot: 3.5 * MM * v, sx: 1 + 0.03 * MM * Math.abs(v) };
});

registerSimple('kzSlinky', 'ae/p_x2_kineticB1.jsx', function (a, g, gs, e) {
  var MM = a * (0.4 + e.M), PER = 0.95, s0 = ((e.t % PER) + PER) % PER, fr = s0 / 0.5;
  if (MM < 0.01 || fr > 1.5) return null;
  var box = V.bounds(gs), GV = !!e.node.vertical, fs = Math.max(1, e.size);
  var start = (GV ? box.y0 : box.x0) / fs, len = Math.max(0.001, (GV ? box.y1 - box.y0 : box.x1 - box.x0) / fs);
  var fwd = Math.floor(e.t / PER) % 2 === 0;
  var xp = fwd ? start - 1 + fr * (len + 2) : start + len + 1 - fr * (len + 2);
  var A = e.size * 0.3 * MM * (fwd ? 1 : -1) * cl((1.5 - fr) * 2.5);
  var d = ((GV ? g.y : g.x) / fs - xp) / 1.25, u = A * Math.exp(-d * d);
  if (Math.abs(u) < 0.3) return null;
  return GV ? { dy: u } : { dx: u };
});

registerSimple('kzSquashWave', 'ae/p_x2_kineticB1.jsx', function (a, g, gs, e) {
  var MM = a * (0.4 + e.M);
  if (MM < 0.01) return null;
  var box = V.bounds(gs), GV = !!e.node.vertical, fs = Math.max(1, e.size);
  var start = (GV ? box.y0 : box.x0) / fs, len = Math.max(0.001, (GV ? box.y1 - box.y0 : box.x1 - box.x0) / fs);
  var per = 1.7, fr = (((e.t % per) + per) % per) / per, xw = start - 2 + fr * (len + 4);
  var d = (GV ? g.y : g.x) / fs - xw;
  var b0 = Math.exp(-d * d / 0.8), b1 = Math.exp(-(d - 1.5) * (d - 1.5) / 0.9) + Math.exp(-(d + 1.5) * (d + 1.5) / 0.9);
  var yy = 1 - 0.32 * MM * b0 + 0.1 * MM * b1;
  if (Math.abs(yy - 1) < 0.004) return null;
  return { sy: yy, sx: 1 + 0.2 * MM * b0 - 0.04 * MM * b1, dy: fs * (1 - yy) / 2 };
});

/* ================================================================ Typo holds (ty*, tz*) */
registerSimple('tyKeyPulse', 'ae/p_typo3.jsx', function (a, g, gs, e) {
  var plain = nonSpaceGlyphs(gs);
  if (!plain.length) return null;
  var pu = Math.pow(0.5 + 0.5 * Math.sin(e.t * TAU * 0.95), 4);
  var kq = 0.1 * H.mk({ assembly: { style: { fx: { motion: e.M } } } }) * a * pu;
  if (plain.length === 1) return isKanji(plain[0].ch) ? { s: 1 + kq * 0.7 } : null;
  var ki = keyGlyphIndex(gs);
  return g.i === ki ? { s: 1 + kq } : null;
});

registerCtx('tyOutlineBlink', 'ae/p_typo3.jsx', function (c) {
  var node = c.node, gs = V.glyphs(c, node), plain = nonSpaceGlyphs(gs), n = plain.length;
  if (!n) return function () {};
  var sw = Math.max(1.5 * Math.min(c.comp.width, c.comp.height) / 1080, node.size * 0.03);
  var rank = Object.create(null);
  plain.forEach(function (pg, idx) { rank[pg.i] = idx; });
  var pr = 0.28 * (0.5 + 0.5 * H.mk(c)) / (n === 1 ? Math.max(1, cutTotalChars(c) * 0.5) : 1);
  node._jzTwins = node._jzTwins || [];
  node._jzTwins.push({
    label: 'Outline blink', below: false,
    setup: function (graph, clone, src, g) {
      var r = rank[g.i];
      if (r == null) { clone.attrs.alpha = 0; return; }
      clone.attrs.fill = false;
      clone.attrs.stroke = true;
      clone.attrs['stroke.strokeColor'] = node.color || c.sc.fg;
      clone.attrs['stroke.width'] = sw;
      resampleTwin(graph, clone, src, function (base, f) {
        var env = V.envelope(c, node, f), sp = Math.floor(env.t * 6);
        var sd = (node.seed || 0) + (c.cut.origin | 0);
        var on = hh(sd * 0.37 + sp * 7.13) < pr * env.amt;
        var pk = Math.floor(hh(sd * 0.61 + sp * 3.7) * n);
        var tw = n > 3 && hh(sd * 0.23 + sp * 5.3) < 0.3 ? Math.floor(hh(sd * 0.91 + sp * 2.9) * n) : -1;
        return { a: (on && (r === pk || r === tw)) ? base.a : 0 };
      });
    }
  });
  return function () {};
}, ['Outline blink is represented as an editable stroke twin toggled on matching glyphs.']);

registerCtx('tyReadCursor', 'ae/p_typo3.jsx', function (c) {
  var node = c.node, gs = V.glyphs(c, node), plain = nonSpaceGlyphs(gs), n = plain.length;
  if (!n) return function () {};
  var rank = Object.create(null);
  plain.forEach(function (pg, idx) { rank[pg.i] = idx; });
  var lift = node.size * 0.07 * Math.min(1, H.mk(c)), tot = n <= 1 ? cutTotalChars(c) : n;
  var colAcc = H.accCol(c.sc), origCol = node.color || c.sc.fg;
  return function (s, g, all, frame) {
    var env = V.envelope(c, node, frame), r = rank[g.i];
    if (r == null) { s.color = origCol; return; }
    var ps = Math.floor(env.t * 4) % (tot + 2), fr = (env.t * 4) % 1;
    var up = E.outCubic(cl(fr * 4)) * (1 - E.inCubic(cl((fr - 0.6) / 0.4)));
    var sel = n <= 1 ? ((Math.round(node.mi || 0) % (tot + 2)) === ps) : (r === ps);
    if (env.amt >= 0.3 && sel) {
      if (node.vertical) s.dx += lift * up; else s.dy -= lift * up;
      s.color = colAcc;
    } else {
      s.color = origCol;
    }
  };
});

registerSimple('tyTrackStep', 'ae/p_typo3.jsx', function (a, g, gs, e) {
  if (gs.length < 2 || e.node.vertical) return null;
  var mk = Math.min(1.2, cl(e.M / 0.7, 0, 1.6)), lv = [0, 1, 2, 1];
  var t = e.t / 0.55, k = Math.floor(t), f = t - k, va = lv[k % 4], vb = lv[(k + 1) % 4];
  var ev = cl((f - 0.85) / 0.15);
  ev = ev >= 1 ? 1 : 1 - Math.pow(2, -10 * ev);
  var tr = (va + (vb - va) * ev) / 2 * a * mk * e.size * 0.1;
  var row = R.rows(gs, g), ix = row.indexOf(g) - (row.length - 1) / 2;
  return { dx: ix * tr };
});

registerCtx('tzCaretBlink', 'ae/p_x2_typoB.jsx', function (c) {
  var node = c.node, gs = V.glyphs(c, node), plain = nonSpaceGlyphs(gs);
  var mk = cl(H.mk(c) * 2, 0, 1), Ntot = cutTotalChars(c);
  if (!plain.length || mk < 0.05) return function () {};
  if (plain.length <= 1 && Ntot > 1 && Math.round(node.mi || 0) !== Ntot - 1) return function () {};
  var last = plain[plain.length - 1], Vaxis = !!node.vertical;
  var gx = last.x + (last.vx || 0), gy = last.y + (last.vy || 0);
  var along = (Vaxis ? gy + last.h / 2 : gx + last.w / 2) + node.size * 0.09;
  var cross = Vaxis ? gx : gy, hhCaret = node.size * 0.54;
  var parent = V.local(c, node, 'End caret');
  var lw = Math.max(2, node.size * 0.03);
  var p0 = V.axisPoint(Vaxis, along, cross - hhCaret), p1 = V.axisPoint(Vaxis, along, cross + hhCaret);
  var id = V.line(c, 'End caret', [p0, p1], H.accCol(c.sc), lw, 1, parent);
  V.animate(c, id, function (env, frame) {
    var e = V.envelope(c, node, frame), ka = e.amt * mk;
    var on = ka >= 0.05 && ((e.t % 1.06 + 1.06) % 1.06) < 0.6;
    return { alpha: on ? (1 - e.pout) * ka : 0 };
  });
  return function () {};
});

registerCtx('tzIndexCount', 'ae/p_x2_typoB.jsx', function (c) {
  var node = c.node, gs = V.glyphs(c, node), rows = V.spans(gs, !!node.vertical);
  var mk = cl(H.mk(c) * 2, 0, 1), Ntot = cutTotalChars(c);
  if (!rows.length || mk < 0.03) return function () {};
  if (gs.length <= 1 && Ntot > 1 && Math.round(node.mi || 0) !== 0) return function () {};
  var row0 = rows[0], U = Math.min(c.comp.width, c.comp.height) / 1080;
  var fs = Math.max(14 * U, node.size * 0.24), col = H.subCol(c.sc);
  var lx = node.vertical ? row0.c : row0.a1, ly = node.vertical ? row0.a1 + fs * 0.9 : row0.c - node.size * 0.95;
  var parent = V.local(c, node, 'Running index');
  var f = V.font(c, node);
  var tid = c.graph.add('textShape', c.cut.id + ' / Running index', parent, c.cut.start, c.cut.end, {
    text: '01', font: { font: f.family, style: f.style }, fontSize: fs,
    autoWidth: true, autoHeight: true,
    horizontalAlignment: node.vertical ? 1 : 2, verticalAlignment: 1,
    position: [lx, -ly], fill: true, stroke: false, 'material.materialColor': col, alpha: 1
  });
  var inSec = c.cut.inFrames / c.comp.fps, lastStr = null;
  for (var fr = c.cut.start; fr < c.cut.end; fr++) {
    var env = V.envelope(c, node, fr);
    var num = (1 + Math.floor(Math.max(0, env.t - inSec) / 0.5)) % 100;
    var s = (num < 10 ? '0' : '') + num;
    if (s !== lastStr) { c.graph.key(tid, 'text', fr, s, 2); lastStr = s; }
    c.graph.key(tid, 'alpha', fr, cl((1 - env.pout) * env.amt * mk), 1);
  }
  return function () {};
});

registerCtx('tzUnderGrow', 'ae/p_x2_typoB.jsx', function (c) {
  var node = c.node, gs = V.glyphs(c, node), rows = V.spans(gs, !!node.vertical);
  var mk = cl(H.mk(c) * 2, 0, 1);
  if (!rows.length || mk < 0.03) return function () {};
  var Vax = !!node.vertical, row = rows[rows.length - 1], len = Math.max(1, row.a1 - row.a0);
  var cross = row.c + (Vax ? -node.size * 0.65 : node.size * 0.6), lw = Math.max(1.5, node.size * 0.02);
  var ac = H.accCol(c.sc), parent = V.local(c, node, 'Growing underline');
  var uid = V.line(c, 'Underline', [V.axisPoint(Vax, 0, cross), V.axisPoint(Vax, len, cross)], ac, lw, 1, parent);
  var inSec = c.cut.inFrames / c.comp.fps, outSec = c.cut.outFrames / c.comp.fps;
  var dur = Math.max(0.8, (c.cut.sourceEnd - c.cut.origin) / c.comp.fps - inSec - outSec);
  function prog(t) {
    var gg = cl((t - inSec * 0.85) / dur);
    return 0.1 + 0.9 * (1 - Math.pow(1 - gg, 1.5));
  }
  V.animate(c, uid, function (env, fr) {
    var e = V.envelope(c, node, fr), pr = prog(e.t), a = cl((1 - e.pout) * e.amt * mk);
    var res = { alpha: a };
    res['position.' + (Vax ? 'y' : 'x')] = Vax ? -row.a0 : row.a0;
    res['scale.' + (Vax ? 'y' : 'x')] = Math.max(1e-4, pr);
    return res;
  });
  if (gs.length > 1) {
    var th = node.size * 0.09;
    var tid = V.line(c, 'Underline tick', [V.axisPoint(Vax, 0, cross - th), V.axisPoint(Vax, 0, cross + th)], ac, lw, 1, parent);
    V.animate(c, tid, function (env, fr) {
      var e = V.envelope(c, node, fr), pr = prog(e.t), a = cl((1 - e.pout) * e.amt * mk);
      var res = { alpha: a };
      res['position.' + (Vax ? 'y' : 'x')] = Vax ? -(row.a0 + len * pr) : (row.a0 + len * pr);
      return res;
    });
  }
  return function () {};
});

/* ================================================================ Wa holds (wz*) */
registerSimple('wzFurin', 'ae/p_x2_waB2.jsx', function (a, g, gs, e) {
  var wzK = a * cl(e.M / 0.7, 0, 1.6), T = 2.3, ph = (0.75 + 0.2 * ((e.seed % 97) / 97)) * T, Lp = e.size * 0.85;
  var j = gs.length === 1 && e.node.mi != null ? e.node.mi : g.i;
  var wv = 7.5 + 3 * rand(e.seed, j, 301), av = 0.7 + 0.6 * rand(e.seed, j, 302);
  var tt = fract((e.t + ph - j * 0.08) / T) * T;
  var th = 10 * wzK * Math.exp(-1.2 * tt) * Math.sin(tt * wv) * Math.min(1, tt * 8) * (1 - H.smoothstep(0.8, 1, tt / T)) * av * PI / 180;
  return { rot: th * 180 / PI, dx: -Lp * Math.sin(th), dy: Lp * (Math.cos(th) - 1) };
});

registerSimple('wzMikoshi', 'ae/p_x2_waB2.jsx', function (a, g, gs, e) {
  var wzK = a * cl(e.M / 0.7, 0, 1.6), cp = (e.seed % 97) / 97;
  var u = fract(e.t / 1.1 + cp);
  var m1 = u < 0.3 ? Math.sin(PI * u / 0.3) : 0, m2 = (u > 0.34 && u < 0.64) ? Math.sin(PI * (u - 0.34) / 0.3) : 0;
  var r = 1.3 * wzK * (m1 - m2), out = { dx: 0, dy: -e.size * 0.08 * wzK * (m1 + m2 * 0.8), rot: 0 };
  rotAbout(out, g, 0, 0, r);
  return out;
});

registerSimple('wzNotan', 'ae/p_x2_waB2.jsx', function (a, g, gs, e) {
  var wzK = a * cl(e.M / 0.7, 0, 1.6), wzKK = Math.min(1, wzK), cp = ((e.seed % 97) / 97) * TAU;
  var ix = gs.length === 1 && e.node.mi != null ? e.node.mi : g.i;
  var w = 0.5 + 0.5 * Math.sin(e.t * 1.3 - ix * 0.7 + cp), dd = w * w;
  return { a: 1 - 0.45 * wzKK * dd, s: 1 - 0.02 * wzK * dd };
});

registerSimple('wzShishiodoshi', 'ae/p_x2_waB2.jsx', function (a, g, gs, e) {
  var wzK = a * cl(e.M / 0.7, 0, 1.6), cp = (e.seed % 97) / 97, dir = rand(e.seed, 311, 1) < 0.5 ? -1 : 1;
  var u = fract(e.t / 3.4 + cp), v = (u - 0.76) / 0.24;
  var wsa = u < 0.7 ? E.inQuad(u / 0.7) : (u < 0.76 ? mix(1, -0.45, E.inCubic((u - 0.7) / 0.06)) : -0.45 * Math.exp(-5 * v) * Math.cos(v * PI * 3) * (1 - v));
  var out = { dx: 0, dy: 0, rot: 0 };
  rotAbout(out, g, 0, 0, dir * 2.4 * wzK * wsa);
  return out;
});

registerSimple('wzTanzaku', 'ae/p_x2_waB2.jsx', function (a, g, gs, e) {
  var wzK = a * cl(e.M / 0.7, 0, 1.6), cp = ((e.seed % 97) / 97) * TAU;
  var ix = gs.length === 1 && e.node.mi != null ? e.node.mi : g.i;
  var f = e.t * 1.9 - ix * 0.6 + cp, tw = Math.pow(Math.max(0, Math.sin(f)), 2);
  return { sx: 1 - 0.34 * Math.min(1.2, wzK) * tw, rot: 2.2 * wzK * Math.sin(f + 0.9), dy: -e.size * 0.015 * wzK * tw };
});

/* ================================================================ X2 holds (xk*) */
registerSimple('xkBeatBump', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), b = e.beat(0.6);
  var v = Math.exp(-b.since * 5.5) * Math.cos(b.since * 20) * Math.min(1, b.since / 0.03);
  var ang = hh(b.index * 7.31 + (e.seed % 99991)) * TAU, d = e.size * 0.14 * xkK * v;
  var out = { dx: Math.cos(ang) * d, dy: Math.sin(ang) * d * 0.75, rot: 0 };
  rotAbout(out, g, 0, 0, (hh(b.index * 3.77 + (e.seed % 99991) + 5) * 2 - 1) * 2 * xkK * v);
  return out;
});

registerSimple('xkBigSmall', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), cph = ((e.seed % 97) / 97) * TAU;
  var v = cl(Math.sin(e.t * TAU / 3.2 + cph) * 1.7, -1, 1) * 0.1 * Math.min(xkK, 1.3);
  var ix = gs.length === 1 && e.node.mi != null ? e.node.mi : g.ci;
  var s = 1 + (ix % 2 ? v : -v);
  return e.node.vertical ? { s: s } : { s: s, dy: -(s - 1) * e.size * 0.36 };
});

registerSimple('xkBlink', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkKK = Math.min(1, a * cl(e.M / 0.7, 0, 1.6));
  var T = e.t - 0.7;
  if (T < 0) return null;
  var cyc = Math.floor(T / 2.5), tau = T - cyc * 2.5;
  if (tau > 0.75) return null;
  var tw = hh(cyc * 4.7 + (e.seed % 99991) + 2) < 0.4, ord = R.order(g, gs, e), x = tau - ord * 0.09;
  function sh(v) { return v > 0 && v < 0.2 ? Math.pow(Math.sin(PI * v / 0.2), 0.8) : 0; }
  var c = Math.max(sh(x), tw ? sh(x - 0.3) : 0);
  return { sy: 1 - 0.62 * xkKK * c };
});

registerSimple('xkBuoy', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), ph = ((e.seed % 97) / 97) * TAU, w = TAU / 3.4 * e.t;
  var xky = Math.sin(w + ph) + 0.35 * Math.sin(w * 1.83 + ph * 2);
  var xkt = Math.cos(w + ph - 0.5) + 0.35 * Math.cos(w * 1.83 + ph * 2 - 0.5);
  var out = { dx: Math.sin(w * 0.5 + ph) * e.size * 0.03 * xkK, dy: xky * e.size * 0.045 * xkK, rot: 0 };
  rotAbout(out, g, 0, 0, xkt * 1.5 * xkK);
  return out;
});

registerSimple('xkCradle', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), b = e.beat(0.62), row = R.rows(gs, g);
  var non = nonSpaceGlyphs(row), ro = 0;
  if (gs.length === 1 && e.node.mi != null) {
    var Ntot = Math.max(1, e.node.cutText ? Array.from(e.node.cutText).length : gs.length);
    ro = e.node.mi <= 0 ? 1 : (e.node.mi >= Ntot - 1 ? 2 : 0);
  } else if (!/^[\s\u3000]$/.test(g.ch)) {
    ro = non.length <= 1 ? 3 : (g.i === non[0].i ? 1 : (g.i === non[non.length - 1].i ? 2 : 0));
  }
  var end = b.index % 2 ? -1 : 1, u = cl(b.since / b.len), sw = Math.sin(PI * u), th = 13 * xkK * sw * PI / 180, kn = Math.exp(-u * 14) * e.size * 0.012 * xkK;
  if (ro === 3) return e.node.vertical ? null : { rot: end * sw * 3 * xkK };
  if (ro === (end > 0 ? 2 : 1)) {
    var out = end * e.size * 1.25 * Math.sin(th), up = -e.size * 1.25 * (1 - Math.cos(th));
    return e.node.vertical ? { dy: out, dx: -up } : { dx: out, dy: up, rot: -end * th * 180 / PI };
  }
  return e.node.vertical ? { dy: end * kn } : { dx: end * kn };
});

registerSimple('xkDepthRock', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), cph = ((e.seed % 97) / 97) * TAU;
  var xka = Math.sin(e.t * TAU / 5.2 + cph) * Math.min(xkK, 1.4);
  var b = V.bounds(gs), half = Math.max(1, (e.node.vertical ? b.h : b.w) / 2);
  var u = cl(((e.node.vertical ? g.y - b.cy : g.x - b.cx)) / half, -1, 1);
  var c0 = 0.12 * xka, nar = 1 - 0.06 * xka * xka, v = half * ((u + 0.5 * c0 * (u * u - 1 / 3)) * nar - u);
  var s = 1 + c0 * u;
  return e.node.vertical ? { dy: v, s: s } : { dx: v, s: s };
});

registerCtx('xkDoubleVision', 'ae/p_x2_hold.jsx', function (c) {
  var node = c.node, cph = (((node.seed || 0) % 97) / 97) * TAU;
  node._jzTwins = node._jzTwins || [];
  [-1, 1].forEach(function (side) {
    node._jzTwins.push({
      label: 'Double vision ' + (side < 0 ? 'L' : 'R'), below: true,
      setup: function (graph, clone, src) {
        resampleTwin(graph, clone, src, function (base, f) {
          var env = V.envelope(c, node, f), xkK = env.amt * H.mk(c), xkKK = Math.min(1, xkK);
          var xko = Math.pow(Math.max(0, 0.5 - 0.5 * Math.cos(env.t * TAU / 3.6 + cph)), 1.6);
          var dx = side * node.size * 0.085 * xkK * xko;
          var dy = dx * 0.22 * Math.sin(env.t * TAU / 5.1 + cph);
          return { px: base.px + dx, py: base.py - dy, a: base.a * 0.36 * xkKK * (1 - env.pout * 6 > 0 ? Math.max(0, 1 - env.pout * 6) : 0) };
        });
      }
    });
  });
  return function () {};
});

registerSimple('xkFocusBreath', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), xkKK = Math.min(1, xkK), T = e.t - 0.55;
  if (T < 0) return null;
  var u = fract(T / 2.9) / 0.42;
  if (u >= 1) return null;
  var p = Math.pow(Math.max(0, Math.sin(PI * u)), 1.5);
  var out = { a: 1 - 0.14 * p * xkKK, blur: Math.min(e.size * 0.04, 9) * p * xkKK };
  scaleAbout(out, g, 0, 0, 1 + 0.03 * p * xkK, 1 + 0.03 * p * xkK);
  return out;
}, ['Emission requires a verified Gaussian-blur host profile.']);

registerSimple('xkHeatHaze', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), amp = e.size * 0.03 * xkK;
  var w1 = Math.sin(e.t * 4.2 + g.x * 0.04 + g.y * 0.03) * 0.7;
  var w2 = Math.sin(e.t * 5.3 + g.i * 1.1) * 0.5;
  return e.node.vertical ? { dx: amp * (w1 + w2) } : { dy: amp * (w1 + w2), dx: amp * 0.4 * w2 };
}, ['Native wave displacement is applied per glyph rather than pixel AE Wave Warp.']);

registerCtx('xkKaraoke', 'ae/p_x2_hold.jsx', function (c) {
  var node = c.node, gs = V.glyphs(c, node), b = V.bounds(gs), pad = node.size * 0.2;
  var x0 = b.x0 - pad, y0 = b.y0 - pad, x1 = b.x1 + pad, y1 = b.y1 + pad;
  var per = cl(1.5 + gs.length * 0.16, 2.2, 4), acc = H.accCol(c.sc), orig = node.color || c.sc.fg;
  return function (s, g, all, frame) {
    var env = V.envelope(c, node, frame), T = env.t - 0.25;
    if (T < 0 || env.amt < 0.05) { s.color = orig; return; }
    var u = fract(T / per), F = E.inOutSine(cl(u / 0.5)), Tl = E.inOutSine(cl((u - 0.62) / 0.38));
    var pos = node.vertical ? (g.y - y0) / Math.max(1, y1 - y0) : (g.x - x0) / Math.max(1, x1 - x0);
    s.color = (pos >= Tl && pos <= F) ? acc : orig;
  };
});

registerCtx('xkLevelFill', 'ae/p_x2_hold.jsx', function (c) {
  var node = c.node, gs = V.glyphs(c, node), b = V.bounds(gs), pad = node.size * 0.15;
  var x0 = b.x0 - pad, x1 = b.x1 + pad, y0 = b.y0 - pad, y1 = b.y1 + pad, h = Math.max(1, y1 - y0);
  var acc = H.accCol(c.sc), sd = (node.seed || 0) % 99991;
  node._jzTwins = node._jzTwins || [];
  node._jzTwins.push({
    label: 'Level fill', below: false,
    setup: function (graph, clone, src, g) {
      clone.attrs['material.materialColor'] = acc;
      var frames = [];
      for (var f = clone.start; f < clone.end; f++) {
        var env = V.envelope(c, node, f), lv = xkLoud(env.t, 1.3, sd) * Math.min(1, env.amt * H.mk(c));
        var top = y1 - h * (0.12 + 0.8 * lv);
        var s = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1 };
        var poly = V.polygon(x0, top, x1, y1 + pad);
        var gx = g.x + (g.vx || 0), gy = g.y + (g.vy || 0), ang = -(g.r90 ? 90 : 0) * Math.PI / 180;
        var cs = Math.cos(ang), sn = Math.sin(ang);
        frames.push(poly.map(function (pt) {
          var rx = pt[0] - gx, ry = pt[1] - gy;
          return [rx * cs - ry * sn, -(rx * sn + ry * cs)];
        }));
      }
      V.clipDeformer(graph, clone.id, frames, false, 'Level fill clip', c.options);
    }
  });
  return function () {};
});

registerSimple('xkLoudArch', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), lv = xkLoud(e.t, 1.7, e.seed % 99991);
  if (gs.length < 2) return { s: 1 + 0.04 * lv * xkK };
  var b = V.bounds(gs), half = Math.max(1, (e.node.vertical ? b.h : b.w) / 2);
  var u = cl(((e.node.vertical ? g.y - b.cy : g.x - b.cx)) / half, -1, 1);
  var A0 = e.size * 0.26 * lv * Math.min(xkK, 1.3), v = -A0 * (0.5 - u * u);
  return e.node.vertical ? { dx: -v } : { dy: v, rot: Math.atan(Math.min(0.35, 2 * A0 / half) * u) * 180 / PI };
});

registerCtx('xkLoudWeight', 'ae/p_x2_hold.jsx', function (c) {
  var node = c.node, sd = (node.seed || 0) % 99991, col = node.color || c.sc.fg;
  node._jzTwins = node._jzTwins || [];
  node._jzTwins.push({
    label: 'Loud weight', below: true,
    setup: function (graph, clone, src) {
      clone.attrs.fill = false;
      clone.attrs.stroke = true;
      clone.attrs['stroke.strokeColor'] = col;
      clone.attrs['stroke.width'] = 1;
      for (var f = clone.start; f < clone.end; f++) {
        var env = V.envelope(c, node, f), xkK = env.amt * H.mk(c);
        var w = Math.min(0.08, 0.065 * xkLoud(env.t, 2.1, sd) * xkK) * node.size;
        graph.key(clone.id, 'stroke.width', f, Math.max(0.5, w), 1);
      }
    }
  });
  return function () {};
});

registerSimple('xkMagnifier', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), tot = gs.length === 1 ? cutTotalChars({ node: e.node, cut: {} }) : gs.length;
  var idx = gs.length === 1 && e.node.mi != null ? e.node.mi : g.i;
  var per = 1.6 + tot * 0.3, pos = (tot + 1) * (0.5 - 0.5 * Math.cos(e.t * TAU / per)) - 1;
  var d = idx - pos, w = Math.exp(-d * d / 1.3), kk = Math.min(xkK, 1.2);
  var push = gs.length === 1 ? 0 : xkTanh(d / 1.1) * (1 - Math.exp(-d * d * 4)) * e.size * 0.2 * kk * cl(1.6 - Math.abs(d) * 0.12);
  var s = 1 + (gs.length === 1 ? 0.13 : 0.24) * kk * w;
  return e.node.vertical ? { s: s, dy: push } : { s: s, dx: push, dy: -(s - 1) * e.size * 0.3 };
});

registerCtx('xkMarchEdge', 'ae/p_x2_hold.jsx', function (c) {
  var node = c.node, gs = V.glyphs(c, node), b = V.bounds(gs), pad = node.size * 0.3;
  var col = H.accCol(c.sc), lw = Math.max(1.5, node.size * 0.028);
  node._jzTwins = node._jzTwins || [];
  node._jzTwins.push({
    label: 'Marching edge', below: false,
    setup: function (graph, clone, src, g) {
      clone.attrs.fill = false;
      clone.attrs.stroke = true;
      clone.attrs['stroke.strokeColor'] = col;
      clone.attrs['stroke.width'] = lw;
      var pitch = Math.max(8, node.size * 0.22), bw = pitch * 0.55;
      var by0 = b.y0 - pad, by1 = b.y1 + pad, bx0 = b.x0 - pad, bx1 = b.x1 + pad;
      var contours = {};
      for (var f = clone.start; f < clone.end; f++) {
        var env = V.envelope(c, node, f), xkKK = Math.min(1, env.amt * H.mk(c));
        var shift = (env.t * node.size * 0.42 * (0.4 + 0.6 * xkKK)) % pitch;
        var polys = [];
        for (var x = bx0 - pitch + shift; x < bx1 + pitch; x += pitch) {
          var inv = S.inverse(S.matrix(graph, clone.id, f));
          var pts = [[x, by0], [x + bw, by0], [x + bw - (by1 - by0) * 0.5, by1], [x - (by1 - by0) * 0.5, by1]];
          polys.push(pts.map(function (pt) {
            var gx = g.x + (g.vx || 0), gy = g.y + (g.vy || 0), ang = -(g.r90 ? 90 : 0) * Math.PI / 180;
            var cs = Math.cos(ang), sn = Math.sin(ang), rx = pt[0] - gx, ry = pt[1] - gy;
            return [rx * cs - ry * sn, -(rx * sn + ry * cs)];
          }));
        }
        contours[f] = polys;
      }
      var clipFrames = [];
      for (var f2 = clone.start; f2 < clone.end; f2++) {
        clipFrames.push(contours[f2][0] || [[0, 0], [1, 0], [0, 1]]);
      }
      V.clipDeformer(graph, clone.id, clipFrames, false, 'Marching band clip', c.options);
    }
  });
  return function () {};
});

registerSimple('xkMetronome', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), b = e.beat(0.62), to = b.index % 2 ? 1 : -1;
  var r = (-to + 2 * to * E.inOutCubic(cl(b.since / (b.len * 0.55)))) * 2.4 * xkK;
  var box = V.bounds(gs), py = box.y1 + Math.max(e.size * 1.2, (box.y1 - box.y0) * 0.8);
  var out = { dx: 0, dy: 0, rot: 0 };
  rotAbout(out, g, box.cx, py, r);
  return out;
});

registerSimple('xkNod', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var plain = nonSpaceGlyphs(gs);
  if (!plain.length) return null;
  var xkK = a * cl(e.M / 0.7, 0, 1.6), b = e.beat(0.5), u = b.since / Math.min(b.len * 0.95, 0.6);
  var target = plain[b.index % plain.length];
  if (u >= 1 || g.i !== target.i) return null;
  var hv = u < 0.35 ? E.outCubic(u / 0.35) : Math.cos((u - 0.35) / 0.65 * PI * 1.5) * Math.exp(-(u - 0.35) * 3.2);
  var th = 17 * xkK * hv * PI / 180;
  return { dx: e.size * 0.5 * Math.sin(th), dy: e.size * 0.5 * (1 - Math.cos(th)), rot: th * 180 / PI };
});

registerSimple('xkPairUp', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), dur = Math.max(0.5, e.dur || 1.5), n = Math.max(1, Math.round(dur / 1.5)), per = dur / n;
  if (!(per > 1 && per < 2.25)) per = 1.5;
  function sdFn(ci, nl, par) { return ((ci - par) % 2 + 2) % 2 === 0 ? (ci + 1 < nl ? 1 : 0) : (ci - 1 >= par ? -1 : 0); }
  var T = e.t / per, cyc = Math.floor(T), ev = E.inOutCubic(cl((T - cyc) / 0.4));
  var ci = e.node.vertical ? g.li : g.ci, nl = e.node.vertical ? R.rows(gs, gs[0]).length : g.n;
  var v = sdFn(ci, nl, (cyc + 1) % 2) * (1 - ev) + sdFn(ci, nl, cyc % 2) * ev;
  return e.node.vertical ? { dy: v * e.size * 0.06 * xkK } : { dx: v * e.size * 0.06 * xkK, rot: v * 5 * xkK };
});

registerSimple('xkParallax', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), xkKK = Math.min(1, xkK), cph = ((e.seed % 97) / 97) * TAU;
  var q = (Math.floor(rand(e.seed, g.i, 711) * 3) % 3) - 1;
  var sway = Math.sin(e.t * TAU / 4.6 + cph), bob = Math.sin(e.t * TAU / 6.3 + 1);
  return { dx: sway * e.size * 0.075 * q * xkK, dy: bob * e.size * 0.022 * q * xkK, s: 1 + 0.06 * q * xkKK, a: q < 0 ? 1 - 0.22 * xkKK : 1 };
});

registerCtx('xkReflection', 'ae/p_x2_hold.jsx', function (c) {
  var node = c.node, gs = V.glyphs(c, node), b = V.bounds(gs), fs = node.size, sq = 0.72;
  var Y0 = b.y1 - fs * 0.03;
  node._jzTwins = node._jzTwins || [];
  node._jzTwins.push({
    label: 'Reflection', below: true,
    setup: function (graph, clone, src, g) {
      var gy = g.y + (g.vy || 0), pyFlip = -Y0 + sq * (-Y0 - (-gy));
      resampleTwin(graph, clone, src, function (base, f) {
        var env = V.envelope(c, node, f), xkK = env.amt * H.mk(c), xkKK = Math.min(1, xkK);
        var ph = env.t * 2.6 + g.i * 1.3;
        return {
          px: base.px + Math.sin(ph) * fs * 0.014 * xkK,
          py: -Y0 - (-gy - Y0) * sq - (base.py - (-gy)) * sq,
          sy: -Math.abs(base.sy) * sq * (1 + 0.05 * Math.sin(ph * 1.3)),
          rot: base.rot + Math.sin(ph + 1) * 3 * xkKK,
          a: base.a * 0.34 * xkKK * (env.pout > 0 ? Math.max(0, 1 - env.pout * 6) : 1)
        };
      });
    }
  });
  return function () {};
});

registerSimple('xkRippleOut', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), span = Math.max(3, Math.min(gs.length, 16)) * 0.075;
  var T = e.t - 0.3;
  if (T < 0) return null;
  var cyc = Math.floor(T / 2.3), e0 = hh(cyc * 9.17 + (e.seed % 99991) + 1), d = Math.abs(R.order(g, gs, e) - e0);
  var tau = T - cyc * 2.3 - d * span * 2.2;
  var y = tau <= 0 ? 0 : Math.exp(-tau * 3) * Math.sin(tau * 12) / (1 + d * 1.4);
  return e.node.vertical ? { dx: y * e.size * 0.17 * xkK, s: 1 + 0.06 * y * xkK } : { dy: -y * e.size * 0.17 * xkK, s: 1 + 0.06 * y * xkK };
});

registerSimple('xkSlideBunch', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), cph = ((e.seed % 97) / 97) * TAU, T = e.t * TAU / 4.4 + cph;
  var out = { dx: 0, dy: 0, rot: 0 };
  rotAbout(out, g, 0, 0, Math.sin(T) * 3 * xkK);
  if (gs.length > 1) {
    var b = V.bounds(gs), half = Math.max(1, (e.node.vertical ? b.h : b.w) / 2);
    var u = cl(((e.node.vertical ? g.y - b.cy : g.x - b.cx)) / half, -1, 1);
    var v = half * 0.15 * Math.min(xkK, 1.3) * Math.sin(T - 0.9) * (1 - u * u);
    if (e.node.vertical) out.dy += v; else out.dx += v;
  }
  return out;
});

registerSimple('xkSpinOne', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var plain = nonSpaceGlyphs(gs);
  if (!plain.length) return null;
  var xkK = a * cl(e.M / 0.7, 0, 1.6), xkKK = Math.min(1, xkK), full = cl(e.M / 0.7, 0, 1.6) >= 0.4;
  var T = e.t - 0.35;
  if (T < 0) return null;
  var cyc = Math.floor(T / 1.5), u = (T - cyc * 1.5) / 0.8;
  if (u >= 1) return null;
  var pk = Math.floor(hh(cyc * 5.3 + (e.seed % 99991) + 0.25) * 10007);
  var target = plain[pk % plain.length];
  if (g.i !== target.i) return null;
  var dr = hh(cyc * 7.9 + (e.seed % 99991) + 3) < 0.5 ? 1 : -1;
  return { rot: full ? dr * 360 * E.inOutCubic(u) * a : dr * 14 * xkK * Math.sin(TAU * u), s: 1 + 0.12 * Math.sin(PI * u) * xkKK };
});

registerCtx('xkSplitShear', 'ae/p_x2_hold.jsx', function (c) {
  var node = c.node, gs = V.glyphs(c, node), b = V.bounds(gs), fs = node.size;
  var Vax = !!node.vertical, par = Math.floor(rand(node.seed || 0, 751, 1) * 2) % 2;
  var big = b.w + b.h + fs * 20, eps = fs * 0.006;
  function shearState(frame) {
    var env = V.envelope(c, node, frame), xkK = env.amt * H.mk(c);
    var T = env.t - 0.4;
    if (T < 0 || env.pout > 0) return { on: false, d: 0 };
    var cyc = Math.floor(T / 2.4), u = T - cyc * 2.4, dr = (par + cyc) % 2 ? 1 : -1;
    var v = u >= 1 ? 0 : (u < 0.3 ? E.outCubic(u / 0.3) : (u < 0.7 ? 1 : 1 - E.inOutCubic((u - 0.7) / 0.3)));
    var d = dr * fs * 0.055 * xkK * v;
    return { on: Math.abs(d) >= 0.3, d: d };
  }
  node._jzTwins = node._jzTwins || [];
  node._jzTwins.push({
    label: 'Shear half', below: false,
    setup: function (graph, clone, src, g) {
      var frames = [];
      for (var f = clone.start; f < clone.end; f++) {
        var st = shearState(f);
        var poly = st.on ? (Vax ? V.polygon(b.cx - eps, b.y0 - big, b.x1 + big, b.y1 + big) : V.polygon(b.x0 - big, b.cy - eps, b.x1 + big, b.y1 + big))
          : V.polygon(b.x0 - big, b.y0 - big, b.x1 + big, b.y1 + big);
        var gx = g.x + (g.vx || 0), gy = g.y + (g.vy || 0), ang = -(g.r90 ? 90 : 0) * Math.PI / 180;
        var cs = Math.cos(ang), sn = Math.sin(ang);
        frames.push(poly.map(function (pt) { var rx = pt[0] - gx, ry = pt[1] - gy; return [rx * cs - ry * sn, -(rx * sn + ry * cs)]; }));
      }
      V.clipDeformer(graph, clone.id, frames, false, 'Shear half clip', c.options);
      resampleTwin(graph, clone, src, function (base, f) {
        var st = shearState(f);
        if (!st.on) return { a: 0 };
        return Vax ? { py: base.py + st.d } : { px: base.px - st.d };
      });
    }
  });
  return function (s, g, all, frame) {
    var st = shearState(frame);
    if (!st.on) return;
    s.clipPolygon = Vax ? V.polygon(b.x0 - big, b.y0 - big, b.cx + eps, b.y1 + big) : V.polygon(b.x0 - big, b.y0 - big, b.x1 + big, b.cy + eps);
    if (Vax) s.dy += st.d; else s.dx += st.d;
  };
});

registerSimple('xkStairStep', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), b = e.beat(0.375), ev = cl(b.since / 0.07);
  function l3(ci, ix) { return ((ci - ix) % 3 + 3) % 3 - 1; }
  var ci = e.node.vertical ? g.li : g.ci;
  var v = -(l3(ci, b.index - 1) * (1 - ev) + l3(ci, b.index) * ev) * e.size * 0.05 * xkK;
  return e.node.vertical ? { dx: -v } : { dy: v };
});

registerSimple('xkStopMotion', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), q = Math.floor(e.t * 8 + 0.001), cph = ((e.seed % 97) / 97) * TAU;
  var out = {
    dx: xkNoise(q * 0.31, (e.seed % 977) + 3) * e.size * 0.06 * xkK,
    dy: xkNoise(q * 0.37, (e.seed % 977) + 11) * e.size * 0.045 * xkK + (hh(q * 5.71 + g.i * 3.3 + e.seed + 9) * 2 - 1) * e.size * 0.008 * xkK,
    rot: (hh(q * 3.13 + g.i * 7.7 + e.seed) * 2 - 1) * 1.6 * xkK
  };
  rotAbout(out, g, 0, 0, Math.sin(q * 0.42 + cph) * 2.2 * xkK);
  return out;
});

registerSimple('xkTiltSnap', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), par = Math.floor(rand(e.seed, 731, 1) * 2) % 2;
  var T = e.t / 2.6, cyc = Math.floor(T), u = T - cyc, dr = (par + cyc) % 2 ? 1 : -1;
  var v = u < 0.9 ? Math.pow(u / 0.9, 1.4) : 1 - E.outBack((u - 0.9) / 0.1, 2.4);
  var out = { dx: 0, dy: v * e.size * 0.02 * xkK, rot: 0 };
  rotAbout(out, g, 0, 0, dr * 3.4 * xkK * v);
  return out;
});

registerSimple('xkWallBounce', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), Vax = !!e.node.vertical;
  var R0 = Math.min((Vax ? e.H : e.W) * 0.028, e.size * 0.4), b = V.bounds(gs);
  var p = e.t / 1.5, tr = Math.asin(Math.sin(PI * p)) * 2 / PI * R0 * xkK, q = 0, sd = 1;
  if (p > 0.5) {
    var ta = fract(p - 0.5) * 1.5;
    q = 0.07 * xkK * Math.exp(-ta * 9) * Math.cos(ta * 24);
    sd = Math.floor(p - 0.5) % 2 ? -1 : 1;
  }
  var out = { dx: Vax ? 0 : tr, dy: Vax ? tr : 0, sx: 1, sy: 1 };
  if (Vax) scaleAbout(out, g, b.cx, sd > 0 ? b.y1 : b.y0, 1 + q * 0.5, 1 - q);
  else scaleAbout(out, g, sd > 0 ? b.x1 : b.x0, b.cy, 1 - q, 1 + q * 0.5);
  return out;
});

registerSimple('xkZigzagFlip', 'ae/p_x2_hold.jsx', function (a, g, gs, e) {
  var xkK = a * cl(e.M / 0.7, 0, 1.6), b = e.beat(0.55), to = b.index % 2 ? 1 : -1;
  var ci = e.node.vertical ? g.li : g.ci;
  var v = (-to + 2 * to * E.outBack(cl(b.since / 0.16), 2.4)) * e.size * 0.042 * xkK * (ci % 2 ? 1 : -1);
  return e.node.vertical ? { dx: -v } : { dy: v };
});
})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
