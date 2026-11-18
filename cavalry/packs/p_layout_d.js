/* JIZURA Cavalry Pack: layoutsD (34 kinetic, faux-3D, physical & pop-graphic layouts from src/11p_layoutsD.js). */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, DEG = H.DEG, TAU = H.TAU;

function reg(key, fn, diffs) {
  N.register('layout', key, {
    source: 'src/11p_layoutsD.js (' + key + ')',
    scope: 'cut',
    build: fn,
    differences: diffs || ['Native Cavalry text nodes and editable vector geometry matching layoutsD:' + key + '.']
  });
}

function uMin(c) { return Math.min(c.comp.width, c.comp.height); }
function isPort(c) { return c.comp.height > c.comp.width * 1.08; }
function bodyFont(c) { return H.layFontObj(c, 'body'); }
function monoFont(c) { return H.layFontObj(c, 'mono'); }
function serifFont(c) { return H.layFontObj(c, 'serif'); }
function lightOf(sc) { return H.lum(sc.fg) > H.lum(sc.bg) ? sc.fg : sc.bg; }
function darkOf(sc) { return H.lum(sc.fg) > H.lum(sc.bg) ? sc.bg : sc.fg; }
function cardPal(sc) {
  var fill = lightOf(sc), dk = darkOf(sc);
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
function popScale(c, d, len) {
  return function (env, f) {
    var q = E.outBack(cl((env.t - (d || 0)) / Math.max(0.05, len || 0.32)), 1.45) * H.layTout(c, f);
    return { s: Math.max(0.001, q), a: q > 0.01 ? 1 : 0 };
  };
}
function fillPool(c) {
  var raw = H.layChars(H.layLineText(c) + H.layText(c));
  var hangul = /[\uAC00-\uD7AF\u3130-\u318F]/.test(H.layText(c) + H.layLineText(c));
  var extra = hangul ? ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하'] : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return raw.length >= 6 ? raw : raw.concat(extra);
}

/* 1. cube: orthographic 3D isometric cube carrying lyric chunks on visible faces */
reg('cube', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var h = Math.min(W * 0.28, Hh * 0.27, u * 0.34), cx = W / 2, cy = Hh / 2 + h * 0.12;
  var th = -24 * DEG, ph = 24 * DEG, cp = Math.cos(ph), sp = Math.sin(ph);
  var pc = H.layPlateCol(sc, [sc.ink, sc.fg, sc.accent], sc.bg, 1.5), tc = H.textOn(pc, sc.bg, sc);
  var topC = H.mixHex(pc, lightOf(sc), 0.24), sideC = H.mixHex(pc, darkOf(sc), 0.22);
  function facePts(m) {
    return [[-h, -h], [h, -h], [h, h], [-h, h]].map(function (pt) {
      return [m[0] * pt[0] + m[2] * pt[1] + m[4], m[1] * pt[0] + m[3] * pt[1] + m[5]];
    });
  }
  var ca = Math.cos(th), sa = Math.sin(th);
  var mFront = [ca, -sa * sp, 0, cp, cx + h * sa, cy + h * ca * sp];
  var aR = th + Math.PI / 2, cr = Math.cos(aR), sr = Math.sin(aR);
  var mRight = [cr, -sr * sp, 0, cp, cx + h * sr, cy + h * cr * sp];
  var mTop = [ca, -sa * sp, sa, ca * sp, cx, cy - h * cp];
  H.layPolyAt(c, 'Cube front', cx, cy, facePts(mFront), true, { fill: pc, stroke: darkOf(sc), width: 2, alpha: 1 }, envAlpha(c, 0, 0.35));
  H.layPolyAt(c, 'Cube side', cx, cy, facePts(mRight), true, { fill: sideC, stroke: darkOf(sc), width: 2, alpha: 1 }, envAlpha(c, 0.04, 0.35));
  H.layPolyAt(c, 'Cube top', cx, cy, facePts(mTop), true, { fill: topC, stroke: darkOf(sc), width: 2, alpha: 1 }, envAlpha(c, 0.06, 0.35));
  H.addText(c, 'Cube top tag', 'No.' + H.layLineNo(c), cx, cy - h * cp, h * 0.2, { font: monoFont(c), color: H.textOn(topC, sc.bg, sc) }, envAlpha(c, 0.1, 0.3));
  var chunks = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length >= 5 ? 2 : 1);
  var specs = [{
    text: H.laySplitLines(chunks[0], 5),
    size: Math.min(H.layFitSize(c, chunks[0], h * 1.4, h * 1.3), h * 0.72),
    x: cx + h * sa, y: cy + h * ca * sp, rot: -Math.atan2(-sa * sp, ca) / DEG, color: tc
  }];
  if (chunks[1]) {
    specs.push({
      text: H.laySplitLines(chunks[1], 5),
      size: Math.min(H.layFitSize(c, chunks[1], h * 0.85, h * 1.1), h * 0.45),
      x: cx + h * sr, y: cy + h * cr * sp, rot: -Math.atan2(-sr * sp, cr) / DEG, color: H.textOn(sideC, sc.bg, sc), mi: 3
    });
  }
  H.laySetNodes(c, specs);
});

/* 2. cylinder: revolving typographic drum with foreground band & scrolling ticker halo */
reg('cylinder', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var rx = Math.min(W * 0.34, u * 0.36), ry = rx * 0.2, h = Hh * 0.34, cx = W / 2, cy = Hh / 2;
  H.layCircleAt(c, 'Cyl top', cx, cy - h / 2, rx, ry, { stroke: sc.sub, width: 1.5, alpha: 0.5 }, envAlpha(c, 0.04, 0.35, 0.5));
  H.layCircleAt(c, 'Cyl bot', cx, cy + h / 2, rx, ry, { stroke: sc.sub, width: 1.5, alpha: 0.5 }, envAlpha(c, 0.04, 0.35, 0.5));
  H.line(c, 'Cyl L edge', [[cx - rx, cy - h / 2], [cx - rx, cy + h / 2]], sc.sub, 1.5, 0.5);
  H.line(c, 'Cyl R edge', [[cx + rx, cy - h / 2], [cx + rx, cy + h / 2]], sc.sub, 1.5, 0.5);
  var bandC = H.layPlateCol(sc, [sc.accent, sc.ink], sc.bg, 1.4);
  H.layRRect(c, 'Cyl band', cx - rx, cy - h * 0.28, rx * 2, h * 0.56, 8, { fill: bandC, alpha: 0.92 }, envAlpha(c, 0.06, 0.35, 0.92));
  var chars = H.layChars(H.layText(c)), n = chars.length, maxR = rx * 0.88;
  var sz = Math.min(u * 0.14, rx * 1.6 / Math.max(2, n));
  var specs = chars.map(function (ch, i) {
    var frac = n === 1 ? 0 : (i / (n - 1) - 0.5) * 1.6;
    var x = cx + Math.sin(frac) * maxR, y = cy + Math.cos(frac) * ry * 0.35;
    return { text: ch, size: sz, x: x, y: y, sx: Math.max(0.35, Math.cos(frac)), color: H.textOn(bandC, sc.bg, sc), mi: i };
  });
  H.laySetNodes(c, specs);
});

/* 3. flipCards: grid of playing-card tiles flipping sequentially face-up */
reg('flipCards', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), port = isPort(c);
  var chars = H.layChars(H.layText(c)), n = chars.length;
  var cols = Math.min(n, port ? 4 : 6), rows = Math.ceil(n / cols);
  var cw = Math.min(W * 0.82 / Math.max(1, cols * 1.15), Hh * 0.65 / Math.max(1, rows * 1.5), u * 0.2);
  var chh = cw * 1.38, gapX = cw * 1.15, gapY = chh * 1.14;
  var faceC = lightOf(sc), faceT = darkOf(sc), specs = [];
  chars.forEach(function (ch, i) {
    var r = Math.floor(i / cols), col = i % cols, rLen = Math.min(cols, n - r * cols);
    var cx = W / 2 + (col - (rLen - 1) / 2) * gapX, cy = Hh / 2 + (r - (rows - 1) / 2) * gapY;
    H.layPaper(c, 'Flip card ' + i, cx - cw / 2, cy - chh / 2, cw, chh, cw * 0.08, faceC, sc.sub, 0.008, function (env, f) {
      var fl = E.inOutCubic(cl((env.t - i * 0.05) / 0.35)) * H.layTout(c, f);
      return { sx: Math.max(0.04, fl), sy: 1, a: fl > 0.01 ? 1 : 0 };
    });
    specs.push({ text: ch, size: cw * 0.62, x: cx, y: cy, color: faceT, mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 4. accordion: zig-zag folded pleated brochure unfolding horizontally */
reg('accordion', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), k = Math.max(2, Math.min(8, chars.length));
  var pw = Math.min(W * 0.84 / k, u * 0.22), ph = Math.min(Hh * 0.62, pw * 2.2);
  var fold = 0.84, step = pw * fold, startX = W / 2 - (k - 1) * step / 2;
  var baseCol = H.layPlateCol(sc, [lightOf(sc), sc.accent], sc.bg, 1.4), tc = H.textOn(baseCol, sc.bg, sc);
  var specs = [];
  for (var i = 0; i < k; i++) {
    var cx = startX + i * step, up = i % 2 === 0;
    var fill = H.mixHex(baseCol, up ? lightOf(sc) : darkOf(sc), up ? 0.08 : 0.16);
    var skewY = (up ? -1 : 1) * ph * 0.07;
    var pts = [[cx - step / 2, Hh / 2 - ph / 2 - skewY], [cx + step / 2, Hh / 2 - ph / 2 + skewY], [cx + step / 2, Hh / 2 + ph / 2 + skewY], [cx - step / 2, Hh / 2 + ph / 2 - skewY]];
    H.layPolyAt(c, 'Pleat ' + i, cx, Hh / 2, pts, true, { fill: fill, stroke: sc.sub, width: 1.5, alpha: 1 }, envAlpha(c, i * 0.04, 0.3));
    if (chars[i]) {
      specs.push({ text: chars[i], size: Math.min(step * 0.72, ph * 0.4), x: cx, y: Hh / 2, rot: up ? -6 : 6, color: tc, mi: i * 2 });
    }
  }
  H.laySetNodes(c, specs);
});

/* 5. flag: waving pennant cloth mounted on vertical pole */
reg('flag', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var fw = Math.min(W * 0.66, Hh * 0.9), fh = fw * 0.56, poleX = W * 0.18, y0 = Hh / 2 - fh / 2;
  var flagC = H.layPlateCol(sc, [sc.accent, sc.ink, sc.fg], sc.bg, 1.4), tc = H.textOn(flagC, sc.bg, sc);
  H.layRectAt(c, 'Flag pole', poleX, Hh * 0.54, Math.max(4, u * 0.008), Hh * 0.76, { fill: sc.sub, alpha: 0.9 }, envAlpha(c, 0, 0.3, 0.9));
  H.layCircleAt(c, 'Pole finial', poleX, Hh * 0.16, u * 0.014, u * 0.014, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.02, 0.25));
  H.layRRect(c, 'Flag cloth', poleX + u * 0.006, y0, fw, fh, 4, { fill: flagC, alpha: 0.95 }, function (env, f) {
    var wave = Math.sin(env.t * 3.2) * 2.5;
    return { rot: wave, a: H.layTin(c, f, 0.05, 0.35) * H.layTout(c, f) * 0.95 };
  });
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, fw * 0.82, fh * 0.68), fh * 0.42);
  H.laySetNodes(c, [{ text: txt, size: size, x: poleX + u * 0.006 + fw / 2, y: Hh / 2, color: tc }]);
});

/* 6. ribbon: flowing banner ribbon scrolling across center with notched tails */
reg('ribbon', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var rw = W * 0.84, rh = Math.min(Hh * 0.28, u * 0.24), cx = W / 2, cy = Hh / 2;
  var ribC = H.layPlateCol(sc, [sc.accent, sc.ink, sc.fg], sc.bg, 1.4), tc = H.textOn(ribC, sc.bg, sc);
  var tailW = rh * 0.55;
  H.layPolyAt(c, 'Ribbon tail L', cx - rw / 2, cy + rh * 0.2, [[cx - rw / 2 - tailW, cy - rh * 0.3], [cx - rw / 2 + tailW * 0.2, cy - rh * 0.3], [cx - rw / 2 + tailW * 0.2, cy + rh * 0.7], [cx - rw / 2 - tailW, cy + rh * 0.7], [cx - rw / 2 - tailW * 0.55, cy + rh * 0.2]], true, { fill: H.mixHex(ribC, darkOf(sc), 0.35), alpha: 1 }, envAlpha(c, 0.06, 0.3));
  H.layPolyAt(c, 'Ribbon tail R', cx + rw / 2, cy + rh * 0.2, [[cx + rw / 2 - tailW * 0.2, cy - rh * 0.3], [cx + rw / 2 + tailW, cy - rh * 0.3], [cx + rw / 2 + tailW * 0.55, cy + rh * 0.2], [cx + rw / 2 + tailW, cy + rh * 0.7], [cx + rw / 2 - tailW * 0.2, cy + rh * 0.7]], true, { fill: H.mixHex(ribC, darkOf(sc), 0.35), alpha: 1 }, envAlpha(c, 0.06, 0.3));
  H.layRRect(c, 'Ribbon front', cx - rw / 2, cy - rh / 2, rw, rh, 2, { fill: ribC, alpha: 1 }, envAlpha(c, 0, 0.3));
  var txt = H.layFlat(H.layText(c)), size = Math.min(H.layFitSize(c, txt, rw * 0.88, rh * 0.68), rh * 0.52);
  H.laySetNodes(c, [{ text: txt, size: size, x: cx, y: cy, color: tc }]);
});

/* 7. pendulum: metronome/clock bob swinging beneath top pivot with harmonic glyph chain */
reg('pendulum', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var pivX = W / 2, pivY = Hh * 0.08, bobY = Hh * 0.62, L = bobY - pivY;
  H.layCircleAt(c, 'Pendulum pivot', pivX, pivY, u * 0.012, u * 0.012, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0, 0.25));
  H.layRectAt(c, 'Pendulum rod', pivX, pivY + L / 2, 2.5, L, { fill: sc.sub, alpha: 0.7 }, function (env, f) {
    var ang = Math.sin(env.t * 2.4) * 14, rad = ang * DEG;
    return { x: pivX + Math.sin(rad) * (L / 2), y: pivY + Math.cos(rad) * (L / 2), rot: -ang, a: 0.7 * H.layTin(c, f, 0, 0.25) * H.layTout(c, f) };
  });
  var txt = H.laySplitLines(H.layText(c), 7), size = Math.min(H.layFitSize(c, txt, W * 0.72, Hh * 0.32), u * 0.16);
  H.layCircleAt(c, 'Pendulum bob', pivX, bobY, size * 0.9, size * 0.9, { fill: sc.accent, alpha: 0.92 }, function (env, f) {
    var ang = Math.sin(env.t * 2.4) * 14, rad = ang * DEG;
    return { x: pivX + Math.sin(rad) * L, y: pivY + Math.cos(rad) * L, a: 0.92 * H.layTin(c, f, 0, 0.3) * H.layTout(c, f) };
  });
  H.laySetNodes(c, [{
    text: txt, size: size, x: pivX, y: bobY, color: H.textOn(sc.accent, sc.bg, sc),
    animPlace: function (env) {
      var ang = Math.sin(env.t * 2.4) * 14, rad = ang * DEG;
      return { x: pivX + Math.sin(rad) * L, y: pivY + Math.cos(rad) * L, rot: -ang * 0.35 };
    }
  }]);
});

/* 8. pile: tumbled pyramid mound of glyph blocks settled at bottom floor */
reg('pile', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), seed = H.laySeed(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, bw = Math.min(W * 0.78 / Math.max(2, Math.ceil(Math.sqrt(n) * 1.4)), u * 0.16);
  var floorY = Hh * 0.82, specs = [];
  H.layRectAt(c, 'Pile floor', W / 2, floorY + u * 0.01, W * 0.86, 3, { fill: sc.sub, alpha: 0.65 }, envAlpha(c, 0, 0.3, 0.65));
  var row = 0, idx = 0;
  while (idx < n) {
    var per = Math.max(1, Math.min(n - idx, Math.ceil(Math.sqrt(n)) + 1 - row));
    for (var j = 0; j < per && idx < n; j++, idx++) {
      var x = W / 2 + (j - (per - 1) / 2) * bw * 1.04 + (R.hash01(seed, idx, 1) - 0.5) * bw * 0.12;
      var y = floorY - bw * 0.52 - row * bw * 0.96, rot = (R.hash01(seed, idx, 2) - 0.5) * 16;
      specs.push({ text: chars[idx], size: bw * 0.82, x: x, y: y, rot: rot, color: idx % 3 === 0 ? sc.accent : sc.fg, mi: idx });
    }
    row++;
  }
  H.laySetNodes(c, specs);
});

/* 9. blocks: solid wooden toy cubes stacked cleanly with drop bounce */
reg('blocks', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), seed = H.laySeed(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, cols = Math.min(n, 5);
  var sz = Math.min(W * 0.8 / Math.max(2, cols * 1.15), u * 0.18), floorY = Hh * 0.8;
  var pal = [sc.accent, sc.ink || sc.fg, lightOf(sc), sc.accent2 || sc.sub], specs = [];
  H.layRectAt(c, 'Blocks shelf', W / 2, floorY + u * 0.01, W * 0.84, 3, { fill: sc.sub, alpha: 0.6 }, envAlpha(c, 0, 0.3, 0.6));
  chars.forEach(function (ch, i) {
    var col = i % cols, r = Math.floor(i / cols);
    var rLen = Math.min(cols, n - r * cols);
    var x = W / 2 + (col - (rLen - 1) / 2) * sz * 1.06;
    var y = floorY - sz / 2 - r * sz * 1.04, fill = pal[i % pal.length];
    var rot = (R.hash01(seed, i, 3) - 0.5) * 5;
    H.layRRect(c, 'Toy block ' + i, x - sz / 2, y - sz / 2, sz, sz, 6, { fill: fill, stroke: darkOf(sc), width: 1.5, rot: rot, alpha: 1 }, popScale(c, i * 0.04, 0.35));
    specs.push({ text: ch, size: sz * 0.6, x: x, y: y, rot: rot, color: H.textOn(fill, sc.bg, sc), mi: i });
  });
  H.laySetNodes(c, specs);
});

/* 10. balloons: buoyant oval balloons bobbing on curved strings */
reg('balloons', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), seed = H.laySeed(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, r = Math.min(W * 0.4 / Math.max(2, n * 0.9), u * 0.11);
  var cols = [sc.accent, sc.fg, sc.accent2 || sc.sub], specs = [];
  chars.forEach(function (ch, i) {
    var bx = W / 2 + (i - (n - 1) / 2) * r * 2.05;
    var by = Hh * 0.42 + Math.sin(i * 1.7 + seed) * u * 0.06, fill = cols[i % cols.length];
    H.line(c, 'Balloon string ' + i, [[bx, by + r * 1.15], [bx + Math.sin(i) * r * 0.4, Hh * 0.88]], sc.sub, 1.5, 0.55);
    H.layCircleAt(c, 'Balloon ' + i, bx, by, r, r * 1.18, { fill: fill, alpha: 0.95 }, function (env, f) {
      return { y: by + Math.sin(env.t * 2 + i) * u * 0.015, a: 0.95 * H.layTin(c, f, i * 0.04, 0.3) * H.layTout(c, f) };
    });
    specs.push({
      text: ch, size: r * 1.05, x: bx, y: by, color: H.textOn(fill, sc.bg, sc), mi: i,
      animPlace: function (env) { return { dy: Math.sin(env.t * 2 + i) * u * 0.015 }; }
    });
  });
  H.laySetNodes(c, specs);
});

/* 11. magnets: tilted fridge-magnet plastic letter tiles over metal surface */
reg('magnets', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), seed = H.laySeed(c);
  var chars = H.layChars(H.layText(c)), n = chars.length;
  var cols = Math.min(n, isPort(c) ? 4 : 6), rows = Math.ceil(n / cols);
  var ts = Math.min(W * 0.82 / Math.max(1, cols * 1.25), Hh * 0.65 / Math.max(1, rows * 1.3), u * 0.16);
  var pal = [sc.accent, lightOf(sc), sc.accent2 || sc.fg], specs = [];
  chars.forEach(function (ch, i) {
    var r = Math.floor(i / cols), col = i % cols, rLen = Math.min(cols, n - r * cols);
    var cx = W / 2 + (col - (rLen - 1) / 2) * ts * 1.22, cy = Hh / 2 + (r - (rows - 1) / 2) * ts * 1.28;
    var rot = (R.hash01(seed, i, 7) - 0.5) * 18, fill = pal[i % pal.length];
    H.layPaper(c, 'Magnet ' + i, cx - ts * 0.48, cy - ts * 0.52, ts * 0.96, ts * 1.04, 6, fill, null, 0.008, popScale(c, i * 0.035, 0.28));
    specs.push({ text: ch, size: ts * 0.68, x: cx, y: cy, rot: rot, color: H.textOn(fill, sc.bg, sc), mi: i });
  });
  H.laySetNodes(c, specs);
});

/* 12. tiles: classic word-game square tiles with corner point values */
reg('tiles', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, tw = Math.min(W * 0.84 / Math.max(1, n * 1.08), u * 0.17);
  var C0 = cardPal(sc), specs = [];
  chars.forEach(function (ch, i) {
    var cx = W / 2 + (i - (n - 1) / 2) * tw * 1.08, cy = Hh / 2;
    H.layPaper(c, 'Scrabble tile ' + i, cx - tw * 0.47, cy - tw * 0.5, tw * 0.94, tw, tw * 0.1, C0.fill, C0.edge, 0.01, popScale(c, i * 0.04, 0.3));
    H.addText(c, 'Tile score ' + i, String((i % 5) + 1), cx + tw * 0.3, cy + tw * 0.3, tw * 0.18, { font: monoFont(c), color: sc.accent }, envAlpha(c, i * 0.04 + 0.08, 0.25));
    specs.push({ text: ch, font: serifFont(c), size: tw * 0.58, x: cx, y: cy - tw * 0.03, color: C0.text, mi: i });
  });
  H.laySetNodes(c, specs);
});

/* 13. bulbs: vintage marquee theatre signboard ringed with glowing chase bulbs */
reg('bulbs', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var bw = Math.min(W * 0.84, Hh * 1.35), bh = bw * 0.42, x0 = (W - bw) / 2, y0 = (Hh - bh) / 2;
  var boardC = H.layPlateCol(sc, [sc.ink, darkOf(sc)], sc.bg, 1.3), tc = H.textOn(boardC, sc.bg, sc);
  H.layRRect(c, 'Marquee sign', x0, y0, bw, bh, 12, { fill: boardC, stroke: sc.accent, width: 3, alpha: 1 }, envAlpha(c, 0, 0.3));
  var perH = 12, perV = 5, bIdx = 0, br = Math.max(3, u * 0.008);
  function addBulb(bx, by) {
    var idx = bIdx++;
    H.layCircleAt(c, 'Bulb ' + idx, bx, by, br, br, { fill: sc.accent, alpha: 0.9 }, function (env, f) {
      var on = Math.sin(env.t * 8 - idx * 0.7) > 0 ? 1 : 0.3;
      return { a: on * H.layTin(c, f, 0.05, 0.25) * H.layTout(c, f) };
    });
  }
  for (var i = 0; i <= perH; i++) {
    addBulb(mix(x0 + bh * 0.08, x0 + bw - bh * 0.08, i / perH), y0 + bh * 0.08);
    addBulb(mix(x0 + bh * 0.08, x0 + bw - bh * 0.08, i / perH), y0 + bh * 0.92);
  }
  for (var j = 1; j < perV; j++) {
    addBulb(x0 + bh * 0.08, mix(y0 + bh * 0.08, y0 + bh * 0.92, j / perV));
    addBulb(x0 + bw - bh * 0.08, mix(y0 + bh * 0.08, y0 + bh * 0.92, j / perV));
  }
  var txt = H.laySplitLines(H.layText(c), 9), size = Math.min(H.layFitSize(c, txt, bw * 0.78, bh * 0.6), bh * 0.45);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: Hh / 2, color: tc }]);
});

/* 14. ledScroll: recessed LED dot-matrix display cabinet with glowing scan bar */
reg('ledScroll', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var mw = W * 0.88, mh = Math.min(Hh * 0.34, u * 0.32), x0 = (W - mw) / 2, y0 = (Hh - mh) / 2;
  H.layRRect(c, 'LED cabinet', x0, y0, mw, mh, 8, { fill: darkOf(sc), stroke: sc.sub, width: 2.5, alpha: 1 }, envAlpha(c, 0, 0.25));
  var cols = 18, dx = mw / cols;
  for (var i = 1; i < cols; i++) {
    H.line(c, 'LED col ' + i, [[x0 + i * dx, y0 + 6], [x0 + i * dx, y0 + mh - 6]], sc.sub, 1, 0.16);
  }
  var txt = H.layFlat(H.layText(c)), size = Math.min(H.layFitSize(c, txt, mw * 0.86, mh * 0.65, { font: monoFont(c) }), mh * 0.56);
  H.laySetNodes(c, [{
    text: txt, font: monoFont(c), size: size, x: W / 2, y: Hh / 2, color: sc.accent,
    animPlace: function (env) {
      var drift = Math.sin(env.t * 1.4) * mw * 0.06;
      return { dx: drift };
    }
  }]);
});

/* 15. billboard: roadside rooftop billboard frame on support trusses */
reg('billboard', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var bw = Math.min(W * 0.84, Hh * 1.35), bh = bw * 0.5, x0 = (W - bw) / 2, y0 = Hh * 0.18;
  var C0 = cardPal(sc);
  [-0.28, 0.28].forEach(function (k, pi) {
    H.layRectAt(c, 'Billboard leg ' + pi, W / 2 + bw * k, y0 + bh + Hh * 0.15, Math.max(8, u * 0.022), Hh * 0.32, { fill: sc.sub, alpha: 0.85 }, envAlpha(c, 0, 0.3, 0.85));
  });
  H.layPaper(c, 'Billboard frame', x0, y0, bw, bh, 4, C0.fill, sc.fg, 0.012, envAlpha(c, 0.04, 0.3));
  var txt = H.laySplitLines(H.layText(c), 9), size = Math.min(H.layFitSize(c, txt, bw * 0.84, bh * 0.66), bh * 0.42);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: y0 + bh * 0.48, color: C0.text }]);
});

/* 16. crowdBubbles: overlapping speech bubbles packed with echo replies */
reg('crowdBubbles', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var C0 = cardPal(sc), heroW = Math.min(W * 0.72, u * 0.72), heroH = Math.min(Hh * 0.34, u * 0.32);
  var spots = [[0.24, 0.24, 0.72], [0.76, 0.26, 0.68], [0.22, 0.76, 0.68], [0.78, 0.74, 0.72]];
  var echo = H.layAltCopy(c);
  spots.forEach(function (sp, i) {
    var bx = W * sp[0], by = Hh * sp[1], bw = heroW * 0.46, bh = heroH * 0.52;
    H.layRRect(c, 'Echo bubble ' + i, bx - bw / 2, by - bh / 2, bw, bh, bh * 0.4, { fill: sc.sub, alpha: 0.28 }, envAlpha(c, 0.08 + i * 0.05, 0.3, 0.28));
    H.addText(c, 'Echo text ' + i, echo, bx, by, bh * 0.26, { color: sc.sub, alpha: 0.65 }, envAlpha(c, 0.1 + i * 0.05, 0.3, 0.65));
  });
  H.layPaper(c, 'Hero bubble', W / 2 - heroW / 2, Hh / 2 - heroH / 2, heroW, heroH, heroH * 0.42, C0.fill, sc.accent, 0.012, popScale(c, 0, 0.32));
  var txt = H.laySplitLines(H.layText(c), 9), size = Math.min(H.layFitSize(c, txt, heroW * 0.82, heroH * 0.68), heroH * 0.42);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: Hh / 2, color: C0.text }]);
});

/* 17. crossword: interlocking horizontal & vertical crossword tiles with clue numbers */
reg('crossword', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length >= 5 ? 2 : 1);
  var aChars = H.layChars(chunks[0]), bChars = chunks[1] ? H.layChars(chunks[1]) : [];
  var cols = Math.max(aChars.length, 3), rows = Math.max(bChars.length + 1, 3);
  var cs = Math.min(W * 0.8 / Math.max(3, cols + 1), Hh * 0.72 / Math.max(3, rows + 1), u * 0.12);
  var C0 = cardPal(sc), specs = [], cy = Hh / 2, cx = W / 2;
  aChars.forEach(function (ch, i) {
    var x = cx + (i - (aChars.length - 1) / 2) * cs;
    H.layRRect(c, 'CW H ' + i, x - cs * 0.46, cy - cs * 0.46, cs * 0.92, cs * 0.92, 2, { fill: C0.fill, stroke: sc.accent, width: 1.5, alpha: 1 }, envAlpha(c, i * 0.03, 0.25));
    if (i === 0) H.addText(c, 'CW 1A', '1', x - cs * 0.34, cy - cs * 0.34, cs * 0.2, { font: monoFont(c), color: sc.accent }, envAlpha(c, 0.08, 0.2));
    specs.push({ text: ch, size: cs * 0.56, x: x, y: cy, color: C0.text, mi: i });
  });
  var vx = cx + (Math.floor(aChars.length / 2) - (aChars.length - 1) / 2) * cs;
  bChars.forEach(function (ch, j) {
    var y = cy + (j + 1) * cs;
    H.layRRect(c, 'CW V ' + j, vx - cs * 0.46, y - cs * 0.46, cs * 0.92, cs * 0.92, 2, { fill: C0.fill, stroke: sc.sub, width: 1.5, alpha: 1 }, envAlpha(c, 0.12 + j * 0.03, 0.25));
    specs.push({ text: ch, size: cs * 0.56, x: vx, y: y, color: C0.text, mi: aChars.length + j });
  });
  H.laySetNodes(c, specs);
});

/* 18. wordSearch: square letter-search grid highlighting the lyric capsule inside */
reg('wordSearch', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), seed = H.laySeed(c);
  var chars = H.layChars(H.layText(c)), cols = Math.max(chars.length + 2, 6), rows = 5;
  var cell = Math.min(W * 0.84 / cols, Hh * 0.72 / rows, u * 0.11);
  var gw = cols * cell, gh = rows * cell, x0 = (W - gw) / 2, y0 = (Hh - gh) / 2;
  var targetRow = Math.floor(rows / 2), startCol = Math.floor((cols - chars.length) / 2);
  var pool = fillPool(c), specs = [];
  H.layRRect(c, 'WS pill', x0 + startCol * cell + cell * 0.06, y0 + targetRow * cell + cell * 0.06, chars.length * cell - cell * 0.12, cell * 0.88, cell * 0.42, { fill: sc.accent, alpha: 0.92 }, envAlpha(c, 0.12, 0.35, 0.92));
  for (var r = 0; r < rows; r++) {
    for (var col = 0; col < cols; col++) {
      var x = x0 + (col + 0.5) * cell, y = y0 + (r + 0.5) * cell;
      var inWord = r === targetRow && col >= startCol && col < startCol + chars.length;
      if (inWord) {
        specs.push({ text: chars[col - startCol], size: cell * 0.62, x: x, y: y, color: H.textOn(sc.accent, sc.bg, sc), mi: col - startCol });
      } else {
        var dec = pool[(R.hash(seed, r * 13 + col, 4)) % pool.length];
        H.addText(c, 'WS dec ' + r + '_' + col, dec, x, y, cell * 0.48, { color: sc.sub, alpha: 0.35 }, envAlpha(c, 0.04, 0.3, 0.35));
      }
    }
  }
  H.laySetNodes(c, specs);
});

/* 19. puzzle: interlocking jigsaw tile grid centering the key glyph pieces */
reg('puzzle', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, cols = Math.min(n, 5), rows = Math.ceil(n / cols);
  var ps = Math.min(W * 0.8 / Math.max(1, cols * 1.15), Hh * 0.68 / Math.max(1, rows * 1.15), u * 0.17);
  var specs = [], C0 = cardPal(sc);
  chars.forEach(function (ch, i) {
    var r = Math.floor(i / cols), col = i % cols, rLen = Math.min(cols, n - r * cols);
    var cx = W / 2 + (col - (rLen - 1) / 2) * ps * 1.04, cy = Hh / 2 + (r - (rows - 1) / 2) * ps * 1.04;
    var fill = i % 2 === 0 ? sc.accent : C0.fill;
    H.layRRect(c, 'Jigsaw ' + i, cx - ps * 0.48, cy - ps * 0.48, ps * 0.96, ps * 0.96, 6, { fill: fill, stroke: sc.bg, width: 2, alpha: 1 }, popScale(c, i * 0.04, 0.32));
    if (col < rLen - 1) H.layCircleAt(c, 'Jig knob ' + i, cx + ps * 0.48, cy, ps * 0.14, ps * 0.14, { fill: fill, alpha: 1 }, envAlpha(c, i * 0.04, 0.3));
    specs.push({ text: ch, size: ps * 0.56, x: cx, y: cy, color: H.textOn(fill, sc.bg, sc), mi: i });
  });
  H.laySetNodes(c, specs);
});

/* 20. shadowPlay: crisp foreground lyric casting a dramatic long perspective drop-shadow */
reg('shadowPlay', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), isPort(c) ? 6 : 9);
  var size = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.46), u * 0.22);
  var shCol = darkOf(sc) === sc.bg ? sc.sub : darkOf(sc);
  H.addText(c, 'Long shadow', txt, W / 2 + u * 0.045, Hh * 0.48 + u * 0.045, size, { color: shCol, alpha: 0.38 }, function (env, f) {
    var k = E.outCubic(cl(env.t / 0.4)) * H.layTout(c, f);
    return { 'scale.x': 1 + k * 0.08, 'scale.y': 0.92, alpha: 0.38 * k };
  });
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: Hh * 0.48, color: sc.fg }]);
});

/* 21. kaleido: radial kaleidoscope petals framing a centered hero lockup */
reg('kaleido', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var Np = 8, Rr = u * 0.34, unit = H.layChars(H.layText(c))[0] || '*';
  for (var i = 0; i < Np; i++) {
    var a = i / Np * TAU, px = W / 2 + Math.cos(a) * Rr, py = Hh / 2 + Math.sin(a) * Rr;
    H.addText(c, 'Kaleido petal ' + i, unit, px, py, u * 0.08, { rot: a / DEG + 90, color: i % 2 ? sc.accent : sc.sub, alpha: 0.45 }, envAlpha(c, i * 0.03, 0.35, 0.45));
  }
  H.layCircleAt(c, 'Kaleido ring', W / 2, Hh / 2, Rr * 0.72, Rr * 0.72, { stroke: sc.accent, width: 2, alpha: 0.6 }, envAlpha(c, 0.05, 0.35, 0.6));
  var txt = H.laySplitLines(H.layText(c), 7), size = Math.min(H.layFitSize(c, txt, W * 0.64, Hh * 0.4), u * 0.16);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 22. dominoes: row of double-pipped domino slabs cascading sequentially */
reg('dominoes', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, dw = Math.min(W * 0.84 / Math.max(1, n * 1.14), u * 0.14);
  var dh = dw * 1.9, face = lightOf(sc), ink = darkOf(sc), specs = [];
  chars.forEach(function (ch, i) {
    var cx = W / 2 + (i - (n - 1) / 2) * dw * 1.14, cy = Hh / 2;
    H.layPaper(c, 'Domino ' + i, cx - dw / 2, cy - dh / 2, dw, dh, 4, face, sc.sub, 0.008, function (env, f) {
      var p = cl((env.t - i * 0.04) / 0.3);
      return { rot: (1 - E.outBack(p, 1.3)) * -22, a: E.outCubic(p) * H.layTout(c, f) };
    });
    H.line(c, 'Domino bar ' + i, [[cx - dw * 0.38, cy + dh * 0.12], [cx + dw * 0.38, cy + dh * 0.12]], sc.sub, 1.5, 0.6);
    H.layCircleAt(c, 'Domino pip ' + i, cx, cy + dh * 0.3, dw * 0.09, dw * 0.09, { fill: sc.accent, alpha: 1 }, envAlpha(c, i * 0.04 + 0.08, 0.25));
    specs.push({ text: ch, size: dw * 0.6, x: cx, y: cy - dh * 0.18, color: ink, mi: i });
  });
  H.laySetNodes(c, specs);
});

/* 23. burst: jagged comic starburst explosion polygon with punchy hero lettering */
reg('burst', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var spikes = 16, rx0 = Math.min(W * 0.44, u * 0.48), ry0 = Math.min(Hh * 0.38, u * 0.38);
  var pts = [];
  for (var i = 0; i < spikes * 2; i++) {
    var a = i / (spikes * 2) * TAU, k = i % 2 === 0 ? 1 : 0.72;
    pts.push([W / 2 + Math.cos(a) * rx0 * k, Hh / 2 + Math.sin(a) * ry0 * k]);
  }
  H.layPolyAt(c, 'Comic starburst', W / 2, Hh / 2, pts, true, { fill: sc.accent, stroke: sc.fg, width: 3, alpha: 1 }, popScale(c, 0, 0.28));
  var tc = H.textOn(sc.accent, sc.bg, sc), txt = H.laySplitLines(H.layText(c), 7);
  var size = Math.min(H.layFitSize(c, txt, rx0 * 1.15, ry0 * 0.9), u * 0.18);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: Hh / 2, rot: -4, color: tc }]);
});

/* 24. fisheye: central convex glass lens magnifying center glyphs & shrinking edges */
reg('fisheye', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, lr = Math.min(W, Hh) * 0.38;
  H.layCircleAt(c, 'Fisheye lens', W / 2, Hh / 2, lr, lr, { stroke: sc.accent, width: 2.5, alpha: 0.65 }, envAlpha(c, 0, 0.35, 0.65));
  H.layCircleAt(c, 'Fisheye ring 2', W / 2, Hh / 2, lr * 0.7, lr * 0.7, { stroke: sc.sub, width: 1.5, alpha: 0.4 }, envAlpha(c, 0.04, 0.35, 0.4));
  var baseS = Math.min(W * 0.8 / Math.max(2, n), u * 0.16), specs = [];
  chars.forEach(function (ch, i) {
    var u0 = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2;
    var bump = 1 + 0.55 * (1 - u0 * u0);
    specs.push({ text: ch, size: baseS * bump, x: W / 2 + u0 * lr * 0.95, y: Hh / 2, color: Math.abs(u0) < 0.35 ? sc.accent : sc.fg, mi: i });
  });
  H.laySetNodes(c, specs);
});

/* 25. wall: receding diagonal perspective brick wall with stenciled lyric mural */
reg('wall', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  for (var r = 1; r <= 4; r++) {
    var yL = Hh * (0.15 + r * 0.16), yR = Hh * (0.25 + r * 0.12);
    H.line(c, 'Wall seam ' + r, [[W * 0.08, yL], [W * 0.92, yR]], sc.sub, 1.5, 0.35);
  }
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, W * 0.76, Hh * 0.48), u * 0.2);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: Hh / 2, rot: -5, color: sc.fg }]);
});

/* 26. origami: folded geometric polygon facets hosting split lyric planes */
reg('origami', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var r = Math.min(W, Hh) * 0.36, cx = W / 2, cy = Hh / 2, C0 = cardPal(sc);
  var pL = [[cx, cy - r], [cx - r * 1.15, cy + r * 0.3], [cx, cy + r * 0.95]];
  var pR = [[cx, cy - r], [cx + r * 1.15, cy + r * 0.3], [cx, cy + r * 0.95]];
  H.layPolyAt(c, 'Origami L', cx - r * 0.5, cy, pL, true, { fill: C0.fill, stroke: sc.sub, width: 1.5, alpha: 1 }, envAlpha(c, 0, 0.35));
  H.layPolyAt(c, 'Origami R', cx + r * 0.5, cy, pR, true, { fill: H.mixHex(C0.fill, sc.accent, 0.22), stroke: sc.sub, width: 1.5, alpha: 1 }, envAlpha(c, 0.06, 0.35));
  var txt = H.laySplitLines(H.layText(c), 7), size = Math.min(H.layFitSize(c, txt, r * 1.35, r * 1.1), r * 0.44);
  H.laySetNodes(c, [{ text: txt, font: serifFont(c), size: size, x: cx, y: cy + r * 0.1, color: C0.text }]);
});

/* 27. zipper: metallic toothed zip track unzipping vertically to expose centerpiece */
reg('zipper', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var gapW = Math.min(W * 0.72, u * 0.76);
  for (var t = 0; t < 8; t++) {
    var ty = Hh * (0.14 + t * 0.095), side = t % 2 ? 1 : -1;
    H.layRectAt(c, 'Zip tooth ' + t, W / 2 + side * gapW * 0.52, ty, u * 0.028, u * 0.012, { fill: sc.sub, alpha: 0.75 }, envAlpha(c, t * 0.025, 0.25, 0.75));
  }
  H.layRRect(c, 'Zipper pull', W / 2 - u * 0.022, Hh * 0.84, u * 0.044, u * 0.068, 6, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.1, 0.3));
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, gapW * 0.88, Hh * 0.48), u * 0.18);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: Hh * 0.48, color: sc.fg }]);
});

/* 28. sliceStack: Venetian horizontal Venetian-blind sliced planes revealing stacked lyric */
reg('sliceStack', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length >= 5 ? 3 : 2);
  var k = chunks.length, rowH = Math.min(Hh * 0.18, u * 0.16), specs = [];
  chunks.forEach(function (ch, i) {
    var y = Hh / 2 + (i - (k - 1) / 2) * rowH * 1.18;
    var fill = i % 2 === 0 ? sc.accent : (sc.ink || sc.fg);
    H.layRRect(c, 'Slice bar ' + i, W * 0.12, y - rowH * 0.46, W * 0.76, rowH * 0.92, 4, { fill: fill, alpha: 1 }, function (env, f) {
      var slide = E.outExpo(cl((env.t - i * 0.06) / 0.38)) * H.layTout(c, f);
      return { x: mix(W * (i % 2 ? 0.85 : 0.15), W / 2, slide), a: slide > 0.01 ? 1 : 0 };
    });
    var sz = Math.min(H.layFitSize(c, ch, W * 0.68, rowH * 0.72), rowH * 0.65);
    specs.push({ text: ch, size: sz, x: W / 2, y: y, color: H.textOn(fill, sc.bg, sc), mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 29. glitchGrid: high-contrast checkered data cells flashing per glyph */
reg('glitchGrid', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), seed = H.laySeed(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, cols = Math.min(n, 5), rows = Math.ceil(n / cols);
  var cs = Math.min(W * 0.84 / cols, Hh * 0.7 / rows, u * 0.18), specs = [];
  chars.forEach(function (ch, i) {
    var r = Math.floor(i / cols), col = i % cols, rLen = Math.min(cols, n - r * cols);
    var cx = W / 2 + (col - (rLen - 1) / 2) * cs, cy = Hh / 2 + (r - (rows - 1) / 2) * cs;
    var inv = (R.hash(seed, i, 2) % 3) === 0, fill = inv ? sc.fg : sc.accent;
    H.layRectAt(c, 'Glitch cell ' + i, cx, cy, cs * 0.94, cs * 0.94, { fill: fill, stroke: sc.bg, width: 2, alpha: 1 }, envAlpha(c, i * 0.025, 0.2));
    specs.push({ text: ch, font: monoFont(c), size: cs * 0.62, x: cx, y: cy, color: H.textOn(fill, sc.bg, sc), mi: i });
  });
  H.laySetNodes(c, specs);
});

/* 30. mosaicTiles: coarse architectural mosaic backing tiles around bright center glyph */
reg('mosaicTiles', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), seed = H.laySeed(c);
  var cols = 9, rows = 5, cs = Math.min(W * 0.86 / cols, Hh * 0.74 / rows);
  var x0 = W / 2 - cols * cs / 2, y0 = Hh / 2 - rows * cs / 2;
  for (var r = 0; r < rows; r++) {
    for (var col = 0; col < cols; col++) {
      var d = Math.hypot((col - (cols - 1) / 2) / cols, (r - (rows - 1) / 2) / rows);
      if (d < 0.22) continue;
      var fill = R.hash01(seed, r * 11 + col, 3) > 0.5 ? sc.sub : sc.accent;
      H.layRectAt(c, 'Mosaic ' + r + '_' + col, x0 + (col + 0.5) * cs, y0 + (r + 0.5) * cs, cs * 0.86, cs * 0.86, { fill: fill, alpha: 0.35 }, envAlpha(c, d * 0.15, 0.3, 0.35));
    }
  }
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, W * 0.74, Hh * 0.44), u * 0.2);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 31. maskReveal: wide keyhole / slit window sliding vertically to reveal centerpiece */
reg('maskReveal', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var txt = H.laySplitLines(H.layText(c), isPort(c) ? 5 : 8);
  var size = Math.min(H.layFitSize(c, txt, W * 0.84, Hh * 0.52), u * 0.24);
  var winW = W * 0.86, winH = Math.min(Hh * 0.48, size * 2.2);
  H.layRRect(c, 'Window frame', (W - winW) / 2, (Hh - winH) / 2, winW, winH, 6, { stroke: sc.accent, width: Math.max(2, u * 0.004), alpha: 0.9 }, envAlpha(c, 0, 0.3, 0.9));
  H.laySetNodes(c, [{
    text: txt, size: size, x: W / 2, y: Hh / 2, color: sc.fg,
    clipRectFn: function (env, f) {
      var o = E.outExpo(cl(env.t / 0.45)) * H.layTout(c, f);
      var hh = winH * 0.5 * cl(o, 0.02, 1);
      return [W / 2 - winW / 2, Hh / 2 - hh, W / 2 + winW / 2, Hh / 2 + hh];
    }
  }]);
});

/* 32. contour: concentric orthographic topographic isoline rings framing lyric */
reg('contour', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var rings = 7, maxR = Math.min(W, Hh) * 0.44;
  for (var i = 1; i <= rings; i++) {
    var k = i / rings;
    H.layCircleAt(c, 'Contour ' + i, W / 2, Hh / 2, maxR * k * 1.15, maxR * k * 0.85, { stroke: i % 2 ? sc.accent : sc.sub, width: 1.5, alpha: 0.25 + (1 - k) * 0.45 }, envAlpha(c, i * 0.03, 0.35, 0.25 + (1 - k) * 0.45));
  }
  var txt = H.laySplitLines(H.layText(c), 8), size = Math.min(H.layFitSize(c, txt, W * 0.72, Hh * 0.4), u * 0.18);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 33. halftoneBig: monumental display text set over radial dot-screen gradient matrix */
reg('halftoneBig', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var cols = 10, rows = 5, sx = W * 0.8 / (cols - 1), sy = Hh * 0.6 / (rows - 1);
  for (var r = 0; r < rows; r++) {
    for (var col = 0; col < cols; col++) {
      var u0 = r / (rows - 1), rad = Math.max(2, u * 0.024 * (1 - u0 * 0.78));
      H.layCircleAt(c, 'HT dot ' + r + '_' + col, W * 0.1 + col * sx, Hh * 0.2 + r * sy, rad, rad, { fill: sc.accent, alpha: 0.28 }, envAlpha(c, r * 0.04, 0.3, 0.28));
    }
  }
  var txt = H.laySplitLines(H.layText(c), isPort(c) ? 5 : 8);
  var size = Math.min(H.layFitSize(c, txt, W * 0.86, Hh * 0.56), u * 0.26);
  H.laySetNodes(c, [{ text: txt, size: size, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 34. stencil: military die-cut stencil plate with corner bolts & bridged knockout band */
reg('stencil', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var pw = Math.min(W * 0.84, Hh * 1.38), ph = pw * 0.44, x0 = (W - pw) / 2, y0 = (Hh - ph) / 2;
  var plateC = H.layPlateCol(sc, [sc.accent, sc.ink, sc.fg], sc.bg, 1.4), tc = H.textOn(plateC, sc.bg, sc);
  H.layRRect(c, 'Stencil plate', x0, y0, pw, ph, 6, { fill: plateC, stroke: sc.bg, width: 2, alpha: 1 }, envAlpha(c, 0, 0.3));
  [[x0 + u * 0.022, y0 + u * 0.022], [x0 + pw - u * 0.022, y0 + u * 0.022], [x0 + u * 0.022, y0 + ph - u * 0.022], [x0 + pw - u * 0.022, y0 + ph - u * 0.022]].forEach(function (pt, bi) {
    H.layCircleAt(c, 'Stencil rivet ' + bi, pt[0], pt[1], u * 0.008, u * 0.008, { fill: sc.bg, alpha: 0.9 }, envAlpha(c, 0.05, 0.25, 0.9));
  });
  H.layRectAt(c, 'Stencil slit bar', W / 2, Hh / 2, pw * 0.86, Math.max(2, u * 0.004), { fill: plateC, alpha: 0.9 }, envAlpha(c, 0.14, 0.2, 0.9));
  var txt = H.laySplitLines(H.layText(c), 9), size = Math.min(H.layFitSize(c, txt, pw * 0.8, ph * 0.62, { font: monoFont(c) }), ph * 0.42);
  H.laySetNodes(c, [{ text: txt, font: monoFont(c), size: size, x: W / 2, y: Hh / 2, color: tc }]);
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
