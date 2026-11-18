/* JIZURA Cavalry Pack: Wa Craft Themes (15 wz* layouts from src/11p_x2_waA.js). */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, DEG = H.DEG, TAU = H.TAU;

function reg(key, fn) {
  N.register('layout', key, {
    source: 'src/11p_x2_waA.js (' + key + ')',
    scope: 'cut',
    build: fn,
    differences: ['Native Cavalry text nodes and editable vector geometry matching ' + key + '.']
  });
}

function uMin(c) { return Math.min(c.comp.width, c.comp.height); }
function isPort(c) { return c.comp.height > c.comp.width * 1.08; }
function monoFont(c) { return H.layFontObj(c, 'mono'); }
function serifFont(c) { return H.layFontObj(c, 'serif'); }
function lightOf(sc) { return H.lum(sc.fg) > H.lum(sc.bg) ? sc.fg : sc.bg; }
function darkOf(sc) { return H.lum(sc.fg) > H.lum(sc.bg) ? sc.bg : sc.fg; }
function envAlpha(c, d, len, mul) {
  var m = mul == null ? 1 : mul;
  return function (env, f) {
    return { a: cl(H.layTin(c, f, d || 0, len || 0.35, E.outCubic) * H.layTout(c, f) * m, 0, 1) };
  };
}

/* 1. wzByobu: gold-bordered zigzag folding screen panels opening across center */
reg('wzByobu', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var k = 4, pw = Math.min(W * 0.21, u * 0.24), ph = Hh * 0.62;
  var paper = lightOf(sc), ink = darkOf(sc), vert = !H.layHasLatin(H.layText(c));
  var chunks = H.laySplitK(H.layText(c), Math.min(k, Math.max(1, H.layChars(H.layText(c)).length >= 4 ? 2 : 1)));
  for (var i = 0; i < k; i++) {
    var x = W / 2 + (i - (k - 1) / 2) * pw * 0.92;
    H.layPaper(c, 'Byobu panel ' + i, x - pw / 2, Hh / 2 - ph / 2, pw * 0.94, ph, 0, paper, sc.accent, 0.008, envAlpha(c, Math.abs(i - 1.5) * 0.06, 0.35));
  }
  var disp = vert ? H.layStrip(H.layText(c)) : H.laySplitLines(chunks.join('\n'), 8);
  var size = Math.min(H.layFitSize(c, disp, pw * 2.8, ph * 0.72, { font: serifFont(c), vertical: vert }), u * 0.14);
  H.laySetNodes(c, [{ text: disp, font: serifFont(c), size: size, x: W / 2, y: Hh / 2, vertical: vert, color: ink }]);
});

/* 2. wzNobori: tall vertical festival flags hanging from L-shaped poles */
reg('wzNobori', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length >= 5 ? 3 : 2);
  var k = chunks.length, fw = Math.min(W * 0.24, u * 0.22), fh = Hh * 0.64, vert = !H.layHasLatin(H.layText(c));
  var specs = [];
  chunks.forEach(function (ch, i) {
    var fx = W / 2 + (i - (k - 1) / 2) * fw * 1.45, fy = Hh * 0.54;
    var fill = i === 0 ? sc.accent : (sc.ink || sc.fg);
    H.line(c, 'Nobori pole ' + i, [[fx - fw * 0.6, Hh * 0.14], [fx + fw * 0.5, Hh * 0.14], [fx - fw * 0.6, Hh * 0.14], [fx - fw * 0.6, Hh * 0.9]], sc.sub, 3, 0.8);
    H.layRectAt(c, 'Nobori cloth ' + i, fx, fy, fw, fh, { fill: fill, alpha: 0.96 }, envAlpha(c, i * 0.06, 0.35, 0.96));
    var sz = Math.min(H.layFitSize(c, ch, fw * 0.72, fh * 0.76, { font: serifFont(c), vertical: vert }), fw * 0.55);
    specs.push({ text: ch, font: serifFont(c), size: sz, x: fx, y: fy, vertical: vert, color: H.textOn(fill, sc.bg, sc), mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 3. wzSenjafuda: bold double-bordered tall votive sticker slips slapped on wooden post */
reg('wzSenjafuda', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var sw = Math.min(W * 0.36, u * 0.32), sh = Hh * 0.74, paper = lightOf(sc), ink = darkOf(sc);
  var vert = !H.layHasLatin(H.layText(c));
  H.layPaper(c, 'Senjafuda slip', W / 2 - sw / 2, Hh / 2 - sh / 2, sw, sh, 2, paper, ink, 0.012, envAlpha(c, 0, 0.25));
  H.layRRect(c, 'Senjafuda inner', W / 2 - sw * 0.41, Hh / 2 - sh * 0.44, sw * 0.82, sh * 0.88, 0, { stroke: sc.accent, width: 3, alpha: 1 }, envAlpha(c, 0.04, 0.25));
  var disp = vert ? H.layStrip(H.layText(c)) : H.laySplitLines(H.layText(c), 6);
  var size = Math.min(H.layFitSize(c, disp, sw * 0.68, sh * 0.74, { font: serifFont(c), vertical: vert }), sw * 0.52);
  H.laySetNodes(c, [{ text: disp, font: serifFont(c), size: size, x: W / 2, y: Hh / 2, vertical: vert, color: ink }]);
});

/* 4. wzAndon: warm wooden grid box lantern glowing internally */
reg('wzAndon', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var aw = Math.min(W * 0.56, Hh * 0.54), ah = Hh * 0.72, cx = W / 2, cy = Hh / 2;
  H.layRRect(c, 'Andon glow', cx - aw * 0.65, cy - ah * 0.58, aw * 1.3, ah * 1.16, 20, { fill: sc.accent, alpha: 0.16 }, envAlpha(c, 0, 0.4, 0.16));
  H.layRRect(c, 'Andon frame', cx - aw / 2, cy - ah / 2, aw, ah, 4, { fill: lightOf(sc), stroke: darkOf(sc), width: Math.max(4, u * 0.01), alpha: 0.94 }, envAlpha(c, 0, 0.35, 0.94));
  var vert = !H.layHasLatin(H.layText(c)), disp = vert ? H.layStrip(H.layText(c)) : H.laySplitLines(H.layText(c), 8);
  var size = Math.min(H.layFitSize(c, disp, aw * 0.72, ah * 0.72, { font: serifFont(c), vertical: vert }), u * 0.14);
  H.laySetNodes(c, [{ text: disp, font: serifFont(c), size: size, x: cx, y: cy, vertical: vert, color: darkOf(sc) }]);
});

/* 5. wzShikishi: gold-edged square poem card with scattered asymmetric columns */
reg('wzShikishi', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var szCard = Math.min(W * 0.74, Hh * 0.74), paper = lightOf(sc), ink = darkOf(sc);
  H.layPaper(c, 'Shikishi card', W / 2 - szCard / 2, Hh / 2 - szCard / 2, szCard, szCard, 2, paper, sc.accent, 0.012, envAlpha(c, 0, 0.35));
  H.layRRect(c, 'Shikishi gold', W / 2 - szCard * 0.46, Hh / 2 - szCard * 0.46, szCard * 0.92, szCard * 0.92, 0, { stroke: sc.accent, width: 2.5, alpha: 0.85 }, envAlpha(c, 0.04, 0.3, 0.85));
  var chunks = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length >= 5 ? 2 : 1);
  var vert = !H.layHasLatin(H.layText(c)), specs = [];
  chunks.forEach(function (ch, i) {
    var x = W / 2 + (chunks.length === 1 ? 0 : (i === 0 ? szCard * 0.18 : -szCard * 0.18));
    var y = Hh / 2 + (i === 0 ? -szCard * 0.08 : szCard * 0.1);
    var fs = Math.min(H.layFitSize(c, ch, szCard * 0.34, szCard * 0.62, { font: serifFont(c), vertical: vert }), szCard * 0.16);
    specs.push({ text: ch, font: serifFont(c), size: fs, x: x, y: y, vertical: vert, color: ink, mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 6. wzFurin: round glass wind-chime bell swinging an airy hanging poetry strip */
reg('wzFurin', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var br = u * 0.1, bx = W / 2, by = Hh * 0.22;
  H.line(c, 'Chime hanger', [[bx, 0], [bx, by - br]], sc.sub, 2, 0.7);
  H.layCircleAt(c, 'Glass bell', bx, by, br, br, { fill: sc.accent, stroke: sc.fg, width: 2, alpha: 0.55 }, envAlpha(c, 0, 0.3, 0.55));
  H.line(c, 'Clapper cord', [[bx, by + br], [bx, Hh * 0.42]], sc.sub, 1.5, 0.8);
  var sw = Math.min(W * 0.24, u * 0.22), sh = Hh * 0.46, paper = lightOf(sc), ink = darkOf(sc);
  H.layPaper(c, 'Furin slip', bx - sw / 2, Hh * 0.42, sw, sh, 2, paper, sc.accent, 0.008, function (env, f) {
    return { rot: Math.sin(env.t * 2.5) * 5, a: H.layTin(c, f, 0.05, 0.3) * H.layTout(c, f) };
  });
  var vert = !H.layHasLatin(H.layText(c)), disp = vert ? H.layStrip(H.layText(c)) : H.laySplitLines(H.layText(c), 6);
  var sz = Math.min(H.layFitSize(c, disp, sw * 0.72, sh * 0.82, { font: serifFont(c), vertical: vert }), sw * 0.5);
  H.laySetNodes(c, [{
    text: disp, font: serifFont(c), size: sz, x: bx, y: Hh * 0.65, vertical: vert, color: ink,
    animPlace: function (env) { return { rot: Math.sin(env.t * 2.5) * 5 }; }
  }]);
});

/* 7. wzBanzuke: sumo ranking playbill stepping columns down in rank hierarchy */
reg('wzBanzuke', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), Math.min(3, Math.max(2, H.layChars(H.layText(c)).length >= 5 ? 3 : 2)));
  var paper = lightOf(sc), ink = darkOf(sc), vert = !H.layHasLatin(H.layText(c));
  H.layPaper(c, 'Banzuke sheet', W * 0.1, Hh * 0.1, W * 0.8, Hh * 0.8, 2, paper, ink, 0.01, envAlpha(c, 0, 0.3));
  var k = chunks.length, specs = [];
  chunks.forEach(function (ch, i) {
    var x = W * (0.7 - i * 0.2), fs = Math.min(u * (0.14 - i * 0.028), H.layFitSize(c, ch, W * 0.22, Hh * 0.64, { font: serifFont(c), vertical: vert }));
    specs.push({ text: ch, font: serifFont(c), size: fs, x: x, y: Hh / 2, vertical: vert, color: i === 0 ? sc.accent : ink, mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 8. wzTenugui: patterned horizontally unrolling hand-towel cloth banner */
reg('wzTenugui', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var tw = W * 0.86, th = Math.min(Hh * 0.44, u * 0.42), fill = H.layPlateCol(sc, [sc.ink, sc.accent, darkOf(sc)], sc.bg, 1.4);
  H.layRRect(c, 'Tenugui cloth', W / 2 - tw / 2, Hh / 2 - th / 2, tw, th, 2, { fill: fill, alpha: 1 }, function (env, f) {
    var p = E.outExpo(cl(env.t / 0.45)) * H.layTout(c, f);
    return { sx: Math.max(0.04, p), a: p > 0.01 ? 1 : 0 };
  });
  var tc = H.textOn(fill, sc.bg, sc);
  H.layRRect(c, 'Tenugui patch', W / 2 - tw * 0.34, Hh / 2 - th * 0.34, tw * 0.68, th * 0.68, 2, { fill: H.textOn(fill, sc.bg, sc), alpha: 0.94 }, envAlpha(c, 0.1, 0.3, 0.94));
  var txt = H.laySplitLines(H.layText(c), 10), size = Math.min(H.layFitSize(c, txt, tw * 0.6, th * 0.5, { font: serifFont(c) }), th * 0.34);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W / 2, y: Hh / 2, color: fill }]);
});

/* 9. wzChikkan: bound bamboo writing slips tied neatly with horizontal cord */
reg('wzChikkan', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = Math.min(8, Math.max(3, chars.length));
  var sw = Math.min(W * 0.8 / n * 0.84, u * 0.12), sh = Hh * 0.68, step = sw * 1.16;
  var paper = lightOf(sc), ink = darkOf(sc), specs = [];
  H.line(c, 'Tie cord top', [[W / 2 - n * step / 2, Hh * 0.24], [W / 2 + n * step / 2, Hh * 0.24]], sc.accent, 3, 0.85);
  H.line(c, 'Tie cord bot', [[W / 2 - n * step / 2, Hh * 0.76], [W / 2 + n * step / 2, Hh * 0.76]], sc.accent, 3, 0.85);
  for (var i = 0; i < n; i++) {
    var x = W / 2 + (i - (n - 1) / 2) * step;
    H.layPaper(c, 'Bamboo slip ' + i, x - sw / 2, Hh / 2 - sh / 2, sw, sh, 2, paper, sc.sub, 0.006, envAlpha(c, i * 0.03, 0.25));
    if (chars[i]) specs.push({ text: chars[i], font: serifFont(c), size: sw * 0.68, x: x, y: Hh / 2, color: ink, mi: i });
  }
  H.laySetNodes(c, specs);
});

/* 10. wzShogi: five-sided tapered wooden shogi pieces stamped onto grid */
reg('wzShogi', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, cols = Math.min(n, 5);
  var pw = Math.min(W * 0.8 / Math.max(1, cols * 1.2), u * 0.16), ph = pw * 1.24;
  var wood = lightOf(sc), ink = darkOf(sc), specs = [];
  chars.forEach(function (ch, i) {
    var r = Math.floor(i / cols), col = i % cols, rLen = Math.min(cols, n - r * cols);
    var cx = W / 2 + (col - (rLen - 1) / 2) * pw * 1.16, cy = Hh / 2 + (r - (Math.ceil(n / cols) - 1) / 2) * ph * 1.15;
    var pts = [[cx, cy - ph * 0.52], [cx + pw * 0.42, cy - ph * 0.25], [cx + pw * 0.5, cy + ph * 0.48], [cx - pw * 0.5, cy + ph * 0.48], [cx - pw * 0.42, cy - ph * 0.25]];
    H.layPolyAt(c, 'Shogi tile ' + i, cx, cy, pts, true, { fill: wood, stroke: sc.accent, width: 2, alpha: 1 }, envAlpha(c, i * 0.04, 0.25));
    specs.push({ text: ch, font: serifFont(c), size: pw * 0.56, x: cx, y: cy + ph * 0.06, color: i === 0 ? sc.accent : ink, mi: i });
  });
  H.laySetNodes(c, specs);
});

/* 11. wzNoshi: formal celebratory gift paper with crimson-and-white mizuhiki cord bow */
reg('wzNoshi', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var paper = lightOf(sc), ink = darkOf(sc), pw = Math.min(W * 0.78, u * 0.84), ph = pw * 0.66;
  H.layPaper(c, 'Noshi sheet', W / 2 - pw / 2, Hh / 2 - ph / 2, pw, ph, 2, paper, sc.sub, 0.01, envAlpha(c, 0, 0.3));
  H.line(c, 'Mizuhiki H', [[W / 2 - pw / 2, Hh / 2], [W / 2 + pw / 2, Hh / 2]], sc.accent, 4, 0.9);
  H.line(c, 'Mizuhiki V', [[W / 2, Hh / 2 - ph / 2], [W / 2, Hh / 2 + ph / 2]], sc.accent, 4, 0.9);
  H.layCircleAt(c, 'Mizuhiki knot', W / 2, Hh / 2, u * 0.032, u * 0.032, { fill: paper, stroke: sc.accent, width: 4, alpha: 1 }, envAlpha(c, 0.1, 0.25));
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, pw * 0.74, ph * 0.3, { font: serifFont(c) }), u * 0.11);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: sz, x: W / 2, y: Hh / 2 - ph * 0.24, color: ink }]);
});

/* 12. wzGenjiGumo: stylized rounded Emaki cloud bands framing lyrical poetry */
reg('wzGenjiGumo', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var bars = [[0.24, 0.26, 0.42], [0.76, 0.28, 0.36], [0.26, 0.74, 0.38], [0.74, 0.72, 0.42]];
  bars.forEach(function (b, i) {
    var cw = W * b[2], ch = u * 0.045, x = W * b[0] - cw / 2, y = Hh * b[1] - ch / 2;
    H.layRRect(c, 'Genji cloud ' + i, x, y, cw, ch, ch / 2, { fill: sc.accent, alpha: 0.72 }, envAlpha(c, i * 0.05, 0.35, 0.72));
  });
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, W * 0.74, Hh * 0.36, { font: serifFont(c) }), u * 0.16);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 13. wzTorii: monumental crimson gate arch silhouette framing centered text */
reg('wzTorii', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var gw = Math.min(W * 0.72, u * 0.8), col = sc.accent;
  H.layRRect(c, 'Torii kasagi', W / 2 - gw * 0.56, Hh * 0.18, gw * 1.12, u * 0.036, 4, { fill: col, alpha: 1 }, envAlpha(c, 0, 0.3));
  H.layRectAt(c, 'Torii nuki', W / 2, Hh * 0.3, gw * 0.86, u * 0.022, { fill: col, alpha: 0.9 }, envAlpha(c, 0.04, 0.3, 0.9));
  [-1, 1].forEach(function (side, i) {
    H.layRectAt(c, 'Torii pillar ' + i, W / 2 + side * gw * 0.3, Hh * 0.54, u * 0.032, Hh * 0.68, { fill: col, alpha: 0.95 }, envAlpha(c, 0.02, 0.3, 0.95));
  });
  var txt = H.laySplitLines(H.layText(c), 6), sz = Math.min(H.layFitSize(c, txt, gw * 0.5, Hh * 0.38, { font: serifFont(c) }), u * 0.15);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: sz, x: W / 2, y: Hh * 0.58, color: sc.fg }]);
});

/* 14. wzUchiwa: rounded paper paddle fan gently swaying around handle stem */
reg('wzUchiwa', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var r = Math.min(W * 0.34, Hh * 0.32), cy = Hh * 0.44, paper = lightOf(sc), ink = darkOf(sc);
  H.layRectAt(c, 'Uchiwa handle', W / 2, cy + r + u * 0.11, u * 0.024, u * 0.22, { fill: sc.sub, alpha: 0.9 }, envAlpha(c, 0, 0.3, 0.9));
  H.layCircleAt(c, 'Uchiwa paddle', W / 2, cy, r * 1.08, r * 0.96, { fill: paper, stroke: sc.accent, width: 3, alpha: 1 }, envAlpha(c, 0, 0.35));
  var txt = H.laySplitLines(H.layText(c), 7), sz = Math.min(H.layFitSize(c, txt, r * 1.5, r * 1.15, { font: serifFont(c) }), r * 0.42);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: sz, x: W / 2, y: cy, color: ink }]);
});

/* 15. wzSudare: slatted bamboo blind rolling upward to reveal serif lyric behind */
reg('wzSudare', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.46, { font: serifFont(c) }), u * 0.18);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
  for (var i = 0; i < 6; i++) {
    var y = Hh * (0.14 + i * 0.04);
    H.layRectAt(c, 'Sudare slat ' + i, W / 2, y, W * 0.86, u * 0.012, { fill: sc.accent, alpha: 0.72 }, envAlpha(c, i * 0.02, 0.25, 0.72));
  }
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
