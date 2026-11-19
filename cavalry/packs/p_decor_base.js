/* JIZURA Cavalry Pack: decor base (15 core recipes from src/07_decor.js) */
(function (N, G, C, R, V, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, TAU = H.TAU, DEG = H.DEG;

function reg(key, layerType, build, diffs) {
  N.register('decor', key, {
    source: 'src/07_decor.js J.DECOR.' + key,
    scope: 'cut',
    build: function (c) {
      var n0 = c.graph.layers.length;
      var res = build(c);
      if (layerType === 'back') H.placeBackFrom(c, n0);
      return res;
    },
    differences: diffs || ['Native Cavalry editable shape/text geometry following src/07_decor.js.']
  });
}

function inOut(c, f) {
  var cut = c.cut, env = R.env(c, f);
  return E.outCubic(cl(env.lt / 0.3)) * (1 - E.inCubic(env.pOut));
}

function pNum(P, k, d) {
  return H.p(P, k, d);
}

/* 1. grid (back) */
reg('grid', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var n = Math.max(2, Math.min(24, pNum(P, 'n', 8)));
  var g = Hh / n, segs = [];
  for (var x = (W / 2) % g; x < W; x += g) segs.push([x, 0, x, Hh]);
  for (var y = (Hh / 2) % g; y < Hh; y += g) segs.push([0, y, W, y]);
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Decor grid', c.parent, H.segCmds(c, segs), { stroke: sc.sub, width: 1, alpha: 0.12 });
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
    return { alpha: 0.12 * inOut(c, f) };
  });
  return { layer: id };
});

/* 2. stripes (back) — Cavalry linearDistribution Duplicator (fallback: 13 stripe shapes) */
reg('stripes', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var px = P.corner ? W * 0.85 : W * 0.15, py = P.corner ? Hh * 0.15 : Hh * 0.85;
  var sp = H.toScene(c, px, py);
  var rig = c.graph.add('null', c.cut.id + ' / Decor stripes rig', c.parent, c.cut.start, c.cut.end, {
    position: sp, rotation: 35
  });
  var w = Hh * 0.04, col = P.accent ? sc.accent : (sc.dim || sc.sub);
  var stripH = Hh * 0.36, count = 13, span = (count - 1) * w * 2;
  var profile = (c.options && c.options.hostProfile) || {};
  if (profile.duplicator !== false && typeof C.duplicator === 'function') {
    var src = C.shape(c.graph, c.cut, c.cut.id + ' / Stripe source', rig, G.rect(-w / 2, -stripH / 2, w, stripH), { fill: col, alpha: 0.9 });
    c.graph.byId[src].attrs.hidden = true;
    var dup = C.duplicator(c.graph, c.cut, c.cut.id + ' / Decor stripes duplicator', rig, src, 'linearDistribution', {
      'generator.count': count,
      'generator.size': span,
      alpha: 0.9
    });
    C.sample(c.graph, dup, c.cut.start, c.cut.end, function (f) {
      var env = R.env(c, f), e = inOut(c, f);
      return {
        'position.x': (env.ltb * 40) % (w * 2),
        'scale.y': Math.max(0.001, e),
        alpha: 0.9 * (e > 0.005 ? 1 : 0)
      };
    });
    return { rig: rig, duplicator: dup, count: count };
  }
  var ids = [];
  for (var i = -6; i <= 6; i++) {
    (function (idx) {
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Stripe ' + idx, rig, G.rect(-w / 2, -stripH / 2, w, stripH), { fill: col, alpha: 0.9 });
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), e = inOut(c, f);
        var ox = idx * w * 2 + (env.ltb * 40) % (w * 2);
        return { 'position.x': ox, 'scale.y': Math.max(0.001, e), alpha: 0.9 * (e > 0.005 ? 1 : 0) };
      });
      ids.push(id);
    })(i);
  }
  return { rig: rig, count: ids.length };
}, ['Uses a Cavalry linearDistribution Duplicator for the 13 stripes instead of 13 separate shape layers.']);

/* 3. blobs (back) */
reg('blobs', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var seed = pNum(P, 'seed', c.cut.seed || 17), n = Math.min(6, Math.max(1, pNum(P, 'n', 2)));
  var ids = [];
  for (var k = 0; k < n; k++) {
    (function (idx) {
      var cx = R.rr(W * 0.12, W * 0.88, seed, idx, 1);
      var cy = R.rr(Hh * 0.15, Hh * 0.85, seed, idx, 2);
      var rad = R.rr(Hh * 0.06, Hh * 0.16, seed, idx, 3);
      var m = 14, cmds = [];
      for (var i = 0; i < m; i++) {
        var a = i / m * TAU, rr = rad * (0.72 + 0.5 * R.random(seed, idx, i, 4));
        var lx = Math.cos(a) * rr, ly = -Math.sin(a) * rr;
        cmds.push([i ? 'L' : 'M', lx, ly]);
      }
      cmds.push(['Z']);
      var col = idx % 2 ? sc.accent : (sc.accent2 || sc.accent);
      var sp = H.toScene(c, cx, cy);
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Blob ' + idx, c.parent, cmds, { fill: col, alpha: 0.95 });
      c.graph.byId[id].attrs.position = sp;
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f);
        var e = E.outBack(cl(env.lt / 0.35), 1.2) * (1 - E.inCubic(env.pOut));
        var s = Math.max(0.001, e * (1 + 0.06 * Math.sin(env.ltb * 3 + idx)));
        return { 'scale.x': s, 'scale.y': s, rotation: env.ltb * 8 * (idx % 2 ? 1 : -1), alpha: e > 0.01 ? 0.95 : 0 };
      });
      ids.push(id);
    })(k);
  }
  return { count: ids.length };
});

/* 4. bars (back) */
reg('bars', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var seed = pNum(P, 'seed', c.cut.seed || 29), n = Math.min(6, Math.max(1, pNum(P, 'n', 3)));
  var ids = [];
  for (var k = 0; k < n; k++) {
    (function (idx) {
      var y = Hh * (R.random(seed, idx, 11) < 0.5 ? R.rr(0.1, 0.27, seed, idx, 1) : R.rr(0.73, 0.9, seed, idx, 1));
      var h = Hh * R.rr(0.03, 0.08, seed, idx, 2), fromL = R.random(seed, idx, 3) < 0.5;
      var maxW = W * R.rr(0.35, 0.75, seed, idx, 4), m = 10, cmds = [];
      for (var i = 0; i <= m; i++) {
        var px = (fromL ? i / m * maxW : -maxW + i / m * maxW);
        var py = h / 2 - R.rs(seed, idx, i, 5) * h * 0.08;
        cmds.push([i ? 'L' : 'M', px, py]);
      }
      cmds.push(['L', (fromL ? maxW : 0) + R.rs(seed, idx, 6) * h * 0.4, -h * 0.1]);
      for (var j = m; j >= 0; j--) {
        var px2 = (fromL ? j / m * maxW : -maxW + j / m * maxW);
        var py2 = -h / 2 - R.rs(seed, idx, j, 7) * h * 0.08;
        cmds.push(['L', px2, py2]);
      }
      cmds.push(['Z']);
      var anchorX = fromL ? -10 : W + 10;
      var sp = H.toScene(c, anchorX, y);
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Rough bar ' + idx, c.parent, cmds, { fill: idx === 0 ? sc.accent : (sc.ink || sc.fg), alpha: 0.92 });
      c.graph.byId[id].attrs.position = sp;
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f);
        var e = E.outExpo(cl((env.lt - idx * 0.05) / 0.3)) * (1 - E.inExpo(env.pOut));
        return { 'scale.x': Math.max(0.001, e), alpha: e > 0.005 ? 0.92 : 0 };
      });
      ids.push(id);
    })(k);
  }
  return { count: ids.length };
});

/* 5. shapes (back) */
reg('shapes', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var seed = pNum(P, 'seed', c.cut.seed || 41), n = Math.min(10, Math.max(1, pNum(P, 'n', 5)));
  var types = ['circle', 'square', 'tri', 'halftone', 'halftone', 'ring', 'ring'];
  var cols = [sc.accent, sc.accent2 || sc.fg, sc.ink || sc.fg, sc.fg];
  var ids = [];
  for (var k = 0; k < n; k++) {
    (function (idx) {
      var kind = types[Math.floor(R.random(seed, idx, 1) * types.length)];
      var top = R.random(seed, idx, 4) < 0.5;
      var x0 = R.rr(W * 0.05, W * 0.95, seed, idx, 2);
      var y0 = top ? R.rr(Hh * 0.06, Hh * 0.24, seed, idx, 10) : R.rr(Hh * 0.76, Hh * 0.94, seed, idx, 10);
      var vx = R.rs(seed, idx, 3) * 30, vy = R.rs(seed, idx, 5) * 20;
      var r = R.rr(Hh * 0.018, Hh * 0.06, seed, idx, 6);
      var rot0 = R.random(seed, idx, 7) * 360, vRot = R.rs(seed, idx, 8) * 60;
      var dly = R.random(seed, idx, 9) * 0.3, col = cols[idx % 4];
      var cmds, paint = { fill: col, alpha: 1 };
      if (kind === 'circle') cmds = G.ellipse(0, 0, r, r);
      else if (kind === 'ring') { cmds = G.ellipse(0, 0, r, r); paint = { stroke: col, width: Math.max(2, r * 0.12), alpha: 1 }; }
      else if (kind === 'square') cmds = G.rect(-r, -r, r * 2, r * 2);
      else if (kind === 'tri') cmds = [['M', 0, r], ['L', r * 0.9, -r * 0.6], ['L', -r * 0.9, -r * 0.6], ['Z']];
      else {
        cmds = [];
        var d = r / 3.2;
        for (var i = -3; i <= 3; i++) for (var j = -3; j <= 3; j++) {
          var rr = d * 0.45 * (1 - (Math.abs(i) + Math.abs(j)) / 8);
          if (rr > 0.5) cmds = cmds.concat(G.ellipse(i * d, j * d, rr, rr));
        }
        if (cmds.length < 2) cmds = G.ellipse(0, 0, r * 0.4, r * 0.4);
      }
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Shape ' + idx, c.parent, cmds, paint);
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f);
        var q = E.outBack(cl((env.lt - dly) / 0.25), 1.8) * (1 - E.inCubic(env.pOut));
        var sp = H.toScene(c, x0 + env.ltb * vx, y0 + env.ltb * vy);
        var s = Math.max(0.001, q);
        return { 'position.x': sp[0], 'position.y': sp[1], rotation: -(rot0 + env.ltb * vRot), 'scale.x': s, 'scale.y': s, alpha: q > 0.005 ? 1 : 0 };
      });
      ids.push(id);
    })(k);
  }
  return { count: ids.length };
});

/* 6. counter (back) */
reg('counter', 'back', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var x = P.right ? W * 0.86 : W * 0.14, y = Hh * (P.low ? 0.72 : 0.3);
  var size = Hh * 0.5, col = P.accent ? sc.accent : (sc.dim || sc.sub), baseA = P.accent ? 0.9 : 1;
  var idxNum = String(((c.cut.index != null ? c.cut.index : 0) | 0) + 1).padStart(2, '0');
  var dur = Math.max(0.1, (c.cut.end - c.cut.start) / c.comp.fps);
  var fromV = pNum(P, 'from', 0), toV = pNum(P, 'to', 99);
  var ids = H.stepText(c, 'Counter', x, y, size, {
    role: 'display', color: col, alpha: baseA,
    animFn: function (env, f) { return { alpha: baseA * inOut(c, f) }; }
  }, function (env) {
    if (P.mode === 'count') {
      return String(Math.floor(mix(fromV, toV, E.outCubic(cl(env.lt / (dur * 0.8))))));
    }
    return idxNum;
  }, 14);
  return { count: ids.length };
});

/* 7. brackets (front) */
reg('brackets', 'front', function (c) {
  var P = c.preset.params || {}, sc = c.sc, bb = H.decBB(c);
  var pad = 18 + bb.h * 0.12;
  var x0 = bb.x0 - pad, x1 = bb.x1 + pad, y0 = bb.y0 - pad, y1 = bb.y1 + pad;
  var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  var L = Math.min(x1 - x0, y1 - y0) * 0.16 + 8, col = P.accent ? sc.accent : sc.fg, lw = 2.2;
  var corners = [
    [-1, -1, [[0, L], [0, 0], [L, 0]]],
    [1, -1, [[-L, 0], [0, 0], [0, L]]],
    [-1, 1, [[0, -L], [0, 0], [L, 0]]],
    [1, 1, [[-L, 0], [0, 0], [0, -L]]]
  ];
  var ids = corners.map(function (item, idx) {
    var sx = item[0], sy = item[1], pts = item[2];
    var cmds = pts.map(function (pt, i) { return [i ? 'L' : 'M', pt[0], -pt[1]]; });
    var id = C.shape(c.graph, c.cut, c.cut.id + ' / Bracket ' + idx, c.parent, cmds, { stroke: col, width: lw, alpha: 1 });
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
      var env = R.env(c, f), e = E.outExpo(cl(env.lt / 0.35)) * (1 - E.inCubic(env.pOut));
      var px = mix(cx, sx < 0 ? x0 : x1, e), py = mix(cy, sy < 0 ? y0 : y1, e);
      var sp = H.toScene(c, px, py), s = Math.max(0.05, e);
      return { 'position.x': sp[0], 'position.y': sp[1], 'scale.x': s, 'scale.y': s, alpha: e > 0.005 ? 1 : 0 };
    });
    return id;
  });
  return { corners: ids.length };
});

/* 8. rings (front) */
reg('rings', 'front', function (c) {
  var P = c.preset.params || {}, Hh = c.comp.height, sc = c.sc, bb = H.decBB(c);
  var seed = pNum(P, 'seed', c.cut.seed || 53), n = Math.min(4, Math.max(1, pNum(P, 'n', 2)));
  var R0 = Math.max(bb.w, bb.h) * 0.55 + Hh * 0.05;
  var u = H.decU(c), fs = cl(Hh * 0.015, 10, 18);
  var ids = [];
  for (var k = 0; k < n; k++) {
    (function (idx) {
      var rad = R0 * (1 + idx * 0.28 + R.random(seed, idx, 1) * 0.1);
      var a0 = R.random(seed, idx, 2) * 360, span = 360 * (0.55 + 0.45 * R.random(seed, idx, 3));
      var speed = idx % 2 ? -14 : 10;
      var arcPts = H.arcPts(0, 0, rad, 0, span, 36).map(function (pt, i) { return [i ? 'L' : 'M', pt[0], -pt[1]]; });
      var sp = H.toScene(c, bb.cx, bb.cy);
      var rig = c.graph.add('null', c.cut.id + ' / Ring rig ' + idx, c.parent, c.cut.start, c.cut.end, { position: sp });
      var rid = C.shape(c.graph, c.cut, c.cut.id + ' / Coord ring ' + idx, rig, arcPts, { stroke: sc.fg, width: Math.max(1, 1.2 * u), alpha: 0.7 });
      var dotAng = 40 * DEG, dotLocal = [Math.cos(dotAng) * rad, -Math.sin(dotAng) * rad];
      var did = C.shape(c.graph, c.cut, c.cut.id + ' / Ring dot ' + idx, rig, G.ellipse(dotLocal[0], dotLocal[1], 4, 4), { fill: sc.accent, alpha: 1 });
      var pa0 = (a0 + 40) * DEG, px = bb.cx + Math.cos(pa0) * rad, py = bb.cy + Math.sin(pa0) * rad;
      var tid = H.addText(c, 'Coord label ' + idx, 'X' + Math.round(px) + ' Y' + Math.round(py), px + 10, py - 12, fs, {
        role: 'mono', align: 'left', color: sc.sub, alpha: 0.9
      });
      C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), e = E.outExpo(cl(env.lt / 0.5)) * (1 - E.inCubic(env.pOut));
        return { rotation: -(a0 + env.ltb * speed), 'scale.x': Math.max(0.05, 0.3 + 0.7 * e), 'scale.y': Math.max(0.05, 0.3 + 0.7 * e) };
      });
      C.sample(c.graph, rid, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), e = E.outExpo(cl(env.lt / 0.5)) * (1 - E.inCubic(env.pOut));
        return { alpha: 0.7 * e };
      });
      C.sample(c.graph, did, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), e = E.outExpo(cl(env.lt / 0.5)) * (1 - E.inCubic(env.pOut));
        return { alpha: e };
      });
      if (tid) C.sample(c.graph, tid, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), e = E.outExpo(cl(env.lt / 0.5)) * (1 - E.inCubic(env.pOut));
        return { alpha: e };
      });
      ids.push(rig, rid, did);
    })(k);
  }
  return { count: n };
});

/* 9. dots (front) — Cavalry circleDistribution Duplicator (fallback: 36 dot shapes) */
reg('dots', 'front', function (c) {
  var sc = c.sc, bb = H.decBB(c), Hh = c.comp.height;
  var R0 = Math.max(bb.w, bb.h) * 0.62 + Hh * 0.04, m = 36;
  var sp = H.toScene(c, bb.cx, bb.cy);
  var rig = c.graph.add('null', c.cut.id + ' / Dots ring rig', c.parent, c.cut.start, c.cut.end, { position: sp });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f) {
    return { rotation: -(R.env(c, f).ltb * 20) };
  });
  var profile = (c.options && c.options.hostProfile) || {};
  if (profile.duplicator !== false && typeof C.duplicator === 'function') {
    var baseDot = C.shape(c.graph, c.cut, c.cut.id + ' / Ring dot source', rig, G.ellipse(0, 0, 2.5, 2.5), { fill: sc.fg, alpha: 0.85 });
    c.graph.byId[baseDot].attrs.hidden = true;
    var dup = C.duplicator(c.graph, c.cut, c.cut.id + ' / Dots ring duplicator', rig, baseDot, 'circleDistribution', {
      'generator.count': m,
      'generator.radius': R0,
      alpha: 0.85
    });
    C.sample(c.graph, dup, c.cut.start, c.cut.end, function (f) {
      return { alpha: 0.85 * inOut(c, f) };
    });
    return { rig: rig, duplicator: dup, count: m };
  }
  var ids = [];
  for (var i = 0; i < m; i++) {
    (function (idx) {
      var a = idx / m * TAU, rad = idx % 6 === 0 ? 4 : 2.2, col = idx % 6 === 0 ? sc.accent : sc.fg;
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Ring dot ' + idx, rig, G.ellipse(Math.cos(a) * R0, -Math.sin(a) * R0, rad, rad), { fill: col, alpha: 0.85 });
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
        var e = inOut(c, f);
        return { alpha: (idx / m < e ? 0.85 : 0) };
      });
      ids.push(id);
    })(i);
  }
  return { rig: rig, count: ids.length };
}, ['Uses a Cavalry circleDistribution Duplicator (3 layers total) instead of 36 separate dot layers.']);

/* 10. arrows (front) */
reg('arrows', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, bb = H.decBB(c);
  var s = cl(Hh * 0.03, 14, 40), gap = s * 0.9, lw = Math.max(2, s * 0.14);
  var ids = [];
  [-1, 1].forEach(function (side) {
    var xEdge = side < 0 ? bb.x0 - s * 1.2 : bb.x1 + s * 1.2, d = -side;
    for (var i = 0; i < 3; i++) {
      (function (idx) {
        var cmds = [['M', -d * s * 0.35, s * 0.5], ['L', d * s * 0.35, 0], ['L', -d * s * 0.35, -s * 0.5]];
        var id = C.shape(c.graph, c.cut, c.cut.id + ' / Chevron ' + side + '_' + idx, c.parent, cmds, { stroke: idx === 0 ? sc.accent : sc.fg, width: lw, alpha: 1 });
        C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
          var env = R.env(c, f), e = E.outExpo(cl(env.lt / 0.4)) * (1 - E.inCubic(env.pOut));
          var x = xEdge + side * (idx * gap + (1 - e) * W * 0.2);
          var sp = H.toScene(c, x, bb.cy), on = (env.step + idx) % 3 !== 0;
          return { 'position.x': sp[0], 'position.y': sp[1], alpha: e > 0.01 ? (on ? 1 : 0.3) * e : 0 };
        });
        ids.push(id);
      })(i);
    }
  });
  if (P.big) {
    var x = P.right ? W * 0.9 : W * 0.1, y = Hh * (P.low ? 0.82 : 0.2), L = Hh * 0.1;
    var dx = P.right ? -1 : 1, dy = P.low ? -1 : 1, blw = Math.max(3, Hh * 0.008);
    var spB = H.toScene(c, x, y);
    var bigCmds = [['M', 0, 0], ['L', dx * L, -dy * L], ['M', dx * L * 0.45, -dy * L], ['L', dx * L, -dy * L], ['L', dx * L, -dy * L * 0.55]];
    var bid = C.shape(c.graph, c.cut, c.cut.id + ' / Big arrow', c.parent, bigCmds, { stroke: sc.fg, width: blw, alpha: 1 });
    c.graph.byId[bid].attrs.position = spB;
    C.sample(c.graph, bid, c.cut.start, c.cut.end, function (f) {
      var env = R.env(c, f), e = E.outExpo(cl(env.lt / 0.4)) * (1 - E.inCubic(env.pOut));
      var scv = Math.max(0.01, e);
      return { 'scale.x': scv, 'scale.y': scv, alpha: e > 0.01 ? 1 : 0 };
    });
    ids.push(bid);
  }
  return { count: ids.length };
});

/* 11. slash (front) */
reg('slash', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var seed = pNum(P, 'seed', c.cut.seed || 67), n = Math.min(4, Math.max(1, pNum(P, 'n', 1)));
  var L = Math.hypot(W, Hh), ids = [];
  for (var k = 0; k < n; k++) {
    (function (idx) {
      var angDeg = R.rr(-70, -20, seed, idx, 1);
      var cx = R.rr(W * 0.3, W * 0.7, seed, idx, 2), cy = R.rr(Hh * 0.3, Hh * 0.7, seed, idx, 3);
      var sp = H.toScene(c, cx, cy);
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Slash ' + idx, c.parent, [['M', -L / 2, 0], ['L', L / 2, 0]], {
        stroke: idx ? sc.accent : sc.fg, width: idx ? 2 : 1.4, alpha: 0.9
      });
      c.graph.byId[id].attrs.rotation = -angDeg;
      var rad = angDeg * DEG;
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f);
        var e = E.outExpo(cl((env.lt - idx * 0.06) / 0.35));
        var t0 = env.pOut > 0 ? E.inCubic(env.pOut) : 0;
        var lenFrac = Math.max(0.001, e - t0), midFrac = (t0 + e) / 2 - 0.5;
        return {
          'position.x': sp[0] + Math.cos(rad) * L * midFrac,
          'position.y': sp[1] - Math.sin(rad) * L * midFrac,
          'scale.x': lenFrac,
          alpha: e > t0 ? 0.9 : 0
        };
      });
      ids.push(id);
    })(k);
  }
  return { count: ids.length };
});

/* 12. sparks (front) */
reg('sparks', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var seed = pNum(P, 'seed', c.cut.seed || 73), n = Math.min(14, Math.max(1, pNum(P, 'n', 6)));
  var ids = [];
  for (var k = 0; k < n; k++) {
    (function (idx) {
      var x = R.rr(W * 0.05, W * 0.95, seed, idx, 2), y = R.rr(Hh * 0.08, Hh * 0.92, seed, idx, 3);
      var rad = R.rr(Hh * 0.015, Hh * 0.04, seed, idx, 4), dly = R.random(seed, idx, 1) * 0.4;
      var vRot = R.rs(seed, idx, 5) * 3, rot0 = R.random(seed, idx, 6) * 3;
      var arms = R.random(seed, idx, 7) < 0.5 ? 3 : 4, cmds = [];
      for (var a = 0; a < arms; a++) {
        var an = a * Math.PI / arms;
        cmds.push(['M', -Math.cos(an) * rad, Math.sin(an) * rad], ['L', Math.cos(an) * rad, -Math.sin(an) * rad]);
      }
      var sp = H.toScene(c, x, y);
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Spark ' + idx, c.parent, cmds, {
        stroke: idx % 3 === 0 ? sc.accent : sc.fg, width: Math.max(1.5, rad * 0.14), alpha: 1
      });
      c.graph.byId[id].attrs.position = sp;
      C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f);
        var q = E.outBack(cl((env.lt - dly) / 0.2), 2) * (1 - E.inCubic(env.pOut));
        var s = Math.max(0.001, q);
        return { 'scale.x': s, 'scale.y': s, rotation: -((rot0 + env.ltb * vRot) * 180 / Math.PI), alpha: q > 0.005 ? 1 : 0 };
      });
      ids.push(id);
    })(k);
  }
  return { count: ids.length };
});

/* 13. leaders (front) */
reg('leaders', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, bb = H.decBB(c);
  var seed = pNum(P, 'seed', c.cut.seed || 89);
  var n0 = c.cut.nodes && c.cut.nodes[0];
  var txt0 = (c.cut.source && c.cut.source.romaji) || (n0 && (N.romaji(n0.text) || n0.text)) || 'NOTE';
  var idx = ((c.cut.line != null ? c.cut.line : 0) | 0) + 1;
  var sSec = (c.cut.origin || 0) / c.comp.fps;
  var lbls = [String(txt0), 'No.' + String(idx).padStart(2, '0') + ' / ' + String(Math.floor(sSec / 60)).padStart(2, '0') + ':' + String(Math.floor(sSec % 60)).padStart(2, '0')];
  var fs = cl(Hh * 0.018, 11, 20), anchors = [[bb.x1, bb.y0], [bb.x0, bb.y1]];
  var ids = [];
  for (var k = 0; k < 2; k++) {
    (function (idxK) {
      var ax = anchors[idxK][0], ay = anchors[idxK][1];
      var tx = cl(ax + (idxK === 1 ? -1 : 1) * W * R.rr(0.06, 0.14, seed, idxK, 1), W * 0.06, W * 0.94);
      var ty = cl(ay + (idxK === 0 ? -1 : 1) * Hh * R.rr(0.08, 0.16, seed, idxK, 2), Hh * 0.08, Hh * 0.92);
      var tailX = tx + (idxK === 1 ? -1 : 1) * W * 0.05;
      var linePts = [[ax, ay], [tx, ty], [tailX, ty]];
      var lid = H.sampleShape(c, 'Leader line ' + idxK, function (env) {
        var e = E.outExpo(cl((env.lt - 0.1) / 0.45)) * (1 - E.inCubic(env.pOut));
        var seg = H.partPts(linePts, 0, Math.max(0.05, e));
        return H.polyCmds(c, [seg.length >= 2 ? seg : linePts], false);
      }, { stroke: sc.sub, width: 1.2, alpha: 1 }, function (env) {
        var e = E.outExpo(cl((env.lt - 0.1) / 0.45)) * (1 - E.inCubic(env.pOut));
        return { alpha: e > 0.02 ? 1 : 0 };
      });
      var did = H.circle(c, 'Leader dot ' + idxK, ax, ay, 3.5, 3.5, { fill: sc.accent, alpha: 1 });
      C.sample(c.graph, did, c.cut.start, c.cut.end, function (f) {
        var env = R.env(c, f), e = E.outExpo(cl((env.lt - 0.1) / 0.45)) * (1 - E.inCubic(env.pOut));
        return { alpha: e };
      });
      var tid = H.addText(c, 'Leader label ' + idxK, lbls[idxK], tx + (idxK === 1 ? -1 : 1) * W * 0.055, ty - fs * 0.3, fs, {
        role: idxK === 0 ? 'body' : 'mono', align: idxK === 1 ? 'right' : 'left', color: sc.fg, alpha: 1
      }, function (env) {
        var e = E.outExpo(cl((env.lt - 0.1) / 0.45)) * (1 - E.inCubic(env.pOut));
        return { alpha: e };
      });
      if (lid) ids.push(lid);
      if (did) ids.push(did);
      if (tid) ids.push(tid);
    })(k);
  }
  return { count: ids.length };
});

/* 14. waveform (front) */
reg('waveform', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var seed = pNum(P, 'seed', c.cut.seed || 97), y = Hh * (P.low ? 0.86 : 0.14), n = 64;
  var basePts = [];
  for (var i = 0; i <= n; i++) {
    var u = i / n, x = mix(W * 0.18, W * 0.82, u), env2 = Math.sin(u * Math.PI);
    var amp = Hh * 0.035 * env2 * 0.85 * (0.5 + 0.5 * R.noise(u * 18, seed));
    basePts.push([x, y + (i % 2 ? amp : -amp)]);
  }
  var sp = H.toScene(c, W * 0.5, y);
  var localCmds = basePts.map(function (pt, idx) { return [idx ? 'L' : 'M', pt[0] - W * 0.5, y - pt[1]]; });
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Decor waveform', c.parent, localCmds, { stroke: sc.fg, width: 1.4, alpha: 0.9 });
  c.graph.byId[id].attrs.position = sp;
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
    var env = R.env(c, f), e = inOut(c, f);
    var pulse = 0.7 + 0.4 * Math.sin(env.lt * 9 + R.noise(env.lt * 3, seed) * 2);
    return { 'scale.x': Math.max(0.01, e), 'scale.y': pulse * e, alpha: e > 0.005 ? 0.9 : 0 };
  });
  return { layer: id };
});

/* 15. barcode (front) */
reg('barcode', 'front', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var seed = pNum(P, 'seed', c.cut.seed || 103);
  var x0 = P.right ? W * 0.84 : W * 0.06, y0 = P.low ? Hh * 0.84 : Hh * 0.07, h = Hh * 0.05;
  var x = x0, rectList = [];
  for (var i = 0; i < 34; i++) {
    var w = 1 + Math.floor(R.random(seed, i, 1) * 3.2);
    if (R.random(seed, i, 2) < 0.62) rectList.push([x, y0, w, h]);
    x += w + 1.5;
  }
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Barcode', c.parent, H.rectCmds(c, rectList), { fill: sc.fg, alpha: 0.9 });
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
    var e = inOut(c, f);
    return { alpha: 0.9 * e };
  });
  var code = String(R.hash(seed, 5) % 1000000000).padStart(9, '0');
  var fs = cl(Hh * 0.014, 9, 16);
  var tid = H.addText(c, 'Barcode code', code, x0, y0 + h + fs * 0.8, fs, {
    role: 'mono', align: 'left', color: sc.fg, alpha: 0.9
  }, function (env, f) { return { alpha: 0.9 * inOut(c, f) }; });
  return { bars: id, code: tid };
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZHelpers);
