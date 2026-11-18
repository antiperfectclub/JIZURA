/* Cavalry native backgrounds ported from src/11p_x2_bg.js (39 recipes). */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, TAU = H.TAU, DEG = H.DEG;

function register(key, build, differences) {
  N.register('bg', key, {
    source: 'src/11p_x2_bg.js',
    scope: 'cut',
    build: build,
    differences: differences || []
  });
}

function wrap(v, m) {
  return ((v % m) + m) % m;
}

function lightOf(sc) {
  var L = H.lum(sc.bg);
  return L < 0.45 ? sc.fg : L < 0.78 ? '#FFFFFF' : H.mixHex(sc.accent, '#FFFFFF', 0.25);
}

function polyCmds(cx, cy, radius, sides, rotRad) {
  var out = [];
  for (var i = 0; i < sides; i++) {
    var a = rotRad + i / sides * TAU;
    out.push([i ? 'L' : 'M', cx + Math.cos(a) * radius, cy - Math.sin(a) * radius]);
  }
  out.push(['Z']);
  return out;
}

function stadiumCmds(x, y, w, h) {
  return H.roundRectCmds(x + w / 2, y + h / 2, w, h, h / 2);
}

/* 1. xpDriftBars */
register('xpDriftBars', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height;
  var clk = H.bgClock(c, 'xpDriftBars'), seed = H.p(P, 'seed', 1);
  var n = Math.max(2, Math.round(H.p(P, 'n', 6))), vert = P.vert !== false, L = vert ? W : Hh, k = H.p(P, 'k', 0.045);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var w = L * (0.07 + 0.2 * N.random(seed, idx, 1));
      var v = (0.012 + 0.028 * N.random(seed, idx, 2)) * (N.random(seed, idx, 3) < 0.5 ? -1 : 1);
      var off0 = N.random(seed, idx, 4) * (L + w);
      var col = idx === 1 ? c.sc.accent : c.sc.fg;
      var alpha = idx === 1 ? k * 1.1 : k * (0.6 + 0.8 * N.random(seed, idx, 5));
      var cmds = vert ? G.rect(0, -Hh / 2, w, Hh) : G.rect(-W / 2, -w, W, w);
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Drift bar ' + idx, c.parent, cmds, { fill: col, alpha: alpha });
      V.animate(c, id, function (e, f) {
        var pos = wrap(off0 + clk.absTime(f) * v * L, L + w) - w;
        return vert ? { 'position.x': pos - W / 2, alpha: alpha * clk.enter(f, 0.6) }
          : { 'position.y': Hh / 2 - pos, alpha: alpha * clk.enter(f, 0.6) };
      });
    })(i);
  }
});

/* 2. xpBigPolygon */
register('xpBigPolygon', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpBigPolygon'), seed = H.p(P, 'seed', 1), sides = Math.max(3, Math.round(H.p(P, 'sides', 5)));
  var cx = W * H.p(P, 'cx', 0.5), cy = Hh * H.p(P, 'cy', 0.5), spd = H.p(P, 'spd', 2), k = H.p(P, 'k', 0.045);
  var R = U * 0.8, rot0 = (seed % 60), pos = H.toScene(c, cx, cy);
  var p1 = C.shape(c.graph, c.cut, c.cut.id + ' / Big poly outer', c.parent, polyCmds(0, 0, R, sides, 0), { fill: c.sc.fg, alpha: k });
  var p2 = C.shape(c.graph, c.cut, c.cut.id + ' / Big poly inner', c.parent, polyCmds(0, 0, R * 0.58, sides, 0), { fill: c.sc.fg, alpha: k * 0.8 });
  var p3 = C.shape(c.graph, c.cut, c.cut.id + ' / Big poly rim', c.parent, polyCmds(0, 0, R * 1.24, sides, 0), { stroke: c.sc.fg, width: Math.max(1.5, U * 0.003), alpha: k * 2.2 });
  [[p1, 1, k], [p2, -1.4, k * 0.8], [p3, 0.6, k * 2.2]].forEach(function (sp) {
    c.graph.byId[sp[0]].attrs.position = pos;
    V.animate(c, sp[0], function (e, f) {
      var t = clk.absTime(f), q = clk.enter(f, 0.8), sc = 0.86 + 0.14 * q;
      return { 'scale.x': sc, 'scale.y': sc, rotation: -((t * spd + rot0) * sp[1]), alpha: sp[2] * q };
    });
  });
});

/* 3. xpShiftRows */
register('xpShiftRows', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpShiftRows'), seed = H.p(P, 'seed', 1), rh = U * 0.105, bw = rh * H.p(P, 'ar', 2.6);
  var spd = H.p(P, 'spd', 0.07), k = H.p(P, 'k', 0.04), rows = Math.min(24, Math.ceil(Hh / rh));
  for (var j = 0; j < rows; j++) {
    (function (rj) {
      var cmds = [];
      for (var x = -bw * 2; x < W + bw * 2; x += bw * 2) {
        cmds = cmds.concat(G.rect(x - W / 2, Hh / 2 - (rj + 1) * rh, bw, rh));
      }
      var dir = rj % 2 ? -1 : 1, spMult = 0.5 + N.random(seed, rj), off0 = N.random(seed, rj, 2) * bw * 2;
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Shift row ' + rj, c.parent, cmds, { fill: c.sc.fg, alpha: k });
      V.animate(c, id, function (e, f) {
        var off = wrap(clk.absTime(f) * bw * spd * dir * spMult + off0, bw * 2) - bw * 2;
        return { 'position.x': off, alpha: k * clk.enter(f, 0.6) };
      });
    })(j);
  }
});

/* 4. xpNestTri */
register('xpNestTri', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpNestTri'), sides = Math.max(3, Math.round(H.p(P, 'sides', 3)));
  var cy = Hh * H.p(P, 'cy', 0.5), k = H.p(P, 'k', 0.1), pos = H.toScene(c, W / 2, cy);
  for (var i = 0; i < 8; i++) {
    (function (idx) {
      var baseR = U * (0.14 + idx * 0.17);
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Nest poly ' + idx, c.parent,
        polyCmds(0, 0, baseR, sides, Math.PI / 2), { stroke: c.sc.fg, width: Math.max(1.5, U * 0.005), alpha: k });
      c.graph.byId[id].attrs.position = pos;
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f), q = clk.enter(f, 0.8);
        var sc = (1 + 0.05 * Math.sin(t * 0.5 - idx * 0.6)) * (0.7 + 0.3 * q);
        var rot = Math.sin(t * 0.22 - idx * 0.38) * 28;
        return { 'scale.x': sc, 'scale.y': sc, rotation: -rot, alpha: k * q };
      });
    })(i);
  }
});

/* 5. xpCornerArcs */
register('xpCornerArcs', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpCornerArcs'), k = H.p(P, 'k', 0.05);
  var cs = P.diag ? [[0, 0], [W, Hh]] : [[W, 0], [0, Hh]];
  for (var cc = 0; cc < 2; cc++) {
    for (var i = 0; i < 5; i++) {
      (function (ci, idx) {
        var baseR = U * (0.2 + 0.19 * idx), col = ci && idx === 1 ? c.sc.accent : c.sc.fg;
        var a = k * (1 - idx * 0.14), lw = U * 0.085 * (1 - idx * 0.1);
        var id = C.shape(c.graph, c.cut, c.cut.id + ' / Corner arc ' + ci + '_' + idx, c.parent,
          G.ellipse(0, 0, baseR, baseR), { stroke: col, width: lw, alpha: a });
        c.graph.byId[id].attrs.position = H.toScene(c, cs[ci][0], cs[ci][1]);
        V.animate(c, id, function (e, f) {
          var t = clk.absTime(f), q = clk.enter(f, 0.8);
          var sc = (1 + 0.07 * Math.sin(t * 0.5 - idx * 0.7 + ci * 2.2)) * (0.6 + 0.4 * q);
          return { 'scale.x': sc, 'scale.y': sc, alpha: a * q };
        });
      })(cc, i);
    }
  }
});

/* 6. xpPanels */
register('xpPanels', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpPanels'), s = H.p(P, 'seed', 1) % 9, k = H.p(P, 'k', 0.035), lw = Math.max(1.5, U * 0.003);
  var flipX = P.flip ? -1 : 1, flipY = P.flipY ? -1 : 1;
  function coords(f) {
    var t = clk.absTime(f);
    var x1 = W * (0.36 + 0.07 * Math.sin(t * 0.21 + s));
    var y1 = Hh * (0.42 + 0.09 * Math.sin(t * 0.17 + s * 2));
    var x2 = x1 + (W - x1) * (0.5 + 0.18 * Math.sin(t * 0.13 + s * 3));
    return { x1: x1, y1: y1, x2: x2, q: clk.enter(f, 0.6) };
  }
  var rig = c.graph.add('null', c.cut.id + ' / Panels rig', c.parent, c.cut.start, c.cut.end,
    { 'scale.x': flipX, 'scale.y': flipY });
  var topP = C.shape(c.graph, c.cut, c.cut.id + ' / Panel top', rig, G.rect(0, -1, 1, 1), { fill: c.sc.fg, alpha: k });
  var midP = C.shape(c.graph, c.cut, c.cut.id + ' / Panel mid', rig, G.rect(0, -1, 1, 1), { fill: c.sc.accent, alpha: k * 1.3 });
  var rgtP = C.shape(c.graph, c.cut, c.cut.id + ' / Panel right', rig, G.rect(0, -1, 1, 1), { fill: c.sc.fg, alpha: k * 2 });
  var l1 = C.shape(c.graph, c.cut, c.cut.id + ' / Panel rule V1', rig, G.rect(-lw / 2, -Hh / 2, lw, Hh), { fill: c.sc.fg, alpha: 0.13 });
  var l2 = C.shape(c.graph, c.cut, c.cut.id + ' / Panel rule H', rig, G.rect(0, -lw / 2, 1, lw), { fill: c.sc.fg, alpha: 0.13 });
  var l3 = C.shape(c.graph, c.cut, c.cut.id + ' / Panel rule V2', rig, G.rect(-lw / 2, 0, lw, 1), { fill: c.sc.fg, alpha: 0.13 });
  V.animate(c, topP, function (e, f) {
    var v = coords(f);
    return { 'position.x': v.x1 - W / 2, 'position.y': Hh / 2, 'scale.x': W - v.x1, 'scale.y': v.y1, alpha: k * v.q };
  });
  V.animate(c, midP, function (e, f) {
    var v = coords(f);
    return { 'position.x': v.x1 - W / 2, 'position.y': Hh / 2 - v.y1, 'scale.x': v.x2 - v.x1, 'scale.y': Hh - v.y1, alpha: k * 1.3 * v.q };
  });
  V.animate(c, rgtP, function (e, f) {
    var v = coords(f);
    return { 'position.x': v.x2 - W / 2, 'position.y': Hh / 2 - v.y1, 'scale.x': W - v.x2, 'scale.y': Hh - v.y1, alpha: k * 2 * v.q };
  });
  V.animate(c, l1, function (e, f) { var v = coords(f); return { 'position.x': v.x1 - W / 2, alpha: 0.13 * v.q }; });
  V.animate(c, l2, function (e, f) { var v = coords(f); return { 'position.x': v.x1 - W / 2, 'position.y': Hh / 2 - v.y1, 'scale.x': W - v.x1, alpha: 0.13 * v.q }; });
  V.animate(c, l3, function (e, f) { var v = coords(f); return { 'position.x': v.x2 - W / 2, 'position.y': -Hh / 2, 'scale.y': Hh - v.y1, alpha: 0.13 * v.q }; });
});

/* 7. xpPlusField */
register('xpPlusField', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpPlusField'), sp = Math.max(U * H.p(P, 'sp', 0.12), Math.sqrt(W * Hh / 120));
  var arm = sp * 0.17, k = H.p(P, 'k', 0.11), lw = Math.max(1.5, U * 0.0035);
  var nx = Math.min(14, Math.ceil(W / sp) + 1), ny = Math.min(10, Math.ceil(Hh / sp) + 1);
  var ox = (W - (nx - 1) * sp) / 2, oy = (Hh - (ny - 1) * sp) / 2;
  var plusCmds = [['M', -arm, 0], ['L', arm, 0], ['M', 0, -arm], ['L', 0, arm]];
  for (var j = 0; j < ny; j++) {
    for (var i = 0; i < nx; i++) {
      (function (ci, cj) {
        var id = C.shape(c.graph, c.cut, c.cut.id + ' / Plus ' + ci + '_' + cj, c.parent, plusCmds,
          { stroke: c.sc.fg, width: lw, alpha: k });
        c.graph.byId[id].attrs.position = H.toScene(c, ox + ci * sp, oy + cj * sp);
        V.animate(c, id, function (e, f) {
          var t = clk.absTime(f), q = clk.enter(f, 0.6);
          var ang = E.inOutCubic(0.5 + 0.5 * Math.sin(t * 0.7 - ci * 0.42 - cj * 0.3)) * 90;
          return { rotation: -ang, alpha: k * q };
        });
      })(i, j);
    }
  }
});

/* 8. xpFoldPlanes */
register('xpFoldPlanes', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpFoldPlanes'), seed = H.p(P, 'seed', 1), k = H.p(P, 'k', 0.04);
  for (var i = 0; i < 4; i++) {
    (function (idx) {
      var pts = [];
      for (var j = 0; j < 3; j++) {
        var a = TAU * (N.random(seed, idx, j) * 0.25 + j / 3 + idx * 0.13), rd = 0.5 + 0.4 * N.random(seed, idx, j, 2);
        pts.push([W * (0.5 + Math.cos(a) * rd), Hh * (0.5 + Math.sin(a) * rd)]);
      }
      var id = H.poly(c, 'Fold plane ' + idx, pts, true,
        { fill: idx === 2 ? c.sc.accent : c.sc.fg, stroke: c.sc.fg, width: Math.max(1.5, U * 0.002), alpha: k });
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f), q = clk.enter(f, 0.8);
        var ox = W * 0.09 * R.noise(t * 0.07 + idx * 3.1, seed + idx * 7);
        var oy = Hh * 0.09 * R.noise(t * 0.06 + idx * 5.3, seed + idx * 11 + 40);
        return { 'position.x': ox, 'position.y': -oy, rotation: -(Math.sin(t * 0.08 + idx) * 6), alpha: k * q };
      });
    })(i);
  }
});

/* 9. xpFlowLines */
register('xpFlowLines', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpFlowLines'), seed = H.p(P, 'seed', 1), n = Math.max(6, Math.round(H.p(P, 'n', 20)));
  var hz = !!P.horiz, L = hz ? W : Hh, X = hz ? Hh : W, amp = X * 0.075, ST = 26, k = H.p(P, 'k', 0.13);
  for (var i = -1; i <= n; i++) {
    (function (idx) {
      var base = (idx + 0.5) / n * X, cmds = [];
      for (var q = 0; q <= ST; q++) {
        var u = q / ST, v = base + amp * (R.noise(u * 2.2 + idx * 0.09, seed) + 0.5 * R.noise(u * 5 + idx * 0.05, seed + 9)), a = u * L;
        var pt = hz ? [a - W / 2, Hh / 2 - v] : [v - W / 2, Hh / 2 - a];
        cmds.push([q ? 'L' : 'M', pt[0], pt[1]]);
      }
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Flow line ' + idx, c.parent, cmds,
        { stroke: c.sc.fg, width: Math.max(1.5, U * 0.0022), alpha: k });
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f), q = clk.enter(f, 0.6), sh = amp * 0.6 * Math.sin(t * 0.45 + idx * 0.25);
        return hz ? { 'position.y': sh, alpha: k * q } : { 'position.x': sh, alpha: k * q };
      });
    })(i);
  }
});

/* 10. xpHorizonLines */
register('xpHorizonLines', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpHorizonLines'), cyF = H.p(P, 'cy', 0.5), spd = H.p(P, 'spd', 0.045), k = H.p(P, 'k', 0.09);
  var hLine = C.shape(c.graph, c.cut, c.cut.id + ' / Horizon center', c.parent, G.rect(-W / 2, -1, W, 2), { fill: c.sc.accent, alpha: 0.22 });
  V.animate(c, hLine, function (e, f) {
    var t = clk.absTime(f), q = clk.enter(f, 0.6), y0 = Hh * (cyF + 0.04 * Math.sin(t * 0.19));
    return { 'position.y': Hh / 2 - y0, 'scale.x': Math.max(0.01, q), alpha: 0.22 * q };
  });
  var n = 9;
  for (var i = 0; i < n; i++) {
    (function (idx) {
      [-1, 1].forEach(function (side) {
        var id = C.shape(c.graph, c.cut, c.cut.id + ' / Depth rule ' + idx + '_' + side, c.parent,
          G.rect(-W / 2, -U * 0.005, W, U * 0.01), { fill: c.sc.fg, alpha: k });
        V.animate(c, id, function (e, f) {
          var t = clk.absTime(f), q = clk.enter(f, 0.6), p = wrap(idx / n + t * spd, 1);
          var y0 = Hh * (cyF + 0.04 * Math.sin(t * 0.19)), d = Hh * 0.66 * Math.pow(p, 2.3);
          var sy = Math.max(0.15, p), a = k * Math.min(1, p * 4) * (1 - H.smoothstep(0.8, 1, p)) * q;
          return { 'position.y': Hh / 2 - (y0 + side * d), 'scale.y': sy, alpha: a };
        });
      });
    })(i);
  }
});

/* 11. xpDialTicks */
register('xpDialTicks', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpDialTicks'), cx = W * H.p(P, 'cx', 0.5), cy = Hh * H.p(P, 'cy', 0.5);
  var spd = H.p(P, 'spd', 2), k = H.p(P, 'k', 0.15), pos = H.toScene(c, cx, cy);
  var NS = [48, 72, 120, 180], RS = [0.3, 0.47, 0.7, 1.02], SP = [1, -0.6, 0.35, -0.2];
  for (var r = 0; r < 4; r++) {
    (function (ri) {
      var Ntick = NS[ri], R = U * RS[ri], cmds = [];
      for (var i = 0; i < Ntick; i++) {
        var a = i / Ntick * TAU, cs = Math.cos(a), sn = Math.sin(a), len = U * (i % 6 ? 0.016 : 0.04);
        cmds.push(['M', cs * R, -sn * R], ['L', cs * (R + len), -sn * (R + len)]);
      }
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Dial ring ' + ri, c.parent, cmds,
        { stroke: c.sc.fg, width: Math.max(1.5, U * 0.0034), alpha: k });
      c.graph.byId[id].attrs.position = pos;
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f), q = clk.enter(f, 0.8), sc = 0.85 + 0.15 * q;
        return { 'scale.x': sc, 'scale.y': sc, rotation: -(t * spd * SP[ri]), alpha: k * q };
      });
    })(r);
  }
});

/* 12. xpSineWeave */
register('xpSineWeave', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpSineWeave'), seed = H.p(P, 'seed', 1), nb = Hh > W ? 5 : 3;
  var amp = Hh / nb * 0.3, ST = 48, k = H.p(P, 'k', 0.13), spd = H.p(P, 'spd', 0.3);
  for (var b = 0; b < nb; b++) {
    (function (bi) {
      var cy = Hh * (bi + 0.5) / nb, kx = TAU * (1.3 + 1.2 * N.random(seed, bi)), ph = N.random(seed, bi, 2) * TAU;
      var lam = W / (1.3 + 1.2 * N.random(seed, bi)), span = W + lam * 2;
      [-1, 1].forEach(function (sg) {
        var cmds = [];
        for (var q = 0; q <= ST; q++) {
          var x = -lam + span * q / ST, u = x / W;
          var y = sg * amp * Math.sin(u * kx + ph) * (0.75 + 0.25 * Math.sin(u * 3.1 + bi));
          cmds.push([q ? 'L' : 'M', x - W / 2, -y]);
        }
        var id = C.shape(c.graph, c.cut, c.cut.id + ' / Sine weave ' + bi + '_' + sg, c.parent, cmds,
          { stroke: c.sc.fg, width: Math.max(1.5, U * 0.0035), alpha: k });
        V.animate(c, id, function (e, f) {
          var t = clk.absTime(f), q = clk.enter(f, 0.6), dir = bi % 2 ? -1 : 1;
          var ox = wrap(t * spd * dir * lam / TAU, lam) - lam * 0.5;
          return { 'position.x': ox, 'position.y': Hh / 2 - cy, alpha: k * q };
        });
      });
    })(b);
  }
});

/* 13. xpLissajous */
register('xpLissajous', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpLissajous'), ab = Array.isArray(P.ab) ? P.ab : [3, 2], k = H.p(P, 'k', 0.15);
  var spd = H.p(P, 'spd', 0.1), seed = H.p(P, 'seed', 1) % 6, rx = W * 0.46, ry = Hh * 0.44, Npts = 180;
  [0, 1].forEach(function (ci) {
    var dl = seed - ci * 0.35, cmds = [];
    for (var i = 0; i <= Npts; i++) {
      var th = i / Npts * TAU;
      cmds.push([i ? 'L' : 'M', rx * Math.sin(ab[0] * th + dl), -ry * Math.sin(ab[1] * th)]);
    }
    var aBase = k * (ci ? 0.45 : 1);
    var id = C.shape(c.graph, c.cut, c.cut.id + ' / Lissajous ' + ci, c.parent, cmds,
      { stroke: c.sc.fg, width: Math.max(1.5, U * 0.0026), alpha: aBase });
    V.animate(c, id, function (e, f) {
      var t = clk.absTime(f), q = clk.enter(f, 1.0);
      return { rotation: -(t * spd * 18 * (ci ? -1 : 1)), 'scale.x': 0.8 + 0.2 * q, 'scale.y': 0.8 + 0.2 * q, alpha: aBase * q };
    });
  });
});

/* 14. xpPendulums */
register('xpPendulums', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpPendulums'), seed = H.p(P, 'seed', 1), k = H.p(P, 'k', 0.15), amp = H.p(P, 'amp', 7);
  var n = Math.min(18, Math.max(6, Math.round(W / (U * 0.14))));
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var x = W * (idx + 0.5 + 0.3 * (N.random(seed, idx, 1) * 2 - 1)) / n;
      var L = Hh * (0.28 + 0.55 * N.random(seed, idx, 2)), ph = N.random(seed, idx, 3) * TAU;
      var r = U * (0.008 + 0.01 * N.random(seed, idx, 4));
      var piv = c.graph.add('null', c.cut.id + ' / Pendulum ' + idx, c.parent, c.cut.start, c.cut.end,
        { position: H.toScene(c, x, 0) });
      C.shape(c.graph, c.cut, c.cut.id + ' / Pendulum wire ' + idx, piv,
        [['M', 0, 0], ['L', 0, -L]], { stroke: c.sc.fg, width: Math.max(1.5, U * 0.002), alpha: k });
      C.shape(c.graph, c.cut, c.cut.id + ' / Pendulum bob ' + idx, piv,
        G.ellipse(0, -L, r, r), { fill: c.sc.fg, alpha: k * 1.3 });
      V.animate(c, piv, function (e, f) {
        var t = clk.absTime(f), q = clk.enter(f, 0.9);
        var a = amp * Math.sin(t * 0.9 / Math.sqrt(0.3 + L / Hh) + ph);
        return { rotation: a, 'scale.y': Math.max(0.05, q), alpha: q };
      });
    })(i);
  }
});

/* 15. xpOrbits */
register('xpOrbits', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), big = Math.max(W, Hh);
  var clk = H.bgClock(c, 'xpOrbits'), seed = H.p(P, 'seed', 1), k = H.p(P, 'k', 0.15), spd = H.p(P, 'spd', 0.3);
  var tilt = H.p(P, 'tilt', 0) + (Hh > W ? 90 : 0);
  var rig = c.graph.add('null', c.cut.id + ' / Orbits rig', c.parent, c.cut.start, c.cut.end,
    { position: H.toScene(c, W * H.p(P, 'cx', 0.5), Hh * 0.5), rotation: -tilt });
  C.shape(c.graph, c.cut, c.cut.id + ' / Orbit star', rig, G.ellipse(0, 0, U * 0.035, U * 0.035), { fill: c.sc.fg, alpha: k * 0.6 });
  for (var i = 0; i < 5; i++) {
    (function (idx) {
      var rx = big * (0.16 + 0.13 * idx), ry = rx * 0.36, pr = U * (0.009 + 0.008 * N.random(seed, idx, 2));
      var ph = N.random(seed, idx) * TAU, dir = idx % 2 ? -1 : 1, spDiv = 0.6 + idx * 0.5;
      var ring = C.shape(c.graph, c.cut, c.cut.id + ' / Orbit ring ' + idx, rig,
        G.ellipse(0, 0, rx, ry), { stroke: c.sc.fg, width: Math.max(1.5, U * 0.002), alpha: k });
      var planet = C.shape(c.graph, c.cut, c.cut.id + ' / Orbit planet ' + idx, rig,
        G.ellipse(0, 0, pr, pr), { fill: c.sc.accent, alpha: 0.45 });
      V.animate(c, ring, function (e, f) {
        var q = clk.enter(f, 0.9), sc = 0.8 + 0.2 * q;
        return { 'scale.x': sc, 'scale.y': sc, alpha: k * q };
      });
      V.animate(c, planet, function (e, f) {
        var t = clk.absTime(f), q = clk.enter(f, 0.9), sc = 0.8 + 0.2 * q;
        var a = t * spd / spDiv * dir + ph;
        return { 'position.x': Math.cos(a) * rx * sc, 'position.y': -Math.sin(a) * ry * sc, alpha: 0.45 * q };
      });
    })(i);
  }
});

/* 16. xpMarchDash */
register('xpMarchDash', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpMarchDash'), seed = H.p(P, 'seed', 1), n = Math.max(4, Math.round(H.p(P, 'n', 11)));
  var spd = H.p(P, 'spd', 0.04), k = H.p(P, 'k', 0.11), lw = Math.max(1.5, U * 0.005);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var y = Hh * (idx + 0.5) / n, d = U * (0.04 + 0.24 * N.random(seed, idx)), g = d * (0.5 + N.random(seed, idx, 2));
      var per = d + g, cmds = [];
      for (var x = -per; x < W + per * 2; x += per) {
        cmds.push(['M', x - W / 2, 0], ['L', x + d - W / 2, 0]);
      }
      var col = idx === (seed % n) ? c.sc.accent : c.sc.fg;
      var a = k * (0.7 + 0.7 * N.random(seed, idx, 5)), dir = idx % 2 ? -1 : 1;
      var spM = 0.5 + 1.5 * N.random(seed, idx, 3), ph = N.random(seed, idx, 4) * per;
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Dash row ' + idx, c.parent, cmds, { stroke: col, width: lw, alpha: a });
      V.animate(c, id, function (e, f) {
        var ox = wrap(clk.absTime(f) * U * spd * dir * spM + ph, per) - per;
        return { 'position.x': ox, 'position.y': Hh / 2 - y, alpha: a * clk.enter(f, 0.6) };
      });
    })(i);
  }
});

/* 17. xpDepthGrid */
register('xpDepthGrid', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpDepthGrid'), base = U * 0.1, spd = H.p(P, 'spd', 0.045), k = H.p(P, 'k', 0.11);
  var nx = Math.min(12, Math.ceil(W / 2 / base)), ny = Math.min(12, Math.ceil(Hh / 2 / base));
  var cmds = [], lw = Math.max(1.2, U * 0.0022);
  for (var i = -nx; i <= nx; i++) cmds.push(['M', (i + 0.5) * base, -Hh / 2], ['L', (i + 0.5) * base, Hh / 2]);
  for (var j = -ny; j <= ny; j++) cmds.push(['M', -W / 2, (j + 0.5) * base], ['L', W / 2, (j + 0.5) * base]);
  for (var l = 0; l < 3; l++) {
    (function (li) {
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Depth grid ' + li, c.parent, cmds, { stroke: c.sc.fg, width: lw, alpha: k });
      V.animate(c, id, function (e, f) {
        var p = wrap(clk.absTime(f) * spd + li / 3, 1), sc = Math.pow(2, p);
        return { 'scale.x': sc, 'scale.y': sc, alpha: k * Math.sin(Math.PI * p) * clk.enter(f, 0.6) };
      });
    })(l);
  }
});

/* 18. xpStringArt */
register('xpStringArt', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpStringArt'), spd = H.p(P, 'spd', 0.05), k = H.p(P, 'k', 0.11), Nline = 22;
  var cs = P.diag ? [[0, 0, 1, 1], [W, Hh, -1, -1]] : [[W, 0, -1, 1], [0, Hh, 1, -1]];
  var lw = Math.max(1.5, U * 0.0018);
  cs.forEach(function (sp, ci) {
    var x0 = sp[0], y0 = sp[1], dx = sp[2], dy = sp[3], Lx = W * 0.85, Ly = Hh * 0.85;
    for (var i = 0; i < Nline; i++) {
      (function (idx) {
        var u0 = (idx + 0.5) / Nline, pA = [x0, y0 + dy * Ly * (1 - u0)], pB = [x0 + dx * Lx * u0, y0];
        var id = H.line(c, 'String ' + ci + '_' + idx, [pA, pB], c.sc.fg, lw, k);
        V.animate(c, id, function (e, f) {
          var q = clk.enter(f, 0.9), ph = 0.5 + 0.5 * Math.sin(clk.absTime(f) * spd * TAU + idx * 0.25 + ci);
          return { 'scale.x': Math.max(0.05, q), 'scale.y': Math.max(0.05, q), alpha: k * (0.45 + 0.55 * ph) * q };
        });
      })(i);
    }
  });
});

/* 19. xpDotSheet */
register('xpDotSheet', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpDotSheet'), cols = 20, rows = 10, k = H.p(P, 'k', 0.18), topFlip = P.top ? -1 : 1;
  var rig = c.graph.add('null', c.cut.id + ' / Dot sheet', c.parent, c.cut.start, c.cut.end, { 'scale.y': topFlip });
  for (var j = 0; j < rows; j++) {
    (function (rj) {
      var f = rj / (rows - 1), near = 1 - f, yb = Hh * (0.4 + 0.58 * Math.pow(near, 1.7)), sz = 0.4 + 0.6 * near;
      var cmds = [];
      for (var i = 0; i < cols; i++) {
        var px = W * (-0.06 + 1.12 * i / (cols - 1)) + U * 0.02 * rj - W / 2, r = U * 0.0065 * sz;
        cmds = cmds.concat(G.ellipse(px, -Math.sin(i * 0.45 + rj * 0.2) * U * 0.03 * sz, r, r));
      }
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Dot row ' + rj, rig, cmds, { fill: c.sc.fg, alpha: k });
      V.animate(c, id, function (e, f0) {
        var t = clk.absTime(f0), q = clk.enter(f0, 0.6);
        var dy = Math.sin(t * 0.9 - rj * 0.6) * U * 0.035 * sz;
        return { 'position.y': Hh / 2 - (yb - dy), alpha: k * q };
      });
    })(j);
  }
});

/* 20. xpWindStreaks */
register('xpWindStreaks', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), D = Math.hypot(W, Hh);
  var clk = H.bgClock(c, 'xpWindStreaks'), seed = H.p(P, 'seed', 1), dir = H.p(P, 'dir', 1);
  var spd = H.p(P, 'spd', 0.07), k = H.p(P, 'k', 0.16);
  var rig = c.graph.add('null', c.cut.id + ' / Wind streaks', c.parent, c.cut.start, c.cut.end,
    { rotation: -H.p(P, 'ang', 0) });
  for (var b = 0; b < 3; b++) {
    var d = (b + 1) / 3, a = k * (0.45 + 0.55 * d), lw = Math.max(1.2, U * 0.0018 * (1 + d * 1.4));
    for (var i = 0; i < 12; i++) {
      (function (bi, idx) {
        var len = U * (0.05 + 0.16 * d) * (0.6 + 0.8 * N.random(seed, bi, idx, 1));
        var xOff = N.random(seed, bi, idx, 2) * (D + len), yBase = (N.random(seed, bi, idx, 3) - 0.5) * D;
        var id = C.shape(c.graph, c.cut, c.cut.id + ' / Wind ' + bi + '_' + idx, rig,
          [['M', 0, 0], ['L', len, 0]], { stroke: c.sc.fg, width: lw, alpha: a });
        V.animate(c, id, function (e, f) {
          var t = clk.absTime(f), q = clk.enter(f, 0.6);
          var x = wrap(xOff + dir * t * D * spd * (0.4 + d), D + len) - D / 2 - len;
          var y = yBase + U * 0.012 * Math.sin(t * 0.8 + idx);
          return { 'position.x': x, 'position.y': -y, alpha: a * q };
        });
      })(b, i);
    }
  }
});

/* 21. xpPlexus */
register('xpPlexus', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpPlexus'), seed = H.p(P, 'seed', 1), n = Math.min(20, Math.max(10, Math.round(H.p(P, 'n', 20))));
  var D = Math.max(W, Hh) * 0.25, k = H.p(P, 'k', 0.22), lw = Math.max(1.2, U * 0.0018);
  var nodes = [];
  for (var i = 0; i < n; i++) {
    nodes.push({
      bx: W * (N.random(seed, i, 1) * 1.1 - 0.05),
      by: Hh * (N.random(seed, i, 2) * 1.1 - 0.05),
      wx: 0.15 + 0.2 * N.random(seed, i, 3), px: N.random(seed, i, 4) * TAU,
      wy: 0.13 + 0.2 * N.random(seed, i, 5), py: N.random(seed, i, 6) * TAU
    });
  }
  function npos(nd, t) {
    return [nd.bx + U * 0.07 * Math.sin(t * nd.wx + nd.px), nd.by + U * 0.07 * Math.cos(t * nd.wy + nd.py)];
  }
  nodes.forEach(function (nd, idx) {
    var r = U * 0.005;
    var dotId = C.shape(c.graph, c.cut, c.cut.id + ' / Plexus node ' + idx, c.parent, G.ellipse(0, 0, r, r), { fill: c.sc.fg, alpha: k });
    V.animate(c, dotId, function (e, f) {
      var pt = npos(nd, clk.absTime(f)), p = H.toScene(c, pt[0], pt[1]);
      return { 'position.x': p[0], 'position.y': p[1], alpha: k * clk.enter(f, 0.6) };
    });
  });
  for (var a = 0; a < n; a++) {
    for (var b = a + 1; b < n; b++) {
      if (Math.hypot(nodes[a].bx - nodes[b].bx, nodes[a].by - nodes[b].by) > D + U * 0.14) continue;
      (function (ia, ib) {
        var edgeId = C.shape(c.graph, c.cut, c.cut.id + ' / Plexus edge ' + ia + '_' + ib, c.parent,
          [['M', 0, 0], ['L', 1, 0]], { stroke: c.sc.fg, width: lw, alpha: k });
        V.animate(c, edgeId, function (e, f) {
          var t = clk.absTime(f), q = clk.enter(f, 0.6);
          var pa = npos(nodes[ia], t), pb = npos(nodes[ib], t);
          var dx = pb[0] - pa[0], dy = pb[1] - pa[1], dist = Math.hypot(dx, dy);
          if (dist >= D) return { alpha: 0 };
          var s0 = H.toScene(c, pa[0], pa[1]), ang = Math.atan2(-dy, dx) / DEG;
          return { 'position.x': s0[0], 'position.y': s0[1], rotation: ang, 'scale.x': Math.max(1, dist), alpha: k * (1 - dist / D) * q };
        });
      })(a, b);
    }
  }
});

/* 22. xpPhyllo */
register('xpPhyllo', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpPhyllo'), cx = W * H.p(P, 'cx', 0.5), cy = Hh * H.p(P, 'cy', 0.5);
  var spd = H.p(P, 'spd', 1.6), k = H.p(P, 'k', 0.14), Npts = 240, GA = 137.508 * DEG;
  var cc = Math.hypot(W, Hh) * 0.72 / Math.sqrt(Npts), cmds = [];
  for (var i = 1; i < Npts; i++) {
    var q = Math.sqrt(i), r = cc * q, a = i * GA;
    var rad = U * 0.0095 * (0.75 + 0.45 * Math.sin(q * 0.6));
    cmds = cmds.concat(G.ellipse(Math.cos(a) * r, -Math.sin(a) * r, rad, rad));
  }
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Phyllotaxis', c.parent, cmds, { fill: c.sc.fg, alpha: k });
  c.graph.byId[id].attrs.position = H.toScene(c, cx, cy);
  V.animate(c, id, function (e, f) {
    var t = clk.absTime(f), q = clk.enter(f, 0.9);
    return { rotation: -(t * spd), 'scale.x': 0.5 + 0.5 * q, 'scale.y': 0.5 + 0.5 * q, alpha: k * q };
  });
});

/* 23. xpBlinkCells */
register('xpBlinkCells', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpBlinkCells'), seed = H.p(P, 'seed', 1);
  var cell = Math.max(U * H.p(P, 'cell', 0.095), Math.sqrt(W * Hh / 180)), gap = cell * 0.06, k = H.p(P, 'k', 0.09);
  var nx = Math.min(18, Math.ceil(W / cell)), ny = Math.min(12, Math.ceil(Hh / cell));
  var ox = (W - nx * cell) / 2, oy = (Hh - ny * cell) / 2;
  for (var j = 0; j < ny; j++) {
    for (var i = 0; i < nx; i++) {
      (function (ci, cj) {
        var ph = N.random(seed, ci, cj) * 60, ns = (seed + ci * 31 + cj * 17) % 9973;
        var id = H.rect(c, 'Blink cell ' + ci + '_' + cj,
          ox + ci * cell + gap, oy + cj * cell + gap, cell - gap * 2, cell - gap * 2, { fill: c.sc.fg, alpha: k });
        V.animate(c, id, function (e, f) {
          var v = R.noise(clk.absTime(f) * 0.45 + ph, ns) - 0.3;
          return { alpha: v > 0 ? cl(v * 2) * k * clk.enter(f, 0.6) : 0 };
        });
      })(i, j);
    }
  }
});

/* 24. xpDriftMarks */
register('xpDriftMarks', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpDriftMarks'), seed = H.p(P, 'seed', 1), n = Math.min(24, Math.max(8, Math.round(H.p(P, 'n', 16))));
  var M = U * 0.1, k = H.p(P, 'k', 0.18), lw = Math.max(1.5, U * 0.003);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var r = U * (0.018 + 0.03 * N.random(seed, idx, 1));
      var x0 = N.random(seed, idx, 2) * (W + M * 2), vx = U * 0.02 * (N.random(seed, idx, 3) * 2 - 1);
      var y0 = N.random(seed, idx, 4) * (Hh + M * 2), vy = U * 0.014 * (N.random(seed, idx, 5) * 2 - 1);
      var rotV = 0.3 * (N.random(seed, idx, 6) * 2 - 1) / DEG, rot0 = N.random(seed, idx, 7) * 360;
      var ty = Math.floor(N.random(seed, idx, 8) * 4);
      var cmds = ty === 0 ? G.ellipse(0, 0, r, r)
        : ty === 1 ? [['M', -r, 0], ['L', r, 0], ['M', 0, -r], ['L', 0, r]]
          : polyCmds(0, 0, r * 1.15, ty === 2 ? 3 : 4, 0);
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Drift mark ' + idx, c.parent, cmds, { stroke: c.sc.fg, width: lw, alpha: k });
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f), x = wrap(x0 + t * vx, W + M * 2) - M, y = wrap(y0 + t * vy, Hh + M * 2) - M;
        var pos = H.toScene(c, x, y);
        return { 'position.x': pos[0], 'position.y': pos[1], rotation: -(rot0 + t * rotV), alpha: k * clk.enter(f, 0.6) };
      });
    })(i);
  }
});

/* 25. xpTwinDiscs */
register('xpTwinDiscs', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpTwinDiscs'), k = H.p(P, 'k', 0.045), ph = H.p(P, 'ph', 0), R = U * 0.56, v = Hh > W;
  var d1 = C.shape(c.graph, c.cut, c.cut.id + ' / Twin disc A', c.parent, G.ellipse(0, 0, R, R), { fill: c.sc.fg, alpha: k });
  var d2 = C.shape(c.graph, c.cut, c.cut.id + ' / Twin disc B', c.parent, G.ellipse(0, 0, R * 0.9, R * 0.9), { fill: c.sc.accent, alpha: k * 1.3 });
  [[-1, d1, k], [1, d2, k * 1.3]].forEach(function (sp) {
    V.animate(c, sp[1], function (e, f) {
      var t = clk.absTime(f), q = clk.enter(f, 0.9), sc = 0.8 + 0.2 * q;
      var a = 0.2 + 0.07 * Math.sin(t * 0.21 + ph), b = 0.09 * Math.cos(t * 0.17 + ph);
      var cx = W * (0.5 + sp[0] * (v ? b : a)), cy = Hh * (0.5 + sp[0] * (v ? a : b));
      var pos = H.toScene(c, cx, cy);
      return { 'position.x': pos[0], 'position.y': pos[1], 'scale.x': sc, 'scale.y': sc, alpha: sp[2] * q };
    });
  });
});

/* 26. xpLeanVignette */
register('xpLeanVignette', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'xpLeanVignette'), spd = H.p(P, 'spd', 0.22), seed = H.p(P, 'seed', 1) % 6;
  var k = H.p(P, 'k', 1) * (dk ? 0.5 : 0.16), R = Math.hypot(W, Hh) * 0.9;
  for (var i = 0; i < 4; i++) {
    (function (idx) {
      var rIn = mix(U * 0.3, R * 0.85, idx / 4), cmds = G.rect(-W * 1.2, -Hh * 1.2, W * 2.4, Hh * 2.4);
      cmds.push(['M', rIn, 0]);
      for (var j = 27; j >= 0; j--) cmds.push(['L', Math.cos(j * TAU / 28) * rIn, Math.sin(j * TAU / 28) * rIn]);
      cmds.push(['Z']);
      var aBase = k * ((idx + 1) / 4) * 0.38;
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Lean vignette ' + idx, c.parent, cmds, { fill: '#000000', alpha: aBase });
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f), q = clk.enter(f, 0.9), a = t * spd + seed;
        var pos = H.toScene(c, W * (0.5 + 0.24 * Math.cos(a)), Hh * (0.5 + 0.24 * Math.sin(a)));
        return { 'position.x': pos[0], 'position.y': pos[1], alpha: aBase * q };
      });
    })(i);
  }
  var lc = lightOf(c.sc);
  var glow = C.shape(c.graph, c.cut, c.cut.id + ' / Lean glow', c.parent, G.ellipse(0, 0, U * 0.5, U * 0.5), { fill: lc, alpha: 0.06 });
  V.animate(c, glow, function (e, f) {
    var t = clk.absTime(f), q = clk.enter(f, 0.9), a = t * spd + seed;
    var pos = H.toScene(c, W * (0.5 + 0.24 * Math.cos(a)), Hh * (0.5 + 0.24 * Math.sin(a)));
    return { 'position.x': pos[0], 'position.y': pos[1], alpha: 0.06 * q };
  });
});

/* 27. xpCapsules */
register('xpCapsules', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), D = Math.hypot(W, Hh);
  var clk = H.bgClock(c, 'xpCapsules'), seed = H.p(P, 'seed', 1), spd = H.p(P, 'spd', 0.025), k = H.p(P, 'k', 0.045);
  var hh = U * 0.17, gapY = U * 0.27, Lp = U * 1.7, nl = Math.min(5, Math.ceil(D / 2 / gapY));
  var rig = c.graph.add('null', c.cut.id + ' / Capsules rig', c.parent, c.cut.start, c.cut.end, { rotation: -H.p(P, 'ang', 20) });
  for (var j = -nl; j <= nl; j++) {
    (function (rj) {
      var len = U * (0.55 + 0.75 * N.random(seed, rj + 9)), off0 = N.random(seed, rj + 9, 3) * Lp;
      var dir = rj % 2 ? 1 : -1, spM = 0.5 + 1.5 * N.random(seed, rj + 9, 2), cmds = [];
      for (var x = -D / 2 - Lp; x < D / 2 + Lp; x += Lp) {
        cmds = cmds.concat(stadiumCmds(x, rj * gapY - hh / 2, len, hh));
      }
      var paint = (rj & 1)
        ? { stroke: c.sc.fg, width: Math.max(1.5, U * 0.003), alpha: k * 2 }
        : { fill: rj === 0 ? c.sc.accent : c.sc.fg, alpha: k * (rj === 0 ? 1.3 : 1) };
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Capsule row ' + rj, rig, cmds, paint);
      V.animate(c, id, function (e, f) {
        return { 'position.x': wrap(clk.absTime(f) * U * spd * dir * spM + off0, Lp) - Lp, alpha: paint.alpha * clk.enter(f, 0.6) };
      });
    })(j);
  }
});

/* 28. xpSlitLight */
register('xpSlitLight', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpSlitLight'), ph = H.p(P, 'seed', 1) % 7, n = Math.max(3, Math.round(H.p(P, 'n', 6)));
  var lc = lightOf(c.sc), k = H.p(P, 'k', 0.08), sh = U * 0.062, gp = U * 0.04, wd = U * 0.95, tot = n * sh + (n - 1) * gp;
  var sk = H.p(P, 'sk', -0.4);
  var rig = c.graph.add('null', c.cut.id + ' / Slit light rig', c.parent, c.cut.start, c.cut.end, {});
  V.animate(c, rig, function (e, f) {
    var t = clk.absTime(f), pos = H.toScene(c, W * (0.5 + 0.2 * Math.sin(t * 0.14 + ph)), Hh * (0.5 + 0.1 * Math.sin(t * 0.11 + ph * 2)));
    return { 'position.x': pos[0], 'position.y': pos[1] };
  });
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var y0 = -tot / 2 + idx * (sh + gp), y1 = y0 + sh;
      var pts = [[-wd / 2 + sk * y0, -y0], [wd / 2 + sk * y0, -y0], [wd / 2 + sk * y1, -y1], [-wd / 2 + sk * y1, -y1]];
      var cmds = pts.map(function (pt, pi) { return [pi ? 'L' : 'M', pt[0], pt[1]]; }).concat([['Z']]);
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Slit ' + idx, rig, cmds, { fill: lc, alpha: k });
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f), q = clk.enter(f, 1.0);
        return { 'scale.y': 0.75 + 0.25 * Math.sin(t * 0.3 + idx * 0.5), alpha: k * q };
      });
    })(i);
  }
});

/* 29. xpPosterGrad */
register('xpPosterGrad', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, L = Math.hypot(W, Hh);
  var clk = H.bgClock(c, 'xpPosterGrad'), ang = H.p(P, 'ang', 0), n = Math.max(3, Math.round(H.p(P, 'n', 6)));
  var k = H.p(P, 'k', 0.022), ph = H.p(P, 'seed', 1) % 5, col = P.acc ? c.sc.accent : c.sc.fg;
  var rig = c.graph.add('null', c.cut.id + ' / Poster grad rig', c.parent, c.cut.start, c.cut.end, {});
  V.animate(c, rig, function (e, f) { return { rotation: -(ang + 9 * Math.sin(clk.absTime(f) * 0.13 + ph)) }; });
  for (var i = 1; i <= n; i++) {
    (function (idx) {
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Poster step ' + idx, rig, G.rect(0, -L / 2, L, L), { fill: col, alpha: k });
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f), x = -L / 2 + L * (idx / (n + 1) + 0.035 * Math.sin(t * 0.3 + idx * 1.1 + ph));
        return { 'position.x': x, alpha: k * clk.enter(f, 0.6) };
      });
    })(i);
  }
});

/* 30. xpBigRing */
register('xpBigRing', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpBigRing'), ph = H.p(P, 'seed', 1) % 7, k = H.p(P, 'k', 0.055), R = U * 0.6, R2 = R * 1.32;
  var cxF = H.p(P, 'cx', 0.5), cyF = H.p(P, 'cy', 0.5);
  var rig = c.graph.add('null', c.cut.id + ' / Big ring rig', c.parent, c.cut.start, c.cut.end, {});
  V.animate(c, rig, function (e, f) {
    var t = clk.absTime(f), q = clk.enter(f, 1.0), sc = 0.8 + 0.2 * q;
    var pos = H.toScene(c, W * (cxF + 0.05 * Math.sin(t * 0.16 + ph)), Hh * (cyF + 0.05 * Math.cos(t * 0.13 + ph)));
    return { 'position.x': pos[0], 'position.y': pos[1], 'scale.x': sc, 'scale.y': sc, alpha: q };
  });
  C.shape(c.graph, c.cut, c.cut.id + ' / Ring main', rig, G.ellipse(0, 0, R, R), { stroke: c.sc.fg, width: U * 0.11, alpha: k });
  var dashCmds = [];
  for (var d = 0; d < 40; d++) {
    var a0 = d / 40 * TAU, a1 = (d + 0.4) / 40 * TAU;
    dashCmds.push(['M', Math.cos(a0) * R2, -Math.sin(a0) * R2], ['L', Math.cos(a1) * R2, -Math.sin(a1) * R2]);
  }
  var dashId = C.shape(c.graph, c.cut, c.cut.id + ' / Ring ticks', rig, dashCmds, { stroke: c.sc.fg, width: Math.max(1.5, U * 0.002), alpha: k * 2 });
  V.animate(c, dashId, function (e, f) { return { rotation: -(clk.absTime(f) * 3) }; });
  var dotId = C.shape(c.graph, c.cut, c.cut.id + ' / Ring orb', rig, G.ellipse(0, 0, U * 0.012, U * 0.012), { fill: c.sc.accent, alpha: 0.4 });
  V.animate(c, dotId, function (e, f) {
    var a = clk.absTime(f) * 0.22 + ph;
    return { 'position.x': Math.cos(a) * R2, 'position.y': -Math.sin(a) * R2 };
  });
});

/* 31. xpCurtain */
register('xpCurtain', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height;
  var clk = H.bgClock(c, 'xpCurtain'), n = Math.max(4, Math.round(H.p(P, 'n', 9))), ph = H.p(P, 'seed', 1) % 9, k = H.p(P, 'k', 0.08);
  var foldW = W / n * 1.1;
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var a = k * (0.6 + 0.4 * Math.sin(idx * 2.1 + ph));
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Curtain fold ' + idx, c.parent,
        G.rect(-foldW * 0.45, -Hh / 2, foldW * 0.9, Hh), { fill: c.sc.fg, alpha: a });
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f), p = cl((idx + 0.5 + 0.3 * Math.sin(t * 0.45 + idx * 1.3 + ph)) / n);
        return { 'position.x': p * W - W / 2, alpha: a * clk.enter(f, 0.6) };
      });
    })(i);
  }
  [0.12, 0.24, 0.36].forEach(function (hf, idx) {
    H.rect(c, 'Curtain top shade ' + idx, 0, 0, W, Hh * hf, { fill: c.sc.bg, alpha: 0.2 });
  });
});

/* 32. xpRuler */
register('xpRuler', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpRuler'), sp = U * 0.016, per = sp * 10, k = H.p(P, 'k', 0.25);
  var y0 = Hh * (P.top ? 0.085 : 0.915), dy = P.top ? 1 : -1, x0 = W * (P.right ? 0.945 : 0.055), dx = P.right ? -1 : 1;
  var lw = Math.max(1.5, U * 0.0018);
  H.line(c, 'Ruler axis H', [[0, y0], [W, y0]], c.sc.fg, lw, k);
  H.line(c, 'Ruler axis V', [[x0, 0], [x0, Hh]], c.sc.fg, lw, k);
  var hCmds = [], vCmds = [];
  for (var i = 0; i * sp < W + per; i++) {
    var tl = U * (i % 10 === 0 ? 0.042 : i % 5 === 0 ? 0.028 : 0.015), x = i * sp - W / 2;
    hCmds.push(['M', x, 0], ['L', x, -dy * tl]);
  }
  for (var j = 0; j * sp < Hh + per; j++) {
    var tl2 = U * (j % 10 === 0 ? 0.042 : j % 5 === 0 ? 0.028 : 0.015), y = -j * sp;
    vCmds.push(['M', 0, y], ['L', dx * tl2, y]);
  }
  var hTicks = C.shape(c.graph, c.cut, c.cut.id + ' / Ruler H ticks', c.parent, hCmds, { stroke: c.sc.fg, width: lw, alpha: k });
  var vTicks = C.shape(c.graph, c.cut, c.cut.id + ' / Ruler V ticks', c.parent, vCmds, { stroke: c.sc.fg, width: lw, alpha: k });
  V.animate(c, hTicks, function (e, f) {
    var q = clk.enter(f, 0.6);
    return { 'position.x': wrap(clk.absTime(f) * U * 0.02, per) - per, 'position.y': Hh / 2 - y0, 'scale.y': Math.max(0.05, q), alpha: k * q };
  });
  V.animate(c, vTicks, function (e, f) {
    var q = clk.enter(f, 0.6);
    return { 'position.x': x0 - W / 2, 'position.y': Hh / 2 + wrap(clk.absTime(f) * U * 0.02, per), 'scale.x': Math.max(0.05, q), alpha: k * q };
  });
  var ps = U * 0.014;
  var tri = C.shape(c.graph, c.cut, c.cut.id + ' / Ruler marker', c.parent,
    [['M', 0, dy * ps * 0.3], ['L', -ps, dy * ps * 1.9], ['L', ps, dy * ps * 1.9], ['Z']], { fill: c.sc.accent, alpha: 0.5 });
  V.animate(c, tri, function (e, f) {
    var px = W * (0.5 + 0.3 * Math.sin(clk.absTime(f) * 0.3));
    return { 'position.x': px - W / 2, 'position.y': Hh / 2 - y0, alpha: 0.5 * clk.enter(f, 0.6) };
  });
});

/* 33. xpGreekText */
register('xpGreekText', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpGreekText'), seed = H.p(P, 'seed', 1), spd = H.p(P, 'spd', 0.013), k = H.p(P, 'k', 0.06);
  var lh = U * 0.037, bh = U * 0.012, cols = W > Hh ? 3 : 2, gut = W * 0.04, cw = (W * 0.86 - gut * (cols - 1)) / cols;
  var rows = Math.min(48, Math.ceil(Hh / lh) + 2), cmds = [];
  for (var ci = 0; ci < cols; ci++) {
    for (var j = 0; j < rows; j++) {
      var id = j + ci * 11, m = wrap(id, 7);
      if (m === 6) continue;
      var len = m === 5 ? 0.25 + 0.5 * N.random(seed, id, ci) : 0.86 + 0.14 * N.random(seed, id, ci);
      var ind = m === 0 ? cw * 0.06 : 0;
      var x = W * 0.07 + ci * (cw + gut) + ind - W / 2, y = Hh / 2 - j * lh - bh;
      cmds = cmds.concat(G.rect(x, y, cw * len - ind, bh));
    }
  }
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Greek text', c.parent, cmds, { fill: c.sc.fg, alpha: k });
  V.animate(c, id, function (e, f) {
    return { 'position.y': wrap(clk.absTime(f) * U * spd, lh * 7), alpha: k * clk.enter(f, 0.6) };
  });
});

/* 34. xpSevenSeg */
register('xpSevenSeg', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height;
  var clk = H.bgClock(c, 'xpSevenSeg'), seed = H.p(P, 'seed', 1), rate = H.p(P, 'rate', 0.8), k = H.p(P, 'k', 0.08);
  var SEG = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f];
  var nd = W > Hh * 1.2 ? 3 : 2, gap = 0.24, dw = Math.min(W * 0.84 / (nd + (nd - 1) * gap), Hh * 0.66 / 1.85), dh = dw * 1.85;
  var x0 = (W - dw * (nd + (nd - 1) * gap)) / 2, y0 = (Hh - dh) / 2;
  function segPoly(x, y, w, h, segIdx) {
    var th = w * 0.17, g = th * 0.14, hl = w - th, vl = h / 2 - th / 2, q = th / 2;
    var L = x + q, Rg = x + w - q, T = y + q, M = y + h / 2, B = y + h - q, pts;
    function hz(sx, sy) { return [[sx + g, sy], [sx + q + g, sy - q], [sx + hl - q - g, sy - q], [sx + hl - g, sy], [sx + hl - q - g, sy + q], [sx + q + g, sy + q]]; }
    function vt(sx, sy) { return [[sx, sy + g], [sx + q, sy + q + g], [sx + q, sy + vl - q - g], [sx, sy + vl - g], [sx - q, sy + vl - q - g], [sx - q, sy + q + g]]; }
    pts = segIdx === 0 ? hz(L, T) : segIdx === 1 ? vt(Rg, T) : segIdx === 2 ? vt(Rg, M) : segIdx === 3 ? hz(L, B) : segIdx === 4 ? vt(L, M) : segIdx === 5 ? vt(L, T) : hz(L, M);
    return pts.map(function (pt) { return [pt[0] - 0.07 * (pt[1] - Hh / 2), pt[1]]; });
  }
  for (var d = 0; d < nd; d++) {
    for (var s = 0; s < 7; s++) {
      (function (di, si) {
        var p10 = Math.pow(10, nd - 1 - di);
        var id = H.poly(c, 'Seven seg ' + di + '_' + si, segPoly(x0 + di * dw * (1 + gap), y0, dw, dh, si), true, { fill: c.sc.fg, alpha: k });
        V.animate(c, id, function (e, f) {
          var tt = clk.absTime(f) * rate, n0 = Math.floor(tt), m = H.smoothstep(0, 0.22, tt - n0);
          var cur = (seed % 500) + n0, prv = cur - 1;
          var on = (SEG[Math.floor(cur / p10) % 10] >> si) & 1;
          var was = (SEG[Math.floor(prv / p10) % 10] >> si) & 1;
          var v = (on && was) ? 1 : (!on && !was) ? 0 : (on ? m : 1 - m);
          return { alpha: k * (0.22 + 0.78 * v) * clk.enter(f, 0.6) };
        });
      })(d, s);
    }
  }
});

/* 35. xpCropMarks */
register('xpCropMarks', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpCropMarks'), sp = U * H.p(P, 'sp', 0.36), r = U * 0.02, arm = U * 0.038, k = H.p(P, 'k', 0.2);
  var lw = Math.max(1.5, U * 0.002), nx = Math.min(8, Math.ceil(W / sp) + 2), ny = Math.min(8, Math.ceil(Hh / sp) + 2);
  for (var j = 0; j < ny; j++) {
    for (var i = 0; i < nx; i++) {
      (function (ci, cj) {
        var cmds = G.ellipse(0, 0, r, r).concat([['M', -arm, 0], ['L', arm, 0], ['M', 0, -arm], ['L', 0, arm]]);
        var dir = (ci + cj) % 2 ? 1 : -1;
        var id = C.shape(c.graph, c.cut, c.cut.id + ' / Crop grid ' + ci + '_' + cj, c.parent, cmds, { stroke: c.sc.fg, width: lw, alpha: k });
        V.animate(c, id, function (e, f) {
          var t = clk.absTime(f), q = clk.enter(f, 0.6);
          var ox = wrap(t * U * 0.012, sp) - sp / 2, oy = wrap(t * U * 0.007, sp) - sp / 2;
          var pos = H.toScene(c, ox + ci * sp, oy + cj * sp);
          return { 'position.x': pos[0], 'position.y': pos[1], rotation: -(t * 0.25 * dir / DEG), alpha: k * q };
        });
      })(i, j);
    }
  }
  var m = U * 0.05, l = U * 0.05, cCmds = [];
  [[m, m, 1, 1], [W - m, m, -1, 1], [m, Hh - m, 1, -1], [W - m, Hh - m, -1, -1]].forEach(function (cp) {
    var x = cp[0] - W / 2, y = Hh / 2 - cp[1];
    cCmds.push(['M', x, y + cp[3] * l * 0.2], ['L', x, y - cp[3] * l], ['M', x - cp[2] * l * 0.2, y], ['L', x + cp[2] * l, y]);
  });
  var corners = C.shape(c.graph, c.cut, c.cut.id + ' / Crop corners', c.parent, cCmds, { stroke: c.sc.fg, width: lw, alpha: k });
  V.animate(c, corners, function (e, f) { return { alpha: k * clk.enter(f, 0.6) }; });
});

/* 36. xpScanner */
register('xpScanner', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpScanner'), hz = Hh > W, L = hz ? Hh : W, X = hz ? W : Hh;
  var lc = lightOf(c.sc), k = H.p(P, 'k', 0.11), spd = H.p(P, 'spd', 0.45), seed = H.p(P, 'seed', 1) % 6;
  var bw = U * 0.11, lw = Math.max(1.5, U * 0.002);
  var veil = C.shape(c.graph, c.cut, c.cut.id + ' / Scanner veil', c.parent,
    hz ? G.rect(-X / 2, 0, X, L) : G.rect(0, -X / 2, L, X), { fill: c.sc.fg, alpha: 0.035 });
  if (hz) c.graph.byId[veil].attrs.position = [0, -L / 2]; else c.graph.byId[veil].attrs.position = [-L / 2, 0];
  V.animate(c, veil, function (e, f) {
    var p = 0.5 - 0.56 * Math.cos(clk.absTime(f) * spd + seed), q = clk.enter(f, 0.6);
    var frac = Math.max(0.005, cl(p));
    return hz ? { 'scale.y': frac, alpha: 0.035 * q } : { 'scale.x': frac, alpha: 0.035 * q };
  });
  [[bw * 2, k * 0.35], [bw, k * 0.55], [lw, k * 2.2]].forEach(function (sp, idx) {
    var bar = C.shape(c.graph, c.cut, c.cut.id + ' / Scanner beam ' + idx, c.parent,
      hz ? G.rect(-X / 2, -sp[0] / 2, X, sp[0]) : G.rect(-sp[0] / 2, -X / 2, sp[0], X), { fill: lc, alpha: sp[1] });
    V.animate(c, bar, function (e, f) {
      var x = L * (0.5 - 0.56 * Math.cos(clk.absTime(f) * spd + seed)), q = clk.enter(f, 0.6);
      return hz ? { 'position.y': Hh / 2 - x, alpha: sp[1] * q } : { 'position.x': x - W / 2, alpha: sp[1] * q };
    });
  });
});

/* 37. xpStepBlocks */
register('xpStepBlocks', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpStepBlocks'), cell = U * 0.11, per = Math.max(3, Math.round(H.p(P, 'per', 6)));
  var spd = H.p(P, 'spd', 0.55), k = H.p(P, 'k', 0.045), n = Math.min(36, Math.ceil(W / cell) + per + 2);
  var botCmds = [], topCmds = [];
  for (var i = 0; i < n; i++) {
    var hb = cell * 0.6 * (1 + i % per), ht = cell * 0.6 * (1 + (per - 1 - i % per)), x = i * cell - W / 2;
    botCmds = botCmds.concat(G.rect(x, -Hh / 2, cell + 0.5, hb));
    topCmds = topCmds.concat(G.rect(x, Hh / 2 - ht, cell + 0.5, ht));
  }
  var botId = C.shape(c.graph, c.cut, c.cut.id + ' / Step blocks bottom', c.parent, botCmds, { fill: c.sc.fg, alpha: k });
  var topId = C.shape(c.graph, c.cut, c.cut.id + ' / Step blocks top', c.parent, topCmds, { fill: c.sc.accent, alpha: k * 1.1 });
  [botId, topId].forEach(function (id, isTop) {
    V.animate(c, id, function (e, f) {
      var fr = clk.absTime(f) * spd, fl = Math.floor(fr), q = clk.enter(f, 0.8);
      var sh = wrap((fl + E.inOutCubic(cl((fr - fl) * 2.2))) * cell, cell * per);
      return { 'position.x': isTop ? -sh : sh - cell * per, alpha: (isTop ? k * 1.1 : k) * q };
    });
  });
});

/* 38. xpRadar */
register('xpRadar', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpRadar'), seed = H.p(P, 'seed', 1), cx = W * H.p(P, 'cx', 0.5), cy = Hh * H.p(P, 'cy', 0.5);
  var R = Math.hypot(W, Hh), k = H.p(P, 'k', 0.1), sp = H.p(P, 'spd', 0.55), dir = sp < 0 ? -1 : 1, pos = H.toScene(c, cx, cy);
  var gridCmds = [['M', -W, 0], ['L', W, 0], ['M', 0, -Hh], ['L', 0, Hh]];
  for (var r = 1; r <= 5; r++) gridCmds = gridCmds.concat(G.ellipse(0, 0, U * 0.2 * r, U * 0.2 * r));
  var gridId = C.shape(c.graph, c.cut, c.cut.id + ' / Radar grid', c.parent, gridCmds,
    { stroke: c.sc.fg, width: Math.max(1.5, U * 0.0018), alpha: k * 1.3 });
  c.graph.byId[gridId].attrs.position = pos;
  V.animate(c, gridId, function (e, f) {
    var q = clk.enter(f, 0.8), sc = 0.8 + 0.2 * q;
    return { 'scale.x': sc, 'scale.y': sc, alpha: k * 1.3 * q };
  });
  var sweepRig = c.graph.add('null', c.cut.id + ' / Radar sweep rig', c.parent, c.cut.start, c.cut.end, { position: pos });
  V.animate(c, sweepRig, function (e, f) { return { rotation: -(clk.absTime(f) * sp / DEG), alpha: clk.enter(f, 0.8) }; });
  var NS = 16, da = 4.5 * DEG;
  for (var s = 0; s < NS; s++) {
    var a0 = -dir * s * da, a1 = -dir * (s + 1.05) * da;
    C.shape(c.graph, c.cut, c.cut.id + ' / Radar wedge ' + s, sweepRig,
      [['M', 0, 0], ['L', Math.cos(a0) * R, -Math.sin(a0) * R], ['L', Math.cos(a1) * R, -Math.sin(a1) * R], ['Z']],
      { fill: c.sc.fg, alpha: k * Math.pow(1 - s / NS, 1.6) });
  }
  for (var b = 0; b < 6; b++) {
    (function (bi) {
      var a = N.random(seed, bi, 1) * TAU, rad = U * (0.15 + 0.6 * N.random(seed, bi, 2));
      var blip = C.shape(c.graph, c.cut, c.cut.id + ' / Radar blip ' + bi, c.parent,
        G.ellipse(0, 0, U * 0.009, U * 0.009), { fill: c.sc.accent, alpha: 0.5 });
      c.graph.byId[blip].attrs.position = H.toScene(c, cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
      V.animate(c, blip, function (e, f) {
        var ang = clk.absTime(f) * sp, age = wrap(dir * (ang - a), TAU) / TAU;
        return { alpha: 0.5 * Math.pow(1 - age, 3) * clk.enter(f, 0.8) };
      });
    })(b);
  }
});

/* 39. xpLoadBars */
register('xpLoadBars', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'xpLoadBars'), seed = H.p(P, 'seed', 1), n = Math.max(3, Math.round(H.p(P, 'n', 7)));
  var k = H.p(P, 'k', 0.08), bh = U * 0.02, lw = Math.max(1.5, U * 0.0018);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var w = W * (0.3 + 0.55 * N.random(seed, idx, 1)), x = N.random(seed, idx, 2) < 0.5 ? W * 0.06 : W * 0.94 - w;
      var y = Hh * (idx + 0.5 + 0.25 * (N.random(seed, idx, 3) * 2 - 1)) / n - bh / 2;
      var sp = 0.05 + 0.07 * N.random(seed, idx, 4), ph = N.random(seed, idx, 5), hot = idx === (seed % n);
      var box = H.rect(c, 'Load frame ' + idx, x, y, w, bh, { stroke: c.sc.fg, width: lw, alpha: k * 1.5 });
      var fill = C.shape(c.graph, c.cut, c.cut.id + ' / Load fill ' + idx, c.parent, G.rect(0, -bh, w, bh),
        { fill: hot ? c.sc.accent : c.sc.fg, alpha: hot ? k * 2.4 : k });
      c.graph.byId[fill].attrs.position = H.toScene(c, x, y);
      var foot = H.rect(c, 'Load foot ' + idx, x, y + bh * 1.8, w * 0.12, Math.max(2, bh * 0.3), { fill: c.sc.fg, alpha: k * 1.5 });
      [box, fill, foot].forEach(function (id, part) {
        V.animate(c, id, function (e, f) {
          var p = wrap(clk.absTime(f) * sp + ph, 1), pe = E.inOutCubic(p / 0.82);
          var a = clk.enter(f, 0.6) * H.smoothstep(0, 0.04, p) * (1 - H.smoothstep(0.9, 1, p));
          if (part === 1) return { 'scale.x': Math.max(0.01, pe), alpha: (hot ? k * 2.4 : k) * a };
          return { alpha: k * 1.5 * a };
        });
      });
    })(i);
  }
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
