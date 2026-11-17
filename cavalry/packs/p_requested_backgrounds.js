/* Requested background graphics. Both are real geometry, not a name swap.
 * Source: jizura_core.jsx / bg (read-only). */
(function (N, G, C, R, V) {
'use strict';
var E = R.E;

function register(key, fn, differences) {
  N.register('bg', key, { source: 'jizura_core.jsx / bg:' + key, scope: 'cut', build: fn, differences: differences || [] });
}

register('xpRingDots', function (c) {
  var P = c.preset.params || {};
  var W = c.comp.width, H = c.comp.height, U = Math.min(W, H);
  var rings = Math.min(9, Math.ceil(Math.hypot(W, H) / 2 / (U * 0.135)));
  var k = P.k == null ? 0.15 : P.k;
  var cy = P.cy == null ? 0.5 : P.cy;
  var speed = P.spd == null ? 6 : P.spd;
  for (var r = 0; r < rings; r++) {
    (function (ring) {
      var radius = U * (0.16 + 0.135 * ring), count = 8 + ring * 8, path = [];
      for (var i = 0; i < count; i++) {
        var a = i * Math.PI * 2 / count;
        var size = U * (i % 4 === 0 ? 0.01 : 0.0055);
        path = path.concat(G.ellipse(Math.cos(a) * radius, -Math.sin(a) * radius, size, size));
      }
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Ring dots ' + ring, c.parent, path, { fill: c.sc.fg, alpha: k });
      V.animate(c, id, function (e) {
        var enter = E.outCubic(e.t / 0.9), s = 0.8 + 0.2 * enter;
        return { 'position.y': H * (0.5 - cy), 'scale.x': s, 'scale.y': s,
          rotation: -e.t * speed / (1 + ring * 0.6) * (ring % 2 ? -1 : 1), alpha: k * enter };
      });
    })(r);
  }
}, ['Ring count, dot count and per-ring speed follow the source; the pattern is editable geometry.']);

register('skyline', function (c) {
  var P = c.preset.params || {};
  var W = c.comp.width, H = c.comp.height, U = Math.min(W, H);
  var seed = P.seed == null ? 1 : P.seed;
  var amount = P.k == null ? 0.09 : P.k;
  var direction = P.dir == null ? 1 : P.dir;
  var windowChance = P.win == null ? 0.28 : P.win;
  var duration = (c.cut.sourceEnd - c.cut.origin) / c.comp.fps;
  var period = Math.max(W, H) * 1.5;
  var settings = [[0.6, 0.12, 0.34, 0.012], [1.1, 0.06, 0.20, 0.030]];

  settings.forEach(function (config, layer) {
    var speed = U * config[3] * direction;
    var lo = Math.min(0, duration * speed), hi = Math.max(0, duration * speed);
    var city = [], windows = [], x = 0, index = 0;
    function rnd(a, b, salt) { return a + (b - a) * N.random(seed, layer, index, salt); }
    while (x < period && index < 80) {
      var w = U * rnd(0.05, 0.12, 1), gap = U * rnd(0, 0.012, 2);
      var h = H * rnd(config[1], config[2], 3) * (W < H ? 0.75 : 1);
      var tier = rnd(0, 1, 4) < 0.35, antenna = rnd(0, 1, 5) < 0.25;
      var first = Math.floor((lo - x - w) / period), last = Math.ceil((hi + W - x) / period);
      for (var repeat = first; repeat <= last; repeat++) {
        var px = x + repeat * period - W / 2, top = H / 2 - h;
        city = city.concat(G.rect(px, -H / 2, w, h));
        if (tier) city = city.concat(G.rect(px + w * 0.2, -top, w * 0.6, h * 0.12));
        if (antenna) {
          var aw = Math.max(1.5, U * 0.002);
          city = city.concat(G.rect(px + w * 0.5 - aw / 2, -top + (tier ? h * 0.12 : 0), aw, h * 0.2));
        }
        var cw = U * 0.022, ch = U * 0.03;
        var nx = Math.floor((w - cw * 0.4) / cw), ny = Math.min(30, Math.floor((h - ch) / ch));
        for (var wy = 0; wy < ny; wy++) {
          for (var wx = 0; wx < nx; wx++) {
            if (N.random(seed, layer * 97 + index, wx, wy) > windowChance) continue;
            windows = windows.concat(G.rect(px + (w - nx * cw) / 2 + wx * cw + cw * 0.3,
              -top - ch * 0.7 - wy * ch - ch * 0.45, cw * 0.4, ch * 0.45));
          }
        }
      }
      x += w + gap; index++;
    }
    var buildingId = C.shape(c.graph, c.cut, c.cut.id + ' / Skyline buildings ' + layer, c.parent, city,
      { fill: c.sc.fg, alpha: amount * config[0] });
    var windowId = windows.length ? C.shape(c.graph, c.cut, c.cut.id + ' / Skyline windows ' + layer, c.parent,
      windows, { fill: c.sc.accent2 || c.sc.accent, alpha: layer ? 0.8 : 0.5 }) : null;
    [buildingId, windowId].filter(Boolean).forEach(function (id) {
      V.animate(c, id, function (e) {
        var enter = E.outCubic(e.t / 0.9);
        return { 'position.x': -e.t * speed, 'position.y': -(1 - enter) * H * 0.25 };
      });
    });
  });
}, ['Buildings and windows keep transparency instead of baking the scheme background into fills.',
  'The feathered horizon glow remains outside this implementation.',
  'Window selection uses the native seeded hash.']);
})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents);
