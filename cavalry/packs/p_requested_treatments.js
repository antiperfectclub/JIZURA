/* Requested treatments. Each works on real editable glyph copies; none is mapped to a box or underline.
 * Source: jizura_core.jsx / treat (read-only). */
(function (N, R, V) {
'use strict';

function register(key, build, differences) {
  N.register('treat', key, { source: 'jizura_core.jsx / treat:' + key, scope: 'glyph', build: build, differences: differences || [] });
}

function eachText(c, fn) {
  c.texts.forEach(function (id) {
    var n = c.graph.byId[id];
    if (!n || n.type !== 'textShape') throw new Error('Treatment target is not text: ' + id);
    fn(n);
  });
}

function stroke(n, color, width) {
  n.attrs.fill = false;
  n.attrs.stroke = true;
  n.attrs['stroke.strokeColor'] = color;
  n.attrs['stroke.width'] = width;
}

function offset(n, dx, dy) {
  if (n.keys['position.x']) {
    V.changeTrack(n, 'position.x', function (v) { return v + dx; });
    V.changeTrack(n, 'position.y', function (v) { return v - dy; });
  } else {
    var p = n.attrs.position || [0, 0];
    n.attrs.position = [p[0] + dx, p[1] - dy];
  }
}

/* The offset fill is a backing impression, so it must draw before its source layer. */
function behind(graph, node, source) {
  var i = graph.layers.indexOf(node), j = graph.layers.indexOf(source);
  if (i < 0 || j < 0 || i === j) return;
  graph.layers.splice(i, 1);
  j = graph.layers.indexOf(source);
  graph.layers.splice(j, 0, node);
}

register('inline', function (c) {
  var a = V.param(c, 'a', 0.019), b = V.param(c, 'b', 0.018), accent = V.param(c, 'c', false);
  eachText(c, function (n) {
    var col = n.attrs['material.materialColor'], size = n.attrs.fontSize;
    var cut = V.cloneLayer(c.graph, n.id, 'Inline cut');
    var rim = V.cloneLayer(c.graph, n.id, 'Inline rim');
    stroke(cut, accent ? c.sc.accent : c.sc.bg, size * (a + b) * 2);
    stroke(rim, col, size * a * 2);
  });
}, ['The inline knockout uses the scheme paper colour, matching the source treatment rather than a transparent Boolean knockout.']);

register('outlineOffset', function (c) {
  var d = V.param(c, 'd', 0.065), direction = V.param(c, 'dir', [1, 1]), k = V.param(c, 'k', 0.026);
  if (!Array.isArray(direction) || direction.length !== 2) throw new Error('outlineOffset.dir must be [x,y]');
  eachText(c, function (n) {
    var col = n.attrs['material.materialColor'], size = n.attrs.fontSize;
    var fill = V.cloneLayer(c.graph, n.id, 'Offset fill');
    fill.attrs.fill = true;
    fill.attrs.stroke = false;
    fill.attrs['material.materialColor'] = c.sc.accent;
    offset(fill, direction[0] * size * d, direction[1] * size * d);
    behind(c.graph, fill, n);
    stroke(n, col, Math.max(1.4, size * k));
  });
});

register('xoDoublePrint', function (c) {
  var distance = V.param(c, 'd', 0.06), rotation = V.param(c, 'r', 1);
  var opacity = V.param(c, 'a', 0.39), up = V.param(c, 'up', false);
  eachText(c, function (n) {
    var size = n.attrs.fontSize;
    var second = V.cloneLayer(c.graph, n.id, 'Second impression');
    var dx = size * distance, dy = dx * (up ? -0.45 : 0.45);
    offset(second, dx, dy);
    V.changeTrack(second, 'rotation', function (v) { return (v || 0) - rotation; });
    if (second.keys.alpha) V.changeTrack(second, 'alpha', function (v) { return v * opacity; });
    else second.attrs.alpha = (second.attrs.alpha == null ? 1 : second.attrs.alpha) * opacity;
  });
}, ['The secondary impression follows glyph tracks.',
  'The source\'s whole-item print pivot is represented per glyph here; whole-line pivot fidelity still needs comparison.']);
})(JZNative, JZRecipeTools, JZRecipeComponents);
