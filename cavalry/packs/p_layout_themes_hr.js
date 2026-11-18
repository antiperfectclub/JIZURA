/* JIZURA Cavalry Pack: Horror Themes (12 hr* from horror1 + 15 hz* from x2_horrorA = 27 layouts). */
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
function darkOf(sc) { return H.lum(sc.fg) > H.lum(sc.bg) ? sc.bg : sc.fg; }
function lightOf(sc) { return H.lum(sc.fg) > H.lum(sc.bg) ? sc.fg : sc.bg; }
function envAlpha(c, d, len, mul) {
  var m = mul == null ? 1 : mul;
  return function (env, f) {
    return { a: cl(H.layTin(c, f, d || 0, len || 0.35, E.outCubic) * H.layTout(c, f) * m, 0, 1) };
  };
}

/* ==== horror1 (12 hr* layouts) ==== */

/* 1. hrFlashlight: sweeping circular flashlight beam across dark field */
reg('src/11p_horror1.js', 'hrFlashlight', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), isPort(c) ? 6 : 9);
  var size = Math.min(H.layFitSize(c, txt, W * 0.8, Hh * 0.44, { font: serifFont(c) }), u * 0.18);
  var beamR = u * 0.28;
  H.layCircleAt(c, 'Torch beam', W / 2, Hh / 2, beamR, beamR, { fill: sc.fg, stroke: sc.accent, width: 2, alpha: 0.14 }, function (env, f) {
    var px = W / 2 + Math.sin(env.t * 1.9) * W * 0.22;
    return { x: px, y: Hh / 2 + Math.cos(env.t * 1.3) * Hh * 0.08, a: 0.14 * H.layTin(c, f, 0, 0.25) * H.layTout(c, f) };
  });
  H.laySetNodes(c, [{
    text: txt, font: serifFont(c), size: size, x: W / 2, y: Hh / 2, color: sc.fg,
    clipRectFn: function (env) {
      var px = W / 2 + Math.sin(env.t * 1.9) * W * 0.22;
      var py = Hh / 2 + Math.cos(env.t * 1.3) * Hh * 0.08;
      return [px - beamR, py - beamR, px + beamR, py + beamR];
    }
  }]);
});

/* 2. hrDoorGap: bright vertical door crack peeping into darkness */
reg('src/11p_horror1.js', 'hrDoorGap', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var gapW = W * 0.34, txt = H.laySplitLines(H.layText(c), 5);
  var size = Math.min(H.layFitSize(c, txt, gapW * 0.82, Hh * 0.62, { font: serifFont(c) }), u * 0.15);
  H.layRectAt(c, 'Door crack glow', W / 2, Hh / 2, gapW, Hh, { fill: sc.accent, alpha: 0.12 }, envAlpha(c, 0, 0.3, 0.12));
  H.line(c, 'Door jamb L', [[W / 2 - gapW / 2, 0], [W / 2 - gapW / 2, Hh]], sc.sub, 3, 0.7);
  H.line(c, 'Door jamb R', [[W / 2 + gapW / 2, 0], [W / 2 + gapW / 2, Hh]], sc.sub, 3, 0.7);
  H.laySetNodes(c, [{
    text: txt, font: serifFont(c), size: size, x: W / 2, y: Hh / 2, color: sc.fg,
    clipRectFn: function (env, f) {
      var o = E.outCubic(cl(env.t / 0.45)) * H.layTout(c, f);
      var hw = gapW * 0.5 * cl(o, 0.04, 1);
      return [W / 2 - hw, 0, W / 2 + hw, Hh];
    }
  }]);
});

/* 3. hrWallScrawl: agitated jagged scrawled glyphs across scarred wall lines */
reg('src/11p_horror1.js', 'hrWallScrawl', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), seed = H.laySeed(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, step = Math.min(W * 0.82 / Math.max(1, n), u * 0.17);
  for (var i = 0; i < 4; i++) {
    var y = Hh * (0.28 + i * 0.14);
    H.line(c, 'Wall scratch ' + i, [[W * 0.12, y], [W * 0.88, y + (R.hash01(seed, i, 2) - 0.5) * u * 0.05]], sc.accent, 1.5, 0.35);
  }
  var specs = chars.map(function (ch, i) {
    return {
      text: ch, font: serifFont(c), size: step * (0.75 + R.hash01(seed, i, 3) * 0.35),
      x: W / 2 + (i - (n - 1) / 2) * step,
      y: Hh / 2 + (R.hash01(seed, i, 4) - 0.5) * u * 0.08,
      rot: (R.hash01(seed, i, 5) - 0.5) * 26,
      color: i === (seed % n) ? sc.accent : sc.fg, mi: i
    };
  });
  H.laySetNodes(c, specs);
});

/* 4. hrCctv: security monitor viewfinder with REC timestamp & camera brackets */
reg('src/11p_horror1.js', 'hrCctv', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var m = u * 0.06, L = u * 0.05, lw = 2.5;
  [[m, m, 1, 1], [W - m, m, -1, 1], [m, Hh - m, 1, -1], [W - m, Hh - m, -1, -1]].forEach(function (q, i) {
    H.line(c, 'CCTV corner ' + i, [[q[0] + q[2] * L, q[1]], [q[0], q[1]], [q[0], q[1] + q[3] * L]], sc.sub, lw, 0.85);
  });
  H.layCircleAt(c, 'REC dot', m + u * 0.04, m + u * 0.04, u * 0.01, u * 0.01, { fill: sc.accent, alpha: 1 }, function (env, f) {
    return { a: (Math.sin(env.t * 6) > 0 ? 1 : 0.2) * H.layTout(c, f) };
  });
  var ls = cl(u * 0.024, 12, 26);
  H.addText(c, 'CCTV CAM', 'REC // CAM-04 // ' + H.layFmtTime(c.cut.origin / c.comp.fps), m + u * 0.065, m + u * 0.04, ls, { font: monoFont(c), align: 'left', color: sc.fg }, envAlpha(c, 0, 0.25));
  H.addText(c, 'CCTV TC', 'NO.' + H.layLineNo(c), W - m - u * 0.03, Hh - m - u * 0.04, ls, { font: monoFont(c), align: 'right', color: sc.sub }, envAlpha(c, 0, 0.25));
  var txt = H.laySplitLines(H.layText(c), 9), size = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.44, { font: monoFont(c) }), u * 0.16);
  H.laySetNodes(c, [{ text: txt, font: monoFont(c), size: size, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 5. hrOuija: spirit board arc of glyphs traced by a wooden planchette cursor */
reg('src/11p_horror1.js', 'hrOuija', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, rx = W * 0.36, ry = Hh * 0.22;
  H.addText(c, 'Ouija YES', 'YES', W * 0.2, Hh * 0.22, u * 0.045, { font: serifFont(c), color: sc.sub }, envAlpha(c, 0, 0.3));
  H.addText(c, 'Ouija NO', 'NO', W * 0.8, Hh * 0.22, u * 0.045, { font: serifFont(c), color: sc.sub }, envAlpha(c, 0, 0.3));
  H.layCircleAt(c, 'Planchette lens', W / 2, Hh * 0.56, u * 0.08, u * 0.08, { stroke: sc.accent, width: 3, alpha: 0.9 }, function (env, f) {
    return { x: W / 2 + Math.sin(env.t * 1.4) * rx * 0.55, y: Hh * 0.54 + Math.cos(env.t * 1.1) * ry * 0.3, a: 0.9 * H.layTin(c, f, 0, 0.3) * H.layTout(c, f) };
  });
  var specs = chars.map(function (ch, i) {
    var a = mix(-0.85, 0.85, n === 1 ? 0.5 : i / (n - 1));
    return {
      text: ch, font: serifFont(c), size: Math.min(u * 0.12, W * 0.7 / Math.max(2, n)),
      x: W / 2 + Math.sin(a) * rx, y: Hh * 0.56 - Math.cos(a) * ry * 0.45,
      rot: a * 18, color: sc.fg, mi: i
    };
  });
  H.laySetNodes(c, specs);
});

/* 6. hrMissing: weather-worn "MISSING" dossier poster with blank silhouette frame */
reg('src/11p_horror1.js', 'hrMissing', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var pw = Math.min(W * 0.64, Hh * 0.62), ph = Hh * 0.8, x0 = (W - pw) / 2, y0 = (Hh - ph) / 2;
  var paper = lightOf(sc), ink = darkOf(sc);
  H.layPaper(c, 'Missing sheet', x0, y0, pw, ph, 2, paper, sc.sub, 0.01, envAlpha(c, 0, 0.3));
  H.layRectAt(c, 'Missing hdr', W / 2, y0 + ph * 0.1, pw * 0.88, ph * 0.12, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.04, 0.3));
  H.addText(c, 'Missing tag', 'MISSING  //  CASE ' + H.layLineNo(c), W / 2, y0 + ph * 0.1, ph * 0.048, { font: monoFont(c), color: H.textOn(sc.accent, paper, sc) }, envAlpha(c, 0.06, 0.25));
  H.layRectAt(c, 'Missing box', W / 2, y0 + ph * 0.4, pw * 0.58, ph * 0.36, { fill: ink, stroke: sc.sub, width: 2, alpha: 0.88 }, envAlpha(c, 0.08, 0.3, 0.88));
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, pw * 0.84, ph * 0.26, { font: serifFont(c) }), u * 0.1);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W / 2, y: y0 + ph * 0.74, color: ink }]);
});

/* 7. hrWrongOne: one discordant glyph subtly rotated & tinted in accent color */
reg('src/11p_horror1.js', 'hrWrongOne', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), seed = H.laySeed(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, odd = R.hash(seed, 4, 2) % Math.max(1, n);
  var step = Math.min(W * 0.84 / Math.max(1, n), u * 0.18);
  var specs = chars.map(function (ch, i) {
    var wrong = i === odd;
    return {
      text: ch, font: serifFont(c), size: step * 0.88,
      x: W / 2 + (i - (n - 1) / 2) * step, y: Hh / 2 + (wrong ? u * 0.025 : 0),
      rot: wrong ? 18 : 0, color: wrong ? sc.accent : sc.fg, mi: i
    };
  });
  H.laySetNodes(c, specs);
});

/* 8. hrRisingDark: glyphs emerging upward out of a dark bottom vignette */
reg('src/11p_horror1.js', 'hrRisingDark', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, W * 0.8, Hh * 0.5, { font: serifFont(c) }), u * 0.2);
  H.layRectAt(c, 'Dark pit', W / 2, Hh * 0.84, W, Hh * 0.34, { fill: darkOf(sc), alpha: 0.75 }, envAlpha(c, 0, 0.3, 0.75));
  H.laySetNodes(c, [{
    text: txt, font: serifFont(c), size: size, x: W / 2, y: Hh * 0.52, color: sc.fg,
    animPlace: function (env, f) {
      var up = E.outCubic(cl(env.t / 0.55));
      return { dy: (1 - up) * Hh * 0.18, a: up * H.layTout(c, f) };
    }
  }]);
});

/* 9. hrRedacted: declassified black censorship bars sliding off to reveal text */
reg('src/11p_horror1.js', 'hrRedacted', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length >= 5 ? 2 : 1);
  var size = Math.min(H.layFitSize(c, chunks.join('\n'), W * 0.78, Hh * 0.5, { font: monoFont(c) }), u * 0.16);
  var dk = darkOf(sc), specs = [];
  chunks.forEach(function (ch, i) {
    var y = Hh / 2 + (i - (chunks.length - 1) / 2) * size * 1.45;
    H.layRectAt(c, 'Redact bar ' + i, W / 2, y, W * 0.68, size * 1.15, { fill: dk, stroke: sc.accent, width: 1.5, alpha: 0.92 }, envAlpha(c, i * 0.08, 0.25, 0.92));
    specs.push({ text: ch, font: monoFont(c), size: size, x: W / 2, y: y, color: sc.fg, mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 10. hrStaticTv: analog CRT monitor housing with scanlines & glowing text */
reg('src/11p_horror1.js', 'hrStaticTv', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var tw = Math.min(W * 0.84, Hh * 1.25), th = tw * 0.68, x0 = (W - tw) / 2, y0 = (Hh - th) / 2;
  H.layRRect(c, 'CRT bezel', x0, y0, tw, th, 20, { stroke: sc.sub, width: Math.max(4, u * 0.012), alpha: 0.85 }, envAlpha(c, 0, 0.25, 0.85));
  for (var i = 0; i < 6; i++) {
    var sy = y0 + th * (0.18 + i * 0.13);
    H.line(c, 'CRT scan ' + i, [[x0 + 14, sy], [x0 + tw - 14, sy]], sc.sub, 1.5, 0.24);
  }
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, tw * 0.78, th * 0.56, { font: monoFont(c) }), u * 0.16);
  H.laySetNodes(c, [{ text: txt, font: monoFont(c), size: size, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 11. hrSpiritPhoto: polaroid-framed apparition ghost overlay behind subject text */
reg('src/11p_horror1.js', 'hrSpiritPhoto', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var pw = Math.min(W * 0.58, Hh * 0.56), ph = pw * 1.22, x0 = (W - pw) / 2, y0 = (Hh - ph) / 2;
  H.layRRect(c, 'Spirit print', x0, y0, pw, ph, 3, { stroke: sc.sub, width: 2, alpha: 0.7 }, envAlpha(c, 0, 0.3, 0.7));
  H.layCircleAt(c, 'Spirit silhouette', W / 2 + pw * 0.16, y0 + ph * 0.36, pw * 0.15, pw * 0.22, { fill: sc.accent, alpha: 0.22 }, envAlpha(c, 0.15, 0.4, 0.22));
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, pw * 0.8, ph * 0.46, { font: serifFont(c) }), u * 0.12);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W / 2, y: y0 + ph * 0.54, color: sc.fg }]);
});

/* 12. hrWrongShadow: text casting an impossibly inverted / angled shadow double */
reg('src/11p_horror1.js', 'hrWrongShadow', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.44, { font: serifFont(c) }), u * 0.18);
  H.addText(c, 'Wrong shadow', txt, W / 2 + u * 0.04, Hh * 0.5 + u * 0.04, size, { font: serifFont(c), rot: 180, color: sc.accent, alpha: 0.28 }, envAlpha(c, 0.08, 0.35, 0.28));
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W / 2, y: Hh * 0.46, color: sc.fg }]);
});

/* ==== x2_horrorA (15 hz* layouts) ==== */

/* 13. hzKeyhole: circular+trapezoid keyhole cutout revealing lyric inside */
reg('src/11p_x2_horrorA.js', 'hzKeyhole', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var kr = u * 0.16;
  H.layCircleAt(c, 'Keyhole circle', W / 2, Hh * 0.42, kr, kr, { stroke: sc.accent, width: 2.5, alpha: 0.75 }, envAlpha(c, 0, 0.3, 0.75));
  H.layPolyAt(c, 'Keyhole slot', W / 2, Hh * 0.62, [[W / 2 - kr * 0.45, Hh * 0.48], [W / 2 + kr * 0.45, Hh * 0.48], [W / 2 + kr * 0.82, Hh * 0.78], [W / 2 - kr * 0.82, Hh * 0.78]], true, { stroke: sc.sub, width: 2, alpha: 0.7 }, envAlpha(c, 0, 0.3, 0.7));
  var txt = H.laySplitLines(H.layText(c), 6), size = Math.min(H.layFitSize(c, txt, kr * 2.1, kr * 1.8, { font: serifFont(c) }), u * 0.12);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W / 2, y: Hh * 0.46, color: sc.fg }]);
});

/* 14. hzEmptyRoom: tiny isolated text inside vast empty perspective wireframe room */
reg('src/11p_x2_horrorA.js', 'hzEmptyRoom', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var iw = W * 0.36, ih = Hh * 0.36, ix0 = (W - iw) / 2, iy0 = (Hh - ih) / 2;
  H.layRRect(c, 'Far wall', ix0, iy0, iw, ih, 0, { stroke: sc.sub, width: 1.5, alpha: 0.45 }, envAlpha(c, 0, 0.35, 0.45));
  [[0, 0, ix0, iy0], [W, 0, ix0 + iw, iy0], [0, Hh, ix0, iy0 + ih], [W, Hh, ix0 + iw, iy0 + ih]].forEach(function (q, i) {
    H.line(c, 'Room corner ' + i, [[q[0], q[1]], [q[2], q[3]]], sc.sub, 1.5, 0.35);
  });
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, iw * 0.82, ih * 0.64, { font: serifFont(c) }), u * 0.08);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 15. hzWrongCopy: triplet of identical lines where one phantom line shifts off */
reg('src/11p_x2_horrorA.js', 'hzWrongCopy', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.layFlat(H.layText(c)), size = Math.min(H.layFitSize(c, txt, W * 0.72, Hh * 0.16, { font: serifFont(c) }), u * 0.09);
  var specs = [0, 1, 2].map(function (i) {
    var wrong = i === 1;
    return {
      text: txt, font: serifFont(c), size: size,
      x: W / 2 + (wrong ? u * 0.045 : 0), y: Hh * (0.3 + i * 0.2),
      rot: wrong ? -2.5 : 0, color: wrong ? sc.accent : sc.fg, alpha: wrong ? 1 : 0.45, mi: i * 2
    };
  });
  H.laySetNodes(c, specs);
});

/* 16. hzHangSign: snapped-wire crooked hanging storefront sign swaying slowly */
reg('src/11p_x2_horrorA.js', 'hzHangSign', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var sw = Math.min(W * 0.68, u * 0.68), sh = sw * 0.42;
  H.line(c, 'Sign wire L', [[W / 2 - sw * 0.36, 0], [W / 2 - sw * 0.36, Hh / 2 - sh / 2]], sc.sub, 1.5, 0.7);
  H.layRRect(c, 'Tilted sign', W / 2 - sw / 2, Hh / 2 - sh / 2, sw, sh, 4, { stroke: sc.fg, width: 2.5, alpha: 0.9 }, function (env, f) {
    return { rot: 11 + Math.sin(env.t * 1.8) * 3, a: 0.9 * H.layTin(c, f, 0, 0.3) * H.layTout(c, f) };
  });
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, sw * 0.82, sh * 0.66), sh * 0.44);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: Hh / 2, rot: 11, color: sc.fg }]);
});

/* 17. hzElevator: elevator floor-indicator panel displaying impossible negative/blank floor */
reg('src/11p_x2_horrorA.js', 'hzElevator', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var pw = Math.min(W * 0.64, Hh * 0.95), ph = Hh * 0.66, x0 = (W - pw) / 2, y0 = (Hh - ph) / 2;
  H.layRRect(c, 'Elev frame', x0, y0, pw, ph, 4, { stroke: sc.sub, width: 2.5, alpha: 0.8 }, envAlpha(c, 0, 0.3, 0.8));
  H.line(c, 'Elev seam', [[W / 2, y0 + ph * 0.22], [W / 2, y0 + ph]], sc.sub, 1.5, 0.4);
  H.addText(c, 'Elev floor', 'B13  ▼', W / 2, y0 + ph * 0.11, u * 0.04, { font: monoFont(c), color: sc.accent }, envAlpha(c, 0.05, 0.25));
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, pw * 0.8, ph * 0.46), u * 0.14);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: y0 + ph * 0.6, color: sc.fg }]);
});

/* 18. hzReflection: calm text above waterline with lagged/flipped water reflection below */
reg('src/11p_x2_horrorA.js', 'hzReflection', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  H.line(c, 'Water horizon', [[W * 0.08, Hh * 0.54], [W * 0.92, Hh * 0.54]], sc.sub, 1.5, 0.5);
  var txt = H.laySplitLines(H.layText(c), 9), size = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.32, { font: serifFont(c) }), u * 0.15);
  H.addText(c, 'Mirror ghost', txt, W / 2, Hh * 0.69, size, { font: serifFont(c), color: sc.accent, alpha: 0.32 }, function (env, f) {
    return { 'scale.y': -0.85, 'position.x': Math.sin(env.t * 3.1) * u * 0.012, alpha: 0.32 * H.layTin(c, f, 0.15, 0.35) * H.layTout(c, f) };
  });
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W / 2, y: Hh * 0.38, color: sc.fg }]);
});

/* 19. hzFogWindow: misted condensation glass panes cleared along central wipe band */
reg('src/11p_x2_horrorA.js', 'hzFogWindow', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ww = W * 0.76, wh = Hh * 0.7, x0 = (W - ww) / 2, y0 = (Hh - wh) / 2;
  H.layRRect(c, 'Window sash', x0, y0, ww, wh, 4, { stroke: sc.sub, width: 2.5, alpha: 0.7 }, envAlpha(c, 0, 0.3, 0.7));
  H.line(c, 'Mullion V', [[W / 2, y0], [W / 2, y0 + wh]], sc.sub, 2, 0.45);
  H.line(c, 'Mullion H', [[x0, Hh / 2], [x0 + ww, Hh / 2]], sc.sub, 2, 0.45);
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, ww * 0.8, wh * 0.5, { font: bodyFont(c) }), u * 0.16);
  H.laySetNodes(c, [{ text: txt, font: bodyFont(c), size: size, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 20. hzVoicemail: unknown caller UI bar with jittering audio waveform & transcript */
reg('src/11p_x2_horrorA.js', 'hzVoicemail', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), seed = H.laySeed(c);
  H.addText(c, 'Caller ID', 'UNKNOWN NUMBER  //  00:00:' + H.layLineNo(c), W / 2, Hh * 0.24, cl(u * 0.025, 12, 26), { font: monoFont(c), color: sc.accent }, envAlpha(c, 0, 0.25));
  for (var i = 0; i < 14; i++) {
    var bx = W * 0.2 + i * W * 0.6 / 13, bh = u * (0.02 + R.hash01(seed, i, 2) * 0.08);
    H.layRectAt(c, 'VM bar ' + i, bx, Hh * 0.35, Math.max(3, u * 0.008), bh, { fill: sc.sub, alpha: 0.65 }, envAlpha(c, i * 0.02, 0.25, 0.65));
  }
  var txt = H.laySplitLines(H.layText(c), 9), size = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.38, { font: monoFont(c) }), u * 0.14);
  H.laySetNodes(c, [{ text: txt, font: monoFont(c), size: size, x: W / 2, y: Hh * 0.58, color: sc.fg }]);
});

/* 21. hzStreetLamp: solitary overhead streetlamp casting steep diagonal light cone */
reg('src/11p_x2_horrorA.js', 'hzStreetLamp', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  H.layCircleAt(c, 'Lamp bulb', W / 2, Hh * 0.1, u * 0.018, u * 0.018, { fill: sc.fg, alpha: 0.9 }, envAlpha(c, 0, 0.2, 0.9));
  H.layPolyAt(c, 'Lamp cone', W / 2, Hh * 0.52, [[W / 2 - u * 0.02, Hh * 0.1], [W / 2 + u * 0.02, Hh * 0.1], [W * 0.82, Hh * 0.92], [W * 0.18, Hh * 0.92]], true, { fill: sc.fg, alpha: 0.12 }, envAlpha(c, 0.04, 0.3, 0.12));
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, W * 0.7, Hh * 0.42, { font: serifFont(c) }), u * 0.16);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W / 2, y: Hh * 0.58, color: sc.fg }]);
});

/* 22. hzTornNote: jagged torn memo scrap split down a diagonal fault line */
reg('src/11p_x2_horrorA.js', 'hzTornNote', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var pw = Math.min(W * 0.72, u * 0.72), ph = pw * 0.66, cx = W / 2, cy = Hh / 2;
  var paper = lightOf(sc), ink = darkOf(sc);
  var pts = [[cx - pw / 2, cy - ph / 2], [cx + pw / 2, cy - ph / 2], [cx + pw / 2, cy + ph * 0.18], [cx + pw * 0.25, cy + ph * 0.46], [cx - pw * 0.1, cy + ph * 0.32], [cx - pw / 2, cy + ph * 0.5]];
  H.layPolyAt(c, 'Torn note', cx, cy, pts, true, { fill: paper, stroke: sc.sub, width: 1.5, alpha: 1 }, envAlpha(c, 0, 0.3));
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, pw * 0.78, ph * 0.54, { font: bodyFont(c) }), u * 0.13);
  H.laySetNodes(c, [{ text: txt, font: bodyFont(c), size: size, x: cx, y: cy - ph * 0.04, rot: -3, color: ink }]);
});

/* 23. hzUnderDoor: thin horizontal floor gap beneath heavy door edge */
reg('src/11p_x2_horrorA.js', 'hzUnderDoor', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var slitH = Math.min(Hh * 0.26, u * 0.24), y0 = Hh * 0.72;
  H.layRectAt(c, 'Under door glow', W / 2, y0, W * 0.88, slitH, { fill: sc.accent, alpha: 0.16 }, envAlpha(c, 0, 0.3, 0.16));
  H.line(c, 'Door bottom', [[W * 0.06, y0 - slitH / 2], [W * 0.94, y0 - slitH / 2]], sc.sub, 3, 0.8);
  var txt = H.layFlat(H.layText(c)), size = Math.min(H.layFitSize(c, txt, W * 0.78, slitH * 0.76, { font: serifFont(c) }), slitH * 0.65);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W / 2, y: y0, color: sc.fg }]);
});

/* 24. hzSlats: Venetian louver slats masking parts of the hidden message */
reg('src/11p_x2_horrorA.js', 'hzSlats', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.5, { font: serifFont(c) }), u * 0.18);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W / 2, y: Hh / 2, color: sc.fg }]);
  for (var i = 0; i < 6; i++) {
    var y = Hh * (0.2 + i * 0.12);
    H.layRectAt(c, 'Closet slat ' + i, W / 2, y, W * 0.86, Hh * 0.036, { fill: darkOf(sc), alpha: 0.72 }, envAlpha(c, 0.04, 0.3, 0.72));
  }
});

/* 25. hzStoppedClock: circular clock dial with stuttering frozen second hand */
reg('src/11p_x2_horrorA.js', 'hzStoppedClock', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var r = Math.min(W, Hh) * 0.36;
  H.layCircleAt(c, 'Clock dial', W / 2, Hh / 2, r, r, { stroke: sc.sub, width: 2.5, alpha: 0.65 }, envAlpha(c, 0, 0.3, 0.65));
  for (var h = 0; h < 12; h++) {
    var a = h / 12 * TAU;
    H.line(c, 'Clock tick ' + h, [[W / 2 + Math.cos(a) * r * 0.88, Hh / 2 + Math.sin(a) * r * 0.88], [W / 2 + Math.cos(a) * r * 0.96, Hh / 2 + Math.sin(a) * r * 0.96]], sc.sub, 2, 0.6);
  }
  H.layRectAt(c, 'Stuck hand', W / 2, Hh / 2 - r * 0.35, 3, r * 0.7, { fill: sc.accent, alpha: 0.9 }, function (env, f) {
    return { rot: Math.sin(env.t * 14) * 2.5, a: 0.9 * H.layTin(c, f, 0, 0.25) * H.layTout(c, f) };
  });
  var txt = H.laySplitLines(H.layText(c), 7), size = Math.min(H.layFitSize(c, txt, r * 1.6, r * 0.9, { font: serifFont(c) }), u * 0.14);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 26. hzCloser: distant text surging abruptly larger in quantized horror steps */
reg('src/11p_x2_horrorA.js', 'hzCloser', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, W * 0.82, Hh * 0.5, { font: serifFont(c) }), u * 0.2);
  H.laySetNodes(c, [{
    text: txt, font: serifFont(c), size: size, x: W / 2, y: Hh / 2, color: sc.fg,
    animPlace: function (env) {
      var st = 0.5 + 0.5 * (Math.floor(cl(env.t / Math.max(0.4, c.cut.end / c.comp.fps - c.cut.origin / c.comp.fps)) * 4) / 3);
      return { s: cl(st, 0.45, 1.12) };
    }
  }]);
});

/* 27. hzStairs: descending staircase treads stepping down into dark floor */
reg('src/11p_x2_horrorA.js', 'hzStairs', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), Math.min(4, Math.max(2, H.layChars(H.layText(c)).length >= 5 ? 3 : 2)));
  var k = chunks.length, specs = [];
  chunks.forEach(function (ch, i) {
    var sx = mix(W * 0.26, W * 0.74, i / Math.max(1, k - 1)), sy = mix(Hh * 0.3, Hh * 0.72, i / Math.max(1, k - 1));
    H.layRectAt(c, 'Stair tread ' + i, sx, sy + u * 0.045, W * 0.24, 3, { fill: sc.sub, alpha: 0.75 }, envAlpha(c, i * 0.07, 0.3, 0.75));
    var sz = Math.min(H.layFitSize(c, ch, W * 0.28, Hh * 0.16, { font: serifFont(c) }), u * 0.12);
    specs.push({ text: ch, font: serifFont(c), size: sz, x: sx, y: sy, color: i === k - 1 ? sc.accent : sc.fg, mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZPackHelpers);
