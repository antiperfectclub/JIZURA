/* JIZURA Cavalry Pack: layoutsC (33 print, editorial & paper-object layouts from src/11p_layoutsC.js; dictionary is in p_requested_layouts.js). */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, DEG = H.DEG, TAU = H.TAU;

function reg(key, fn, diffs) {
  N.register('layout', key, {
    source: 'src/11p_layoutsC.js (' + key + ')',
    scope: 'cut',
    build: fn,
    differences: diffs || ['Native Cavalry text nodes and editable vector geometry matching layoutsC:' + key + '.']
  });
}

function uMin(c) { return Math.min(c.comp.width, c.comp.height); }
function isPort(c) { return c.comp.height > c.comp.width * 1.08; }
function bodyFont(c) { return H.layFontObj(c, 'body'); }
function monoFont(c) { return H.layFontObj(c, 'mono'); }
function serifFont(c) { return H.layFontObj(c, 'serif'); }
function smallSize(c) { return cl(uMin(c) * 0.024, 12, 32); }
function cardPal(sc) {
  var fill = H.lum(sc.fg) > H.lum(sc.bg) ? sc.fg : sc.bg;
  var dk = H.lum(sc.fg) > H.lum(sc.bg) ? sc.bg : sc.fg;
  var text = H.textOn(fill, sc.bg, sc);
  var acc = H.layPlateCol(sc, [sc.accent, sc.accent2, sc.ink], fill, 1.8);
  var line = H.mixHex(fill, text, 0.32);
  var edge = H.contrast(fill, sc.bg) < 1.4 ? line : null;
  return { fill: fill, dk: dk, text: text, acc: acc, line: line, edge: edge };
}
function envAlpha(c, d, len, mul) {
  var m = mul == null ? 1 : mul;
  return function (env, f) {
    return { a: cl(H.layTin(c, f, d || 0, len || 0.35, E.outCubic) * H.layTout(c, f) * m, 0, 1) };
  };
}
function metaStr(c) {
  var t = H.layText(c), cnt = H.layChars(t).length;
  return 'No.' + H.layLineNo(c) + ' / ' + H.layFmtTime(c.cut.origin / c.comp.fps) + ' / ' + cnt + (H.layHasLatin(t) ? ' CH' : '');
}
function greekLines(c, name, x, y, w, h, rows, col, alpha, d) {
  var dy = h / Math.max(1, rows + 1), lh = Math.max(2, dy * 0.36);
  var segs = [], seed = H.laySeed(c);
  for (var i = 0; i < rows; i++) {
    var k = i === rows - 1 ? 0.55 : 0.72 + R.hash01(seed, i, 7) * 0.25;
    segs.push([x, y + (i + 1) * dy, x + w * k, y + (i + 1) * dy]);
  }
  var id = H.line(c, name, segs, col, lh, alpha);
  if (id) H.laySampleAt(c, id, x + w / 2, y + h / 2, envAlpha(c, d || 0.1, 0.35, alpha));
  return id;
}

/* 1. magazine: open two-page editorial spread unfolding from the spine */
reg('magazine', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), port = isPort(c), seed = H.laySeed(c);
  var C0 = cardPal(sc), txt = H.layText(c), vert = !H.layHasLatin(txt) && seed % 3 === 1;
  var pw = port ? W * 0.86 : Math.min(W * 0.43, Hh * 0.82 * 0.72);
  var ph = port ? Math.min(Hh * 0.43, pw * 0.98) : pw / 0.72;
  var cx = W / 2, cy = Hh / 2;
  var ax = port ? cx - pw / 2 : (vert ? cx : cx - pw), ay = port ? cy - ph : cy - ph / 2;
  var bx = port ? cx - pw / 2 : (vert ? cx - pw : cx), by = port ? cy : cy - ph / 2;
  H.layPaper(c, 'Magazine page A', ax, ay, pw, ph, 2, C0.fill, C0.edge, 0.009, envAlpha(c, 0, 0.3));
  H.layPaper(c, 'Magazine page B', bx, by, pw, ph, 2, H.mixHex(C0.fill, C0.dk, 0.04), C0.edge, 0.009, function (env, f) {
    var q = E.inOutCubic(cl((env.t - 0.06) / 0.45)) * H.layTout(c, f);
    return { sx: Math.max(0.05, q), sy: 1, a: q > 0.02 ? 1 : 0 };
  });
  var gutterPts = port ? [[cx - pw / 2, cy], [cx + pw / 2, cy]] : [[cx, cy - ph / 2], [cx, cy + ph / 2]];
  H.line(c, 'Magazine gutter', gutterPts, C0.line, Math.max(1.5, u * 0.002), 0.7);
  var mx = pw * 0.1, my = ph * 0.09, ls = cl(pw * 0.032, 10, 22);
  var kickers = ['FEATURE', 'ESSAY', 'INTERVIEW', 'COLUMN', 'STORY'];
  H.addText(c, 'Magazine kicker', kickers[seed % kickers.length], ax + mx, ay + my, ls, { font: monoFont(c), align: 'left', track: 0.14, color: C0.acc }, envAlpha(c, 0.08, 0.3));
  H.addText(c, 'Magazine folio', H.layLineNo(c), bx + pw - mx, by + ph - my * 0.7, ls * 0.9, { font: monoFont(c), align: 'right', color: C0.line }, envAlpha(c, 0.12, 0.3));
  var plateW = pw - mx * 2, plateH = ph * 0.42;
  H.layRectAt(c, 'Magazine plate', bx + pw / 2, by + my + plateH / 2 + ls, plateW, plateH, { fill: C0.acc, alpha: 0.9 }, envAlpha(c, 0.14, 0.35, 0.9));
  H.layCircleAt(c, 'Magazine motif', bx + pw / 2, by + my + plateH / 2 + ls, Math.min(plateW, plateH) * 0.28, Math.min(plateW, plateH) * 0.28, { fill: C0.fill, alpha: 0.9 }, envAlpha(c, 0.18, 0.35, 0.9));
  greekLines(c, 'Magazine body', bx + mx, by + my + plateH + ls * 1.6, plateW, ph - plateH - my * 2 - ls * 2, 5, C0.line, 0.55, 0.2);
  var disp = vert ? H.layStrip(txt) : H.laySplitLines(txt, port ? 9 : 6);
  var size = H.layFitSize(c, disp, pw - mx * 2, ph * 0.62, { font: serifFont(c), vertical: vert, lead: 1.15 });
  H.laySetNodes(c, [{ text: disp, font: serifFont(c), size: size, x: ax + pw / 2, y: ay + ph * 0.54, vertical: vert, lead: 1.15, color: C0.text }]);
});

/* 2. headlineDeck: editorial kicker rule + giant headline + subtitle deck */
reg('headlineDeck', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), port = isPort(c), seed = H.laySeed(c);
  var txt = H.laySplitLines(H.layText(c), port ? 6 : 10), deck = H.layAltCopy(c);
  var ks = ['FEATURE', 'COVER STORY', 'ESSAY', 'REPORT', 'ISSUE ' + H.layLineNo(c)];
  var kicker = ks[seed % ks.length];
  var size = Math.min(H.layFitSize(c, txt, W * 0.84, Hh * 0.44, { lead: 1.1 }), u * 0.2);
  var m = H.layMeasure(c, txt, size, { lead: 1.1 }), ls = smallSize(c), ds = cl(ls * 1.15, 13, 30);
  var mx = W * 0.08, x = seed % 3 === 1 ? W - mx : mx, align = x === mx ? 'left' : 'right';
  var yK = Hh * 0.2, yH = Hh * 0.48, yD = yH + m.h / 2 + ds * 1.8;
  H.layRectAt(c, 'Headline rule top', W / 2, yK + ls * 1.1, W * 0.84, Math.max(2, u * 0.0025), { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.04, 0.35));
  H.layRectAt(c, 'Headline rule mid', W / 2, yD - ds * 1.0, W * 0.84, Math.max(1, u * 0.0014), { fill: sc.sub, alpha: 0.7 }, envAlpha(c, 0.14, 0.35, 0.7));
  H.addText(c, 'Headline kicker', kicker, x, yK, ls, { font: monoFont(c), align: align, track: 0.16, color: sc.accent }, envAlpha(c, 0.06, 0.3));
  H.addText(c, 'Headline deck', H.laySplitLines(deck, port ? 18 : 34), x, yD, ds, { font: bodyFont(c), align: align, color: sc.sub, lead: 1.3 }, envAlpha(c, 0.18, 0.35));
  H.laySetNodes(c, [{ text: txt, size: size, x: x, y: yH, align: align, lead: 1.1, color: sc.fg }]);
});

/* 3. contents: table of contents with dotted leaders & highlighted lyric row */
reg('contents', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.layText(c), n = H.layChars(txt).length;
  var k = n <= 4 ? 1 : n <= 9 ? 2 : n <= 14 ? 3 : 4;
  var chunks = Array.isArray(P.chunks) && P.chunks.length ? P.chunks : H.laySplitK(txt, k);
  var rows = chunks.length, left = W * 0.1, right = W * 0.9, rowH = Math.min(Hh * 0.14, Hh * 0.56 / Math.max(1, rows));
  var y0 = Hh * 0.5 - (rows - 1) * rowH / 2, ls = smallSize(c);
  H.addText(c, 'Contents hdr', 'CONTENTS / ISSUE ' + H.layLineNo(c), left, y0 - rowH * 0.95, ls, { font: monoFont(c), align: 'left', track: 0.14, color: sc.sub }, envAlpha(c, 0.02, 0.3));
  H.layRectAt(c, 'Contents rule', W / 2, y0 - rowH * 0.62, W * 0.8, Math.max(1.5, u * 0.002), { fill: sc.fg, alpha: 0.8 }, envAlpha(c, 0.04, 0.3, 0.8));
  var sz = Math.min(rowH * 0.55, W * 0.52 / Math.max(4, Math.max.apply(null, chunks.map(function (ch) { return H.layChars(ch).length; }))));
  var specs = [];
  chunks.forEach(function (ch, i) {
    var y = y0 + i * rowH, pg = H.layPad2((i + 1) * 4 + (H.laySeed(c) % 9));
    var mW = H.layMeasure(c, ch, sz, { font: serifFont(c) }).w;
    var dotsX0 = Math.min(right - u * 0.14, left + mW + u * 0.03), dotsX1 = right - u * 0.07;
    if (dotsX1 > dotsX0 + u * 0.03) {
      var nD = Math.min(28, Math.max(3, Math.floor((dotsX1 - dotsX0) / (u * 0.018))));
      for (var d = 0; d < nD; d++) {
        var dx = mix(dotsX0, dotsX1, d / Math.max(1, nD - 1));
        H.layCircleAt(c, 'Leader ' + i + '_' + d, dx, y + sz * 0.08, Math.max(1.2, u * 0.002), Math.max(1.2, u * 0.002), { fill: sc.sub, alpha: 0.55 }, envAlpha(c, 0.08 + i * 0.05, 0.25, 0.55));
      }
    }
    H.addText(c, 'Page ' + i, pg, right, y, sz * 0.72, { font: monoFont(c), align: 'right', color: sc.accent }, envAlpha(c, 0.1 + i * 0.05, 0.25));
    specs.push({ text: ch, font: serifFont(c), size: sz, x: left, y: y, align: 'left', color: i === 0 ? sc.accent : sc.fg, mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 4. footnote: hero typography with numbered/asterisk superscript markers & bottom footnotes */
reg('footnote', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), port = isPort(c);
  var txt = H.layText(c), n = H.layChars(txt).length, k = n <= 3 ? 1 : n <= 8 ? 2 : 3;
  var chunks = H.laySplitK(txt, k), gap = H.layHasLatin(txt) ? ' ' : '';
  var disp = H.laySplitLines(chunks.join(gap), port ? 6 : 11);
  var size = Math.min(H.layFitSize(c, disp, W * 0.8, Hh * 0.42, { font: serifFont(c), lead: 1.25 }), u * 0.17);
  var m = H.layMeasure(c, disp, size, { font: serifFont(c), lead: 1.25 });
  var mx = W * 0.1, cy = Hh * 0.39, footY = Hh * 0.73, ls = smallSize(c);
  H.layRectAt(c, 'Footnote rule', mx + W * 0.18, footY - ls * 1.4, W * 0.36, Math.max(1.5, u * 0.002), { fill: sc.sub, alpha: 0.8 }, envAlpha(c, 0.1, 0.3, 0.8));
  var syms = ['*', '**', '***'];
  chunks.forEach(function (ch, i) {
    var note = syms[i % syms.length] + ' ' + H.layPad2(i + 1) + '  ' + ch + '  —  ' + H.layAltCopy(c);
    H.addText(c, 'Foot note ' + i, note, mx, footY + i * ls * 1.55, ls * 0.92, { font: bodyFont(c), align: 'left', color: i === 0 ? sc.accent : sc.sub }, envAlpha(c, 0.14 + i * 0.06, 0.3));
  });
  H.layCircleAt(c, 'Superscript badge', W / 2 + m.w / 2 + size * 0.15, cy - m.h / 2 + size * 0.18, size * 0.14, size * 0.14, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.12, 0.3));
  H.addText(c, 'Superscript num', '1', W / 2 + m.w / 2 + size * 0.15, cy - m.h / 2 + size * 0.18, size * 0.16, { font: monoFont(c), color: H.textOn(sc.accent, sc.bg, sc) }, envAlpha(c, 0.12, 0.3));
  H.laySetNodes(c, [{ text: disp, font: serifFont(c), size: size, x: W / 2, y: cy, lead: 1.25, color: sc.fg }]);
});

/* 5. proofread: editorial proof sheet with trim crop marks & red-pen correction callouts */
reg('proofread', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), port = isPort(c);
  var C0 = cardPal(sc), pen = H.layPlateCol(sc, [sc.accent, sc.accent2], C0.fill, 1.8);
  var pw = W * (port ? 0.86 : 0.78), ph = Hh * (port ? 0.76 : 0.72), x0 = (W - pw) / 2, y0 = (Hh - ph) / 2;
  var x1 = x0 + pw, y1 = y0 + ph, lw = Math.max(1.5, u * 0.002), g = u * 0.015, L = u * 0.032;
  H.layPaper(c, 'Proof sheet', x0, y0, pw, ph, 2, C0.fill, C0.edge, 0.009, envAlpha(c, 0, 0.3));
  [[x0, y0, -1, -1], [x1, y0, 1, -1], [x0, y1, -1, 1], [x1, y1, 1, 1]].forEach(function (q, idx) {
    H.line(c, 'Tombo H ' + idx, [[q[0] + q[2] * g, q[1]], [q[0] + q[2] * (g + L), q[1]]], sc.sub, lw, 0.7);
    H.line(c, 'Tombo V ' + idx, [[q[0], q[1] + q[3] * g], [q[0], q[1] + q[3] * (g + L)]], sc.sub, lw, 0.7);
  });
  var txt = H.laySplitLines(H.layText(c), port ? 6 : 10);
  var size = Math.min(H.layFitSize(c, txt, pw * 0.76, ph * 0.48, { font: serifFont(c), lead: 1.25 }), u * 0.14);
  var m = H.layMeasure(c, txt, size, { font: serifFont(c), lead: 1.25 });
  H.layCircleAt(c, 'Proof circle', W / 2 - m.w * 0.18, Hh / 2, m.w * 0.34, m.h * 0.56, { stroke: pen, width: lw * 1.4, alpha: 0.9 }, envAlpha(c, 0.16, 0.35, 0.9));
  H.line(c, 'Proof leader', [[W / 2 + m.w * 0.16, Hh / 2 - m.h * 0.25], [x1 - pw * 0.08, y0 + ph * 0.18]], pen, lw * 1.1, 0.85);
  var ls = smallSize(c);
  H.addText(c, 'Proof margin', 'OK / ' + H.layLineNo(c), x1 - pw * 0.08, y0 + ph * 0.14, ls, { font: monoFont(c), align: 'right', color: pen }, envAlpha(c, 0.2, 0.3));
  H.layRRect(c, 'Proof stamp', x1 - pw * 0.19, y1 - ph * 0.16, u * 0.08, u * 0.045, 4, { stroke: pen, width: lw * 1.2, alpha: 0.85 }, envAlpha(c, 0.24, 0.25, 0.85));
  H.addText(c, 'Proof stamp txt', 'REV', x1 - pw * 0.19 + u * 0.04, y1 - ph * 0.16 + u * 0.022, ls * 0.85, { font: monoFont(c), color: pen }, envAlpha(c, 0.24, 0.25));
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W / 2, y: Hh / 2, lead: 1.25, color: C0.text }]);
});

/* 6. numbered: stepped ordinal numerals (01, 02, ...) paired with lyric phrases */
reg('numbered', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), port = isPort(c);
  var txt = H.layText(c), n = H.layChars(txt).length;
  var chunks = n <= 3 ? H.layChars(txt).slice(0, 3) : H.laySplitK(txt, n <= 7 ? 2 : 3);
  var k = chunks.length, rowH = Math.min(Hh * 0.24, Hh * 0.7 / Math.max(1, k));
  var y0 = Hh / 2 - (k - 1) * rowH / 2;
  var sz = Math.min(rowH * 0.62, W * 0.56 / Math.max(3, Math.max.apply(null, chunks.map(function (ch) { return H.layChars(ch).length; }))));
  var numS = Math.min(rowH * 0.9, u * 0.16), specs = [];
  chunks.forEach(function (ch, i) {
    var y = y0 + i * rowH, num = H.layPad2(i + 1), nx = port ? W * 0.18 : W * (0.18 + i * 0.06);
    H.addText(c, 'Numeral ' + i, num, nx, y, numS, { font: monoFont(c), fill: false, stroke: true, strokeColor: sc.accent, strokeWidth: Math.max(1.5, numS * 0.03), alpha: 0.75 }, envAlpha(c, i * 0.06, 0.35, 0.75));
    if (i > 0) H.layRectAt(c, 'Row rule ' + i, W / 2, y - rowH / 2, W * 0.76, 1.5, { fill: sc.sub, alpha: 0.35 }, envAlpha(c, i * 0.05, 0.3, 0.35));
    specs.push({ text: ch, size: sz, x: nx + numS * 1.1, y: y, align: 'left', color: i === 0 ? sc.fg : sc.fg, mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 7. poster: bold Constructivist poster block with saturated band, disc motif & credits */
reg('poster', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), port = isPort(c);
  var blockC = H.layPlateCol(sc, [sc.accent, sc.ink, sc.fg], sc.bg, 1.6);
  var tc = H.textOn(blockC, sc.bg, sc), bh = Hh * (port ? 0.56 : 0.62), by = Hh * 0.08;
  H.layRRect(c, 'Poster block', W * 0.08, by, W * 0.84, bh, 4, { fill: blockC, alpha: 1 }, function (env, f) {
    var l = E.outExpo(cl(env.t / 0.45)) * H.layTout(c, f);
    return { y: by + bh * l / 2, sy: Math.max(0.01, l), a: l > 0.01 ? 1 : 0 };
  });
  var dr = Math.min(W, bh) * 0.2;
  H.layCircleAt(c, 'Poster disc', W * 0.76, by + bh * 0.74, dr, dr, { fill: H.layPlateCol(sc, [sc.accent2, sc.bg, sc.fg], blockC, 1.4), alpha: 0.9 }, envAlpha(c, 0.14, 0.35, 0.9));
  var ls = smallSize(c);
  H.addText(c, 'Poster header', 'POSTER SERIES / NO.' + H.layLineNo(c), W * 0.12, by + ls * 1.5, ls, { font: monoFont(c), align: 'left', track: 0.14, color: tc }, envAlpha(c, 0.08, 0.3));
  H.addText(c, 'Poster credits', metaStr(c) + '   //   ' + H.layAltCopy(c), W / 2, Hh * 0.84, ls, { font: monoFont(c), color: sc.sub }, envAlpha(c, 0.16, 0.35));
  var txt = H.laySplitLines(H.layText(c), port ? 6 : 9);
  var size = Math.min(H.layFitSize(c, txt, W * 0.72, bh * 0.66, { lead: 1.05 }), u * 0.22);
  H.laySetNodes(c, [{ text: txt, size: size, x: W * 0.12, y: by + bh * 0.54, align: 'left', lead: 1.05, color: tc }]);
});

/* 8. swissGrid: International Typographic Style modular grid + geometric block */
reg('swissGrid', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), port = isPort(c);
  var cols = port ? 3 : 4, rows = port ? 4 : 3, mx = W * 0.08, my = Hh * 0.1;
  var gw = W - mx * 2, gh = Hh - my * 2, cw = gw / cols, ch = gh / rows, lw = Math.max(1, u * 0.0014);
  for (var i = 0; i <= cols; i++) H.line(c, 'Grid V ' + i, [[mx + i * cw, my], [mx + i * cw, my + gh]], sc.sub, lw, 0.35);
  for (var j = 0; j <= rows; j++) H.line(c, 'Grid H ' + j, [[mx, my + j * ch], [mx + gw, my + j * ch]], sc.sub, lw, 0.35);
  var shapeCol = H.layPlateCol(sc, [sc.accent, sc.ink], sc.bg, 1.5);
  if (H.laySeed(c) % 2 === 0) {
    H.layCircleAt(c, 'Swiss disc', mx + cw * (cols - 0.5), my + ch * 0.5, Math.min(cw, ch) * 0.38, Math.min(cw, ch) * 0.38, { fill: shapeCol, alpha: 0.92 }, envAlpha(c, 0.08, 0.35, 0.92));
  } else {
    H.layRectAt(c, 'Swiss block', mx + cw * (cols - 0.5), my + ch * 0.5, cw * 0.84, ch * 0.84, { fill: shapeCol, alpha: 0.92 }, envAlpha(c, 0.08, 0.35, 0.92));
  }
  var txt = H.layText(c), chunks = H.laySplitK(txt, H.layChars(txt).length <= 5 ? 1 : 2);
  var specs = [], sz = Math.min(H.layFitSize(c, chunks[0], cw * (cols - 1) * 0.9, ch * 0.85), u * 0.16);
  chunks.forEach(function (part, idx) {
    var gx = mx + cw * (idx === 0 ? 0.1 : 1.1), gy = my + ch * (idx + 0.55);
    H.layRectAt(c, 'Cell rule ' + idx, gx + cw * 0.8, gy - ch * 0.38, cw * 1.6, Math.max(2, lw * 2), { fill: sc.fg, alpha: 0.9 }, envAlpha(c, 0.06 + idx * 0.05, 0.3, 0.9));
    specs.push({ text: part, size: sz, x: gx, y: gy, align: 'left', color: sc.fg, mi: idx * 3 });
  });
  var ls = smallSize(c);
  H.addText(c, 'Swiss label', 'GRID SYSTEM  //  ' + metaStr(c), mx + cw * 0.1, my + gh - ch * 0.3, ls, { font: monoFont(c), align: 'left', color: sc.sub }, envAlpha(c, 0.14, 0.3));
  H.laySetNodes(c, specs);
});

/* 10. ema: wooden votive plaque hanging from rack with cord */
reg('ema', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), port = isPort(c);
  var ew = Math.min(W * 0.78, Hh * (port ? 0.62 : 0.76)), eh = ew * 0.68, cx = W / 2, cy = Hh * 0.54;
  var roof = eh * 0.24, yTop = cy - eh / 2, yEave = yTop + roof, yBot = cy + eh / 2;
  var pts = [[cx, yTop], [cx + ew / 2, yEave], [cx + ew * 0.47, yBot], [cx - ew * 0.47, yBot], [cx - ew / 2, yEave]];
  var C0 = cardPal(sc), wood = H.mixHex(C0.fill, sc.accent, 0.12), ink = H.textOn(wood, sc.bg, sc);
  H.layRectAt(c, 'Ema rack', W / 2, yTop - u * 0.09, ew * 1.18, Math.max(4, u * 0.008), { fill: sc.sub, alpha: 0.7 }, envAlpha(c, 0, 0.3, 0.7));
  H.line(c, 'Ema cord', [[cx, yTop - u * 0.09], [cx, yTop + roof * 0.22]], sc.accent, Math.max(2, u * 0.004), 0.9);
  H.layPolyAt(c, 'Ema plaque', cx, cy, pts, true, { fill: wood, stroke: sc.sub, width: Math.max(1.5, u * 0.003), alpha: 1 }, function (env, f) {
    var sw = Math.sin(env.t * 2.1) * 3.5 * (1 - cl(env.t / 2.2) * 0.5);
    return { rot: sw, a: H.layTin(c, f, 0, 0.3) * H.layTout(c, f) };
  });
  H.layCircleAt(c, 'Ema hole', cx, yTop + roof * 0.32, u * 0.01, u * 0.01, { fill: sc.bg, stroke: sc.accent, width: 2, alpha: 1 }, envAlpha(c, 0.05, 0.3));
  var vert = !H.layHasLatin(H.layText(c)) && H.layChars(H.layText(c)).length <= 8;
  var disp = vert ? H.layStrip(H.layText(c)) : H.laySplitLines(H.layText(c), 8);
  var size = Math.min(H.layFitSize(c, disp, ew * 0.72, (eh - roof) * 0.68, { font: serifFont(c), vertical: vert, lead: 1.18 }), u * 0.12);
  H.laySetNodes(c, [{ text: disp, font: serifFont(c), size: size, x: cx, y: (yEave + yBot) / 2, vertical: vert, lead: 1.18, color: ink }]);
});

/* 11. ransom: mixed-font cut-out magazine scrap tiles per glyph */
reg('ransom', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), port = isPort(c), seed = H.laySeed(c);
  var chars = H.layChars(H.layText(c)), n = chars.length;
  var maxPer = port ? 5 : 8, rows = Math.max(1, Math.ceil(n / maxPer)), perR = Math.ceil(n / rows);
  var cw = Math.min(W * 0.84 / Math.max(1, perR * 1.16), Hh * 0.66 / Math.max(1, rows * 1.25), u * 0.18);
  var C0 = cardPal(sc), fills = [C0.fill, sc.ink || sc.fg, sc.accent, sc.sub];
  var fnts = [serifFont(c), bodyFont(c), monoFont(c)], specs = [];
  chars.forEach(function (ch, i) {
    var r = Math.floor(i / perR), col = i % perR, rowLen = Math.min(perR, n - r * perR);
    var cx = W / 2 + (col - (rowLen - 1) / 2) * cw * 1.14;
    var cy = Hh / 2 + (r - (rows - 1) / 2) * cw * 1.28;
    var rot = (R.hash01(seed, i, 2) * 2 - 1) * 9, scF = fills[R.hash(seed, i, 3) % fills.length];
    var tc = H.textOn(scF, sc.bg, sc);
    H.layRectAt(c, 'Scrap ' + i, cx, cy, cw * 0.96, cw * 1.06, { fill: scF, rot: rot, alpha: 1 }, envAlpha(c, i * 0.025, 0.25));
    specs.push({ text: ch, font: fnts[i % fnts.length], size: cw * 0.68, x: cx, y: cy, rot: rot, color: tc, mi: i });
  });
  H.laySetNodes(c, specs);
});

/* 12. newspaper: classic broadsheet front page with masthead, rules & halftone column */
reg('newspaper', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), port = isPort(c);
  var C0 = cardPal(sc), pw = Math.min(W * 0.84, Hh * 0.82), ph = Math.min(Hh * 0.84, pw * (port ? 1.28 : 0.92));
  var x0 = (W - pw) / 2, y0 = (Hh - ph) / 2, m = pw * 0.07;
  H.layPaper(c, 'Newsprint sheet', x0, y0, pw, ph, 2, C0.fill, C0.edge, 0.01, envAlpha(c, 0, 0.35));
  var ls = cl(pw * 0.036, 11, 24);
  H.addText(c, 'Newspaper masthead', 'THE DAILY CHRONICLE', W / 2, y0 + m + ls * 0.7, ls * 1.15, { font: serifFont(c), track: 0.14, color: C0.text }, envAlpha(c, 0.06, 0.3));
  H.layRectAt(c, 'News double rule', W / 2, y0 + m + ls * 1.8, pw - m * 2, Math.max(2, u * 0.003), { fill: C0.text, alpha: 0.9 }, envAlpha(c, 0.08, 0.3, 0.9));
  var photoW = (pw - m * 2) * 0.42, photoH = ph * 0.38, px = x0 + m + photoW / 2, py = y0 + m + ls * 2.5 + photoH / 2;
  H.layRectAt(c, 'News photo', px, py, photoW, photoH, { fill: C0.acc, alpha: 0.85 }, envAlpha(c, 0.12, 0.3, 0.85));
  H.layCircleAt(c, 'News photo orb', px, py - photoH * 0.08, photoW * 0.22, photoW * 0.22, { fill: C0.fill, alpha: 0.85 }, envAlpha(c, 0.14, 0.3, 0.85));
  greekLines(c, 'News col', x0 + m + photoW + m * 0.6, y0 + m + ls * 2.5, (pw - m * 2) - photoW - m * 0.6, photoH, 7, C0.line, 0.6, 0.16);
  var txt = H.laySplitLines(H.layText(c), 10);
  var size = Math.min(H.layFitSize(c, txt, pw - m * 2, ph * 0.3, { font: serifFont(c), lead: 1.1 }), u * 0.12);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W / 2, y: y0 + ph * 0.78, lead: 1.1, color: C0.text }]);
});

/* 13. vinyl: record sleeve with sliding LP disc, grooves & tone arm */
reg('vinyl', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), port = isPort(c);
  var sq = Math.min(W * (port ? 0.66 : 0.42), Hh * 0.68), sx = W / 2 - (port ? 0 : sq * 0.26), sy = Hh / 2 + (port ? sq * 0.12 : 0);
  var discX = port ? sx : sx + sq * 0.62, discY = port ? sy - sq * 0.45 : sy, r = sq * 0.46;
  var dk = H.lum(sc.fg) > H.lum(sc.bg) ? sc.bg : sc.fg, C0 = cardPal(sc);
  var sleeveCol = H.layPlateCol(sc, [sc.ink, sc.accent, C0.fill], sc.bg, 1.4);
  H.layCircleAt(c, 'Vinyl disc', discX, discY, r, r, { fill: dk, stroke: sc.sub, width: 2, alpha: 1 }, function (env, f) {
    var slide = E.outExpo(cl((env.t - 0.12) / 0.5)) * H.layTout(c, f);
    return { x: port ? sx : mix(sx, discX, slide), y: port ? mix(sy, discY, slide) : sy, rot: env.t * 38, a: H.layTin(c, f, 0.05, 0.25) * H.layTout(c, f) };
  });
  [0.82, 0.66, 0.5].forEach(function (k, gi) {
    H.layCircleAt(c, 'Vinyl groove ' + gi, discX, discY, r * k, r * k, { stroke: sc.sub, width: 1, alpha: 0.35 }, envAlpha(c, 0.15, 0.3, 0.35));
  });
  H.layCircleAt(c, 'Vinyl center label', discX, discY, r * 0.32, r * 0.32, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.15, 0.3));
  H.layCircleAt(c, 'Vinyl spindle', discX, discY, r * 0.05, r * 0.05, { fill: sc.bg, alpha: 1 }, envAlpha(c, 0.15, 0.3));
  H.layPaper(c, 'Vinyl sleeve', sx - sq / 2, sy - sq / 2, sq, sq, 4, sleeveCol, H.contrast(sleeveCol, sc.bg) < 1.3 ? sc.sub : null, 0.01, envAlpha(c, 0, 0.3));
  var tc = H.textOn(sleeveCol, sc.bg, sc), txt = H.laySplitLines(H.layText(c), 7);
  var size = Math.min(H.layFitSize(c, txt, sq * 0.8, sq * 0.55, { lead: 1.12 }), sq * 0.24);
  var ls = smallSize(c);
  H.addText(c, 'Vinyl side', 'SIDE A  /  33 RPM', sx, sy + sq * 0.36, ls * 0.85, { font: monoFont(c), color: tc, alpha: 0.75 }, envAlpha(c, 0.1, 0.3, 0.75));
  H.laySetNodes(c, [{ text: txt, size: size, x: sx, y: sy - sq * 0.04, lead: 1.12, color: tc }]);
});

/* 14. cassette: retro tape shell with reels, window & handwritten top label */
reg('cassette', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var cw = Math.min(W * 0.82, Hh * 1.15), ch = cw * 0.64, cx = W / 2, cy = Hh / 2;
  var C0 = cardPal(sc), shell = H.layPlateCol(sc, [sc.ink, sc.sub, C0.dk], sc.bg, 1.4);
  var labelCol = H.layPlateCol(sc, [C0.fill, sc.fg], shell, 1.8), tc = H.textOn(labelCol, shell, sc);
  H.layPaper(c, 'Cassette shell', cx - cw / 2, cy - ch / 2, cw, ch, cw * 0.03, shell, sc.sub, 0.01, envAlpha(c, 0, 0.3));
  var lw = cw * 0.86, lh = ch * 0.62, lx = cx - lw / 2, ly = cy - ch * 0.36;
  H.layRRect(c, 'Cassette label', lx, ly, lw, lh, cw * 0.02, { fill: labelCol, alpha: 1 }, envAlpha(c, 0.05, 0.3));
  H.layRRect(c, 'Cassette stripe', lx, ly + lh * 0.26, lw, lh * 0.16, 0, { fill: sc.accent, alpha: 0.9 }, envAlpha(c, 0.08, 0.3, 0.9));
  var winW = cw * 0.5, winH = ch * 0.22;
  H.layRRect(c, 'Tape window', cx - winW / 2, cy + ch * 0.02, winW, winH, winH * 0.45, { fill: sc.bg, stroke: sc.sub, width: 1.5, alpha: 0.92 }, envAlpha(c, 0.1, 0.3, 0.92));
  [-1, 1].forEach(function (side, idx) {
    H.layCircleAt(c, 'Tape reel ' + idx, cx + side * winW * 0.32, cy + ch * 0.02 + winH / 2, winH * 0.36, winH * 0.36, { fill: labelCol, stroke: sc.accent, width: 2, alpha: 1 }, envAlpha(c, 0.12, 0.3));
  });
  var txt = H.laySplitLines(H.layText(c), 12), size = Math.min(H.layFitSize(c, txt, lw * 0.88, lh * 0.3, { font: bodyFont(c) }), ch * 0.13);
  H.laySetNodes(c, [{ text: txt, font: bodyFont(c), size: size, x: cx, y: ly + lh * 0.15, color: tc }]);
});

/* 15. bookSpine: row of standing library books with the hero spine pulling out */
reg('bookSpine', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), seed = H.laySeed(c);
  var nb = isPort(c) ? 5 : 7, mid = Math.floor(nb / 2), baseW = Math.min(W * 0.78 / nb, u * 0.13);
  var baseY = Hh * 0.84, C0 = cardPal(sc), cols = [sc.sub, sc.ink || sc.fg, C0.fill, sc.accent2 || sc.accent];
  var specs = [];
  H.layRectAt(c, 'Bookshelf', W / 2, baseY + u * 0.015, W * 0.88, u * 0.02, { fill: sc.sub, alpha: 0.7 }, envAlpha(c, 0, 0.3, 0.7));
  for (var i = 0; i < nb; i++) {
    var hero = i === mid, bw = baseW * (hero ? 1.25 : 0.78 + R.hash01(seed, i, 2) * 0.25);
    var bh = Hh * (hero ? 0.62 : 0.46 + R.hash01(seed, i, 3) * 0.14);
    var bx = W / 2 + (i - mid) * baseW * 1.06, by = baseY - bh / 2 - (hero ? u * 0.035 : 0);
    var fill = hero ? sc.accent : cols[i % cols.length];
    H.layRRect(c, 'Book spine ' + i, bx - bw / 2, by - bh / 2, bw, bh, 3, { fill: fill, stroke: sc.bg, width: 1.5, alpha: hero ? 1 : 0.78 }, envAlpha(c, i * 0.04, 0.3, hero ? 1 : 0.78));
    if (hero) {
      var tc = H.textOn(fill, sc.bg, sc), vert = !H.layHasLatin(H.layText(c));
      var disp = vert ? H.layStrip(H.layText(c)) : H.laySplitLines(H.layText(c), 8);
      var size = Math.min(H.layFitSize(c, disp, bw * 0.74, bh * 0.78, { vertical: vert }), bw * 0.65);
      specs.push({ text: disp, font: serifFont(c), size: size, x: bx, y: by, vertical: vert, rot: vert ? 0 : -90, color: tc });
    }
  }
  H.laySetNodes(c, specs);
});

/* 16. polaroid: scattered instant photo prints with caption inside the bottom border */
reg('polaroid', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), port = isPort(c), seed = H.laySeed(c);
  var chunks = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length <= 6 ? 1 : 2);
  var C0 = cardPal(sc), pw = Math.min(W * (chunks.length > 1 ? 0.38 : 0.48), Hh * 0.56), ph = pw * 1.22;
  var specs = [];
  chunks.forEach(function (ch, i) {
    var cx = W / 2 + (chunks.length === 1 ? 0 : (i - 0.5) * pw * 1.12);
    var cy = Hh / 2 + (i % 2 ? -u * 0.02 : u * 0.02);
    var rot = (R.hash01(seed, i, 4) * 2 - 1) * 7;
    H.layPaper(c, 'Polaroid ' + i, cx - pw / 2, cy - ph / 2, pw, ph, 3, C0.fill, C0.edge, 0.012, envAlpha(c, i * 0.08, 0.3));
    var iw = pw * 0.86, ih = pw * 0.86;
    H.layRectAt(c, 'Photo well ' + i, cx, cy - ph * 0.08, iw, ih, { fill: i === 0 ? sc.accent : (sc.ink || sc.sub), rot: rot, alpha: 0.9 }, envAlpha(c, 0.1 + i * 0.08, 0.4, 0.9));
    H.layCircleAt(c, 'Photo sun ' + i, cx - iw * 0.18, cy - ph * 0.14, iw * 0.16, iw * 0.16, { fill: C0.fill, alpha: 0.7 }, envAlpha(c, 0.14 + i * 0.08, 0.35, 0.7));
    var size = Math.min(H.layFitSize(c, ch, pw * 0.82, ph * 0.16, { font: bodyFont(c) }), pw * 0.11);
    specs.push({ text: ch, font: bodyFont(c), size: size, x: cx, y: cy + ph * 0.39, rot: rot, color: C0.text, mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 17. stampSheet: perforated postage stamp sheet highlighting the center hero stamp */
reg('stampSheet', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), port = isPort(c);
  var cols = port ? 3 : 4, rows = port ? 4 : 3, sw = Math.min(W * 0.84 / cols, Hh * 0.78 / rows);
  var gw = cols * sw, gh = rows * sw, x0 = (W - gw) / 2, y0 = (Hh - gh) / 2, C0 = cardPal(sc);
  H.layPaper(c, 'Stamp selvage', x0 - sw * 0.14, y0 - sw * 0.14, gw + sw * 0.28, gh + sw * 0.28, 2, C0.fill, C0.edge, 0.01, envAlpha(c, 0, 0.3));
  for (var i = 1; i < cols; i++) H.line(c, 'Perf V ' + i, [[x0 + i * sw, y0], [x0 + i * sw, y0 + gh]], C0.line, 1.5, 0.45);
  for (var j = 1; j < rows; j++) H.line(c, 'Perf H ' + j, [[x0, y0 + j * sw], [x0 + gw, y0 + j * sw]], C0.line, 1.5, 0.45);
  var hx = x0 + Math.floor(cols / 2) * sw + sw / 2, hy = y0 + Math.floor(rows / 2) * sw + sw / 2;
  H.layRectAt(c, 'Hero stamp', hx, hy, sw * 0.88, sw * 0.88, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.1, 0.3));
  var tc = H.textOn(sc.accent, C0.fill, sc), txt = H.laySplitLines(H.layText(c), 6);
  var size = Math.min(H.layFitSize(c, txt, sw * 0.76, sw * 0.56, { lead: 1.1 }), sw * 0.25);
  H.addText(c, 'Stamp value', '84', hx + sw * 0.34, hy - sw * 0.32, sw * 0.12, { font: monoFont(c), align: 'right', color: tc }, envAlpha(c, 0.14, 0.25));
  H.laySetNodes(c, [{ text: txt, size: size, x: hx, y: hy + sw * 0.05, lead: 1.1, color: tc }]);
});

/* 18. postcard: mail card with corner stamp, zip code boxes & postmark circle */
reg('postcard', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), port = isPort(c);
  var pw = Math.min(W * 0.84, Hh * 1.15), ph = pw * (port ? 0.82 : 0.68), x0 = (W - pw) / 2, y0 = (Hh - ph) / 2;
  var C0 = cardPal(sc), m = pw * 0.07;
  H.layPaper(c, 'Postcard body', x0, y0, pw, ph, 4, C0.fill, C0.edge, 0.011, envAlpha(c, 0, 0.3));
  H.layRRect(c, 'Post stamp', x0 + m, y0 + m, pw * 0.12, pw * 0.15, 2, { fill: C0.acc, alpha: 0.95 }, envAlpha(c, 0.08, 0.3, 0.95));
  H.layCircleAt(c, 'Postmark ring', x0 + m + pw * 0.13, y0 + m + pw * 0.11, pw * 0.07, pw * 0.07, { stroke: C0.text, width: 1.8, alpha: 0.65 }, envAlpha(c, 0.18, 0.25, 0.65));
  for (var z = 0; z < 5; z++) {
    H.layRRect(c, 'Zip box ' + z, x0 + pw - m - (5 - z) * pw * 0.068, y0 + m, pw * 0.056, pw * 0.075, 2, { stroke: C0.acc, width: 1.5, alpha: 0.9 }, envAlpha(c, 0.06 + z * 0.02, 0.25, 0.9));
  }
  H.line(c, 'Postcard divider', [[W / 2, y0 + ph * 0.36], [W / 2, y0 + ph - m]], C0.line, 1.5, 0.55);
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, pw * 0.4, ph * 0.45, { font: serifFont(c), lead: 1.2 }), u * 0.1);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W * 0.72, y: y0 + ph * 0.64, lead: 1.2, color: C0.text }]);
});

/* 19. letterPaper: ruled stationery sheet with double margin border & vertical/horizontal copy */
reg('letterPaper', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), port = isPort(c);
  var pw = Math.min(W * 0.8, Hh * 0.95), ph = Math.min(Hh * 0.82, pw * (port ? 1.25 : 0.78)), x0 = (W - pw) / 2, y0 = (Hh - ph) / 2;
  var C0 = cardPal(sc), m = pw * 0.08, vert = !H.layHasLatin(H.layText(c)) && H.laySeed(c) % 2 === 0;
  H.layPaper(c, 'Letter sheet', x0, y0, pw, ph, 2, C0.fill, C0.edge, 0.01, envAlpha(c, 0, 0.35));
  H.layRRect(c, 'Letter frame', x0 + m * 0.5, y0 + m * 0.5, pw - m, ph - m, 0, { stroke: sc.accent, width: 1.5, alpha: 0.6 }, envAlpha(c, 0.06, 0.3, 0.6));
  for (var i = 1; i <= 5; i++) {
    var ry = y0 + m + (ph - m * 2) * (i / 6);
    H.line(c, 'Stationery rule ' + i, [[x0 + m, ry], [x0 + pw - m, ry]], C0.line, 1, 0.38);
  }
  var disp = vert ? H.layStrip(H.layText(c)) : H.laySplitLines(H.layText(c), 10);
  var size = Math.min(H.layFitSize(c, disp, pw - m * 2.4, ph - m * 2.4, { font: serifFont(c), vertical: vert, lead: 1.3 }), u * 0.12);
  H.laySetNodes(c, [{ text: disp, font: serifFont(c), size: size, x: W / 2, y: Hh / 2, vertical: vert, lead: 1.3, color: C0.text }]);
});

/* 20. calendar: tear-off daily pad / monthly grid spotlighting the lyric day */
reg('calendar', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var cw = Math.min(W * 0.7, Hh * 0.68), ch = cw * 1.15, x0 = (W - cw) / 2, y0 = (Hh - ch) / 2;
  var C0 = cardPal(sc), hdrH = ch * 0.22;
  H.layPaper(c, 'Calendar pad', x0, y0, cw, ch, 6, C0.fill, C0.edge, 0.012, envAlpha(c, 0, 0.3));
  H.layRRect(c, 'Calendar hdr', x0, y0, cw, hdrH, 4, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.04, 0.3));
  H.layCircleAt(c, 'Cal ring L', W / 2 - cw * 0.25, y0, u * 0.012, u * 0.012, { fill: C0.fill, stroke: C0.text, width: 2, alpha: 1 }, envAlpha(c, 0.06, 0.25));
  H.layCircleAt(c, 'Cal ring R', W / 2 + cw * 0.25, y0, u * 0.012, u * 0.012, { fill: C0.fill, stroke: C0.text, width: 2, alpha: 1 }, envAlpha(c, 0.06, 0.25));
  var tc = H.textOn(sc.accent, sc.bg, sc);
  H.addText(c, 'Cal month', 'DAY ' + H.layLineNo(c), W / 2, y0 + hdrH * 0.56, hdrH * 0.34, { font: monoFont(c), track: 0.14, color: tc }, envAlpha(c, 0.08, 0.3));
  var txt = H.laySplitLines(H.layText(c), 7), size = Math.min(H.layFitSize(c, txt, cw * 0.82, ch * 0.55, { lead: 1.1 }), cw * 0.24);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: y0 + hdrH + (ch - hdrH) * 0.5, lead: 1.1, color: C0.text }]);
});

/* 21. chochin: glowing paper festival lantern with top/bottom caps & ribs */
reg('chochin', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var lw = Math.min(W * 0.42, Hh * 0.38), lh = lw * 1.48, cx = W / 2, cy = Hh / 2;
  var bodyC = H.layPlateCol(sc, [sc.accent, sc.fg, sc.ink], sc.bg, 1.4), dk = H.lum(sc.fg) > H.lum(sc.bg) ? sc.bg : sc.fg;
  H.line(c, 'Chochin hanger', [[cx, 0], [cx, cy - lh * 0.54]], sc.sub, 2, 0.7);
  H.layCircleAt(c, 'Chochin glow', cx, cy, lw * 0.72, lh * 0.62, { fill: bodyC, alpha: 0.18 }, envAlpha(c, 0.05, 0.4, 0.18));
  H.layCircleAt(c, 'Chochin body', cx, cy, lw * 0.5, lh * 0.46, { fill: bodyC, stroke: dk, width: 2, alpha: 1 }, envAlpha(c, 0, 0.35));
  H.layRRect(c, 'Chochin top cap', cx - lw * 0.26, cy - lh * 0.5, lw * 0.52, lh * 0.07, 3, { fill: dk, alpha: 1 }, envAlpha(c, 0.02, 0.3));
  H.layRRect(c, 'Chochin bot cap', cx - lw * 0.24, cy + lh * 0.43, lw * 0.48, lh * 0.07, 3, { fill: dk, alpha: 1 }, envAlpha(c, 0.02, 0.3));
  var tc = H.textOn(bodyC, sc.bg, sc), vert = !H.layHasLatin(H.layText(c));
  var disp = vert ? H.layStrip(H.layText(c)) : H.laySplitLines(H.layText(c), 6);
  var size = Math.min(H.layFitSize(c, disp, lw * 0.74, lh * 0.68, { font: serifFont(c), vertical: vert }), lw * 0.38);
  H.laySetNodes(c, [{ text: disp, font: serifFont(c), size: size, x: cx, y: cy, vertical: vert, color: tc }]);
});

/* 22. routeMap: transit line diagram with station nodes carrying lyric stops */
reg('routeMap', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length <= 4 ? 2 : 3);
  var k = chunks.length, x0 = W * 0.16, x1 = W * 0.84, y = Hh * 0.52;
  H.line(c, 'Route rail', [[x0, y], [x1, y]], sc.accent, Math.max(4, u * 0.009), 0.9);
  var sz = Math.min(u * 0.068, W * 0.72 / Math.max(4, k * 4)), specs = [];
  chunks.forEach(function (ch, i) {
    var sx = mix(x0, x1, k === 1 ? 0.5 : i / (k - 1)), above = i % 2 === 0;
    H.layCircleAt(c, 'Station ' + i, sx, y, u * 0.018, u * 0.018, { fill: sc.bg, stroke: sc.fg, width: Math.max(3, u * 0.005), alpha: 1 }, envAlpha(c, i * 0.08, 0.25));
    H.addText(c, 'Station code ' + i, 'S' + H.layPad2(i + 1), sx, y + (above ? u * 0.045 : -u * 0.045), smallSize(c) * 0.9, { font: monoFont(c), color: sc.sub }, envAlpha(c, 0.1 + i * 0.06, 0.25));
    specs.push({ text: ch, size: sz, x: sx, y: y + (above ? -u * 0.095 : u * 0.095), color: sc.fg, mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 23. stationSign: railway platform sign board with directional accent stripe & badge */
reg('stationSign', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var bw = Math.min(W * 0.84, Hh * 1.3), bh = bw * 0.44, x0 = (W - bw) / 2, y0 = (Hh - bh) / 2;
  var C0 = cardPal(sc), ls = smallSize(c);
  H.layPaper(c, 'Station board', x0, y0, bw, bh, 6, C0.fill, C0.edge, 0.01, envAlpha(c, 0, 0.3));
  H.layRectAt(c, 'Station band', W / 2, y0 + bh * 0.74, bw, bh * 0.16, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.08, 0.3));
  H.layRRect(c, 'Station badge', x0 + bw * 0.06, y0 + bh * 0.12, bh * 0.22, bh * 0.22, 4, { stroke: sc.accent, width: Math.max(2, u * 0.004), alpha: 1 }, envAlpha(c, 0.08, 0.25));
  H.addText(c, 'Badge id', H.layLineNo(c), x0 + bw * 0.06 + bh * 0.11, y0 + bh * 0.23, ls, { font: monoFont(c), color: C0.text }, envAlpha(c, 0.1, 0.25));
  var btc = H.textOn(sc.accent, C0.fill, sc);
  H.addText(c, 'Station sub', H.layAltCopy(c), W / 2, y0 + bh * 0.74, ls, { font: monoFont(c), color: btc }, envAlpha(c, 0.12, 0.3));
  var txt = H.laySplitLines(H.layText(c), 10), size = Math.min(H.layFitSize(c, txt, bw * 0.74, bh * 0.46), bh * 0.32);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: y0 + bh * 0.38, color: C0.text }]);
});

/* 24. noren: split shopfront doorway curtains hung from bamboo rod */
reg('noren', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var units = H.layChars(H.layText(c)).length <= 4 ? H.layChars(H.layText(c)) : H.laySplitK(H.layText(c), 3);
  var k = Math.max(2, Math.min(4, units.length)), gw = Math.min(W * 0.84, Hh * 0.92), gh = Hh * 0.62;
  var pw = (gw - u * 0.015 * (k - 1)) / k, y0 = Hh * 0.2, x0 = (W - gw) / 2;
  var cloth = H.layPlateCol(sc, [sc.ink, sc.accent, sc.sub], sc.bg, 1.4), tc = H.textOn(cloth, sc.bg, sc);
  H.layRectAt(c, 'Noren rod', W / 2, y0 - u * 0.012, gw + u * 0.08, Math.max(4, u * 0.008), { fill: sc.sub, alpha: 0.85 }, envAlpha(c, 0, 0.3, 0.85));
  var specs = [], vert = !H.layHasLatin(H.layText(c));
  for (var i = 0; i < k; i++) {
    var px = x0 + i * (pw + u * 0.015), pcx = px + pw / 2;
    H.layRectAt(c, 'Noren flap ' + i, pcx, y0 + gh / 2, pw, gh, { fill: cloth, alpha: 1 }, function (env, f) {
      var sw = Math.sin(env.t * 1.9 + i * 0.6) * 2.2;
      return { rot: sw, a: H.layTin(c, f, i * 0.04, 0.3) * H.layTout(c, f) };
    });
    if (units[i]) {
      var sz = Math.min(H.layFitSize(c, units[i], pw * 0.74, gh * 0.68, { font: serifFont(c), vertical: vert }), pw * 0.56);
      specs.push({ text: units[i], font: serifFont(c), size: sz, x: pcx, y: y0 + gh * 0.52, vertical: vert, color: tc, mi: i * 2 });
    }
  }
  H.laySetNodes(c, specs);
});

/* 25. tanzaku: festival wish paper strips hanging from a swaying top branch */
reg('tanzaku', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length <= 6 ? 1 : 2);
  var k = chunks.length, C0 = cardPal(sc), vert = !H.layHasLatin(H.layText(c));
  H.line(c, 'Bamboo branch', [[W * 0.08, Hh * 0.14], [W * 0.92, Hh * 0.1]], sc.accent, Math.max(3, u * 0.006), 0.85);
  var sw = Math.min(W * 0.24, Hh * 0.18), sh = Hh * 0.58, specs = [];
  chunks.forEach(function (ch, i) {
    var sx = W / 2 + (i - (k - 1) / 2) * sw * 1.45, sy = Hh * 0.54;
    var fill = i === 0 ? C0.fill : H.layPlateCol(sc, [sc.accent, C0.fill], sc.bg, 1.4);
    H.line(c, 'Tanzaku string ' + i, [[sx, Hh * 0.12], [sx, sy - sh / 2]], sc.sub, 1.5, 0.8);
    H.layPaper(c, 'Tanzaku strip ' + i, sx - sw / 2, sy - sh / 2, sw, sh, 2, fill, C0.edge, 0.008, envAlpha(c, i * 0.08, 0.35));
    var size = Math.min(H.layFitSize(c, ch, sw * 0.72, sh * 0.78, { font: serifFont(c), vertical: vert }), sw * 0.55);
    specs.push({ text: ch, font: serifFont(c), size: size, x: sx, y: sy, vertical: vert, color: H.textOn(fill, sc.bg, sc), mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 26. omikuji: unfolded fortune slip with ruled compartments & header seal */
reg('omikuji', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var C0 = cardPal(sc), sw = Math.min(W * 0.44, Hh * 0.48), sh = Hh * 0.76, x0 = (W - sw) / 2, y0 = (Hh - sh) / 2;
  H.layPaper(c, 'Omikuji slip', x0, y0, sw, sh, 2, C0.fill, C0.edge, 0.01, function (env, f) {
    var unfold = E.outCubic(cl(env.t / 0.4)) * H.layTout(c, f);
    return { sy: Math.max(0.05, unfold), a: unfold > 0.01 ? 1 : 0 };
  });
  H.layRRect(c, 'Omikuji border', x0 + sw * 0.06, y0 + sh * 0.04, sw * 0.88, sh * 0.92, 0, { stroke: C0.acc, width: 1.5, alpha: 0.75 }, envAlpha(c, 0.08, 0.3, 0.75));
  H.layRectAt(c, 'Omikuji header band', W / 2, y0 + sh * 0.12, sw * 0.82, sh * 0.09, { fill: C0.acc, alpha: 0.9 }, envAlpha(c, 0.1, 0.3, 0.9));
  H.addText(c, 'Omikuji num', 'NO.' + H.layLineNo(c), W / 2, y0 + sh * 0.12, smallSize(c), { font: monoFont(c), color: H.textOn(C0.acc, C0.fill, sc) }, envAlpha(c, 0.12, 0.3));
  var vert = !H.layHasLatin(H.layText(c)), disp = vert ? H.layStrip(H.layText(c)) : H.laySplitLines(H.layText(c), 8);
  var size = Math.min(H.layFitSize(c, disp, sw * 0.72, sh * 0.62, { font: serifFont(c), vertical: vert }), sw * 0.42);
  H.laySetNodes(c, [{ text: disp, font: serifFont(c), size: size, x: W / 2, y: y0 + sh * 0.56, vertical: vert, color: C0.text }]);
});

/* 27. kakejiku: hanging scroll unrolling between wooden top rod & bottom roller */
reg('kakejiku', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var sw = Math.min(W * 0.52, Hh * 0.52), sh = Hh * 0.76, cx = W / 2, cy = Hh * 0.52, C0 = cardPal(sc);
  var mountCol = H.layPlateCol(sc, [sc.sub, sc.ink, sc.accent], sc.bg, 1.3);
  H.line(c, 'Scroll hanger', [[cx - sw * 0.25, cy - sh / 2], [cx, cy - sh / 2 - u * 0.08], [cx + sw * 0.25, cy - sh / 2]], sc.sub, 1.5, 0.8);
  H.layRRect(c, 'Scroll mount', cx - sw / 2, cy - sh / 2, sw, sh, 2, { fill: mountCol, alpha: 0.9 }, envAlpha(c, 0, 0.35, 0.9));
  H.layPaper(c, 'Scroll paper', cx - sw * 0.38, cy - sh * 0.36, sw * 0.76, sh * 0.7, 1, C0.fill, C0.edge, 0.005, envAlpha(c, 0.08, 0.35));
  H.layRRect(c, 'Scroll roller bot', cx - sw * 0.58, cy + sh / 2 - u * 0.014, sw * 1.16, u * 0.028, u * 0.01, { fill: C0.dk, alpha: 1 }, envAlpha(c, 0.04, 0.3));
  H.layRectAt(c, 'Hankou stamp', cx - sw * 0.26, cy + sh * 0.26, u * 0.032, u * 0.032, { fill: sc.accent, alpha: 0.9 }, envAlpha(c, 0.2, 0.25, 0.9));
  var vert = !H.layHasLatin(H.layText(c)), disp = vert ? H.layStrip(H.layText(c)) : H.laySplitLines(H.layText(c), 7);
  var size = Math.min(H.layFitSize(c, disp, sw * 0.62, sh * 0.58, { font: serifFont(c), vertical: vert }), sw * 0.34);
  H.laySetNodes(c, [{ text: disp, font: serifFont(c), size: size, x: cx, y: cy - sh * 0.02, vertical: vert, color: C0.text }]);
});

/* 28. shoji: sliding paper-screen lattice panels parting to reveal silhouette lyric */
reg('shoji', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), isPort(c) ? 6 : 9), C0 = cardPal(sc);
  var size = Math.min(H.layFitSize(c, txt, W * 0.76, Hh * 0.52, { font: serifFont(c) }), u * 0.18);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W / 2, y: Hh / 2, color: sc.fg }]);
  [-1, 1].forEach(function (side, si) {
    var pw = W * 0.44, gx = W / 2 + side * pw * 0.5;
    H.layRRect(c, 'Shoji door ' + si, gx - pw / 2, Hh * 0.08, pw, Hh * 0.84, 2, { fill: C0.fill, stroke: C0.line, width: 3, alpha: 0.78 }, function (env, f) {
      var open = E.inOutCubic(cl(env.t / 0.65)) * H.layTout(c, f);
      return { x: W / 2 + side * (pw * 0.5 + open * W * 0.34), a: 0.78 * H.layTout(c, f) };
    });
  });
});

/* 29. clapper: cinema slate board with hinged striped clapper sticks & scene metadata */
reg('clapper', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var cw = Math.min(W * 0.78, Hh * 1.15), ch = cw * 0.68, x0 = (W - cw) / 2, y0 = (Hh - ch) / 2;
  var dk = H.lum(sc.fg) > H.lum(sc.bg) ? sc.bg : sc.fg, lt = H.lum(sc.fg) > H.lum(sc.bg) ? sc.fg : sc.bg;
  var barH = ch * 0.14;
  H.layPaper(c, 'Slate board', x0, y0 + barH, cw, ch - barH, 4, dk, sc.sub, 0.01, envAlpha(c, 0, 0.3));
  H.layRectAt(c, 'Clapper top', W / 2, y0 + barH * 0.5, cw, barH, { fill: sc.accent, stroke: lt, width: 1.5, alpha: 1 }, function (env, f) {
    var clp = cl((env.t - 0.1) / 0.25);
    return { rot: (1 - E.outExpo(clp)) * -18, a: H.layTin(c, f, 0, 0.2) * H.layTout(c, f) };
  });
  H.line(c, 'Slate grid', [[x0 + cw * 0.08, y0 + ch * 0.42], [x0 + cw * 0.92, y0 + ch * 0.42]], sc.sub, 1.5, 0.5);
  var ls = smallSize(c);
  H.addText(c, 'Slate meta', 'SCENE ' + H.layLineNo(c) + '   //   TAKE 01', x0 + cw * 0.08, y0 + ch * 0.3, ls, { font: monoFont(c), align: 'left', color: lt }, envAlpha(c, 0.1, 0.3));
  var txt = H.laySplitLines(H.layText(c), 9), size = Math.min(H.layFitSize(c, txt, cw * 0.82, ch * 0.44), ch * 0.24);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: y0 + ch * 0.7, color: lt }]);
});

/* 30. warningLabel: industrial hazard decal with striped bar & bold caution header */
reg('warningLabel', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var lw = Math.min(W * 0.82, Hh * 1.35), lh = lw * 0.46, x0 = (W - lw) / 2, y0 = (Hh - lh) / 2;
  var C0 = cardPal(sc), warn = H.layPlateCol(sc, [sc.accent, sc.accent2, sc.fg], C0.fill, 1.5);
  H.layPaper(c, 'Warn card', x0, y0, lw, lh, 4, C0.fill, C0.text, 0.01, envAlpha(c, 0, 0.25));
  H.layRectAt(c, 'Warn header', W / 2, y0 + lh * 0.18, lw - u * 0.016, lh * 0.24, { fill: warn, alpha: 1 }, envAlpha(c, 0.04, 0.25));
  var tc = H.textOn(warn, C0.fill, sc);
  H.addText(c, 'Warn word', '!  CAUTION  //' + H.layLineNo(c), W / 2, y0 + lh * 0.18, lh * 0.13, { font: monoFont(c), track: 0.16, color: tc }, envAlpha(c, 0.06, 0.25));
  var txt = H.laySplitLines(H.layText(c), 10), size = Math.min(H.layFitSize(c, txt, lw * 0.84, lh * 0.48), lh * 0.34);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: y0 + lh * 0.62, color: C0.text }]);
});

/* 31. priceTag: hanging merchandise swing tag with punch hole, cord & barcode */
reg('priceTag', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var tw = Math.min(W * 0.56, Hh * 0.48), th = tw * 1.45, cx = W / 2, cy = Hh * 0.54;
  var chm = tw * 0.24, pts = [[cx - tw / 2 + chm, cy - th / 2], [cx + tw / 2 - chm, cy - th / 2], [cx + tw / 2, cy - th / 2 + chm], [cx + tw / 2, cy + th / 2], [cx - tw / 2, cy + th / 2], [cx - tw / 2, cy - th / 2 + chm]];
  var C0 = cardPal(sc);
  H.line(c, 'Tag string', [[cx, 0], [cx, cy - th / 2 + tw * 0.1]], sc.sub, 2, 0.8);
  H.layPolyAt(c, 'Swing tag', cx, cy, pts, true, { fill: C0.fill, stroke: C0.edge || C0.line, width: 2, alpha: 1 }, envAlpha(c, 0, 0.3));
  H.layCircleAt(c, 'Tag eyelet', cx, cy - th / 2 + tw * 0.12, u * 0.012, u * 0.012, { fill: sc.bg, stroke: sc.accent, width: 2.5, alpha: 1 }, envAlpha(c, 0.04, 0.25));
  var ls = smallSize(c);
  H.addText(c, 'Tag price', 'No.' + H.layLineNo(c) + '   1,980', cx, cy - th * 0.22, ls, { font: monoFont(c), color: sc.accent }, envAlpha(c, 0.08, 0.25));
  for (var b = 0; b < 10; b++) {
    var bx = cx - tw * 0.3 + b * tw * 0.066;
    H.layRectAt(c, 'Barcode ' + b, bx, cy + th * 0.34, (b % 3 === 0 ? 4 : 2), th * 0.1, { fill: C0.text, alpha: 0.75 }, envAlpha(c, 0.12, 0.25, 0.75));
  }
  var txt = H.laySplitLines(H.layText(c), 7), size = Math.min(H.layFitSize(c, txt, tw * 0.8, th * 0.44), tw * 0.3);
  H.laySetNodes(c, [{ text: txt, size: size, x: cx, y: cy + th * 0.04, color: C0.text }]);
});

/* 32. nameTag: "HELLO MY NAME IS" adhesive sticker badge */
reg('nameTag', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var nw = Math.min(W * 0.82, Hh * 1.25), nh = nw * 0.62, x0 = (W - nw) / 2, y0 = (Hh - nh) / 2;
  var C0 = cardPal(sc), hdrH = nh * 0.3;
  H.layPaper(c, 'Nametag sticker', x0, y0, nw, nh, 10, C0.fill, C0.edge, 0.012, envAlpha(c, 0, 0.3));
  H.layRRect(c, 'Nametag band', x0, y0, nw, hdrH, 8, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.04, 0.3));
  var tc = H.textOn(sc.accent, C0.fill, sc);
  H.addText(c, 'Nametag hello', 'HELLO  /  MY NAME IS', W / 2, y0 + hdrH * 0.52, hdrH * 0.34, { font: monoFont(c), track: 0.14, color: tc }, envAlpha(c, 0.06, 0.25));
  var txt = H.laySplitLines(H.layText(c), 9), size = Math.min(H.layFitSize(c, txt, nw * 0.82, nh * 0.5, { font: bodyFont(c) }), nh * 0.34);
  H.laySetNodes(c, [{ text: txt, font: bodyFont(c), size: size, x: W / 2, y: y0 + hdrH + (nh - hdrH) * 0.5, color: C0.text }]);
});

/* 33. stickyNotes: cascaded square post-it notes with folded corner shadows */
reg('stickyNotes', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), seed = H.laySeed(c);
  var n = H.layChars(H.layText(c)).length, k = n <= 4 ? 1 : n <= 9 ? 2 : 3;
  var chunks = H.laySplitK(H.layText(c), k), sz = Math.min(W * (k === 1 ? 0.44 : 0.32), Hh * 0.48);
  var C0 = cardPal(sc), cols = [sc.accent, C0.fill, sc.accent2 || sc.fg], specs = [];
  chunks.forEach(function (ch, i) {
    var cx = W / 2 + (i - (k - 1) / 2) * sz * 0.92, cy = Hh / 2 + (i % 2 ? u * 0.04 : -u * 0.04);
    var rot = (R.hash01(seed, i, 5) * 2 - 1) * 8, fill = cols[i % cols.length];
    H.layPaper(c, 'Sticky note ' + i, cx - sz / 2, cy - sz / 2, sz, sz, 2, fill, C0.edge, 0.01, envAlpha(c, i * 0.07, 0.3));
    H.layRectAt(c, 'Sticky band ' + i, cx, cy - sz * 0.41, sz, sz * 0.16, { fill: H.mixHex(fill, C0.dk, 0.14), rot: rot, alpha: 0.7 }, envAlpha(c, i * 0.07, 0.3, 0.7));
    var fSize = Math.min(H.layFitSize(c, ch, sz * 0.78, sz * 0.56, { font: bodyFont(c) }), sz * 0.32);
    specs.push({ text: ch, font: bodyFont(c), size: fSize, x: cx, y: cy + sz * 0.05, rot: rot, color: H.textOn(fill, sc.bg, sc), mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 34. karuta: paired reading & grab cards with circular initial emblem */
reg('karuta', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), port = isPort(c);
  var C0 = cardPal(sc), cw = Math.min(W * (port ? 0.36 : 0.28), Hh * 0.46), ch = cw * 1.42;
  var xL = W / 2 - cw * 0.65, xR = W / 2 + cw * 0.65, cy = Hh / 2;
  H.layPaper(c, 'Karuta yomi', xL - cw / 2, cy - ch / 2, cw, ch, 4, C0.fill, sc.accent, 0.012, envAlpha(c, 0, 0.3));
  H.layPaper(c, 'Karuta tori', xR - cw / 2, cy - ch / 2, cw, ch, 4, C0.fill, sc.accent, 0.012, envAlpha(c, 0.1, 0.3));
  H.layRRect(c, 'Karuta border L', xL - cw * 0.43, cy - ch * 0.44, cw * 0.86, ch * 0.88, 2, { stroke: sc.accent, width: 2, alpha: 0.8 }, envAlpha(c, 0.04, 0.3, 0.8));
  H.layRRect(c, 'Karuta border R', xR - cw * 0.43, cy - ch * 0.44, cw * 0.86, ch * 0.88, 2, { stroke: sc.accent, width: 2, alpha: 0.8 }, envAlpha(c, 0.14, 0.3, 0.8));
  var init = H.layChars(H.layText(c))[0] || 'A';
  H.layCircleAt(c, 'Karuta badge', xR, cy - ch * 0.16, cw * 0.24, cw * 0.24, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.16, 0.3));
  H.addText(c, 'Karuta initial', init, xR, cy - ch * 0.16, cw * 0.26, { font: serifFont(c), color: H.textOn(sc.accent, C0.fill, sc) }, envAlpha(c, 0.16, 0.3));
  var vert = !H.layHasLatin(H.layText(c)), disp = vert ? H.layStrip(H.layText(c)) : H.laySplitLines(H.layText(c), 6);
  var size = Math.min(H.layFitSize(c, disp, cw * 0.72, ch * 0.74, { font: serifFont(c), vertical: vert }), cw * 0.32);
  H.laySetNodes(c, [{ text: disp, font: serifFont(c), size: size, x: xL, y: cy, vertical: vert, color: C0.text }]);
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
