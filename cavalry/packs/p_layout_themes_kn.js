/* JIZURA Cavalry Pack: Kinetic Themes (14 kn* from kinetic1 + 15 kz* from x2_kineticA = 29 layouts). */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, DEG = H.DEG, TAU = H.TAU;

function reg(src, key, fn) {
  N.register('layout', key, {
    source: src + ' (' + key + ')',
    scope: 'cut',
    build: fn,
    differences: ['Native Cavalry text nodes and editable vector geometry matching ' + key + '.']
  });
}

function uMin(c) { return Math.min(c.comp.width, c.comp.height); }
function isPort(c) { return c.comp.height > c.comp.width * 1.08; }
function monoFont(c) { return H.layFontObj(c, 'mono'); }
function wordsOf(c, maxK) {
  var t = H.layText(c), n = H.layChars(t).length;
  var k = Math.max(1, Math.min(maxK || 4, n <= 3 ? n : Math.ceil(n / 3)));
  var arr = H.laySplitK(t, k);
  return arr.length ? arr : [t];
}
function envAlpha(c, d, len, mul) {
  var m = mul == null ? 1 : mul;
  return function (env, f) {
    return { a: cl(H.layTin(c, f, d || 0, len || 0.3, E.outCubic) * H.layTout(c, f) * m, 0, 1) };
  };
}

/* ==== kinetic1 (14 kn* layouts) ==== */

/* 1. knSlamStack: word slabs slamming down from top in heavy tight vertical tower */
reg('src/11p_kinetic1.js', 'knSlamStack', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = wordsOf(c, 4), k = ws.length, rowH = Math.min(Hh * 0.2, u * 0.16);
  var sz = Math.min(H.layFitSize(c, ws.join('\n'), W * 0.8, rowH * k * 0.85), rowH * 0.78);
  var specs = ws.map(function (w, i) {
    var y = Hh / 2 + (i - (k - 1) / 2) * rowH, d = i * 0.12;
    return {
      text: w, size: sz, x: W / 2, y: y, color: i === k - 1 ? sc.accent : sc.fg, mi: i * 2,
      animPlace: function (env) {
        var p = E.outExpo(cl((env.t - d) / 0.26));
        return { dy: -(1 - p) * Hh * 0.26, sy: 1 + (1 - p) * 0.35 };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 2. knQuarterTurn: sequential words slamming 90 degrees into aligned right-angle corner */
reg('src/11p_kinetic1.js', 'knQuarterTurn', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = wordsOf(c, 3), k = ws.length, sz = Math.min(u * 0.14, W * 0.68 / Math.max(3, Math.max.apply(null, ws.map(function (x) { return H.layChars(x).length; }))));
  var specs = ws.map(function (w, i) {
    var y = Hh / 2 + (i - (k - 1) / 2) * sz * 1.25;
    return {
      text: w, size: sz, x: W / 2, y: y, color: i % 2 ? sc.accent : sc.fg, mi: i * 2,
      animPlace: function (env) {
        var p = E.outBack(cl((env.t - i * 0.1) / 0.35), 1.3);
        return { rot: (1 - p) * (i % 2 ? 90 : -90) };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 3. knSwapCenter: split halves cross-swapping places across center pivot */
reg('src/11p_kinetic1.js', 'knSwapCenter', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length >= 4 ? 2 : 1);
  var sz = Math.min(H.layFitSize(c, ws[0], W * 0.72, Hh * 0.22), u * 0.16);
  var specs = ws.map(function (w, i) {
    var side = i === 0 ? -1 : 1, tgtY = Hh / 2 + side * sz * 0.72;
    return {
      text: w, size: sz, x: W / 2, y: tgtY, color: i === 0 ? sc.fg : sc.accent, mi: i * 2,
      animPlace: function (env) {
        var sw = E.inOutCubic(cl((env.t - 0.18) / 0.45));
        return { dx: Math.sin(sw * Math.PI) * side * W * 0.18, y: mix(Hh / 2 - side * sz * 0.72, tgtY, sw) };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 4. knZoomDive: deep camera-plunge sequence where words zoom forward toward viewer */
reg('src/11p_kinetic1.js', 'knZoomDive', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = wordsOf(c, 3), k = ws.length, sz = Math.min(u * 0.16, W * 0.74 / 5);
  var specs = ws.map(function (w, i) {
    var y = Hh / 2 + (i - (k - 1) / 2) * sz * 1.25;
    return {
      text: w, size: sz, x: W / 2, y: y, color: i === 0 ? sc.accent : sc.fg, mi: i * 2,
      animPlace: function (env) {
        var p = E.outExpo(cl((env.t - i * 0.09) / 0.4));
        return { s: Math.max(0.05, mix(2.2, 1, p)) };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 5. knFlowSnap: streaming horizontal phrase gliding then locking sharply onto baseline */
reg('src/11p_kinetic1.js', 'knFlowSnap', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = wordsOf(c, 4), k = ws.length, sz = Math.min(u * 0.12, W * 0.82 / Math.max(4, k * 2.4));
  H.line(c, 'Snap track', [[W * 0.1, Hh * 0.58], [W * 0.9, Hh * 0.58]], sc.accent, 2, 0.65);
  var specs = ws.map(function (w, i) {
    var tx = mix(W * 0.22, W * 0.78, k === 1 ? 0.5 : i / (k - 1));
    return {
      text: w, size: sz, x: tx, y: Hh / 2, color: i === k - 1 ? sc.accent : sc.fg, mi: i,
      animPlace: function (env) {
        var p = E.outExpo(cl((env.t - i * 0.06) / 0.36));
        return { x: mix(W * 1.05, tx, p) };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 6. knSeesaw: full-line lever beam balanced on central fulcrum tilting dynamically */
reg('src/11p_kinetic1.js', 'knSeesaw', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.layFlat(H.layText(c)), size = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.26), u * 0.15);
  var bw = W * 0.76, fy = Hh * 0.58;
  H.layPolyAt(c, 'Fulcrum', W / 2, fy + u * 0.04, [[W / 2, fy], [W / 2 - u * 0.035, fy + u * 0.06], [W / 2 + u * 0.035, fy + u * 0.06]], true, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0, 0.25));
  H.layRectAt(c, 'Seesaw beam', W / 2, fy, bw, 4, { fill: sc.fg, alpha: 0.85 }, function (env, f) {
    return { rot: Math.sin(env.t * 2.2) * 8, a: 0.85 * H.layTin(c, f, 0, 0.25) * H.layTout(c, f) };
  });
  H.laySetNodes(c, [{
    text: txt, size: size, x: W / 2, y: fy - size * 0.62, color: sc.fg,
    animPlace: function (env) { return { rot: Math.sin(env.t * 2.2) * 8 }; }
  }]);
});

/* 7. knTypeSlam: crisp typed glyphs punctuation-slammed by sliding bar block */
reg('src/11p_kinetic1.js', 'knTypeSlam', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), isPort(c) ? 6 : 10);
  var size = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.44, { font: monoFont(c) }), u * 0.16);
  H.layRectAt(c, 'Slam block', W / 2, Hh * 0.66, W * 0.68, Math.max(6, u * 0.015), { fill: sc.accent, alpha: 1 }, function (env, f) {
    var p = E.outExpo(cl(env.t / 0.35)) * H.layTout(c, f);
    return { sx: Math.max(0.01, p), a: p > 0.01 ? 1 : 0 };
  });
  H.laySetNodes(c, [{ text: txt, font: monoFont(c), size: size, x: W / 2, y: Hh * 0.46, color: sc.fg }]);
});

/* 8. knRhythmCuts: synced beat-cut word frames jumping between alternating plates */
reg('src/11p_kinetic1.js', 'knRhythmCuts', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = wordsOf(c, 3), k = ws.length, cols = [sc.accent, sc.ink || sc.fg, sc.fg];
  var specs = ws.map(function (w, i) {
    var x = mix(W * 0.28, W * 0.72, k === 1 ? 0.5 : i / (k - 1)), y = Hh / 2 + (i % 2 ? -Hh * 0.14 : Hh * 0.14);
    var fill = cols[i % cols.length], sz = Math.min(H.layFitSize(c, w, W * 0.42, Hh * 0.2), u * 0.14);
    H.layRRect(c, 'Beat plate ' + i, x - sz * 1.8, y - sz * 0.7, sz * 3.6, sz * 1.4, 4, { fill: fill, alpha: 0.92 }, envAlpha(c, i * 0.1, 0.2, 0.92));
    return { text: w, size: sz, x: x, y: y, color: H.textOn(fill, sc.bg, sc), mi: i * 3 };
  });
  H.laySetNodes(c, specs);
});

/* 9. knPathRide: glyphs traveling along a smooth oval orbital loop ribbon */
reg('src/11p_kinetic1.js', 'knPathRide', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var rx = W * 0.36, ry = Hh * 0.24, pts = [];
  for (var i = 0; i <= 40; i++) {
    var a = i / 40 * TAU;
    pts.push([W / 2 + Math.cos(a) * rx, Hh / 2 + Math.sin(a) * ry]);
  }
  H.line(c, 'Loop path', pts, sc.sub, 2, 0.55);
  var chars = H.layChars(H.layText(c)), n = chars.length, sz = Math.min(u * 0.12, W * 0.65 / Math.max(2, n));
  var specs = chars.map(function (ch, idx) {
    var a0 = mix(-Math.PI * 0.85, -Math.PI * 0.15, n === 1 ? 0.5 : idx / (n - 1));
    return {
      text: ch, size: sz, x: W / 2 + Math.cos(a0) * rx, y: Hh / 2 + Math.sin(a0) * ry,
      color: idx === 0 ? sc.accent : sc.fg, mi: idx,
      animPlace: function (env) {
        var a = a0 + Math.sin(env.t * 1.2) * 0.18;
        return { x: W / 2 + Math.cos(a) * rx, y: Hh / 2 + Math.sin(a) * ry };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 10. knGearWords: interlocking toothed gears rotating in opposing phase */
reg('src/11p_kinetic1.js', 'knGearWords', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = wordsOf(c, 2), r = Math.min(W * 0.22, Hh * 0.26);
  var specs = ws.map(function (w, i) {
    var gx = W / 2 + (ws.length === 1 ? 0 : (i - 0.5) * r * 1.9), gy = Hh / 2;
    H.layCircleAt(c, 'Gear ring ' + i, gx, gy, r, r, { stroke: i === 0 ? sc.accent : sc.sub, width: Math.max(4, u * 0.01), alpha: 0.7 }, function (env, f) {
      return { rot: env.t * (i % 2 ? -40 : 40), a: 0.7 * H.layTin(c, f, 0, 0.3) * H.layTout(c, f) };
    });
    var sz = Math.min(H.layFitSize(c, w, r * 1.5, r * 0.9), r * 0.45);
    return { text: w, size: sz, x: gx, y: gy, color: sc.fg, mi: i * 2 };
  });
  H.laySetNodes(c, specs);
});

/* 11. knCollide: left & right halves rushing inward to impact at center seam */
reg('src/11p_kinetic1.js', 'knCollide', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length >= 2 ? 2 : 1);
  var sz = Math.min(H.layFitSize(c, H.layFlat(H.layText(c)), W * 0.8, Hh * 0.3), u * 0.16);
  var m0 = H.layMeasure(c, ws[0], sz).w, m1 = ws[1] ? H.layMeasure(c, ws[1], sz).w : 0;
  var gap = u * 0.025, cx0 = W / 2 - (ws[1] ? (m1 / 2 + gap / 2) : 0);
  var specs = [{
    text: ws[0], size: sz, x: cx0, y: Hh / 2, color: sc.fg,
    animPlace: function (env) {
      var p = E.outExpo(cl(env.t / 0.32));
      return { dx: -(1 - p) * W * 0.28 };
    }
  }];
  if (ws[1]) {
    specs.push({
      text: ws[1], size: sz, x: W / 2 + m0 / 2 + gap / 2, y: Hh / 2, color: sc.accent, mi: 1,
      animPlace: function (env) {
        var p = E.outExpo(cl(env.t / 0.32));
        return { dx: (1 - p) * W * 0.28 };
      }
    });
  }
  H.laySetNodes(c, specs);
});

/* 12. knTumble: tumbling character crates rolling horizontally along baseline */
reg('src/11p_kinetic1.js', 'knTumble', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, bw = Math.min(W * 0.8 / Math.max(1, n * 1.15), u * 0.15);
  var specs = chars.map(function (ch, i) {
    var cx = W / 2 + (i - (n - 1) / 2) * bw * 1.15;
    H.layRRect(c, 'Tumble box ' + i, cx - bw * 0.48, Hh / 2 - bw * 0.48, bw * 0.96, bw * 0.96, 4, { stroke: sc.accent, width: 2, alpha: 0.75 }, function (env, f) {
      var p = E.outCubic(cl((env.t - i * 0.04) / 0.36));
      return { rot: (1 - p) * -90, a: 0.75 * p * H.layTout(c, f) };
    });
    return {
      text: ch, size: bw * 0.6, x: cx, y: Hh / 2, color: sc.fg, mi: i,
      animPlace: function (env) {
        var p = E.outCubic(cl((env.t - i * 0.04) / 0.36));
        return { rot: (1 - p) * -90 };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 13. knReflow: split lines rearranging cleanly from stepped columns into crisp bar */
reg('src/11p_kinetic1.js', 'knReflow', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = wordsOf(c, 3), k = ws.length, sz = Math.min(u * 0.14, W * 0.72 / Math.max(3, k * 2));
  var specs = ws.map(function (w, i) {
    var tx = W / 2 + (i - (k - 1) / 2) * (W * 0.26);
    return {
      text: w, size: sz, x: tx, y: Hh / 2, color: i === 0 ? sc.accent : sc.fg, mi: i,
      animPlace: function (env) {
        var p = E.inOutCubic(cl((env.t - 0.1) / 0.45));
        return { x: mix(W / 2, tx, p), y: mix(Hh * (0.3 + i * 0.2), Hh / 2, p) };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 14. knPadGrid: modular launchpad button grid lighting up active lyric cells */
reg('src/11p_kinetic1.js', 'knPadGrid', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, cols = Math.min(n, isPort(c) ? 3 : 4), rows = Math.ceil(n / cols);
  var ps = Math.min(W * 0.76 / cols, Hh * 0.68 / Math.max(1, rows), u * 0.19), specs = [];
  chars.forEach(function (ch, i) {
    var r = Math.floor(i / cols), col = i % cols, rLen = Math.min(cols, n - r * cols);
    var cx = W / 2 + (col - (rLen - 1) / 2) * ps * 1.12, cy = Hh / 2 + (r - (rows - 1) / 2) * ps * 1.12;
    var active = i % 2 === 0;
    H.layRRect(c, 'Launch pad ' + i, cx - ps * 0.48, cy - ps * 0.48, ps * 0.96, ps * 0.96, 8, { fill: active ? sc.accent : (sc.ink || sc.sub), alpha: 0.92 }, envAlpha(c, i * 0.03, 0.25, 0.92));
    specs.push({ text: ch, font: monoFont(c), size: ps * 0.56, x: cx, y: cy, color: H.textOn(active ? sc.accent : (sc.ink || sc.sub), sc.bg, sc), mi: i });
  });
  H.laySetNodes(c, specs);
});

/* ==== x2_kineticA (15 kz* layouts) ==== */

/* 15. kzShove: sequential words bulldozing into row from the right */
reg('src/11p_x2_kineticA.js', 'kzShove', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = wordsOf(c, 3), k = ws.length, sz = Math.min(u * 0.13, W * 0.8 / Math.max(3, k * 2.5));
  var specs = ws.map(function (w, i) {
    var tx = mix(W * 0.25, W * 0.75, k === 1 ? 0.5 : i / (k - 1));
    return {
      text: w, size: sz, x: tx, y: Hh / 2, color: i === k - 1 ? sc.accent : sc.fg, mi: i * 2,
      animPlace: function (env) {
        var p = E.outBack(cl((env.t - i * 0.12) / 0.34), 1.2);
        return { x: mix(W * 1.1, tx, p) };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 16. kzConveyor: words gliding along dotted mechanical belt rollers and braking */
reg('src/11p_x2_kineticA.js', 'kzConveyor', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var yBelt = Hh * 0.62;
  H.line(c, 'Belt rail', [[W * 0.08, yBelt], [W * 0.92, yBelt]], sc.sub, 3, 0.75);
  for (var i = 0; i < 6; i++) H.layCircleAt(c, 'Roller ' + i, mix(W * 0.12, W * 0.88, i / 5), yBelt + u * 0.015, u * 0.012, u * 0.012, { fill: sc.accent, alpha: 0.8 }, envAlpha(c, 0, 0.3, 0.8));
  var ws = wordsOf(c, 3), k = ws.length, sz = Math.min(u * 0.13, W * 0.76 / Math.max(3, k * 2.4));
  var specs = ws.map(function (w, i) {
    var tx = mix(W * 0.26, W * 0.74, k === 1 ? 0.5 : i / (k - 1));
    return {
      text: w, size: sz, x: tx, y: yBelt - sz * 0.75, color: i === 0 ? sc.accent : sc.fg, mi: i,
      animPlace: function (env) {
        var p = E.outCubic(cl((env.t - i * 0.1) / 0.42));
        return { x: mix(W * 0.05, tx, p) };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 17. kzSwingKnock: wrecking-ball rods swinging words into aligned center row */
reg('src/11p_x2_kineticA.js', 'kzSwingKnock', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = wordsOf(c, 3), k = ws.length, sz = Math.min(u * 0.13, W * 0.74 / Math.max(3, k * 2.2));
  var specs = ws.map(function (w, i) {
    var tx = mix(W * 0.28, W * 0.72, k === 1 ? 0.5 : i / (k - 1));
    H.line(c, 'Knock cable ' + i, [[tx, 0], [tx, Hh / 2 - sz * 0.5]], sc.sub, 1.5, 0.55);
    return {
      text: w, size: sz, x: tx, y: Hh / 2, color: i === k - 1 ? sc.accent : sc.fg, mi: i,
      animPlace: function (env) {
        var ang = (1 - E.outExpo(cl((env.t - i * 0.09) / 0.38))) * 32;
        return { rot: ang, dx: Math.sin(ang * DEG) * Hh * 0.25 };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 18. kzReadLens: focal magnifier ring sliding across words from left to right */
reg('src/11p_x2_kineticA.js', 'kzReadLens', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var lr = u * 0.16;
  H.layCircleAt(c, 'Read lens', W * 0.25, Hh / 2, lr, lr, { stroke: sc.accent, width: 3, alpha: 0.9 }, function (env, f) {
    return { x: mix(W * 0.22, W * 0.78, E.inOutCubic(cl(env.t / 0.9))), a: 0.9 * H.layTin(c, f, 0, 0.2) * H.layTout(c, f) };
  });
  var txt = H.layFlat(H.layText(c)), size = Math.min(H.layFitSize(c, txt, W * 0.82, Hh * 0.34), u * 0.15);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 19. kzGateSwing: hinged gate panels folding open like double doors */
reg('src/11p_x2_kineticA.js', 'kzGateSwing', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = wordsOf(c, 3), k = ws.length, sz = Math.min(u * 0.13, W * 0.74 / Math.max(3, k * 2.2));
  var specs = ws.map(function (w, i) {
    var tx = mix(W * 0.26, W * 0.74, k === 1 ? 0.5 : i / (k - 1));
    H.line(c, 'Gate hinge ' + i, [[tx, Hh * 0.35], [tx, Hh * 0.65]], sc.accent, 2, 0.7);
    return {
      text: w, size: sz, x: tx, y: Hh / 2, color: sc.fg, mi: i,
      animPlace: function (env) {
        var open = E.outExpo(cl((env.t - i * 0.09) / 0.35));
        return { sx: Math.max(0.05, open) };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 20. kzHopSteps: parabolic arc bounce stepping across miniature stair treads */
reg('src/11p_x2_kineticA.js', 'kzHopSteps', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = wordsOf(c, 4), k = ws.length, sz = Math.min(u * 0.11, W * 0.24);
  var specs = ws.map(function (w, i) {
    var sx = mix(W * 0.2, W * 0.8, k === 1 ? 0.5 : i / (k - 1)), sy = mix(Hh * 0.66, Hh * 0.36, k === 1 ? 0.5 : i / (k - 1));
    H.layRectAt(c, 'Hop tread ' + i, sx, sy + sz * 0.62, W * 0.16, 4, { fill: sc.accent, alpha: 0.85 }, envAlpha(c, i * 0.07, 0.25, 0.85));
    return {
      text: w, size: sz, x: sx, y: sy, color: i === k - 1 ? sc.accent : sc.fg, mi: i * 2,
      animPlace: function (env) {
        var p = cl((env.t - i * 0.08) / 0.36), hop = Math.sin(p * Math.PI) * -u * 0.09;
        return { dy: hop };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 21. kzFoldOut: accordion brochure flaps opening left and right from center seam */
reg('src/11p_x2_kineticA.js', 'kzFoldOut', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = wordsOf(c, 3), k = ws.length, sz = Math.min(u * 0.13, W * 0.72 / Math.max(3, k * 2));
  var specs = ws.map(function (w, i) {
    var tx = mix(W * 0.26, W * 0.74, k === 1 ? 0.5 : i / (k - 1));
    return {
      text: w, size: sz, x: tx, y: Hh / 2, color: i === 1 ? sc.accent : sc.fg, mi: i,
      animPlace: function (env) {
        var p = E.outCubic(cl((env.t - i * 0.08) / 0.38));
        return { x: mix(W / 2, tx, p), sx: Math.max(0.1, p) };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 22. kzSagLine: elastic wire drooping under word weights then rebounding taut */
reg('src/11p_x2_kineticA.js', 'kzSagLine', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  H.line(c, 'Clothesline', [[W * 0.08, Hh * 0.54], [W / 2, Hh * 0.58], [W * 0.92, Hh * 0.54]], sc.sub, 2, 0.75);
  var txt = H.layFlat(H.layText(c)), size = Math.min(H.layFitSize(c, txt, W * 0.8, Hh * 0.34), u * 0.15);
  H.laySetNodes(c, [{
    text: txt, size: size, x: W / 2, y: Hh * 0.5, color: sc.fg,
    animPlace: function (env) {
      var sag = Math.exp(-env.t * 3.5) * Math.sin(env.t * 14) * u * 0.045;
      return { dy: sag };
    }
  }]);
});

/* 23. kzSlingshot: drawn catapult band snapping word forward across canvas */
reg('src/11p_x2_kineticA.js', 'kzSlingshot', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  H.line(c, 'Sling band', [[W * 0.12, Hh * 0.36], [W * 0.06, Hh * 0.5], [W * 0.12, Hh * 0.64]], sc.accent, 3, 0.8);
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.42), u * 0.17);
  H.laySetNodes(c, [{
    text: txt, size: size, x: W / 2, y: Hh / 2, color: sc.fg,
    animPlace: function (env) {
      var p = E.outBack(cl(env.t / 0.36), 1.4);
      return { x: mix(W * 0.18, W / 2, p) };
    }
  }]);
});

/* 24. kzWedge: heroic key word dropping sharply like a wedge separating flanking copy */
reg('src/11p_x2_kineticA.js', 'kzWedge', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = wordsOf(c, 3);
  if (ws.length < 2) ws = [ws[0], H.layLineNo(c)];
  var k = ws.length, mid = Math.floor(k / 2), sz = Math.min(u * 0.13, W * 0.74 / Math.max(3, k * 2.2));
  var specs = ws.map(function (w, i) {
    var tx = mix(W * 0.26, W * 0.74, k === 1 ? 0.5 : i / (k - 1)), isMid = i === mid;
    return {
      text: w, size: sz * (isMid ? 1.25 : 0.9), x: tx, y: Hh / 2, color: isMid ? sc.accent : sc.fg, mi: i,
      animPlace: function (env) {
        var p = E.outExpo(cl((env.t - 0.1) / 0.3));
        return { dy: isMid ? -(1 - p) * Hh * 0.25 : 0 };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 25. kzTiltTray: sliding tray tilting under inertia to throw caption forward */
reg('src/11p_x2_kineticA.js', 'kzTiltTray', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  H.layRectAt(c, 'Tilt tray', W / 2, Hh * 0.6, W * 0.78, 5, { fill: sc.accent, alpha: 0.9 }, function (env, f) {
    return { rot: (1 - E.outExpo(cl(env.t / 0.45))) * -10, a: 0.9 * H.layTin(c, f, 0, 0.25) * H.layTout(c, f) };
  });
  var txt = H.layFlat(H.layText(c)), size = Math.min(H.layFitSize(c, txt, W * 0.76, Hh * 0.3), u * 0.15);
  H.laySetNodes(c, [{
    text: txt, size: size, x: W / 2, y: Hh * 0.5, color: sc.fg,
    animPlace: function (env) { return { rot: (1 - E.outExpo(cl(env.t / 0.45))) * -10 }; }
  }]);
});

/* 26. kzRelay: torch relay spotlight handing accent emphasis word-to-word */
reg('src/11p_x2_kineticA.js', 'kzRelay', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = wordsOf(c, 4), k = ws.length, sz = Math.min(u * 0.13, W * 0.78 / Math.max(3, k * 2));
  H.line(c, 'Relay baton', [[W * 0.16, Hh * 0.62], [W * 0.84, Hh * 0.62]], sc.sub, 2, 0.55);
  var specs = ws.map(function (w, i) {
    var tx = mix(W * 0.24, W * 0.76, k === 1 ? 0.5 : i / (k - 1));
    H.layCircleAt(c, 'Relay node ' + i, tx, Hh * 0.62, u * 0.012, u * 0.012, { fill: sc.accent, alpha: 1 }, envAlpha(c, i * 0.08, 0.25));
    return { text: w, size: sz, x: tx, y: Hh / 2, color: i === 0 ? sc.accent : sc.fg, mi: i * 2 };
  });
  H.laySetNodes(c, specs);
});

/* 27. kzLineFeed: mechanical carriage-return ratchet feeding stacked rows upward */
reg('src/11p_x2_kineticA.js', 'kzLineFeed', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = wordsOf(c, 3), k = ws.length, rowH = Math.min(Hh * 0.2, u * 0.16);
  var sz = Math.min(H.layFitSize(c, ws.join('\n'), W * 0.8, rowH * k * 0.85, { font: monoFont(c) }), rowH * 0.72);
  var specs = ws.map(function (w, i) {
    var y = Hh / 2 + (i - (k - 1) / 2) * rowH;
    return {
      text: w, font: monoFont(c), size: sz, x: W * 0.14, y: y, align: 'left', color: i === k - 1 ? sc.accent : sc.fg, mi: i * 2,
      animPlace: function (env) {
        var step = E.outCubic(cl((env.t - i * 0.12) / 0.28));
        return { dy: (1 - step) * rowH * 0.7 };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 28. kzLob: arched parabolic projectiles tossed in from corner with spin settle */
reg('src/11p_x2_kineticA.js', 'kzLob', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = wordsOf(c, 3), k = ws.length, sz = Math.min(u * 0.13, W * 0.74 / Math.max(3, k * 2.1));
  var specs = ws.map(function (w, i) {
    var tx = mix(W * 0.26, W * 0.74, k === 1 ? 0.5 : i / (k - 1));
    return {
      text: w, size: sz, x: tx, y: Hh / 2, color: i === k - 1 ? sc.accent : sc.fg, mi: i,
      animPlace: function (env) {
        var p = E.outCubic(cl((env.t - i * 0.08) / 0.42)), arc = Math.sin(p * Math.PI) * -Hh * 0.22;
        return { x: mix(W * 0.1, tx, p), dy: arc, rot: (1 - p) * 28 };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 29. kzInchworm: accordion-stepping phrase creeping horizontally across rail */
reg('src/11p_x2_kineticA.js', 'kzInchworm', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, step = Math.min(W * 0.82 / Math.max(1, n), u * 0.15);
  var specs = chars.map(function (ch, i) {
    return {
      text: ch, size: step * 0.85, x: W / 2 + (i - (n - 1) / 2) * step, y: Hh / 2,
      color: i % 3 === 0 ? sc.accent : sc.fg, mi: i,
      animPlace: function (env) {
        var hump = Math.sin(env.t * 4 - i * 0.55) * u * 0.028;
        return { dy: hump };
      }
    };
  });
  H.laySetNodes(c, specs);
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZPackHelpers);
