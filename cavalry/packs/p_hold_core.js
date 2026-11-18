/* Core hold recipes (33 recipes). Source math: ae/p_hold / src/05_anim.js (read-only). */
(function (N, R) {
'use strict';
var TAU = R.T, PI = Math.PI, rand = N.random;

function reg(k, fn) {
  R.motion('hold', k, 'src/05_anim.js / hold:' + k, fn);
}
function mk(e) { return Math.max(0, Math.min(1.6, e.M / 0.7)); }

reg('glitchtick', function (a, g, gs, e) {
  var f = Math.floor(e.t * 24 + 1e-6);
  if (rand(e.seed, Math.floor(f / 3), 1) > 0.25) return null;
  var amp = e.size * 0.08 * a * mk(e);
  return { dx: (rand(e.seed, f, g.i, 2) * 2 - 1) * amp, dy: (rand(e.seed, f, g.i, 3) * 2 - 1) * amp * 0.3 };
});
reg('float', function (a, g, gs, e) {
  return { dy: Math.sin(e.t * 2.1 + g.i * 0.35) * e.size * 0.055 * a * mk(e), rot: Math.cos(e.t * 1.4 + g.i * 0.2) * 1.8 * a * mk(e) };
});
reg('sway', function (a, g, gs, e) {
  return { rot: Math.sin(e.t * 1.8 + g.i * 0.15) * 3.5 * a * mk(e), dx: Math.cos(e.t * 1.8) * e.size * 0.03 * a * mk(e) };
});
reg('pulse', function (a, g, gs, e) {
  var k = 1 + 0.06 * Math.sin(e.t * TAU * 1.2) * a * mk(e);
  return { s: k };
});
reg('shimmer', function (a, g, gs, e) {
  var v = 0.8 + 0.2 * Math.sin(e.t * 9 + g.i * 1.3);
  return { a: 1 - (1 - v) * a };
});
reg('colorRun', function (a, g, gs, e) {
  var ph = ((e.t * 2.2 - g.i * 0.12) % 1 + 1) % 1;
  return { s: 1 + 0.05 * Math.sin(ph * TAU) * a * mk(e) };
});
reg('rotateSlow', function (a, g, gs, e) {
  return { rot: Math.sin(e.t * 0.9 + g.i * 0.2) * 4.5 * a * mk(e) };
});
reg('trackBreathe', function (a, g, gs, e) {
  var row = R.rows(gs, g), ix = row.indexOf(g) - (row.length - 1) / 2;
  var tr = 0.045 * Math.sin(e.t * TAU * 0.45) * a * mk(e) * e.size;
  return e.node.vertical ? { dy: ix * tr } : { dx: ix * tr };
});
reg('skewWobble', function (a, g, gs, e) {
  return { rot: Math.sin(e.t * 3.2 + g.i * 0.3) * 4 * a * mk(e), sx: 1 + 0.04 * Math.cos(e.t * 3.2) * a * mk(e) };
});
reg('beatHop', function (a, g, gs, e) {
  var b = e.beat(0.5), hop = Math.exp(-b.since * 9) * Math.sin(Math.min(1, b.since * 6) * PI);
  return { dy: -hop * e.size * 0.14 * a * mk(e), s: 1 + hop * 0.06 * a * mk(e) };
});
reg('hWave', function (a, g, gs, e) {
  return { dx: Math.sin(e.t * 5 + g.i * 0.7) * e.size * 0.05 * a * mk(e) };
});
reg('heartbeat', function (a, g, gs, e) {
  var per = 1.1, t = ((e.t % per) + per) % per, d2 = 0.28;
  var k = Math.exp(-t * 10) + (t > d2 ? 0.65 * Math.exp(-(t - d2) * 10) : 0);
  return { s: 1 + 0.07 * k * a * mk(e) };
});
reg('orbitSmall', function (a, g, gs, e) {
  var th = e.t * 2.4 + g.i * 0.5, r = e.size * 0.04 * a * mk(e);
  return { dx: Math.cos(th) * r, dy: Math.sin(th) * r };
});
reg('jelly', function (a, g, gs, e) {
  var w = Math.sin(e.t * 7 + g.i * 0.5) * 0.05 * a * mk(e);
  return { sx: 1 + w, sy: 1 - w };
});
reg('scanBand', function (a, g, gs, e) {
  var band = Math.exp(-Math.pow((((e.t * 0.8) % 1) - (gs.length > 1 ? g.i / (gs.length - 1) : 0.5)) * 5, 2));
  return { s: 1 + band * 0.08 * a * mk(e), dy: -band * e.size * 0.04 * a * mk(e) };
});
reg('noiseDrift', function (a, g, gs, e) {
  var amp = e.size * 0.05 * a * mk(e);
  return { dx: R.noise(e.t * 1.4, e.seed + g.i) * amp, dy: R.noise(e.t * 1.2 + 5, e.seed + g.i + 17) * amp };
});
reg('tilt', function (a, g, gs, e) {
  return { rot: (g.i % 2 ? 1 : -1) * (2.5 + 1.5 * Math.sin(e.t * 2)) * a * mk(e) };
});
reg('zoomSlow', function (a, g, gs, e) {
  return { s: 1 + 0.06 * e.u * a * mk(e) };
});
reg('stretchPulse', function (a, g, gs, e) {
  var w = 0.5 - 0.5 * Math.cos(e.t * 3.5);
  return { sx: 1 + 0.09 * w * a * mk(e), sy: 1 - 0.03 * w * a * mk(e) };
});
reg('glitchJump', function (a, g, gs, e) {
  var q = Math.floor(e.t * 6);
  if (rand(e.seed, q, g.i, 1) > 0.2) return null;
  return { dx: (rand(e.seed, q, g.i, 2) * 2 - 1) * e.size * 0.12 * a * mk(e), dy: (rand(e.seed, q, g.i, 3) * 2 - 1) * e.size * 0.06 * a * mk(e) };
});
reg('echoTrail', function (a, g, gs, e) {
  var w = Math.sin(e.t * 3.5 - g.i * 0.45);
  return { dy: w * e.size * 0.05 * a * mk(e), a: 1 - (1 - (0.85 + 0.15 * w)) * a * 0.5 };
});
reg('glowFlicker', function (a, g, gs, e) {
  var f = Math.floor(e.t * 18);
  var v = 0.78 + 0.22 * rand(e.seed, f, g.i, 7);
  return { a: 1 - (1 - v) * a };
});
reg('windGust', function (a, g, gs, e) {
  var gust = Math.max(0, Math.sin(e.t * 1.4 - g.i * 0.18));
  return { dx: gust * e.size * 0.09 * a * mk(e), rot: gust * 5 * a * mk(e) };
});
reg('dangle', function (a, g, gs, e) {
  var ang = Math.sin(e.t * 2.6 + g.i * 0.4) * 5 * a * mk(e);
  return { rot: ang, dy: Math.abs(ang) * e.size * 0.005 };
});
reg('eqBounce', function (a, g, gs, e) {
  var bar = Math.abs(Math.sin(e.t * 5.2 + g.i * 0.9)) * a * mk(e);
  return { sy: 1 + bar * 0.14, dy: -bar * e.size * 0.04 };
});
reg('flashBox', function (a, g, gs, e) {
  var hit = Math.floor(e.t * 4) % 3 === g.i % 3 ? 1 : 0;
  return { s: 1 + hit * 0.06 * a * mk(e) };
});
reg('glintSweep', function (a, g, gs, e) {
  var ph = ((e.t * 0.9) % 1 + 1) % 1, u = gs.length > 1 ? g.i / (gs.length - 1) : 0.5;
  var k = Math.exp(-Math.pow((ph - u) * 7, 2));
  return { s: 1 + k * 0.08 * a * mk(e) };
});
reg('flipSwap', function (a, g, gs, e) {
  var ph = Math.abs(Math.cos(e.t * 2.2 + g.i * 0.3));
  return { sx: Math.max(0.15, 1 - (1 - ph) * 0.35 * a * mk(e)) };
});
reg('shadowSway', function (a, g, gs, e) {
  return { dx: Math.sin(e.t * 1.7) * e.size * 0.04 * a * mk(e), dy: Math.cos(e.t * 1.7) * e.size * 0.025 * a * mk(e) };
});
reg('magnetJiggle', function (a, g, gs, e) {
  var f = Math.floor(e.t * 14);
  return { dx: (rand(e.seed, f, g.i, 9) * 2 - 1) * e.size * 0.03 * a * mk(e), rot: (rand(e.seed, f, g.i, 10) * 2 - 1) * 3 * a * mk(e) };
});
reg('typeRattle', function (a, g, gs, e) {
  var f = Math.floor(e.t * 16);
  return { dy: (rand(e.seed, f, g.i, 11) * 2 - 1) * e.size * 0.035 * a * mk(e) };
});
reg('focusRack', function (a, g, gs, e) {
  var w = 0.5 - 0.5 * Math.cos(e.t * 1.6);
  return { s: 1 + w * 0.04 * a * mk(e) };
});
reg('pluckString', function (a, g, gs, e) {
  var b = e.beat(0.75), d = Math.exp(-b.since * 8) * Math.sin(b.since * 32);
  return { dy: d * e.size * 0.09 * a * mk(e) };
});
})(JZNative, JZRecipeTools);
