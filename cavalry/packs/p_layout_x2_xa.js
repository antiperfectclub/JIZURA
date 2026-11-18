/* JIZURA Cavalry Pack: x2layA (30 editorial & print layouts xa* from src/11p_x2_layA.js). */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, DEG = H.DEG, TAU = H.TAU;

function reg(key, fn) {
  N.register('layout', key, {
    source: 'src/11p_x2_layA.js (' + key + ')',
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
function smallSize(c) { return cl(uMin(c) * 0.023, 11, 28); }
function lightOf(sc) { return H.lum(sc.fg) > H.lum(sc.bg) ? sc.fg : sc.bg; }
function darkOf(sc) { return H.lum(sc.fg) > H.lum(sc.bg) ? sc.bg : sc.fg; }
function cardPal(sc) {
  var fill = lightOf(sc), dk = darkOf(sc), text = H.textOn(fill, sc.bg, sc);
  return { fill: fill, dk: dk, text: text, line: H.mixHex(fill, text, 0.34), acc: H.layPlateCol(sc, [sc.accent, sc.accent2, sc.ink], fill, 1.8) };
}
function envAlpha(c, d, len, mul) {
  var m = mul == null ? 1 : mul;
  return function (env, f) {
    return { a: cl(H.layTin(c, f, d || 0, len || 0.35, E.outCubic) * H.layTout(c, f) * m, 0, 1) };
  };
}

/* 1. xaPullQuote: oversized flanking quotation marks wrapping crisp editorial quote */
reg('xaPullQuote', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  H.addText(c, 'Open quote', '\u201C', W * 0.14, Hh * 0.34, u * 0.24, { font: serifFont(c), color: sc.accent, alpha: 0.75 }, envAlpha(c, 0, 0.3, 0.75));
  H.addText(c, 'Close quote', '\u201D', W * 0.86, Hh * 0.68, u * 0.24, { font: serifFont(c), color: sc.accent, alpha: 0.75 }, envAlpha(c, 0.08, 0.3, 0.75));
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, W * 0.62, Hh * 0.44, { font: serifFont(c) }), u * 0.14);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 2. xaReceipt: long thermal paper store receipt with itemized lines & grand total */
reg('xaReceipt', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var rw = Math.min(W * 0.56, Hh * 0.52), rh = Hh * 0.8, C0 = cardPal(sc), ls = smallSize(c);
  H.layPaper(c, 'Receipt strip', W / 2 - rw / 2, Hh / 2 - rh / 2, rw, rh, 0, C0.fill, C0.line, 0.01, envAlpha(c, 0, 0.35));
  H.addText(c, 'Receipt hdr', 'STORE #' + H.layLineNo(c) + '   RECEIPT', W / 2, Hh / 2 - rh * 0.38, ls, { font: monoFont(c), color: C0.text }, envAlpha(c, 0.04, 0.25));
  H.line(c, 'Receipt dash 1', [[W / 2 - rw * 0.42, Hh / 2 - rh * 0.3], [W / 2 + rw * 0.42, Hh / 2 - rh * 0.3]], C0.line, 1.5, 0.6);
  H.line(c, 'Receipt dash 2', [[W / 2 - rw * 0.42, Hh / 2 + rh * 0.24], [W / 2 + rw * 0.42, Hh / 2 + rh * 0.24]], C0.line, 1.5, 0.6);
  H.addText(c, 'Receipt total', 'TOTAL   $' + (H.layChars(H.layText(c)).length * 12) + '.00', W / 2, Hh / 2 + rh * 0.33, ls * 1.1, { font: monoFont(c), color: C0.acc }, envAlpha(c, 0.1, 0.25));
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, rw * 0.78, rh * 0.36, { font: monoFont(c) }), u * 0.1);
  H.laySetNodes(c, [{ text: txt, font: monoFont(c), size: sz, x: W / 2, y: Hh / 2 - rh * 0.03, color: C0.text }]);
});

/* 3. xaCatalogCard: library index card with punch hole & horizontal ruled entries */
reg('xaCatalogCard', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var cw = Math.min(W * 0.78, Hh * 1.15), ch = cw * 0.62, C0 = cardPal(sc), x0 = (W - cw) / 2, y0 = (Hh - ch) / 2;
  H.layPaper(c, 'Catalog card', x0, y0, cw, ch, 4, C0.fill, C0.line, 0.01, envAlpha(c, 0, 0.3));
  H.line(c, 'Cat margin', [[x0 + cw * 0.14, y0], [x0 + cw * 0.14, y0 + ch]], sc.accent, 2, 0.75);
  H.line(c, 'Cat rule 1', [[x0, y0 + ch * 0.22], [x0 + cw, y0 + ch * 0.22]], sc.accent, 2, 0.75);
  H.line(c, 'Cat rule 2', [[x0, y0 + ch * 0.74], [x0 + cw, y0 + ch * 0.74]], C0.line, 1.5, 0.5);
  H.layCircleAt(c, 'Catalog hole', W / 2, y0 + ch * 0.87, u * 0.016, u * 0.016, { fill: sc.bg, stroke: C0.line, width: 1.5, alpha: 1 }, envAlpha(c, 0.05, 0.25));
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, cw * 0.72, ch * 0.4, { font: serifFont(c) }), ch * 0.28);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: sz, x: x0 + cw * 0.18, y: y0 + ch * 0.48, align: 'left', color: C0.text }]);
});

/* 4. xaTimetable: train schedule grid highlighting departure slot with lyric */
reg('xaTimetable', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var x0 = W * 0.12, x1 = W * 0.88, rowH = Math.min(Hh * 0.16, u * 0.14), ls = smallSize(c);
  for (var r = 0; r < 3; r++) {
    var y = Hh * (0.34 + r * 0.16);
    H.line(c, 'TT row ' + r, [[x0, y - rowH / 2], [x1, y - rowH / 2]], sc.sub, 1.5, 0.45);
    H.addText(c, 'TT time ' + r, H.layFmtTime((c.cut.origin / c.comp.fps) + r * 60), x0 + ls, y, ls, { font: monoFont(c), align: 'left', color: r === 1 ? sc.accent : sc.sub }, envAlpha(c, r * 0.04, 0.25));
  }
  H.layRectAt(c, 'TT band', W / 2, Hh * 0.5, W * 0.76, rowH * 0.92, { fill: sc.accent, alpha: 0.2 }, envAlpha(c, 0.06, 0.3, 0.2));
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, W * 0.5, rowH * 0.7), rowH * 0.65);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W * 0.32, y: Hh * 0.5, align: 'left', color: sc.fg }]);
});

/* 5. xaThumbIndex: stacked tabbed directory pages with active right-edge notch */
reg('xaThumbIndex', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var C0 = cardPal(sc), pw = W * 0.68, ph = Hh * 0.66, x0 = W * 0.12, y0 = (Hh - ph) / 2;
  H.layPaper(c, 'Index page', x0, y0, pw, ph, 4, C0.fill, C0.line, 0.01, envAlpha(c, 0, 0.3));
  for (var t = 0; t < 4; t++) {
    var ty = y0 + t * (ph / 4), act = t === 1;
    H.layRRect(c, 'Thumb tab ' + t, x0 + pw, ty + 4, u * 0.055, ph / 4 - 8, 4, { fill: act ? sc.accent : C0.line, alpha: 0.9 }, envAlpha(c, t * 0.04, 0.25, 0.9));
    H.addText(c, 'Tab num ' + t, H.layPad2(t + 1), x0 + pw + u * 0.028, ty + ph / 8, smallSize(c), { font: monoFont(c), color: act ? H.textOn(sc.accent, sc.bg, sc) : C0.fill }, envAlpha(c, t * 0.04, 0.25));
  }
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, pw * 0.78, ph * 0.6, { font: serifFont(c) }), u * 0.14);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: sz, x: x0 + pw / 2, y: Hh / 2, color: C0.text }]);
});

/* 6. xaColumns: balanced multi-column editorial grid with vertical hairline rules */
reg('xaColumns', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), Math.min(3, Math.max(2, H.layChars(H.layText(c)).length >= 5 ? 3 : 2)));
  var k = chunks.length, cw = W * 0.76 / k, specs = [];
  chunks.forEach(function (ch, i) {
    var x = W * 0.12 + (i + 0.5) * cw;
    if (i > 0) H.line(c, 'Col rule ' + i, [[W * 0.12 + i * cw, Hh * 0.22], [W * 0.12 + i * cw, Hh * 0.78]], sc.sub, 1.5, 0.45);
    var sz = Math.min(H.layFitSize(c, ch, cw * 0.84, Hh * 0.44, { font: serifFont(c) }), u * 0.12);
    specs.push({ text: ch, font: serifFont(c), size: sz, x: x, y: Hh / 2, color: i === 0 ? sc.accent : sc.fg, mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 7. xaInitialPlate: framed solid drop-cap plate flanking clean body block */
reg('xaInitialPlate', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), head = chars[0] || 'A', rest = chars.slice(1).join('') || H.layAltCopy(c);
  var ps = Math.min(W * 0.3, Hh * 0.46, u * 0.34), px = W * 0.28, py = Hh / 2;
  H.layRRect(c, 'Initial plate', px - ps / 2, py - ps / 2, ps, ps, 6, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0, 0.3));
  var tc = H.textOn(sc.accent, sc.bg, sc);
  H.laySetNodes(c, [
    { text: head, font: serifFont(c), size: ps * 0.66, x: px, y: py, color: tc, mi: 0 },
    { text: H.laySplitLines(rest, 7), size: Math.min(H.layFitSize(c, rest, W * 0.44, ps), u * 0.11), x: W * 0.5, y: py, align: 'left', color: sc.fg, mi: 2 }
  ]);
});

/* 8. xaSplitBaseline: zig-zag alternating high/low glyph baseline rhythm */
reg('xaSplitBaseline', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, step = Math.min(W * 0.82 / Math.max(1, n), u * 0.16);
  H.line(c, 'Baseline hi', [[W * 0.1, Hh * 0.42], [W * 0.9, Hh * 0.42]], sc.sub, 1.5, 0.4);
  H.line(c, 'Baseline lo', [[W * 0.1, Hh * 0.58], [W * 0.9, Hh * 0.58]], sc.accent, 1.5, 0.55);
  var specs = chars.map(function (ch, i) {
    return { text: ch, size: step * 0.85, x: W / 2 + (i - (n - 1) / 2) * step, y: i % 2 ? Hh * 0.58 : Hh * 0.42, color: i % 2 ? sc.accent : sc.fg, mi: i };
  });
  H.laySetNodes(c, specs);
});

/* 9. xaHalfKnock: split dual-tone canvas inverting typography polarity across center */
reg('xaHalfKnock', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  H.layRectAt(c, 'Half panel R', W * 0.75, Hh / 2, W * 0.5, Hh, { fill: sc.fg, alpha: 1 }, envAlpha(c, 0, 0.3));
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, W * 0.82, Hh * 0.5), u * 0.22);
  H.laySetNodes(c, [
    { text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg, clipRectFn: function () { return [0, 0, W / 2, Hh]; }, mi: 0 },
    { text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.bg, clipRectFn: function () { return [W / 2, 0, W, Hh]; }, mi: 0 }
  ]);
});

/* 10. xaFormCombs: Japanese/official document comb boxes holding one glyph per cell */
reg('xaFormCombs', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, cw = Math.min(W * 0.84 / Math.max(1, n), u * 0.14), ch = cw * 1.25;
  var x0 = W / 2 - n * cw / 2, y0 = Hh / 2 - ch / 2;
  H.line(c, 'Comb base', [[x0, y0 + ch], [x0 + n * cw, y0 + ch]], sc.accent, 2.5, 0.9);
  var specs = chars.map(function (c0, i) {
    H.line(c, 'Comb tooth ' + i, [[x0 + i * cw, y0 + ch * 0.55], [x0 + i * cw, y0 + ch]], sc.sub, 1.5, 0.7);
    return { text: c0, font: monoFont(c), size: cw * 0.7, x: x0 + (i + 0.5) * cw, y: Hh / 2, color: sc.fg, mi: i };
  });
  H.line(c, 'Comb end', [[x0 + n * cw, y0 + ch * 0.55], [x0 + n * cw, y0 + ch]], sc.sub, 1.5, 0.7);
  H.laySetNodes(c, specs);
});

/* 11. xaWaybill: shipping manifest label with bold tracking barcode & box grid */
reg('xaWaybill', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var pw = Math.min(W * 0.8, Hh * 1.15), ph = pw * 0.64, C0 = cardPal(sc), x0 = (W - pw) / 2, y0 = (Hh - ph) / 2;
  H.layPaper(c, 'Waybill sheet', x0, y0, pw, ph, 4, C0.fill, C0.text, 0.01, envAlpha(c, 0, 0.3));
  H.line(c, 'Waybill div1', [[x0, y0 + ph * 0.25], [x0 + pw, y0 + ph * 0.25]], C0.text, 2, 0.8);
  H.line(c, 'Waybill div2', [[x0 + pw * 0.65, y0], [x0 + pw * 0.65, y0 + ph]], C0.text, 2, 0.8);
  H.addText(c, 'Waybill code', 'WAYBILL #' + H.layLineNo(c), x0 + pw * 0.05, y0 + ph * 0.13, smallSize(c), { font: monoFont(c), align: 'left', color: sc.accent }, envAlpha(c, 0.06, 0.25));
  for (var b = 0; b < 8; b++) H.layRectAt(c, 'WB bar ' + b, x0 + pw * 0.72 + b * pw * 0.032, y0 + ph * 0.6, 3, ph * 0.36, { fill: C0.text, alpha: 0.8 }, envAlpha(c, 0.1, 0.25, 0.8));
  var txt = H.laySplitLines(H.layText(c), 7), sz = Math.min(H.layFitSize(c, txt, pw * 0.56, ph * 0.5), u * 0.12);
  H.laySetNodes(c, [{ text: txt, size: sz, x: x0 + pw * 0.32, y: y0 + ph * 0.62, color: C0.text }]);
});

/* 12. xaErrata: strikethrough error correction slip contrasting old line & accent fix */
reg('xaErrata', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var alt = H.layAltCopy(c), txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, W * 0.72, Hh * 0.2, { font: serifFont(c) }), u * 0.11);
  H.addText(c, 'Errata old', alt, W / 2, Hh * 0.36, sz * 0.72, { font: serifFont(c), color: sc.sub, alpha: 0.55 }, envAlpha(c, 0, 0.25, 0.55));
  H.line(c, 'Errata strike', [[W * 0.24, Hh * 0.36], [W * 0.76, Hh * 0.36]], sc.accent, 2.5, 0.9);
  H.addText(c, 'Errata label', 'ERRATA  //  CORRECTED TO:', W / 2, Hh * 0.48, smallSize(c), { font: monoFont(c), color: sc.accent }, envAlpha(c, 0.08, 0.25));
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: sz, x: W / 2, y: Hh * 0.62, color: sc.fg }]);
});

/* 13. xaTabStops: staggered typewriter tab-stop ladder with leader indicators */
reg('xaTabStops', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), Math.min(3, Math.max(2, H.layChars(H.layText(c)).length >= 4 ? 3 : 2)));
  var specs = [];
  chunks.forEach(function (ch, i) {
    var x = W * (0.14 + i * 0.18), y = Hh * (0.32 + i * 0.18);
    H.line(c, 'Tab stop ' + i, [[x, Hh * 0.16], [x, y]], sc.accent, 1.5, 0.55);
    var sz = Math.min(H.layFitSize(c, ch, W * 0.5, Hh * 0.16, { font: monoFont(c) }), u * 0.11);
    specs.push({ text: ch, font: monoFont(c), size: sz, x: x + u * 0.015, y: y, align: 'left', color: sc.fg, mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 14. xaTriBand: French/Swiss tri-band book cover (top band, white middle, bottom accent) */
reg('xaTriBand', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var C0 = cardPal(sc), cw = Math.min(W * 0.58, Hh * 0.62), ch = Hh * 0.78, x0 = (W - cw) / 2, y0 = (Hh - ch) / 2;
  H.layPaper(c, 'Triband top', x0, y0, cw, ch * 0.22, 0, sc.accent, null, 0, envAlpha(c, 0, 0.25));
  H.layPaper(c, 'Triband mid', x0, y0 + ch * 0.22, cw, ch * 0.56, 0, C0.fill, null, 0, envAlpha(c, 0.04, 0.25));
  H.layPaper(c, 'Triband bot', x0, y0 + ch * 0.78, cw, ch * 0.22, 0, sc.ink || C0.dk, null, 0, envAlpha(c, 0.08, 0.25));
  var txt = H.laySplitLines(H.layText(c), 7), sz = Math.min(H.layFitSize(c, txt, cw * 0.82, ch * 0.42, { font: serifFont(c) }), u * 0.12);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: sz, x: W / 2, y: Hh / 2, color: C0.text }]);
});

/* 15. xaAirmail: par-avion envelope ringed by alternating border stripes */
reg('xaAirmail', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ew = Math.min(W * 0.82, Hh * 1.25), eh = ew * 0.62, x0 = (W - ew) / 2, y0 = (Hh - eh) / 2, C0 = cardPal(sc);
  H.layPaper(c, 'Airmail env', x0, y0, ew, eh, 4, C0.fill, C0.line, 0.01, envAlpha(c, 0, 0.3));
  for (var i = 0; i < 12; i++) {
    var sx = x0 + (i + 0.5) * (ew / 12), col = i % 2 ? sc.accent : (sc.accent2 || sc.fg);
    H.layRectAt(c, 'Air top ' + i, sx, y0 + u * 0.012, ew / 16, u * 0.012, { fill: col, alpha: 0.9 }, envAlpha(c, 0.04, 0.25, 0.9));
    H.layRectAt(c, 'Air bot ' + i, sx, y0 + eh - u * 0.012, ew / 16, u * 0.012, { fill: col, alpha: 0.9 }, envAlpha(c, 0.04, 0.25, 0.9));
  }
  H.addText(c, 'Par avion', 'AIR MAIL  //  NO.' + H.layLineNo(c), x0 + ew * 0.08, y0 + eh * 0.2, smallSize(c), { font: monoFont(c), align: 'left', color: sc.accent }, envAlpha(c, 0.08, 0.25));
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, ew * 0.78, eh * 0.44), u * 0.13);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2 + eh * 0.06, color: C0.text }]);
});

/* 16. xaFigure: academic textbook figure plate with "FIG. 01" caption below box */
reg('xaFigure', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var fw = W * 0.72, fh = Hh * 0.52, x0 = (W - fw) / 2, y0 = Hh * 0.18;
  H.layRRect(c, 'Figure plate', x0, y0, fw, fh, 0, { stroke: sc.sub, width: 2, alpha: 0.8 }, envAlpha(c, 0, 0.3, 0.8));
  H.addText(c, 'Figure cap', 'FIG. ' + H.layLineNo(c) + '   —   ' + H.layAltCopy(c), x0, y0 + fh + smallSize(c) * 1.4, smallSize(c), { font: monoFont(c), align: 'left', color: sc.accent }, envAlpha(c, 0.1, 0.3));
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, fw * 0.82, fh * 0.65, { font: serifFont(c) }), u * 0.16);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: sz, x: W / 2, y: y0 + fh / 2, color: sc.fg }]);
});

/* 17. xaLineNumbers: code/manuscript margin gutter indexing every displayed row */
reg('xaLineNumbers', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), Math.min(3, Math.max(2, H.layChars(H.layText(c)).length >= 4 ? 3 : 2)));
  var gx = W * 0.18, rowH = Math.min(Hh * 0.18, u * 0.15), yStart = Hh / 2 - (chunks.length - 1) * rowH / 2, specs = [];
  H.line(c, 'Gutter divider', [[gx, Hh * 0.2], [gx, Hh * 0.8]], sc.accent, 2, 0.65);
  chunks.forEach(function (ch, i) {
    var y = yStart + i * rowH;
    H.addText(c, 'Line num ' + i, H.layPad2(i + 1), gx - u * 0.03, y, smallSize(c), { font: monoFont(c), align: 'right', color: sc.sub }, envAlpha(c, i * 0.04, 0.25));
    var sz = Math.min(H.layFitSize(c, ch, W * 0.64, rowH * 0.72, { font: monoFont(c) }), rowH * 0.64);
    specs.push({ text: ch, font: monoFont(c), size: sz, x: gx + u * 0.04, y: y, align: 'left', color: sc.fg, mi: i });
  });
  H.laySetNodes(c, specs);
});

/* 18. xaPunchCard: IBM computer punch card with beveled top corner & punched column holes */
reg('xaPunchCard', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var cw = Math.min(W * 0.82, Hh * 1.35), ch = cw * 0.48, cx = W / 2, cy = Hh / 2, C0 = cardPal(sc);
  var cut = ch * 0.18, pts = [[cx - cw / 2 + cut, cy - ch / 2], [cx + cw / 2, cy - ch / 2], [cx + cw / 2, cy + ch / 2], [cx - cw / 2, cy + ch / 2], [cx - cw / 2, cy - ch / 2 + cut]];
  H.layPolyAt(c, 'Punch card', cx, cy, pts, true, { fill: C0.fill, stroke: C0.line, width: 2, alpha: 1 }, envAlpha(c, 0, 0.3));
  for (var col = 0; col < 10; col++) {
    var hx = mix(cx - cw * 0.38, cx + cw * 0.38, col / 9), hy = cy + ch * 0.28 - (col % 3) * ch * 0.1;
    H.layRectAt(c, 'Punch hole ' + col, hx, hy, cw * 0.024, ch * 0.075, { fill: sc.bg, alpha: 1 }, envAlpha(c, col * 0.02, 0.2));
  }
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, cw * 0.8, ch * 0.34, { font: monoFont(c) }), ch * 0.26);
  H.laySetNodes(c, [{ text: txt, font: monoFont(c), size: sz, x: cx, y: cy - ch * 0.18, color: C0.text }]);
});

/* 19. xaSpacers: letterpress metal spacer blocks separating every glyph in chase frame */
reg('xaSpacers', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, step = Math.min(W * 0.82 / Math.max(1, n), u * 0.16);
  var specs = [];
  chars.forEach(function (ch, i) {
    var x = W / 2 + (i - (n - 1) / 2) * step;
    if (i > 0) H.layRectAt(c, 'Lead quad ' + i, x - step * 0.5, Hh / 2, step * 0.14, step * 0.8, { fill: sc.accent, alpha: 0.45 }, envAlpha(c, i * 0.03, 0.25, 0.45));
    specs.push({ text: ch, size: step * 0.72, x: x, y: Hh / 2, color: sc.fg, mi: i });
  });
  H.laySetNodes(c, specs);
});

/* 20. xaCutLine: dashed coupon perforation frame with directional scissor line */
reg('xaCutLine', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var bw = W * 0.78, bh = Hh * 0.52, x0 = (W - bw) / 2, y0 = (Hh - bh) / 2;
  for (var i = 0; i < 12; i++) {
    H.layRectAt(c, 'Cut dash T ' + i, mix(x0, x0 + bw, (i + 0.5) / 12), y0, bw / 20, 2.5, { fill: sc.accent, alpha: 0.85 }, envAlpha(c, 0, 0.3, 0.85));
    H.layRectAt(c, 'Cut dash B ' + i, mix(x0, x0 + bw, (i + 0.5) / 12), y0 + bh, bw / 20, 2.5, { fill: sc.accent, alpha: 0.85 }, envAlpha(c, 0, 0.3, 0.85));
  }
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, bw * 0.82, bh * 0.64), u * 0.17);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 21. xaChecklist: interactive checkbox items ticking completed phrases */
reg('xaChecklist', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), Math.min(3, Math.max(2, H.layChars(H.layText(c)).length >= 4 ? 3 : 2)));
  var rowH = Math.min(Hh * 0.18, u * 0.15), yStart = Hh / 2 - (chunks.length - 1) * rowH / 2, bx = W * 0.18, specs = [];
  chunks.forEach(function (ch, i) {
    var y = yStart + i * rowH, bsz = rowH * 0.48;
    H.layRRect(c, 'Chk box ' + i, bx - bsz / 2, y - bsz / 2, bsz, bsz, 4, { stroke: sc.accent, width: 2.5, alpha: 1 }, envAlpha(c, i * 0.04, 0.25));
    H.layRectAt(c, 'Chk fill ' + i, bx, y, bsz * 0.56, bsz * 0.56, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.12 + i * 0.06, 0.2));
    var sz = Math.min(H.layFitSize(c, ch, W * 0.6, rowH * 0.7), rowH * 0.62);
    specs.push({ text: ch, size: sz, x: bx + bsz * 1.1, y: y, align: 'left', color: sc.fg, mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 22. xaBlockquote: heavy vertical accent quote bar anchoring flush-left body copy */
reg('xaBlockquote', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var bx = W * 0.14;
  H.layRectAt(c, 'Blockquote bar', bx, Hh / 2, Math.max(6, u * 0.014), Hh * 0.52, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0, 0.3));
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, W * 0.7, Hh * 0.44, { font: serifFont(c) }), u * 0.15);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: sz, x: bx + u * 0.045, y: Hh / 2, align: 'left', color: sc.fg }]);
});

/* 23. xaScreenplay: courier film script page with character cue centered above dialogue */
reg('xaScreenplay', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), ls = smallSize(c);
  H.addText(c, 'Slugline', 'INT. STAGE - NIGHT  //  CUT ' + H.layLineNo(c), W * 0.14, Hh * 0.24, ls, { font: monoFont(c), align: 'left', color: sc.sub }, envAlpha(c, 0, 0.25));
  H.addText(c, 'Char cue', 'VOICE (CONT\'D)', W / 2, Hh * 0.36, ls * 1.05, { font: monoFont(c), color: sc.accent }, envAlpha(c, 0.06, 0.25));
  var txt = H.laySplitLines(H.layText(c), 12), sz = Math.min(H.layFitSize(c, txt, W * 0.62, Hh * 0.34, { font: monoFont(c) }), u * 0.1);
  H.laySetNodes(c, [{ text: txt, font: monoFont(c), size: sz, x: W / 2, y: Hh * 0.54, color: sc.fg }]);
});

/* 24. xaTearTabs: community flyer with fringed vertical tear-off tabs along bottom */
reg('xaTearTabs', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var fw = Math.min(W * 0.78, Hh * 0.95), fh = Hh * 0.72, x0 = (W - fw) / 2, y0 = (Hh - fh) / 2, C0 = cardPal(sc);
  H.layPaper(c, 'Flyer top', x0, y0, fw, fh * 0.74, 2, C0.fill, C0.line, 0.01, envAlpha(c, 0, 0.3));
  for (var t = 0; t < 6; t++) {
    var tx = x0 + t * (fw / 6);
    H.layPaper(c, 'Tear tab ' + t, tx + 2, y0 + fh * 0.75, fw / 6 - 4, fh * 0.25, 1, t === 2 ? sc.accent : C0.fill, C0.line, 0.004, envAlpha(c, 0.06 + t * 0.02, 0.25));
  }
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, fw * 0.82, fh * 0.5), u * 0.14);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: y0 + fh * 0.38, color: C0.text }]);
});

/* 25. xaBrace: curly brace grouping split phrases into unified key summary */
reg('xaBrace', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length >= 4 ? 2 : 1);
  H.addText(c, 'Brace glyph', '}', W * 0.64, Hh / 2, Hh * 0.38, { font: serifFont(c), color: sc.accent, alpha: 0.75 }, envAlpha(c, 0.05, 0.3, 0.75));
  H.addText(c, 'Brace label', H.layAltCopy(c), W * 0.72, Hh / 2, smallSize(c) * 1.1, { font: monoFont(c), align: 'left', color: sc.fg }, envAlpha(c, 0.1, 0.3));
  var sz = Math.min(H.layFitSize(c, chunks[0], W * 0.42, Hh * 0.22), u * 0.12);
  var specs = chunks.map(function (ch, i) {
    return { text: ch, size: sz, x: W * 0.54, y: Hh / 2 + (i - (chunks.length - 1) / 2) * sz * 1.35, align: 'right', color: sc.fg, mi: i * 2 };
  });
  H.laySetNodes(c, specs);
});

/* 26. xaNutrition: high-contrast nutrition-facts label ruled table framing bold headline */
reg('xaNutrition', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var pw = Math.min(W * 0.6, Hh * 0.62), ph = Hh * 0.78, x0 = (W - pw) / 2, y0 = (Hh - ph) / 2, C0 = cardPal(sc);
  H.layPaper(c, 'Nutri box', x0, y0, pw, ph, 0, C0.fill, C0.text, 0.01, envAlpha(c, 0, 0.3));
  H.layRRect(c, 'Nutri inner', x0 + 6, y0 + 6, pw - 12, ph - 12, 0, { stroke: C0.text, width: 3, alpha: 1 }, envAlpha(c, 0.02, 0.3));
  H.addText(c, 'Nutri hdr', 'SPEC FACTS', x0 + pw * 0.08, y0 + ph * 0.14, u * 0.036, { align: 'left', color: C0.text }, envAlpha(c, 0.04, 0.25));
  H.layRectAt(c, 'Nutri bar', W / 2, y0 + ph * 0.24, pw * 0.84, Math.max(6, u * 0.015), { fill: C0.text, alpha: 1 }, envAlpha(c, 0.06, 0.25));
  H.layRectAt(c, 'Nutri bar2', W / 2, y0 + ph * 0.76, pw * 0.84, Math.max(4, u * 0.008), { fill: C0.text, alpha: 1 }, envAlpha(c, 0.08, 0.25));
  H.addText(c, 'Nutri dv', '100% DAILY VALUE', W / 2, y0 + ph * 0.86, smallSize(c), { font: monoFont(c), color: sc.accent }, envAlpha(c, 0.1, 0.25));
  var txt = H.laySplitLines(H.layText(c), 7), sz = Math.min(H.layFitSize(c, txt, pw * 0.8, ph * 0.42), u * 0.13);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: y0 + ph * 0.5, color: C0.text }]);
});

/* 27. xaDogEar: crisp book leaf with folded triangular top-right page corner */
reg('xaDogEar', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var pw = Math.min(W * 0.7, Hh * 0.78), ph = Hh * 0.76, x0 = (W - pw) / 2, y0 = (Hh - ph) / 2, C0 = cardPal(sc);
  var fold = pw * 0.18, pts = [[x0, y0], [x0 + pw - fold, y0], [x0 + pw, y0 + fold], [x0 + pw, y0 + ph], [x0, y0 + ph]];
  H.layPolyAt(c, 'DogEar sheet', W / 2, Hh / 2, pts, true, { fill: C0.fill, stroke: C0.line, width: 2, alpha: 1 }, envAlpha(c, 0, 0.3));
  H.layPolyAt(c, 'DogEar flap', x0 + pw - fold / 2, y0 + fold / 2, [[x0 + pw - fold, y0], [x0 + pw, y0 + fold], [x0 + pw - fold, y0 + fold]], true, { fill: sc.accent, alpha: 0.9 }, envAlpha(c, 0.08, 0.25, 0.9));
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, pw * 0.76, ph * 0.6, { font: serifFont(c) }), u * 0.14);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: sz, x: W / 2, y: Hh / 2, color: C0.text }]);
});

/* 28. xaRuleSpecimen: showcase of varying horizontal rule weights framing clean copy */
reg('xaRuleSpecimen', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  [1, 3, 7].forEach(function (w, i) {
    H.layRectAt(c, 'Spec rule top ' + i, W / 2, Hh * (0.24 + i * 0.03), W * 0.78, w, { fill: i === 2 ? sc.accent : sc.sub, alpha: 0.85 }, envAlpha(c, i * 0.04, 0.25, 0.85));
    H.layRectAt(c, 'Spec rule bot ' + i, W / 2, Hh * (0.76 - i * 0.03), W * 0.78, w, { fill: i === 2 ? sc.accent : sc.sub, alpha: 0.85 }, envAlpha(c, i * 0.04, 0.25, 0.85));
  });
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, W * 0.76, Hh * 0.26, { font: serifFont(c) }), u * 0.15);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 29. xaLetterhead: formal executive stationery header with crest mark & body block */
reg('xaLetterhead', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var pw = Math.min(W * 0.72, Hh * 0.82), ph = Hh * 0.8, x0 = (W - pw) / 2, y0 = (Hh - ph) / 2, C0 = cardPal(sc);
  H.layPaper(c, 'Letterhead sheet', x0, y0, pw, ph, 2, C0.fill, C0.line, 0.01, envAlpha(c, 0, 0.3));
  H.layCircleAt(c, 'LH crest', x0 + pw * 0.14, y0 + ph * 0.12, u * 0.024, u * 0.024, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.04, 0.25));
  H.addText(c, 'LH org', 'JIZURA STUDIO  //  TOKYO - SEOUL', x0 + pw * 0.22, y0 + ph * 0.12, smallSize(c), { font: monoFont(c), align: 'left', color: C0.text }, envAlpha(c, 0.06, 0.25));
  H.line(c, 'LH rule', [[x0 + pw * 0.08, y0 + ph * 0.2], [x0 + pw * 0.92, y0 + ph * 0.2]], C0.line, 1.5, 0.65);
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, pw * 0.8, ph * 0.5, { font: serifFont(c) }), u * 0.13);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: sz, x: W / 2, y: y0 + ph * 0.56, color: C0.text }]);
});

/* 30. xaSwatchFan: fanned Pantone color swatch deck spreading open cleanly */
reg('xaSwatchFan', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var sw = Math.min(W * 0.34, u * 0.34), sh = sw * 1.48, pivY = Hh * 0.68;
  var cols = [sc.sub, sc.ink || sc.fg, sc.accent];
  cols.forEach(function (col, i) {
    var ang = (i - 1) * 18;
    H.layPaper(c, 'Swatch ' + i, W / 2 - sw / 2, pivY - sh * 0.8, sw, sh, 4, col, lightOf(sc), 0.008, function (env, f) {
      var open = E.outExpo(cl(env.t / 0.4));
      return { rot: ang * open, a: H.layTin(c, f, 0, 0.25) * H.layTout(c, f) };
    });
  });
  var txt = H.laySplitLines(H.layText(c), 6), sz = Math.min(H.layFitSize(c, txt, sw * 0.8, sh * 0.5), sw * 0.32);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2 + Math.sin(18 * DEG) * sh * 0.3, y: pivY - sh * 0.35, rot: 18, color: H.textOn(sc.accent, sc.bg, sc) }]);
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZPackHelpers);
