/* JIZURA Cavalry Pack: x2layD (30 kinetic echo, wave & symmetry layouts xd* from src/11p_x2_layD.js). */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, DEG = H.DEG, TAU = H.TAU;

function reg(key, fn) {
  N.register('layout', key, {
    source: 'src/11p_x2_layD.js (' + key + ')',
    scope: 'cut',
    build: fn,
    differences: ['Native Cavalry text nodes and editable vector geometry matching ' + key + '.']
  });
}

function uMin(c) { return Math.min(c.comp.width, c.comp.height); }
function isPort(c) { return c.comp.height > c.comp.width * 1.08; }
function monoFont(c) { return H.layFontObj(c, 'mono'); }
function serifFont(c) { return H.layFontObj(c, 'serif'); }
function envAlpha(c, d, len, mul) {
  var m = mul == null ? 1 : mul;
  return function (env, f) {
    return { a: cl(H.layTin(c, f, d || 0, len || 0.35, E.outCubic) * H.layTout(c, f) * m, 0, 1) };
  };
}

/* 1. xdHelix: counter-phased sine double helix of braided glyph ribbons */
reg('xdHelix', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, step = Math.min(W * 0.82 / Math.max(1, n), u * 0.14);
  var p1 = [], p2 = [], specs = [];
  chars.forEach(function (ch, i) {
    var x = W / 2 + (i - (n - 1) / 2) * step, ph = i * 0.7;
    var y1 = Hh / 2 + Math.sin(ph) * Hh * 0.16, y2 = Hh / 2 - Math.sin(ph) * Hh * 0.16;
    p1.push([x, y1]); p2.push([x, y2]);
    H.line(c, 'Helix rung ' + i, [[x, y1], [x, y2]], sc.sub, 1.5, 0.45);
    specs.push({ text: ch, size: step * 0.78, x: x, y: y1, color: i % 2 ? sc.accent : sc.fg, mi: i });
  });
  if (p1.length >= 2) { H.line(c, 'Helix strand A', p1, sc.accent, 2, 0.7); H.line(c, 'Helix strand B', p2, sc.sub, 1.5, 0.45); }
  H.laySetNodes(c, specs);
});

/* 2. xdConstellation: starlight nodes scattered organically and linked by thin star lines */
reg('xdConstellation', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), seed = H.laySeed(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, pts = [], specs = [];
  chars.forEach(function (ch, i) {
    var x = n === 1 ? W / 2 : mix(W * 0.18, W * 0.82, i / (n - 1));
    var y = Hh / 2 + (R.hash01(seed, i, 4) - 0.5) * Hh * 0.44;
    pts.push([x, y]);
    H.layCircleAt(c, 'Star ' + i, x, y, u * 0.012, u * 0.012, { fill: sc.accent, alpha: 0.9 }, envAlpha(c, i * 0.04, 0.25, 0.9));
    specs.push({ text: ch, font: serifFont(c), size: Math.min(u * 0.1, W * 0.58 / Math.max(2, n)), x: x, y: y - u * 0.05, color: sc.fg, mi: i });
  });
  if (pts.length >= 2) H.line(c, 'Star trace', pts, sc.sub, 1.5, 0.55);
  H.laySetNodes(c, specs);
});

/* 3. xdBrick: staggered running-bond masonry wall of solid glyph bricks */
reg('xdBrick', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, cols = Math.min(n, 4), rows = Math.ceil(n / cols);
  var bw = Math.min(W * 0.76 / cols, u * 0.22), bh = bw * 0.54, specs = [];
  chars.forEach(function (ch, i) {
    var r = Math.floor(i / cols), col = i % cols, rLen = Math.min(cols, n - r * cols);
    var cx = W / 2 + (col - (rLen - 1) / 2) * bw * 1.06 + (r % 2 ? bw * 0.26 : -bw * 0.26);
    var cy = Hh / 2 + (r - (rows - 1) / 2) * bh * 1.12;
    var fill = i % 3 === 0 ? sc.accent : (sc.ink || sc.sub);
    H.layRRect(c, 'Brick ' + i, cx - bw * 0.48, cy - bh * 0.48, bw * 0.96, bh * 0.96, 2, { fill: fill, alpha: 0.92 }, envAlpha(c, i * 0.03, 0.25, 0.92));
    specs.push({ text: ch, size: bh * 0.62, x: cx, y: cy, color: H.textOn(fill, sc.bg, sc), mi: i });
  });
  H.laySetNodes(c, specs);
});

/* 4. xdMirrorAxis: bilateral vertical mirror twin across glowing symmetry plane */
reg('xdMirrorAxis', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, W * 0.38, Hh * 0.38), u * 0.14);
  H.line(c, 'Mirror axis', [[W / 2, Hh * 0.14], [W / 2, Hh * 0.86]], sc.accent, 2, 0.85);
  H.laySetNodes(c, [
    { text: txt, size: sz, x: W * 0.47, y: Hh / 2, align: 'right', color: sc.fg, mi: 0 },
    { text: txt, size: sz, x: W * 0.53, y: Hh / 2, align: 'right', sx: -1, color: sc.accent, alpha: 0.65, mi: 1 }
  ]);
});

/* 5. xdUpSide: alternating horizontal/rotated 90-degree checkerboard orientation per glyph */
reg('xdUpSide', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, step = Math.min(W * 0.82 / Math.max(1, n), u * 0.16);
  var specs = chars.map(function (ch, i) {
    return { text: ch, size: step * 0.82, x: W / 2 + (i - (n - 1) / 2) * step, y: Hh / 2, rot: i % 2 ? 90 : 0, color: i % 2 ? sc.accent : sc.fg, mi: i };
  });
  H.laySetNodes(c, specs);
});

/* 6. xdPivotFan: fanned radial copies pivoting around shared left-anchor hinge */
reg('xdPivotFan', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, W * 0.62, Hh * 0.24), u * 0.13);
  [-18, -9].forEach(function (ang, i) {
    H.addText(c, 'Fan copy ' + i, txt, W * 0.22, Hh / 2, sz, { align: 'left', rot: ang, color: sc.sub, alpha: 0.25 + i * 0.18 }, envAlpha(c, i * 0.05, 0.3, 0.25 + i * 0.18));
  });
  H.layCircleAt(c, 'Fan hinge', W * 0.2, Hh / 2, u * 0.012, u * 0.012, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0, 0.25));
  H.laySetNodes(c, [{ text: txt, size: sz, x: W * 0.22, y: Hh / 2, align: 'left', color: sc.fg }]);
});

/* 7. xdDrum: rotating cylindrical drum echo stepping upper/middle/lower copies */
reg('xdDrum', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.22), u * 0.14);
  [-1, 1].forEach(function (dir, i) {
    H.addText(c, 'Drum ghost ' + i, txt, W / 2, Hh / 2 + dir * sz * 1.15, sz * 0.85, { color: sc.sub, alpha: 0.35 }, envAlpha(c, 0.04, 0.3, 0.35));
  });
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 8. xdSlowSpread: serene wide-breathing expansion gradually widening glyph letterspacing */
reg('xdSlowSpread', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, step = Math.min(W * 0.7 / Math.max(1, n), u * 0.15);
  var specs = chars.map(function (ch, i) {
    var rel = i - (n - 1) / 2;
    return {
      text: ch, font: serifFont(c), size: step * 0.82, x: W / 2 + rel * step, y: Hh / 2, color: sc.fg, mi: i,
      animPlace: function (env) {
        var k = 1 + cl(env.t / 1.4) * 0.36;
        return { x: W / 2 + rel * step * k };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 9. xdBentRoad: S-curve winding highway path carrying spaced glyphs along turns */
reg('xdBentRoad', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, pts = [], specs = [];
  chars.forEach(function (ch, i) {
    var f = n === 1 ? 0.5 : i / (n - 1);
    var x = mix(W * 0.18, W * 0.82, f), y = Hh / 2 + Math.sin(f * TAU) * Hh * 0.18;
    pts.push([x, y]);
    specs.push({ text: ch, size: Math.min(u * 0.12, W * 0.65 / Math.max(2, n)), x: x, y: y, rot: Math.cos(f * TAU) * 16, color: sc.fg, mi: i });
  });
  if (pts.length >= 2) H.line(c, 'Road center', pts, sc.accent, 3, 0.55);
  H.laySetNodes(c, specs);
});

/* 10. xdStaff: five parallel musical stave lines threading glyphs like sheet notes */
reg('xdStaff', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), gap = u * 0.04;
  for (var l = -2; l <= 2; l++) H.line(c, 'Staff ' + l, [[W * 0.08, Hh / 2 + l * gap], [W * 0.92, Hh / 2 + l * gap]], sc.sub, 1.5, 0.45);
  var chars = H.layChars(H.layText(c)), n = chars.length, step = Math.min(W * 0.74 / Math.max(1, n), u * 0.14);
  var specs = chars.map(function (ch, i) {
    var py = Hh / 2 + ((i % 5) - 2) * gap;
    return { text: ch, font: serifFont(c), size: step * 0.84, x: W / 2 + (i - (n - 1) / 2) * step, y: py, color: i === 0 ? sc.accent : sc.fg, mi: i };
  });
  H.laySetNodes(c, specs);
});

/* 11. xdOverlap: deeply overlapping stacked opaque plates receding sequentially in depth */
reg('xdOverlap', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, sz = Math.min(W * 0.92 / Math.max(1.5, n * 0.72), u * 0.24);
  var specs = chars.map(function (ch, i) {
    return { text: ch, size: sz, x: W / 2 + (i - (n - 1) / 2) * sz * 0.62, y: Hh / 2 + (i % 2 ? -sz * 0.12 : sz * 0.12), color: i % 2 ? sc.accent : sc.fg, mi: i };
  });
  H.laySetNodes(c, specs);
});

/* 12. xdCyclic: phased rotary carousel offsets gliding smoothly in opposing lanes */
reg('xdCyclic', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, W * 0.76, Hh * 0.22), u * 0.13);
  var specs = [-1, 0, 1].map(function (row, i) {
    return {
      text: txt, size: sz, x: W / 2, y: Hh / 2 + row * sz * 1.25,
      color: row === 0 ? sc.accent : sc.fg, alpha: row === 0 ? 1 : 0.45, mi: i,
      animPlace: function (env) {
        return { dx: Math.sin(env.t * 1.6 + row * 1.2) * W * 0.08 * (row === 0 ? -1 : 1) };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 13. xdKaraoke: progressive left-to-right wipe highlight bar filling behind lyric */
reg('xdKaraoke', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, W * 0.82, Hh * 0.34), u * 0.17);
  var m = H.layMeasure(c, txt, sz), bw = m.w + u * 0.06, bh = sz * 1.28, x0 = W / 2 - bw / 2;
  H.layRRect(c, 'Karaoke fill', x0, Hh / 2 - bh / 2, bw, bh, 4, { fill: sc.accent, alpha: 0.85 }, function (env, f) {
    var p = cl(env.t / Math.max(0.4, (c.cut.sourceEnd - c.cut.origin) / c.comp.fps)) * H.layTout(c, f);
    return { x: x0 + bw * p / 2, sx: Math.max(0.01, p), a: 0.85 * H.layTout(c, f) };
  });
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 14. xdPassing: opposing traffic streams crossing smoothly through central anchor */
reg('xdPassing', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length >= 4 ? 2 : 1);
  var sz = Math.min(H.layFitSize(c, chunks[0], W * 0.72, Hh * 0.24), u * 0.15);
  var specs = chunks.map(function (ch, i) {
    var dir = i % 2 ? -1 : 1;
    return {
      text: ch, size: sz, x: W / 2, y: Hh / 2 + (chunks.length > 1 ? (i - 0.5) * sz * 1.35 : 0),
      color: i ? sc.accent : sc.fg, mi: i,
      animPlace: function (env) {
        var p = E.outExpo(cl(env.t / 0.45));
        return { dx: (1 - p) * dir * W * 0.32 };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 15. xdChecker: alternating dark/accent checkerboard tiles boxing individual glyphs */
reg('xdChecker', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, cols = Math.min(n, 4), rows = Math.ceil(n / cols);
  var cs = Math.min(W * 0.8 / cols, Hh * 0.7 / Math.max(1, rows), u * 0.18), specs = [];
  chars.forEach(function (ch, i) {
    var r = Math.floor(i / cols), col = i % cols, rLen = Math.min(cols, n - r * cols);
    var cx = W / 2 + (col - (rLen - 1) / 2) * cs, cy = Hh / 2 + (r - (rows - 1) / 2) * cs;
    var odd = (r + col) % 2 === 0, fill = odd ? sc.accent : sc.fg;
    H.layRectAt(c, 'Chk ' + i, cx, cy, cs, cs, { fill: fill, alpha: 1 }, envAlpha(c, i * 0.03, 0.25));
    specs.push({ text: ch, size: cs * 0.58, x: cx, y: cy, color: H.textOn(fill, sc.bg, sc), mi: i });
  });
  H.laySetNodes(c, specs);
});

/* 16. xdSquareWave: rectilinear digital square-wave step path stepping glyphs high/low */
reg('xdSquareWave', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, step = Math.min(W * 0.8 / Math.max(1, n), u * 0.15);
  var pts = [], specs = [];
  chars.forEach(function (ch, i) {
    var hi = Math.floor(i / 2) % 2 === 0, x = W / 2 + (i - (n - 1) / 2) * step, y = Hh / 2 + (hi ? -Hh * 0.12 : Hh * 0.12);
    pts.push([x, y]);
    specs.push({ text: ch, font: monoFont(c), size: step * 0.82, x: x, y: y, color: hi ? sc.accent : sc.fg, mi: i });
  });
  if (pts.length >= 2) H.line(c, 'Square rail', pts, sc.sub, 2, 0.55);
  H.laySetNodes(c, specs);
});

/* 17. xdAxisAlt: staggered alternating vertical offsets left & right of central guideline */
reg('xdAxisAlt', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, step = Math.min(Hh * 0.72 / Math.max(1, n), u * 0.14);
  H.line(c, 'Alt spine', [[W / 2, Hh * 0.12], [W / 2, Hh * 0.88]], sc.sub, 2, 0.65);
  var specs = chars.map(function (ch, i) {
    var side = i % 2 ? 1 : -1;
    return { text: ch, size: step * 0.82, x: W / 2 + side * u * 0.08, y: Hh / 2 + (i - (n - 1) / 2) * step, color: i % 2 ? sc.accent : sc.fg, mi: i };
  });
  H.laySetNodes(c, specs);
});

/* 18. xdPointSym: mirrored quad reflection array orbiting shared focal origin */
reg('xdPointSym', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, W * 0.36, Hh * 0.22), u * 0.12);
  H.laySetNodes(c, [
    { text: txt, size: sz, x: W * 0.34, y: Hh * 0.36, color: sc.fg, mi: 0 },
    { text: txt, size: sz, x: W * 0.66, y: Hh * 0.64, rot: 180, color: sc.accent, alpha: 0.75, mi: 1 }
  ]);
});

/* 19. xdWindSway: windswept leaning italic columns swaying organically in breeze */
reg('xdWindSway', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, step = Math.min(W * 0.82 / Math.max(1, n), u * 0.16);
  var specs = chars.map(function (ch, i) {
    return {
      text: ch, size: step * 0.86, x: W / 2 + (i - (n - 1) / 2) * step, y: Hh / 2, color: sc.fg, mi: i,
      animPlace: function (env) {
        return { rot: Math.sin(env.t * 2.3 - i * 0.35) * 10, dy: Math.cos(env.t * 2.3 - i * 0.35) * u * 0.015 };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 20. xdSunShadow: sweeping directional sun casting slow rotating ground shadow silhouette */
reg('xdSunShadow', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.44), u * 0.18);
  H.addText(c, 'Moving shadow', txt, W / 2, Hh / 2, sz, { color: sc.sub, alpha: 0.3 }, function (env, f) {
    return { 'position.x': Math.sin(env.t * 1.4) * u * 0.06, 'position.y': -u * 0.04, alpha: 0.3 * H.layTin(c, f, 0, 0.3) * H.layTout(c, f) };
  });
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 21. xdSkewSweep: layered kinetic motion-trail ghost silhouettes slicing diagonally */
reg('xdSkewSweep', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, W * 0.76, Hh * 0.36), u * 0.17);
  for (var i = 1; i <= 3; i++) {
    H.addText(c, 'Sweep trail ' + i, txt, W / 2 - i * u * 0.025, Hh / 2 + i * u * 0.014, sz, { rot: -8, color: sc.accent, alpha: 0.45 - i * 0.1 }, envAlpha(c, i * 0.04, 0.25, 0.45 - i * 0.1));
  }
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, rot: -8, color: sc.fg }]);
});

/* 22. xdStretchEcho: vertically elongated condensed echo shadows behind bold foreground */
reg('xdStretchEcho', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.26), u * 0.15);
  H.addText(c, 'Stretch echo', txt, W / 2, Hh / 2, sz, { color: sc.accent, alpha: 0.28 }, function (env, f) {
    return { 'scale.y': 2.2, alpha: 0.28 * H.layTin(c, f, 0, 0.3) * H.layTout(c, f) };
  });
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 23. xdColumnEcho: vertical typographic pillar echoed by flanking stepped fade columns */
reg('xdColumnEcho', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var vert = !H.layHasLatin(H.layText(c)), disp = vert ? H.layStrip(H.layText(c)) : H.laySplitLines(H.layText(c), 6);
  var sz = Math.min(H.layFitSize(c, disp, W * 0.32, Hh * 0.72, { vertical: vert }), u * 0.14);
  [-1, 1].forEach(function (side, i) {
    H.addText(c, 'Col echo ' + i, disp, W / 2 + side * sz * 1.4, Hh / 2, sz, { vertical: vert, color: sc.sub, alpha: 0.3 }, envAlpha(c, 0.06, 0.3, 0.3));
  });
  H.laySetNodes(c, [{ text: disp, size: sz, x: W / 2, y: Hh / 2, vertical: vert, color: sc.fg }]);
});

/* 24. xdSkyline: pulsing vertical equalization skyline scaling character heights rhythmically */
reg('xdSkyline', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, step = Math.min(W * 0.82 / Math.max(1, n), u * 0.15);
  var specs = chars.map(function (ch, i) {
    return {
      text: ch, size: step * 0.82, x: W / 2 + (i - (n - 1) / 2) * step, y: Hh / 2,
      sy: 0.8 + 0.65 * Math.abs(Math.sin(i * 0.9 + 0.5)), color: i % 2 ? sc.accent : sc.fg, mi: i
    };
  });
  H.laySetNodes(c, specs);
});

/* 25. xdSpiralEcho: cascading geometric spiral echo frames tapering toward core */
reg('xdSpiralEcho', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, W * 0.68, Hh * 0.36), u * 0.15);
  for (var i = 1; i <= 3; i++) {
    H.addText(c, 'Spiral ghost ' + i, txt, W / 2 + Math.cos(i) * u * 0.04, Hh / 2 + Math.sin(i) * u * 0.04, sz * (1 - i * 0.14), { rot: i * 12, color: sc.accent, alpha: 0.42 - i * 0.08 }, envAlpha(c, i * 0.05, 0.3, 0.42 - i * 0.08));
  }
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 26. xdRipple: concentric water ripple wave rings lifting individual glyphs smoothly */
reg('xdRipple', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  for (var r = 1; r <= 3; r++) {
    H.layCircleAt(c, 'Wave ring ' + r, W / 2, Hh / 2, u * (0.14 * r), u * (0.14 * r), { stroke: sc.accent, width: 1.5, alpha: 0.55 - r * 0.12 }, envAlpha(c, r * 0.05, 0.35, 0.55 - r * 0.12));
  }
  var chars = H.layChars(H.layText(c)), n = chars.length, step = Math.min(W * 0.82 / Math.max(1, n), u * 0.15);
  var specs = chars.map(function (ch, i) {
    return {
      text: ch, size: step * 0.84, x: W / 2 + (i - (n - 1) / 2) * step, y: Hh / 2, color: sc.fg, mi: i,
      animPlace: function (env) {
        return { dy: Math.sin(env.t * 4 - Math.abs(i - (n - 1) / 2) * 0.8) * u * 0.025 };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 27. xdFourUp: crisp 2x2 silkscreen quad-panel repetition highlighting focal cell */
reg('xdFourUp', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), 7), sz = Math.min(H.layFitSize(c, txt, W * 0.36, Hh * 0.3), u * 0.11);
  H.line(c, 'Quad H', [[W * 0.08, Hh / 2], [W * 0.92, Hh / 2]], sc.sub, 1.5, 0.45);
  H.line(c, 'Quad V', [[W / 2, Hh * 0.08], [W / 2, Hh * 0.92]], sc.sub, 1.5, 0.45);
  var specs = [];
  for (var r = 0; r < 2; r++) {
    for (var col = 0; col < 2; col++) {
      var hero = r === 0 && col === 0;
      specs.push({ text: txt, size: sz, x: W * (col ? 0.72 : 0.28), y: Hh * (r ? 0.72 : 0.28), color: hero ? sc.accent : sc.fg, alpha: hero ? 1 : 0.45, mi: r * 2 + col });
    }
  }
  H.laySetNodes(c, specs);
});

/* 28. xdTrace: wireframe stencil outline foreground paired with solid inner ghost */
reg('xdTrace', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, W * 0.8, Hh * 0.44), u * 0.2);
  H.addText(c, 'Trace wire', txt, W / 2 + u * 0.012, Hh / 2 + u * 0.012, sz, { fill: false, stroke: true, strokeColor: sc.accent, strokeWidth: 2, alpha: 0.75 }, envAlpha(c, 0, 0.3, 0.75));
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 29. xdTide: surging ocean water-level crest sweeping cleanly across lower letterforms */
reg('xdTide', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, W * 0.82, Hh * 0.44), u * 0.19);
  H.layRectAt(c, 'Tide wash', W / 2, Hh * 0.72, W, Hh * 0.44, { fill: sc.accent, alpha: 0.35 }, function (env, f) {
    var swell = Math.sin(env.t * 2) * Hh * 0.03;
    return { y: Hh * 0.72 + swell, a: 0.35 * H.layTin(c, f, 0, 0.3) * H.layTout(c, f) };
  });
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 30. xdStitch: tailored dashed seam stitch trail outlining modular display tag */
reg('xdStitch', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var bw = W * 0.78, bh = Hh * 0.48, x0 = (W - bw) / 2, y0 = (Hh - bh) / 2;
  for (var i = 0; i < 14; i++) {
    var sx = mix(x0, x0 + bw, (i + 0.5) / 14);
    H.layRectAt(c, 'Stitch T ' + i, sx, y0, bw / 24, 3, { fill: sc.accent, alpha: 0.9 }, envAlpha(c, i * 0.02, 0.2, 0.9));
    H.layRectAt(c, 'Stitch B ' + i, sx, y0 + bh, bw / 24, 3, { fill: sc.accent, alpha: 0.9 }, envAlpha(c, i * 0.02, 0.2, 0.9));
  }
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, bw * 0.82, bh * 0.64), u * 0.17);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
