/* Cavalry native backgrounds: x2 horror, kinetic, typo, and wa packs (24 recipes). */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, TAU = H.TAU, DEG = H.DEG;

function register(key, source, build, differences) {
  N.register('bg', key, {
    source: source,
    scope: 'cut',
    build: build,
    differences: differences || []
  });
}

function wrap(v, m) {
  return ((v % m) + m) % m;
}

function pad2(n) {
  n = ((n | 0) % 100 + 100) % 100;
  return (n < 10 ? '0' : '') + n;
}

function nightC(sc) {
  return H.mixHex(sc.bg, '#000000', H.dark(sc.bg) ? 0.72 : 0.9);
}

function dimC(sc, k) {
  return H.dark(sc.bg) ? H.layC(sc, k) : H.mixHex(sc.bg, '#000000', k * 1.1);
}

function glowC(sc) {
  if (H.dark(sc.bg)) return H.lum(sc.fg) > H.lum(sc.bg) ? sc.fg : sc.bg;
  return H.mixHex(sc.bg, '#FFFFFF', 0.85);
}

function lampLvl(t, seed, rate) {
  var st = Math.floor(t * 24), run = st >> 2;
  if (N.random(seed, run, 7) < 0.1 * (rate || 1)) return N.random(seed, st, 8) < 0.5 ? 0.15 : 0.55;
  return 0.88 + 0.12 * N.random(seed, st, 9);
}

function vign(c, name, aMax, r0F, clk) {
  var W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var dk = nightC(c.sc), rIn0 = U * (r0F || 0.3), rOut = Math.hypot(W, Hh) * 0.65;
  for (var i = 0; i < 4; i++) {
    (function (idx) {
      var rIn = mix(rIn0, rOut, idx / 4), cmds = G.rect(-W * 0.65, -Hh * 0.65, W * 1.3, Hh * 1.3);
      cmds.push(['M', rIn, 0]);
      for (var k = 27; k >= 0; k--) {
        var a = k * TAU / 28;
        cmds.push(['L', Math.cos(a) * rIn, Math.sin(a) * rIn]);
      }
      cmds.push(['Z']);
      var aBase = aMax * ((idx + 1) / 4) * 0.38;
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / ' + name + ' ' + idx, c.parent, cmds, { fill: dk, alpha: aBase });
      V.animate(c, id, function (e, f) { return { alpha: aBase * clk.enter(f, 0.8) }; });
    })(i);
  }
}

/* ================================================================ HORROR (src/11p_x2_horrorA.js) */

/* 1. hzFogBanks */
register('hzFogBanks', 'src/11p_x2_horrorA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'hzFogBanks'), seed = H.p(P, 'seed', 1), n = Math.max(2, Math.round(H.p(P, 'n', 5)));
  var sp = H.p(P, 'sp', 1), fog = H.mixHex(c.sc.bg, c.sc.fg, dk ? 0.65 : 0.6);
  var a0 = H.p(P, 'a', 0.12) * (dk ? 1 : 1.5);
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < 2; j++) {
      (function (bi, bj) {
        var rx = W * mix(0.4, 0.75, N.random(seed, bi, bj, 2)), ry = U * mix(0.06, 0.15, N.random(seed, bi, bj, 3));
        var yBase = Hh * (0.1 + 0.85 * N.random(seed, bi, 1));
        var v = mix(0.01, 0.028, N.random(seed, bi, 4)) * (bi % 2 ? -1 : 1) * sp;
        var span = W + rx * 2, xOff = W * N.random(seed, bi, bj, 5) * 2 + bj * span / 2;
        [[1.0, 0.42], [0.6, 0.68]].forEach(function (st, ri) {
          var id = C.shape(c.graph, c.cut, c.cut.id + ' / Fog bank ' + bi + '_' + bj + '_' + ri, c.parent,
            G.ellipse(0, 0, rx * st[0], ry * st[0]), { fill: fog, alpha: a0 * st[1] });
          V.animate(c, id, function (e, f) {
            var t = clk.absTime(f), fi = clk.enter(f, 1.0);
            var x = wrap(xOff + t * v * W, span) - rx, y = yBase + Math.sin(t * 0.13 + bi * 2) * U * 0.02;
            var br = 0.75 + 0.25 * Math.sin(t * 0.21 + bi + bj), pos = H.toScene(c, x, y);
            return { 'position.x': pos[0], 'position.y': pos[1], alpha: cl(a0 * st[1] * br * fi) };
          });
        });
      })(i, j);
    }
  }
  for (var gb = 0; gb < 4; gb++) {
    var bh = Hh * 0.1 * (gb + 1);
    var fId = H.rect(c, 'Ground fog ' + gb, 0, Hh - bh, W, bh, { fill: fog, alpha: a0 * 0.25 });
    V.animate(c, fId, function (e, f) { return { alpha: a0 * 0.25 * clk.enter(f, 1.0) }; });
  }
  vign(c, 'Fog vignette', 0.4, 0.3, clk);
});

/* 2. hzSwingLight */
register('hzSwingLight', 'src/11p_x2_horrorA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'hzSwingLight'), seed = H.p(P, 'seed', 1);
  var px = W * H.p(P, 'x', 0.5), py = -U * 0.04, amp = H.p(P, 'amp', 14), wF = H.p(P, 'w', 0.7);
  var half = H.p(P, 'half', 15), Ll = Math.hypot(W, Hh) * 1.1, hw = Math.tan(half * DEG) * Ll;
  var L = glowC(c.sc), darkCol = dk ? nightC(c.sc) : H.mixHex(c.sc.bg, '#000000', 0.55);
  var ph = N.random(seed, 1) * 6;
  var rig = c.graph.add('null', c.cut.id + ' / Swing lamp rig', c.parent, c.cut.start, c.cut.end,
    { position: H.toScene(c, px, py) });
  V.animate(c, rig, function (e, f) {
    var t = clk.absTime(f), th = amp * Math.sin(t * wF + ph) * (0.35 + 0.65 * H.motionAmt(c));
    return { rotation: th };
  });
  var shadowCmds = G.rect(-Ll * 2, -Ll * 2, Ll * 4, Ll * 3).concat([
    ['M', -U * 0.02, 0], ['L', U * 0.02, 0], ['L', hw, -Ll], ['L', -hw, -Ll], ['Z']
  ]);
  var shId = C.shape(c.graph, c.cut, c.cut.id + ' / Swing shadow cutout', rig, shadowCmds, { fill: darkCol, alpha: dk ? 0.5 : 0.2 });
  V.animate(c, shId, function (e, f) { return { alpha: (dk ? 0.5 : 0.2) * clk.enter(f, 0.8) }; });
  [1.0, 0.55].forEach(function (yf, idx) {
    var cone = C.shape(c.graph, c.cut, c.cut.id + ' / Swing beam ' + idx, rig,
      [['M', -U * 0.02, 0], ['L', U * 0.02, 0], ['L', hw * yf, -Ll * yf], ['L', -hw * yf, -Ll * yf], ['Z']],
      { fill: L, alpha: 0.09 });
    V.animate(c, cone, function (e, f) {
      return { alpha: 0.09 * lampLvl(clk.absTime(f), seed, 0.5) * clk.enter(f, 0.8) };
    });
  });
  var cord = C.shape(c.graph, c.cut, c.cut.id + ' / Lamp cord', rig,
    G.rect(-U * 0.0015, -U * 0.075, U * 0.003, U * 0.075), { fill: dimC(c.sc, 0.4), alpha: 1 });
  var shade = C.shape(c.graph, c.cut, c.cut.id + ' / Lamp shade', rig,
    [['M', -U * 0.012, -U * 0.075], ['L', U * 0.012, -U * 0.075], ['L', U * 0.04, -U * 0.105], ['L', -U * 0.04, -U * 0.105], ['Z']],
    { fill: dimC(c.sc, 0.4), alpha: 1 });
  [cord, shade].forEach(function (id) { V.animate(c, id, function (e, f) { return { alpha: clk.enter(f, 0.8) }; }); });
  var pool = C.shape(c.graph, c.cut, c.cut.id + ' / Floor pool', c.parent,
    G.ellipse(0, 0, U * 0.5, U * 0.07), { fill: L, alpha: 0.14 });
  V.animate(c, pool, function (e, f) {
    var t = clk.absTime(f), fi = clk.enter(f, 0.8);
    var th = amp * DEG * Math.sin(t * wF + ph) * (0.35 + 0.65 * H.motionAmt(c));
    var fx = px + Math.tan(th) * (Hh * 0.94 - py), pos = H.toScene(c, fx, Hh * 0.94);
    return { 'position.x': pos[0], 'position.y': pos[1], alpha: 0.14 * lampLvl(t, seed, 0.5) * fi };
  });
});

/* 3. hzFarWindows */
register('hzFarWindows', 'src/11p_x2_horrorA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'hzFarWindows'), seed = H.p(P, 'seed', 1), n = Math.max(3, Math.round(H.p(P, 'n', 7)));
  var per = H.p(P, 'per', 24), keep = ((P.keep | 0) % n + n) % n;
  var hc = dk ? H.mixHex(c.sc.bg, c.sc.fg, 0.075) : H.mixHex(c.sc.bg, '#000000', 0.16);
  var wc = dk ? H.mixHex(c.sc.fg, c.sc.accent, 0.2) : H.mixHex(c.sc.bg, '#FFFFFF', 0.7);
  for (var gb = 0; gb < 4; gb++) {
    var mh = Hh * 0.11 * (gb + 1);
    H.rect(c, 'Town mist ' + gb, 0, Hh - mh, W, mh, { fill: hc, alpha: 0.14 });
  }
  for (var i = 0; i < n; i++) {
    (function (hi) {
      var w = (W / n) * mix(0.72, 1.02, N.random(seed, hi, 1)), x = W * (hi / n) + (N.random(seed, hi, 2) * 2 - 1) * W * 0.012;
      var h = U * mix(0.11, 0.27, N.random(seed, hi, 3)), y = Hh - h;
      var cmds = G.rect(x - W / 2, Hh / 2 - Hh - 2, w, h + 2);
      if (N.random(seed, hi, 4) < 0.6) {
        var pk = h * mix(0.18, 0.34, N.random(seed, hi, 5));
        cmds.push(['M', x - w * 0.04 - W / 2, Hh / 2 - (y + 1)], ['L', x + w / 2 - W / 2, Hh / 2 - (y - pk)],
          ['L', x + w * 1.04 - W / 2, Hh / 2 - (y + 1)], ['Z']);
      }
      var house = C.shape(c.graph, c.cut, c.cut.id + ' / House ' + hi, c.parent, cmds, { fill: hc, alpha: 1 });
      V.animate(c, house, function (e, f) { return { 'position.y': -(1 - clk.enter(f, 0.8)) * h }; });
      var nw = 1 + Math.floor(N.random(seed, hi, 6) * 3), ww = Math.min(w * 0.14, U * 0.022), wh = ww * 1.3;
      for (var j = 0; j < nw; j++) {
        (function (wj) {
          var isLast = hi === keep && wj === 0, off = isLast ? per * 0.9 : per * (0.1 + 0.68 * N.random(seed, hi, wj, 7));
          var wx = x + w * (0.18 + 0.64 * (nw === 1 ? 0.5 : wj / (nw - 1))) - ww / 2;
          var wy = y + h * mix(0.22, 0.55, N.random(seed, hi, wj, 11));
          var winId = H.rect(c, 'Window ' + hi + '_' + wj, wx, wy, ww, wh, { fill: wc, alpha: 0.62 });
          V.animate(c, winId, function (e, f) {
            var t = clk.time(f), fi = clk.enter(f, 0.8), cyc = wrap(t, per), st = Math.floor(clk.absTime(f) * 12);
            var a = cl((cyc - N.random(seed, hi, wj, 8) * 0.8) / 0.4);
            if (cyc > off) a = 0; else if (cyc > off - 0.4 && N.random(seed, hi, wj, st, 9) < 0.5) a *= 0.25;
            if (isLast && cyc > per * 0.74 && N.random(seed, st >> 1, 10) < 0.3) a *= 0.3;
            return { 'position.y': -(1 - fi) * h, alpha: 0.62 * a * fi };
          });
        })(j);
      }
    })(i);
  }
  vign(c, 'Windows vignette', 0.3, 0.36, clk);
});

/* 4. hzHeadlights */
register('hzHeadlights', 'src/11p_x2_horrorA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'hzHeadlights'), per = H.p(P, 'per', 8), dir = H.p(P, 'dir', 1), yc = Hh * H.p(P, 'y', 0.42);
  var cols = Math.max(2, Math.round(H.p(P, 'cols', 2))), a0 = H.p(P, 'a', 0.12) * (dk ? 1 : 2.3), L = glowC(c.sc);
  if (!dk) {
    var veil = H.rect(c, 'Headlight room dim', 0, 0, W, Hh, { fill: H.mixHex(c.sc.bg, '#000000', 0.5), alpha: 0.2 });
    V.animate(c, veil, function (e, f) { return { alpha: 0.2 * clk.enter(f, 0.6) }; });
  }
  [0, 1].forEach(function (q) {
    for (var r = 0; r < 2; r++) {
      (function (row) {
        var wv = U * 0.46, hv = U * 0.4, gp = U * 0.014, cmds = [];
        for (var col = 0; col < cols; col++) {
          var lx0 = -wv / 2 + (wv / cols) * col + gp / 2, cw = wv / cols - gp, ch = hv / 2 - gp;
          cmds = cmds.concat(G.rect(lx0, -ch / 2, cw, ch));
        }
        var patch = C.shape(c.graph, c.cut, c.cut.id + ' / Headlight row ' + q + '_' + row, c.parent, cmds, { fill: L, alpha: a0 });
        V.animate(c, patch, function (e, f) {
          var t = clk.time(f), fi = clk.enter(f, 0.6), p = (wrap(t + 0.3, per) - q * 0.42) / 3.3;
          if (p <= 0 || p >= 1) return { alpha: 0 };
          var pe = dir > 0 ? p : 1 - p, xc = mix(-U * 0.55, W + U * 0.55, pe), sk = mix(-0.85, 0.85, pe);
          var ly = (row ? 0.25 : -0.25) * hv, pos = H.toScene(c, xc + sk * ly, yc + ly);
          var sx = 0.8 + 0.45 * Math.sin(Math.PI * p), al = Math.min(0.5, Math.pow(Math.sin(Math.PI * p), 0.7) * a0 * (q ? 0.45 : 1) * fi);
          return { 'position.x': pos[0], 'position.y': pos[1], 'scale.x': sx, rotation: -(Math.atan(sk * 0.35) / DEG), alpha: al };
        });
      })(r);
    }
  });
  vign(c, 'Headlight vignette', 0.42, 0.3, clk);
});

/* 5. hzHallLights */
register('hzHallLights', 'src/11p_x2_horrorA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'hzHallLights'), seed = H.p(P, 'seed', 1), vx = W * H.p(P, 'vx', 0.5), vy = Hh * 0.47;
  var n = Math.max(4, Math.round(H.p(P, 'n', 8))), per = H.p(P, 'per', 14), L = glowC(c.sc), col = dimC(c.sc, 0.2);
  function sK(k) { return 1 / (1 + k * 0.62); }
  var far = sK(n), lw = Math.max(1.2, U * 0.0024);
  if (!dk) H.rect(c, 'Hall dim', 0, 0, W, Hh, { fill: H.mixHex(c.sc.bg, '#000000', 0.5), alpha: 0.2 });
  [[0, 0], [W, 0], [W, Hh], [0, Hh]].forEach(function (cp, idx) {
    H.line(c, 'Hall edge ' + idx, [cp, [vx + (cp[0] - vx) * far, vy + (cp[1] - vy) * far]], col, lw, 0.8);
  });
  H.rect(c, 'Hall far end', vx - vx * far, vy - vy * far, W * far, Hh * far, { stroke: col, width: lw, alpha: 0.8 });
  var dtt = per * 0.55 / n;
  for (var k = n - 1; k >= 0; k--) {
    (function (idx) {
      var z = sK(idx), y = vy - (vy - Hh * 0.035) * z, fy = vy + (Hh * 0.985 - vy) * z;
      var hw = W * 0.15 * z, hh = Math.max(1.5, U * 0.014 * z), off = per * 0.14 + (n - 1 - idx) * dtt;
      H.rect(c, 'Hall fixture ' + idx, vx - hw, y - hh, hw * 2, hh * 2, { stroke: col, width: Math.max(1, U * 0.002 * Math.sqrt(z)), alpha: 1 });
      var lamp = H.rect(c, 'Hall lamp ' + idx, vx - hw, y - hh, hw * 2, hh * 2, { fill: L, alpha: 0.5 });
      var pool = H.circle(c, 'Hall pool ' + idx, vx, fy, hw * 1.9, hw * 0.42, { fill: L, alpha: 0.09 });
      [lamp, pool].forEach(function (id, isPool) {
        V.animate(c, id, function (e, f) {
          var t = clk.time(f), fi = clk.enter(f, 0.7), cyc = wrap(t, per), st = Math.floor(clk.absTime(f) * 12);
          var on = 1;
          if (cyc > per * 0.9) on = N.random(seed, idx, st, 1) < 0.25 + 0.75 * (cyc - per * 0.9) / (per * 0.1) ? 1 : 0.1;
          else if (cyc > off) on = 0; else if (cyc > off - 0.45) on = N.random(seed, idx, st, 2) < 0.5 ? 1 : 0.15;
          return { alpha: Math.pow(z, 0.35) * on * fi * (isPool ? 0.09 : 0.5) * (dk ? 1 : 1.7) };
        });
      });
    })(k);
  }
  vign(c, 'Hall vignette', 0.5, 0.25, clk);
});

/* 6. hzWires */
register('hzWires', 'src/11p_x2_horrorA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), dk = H.dark(c.sc.bg);
  var clk = H.bgClock(c, 'hzWires'), seed = H.p(P, 'seed', 1), n = Math.max(2, Math.round(H.p(P, 'n', 3)));
  var nb = Math.max(2, Math.round(H.p(P, 'birds', 6))), per = H.p(P, 'per', 24);
  var xa = W * H.p(P, 'x1', 0.15), xb = W * H.p(P, 'x2', 0.8), ya = Hh * H.p(P, 'y', 0.2), yb = ya + Hh * 0.05;
  var col = dk ? H.mixHex(c.sc.bg, c.sc.fg, 0.2) : H.mixHex(c.sc.bg, '#000000', 0.3), lw = Math.max(1.2, U * 0.0022), gapW = U * 0.034;
  [[xa, ya, 1], [xb, yb, 0.82]].forEach(function (pl, pi) {
    var px = pl[0], py = pl[1], k = pl[2];
    H.line(c, 'Pole post ' + pi, [[px, Hh + 4], [px, py - U * 0.04 * k]], col, U * 0.009 * k, 1);
    H.line(c, 'Pole arm A ' + pi, [[px - U * 0.07 * k, py], [px + U * 0.07 * k, py]], col, U * 0.005 * k, 1);
    H.line(c, 'Pole arm B ' + pi, [[px - U * 0.05 * k, py + gapW * 1.6 * k], [px + U * 0.05 * k, py + gapW * 1.6 * k]], col, U * 0.005 * k, 1);
  });
  var wires = [];
  for (var k = 0; k < n; k++) {
    var ox = (k - (n - 1) / 2) * gapW * 1.3, oy = (k % 2) * gapW * 1.6, sag = U * (0.07 + 0.025 * k);
    var p0 = [xa + ox, ya + oy], p1 = [xb + ox * 0.82, yb + oy * 0.82], cp = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + sag * 2];
    wires.push([p0, cp, p1]);
    var q0 = H.toScene(c, -W * 0.25, p0[1] - Hh * 0.02), c0 = H.toScene(c, (p0[0] - W * 0.25) / 2, p0[1] + sag * 1.2);
    var s0 = H.toScene(c, p0[0], p0[1]), sc = H.toScene(c, cp[0], cp[1]), s1 = H.toScene(c, p1[0], p1[1]);
    var c1 = H.toScene(c, (p1[0] + W * 1.3) / 2, p1[1] + sag * 1.4), q1 = H.toScene(c, W * 1.3, p1[1] + Hh * 0.03);
    C.shape(c.graph, c.cut, c.cut.id + ' / Wire ' + k, c.parent,
      [['M', q0[0], q0[1]], ['Q', c0[0], c0[1], s0[0], s0[1]], ['Q', sc[0], sc[1], s1[0], s1[1]], ['Q', c1[0], c1[1], q1[0], q1[1]]],
      { stroke: col, width: lw, alpha: 1 });
  }
  for (var b = 0; b < nb; b++) {
    (function (bi) {
      var last = bi === 0, off = last ? per * 0.92 : per * (0.12 + 0.66 * N.random(seed, bi, 1));
      var w = wires[Math.floor(N.random(seed, bi, 3) * Math.min(2, wires.length)) % wires.length];
      var fr = last ? 0.5 + (N.random(seed, 9) * 2 - 1) * 0.1 : 0.12 + 0.76 * N.random(seed, bi, 4), q = 1 - fr;
      var bx = q * q * w[0][0] + 2 * q * fr * w[1][0] + fr * fr * w[2][0];
      var by = q * q * w[0][1] + 2 * q * fr * w[1][1] + fr * fr * w[2][1], r = U * 0.009;
      var cmds = G.ellipse(0, r * 1.05, r * 0.75, r * 1.15).concat(G.ellipse((bi % 2 ? 1 : -1) * r * 0.3, r * 2.3, r * 0.5, r * 0.5));
      var bird = C.shape(c.graph, c.cut, c.cut.id + ' / Wire bird ' + bi, c.parent, cmds, { fill: col, alpha: 1 });
      c.graph.byId[bird].attrs.position = H.toScene(c, bx, by);
      V.animate(c, bird, function (e, f) {
        var cyc = wrap(clk.time(f), per), fi = clk.enter(f, 0.8);
        return { alpha: cl((cyc - N.random(seed, bi, 2) * 0.6) / 0.3) * (cyc > off ? 0 : 1) * fi };
      });
    })(b);
  }
  vign(c, 'Wires vignette', 0.3, 0.38, clk);
});

/* ================================================================ KINETIC (src/11p_x2_kineticA.js) */

/* 7. kzKickStreaks */
register('kzKickStreaks', 'src/11p_x2_kineticA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), D = Math.hypot(W, Hh);
  var clk = H.bgClock(c, 'kzKickStreaks'), seed = H.p(P, 'seed', 1), n = Math.max(4, Math.round(H.p(P, 'n', 14)));
  var k = H.p(P, 'k', 0.08), rig = c.graph.add('null', c.cut.id + ' / Kick streaks rig', c.parent, c.cut.start, c.cut.end,
    { rotation: -H.p(P, 'ang', 0) });
  var cutIdx = Math.max(0, c.assembly.cuts.findIndex(function (row) { return row.id === c.cut.id; }));
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var dep = 0.5 + N.random(seed, idx, 1), baseLen = D * (0.08 + 0.2 * N.random(seed, idx, 2));
      var th = Math.max(2, U * (0.004 + 0.02 * N.random(seed, idx, 3) * N.random(seed, idx, 6)));
      var xOff = N.random(seed, idx, 4) * (D + baseLen), y = (N.random(seed, idx, 5) - 0.5) * D;
      var col = idx % 6 === 2 ? c.sc.accent : c.sc.fg;
      var a = idx % 6 === 2 ? k * 1.3 : k * (0.6 + 0.7 * N.random(seed, idx, 7));
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Kick streak ' + idx, rig, G.rect(0, -th / 2, baseLen, th), { fill: col, alpha: a });
      V.animate(c, id, function (e, f) {
        var lt = Math.max(0, e.t), trav = clk.absTime(f) * 0.05 + 0.3 * (cutIdx + 1 - Math.exp(-lt * 5));
        var len = baseLen * (1 + 0.8 * Math.exp(-lt * 5));
        var x = wrap(xOff + trav * dep * D, D + len) - len - D / 2;
        return { 'position.x': x, 'position.y': -y, 'scale.x': len / baseLen, alpha: a * clk.enter(f, 0.6) };
      });
    })(i);
  }
});

/* 8. kzRollSquare */
register('kzRollSquare', 'src/11p_x2_kineticA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'kzRollSquare'), dir = H.p(P, 'dir', 1), per = H.p(P, 'per', 3), k = H.p(P, 'k', 0.045);
  var fl = Hh * 0.9, seed = H.p(P, 'seed', 1);
  var flId = H.rect(c, 'Roll floor', 0, fl, W, Math.max(2, U * 0.003), { fill: c.sc.fg, alpha: k * 1.6 });
  V.animate(c, flId, function (e, f) { return { alpha: k * 1.6 * clk.enter(f, 0.8) }; });
  function addSquare(S0, sqPer, d, ph, fa, isAcc) {
    var x0 = d > 0 ? -S0 : 0, cmds = G.rect(x0, 0, S0, S0);
    var fill = C.shape(c.graph, c.cut, c.cut.id + ' / Roll fill ' + (isAcc ? '2' : '1'), c.parent, cmds,
      { fill: isAcc ? c.sc.accent : c.sc.fg, stroke: c.sc.fg, width: Math.max(2, U * 0.003), alpha: fa });
    var inner = C.shape(c.graph, c.cut, c.cut.id + ' / Roll inner ' + (isAcc ? '2' : '1'), c.parent,
      G.rect(x0 + S0 * 0.2, S0 * 0.2, S0 * 0.6, S0 * 0.6), { stroke: c.sc.fg, width: Math.max(2, U * 0.003), alpha: fa * 2.2 });
    [fill, inner].forEach(function (id, isIn) {
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f), q = clk.enter(f, 0.8), tt = t / sqPer + ph, st = Math.floor(tt);
        var fr = cl((tt - st) / 0.82), a = 90 * Math.pow(fr, 2.3), span = Math.ceil((W + S0 * 2) / S0) * S0;
        var px = wrap((st + 2 + Math.floor(ph * 2)) * S0, span) - S0, x = d > 0 ? px : W - px;
        var pos = H.toScene(c, x, fl);
        return { 'position.x': pos[0], 'position.y': pos[1], rotation: -(a * d), alpha: (isIn ? fa * 2.2 : fa) * q };
      });
    });
  }
  if (P.two) addSquare(U * 0.26, per * 0.55, -dir, (seed % 97) / 97, k * 0.9, true);
  addSquare(U * H.p(P, 's', 0.58), per, dir, (seed % 53) / 53, k, false);
});

/* 9. kzBounceDiscs */
register('kzBounceDiscs', 'src/11p_x2_kineticA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'kzBounceDiscs'), seed = H.p(P, 'seed', 1), n = Math.max(2, Math.round(H.p(P, 'n', 3)));
  var k = H.p(P, 'k', 0.05), dir = H.p(P, 'dir', 1), fl = Hh * 0.97;
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var r = U * (0.1 + 0.16 * N.random(seed, idx, 1)), Tb = 1.7 + 1.3 * N.random(seed, idx, 2) + r / U * 2;
      var ph = N.random(seed, idx, 3), hgt = Hh * (0.35 + 0.4 * N.random(seed, idx, 4));
      var vx = (0.03 + 0.03 * N.random(seed, idx, 5)) * dir * (idx % 2 ? 1 : -0.7), x0 = N.random(seed, idx, 6) * (W + r * 2);
      var shd = C.shape(c.graph, c.cut, c.cut.id + ' / Bounce shadow ' + idx, c.parent,
        G.ellipse(0, 0, r, r * 0.07), { fill: c.sc.fg, alpha: k * 0.7 });
      var disc = C.shape(c.graph, c.cut, c.cut.id + ' / Bounce disc ' + idx, c.parent,
        G.ellipse(0, 0, r, r), { fill: idx === 1 ? c.sc.accent : c.sc.fg, alpha: k });
      V.animate(c, shd, function (e, f0) {
        var t = clk.absTime(f0), q = clk.enter(f0, 0.8), f = wrap(t / Tb + ph, 1), h = hgt * 4 * f * (1 - f);
        var x = wrap(x0 + t * vx * W, W + r * 2) - r, pos = H.toScene(c, x, fl);
        return { 'position.x': pos[0], 'position.y': pos[1], 'scale.x': 1.1 - 0.5 * h / hgt, alpha: k * 0.7 * (1 - h / hgt * 0.8) * q };
      });
      V.animate(c, disc, function (e, f0) {
        var t = clk.absTime(f0), q = clk.enter(f0, 0.8), f = wrap(t / Tb + ph, 1), h = hgt * 4 * f * (1 - f);
        var near = Math.exp(-Math.min(f, 1 - f) * Tb * 14), sq = 0.16 * near;
        var x = wrap(x0 + t * vx * W, W + r * 2) - r, pos = H.toScene(c, x, fl - r * (1 - sq) - h);
        return { 'position.x': pos[0], 'position.y': pos[1], 'scale.x': 1 + sq * 0.7, 'scale.y': 1 - sq, alpha: k * q };
      });
    })(i);
  }
});

/* 10. kzRockHorizon */
register('kzRockHorizon', 'src/11p_x2_kineticA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh), D = Math.hypot(W, Hh);
  var clk = H.bgClock(c, 'kzRockHorizon'), k = H.p(P, 'k', 0.05), w = TAU / H.p(P, 'per', 6), ph = (H.p(P, 'seed', 1) % 100) / 100 * TAU;
  var amp = H.p(P, 'amp', 5), yPos = Hh * H.p(P, 'y', 0.66);
  var rig = c.graph.add('null', c.cut.id + ' / Rocking horizon', c.parent, c.cut.start, c.cut.end,
    { position: H.toScene(c, W / 2, yPos) });
  V.animate(c, rig, function (e, f) {
    return { rotation: -(amp * Math.sin(clk.absTime(f) * w + ph)), alpha: clk.enter(f, 0.8) };
  });
  C.shape(c.graph, c.cut, c.cut.id + ' / Horizon slab', rig, G.rect(-D, -D, D * 2, D), { fill: c.sc.fg, alpha: k });
  C.shape(c.graph, c.cut, c.cut.id + ' / Horizon rim', rig, G.rect(-D, -Math.max(2, U * 0.003), D * 2, Math.max(2, U * 0.003)), { fill: c.sc.fg, alpha: k * 2.2 });
  C.shape(c.graph, c.cut, c.cut.id + ' / Horizon sub', rig, G.rect(-D, -U * 0.03, D * 2, Math.max(1.5, U * 0.0015)), { fill: c.sc.fg, alpha: k * 1.2 });
  C.shape(c.graph, c.cut, c.cut.id + ' / Horizon fulcrum', c.parent,
    [['M', 0, Hh / 2 - yPos], ['L', -U * 0.05, Hh / 2 - (yPos + U * 0.085)], ['L', U * 0.05, Hh / 2 - (yPos + U * 0.085)], ['Z']],
    { fill: c.sc.fg, alpha: k * 1.6 });
  if (P.ball !== false) {
    var r = U * 0.055;
    var ball = C.shape(c.graph, c.cut, c.cut.id + ' / Horizon ball', rig, G.ellipse(0, 0, r, r), { fill: c.sc.accent, alpha: k * 1.5 });
    var spoke = C.shape(c.graph, c.cut, c.cut.id + ' / Horizon ball spoke', rig,
      [['M', 0, 0], ['L', r, 0]], { stroke: c.sc.bg, width: Math.max(2, U * 0.003), alpha: 0.5 });
    [ball, spoke].forEach(function (id, isSpoke) {
      V.animate(c, id, function (e, f) {
        var sx = -W * 0.36 * Math.cos(clk.absTime(f) * w + ph);
        return isSpoke ? { 'position.x': sx, 'position.y': r, rotation: -(sx / r / DEG) }
          : { 'position.x': sx, 'position.y': r };
      });
    });
  }
});

/* 11. kzBigGears */
register('kzBigGears', 'src/11p_x2_kineticA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'kzBigGears'), k = H.p(P, 'k', 0.04), spd = H.p(P, 'spd', 4);
  var nA = Math.max(8, Math.round(H.p(P, 'nA', 18))), nB = Math.round(nA * 0.6), nC = Math.round(nA * 0.42);
  var rig = c.graph.add('null', c.cut.id + ' / Gears rig', c.parent, c.cut.start, c.cut.end,
    { 'scale.x': P.flip ? -1 : 1 });
  function addGear(name, cx, cy, R, n, fa, rotFn) {
    var m = R * Math.PI / n * 0.55, st = TAU / n, cmds = [];
    for (var i = 0; i < n; i++) {
      var a = i * st;
      [[a - st * 0.18, R + m], [a + st * 0.18, R + m], [a + st * 0.32, R - m], [a + st * 0.68, R - m]].forEach(function (qp, j) {
        cmds.push([(i || j) ? 'L' : 'M', Math.cos(qp[0]) * qp[1], -Math.sin(qp[0]) * qp[1]]);
      });
    }
    cmds.push(['Z']);
    cmds = cmds.concat(G.ellipse(0, 0, R * 0.72, R * 0.72));
    for (var s = 0; s < 4; s++) {
      var as = s * TAU / 4;
      cmds.push(['M', Math.cos(as) * R * 0.3, -Math.sin(as) * R * 0.3], ['L', Math.cos(as) * R * 0.72, -Math.sin(as) * R * 0.72]);
    }
    var id = C.shape(c.graph, c.cut, c.cut.id + ' / ' + name, rig, cmds,
      { fill: c.sc.fg, stroke: c.sc.fg, width: Math.max(2, U * 0.003), alpha: fa });
    c.graph.byId[id].attrs.position = H.toScene(c, cx, cy);
    V.animate(c, id, function (e, f) { return { rotation: -rotFn(clk.absTime(f)), alpha: fa * clk.enter(f, 0.8) }; });
  }
  var RA = U * 0.5, RB = RA * nB / nA, RC = RA * nC / nA, ax = W * 0.1, ay = Hh * 0.9, phi = H.p(P, 'ang', -35) * DEG;
  var bx = ax + Math.cos(phi) * (RA + RB), by = ay + Math.sin(phi) * (RA + RB);
  var cx = bx + Math.cos(phi - 1.15) * (RB + RC), cy = by + Math.sin(phi - 1.15) * (RB + RC);
  addGear('Gear A', ax, ay, RA, nA, k, function (t) { return t * spd; });
  addGear('Gear B', bx, by, RB, nB, k * 1.15, function (t) { return (phi / DEG + 180 + 180 / nB - (t * spd - phi / DEG) * nA / nB); });
  addGear('Gear C', cx, cy, RC, nC, k * 0.9, function (t) {
    var thB = phi + Math.PI + Math.PI / nB - (t * spd * DEG - phi) * nA / nB;
    return ((phi - 1.15) + Math.PI + Math.PI / nC - (thB - (phi - 1.15)) * nB / nC) / DEG;
  });
});

/* 12. kzSqueezeLines */
register('kzSqueezeLines', 'src/11p_x2_kineticA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'kzSqueezeLines'), vert = P.vert !== false, L = vert ? W : Hh;
  var n = Math.max(12, Math.round(H.p(P, 'n', 36))), k = H.p(P, 'k', 0.12), lam = L * H.p(P, 'lam', 0.7);
  var amp = lam / TAU * 0.78, lw = Math.max(2, U * 0.0035), per = H.p(P, 'per', 5);
  for (var i = -2; i < n + 2; i++) {
    (function (idx) {
      var x0 = (idx + 0.5) / n * L, hot = wrap(idx, 9) === 4;
      var col = hot ? c.sc.accent : c.sc.fg, aBase = hot ? k * 1.3 : k;
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Squeeze line ' + idx, c.parent,
        vert ? G.rect(-lw / 2, -Hh / 2, lw, Hh) : G.rect(-W / 2, -lw / 2, W, lw), { fill: col, alpha: aBase });
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f) / per, q = clk.enter(f, 0.6), ph = TAU * (x0 / lam - t);
        var x = x0 + amp * Math.sin(ph), dens = 1 - 0.78 * Math.cos(ph);
        var a = (hot ? k * 1.3 : k * (0.55 + 0.25 * dens)) * q;
        return vert ? { 'position.x': x - W / 2, alpha: a } : { 'position.y': Hh / 2 - x, alpha: a };
      });
    })(i);
  }
});

/* ================================================================ TYPOGRAPHY (src/11p_x2_typoA.js) */

/* 13. tzBgBaseGrid */
register('tzBgBaseGrid', 'src/11p_x2_typoA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, M = Math.min(W, Hh);
  var clk = H.bgClock(c, 'tzBgBaseGrid'), rows = Math.max(8, Math.round(H.p(P, 'rows', 26)));
  var every = Math.max(2, Math.round(H.p(P, 'every', 4))), drift = H.p(P, 'drift', 6), k = H.p(P, 'k', 0.12);
  var g = Math.max(W, Hh) / rows, mx = P.right ? W * 0.92 : W * 0.08, fs = Math.max(9, M * 0.013), lw = Math.max(1, M * 0.0014);
  var nLines = Math.min(60, Math.ceil(Hh / g) + every * 2), minor = [], major = [];
  for (var i = -every; i < nLines; i++) {
    var y = -i * g;
    if (wrap(i, every) === 0) major.push(['M', -W / 2, y], ['L', W / 2, y]);
    else minor.push(['M', -W / 2, y], ['L', W / 2, y]);
  }
  var gRig = c.graph.add('null', c.cut.id + ' / Base grid rig', c.parent, c.cut.start, c.cut.end,
    { position: [0, Hh / 2] });
  if (minor.length) {
    var mi = C.shape(c.graph, c.cut, c.cut.id + ' / Base grid minor', gRig, minor, { stroke: c.sc.fg, width: lw, alpha: k });
    V.animate(c, mi, function (e, f) { return { alpha: k * clk.enter(f, 0.8) }; });
  }
  if (major.length) {
    var mj = C.shape(c.graph, c.cut, c.cut.id + ' / Base grid major', gRig, major, { stroke: c.sc.fg, width: lw, alpha: k * 1.8 });
    V.animate(c, mj, function (e, f) { return { alpha: k * 1.8 * clk.enter(f, 0.8) }; });
  }
  V.animate(c, gRig, function (e, f) {
    var scroll = clk.absTime(f) * drift * M / 1080;
    return { 'position.y': Hh / 2 - wrap(scroll, every * g) };
  });
  var rule = H.line(c, 'Base grid margin rule', [[mx, 0], [mx, Hh]], c.sc.accent, lw, k * 2.4);
  V.animate(c, rule, function (e, f) { return { alpha: k * 2.4 * clk.enter(f, 0.8) }; });
  if (P.nums !== false) {
    for (var j = 0; j < nLines; j += every) {
      (function (rj) {
        H.addText(c, 'Base grid num ' + rj, pad2(rj), mx + (P.right ? 1 : -1) * fs * 0.7, rj * g - fs * 0.9, fs,
          { role: 'mono', align: P.right ? 'left' : 'right', color: c.sc.fg, alpha: k * 2.6, parent: gRig },
          function (e, f) { return { alpha: k * 2.6 * clk.enter(f, 0.8) }; });
      })(j);
    }
  }
});

/* 14. tzBgNumField */
register('tzBgNumField', 'src/11p_x2_typoA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, M = Math.min(W, Hh);
  var clk = H.bgClock(c, 'tzBgNumField'), seed = H.p(P, 'seed', 1), fs = M * H.p(P, 'fs', 0.018);
  var rh = fs * 2.5, k = H.p(P, 'k', 0.085), rows = Math.min(28, Math.ceil(Hh / rh) + 1), cols = Math.min(24, Math.ceil(W / (fs * 2.4)) + 1);
  for (var j = 0; j < rows; j++) {
    (function (rj) {
      var str = '';
      for (var i = 0; i < cols; i++) {
        str += pad2(Math.floor(N.random(seed, i, rj, 3) * 100)) + '  ';
      }
      var rowCol = rj === Math.floor(rows * 0.4) && P.band !== false ? c.sc.fg : c.sc.fg;
      var baseA = k * (0.75 + 0.5 * N.random(seed, rj, 5));
      H.addText(c, 'Num field row ' + rj, str, fs * 0.6 - (rj % 2) * fs * 1.1, (rj + 0.5) * rh, fs,
        { role: 'mono', align: 'left', color: rowCol, alpha: baseA },
        function (e, f) {
          var t = clk.absTime(f), q = clk.enter(f, 0.8);
          var hot = P.band !== false ? Math.floor(t * 0.4 + N.random(seed, 7) * rows) % rows : -1;
          return { alpha: (rj === hot ? k * 2.1 : baseA) * q };
        });
    })(j);
  }
});

/* 15. tzBgColumns */
register('tzBgColumns', 'src/11p_x2_typoA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, M = Math.min(W, Hh);
  var clk = H.bgClock(c, 'tzBgColumns'), n = Hh > W ? Math.max(3, Math.round(H.p(P, 'cols', 6) / 2)) : Math.max(3, Math.round(H.p(P, 'cols', 6)));
  var k = H.p(P, 'k', 0.042), step = H.p(P, 'step', 2.2), mx = W * 0.05, gut = M * 0.016;
  var cw = (W - mx * 2 - (n - 1) * gut) / n, y0 = Hh * 0.045, y1 = Hh * 0.955, fs = Math.max(9, M * 0.011), lw = Math.max(1, M * 0.001);
  for (var i = 0; i < n; i++) {
    (function (ci) {
      var x = mx + ci * (cw + gut), evenFill = (P.fill !== false && ci % 2 === 0) ? k * 0.55 : 0;
      var colBox = H.rect(c, 'Column fill ' + ci, x, y0, cw, y1 - y0, { fill: c.sc.fg, alpha: Math.max(0.01, k * 0.9) });
      V.animate(c, colBox, function (e, f) {
        var tt = clk.absTime(f) / step, act = Math.floor(tt) % n, pulse = Math.sin(Math.PI * (tt % 1));
        var q = clk.enter(f, 0.9), a = (evenFill + (ci === act ? k * 0.9 * pulse : 0)) * q;
        return { 'scale.y': Math.max(0.01, q), alpha: a };
      });
      var edgeL = H.line(c, 'Column L ' + ci, [[x, y0], [x, y1]], c.sc.fg, lw, k * 2.2);
      var edgeR = H.line(c, 'Column R ' + ci, [[x + cw, y0], [x + cw, y1]], c.sc.fg, lw, k * 2.2);
      [edgeL, edgeR].forEach(function (id) { V.animate(c, id, function (e, f) { return { alpha: k * 2.2 * clk.enter(f, 0.9) }; }); });
      if (P.nums !== false) {
        H.addText(c, 'Col num ' + ci, pad2(ci + 1), x + fs * 0.4, y0 + fs * 1.1, fs,
          { role: 'mono', align: 'left', color: c.sc.fg, alpha: k * 4 },
          function (e, f) { return { alpha: k * 4 * clk.enter(f, 0.9) }; });
      }
    })(i);
  }
  var rTop = H.line(c, 'Col rule top', [[0, y0], [W, y0]], c.sc.accent, lw, k * 2.6);
  var rBot = H.line(c, 'Col rule bot', [[0, y1], [W, y1]], c.sc.accent, lw, k * 2.6);
  [rTop, rBot].forEach(function (id) { V.animate(c, id, function (e, f) { return { alpha: k * 2.6 * clk.enter(f, 0.9) }; }); });
});

/* 16. tzBgBigDigits */
register('tzBgBigDigits', 'src/11p_x2_typoA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height;
  var clk = H.bgClock(c, 'tzBgBigDigits'), k = H.p(P, 'k', 0.065), side = H.p(P, 'side', 1);
  var txt = P.what === 'sec' ? pad2(Math.floor(clk.absTime(c.cut.start))) : pad2(((c.cut.line | 0) + 1) % 100);
  var size = Math.max(W, Hh) * 0.6, yBase = Hh * (P.low !== false ? 0.62 : 0.4), isOut = P.outline !== false;
  var aBase = isOut ? Math.min(0.24, k * 2.4) : k;
  return H.addText(c, 'Big digits', txt, W / 2 + side * W * 0.2, yBase, size, {
    role: P.font || 'display', align: 'center', color: c.sc.fg, fill: !isOut, stroke: isOut,
    strokeColor: c.sc.fg, strokeWidth: Math.max(2, size * 0.004), alpha: aBase
  }, function (e, f) {
    var q = clk.enter(f, 0.7), roll = 1 - E.outExpo(clk.time(f) / 0.8);
    return { 'position.y': Hh / 2 - (yBase + roll * size * 0.16), alpha: aBase * q };
  });
});

/* 17. tzBgGlyphField */
register('tzBgGlyphField', 'src/11p_x2_typoA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, M = Math.min(W, Hh);
  var clk = H.bgClock(c, 'tzBgGlyphField'), raw = (c.cut.lineText || (c.cut.nodes[0] && c.cut.nodes[0].text) || '');
  var arr = Array.from(String(raw).replace(/\s+/g, '')).slice(0, 18);
  if (!arr.length) return null;
  var fs = M * H.p(P, 'fs', 0.036), rowH = fs * 2.3, v = H.p(P, 'v', 12) * M / 1080, k = H.p(P, 'k', 0.07);
  var unit = arr.join(' ') + ' ', unitW = Math.max(fs * 2, unit.length * fs * 0.72), rep = unit + unit + unit;
  var rows = Math.min(18, Math.ceil(Hh / rowH) + 1);
  for (var j = 0; j < rows; j++) {
    (function (rj) {
      var dir = rj % 2 ? 1 : -1, off0 = rj * fs * 1.37 + N.random(H.p(P, 'seed', 1), rj) * unitW;
      H.addText(c, 'Glyph field row ' + rj, rep, W / 2, (rj + 0.5) * rowH, fs,
        { role: P.font || 'body', align: 'center', color: c.sc.fg, alpha: k },
        function (e, f) {
          var off = wrap(clk.absTime(f) * v * dir + off0, unitW) - unitW / 2;
          return { 'position.x': off, alpha: k * clk.enter(f, 0.9) };
        });
    })(j);
  }
});

/* 18. tzBgRules */
register('tzBgRules', 'src/11p_x2_typoA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, u = Math.min(W, Hh) / 1080;
  var clk = H.bgClock(c, 'tzBgRules'), seed = H.p(P, 'seed', 1), n = Math.max(3, Math.round(H.p(P, 'n', 7)));
  var k = H.p(P, 'k', 0.12), lw = Math.max(1, u * 1.5);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var y = Hh * (0.07 + 0.86 * (idx + 0.5) / n) + (N.random(seed, idx, 1) * 2 - 1) * Hh * 0.025;
      var kind = Math.floor(N.random(seed, idx, 2) * 4), fromL = N.random(seed, idx, 3) < 0.5;
      var freq = 0.12 + 0.2 * N.random(seed, idx, 4), ph = N.random(seed, idx, 5) * TAU;
      var col = idx === (seed % n) ? c.sc.accent : c.sc.fg, xa = fromL ? 0 : W, dir = fromL ? 1 : -1;
      var cmds = [];
      if (kind === 0) cmds = [['M', 0, 0], ['L', dir * W, 0]];
      else if (kind === 1) cmds = [['M', 0, 3 * u], ['L', dir * W, 3 * u], ['M', 0, -3 * u], ['L', dir * W, -3 * u]];
      else if (kind === 2) cmds = G.rect(fromL ? 0 : -W, 2 * u, W, lw * 3).concat([['M', 0, -3.5 * u], ['L', dir * W, -3.5 * u]]);
      else {
        var step = lw * 6.1;
        for (var dx = 0; dx < W; dx += step) cmds.push(['M', dir * dx, 0], ['L', dir * (dx + lw * 1.6), 0]);
      }
      var rule = C.shape(c.graph, c.cut, c.cut.id + ' / Typo rule ' + idx, c.parent, cmds,
        kind === 2 ? { fill: col, stroke: col, width: lw, alpha: k } : { stroke: col, width: lw, alpha: k });
      c.graph.byId[rule].attrs.position = H.toScene(c, xa, y);
      var tick = C.shape(c.graph, c.cut, c.cut.id + ' / Rule tick ' + idx, c.parent,
        [['M', 0, -7 * u], ['L', 0, 7 * u]], { stroke: col, width: lw, alpha: k });
      V.animate(c, rule, function (e, f) {
        var fi = E.outExpo(clk.time(f) / 1.1);
        var len = (0.22 + 0.62 * (0.5 + 0.5 * Math.sin(clk.absTime(f) * freq + ph))) * fi;
        return { 'scale.x': Math.max(0.01, len) };
      });
      V.animate(c, tick, function (e, f) {
        var fi = E.outExpo(clk.time(f) / 1.1);
        var len = W * (0.22 + 0.62 * (0.5 + 0.5 * Math.sin(clk.absTime(f) * freq + ph))) * fi;
        var pos = H.toScene(c, xa + dir * len, y);
        return { 'position.x': pos[0], 'position.y': pos[1] };
      });
    })(i);
  }
});

/* ================================================================ WA / TRADITIONAL (src/11p_x2_waA.js) */

/* 19. wzBgShippo */
register('wzBgShippo', 'src/11p_x2_waA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'wzBgShippo'), r = Math.max(U * H.p(P, 'r', 0.08), 46), k = H.p(P, 'k', 0.08), dx = H.p(P, 'dx', 1);
  var ni = Math.ceil(W / r) + 4, nj = Math.ceil(Hh / r) + 4, ringCmds = [], knotCmds = [];
  for (var j = -2; j < nj; j++) {
    for (var i = -2; i < ni; i++) {
      if ((i + j) & 1) continue;
      var cx = i * r - W / 2, cy = Hh / 2 - j * r;
      ringCmds = ringCmds.concat(G.ellipse(cx, cy, r, r));
      knotCmds = knotCmds.concat(G.ellipse(cx, cy, r * 0.16, r * 0.16));
    }
  }
  var rings = C.shape(c.graph, c.cut, c.cut.id + ' / Shippo circles', c.parent, ringCmds,
    { stroke: c.sc.fg, width: Math.max(1.2, r * 0.035), alpha: k });
  var knots = C.shape(c.graph, c.cut, c.cut.id + ' / Shippo knots', c.parent, knotCmds,
    { fill: P.acc ? c.sc.accent : c.sc.fg, alpha: k * 1.2 });
  [rings, knots].forEach(function (id, isKnot) {
    V.animate(c, id, function (e, f) {
      var t = clk.absTime(f), q = clk.enter(f, 0.7);
      var ox = wrap(t * r * 0.1 * dx, 2 * r) - 2 * r, oy = wrap(t * r * 0.06, 2 * r) - 2 * r;
      var pulse = isKnot ? (0.85 + 0.25 * Math.sin(t * 0.9)) : 1;
      return { 'position.x': ox, 'position.y': -oy, alpha: (isKnot ? k * 1.2 * pulse : k) * q };
    });
  });
});

/* 20. wzBgSayagata */
register('wzBgSayagata', 'src/11p_x2_waA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'wzBgSayagata'), q = Math.max(U * H.p(P, 'q', 0.017), 10), k = H.p(P, 'k', 0.07), dir = H.p(P, 'dir', 1);
  var rot = P.rot == null ? 45 : P.rot, ax = 6 * q, ay = -4 * q, bx = 4 * q, by = 6 * q;
  var rad = Math.hypot(W, Hh) / 2 + q * 4, Nmax = Math.min(20, Math.ceil(rad / (q * 7.2)) + 2), cmds = [];
  for (var i = -Nmax; i <= Nmax; i++) {
    for (var j = -Nmax; j <= Nmax; j++) {
      var cx = i * ax + j * bx, cy = i * ay + j * by;
      if (Math.hypot(cx, cy) > rad * 1.25) continue;
      for (var a = 0, ux = 0, uy = -1; a < 4; a++) {
        var vx = -uy, vy = ux;
        cmds.push(['M', cx, -cy], ['L', cx + ux * 2 * q, -(cy + uy * 2 * q)],
          ['L', cx + (ux * 2 + vx * 3) * q, -(cy + (uy * 2 + vy * 3) * q)]);
        ux = vx; uy = vy;
      }
    }
  }
  var rig = c.graph.add('null', c.cut.id + ' / Sayagata rig', c.parent, c.cut.start, c.cut.end, { rotation: -rot });
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Sayagata fret', rig, cmds,
    { stroke: c.sc.fg, width: Math.max(1.5, q * 0.3), alpha: k });
  V.animate(c, id, function (e, f) {
    var t = clk.absTime(f), fr = wrap(t * 0.03 * dir, 1), fi = clk.enter(f, 0.9);
    return { 'position.x': fr * ax, 'position.y': -fr * ay, alpha: k * fi * (0.85 + 0.15 * Math.sin(t * 0.7)) };
  });
});

/* 21. wzBgTatewaku */
register('wzBgTatewaku', 'src/11p_x2_waA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'wzBgTatewaku'), d = Math.max(U * H.p(P, 'd', 0.12), 56), k = H.p(P, 'k', 0.095);
  var dir = H.p(P, 'dir', 1), Am = d * 0.25, perY = d * 2.8, kk = TAU / perY, n = Math.min(40, Math.ceil(W / d) + 2);
  var nCycles = Math.ceil(Hh / perY) + 3, st = perY / 24, cmds = [];
  for (var i = 0; i < n; i++) {
    var sg = i % 2 ? -1 : 1, x0 = (i - 0.5) * d;
    for (var y = -perY, g = 0; y <= nCycles * perY && g <= 160; y += st, g++) {
      var x = x0 + sg * Am * Math.sin(y * kk);
      cmds.push([g ? 'L' : 'M', x - W / 2, Hh / 2 - y]);
    }
  }
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Tatewaku lines', c.parent, cmds,
    { stroke: c.sc.fg, width: Math.max(1.5, d * 0.03), alpha: k });
  V.animate(c, id, function (e, f) {
    var t = clk.absTime(f), q = clk.enter(f, 0.9), sh = wrap(-t * 0.4 * dir / kk, perY);
    return { 'position.y': Hh / 2 - sh - (Hh / 2), alpha: k * q };
  });
  if (P.dots) {
    var dotCmds = [];
    for (var ci = 0; ci < n; ci++) {
      var sg2 = ci % 2 ? -1 : 1, xd = ci * d - W / 2, y0 = (sg2 > 0 ? -Math.PI / 2 : Math.PI / 2) / kk;
      for (var yd = y0 - perY; yd < (nCycles + 1) * perY; yd += perY) {
        dotCmds = dotCmds.concat(G.ellipse(xd, Hh / 2 - yd, d * 0.085, d * 0.085));
      }
    }
    var dId = C.shape(c.graph, c.cut, c.cut.id + ' / Tatewaku dots', c.parent, dotCmds, { fill: c.sc.fg, alpha: k * 0.7 });
    V.animate(c, dId, function (e, f) {
      var t = clk.absTime(f), q = clk.enter(f, 0.9), sh = wrap(-t * 0.4 * dir / kk, perY);
      return { 'position.y': -sh, alpha: k * 0.7 * q * (0.8 + 0.2 * Math.sin(t * 0.9)) };
    });
  }
});

/* 22. wzBgRyusui */
register('wzBgRyusui', 'src/11p_x2_waA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'wzBgRyusui'), seed = H.p(P, 'seed', 1), n = Math.max(3, Math.round(H.p(P, 'n', 6)));
  var k = H.p(P, 'k', 0.095), dir = H.p(P, 'dir', 1), dy = U * 0.02;
  for (var b = 0; b < n; b++) {
    (function (bi) {
      var m = 3 + Math.floor(N.random(seed, bi, 1) * 3), base = Hh * (bi + 0.5) / n + (N.random(seed, bi, 2) * 2 - 1) * Hh * 0.04 - (m - 1) * dy / 2;
      var lam = U * (0.2 + 0.14 * N.random(seed, bi, 3)), Am = U * (0.02 + 0.02 * N.random(seed, bi, 4));
      var len = W * (0.55 + 0.4 * N.random(seed, bi, 5)), v = W * (0.012 + 0.018 * N.random(seed, bi, 6)) * dir;
      var span = W + len + U * 0.3, xOff = N.random(seed, bi, 7) * span;
      var col = P.acc && bi === 1 ? c.sc.accent : c.sc.fg, a = k * (0.7 + 0.5 * N.random(seed, bi, 8));
      var lw = Math.max(1.5, U * (0.003 + 0.002 * N.random(seed, bi, 9))), cmds = [];
      for (var j = 0; j < m; j++) {
        var xs = len * 0.3 * N.random(seed, bi, j, 10), xe = len * (1 - 0.3 * N.random(seed, bi, j, 11));
        for (var q = 0; q <= 36; q++) {
          var xx = mix(xs, xe, q / 36), yy = base + j * dy + Am * Math.sin(xx / lam + bi * 1.7) + Am * 0.35 * Math.sin(xx / lam * 2.1);
          cmds.push([q ? 'L' : 'M', xx, Hh / 2 - yy]);
        }
      }
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Ryusui bundle ' + bi, c.parent, cmds, { stroke: col, width: lw, alpha: a });
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f), q = clk.enter(f, 0.9), x0 = wrap(xOff + t * v, span) - len - U * 0.15;
        return { 'position.x': x0 - W / 2, alpha: a * q };
      });
    })(b);
  }
});

/* 23. wzBgYukiwa */
register('wzBgYukiwa', 'src/11p_x2_waA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'wzBgYukiwa'), seed = H.p(P, 'seed', 1), n = Math.min(16, Math.max(6, Math.round(H.p(P, 'n', 10))));
  var k = H.p(P, 'k', 0.07), lw = Math.max(1.5, U * 0.0042);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var R = U * (0.06 + 0.12 * N.random(seed, idx, 1) * N.random(seed, idx, 2)), span = Hh + R * 2.4;
      var xBase = W * ((idx + 0.5) / n + 0.3 * (N.random(seed, idx, 3) * 2 - 1)), yOff = N.random(seed, idx, 4) * span;
      var v = U * (0.006 + 0.01 * N.random(seed, idx, 5)), col = P.acc && idx % 4 === 1 ? c.sc.accent : c.sc.fg;
      var Npts = 72, cmds = [];
      for (var m = 0; m <= Npts; m++) {
        var th = m / Npts * TAU, u = (th / (TAU / 6)) % 1, d = Math.min(u, 1 - u) * (TAU / 6);
        var rad = R * (1 - 0.17 * Math.exp(-Math.pow(d / 0.075, 2)));
        cmds.push([m ? 'L' : 'M', Math.cos(th) * rad, -Math.sin(th) * rad]);
      }
      cmds.push(['Z']);
      if (R > U * 0.085) {
        for (var sp = 0; sp < 6; sp++) {
          var sa = sp / 6 * TAU;
          cmds.push(['M', Math.cos(sa) * R * 0.18, -Math.sin(sa) * R * 0.18], ['L', Math.cos(sa) * R * 0.6, -Math.sin(sa) * R * 0.6]);
        }
      }
      var isFill = idx % 3 === 0, paint = isFill ? { fill: col, alpha: k * 0.8 } : { stroke: col, width: lw, alpha: k * 1.5 };
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Yukiwa ' + idx, c.parent, cmds, paint);
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f), q = clk.enter(f, 0.9), sc = 0.8 + 0.2 * E.outCubic(clk.time(f) / 0.8 - idx * 0.03);
        var x = wrap(xBase + Math.sin(t * 0.25 + idx * 1.9) * U * 0.02, W + R * 2) - R;
        var y = wrap(yOff + t * v, span) - R * 1.2, pos = H.toScene(c, x, y);
        var rot = (idx % 2 ? -1 : 1) * t * 0.06 / DEG + idx * 57;
        return { 'position.x': pos[0], 'position.y': pos[1], 'scale.x': sc, 'scale.y': sc, rotation: -rot, alpha: paint.alpha * q };
      });
    })(i);
  }
});

/* 24. wzBgYagasuri */
register('wzBgYagasuri', 'src/11p_x2_waA.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'wzBgYagasuri'), d = Math.max(U * H.p(P, 'd', 0.1), 54), k = H.p(P, 'k', 0.05);
  var spd = H.p(P, 'spd', 0.012), ph = d * 0.85, nc = Math.min(28, Math.ceil(W / d) + 1), x00 = (W - nc * d) / 2;
  [0, 1].forEach(function (pass) {
    var cmds = [];
    for (var ci = pass; ci < nc; ci += 2) {
      var dir = ci % 2 ? -1 : 1, x0 = x00 + ci * d, xc = x0 + d / 2, sl = dir * d * 0.5;
      for (var y = -ph * 4; y < Hh + ph * 4; y += ph * 2) {
        [[x0 + 1, y], [xc - 1, y + sl], [xc - 1, y + sl + ph], [x0 + 1, y + ph]].forEach(function (pt, idx) {
          cmds.push([idx ? 'L' : 'M', pt[0] - W / 2, Hh / 2 - pt[1]]);
        });
        cmds.push(['Z']);
        [[x0 + d - 1, y], [xc + 1, y + sl], [xc + 1, y + sl + ph], [x0 + d - 1, y + ph]].forEach(function (pt, idx) {
          cmds.push([idx ? 'L' : 'M', pt[0] - W / 2, Hh / 2 - pt[1]]);
        });
        cmds.push(['Z']);
      }
    }
    var col = pass && P.acc ? c.sc.accent : c.sc.fg, a = pass ? k * 0.9 : k;
    var id = C.shape(c.graph, c.cut, c.cut.id + ' / Yagasuri pass ' + pass, c.parent, cmds, { fill: col, alpha: a });
    V.animate(c, id, function (e, f) {
      var dir = pass ? -1 : 1, q = clk.enter(f, 0.8);
      var off = wrap(dir * clk.absTime(f) * U * spd, ph * 2) + (1 - q) * dir * ph;
      return { 'position.y': -off, alpha: a * q };
    });
  });
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
