/* Remaining 19 core transitions from ae/p_trans.jsx completing 20/20 core transitions in Cavalry. */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = R.clamp, mix = R.mix, E = R.E, PI = Math.PI, TAU = R.T;

function prog(f, start, end) {
  return end - start < 2 ? 1 : cl((f - start) / (end - start - 1));
}

function insertBefore(graph, nodeId, targetId) {
  var node = graph.byId[nodeId], target = graph.byId[targetId];
  var i = graph.layers.indexOf(node), j = graph.layers.indexOf(target);
  if (i >= 0 && j >= 0 && i > j) { graph.layers.splice(i, 1); graph.layers.splice(j, 0, node); }
}

function rectScenePoly(x0, y0, x1, y1, W, H) {
  var p0 = H_toScene(x0, y0, W, H), p1 = H_toScene(x1, y1, W, H);
  return [[p0[0], p0[1]], [p1[0], p0[1]], [p1[0], p1[1]], [p0[0], p1[1]]];
}

function H_toScene(x, y, W, H) {
  return [x - W / 2, H / 2 - y];
}

function offscreenTri() {
  return [[-99999, -99999], [-99998, -99999], [-99999, -99998]];
}

function reg(key, build, diffs) {
  N.register('trans', key, {
    source: 'ae/p_trans.jsx / trans:' + key,
    scope: 'cut-pair',
    differences: diffs || ['Per-frame sampled Cavalry scene graph matching AE transition formula.'],
    build: build
  });
}

function addDimBehindB(c, start, end, color, alphaFn, label) {
  var W = c.comp.width, H = c.comp.height, g = c.graph;
  var cutsRoot = g.byId[c.layerIds[0]].parent;
  var id = C.shape(g, { id: c.cut.id, start: start, end: end },
    c.cut.id + ' / ' + (label || 'Trans dim'), cutsRoot, G.rect(-W / 2, -H / 2, W, H), { fill: color || '#000000', alpha: 1 });
  insertBefore(g, id, c.layerIds[0]);
  if (typeof alphaFn === 'function') {
    C.sample(g, id, start, end, function (f) { return { alpha: cl(alphaFn(f)) }; });
  }
  return id;
}

function addDimAboveB(c, start, end, color, alphaFn, label) {
  var W = c.comp.width, H = c.comp.height, g = c.graph;
  var id = C.shape(g, { id: c.cut.id, start: start, end: end },
    c.cut.id + ' / ' + (label || 'Trans dim'), c.sceneRoot, G.rect(-W / 2, -H / 2, W, H), { fill: color || '#000000', alpha: 1 });
  if (typeof alphaFn === 'function') {
    C.sample(g, id, start, end, function (f) { return { alpha: cl(alphaFn(f)) }; });
  }
  return id;
}

function regOverlayBar(c, start, end, label, cmds, color, fn) {
  var id = C.shape(c.graph, { id: c.cut.id, start: start, end: end },
    c.cut.id + ' / ' + label, c.sceneRoot, cmds, { fill: color, alpha: 1 });
  C.sample(c.graph, id, start, end, fn);
  return id;
}

function normAngleDeg(deg) {
  return -deg; /* design CW degrees -> Cavalry CCW degrees */
}

/* 1. wipe */
reg('wipe', function (c) {
  var w = H.transWindow(c, 0.42, 'wipe'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, d = P.dir || 'L';
  var horiz = d === 'L' || d === 'R', side = (d === 'R' || d === 'D') ? -1 : 1;
  var polys = Object.create(null);
  for (var f = start; f < end; f++) {
    var p = prog(f, start, end), e = E.inOutCubic(p);
    var x0 = 0, y0 = 0, x1 = W, y1 = Hh;
    if (d === 'L') x0 = W * (1 - e);
    else if (d === 'R') x1 = W * e;
    else if (d === 'U') y0 = Hh * (1 - e);
    else y1 = Hh * e;
    polys[f] = (x1 - x0 < 0.05 || y1 - y0 < 0.05) ? offscreenTri() : rectScenePoly(x0, y0, x1, y1, W, Hh);
  }
  H.extendCut(c.graph, w.a, end);
  H.clipCut(c, c, polys, c.options && c.options.hostProfile && c.options.hostProfile.javaScriptDeformer);

  var lwid = Math.max(2, Math.min(W, Hh) * 0.007), ac = H.transAcc(c);
  var edgeCmd = horiz ? G.rect(-lwid / 2, -Hh / 2, lwid, Hh) : G.rect(-W / 2, -lwid / 2, W, lwid);
  var hw = Math.max(1, lwid * 0.35);
  var hairCmd = horiz ? G.rect(-hw / 2, -Hh / 2, hw, Hh) : G.rect(-W / 2, -hw / 2, W, hw);
  [0, 1].forEach(function (idx) {
    regOverlayBar(c, start, end, idx ? 'Wipe hairline' : 'Wipe edge', idx ? hairCmd : edgeCmd, ac, function (f) {
      var p = prog(f, start, end), e = E.inOutCubic(p);
      var ex = d === 'L' ? W * (1 - e) : (d === 'R' ? W * e : W / 2);
      var ey = d === 'U' ? Hh * (1 - e) : (d === 'D' ? Hh * e : Hh / 2);
      var off = idx ? lwid * 3.2 * side : 0;
      var sx = ex + (horiz ? off : 0), sy = ey + (horiz ? 0 : off);
      return {
        'position.x': sx - W / 2,
        'position.y': Hh / 2 - sy,
        alpha: Math.pow(H.bell(p), 0.6) * (idx ? 0.5 : 1)
      };
    });
  });
  return { start: start, end: end };
});

/* 2. diagonalWipe */
reg('diagonalWipe', function (c) {
  var w = H.transWindow(c, 0.42, 'diagonalWipe'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, k = P.k == null ? 0.4 : P.k, rev = !!P.rev;
  var sl = k * Hh, len = Math.sqrt(Hh * Hh + sl * sl);
  var dx = (rev ? Hh : -Hh) / len, dy = sl / len;
  var tx = -dy, ty = dx;
  var ext = Math.abs(dx) * W / 2 + Math.abs(dy) * Hh / 2 + 8, L = (W + Hh) * 2;
  var polys = Object.create(null);
  for (var f = start; f < end; f++) {
    var p = prog(f, start, end), e = E.inOutCubic(p);
    var s = ext * (1 - 2 * e);
    var cx = W / 2 + dx * s, cy = Hh / 2 + dy * s;
    var pts = [
      [cx - tx * L, cy - ty * L],
      [cx + tx * L, cy + ty * L],
      [cx + tx * L + dx * L, cy + ty * L + dy * L],
      [cx - tx * L + dx * L, cy - ty * L + dy * L]
    ];
    polys[f] = pts.map(function (pt) { return H_toScene(pt[0], pt[1], W, Hh); });
  }
  H.extendCut(c.graph, w.a, end);
  H.clipCut(c, c, polys, c.options && c.options.hostProfile && c.options.hostProfile.javaScriptDeformer);

  var band = Math.min(W, Hh) * 0.07 * Hh / len;
  var rot = -Math.atan2(-dy, -dx) * 180 / PI;
  [0, 1].forEach(function (idx) {
    var col = idx ? H.transAcc(c, true) : H.transAcc(c);
    var bwFrac = idx ? 0.25 : 1, offFrac = idx ? 1.475 : 0.5;
    regOverlayBar(c, start, end, idx ? 'Diag band 2' : 'Diag band', G.rect(-0.5, -L / 2, 1, L), col, function (f) {
      var p = prog(f, start, end), e = E.inOutCubic(p), bw = Math.max(0.01, band * H.bell(p));
      var s = ext * (1 - 2 * e);
      var ex = W / 2 + dx * s - dx * bw * offFrac, ey = Hh / 2 + dy * s - dy * bw * offFrac;
      return {
        'position.x': ex - W / 2,
        'position.y': Hh / 2 - ey,
        rotation: rot,
        'scale.x': Math.max(1e-3, bw * bwFrac),
        alpha: bw > 0.2 ? (idx ? 0.85 : 1) : 0
      };
    });
  });
  return { start: start, end: end };
});

/* 3. clockWipe */
reg('clockWipe', function (c) {
  var w = H.transWindow(c, 0.45, 'clockWipe'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, dir = P.dir < 0 ? -1 : 1;
  var a0Deg = P.a0 == null ? -90 : P.a0, a0 = a0Deg * PI / 180;
  var R = Math.hypot(W, Hh) + 10, lw = Math.max(2, Math.min(W, Hh) * 0.006), ac = H.transAcc(c);
  var polys = Object.create(null);
  for (var f = start; f < end; f++) {
    var p = prog(f, start, end), e = E.inOutCubic(p);
    var sweep = TAU * e;
    if (sweep < 0.002) { polys[f] = offscreenTri(); continue; }
    if (sweep >= TAU - 0.002) { polys[f] = rectScenePoly(-10, -10, W + 10, Hh + 10, W, Hh); continue; }
    var steps = Math.max(8, Math.ceil(sweep / (PI / 18)));
    var pts = [[0, 0]];
    for (var s = 0; s <= steps; s++) {
      var ang = a0 + dir * sweep * (s / steps);
      pts.push([Math.cos(ang) * R, -Math.sin(ang) * R]);
    }
    polys[f] = pts;
  }
  H.extendCut(c.graph, w.a, end);
  H.clipCut(c, c, polys, c.options && c.options.hostProfile && c.options.hostProfile.javaScriptDeformer);

  var hub = C.shape(c.graph, { id: c.cut.id, start: start, end: end }, c.cut.id + ' / Clock hub', c.sceneRoot,
    G.ellipse(0, 0, lw * 2.2, lw * 2.2), { fill: ac, alpha: 1 });
  var hand = C.shape(c.graph, { id: c.cut.id, start: start, end: end }, c.cut.id + ' / Clock hand', c.sceneRoot,
    V.commands([[0, 0], [R * 0.6, 0]], false), { stroke: ac, width: lw, alpha: 1 });
  C.sample(c.graph, hub, start, end, function (f) {
    return { alpha: Math.pow(H.bell(prog(f, start, end)), 0.5) };
  });
  C.sample(c.graph, hand, start, end, function (f) {
    var p = prog(f, start, end), e = E.inOutCubic(p);
    return { rotation: normAngleDeg(a0Deg + 360 * dir * e), alpha: Math.pow(H.bell(p), 0.5) };
  });
  return { start: start, end: end };
});

/* 4. irisOpen */
reg('irisOpen', function (c) {
  var w = H.transWindow(c, 0.45, 'irisOpen'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height;
  var cx = W * (P.x == null ? 0.5 : P.x), cy = Hh * (P.y == null ? 0.5 : P.y);
  var R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, Hh - cy)) + 6;
  var lw = Math.max(2, Math.min(W, Hh) * 0.009), ac = H.transAcc(c), ac2 = H.transAcc(c, true);
  var scCenter = H_toScene(cx, cy, W, Hh);
  var polys = Object.create(null);
  for (var f = start; f < end; f++) {
    var p = prog(f, start, end), r = Math.max(1e-4, R * E.inOutCubic(p));
    var pts = [];
    for (var i = 0; i < 32; i++) {
      var a = i * TAU / 32;
      pts.push([scCenter[0] + Math.cos(a) * r, scCenter[1] - Math.sin(a) * r]);
    }
    polys[f] = pts;
  }
  H.extendCut(c.graph, w.a, end);
  H.clipCut(c, c, polys, c.options && c.options.hostProfile && c.options.hostProfile.javaScriptDeformer);

  [0, 1].forEach(function (idx) {
    var col = idx ? ac2 : ac, sw = idx ? Math.max(1, lw * 0.4) : lw;
    var ring = C.shape(c.graph, { id: c.cut.id, start: start, end: end }, c.cut.id + ' / Iris ring ' + idx,
      c.sceneRoot, G.ellipse(0, 0, 1, 1), { stroke: col, width: 1, alpha: 1 });
    C.sample(c.graph, ring, start, end, function (f) {
      var p = prog(f, start, end), r = Math.max(1e-3, R * E.inOutCubic(p));
      var rad = Math.max(1e-3, idx ? r * 1.06 + lw * 2.5 : r + lw * 0.5);
      return {
        'position.x': scCenter[0],
        'position.y': scCenter[1],
        'scale.x': rad,
        'scale.y': rad,
        'stroke.width': sw / rad,
        alpha: Math.pow(H.bell(p), 0.6) * (idx ? 0.6 : 1) * (r > 0.5 ? 1 : 0)
      };
    });
  });
  return { start: start, end: end };
});

/* 5. blinds */
reg('blinds', function (c) {
  var w = H.transWindow(c, 0.45, 'blinds'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height;
  var n = Math.max(2, Math.round(P.n || 9)), v = !!P.vert, rev = !!P.rev, Lx = v ? W : Hh;
  var lw = Math.max(1, Math.min(W, Hh) * 0.003), ac = H.transAcc(c);
  var contours = Object.create(null);
  for (var f = start; f < end; f++) {
    var p = prog(f, start, end), polys = [];
    for (var i = 0; i < n; i++) {
      var k = rev ? n - 1 - i : i, a0 = Math.round(i * Lx / n), a1 = Math.round((i + 1) * Lx / n);
      var q = E.inOutCubic(cl(p * 1.55 - k / n * 0.55));
      if (q <= 0.002) continue;
      var s = (a1 - a0 + 1) * q;
      if (v) polys.push(rectScenePoly(a0, 0, a0 + s, Hh, W, Hh));
      else polys.push(rectScenePoly(0, a0, W, a0 + s, W, Hh));
    }
    contours[f] = polys;
  }
  H.extendCut(c.graph, w.a, end);
  H.multiClipCut(c, c, contours, false, 'Blinds clip', c.options);

  for (var i = 0; i < n; i++) {
    (function (idx) {
      var k = rev ? n - 1 - idx : idx, a0 = Math.round(idx * Lx / n), a1 = Math.round((idx + 1) * Lx / n);
      var cmd = v ? G.rect(-lw / 2, -Hh / 2, lw, Hh) : G.rect(-W / 2, -lw / 2, W, lw);
      regOverlayBar(c, start, end, 'Blinds line ' + (idx + 1), cmd, ac, function (f) {
        var p = prog(f, start, end), q = E.inOutCubic(cl(p * 1.55 - k / n * 0.55));
        var d = (a1 - a0) * q + a0 + lw / 2;
        return {
          'position.x': v ? d - W / 2 : 0,
          'position.y': v ? 0 : Hh / 2 - d,
          alpha: (q > 0 && q < 1) ? (1 - q) : 0
        };
      });
    })(i);
  }
  return { start: start, end: end };
});

/* 6. checker */
reg('checker', function (c) {
  var w = H.transWindow(c, 0.5, 'checker'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, md = Math.min(W, Hh);
  var cell = md / Math.max(2, P.n || 8), rev = !!P.rev;
  var cols = Math.ceil(W / cell - 1e-6), rows = Math.ceil(Hh / cell - 1e-6);
  var contours = Object.create(null);
  for (var f = start; f < end; f++) {
    var p = prog(f, start, end), polys = [];
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var d = ((i + j) % 2) * 0.32 + 0.18 * ((rev ? cols - 1 - i : i) + j) / Math.max(1, cols + rows - 2);
      var q = E.outCubic(cl((p - d) / 0.5));
      if (q > 0.97) q = 1;
      if (q <= 0.01) continue;
      var x0 = Math.round(i * W / cols), x1 = Math.round((i + 1) * W / cols);
      var y0 = Math.round(j * Hh / rows), y1 = Math.round((j + 1) * Hh / rows);
      var mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      var hw = (x1 - x0 + 1) * 0.5 * q, hh = (y1 - y0 + 1) * 0.5 * q;
      polys.push(rectScenePoly(mx - hw, my - hh, mx + hw, my + hh, W, Hh));
    }
    contours[f] = polys;
  }
  H.extendCut(c.graph, w.a, end);
  H.multiClipCut(c, c, contours, false, 'Checker clip', c.options);
  return { start: start, end: end };
});

/* 7. blockDissolve */
reg('blockDissolve', function (c) {
  var w = H.transWindow(c, 0.5, 'blockDissolve'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, md = Math.min(W, Hh);
  var n = Math.max(2, Math.round(P.n || 9)), side = P.side || 0, cell = md / n;
  var cols = Math.ceil(W / cell - 1e-6), rows = Math.ceil(Hh / cell - 1e-6);
  var seed = (c.cut.source && c.cut.source.seed) || 19, ac = H.transAcc(c);
  var contours = Object.create(null), flashContours = Object.create(null);
  function blockThresh(i, j) {
    var rnd = N.random(seed, i * 31 + j * 17, 4);
    var bias = side === 1 ? i / Math.max(1, cols - 1) : side === 2 ? j / Math.max(1, rows - 1) : 0;
    return 0.02 + (side ? 0.45 * bias + 0.55 * rnd : rnd) * 0.84;
  }
  for (var f = start; f < end; f++) {
    var p = prog(f, start, end), polys = [], fPolys = [];
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var th = blockThresh(i, j), dt = p - th;
      if (dt < 0) continue;
      var x0 = Math.round(i * W / cols) - (i ? 1 : 0), x1 = Math.round((i + 1) * W / cols) + (i < cols - 1 ? 1 : 0);
      var y0 = Math.round(j * Hh / rows) - (j ? 1 : 0), y1 = Math.round((j + 1) * Hh / rows) + (j < rows - 1 ? 1 : 0);
      polys.push(rectScenePoly(x0, y0, x1, y1, W, Hh));
      if (dt < 0.1) fPolys.push(rectScenePoly(x0, y0, x1, y1, W, Hh));
    }
    contours[f] = polys;
    flashContours[f] = fPolys;
  }
  H.extendCut(c.graph, w.a, end);
  H.multiClipCut(c, c, contours, false, 'Block dissolve clip', c.options);
  var flashId = C.shape(c.graph, { id: c.cut.id, start: start, end: end }, c.cut.id + ' / Block flash',
    c.sceneRoot, G.rect(-W / 2, -Hh / 2, W, Hh), { fill: ac, alpha: 0.45 });
  H.multiClip(c.graph, flashId, flashContours, false, 'Block flash clip', c.options);
  return { start: start, end: end };
});

/* 8. inkBlob */
reg('inkBlob', function (c) {
  var w = H.transWindow(c, 0.55, 'inkBlob'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, md = Math.min(W, Hh);
  var cx = W * (P.x == null ? 0.5 : P.x), cy = Hh * (P.y == null ? 0.5 : P.y), sc = H_toScene(cx, cy, W, Hh);
  var s0 = (c.cut.source && c.cut.source.seed) || 7, ac = H.transAcc(c);
  var R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, Hh - cy)) * 1.36;
  var lobes = [];
  for (var k = 0; k < 28; k++) {
    var a = k * TAU / 28;
    var wob = 1 + 0.18 * Math.sin(a * 5 + N.random(s0, 1, 1) * 6.28) + 0.1 * Math.cos(a * 9 + N.random(s0, 2, 2) * 6.28);
    lobes.push([a, wob]);
  }
  function blobPoly(rad, rotDeg) {
    var rot = rotDeg * PI / 180;
    return lobes.map(function (lb) {
      var r = Math.max(1e-3, rad * lb[1]);
      return [sc[0] + Math.cos(lb[0] + rot) * r, sc[1] - Math.sin(lb[0] + rot) * r];
    });
  }
  var polys = Object.create(null);
  for (var f = start; f < end; f++) {
    var p = prog(f, start, end), e = E.inOutSine(p), r = R * e;
    polys[f] = r < 0.2 ? offscreenTri() : blobPoly(r, 24 * p);
  }
  H.extendCut(c.graph, w.a, end);
  H.clipCut(c, c, polys, c.options && c.options.hostProfile && c.options.hostProfile.javaScriptDeformer);

  var rimBase = blobPoly(R, 0).map(function (pt) { return [pt[0] - sc[0], pt[1] - sc[1]]; });
  var rimId = C.shape(c.graph, { id: c.cut.id, start: start, end: end }, c.cut.id + ' / Ink rim',
    c.sceneRoot, V.commands(rimBase, true), { stroke: ac, width: 1, alpha: 1 });
  C.sample(c.graph, rimId, start, end, function (f) {
    var p = prog(f, start, end), e = E.inOutSine(p), rim = md * 0.035 * (0.4 + e), scf = Math.max(1e-3, e + rim / R);
    return {
      'position.x': sc[0], 'position.y': sc[1],
      'scale.x': scf, 'scale.y': scf,
      rotation: -24 * p,
      'stroke.width': rim / scf,
      alpha: 1 - H.smoothstep(0.75, 0.98, p)
    };
  });
  for (var d = 0; d < 6; d++) {
    (function (idx) {
      var ang = N.random(s0, idx, 7) * TAU, fac = 1.12 + 0.3 * N.random(s0, idx, 8);
      var rr = md * (0.008 + 0.02 * N.random(s0, idx, 9));
      var dropId = C.shape(c.graph, { id: c.cut.id, start: start, end: end }, c.cut.id + ' / Ink drop ' + (idx + 1),
        c.sceneRoot, G.ellipse(0, 0, rr, rr), { fill: ac, alpha: 1 });
      C.sample(c.graph, dropId, start, end, function (f) {
        var p = prog(f, start, end), e = E.inOutSine(p), rim = md * 0.035 * (0.4 + e);
        var dist = R * e * fac + rim, s = Math.max(1e-3, cl(p * 4));
        return {
          'position.x': sc[0] + Math.cos(ang) * dist,
          'position.y': sc[1] - Math.sin(ang) * dist,
          'scale.x': s, 'scale.y': s,
          alpha: (1 - H.smoothstep(0.75, 0.98, p)) * (s > 0.01 ? 1 : 0)
        };
      });
    })(d);
  }
  return { start: start, end: end };
});

/* 9. cover */
reg('cover', function (c) {
  var w = H.transWindow(c, 0.42, 'cover'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, dir = P.dir || 'L';
  var h = dir === 'L' || dir === 'R', sg = (dir === 'L' || dir === 'D') ? -1 : 1, Lx = h ? W : Hh;
  if (dir === 'U' || dir === 'D') sg = dir === 'U' ? -1 : 1;
  H.extendCut(c.graph, w.a, end);
  var rigA = H.wrapCutRig(c, w.a, 'Cover A rig', start, end);
  var rigB = H.wrapCutRig(c, c, 'Cover B rig', start, end);
  addDimBehindB(c, start, end, '#000000', function (f) { return 0.45 * E.inOutCubic(prog(f, start, end)); }, 'Cover dim');
  C.sample(c.graph, rigA, start, end, function (f) {
    var ao = Math.round(E.inOutCubic(prog(f, start, end)) * Lx * 0.18) * sg;
    return h ? { 'position.x': ao } : { 'position.y': -ao };
  });
  C.sample(c.graph, rigB, start, end, function (f) {
    var bq = Math.round((1 - E.inOutCubic(prog(f, start, end))) * Lx) * (-sg);
    return h ? { 'position.x': bq } : { 'position.y': -bq };
  });
  var sw = Math.min(W, Hh) * 0.06;
  var shCmd = h ? G.rect(-sw / 2, -Hh / 2, sw, Hh) : G.rect(-W / 2, -sw / 2, W, sw);
  var shId = C.shape(c.graph, { id: c.cut.id, start: start, end: end }, c.cut.id + ' / Cover shadow',
    c.graph.byId[c.layerIds[0]].parent, shCmd, { fill: '#000000', alpha: 1 });
  insertBefore(c.graph, shId, rigB);
  C.sample(c.graph, shId, start, end, function (f) {
    var p = prog(f, start, end), bq = Math.round((1 - E.inOutCubic(p)) * Lx) * (-sg);
    var edge = sg < 0 ? W + bq : bq;
    var ey = sg < 0 ? Hh + bq : bq;
    return h
      ? { 'position.x': edge - W / 2 + sg * sw * 0.4, alpha: 0.4 * H.bell(p) }
      : { 'position.y': Hh / 2 - ey - sg * sw * 0.4, alpha: 0.4 * H.bell(p) };
  });
  return { start: start, end: end };
});

/* 10. uncover */
reg('uncover', function (c) {
  var w = H.transWindow(c, 0.42, 'uncover'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, dir = P.dir || 'L';
  var h = dir === 'L' || dir === 'R', sg = (dir === 'L' || dir === 'U') ? -1 : 1, Lx = h ? W : Hh;
  var cloneA = H.cloneCutSubtree(c.graph, w.a, 'Uncover A copy', start, end);
  var rigB = H.wrapCutRig(c, c, 'Uncover B rig', start, end);
  C.sample(c.graph, rigB, start, end, function (f) {
    var s = 1.05 - 0.05 * E.outCubic(prog(f, start, end));
    return { 'scale.x': s, 'scale.y': s };
  });
  var dimId = C.shape(c.graph, { id: c.cut.id, start: start, end: end }, c.cut.id + ' / Uncover dim',
    c.sceneRoot, G.rect(-W / 2, -Hh / 2, W, Hh), { fill: '#000000', alpha: 1 });
  C.sample(c.graph, dimId, start, end, function (f) { return { alpha: 0.4 * (1 - E.inOutCubic(prog(f, start, end))) }; });
  insertBefore(c.graph, dimId, cloneA.rigId);
  C.sample(c.graph, cloneA.rigId, start, end, function (f) {
    var ao = Math.round(E.inOutCubic(prog(f, start, end)) * Lx) * sg;
    return h ? { 'position.x': ao } : { 'position.y': -ao };
  });
  return { start: start, end: end };
});

/* 11. whipPan */
reg('whipPan', function (c) {
  var w = H.transWindow(c, 0.34, 'whipPan'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, dir = P.dir > 0 ? 1 : -1, v = !!P.vert, Lx = v ? Hh : W;
  H.extendCut(c.graph, w.a, end);
  var rigA = H.wrapCutRig(c, w.a, 'Whip A rig', start, end);
  var rigB = H.wrapCutRig(c, c, 'Whip B rig', start, end);
  C.sample(c.graph, rigA, start, end, function (f) {
    var off = Math.round(H.inOutQuart(prog(f, start, end)) * Lx) * dir;
    return v ? { 'position.y': -off } : { 'position.x': off };
  });
  C.sample(c.graph, rigB, start, end, function (f) {
    var off = Math.round(H.inOutQuart(prog(f, start, end)) * Lx) * dir - Lx * dir;
    return v ? { 'position.y': -off } : { 'position.x': off };
  });
  /* Motion smear overlay lines peaking with bell(p)^2 */
  var ac = H.transAcc(c);
  for (var k = 0; k < 4; k++) {
    (function (idx) {
      var u = (idx + 0.5) / 4;
      var cmd = v ? G.rect(-3, -Hh * 0.35, 6, Hh * 0.7) : G.rect(-W * 0.35, -3, W * 0.7, 6);
      regOverlayBar(c, start, end, 'Whip streak ' + (idx + 1), cmd, ac, function (f) {
        var p = prog(f, start, end), s = Math.pow(H.bell(p), 2);
        return {
          'position.x': v ? (u - 0.5) * W * 0.8 : (p - 0.5) * W * dir * 0.9,
          'position.y': v ? -(p - 0.5) * Hh * dir * 0.9 : -(u - 0.5) * Hh * 0.8,
          alpha: 0.25 * s
        };
      });
    })(k);
  }
  return { start: start, end: end };
});

/* 12. flashCross */
reg('flashCross', function (c) {
  var w = H.transWindow(c, 0.38, 'flashCross'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height;
  var pb = (w.a.sc || c.sc).bg, light = H.lum(pb) > 0.62 && H.lum(c.sc.bg) > 0.62;
  var fl = (P.c === 'accent' || light) ? H.transAcc(c) : '#FFFFFF';
  var cloneA = H.cloneCutSubtree(c.graph, w.a, 'Flash A copy', start, end);
  cloneA.paintables.forEach(function (id) {
    var n = c.graph.byId[id], base = n.attrs.alpha == null ? 1 : n.attrs.alpha;
    for (var f = start; f < end; f++) {
      var p = prog(f, start, end), a = base * (1 - H.smoothstep(0.3, 0.62, p));
      n.keys.alpha = n.keys.alpha || {};
      n.keys.alpha[f] = { value: cl(a), type: 1 };
    }
  });
  var flashId = C.shape(c.graph, { id: c.cut.id, start: start, end: end }, c.cut.id + ' / Flash',
    c.sceneRoot, G.rect(-W / 2, -Hh / 2, W, Hh), { fill: fl, alpha: 1 });
  C.sample(c.graph, flashId, start, end, function (f) {
    var p = prog(f, start, end);
    var a = p < 0.45 ? H.inOutQuart(p / 0.45) : 1 - E.outCubic((p - 0.45) / 0.55);
    return { alpha: 0.92 * cl(a) };
  });
  return { start: start, end: end };
});

/* 13. zoomThrough */
reg('zoomThrough', function (c) {
  var w = H.transWindow(c, 0.45, 'zoomThrough'), P = w.P, start = w.start, end = w.end;
  var z = P.z || 1.8;
  var bg = addDimBehindB(c, start, end, c.sc.bg, null, 'Zoom bg');
  var rigB = H.wrapCutRig(c, c, 'Zoom B rig', start, end);
  C.sample(c.graph, rigB, start, end, function (f) {
    var s = 0.86 + 0.14 * E.outCubic(prog(f, start, end));
    return { 'scale.x': s, 'scale.y': s };
  });
  var copyA = H.cloneCutSubtree(c.graph, w.a, 'Zoom A copy', start, end);
  var echoA = H.cloneCutSubtree(c.graph, w.a, 'Zoom A echo', start, end);
  C.sample(c.graph, copyA.rigId, start, end, function (f) {
    var p = prog(f, start, end), sa = 1 + (z - 1) * Math.pow(p, 1.4);
    return { 'scale.x': sa, 'scale.y': sa };
  });
  copyA.paintables.forEach(function (id) {
    var n = c.graph.byId[id], base = n.attrs.alpha == null ? 1 : n.attrs.alpha;
    n.keys.alpha = n.keys.alpha || {};
    for (var f = start; f < end; f++) {
      var aa = cl(1 - E.inCubic(prog(f, start, end) * 1.12));
      n.keys.alpha[f] = { value: base * aa, type: 1 };
    }
  });
  C.sample(c.graph, echoA.rigId, start, end, function (f) {
    var p = prog(f, start, end), sa = (1 + (z - 1) * Math.pow(p, 1.4)) * (1 + 0.08 * p);
    return { 'scale.x': sa, 'scale.y': sa };
  });
  echoA.paintables.forEach(function (id) {
    var n = c.graph.byId[id], base = n.attrs.alpha == null ? 1 : n.attrs.alpha;
    n.keys.alpha = n.keys.alpha || {};
    for (var f = start; f < end; f++) {
      var p = prog(f, start, end), aa = cl(1 - E.inCubic(p * 1.12));
      n.keys.alpha[f] = { value: base * ((p > 0.08 && aa > 0.15) ? aa * 0.35 : 0), type: 1 };
    }
  });
  void bg;
  return { start: start, end: end };
});

/* 14. spinOut */
reg('spinOut', function (c) {
  var w = H.transWindow(c, 0.45, 'spinOut'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, rot = P.rot || 150, lw = Math.max(2, Math.min(W, Hh) * 0.008);
  var rigB = H.wrapCutRig(c, c, 'Spin B rig', start, end);
  C.sample(c.graph, rigB, start, end, function (f) {
    var s = 1.08 - 0.08 * E.outCubic(prog(f, start, end));
    return { 'scale.x': s, 'scale.y': s };
  });
  addDimAboveB(c, start, end, '#000000', function (f) { return 0.4 * (1 - E.outCubic(prog(f, start, end))); }, 'Spin dim');
  var copyA = H.cloneCutSubtree(c.graph, w.a, 'Spin A copy', start, end);
  C.sample(c.graph, copyA.rigId, start, end, function (f) {
    var e = E.inCubic(prog(f, start, end)), s = Math.max(1e-3, 1 - e);
    return { 'scale.x': s, 'scale.y': s, rotation: normAngleDeg(rot * e) };
  });
  var frameId = C.shape(c.graph, { id: c.cut.id, start: start, end: end }, c.cut.id + ' / Spin frame',
    c.sceneRoot, G.rect(-W / 2, -Hh / 2, W, Hh), { stroke: H.transAcc(c), width: 1, alpha: 1 });
  C.sample(c.graph, frameId, start, end, function (f) {
    var p = prog(f, start, end), e = E.inCubic(p), s = Math.max(1e-3, 1 - e);
    return {
      'scale.x': s, 'scale.y': s,
      rotation: normAngleDeg(rot * e),
      'stroke.width': lw / s,
      alpha: s < 0.01 ? 0 : Math.min(1, p * 6)
    };
  });
  return { start: start, end: end };
});

/* 15. doorsOpen */
reg('doorsOpen', function (c) {
  var w = H.transWindow(c, 0.48, 'doorsOpen'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, v = !!P.vert, lw = Math.max(2, Math.min(W, Hh) * 0.005);
  var ac = H.transAcc(c), Lx = v ? Hh : W, hw = Math.floor(Lx / 2);
  addDimBehindB(c, start, end, c.sc.bg, null, 'Doors bg');
  var rigB = H.wrapCutRig(c, c, 'Doors B rig', start, end);
  C.sample(c.graph, rigB, start, end, function (f) {
    var s = 0.93 + 0.07 * E.outCubic(prog(f, start, end));
    return { 'scale.x': s, 'scale.y': s };
  });
  addDimAboveB(c, start, end, '#000000', function (f) { return 0.35 * (1 - E.inOutCubic(prog(f, start, end))); }, 'Doors dim');
  [0, 1].forEach(function (side) {
    var dClone = H.cloneCutSubtree(c.graph, w.a, 'Door ' + (side + 1), start, end);
    var polys = Object.create(null);
    var poly = !v
      ? (side ? rectScenePoly(hw, 0, W, Hh, W, Hh) : rectScenePoly(0, 0, hw, Hh, W, Hh))
      : (side ? rectScenePoly(0, hw, W, Hh, W, Hh) : rectScenePoly(0, 0, W, hw, W, Hh));
    for (var f = start; f < end; f++) polys[f] = poly;
    dClone.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
    var sg = side ? 1 : -1;
    C.sample(c.graph, dClone.rigId, start, end, function (f) {
      var off = Math.round(E.inOutCubic(prog(f, start, end)) * (Lx - hw + lw * 2)) * sg;
      return v ? { 'position.y': -off } : { 'position.x': off };
    });
    var edgeCmd = !v ? G.rect(-lw / 2, -Hh / 2, lw, Hh) : G.rect(-W / 2, -lw / 2, W, lw);
    var ex0 = !v ? (hw + (side ? lw / 2 : -lw / 2)) : W / 2, ey0 = !v ? Hh / 2 : (hw + (side ? lw / 2 : -lw / 2));
    var sc0 = H_toScene(ex0, ey0, W, Hh);
    regOverlayBar(c, start, end, 'Door edge ' + (side + 1), edgeCmd, ac, function (f) {
      var p = prog(f, start, end), off = Math.round(E.inOutCubic(p) * (Lx - hw + lw * 2)) * sg;
      return {
        'position.x': sc0[0] + (v ? 0 : off),
        'position.y': sc0[1] - (v ? off : 0),
        alpha: Math.pow(H.bell(p), 0.5)
      };
    });
  });
  return { start: start, end: end };
});

/* 16. sliceShift */
reg('sliceShift', function (c) {
  var w = H.transWindow(c, 0.45, 'sliceShift'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, n = Math.max(2, Math.round(P.n || 7)), v = !!P.vert;
  var Lx = v ? W : Hh, Mx = v ? Hh : W, lw = Math.max(1, Math.min(W, Hh) * 0.003), ac = H.transAcc(c);
  H.hideCutDuring(c.graph, c, start, end);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var a0 = Math.round(idx * Lx / n), a1 = Math.round((idx + 1) * Lx / n), sg = idx % 2 ? 1 : -1;
      var poly = v ? rectScenePoly(a0, 0, a1, Hh, W, Hh) : rectScenePoly(0, a0, W, a1, W, Hh);
      var polys = Object.create(null);
      for (var f = start; f < end; f++) polys[f] = poly;
      var clA = H.cloneCutSubtree(c.graph, w.a, 'Slice A' + (idx + 1), start, end);
      clA.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      C.sample(c.graph, clA.rigId, start, end, function (f) {
        var o = Math.round(E.inOutCubic(cl((prog(f, start, end) - idx / Math.max(1, n - 1) * 0.3) / 0.7)) * Mx) * sg;
        return v ? { 'position.y': -o } : { 'position.x': o };
      });
      var clB = H.cloneCutSubtree(c.graph, c, 'Slice B' + (idx + 1), start, end);
      clB.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      C.sample(c.graph, clB.rigId, start, end, function (f) {
        var o = Math.round(E.inOutCubic(cl((prog(f, start, end) - idx / Math.max(1, n - 1) * 0.3) / 0.7)) * Mx) * sg - sg * Mx;
        return v ? { 'position.y': -o } : { 'position.x': o };
      });
    })(i);
  }
  for (var k = 1; k < n; k++) {
    var a = Math.round(k * Lx / n);
    var sc0 = v ? H_toScene(a, Hh / 2, W, Hh) : H_toScene(W / 2, a, W, Hh);
    var cmd = v ? G.rect(sc0[0] - lw / 2, -Hh / 2, lw, Hh) : G.rect(-W / 2, sc0[1] - lw / 2, W, lw);
    regOverlayBar(c, start, end, 'Slice line ' + k, cmd, ac, function (f) {
      return { alpha: 0.9 * Math.pow(H.bell(prog(f, start, end)), 0.7) };
    });
  }
  return { start: start, end: end };
});

/* 17. shatterTiles */
reg('shatterTiles', function (c) {
  var w = H.transWindow(c, 0.55, 'shatterTiles'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, n = Math.max(2, Math.round(P.n || 7));
  var cell = Math.max(W, Hh) / n, s0 = (c.cut.source && c.cut.source.seed) || 7;
  var cols = Math.ceil(W / cell - 1e-6), rows = Math.ceil(Hh / cell - 1e-6), D = Math.hypot(W, Hh);
  var cx = W * (P.x == null ? 0.5 : P.x), cy = Hh * (P.y == null ? 0.45 : P.y);
  addDimAboveB(c, start, end, '#000000', function (f) { return 0.3 * (1 - E.outCubic(prog(f, start, end))); }, 'Shatter dim');
  for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
    (function (ci, cj) {
      var x0 = Math.round(ci * W / cols), x1 = Math.round((ci + 1) * W / cols);
      var y0 = Math.round(cj * Hh / rows), y1 = Math.round((cj + 1) * Hh / rows);
      var mx = (x0 + x1) / 2, my = (y0 + y1) / 2, mSc = H_toScene(mx, my, W, Hh);
      var d = 0.5 * Math.hypot(mx - cx, my - cy) / D * 1.4 + 0.08 * N.random(s0, ci, cj, 3);
      var delay = Math.min(0.55, d);
      var tl = H.cloneCutSubtree(c.graph, w.a, 'Tile ' + (ci + 1) + '/' + (cj + 1), start, end);
      var polys = Object.create(null), poly = rectScenePoly(x0, y0, x1, y1, W, Hh);
      for (var f = start; f < end; f++) polys[f] = poly;
      tl.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      var vx = (N.random(s0, ci, cj, 4) * 2 - 1) * W * 0.12;
      var lift = N.random(s0, ci, cj, 6) * 0.08;
      var rot = (N.random(s0, ci, cj, 5) * 2 - 1) * 70;
      C.sample(c.graph, tl.rigId, start, end, function (f) {
        var t = cl((prog(f, start, end) - delay) / 0.45);
        var dx = vx * t, dy = (t * t * 1.25 - lift * t) * Hh, s = 1 - 0.25 * t, r = rot * t;
        var rad = r * PI / 180, cs = Math.cos(rad) * s, sn = Math.sin(rad) * s;
        /* Pivot about mSc in scene space (x' = dx + cx*(1-cs) + cy*sn) */
        return {
          'position.x': dx + mSc[0] - (mSc[0] * cs + mSc[1] * sn),
          'position.y': -dy + mSc[1] - (-mSc[0] * sn + mSc[1] * cs),
          rotation: -r,
          'scale.x': s, 'scale.y': s
        };
      });
      tl.paintables.forEach(function (id) {
        var node = c.graph.byId[id], base = node.attrs.alpha == null ? 1 : node.attrs.alpha;
        node.keys.alpha = node.keys.alpha || {};
        for (var f = start; f < end; f++) {
          var t = cl((prog(f, start, end) - delay) / 0.45);
          node.keys.alpha[f] = { value: base * (1 - H.smoothstep(0.7, 1, t)), type: 1 };
        }
      });
    })(i, j);
  }
  return { start: start, end: end };
});

/* 18. pixelate */
reg('pixelate', function (c) {
  var w = H.transWindow(c, 0.42, 'pixelate'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, md = Math.min(W, Hh), k = P.k || 14;
  var ac = H.transAcc(c);
  addDimBehindB(c, start, end, c.sc.bg, null, 'Pixelate bg');
  var copyA = H.cloneCutSubtree(c.graph, w.a, 'Pixelate A copy', start, end);
  copyA.paintables.forEach(function (id) {
    var n = c.graph.byId[id], base = n.attrs.alpha == null ? 1 : n.attrs.alpha;
    n.keys.alpha = n.keys.alpha || {};
    for (var f = start; f < end; f++) {
      var p = prog(f, start, end);
      n.keys.alpha[f] = { value: base * (1 - H.smoothstep(0.4, 0.6, p)), type: 1 };
    }
  });
  C.sample(c.graph, copyA.rigId, start, end, function (f) {
    var q = E.inCubic(cl(prog(f, start, end) / 0.55)), s = 1 + 0.14 * q;
    return { 'scale.x': s, 'scale.y': s };
  });
  var rigB = H.wrapCutRig(c, c, 'Pixelate B rig', start, end);
  C.sample(c.graph, rigB, start, end, function (f) {
    var q = E.inCubic(cl((1 - prog(f, start, end)) / 0.55)), s = 1 + 0.14 * q;
    return { 'scale.x': s, 'scale.y': s };
  });
  /* Quantized block overlay flickering at mid-transition */
  var cols = Math.max(4, Math.round(k * W / md)), rows = Math.max(4, Math.round(k * Hh / md));
  var contours = Object.create(null);
  for (var f = start; f < end; f++) {
    var p = prog(f, start, end), amp = Math.pow(H.bell(p), 1.2), polys = [];
    if (amp > 0.15) {
      for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
        if (N.random(f * 13 + i, j, 5) < amp * 0.45) {
          polys.push(rectScenePoly(i * W / cols, j * Hh / rows, (i + 1) * W / cols, (j + 1) * Hh / rows, W, Hh));
        }
      }
    }
    contours[f] = polys;
  }
  var mosaic = C.shape(c.graph, { id: c.cut.id, start: start, end: end }, c.cut.id + ' / Pixelate mosaic',
    c.sceneRoot, G.rect(-W / 2, -Hh / 2, W, Hh), { fill: ac, alpha: 0.28 });
  H.multiClip(c.graph, mosaic, contours, false, 'Pixelate blocks', c.options);
  return { start: start, end: end };
}, ['Quantized coarse grid overlay replaces pixel-buffer Mosaic filter in vector scene graph.']);

/* 19. cubeTurn */
reg('cubeTurn', function (c) {
  var w = H.transWindow(c, 0.52, 'cubeTurn'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, dir = P.dir < 0 ? -1 : 1, K = 8, SW = W / K;
  addDimBehindB(c, start, end, mixColors((w.a.sc || c.sc).bg, '#000000', 0.55), null, 'Cube back 1');
  addDimBehindB(c, start, end, mixColors(c.sc.bg, '#000000', 0.55), function (f) { return prog(f, start, end); }, 'Cube back 2');
  H.hideCutDuring(c.graph, c, start, end);
  function prj(x, z, cs, sn) {
    var xr = (x * cs - z * sn) * dir, zr = x * sn + z * cs, k = 2.4 / (3.4 - zr);
    return [W / 2 + xr * k * W / 2, k * Hh / 2];
  }
  var faces = [
    { src: w.a, e0: [-1, 1], e1: [1, 1], tag: 'A', isA: true },
    { src: c, e0: [1, 1], e1: [1, -1], tag: 'B', isA: false }
  ];
  faces.forEach(function (F) {
    for (var k = 0; k < K; k++) {
      (function (idx) {
        var u0 = idx / K, u1 = (idx + 1) / K, su = dir > 0 ? u0 : 1 - u1;
        var X0 = F.e0[0] + (F.e1[0] - F.e0[0]) * u0, Z0 = F.e0[1] + (F.e1[1] - F.e0[1]) * u0;
        var X1 = F.e0[0] + (F.e1[0] - F.e0[0]) * u1, Z1 = F.e0[1] + (F.e1[1] - F.e0[1]) * u1;
        var sl = H.cloneCutSubtree(c.graph, F.src, 'Cube ' + F.tag + (idx + 1), start, end);
        var polys = Object.create(null), poly = rectScenePoly(su * W - 0.5, 0, su * W + SW + 0.5, Hh, W, Hh);
        for (var f = start; f < end; f++) polys[f] = poly;
        sl.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
        var ax = su * W + SW / 2 - W / 2;
        C.sample(c.graph, sl.rigId, start, end, function (f) {
          var ph = E.inOutCubic(prog(f, start, end)) * PI / 2, cs = Math.cos(ph), sn = Math.sin(ph);
          var f0 = prj(F.e0[0], F.e0[1], cs, sn), f1 = prj(F.e1[0], F.e1[1], cs, sn);
          var vis = (f1[0] - f0[0]) * dir > 0.5;
          var q0 = prj(X0, Z0, cs, sn), q1 = prj(X1, Z1, cs, sn);
          var xa = Math.min(q0[0], q1[0]), xb = Math.max(q0[0], q1[0]), hv = (q0[1] + q1[1]) / 2;
          var sx = vis ? Math.max(1e-3, (xb - xa + 1) / SW) : 1e-3;
          var sy = Math.max(1e-3, 2 * hv / Hh), cx = (xa + xb) / 2 - W / 2;
          return { 'position.x': cx - ax * sx, 'scale.x': sx, 'scale.y': sy };
        });
        sl.paintables.forEach(function (id) {
          var node = c.graph.byId[id], base = node.attrs.alpha == null ? 1 : node.attrs.alpha;
          node.keys.alpha = node.keys.alpha || {};
          for (var f = start; f < end; f++) {
            var ph = E.inOutCubic(prog(f, start, end)) * PI / 2, cs = Math.cos(ph), sn = Math.sin(ph);
            var f0 = prj(F.e0[0], F.e0[1], cs, sn), f1 = prj(F.e1[0], F.e1[1], cs, sn);
            var vis = (f1[0] - f0[0]) * dir > 0.5;
            var dim = 1 - 0.55 * (F.isA ? (1 - cs) : (1 - sn));
            node.keys.alpha[f] = { value: vis ? base * dim : 0, type: 1 };
          }
        });
      })(k);
    }
  });
  return { start: start, end: end };
});

function mixColors(a, b, t) {
  return H.mixHex(a, b, t);
}
})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
