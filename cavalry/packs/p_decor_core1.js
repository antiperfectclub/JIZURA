/* JIZURA Cavalry Pack: decor core1 (42 recipes from src/11p_decor.js) */
(function (N, G, C, R, V, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, TAU = H.TAU, DEG = H.DEG;

function reg(key, layerType, build) {
  N.register('decor', key, {
    source: 'src/11p_decor.js DEF.' + key,
    scope: 'cut',
    build: function (c) {
      var n0 = c.graph.layers.length;
      var res = build(c);
      if (layerType === 'back') H.placeBackFrom(c, n0);
      return res;
    },
    differences: ['Native Cavalry editable shape/text geometry following src/11p_decor.js.']
  });
}

function inE(env, d, delay, ease) { return (ease || E.outExpo)(cl((env.lt - (delay || 0)) / (d || 0.4))); }
function outE(env) { return 1 - E.inCubic(env.pOut); }
function FS(c) { return Math.max(12, 16 * H.decU(c)); }
function dark(c) { return H.dark(c.sc.bg); }
function pad2(n, k) { return String(Math.max(0, Math.floor(n))).padStart(k || 2, '0'); }
function wrap(v, lo, span) { return lo + (((v - lo) % span) + span) % span; }
function textW(str, size, track) { return Array.from(String(str)).length * size * (0.62 + (track || 0)); }

function star5(cx, cy, Rr, r, rot) {
  rot = rot == null ? -90 : rot;
  var o = [];
  for (var i = 0; i < 10; i++) {
    var a = (rot + i * 36) * DEG, q = i % 2 ? r : Rr;
    o.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]);
  }
  return o;
}

function glintPts(cx, cy, Rr, w, rot) {
  rot = rot || 0;
  var o = [];
  for (var i = 0; i < 8; i++) {
    var a = rot * DEG + i * Math.PI / 4, q = i % 2 ? w : Rr;
    o.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]);
  }
  var out = [];
  for (var j = 0; j < o.length; j++) {
    var nx = o[(j + 1) % o.length];
    out.push(o[j]);
    out.push([mix((o[j][0] + nx[0]) / 2, cx, 0.35), mix((o[j][1] + nx[1]) / 2, cy, 0.35)]);
  }
  return out;
}

function heartPts(cx, cy, s) {
  var o = [];
  for (var i = 0; i < 28; i++) {
    var t = i / 28 * TAU;
    var x = 16 * Math.pow(Math.sin(t), 3);
    var y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    o.push([cx + x * s / 17, cy - y * s / 17]);
  }
  return o;
}

function superR(a, b, pw, th) {
  var c = Math.abs(Math.cos(th)), s = Math.abs(Math.sin(th));
  return 1 / Math.pow(Math.pow(c / Math.max(1, a), pw) + Math.pow(s / Math.max(1, b), pw), 1 / pw);
}

var PETAL = (function () {
  var h = [[0, -0.5], [0.16, -0.38], [0.3, -0.18], [0.36, 0.04], [0.32, 0.24], [0.22, 0.42], [0.1, 0.5], [0, 0.4]];
  var r = [];
  for (var i = h.length - 2; i >= 1; i--) r.push([-h[i][0], h[i][1]]);
  return h.concat(r);
})();

/* 1. crosshair */
reg('crosshair', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var bb = H.decBB(c), u = H.decU(c), m = H.decMG(c);
  var cx = bb.cx, cy = bb.cy, gx = 26 * u + bb.w * 0.02, gy = 22 * u + bb.h * 0.1;
  var v = (H.p(P, 'v', 0) | 0) % 3, lw = Math.max(1, 1.3 * u);
  var arms = [
    [[cx, bb.y0 - gy], [cx, m * 0.5]],
    [[cx, bb.y1 + gy], [cx, Hh - m * 0.5]],
    [[bb.x0 - gx, cy], [m * 0.5, cy]],
    [[bb.x1 + gx, cy], [W - m * 0.5, cy]]
  ];
  var count = 0;
  arms.forEach(function (pair, i) {
    var a = pair[0], b = pair[1], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    if (len < 40 * u) return;
    var ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    var spA = H.toScene(c, a[0], a[1]);
    var localArm = [['M', 0, 0], ['L', dx, -dy]];
    var aid = C.shape(c.graph, c.cut, c.cut.id + ' / Crosshair arm ' + i, c.parent, localArm, { stroke: sc.sub, width: lw, alpha: 0.75 });
    c.graph.byId[aid].attrs.position = spA;
    C.sample(c.graph, aid, c.cut.start, c.cut.end, function (f) {
      var env = R.env(c, f), pOut = E.inCubic(env.pOut), ee = E.outExpo(cl((env.lt - i * 0.06) / 0.6));
      var frac = Math.max(0.001, ee - pOut);
      return {
        'position.x': spA[0] + dx * pOut,
        'position.y': spA[1] - dy * pOut,
        'scale.x': ux !== 0 ? frac : 1,
        'scale.y': uy !== 0 ? frac : 1,
        alpha: ee > pOut ? 0.75 * outE(env) : 0
      };
    });
    if (v !== 2 || i < 2) {
      var st = 10 * u, nt = Math.min(20, Math.floor(len * 0.5 / st)), ticks = [];
      for (var t = 1; t <= nt; t++) {
        var d = t * st, tl = (t % 5 === 0 ? 8 : 3.5) * u;
        ticks.push([a[0] + ux * d - nx * tl, a[1] + uy * d - ny * tl, a[0] + ux * d + nx * tl, a[1] + uy * d + ny * tl]);
      }
      if (ticks.length) {
        var tid = C.shape(c.graph, c.cut, c.cut.id + ' / Crosshair ticks ' + i, c.parent, H.segCmds(c, ticks), { stroke: sc.fg, width: lw, alpha: 0.8 });
        C.sample(c.graph, tid, c.cut.start, c.cut.end, function (f) {
          var env = R.env(c, f), ee = E.outExpo(cl((env.lt - i * 0.06) / 0.6));
          return { alpha: 0.8 * ee * outE(env) };
        });
      }
    }
    var cap = 9 * u;
    var cid = H.line(c, 'Crosshair cap ' + i, [[a[0] - nx * cap, a[1] - ny * cap], [a[0] + nx * cap, a[1] + ny * cap]], i < 2 || P.accent ? sc.accent : sc.fg, 2.4 * u, 1);
    C.sample(c.graph, cid, c.cut.start, c.cut.end, function (f) {
      var env = R.env(c, f), ee = E.outExpo(cl((env.lt - i * 0.06) / 0.6));
      return { alpha: E.inCubic(env.pOut) < 0.02 ? ee * outE(env) : 0 };
    });
    if (v === 1) {
      var oid = H.circle(c, 'Crosshair end ' + i, b[0], b[1], 3 * u, 3 * u, { stroke: sc.fg, width: lw, alpha: 1 });
      C.sample(c.graph, oid, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), ee = E.outExpo(cl((env.lt - i * 0.06) / 0.6));
        return { alpha: ee * outE(env) };
      });
    }
    count++;
  });
  if (v !== 2) {
    var fs = FS(c) * 0.85;
    H.addText(c, 'Crosshair Y0', 'Y ' + pad2(bb.y0, 4), cx + 12 * u, bb.y0 - gy - fs * 0.9, fs, { role: 'mono', align: 'left', color: sc.sub }, function (env) { return { alpha: inE(env, 0.3, 0.35) * outE(env) }; });
    H.addText(c, 'Crosshair Y1', 'Y ' + pad2(bb.y1, 4), cx + 12 * u, bb.y1 + gy + fs * 0.9, fs, { role: 'mono', align: 'left', color: sc.sub }, function (env) { return { alpha: inE(env, 0.3, 0.35) * outE(env) }; });
    H.addText(c, 'Crosshair X', 'X ' + pad2(cx, 4), cx - 12 * u, Hh - m * 0.5 - fs * 0.6, fs, { role: 'mono', align: 'right', color: sc.fg }, function (env) { return { alpha: inE(env, 0.3, 0.35) * outE(env) }; });
  }
  return { arms: count };
});

/* 2. reticle */
reg('reticle', 'front', function (c) {
  var P = c.preset.params || {}, sc = c.sc, bb = H.decBB(c), u = H.decU(c);
  var Rr = cl(Math.min(bb.w, bb.h) * 0.3, 40 * u, 72 * u), LW = FS(c) * 3.6;
  var sp = H.nearBB(c, bb, Rr * 2.8 + LW, Rr * 2.6, P, 18 * u);
  var lLeft = sp.cx > c.comp.width / 2, cx = lLeft ? sp.x + LW + Rr * 1.4 : sp.x + Rr * 1.4, cy = sp.cy;
  var scPt = H.toScene(c, cx, cy), lw = Math.max(1.2, 1.6 * u), rotOff = H.p(P, 'r', 0.3) * 90;
  var rig = c.graph.add('null', c.cut.id + ' / Reticle rig', c.parent, c.cut.start, c.cut.end, { position: scPt });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), lock = E.outExpo(cl(env.lt / 0.6));
    var s = (2.1 - 1.1 * lock) * (1 + 0.25 * E.inCubic(env.pOut));
    return { 'scale.x': s, 'scale.y': s, rotation: -((1 - lock) * 140 + env.ltb * 16 + rotOff) };
  });
  for (var k = 0; k < 4; k++) {
    var pts = H.arcPts(0, 0, Rr, k * 90 - 28, k * 90 + 28, 12).map(function (pt, idx) { return [idx ? 'L' : 'M', pt[0], -pt[1]]; });
    var aid = C.shape(c.graph, c.cut, c.cut.id + ' / Reticle arc ' + k, rig, pts, { stroke: sc.fg, width: lw, alpha: 1 });
    C.sample(c.graph, aid, c.cut.start, c.cut.end, function (f) {
      var env = R.env(c, f), lock = E.outExpo(cl(env.lt / 0.6));
      var on = lock > 0.97 || env.step % 2 === 0;
      return { alpha: cl(env.lt / 0.12) * outE(env) * (on ? 1 : 0.5) };
    });
  }
  var ringPts = H.arcPts(0, 0, Rr * 0.62, 0, 360, 28).map(function (pt, idx) { return [idx ? 'L' : 'M', pt[0], -pt[1]]; });
  var ringId = C.shape(c.graph, c.cut, c.cut.id + ' / Reticle inner', rig, ringPts, { stroke: sc.sub, width: Math.max(1, u), alpha: 0.6 });
  C.sample(c.graph, ringId, c.cut.start, c.cut.end, function (f) { var env = R.env(c, f); return { alpha: 0.6 * cl(env.lt / 0.12) * outE(env) }; });
  var tkCmds = [];
  for (var j = 0; j < 4; j++) {
    var an = j * 90 * DEG;
    tkCmds.push(['M', Math.cos(an) * Rr * 0.74, -Math.sin(an) * Rr * 0.74], ['L', Math.cos(an) * Rr * 1.16, -Math.sin(an) * Rr * 1.16]);
  }
  var tkId = C.shape(c.graph, c.cut, c.cut.id + ' / Reticle ticks', rig, tkCmds, { stroke: sc.fg, width: Math.max(1, u), alpha: 0.9 });
  C.sample(c.graph, tkId, c.cut.start, c.cut.end, function (f) { var env = R.env(c, f); return { alpha: 0.9 * cl(env.lt / 0.12) * outE(env) }; });
  var triRig = c.graph.add('null', c.cut.id + ' / Reticle tris', c.parent, c.cut.start, c.cut.end, { position: scPt });
  C.sample(c.graph, triRig, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), lock = E.outExpo(cl(env.lt / 0.6));
    var s = (2.1 - 1.1 * lock) * (1 + 0.25 * E.inCubic(env.pOut));
    return { 'scale.x': s, 'scale.y': s, rotation: -(-env.ltb * 30 + rotOff * 0.66) };
  });
  var triCmds = [];
  for (var t = 0; t < 3; t++) {
    var ta = t * 120 * DEG, r2 = Rr * 1.32, px = Math.cos(ta) * r2, py = -Math.sin(ta) * r2, sz = 5 * u;
    var ix = -Math.cos(ta), iy = Math.sin(ta), nx = -iy, ny = ix;
    triCmds.push(['M', px + ix * sz, py + iy * sz], ['L', px - ix * sz * 0.6 + nx * sz * 0.8, py - iy * sz * 0.6 + ny * sz * 0.8], ['L', px - ix * sz * 0.6 - nx * sz * 0.8, py - iy * sz * 0.6 - ny * sz * 0.8], ['Z']);
  }
  var triId = C.shape(c.graph, c.cut, c.cut.id + ' / Reticle arrows', triRig, triCmds, { fill: sc.accent, alpha: 1 });
  C.sample(c.graph, triId, c.cut.start, c.cut.end, function (f) { var env = R.env(c, f); return { alpha: cl(env.lt / 0.12) * outE(env) }; });
  var dotId = H.circle(c, 'Reticle core', cx, cy, 2.6 * u, 2.6 * u, { fill: sc.accent, alpha: 1 });
  C.sample(c.graph, dotId, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), lock = E.outExpo(cl(env.lt / 0.6));
    return { alpha: cl(env.lt / 0.12) * outE(env) * (lock > 0.97 ? 1 : (env.step % 2 ? 1 : 0.2)) };
  });
  var fs = FS(c) * 0.9, lx = lLeft ? cx - Rr * 1.5 : cx + Rr * 1.5, al = lLeft ? 'right' : 'left';
  H.stepText(c, 'Reticle state', lx, cy - Rr * 0.9, fs, {
    role: 'mono', align: al, color: sc.accent,
    animFn: function (env) { return { alpha: cl(env.lt / 0.12) * outE(env) }; }
  }, function (env) { return E.outExpo(cl(env.lt / 0.6)) > 0.97 ? 'LOCK' : 'SCAN'; }, 6);
  H.stepText(c, 'Reticle pct', lx, cy - Rr * 0.9 + fs * 1.3, fs, {
    role: 'mono', align: al, color: sc.sub,
    animFn: function (env) { return { alpha: 0.8 * cl(env.lt / 0.12) * outE(env) }; }
  }, function (env) { return (E.outExpo(cl(env.lt / 0.6)) * 100).toFixed(1).padStart(5, '0'); }, 8);
  return { rig: rig };
});

/* 3. radar */
reg('radar', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c);
  var bb = H.decBB(c), Rr = cl(Math.min(W, Hh) * 0.07, 40 * u, 96 * u), fs = FS(c) * 0.85;
  var sp = H.cornerSpot(c, bb, Rr * 2 + 8 * u, Rr * 2 + fs * 2.2, P, 1);
  var cx = sp.cx, cy = sp.y + Rr + 4 * u, baseA = sp.ok ? 1 : 0.35, lw = Math.max(1, u);
  var seed = H.p(P, 'seed', c.cut.seed || 11), r0 = H.p(P, 'r', 0.2), scPt = H.toScene(c, cx, cy);
  var rig = c.graph.add('null', c.cut.id + ' / Radar rig', c.parent, c.cut.start, c.cut.end, { position: scPt });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), s = Math.max(0.01, E.outExpo(cl(env.lt / 0.5)) * (1 - 0.15 * E.inCubic(env.pOut)));
    return { 'scale.x': s, 'scale.y': s };
  });
  var gridCmds = [];
  [1, 0.66, 0.33].forEach(function (k) { gridCmds = gridCmds.concat(G.ellipse(0, 0, Rr * k, Rr * k)); });
  gridCmds.push(['M', -Rr, 0], ['L', Rr, 0], ['M', 0, -Rr], ['L', 0, Rr]);
  for (var i = 0; i < 36; i++) {
    var an = i * 10 * DEG, l = i % 3 === 0 ? 5 * u : 2.5 * u;
    gridCmds.push(['M', Math.cos(an) * Rr, -Math.sin(an) * Rr], ['L', Math.cos(an) * (Rr + l), -Math.sin(an) * (Rr + l)]);
  }
  var gId = C.shape(c.graph, c.cut, c.cut.id + ' / Radar grid', rig, gridCmds, { stroke: sc.sub, width: lw, alpha: 0.55 * baseA });
  C.sample(c.graph, gId, c.cut.start, c.cut.end, function (f) { return { alpha: 0.55 * baseA * outE(R.env(c, f)) }; });
  var swRig = c.graph.add('null', c.cut.id + ' / Radar sweep', rig, c.cut.start, c.cut.end, {});
  C.sample(c.graph, swRig, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f);
    return { rotation: -((env.ltb * 150 + r0 * 360) % 360) };
  });
  for (var k = 0; k < 6; k++) {
    (function (idx) {
      var an2 = -idx * 6 * DEG, w = idx ? lw : 1.6 * lw;
      var sid = C.shape(c.graph, c.cut, c.cut.id + ' / Sweep ray ' + idx, swRig, [['M', 0, 0], ['L', Math.cos(an2) * Rr, -Math.sin(an2) * Rr]], {
        stroke: sc.accent, width: w, alpha: baseA * (idx ? 0.35 * (1 - idx / 6) : 0.95)
      });
      C.sample(c.graph, sid, c.cut.start, c.cut.end, function (f) {
        return { alpha: baseA * (idx ? 0.35 * (1 - idx / 6) : 0.95) * outE(R.env(c, f)) };
      });
    })(k);
  }
  var nB = 3 + (H.p(P, 'n', 2) | 0);
  for (var b = 0; b < nB; b++) {
    (function (idx) {
      var ang = R.random(seed, idx, 1) * 360, rad = R.rr(0.2, 0.9, seed, idx, 2);
      var bx = Math.cos(ang * DEG) * Rr * rad, by = -Math.sin(ang * DEG) * Rr * rad;
      var bid = C.shape(c.graph, c.cut, c.cut.id + ' / Radar blip ' + idx, rig, G.ellipse(bx, by, 3.6 * u, 3.6 * u), { fill: sc.fg, alpha: baseA });
      C.sample(c.graph, bid, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), sw = (env.ltb * 150 + r0 * 360) % 360;
        var since = (((sw - ang) % 360) + 360) % 360, glow = Math.exp(-since / 70);
        return { alpha: baseA * glow * outE(env) };
      });
    })(b);
  }
  var lineNum = pad2(((c.cut.line != null ? c.cut.line : 0) | 0) + 1);
  H.addText(c, 'Radar tag', 'RDR-' + lineNum, cx - Rr, sp.y + Rr * 2 + fs * 1.4, fs, {
    role: 'mono', align: 'left', color: sc.sub
  }, function (env) { return { alpha: inE(env, 0.3, 0.3) * baseA * outE(env) }; });
  H.stepText(c, 'Radar deg', cx + Rr, sp.y + Rr * 2 + fs * 1.4, fs, {
    role: 'mono', align: 'right', color: sc.fg,
    animFn: function (env) { return { alpha: inE(env, 0.3, 0.3) * baseA * outE(env) }; }
  }, function (env) { return pad2((env.ltb * 150 + r0 * 360) % 360, 3) + '\u00b0'; }, 8);
  return { rig: rig };
});

/* 4. progressRing */
reg('progressRing', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c);
  var bb = H.decBB(c), Rr = cl(Math.min(W, Hh) * 0.05, 34 * u, 64 * u);
  var sp = H.nearBB(c, bb, Rr * 2 + 24 * u, Rr * 2 + 24 * u, P, 22 * u);
  var cx = sp.cx, cy = sp.cy, lw = Math.max(1, u), a0 = sp.ok ? 1 : 0.4;
  var dur = Math.max(0.1, (c.cut.end - c.cut.start) / c.comp.fps);
  var tkSegs = [];
  for (var i = 0; i < 60; i++) {
    var an = (-90 + i * 6) * DEG, l = i % 5 === 0 ? 6 * u : 3 * u, r0 = Rr + 6 * u;
    tkSegs.push([cx + Math.cos(an) * r0, cy + Math.sin(an) * r0, cx + Math.cos(an) * (r0 + l), cy + Math.sin(an) * (r0 + l)]);
  }
  var tkId = C.shape(c.graph, c.cut, c.cut.id + ' / Prog ticks', c.parent, H.segCmds(c, tkSegs), { stroke: sc.sub, width: lw, alpha: 0.55 * a0 });
  C.sample(c.graph, tkId, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f); return { alpha: 0.55 * a0 * E.outExpo(cl(env.lt / 0.5)) * outE(env) };
  });
  var bgId = H.circle(c, 'Prog track', cx, cy, Rr, Rr, { stroke: sc.sub, width: lw, alpha: 0.35 * a0 });
  C.sample(c.graph, bgId, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f); return { alpha: 0.35 * a0 * E.outExpo(cl(env.lt / 0.5)) * outE(env) };
  });
  var arcId = H.sampleShape(c, 'Prog arc', function (env) {
    var e = E.outExpo(cl(env.lt / 0.5)), prog = cl(env.lt / dur);
    var span = Math.max(4, 360 * prog * e);
    var pts = H.arcPts(cx, cy, Rr, -90, -90 + span, 32);
    return H.polyCmds(c, [pts], false);
  }, { stroke: sc.accent, width: 2.6 * u, alpha: a0 }, function (env) {
    var e = E.outExpo(cl(env.lt / 0.5)), prog = cl(env.lt / dur);
    return { alpha: e * prog > 0.01 ? a0 * outE(env) : 0 };
  });
  var fs = Rr * 0.52;
  H.stepText(c, 'Prog pct', cx - fs * 0.12, cy, fs, {
    role: 'mono', align: 'center', color: sc.fg,
    animFn: function (env) { return { alpha: a0 * E.outExpo(cl(env.lt / 0.5)) * outE(env) }; }
  }, function (env) { return pad2(cl(env.lt / dur) * 100); }, 10);
  H.addText(c, 'Prog %', '%', cx + fs * 0.72, cy + fs * 0.12, fs * 0.42, { role: 'mono', align: 'left', color: sc.sub }, function (env) {
    return { alpha: a0 * E.outExpo(cl(env.lt / 0.5)) * outE(env) };
  });
  return { arc: arcId };
});

/* 5. timecodeBar */
reg('timecodeBar', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), m = H.decMG(c);
  var bb = H.decBB(c), fs = FS(c), w = Math.min(W * 0.38, 460 * u), h = fs * 3.4;
  var low = !!P.low, x0 = P.right ? W - m - w : m, y0 = low ? Hh - m - h : m;
  if (H.hitBB(x0, y0, x0 + w, y0 + h, bb, 10 * u)) { low = !low; y0 = low ? Hh - m - h : m; }
  var baseA = H.hitBB(x0, y0, x0 + w, y0 + h, bb, 0) ? 0.3 : 1;
  var ty = y0 + fs * 0.8, tcW = textW('TC ', fs * 0.8, 0.1), dur = Math.max(0.1, (c.cut.end - c.cut.start) / c.comp.fps);
  H.addText(c, 'TC tag', 'TC', x0, ty + fs * 0.12, fs * 0.8, { role: 'mono', align: 'left', color: sc.accent }, function (env) { return { alpha: baseA * outE(env) }; });
  H.stepText(c, 'TC digits', x0 + tcW, ty, fs * 1.25, {
    role: 'mono', align: 'left', color: sc.fg,
    animFn: function (env) { return { alpha: baseA * outE(env) }; }
  }, function (env, f) {
    var t = Math.max(0, f / c.comp.fps), fr = Math.floor(t * c.comp.fps);
    return pad2(t / 3600) + ':' + pad2((t / 60) % 60) + ':' + pad2(t % 60) + ':' + pad2(fr % c.comp.fps);
  }, 12);
  H.stepText(c, 'TC frame', x0 + w, ty + fs * 0.12, fs * 0.8, {
    role: 'mono', align: 'right', color: sc.sub,
    animFn: function (env) { return { alpha: baseA * E.outExpo(cl(env.lt / 0.5)) * outE(env) }; }
  }, function (env) { return 'F ' + pad2(Math.floor(Math.max(0, env.lt) * c.comp.fps), 4); }, 10);
  var by = y0 + h - fs * 0.6, lw = Math.max(1, u);
  H.line(c, 'TC base line', [[x0, by], [x0 + w, by]], sc.sub, lw, 0.6 * baseA);
  var tk = [];
  for (var i = 0; i <= 48; i++) {
    var tx = x0 + w * i / 48, tl = i % 12 === 0 ? 7 * u : i % 4 === 0 ? 4 * u : 2 * u;
    tk.push([tx, by, tx, by - tl]);
  }
  C.shape(c.graph, c.cut, c.cut.id + ' / TC ticks', c.parent, H.segCmds(c, tk), { stroke: sc.sub, width: lw, alpha: 0.6 * baseA });
  var spBar = H.toScene(c, x0, by);
  var progBar = C.shape(c.graph, c.cut, c.cut.id + ' / TC prog', c.parent, [['M', 0, 0], ['L', w, 0]], { stroke: sc.fg, width: 2.2 * u, alpha: baseA });
  c.graph.byId[progBar].attrs.position = spBar;
  C.sample(c.graph, progBar, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), p = Math.max(0.002, cl(env.lt / dur) * E.outExpo(cl(env.lt / 0.5)));
    return { 'scale.x': p, alpha: baseA * outE(env) };
  });
  var headId = C.shape(c.graph, c.cut, c.cut.id + ' / TC head', c.parent, [['M', -5 * u, 12 * u], ['L', 5 * u, 12 * u], ['L', 0, 4 * u], ['Z']], { fill: sc.accent, alpha: baseA });
  C.sample(c.graph, headId, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), px = x0 + w * cl(env.lt / dur) * E.outExpo(cl(env.lt / 0.5));
    var spH = H.toScene(c, px, by);
    return { 'position.x': spH[0], 'position.y': spH[1], alpha: baseA * outE(env) };
  });
  H.addText(c, 'TC IN', 'IN', x0 + 4 * u, by + 9 * u + fs * 0.35, fs * 0.6, { role: 'mono', align: 'left', color: sc.sub }, function (env) { return { alpha: 0.8 * baseA * E.outExpo(cl(env.lt / 0.5)) * outE(env) }; });
  H.addText(c, 'TC OUT', 'OUT', x0 + w - 4 * u, by + 9 * u + fs * 0.35, fs * 0.6, { role: 'mono', align: 'right', color: sc.sub }, function (env) { return { alpha: 0.8 * baseA * E.outExpo(cl(env.lt / 0.5)) * outE(env) }; });
  return { bar: progBar };
});

/* 6. rulerEdge */
reg('rulerEdge', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), m = H.decMG(c);
  var bb = H.decBB(c), vert = !!P.corner, fs = FS(c) * 0.72, lw = Math.max(1, u), st = 10 * u;
  var len = vert ? Hh : W, a0 = m, a1 = len - m;
  var side = vert ? (P.right ? 1 : -1) : (P.low ? 1 : -1);
  var base = vert ? (side > 0 ? W - m * 0.55 : m * 0.55) : (side > 0 ? Hh - m * 0.55 : m * 0.55), inward = -side;
  function P2(along, off) { return vert ? [base + inward * off, along] : [along, base + inward * off]; }
  var n = Math.floor((a1 - a0) / st), list = [];
  for (var i = 0; i <= n; i++) {
    var s = a0 + i * st, l = (i % 10 === 0 ? 14 : i % 5 === 0 ? 9 : 4.5) * u;
    var p1 = P2(s, 0), q1 = P2(s, l);
    list.push([p1[0], p1[1], q1[0], q1[1]]);
    if (i % 10 === 0 && s < a1 - 20 * u) {
      var lp = P2(s + (vert ? 0 : 3 * u), 20 * u + fs * 0.4);
      H.addText(c, 'Ruler num ' + i, pad2(i, 3), lp[0], lp[1], fs, { role: 'mono', align: vert ? (inward > 0 ? 'left' : 'right') : 'left', color: sc.sub }, function (env) {
        return { alpha: 0.7 * E.outCubic(cl(env.lt / 0.55)) * outE(env) };
      });
    }
  }
  var tkId = C.shape(c.graph, c.cut, c.cut.id + ' / Ruler ticks', c.parent, H.segCmds(c, list), { stroke: sc.sub, width: lw, alpha: 0.7 });
  C.sample(c.graph, tkId, c.cut.start, c.cut.end, function (f) { var env = R.env(c, f); return { alpha: 0.7 * E.outCubic(cl(env.lt / 0.55)) * outE(env) }; });
  var blId = H.line(c, 'Ruler baseline', [P2(a0, 0), P2(a1, 0)], sc.sub, lw, 0.5);
  C.sample(c.graph, blId, c.cut.start, c.cut.end, function (f) { var env = R.env(c, f); return { alpha: 0.5 * E.outCubic(cl(env.lt / 0.55)) * outE(env) }; });
  var lo = cl(vert ? bb.y0 : bb.x0, a0, a1), hi = cl(vert ? bb.y1 : bb.x1, a0, a1), mid = (lo + hi) / 2, off = 26 * u;
  var mkId = H.line(c, 'Ruler span', [P2(lo, off), P2(hi, off)], sc.accent, 2 * u, 0.9);
  C.sample(c.graph, mkId, c.cut.start, c.cut.end, function (f) { return { alpha: 0.9 * inE(R.env(c, f), 0.5, 0.2, E.outCubic) * outE(R.env(c, f)) }; });
  var lpt = P2(mid, off + 8 * u + fs);
  H.addText(c, 'Ruler dim', pad2(hi - lo, 4), lpt[0] + (vert ? 0 : 6 * u), lpt[1], fs, { role: 'mono', align: vert ? (inward > 0 ? 'left' : 'right') : 'left', color: sc.fg }, function (env) {
    return { alpha: inE(env, 0.5, 0.2, E.outCubic) * outE(env) };
  });
  return { ticks: tkId };
});

/* 7. dimension */
reg('dimension', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), m = H.decMG(c);
  var bb = H.decBB(c), lw = Math.max(1, u), fs = FS(c) * 0.85, arch = (H.p(P, 'v', 0) | 0) % 2 === 1;
  var gap = 20 * u + bb.h * 0.1, below = !!P.low, y = below ? bb.y1 + gap : bb.y0 - gap;
  if (y < m * 0.6 || y > Hh - m * 0.6) { below = !below; y = below ? bb.y1 + gap : bb.y0 - gap; }
  var x0 = bb.x0, x1 = bb.x1, cx = bb.cx, sy = below ? 1 : -1, lab = String(Math.round(x1 - x0)), lwid = textW(lab, fs, 0.08) + 14 * u;
  var extList = [[x0, (below ? bb.y1 : bb.y0) + sy * 6 * u, x0, y + sy * 8 * u], [x1, (below ? bb.y1 : bb.y0) + sy * 6 * u, x1, y + sy * 8 * u]];
  var extId = C.shape(c.graph, c.cut, c.cut.id + ' / Dim ext', c.parent, H.segCmds(c, extList), { stroke: sc.sub, width: lw, alpha: 0.7 });
  C.sample(c.graph, extId, c.cut.start, c.cut.end, function (f) { return { alpha: 0.7 * inE(R.env(c, f), 0.35, 0.05) * outE(R.env(c, f)) }; });
  if (x1 - x0 > lwid) {
    var dimSegs = [[x0, y, cx - lwid / 2, y], [cx + lwid / 2, y, x1, y]];
    var dId = C.shape(c.graph, c.cut, c.cut.id + ' / Dim line', c.parent, H.segCmds(c, dimSegs), { stroke: sc.fg, width: lw, alpha: 0.9 });
    C.sample(c.graph, dId, c.cut.start, c.cut.end, function (f) { return { alpha: 0.9 * E.outExpo(cl(R.env(c, f).lt / 0.55)) * outE(R.env(c, f)) }; });
  }
  if (arch) {
    var tc = [[x0 - 5 * u, y + 5 * u, x0 + 5 * u, y - 5 * u], [x1 - 5 * u, y + 5 * u, x1 + 5 * u, y - 5 * u]];
    C.shape(c.graph, c.cut, c.cut.id + ' / Dim ticks', c.parent, H.segCmds(c, tc), { stroke: sc.fg, width: 1.6 * u, alpha: 1 });
  } else {
    var arrows = [[[x0, y], [x0 + 10 * u, y - 3.5 * u], [x0 + 10 * u, y + 3.5 * u]], [[x1, y], [x1 - 10 * u, y - 3.5 * u], [x1 - 10 * u, y + 3.5 * u]]];
    C.shape(c.graph, c.cut, c.cut.id + ' / Dim heads', c.parent, H.polyCmds(c, arrows, true), { fill: sc.fg, alpha: 1 });
  }
  H.addText(c, 'Dim W', lab, cx, y, fs, { role: 'mono', align: 'center', color: P.accent ? sc.accent : sc.fg }, function (env) {
    return { alpha: inE(env, 0.35, 0.05) * outE(env) };
  });
  return { ext: extId };
});

/* 8. dateStamp */
var SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
function segDigit(x, y, dw, dh, t, d, sk) {
  var out = [], h2 = dh / 2, k = t / 2;
  function hs(x0, x1, yy) { return [[x0 + k, yy], [x0 + 2 * k, yy - k], [x1 - 2 * k, yy - k], [x1 - k, yy], [x1 - 2 * k, yy + k], [x0 + 2 * k, yy + k]]; }
  function vs(xx, y0, y1) { return [[xx, y0 + k], [xx + k, y0 + 2 * k], [xx + k, y1 - 2 * k], [xx, y1 - k], [xx - k, y1 - 2 * k], [xx - k, y0 + 2 * k]]; }
  var S2 = { a: hs(x, x + dw, y), g: hs(x, x + dw, y + h2), d: hs(x, x + dw, y + dh), f: vs(x, y, y + h2), b: vs(x + dw, y, y + h2), e: vs(x, y + h2, y + dh), c: vs(x + dw, y + h2, y + dh) };
  var code = SEG[d] || '';
  for (var i = 0; i < code.length; i++) {
    out.push(S2[code[i]].map(function (pt) { return [pt[0] + (y + dh / 2 - pt[1]) * sk, pt[1]]; }));
  }
  return out;
}

reg('dateStamp', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c);
  var bb = H.decBB(c), seed = H.p(P, 'seed', c.cut.seed || 23), v = H.p(P, 'v', 0) | 0;
  var yy = R.hash(seed, 1) % 2 ? 90 + R.hash(seed, 2) % 10 : R.hash(seed, 3) % 27;
  var mm = 1 + R.hash(seed, 4) % 12, dd = 1 + R.hash(seed, 5) % 28;
  var groups = [pad2(yy), String(mm), pad2(dd)];
  var dh = cl(Math.min(W, Hh) * 0.034, 24 * u, 46 * u), dw = dh * 0.52, t = dh * 0.12, gapD = dw * 0.42, gapG = dw * 1.35;
  var width = groups.reduce(function (s, g) { return s + g.length * (dw + gapD); }, 0) + gapG * 2 + dw * 0.5;
  var sp = H.cornerSpot(c, bb, width, dh * 1.4, { right: v % 3 === 2 ? !P.right : true, low: true }, 1.2);
  var x = sp.x + dw * 0.5, y = sp.y + dh * 0.2, polys = [];
  polys.push([[x - dw * 0.1, y - t * 0.2], [x + t * 0.9, y - t * 0.2], [x + t * 0.2, y + dh * 0.32], [x - dw * 0.1 - t * 0.6, y + dh * 0.32]]);
  x += dw * 0.35;
  groups.forEach(function (g) {
    for (var i = 0; i < g.length; i++) {
      polys = polys.concat(segDigit(x, y, dw, dh, t, +g[i], 0.1));
      x += dw + gapD;
    }
    x += gapG - gapD;
  });
  var baseA = 0.92 * (sp.ok ? 1 : 0.4);
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Date stamp', c.parent, H.polyCmds(c, polys, true), { fill: sc.accent, alpha: baseA });
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), a = cl((env.lt - 0.05) / 0.25) * baseA * outE(env);
    return { alpha: a };
  });
  return { layer: id };
});

/* 9. qrBlock */
reg('qrBlock', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c);
  var bb = H.decBB(c), seed = H.p(P, 'seed', c.cut.seed || 31), Nn = 21, S = cl(Math.min(W, Hh) * 0.1, 76 * u, 140 * u);
  var cell = S / Nn, fs = FS(c) * 0.72, sp = H.cornerSpot(c, bb, S, S + fs * 2, P, 1.1), a0 = sp.ok ? 1 : 0.35;
  function finder(i, j) {
    var pts = [[0, 0], [Nn - 7, 0], [0, Nn - 7]];
    for (var k = 0; k < pts.length; k++) {
      var di = i - pts[k][0], dj = j - pts[k][1];
      if (di >= 0 && di < 7 && dj >= 0 && dj < 7) {
        var rr = Math.max(Math.abs(di - 3), Math.abs(dj - 3));
        return rr === 3 || rr <= 1 ? (rr <= 1 ? 2 : 1) : 0;
      }
    }
    return -1;
  }
  var fgRects = [], accRects = [];
  for (var j = 0; j < Nn; j++) for (var i = 0; i < Nn; i++) {
    var f = finder(i, j);
    if (f === -1) {
      if ((i === 7 || j === 7) && (i < 8 && j < 8 || i > Nn - 9 && j < 8 || i < 8 && j > Nn - 9)) f = 0;
      else if (i === 6 || j === 6) f = (i + j) % 2 === 0 ? 1 : 0;
      else f = R.random(seed, i, j, 3) < 0.48 ? 1 : 0;
    }
    if (!f) continue;
    (f === 2 && P.accent ? accRects : fgRects).push([sp.x + i * cell, sp.y + j * cell, cell + 0.35, cell + 0.35]);
  }
  var fgId = fgRects.length ? C.shape(c.graph, c.cut, c.cut.id + ' / QR fg', c.parent, H.rectCmds(c, fgRects), { fill: sc.fg, alpha: a0 }) : null;
  var accId = accRects.length ? C.shape(c.graph, c.cut, c.cut.id + ' / QR acc', c.parent, H.rectCmds(c, accRects), { fill: sc.accent, alpha: a0 }) : null;
  [fgId, accId].forEach(function (id) {
    if (id) C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) { return { alpha: a0 * cl(R.env(c, f).lt / 0.4) * outE(R.env(c, f)) }; });
  });
  var hexId = 'ID ' + (R.hash(seed, 12) % 0xffffff).toString(16).toUpperCase().padStart(6, '0');
  H.addText(c, 'QR id', hexId, sp.x, sp.y + S + fs * 1.2, fs, { role: 'mono', align: 'left', color: sc.sub }, function (env) {
    return { alpha: a0 * inE(env, 0.3, 0.4) * outE(env) };
  });
  return { fg: fgId };
});

/* 10. glitchRects */
reg('glitchRects', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var seed = H.p(P, 'seed', c.cut.seed || 41), n = Math.min(8, Math.round(7 * (0.7 + 0.2 * (H.p(P, 'n', 2) | 0))));
  var gap = 10 * u + bb.h * 0.06, cols = [sc.fg, sc.accent, sc.ghostA || sc.accent, sc.ghostB || sc.sub];
  var ids = [];
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var right = R.random(seed, idx, 1) < 0.5, h = (2 + R.random(seed, idx, 3) * 9) * u;
      var room = right ? W - bb.x1 - gap : bb.x0 - gap, w = (24 + R.random(seed, idx, 4) * 160) * u;
      var x, y;
      if (room > 60 * u && R.random(seed, idx, 8) < 0.75) {
        y = mix(bb.y0, bb.y1, R.random(seed, idx, 2)); w = Math.min(w, room - 8 * u);
        x = right ? bb.x1 + gap + R.random(seed, idx, 5) * Math.max(0, room - w - 8 * u) * 0.5 : bb.x0 - gap - w - R.random(seed, idx, 5) * Math.max(0, room - w - 8 * u) * 0.5;
      } else {
        y = (R.random(seed, idx, 9) < 0.5 ? bb.y0 - gap : bb.y1 + gap + 20 * u);
        x = mix(bb.x0, bb.x1 - w, R.random(seed, idx, 5));
      }
      x = cl(x, 4 * u, W - w - 4 * u);
      var col = cols[idx % 4], hollow = R.random(seed, idx, 6) < 0.25;
      var id = H.rect(c, 'Glitch rect ' + idx, x, y, Math.max(4 * u, w), hollow ? h * 3 : h, hollow ? { stroke: col, width: Math.max(1, u), alpha: 0.85 } : { fill: col, alpha: 0.9 });
      if (id) {
        C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
          var env = R.env(c, f), burst = Math.max(1 - cl(env.lt / 0.45), env.pOut > 0 ? 1 - env.pOut * 0.6 : 0);
          var show = burst > 0.1 || (R.hash(seed, env.step, idx) % 4 === 0);
          return { alpha: show ? 0.9 * outE(env) : 0 };
        });
        ids.push(id);
      }
    })(i);
  }
  return { count: ids.length };
});

/* 11. concentricSquares */
reg('concentricSquares', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var S = cl(Math.min(W, Hh) * 0.17, 100 * u, 220 * u);
  var sp = P.corner ? H.cornerSpot(c, bb, S * 1.2, S * 1.2, P, 1) : H.nearBB(c, bb, S * 1.2, S * 1.2, P, 24 * u);
  var n = Math.min(8, 5 + (H.p(P, 'n', 1) | 0)), lw = Math.max(1, 1.2 * u), tunnel = (H.p(P, 'v', 0) | 0) % 2 === 1;
  var baseA = sp.ok ? 1 : 0.35, dir = P.right ? 1 : -1, scPt = H.toScene(c, sp.cx, sp.cy);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var s = S * 0.5 * (tunnel ? 1 : (1 - idx / n * 0.86));
      var rot0 = tunnel ? (H.p(P, 'r', 0) > 0.5 ? 45 : 0) : idx * (6 + H.p(P, 'r', 0.4) * 8);
      var col = idx === (H.p(P, 'n', 1) | 0) ? sc.accent : sc.fg;
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / ConcSq ' + idx, c.parent, G.rect(-s, -s, s * 2, s * 2), { stroke: col, width: col === sc.accent ? lw * 1.6 : lw, alpha: baseA });
      c.graph.byId[id].attrs.position = scPt;
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), e = E.outExpo(cl((env.lt - idx * 0.045) / 0.5));
        if (tunnel) {
          var ff = (idx / n + env.ltb * 0.18) % 1, sck = Math.max(0.05, 0.08 + 0.92 * ff);
          return { rotation: -rot0, 'scale.x': sck, 'scale.y': sck, alpha: baseA * Math.sin(Math.PI * ff) * e * outE(env) };
        }
        return { rotation: -(rot0 + env.ltb * 7 * dir), alpha: baseA * (0.45 + 0.55 * (1 - idx / n)) * e * outE(env) };
      });
    })(i);
  }
  H.circle(c, 'ConcSq center', sp.cx, sp.cy, 2.4 * u, 2.4 * u, { fill: sc.accent, alpha: baseA });
  return { count: n };
});

/* 12. triangleSpin */
reg('triangleSpin', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var lw = Math.max(1, 1.4 * u), dir = P.right ? 1 : -1, r0 = H.p(P, 'r', 0.25) * 120;
  function triCmds(Rr) {
    var cmds = [];
    for (var k = 0; k < 3; k++) {
      var a = (-90 + k * 120) * DEG;
      cmds.push([k ? 'L' : 'M', Math.cos(a) * Rr, -Math.sin(a) * Rr]);
    }
    cmds.push(['Z']);
    return cmds;
  }
  var rin = Math.hypot(bb.w / 2, bb.h / 2) + 18 * u;
  if (P.big && rin * 2 < Math.max(W, Hh) * 0.62) {
    var Rbig = rin * 2, scBig = H.toScene(c, bb.cx, bb.cy);
    var t1 = C.shape(c.graph, c.cut, c.cut.id + ' / Tri big 1', c.parent, triCmds(Rbig), { stroke: sc.fg, width: lw, alpha: 0.75 });
    var t2 = C.shape(c.graph, c.cut, c.cut.id + ' / Tri big 2', c.parent, triCmds(Rbig * 1.07), { stroke: P.accent ? sc.accent : sc.sub, width: lw, alpha: 0.45 });
    c.graph.byId[t1].attrs.position = scBig; c.graph.byId[t2].attrs.position = scBig;
    C.sample(c.graph, t1, c.cut.start, c.cut.end, function (f) {
      var env = R.env(c, f), e = E.outExpo(cl(env.lt / 0.6));
      return { rotation: -(dir * ((1 - e) * -70 + env.ltb * 5) + r0), alpha: 0.75 * e * outE(env) };
    });
    C.sample(c.graph, t2, c.cut.start, c.cut.end, function (f) {
      var env = R.env(c, f), e = E.outExpo(cl((env.lt - 0.12) / 0.6));
      return { rotation: -(-0.6 * (dir * ((1 - e) * -70 + env.ltb * 5) + r0) + 60), alpha: 0.45 * e * outE(env) };
    });
    return { t1: t1, t2: t2 };
  }
  var S = cl(Math.min(W, Hh) * 0.19, 110 * u, 230 * u);
  var sp = P.corner ? H.cornerSpot(c, bb, S, S, P, 1) : H.nearBB(c, bb, S, S, P, 24 * u);
  var a0 = sp.ok ? 1 : 0.35, Rs = S * 0.42, scP = H.toScene(c, sp.cx, sp.cy + S * 0.06);
  var s1 = C.shape(c.graph, c.cut, c.cut.id + ' / Tri 1', c.parent, triCmds(Rs), { stroke: sc.fg, width: lw * 1.1, alpha: a0 });
  var s2 = C.shape(c.graph, c.cut, c.cut.id + ' / Tri 2', c.parent, triCmds(Rs * 0.62), { stroke: sc.sub, width: lw, alpha: 0.8 * a0 });
  var sat = C.shape(c.graph, c.cut, c.cut.id + ' / Tri sat', c.parent, triCmds(Rs * 0.13), { fill: sc.accent, alpha: a0 });
  c.graph.byId[s1].attrs.position = scP; c.graph.byId[s2].attrs.position = scP;
  C.sample(c.graph, s1, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), e = E.outExpo(cl(env.lt / 0.6));
    return { rotation: -(dir * (env.ltb * 16 + (1 - e) * -90) + r0), alpha: a0 * e * outE(env) };
  });
  C.sample(c.graph, s2, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), e = E.outExpo(cl((env.lt - 0.1) / 0.6));
    return { rotation: -(-dir * (env.ltb * 24 + (1 - e) * -140) + 60), alpha: 0.8 * a0 * e * outE(env) };
  });
  C.sample(c.graph, sat, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), q = E.outBack(cl((env.lt - 0.25) / 0.35), 1.8);
    var an = (env.ltb * 50 * dir + r0 * 3) * DEG, rr = Rs * 1.18;
    return { 'position.x': scP[0] + Math.cos(an) * rr, 'position.y': scP[1] - Math.sin(an) * rr, rotation: -(env.ltb * 90 * dir), 'scale.x': Math.max(0.01, q), 'scale.y': Math.max(0.01, q), alpha: q > 0.01 ? a0 * outE(env) : 0 };
  });
  return { s1: s1 };
});

/* 13. lineBurst */
reg('lineBurst', 'front', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), seed = H.p(P, 'seed', c.cut.seed || 17);
  var pad = 18 * u + bb.h * 0.14, A = bb.w / 2 * 1.08 + pad, B = bb.h / 2 * 1.12 + pad;
  var Nn = Math.round(cl((A + B) * 4 / (34 * u), 24, 56));
  var mainSegs = [], accSegs = [];
  for (var i = 0; i < Nn; i++) {
    var th = (i + 0.5 + R.rs(seed, i, 1) * 0.3) / Nn * TAU, rr = superR(A, B, 4, th);
    var px = bb.cx + Math.cos(th) * rr, py = bb.cy + Math.sin(th) * rr;
    var len = R.rr(10, 30, seed, i, 3) * u * (P.big ? 1.5 : 1), d0 = R.random(seed, i, 2) * 8 * u;
    var seg = [px + Math.cos(th) * d0, py + Math.sin(th) * d0, px + Math.cos(th) * (d0 + len), py + Math.sin(th) * (d0 + len)];
    (i % 6 === 0 ? accSegs : mainSegs).push(seg);
  }
  var id1 = C.shape(c.graph, c.cut, c.cut.id + ' / LineBurst main', c.parent, H.segCmds(c, mainSegs), { stroke: sc.fg, width: 1.6 * u, alpha: 0.85 });
  var id2 = accSegs.length ? C.shape(c.graph, c.cut, c.cut.id + ' / LineBurst acc', c.parent, H.segCmds(c, accSegs), { stroke: sc.accent, width: 2.4 * u, alpha: 1 }) : null;
  [id1, id2].forEach(function (id, k) {
    if (!id) return;
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
      var env = R.env(c, f), e = E.outExpo(cl(env.lt / 0.35)), s = 0.8 + 0.2 * e + 0.08 * E.inCubic(env.pOut);
      return { 'scale.x': s, 'scale.y': s, alpha: (k ? 1 : 0.85) * e * outE(env) };
    });
  });
  return { main: id1 };
});

/* 14. plusGrid */
reg('plusGrid', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var v = H.p(P, 'v', 0) | 0, cols = 4 + (H.p(P, 'n', 1) | 0) + (v % 3), rows = 2 + (v % 2) + (P.big ? 1 : 0);
  var s = cl(Math.min(W, Hh) * 0.034, 24 * u, 44 * u), ps = s * 0.22;
  var sp = P.corner ? H.cornerSpot(c, bb, (cols - 1) * s + ps * 2, (rows - 1) * s + ps * 2, P, 1) : H.nearBB(c, bb, (cols - 1) * s + ps * 2, (rows - 1) * s + ps * 2, P, 26 * u);
  var a0 = sp.ok ? 1 : 0.35, list = [];
  for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
    var x = sp.x + ps + i * s, y = sp.y + ps + j * s;
    list.push([x - ps, y, x + ps, y], [x, y - ps, x, y + ps]);
  }
  var gridId = C.shape(c.graph, c.cut, c.cut.id + ' / PlusGrid', c.parent, H.segCmds(c, list), { stroke: sc.sub, width: Math.max(1, 1.3 * u), alpha: a0 });
  C.sample(c.graph, gridId, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f); return { alpha: a0 * E.outCubic(cl(env.lt / 0.35)) * outE(env) };
  });
  var hk = ps * 1.5, r0 = H.p(P, 'r', 0.2);
  var hlId = C.shape(c.graph, c.cut, c.cut.id + ' / PlusGrid HL', c.parent, [['M', -hk, -hk], ['L', hk, hk], ['M', -hk, hk], ['L', hk, -hk]], { stroke: sc.accent, width: 1.8 * u, alpha: a0 });
  C.sample(c.graph, hlId, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), hl = Math.floor(env.ltb * 7 + r0 * 50) % (cols * rows);
    var ix = hl % cols, iy = Math.floor(hl / cols);
    var pH = H.toScene(c, sp.x + ps + ix * s, sp.y + ps + iy * s);
    return { 'position.x': pH[0], 'position.y': pH[1], alpha: env.lt > 0.5 ? a0 * outE(env) : 0 };
  });
  return { grid: gridId };
});

/* 15. guides */
reg('guides', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var pad = 10 * u + bb.h * 0.05, X0 = bb.x0 - pad, X1 = bb.x1 + pad, Y0 = bb.y0 - pad, Y1 = bb.y1 + pad;
  var col = P.accent ? sc.accent : (sc.accent2 && H.contrast(sc.accent2, sc.bg) > 2 ? sc.accent2 : sc.accent);
  var lw = Math.max(1, 1.1 * u), segs = [], dashOn = 7 * u, dashPer = 12 * u;
  [Y0, Y1].forEach(function (yy) {
    if (yy > 0 && yy < Hh) for (var x = 0; x < W; x += dashPer) segs.push([x, yy, Math.min(W, x + dashOn), yy]);
  });
  var vert = P.big || ((H.p(P, 'v', 0) | 0) % 2 === 1) || bb.h > bb.w;
  if (vert) [X0, X1].forEach(function (xx) {
    if (xx > 0 && xx < W) for (var y = 0; y < Hh; y += dashPer) segs.push([xx, y, xx, Math.min(Hh, y + dashOn)]);
  });
  var gId = C.shape(c.graph, c.cut, c.cut.id + ' / Guides', c.parent, H.segCmds(c, segs), { stroke: col, width: lw, alpha: 0.75 });
  C.sample(c.graph, gId, c.cut.start, c.cut.end, function (f) {
    return { alpha: 0.75 * E.outExpo(cl(R.env(c, f).lt / 0.6)) * outE(R.env(c, f)) };
  });
  var hs = 3.5 * u, sqs = [[X0, Y0], [X1, Y0], [X0, Y1], [X1, Y1]].map(function (pt) { return [pt[0] - hs, pt[1] - hs, hs * 2, hs * 2]; });
  var hId = C.shape(c.graph, c.cut, c.cut.id + ' / Guide handles', c.parent, H.rectCmds(c, sqs), { stroke: sc.fg, width: lw, alpha: 1 });
  C.sample(c.graph, hId, c.cut.start, c.cut.end, function (f) { return { alpha: inE(R.env(c, f), 0.3, 0.3) * outE(R.env(c, f)) }; });
  var fs = FS(c) * 0.75, m = H.decMG(c) * 0.5;
  H.addText(c, 'Guide Y0', 'Y ' + pad2(Y0, 4), m, Y0 - fs * 0.8, fs, { role: 'mono', align: 'left', color: col }, function (env) { return { alpha: inE(env, 0.3, 0.3) * outE(env) }; });
  H.addText(c, 'Guide Y1', 'Y ' + pad2(Y1, 4), m, Y1 + fs * 0.9, fs, { role: 'mono', align: 'left', color: col }, function (env) { return { alpha: inE(env, 0.3, 0.3) * outE(env) }; });
  return { guides: gId };
});

/* 16. waveLine */
reg('waveLine', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), m = H.decMG(c);
  var bb = H.decBB(c), fb = H.freeBand(c, bb, !!P.low);
  if (fb.room < 30 * u) return { skip: true };
  var A = cl(fb.room * 0.1, 5 * u, 14 * u), lam = cl(Math.min(W, Hh) * 0.07, 44 * u, 96 * u);
  var dir = P.right ? 1 : -1, x0 = m, x1 = W - m;
  function mkWave(amp, off) {
    var pts = [];
    for (var x = x0; x <= x1 + 0.1; x += 6 * u) {
      var ev = Math.min(1, (x - x0) / (lam * 1.5), (x1 - x) / (lam * 1.5));
      pts.push([x, fb.y + Math.sin((x - x0) / lam * TAU + off) * amp * ev]);
    }
    return pts;
  }
  var id1 = H.sampleShape(c, 'Wave 1', function (env) {
    var e = E.inOutCubic(cl(env.lt / 0.7)), pOut = E.inCubic(env.pOut);
    var seg = H.partPts(mkWave(A, env.ltb * 2.4 * dir), pOut, Math.max(pOut + 0.02, e));
    return H.polyCmds(c, [seg.length >= 2 ? seg : mkWave(A, 0)], false);
  }, { stroke: sc.fg, width: 1.4 * u, alpha: 0.85 }, function (env) {
    return { alpha: 0.85 * E.inOutCubic(cl(env.lt / 0.7)) * outE(env) };
  });
  var id2 = H.sampleShape(c, 'Wave 2', function (env) {
    var e = E.inOutCubic(cl((env.lt - 0.12) / 0.7)), pOut = E.inCubic(env.pOut);
    var seg = H.partPts(mkWave(A * 0.55, env.ltb * 2.4 * dir + Math.PI * 0.6), pOut, Math.max(pOut + 0.02, e));
    return H.polyCmds(c, [seg.length >= 2 ? seg : mkWave(A * 0.55, 1.8)], false);
  }, { stroke: P.accent ? sc.accent : sc.sub, width: Math.max(1, u), alpha: 0.6 }, function (env) {
    return { alpha: 0.6 * E.inOutCubic(cl((env.lt - 0.12) / 0.7)) * outE(env) };
  });
  return { wave1: id1, wave2: id2 };
});

/* 17. spiralLine */
reg('spiralLine', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var Rr = cl(Math.min(W, Hh) * 0.085, 54 * u, 104 * u), sp = H.nearBB(c, bb, Rr * 2.3, Rr * 2.3, P, 20 * u);
  var a0 = sp.ok ? 1 : 0.35, turns = 3 + (H.p(P, 'n', 1) | 0) * 0.5, sq = (H.p(P, 'v', 0) | 0) % 2 === 1;
  var pts = [], r0 = H.p(P, 'r', 0) * 360;
  if (sq) {
    var ns = Math.round(turns * 4), d = Rr / (ns / 2), x = 0, y = 0, dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    pts.push([0, 0]);
    for (var k = 0; k < ns; k++) {
      var L = d * (Math.floor(k / 2) + 1);
      x += dirs[k % 4][0] * L; y -= dirs[k % 4][1] * L; pts.push([x, y]);
    }
  } else {
    var M = Math.round(turns * 30);
    for (var k2 = 0; k2 <= M; k2++) {
      var th = k2 / M * turns * TAU, rr = Rr * k2 / M;
      pts.push([Math.cos(th) * rr, -Math.sin(th) * rr]);
    }
  }
  var cmds = pts.map(function (pt, i) { return [i ? 'L' : 'M', pt[0], pt[1]]; });
  var scPt = H.toScene(c, sp.cx, sp.cy);
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Spiral', c.parent, cmds, { stroke: sc.fg, width: 1.4 * u, alpha: 0.85 * a0 });
  c.graph.byId[id].attrs.position = scPt;
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), e = E.inOutCubic(cl(env.lt / 0.7)), s = Math.max(0.05, e);
    return { 'scale.x': s, 'scale.y': s, rotation: -(r0 + env.ltb * 18 * (P.right ? 1 : -1)), alpha: 0.85 * a0 * outE(env) * e };
  });
  return { spiral: id };
});

/* 18. halftonePatch (back) */
reg('halftonePatch', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c);
  var seed = H.p(P, 'seed', c.cut.seed || 61);
  var sx = P.right ? 1 : -1, sy = P.low ? 1 : -1, ox = sx > 0 ? W : 0, oy = sy > 0 ? Hh : 0;
  var pw = W * R.rr(0.38, 0.58, seed, 1), ph = Hh * R.rr(0.38, 0.6, seed, 2);
  var g = cl(Math.min(W, Hh) * 0.018, 12 * u, 22 * u);
  while ((pw / g) * (ph / g) > 420) g *= 1.18;
  var col = P.accent ? sc.accent : sc.sub, al = (P.accent ? 0.3 : 0.2) * (dark(c) ? 1 : 0.8);
  var dotList = [], row = 0;
  for (var y = oy - sy * g * 0.5; Math.abs(y - oy) < ph; y -= sy * g, row++) {
    for (var x = ox - sx * (row % 2 ? g : g * 0.5); Math.abs(x - ox) <= pw; x -= sx * g) {
      var d = Math.hypot((x - ox) / pw, (y - oy) / ph), r = g * 0.5 * Math.pow(cl(1 - d), 1.2);
      if (r > 0.6) dotList.push([x, y, r]);
    }
  }
  if (!dotList.length) return { skip: true };
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Halftone patch', c.parent, H.dotCmds(c, dotList), { fill: col, alpha: al });
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f); return { alpha: al * cl(env.lt / 0.5) * outE(env) };
  });
  return { patch: id };
});

/* 19. checkerStrip */
reg('checkerStrip', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var v = (H.p(P, 'v', 0) | 0) % 3, rows = v === 1 ? 3 : v === 2 ? 1 : 2;
  var ch = cl(Math.min(W, Hh) * 0.016, 10 * u, 18 * u), L = Math.min(W * 0.32, 400 * u), h = rows * ch;
  var sp = H.cornerSpot(c, bb, L, h + (v === 2 ? 10 * u : 0), P, 1), a0 = sp.ok ? 1 : 0.35;
  var rectList = [];
  for (var j = 0; j < rows; j++) for (var i = 0; i * ch < L; i++) {
    if ((i + j) % 2 !== 0) continue;
    var k = v === 1 ? cl(1 - (i * ch) / L * 0.95) : 1, cw = ch * k, rh = ch * k;
    rectList.push([sp.x + i * ch + (ch - cw) / 2, sp.y + (v === 2 ? 5 * u : 0) + j * ch + (ch - rh) / 2, Math.min(cw, L - i * ch), rh]);
  }
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Checker strip', c.parent, H.rectCmds(c, rectList), { fill: P.accent ? sc.accent : sc.fg, alpha: 0.9 * a0 });
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f); return { alpha: 0.9 * a0 * E.outExpo(cl(env.lt / 0.55)) * outE(env) };
  });
  return { checker: id };
});

/* 20. beatRing (back) */
reg('beatRing', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c);
  var cx = W / 2, cy = Hh / 2, r0 = Math.min(W, Hh) * 0.2, r1 = Math.hypot(W, Hh) * 0.55;
  var col = P.accent ? sc.accent : sc.sub, base = P.accent ? 0.45 : 0.4, len = 0.5;
  var ids = [];
  for (var k = 0; k < 3; k++) {
    (function (idx) {
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Beat ring ' + idx, c.parent, G.ellipse(0, 0, r0, r0), { stroke: col, width: 1.8 * u, alpha: base });
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), since = ((env.ltb % len) + len) % len, p = (since + idx * len) / (len * 3);
        if (p >= 1) return { alpha: 0 };
        var r = mix(r0, r1, E.outCubic(p)) / r0;
        return { 'scale.x': r, 'scale.y': r, alpha: base * Math.pow(1 - p, 1.6) * outE(env) * inE(env, 0.4, 0, E.outCubic) };
      });
      ids.push(id);
    })(k);
  }
  return { rings: ids.length };
});

/* 21. orbitDots */
reg('orbitDots', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var tall = bb.h > bb.w * 1.2;
  var rx = tall ? Math.max(bb.w * 0.9, 50 * u) : Math.min(bb.w / 2 + 50 * u + bb.w * 0.08, W * 0.47);
  var ry = tall ? Math.min(bb.h / 2 + 50 * u + bb.h * 0.08, Hh * 0.47) : Math.max(bb.h * 0.9, 50 * u);
  var tilt = (H.p(P, 'r', 0.3) - 0.5) * 22;
  var rig = c.graph.add('null', c.cut.id + ' / Orbit rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, bb.cx, bb.cy), rotation: -tilt });
  var oid = C.shape(c.graph, c.cut, c.cut.id + ' / Orbit path', rig, G.ellipse(0, 0, rx, ry), { stroke: sc.sub, width: Math.max(1, u), alpha: 0.55 });
  C.sample(c.graph, oid, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f); return { alpha: 0.55 * E.inOutCubic(cl(env.lt / 0.7)) * outE(env) };
  });
  var nd = 2 + (H.p(P, 'n', 1) | 0) % 3, dir = P.right ? 1 : -1, th0 = H.p(P, 'r', 0.3) * TAU;
  for (var d = 0; d < nd; d++) {
    (function (idx) {
      var sz = (idx === 0 ? 5 : 3.2) * u, w = (0.35 + idx * 0.22) * dir;
      var did = C.shape(c.graph, c.cut, c.cut.id + ' / Orbit dot ' + idx, rig, G.ellipse(0, 0, sz, sz), { fill: idx === 0 ? sc.accent : sc.fg, alpha: 1 });
      C.sample(c.graph, did, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), th = th0 + idx * TAU / nd + env.ltb * w;
        return { 'position.x': Math.cos(th) * rx, 'position.y': -Math.sin(th) * ry, alpha: E.inOutCubic(cl(env.lt / 0.7)) * outE(env) };
      });
    })(d);
  }
  return { orbit: oid };
});

/* 22. constellation */
reg('constellation', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var w = cl(Math.min(W, Hh) * 0.3, 190 * u, 340 * u), h = w * 0.62, seed = H.p(P, 'seed', c.cut.seed || 79);
  var sp = P.corner ? H.cornerSpot(c, bb, w, h, P, 1) : H.nearBB(c, bb, w, h, P, 30 * u), a0 = sp.ok ? 1 : 0.35;
  var n = 5 + (H.p(P, 'n', 1) | 0), cells = [];
  for (var i = 0; i < 12; i++) cells.push([i % 4, Math.floor(i / 4), R.random(seed, i, 1)]);
  cells.sort(function (a, b) { return a[2] - b[2]; });
  var pts = cells.slice(0, n).map(function (cell, idx) {
    return [sp.x + w * (cell[0] + 0.5 + R.rs(seed, idx, 2) * 0.35) / 4, sp.y + h * (cell[1] + 0.5 + R.rs(seed, idx, 3) * 0.35) / 3];
  }).sort(function (a, b) { return a[0] - b[0]; });
  var lid = C.shape(c.graph, c.cut, c.cut.id + ' / Constellation lines', c.parent, H.polyCmds(c, [pts], false), { stroke: sc.sub, width: Math.max(1, u), alpha: 0.7 * a0 });
  C.sample(c.graph, lid, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f); return { alpha: 0.7 * a0 * E.inOutCubic(cl((env.lt - 0.1) / 0.8)) * outE(env) };
  });
  var stars = pts.map(function (pt, idx) { return [pt[0], pt[1], (R.random(seed, idx, 4) < 0.3 ? 3.6 : 2.2) * u]; });
  var sid = C.shape(c.graph, c.cut, c.cut.id + ' / Constellation stars', c.parent, H.dotCmds(c, stars), { fill: sc.fg, alpha: a0 });
  C.sample(c.graph, sid, c.cut.start, c.cut.end, function (f) { return { alpha: a0 * outE(R.env(c, f)) }; });
  H.addText(c, 'Constellation label', 'C-' + pad2(((c.cut.line != null ? c.cut.line : 0) | 0) + 1), pts[0][0] + 8 * u, pts[0][1] - 12 * u, FS(c) * 0.72, { role: 'mono', align: 'left', color: sc.sub }, function (env) {
    return { alpha: a0 * inE(env, 0.3, 0.5) * outE(env) };
  });
  return { lines: lid };
});

/* 23. confetti */
reg('confetti', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var seed = H.p(P, 'seed', c.cut.seed || 83), Nn = Math.min(28, 16 + (H.p(P, 'n', 1) | 0) * 4);
  var cols = [sc.accent, sc.accent2 || sc.fg, sc.fg, sc.sub], span = Hh + 80 * u;
  for (var i = 0; i < Nn; i++) {
    (function (idx) {
      var vy = (70 + R.random(seed, idx, 2) * 110) * u, y0 = R.random(seed, idx, 3) * Hh, x0 = R.random(seed, idx, 4) * W;
      var fSway = 1 + R.random(seed, idx, 5) * 1.8, pSway = R.random(seed, idx, 6) * 6, aSway = (10 + R.random(seed, idx, 7) * 30) * u;
      var w = (11 + R.random(seed, idx, 8) * 11) * u, h = w * (0.4 + R.random(seed, idx, 9) * 0.3);
      var rot0 = R.random(seed, idx, 10) * 360, vRot = (R.random(seed, idx, 11) - 0.5) * 420, dly = R.random(seed, idx, 1) * 0.35;
      var pid = C.shape(c.graph, c.cut, c.cut.id + ' / Confetti ' + idx, c.parent, G.rect(-w / 2, -h / 2, w, h), { fill: cols[idx % 4], alpha: 0.95 });
      C.sample(c.graph, pid, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), q = E.outBack(cl((env.lt - dly) / 0.3), 1.8);
        var x = x0 + Math.sin(env.ltb * fSway + pSway) * aSway, y = wrap(y0 + vy * env.ltb, -40 * u, span);
        var al = H.clearOf(bb, x, y, 10 * u, 24 * u), sp = H.toScene(c, x, y);
        return { 'position.x': sp[0], 'position.y': sp[1], rotation: -(rot0 + env.ltb * vRot), 'scale.x': Math.max(0.01, q), 'scale.y': Math.max(0.01, q * Math.abs(Math.cos(env.ltb * 3 + idx))), alpha: al > 0.4 ? 0.95 * outE(env) : 0 };
      });
    })(i);
  }
  return { count: Nn };
});

/* 24. petals */
reg('petals', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var seed = H.p(P, 'seed', c.cut.seed || 89), Nn = Math.min(20, 10 + (H.p(P, 'n', 1) | 0) * 4), dir = P.right ? 1 : -1;
  var altCol = dark(c) ? sc.fg : sc.sub;
  for (var i = 0; i < Nn; i++) {
    (function (idx) {
      var vy = (40 + R.random(seed, idx, 2) * 60) * u, vx = dir * (30 + R.random(seed, idx, 3) * 50) * u;
      var x0 = R.random(seed, idx, 4) * W, y0 = R.random(seed, idx, 7) * Hh, L = (24 + R.random(seed, idx, 8) * 20) * u;
      var cmds = PETAL.map(function (pt, j) { return [j ? 'L' : 'M', pt[0] * L, -pt[1] * L]; }).concat([['Z']]);
      var col = R.random(seed, idx, 13) < 0.7 ? sc.accent : altCol;
      var pid = C.shape(c.graph, c.cut, c.cut.id + ' / Petal ' + idx, c.parent, cmds, { fill: col, alpha: 0.9 });
      var rot0 = R.random(seed, idx, 9) * 360, vRot = (R.random(seed, idx, 10) - 0.5) * 160, dly = R.random(seed, idx, 1) * 0.4;
      C.sample(c.graph, pid, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), q = E.outCubic(cl((env.lt - dly) / 0.35));
        var x = wrap(x0 + vx * env.ltb + Math.sin(env.ltb * 1.2 + idx) * 30 * u, -60 * u, W + 120 * u);
        var y = wrap(y0 + vy * env.ltb, -60 * u, Hh + 120 * u);
        var al = H.clearOf(bb, x, y, 12 * u, 28 * u), sp = H.toScene(c, x, y);
        return { 'position.x': sp[0], 'position.y': sp[1], rotation: -(rot0 + env.ltb * vRot), 'scale.x': Math.max(0.01, q * (0.3 + 0.7 * Math.abs(Math.cos(env.ltb * 2 + idx)))), 'scale.y': Math.max(0.01, q), alpha: al > 0.45 ? 0.9 * outE(env) : 0 };
      });
    })(i);
  }
  return { count: Nn };
});

/* 25. rainStreaks (back) */
reg('rainStreaks', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c);
  var seed = H.p(P, 'seed', c.cut.seed || 97), sl = (P.right ? 1 : -1) * (8 + H.p(P, 'r', 0.4) * 10) * DEG, tn = Math.tan(sl);
  var col = dark(c) ? sc.sub : sc.fg, dkMul = dark(c) ? 1 : 0.75;
  for (var band = 0; band < 3; band++) {
    (function (bi) {
      var segs = [], vy = (1200 + bi * 500) * u;
      for (var i = 0; i < 24; i++) {
        var len = (36 + (bi * 0.35 + R.random(seed, bi, i, 1) * 0.3) * 80) * u;
        var y = R.random(seed, bi, i, 2) * (Hh + 240 * u) - 120 * u;
        var x = R.random(seed, bi, i, 3) * (W + Hh * Math.abs(tn)) - (tn > 0 ? Hh * tn : 0) + y * tn;
        segs.push([x, y, x + len * tn, y + len]);
      }
      var al = [0.18, 0.3, 0.46][bi] * dkMul;
      var rid = C.shape(c.graph, c.cut, c.cut.id + ' / Rain layer ' + bi, c.parent, H.segCmds(c, segs), { stroke: col, width: Math.max(1, [0.9, 1.2, 1.6][bi] * u), alpha: al });
      C.sample(c.graph, rid, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), cyc = (vy * env.ltb) % (Hh * 0.5);
        return { 'position.x': -cyc * tn, 'position.y': -cyc, alpha: al * outE(env) * inE(env, 0.45, 0, E.outCubic) };
      });
    })(band);
  }
  return { layers: 3 };
});

/* 26. snow (back) */
reg('snow', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c);
  var seed = H.p(P, 'seed', c.cut.seed || 101), col = dark(c) ? sc.fg : sc.sub, dkMul = dark(c) ? 1 : 0.55;
  for (var lay = 0; lay < 3; lay++) {
    (function (li) {
      var dots = [], vy = (24 + li * 22) * u;
      for (var i = 0; i < 24; i++) {
        var x = R.random(seed, li, i, 5) * W, y = R.random(seed, li, i, 4) * Hh, rad = [2, 3.4, 5.6][li] * u * (0.8 + R.random(seed, li, i, 2) * 0.4);
        dots.push([x, y, rad]);
      }
      var al = [0.35, 0.55, 0.75][li] * dkMul;
      var sid = C.shape(c.graph, c.cut, c.cut.id + ' / Snow layer ' + li, c.parent, H.dotCmds(c, dots), { fill: col, alpha: al });
      C.sample(c.graph, sid, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f);
        return { 'position.x': Math.sin(env.ltb * 0.9 + li) * (8 + li * 10) * u + (P.right ? 1 : -1) * env.ltb * 8 * u, 'position.y': -((vy * env.ltb) % (Hh * 0.4)), alpha: al * outE(env) * inE(env, 0.5, 0, E.outCubic) };
      });
    })(lay);
  }
  return { layers: 3 };
});

/* 27. lightLeak (back) */
reg('lightLeak', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var dk = dark(c), seed = H.p(P, 'seed', c.cut.seed || 107);
  var c1 = sc.accent || sc.sub, c2 = sc.accent2 || c1;
  var sx = P.right ? 1 : -1, sy = P.low ? 1 : -1, M = Math.max(W, Hh);
  var bx1 = (sx > 0 ? W : 0) + sx * M * 0.05, by1 = (sy > 0 ? Hh : 0) * 0.9 + Hh * 0.05;
  var r1 = M * R.rr(0.42, 0.6, seed, 1), r2 = M * R.rr(0.22, 0.32, seed, 3);
  var baseA = dk ? 0.28 : 0.18;
  var rings = [
    [bx1, by1, r1, c1, baseA * 0.55],
    [bx1, by1, r1 * 0.55, c1, baseA * 0.9],
    [(sx > 0 ? W : 0) - sx * M * 0.02, Hh * R.rr(0.3, 0.7, seed, 2), r2, c2, baseA * 0.75]
  ];
  rings.forEach(function (spec, idx) {
    var id = H.circle(c, 'Light leak ' + idx, spec[0], spec[1], spec[2], spec[2], { fill: spec[3], alpha: spec[4] });
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
      var env = R.env(c, f), br = 0.85 + 0.15 * Math.sin(env.ltb * 1.4 + H.p(P, 'r', 0) * 6);
      return { alpha: spec[4] * br * outE(env) * inE(env, 0.6, 0, E.outCubic) };
    });
  });
  return { blobs: rings.length };
});

/* 28. bokeh (back) */
reg('bokeh', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var seed = H.p(P, 'seed', c.cut.seed || 113), Nn = Math.min(14, 8 + (H.p(P, 'n', 1) | 0) * 3), hex = (H.p(P, 'v', 0) | 0) % 2 === 1;
  var M = Math.min(W, Hh), cols = [sc.accent, sc.accent2 || sc.fg, sc.fg], dkMul = dark(c) ? 1 : 0.55;
  for (var i = 0; i < Nn; i++) {
    (function (idx) {
      var rad = M * (0.04 + R.random(seed, idx, 4) * 0.09);
      var x = R.random(seed, idx, 2) * W, y = R.random(seed, idx, 3) * Hh, col = cols[idx % 3];
      var cmds = hex ? (function () {
        var o = []; for (var k = 0; k < 6; k++) { var a = k / 6 * TAU; o.push([k ? 'L' : 'M', Math.cos(a) * rad, Math.sin(a) * rad]); } o.push(['Z']); return o;
      })() : G.ellipse(0, 0, rad, rad);
      var al = (0.08 + R.random(seed, idx, 7) * 0.14) * dkMul;
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Bokeh ' + idx, c.parent, cmds, { fill: col, stroke: col, width: 1.5, alpha: al });
      var dly = R.random(seed, idx, 1) * 0.4, vx = R.rs(seed, idx, 5) * 18, vy = R.rs(seed, idx, 6) * 14;
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), ff = E.outCubic(cl((env.lt - dly) / 0.6));
        var sp = H.toScene(c, x + env.ltb * vx, y + env.ltb * vy), s = Math.max(0.05, 1.5 - 0.5 * ff);
        return { 'position.x': sp[0], 'position.y': sp[1], 'scale.x': s, 'scale.y': s, alpha: al * ff * outE(env) };
      });
    })(i);
  }
  return { count: Nn };
});

/* 29. speedCorner */
reg('speedCorner', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var seed = H.p(P, 'seed', c.cut.seed || 127), pad = 30 * u + bb.h * 0.2, A = bb.w / 2 * 1.1 + pad, B = bb.h / 2 * 1.15 + pad;
  var Nn = Math.min(80, 56 + (H.p(P, 'n', 1) | 0) * 12), polys = [];
  for (var i = 0; i < Nn; i++) {
    var th = R.random(seed, i, 1) * TAU;
    if (P.corner) {
      var q = Math.floor(R.random(seed, i, 2) * 4), base = Math.atan2((q < 2 ? -1 : 1) * Hh, (q % 2 ? 1 : -1) * W);
      th = base + (R.random(seed, i, 3) - 0.5) * 0.7;
    }
    var cc = Math.cos(th), ss = Math.sin(th);
    var tx = cc > 0 ? (W + 4 - bb.cx) / cc : cc < 0 ? (-4 - bb.cx) / cc : 1e9;
    var ty = ss > 0 ? (Hh + 4 - bb.cy) / ss : ss < 0 ? (-4 - bb.cy) / ss : 1e9;
    var dEdge = Math.min(tx, ty), dIn = superR(A, B, 4, th) + (20 + R.random(seed, i, 4) * 0.35 * Math.max(0, dEdge - superR(A, B, 4, th)));
    if (dEdge - dIn < 30 * u) continue;
    var wd = (1.2 + R.random(seed, i, 6) * 4.5) * u, nx = -ss * wd, ny = cc * wd;
    var ex = bb.cx + cc * dEdge, ey = bb.cy + ss * dEdge;
    polys.push([[ex + nx, ey + ny], [ex - nx, ey - ny], [bb.cx + cc * dIn, bb.cy + ss * dIn]]);
  }
  if (!polys.length) return { skip: true };
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / SpeedCorner', c.parent, H.polyCmds(c, polys, true), { fill: dark(c) ? sc.fg : (sc.ink || sc.fg), alpha: 0.8 });
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), jit = 0.94 + 0.08 * R.random(seed, env.step, 9);
    return { 'scale.x': jit, 'scale.y': jit, alpha: 0.8 * E.outExpo(cl(env.lt / 0.25)) * outE(env) };
  });
  return { count: polys.length };
});

/* 30. risingParticles (back) */
reg('risingParticles', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c);
  var seed = H.p(P, 'seed', c.cut.seed || 131), Nn = Math.min(28, 18 + (H.p(P, 'n', 1) | 0) * 5);
  var col = (P.accent || (H.p(P, 'v', 0) | 0) % 3 === 1) ? sc.accent : (dark(c) ? sc.fg : sc.sub), span = Hh + 120 * u;
  for (var i = 0; i < Nn; i++) {
    (function (idx) {
      var vy = (40 + R.random(seed, idx, 1) * 90) * u, y0 = R.random(seed, idx, 2) * span, x0 = R.random(seed, idx, 3) * W;
      var f = 0.7 + R.random(seed, idx, 4), ph = R.random(seed, idx, 5) * 6, s = (1.6 + R.random(seed, idx, 6) * 2.6) * u;
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Ember ' + idx, c.parent, G.ellipse(0, 0, s, s), { fill: col, alpha: 0.85 });
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (fr) {
        var env = R.env(c, fr), y = Hh + 60 * u - wrap(y0 + vy * env.ltb, 0, span), p = cl(1 - y / Hh);
        var fade = Math.pow(Math.sin(Math.PI * p), 0.7), sp = H.toScene(c, x0 + Math.sin(env.ltb * f + ph) * 14 * u, y);
        return { 'position.x': sp[0], 'position.y': sp[1], alpha: fade * 0.85 * outE(env) * inE(env, 0.45, 0, E.outCubic) };
      });
    })(i);
  }
  return { count: Nn };
});

/* 31. twinkle */
reg('twinkle', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var seed = H.p(P, 'seed', c.cut.seed || 137), K = Math.min(7, 3 + (H.p(P, 'n', 1) | 0) + (P.big ? 1 : 0));
  var pad = 16 * u + bb.h * 0.12, X0 = bb.x0 - pad, X1 = bb.x1 + pad, Y0 = bb.y0 - pad, Y1 = bb.y1 + pad;
  var per = 2 * (X1 - X0 + Y1 - Y0), created = 0;
  for (var i = 0; i < K; i++) {
    (function (idx) {
      var t = (idx + R.random(seed, idx, 1) * 0.6) / K * per, x, y;
      if (t < X1 - X0) { x = X0 + t; y = Y0; }
      else if ((t -= X1 - X0) < Y1 - Y0) { x = X1; y = Y0 + t; }
      else if ((t -= Y1 - Y0) < X1 - X0) { x = X1 - t; y = Y1; }
      else { t -= X1 - X0; x = X0; y = Y1 - t; }
      x = cl(x + R.rs(seed, idx, 2) * 14 * u, 16 * u, W - 16 * u);
      y = cl(y + R.rs(seed, idx, 3) * 14 * u, 16 * u, Hh - 16 * u);
      if (H.clearOf(bb, x, y, 4 * u, 1) < 1) return;
      var Rr = (idx === 0 ? 30 : 13 + R.random(seed, idx, 4) * 12) * u;
      var pts = glintPts(0, 0, Rr, Rr * 0.2, 0).map(function (pt, j) { return [j ? 'L' : 'M', pt[0], -pt[1]]; }).concat([['Z']]);
      var col = idx % 3 === 0 ? sc.accent : sc.fg, cyc = 1.3 + R.random(seed, idx, 5) * 0.8, ph0 = R.random(seed, idx, 7), dly = R.random(seed, idx, 6) * 0.3;
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Twinkle ' + idx, c.parent, pts, { fill: col, alpha: 1 });
      c.graph.byId[id].attrs.position = H.toScene(c, x, y);
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), ph = ((env.ltb - dly) / cyc + ph0) % 1;
        var intro = E.outBack(cl((env.lt - dly) / 0.3), 2);
        var s = Math.min(intro, env.lt > 0.6 ? 0.25 + 0.75 * Math.pow(Math.sin(Math.PI * ph), 2) : intro) * outE(env);
        return { 'scale.x': Math.max(0.01, s), 'scale.y': Math.max(0.01, s), alpha: s > 0.02 ? 1 : 0 };
      });
      created++;
    })(i);
  }
  return { count: created };
});

/* 32. brushStroke (back) */
reg('brushStroke', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c);
  var seed = H.p(P, 'seed', c.cut.seed || 139), v = (H.p(P, 'v', 0) | 0) % 3;
  var col = H.accCol(sc, sc.bg, v === 1), al = dark(c) ? 0.45 : 0.38;
  var T = Math.min(W, Hh) * R.rr(0.11, 0.16, seed, 1), yc = Hh * 0.5 + (P.low ? 1 : -1) * Hh * R.rr(0, 0.05, seed, 2);
  var ltr = !!P.right, xa = W * R.rr(0.06, 0.16, seed, 3), xb = W * R.rr(0.84, 0.95, seed, 4);
  var tilt = R.rs(seed, 5) * T * 0.35, bow = R.rs(seed, 6) * T * 0.25, K = 16, S = 20, segs = [];
  for (var j = 0; j < K; j++) {
    var f = j / (K - 1) - 0.5, pts = [];
    for (var k = 0; k <= S; k++) {
      var t = k / S, tt = ltr ? t : 1 - t, x = mix(xa, xb, tt), taper = 1 - Math.pow(t, 3) * 0.55;
      var y = yc + tilt * (tt - 0.5) + bow * Math.sin(tt * Math.PI) + f * T * taper + R.rs(seed, j, k, 8) * 1.2 * u;
      pts.push([x, y]);
    }
    for (var m = 0; m < pts.length - 1; m++) segs.push([pts[m][0], pts[m][1], pts[m + 1][0], pts[m + 1][1]]);
  }
  var spA = H.toScene(c, ltr ? xa : xb, yc);
  var cmds = H.segCmds(c, segs).map(function (cmd) { return [cmd[0], cmd[1] - spA[0], cmd[2] - spA[1]]; });
  var bid = C.shape(c.graph, c.cut, c.cut.id + ' / Brush stroke', c.parent, cmds, { stroke: col, width: Math.max(1.5, T / K * 1.7), alpha: al });
  c.graph.byId[bid].attrs.position = spA;
  C.sample(c.graph, bid, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), head = E.outCubic(cl(env.lt / 0.5));
    return { 'scale.x': Math.max(0.01, head), alpha: al * outE(env) * (head > 0.01 ? 1 : 0) };
  });
  return { brush: bid };
});

/* 33. tapePieces */
reg('tapePieces', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var seed = H.p(P, 'seed', c.cut.seed || 149), Lt = cl(Math.min(W, Hh) * 0.115, 90 * u, 150 * u), Ht = Lt * 0.4;
  var v = (H.p(P, 'v', 0) | 0) % 3;
  var col = [sc.accent2 && H.contrast(sc.accent2, sc.bg) > 1.6 ? sc.accent2 : sc.sub, sc.accent, sc.sub][v];
  var cs = P.big ? [[-1, -1], [1, -1], [1, 1], [-1, 1]] : P.right ? [[1, -1], [-1, 1]] : [[-1, -1], [1, 1]];
  cs.forEach(function (pair, k) {
    var sx = pair[0], sy = pair[1], cx = (sx < 0 ? bb.x0 : bb.x1) + sx * Ht * 0.55, cy = (sy < 0 ? bb.y0 : bb.y1) + sy * Ht * 0.55;
    var hl = Lt / 2, hh = Ht / 2, teeth = 5, pts = [];
    for (var i = 0; i <= teeth; i++) pts.push([-hl + (i % 2 ? 3 : 0) * u + R.rs(seed, k, i, 2) * 2 * u, -hh + i / teeth * Ht]);
    for (var j = teeth; j >= 0; j--) pts.push([hl - (j % 2 ? 3 : 0) * u + R.rs(seed, k, j, 3) * 2 * u, -hh + j / teeth * Ht]);
    var cmds = pts.map(function (pt, idx) { return [idx ? 'L' : 'M', pt[0], -pt[1]]; }).concat([['Z']]);
    var id = C.shape(c.graph, c.cut, c.cut.id + ' / Tape ' + k, c.parent, cmds, { fill: col, alpha: 0.62 });
    c.graph.byId[id].attrs.position = H.toScene(c, cx, cy);
    var rotBase = -sx * sy * 40 + R.rs(seed, k, 1) * 10;
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
      var env = R.env(c, f), q = cl((env.lt - 0.08 - k * 0.1) / 0.25), eq = E.outCubic(q), s = 1 + 0.2 * (1 - eq);
      return { rotation: -(rotBase + (1 - eq) * 10 * sx), 'scale.x': s, 'scale.y': s, alpha: 0.62 * eq * outE(env) };
    });
  });
  return { count: cs.length };
});

/* 34. scribbleCircle */
reg('scribbleCircle', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var seed = H.p(P, 'seed', c.cut.seed || 151), turns = (H.p(P, 'v', 0) | 0) % 2 ? 1.85 : 1.12;
  var pad = 14 * u + Math.min(bb.w, bb.h) * 0.08, A = Math.min(bb.w / 2 * 1.22 + pad, W * 0.48), B = Math.min(bb.h / 2 * 1.22 + pad, Hh * 0.48);
  var th0 = (P.right ? -0.3 : 0.3) * Math.PI - Math.PI / 2, dir = P.right ? 1 : -1, M = 100, pts = [];
  for (var i = 0; i <= M; i++) {
    var t = i / M, th = th0 + dir * t * turns * TAU, k = 1 + 0.03 * R.noise(t * 6, seed) + 0.05 * Math.max(0, t * turns - 0.85);
    pts.push([bb.cx + Math.cos(th) * A * k, bb.cy + Math.sin(th) * B * k]);
  }
  var col = P.accent || !dark(c) ? sc.accent : sc.fg;
  var id = H.sampleShape(c, 'Scribble loop', function (env) {
    var e = E.inOutCubic(cl((env.lt - 0.05) / 0.6));
    var seg = H.partPts(pts, 0, Math.max(0.03, e));
    return H.polyCmds(c, [seg.length >= 2 ? seg : pts], false);
  }, { stroke: col, width: 3 * u, alpha: 0.95 }, function (env) {
    return { alpha: 0.95 * E.inOutCubic(cl((env.lt - 0.05) / 0.6)) * outE(env) };
  });
  return { loop: id };
});

/* 35. scribbleUnder */
reg('scribbleUnder', 'front', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), seed = H.p(P, 'seed', c.cut.seed || 157);
  var vert = bb.h > bb.w * 1.3, v = (H.p(P, 'v', 0) | 0) % 3, L0 = vert ? bb.y0 : bb.x0, L1 = vert ? bb.y1 : bb.x1, len = L1 - L0;
  var base = vert ? bb.x1 + 14 * u + bb.w * 0.1 : bb.y1 + 14 * u + bb.h * 0.14;
  function mapPt(ac) { return vert ? [base + ac[1], ac[0]] : [ac[0], base + ac[1]]; }
  var strokes = [];
  if (v === 0) {
    var s1 = [], s2 = [];
    for (var i = 0; i <= 24; i++) { var t = i / 24; s1.push(mapPt([L0 - 8 * u + (len + 16 * u) * t, Math.sin(t * Math.PI) * 5 * u - t * 4 * u])); }
    for (var j = 0; j <= 16; j++) { var t2 = j / 16; s2.push(mapPt([L0 + len * 0.18 + len * 0.78 * t2, 11 * u + Math.sin(t2 * Math.PI) * 4 * u])); }
    strokes.push(s1, s2);
  } else if (v === 1) {
    var s = [], lam = cl(len / 22, 30 * u, 64 * u);
    for (var x = 0; x <= len + 0.1; x += 6 * u) s.push(mapPt([L0 + x, Math.sin(x / lam * TAU) * 5 * u]));
    strokes.push(s);
  } else {
    var sz = [];
    for (var p = 0; p <= 5; p++) sz.push(mapPt([L0 + (p % 2 ? len * 0.96 : len * 0.04) + R.rs(seed, p, 4) * 8 * u, p / 5 * 14 * u]));
    strokes.push(sz);
  }
  var col = P.accent || !dark(c) ? sc.accent : sc.fg;
  strokes.forEach(function (pts, k) {
    H.sampleShape(c, 'Scribble under ' + k, function (env) {
      var e = E.inOutCubic(cl((env.lt - 0.05 - k * 0.28) / (v === 2 ? 0.55 : 0.35)));
      var seg = H.partPts(pts, 0, Math.max(0.03, e));
      return H.polyCmds(c, [seg.length >= 2 ? seg : pts], false);
    }, { stroke: col, width: (k ? 2.6 : 3.4) * u, alpha: 0.95 }, function (env) {
      return { alpha: 0.95 * E.inOutCubic(cl((env.lt - 0.05 - k * 0.28) / (v === 2 ? 0.55 : 0.35))) * outE(env) };
    });
  });
  return { strokes: strokes.length };
});

/* 36. crossOut */
reg('crossOut', 'front', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var n0 = c.cut.nodes && c.cut.nodes[0], raw = String((c.cut.source && c.cut.source.text) || (n0 && n0.text) || '').replace(/\s+/g, '');
  var arr = Array.from(raw); if (!arr.length) return { skip: true };
  var word = arr.slice(0, Math.min(arr.length, 2 + ((H.p(P, 'v', 0) | 0) % 3))).join('');
  var fs = cl(bb.h * 0.3, 22 * u, 46 * u), tw = textW(word, fs, 0.1);
  var sp = H.nearBB(c, bb, tw + 24 * u, fs * 1.8, Object.assign({}, P, { low: false }), 16 * u);
  var a0 = sp.ok ? 1 : 0.4;
  H.addText(c, 'CrossOut word', word, sp.cx, sp.cy, fs, { role: 'serif', align: 'center', color: sc.sub }, function (env) {
    return { alpha: a0 * inE(env, 0.2, 0) * outE(env) };
  });
  var x0 = sp.cx - tw / 2 - 6 * u, x1 = sp.cx + tw / 2 + 6 * u;
  var s1 = [[x0, sp.cy - fs * 0.05], [x1, sp.cy - fs * 0.12]];
  var id = H.sampleShape(c, 'CrossOut stroke', function (env) {
    var e = E.inOutCubic(cl((env.lt - 0.3) / 0.25));
    var seg = H.partPts(s1, 0, Math.max(0.05, e));
    return H.polyCmds(c, [seg.length >= 2 ? seg : s1], false);
  }, { stroke: sc.accent, width: 2.4 * u, alpha: 0.95 * a0 }, function (env) {
    return { alpha: 0.95 * a0 * E.inOutCubic(cl((env.lt - 0.3) / 0.25)) * outE(env) };
  });
  return { strike: id };
});

/* 37. highlightMark */
reg('highlightMark', 'front', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var col = H.accCol(sc, sc.bg, false), al = dark(c) ? 0.42 : 0.38;
  var vert = bb.h > bb.w * 1.25, s = vert ? bb.w : bb.h;
  var bar = vert
    ? [bb.x0 + s * 0.52, bb.y0 - s * 0.12, s * 0.54, bb.h + s * 0.24]
    : [bb.x0 - s * 0.12, bb.y0 + s * 0.46, bb.w + s * 0.24, s * 0.6];
  var sp = H.toScene(c, vert ? bar[0] + bar[2] / 2 : bar[0], vert ? bar[1] : bar[1] + bar[3] / 2);
  var local = vert ? G.rect(-bar[2] / 2, -bar[3], bar[2], bar[3]) : G.rect(0, -bar[3] / 2, bar[2], bar[3]);
  var hid = C.shape(c.graph, c.cut, c.cut.id + ' / Highlight', c.parent, local, { fill: col, alpha: al });
  c.graph.byId[hid].attrs.position = sp;
  C.sample(c.graph, hid, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), e = E.inOutCubic(cl((env.lt - 0.1) / 0.4));
    return vert
      ? { 'scale.y': Math.max(0.01, e), alpha: al * (e > 0.01 ? 1 : 0) * outE(env) }
      : { 'scale.x': Math.max(0.01, e), alpha: al * (e > 0.01 ? 1 : 0) * outE(env) };
  });
  return { highlight: hid };
});

/* 38. heartsStars */
reg('heartsStars', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var seed = H.p(P, 'seed', c.cut.seed || 163), K = Math.min(7, 3 + (H.p(P, 'n', 1) | 0) + (P.big ? 1 : 0));
  var v = (H.p(P, 'v', 0) | 0) % 3, pad = 26 * u + bb.h * 0.15, X0 = bb.x0 - pad, X1 = bb.x1 + pad, Y0 = bb.y0 - pad, Y1 = bb.y1 + pad;
  var per = 2 * (X1 - X0 + Y1 - Y0), cols = [sc.accent, sc.fg, sc.accent2 || sc.accent];
  for (var i = 0; i < K; i++) {
    (function (idx) {
      var t = ((idx + 0.3 + R.random(seed, idx, 1) * 0.4) / K) * per, x, y;
      if (t < X1 - X0) { x = X0 + t; y = Y0; }
      else if ((t -= X1 - X0) < Y1 - Y0) { x = X1; y = Y0 + t; }
      else if ((t -= Y1 - Y0) < X1 - X0) { x = X1 - t; y = Y1; }
      else { t -= X1 - X0; x = X0; y = Y1 - t; }
      x = cl(x, 24 * u, W - 24 * u); y = cl(y, 24 * u, Hh - 24 * u);
      if (H.clearOf(bb, x, y, 6 * u, 1) < 1) return;
      var s = (idx === 0 ? 36 : 18 + R.random(seed, idx, 2) * 14) * u;
      var isHeart = v === 0 || (v === 2 && idx % 2 === 0);
      var pts = (isHeart ? heartPts(0, 0, s) : star5(0, 0, s, s * 0.45, -90)).map(function (pt, j) { return [j ? 'L' : 'M', pt[0], -pt[1]]; }).concat([['Z']]);
      var col = cols[idx % 3], hollow = R.random(seed, idx, 4) < 0.35;
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / HeartStar ' + idx, c.parent, pts, hollow ? { stroke: col, width: 2.2 * u, alpha: 1 } : { fill: col, alpha: 1 });
      var sp0 = H.toScene(c, x, y), rBase = R.rs(seed, idx, 3) * 15;
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), q = E.outBack(cl((env.lt - 0.05 - idx * 0.07) / 0.3), 2.4) * outE(env);
        return { 'position.x': sp0[0], 'position.y': sp0[1] - Math.sin(env.ltb * 3 + idx * 1.7) * 3 * u, rotation: -(rBase + Math.sin(env.ltb * 2 + idx) * 10), 'scale.x': Math.max(0.01, q), 'scale.y': Math.max(0.01, q), alpha: q > 0.01 ? 1 : 0 };
      });
    })(i);
  }
  return { count: K };
});

/* 39. watermarkKanji (back) */
reg('watermarkKanji', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c);
  var ch = H.lyricChar(c, H.p(P, 'v', 0));
  if (!ch) return { skip: true };
  var v = H.p(P, 'v', 0) | 0, outline = v % 2 === 1, S = Math.min(Hh * 0.86, W * 0.92);
  var x = P.right ? W - S * 0.3 : S * 0.3, y = Hh * 0.5 + (P.low ? 1 : -1) * Hh * 0.06;
  var id = H.addText(c, 'Watermark kanji', ch, x, y, S, {
    role: v % 3 === 0 ? 'display' : 'serif',
    color: outline ? sc.sub : (sc.dim || sc.sub),
    fill: !outline, stroke: outline, strokeColor: sc.sub, strokeWidth: 1.6 * u,
    alpha: outline ? 0.32 : 0.85
  }, function (env) {
    var e = E.outCubic(cl(env.lt / 0.6)), scv = 1.06 - 0.06 * e;
    return { 'scale.x': scv, 'scale.y': scv, 'position.y': H.toScene(c, x, y - env.ltb * 5 * u)[1], alpha: (outline ? 0.32 : 0.85) * e * outE(env) };
  });
  return { glyph: id };
});

/* 40. verticalStrip */
reg('verticalStrip', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), m = H.decMG(c), bb = H.decBB(c);
  var n0 = c.cut.nodes && c.cut.nodes[0], raw = String((c.cut.source && c.cut.source.text) || (n0 && n0.text) || '').replace(/\s+/g, '');
  var chars = Array.from(raw).slice(0, 14);
  if (chars.length < 2) return { skip: true };
  var fs = cl(Math.min(W, Hh) * 0.022, 15 * u, 24 * u), step = fs * 1.28, clear = 44 * u;
  var x = P.right ? W - m * 0.95 : m * 0.95;
  var hClear = x + fs * 1.8 < bb.x0 - clear || x - fs * 1.8 > bb.x1 + clear;
  if (!hClear && !P.right) x = W - m * 0.95;
  var y0 = P.low ? Hh - m * 1.3 - chars.length * step : m * 1.6 + fs;
  chars.forEach(function (ch, idx) {
    H.addText(c, 'VStrip char ' + idx, ch, x, y0 + idx * step, fs, { role: (H.p(P, 'v', 0) | 0) % 2 ? 'serif' : 'body', align: 'center', color: sc.fg }, function (env) {
      var shown = cl((env.lt - 0.08 - idx * 0.03) / 0.18);
      return { alpha: 0.9 * shown * outE(env) };
    });
  });
  var rx = x + (x > W / 2 ? -1 : 1) * fs * 1.1, th = chars.length * step;
  H.line(c, 'VStrip rule', [[rx, y0 - fs * 0.5], [rx, y0 + th]], sc.sub, Math.max(1, u), 0.7);
  H.rect(c, 'VStrip mark', rx - 2 * u, y0 - fs * 0.5 - 12 * u, 4 * u, 8 * u, { fill: sc.accent, alpha: 1 });
  H.addText(c, 'VStrip num', pad2(((c.cut.line != null ? c.cut.line : 0) | 0) + 1), x, y0 - fs * 1.6, FS(c) * 0.75, { role: 'mono', align: 'center', color: sc.sub });
  return { count: chars.length };
});

/* 41. bracketsJP */
function lentilPts(xo, yT, yB, aw, tb, side) {
  var pts = [[xo, yT], [xo - side * aw, yT]], M = 14, h = yB - yT;
  for (var i = 1; i < M; i++) {
    var t = i / M, b = Math.pow(Math.sin(t * Math.PI), 0.7);
    pts.push([xo - side * (aw - (aw - tb) * b), yT + h * t]);
  }
  pts.push([xo - side * aw, yB], [xo, yB]);
  return pts;
}

reg('bracketsJP', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var vert = bb.h > bb.w * 1.25, col = P.accent ? sc.accent : sc.fg;
  if (!vert) {
    var h = cl(bb.h * 1.08 + 16 * u, 40 * u, Hh * 0.6), aw = Math.min(h * 0.24, 26 * u + Math.min(W, Hh) * 0.028), tb = aw * 0.3, gap = 12 * u + bb.h * 0.05;
    var xl = Math.max(bb.x0 - gap, aw + 6 * u), xr = Math.min(bb.x1 + gap, W - aw - 6 * u);
    var pL = lentilPts(0, -h / 2, h / 2, aw, tb, -1), pR = lentilPts(0, -h / 2, h / 2, aw, tb, 1);
    [[xl - aw, pL, -1], [xr + aw, pR, 1]].forEach(function (spec, idx) {
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / BracketsJP ' + idx, c.parent, spec[1].map(function (pt, j) { return [j ? 'L' : 'M', pt[0], -pt[1]]; }).concat([['Z']]), { fill: col, alpha: 1 });
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), e = E.outExpo(cl(env.lt / 0.45)), pOut = E.inCubic(env.pOut), sl = (1 - e + pOut * 0.6) * 60 * u;
        var sp = H.toScene(c, spec[0] + spec[2] * sl, bb.cy);
        return { 'position.x': sp[0], 'position.y': sp[1], 'scale.y': 0.5 + 0.5 * e, alpha: cl(env.lt / 0.12) * outE(env) };
      });
    });
  } else {
    var wv = cl(bb.w * 1.05 + 16 * u, 40 * u, W * 0.6), aw2 = Math.min(wv * 0.24, 26 * u + Math.min(W, Hh) * 0.028), tb2 = aw2 * 0.3, gap2 = 12 * u + bb.w * 0.05;
    var yt = Math.max(bb.y0 - gap2, aw2 + 6 * u), yb = Math.min(bb.y1 + gap2, Hh - aw2 - 6 * u);
    function mkV(dir) {
      var p = [[-wv / 2, dir * aw2], [-wv / 2, 0]];
      for (var i = 1; i < 14; i++) { var t = i / 14, b = Math.pow(Math.sin(t * Math.PI), 0.7); p.push([-wv / 2 + wv * t, dir * (aw2 - tb2) * b]); }
      p.push([wv / 2, 0], [wv / 2, dir * aw2]);
      return p;
    }
    [[yt, -1], [yb, 1]].forEach(function (spec, idx) {
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / BracketsJP_V ' + idx, c.parent, mkV(spec[1]).map(function (pt, j) { return [j ? 'L' : 'M', pt[0], -pt[1]]; }).concat([['Z']]), { fill: col, alpha: 1 });
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), e = E.outExpo(cl(env.lt / 0.45)), pOut = E.inCubic(env.pOut), sl = (1 - e + pOut * 0.6) * 60 * u;
        var sp = H.toScene(c, bb.cx, spec[0] + spec[1] * sl);
        return { 'position.x': sp[0], 'position.y': sp[1], 'scale.x': 0.5 + 0.5 * e, alpha: cl(env.lt / 0.12) * outE(env) };
      });
    });
  }
  return { vert: vert };
});

/* 42. seal */
reg('seal', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var v = H.p(P, 'v', 0) | 0, ch = H.lyricChar(c, 3 + v);
  if (!ch) return { skip: true };
  var S = cl(Math.min(W, Hh) * 0.074, 48 * u, 92 * u), seed = H.p(P, 'seed', c.cut.seed || 173);
  var sp = H.nearBB(c, bb, S * 1.3, S * 1.3, Object.assign({}, P, { right: v % 3 !== 2, low: true }), 14 * u);
  var a0 = sp.ok ? 1 : 0.4, round = v % 2 === 1, h = S / 2;
  var rig = c.graph.add('null', c.cut.id + ' / Seal rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, sp.cx, sp.cy) });
  var rot0 = R.rs(seed, 1) * 5;
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), p = cl((env.lt - 0.08) / 0.3), q = E.outCubic(p), s = mix(1.5, 1, q);
    return { 'scale.x': s, 'scale.y': s, rotation: -(rot0 - (1 - q) * 12) };
  });
  var cmds = round ? G.ellipse(0, 0, h, h) : G.rect(-h, -h, S, S);
  var bid = C.shape(c.graph, c.cut, c.cut.id + ' / Seal body', rig, cmds, { fill: sc.accent, alpha: 0.95 * a0 });
  C.sample(c.graph, bid, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), p = cl((env.lt - 0.08) / 0.3);
    return { alpha: 0.95 * a0 * cl(p * 4) * outE(env) };
  });
  H.addText(c, 'Seal char', ch, W / 2, Hh / 2, S * 0.62, {
    role: 'serif', align: 'center', color: sc.bg, parent: rig
  }, function (env) {
    var p = cl((env.lt - 0.08) / 0.3); return { alpha: a0 * cl(p * 4) * outE(env) };
  });
  return { seal: bid };
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZHelpers);
