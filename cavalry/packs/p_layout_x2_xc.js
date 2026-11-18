/* JIZURA Cavalry Pack: x2layC (30 UI, device & object layouts xc* from src/11p_x2_layC.js). */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, DEG = H.DEG, TAU = H.TAU;

function reg(key, fn) {
  N.register('layout', key, {
    source: 'src/11p_x2_layC.js (' + key + ')',
    scope: 'cut',
    build: fn,
    differences: ['Native Cavalry text nodes and editable vector geometry matching ' + key + '.']
  });
}

function uMin(c) { return Math.min(c.comp.width, c.comp.height); }
function monoFont(c) { return H.layFontObj(c, 'mono'); }
function bodyFont(c) { return H.layFontObj(c, 'body'); }
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

/* 1. xcBrowser: desktop browser window with traffic-light dots & URL address bar */
reg('xcBrowser', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var bw = Math.min(W * 0.84, Hh * 1.25), bh = bw * 0.64, x0 = (W - bw) / 2, y0 = (Hh - bh) / 2, C0 = cardPal(sc);
  var topH = bh * 0.14;
  H.layPaper(c, 'Browser win', x0, y0, bw, bh, 8, C0.fill, C0.line, 0.012, envAlpha(c, 0, 0.3));
  H.layRRect(c, 'Browser chrome', x0, y0, bw, topH, 8, { fill: H.mixHex(C0.fill, C0.dk, 0.1), alpha: 1 }, envAlpha(c, 0, 0.3));
  for (var i = 0; i < 3; i++) H.layCircleAt(c, 'Win dot ' + i, x0 + u * 0.025 + i * u * 0.024, y0 + topH * 0.5, u * 0.007, u * 0.007, { fill: i === 0 ? sc.accent : C0.line, alpha: 0.9 }, envAlpha(c, 0.04, 0.25, 0.9));
  H.layRRect(c, 'URL bar', x0 + bw * 0.22, y0 + topH * 0.2, bw * 0.68, topH * 0.6, 4, { fill: C0.fill, stroke: C0.line, width: 1, alpha: 1 }, envAlpha(c, 0.04, 0.25));
  H.addText(c, 'URL text', 'https://jizura.app/cut/' + H.layLineNo(c), x0 + bw * 0.25, y0 + topH * 0.5, smallSize(c) * 0.85, { font: monoFont(c), align: 'left', color: C0.line }, envAlpha(c, 0.06, 0.25));
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, bw * 0.82, (bh - topH) * 0.6), u * 0.16);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: y0 + topH + (bh - topH) / 2, color: C0.text }]);
});

/* 2. xcPlayer: media player deck with scrubbing playhead progress bar & controls */
reg('xcPlayer', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var pw = Math.min(W * 0.84, Hh * 1.3), ph = pw * 0.56, x0 = (W - pw) / 2, y0 = (Hh - ph) / 2;
  H.layRRect(c, 'Player frame', x0, y0, pw, ph, 10, { stroke: sc.sub, width: 2.5, alpha: 0.8 }, envAlpha(c, 0, 0.3, 0.8));
  var barY = y0 + ph * 0.82, bx0 = x0 + pw * 0.1, bx1 = x0 + pw * 0.9;
  H.line(c, 'Seek track', [[bx0, barY], [bx1, barY]], sc.sub, 4, 0.45);
  H.layRectAt(c, 'Seek fill', mix(bx0, bx1, 0.32), barY, (bx1 - bx0) * 0.64, 4, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.06, 0.3));
  H.layCircleAt(c, 'Seek knob', mix(bx0, bx1, 0.64), barY, u * 0.012, u * 0.012, { fill: sc.fg, alpha: 1 }, function (env, f) {
    var k = cl(env.t / 1.5);
    return { x: mix(bx0, bx1, k), a: H.layTin(c, f, 0.04, 0.25) * H.layTout(c, f) };
  });
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, pw * 0.82, ph * 0.48), u * 0.16);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: y0 + ph * 0.4, color: sc.fg }]);
});

/* 3. xcLoading: sleek system progress bar filling continuously under readout */
reg('xcLoading', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var bw = W * 0.68, bh = Math.max(10, u * 0.022), bx0 = (W - bw) / 2, by = Hh * 0.64;
  H.layRRect(c, 'Load track', bx0, by - bh / 2, bw, bh, bh / 2, { stroke: sc.sub, width: 2, alpha: 0.7 }, envAlpha(c, 0, 0.25, 0.7));
  H.layRRect(c, 'Load fill', bx0 + 3, by - bh / 2 + 3, bw - 6, bh - 6, bh / 2, { fill: sc.accent, alpha: 1 }, function (env, f) {
    var p = cl(env.t / 1.1) * H.layTout(c, f);
    return { x: bx0 + 3 + (bw - 6) * p / 2, sx: Math.max(0.02, p), a: p > 0.01 ? 1 : 0 };
  });
  H.addText(c, 'Load pct', 'LOADING  //  CUT ' + H.layLineNo(c), W / 2, by + bh * 1.8, smallSize(c), { font: monoFont(c), color: sc.sub }, envAlpha(c, 0.04, 0.25));
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.36), u * 0.16);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh * 0.42, color: sc.fg }]);
});

/* 4. xcMapPin: minimalist street grid map centered on giant teardrop location pin */
reg('xcMapPin', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  for (var i = 1; i <= 3; i++) {
    H.line(c, 'Map H ' + i, [[W * 0.1, Hh * (0.2 * i + 0.1)], [W * 0.9, Hh * (0.2 * i + 0.1)]], sc.sub, 1.5, 0.28);
    H.line(c, 'Map V ' + i, [[W * (0.2 * i + 0.1), Hh * 0.14], [W * (0.2 * i + 0.1), Hh * 0.86]], sc.sub, 1.5, 0.28);
  }
  H.layCircleAt(c, 'Pin head', W / 2, Hh * 0.32, u * 0.055, u * 0.055, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0, 0.3));
  H.layPolyAt(c, 'Pin tail', W / 2, Hh * 0.38, [[W / 2 - u * 0.045, Hh * 0.34], [W / 2 + u * 0.045, Hh * 0.34], [W / 2, Hh * 0.44]], true, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0, 0.3));
  H.layCircleAt(c, 'Pin hole', W / 2, Hh * 0.32, u * 0.02, u * 0.02, { fill: sc.bg, alpha: 1 }, envAlpha(c, 0.02, 0.25));
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.34), u * 0.16);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh * 0.62, color: sc.fg }]);
});

/* 5. xcSignpost: directional street signpost blades pointing opposite directions */
reg('xcSignpost', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length >= 5 ? 2 : 1);
  H.layRectAt(c, 'Sign pole', W / 2, Hh * 0.56, Math.max(6, u * 0.015), Hh * 0.72, { fill: sc.sub, alpha: 0.8 }, envAlpha(c, 0, 0.3, 0.8));
  var specs = [];
  chunks.forEach(function (ch, i) {
    var dir = i % 2 === 0 ? 1 : -1, y = Hh * (0.36 + i * 0.24), bw = W * 0.58, bh = u * 0.14;
    var cx = W / 2 + dir * u * 0.04, xL = cx - bw / 2, xR = cx + bw / 2, tip = bh * 0.35;
    var pts = dir > 0 ? [[xL, y - bh / 2], [xR - tip, y - bh / 2], [xR, y], [xR - tip, y + bh / 2], [xL, y + bh / 2]] : [[xL + tip, y - bh / 2], [xR, y - bh / 2], [xR, y + bh / 2], [xL + tip, y + bh / 2], [xL, y]];
    var fill = i === 0 ? sc.accent : (sc.ink || sc.fg);
    H.layPolyAt(c, 'Sign blade ' + i, cx, y, pts, true, { fill: fill, alpha: 1 }, envAlpha(c, i * 0.08, 0.3));
    specs.push({ text: ch, size: Math.min(H.layFitSize(c, ch, bw * 0.72, bh * 0.62), bh * 0.48), x: cx, y: y, color: H.textOn(fill, sc.bg, sc), mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 6. xcVending: illuminated vending machine bay dispensing centered display item */
reg('xcVending', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var vw = Math.min(W * 0.62, Hh * 0.6), vh = Hh * 0.8, x0 = (W - vw) / 2, y0 = (Hh - vh) / 2;
  H.layRRect(c, 'Vending shell', x0, y0, vw, vh, 8, { stroke: sc.sub, width: 3, alpha: 0.85 }, envAlpha(c, 0, 0.3, 0.85));
  H.layRRect(c, 'Vending glass', x0 + vw * 0.08, y0 + vh * 0.08, vw * 0.84, vh * 0.56, 4, { stroke: sc.accent, width: 2, alpha: 0.8 }, envAlpha(c, 0.04, 0.3, 0.8));
  H.layRRect(c, 'Dispense flap', x0 + vw * 0.14, y0 + vh * 0.74, vw * 0.72, vh * 0.16, 4, { fill: sc.sub, alpha: 0.45 }, envAlpha(c, 0.08, 0.3, 0.45));
  var txt = H.laySplitLines(H.layText(c), 7), sz = Math.min(H.layFitSize(c, txt, vw * 0.72, vh * 0.42), u * 0.13);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: y0 + vh * 0.36, color: sc.fg }]);
});

/* 7. xcFolder: desktop file-folder tab silhouette holding structured document title */
reg('xcFolder', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var fw = Math.min(W * 0.78, Hh * 1.15), fh = fw * 0.66, x0 = (W - fw) / 2, y0 = (Hh - fh) / 2;
  var tabW = fw * 0.34, tabH = fh * 0.12;
  H.layRRect(c, 'Folder tab', x0, y0, tabW, tabH + 8, 6, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0, 0.25));
  H.layRRect(c, 'Folder body', x0, y0 + tabH, fw, fh - tabH, 8, { fill: sc.accent, stroke: sc.bg, width: 2, alpha: 0.94 }, envAlpha(c, 0.04, 0.3, 0.94));
  H.addText(c, 'Folder label', 'DIR //' + H.layLineNo(c), x0 + tabW * 0.5, y0 + tabH * 0.5, smallSize(c) * 0.85, { font: monoFont(c), color: H.textOn(sc.accent, sc.bg, sc) }, envAlpha(c, 0.04, 0.25));
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, fw * 0.82, (fh - tabH) * 0.62), u * 0.15);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: y0 + tabH + (fh - tabH) / 2, color: H.textOn(sc.accent, sc.bg, sc) }]);
});

/* 8. xcScoreboard: digital stadium scoreboard header showing round, home & away ticks */
reg('xcScoreboard', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var sw = Math.min(W * 0.84, Hh * 1.32), sh = sw * 0.54, x0 = (W - sw) / 2, y0 = (Hh - sh) / 2;
  H.layRRect(c, 'Score frame', x0, y0, sw, sh, 6, { fill: darkOf(sc), stroke: sc.accent, width: 3, alpha: 0.96 }, envAlpha(c, 0, 0.3, 0.96));
  H.addText(c, 'Score HOME', '01', x0 + sw * 0.18, y0 + sh * 0.24, u * 0.06, { font: monoFont(c), color: sc.accent }, envAlpha(c, 0.04, 0.25));
  H.addText(c, 'Score AWAY', H.layLineNo(c), x0 + sw * 0.82, y0 + sh * 0.24, u * 0.06, { font: monoFont(c), color: sc.accent }, envAlpha(c, 0.04, 0.25));
  H.addText(c, 'Score PER', 'ROUND ' + H.layLineNo(c), W / 2, y0 + sh * 0.22, smallSize(c), { font: monoFont(c), color: sc.sub }, envAlpha(c, 0.04, 0.25));
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, sw * 0.82, sh * 0.44), u * 0.15);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: y0 + sh * 0.64, color: lightOf(sc) }]);
});

/* 9. xcWeather: minimalist meteorological card with crisp sun/cloud icon & forecast */
reg('xcWeather', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  H.layCircleAt(c, 'Weather sun', W * 0.32, Hh * 0.3, u * 0.075, u * 0.075, { fill: sc.accent, alpha: 0.95 }, envAlpha(c, 0, 0.3, 0.95));
  H.layRRect(c, 'Weather cloud', W * 0.28, Hh * 0.3, u * 0.18, u * 0.075, u * 0.036, { fill: lightOf(sc), alpha: 0.92 }, envAlpha(c, 0.04, 0.3, 0.92));
  H.addText(c, 'Weather temp', '22\u00B0C  //  CLEAR', W * 0.56, Hh * 0.32, smallSize(c) * 1.15, { font: monoFont(c), align: 'left', color: sc.sub }, envAlpha(c, 0.06, 0.25));
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, W * 0.8, Hh * 0.38), u * 0.16);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh * 0.58, color: sc.fg }]);
});

/* 10. xcBattery: segmented power-cell casing enclosing highlighted energy charge bar */
reg('xcBattery', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var bw = Math.min(W * 0.78, Hh * 1.45), bh = bw * 0.42, x0 = (W - bw) / 2, y0 = (Hh - bh) / 2;
  H.layRRect(c, 'Bat body', x0, y0, bw, bh, 8, { stroke: sc.fg, width: 3, alpha: 0.9 }, envAlpha(c, 0, 0.25, 0.9));
  H.layRRect(c, 'Bat nub', x0 + bw, y0 + bh * 0.3, u * 0.022, bh * 0.4, 3, { fill: sc.fg, alpha: 0.9 }, envAlpha(c, 0.02, 0.25, 0.9));
  H.layRRect(c, 'Bat charge', x0 + 10, y0 + 10, (bw - 20) * 0.76, bh - 20, 4, { fill: sc.accent, alpha: 0.88 }, envAlpha(c, 0.06, 0.35, 0.88));
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, bw * 0.82, bh * 0.62), bh * 0.42);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 11. xcPopups: cascading layered OS dialog alerts piling behind active card */
reg('xcPopups', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var pw = Math.min(W * 0.68, Hh * 0.95), ph = pw * 0.54, C0 = cardPal(sc);
  for (var i = 0; i < 3; i++) {
    var dx = (i - 1) * u * 0.045, dy = (i - 1) * u * 0.045;
    H.layPaper(c, 'Popup ' + i, W / 2 - pw / 2 + dx, Hh / 2 - ph / 2 + dy, pw, ph, 6, i === 2 ? C0.fill : H.mixHex(C0.fill, sc.sub, 0.2), C0.line, 0.01, envAlpha(c, i * 0.06, 0.28));
  }
  H.layRectAt(c, 'Popup top bar', W / 2 + u * 0.045, Hh / 2 - ph / 2 + u * 0.045 + ph * 0.09, pw, ph * 0.18, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.12, 0.25));
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, pw * 0.8, ph * 0.5), u * 0.14);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2 + u * 0.045, y: Hh / 2 + u * 0.06, color: C0.text }]);
});

/* 12. xcIncoming: smartphone lock-screen call banner with answer/decline pill rings */
reg('xcIncoming', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var pw = Math.min(W * 0.54, Hh * 0.54), ph = Hh * 0.78, x0 = (W - pw) / 2, y0 = (Hh - ph) / 2;
  H.layRRect(c, 'Phone bezel', x0, y0, pw, ph, 22, { stroke: sc.sub, width: 3, alpha: 0.85 }, envAlpha(c, 0, 0.3, 0.85));
  H.addText(c, 'Call hdr', 'INCOMING CALL', W / 2, y0 + ph * 0.16, smallSize(c), { font: monoFont(c), color: sc.accent }, envAlpha(c, 0.04, 0.25));
  H.layCircleAt(c, 'Call decline', W / 2 - pw * 0.24, y0 + ph * 0.8, u * 0.032, u * 0.032, { fill: sc.sub, alpha: 0.7 }, envAlpha(c, 0.08, 0.25, 0.7));
  H.layCircleAt(c, 'Call accept', W / 2 + pw * 0.24, y0 + ph * 0.8, u * 0.032, u * 0.032, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.08, 0.25));
  var txt = H.laySplitLines(H.layText(c), 7), sz = Math.min(H.layFitSize(c, txt, pw * 0.82, ph * 0.34), u * 0.12);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: y0 + ph * 0.44, color: sc.fg }]);
});

/* 13. xcGauge: semi-circular analog speedometer arc with sweeping needle indicator */
reg('xcGauge', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), r = u * 0.34, cy = Hh * 0.62;
  var pts = [];
  for (var i = 0; i <= 24; i++) { var a = mix(Math.PI, TAU, i / 24); pts.push([W / 2 + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  H.line(c, 'Gauge arc', pts, sc.accent, 5, 0.85);
  H.layRectAt(c, 'Gauge needle', W / 2, cy - r * 0.38, 3, r * 0.76, { fill: sc.accent, alpha: 1 }, function (env, f) {
    var rot = mix(-65, 52, E.outExpo(cl(env.t / 0.55)));
    return { rot: rot, a: H.layTin(c, f, 0, 0.25) * H.layTout(c, f) };
  });
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, W * 0.76, Hh * 0.3), u * 0.14);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: cy + u * 0.06, color: sc.fg }]);
});

/* 14. xcSheet: spreadsheet cell matrix with alphanumeric column headers & highlighted cell */
reg('xcSheet', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var gw = W * 0.8, gh = Hh * 0.62, x0 = (W - gw) / 2, y0 = (Hh - gh) / 2, cols = 4, rows = 4;
  H.layRRect(c, 'Sheet outer', x0, y0, gw, gh, 2, { stroke: sc.sub, width: 1.5, alpha: 0.65 }, envAlpha(c, 0, 0.3, 0.65));
  for (var i = 1; i < cols; i++) H.line(c, 'Sheet V ' + i, [[x0 + gw * (i / cols), y0], [x0 + gw * (i / cols), y0 + gh]], sc.sub, 1, 0.4);
  for (var j = 1; j < rows; j++) H.line(c, 'Sheet H ' + j, [[x0, y0 + gh * (j / rows)], [x0 + gw, y0 + gh * (j / rows)]], sc.sub, 1, 0.4);
  H.layRRect(c, 'Sheet active', x0 + gw * 0.25, y0 + gh * 0.25, gw * 0.5, gh * 0.5, 0, { stroke: sc.accent, width: 3, alpha: 1 }, envAlpha(c, 0.06, 0.25));
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, gw * 0.45, gh * 0.4), u * 0.13);
  H.laySetNodes(c, [{ text: txt, font: monoFont(c), size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 15. xcChipCard: smart credit/transit IC card displaying metallic gold EMV contact chip */
reg('xcChipCard', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var cw = Math.min(W * 0.78, Hh * 1.25), ch = cw * 0.62, x0 = (W - cw) / 2, y0 = (Hh - ch) / 2, C0 = cardPal(sc);
  var fill = H.layPlateCol(sc, [sc.ink, C0.fill], sc.bg, 1.4), tc = H.textOn(fill, sc.bg, sc);
  H.layPaper(c, 'IC card', x0, y0, cw, ch, 12, fill, sc.sub, 0.012, envAlpha(c, 0, 0.3));
  H.layRRect(c, 'EMV chip', x0 + cw * 0.1, y0 + ch * 0.28, cw * 0.16, ch * 0.24, 4, { fill: sc.accent, stroke: tc, width: 1.5, alpha: 1 }, envAlpha(c, 0.06, 0.25));
  H.addText(c, 'Card num', '0000  4201  ' + H.layLineNo(c) + '00', x0 + cw * 0.1, y0 + ch * 0.82, smallSize(c), { font: monoFont(c), align: 'left', color: tc }, envAlpha(c, 0.08, 0.25));
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, cw * 0.6, ch * 0.4), u * 0.13);
  H.laySetNodes(c, [{ text: txt, size: sz, x: x0 + cw * 0.62, y: y0 + ch * 0.46, color: tc }]);
});

/* 16. xcPaperCup: tapered takeaway coffee cup with corrugated cardboard sleeve */
reg('xcPaperCup', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var cw = u * 0.38, ch = u * 0.56, cx = W / 2, cy = Hh / 2, C0 = cardPal(sc);
  var pts = [[cx - cw * 0.5, cy - ch * 0.44], [cx + cw * 0.5, cy - ch * 0.44], [cx + cw * 0.35, cy + ch * 0.48], [cx - cw * 0.35, cy + ch * 0.48]];
  H.layPolyAt(c, 'Cup body', cx, cy, pts, true, { fill: C0.fill, stroke: C0.line, width: 2, alpha: 1 }, envAlpha(c, 0, 0.3));
  H.layRRect(c, 'Cup lid', cx - cw * 0.54, cy - ch * 0.52, cw * 1.08, ch * 0.1, 4, { fill: C0.dk, alpha: 1 }, envAlpha(c, 0.02, 0.25));
  H.layRectAt(c, 'Cup sleeve', cx, cy + ch * 0.02, cw * 0.84, ch * 0.42, { fill: sc.accent, alpha: 0.96 }, envAlpha(c, 0.06, 0.3, 0.96));
  var txt = H.laySplitLines(H.layText(c), 7), sz = Math.min(H.layFitSize(c, txt, cw * 0.72, ch * 0.34), cw * 0.26);
  H.laySetNodes(c, [{ text: txt, size: sz, x: cx, y: cy + ch * 0.02, color: H.textOn(sc.accent, C0.fill, sc) }]);
});

/* 17. xcTshirt: bold graphic tee silhouette screen-printed across chest canvas */
reg('xcTshirt', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), tw = u * 0.56, th = u * 0.64, cx = W / 2, cy = Hh / 2;
  var C0 = cardPal(sc);
  var pts = [[cx - tw * 0.26, cy - th * 0.48], [cx + tw * 0.26, cy - th * 0.48], [cx + tw * 0.66, cy - th * 0.24], [cx + tw * 0.52, cy - th * 0.02], [cx + tw * 0.38, cy - th * 0.1], [cx + tw * 0.38, cy + th * 0.48], [cx - tw * 0.38, cy + th * 0.48], [cx - tw * 0.38, cy - th * 0.1], [cx - tw * 0.52, cy - th * 0.02], [cx - tw * 0.66, cy - th * 0.24]];
  H.layPolyAt(c, 'Tee shirt', cx, cy, pts, true, { fill: C0.fill, stroke: C0.line, width: 2, alpha: 1 }, envAlpha(c, 0, 0.3));
  var txt = H.laySplitLines(H.layText(c), 7), sz = Math.min(H.layFitSize(c, txt, tw * 0.62, th * 0.42), tw * 0.26);
  H.laySetNodes(c, [{ text: txt, size: sz, x: cx, y: cy + th * 0.04, color: sc.accent }]);
});

/* 18. xcHandheld: retro handheld game console shell with D-pad & A/B buttons */
reg('xcHandheld', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var cw = Math.min(W * 0.48, Hh * 0.52), ch = Hh * 0.8, x0 = (W - cw) / 2, y0 = (Hh - ch) / 2, C0 = cardPal(sc);
  H.layPaper(c, 'Console shell', x0, y0, cw, ch, 16, C0.fill, C0.line, 0.012, envAlpha(c, 0, 0.3));
  H.layRRect(c, 'Console screen', x0 + cw * 0.12, y0 + ch * 0.08, cw * 0.76, ch * 0.42, 6, { fill: darkOf(sc), stroke: sc.accent, width: 2, alpha: 1 }, envAlpha(c, 0.04, 0.25));
  H.layRectAt(c, 'Dpad H', x0 + cw * 0.26, y0 + ch * 0.72, cw * 0.18, cw * 0.06, { fill: C0.dk, alpha: 0.9 }, envAlpha(c, 0.06, 0.25, 0.9));
  H.layRectAt(c, 'Dpad V', x0 + cw * 0.26, y0 + ch * 0.72, cw * 0.06, cw * 0.18, { fill: C0.dk, alpha: 0.9 }, envAlpha(c, 0.06, 0.25, 0.9));
  H.layCircleAt(c, 'Btn A', x0 + cw * 0.76, y0 + ch * 0.68, cw * 0.05, cw * 0.05, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.08, 0.25));
  H.layCircleAt(c, 'Btn B', x0 + cw * 0.64, y0 + ch * 0.76, cw * 0.05, cw * 0.05, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.08, 0.25));
  var txt = H.laySplitLines(H.layText(c), 7), sz = Math.min(H.layFitSize(c, txt, cw * 0.64, ch * 0.32, { font: monoFont(c) }), cw * 0.2);
  H.laySetNodes(c, [{ text: txt, font: monoFont(c), size: sz, x: W / 2, y: y0 + ch * 0.29, color: sc.accent }]);
});

/* 19. xcBlackboard: classroom chalkboard frame with wood tray & chalk lettering */
reg('xcBlackboard', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var bw = W * 0.82, bh = Hh * 0.64, x0 = (W - bw) / 2, y0 = (Hh - bh) / 2;
  H.layRRect(c, 'Chalkboard', x0, y0, bw, bh, 4, { fill: darkOf(sc), stroke: sc.accent, width: Math.max(6, u * 0.014), alpha: 1 }, envAlpha(c, 0, 0.3));
  H.layRectAt(c, 'Chalk tray', W / 2, y0 + bh + u * 0.012, bw * 0.96, u * 0.018, { fill: sc.sub, alpha: 0.9 }, envAlpha(c, 0.04, 0.25, 0.9));
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, bw * 0.82, bh * 0.62, { font: bodyFont(c) }), u * 0.16);
  H.laySetNodes(c, [{ text: txt, font: bodyFont(c), size: sz, x: W / 2, y: Hh / 2, color: lightOf(sc) }]);
});

/* 20. xcTruck: boxed delivery lorry side-profile carrying lyric cargo bill */
reg('xcTruck', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var bx = W * 0.14, bw = W * 0.52, bh = Hh * 0.4, by = Hh * 0.3;
  H.layRRect(c, 'Cargo box', bx, by, bw, bh, 4, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0, 0.3));
  H.layRRect(c, 'Truck cab', bx + bw + u * 0.012, by + bh * 0.28, W * 0.18, bh * 0.72, 6, { fill: sc.sub, alpha: 0.9 }, envAlpha(c, 0.04, 0.3, 0.9));
  [bx + bw * 0.2, bx + bw * 0.78, bx + bw + W * 0.1].forEach(function (wx, i) {
    H.layCircleAt(c, 'Wheel ' + i, wx, by + bh + u * 0.02, u * 0.045, u * 0.045, { fill: darkOf(sc), stroke: lightOf(sc), width: 3, alpha: 1 }, envAlpha(c, 0.06, 0.25));
  });
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, bw * 0.84, bh * 0.7), bh * 0.42);
  H.laySetNodes(c, [{ text: txt, size: sz, x: bx + bw / 2, y: by + bh / 2, color: H.textOn(sc.accent, sc.bg, sc) }]);
});

/* 21. xcPlate: stamped aluminum vehicle license plate with corner mounting bolts */
reg('xcPlate', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var pw = Math.min(W * 0.82, Hh * 1.45), ph = pw * 0.48, x0 = (W - pw) / 2, y0 = (Hh - ph) / 2, C0 = cardPal(sc);
  H.layPaper(c, 'License plate', x0, y0, pw, ph, 10, C0.fill, sc.accent, 0.01, envAlpha(c, 0, 0.3));
  [-1, 1].forEach(function (s, i) {
    H.layCircleAt(c, 'Plate bolt ' + i, W / 2 + s * pw * 0.36, y0 + ph * 0.16, u * 0.01, u * 0.01, { fill: C0.dk, alpha: 0.8 }, envAlpha(c, 0.04, 0.25, 0.8));
  });
  H.addText(c, 'Plate region', 'JIZURA // ' + H.layLineNo(c), W / 2, y0 + ph * 0.2, smallSize(c), { font: monoFont(c), color: sc.accent }, envAlpha(c, 0.06, 0.25));
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, pw * 0.84, ph * 0.48, { font: monoFont(c) }), ph * 0.42);
  H.laySetNodes(c, [{ text: txt, font: monoFont(c), size: sz, x: W / 2, y: y0 + ph * 0.62, color: C0.text }]);
});

/* 22. xcDropdown: open UI select menu highlighting selected phrase row */
reg('xcDropdown', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var mw = Math.min(W * 0.72, u * 0.78), rh = u * 0.11, x0 = (W - mw) / 2, y0 = Hh * 0.26, C0 = cardPal(sc);
  H.layPaper(c, 'DD menu', x0, y0 + rh + 6, mw, rh * 3, 6, C0.fill, C0.line, 0.01, envAlpha(c, 0.05, 0.3));
  H.layRRect(c, 'DD active', x0 + 6, y0 + rh + 12, mw - 12, rh - 6, 4, { fill: sc.accent, alpha: 0.94 }, envAlpha(c, 0.08, 0.3, 0.94));
  H.layRRect(c, 'DD header', x0, y0, mw, rh, 6, { stroke: sc.accent, width: 2, alpha: 1 }, envAlpha(c, 0, 0.25));
  H.addText(c, 'DD caret', 'SELECT LINE  ▾', W / 2, y0 + rh / 2, smallSize(c), { font: monoFont(c), color: sc.fg }, envAlpha(c, 0.02, 0.25));
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, mw * 0.84, rh * 0.65), rh * 0.56);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: y0 + rh * 1.5 + 8, color: H.textOn(sc.accent, C0.fill, sc) }]);
});

/* 23. xcSelect: glowing text-selection drag marquee with crisp corner handles */
reg('xcSelect', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, W * 0.74, Hh * 0.44), u * 0.18);
  var m = H.layMeasure(c, txt, sz), pad = u * 0.032, x0 = W / 2 - m.w / 2 - pad, y0 = Hh / 2 - m.h / 2 - pad;
  var bw = m.w + pad * 2, bh = m.h + pad * 2;
  H.layRRect(c, 'Select box', x0, y0, bw, bh, 0, { fill: sc.accent, stroke: sc.accent, width: 2, alpha: 0.22 }, envAlpha(c, 0.04, 0.25, 0.22));
  [[x0, y0], [x0 + bw, y0], [x0 + bw, y0 + bh], [x0, y0 + bh]].forEach(function (pt, i) {
    H.layRectAt(c, 'Select handle ' + i, pt[0], pt[1], u * 0.016, u * 0.016, { fill: sc.fg, stroke: sc.accent, width: 2, alpha: 1 }, envAlpha(c, 0.06, 0.25));
  });
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 24. xcRadio: retro portable AM/FM transistor tuner scale with frequency dial needle */
reg('xcRadio', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var rw = Math.min(W * 0.82, Hh * 1.32), rh = rw * 0.56, x0 = (W - rw) / 2, y0 = (Hh - rh) / 2;
  H.layRRect(c, 'Radio cabinet', x0, y0, rw, rh, 12, { fill: darkOf(sc), stroke: sc.sub, width: 3, alpha: 0.95 }, envAlpha(c, 0, 0.3, 0.95));
  H.layRRect(c, 'Tuner dial', x0 + rw * 0.08, y0 + rh * 0.16, rw * 0.84, rh * 0.24, 4, { fill: lightOf(sc), alpha: 0.95 }, envAlpha(c, 0.04, 0.25, 0.95));
  H.layRectAt(c, 'Tuner needle', W * 0.42, y0 + rh * 0.28, 3, rh * 0.24, { fill: sc.accent, alpha: 1 }, function (env, f) {
    return { x: mix(W * 0.28, W * 0.68, 0.5 + 0.4 * Math.sin(env.t * 1.6)), a: H.layTin(c, f, 0.04, 0.25) * H.layTout(c, f) };
  });
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, rw * 0.8, rh * 0.36), u * 0.14);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: y0 + rh * 0.68, color: lightOf(sc) }]);
});

/* 25. xcFloppy: 3.5-inch square floppy diskette with sliding metal shutter & big label */
reg('xcFloppy', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var fs = Math.min(W * 0.72, Hh * 0.72), x0 = (W - fs) / 2, y0 = (Hh - fs) / 2, C0 = cardPal(sc);
  H.layRRect(c, 'Disk shell', x0, y0, fs, fs, 10, { fill: sc.ink || C0.dk, stroke: sc.sub, width: 2, alpha: 1 }, envAlpha(c, 0, 0.3));
  H.layRRect(c, 'Disk shutter', x0 + fs * 0.24, y0, fs * 0.52, fs * 0.3, 2, { fill: sc.sub, alpha: 0.95 }, envAlpha(c, 0.04, 0.25, 0.95));
  H.layPaper(c, 'Disk label', x0 + fs * 0.14, y0 + fs * 0.42, fs * 0.72, fs * 0.52, 4, C0.fill, null, 0, envAlpha(c, 0.06, 0.3));
  H.layRectAt(c, 'Disk label bar', W / 2, y0 + fs * 0.48, fs * 0.72, fs * 0.08, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.08, 0.25));
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, fs * 0.62, fs * 0.32), fs * 0.16);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: y0 + fs * 0.72, color: C0.text }]);
});

/* 26. xcMegaphone: flaring acoustic bullhorn broadcasting expanding radial waves */
reg('xcMegaphone', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var pts = [[W * 0.14, Hh * 0.46], [W * 0.36, Hh * 0.36], [W * 0.36, Hh * 0.64], [W * 0.14, Hh * 0.54]];
  H.layPolyAt(c, 'Horn cone', W * 0.25, Hh * 0.5, pts, true, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0, 0.25));
  [0.14, 0.22].forEach(function (k, i) {
    H.layCircleAt(c, 'Wave arc ' + i, W * 0.4, Hh / 2, W * k, Hh * k * 1.1, { stroke: sc.accent, width: 2, alpha: 0.45 }, envAlpha(c, i * 0.08, 0.3, 0.45));
  });
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, W * 0.46, Hh * 0.44), u * 0.15);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W * 0.66, y: Hh / 2, color: sc.fg }]);
});

/* 27. xcBunting: celebratory string of triangular festival pennants carrying each glyph */
reg('xcBunting', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, fw = Math.min(W * 0.84 / Math.max(2, n), u * 0.16), fh = fw * 1.28;
  H.line(c, 'Bunting cord', [[W * 0.08, Hh * 0.36], [W / 2, Hh * 0.4], [W * 0.92, Hh * 0.36]], sc.sub, 2, 0.75);
  var specs = chars.map(function (ch, i) {
    var x = W / 2 + (i - (n - 1) / 2) * fw * 1.08, y0 = Hh * 0.38;
    var fill = i % 2 ? (sc.ink || sc.fg) : sc.accent;
    H.layPolyAt(c, 'Pennant ' + i, x, y0 + fh / 2, [[x - fw * 0.46, y0], [x + fw * 0.46, y0], [x, y0 + fh]], true, { fill: fill, alpha: 1 }, envAlpha(c, i * 0.04, 0.25));
    return { text: ch, size: fw * 0.48, x: x, y: y0 + fh * 0.38, color: H.textOn(fill, sc.bg, sc), mi: i };
  });
  H.laySetNodes(c, specs);
});

/* 28. xcDrawers: card-filing cabinet drawer front with brass label holder slot */
reg('xcDrawers', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var dw = Math.min(W * 0.76, Hh * 1.1), dh = dw * 0.46, x0 = (W - dw) / 2, y0 = (Hh - dh) / 2, C0 = cardPal(sc);
  H.layPaper(c, 'Drawer face', x0, y0, dw, dh, 4, sc.ink || C0.dk, sc.sub, 0.012, envAlpha(c, 0, 0.3));
  H.layRRect(c, 'Brass label', W / 2 - dw * 0.36, Hh / 2 - dh * 0.32, dw * 0.72, dh * 0.64, 2, { fill: C0.fill, stroke: sc.accent, width: 2.5, alpha: 1 }, envAlpha(c, 0.04, 0.25));
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, dw * 0.62, dh * 0.44), u * 0.12);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: C0.text }]);
});

/* 29. xcPoll: live voting poll bars displaying winning percentage beside lyric option */
reg('xcPoll', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length >= 4 ? 2 : 1);
  var bw = W * 0.74, bh = u * 0.14, x0 = (W - bw) / 2, specs = [];
  chunks.forEach(function (ch, i) {
    var y = Hh / 2 + (i - (chunks.length - 1) / 2) * bh * 1.35, frac = i === 0 ? 0.78 : 0.42;
    H.layRRect(c, 'Poll track ' + i, x0, y - bh / 2, bw, bh, 8, { stroke: sc.sub, width: 1.5, alpha: 0.6 }, envAlpha(c, i * 0.06, 0.25, 0.6));
    H.layRRect(c, 'Poll fill ' + i, x0, y - bh / 2, bw * frac, bh, 8, { fill: i === 0 ? sc.accent : sc.sub, alpha: 0.85 }, envAlpha(c, i * 0.06, 0.35, 0.85));
    H.addText(c, 'Poll pct ' + i, Math.round(frac * 100) + '%', x0 + bw - u * 0.025, y, smallSize(c) * 1.1, { font: monoFont(c), align: 'right', color: sc.fg }, envAlpha(c, 0.1, 0.25));
    specs.push({ text: ch, size: Math.min(H.layFitSize(c, ch, bw * 0.64, bh * 0.65), bh * 0.52), x: x0 + u * 0.03, y: y, align: 'left', color: i === 0 ? H.textOn(sc.accent, sc.bg, sc) : sc.fg, mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 30. xcAwning: striped bistro storefront canopy valance overhanging clean shop window copy */
reg('xcAwning', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var cols = 8, sw = W * 0.88 / cols, ah = Hh * 0.18, x0 = W * 0.06, y0 = Hh * 0.14, C0 = cardPal(sc);
  for (var i = 0; i < cols; i++) {
    var fill = i % 2 === 0 ? sc.accent : C0.fill;
    H.layRRect(c, 'Awning stripe ' + i, x0 + i * sw, y0, sw + 1, ah, 4, { fill: fill, alpha: 0.96 }, envAlpha(c, i * 0.02, 0.28, 0.96));
  }
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, W * 0.8, Hh * 0.44), u * 0.18);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh * 0.58, color: sc.fg }]);
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZPackHelpers);
