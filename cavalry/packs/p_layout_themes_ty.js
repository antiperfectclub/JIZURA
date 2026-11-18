/* JIZURA Cavalry Pack: Typo Themes (18 ty* from typo1 + 15 tz* from x2_typoA = 33 layouts). */
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
function bodyFont(c) { return H.layFontObj(c, 'body'); }
function monoFont(c) { return H.layFontObj(c, 'mono'); }
function serifFont(c) { return H.layFontObj(c, 'serif'); }
function smallSize(c) { return cl(uMin(c) * 0.024, 12, 30); }
function envAlpha(c, d, len, mul) {
  var m = mul == null ? 1 : mul;
  return function (env, f) {
    return { a: cl(H.layTin(c, f, d || 0, len || 0.35, E.outCubic) * H.layTout(c, f) * m, 0, 1) };
  };
}

/* ==== typo1 (18 ty* layouts) ==== */

/* 1. tyKeySplit: monumental hero initial/char flanking remaining line text */
reg('src/11p_typo1.js', 'tyKeySplit', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), head = chars[0] || 'A', rest = chars.slice(1).join('') || H.layAltCopy(c);
  var gS = Math.min(W * 0.42, Hh * 0.62, u * 0.48), rS = Math.min(H.layFitSize(c, rest, W * 0.44, Hh * 0.42), u * 0.11);
  H.line(c, 'Keysplit rule', [[W * 0.48, Hh * 0.16], [W * 0.48, Hh * 0.84]], sc.accent, 2, 0.75);
  H.laySetNodes(c, [
    { text: head, font: serifFont(c), size: gS, x: W * 0.28, y: Hh / 2, color: sc.accent, mi: 0 },
    { text: H.laySplitLines(rest, 7), size: rS, x: W * 0.54, y: Hh / 2, align: 'left', color: sc.fg, mi: 2 }
  ]);
});

/* 2. tyCropGiant: oversized bleeding watermark letterform under crisp foreground line */
reg('src/11p_typo1.js', 'tyCropGiant', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var lead = H.layChars(H.layText(c))[0] || 'X';
  H.addText(c, 'Giant bleed', lead, W * 0.68, Hh * 0.56, Math.max(W, Hh) * 0.78, { font: serifFont(c), color: sc.accent, alpha: 0.16 }, envAlpha(c, 0, 0.4, 0.16));
  var txt = H.laySplitLines(H.layText(c), isPort(c) ? 6 : 10), size = Math.min(H.layFitSize(c, txt, W * 0.8, Hh * 0.42), u * 0.17);
  H.laySetNodes(c, [{ text: txt, size: size, x: W * 0.12, y: Hh / 2, align: 'left', color: sc.fg }]);
});

/* 3. tyCross: intersecting vertical + horizontal typographic crosshairs */
reg('src/11p_typo1.js', 'tyCross', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length >= 4 ? 2 : 1);
  var vert = !H.layHasLatin(chunks[0]);
  H.line(c, 'Cross axis V', [[W / 2, Hh * 0.08], [W / 2, Hh * 0.92]], sc.sub, 1.5, 0.45);
  H.line(c, 'Cross axis H', [[W * 0.08, Hh / 2], [W * 0.92, Hh / 2]], sc.sub, 1.5, 0.45);
  var specs = [{
    text: H.layFlat(chunks[0]), size: Math.min(H.layFitSize(c, chunks[0], W * 0.76, Hh * 0.24), u * 0.15),
    x: W / 2, y: Hh / 2, color: sc.fg, mi: 0
  }];
  if (chunks[1]) {
    specs.push({
      text: chunks[1], font: serifFont(c), size: Math.min(H.layFitSize(c, chunks[1], W * 0.25, Hh * 0.72, { vertical: vert }), u * 0.12),
      x: W / 2, y: Hh * 0.68, vertical: vert, color: sc.accent, mi: 2
    });
  }
  H.laySetNodes(c, specs);
});

/* 4. tyBandHide: opaque accent strip bisecting horizontal display type */
reg('src/11p_typo1.js', 'tyBandHide', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), 9), size = Math.min(H.layFitSize(c, txt, W * 0.82, Hh * 0.46), u * 0.2);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: Hh / 2, color: sc.fg }]);
  H.layRectAt(c, 'Hide band', W / 2, Hh * 0.56, W * 0.9, u * 0.045, { fill: sc.accent, alpha: 0.92 }, envAlpha(c, 0.12, 0.3, 0.92));
  H.addText(c, 'Band meta', 'LINE ' + H.layLineNo(c) + '  //  ' + H.layFmtTime(c.cut.origin / c.comp.fps), W / 2, Hh * 0.56, smallSize(c), { font: monoFont(c), color: H.textOn(sc.accent, sc.bg, sc) }, envAlpha(c, 0.14, 0.3));
});

/* 5. tyRuby: interlinear annotation micro-line paired closely above primary type */
reg('src/11p_typo1.js', 'tyRuby', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), 9), size = Math.min(H.layFitSize(c, txt, W * 0.8, Hh * 0.44, { font: serifFont(c) }), u * 0.18);
  var ruby = H.layAltCopy(c), m = H.layMeasure(c, txt, size, { font: serifFont(c) });
  H.addText(c, 'Ruby annotation', ruby, W / 2, Hh / 2 - m.h / 2 - smallSize(c) * 1.1, smallSize(c), { font: monoFont(c), track: 0.18, color: sc.accent }, envAlpha(c, 0.08, 0.3));
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 6. tyBaseline: exposed typography cap-height / x-height / baseline / descender blueprint rules */
reg('src/11p_typo1.js', 'tyBaseline', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.layFlat(H.layText(c)), size = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.36, { font: serifFont(c) }), u * 0.18);
  [-0.5, -0.25, 0.25, 0.5].forEach(function (k, idx) {
    var y = Hh / 2 + k * size;
    H.line(c, 'Metric line ' + idx, [[W * 0.08, y], [W * 0.92, y]], idx === 2 ? sc.accent : sc.sub, idx === 2 ? 2 : 1, idx === 2 ? 0.85 : 0.45);
  });
  H.addText(c, 'Baseline cap', 'CAP / X / BASE', W * 0.09, Hh / 2 - size * 0.62, smallSize(c) * 0.85, { font: monoFont(c), align: 'left', color: sc.sub }, envAlpha(c, 0.04, 0.3));
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 7. tyScaleSteps: progressive point-size escalation staircase with pt labels */
reg('src/11p_typo1.js', 'tyScaleSteps', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), Math.min(3, Math.max(2, H.layChars(H.layText(c)).length >= 4 ? 3 : 2)));
  var specs = [], k = chunks.length;
  chunks.forEach(function (ch, i) {
    var sz = u * (0.065 + i * 0.048), y = mix(Hh * 0.26, Hh * 0.72, k === 1 ? 0.5 : i / (k - 1));
    H.addText(c, 'Pt label ' + i, Math.round(sz) + 'PT', W * 0.1, y, smallSize(c) * 0.85, { font: monoFont(c), align: 'left', color: sc.sub }, envAlpha(c, i * 0.06, 0.25));
    specs.push({ text: ch, size: Math.min(sz, H.layFitSize(c, ch, W * 0.66, Hh * 0.25)), x: W * 0.24, y: y, align: 'left', color: i === k - 1 ? sc.accent : sc.fg, mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 8. tyJustify: full-bleed edge-to-edge stretched justification between vertical margin guides */
reg('src/11p_typo1.js', 'tyJustify', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var mx = W * 0.1, chars = H.layChars(H.layText(c)), n = chars.length;
  H.line(c, 'Justify L', [[mx, Hh * 0.18], [mx, Hh * 0.82]], sc.accent, 2, 0.65);
  H.line(c, 'Justify R', [[W - mx, Hh * 0.18], [W - mx, Hh * 0.82]], sc.accent, 2, 0.65);
  var sz = Math.min((W - mx * 2) / Math.max(2, n * 1.1), u * 0.17);
  var specs = chars.map(function (ch, i) {
    var x = n === 1 ? W / 2 : mix(mx + sz * 0.5, W - mx - sz * 0.5, i / (n - 1));
    return { text: ch, size: sz, x: x, y: Hh / 2, color: sc.fg, mi: i };
  });
  H.laySetNodes(c, specs);
});

/* 9. tyIndexTable: archival specimen ledger table with ruled rows & column headers */
reg('src/11p_typo1.js', 'tyIndexTable', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), Math.min(4, Math.max(2, H.layChars(H.layText(c)).length >= 5 ? 3 : 2)));
  var x0 = W * 0.12, x1 = W * 0.88, rowH = Math.min(Hh * 0.16, u * 0.14), yStart = Hh / 2 - (chunks.length - 1) * rowH / 2;
  var ls = smallSize(c), specs = [];
  H.addText(c, 'Index hdr', 'IDX    //    ITEM    //    GLYPHS', x0, yStart - rowH * 0.9, ls * 0.9, { font: monoFont(c), align: 'left', color: sc.sub }, envAlpha(c, 0, 0.25));
  chunks.forEach(function (ch, i) {
    var y = yStart + i * rowH;
    H.line(c, 'Table row ' + i, [[x0, y - rowH / 2], [x1, y - rowH / 2]], sc.sub, 1.5, 0.45);
    H.addText(c, 'Table idx ' + i, H.layPad2(i + 1), x0 + ls, y, ls, { font: monoFont(c), align: 'left', color: sc.accent }, envAlpha(c, i * 0.04, 0.25));
    H.addText(c, 'Table cnt ' + i, String(H.layChars(ch).length), x1 - ls, y, ls, { font: monoFont(c), align: 'right', color: sc.sub }, envAlpha(c, i * 0.04, 0.25));
    specs.push({ text: ch, size: Math.min(rowH * 0.58, H.layFitSize(c, ch, W * 0.48, rowH * 0.7)), x: W * 0.28, y: y, align: 'left', color: sc.fg, mi: i * 2 });
  });
  H.line(c, 'Table bot', [[x0, yStart + chunks.length * rowH - rowH / 2], [x1, yStart + chunks.length * rowH - rowH / 2]], sc.sub, 1.5, 0.45);
  H.laySetNodes(c, specs);
});

/* 10. tySplitType: top & bottom sliced halves displaced along crisp horizontal cut line */
reg('src/11p_typo1.js', 'tySplitType', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.layFlat(H.layText(c)), size = Math.min(H.layFitSize(c, txt, W * 0.8, Hh * 0.4), u * 0.22);
  H.line(c, 'Cut line', [[W * 0.08, Hh / 2], [W * 0.92, Hh / 2]], sc.accent, 2, 0.85);
  H.laySetNodes(c, [
    { text: txt, size: size, x: W / 2 - u * 0.015, y: Hh / 2, color: sc.fg, clipRectFn: function () { return [0, 0, W, Hh / 2]; }, mi: 0 },
    { text: txt, size: size, x: W / 2 + u * 0.015, y: Hh / 2, color: sc.accent, clipRectFn: function () { return [0, Hh / 2, W, Hh]; }, mi: 1 }
  ]);
});

/* 11. tyErode: fading ghostly echo cascade retreating upward in transparency */
reg('src/11p_typo1.js', 'tyErode', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.36), u * 0.17);
  for (var i = 1; i <= 3; i++) {
    H.addText(c, 'Erode echo ' + i, txt, W / 2, Hh / 2 - i * size * 0.34, size, { fill: false, stroke: true, strokeColor: sc.sub, strokeWidth: 1.5, alpha: 0.45 - i * 0.1 }, envAlpha(c, i * 0.05, 0.3, 0.45 - i * 0.1));
  }
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: Hh / 2 + size * 0.2, color: sc.fg }]);
});

/* 12. tyVRuler: calibrated vertical tick ruler sidebar paired with monumental setting */
reg('src/11p_typo1.js', 'tyVRuler', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var rx = W * 0.14;
  H.line(c, 'V Ruler spine', [[rx, Hh * 0.1], [rx, Hh * 0.9]], sc.accent, 2, 0.85);
  for (var t = 0; t <= 16; t++) {
    var ty = mix(Hh * 0.1, Hh * 0.9, t / 16), tw = t % 4 === 0 ? u * 0.032 : u * 0.014;
    H.line(c, 'V tick ' + t, [[rx, ty], [rx + tw, ty]], t % 4 === 0 ? sc.accent : sc.sub, 1.5, 0.75);
  }
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, W * 0.68, Hh * 0.56), u * 0.18);
  H.laySetNodes(c, [{ text: txt, size: size, x: W * 0.56, y: Hh / 2, color: sc.fg }]);
});

/* 13. tyFullTrack: airy maximally tracked minimal capsule centered vertically */
reg('src/11p_typo1.js', 'tyFullTrack', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.layFlat(H.layText(c)), chars = H.layChars(txt), n = chars.length;
  var sz = Math.min(W * 0.84 / Math.max(2, n * 2.2), u * 0.12);
  var specs = chars.map(function (ch, i) {
    var x = n === 1 ? W / 2 : mix(W * 0.12, W * 0.88, i / (n - 1));
    return { text: ch, size: sz, x: x, y: Hh / 2, color: sc.fg, mi: i };
  });
  H.laySetNodes(c, specs);
});

/* 14. tyStatCount: metadata dashboard showing character count, duration & line telemetry */
reg('src/11p_typo1.js', 'tyStatCount', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), 9), cnt = H.layChars(txt).length;
  var ls = smallSize(c);
  H.addText(c, 'Stat readout', 'CH:' + H.layPad2(cnt) + '   LINE:' + H.layLineNo(c) + '   T:' + H.layFmtTime(c.cut.origin / c.comp.fps), W * 0.12, Hh * 0.24, ls, { font: monoFont(c), align: 'left', color: sc.accent }, envAlpha(c, 0, 0.3));
  H.layRectAt(c, 'Stat bar', W / 2, Hh * 0.3, W * 0.76, 1.5, { fill: sc.sub, alpha: 0.6 }, envAlpha(c, 0.04, 0.3, 0.6));
  var size = Math.min(H.layFitSize(c, txt, W * 0.76, Hh * 0.44), u * 0.18);
  H.laySetNodes(c, [{ text: txt, size: size, x: W * 0.12, y: Hh * 0.54, align: 'left', color: sc.fg }]);
});

/* 15. tyMargin: vast asymmetrical architectural whitespace margin around crisp corner block */
reg('src/11p_typo1.js', 'tyMargin', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var mx = W * 0.12, my = Hh * 0.14;
  H.layRRect(c, 'Page margin', mx, my, W - mx * 2, Hh - my * 2, 0, { stroke: sc.sub, width: 1.5, alpha: 0.4 }, envAlpha(c, 0, 0.3, 0.4));
  var txt = H.laySplitLines(H.layText(c), 7), size = Math.min(H.layFitSize(c, txt, W * 0.48, Hh * 0.32, { font: serifFont(c) }), u * 0.12);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W - mx - u * 0.03, y: Hh - my - u * 0.06, align: 'right', color: sc.fg }]);
});

/* 16. tyRotBlock: sharply angled 45-degree Swiss poster slab */
reg('src/11p_typo1.js', 'tyRotBlock', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), 7), size = Math.min(H.layFitSize(c, txt, W * 0.64, Hh * 0.44), u * 0.17);
  H.layRectAt(c, 'Rot rule', W / 2, Hh / 2, W * 0.66, size * 1.35, { stroke: sc.accent, width: 2.5, rot: -15, alpha: 0.8 }, envAlpha(c, 0.04, 0.3, 0.8));
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: Hh / 2, rot: -15, color: sc.fg }]);
});

/* 17. tySquare: glyphs locked strictly into an equal-column square grid */
reg('src/11p_typo1.js', 'tySquare', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, cols = Math.max(2, Math.ceil(Math.sqrt(n)));
  var rows = Math.ceil(n / cols), cs = Math.min(u * 0.68 / cols, u * 0.68 / Math.max(1, rows));
  var specs = chars.map(function (ch, i) {
    var r = Math.floor(i / cols), col = i % cols;
    return {
      text: ch, size: cs * 0.72,
      x: W / 2 + (col - (cols - 1) / 2) * cs,
      y: Hh / 2 + (r - (rows - 1) / 2) * cs,
      color: i === 0 ? sc.accent : sc.fg, mi: i
    };
  });
  H.laySetNodes(c, specs);
});

/* 18. tyLineFocus: hero line highlighted brightly inside dim contextual full-line strip */
reg('src/11p_typo1.js', 'tyLineFocus', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var alt = H.layAltCopy(c), txt = H.laySplitLines(H.layText(c), 9);
  H.addText(c, 'Context above', alt, W / 2, Hh * 0.3, smallSize(c) * 1.15, { color: sc.sub, alpha: 0.32 }, envAlpha(c, 0, 0.3, 0.32));
  H.addText(c, 'Context below', alt, W / 2, Hh * 0.7, smallSize(c) * 1.15, { color: sc.sub, alpha: 0.32 }, envAlpha(c, 0, 0.3, 0.32));
  H.layRectAt(c, 'Focus bar', W / 2, Hh / 2, W * 0.86, u * 0.004, { fill: sc.accent, alpha: 0.45 }, envAlpha(c, 0.04, 0.3, 0.45));
  var size = Math.min(H.layFitSize(c, txt, W * 0.82, Hh * 0.34), u * 0.17);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* ==== x2_typoA (15 tz* layouts) ==== */

/* 19. tzWarichu: inline double-deck parenthetical note bracketed beside headline */
reg('src/11p_x2_typoA.js', 'tzWarichu', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = H.laySplitK(H.layText(c), 2), head = ws[0], note = ws[1] || H.layAltCopy(c);
  var hS = Math.min(H.layFitSize(c, head, W * 0.46, Hh * 0.4, { font: serifFont(c) }), u * 0.18);
  var nS = Math.min(H.layFitSize(c, note, W * 0.32, hS * 0.45, { font: serifFont(c) }), hS * 0.42);
  H.laySetNodes(c, [
    { text: head, font: serifFont(c), size: hS, x: W * 0.36, y: Hh / 2, color: sc.fg, mi: 0 },
    { text: '(' + note + ')', font: serifFont(c), size: nS, x: W * 0.72, y: Hh / 2, color: sc.accent, mi: 2 }
  ]);
});

/* 20. tzHook: L-shaped right-angle typography path hooking downward at corner */
reg('src/11p_x2_typoA.js', 'tzHook', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), 2), sz = Math.min(u * 0.14, W * 0.34);
  var vert = !H.layHasLatin(chunks[1] || chunks[0]);
  var specs = [{ text: chunks[0], font: serifFont(c), size: sz, x: W * 0.38, y: Hh * 0.34, color: sc.fg, mi: 0 }];
  if (chunks[1]) specs.push({ text: chunks[1], font: serifFont(c), size: sz, x: W * 0.62, y: Hh * 0.56, vertical: vert, color: sc.accent, mi: 2 });
  H.line(c, 'Hook elbow', [[W * 0.22, Hh * 0.42], [W * 0.62, Hh * 0.42], [W * 0.62, Hh * 0.76]], sc.sub, 1.5, 0.55);
  H.laySetNodes(c, specs);
});

/* 21. tzDetail: cropped zoom loupe corner paired with small technical caption */
reg('src/11p_x2_typoA.js', 'tzDetail', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ch = H.layChars(H.layText(c))[0] || 'A';
  H.addText(c, 'Detail crop', ch, W * 0.34, Hh * 0.54, Math.min(W, Hh) * 0.68, { font: serifFont(c), color: sc.accent, alpha: 0.22 }, envAlpha(c, 0, 0.35, 0.22));
  H.layRRect(c, 'Detail crop box', W * 0.12, Hh * 0.16, W * 0.44, Hh * 0.68, 0, { stroke: sc.accent, width: 1.5, alpha: 0.65 }, envAlpha(c, 0.04, 0.3, 0.65));
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, W * 0.34, Hh * 0.4, { font: serifFont(c) }), u * 0.11);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: sz, x: W * 0.64, y: Hh / 2, align: 'left', color: sc.fg }]);
});

/* 22. tzAlignSpec: specimen stack demonstrating left, center & right alignment axes */
reg('src/11p_x2_typoA.js', 'tzAlignSpec', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, W * 0.68, Hh * 0.16), u * 0.085);
  var mx = W * 0.14;
  H.line(c, 'Spec rail L', [[mx, Hh * 0.18], [mx, Hh * 0.82]], sc.sub, 1.5, 0.45);
  H.line(c, 'Spec rail R', [[W - mx, Hh * 0.18], [W - mx, Hh * 0.82]], sc.sub, 1.5, 0.45);
  H.laySetNodes(c, [
    { text: txt, size: sz, x: mx, y: Hh * 0.3, align: 'left', color: sc.fg, mi: 0 },
    { text: txt, size: sz, x: W / 2, y: Hh * 0.5, align: 'center', color: sc.accent, mi: 1 },
    { text: txt, size: sz, x: W - mx, y: Hh * 0.7, align: 'right', color: sc.fg, mi: 2 }
  ]);
});

/* 23. tzTrackClose: wide-tracked glyphs pulling magnetically together into crisp kerning */
reg('src/11p_x2_typoA.js', 'tzTrackClose', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, step = Math.min(W * 0.62 / Math.max(1, n), u * 0.14);
  var specs = chars.map(function (ch, i) {
    var tx = W / 2 + (i - (n - 1) / 2) * step;
    return {
      text: ch, font: serifFont(c), size: step * 0.86, x: tx, y: Hh / 2, color: sc.fg, mi: i,
      animPlace: function (env) {
        var p = E.outExpo(cl(env.t / 0.6));
        return { x: mix(W / 2 + (i - (n - 1) / 2) * step * 1.9, tx, p) };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 24. tzAxis: alternating flush-right & flush-left lines flanking central vertical spine */
reg('src/11p_x2_typoA.js', 'tzAxis', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length >= 4 ? 2 : 1);
  H.line(c, 'Axis spine', [[W / 2, Hh * 0.14], [W / 2, Hh * 0.86]], sc.accent, 2, 0.8);
  var sz = Math.min(H.layFitSize(c, chunks[0], W * 0.36, Hh * 0.24, { font: serifFont(c) }), u * 0.13);
  var specs = chunks.map(function (ch, i) {
    var leftSide = i % 2 === 0;
    return { text: ch, font: serifFont(c), size: sz, x: W / 2 + (leftSide ? -u * 0.024 : u * 0.024), y: Hh / 2 + (i - (chunks.length - 1) / 2) * sz * 1.35, align: leftSide ? 'right' : 'left', color: sc.fg, mi: i * 2 };
  });
  H.laySetNodes(c, specs);
});

/* 25. tzSlash: diagonal typographic slash bars separating stepped phrases */
reg('src/11p_x2_typoA.js', 'tzSlash', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length >= 5 ? 3 : 2);
  var k = chunks.length, sz = Math.min(u * 0.12, W * 0.28), specs = [];
  chunks.forEach(function (ch, i) {
    var x = mix(W * 0.24, W * 0.76, k === 1 ? 0.5 : i / (k - 1)), y = mix(Hh * 0.32, Hh * 0.68, k === 1 ? 0.5 : i / (k - 1));
    if (i > 0) H.line(c, 'Slash ' + i, [[x - W * 0.08, y - Hh * 0.14], [x - W * 0.14, y + Hh * 0.06]], sc.accent, 2.5, 0.85);
    specs.push({ text: ch, size: sz, x: x, y: y, color: sc.fg, mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 26. tzHorizon: bottom-anchored typography resting on heavy edge-to-edge horizon bar */
reg('src/11p_x2_typoA.js', 'tzHorizon', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.layFlat(H.layText(c)), size = Math.min(H.layFitSize(c, txt, W * 0.84, Hh * 0.26, { font: serifFont(c) }), u * 0.16);
  var hy = Hh * 0.74;
  H.line(c, 'Horizon rule', [[0, hy], [W, hy]], sc.accent, 3, 0.9);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W / 2, y: hy - size * 0.42, color: sc.fg }]);
});

/* 27. tzFunnel: converging diagonal guide rails pinching lines into pyramid funnel */
reg('src/11p_x2_typoA.js', 'tzFunnel', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  H.line(c, 'Funnel L', [[W * 0.12, Hh * 0.2], [W * 0.4, Hh * 0.82]], sc.accent, 2, 0.6);
  H.line(c, 'Funnel R', [[W * 0.88, Hh * 0.2], [W * 0.6, Hh * 0.82]], sc.accent, 2, 0.6);
  var chunks = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length >= 5 ? 3 : 2);
  var specs = chunks.map(function (ch, i) {
    var k = i / Math.max(1, chunks.length - 1), wLim = mix(W * 0.62, W * 0.26, k);
    var sz = Math.min(H.layFitSize(c, ch, wLim, Hh * 0.18), u * (0.14 - k * 0.04));
    return { text: ch, size: sz, x: W / 2, y: mix(Hh * 0.34, Hh * 0.68, k), color: sc.fg, mi: i * 2 };
  });
  H.laySetNodes(c, specs);
});

/* 28. tzZoomBox: editorial callout diagram magnifying featured glyph inside target frame */
reg('src/11p_x2_typoA.js', 'tzZoomBox', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ch = H.layChars(H.layText(c))[0] || 'A', bs = u * 0.34;
  H.layRRect(c, 'Zoom loupe', W * 0.68 - bs / 2, Hh / 2 - bs / 2, bs, bs, 4, { stroke: sc.accent, width: 2.5, alpha: 0.9 }, envAlpha(c, 0.08, 0.3, 0.9));
  H.line(c, 'Zoom tether', [[W * 0.32, Hh * 0.44], [W * 0.68 - bs / 2, Hh / 2 - bs / 2]], sc.sub, 1.5, 0.6);
  var txt = H.laySplitLines(H.layText(c), 7), sz = Math.min(H.layFitSize(c, txt, W * 0.36, Hh * 0.42), u * 0.12);
  H.laySetNodes(c, [
    { text: txt, size: sz, x: W * 0.28, y: Hh / 2, color: sc.fg, mi: 0 },
    { text: ch, font: serifFont(c), size: bs * 0.72, x: W * 0.68, y: Hh / 2, color: sc.accent, mi: 2 }
  ]);
});

/* 29. tzWideOne: horizontally expanded monumental single-line graphic headline */
reg('src/11p_x2_typoA.js', 'tzWideOne', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.layFlat(H.layText(c)), sx = 1.65;
  var size = Math.min(H.layFitSize(c, txt, W * 0.86, Hh * 0.42, { sx: sx }), u * 0.22);
  H.laySetNodes(c, [{ text: txt, size: size, sx: sx, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 30. tzPointSym: mirrored point-symmetric duplex (normal + 180° inverted twin) */
reg('src/11p_x2_typoA.js', 'tzPointSym', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.layFlat(H.layText(c)), size = Math.min(H.layFitSize(c, txt, W * 0.74, Hh * 0.24, { font: serifFont(c) }), u * 0.14);
  H.layCircleAt(c, 'Sym center', W / 2, Hh / 2, u * 0.009, u * 0.009, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0, 0.25));
  H.laySetNodes(c, [
    { text: txt, font: serifFont(c), size: size, x: W / 2, y: Hh * 0.34, color: sc.fg, mi: 0 },
    { text: txt, font: serifFont(c), size: size, x: W / 2, y: Hh * 0.66, rot: 180, color: sc.accent, alpha: 0.72, mi: 2 }
  ]);
});

/* 31. tzCanon: Classical Tschichold book-page construction diagonals & text area box */
reg('src/11p_x2_typoA.js', 'tzCanon', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  H.line(c, 'Canon diag 1', [[0, 0], [W, Hh]], sc.sub, 1.5, 0.35);
  H.line(c, 'Canon diag 2', [[W, 0], [0, Hh]], sc.sub, 1.5, 0.35);
  var tw = W * 0.54, th = Hh * 0.58;
  H.layRRect(c, 'Canon grid box', (W - tw) / 2, (Hh - th) / 2, tw, th, 0, { stroke: sc.accent, width: 1.5, alpha: 0.6 }, envAlpha(c, 0.04, 0.3, 0.6));
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, tw * 0.82, th * 0.66, { font: serifFont(c) }), u * 0.14);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 32. tzMetric: bounding-box measurement calipers with exact px dimension callout */
reg('src/11p_x2_typoA.js', 'tzMetric', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, W * 0.72, Hh * 0.42), u * 0.17);
  var m = H.layMeasure(c, txt, sz), pad = u * 0.024;
  H.layRRect(c, 'Metric bounds', W / 2 - m.w / 2 - pad, Hh / 2 - m.h / 2 - pad, m.w + pad * 2, m.h + pad * 2, 0, { stroke: sc.accent, width: 1.5, alpha: 0.75 }, envAlpha(c, 0.04, 0.3, 0.75));
  H.addText(c, 'Metric dim', Math.round(m.w) + ' x ' + Math.round(m.h) + ' PX', W / 2, Hh / 2 + m.h / 2 + pad + smallSize(c), smallSize(c) * 0.9, { font: monoFont(c), color: sc.accent }, envAlpha(c, 0.08, 0.3));
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 33. tzPath: waypoint-numbered nodes linked sequentially by polyline trail */
reg('src/11p_x2_typoA.js', 'tzPath', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), seed = H.laySeed(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, pts = [], specs = [];
  chars.forEach(function (ch, i) {
    var px = n === 1 ? W / 2 : mix(W * 0.18, W * 0.82, i / (n - 1));
    var py = Hh / 2 + (R.hash01(seed, i, 6) - 0.5) * Hh * 0.34;
    pts.push([px, py]);
    H.addText(c, 'Path idx ' + i, String(i + 1), px, py - u * 0.06, smallSize(c) * 0.85, { font: monoFont(c), color: sc.accent }, envAlpha(c, i * 0.04, 0.25));
    specs.push({ text: ch, size: Math.min(u * 0.11, W * 0.62 / Math.max(2, n)), x: px, y: py, color: sc.fg, mi: i });
  });
  if (pts.length >= 2) H.line(c, 'Reading path', pts, sc.sub, 1.5, 0.65);
  H.laySetNodes(c, specs);
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
