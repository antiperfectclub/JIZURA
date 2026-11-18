/* Remaining 35 themed & x2 transitions completing 56/56 transitions in ae/data.json.
 * Sources: ae/p_horror4.jsx, ae/p_x2_horrorB.jsx, ae/p_kinetic4.jsx, ae/p_x2_kineticB2.jsx,
 *          ae/p_typo4.jsx, ae/p_x2_typoB.jsx, ae/p_x2_waB2.jsx, ae/p_x2_camtr.jsx (read-only).
 */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = R.clamp, mix = R.mix, E = R.E, PI = Math.PI, TAU = R.T, DEG = PI / 180;

function prog(f, start, end) {
  return end - start < 2 ? 1 : cl((f - start) / (end - start - 1));
}
function scPt(x, y, W, Hh) {
  return [x - W / 2, Hh / 2 - y];
}
function rectPoly(x0, y0, x1, y1, W, Hh) {
  var a = scPt(x0, y0, W, Hh), b = scPt(x1, y1, W, Hh);
  return [[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]];
}
function offTri() {
  return [[-99999, -99999], [-99998, -99999], [-99999, -99998]];
}
function insertBefore(graph, nodeId, targetId) {
  var node = graph.byId[nodeId], target = graph.byId[targetId];
  var i = graph.layers.indexOf(node), j = graph.layers.indexOf(target);
  if (i >= 0 && j >= 0 && i > j) { graph.layers.splice(i, 1); graph.layers.splice(j, 0, node); }
}
function addBehindB(c, start, end, color, alphaFn, label) {
  var W = c.comp.width, Hh = c.comp.height, g = c.graph;
  var cutsRoot = g.byId[c.layerIds[0]].parent;
  var id = C.shape(g, { id: c.cut.id, start: start, end: end },
    c.cut.id + ' / ' + label, cutsRoot, G.rect(-W / 2, -Hh / 2, W, Hh), { fill: color || '#000000', alpha: 1 });
  insertBefore(g, id, c.layerIds[0]);
  if (alphaFn) C.sample(g, id, start, end, function (f) { return { alpha: cl(alphaFn(f)) }; });
  return id;
}
function addAbove(c, start, end, label, cmds, paint, fn) {
  var id = C.shape(c.graph, { id: c.cut.id, start: start, end: end },
    c.cut.id + ' / ' + label, c.sceneRoot, cmds, paint);
  if (fn) C.sample(c.graph, id, start, end, fn);
  return id;
}
function reg(key, source, build, diffs) {
  N.register('trans', key, {
    source: source + ' / trans:' + key,
    scope: 'cut-pair',
    differences: diffs || ['Per-frame sampled Cavalry graph matching AE formula.'],
    build: build
  });
}

/* ================================================================ Horror (hr*, hz*) */
reg('hrBlink', 'ae/p_horror4.jsx', function (c) {
  var w = H.transWindow(c, 0.5, 'hrBlink'), start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, bow = Hh * 0.18 * 0.7;
  var mid = start + Math.floor((end - start) / 2);
  H.extendCut(c.graph, w.a, mid);
  H.hideCutDuring(c.graph, c, start, mid);
  function lidState(f) {
    var p = prog(f, start, end);
    return p < 0.5 ? E.inCubic(p / 0.5) : 1 - E.outCubic((p - 0.5) / 0.5);
  }
  [-1, 1].forEach(function (sg) {
    var pts = [[-W * 0.6, sg * Hh * 1.3], [W * 0.6, sg * Hh * 1.3]];
    for (var k = 16; k >= 0; k--) {
      var u = k / 16, y = sg * (-bow + 4 * bow * u * (1 - u));
      pts.push([(-0.55 + 1.1 * u) * W, y]);
    }
    addAbove(c, start, end, sg > 0 ? 'Blink upper lid' : 'Blink lower lid', V.commands(pts, true), { fill: '#000000', alpha: 1 }, function (f) {
      var h = Hh * 0.51 * lidState(f);
      var edgeY = sg > 0 ? (Hh / 2 - (h - bow * 0.5)) : (-Hh / 2 + (h - bow * 0.5));
      return { 'position.y': edgeY };
    });
    addAbove(c, start, end, sg > 0 ? 'Blink upper shade' : 'Blink lower shade', G.rect(-W * 0.55, -Hh * 0.12, W * 1.1, Hh * 0.24),
      { fill: '#000000', alpha: 0.3 }, function (f) {
        var cv = lidState(f);
        var h = Hh * 0.51 * cv;
        return { 'position.y': sg > 0 ? (Hh / 2 - h) : (-Hh / 2 + h), alpha: 0.4 * cv };
      });
  });
  return { start: start, end: end };
});

reg('hrStaticCut', 'ae/p_horror4.jsx', function (c) {
  var w = H.transWindow(c, 0.35, 'hrStaticCut'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, mid = start + Math.floor((end - start) / 2);
  H.extendCut(c.graph, w.a, mid);
  H.hideCutDuring(c.graph, c, start, mid);
  if (P.roll) {
    var rigA = H.wrapCutRig(c, w.a, 'Static roll A', start, mid);
    var rigB = H.wrapCutRig(c, c, 'Static roll B', start, end);
    C.sample(c.graph, rigA, start, mid, function (f) {
      return { 'position.y': -Math.round(Math.sin(prog(f, start, end) * PI) * Hh * 0.08) };
    });
    C.sample(c.graph, rigB, start, end, function (f) {
      var p = prog(f, start, end);
      return { 'position.y': p >= 0.5 ? Math.round(Math.sin(p * PI) * Hh * 0.08) : 0 };
    });
  }
  function nzv(p) {
    if (p < 0.5) return H.inOutQuart(p / 0.5);
    var q = (p - 0.5) / 0.5;
    return 1 - (1 - (1 - q) * (1 - q));
  }
  addAbove(c, start, end, 'Static noise wash', G.rect(-W / 2, -Hh / 2, W, Hh), { fill: '#808080', alpha: 1 }, function (f) {
    return { alpha: cl(nzv(prog(f, start, end)) * 0.85) };
  });
  var bw = Math.max(4, W / 40), bh = Math.max(3, Hh / 30), contours = Object.create(null);
  for (var f = start; f < end; f++) {
    var amp = nzv(prog(f, start, end)), polys = [];
    for (var s = 0; s < 26; s++) {
      if (N.random(f, s, 9) > amp) continue;
      var x = N.random(f * 3, s, 1) * (W - bw), y = N.random(f * 5, s, 2) * (Hh - bh);
      polys.push(rectPoly(x, y, x + bw * (0.5 + N.random(f, s, 3)), y + bh * 0.7, W, Hh));
    }
    contours[f] = polys;
  }
  var specks = addAbove(c, start, end, 'Static snow specks', G.rect(-W / 2, -Hh / 2, W, Hh), { fill: '#FFFFFF', alpha: 0.65 });
  H.multiClip(c.graph, specks, contours, false, 'Static specks', c.options);
  addAbove(c, start, end, 'Static band', G.rect(-W / 2, -Hh * 0.06, W, Hh * 0.12), { fill: '#000000', alpha: 1 }, function (f) {
    var p = prog(f, start, end);
    return { 'position.y': Hh / 2 - N.random(f + 7, 1, 1) * Hh, alpha: 0.5 * nzv(p) };
  });
  return { start: start, end: end };
});

reg('hzBlackout', 'ae/p_x2_horrorB.jsx', function (c) {
  var w = H.transWindow(c, 0.55, 'hzBlackout'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, gap = P.gap || 0.14, a1 = 0.5 - gap / 2, b0 = 0.5 + gap / 2;
  var sd = (c.cut.source && c.cut.source.seed) || 17;
  var aEnd = start + Math.max(1, Math.ceil((end - start) * b0));
  H.extendCut(c.graph, w.a, aEnd);
  H.hideCutDuring(c.graph, c, start, aEnd);
  addAbove(c, start, end, 'Blackout curtain', G.rect(-W / 2, -Hh / 2, W, Hh), { fill: '#000000', alpha: 1 }, function (f) {
    var p = prog(f, start, end), lv = 0, rr = N.random(sd, f * 7, 1);
    if (p < a1) {
      var q = p / a1;
      lv = 1 - q * q;
      if (q > 0.2 && rr < 0.4) lv *= 0.25;
    } else if (p > b0) {
      var q2 = (p - b0) / (1 - b0);
      lv = q2 < 0.3 ? q2 * 0.8 : H.smoothstep(0.3, 1, q2);
      if (q2 < 0.6 && rr < 0.4) lv *= 0.3;
    }
    return { alpha: cl(1 - lv) };
  });
  return { start: start, end: end };
});

reg('hzLinger', 'ae/p_x2_horrorB.jsx', function (c) {
  var w = H.transWindow(c, 0.65, 'hzLinger'), P = w.P, start = w.start, end = w.end;
  var Hh = c.comp.height, up = P.up || -1, sd = (c.cut.source && c.cut.source.seed) || 19;
  var dA = H.dark((w.a.sc || c.sc).bg), dB = H.dark(c.sc.bg);
  H.scaleCutAlphaDuring(c.graph, c, start, end, function (f) {
    var p = prog(f, start, end);
    return p < 0.14 ? p / 0.14 : 1;
  });
  var ghost = H.cloneCutSubtree(c.graph, w.a, 'Linger ghost', start, end);
  C.sample(c.graph, ghost.rigId, start, end, function (f) {
    var p = prog(f, start, end), s = 1 + 0.07 * p;
    return { 'position.y': -up * Hh * 0.035 * E.outCubic(p), 'scale.x': s, 'scale.y': s };
  });
  ghost.paintables.forEach(function (id) {
    var n = c.graph.byId[id], base = n.attrs.alpha == null ? 1 : n.attrs.alpha;
    n.keys.alpha = n.keys.alpha || {};
    for (var f = start; f < end; f++) {
      var p = prog(f, start, end), a = 0.6 * (1 - H.smoothstep(0, 1, p));
      if (p > 0.3 && N.random(sd, f * 7, 3) < 0.22) a *= 0.35;
      n.keys.alpha[f] = { value: base * a * (dA === dB ? 1 : 0.6), type: 1 };
    }
  });
  return { start: start, end: end };
});

reg('hzSlideDown', 'ae/p_x2_horrorB.jsx', function (c) {
  var w = H.transWindow(c, 0.65, 'hzSlideDown'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, sd = (c.cut.source && c.cut.source.seed) || 7;
  var n = P.n || 28, nA = n > 20 ? Math.round(n / 2) : n;
  for (var j = 0; j < nA; j++) {
    (function (idx) {
      var jj = Math.round(idx * n / nA);
      var d = cl(0.2 + Math.sin(jj * 0.37 + sd * 1.1) * 0.18 + (N.random(sd, jj, 721) * 2 - 1) * 0.05, 0, 0.4);
      var x0 = Math.floor(W * idx / nA), x1 = idx === nA - 1 ? W : Math.floor(W * (idx + 1) / nA);
      var xc = (x0 + x1) / 2 - W / 2, topY = Hh / 2;
      var strip = H.cloneCutSubtree(c.graph, w.a, 'Slide strip ' + (idx + 1), start, end);
      var polys = Object.create(null), poly = rectPoly(x0 - 0.5, -2, x1 + 0.5, Hh + 2, W, Hh);
      for (var f = start; f < end; f++) polys[f] = poly;
      strip.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      C.sample(c.graph, strip.rigId, start, end, function (f) {
        var q = cl((prog(f, start, end) - d) / 0.6), sy = 1 + 0.45 * q;
        return {
          'position.x': xc * (1 - 1),
          'position.y': topY - topY * sy - q * q * q * Hh * 1.03,
          'scale.y': sy
        };
      });
      strip.paintables.forEach(function (id) {
        var node = c.graph.byId[id], base = node.attrs.alpha == null ? 1 : node.attrs.alpha;
        node.keys.alpha = node.keys.alpha || {};
        for (var f = start; f < end; f++) {
          var q = cl((prog(f, start, end) - d) / 0.6);
          node.keys.alpha[f] = { value: q >= 1 ? 0 : base, type: 1 };
        }
      });
    })(j);
  }
  return { start: start, end: end };
});

/* ================================================================ Kinetic (kn*, kz*) */
reg('knCornerSwing', 'ae/p_kinetic4.jsx', function (c) {
  var w = H.transWindow(c, 0.45, 'knCornerSwing'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, corner = (P.c | 0) % 4;
  var px = (corner === 1 || corner === 2) ? W : 0, py = corner >= 2 ? 0 : Hh;
  var sg = (corner === 0 || corner === 2) ? 1 : -1, pSc = scPt(px, py, W, Hh);
  addBehindB(c, start, end, c.sc.bg, null, 'Swing bg');
  H.extendCut(c.graph, w.a, end);
  var rigA = H.wrapCutRig(c, w.a, 'Swing A rig', start, end);
  var rigB = H.wrapCutRig(c, c, 'Swing B rig', start, end);
  function pivSample(rigId, angFn) {
    C.sample(c.graph, rigId, start, end, function (f) {
      var deg = angFn(f), th = deg * DEG, cs = Math.cos(th), sn = Math.sin(th);
      return {
        'position.x': pSc[0] - (pSc[0] * cs + pSc[1] * sn),
        'position.y': pSc[1] - (-pSc[0] * sn + pSc[1] * cs),
        rotation: -deg
      };
    });
  }
  pivSample(rigA, function (f) { return 90 * sg * E.inOutCubic(prog(f, start, end)); });
  pivSample(rigB, function (f) { return -90 * sg * (1 - E.inOutCubic(prog(f, start, end))); });
  var lw = Math.max(2, Math.min(W, Hh) * 0.006), left = corner === 0 || corner === 3;
  var edgeCmd = G.rect(left ? -lw : 0, py ? 0 : -Hh * 2, lw, Hh * 2);
  addAbove(c, start, end, 'Swing seam', edgeCmd, { fill: H.transAcc(c), alpha: 1 }, function (f) {
    var p = prog(f, start, end);
    return { 'position.x': pSc[0], 'position.y': pSc[1], rotation: -(90 * sg * E.inOutCubic(p)), alpha: H.bell(p) };
  });
  return { start: start, end: end };
});

reg('knStripSlam', 'ae/p_kinetic4.jsx', function (c) {
  var w = H.transWindow(c, 0.5, 'knStripSlam'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, n = Math.max(2, Math.min(6, P.n || 4)), up = !!P.up;
  var eh = Math.max(3, Hh * 0.008), ac = H.transAcc(c);
  function yq(q) {
    var tl = 0.62, y;
    if (q < tl) { var f = q / tl; y = -Hh * (1 - f * f); }
    else { var u = (q - tl) / (1 - tl); y = -Hh * 0.06 * Math.abs(Math.sin(u * PI * 2)) * (1 - u); }
    return up ? -y : y;
  }
  H.extendCut(c.graph, w.a, end);
  H.hideCutDuring(c.graph, c, start, end);
  addBehindB(c, start, end, '#000000', function (f) { return 0.3 * prog(f, start, end); }, 'Strip slam shade');
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var k = P.rev ? n - 1 - idx : idx, x0 = Math.round(idx * W / n), x1 = Math.round((idx + 1) * W / n);
      var st = H.cloneCutSubtree(c.graph, c, 'Strip slam ' + (idx + 1), start, end);
      var polys = Object.create(null), poly = rectPoly(x0, -Hh, x1, Hh * 2, W, Hh);
      for (var f = start; f < end; f++) polys[f] = poly;
      st.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      C.sample(c.graph, st.rigId, start, end, function (f) {
        var q = cl((prog(f, start, end) - k / n * 0.45) / 0.55);
        return { 'position.y': -yq(q) };
      });
      st.paintables.forEach(function (id) {
        var node = c.graph.byId[id], base = node.attrs.alpha == null ? 1 : node.attrs.alpha;
        node.keys.alpha = node.keys.alpha || {};
        for (var f = start; f < end; f++) {
          var q = cl((prog(f, start, end) - k / n * 0.45) / 0.55);
          if (q <= 0) node.keys.alpha[f] = { value: 0, type: 1 };
        }
      });
      var edgeSc = scPt((x0 + x1) / 2, up ? eh / 2 : Hh - eh / 2, W, Hh);
      addAbove(c, start, end, 'Strip edge ' + (idx + 1), G.rect(-(x1 - x0) / 2, -eh / 2, x1 - x0, eh),
        { fill: ac, alpha: 1 }, function (f) {
          var q = cl((prog(f, start, end) - k / n * 0.45) / 0.55);
          return { 'position.x': edgeSc[0], 'position.y': edgeSc[1] - yq(q), alpha: (q > 0 && q < 1) ? 0.8 * (1 - q) : 0 };
        });
    })(i);
  }
  return { start: start, end: end };
});

reg('knStutterCut', 'ae/p_kinetic4.jsx', function (c) {
  var w = H.transWindow(c, 0.42, 'knStutterCut'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, z = P.z || 1.07, o = (P.o || 0.03) * W;
  var CU = [0.18, 0.36, 0.52, 0.7];
  var SQ = [[0, 1, 0], [1, z, o], [0, 1 / z, -o * 0.6], [1, z * 1.03, -o], [1, 1, 0]];
  function stepOf(p) { var k = 0; while (k < 4 && p >= CU[k]) k++; return { k: k, q: SQ[k] }; }
  addBehindB(c, start, end, (w.a.sc || c.sc).bg, null, 'Stutter bg');
  H.extendCut(c.graph, w.a, end);
  var rigA = H.wrapCutRig(c, w.a, 'Stutter A rig', start, end);
  var rigB = H.wrapCutRig(c, c, 'Stutter B rig', start, end);
  C.sample(c.graph, rigA, start, end, function (f) {
    var st = stepOf(prog(f, start, end)).q, active = st[0] === 0;
    return { 'position.x': active ? st[2] : 0, 'scale.x': active ? st[1] : 1, 'scale.y': active ? st[1] : 1 };
  });
  C.sample(c.graph, rigB, start, end, function (f) {
    var st = stepOf(prog(f, start, end)).q, active = st[0] === 1;
    return { 'position.x': active ? st[2] : 0, 'scale.x': active ? st[1] : 1, 'scale.y': active ? st[1] : 1 };
  });
  H.scaleCutAlphaDuring(c.graph, w.a, start, end, function (f) { return stepOf(prog(f, start, end)).q[0] === 0 ? 1 : 0; });
  H.scaleCutAlphaDuring(c.graph, c, start, end, function (f) { return stepOf(prog(f, start, end)).q[0] === 1 ? 1 : 0; });
  var h = Math.max(3, Hh * 0.012);
  addAbove(c, start, end, 'Stutter bar', G.rect(-W / 2, -h / 2, W, h), { fill: H.transAcc(c), alpha: 1 }, function (f) {
    var p = prog(f, start, end), st = stepOf(p), sn = st.k > 0 ? p - CU[st.k - 1] : 1;
    var y = (st.k % 2 ? 0.3 : 0.68) * Hh + h / 2;
    return { 'position.y': Hh / 2 - y, alpha: (sn < 0.06 && p < 1) ? 0.9 : 0 };
  });
  return { start: start, end: end };
});

reg('kzCarousel', 'ae/p_x2_kineticB2.jsx', function (c) {
  var w = H.transWindow(c, 0.5, 'kzCarousel'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, dir = P.dir || 1, R0 = Math.max(W, Hh) * 1.3;
  var px = W / 2, py = P.top ? Hh / 2 - R0 : Hh / 2 + R0, pSc = scPt(px, py, W, Hh);
  var th = 2 * Math.atan((W / 2) / (R0 - Hh / 2)) * 1.05 * 180 / PI;
  addBehindB(c, start, end, H.mixHex(c.sc.bg, '#000000', 0.4), null, 'Carousel bg');
  H.extendCut(c.graph, w.a, end);
  var rigA = H.wrapCutRig(c, w.a, 'Carousel A rig', start, end);
  var rigB = H.wrapCutRig(c, c, 'Carousel B rig', start, end);
  function eFn(p) { return E.inOutCubic(cl(p / 0.78)) + 0.035 * Math.sin(PI * cl((p - 0.55) / 0.45)); }
  function pivot(rigId, sign) {
    C.sample(c.graph, rigId, start, end, function (f) {
      var e = eFn(prog(f, start, end)), deg = sign > 0 ? -dir * th * e : dir * th * (1 - e);
      var rad = deg * DEG, cs = Math.cos(rad), sn = Math.sin(rad);
      return {
        'position.x': pSc[0] - (pSc[0] * cs + pSc[1] * sn),
        'position.y': pSc[1] - (-pSc[0] * sn + pSc[1] * cs),
        rotation: -deg
      };
    });
  }
  pivot(rigA, 1);
  pivot(rigB, -1);
  return { start: start, end: end };
});

reg('kzCrushDown', 'ae/p_x2_kineticB2.jsx', function (c) {
  var w = H.transWindow(c, 0.46, 'kzCrushDown'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, from = P.from || 'top', hor = from === 'left' || from === 'right';
  var Lc = hor ? W : Hh, lw = Math.max(2, Math.min(W, Hh) * 0.007), near = from === 'top' || from === 'left';
  function fCurve(p) {
    var tl = 0.62;
    if (p < tl) { var q = p / tl; return q * q; }
    var u = (p - tl) / (1 - tl);
    return 1 - 0.075 * Math.abs(Math.sin(u * PI * 2)) * (1 - u);
  }
  addBehindB(c, start, end, c.sc.bg, null, 'Crush bg');
  H.extendCut(c.graph, w.a, end);
  var rigA = H.wrapCutRig(c, w.a, 'Crush A rig', start, end);
  var rigB = H.wrapCutRig(c, c, 'Crush B rig', start, end);
  var anc = hor ? scPt(near ? W : 0, Hh / 2, W, Hh) : scPt(W / 2, near ? Hh : 0, W, Hh);
  C.sample(c.graph, rigA, start, end, function (f) {
    var rest = Math.max(1e-3, (1 - fCurve(prog(f, start, end))));
    return hor ? { 'position.x': anc[0] * (1 - rest), 'scale.x': rest } : { 'position.y': anc[1] * (1 - rest), 'scale.y': rest };
  });
  C.sample(c.graph, rigB, start, end, function (f) {
    var p = prog(f, start, end), d = Math.round(Lc * fCurve(p)), rest = Lc - d;
    var o = p >= 1 ? 0 : (near ? d - Lc : rest);
    return hor ? { 'position.x': o } : { 'position.y': -o };
  });
  var seamCmd = hor ? G.rect(-lw / 2, -Hh / 2, lw, Hh) : G.rect(-W / 2, -lw / 2, W, lw);
  addAbove(c, start, end, 'Crush seam', seamCmd, { fill: H.transAcc(c), alpha: 1 }, function (f) {
    var p = prog(f, start, end), d = Math.round(Lc * fCurve(p)), rest = Lc - d;
    var seam = near ? d : rest - lw;
    return hor
      ? { 'position.x': (seam + lw / 2) - W / 2, alpha: (p <= 0 || p >= 1) ? 0 : cl((1 - p) * 3) }
      : { 'position.y': Hh / 2 - (seam + lw / 2), alpha: (p <= 0 || p >= 1) ? 0 : cl((1 - p) * 3) };
  });
  return { start: start, end: end };
});

reg('kzShoveOff', 'ae/p_x2_kineticB2.jsx', function (c) {
  var w = H.transWindow(c, 0.45, 'kzShoveOff'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, dir = P.dir || 1, vert = !!P.vert, Lc = vert ? Hh : W;
  var lw0 = Math.max(2, Math.min(W, Hh) * 0.012);
  addBehindB(c, start, end, c.sc.bg, null, 'Shove bg');
  H.extendCut(c.graph, w.a, end);
  var rigA = H.wrapCutRig(c, w.a, 'Shove A rig', start, end);
  var rigB = H.wrapCutRig(c, c, 'Shove B rig', start, end);
  C.sample(c.graph, rigA, start, end, function (f) {
    var p = prog(f, start, end), eA = E.outCubic(cl(p * 1.15)), dA = -dir * Lc * 1.15 * eA;
    var deg = -dir * 14 * eA;
    return vert
      ? { 'position.x': W * 0.1 * eA * eA, 'position.y': -dA, rotation: -deg }
      : { 'position.x': dA, 'position.y': -Hh * 0.12 * eA * eA, rotation: -deg };
  });
  C.sample(c.graph, rigB, start, end, function (f) {
    var p = prog(f, start, end), dB = p >= 1 ? 0 : Math.round(dir * Lc * (1 - E.outBack(p, 1.5)));
    return vert ? { 'position.y': -dB } : { 'position.x': dB };
  });
  var edgeCmd = vert ? G.rect(-W / 2, -0.5, W, 1) : G.rect(-0.5, -Hh / 2, 1, Hh);
  addAbove(c, start, end, 'Shove edge', edgeCmd, { fill: H.transAcc(c), alpha: 1 }, function (f) {
    var p = prog(f, start, end), lw = Math.max(0.1, lw0 * (1 - p));
    var dB = p >= 1 ? 0 : Math.round(dir * Lc * (1 - E.outBack(p, 1.5))), edge = dir > 0 ? dB - lw : dB + Lc;
    return vert
      ? { 'position.y': Hh / 2 - (edge + lw / 2), 'scale.y': lw, alpha: (p <= 0 || p >= 1) ? 0 : cl((1 - p) * 1.4) }
      : { 'position.x': (edge + lw / 2) - W / 2, 'scale.x': lw, alpha: (p <= 0 || p >= 1) ? 0 : cl((1 - p) * 1.4) };
  });
  return { start: start, end: end };
});

/* ================================================================ Typo (ty*, tz*) */
reg('tyGridCells', 'ae/p_typo4.jsx', function (c) {
  var w = H.transWindow(c, 0.5, 'tyGridCells'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, rows = Math.max(2, Math.round(P.rows || 5)), tate = !!P.tate;
  var cell = Hh / rows, cols = Math.ceil(W / cell), ox = (W - cols * cell) / 2, num = rows * cols;
  var ac = H.transAcc(c), lw = Math.max(1, Math.min(W, Hh) * 0.0016), X = [], Y = [];
  for (var j = 0; j < num; j++) {
    var cc = tate ? cols - 1 - Math.floor(j / rows) : j % cols;
    var rr = tate ? j % rows : Math.floor(j / cols);
    X.push(ox + cc * cell + cell / 2); Y.push(rr * cell + cell / 2);
  }
  var contours = Object.create(null);
  for (var f = start; f < end; f++) {
    var kk = E.inOutCubic(cl(prog(f, start, end) / 0.92)) * num, fk = Math.floor(kk), polys = [];
    for (var j2 = 0; j2 <= Math.min(fk, num - 1); j2++) {
      polys.push(rectPoly(X[j2] - cell / 2 - 0.5, Y[j2] - cell / 2 - 0.5, X[j2] + cell / 2 + 0.5, Y[j2] + cell / 2 + 0.5, W, Hh));
    }
    contours[f] = polys;
  }
  H.extendCut(c.graph, w.a, end);
  H.multiClipCut(c, c, contours, false, 'Grid cells clip', c.options);
  for (var cc2 = 0; cc2 <= cols; cc2++) {
    var gx = Math.round(ox + cc2 * cell);
    addAbove(c, start, end, 'Grid vline ' + cc2, G.rect(gx - W / 2 - lw / 2, -Hh / 2, lw, Hh), { fill: ac, alpha: 1 }, function (f) {
      return { alpha: 0.5 * Math.sin(PI * prog(f, start, end)) };
    });
  }
  for (var rr2 = 1; rr2 < rows; rr2++) {
    var gy = Math.round(rr2 * cell);
    addAbove(c, start, end, 'Grid hline ' + rr2, G.rect(-W / 2, Hh / 2 - gy - lw / 2, W, lw), { fill: ac, alpha: 1 }, function (f) {
      return { alpha: 0.5 * Math.sin(PI * prog(f, start, end)) };
    });
  }
  addAbove(c, start, end, 'Grid cursor', G.rect(-(cell - lw * 3) / 2, -(cell - lw * 3) / 2, cell - lw * 3, cell - lw * 3),
    { stroke: ac, width: lw * 3, alpha: 1 }, function (f) {
      var p = prog(f, start, end), fk = Math.floor(E.inOutCubic(cl(p / 0.92)) * num), q = Math.min(fk, num - 1);
      var pt = scPt(X[q], Y[q], W, Hh);
      return { 'position.x': pt[0], 'position.y': pt[1], alpha: (p > 0 && fk < num) ? 1 : 0 };
    });
  return { start: start, end: end };
});

reg('tyRuleWipe', 'ae/p_typo4.jsx', function (c) {
  var w = H.transWindow(c, 0.45, 'tyRuleWipe'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, n = Math.max(2, Math.round(P.n || 9)), rtl = !!P.rtl;
  var bh = Hh / n, ac = H.transAcc(c), lw = Math.max(1, Math.min(W, Hh) * 0.0015), st = 0.5 / n, cw = Math.max(3, bh * 0.14);
  var contours = Object.create(null);
  for (var f = start; f < end; f++) {
    var p = prog(f, start, end), polys = [];
    for (var i = 0; i < n; i++) {
      var y0 = Math.round(i * bh), y1 = Math.round((i + 1) * bh);
      var q = E.inOutCubic(cl((p - i * st) / (1 - (n - 1) * st)));
      if (q <= 0.002) continue;
      polys.push(rtl ? rectPoly(W * (1 - q), y0, W, y1 + 1, W, Hh) : rectPoly(0, y0, W * q, y1 + 1, W, Hh));
    }
    contours[f] = polys;
  }
  H.extendCut(c.graph, w.a, end);
  H.multiClipCut(c, c, contours, false, 'Rule wipe clip', c.options);
  for (var i2 = 0; i2 < n; i2++) {
    (function (idx) {
      var y0 = Math.round(idx * bh), cy = y0 + bh * 0.5;
      addAbove(c, start, end, 'Rule cursor ' + (idx + 1), G.rect(-cw / 2, -bh * 0.3, cw, bh * 0.6), { fill: ac, alpha: 1 }, function (f) {
        var q = E.inOutCubic(cl((prog(f, start, end) - idx * st) / (1 - (n - 1) * st)));
        var x = rtl ? W * (1 - q) - cw / 2 : W * q + cw / 2;
        return { 'position.x': x - W / 2, 'position.y': Hh / 2 - cy, alpha: (q > 0 && q < 1) ? 1 : 0 };
      });
    })(i2);
  }
  for (var r = 1; r < n; r++) {
    var ry = Math.round(r * bh);
    addAbove(c, start, end, 'Rule divider ' + r, G.rect(-W / 2, Hh / 2 - ry - lw / 2, W, lw), { fill: ac, alpha: 1 }, function (f) {
      return { alpha: 0.6 * Math.sin(PI * prog(f, start, end)) };
    });
  }
  return { start: start, end: end };
});

reg('tzBaselineFold', 'ae/p_x2_typoB.jsx', function (c) {
  var w = H.transWindow(c, 0.48, 'tzBaselineFold'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, yb = Math.round(Hh * (P.at || 0.58)), ybSc = Hh / 2 - yb;
  var ac = H.transAcc(c), lw = Math.max(2, Math.round(Math.min(W, Hh) * 0.003));
  addBehindB(c, start, end, (w.a.sc || c.sc).bg, null, 'Fold back 1');
  addBehindB(c, start, end, c.sc.bg, function (f) { return prog(f, start, end); }, 'Fold back 2');
  H.extendCut(c.graph, w.a, end);
  var rigA = H.wrapCutRig(c, w.a, 'Fold A rig', start, end);
  var rigB = H.wrapCutRig(c, c, 'Fold B rig', start, end);
  C.sample(c.graph, rigA, start, end, function (f) {
    var p = prog(f, start, end), sy = p <= 0 ? 1 : Math.max(0.002, 1 - E.inCubic(p / 0.5));
    return { 'position.y': ybSc * (1 - sy), 'scale.y': sy };
  });
  H.scaleCutAlphaDuring(c.graph, w.a, start, end, function (f) { return prog(f, start, end) >= 0.5 ? 0 : 1; });
  C.sample(c.graph, rigB, start, end, function (f) {
    var p = prog(f, start, end), sy = p >= 1 ? 1 : Math.max(0.002, E.outCubic((p - 0.5) / 0.5));
    return { 'position.y': ybSc * (1 - sy), 'scale.y': sy };
  });
  H.scaleCutAlphaDuring(c.graph, c, start, end, function (f) { return prog(f, start, end) < 0.5 ? 0 : 1; });
  addAbove(c, start, end, 'Fold baseline', G.rect(-W / 2, ybSc - lw / 2, W, lw), { fill: ac, alpha: 1 }, function (f) {
    var p = prog(f, start, end);
    return { alpha: cl(p / 0.2) * (1 - cl((p - 0.8) / 0.2)) };
  });
  return { start: start, end: end };
});

reg('tzColumnReplace', 'ae/p_x2_typoB.jsx', function (c) {
  var w = H.transWindow(c, 0.5, 'tzColumnReplace'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, n = Math.max(2, Math.round(P.n || 5));
  var ac = H.transAcc(c), lw = Math.max(2, Math.round(Math.min(W, Hh) * 0.0028));
  var contours = Object.create(null);
  for (var f = start; f < end; f++) {
    var p = prog(f, start, end), polys = [];
    for (var i = 0; i < n; i++) {
      var j = P.rtl ? n - 1 - i : i, x0 = Math.round(j * W / n), x1 = Math.round((j + 1) * W / n);
      var u = cl((p - i / n * 0.78) / 0.22);
      if (u > 0) polys.push(rectPoly(x0, 0, x1 + 1, Hh, W, Hh));
    }
    contours[f] = polys;
  }
  H.extendCut(c.graph, w.a, end);
  H.multiClipCut(c, c, contours, false, 'Column replace clip', c.options);
  for (var i2 = 0; i2 < n; i2++) {
    (function (idx) {
      var j = P.rtl ? n - 1 - idx : idx, x0 = Math.round(j * W / n), x1 = Math.round((j + 1) * W / n);
      var cx = (x0 + x1) / 2 - W / 2, cw = x1 - x0;
      addAbove(c, start, end, 'Column drop ' + (idx + 1), G.rect(cx - cw / 2, Hh / 2 - lw / 2, cw, lw), { fill: ac, alpha: 1 }, function (f) {
        var u = cl((prog(f, start, end) - idx / n * 0.78) / 0.22);
        return { 'position.y': -Hh * E.outCubic(u), alpha: (u > 0 && u < 1) ? 1 : 0 };
      });
      if (idx > 0) {
        var rx = Math.round(idx * W / n) - W / 2;
        addAbove(c, start, end, 'Column rule ' + idx, G.rect(rx - lw / 4, -Hh / 2, lw / 2, Hh), { fill: ac, alpha: 1 }, function (f) {
          return { alpha: 0.5 * Math.sin(PI * prog(f, start, end)) };
        });
      }
    })(i2);
  }
  return { start: start, end: end };
});

reg('tzRuleSplit', 'ae/p_x2_typoB.jsx', function (c) {
  var w = H.transWindow(c, 0.52, 'tzRuleSplit'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, Vax = !!P.vert, LL = Vax ? W : Hh, M = Vax ? Hh : W;
  var center = Math.round(LL * (P.at || 0.5)), ac = H.transAcc(c), lw = Math.max(2, Math.round(Math.min(W, Hh) * 0.003));
  var polys = Object.create(null);
  for (var f = start; f < end; f++) {
    var p = prog(f, start, end), q2 = E.inOutCubic(cl((p - 0.24) / 0.76));
    var lo = mix(center, 0, q2), hi = mix(center, LL, q2);
    if (hi - lo < 0.2) { polys[f] = offTri(); continue; }
    polys[f] = Vax ? rectPoly(lo, 0, hi, Hh, W, Hh) : rectPoly(0, lo, W, hi, W, Hh);
  }
  H.extendCut(c.graph, w.a, end);
  H.clipCut(c, c, polys, c.options && c.options.hostProfile && c.options.hostProfile.javaScriptDeformer);
  [0, 1].forEach(function (idx) {
    var cmd = Vax ? G.rect(-lw / 2, -0.5, lw, 1) : G.rect(-0.5, -lw / 2, 1, lw);
    addAbove(c, start, end, 'Split rule ' + (idx + 1), cmd, { fill: ac, alpha: 1 }, function (f) {
      var p = prog(f, start, end), q1 = E.inOutCubic(cl(p / 0.3)), q2 = E.inOutCubic(cl((p - 0.24) / 0.76));
      var v = idx ? mix(center, LL, q2) : mix(center, 0, q2);
      var out = Vax
        ? { 'position.x': v - W / 2, 'scale.y': Math.max(1e-3, M * q1) }
        : { 'position.y': Hh / 2 - v, 'scale.x': Math.max(1e-3, M * q1) };
      out.alpha = (1 - cl((q2 - 0.85) / 0.15)) * (q1 > 0.01 ? 1 : 0);
      return out;
    });
  });
  return { start: start, end: end };
});

/* ================================================================ Wa / Traditional (wz*) */
reg('wzFusumaPass', 'ae/p_x2_waB2.jsx', function (c) {
  var w = H.transWindow(c, 0.56, 'wzFusumaPass'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, mn = Math.min(W, Hh), pw = W / 2, lw = Math.max(2, mn * 0.012);
  var paper = H.tintC(c.sc, c.sc.bg, 0.16), frame = c.sc.ink || c.sc.fg, acc = H.accCol(c.sc);
  var mid = start + Math.floor((end - start) / 2);
  H.extendCut(c.graph, w.a, mid);
  H.hideCutDuring(c.graph, c, start, mid);
  function doorC(p) {
    return p < 0.44 ? E.inOutCubic(p / 0.44) : (p < 0.56 ? 1 : 1 - E.inOutCubic((p - 0.56) / 0.44));
  }
  [-1, 1].forEach(function (sd) {
    var door = c.graph.add('null', c.cut.id + ' / Fusuma ' + (sd < 0 ? 'L' : 'R'), c.sceneRoot, start, end, {});
    var px = -pw / 2, py = -Hh / 2;
    C.shape(c.graph, { id: c.cut.id, start: start, end: end }, 'Fusuma paper', door, G.rect(px, py, pw + 0.5, Hh), { fill: paper, alpha: 1 });
    if (P.k) {
      [[0.24, 0.1, 0.7], [0.3, 0.35, 0.95], [0.72, 0.05, 0.55]].forEach(function (m, mi) {
        var xa = pw * (sd < 0 ? m[1] : 1 - m[2]), mw = pw * (m[2] - m[1]), mh = Hh * 0.035;
        C.shape(c.graph, { id: c.cut.id, start: start, end: end }, 'Fusuma mist ' + mi, door,
          G.rect(xa - pw / 2, Hh / 2 - Hh * m[0] - mh, mw, mh), { fill: acc, alpha: 0.16 });
      });
    }
    var frBars = [
      [0, Hh - lw * 2.2, pw, lw * 2.2], [0, 0, pw, lw * 2.2],
      [0, 0, lw * 1.6, Hh], [pw - lw * 1.6, 0, lw * 1.6, Hh]
    ];
    if ((P.n || 1) > 1) frBars.push([pw / 2 - lw * 0.6, 0, lw * 1.2, Hh]);
    frBars.forEach(function (b, bi) {
      C.shape(c.graph, { id: c.cut.id, start: start, end: end }, 'Fusuma frame ' + bi, door,
        G.rect(b[0] - pw / 2, b[1] - Hh / 2, b[2], b[3]), { fill: frame, alpha: 1 });
    });
    var hx = (sd < 0 ? pw - mn * 0.075 : mn * 0.075) - pw / 2, r = mn * 0.024;
    C.shape(c.graph, { id: c.cut.id, start: start, end: end }, 'Fusuma pull', door, G.ellipse(hx, 0, r, r), { fill: frame, stroke: acc, width: lw * 0.7, alpha: 1 });
    C.sample(c.graph, door, start, end, function (f) {
      var cc = doorC(prog(f, start, end)), half = pw * cc;
      var xPos = sd < 0 ? (half - pw / 2) - W / 2 : (W - half + pw / 2) - W / 2;
      return { 'position.x': xPos, alpha: cc <= 0.001 ? 0 : 1 };
    });
  });
  return { start: start, end: end };
});

reg('wzMakimonoRoll', 'ae/p_x2_waB2.jsx', function (c) {
  var w = H.transWindow(c, 0.6, 'wzMakimonoRoll'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, mn = Math.min(W, Hh), dir = P.dir < 0 ? -1 : 1;
  var d = Math.max(12, mn * 0.09), paper = H.tintC(c.sc, c.sc.bg, 0.16), ink = c.sc.ink || c.sc.fg, pop = H.accCol(c.sc);
  function rollX(p) { var e = E.inOutCubic(p); return dir > 0 ? mix(-d, W + d, e) : mix(W + d, -d, e); }
  /* Unrolled rest of A */
  var restA = H.cloneCutSubtree(c.graph, w.a, 'Scroll rest A', start, end);
  var restPolys = Object.create(null);
  for (var f = start; f < end; f++) {
    var X = rollX(prog(f, start, end)), xa = X - d / 2, xb = X + d / 2;
    restPolys[f] = dir > 0 ? (xb >= W ? offTri() : rectPoly(xb, 0, W, Hh, W, Hh)) : (xa <= 0 ? offTri() : rectPoly(0, 0, xa, Hh, W, Hh));
  }
  restA.paintables.forEach(function (id) { S.clip(c.graph, id, restPolys); });
  /* Cast shadow & paper cylinder */
  addAbove(c, start, end, 'Scroll cast shadow', G.rect(-d * 0.65, -Hh / 2, d * 1.3, Hh), { fill: '#000000', alpha: 0.25 }, function (f) {
    var xa = rollX(prog(f, start, end)) - d / 2;
    return { 'position.x': (xa + (dir > 0 ? -d * 0.65 : d + d * 0.65)) - W / 2 };
  });
  addAbove(c, start, end, 'Scroll paper', G.rect(-d / 2, -Hh / 2, d, Hh), { fill: paper, alpha: 1 }, function (f) {
    return { 'position.x': rollX(prog(f, start, end)) - W / 2 };
  });
  /* Roll shading + caps */
  var roll = c.graph.add('null', c.cut.id + ' / Scroll caps', c.sceneRoot, start, end, {});
  var capH = Math.max(4, Hh * 0.035), nb = 8;
  var stops = [[0, 0.62], [0.3, 0.08], [0.55, 0.12], [1, 0.66]];
  for (var k = 0; k < nb; k++) {
    var u = (k + 0.5) / nb, a = 0;
    for (var z = 0; z + 1 < stops.length; z++) if (u >= stops[z][0] && u <= stops[z + 1][0]) a = mix(stops[z][1], stops[z + 1][1], (u - stops[z][0]) / (stops[z + 1][0] - stops[z][0]));
    C.shape(c.graph, { id: c.cut.id, start: start, end: end }, 'Scroll shade ' + k, roll,
      G.rect((u - 0.5) * d - d / nb / 2, -Hh / 2, d / nb + 0.4, Hh), { fill: '#000000', alpha: a });
  }
  C.shape(c.graph, { id: c.cut.id, start: start, end: end }, 'Cap top', roll, G.rect(-d * 0.62, Hh / 2 - capH, d * 1.24, capH), { fill: ink, alpha: 1 });
  C.shape(c.graph, { id: c.cut.id, start: start, end: end }, 'Cap bot', roll, G.rect(-d * 0.62, -Hh / 2, d * 1.24, capH), { fill: ink, alpha: 1 });
  C.shape(c.graph, { id: c.cut.id, start: start, end: end }, 'Cap line T', roll, G.rect(-d * 0.62, Hh / 2 - capH * 1.22, d * 1.24, capH * 0.22), { fill: pop, alpha: 1 });
  C.shape(c.graph, { id: c.cut.id, start: start, end: end }, 'Cap line B', roll, G.rect(-d * 0.62, -Hh / 2 + capH, d * 1.24, capH * 0.22), { fill: pop, alpha: 1 });
  C.sample(c.graph, roll, start, end, function (f) {
    return { 'position.x': rollX(prog(f, start, end)) - W / 2 };
  });
  return { start: start, end: end };
});

reg('wzMawariButai', 'ae/p_x2_waB2.jsx', function (c) {
  var w = H.transWindow(c, 0.56, 'wzMawariButai'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, dir = P.dir < 0 ? -1 : 1, R0 = Math.max(W, Hh) * 1.9;
  var pSc = scPt(W / 2, Hh / 2 + R0, W, Hh);
  var al = 2 * Math.atan((W / 2) / (R0 - Hh / 2)) * 1.32 * 180 / PI, lw = Math.max(2, Math.min(W, Hh) * 0.008);
  addBehindB(c, start, end, H.mixHex((w.a.sc || c.sc).bg, '#000000', 0.55), null, 'Stage floor 1');
  addBehindB(c, start, end, H.mixHex(c.sc.bg, '#000000', 0.55), function (f) { return prog(f, start, end); }, 'Stage floor 2');
  H.extendCut(c.graph, w.a, end);
  var rigA = H.wrapCutRig(c, w.a, 'Stage A rig', start, end);
  var rigB = H.wrapCutRig(c, c, 'Stage B rig', start, end);
  function turn(rigId, sgn) {
    C.sample(c.graph, rigId, start, end, function (f) {
      var e = E.inOutCubic(prog(f, start, end)), deg = sgn < 0 ? -dir * al * e : dir * al * (1 - e);
      var rad = deg * DEG, cs = Math.cos(rad), sn = Math.sin(rad);
      return {
        'position.x': pSc[0] - (pSc[0] * cs + pSc[1] * sn),
        'position.y': pSc[1] - (-pSc[0] * sn + pSc[1] * cs),
        rotation: -deg
      };
    });
  }
  turn(rigA, -1);
  turn(rigB, 1);
  H.scaleCutAlphaDuring(c.graph, w.a, start, end, function (f) { return 1 - 0.4 * E.inOutCubic(prog(f, start, end)); });
  H.scaleCutAlphaDuring(c.graph, c, start, end, function (f) { return 1 - 0.4 * (1 - E.inOutCubic(prog(f, start, end))); });
  addAbove(c, start, end, 'Stage seam', G.rect(-lw / 2, 0, lw, Hh * 2), { fill: c.sc.ink || c.sc.fg, alpha: 1 }, function (f) {
    var p = prog(f, start, end), e = E.inOutCubic(p);
    return { 'position.x': pSc[0], 'position.y': pSc[1], rotation: -(dir * al * (0.5 - e)), alpha: H.bell(p) };
  });
  return { start: start, end: end };
});

/* ================================================================ Camera/Tricks (xq*) */
reg('xqAccordion', 'ae/p_x2_camtr.jsx', function (c) {
  var w = H.transWindow(c, 0.5, 'xqAccordion'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, n = Math.max(2, Math.round(P.n || 8));
  var v = P.dir === 'U', toEnd = P.dir === 'R', Lx = v ? Hh : W, lw = Math.max(2, Math.min(W, Hh) * 0.005);
  var rigB = H.wrapCutRig(c, c, 'Accordion B rig', start, end);
  C.sample(c.graph, rigB, start, end, function (f) {
    var k = 1 - E.inOutCubic(prog(f, start, end)), po = (toEnd ? -1 : 1) * Lx * 0.05 * k;
    return v ? { 'position.y': -po } : { 'position.x': po };
  });
  addAbove(c, start, end, 'Accordion dim', G.rect(-W / 2, -Hh / 2, W, Hh), { fill: '#000000', alpha: 1 }, function (f) {
    return { alpha: 0.35 * (1 - E.inOutCubic(prog(f, start, end))) };
  });
  var copyA = H.cloneCutSubtree(c.graph, w.a, 'Accordion A copy', start, end);
  var edgeSc = v ? scPt(W / 2, toEnd ? Hh : 0, W, Hh) : scPt(toEnd ? Lx : 0, Hh / 2, W, Hh);
  C.sample(c.graph, copyA.rigId, start, end, function (f) {
    var k = Math.max(1e-3, 1 - E.inOutCubic(prog(f, start, end)));
    return v
      ? { 'position.y': edgeSc[1] * (1 - k), 'scale.y': k }
      : { 'position.x': edgeSc[0] * (1 - k), 'scale.x': k };
  });
  var pleatRoot = c.graph.add('null', c.cut.id + ' / Accordion pleats', c.sceneRoot, start, end, {});
  for (var i = 0; i < n; i++) {
    var s0 = Math.round(i * Lx / n), s1 = Math.round((i + 1) * Lx / n);
    var cmd = v ? G.rect(-W / 2, Hh / 2 - s1, W, s1 - s0) : G.rect(s0 - W / 2, -Hh / 2, s1 - s0, Hh);
    C.shape(c.graph, { id: c.cut.id, start: start, end: end }, 'Pleat ' + (i + 1), pleatRoot, cmd,
      { fill: i % 2 ? '#000000' : '#FFFFFF', alpha: i % 2 ? 0.42 : 0.1 });
  }
  C.sample(c.graph, pleatRoot, start, end, function (f) {
    var e = E.inOutCubic(prog(f, start, end)), k = Math.max(1e-3, 1 - e);
    return v
      ? { 'position.y': edgeSc[1] * (1 - k), 'scale.y': k, alpha: cl(e * 3) }
      : { 'position.x': edgeSc[0] * (1 - k), 'scale.x': k, alpha: cl(e * 3) };
  });
  addAbove(c, start, end, 'Accordion edge', v ? G.rect(-W / 2, -lw / 2, W, lw) : G.rect(-lw / 2, -Hh / 2, lw, Hh),
    { fill: H.transAcc(c), alpha: 1 }, function (f) {
      var p = prog(f, start, end), k = 1 - E.inOutCubic(p);
      var q = toEnd ? (Lx - lw) - Lx * k : Lx * k;
      return v
        ? { 'position.y': Hh / 2 - (q + lw / 2), alpha: k < 0.002 ? 0 : Math.pow(H.bell(p), 0.6) }
        : { 'position.x': (q + lw / 2) - W / 2, alpha: k < 0.002 ? 0 : Math.pow(H.bell(p), 0.6) };
    });
  return { start: start, end: end };
});

reg('xqBladeRun', 'ae/p_x2_camtr.jsx', function (c) {
  var w = H.transWindow(c, 0.5, 'xqBladeRun'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, n = Math.max(2, Math.round(P.n || 6)), ang = (P.ang || 30) * DEG, mid = !!P.mid;
  var R0 = Math.hypot(W, Hh) + 4, hb = R0 / n, lw = Math.max(2, Math.min(W, Hh) * 0.005), ac = H.transAcc(c);
  var ux = Math.cos(ang), uy = Math.sin(ang), vx = -uy, vy = ux;
  function toWorld(lx, ly) { return [lx * ux + ly * vx, -(lx * uy + ly * vy)]; }
  var contours = Object.create(null);
  for (var f = start; f < end; f++) {
    var p = prog(f, start, end), polys = [];
    for (var i = 0; i < n; i++) {
      var o = mid ? Math.abs(i - (n - 1) / 2) / Math.max(1, (n - 1) / 2) : i / Math.max(1, n - 1);
      var q = E.inOutCubic(cl(p * 1.5 - o * 0.5));
      if (q <= 0.002) continue;
      var y0 = -R0 / 2 + i * hb, y1 = y0 + hb + 1.2, len = R0 * q;
      var x0 = (i % 2) ? R0 / 2 - len : -R0 / 2, x1 = (i % 2) ? R0 / 2 : -R0 / 2 + len;
      polys.push([toWorld(x0, y0), toWorld(x1, y0), toWorld(x1, y1), toWorld(x0, y1)]);
    }
    contours[f] = polys;
  }
  H.extendCut(c.graph, w.a, end);
  H.multiClipCut(c, c, contours, false, 'Blade run clip', c.options);
  for (var i2 = 0; i2 < n; i2++) {
    (function (idx) {
      var o = mid ? Math.abs(idx - (n - 1) / 2) / Math.max(1, (n - 1) / 2) : idx / Math.max(1, n - 1);
      var yc = -R0 / 2 + idx * hb + hb / 2, odd = idx % 2;
      addAbove(c, start, end, 'Blade tip ' + (idx + 1), G.rect(-lw / 2, -hb / 2, lw, hb), { fill: ac, alpha: 1 }, function (f) {
        var q = E.inOutCubic(cl(prog(f, start, end) * 1.5 - o * 0.5));
        var lx = odd ? (R0 / 2 - lw / 2 - R0 * q) : (-R0 / 2 + lw / 2 + R0 * q);
        var wp = toWorld(lx, yc);
        return { 'position.x': wp[0], 'position.y': wp[1], rotation: -P.ang || -30, alpha: (q > 0 && q < 1) ? Math.min(1, (1 - q) * 3) : 0 };
      });
    })(i2);
  }
  return { start: start, end: end };
});

reg('xqChevronPush', 'ae/p_x2_camtr.jsx', function (c) {
  var w = H.transWindow(c, 0.5, 'xqChevronPush'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, n = Math.max(2, Math.round(P.n || 18)), dir = P.dir || 'L', inv = !!P.inv;
  var hor = dir !== 'U' && dir !== 'D', sg = (dir === 'R' || dir === 'D') ? 1 : -1, Lx = hor ? Hh : W, Mx = hor ? W : Hh;
  var lw = Math.max(2, Math.min(W, Hh) * 0.004), ac = H.transAcc(c);
  H.hideCutDuring(c.graph, c, start, end);
  for (var i = 0; i < Math.ceil(n / 2); i++) {
    (function (idx) {
      var cc = Math.abs(idx - (n - 1) / 2) / Math.max(0.5, (n - 1) / 2), bands = [idx];
      if (n - 1 - idx !== idx) bands.push(n - 1 - idx);
      var delay = 0.34 * (inv ? 1 - cc : cc);
      var bandPolys = bands.map(function (b) {
        var a0 = Math.round(b * Lx / n), a1 = Math.round((b + 1) * Lx / n);
        return hor ? rectPoly(0, a0, W, a1, W, Hh) : rectPoly(a0, 0, a1, Hh, W, Hh);
      });
      var cMap = Object.create(null);
      for (var f = start; f < end; f++) cMap[f] = bandPolys;
      [w.a, c].forEach(function (srcCtx, qi) {
        var cln = H.cloneCutSubtree(c.graph, srcCtx, 'Chevron ' + (qi ? 'B' : 'A') + (idx + 1), start, end);
        cln.paintables.forEach(function (id) { H.multiClip(c.graph, id, cMap, false, 'Chevron band', c.options); });
        C.sample(c.graph, cln.rigId, start, end, function (f) {
          var q = E.inOutCubic(cl((prog(f, start, end) - delay) / 0.66)), o = Math.round(q * Mx) * sg - (qi ? sg * Mx : 0);
          return hor ? { 'position.x': o } : { 'position.y': -o };
        });
      });
      bands.forEach(function (b, bi) {
        var s0 = Math.round(b * Lx / n), s1 = Math.round((b + 1) * Lx / n);
        var cmd = hor ? G.rect(-lw / 2, -(s1 - s0) / 2, lw, s1 - s0) : G.rect(-(s1 - s0) / 2, -lw / 2, s1 - s0, lw);
        var midBand = (s0 + s1) / 2;
        addAbove(c, start, end, 'Chevron seam ' + (idx + 1) + '_' + bi, cmd, { fill: ac, alpha: 1 }, function (f) {
          var p = prog(f, start, end), q = E.inOutCubic(cl((p - delay) / 0.66)), o = Math.round(q * Mx) * sg;
          var sq = sg < 0 ? Mx + o : o;
          return hor
            ? { 'position.x': sq - W / 2, 'position.y': Hh / 2 - midBand, alpha: (q > 0 && q < 1) ? Math.pow(H.bell(p), 0.6) : 0 }
            : { 'position.x': midBand - W / 2, 'position.y': Hh / 2 - sq, alpha: (q > 0 && q < 1) ? Math.pow(H.bell(p), 0.6) : 0 };
        });
      });
    })(i);
  }
  return { start: start, end: end };
});

reg('xqDiagSplit', 'ae/p_x2_camtr.jsx', function (c) {
  var w = H.transWindow(c, 0.48, 'xqDiagSplit'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, a = (P.ang || 35) * DEG, nx = Math.cos(a), ny = Math.sin(a);
  var L = (W + Hh) * 2, lw = Math.max(2, Math.min(W, Hh) * 0.005);
  var dist = (Math.abs(nx) * W + Math.abs(ny) * Hh) / 2 + 4;
  var rigB = H.wrapCutRig(c, c, 'Diag split B rig', start, end);
  C.sample(c.graph, rigB, start, end, function (f) {
    var s = 1.06 - 0.06 * E.outCubic(prog(f, start, end));
    return { 'scale.x': s, 'scale.y': s };
  });
  addAbove(c, start, end, 'Diag split dim', G.rect(-W / 2, -Hh / 2, W, Hh), { fill: '#000000', alpha: 1 }, function (f) {
    return { alpha: 0.4 * (1 - E.inOutCubic(prog(f, start, end))) };
  });
  [1, -1].forEach(function (sg, k) {
    var qx = W / 2 - nx * sg * 0.75, qy = Hh / 2 - ny * sg * 0.75;
    var poly = [
      [qx - ny * L, qy + nx * L],
      [qx + ny * L, qy - nx * L],
      [qx + ny * L + nx * sg * L, qy - nx * L + ny * sg * L],
      [qx - ny * L + nx * sg * L, qy + nx * L + ny * sg * L]
    ].map(function (pt) { return scPt(pt[0], pt[1], W, Hh); });
    var polys = Object.create(null);
    for (var f = start; f < end; f++) polys[f] = poly;
    var piece = H.cloneCutSubtree(c.graph, w.a, 'Split piece ' + (k + 1), start, end);
    piece.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
    C.sample(c.graph, piece.rigId, start, end, function (f) {
      var off = E.inOutCubic(prog(f, start, end)) * dist;
      return { 'position.x': nx * sg * off, 'position.y': -ny * sg * off };
    });
    addAbove(c, start, end, 'Split edge ' + (k + 1), V.commands([[-ny * L, -nx * L], [ny * L, nx * L]], false),
      { stroke: H.transAcc(c, sg < 0), width: lw, alpha: 1 }, function (f) {
        var p = prog(f, start, end), off = E.inOutCubic(p) * dist;
        return { 'position.x': nx * sg * off, 'position.y': -ny * sg * off, alpha: Math.pow(H.bell(p), 0.5) };
      });
  });
  return { start: start, end: end };
});

reg('xqFlipOver', 'ae/p_x2_camtr.jsx', function (c) {
  var w = H.transWindow(c, 0.52, 'xqFlipOver'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, v = !!P.vert, d = P.dir < 0 ? -1 : 1, K = 8, Lx = v ? Hh : W, SW = Lx / K;
  addBehindB(c, start, end, H.mixHex((w.a.sc || c.sc).bg, '#000000', 0.6), null, 'Flip back 1');
  addBehindB(c, start, end, H.mixHex(c.sc.bg, '#000000', 0.6), function (f) { return prog(f, start, end); }, 'Flip back 2');
  H.hideCutDuring(c.graph, c, start, end);
  [[w.a, 'A', true], [c, 'B', false]].forEach(function (F) {
    for (var i = 0; i < K; i++) {
      (function (idx) {
        var u0 = idx / K, um = (idx + 0.5) / K - 0.5, mc = u0 * Lx + SW / 2;
        var poly = v ? rectPoly(0, u0 * Lx - 0.5, W, u0 * Lx + SW + 0.5, W, Hh) : rectPoly(u0 * Lx - 0.5, 0, u0 * Lx + SW + 0.5, Hh, W, Hh);
        var polys = Object.create(null);
        for (var f = start; f < end; f++) polys[f] = poly;
        var sl = H.cloneCutSubtree(c.graph, F[0], 'Flip ' + F[1] + (idx + 1), start, end);
        sl.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
        var pv = v ? scPt(W / 2, mc, W, Hh) : scPt(mc, Hh / 2, W, Hh);
        C.sample(c.graph, sl.rigId, start, end, function (f) {
          var ang = E.inOutCubic(prog(f, start, end)) * PI, cc = Math.cos(ang), sn = Math.sin(ang);
          var ff = Math.abs(cc), per = 0.16 * sn * d * (cc >= 0 ? 1 : -1);
          var thin = Math.max(1e-3, ff + 0.6 / SW), tall = Math.max(1e-3, 1 - 0.05 * sn + per * um);
          var along = um * Lx * ff;
          return v
            ? { 'position.y': -along - pv[1] * thin, 'scale.x': tall, 'scale.y': thin }
            : { 'position.x': along - pv[0] * thin, 'scale.x': thin, 'scale.y': tall };
        });
        sl.paintables.forEach(function (id) {
          var node = c.graph.byId[id], base = node.attrs.alpha == null ? 1 : node.attrs.alpha;
          node.keys.alpha = node.keys.alpha || {};
          for (var f = start; f < end; f++) {
            var ang = E.inOutCubic(prog(f, start, end)) * PI, cc = Math.cos(ang), sn = Math.sin(ang), ff = Math.abs(cc);
            var vis = (F[2] ? cc >= 0 : cc < 0) && ff >= 0.006;
            node.keys.alpha[f] = { value: vis ? base * (1 - 0.5 * sn) : 0, type: 1 };
          }
        });
      })(i);
    }
  });
  return { start: start, end: end };
});

reg('xqHalftone', 'ae/p_x2_camtr.jsx', function (c) {
  var w = H.transWindow(c, 0.5, 'xqHalftone'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, md = Math.min(W, Hh), cell = md / Math.max(2, P.n || 7);
  var d = P.dir || 'L', rm = cell * 0.62, cols = Math.ceil(W / cell) + 1, rows = Math.ceil(Hh / (cell * 0.866)) + 1;
  var dots = [];
  for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
    var x = (i + (j % 2 ? 0.5 : 0)) * cell - cell * 0.25, y = j * cell * 0.866;
    if (x + rm < 0 || x - rm > W || y + rm < 0 || y - rm > Hh) continue;
    var fx = cl(x / W), fy = cl(y / Hh);
    var o = d === 'R' ? fx : d === 'L' ? 1 - fx : d === 'D' ? fy : d === 'U' ? 1 - fy
      : d === 'C' ? Math.min(1, Math.hypot(fx - 0.5, fy - 0.5) * 1.42) : (fx + fy) / 2;
    dots.push({ sc: scPt(x, y, W, Hh), o: o });
  }
  var contours = Object.create(null);
  for (var f = start; f < end; f++) {
    var p = prog(f, start, end), polys = [];
    for (var k = 0; k < dots.length; k++) {
      var dot = dots[k], rad = 0.5 * rm * (1 - Math.cos(PI * cl((p - dot.o * 0.55) / 0.45)));
      if (rad < 0.5) continue;
      var oct = [];
      for (var v = 0; v < 8; v++) {
        var a = v * TAU / 8;
        oct.push([dot.sc[0] + Math.cos(a) * rad, dot.sc[1] + Math.sin(a) * rad]);
      }
      polys.push(oct);
    }
    contours[f] = polys;
  }
  H.extendCut(c.graph, w.a, end);
  H.multiClipCut(c, c, contours, false, 'Halftone clip', c.options);
  return { start: start, end: end };
});

reg('xqLightLeak', 'ae/p_x2_camtr.jsx', function (c) {
  var w = H.transWindow(c, 0.52, 'xqLightLeak'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, md = Math.min(W, Hh), d = P.dir < 0 ? -1 : 1;
  var s0 = ((P.s0 || 0) | 0) + 3, y0 = P.y || 0.5, pb = (w.a.sc || c.sc).bg;
  var light = H.lum(c.sc.bg) > 0.6 && H.lum(pb) > 0.6;
  var cols = [c.sc.accent, c.sc.accent2 || c.sc.accent, H.mixHex(c.sc.accent, light ? (c.sc.accent2 || c.sc.fg) : '#FFFFFF', 0.55)];
  var copyA = H.cloneCutSubtree(c.graph, w.a, 'Leak A copy', start, end);
  copyA.paintables.forEach(function (id) {
    var n = c.graph.byId[id], base = n.attrs.alpha == null ? 1 : n.attrs.alpha;
    n.keys.alpha = n.keys.alpha || {};
    for (var f = start; f < end; f++) n.keys.alpha[f] = { value: base * (1 - H.smoothstep(0.3, 0.7, prog(f, start, end))), type: 1 };
  });
  for (var i = 0; i < 3; i++) {
    (function (idx) {
      var r = md * 0.45 * (0.75 + 0.45 * N.random(s0, idx, 3));
      var sy0 = y0 + (N.random(s0, idx, 1) * 2 - 1) * 0.3, syDrift = 0.2 * (N.random(s0, idx, 2) * 2 - 1);
      addAbove(c, start, end, 'Leak blob ' + (idx + 1), G.ellipse(0, 0, r, r), { fill: cols[idx], alpha: 1 }, function (f) {
        var p = prog(f, start, end), u = E.inOutSine(cl(p * 1.15 - idx * 0.07));
        var x = W * (d > 0 ? -0.25 + 1.5 * u : 1.25 - 1.5 * u);
        var y = Hh * cl(sy0 + (u - 0.5) * syDrift, 0.05, 0.95);
        var scf = 0.7 + 0.5 * H.bell(p);
        return { 'position.x': x - W / 2, 'position.y': Hh / 2 - y, 'scale.x': scf, 'scale.y': scf, alpha: (light ? 0.32 : 0.48) * Math.pow(H.bell(p), 0.8) };
      });
    })(i);
  }
  addAbove(c, start, end, 'Leak wash', G.rect(-W / 2, -Hh / 2, W, Hh), { fill: cols[2], alpha: 1 }, function (f) {
    return { alpha: 0.22 * Math.pow(H.bell(prog(f, start, end)), 0.8) };
  });
  return { start: start, end: end };
});

reg('xqLouverTurn', 'ae/p_x2_camtr.jsx', function (c) {
  var w = H.transWindow(c, 0.52, 'xqLouverTurn'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, n = Math.max(2, Math.round(P.n || 9)), v = !!P.vert, rev = !!P.rev;
  var Lx = v ? W : Hh, lw = Math.max(1, Math.min(W, Hh) * 0.0025), ac = H.transAcc(c);
  addAbove(c, start, end, 'Louver dim', G.rect(-W / 2, -Hh / 2, W, Hh), { fill: '#000000', alpha: 1 }, function (f) {
    return { alpha: 0.35 * (1 - E.inOutCubic(prog(f, start, end))) };
  });
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var a0 = Math.round(idx * Lx / n), a1 = Math.round((idx + 1) * Lx / n), mc = (a0 + a1) / 2;
      var k = (rev ? n - 1 - idx : idx) / n * 0.4;
      var poly = v ? rectPoly(a0, 0, a1, Hh, W, Hh) : rectPoly(0, a0, W, a1, W, Hh);
      var polys = Object.create(null);
      for (var f = start; f < end; f++) polys[f] = poly;
      var sl = H.cloneCutSubtree(c.graph, w.a, 'Louver slat ' + (idx + 1), start, end);
      sl.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      var pv = v ? scPt(mc, Hh / 2, W, Hh) : scPt(W / 2, mc, W, Hh);
      C.sample(c.graph, sl.rigId, start, end, function (f) {
        var q = E.inOutCubic(cl((prog(f, start, end) - k) / 0.6)), ff = Math.max(1e-3, Math.cos(q * PI / 2));
        return v ? { 'position.x': pv[0] * (1 - ff), 'scale.x': ff } : { 'position.y': pv[1] * (1 - ff), 'scale.y': ff };
      });
      sl.paintables.forEach(function (id) {
        var node = c.graph.byId[id], base = node.attrs.alpha == null ? 1 : node.attrs.alpha;
        node.keys.alpha = node.keys.alpha || {};
        for (var f = start; f < end; f++) {
          var q = E.inOutCubic(cl((prog(f, start, end) - k) / 0.6)), ff = Math.cos(q * PI / 2);
          node.keys.alpha[f] = { value: ff <= 0.004 ? 0 : base * (1 - 0.55 * q), type: 1 };
        }
      });
      addAbove(c, start, end, 'Louver edge ' + (idx + 1), v ? G.rect(-lw / 2, -Hh / 2, lw, Hh) : G.rect(-W / 2, -lw / 2, W, lw),
        { fill: ac, alpha: 1 }, function (f) {
          var q = E.inOutCubic(cl((prog(f, start, end) - k) / 0.6)), ff = Math.cos(q * PI / 2);
          var pos = (mc + lw / 2) - (a1 - a0) / 2 * ff;
          return v
            ? { 'position.x': pos - W / 2, alpha: (q > 0 && ff > 0.004) ? Math.min(1, q * 4) * ff : 0 }
            : { 'position.y': Hh / 2 - pos, alpha: (q > 0 && ff > 0.004) ? Math.min(1, q * 4) * ff : 0 };
        });
    })(i);
  }
  return { start: start, end: end };
});

reg('xqPagePeel', 'ae/p_x2_camtr.jsx', function (c) {
  var w = H.transWindow(c, 0.56, 'xqPagePeel'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, md = Math.min(W, Hh);
  var c0x = P.cx === 0 ? 0 : W, c0y = P.cy === 0 ? 0 : Hh, k = P.k || 0.6;
  var pb = (w.a.sc || c.sc).bg, backCol = H.mixHex(pb, H.lum(pb) > 0.5 ? '#000000' : '#FFFFFF', 0.16);
  var dx = c0x ? -1 : 1, dy = (c0y ? -1 : 1) * k, dl = Math.hypot(dx, dy);
  dx /= dl; dy /= dl;
  var D = Math.abs(dx) * W + Math.abs(dy) * Hh, tx = -dy, ty = dx, L = (W + Hh) * 2, sw = md * 0.09;
  var thDeg = Math.atan2(dy, dx) * 180 / PI;
  function ttAt(p) { return (E.inOutSine(p) * 0.6 + H.inOutQuart(p) * 0.4) * (D + 2); }
  var flatA = H.cloneCutSubtree(c.graph, w.a, 'Peel flat A', start, end);
  var flatPolys = Object.create(null);
  for (var f = start; f < end; f++) {
    var tt = ttAt(prog(f, start, end)), fx = c0x + dx * tt, fy = c0y + dy * tt;
    flatPolys[f] = [
      [fx - tx * L, fy - ty * L], [fx + tx * L, fy + ty * L],
      [fx + tx * L + dx * L, fy + ty * L + dy * L], [fx - tx * L + dx * L, fy - ty * L + dy * L]
    ].map(function (pt) { return scPt(pt[0], pt[1], W, Hh); });
  }
  flatA.paintables.forEach(function (id) { S.clip(c.graph, id, flatPolys); });
  /* Peeled triangular/quad flap behind crease + fold shadow */
  addAbove(c, start, end, 'Peel shadow', G.rect(-sw * 0.4, -L / 2, sw * 0.4, L), { fill: '#000000', alpha: 1 }, function (f) {
    var p = prog(f, start, end), tt = ttAt(p), fp = scPt(c0x + dx * tt, c0y + dy * tt, W, Hh);
    return { 'position.x': fp[0], 'position.y': fp[1], rotation: -thDeg, alpha: 0.35 * cl(p * 6) };
  });
  var flapPolys = Object.create(null);
  for (var f2 = start; f2 < end; f2++) {
    var tt2 = ttAt(prog(f2, start, end)), fx2 = c0x + dx * tt2, fy2 = c0y + dy * tt2;
    /* Mirror c0 across fold line -> fx2 + dx*tt2, fy2 + dy*tt2; build triangle between fold line and reflected corner */
    var rx = c0x + 2 * dx * tt2, ry = c0y + 2 * dy * tt2;
    var pA = scPt(fx2 - tx * L, fy2 - ty * L, W, Hh);
    var pB = scPt(fx2 + tx * L, fy2 + ty * L, W, Hh);
    var pR = scPt(rx, ry, W, Hh);
    flapPolys[f2] = [pA, pB, pR];
  }
  var flap = addAbove(c, start, end, 'Peel flap', G.rect(-W / 2, -Hh / 2, W, Hh), { fill: backCol, alpha: 0.95 });
  S.clip(c.graph, flap, flapPolys);
  return { start: start, end: end };
});

reg('xqPropeller', 'ae/p_x2_camtr.jsx', function (c) {
  var w = H.transWindow(c, 0.5, 'xqPropeller'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, n = Math.max(2, Math.round(P.n || 4)), d = P.dir < 0 ? -1 : 1;
  var a0 = P.a0 || 0, cx = W * (P.x || 0.5), cy = Hh * (P.y || 0.5), sc = scPt(cx, cy, W, Hh);
  var R0 = Math.hypot(Math.max(cx, W - cx), Math.max(cy, Hh - cy)) + 4, lw = Math.max(2, Math.min(W, Hh) * 0.005);
  var ac = H.transAcc(c), contours = Object.create(null);
  for (var f = start; f < end; f++) {
    var e = E.inOutCubic(prog(f, start, end)), sw = e * (TAU / n) + 0.004, tn = d * 0.9 * e;
    var polys = [], steps = Math.max(4, Math.ceil(sw / (PI / 18)));
    for (var i = 0; i < n; i++) {
      var base = a0 * DEG + tn + i * TAU / n, pts = [[sc[0], sc[1]]];
      for (var s = 0; s <= steps; s++) {
        var ang = base + d * sw * (s / steps);
        pts.push([sc[0] + Math.cos(ang) * R0, sc[1] - Math.sin(ang) * R0]);
      }
      polys.push(pts);
    }
    contours[f] = polys;
  }
  H.extendCut(c.graph, w.a, end);
  H.multiClipCut(c, c, contours, false, 'Propeller clip', c.options);
  for (var i2 = 0; i2 < n; i2++) {
    (function (idx) {
      addAbove(c, start, end, 'Propeller blade ' + (idx + 1), V.commands([[0, 0], [R0, 0]], false),
        { stroke: ac, width: lw, alpha: 1 }, function (f) {
          var p = prog(f, start, end), e = E.inOutCubic(p), swDeg = e * (360 / n) + 0.2292, tnDeg = d * 0.9 * 180 / PI * e;
          var deg = a0 + tnDeg + d * swDeg + idx * (360 / n);
          return { 'position.x': sc[0], 'position.y': sc[1], rotation: -deg, alpha: Math.pow(H.bell(p), 0.5) };
        });
    })(i2);
  }
  return { start: start, end: end };
});

reg('xqRingRipple', 'ae/p_x2_camtr.jsx', function (c) {
  var w = H.transWindow(c, 0.52, 'xqRingRipple'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, n = Math.max(2, Math.round(P.n || 5)), inw = !!P.inw;
  var cx = W * (P.x == null ? 0.5 : P.x), cy = Hh * (P.y == null ? 0.5 : P.y), sc = scPt(cx, cy, W, Hh);
  var R0 = Math.hypot(Math.max(cx, W - cx), Math.max(cy, Hh - cy)) + 4, bw = R0 / n;
  var lw = Math.max(2, Math.min(W, Hh) * 0.004), ac = H.transAcc(c);
  var contours = Object.create(null);
  function ringPts(r, segs) {
    var out = [];
    for (var s = 0; s < segs; s++) {
      var a = s * TAU / segs;
      out.push([sc[0] + Math.cos(a) * r, sc[1] + Math.sin(a) * r]);
    }
    return out;
  }
  for (var f = start; f < end; f++) {
    var p = prog(f, start, end), polys = [];
    for (var j = 0; j < n; j++) {
      var o = (inw ? n - 1 - j : j) / Math.max(1, n - 1);
      var q = E.inOutCubic(cl(p * 1.6 - o * 0.6));
      if (q <= 0.002) continue;
      var r0 = Math.max(0, j * bw - 0.8), r1 = j * bw + bw * q;
      if (r0 <= 1) {
        polys.push(ringPts(r1, 24));
      } else {
        /* Split annulus into 2 C-arcs so single closed polygon winding matches ring intersection cleanly */
        for (var h = 0; h < 2; h++) {
          var aStart = h * PI - 0.02, aEnd = (h + 1) * PI + 0.02, arc = [];
          for (var s1 = 0; s1 <= 12; s1++) {
            var a1 = mix(aStart, aEnd, s1 / 12);
            arc.push([sc[0] + Math.cos(a1) * r1, sc[1] + Math.sin(a1) * r1]);
          }
          for (var s2 = 12; s2 >= 0; s2--) {
            var a2 = mix(aStart, aEnd, s2 / 12);
            arc.push([sc[0] + Math.cos(a2) * r0, sc[1] + Math.sin(a2) * r0]);
          }
          polys.push(arc);
        }
      }
    }
    contours[f] = polys;
  }
  H.extendCut(c.graph, w.a, end);
  H.multiClipCut(c, c, contours, false, 'Ring ripple clip', c.options);
  for (var j2 = 0; j2 < n; j2++) {
    (function (idx) {
      var o = (inw ? n - 1 - idx : idx) / Math.max(1, n - 1);
      addAbove(c, start, end, 'Ripple edge ' + (idx + 1), G.ellipse(0, 0, 1, 1), { stroke: ac, width: 1, alpha: 1 }, function (f) {
        var q = E.inOutCubic(cl(prog(f, start, end) * 1.6 - o * 0.6)), r1 = Math.max(1e-3, idx * bw + bw * q);
        return {
          'position.x': sc[0], 'position.y': sc[1],
          'scale.x': r1, 'scale.y': r1,
          'stroke.width': lw / r1,
          alpha: (q > 0 && q < 1) ? Math.min(1, (1 - q) * 2.5) * Math.min(1, q * 6) : 0
        };
      });
    })(j2);
  }
  return { start: start, end: end };
});

reg('xqSoftSweep', 'ae/p_x2_camtr.jsx', function (c) {
  var w = H.transWindow(c, 0.5, 'xqSoftSweep'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, a = (P.ang || 0) * DEG, dx = Math.cos(a), dy = Math.sin(a);
  var tx = -dy, ty = dx, D = Math.abs(dx) * W + Math.abs(dy) * Hh, fw = D * (P.f || 0.4), L = (W + Hh) * 2;
  var ext = D / 2 + fw * 0.5 + 4;
  var polys = Object.create(null);
  for (var f = start; f < end; f++) {
    var e = E.inOutSine(prog(f, start, end)), s = ext * (1 - 2 * e);
    var cx = W / 2 + dx * s, cy = Hh / 2 + dy * s;
    polys[f] = [
      [cx - tx * L, cy - ty * L], [cx + tx * L, cy + ty * L],
      [cx + tx * L + dx * L, cy + ty * L + dy * L], [cx - tx * L + dx * L, cy - ty * L + dy * L]
    ].map(function (pt) { return scPt(pt[0], pt[1], W, Hh); });
  }
  H.extendCut(c.graph, w.a, end);
  H.clipCut(c, c, polys, c.options && c.options.hostProfile && c.options.hostProfile.javaScriptDeformer);
  /* Stepped translucent feather bands riding along the traveling sweep edge */
  var bgA = (w.a.sc || c.sc).bg, rot = -Math.atan2(dy, dx) * 180 / PI;
  for (var k = 0; k < 4; k++) {
    (function (idx) {
      var off = (idx - 1.5) * (fw * 0.25);
      addAbove(c, start, end, 'Sweep feather ' + (idx + 1), G.rect(-fw * 0.14, -L / 2, fw * 0.28, L),
        { fill: bgA, alpha: 0.22 - idx * 0.04 }, function (f) {
          var p = prog(f, start, end), e = E.inOutSine(p), s = ext * (1 - 2 * e);
          var px = W / 2 + dx * (s + off), py = Hh / 2 + dy * (s + off), sc = scPt(px, py, W, Hh);
          return { 'position.x': sc[0], 'position.y': sc[1], rotation: rot, alpha: (0.22 - idx * 0.04) * H.bell(p) };
        });
    })(k);
  }
  return { start: start, end: end };
});

reg('xqStretchSmear', 'ae/p_x2_camtr.jsx', function (c) {
  var w = H.transWindow(c, 0.48, 'xqStretchSmear'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, dir = P.dir || 'L';
  var hor = dir === 'L' || dir === 'R', fromEnd = dir === 'L' || dir === 'U', sg = fromEnd ? -1 : 1;
  var L = hor ? W : Hh, d = 0.08, lw = Math.max(2, Math.min(W, Hh) * 0.005);
  var polys = Object.create(null);
  for (var f = start; f < end; f++) {
    var xe = L * E.inOutCubic(prog(f, start, end));
    if (xe < 0.2) { polys[f] = offTri(); continue; }
    polys[f] = hor
      ? (fromEnd ? rectPoly(L - xe, 0, L, Hh, W, Hh) : rectPoly(0, 0, xe, Hh, W, Hh))
      : (fromEnd ? rectPoly(0, L - xe, W, L, W, Hh) : rectPoly(0, 0, W, xe, W, Hh));
  }
  H.extendCut(c.graph, w.a, end);
  H.clipCut(c, c, polys, c.options && c.options.hostProfile && c.options.hostProfile.javaScriptDeformer);
  var smear = c.graph.add('null', c.cut.id + ' / Stretch smear', c.sceneRoot, start, end, {});
  for (var k = 1; k <= 3; k++) {
    var sw = 100 * k / 3;
    var cmd = hor ? G.rect(-sg * sw / 2 - sw / 2, -Hh / 2, sw, Hh) : G.rect(-W / 2, -sg * sw / 2 - sw / 2, W, sw);
    C.shape(c.graph, { id: c.cut.id, start: start, end: end }, 'Smear step ' + k, smear, cmd, { fill: '#000000', alpha: 0.1 });
  }
  C.sample(c.graph, smear, start, end, function (f) {
    var e = E.inOutCubic(prog(f, start, end)), xe = L * e, xt = L * E.inOutCubic(cl((prog(f, start, end) - d) / (1 - d)));
    var x0 = fromEnd ? L - xe : xe, sx = Math.max(1e-3, (xe - xt) / 100);
    return hor ? { 'position.x': x0 - W / 2, 'scale.x': sx } : { 'position.y': Hh / 2 - x0, 'scale.y': sx };
  });
  addAbove(c, start, end, 'Smear edge', hor ? G.rect(-sg * lw / 2 - lw / 2, -Hh / 2, lw, Hh) : G.rect(-W / 2, -sg * lw / 2 - lw / 2, W, lw),
    { fill: H.transAcc(c), alpha: 1 }, function (f) {
      var p = prog(f, start, end), xe = L * E.inOutCubic(p), e0 = fromEnd ? L - xe : xe;
      return hor
        ? { 'position.x': e0 - W / 2, alpha: xe < L ? Math.min(1, p * 8) : 0 }
        : { 'position.y': Hh / 2 - e0, alpha: xe < L ? Math.min(1, p * 8) : 0 };
    });
  return { start: start, end: end };
});

reg('xqStripShuffle', 'ae/p_x2_camtr.jsx', function (c) {
  var w = H.transWindow(c, 0.55, 'xqStripShuffle'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, n = Math.max(2, Math.round(P.n || 5));
  var k = 1 + ((P.k || 1) % Math.max(1, n - 1));
  addBehindB(c, start, end, H.mixHex((w.a.sc || c.sc).bg, '#000000', 0.55), null, 'Shuffle table 1');
  addBehindB(c, start, end, H.mixHex(c.sc.bg, '#000000', 0.55), function (f) { return prog(f, start, end); }, 'Shuffle table 2');
  H.hideCutDuring(c.graph, c, start, end);
  for (var pass = 0; pass <= 1; pass++) for (var i = 0; i < n; i++) {
    if ((i % 2) !== pass) continue;
    (function (idx, isOdd) {
      var x0 = Math.round(idx * W / n), x1 = Math.round((idx + 1) * W / n), sw = x1 - x0;
      var tx = Math.round(((n - 1 - idx + k) % n) * W / n);
      var polys = Object.create(null), poly = rectPoly(x0, 0, x1, Hh, W, Hh);
      for (var f = start; f < end; f++) polys[f] = poly;
      var sc0 = scPt(x0 + sw / 2, Hh / 2, W, Hh);
      addAbove(c, start, end, 'Shuffle shadow ' + (idx + 1), G.rect(sc0[0] - sw * 0.52, -Hh / 2, sw * 1.04, Hh),
        { fill: '#000000', alpha: 1 }, function (f) {
          var m = 0.5 - 0.5 * Math.cos(TAU * prog(f, start, end));
          return { 'position.x': Math.round((tx - x0) * m), 'position.y': -Math.round((isOdd ? -1 : 1) * Hh * 0.04 * m), alpha: 0.35 * m };
        });
      [[w.a, 'A', false], [c, 'B', true]].forEach(function (pair) {
        var sl = H.cloneCutSubtree(c.graph, pair[0], 'Shuffle ' + pair[1] + (idx + 1), start, end);
        sl.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
        C.sample(c.graph, sl.rigId, start, end, function (f) {
          var m = 0.5 - 0.5 * Math.cos(TAU * prog(f, start, end));
          return { 'position.x': Math.round((tx - x0) * m), 'position.y': -Math.round((isOdd ? -1 : 1) * Hh * 0.04 * m) };
        });
        sl.paintables.forEach(function (id) {
          var node = c.graph.byId[id], base = node.attrs.alpha == null ? 1 : node.attrs.alpha;
          node.keys.alpha = node.keys.alpha || {};
          for (var f = start; f < end; f++) {
            var xf = H.smoothstep(0.4, 0.6, prog(f, start, end));
            node.keys.alpha[f] = { value: base * (pair[2] ? xf : (xf < 1 ? 1 - xf : 0)), type: 1 };
          }
        });
      });
    })(i, !!pass);
  }
  return { start: start, end: end };
});

reg('xqWaveWipe', 'ae/p_x2_camtr.jsx', function (c) {
  var w = H.transWindow(c, 0.5, 'xqWaveWipe'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, dir = P.dir || 'L', hor = dir === 'L' || dir === 'R';
  var fromEnd = dir === 'L' || dir === 'U', Lm = hor ? W : Hh, Le = hor ? Hh : W;
  var amp = Math.min(W, Hh) * 0.055, wv = P.w || 1.5, sp = P.sp || 1, ph = P.ph || 0;
  var lw = Math.max(2, Math.min(W, Hh) * 0.006), sgn = fromEnd ? -1 : 1, Npts = 48;
  var sE = -sp * Le / wv, mg = 8 + Le * 0.02, u0 = -Math.max(0, sE) - mg, u1 = Le - Math.min(0, sE) + mg;
  function waveSample(u) {
    return amp * Math.sin(u / Le * TAU * wv + ph) + amp * 0.4 * Math.sin(u / Le * TAU * (wv * 2 + 1) - ph * 1.7);
  }
  var polys = Object.create(null);
  for (var f = start; f < end; f++) {
    var p = prog(f, start, end), X = (-amp * 1.5 - 2) + (Lm + amp * 3 + 4) * E.inOutCubic(p), sl = sE * p;
    var xe = fromEnd ? Lm - X : X, pts = [];
    for (var i = 0; i <= Npts; i++) {
      var u = mix(u0, u1, i / Npts), ws = waveSample(u);
      pts.push(hor ? scPt(xe + ws, u + sl, W, Hh) : scPt(u + sl, xe + ws, W, Hh));
    }
    var backX = fromEnd ? Lm + amp * 3 + 12 : -amp * 3 - 12;
    if (hor) {
      pts.push(scPt(backX, u1 + sl, W, Hh));
      pts.push(scPt(backX, u0 + sl, W, Hh));
    } else {
      pts.push(scPt(u1 + sl, backX, W, Hh));
      pts.push(scPt(u0 + sl, backX, W, Hh));
    }
    polys[f] = pts;
  }
  H.extendCut(c.graph, w.a, end);
  H.clipCut(c, c, polys, c.options && c.options.hostProfile && c.options.hostProfile.javaScriptDeformer);
  var curvePts = [];
  for (var i2 = 0; i2 <= Npts; i2++) {
    var uu = mix(u0, u1, i2 / Npts), ww = waveSample(uu);
    curvePts.push(hor ? [ww, -uu] : [uu, -ww]);
  }
  [0, 1].forEach(function (idx) {
    addAbove(c, start, end, idx ? 'Wave edge ahead' : 'Wave edge', V.commands(curvePts, false),
      { stroke: H.transAcc(c, !!idx), width: idx ? Math.max(1, lw * 0.4) : lw, alpha: 1 }, function (f) {
        var p = prog(f, start, end), X = (-amp * 1.5 - 2) + (Lm + amp * 3 + 4) * E.inOutCubic(p), sl = sE * p;
        var xe = (fromEnd ? Lm - X : X) + (idx ? sgn * lw * 3.5 : 0);
        return hor
          ? { 'position.x': xe - W / 2, 'position.y': Hh / 2 - sl, alpha: Math.pow(H.bell(p), 0.6) * (idx ? 0.6 : 1) }
          : { 'position.x': sl - W / 2, 'position.y': Hh / 2 - xe, alpha: Math.pow(H.bell(p), 0.6) * (idx ? 0.6 : 1) };
      });
  });
  return { start: start, end: end };
});

reg('xqWindowZoom', 'ae/p_x2_camtr.jsx', function (c) {
  var w = H.transWindow(c, 0.5, 'xqWindowZoom'), P = w.P, start = w.start, end = w.end;
  var W = c.comp.width, Hh = c.comp.height, x0 = W * (P.x == null ? 0.5 : P.x), y0 = Hh * (P.y == null ? 0.5 : P.y);
  var lw0 = Math.max(2, Math.min(W, Hh) * 0.007), so0 = Math.min(W, Hh) * 0.02, r0 = P.r || 0;
  H.extendCut(c.graph, w.a, end);
  var rigA = H.wrapCutRig(c, w.a, 'Window zoom A rig', start, end);
  C.sample(c.graph, rigA, start, end, function (f) {
    var s = 1 + 0.18 * E.inOutCubic(prog(f, start, end));
    return { 'scale.x': s, 'scale.y': s };
  });
  addBehindB(c, start, end, '#000000', function (f) { return 0.45 * E.outCubic(prog(f, start, end)); }, 'Window dim');
  addBehindB(c, start, end, '#000000', null, 'Window shadow base');
  var shId = C.shape(c.graph, { id: c.cut.id, start: start, end: end }, c.cut.id + ' / Window shadow',
    c.graph.byId[c.layerIds[0]].parent, G.rect(-W / 2, -Hh / 2, W, Hh), { fill: '#000000', alpha: 1 });
  insertBefore(c.graph, shId, c.layerIds[0]);
  C.sample(c.graph, shId, start, end, function (f) {
    var e = Math.max(1e-3, E.inOutCubic(prog(f, start, end))), ro = r0 * (1 - e), rad = ro * DEG;
    var sc = scPt(mix(x0, W / 2, e), mix(y0, Hh / 2, e), W, Hh), so = so0 * (1 - e);
    return {
      'position.x': sc[0] + so * (Math.cos(rad) - Math.sin(rad)),
      'position.y': sc[1] - so * (Math.sin(rad) + Math.cos(rad)),
      'scale.x': e, 'scale.y': e, rotation: -ro, alpha: 0.4 * (1 - e)
    };
  });
  var rigB = H.wrapCutRig(c, c, 'Window zoom B rig', start, end);
  C.sample(c.graph, rigB, start, end, function (f) {
    var e = Math.max(1e-3, E.inOutCubic(prog(f, start, end))), ro = r0 * (1 - e);
    var sc = scPt(mix(x0, W / 2, e), mix(y0, Hh / 2, e), W, Hh);
    return { 'position.x': sc[0], 'position.y': sc[1], 'scale.x': e, 'scale.y': e, rotation: -ro };
  });
  addAbove(c, start, end, 'Window frame', G.rect(-W / 2, -Hh / 2, W, Hh), { stroke: H.transAcc(c), width: 1, alpha: 1 }, function (f) {
    var p = prog(f, start, end), e = Math.max(1e-3, E.inOutCubic(p)), ro = r0 * (1 - e);
    var lw = lw0 * (1 - H.smoothstep(0.75, 1, p)), sc = scPt(mix(x0, W / 2, e), mix(y0, Hh / 2, e), W, Hh);
    return {
      'position.x': sc[0], 'position.y': sc[1],
      'scale.x': e, 'scale.y': e, rotation: -ro,
      'stroke.width': lw / e,
      alpha: (lw > 0.3 && e >= 0.004) ? 1 : 0
    };
  });
  return { start: start, end: end };
});
})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
