/* Remaining 33 native camera models completing 71/71 of the ae/data.json camera catalog.
   Reference: ae/p_cam.jsx, ae/p_horror*.jsx, ae/p_kinetic*.jsx, ae/p_x2_camtr.jsx, ae/p_x2_horror*.jsx, ae/p_x2_kinetic*.jsx, ae/p_x2_wa*.jsx (read-only). */
(function (N) {
'use strict';
var M = {}, pi = Math.PI, D = pi / 180;
function p(P, k, d) { return N.finite(P[k] == null ? d : P[k], 'camera parameter ' + k); }
function cl(x, a, b) { a = a == null ? 0 : a; b = b == null ? 1 : b; return Math.max(a, Math.min(b, x)); }
function oc(x) { return 1 - Math.pow(1 - cl(x), 3); }
function oe(x) { x = cl(x); return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); }
function ios(x) { return -(Math.cos(pi * cl(x)) - 1) / 2; }
function ioc(x) { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function ob(x, s) { x = cl(x); return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); }
function bel(x) { x = cl(x); return Math.sin(x * pi); }
function lrp(a, b, t) { return a + (b - a) * t; }
function hh(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function rs(sd, f, salt) { return N.random(sd, Math.floor(f * 24), salt) * 2 - 1; }
function vn(x, s) { var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f), a = hh(i * 1.731 + s * 7.117) * 2 - 1, b = hh(i * 1.731 + 1.731 + s * 7.117) * 2 - 1; return a + (b - a) * u; }
function out(x, y, s, sx, sy, r, k) { return [x || 0, y || 0, Math.max(0.01, s * (sx == null ? 1 : sx)), Math.max(0.01, s * (sy == null ? 1 : sy)), r || 0, k || 0]; }
function wordTimes(c) {
  var cut = c.cut, dur = Math.max(0.3, (cut.sourceEnd - cut.origin) / c.comp.fps);
  var words = (cut.source && cut.source.words) || (cut.nodes[0] && cut.nodes[0].text ? cut.nodes[0].text.split(/\s+/) : ['w']);
  var n = Math.max(1, Math.min(8, words.length));
  var ts = [];
  for (var i = 0; i < n; i++) ts.push(i * dur * 0.65 / Math.max(1, n));
  return ts;
}
function ci(ts, t) { var k = 0; for (var i = 0; i < ts.length; i++) if (t >= ts[i]) k = i; return k; }

M.push = function (e, P) {
  return out(0, 0, 1 + 0.03 * p(P, 'a', 1) * e.motion * cl(e.t / Math.max(0.3, e.dur)));
};
M.dutch = function (e, P) {
  var rot = p(P, 'dir', 1) * Math.min(5, p(P, 'a', 3.5) * e.K) * ios(e.t / Math.max(0.3, e.dur * 0.8));
  return out(0, 0, 1 + 0.03 * e.K * e.u, 1, 1, rot);
};
M.whipIn = function (e, P) {
  var sg = (P.dir === 'L' || P.dir === 'U') ? -1 : 1, hor = (P.dir !== 'U' && P.dir !== 'D');
  var r = 1 - oe(cl(e.t / 0.3)), dd = p(P, 'd', 0.2) * e.K * r;
  return out(hor ? sg * e.W * dd : 0, hor ? 0 : sg * e.H * dd * 0.7, 1 + 0.04 * r, 1, 1, 0, hor ? sg * 9 * r * e.K : 0);
};
M.crashZoom = function (e, P) {
  var tc = e.dur < 0.8 ? e.dur * 0.5 : Math.max(e.dur * p(P, 'at', 0.65), e.dur - 0.6);
  var dt = e.t - tc, q = dt < 0 ? 0 : oe(cl(dt / 0.1)), sh = dt < 0 ? 0 : Math.exp(-dt * 6) * q;
  var s = dt < 0 ? 1 - 0.008 * e.K * cl((e.t - tc + 0.25) / 0.25) : 1 + Math.min(0.12, p(P, 'a', 0.1) * e.K) * q;
  return out(rs(e.sd, e.t, 1) * e.W * 0.004 * sh * e.K, rs(e.sd, e.t, 2) * e.H * 0.004 * sh * e.K, s);
};
M.shakeHard = function (e) {
  var amp = Math.exp(-e.t * 4.5) * e.K; if (amp < 0.01) amp = 0;
  return out(rs(e.sd, e.t, 1) * e.W * 0.022 * amp, rs(e.sd, e.t, 2) * e.H * 0.02 * amp, 1 + 0.03 * amp, 1, 1, rs(e.sd, e.t, 3) * 1.6 * amp);
};
M.stepZoom = function (e, P) {
  var n = Math.max(1, Math.round(p(P, 'n', 2))), aa = p(P, 'a', 0.04) * e.K, sz = 1;
  for (var i = 0; i < n; i++) { var d = e.t - e.dur * (i + 1) / (n + 1); if (d >= 0) sz += aa * oe(cl(d / 0.07)); }
  return out(0, 0, Math.min(1.15, sz));
};
M.barrelRoll = function (e, P) {
  var K1 = Math.min(1, e.K), q = cl(e.t / p(P, 'd', 0.5)), r = q >= 1 ? 0 : 1 - ob(q, 1.3);
  return out(0, 0, q >= 1 ? 1 : 1 - 0.12 * K1 * Math.sin(pi * Math.min(1, q * 1.25)), 1, 1, p(P, 'dir', 1) * p(P, 'a', 90) * K1 * r);
};
M.focusIn = function (e, P) {
  var q = oc(cl(e.t / p(P, 'd', 0.65)));
  return out(0, 0, 1 + 0.03 * (1 - q) + 0.012 * e.K * e.u);
};
M.rackFocus = function (e, P) {
  var s0 = Math.max(e.dur * p(P, 'at', 0.65), e.dur - 0.9), dd = Math.max(0.2, e.dur - s0);
  var q = ios(cl((e.t - s0) / dd));
  return out(0, e.H * 0.004 * q, 1.01 - 0.02 * q * e.K);
};
M.earthquake = function (e, P) {
  var per = p(P, 'per', 0.65), K2 = e.K * p(P, 'a', 1), hit = Math.exp(-(((e.t % per) + per) % per) * 7), amp = K2 * (0.14 + hit);
  return out(rs(e.sd, e.t, 11) * e.W * 0.005 * amp, rs(e.sd, e.t, 12) * e.H * 0.014 * amp, 1.02 + 0.012 * hit * K2, 1, 1, rs(e.sd, e.t, 13) * 0.45 * amp);
};
M.snapPan = function (e, P) {
  var d = p(P, 'dir', 1), A = e.W * p(P, 'a', 0.028) * e.K * d;
  if (e.dur < 1.1) return out(A * 0.5 * (1 - 2 * e.u), 0, 1.02);
  var drift = e.W * 0.005 * e.K * d * (e.u - 0.5), dt = e.t - e.dur * p(P, 'at', 0.5), q = ioc(cl(dt / 0.16)), bl = (dt > 0 && dt < 0.16) ? Math.sin(pi * dt / 0.16) : 0;
  return out(A * (1 - 2 * q) - drift, 0, 1.02 + 0.015 * bl, 1, 1, 0, -d * 5 * e.K * bl);
};
M.hrNervous = function (e, P) {
  var f = p(P, 'f', 1), per = 1.6, cyc = Math.floor(e.t / per), sd = e.sd % 97;
  var since = e.t - cyc * per - N.random(sd, cyc, 7) * per * 0.6;
  var go = N.random(sd, cyc, 8) < 0.65 * p(P, 'jerk', 0.8);
  var dk = (since > 0 && go) ? Math.exp(-since * 9) * e.K : 0, t = e.t * f;
  var x = (vn(t * 1.7, sd) * 0.6 + vn(t * 5.3, sd + 1) * 0.4) * e.W * 0.009 * e.K + (N.random(sd, cyc, 1) * 2 - 1) * e.W * 0.025 * dk;
  var y = (vn(t * 1.4, sd + 2) * 0.6 + vn(t * 4.7, sd + 3) * 0.4) * e.H * 0.011 * e.K + Math.sin(e.t * 2.2) * e.H * 0.004 * e.K + (N.random(sd, cyc, 2) * 2 - 1) * e.H * 0.03 * dk;
  var r = vn(e.t * f * 1.1, sd + 4) * 1.2 * e.K + (N.random(sd, cyc, 3) * 2 - 1) * 3 * dk;
  return out(x, y, 1.03, 1, 1, r);
};
M.hrDutchSnap = function (e, P) {
  var q = cl((e.t - e.dur * p(P, 'at', 0.55)) / 0.1), ev = q <= 0 ? 0 : ob(q, 2.5);
  return out(0, -e.H * 0.006 * e.K * ev, 1 + 0.045 * e.K * ios(e.u) + 0.02 * e.K * ev, 1, 1, p(P, 'a', 4) * Math.min(1, e.K) * ev);
};
M.knReadPan = function (e, P) {
  var ts = e.ts, NT = ts.length, A = e.W * p(P, 'a', 0.03) * e.K;
  if (NT < 2) return out(A * (1 - 2 * ios(e.t / Math.max(0.4, e.dur))) * 0.5, 0, 1.035);
  function pz(k) { return A * (1 - 2 * k / (NT - 1)); }
  var k = ci(ts, e.t), ev = k > 0 ? ob(cl((e.t - ts[k]) / 0.2), 1.8) : 1;
  var x = (k > 0 ? lrp(pz(k - 1), pz(k), ev) : pz(0)) * (1 - ioc(cl((e.t - ts[NT - 1] - 0.55) / 0.5)));
  var wh = k > 0 ? bel(cl((e.t - ts[k]) / 0.14)) : 0;
  return out(x, 0, 1.035, 1, 1, 0, -(A < 0 ? -1 : 1) * 2.5 * wh * e.K);
};
M.knTiltKick = function (e, P) {
  var ts = e.ts, NT = ts.length, A = p(P, 'a', 3) * e.K1 * p(P, 'dir', 1);
  function ag(k) { return k >= NT - 1 ? 0 : (k % 2 ? -A : A); }
  var k = ci(ts, e.t), d = e.t - ts[k], fr = k > 0 ? ag(k - 1) : 0, to = ag(k), r = cl(to + (fr - to) * Math.exp(-d * 7) * Math.cos(d * 17), -5, 5);
  return out(0, 0, 1.03 + 0.012 * Math.abs(r) / 3, 1, 1, r);
};
M.knCardFlip = function (e, P) {
  var ts = e.ts, d = p(P, 'dir', 1), q = cl(e.t / 0.42), th = 90 * (1 - ob(q, 1.7)), f = Math.max(0.04, Math.abs(Math.cos(th * D)));
  for (var i = 1; i < ts.length; i++) { var dd = e.t - ts[i]; if (dd > 0 && dd < 0.24) f *= 1 - 0.1 * e.K1 * bel(dd / 0.24); }
  var sn = Math.sin(th * D);
  return P.vert ? out(0, -e.H * 0.02 * sn, 1.01, 1, f) : out(e.W * 0.02 * sn * d, 0, 1.01, f, 1, 0, 7 * sn * d * e.K1 * 0.4);
};
M.knShearKick = function (e, P) {
  var ts = e.ts, KK = Math.min(1.1, e.K), ix = ci(ts, e.t), sn = e.t - ts[ix], w = Math.exp(-sn * 8) * Math.cos(sn * 22), sg = ix % 2 ? 1 : -1;
  return out(e.W * 0.006 * KK * w * sg, 0, 1.02, 1, 1, 0, p(P, 'a', 6.5) * KK * w * sg);
};
M.knJumpCut = function (e, P) {
  var ts = e.ts, NT = ts.length, sd = e.sd + (p(P, 's0', 0) | 0), SS = [1, 1.12, 1.05, 1.14, 1.08, 1.13], k = ci(ts, e.t);
  if (e.t > ts[NT - 1] + 0.5 || NT < 2) return out(0, 0, 1.02);
  var S0 = SS[(k + (sd % 3)) % 6], sg = k % 2 ? 1 : -1;
  return out(sg * (0.5 + 0.5 * N.random(sd, k % 6, 1)) * e.W * 0.04 * e.K1 * (k ? 1 : 0), (N.random(sd, k % 6, 2) * 2 - 1) * e.H * 0.035 * e.K1, 1 + (S0 - 1) * e.K1);
};
M.knRushIn = function (e, P) {
  var q = cl(e.t / 0.34);
  if (q >= 1) return out(0, 0, 1 + 0.01 * cl((e.t - 0.34) / Math.max(0.3, e.dur)));
  var ev = ob(q, 1.9);
  return out(0, 0, lrp(1 - (1 - p(P, 'z', 0.7)) * e.K1, 1, ev), 1, 1, p(P, 'r', 0) * (1 - oc(q)) * e.K1);
};
M.xqFocusHunt = function (e, P) {
  var qd = Math.min(p(P, 'd', 0.9), Math.max(0.4, e.dur * 0.6)), q = cl(e.t / qd), c = Math.cos(q * pi * 1.5), dk = Math.pow(1 - q, 1.2);
  return out(0, 0, 1 + 0.02 * e.K * c * dk + 0.01 * e.K * e.u);
};
M.xqWhipSpring = function (e, P) {
  var a = p(P, 'ang', 0) * D, cx = Math.cos(a), cy = Math.sin(a);
  if (Math.abs(cx) < 1e-6) cx = 0; if (Math.abs(cy) < 1e-6) cy = 0;
  var d = Math.exp(-e.t * 7); if (d < 0.004) d = 0;
  var w = d * Math.cos(e.t * p(P, 'f', 19));
  return out(cx * e.W * 0.045 * e.K1 * w, cy * e.H * 0.04 * e.K1 * w, 1 + 0.02 * e.K1 * d, 1, 1, cy * 1.2 * e.K1 * w, cx * 3.5 * e.K1 * w);
};
M.hzCreepFreeze = function (e, P) {
  var d = Math.max(0.4, e.dur), T0 = d * p(P, 'at', 0.6), u = Math.min(1, e.t / T0), bk = e.t > T0 ? oe((e.t - T0) / 0.14) : 0;
  return out(0, -e.H * 0.01 * e.K * u, 1 + 0.085 * e.K * u - 0.012 * e.K * bk, 1, 1, p(P, 'r', 0) * e.K * u);
};
M.hzGlanceBack = function (e, P) {
  var d = Math.max(0.6, e.dur), dir = p(P, 'dir', 1), hold = Math.min(0.55, d * 0.2), q = e.t - d * p(P, 'at', 0.4);
  var gl = q <= 0 ? 0 : (q < 0.13 ? oe(q / 0.13) : (q < 0.13 + hold ? 1 : 1 - ios((q - 0.13 - hold) / 0.9)));
  return out(dir * e.W * 0.02 * e.K * ios(e.t / d) - dir * e.W * 0.045 * e.K * gl, e.H * 0.004 * e.K * gl, 1.035 + 0.012 * e.K * gl, 1, 1, -dir * 1.3 * e.K * gl);
};
M.hzHeldBreath = function (e, P) {
  var d = Math.max(0.6, e.dur), hs = d * p(P, 'at', 0.4), len = Math.min(p(P, 'len', 1.2), d * 0.4), sd = e.sd % 97;
  var held = e.t >= hs && e.t < hs + len, te = e.t < hs ? e.t : (held ? hs : e.t - len), ph = te * pi * 2 / p(P, 'per', 3.2), br = Math.sin(ph), tr = held ? Math.min(1, (e.t - hs) / 0.3) : 0;
  return out(Math.sin(ph * 0.5) * e.W * 0.004 * e.K + vn(e.t * 45, sd + 1) * e.W * 0.0014 * e.K * tr, -e.H * 0.009 * e.K * br + vn(e.t * 39, sd) * e.H * 0.0016 * e.K * tr, 1.03 + 0.014 * e.K * br, 1, 1, 0.35 * e.K * Math.sin(ph * 0.5 + 1));
};
M.hzColdShiver = function (e, P) {
  var per = p(P, 'per', 2.2), cyc = Math.floor(e.t / per), sd = e.sd % 997;
  var since = e.t - cyc * per - (0.15 + hh(sd + cyc * 7.13) * 0.45) * per;
  var en = (since > 0 && hh(sd + cyc * 3.71 + 5.5) < p(P, 'rate', 0.75)) ? Math.exp(-since * 5.5) * (1 - Math.exp(-since * 45)) * e.K : 0, w = since * pi * 2;
  return out(Math.sin(w * 13) * e.W * 0.0065 * en, Math.sin(w * 17 + 1) * e.H * 0.004 * en, 1.03 + 0.012 * e.K * cl(e.t / Math.max(0.5, e.dur)) - 0.014 * en, 1, 1, Math.sin(w * 11 + 2) * 0.8 * en);
};
M.kzRecoil = function (e, P) {
  var ts = e.ts, a = p(P, 'a', 0), CA = Math.cos(a), SA = Math.sin(a), vx = 0, vy = 0, vr = 0, z = 0;
  for (var q = 0; q < ts.length && q < 6; q++) {
    var d = e.t - ts[q]; if (d < 0) break;
    var g = q === 0 ? 1 : 0.36, sg = q % 2 ? -1 : 1, rr = Math.exp(-d * 7.5) * Math.cos(d * 19);
    vx += sg * CA * g * rr; vy += sg * SA * g * rr; vr += sg * g * Math.exp(-d * 6.5) * Math.cos(d * 15); z += g * Math.exp(-d * 9);
  }
  return out(cl(vx, -1, 1) * e.W * 0.042 * e.K1, cl(vy, -1, 1) * e.H * 0.036 * e.K1, 1.03 + 0.045 * e.K1 * Math.min(1, z), 1, 1, cl(vr, -1.2, 1.2) * p(P, 'r', 3) * e.K1);
};
M.kzKnockback = function (e, P) {
  var aa = 0.07, kb = e.t < aa ? oc(e.t / aa) : Math.exp(-(e.t - aa) * 6) * Math.cos((e.t - aa) * 13.5);
  var drift = 0.02 * cl((e.t - 0.6) / Math.max(0.6, e.dur - 0.6));
  return out(0, 0, 1 - p(P, 'z', 0.07) * e.K1 * kb + drift, 1, 1, p(P, 'r', 0) * e.K1 * kb);
};
M.kzWordNod = function (e, P) {
  var ts = e.ts, v = 0;
  function nod(d) { return d < 0 ? 0 : (d < 0.08 ? oc(d / 0.08) : Math.exp(-(d - 0.08) * 8) * Math.cos((d - 0.08) * 14)); }
  for (var q = 0; q < ts.length && q < 6; q++) v += (q === 0 ? 0.6 : 1) * nod(e.t - ts[q]);
  v = cl(v, -1, 1.2);
  return out(0, (P.up ? -1 : 1) * e.H * p(P, 'a', 0.022) * e.K1 * v, 1.02 + 0.02 * e.K1 * Math.max(0, v), 1, 1 - 0.012 * e.K1 * v);
};
M.kzSkidStop = function (e, P) {
  var T = 0.46, dr = p(P, 'dir', 1), rem = 1 - oc(cl(e.t / T)), d = e.t - T * 0.8, back = d > 0 ? Math.exp(-d * 8) * Math.sin(d * 19) : 0;
  return out(-dr * e.W * p(P, 'a', 0.045) * e.K1 * rem, 0, 1.02, 1 + 0.04 * e.K1 * rem, 1, 0, dr * e.K1 * (7 * Math.pow(rem, 0.7) - 3 * back));
};
M.wzKakejikuView = function (e, P) {
  var T = Math.max(0.6, e.dur * 0.72), ev = ios(cl(e.t / T));
  return out(0, e.H * p(P, 'y', 0.03) * e.K * Math.cos(ev * pi) * (1 - ev), 1 + p(P, 'a', 0.07) * e.K * (1 - ev));
};
M.wzByobuPan = function (e, P) {
  var n = Math.max(1, Math.round(p(P, 'n', 3))), d = p(P, 'dir', 1) < 0 ? -1 : 1;
  var u = cl(e.t / Math.max(0.5, e.dur)) * n, i = Math.min(n - 1, Math.floor(u)), f = ioc(cl((u - i) / 0.55)), pos = (i + f) / n * 2 - 1;
  var j0 = i - 1, f0 = (j0 < 0 || j0 >= n - 1) ? 0 : (j0 % 2 ? 1 : -1), f1 = (i < 0 || i >= n - 1) ? 0 : (i % 2 ? 1 : -1), fc = f0 + (f1 - f0) * f;
  return out(d * pos * e.W * p(P, 'a', 0.028) * e.K, 0, 1.03, 1 - 0.014 * e.K * bel(f), 1, 0, fc * 1.1 * e.K);
};
M.wzOjigi = function (e, P) {
  var T = cl(e.dur * 0.6, 0.5, 1.25), h = p(P, 'h', 0.2), u = e.t / T, b = ioc(u / 0.3) * (1 - ioc((u - (0.3 + h)) / (0.7 - h)));
  return out(0, e.H * p(P, 'a', 0.03) * e.K * b, 1 + 0.008 * e.K * b, 1, 1 - 0.04 * e.K * b);
};
M.xqTripodNudge = function (e, P) {
  var per = Math.max(0.1, p(P, 'per', 1)), sd = e.sd + (p(P, 's0', 0) | 0);
  var kz = Math.min(60, Math.max(1, Math.floor((e.dur - 0.35) / per)));
  var k = Math.floor(e.t / per), ev = ioc(cl((e.t - k * per) / 0.3));
  function ps(idx, salt) {
    if (idx < 0 || idx >= kz) return 0;
    return (N.random(sd, idx, salt) * 2 - 1) / (1 + 0.5 * idx);
  }
  var x0 = ps(k > 0 ? k - 1 : 0, 1), y0 = ps(k > 0 ? k - 1 : 0, 2);
  return out((x0 + (ps(k, 1) - x0) * ev) * e.W * 0.016 * e.K, (y0 + (ps(k, 2) - y0) * ev) * e.H * 0.013 * e.K, 1.02);
};

function environment(c, f, ts) {
  var dur = (c.cut.sourceEnd - c.cut.origin) / c.comp.fps, t = Math.max(0, (f - c.cut.origin) / c.comp.fps);
  var motion = c.assembly.style.fx && c.assembly.style.fx.motion;
  var K = cl((motion == null ? 0.7 : motion) * 1.25, 0, 1.25);
  return { t: t, dur: Math.max(0.01, dur), u: cl(t / Math.max(0.3, dur)), W: c.comp.width, H: c.comp.height,
    motion: motion == null ? 0.7 : motion, K: K, K1: Math.min(1, K), ts: ts, sd: (((c.cut.source && c.cut.source.seed || 0) % 99991) % 997) };
}
function decompose(k) { if (Math.abs(k) < 1e-12) return [0, 1, 1, 0]; var v = 0.5 * Math.atan2(2 * k, -k * k), a = Math.cos(v) + k * Math.sin(v), b = Math.sin(v), s = Math.hypot(a, b); return [Math.atan2(b, a) / D, s, 1 / s, -v / D]; }
function build(name, c) {
  var P = c.preset.params || {}, G = c.graph, cut = c.cut, samples = [], ts = wordTimes(c), f, i;
  if (!c.camOuter || !c.camStretch) throw new Error('Camera rig is missing');
  for (f = cut.start; f < cut.end; f++) {
    var v = M[name](environment(c, f, ts), P);
    v.forEach(function (x) { N.finite(x, 'camera sample'); });
    samples.push(v);
  }
  for (i = 0; i < samples.length; i++) {
    var s = samples[i], fr = cut.start + i, d = decompose(-Math.tan(s[5] * D));
    G.key(c.camOuter, 'position.x', fr, s[0]); G.key(c.camOuter, 'position.y', fr, -s[1]); G.key(c.camOuter, 'rotation', fr, -s[4] + d[0]);
    G.key(c.camStretch, 'scale.x', fr, d[1]); G.key(c.camStretch, 'scale.y', fr, d[2]);
    G.key(c.rig, 'rotation', fr, d[3]); G.key(c.rig, 'scale.x', fr, s[2]); G.key(c.rig, 'scale.y', fr, s[3]);
  }
}
Object.keys(M).forEach(function (name) {
  if (N.get('cam', name)) return;
  N.register('cam', name, { source: 'ae/p_cam.jsx, ae/p_horror*.jsx, ae/p_kinetic*.jsx, ae/p_x2_*.jsx (read-only references)', scope: 'cut-camera',
    build: function (c) { build(name, c); }, differences: ['Camera motion-blur / ghost-pass lag requires hostProfile or is omitted.'] });
});
})(JZNative);
