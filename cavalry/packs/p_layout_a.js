/* JIZURA Cavalry Pack: layoutsA (28 telop, editorial, UI, & graphic layouts from src/11p_layoutsA.js). */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, DEG = H.DEG, TAU = H.TAU;

function reg(key, fn, diffs) {
  N.register('layout', key, {
    source: 'src/11p_layoutsA.js (' + key + ')',
    scope: 'cut',
    build: fn,
    differences: diffs || ['Native Cavalry text nodes and editable vector geometry matching layoutsA:' + key + '.']
  });
}

function uMin(c) { return Math.min(c.comp.width, c.comp.height); }
function isPort(c) { return c.comp.height > c.comp.width * 1.08; }
function bodyFont(c) { return H.layFontObj(c, 'body'); }
function monoFont(c) { return H.layFontObj(c, 'mono'); }
function serifFont(c) { return H.layFontObj(c, 'serif'); }
function smallSize(c) { return cl(uMin(c) * 0.024, 12, 32); }
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

/* 1. lowerThird: lower-third headline with sliding accent rail & metadata tag */
reg('lowerThird', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), seed = H.laySeed(c), t0 = H.layText(c);
  var n = H.layChars(t0).length;
  var text = port ? H.laySplitLines(t0, 6) : n > 13 ? H.laySplitLines(t0, Math.ceil(n / 2)) : t0;
  var size = Math.min(H.layFitSize(c, text, W * 0.84, Hh * (port ? 0.24 : 0.3), { track: 0.03, lead: 1.14 }), u * (port ? 0.17 : 0.14));
  var m = H.layMeasure(c, text, size, { track: 0.03, lead: 1.14 });
  var left = (P.side || (seed % 3 ? 'left' : 'right')) !== 'right';
  var mx = W * 0.07, barY = Hh * ((port ? 0.8 : 0.83) - (P.lift || 0));
  var th = Math.max(3, size * 0.055), cy = barY - size * 0.24 - m.h / 2, x = left ? mx : W - mx;
  var reach = mx + m.w + size * 0.45;
  H.layRectAt(c, 'Lower third bar', left ? reach / 2 : W - reach / 2, barY, reach, th, { fill: sc.accent, alpha: 1 }, function (env, f) {
    var l = E.outExpo(cl(env.t / 0.5)) * H.layTout(c, f);
    return { x: left ? reach * l / 2 : W - reach * l / 2, sx: Math.max(0.001, l), sy: 1, a: l > 0.01 ? 1 : 0 };
  });
  var sq = th * 2.6;
  H.layRectAt(c, 'Lower third cap', left ? reach : W - reach, barY, sq, sq, { fill: sc.accent, alpha: 1 }, function (env, f) {
    var l = E.outExpo(cl(env.t / 0.5)) * H.layTout(c, f);
    return { x: left ? reach * l : W - reach * l, a: l > 0.01 ? 1 : 0 };
  });
  var ls = smallSize(c), ly = cy - m.h / 2 - size * 0.22 - ls * 0.7;
  var tag = H.layLineNo(c), copy = H.layAltCopy(c);
  if (/^No\./.test(copy)) copy = H.layFmtTime(c.cut.origin / c.comp.fps);
  var tm = H.layMeasure(c, tag, ls, { font: monoFont(c), track: 0.1 }).w;
  var tw = tm + ls * 1.1, th2 = ls * 1.6;
  H.layRectAt(c, 'Lower third tag box', left ? x + tw / 2 : x - tw / 2, ly, tw, th2, { fill: sc.ink || sc.fg, alpha: 1 }, envAlpha(c, 0.1, 0.35));
  H.addText(c, 'Lower third tag', tag, left ? x + tw / 2 : x - tw / 2, ly, ls, { font: monoFont(c), color: H.textOn(sc.ink || sc.fg, sc.bg, sc) }, envAlpha(c, 0.1, 0.35));
  var cx = x + (tw + ls * 0.7) * (left ? 1 : -1);
  H.addText(c, 'Lower third copy', copy, cx, ly, ls, { font: monoFont(c), align: left ? 'left' : 'right', color: sc.sub }, envAlpha(c, 0.14, 0.35));
  H.laySetNodes(c, [{ text: text, size: size, x: x, y: cy, align: left ? 'left' : 'right', track: 0.03, lead: 1.14, color: sc.fg }]);
});

/* 2. corners: diagonally paired corner blocks linked by elbow connector */
reg('corners', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), seed = H.laySeed(c);
  var ch = Array.isArray(P.chunks) && P.chunks.length >= 2 ? P.chunks : H.laySplitK(H.layText(c), 2);
  var A0 = ch[0], B0 = ch.slice(1).join(H.layHasLatin(ch[0]) ? ' ' : '');
  var A = H.laySplitLines(A0, port ? 5 : 9), B = B0 ? H.laySplitLines(B0, port ? 5 : 9) : '';
  var bw = W * (port ? 0.84 : 0.58), bh = Hh * (port ? 0.24 : 0.3);
  var ratio = P.ratio || 1;
  var s = Math.min(H.layFitSize(c, A, bw, bh, { track: 0.02, lead: 1.1 }),
    B ? H.layFitSize(c, B, bw, bh, { track: 0.02, lead: 1.1 }) / ratio : 1e9, u * 0.22);
  var sA = s, sB = s * ratio;
  var mA = H.layMeasure(c, A, sA, { track: 0.02, lead: 1.1 }), mB = B ? H.layMeasure(c, B, sB, { track: 0.02, lead: 1.1 }) : { w: 0, h: 0 };
  var mx = W * 0.075, my = Hh * (port ? 0.15 : 0.13), aL = (P.diag || (seed % 3 ? 'main' : 'anti')) !== 'anti';
  var ax = aL ? mx : W - mx, ay = my + mA.h / 2, bx = aL ? W - mx : mx, by = Hh - my - mB.h / 2;
  var xA1 = aL ? ax + mA.w : ax - mA.w, xB0 = aL ? bx - mB.w : bx + mB.w;
  var g = u * 0.028, xb = aL ? xB0 + sB * 0.4 : xB0 - sB * 0.4;
  var clear = aL ? xb > xA1 + g * 2 : xb < xA1 - g * 2;
  var pts = clear ? [[xA1 + (aL ? g : -g), ay], [xb, ay], [xb, by - mB.h / 2 - g]]
    : [[W / 2, ay + mA.h / 2 + g], [W / 2, by - mB.h / 2 - g]];
  var lw = Math.max(1.5, u * 0.0022);
  H.line(c, 'Corner link', pts, sc.sub, lw, 0.85);
  H.layCircleAt(c, 'Link start', pts[0][0], pts[0][1], u * 0.007, u * 0.007, { fill: sc.bg, stroke: sc.sub, width: lw, alpha: 1 }, envAlpha(c, 0.1, 0.3));
  H.layCircleAt(c, 'Link end', pts[pts.length - 1][0], pts[pts.length - 1][1], u * 0.007, u * 0.007, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.25, 0.3));
  var specs = [{ text: A, size: sA, x: ax, y: ay, align: aL ? 'left' : 'right', track: 0.02, lead: 1.1, color: sc.fg, mi: 0 }];
  if (B) specs.push({ text: B, size: sB, x: bx, y: by, align: aL ? 'right' : 'left', track: 0.02, lead: 1.1, color: sc.fg, mi: Math.min(8, H.layChars(A0).length + 2) });
  H.laySetNodes(c, specs);
});

/* 3. staircase: cascading stepped word/char units with accent tread riser */
reg('staircase', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), seed = H.laySeed(c), t0 = H.layText(c);
  var units = Array.isArray(P.units) && P.units.length ? P.units
    : (H.layStrip(t0).length <= 6 ? H.layChars(t0) : H.laySplitK(t0, port ? 4 : 3));
  var k = units.length, r = k > 1 ? Math.max(P.shrink || 0.86, Math.pow(0.5, 1 / (k - 1))) : 1;
  var up = P.dir === 'up' && !port, fx = up ? 1 : port ? 0.5 : 0.9, L = [];
  units.forEach(function (t, i) {
    var s = 100 * Math.pow(r, i), w = H.layMeasure(c, t, s, { track: 0.02 }).w;
    var x = 0, y = 0;
    if (i > 0) { var q = L[i - 1]; x = q.x + q.w * fx + q.s * 0.14; y = q.y + (q.s + s) / 2 * 1.05 * (up ? -1 : 1); }
    L.push({ t: t, s: s, w: w, x: x, y: y });
  });
  var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  L.forEach(function (q) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x + q.w); y0 = Math.min(y0, q.y - q.s / 2); y1 = Math.max(y1, q.y + q.s * 0.6); });
  var k2 = Math.min(W * 0.84 / Math.max(1, x1 - x0), Hh * 0.76 / Math.max(1, y1 - y0), u * 0.28 / 100);
  var ox = W / 2 - (x0 + x1) / 2 * k2, oy = Hh / 2 - (y0 + y1) / 2 * k2;
  var flip = P.flip != null ? !!P.flip : (!port && R.hash01(seed, 3, 1) < 0.25);
  function mir(x) { return flip ? W - x : x; }
  var pts = [];
  L.forEach(function (q, i) {
    var qx = ox + q.x * k2, qy = oy + q.y * k2, yb = qy + q.s * k2 * 0.58, gap = q.s * k2 * 0.14;
    if (i === 0) pts.push([mir(qx - gap), yb]);
    if (i < k - 1) { var nx = L[i + 1], xr = mir(ox + nx.x * k2 - gap / 2); pts.push([xr, yb], [xr, oy + nx.y * k2 + nx.s * k2 * 0.58]); }
    else pts.push([mir(qx + q.w * k2 + gap), yb]);
  });
  if (pts.length >= 2) H.line(c, 'Stair tread', pts, sc.accent, Math.max(2, 100 * k2 * 0.022), 0.9);
  var specs = L.map(function (q, i) {
    var qx = ox + q.x * k2, qy = oy + q.y * k2, sz = q.s * k2;
    if (P.nums !== false) {
      H.addText(c, 'Step idx ' + i, H.layPad2(i + 1), mir(qx), qy + sz * 0.68, smallSize(c) * 0.8, {
        font: monoFont(c), align: flip ? 'right' : 'left', color: sc.sub
      }, envAlpha(c, i * 0.06, 0.25));
    }
    return { text: q.t, size: sz, x: flip ? W - qx - q.w * k2 : qx, y: qy, align: 'left', track: 0.02, color: sc.fg, mi: i * 2 };
  });
  H.laySetNodes(c, specs);
});

/* 4. zigzag: sawtooth glyph bounce with upper/lower accent rails */
reg('zigzag', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), seed = H.laySeed(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, v = P.orient === 'v' || (port && n > 5);
  var size = Math.min((v ? Hh * 0.78 : W * 0.8) / Math.max(1, n) / 1.08, u * 0.2);
  var step = size * 1.08, amp = size * (P.amp || 0.28), phase = P.phase || (seed % 2 ? 1 : -1);
  function pos(i) {
    var s = (i % 2 ? 1 : -1) * phase, k = i - (n - 1) / 2;
    return v ? [W / 2 + s * amp, Hh / 2 + k * step] : [W / 2 + k * step, Hh / 2 + s * amp];
  }
  var off = size * (0.52 + 0.28 * 0.9), lw = Math.max(2, size * 0.03);
  [-1, 1].forEach(function (sg, k) {
    var pts = [];
    for (var i = -1; i <= n; i++) {
      var q = pos(i);
      pts.push(v ? [q[0] + sg * off, q[1]] : [q[0], q[1] + sg * off]);
    }
    if (pts.length >= 2) H.line(c, 'Zigzag rail ' + k, pts, k === 0 ? sc.sub : sc.accent, lw, k === 0 ? 0.65 : 0.95);
  });
  var specs = chars.map(function (ch, i) {
    var pt = pos(i);
    return { text: ch, size: size, x: pt[0], y: pt[1], rot: (i % 2 ? 1 : -1) * phase * 6 * (v ? -1 : 1), color: sc.fg, mi: i };
  });
  H.laySetNodes(c, specs);
});

/* 5. arcTop: rainbow arch typography with double track arc & metadata divider */
reg('arcTop', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var port = isPort(c), chars = Array.from(H.layText(c)), n = chars.length;
  var spanDeg = Math.min(P.span || (port ? 165 : 125), Math.max(50, n * 30));
  var half = spanDeg / 2 * DEG, dth = spanDeg * DEG / Math.max(1, n), k = dth / 1.1;
  var wid = half < Math.PI / 2 ? 2 * Math.sin(half) : 2, hollow = half >= 70 * DEG;
  var rad = Math.min(W * 0.86 / Math.max(0.4, wid + k), Hh * 0.64 / Math.max(0.4, 1 - Math.cos(half) + k * 1.3 + 0.18), uMin(c) * 0.21 / Math.max(0.05, k));
  var size = Math.max(10, rad * k), ls = smallSize(c);
  var topOff = -(rad + size * 0.8), endY = -rad * Math.cos(half) + size * 0.55;
  var capY = hollow ? Math.max(0, -rad * Math.cos(half) - rad * 0.1) : endY + ls * 1.6;
  var botOff = Math.max(endY, capY + ls * 2.2), cx = W / 2, cy = Hh / 2 - (topOff + botOff) / 2;
  var lw = Math.max(1.2, size * 0.018), a0 = -90 - spanDeg / 2 - 3, a1 = -90 + spanDeg / 2 + 3;
  H.line(c, 'Arc outer guide', H.arcPts(cx, cy, rad + size * 0.74, a0, a1, 32), sc.sub, lw, 0.85);
  H.line(c, 'Arc inner guide', H.arcPts(cx, cy, Math.max(8, rad - size * 0.72), a0, a1, 32), sc.sub, lw, 0.55);
  var copy = H.layAltCopy(c);
  H.addText(c, 'Arc sub copy', copy, cx, cy + capY, ls, { font: bodyFont(c), color: sc.sub }, envAlpha(c, 0.2, 0.35));
  H.layRectAt(c, 'Arc rule', cx, cy + capY + ls * 1.1, Math.min(W * 0.35, size * 1.4), Math.max(2, lw * 1.4), { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.22, 0.35));
  var specs = [];
  chars.forEach(function (ch, i) {
    if (ch === ' ' || ch === '\u3000') return;
    var th = -90 + (i - (n - 1) / 2) * spanDeg / Math.max(1, n);
    specs.push({ text: ch, size: size, x: cx + Math.cos(th * DEG) * rad, y: cy + Math.sin(th * DEG) * rad, rot: th + 90, color: sc.fg, mi: i });
  });
  H.laySetNodes(c, specs);
});

/* 6. spiral: Archimedes spiral coil of characters + helper echo repeat + dotted core */
reg('spiral', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), seed = H.laySeed(c), chars = H.layChars(H.layText(c)), n = chars.length;
  var dir = P.dir || (seed % 2 ? 1 : -1), speed = P.speed == null ? 6 : P.speed;
  var seq = chars.map(function (ch, i) { return { ch: ch, main: true, i: i }; });
  if (n <= 9) {
    var reps = Math.max(1, Math.ceil(18 / (n + 1)) - 1);
    for (var r = 0; r < reps && seq.length < 32; r++) {
      seq.push({ ch: '\u00b7', main: false });
      chars.forEach(function (ch) { seq.push({ ch: ch, main: false }); });
    }
  }
  var N = seq.length, f = seq.length > n ? 0.8 : 0.58;
  var kc = Math.min(0.42, 0.92 * Math.sqrt(5.82 * f / Math.max(1, N))), dth = kc * 1.08, TH = N * dth;
  var R0 = u * 0.44 / (1 + kc * 0.55), mid = dir > 0 ? -90 : 90;
  var base = mid - dir * Math.min((n - 1) * dth / 2 / DEG, 70);
  var cx = W / 2, cy = Hh / 2;
  function rAt(th) { return R0 * (1 - f * th / Math.max(0.1, TH)); }
  var guidePts = [];
  for (var k = 0; k <= 64; k++) {
    var th = (k / 64) * (TH - dth * 0.5), rv = rAt(th) * (1 + kc * 0.62), ph = (base + dir * th / DEG) * DEG;
    guidePts.push([cx + Math.cos(ph) * rv, cy + Math.sin(ph) * rv]);
  }
  H.line(c, 'Spiral guide', guidePts, sc.sub, Math.max(1.2, u * 0.0016), 0.5);
  H.layCircleAt(c, 'Spiral core dot', cx, cy, u * 0.008, u * 0.008, { fill: sc.accent, alpha: 1 }, popScale(c, 0, 0.3));
  var specs = [];
  seq.forEach(function (q, j) {
    var th = j * dth, rv = rAt(th), sz = Math.max(8, kc * rv);
    var ph0 = base + dir * th / DEG, x = cx + Math.cos(ph0 * DEG) * rv, y = cy + Math.sin(ph0 * DEG) * rv;
    var rot0 = dir > 0 ? ph0 + 90 : ph0 - 90;
    if (q.main) {
      specs.push({
        text: q.ch, size: sz, x: x, y: y, rot: rot0, color: sc.fg, mi: q.i,
        animPlace: function (env) {
          var ph = base + env.t * speed * dir + dir * th / DEG;
          return { x: cx + Math.cos(ph * DEG) * rv, y: cy + Math.sin(ph * DEG) * rv, rot: dir > 0 ? ph + 90 : ph - 90 };
        }
      });
    } else {
      H.addText(c, 'Spiral echo ' + j, q.ch, x, y, sz, { color: sc.sub, rotation: rot0, alpha: 0.55 }, function (env, frame) {
        var ph = base + env.t * speed * dir + dir * th / DEG;
        var a = cl((env.t - 0.1 - (j - n) * 0.02) / 0.25) * H.layTout(c, frame) * mix(0.22, 0.65, rv / R0);
        return { 'position.x': cx + Math.cos(ph * DEG) * rv - W / 2, 'position.y': Hh / 2 - (cy + Math.sin(ph * DEG) * rv), rotation: -(dir > 0 ? ph + 90 : ph - 90), alpha: a };
      });
    }
  });
  H.laySetNodes(c, specs);
});

/* 7. gridCells: tabular glyph matrix with indexed boxes & accent highlight cell */
reg('gridCells', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), seed = H.laySeed(c), chars = H.layChars(H.layText(c)), n = chars.length;
  var maxCols = port ? (n <= 8 ? 4 : 5) : (n <= 10 ? 10 : 8);
  var rows = Math.ceil(n / Math.min(n, maxCols)), cols = Math.ceil(n / Math.max(1, rows));
  var g = P.gap == null ? (seed % 3 ? 0 : 0.1) : P.gap;
  var cell = Math.min(W * 0.86 / (cols + (cols - 1) * g), Hh * 0.72 / (rows + (rows - 1) * g), u * 0.3);
  var stp = cell * (1 + g), gw = cols * cell + (cols - 1) * cell * g, gh = rows * cell + (rows - 1) * cell * g;
  var x0 = W / 2 - gw / 2, y0 = Hh / 2 - gh / 2, ai = (P.acc != null ? P.acc : seed) % Math.max(1, n);
  var plate = P.fill === 'ink', lw = Math.max(1.5, cell * 0.014);
  for (var i = 0; i < rows * cols; i++) {
    var cx = x0 + (i % cols) * stp + cell / 2, cy = y0 + Math.floor(i / cols) * stp + cell / 2;
    var empty = i >= n, fillC = i === ai ? sc.accent : (plate && !empty ? (sc.ink || sc.fg) : null);
    if (fillC) H.layRectAt(c, 'Cell fill ' + i, cx, cy, cell, cell, { fill: fillC, alpha: 1 }, popScale(c, i * 0.03, 0.26));
    H.layRectAt(c, 'Cell border ' + i, cx, cy, cell, cell, { stroke: empty ? sc.sub : sc.fg, width: lw, alpha: empty ? 0.35 : 0.9 }, envAlpha(c, i * 0.025, 0.25, empty ? 0.35 : 0.9));
    if (P.nums !== false && !empty) {
      var ns = Math.max(9, cell * 0.11);
      H.addText(c, 'Cell no ' + i, H.layPad2(i + 1), cx - cell * 0.42, cy - cell * 0.36, ns, {
        font: monoFont(c), align: 'left', color: i === ai ? H.textOn(sc.accent, sc.bg, sc) : plate ? H.textOn(sc.ink || sc.fg, sc.bg, sc) : sc.sub
      }, envAlpha(c, i * 0.03, 0.25));
    }
  }
  var specs = chars.map(function (ch, i) {
    var cx = x0 + (i % cols) * stp + cell / 2, cy = y0 + Math.floor(i / cols) * stp + cell / 2;
    var col = i === ai ? H.textOn(sc.accent, sc.bg, sc) : plate ? H.textOn(sc.ink || sc.fg, sc.bg, sc) : sc.fg;
    return { text: ch, size: cell * 0.62, x: cx, y: cy, color: col, mi: i };
  });
  H.laySetNodes(c, specs);
});

/* 8. dropCap: large illuminated initial glyph + ruled editorial body column */
reg('dropCap', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), arr = Array.from(H.layText(c));
  var cap = arr[0] || '', rest = arr.slice(1).join('').trim() || cap;
  var lines = H.laySplitLines(rest, port ? 6 : 10).split('\n').filter(Boolean);
  var lead = 1.32, s = Math.min(u * 0.09, H.layFitSize(c, lines.join('\n'), W * (port ? 0.56 : 0.48), Hh * 0.48, { lead: lead }));
  var capLines = Math.min(3, Math.max(2, lines.length)), capS = s * (capLines === 2 ? 2.4 : 3.4);
  var capW = capS * 1.05, gap = s * 0.48;
  var lineMaxW = Math.max.apply(null, lines.map(function (ln) { return H.layMeasure(c, ln, s, { track: 0.04 }).w; }));
  var usedW = Math.max(capW + gap + lineMaxW, capW + gap + s);
  var hBlock = (Math.max(lines.length, capLines) - 1) * lead * s + s;
  var x0 = W / 2 - usedW / 2, top = Hh / 2 - hBlock / 2;
  var yT = top - s * 0.5, yB = top + hBlock + s * 0.5, lw = Math.max(1.5, s * 0.02);
  if (P.rules !== false) {
    H.layRectAt(c, 'DropCap top rule', W / 2, yT, usedW, lw, { fill: sc.fg, alpha: 0.9 }, envAlpha(c, 0.05, 0.35, 0.9));
    H.layRectAt(c, 'DropCap bot rule', W / 2, yB, usedW, lw, { fill: sc.fg, alpha: 0.9 }, envAlpha(c, 0.05, 0.35, 0.9));
  }
  if (P.meta !== false) {
    var ls = smallSize(c) * 0.9, yM = yB + ls * 1.3;
    H.addText(c, 'DropCap index', 'No.' + H.layLineNo(c), x0, yM, ls, { font: monoFont(c), align: 'left', color: sc.accent }, envAlpha(c, 0.25, 0.35));
    H.addText(c, 'DropCap note', H.layAltCopy(c), x0 + usedW, yM, ls, { font: monoFont(c), align: 'right', color: sc.sub }, envAlpha(c, 0.25, 0.35));
  }
  var capStyle = P.cap || (H.laySeed(c) % 3 === 0 ? 'outline' : 'accent');
  var specs = [{
    text: cap, size: capS, x: x0 + capW / 2, y: top + ((capLines - 1) * lead + 1) * s / 2,
    color: capStyle === 'accent' ? sc.accent : sc.fg, fill: capStyle !== 'outline',
    stroke: capStyle === 'outline', strokeColor: sc.fg, strokeWidth: Math.max(2, capS * 0.016), mi: 0
  }];
  lines.forEach(function (ln, i) {
    specs.push({ text: ln, size: s, x: i < capLines ? x0 + capW + gap : x0, y: top + s / 2 + i * lead * s, align: 'left', track: 0.04, color: sc.fg, mi: 2 + i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 9. justified: full-measure justified band over continuous dense body filler grid */
reg('justified', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var text = H.layText(c), n = H.layChars(text).length, bx0 = W * 0.08, bw = W * 0.84, by0 = Hh * 0.1, bh = Hh * 0.8;
  var rowsN = isPort(c) ? 12 : 9, rowH = bh / rowsN, fs = rowH * 0.56;
  var lines = n >= 6 ? H.laySplitK(text, 2) : [text], two = lines.length > 1;
  var ls = Math.min(rowH * 2.2, H.layFitSize(c, lines.join('\n'), bw, rowH * (two ? 4.4 : 2.6), { track: 0.04 }));
  var lyH = ls * lines.length + (two ? rowH * 0.3 : 0), yc = Hh / 2;
  var filler = H.layFlat(H.layLineText(c)) + ' / ';
  var rep = new Array(8).join(filler);
  for (var r = 0; r < rowsN; r++) {
    var ry = by0 + (r + 0.5) * rowH;
    if (Math.abs(ry - yc) < lyH * 0.72) continue;
    H.addText(c, 'Justified bg ' + r, rep, bx0 + bw / 2, ry, fs, {
      font: bodyFont(c), align: 'center', color: sc.sub, alpha: 0.3
    }, envAlpha(c, r * 0.02, 0.25, 0.3));
  }
  var mark = P.mark || ['band', 'under', 'bracket'][H.laySeed(c) % 3], plate = mark === 'band';
  if (plate) {
    H.layRectAt(c, 'Justified band', bx0 + bw / 2, yc, bw + ls * 0.3, lyH + ls * 0.4, { fill: sc.accent, alpha: 1 }, function (env, f) {
      var e = E.outExpo(cl(env.t / 0.4)) * H.layTout(c, f);
      return { sx: Math.max(0.001, e), sy: 1, a: e > 0.01 ? 1 : 0 };
    });
  } else {
    var bLW = Math.max(3, ls * 0.05);
    H.layRectAt(c, 'Justified top bar', bx0 + bw / 2, yc - lyH / 2 - ls * 0.2, bw, bLW, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.05, 0.35));
    H.layRectAt(c, 'Justified bot bar', bx0 + bw / 2, yc + lyH / 2 + ls * 0.2, bw, bLW, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.05, 0.35));
  }
  H.addText(c, 'Justified head', 'No.' + H.layLineNo(c), bx0, by0 - rowH * 0.4, Math.max(10, rowH * 0.28), { font: monoFont(c), align: 'left', color: sc.sub }, envAlpha(c, 0.1, 0.3));
  var col = plate ? H.textOn(sc.accent, sc.bg, sc) : sc.fg;
  var specs = lines.map(function (ln, i) {
    var mW = H.layMeasure(c, ln, ls, { track: 0.04 }).w, glyphsN = Math.max(2, Array.from(ln).length);
    var trk = two ? 0.04 : cl((bw - mW) / (ls * (glyphsN - 1)), 0.02, 1.4);
    return {
      text: ln, size: ls,
      x: two ? (i === 0 ? bx0 : bx0 + bw) : bx0 + bw / 2,
      y: yc + (i - (lines.length - 1) / 2) * (ls + rowH * 0.3),
      align: two ? (i === 0 ? 'left' : 'right') : 'center',
      track: trk, color: col, mi: i * 3
    };
  });
  H.laySetNodes(c, specs);
});

/* 10. frameBox: crisp architectural picture-frame / double rule border + gap captions */
reg('frameBox', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), seed = H.laySeed(c);
  var text = H.laySplitLines(H.layText(c), port ? 6 : 12);
  var size = Math.min(H.layFitSize(c, text, W * (port ? 0.72 : 0.66), Hh * 0.36, { track: 0.04, lead: 1.2 }), u * 0.19);
  var m = H.layMeasure(c, text, size, { track: 0.04, lead: 1.2 });
  var fw = Math.min(W * 0.9, Math.max(m.w + size * 1.6, P.shape === 'wide' ? W * 0.72 : 0));
  var fh = Math.min(Hh * 0.86, Math.max(m.h + size * 1.4, P.shape === 'wide' ? fw * 0.55 : 0));
  var lw = Math.max(2, size * 0.02), style = P.style || ['full', 'double', 'corners'][seed % 3];
  if (style === 'corners') {
    var arm = Math.min(fw, fh) * 0.22, x0 = W / 2 - fw / 2, x1 = W / 2 + fw / 2, y0 = Hh / 2 - fh / 2, y1 = Hh / 2 + fh / 2;
    [[x0, y0, 1, 1], [x1, y0, -1, 1], [x1, y1, -1, -1], [x0, y1, 1, -1]].forEach(function (q, k) {
      H.line(c, 'Frame corner ' + k, [[q[0] + q[2] * arm, q[1]], [q[0], q[1]], [q[0], q[1] + q[3] * arm]], sc.fg, lw * 1.4, 0.95);
    });
  } else {
    H.layRectAt(c, 'Frame outer', W / 2, Hh / 2, fw, fh, { stroke: sc.fg, width: lw, alpha: 1 }, popScale(c, 0, 0.4));
    if (style === 'double') {
      H.layRectAt(c, 'Frame inner', W / 2, Hh / 2, fw - size * 0.32, fh - size * 0.32, { stroke: sc.sub, width: Math.max(1, lw * 0.5), alpha: 0.8 }, popScale(c, 0.08, 0.4));
    }
  }
  var ls = smallSize(c) * 0.9;
  H.addText(c, 'Frame top tag', 'No.' + H.layLineNo(c), W / 2, Hh / 2 - fh / 2 - ls * 0.9, ls, { font: monoFont(c), color: sc.accent }, envAlpha(c, 0.15, 0.3));
  H.addText(c, 'Frame bot tag', H.layAltCopy(c), W / 2, Hh / 2 + fh / 2 + ls * 0.9, ls, { font: monoFont(c), color: sc.sub }, envAlpha(c, 0.18, 0.3));
  H.laySetNodes(c, [{ text: text, size: size, x: W / 2, y: Hh / 2, track: 0.04, lead: 1.2, color: sc.fg }]);
});

/* 11. bubble: comic speech / thought balloon with pointer tail & emphasis sparks */
reg('bubble', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), seed = H.laySeed(c);
  var text = H.laySplitLines(H.layText(c), port ? 6 : 10);
  var size = Math.min(H.layFitSize(c, text, W * (port ? 0.6 : 0.56), Hh * 0.32, { track: 0.02, lead: 1.2 }), u * 0.15);
  var m = H.layMeasure(c, text, size, { track: 0.02, lead: 1.2 });
  var bw = m.w + size * 1.25, bh = m.h + size * 1.0, cx = W / 2, cy = Hh / 2 - size * 0.3;
  var tail = P.tail || (seed % 2 ? 1 : -1), fill = P.style !== 'outline', plate = sc.ink || sc.fg;
  var paint = fill ? { fill: plate, alpha: 1 } : { stroke: sc.fg, width: Math.max(3, size * 0.05), alpha: 1 };
  if (P.shape === 'ellipse') {
    H.layCircleAt(c, 'Speech oval', cx, cy, bw * 0.62, bh * 0.62, paint, popScale(c, 0, 0.3));
  } else {
    H.layRRect(c, 'Speech box', cx - bw / 2, cy - bh / 2, bw, bh, Math.min(bh * 0.42, size * 0.85), paint, popScale(c, 0, 0.3));
  }
  var tipX = cx + tail * bw * 0.34, tipY = cy + bh / 2 + size * 0.72, bc = cx + tail * bw * 0.18, tw = Math.min(size * 0.5, bw * 0.18);
  H.layPolyAt(c, 'Speech tail', cx, cy, [[bc - tw / 2, cy + bh / 2 - 2], [bc + tw / 2, cy + bh / 2 - 2], [tipX, tipY]], true, paint, popScale(c, 0, 0.3));
  H.laySetNodes(c, [{ text: text, size: size, x: cx, y: cy, track: 0.02, lead: 1.2, color: fill ? H.textOn(plate, sc.bg, sc) : sc.fg }]);
});

/* 12. subtitleBar: cinema letterbox bars + faint watermark + lower subtitle text */
reg('subtitleBar', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), text = H.layText(c);
  var barC = H.lum(sc.ink || '#000000') < H.lum(sc.fg || '#ffffff') ? (sc.ink || '#111111') : (sc.bg || '#111111');
  var bh = Hh * (port ? 0.08 : 0.115), tCol = H.textOn(barC, sc.fg, sc);
  var bt = H.layFlat(text), bs = Math.min(H.layFitSize(c, bt, W * 0.9, Hh * 0.55), Hh * 0.55);
  H.addText(c, 'Subtitle watermark', bt, W / 2, Hh / 2, bs, { color: sc.dim || sc.sub, alpha: 0.25 }, envAlpha(c, 0.05, 0.4, 0.25));
  H.layRectAt(c, 'Letterbox top', W / 2, bh / 2, W + 4, bh, { fill: barC, alpha: 1 }, function (env, f) {
    var e = E.outExpo(cl(env.t / 0.45)) * H.layTout(c, f);
    return { sy: Math.max(0.001, e), sx: 1, a: e > 0.01 ? 1 : 0 };
  });
  H.layRectAt(c, 'Letterbox bottom', W / 2, Hh - bh / 2, W + 4, bh, { fill: barC, alpha: 1 }, function (env, f) {
    var e = E.outExpo(cl(env.t / 0.45)) * H.layTout(c, f);
    return { sy: Math.max(0.001, e), sx: 1, a: e > 0.01 ? 1 : 0 };
  });
  var ls = Math.min(smallSize(c) * 0.9, bh * 0.34);
  H.addText(c, 'Cinema scene tag', 'SCENE ' + H.layLineNo(c), W * 0.05, bh / 2, ls, { font: monoFont(c), align: 'left', color: tCol }, envAlpha(c, 0.2, 0.3));
  H.addText(c, 'Cinema TC', H.layFmtTime(c.cut.origin / c.comp.fps), W * 0.95, bh / 2, ls, { font: monoFont(c), align: 'right', color: sc.sub }, envAlpha(c, 0.2, 0.3));
  var subT = H.laySplitLines(text, port ? 8 : 18);
  var ss = Math.min(H.layFitSize(c, subT, W * 0.84, bh * 0.65, { track: 0.06, lead: 1.25 }), u * 0.056);
  H.laySetNodes(c, [{ text: subT, size: ss, x: W / 2, y: Hh - bh / 2, track: 0.06, lead: 1.25, color: tCol }]);
});

/* 13. ticker: live news/broadcast crawler bar + headline above */
reg('ticker', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), text0 = H.layText(c);
  var bandH = u * 0.075, bandY = Hh - bandH - Hh * (port ? 0.12 : 0.085), x0 = W * 0.04;
  var bandC = (sc.ink && sc.ink !== sc.accent) ? sc.ink : sc.fg, tag = P.tag || 'LIVE';
  var ts = bandH * 0.42, tagW = H.layMeasure(c, tag, ts, { font: monoFont(c), track: 0.12 }).w + ts * 2.4;
  H.layRectAt(c, 'Ticker band', x0 + (W - x0) / 2, bandY + bandH / 2, W - x0, bandH, { fill: bandC, alpha: 1 }, envAlpha(c, 0, 0.35));
  var unit = H.layFlat(H.layLineText(c)) + '   \u25c6   ';
  var fs = bandH * 0.46, per = Math.max(40, H.layMeasure(c, unit, fs, { font: bodyFont(c) }).w);
  var reps = Math.min(14, Math.ceil(W * 1.6 / per) + 2);
  H.addText(c, 'Ticker scroll', new Array(reps + 1).join(unit), x0 + tagW + W * 0.4, bandY + bandH / 2, fs, {
    font: bodyFont(c), align: 'center', color: H.textOn(bandC, sc.bg, sc)
  }, function (env, f) {
    var off = -(((env.t * u * 0.22) % per + per) % per);
    return { 'position.x': off, alpha: H.layTout(c, f) };
  });
  H.layRectAt(c, 'Ticker tag plate', x0 + tagW / 2, bandY + bandH / 2, tagW, bandH * 1.18, { fill: sc.accent, alpha: 1 }, popScale(c, 0.08, 0.28));
  H.addText(c, 'Ticker tag text', tag, x0 + tagW / 2, bandY + bandH / 2, ts, { font: monoFont(c), color: H.textOn(sc.accent, sc.bg, sc) }, envAlpha(c, 0.1, 0.25));
  var mt = H.laySplitLines(text0, port ? 6 : 11), avail = bandY - Hh * 0.1;
  var size = Math.min(H.layFitSize(c, mt, W * 0.84, avail * 0.7, { track: 0.03, lead: 1.15 }), u * 0.2);
  var left = P.main === 'left';
  H.laySetNodes(c, [{ text: mt, size: size, x: left ? x0 + size * 0.1 : W / 2, y: Hh * 0.1 + avail / 2, align: left ? 'left' : 'center', track: 0.03, lead: 1.15, color: sc.fg }]);
});

/* 14. splitScreen: high-contrast 2-tone diagonal/vertical/horizontal split with clipped twin text */
reg('splitScreen', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), seed = H.laySeed(c);
  var split = P.split || (port ? 'h' : ['v', 'diag'][seed % 2]), sd = P.side || (seed % 2 ? 1 : -1);
  var tilt = P.tilt || 15, plateC = (P.plate === 'accent' && H.contrast(sc.accent, sc.bg) >= 1.6) ? sc.accent : (sc.fg || '#ffffff');
  var tOff = sc.fg, tOn = H.textOn(plateC, sc.bg, sc);
  function polysAt(e) {
    if (split === 'h') {
      var by = Hh / 2 + sd * (1 - e) * Hh * 0.55;
      var p1 = sd > 0 ? [[0, by], [W, by], [W, Hh], [0, Hh]] : [[0, 0], [W, 0], [W, by], [0, by]];
      var p2 = sd > 0 ? [[0, 0], [W, 0], [W, by], [0, by]] : [[0, by], [W, by], [W, Hh], [0, Hh]];
      return { plate: p1, other: p2 };
    }
    var dx = split === 'diag' ? Math.tan(tilt * DEG) * Hh / 2 : 0;
    var sh = sd * (1 - e) * (W * 0.55 + Math.abs(dx));
    var top = [W / 2 + dx + sh, 0], bot = [W / 2 - dx + sh, Hh];
    var pa = sd > 0 ? [top, [W, 0], [W, Hh], bot] : [[0, 0], top, bot, [0, Hh]];
    var pb = sd > 0 ? [[0, 0], top, bot, [0, Hh]] : [top, [W, 0], [W, Hh], bot];
    return { plate: pa, other: pb };
  }
  var restP = polysAt(1);
  H.layPolyAt(c, 'Split backing plate', W / 2, Hh / 2, restP.plate, true, { fill: plateC, alpha: 1 }, function (env, f) {
    var e = E.outExpo(cl(env.t / 0.45)) * H.layTout(c, f);
    if (split === 'h') return { dx: 0, dy: sd * (1 - e) * Hh * 0.5, a: e > 0.01 ? 1 : 0 };
    return { dx: sd * (1 - e) * W * 0.5, dy: 0, a: e > 0.01 ? 1 : 0 };
  });
  var text = H.laySplitLines(H.layText(c), port ? 5 : 10);
  var size = Math.min(H.layFitSize(c, text, W * 0.84, Hh * 0.4, { track: 0.02, lead: 1.08 }), u * 0.28);
  H.laySetNodes(c, [
    {
      text: text, size: size, x: W / 2, y: Hh / 2, track: 0.02, lead: 1.08, color: tOff,
      clipPolyFn: function (env, f) { return polysAt(E.outExpo(cl(env.t / 0.45)) * H.layTout(c, f)).other; }
    },
    {
      text: text, size: size, x: W / 2, y: Hh / 2, track: 0.02, lead: 1.08, color: tOn,
      clipPolyFn: function (env, f) { return polysAt(E.outExpo(cl(env.t / 0.45)) * H.layTout(c, f)).plate; }
    }
  ]);
});

/* 15. mirror: horizon line with squashed vertical water-reflection strips */
reg('mirror', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), text = H.laySplitLines(H.layText(c), port ? 6 : 12);
  var size = Math.min(H.layFitSize(c, text, W * 0.84, Hh * 0.3, { track: 0.04, lead: 1.15 }), u * 0.22);
  var m = H.layMeasure(c, text, size, { track: 0.04, lead: 1.15 }), squash = P.squash || 0.78;
  var RH = m.h * squash + size * 0.1, cy = Hh / 2 - RH * 0.42, hz = cy + m.h / 2 + size * 0.08;
  var hw = W * 0.44;
  H.layRectAt(c, 'Mirror horizon', W / 2, hz, hw * 2, Math.max(1.5, u * 0.002), { fill: sc.sub, alpha: 0.85 }, envAlpha(c, 0, 0.45, 0.85));
  H.layCircleAt(c, 'Horizon left dot', W / 2 - hw, hz, u * 0.005, u * 0.005, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.15, 0.3));
  H.layCircleAt(c, 'Horizon right dot', W / 2 + hw, hz, u * 0.005, u * 0.005, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.15, 0.3));
  var refY = hz + m.h * squash / 2 + size * 0.06;
  var idRef = H.addText(c, 'Mirror reflection', text, W / 2, refY, size, { color: sc.sub, alpha: 0.36 }, function (env, f) {
    var dx = P.ripple !== false ? Math.sin(env.t * 2.4) * size * 0.03 : 0;
    return { 'position.x': dx, 'scale.x': 1, 'scale.y': -squash, alpha: 0.36 * H.layTin(c, f, 0, 0.3) * H.layTout(c, f) };
  });
  if (idRef && c.graph.byId[idRef]) c.graph.byId[idRef].attrs.scale = [1, -squash];
  H.laySetNodes(c, [{ text: text, size: size, x: W / 2, y: cy, track: 0.04, lead: 1.15, color: sc.fg }]);
});

/* 16. sideways: monumental 90-deg rotated headline + opposing editorial meta column */
reg('sideways', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), seed = H.laySeed(c), t0 = H.layText(c);
  var text = H.layChars(t0).length > (port ? 12 : 6) ? H.laySplitLines(t0, Math.ceil(H.layChars(t0).length / 2)) : t0;
  var L = Hh * 0.88, T = W * (port ? 0.4 : 0.3);
  var size = Math.min(H.layFitSize(c, text, L, T, { track: 0.02, lead: 1.02 }), u * (port ? 0.34 : 0.3));
  var m = H.layMeasure(c, text, size, { track: 0.02, lead: 1.02 });
  var left = (P.side || (seed % 2 ? 'left' : 'right')) === 'left', mx = W * 0.05;
  var cx = left ? mx + m.h / 2 : W - mx - m.h / 2, rot = left ? -90 : 90;
  var rx = left ? cx + m.h / 2 + W * 0.035 : cx - m.h / 2 - W * 0.035;
  if (P.rule !== false) {
    H.layRectAt(c, 'Sideways rule', rx, Hh / 2, Math.max(2, u * 0.003), Hh * 0.88, { fill: sc.accent, alpha: 1 }, function (env, f) {
      var e = E.outExpo(cl(env.t / 0.45)) * H.layTout(c, f);
      return { sx: 1, sy: Math.max(0.001, e), a: e > 0.01 ? 1 : 0 };
    });
  }
  var ax0 = left ? rx + W * 0.04 : W * 0.07, ls = smallSize(c);
  H.addText(c, 'Sideways num', 'No.' + H.layLineNo(c), ax0, Hh * 0.14, ls, { font: monoFont(c), align: 'left', color: sc.accent }, envAlpha(c, 0.15, 0.3));
  H.addText(c, 'Sideways copy', H.layLineText(c), ax0, Hh * 0.84, cl(u * 0.04, 14, 34), { font: bodyFont(c), align: 'left', color: sc.fg }, envAlpha(c, 0.2, 0.35, 0.9));
  H.laySetNodes(c, [{ text: text, size: size, x: cx, y: Hh / 2, rot: rot, track: 0.02, lead: 1.02, color: sc.fg }]);
});

/* 17. edgeFrame: scrolling 4-edge perimeter typography framing centered headline */
reg('edgeFrame', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), d = u * 0.045, es = cl(u * 0.024, 10, 26), band = es * 1.7;
  var unit = H.layFlat(H.layLineText(c)) + (P.sep || '  /  ');
  var per = Math.max(40, H.layMeasure(c, unit, es, { font: bodyFont(c), track: 0.08 }).w);
  var edges = [
    [W / 2, d, W - 2 * d - 2 * band, 0],
    [W - d, Hh / 2, Hh - 2 * d - 2 * band, 90],
    [W / 2, Hh - d, W - 2 * d - 2 * band, 180],
    [d, Hh / 2, Hh - 2 * d - 2 * band, 270]
  ];
  edges.forEach(function (ed, k) {
    var reps = Math.min(12, Math.ceil(ed[2] / per) + 2);
    H.addText(c, 'Edge strip ' + k, new Array(reps + 1).join(unit), ed[0], ed[1], es, {
      font: bodyFont(c), rotation: ed[3], color: sc.sub, alpha: 0.82
    }, envAlpha(c, k * 0.06, 0.35, 0.82));
  });
  [[d, d], [W - d, d], [W - d, Hh - d], [d, Hh - d]].forEach(function (pt, idx) {
    H.layRectAt(c, 'Edge corner ' + idx, pt[0], pt[1], es * 0.5, es * 0.5, { fill: sc.accent, alpha: 1 }, popScale(c, 0.1, 0.25));
  });
  var mt = H.laySplitLines(H.layText(c), port ? 6 : 11);
  var size = Math.min(H.layFitSize(c, mt, W * 0.72, Hh * 0.5, { track: 0.04, lead: 1.15 }), u * 0.22);
  H.laySetNodes(c, [{ text: mt, size: size, x: W / 2, y: Hh / 2, track: 0.04, lead: 1.15, color: sc.fg }]);
});

/* 18. perspective: 1-point corridor of receding perspective planes toward vanishing dot */
reg('perspective', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), seed = H.laySeed(c), text = H.laySplitLines(H.layText(c), port ? 6 : 12);
  var side = P.mode === 'side', vx = P.vx || (seed % 2 ? 1 : -1);
  var size = Math.min(H.layFitSize(c, text, W * (side ? 0.68 : 0.82), Hh * 0.22, { track: 0.03, lead: 1.1 }), u * 0.18);
  var m = H.layMeasure(c, text, size, { track: 0.03, lead: 1.1 });
  var x0 = side ? W / 2 - vx * W * 0.12 : W / 2, y0 = Hh * 0.74 - m.h / 2 + size * 0.45;
  var vp = side ? [W / 2 + vx * W * 0.36, Hh * 0.12] : [W / 2, Hh * 0.1];
  var hw = m.w / 2 + size * 0.3, yb = y0 + m.h / 2 + size * 0.12;
  H.line(c, 'Perspective rail L', [[x0 - hw, yb], vp], sc.sub, 1.3, 0.4);
  H.line(c, 'Perspective rail R', [[x0 + hw, yb], vp], sc.sub, 1.3, 0.4);
  H.layCircleAt(c, 'Vanishing point', vp[0], vp[1], u * 0.005, u * 0.005, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0, 0.3));
  var K = P.copies || 5, r = 0.68;
  for (var j = K; j >= 1; j--) {
    var k = Math.pow(r, j), qx = mix(vp[0], x0, k), qy = mix(vp[1], y0, k), a = 0.65 * (1 - j / (K + 1.5));
    H.addText(c, 'Perspective echo ' + j, text, qx, qy, size * k, { color: sc.sub, alpha: a }, envAlpha(c, 0.05, 0.3, a));
  }
  H.laySetNodes(c, [{ text: text, size: size, x: x0, y: y0, track: 0.03, lead: 1.1, color: sc.fg }]);
});

/* 19. hanko: calligraphic ink headword + crimson carved chop stamp seal */
reg('hanko', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), text = H.layStrip(H.layText(c)), chars = H.layChars(text), n = chars.length;
  var vert = P.vert != null ? !!P.vert : (port || n <= 8);
  var size, S, tx, ty, sx, sy;
  if (vert) {
    size = Math.min(Hh * 0.68 / Math.max(2.5, n), u * 0.2, W * 0.32);
    S = size * (n <= 2 ? 1.35 : 1.5);
    tx = W / 2 + S * 0.4; ty = Hh / 2 - S * 0.15;
    sx = tx - size * 0.55 - S * 0.7; sy = Hh / 2 + Math.min(Hh * 0.28, n * size * 0.42);
  } else {
    size = Math.min(H.layFitSize(c, text, W * 0.6, Hh * 0.3), u * 0.17);
    S = size * 1.6;
    var m = H.layMeasure(c, text, size);
    tx = W / 2 - S * 0.45; ty = Hh / 2; sx = tx + m.w / 2 + S * 0.72; sy = ty + size * 0.25;
  }
  var haku = P.seal !== 'shu', sealRot = P.rot == null ? -4 : P.rot;
  var g = chars.slice(0, Math.min(2, chars.length)).join('') || text.slice(0, 1);
  H.layRRect(c, 'Hanko seal stamp', sx - S / 2, sy - S / 2, S, S, S * 0.08, haku ? { fill: sc.accent, rot: sealRot, alpha: 1 } : { stroke: sc.accent, width: Math.max(2, S * 0.08), rot: sealRot, alpha: 1 }, function (env, f) {
    var q = cl((env.t - 0.18) / 0.18);
    var sc2 = q <= 0 ? 0.001 : mix(1.45, 1, E.outBack(q, 1.4)) * H.layTout(c, f);
    return { s: Math.max(0.001, sc2), a: q > 0.01 ? 1 : 0 };
  });
  H.addText(c, 'Hanko seal glyph', g, sx, sy, S * 0.42, { font: serifFont(c), rotation: sealRot, color: haku ? H.textOn(sc.accent, sc.bg, sc) : sc.accent }, envAlpha(c, 0.2, 0.2));
  H.laySetNodes(c, [{ text: text, size: size, x: tx, y: ty, vertical: vert, lead: 1.35, color: sc.fg }]);
});

/* 20. genkou: manuscript grid columns (vertical top-to-bottom right-to-left) */
reg('genkou', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var port = isPort(c), chars = H.layChars(H.layText(c)), n = chars.length, ind = P.indent ? 1 : 0;
  var maxR = port ? 12 : 9, used = Math.ceil((n + ind) / maxR);
  var rows = Math.max(6, Math.ceil((n + ind) / Math.max(1, used)) + 1), gapK = 0.3;
  var cell = Math.min(Hh * 0.76 / rows, W * 0.88 / ((used + 2) * (1 + gapK)));
  var colW = cell * (1 + gapK), cols = Math.max(used + 2, Math.min(Math.floor(W * 0.9 / colW), used + 4));
  var gw = cols * colW - cell * gapK, gh = rows * cell, gx0 = W / 2 - gw / 2, gy0 = Hh / 2 - gh / 2;
  var cStart = Math.floor((cols - used) / 2), lc = P.lineC === 'accent' ? sc.accent : sc.sub, lw = Math.max(1.2, cell * 0.02);
  function colX(ci) { return gx0 + gw - cell - ci * colW; }
  for (var ci = 0; ci < cols; ci++) {
    var x = colX(ci), dist = Math.abs(ci - (cStart + (used - 1) / 2)) / Math.max(1, cols / 2), a = 0.78 * (1 - dist * 0.55);
    H.layRectAt(c, 'Genkou col ' + ci, x + cell / 2, gy0 + gh / 2, cell, gh, { stroke: lc, width: lw, alpha: a }, envAlpha(c, ci * 0.03, 0.35, a));
  }
  H.addText(c, 'Genkou spec', '(' + rows + 'x' + cols + ') No.' + H.layLineNo(c), gx0, gy0 + gh + Math.max(14, cell * 0.25), Math.max(10, cell * 0.14), { font: monoFont(c), align: 'left', color: lc }, envAlpha(c, 0.2, 0.3));
  var specs = chars.map(function (ch, i) {
    var k = i + ind, ci = cStart + Math.floor(k / rows), ri = k % rows;
    return { text: ch, size: cell * 0.76, x: colX(ci) + cell / 2, y: gy0 + (ri + 0.5) * cell, color: sc.fg, mi: i };
  });
  H.laySetNodes(c, specs);
});

/* 21. panels: angled comic/manga gutters splitting chunked phrases */
reg('panels', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), seed = H.laySeed(c);
  var t0 = H.layText(c), ch = Array.isArray(P.chunks) && P.chunks.length ? P.chunks : H.laySplitK(t0, H.layChars(t0).length >= 6 ? 3 : 2);
  var k = ch.length, m = u * 0.05, gap = u * 0.026, lw = Math.max(2.5, u * 0.0055);
  var L = (port ? Hh : W) - 2 * m, cross = (port ? W : Hh) - 2 * m, sl = Math.min(u * 0.04, L / k * 0.16);
  var accIdx = (P.acc != null ? P.acc : seed) % Math.max(1, k), specs = [];
  for (var i = 0; i < k; i++) {
    var a = i / k * L + (i === 0 ? 0 : gap / 2), b = (i + 1) / k * L - (i === k - 1 ? 0 : gap / 2);
    var sa = i === 0 ? 0 : sl * (i % 2 ? 1 : -1), sb = i === k - 1 ? 0 : sl * ((i + 1) % 2 ? 1 : -1);
    var pts = [[a + sa, 0], [b + sb, 0], [b - sb, cross], [a - sa, cross]].map(function (q) {
      return port ? [m + q[1], m + q[0]] : [m + q[0], m + q[1]];
    });
    var pcx = pts.reduce(function (s, q) { return s + q[0]; }, 0) / 4;
    var pcy = pts.reduce(function (s, q) { return s + q[1]; }, 0) / 4;
    var isAcc = i === accIdx;
    H.layPolyAt(c, 'Comic panel ' + i, pcx, pcy, pts, true, isAcc ? { fill: sc.ink || sc.fg, stroke: sc.fg, width: lw, alpha: 1 } : { stroke: sc.fg, width: lw, alpha: 1 }, popScale(c, i * 0.08, 0.28));
    var pw = port ? cross : (b - a), ph = port ? (b - a) : cross;
    var sz = Math.min(H.layFitSize(c, ch[i], pw * 0.78, ph * 0.78, { lead: 1.15 }), u * 0.22);
    specs.push({
      text: H.laySplitLines(ch[i], Math.max(3, Math.floor(pw / (sz * 0.9)))),
      size: sz, x: pcx, y: pcy, lead: 1.15,
      color: isAcc ? H.textOn(sc.ink || sc.fg, sc.bg, sc) : sc.fg, mi: i * 3
    });
  }
  H.laySetNodes(c, specs);
});

/* 22. filmstrip: perforated celluloid film reel frames */
reg('filmstrip', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), ch = H.laySplitK(H.layText(c), Math.min(3, H.layChars(H.layText(c)).length));
  var slots = ch.length === 3 ? ch : ch.length === 2 ? [ch[0], ch[1], null] : [null, ch[0], null];
  var v = port, A = v ? Hh : W, Bd = v ? W : Hh;
  var fw0 = Math.min(A * 0.88 / 3.2, Bd * 0.62 * 1.3), fh = fw0 / 1.3, band = fh / 0.72, pitch = fw0 * 1.08;
  var stripC = P.tone === 'fg' ? sc.fg : (sc.ink || sc.fg), tilt = P.tilt || 0;
  H.layRectAt(c, 'Filmstrip band', W / 2, Hh / 2, v ? band : A * 1.4, v ? A * 1.4 : band, { fill: stripC, rot: tilt, alpha: 1 }, envAlpha(c, 0, 0.35));
  var specs = [];
  var fsz = Math.min(u * 0.16, Math.min.apply(null, slots.filter(Boolean).map(function (t) {
    return H.layFitSize(c, t, (v ? fh : fw0) * 0.8, (v ? fw0 : fh) * 0.7);
  })));
  slots.forEach(function (t, i) {
    var off = (i - 1) * pitch, qx = v ? W / 2 : W / 2 + off, qy = v ? Hh / 2 + off : Hh / 2;
    var fwX = v ? fh : fw0, fhY = v ? fw0 : fh;
    H.layRRect(c, 'Film frame ' + i, qx - fwX / 2, qy - fhY / 2, fwX, fhY, fh * 0.04, { fill: sc.bg, alpha: 1 }, envAlpha(c, 0.05, 0.3));
    if (t) {
      specs.push({ text: H.laySplitLines(t, v ? 6 : 4), size: Math.max(10, fsz), x: qx, y: qy, lead: 1.1, color: sc.fg, mi: i * 2 });
    } else {
      H.layCircleAt(c, 'Countdown ring ' + i, qx, qy, Math.min(fwX, fhY) * 0.28, Math.min(fwX, fhY) * 0.28, { stroke: sc.sub, width: 1.6, alpha: 0.55 }, envAlpha(c, 0.15, 0.3, 0.55));
      H.addText(c, 'Countdown num ' + i, String(i === 0 ? 3 : 1), qx, qy, Math.min(fwX, fhY) * 0.32, { color: sc.sub, alpha: 0.6 }, envAlpha(c, 0.15, 0.3, 0.6));
    }
  });
  H.laySetNodes(c, specs);
});

/* 23. quote: monumental quotation glyphs + attribution rule below */
reg('quote', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), text = H.laySplitLines(H.layText(c), port ? 6 : 11);
  var size = Math.min(H.layFitSize(c, text, W * (port ? 0.56 : 0.6), Hh * 0.4, { track: 0.04, lead: 1.25 }), u * 0.16);
  var m = H.layMeasure(c, text, size, { track: 0.04, lead: 1.25 }), cy = Hh / 2 - size * 0.2;
  var latin = H.layHasLatin(text), oMark = latin ? '\u201c' : '\u300c', cMark = latin ? '\u201d' : '\u300d';
  var ms = Math.min(size * 2.8, u * 0.38), mc = P.markC === 'sub' ? sc.sub : sc.accent;
  H.addText(c, 'Quote open', oMark, W / 2 - m.w / 2 - ms * 0.55, cy - m.h / 2 - size * 0.1, ms, { font: serifFont(c), color: mc }, envAlpha(c, 0, 0.35));
  H.addText(c, 'Quote close', cMark, W / 2 + m.w / 2 + ms * 0.55, cy + m.h / 2 + size * 0.1, ms, { font: serifFont(c), color: mc }, envAlpha(c, 0, 0.35));
  if (P.attrib !== false) {
    var ls = smallSize(c), at = H.layAltCopy(c), ay = cy + m.h / 2 + size * 0.9;
    H.addText(c, 'Quote attrib', at, W / 2, ay, ls, { font: bodyFont(c), color: sc.sub }, envAlpha(c, 0.2, 0.35));
    H.layRectAt(c, 'Quote rule', W / 2 - Math.min(W * 0.22, size * 2), ay, ls * 1.2, 1.8, { fill: mc, alpha: 1 }, envAlpha(c, 0.2, 0.35));
  }
  H.laySetNodes(c, [{ text: text, size: size, x: W / 2, y: cy, track: 0.04, lead: 1.25, color: sc.fg }]);
});

/* 24. ruler: blueprint CAD bounding dimensions + px readout labels */
reg('ruler', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), text = H.laySplitLines(H.layText(c), port ? 6 : 12);
  var size = Math.min(H.layFitSize(c, text, W * 0.66, Hh * 0.34, { track: 0.04, lead: 1.15 }), u * 0.19);
  var m = H.layMeasure(c, text, size, { track: 0.04, lead: 1.15 });
  var x0 = W / 2 - m.w / 2, x1 = W / 2 + m.w / 2, y0 = Hh / 2 - m.h / 2, y1 = Hh / 2 + m.h / 2;
  var lw = Math.max(1.2, u * 0.0018), ls = smallSize(c) * 0.9, dy = y0 - size * 0.55, dx = x1 + size * 0.5;
  H.line(c, 'Ruler horiz dim', [[x0, dy], [x1, dy]], sc.sub, lw, 0.85);
  H.line(c, 'Ruler horiz L', [[x0, y0 - 8], [x0, dy - ls * 0.5]], sc.sub, lw, 0.6);
  H.line(c, 'Ruler horiz R', [[x1, y0 - 8], [x1, dy - ls * 0.5]], sc.sub, lw, 0.6);
  H.addText(c, 'Width readout', Math.round(m.w) + ' px', W / 2, dy - ls * 0.9, ls, { font: monoFont(c), color: sc.accent }, envAlpha(c, 0.12, 0.3));
  H.line(c, 'Ruler vert dim', [[dx, y0], [dx, y1]], sc.sub, lw, 0.85);
  H.line(c, 'Ruler vert T', [[x1 + 8, y0], [dx + ls * 0.5, y0]], sc.sub, lw, 0.6);
  H.line(c, 'Ruler vert B', [[x1 + 8, y1], [dx + ls * 0.5, y1]], sc.sub, lw, 0.6);
  H.addText(c, 'Height readout', Math.round(m.h) + ' px', dx + ls * 1.1, Hh / 2, ls, { font: monoFont(c), rotation: 90, color: sc.accent }, envAlpha(c, 0.12, 0.3));
  H.laySetNodes(c, [{ text: text, size: size, x: W / 2, y: Hh / 2, track: 0.04, lead: 1.15, color: sc.fg }]);
});

/* 25. searchBar: rounded search field pill + blinking caret + autocomplete dropdown */
reg('searchBar', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), text = H.layText(c), bw = W * (port ? 0.9 : 0.7);
  var ts = Math.min(H.layFitSize(c, text, bw - u * 0.22, u * 0.11, { track: 0.02 }), u * 0.092);
  var bh = ts * 2.1, rad = P.shape === 'rect' ? bh * 0.16 : bh / 2, by = Hh * (P.pos === 'upper' ? 0.28 : 0.38);
  var plate = sc.ink || sc.fg, filled = P.fill !== 'outline', tc = filled ? H.textOn(plate, sc.bg, sc) : sc.fg;
  H.layRRect(c, 'Search box', W / 2 - bw / 2, by - bh / 2, bw, bh, rad, filled ? { fill: plate, alpha: 1 } : { stroke: sc.fg, width: Math.max(2, ts * 0.05), alpha: 1 }, function (env, f) {
    var e = E.outExpo(cl(env.t / 0.35)) * H.layTout(c, f);
    return { sx: mix(0.3, 1, e), sy: 1, a: e > 0.01 ? 1 : 0 };
  });
  var gx = W / 2 - bw / 2 + bh * 0.5, gr = ts * 0.34;
  H.layCircleAt(c, 'Search loupe', gx - gr * 0.15, by - gr * 0.15, gr * 0.62, gr * 0.62, { stroke: tc, width: Math.max(2, ts * 0.05), alpha: 0.9 }, envAlpha(c, 0.05, 0.25, 0.9));
  var rows = [text + ' lyrics', H.layAltCopy(c), text + ' official'].slice(0, P.sugg || 3);
  var rs = ts * 0.5, rh = rs * 2.4, py = by + bh / 2 + rs * 0.8, ph = rows.length * rh + rs * 0.5;
  H.layRRect(c, 'Search dropdown', W / 2 - bw / 2, py, bw, ph, bh * 0.16, filled ? { fill: plate, alpha: 0.92 } : { stroke: sc.sub, width: 1.4, alpha: 0.9 }, envAlpha(c, 0.18, 0.3, 0.92));
  rows.forEach(function (rt, i) {
    H.addText(c, 'Search row ' + i, rt, W / 2 - bw / 2 + bh * 0.92, py + rs * 0.25 + (i + 0.5) * rh, rs, {
      font: bodyFont(c), align: 'left', color: filled ? H.textOn(plate, sc.bg, sc) : sc.sub, alpha: 0.85
    }, envAlpha(c, 0.22 + i * 0.06, 0.25, 0.85));
  });
  H.laySetNodes(c, [{ text: text, size: ts, x: W / 2 - bw / 2 + bh * 0.92, y: by, align: 'left', track: 0.02, color: tc }]);
});

/* 26. chat: conversational message bubbles popping upwards from baseline */
reg('chat', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), t0 = H.layText(c);
  var msgs = Array.isArray(P.msgs) && P.msgs.length ? P.msgs : (H.layChars(t0).length <= 5 ? [t0] : H.laySplitK(t0, Math.min(3, Math.ceil(H.layChars(t0).length / 4))));
  var colW = W * (port ? 0.86 : 0.54), maxW = colW * 0.8, sentC = sc.accent, recvC = (sc.ink && sc.ink !== sc.accent) ? sc.ink : sc.sub;
  var fs = cl(Math.min(u * 0.082, Hh * 0.56 / Math.max(1, msgs.length * 2.1)), 14, 48);
  var pad = fs * 0.62, sp = fs * 0.45, specs = [];
  var yCur = Hh * 0.78;
  for (var i = msgs.length - 1; i >= 0; i--) {
    var txt = H.laySplitLines(msgs[i], Math.max(4, Math.floor(maxW / (fs * 0.95))));
    var m = H.layMeasure(c, txt, fs, { lead: 1.25 });
    var bw = Math.min(colW * 0.92, m.w + pad * 2), bh = m.h + pad * 1.4;
    var right = i % 2 === 0, x0 = right ? W / 2 + colW / 2 - bw : W / 2 - colW / 2, y0 = yCur - bh;
    var bCol = right ? sentC : recvC, tc = H.textOn(bCol, sc.bg, sc);
    H.layRRect(c, 'Chat bubble ' + i, x0, y0, bw, bh, Math.min(bh / 2, fs * 0.85), { fill: bCol, alpha: 1 }, popScale(c, i * 0.14, 0.25));
    specs.push({ text: txt, size: fs, x: x0 + bw / 2, y: y0 + bh / 2, lead: 1.25, color: tc, delaySec: i * 0.14, mi: i * 3 });
    yCur = y0 - sp;
  }
  H.laySetNodes(c, specs.reverse());
});

/* 27. notification: lockscreen / push alert toast card */
reg('notification', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var u = uMin(c), port = isPort(c), text = H.layText(c);
  var cw = W * (port ? 0.9 : 0.56), pd = cw * 0.05, hs = Math.max(12, cw * 0.032);
  var plate = sc.ink || sc.fg, tc = H.textOn(plate, sc.bg, sc);
  var mt = H.laySplitLines(text, port ? 10 : 14);
  var ms = Math.min(H.layFitSize(c, mt, cw - pd * 2, u * 0.18, { track: 0.02, lead: 1.3 }), u * 0.088);
  var mm = H.layMeasure(c, mt, ms, { track: 0.02, lead: 1.3 }), ch = pd + hs * 4.1 + mm.h + pd * 1.1;
  var x0 = W / 2 - cw / 2, y0 = P.pos === 'banner' ? Hh * 0.08 : Hh / 2 - ch / 2;
  H.layPaper(c, 'Notif card', x0, y0, cw, ch, pd * 0.9, plate, null, 0.012, popScale(c, 0, 0.35));
  var isz = hs * 1.7, iy = y0 + pd + hs * 0.9;
  H.layRRect(c, 'Notif app icon', x0 + pd, iy - isz / 2, isz, isz, isz * 0.24, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.05, 0.25));
  H.addText(c, 'Notif app name', P.app || 'MUSIC', x0 + pd + isz + hs * 0.7, iy, hs, { font: monoFont(c), align: 'left', color: tc, alpha: 0.65 }, envAlpha(c, 0.05, 0.25, 0.65));
  H.addText(c, 'Notif time', 'now', x0 + cw - pd, iy, hs, { font: monoFont(c), align: 'right', color: tc, alpha: 0.55 }, envAlpha(c, 0.05, 0.25, 0.55));
  H.addText(c, 'Notif title', H.layAltCopy(c), x0 + pd, iy + hs * 2, hs * 1.1, { font: bodyFont(c), align: 'left', color: tc }, envAlpha(c, 0.08, 0.25));
  H.laySetNodes(c, [{ text: mt, size: ms, x: x0 + pd, y: iy + hs * 3.1 + mm.h / 2, align: 'left', track: 0.02, lead: 1.3, color: tc }]);
});

/* 28. ticket: perforated stub + barcode + tilted concert pass */
reg('ticket', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var port = isPort(c), seed = H.laySeed(c), tw = Math.min(W * (port ? 0.9 : 0.74), Hh * 1.85), th = Math.min(tw * (port ? 0.46 : 0.38), Hh * 0.5);
  var stubW = tw * 0.22, rot = P.tilt == null ? (seed % 2 ? -3 : 3) : P.tilt;
  var plate = P.fill === 'accent' ? sc.accent : (sc.ink || sc.fg), outline = P.fill === 'outline';
  var tc = outline ? sc.fg : H.textOn(plate, sc.bg, sc), lc = outline ? sc.sub : tc;
  var paint = outline ? { stroke: sc.fg, width: Math.max(2, th * 0.012), rot: rot, alpha: 1 } : { fill: plate, rot: rot, alpha: 1 };
  H.layRectAt(c, 'Ticket body', W / 2 - stubW * 0.5, Hh / 2, tw - stubW, th, paint, popScale(c, 0, 0.35));
  H.layRectAt(c, 'Ticket stub', W / 2 + (tw - stubW) * 0.5 + 3, Hh / 2, stubW, th, paint, function (env, f) {
    var q = E.outBack(cl(env.t / 0.35), 1.4), pout = 1 - H.layTout(c, f);
    return { dx: pout * tw * 0.1, dy: pout * th * 0.16, rot: rot + pout * 10, s: Math.max(0.001, q * H.layTout(c, f)) };
  });
  var ls = Math.max(10, th * 0.07), label = P.label || 'ADMIT ONE';
  H.addText(c, 'Ticket stub label', label, W / 2 + (tw - stubW) * 0.5 + 3, Hh / 2, ls, { font: monoFont(c), rotation: rot - 90, color: tc }, envAlpha(c, 0.1, 0.3));
  var mx0 = W / 2 - tw / 2 + th * 0.14;
  H.addText(c, 'Ticket head', label + '  ·  No.' + H.layLineNo(c), mx0, Hh / 2 - th * 0.32, ls, { font: monoFont(c), align: 'left', rotation: rot, color: lc }, envAlpha(c, 0.08, 0.3));
  H.addText(c, 'Ticket foot', H.layFmtTime(c.cut.origin / c.comp.fps), mx0, Hh / 2 + th * 0.32, ls * 0.9, { font: monoFont(c), align: 'left', rotation: rot, color: lc }, envAlpha(c, 0.08, 0.3));
  var mt = H.laySplitLines(H.layText(c), port ? 6 : 9);
  var size = Math.min(H.layFitSize(c, mt, tw - stubW - th * 0.3, th * 0.44, { track: 0.03, lead: 1.1 }), th * 0.3);
  H.laySetNodes(c, [{ text: mt, size: size, x: mx0, y: Hh / 2, rot: rot, align: 'left', track: 0.03, lead: 1.1, color: tc }]);
});
})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
