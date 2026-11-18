/* 95 native enter recipes (core + horror + kinetic + typo + wa).
 * Paired with p_enter_core.js, p_requested_motion.js, p_x2_enter.js, and p_enter_x2.js.
 */
(function (N, G, C, R, V, S, H) {
'use strict';

var E = R.E, cl = R.clamp, mix = R.mix, st = R.stagger, TAU = R.T, PI = Math.PI, DEG = PI / 180, rand = N.random;
var HIDE = { hide: true };

function oQuart(x) { return 1 - Math.pow(1 - cl(x), 4); }
function oQuint(x) { return 1 - Math.pow(1 - cl(x), 5); }
function ioCubic(x) { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function ioQuart(x) { x = cl(x); return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2; }
function ioSine(x) { return -(Math.cos(PI * cl(x)) - 1) / 2; }
function oQuad(x) { x = cl(x); return 1 - (1 - x) * (1 - x); }
function iQuad(x) { x = cl(x); return x * x; }
function spring1(t, k, f) { t = cl(t); return Math.exp(-k * t) * Math.cos(f * PI * t) * (1 - t * t * t); }
function kick(t, k, f) { return t <= 0 ? 0 : Math.exp(-k * t) * Math.sin(f * t); }
function bounceE(x) {
  x = cl(x);
  var n1 = 7.5625, d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) { x -= 1.5 / d1; return n1 * x * x + 0.75; }
  if (x < 2.5 / d1) { x -= 2.25 / d1; return n1 * x * x + 0.9375; }
  x -= 2.625 / d1; return n1 * x * x + 0.984375;
}
function outElastic(x) {
  x = cl(x);
  if (x <= 0 || x >= 1) return x;
  return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * TAU / 3) + 1;
}
function noise1(x, s) {
  var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return mix(rand(s, i, 1) * 2 - 1, rand(s, i + 1, 1) * 2 - 1, u);
}
function rot2(x, y, deg) {
  var r = deg * DEG, cs = Math.cos(r), sn = Math.sin(r);
  return [x * cs - y * sn, x * sn + y * cs];
}

function gx(g, node) { return (g.x + (g.vx || 0)) * (node.sx == null ? 1 : node.sx); }
function gy(g, node) { return g.y + (g.vy || 0); }
function lr(g, gs) { return gs.length > 1 ? g.i / (gs.length - 1) : 0; }
function seedOf(c) { return c.node.seed == null ? ((c.cut.source || {}).seed || 1) : c.node.seed; }
function nonSpace(gs) { return gs.filter(function (g) { return !/^[\s\u3000]$/.test(g.ch); }); }
function soloTotal(c, gs) {
  var total = Array.from(String((c.cut && c.cut.source && c.cut.source.text) || c.node.text || '').replace(/\s+/g, '')).length;
  return { total: Math.max(1, total), solo: gs.length <= 1 && total > 1, mi: c.node.mi || 0 };
}
function padBox(gs, pad) {
  var b = V.bounds(gs);
  return { x0: b.x0 - pad, y0: b.y0 - pad, x1: b.x1 + pad, y1: b.y1 + pad, cx: b.cx, cy: b.cy, w: b.w + 2 * pad, h: b.h + 2 * pad };
}
function inRange(c) {
  var start = Math.max(c.cut.start, c.cut.origin + (c.node.delayFrames || 0));
  var end = Math.min(c.cut.end, start + Math.max(1, c.cut.inFrames) + 1);
  return { start: start, end: end, ok: end > start };
}
function pinAt(c, frame) { return V.envelope(c, c.node, frame).pin; }

function applyState(s, o, c, g) {
  if (!o) return;
  if (o.hide) { s.a = 0; return; }
  s.dx += o.dx || 0; s.dy += o.dy || 0; s.rot += o.rot || 0;
  var sc = o.s == null ? 1 : o.s;
  s.sx *= sc * (o.sx == null ? 1 : o.sx); s.sy *= sc * (o.sy == null ? 1 : o.sy);
  s.a *= o.a == null ? 1 : o.a;
  if (o.clipPolygon) s.clipPolygon = o.clipPolygon;
  if (o.clipX || o.clipY) {
    var cx0 = o.clipX ? o.clipX[0] : -2, cx1 = o.clipX ? o.clipX[1] : 2;
    var cy0 = o.clipY ? o.clipY[0] : -2, cy1 = o.clipY ? o.clipY[1] : 2;
    var hw = Math.max(2, g.w), hh = Math.max(2, g.h);
    var p0x = g.x + (g.vx || 0) + cx0 * hw, p1x = g.x + (g.vx || 0) + cx1 * hw;
    var p0y = g.y + (g.vy || 0) + cy0 * hh, p1y = g.y + (g.vy || 0) + cy1 * hh;
    s.clipPolygon = V.polygon(p0x, p0y, p1x, p1y);
  }
  if (o.blur != null) s.blur = (s.blur || 0) + o.blur;
  if (o.ch != null) s.ch = o.ch;
  if (o.color) s.color = o.color;
}

function reg(key, source, factory, diffs) {
  N.register('enter', key, {
    source: source + ' / enter:' + key,
    scope: 'glyph',
    differences: diffs || [],
    build: function (c) {
      var fn = factory(c);
      return function (s, g, gs, frame) {
        var env = V.envelope(c, c.node, frame);
        var e = {
          W: c.comp.width, H: c.comp.height, size: c.node.size, seed: seedOf(c),
          vertical: !!c.node.vertical, M: R.env(c, frame).M, step: Math.floor(env.t * 24 + 1e-6),
          inDur: Math.max(0.05, c.cut.inFrames / c.comp.fps), frame: frame
        };
        applyState(s, fn(env.pin, g, gs, e), c, g);
      };
    }
  });
}

function localShape(c, loc, name, cmds, paint, rng, sampleFn) {
  if (!rng.ok) return null;
  var id = C.shape(c.graph, { start: rng.start, end: rng.end }, c.cut.id + ' / ' + c.node.id + ' / ' + name, loc, cmds, paint);
  if (sampleFn) C.sample(c.graph, id, rng.start, rng.end, function (f) { return sampleFn(pinAt(c, f), f); });
  return id;
}

function localText(c, loc, name, text, x, y, size, opts, rng, sampleFn) {
  if (!rng.ok) return null;
  var f = V.font(c, c.node);
  var id = c.graph.add('textShape', c.cut.id + ' / ' + c.node.id + ' / ' + name, loc, rng.start, rng.end, {
    text: String(text), font: { font: f.family, style: f.style }, fontSize: Math.max(4, size),
    autoWidth: true, autoHeight: true,
    horizontalAlignment: opts.align === 'left' ? 0 : (opts.align === 'right' ? 2 : 1),
    verticalAlignment: 1, position: [x, -y],
    fill: true, stroke: false, 'material.materialColor': opts.color || c.sc.sub || c.sc.fg, alpha: 1
  });
  if (sampleFn) C.sample(c.graph, id, rng.start, rng.end, function (fr) { return sampleFn(pinAt(c, fr), fr); });
  return id;
}

function clipHalfPoly(poly, evalFn) {
  var out = [];
  for (var i = 0; i < poly.length; i++) {
    var a = poly[i], b = poly[(i + 1) % poly.length];
    var da = evalFn(a), db = evalFn(b);
    if (da >= 0) out.push(a);
    if ((da >= 0) !== (db >= 0)) {
      var t = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

var SIGNS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&+=/*?@';
function pickSign(seed, a, b, st) {
  var h = Math.floor(rand(seed, a, b, st) * SIGNS.length) % SIGNS.length;
  return SIGNS.charAt(h);
}

/* ================================================================ Core (35) */

reg('blurStagger', 'ae/p_enter2.jsx', function (c) {
  var bl = Math.min(42, c.node.size * 0.14);
  return function (p, g, gs, e) {
    var q = st(p, lr(g, gs), 0.55);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    var v = E.outCubic(q);
    return { blur: bl * (1 - v), a: Math.pow(v, 0.6), s: mix(1.35, 1, v), dy: -(1 - v) * e.size * 0.16 };
  };
});

reg('slideWhole', 'ae/p_enter1.jsx', function (c) {
  var sd = seedOf(c), dir = rand(sd, 11, 5) < 0.5 ? -1 : 1;
  return function (p, g, gs, e) {
    var v = E.outBack(p, 1.7), n = gs.length <= 1 ? 1.3 : 3.2;
    var D = e.size * n * (0.7 + 0.6 * e.M) * (1 - v);
    var out = { a: cl(p * 4) };
    if (e.vertical) out.dy = dir * D; else out.dx = dir * D;
    return out;
  };
});

reg('outlineFill', 'ae/p_enter1.jsx', function (c) {
  var sw = Math.max(1.2, c.node.size * 0.028);
  (c.node._jzTwins = c.node._jzTwins || []).push({
    label: 'Outline', below: true,
    setup: function (graph, clone, src, g, gs) {
      clone.attrs.fill = false; clone.attrs.stroke = true;
      clone.attrs['stroke.strokeColor'] = c.node.color; clone.attrs['stroke.width'] = sw;
      clone.keys = {};
      C.sample(graph, clone.id, clone.start, clone.end, function (f) {
        var p = pinAt(c, f), q = st(p, lr(g, gs), 0.4), u = cl(q / 0.35), sc = mix(1.3, 1, oQuint(u));
        var a = (q > 0 && q < 0.9) ? cl(q * 5) * (1 - H.smoothstep(0.68, 0.9, q)) : 0;
        return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0), 'scale.x': sc, 'scale.y': sc, alpha: a };
      });
    }
  });
  return function (p, g, gs) {
    var q = st(p, lr(g, gs), 0.4);
    if (q <= 0.3) return HIDE;
    if (q >= 1) return null;
    if (g.r90) return { a: cl((q - 0.3) / 0.55) };
    var f = ioQuart((q - 0.3) / 0.55);
    return f >= 1 ? null : { clipY: [mix(0.66, -0.68, f), 0.72], clipX: [-2, 2] };
  };
});

reg('strokeDraw', 'ae/p_enter1.jsx', function (c) {
  var sw = Math.max(1, c.node.size * 0.032);
  (c.node._jzTwins = c.node._jzTwins || []).push({
    label: 'StrokeDraw', below: true,
    setup: function (graph, clone, src, g, gs) {
      clone.attrs.fill = false; clone.attrs.stroke = true;
      clone.attrs['stroke.strokeColor'] = c.node.color; clone.attrs['stroke.width'] = sw;
      clone.keys = {};
      C.sample(graph, clone.id, clone.start, clone.end, function (f) {
        var p = pinAt(c, f), a = (1 - H.smoothstep(0.55, 0.92, p)) * cl(p * 6);
        return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0), 'stroke.width': Math.max(0.5, sw * (1 - H.smoothstep(0.55, 0.86, p))), alpha: a };
      });
    }
  });
  return function (p) {
    var d = oQuad(cl(p / 0.86));
    return p >= 1 ? null : { clipX: [-0.8, mix(-0.8, 0.8, d)], clipY: [-1, 1], a: H.smoothstep(0.38, 0.9, p) };
  };
});

reg('checker', 'ae/p_enter2.jsx', function (c) {
  var rng = inRange(c), gs = V.glyphs(c, c.node), b = padBox(gs, c.node.size * 0.15);
  var cell = c.node.size * 0.34, sd = seedOf(c);
  while ((b.w / cell) * (b.h / cell) > 120) cell *= 1.25;
  var nx = Math.max(1, Math.ceil(b.w / cell)), ny = Math.max(1, Math.ceil(b.h / cell));
  var ox = b.cx - nx * cell / 2, oy = b.cy - ny * cell / 2;
  if (rng.ok) {
    var loc = V.local(c, c.node, 'Checker');
    for (var iy = 0; iy < ny; iy++) for (var ix = 0; ix < nx; ix++) {
      (function (xIdx, yIdx) {
        var d = ((xIdx + yIdx) & 1) * 0.25 + (nx > 1 ? xIdx / (nx - 1) : 0) * 0.3 + rand(sd, xIdx, yIdx, 7) * 0.08;
        var cx = ox + (xIdx + 0.5) * cell, cy = oy + (yIdx + 0.5) * cell;
        localShape(c, loc, 'Tile ' + xIdx + '_' + yIdx, G.rect(-cell / 2, -cell / 2, cell, cell),
          { fill: H.accCol(c.sc), alpha: 0.9 }, rng, function (p) {
            var u = cl((p - d) / 0.22);
            if (u <= 0 || u >= 0.75) return { alpha: 0 };
            var k = Math.max(0.01, (1 - E.inCubic(u / 0.75)) * Math.min(1, u * 6));
            return { 'position.x': cx, 'position.y': -cy, 'scale.x': k, 'scale.y': k, alpha: 0.9 };
          });
      })(ix, iy);
    }
  }
  return function (p, g) {
    var q = cl((p - ((g.i % 2) * 0.25 + (g.ci / Math.max(1, g.n)) * 0.3)) / 0.28);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    var hs = oQuart(q);
    return { s: mix(0.25, 1, hs), a: cl(q * 6) };
  };
});

reg('echoIn', 'ae/p_enter2.jsx', function (c) {
  var col = H.accCol(c.sc), sw = Math.max(1.4, c.node.size * 0.02);
  [1, 2, 3].forEach(function (m) {
    (c.node._jzTwins = c.node._jzTwins || []).push({
      label: 'EchoIn ' + m, below: true,
      setup: function (graph, clone, src, g, gs) {
        clone.attrs.fill = false; clone.attrs.stroke = true;
        clone.attrs['stroke.strokeColor'] = col; clone.attrs['stroke.width'] = sw;
        clone.keys = {};
        C.sample(graph, clone.id, clone.start, clone.end, function (f) {
          var q = st(pinAt(c, f), lr(g, gs), 0.35);
          if (q <= 0 || q >= 1) return { alpha: 0 };
          var k = 1 - oQuart(q), sc = 1 + m * 0.3 * k;
          return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0),
            'scale.x': sc, 'scale.y': sc, alpha: cl((0.95 - m * 0.2) * Math.min(1, k * 1.8) * cl(q * 6)) };
        });
      }
    });
  });
  return function (p, g, gs) {
    var q = st(p, lr(g, gs), 0.35);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    return { a: cl(q * 2.2), s: mix(0.88, 1, oQuart(q)) };
  };
});

reg('inkBleed', 'ae/p_enter2.jsx', function (c) {
  var bl = Math.min(36, c.node.size * 0.16);
  return function (p, g, gs, e) {
    var d = gs.length > 1 ? rand(e.seed, g.i, 91) * 0.45 : 0;
    var u = cl((p - d) / 0.55);
    if (u <= 0) return HIDE;
    if (u >= 1) return null;
    return { s: mix(0.5, 1, E.outBack(u, 1.1)), blur: bl * Math.pow(1 - E.outCubic(u), 1.3), a: cl(u * 3.2) };
  };
});

reg('magnet', 'ae/p_enter2.jsx', function () {
  return function (p, g, gs, e) {
    var d = gs.length > 1 ? rand(e.seed, g.i, 81) * 0.3 : 0, u = cl((p - d) / 0.7);
    if (u <= 0) return HIDE;
    if (u >= 1) return null;
    var ang = rand(e.seed, g.i, 82) * TAU, dist = e.size * (1.3 + 1.5 * rand(e.seed, g.i, 83)), rot0 = (rand(e.seed, g.i, 84) * 2 - 1) * 55;
    var f, a;
    if (u < 0.36) { f = 1 - 0.16 * E.outCubic(u / 0.36); a = 0.5 * cl(u * 8); }
    else if (u < 0.6) { var t = (u - 0.36) / 0.24; f = 0.84 * (1 - E.inCubic(t)); a = mix(0.5, 1, cl(t * 3)); }
    else { var t2 = (u - 0.6) / 0.4; f = -0.1 * Math.sin(t2 * TAU) * (1 - t2); a = 1; }
    var sc = 1 + 0.14 * Math.exp(-Math.pow((u - 0.6) / 0.05, 2));
    return { dx: Math.cos(ang) * dist * f, dy: Math.sin(ang) * dist * f, rot: rot0 * f, s: sc, a: a };
  };
});

reg('neonOn', 'ae/p_enter2.jsx', function (c) {
  var col = H.lum(c.node.color) > 0.35 ? c.node.color : H.accCol(c.sc);
  (c.node._jzTwins = c.node._jzTwins || []).push({
    label: 'NeonGlow', below: true,
    setup: function (graph, clone, src, g) {
      clone.attrs.fill = false; clone.attrs.stroke = true;
      clone.attrs['stroke.strokeColor'] = col; clone.attrs['stroke.width'] = Math.max(2, c.node.size * 0.08);
      clone.keys = {};
      C.sample(graph, clone.id, clone.start, clone.end, function (f) {
        var p = pinAt(c, f), glow = H.smoothstep(0.1, 0.4, p) * (1 - H.smoothstep(0.62, 0.92, p));
        return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0), alpha: cl(glow * 0.6) };
      });
    }
  });
  return function (p, g, gs, e) {
    var ig = 0.3 + 0.45 * rand(e.seed, g.i, 101);
    if (p >= ig + 0.12) return null;
    if (p < ig - 0.22) return { a: 0.1 * cl(p * 8) };
    var on = rand(e.seed, g.i, e.step, 102) < 0.25 + 0.75 * cl((p - ig + 0.22) / 0.34);
    return on ? null : { a: 0.1 };
  };
});

reg('brushReveal', 'ae/p_enterB2.jsx', function (c) {
  var gs = V.glyphs(c, c.node), spans = V.spans(gs, !!c.node.vertical), rng = inRange(c);
  var sz = c.node.size, tail = sz * 1.1, pad = sz * 0.2, K = 8, sd = seedOf(c), vert = !!c.node.vertical;
  if (rng.ok && spans.length) {
    var loc = V.local(c, c.node, 'Brush');
    spans.forEach(function (L, li) {
      var hv = sz * 0.66, th = hv * 2 / K;
      for (var k = 0; k < K; k++) {
        (function (kk) {
          var lag = tail * Math.pow(rand(sd, L.li, kk, 141), 1.6);
          var tipLen = sz * 0.32;
          localShape(c, loc, 'Bristle ' + li + '_' + kk,
            vert ? G.rect(-th / 2, -tipLen, th, tipLen) : G.rect(-tipLen, -th / 2, tipLen, th),
            { fill: H.accCol(c.sc), alpha: 0.9 }, rng, function (p) {
              var q = st(p, spans.length > 1 ? li / (spans.length - 1) : 0, spans.length > 1 ? 0.4 : 0);
              if (q <= 0 || q >= 0.96) return { alpha: 0 };
              var F = mix(L.a0 - pad, L.a1 + pad + tail, ioSine(q)), end = F - lag;
              if (end <= L.a0 - pad) return { alpha: 0 };
              var cv = L.c - hv + (kk + 0.5) * th, fade = 1 - H.smoothstep(0.65, 0.96, q);
              return vert ? { 'position.x': cv, 'position.y': -end, alpha: fade } : { 'position.x': end, 'position.y': -cv, alpha: fade };
            });
        })(k);
      }
    });
  }
  return function (p, g) {
    var li = Math.max(0, spans.findIndex(function (L) { return L.li === g.li; }));
    var L = spans[li] || { a0: g.x - g.w, a1: g.x + g.w };
    var q = st(p, spans.length > 1 ? li / (spans.length - 1) : 0, spans.length > 1 ? 0.4 : 0);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    var F = mix(L.a0 - pad, L.a1 + pad + tail, ioSine(q)) - tail * 0.35;
    var u = cl((F - ((vert ? g.y : g.x) - (vert ? g.h : g.w) / 2)) / Math.max(1, (vert ? g.h : g.w)));
    return u <= 0 ? HIDE : (u >= 1 ? null : (vert ? { clipY: [-0.7, mix(-0.7, 0.7, u)], clipX: [-1.5, 1.5] } : { clipX: [-0.7, mix(-0.7, 0.7, u)], clipY: [-1.5, 1.5] }));
  };
});

reg('bubbles', 'ae/p_enterB2.jsx', function (c) {
  var gs = V.glyphs(c, c.node), rng = inRange(c), tP = 0.68, sz = c.node.size, sd = seedOf(c);
  function stB(i, n, p) {
    var q = st(p, 0.5 * rand(sd, i, 221) + 0.5 * (n > 1 ? i / (n - 1) : 0), 0.45);
    var f = cl(q / tP), ph = rand(sd, i, 222) * TAU;
    return { q: q, dx: Math.sin(ph + f * 9) * sz * 0.1 * (1 - f), dy: sz * 1.7 * (1 - E.outCubic(f)) };
  }
  if (rng.ok) {
    var loc = V.local(c, c.node, 'Bubbles'), lw = Math.max(1.2, sz * 0.018);
    nonSpace(gs).forEach(function (g) {
      var r = Math.max(g.w, g.h) * 0.5;
      localShape(c, loc, 'Bubble ' + g.i, G.ellipse(0, 0, r, r), { stroke: H.accCol(c.sc), width: lw, alpha: 0.85 }, rng, function (p) {
        var S = stB(g.i, gs.length, p);
        if (S.q <= 0 || S.q >= 1) return { alpha: 0 };
        if (S.q < tP) return { 'position.x': g.x + (g.vx || 0) + S.dx, 'position.y': -g.y - (g.vy || 0) - S.dy, alpha: 0.85 * cl(S.q * 6) };
        var u = (S.q - tP) / (1 - tP);
        if (u >= 0.5) return { alpha: 0 };
        var sc = 1 + 0.6 * E.outCubic(u / 0.5);
        return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0), 'scale.x': sc, 'scale.y': sc, alpha: cl(1 - u / 0.5) };
      });
    });
  }
  return function (p, g, gs2) {
    var S = stB(g.i, gs2.length, p);
    if (S.q <= 0) return HIDE;
    if (S.q >= 1) return null;
    if (S.q < tP) return { dx: S.dx, dy: S.dy, s: 0.68, a: cl(S.q * 6) };
    return { s: mix(0.68, 1, E.outBack((S.q - tP) / (1 - tP), 2.6)) };
  };
});

reg('crumple', 'ae/p_enterB1.jsx', function () {
  return function (p, g, gs, e) {
    var q = st(p, lr(g, gs), 0.45);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    var k = E.outBack(q, 1.6);
    return { s: mix(0.35, 1, k), rot: (rand(e.seed, g.i, 92) * 2 - 1) * 120 * (1 - k), a: cl(q * 4) };
  };
});

reg('cylinder', 'ae/p_enterB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), b = V.bounds(gs), vert = !!c.node.vertical;
  var U0 = vert ? b.y0 : b.x0, U1 = vert ? b.y1 : b.x1, uc = (U0 + U1) / 2;
  var R0 = Math.max(c.node.size * 0.6, (U1 - U0) / 2) / 1.2, dir = rand(seedOf(c), 61, 5) < 0.5 ? -1 : 1;
  var bg = c.sc.bg, col = c.node.color;
  return function (p, g) {
    var phi = dir * (1 - oQuart(p)) * 2.4, flat = H.smoothstep(0.5, 1, p), A = cl(p * 6);
    var u = (vert ? g.y : g.x) - uc, th = u / R0 + phi, cu = Math.cos(th);
    if (cu <= 0.04 && flat < 0.5) return HIDE;
    var nu = mix(R0 * Math.sin(th), u, flat), k = mix(Math.max(0.04, cu), 1, flat);
    var o = { a: A * mix(cl(cu * 1.6), 1, flat), color: H.mixHex(col, bg, (1 - mix(cl(cu), 1, flat)) * 0.6) };
    if (vert) { o.dy = nu - u; o.sy = k; } else { o.dx = nu - u; o.sx = k; }
    return o;
  };
});

reg('dither', 'ae/p_enterB2.jsx', function () {
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  return function (p, g, gs, e) {
    var th = (BAYER[((g.li & 3) * 4) + (g.ci & 3)] + 0.5) / 16;
    var u = gs.length > 1 ? g.i / (gs.length - 1) : 0;
    var v = p * 1.35 - 0.3 * u;
    if (v <= th * 0.7) return HIDE;
    var f = cl((v - th * 0.7) / 0.35);
    return f >= 1 ? null : { s: mix(0.75, 1, f), a: f };
  };
});

reg('echoCount', 'ae/p_enterB2.jsx', function (c) {
  var col = H.accCol(c.sc), dir = rand(seedOf(c), 181, 5) < 0.5 ? -1 : 1, sz = c.node.size;
  [1, 2, 3].forEach(function (m) {
    (c.node._jzTwins = c.node._jzTwins || []).push({
      label: 'EchoCount ' + m, below: true,
      setup: function (graph, clone, src, g) {
        clone.attrs['material.materialColor'] = col; clone.keys = {};
        C.sample(graph, clone.id, clone.start, clone.end, function (f) {
          var p = pinAt(c, f), x4 = cl(p / 0.88) * 4, b = Math.min(3, Math.floor(x4)), n = p >= 0.88 ? 0 : 3 - b;
          if (m > n || p <= 0 || p >= 0.99) return { alpha: 0 };
          var a = 0.75 * Math.pow(0.72, m - 1);
          return { 'position.x': g.x + (g.vx || 0) + dir * sz * 0.16 * m, 'position.y': -g.y - (g.vy || 0) - sz * 0.11 * m, alpha: a };
        });
      }
    });
  });
  return function (p) {
    var x4 = cl(p / 0.88) * 4, b = Math.min(3, Math.floor(x4)), f = x4 - b;
    var punch = (p < 0.88 ? 0.14 * Math.exp(-f * 7) : 0.1 * Math.exp(-(p - 0.88) * 40) * (1 - H.smoothstep(0.9, 0.99, p)));
    return { s: 1 + punch, a: cl(p * 10) };
  };
});

reg('filmFeed', 'ae/p_enterB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), b = padBox(gs, c.node.size * 0.35), rng = inRange(c);
  var FH = b.h, sz = c.node.size;
  if (rng.ok) {
    var loc = V.local(c, c.node, 'FilmFeed');
    localShape(c, loc, 'Gate bar', G.rect(b.x0 - sz * 0.4, -sz * 0.06, b.w + sz * 0.8, sz * 0.12),
      { fill: H.mixHex(c.sc.bg, c.sc.fg, 0.18), alpha: 1 }, rng, function (p) {
        var e = E.outCubic(cl(p / 0.82)), off = ((FH * 2.35 * (1 - e)) % FH + FH) % FH;
        if (off < 0.5 || p >= 0.98) return { alpha: 0 };
        return { 'position.y': -(b.y0 + off), alpha: cl(p * 7) };
      });
  }
  return function (p, g, gs2, e) {
    var ev = E.outCubic(cl(p / 0.82)), off = ((FH * 2.35 * (1 - ev)) % FH + FH) % FH;
    var fl = 1 - H.smoothstep(0.55, 0.95, p);
    var a = cl(p * 7) * (1 - 0.45 * fl * rand(e.seed, e.step, 99));
    return { dx: (rand(e.seed, e.step, 98) * 2 - 1) * sz * 0.02 * fl, dy: off < 0.5 ? 0 : off, a: a,
      clipPolygon: V.polygon(b.x0 - sz * 2, b.y0, b.x1 + sz * 2, b.y1) };
  };
});

reg('glint', 'ae/p_enterB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), b = V.bounds(gs), vert = !!c.node.vertical, sz = c.node.size;
  var hot = (H.lum(c.node.color) > 0.7 || H.lum(c.sc.bg) > 0.5) ? H.accCol(c.sc) : '#FFFFFF';
  var U0 = vert ? b.y0 : b.x0, U1 = vert ? b.y1 : b.x1, kS = 0.45, bw = sz * 0.55, sl = kS * (vert ? b.w : b.h) / 2;
  (c.node._jzTwins = c.node._jzTwins || []).push({
    label: 'GlintHot',
    setup: function (graph, clone, src, g) {
      clone.attrs['material.materialColor'] = hot; clone.keys = {};
      C.sample(graph, clone.id, clone.start, clone.end, function (f) {
        var p = pinAt(c, f), B = mix(U0 - bw - sl, U1 + bw + sl, ioSine(cl(p / 0.9)));
        var u = vert ? gy(g, c.node) : gx(g, c.node);
        var a = (1 - Math.abs(u - B) / bw) * (1 - H.smoothstep(0.85, 1, p));
        return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0), alpha: cl(a) };
      });
    }
  });
  return function (p, g) {
    var B = mix(U0 - bw - sl, U1 + bw + sl, ioSine(cl(p / 0.9)));
    var u = vert ? gy(g, c.node) : gx(g, c.node);
    return u <= B ? { a: 1 } : { a: 0.2 * cl(p * 6) };
  };
});

reg('heatHaze', 'ae/p_enterB2.jsx', function () {
  return function (p, g, gs, e) {
    var amp = e.size * 0.36 * (1 - ioSine(p)), t = p * e.inDur;
    if (amp < 0.5) return { a: E.outCubic(cl(p * 2.4)) };
    var dx = amp * Math.sin(g.i * 0.9 + t * 17) * (0.55 + 0.45 * Math.sin(g.i * 0.37 + t * 6));
    return { dx: dx, a: E.outCubic(cl(p * 2.4)) };
  };
});

reg('inkDrop', 'ae/p_enterB2.jsx', function (c) {
  var rng = inRange(c), gs = V.glyphs(c, c.node), sd = seedOf(c), sz = c.node.size;
  if (rng.ok) {
    var loc = V.local(c, c.node, 'InkDrop');
    nonSpace(gs).forEach(function (g) {
      localShape(c, loc, 'Drop ' + g.i, G.ellipse(0, 0, sz * 0.08, sz * 0.08),
        { fill: H.accCol(c.sc), alpha: 1 }, rng, function (p) {
          var q = st(p, rand(sd, g.i, 151), 0.5);
          if (q <= 0 || q >= 0.4) return { alpha: 0 };
          var s = q < 0.12 ? E.outBack(q / 0.12, 2) : 1 + (q - 0.12) * 4;
          return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0), 'scale.x': Math.max(0.05, s), 'scale.y': Math.max(0.05, s),
            alpha: q < 0.12 ? 1 : cl(1 - (q - 0.12) / 0.28) };
        });
    });
  }
  return function (p, g, gs2, e) {
    var q = st(p, rand(e.seed, g.i, 151), 0.5);
    if (q <= 0.12) return HIDE;
    if (q >= 1) return null;
    var u = (q - 0.12) / 0.88, R0 = Math.max(g.w, g.h) * 0.72 * E.outCubic(u), pts = [];
    for (var k = 0; k < 16; k++) { var a = k / 16 * TAU; pts.push([g.x + (g.vx || 0) + Math.cos(a) * R0, g.y + (g.vy || 0) + Math.sin(a) * R0]); }
    return { clipPolygon: pts };
  };
});

reg('interlace', 'ae/p_enterB2.jsx', function (c) {
  var rng = inRange(c), gs = V.glyphs(c, c.node), b = padBox(gs, c.node.size * 0.25), sz = c.node.size;
  if (rng.ok) {
    var loc = V.local(c, c.node, 'Interlace'), m = sz * 0.3;
    localShape(c, loc, 'ScanBar', G.rect(b.x0 - m, -1, b.w + m * 2, Math.max(2, sz * 0.02)),
      { fill: H.accCol(c.sc), alpha: 0.9 }, rng, function (p) {
        var f = p < 0.5 ? cl(p / 0.52) : cl((p - 0.48) / 0.52);
        if (f <= 0 || f >= 1) return { alpha: 0 };
        return { 'position.y': -mix(b.y0, b.y1, f), alpha: cl(0.9 * (p < 0.5 ? 1 : 1 - H.smoothstep(0.85, 0.99, f))) };
      });
  }
  return function (p, g) {
    var f = (g.i % 2) ? cl((p - 0.48) / 0.52) : cl(p / 0.52);
    var u = b.h > 1 ? (g.y - b.y0) / b.h : 0;
    return u <= f + 0.05 ? { a: cl((f - u + 0.08) * 10) } : HIDE;
  };
});

reg('lightLeak', 'ae/p_enterB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), b = V.bounds(gs), vert = !!c.node.vertical, sz = c.node.size;
  var warm = H.accCol(c.sc), dk = H.dark(c.sc.bg), core = H.mixHex(warm, '#FFFFFF', dk ? 0.45 : 0.2), col = c.node.color;
  var U0 = vert ? b.y0 : b.x0, U1 = vert ? b.y1 : b.x1, span = Math.max(1, U1 - U0), bl = Math.min(20, sz * 0.06);
  var rng = inRange(c);
  if (rng.ok) {
    var loc = V.local(c, c.node, 'LightLeak'), r = Math.max(sz * 1.4, (vert ? b.w : b.h) * 0.9);
    localShape(c, loc, 'Orb', G.ellipse(0, 0, r, r), { fill: dk ? core : warm, alpha: 0.4 }, rng, function (p) {
      var a = cl(p * 6) * (1 - H.smoothstep(0.55, 0.95, p)), Hpos = mix(U0 - sz * 0.5, U1 + sz * 0.5, cl(p / 0.62));
      return { 'position.x': vert ? b.cx : Hpos, 'position.y': -(vert ? Hpos : b.cy), alpha: cl(a * (dk ? 0.45 : 0.3)) };
    });
  }
  return function (p, g) {
    var f = ((vert ? g.y : g.x) - U0) / span, q = cl((p - 0.55 * f) / 0.45);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    var heat = 1 - E.outCubic(q);
    return { a: cl(q * 4), color: H.mixHex(col, heat > 0.6 ? H.mixHex(warm, core, (heat - 0.6) / 0.4) : warm, Math.min(1, heat * 1.5)),
      s: 1 + 0.07 * heat, blur: bl * heat * heat };
  };
});

reg('liquidFill', 'ae/p_enterB2.jsx', function (c) {
  var gs = V.glyphs(c, c.node), b = padBox(gs, c.node.size * 0.3), sz = c.node.size;
  (c.node._jzTwins = c.node._jzTwins || []).push({
    label: 'LiquidOutline', below: true,
    setup: function (graph, clone, src, g) {
      clone.attrs.fill = false; clone.attrs.stroke = true;
      clone.attrs['stroke.strokeColor'] = c.node.color; clone.attrs['stroke.width'] = Math.max(1, sz * 0.014);
      clone.keys = {};
      C.sample(graph, clone.id, clone.start, clone.end, function (f) {
        var p = pinAt(c, f), a = 0.45 * cl(p * 6) * (1 - H.smoothstep(0.8, 1, p));
        return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0), alpha: a };
      });
    }
  });
  var rng = inRange(c);
  if (rng.ok) {
    var loc = V.local(c, c.node, 'LiquidLine');
    localShape(c, loc, 'Surface', G.rect(b.x0, -sz * 0.02, b.w, Math.max(2, sz * 0.03)),
      { fill: H.accCol(c.sc), alpha: 1 }, rng, function (p) {
        var e = ioSine(cl(p / 0.94)), oa = cl(p * 6) * (1 - H.smoothstep(0.8, 1, p));
        return { 'position.y': -mix(b.y1, b.y0, e), alpha: e > 0.02 ? oa : 0 };
      });
  }
  return function (p, g) {
    var e = ioSine(cl(p / 0.94)), lvl = mix(b.y1, b.y0, e);
    if (lvl >= g.y + g.h * 0.6) return HIDE;
    if (lvl <= g.y - g.h * 0.6) return null;
    return { clipPolygon: V.polygon(b.x0 - sz * 2, lvl, b.x1 + sz * 2, b.y1 + sz * 4) };
  };
});

reg('loadingBar', 'ae/p_enterB2.jsx', function (c) {
  var gs = V.glyphs(c, c.node), b = V.bounds(gs), vert = !!c.node.vertical, sz = c.node.size, sd = seedOf(c);
  var U0 = vert ? b.y0 : b.x0, U1 = vert ? b.y1 : b.x1, span = Math.max(1, U1 - U0);
  var keys = [[0.06, 0], [0.2, 0.16 + 0.08 * rand(sd, 1, 1)], [0.3, 0.24 + 0.08 * rand(sd, 2, 1)], [0.42, 0.52 + 0.1 * rand(sd, 3, 1)], [0.52, 0.6 + 0.08 * rand(sd, 4, 1)], [0.7, 1]];
  function prAt(p) {
    var pr = 0;
    for (var k = 1; k < keys.length; k++) if (p >= keys[k - 1][0]) pr = mix(keys[k - 1][1], keys[k][1], E.outCubic(cl((p - keys[k - 1][0]) / (keys[k][0] - keys[k - 1][0]))));
    return pr;
  }
  var rng = inRange(c);
  if (rng.ok) {
    var loc = V.local(c, c.node, 'LoadingBar'), th = Math.max(3, sz * 0.07), gap = sz * 0.24, L = Math.max(1, vert ? b.h : b.w);
    localShape(c, loc, 'Track', vert ? G.rect(b.x0 - gap - th, -b.y1, th, L) : G.rect(b.x0, -(b.y1 + gap + th), L, th),
      { fill: c.sc.sub || c.sc.fg, alpha: 0.3 }, rng, function (p) {
        return { alpha: 0.3 * cl(p / 0.08) * (1 - H.smoothstep(0.88, 1, p)) };
      });
    localShape(c, loc, 'Fill', vert ? G.rect(b.x0 - gap - th, -1, th, 1) : G.rect(0, -(b.y1 + gap + th), 1, th),
      { fill: H.accCol(c.sc), alpha: 1 }, rng, function (p) {
        var pr = prAt(p), out = H.smoothstep(0.74, 0.96, p), lo = L * out, hi = L * pr, w = Math.max(0.5, hi - lo);
        var a = cl(p / 0.08) * (1 - H.smoothstep(0.88, 1, p)) * (hi > lo ? 1 : 0);
        return vert ? { 'position.y': -(b.y0 + lo), 'scale.y': w, alpha: a } : { 'position.x': b.x0 + lo, 'scale.x': w, alpha: a };
      });
  }
  return function (p, g) {
    var f = ((vert ? g.y : g.x) - U0) / span, q = cl((prAt(p) - f) / 0.12 + 0.35);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    var v = E.outBack(q, 2);
    return vert ? { a: cl(q * 3), dx: -(1 - v) * sz * 0.25 } : { a: cl(q * 3), dy: (1 - v) * sz * 0.25 };
  };
});

reg('loupe', 'ae/p_enterB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), b = V.bounds(gs), vert = !!c.node.vertical, sz = c.node.size;
  var U0 = vert ? b.y0 : b.x0, U1 = vert ? b.y1 : b.x1, vc = vert ? b.cx : b.cy;
  var r = Math.max(sz * 0.95, (vert ? b.w : b.h) * 0.62);
  function LcAt(p) { return mix(U0 - r * 0.7, U1 + r * 1.4, ioSine(cl(p / 0.9))); }
  var rng = inRange(c);
  if (rng.ok) {
    var loc = V.local(c, c.node, 'Loupe'), lw = Math.max(2, sz * 0.05), col = H.accCol(c.sc);
    var hx = Math.cos(PI / 4) * r, hy = Math.sin(PI / 4) * r;
    localShape(c, loc, 'Rim', G.ellipse(0, 0, r, r), { stroke: col, width: lw, alpha: 1 }, rng, function (p) {
      var Lc = LcAt(p), a = cl(p * 8) * (1 - H.smoothstep(0.8, 0.97, p));
      return { 'position.x': vert ? vc : Lc, 'position.y': -(vert ? Lc : vc), alpha: a };
    });
    localShape(c, loc, 'Handle', V.commands([[hx, -hy], [hx + r * 0.55, -(hy + r * 0.55)]], false), { stroke: col, width: lw * 2, alpha: 1 }, rng, function (p) {
      var Lc = LcAt(p), a = cl(p * 8) * (1 - H.smoothstep(0.8, 0.97, p));
      return { 'position.x': vert ? vc : Lc, 'position.y': -(vert ? Lc : vc), alpha: a };
    });
  }
  return function (p, g) {
    var Lc = LcAt(p), u = vert ? g.y : g.x, v = vert ? g.x : g.y;
    var du = u - Lc, dv = v - vc, d = Math.hypot(du, dv) / r;
    if (d >= 1) return du > 0 ? { a: 0.14 * cl(p * 5) } : null;
    var m = 1 - d * d, o = { s: 1 + 0.6 * m, a: cl(p * 6) * (du > 0 ? mix(0.14 * cl(p * 5), 1, Math.min(1, m * 3)) : 1) };
    if (vert) { o.dy = du * 0.35 * m; o.dx = dv * 0.35 * m; } else { o.dx = du * 0.35 * m; o.dy = dv * 0.35 * m; }
    return o;
  };
});

reg('matrixRain', 'ae/p_enterB2.jsx', function (c) {
  var col = c.node.color, acc = H.accCol(c.sc), hot = H.mixHex(acc, '#FFFFFF', 0.4), sz = c.node.size;
  var land = 0.62, sd = seedOf(c);
  function stM(g, gs, p) {
    var key = 0.35 * rand(sd, g.i, 121) + 0.65 * (g.n > 1 ? 1 - g.ci / (g.n - 1) : 0);
    var q = st(p, key, 0.45), D = sz * (2.2 + rand(sd, g.i, 122));
    return { q: q, y: -D * (1 - E.outCubic(cl(q / land))) };
  }
  [1, 2, 3].forEach(function (k) {
    (c.node._jzTwins = c.node._jzTwins || []).push({
      label: 'MatrixTail ' + k, below: true,
      setup: function (graph, clone, src, g, gs) {
        clone.attrs['material.materialColor'] = acc; clone.keys = {};
        C.sample(graph, clone.id, clone.start, clone.end, function (f) {
          var p = pinAt(c, f), S = stM(g, gs, p);
          if (S.q <= 0 || S.q >= 1) return { alpha: 0 };
          var a = (1 - k / 4) * 0.75 * (1 - H.smoothstep(land * 0.9, 1, S.q)) * cl(S.q * 6);
          return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0) - S.y + k * g.h * 0.92, 'scale.x': 0.9, 'scale.y': 0.9, alpha: cl(a) };
        });
      }
    });
  });
  return function (p, g, gs, e) {
    var S = stM(g, gs, p);
    if (S.q <= 0) return HIDE;
    if (S.q >= 1) return null;
    if (S.q < land) return { dy: S.y, ch: pickSign(sd, g.i, 0, e.step), color: hot };
    return { color: H.mixHex(col, hot, 1 - E.outCubic((S.q - land) / (1 - land))) };
  };
});

reg('noteUnfold', 'ae/p_enterB1.jsx', function () {
  var T1 = [0.14, 0.52];
  return function (p, g, gs) {
    var q = st(p, lr(g, gs), 0.45);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    if (g.r90) return { a: cl(q * 2) };
    if (q < T1[1]) return { a: cl(q / T1[0]), s: mix(0.9, 1, E.outBack(cl(q / T1[0]), 2)), clipX: [-0.64, 0.004], clipY: [-0.66, 0.004] };
    return { clipX: [-0.7, 0.7], clipY: [-0.66, mix(0.004, 0.7, E.outCubic((q - T1[1]) / (1 - T1[1])))] };
  };
});

reg('odometer', 'ae/p_enterB2.jsx', function () {
  return function (p, g, gs, e) {
    var q = st(p, lr(g, gs), 0.45), Rn = 3 + (Math.floor(rand(e.seed, g.i, 111) * 100) % 3);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    if (g.r90) return { a: q };
    var s = Rn * (1 - E.outBack(q, 1.15)), f = s - Math.floor(s);
    var ch = s >= 0.5 ? pickSign(e.seed, g.i, Math.round(s), 112) : g.ch;
    return { dy: (f - 0.5 * (s >= 0.5 ? 0 : f)) * g.h * 0.65, ch: ch, a: 1 - 0.35 * Math.abs(f) };
  };
});

reg('overexpose', 'ae/p_enterB1.jsx', function (c) {
  var hot = '#FFFFFF', col = c.node.color;
  return function (p, g, gs, e) {
    var tF = 0.12, ex = p < tF ? 1 : 1 - ioSine(cl((p - tF) / (1 - tF)));
    return {
      a: p < tF ? E.outCubic(p / tF) : 1,
      color: H.mixHex(col, hot, ex * 0.96),
      blur: Math.min(14, e.size * 0.04) * ex * ex,
      s: 1 + 0.06 * ex
    };
  };
});

reg('rockSettle', 'ae/p_enterB1.jsx', function () {
  var tL = 0.3;
  return function (p, g, gs, e) {
    var q = st(p, lr(g, gs), 0.4);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    var hw = g.w / 2, hh = g.h / 2, th0 = (rand(e.seed, g.i, 45) < 0.5 ? -1 : 1) * (16 + 10 * rand(e.seed, g.i, 46));
    var th, dy = 0;
    if (q < tL) { var t = q / tL; th = th0; dy = -(1 - t * t) * hh * 4; }
    else { var t2 = (q - tL) / (1 - tL); th = th0 * Math.pow(1 - t2, 1.5) * Math.cos(PI * (1.4 * t2 + 1.9 * t2 * t2)); }
    var r = th * DEG, cs = Math.cos(r), sn = Math.sin(r), cx = th >= 0 ? hw : -hw, cy = hh;
    return { dx: cx - (cx * cs - cy * sn), dy: dy + cy - (cx * sn + cy * cs), rot: th, a: cl(q * 8) };
  };
});

reg('shadowFirst', 'ae/p_enterB2.jsx', function (c) {
  var sh = H.mixHex(c.sc.bg, H.dark(c.sc.bg) ? c.sc.fg : '#000000', 0.28), tL = 0.72, sz = c.node.size;
  (c.node._jzTwins = c.node._jzTwins || []).push({
    label: 'DropShadow', below: true,
    setup: function (graph, clone, src, g, gs) {
      clone.attrs['material.materialColor'] = sh; clone.keys = {};
      C.sample(graph, clone.id, clone.start, clone.end, function (f) {
        var q = st(pinAt(c, f), lr(g, gs), 0.45);
        if (q <= 0 || q >= tL + 0.05) return { alpha: 0 };
        var sc = mix(0.55, 1, iQuad(cl(q / tL)));
        return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0), 'scale.x': sc, 'scale.y': sc, alpha: cl(q * 5) * 0.85 };
      });
    }
  });
  return function (p, g, gs) {
    var q = st(p, lr(g, gs), 0.45);
    if (q <= 0.12) return HIDE;
    if (q >= 1) return null;
    if (q < tL) {
      var ev = iQuad((q - 0.12) / (tL - 0.12));
      return { s: mix(1.75, 1, ev), dx: -sz * 0.22 * (1 - ev), dy: -sz * 0.34 * (1 - ev), a: cl((q - 0.12) * 4) };
    }
    var u = (q - tL) / (1 - tL);
    return { s: 1 - 0.07 * Math.sin(PI * u) * (1 - u) };
  };
});

reg('stickerPeel', 'ae/p_enterB1.jsx', function () {
  return function (p, g, gs) {
    var u = st(p, lr(g, gs), 0.5);
    if (u <= 0) return HIDE;
    if (u >= 1) return null;
    var k = ioCubic(u), sc = mix(0.88, 1, k);
    return { clipX: [-0.7, mix(-0.7, 0.75, k)], clipY: [mix(0.7, -0.75, k), 0.75], s: sc, a: cl(u * 6) };
  };
});

reg('stopMotion', 'ae/p_enterB1.jsx', function () {
  var K = 5;
  return function (p, g, gs, e) {
    var q = st(p, rand(e.seed, g.i, 81) * 0.5 + lr(g, gs) * 0.5, 0.45);
    if (q <= 0) return HIDE;
    var k = Math.min(K - 1, Math.floor(q * K));
    if (k >= K - 1) return null;
    var f = 1 - E.outCubic(k / (K - 1)), ang = rand(e.seed, g.i, 82) * TAU, D = e.size * (0.7 + 0.5 * rand(e.seed, g.i, 83));
    return {
      dx: Math.cos(ang) * D * f + (rand(e.seed, g.i, k, 84) * 2 - 1) * e.size * 0.05,
      dy: Math.sin(ang) * D * f + (rand(e.seed, g.i, k, 85) * 2 - 1) * e.size * 0.05,
      rot: (rand(e.seed, g.i, k, 86) * 2 - 1) * 22 * f + (rand(e.seed, g.i, k, 87) * 2 - 1) * 6 * f,
      s: 1 + (rand(e.seed, g.i, k, 88) * 2 - 1) * 0.14 * f
    };
  };
});

reg('strokeOrder', 'ae/p_enterB2.jsx', function () {
  return function (p, g, gs, e) {
    var q = st(p, lr(g, gs), 0.6);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    return { a: ioSine(q), s: mix(1.15, 1, E.outCubic(q)), dy: -(1 - E.outCubic(q)) * e.size * 0.04 };
  };
});

reg('tokoroten', 'ae/p_enterB2.jsx', function (c) {
  var gs = V.glyphs(c, c.node), b = V.bounds(gs), vert = !!c.node.vertical, sz = c.node.size;
  var U0 = vert ? b.y0 : b.x0, U1 = vert ? b.y1 : b.x1, slit = U0 - sz * 0.12, L = U1 - U0 + sz * 0.3;
  var rng = inRange(c);
  if (rng.ok) {
    var loc = V.local(c, c.node, 'Tokoroten'), th = Math.max(3, sz * 0.07), ext = sz * 0.25;
    localShape(c, loc, 'Slit', vert ? G.rect(b.x0 - ext, -(slit), b.w + ext * 2, th) : G.rect(slit - th, -(b.y1 + ext), th, b.h + ext * 2),
      { fill: H.accCol(c.sc), alpha: 1 }, rng, function (p) {
        return { alpha: cl(p * 8) * (1 - H.smoothstep(0.85, 1, p)) };
      });
  }
  return function (p, g) {
    var off = -(1 - ioSine(cl(p / 0.9))) * L, rel = sz * 2, km = 0.18, cv = 1 - H.smoothstep(0.55, 1, p);
    var u = vert ? g.y : g.x, hu = (vert ? g.h : g.w) / 2, ev = u + off - slit;
    if (ev + hu < 0) return HIDE;
    if (off >= -0.5 && cv <= 0) return null;
    var k = Math.max(0.05, 1 - cv * (1 - (km + (1 - km) * cl(ev / rel))));
    var d = (function () { if (ev <= 0) return ev * (1 - cv * (1 - km)); var r = Math.min(ev, rel), k0 = 1 - cv * (1 - km); return k0 * r + (1 - k0) * r * r / (2 * rel) + Math.max(0, ev - rel); })();
    var du = slit + d - u, st2 = 1 + 0.3 * (1 - k);
    return vert ? { dy: du, sy: k, sx: st2 } : { dx: du, sx: k, sy: st2 };
  };
});

reg('tornJoin', 'ae/p_enterB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), b = V.bounds(gs), vert = !!c.node.vertical, sz = c.node.size, sd = seedOf(c);
  var D = sz * 2 + (vert ? b.h : b.w) * 0.25;
  var U = vert ? b.cy : b.cx, V0 = (vert ? b.x0 : b.y0) - sz * 0.15, V1 = (vert ? b.x1 : b.y1) + sz * 0.15;
  var far = (vert ? b.h : b.w) + sz * 6, seam = [];
  for (var j = 0; j <= 11; j++) seam.push([U + (rand(sd, j, 95) * 2 - 1) * sz * 0.1 + (j % 2 ? 1 : -1) * sz * 0.03, mix(V0, V1, j / 11)]);
  function halfPoly(side) {
    var pts = seam.map(function (q) { return vert ? [q[1], q[0]] : [q[0], q[1]]; });
    pts.push(vert ? [V1, U + side * far] : [U + side * far, V1]);
    pts.push(vert ? [V0, U + side * far] : [U + side * far, V0]);
    return pts;
  }
  (c.node._jzTwins = c.node._jzTwins || []).push({
    label: 'TornB', below: true,
    setup: function (graph, clone, src, g) {
      clone.keys = {};
      C.sample(graph, clone.id, clone.start, clone.end, function (f) {
        var p = pinAt(c, f), k = 1 - oQuart(p / 0.72);
        if (p >= 0.72) return { alpha: 0 };
        return { 'position.x': g.x + (g.vx || 0) + (vert ? 0 : D * k), 'position.y': -g.y - (g.vy || 0) - (vert ? D * k : 0),
          rotation: -5 * k, alpha: cl(p * 5) };
      });
      var poly = halfPoly(1), frames = [];
      for (var f = clone.start; f < clone.end; f++) frames.push(poly.map(function (pt) { return [pt[0] - g.x - (g.vx || 0), -(pt[1] - g.y - (g.vy || 0))]; }));
      V.clipDeformer(graph, clone.id, frames, false, 'Torn half B', c.options);
    }
  });
  var rng = inRange(c);
  if (rng.ok) {
    var loc = V.local(c, c.node, 'TornFibre'), fib = H.mixHex(c.sc.fg, c.sc.bg, 0.35), pts = seam.map(function (q) { return vert ? [q[1], q[0]] : [q[0], q[1]]; });
    localShape(c, loc, 'Seam', V.commands(pts, false), { stroke: fib, width: Math.max(1, sz * 0.018), alpha: 0.8 }, rng, function (p) {
      return { alpha: 0.8 * cl(p * 5) * (1 - H.smoothstep(0.7, 0.95, p)) };
    });
  }
  var polyA = halfPoly(-1);
  return function (p) {
    var k = 1 - oQuart(p / 0.72), hit = H.smoothstep(0.62, 0.72, p) * (1 - H.smoothstep(0.72, 1, p)), jolt = hit * sz * 0.035 * Math.sin(p * 90);
    if (k <= 1e-4) return { dx: vert ? jolt : 0, dy: vert ? 0 : jolt };
    return { dx: (vert ? jolt : -D * k), dy: (vert ? -D * k : jolt), rot: -5 * k, a: cl(p * 5), clipPolygon: polyA };
  };
});

/* ================================================================ Horror (16) */

reg('hrBlinkCreep', 'ae/p_horror3.jsx', function (c) {
  var gs = V.glyphs(c, c.node), stInfo = soloTotal(c, gs), sd = seedOf(c);
  var B = [0.26, 0.52, 0.78], bw = 0.05;
  return function (p, g, gs2, e) {
    for (var i = 0; i < B.length; i++) if (p >= B[i] && p < B[i] + bw) return HIDE;
    var stage = 0;
    for (var j = 0; j < B.length; j++) if (p >= B[j] + bw) stage++;
    var f = stage / B.length, r = 1 - f;
    if (r <= 0) return null;
    var ord = stInfo.solo ? cl(stInfo.mi / (stInfo.total - 1)) : lr(g, gs2);
    var k = Math.round(ord * 97), ang = rand(sd, k, 1) * TAU, dist = e.size * (0.9 + rand(sd, k, 2) * 1.1);
    return { dx: Math.cos(ang) * dist * r, dy: Math.sin(ang) * dist * r * 0.6, s: 1 - 0.45 * r, rot: (rand(sd, k, 3) * 2 - 1) * 25 * r, a: 0.3 + 0.7 * (1 - r) };
  };
});

reg('hrClawReveal', 'ae/p_horror3.jsx', function (c) {
  var gs = V.glyphs(c, c.node), b = padBox(gs, c.node.size * 0.3), sd = seedOf(c);
  var nClaw = 4, sp = b.w / nClaw, dir = rand(sd, 3, 1) < 0.5 ? -1 : 1;
  return function (p, g) {
    if (p > 0.97) return null;
    var k = cl(Math.floor(((g.x - b.x0) / Math.max(1, b.w)) * nClaw), 0, nClaw - 1);
    var q = cl((p - k * 0.08) / 0.7);
    if (q <= 0) return HIDE;
    var e = ioCubic(q), w = sp * (0.08 + 1.1 * e * e), reach = E.outCubic(cl(q * 3));
    var y = dir > 0 ? mix(b.y0, b.y1, reach) : mix(b.y1, b.y0, reach);
    return { clipPolygon: V.polygon(g.x - w / 2, Math.min(dir > 0 ? b.y0 : b.y1, y), g.x + w / 2, Math.max(dir > 0 ? b.y0 : b.y1, y)) };
  };
});

reg('hrJumpScare', 'ae/p_horror3.jsx', function () {
  var at = 0.62;
  return function (p, g, gs, e) {
    if (p < at) {
      var q = p / at;
      return { s: 0.42 + 0.08 * q, a: (0.1 + 0.12 * q) * (rand(e.seed, e.step, 3) < 0.15 ? 0.3 : 1),
        dx: (rand(e.seed, e.step, 1) * 2 - 1) * e.size * 0.02, dy: (rand(e.seed, e.step, 2) * 2 - 1) * e.size * 0.02 };
    }
    var k = 1 - E.outExpo((p - at) / (1 - at));
    return { s: 1 + 0.95 * k, dx: (rand(e.seed, e.step, 4) * 2 - 1) * e.size * 0.12 * k,
      dy: (rand(e.seed, e.step, 5) * 2 - 1) * e.size * 0.12 * k, rot: (rand(e.seed, e.step, 6) * 2 - 1) * 7 * k };
  };
});

reg('hrManifest', 'ae/p_horror3.jsx', function (c) {
  var stInfo = soloTotal(c, V.glyphs(c, c.node));
  return function (p, g, gs, e) {
    var fin = H.smoothstep(0.72, 1, p), idx = stInfo.solo ? stInfo.mi : g.i;
    var ph = rand(e.seed, idx, 1) * TAU, freq = 7 + rand(e.seed, idx, 2) * 6;
    var wav = cl(p * 1.3) * (0.45 + 0.55 * Math.max(0, Math.sin(p * freq + ph))), a = mix(wav, 1, fin);
    if (a >= 0.999) return null;
    return { a: a, dx: noise1(p * 4 + ph, idx * 31) * e.size * 0.12 * (1 - fin), dy: noise1(p * 3 + ph, idx * 31 + 1) * e.size * 0.08 * (1 - fin) };
  };
});

reg('hrMirrorSnap', 'ae/p_horror3.jsx', function (c) {
  var b = V.bounds(V.glyphs(c, c.node));
  return function (p, g, gs, e) {
    var s = -1;
    if (p >= 0.55 && p < 0.72) s = rand(e.seed, e.step, 7) < 0.5 ? -1 : 0.25;
    else if (p >= 0.72) s = mix(-0.2, 1, E.outBack((p - 0.72) / 0.28, 2.2));
    var scX = Math.abs(s) < 0.04 ? (s < 0 ? -0.04 : 0.04) : s;
    return { a: Math.min(1, p / 0.18), sx: scX, dx: (b.cx - g.x) * (1 - scX), rot: p < 0.55 ? Math.sin(p * 30) * 1.5 : 0 };
  };
});

reg('hrUneasy', 'ae/p_horror3.jsx', function (c) {
  var gs = V.glyphs(c, c.node), stInfo = soloTotal(c, gs), Np = stInfo.solo ? stInfo.total : Math.max(1, gs.length);
  var sd = seedOf(c), times = [], sum = 0;
  for (var i = 0; i < Np; i++) { var dt = 0.2 + rand(sd, i, 91) * 1.5; times.push(sum); sum += dt; }
  times = times.map(function (t) { return (t / Math.max(1, sum)) * 0.86; });
  return function (p, g, gs2, e) {
    var ix = Math.min(times.length - 1, stInfo.solo ? stInfo.mi : g.i), q = (p - times[ix]) / 0.1;
    if (q < 0) return HIDE;
    if (q >= 1) return null;
    return { dx: (rand(sd, ix, 1) * 2 - 1) * e.size * 0.18 * (1 - q), dy: (rand(sd, ix, 2) * 2 - 1) * e.size * 0.1 * (1 - q),
      rot: (rand(sd, ix, 3) * 2 - 1) * 18 * (1 - q), color: q < 0.5 ? c.sc.accent : null };
  };
});

reg('hrVhold', 'ae/p_horror3.jsx', function (c) {
  var gs = V.glyphs(c, c.node), b = padBox(gs, c.node.size * 0.25), Hh = Math.max(2, b.h), rng = inRange(c);
  if (rng.ok) {
    var loc = V.local(c, c.node, 'VHold'), bar = H.mixHex(c.sc.bg, '#000000', 0.6);
    localShape(c, loc, 'Bar', G.rect(b.x0, -Hh * 0.035, b.w, Math.max(2, Hh * 0.07)), { fill: bar, alpha: 0.85 }, rng, function (p) {
      var e = E.outCubic(p), m = (((1 - e) * 2.6 * Hh) % Hh + Hh) % Hh, fa = 1 - H.smoothstep(0.75, 1, p);
      return { 'position.y': -(b.y0 + m), alpha: m < 1 ? 0 : 0.85 * fa };
    });
  }
  return function (p, g, gs2, e) {
    var ev = E.outCubic(p), m = (((1 - ev) * 2.6 * Hh) % Hh + Hh) % Hh;
    return { dy: m, dx: (rand(e.seed, e.step, 1) * 2 - 1) * e.size * 0.05 * (1 - ev), a: Math.min(1, 0.4 + p * 2),
      clipPolygon: V.polygon(b.x0 - e.size, b.y0, b.x1 + e.size, b.y1) };
  };
});

reg('hzAlreadyThere', 'ae/p_x2_horrorB.jsx', function (c) {
  var c0 = c.node.color, dk = H.mixHex(c0, c.sc.bg, 0.78), stInfo = soloTotal(c, V.glyphs(c, c.node));
  return function (p, g, gs, e) {
    var idx = stInfo.solo ? stInfo.mi : g.i, t0 = rand(e.seed, idx, 1) * 0.5, len = 0.22 + rand(e.seed, idx, 2) * 0.28;
    var q = cl((p - t0) / len), lv = cl(ioSine(q) - Math.sin(q * PI) * 0.3 * rand(e.seed, idx, 3));
    if (lv >= 0.999) return null;
    return { a: mix(0.1, 1, lv) * Math.min(1, p / 0.1), color: H.mixHex(dk, c0, lv) };
  };
});

reg('hzFloorSeep', 'ae/p_x2_horrorB.jsx', function (c) {
  var c0 = c.node.color, dk = H.mixHex(c0, c.sc.bg, 0.6), stInfo = soloTotal(c, V.glyphs(c, c.node));
  return function (p, g, gs, e) {
    var idx = stInfo.solo ? stInfo.mi : g.i, t0 = rand(e.seed, idx, 1) * 0.38, len = 0.4 + rand(e.seed, idx, 2) * 0.22;
    var q = cl((p - t0) / len);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    var sv = 0.3 + rand(e.seed, idx, 3) * 0.2;
    var ev = q < 0.4 ? sv * E.outCubic(q / 0.4) : (q < 0.58 ? sv : mix(sv, 1, ioCubic((q - 0.58) / 0.42)));
    return { clipY: [0.7 - ev * 1.4, 0.75], dy: (1 - ev) * e.size * 0.16, color: ev < 0.98 ? H.mixHex(dk, c0, ev) : null };
  };
});

reg('hzFromScratch', 'ae/p_x2_horrorB.jsx', function (c) {
  var stInfo = soloTotal(c, V.glyphs(c, c.node));
  return function (p, g, gs, e) {
    var idx = stInfo.solo ? stInfo.mi : g.i, q = cl((p - rand(e.seed, idx, 1) * 0.45) / 0.52);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    var R0 = (rand(e.seed, idx, 2) < 0.5 ? -1 : 1) * (28 + rand(e.seed, idx, 3) * 30);
    if (q < 0.38) return { sx: 0.05, sy: mix(0.12, 1.35, E.outCubic(q / 0.38)), rot: R0 };
    var ev = ioCubic((q - 0.38) / 0.62);
    return { sx: mix(0.05, 1, ev), sy: mix(1.35, 1, ev), rot: R0 * (1 - ev) };
  };
});

reg('hzLampSweep', 'ae/p_x2_horrorB.jsx', function (c) {
  var dir = rand(seedOf(c), 281, 1) < 0.5, W = c.comp.width, xa = -0.14 * W, xb = 1.14 * W, bw = W * 0.13;
  return function (p, g) {
    var u = c.node.x + gx(g, c.node) + (c.node.y + gy(g, c.node) - c.comp.height / 2) * 0.3;
    var pos = dir ? W - u : u;
    if (p < 0.42) {
      var X1 = mix(xa, xb, p / 0.42), a1 = 1 - Math.abs(pos - X1) / bw;
      return a1 <= 0 ? HIDE : { a: 0.85 * oQuad(a1) };
    }
    if (p < 0.48) return HIDE;
    if (p < 0.94) {
      var X2 = mix(xa, xb, (p - 0.48) / 0.46), d = pos - X2;
      if (d <= 0) return null;
      var a2 = 1 - d / bw;
      return a2 <= 0 ? HIDE : { a: 0.85 * oQuad(a2) };
    }
    return null;
  };
});

reg('hzLateSnap', 'ae/p_x2_horrorB.jsx', function (c) {
  var stInfo = soloTotal(c, V.glyphs(c, c.node)), at = 0.86;
  return function (p, g, gs, e) {
    var u = Math.min(1, p / at), ev = p < at ? 0 : E.outExpo((p - at) / (1 - at)), w = 1 - ev, idx = stInfo.solo ? stInfo.mi : g.i;
    return {
      dx: (rand(e.seed, idx, 1) * 2 - 1) * e.size * 0.1 * w,
      dy: ((rand(e.seed, idx, 2) * 2 - 1) * e.size * 0.09 + (1 - u) * e.size * 0.55) * w,
      rot: (rand(e.seed, idx, 3) * 2 - 1) * 11 * w,
      a: mix(mix(0.12, 0.62, u) * Math.min(1, p / 0.1), 1, ev)
    };
  };
});

reg('hzShakyHand', 'ae/p_x2_horrorB.jsx', function (c) {
  var stInfo = soloTotal(c, V.glyphs(c, c.node)), sw = Math.max(0.8, c.node.size * 0.03);
  (c.node._jzTwins = c.node._jzTwins || []).push({
    label: 'ShakyStroke', below: true,
    setup: function (graph, clone, src, g) {
      clone.attrs.fill = false; clone.attrs.stroke = true;
      clone.attrs['stroke.strokeColor'] = c.node.color; clone.attrs['stroke.width'] = sw;
      clone.keys = {};
      C.sample(graph, clone.id, clone.start, clone.end, function (f) {
        var p = pinAt(c, f), idx = stInfo.solo ? stInfo.mi : g.i, tr = 1 - H.smoothstep(0.7, 1, p);
        return {
          'position.x': g.x + (g.vx || 0) + noise1(p * 38, idx * 17) * c.node.size * 0.028 * tr,
          'position.y': -g.y - (g.vy || 0) - noise1(p * 31 + 7, idx * 17 + 1) * c.node.size * 0.035 * tr,
          alpha: cl(p * 5) * (1 - H.smoothstep(0.82, 1, p))
        };
      });
    }
  });
  return function (p, g, gs, e) {
    var idx = stInfo.solo ? stInfo.mi : g.i, tr = 1 - H.smoothstep(0.7, 1, p), u = p / 0.8;
    var seg = Math.floor(u * 4), dash = u < 1 ? (seg + ioCubic(cl((u * 4 - seg) * 1.7))) / 4 : 1;
    return {
      dx: noise1(p * 38, idx * 17) * e.size * 0.028 * tr, dy: noise1(p * 31 + 7, idx * 17 + 1) * e.size * 0.035 * tr,
      rot: noise1(p * 17 + 3, idx * 17 + 2) * 3.5 * tr, a: H.smoothstep(0.55, 1, p),
      clipX: [-0.8, mix(-0.8, 0.8, cl(dash))], clipY: [-1, 1]
    };
  };
});

reg('hzTooClose', 'ae/p_x2_horrorB.jsx', function (c) {
  var b = V.bounds(V.glyphs(c, c.node)), lv = [1.12, 1.07, 1.03, 1], at = [0.5, 0.68, 0.86];
  return function (p, g) {
    var s = lv[0] + 0.015 * Math.min(1, p / 0.5);
    for (var k = 0; k < 3; k++) if (p >= at[k]) s = mix(k === 0 ? lv[0] + 0.015 : lv[k], lv[k + 1], E.outExpo(cl((p - at[k]) / 0.07)));
    return { s: s, dx: (g.x - b.cx) * (s - 1), dy: (g.y - b.cy) * (s - 1), a: Math.min(1, p / 0.06) };
  };
});

reg('hzUnwatched', 'ae/p_x2_horrorB.jsx', function (c) {
  var gs = V.glyphs(c, c.node), stInfo = soloTotal(c, gs), Np = stInfo.solo ? stInfo.total : Math.max(1, gs.length), sd = seedOf(c);
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  var hop = Math.max(1, Math.round(Np * 0.38)); while (gcd(hop, Np) !== 1) hop++;
  var start = Math.floor(rand(sd, 221, 1) * Np) % Np, slot = new Array(Np);
  for (var k = 0; k < Np; k++) slot[(start + k * hop) % Np] = k;
  var gap = 0.86 / Np;
  return function (p, g, gs2, e) {
    var ix = stInfo.solo ? stInfo.mi : g.i, q = p - (slot[ix % Np] || 0) * gap;
    if (q < 0) return HIDE;
    if (q >= gap) return null;
    return { a: 0.3, dy: e.size * 0.05 * (rand(sd, ix, 222) < 0.5 ? -1 : 1) };
  };
});

reg('hzWrongGlyph', 'ae/p_x2_horrorB.jsx', function (c) {
  var gs = V.glyphs(c, c.node), stInfo = soloTotal(c, gs), Np = stInfo.solo ? stInfo.total : Math.max(1, gs.length), sd = seedOf(c);
  var pick = Math.floor(rand(sd, 251, 1) * Np) % Np;
  return function (p, g, gs2, e) {
    var idx = stInfo.solo ? stInfo.mi : g.i, ord = Np > 1 ? idx / (Np - 1) : 0, a = H.smoothstep(0, 0.3, p - ord * 0.12);
    if (idx !== pick) return a >= 0.999 ? null : (a <= 0 ? HIDE : { a: a });
    if (a <= 0) return HIDE;
    if (p < 0.58) return { a: a, rot: 180, color: c.sc.accent };
    if (p < 0.7) return { rot: 180 + (rand(sd, e.step, 252) * 2 - 1) * 9, dx: (rand(sd, e.step, 253) * 2 - 1) * e.size * 0.03, color: c.sc.accent };
    var q = cl((p - 0.7) / 0.24);
    if (q >= 1) return null;
    return { rot: 180 * (1 - E.outBack(q, 1.5)), color: q < 0.5 ? c.sc.accent : null };
  };
});

/* ================================================================ Kinetic (19) */

function wordInfo(c, gs) {
  var wObj = H.wordsOf(c, gs);
  if (!wObj.words.length) {
    var bAll = V.bounds(gs);
    wObj = { words: [{ gs: gs, b: bAll, li: 0, index: 0 }], membership: Object.create(null) };
    gs.forEach(function (g) { wObj.membership[g.i] = 0; });
  }
  return wObj;
}

reg('knDiveIn', 'ae/p_kinetic3.jsx', function (c) {
  var gs = V.glyphs(c, c.node), wi = wordInfo(c, gs), n = wi.words.length, sp = n > 1 ? 0.55 : 0, B = V.bounds(gs);
  return function (p, g) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var q = st(p, n > 1 ? j / (n - 1) : 0, sp); if (q <= 0) return HIDE;
    var b = wi.words[j].b, e = E.outCubic(q), sc = mix(5.5, 1, e);
    return { s: sc, dx: (g.x - b.cx) * (sc - 1) + (b.cx - B.cx) * (sc - 1) * 0.6, dy: (g.y - b.cy) * (sc - 1), a: cl(q * 2.2) * mix(0.35, 1, e) };
  };
});

reg('knHingeDrop', 'ae/p_kinetic3.jsx', function (c) {
  var gs = V.glyphs(c, c.node), wi = wordInfo(c, gs), n = wi.words.length, sp = n > 1 ? 0.5 : 0;
  var dir = rand(seedOf(c), 61, 1) < 0.5 ? 1 : -1;
  return function (p, g) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var q = st(p, n > 1 ? j / (n - 1) : 0, sp); if (q <= 0) return HIDE;
    var b = wi.words[j].b, th = -88 * dir * (1 - bounceE(q)), px = dir > 0 ? b.x0 : b.x1, py = b.y1;
    var rv = rot2(g.x - px, g.y - py, th);
    return { dx: px + rv[0] - g.x, dy: py + rv[1] - g.y, rot: th, a: cl(q * 6) };
  };
});

reg('knInertia', 'ae/p_kinetic3.jsx', function (c) {
  var vert = !!c.node.vertical, dir = rand(seedOf(c), 67, 1) < 0.5 ? 1 : -1, D = (vert ? c.comp.height : c.comp.width) * 0.6;
  return function (p, g, gs) {
    var n = gs.length, back = n > 1 ? (dir > 0 ? (n - 1 - g.i) / (n - 1) : g.i / (n - 1)) : 0;
    var q = cl((p - back * 0.3) / 0.7), e = E.outBack(q, 2.1), v = (E.outBack(Math.min(1, q + 0.02), 2.1) - e) / 0.02;
    var off = -dir * D * (1 - e), stf = 1 + Math.min(0.5, Math.abs(v) * 0.08);
    var sq = q > 0.55 ? 1 - 0.18 * back * H.bell((q - 0.55) / 0.45) : 1;
    return vert ? { dy: off, sy: stf * sq, sx: 1 / stf } : { dx: off, sx: stf * sq, sy: 1 / stf };
  };
});

reg('knLoopIn', 'ae/p_kinetic3.jsx', function (c) {
  var vert = !!c.node.vertical, dir = rand(seedOf(c), 63, 1) < 0.5 ? 1 : -1;
  var D = Math.min(c.comp.width, c.comp.height) * 0.55, R0 = D / TAU * 1.5;
  return function (p, g, gs) {
    var k = gs.length > 1 ? (dir > 0 ? g.i / (gs.length - 1) : (gs.length - 1 - g.i) / (gs.length - 1)) : 0;
    var q = st(p, k, 0.5); if (q <= 0) return HIDE;
    var v = 1 - E.outCubic(q), ph = TAU * v;
    var a0 = v * D - R0 * Math.sin(ph), b0 = -R0 * (1 - Math.cos(ph));
    var ta = D - TAU * R0 * Math.cos(ph), tb = -TAU * R0 * Math.sin(ph);
    var ang = (Math.atan2(tb, ta * dir) / DEG) * Math.min(1, v * 4);
    return vert ? { dx: b0, dy: -a0 * dir, rot: ang, a: cl(q * 6) } : { dx: a0 * dir, dy: b0, rot: ang, a: cl(q * 6) };
  };
});

reg('knPushIn', 'ae/p_kinetic3.jsx', function (c) {
  var gs = V.glyphs(c, c.node), wi = wordInfo(c, gs), n = wi.words.length, vert = !!c.node.vertical;
  return function (p, g) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var f = p * n, k0 = Math.min(n - 1, Math.floor(f)), ev = E.outBack(cl((f - k0) / 0.75), 1.5);
    if (j > k0) return HIDE;
    var li = wi.words[j].li, rowWords = wi.words.filter(function (w) { return w.li === li; });
    var end = vert ? rowWords[rowWords.length - 1].b.y1 : rowWords[rowWords.length - 1].b.x1;
    var vis = rowWords.filter(function (w) { return w.index <= k0; });
    if (!vis.length) return null;
    var last = vis[vis.length - 1], prev = vis.length > 1 ? vis[vis.length - 2] : null;
    var v = end - (vert ? last.b.y1 : last.b.x1);
    if (last.index === k0) {
      v += prev ? ((end - (vert ? prev.b.y1 : prev.b.x1)) - v) * (1 - ev) : (end - (vert ? last.b.y0 : last.b.x0)) * 0.6 * (1 - ev);
    }
    var a = j === k0 ? cl(ev * 3) : 1;
    return vert ? { dy: v, a: a } : { dx: v, a: a };
  };
});

reg('knReplaceIn', 'ae/p_kinetic3.jsx', function (c) {
  var gs = V.glyphs(c, c.node), wi = wordInfo(c, gs), n = wi.words.length, T = n > 1 ? 0.7 : 0.2, B = V.bounds(gs);
  var bw = Math.max(1e-3, c.node.vertical ? B.h : B.w);
  return function (p, g) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var b = wi.words[j].b, ww = Math.max(1e-3, c.node.vertical ? b.h : b.w), big = Math.min(2.4, Math.max(1, bw / ww * 0.8));
    var w0 = j / n * T, w1 = (j + 1) / n * T, fly = E.outExpo(cl((p - T) / (1 - T)));
    var sc, cx, cy, a = 1;
    if (p < T) {
      if (p < w0 || p >= w1) return HIDE;
      var q = (p - w0) / Math.max(1e-4, w1 - w0);
      sc = big * (1 + 0.35 * Math.exp(-q * 9)); cx = B.cx; cy = B.cy; a = cl(q * 8);
    } else {
      var last = j === n - 1, s0 = last ? big : 0.3;
      sc = mix(s0, 1, fly); cx = mix(B.cx, b.cx, fly); cy = mix(B.cy, b.cy, fly); a = last ? 1 : cl(fly * 3);
    }
    return { s: sc, dx: cx + (g.x - b.cx) * sc - g.x, dy: cy + (g.y - b.cy) * sc - g.y, a: a };
  };
});

reg('knStretchOut', 'ae/p_kinetic3.jsx', function (c) {
  var gs = V.glyphs(c, c.node), wi = wordInfo(c, gs), n = wi.words.length, sp = n > 1 ? 0.55 : 0;
  return function (p, g) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var q = st(p, n > 1 ? j / (n - 1) : 0, sp); if (q <= 0) return HIDE;
    var b = wi.words[j].b, sc = q >= 1 ? 1 : Math.max(0.02, outElastic(q));
    return c.node.vertical ? { dy: (g.y - b.y0) * (sc - 1), sy: sc, a: cl(q * 8) } : { dx: (g.x - b.x0) * (sc - 1), sx: sc, a: cl(q * 8) };
  };
});

reg('knTypeToSlam', 'ae/p_kinetic3.jsx', function (c) {
  var gs = V.glyphs(c, c.node), wi = wordInfo(c, gs), n = wi.words.length, sp = n > 1 ? 0.55 : 0;
  return function (p, g) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var q = st(p, n > 1 ? j / (n - 1) : 0, sp); if (q <= 0) return HIDE;
    var w = wi.words[j], inW = w.gs.indexOf(g), cnt = Math.max(1, w.gs.length), tq = 0.55;
    if (q < tq && inW >= Math.floor(q / tq * cnt + 1e-6) + 1) return HIDE;
    var ev = q < tq ? 0 : E.outBack(cl((q - tq) / (1 - tq)), 2.2), sc = mix(0.42, 1, ev);
    var ax = c.node.vertical ? w.b.cx : w.b.x0, ay = c.node.vertical ? w.b.y0 : w.b.cy;
    return { s: sc, dx: (g.x - ax) * (sc - 1), dy: (g.y - ay) * (sc - 1), a: q < tq ? 0.85 : 1 };
  };
});

reg('knWordSlam', 'ae/p_kinetic3.jsx', function (c) {
  var gs = V.glyphs(c, c.node), wi = wordInfo(c, gs), n = wi.words.length, sp = n > 1 ? 0.62 : 0;
  return function (p, g, gs2, e) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var secs = e.inDur * (1 - sp), land = function (k) { return st(p, n > 1 ? k / (n - 1) : 0, sp); };
    var q = land(j); if (q <= 0) return HIDE;
    var b = wi.words[j].b, ev = E.outExpo(cl(q * 1.35)), sc = 1 + 2.1 * (1 - ev), dy = 0;
    for (var j2 = n - 1; j2 > j; j2--) { var q2 = land(j2); if (q2 >= 0.74) { dy = e.size * 0.09 * kick((q2 - 0.74) * secs, 11, 30); break; } }
    dy *= cl((1 - p) * 10);
    return { s: sc, dx: (g.x - b.cx) * (sc - 1), dy: (g.y - b.cy) * (sc - 1) + dy, a: cl(q * 7), rot: (1 - ev) * (j % 2 ? 7 : -7) };
  };
});

reg('knWordSpin', 'ae/p_kinetic3.jsx', function (c) {
  var gs = V.glyphs(c, c.node), wi = wordInfo(c, gs), n = wi.words.length, sp = n > 1 ? 0.5 : 0;
  return function (p, g) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var q = st(p, n > 1 ? j / (n - 1) : 0, sp); if (q <= 0) return HIDE;
    var b = wi.words[j].b, ev = E.outBack(q, 1.6), th = (1 - E.outCubic(q)) * 200 * (j % 2 ? -1 : 1), sc = mix(0.15, 1, ev);
    var rv = rot2((g.x - b.cx) * sc, (g.y - b.cy) * sc, th);
    return { dx: b.cx + rv[0] - g.x, dy: b.cy + rv[1] - g.y, rot: th, s: sc, a: cl(q * 5) };
  };
});

function rigidWord(g, b, o) {
  var px = o.px != null ? o.px : b.cx, py = o.py != null ? o.py : b.cy;
  var sc = o.s == null ? 1 : o.s, sx = sc * (o.sx == null ? 1 : o.sx), sy = sc * (o.sy == null ? 1 : o.sy);
  var rx = (g.x - px) * sx, ry = (g.y - py) * sy;
  if (o.rot) { var rv = rot2(rx, ry, o.rot); rx = rv[0]; ry = rv[1]; }
  return { dx: px + rx - g.x + (o.tx || 0), dy: py + ry - g.y + (o.ty || 0), rot: o.rot || 0, sx: sx, sy: sy, a: o.a == null ? 1 : o.a, color: o.color };
}

reg('kzSideVolley', 'ae/p_x2_kineticB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), wi = wordInfo(c, gs), n = wi.words.length, sp = n > 1 ? 0.6 : 0, vert = !!c.node.vertical;
  var d0 = rand(seedOf(c), 811, 1) < 0.5 ? -1 : 1, D = (vert ? c.comp.height : c.comp.width) * 0.62;
  return function (p, g, gs2, e) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var sgn = function (k) { return k % 2 ? -d0 : d0; }, secs = e.inDur * (1 - sp);
    var qs = []; for (var k = 0; k < n; k++) qs.push(st(p, n > 1 ? k / (n - 1) : 0, sp));
    if (qs[j] <= 0) return HIDE;
    var sh = 0;
    for (var j2 = j + 1; j2 < n; j2++) if (qs[j2] > 0.45) sh -= sgn(j2) * 0.14 * kick((qs[j2] - 0.45) * secs, 10, 30);
    var ev = E.outBack(cl(qs[j] * 1.3), 1.5), fast = Math.pow(1 - cl(qs[j] * 1.7), 2);
    var off = sgn(j) * D * (1 - ev) + sh * e.size * cl((1 - p) * 10), stf = 1 + 0.7 * fast, al = cl(qs[j] * 8);
    return rigidWord(g, wi.words[j].b, vert ? { ty: off, sy: stf, a: al } : { tx: off, sx: stf, a: al });
  };
});

reg('kzWordWheel', 'ae/p_x2_kineticB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), wi = wordInfo(c, gs), n = wi.words.length, sp = n > 1 ? 0.5 : 0, vert = !!c.node.vertical;
  return function (p, g) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var q = st(p, n > 1 ? j / (n - 1) : 0, sp); if (q <= 0) return HIDE;
    var b = wi.words[j].b, Rw = Math.max(20, Math.hypot(b.w, b.h) * 0.4);
    var d = TAU * Rw * (1 - E.outBack(q, 1.1)), ang = d / Rw / DEG, al = cl(q * 7);
    return rigidWord(g, b, vert ? { ty: d, rot: -ang, a: al } : { tx: d, rot: ang, a: al });
  };
});

reg('kzPunchThrough', 'ae/p_x2_kineticB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), wi = wordInfo(c, gs), n = wi.words.length, sp = n > 1 ? 0.55 : 0, T = 0.46;
  (c.node._jzTwins = c.node._jzTwins || []).push({
    label: 'PunchOutline', below: true,
    setup: function (graph, clone, src, g) {
      var j = wi.membership[g.i]; if (j == null) return;
      clone.attrs.fill = false; clone.attrs.stroke = true;
      clone.attrs['stroke.strokeColor'] = c.node.color; clone.attrs['stroke.width'] = Math.max(1.5, c.node.size * 0.03);
      clone.keys = {};
      C.sample(graph, clone.id, clone.start, clone.end, function (f) {
        var q = st(pinAt(c, f), n > 1 ? j / (n - 1) : 0, sp);
        if (q <= 0 || q >= T) return { alpha: 0 };
        var sc = mix(0.15, 1.6, E.outCubic(q / T)), b = wi.words[j].b;
        return { 'position.x': b.cx + (g.x - b.cx) * sc, 'position.y': -(b.cy + (g.y - b.cy) * sc), 'scale.x': sc, 'scale.y': sc, alpha: cl(q * 12) };
      });
    }
  });
  return function (p, g) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var q = st(p, n > 1 ? j / (n - 1) : 0, sp);
    if (q < T) return HIDE;
    var t = (q - T) / (1 - T);
    return rigidWord(g, wi.words[j].b, { s: 1 + 0.6 * spring1(t, 4.5, 3.4), color: t < 0.2 ? c.sc.accent : null });
  };
});

reg('kzTowerUnstack', 'ae/p_x2_kineticB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), wi = wordInfo(c, gs), n = wi.words.length, vert = !!c.node.vertical, B = V.bounds(gs);
  if (n < 2) return function (p) { return { dy: -(1 - bounceE(p)) * c.node.size * 1.5, a: cl(p * 7) }; };
  var lh = 0; wi.words.forEach(function (w) { lh = Math.max(lh, vert ? w.b.w : w.b.h); });
  lh *= 1.1;
  var fit = Math.min(1, (vert ? c.comp.width : c.comp.height) * 0.78 / Math.max(1, n * lh)), T = 0.5;
  return function (p, g) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var aIn = st(cl(p / T), n > 1 ? j / (n - 1) : 0, 0.72); if (aIn <= 0) return HIDE;
    var b = wi.words[j].b, off = (j - (n - 1) / 2) * lh * fit;
    var sx0 = vert ? B.cx - off : B.cx, sy0 = vert ? B.cy : B.cy + off;
    var ev = E.outBack(ioSine(st(cl((p - T) / (1 - T)), n > 1 ? j / (n - 1) : 0, 0.4)), 1.25), popV = E.outBack(aIn, 2.2);
    var sc = mix(fit * mix(0.55, 1, popV), 1, cl(ev));
    return rigidWord(g, b, { s: sc, rot: 4 * ev * (1 - ev) * (j % 2 ? 9 : -9), tx: (sx0 - b.cx) * (1 - ev), ty: (sy0 - b.cy) * (1 - ev), a: cl(aIn * 7) });
  };
});

reg('kzSkipStone', 'ae/p_x2_kineticB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), wi = wordInfo(c, gs), n = wi.words.length, sp = n > 1 ? 0.5 : 0;
  var sg = rand(seedOf(c), 815, 1) < 0.5 ? 1 : -1, D = Math.min(c.comp.width * 0.5, c.node.size * 5.5), H0 = c.node.size * 1.05;
  return function (p, g) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var q = st(p, n > 1 ? j / (n - 1) : 0, sp); if (q <= 0) return HIDE;
    var b = wi.words[j].b, u = 1 - Math.pow(1 - q, 1.7), ph = u * 3, fr = ph - Math.floor(ph);
    var h = Math.abs(Math.sin(PI * ph)) * H0 * Math.pow(1 - u, 1.1);
    var touch = Math.max(0, 1 - Math.min(fr, 1 - fr) * 7) * (1 - u);
    return rigidWord(g, b, { py: b.y1, tx: sg * D * (1 - u), ty: -h, sy: 1 - 0.32 * touch, sx: 1 + 0.2 * touch, rot: -sg * 7 * (1 - u) * (1 - touch), a: cl(q * 9) });
  };
});

reg('kzSeesaw', 'ae/p_x2_kineticB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), wi = wordInfo(c, gs), n = wi.words.length, vert = !!c.node.vertical, B = V.bounds(gs);
  var sp = n > 1 ? 0.45 : 0, fd = (1 - sp) * 0.34, half = Math.max(1, (vert ? B.h : B.w) / 2);
  var sideD = rand(seedOf(c), 817, 1) < 0.5 ? -1 : 1;
  return function (p, g, gs2, e) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var th = 0, stArr = [];
    for (var k = 0; k < n; k++) {
      var p0 = (n > 1 ? k / (n - 1) : 0) * sp; stArr.push(p0);
      var u = n > 1 ? (vert ? wi.words[k].b.cy - B.cy : wi.words[k].b.cx - B.cx) / half : 0.5 * sideD;
      th += 9 * u * kick((p - p0 - fd) * e.inDur, 6.5, 20);
    }
    th = cl(th, -13, 13) * cl((1 - p) * 8);
    if (p <= stArr[j]) return HIDE;
    var q = cl((p - stArr[j]) / fd), fall = (1 - q * q) * e.size * 2.4;
    return rigidWord(g, B, { px: B.cx, py: B.cy, rot: th, tx: vert ? fall : 0, ty: vert ? 0 : -fall, a: cl(q * 5) });
  };
});

reg('kzTrampoline', 'ae/p_x2_kineticB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), wi = wordInfo(c, gs), n = wi.words.length, vert = !!c.node.vertical;
  var sp = n > 1 ? 0.5 : 0, fd = (1 - sp) * 0.4;
  return function (p, g, gs2, e) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var p0 = (n > 1 ? j / (n - 1) : 0) * sp;
    if (p <= p0) return HIDE;
    var q = cl((p - p0) / fd), x = vert ? g.y : g.x, w = 0, A = e.size * 0.3 * cl((1 - p) * 9);
    for (var j2 = 0; j2 < n; j2++) {
      var pj = (n > 1 ? j2 / (n - 1) : 0) * sp, d = Math.abs((x - (vert ? wi.words[j2].b.cy : wi.words[j2].b.cx)) / Math.max(1, e.size));
      var t = (p - pj - fd) * e.inDur - d / 28;
      if (t > 0) w += Math.exp(-d * 0.28) * kick(t, 6, 19);
    }
    var fly = q < 0.55 ? mix(2.4, -0.75, oQuad(q / 0.55)) : -0.75 * (1 - Math.pow((q - 0.55) / 0.45, 2));
    var v = fly * e.size + A * w, al = cl(q * 5), st2 = 1 + 0.22 * (q < 1 ? Math.sin(PI * q) : 0);
    return vert ? { dx: -v, sx: st2, a: al } : { dy: v, sy: st2, a: al };
  };
});

reg('kzOverrun', 'ae/p_x2_kineticB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), wi = wordInfo(c, gs), n = wi.words.length, sp = n > 1 ? 0.48 : 0, vert = !!c.node.vertical;
  var D = (vert ? c.comp.height : c.comp.width) * 0.55, O = c.node.size * 0.95, T = 0.55;
  return function (p, g) {
    var j = wi.membership[g.i]; if (j == null) return null;
    var q = st(p, n > 1 ? j / (n - 1) : 0, sp); if (q <= 0) return HIDE;
    var a, lean, stf = 1;
    if (q < T) { var t = q / T; a = mix(D, -O, oQuad(t)); lean = mix(17, -21, t * t); stf = 1 + 0.4 * (1 - t) * (1 - t); }
    else { var t2 = (q - T) / (1 - T); a = -O * (1 - ioCubic(t2)); lean = -21 * (1 - t2) * (1 - t2) + 7 * Math.sin(PI * t2) * (1 - t2); }
    return rigidWord(g, wi.words[j].b, vert ? { ty: a, sy: stf, rot: -lean * 0.3, a: cl(q * 9) } : { tx: a, sx: stf, rot: lean * 0.35, a: cl(q * 9) });
  };
});

reg('kzBowSnap', 'ae/p_x2_kineticB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), B = V.bounds(gs), vert = !!c.node.vertical, half = Math.max(1, (vert ? B.h : B.w) / 2);
  var sg = rand(seedOf(c), 823, 1) < 0.5 ? -1 : 1, A0 = Math.min(c.node.size * 1.5, (vert ? c.comp.width : c.comp.height) * 0.2) * sg;
  return function (p, g) {
    var A = A0 * spring1((p - 0.14) / 0.86, 2.1, 3.2);
    var u = cl(((vert ? g.y - B.cy : g.x - B.cx)) / half, -1, 1), al = cl((p * 1.8 - Math.abs(u) * 0.22) * 8);
    if (al <= 0) return HIDE;
    var d = A * (1 - u * u), sl = Math.atan(2 * u * A / half) / DEG;
    return vert ? { dx: d, rot: sl, a: al } : { dy: -d, rot: sl, a: al };
  };
});

/* ================================================================ Typo (16) */

reg('tyBracketOpen', 'ae/p_typo3.jsx', function (c) {
  var gs = V.glyphs(c, c.node), b = V.bounds(gs), vert = !!c.node.vertical, sz = c.node.size, pad = sz * 0.12;
  var rng = inRange(c), stInfo = soloTotal(c, gs);
  if (rng.ok && !stInfo.solo) {
    var loc = V.local(c, c.node, 'Brackets'), lw = Math.max(2, sz * 0.04), arm = Math.min(sz * 0.35, (vert ? b.w : b.h) * 0.3), col = H.accCol(c.sc);
    [-1, 1].forEach(function (side) {
      var pts = vert
        ? [[-b.w / 2 - pad, -side * arm], [-b.w / 2 - pad, 0], [b.w / 2 + pad, 0], [b.w / 2 + pad, -side * arm]]
        : [[-side * arm, -b.h / 2 - pad], [0, -b.h / 2 - pad], [0, b.h / 2 + pad], [-side * arm, b.h / 2 + pad]];
      localShape(c, loc, 'Bracket ' + (side < 0 ? 'L' : 'R'), V.commands(pts, false), { stroke: col, width: lw, alpha: 1 }, rng, function (p) {
        var ev = ioCubic(cl((p - 0.08) / 0.62)), half = ((vert ? b.h : b.w) / 2 + pad) * ev;
        var a = cl(p / 0.08) * (1 - cl((p - 0.78) / 0.22));
        return vert ? { 'position.x': b.cx, 'position.y': -(b.cy + side * half), alpha: a } : { 'position.x': b.cx + side * half, 'position.y': -b.cy, alpha: a };
      });
    });
  }
  return function (p) {
    var ev = ioCubic(cl((p - 0.08) / 0.62)), half = ((vert ? b.h : b.w) / 2 + pad) * ev;
    return p >= 0.99 ? null : (vert ? { clipPolygon: V.polygon(b.x0 - sz, b.cy - half, b.x1 + sz, b.cy + half) }
      : { clipPolygon: V.polygon(b.cx - half, b.y0 - sz, b.cx + half, b.y1 + sz) });
  };
});

reg('tyDotGrow', 'ae/p_typo3.jsx', function (c) {
  var ac = H.accCol(c.sc);
  return function (p, g, gs) {
    var ord = lr(g, gs), q1 = cl((p - ord * 0.5) / 0.18), q2 = cl((p - ord * 0.5 - 0.2) / 0.3);
    if (q1 <= 0) return HIDE;
    if (q2 <= 0) return { ch: '\u30fb', s: 1.25 * E.outBack(q1, 2.6), color: ac };
    if (q2 >= 1) return null;
    return { s: mix(0.3, 1, E.outBack(q2, 1.8)), a: cl(q2 * 3) };
  };
});

reg('tyLineWipe', 'ae/p_typo3.jsx', function (c) {
  var gs = V.glyphs(c, c.node), spans = V.spans(gs, !!c.node.vertical), nL = Math.max(1, spans.length), stp = Math.min(0.28, 0.6 / nL);
  var vert = !!c.node.vertical, sz = c.node.size, rng = inRange(c);
  function qOf(li) { var k = Math.max(0, spans.findIndex(function (L) { return L.li === li; })); return ioCubic(cl((arguments[1] - k * stp) / (1 - (nL - 1) * stp))); }
  if (rng.ok) {
    var loc = V.local(c, c.node, 'LineWipe'), lw = Math.max(2, sz * 0.05), ac = H.accCol(c.sc);
    spans.forEach(function (L, k) {
      localShape(c, loc, 'Rule ' + k, vert ? G.rect(-lw / 2, 0, lw, 1) : G.rect(0, -lw / 2, 1, lw), { fill: ac, alpha: 1 }, rng, function (p) {
        var q = ioCubic(cl((p - k * stp) / (1 - (nL - 1) * stp)));
        if (q >= 1) return { alpha: 0 };
        var a = mix(L.a0, L.a1, E.inCubic(cl(q * 1.4 - 0.4))), b = mix(L.a0, L.a1, q), off = L.c + sz * 0.64;
        if (b - a < 1) return { alpha: 0 };
        return vert ? { 'position.x': off, 'position.y': -a, 'scale.y': b - a, alpha: 1 } : { 'position.x': a, 'position.y': -off, 'scale.x': b - a, alpha: 1 };
      });
    });
  }
  return function (p, g) {
    var L = spans.filter(function (x) { return x.li === g.li; })[0];
    if (!L) return null;
    var k = spans.indexOf(L), q = ioCubic(cl((p - k * stp) / (1 - (nL - 1) * stp)));
    if (q >= 1) return null;
    var edge = mix(L.a0, L.a1, q), start = vert ? g.y - g.h / 2 : g.x - g.w / 2, len = Math.max(1, vert ? g.h : g.w), f = (edge - start) / len;
    if (f <= 0) return HIDE;
    if (f >= 1) return null;
    return vert ? { clipY: [-0.7, -0.6 + 1.2 * f] } : { clipX: [-0.7, -0.6 + 1.2 * f] };
  };
});

reg('tyRetype', 'ae/p_typo3.jsx', function (c) {
  var gs = V.glyphs(c, c.node), plain = nonSpace(gs), Np = gs.length, sd = seedOf(c), ac = H.accCol(c.sc);
  var wi = plain.length >= 3 ? plain[1 + (Math.floor(rand(sd, 31, 1) * 100) % (plain.length - 1))].i : -1;
  var S = Np + (wi >= 0 ? 2 : 0), rng = inRange(c);
  function shownAt(p) {
    var k = Math.floor(cl(p) * (S + 0.999));
    if (wi < 0 || k <= wi) return { n: Math.min(Np, k), wrong: false };
    if (k === wi + 1) return { n: wi + 1, wrong: true };
    if (k === wi + 2) return { n: wi, wrong: false };
    return { n: Math.min(Np, k - 2), wrong: false };
  }
  if (rng.ok && plain.length && !c.node.vertical) {
    var loc = V.local(c, c.node, 'RetypeCursor'), lw = Math.max(2, c.node.size * 0.04);
    localShape(c, loc, 'Cursor', G.rect(0, -c.node.size * 0.55, lw, c.node.size * 1.1), { fill: ac, alpha: 1 }, rng, function (p) {
      var stR = shownAt(p);
      if (p >= 1 || stR.n <= 0) return { alpha: 0 };
      var gg = gs[Math.min(gs.length - 1, stR.n - 1)];
      return { 'position.x': gg.x + gg.w / 2 + lw, 'position.y': -gg.y, alpha: 1 };
    });
  }
  return function (p, g) {
    if (plain.length <= 1) return p < 0.35 ? HIDE : null;
    var stR = shownAt(p);
    if (g.i >= stR.n) return HIDE;
    if (stR.wrong && g.i === wi) return { ch: '?', color: ac };
    return null;
  };
});

reg('tyRubyDrop', 'ae/p_typo3.jsx', function (c) {
  var vert = !!c.node.vertical, sub = H.subCol(c.sc);
  return function (p, g, gs) {
    var q = cl((p - lr(g, gs) * 0.45) / 0.55);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    var off = vert ? g.w * 0.8 : -g.h * 0.8;
    if (q < 0.4) return vert ? { dx: off, s: 0.32, a: cl(q / 0.4 * 1.6), color: sub } : { dy: off, s: 0.32, a: cl(q / 0.4 * 1.6), color: sub };
    var ev = E.outCubic((q - 0.4) / 0.6), o = { s: mix(0.32, 1, ev) };
    if (vert) o.dx = off * (1 - ev); else o.dy = off * (1 - ev);
    if (ev < 0.55) o.color = sub;
    return o;
  };
});

reg('tyUnderLift', 'ae/p_typo3.jsx', function (c) {
  var gs = V.glyphs(c, c.node), spans = V.spans(gs, !!c.node.vertical), vert = !!c.node.vertical, sz = c.node.size;
  var multi = nonSpace(gs).length > 1, rng = inRange(c);
  if (rng.ok) {
    var loc = V.local(c, c.node, 'UnderLift'), lw = Math.max(2.5, sz * 0.055), ac = H.accCol(c.sc);
    spans.forEach(function (L, k) {
      localShape(c, loc, 'Line ' + k, vert ? G.rect(-lw / 2, -1, lw, 1) : G.rect(0, -lw / 2, 1, lw), { fill: ac, alpha: 1 }, rng, function (p) {
        var qb = E.outExpo(cl(p / 0.32)), qr = E.inCubic(cl((p - 0.72) / 0.28)), a = mix(L.a0, L.a1, qr), b = mix(L.a0, L.a1, qb);
        if (b - a < 1) return { alpha: 0 };
        var off = vert ? L.c - sz * 0.56 : L.c + sz * 0.56;
        return vert ? { 'position.x': off, 'position.y': -a, 'scale.y': b - a, alpha: 1 } : { 'position.x': a, 'position.y': -off, 'scale.x': b - a, alpha: 1 };
      });
    });
  }
  return function (p, g, gs2) {
    var q = cl((p - 0.22 - (multi ? lr(g, gs2) : 0) * 0.38) / 0.4);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    var ev = Math.max(0.02, E.outBack(q, 1.5));
    return vert ? { sx: ev, dx: -(1 - ev) * g.w * 0.45 } : { sy: ev, dy: (1 - ev) * g.h * 0.45 };
  };
});

reg('tyZoomOne', 'ae/p_typo3.jsx', function (c) {
  var gs = V.glyphs(c, c.node), plain = nonSpace(gs), nn = plain.length;
  var b = V.bounds(plain.length ? plain : gs), big = cl(Math.min(c.comp.width, c.comp.height) * 0.5 / Math.max(1, c.node.size), 1.15, 2.6);
  var L = nn > 1 ? Math.min(0.55, 2.2 / (nn + 1)) : 1, solo = soloTotal(c, gs).solo;
  return function (p, g) {
    var k = plain.indexOf(g); if (k < 0) return null;
    var s0 = nn > 1 ? k / (nn - 1) * (1 - L) : 0, q = cl((p - s0) / L);
    if (q <= 0) return HIDE;
    if (solo) return { s: mix(big, 1, E.outExpo(q)), a: cl(q * 5) };
    var cx = b.cx - g.x, cy = b.cy - g.y;
    if (q < 0.38) return { dx: cx, dy: cy, s: mix(big * 1.25, big, E.outCubic(q / 0.38)), a: cl(q / 0.1) };
    var ev = ioCubic((q - 0.38) / 0.62);
    return { dx: cx * (1 - ev), dy: cy * (1 - ev), s: mix(big, 1, ev) };
  };
});

reg('tzCaretSet', 'ae/p_x2_typoB.jsx', function (c) {
  var gs = V.glyphs(c, c.node), plain = nonSpace(gs), nn = plain.length, vert = !!c.node.vertical, sz = c.node.size;
  var rng = inRange(c), stInfo = soloTotal(c, gs), ac = H.accCol(c.sc);
  if (rng.ok && nn && !stInfo.solo) {
    var loc = V.local(c, c.node, 'Caret'), lw = Math.max(2, sz * 0.03);
    localShape(c, loc, 'Bar', vert ? G.rect(-sz * 0.56, -lw / 2, sz * 1.12, lw) : G.rect(-lw / 2, -sz * 0.56, lw, sz * 1.12),
      { fill: ac, alpha: 1 }, rng, function (p) {
        if (p >= 1) return { alpha: 0 };
        var k = cl(p) * (nn + 1.2), shown = Math.min(nn, Math.floor(k));
        var g = shown > 0 ? plain[shown - 1] : plain[0], sgn = shown > 0 ? 1 : -1;
        var ca = (vert ? g.y : g.x) + sgn * ((vert ? g.h : g.w) / 2 + sz * 0.07), cv = vert ? g.x : g.y;
        return vert ? { 'position.x': cv, 'position.y': -ca, alpha: 1 } : { 'position.x': ca, 'position.y': -cv, alpha: 1 };
      });
  }
  return function (p, g) {
    var r = plain.indexOf(g); if (r < 0) return null;
    if (stInfo.solo) { var qs = (p - lr(g, gs) * 0.6) / 0.4; return qs <= 0 ? HIDE : (qs < 0.45 ? { color: ac } : null); }
    var k = cl(p) * (nn + 1.2), shown = Math.min(nn, Math.floor(k));
    if (r >= shown) return HIDE;
    return (r === shown - 1 && k < r + 1.6) ? { color: ac } : null;
  };
});

reg('tzRuleSlide', 'ae/p_x2_typoB.jsx', function (c) {
  var gs = V.glyphs(c, c.node), spans = V.spans(gs, !!c.node.vertical), vert = !!c.node.vertical, sz = c.node.size;
  var dir = rand(seedOf(c), 61, 1) < 0.5 ? 1 : -1, dist = Math.min((vert ? c.comp.height : c.comp.width) * 0.3, sz * 4);
  var rng = inRange(c), ac = H.accCol(c.sc);
  if (rng.ok && !soloTotal(c, gs).solo) {
    var loc = V.local(c, c.node, 'RuleSlide'), lw = Math.max(1.5, sz * 0.022), pad = sz * 0.14;
    spans.slice(0, 6).forEach(function (L, idx) {
      var tick = dir > 0 ? L.a1 + pad : L.a0 - pad, far = tick - dir * ((L.a1 - L.a0) + pad * 2 + dist * 0.6);
      var off = L.c + sz * 0.6;
      localShape(c, loc, 'Rule ' + idx, vert ? G.rect(-lw / 2, 0, lw, 1) : G.rect(0, -lw / 2, 1, lw), { fill: ac, alpha: 1 }, rng, function (p) {
        var qb = E.outExpo(cl(p / 0.3)), qr = E.inCubic(cl((p - 0.76) / 0.24));
        var a = mix(far, tick, qr), b = mix(far, tick, qb), len = Math.abs(b - a);
        if (len <= 1) return { alpha: 0 };
        var lo = Math.min(a, b);
        return vert ? { 'position.x': off, 'position.y': -lo, 'scale.y': len, alpha: 1 } : { 'position.x': lo, 'position.y': -off, 'scale.x': len, alpha: 1 };
      });
    });
  }
  return function (p) {
    var off = -dir * dist * (1 - E.outExpo(cl(p / 0.72))), a = cl(p * 7);
    return vert ? { dy: off, a: a } : { dx: off, a: a };
  };
});

reg('tzCountSet', 'ae/p_x2_typoB.jsx', function (c) {
  var sub = H.subCol(c.sc), ac = H.accCol(c.sc);
  return function (p, g, gs, e) {
    var o = lr(g, gs), t0 = o * 0.2, tl = 0.38 + o * 0.52;
    if (p < t0) return HIDE;
    if (p < tl) return { ch: String(Math.floor(g.i + e.step) % 10), s: 0.5, color: sub, a: cl((p - t0) / 0.06) };
    return p < tl + 0.07 ? { color: ac } : null;
  };
});

reg('tzCloseUp', 'ae/p_x2_typoB.jsx', function (c) {
  var gs = V.glyphs(c, c.node), vert = !!c.node.vertical, sz = c.node.size, spans = V.spans(gs, vert);
  var info = Object.create(null);
  spans.forEach(function (L) {
    var n = L.glyphs.length; if (n < 2) return;
    var gap = cl(((vert ? c.comp.height : c.comp.width) * 0.92 - (L.a1 - L.a0)) / (n - 1), sz * 0.22, sz * 0.55);
    L.glyphs.forEach(function (g, k) { info[g.i] = { k: k, n: n, gap: gap }; });
  });
  return function (p, g) {
    var stC = info[g.i]; if (!stC) return { a: cl(p * 8) };
    var cum = 0;
    for (var j = 1; j <= stC.k; j++) cum += stC.gap * (1 - E.outExpo(cl((p - (0.12 + (j - 1) / (stC.n - 1) * 0.58)) / 0.26)));
    var tot = 0;
    for (var j2 = 1; j2 < stC.n; j2++) tot += stC.gap * (1 - E.outExpo(cl((p - (0.12 + (j2 - 1) / (stC.n - 1) * 0.58)) / 0.26)));
    var d = cum - tot / 2;
    return vert ? { dy: d, a: cl(p * 8) } : { dx: d, a: cl(p * 8) };
  };
});

reg('tzWeightUp', 'ae/p_x2_typoB.jsx', function (c) {
  var swMax = c.node.size * 0.1;
  (c.node._jzTwins = c.node._jzTwins || []).push({
    label: 'WeightMask',
    setup: function (graph, clone, src, g) {
      clone.attrs.fill = false; clone.attrs.stroke = true;
      clone.attrs['stroke.strokeColor'] = c.sc.bg; clone.attrs['stroke.width'] = swMax;
      clone.keys = {};
      C.sample(graph, clone.id, clone.start, clone.end, function (f) {
        var e = E.outCubic(cl((pinAt(c, f) - 0.06) / 0.94));
        return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0), 'stroke.width': Math.max(0.5, swMax * (1 - e)), alpha: e < 0.96 ? cl(1 - e) : 0 };
      });
    }
  });
  return function (p) { return { a: cl(p * 6) }; };
});

reg('tzBaseAlign', 'ae/p_x2_typoB.jsx', function (c) {
  var gs = V.glyphs(c, c.node), vert = !!c.node.vertical, spans = V.spans(gs, vert), sz = c.node.size, sd = seedOf(c);
  var rng = inRange(c), ac = H.accCol(c.sc);
  if (rng.ok && !soloTotal(c, gs).solo) {
    var loc = V.local(c, c.node, 'BaseAlign'), lw = Math.max(1.5, sz * 0.02), pad = sz * 0.12;
    spans.slice(0, 6).forEach(function (L, k) {
      var off = L.c + sz * 0.56;
      localShape(c, loc, 'Guide ' + k, vert ? G.rect(-lw / 2, 0, lw, 1) : G.rect(0, -lw / 2, 1, lw), { fill: ac, alpha: 1 }, rng, function (p) {
        var s = ioCubic(cl((p - 0.14) / 0.66)) * 1.14, pos = Math.min(L.a1 + pad, L.a0 + (L.a1 - L.a0) * (s - 0.04));
        var len = pos - (L.a0 - pad), ga = cl(p / 0.1) * (1 - cl((p - 0.84) / 0.16));
        if (len <= 1) return { alpha: 0 };
        return vert ? { 'position.x': off, 'position.y': -(L.a0 - pad), 'scale.y': len, alpha: ga } : { 'position.x': L.a0 - pad, 'position.y': -off, 'scale.x': len, alpha: ga };
      });
    });
  }
  return function (p, g) {
    var L = spans.filter(function (x) { return x.li === g.li; })[0];
    if (!L) return { a: cl(p * 8) };
    var s = ioCubic(cl((p - 0.14) / 0.66)) * 1.14, f = L.a1 - L.a0 > 1 ? ((vert ? g.y : g.x) - L.a0) / (L.a1 - L.a0) : 0;
    var u = cl((s - f) / 0.12); if (u >= 1) return null;
    var off = ((rand(sd, g.i, 5) < 0.5 ? 1 : -1) * mix(0.16, 0.4, rand(sd, g.i, 6)) * sz) * (1 - E.outExpo(u));
    return vert ? { dx: off, a: cl(p * 8) } : { dy: off, a: cl(p * 8) };
  };
});

reg('tzPointSize', 'ae/p_x2_typoB.jsx', function (c) {
  var SArr = [0.34, 0.52, 0.76, 1], b = V.bounds(V.glyphs(c, c.node)), rng = inRange(c), sub = H.subCol(c.sc);
  if (rng.ok) {
    var loc = V.local(c, c.node, 'PointSize');
    localShape(c, loc, 'Rule', G.rect(b.x0, -(b.y0 - 4), Math.max(1, b.w), 1.5), { fill: sub, alpha: 1 }, rng, function (p) {
      var k = Math.min(3, Math.floor(cl(p) * 4)), a = 1 - cl((p - 0.86) / 0.14);
      return { 'scale.x': SArr[k], alpha: a };
    });
  }
  return function (p, g) {
    var k = Math.min(3, Math.floor(cl(p) * 4)), sc = SArr[k];
    return { s: sc, dx: (g.x - b.cx) * (sc - 1), dy: (g.y - b.cy) * (sc - 1), a: cl(p * 10) };
  };
});

reg('tzIndexLead', 'ae/p_x2_typoB.jsx', function (c) {
  var gs = V.glyphs(c, c.node), spans = V.spans(gs, !!c.node.vertical), vert = !!c.node.vertical, sz = c.node.size;
  var nL = Math.max(1, spans.length), stp = Math.min(0.06, 0.3 / nL), span = 0.62 - (nL - 1) * stp;
  var rng = inRange(c), ac = H.accCol(c.sc), sub = H.subCol(c.sc);
  function qOf(k, p) { return ioCubic(cl((p - 0.14 - k * stp) / span)); }
  if (rng.ok && spans.length && !soloTotal(c, gs).solo) {
    var loc = V.local(c, c.node, 'IndexLead'), lw = Math.max(1.5, sz * 0.02), fs = Math.max(12, sz * 0.2);
    spans.slice(0, 6).forEach(function (L, k) {
      localShape(c, loc, 'Lead ' + k, vert ? G.rect(-lw / 2, 0, lw, 1) : G.rect(0, -lw / 2, 1, lw), { fill: ac, alpha: 1 }, rng, function (p) {
        var qr = E.inCubic(cl((p - 0.8) / 0.2)), h0 = mix(L.a0, L.a1, qr), h1 = mix(L.a0, L.a1, qOf(k, p)), off = L.c - sz * 0.62;
        if (h1 - h0 <= 1) return { alpha: 0 };
        return vert ? { 'position.x': off, 'position.y': -h0, 'scale.y': h1 - h0, alpha: 1 } : { 'position.x': h0, 'position.y': -off, 'scale.x': h1 - h0, alpha: 1 };
      });
    });
    var L0 = spans[0];
    localText(c, loc, 'Idx', '01', vert ? L0.c : L0.a0, vert ? L0.a0 - fs * 0.9 : L0.c - sz * 0.62 - fs * 0.8, fs,
      { align: vert ? 'center' : 'left', color: sub }, rng, function (p) {
        return { alpha: (p > 0.03 ? 1 : 0) * (1 - cl((p - 0.82) / 0.18)) };
      });
  }
  return function (p, g) {
    var k = Math.max(0, spans.findIndex(function (L) { return L.li === g.li; })), L = spans[k];
    if (!L) return null;
    var d = mix(L.a0, L.a1, qOf(k, p)) - (vert ? g.y : g.x);
    if (d < 0) return HIDE;
    return d < sz * 0.6 ? { color: ac } : null;
  };
});

reg('tzTextFrame', 'ae/p_x2_typoB.jsx', function (c) {
  var gs = V.glyphs(c, c.node), b = padBox(gs, c.node.size * 0.16), rng = inRange(c), ac = H.accCol(c.sc), sz = c.node.size;
  if (rng.ok && !soloTotal(c, gs).solo) {
    var loc = V.local(c, c.node, 'TextFrame'), lw = Math.max(1.5, sz * 0.018), hs = Math.max(4, sz * 0.05);
    localShape(c, loc, 'Frame', G.rect(b.x0, -b.y1, Math.max(2, b.w), Math.max(2, b.h)), { stroke: ac, width: lw, alpha: 1 }, rng, function (p) {
      var qd = ioCubic(cl(p / 0.38)), qr = E.inCubic(cl((p - 0.8) / 0.2));
      return { 'scale.x': Math.max(0.02, qd * (1 - qr)), alpha: qr >= 0.99 ? 0 : 1 };
    });
    [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]].forEach(function (pt, idx) {
      localShape(c, loc, 'Handle ' + idx, G.rect(pt[0] - hs / 2, -pt[1] - hs / 2, hs, hs), { fill: ac, alpha: 1 }, rng, function (p) {
        return { alpha: (p > 0.36 && p < 0.8) ? 1 : 0 };
      });
    });
  }
  return function (p, g, gs2) {
    return p < 0.3 + lr(g, gs2) * 0.42 ? HIDE : null;
  };
});

/* ================================================================ Wa (9) */

reg('wzFusuma', 'ae/p_x2_waB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), sz = c.node.size, b = padBox(gs, sz * 0.28), rng = inRange(c);
  if (rng.ok) {
    var loc = V.local(c, c.node, 'Fusuma'), lw = Math.max(2, sz * 0.03), ac = H.accCol(c.sc);
    var paper = H.mixHex(c.sc.bg, c.sc.fg, H.dark(c.sc.bg) ? 0.14 : 0.08);
    [-1, 1].forEach(function (side) {
      localShape(c, loc, 'Door ' + (side < 0 ? 'L' : 'R'), G.rect(side < 0 ? -1 : 0, -b.h / 2, 1, b.h),
        { fill: paper, stroke: c.node.color, width: lw, alpha: 1 }, rng, function (p) {
          var show = E.outCubic(cl(p / 0.2)), ev = ioCubic(cl((p - 0.16) / 0.72)), fade = 1 - H.smoothstep(0.8, 1, p);
          var w = (b.w / 2) * (1 - ev);
          if (w < 1 || fade < 0.01) return { alpha: 0 };
          var uOut = side < 0 ? b.x0 : b.x1;
          return { 'position.x': uOut, 'position.y': -b.cy, 'scale.x': w, 'scale.y': Math.max(0.02, show), alpha: cl(fade * cl(show * 1.5)) };
        });
      localShape(c, loc, 'Pull ' + (side < 0 ? 'L' : 'R'), G.ellipse(0, 0, sz * 0.085, sz * 0.085), { stroke: ac, width: lw * 0.75, alpha: 1 }, rng, function (p) {
        var show = E.outCubic(cl(p / 0.2)), ev = ioCubic(cl((p - 0.16) / 0.72)), fade = 1 - H.smoothstep(0.8, 1, p);
        var half = b.w / 2 * ev, w = b.w / 2 * (1 - ev);
        if (w <= sz * 0.7 || fade < 0.01) return { alpha: 0 };
        return { 'position.x': b.cx + side * (half + sz * 0.36), 'position.y': -b.cy, 'scale.x': Math.max(0.05, show), 'scale.y': Math.max(0.05, show), alpha: fade };
      });
    });
  }
  return function (p) {
    var ev = ioCubic(cl((p - 0.16) / 0.72)), h = b.w / 2 * ev;
    return ev >= 0.99 ? null : { clipPolygon: V.polygon(b.cx - h, b.y0 - sz * 2, b.cx + h, b.y1 + sz * 2) };
  };
});

reg('wzKakejiku', 'ae/p_x2_waB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), sz = c.node.size, b = padBox(gs, sz * 0.3), rng = inRange(c);
  if (rng.ok) {
    var loc = V.local(c, c.node, 'Kakejiku'), lw = Math.max(2, sz * 0.03), rod = Math.max(4, sz * 0.085);
    var col = c.node.color, ac = H.accCol(c.sc);
    localShape(c, loc, 'TopBar', G.rect(-b.w / 2, -lw / 2, b.w, lw), { fill: col, alpha: 1 }, rng, function (p) {
      var top = E.outCubic(cl(p / 0.2)), fade = 1 - H.smoothstep(0.84, 1, p);
      return { 'position.x': b.cx, 'position.y': -(b.y0 - lw / 2), 'scale.x': Math.max(0.02, top), alpha: fade };
    });
    localShape(c, loc, 'Roller', G.rect(-b.w / 2 - rod * 0.4, -rod / 2, b.w + rod * 0.8, rod), { fill: col, alpha: 1 }, rng, function (p) {
      var top = E.outCubic(cl(p / 0.2)), ev = ioCubic(cl((p - 0.12) / 0.72)), fade = 1 - H.smoothstep(0.84, 1, p);
      return { 'position.x': b.cx, 'position.y': -mix(b.y0, b.y1, ev), 'scale.x': Math.max(0.02, top), alpha: cl(top * 2) * fade };
    });
    [-1, 1].forEach(function (sd) {
      localShape(c, loc, 'Knob ' + sd, G.rect(-rod * 0.45, -rod * 0.72, rod * 0.9, rod * 1.44), { fill: ac, alpha: 1 }, rng, function (p) {
        var top = E.outCubic(cl(p / 0.2)), ev = ioCubic(cl((p - 0.12) / 0.72)), fade = 1 - H.smoothstep(0.84, 1, p);
        return { 'position.x': b.cx + sd * (b.w / 2 + rod * 0.85), 'position.y': -mix(b.y0, b.y1, ev), alpha: top * fade };
      });
    });
  }
  return function (p) {
    var ev = ioCubic(cl((p - 0.12) / 0.72)), y = mix(b.y0, b.y1, ev);
    return ev >= 0.99 ? null : { clipPolygon: V.polygon(b.x0 - sz * 2, b.y0 - sz * 2, b.x1 + sz * 2, y) };
  };
});

reg('wzMisu', 'ae/p_x2_waB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), sz = c.node.size, b = padBox(gs, sz * 0.22), rng = inRange(c);
  var Np = Math.round(cl(b.h / (sz * 0.14), 6, 20)), pitch = b.h / Np, th = pitch * 0.5, bp = th * 0.4;
  if (rng.ok) {
    var loc = V.local(c, c.node, 'Misu'), slatCol = H.mixHex(c.sc.bg, c.node.color, 0.5);
    for (var i = 0; i < Np; i++) {
      (function (idx) {
        localShape(c, loc, 'Slat ' + idx, G.rect(b.x0, -th / 2, b.w, th), { fill: slatCol, alpha: 0.9 }, rng, function (p) {
          var ev = ioCubic(cl((p - 0.14) / 0.66)), yb = mix(b.y1, b.y0, ev), fade = 1 - H.smoothstep(0.8, 1, p);
          var y = Math.min(b.y0 + (idx + 0.5) * pitch, yb - (Np - 1 - idx) * bp - th / 2);
          return { 'position.y': -y, alpha: 0.9 * fade };
        });
      })(i);
    }
  }
  return function (p, g) {
    var ev = ioCubic(cl((p - 0.14) / 0.66)), yb = mix(b.y1, b.y0, ev);
    if (g.y - g.h * 0.5 >= yb - sz * 0.2) return { a: cl(p / 0.16) };
    return { a: cl(p / 0.16) * 0.55 };
  };
});

reg('wzHanko', 'ae/p_x2_waB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), sz = c.node.size, b = padBox(gs, sz * 0.2), rng = inRange(c), sd = seedOf(c);
  var seal = c.sc.accent, own = c.node.color, knock = H.contrast(c.sc.bg, seal) >= 1.6 ? c.sc.bg : (H.dark(seal) ? '#FFFFFF' : '#000000');
  var dir = rand(sd, 11, 5) < 0.5 ? -1 : 1, tI = 0.26;
  if (rng.ok) {
    var loc = V.local(c, c.node, 'Hanko');
    localShape(c, loc, 'Seal', G.rect(b.x0, -b.y1, Math.max(2, b.w), Math.max(2, b.h)), { fill: seal, alpha: 1 }, rng, function (p) {
      return { alpha: 1 - H.smoothstep(0.4, 0.96, p) };
    });
  }
  return function (p, g) {
    var down = iQuad(cl(p / tI)), t = cl((p - tI) / (1 - tI));
    var sc = p < tI ? mix(1.2, 1, down) : 1 - 0.035 * Math.exp(-t * 10) * (1 - t);
    var rot = dir * -5 * (1 - down), rv = rot2((g.x - b.cx) * sc, (g.y - b.cy) * sc, rot);
    return { dx: b.cx + rv[0] - g.x, dy: b.cy + rv[1] - g.y, rot: rot, s: sc, a: cl(p / 0.1), color: H.mixHex(knock, own, H.smoothstep(0.45, 0.85, p)) };
  };
});

reg('wzChochin', 'ae/p_x2_waB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), sz = c.node.size, own = c.node.color, warm = H.accCol(c.sc), rng = inRange(c);
  if (rng.ok) {
    var loc = V.local(c, c.node, 'Chochin'), lw = Math.max(1.5, sz * 0.018);
    nonSpace(gs).forEach(function (g) {
      var rx = Math.max(g.w, sz * 0.6) * 0.6, ry = Math.max(g.h, sz * 0.6) * 0.7;
      localShape(c, loc, 'Lantern ' + g.i, G.ellipse(g.x, -g.y, rx, ry), { fill: warm, stroke: warm, width: lw, alpha: 0.7 }, rng, function (p) {
        var q = st(p, lr(g, gs), 0.6);
        return { alpha: (q > 0 && q < 1) ? cl(q * 4) * (1 - H.smoothstep(0.5, 1, q)) * 0.5 : 0 };
      });
    });
  }
  return function (p, g, gs2, e) {
    var q = st(p, lr(g, gs2), 0.6);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    var fl = q < 0.45 ? 0.55 + 0.45 * rand(e.seed, g.i, e.step, 211) : 1;
    return { a: cl(q * 3.5) * fl, color: H.mixHex(warm, own, H.smoothstep(0.45, 1, q)) };
  };
});

reg('wzKamifubuki', 'ae/p_x2_waB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), sz = c.node.size, sd = seedOf(c), rng = inRange(c);
  var cols = [H.accCol(c.sc), c.sc.accent2 || c.sc.accent, c.node.color, H.subCol(c.sc)];
  if (rng.ok) {
    var loc = V.local(c, c.node, 'Kamifubuki'), hw = sz * 0.075, hh = sz * 0.048;
    nonSpace(gs).slice(0, 14).forEach(function (g) {
      for (var k = 0; k < 2; k++) {
        (function (kk) {
          var r1 = rand(sd, g.i, kk, 222), ph = rand(sd, g.i, kk, 223) * TAU;
          var tx = g.x + (rand(sd, g.i, kk, 224) * 2 - 1) * g.w * 0.32, ty = g.y + (rand(sd, g.i, kk, 225) * 2 - 1) * g.h * 0.32;
          var dx0 = (rand(sd, g.i, kk, 226) * 2 - 1) * sz * 1.5, dy0 = sz * (1.5 + 1.7 * rand(sd, g.i, kk, 227));
          localShape(c, loc, 'Flake ' + g.i + '_' + kk, G.rect(-hw, -hh, hw * 2, hh * 2), { fill: cols[(g.i + kk) % 4], alpha: 1 }, rng, function (p) {
            var q = st(p, rand(sd, g.i, 221), 0.36);
            if (q <= 0 || q >= 1) return { alpha: 0 };
            var tf = cl(q / 0.62 * (0.78 + 0.22 * r1)), ef = 1 - Math.pow(1 - tf, 1.5), out = 1 - H.smoothstep(0.68, 1, q);
            var px = tx + (1 - ef) * dx0 + Math.sin(tf * 9 + ph) * sz * 0.24 * (1 - tf), py = ty - (1 - ef) * dy0;
            return { 'position.x': px, 'position.y': -py, rotation: -((ph + tf * 8) / DEG), 'scale.x': 0.25 + 0.75 * Math.abs(Math.cos(tf * 11 + ph)), alpha: cl(tf * 5) * out };
          });
        })(k);
      }
    });
  }
  return function (p, g, gs2, e) {
    var q = st(p, rand(e.seed, g.i, 221), 0.36);
    if (q <= 0.5) return HIDE;
    if (q >= 1) return null;
    return { a: H.smoothstep(0.5, 0.85, q), s: mix(0.82, 1, E.outCubic((q - 0.5) / 0.5)) };
  };
});

reg('wzHanabi', 'ae/p_x2_waB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), sz = c.node.size, sd = seedOf(c), rng = inRange(c), tB = 0.32;
  var c1 = H.accCol(c.sc), c2 = c.sc.accent2 || c.node.color;
  if (rng.ok) {
    var loc = V.local(c, c.node, 'Hanabi');
    nonSpace(gs).slice(0, 10).forEach(function (g) {
      var rays = [], R = 6, o = rand(sd, g.i, 232) * TAU;
      for (var k = 0; k < R; k++) {
        var an = o + k / R * TAU, rr = k % 2 ? 0.72 : 1;
        rays.push(['M', Math.cos(an) * sz * 0.2 * rr, -Math.sin(an) * sz * 0.2 * rr], ['L', Math.cos(an) * sz * 0.8 * rr, -Math.sin(an) * sz * 0.8 * rr]);
      }
      localShape(c, loc, 'Burst ' + g.i, rays, { stroke: g.i % 2 ? c2 : c1, width: Math.max(1.5, sz * 0.025), alpha: 1 }, rng, function (p) {
        var q = st(p, lr(g, gs) * 0.65 + rand(sd, g.i, 231) * 0.35, 0.42);
        if (q < tB || q >= 1) return { alpha: 0 };
        var u = (q - tB) / (1 - tB), sc = 0.25 + E.outExpo(u);
        return { 'position.x': g.x, 'position.y': -g.y - sz * 0.16 * u * u, 'scale.x': sc, 'scale.y': sc, alpha: 1 - H.smoothstep(0.4, 1, u) };
      });
    });
  }
  return function (p, g, gs2, e) {
    var q = st(p, lr(g, gs2) * 0.65 + rand(e.seed, g.i, 231) * 0.35, 0.42);
    if (q <= tB) return HIDE;
    if (q >= 1) return null;
    var u = (q - tB) / (1 - tB);
    return { s: mix(0.3, 1, E.outBack(cl(u / 0.6), 1.9)), a: cl(u * 4) };
  };
});

reg('wzOrigami', 'ae/p_x2_waB1.jsx', function () {
  var F = 0.78;
  return function (p, g, gs) {
    var q = st(p, lr(g, gs), 0.5);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    var sc = mix(0.4, 1, E.outBack(cl(q / 0.2), 1.6)), x1 = ioCubic(cl((q - 0.2) / 0.38)), y1 = ioCubic(cl((q - 0.58) / 0.42));
    return { s: sc, a: cl(q * 8), clipX: [-F, F * x1], clipY: [-F, F * y1] };
  };
});

reg('wzSeigaiha', 'ae/p_x2_waB1.jsx', function (c) {
  var gs = V.glyphs(c, c.node), b = padBox(gs, c.node.size * 0.25), sz = c.node.size;
  var r = Math.max(sz * 0.36, Math.sqrt(Math.max(1, b.w * b.h) / 140));
  return function (p, g) {
    var uRow = b.h > 1 ? (b.y1 - g.y) / b.h : 0, uCol = b.w > 1 ? (g.x - b.x0) / b.w : 0;
    var q = st(p, cl(uRow * 0.75 + uCol * 0.25), 0.62);
    if (q <= 0) return HIDE;
    if (q >= 1) return null;
    var R0 = r * 1.32 * E.outCubic(q), pts = [];
    for (var k = 0; k < 12; k++) { var a = k / 12 * TAU; pts.push([g.x + Math.cos(a) * R0, g.y + Math.sin(a) * R0]); }
    return { clipPolygon: pts, s: mix(0.85, 1, E.outCubic(q)) };
  };
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
