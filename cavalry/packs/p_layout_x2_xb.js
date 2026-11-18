/* JIZURA Cavalry Pack: x2layB (29 geometric & diagram layouts xb* from src/11p_x2_layB.js; xbTwistFrames is in p_requested_layouts.js). */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, DEG = H.DEG, TAU = H.TAU;

function reg(key, fn) {
  N.register('layout', key, {
    source: 'src/11p_x2_layB.js (' + key + ')',
    scope: 'cut',
    build: fn,
    differences: ['Native Cavalry text nodes and editable vector geometry matching ' + key + '.']
  });
}

function uMin(c) { return Math.min(c.comp.width, c.comp.height); }
function monoFont(c) { return H.layFontObj(c, 'mono'); }
function lightOf(sc) { return H.lum(sc.fg) > H.lum(sc.bg) ? sc.fg : sc.bg; }
function darkOf(sc) { return H.lum(sc.fg) > H.lum(sc.bg) ? sc.bg : sc.fg; }
function envAlpha(c, d, len, mul) {
  var m = mul == null ? 1 : mul;
  return function (env, f) {
    return { a: cl(H.layTin(c, f, d || 0, len || 0.35, E.outCubic) * H.layTout(c, f) * m, 0, 1) };
  };
}
function sectorPts(cx, cy, r, a0, a1, steps) {
  var pts = [[cx, cy]], n = steps || 28;
  for (var i = 0; i <= n; i++) {
    var a = mix(a0, a1, i / n);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

/* 1. xbHalfDisc: split upper/lower contrasting semicircles straddling text */
reg('xbHalfDisc', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), r = u * 0.34;
  H.layPolyAt(c, 'Half top', W / 2, Hh / 2 - r * 0.3, sectorPts(W / 2, Hh / 2, r, Math.PI, TAU), true, { fill: sc.accent, alpha: 0.9 }, envAlpha(c, 0, 0.3, 0.9));
  H.layPolyAt(c, 'Half bot', W / 2, Hh / 2 + r * 0.3, sectorPts(W / 2, Hh / 2, r, 0, Math.PI), true, { fill: sc.sub, alpha: 0.35 }, envAlpha(c, 0.05, 0.3, 0.35));
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, W * 0.78, u * 0.24), u * 0.16);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 2. xbDiagSplit: canvas sliced diagonally into dual polarized zones */
reg('xbDiagSplit', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  H.layPolyAt(c, 'Diag zone', W * 0.5, Hh * 0.5, [[0, Hh], [W, 0], [W, Hh]], true, { fill: sc.accent, alpha: 0.92 }, envAlpha(c, 0, 0.3, 0.92));
  var chunks = H.laySplitK(H.layText(c), H.layChars(H.layText(c)).length >= 4 ? 2 : 1);
  var sz = Math.min(H.layFitSize(c, chunks[0], W * 0.44, Hh * 0.26), u * 0.15);
  var specs = [{ text: chunks[0], size: sz, x: W * 0.3, y: Hh * 0.34, color: sc.fg, mi: 0 }];
  if (chunks[1]) specs.push({ text: chunks[1], size: sz, x: W * 0.7, y: Hh * 0.66, color: H.textOn(sc.accent, sc.bg, sc), mi: 2 });
  H.laySetNodes(c, specs);
});

/* 3. xbChevronChain: interlocking forward directional chevrons holding word links */
reg('xbChevronChain', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var ws = H.laySplitK(H.layText(c), Math.min(3, Math.max(2, H.layChars(H.layText(c)).length >= 4 ? 3 : 2)));
  var k = ws.length, bw = W * 0.78 / k, bh = Math.min(Hh * 0.28, u * 0.26), tip = bh * 0.32, specs = [];
  ws.forEach(function (w, i) {
    var x0 = W * 0.11 + i * bw, x1 = x0 + bw - u * 0.012, ym = Hh / 2, yt = ym - bh / 2, yb = ym + bh / 2;
    var pts = [[x0, yt], [x1 - tip, yt], [x1, ym], [x1 - tip, yb], [x0, yb], [x0 + tip * 0.7, ym]];
    var fill = i === k - 1 ? sc.accent : (sc.ink || sc.sub);
    H.layPolyAt(c, 'Chevron ' + i, (x0 + x1) / 2, ym, pts, true, { fill: fill, alpha: 0.95 }, envAlpha(c, i * 0.06, 0.3, 0.95));
    var sz = Math.min(H.layFitSize(c, w, bw * 0.62, bh * 0.6), bh * 0.44);
    specs.push({ text: w, size: sz, x: (x0 + x1) / 2, y: ym, color: H.textOn(fill, sc.bg, sc), mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 4. xbDonut: bold segmented infographic torus ring centered around hero readout */
reg('xbDonut', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var rO = u * 0.36, rI = rO * 0.56;
  H.layCircleAt(c, 'Donut outer', W / 2, Hh / 2, rO, rO, { stroke: sc.accent, width: rO - rI, alpha: 0.85 }, envAlpha(c, 0, 0.35, 0.85));
  H.layCircleAt(c, 'Donut inner rule', W / 2, Hh / 2, rI, rI, { stroke: sc.sub, width: 2, alpha: 0.5 }, envAlpha(c, 0.05, 0.3, 0.5));
  var txt = H.laySplitLines(H.layText(c), 6), sz = Math.min(H.layFitSize(c, txt, rI * 1.5, rI * 1.2), u * 0.14);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 5. xbIsoStack: layered isometric oblique deck of floating graphic slabs */
reg('xbIsoStack', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var sw = W * 0.56, sh = u * 0.18;
  for (var i = 0; i < 3; i++) {
    var cy = Hh * (0.62 - i * 0.11), fill = i === 2 ? sc.accent : (i === 1 ? sc.ink || sc.fg : sc.sub);
    var pts = [[W / 2 - sw * 0.42, cy - sh * 0.3], [W / 2 + sw * 0.52, cy - sh * 0.3], [W / 2 + sw * 0.42, cy + sh * 0.3], [W / 2 - sw * 0.52, cy + sh * 0.3]];
    H.layPolyAt(c, 'Iso slab ' + i, W / 2, cy, pts, true, { fill: fill, stroke: sc.bg, width: 2, alpha: 0.95 }, envAlpha(c, i * 0.06, 0.3, 0.95));
  }
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, sw * 0.72, sh * 0.55), u * 0.12);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh * 0.4, color: H.textOn(sc.accent, sc.bg, sc) }]);
});

/* 6. xbPolyTrack: hexagonal polygon perimeter rail dotted with character vertices */
reg('xbPolyTrack', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), sides = Math.max(5, Math.min(8, chars.length)), r = u * 0.32;
  var polyPts = [], specs = [];
  for (var i = 0; i < sides; i++) {
    var a = -Math.PI / 2 + i / sides * TAU;
    polyPts.push([W / 2 + Math.cos(a) * r, Hh / 2 + Math.sin(a) * r]);
  }
  polyPts.push(polyPts[0]);
  H.line(c, 'Polygon track', polyPts, sc.accent, 2.5, 0.75);
  chars.slice(0, sides).forEach(function (ch, idx) {
    var pt = polyPts[idx];
    H.layCircleAt(c, 'Poly node ' + idx, pt[0], pt[1], u * 0.04, u * 0.04, { fill: sc.bg, stroke: sc.accent, width: 2, alpha: 1 }, envAlpha(c, idx * 0.04, 0.25));
    specs.push({ text: ch, size: u * 0.055, x: pt[0], y: pt[1], color: sc.fg, mi: idx });
  });
  H.laySetNodes(c, specs);
});

/* 7. xbShapeRow: alternating geometric badge shapes (circle, square, diamond) per glyph */
reg('xbShapeRow', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, step = Math.min(W * 0.84 / Math.max(1, n), u * 0.16);
  var specs = chars.map(function (ch, i) {
    var x = W / 2 + (i - (n - 1) / 2) * step, k = i % 3, fill = k === 0 ? sc.accent : (k === 1 ? sc.ink || sc.fg : sc.sub);
    if (k === 0) H.layCircleAt(c, 'Shape ' + i, x, Hh / 2, step * 0.44, step * 0.44, { fill: fill, alpha: 1 }, envAlpha(c, i * 0.04, 0.25));
    else if (k === 1) H.layRectAt(c, 'Shape ' + i, x, Hh / 2, step * 0.84, step * 0.84, { fill: fill, alpha: 1 }, envAlpha(c, i * 0.04, 0.25));
    else H.layRectAt(c, 'Shape ' + i, x, Hh / 2, step * 0.68, step * 0.68, { fill: fill, rot: 45, alpha: 1 }, envAlpha(c, i * 0.04, 0.25));
    return { text: ch, size: step * 0.48, x: x, y: Hh / 2, color: H.textOn(fill, sc.bg, sc), mi: i };
  });
  H.laySetNodes(c, specs);
});

/* 8. xbCompGrid: asymmetrical Mondrian proportional grid of ruled colored fields */
reg('xbCompGrid', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var mx = W * 0.1, my = Hh * 0.12, gw = W - mx * 2, gh = Hh - my * 2;
  H.layRRect(c, 'Grid frame', mx, my, gw, gh, 0, { stroke: sc.fg, width: 2.5, alpha: 0.85 }, envAlpha(c, 0, 0.3, 0.85));
  H.layRectAt(c, 'Grid accent', mx + gw * 0.18, my + gh * 0.22, gw * 0.36, gh * 0.44, { fill: sc.accent, alpha: 0.9 }, envAlpha(c, 0.04, 0.3, 0.9));
  H.line(c, 'Grid split V', [[mx + gw * 0.36, my], [mx + gw * 0.36, my + gh]], sc.fg, 2, 0.8);
  H.line(c, 'Grid split H', [[mx, my + gh * 0.44], [mx + gw, my + gh * 0.44]], sc.fg, 2, 0.8);
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, gw * 0.54, gh * 0.42), u * 0.14);
  H.laySetNodes(c, [{ text: txt, size: sz, x: mx + gw * 0.68, y: my + gh * 0.72, color: sc.fg }]);
});

/* 9. xbPrimitives: Bauhaus yellow/red/blue tri-primitive triad (triangle, circle, square) */
reg('xbPrimitives', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), r = u * 0.18;
  H.layCircleAt(c, 'Prim circle', W * 0.28, Hh / 2, r, r, { fill: sc.accent, alpha: 0.72 }, envAlpha(c, 0, 0.3, 0.72));
  H.layPolyAt(c, 'Prim tri', W / 2, Hh / 2, [[W / 2, Hh / 2 - r], [W / 2 + r, Hh / 2 + r * 0.8], [W / 2 - r, Hh / 2 + r * 0.8]], true, { fill: sc.sub, alpha: 0.6 }, envAlpha(c, 0.05, 0.3, 0.6));
  H.layRectAt(c, 'Prim sq', W * 0.72, Hh / 2, r * 1.7, r * 1.7, { stroke: sc.fg, width: 3, alpha: 0.85 }, envAlpha(c, 0.1, 0.3, 0.85));
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, W * 0.76, Hh * 0.38), u * 0.17);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 10. xbArcPoster: bold modernist concentric rainbow/target quarter arcs */
reg('xbArcPoster', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  [0.44, 0.34, 0.24].forEach(function (k, i) {
    H.layCircleAt(c, 'Arc band ' + i, W / 2, Hh * 0.78, u * k, u * k, { stroke: i % 2 ? sc.sub : sc.accent, width: u * 0.036, alpha: 0.75 }, envAlpha(c, i * 0.05, 0.35, 0.75));
  });
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.38), u * 0.17);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh * 0.38, color: sc.fg }]);
});

/* 11. xbZiggurat: stepped architectural pyramid tiers cascading upward */
reg('xbZiggurat', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chunks = H.laySplitK(H.layText(c), Math.min(3, Math.max(2, H.layChars(H.layText(c)).length >= 5 ? 3 : 2)));
  var k = chunks.length, rowH = Math.min(Hh * 0.18, u * 0.15), specs = [];
  chunks.forEach(function (ch, i) {
    var w = mix(W * 0.34, W * 0.82, i / Math.max(1, k - 1)), y = Hh / 2 + (i - (k - 1) / 2) * rowH * 1.15;
    var fill = i === 0 ? sc.accent : (sc.ink || sc.fg);
    H.layRRect(c, 'Zig tier ' + i, W / 2 - w / 2, y - rowH * 0.45, w, rowH * 0.9, 3, { fill: fill, alpha: 0.94 }, envAlpha(c, i * 0.05, 0.3, 0.94));
    var sz = Math.min(H.layFitSize(c, ch, w * 0.8, rowH * 0.65), rowH * 0.58);
    specs.push({ text: ch, size: sz, x: W / 2, y: y, color: H.textOn(fill, sc.bg, sc), mi: i * 2 });
  });
  H.laySetNodes(c, specs);
});

/* 12. xbHoneycomb: tiled regular hexagon cells holding staggered glyph array */
reg('xbHoneycomb', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, r = Math.min(W * 0.46 / Math.max(2, n), u * 0.11);
  var specs = chars.map(function (ch, i) {
    var cx = W / 2 + (i - (n - 1) / 2) * r * 1.85, cy = Hh / 2 + (i % 2 ? r * 0.52 : -r * 0.52);
    var pts = [];
    for (var s = 0; s < 6; s++) { var a = s / 6 * TAU; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    var act = i % 2 === 0;
    H.layPolyAt(c, 'Hex cell ' + i, cx, cy, pts, true, { fill: act ? sc.accent : sc.bg, stroke: sc.accent, width: 2, alpha: 0.95 }, envAlpha(c, i * 0.04, 0.25, 0.95));
    return { text: ch, size: r * 0.95, x: cx, y: cy, color: act ? H.textOn(sc.accent, sc.bg, sc) : sc.fg, mi: i };
  });
  H.laySetNodes(c, specs);
});

/* 13. xbShear: high-velocity slanted parallelogram banner plates */
reg('xbShear', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var pw = W * 0.74, ph = Math.min(Hh * 0.34, u * 0.3), sk = ph * 0.38;
  var pts = [[W / 2 - pw / 2 + sk, Hh / 2 - ph / 2], [W / 2 + pw / 2 + sk, Hh / 2 - ph / 2], [W / 2 + pw / 2 - sk, Hh / 2 + ph / 2], [W / 2 - pw / 2 - sk, Hh / 2 + ph / 2]];
  H.layPolyAt(c, 'Shear plate', W / 2, Hh / 2, pts, true, { fill: sc.accent, alpha: 1 }, envAlpha(c, 0, 0.3));
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, pw * 0.8, ph * 0.65), ph * 0.48);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, rot: -6, color: H.textOn(sc.accent, sc.bg, sc) }]);
});

/* 14. xbPatternPanel: architectural geometric tile strip paired with bold main type */
reg('xbPatternPanel', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  for (var i = 0; i < 8; i++) {
    var px = mix(W * 0.14, W * 0.86, i / 7);
    H.layCircleAt(c, 'Tile motif ' + i, px, Hh * 0.24, u * 0.024, u * 0.024, { fill: i % 2 ? sc.accent : sc.sub, alpha: 0.7 }, envAlpha(c, i * 0.03, 0.25, 0.7));
  }
  var txt = H.laySplitLines(H.layText(c), 9), sz = Math.min(H.layFitSize(c, txt, W * 0.8, Hh * 0.42), u * 0.18);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh * 0.56, color: sc.fg }]);
});

/* 15. xbDiamond: rotated 45-degree rhombic card frame centering dynamic lockup */
reg('xbDiamond', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), ds = u * 0.56;
  H.layRectAt(c, 'Diamond plate', W / 2, Hh / 2, ds, ds, { stroke: sc.accent, width: 3, rot: 45, alpha: 0.9 }, envAlpha(c, 0, 0.3, 0.9));
  H.layRectAt(c, 'Diamond inner', W / 2, Hh / 2, ds * 0.82, ds * 0.82, { fill: sc.sub, rot: 45, alpha: 0.16 }, envAlpha(c, 0.04, 0.3, 0.16));
  var txt = H.laySplitLines(H.layText(c), 7), sz = Math.min(H.layFitSize(c, txt, ds * 0.85, ds * 0.55), u * 0.16);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 16. xbShapeLens: triangular aperture prism window spotlighting key center segment */
reg('xbShapeLens', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), r = u * 0.38;
  var pts = [[W / 2, Hh / 2 - r], [W / 2 + r * 1.05, Hh / 2 + r * 0.85], [W / 2 - r * 1.05, Hh / 2 + r * 0.85]];
  H.layPolyAt(c, 'Lens prism', W / 2, Hh / 2, pts, true, { stroke: sc.accent, width: 3, alpha: 0.9 }, envAlpha(c, 0, 0.3, 0.9));
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, r * 1.5, r * 0.8), u * 0.15);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2 + r * 0.18, color: sc.fg }]);
});

/* 17. xbConstruct: diagonal Suprematist wedge + floating vector bars */
reg('xbConstruct', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  H.layRectAt(c, 'Suprem bar 1', W * 0.38, Hh * 0.34, W * 0.52, u * 0.04, { fill: sc.accent, rot: -18, alpha: 0.9 }, envAlpha(c, 0, 0.3, 0.9));
  H.layRectAt(c, 'Suprem bar 2', W * 0.62, Hh * 0.68, W * 0.44, u * 0.018, { fill: sc.sub, rot: -18, alpha: 0.7 }, envAlpha(c, 0.06, 0.3, 0.7));
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, W * 0.74, Hh * 0.4), u * 0.17);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, rot: -18, color: sc.fg }]);
});

/* 18. xbGolden: Fibonacci golden-ratio nested subdivision boxes */
reg('xbGolden', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var gw = W * 0.8, gh = gw / 1.618; if (gh > Hh * 0.76) { gh = Hh * 0.76; gw = gh * 1.618; }
  var x0 = (W - gw) / 2, y0 = (Hh - gh) / 2, sq = gh;
  H.layRRect(c, 'Golden outer', x0, y0, gw, gh, 0, { stroke: sc.sub, width: 2, alpha: 0.7 }, envAlpha(c, 0, 0.3, 0.7));
  H.line(c, 'Golden cut 1', [[x0 + sq, y0], [x0 + sq, y0 + gh]], sc.accent, 2, 0.85);
  H.line(c, 'Golden cut 2', [[x0 + sq, y0 + (gw - sq)], [x0 + gw, y0 + (gw - sq)]], sc.accent, 1.5, 0.65);
  var txt = H.laySplitLines(H.layText(c), 7), sz = Math.min(H.layFitSize(c, txt, sq * 0.8, sq * 0.65), u * 0.16);
  H.laySetNodes(c, [{ text: txt, size: sz, x: x0 + sq / 2, y: Hh / 2, color: sc.fg }]);
});

/* 19. xbVenn: twin intersecting translucent Venn circles spotlighting overlap */
reg('xbVenn', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), r = Math.min(W * 0.25, Hh * 0.32);
  H.layCircleAt(c, 'Venn L', W / 2 - r * 0.58, Hh / 2, r, r, { fill: sc.sub, stroke: sc.fg, width: 2, alpha: 0.28 }, envAlpha(c, 0, 0.3, 0.28));
  H.layCircleAt(c, 'Venn R', W / 2 + r * 0.58, Hh / 2, r, r, { fill: sc.accent, stroke: sc.accent, width: 2, alpha: 0.28 }, envAlpha(c, 0.06, 0.3, 0.28));
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, r * 2.4, r * 1.1), u * 0.16);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 20. xbSlitDisc: cracked binary disc parted horizontally to insert crisp type */
reg('xbSlitDisc', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), r = u * 0.32;
  H.layPolyAt(c, 'Disc top', W / 2, Hh / 2 - u * 0.08, sectorPts(W / 2, Hh / 2 - u * 0.08, r, Math.PI, TAU), true, { fill: sc.accent, alpha: 0.9 }, envAlpha(c, 0, 0.3, 0.9));
  H.layPolyAt(c, 'Disc bot', W / 2, Hh / 2 + u * 0.08, sectorPts(W / 2, Hh / 2 + u * 0.08, r, 0, Math.PI), true, { fill: sc.accent, alpha: 0.9 }, envAlpha(c, 0, 0.3, 0.9));
  var txt = H.layFlat(H.layText(c)), sz = Math.min(H.layFitSize(c, txt, W * 0.82, u * 0.2), u * 0.15);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 21. xbDial: calibrated rotary tachometer ring with 24 radial ticks */
reg('xbDial', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), r = u * 0.36;
  H.layCircleAt(c, 'Dial ring', W / 2, Hh / 2, r, r, { stroke: sc.sub, width: 2, alpha: 0.7 }, envAlpha(c, 0, 0.3, 0.7));
  for (var i = 0; i < 24; i++) {
    var a = i / 24 * TAU, ri = i % 6 === 0 ? r * 0.82 : r * 0.9;
    H.line(c, 'Dial tick ' + i, [[W / 2 + Math.cos(a) * ri, Hh / 2 + Math.sin(a) * ri], [W / 2 + Math.cos(a) * r, Hh / 2 + Math.sin(a) * r]], i % 6 === 0 ? sc.accent : sc.sub, 2, 0.8);
  }
  var txt = H.laySplitLines(H.layText(c), 7), sz = Math.min(H.layFitSize(c, txt, r * 1.4, r * 0.9), u * 0.14);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 22. xbCrosshair: optical target reticle locked precisely around hero lockup */
reg('xbCrosshair', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), r = u * 0.34;
  H.layCircleAt(c, 'Reticle ring', W / 2, Hh / 2, r, r, { stroke: sc.accent, width: 2, alpha: 0.8 }, envAlpha(c, 0, 0.25, 0.8));
  H.line(c, 'Ret H', [[W * 0.08, Hh / 2], [W / 2 - r * 0.7, Hh / 2]], sc.accent, 2, 0.8);
  H.line(c, 'Ret H2', [[W / 2 + r * 0.7, Hh / 2], [W * 0.92, Hh / 2]], sc.accent, 2, 0.8);
  H.line(c, 'Ret V', [[W / 2, Hh * 0.08], [W / 2, Hh / 2 - r * 0.7]], sc.accent, 2, 0.8);
  H.line(c, 'Ret V2', [[W / 2, Hh / 2 + r * 0.7], [W / 2, Hh * 0.92]], sc.accent, 2, 0.8);
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, r * 1.6, r * 0.9), u * 0.15);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 23. xbStripeDisc: bold horizontal louvered disc medallion behind clean title */
reg('xbStripeDisc', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), r = u * 0.32;
  for (var i = -4; i <= 4; i++) {
    var dy = i * (r / 4.8), hw = Math.sqrt(Math.max(1, r * r - dy * dy));
    H.layRectAt(c, 'Disc slat ' + i, W / 2, Hh / 2 + dy, hw * 2, r * 0.1, { fill: sc.accent, alpha: 0.55 }, envAlpha(c, Math.abs(i) * 0.03, 0.3, 0.55));
  }
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, W * 0.76, Hh * 0.42), u * 0.17);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 24. xbWedge: triangular radial searchlight slice opening across dark canvas */
reg('xbWedge', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var pts = [[W * 0.1, Hh * 0.5], [W * 0.9, Hh * 0.16], [W * 0.9, Hh * 0.84]];
  H.layPolyAt(c, 'Wedge beam', W / 2, Hh / 2, pts, true, { fill: sc.accent, alpha: 0.85 }, envAlpha(c, 0, 0.3, 0.85));
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, W * 0.62, Hh * 0.36), u * 0.15);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W * 0.56, y: Hh / 2, color: H.textOn(sc.accent, sc.bg, sc) }]);
});

/* 25. xbGradBars: ascending step histogram stripes backing headline lockup */
reg('xbGradBars', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  for (var i = 0; i < 6; i++) {
    var bh = Hh * (0.2 + i * 0.1), bx = mix(W * 0.18, W * 0.82, i / 5);
    H.layRectAt(c, 'Grad bar ' + i, bx, Hh * 0.84 - bh / 2, W * 0.08, bh, { fill: sc.accent, alpha: 0.25 + i * 0.1 }, envAlpha(c, i * 0.04, 0.3, 0.25 + i * 0.1));
  }
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, W * 0.78, Hh * 0.44), u * 0.18);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh * 0.44, color: sc.fg }]);
});

/* 26. xbGraph: polyline analytical curve charting keyed points along glyph anchors */
reg('xbGraph', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), seed = H.laySeed(c);
  var chars = H.layChars(H.layText(c)), n = chars.length, pts = [], specs = [];
  H.line(c, 'Graph axis X', [[W * 0.12, Hh * 0.76], [W * 0.88, Hh * 0.76]], sc.sub, 2, 0.6);
  H.line(c, 'Graph axis Y', [[W * 0.12, Hh * 0.22], [W * 0.12, Hh * 0.76]], sc.sub, 2, 0.6);
  chars.forEach(function (ch, i) {
    var px = n === 1 ? W / 2 : mix(W * 0.2, W * 0.84, i / (n - 1));
    var py = mix(Hh * 0.66, Hh * 0.28, R.hash01(seed, i, 4));
    pts.push([px, py]);
    H.layCircleAt(c, 'Graph dot ' + i, px, py, u * 0.012, u * 0.012, { fill: sc.accent, alpha: 1 }, envAlpha(c, i * 0.04, 0.25));
    specs.push({ text: ch, size: Math.min(u * 0.09, W * 0.56 / Math.max(2, n)), x: px, y: py - u * 0.055, color: sc.fg, mi: i });
  });
  if (pts.length >= 2) H.line(c, 'Graph curve', pts, sc.accent, 2.5, 0.85);
  H.laySetNodes(c, specs);
});

/* 27. xbPie: sliced proportional pie chart highlighting primary sector callout */
reg('xbPie', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), r = u * 0.34;
  H.layCircleAt(c, 'Pie base', W / 2, Hh / 2, r, r, { fill: sc.sub, alpha: 0.35 }, envAlpha(c, 0, 0.3, 0.35));
  H.layPolyAt(c, 'Pie slice', W / 2 + u * 0.02, Hh / 2 - u * 0.02, sectorPts(W / 2 + u * 0.02, Hh / 2 - u * 0.02, r, -Math.PI * 0.45, Math.PI * 0.35), true, { fill: sc.accent, alpha: 0.92 }, envAlpha(c, 0.06, 0.3, 0.92));
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, W * 0.72, Hh * 0.38), u * 0.16);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 28. xbCircleFit: concentric fitted bounding rings hugging character lockup */
reg('xbCircleFit', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), r = u * 0.34;
  H.layCircleAt(c, 'Fit circle', W / 2, Hh / 2, r, r, { fill: sc.accent, alpha: 0.92 }, envAlpha(c, 0, 0.3, 0.92));
  H.layCircleAt(c, 'Fit halo', W / 2, Hh / 2, r * 1.12, r * 1.12, { stroke: sc.fg, width: 2, alpha: 0.5 }, envAlpha(c, 0.06, 0.3, 0.5));
  var txt = H.laySplitLines(H.layText(c), 6), sz = Math.min(H.layFitSize(c, txt, r * 1.48, r * 1.2), u * 0.15);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2, color: H.textOn(sc.accent, sc.bg, sc) }]);
});

/* 29. xbTriangleSet: geometric triangular triad stacking pyramid composition */
reg('xbTriangleSet', function (c) {
  var W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c), r = u * 0.36;
  var p1 = [[W / 2, Hh / 2 - r], [W / 2 + r * 1.1, Hh / 2 + r * 0.82], [W / 2 - r * 1.1, Hh / 2 + r * 0.82]];
  H.layPolyAt(c, 'Tri main', W / 2, Hh / 2, p1, true, { stroke: sc.accent, width: 3, alpha: 0.9 }, envAlpha(c, 0, 0.3, 0.9));
  var txt = H.laySplitLines(H.layText(c), 8), sz = Math.min(H.layFitSize(c, txt, r * 1.5, r * 0.82), u * 0.15);
  H.laySetNodes(c, [{ text: txt, size: sz, x: W / 2, y: Hh / 2 + r * 0.2, color: sc.fg }]);
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
