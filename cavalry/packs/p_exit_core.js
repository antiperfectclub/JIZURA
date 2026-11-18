/* Core exit recipes (40 recipes). Source math: ae/p_exit1.jsx, p_exit2.jsx (read-only). */
(function (N, R, V) {
'use strict';
var E = R.E, cl = R.clamp, mix = R.mix, st = R.stagger, TAU = R.T, PI = Math.PI, rand = N.random;

function reg(k, fn, diffs) {
  N.register('exit', k, {
    source: 'ae/p_exit1.jsx, p_exit2.jsx / exit:' + k,
    scope: 'glyph',
    differences: diffs || [],
    build: function (c) {
      return function (s, g, gs, frame) {
        var env = V.envelope(c, c.node, frame), p = env.pout;
        var e = { W: c.comp.width, H: c.comp.height, size: c.node.size, seed: c.node.seed == null ? ((c.cut.source || {}).seed || 1) : c.node.seed,
          vertical: !!c.node.vertical, M: R.env(c, frame).M, step: Math.floor(env.t * 24 + 1e-6) };
        var o = fn(p, g, gs, e);
        if (!o) return;
        if (o.hide) { s.a = 0; return; }
        s.dx += o.dx || 0; s.dy += o.dy || 0; s.rot += o.rot || 0;
        var sc = o.s == null ? 1 : o.s;
        s.sx *= sc * (o.sx == null ? 1 : o.sx); s.sy *= sc * (o.sy == null ? 1 : o.sy);
        s.a *= o.a == null ? 1 : o.a;
        if (o.clipPolygon) s.clipPolygon = o.clipPolygon;
        if (o.blur != null) s.blur = (s.blur || 0) + o.blur;
      };
    }
  });
}

function lr(g, gs) { return gs.length > 1 ? g.i / (gs.length - 1) : 0; }
function ctr(g, gs) { return gs.length > 1 ? Math.abs(g.i - (gs.length - 1) / 2) / ((gs.length - 1) / 2) : 0; }
function sgn(g, gs) { return gs.length > 1 ? Math.sign(g.i - (gs.length - 1) / 2) || 1 : 1; }
function padBox(gs, pad) { var b = V.bounds(gs); return { x0: b.x0 - pad, y0: b.y0 - pad, x1: b.x1 + pad, y1: b.y1 + pad }; }

reg('backspace', function (p, g, gs) {
  var idx = gs.length - 1 - g.i;
  return p > 0 && idx < Math.floor(p * (gs.length + 0.999)) ? { hide: true } : null;
});
reg('balloonOff', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.4), k = E.inCubic(q);
  return { dy: -k * e.H * 0.35, s: 1 + k * 0.4, a: 1 - k };
});
reg('blindsClose', function (p, g, gs) {
  var q = st(p, (g.i % 3) / 2, 0.3), v = 1 - E.inCubic(q);
  return { sy: Math.max(0.02, v), a: v };
});
reg('bounceOff', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.4), k = E.inQuad(q);
  return { dy: k * e.H * 0.3, rot: sgn(g, gs) * k * 25, a: 1 - k };
});
reg('burn', function (p, g, gs, e) {
  var q = st(p, rand(e.seed, g.i, 41), 0.5), k = E.inCubic(q);
  return { dy: -k * e.size * 0.8, s: 1 + k * 0.25, blur: k * e.size * 0.2, a: 1 - k };
});
reg('checkerOut', function (p, g, gs) {
  var q = st(p, (g.i % 2) * 0.5, 0.3), k = E.inCubic(q);
  return { s: Math.max(0.02, 1 - k), a: 1 - k };
});
reg('clapShut', function (p, g, gs, e) {
  var k = E.inCubic(p);
  return { sy: Math.max(0.02, 1 - k), a: 1 - k * k };
});
reg('clockOut', function (p, g, gs) {
  var q = st(p, lr(g, gs), 0.55), k = E.inCubic(q);
  return { rot: -k * 90, s: Math.max(0.05, 1 - k * 0.6), a: 1 - k };
});
reg('collapse', function (p, g, gs, e) {
  var k = E.inCubic(p);
  return { dy: k * e.size * 0.6, sy: Math.max(0.02, 1 - k * 0.95), sx: 1 + k * 0.3, a: 1 - k };
});
reg('diagWipeOut', function (p, g, gs, e) {
  var b = padBox(gs, e.size * 0.4), x = mix(b.x0, b.x1, E.inCubic(p));
  return { clipPolygon: [[x + 120, b.y0 - 200], [b.x1 + 200, b.y0 - 200], [b.x1 + 200, b.y1 + 200], [x - 120, b.y1 + 200]], a: 1 - p * 0.2 };
});
reg('dissolve', function (p, g, gs, e) {
  var q = st(p, rand(e.seed, g.i, 42), 0.65);
  return { a: 1 - E.inQuad(q) };
});
reg('dominoOut', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.55), k = E.inCubic(q);
  return { rot: k * 75, dx: k * e.size * 0.6, a: 1 - k };
});
reg('drift', function (p, g, gs, e) {
  var k = E.inCubic(p);
  return { dx: k * e.W * 0.14, dy: -k * e.size * 0.5, a: 1 - k };
});
reg('echoOut', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.45), k = E.inCubic(q);
  return { s: 1 + k * 0.35, dx: k * e.size * 0.8, a: 1 - k };
});
reg('explode', function (p, g, gs, e) {
  var q = st(p, rand(e.seed, g.i, 43), 0.35), k = E.inCubic(q);
  var ang = rand(e.seed, g.i, 44) * TAU, d = e.W * (0.25 + 0.35 * rand(e.seed, g.i, 45));
  return { dx: Math.cos(ang) * d * k, dy: Math.sin(ang) * d * k, rot: (rand(e.seed, g.i, 46) * 2 - 1) * 360 * k, s: 1 + k * 0.6, a: 1 - q * q };
});
reg('fall', function (p, g, gs, e) {
  var q = st(p, rand(e.seed, g.i, 47), 0.4), k = q * q;
  return { dy: k * e.H * 0.45, rot: (rand(e.seed, g.i, 48) * 2 - 1) * 45 * k, a: 1 - q };
});
reg('fanClose', function (p, g, gs, e) {
  var k = E.inCubic(p);
  return { rot: -sgn(g, gs) * ctr(g, gs) * 32 * k, dx: -g.x * k * 0.4, a: 1 - k };
});
reg('flipOutX', function (p, g, gs) {
  var q = st(p, lr(g, gs), 0.35), v = Math.max(0.02, 1 - E.inCubic(q));
  return { sy: v, a: v };
});
reg('flipOutY', function (p, g, gs) {
  var q = st(p, lr(g, gs), 0.35), v = Math.max(0.02, 1 - E.inCubic(q));
  return { sx: v, a: v };
});
reg('foldOut', function (p, g, gs) {
  var q = st(p, ctr(g, gs), 0.4), v = Math.max(0.03, 1 - E.inCubic(q));
  return { sy: v, dy: (1 - v) * g.h * 0.5, a: v };
});
reg('glitch', function (p, g, gs, e) {
  if (p <= 0) return null;
  if (p >= 1) return { hide: true };
  var show = rand(e.seed, e.step, g.i, 51) > p * 1.15;
  return show ? { dx: (rand(e.seed, e.step, g.i, 52) * 2 - 1) * p * e.size, a: 1 - p * 0.5 } : { hide: true };
});
reg('gravity', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.35), k = q * q * q;
  return { dy: k * e.H * 0.55, rot: sgn(g, gs) * 35 * k, a: 1 - q * q };
});
reg('hingeOut', function (p, g, gs, e) {
  var k = E.inCubic(p);
  return { rot: k * 75, dy: k * e.H * 0.35, a: 1 - k };
});
reg('irisClose', function (p, g, gs) {
  var q = st(p, 1 - ctr(g, gs), 0.5), v = Math.max(0.02, 1 - E.inCubic(q));
  return { s: v, a: v };
});
reg('melt', function (p, g, gs, e) {
  var q = st(p, rand(e.seed, g.i, 55), 0.45), k = E.inQuad(q);
  return { dy: k * e.size * 1.6, sy: 1 + k * 0.9, sx: Math.max(0.15, 1 - k * 0.4), a: 1 - k };
});
reg('peelOff', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.5), k = E.inCubic(q);
  return { dx: k * e.size * 1.5, dy: -k * e.size * 0.9, rot: k * 35, a: 1 - k };
});
reg('popOut', function (p) {
  var v = p < 0.25 ? 1 + (p / 0.25) * 0.25 : Math.max(0.02, 1.25 - E.inCubic((p - 0.25) / 0.75) * 1.25);
  return { s: v, a: 1 - E.inCubic(p) };
});
reg('riseOut', function (p, g, gs, e) {
  var k = E.inCubic(p);
  return { dy: -k * e.size * 1.6, a: 1 - k };
});
reg('rollOff', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.45), k = E.inCubic(q);
  return { dx: k * e.W * 0.25, rot: k * 360, a: 1 - k };
});
reg('sinkMask', function (p, g, gs, e) {
  var b = padBox(gs, e.size * 0.3), y = mix(b.y0, b.y1, E.inCubic(p));
  return { dy: E.inCubic(p) * e.size * 0.45, clipPolygon: V.polygon(b.x0 - 200, y, b.x1 + 200, b.y1 + 200), a: 1 - p * 0.2 };
});
reg('slashOut', function (p, g, gs, e) {
  var k = E.inCubic(p), sg = g.i % 2 ? 1 : -1;
  return { dx: sg * k * e.W * 0.2, dy: -sg * k * e.H * 0.12, a: 1 - k };
});
reg('slice', function (p, g, gs, e) {
  var k = E.inCubic(p), sg = g.i % 2 ? 1 : -1;
  return { dx: sg * k * e.W * 0.22, a: 1 - k };
});
reg('slideOutL', function (p, g, gs, e) { var k = E.inCubic(p); return { dx: -k * e.W * 0.25, a: 1 - k }; });
reg('slideOutR', function (p, g, gs, e) { var k = E.inCubic(p); return { dx:  k * e.W * 0.25, a: 1 - k }; });
reg('spinOut', function (p, g, gs, e) {
  var k = E.inCubic(p);
  return { rot: k * 320, s: Math.max(0.05, 1 - k * 0.8), a: 1 - k };
});
reg('splitApart', function (p, g, gs, e) {
  var k = E.inCubic(p);
  return { dx: sgn(g, gs) * k * e.W * 0.18, a: 1 - k };
});
reg('squash', function (p) {
  var k = E.inCubic(p);
  return { sx: 1 + k * 0.8, sy: Math.max(0.02, 1 - k * 0.96), a: 1 - k };
});
reg('stretch', function (p) {
  var k = E.inCubic(p);
  return { sx: 1 + k * 1.5, sy: Math.max(0.05, 1 - k * 0.5), a: 1 - k };
});
reg('sweepCover', function (p, g, gs, e) {
  var b = padBox(gs, e.size * 0.3), x = mix(b.x0, b.x1, E.inCubic(p));
  return { clipPolygon: V.polygon(x, b.y0 - 200, b.x1 + 200, b.y1 + 200), a: 1 - p * 0.15 };
});
reg('twist', function (p) {
  var k = E.inCubic(p);
  return { rot: k * 180, sx: Math.max(0.02, 1 - k), sy: Math.max(0.02, 1 - k * 0.6), a: 1 - k };
});
})(JZNative, JZRecipeTools, JZRecipeComponents);
