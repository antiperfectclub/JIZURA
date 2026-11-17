/* Native camera models. Numeric models from ae/p_cam.jsx, ae/p_x2_camtr.jsx and ae/p_x2_typoB.jsx (read-only references).
   The assembly builds a three-node rig per cut: Rotation (position, rotation) > Stretch (scale) > Camera (rotation, scale).
   Keys are sampled per frame into the graph; nothing here calls the host. */
(function (N) {
'use strict';
var M = {}, pi = Math.PI, D = pi / 180;
function p(P, k, d) { return N.finite(P[k] || d, 'camera parameter ' + k); }
function cl(x, a, b) { a = a == null ? 0 : a; b = b == null ? 1 : b; return Math.max(a, Math.min(b, x)); }
function oc(x) { return 1 - Math.pow(1 - cl(x), 3); }
function ic(x) { x = cl(x); return x * x * x; }
function oe(x) { x = cl(x); return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); }
function ios(x) { return -(Math.cos(pi * cl(x)) - 1) / 2; }
function ioc(x) { x = cl(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function ob(x, s) { x = cl(x); return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); }
function hh(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function vn(x, s) { var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f), a = hh(i * 1.731 + s * 7.117) * 2 - 1, b = hh(i * 1.731 + 1.731 + s * 7.117) * 2 - 1; return a + (b - a) * u; }
function out(x, y, s, sx, sy, r, k) { return [x || 0, y || 0, s * (sx == null ? 1 : sx), s * (sy == null ? 1 : sy), r || 0, k || 0]; }
function model(k, fn) { M[k] = fn; }
model('pullOut', function (e, P) { return out(0, 0, 1 + p(P, 'a', .07) * e.K * (1 - oc(e.u))); });
function pan(e, P, axis, sg) { var d = sg * ((e.u * .6 + ios(e.u) * .4) - .5) * 2 * (axis === 'x' ? e.W : e.H) * p(P, 'a', axis === 'x' ? .022 : .025) * e.K; return out(axis === 'x' ? d : 0, axis === 'y' ? d : 0, 1.02); }
model('panL', function (e, P) { return pan(e, P, 'x', 1); }); model('panR', function (e, P) { return pan(e, P, 'x', -1); }); model('tiltUp', function (e, P) { return pan(e, P, 'y', 1); });
model('handheld', function (e, P) { var t = e.t * p(P, 'f', 1), s = e.sd, K = e.K; return out((vn(t * 1.1, s) * .7 + vn(t * 2.9, s + 1) * .3) * e.W * .007 * K, (vn(t * .9, s + 2) * .7 + vn(t * 3.3, s + 3) * .3) * e.H * .009 * K, 1.012, 1, 1, vn(t * .8, s + 4) * .7 * K); });
model('beatPunch', function (e, P) { var k = Math.exp(-(((e.t % .5) + .5) % .5) * 9); return out(0, -e.H * .004 * e.K * k, 1 + p(P, 'a', .035) * e.K * k); });
model('bounce', function (e, P) { var d = Math.exp(-e.t * 5.5); return out(0, -e.H * .012 * e.K * d * Math.sin(e.t * 16), 1 - p(P, 'a', .07) * e.K * d * Math.cos(e.t * 16)); });
model('roll', function (e, P) { return out(0, 0, 1.025, 1, 1, p(P, 'dir', 1) * (e.u - .5) * p(P, 'a', 3) * e.K); });
model('driftDiag', function (e, P) { var u = ios(e.u) * .5 + e.u * .5; return out((u - .5) * e.W * .035 * e.K * p(P, 'dx', 1), (u - .5) * e.H * .03 * e.K * p(P, 'dy', 1), 1.02 + .025 * e.K * u); });
model('dollyIn', function (e, P) { var q = ic(e.u); return out(0, -e.H * .008 * e.K * q, 1 + Math.min(.14, p(P, 'a', .1) * e.K) * q); });
model('orbitDrift', function (e, P) { var d = p(P, 'dir', 1), th = p(P, 'a0', 0) + d * e.t * p(P, 'sp', 1.3), r = oc(e.t / .7); return out(Math.cos(th) * e.W * .016 * e.K * r, Math.sin(th) * e.H * .02 * e.K * r, 1.02, 1, 1, Math.sin(th) * .9 * e.K * r * d); });
model('pendulumSway', function (e, P) { var damp = .75 + .25 * Math.exp(-e.t * .6), L = e.W * .62, phi = p(P, 'a', 2.2) * e.K * p(P, 'side', 1) * Math.cos(e.t / p(P, 'per', 2.4) * 2 * pi) * damp * D; return out(-L * Math.sin(phi), -L * (1 - Math.cos(phi)), 1.02, 1, 1, phi / D); });
model('floatNoise', function (e, P) { var t = e.t * p(P, 'f', 1), s = e.sd + 7; return out(vn(t * .6, s) * e.W * .02 * e.K, (vn(t * .5 + 5, s + 1) * .7 + .3 * Math.sin(t * 1.3)) * e.H * .024 * e.K, 1.025 + .012 * Math.sin(t * .8), 1, 1, vn(t * .3 + 9, s + 2) * 1.3 * e.K); });
model('vertigo', function (e, P) { var z = ios(e.u), w = Math.sin(e.t * 2.3), d = p(P, 'dir', 1); return out(0, 0, 1 + p(P, 'a', .06) * e.K * z, 1 + .03 * e.K * z * w, 1 - .026 * e.K * z * w, .8 * e.K * z * Math.sin(e.t * 1.1 + 1) * d, 2.2 * e.K * z * Math.sin(e.t * 1.7) * d); });
model('tiltDown', function (e, P) { var q = oc(e.u); return out(0, e.H * p(P, 'a', .028) * e.K * (1.2 - 1.6 * q), 1.035 - .02 * q); });
model('spiralIn', function (e, P) { var d = p(P, 'dir', 1), v = oc(e.t / p(P, 'd', 1.1)), r = 1 - v, th = p(P, 'a0', 0) + d * v * 2 * pi * .8; return out(Math.cos(th) * e.W * .03 * e.K * r, Math.sin(th) * e.H * .035 * e.K * r, 1 - .08 * e.K * r + .015 * e.K * e.u, 1, 1, -d * 7 * e.K * r); });
model('jelly', function (e, P) { var w = Math.exp(-e.t * 5) * Math.cos(e.t * p(P, 'f', 21)), a = p(P, 'a', .055) * e.K; return out(0, e.H * .008 * e.K * w, 1.01, 1 + a * w, 1 - a * w * .9); });
model('xqArcSweep', function (e, P) { var v = (e.u * .5 + ios(e.u) * .5) * 2 - 1, d = p(P, 'dir', 1), s = p(P, 'v', 1); return out(d * v * e.W * p(P, 'a', .023) * e.K, -s * e.H * .026 * e.K * (1 - v * v - .45), 1.03, 1, 1, d * s * v * 1.5 * e.K); });
model('xqWindUp', function (e, P) { var t1 = Math.max(.001, Math.min(.45, e.dur * .25)), t2 = Math.max(.3, e.dur * .5), bk = ios(e.t / t1), ps = ioc((e.t - t1) / t2), b = p(P, 'b', .022) * e.K, a = p(P, 'a', .065) * e.K; return out(0, -e.H * .006 * e.K * ps, 1 - b * bk + (b + a) * ps + .006 * e.K * e.u); });
model('xqBeatBreath', function (e, P) { var w = .5 - .5 * Math.cos(e.t / p(P, 'per', 1.7) * 2 * pi); return out(0, -e.H * .004 * e.K * w, 1.012 + p(P, 'a', .036) * e.K * w); });
model('xqWalkCam', function (e, P) { var ph = e.t * p(P, 'f', 1.7) * pi, s = p(P, 'side', 1); return out(s * Math.sin(ph) * e.W * .006 * e.K + vn(e.t * .7, e.sd + 3) * e.W * .003 * e.K, (.5 - Math.abs(Math.sin(ph))) * e.H * .011 * e.K, 1.02, 1, 1, s * Math.sin(ph + .6) * .45 * e.K); });
model('xqLongLens', function (e, P) { var t = e.t * p(P, 'f', 1), s = e.sd + 21; return out((vn(t * 11, s) * .6 + vn(t * 17, s + 1) * .4) * e.W * .0026 * e.K + vn(t * .35, s + 2) * e.W * .009 * e.K, (vn(t * 12, s + 3) * .6 + vn(t * 19, s + 4) * .4) * e.H * .0032 * e.K, 1.045 + .006 * Math.sin(t * .9)); });
model('xqStopMotion', function (e, P) { var fq = p(P, 'fps', 6), fr = Math.floor(e.t * fq + .000001), u = cl(fr / fq / e.headDur); function rr(k) { return hh(fr * 1.618 + k * 9.73 + e.sd * 3.17) * 2 - 1; } return out(rr(1) * e.W * .0022 * e.K, rr(2) * e.H * .0022 * e.K, 1 + p(P, 'a', .075) * e.K * u, 1, 1, rr(3) * .22 * e.K); });
model('xqLevelOut', function (e, P) { var q = e.t / cl(e.dur * .5, .5, 1.4), r = Math.exp(-q * 3.2) * Math.cos(q * 4.4); return out(0, 0, 1.035 - .012 * cl(q), 1, 1, cl(p(P, 'dir', 1) * p(P, 'a', 3.5) * e.K * r, -5, 5)); });
model('xqSquashRelax', function (e, P) { var a = p(P, 'sg', 1) * p(P, 'a', .08) * Math.min(1, e.K) * (1 - oc(e.t / cl(e.dur * .6, .5, 1.6))); return out(0, 0, 1.005, P.ax === 'x' ? 1 + a : 1 - a * .35, P.ax === 'x' ? 1 - a * .35 : 1 + a); });
model('xqDriftTurn', function (e, P) { return out(p(P, 'dx', 1) * e.W * p(P, 'a', .027) * e.K * (Math.sin(pi * e.u) - .55), p(P, 'dy', 1) * e.H * .014 * e.K * (e.u * 2 - 1), 1.025); });
model('xqCraneUp', function (e, P) { var r = 1 - oc(e.u); return out(0, (P.up === false ? -1 : 1) * e.H * .036 * e.K * (r - .2), 1.01 + .055 * e.K * r, 1, 1 - .035 * e.K * r, p(P, 'dir', 1) * 1.1 * e.K * r); });
model('xqTruckAround', function (e, P) { var k = (e.u * .5 + ios(e.u) * .5) * 2 - 1, d = p(P, 'dir', 1); return out(d * e.W * .022 * e.K * k, 0, 1.03, 1 - p(P, 'a', .05) * e.K * k * k, 1, 0, d * 1.3 * e.K * k); });
model('xqHeartbeat', function (e, P) { var per = p(P, 'per', 1.1), d2 = Math.min(.3, per * .27), t = e.t % per, k = Math.exp(-t * 10) + (t > d2 ? .65 * Math.exp(-(t - d2) * 10) : 0); return out(0, 0, 1.01 + p(P, 'a', .028) * e.K * k, 1, 1 + .006 * e.K * k); });
model('xqLeafFall', function (e, P) { var d = p(P, 'dir', 1), q = cl(e.t / cl(e.dur * .65, .6, 1.9)), r = 1 - oc(q), ph = q * 2 * pi * p(P, 'n', 1.5), K = Math.min(1, e.K); return out(d * e.W * .03 * K * r * Math.sin(ph), -e.H * .042 * K * r, 1.01, 1, 1, d * 2.6 * K * r * Math.cos(ph)); });
model('xqLoudZoom', function (e, P) { var n = .5 + .5 * Math.sin(e.t * 2.1) * Math.sin(e.t * .7 + 1); return out(0, -e.H * .004 * e.K * n, 1.005 + p(P, 'a', .047) * e.K * n); });
model('xqPushPull', function (e, P) { var at = cl(p(P, 'at', .5), .05, .95), v = e.u < at ? e.u / at * .5 : .5 + (e.u - at) / (1 - at) * .5, b = .5 - .5 * Math.cos(2 * pi * v); return out(0, -e.H * .006 * e.K * b, 1 + p(P, 'a', .075) * e.K * b); });
model('xqFindFrame', function (e, P) { var T = cl(e.dur * .45, .45, 1.1), r = 1 - ob((e.t - T * .15) / (T * .85), 1.15), K = Math.min(1, e.K); return out(p(P, 'cx', 1) * e.W * .028 * K * r, (P.cy || 0) * e.H * .03 * K * r, 1 + .06 * K * Math.max(-.15, r)); });
model('xqTickRoll', function (e, P) { var dur = Math.max(.3, e.dur), n = Math.max(2, Math.min(p(P, 'n', 5), Math.floor(dur / .3))), per = dur / n, k = Math.min(n - 1, Math.floor(e.t / per)), A = p(P, 'dir', 1) * p(P, 'a', 2.4) * e.K, v = ob((e.t - k * per) / .14, 2.2); function ps(i) { return -A + 2 * A * i / (n - 1); } return out(0, 0, 1.03, 1, 1, k > 0 ? ps(k - 1) + (ps(k) - ps(k - 1)) * v : ps(0)); });
model('tzTabStep', function (e, P) { var n = p(P, 'n', 2), gap = Math.min(.6, Math.max(.2, e.dur * .6 / n)), dn = 0; for (var k = 0; k < n; k++) dn += ioc((e.t - .18 - k * gap) / .16); var d = -p(P, 'dir', 1) * p(P, 'a', .016) * (n - dn) * e.K; return out(P.ax ? 0 : d * e.W, P.ax ? d * e.H : 0, 1.02); });
model('tzItalicSet', function (e, P) { var d = p(P, 'dir', 1), tt = Math.min(.55, Math.max(.25, e.dur * .4)), v = oe(e.t / tt); return out(0, 0, 1.02, 1, 1, 0, -d * p(P, 'a', 6.5) * e.K * (1 - v) + d * .9 * e.K * e.u * v); });
model('tzMeasureZoom', function (e, P) { var a = p(P, 'a', .05) * e.K * (1 - ios(e.u)); return out(0, 0, 1.015, P.wide === false ? 1 - a * .7 : 1 + a); });
model('tzGridStep', function (e, P) { var per = p(P, 'per', .5), C = [[-1, -1], [1, -1], [1, 1], [-1, 1]], k = Math.floor(e.t / per), v = ioc((e.t - k * per) / .14), a = p(P, 'a', .012) * e.K; function at(i) { return C[(((P.s0 | 0) + p(P, 'cw', 1) * i) % 4 + 4) % 4]; } var A = at(Math.max(0, k - 1)), B = at(k); return out((A[0] + (B[0] - A[0]) * v) * e.W * a, (A[1] + (B[1] - A[1]) * v) * e.H * a * .9, 1.03); });
function environment(c, f) { var dur = (c.cut.sourceEnd - c.cut.origin) / c.comp.fps, t = Math.max(0, (f - c.cut.origin) / c.comp.fps), motion = c.assembly.style.fx && c.assembly.style.fx.motion;
  return { t: t, dur: Math.max(.01, dur), headDur: Math.max(.3, dur), u: cl(t / Math.max(.3, dur)), W: c.comp.width, H: c.comp.height, K: cl((motion == null ? .7 : motion) * 1.25, 0, 1.25), sd: (((c.cut.source && c.cut.source.seed || 0) % 99991) % 997) }; }
/* shear k as R(u) * diag(s, 1/s) * R(-v): only rotation and scale attributes are needed */
function decompose(k) { if (Math.abs(k) < 1e-12) return [0, 1, 1, 0]; var v = .5 * Math.atan2(2 * k, -k * k), a = Math.cos(v) + k * Math.sin(v), b = Math.sin(v), s = Math.hypot(a, b); return [Math.atan2(b, a) / D, s, 1 / s, -v / D]; }
function build(name, c) {
  var P = c.preset.params || {}, G = c.graph, cut = c.cut, samples = [], f, i;
  if (!c.camOuter || !c.camStretch) throw new Error('Camera rig is missing');
  Object.keys(P).forEach(function (k) { var v = P[k]; if (typeof v === 'number') { N.finite(v, 'camera parameter ' + k); if (Math.abs(v) > 10000) throw new Error('Camera parameter exceeds safety limit: ' + k); } else if (typeof v !== 'boolean' && typeof v !== 'string') throw new Error('Invalid camera parameter ' + k); });
  for (f = cut.start; f < cut.end; f++) { var v = M[name](environment(c, f), P); v.forEach(function (x) { N.finite(x, 'camera sample'); }); if (v[2] <= 0 || v[3] <= 0) throw new Error('Invalid camera scale'); samples.push(v); }
  for (i = 0; i < samples.length; i++) {
    var s = samples[i], fr = cut.start + i, d = decompose(-Math.tan(s[5] * D));
    G.key(c.camOuter, 'position.x', fr, s[0]); G.key(c.camOuter, 'position.y', fr, -s[1]); G.key(c.camOuter, 'rotation', fr, -s[4] + d[0]);
    G.key(c.camStretch, 'scale.x', fr, d[1]); G.key(c.camStretch, 'scale.y', fr, d[2]);
    G.key(c.rig, 'rotation', fr, d[3]); G.key(c.rig, 'scale.x', fr, s[2]); G.key(c.rig, 'scale.y', fr, s[3]);
  }
}
Object.keys(M).forEach(function (name) {
  N.register('cam', name, { source: 'ae/p_cam.jsx, ae/p_x2_camtr.jsx, ae/p_x2_typoB.jsx numeric models (read-only references)', scope: 'cut-camera',
    build: function (c) { build(name, c); }, differences: ['Ghost-pass lag is not implemented.'] });
});
})(JZNative);
