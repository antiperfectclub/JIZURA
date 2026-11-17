/* Requested layouts that rebuild composition around the exported text nodes. The browser exporter uses the
 * captured-geometry `graphics` layout instead; these recipes serve hand-authored or AE-derived assemblies
 * that carry layout names, and never replace existing text nodes with new copy.
 * Source: jizura_core.jsx / layout (read-only). */
(function (N, G, C, R, V) {
'use strict';
var E = R.E;

function register(key, build, differences) {
  N.register('layout', key, { source: 'jizura_core.jsx / layout:' + key, scope: 'cut', build: build, differences: differences || [] });
}

function primary(c) {
  if (!c.cut.nodes.length) throw new Error('Layout requires a text payload and resolved font: ' + c.cut.id);
  return c.cut.nodes.slice().sort(function (a, b) { return b.size - a.size; })[0];
}

function designRect(c, name, x, y, w, h, paint) {
  return V.rect(c, name, x - c.comp.width / 2, y - c.comp.height / 2, w, h, paint);
}
function designLine(c, name, points, col, width, alpha) {
  return V.line(c, name, points.map(function (p) { return [p[0] - c.comp.width / 2, p[1] - c.comp.height / 2]; }), col, width, alpha);
}

register('center', function (c) {
  var node = primary(c);
  if (c.cut.nodes.length !== 1) throw new Error('center expects one text block; refusing to flatten nodes');
  node.x = c.comp.width / 2;
  node.y = c.comp.height / 2;
  node.align = 'center';
  node.glyphs = V.glyphs(c, node);
});

register('vcols', function (c) {
  var P = c.preset.params || {}, node = primary(c), lines = node.text.split('\n');
  node.vertical = true;
  node.rotation = node.rotation || 0;
  node.sx = node.sx == null ? 1 : node.sx;
  node.track = node.track == null ? 0.03 : node.track;
  node.lead = node.lead == null ? 1.4 : node.lead;
  node.align = 'left';
  var maxCount = Math.max.apply(null, lines.map(function (s) { return Array.from(s).length; }));
  var size = Math.min(node.size, c.comp.height * 0.78 / Math.max(1, maxCount * (1 + node.track)),
    c.comp.width * 0.82 / Math.max(1, lines.length * node.lead));
  node.size = size;
  node.x = c.comp.width / 2;
  node.y = (c.comp.height - maxCount * size * (1 + node.track)) / 2;
  delete node.glyphs;
  node.glyphs = V.glyphs(c, node);
  if (P.variant === 'repeat') {
    var count = Math.max(1, Math.round(P.cols || 3)), template = V.copy(node), mid = (count - 1) / 2;
    c.cut.nodes = [];
    for (var i = 0; i < count; i++) {
      var n = V.copy(template);
      n.id = template.id + '-column-' + i;
      n.x = c.comp.width / 2 + (i - mid) * size * 1.75;
      n.delayFrames = template.delayFrames + Math.round(Math.abs(i - mid) * c.comp.fps * 0.02);
      if (P.side === 'dim' && i !== Math.round(mid)) n.color = c.sc.sub;
      c.cut.nodes.push(n);
    }
  }
}, ['Split mode preserves supplied line breaks.',
  'Repeat mode currently supports dim/same side styles; outline side styling requires text paint export.']);

register('dictionary', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, H = c.comp.height, U = Math.min(W, H);
  var node = primary(c), b = V.rest(c);
  var mx = W * (H > W ? 0.08 : 0.1), aw = W - mx * 2 - W * (H > W ? 0.04 : 0.03);
  var ls = Math.max(11, Math.min(24, U * 0.02)), lw = Math.max(1, U * 0.0014);
  designLine(c, 'Dictionary guide rule', [[mx, H * 0.055 + ls * 0.9], [mx + aw, H * 0.055 + ls * 0.9]], c.sc.sub, lw, 0.6);
  var pos = String(P.pos || '名'), pw = ls * (Array.from(pos).length * 1.25 + 0.9);
  var px = Math.min(node.x + Math.max(node.size, b.w * 0.35), W - mx - pw);
  designRect(c, 'Dictionary part-of-speech box', px, node.y - ls * 0.85, pw, ls * 1.7,
    { stroke: c.sc.fg, width: lw * 1.4 });
  var tw = U * 0.075, th = U * 0.16, ty = H * 0.1 + (H * 0.8 - th) * (P.tabY == null ? 0.5 : P.tabY);
  designLine(c, 'Dictionary page edge', [[W - tw * 1.05, H * 0.04], [W - tw * 1.05, H * 0.96]], c.sc.sub, lw, 0.35);
  var tab = designRect(c, 'Dictionary thumb tab', W - tw, ty, tw + 2, th, { fill: c.sc.ink || c.sc.fg });
  V.animate(c, tab, function (e) {
    var q = E.outCubic((e.t - 0.15) / 0.5);
    return { 'position.x': tw * (1 - q), alpha: q > 0.01 ? 1 : 0 };
  });
  var defs = c.cut.nodes.filter(function (n) { return /^[12]$/.test(n.text.trim()); });
  defs.forEach(function (n, i) {
    var diameter = Math.max(n.size * 1.5, U * 0.026);
    C.shape(c.graph, c.cut, c.cut.id + ' / Dictionary definition badge ' + i, c.parent,
      G.ellipse(n.x - W / 2, H / 2 - n.y, diameter / 2, diameter / 2), { fill: c.sc.fg });
    n.color = c.sc.bg;
  });
}, ['Existing exported dictionary text nodes are preserved.',
  'Missing dictionary text is rejected upstream rather than synthesised from unrelated text.',
  'Rounded part-of-speech corners are currently square.']);

register('xbTwistFrames', function (c) {
  var P = c.preset.params || {}, node = primary(c);
  var gs = V.glyphs(c, node), b = V.bounds(gs), U = Math.min(c.comp.width, c.comp.height);
  var n = Math.max(1, Math.round(P.n == null ? 6 : P.n)), th = P.th == null ? 7 : P.th;
  var accentIndex = P.acc == null ? 2 : P.acc, lw = Math.max(1, U * 0.0016);
  var bw = b.w * Math.abs(node.sx || 1) + node.size * 0.9, bh = b.h + node.size * 0.8;
  if (P.sq) bh = Math.max(bh, Math.min(bw, U * 0.5));
  for (var k = n; k >= 0; k--) {
    (function (index) {
      var w = bw + index * U * 0.15, h = bh + index * U * 0.15;
      var hot = index === 0 || index === accentIndex;
      var col = index === 0 ? c.sc.fg : index === accentIndex ? c.sc.accent : c.sc.sub;
      var id = V.rect(c, 'Twisted frame ' + index, -w / 2, -h / 2, w, h, {
        fill: index === 0 && P.plate ? c.sc.ink || c.sc.fg : null,
        stroke: col,
        width: lw * (index === 0 ? 3 : index === accentIndex ? 2.5 : 1.5),
        alpha: hot ? 1 : 0.8 - 0.5 * index / n
      });
      V.animate(c, id, function (e, frame) {
        var q = E.outExpo((e.t - index * 0.045) / 0.6), out = V.envelope(c, node, frame).pout;
        var s = 0.7 + 0.3 * q;
        return { 'scale.x': s, 'scale.y': s,
          rotation: -index * th * (q + 0.1 * Math.sin(e.t * 0.8 + index * 0.5) + out * 0.7),
          alpha: (hot ? 1 : 0.8 - 0.5 * index / n) * R.clamp(q * 2) * (1 - E.inCubic(out)) };
      });
    })(k);
  }
  if (P.plate) node.color = c.sc.bg;
});
})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents);
