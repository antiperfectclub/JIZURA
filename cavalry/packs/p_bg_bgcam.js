/* Cavalry native backgrounds ported from src/11p_bgcamB.js (36 recipes). */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, TAU = H.TAU, DEG = H.DEG;

function register(key, build, differences) {
  N.register('bg', key, {
    source: 'src/11p_bgcamB.js',
    scope: 'cut',
    build: build,
    differences: differences || []
  });
}

function wrap(v, m) {
  return ((v % m) + m) % m;
}

function fract(v) {
  return v - Math.floor(v);
}

function hues(sc) {
  var out = [], seen = Object.create(null);
  [sc.accent, sc.accent2, sc.ghostA, sc.ghostB, sc.fg].forEach(function (col) {
    if (!col || H.contrast(col, sc.bg) < 1.25) return;
    var k = String(col).toLowerCase();
    if (!seen[k]) { seen[k] = 1; out.push(col); }
  });
  return out.length ? out : [sc.fg];
}

function glowOf(sc) {
  var L = H.lum(sc.bg), list = [sc.accent, sc.accent2, sc.ghostA, sc.ghostB, sc.fg];
  for (var i = 0; i < list.length; i++) {
    if (list[i] && H.lum(list[i]) > L + 0.25) return list[i];
  }
  return sc.fg;
}

function lightOn(sc) {
  if (H.dark(sc.bg)) return glowOf(sc);
  return H.lum(sc.bg) < 0.78 ? '#FFFFFF' : H.mixHex(sc.accent, '#FFFFFF', 0.2);
}

function hash2(x, y, s) {
  var h = ((x | 0) * 374761393 + (y | 0) * 668265263 + (s | 0) * 144665) | 0;
  h = Math.imul ? Math.imul(h ^ (h >>> 13), 1274126177) : ((h ^ (h >>> 13)) * 1274126177) | 0;
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function noise2(x, y, s) {
  var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  var u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  var a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s);
  var c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm2(x, y, s, oct) {
  var v = 0, a = 0.5, f = 1, n = 0;
  for (var i = 0; i < (oct || 3); i++) {
    v += noise2(x * f, y * f, s + i * 101) * a;
    n += a; a *= 0.5; f *= 2.03;
  }
  return v / n;
}

function fbm1(x, s, oct) {
  var v = 0, a = 0.5, f = 1, n = 0;
  for (var i = 0; i < (oct || 3); i++) {
    v += R.noise(x * f, s + i * 53) * a;
    n += a; a *= 0.5; f *= 2.1;
  }
  return v / n;
}

function softGlow(c, name, cx, cy, R, col, stops, animFn) {
  stops.forEach(function (st, idx) {
    var r = Math.max(2, R * st[0]), a = st[1];
    var id = C.shape(c.graph, c.cut, c.cut.id + ' / ' + name + ' ' + idx, c.parent,
      G.ellipse(0, 0, r, r), { fill: col, alpha: a });
    c.graph.byId[id].attrs.position = H.toScene(c, cx, cy);
    if (animFn) {
      V.animate(c, id, function (e, f) { return animFn(e, f, a, idx); });
    }
  });
}

function cmdsFromPts(pts, close, W, Hh) {
  var out = [];
  for (var i = 0; i < pts.length; i++) {
    out.push([i ? 'L' : 'M', pts[i][0] - W / 2, Hh / 2 - pts[i][1]]);
  }
  if (close) out.push(['Z']);
  return out;
}

/* ================= GRADIENT ================= */

/* 1. auroraRibbons */
register('auroraRibbons', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'auroraRibbons'), seed = H.p(P, 'seed', 1), nR = Math.max(1, Math.round(H.p(P, 'n', 2)));
  var baseY = H.p(P, 'y', 0.42), c0 = Math.round(H.p(P, 'c0', 0)), k = H.p(P, 'k', 0.24) * (dk ? 1.15 : 0.8);
  var cols = hues(c.sc), lc = [];
  var bgLum = H.lum(c.sc.bg);
  cols.forEach(function (col) { if (H.lum(col) > bgLum + 0.12) lc.push(col); });
  if (!dk || !lc.length) lc = [lightOn(c.sc), c.sc.accent];
  var Ncol = 22, cw = W / Ncol + 2;
  for (var r = 0; r < nR; r++) {
    (function (ri) {
      var col = lc[(c0 + ri) % lc.length], dir = ri % 2 ? -1 : 1, ph = (seed % 97) * 0.13 + ri * 2.1;
      var by = Hh * (baseY + ri * 0.1 - 0.05), maxH = Math.max(W, Hh) * 0.34 * (1 - 0.25 * ri / 3);
      for (var i = 0; i < Ncol; i++) {
        (function (ci) {
          var u = (ci + 0.5) / Ncol, xScene = (ci + 0.5) * (W / Ncol) - W / 2;
          var edgeEnv = H.smoothstep(0, 0.18, u) * H.smoothstep(1, 0.82, u);
          var outer = C.shape(c.graph, c.cut, c.cut.id + ' / Aurora col ' + ri + '_' + ci, c.parent,
            G.rect(-cw / 2, 0, cw, maxH), { fill: col, alpha: 0.3 });
          var core = C.shape(c.graph, c.cut, c.cut.id + ' / Aurora core ' + ri + '_' + ci, c.parent,
            G.rect(-cw / 2, maxH * 0.05, cw, maxH * 0.28), { fill: col, alpha: 0.5 });
          [outer, core].forEach(function (id, part) {
            V.animate(c, id, function (e, f) {
              var t = clk.absTime(f), q = clk.enter(f, 1.2);
              var y = by + Hh * 0.07 * Math.sin(u * TAU * 0.75 + t * 0.3 * dir + ph) + Hh * 0.045 * R.noise(u * 3.5 + t * 0.22 * dir, seed + ri * 7);
              var hScale = (0.65 + 0.35 * R.noise(u * 2.6 - t * 0.15, seed + ri * 13 + 5)) * (0.8 + 0.2 * q);
              var ray = Math.pow(0.5 + 0.5 * R.noise(u * 34 + t * 0.9 * dir, seed + ri * 31), 1.4) * (0.7 + 0.3 * R.noise(u * 13 - t * 0.4, seed + ri * 3));
              var a = k * q * (0.2 + 1.0 * ray) * edgeEnv * (part ? 0.55 : 0.28);
              return { 'position.x': xScene, 'position.y': Hh / 2 - y, 'scale.y': Math.max(0.05, hScale), alpha: cl(a) };
            });
          });
        })(i);
      }
    })(r);
  }
}, ['Curtains use soft overlapping vertical column pairs instead of per-pixel image gradient strips.']);

/* 2. meshBlobs */
register('meshBlobs', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'meshBlobs'), seed = H.p(P, 'seed', 1), n = Math.max(2, Math.round(H.p(P, 'n', 3)));
  var cols = hues(c.sc), k = H.p(P, 'k', 0.25) * (dk ? 1 : 0.75), R0 = Math.max(W, Hh) * 0.5;
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var w1 = mix(0.16, 0.3, N.random(seed, idx, 1)), w2 = mix(0.14, 0.26, N.random(seed, idx, 2));
      var ph1 = N.random(seed, idx, 3) * TAU, ph2 = N.random(seed, idx, 4) * TAU;
      var R = R0 * mix(0.75, 1.1, N.random(seed, idx, 5));
      var col = H.mixHex(c.sc.bg, cols[idx % cols.length], k);
      [[1.0, 0.22], [0.65, 0.36], [0.35, 0.42]].forEach(function (st, ring) {
        var r = Math.max(4, R * st[0]);
        var id = C.shape(c.graph, c.cut, c.cut.id + ' / Mesh blob ' + idx + '_' + ring, c.parent,
          G.ellipse(0, 0, r, r), { fill: col, alpha: st[1] });
        V.animate(c, id, function (e, f) {
          var t = clk.absTime(f), q = clk.enter(f, 1.0);
          var cx = W * (0.5 + 0.42 * Math.sin(t * w1 + ph1)), cy = Hh * (0.5 + 0.4 * Math.cos(t * w2 + ph2));
          var sc = 1 + 0.08 * Math.sin(t * 0.45 + idx * 1.7), pos = H.toScene(c, cx, cy);
          return { 'position.x': pos[0], 'position.y': pos[1], 'scale.x': sc, 'scale.y': sc, alpha: st[1] * q };
        });
      });
    })(i);
  }
}, ['Radial gradients use 3 nested concentric orbs per blob.']);

/* 3. duotoneSweep */
register('duotoneSweep', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, cols = hues(c.sc);
  var clk = H.bgClock(c, 'duotoneSweep'), k = H.p(P, 'k', 0.16);
  var cA = H.mixHex(c.sc.bg, cols[0], k), cB = H.mixHex(c.sc.bg, cols[1] || c.sc.fg, k);
  var pos = Array.isArray(P.pos) ? P.pos : [0.5, 1.2], spd = H.p(P, 'spd', 0.1), a0 = H.p(P, 'a0', 0);
  var R = Math.hypot(W, Hh) * 2.2, sectors = 16;
  var pivot = H.toScene(c, W * pos[0], Hh * pos[1]);
  var rig = c.graph.add('null', c.cut.id + ' / Duotone sweep', c.parent, c.cut.start, c.cut.end, { position: pivot });
  V.animate(c, rig, function (e, f) { return { rotation: -(a0 / DEG + clk.absTime(f) * spd / DEG) }; });
  for (var i = 0; i < sectors; i++) {
    (function (idx) {
      var a1 = idx / sectors * TAU, a2 = (idx + 1) / sectors * TAU;
      var mixAmt = 0.5 - 0.5 * Math.cos(idx / sectors * TAU * 2);
      var col = H.mixHex(cA, cB, mixAmt);
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Duotone sector ' + idx, rig,
        [['M', 0, 0], ['L', Math.cos(a1) * R, -Math.sin(a1) * R], ['L', Math.cos(a2) * R, -Math.sin(a2) * R], ['Z']],
        { fill: col, alpha: 0.85 });
      V.animate(c, id, function (e, f) { return { alpha: 0.85 * clk.enter(f, 0.8) }; });
    })(i);
  }
}, ['Conic sweep approximated with 16 smooth-stepped angular sectors.']);

/* 4. horizonGlow */
register('horizonGlow', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'horizonGlow'), seed = H.p(P, 'seed', 1);
  var R = Math.max(W, Hh) * H.p(P, 'R', 1.6), cxFrac = H.p(P, 'cx', 0.5), topFrac = H.p(P, 'top', 0.75);
  var gc = dk ? glowOf(c.sc) : H.tintC(c.sc, 0.8), k = H.p(P, 'k', 0.32) * (dk ? 1 : 0.55);
  var bodyCol = dk ? H.mixHex(c.sc.bg, '#000000', 0.42) : H.mixHex(c.sc.bg, c.sc.fg, 0.05);
  function planetPos(f) {
    var t = clk.absTime(f), q = clk.enter(f, 1.1);
    return {
      cx: W * cxFrac + W * 0.03 * Math.sin(t * 0.08 + (seed % 9)),
      cy: Hh * topFrac + R + (1 - q) * Hh * 0.25 + Hh * 0.008 * Math.sin(t * 0.25),
      q: q, breathe: 0.85 + 0.15 * Math.sin(t * 0.7), t: t
    };
  }
  [1.18, 1.09, 1.03].forEach(function (mult, idx) {
    var aBase = k * (idx === 2 ? 0.55 : idx === 1 ? 0.28 : 0.12);
    var halo = C.shape(c.graph, c.cut, c.cut.id + ' / Horizon halo ' + idx, c.parent,
      G.ellipse(0, 0, R * mult, R * mult), { fill: gc, alpha: aBase });
    V.animate(c, halo, function (e, f) {
      var p = planetPos(f), pos = H.toScene(c, p.cx, p.cy);
      return { 'position.x': pos[0], 'position.y': pos[1], alpha: aBase * p.breathe * p.q };
    });
  });
  var body = C.shape(c.graph, c.cut, c.cut.id + ' / Planet body', c.parent,
    G.ellipse(0, 0, R, R), { fill: bodyCol, stroke: gc, width: Math.max(1.5, U * 0.0022), alpha: 1 });
  V.animate(c, body, function (e, f) {
    var p = planetPos(f), pos = H.toScene(c, p.cx, p.cy);
    return { 'position.x': pos[0], 'position.y': pos[1], alpha: p.q };
  });
  softGlow(c, 'Planet flare', W / 2, Hh / 2, U * 0.3, dk ? gc : lightOn(c.sc), [
    [0.35, k * 0.45], [0.7, k * 0.2], [1.0, k * 0.08]
  ], function (e, f, ba) {
    var p = planetPos(f), fa = -Math.PI / 2 + 0.22 * Math.sin(p.t * 0.12 + (seed % 13));
    var pos = H.toScene(c, p.cx + Math.cos(fa) * R, p.cy + Math.sin(fa) * R);
    return { 'position.x': pos[0], 'position.y': pos[1], alpha: ba * p.breathe * p.q };
  });
});

/* ================= PATTERN ================= */

/* 5. seigaiha */
register('seigaiha', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'seigaiha'), R = Math.max(U * H.p(P, 'R', 0.08), 42);
  var rings = Math.max(2, Math.min(4, Math.round(H.p(P, 'rings', 4)))), k = H.p(P, 'k', 0.09);
  var dir = H.p(P, 'dir', 1), col = P.acc ? H.tintC(c.sc, k * 1.6) : H.layC(c.sc, k);
  var pw = 2 * R, ph = R, ni = Math.ceil(W / pw) + 3, nj = Math.ceil(Hh / (R / 2)) + 5;
  var bgDisks = [], ringCmds = [], dots = [];
  for (var j = -2; j < nj; j++) {
    for (var i = -1; i < ni; i++) {
      var cx = i * pw + ((j & 1) ? R : 0) - W / 2, cy = Hh / 2 - j * (R / 2);
      bgDisks = bgDisks.concat(G.ellipse(cx, cy, R * 0.99, R * 0.99));
      for (var m = 0; m < rings; m++) {
        var rm = R * (1 - m / rings) - R * 0.045;
        if (rm > 2) ringCmds = ringCmds.concat(G.ellipse(cx, cy, rm, rm));
      }
      dots = dots.concat(G.ellipse(cx, cy, R / rings * 0.5, R / rings * 0.5));
    }
  }
  var rig = c.graph.add('null', c.cut.id + ' / Seigaiha rig', c.parent, c.cut.start, c.cut.end, {});
  C.shape(c.graph, c.cut, c.cut.id + ' / Seigaiha mask disks', rig, bgDisks, { fill: c.sc.bg, alpha: 1 });
  C.shape(c.graph, c.cut, c.cut.id + ' / Seigaiha cores', rig, dots, { fill: H.layC(c.sc, k * 0.35), alpha: 1 });
  C.shape(c.graph, c.cut, c.cut.id + ' / Seigaiha arcs', rig, ringCmds, { stroke: col, width: Math.max(1.2, R * 0.075), alpha: 1 });
  V.animate(c, rig, function (e, f) {
    var t = clk.absTime(f), q = clk.enter(f, 0.7);
    var ox = wrap(t * R * 0.22 * dir, pw) - pw;
    var oy = wrap(R * 0.5 + Math.sin(t * 0.5) * R * 0.08 - (1 - q) * R * 0.5, ph) - ph;
    return { 'position.x': ox, 'position.y': oy, alpha: q };
  });
});

/* 6. asanoha */
register('asanoha', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'asanoha'), a = Math.max(U * H.p(P, 'a', 0.12), 54), h = a * Math.sqrt(3) / 2;
  var dxDir = H.p(P, 'dx', 1), col = H.layC(c.sc, H.p(P, 'k', 0.09));
  var ni = Math.ceil(W / a) + 3, nr = Math.ceil(Hh / h) + 4, cmds = [];
  function pt(r, i) { return [i * a + ((r & 1) ? a / 2 : 0) - W / 2, Hh / 2 - r * h]; }
  function addTri(A, B, Cpt) {
    var gx = (A[0] + B[0] + Cpt[0]) / 3, gy = (A[1] + B[1] + Cpt[1]) / 3;
    cmds.push(['M', A[0], A[1]], ['L', B[0], B[1]], ['L', Cpt[0], Cpt[1]], ['Z']);
    [A, B, Cpt].forEach(function (Q) { cmds.push(['M', gx, gy], ['L', Q[0], Q[1]]); });
  }
  for (var r = -2; r < nr; r++) {
    for (var i = -2; i < ni; i++) {
      if (!(r & 1)) { addTri(pt(r, i), pt(r, i + 1), pt(r + 1, i)); addTri(pt(r + 1, i), pt(r + 1, i + 1), pt(r, i + 1)); }
      else { addTri(pt(r, i), pt(r, i + 1), pt(r + 1, i + 1)); addTri(pt(r + 1, i), pt(r + 1, i + 1), pt(r, i)); }
    }
  }
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Asanoha lattice', c.parent, cmds,
    { stroke: col, width: Math.max(1, a * 0.018), alpha: 1 });
  V.animate(c, id, function (e, f) {
    var t = clk.absTime(f), q = clk.enter(f, 0.8);
    return {
      'position.x': wrap(t * a * 0.08 * dxDir, a) - a,
      'position.y': -(wrap(t * h * 0.05 + (1 - q) * h, 2 * h) - 2 * h),
      alpha: q
    };
  });
});

/* 7. houndstooth */
register('houndstooth', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'houndstooth'), cell = Math.max(U * H.p(P, 'c', 0.045), 26);
  var k = H.p(P, 'k', 0.065), dxDir = H.p(P, 'dx', 1);
  var col = P.acc ? H.tintC(c.sc, k * 1.7) : H.layC(c.sc, k);
  var nx = Math.ceil(W / (2 * cell)) + 2, ny = Math.ceil(Hh / (2 * cell)) + 2, cmds = [];
  function pushPoly(pts) {
    pts.forEach(function (pt, idx) { cmds.push([idx ? 'L' : 'M', pt[0] - W / 2, Hh / 2 - pt[1]]); });
    cmds.push(['Z']);
  }
  for (var j = -1; j <= ny; j++) {
    for (var i = -1; i <= nx; i++) {
      var ox = i * 2 * cell, oy = j * 2 * cell;
      cmds = cmds.concat(G.rect(ox - W / 2, Hh / 2 - (oy + cell), cell, cell));
      [[ox + cell, oy], [ox, oy + cell]].forEach(function (b) {
        var bx = b[0], by = b[1];
        pushPoly([[bx, by], [bx + cell / 2, by], [bx, by + cell / 2]]);
        pushPoly([[bx + cell, by], [bx + cell, by + cell / 2], [bx + cell / 2, by + cell], [bx, by + cell]]);
      });
    }
  }
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Houndstooth', c.parent, cmds, { fill: col, alpha: 1 });
  V.animate(c, id, function (e, f) {
    var t = clk.absTime(f), d = t * cell * 0.35, q = clk.enter(f, 0.6);
    return { 'position.x': wrap(d * dxDir, 2 * cell) - 2 * cell, 'position.y': -(wrap(d * 0.6, 2 * cell) - 2 * cell), alpha: q };
  });
});

/* 8. herringbone */
register('herringbone', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'herringbone'), u = Math.max(U * H.p(P, 'u', 0.038), 22);
  var k = H.p(P, 'k', 0.08), dir = H.p(P, 'dir', 1), rot = H.p(P, 'rot', 45);
  var cA = H.layC(c.sc, k), cB = H.layC(c.sc, k * 0.45), Pd = 4 * u * Math.SQRT2, D = Math.hypot(W, Hh) / 2 + Pd;
  var rig = c.graph.add('null', c.cut.id + ' / Herringbone rig', c.parent, c.cut.start, c.cut.end, { rotation: -rot });
  var cmdsA = [], cmdsB = [], g = u * 0.1;
  var Kmax = Math.ceil(D / u) + 3, Mmax = Math.ceil(D / (2 * u)) + 3;
  for (var kk = -Kmax; kk <= Kmax; kk++) {
    for (var m = -Mmax; m <= Mmax; m++) {
      var bx = (kk + 2 * m) * u, by = (kk - 2 * m) * u;
      if (Math.abs(bx) > D || Math.abs(by) > D) continue;
      cmdsA = cmdsA.concat(G.rect(bx + g, by + g, 2 * u - 2 * g, u - 2 * g));
      cmdsB = cmdsB.concat(G.rect(bx + 2 * u + g, by - u + g, u - 2 * g, 2 * u - 2 * g));
    }
  }
  var idA = C.shape(c.graph, c.cut, c.cut.id + ' / Herringbone A', rig, cmdsA, { fill: cA, alpha: 1 });
  var idB = C.shape(c.graph, c.cut, c.cut.id + ' / Herringbone B', rig, cmdsB, { fill: cB, alpha: 1 });
  [idA, idB].forEach(function (id) {
    V.animate(c, id, function (e, f) {
      var t = clk.absTime(f), sp = wrap(t * u * 0.6 * dir, 4 * u) - 2 * u;
      return { 'position.x': sp, 'position.y': -sp, alpha: clk.enter(f, 0.7) };
    });
  });
});

/* 9. argyle */
register('argyle', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'argyle'), dw = U * H.p(P, 'dw', 0.18), dh = dw * H.p(P, 'asp', 1.4);
  var k = H.p(P, 'k', 0.07), up = H.p(P, 'up', 1);
  var cA = H.layC(c.sc, k), cB = H.tintC(c.sc, k * 1.6), cL = H.layC(c.sc, k * 3);
  var nx = Math.ceil(W / dw) + 3, ny = Math.ceil(Hh / dh) + 3;
  var diaA = [], diaB = [], lines = [];
  for (var j = -1; j <= ny; j++) {
    for (var i = -1; i <= nx; i++) {
      var cx = i * dw - W / 2, cy = Hh / 2 - j * dh;
      var poly = [['M', cx, cy + dh / 2], ['L', cx + dw / 2, cy], ['L', cx, cy - dh / 2], ['L', cx - dw / 2, cy], ['Z']];
      if ((i + j) & 1) diaB = diaB.concat(poly); else diaA = diaA.concat(poly);
      lines.push(['M', cx - dw / 2, cy], ['L', cx + dw / 2, cy - dh], ['M', cx + dw / 2, cy], ['L', cx - dw / 2, cy - dh]);
    }
  }
  var idA = C.shape(c.graph, c.cut, c.cut.id + ' / Argyle A', c.parent, diaA, { fill: cA, alpha: 1 });
  var idB = C.shape(c.graph, c.cut, c.cut.id + ' / Argyle B', c.parent, diaB, { fill: cB, alpha: 1 });
  var idL = C.shape(c.graph, c.cut, c.cut.id + ' / Argyle cross', c.parent, lines, { stroke: cL, width: Math.max(1, dw * 0.012), alpha: 0.9 });
  [idA, idB].forEach(function (id) {
    V.animate(c, id, function (e, f) {
      var t = clk.absTime(f), q = clk.enter(f, 0.6), d = t * dh * 0.1 * up;
      return { 'position.y': -(wrap(d - (1 - q) * dh * 0.3, 2 * dh) - 2 * dh), alpha: q };
    });
  });
  V.animate(c, idL, function (e, f) {
    var t = clk.absTime(f), q = clk.enter(f, 0.6), d = t * dh * 0.1 * up;
    return { 'position.x': wrap(-d * 0.6, dw) - dw, 'position.y': -(wrap(-d, dh) - dh), alpha: q * 0.9 };
  });
});

/* 10. tartan */
register('tartan', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'tartan'), S0 = U * H.p(P, 'S', 0.42), k = H.p(P, 'k', 0.1);
  var w1 = H.p(P, 'w1', 0.22), w2 = H.p(P, 'w2', 0.1);
  var cA = H.layC(c.sc, k), cB = P.acc ? H.tintC(c.sc, k * 1.5) : H.layC(c.sc, k * 0.6);
  var cL = H.layC(c.sc, k * 1.6), cT = H.tintC(c.sc, k * 2.4);
  var sett = [[0, w1, cA, 0.6], [w1 + 0.04, 0.012, cL, 0.9], [w1 + 0.1, w2, cB, 0.55], [0.72, 0.008, cT, 0.9], [0.84, 0.02, cL, 0.7]];
  var vRig = c.graph.add('null', c.cut.id + ' / Tartan V', c.parent, c.cut.start, c.cut.end, {});
  var hRig = c.graph.add('null', c.cut.id + ' / Tartan H', c.parent, c.cut.start, c.cut.end, {});
  sett.forEach(function (st, si) {
    var p = st[0], w = st[1], col = st[2], a = st[3];
    var vCmds = [], hCmds = [];
    for (var o = -S0; o < W + S0 * 2; o += S0) {
      vCmds = vCmds.concat(G.rect(o + p * S0 - W / 2, -Hh / 2, w * S0, Hh), G.rect(o + S0 - (p + w) * S0 - W / 2, -Hh / 2, w * S0, Hh));
    }
    for (var o2 = -S0; o2 < Hh + S0 * 2; o2 += S0) {
      hCmds = hCmds.concat(G.rect(-W / 2, Hh / 2 - (o2 + p * S0 + w * S0), W, w * S0), G.rect(-W / 2, Hh / 2 - (o2 + S0 - p * S0), W, w * S0));
    }
    C.shape(c.graph, c.cut, c.cut.id + ' / Tartan V ' + si, vRig, vCmds, { fill: col, alpha: a });
    C.shape(c.graph, c.cut, c.cut.id + ' / Tartan H ' + si, hRig, hCmds, { fill: col, alpha: a });
  });
  V.animate(c, vRig, function (e, f) {
    return { 'position.x': wrap(-clk.absTime(f) * S0 * 0.035, S0) - S0, alpha: clk.enter(f, 0.8) };
  });
  V.animate(c, hRig, function (e, f) {
    return { 'position.y': -(wrap(clk.absTime(f) * S0 * 0.025 + S0 * 0.37, S0) - S0), alpha: clk.enter(f, 0.8) };
  });
});

/* 11. chevron */
register('chevron', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'chevron'), p = U * H.p(P, 'p', 0.16), D = p * 0.5, A = p * H.p(P, 'amp', 0.35);
  var k = H.p(P, 'k', 0.065), dir = H.p(P, 'dir', 1), col = P.acc ? H.tintC(c.sc, k * 1.7) : H.layC(c.sc, k);
  var ni = Math.ceil(W / p) + 3, nj = Math.ceil(Hh / D) + 4, cmds = [];
  for (var j = -2; j <= nj; j++) {
    var y0 = j * D + A / 2;
    for (var i = -1; i <= ni; i++) {
      var x0 = i * p;
      var pts = [[x0, y0], [x0 + p / 2, y0 - A], [x0 + p, y0], [x0 + p, y0 + D / 2], [x0 + p / 2, y0 - A + D / 2], [x0, y0 + D / 2]];
      pts.forEach(function (pt, idx) { cmds.push([idx ? 'L' : 'M', pt[0] - W / 2, Hh / 2 - pt[1]]); });
      cmds.push(['Z']);
    }
  }
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Chevron field', c.parent, cmds, { fill: col, alpha: 1 });
  V.animate(c, id, function (e, f) {
    var t = clk.absTime(f), q = clk.enter(f, 0.6);
    return {
      'position.x': wrap(p / 2 + Math.sin(t * 0.3) * p * 0.1, p) - p,
      'position.y': -(wrap(-t * D * 0.4 * dir + (1 - q) * D, D) - D),
      alpha: q
    };
  });
});

/* 12. isoCubes */
register('isoCubes', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'isoCubes'), s = Math.max(U * H.p(P, 's', 0.065), 32), r3 = Math.sqrt(3), pw = r3 * s, ph = 3 * s;
  var k = H.p(P, 'k', 0.09), spd = H.p(P, 'spd', 0.25), l0 = H.p(P, 'l0', 0), col = H.layC(c.sc, k);
  var nx = Math.ceil(W / pw) + 3, ny = Math.ceil(Hh / (1.5 * s)) + 3;
  var dirs = [-Math.PI / 2, Math.PI * 5 / 6, Math.PI / 6];
  [0, 1, 2].forEach(function (fi) {
    var cmds = [];
    for (var n2 = -2; n2 <= ny; n2++) {
      for (var n1 = -Math.ceil(ny / 2) - 2; n1 <= nx + 2; n1++) {
        var cx = n1 * pw + n2 * pw / 2, cy = n2 * 1.5 * s;
        if (cx < -pw * 2 || cx > W + pw * 2) continue;
        var T = [cx, cy - s], UR = [cx + pw / 2, cy - s / 2], LR = [cx + pw / 2, cy + s / 2];
        var B = [cx, cy + s], LL = [cx - pw / 2, cy + s / 2], UL = [cx - pw / 2, cy - s / 2], Cpt = [cx, cy];
        var poly = fi === 0 ? [T, UR, Cpt, UL] : fi === 1 ? [UL, Cpt, B, LL] : [UR, LR, B, Cpt];
        poly.forEach(function (pt, idx) { cmds.push([idx ? 'L' : 'M', pt[0] - W / 2, Hh / 2 - pt[1]]); });
        cmds.push(['Z']);
      }
    }
    var id = C.shape(c.graph, c.cut, c.cut.id + ' / Iso face ' + fi, c.parent, cmds, { fill: col, alpha: 1 });
    V.animate(c, id, function (e, f) {
      var t = clk.absTime(f), q = clk.enter(f, 0.6), L = l0 + t * spd;
      return {
        'position.x': wrap(t * s * 0.25, pw) - pw,
        'position.y': -(wrap(t * s * 0.25 / r3 * 1.5, ph) - ph),
        alpha: q * (0.25 + 0.75 * (0.5 + 0.5 * Math.cos(L - dirs[fi])))
      };
    });
  });
});

/* 13. hexGrid */
register('hexGrid', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'hexGrid'), seed = H.p(P, 'seed', 1);
  var s = Math.max(U * H.p(P, 's', 0.06), Math.sqrt(W * Hh / 220)), r3 = Math.sqrt(3);
  var cols = Math.min(18, Math.ceil(W / (r3 * s)) + 2), rows = Math.min(14, Math.ceil(Hh / (1.5 * s)) + 2);
  var rr = s * 0.9, k = H.p(P, 'k', 0.1), cx0 = W / 2, cy0 = Hh / 2, R = Math.hypot(W, Hh) / 2;
  function hexCmds(x, y, rad) {
    var out = [];
    for (var m = 0; m < 6; m++) {
      var a = (m * 60 - 30) * DEG;
      out.push([m ? 'L' : 'M', x + Math.cos(a) * rad - W / 2, Hh / 2 - (y + Math.sin(a) * rad)]);
    }
    out.push(['Z']);
    return out;
  }
  var baseCmds = [];
  for (var j = -1; j < rows; j++) {
    for (var i = -1; i < cols; i++) {
      var x = (i + ((j & 1) ? 0.5 : 0)) * r3 * s, y = j * 1.5 * s;
      baseCmds = baseCmds.concat(hexCmds(x, y, rr));
      if ((i + j) % 2 === 0 || N.random(seed, i, j, 1) < 0.35) {
        (function (hi, hj, hx, hy) {
          var d = Math.hypot(hx - cx0, hy - cy0) / R;
          var cell = C.shape(c.graph, c.cut, c.cut.id + ' / Hex cell ' + hi + '_' + hj, c.parent,
            hexCmds(hx, hy, rr * 0.86), { fill: H.tintC(c.sc, k * 1.4), alpha: 1 });
          V.animate(c, cell, function (e, f) {
            var t = clk.absTime(f), q = clk.enter(f, 0.7), tw = Math.floor(t * 3);
            if (d > q * 1.2) return { alpha: 0 };
            var v = P.mode === 'sparkle'
              ? (N.random(seed, hi, hj, tw) < 0.08 ? 1 - fract(t * 3) * 0.6 : 0)
              : Math.pow(0.5 + 0.5 * Math.cos((d * 3.2 - t * 0.55) * TAU), 6) * (0.6 + 0.4 * N.random(seed, hi, hj));
            return { alpha: v > 0.2 ? cl(v) * q : 0 };
          });
        })(i, j, x, y);
      }
    }
  }
  var strokeId = C.shape(c.graph, c.cut, c.cut.id + ' / Hex grid lines', c.parent, baseCmds,
    { stroke: H.layC(c.sc, k), width: Math.max(1, U * 0.0022), alpha: 1 });
  V.animate(c, strokeId, function (e, f) { return { alpha: clk.enter(f, 0.7) }; });
});

/* 14. triTess */
register('triTess', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'triTess'), seed = H.p(P, 'seed', 1);
  var a = Math.max(U * H.p(P, 'a', 0.12), Math.sqrt(W * Hh / 160)), h = a * Math.sqrt(3) / 2;
  var cols = Math.ceil(W / a) + 2, rows = Math.ceil(Hh / h) + 1, k = H.p(P, 'k', 0.085);
  var lvCols = [0.35, 0.65, 1.0, 1.45].map(function (m, l) {
    return (l === 3 && P.acc) ? H.tintC(c.sc, k * m * 1.4) : (P.acc ? H.tintC(c.sc, k * m) : H.layC(c.sc, k * m));
  });
  var buckets = [[], [], [], []];
  for (var r = 0; r < rows; r++) {
    for (var i = -1; i < cols; i++) {
      var y0 = r * h, y1 = y0 + h, off = (r & 1) ? a / 2 : 0;
      for (var up = 0; up < 2; up++) {
        var x0 = i * a + off + (up ? a / 2 : 0);
        var tri = up ? [[x0, y1], [x0 + a, y1], [x0 + a / 2, y0]] : [[x0, y0], [x0 + a, y0], [x0 + a / 2, y1]];
        var gx = x0 + a / 2, gy = up ? y0 + h * 0.66 : y0 + h * 0.33;
        var v = fbm2(gx / U * 1.6, gy / U * 1.6, seed, 2) + (N.random(seed, r, i, up) - 0.5) * 0.12;
        var lv = v > 0.72 ? 3 : v > 0.56 ? 2 : v > 0.42 ? 1 : v > 0.28 ? 0 : -1;
        if (lv >= 0) {
          buckets[lv].push(
            ['M', tri[0][0] - W / 2, Hh / 2 - tri[0][1]],
            ['L', tri[1][0] - W / 2, Hh / 2 - tri[1][1]],
            ['L', tri[2][0] - W / 2, Hh / 2 - tri[2][1]], ['Z']
          );
        }
      }
    }
  }
  buckets.forEach(function (cmds, lv) {
    if (!cmds.length) return;
    var id = C.shape(c.graph, c.cut, c.cut.id + ' / Tri tess ' + lv, c.parent, cmds, { fill: lvCols[lv], alpha: 1 });
    V.animate(c, id, function (e, f) {
      var t = clk.absTime(f), q = clk.enter(f, 0.8);
      return { alpha: q * (0.7 + 0.3 * Math.sin(t * 0.5 + lv)) };
    });
  });
});

/* 15. moire */
register('moire', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'moire'), gap = Math.max(U * H.p(P, 'gap', 0.018), 14), amp = U * H.p(P, 'amp', 0.07);
  var s = H.p(P, 'seed', 1) % 17, col = H.layC(c.sc, H.p(P, 'k', 0.1)), Rm = Math.hypot(W, Hh) * 0.65;
  var cmds = [];
  for (var r = gap; r < Rm && cmds.length < 360; r += gap) {
    cmds = cmds.concat(G.ellipse(0, 0, r, r));
  }
  [0, 1].forEach(function (ci) {
    var id = C.shape(c.graph, c.cut, c.cut.id + ' / Moire plate ' + ci, c.parent, cmds,
      { stroke: col, width: Math.max(1.2, gap * 0.42), alpha: 1 });
    V.animate(c, id, function (e, f) {
      var t = clk.absTime(f), q = clk.enter(f, 0.8);
      var dx = ci === 0 ? amp * Math.sin(t * 0.33 + s) : -amp * Math.sin(t * 0.29 + s + 1);
      var dy = ci === 0 ? amp * 0.7 * Math.cos(t * 0.27 + s) : -amp * 0.7 * Math.cos(t * 0.37 + s + 2);
      return { 'position.x': dx, 'position.y': -dy, alpha: q };
    });
  });
});

/* 16. squareTunnel */
register('squareTunnel', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'squareTunnel'), r = H.p(P, 'r', 1.26), twist = H.p(P, 'twist', 5);
  var spd = H.p(P, 'spd', 0.45), k = H.p(P, 'k', 0.06), lr = Math.log(r), S0 = U * 0.08, maxS = Math.hypot(W, Hh) * 1.1;
  var count = 16, col = H.layC(c.sc, k);
  for (var i = 0; i < count; i++) {
    (function (idx) {
      var cmds = G.rect(-maxS, -maxS, maxS * 2, maxS * 2);
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Tunnel ring ' + idx, c.parent, cmds,
        { stroke: col, width: Math.max(2, U * 0.012), alpha: 1 });
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f), q = clk.enter(f, 0.5), z = t * spd + (1 - q) * 1.5;
        var span = Math.log(maxS / (U * 0.03)) / lr;
        var depth = wrap(z - idx / count * span, span);
        var hs = U * 0.03 * Math.pow(r, depth);
        var sc = Math.max(0.01, hs / maxS), ang = (depth * twist + t * 4);
        return { 'scale.x': sc, 'scale.y': sc, rotation: -ang, alpha: q * cl(hs / (U * 0.04)) * cl(1.4 - hs / maxS) };
      });
    })(i);
  }
});

/* 17. spiralArms */
register('spiralArms', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'spiralArms'), n = Math.max(2, Math.round(H.p(P, 'n', 4))), b = H.p(P, 'b', 0.32);
  var spd = H.p(P, 'spd', 0.18), k = H.p(P, 'k', 0.065), cy = Hh * H.p(P, 'cy', 0.5);
  var r0 = U * 0.09, Rm = Math.hypot(W, Hh) * 0.62, thMax = Math.log(Rm / r0) / b, w = Math.PI / n, steps = 40;
  var cmds = [];
  for (var arm = 0; arm < n; arm++) {
    var base = arm * TAU / n;
    for (var i = 0; i <= steps; i++) {
      var th = thMax * i / steps, rad = r0 * Math.exp(b * th), a = base + th;
      cmds.push([i ? 'L' : 'M', Math.cos(a) * rad, -Math.sin(a) * rad]);
    }
    for (var j = steps; j >= 0; j--) {
      var th2 = thMax * j / steps, rad2 = r0 * Math.exp(b * th2), a2 = base + th2 + w;
      cmds.push(['L', Math.cos(a2) * rad2, -Math.sin(a2) * rad2]);
    }
    cmds.push(['Z']);
  }
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Spiral arms', c.parent, cmds, { fill: H.layC(c.sc, k), alpha: 1 });
  c.graph.byId[id].attrs.position = H.toScene(c, W / 2, cy);
  V.animate(c, id, function (e, f) {
    var t = clk.absTime(f), q = clk.enter(f, 0.7), sc = 0.4 + 0.6 * q;
    var rot = t * spd + (1 - q) * 1.2 * (spd < 0 ? -1 : 1);
    return { rotation: -(rot / DEG), 'scale.x': sc, 'scale.y': sc, alpha: q };
  });
  softGlow(c, 'Spiral hub', W / 2, cy, U * 0.42, c.sc.bg, [[0.35, 0.6], [0.7, 0.3], [1.0, 0.12]]);
});

/* 18. topoLines */
register('topoLines', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'topoLines'), seed = H.p(P, 'seed', 1), k = H.p(P, 'k', 0.13);
  var nx = 22, ny = Math.max(10, Math.round(nx * Hh / W)), cx = W / (nx - 1), cy = Hh / (ny - 1);
  var fGrid = [], fs = H.p(P, 'fs', 1.4) / U;
  for (var j = 0; j < ny; j++) {
    for (var i = 0; i < nx; i++) {
      var X = i * cx * fs, Y = j * cy * fs, rx = X * 0.8 - Y * 0.6, ry = X * 0.6 + Y * 0.8;
      var v = fbm2(rx + 0.35 * noise2(ry * 0.7, rx * 0.7, seed + 5), ry, seed, 3);
      fGrid[j * nx + i] = cl((v - 0.5) * 2.1 + 0.5, -0.2, 1.2);
    }
  }
  var MS = [[], [[3, 2]], [[2, 1]], [[3, 1]], [[0, 1]], [[0, 1], [3, 2]], [[0, 2]], [[3, 0]],
    [[3, 0]], [[0, 2]], [[3, 0], [2, 1]], [[0, 1]], [[3, 1]], [[2, 1]], [[3, 2]], []];
  var nLevels = Math.min(10, Math.max(6, Math.round(H.p(P, 'n', 10)))), minor = [], major = [];
  for (var m = 1; m < nLevels; m++) {
    var L = m / nLevels, dst = m % 3 === 0 ? major : minor;
    for (var gj = 0; gj < ny - 1; gj++) {
      for (var gi = 0; gi < nx - 1; gi++) {
        var a = fGrid[gj * nx + gi], b = fGrid[gj * nx + gi + 1], cc = fGrid[(gj + 1) * nx + gi + 1], d = fGrid[(gj + 1) * nx + gi];
        var idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (cc > L ? 2 : 0) | (d > L ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        function ept(ed) {
          if (ed === 0) return [gi + (L - a) / ((b - a) || 1e-4), gj];
          if (ed === 1) return [gi + 1, gj + (L - b) / ((cc - b) || 1e-4)];
          if (ed === 2) return [gi + (L - d) / ((cc - d) || 1e-4), gj + 1];
          return [gi, gj + (L - a) / ((d - a) || 1e-4)];
        }
        MS[idx].forEach(function (seg) {
          var p0 = ept(seg[0]), p1 = ept(seg[1]);
          dst.push(['M', p0[0] * cx - W / 2, Hh / 2 - p0[1] * cy], ['L', p1[0] * cx - W / 2, Hh / 2 - p1[1] * cy]);
        });
      }
    }
  }
  if (minor.length) {
    var idMin = C.shape(c.graph, c.cut, c.cut.id + ' / Topo minor', c.parent, minor,
      { stroke: H.layC(c.sc, k), width: Math.max(1, U * 0.0018), alpha: 1 });
    V.animate(c, idMin, function (e, f) {
      var t = clk.absTime(f), q = clk.enter(f, 0.9);
      return { 'position.x': Math.sin(t * 0.2) * U * 0.015, 'position.y': Math.cos(t * 0.15) * U * 0.012, alpha: q };
    });
  }
  if (major.length) {
    var colMaj = P.acc ? H.tintC(c.sc, k * 2.2) : H.layC(c.sc, k * 1.6);
    var idMaj = C.shape(c.graph, c.cut, c.cut.id + ' / Topo major', c.parent, major,
      { stroke: colMaj, width: Math.max(1.5, U * 0.0036), alpha: 1 });
    V.animate(c, idMaj, function (e, f) {
      var t = clk.absTime(f), q = clk.enter(f, 0.9);
      return { 'position.x': Math.sin(t * 0.2) * U * 0.015, 'position.y': Math.cos(t * 0.15) * U * 0.012, alpha: q };
    });
  }
});

/* 19. ridgePlot */
register('ridgePlot', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'ridgePlot'), seed = H.p(P, 'seed', 1), n = Math.min(24, Math.max(10, Math.round(H.p(P, 'n', 20))));
  var spd = H.p(P, 'spd', 0.24), amp = Hh * H.p(P, 'amp', 0.085) * (W < Hh ? 0.6 : 1);
  var x0 = W * 0.06, x1 = W * 0.94, y0 = Hh * 0.2, y1 = Hh * 0.94, gap = (y1 - y0) / (n - 1), m = 48;
  var lc = H.layC(c.sc, H.p(P, 'k', 0.17)), lw = Math.max(1, U * 0.0022);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var base = y0 + idx * gap, cmds = [['M', x0 - W / 2, Hh / 2 - (base + 2)]];
      var strokeCmds = [];
      for (var j = 0; j <= m; j++) {
        var u = j / m, x = mix(x0, x1, u);
        var env1 = P.mode === 'wide' ? 0.3 + 0.7 * Math.pow(Math.sin(Math.PI * u), 2) : 0.08 + 0.92 * Math.exp(-Math.pow((u - 0.5) / 0.16, 2));
        var v = Math.pow(0.5 + 0.5 * fbm1(u * 7 + idx * 0.41, seed + idx * 7, 3), 2.4);
        var dy = amp * env1 * v * 2.2 + Hh * 0.002 * R.noise(u * 40 + idx, seed);
        cmds.push(['L', x - W / 2, Hh / 2 - (base - dy)]);
        strokeCmds.push([j ? 'L' : 'M', x - W / 2, Hh / 2 - (base - dy)]);
      }
      cmds.push(['L', x1 - W / 2, Hh / 2 - (base + 2)], ['Z']);
      var fillId = C.shape(c.graph, c.cut, c.cut.id + ' / Ridge fill ' + idx, c.parent, cmds, { fill: c.sc.bg, alpha: 0.9 });
      var lineId = C.shape(c.graph, c.cut, c.cut.id + ' / Ridge line ' + idx, c.parent, strokeCmds, { stroke: lc, width: lw, alpha: 1 });
      [fillId, lineId].forEach(function (id) {
        V.animate(c, id, function (e, f) {
          var t = clk.absTime(f), q = clk.enter(f, 1.0);
          var grow = E.outCubic(q * 1.6 - idx / n * 0.6);
          var breathe = 0.8 + 0.25 * Math.sin(t * spd * 3 + idx * 0.7);
          return { 'position.y': (1 - grow) * gap * 0.8, 'scale.y': Math.max(0.05, grow * breathe), alpha: q > 0.02 ? 1 : 0 };
        });
      });
    })(i);
  }
});

/* ================= SCENE ================= */

/* 20. starfield */
register('starfield', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'starfield'), seed = H.p(P, 'seed', 1), ang = H.p(P, 'ang', 0), spd = H.p(P, 'spd', 1);
  var col = dk ? H.mixHex(c.sc.bg, c.sc.fg, 0.92) : H.lum(c.sc.bg) < 0.78 ? '#FFFFFF' : H.layC(c.sc, 0.5);
  var vx = Math.cos(ang), vy = Math.sin(ang);
  [[32, 0.0014, 0.006, 0.45], [18, 0.0022, 0.018, 0.65], [10, 0.0034, 0.045, 0.85]].forEach(function (spec, l) {
    var cnt = spec[0], rad = spec[1], sp = spec[2], aB = spec[3], v = U * sp * spd;
    for (var i = 0; i < cnt; i++) {
      (function (idx) {
        var r = U * rad * (0.6 + 0.8 * N.random(seed, l, idx, 3));
        var x0 = N.random(seed, l, idx, 1) * W * 1.1, y0 = N.random(seed, l, idx, 2) * Hh * 1.1;
        var twF = mix(1.1, 2.6, N.random(seed, l, idx, 4));
        var cmds = l < 2 ? G.rect(-r, -r, r * 2, r * 2) : G.ellipse(0, 0, r, r);
        if (l === 2 && N.random(seed, l, idx, 5) < 0.5) {
          var Ls = r * 5, th = Math.max(0.8, r * 0.25);
          cmds = cmds.concat(G.rect(-Ls, -th / 2, Ls * 2, th), G.rect(-th / 2, -Ls, th, Ls * 2));
        }
        var id = C.shape(c.graph, c.cut, c.cut.id + ' / Star ' + l + '_' + idx, c.parent, cmds, { fill: col, alpha: aB });
        V.animate(c, id, function (e, f) {
          var t = clk.absTime(f), q = clk.enter(f, 0.9);
          var x = wrap(x0 + t * v * vx, W * 1.1) - W * 0.05;
          var y = wrap(y0 + t * v * vy, Hh * 1.1) - Hh * 0.05;
          var pos = H.toScene(c, x, y);
          var tw = 0.5 + 0.5 * Math.sin(t * twF + idx * 1.7);
          return { 'position.x': pos[0], 'position.y': pos[1], alpha: aB * (0.45 + 0.55 * tw) * q * (dk ? 1 : 0.65) };
        });
      })(i);
    }
  });
  if (P.shoot !== false) {
    var per = 3.4, L = U * 0.55, tl = U * 0.16;
    var shId = C.shape(c.graph, c.cut, c.cut.id + ' / Shooting star', c.parent,
      [['M', 0, 0], ['L', -tl, 0]], { stroke: col, width: Math.max(1.5, U * 0.0022), alpha: 0.8 });
    V.animate(c, shId, function (e, f) {
      var t = clk.absTime(f), q0 = clk.enter(f, 0.9), bIdx = Math.floor(t / per);
      var age = t - bIdx * per - N.random(seed, bIdx, 8) * 1.5;
      if (age <= 0 || age >= 0.75 || N.random(seed, bIdx, 9) >= 0.85) return { alpha: 0 };
      var q = age / 0.75, sx = W * mix(0.15, 0.7, N.random(seed, bIdx, 1)), sy = Hh * mix(0.05, 0.35, N.random(seed, bIdx, 2));
      var sa = mix(20, 38, N.random(seed, bIdx, 3)) * DEG * (N.random(seed, bIdx, 4) < 0.5 ? 1 : -1);
      var dx = Math.cos(sa) * (sa < 0 ? -1 : 1), dy = Math.abs(Math.sin(sa));
      var hx = sx + dx * L * E.outQuad(q), hy = sy + dy * L * E.outQuad(q), pos = H.toScene(c, hx, hy);
      var sc = Math.max(0.05, Math.sin(Math.PI * q));
      return { 'position.x': pos[0], 'position.y': pos[1], rotation: -(Math.atan2(dy, dx) / DEG), 'scale.x': sc, alpha: 0.8 * q0 * (1 - q * 0.6) };
    });
  }
});

/* 21. nightMoon */
register('nightMoon', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'nightMoon'), seed = H.p(P, 'seed', 1), side = H.p(P, 'side', 1), port = Hh > W;
  var R = U * H.p(P, 'R', 0.13), mx = W * (0.5 + side * (port ? 0.2 : 0.3)), myBase = Hh * (port ? 0.2 : 0.27);
  var moonC = dk ? H.mixHex(c.sc.bg, glowOf(c.sc) === c.sc.fg ? c.sc.fg : H.mixHex(c.sc.fg, glowOf(c.sc), 0.3), H.p(P, 'k', 0.22))
    : H.mixHex(c.sc.bg, '#FFFFFF', 0.55);
  var haloC = dk ? moonC : H.mixHex(c.sc.bg, '#FFFFFF', 0.7);
  for (var s = 0; s < 24; s++) {
    (function (idx) {
      var x = N.random(seed, idx, 1) * W, y = N.random(seed, idx, 2) * Hh * 0.62;
      if (Math.hypot(x - mx, y - myBase) < R * 2.2) return;
      var r = U * mix(0.001, 0.0024, N.random(seed, idx, 3)), wf = mix(0.8, 2.4, N.random(seed, idx, 4));
      var stId = H.rect(c, 'Moon star ' + idx, x - r, y - r, r * 2, r * 2, { fill: H.layC(c.sc, dk ? 0.55 : 0.2), alpha: 1 });
      V.animate(c, stId, function (e, f) {
        return { alpha: clk.enter(f, 1.2) * (0.2 + 0.4 * (0.5 + 0.5 * Math.sin(clk.absTime(f) * wf + idx))) };
      });
    })(s);
  }
  softGlow(c, 'Moon halo', mx, myBase, R * 3.4, haloC, [
    [0.4, dk ? 0.28 : 0.4], [0.7, dk ? 0.12 : 0.18], [1.0, dk ? 0.04 : 0.06]
  ], function (e, f, ba) {
    var q = clk.enter(f, 1.2), br = 0.9 + 0.1 * Math.sin(clk.absTime(f) * 0.7);
    var pos = H.toScene(c, mx, myBase + (1 - q) * Hh * 0.06);
    return { 'position.x': pos[0], 'position.y': pos[1], alpha: ba * br * q };
  });
  var moonId = C.shape(c.graph, c.cut, c.cut.id + ' / Moon disc', c.parent, G.ellipse(0, 0, R, R), { fill: moonC, alpha: 1 });
  V.animate(c, moonId, function (e, f) {
    var q = clk.enter(f, 1.2), pos = H.toScene(c, mx, myBase + (1 - q) * Hh * 0.06);
    return { 'position.x': pos[0], 'position.y': pos[1], alpha: q };
  });
  if (P.phase === 'crescent') {
    var cutId = C.shape(c.graph, c.cut, c.cut.id + ' / Moon shadow', c.parent,
      G.ellipse(side * R * 0.42, R * 0.22, R * 0.9, R * 0.9), { fill: c.sc.bg, alpha: 1 });
    V.animate(c, cutId, function (e, f) {
      var q = clk.enter(f, 1.2), pos = H.toScene(c, mx, myBase + (1 - q) * Hh * 0.06);
      return { 'position.x': pos[0], 'position.y': pos[1], alpha: q };
    });
  }
  var cloudC = H.mixHex(c.sc.bg, c.sc.fg, dk ? 0.07 : 0.05);
  for (var cld = 0; cld < 3; cld++) {
    (function (ci) {
      var w = U * mix(0.4, 0.7, N.random(seed, ci, 21)), h = U * mix(0.02, 0.03, N.random(seed, ci, 22)), Lp = W + w * 2;
      var xOff = (ci + N.random(seed, ci, 23) * 0.5) / 3 * Lp, sp = U * mix(0.025, 0.045, N.random(seed, ci, 24));
      var y = myBase + R * (ci - 1) * 0.8 + R * mix(-0.2, 0.3, N.random(seed, ci, 25));
      var cCmds = H.roundRectCmds(w / 2, 0, w, h, h / 2)
        .concat(H.roundRectCmds(w * (mix(0.15, 0.4, N.random(seed, ci, 26)) + 0.225), h * 0.75, w * 0.45, h * 0.9, h * 0.45))
        .concat(H.roundRectCmds(w * (mix(0.35, 0.6, N.random(seed, ci, 27)) + 0.25), -h * 0.7, w * 0.5, h * 0.8, h * 0.4));
      var cId = C.shape(c.graph, c.cut, c.cut.id + ' / Moon cloud ' + ci, c.parent, cCmds, { fill: cloudC, alpha: 0.7 });
      V.animate(c, cId, function (e, f) {
        var t = clk.absTime(f), q = clk.enter(f, 1.2), x = wrap(xOff + t * sp, Lp) - w;
        var pos = H.toScene(c, x, y);
        return { 'position.x': pos[0], 'position.y': pos[1], alpha: 0.7 * q };
      });
    })(cld);
  }
});

/* 22. sunsetSun */
register('sunsetSun', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'sunsetSun'), seed = H.p(P, 'seed', 1), k = H.p(P, 'k', 0.35);
  var hz = Hh * H.p(P, 'hz', 0.72) * (W < Hh ? 0.97 : 1), rad = U * H.p(P, 'R', 0.14);
  var cxFrac = H.p(P, 'cx', 0.3), cx = W * (W < Hh ? 0.5 + (cxFrac - 0.5) * 0.6 : cxFrac);
  var sunBase = dk ? glowOf(c.sc) : c.sc.accent, sunC = H.mixHex(c.sc.bg, sunBase, k * (dk ? 1 : 0.7));
  for (var sb = 0; sb < 5; sb++) {
    var bh = Hh * 0.1 * (sb + 1), a = (dk ? 0.12 : 0.1) * 0.22;
    var skyId = H.rect(c, 'Sunset sky ' + sb, 0, hz - bh, W, bh, { fill: sunBase, alpha: a });
    V.animate(c, skyId, function (e, f) { return { alpha: a * clk.enter(f, 1.2) }; });
  }
  softGlow(c, 'Sunset halo', cx, hz, rad * 3, sunC, [[0.55, 0.28], [0.8, 0.14], [1.0, 0.06]], function (e, f, ba) {
    var q = clk.enter(f, 1.2), cy = hz - rad * 0.5 + rad * 0.35 * cl(clk.time(f) / 14) + (1 - q) * rad * 0.9;
    var pos = H.toScene(c, cx, cy);
    return { 'position.x': pos[0], 'position.y': pos[1], alpha: ba * q };
  });
  var sunId = C.shape(c.graph, c.cut, c.cut.id + ' / Sunset disc', c.parent, G.ellipse(0, 0, rad, rad), { fill: sunC, alpha: 1 });
  V.animate(c, sunId, function (e, f) {
    var q = clk.enter(f, 1.2), cy = hz - rad * 0.5 + rad * 0.35 * cl(clk.time(f) / 14) + (1 - q) * rad * 0.9;
    var pos = H.toScene(c, cx, cy);
    return { 'position.x': pos[0], 'position.y': pos[1], alpha: q };
  });
  var waterBg = H.rect(c, 'Sunset water occlude', 0, hz, W, Hh - hz + 2, { fill: c.sc.bg, alpha: 1 });
  var horRule = H.rect(c, 'Sunset horizon line', 0, hz - 0.5, W, Math.max(1, U * 0.0018), { fill: H.layC(c.sc, 0.14), alpha: 1 });
  V.animate(c, horRule, function (e, f) { return { alpha: clk.enter(f, 1.2) }; });
  for (var j = 0; j < 14; j++) {
    (function (idx) {
      var y = hz + U * 0.015 * Math.pow(idx + 1, 1.32);
      if (y > Hh) return;
      var q = idx / 14, hh = Math.max(1.5, U * 0.0038 * (1 + idx * 0.1)), wBase = rad * (1.25 - q * 0.6);
      var refl = C.shape(c.graph, c.cut, c.cut.id + ' / Sun glint ' + idx, c.parent,
        G.rect(-wBase, -hh / 2, wBase * 2, hh), { fill: sunC, alpha: 0.75 * (1 - q) });
      V.animate(c, refl, function (e, f) {
        var t = clk.absTime(f), q0 = clk.enter(f, 1.2);
        var wv = 0.55 + 0.45 * R.noise(t * 1.3 + idx * 1.9, seed), xo = rad * 0.18 * R.noise(t * 0.9 + idx * 2.7, seed + 3);
        var pos = H.toScene(c, cx + xo, y);
        return { 'position.x': pos[0], 'position.y': pos[1], 'scale.x': wv, alpha: 0.75 * (1 - q) * q0 * (0.6 + 0.4 * R.noise(t * 2 + idx, seed + 5)) };
      });
    })(j);
  }
  return waterBg;
});

/* 23. oceanWaves */
register('oceanWaves', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'oceanWaves'), seed = H.p(P, 'seed', 1), n = Math.max(4, Math.round(H.p(P, 'n', 10)));
  var hz = H.p(P, 'hz', 0.52), k = H.p(P, 'k', 0.14), dir = H.p(P, 'dir', 1), m = 48;
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var q = (idx + 1) / n, y0 = Hh * (hz + (1 - hz) * Math.pow(q, 1.55));
      var A = U * (0.004 + 0.028 * Math.pow(q, 1.4)), lam = W * (0.07 + 0.3 * q);
      var w = 0.9 + 0.5 * N.random(seed, idx, 1), ph = N.random(seed, idx, 2) * TAU;
      var span = Math.max(W * 1.6, Math.ceil(W * 1.6 / lam) * lam), cmds = [];
      for (var j = 0; j <= m; j++) {
        var x = -span * 0.25 + span * j / m, u = x / lam * TAU;
        var y = A * (Math.sin(u + ph) + 0.35 * Math.sin(u * 2.3 + ph * 2));
        cmds.push([j ? 'L' : 'M', x - W / 2, -y]);
      }
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Ocean wave ' + idx, c.parent, cmds,
        { stroke: H.layC(c.sc, k * (0.45 + 0.75 * q)), width: Math.max(1, U * (0.0014 + 0.0035 * q)), alpha: 1 });
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f), fi = clk.enter(f, 0.9);
        var xShift = wrap(dir * t * w * lam / TAU, lam);
        var yPos = y0 + (1 - fi) * Hh * 0.15 * q;
        return { 'position.x': xShift, 'position.y': Hh / 2 - yPos, alpha: fi };
      });
    })(i);
  }
});

/* 24. rainWindow */
register('rainWindow', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'rainWindow'), seed = H.p(P, 'seed', 1), tn = Math.tan(H.p(P, 'ang', 8) * DEG);
  var k = H.p(P, 'k', 0.15), col = H.layC(c.sc, k), nRain = 36, span = W + Hh * Math.abs(tn);
  for (var i = 0; i < nRain; i++) {
    (function (idx) {
      var v = Hh * mix(1.3, 2.1, N.random(seed, idx, 1)), L = Hh * mix(0.03, 0.09, N.random(seed, idx, 2));
      var xBase = N.random(seed, idx, 3) * span - (tn > 0 ? Hh * tn : 0), yOff = N.random(seed, idx, 4) * (Hh + L);
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Rain streak ' + idx, c.parent,
        [['M', 0, 0], ['L', L * tn, -L]], { stroke: col, width: Math.max(1, U * 0.0016), alpha: 0.85 });
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f), y = wrap(yOff + t * v, Hh + L) - L, x = xBase + y * tn;
        var pos = H.toScene(c, x, y);
        return { 'position.x': pos[0], 'position.y': pos[1], alpha: 0.85 * clk.enter(f, 0.6) };
      });
    })(i);
  }
  var dc = H.layC(c.sc, k * 1.5), hc = dk ? H.layC(c.sc, k * 3.5) : H.mixHex(c.sc.bg, '#FFFFFF', 0.7);
  var nDrops = Math.min(14, Math.max(4, Math.round(H.p(P, 'drops', 10))));
  for (var d = 0; d < nDrops; d++) {
    (function (di) {
      var per = mix(3.5, 6.5, N.random(seed, di, 11)), r = U * mix(0.008, 0.019, N.random(seed, di, 15));
      var x0 = mix(0.05, 0.95, N.random(seed, di, 13)) * W, y0 = mix(0.06, 0.65, N.random(seed, di, 14)) * Hh;
      var dropId = C.shape(c.graph, c.cut, c.cut.id + ' / Rain drop ' + di, c.parent,
        G.ellipse(0, 0, r * 0.9, r).concat(G.ellipse(-r * 0.3, r * 0.35, r * 0.25, r * 0.25)),
        { fill: dc, stroke: hc, width: 0.8, alpha: 0.9 });
      V.animate(c, dropId, function (e, f) {
        var t = clk.absTime(f), q0 = clk.enter(f, 0.6);
        var u = wrap(t + N.random(seed, di, 12) * per, per) / per, u0 = 0.6;
        var x = x0, y = y0, sc = 0.65 + 0.35 * cl(u / u0);
        if (u >= u0) {
          var qq = (u - u0) / (1 - u0);
          y = y0 + E.inQuad(qq) * Hh * 1.15;
          x = x0 + U * 0.006 * Math.sin(qq * 18 + di);
        }
        if (y - r > Hh) return { alpha: 0 };
        var pos = H.toScene(c, x, y);
        return { 'position.x': pos[0], 'position.y': pos[1], 'scale.x': sc, 'scale.y': sc, alpha: 0.9 * q0 * cl(u / 0.08) };
      });
    })(d);
  }
});

/* 25. snowLayers */
register('snowLayers', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'snowLayers'), seed = H.p(P, 'seed', 1), wind = H.p(P, 'wind', 0.15);
  var col = H.lum(c.sc.bg) < 0.88 ? H.mixHex(c.sc.bg, '#FFFFFF', 0.92) : H.layC(c.sc, 0.35);
  [[24, 0.0045, 0.05, 0.012, 0.5], [16, 0.009, 0.09, 0.02, 0.6], [8, 0.018, 0.16, 0.035, 0.35]].forEach(function (sp, l) {
    var cnt = sp[0], sz = sp[1], v = sp[2], sw = sp[3], aB = sp[4];
    var vy = Hh * v, vx = vy * wind;
    for (var i = 0; i < cnt; i++) {
      (function (idx) {
        var r = U * sz * (0.7 + 0.6 * N.random(seed, l, idx, 1)), fq = mix(0.5, 1.3, N.random(seed, l, idx, 2));
        var y0 = N.random(seed, l, idx, 3) * Hh * 1.2, vyM = 0.8 + 0.4 * N.random(seed, l, idx, 4);
        var x0 = N.random(seed, l, idx, 5) * W * 1.1, aM = aB * (0.6 + 0.4 * N.random(seed, l, idx, 6));
        var id = C.shape(c.graph, c.cut, c.cut.id + ' / Snow ' + l + '_' + idx, c.parent,
          G.ellipse(0, 0, r, r), { fill: col, alpha: aM });
        V.animate(c, id, function (e, f) {
          var t = clk.absTime(f), q = clk.enter(f, 1.0);
          var y = wrap(y0 + t * vy * vyM, Hh * 1.2) - Hh * 0.1;
          var x = wrap(x0 + t * vx + Math.sin(t * fq + idx) * U * sw, W * 1.1) - W * 0.05;
          var pos = H.toScene(c, x, y);
          return { 'position.x': pos[0], 'position.y': pos[1], alpha: aM * q };
        });
      })(i);
    }
  });
});

/* 26. fireworks */
register('fireworks', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'fireworks'), seed = H.p(P, 'seed', 1), per = H.p(P, 'per', 0.65), cols = hues(c.sc);
  var launch = 0.45, life = 2.0, K = H.p(P, 'k', 0.48) * (dk ? 1 : 0.6);
  var tStart = clk.absTime(c.cut.start), tEnd = clk.absTime(c.cut.end);
  var b0 = Math.floor((tStart - launch - life) / per), b1 = Math.ceil(tEnd / per);
  for (var b = b0; b <= b1; b++) {
    (function (bi) {
      var t0 = bi * per + N.random(seed, bi, 1) * per * 0.5;
      if (t0 + launch + life < tStart || t0 > tEnd) return;
      var ox = W * mix(0.1, 0.9, N.random(seed, bi, 2)), oy = Hh * mix(0.1, 0.48, N.random(seed, bi, 3));
      var base = cols[Math.floor(N.random(seed, bi, 4) * cols.length) % cols.length];
      var col = dk ? base : H.mixHex(base, c.sc.bg, 0.2), burstR = U * mix(0.24, 0.36, N.random(seed, bi, 6));
      var rktId = C.shape(c.graph, c.cut, c.cut.id + ' / Rocket ' + bi, c.parent,
        [['M', 0, 0], ['L', 0, -U * 0.06]], { stroke: col, width: Math.max(1.5, U * 0.0024), alpha: K });
      V.animate(c, rktId, function (e, f) {
        var age = clk.absTime(f) - t0, fi = clk.enter(f, 0.3);
        if (age <= 0 || age >= launch) return { alpha: 0 };
        var q = E.outQuad(age / launch), y = mix(Hh * 1.02, oy, q), pos = H.toScene(c, ox, y);
        return { 'position.x': pos[0], 'position.y': pos[1], alpha: K * 0.6 * fi };
      });
      var rays = 20, cmds = [];
      for (var j = 0; j < rays; j++) {
        var a = j / rays * TAU + (N.random(seed, bi, j) - 0.5) * 0.12;
        var sp = (j % 2 ? 0.55 : 1) * (0.85 + 0.15 * N.random(seed, bi, j, 7));
        cmds.push(['M', Math.cos(a) * burstR * sp * 0.45, -Math.sin(a) * burstR * sp * 0.45],
          ['L', Math.cos(a) * burstR * sp, -Math.sin(a) * burstR * sp]);
        cmds = cmds.concat(G.ellipse(Math.cos(a) * burstR * sp, -Math.sin(a) * burstR * sp, U * 0.004, U * 0.004));
      }
      var burstId = C.shape(c.graph, c.cut, c.cut.id + ' / Firework burst ' + bi, c.parent, cmds,
        { stroke: col, fill: dk ? H.mixHex(col, '#FFFFFF', 0.4) : col, width: Math.max(1.5, U * 0.0024), alpha: K });
      var bPos = H.toScene(c, ox, oy);
      c.graph.byId[burstId].attrs.position = bPos;
      V.animate(c, burstId, function (e, f) {
        var age = clk.absTime(f) - t0 - launch, fi = clk.enter(f, 0.3);
        if (age <= 0 || age >= life) return { 'scale.x': 0.05, 'scale.y': 0.05, alpha: 0 };
        var sc = (1 - Math.exp(-2.6 * age)) / (1 - Math.exp(-2.6 * life)), fade = Math.pow(1 - age / life, 1.6);
        return { 'position.x': bPos[0], 'position.y': bPos[1] - 0.5 * U * 0.08 * age * age, 'scale.x': Math.max(0.05, sc), 'scale.y': Math.max(0.05, sc), alpha: K * fade * fi };
      });
    })(b);
  }
});

/* 27. cloudLayers */
register('cloudLayers', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'cloudLayers'), seed = H.p(P, 'seed', 1), dir = H.p(P, 'dir', 1), k = H.p(P, 'k', 0.075);
  [[0.1, 0.3, 0.55, 0.012, 0.55], [0.3, 0.55, 0.8, 0.026, 0.8], [0.72, 0.98, 1.15, 0.05, 1.1]].forEach(function (sp, l) {
    var ya = sp[0], yb = sp[1], scl = sp[2], v = sp[3], km = sp[4], cw0 = U * 0.5 * scl, Lp = W + cw0 * 2.4;
    for (var cc = 0; cc < 4; cc++) {
      (function (ci) {
        var cw = cw0 * mix(0.75, 1.2, N.random(seed, l, ci, 1)), y = Hh * mix(ya, yb, N.random(seed, l, ci, 3));
        var xOff = (ci + N.random(seed, l, ci, 2) * 0.6) / 4 * Lp, np = 5 + Math.floor(N.random(seed, l, ci, 9) * 3);
        var cmds = [], rmin = 1e9;
        for (var p = 0; p < np; p++) {
          var f = (p + 0.5) / np, pr = cw / np * (0.75 + 1.05 * Math.sin(Math.PI * f)) * (0.85 + 0.3 * N.random(seed, l, ci, p, 4));
          var px = cw * f + (N.random(seed, l, ci, p, 5) * 2 - 1) * cw * 0.03;
          cmds = cmds.concat(G.ellipse(px, pr, pr, pr));
          rmin = Math.min(rmin, pr);
        }
        cmds = cmds.concat(G.rect(cw * 0.5 / np, 0, cw * (1 - 1 / np), rmin));
        var id = C.shape(c.graph, c.cut, c.cut.id + ' / Cloud ' + l + '_' + ci, c.parent, cmds, { fill: H.layC(c.sc, k * km), alpha: 1 });
        V.animate(c, id, function (e, f) {
          var t = clk.absTime(f), q = clk.enter(f, 1.0);
          var x = wrap(xOff + t * U * v * dir, Lp) - cw * 1.2, yy = y + (1 - q) * Hh * 0.05 * (l + 1);
          var pos = H.toScene(c, x, yy);
          return { 'position.x': pos[0], 'position.y': pos[1], alpha: q };
        });
      })(cc);
    }
  });
});

/* 28. mountains */
register('mountains', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'mountains'), seed = H.p(P, 'seed', 1), n = Math.max(2, Math.round(H.p(P, 'n', 3)));
  var k = H.p(P, 'k', 0.085), dir = H.p(P, 'dir', 1), port = Hh > W, m = 72;
  for (var l = 0; l < n; l++) {
    (function (li) {
      var q = n > 1 ? li / (n - 1) : 1, base = Hh * ((port ? 0.68 : 0.64) + 0.14 * q), A = Hh * (port ? 0.17 : 0.3) * (1 - 0.35 * q);
      var sc2 = U * (0.42 + 0.2 * (1 - q)), span = W * 1.6, cmds = [['M', -span * 0.3 - W / 2, Hh / 2 - (Hh + 20)]];
      for (var j = 0; j <= m; j++) {
        var x = -span * 0.3 + span * j / m, X = x / sc2 + li * 7.3;
        var v = 0, amp = 1, freq = 1, nrm = 0;
        for (var o = 0; o < 4; o++) { v += (1 - Math.abs(R.noise(X * freq, seed + li * 31 + o * 7))) * amp; nrm += amp; amp *= 0.48; freq *= 2.2; }
        v = cl((v / nrm - 0.4) * 1.8);
        cmds.push(['L', x - W / 2, Hh / 2 - (base - A * v * v)]);
      }
      cmds.push(['L', span * 0.7 - W / 2, Hh / 2 - (Hh + 20)], ['Z']);
      var mId = C.shape(c.graph, c.cut, c.cut.id + ' / Mountain ' + li, c.parent, cmds, { fill: H.layC(c.sc, k * (0.45 + 0.75 * q)), alpha: 1 });
      V.animate(c, mId, function (e, f) {
        var t = clk.absTime(f), fi = clk.enter(f, 1.1), rise = (1 - fi) * Hh * 0.3 * (1 - q * 0.4);
        var drift = Math.sin(t * 0.04 * (li + 1)) * dir * W * 0.08;
        return { 'position.x': drift, 'position.y': -rise, alpha: fi };
      });
      if (P.mist !== false && li < n - 1) {
        for (var mb = 0; mb < 3; mb++) {
          var mh = (A * 0.25 + Hh * 0.06) * (mb + 1) / 3;
          var mistId = H.rect(c, 'Mountain mist ' + li + '_' + mb, 0, base - A * 0.25 + mh, W, Hh, { fill: c.sc.bg, alpha: 0.18 });
          V.animate(c, mistId, function (e, f) { return { alpha: 0.18 * clk.enter(f, 1.1) }; });
        }
      }
    })(l);
  }
});

/* ================= TEXTURE / EFFECT ================= */

/* 29. filmStrip */
register('filmStrip', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'filmStrip'), seed = H.p(P, 'seed', 1), dir = H.p(P, 'dir', 1), spd = H.p(P, 'spd', 0.9);
  var vert = Hh > W, b = U * 0.085, L = vert ? Hh : W, p = b * 0.62, hw = b * 0.3, hh = b * 0.38;
  var bandCol = H.layC(c.sc, dk ? 0.05 : 0.13), holeCol = dk ? H.layC(c.sc, 0.17) : H.mixHex(c.sc.bg, '#FFFFFF', 0.55);
  var edgeCol = H.layC(c.sc, dk ? 0.12 : 0.22);
  [0, 1].forEach(function (side) {
    var rig = c.graph.add('null', c.cut.id + ' / Film edge ' + side, c.parent, c.cut.start, c.cut.end, {});
    var c0 = side ? (vert ? W : Hh) - b : 0;
    if (vert) H.rect(c, 'Film band ' + side, c0, 0, b, L, { fill: bandCol, alpha: 1 }, rig);
    else H.rect(c, 'Film band ' + side, 0, c0, L, b, { fill: bandCol, alpha: 1 }, rig);
    var lw = Math.max(1, U * 0.002), ec = side ? c0 : c0 + b - lw;
    if (vert) H.rect(c, 'Film border ' + side, ec, 0, lw, L, { fill: edgeCol, alpha: 1 }, rig);
    else H.rect(c, 'Film border ' + side, 0, ec, L, lw, { fill: edgeCol, alpha: 1 }, rig);
    var holeCmds = [];
    for (var a = -p * 2; a < L + p * 2; a += p) {
      var x = a + (p - hw) / 2, y = c0 + (b - hh) / 2 + (side ? b * 0.12 : -b * 0.12);
      holeCmds = holeCmds.concat(vert
        ? H.roundRectCmds(y + hh / 2 - W / 2, Hh / 2 - (x + hw / 2), hh, hw, b * 0.06)
        : H.roundRectCmds(x + hw / 2 - W / 2, Hh / 2 - (y + hh / 2), hw, hh, b * 0.06));
    }
    var hId = C.shape(c.graph, c.cut, c.cut.id + ' / Film holes ' + side, rig, holeCmds, { fill: holeCol, alpha: 1 });
    V.animate(c, rig, function (e, f) {
      var q = E.outExpo(clk.time(f) / 0.55), sl = (1 - q) * b * 1.3 * (side ? 1 : -1);
      return vert ? { 'position.x': sl, alpha: q } : { 'position.y': -sl, alpha: q };
    });
    V.animate(c, hId, function (e, f) {
      var off = wrap(clk.absTime(f) * p * spd * dir, p) - p;
      return vert ? { 'position.y': -off } : { 'position.x': off };
    });
  });
  if (P.scratch !== false) {
    for (var si = 0; si < 3; si++) {
      (function (idx) {
        var sw = Math.max(1.5, U * 0.0018);
        var scId = H.rect(c, 'Film scratch ' + idx, 0, 0, vert ? W : sw, vert ? sw : Hh,
          { fill: H.layC(c.sc, 0.35), alpha: 0.2 });
        V.animate(c, scId, function (e, f) {
          var st = Math.floor(clk.absTime(f) * 12);
          if (N.random(seed, st, idx, 1) > 0.55) return { alpha: 0 };
          var pos = N.random(seed, st >> 2, idx, 2) * L + (N.random(seed, st, idx, 3) * 2 - 1) * U * 0.004;
          return vert ? { 'position.y': Hh / 2 - pos, alpha: 0.2 * clk.enter(f, 0.55) }
            : { 'position.x': pos - W / 2, alpha: 0.2 * clk.enter(f, 0.55) };
        });
      })(si);
    }
  }
});

/* 30. vhsBand */
register('vhsBand', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'vhsBand'), seed = H.p(P, 'seed', 1), bh = Hh * H.p(P, 'h', 0.09);
  var spd = H.p(P, 'spd', 0.12), k = H.p(P, 'k', 0.26) * (dk ? 1 : 0.75), col = dk ? c.sc.fg : H.mixHex(c.sc.fg, c.sc.bg, 0.2);
  var bandRig = c.graph.add('null', c.cut.id + ' / VHS band', c.parent, c.cut.start, c.cut.end, {});
  C.shape(c.graph, c.cut, c.cut.id + ' / VHS smear', bandRig, G.rect(-W / 2, -bh * 0.7, W, bh * 1.4), { fill: lightOn(c.sc), alpha: dk ? 0.05 : 0.1 });
  C.shape(c.graph, c.cut, c.cut.id + ' / VHS core', bandRig, G.rect(-W / 2, -bh / 2, W, bh), { fill: col, alpha: k * 0.5 });
  for (var i = 0; i < 6; i++) {
    (function (idx) {
      var lw = Math.max(1.5, U * 0.0022), lineW = W * mix(0.2, 0.65, N.random(seed, idx, 6));
      var ly = (idx / 6 - 0.5) * bh;
      var lId = C.shape(c.graph, c.cut, c.cut.id + ' / VHS line ' + idx, bandRig,
        G.rect(-lineW / 2, ly, lineW, lw), { fill: H.layC(c.sc, dk ? 0.35 : 0.25), alpha: 0.6 });
      V.animate(c, lId, function (e, f) {
        var st = Math.floor(clk.absTime(f) * 12);
        return { 'position.x': (N.random(seed, st, idx, 5) - 0.5) * W * 0.4, alpha: N.random(seed, st, idx, 4) < 0.7 ? 0.55 : 0.1 };
      });
    })(i);
  }
  V.animate(c, bandRig, function (e, f) {
    var t = clk.absTime(f), q = clk.enter(f, 0.3), y = wrap(t * Hh * spd + N.random(seed, 1) * Hh, Hh * 1.3) - Hh * 0.15;
    return { 'position.y': Hh / 2 - y, alpha: q };
  });
  var hb = Hh * 0.028;
  for (var r = 0; r < 4; r++) {
    (function (ri) {
      var head = H.rect(c, 'VHS head ' + ri, 0, Hh - hb + hb * ri / 4, W, hb / 4 + 0.5, { fill: col, alpha: k * 0.85 });
      V.animate(c, head, function (e, f) {
        var st = Math.floor(clk.absTime(f) * 12), dx = (N.random(seed, st, ri, 7) * 2 - 1) * U * 0.03 + U * 0.02 * (4 - ri) / 4;
        return { 'position.x': dx, alpha: k * 0.85 * clk.enter(f, 0.3) };
      });
    })(r);
  }
});

/* 31. tornPaper */
register('tornPaper', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'tornPaper'), seed = H.p(P, 'seed', 1), k = H.p(P, 'k', 0.065);
  var v = P.v || 'tb';
  if (v === 'side' && Hh > W) v = 'tb';
  var specs = v === 'diag'
    ? [[[-W * 0.05, Hh * 0.58], [W * 0.5, Hh * 1.05], [-0.7, 0.7]], [[W * 0.55, -Hh * 0.05], [W * 1.05, Hh * 0.48], [0.7, -0.7]]]
    : v === 'side'
      ? [[[W * 0.13, -Hh * 0.05], [W * 0.1, Hh * 1.05], [-1, 0]], [[W * 0.9, -Hh * 0.05], [W * 0.87, Hh * 1.05], [1, 0]]]
      : [[[-W * 0.05, Hh * 0.83], [W * 1.05, Hh * 0.79], [0, 1]], [[-W * 0.05, Hh * 0.13], [W * 1.05, Hh * 0.17], [0, -1]]];
  var tones = dk ? [H.layC(c.sc, k), H.mixHex(c.sc.bg, c.sc.accent, k * 1.6)] : [H.mixHex(c.sc.bg, '#FFFFFF', 0.5), H.layC(c.sc, k)];
  specs.forEach(function (sp, i) {
    var A = sp[0], B = sp[1], nrm = sp[2], len = Math.hypot(B[0] - A[0], B[1] - A[1]), Npts = 72;
    var tx = (B[0] - A[0]) / len, ty = (B[1] - A[1]) / len, pts = [];
    for (var j = 0; j <= Npts; j++) {
      var u = j / Npts, o = U * (0.018 * R.noise(u * 9, seed + i * 17) + 0.007 * R.noise(u * 45, seed + i * 5) + 0.0035 * (N.random(seed, i, j) * 2 - 1));
      pts.push([A[0] + (B[0] - A[0]) * u + nrm[0] * o, A[1] + (B[1] - A[1]) * u + nrm[1] * o]);
    }
    var far = Math.hypot(W, Hh);
    var polyPts = pts.concat([[B[0] + nrm[0] * far + tx * far * 0.2, B[1] + nrm[1] * far + ty * far * 0.2], [A[0] + nrm[0] * far - tx * far * 0.2, A[1] + nrm[1] * far - ty * far * 0.2]]);
    var shd = U * 0.008;
    var shPts = polyPts.map(function (q) { return [q[0] - nrm[0] * shd * 0.5, q[1] - nrm[1] * shd * 0.5 + shd * 0.6]; });
    var shId = H.poly(c, 'Torn shadow ' + i, shPts, true, { fill: '#000000', alpha: dk ? 0.35 : 0.1 });
    var bodyId = H.poly(c, 'Torn sheet ' + i, polyPts, true, { fill: tones[i % 2], alpha: 1 });
    var rimPts = pts.map(function (q) { return [q[0] - nrm[0] * U * 0.002, q[1] - nrm[1] * U * 0.002]; });
    var rimCol = dk ? H.layC(c.sc, k * 2.4) : H.mixHex(tones[i % 2], '#FFFFFF', 0.75);
    var rimId = H.line(c, 'Torn rim ' + i, rimPts, rimCol, Math.max(1, U * 0.004), 1);
    [shId, bodyId, rimId].forEach(function (id) {
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f), inP = E.outCubic((clk.time(f) - i * 0.12) / 0.6);
        var push = (1 - inP) * U * 0.35 + Math.sin(t * 0.5 + i * 2) * U * 0.004;
        return { 'position.x': nrm[0] * push, 'position.y': -nrm[1] * push };
      });
    });
  });
});

/* 32. godRays */
register('godRays', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'godRays'), seed = H.p(P, 'seed', 1), n = Math.max(4, Math.round(H.p(P, 'n', 9)));
  var spread = H.p(P, 'spread', 60), sx0 = W * H.p(P, 'x', 0.5), sy = -Hh * 0.12, L = Math.hypot(W, Hh) * 1.25;
  var rc = dk ? lightOn(c.sc) : (H.lum(c.sc.bg) < 0.8 ? '#FFFFFF' : H.mixHex(c.sc.accent, c.sc.bg, 0.3));
  var k = H.p(P, 'k', 0.13) * (dk ? 1.35 : 1.4), baseA = Math.atan2(Hh * 0.55 - sy, W * 0.5 - sx0);
  var rig = c.graph.add('null', c.cut.id + ' / God rays origin', c.parent, c.cut.start, c.cut.end,
    { position: H.toScene(c, sx0, sy) });
  V.animate(c, rig, function (e, f) {
    var sx = sx0 + W * 0.04 * Math.sin(clk.absTime(f) * 0.1 + (seed % 7)), pos = H.toScene(c, sx, sy);
    return { 'position.x': pos[0], 'position.y': pos[1] };
  });
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var a = baseA + (spread * (idx / (n - 1) - 0.5) + (N.random(seed, idx, 1) * 2 - 1) * 4) * DEG;
      var w = (1.2 + 3.6 * N.random(seed, idx, 2)) * DEG;
      [0.45, 1.0, 1.7].forEach(function (fm, qi) {
        var ww = w * fm, aBase = k * (qi === 0 ? 0.55 : qi === 1 ? 0.3 : 0.16);
        var cmds = [['M', 0, 0], ['L', Math.cos(a - ww / 2) * L, -Math.sin(a - ww / 2) * L], ['L', Math.cos(a + ww / 2) * L, -Math.sin(a + ww / 2) * L], ['Z']];
        var rayId = C.shape(c.graph, c.cut, c.cut.id + ' / Ray ' + idx + '_' + qi, rig, cmds, { fill: rc, alpha: aBase });
        V.animate(c, rayId, function (e, f) {
          var t = clk.absTime(f), q = clk.enter(f, 1.0);
          var sw = 3 * R.noise(t * 0.15 + idx * 1.3, seed), lv = 0.5 + 0.5 * R.noise(t * 0.35 + idx * 2.1, seed + 3);
          return { rotation: -sw, alpha: aBase * q * (0.4 + 0.7 * lv) };
        });
      });
    })(i);
  }
});

/* 33. vignettePulse */
register('vignettePulse', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'vignettePulse'), cols = hues(c.sc), rate = H.p(P, 'rate', 0.45);
  var k = H.p(P, 'k', 0.35) * (dk ? 1 : 0.8), cA = H.mixHex(c.sc.bg, cols[0], 0.7), cB = H.mixHex(c.sc.bg, cols[1] || cols[0], 0.7);
  var R = Math.hypot(W, Hh) / 2;
  if (P.two !== false) {
    [[0, 0, cA, 0], [W, Hh, cB, 1.7]].forEach(function (spec, idx) {
      softGlow(c, 'Vignette corner ' + idx, spec[0], spec[1], R * 1.25, spec[2], [[0.35, k * 0.45], [0.7, k * 0.25], [1.0, k * 0.1]],
        function (e, f, ba) {
          var t = clk.absTime(f), q = clk.enter(f, 0.8), pulse = 0.65 + 0.35 * Math.sin(t * TAU * rate);
          var sc = 1 + 0.08 * Math.sin(t * 0.6 + spec[3]);
          return { 'scale.x': sc, 'scale.y': sc, alpha: ba * q * pulse };
        });
    });
  } else {
    var inner = U * 0.32, outer = R * 1.05;
    for (var i = 0; i < 4; i++) {
      (function (idx) {
        var rIn = mix(inner, outer, idx / 4), cmds = G.rect(-W * 0.65, -Hh * 0.65, W * 1.3, Hh * 1.3);
        cmds.push(['M', rIn, 0]);
        for (var j = 27; j >= 0; j--) {
          var a = j * TAU / 28;
          cmds.push(['L', Math.cos(a) * rIn, Math.sin(a) * rIn]);
        }
        cmds.push(['Z']);
        var aBase = k * ((idx + 1) / 4) * 0.4;
        var id = C.shape(c.graph, c.cut, c.cut.id + ' / Vignette ring ' + idx, c.parent, cmds, { fill: cA, alpha: aBase });
        V.animate(c, id, function (e, f) {
          var t = clk.absTime(f), q = clk.enter(f, 0.8), pulse = 0.65 + 0.35 * Math.sin(t * TAU * rate);
          var sc = 1.08 - 0.12 * pulse;
          return { 'scale.x': sc, 'scale.y': sc, alpha: aBase * q * pulse };
        });
      })(i);
    }
  }
});

/* 34. kaleidoscope */
register('kaleidoscope', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'kaleidoscope'), seed = H.p(P, 'seed', 1), n = Math.max(4, Math.round(H.p(P, 'n', 8)));
  var m = Math.max(3, Math.round(H.p(P, 'm', 7))), k = H.p(P, 'k', 0.085), spd = H.p(P, 'spd', 0.07);
  var R = Math.hypot(W, Hh) * 0.58, seg = Math.PI / n, r0 = U * 0.13;
  var root = c.graph.add('null', c.cut.id + ' / Kaleidoscope root', c.parent, c.cut.start, c.cut.end, {});
  V.animate(c, root, function (e, f) { return { rotation: -(clk.absTime(f) * spd / DEG) }; });
  [0.46, 0.82].forEach(function (fRad, idx) {
    var pts = [], rr = U * fRad;
    for (var q = 0; q <= 2 * n; q++) {
      var a = q * seg;
      pts.push([q ? 'L' : 'M', Math.cos(a) * rr, -Math.sin(a) * rr]);
    }
    var rId = C.shape(c.graph, c.cut, c.cut.id + ' / Kaleido ring ' + idx, root, pts,
      { stroke: H.layC(c.sc, k * 0.9), width: Math.max(1, U * 0.002), alpha: 1 });
    V.animate(c, rId, function (e, f) {
      return { rotation: -(clk.absTime(f) * spd * (idx ? -1.5 : 1.5) / DEG), alpha: clk.enter(f, 0.8) };
    });
  });
  for (var j = 0; j < m; j++) {
    (function (ji) {
      var ty = Math.floor(N.random(seed, ji) * 3), v = 0.6 + 0.8 * N.random(seed, ji, 2), isLine = N.random(seed, ji, 5) < 0.35;
      var sUnit = U * (0.04 + 0.04 * N.random(seed, ji, 3)), cmds = [];
      for (var q = 0; q < n; q++) {
        var ang = q * 2 * seg;
        [-1, 1].forEach(function (flip) {
          var a = ang + flip * seg * 0.45, cx = Math.cos(a) * U * 0.35, cy = -Math.sin(a) * U * 0.35;
          if (ty === 2) cmds = cmds.concat(G.ellipse(cx, cy, sUnit * 0.55, sUnit * 0.55));
          else {
            var shapePts = ty === 0 ? [[sUnit, 0], [-sUnit / 2, sUnit * 0.8], [-sUnit / 2, -sUnit * 0.3]]
              : [[sUnit, 0], [0, sUnit * 0.42], [-sUnit * 0.7, 0], [0, -sUnit * 0.42]];
            var cs = Math.cos(a), sn = Math.sin(a);
            shapePts.forEach(function (pt, pi) {
              cmds.push([pi ? 'L' : 'M', cx + pt[0] * cs - pt[1] * flip * sn, cy - (pt[0] * sn + pt[1] * flip * cs)]);
            });
            cmds.push(['Z']);
          }
        });
      }
      var col = isLine ? H.tintC(c.sc, k * 2.4) : H.layC(c.sc, k);
      var fId = C.shape(c.graph, c.cut, c.cut.id + ' / Kaleido motif ' + ji, root, cmds,
        isLine ? { stroke: col, width: Math.max(1, U * 0.0028), alpha: 1 } : { fill: col, alpha: 1 });
      V.animate(c, fId, function (e, f) {
        var t = clk.absTime(f), q = clk.enter(f, 0.8);
        var rad = r0 + wrap(N.random(seed, ji, 1) * (R - r0) + t * U * 0.05 * v, R - r0);
        var fade = cl((rad - r0) / (U * 0.15)) * cl((R - rad) / (U * 0.2)) * q;
        var sc = Math.max(0.05, rad / (U * 0.35));
        return { 'scale.x': sc, 'scale.y': sc, rotation: -(Math.sin(t * 0.35 * v + ji * 1.9) * 18), alpha: fade };
      });
    })(j);
  }
});

/* 35. marble */
register('marble', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'marble'), seed = H.p(P, 'seed', 1), ang = H.p(P, 'ang', 0.7), freq = H.p(P, 'freq', 1.8);
  var k = H.p(P, 'k', 0.2) * (H.dark(c.sc.bg) ? 1 : 0.8), dir = H.p(P, 'dir', 1);
  var c2 = H.contrast(c.sc.accent, c.sc.bg) > 1.3 ? c.sc.accent : (c.sc.accent2 || c.sc.fg);
  var D = Math.hypot(W, Hh) * 1.15, rig = c.graph.add('null', c.cut.id + ' / Marble rig', c.parent, c.cut.start, c.cut.end,
    { rotation: -(ang / DEG) });
  for (var v = 0; v < 14; v++) {
    var isAcc = P.acc && v % 4 === 1, col = isAcc ? c2 : c.sc.fg, cmds = [];
    var xBase = -D * 0.55 + D * 1.1 * (v + 0.5) / 14;
    for (var j = 0; j <= 36; j++) {
      var u = j / 36 - 0.5, y = u * D * 1.1;
      var x = xBase + U * 0.09 * Math.sin(u * freq * TAU + fbm2(v * 0.7, u * 3, seed, 3) * 4);
      cmds.push([j ? 'L' : 'M', x, -y]);
    }
    var aVein = k * (0.45 + 0.55 * (v % 3 === 0 ? 1 : 0.6));
    C.shape(c.graph, c.cut, c.cut.id + ' / Marble vein ' + v, rig, cmds,
      { stroke: col, width: Math.max(2, U * (0.008 + 0.016 * N.random(seed, v, 2))), alpha: aVein });
  }
  V.animate(c, rig, function (e, f) {
    var t = clk.absTime(f), q = clk.enter(f, 1.0), M = U * 0.09;
    return {
      'position.x': M * Math.sin(t * 0.06 * dir + (seed % 13)),
      'position.y': M * Math.cos(t * 0.045 + (seed % 13) * 2),
      alpha: q
    };
  });
}, ['Organic veined curves use layered warped polylines instead of per-pixel image synthesis.']);

/* 36. paperCut */
register('paperCut', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'paperCut'), seed = H.p(P, 'seed', 1), L = Math.max(2, Math.round(H.p(P, 'L', 3)));
  var lobes = Math.round(H.p(P, 'lobes', 6)), k = H.p(P, 'k', 0.075), pe = 2 / H.p(P, 'p', 2.8), Npts = 64;
  for (var i = 0; i < L; i++) {
    (function (idx) {
      var d = L > 1 ? (L - 1 - idx) / (L - 1) : 0, rx = W * (0.41 + 0.17 * (1 - d)), ry = Hh * (0.38 + 0.17 * (1 - d));
      var ph = N.random(seed, idx, 1) * TAU, cmds = G.rect(-W, -Hh, W * 2, Hh * 2);
      for (var j = Npts; j >= 0; j--) {
        var th = j / Npts * TAU, cs = Math.cos(th), sn = Math.sin(th);
        var wv = 1 + 0.035 * Math.sin((lobes + idx) * th + ph) + 0.014 * Math.sin((lobes * 2 + 3) * th - ph * 1.3);
        var px = rx * (cs >= 0 ? 1 : -1) * Math.pow(Math.abs(cs), pe) * wv;
        var py = ry * (sn >= 0 ? 1 : -1) * Math.pow(Math.abs(sn), pe) * wv;
        cmds.push([j === Npts ? 'M' : 'L', px, -py]);
      }
      cmds.push(['Z']);
      var hue = P.acc && (idx % 2) ? c.sc.accent : c.sc.fg;
      var fillCol = dk ? H.mixHex(c.sc.bg, hue, k * (0.5 + 0.7 * (idx + 1) / L))
        : H.mixHex(c.sc.bg, (idx % 2) ? hue : '#FFFFFF', (idx % 2 ? k : 0.35) * (0.6 + 0.5 * (idx + 1) / L));
      var shd = U * 0.009;
      var shId = C.shape(c.graph, c.cut, c.cut.id + ' / Papercut shadow ' + idx, c.parent, cmds,
        { fill: '#000000', alpha: dk ? 0.32 : 0.12 });
      var sheetId = C.shape(c.graph, c.cut, c.cut.id + ' / Papercut layer ' + idx, c.parent, cmds,
        { fill: fillCol, alpha: 1 });
      [shId, sheetId].forEach(function (id, isMain) {
        V.animate(c, id, function (e, f) {
          var t = clk.absTime(f), inP = E.outCubic((clk.time(f) - idx * 0.1) / 0.8), grow = 1 + (1 - inP) * 0.7;
          var ox = Math.sin(t * 0.35 + idx) * U * 0.006 * (idx + 1) + (isMain ? 0 : shd * 0.4);
          var oy = Math.cos(t * 0.3 + idx) * U * 0.004 * (idx + 1) + (isMain ? 0 : shd);
          return { 'position.x': ox, 'position.y': -oy, 'scale.x': grow, 'scale.y': grow, rotation: -(t * 1.4 * (idx % 2 ? 1 : -1)) };
        });
      });
    })(i);
  }
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
