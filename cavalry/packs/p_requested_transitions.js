/*
 * Incoming-cut polygon iris.
 * Source formula: src/11p_x2_camtr.js / xqPolyIris.
 */
(function (N, C, G, R, V, S) {
'use strict';

N.register('trans', 'xqPolyIris', {
  source: 'src/11p_x2_camtr.js / trans:xqPolyIris',
  scope: 'cut-pair',
  differences: [
    'Outgoing graph holds its last sampled pose when its clip ends before the transition.',
    'Documented JavaScript Deformer clipping; actual Cavalry render verification is pending.'
  ],
  build: function (c) {
    if (!c.previous) throw new Error('xqPolyIris requires a preceding cut');
    var P = c.preset.params || {}, W = c.comp.width, H = c.comp.height;
    var n = P.n == null ? 4 : P.n;
    if (!Number.isInteger(n) || n < 3 || n > 64) throw new Error('xqPolyIris.n must be an integer in [3,64]');

    /* The exporter puts the planned duration on preset.frames; params.frames is an authoring override. */
    var duration = P.frames != null ? P.frames
      : c.preset.frames != null ? c.preset.frames
      : Math.max(2, Math.round(0.42 * c.comp.fps));
    if (!Number.isInteger(duration) || duration < 1) throw new Error('Invalid transition frame count');

    var begin = c.cut.start;
    var end = Math.min(c.cut.end, c.comp.frameCount, begin + duration);
    if (c.previous.cut.end < begin) throw new Error('xqPolyIris cannot bridge an unrendered timeline gap');

    var polygons = Object.create(null);
    var maxRadius = (Math.hypot(W, H) / 2 + 4) / Math.cos(Math.PI / n);
    var a0 = P.a0 == null ? 0 : P.a0;
    var spin = P.spin == null ? 80 : P.spin;
    [a0, spin].forEach(function (v) { N.finite(v, 'iris parameter'); });

    function state(frame) {
      var p = R.clamp((frame - begin) / Math.max(1, end - begin - 1));
      var eased = n === 3 ? R.E.inCubic(p) * 0.5 + R.E.inOutCubic(p) * 0.5 : R.E.inOutCubic(p);
      return { p: p, eased: eased, radius: Math.max(1e-8, maxRadius * eased),
        angle: (a0 + spin * (1 - eased)) * Math.PI / 180 };
    }

    for (var frame = begin; frame < end; frame++) {
      var sample = state(frame);
      polygons[frame] = [];
      for (var i = 0; i < n; i++) {
        var angle = sample.angle + i * Math.PI * 2 / n;
        polygons[frame].push([Math.cos(angle) * sample.radius, -Math.sin(angle) * sample.radius]);
      }
    }

    /* Preserve the outgoing cut beneath the incoming clipped cut. */
    c.previous.layerIds.forEach(function (id) {
      var layer = c.graph.byId[id];
      if (layer.end === c.previous.cut.end) layer.end = Math.max(layer.end, end);
    });

    /* layerIds is captured after the whole cut is assembled, so this includes paths, text and treatments. */
    c.layerIds.slice().forEach(function (id) {
      var layer = c.graph.byId[id];
      if (layer.type === 'path' || layer.type === 'textShape') {
        S.clip(c.graph, id, polygons, c.options && c.options.hostProfile && c.options.hostProfile.javaScriptDeformer);
      }
    });

    var unitPolygon = [];
    for (var vertex = 0; vertex < n; vertex++) {
      var a = vertex * Math.PI * 2 / n;
      unitPolygon.push([Math.cos(a), Math.sin(a)]);
    }
    var width = Math.max(2, Math.min(W, H) * 0.008);
    [1, 1.12].forEach(function (ratio, index) {
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Iris edge ' + index, c.sceneRoot,
        V.commands(unitPolygon, true), { stroke: index ? (c.sc.accent2 || c.sc.fg) : c.sc.accent, width: 1 });
      c.graph.byId[id].end = end;
      C.sample(c.graph, id, begin, end, function (frame) {
        var sample = state(frame);
        var radius = sample.radius * ratio + (index ? width * 3 : 0);
        var opacity = Math.pow(Math.max(0, Math.sin(Math.PI * sample.p)), 0.6) * (index ? 0.55 : 1);
        return {
          'scale.x': radius, 'scale.y': radius,
          rotation: -sample.angle * 180 / Math.PI,
          'stroke.width': (index ? Math.max(1, width * 0.4) : width) / radius,
          alpha: opacity
        };
      });
    });

    return { start: begin, end: end, vertices: n };
  }
});
})(JZNative, JZComponents, JZGraph, JZRecipeTools, JZRecipeComponents, JZSceneTools);
