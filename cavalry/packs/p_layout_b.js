/* JIZURA Cavalry Pack: layoutsB (27 kinetic & graphic layouts from src/11p_layoutsB.js). */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, DEG = H.DEG, TAU = H.TAU;

function reg(key, fn, diffs) {
  N.register('layout', key, {
    source: 'src/11p_layoutsB.js (' + key + ')',
    scope: 'cut',
    build: fn,
    differences: diffs || ['Native Cavalry text nodes and editable vector geometry matching layoutsB:' + key + '.']
  });
}

function uMin(c) { return Math.min(c.comp.width, c.comp.height); }
function isPort(c) { return c.comp.height > c.comp.width * 1.08; }
function bodyFont(c) { return H.layFontObj(c, 'body'); }
function monoFont(c) { return H.layFontObj(c, 'mono'); }
function serifFont(c) { return H.layFontObj(c, 'serif'); }
function envAlpha(c, d, len, mul) {
  var m = mul == null ? 1 : mul;
  return function (env, f) {
    return { a: cl(H.layTin(c, f, d || 0, len || 0.35, E.outCubic) * H.layTout(c, f) * m, 0, 1) };
  };
}
function popScale(c, d, len) {
  return function (env, f) {
    var q = E.outBack(cl((env.t - (d || 0)) / Math.max(0.05, len || 0.3)), 1.6) * H.layTout(c, f);
    return { s: Math.max(0.001, q), a: q > 0.01 ? 1 : 0 };
  };
}
function cellRows(chs, W, Hh, maxPerRow, aspect, maxCell, gapK, stag) {
  var n = chs.length, rowsN = Math.max(1, Math.ceil(n / Math.max(1, maxPerRow)));
  var colsMax = Math.max(1, Math.ceil(n / rowsN));
  var k = Math.min(W * 0.86 / (colsMax * (1 + gapK)), Hh * 0.68 / (rowsN * (aspect + gapK)), maxCell);
  var cw = k, ch = k * aspect, spX = k * (1 + gapK), spY = ch + k * gapK;
  var out = [];
  for (var i = 0; i < n; i++) {
    var r = Math.floor(i / colsMax), col = i % colsMax;
    var rowLen = Math.min(colsMax, n - r * colsMax);
    var rowOff = stag && (r % 2) ? spX * 0.25 : 0;
    var x = W / 2 + (col - (rowLen - 1) / 2) * spX + rowOff;
    var y = Hh / 2 + (r - (rowsN - 1) / 2) * spY;
    out.push({ ch: chs[i], x: x, y: y, r: r, col: col, i: i });
  }
  return { cells: out, k: k, cw: cw, ch: ch, rows: rowsN };
}

/* 1. rain: vertical rain glyph streams + locked main text */
reg('rain', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), s = H.laySeed(c);
  var vert = P.orient === 'v' || (port && H.layChars(H.layText(c)).length <= 7);
  var mt = vert ? H.layStrip(H.layText(c)) : H.laySplitLines(H.layText(c), port ? 6 : 11);
  var size = Math.min(H.layFitSize(c, mt, W * (vert ? 0.45 : 0.82), Hh * (vert ? 0.78 : 0.48), { vertical: vert, track: 0.08, lead: 1.25 }), vert ? Hh * 0.14 : Hh * 0.22);
  var pool = H.layChars(H.layLineText(c) + H.layText(c));
  var cols = 10, cell = W / cols, tailC = P.tint === 'accent' ? sc.accent : sc.sub;
  for (var ci = 0; ci < cols; ci++) {
    if (R.hash01(s, ci, 1) > 0.68) continue;
    (function (colIdx) {
      var x = (colIdx + 0.5) * cell, rs = cl(u * 0.028, 12, 30), sp = 0.7 + R.hash01(s, colIdx, 2) * 0.9;
      var ch = pool[colIdx % pool.length], y0 = -Hh * 0.2 - R.hash01(s, colIdx, 3) * Hh * 0.5;
      H.layRectAt(c, 'Rain trail ' + colIdx, x, y0, Math.max(2, rs * 0.15), rs * 5, { fill: tailC, alpha: 0.35 }, function (env, f) {
        var y = ((y0 + env.t * Hh * 0.55 * sp) % (Hh * 1.4)) - Hh * 0.2;
        return { x: x, y: y, a: 0.35 * H.layTout(c, f) };
      });
      H.addText(c, 'Rain head ' + colIdx, ch, x, y0 + rs * 2.5, rs, { font: monoFont(c), color: sc.fg, alpha: 0.75 }, function (env, f) {
        var y = ((y0 + env.t * Hh * 0.55 * sp) % (Hh * 1.4)) - Hh * 0.2 + rs * 2.5;
        return { 'position.x': 0, 'position.y': Hh / 2 - y - (Hh / 2 - (y0 + rs * 2.5)), alpha: 0.75 * H.layTout(c, f) };
      });
    })(ci);
  }
  H.laySetNodes(c, [{ text: mt, size: size, x: W / 2, y: Hh / 2, vertical: vert, track: 0.08, lead: 1.25, color: sc.fg }]);
});

/* 2. hanging: ceiling bar with swaying pendulum drop cords per glyph */
reg('hanging', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), s = H.laySeed(c), chars = H.layChars(H.layText(c)), n = chars.length;
  var size = Math.min(W * 0.8 / Math.max(1, n * 1.2), u * 0.16), step = size * 1.2;
  var topY = Hh * 0.12;
  H.layRectAt(c, 'Hanging rail', W / 2, topY, Math.min(W * 0.9, n * step + size), Math.max(2, u * 0.003), { fill: sc.sub, alpha: 0.7 }, envAlpha(c, 0, 0.3, 0.7));
  var specs = chars.map(function (ch, i) {
    var x = W / 2 + (i - (n - 1) / 2) * step;
    var y = Hh * (0.45 + 0.12 * Math.sin(i * 1.3 + (s % 7))) + R.hash01(s, i, 2) * Hh * 0.08;
    var cordLen = Math.max(20, y - topY - size * 0.65);
    H.layRectAt(c, 'Cord ' + i, x, topY + cordLen / 2, 1.5, cordLen, { fill: sc.sub, alpha: 0.6 }, envAlpha(c, i * 0.03, 0.3, 0.6));
    H.layCircleAt(c, 'Cord pin ' + i, x, topY, 3, 3, { fill: sc.accent, alpha: 1 }, envAlpha(c, i * 0.03, 0.25));
    var swayAmp = 4 + R.hash01(s, i, 4) * 5;
    return {
      text: ch, size: size, x: x, y: y, color: i === s % n ? sc.accent : sc.fg, mi: i,
      animPlace: function (env) {
        var ang = Math.sin(env.t * 2.2 + i * 0.7) * swayAmp;
        return { dx: Math.sin(ang * DEG) * size * 0.4, dy: 0, rot: ang };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 3. orbit: elliptical planetary rings of repeating copy around hero centerpiece */
reg('orbit', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), mt = H.laySplitLines(H.layText(c), port ? 5 : 10);
  var size = Math.min(H.layFitSize(c, mt, W * 0.6, Hh * 0.26, { track: 0.03, lead: 1.15 }), Hh * 0.18);
  var rx = Math.min(W * 0.43, u * 0.48), ry = Math.min(Hh * 0.32, rx * 0.56);
  var tilt = P.tilt == null ? -14 : P.tilt, cs = Math.cos(tilt * DEG), sn = Math.sin(tilt * DEG);
  [1, 0.78].forEach(function (k, ri) {
    var pts = [];
    for (var a = 0; a <= 48; a++) {
      var th = a / 48 * TAU, ex = Math.cos(th) * rx * k, ey = Math.sin(th) * ry * k;
      pts.push([W / 2 + ex * cs - ey * sn, Hh / 2 + ex * sn + ey * cs]);
    }
    H.line(c, 'Orbit path ' + ri, pts, sc.sub, 1.4, ri ? 0.35 : 0.65);
  });
  var chars = H.layChars(H.layLineText(c) + '·'), cnt = Math.min(20, Math.max(8, chars.length));
  var os = cl(u * 0.036, 12, 34);
  for (var i = 0; i < cnt; i++) {
    (function (idx) {
      var ch = chars[idx % chars.length];
      H.addText(c, 'Orbit glyph ' + idx, ch, W / 2, Hh / 2, os, {
        color: ch === '·' ? sc.accent : sc.sub, alpha: 0.85
      }, function (env, f) {
        var th = idx / cnt * TAU + env.t * 0.65;
        var ex = Math.cos(th) * rx, ey = Math.sin(th) * ry;
        var px = ex * cs - ey * sn, py = ex * sn + ey * cs;
        return { 'position.x': px, 'position.y': -py, alpha: (Math.sin(th) > 0 ? 0.9 : 0.42) * H.layTin(c, f, 0, 0.3) * H.layTout(c, f) };
      });
    })(i);
  }
  H.laySetNodes(c, [{ text: mt, size: size, x: W / 2, y: Hh / 2, track: 0.03, lead: 1.15, color: sc.fg }]);
});

/* 4. tunnel: receding nested perspective corridor of rectangular frames */
reg('tunnel', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), mt = H.laySplitLines(H.layText(c), port ? 5 : 10);
  var size = Math.min(H.layFitSize(c, mt, W * 0.5, Hh * 0.25, { track: 0.05, lead: 1.15 }), Hh * 0.16);
  var m = H.layMeasure(c, mt, size, { track: 0.05, lead: 1.15 }), hw = m.w / 2 + size * 0.55, hh = m.h / 2 + size * 0.5;
  var A = W * 0.48, B = Hh * 0.48, s0 = Math.max(hw / A, hh / B, 0.14);
  if (P.persp !== false) {
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (sg, k) {
      H.line(c, 'Tunnel rail ' + k, [[W / 2 + sg[0] * A * 1.4, Hh / 2 + sg[1] * B * 1.4], [W / 2 + sg[0] * A * s0, Hh / 2 + sg[1] * B * s0]], sc.sub, 1.2, 0.32);
    });
  }
  for (var i = 0; i < 6; i++) {
    (function (idx) {
      var k0 = mix(s0, 1.15, idx / 5);
      H.layRectAt(c, 'Tunnel ring ' + idx, W / 2, Hh / 2, A * 2, B * 2, { stroke: idx % 2 ? sc.sub : sc.fg, width: 1.5, alpha: 0.65 }, function (env, f) {
        var ph = (idx / 6 + env.t * 0.45) % 1;
        var k = mix(s0, 1.25, ph);
        return { sx: k, sy: k, a: Math.sin(Math.PI * ph) * 0.7 * H.layTout(c, f) };
      });
    })(i);
  }
  H.laySetNodes(c, [{ text: mt, size: size, x: W / 2, y: Hh / 2, track: 0.05, lead: 1.15, color: sc.fg }]);
});

/* 5. wordCloud: scattered ambient cloud of secondary phrases around hero lyric */
reg('wordCloud', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, s = H.laySeed(c), port = isPort(c);
  var mt = H.laySplitLines(H.layText(c), port ? 5 : 9);
  var size = Math.min(H.layFitSize(c, mt, W * (port ? 0.68 : 0.52), Hh * 0.24, { track: 0.03, lead: 1.1 }), Hh * 0.18);
  var parts = H.laySplitK(H.layLineText(c), 4).concat([H.layText(c)]);
  for (var i = 0; i < 12; i++) {
    var txt = parts[i % parts.length], ang = i / 12 * TAU + R.hash01(s, i, 1) * 0.4;
    var rx = W * (0.28 + 0.16 * R.hash01(s, i, 2)), ry = Hh * (0.24 + 0.18 * R.hash01(s, i, 3));
    var cx = W / 2 + Math.cos(ang) * rx, cy = Hh / 2 + Math.sin(ang) * ry;
    var fs = cl(size * (0.28 + R.hash01(s, i, 4) * 0.35), 11, 34);
    var isA = i % 5 === 0;
    H.addText(c, 'Cloud word ' + i, txt, cx, cy, fs, {
      color: isA ? sc.accent : sc.sub, alpha: isA ? 0.85 : 0.45,
      vertical: i % 4 === 2 && Array.from(txt).length <= 5
    }, envAlpha(c, i * 0.03, 0.3, isA ? 0.85 : 0.45));
  }
  H.laySetNodes(c, [{ text: mt, size: size, x: W / 2, y: Hh / 2, track: 0.03, lead: 1.1, color: sc.fg }]);
});

/* 6. bounceLine: sequential jumping glyphs along baseline with squash & baseline rule */
reg('bounceLine', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var chars = H.layChars(H.layText(c)), n = chars.length;
  var size = Math.min(W * 0.82 / Math.max(1, n * 1.15), Hh * 0.2);
  var step = size * 1.15, hop = size * (P.hop || 0.72), cy = Hh / 2 + size * 0.1;
  H.layRectAt(c, 'Bounce baseline', W / 2, cy + size * 0.58, Math.min(W * 0.88, n * step + size * 0.4), Math.max(2, size * 0.04), { fill: sc.sub, alpha: 0.5 }, envAlpha(c, 0, 0.3, 0.5));
  var specs = chars.map(function (ch, i) {
    var x = W / 2 + (i - (n - 1) / 2) * step;
    return {
      text: ch, size: size, x: x, y: cy, color: sc.fg, mi: i,
      animPlace: function (env) {
        var ph = ((env.t - 0.15 - i * 0.07) % 0.95 + 0.95) % 0.95;
        if (env.t < 0.15 + i * 0.07 || ph > 0.38) return { dy: 0, sx: 1, sy: 1 };
        var u = ph / 0.38, dy = -4 * u * (1 - u) * hop;
        return { dy: dy, sx: 0.94, sy: 1.08 };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 7. elastic: plucked elastic band carrying flexing glyphs between two anchor pins */
reg('elastic', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var chars = H.layChars(H.layText(c)), n = chars.length, size = Math.min(W * 0.68 / Math.max(1, n * 1.1), Hh * 0.2);
  var span = (n + 1) * size * 1.08, x0 = W / 2 - span / 2, x1 = W / 2 + span / 2, amp = size * (P.amp || 0.45);
  H.line(c, 'Elastic cord', [[x0, Hh / 2 + size * 0.55], [x1, Hh / 2 + size * 0.55]], sc.accent, Math.max(2, size * 0.04), 0.75);
  H.layCircleAt(c, 'Anchor L', x0, Hh / 2 + size * 0.55, size * 0.1, size * 0.1, { fill: sc.accent, alpha: 1 }, popScale(c, 0, 0.25));
  H.layCircleAt(c, 'Anchor R', x1, Hh / 2 + size * 0.55, size * 0.1, size * 0.1, { fill: sc.accent, alpha: 1 }, popScale(c, 0, 0.25));
  var specs = chars.map(function (ch, i) {
    var x = W / 2 + (i - (n - 1) / 2) * size * 1.08, u = (i + 1) / (n + 1);
    return {
      text: ch, size: size, x: x, y: Hh / 2, color: sc.fg, mi: i,
      animPlace: function (env) {
        var tau = Math.max(0, env.t - 0.15);
        var vib = Math.sin(Math.PI * u) * amp * Math.exp(-tau * 2.8) * Math.sin(tau * 18);
        return { dy: vib };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 8. crossBands: two X-crossed scrolling ribbon strips behind centered display title */
reg('crossBands', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), ang = (port ? 28 : 16), bh = u * (port ? 0.115 : 0.1);
  var len = Math.hypot(W, Hh) * 1.25, cols = [sc.ink || sc.fg, sc.accent];
  var unit = H.layFlat(H.layLineText(c)) + '  /  ', fsz = bh * 0.45;
  var rep = new Array(8).join(unit);
  [0, 1].forEach(function (b) {
    var a = b ? -ang : ang, dir = b ? -1 : 1;
    H.layRectAt(c, 'Cross band ' + b, W / 2, Hh / 2, len, bh, { fill: cols[b], rot: a, alpha: 1 }, function (env, f) {
      var e = E.outExpo(cl((env.t - b * 0.08) / 0.4)) * H.layTout(c, f);
      return { sx: Math.max(0.001, e), sy: 1, a: e > 0.01 ? 1 : 0 };
    });
    H.addText(c, 'Cross band text ' + b, rep, W / 2, Hh / 2, fsz, {
      font: bodyFont(c), rotation: a, color: H.textOn(cols[b], sc.bg, sc)
    }, envAlpha(c, b * 0.08 + 0.08, 0.3));
  });
  var mt = H.laySplitLines(H.layText(c), port ? 6 : 10);
  var size = Math.min(H.layFitSize(c, mt, W * 0.72, Hh * 0.34, { lead: 1.12 }), Hh * 0.22);
  var m = H.layMeasure(c, mt, size, { lead: 1.12 });
  H.layRRect(c, 'Cross center plate', W / 2 - m.w / 2 - size * 0.45, Hh / 2 - m.h / 2 - size * 0.35, m.w + size * 0.9, m.h + size * 0.7, size * 0.12, { fill: sc.bg, stroke: sc.fg, width: 2, alpha: 1 }, popScale(c, 0.12, 0.28));
  H.laySetNodes(c, [{ text: mt, size: size, x: W / 2, y: Hh / 2, lead: 1.12, color: sc.fg }]);
});

/* 9. stickerBomb: vinyl sticker badges overlapped with thick die-cut border */
reg('stickerBomb', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, s = H.laySeed(c), port = isPort(c);
  var mt = H.laySplitLines(H.layText(c), port ? 5 : 8);
  var size = Math.min(H.layFitSize(c, mt, W * (port ? 0.62 : 0.5), Hh * 0.26, { track: 0.03, lead: 1.1 }), Hh * 0.18);
  var mm = H.layMeasure(c, mt, size, { track: 0.03, lead: 1.1 }), pw = mm.w + size * 0.85, ph = mm.h + size * 0.65;
  var border = H.dark(sc.bg) ? sc.fg : sc.bg, bw = Math.max(4, size * 0.09);
  var decos = [H.layNote(c) || 'LYRIC', 'No.' + H.layLineNo(c), H.layFmtTime(c.cut.origin / c.comp.fps), '\u2605', H.layAltCopy(c)];
  decos.forEach(function (txt, i) {
    var ang = (i / decos.length) * TAU + R.hash01(s, i, 2) * 0.5;
    var sx = W / 2 + Math.cos(ang) * pw * 0.68, sy = Hh / 2 + Math.sin(ang) * ph * 0.85;
    var rot = (R.hash01(s, i, 3) * 2 - 1) * 18, plate = i % 2 ? sc.accent : (sc.ink || sc.fg);
    var fs = cl(size * 0.34, 12, 26), mw = H.layMeasure(c, txt, fs).w + fs * 1.1, mh = fs * 1.55;
    H.layRRect(c, 'Deco sticker ' + i, sx - mw / 2, sy - mh / 2, mw, mh, mh * 0.25, { fill: plate, stroke: border, width: Math.max(2, bw * 0.55), rot: rot, alpha: 1 }, popScale(c, i * 0.04, 0.25));
    H.addText(c, 'Deco sticker text ' + i, txt, sx, sy, fs, { font: bodyFont(c), rotation: rot, color: H.textOn(plate, sc.bg, sc) }, envAlpha(c, i * 0.04, 0.25));
  });
  var mainRot = (R.hash01(s, 9, 1) * 2 - 1) * 4;
  H.layRRect(c, 'Main sticker base', W / 2 - pw / 2, Hh / 2 - ph / 2, pw, ph, size * 0.2, { fill: sc.accent, stroke: border, width: bw, rot: mainRot, alpha: 1 }, popScale(c, 0.05, 0.28));
  H.laySetNodes(c, [{ text: mt, size: size, x: W / 2, y: Hh / 2, rot: mainRot, track: 0.03, lead: 1.1, color: H.textOn(sc.accent, sc.bg, sc) }]);
});

/* 10. neon: double-layered neon tube glow frame & flicker tube text */
reg('neon', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var port = isPort(c), mt = H.laySplitLines(H.layText(c), port ? 5 : 9), s = H.laySeed(c);
  var size = Math.min(H.layFitSize(c, mt, W * 0.72, Hh * 0.34, { track: 0.08, lead: 1.25 }), Hh * 0.19);
  var mm = H.layMeasure(c, mt, size, { track: 0.08, lead: 1.25 });
  var tube = H.layPlateCol(sc, [sc.accent, sc.accent2, sc.fg], sc.bg, 2.0);
  var core = H.dark(sc.bg) ? mix(0, 1, 0) || H.mixHex(tube, '#ffffff', 0.7) : tube;
  var bw = mm.w + size * 1.1, bh = mm.h + size * 0.9;
  H.layRRect(c, 'Neon outer aura', W / 2 - bw / 2, Hh / 2 - bh / 2, bw, bh, size * 0.2, { stroke: tube, width: Math.max(6, size * 0.12), alpha: 0.26 }, function (env, f) {
    var flk = (R.hash01(s, Math.floor(f / 2), 9) < 0.1 && env.t < 0.4) ? 0.25 : 1;
    return { a: 0.26 * flk * H.layTin(c, f, 0, 0.25) * H.layTout(c, f) };
  });
  H.layRRect(c, 'Neon inner tube', W / 2 - bw / 2, Hh / 2 - bh / 2, bw, bh, size * 0.2, { stroke: core, width: Math.max(2, size * 0.035), alpha: 0.95 }, envAlpha(c, 0, 0.25, 0.95));
  H.laySetNodes(c, [{
    text: mt, size: size, x: W / 2, y: Hh / 2, track: 0.08, lead: 1.25, color: core,
    fill: false, stroke: true, strokeColor: tube, strokeWidth: Math.max(2, size * 0.04)
  }]);
});

/* 11. keycaps: mechanical 3D keycap switches popping sequentially */
reg('keycaps', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, port = isPort(c), s = H.laySeed(c);
  var chs = H.layChars(H.layText(c)), lay = cellRows(chs, W, Hh, port ? 4 : (chs.length > 8 ? 5 : 10), 1.06, uMin(c) * 0.24, 0.16, true);
  var k = lay.k, d = k * 0.15, rr = k * 0.16, topC = H.dark(sc.bg) ? (sc.ink || sc.fg) : sc.fg, sideC = H.mixHex(topC, sc.bg, 0.55);
  var accIdx = s % Math.max(1, chs.length), tc = H.textOn(topC, sc.bg, sc);
  var specs = lay.cells.map(function (cell, i) {
    var isAcc = i === accIdx, fillC = isAcc ? sc.accent : topC, colT = isAcc ? H.textOn(sc.accent, sc.bg, sc) : tc;
    H.layRRect(c, 'Key base ' + i, cell.x - k / 2, cell.y - k / 2 + d, k, k, rr, { fill: isAcc ? H.mixHex(sc.accent, sc.bg, 0.45) : sideC, alpha: 1 }, popScale(c, i * 0.04, 0.22));
    H.layRRect(c, 'Key top ' + i, cell.x - k * 0.44, cell.y - k * 0.44, k * 0.88, k * 0.88, rr * 0.8, { fill: fillC, alpha: 1 }, popScale(c, i * 0.04, 0.22));
    return { text: cell.ch, size: k * 0.5, x: cell.x, y: cell.y, color: colT, delaySec: i * 0.04, mi: i };
  });
  H.laySetNodes(c, specs);
});

/* 12. bubbles: translucent floating orbs enclosing individual glyphs */
reg('bubbles', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, port = isPort(c), s = H.laySeed(c);
  var chs = H.layChars(H.layText(c)), lay = cellRows(chs, W, Hh, port ? 4 : 7, 1.1, uMin(c) * 0.28, 0.14, true);
  var r = lay.k * 0.56;
  var specs = lay.cells.map(function (cell, i) {
    var isA = i % 4 === 1, fill = isA ? sc.accent : null;
    H.layCircleAt(c, 'Bubble orb ' + i, cell.x, cell.y, r, r, fill ? { fill: fill, alpha: 0.88 } : { stroke: sc.fg, width: Math.max(2, r * 0.05), alpha: 0.85 }, function (env, f) {
      var dy = -env.t * Hh * 0.02 + Math.sin(env.t * 2 + i) * r * 0.12;
      return { dy: dy, s: popScale(c, i * 0.04, 0.28)(env, f).s };
    });
    return {
      text: cell.ch, size: r * 0.95, x: cell.x, y: cell.y,
      color: isA ? H.textOn(sc.accent, sc.bg, sc) : sc.fg, delaySec: i * 0.04, mi: i,
      animPlace: function (env) { return { dy: -env.t * Hh * 0.02 + Math.sin(env.t * 2 + i) * r * 0.12 }; }
    };
  });
  H.laySetNodes(c, specs);
});

/* 13. slotMachine: arcade chrome window frames with payline rule */
reg('slotMachine', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, port = isPort(c);
  var chs = H.layChars(H.layText(c)), lay = cellRows(chs, W, Hh, port ? 5 : 10, 1.34, uMin(c) * 0.22, 0.1, false);
  var w = lay.cw, h = lay.ch, panel = sc.ink || sc.fg, tc = H.textOn(panel, sc.bg, sc);
  H.layRectAt(c, 'Slot payline', W / 2, Hh / 2, Math.min(W * 0.92, chs.length * w * 1.15), Math.max(2, w * 0.04), { fill: sc.accent, alpha: 0.8 }, envAlpha(c, 0, 0.3, 0.8));
  var specs = lay.cells.map(function (cell, i) {
    H.layRRect(c, 'Slot reel ' + i, cell.x - w / 2, cell.y - h / 2, w, h, w * 0.1, { fill: panel, stroke: sc.accent, width: 2, alpha: 1 }, popScale(c, i * 0.04, 0.25));
    return {
      text: cell.ch, size: w * 0.68, x: cell.x, y: cell.y, color: tc, delaySec: i * 0.04, mi: i,
      animPlace: function (env) {
        var q = E.outBack(cl((env.t - i * 0.05) / 0.35), 1.3);
        return { dy: (1 - q) * -h * 0.7 };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 14. flipBoard: split-flap station board tiles with center hinge line */
reg('flipBoard', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, port = isPort(c);
  var chs = H.layChars(H.layText(c)), lay = cellRows(chs, W, Hh, port ? 5 : 12, 1.32, uMin(c) * 0.22, 0.08, false);
  var w = lay.cw, h = lay.ch, panel = sc.ink || sc.fg, flap = H.mixHex(panel, sc.bg, 0.12), gc = H.textOn(panel, sc.bg, sc);
  H.addText(c, 'Flipboard head', 'ARRIVAL  /  LINE ' + H.layLineNo(c), W / 2, Hh / 2 - lay.rows * h * 0.58 - w * 0.4, Math.max(11, w * 0.2), {
    font: monoFont(c), color: sc.accent
  }, envAlpha(c, 0, 0.3));
  var specs = lay.cells.map(function (cell, i) {
    H.layRRect(c, 'Flap tile ' + i, cell.x - w / 2, cell.y - h / 2, w, h, w * 0.08, { fill: panel, alpha: 1 }, envAlpha(c, i * 0.02, 0.2));
    H.layRectAt(c, 'Flap seam ' + i, cell.x, cell.y, w, Math.max(2, h * 0.03), { fill: sc.bg, alpha: 0.9 }, envAlpha(c, i * 0.02, 0.2, 0.9));
    return { text: cell.ch, size: w * 0.72, x: cell.x, y: cell.y, color: gc, delaySec: i * 0.025, mi: i };
  });
  H.laySetNodes(c, specs);
});

/* 15. credits: rolling cinema end-credits block + hero card */
reg('credits', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var port = isPort(c), side = !port && P.variant === 'side', mt = H.laySplitLines(H.layText(c), port ? 5 : 9);
  var size = Math.min(H.layFitSize(c, mt, side ? W * 0.42 : W * 0.72, Hh * 0.26, { track: 0.06, lead: 1.2 }), Hh * 0.16);
  var mx = side ? W * 0.3 : W / 2, rx = side ? W * 0.7 : W / 2, ls = cl(uMin(c) * 0.022, 11, 22);
  var rows = [['LINE', H.layLineNo(c)], ['TIME', H.layFmtTime(c.cut.origin / c.comp.fps)], ['NOTE', H.layAltCopy(c)]];
  rows.forEach(function (r, i) {
    var ry = (side ? Hh * 0.38 : Hh * 0.68) + i * ls * 2.2;
    H.addText(c, 'Credit role ' + i, r[0], rx - ls * 1.2, ry, ls * 0.85, { font: monoFont(c), align: 'right', color: sc.sub }, function (env, f) {
      return { 'position.y': env.t * 18, alpha: 0.75 * H.layTin(c, f, 0.1, 0.3) * H.layTout(c, f) };
    });
    H.addText(c, 'Credit val ' + i, r[1], rx + ls * 1.2, ry, ls, { font: bodyFont(c), align: 'left', color: sc.fg }, function (env, f) {
      return { 'position.y': env.t * 18, alpha: 0.9 * H.layTin(c, f, 0.1, 0.3) * H.layTout(c, f) };
    });
  });
  H.laySetNodes(c, [{ text: mt, size: size, x: mx, y: side ? Hh * 0.5 : Hh * 0.4, track: 0.06, lead: 1.2, color: sc.fg }]);
});

/* 16. zoomRepeat: telescopic concentric zoom echoes alternating fill & outline */
reg('zoomRepeat', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var port = isPort(c), mt = H.laySplitLines(H.layText(c), port ? 5 : 9);
  var size = Math.min(H.layFitSize(c, mt, W * 0.64, Hh * 0.3, { track: 0.03, lead: 1.1 }), Hh * 0.2);
  var q = P.q || 1.48, K = 5;
  for (var k = K; k >= 1; k--) {
    var scK = Math.pow(q, k), outline = k % 2 === 1;
    H.addText(c, 'Zoom echo ' + k, mt, W / 2, Hh / 2, size, {
      color: sc.sub, fill: !outline, stroke: outline, strokeColor: sc.sub, strokeWidth: 1.5, alpha: 0.45 * (1 - k / (K + 1.5))
    }, function (env, f) {
      var s = scK * (1 + 0.15 * env.t);
      return { 'scale.x': s, 'scale.y': s, alpha: 0.45 * (1 - k / (K + 1.5)) * H.layTout(c, f) };
    });
  }
  H.laySetNodes(c, [{ text: mt, size: size, x: W / 2, y: Hh / 2, track: 0.03, lead: 1.1, color: sc.fg }]);
});

/* 17. splitHalves: clipped upper/lower text halves sliding & locking horizontally */
reg('splitHalves', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, port = isPort(c);
  var mt = H.laySplitLines(H.layText(c), port ? 5 : 11);
  var size = Math.min(H.layFitSize(c, mt, W * 0.84, Hh * 0.48, { track: 0.04, lead: 1.25 }), Hh * 0.24);
  var D = W * 0.22;
  H.layRectAt(c, 'Split center seam', W / 2, Hh / 2, W * 0.72, Math.max(1.5, size * 0.02), { fill: sc.accent, alpha: 0.85 }, envAlpha(c, 0, 0.35, 0.85));
  H.laySetNodes(c, [
    {
      text: mt, size: size, x: W / 2, y: Hh / 2, track: 0.04, lead: 1.25, color: sc.fg,
      clipRectFn: function () { return [0, 0, W, Hh / 2]; },
      animPlace: function (env) { return { dx: -(1 - E.outExpo(cl(env.t / 0.42))) * D, dy: 0 }; }
    },
    {
      text: mt, size: size, x: W / 2, y: Hh / 2, track: 0.04, lead: 1.25, color: sc.fg,
      clipRectFn: function () { return [0, Hh / 2, W, Hh]; },
      animPlace: function (env) { return { dx: (1 - E.outExpo(cl(env.t / 0.42))) * D, dy: 0 }; }
    }
  ]);
});

/* 18. columnsBig: giant hero vertical column beside thin annotation columns */
reg('columnsBig', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, port = isPort(c), left = H.laySeed(c) % 3 !== 0;
  var txt = H.layFlat(H.layText(c));
  var size = Math.min(H.layFitSize(c, txt, port ? W * 0.42 : W * 0.3, Hh * 0.82, { vertical: true, track: 0.02 }), Hh * 0.4);
  var hx = W * (left ? 0.6 : 0.4), rx = left ? hx - size * 0.9 : hx + size * 0.9;
  H.layRectAt(c, 'Columns rule', rx, Hh / 2, 2, Hh * 0.72, { fill: sc.accent, alpha: 0.85 }, envAlpha(c, 0.05, 0.35, 0.85));
  var sub = H.layLineText(c), fs = cl(uMin(c) * 0.032, 13, 32);
  H.addText(c, 'Columns sub', sub, rx + (left ? -fs * 1.4 : fs * 1.4), Hh / 2, fs, {
    font: serifFont(c), vertical: true, color: sc.sub
  }, envAlpha(c, 0.14, 0.35));
  H.laySetNodes(c, [{ text: txt, size: size, x: hx, y: Hh / 2, vertical: true, track: 0.02, color: sc.fg }]);
});

/* 19. circleWords: concentric counter-rotating radial word wheels around center */
reg('circleWords', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), Rmax = u * 0.45, gapR = u * 0.072, rings = P.rings || 3, R0 = Rmax - gapR * (rings - 1);
  var mt = H.laySplitLines(H.layText(c), 5), size = Math.min(H.layFitSize(c, mt, R0 * 1.4, R0 * 1.0, { track: 0.03, lead: 1.1 }), R0 * 0.54);
  var unit = H.layChars(H.layFlat(H.layLineText(c)) + ' * ');
  for (var ri = 0; ri < rings; ri++) {
    (function (ringIdx) {
      var Rr = Rmax - ringIdx * gapR, dir = ringIdx % 2 ? -1 : 1, sp = (P.speed || 9) * dir;
      H.layCircleAt(c, 'Word ring guide ' + ringIdx, W / 2, Hh / 2, Rr, Rr, { stroke: sc.sub, width: 1.2, alpha: 0.4 }, envAlpha(c, 0, 0.3, 0.4));
      var cnt = Math.min(18, Math.max(8, Math.floor(TAU * Rr / Math.max(22, u * 0.06))));
      for (var i = 0; i < cnt; i++) {
        (function (ci) {
          var ch = unit[ci % unit.length], rs = cl(u * 0.034 - ringIdx * 2, 10, 26);
          H.addText(c, 'Ring ' + ringIdx + ' ch ' + ci, ch, W / 2, Hh / 2, rs, { color: ringIdx === 0 ? sc.sub : sc.accent }, function (env, f) {
            var ang = ci / cnt * 360 + env.t * sp - 90;
            return {
              'position.x': Math.cos(ang * DEG) * Rr,
              'position.y': -Math.sin(ang * DEG) * Rr,
              rotation: -(ang + 90),
              alpha: 0.8 * H.layTin(c, f, 0, 0.25) * H.layTout(c, f)
            };
          });
        })(i);
      }
    })(ri);
  }
  H.laySetNodes(c, [{ text: mt, size: size, x: W / 2, y: Hh / 2, track: 0.03, lead: 1.1, color: sc.fg }]);
});

/* 20. dotMatrix: LED billboard frame with quantized dot grid backing */
reg('dotMatrix', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, port = isPort(c);
  var mt = H.laySplitLines(H.layText(c), port ? 4 : 8);
  var size = Math.min(H.layFitSize(c, mt, W * 0.8, Hh * 0.5, { lead: 1.25 }), Hh * 0.24);
  var gw = W * 0.88, gh = Hh * 0.64, cols = 28, rows = 14, cell = Math.min(gw / cols, gh / rows);
  var litC = H.layPlateCol(sc, [sc.accent, sc.fg], sc.bg, 2.2), panel = H.dark(sc.bg) ? H.mixHex(sc.bg, sc.fg, 0.06) : (sc.ink || sc.fg);
  H.layRRect(c, 'LED panel', W / 2 - gw / 2 - 14, Hh / 2 - gh / 2 - 14, gw + 28, gh + 28, 12, { fill: panel, stroke: sc.sub, width: 2, alpha: 0.95 }, envAlpha(c, 0, 0.25, 0.95));
  var dots = [];
  for (var r = 0; r < rows; r++) for (var col = 0; col < cols; col++) {
    dots.push([W / 2 - (cols - 1) * cell / 2 + col * cell, Hh / 2 - (rows - 1) * cell / 2 + r * cell, Math.max(1.5, cell * 0.16)]);
  }
  C.shape(c.graph, c.cut, c.cut.id + ' / LED grid dots', c.parent, H.dotCmds(c, dots), { fill: sc.sub, alpha: 0.22 });
  H.laySetNodes(c, [{ text: mt, size: size, x: W / 2, y: Hh / 2, lead: 1.25, color: litC }]);
});

/* 21. depthStack: directional offset stack trailing toward 3D horizon */
reg('depthStack', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var port = isPort(c), u = uMin(c), mt = H.laySplitLines(H.layText(c), port ? 5 : 9);
  var size = Math.min(H.layFitSize(c, mt, W * 0.66, Hh * 0.3, { track: 0.03, lead: 1.1 }), Hh * 0.2);
  var ang = (P.ang == null ? -40 : P.ang) * DEG, copies = cl(P.copies || 6, 3, 8), dist = u * (P.dist || 0.45);
  var vx = Math.cos(ang) * dist, vy = Math.sin(ang) * dist;
  for (var k = copies; k >= 1; k--) {
    var f = k / copies, outline = P.style !== 'dim' && (k % 2 === 1);
    H.addText(c, 'Depth layer ' + k, mt, W / 2 + vx * f, Hh / 2 + vy * f, size * (1 - f * 0.38), {
      color: sc.sub, fill: !outline, stroke: outline, strokeColor: sc.sub, strokeWidth: 1.4, alpha: 0.65 * (1 - f * 0.7)
    }, envAlpha(c, k * 0.03, 0.3, 0.65 * (1 - f * 0.7)));
  }
  H.laySetNodes(c, [{ text: mt, size: size, x: W / 2, y: Hh / 2, track: 0.03, lead: 1.1, color: sc.fg }]);
});

/* 22. typeSpecimen: Swiss foundry grid comparing weights & specimen numbers */
reg('typeSpecimen', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, txt = H.layText(c), u = uMin(c);
  var mx = W * 0.07, my = Hh * 0.1, gw = W - mx * 2, gh = Hh - my * 2, g = u * 0.02;
  var cw = (gw - g) / 2, ch = (gh - g) / 2, cap = cl(u * 0.017, 11, 22), specs = [];
  for (var i = 0; i < 4; i++) {
    var cx = mx + (i % 2) * (cw + g), cy = my + Math.floor(i / 2) * (ch + g), isMain = i === 0;
    H.layRectAt(c, 'Specimen cell ' + i, cx + cw / 2, cy + ch / 2, cw, ch, isMain ? { fill: sc.ink || sc.fg, alpha: 1 } : { stroke: sc.sub, width: 1.4, alpha: 0.75 }, envAlpha(c, i * 0.04, 0.3));
    var lbl = 'SPECIMEN 0' + (i + 1) + (isMain ? '  [PRIMARY]' : '');
    H.addText(c, 'Specimen head ' + i, lbl, cx + cap * 0.8, cy + cap * 1.1, cap, { font: monoFont(c), align: 'left', color: isMain ? H.textOn(sc.ink || sc.fg, sc.bg, sc) : sc.accent }, envAlpha(c, i * 0.04, 0.3));
    var fsz = Math.min(H.layFitSize(c, txt, cw * 0.82, ch * 0.55), ch * 0.42);
    specs.push({
      text: txt, size: fsz, x: cx + cw / 2, y: cy + ch * 0.58,
      color: isMain ? H.textOn(sc.ink || sc.fg, sc.bg, sc) : sc.sub,
      alpha: isMain ? 1 : 0.7, delaySec: i * 0.04, mi: i * 2
    });
  }
  H.laySetNodes(c, specs);
});

/* 23. kanjiFocus: towering sentinel glyph backdrop anchoring foreground lyric */
reg('kanjiFocus', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var port = isPort(c), chs = H.layChars(H.layText(c)), fch = chs[0] || '';
  for (var i = 0; i < chs.length; i++) { if (H.layIsKanji(chs[i])) { fch = chs[i]; break; } }
  var big = port ? W * 0.95 : Hh * 0.92, side = !port && P.pos !== 'center';
  var bx = side ? W * 0.32 : W / 2, by = Hh / 2, outline = P.mode === 'outline';
  H.addText(c, 'Focus glyph bg', fch, bx, by, big, {
    font: serifFont(c), color: P.mode === 'tint' ? sc.accent : sc.sub,
    fill: !outline, stroke: outline, strokeColor: sc.sub, strokeWidth: 2, alpha: outline ? 0.45 : 0.24
  }, envAlpha(c, 0, 0.4, outline ? 0.45 : 0.24));
  var mt = H.laySplitLines(H.layText(c), port ? 6 : 10);
  var size = Math.min(H.layFitSize(c, mt, W * (side ? 0.48 : 0.76), Hh * 0.34), Hh * 0.19);
  H.laySetNodes(c, [{ text: mt, size: size, x: side ? W * 0.64 : W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 24. halfVertical: orthogonal L-junction split between horizontal & vertical arms */
reg('halfVertical', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, txt = H.layFlat(H.layText(c));
  var parts = H.laySplitK(txt, 2), A = parts[0] || txt, B = parts[1] || '';
  var size = Math.min(H.layFitSize(c, A, W * 0.56, Hh * 0.24, { track: 0.06 }),
    B ? H.layFitSize(c, B, W * 0.28, Hh * 0.5, { vertical: true, track: 0.06 }) : 1e9, uMin(c) * 0.22);
  var mA = H.layMeasure(c, A, size, { track: 0.06 }), mB = B ? H.layMeasure(c, B, size, { vertical: true, track: 0.06 }) : { w: 0, h: 0 };
  var xA = W / 2 - (B ? size * 0.4 : 0), yA = Hh / 2 - (B ? mB.h * 0.28 : 0);
  var xB = xA + mA.w / 2 + size * 0.65, yB = yA + size * 0.4 + mB.h / 2;
  H.line(c, 'L-junction bracket', [[xA - mA.w / 2 - size * 0.3, yA - size * 0.7], [xB + size * 0.6, yA - size * 0.7], [xB + size * 0.6, yB + mB.h / 2]], sc.accent, 2, 0.85);
  var specs = [{ text: A, size: size, x: xA, y: yA, track: 0.06, color: sc.fg, mi: 0 }];
  if (B) specs.push({ text: B, size: size, x: xB, y: yB, vertical: true, track: 0.06, color: sc.accent, mi: 4 });
  H.laySetNodes(c, specs);
});

/* 25. curtain: pleated theatre drapes parting horizontally from center seam */
reg('curtain', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var port = isPort(c), mt = H.laySplitLines(H.layText(c), port ? 5 : 10);
  var size = Math.min(H.layFitSize(c, mt, W * 0.7, Hh * 0.44, { track: 0.05, lead: 1.15 }), Hh * 0.2);
  var panel = H.layPlateCol(sc, [sc.accent, sc.ink, sc.fg], sc.bg, 1.4), dr = P.drape !== false ? W * 0.08 : 0;
  H.layRectAt(c, 'Curtain left', W * 0.25, Hh / 2, W * 0.52, Hh + 8, { fill: panel, alpha: 0.94 }, function (env, f) {
    var open = E.inOutCubic(cl((env.t - 0.02) / 0.36)) * H.layTout(c, f);
    return { x: mix(W * 0.25, dr - W * 0.26, open), a: 0.94 };
  });
  H.layRectAt(c, 'Curtain right', W * 0.75, Hh / 2, W * 0.52, Hh + 8, { fill: panel, alpha: 0.94 }, function (env, f) {
    var open = E.inOutCubic(cl((env.t - 0.02) / 0.36)) * H.layTout(c, f);
    return { x: mix(W * 0.75, W - dr + W * 0.26, open), a: 0.94 };
  });
  H.laySetNodes(c, [{ text: mt, size: size, x: W / 2, y: Hh / 2, track: 0.05, lead: 1.15, color: sc.fg, delaySec: 0.08 }]);
});

/* 26. equalizer: dynamic vertical EQ spectrum columns beneath each glyph */
reg('equalizer', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, s = H.laySeed(c);
  var chs = H.layChars(H.layText(c)), n = chs.length, sw = W * 0.84 / Math.max(1, n);
  var size = Math.min(sw * 0.75, Hh * 0.14), bw = Math.min(sw * 0.62, size * 1.15), yb = Hh * 0.72, hmax = Hh * 0.38;
  var specs = chs.map(function (ch, i) {
    var x = W / 2 + (i - (n - 1) / 2) * sw, col = i % 2 ? sc.accent : (sc.accent2 || sc.fg);
    H.layRectAt(c, 'EQ bar ' + i, x, yb - hmax / 2, bw, hmax, { fill: col, alpha: 0.88 }, function (env, f) {
      var lv = 0.25 + 0.7 * (0.5 + 0.5 * Math.sin(env.t * 6.5 + i * 0.9 + (s % 5)));
      return { sy: Math.max(0.06, lv), y: yb - hmax * lv / 2, sx: 1, a: 0.88 * H.layTout(c, f) };
    });
    return { text: ch, size: size, x: x, y: yb + size * 0.85, color: sc.fg, mi: i };
  });
  H.laySetNodes(c, specs);
});

/* 27. tape: overlapping adhesive strips angled across canvas with bold stencil text */
reg('tape', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, s = H.laySeed(c);
  var port = isPort(c), chs = H.laySplitK(H.layText(c), port ? 2 : 1);
  var tapeC = H.layPlateCol(sc, [sc.accent, sc.ink, sc.fg], sc.bg, 1.6), tc = H.textOn(tapeC, sc.bg, sc);
  var ang = P.ang || (s % 2 ? -6 : 6), specs = [];
  chs.forEach(function (t, idx) {
    var y = Hh / 2 + (idx - (chs.length - 1) / 2) * Hh * 0.24, r0 = ang * (idx % 2 ? -1 : 1);
    var size = Math.min(H.layFitSize(c, t, W * 0.72, Hh * 0.2), Hh * 0.16), m = H.layMeasure(c, t, size);
    var L = m.w + size * 1.8, th = size * 1.6;
    H.layRectAt(c, 'Tape strip ' + idx, W / 2, y, L, th, { fill: idx ? (sc.ink || sc.fg) : tapeC, rot: r0, alpha: 0.96 }, popScale(c, idx * 0.08, 0.28));
    specs.push({ text: t, size: size, x: W / 2, y: y, rot: r0, color: idx ? H.textOn(sc.ink || sc.fg, sc.bg, sc) : tc, delaySec: idx * 0.08, mi: idx * 2 });
  });
  H.laySetNodes(c, specs);
});
})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
