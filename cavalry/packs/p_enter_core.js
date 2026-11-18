/* Core enter recipes (56 recipes). Source math: src/05_anim.js & ae/p_enter1.jsx / p_enter2.jsx (read-only). */
(function (N, R, V) {
'use strict';
var E = R.E, cl = R.clamp, mix = R.mix, st = R.stagger, TAU = R.T, PI = Math.PI, rand = N.random;

function reg(k, fn, diffs) {
  N.register('enter', k, {
    source: 'ae/p_enter1.jsx, p_enter2.jsx / enter:' + k,
    scope: 'glyph',
    differences: diffs || [],
    build: function (c) {
      return function (s, g, gs, frame) {
        var env = V.envelope(c, c.node, frame), p = env.pin;
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
        if (o.ch != null) s.ch = o.ch;
        if (o.color) s.color = o.color;
      };
    }
  });
}

function lr(g, gs) { return gs.length > 1 ? g.i / (gs.length - 1) : 0; }
function ctr(g, gs) { return gs.length > 1 ? Math.abs(g.i - (gs.length - 1) / 2) / ((gs.length - 1) / 2) : 0; }
function sgn(g, gs) { return gs.length > 1 ? Math.sign(g.i - (gs.length - 1) / 2) || 1 : 1; }
function padBox(gs, pad) { var b = V.bounds(gs); return { x0: b.x0 - pad, y0: b.y0 - pad, x1: b.x1 + pad, y1: b.y1 + pad, cx: b.cx, cy: b.cy, w: b.w + 2 * pad, h: b.h + 2 * pad }; }

reg('assemble', function (p, g, gs, e) {
  var q = st(p, rand(e.seed, g.i, 1), 0.45), k = 1 - E.outExpo(q);
  var ang = rand(e.seed, g.i, 2) * TAU, d = e.size * (2 + 2.5 * rand(e.seed, g.i, 3));
  return q <= 0 ? { hide: true } : { dx: Math.cos(ang) * d * k, dy: Math.sin(ang) * d * k, rot: (rand(e.seed, g.i, 4) * 2 - 1) * 140 * k, s: mix(0.5, 1, E.outCubic(q)), a: cl(q * 3) };
});
reg('backlight', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.35), v = E.outCubic(q);
  return { s: mix(1.35, 1, v), a: cl(q * 2.5), blur: (1 - v) * e.size * 0.25 };
});
reg('blinds', function (p, g, gs, e) {
  var q = st(p, (g.i % 3) / 2, 0.3), v = E.outCubic(q);
  return { sy: Math.max(0.02, v), dy: (1 - v) * g.h * 0.4, a: cl(q * 4) };
});
reg('bounceBall', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.4), b = 1 - E.outBack(q, 2.1);
  return q <= 0 ? { hide: true } : { dy: -Math.abs(b) * e.size * 1.8 - (1 - q) * e.size * 1.2, sy: 1 + Math.max(0, b) * 0.35, a: cl(q * 5) };
});
reg('bounceBig', function (p, g, gs, e) {
  var q = st(p, ctr(g, gs), 0.3), k = E.outBack(q, 2.6);
  return q <= 0 ? { hide: true } : { s: mix(0.15, 1, k), a: cl(q * 4) };
});
reg('clockWipe', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.55);
  return { rot: (1 - E.outCubic(q)) * 90, s: mix(0.4, 1, E.outCubic(q)), a: cl(q * 3) };
});
reg('crtOn', function (p, g, gs, e) {
  if (p <= 0) return { hide: true };
  if (p < 0.45) { var u = E.outExpo(p / 0.45); return { sx: u, sy: 0.04, a: 1 }; }
  var v = E.outExpo((p - 0.45) / 0.55);
  return { sx: 1, sy: mix(0.04, 1, v), a: 1 };
});
reg('cursorSweep', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.6);
  return q <= 0 ? { hide: true } : { dx: (1 - E.outExpo(q)) * e.size * 0.5, a: cl(q * 6) };
});
reg('diagWipe', function (p, g, gs, e) {
  var b = padBox(gs, e.size * 0.4), x = mix(b.x0, b.x1, E.outCubic(p));
  return { clipPolygon: [[b.x0 - 200, b.y0 - 200], [x + 120, b.y0 - 200], [x - 120, b.y1 + 200], [b.x0 - 200, b.y1 + 200]], a: cl(p * 8) };
});
reg('domino', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.55), v = E.outBack(q, 1.5);
  return q <= 0 ? { hide: true } : { rot: (1 - v) * -75, dx: (1 - v) * -e.size * 0.6, a: cl(q * 5) };
});
reg('dropMask', function (p, g, gs, e) {
  var b = padBox(gs, e.size * 0.3), y = mix(b.y0, b.y1, E.outCubic(p));
  return { dy: (1 - E.outCubic(p)) * -e.size * 0.6, clipPolygon: V.polygon(b.x0 - 200, b.y0 - 200, b.x1 + 200, y), a: cl(p * 6) };
});
reg('fadeStagger', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.6);
  return { a: E.outCubic(q) };
});
reg('fanOpen', function (p, g, gs, e) {
  var q = E.outExpo(p), ang = sgn(g, gs) * ctr(g, gs) * 32 * (1 - q);
  return { rot: ang, dx: -g.x * (1 - q) * 0.4, dy: (1 - q) * e.size * 0.5, a: cl(p * 4) };
});
reg('flipX', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.35), v = E.outCubic(q);
  return { sy: Math.max(0.02, v), a: cl(q * 4) };
});
reg('flipY', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.35), v = E.outCubic(q);
  return { sx: Math.max(0.02, v), a: cl(q * 4) };
});
reg('fold', function (p, g, gs, e) {
  var q = st(p, ctr(g, gs), 0.4), v = E.outExpo(q);
  return { sy: Math.max(0.03, v), dy: (1 - v) * -g.h * 0.5, a: cl(q * 4) };
});
reg('glitchIn', function (p, g, gs, e) {
  if (p >= 1) return null;
  var jitter = (1 - p) * e.size * 0.9;
  var show = rand(e.seed, e.step, g.i, 9) < p * 1.3;
  return show ? { dx: (rand(e.seed, e.step, g.i, 10) * 2 - 1) * jitter, dy: (rand(e.seed, e.step, g.i, 11) * 2 - 1) * jitter * 0.35, a: 1 } : { hide: true };
});
reg('hatchFill', function (p, g, gs, e) {
  var q = st(p, (g.i % 2 ? lr(g, gs) : 1 - lr(g, gs)), 0.5), v = E.outExpo(q);
  return { sx: mix(0.1, 1, v), sy: mix(1.4, 1, v), a: cl(q * 5) };
});
reg('invertBox', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.45);
  return q <= 0 ? { hide: true } : { s: mix(1.25, 1, E.outExpo(q)), a: cl(q * 5) };
});
reg('iris', function (p, g, gs, e) {
  var q = st(p, ctr(g, gs), 0.5), v = E.outExpo(q);
  return { s: mix(0.05, 1, v), a: cl(q * 4) };
});
reg('pendulum', function (p, g, gs, e) {
  var d = Math.exp(-p * 5) * Math.cos(p * PI * 3.5);
  return { rot: d * 36 * (1 - p), dy: -Math.abs(d) * e.size * 0.4, a: cl(p * 5) };
});
reg('printRegister', function (p, g, gs, e) {
  var q = E.outExpo(p), sg = g.i % 2 ? 1 : -1;
  return { dx: sg * (1 - q) * e.size * 0.8, dy: -sg * (1 - q) * e.size * 0.35, a: cl(p * 4) };
});
reg('quarters', function (p, g, gs, e) {
  var q = st(p, (g.i % 4) / 3, 0.4), v = E.outExpo(q);
  return { dx: (g.i % 2 ? 1 : -1) * (1 - v) * e.size * 1.4, dy: (g.i % 4 < 2 ? -1 : 1) * (1 - v) * e.size * 0.9, a: cl(q * 4) };
});
reg('randomOrder', function (p, g, gs, e) {
  var q = st(p, rand(e.seed, g.i, 21), 0.55);
  return q <= 0 ? { hide: true } : { s: mix(0.6, 1, E.outBack(q, 1.4)), a: cl(q * 3) };
});
reg('resolve', function (p, g, gs, e) {
  var q = st(p, rand(e.seed, g.i, 22), 0.5), v = E.outCubic(q);
  return { blur: (1 - v) * e.size * 0.22, s: mix(1.2, 1, v), a: v };
});
reg('ripple', function (p, g, gs, e) {
  var q = st(p, ctr(g, gs), 0.5), w = Math.sin(q * PI * 2.5) * (1 - q);
  return { dy: w * e.size * 0.45, s: 1 + w * 0.15, a: cl(q * 4) };
});
reg('riseMask', function (p, g, gs, e) {
  var b = padBox(gs, e.size * 0.3), y = mix(b.y1, b.y0, E.outCubic(p));
  return { dy: (1 - E.outCubic(p)) * e.size * 0.55, clipPolygon: V.polygon(b.x0 - 200, y, b.x1 + 200, b.y1 + 200), a: cl(p * 6) };
});
reg('rollIn', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.45), k = 1 - E.outExpo(q);
  return q <= 0 ? { hide: true } : { dx: -k * e.W * 0.25, rot: -k * 360, a: cl(q * 4) };
});
reg('rubber', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.35), w = Math.exp(-q * 5.5) * Math.cos(q * PI * 4);
  return { sx: 1 + w * 0.45, sy: 1 - w * 0.32, a: cl(q * 5) };
});
reg('scramble', function (p, g, gs, e) {
  if (p >= 0.95) return null;
  var pool = 'アイウエオカキクケコ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var q = st(p, lr(g, gs), 0.45);
  if (q <= 0) return { hide: true };
  if (q < 0.85) { var idx = Math.floor(rand(e.seed, e.step, g.i, 31) * pool.length); return { ch: pool.charAt(idx), a: 0.9 }; }
  return null;
});
reg('shuffle', function (p, g, gs, e) {
  var q = E.outExpo(p), target = gs[Math.floor(rand(e.seed, g.i, 33) * gs.length)] || g;
  return { dx: (target.x - g.x) * (1 - q), dy: (target.y - g.y) * (1 - q), a: cl(p * 4) };
});
reg('shutter', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.4), v = E.outExpo(q);
  return { sx: mix(0.05, 1, v), sy: mix(1.3, 1, v), a: cl(q * 5) };
});
reg('skewIn', function (p, g, gs, e) {
  var k = 1 - E.outExpo(p);
  return { dx: -k * e.W * 0.2, rot: k * 14, sx: 1 + k * 0.25, a: cl(p * 4) };
});
reg('slice', function (p, g, gs, e) {
  var k = 1 - E.outExpo(p), sg = g.i % 2 ? 1 : -1;
  return { dx: sg * k * e.W * 0.18, a: cl(p * 4) };
});
reg('slideL', function (p, g, gs, e) { return { dx: -e.W * 0.22 * (1 - E.outExpo(p)), a: cl(p * 4) }; });
reg('slideR', function (p, g, gs, e) { return { dx:  e.W * 0.22 * (1 - E.outExpo(p)), a: cl(p * 4) }; });
reg('slingshot', function (p, g, gs, e) {
  var v = p < 0.28 ? -E.inQuad(p / 0.28) * 0.25 : 1 - E.outBack((p - 0.28) / 0.72, 2.2);
  return { dx: -v * e.W * 0.16, sx: 1 + Math.abs(v) * 0.3, a: cl(p * 5) };
});
reg('snapRail', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.35), k = 1 - E.outExpo(q);
  return { dx: k * e.size * 2.5, a: cl(q * 6) };
});
reg('spiralIn', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.45), k = 1 - E.outCubic(q), ang = k * TAU * 1.2 + g.i * 0.6;
  return { dx: Math.cos(ang) * e.size * 2 * k, dy: Math.sin(ang) * e.size * 2 * k, rot: k * 180, s: mix(0.3, 1, E.outCubic(q)), a: cl(q * 3) };
});
reg('splitFlap', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.5), n = 4, f = Math.floor(q * n) / n;
  return { sy: Math.max(0.05, Math.abs(Math.cos((1 - f) * PI))), a: cl(q * 5) };
});
reg('splitJoin', function (p, g, gs, e) {
  var k = 1 - E.outExpo(p), sg = sgn(g, gs);
  return { dx: sg * k * e.W * 0.16, a: cl(p * 4) };
});
reg('springIn', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.35), k = E.outBack(q, 2.4);
  return q <= 0 ? { hide: true } : { s: mix(0.2, 1, k), dy: (1 - k) * e.size * 0.5, a: cl(q * 4) };
});
reg('squashDrop', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.35), k = 1 - E.outCubic(q), w = Math.exp(-q * 6) * Math.sin(q * PI * 4);
  return { dy: -k * e.size * 2.2, sx: 1 + w * 0.3, sy: 1 - w * 0.25, a: cl(q * 5) };
});
reg('stamp', function (p, g, gs, e) {
  var v = E.outExpo(p);
  return { s: mix(2.4, 1, v), a: cl(p * 6) };
});
reg('stretch', function (p, g, gs, e) {
  var k = 1 - E.outExpo(p);
  return { sx: 1 + k * 1.4, sy: Math.max(0.1, 1 - k * 0.45), a: cl(p * 4) };
});
reg('tiltUp', function (p, g, gs, e) {
  var k = 1 - E.outExpo(p);
  return { dy: k * e.size * 1.4, rot: k * 12, a: cl(p * 4) };
});
reg('trackIn', function (p, g, gs, e) {
  var k = 1 - E.outExpo(p), rank = g.i - (gs.length - 1) / 2;
  return e.vertical ? { dy: rank * k * e.size * 0.8, a: cl(p * 3) } : { dx: rank * k * e.size * 0.8, a: cl(p * 3) };
});
reg('trackOut', function (p, g, gs, e) {
  var k = 1 - E.outExpo(p), rank = g.i - (gs.length - 1) / 2;
  return e.vertical ? { dy: -rank * k * e.size * 0.5, a: cl(p * 3) } : { dx: -rank * k * e.size * 0.5, a: cl(p * 3) };
});
reg('unroll', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.55), v = E.outCubic(q);
  return { rot: (1 - v) * -90, sy: mix(0.2, 1, v), a: cl(q * 4) };
});
reg('vSlice', function (p, g, gs, e) {
  var k = 1 - E.outExpo(p), sg = g.i % 2 ? 1 : -1;
  return { dy: sg * k * e.H * 0.16, a: cl(p * 4) };
});
reg('waveIn', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.5), k = 1 - E.outCubic(q);
  return { dy: Math.sin(q * PI * 2 + g.i * 0.5) * e.size * 0.7 * k, a: cl(q * 3) };
});
reg('whip', function (p, g, gs, e) {
  var k = 1 - E.outExpo(p);
  return { dx: -k * e.W * 0.35, sx: 1 + k * 0.6, a: cl(p * 5) };
});
reg('windBlown', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.5), k = 1 - E.outCubic(q);
  return { dx: k * e.W * 0.2, dy: -k * e.size * 0.8, rot: k * 25, a: cl(q * 3) };
});
reg('zipper', function (p, g, gs, e) {
  var q = st(p, lr(g, gs), 0.5), k = 1 - E.outExpo(q), sg = g.i % 2 ? 1 : -1;
  return { dy: sg * k * e.size * 1.4, a: cl(q * 5) };
});
reg('zoomAlt', function (p, g, gs, e) {
  var q = st(p, (g.i % 2) * 0.5, 0.3), v = E.outExpo(q);
  return { s: g.i % 2 ? mix(1.6, 1, v) : mix(0.5, 1, v), a: cl(q * 4) };
});
reg('zoomOut', function (p, g, gs, e) {
  var v = E.outExpo(p);
  return { s: mix(2.2, 1, v), a: cl(p * 4) };
});
})(JZNative, JZRecipeTools, JZRecipeComponents);
