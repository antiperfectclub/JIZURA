/* Core Cavalry background recipes (none + 11p_looks.js + 11p_horror3.js). */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, TAU = H.TAU, DEG = H.DEG;

function register(key, source, build, differences) {
  N.register('bg', key, {
    source: source,
    scope: 'cut',
    build: build,
    differences: differences || []
  });
}

function wrap(v, m) {
  return ((v % m) + m) % m;
}

function glowOf(sc) {
  var L = H.lum(sc.bg);
  var list = [sc.accent, sc.accent2, sc.ghostA, sc.ghostB, sc.fg];
  for (var i = 0; i < list.length; i++) {
    if (list[i] && H.lum(list[i]) > L + 0.25) return list[i];
  }
  return sc.fg;
}

function nightC(sc) {
  return H.mixHex(sc.bg, '#000000', H.dark(sc.bg) ? 0.72 : 0.9);
}

function lightOf(sc) {
  return H.lum(sc.fg) > H.lum(sc.bg) ? sc.fg : sc.bg;
}

function dimC(sc, k) {
  return H.dark(sc.bg) ? H.layC(sc, k) : H.mixHex(sc.bg, '#000000', k * 1.1);
}

function lampLvl(t, seed, rate) {
  var st = Math.floor(t * 24), run = st >> 2;
  if (N.random(seed, run, 7) < 0.1 * (rate || 1)) return N.random(seed, st, 8) < 0.5 ? 0.15 : 0.55;
  return 0.88 + 0.12 * N.random(seed, st, 9);
}

function radialRings(c, name, cx, cy, R, stops, animFn) {
  var ids = [];
  for (var i = stops.length - 1; i >= 0; i--) {
    var st = stops[i];
    if (!(st[2] > 0)) continue;
    var r = Math.max(2, R * st[0]);
    var id = C.shape(c.graph, c.cut, c.cut.id + ' / ' + name + ' ' + i, c.parent,
      G.ellipse(0, 0, r, r), { fill: st[1], alpha: st[2] });
    var p0 = H.toScene(c, cx, cy);
    c.graph.byId[id].attrs.position = p0;
    ids.push({ id: id, baseAlpha: st[2] });
  }
  if (animFn) {
    ids.forEach(function (item) {
      V.animate(c, item.id, function (e, f) {
        var o = animFn(e, f, item.baseAlpha);
        return o;
      });
    });
  }
  return ids;
}

function vignetteOverlay(c, name, col, innerR, outerR, baseAlpha, clock) {
  var W = c.comp.width, Hh = c.comp.height;
  var steps = 5;
  for (var i = 0; i < steps; i++) {
    (function (idx) {
      var frac = (idx + 1) / steps;
      var rIn = mix(innerR, outerR, idx / steps);
      var a = baseAlpha * (frac * frac) * 0.36;
      var cmds = G.rect(-W * 0.65, -Hh * 0.65, W * 1.3, Hh * 1.3);
      var n = 28;
      cmds.push(['M', rIn, 0]);
      for (var k = n - 1; k >= 0; k--) {
        var ang = k * TAU / n;
        cmds.push(['L', Math.cos(ang) * rIn, Math.sin(ang) * rIn]);
      }
      cmds.push(['Z']);
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / ' + name + ' ' + idx, c.parent, cmds, { fill: col, alpha: Math.max(0.01, a) });
      V.animate(c, id, function (e, f) {
        return { alpha: a * clock.enter(f, 0.6) };
      });
    })(i);
  }
}

/* 0. none */
register('none', 'src/01_util.js', function () { return null; });

/* 1. sunburst */
register('sunburst', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'sunburst');
  var cx = W * H.p(P, 'cx', 0.5), cy = Hh * H.p(P, 'cy', 0.5), n = Math.max(4, Math.round(H.p(P, 'n', 16)));
  var spd = H.p(P, 'spd', 4), k = H.p(P, 'k', 0.08), R = Math.hypot(W, Hh) * 1.15;
  var w = TAU / n * 0.5, cmds = [];
  for (var i = 0; i < n; i++) {
    var a0 = i / n * TAU;
    cmds.push(['M', 0, 0], ['L', Math.cos(a0) * R, -Math.sin(a0) * R],
      ['L', Math.cos(a0 + w) * R, -Math.sin(a0 + w) * R], ['Z']);
  }
  var p0 = H.toScene(c, cx, cy);
  var rays = C.shape(c.graph, c.cut, c.cut.id + ' / Sunburst rays', c.parent, cmds, { fill: H.layC(c.sc, k), alpha: 1 });
  c.graph.byId[rays].attrs.position = p0;
  V.animate(c, rays, function (e, f) {
    var t = clk.absTime(f), q = clk.enter(f, 0.5), sc = 0.25 + 0.75 * q;
    return { rotation: -(t * spd + (1 - q) * 25), 'scale.x': sc, 'scale.y': sc, alpha: q };
  });
  var rr = U * 0.55;
  radialRings(c, 'Sunburst core glow', cx, cy, rr, [
    [0.35, c.sc.bg, 0.55], [0.68, c.sc.bg, 0.3], [1.0, c.sc.bg, 0.14]
  ], function (e, f, ba) {
    return { alpha: ba * clk.enter(f, 0.5) };
  });
}, ['Center radial fade uses concentric translucent discs instead of canvas radial gradient.']);

/* 2. concentric */
register('concentric', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'concentric');
  var gap = U * H.p(P, 'gap', 0.09), spd = H.p(P, 'spd', 0.2), k = H.p(P, 'k', 0.1);
  var cy = Hh * H.p(P, 'cy', 0.5), Rm = Math.hypot(W, Hh) * 0.62;
  var count = Math.min(20, Math.max(4, Math.ceil(Rm / gap) + 1));
  var start = c.cut.start, end = c.cut.end, fps = c.comp.fps;
  var p0 = H.toScene(c, W / 2, cy);
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Concentric rings', c.parent,
    G.ellipse(0, 0, Rm, Rm), { stroke: H.layC(c.sc, k), width: Math.max(1.5, gap * 0.18), alpha: 1 });
  c.graph.byId[id].attrs.position = p0;
  var profile = (c.options || {}).hostProfile || {};
  if (profile.javaScriptDeformer === false) return id;
  var data = [clk.absTime(start), clk.time(start), fps, gap, spd, Rm, count];
  var expression = '(function(){var p=' + JSON.stringify(data) + ', f=(n0-' + start + ')/p[2];' +
    'var phase=((p[0]+f)*p[4]%1+1)%1, u=Math.max(0,Math.min(1,(p[1]+f)/0.6));' +
    'var extent=p[5]*(1-Math.pow(1-u,3)), path=new cavalry.Path();' +
    'for(var i=0;i<p[6];i++){var r=(i+phase)*p[3];if(r>=2&&r<extent)path.addEllipse(0,0,r*2,r*2);}' +
    'var d=def.highestDepthWithPath();if(d<0)return;var ms=def.getMeshesAtDepth(d);' +
    'if(ms.length){ms[0].setPathAtIndex(0,path);def.setMeshesAtDepth(d,ms);}})();';
  var type = (profile.javaScriptDeformer || {}).layerType || 'javaScriptDeformer';
  var driver = c.graph.add(type, c.cut.id + ' / Concentric clock', id, start, end, { expression: expression, 'array.0': start });
  c.graph.key(driver, 'array.0', start, start, 1);
  if (end - start > 1) c.graph.key(driver, 'array.0', end - 1, end - 1, 1);
  c.graph.connect(driver, 'id', id, 'deformers');
  return id;
});

/* 3. halftoneFade */
register('halftoneFade', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'halftoneFade');
  var cell = Math.max(U * H.p(P, 'cell', 0.036), Math.sqrt(W * Hh / 600));
  var dir = H.p(P, 'dir', 45) * DEG, k = H.p(P, 'k', 0.14);
  var dx = Math.cos(dir), dy = Math.sin(dir), ext = Math.max(1, Math.abs(dx) * W / 2 + Math.abs(dy) * Hh / 2);
  var Wc = W + cell * 2, Hc = Hh + cell * 2, cmds = [], row = 0;
  for (var y = 0; y < Hc + cell; y += cell * 0.866, row++) {
    for (var px = (row & 1) * cell / 2; px < Wc + cell; px += cell) {
      var u = ((px - cell - W / 2) * dx + (y - cell - Hh / 2) * dy) / ext;
      var r = cell * 0.52 * H.smoothstep(-0.8, 1, u);
      if (r < cell * 0.06) continue;
      cmds = cmds.concat(G.ellipse(px - cell - W / 2, Hh / 2 - (y - cell), r, r));
    }
  }
  if (!cmds.length) cmds = G.ellipse(0, 0, cell * 0.25, cell * 0.25);
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Halftone field', c.parent, cmds, { fill: H.layC(c.sc, k), alpha: 1 });
  V.animate(c, id, function (e, f) {
    var t = clk.absTime(f), q = clk.enter(f, 0.5);
    return { 'position.x': -cell + wrap(t * cell * 0.35, cell), alpha: q };
  });
});

/* 4. bigStripes */
register('bigStripes', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'bigStripes');
  var ang = H.p(P, 'ang', 45), per = U * H.p(P, 'w', 0.08) * 2, spd = H.p(P, 'spd', 0.05);
  var fillF = H.p(P, 'fill', 0.5), k = H.p(P, 'k', 0.06), R = Math.hypot(W, Hh) / 2 + per * 2;
  var rig = c.graph.add('null', c.cut.id + ' / Big stripes rig', c.parent, c.cut.start, c.cut.end, { rotation: -ang });
  var cmds = [];
  for (var x = -R - per; x < R + per; x += per) {
    cmds = cmds.concat(G.rect(x, -R, per * fillF, R * 2));
  }
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Big stripes', rig, cmds, { fill: H.layC(c.sc, k), alpha: 1 });
  V.animate(c, id, function (e, f) {
    var t = clk.absTime(f), q = E.outExpo(clk.time(f) / 0.5);
    return { 'position.x': wrap(t * U * spd, per), alpha: q };
  });
});

/* 5. splitDiag */
register('splitDiag', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height;
  var clk = H.bgClock(c, 'splitDiag');
  var side = H.p(P, 'side', 1) > 0 ? 1 : -1, pos = H.p(P, 'pos', 0.5), ang = H.p(P, 'ang', 20);
  var k = H.p(P, 'k', 0.09), col = P.c === 'tint' ? H.tintC(c.sc, k * 1.8) : H.layC(c.sc, k);
  var tn = Math.tan(ang * DEG), cx0 = W * pos, xt = cx0 - tn * Hh / 2, xb = cx0 + tn * Hh / 2;
  var edgeX = side > 0 ? W * 2.2 : -W * 2.2;
  var poly = H.poly(c, 'Split diag fill', [[xt, -10], [edgeX, -10], [edgeX, Hh + 10], [xb, Hh + 10]], true, { fill: col, alpha: 1 });
  var line = H.line(c, 'Split diag line', [[xt, -10], [xb, Hh + 10]], H.tintC(c.sc, 0.45), 2, 0.6);
  [poly, line].forEach(function (id, idx) {
    V.animate(c, id, function (e, f) {
      var t = clk.absTime(f), q = E.outExpo(clk.time(f) / 0.5);
      var dx = (1 - q) * W * 0.9 * side + W * 0.01 * Math.sin(t * 0.5);
      return { 'position.x': dx, alpha: idx ? 0.6 * q : 1 };
    });
  });
});

/* 6. gradientSweep */
register('gradientSweep', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height;
  var clk = H.bgClock(c, 'gradientSweep');
  var L = Math.hypot(W, Hh), k = H.p(P, 'k', 0.2), cKey = P.c || 'accent';
  var col = H.mixHex(c.sc.bg, c.sc[cKey] || c.sc.accent, k), a0 = H.p(P, 'a0', 0), spd = H.p(P, 'spd', 0.35);
  var rig = c.graph.add('null', c.cut.id + ' / Gradient sweep rig', c.parent, c.cut.start, c.cut.end, {});
  V.animate(c, rig, function (e, f) {
    return { rotation: -(a0 / DEG + clk.absTime(f) * 0.12 / DEG) };
  });
  var bands = 9;
  for (var i = 0; i < bands; i++) {
    (function (idx) {
      var u = (idx + 0.5) / bands;
      var bAlpha = 0.28 * Math.sin(Math.PI * u);
      var bw = L * (1.2 - idx * 0.09);
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Sweep band ' + idx, rig,
        G.rect(-bw / 2, -L * 0.7, bw, L * 1.4), { fill: col, alpha: bAlpha });
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f), q = clk.enter(f, 0.6), p = 0.32 * Math.sin(t * spd);
        return { 'position.x': p * L * 0.7, alpha: bAlpha * q };
      });
    })(i);
  }
}, ['Linear gradient sweep is built with layered nested translucent bands.']);

/* 7. spotlight */
register('spotlight', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'spotlight');
  var seed = H.p(P, 'seed', 1), dk = H.dark(c.sc.bg), lc = dk ? c.sc.fg : '#FFFFFF';
  var k0 = H.p(P, 'k', 0.12), R = U * 0.62;
  vignetteOverlay(c, 'Spotlight dark', '#000000', R * 0.35, Math.hypot(W, Hh) * 0.85, dk ? 0.4 : 0.18, clk);
  var glow = radialRings(c, 'Spotlight pool', W / 2, Hh / 2, R, [
    [0.35, lc, k0 * 0.55], [0.65, lc, k0 * 0.45], [0.95, lc, k0 * 0.22]
  ], function (e, f, ba) {
    var t = clk.absTime(f), q = clk.enter(f, 0.6);
    var cx = W * (0.5 + 0.2 * Math.sin(t * 0.31 + (seed % 7)));
    var cy = Hh * (0.52 + 0.08 * Math.sin(t * 0.23 + (seed % 5)));
    var pos = H.toScene(c, cx, cy);
    return { 'position.x': pos[0], 'position.y': pos[1], alpha: ba * q };
  });
  if (P.beam !== false) {
    for (var b = 0; b < 3; b++) {
      (function (bi) {
        var f1 = 1 - bi * 0.28;
        var beam = C.shape(c.graph, c.cut, c.cut.id + ' / Spotlight beam ' + bi, c.parent,
          [['M', -U * 0.04 * f1, 0], ['L', U * 0.04 * f1, 0], ['L', R * 0.75 * f1, -Hh], ['L', -R * 0.75 * f1, -Hh], ['Z']],
          { fill: lc, alpha: k0 * 0.28 });
        V.animate(c, beam, function (e, f) {
          var t = clk.absTime(f), q = clk.enter(f, 0.6);
          var cx = W * (0.5 + 0.2 * Math.sin(t * 0.31 + (seed % 7)));
          var cy = Hh * (0.52 + 0.08 * Math.sin(t * 0.23 + (seed % 5)));
          var tx = cx + (W / 2 - cx) * 0.5;
          var pos = H.toScene(c, tx, 0);
          return {
            'position.x': pos[0], 'position.y': pos[1],
            'scale.y': Math.max(0.1, cy / Hh),
            alpha: k0 * 0.28 * q
          };
        });
      })(b);
    }
  }
  return glow;
}, ['Spotlight falloff and beam use nested translucent shapes rather than canvas gradients.']);

/* 8. tvBars */
register('tvBars', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height;
  var clk = H.bgClock(c, 'tvBars');
  var seed = H.p(P, 'seed', 1), n = Math.max(2, Math.round(H.p(P, 'n', 5))), spd = H.p(P, 'spd', 0.08), k = H.p(P, 'k', 0.07);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var h = Hh * mix(0.02, 0.15, N.random(seed, idx, 1));
      var v = Hh * spd * (0.5 + N.random(seed, idx, 2));
      var off0 = N.random(seed, idx, 3) * Hh * 1.4;
      var col = idx % 3 === 0 ? H.tintC(c.sc, k * 1.7) : H.layC(c.sc, k * (0.6 + 0.8 * N.random(seed, idx, 4)));
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / TV bar ' + idx, c.parent,
        G.rect(-W / 2, -h, W, h), { fill: col, alpha: 1 });
      var line = N.random(seed, idx, 5) < 0.5
        ? C.shape(c.graph, c.cut, c.cut.id + ' / TV line ' + idx, c.parent,
          G.rect(-W / 2, 0, W, Math.max(1.5, Hh * 0.002)), { fill: H.layC(c.sc, k * 1.4), alpha: 1 })
        : null;
      V.animate(c, id, function (e, f) {
        var y = wrap(clk.absTime(f) * v + off0, Hh * 1.4) - Hh * 0.2;
        return { 'position.y': Hh / 2 - y, alpha: clk.enter(f, 0.4) };
      });
      if (line) {
        V.animate(c, line, function (e, f) {
          var y = wrap(clk.absTime(f) * v + off0, Hh * 1.4) - Hh * 0.2;
          return { 'position.y': Hh / 2 - (y - Hh * 0.012), alpha: clk.enter(f, 0.4) };
        });
      }
    })(i);
  }
});

/* 9. speedLines */
register('speedLines', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height;
  var clk = H.bgClock(c, 'speedLines');
  var seed = H.p(P, 'seed', 1), n = Math.min(120, Math.max(24, Math.round(H.p(P, 'n', 90))));
  var k = H.p(P, 'k', 0.22), clear = H.p(P, 'clear', 0.34), R = Math.hypot(W, Hh) * 0.65;
  var variants = 4;
  for (var v = 0; v < variants; v++) {
    (function (vi) {
      var cmds = [];
      for (var i = 0; i < n; i++) {
        var a = (i + N.random(seed, i, vi, 1) * 0.8) / n * TAU;
        var f0 = 1 + N.random(seed, i, vi, 2) * 0.5, w = TAU / n * (0.15 + 0.45 * N.random(seed, i, vi, 3));
        var rx = W * clear * f0, ry = Hh * clear * 1.05 * f0;
        cmds.push(['M', Math.cos(a) * rx, -Math.sin(a) * ry],
          ['L', Math.cos(a - w / 2) * R, -Math.sin(a - w / 2) * R],
          ['L', Math.cos(a + w / 2) * R, -Math.sin(a + w / 2) * R], ['Z']);
      }
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Speed lines ' + vi, c.parent, cmds, { fill: H.layC(c.sc, k), alpha: 1 });
      V.animate(c, id, function (e, f) {
        var st = Math.floor(clk.absTime(f) * 12) % variants;
        var q = clk.enter(f, 0.3), sc = 1 + (1 - q) * 0.35;
        return { 'scale.x': sc, 'scale.y': sc, alpha: st === vi ? 1 : 0 };
      });
    })(v);
  }
}, ['Stepped kinetic redraw uses 4 cyclic frame variations.']);

/* 10. scanBars */
register('scanBars', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height;
  var clk = H.bgClock(c, 'scanBars');
  var seed = H.p(P, 'seed', 1), n = Math.max(1, Math.round(H.p(P, 'n', 2)));
  var spd = H.p(P, 'spd', 0.08), k = H.p(P, 'k', 0.06);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var h = Hh * (0.12 + 0.12 * N.random(seed, idx, 1));
      var v = Hh * spd * (0.8 + 0.4 * N.random(seed, idx, 2));
      var off = N.random(seed, idx, 3) * Hh * 1.5;
      var slices = 5;
      for (var s = 0; s < slices; s++) {
        (function (si) {
          var fy = si / slices, fh = h / slices;
          var a = k * (si === slices - 1 ? 0.55 : (si + 0.5) / (slices - 1));
          var id = C.shape(c.graph, c.cut, c.cut.id + ' / Scan bar ' + idx + ' ' + si, c.parent,
            G.rect(-W / 2, -fy * h - fh, W, fh), { fill: c.sc.fg, alpha: a });
          V.animate(c, id, function (e, f) {
            var y = wrap(clk.absTime(f) * v + off, Hh * 1.5) - Hh * 0.3;
            return { 'position.y': Hh / 2 - y, alpha: a * clk.enter(f, 0.5) };
          });
        })(s);
      }
      var line = C.shape(c.graph, c.cut, c.cut.id + ' / Scan hairline ' + idx, c.parent,
        G.rect(-W / 2, -h * 0.86, W, Math.max(1.5, Hh * 0.002)), { fill: c.sc.fg, alpha: cl(k * 1.6) });
      V.animate(c, line, function (e, f) {
        var y = wrap(clk.absTime(f) * v + off, Hh * 1.5) - Hh * 0.3;
        return { 'position.y': Hh / 2 - y, alpha: cl(k * 1.6) * clk.enter(f, 0.5) };
      });
    })(i);
  }
});

/* 11. dotGrid */
register('dotGrid', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'dotGrid');
  var seed = H.p(P, 'seed', 1), sp = Math.max(U * H.p(P, 'sp', 0.055), Math.sqrt(W * Hh / 550));
  var r = Math.max(1.5, U * 0.0036), k = H.p(P, 'k', 0.25), plus = P.plus !== false;
  var cols = Math.ceil(W / sp) + 2, rows = Math.ceil(Hh / sp) + 2, cmds = [], accList = [];
  for (var j = -1; j <= rows; j++) {
    for (var i = -1; i <= cols; i++) {
      var x = i * sp - W / 2, y = Hh / 2 - j * sp;
      if (plus && i % 4 === 0 && j % 4 === 0) {
        cmds = cmds.concat(G.rect(x - r * 3, y - r * 0.5, r * 6, r), G.rect(x - r * 0.5, y - r * 3, r, r * 6));
      } else {
        cmds = cmds.concat(G.ellipse(x, y, r, r));
        if (N.random(seed, i, j, 5) < 0.03) accList.push([x, y, i, j]);
      }
    }
  }
  var gridId = C.shape(c.graph, c.cut, c.cut.id + ' / Dot grid', c.parent, cmds, { fill: H.layC(c.sc, k), alpha: 1 });
  V.animate(c, gridId, function (e, f) {
    var t = clk.absTime(f), q = clk.enter(f, 0.5);
    return { 'position.x': wrap(t * 0.15 * sp, sp) - sp, 'position.y': -(wrap(t * 0.08 * sp, sp) - sp), alpha: q };
  });
  accList.slice(0, 14).forEach(function (pt, idx) {
    var aid = C.shape(c.graph, c.cut, c.cut.id + ' / Dot accent ' + idx, c.parent,
      G.ellipse(pt[0], pt[1], r * 2, r * 2), { fill: H.tintC(c.sc, 0.55), alpha: 1 });
    V.animate(c, aid, function (e, f) {
      var t = clk.absTime(f), tw = Math.floor(t * 2), q = clk.enter(f, 0.5);
      var on = N.random(seed, pt[2], pt[3], tw) < 0.22;
      return { 'position.x': wrap(t * 0.15 * sp, sp) - sp, 'position.y': -(wrap(t * 0.08 * sp, sp) - sp), alpha: on ? q : 0 };
    });
  });
});

/* 12. retroGrid */
register('retroGrid', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'retroGrid');
  var hz = H.p(P, 'hz', 0.6), yh = Hh * hz, spd = H.p(P, 'spd', 0.6), k = H.p(P, 'k', 0.42);
  var col = H.tintC(c.sc, k);
  if (P.sun) {
    var R = U * 0.2, sy = yh - R * 0.35;
    var sunGroup = c.graph.add('null', c.cut.id + ' / Retro sun group', c.parent, c.cut.start, c.cut.end, {});
    var sunId = H.circle(c, 'Retro sun', W / 2, sy, R, R, { fill: H.tintC(c.sc, k * 0.45), alpha: 1 }, sunGroup);
    V.animate(c, sunId, function (e, f) {
      var q = clk.enter(f, 0.6);
      return { 'scale.x': Math.max(0.01, q), 'scale.y': Math.max(0.01, q), alpha: q };
    });
    for (var s = 0; s < 5; s++) {
      var yy = sy + R * (0.1 + s * 0.18), hh = R * 0.03 * (1 + s * 0.6);
      if (yy < yh) H.rect(c, 'Retro sun slice ' + s, W / 2 - R - 2, yy, R * 2 + 4, Math.min(hh, yh - yy), { fill: c.sc.bg, alpha: 1 }, sunGroup);
    }
  }
  /* horizon glow bands + horizon rule */
  for (var b = 0; b < 4; b++) {
    var bh = Hh * 0.025 * (4 - b);
    var hb = H.rect(c, 'Retro horizon glow ' + b, 0, yh - bh, W, bh, { fill: col, alpha: 0.08 });
    V.animate(c, hb, function (e, f) { return { alpha: 0.08 * clk.enter(f, 0.6) }; });
  }
  var hl = H.rect(c, 'Retro horizon line', 0, yh - 1, W, 2, { fill: col, alpha: 0.8 });
  V.animate(c, hl, function (e, f) { return { alpha: 0.8 * clk.enter(f, 0.6) }; });

  /* vertical perspective lines */
  var nV = 12, spB = W * 0.18, vCmds = [];
  for (var i = -nV; i <= nV; i++) {
    var x0 = W / 2 + i * spB * 0.06 - W / 2, x1 = W / 2 + i * spB * 1.6 - W / 2;
    vCmds.push(['M', x0, Hh / 2 - yh], ['L', x1, Hh / 2 - Hh * 1.3]);
  }
  var vGrid = C.shape(c.graph, c.cut, c.cut.id + ' / Retro radial lines', c.parent, vCmds,
    { stroke: col, width: Math.max(1.5, U * 0.0025), alpha: 0.75 });
  V.animate(c, vGrid, function (e, f) { return { alpha: 0.75 * clk.enter(f, 0.6) }; });

  /* scrolling horizontal perspective bars */
  var nH = 14, lw = Math.max(1.5, U * 0.0025);
  for (var j = 0; j < nH; j++) {
    (function (idx) {
      var bar = C.shape(c.graph, c.cut, c.cut.id + ' / Retro floor rule ' + idx, c.parent,
        G.rect(-W / 2, -lw / 2, W, lw), { fill: col, alpha: 1 });
      V.animate(c, bar, function (e, f) {
        var ph = wrap(clk.absTime(f) * spd, 1), q = clk.enter(f, 0.6);
        var z = idx + 1 - ph;
        if (z <= 0.25) return { 'position.y': Hh / 2 - yh, alpha: 0 };
        var y = yh + (Hh - yh) * 0.9 / z;
        var fy = cl((y - yh) / Math.max(1, Hh - yh));
        return { 'position.y': Hh / 2 - y, alpha: (y > Hh + 2 || y - yh < 1.5) ? 0 : cl(0.2 + 0.8 * fy) * q };
      });
    })(j);
  }
});

/* 13. bokehBg */
register('bokehBg', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'bokehBg');
  var seed = H.p(P, 'seed', 1), n = Math.min(18, Math.max(6, Math.round(H.p(P, 'n', 14)))), k = H.p(P, 'k', 0.2);
  var dk = H.dark(c.sc.bg), cols = [c.sc.accent, c.sc.accent2, c.sc.fg, c.sc.ghostA, c.sc.ghostB];
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var r = U * mix(0.035, 0.13, N.random(seed, idx, 1));
      var vx = (N.random(seed, idx, 2) * 2 - 1) * U * 0.03, vy = -U * mix(0.01, 0.04, N.random(seed, idx, 3));
      var x0 = N.random(seed, idx, 4) * W, y0 = N.random(seed, idx, 5) * Hh;
      var col = cols[idx % cols.length] || c.sc.fg;
      var aBase = k * (0.5 + 0.5 * N.random(seed, idx, 6)) * (dk ? 1 : 0.7);
      var wFreq = 0.6 + N.random(seed, idx, 7);
      var outer = C.shape(c.graph, c.cut, c.cut.id + ' / Bokeh outer ' + idx, c.parent,
        G.ellipse(0, 0, r, r), { fill: col, alpha: aBase * 0.55 });
      var rim = C.shape(c.graph, c.cut, c.cut.id + ' / Bokeh rim ' + idx, c.parent,
        G.ellipse(0, 0, r * 0.86, r * 0.86), { stroke: col, width: Math.max(2, r * 0.14), alpha: aBase * 0.65 });
      [outer, rim].forEach(function (id, part) {
        V.animate(c, id, function (e, f) {
          var t = clk.absTime(f), q = clk.enter(f, 0.8);
          var x = wrap(x0 + t * vx, W + 2 * r) - r + Math.sin(t * 0.4 + idx) * U * 0.015;
          var y = wrap(y0 + t * vy, Hh + 2 * r) - r;
          var pos = H.toScene(c, x, y);
          var tw = 0.75 + 0.25 * Math.sin(t * wFreq + idx);
          return { 'position.x': pos[0], 'position.y': pos[1], alpha: aBase * (part ? 0.65 : 0.45) * tw * q };
        });
      });
    })(i);
  }
});

/* 14. particlesBg */
register('particlesBg', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'particlesBg');
  var seed = H.p(P, 'seed', 1), k = H.p(P, 'k', 0.48), sq = !!P.sq;
  var n = Math.min(64, Math.max(20, Math.round(H.p(P, 'n', 60) * 0.65)));
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var v = Hh * mix(0.04, 0.14, N.random(seed, idx, 1));
      var y0 = N.random(seed, idx, 2) * Hh * 1.2;
      var xBase = N.random(seed, idx, 3) * W;
      var freq = mix(0.4, 1.2, N.random(seed, idx, 4));
      var sz = U * mix(0.0025, 0.008, N.random(seed, idx, 5));
      var aMax = k * (0.55 + 0.45 * N.random(seed, idx, 6));
      var col = N.random(seed, idx, 7) < 0.22 ? c.sc.accent : H.layC(c.sc, 0.6);
      var cmds = sq ? G.rect(-sz, -sz, sz * 2, sz * 2) : G.ellipse(0, 0, sz, sz);
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Particle ' + idx, c.parent, cmds, { fill: col, alpha: aMax });
      V.animate(c, id, function (e, f) {
        var t = clk.absTime(f), q = clk.enter(f, 0.6);
        var y = Hh + 10 - wrap(t * v + y0, Hh * 1.2);
        var x = xBase + Math.sin(t * freq + idx) * U * 0.02;
        var pos = H.toScene(c, x, y);
        return { 'position.x': pos[0], 'position.y': pos[1], alpha: aMax * q * cl(y / (Hh * 0.3)) };
      });
    })(i);
  }
});

/* 15. ripples */
register('ripples', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'ripples');
  var seed = H.p(P, 'seed', 1), life = H.p(P, 'life', 1.8), k = H.p(P, 'k', 0.26), per = 0.7;
  var tStart = clk.time(c.cut.start), tEnd = clk.time(c.cut.end);
  var i0 = Math.floor((tStart - life) / per), i1 = Math.ceil(tEnd / per);
  var rMax = U * 0.8;
  for (var idx = i0; idx <= i1; idx++) {
    (function (ri) {
      var x = P.centre ? W / 2 : W * mix(0.15, 0.85, N.random(seed, ri, 1));
      var y = P.centre ? Hh / 2 : Hh * mix(0.2, 0.8, N.random(seed, ri, 2));
      var pos = H.toScene(c, x, y);
      var outer = C.shape(c.graph, c.cut, c.cut.id + ' / Ripple outer ' + ri, c.parent,
        G.ellipse(0, 0, rMax, rMax), { stroke: c.sc.fg, width: Math.max(2, U * 0.005), alpha: k });
      var inner = C.shape(c.graph, c.cut, c.cut.id + ' / Ripple inner ' + ri, c.parent,
        G.ellipse(0, 0, rMax * 0.8, rMax * 0.8), { stroke: c.sc.fg, width: Math.max(1, U * 0.002), alpha: k * 0.5 });
      [outer, inner].forEach(function (id, part) {
        c.graph.byId[id].attrs.position = pos;
        V.animate(c, id, function (e, f) {
          var age = clk.time(f) - ri * per;
          if (age <= 0 || age >= life) return { 'scale.x': 0.05, 'scale.y': 0.05, alpha: 0 };
          var q = cl(age / life), r = U * (0.05 + 0.75 * E.outCubic(q));
          var sc = Math.max(0.02, r / rMax), a = k * Math.pow(1 - q, 1.4) * (part ? 0.5 : 1);
          return { 'scale.x': sc, 'scale.y': sc, alpha: a };
        });
      });
    })(idx);
  }
});

/* 16. polka */
register('polka', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'polka');
  var sp = Math.max(U * H.p(P, 'sp', 0.13), 24), r = sp * H.p(P, 'r', 0.25), rh = sp * 0.866;
  var k = H.p(P, 'k', 0.07), col = P.acc ? H.tintC(c.sc, k * 1.8) : H.layC(c.sc, k);
  var cmds = [], j = 0;
  for (var y = -rh * 2; y < Hh + rh * 2; y += rh, j++) {
    for (var x = -sp * 2 + (j & 1) * sp / 2; x < W + sp * 2; x += sp) {
      cmds = cmds.concat(G.ellipse(x - W / 2, Hh / 2 - y, r, r));
    }
  }
  var id = C.shape(c.graph, c.cut, c.cut.id + ' / Polka dots', c.parent, cmds, { fill: col, alpha: 1 });
  V.animate(c, id, function (e, f) {
    var t = clk.absTime(f), q = E.outBack(clk.time(f) / 0.45, 1.5);
    return {
      'position.x': wrap(t * sp * 0.25, sp) - sp,
      'position.y': -(wrap(t * sp * 0.15, rh * 2) - rh * 2),
      alpha: cl(q * 1.4)
    };
  });
});

/* 17. eqBars */
register('eqBars', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height;
  var clk = H.bgClock(c, 'eqBars');
  var seed = H.p(P, 'seed', 1), n = Math.min(40, Math.max(8, Math.round(H.p(P, 'n', 32)))), bw = W / n;
  var mode = P.mode || 'bottom', k = H.p(P, 'k', 0.11), main = H.layC(c.sc, k), cap = H.tintC(c.sc, 0.4);
  var maxH = Hh * 0.32;
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var sh = 0.55 + 0.45 * Math.sin(Math.PI * (idx + 0.5) / n);
      var xScene = idx * bw + bw * 0.19 - W / 2, barW = Math.max(2, bw * 0.62);
      function lvlAt(e, f) {
        var t = clk.absTime(f), q = clk.enter(f, 0.4);
        var en = e.energy != null ? e.energy : 0.45 + 0.2 * R.noise(t * 2, seed);
        var bt = Math.exp(-e.beat(0.5).since * 6);
        var nz = 0.5 + 0.5 * R.noise(t * 4 + idx * 1.7, seed + idx);
        return Math.max(0.02, cl(sh * (0.25 + 0.75 * en) * (0.55 + 0.45 * nz) + bt * 0.18 * nz) * q);
      }
      if (mode === 'center') {
        var cBar = C.shape(c.graph, c.cut, c.cut.id + ' / EQ center ' + idx, c.parent,
          G.rect(0, -maxH * 0.7, barW, maxH * 1.4), { fill: main, alpha: 1 });
        c.graph.byId[cBar].attrs.position = [xScene, 0];
        V.animate(c, cBar, function (e, f) { return { 'scale.y': lvlAt(e, f) }; });
      } else {
        var bBar = C.shape(c.graph, c.cut, c.cut.id + ' / EQ bar ' + idx, c.parent,
          G.rect(0, 0, barW, maxH), { fill: main, alpha: 1 });
        c.graph.byId[bBar].attrs.position = [xScene, -Hh / 2];
        V.animate(c, bBar, function (e, f) { return { 'scale.y': lvlAt(e, f) }; });
        var capId = C.shape(c.graph, c.cut, c.cut.id + ' / EQ cap ' + idx, c.parent,
          G.rect(0, 0, barW, Math.max(2, bw * 0.12)), { fill: cap, alpha: 1 });
        V.animate(c, capId, function (e, f) {
          var l = lvlAt(e, f);
          return { 'position.x': xScene, 'position.y': -Hh / 2 + maxH * l + bw * 0.18 };
        });
        if (mode === 'mirror') {
          var mBar = C.shape(c.graph, c.cut, c.cut.id + ' / EQ mirror ' + idx, c.parent,
            G.rect(0, -maxH * 0.7, barW, maxH * 0.7), { fill: main, alpha: 1 });
          c.graph.byId[mBar].attrs.position = [xScene, Hh / 2];
          V.animate(c, mBar, function (e, f) { return { 'scale.y': lvlAt(e, f) }; });
        }
      }
    })(i);
  }
});

/* 18. borderFrame */
register('borderFrame', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'borderFrame');
  var m = U * H.p(P, 'm', 0.04), th = Math.max(2, U * H.p(P, 'th', 0.016));
  var col = P.acc ? H.accCol(c.sc, c.sc.bg) : (c.sc.ink || c.sc.fg);
  var x0 = m + th / 2, y0 = m + th / 2, x1 = W - m - th / 2, y1 = Hh - m - th / 2;
  var bw = x1 - x0 + th, bh = y1 - y0 + th;
  var edges = [
    [x0 - th / 2, y0 - th / 2, bw, th, 0, 0],
    [x1 - th / 2, y0 - th / 2, th, bh, 0, 1],
    [x0 - th / 2, y1 - th / 2, bw, th, 1, 0],
    [x0 - th / 2, y0 - th / 2, th, bh, 1, 1]
  ];
  edges.forEach(function (ed, idx) {
    var seg = ed[5] === 0 ? [ed[0], ed[1], ed[2], ed[3]] : [ed[0], ed[1], ed[2], ed[3]];
    var id = C.shape(c.graph, c.cut, c.cut.id + ' / Border edge ' + idx, c.parent,
      ed[5] === 0 ? G.rect(ed[4] ? -seg[2] : 0, -seg[3] / 2, seg[2], seg[3]) : G.rect(-seg[2] / 2, ed[4] ? 0 : -seg[3], seg[2], seg[3]),
      { fill: col, alpha: 1 });
    var anchorX = ed[4] ? x1 + th / 2 : x0 - th / 2;
    var anchorY = ed[4] ? y1 + th / 2 : y0 - th / 2;
    if (ed[5] === 0) anchorY = ed[4] ? y1 : y0;
    else anchorX = ed[4] ? x0 : x1;
    c.graph.byId[id].attrs.position = H.toScene(c, anchorX, anchorY);
    V.animate(c, id, function (e, f) {
      var q = E.inOutCubic(clk.time(f) / 0.6);
      return ed[5] === 0 ? { 'scale.x': Math.max(0.005, q), alpha: q > 0.01 ? 1 : 0 }
        : { 'scale.y': Math.max(0.005, q), alpha: q > 0.01 ? 1 : 0 };
    });
  });
  if (P.dbl) {
    var m2 = m + th * 2.4, lw = Math.max(1, th * 0.18);
    var inner = H.rect(c, 'Border inner frame', m2, m2, W - m2 * 2, Hh - m2 * 2, { stroke: col, width: lw, alpha: 0.45 });
    V.animate(c, inner, function (e, f) { return { alpha: 0.45 * E.inOutCubic(clk.time(f) / 0.6) }; });
  }
});

/* 19. letterbox */
register('letterbox', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height;
  var clk = H.bgClock(c, 'letterbox');
  var dk = H.dark(c.sc.bg), k = W >= Hh ? H.p(P, 'k', 0.1) : 0.05;
  var bh = Math.max(4, Hh * k), fillCol = dk ? H.mixHex(c.sc.bg, '#000000', 0.85) : H.mixHex(c.sc.fg, '#000000', 0.3);
  var lineCol = dk ? H.layC(c.sc, 0.3) : H.tintC(c.sc, 0.6), lw = Math.max(1.2, Hh * 0.0015);
  var topBar = C.shape(c.graph, c.cut, c.cut.id + ' / Letterbox top', c.parent,
    G.rect(-W / 2, -bh, W, bh), { fill: fillCol, alpha: 1 });
  c.graph.byId[topBar].attrs.position = [0, Hh / 2];
  var botBar = C.shape(c.graph, c.cut, c.cut.id + ' / Letterbox bottom', c.parent,
    G.rect(-W / 2, 0, W, bh), { fill: fillCol, alpha: 1 });
  c.graph.byId[botBar].attrs.position = [0, -Hh / 2];
  [topBar, botBar].forEach(function (id) {
    V.animate(c, id, function (e, f) {
      var q = Math.max(0.01, E.outExpo(clk.time(f) / 0.55));
      return { 'scale.y': q, alpha: q > 0.02 ? 1 : 0 };
    });
  });
  if (P.line || dk) {
    var tLine = C.shape(c.graph, c.cut, c.cut.id + ' / Letterbox top rule', c.parent,
      G.rect(-W / 2, -lw / 2, W, lw), { fill: lineCol, alpha: 1 });
    var bLine = C.shape(c.graph, c.cut, c.cut.id + ' / Letterbox bottom rule', c.parent,
      G.rect(-W / 2, -lw / 2, W, lw), { fill: lineCol, alpha: 1 });
    V.animate(c, tLine, function (e, f) {
      var q = E.outExpo(clk.time(f) / 0.55);
      return { 'position.y': Hh / 2 - bh * q, alpha: q > 0.02 ? 1 : 0 };
    });
    V.animate(c, bLine, function (e, f) {
      var q = E.outExpo(clk.time(f) / 0.55);
      return { 'position.y': -Hh / 2 + bh * q, alpha: q > 0.02 ? 1 : 0 };
    });
  }
});

/* 20. noiseField */
register('noiseField', 'src/11p_looks.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'noiseField');
  var seed = H.p(P, 'seed', 1), n = Math.min(20, Math.max(10, Math.round(H.p(P, 'n', 16))));
  var cell = U / n, cols = Math.min(34, Math.ceil(W / cell)), rows = Math.min(24, Math.ceil(Hh / cell));
  var k = H.p(P, 'k', 0.07), th = H.p(P, 'th', 0.6);
  var dx = (W - cols * cell) / 2, dy = (Hh - rows * cell) / 2;
  for (var j = 0; j < rows; j++) {
    for (var i = 0; i < cols; i++) {
      if ((i + j) % 2 !== 0 && N.random(seed, i, j, 1) < 0.35) continue;
      (function (ci, cj) {
        var acc = N.random(seed, ci, cj, 2) < 0.03;
        var col = acc ? H.tintC(c.sc, 0.3) : H.layC(c.sc, k);
        var id = H.rect(c, 'Noise cell ' + ci + '_' + cj,
          dx + ci * cell, dy + cj * cell, Math.max(2, cell - 1), Math.max(2, cell - 1), { fill: col, alpha: 1 });
        V.animate(c, id, function (e, f) {
          var t = clk.absTime(f), q = clk.enter(f, 0.3), st = Math.floor(t * 8);
          var v = 0.5 + 0.5 * (R.noise(ci * 0.23 + t * 0.7, seed + cj * 31) * 0.6 +
            R.noise(cj * 0.29 - t * 0.5, seed + ci * 17 + 999) * 0.4) + (N.random(seed, ci, cj, st) - 0.5) * 0.12;
          if (v < th + (1 - q) * 0.4) return { alpha: 0 };
          var m = v > th + 0.2 ? 1.5 : v > th + 0.1 ? 1.0 : 0.6;
          return { alpha: cl(m) * q };
        });
      })(i, j);
    }
  }
});

/* 21. hrFailingLamp (src/11p_horror3.js) */
register('hrFailingLamp', 'src/11p_horror3.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'hrFailingLamp');
  var seed = H.p(P, 'seed', 1), xPos = H.p(P, 'x', 0.5), rate = H.p(P, 'rate', 1);
  var dk = H.dark(c.sc.bg), L = lightOf(c.sc), cx = W * xPos, cy = -U * 0.1, R = Math.hypot(W, Hh) * 0.9;
  radialRings(c, 'Lamp cone', cx, cy, R, [
    [0.25, L, dk ? 0.14 : 0.26], [0.5, L, dk ? 0.08 : 0.15], [0.85, L, dk ? 0.03 : 0.05]
  ], function (e, f, ba) {
    return { alpha: ba * lampLvl(clk.absTime(f), seed, rate) * clk.enter(f, 0.6) };
  });
  vignetteOverlay(c, 'Lamp vignette', nightC(c.sc), U * 0.32, Math.hypot(W, Hh) * 0.75, 0.75, clk);
  var tube = H.rect(c, 'Lamp tube', cx - U * 0.12, U * 0.012, U * 0.24, Math.max(2, U * 0.006),
    { fill: H.layC(c.sc, dk ? 0.35 : 0.15), alpha: 1 });
  V.animate(c, tube, function (e, f) {
    var lv = lampLvl(clk.absTime(f), seed, rate);
    return { alpha: (0.25 + 0.5 * lv) * clk.enter(f, 0.6) };
  });
});

/* 22. hrCorridor (src/11p_horror3.js) */
register('hrCorridor', 'src/11p_horror3.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'hrCorridor');
  var seed = H.p(P, 'seed', 1), vx = W * H.p(P, 'vx', 0.5), vy = Hh * H.p(P, 'vy', 0.5);
  var bw = W * 0.08, bh = Hh * 0.1, spd = H.p(P, 'spd', 0.35);
  var col = H.layC(c.sc, H.dark(c.sc.bg) ? 0.28 : 0.22), lw = Math.max(1.2, U * 0.0026), L = lightOf(c.sc);
  radialRings(c, 'Corridor end light', vx, vy, Math.max(bw, bh) * 3, [
    [0.35, L, H.dark(c.sc.bg) ? 0.22 : 0.3], [0.7, L, H.dark(c.sc.bg) ? 0.1 : 0.14]
  ], function (e, f, ba) {
    return { alpha: ba * lampLvl(clk.absTime(f), seed + 1, 1) * clk.enter(f, 0.6) };
  });
  var back = [[vx - bw, vy - bh], [vx + bw, vy - bh], [vx + bw, vy + bh], [vx - bw, vy + bh]];
  var corners = [[0, 0], [W, 0], [W, Hh], [0, Hh]];
  corners.forEach(function (pt, i) {
    var edge = H.line(c, 'Corridor corner ' + i, [pt, back[i]], col, lw, 1);
    V.animate(c, edge, function (e, f) { return { alpha: clk.enter(f, 0.6) }; });
  });
  var backRect = H.rect(c, 'Corridor back', vx - bw, vy - bh, bw * 2, bh * 2, { stroke: col, width: lw, alpha: 1 });
  V.animate(c, backRect, function (e, f) { return { alpha: clk.enter(f, 0.6) }; });
  var n = 7, vp = H.toScene(c, vx, vy);
  for (var k = 0; k < n; k++) {
    (function (idx) {
      var frameId = C.shape(c.graph, c.cut, c.cut.id + ' / Corridor frame ' + idx, c.parent,
        G.rect(-W / 2, -Hh / 2, W, Hh), { stroke: col, width: lw, alpha: 1 });
      V.animate(c, frameId, function (e, f) {
        var t = clk.time(f), fi = clk.enter(f, 0.6);
        var frac = wrap(idx / n + t * spd * 0.12, 1), z = Math.pow(frac, 2.2);
        var sx = mix(bw * 2 / W, 1, z), sy = mix(bh * 2 / Hh, 1, z);
        var cx = mix(vx, W / 2, z), cy = mix(vy, Hh / 2, z), pos = H.toScene(c, cx, cy);
        return { 'position.x': pos[0], 'position.y': pos[1], 'scale.x': sx, 'scale.y': sy, alpha: fi * cl(z * 1.4) };
      });
    })(k);
  }
  vignetteOverlay(c, 'Corridor vignette', nightC(c.sc), U * 0.24, Math.hypot(W, Hh) * 0.78, 0.55, clk);
});

/* 23. hrMold (src/11p_horror3.js) */
register('hrMold', 'src/11p_horror3.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'hrMold');
  var seed = H.p(P, 'seed', 1), n = Math.max(2, Math.round(H.p(P, 'n', 4))), k = H.p(P, 'k', 0.1);
  var dk = H.dark(c.sc.bg);
  var stain = dk ? H.mixHex(c.sc.bg, H.mixHex(c.sc.fg, c.sc.accent2 || c.sc.sub, 0.5), k)
    : H.mixHex(c.sc.bg, H.mixHex(c.sc.sub, '#000000', 0.3), k * 1.4);
  var rim = dk ? H.mixHex(c.sc.bg, c.sc.fg, k * 1.6) : H.mixHex(c.sc.bg, '#000000', k * 1.3);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var edge = Math.floor(N.random(seed, idx, 1) * 4), fr = N.random(seed, idx, 2);
      var cx = edge === 0 ? fr * W : edge === 1 ? W : edge === 2 ? fr * W : 0;
      var cy = edge === 0 ? 0 : edge === 1 ? fr * Hh : edge === 2 ? Hh : fr * Hh;
      var Rmax = U * mix(0.25, 0.5, N.random(seed, idx, 3));
      var growDur = mix(8, 14, N.random(seed, idx, 4));
      var m = 32, cmds = [];
      for (var j = 0; j < m; j++) {
        var a = j / m * TAU, r = Rmax * (0.7 + 0.45 * R.noise(j * 0.45, seed + idx));
        cmds.push([j ? 'L' : 'M', Math.cos(a) * r, -Math.sin(a) * r]);
      }
      cmds.push(['Z']);
      for (var sp = 0; sp < 10; sp++) {
        var sa = N.random(seed, idx, sp, 5) * TAU, sr = Rmax * mix(1.02, 1.24, N.random(seed, idx, sp, 6));
        var dr = U * mix(0.002, 0.008, N.random(seed, idx, sp, 7));
        cmds = cmds.concat(G.ellipse(Math.cos(sa) * sr, -Math.sin(sa) * sr, dr, dr));
      }
      var id = C.shape(c.graph, c.cut, c.cut.id + ' / Mold stain ' + idx, c.parent, cmds,
        { fill: stain, stroke: rim, width: Math.max(1, U * 0.003), alpha: 0.85 });
      c.graph.byId[id].attrs.position = H.toScene(c, cx, cy);
      V.animate(c, id, function (e, f) {
        var t = clk.time(f), sc = (0.35 + 0.65 * E.outCubic(t / growDur)) * clk.enter(f, 0.8);
        return { 'scale.x': Math.max(0.02, sc), 'scale.y': Math.max(0.02, sc), alpha: 0.85 * clk.enter(f, 0.8) };
      });
    })(i);
  }
});

/* 24. hrDeadTrees (src/11p_horror3.js) */
register('hrDeadTrees', 'src/11p_horror3.js', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, U = Math.min(W, Hh);
  var clk = H.bgClock(c, 'hrDeadTrees');
  var seed = H.p(P, 'seed', 1), nBase = Math.max(3, Math.round(H.p(P, 'n', 6))), fog = H.p(P, 'fog', 0.15);
  var dk = H.dark(c.sc.bg);
  var specs = [[0.07, 0.75, 0.8], [0.13, 1.0, 1.15]];
  specs.forEach(function (sp, l) {
    var col = dk ? H.layC(c.sc, sp[0] * 0.9) : H.mixHex(c.sc.bg, '#000000', sp[0] * 1.6);
    var n = nBase + l * 2;
    for (var i = 0; i < n; i++) {
      (function (ti) {
        var xBase = W * (ti + 0.5 + (N.random(seed, l, ti, 1) * 2 - 1) * 0.35) / n;
        var h = Hh * mix(0.7, 1.05, N.random(seed, l, ti, 2)) * sp[1];
        var treeRoot = c.graph.add('null', c.cut.id + ' / Tree ' + l + '_' + ti, c.parent, c.cut.start, c.cut.end,
          { position: H.toScene(c, xBase, Hh + 2) });
        V.animate(c, treeRoot, function (e, f) {
          return { rotation: -Math.sin(clk.absTime(f) * 0.4 + ti + l) * 1.2 };
        });
        function seg(x0, y0, an, len, d, idSeed) {
          var x1 = x0 + Math.cos(an) * len, y1 = y0 + Math.sin(an) * len;
          var lw = Math.max(1, U * 0.02 * sp[2] * Math.pow(0.55, d));
          var branchId = C.shape(c.graph, c.cut, c.cut.id + ' / Branch ' + l + '_' + ti + '_' + d + '_' + idSeed,
            treeRoot, [['M', x0, -y0], ['L', x1, -y1]], { stroke: col, width: lw, alpha: 1 });
          V.animate(c, branchId, function (e, f) { return { alpha: clk.enter(f, 0.8) }; });
          if (d >= 3) return;
          for (var b = 0; b < 2; b++) {
            var da = (b ? 1 : -1) * mix(0.25, 0.7, N.random(seed, idSeed, b, 3));
            var bl = len * mix(0.55, 0.78, N.random(seed, idSeed, b, 4));
            seg(x1, y1, an + da, bl, d + 1, idSeed * 2 + b + 1);
          }
        }
        seg(0, 0, -Math.PI / 2 + (N.random(seed, l, ti, 5) * 2 - 1) * 0.08, h * 0.42, 0, (l * 50 + ti) * 64 + 1);
      })(i);
    }
  });
  var fogCol = dk ? H.layC(c.sc, 0.5) : c.sc.bg;
  for (var fg = 0; fg < 6; fg++) {
    (function (idx) {
      var yTop = mix(Hh * 0.45, Hh, idx / 6), fh = Hh * 0.55 / 6 + 2;
      var a = fog * ((idx + 1) / 6) * 0.25;
      var bId = H.rect(c, 'Tree fog ' + idx, 0, yTop, W, fh, { fill: fogCol, alpha: Math.max(0.01, a) });
      V.animate(c, bId, function (e, f) { return { alpha: a * clk.enter(f, 0.8) }; });
    })(fg);
  }
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
