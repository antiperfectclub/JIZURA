/* 53 additional native FX recipes (ae/p_fx2.jsx + ae/p_horror4.jsx + ae/p_x2_*B2.jsx).
 * Paired with cavalry/packs/p_fx.js and cavalry/packs/p_fx_x2.js.
 */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = R.clamp, mix = R.mix, E = R.E, PI = Math.PI, TAU = R.T, DEG = PI / 180;

function reg(key, source, fn, diffs) {
  N.register('fx', key, {
    source: source + ' / fx:' + key,
    scope: 'event',
    differences: diffs || [],
    build: function (c) { return fn(c, H.fxSpan(c)); }
  });
}

function scPt(x, y, W, Hh) { return [x - W / 2, Hh / 2 - y]; }
function rectPoly(x0, y0, x1, y1, W, Hh) {
  var a = scPt(x0, y0, W, Hh), b = scPt(x1, y1, W, Hh);
  return [[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]];
}
function ahr(p, a, b) {
  return p < a ? E.outCubic(p / Math.max(1e-4, a)) : (p > b ? 1 - E.inCubic((p - b) / Math.max(1e-4, 1 - b)) : 1);
}
function vivid(sc) {
  var c = [sc.accent, sc.accent2, sc.ghostA, sc.ghostB, sc.fg];
  for (var i = 0; i < c.length; i++) if (c[i] && H.contrast(c[i], sc.bg) > 1.6) return c[i];
  return H.accCol(sc);
}
function ink(sc) { return sc.ink || sc.fg; }
function pop(sc) { return H.accCol(sc); }

function prog(f, s) {
  return (f - s.f0) / Math.max(1, s.f1 - s.f0 - 1);
}

/* Clone active cut subtrees overlapping [f0, f1) into a parent null under c.parent. */
function cloneActiveCuts(c, s, label, opts) {
  var g = c.graph, o = opts || {};
  var cutsRoot = g.layers.filter(function (l) { return l.name === 'JIZURA / Cuts'; })[0];
  if (!cutsRoot) return { rigId: H.rigTarget(c, label, s), paintables: [] };
  var rigId = g.add('null', 'FX ' + label + ' @' + s.f0, c.parent, s.f0, s.f1, {});
  if (o.belowCuts) {
    var i = g.layers.indexOf(g.byId[rigId]), j = g.layers.indexOf(cutsRoot);
    if (i > j && j >= 0) { var n = g.layers.splice(i, 1)[0]; g.layers.splice(j, 0, n); }
  }
  var cutGroups = g.layers.filter(function (l) { return l.parent === cutsRoot.id && l.type === 'null' && l.start < s.f1 && l.end > s.f0; });
  var paintables = [];
  cutGroups.forEach(function (grp) {
    var map = Object.create(null);
    map[grp.id] = rigId;
    var queue = g.layers.filter(function (l) {
      if (l.start >= s.f1 || l.end <= s.f0) return false;
      if (o.inkOnly && l.type === 'path' && /bg|background|grid|hatch/i.test(l.name)) return false;
      var cur = l;
      while (cur && cur.parent) {
        if (cur.parent === grp.id) return true;
        cur = g.byId[cur.parent];
      }
      return false;
    });
    queue.forEach(function (src) {
      if (src.type !== 'null' && src.type !== 'path' && src.type !== 'textShape') return;
      var cs = Math.max(s.f0, src.start), ce = Math.min(s.f1, src.end);
      if (ce <= cs) return;
      var pid = map[src.parent] || rigId;
      var attrs = V.copy(src.attrs);
      if (o.tintColor && (src.type === 'path' || src.type === 'textShape')) {
        if (attrs.fill !== false) attrs['material.materialColor'] = o.tintColor;
        if (attrs.stroke) attrs['stroke.strokeColor'] = o.tintColor;
      }
      var nid = g.add(src.type, src.name + ' / ' + label, pid, cs, ce, attrs, src.commands ? V.copy(src.commands) : null);
      var dst = g.byId[nid];
      Object.keys(src.keys).forEach(function (attr) {
        var trk = src.keys[attr], outT = {}, held = null;
        Object.keys(trk).map(Number).sort(function (a, b) { return a - b; }).forEach(function (f) {
          if (f <= cs) held = trk[f];
          if (f >= cs && f < ce) outT[f] = V.copy(trk[f]);
        });
        if (!Object.prototype.hasOwnProperty.call(outT, cs) && held != null) outT[cs] = V.copy(held);
        if (Object.keys(outT).length) dst.keys[attr] = outT;
      });
      map[src.id] = nid;
      if (src.type === 'path' || src.type === 'textShape') paintables.push(nid);
    });
  });
  return { rigId: rigId, paintables: paintables };
}

function addOverlay(c, f0, f1, name, cmds, paint, fn) {
  var id = C.shape(c.graph, { id: 'fx', start: f0, end: f1 }, name, c.parent, cmds, paint);
  if (fn) C.sample(c.graph, id, f0, f1, fn);
  return id;
}

/* ================================================================ p_fx2.jsx (26) */
reg('anamorphic', 'ae/p_fx2.jsx', function (c, s) {
  var dk = H.dark(s.sc.bg), col = vivid(s.sc), dir = N.random(s.seed, 3, 1) < 0.5 ? 1 : -1;
  var y = s.H * (0.5 + (N.random(s.seed, 1, 1) * 2 - 1) * 0.1), x = s.W * (0.5 + (N.random(s.seed, 2, 1) * 2 - 1) * 0.22);
  var M = Math.min(s.W, s.H), scP = scPt(x, y, s.W, s.H), a0 = cl(s.amp, 0.5, 1.2);
  var specs = [
    { name: 'Streak', rx: s.W * 0.65, ry: M * 0.04, col: dk ? col : H.mixHex(col, '#FFFFFF', 0.2), op: 0.45, mv: 1 },
    { name: 'Core', rx: s.W * 0.52, ry: Math.max(2, M * 0.008), col: dk ? '#FFFFFF' : col, op: 0.9, mv: 1 },
    { name: 'Flare orb', rx: M * 0.07, ry: M * 0.07, col: col, op: 0.6, mv: 1 }
  ];
  specs.forEach(function (sp) {
    addOverlay(c, s.f0, s.f1, 'FX Anamorphic ' + sp.name + ' @' + s.f0, G.ellipse(0, 0, sp.rx, sp.ry), { fill: sp.col, alpha: 1 }, function (f) {
      var p = prog(f, s), a = a0 * Math.pow(H.bell(p), 0.5) * (0.88 + 0.12 * N.random(s.seed, f * 7, 5));
      var dx = (p - 0.5) * s.W * 0.14 * dir * sp.mv;
      return { 'position.x': scP[0] + dx, 'position.y': scP[1], alpha: cl(a * sp.op) };
    });
  });
});

reg('bandInvert', 'ae/p_fx2.jsx', function (c, s) {
  var vert = N.random(s.seed, 2, 1) < 0.22, Lx = vert ? s.W : s.H, Mx = vert ? s.H : s.W;
  var contours = Object.create(null);
  for (var f = s.f0; f < s.f1; f++) {
    var st = Math.floor(f * 12 / s.fps) * 13 + s.seed, n = 2 + (Math.floor(N.random(st, 1, 1) * 99) % 4), polys = [];
    for (var i = 0; i < n; i++) {
      var h = Math.max(2, Lx * mix(0.012, 0.12, N.random(st, i, 3)) * cl(s.amp, 0.6, 1.3));
      var y = Lx * mix(0.12, 0.88, N.random(st, i, 4)) - h / 2;
      var part = N.random(st, i, 5) < 0.35, x0 = part ? Mx * mix(0, 0.5, N.random(st, i, 6)) : 0, w = part ? Mx * mix(0.25, 0.6, N.random(st, i, 7)) : Mx;
      polys.push(vert ? rectPoly(y, x0, y + h, x0 + w, s.W, s.H) : rectPoly(x0, y, x0 + w, y + h, s.W, s.H));
    }
    contours[f] = polys;
  }
  var id = addOverlay(c, s.f0, s.f1, 'FX Band Invert @' + s.f0, G.rect(-s.W / 2, -s.H / 2, s.W, s.H), { fill: vivid(s.sc), alpha: 0.72 });
  H.multiClip(c.graph, id, contours, false, 'Invert bands', c.options);
}, ['Vector band overlay approximates AE Difference blend bands in graph IR.']);

reg('colorBars', 'ae/p_fx2.jsx', function (c, s) {
  var vert = N.random(s.seed, 1, 1) < (s.W >= s.H ? 0.35 : 0.15), dir = N.random(s.seed, 2, 1) < 0.5 ? 1 : -1;
  var src = [s.sc.accent, s.sc.accent2, s.sc.ghostA, s.sc.ghostB, s.sc.fg];
  var cols = src.filter(function (x) { return x && H.contrast(x, s.sc.bg) > 1.35; });
  if (!cols.length) cols = [ink(s.sc)];
  var Lx = vert ? s.W : s.H, Mx = vert ? s.H : s.W, n = 4 + (Math.abs(s.seed) % 4);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var th = Math.max(2, Lx * mix(0.008, 0.045, N.random(s.seed, idx, 4)));
      var d = N.random(s.seed, idx, 5) * 0.4, sp = mix(0.9, 1.5, N.random(s.seed, idx, 6));
      var part = N.random(s.seed, idx, 7) < 0.4, m0 = part ? Mx * mix(0, 0.5, N.random(s.seed, idx, 8)) : 0, mw = part ? Mx * mix(0.3, 0.6, N.random(s.seed, idx, 9)) : Mx;
      var col = cols[(idx + (Math.abs(s.seed) % cols.length)) % cols.length];
      var cmd = vert ? G.rect(-th / 2, -mw / 2, th, mw) : G.rect(-mw / 2, -th / 2, mw, th);
      addOverlay(c, s.f0, s.f1, 'FX ColorBar ' + (idx + 1) + ' @' + s.f0, cmd, { fill: col, alpha: 0.92 }, function (f) {
        var u = cl((prog(f, s) - d) / Math.max(0.01, 1 - d) * sp);
        var ps = -th + (Lx + 2 * th) * u;
        if (dir < 0) ps = Lx - ps;
        var pt = vert ? scPt(ps, m0 + mw / 2, s.W, s.H) : scPt(m0 + mw / 2, ps, s.W, s.H);
        return { 'position.x': pt[0], 'position.y': pt[1], alpha: (u <= 0 || u >= 1) ? 0 : 0.92 };
      });
    })(i);
  }
});

reg('defocus', 'ae/p_fx2.jsx', function (c, s) {
  var target = H.rigTarget(c, 'defocus', s), ac = cl(s.amp, 0.6, 1.2);
  C.sample(c.graph, target, s.f0, s.f1, function (f) {
    var p = prog(f, s), amt = (p < 0.5 ? E.inOutCubic(p / 0.5) : 1 - E.inOutCubic((p - 0.5) / 0.5)) * ac;
    var scf = 1 + 0.025 * amt;
    return { 'scale.x': scf, 'scale.y': scf };
  });
  var blurProfile = c.options && c.options.hostProfile && c.options.hostProfile.gaussianBlur;
  if (blurProfile && blurProfile.layerType && blurProfile.amountAttr) {
    var cutsRoot = c.graph.layers.filter(function (l) { return l.name === 'JIZURA / Cuts'; })[0];
    if (cutsRoot) {
      var bid = c.graph.add(blurProfile.layerType, 'FX Defocus Blur @' + s.f0, cutsRoot.id, s.f0, s.f1, {});
      c.graph.connect(bid, 'id', cutsRoot.id, 'filters');
      C.sample(c.graph, bid, s.f0, s.f1, function (f) {
        var p = prog(f, s), amt = (p < 0.5 ? E.inOutCubic(p / 0.5) : 1 - E.inOutCubic((p - 0.5) / 0.5)) * ac;
        var o = {}; o[blurProfile.amountAttr] = amt * s.H / 27; return o;
      });
    }
  }
}, ['Uses Gaussian Blur filter when hostProfile.gaussianBlur is configured; scale breath always emitted.']);

reg('ditherBit', 'ae/p_fx2.jsx', function (c, s) {
  var c0 = s.sc.bg, c1 = vivid(s.sc), dk = H.lum(c0) < 0.5;
  var cell = Math.max(8, Math.round(s.H / 36));
  var contours = Object.create(null);
  for (var f = s.f0; f < s.f1; f++) {
    var polys = [], k = (f - s.f0) % 2;
    for (var y = k * cell; y < s.H; y += cell * 2) for (var x = k * cell; x < s.W; x += cell * 2) {
      if (N.random(s.seed, x + y * 3, f) < 0.45) polys.push(rectPoly(x, y, x + cell * 0.55, y + cell * 0.55, s.W, s.H));
    }
    contours[f] = polys;
  }
  var id = addOverlay(c, s.f0, s.f1, 'FX Dither dots @' + s.f0, G.rect(-s.W / 2, -s.H / 2, s.W, s.H), { fill: dk ? c1 : c0, alpha: 0.45 });
  H.multiClip(c.graph, id, contours, false, 'Dither lattice', c.options);
});

reg('dustScratches', 'ae/p_fx2.jsx', function (c, s) {
  var dk = H.dark(s.sc.bg), col = dk ? '#FFFDF5' : '#181008', lw = Math.max(1, Math.min(s.W, s.H) * 0.002);
  var ac = cl(s.amp, 0.6, 1.2);
  var contours = Object.create(null);
  for (var f = s.f0; f < s.f1; f++) {
    var st = Math.floor(f * 12 / s.fps) * 31 + s.seed, polys = [];
    for (var i = 0; i < 10; i++) {
      var x = N.random(st, i, 15) * s.W, y = N.random(st, i, 16) * s.H, r = Math.max(2, Math.min(s.W, s.H) * mix(0.003, 0.009, N.random(st, i, 17)));
      polys.push(rectPoly(x - r, y - r * 0.6, x + r, y + r * 0.6, s.W, s.H));
    }
    for (var j = 0; j < 2; j++) {
      var sx = s.W * (0.1 + 0.8 * N.random(s.seed, j, 5)) + (N.random(st, j, 6) * 2 - 1) * 8;
      var y0 = N.random(s.seed, j, 7) < 0.5 ? 0 : s.H * 0.3 * N.random(st, j, 8);
      var y1 = y0 + s.H * mix(0.35, 0.85, N.random(st, j, 10));
      polys.push(rectPoly(sx - lw, y0, sx + lw, y1, s.W, s.H));
    }
    contours[f] = polys;
  }
  var id = addOverlay(c, s.f0, s.f1, 'FX Dust & scratches @' + s.f0, G.rect(-s.W / 2, -s.H / 2, s.W, s.H), { fill: col, alpha: 1 });
  H.multiClip(c.graph, id, contours, false, 'Dust & scratches', c.options);
  C.sample(c.graph, id, s.f0, s.f1, function (f) { return { alpha: cl(ahr(prog(f, s), 0.08, 0.7) * ac * 0.75) }; });
});

reg('echoFrames', 'ae/p_fx2.jsx', function (c, s) {
  var a = cl(s.amp, 0.5, 1.3), M = Math.min(s.W, s.H) * a;
  var ang = N.random(s.seed, 1, 1) < 0.65 ? (N.random(s.seed, 2, 1) < 0.5 ? 0 : PI) : (N.random(s.seed, 3, 1) < 0.5 ? 0.25 : 0.75) * PI;
  var ca = Math.cos(ang), sa = Math.sin(ang);
  for (var i = 4; i >= 1; i--) {
    (function (idx) {
      var cln = cloneActiveCuts(c, s, 'Echo ' + idx, { belowCuts: true });
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
        var d = M * (0.02 + 0.035 * E.outCubic(prog(f, s))) * idx;
        return { 'position.x': ca * d, 'position.y': -sa * d };
      });
      cln.paintables.forEach(function (pid) {
        var n = c.graph.byId[pid], base = n.attrs.alpha == null ? 1 : n.attrs.alpha;
        n.keys.alpha = n.keys.alpha || {};
        for (var f = s.f0; f < s.f1; f++) {
          var p = prog(f, s), fade = p < 0.1 ? 1 : 1 - H.inOutQuart((p - 0.1) / 0.9);
          n.keys.alpha[f] = { value: cl(base * fade * (0.64 - idx * 0.12)), type: 1 };
        }
      });
    })(i);
  }
});

reg('edgeDetect', 'ae/p_fx2.jsx', function (c, s) {
  var col = H.mixHex(vivid(s.sc), '#FFFFFF', H.dark(s.sc.bg) ? 0.45 : 0);
  var cln = cloneActiveCuts(c, s, 'Edge detect', { inkOnly: true });
  cln.paintables.forEach(function (pid) {
    var n = c.graph.byId[pid];
    n.attrs.fill = false; n.attrs.stroke = true;
    n.attrs['stroke.strokeColor'] = col;
    n.attrs['stroke.width'] = Math.max(1.5, 2.5 * s.u);
    var base = n.attrs.alpha == null ? 1 : n.attrs.alpha;
    n.keys.alpha = n.keys.alpha || {};
    for (var f = s.f0; f < s.f1; f++) {
      n.keys.alpha[f] = { value: cl(base * ahr(prog(f, s), 0.1, 0.72)), type: 1 };
    }
  });
});

reg('filmAdvance', 'ae/p_fx2.jsx', function (c, s) {
  var dir = N.random(s.seed, 1, 1) < 0.7 ? 1 : -1, gap = Math.max(2, s.H * 0.03);
  var target = H.rigTarget(c, 'filmAdvance', s);
  C.sample(c.graph, target, s.f0, s.f1, function (f) {
    var p = prog(f, s), env = p < 0.22 ? E.inOutCubic(p / 0.22) : (p > 0.78 ? 1 - E.inOutCubic((p - 0.78) / 0.22) : 1);
    var z = 1 - 0.17 * env, q = E.inOutCubic(cl((p - 0.2) / 0.6));
    var off = ((q * s.H * dir) % s.H + s.H) % s.H;
    if (off > s.H / 2) off -= s.H;
    return { 'position.y': off * z, 'scale.x': z, 'scale.y': z };
  });
  [-1, 1].forEach(function (side) {
    addOverlay(c, s.f0, s.f1, 'FX Film margin ' + (side < 0 ? 'L' : 'R') + ' @' + s.f0, G.rect(-s.W * 0.045, -s.H / 2, s.W * 0.09, s.H),
      { fill: '#0D0B09', alpha: 1 }, function (f) {
        var p = prog(f, s), env = p < 0.22 ? E.inOutCubic(p / 0.22) : (p > 0.78 ? 1 - E.inOutCubic((p - 0.78) / 0.22) : 1);
        return { 'position.x': side * (s.W * 0.455), alpha: env };
      });
  });
  addOverlay(c, s.f0, s.f1, 'FX Film gate line @' + s.f0, G.rect(-s.W / 2, -gap / 2, s.W, gap), { fill: '#0D0B09', alpha: 1 }, function (f) {
    var p = prog(f, s), env = p < 0.22 ? E.inOutCubic(p / 0.22) : (p > 0.78 ? 1 - E.inOutCubic((p - 0.78) / 0.22) : 1);
    var q = E.inOutCubic(cl((p - 0.2) / 0.6));
    return { 'position.y': s.H / 2 - ((s.H * q * dir) % s.H + s.H) % s.H, 'scale.y': Math.max(0.01, env), alpha: env };
  });
});

reg('focusLines', 'ae/p_fx2.jsx', function (c, s) {
  var M = Math.min(s.W, s.H), R = Math.hypot(s.W, s.H) * 0.75, n = 48;
  var cx = s.W / 2 + (N.random(s.seed, 1, 1) * 2 - 1) * s.W * 0.03, cy = s.H / 2 + (N.random(s.seed, 2, 1) * 2 - 1) * s.H * 0.03;
  var rx = s.W * 0.42, ry = s.H * 0.36;
  var contours = Object.create(null);
  for (var f = s.f0; f < s.f1; f++) {
    var st = Math.floor(f * 12 / s.fps) * 5 + s.seed, polys = [];
    for (var i = 0; i < n; i++) {
      var an = (i + N.random(st, i, 4) * 0.8) / n * TAU, w = M * mix(0.003, 0.012, N.random(st, i, 5)), tip = mix(1, 1.4, N.random(st, i, 6));
      var tx = cx + Math.cos(an) * rx * tip, ty = cy + Math.sin(an) * ry * tip;
      var nx = -Math.sin(an), ny = Math.cos(an), ox = cx + Math.cos(an) * R, oy = cy + Math.sin(an) * R;
      polys.push([scPt(tx, ty, s.W, s.H), scPt(ox + nx * w, oy + ny * w, s.W, s.H), scPt(ox - nx * w, oy - ny * w, s.W, s.H)]);
    }
    contours[f] = polys;
  }
  var id = addOverlay(c, s.f0, s.f1, 'FX Focus lines @' + s.f0, G.rect(-s.W / 2, -s.H / 2, s.W, s.H), { fill: ink(s.sc), alpha: 1 });
  H.multiClip(c.graph, id, contours, false, 'Focus lines', c.options);
  C.sample(c.graph, id, s.f0, s.f1, function (f) { return { alpha: 0.85 * ahr(prog(f, s), 0.1, 0.72) }; });
});

reg('heartbeat', 'ae/p_fx2.jsx', function (c, s) {
  var dk = H.dark(s.sc.bg), ac = cl(s.amp, 0.5, 1.2), col = H.mixHex(vivid(s.sc), '#000000', dk ? 0.1 : 0.25);
  var target = H.rigTarget(c, 'heartbeat', s);
  function pulse(x, cc, w) {
    var u = (x - cc) / w;
    return (u < 0 || u > 1) ? 0 : (u < 0.22 ? E.outCubic(u / 0.22) : 1 - E.inOutCubic((u - 0.22) / 0.78));
  }
  C.sample(c.graph, target, s.f0, s.f1, function (f) {
    var p = prog(f, s), P = Math.max(pulse(p, 0, 0.36), 0.8 * pulse(p, 0.44, 0.56)) * ac;
    var scf = 1 + 0.03 * P;
    return { 'scale.x': scf, 'scale.y': scf };
  });
  var border = Math.min(s.W, s.H) * 0.22;
  addOverlay(c, s.f0, s.f1, 'FX Heartbeat vignette @' + s.f0, G.ellipse(0, 0, s.W * 0.55, s.H * 0.55),
    { stroke: col, width: border, alpha: 1 }, function (f) {
      var p = prog(f, s), P = Math.max(pulse(p, 0, 0.36), 0.8 * pulse(p, 0.44, 0.56)) * ac;
      return { alpha: cl((dk ? 0.55 : 0.75) * P) };
    });
});

reg('kaleido', 'ae/p_fx2.jsx', function (c, s) {
  var n = N.random(s.seed, 1, 1) < 0.5 ? 6 : 8, th = 360 / n, R = Math.hypot(s.W, s.H) * 1.2;
  var wedge = [[0, 0], [R * Math.cos(-th * DEG / 2), R * Math.sin(-th * DEG / 2)], [R, 0], [R * Math.cos(th * DEG / 2), R * Math.sin(th * DEG / 2)]];
  var polys = Object.create(null);
  for (var f = s.f0; f < s.f1; f++) polys[f] = wedge;
  var r0 = N.random(s.seed, 2, 1) * 360, sg = N.random(s.seed, 3, 1) < 0.5 ? 1 : -1;
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var cln = cloneActiveCuts(c, s, 'Kaleido ' + (idx + 1));
      cln.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
        var p = prog(f, s), z = 1.05 + 0.12 * p, rot = r0 + p * 30 * sg + idx * th;
        return { 'scale.x': (idx % 2 ? -z : z), 'scale.y': z, rotation: -rot, alpha: p > 0.75 ? 1 - (p - 0.75) / 0.25 * 0.5 : 1 };
      });
    })(i);
  }
});

reg('lightRays', 'ae/p_fx2.jsx', function (c, s) {
  var dk = H.dark(s.sc.bg), col = dk ? H.mixHex(s.sc.fg, '#FFFFFF', 0.3) : H.mixHex(vivid(s.sc), '#FFFFFF', 0.35);
  var cx = s.W * (0.5 + (N.random(s.seed, 1, 1) * 2 - 1) * 0.12), cy = s.H * (0.42 + (N.random(s.seed, 2, 1) * 2 - 1) * 0.1);
  var n = 10 + (Math.abs(s.seed) % 6), rot0 = N.random(s.seed, 4, 1) * TAU, sg = N.random(s.seed, 7, 1) < 0.5 ? 1 : -1;
  var R = Math.hypot(s.W, s.H) * 1.1, a0 = cl(s.amp, 0.5, 1.2), cSc = scPt(cx, cy, s.W, s.H);
  var rig = c.graph.add('null', 'FX LightRays @' + s.f0, c.parent, s.f0, s.f1, { 'position.x': cSc[0], 'position.y': cSc[1] });
  for (var i = 0; i < n; i++) {
    var an = rot0 + i / n * TAU + (N.random(s.seed, i, 5) * 2 - 1) * 0.12, w = TAU / n * mix(0.14, 0.4, N.random(s.seed, i, 6));
    var pts = [[0, 0], [Math.cos(an - w / 2) * R, -Math.sin(an - w / 2) * R], [Math.cos(an + w / 2) * R, -Math.sin(an + w / 2) * R]];
    C.shape(c.graph, { id: 'fx', start: s.f0, end: s.f1 }, 'Ray ' + (i + 1), rig, V.commands(pts, true), { fill: col, alpha: 0.32 });
  }
  C.sample(c.graph, rig, s.f0, s.f1, function (f) {
    var p = prog(f, s), scf = 0.4 + 0.6 * E.outCubic(p);
    return { 'scale.x': scf, 'scale.y': scf, rotation: -(p * 0.22 * sg * 180 / PI), alpha: cl(a0 * Math.pow(H.bell(p), 0.6) * 0.8) };
  });
});

reg('loopScroll', 'ae/p_fx2.jsx', function (c, s) {
  var vert = N.random(s.seed, 1, 1) < (s.W < s.H ? 0.6 : 0.2), dir = N.random(s.seed, 2, 1) < 0.5 ? 1 : -1, Lx = vert ? s.H : s.W;
  var target = H.rigTarget(c, 'loopScroll', s);
  C.sample(c.graph, target, s.f0, s.f1, function (f) {
    var p = prog(f, s), o = ((E.inOutCubic(p) * Lx * dir) % Lx + Lx) % Lx;
    if (o > Lx / 2) o -= Lx;
    return vert ? { 'position.y': -o } : { 'position.x': o };
  });
});

reg('negativeRing', 'ae/p_fx2.jsx', function (c, s) {
  var M = Math.min(s.W, s.H), dia = N.random(s.seed, 1, 1) < 0.35, a = cl(s.amp, 0.6, 1.3);
  var cx = s.W / 2 + (N.random(s.seed, 2, 1) * 2 - 1) * s.W * 0.05, cy = s.H / 2 + (N.random(s.seed, 3, 1) * 2 - 1) * s.H * 0.05;
  var Rm = Math.hypot(s.W, s.H) * (dia ? 0.75 : 0.56), cSc = scPt(cx, cy, s.W, s.H);
  var specs = [{ off: 0.04, sp: 1.05, w: M * 0.16 * a }, { off: -0.22 * 1.35, sp: 1.35, w: M * 0.05 * a }];
  specs.forEach(function (sp, idx) {
    var cmds = dia ? V.commands([[1, 0], [0, 1], [-1, 0], [0, -1]], true) : G.ellipse(0, 0, 1, 1);
    addOverlay(c, s.f0, s.f1, 'FX Negative ring ' + (idx + 1) + ' @' + s.f0, cmds, { stroke: vivid(s.sc), width: 1, alpha: 1 }, function (f) {
      var q = prog(f, s) * sp.sp + sp.off, on = q > 0 && q < 1, r = on ? Math.max(1e-3, E.outCubic(q) * Rm) : 1e-3;
      return {
        'position.x': cSc[0], 'position.y': cSc[1],
        'scale.x': r, 'scale.y': r,
        'stroke.width': on ? Math.max(0.5, sp.w * (1 - 0.55 * q) / r) : 1,
        alpha: on ? 0.85 : 0
      };
    });
  });
});

reg('perspectiveTilt', 'ae/p_fx2.jsx', function (c, s) {
  var cols = N.random(s.seed, 1, 1) < (s.W >= s.H ? 0.7 : 0.35), dir = N.random(s.seed, 2, 1) < 0.5 ? 1 : -1;
  var PH = dir * (30 + 10 * N.random(s.seed, 3, 1)) * cl(s.amp, 0.5, 1.2), Lx = cols ? s.W : s.H, Mx = cols ? s.H : s.W;
  var Np = 8, DD = 1.15 * Math.max(s.W, s.H), HL = Lx / 2;
  function phAt(p) {
    var e = p < 0.25 ? E.outCubic(p / 0.25) : Math.cos((p - 0.25) / 0.75 * PI * 1.5) * Math.exp(-2.6 * (p - 0.25) / 0.75);
    return PH * e * DEG;
  }
  for (var i = 0; i < Np; i++) {
    (function (idx) {
      var u0 = -1 + 2 * idx / Np, u1 = -1 + 2 * (idx + 1) / Np, s0 = idx * Lx / Np, s1 = (idx + 1) * Lx / Np;
      var cln = cloneActiveCuts(c, s, 'Persp ' + (idx + 1));
      var poly = cols ? rectPoly(s0 - 1, -20, s1 + 1, s.H + 20, s.W, s.H) : rectPoly(-20, s0 - 1, s.W + 20, s1 + 1, s.W, s.H);
      var polys = Object.create(null); for (var f = s.f0; f < s.f1; f++) polys[f] = poly;
      cln.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      var pv = cols ? scPt((s0 + s1) / 2, s.H / 2, s.W, s.H) : scPt(s.W / 2, (s0 + s1) / 2, s.W, s.H);
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
        var ph = phAt(prog(f, s)), co = Math.cos(ph), si = Math.sin(ph);
        function pp(u) { return DD / (DD + u * HL * si); }
        function dd(u) { return HL + u * HL * co * pp(u); }
        var d0 = dd(u0), d1 = dd(u1), h = (pp(u0) + pp(u1)) / 2;
        var sx = cols ? Math.max(1e-3, (d1 - d0) / (s1 - s0)) : Math.max(1e-3, h);
        var sy = cols ? Math.max(1e-3, h) : Math.max(1e-3, (d1 - d0) / (s1 - s0));
        var midD = (d0 + d1) / 2;
        return cols
          ? { 'position.x': (midD - s.W / 2) - pv[0] * sx, 'scale.x': sx, 'scale.y': sy }
          : { 'position.y': (s.H / 2 - midD) - pv[1] * sy, 'scale.x': sx, 'scale.y': sy };
      });
    })(i);
  }
});

reg('ripple', 'ae/p_fx2.jsx', function (c, s) {
  var dk = H.dark(s.sc.bg), M = Math.min(s.W, s.H), lam = M * 0.1;
  var cx = s.W * (0.5 + (N.random(s.seed, 1, 1) * 2 - 1) * 0.1), cy = s.H * (0.5 + (N.random(s.seed, 2, 1) * 2 - 1) * 0.08);
  var Rmax = Math.hypot(Math.max(cx, s.W - cx), Math.max(cy, s.H - cy)), cSc = scPt(cx, cy, s.W, s.H);
  var col = dk ? '#FFFFFF' : H.mixHex(s.sc.fg, s.sc.bg, 0.4), sw = Math.max(2, lam / 5 * 0.9);
  for (var j = 2; j >= 0; j--) {
    (function (idx) {
      addOverlay(c, s.f0, s.f1, 'FX Ripple crest ' + (idx + 1) + ' @' + s.f0, G.ellipse(0, 0, 1, 1),
        { stroke: col, width: 1, alpha: 1 }, function (f) {
          var p = prog(f, s), front = (0.05 + 0.95 * H.inOutQuart(p)) * Rmax * 1.05;
          var rc = front - lam * (idx + 0.25);
          if (rc <= 2) return { 'position.x': cSc[0], 'position.y': cSc[1], 'scale.x': 1, 'scale.y': 1, 'stroke.width': 1, alpha: 0 };
          var a = 0.22 * Math.exp(-idx * 0.9) * (1 - 0.6 * p) * (dk ? 1.6 : 1.2);
          return { 'position.x': cSc[0], 'position.y': cSc[1], 'scale.x': rc, 'scale.y': rc, 'stroke.width': sw / rc, alpha: cl(a) };
        });
    })(j);
  }
});

reg('rotateSnap', 'ae/p_fx2.jsx', function (c, s) {
  var dir = N.random(s.seed, 1, 1) < 0.5 ? 1 : -1, TH = dir * (3 + 2 * N.random(s.seed, 2, 1)) * cl(s.amp, 0.5, 1.3);
  var target = H.rigTarget(c, 'rotateSnap', s);
  C.sample(c.graph, target, s.f0, s.f1, function (f) {
    var p = prog(f, s), e = p < 0.12 ? 1 : Math.exp(-4.5 * (p - 0.12)) * Math.cos((p - 0.12) * PI * 2.4);
    var th = TH * e, q = Math.abs(th) * DEG, co = Math.cos(q), sn = Math.sin(q);
    var z = Math.max((s.W * co + s.H * sn) / s.W, (s.W * sn + s.H * co) / s.H) * (1 + 0.025 * Math.abs(e));
    return { rotation: -th, 'scale.x': z, 'scale.y': z };
  });
});

reg('scanBar', 'ae/p_fx2.jsx', function (c, s) {
  var dk = H.dark(s.sc.bg), down = N.random(s.seed, 1, 1) < 0.7, bh = Math.max(8, s.H * 0.06);
  var col = dk ? H.mixHex(vivid(s.sc), '#FFFFFF', 0.4) : vivid(s.sc), lh = Math.max(2, s.H * 0.004);
  function yAt(f) { var p = prog(f, s), yy = -bh + p * (s.H + 2 * bh); return down ? yy : s.H - yy; }
  addOverlay(c, s.f0, s.f1, 'FX ScanBar glow @' + s.f0, G.rect(-s.W / 2, -bh / 2, s.W, bh),
    { fill: col, alpha: dk ? 0.5 : 0.35 }, function (f) { return { 'position.y': s.H / 2 - yAt(f) }; });
  addOverlay(c, s.f0, s.f1, 'FX ScanBar line @' + s.f0, G.rect(-s.W / 2, -lh / 2, s.W, lh),
    { fill: dk ? '#FFFFFF' : col, alpha: 0.9 }, function (f) { return { 'position.y': s.H / 2 - yAt(f) }; });
});

reg('shatter', 'ae/p_fx2.jsx', function (c, s) {
  var M = Math.min(s.W, s.H), dk = H.dark(s.sc.bg);
  var px = s.W * (0.5 + (N.random(s.seed, 1, 1) * 2 - 1) * 0.15), py = s.H * (0.5 + (N.random(s.seed, 2, 1) * 2 - 1) * 0.12);
  var n = 8 + (Math.abs(s.seed) % 4), R = Math.hypot(s.W, s.H) * 0.9;
  var crackCol = dk ? '#FFFFFF' : ink(s.sc), lw = Math.max(1.5, M * 0.003);
  for (var i = 0; i < n; i++) {
    var an = (i + (N.random(s.seed, i, 6) * 2 - 1) * 0.35) / n * TAU;
    var pts = [scPt(px, py, s.W, s.H), scPt(px + Math.cos(an) * R, py + Math.sin(an) * R, s.W, s.H)];
    addOverlay(c, s.f0, s.f1, 'FX Shatter ray ' + (i + 1) + ' @' + s.f0, V.commands(pts, false),
      { stroke: crackCol, width: lw, alpha: 1 }, function (f) {
        var u = (prog(f, s) - 0.125) / 0.875;
        return { alpha: cl((u <= 0 ? 1 : Math.max(0, 1 - u * 1.4)) * 0.75) };
      });
  }
  var cSc = scPt(px, py, s.W, s.H);
  addOverlay(c, s.f0, s.f1, 'FX Shatter flash @' + s.f0, G.ellipse(cSc[0], cSc[1], M * 0.16, M * 0.16),
    { fill: '#FFFFFF', alpha: 1 }, function (f) { var p = prog(f, s); return { alpha: p < 0.2 ? 0.85 * (1 - p / 0.2) : 0 }; });
});

reg('snapshot', 'ae/p_fx2.jsx', function (c, s) {
  var M = Math.min(s.W, s.H), RT = (N.random(s.seed, 1, 1) < 0.5 ? -1 : 1) * (2 + 2.5 * N.random(s.seed, 2, 1));
  var target = H.rigTarget(c, 'snapshot', s);
  function envAt(p) { return p < 0.16 ? E.outBack(p / 0.16, 1.4) : (p > 0.8 ? 1 - E.inOutCubic((p - 0.8) / 0.2) : 1); }
  C.sample(c.graph, target, s.f0, s.f1, function (f) {
    var env = envAt(prog(f, s)), z = 1 - 0.15 * env, rot = RT * env;
    return { 'scale.x': z, 'scale.y': z, rotation: -rot };
  });
  var frame = addOverlay(c, s.f0, s.f1, 'FX Snapshot frame @' + s.f0, G.rect(-s.W / 2, -s.H / 2, s.W, s.H),
    { stroke: '#F7F5F0', width: 1, alpha: 1 }, function (f) {
      var env = cl(envAt(prog(f, s))), z = 1 - 0.15 * env, rot = RT * env, bw = M * 0.024 * env;
      return { 'scale.x': z, 'scale.y': z, rotation: -rot, 'stroke.width': Math.max(1, bw / z), alpha: env > 0.02 ? 1 : 0 };
    });
  void frame;
  addOverlay(c, s.f0, s.f1, 'FX Snapshot flash @' + s.f0, G.rect(-s.W / 2, -s.H / 2, s.W, s.H),
    { fill: '#FFFFFF', alpha: 1 }, function (f) { var p = prog(f, s); return { alpha: p < 0.22 ? 0.9 * (1 - p / 0.22) : 0 }; });
});

reg('speedLines', 'ae/p_fx2.jsx', function (c, s) {
  var vert = s.W < s.H ? N.random(s.seed, 1, 1) < 0.5 : N.random(s.seed, 1, 1) < 0.15;
  var dir = N.random(s.seed, 2, 1) < 0.5 ? 1 : -1, Lx = vert ? s.H : s.W, Mx = vert ? s.W : s.H;
  var n = 20 + (Math.abs(s.seed) % 10), c1 = ink(s.sc), c2 = vivid(s.sc);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var q = N.random(s.seed, idx, 4);
      if (Math.abs(q - 0.5) < 0.12 && N.random(s.seed, idx, 9) < 0.8) q = q < 0.5 ? 0.38 - N.random(s.seed, idx, 10) * 0.33 : 0.62 + N.random(s.seed, idx, 10) * 0.33;
      var pp = q * Mx, len = Lx * mix(0.15, 0.55, N.random(s.seed, idx, 5)), th = Math.max(1.5, Mx * mix(0.002, 0.008, N.random(s.seed, idx, 6)));
      var sp = mix(1.3, 2.6, N.random(s.seed, idx, 7)), ph = N.random(s.seed, idx, 8), op = mix(0.4, 0.9, N.random(s.seed, idx, 11));
      var col = N.random(s.seed, idx, 12) < 0.22 ? c2 : c1, tl = -len * dir;
      var pts = !vert ? [[tl, 0], [0, -th / 2], [0, th / 2]] : [[0, tl], [-th / 2, 0], [th / 2, 0]];
      addOverlay(c, s.f0, s.f1, 'FX Speed line ' + (idx + 1) + ' @' + s.f0, V.commands(pts, true), { fill: col, alpha: 1 }, function (f) {
        var p = prog(f, s), fr = (ph + p * sp) % 1, hx = -len * 0.2 + fr * (Lx + len * 1.2);
        if (dir < 0) hx = Lx - hx;
        var pt = vert ? scPt(pp, hx, s.W, s.H) : scPt(hx, pp, s.W, s.H);
        return { 'position.x': pt[0], 'position.y': pt[1], alpha: cl(ahr(p, 0.12, 0.7) * op) };
      });
    })(i);
  }
});

reg('squash', 'ae/p_fx2.jsx', function (c, s) {
  var hor = N.random(s.seed, 1, 1) < 0.6, ac = cl(s.amp, 0.5, 1.3);
  var target = H.rigTarget(c, 'squash', s);
  C.sample(c.graph, target, s.f0, s.f1, function (f) {
    var p = prog(f, s), e = Math.cos(p * PI * 2.5) * Math.exp(-1.8 * p) * (1 - Math.pow(p, 6)), a = 0.17 * ac * e;
    return { 'scale.x': hor ? 1 + a : 1 - a * 0.6, 'scale.y': hor ? 1 - a * 0.6 : 1 + a };
  });
});

reg('starGlint', 'ae/p_fx2.jsx', function (c, s) {
  var dk = H.dark(s.sc.bg), M = Math.min(s.W, s.H), col = vivid(s.sc), n = 2 + (Math.abs(s.seed) % 3), port = s.H > s.W;
  var ac = cl(s.amp, 0.6, 1.3);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var t0 = idx * 0.16 + N.random(s.seed, idx, 4) * 0.06, R = M * (0.1 + 0.07 * N.random(s.seed, idx, 5)) * ac;
      var x = s.W * (0.5 + (N.random(s.seed, idx, 2) * 2 - 1) * (port ? 0.3 : 0.34));
      var y = s.H * (0.5 + (N.random(s.seed, idx, 3) * 2 - 1) * (port ? 0.14 : 0.1)), scP = scPt(x, y, s.W, s.H);
      var r0 = (N.random(s.seed, idx, 6) * 2 - 1) * 12;
      var pts = [];
      for (var j = 0; j < 16; j++) {
        var an = j * PI / 8, rr = j % 2 ? R * 0.07 : (j % 4 === 0 ? R : R * 0.42);
        pts.push([Math.cos(an) * rr, Math.sin(an) * rr]);
      }
      addOverlay(c, s.f0, s.f1, 'FX Star glint ' + (idx + 1) + ' @' + s.f0, V.commands(pts, true),
        { fill: dk ? '#FFFFFF' : col, alpha: 1 }, function (f) {
          var u = (prog(f, s) - t0) / 0.55, g = (u > 0 && u < 1) ? Math.pow(Math.sin(PI * u), 0.8) : 0;
          var scf = Math.max(1e-3, g);
          return { 'position.x': scP[0], 'position.y': scP[1], 'scale.x': scf, 'scale.y': scf, rotation: -(r0 + u * 30), alpha: g > 0.01 ? 1 : 0 };
        });
    })(i);
  }
});

reg('tvStatic', 'ae/p_fx2.jsx', function (c, s) {
  var ac = cl(s.amp, 0.7, 1.1), contours = Object.create(null);
  var cell = Math.max(8, Math.round(Math.min(s.W, s.H) / 28));
  for (var f = s.f0; f < s.f1; f++) {
    var p = prog(f, s), cov = (p < 0.4 ? 0.5 + 0.5 * E.outQuart(p / 0.4) : 1 - E.outQuart((p - 0.4) / 0.6)) * ac;
    var polys = [];
    for (var k = 0; k < Math.round(35 * cov); k++) {
      var x = N.random(f * 3, k, 1) * s.W, y = N.random(f * 5, k, 2) * s.H;
      polys.push(rectPoly(x, y, x + cell * mix(0.6, 2.5, N.random(f, k, 3)), y + cell * 0.45, s.W, s.H));
    }
    contours[f] = polys;
  }
  var id = addOverlay(c, s.f0, s.f1, 'FX TV static specks @' + s.f0, G.rect(-s.W / 2, -s.H / 2, s.W, s.H), { fill: '#D8D8D8', alpha: 0.7 });
  H.multiClip(c.graph, id, contours, false, 'TV static', c.options);
  addOverlay(c, s.f0, s.f1, 'FX TV static band @' + s.f0, G.rect(-s.W / 2, -s.H * 0.08, s.W, s.H * 0.16), { fill: '#000000', alpha: 0.3 }, function (f) {
    var p = prog(f, s), cov = (p < 0.4 ? 0.5 + 0.5 * E.outQuart(p / 0.4) : 1 - E.outQuart((p - 0.4) / 0.6)) * ac;
    return { 'position.y': s.H / 2 - ((N.random(s.seed, f, 4) * 1.2 - 0.1) * s.H + s.H * 0.08), alpha: 0.3 * cl(cov) };
  });
});

reg('zoomStutter', 'ae/p_fx2.jsx', function (c, s) {
  var a = cl(s.amp, 0.5, 1.3), z0 = (0.035 + 0.012 * N.random(s.seed, 1, 1)) * a;
  var cxs = [0, 1, 2].map(function (j) { return (N.random(s.seed, 2, j) * 2 - 1) * s.W * 0.04; });
  var cys = [0, 1, 2].map(function (j) { return (N.random(s.seed, 3, j) * 2 - 1) * s.H * 0.04; });
  var target = H.rigTarget(c, 'zoomStutter', s);
  C.sample(c.graph, target, s.f0, s.f1, function (f) {
    var j = Math.min(2, Math.floor(prog(f, s) * 3)), z = 1 + (j + 1) * z0;
    return { 'position.x': -cxs[j] * (z - 1), 'position.y': cys[j] * (z - 1), 'scale.x': z, 'scale.y': z };
  });
});

/* ================================================================ Horror / Kinetic / Typo / Wa (27) */
reg('hrPassingShadow', 'ae/p_horror4.jsx', function (c, s) {
  var dir = N.random(s.seed, 1, 1) < 0.5 ? 1 : -1, M = Math.min(s.W, s.H), w = M * mix(0.22, 0.32, N.random(s.seed, 2, 1));
  var top = s.H * mix(0.05, 0.2, N.random(s.seed, 3, 1)), dk = H.dark(s.sc.bg);
  var col = dk ? H.mixHex(s.sc.fg, s.sc.bg, 0.35) : '#000000';
  [[1, dk ? 0.3 : 0.65], [1.12, dk ? 0.15 : 0.3]].forEach(function (gg, k) {
    var gk = gg[0], pts = [
      [-w * 0.5 * gk, -s.H / 2], [-w * 0.55 * gk, s.H / 2 - (top + w * 0.95)],
      [-w * 0.3 * gk, s.H / 2 - (top + w * (0.72 - 0.05 * gk))], [0, s.H / 2 - (top + w * (0.7 - 0.05 * gk))],
      [w * 0.3 * gk, s.H / 2 - (top + w * (0.72 - 0.05 * gk))], [w * 0.55 * gk, s.H / 2 - (top + w * 0.95)],
      [w * 0.5 * gk, -s.H / 2]
    ];
    addOverlay(c, s.f0, s.f1, 'FX Passing shadow ' + k + ' @' + s.f0, V.commands(pts, true), { fill: col, alpha: gg[1] }, function (f) {
      var p = prog(f, s), x = dir > 0 ? mix(-s.W * 0.25, s.W * 1.25, p) : mix(s.W * 1.25, -s.W * 0.25, p);
      return { 'position.x': x - s.W / 2 };
    });
  });
});

reg('hrSignalLoss', 'ae/p_horror4.jsx', function (c, s) {
  var target = H.rigTarget(c, 'hrSignalLoss', s);
  C.sample(c.graph, target, s.f0, s.f1, function (f) {
    var p = prog(f, s), dx = p < 0.3 ? (N.random(s.seed, f, 1) * 2 - 1) * s.W * 0.08 * (p / 0.3) : 0;
    var dy = p > 0.78 ? (1 - cl((p - 0.78) / 0.22)) * s.H * 0.5 : 0;
    return { 'position.x': dx, 'position.y': -dy };
  });
  addOverlay(c, s.f0, s.f1, 'FX SignalLoss black @' + s.f0, G.rect(-s.W / 2, -s.H / 2, s.W, s.H), { fill: '#000000', alpha: 1 }, function (f) {
    var p = prog(f, s);
    return { alpha: p < 0.3 ? 0.5 * p / 0.3 : (p < 0.78 ? 1 : 0) };
  });
  var fs = Math.max(10, Math.round(Math.min(s.W, s.H) * 0.035));
  var ch = '0' + (3 + (Math.abs(s.seed) % 7));
  ['NO SIGNAL', 'CH ' + ch.slice(-2)].forEach(function (txt, idx) {
    var pt = scPt(s.W * 0.06, s.H * 0.08 + idx * fs * 1.5, s.W, s.H);
    var fnt = H.primaryFont(c);
    var tId = c.graph.add('textShape', 'FX ' + txt + ' @' + s.f0, c.parent, s.f0, s.f1, {
      text: txt, font: { font: fnt.family, style: fnt.style }, fontSize: fs,
      autoWidth: true, autoHeight: true, horizontalAlignment: 0, verticalAlignment: 1,
      position: [pt[0], pt[1]], fill: true, stroke: false, 'material.materialColor': '#FFFFFF', alpha: 1
    });
    C.sample(c.graph, tId, s.f0, s.f1, function (f) {
      var p = prog(f, s), on = p >= 0.3 && p < 0.78;
      return { alpha: on ? (idx ? 0.6 : ((Math.floor(f * 12 / s.fps) % 4 < 3) ? 0.85 : 0.3)) : 0 };
    });
  });
});

reg('hrSubliminal', 'ae/p_horror4.jsx', function (c, s) {
  var z = 1.25 + 0.2 * N.random(s.seed, 1, 1);
  var cx = (N.random(s.seed, 2, 1) * 2 - 1) * s.W * 0.08, cy = (N.random(s.seed, 3, 1) * 2 - 1) * s.H * 0.08;
  var red = H.mixHex(H.fitContrast(s.sc.accent, '#FFFFFF', 2.5), '#000000', 0.25);
  var end = Math.max(s.f0 + 1, Math.round(s.f0 + (s.f1 - s.f0) * 0.55));
  var cln = cloneActiveCuts(c, { f0: s.f0, f1: end }, 'Subliminal', { tintColor: red });
  c.graph.byId[cln.rigId].attrs.position = [-cx * (z - 1), cy * (z - 1)];
  c.graph.byId[cln.rigId].attrs.scale = [z, z];
});

reg('hzClosingDark', 'ae/p_x2_horrorB.jsx', function (c, s) {
  var R = Math.hypot(s.W, s.H) / 2, am = cl(s.amp, 0.7, 1.1);
  var cSc = scPt(s.W * (0.5 + (N.random(s.seed, 1, 1) * 2 - 1) * 0.05), s.H * (0.5 + (N.random(s.seed, 2, 1) * 2 - 1) * 0.05), s.W, s.H);
  var border = R * 0.85;
  addOverlay(c, s.f0, s.f1, 'FX ClosingDark @' + s.f0, G.ellipse(cSc[0], cSc[1], R * 0.9, R * 0.9),
    { stroke: '#000000', width: border, alpha: 1 }, function (f) {
      var p = prog(f, s), e = ahr(p, 0.4, 0.5) * am, wob = 1 + 0.04 * Math.sin(p * 23 + (Math.abs(s.seed) % 7));
      var scf = (1 - 0.5 * e) * wob;
      return { 'scale.x': scf, 'scale.y': scf, alpha: cl(0.96 * e) };
    });
});

reg('hzColdBreath', 'ae/p_x2_horrorB.jsx', function (c, s) {
  var dk = H.dark(s.sc.bg), col = H.mixHex(s.sc.fg, s.sc.bg, dk ? 0.25 : 0.72), M = Math.min(s.W, s.H);
  var x0 = s.W * mix(0.3, 0.7, N.random(s.seed, 1, 1)), lean = (N.random(s.seed, 2, 1) * 2 - 1) * s.W * 0.16;
  var A = (dk ? 0.2 : 0.3) * cl(s.amp, 0.7, 1.1);
  for (var j = 0; j < 9; j++) {
    (function (idx) {
      var d = idx * 0.055, rMax = M * (0.14 + 0.18 * N.random(s.seed, idx, 3));
      var dx = lean * (0.4 + idx * 0.15) + (N.random(s.seed, idx, 4) * 2 - 1) * M * 0.34;
      var dy = s.H * (0.16 + 0.34 * N.random(s.seed, idx, 5));
      addOverlay(c, s.f0, s.f1, 'FX Breath puff ' + (idx + 1) + ' @' + s.f0, G.ellipse(0, 0, rMax, rMax),
        { fill: col, alpha: 1 }, function (f) {
          var q = cl((prog(f, s) - d) / Math.max(0.01, 1 - d)), e = E.outCubic(q), scf = Math.max(1e-3, 0.25 + 0.75 * e);
          var pt = scPt(x0 + dx * e, s.H * 1.03 - dy * e, s.W, s.H);
          return { 'position.x': pt[0], 'position.y': pt[1], 'scale.x': scf, 'scale.y': scf, alpha: (q <= 0 || q >= 1) ? 0 : cl(A * Math.sin(PI * Math.pow(q, 0.7))) };
        });
    })(j);
  }
});

reg('hzDrain', 'ae/p_x2_horrorB.jsx', function (c, s) {
  var am = cl(s.amp, 0.6, 1.1), pale = H.mixHex(s.sc.fg, s.sc.bg, 0.5);
  H.fullRect(c, s, 'FX Drain pale @' + s.f0, pale, function (p) { return 0.38 * ahr(p, 0.15, 0.55) * am; });
});

reg('hzFaint', 'ae/p_x2_horrorB.jsx', function (c, s) {
  var am = cl(s.amp, 0.7, 1.1), dx0 = (N.random(s.seed, 1, 1) * 2 - 1) * s.W * 0.02, ro0 = (N.random(s.seed, 2, 1) * 2 - 1) * 0.02 * 180 / PI;
  var target = H.rigTarget(c, 'hzFaint', s);
  C.sample(c.graph, target, s.f0, s.f1, function (f) {
    var e = ahr(prog(f, s), 0.38, 0.52) * am, z = 1 - 0.11 * e;
    return { 'position.x': dx0 * e, 'position.y': -s.H * 0.025 * e, 'scale.x': z, 'scale.y': z, rotation: -(ro0 * e) };
  });
  H.fullRect(c, s, 'FX Faint dim @' + s.f0, '#000000', function (p) { return 0.5 * cl(ahr(p, 0.38, 0.52) * am); });
});

reg('hzTear', 'ae/p_x2_horrorB.jsx', function (c, s) {
  var M = Math.min(s.W, s.H), n = 14, x0 = s.W * mix(0.28, 0.72, N.random(s.seed, 1, 1));
  var slip = M * 0.014 * (N.random(s.seed, 2, 1) < 0.5 ? 1 : -1), lean = (N.random(s.seed, 3, 1) * 2 - 1) * s.W * 0.05;
  var pts = [];
  for (var j = 0; j <= n; j++) pts.push([x0 + lean * (j / n - 0.5) + (N.random(s.seed, j, 4) * 2 - 1) * M * 0.022, j === 0 ? -s.H * 0.2 : (j === n ? s.H * 1.2 : s.H * j / n)]);
  var G0 = M * 0.075 * cl(s.amp, 0.7, 1.2);
  var contours = Object.create(null);
  for (var f = s.f0; f < s.f1; f++) {
    var p = prog(f, s), op = p < 0.18 ? E.outCubic(p / 0.18) : 1 - E.inOutCubic((p - 0.18) / 0.82), gap = G0 * op;
    if (gap < 0.6) { contours[f] = []; continue; }
    var poly = [];
    for (var i = 0; i <= n; i++) poly.push(scPt(pts[i][0] - gap / 2, pts[i][1], s.W, s.H));
    for (var i2 = n; i2 >= 0; i2--) poly.push(scPt(pts[i2][0] + gap / 2, pts[i2][1], s.W, s.H));
    contours[f] = [poly];
  }
  var id = addOverlay(c, s.f0, s.f1, 'FX Tear seam @' + s.f0, G.rect(-s.W / 2, -s.H / 2, s.W, s.H), { fill: '#000000', alpha: 0.92 });
  H.multiClip(c.graph, id, contours, false, 'Tear seam', c.options);
});

reg('hzUpside', 'ae/p_x2_horrorB.jsx', function (c, s) {
  var end = Math.max(s.f0 + 1, Math.round(s.f0 + (s.f1 - s.f0) * 0.7));
  var target = H.rigTarget(c, 'hzUpside', s);
  c.graph.key(target, 'scale.x', s.f0, 1.06, 1);
  c.graph.key(target, 'scale.y', s.f0, -1.06, 1);
  if (end < s.fc) { c.graph.key(target, 'scale.x', end, 1, 1); c.graph.key(target, 'scale.y', end, 1, 1); }
  addOverlay(c, s.f0, end, 'FX Upside dim @' + s.f0, G.rect(-s.W / 2, -s.H / 2, s.W, s.H), { fill: '#000000', alpha: 0.42 });
});

reg('kzBulldoze', 'ae/p_x2_kineticB2.jsx', function (c, s) {
  var M = Math.min(s.W, s.H), vert = N.random(s.seed, 1, 1) < (s.W < s.H ? 0.6 : 0.15), rev = N.random(s.seed, 2, 1) < 0.5;
  var Lc = vert ? s.H : s.W, target = H.rigTarget(c, 'kzBulldoze', s);
  var anchor = vert ? (rev ? -s.H / 2 : s.H / 2) : (rev ? s.W / 2 : -s.W / 2);
  C.sample(c.graph, target, s.f0, s.f1, function (f) {
    var b = Math.round(Lc * E.inOutSine(prog(f, s))), rest = Math.max(0.01, (Lc - b) / Lc);
    return vert ? { 'position.y': anchor * (1 - rest), 'scale.y': rest } : { 'position.x': anchor * (1 - rest), 'scale.x': rest };
  });
  addOverlay(c, s.f0, s.f1, 'FX Bulldoze bar @' + s.f0, vert ? G.rect(-s.W / 2, -0.5, s.W, 1) : G.rect(-0.5, -s.H / 2, 1, s.H),
    { fill: pop(s.sc), alpha: 1 }, function (f) {
      var p = prog(f, s), b = Math.round(Lc * E.inOutSine(p)), rest = Lc - b, seam = rev ? rest : b;
      var bw = Math.max(3, M * 0.03 * cl(s.amp, 0.6, 1.3) * Math.sin(PI * p));
      var on = p > 0 && p < 1 && rest >= 1;
      return vert
        ? { 'position.y': s.H / 2 - seam, 'scale.y': bw, alpha: on ? 1 : 0 }
        : { 'position.x': seam - s.W / 2, 'scale.x': bw, alpha: on ? 1 : 0 };
    });
});

reg('kzCardSlam', 'ae/p_x2_kineticB2.jsx', function (c, s) {
  var a = cl(s.amp, 0.6, 1.3), sg = N.random(s.seed, 1, 1) < 0.5 ? 1 : -1;
  var target = H.rigTarget(c, 'kzCardSlam', s);
  C.sample(c.graph, target, s.f0, s.f1, function (f) {
    var p = prog(f, s), lift = 0, z = 1, rot = 0;
    if (p >= 0.68) {
      var q = (p - 0.68) / 0.32;
      z = 1 + 0.035 * a * Math.exp(-q * 3) * Math.cos(q * PI * 1.5);
    } else {
      lift = p < 0.28 ? E.outBack(p / 0.28, 1.8) : (p < 0.56 ? 1 : 1 - E.inCubic((p - 0.56) / 0.12));
      z = 1 - 0.11 * a * lift; rot = -1.6 * sg * lift;
    }
    return { 'scale.x': z, 'scale.y': z, rotation: -rot };
  });
  addOverlay(c, s.f0, s.f1, 'FX CardSlam frame @' + s.f0, G.rect(-s.W / 2, -s.H / 2, s.W, s.H),
    { stroke: pop(s.sc), width: Math.max(2, Math.min(s.W, s.H) * 0.008), alpha: 1 }, function (f) {
      var p = prog(f, s);
      if (p >= 0.68) return { alpha: 0 };
      var lift = p < 0.28 ? E.outBack(p / 0.28, 1.8) : (p < 0.56 ? 1 : 1 - E.inCubic((p - 0.56) / 0.12));
      var z = 1 - 0.11 * a * lift, rot = -1.6 * sg * lift;
      return { 'scale.x': z, 'scale.y': z, rotation: -rot, alpha: cl(lift) };
    });
});

reg('kzDustLanding', 'ae/p_x2_kineticB2.jsx', function (c, s) {
  var M = Math.min(s.W, s.H), a = cl(s.amp, 0.6, 1.3), col = H.mixHex(s.sc.fg, s.sc.bg, 0.45);
  var target = H.rigTarget(c, 'kzDustLanding', s);
  C.sample(c.graph, target, s.f0, s.f1, function (f) {
    var p = prog(f, s), drop = p < 0.1 ? E.outCubic(p / 0.1) : Math.exp(-(p - 0.1) / 0.9 * 3.5) * Math.cos((p - 0.1) / 0.9 * PI * 1.75);
    return { 'position.y': -Math.round(M * 0.028 * a * drop) };
  });
  [-1, 1].forEach(function (sd) {
    for (var i = 0; i < 6; i++) {
      (function (idx) {
        var u = (idx + 1) / 6, rK = M * (0.02 + 0.04 * N.random(s.seed, idx, sd + 2)) * a, yK = M * 0.07 * u * N.random(s.seed, idx, 7);
        addOverlay(c, s.f0, s.f1, 'FX Dust ' + (sd < 0 ? 'L' : 'R') + (idx + 1) + ' @' + s.f0, G.ellipse(0, 0, 1, 1),
          { fill: col, alpha: 1 }, function (f) {
            var q = cl((prog(f, s) - 0.05) / 0.95), e = E.outCubic(q), r = Math.max(0.5, rK * (0.45 + 0.9 * e) * (1 - 0.55 * q));
            var px = s.W / 2 + sd * (s.W * 0.06 + s.W * 0.38 * u * e), py = s.H - r * 0.5 - yK * e;
            var pt = scPt(px, py, s.W, s.H);
            return { 'position.x': pt[0], 'position.y': pt[1], 'scale.x': r, 'scale.y': r, alpha: (q <= 0 || q >= 1) ? 0 : 0.9 * (1 - 0.4 * u) * (1 - q) };
          });
      })(i);
    }
  });
});

reg('kzEdgeHit', 'ae/p_x2_kineticB2.jsx', function (c, s) {
  var M = Math.min(s.W, s.H), a = cl(s.amp, 0.6, 1.3), side = Math.abs(s.seed) % 4, u = 0.3 + 0.4 * N.random(s.seed, 2, 1);
  var hx = side === 0 ? 0 : (side === 1 ? s.W : s.W * u), hy = side === 2 ? 0 : (side === 3 ? s.H : s.H * u);
  var nx = side === 0 ? 1 : (side === 1 ? -1 : 0), ny = side === 2 ? 1 : (side === 3 ? -1 : 0);
  var hSc = scPt(hx, hy, s.W, s.H), target = H.rigTarget(c, 'kzEdgeHit', s);
  C.sample(c.graph, target, s.f0, s.f1, function (f) {
    var p = prog(f, s), rec = (p < 0.14 ? E.outCubic(p / 0.14) : Math.exp(-(p - 0.14) / 0.86 * 3.2) * Math.cos((p - 0.14) / 0.86 * PI * 1.5)) * M * 0.035 * a;
    return { 'position.x': Math.round(nx * rec), 'position.y': -Math.round(ny * rec) };
  });
  var base = Math.atan2(ny, nx), pc = pop(s.sc);
  for (var i = 0; i < 9; i++) {
    (function (idx) {
      var an = base + ((idx + 0.5) / 9 - 0.5) * 2.5 + (N.random(s.seed, idx, 3) * 2 - 1) * 0.08;
      var lenK = M * mix(0.2, 0.48, N.random(s.seed, idx, 4)) * a, wK = M * mix(0.012, 0.028, N.random(s.seed, idx, 5));
      addOverlay(c, s.f0, s.f1, 'FX Hit spike ' + (idx + 1) + ' @' + s.f0, V.commands([[0, -0.5], [1, 0], [0, 0.5]], true),
        { fill: idx % 3 === 1 ? s.sc.fg : pc, alpha: 1 }, function (f) {
          var p = prog(f, s), g = p < 0.22 ? E.outCubic(p / 0.22) : 1, out = E.outCubic(cl((p - 0.18) / 0.82));
          var len = lenK * g, r0 = M * 0.03 + len * 1.1 * out, r1 = r0 + len * (1 - out), w = wK * (1 - out);
          var dx = Math.cos(an) * r0, dy = -Math.sin(an) * r0;
          return { 'position.x': hSc[0] + dx, 'position.y': hSc[1] + dy, rotation: -(an * 180 / PI), 'scale.x': Math.max(0.5, r1 - r0), 'scale.y': Math.max(0.5, w), alpha: (r1 - r0 < 1 || w < 0.4) ? 0 : 1 };
        });
    })(i);
  }
});

reg('kzKnockSmear', 'ae/p_x2_kineticB2.jsx', function (c, s) {
  var vert = N.random(s.seed, 1, 1) < 0.25, dir = N.random(s.seed, 2, 1) < 0.5 ? 1 : -1, M = Math.min(s.W, s.H);
  var dk = H.dark(s.sc.bg);
  function offAt(p) {
    var e = p < 0.18 ? E.outCubic(p / 0.18) : Math.exp(-(p - 0.18) / 0.82 * 3.4) * Math.cos((p - 0.18) / 0.82 * PI * 1.8);
    return dir * M * 0.05 * cl(s.amp, 0.6, 1.3) * e;
  }
  var target = H.rigTarget(c, 'kzKnockSmear', s);
  C.sample(c.graph, target, s.f0, s.f1, function (f) {
    var o = Math.round(offAt(prog(f, s)));
    return vert ? { 'position.y': -o } : { 'position.x': o };
  });
  for (var i = 1; i < 6; i++) {
    (function (idx) {
      var fr = idx / 6, cln = cloneActiveCuts(c, s, 'Smear ' + idx, { belowCuts: dk });
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
        var o = Math.round(offAt(prog(f, s)) * (1 - fr * 1.6));
        return vert ? { 'position.y': -o } : { 'position.x': o };
      });
      cln.paintables.forEach(function (pid) {
        var n = c.graph.byId[pid], base = n.attrs.alpha == null ? 1 : n.attrs.alpha;
        n.keys.alpha = n.keys.alpha || {};
        for (var f = s.f0; f < s.f1; f++) {
          var o = offAt(prog(f, s));
          n.keys.alpha[f] = { value: Math.abs(o) < 1 ? 0 : base * 0.42 * (1 - fr), type: 1 };
        }
      });
    })(i);
  }
});

reg('kzShockArcs', 'ae/p_x2_kineticB2.jsx', function (c, s) {
  var M = Math.min(s.W, s.H), a = cl(s.amp, 0.6, 1.3), vert = s.W < s.H * 0.9, Lc = vert ? s.H : s.W;
  var target = H.rigTarget(c, 'kzShockArcs', s);
  C.sample(c.graph, target, s.f0, s.f1, function (f) {
    var p = prog(f, s), pu = p < 0.15 ? E.outCubic(p / 0.15) : 1 - E.inOutCubic((p - 0.15) / 0.85), st = 1 + 0.035 * a * pu;
    return vert ? { 'scale.y': st } : { 'scale.x': st };
  });
  var bs = vert ? [90, -90] : [0, 180], pc = pop(s.sc);
  for (var i = 0; i < 3; i++) for (var k = 0; k < 2; k++) {
    (function (idx, side) {
      var pts = H.arcPts(0, 0, 1, 1, -0.5, 0.5, 16);
      addOverlay(c, s.f0, s.f1, 'FX ShockArc ' + idx + '_' + side + ' @' + s.f0, V.commands(pts, false),
        { stroke: pc, width: 1, alpha: 1 }, function (f) {
          var q = cl((prog(f, s) - idx * 0.11) / 0.7), R = Lc * (0.2 + 0.28 * E.outCubic(q));
          var lw = Math.max(0.5, M * 0.024 * a * (1 - idx * 0.22) * (1 - q));
          return { 'scale.x': R, 'scale.y': R, rotation: -bs[side], 'stroke.width': lw / Math.max(1, R), alpha: (q <= 0 || q >= 1) ? 0 : 1 - q * q };
        });
    })(i, k);
  }
});

reg('tzColumnShift', 'ae/p_x2_typoB.jsx', function (c, s) {
  var n = 4 + (Math.abs(s.seed) % 3), sg = (s.seed & 1) ? 1 : -1, d = s.H * 0.04 * cl(s.amp, 0.6, 1.4), w = Math.max(1.5, Math.min(s.W, s.H) * 0.002);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var x0 = Math.round(idx * s.W / n), x1 = Math.round((idx + 1) * s.W / n), colSg = ((idx & 1) ? 1 : -1) * sg;
      var cln = cloneActiveCuts(c, s, 'ColShift ' + (idx + 1));
      var polys = Object.create(null), poly = rectPoly(x0, 0, x1, s.H, s.W, s.H);
      for (var f = s.f0; f < s.f1; f++) polys[f] = poly;
      cln.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
        var p = prog(f, s), lv = p >= 1 ? 0 : (p < 0.18 ? 0.5 : (p < 0.5 ? 1 : 1 - E.inOutCubic((p - 0.5) / 0.5)));
        return { 'position.y': -Math.round(colSg * d * lv) };
      });
      if (idx > 0) {
        addOverlay(c, s.f0, s.f1, 'FX ColShift rule ' + idx + ' @' + s.f0, G.rect(x0 - s.W / 2 - w / 2, -s.H / 2, w, s.H),
          { fill: pop(s.sc), alpha: 1 }, function (f) {
            var p = prog(f, s), lv = p >= 1 ? 0 : (p < 0.18 ? 0.5 : (p < 0.5 ? 1 : 1 - E.inOutCubic((p - 0.5) / 0.5)));
            return { alpha: 0.7 * Math.min(1, lv * 2) };
          });
      }
    })(i);
  }
});

reg('tzFrameStep', 'ae/p_x2_typoB.jsx', function (c, s) {
  var a = Math.min(s.W, s.H) * 0.024 * cl(s.amp, 0.5, 1.4), path = [[1, 0], [1, 1], [0, 1], [0, 0]];
  var sx = (s.seed & 1) ? 1 : -1, sy = (s.seed & 2) ? 1 : -1, target = H.rigTarget(c, 'tzFrameStep', s);
  C.sample(c.graph, target, s.f0, s.f1, function (f) {
    var i = Math.min(3, Math.floor(prog(f, s) * 4)), q = (s.seed & 4) ? [path[i][1], path[i][0]] : path[i];
    return { 'position.x': Math.round(q[0] * sx * a), 'position.y': -Math.round(q[1] * sy * a) };
  });
});

reg('tzGridFlash', 'ae/p_x2_typoB.jsx', function (c, s) {
  var rows = s.W > s.H ? 12 : 18, cols = s.W > s.H ? 6 : 4, w = Math.max(1.2, Math.min(s.W, s.H) * 0.0018);
  var col = pop(s.sc), am = cl(s.amp, 0, 1) * 0.5;
  for (var r = 1; r < rows; r++) {
    var ry = s.H / 2 - Math.round(r * s.H / rows);
    addOverlay(c, s.f0, s.f1, 'FX GridFlash r' + r + ' @' + s.f0, G.rect(-s.W / 2, ry - w / 2, s.W, w), { fill: col, alpha: 1 }, function (f) {
      var p = prog(f, s);
      return { alpha: am * (p < 0.65 ? 1 : 1 - E.inCubic((p - 0.65) / 0.35)) };
    });
  }
  for (var cc = 1; cc < cols; cc++) {
    var cx = Math.round(cc * s.W / cols) - s.W / 2;
    addOverlay(c, s.f0, s.f1, 'FX GridFlash c' + cc + ' @' + s.f0, G.rect(cx - w / 2, -s.H / 2, w, s.H), { fill: col, alpha: 1 }, function (f) {
      var p = prog(f, s);
      return { alpha: am * (p < 0.65 ? 1 : 1 - E.inCubic((p - 0.65) / 0.35)) };
    });
  }
});

reg('tzKnockBand', 'ae/p_x2_typoB.jsx', function (c, s) {
  var dk = H.dark(s.sc.bg), col = dk ? s.sc.fg : s.sc.bg, bh = Math.max(4, Math.round(s.H * (0.14 + 0.1 * N.random(s.seed, 1, 1)) * cl(s.amp, 0.7, 1.3)));
  var y0 = cl(s.H * (0.5 + 0.14 * (N.random(s.seed, 2, 1) * 2 - 1)), bh / 2, s.H - bh / 2);
  addOverlay(c, s.f0, s.f1, 'FX KnockBand @' + s.f0, G.rect(-s.W / 2, -bh / 2, s.W, bh), { fill: col, alpha: 0.9 }, function (f) {
    return { 'position.y': s.H / 2 - y0, 'scale.y': prog(f, s) < 0.55 ? 1 : 0.34 };
  });
});

reg('tzRegTicks', 'ae/p_x2_typoB.jsx', function (c, s) {
  var mn = Math.min(s.W, s.H), w = Math.max(1.2, mn * 0.002), ins = mn * 0.07, len = mn * 0.04, gap = mn * 0.012, col = pop(s.sc);
  var am = cl(s.amp, 0, 1);
  [-1, 1].forEach(function (a) {
    [-1, 1].forEach(function (b) {
      var x = a < 0 ? ins : s.W - ins, y = b < 0 ? ins : s.H - ins;
      [V.commands([scPt(x + a * gap, y, s.W, s.H), scPt(x + a * (gap + len), y, s.W, s.H)], false),
       V.commands([scPt(x, y + b * gap, s.W, s.H), scPt(x, y + b * (gap + len), s.W, s.H)], false)].forEach(function (cmd, idx) {
        addOverlay(c, s.f0, s.f1, 'FX RegTick ' + a + b + idx + ' @' + s.f0, cmd, { stroke: col, width: w, alpha: 1 }, function (f) {
          var p = prog(f, s);
          return { alpha: (p < 0.3 || (p >= 0.45 && p < 0.82)) ? am : 0 };
        });
      });
    });
  });
});

reg('tzRuleFlash', 'ae/p_x2_typoB.jsx', function (c, s) {
  var n = 2 + (Math.abs(s.seed) % 2), w = Math.max(1.5, Math.min(s.W, s.H) * 0.0025), vert = N.random(s.seed, 2, 1) < 0.2;
  var LL = vert ? s.W : s.H, M = vert ? s.H : s.W, col = pop(s.sc);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var pos = Math.round(LL * (1 + ((Math.abs(s.seed) % 3) + idx * 4) % 11) / 12);
      var cmd = vert ? G.rect(-w / 2, -0.5, w, 1) : G.rect(-0.5, -w / 2, 1, w);
      addOverlay(c, s.f0, s.f1, 'FX RuleFlash ' + (idx + 1) + ' @' + s.f0, cmd, { fill: col, alpha: 1 }, function (f) {
        var u = cl(prog(f, s) * 1.25 - idx * 0.1), hd = E.outCubic(cl(u / 0.45)), tl = E.inCubic(cl((u - 0.5) / 0.5));
        var sLen = Math.max(0.5, M * Math.max(0, hd - tl));
        return vert
          ? { 'position.x': pos - s.W / 2, 'position.y': s.H / 2 - M * (hd + tl) / 2, 'scale.y': sLen, alpha: sLen > 1 ? cl(s.amp) : 0 }
          : { 'position.x': M * (hd + tl) / 2 - s.W / 2, 'position.y': s.H / 2 - pos, 'scale.x': sLen, alpha: sLen > 1 ? cl(s.amp) : 0 };
      });
    })(i);
  }
});

reg('wzHanafubuki', 'ae/p_x2_waB2.jsx', function (c, s) {
  var mn = Math.min(s.W, s.H), dir = N.random(s.seed, 1, 1) < 0.5 ? 1 : -1, n = Math.round(28 + 14 * cl(s.amp, 0.5, 1.3));
  var c1 = pop(s.sc), c2 = (s.sc.accent2 && H.contrast(s.sc.accent2, s.sc.bg) > 1.4) ? s.sc.accent2 : c1;
  var cols = [c1, c2, H.mixHex(c1, '#FFFFFF', 0.45)], X0 = (dir > 0 ? -0.08 : 1.08) * s.W;
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var ph = N.random(s.seed, idx, 3) * TAU, y0 = s.H * (-0.25 + 1.05 * N.random(s.seed, idx, 4)), sp = mn * (0.016 + 0.022 * N.random(s.seed, idx, 5));
      var d0 = 0.4 * N.random(s.seed, idx, 2);
      var pts = [[0, -sp], [0.22 * sp, sp * 0.5], [0, sp * 0.72], [-0.22 * sp, sp * 0.5]];
      addOverlay(c, s.f0, s.f1, 'FX Petal ' + (idx + 1) + ' @' + s.f0, V.commands(pts, true), { fill: cols[idx % 3], alpha: 1 }, function (f) {
        var kk = cl(prog(f, s) * 1.4 - d0);
        var pt = scPt(X0 + dir * s.W * 1.16 * kk, y0 + s.H * 0.36 * kk + Math.sin(kk * 9 + ph) * mn * 0.035, s.W, s.H);
        return {
          'position.x': pt[0], 'position.y': pt[1],
          rotation: -(ph + kk * (idx % 2 ? 8 : -8)) * 180 / PI,
          'scale.x': 0.3 + 0.7 * Math.abs(Math.cos(kk * 12 + ph)),
          alpha: (kk > 0 && kk < 1) ? H.smoothstep(0, 0.1, kk) * (1 - H.smoothstep(0.85, 1, kk)) * 0.92 : 0
        };
      });
    })(i);
  }
});

reg('wzHyoshigi', 'ae/p_x2_waB2.jsx', function (c, s) {
  var mn = Math.min(s.W, s.H), cx = s.W * (0.3 + 0.4 * N.random(s.seed, 1, 1)), cy = s.H * (0.32 + 0.36 * N.random(s.seed, 2, 1));
  var tilt = (N.random(s.seed, 3, 1) * 2 - 1) * 18, th = mn * 0.052, Lc = mn * 0.25, cSc = scPt(cx, cy, s.W, s.H);
  var col = ink(s.sc), band = pop(s.sc), A1 = cl(s.amp, 0.5, 1.3);
  [-1, 1].forEach(function (sd) {
    addOverlay(c, s.f0, s.f1, 'FX Hyoshigi ' + (sd < 0 ? 'A' : 'B') + ' @' + s.f0, G.rect(-th / 2, -Lc / 2, th, Lc),
      { fill: col, stroke: band, width: 2, alpha: 1 }, function (f) {
        var p = prog(f, s), u = cl((p - 0.3) / 0.7);
        var d = p < 0.3 ? mix(mn * 0.8, th / 2, E.inCubic(p / 0.3)) : th / 2 + mn * 0.1 * E.outCubic(u);
        var rad = tilt * DEG, rx = sd * d * Math.cos(rad), ry = -sd * d * Math.sin(rad);
        return { 'position.x': cSc[0] + rx, 'position.y': cSc[1] + ry, rotation: -tilt, alpha: p < 0.3 ? cl(p / 0.3 * 4) : 1 - H.inOutQuart(u) };
      });
  });
  for (var i = 0; i < 8; i++) {
    (function (idx) {
      var an = idx / 8 * TAU + 0.26, Rm = mn * 0.4;
      addOverlay(c, s.f0, s.f1, 'FX Hyoshigi ray ' + (idx + 1) + ' @' + s.f0, V.commands([[0, 0], [Math.cos(an) * Rm, -Math.sin(an) * Rm]], false),
        { stroke: band, width: Math.max(2, mn * 0.009), alpha: 1 }, function (f) {
          var p = prog(f, s), u = cl((p - 0.3) / 0.7);
          return { 'position.x': cSc[0], 'position.y': cSc[1], 'scale.x': 0.2 + 0.8 * E.outCubic(u), 'scale.y': 0.2 + 0.8 * E.outCubic(u), alpha: p >= 0.3 ? (1 - H.smoothstep(0.1, 0.75, u)) : 0 };
        });
    })(i);
  }
  H.fullRect(c, s, 'FX Hyoshigi wash @' + s.f0, band, function (p) {
    var u = cl((p - 0.3) / 0.7);
    return p >= 0.3 ? 0.2 * (1 - E.outCubic(cl(u / 0.5))) * A1 : 0;
  });
});

reg('wzMaku', 'ae/p_x2_waB2.jsx', function (c, s) {
  var dir = N.random(s.seed, 1, 1) < 0.5 ? 1 : -1, sw = Math.max(12, s.W / 12), c1 = ink(s.sc), c2 = pop(s.sc), c3 = s.sc.accent2 || H.mixHex(c1, c2, 0.5);
  var cols = [c1, c2, c3], contours = Object.create(null);
  for (var f = s.f0; f < s.f1; f++) {
    var p = prog(f, s), x0 = p < 0.5 ? 0 : s.W * E.inOutCubic((p - 0.5) / 0.5), x1 = p < 0.5 ? s.W * E.inOutCubic(p / 0.5) : s.W;
    var rx0 = dir > 0 ? x0 : s.W - x1, rx1 = dir > 0 ? x1 : s.W - x0;
    contours[f] = (rx1 - rx0 < 1) ? [] : [rectPoly(rx0, 0, rx1, s.H, s.W, s.H)];
  }
  cols.forEach(function (col, ci) {
    var stripGroup = addOverlay(c, s.f0, s.f1, 'FX Maku stripe ' + ci + ' @' + s.f0, G.rect(-s.W / 2, -s.H / 2, s.W, s.H), { fill: col, alpha: ci === 0 ? 0.9 : 0.85 });
    var cMap = Object.create(null);
    for (var f = s.f0; f < s.f1; f++) {
      var p = prog(f, s), x0 = p < 0.5 ? 0 : s.W * E.inOutCubic((p - 0.5) / 0.5), x1 = p < 0.5 ? s.W * E.inOutCubic(p / 0.5) : s.W;
      var rx0 = dir > 0 ? x0 : s.W - x1, rx1 = dir > 0 ? x1 : s.W - x0;
      if (rx1 - rx0 < 1) { cMap[f] = []; continue; }
      var polys = [];
      for (var sx = Math.floor(rx0 / sw) * sw; sx < rx1; sx += sw) {
        if ((Math.round(sx / sw) % 3 + 3) % 3 !== ci) continue;
        var a = Math.max(rx0, sx), b = Math.min(rx1, sx + sw);
        if (b > a + 0.5) polys.push(rectPoly(a, 0, b, s.H, s.W, s.H));
      }
      cMap[f] = polys;
    }
    H.multiClip(c.graph, stripGroup, cMap, false, 'Maku stripes', c.options);
  });
});

reg('wzOrime', 'ae/p_x2_waB2.jsx', function (c, s) {
  var mn = Math.min(s.W, s.H), A = cl(s.amp, 0.6, 1.1), nx = s.W >= s.H ? 3 : 2, ny = s.W >= s.H ? 2 : 3;
  var dk = '#000000', lw = Math.max(1.2, mn * 0.003);
  function alp(f, mult) { return ahr(prog(f, s), 0.14, 0.55) * A * mult; }
  for (var i = 1; i < nx; i++) {
    addOverlay(c, s.f0, s.f1, 'FX Orime v' + i + ' @' + s.f0, G.rect(s.W * i / nx - s.W / 2 - lw / 2, -s.H / 2, lw, s.H),
      { fill: dk, alpha: 1 }, function (f) { return { alpha: alp(f, 0.45) }; });
  }
  for (var j = 1; j < ny; j++) {
    addOverlay(c, s.f0, s.f1, 'FX Orime h' + j + ' @' + s.f0, G.rect(-s.W / 2, s.H / 2 - s.H * j / ny - lw / 2, s.W, lw),
      { fill: dk, alpha: 1 }, function (f) { return { alpha: alp(f, 0.45) }; });
  }
  for (var ix = 0; ix < nx; ix++) for (var iy = 0; iy < ny; iy++) {
    if ((ix + iy) % 2) {
      var pt = scPt(s.W * (ix + 0.5) / nx, s.H * (iy + 0.5) / ny, s.W, s.H);
      addOverlay(c, s.f0, s.f1, 'FX Orime panel ' + ix + '_' + iy + ' @' + s.f0, G.rect(pt[0] - s.W / nx / 2, pt[1] - s.H / ny / 2, s.W / nx, s.H / ny),
        { fill: dk, alpha: 1 }, function (f) { return { alpha: alp(f, 0.12) }; });
    }
  }
});

reg('wzShojiPass', 'ae/p_x2_waB2.jsx', function (c, s) {
  var mn = Math.min(s.W, s.H), dir = N.random(s.seed, 1, 1) < 0.5 ? 1 : -1, A = cl(s.amp, 0.6, 1.1);
  var cu = mn * 0.21, cv = mn * 0.15, lw = Math.max(2, mn * 0.012), sk = 0.32 * dir;
  var lattice = c.graph.add('null', 'FX ShojiPass @' + s.f0, c.parent, s.f0, s.f1, {});
  for (var x = -s.W * 0.5, i = 0; x < s.W * 1.5 && i < 24; x += cu, i++) {
    var t = (i % 3 === 0 ? 2.2 : 1) * lw;
    var pts = [scPt(x - sk * s.H / 2 - t / 2, 0, s.W, s.H), scPt(x - sk * s.H / 2 + t / 2, 0, s.W, s.H),
      scPt(x + sk * s.H / 2 + t / 2, s.H, s.W, s.H), scPt(x + sk * s.H / 2 - t / 2, s.H, s.W, s.H)];
    C.shape(c.graph, { id: 'fx', start: s.f0, end: s.f1 }, 'Shoji v' + i, lattice, V.commands(pts, true), { fill: '#000000', alpha: 0.32 });
  }
  for (var y = cv * 0.5, j = 0; y < s.H && j < 20; y += cv, j++) {
    C.shape(c.graph, { id: 'fx', start: s.f0, end: s.f1 }, 'Shoji h' + j, lattice,
      G.rect(-s.W, s.H / 2 - y - lw / 2, s.W * 3, lw), { fill: '#000000', alpha: 0.32 });
  }
  C.sample(c.graph, lattice, s.f0, s.f1, function (f) {
    var p = prog(f, s);
    return { 'position.x': dir * mix(-s.W * 0.14, s.W * 0.14, p), alpha: cl(0.85 * ahr(p, 0.25, 0.7) * A) };
  });
});

reg('wzSumiShibuki', 'ae/p_x2_waB2.jsx', function (c, s) {
  var mn = Math.min(s.W, s.H), a0 = cl(s.amp, 0.6, 1.3), left = N.random(s.seed, 1, 1) < 0.5;
  var ox = s.W * (left ? 0.1 + 0.1 * N.random(s.seed, 2, 1) : 0.9 - 0.1 * N.random(s.seed, 2, 1));
  var oy = s.H * (0.2 + 0.6 * N.random(s.seed, 3, 1)), base = Math.atan2(s.H / 2 - oy, s.W / 2 - ox), col = ink(s.sc);
  for (var i = 0; i < 26; i++) {
    (function (idx) {
      var r1 = N.random(s.seed, idx, 7), an = base + (N.random(s.seed, idx, 8) * 2 - 1) * 0.95;
      var D = mn * (0.09 + 0.85 * r1 * r1) * a0, r = Math.max(1.5, mn * 0.02 * (1 - r1 * 0.8) * (0.4 + 0.6 * N.random(s.seed, idx, 9)) * a0);
      addOverlay(c, s.f0, s.f1, 'FX Sumi drop ' + (idx + 1) + ' @' + s.f0, G.ellipse(0, 0, r * (1.4 + 2.2 * r1), r),
        { fill: col, alpha: 1 }, function (f) {
          var p = prog(f, s), g = E.outCubic(cl(p / 0.3)), al = 1 - H.inOutQuart(cl((p - 0.42) / 0.58));
          var pt = scPt(ox + Math.cos(an) * D * g, oy + Math.sin(an) * D * g, s.W, s.H);
          return { 'position.x': pt[0], 'position.y': pt[1], rotation: -(an * 180 / PI), alpha: cl(al) };
        });
    })(i);
  }
});
})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
