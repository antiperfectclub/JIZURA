/* 41 core & B exit recipes from src/11p_exit.js (12) and src/11p_exitB.js (29). */
(function (N, G, C, R, V, S, H) {
'use strict';

var E = R.E, cl = R.clamp, mix = R.mix, st = R.stagger, TAU = R.T, PI = Math.PI, DEG = PI / 180, rand = N.random;
var HIDE = { hide: true };
var SYM_POOL = Array.from('#%&*+=-:/?@ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
var HALF_POOL = Array.from('0123456789ABCDEF+-*/=<>%#@');
var REEL_POOL = Array.from('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*#@');

function oQuad(x) { x = cl(x); return 1 - (1 - x) * (1 - x); }
function oCubic(x) { return 1 - Math.pow(1 - cl(x), 3); }
function oQuart(x) { return 1 - Math.pow(1 - cl(x), 4); }
function iQuad(x) { x = cl(x); return x * x; }
function iCubic(x) { x = cl(x); return x * x * x; }
function ioCubic(x) { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function ioSine(x) { return -(Math.cos(PI * cl(x)) - 1) / 2; }
function rs(a, b, c2, d) { return rand(a, b, c2, d) * 2 - 1; }
function win(p, off, span) { return cl((p - off * (1 - span)) / Math.max(0.01, span)); }
function seedOf(c) { return c.node.seed == null ? ((c.cut.source || {}).seed || 1) : c.node.seed; }
function cutSeed(c) { return (c.cut && c.cut.seed) || seedOf(c); }
function cutBit(c, salt) { return rand(cutSeed(c), salt, 7) < 0.5; }
function cutN(c) { return Array.from(String((c.cut && c.cut.text) || (c.node && c.node.text) || '').replace(/[\s\u3000]/g, '')).length || 1; }
function lr(g, gs, c) {
  if (gs.length <= 1 && c) { var cn = cutN(c); if (cn > 1) return cl((+c.node.mi || 0) / (cn - 1)); }
  return gs.length > 1 ? g.i / (gs.length - 1) : 0;
}
function isBlank(ch) { return /^[\s\u3000]$/.test(ch); }
function isSingle(c, gs) { return gs.filter(function (g) { return !isBlank(g.ch); }).length <= 1 && cutN(c) > 1; }
function isPrimary(c, gs) { return (c.node.alpha == null ? 1 : c.node.alpha) >= 0.85 && c.node.fill !== false && !(gs.filter(function (g) { return !isBlank(g.ch); }).length <= 1 && cutN(c) > 2); }
function darkBg(c) { return H.dark(c.sc.bg || '#101010'); }
function gcx(g, node) { return (g.x + (g.vx || 0)) * (node.sx == null ? 1 : node.sx); }
function gcy(g, node) { return g.y + (g.vy || 0); }
function rot2(x, y, deg) { var a = deg * DEG, cs = Math.cos(a), sn = Math.sin(a); return [x * cs - y * sn, x * sn + y * cs]; }

function setKey(graph, id, attr, f, v, type) {
  var n = graph.byId[id];
  if (typeof v === 'number') N.finite(v, attr);
  if (!n.keys[attr]) n.keys[attr] = {};
  n.keys[attr][f] = { value: v, type: type == null ? 1 : type };
}
function getKeyVal(n, attr, f, fallback) {
  var trk = n.keys[attr];
  if (trk && Object.prototype.hasOwnProperty.call(trk, f)) return trk[f].value;
  return n.attrs[attr] == null ? fallback : n.attrs[attr];
}

function outRange(c) {
  var start = Math.max(c.cut.start, c.cut.sourceEnd - Math.max(1, c.cut.outFrames));
  var end = c.cut.end;
  return { start: start, end: end, ok: end > start };
}
function poutAt(c, f) { return V.envelope(c, c.node, f).pout; }

function decompShear(k) {
  if (Math.abs(k) < 1e-6) return [0, 1, 1, 0];
  var v = 0.5 * Math.atan2(2 * k, -k * k);
  var a = Math.cos(v) + k * Math.sin(v), b = Math.sin(v), s = Math.max(0.05, Math.hypot(a, b));
  return [Math.atan2(b, a) / DEG, s, 1 / s, -v / DEG];
}

function applyState(s, o, g) {
  if (!o) return;
  if (o.hide) { s.a = 0; return; }
  s.dx += o.dx || 0; s.dy += o.dy || 0; s.rot += o.rot || 0;
  var sc = o.s == null ? 1 : o.s;
  s.sx *= sc * (o.sx == null ? 1 : o.sx);
  s.sy *= sc * (o.sy == null ? 1 : o.sy);
  s.a *= o.a == null ? 1 : o.a;
  if (o.clipX || o.clipY) {
    var cx0 = o.clipX ? o.clipX[0] : -2, cx1 = o.clipX ? o.clipX[1] : 2;
    var cy0 = o.clipY ? o.clipY[0] : -2, cy1 = o.clipY ? o.clipY[1] : 2;
    var hw = Math.max(2, g.w), hh = Math.max(2, g.h);
    var px = g.x + (g.vx || 0), py = g.y + (g.vy || 0);
    s.clipPolygon = V.polygon(px + cx0 * hw, py + cy0 * hh, px + cx1 * hw, py + cy1 * hh);
  }
  if (o.blur != null) s.blur = (s.blur || 0) + o.blur;
  if (o.ch != null) s.ch = o.ch;
  if (o.color) s.color = o.color;
  if (o.skew) s.rot += o.skew * 0.28;
}

function reg(key, source, factory, diffs) {
  N.register('exit', key, {
    source: source + ' / exit:' + key,
    scope: 'glyph',
    differences: diffs || [],
    build: function (c) {
      var fn = factory(c);
      return function (s, g, gs, frame) {
        var env = V.envelope(c, c.node, frame);
        var e = { W: c.comp.width, H: c.comp.height, size: c.node.size, seed: seedOf(c),
          vertical: !!c.node.vertical, M: H.motionAmt(c) / 0.7, step: Math.floor(env.t * 24 + 1e-6), frame: frame, time: env.t };
        applyState(s, fn(env.pout, g, gs, e), g);
      };
    }
  });
}

function post(c, fn) { (c.node._jzPost = c.node._jzPost || []).push(fn); }
function regPost(key, source, setupFn, diffs) {
  N.register('exit', key, {
    source: source + ' / exit:' + key,
    scope: 'node',
    differences: diffs || [],
    build: function (c) { setupFn(c); return function () {}; }
  });
}

function lineBounds(gs) {
  var b = V.bounds(gs);
  return { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1, w: b.w, h: b.h, cx: b.cx, cy: b.cy };
}

function rootPlaceNull(graph, ids, cut, node, comp, camParent) {
  var cur = ids.length && graph.byId[ids[0]] ? graph.byId[ids[0]].parent : null;
  while (cur && graph.byId[cur] && graph.byId[cur].parent !== camParent) {
    if (String(graph.byId[cur].name || '').slice(-8) === ' / Place') return cur;
    cur = graph.byId[cur].parent;
  }
  if (cur && graph.byId[cur] && graph.byId[cur].type === 'null') return cur;
  var pId = ids.length && graph.byId[ids[0]] ? graph.byId[ids[0]].parent : camParent;
  return graph.add('null', cut.id + ' / ' + node.id + ' / Place', pId, cut.start, cut.end, {
    position: [node.x - comp.width / 2, comp.height / 2 - node.y],
    rotation: -(node.rotation || 0), scale: [node.sx == null ? 1 : node.sx, 1]
  });
}

function insertBeforeLayer(graph, nodeId, targetId) {
  var n = graph.byId[nodeId], t = graph.byId[targetId];
  var i = graph.layers.indexOf(n), j = graph.layers.indexOf(t);
  if (i >= 0 && j >= 0 && i > j) { graph.layers.splice(i, 1); graph.layers.splice(j, 0, n); }
}

function toScenePoly(graph, placeId, f, poly) {
  var mtx = S.matrix(graph, placeId, f);
  return poly.map(function (pt) { return S.point(mtx, [pt[0], -pt[1]]); });
}

function addLocalShape(c, loc, rng, name, cmds, paint, sampleFn) {
  if (!rng.ok) return null;
  var id = C.shape(c.graph, { start: rng.start, end: rng.end }, c.cut.id + ' / ' + c.node.id + ' / ' + name, loc, cmds, paint);
  if (sampleFn) C.sample(c.graph, id, rng.start, rng.end, function (f) { return sampleFn(poutAt(c, f), f); });
  return id;
}

function applyExitWindowClip(c, difference, polysFn) {
  var rng = outRange(c);
  if (!rng.ok) return;
  post(c, function (graph, ids, gs, cut, parent, options) {
    var placeId = rootPlaceNull(graph, ids, cut, c.node, c.comp, parent);
    var b = lineBounds(gs);
    var byFrame = Object.create(null);
    for (var f = rng.start; f < cut.end; f++) {
      var p = poutAt(c, f);
      if (p <= 0) continue;
      if (p >= 1) {
        if (!difference) byFrame[f] = [];
        else ids.forEach(function (tid) { setKey(graph, tid, 'alpha', f, 0, 2); });
        continue;
      }
      var locPolys = polysFn(p, b, f) || [];
      byFrame[f] = locPolys.filter(function (q) { return q && q.length >= 3; })
        .map(function (q) { return toScenePoly(graph, placeId, f, q); });
    }
    ids.forEach(function (tid) { H.multiClip(graph, tid, byFrame, difference, 'Exit clip', options); });
  });
}

function applyExitSliceTwins(c, slicesFn) {
  var rng = outRange(c);
  if (!rng.ok) return;
  post(c, function (graph, ids, gs, cut, parent, options) {
    var placeId = rootPlaceNull(graph, ids, cut, c.node, c.comp, parent);
    var b = lineBounds(gs), specs = slicesFn(b);
    ids.forEach(function (tid) {
      for (var f = rng.start; f < cut.end; f++) setKey(graph, tid, 'alpha', f, 0, 2);
    });
    specs.forEach(function (sp, idx) {
      var sliceRig = graph.add('null', cut.id + ' / ' + c.node.id + ' / ExitSlice ' + idx, placeId, rng.start, rng.end, {});
      insertBeforeLayer(graph, sliceRig, ids[0]);
      var byFrame = Object.create(null), twinIds = [];
      ids.forEach(function (srcId) {
        var src = graph.byId[srcId];
        var cid = graph.add(src.type, src.name + ' / ES' + idx, sliceRig, rng.start, rng.end,
          V.copy(src.attrs), src.commands ? V.copy(src.commands) : null);
        var dst = graph.byId[cid];
        Object.keys(src.keys).forEach(function (attr) {
          var t = {};
          for (var f = rng.start; f < rng.end; f++) if (src.keys[attr][f]) t[f] = V.copy(src.keys[attr][f]);
          if (Object.keys(t).length) dst.keys[attr] = t;
        });
        insertBeforeLayer(graph, cid, ids[0]);
        twinIds.push(cid);
      });
      for (var f = rng.start; f < rng.end; f++) {
        var p = poutAt(c, f), st2 = sp.sample(p, f);
        var dx = st2.dx || 0, dy = st2.dy || 0, rot = st2.rot || 0, a = st2.a == null ? 1 : cl(st2.a);
        var sx = Math.max(0.02, st2.sx == null ? 1 : st2.sx), sy = Math.max(0.02, st2.sy == null ? 1 : st2.sy);
        if (rot) {
          var px = st2.px == null ? b.cx : st2.px, py = st2.py == null ? b.cy : st2.py;
          var rad = rot * DEG, cs = Math.cos(rad), sn = Math.sin(rad);
          graph.key(sliceRig, 'position.x', f, dx + px - (px * cs - (-py) * sn), 1);
          graph.key(sliceRig, 'position.y', f, -dy - py - (px * sn + (-py) * cs), 1);
          graph.key(sliceRig, 'rotation', f, -rot, 1);
        } else {
          graph.key(sliceRig, 'position.x', f, dx, 1);
          graph.key(sliceRig, 'position.y', f, -dy, 1);
        }
        if (sx !== 1) graph.key(sliceRig, 'scale.x', f, sx, 1);
        if (sy !== 1) graph.key(sliceRig, 'scale.y', f, sy, 1);
        twinIds.forEach(function (cid) {
          var cn = graph.byId[cid];
          setKey(graph, cid, 'alpha', f, getKeyVal(cn, 'alpha', f, 1) * a, 1);
        });
        var polys = sp.clip(p, b, f) || [];
        var mPlace = S.matrix(graph, placeId, f), mSlice = S.matrix(graph, sliceRig, f);
        byFrame[f] = polys.filter(function (q) { return q && q.length >= 3; }).map(function (q) {
          var mtx = sp.fixed ? mPlace : mSlice;
          return q.map(function (pt) { return S.point(mtx, [pt[0], -pt[1]]); });
        });
      }
      twinIds.forEach(function (cid) { H.multiClip(graph, cid, byFrame, false, 'Exit slice', options); });
    });
  });
}

function applyExitWholeRig(c, fn) {
  post(c, function (graph, ids, gs, cut, parent) {
    var curParent = ids.length && graph.byId[ids[0]] ? graph.byId[ids[0]].parent : rootPlaceNull(graph, ids, cut, c.node, c.comp, parent);
    var rigOuter = graph.add('null', cut.id + ' / ' + c.node.id + ' / Exit Outer', curParent, cut.start, cut.end, {});
    var rigStretch = graph.add('null', cut.id + ' / ' + c.node.id + ' / Exit Stretch', rigOuter, cut.start, cut.end, {});
    var rigInner = graph.add('null', cut.id + ' / ' + c.node.id + ' / Exit Inner', rigStretch, cut.start, cut.end, {});
    insertBeforeLayer(graph, rigOuter, ids[0]);
    insertBeforeLayer(graph, rigStretch, ids[0]);
    insertBeforeLayer(graph, rigInner, ids[0]);
    var rng = outRange(c), b = lineBounds(gs), base = Object.create(null);
    ids.forEach(function (tid) {
      var n = graph.byId[tid];
      n.parent = rigInner;
      base[tid] = { a: n.attrs.alpha == null ? 1 : n.attrs.alpha };
    });
    var hasBlur = false, blurVals = [], lastColor = null;
    for (var f = cut.start; f < cut.end; f++) {
      var p = f >= rng.start ? poutAt(c, f) : 0, s = p > 0 ? (fn(p, b, f) || {}) : {};
      var ax = s.ax == null ? 0 : s.ax, ay = s.ay == null ? 0 : s.ay;
      var sx = s.sx == null ? 1 : s.sx, sy = s.sy == null ? 1 : s.sy;
      var rot = s.rot || 0, dx = s.dx || 0, dy = s.dy || 0, skew = s.skew || 0;
      var sc = decompShear(Math.tan(skew * DEG));
      graph.key(rigOuter, 'position.x', f, dx + ax, 1);
      graph.key(rigOuter, 'position.y', f, -(dy + ay), 1);
      graph.key(rigOuter, 'rotation', f, -rot + sc[0], 1);
      graph.key(rigStretch, 'scale.x', f, sc[1], 1);
      graph.key(rigStretch, 'scale.y', f, sc[2], 1);
      graph.key(rigInner, 'rotation', f, sc[3], 1);
      graph.key(rigInner, 'scale.x', f, Math.abs(sx) < 0.01 ? (sx < 0 ? -0.01 : 0.01) : sx, 1);
      graph.key(rigInner, 'scale.y', f, Math.abs(sy) < 0.01 ? (sy < 0 ? -0.01 : 0.01) : sy, 1);
      graph.key(rigInner, 'position.x', f, -ax, 1);
      graph.key(rigInner, 'position.y', f, ay, 1);
      if (p > 0) {
        var am = s.a == null ? 1 : cl(s.a);
        ids.forEach(function (tid) {
          var tn = graph.byId[tid];
          setKey(graph, tid, 'alpha', f, getKeyVal(tn, 'alpha', f, base[tid].a) * am, 1);
          if (s.color && s.color !== lastColor) setKey(graph, tid, 'material.materialColor', f, s.color, 2);
        });
        if (s.color) lastColor = s.color;
      }
      var br = s.blur || 0;
      blurVals.push(br); if (br > 0.05) hasBlur = true;
    }
    if (hasBlur) {
      ids.forEach(function (tid) {
        var filter = graph.add('$gaussianBlur', graph.byId[tid].name + ' / Exit blur', tid, cut.start, cut.end, { radius: 0 });
        for (var i = 0; i < blurVals.length; i++) graph.key(filter, 'radius', cut.start + i, blurVals[i], 1);
        graph.connect(filter, 'id', tid, '$gaussianBlur');
      });
    }
  });
}

/* =====================================================================
   PART 1: src/11p_exit.js (12)
   ===================================================================== */

reg('blurOutStagger', 'src/11p_exit.js', function (c) {
  var bmax = Math.min(c.node.size * 0.09, Math.min(c.comp.width, c.comp.height) * 0.02);
  return function (p, g, gs, e) {
    var q = win(p, lr(g, gs, c), 0.55);
    if (q <= 0) return null;
    if (q >= 1) return HIDE;
    var k = ioSine(q);
    return { blur: k * bmax, a: 1 - q, dy: -k * e.size * 0.12, s: 1 + k * 0.22 };
  };
});

reg('glitchDissolve', 'src/11p_exit.js', function (c) {
  var sd = seedOf(c), acc = c.sc.accent || '#ff5577', c0 = c.node.color || c.sc.fg;
  var cols = [c0, acc, c.sc.ghostA || acc, c.sc.ghostB || c0], sz = c.node.size;
  var rng = outRange(c);
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var loc = V.local(c, c.node, 'GlitchBlocks');
      gs.slice(0, 12).forEach(function (g) {
        if (isBlank(g.ch)) return;
        var t0 = rand(sd, g.i, 801) * 0.55;
        for (var b = 0; b < 3; b++) {
          (function (hk, col) {
            var bw = sz * mix(0.12, 0.52, rand(sd, hk, 806)), bh = sz * mix(0.06, 0.26, rand(sd, hk, 807));
            addLocalShape(c, loc, rng, 'GBlk_' + g.i + '_' + hk, G.rect(-bw / 2, -bh / 2, bw, bh), { fill: col, alpha: 1 }, function (p, f) {
              var q = (p - t0) / 0.45, step = Math.floor(f * 24 / c.comp.fps);
              if (q <= 0 || q >= 1 || rand(sd, hk, step, 805) < q * 0.55) return { alpha: 0 };
              var gx = gcx(g, c.node) + rs(sd, hk, step, 808) * sz * 0.34;
              var gy = gcy(g, c.node) + rs(sd, hk, step, 809) * sz * 0.34;
              return { 'position.x': gx, 'position.y': -gy, 'scale.x': 1 - q * 0.5, alpha: 1 };
            });
          })(g.i * 8 + b, cols[(g.i * 3 + b) % cols.length]);
        }
      });
    });
  }
  return function (p, g, gs, e) {
    var q = (p - rand(sd, g.i, 801) * 0.55) / 0.45;
    if (q <= 0) return null;
    if (q >= 0.3) return HIDE;
    var r = rand(sd, g.i, e.step, 802), ct = rs(sd, g.i, e.step, 804) * 0.35;
    return { dx: rs(sd, g.i, e.step, 803) * e.size * 0.12, clipY: r < 0.5 ? [-1.2, ct] : [ct, 1.2], color: r < 0.25 ? acc : null };
  };
});

reg('outlineOut', 'src/11p_exit.js', function (c) {
  var lw = Math.max(1, c.node.size * 0.024), acc = c.sc.accent || c.node.color;
  (c.node._jzTwins = c.node._jzTwins || []).push({
    label: 'OutlineOut', below: false,
    setup: function (graph, clone, src, g, gs) {
      clone.attrs.fill = false; clone.attrs.stroke = true;
      clone.attrs['stroke.strokeColor'] = acc; clone.attrs['stroke.width'] = lw;
      clone.keys = {};
      var rng = outRange(c);
      C.sample(graph, clone.id, clone.start, clone.end, function (f) {
        if (f < rng.start) return { alpha: 0 };
        var p = poutAt(c, f), q = win(p, lr(g, gs, c), 0.35);
        if (q <= 0 || q >= 1) return { alpha: 0 };
        var u = cl((q - 0.68) / 0.32), sc = 1 + 0.3 * oCubic(u);
        return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0),
          rotation: -(g.r90 ? 90 : 0), 'scale.x': sc, 'scale.y': sc, alpha: Math.min(1, q * 8) * (1 - u) };
      });
    }
  });
  return function (p, g, gs) {
    var q = win(p, lr(g, gs, c), 0.35);
    if (q <= 0) return null;
    var k = ioSine(cl(q / 0.7));
    if (k >= 0.999) return HIDE;
    return { clipY: [-0.72 + 1.44 * k, 1.2] };
  };
});

reg('scrambleOut', 'src/11p_exit.js', function (c) {
  var acc = c.sc.accent || '#ff5577';
  return function (p, g, gs, e) {
    var q = win(p, 0.65 * lr(g, gs, c) + 0.35 * rand(e.seed, g.i, 701), 0.55);
    if (q <= 0) return null;
    if (q >= 1) return HIDE;
    if (q > 0.55 && rand(e.seed, g.i, e.step, 703) < (q - 0.55) * 2.4) return HIDE;
    return {
      ch: SYM_POOL[Math.floor(rand(e.seed, g.i, e.step, 702) * SYM_POOL.length)],
      color: rand(e.seed, g.i, e.step, 704) < 0.3 ? acc : null,
      s: 1 - 0.35 * H.smoothstep(0.4, 1, q)
    };
  };
});

reg('shatterLite', 'src/11p_exit.js', function (c) {
  var sd = seedOf(c), dist = c.node.size * 1.7;
  function quadState(qx, qy, id, p, g) {
    var clipX = qx < 0 ? [-1.6, 0.012] : [0, 1.6], clipY = qy < 0 ? [-1.6, 0.012] : [0, 1.6];
    var q = cl((p - rand(sd, g.i, 1201) * 0.35) / 0.65);
    if (q <= 0) return { clipX: clipX, clipY: clipY };
    if (q >= 1) return HIDE;
    var e = oCubic(q), dd = dist * (0.7 + 0.6 * rand(sd, g.i, id, 1203));
    return {
      clipX: clipX, clipY: clipY,
      dx: (qx + rs(sd, g.i, id, 1202) * 0.5) * dd * e,
      dy: (qy + rs(sd, g.i, id, 1205) * 0.5) * dd * e + c.node.size * 0.9 * q * q,
      rot: rs(sd, g.i, id, 1204) * 110 * e,
      s: 1 - 0.45 * q, a: 1 - H.smoothstep(0.45, 1, q)
    };
  }
  [[1, -1, 1], [-1, 1, 2], [1, 1, 3]].forEach(function (qd) {
    (c.node._jzTwins = c.node._jzTwins || []).push({
      label: 'ShatterQ' + qd[2], below: true,
      setup: function (graph, clone, src, g) {
        clone.keys = {};
        var clipFrames = [], rng = outRange(c), sx0 = src.attrs['scale.x'] || 1, sy0 = src.attrs['scale.y'] || 1;
        C.sample(graph, clone.id, clone.start, clone.end, function (f) {
          if (f < rng.start) { clipFrames.push(null); return { alpha: 0 }; }
          var st2 = quadState(qd[0], qd[1], qd[2], poutAt(c, f), g);
          if (st2.hide) { clipFrames.push(null); return { alpha: 0 }; }
          var sc = (st2.s || 1);
          clipFrames.push(V.polygon(qd[0] < 0 ? -g.w : 0, qd[1] < 0 ? -g.h : 0, qd[0] < 0 ? 0.02 * g.w : g.w, qd[1] < 0 ? 0.02 * g.h : g.h));
          return { 'position.x': g.x + (g.vx || 0) + (st2.dx || 0), 'position.y': -g.y - (g.vy || 0) - (st2.dy || 0),
            rotation: -(g.r90 ? 90 : 0) - (st2.rot || 0), 'scale.x': sx0 * sc, 'scale.y': sy0 * sc, alpha: st2.a == null ? 1 : st2.a };
        });
        V.clipDeformer(graph, clone.id, clipFrames, false, 'Quad clip', c.options);
      }
    });
  });
  return function (p, g) { return quadState(-1, -1, 0, p, g); };
});

reg('trackOutWide', 'src/11p_exit.js', function (c) {
  var gs0 = V.glyphs(c, c.node), b = V.bounds(gs0), sx = c.node.sx == null ? 1 : c.node.sx, sy = 1;
  var ox = b.cx, oy = b.cy, single = isSingle(c, gs0), bmax = Math.min(c.node.size * 0.035, Math.min(c.comp.width, c.comp.height) * 0.012);
  return function (p, g, gs, e) {
    if (p <= 0) return null;
    if (p >= 1) return HIDE;
    var k = iQuad(p) * 1.6 + p * 0.3, thin = 1 - 0.6 * iQuad(p);
    var o = e.vertical ? { dy: (g.y * sy - oy) * k, sy: thin } : { dx: (g.x * sx - ox) * k, sx: thin };
    if (single) { o.dx = (o.dx || 0) + (c.node.x - e.W / 2) * k * 0.7; o.dy = (o.dy || 0) + (c.node.y - e.H / 2) * k * 0.4; }
    o.a = 1 - H.smoothstep(0.2, 1, p); o.blur = iQuad(p) * bmax;
    return o;
  };
});

reg('undraw', 'src/11p_exit.js', function (c) {
  var sw = Math.max(1, c.node.size * 0.022), col = c.node.color || c.sc.fg;
  (c.node._jzTwins = c.node._jzTwins || []).push({
    label: 'UndrawStroke', below: false,
    setup: function (graph, clone, src, g, gs) {
      clone.attrs.fill = false; clone.attrs.stroke = true;
      clone.attrs['stroke.strokeColor'] = col; clone.attrs['stroke.width'] = sw;
      clone.keys = {};
      var rng = outRange(c), frames = [];
      for (var f = clone.start; f < clone.end; f++) {
        var p = poutAt(c, f), b = cl((p - 0.24) / 0.76), dash = Math.max(0.002, 1 - ioSine(b));
        frames.push(f < rng.start ? null : V.polygon(-g.w, -g.h, mix(-g.w, g.w, dash), g.h));
      }
      C.sample(graph, clone.id, clone.start, clone.end, function (f) {
        if (f < rng.start) return { alpha: 0 };
        var p = poutAt(c, f);
        return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0),
          rotation: -(g.r90 ? 90 : 0), alpha: 1 - H.smoothstep(0.9, 1, p) };
      });
      V.clipDeformer(graph, clone.id, frames, false, 'Undraw stroke', c.options);
    }
  });
  return function (p) {
    if (p <= 0) return null;
    if (p >= 1) return HIDE;
    return { a: (1 - ioSine(cl(p / 0.3))) * (1 - H.smoothstep(0.9, 1, p)) };
  };
});

regPost('vSliceDrop', 'src/11p_exit.js', function (c) {
  var sz = c.node.size, sd = seedOf(c), H0 = c.comp.height;
  applyExitSliceTwins(c, function (b) {
    var x0 = b.x0 - sz * 0.35, x1 = b.x1 + sz * 0.35, y0 = b.y0 - sz * 0.35, y1 = b.y1 + sz * 0.35, w = x1 - x0;
    var n = cl(Math.round(w / (sz * 0.24)), 4, 14), D = H0 - y0 + sz, specs = [];
    for (var k = 0; k < n; k++) {
      (function (idx) {
        var d0 = rand(sd, idx, 301) * 0.45, xa = x0 + idx * w / n, xb = x0 + (idx + 1) * w / n + 0.6;
        specs.push({
          fixed: false,
          sample: function (p) {
            var q = cl((p - d0) / 0.55);
            return { dy: (q * q * 1.05 - Math.sin(PI * cl(q / 0.25)) * 0.012) * D, a: 1 - H.smoothstep(0.95, 1, p) };
          },
          clip: function () { return [V.polygon(xa, y0 - sz * 2, xb, y1 + sz * 2)]; }
        });
      })(k);
    }
    return specs;
  });
});

reg('waveOut', 'src/11p_exit.js', function (c) {
  return function (p, g, gs, e) {
    var q = win(p, lr(g, gs, c), 0.55);
    if (q <= 0) return null;
    if (q >= 1) return HIDE;
    var A = e.size * 0.42;
    return { dy: -Math.sin(q * PI) * A + q * q * A * 2.6, dx: q * A * 0.6, rot: Math.sin(q * PI * 1.5) * 28 + q * 30, a: 1 - H.smoothstep(0.45, 1, q) };
  };
});

regPost('whipOut', 'src/11p_exit.js', function (c) {
  var vert = !!c.node.vertical, sz = c.node.size, dir = cutBit(c, 4) ? 1 : -1;
  applyExitWholeRig(c, function (p, b) {
    var dist = (vert ? c.comp.height + b.h : c.comp.width + b.w) + sz * 2;
    var pb = sz * 0.14 * oCubic(cl(p / 0.28)), u = cl((p - 0.26) / 0.74), e = u * u, v = Math.min(1.6, 2 * u);
    var off = dir * (dist * e - pb * (1 - u));
    return vert
      ? { ax: b.cx, ay: b.cy, dy: off, sy: 1 + v * 0.45, a: 1 - H.smoothstep(0.9, 1, p) }
      : { ax: b.cx, ay: b.cy, dx: off, sx: 1 + v * 0.55, sy: 1 - v * 0.08, skew: -dir * Math.min(28, v * 16), a: 1 - H.smoothstep(0.9, 1, p) };
  });
  [1, 2, 3].forEach(function (k) {
    (c.node._jzTwins = c.node._jzTwins || []).push({
      label: 'WhipStreak ' + k, below: true,
      setup: function (graph, clone, src, g) {
        clone.keys = {};
        var rng = outRange(c);
        C.sample(graph, clone.id, clone.start, clone.end, function (f) {
          if (f < rng.start) return { alpha: 0 };
          var p = poutAt(c, f), u = cl((p - 0.26) / 0.74), v = Math.min(1.6, 2 * u);
          if (v <= 0.05) return { alpha: 0 };
          var off = -dir * sz * 0.14 * k * Math.min(1, v);
          return { 'position.x': g.x + (g.vx || 0) + (vert ? 0 : off), 'position.y': -g.y - (g.vy || 0) - (vert ? off : 0),
            rotation: -(g.r90 ? 90 : 0), alpha: 0.4 * Math.min(1, v) * (1 - k * 0.25) * (1 - H.smoothstep(0.9, 1, p)) };
        });
      }
    });
  });
});

regPost('zoomFar', 'src/11p_exit.js', function (c) {
  var sz0 = c.node.size;
  applyExitWholeRig(c, function (p, b) {
    var e = 1 - Math.pow(1 - p, 2.6), s = Math.max(0.05, 1 - 0.9 * e);
    return { ax: b.cx, ay: b.cy, sx: s, sy: s, dy: -sz0 * 0.35 * e, a: 1 - H.smoothstep(0.5, 1, p) };
  });
  [1, 2, 3].forEach(function (k) {
    (c.node._jzTwins = c.node._jzTwins || []).push({
      label: 'ZoomFarEcho ' + k, below: true,
      setup: function (graph, clone, src, g) {
        clone.attrs.fill = false; clone.attrs.stroke = true;
        clone.attrs['stroke.strokeColor'] = c.node.color; clone.attrs['stroke.width'] = Math.max(1, sz0 * 0.02);
        clone.keys = {};
        var rng = outRange(c), sc = Math.pow(1.12, k);
        C.sample(graph, clone.id, clone.start, clone.end, function (f) {
          if (f < rng.start) return { alpha: 0 };
          var p = poutAt(c, f);
          return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0) - sz0 * 0.06 * k * p,
            rotation: -(g.r90 ? 90 : 0), 'scale.x': sc, 'scale.y': sc,
            alpha: 0.55 * Math.pow(0.62, k - 1) * H.smoothstep(0, 0.2, p) * (1 - H.smoothstep(0.5, 1, p)) };
        });
      }
    });
  });
});

regPost('zoomThrough', 'src/11p_exit.js', function (c) {
  var sz0 = c.node.size, maxK = Math.max(1.3, Math.max(c.comp.width, c.comp.height) * 1.6 / Math.max(1, sz0));
  applyExitWholeRig(c, function (p, b) {
    var k = Math.min(maxK, 1 + 4.5 * iCubic(p) + 0.25 * p);
    return { ax: b.cx, ay: b.cy, sx: k, sy: k, a: 1 - H.smoothstep(0.3, 0.88, p) };
  });
  [1, 2, 3].forEach(function (k) {
    (c.node._jzTwins = c.node._jzTwins || []).push({
      label: 'ZoomThroughEcho ' + k, below: true,
      setup: function (graph, clone, src, g) {
        clone.keys = {};
        var rng = outRange(c), sc = Math.pow(0.84, k);
        C.sample(graph, clone.id, clone.start, clone.end, function (f) {
          if (f < rng.start) return { alpha: 0 };
          var p = poutAt(c, f);
          return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0),
            rotation: -(g.r90 ? 90 : 0), 'scale.x': sc, 'scale.y': sc,
            alpha: 0.42 * Math.pow(0.62, k - 1) * H.smoothstep(0, 0.25, p) * (1 - H.smoothstep(0.3, 0.88, p)) };
        });
      }
    });
  });
});

/* =====================================================================
   PART 2: src/11p_exitB.js (29)
   ===================================================================== */

reg('candleOut', 'src/11p_exitB.js', function (c) {
  var sd = seedOf(c), dir = cutBit(c, 321) ? 1 : -1, warm = H.mixHex(c.node.color || c.sc.fg, c.sc.accent || '#ff7744', 0.5);
  var sub = c.sc.sub || c.sc.fg, sz = c.node.size, rng = outRange(c);
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimary(c, gs)) return;
      var loc = V.local(c, c.node, 'CandleSmoke');
      gs.slice(0, 14).forEach(function (g) {
        if (isBlank(g.ch)) return;
        var o = dir > 0 ? lr(g, gs, c) : 1 - lr(g, gs, c);
        var pts = [];
        for (var k = 0; k <= 6; k++) {
          var f2 = k / 6, h = sz * 1.1 * f2, w = Math.sin(f2 * 5 + g.i) * sz * 0.08 * f2 + dir * sz * 0.26 * f2;
          pts.push([w, -h]);
        }
        addLocalShape(c, loc, rng, 'Smoke_' + g.i, V.commands(pts, false), { stroke: sub, width: Math.max(1.2, sz * 0.028), alpha: 1 }, function (p) {
          var u = (p - o * 0.42) / 0.5;
          if (u < 0.36 || u >= 1) return { alpha: 0 };
          var age = (u - 0.36) / 0.64;
          return { 'position.x': gcx(g, c.node), 'position.y': -(gcy(g, c.node) - g.h * 0.4),
            'scale.y': 0.25 + 1.15 * age, alpha: 0.9 * (1 - age) };
        });
      });
    });
  }
  return function (p, g, gs, e) {
    var o = dir > 0 ? lr(g, gs, c) : 1 - lr(g, gs, c), u = (p - o * 0.42) / 0.5;
    if (u <= 0) return null;
    if (u >= 0.45) return HIDE;
    var lean = Math.sin(PI * Math.min(1, u / 0.45)), fl = rand(sd, g.i, e.step, 322);
    return { skew: -dir * 22 * lean, dx: dir * sz * 0.06 * lean, color: warm,
      a: u > 0.3 ? (1 - (u - 0.3) / 0.15) * (fl < 0.5 ? 1 : 0.6) : 0.65 + 0.35 * fl, s: 1 + 0.04 * lean };
  };
});

reg('crumpleOut', 'src/11p_exitB.js', function (c) {
  var sd = seedOf(c), gs0 = V.glyphs(c, c.node), b = V.bounds(gs0), ox = b.cx, oy = b.cy;
  var bg = c.sc.bg || '#101010', c0 = c.node.color || c.sc.fg, dir = cutBit(c, 21) ? 1 : -1;
  return function (p, g, gs, e) {
    if (p <= 0) return null;
    var g1 = E.outBack(cl(p / 0.15), 1.6), g2 = E.outBack(cl((p - 0.17) / 0.15), 1.6), g3 = E.outBack(cl((p - 0.34) / 0.15), 1.6);
    var cr = cl(0.45 * g1 + 0.3 * g2 + 0.25 * g3, 0, 1.08), k = 1 - 0.93 * Math.min(1, cr);
    var v = cl((p - 0.5) / 0.5), spin = dir * (cr * 25 + 620 * v * v);
    var tx = dir * e.W * 0.42 * v, ty = -e.H * 0.8 * v + e.H * 1.75 * v * v, alpha = 1 - H.smoothstep(0.88, 1, p);
    if (alpha <= 0.005) return HIDE;
    var px = gcx(g, c.node) - ox, py = gcy(g, c.node) - oy;
    var jx = rs(sd, g.i, 26) * e.size * 0.22, jy = rs(sd, g.i, 27) * e.size * 0.22;
    var n = rot2(px * k + jx * cr, py * k + jy * cr, spin);
    var r1 = rand(sd, g.i, 28), r2 = rand(sd, g.i, 29);
    return { dx: n[0] - px + tx, dy: n[1] - py + ty, rot: spin + rs(sd, g.i, 30) * 170 * cr,
      s: Math.max(0.04, 1 - 0.55 * Math.min(1, cr)), sx: 1 - 0.35 * r1 * cr, sy: 1 - 0.35 * r2 * cr,
      color: r1 < 0.45 ? H.mixHex(c0, bg, 0.3 * Math.min(1, cr)) : null, a: alpha };
  };
});

reg('deflateOut', 'src/11p_exitB.js', function (c) {
  var sd = seedOf(c);
  return function (p, g, gs, e) {
    var q = win(p, rand(sd, g.i, 151) * 0.8, 0.4);
    if (q <= 0) return null;
    if (q >= 0.97) return HIDE;
    if (q < 0.16) {
      var u0 = q / 0.16;
      return { s: 1 + 0.16 * oCubic(u0), sx: 1 + 0.05 * Math.sin(u0 * 25), sy: 1 - 0.05 * Math.sin(u0 * 25), rot: rs(sd, g.i, 152) * 4 * u0 };
    }
    var u = (q - 0.16) / 0.81, th0 = rand(sd, g.i, 153) * TAU, x = 0, y = 0, th = th0;
    for (var k = 0; k < 14; k++) {
      var t = (k + 0.5) / 14 * u;
      th = th0 + 7 * Math.sin(t * 5 * PI + (sd + g.i * 7)) + 3 * t;
      var v = e.size * 7.5 * (0.5 + t) * (u / 14);
      x += Math.cos(th) * v; y += Math.sin(th) * v;
    }
    var wob = Math.sin(u * 70) * 0.14 * (1 - u);
    return { dx: x, dy: y, rot: (th - th0) / DEG * 0.5, s: Math.max(0.03, 1.16 * (1 - Math.pow(u, 1.3))), sx: 1 + wob, sy: 1 - wob };
  };
});

regPost('eraserOut', 'src/11p_exitB.js', function (c) {
  var sz = c.node.size, vert = !!c.node.vertical, acc = H.accCol(c.sc), felt = H.mixHex(acc, c.sc.bg, 0.45), rng = outRange(c);
  function laneGeo(p, b) {
    var x0 = b.x0 - sz * 0.12, y0 = b.y0 - sz * 0.12, w = b.w + sz * 0.24, h = b.h + sz * 0.24;
    var span = vert ? w : h, len = vert ? h : w, K = cl(Math.round(span / (sz * 0.7)), 2, 10), lh = span / K, ew = sz * 0.8;
    var leg = len + ew, pos = cl(p / 0.9) * K * leg, lane = Math.min(K - 1, Math.floor(pos / leg)), along = pos - lane * leg - ew / 2;
    function fwd(j) { return (j & 1) === 0; }
    function laneR(j, s0, s1) {
      var a0 = vert ? (x0 + w) - (j + 1) * lh : y0 + j * lh, L0 = vert ? y0 : x0;
      var t0 = fwd(j) ? L0 + s0 : L0 + len - s1, t1 = fwd(j) ? L0 + s1 : L0 + len - s0;
      return vert ? [a0, t0, a0 + lh, t1] : [t0, a0, t1, a0 + lh];
    }
    var cut = cl(along + ew * 0.3, 0, len), keep = [];
    if (along + ew * 0.3 < len + 0.5) keep.push(laneR(lane, cut, len));
    for (var j = lane + 1; j < K; j++) keep.push(laneR(j, 0, len));
    var ec = cl(along, -ew / 2, len + ew / 2), er = laneR(lane, ec - ew / 2, ec + ew / 2);
    return { keep: keep, er: er, ew: ew, lh: lh, fwd: fwd(lane) };
  }
  applyExitWindowClip(c, false, function (p, b) {
    var G0 = laneGeo(p, b);
    return G0.keep.map(function (r) { return V.polygon(r[0] - 0.5, r[1] - 0.5, r[2] + 0.5, r[3] + 0.5); });
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimary(c, gs)) return;
      var loc = V.local(c, c.node, 'Eraser'), b = lineBounds(gs), G0 = laneGeo(0.05, b);
      var w = G0.er[2] - G0.er[0], h = G0.er[3] - G0.er[1];
      addLocalShape(c, loc, rng, 'Body', H.roundRectCmds(0, 0, w, h, Math.min(w, h) * 0.18), { fill: acc, alpha: 1 }, function (p) {
        var G1 = laneGeo(p, b), eA = 1 - H.smoothstep(0.9, 1, p);
        return { 'position.x': (G1.er[0] + G1.er[2]) / 2, 'position.y': -(G1.er[1] + G1.er[3]) / 2, alpha: p > 0 ? eA : 0 };
      });
      addLocalShape(c, loc, rng, 'Felt', H.roundRectCmds(0, 0, vert ? w : w * 0.3, vert ? h * 0.3 : h, Math.min(w, h) * 0.12), { fill: felt, alpha: 1 }, function (p) {
        var G1 = laneGeo(p, b), eA = 1 - H.smoothstep(0.9, 1, p), cx = (G1.er[0] + G1.er[2]) / 2, cy = (G1.er[1] + G1.er[3]) / 2;
        if (vert) cy += (G1.fwd ? -h * 0.35 : h * 0.35);
        else cx += (G1.fwd ? -w * 0.35 : w * 0.35);
        return { 'position.x': cx, 'position.y': -cy, alpha: p > 0 ? eA : 0 };
      });
    });
  }
});

regPost('floodOut', 'src/11p_exitB.js', function (c) {
  var sz = c.node.size, acc = H.accCol(c.sc), H0 = c.comp.height, sd = seedOf(c), rng = outRange(c);
  function surfPts(p, b, f) {
    var t = f / c.comp.fps, x0 = b.x0 - sz * 0.35, x1 = b.x1 + sz * 0.35, y0 = b.y0 - sz * 0.15, y1 = b.y1 + sz * 0.15;
    var A = sz * 0.07, Y = mix(y1 + A * 2, y0 - A * 3, ioSine(cl(p / 0.9))), pts = [];
    for (var k = 0; k <= 14; k++) {
      var x = mix(x0, x1, k / 14);
      pts.push([x, Y + A * Math.sin(x / sz * 4.2 + t * 5) + A * 0.5 * Math.sin(x / sz * 9.5 - t * 7.3)]);
    }
    return { pts: pts, x0: x0, x1: x1, Y: Y, A: A, y0: y0, y1: y1 };
  }
  applyExitWindowClip(c, false, function (p, b, f) {
    var S0 = surfPts(p, b, f), poly = S0.pts.slice();
    poly.push([S0.x1, S0.y0 - H0 * 2], [S0.x0, S0.y0 - H0 * 2]);
    return [poly];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimary(c, gs)) return;
      var loc = V.local(c, c.node, 'Flood'), b = lineBounds(gs), w = b.w + sz * 0.7;
      addLocalShape(c, loc, rng, 'WaterLine', G.rect(-w / 2, -Math.max(1.5, sz * 0.025), w, Math.max(3, sz * 0.05)), { fill: acc, alpha: 1 }, function (p, f) {
        var S0 = surfPts(p, b, f), fa = 1 - H.smoothstep(0.82, 0.98, p);
        return { 'position.x': (S0.x0 + S0.x1) / 2, 'position.y': -S0.Y, alpha: p > 0 ? fa : 0 };
      });
      for (var j = 0; j < 6; j++) {
        (function (jj) {
          addLocalShape(c, loc, rng, 'Bubble_' + jj, G.ellipse(0, 0, Math.max(1.5, sz * 0.045), Math.max(1.5, sz * 0.045)), { stroke: acc, width: Math.max(1, sz * 0.012), alpha: 1 }, function (p, f) {
            var S0 = surfPts(p, b, f), ph = (p * 2.2 + rand(sd, jj, 292)) % 1;
            var y = S0.Y + S0.A + (1 - ph) * sz * 0.9, fa = 1 - H.smoothstep(0.82, 0.98, p);
            if (p <= 0 || y > S0.y1 + sz * 0.3) return { alpha: 0 };
            return { 'position.x': mix(S0.x0, S0.x1, rand(sd, jj, 291)) + Math.sin(ph * 9 + jj) * sz * 0.03,
              'position.y': -y, 'scale.x': 0.5 + ph, 'scale.y': 0.5 + ph, alpha: 0.7 * fa * (1 - ph * 0.5) };
          });
        })(j);
      }
    });
  }
});

reg('flutterOut', 'src/11p_exitB.js', function (c) {
  var sd = seedOf(c), c0 = c.node.color || c.sc.fg, back = H.mixHex(c0, c.sc.bg, 0.45);
  return function (p, g, gs, e) {
    var q = win(p, rand(sd, g.i, 241), 0.5);
    if (q <= 0) return null;
    if (q >= 1) return HIDE;
    var ph = rand(sd, g.i, 242) * TAU, w = 7 + 4 * rand(sd, g.i, 243), amp = Math.min(1, q * 4);
    var D = e.H * 0.75 + e.size * 1.2, sway = Math.sin(q * w + ph) * e.size * 0.55 * amp, L = D * (0.25 * q + 0.75 * Math.pow(q, 1.6));
    var flip = Math.cos(q * (9 + 5 * rand(sd, g.i, 244)) + ph * 0.5), shiver = q < 0.08 ? Math.sin(q * 300) * 6 * (1 - q / 0.08) : 0;
    var sx = mix(1, flip, amp);
    return { dx: sway, dy: L, rot: Math.cos(q * w + ph) * 28 * amp + shiver, sx: Math.abs(sx) < 0.04 ? (sx < 0 ? -0.04 : 0.04) : sx, color: flip < 0 && amp > 0.5 ? back : null };
  };
});

regPost('glassBreak', 'src/11p_exitB.js', function (c) {
  var sz = c.node.size, sd = seedOf(c), H0 = c.comp.height, acc = H.accCol(c.sc), rng = outRange(c);
  function makeShards(b) {
    var bx0 = b.x0 - sz * 0.12, bx1 = b.x1 + sz * 0.12, by0 = b.y0 - sz * 0.12, by1 = b.y1 + sz * 0.12;
    var ix = b.cx + rs(sd, 151) * (bx1 - bx0) * 0.2, iy = b.cy + rs(sd, 152) * (by1 - by0) * 0.12;
    var K = cl(Math.round(5 + b.w / Math.max(1, b.h) * 0.8), 5, 8), B = [], R = [], shards = [];
    for (var k = 0; k < K; k++) {
      var a = (k + 0.35 * rs(sd, k, 153)) / K * TAU, cs = Math.cos(a), sn = Math.sin(a);
      var tx = cs > 0 ? (bx1 - ix) / cs : cs < 0 ? (bx0 - ix) / cs : 1e9;
      var ty = sn > 0 ? (by1 - iy) / sn : sn < 0 ? (by0 - iy) / sn : 1e9;
      var tt = Math.min(tx, ty), f = 0.3 + 0.25 * rand(sd, k, 154);
      B.push([ix + cs * tt, iy + sn * tt]); R.push([ix + cs * tt * f, iy + sn * tt * f]);
    }
    for (var k2 = 0; k2 < K; k2++) {
      var k3 = (k2 + 1) % K;
      shards.push([[ix, iy], R[k2], R[k3]]);
      shards.push([R[k2], B[k2], B[k3], R[k3]]);
    }
    return { ix: ix, iy: iy, B: B, shards: shards, w: bx1 - bx0, h: by1 - by0 };
  }
  applyExitSliceTwins(c, function (b) {
    var G0 = makeShards(b);
    return G0.shards.map(function (poly, j) {
      var cx = 0, cy = 0; poly.forEach(function (q) { cx += q[0]; cy += q[1]; }); cx /= poly.length; cy /= poly.length;
      var d = rand(sd, j, 155) * 0.3 + (j & 1 ? 0 : 0.12);
      return {
        fixed: false, px: cx, py: cy,
        sample: function (p) {
          var v = cl((p - 0.18) / 0.82), u = cl((v - d) / (1 - d));
          if (u <= 0) return { dx: 0, dy: 0, rot: 0, a: 1 };
          return {
            dx: (cx - G0.ix) / Math.max(1, G0.w) * sz * 1.2 * u,
            dy: (cy - G0.iy) / Math.max(1, G0.h) * sz * 0.5 * u + H0 * 1.1 * u * u,
            rot: rs(sd, j, 156) * 120 * u * u, a: 1 - H.smoothstep(0.75, 1, u)
          };
        },
        clip: function () { return [poly]; }
      };
    });
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var loc = V.local(c, c.node, 'GlassCracks'), G0 = makeShards(lineBounds(gs)), lw = Math.max(1.5, sz * 0.032), bg = c.sc.bg;
      G0.B.forEach(function (pt, k) {
        addLocalShape(c, loc, rng, 'Crack_' + k, V.commands([[G0.ix, G0.iy], pt], false), { stroke: bg, width: lw, alpha: 1 }, function (p) {
          var crack = cl(p / 0.2), v = cl((p - 0.18) / 0.82);
          if (p <= 0 || v >= 0.25) return { alpha: 0 };
          return { 'scale.x': crack, 'scale.y': crack, alpha: v > 0 ? 1 - v * 4 : 1 };
        });
      });
      addLocalShape(c, loc, rng, 'ImpactFlash', G.ellipse(G0.ix, -G0.iy, sz * 0.22, sz * 0.22), { fill: acc, alpha: 1 }, function (p) {
        var crack = cl(p / 0.2);
        return (p > 0 && p < 0.2) ? { 'scale.x': 0.3 + crack, 'scale.y': 0.3 + crack, alpha: 0.5 * (1 - crack) } : { alpha: 0 };
      });
    });
  }
});

regPost('halftoneOut', 'src/11p_exitB.js', function (c) {
  var sz = c.node.size, vert = !!c.node.vertical, rev = cutBit(c, 51);
  function dotPoly(cx, cy, r) {
    var pts = [];
    for (var k = 0; k < 8; k++) { var a = k / 8 * TAU; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return pts;
  }
  applyExitWindowClip(c, false, function (p, b) {
    var x0 = b.x0 - sz * 0.1, y0 = b.y0 - sz * 0.1, w = b.w + sz * 0.2, h = b.h + sz * 0.2;
    var cs = Math.max(3, sz * 0.15);
    while ((w / cs + 2) * (h / (cs * 0.866) + 2) > 90) cs *= 1.15;
    var rows = Math.ceil(h / (cs * 0.866)) + 1, cols = Math.ceil(w / cs) + 2, R0 = cs * 0.64, polys = [];
    for (var r = 0; r < rows; r++) for (var q = 0; q < cols; q++) {
      var cx = x0 + (q + (r & 1) * 0.5 - 0.5) * cs, cy = y0 + r * cs * 0.866;
      var pos = vert ? (cy - y0) / h * 0.8 + (cx - x0) / w * 0.2 : (cx - x0) / w * 0.8 + (cy - y0) / h * 0.2;
      if (rev) pos = 1 - pos;
      var rr = R0 * (1 - ioSine(cl(p * 1.55 - pos * 0.55)));
      if (rr > 0.4) polys.push(dotPoly(cx, cy, rr));
    }
    return polys;
  });
});

regPost('hazeOut', 'src/11p_exitB.js', function (c) {
  var sz = c.node.size, vert = !!c.node.vertical, acc = H.accCol(c.sc), col = H.mixHex(c.node.color || c.sc.fg, acc, 0.3);
  applyExitSliceTwins(c, function (b) {
    var x0 = b.x0 - sz * 0.3, x1 = b.x1 + sz * 0.3, y0 = b.y0 - sz * 0.3, y1 = b.y1 + sz * 0.3;
    var span = vert ? (x1 - x0) : (y1 - y0), n = cl(Math.ceil(span / (sz * 0.16)), 5, 12), step = span / n, specs = [];
    for (var j = 0; j < n; j++) {
      (function (jj) {
        var pos = (vert ? x0 : y0) + (jj + 0.5) * step, band = [(vert ? x0 : y0) + jj * step, (vert ? x0 : y0) + (jj + 1) * step + 0.5];
        specs.push({
          fixed: false,
          sample: function (p, f) {
            var e = iQuad(p), t = f / c.comp.fps, A = sz * (0.02 + 0.26 * ioSine(p));
            var wave = A * Math.sin(pos / sz * 6.5 - t * 12) * (0.6 + 0.4 * Math.sin(pos / sz * 2.3 + t * 5));
            return {
              dx: vert ? 0 : wave, dy: -sz * 0.3 * e + (vert ? wave : 0),
              sx: 1 - 0.05 * e, sy: 1 + 0.3 * e, a: 1 - H.smoothstep(0.3, 0.94, p)
            };
          },
          clip: function () { return [vert ? V.polygon(band[0], y0 - sz, band[1], y1 + sz) : V.polygon(x0 - sz, band[0], x1 + sz, band[1])]; }
        });
      })(j);
    }
    return specs;
  });
  post(c, function (graph, ids) {
    var rng = outRange(c);
    ids.forEach(function (tid) { if (rng.end - 1 > rng.start) setKey(graph, tid, 'material.materialColor', rng.start, col, 2); });
  });
});

reg('lampOff', 'src/11p_exitB.js', function (c) {
  var sd = seedOf(c), c0 = c.node.color || c.sc.fg, bg = c.sc.bg, dark = darkBg(c);
  var dimC = H.mixHex(c0, bg, 0.78), hot = dark ? H.mixHex(c0, '#ffffff', 0.5) : c0, sz = c.node.size;
  return function (p, g, gs, e) {
    var q = (p - rand(sd, g.i, 171) * 0.46) / 0.36;
    if (q <= 0) return { blur: dark ? sz * 0.14 : 0 };
    if (q >= 1) return HIDE;
    if (q > 0.55) return { color: dimC, a: 1 - (q - 0.55) / 0.45, blur: 0 };
    var off = rand(sd, g.i, e.step, 172) < 0.3 + 0.7 * (q / 0.55);
    return off ? { color: dimC, blur: 0 } : { color: hot, blur: dark ? sz * 0.14 : 0 };
  };
});

reg('matrixOut', 'src/11p_exitB.js', function (c) {
  var sd = seedOf(c), sz = c.node.size, acc = H.accCol(c.sc), c0 = c.node.color || c.sc.fg;
  var head = darkBg(c) ? H.mixHex(c0, '#ffffff', 0.4) : c0, D = c.comp.height * 0.8 + sz * 1.2;
  function rch(i, k, st2) { return HALF_POOL[Math.floor(rand(sd, i, k, Math.floor(st2 / 2), 202) * HALF_POOL.length)]; }
  [1, 2, 3, 4].forEach(function (k) {
    (c.node._jzTwins = c.node._jzTwins || []).push({
      label: 'MatrixExitTrail ' + k, below: true,
      setup: function (graph, clone, src, g) {
        clone.attrs['material.materialColor'] = acc; clone.keys = {};
        var rng = outRange(c), pitch = g.h * 0.92;
        C.sample(graph, clone.id, clone.start, clone.end, function (f) {
          if (f < rng.start) return { alpha: 0 };
          var q = win(poutAt(c, f), rand(sd, g.i, 201) * 0.9, 0.5), u = cl((q - 0.22) / 0.78), L = D * Math.pow(u, 1.7);
          if (q < 0.22 || q >= 1 || L < k * pitch * 0.6) return { alpha: 0 };
          return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0) - (L - k * pitch),
            rotation: -(g.r90 ? 90 : 0), alpha: (1 - k / 5) * (1 - 0.5 * u) };
        });
      }
    });
  });
  return function (p, g, gs, e) {
    var q = win(p, rand(sd, g.i, 201) * 0.9, 0.5);
    if (q <= 0) return null;
    if (q >= 1) return HIDE;
    var u = cl((q - 0.22) / 0.78), L = D * Math.pow(u, 1.7);
    if (q < 0.22) return rand(sd, g.i, e.step, 203) < q / 0.22 + 0.2 ? { ch: rch(g.i, 0, e.step), color: acc } : null;
    return { dy: L, ch: rch(g.i, 0, e.step), color: head };
  };
});

/* mosaicOut: quantized tile-grid window clip + crisp vector mosaic tiles overlay (no DOM canvas needed) */
regPost('mosaicOut', 'src/11p_exitB.js', function (c) {
  var sz = c.node.size, sd = seedOf(c), rng = outRange(c), col = c.node.color || c.sc.fg, acc = H.accCol(c.sc);
  function mosaicCells(p, b) {
    var blk = Math.max(4, sz * (0.04 + 0.28 * Math.pow(p, 1.4))), x0 = b.x0 - sz * 0.1, y0 = b.y0 - sz * 0.1;
    var w = b.w + sz * 0.2, h = b.h + sz * 0.2, nx = cl(Math.ceil(w / blk), 3, 12), ny = cl(Math.ceil(h / blk), 2, 6);
    var cw = w / nx, ch = h / ny, polys = [];
    for (var ix = 0; ix < nx; ix++) for (var iy = 0; iy < ny; iy++) {
      if (rand(sd, ix, iy, Math.floor(p * 12), 401) > p * 1.1) {
        var cx = x0 + ix * cw, cy = y0 + iy * ch;
        polys.push(V.polygon(cx, cy, cx + cw * (1 - 0.35 * p), cy + ch * (1 - 0.35 * p)));
      }
    }
    return polys;
  }
  applyExitWindowClip(c, false, function (p, b) { return mosaicCells(p, b); });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimary(c, gs)) return;
      var loc = V.local(c, c.node, 'MosaicBlocks'), b = lineBounds(gs);
      for (var k = 0; k < 10; k++) {
        (function (kk) {
          var s0 = Math.max(4, sz * 0.22), cx = mix(b.x0, b.x1, rand(sd, kk, 405)), cy = mix(b.y0, b.y1, rand(sd, kk, 406));
          addLocalShape(c, loc, rng, 'Tile_' + kk, G.rect(-s0 / 2, -s0 / 2, s0, s0), { fill: kk % 3 === 0 ? acc : col, alpha: 1 }, function (p) {
            var q = cl((p - 0.1) / 0.85), fade = 1 - H.smoothstep(0.55, 0.97, p);
            if (p <= 0.1 || rand(sd, kk, Math.floor(p * 10), 407) < 0.35) return { alpha: 0 };
            return { 'position.x': cx, 'position.y': -cy, 'scale.x': 0.4 + q * 1.1, 'scale.y': 0.4 + q * 1.1, alpha: 0.75 * fade };
          });
        })(k);
      }
    });
  }
});

regPost('overexposeOut', 'src/11p_exitB.js', function (c) {
  var dark = darkBg(c), c0 = c.node.color || c.sc.fg, sz = c.node.size, acc = c.sc.accent || '#ff5577';
  var hot = dark ? '#ffffff' : c.sc.bg, glow = dark ? H.mixHex(acc, '#ffffff', 0.45) : acc, rng = outRange(c);
  applyExitWholeRig(c, function (p, b) {
    var a = iQuad(cl(p / 0.5)), e = oCubic(cl(p / 0.7)), s = 1 + 0.07 * e, fade = 1 - ioSine(cl((p - 0.38) / 0.62));
    return { ax: b.cx, ay: b.cy, sx: s, sy: s, a: fade, blur: sz * (0.05 + 0.4 * e), color: H.mixHex(c0, hot, a) };
  });
  (c.node._jzTwins = c.node._jzTwins || []).push({
    label: 'OverexposeBloom', below: true,
    setup: function (graph, clone, src, g) {
      clone.attrs['material.materialColor'] = glow; clone.keys = {};
      C.sample(graph, clone.id, clone.start, clone.end, function (f) {
        if (f < rng.start) return { alpha: 0 };
        var p = poutAt(c, f), e = oCubic(cl(p / 0.7)), fade = 1 - ioSine(cl((p - 0.38) / 0.62));
        return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0),
          rotation: -(g.r90 ? 90 : 0), 'scale.x': 1 + 0.09 * e, 'scale.y': 1 + 0.09 * e, alpha: (p > 0.12 ? 0.65 * fade : 0) };
      });
    }
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimary(c, gs)) return;
      var loc = V.local(c, c.node, 'Flare'), b = lineBounds(gs), w0 = Math.max(sz * 2, b.w);
      [[0.18, 0.14], [0.06, 0.35], [0.018, 0.95]].forEach(function (sp, idx) {
        addLocalShape(c, loc, rng, 'Flare_' + idx, G.rect(-w0 / 2, -sz * sp[0] / 2, w0, sz * sp[0]), { fill: glow, alpha: 1 }, function (p) {
          var e = oCubic(cl(p / 0.7)), st2 = Math.sin(PI * cl((p - 0.12) / 0.88));
          return { 'position.x': b.cx, 'position.y': -b.cy, 'scale.x': (0.8 + 0.9 * e) * (1 + idx * 0.25), alpha: p > 0.12 ? sp[1] * st2 : 0 };
        });
      });
    });
  }
});

regPost('rgbSplitOut', 'src/11p_exitB.js', function (c) {
  var sc = c.sc, sz = c.node.size, sd = seedOf(c), rng = outRange(c);
  var cols = [sc.ghostA || sc.accent || '#ff4466', sc.ghostB || sc.fg || '#44ddff', sc.accent || '#ffffff'];
  var dirs = [[-1, -0.3], [1, 0.25], [0.15, 0.9]];
  [0, 1, 2].forEach(function (k) {
    (c.node._jzTwins = c.node._jzTwins || []).push({
      label: 'RGBSplitOut_' + k, below: true,
      setup: function (graph, clone, src, g) {
        clone.attrs['material.materialColor'] = cols[k]; clone.keys = {};
        C.sample(graph, clone.id, clone.start, clone.end, function (f) {
          if (f < rng.start) return { alpha: 0 };
          var p = poutAt(c, f), e = iCubic(p), sp = sz * (0.05 + 1.5 * e), step = Math.floor(f * 24 / c.comp.fps);
          var ca = H.smoothstep(0, 0.1, p) * (1 - H.smoothstep(0.55, 0.96, p));
          var jx = rs(sd, step, k, 271) * sz * 0.06 * (0.3 + e), jy = rs(sd, step, k, 272) * sz * 0.015;
          var sc = 1 + 0.08 * k * e;
          return { 'position.x': g.x + (g.vx || 0) + dirs[k][0] * sp + jx, 'position.y': -g.y - (g.vy || 0) - (dirs[k][1] * sp * 0.5 + jy),
            rotation: -(g.r90 ? 90 : 0), 'scale.x': sc, 'scale.y': sc, alpha: ca * (k === 2 ? 0.8 : 0.9) };
        });
      }
    });
  });
  applyExitWholeRig(c, function (p) { return { a: 1 - H.smoothstep(0.05, 0.35, p) }; });
});

reg('rocketOff', 'src/11p_exitB.js', function (c) {
  var sd = seedOf(c), sz = c.node.size, acc = H.accCol(c.sc), sub = c.sc.sub || c.sc.fg, D = c.comp.height * 0.7 + sz * 1.6, rng = outRange(c);
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimary(c, gs)) return;
      var loc = V.local(c, c.node, 'RocketPlumes');
      gs.slice(0, 12).forEach(function (g) {
        if (isBlank(g.ch)) return;
        var d0 = rand(sd, g.i, 111) * 0.85;
        addLocalShape(c, loc, rng, 'Flame_' + g.i, [['M', -sz * 0.12, 0], ['L', sz * 0.12, 0], ['L', 0, -sz * 0.55], ['Z']], { fill: acc, alpha: 1 }, function (p) {
          var q = win(p, d0, 0.55);
          if (q < 0.3 || q >= 1) return { alpha: 0 };
          var u = (q - 0.3) / 0.7, L = D * Math.pow(u, 2.3), by = gcy(g, c.node) - L + g.h * 0.5;
          return { 'position.x': gcx(g, c.node), 'position.y': -by, 'scale.y': 0.5 + Math.min(2, L / sz), alpha: 1 - u * 0.8 };
        });
        [-1, 1].forEach(function (s2) {
          addLocalShape(c, loc, rng, 'Smoke_' + g.i + '_' + s2, G.ellipse(0, 0, sz * 0.2, sz * 0.2), { fill: sub, alpha: 1 }, function (p) {
            var q = win(p, d0, 0.55);
            if (q < 0.3 || q >= 1) return { alpha: 0 };
            var u = (q - 0.3) / 0.7;
            return { 'position.x': gcx(g, c.node) + s2 * sz * 0.25 * (0.4 + u), 'position.y': -(gcy(g, c.node) + g.h * 0.5),
              'scale.x': 0.4 + u, 'scale.y': 0.4 + u, alpha: 0.35 * (1 - u) };
          });
        });
      });
    });
  }
  return function (p, g, gs, e) {
    var q = win(p, rand(sd, g.i, 111) * 0.85, 0.55);
    if (q <= 0) return null;
    if (q >= 1) return HIDE;
    var hh = g.h / 2;
    if (q < 0.3) {
      var sq = Math.sin((q / 0.3) * PI / 2), k = 1 - 0.22 * sq, w = 1 + 0.12 * sq;
      return { dy: (1 - k) * hh, dx: rs(sd, g.i, e.step, 112) * sz * 0.02 * (q / 0.3), sx: g.r90 ? k : w, sy: g.r90 ? w : k };
    }
    var u = (q - 0.3) / 0.7, L = D * Math.pow(u, 2.3), st2 = 1 + Math.min(0.8, 3 * u * u);
    return { dy: -L, sx: g.r90 ? st2 : 1 - 0.12 * (st2 - 1), sy: g.r90 ? 1 - 0.12 * (st2 - 1) : st2 };
  };
});

regPost('rollUpOut', 'src/11p_exitB.js', function (c) {
  var sz = c.node.size, vert = !!c.node.vertical, rev = cutBit(c, 221), rng = outRange(c);
  var c0 = c.node.color || c.sc.fg, bg = c.sc.bg, back = H.mixHex(c0, bg, 0.55), hi = H.mixHex(c0, bg, 0.25);
  function rollGeo(p, b) {
    var a0 = vert ? b.y0 - sz * 0.08 : b.x0 - sz * 0.08, a1 = vert ? b.y1 + sz * 0.08 : b.x1 + sz * 0.08;
    var r0 = sz * 0.26, e = ioSine(cl(p / 0.86)), Xr = rev ? mix(a1 + r0, a0 - r0 * 3, e) : mix(a0 - r0, a1 + r0 * 3, e);
    var rolled = rev ? Math.max(0, a1 - Xr) : Math.max(0, Xr - a0), r = r0 * Math.sqrt(1 + rolled / (sz * 2));
    var sg = rev ? -1 : 1, edge = Xr + sg * r;
    return { a0: a0, a1: a1, Xr: Xr, r: r, sg: sg, edge: edge };
  }
  applyExitWindowClip(c, false, function (p, b) {
    var G0 = rollGeo(p, b), far = sz * 40 + b.w + b.h;
    if (vert) return [V.polygon(b.x0 - sz, G0.sg > 0 ? G0.edge : -far, b.x1 + sz, G0.sg > 0 ? far : G0.edge)];
    return [V.polygon(G0.sg > 0 ? G0.edge : -far, b.y0 - sz, G0.sg > 0 ? far : G0.edge, b.y1 + sz)];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimary(c, gs)) return;
      var loc = V.local(c, c.node, 'PaperRoll'), b = lineBounds(gs), cross = (vert ? b.w : b.h) + sz * 0.12;
      [[back, 1], [hi, 0.25]].forEach(function (sp, idx) {
        addLocalShape(c, loc, rng, 'Roll_' + idx, G.rect(-sz * 0.26, -cross / 2, sz * 0.52, cross), { fill: sp[0], alpha: 1 }, function (p) {
          var G0 = rollGeo(p, b), lift = iCubic(cl((p - 0.8) / 0.18)), fa = 1 - H.smoothstep(0.82, 0.98, p);
          var sx = Math.max(0.01, (G0.r / (sz * 0.26)) * (1 - lift) * (idx ? 0.3 : 1)), sy = Math.max(0.01, 1 - lift);
          var pos = vert ? [b.cx, G0.Xr] : [G0.Xr, b.cy];
          return { 'position.x': pos[0], 'position.y': -pos[1], rotation: vert ? -90 : 0, 'scale.x': sx, 'scale.y': sy, alpha: p > 0 ? fa : 0 };
        });
      });
    });
  }
});

reg('sandOut', 'src/11p_exitB.js', function (c) {
  var sd = seedOf(c), gs0 = V.glyphs(c, c.node), b = V.bounds(gs0), vert = !!c.node.vertical, dir = cutBit(c, 71) ? 1 : -1;
  var single = isSingle(c, gs0), og = single ? cl((+c.node.mi || 0) / Math.max(1, cutN(c) - 1)) : 0;
  var D = c.node.size * 3 + c.comp.width * 0.18;
  return function (p, g, gs, e) {
    var pos = vert ? (gcy(g, c.node) - b.y0) / Math.max(1, b.h) : (gcx(g, c.node) - b.x0) / Math.max(1, b.w);
    if (!vert && dir > 0) pos = 1 - pos;
    if (single) pos = 0.8 * (dir > 0 ? 1 - og : og) + 0.2 * pos;
    var x = (p - cl(pos) * 0.5) / 0.5;
    if (x <= 0) return null;
    if (x >= 1) return HIDE;
    var k1 = rand(sd, g.i, 82), along = D * x * x, lift = e.size * 0.55 * x + Math.sin(x * 5 + k1 * 6) * e.size * 0.07 * x;
    return { dx: dir * along, dy: -lift, a: 1 - x, s: 1 - 0.4 * x, sx: 1 + x, blur: e.size * 0.05 * x };
  };
});

regPost('scanOut', 'src/11p_exitB.js', function (c) {
  var sz = c.node.size, acc = H.accCol(c.sc), rng = outRange(c), far = sz * 20;
  applyExitWindowClip(c, false, function (p, b) {
    var y0 = b.y0 - sz * 0.3, y1 = b.y1 + sz * 0.3, h = y1 - y0, n = cl(Math.ceil(h / Math.max(3, sz * 0.09)), 5, 24), ph = h / n;
    var L = Math.max(sz * 0.9, h * 0.3), ys = mix(y0 - sz * 0.02, y1 + L, p), polys = [], lastScan = -1;
    for (var j = 0; j < n; j++) {
      var yc = y0 + (j + 0.5) * ph, a = cl((ys - yc) / L);
      if (a <= 0) break;
      lastScan = j;
      var keep = (j & 1) ? 1 - cl(a / 0.4) : 1 - iQuad(a), hh = ph * keep * 0.8;
      if (hh > 0.25) polys.push(V.polygon(b.x0 - far, yc - hh / 2, b.x1 + far, yc + hh / 2));
    }
    var yU = y0 + (lastScan + 1) * ph;
    if (yU < y1) polys.push(V.polygon(b.x0 - far, yU, b.x1 + far, y1 + 2));
    return polys;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimary(c, gs)) return;
      var loc = V.local(c, c.node, 'ScanBeam'), b = lineBounds(gs), w = b.w + sz * 0.8;
      addLocalShape(c, loc, rng, 'Beam', G.rect(-w / 2, -Math.max(1.5, sz * 0.03), w, Math.max(3, sz * 0.06)), { fill: acc, alpha: 1 }, function (p) {
        var y0 = b.y0 - sz * 0.3, y1 = b.y1 + sz * 0.3, L = Math.max(sz * 0.9, (y1 - y0) * 0.3), ys = mix(y0 - sz * 0.02, y1 + L, p);
        return { 'position.x': b.cx, 'position.y': -ys, alpha: (p > 0 && p < 0.98) ? 1 - H.smoothstep(0.85, 1, p) : 0 };
      });
    });
  }
});

regPost('scorchOut', 'src/11p_exitB.js', function (c) {
  var vert = !!c.node.vertical, sz = c.node.size, sd = seedOf(c), acc = H.accCol(c.sc), rng = outRange(c);
  var dir = vert ? [0.22, 1] : [1, 0.22], dl = Math.hypot(dir[0], dir[1]);
  dir = [dir[0] / dl, dir[1] / dl];
  if (cutBit(c, 31)) dir = [-dir[0], -dir[1]];
  var tn = [-dir[1], dir[0]];
  function pt(u, w) { return [dir[0] * u + tn[0] * w, dir[1] * u + tn[1] * w]; }
  function edgePts(p, b, f) {
    var x0 = b.x0 - sz * 0.2, x1 = b.x1 + sz * 0.2, y0 = b.y0 - sz * 0.2, y1 = b.y1 + sz * 0.2;
    var cs = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
    var us = cs.map(function (q) { return q[0] * dir[0] + q[1] * dir[1]; });
    var ws = cs.map(function (q) { return q[0] * tn[0] + q[1] * tn[1]; });
    var u0 = Math.min.apply(null, us), u1 = Math.max.apply(null, us), w0 = Math.min.apply(null, ws), w1 = Math.max.apply(null, ws);
    var rough = sz * 0.2, band = sz * 0.4, s = mix(u0 - rough * 1.3, u1 + rough * 1.3 + band, ioSine(p)), t = f / c.comp.fps, edge = [];
    for (var k = 0; k <= 10; k++) {
      var w = mix(w0, w1, k / 10), u = s + rough * (0.75 * Math.sin(w / sz * 2.4 + sd) + 0.3 * Math.sin(w / sz * 8 + t * 6 + sd));
      edge.push([u, w]);
    }
    return { edge: edge, w0: w0, w1: w1, far: u1 + sz * 6, s: s };
  }
  applyExitWindowClip(c, false, function (p, b, f) {
    var E0 = edgePts(p, b, f), poly = E0.edge.map(function (q) { return pt(q[0], q[1]); });
    poly.push(pt(E0.far, E0.w1), pt(E0.far, E0.w0));
    return [poly];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimary(c, gs)) return;
      var loc = V.local(c, c.node, 'Scorch'), b = lineBounds(gs);
      var span = edgePts(0, b, rng.start), lenW = span.w1 - span.w0, ang = Math.atan2(tn[1], tn[0]) / DEG;
      addLocalShape(c, loc, rng, 'GlowEdge', G.rect(-lenW / 2, -Math.max(1.5, sz * 0.045), lenW, Math.max(3, sz * 0.09)), { fill: acc, alpha: 1 }, function (p, f) {
        var E0 = edgePts(p, b, f), mid = pt(E0.s, (E0.w0 + E0.w1) / 2), fa = 1 - H.smoothstep(0.86, 1, p);
        return { 'position.x': mid[0], 'position.y': -mid[1], rotation: -ang, alpha: (p > 0 && p < 0.99) ? fa : 0 };
      });
      for (var j = 0; j < 10; j++) {
        (function (jj) {
          addLocalShape(c, loc, rng, 'Ember_' + jj, G.ellipse(0, 0, Math.max(1, sz * 0.03), Math.max(1, sz * 0.03)), { fill: acc, alpha: 1 }, function (p, f) {
            var E0 = edgePts(p, b, f), t0 = rand(sd, jj, 341) * 0.85, age = (p - t0) / 0.28;
            if (age <= 0 || age >= 1) return { alpha: 0 };
            var w = mix(E0.w0, E0.w1, rand(sd, jj, 342)), basePt = pt(E0.s, w);
            return { 'position.x': basePt[0] - dir[0] * sz * 0.3 * age + Math.sin(age * 7 + jj) * sz * 0.06,
              'position.y': -(basePt[1] - dir[1] * sz * 0.3 * age - sz * 0.9 * age),
              'scale.x': 1 - age, 'scale.y': 1 - age, alpha: 1 - age };
          });
        })(j);
      }
    });
  }
});

regPost('scribbleOut', 'src/11p_exitB.js', function (c) {
  var sz = c.node.size, vert = !!c.node.vertical, acc = H.accCol(c.sc), sd = seedOf(c), rng = outRange(c);
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var loc = V.local(c, c.node, 'Scribble'), rows = V.spans(gs, vert);
      rows.slice(0, 4).forEach(function (L, li) {
        var a0 = L.a0 - sz * 0.15, a1 = L.a1 + sz * 0.15, half = sz * 0.45, pts = [], a = a0, k = 0;
        function P(aa, oo) { return vert ? [L.c + oo, aa] : [aa, L.c + oo]; }
        while (a < a1 && k < 28) {
          pts.push(P(a, Math.sin(a / sz * 1.3 + li) * half * 0.18 + (k & 1 ? 1 : -1) * half * (0.8 + 0.45 * rand(sd, li, k, 312))));
          a += sz * (0.28 + 0.18 * rand(sd, li, k, 311)); k++;
        }
        a = a1;
        while (a > a0 && k < 56) {
          pts.push(P(a, Math.sin(a / sz * 2.1 + li * 3) * half * 0.25 + (k & 1 ? 1 : -1) * half * (0.45 + 0.4 * rand(sd, li, k, 314))));
          a -= sz * (0.34 + 0.22 * rand(sd, li, k, 313)); k++;
        }
        var total = Math.max(1, pts.length - 1);
        for (var seg = 0; seg < total; seg++) {
          (function (ss, pA, pB) {
            addLocalShape(c, loc, rng, 'Scr_' + li + '_' + ss, V.commands([pA, pB], false),
              { stroke: acc, width: Math.max(1.5, sz * 0.14), alpha: 1 }, function (p) {
                var dr = ioSine(cl(p / 0.58)), sa = 1 - H.smoothstep(0.66, 0.97, p), lwScale = 1 - 0.7 * H.smoothstep(0.62, 0.95, p);
                return dr * total >= ss ? { alpha: sa, 'scale.y': lwScale } : { alpha: 0 };
              });
          })(seg, pts[seg], pts[seg + 1]);
        }
      });
    });
  }
  applyExitWholeRig(c, function (p) { return { a: 1 - H.smoothstep(0.45, 0.75, p) }; });
});

reg('shockOut', 'src/11p_exitB.js', function (c) {
  var sd = seedOf(c), gs0 = V.glyphs(c, c.node), b = V.bounds(gs0), sz = c.node.size, acc = H.accCol(c.sc);
  var Rmax = Math.hypot(b.w, b.h) / 2 + sz * 1.8, rng = outRange(c);
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimary(c, gs)) return;
      var loc = V.local(c, c.node, 'Shockwave');
      [1, 0.82].forEach(function (rk, idx) {
        addLocalShape(c, loc, rng, 'Ring_' + idx, G.ellipse(0, 0, Rmax * rk, Rmax * rk),
          { stroke: acc, width: Math.max(1.5, sz * (idx ? 0.025 : 0.08)), alpha: 1 }, function (p) {
            var r = oCubic(cl((p - 0.12) / 0.88)), fa = 1 - H.smoothstep(0.3, 1, p);
            if (r <= 0.01 || fa <= 0.01) return { alpha: 0 };
            return { 'position.x': b.cx, 'position.y': -b.cy, 'scale.x': r, 'scale.y': r, alpha: fa * (idx ? 0.6 : 1) };
          });
      });
    });
  }
  return function (p, g) {
    var pre = Math.sin(PI * cl(p / 0.16)) * (p < 0.16 ? 1 : 0), r = Rmax * oCubic(cl((p - 0.12) / 0.88));
    var dx = gcx(g, c.node) - b.cx, dy = gcy(g, c.node) - b.cy, dd = Math.hypot(dx, dy) || 1, passed = r - dd;
    if (passed <= 0) return { dx: -(dx / dd) * pre * sz * 0.08, dy: -(dy / dd) * pre * sz * 0.08, s: 1 - 0.05 * pre };
    var k = 1 - Math.exp(-passed / (sz * 0.7)), m = sz * 1.6 * k;
    return { dx: dx / dd * m, dy: dy / dd * m, s: Math.max(0.05, 1 + 0.2 * Math.exp(-passed / (sz * 0.25)) - 0.45 * H.smoothstep(0, sz * 2, passed)),
      a: 1 - H.smoothstep(sz * 0.15, sz * 1.5, passed), rot: rs(sd, g.i, 281) * 50 * k };
  };
});

regPost('shredOut', 'src/11p_exitB.js', function (c) {
  var sz = c.node.size, sd = seedOf(c), H0 = c.comp.height, ink = c.sc.ink || c.sc.fg || '#111111', rng = outRange(c);
  applyExitSliceTwins(c, function (b) {
    var x0 = b.x0 - sz * 0.06, x1 = b.x1 + sz * 0.06, y0 = b.y0 - sz * 0.06, y1 = b.y1 + sz * 0.06, w = x1 - x0;
    var ySlot = y1 + sz * 0.12, travel = ySlot - y0 + sz * 0.1, n = cl(Math.round(w / (sz * 0.2)), 5, 14), sw = w / n, specs = [];
    for (var k = 0; k < n; k++) {
      (function (kk) {
        var xs0 = x0 + kk * sw, xs1 = xs0 + sw * 0.74, xc = (xs0 + xs1) / 2, rk = rand(sd, kk, 132), rAng = rs(sd, kk, 131);
        specs.push({
          fixed: false, px: xc, py: ySlot,
          sample: function (p) {
            var f = cl((p - 0.08) / 0.72), D = travel * (0.2 * f * f + 0.8 * f), v = cl((p - 0.72) / 0.28), drop = H0 * 0.9 * v * v;
            var below = Math.max(0, y1 + D - ySlot), curl = cl(below / (sz * 1.5));
            var ang = ((kk - (n - 1) / 2) / Math.max(1, n) * 0.5 + rAng * 0.12) * curl / DEG;
            return { dy: D + drop * (0.7 + 0.6 * rk) * (below > 0 ? 1 : 0), rot: ang, a: 1 - H.smoothstep(0.8, 0.97, p) };
          },
          clip: function () { return [V.polygon(xs0, y0 - sz, xs1, y1 + sz)]; }
        });
      })(k);
    }
    return specs;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimary(c, gs)) return;
      var loc = V.local(c, c.node, 'ShredBar'), b = lineBounds(gs), ySlot = b.y1 + sz * 0.18, lw = Math.max(2, sz * 0.05), w = b.w + sz * 0.62;
      addLocalShape(c, loc, rng, 'SlotBar', G.rect(-w / 2, -lw / 2, w, lw), { fill: ink, alpha: 1 }, function (p) {
        var barA = H.smoothstep(0, 0.1, p) * (1 - H.smoothstep(0.82, 0.98, p));
        return { 'position.x': b.cx, 'position.y': -ySlot, 'scale.x': oCubic(H.smoothstep(0, 0.12, p)), alpha: p > 0 ? barA : 0 };
      });
    });
  }
});

reg('slotOut', 'src/11p_exitB.js', function (c) {
  var sd = seedOf(c), acc = H.accCol(c.sc), rng = outRange(c);
  function chOf(i, m) { return REEL_POOL[Math.floor(rand(sd, i, m, 181) * REEL_POOL.length)]; }
  (c.node._jzTwins = c.node._jzTwins || []).push({
    label: 'SlotNext', below: true,
    setup: function (graph, clone, src, g, gs) {
      clone.keys = {};
      C.sample(graph, clone.id, clone.start, clone.end, function (f) {
        if (f < rng.start) return { alpha: 0 };
        var q = win(poutAt(c, f), lr(g, gs, c), 0.35), M = 3 + (Math.floor(rand(sd, g.i, 182) * 100) % 4);
        var ph = (M + 1) * ioCubic(q), m = Math.floor(ph) + 1, fr = ph - Math.floor(ph);
        if (q <= 0 || m > M) return { alpha: 0 };
        var pitch = g.h * 1.12, dy = (1 - fr) * pitch, ky = 1 + Math.min(0.6, 6 * Math.sin(PI * q) * 0.12);
        return { 'position.x': g.x + (g.vx || 0), 'position.y': -g.y - (g.vy || 0) - dy,
          rotation: -(g.r90 ? 90 : 0), 'scale.x': g.r90 ? ky : 1, 'scale.y': g.r90 ? 1 : ky, alpha: 1 };
      });
    }
  });
  return function (p, g, gs) {
    var q = win(p, lr(g, gs, c), 0.35);
    if (q <= 0) return null;
    var M = 3 + (Math.floor(rand(sd, g.i, 182) * 100) % 4), ph = (M + 1) * ioCubic(q), m = Math.floor(ph), fr = ph - m;
    if (m > M) return HIDE;
    var pitch = g.h * 1.12, ky = 1 + Math.min(0.6, 6 * Math.sin(PI * q) * 0.12);
    var o = { dy: -fr * pitch, clipY: [-0.55, 0.55] };
    if (g.r90) o.sx = ky; else o.sy = ky;
    if (m > 0) { o.ch = chOf(g.i, m); if (rand(sd, g.i, m, 183) < 0.3) o.color = acc; }
    return o;
  };
});

reg('snakeOut', 'src/11p_exitB.js', function (c) {
  var vert = !!c.node.vertical, sz = c.node.size, rev = cutBit(c, 231), n2 = cutBit(c, 232) ? 1 : -1;
  var gs0 = V.glyphs(c, c.node), b = V.bounds(gs0);
  var u = vert ? [0, 1] : [1, 0]; if (rev) u = [-u[0], -u[1]];
  var v = [-u[1], u[0]], aMin = Infinity, aMax = -Infinity;
  gs0.forEach(function (g) { var a = gcx(g, c.node) * u[0] + gcy(g, c.node) * u[1]; aMin = Math.min(aMin, a); aMax = Math.max(aMax, a); });
  var aEnd = aMax + sz * 0.5, R = sz * 1.3, oc = b.cx * v[0] + b.cy * v[1];
  var Dt = (aEnd - aMin) + R * 2 + Math.max(c.comp.width, c.comp.height) * 0.75;
  function pathPt(a2, o) {
    if (a2 <= aEnd) return [a2, o, 0];
    var s = a2 - aEnd, arc = R * PI / 2;
    if (s <= arc) { var f = s / R, ca = Math.cos(f), sa = Math.sin(f); return [aEnd + R * sa - n2 * sa * o, n2 * R * (1 - ca) + ca * o, n2 * f / DEG]; }
    return [aEnd + R - n2 * o, n2 * (R + s - arc), n2 * 90];
  }
  return function (p, g) {
    if (p <= 0) return null;
    if (p >= 1) return HIDE;
    var trav = Dt * (0.35 * p * p + 0.65 * Math.pow(p, 2.4)), gx = gcx(g, c.node), gy = gcy(g, c.node);
    var res = pathPt(gx * u[0] + gy * u[1] + trav, gx * v[0] + gy * v[1] - oc);
    var X2 = u[0] * res[0] + v[0] * (res[1] + oc), Y2 = u[1] * res[0] + v[1] * (res[1] + oc);
    return { dx: X2 - gx, dy: Y2 - gy, rot: res[2], a: 1 - H.smoothstep(0.9, 1, p) };
  };
});

regPost('stripesOut', 'src/11p_exitB.js', function (c) {
  var sz = c.node.size, acc = H.accCol(c.sc), ang = (cutBit(c, 41) ? 64 : 116) * DEG, rev = cutBit(c, 42);
  var Ld = [Math.cos(ang), Math.sin(ang)], Ad = [-Ld[1], Ld[0]], rng = outRange(c);
  function stripeData(p, b) {
    var x0 = b.x0 - sz * 0.12, x1 = b.x1 + sz * 0.12, y0 = b.y0 - sz * 0.12, y1 = b.y1 + sz * 0.12;
    var cs = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
    var as = cs.map(function (q) { return q[0] * Ad[0] + q[1] * Ad[1]; }), ls = cs.map(function (q) { return q[0] * Ld[0] + q[1] * Ld[1]; });
    var a0 = Math.min.apply(null, as), a1 = Math.max.apply(null, as), l0 = Math.min.apply(null, ls), l1 = Math.max.apply(null, ls);
    var n = cl(Math.ceil((a1 - a0) / Math.max(6, sz * 0.38)), 2, 24), sw = (a1 - a0) / n, polys = [], caps = [];
    for (var k = 0; k < n; k++) {
      var o = n > 1 ? k / (n - 1) : 0, st0 = (rev ? 1 - o : o) * 0.42, q = ioCubic(cl((p - st0) / 0.58));
      if (q >= 1) continue;
      var fromStart = (k & 1) === 1, la = fromStart ? mix(l0, l1, q) : l0, lb = fromStart ? l1 : mix(l1, l0, q);
      var aa = a0 + k * sw, ab = a0 + (k + 1) * sw + 0.6;
      function pt(a, l) { return [Ad[0] * a + Ld[0] * l, Ad[1] * a + Ld[1] * l]; }
      polys.push([pt(aa, la), pt(ab, la), pt(ab, lb), pt(aa, lb)]);
      if (q > 0) caps.push({ aa: aa, ab: ab, l: fromStart ? la : lb, ca: 1 - H.smoothstep(0.8, 1, q) });
    }
    return { polys: polys, caps: caps, a0: a0, sw: sw, n: n, l0: l0, l1: l1 };
  }
  applyExitWindowClip(c, false, function (p, b) { return stripeData(p, b).polys; });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimary(c, gs)) return;
      var loc = V.local(c, c.node, 'StripeCaps'), b = lineBounds(gs), S0 = stripeData(0, b), th = Math.max(2, sz * 0.045);
      for (var k = 0; k < S0.n; k++) {
        (function (kk) {
          addLocalShape(c, loc, rng, 'Cap_' + kk, G.rect(-S0.sw / 2, -th / 2, S0.sw, th), { fill: acc, alpha: 1 }, function (p) {
            var o = S0.n > 1 ? kk / (S0.n - 1) : 0, st0 = (rev ? 1 - o : o) * 0.42, q = ioCubic(cl((p - st0) / 0.58));
            if (q <= 0 || q >= 1) return { alpha: 0 };
            var fromStart = (kk & 1) === 1, l = fromStart ? mix(S0.l0, S0.l1, q) : mix(S0.l1, S0.l0, q), am = S0.a0 + (kk + 0.5) * S0.sw;
            return { 'position.x': Ad[0] * am + Ld[0] * l, 'position.y': -(Ad[1] * am + Ld[1] * l), rotation: -(ang / DEG - 90), alpha: 1 - H.smoothstep(0.8, 1, q) };
          });
        })(k);
      }
    });
  }
});

regPost('tearOut', 'src/11p_exitB.js', function (c) {
  var vert = !!c.node.vertical, sd = seedOf(c), sz = c.node.size, H0 = c.comp.height;
  applyExitSliceTwins(c, function (b) {
    var x0 = b.x0 - sz * 0.3, x1 = b.x1 + sz * 0.3, y0 = b.y0 - sz * 0.3, y1 = b.y1 + sz * 0.3;
    var mid = vert ? b.cy : b.cx, a0 = vert ? x0 : y0, a1 = vert ? x1 : y1, K = cl(Math.ceil((a1 - a0) / (sz * 0.08)), 6, 32), jag = [];
    for (var k = 0; k <= K; k++) {
      var t = mix(a0, a1, k / K), off = rs(sd, k, 331) * sz * 0.05 + Math.sin(k * 0.35 + sd + 5) * sz * 0.16;
      jag.push(vert ? [t, mid + off] : [mid + off, t]);
    }
    var polyA = (vert ? [[x0, y0 - sz]] : [[x0 - sz, y0]]).concat(jag, [vert ? [x1, y0 - sz] : [x0 - sz, y1]]);
    var polyB = (vert ? [[x0, y1 + sz]] : [[x1 + sz, y0]]).concat(jag, [vert ? [x1, y1 + sz] : [x1 + sz, y1]]);
    var piv = jag[jag.length - 1];
    return [-1, 1].map(function (sgn, idx) {
      return {
        fixed: false, px: piv[0], py: piv[1],
        sample: function (p) {
          var o = oCubic(cl(p / 0.32)), v = cl((p - 0.26) / 0.74), th = 7 * o + 40 * v * v;
          var fall = H0 * 1.1 * v * v, side = sz * 1.6 * v;
          return {
            dx: vert ? sgn * side * 0.35 - side * 0.4 : sgn * side,
            dy: vert ? fall + sgn * sz * 0.3 * v : fall * (sgn < 0 ? 1 : 0.85),
            rot: (vert ? -sgn : sgn) * th, a: 1 - H.smoothstep(0.82, 1, p)
          };
        },
        clip: function () { return [idx === 0 ? polyA : polyB]; }
      };
    });
  });
});

reg('tornadoOut', 'src/11p_exitB.js', function (c) {
  var sd = seedOf(c), sz = c.node.size, dir = cutBit(c, 211) ? 1 : -1, gs0 = V.glyphs(c, c.node), b = V.bounds(gs0);
  var up = b.y1 + sz * 1.8, cx = b.cx, R0 = Math.max(1, b.w / 2) + sz * 0.3;
  return function (p, g, gs) {
    var q = win(p, rand(sd, g.i, 214) * 0.5, 0.25);
    if (q <= 0) return null;
    if (q >= 1) return HIDE;
    var x0 = gcx(g, c.node), ox = x0 - cx, th0 = Math.asin(cl(ox / R0, -1, 1)), r = rand(sd, g.i, 212);
    var th = th0 + dir * PI * (3.2 + r) * q * q, hx = gs.length > 1 ? g.i / (gs.length - 1) : 0;
    var lift = up * Math.pow(q, 2.2) * (0.8 + 0.3 * r) + sz * 1.4 * hx * oCubic(q);
    var R = R0 * (1 - 0.35 * oCubic(q)) + lift * 0.25 + sz * 0.6 * q;
    return { dx: R * Math.sin(th) - ox, dy: -lift, rot: -Math.sin(th) * 14 * q,
      s: 0.72 + 0.28 * Math.cos(th), a: (0.3 + 0.7 * (Math.cos(th) + 1) / 2) * (1 - H.smoothstep(0.8, 0.98, p)) };
  };
});

reg('vacuumOut', 'src/11p_exitB.js', function (c) {
  var vert = !!c.node.vertical, sz = c.node.size, acc = H.accCol(c.sc), rev = cutBit(c, 61), sd = seedOf(c);
  var gs0 = V.glyphs(c, c.node), b = V.bounds(gs0), rng = outRange(c);
  var Tl = vert ? [b.cx, rev ? b.y0 - sz * 0.8 : b.y1 + sz * 0.8] : [rev ? b.x0 - sz * 0.8 : b.x1 + sz * 0.8, b.cy];
  var dm = 1;
  gs0.forEach(function (g) { dm = Math.max(dm, Math.hypot(Tl[0] - gcx(g, c.node), Tl[1] - gcy(g, c.node))); });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimary(c, gs)) return;
      var loc = V.local(c, c.node, 'VacuumPoint');
      addLocalShape(c, loc, rng, 'Singularity', G.ellipse(0, 0, sz * 0.14, sz * 0.14), { fill: acc, alpha: 1 }, function (p) {
        if (p <= 0) return { alpha: 0 };
        var sc = (0.35 + 0.65 * cl(p * 1.2)) * (1 + 0.25 * Math.sin(p * 40) * (1 - p)) * (1 - H.smoothstep(0.9, 1, p));
        return { 'position.x': Tl[0], 'position.y': -Tl[1], 'scale.x': sc, 'scale.y': sc, alpha: 1 };
      });
      addLocalShape(c, loc, rng, 'SnapRing', G.ellipse(0, 0, sz * 0.65, sz * 0.65), { stroke: acc, width: Math.max(1.5, sz * 0.03), alpha: 1 }, function (p) {
        var ring = cl((p - 0.86) / 0.14);
        if (ring <= 0 || ring >= 1) return { alpha: 0 };
        return { 'position.x': Tl[0], 'position.y': -Tl[1], 'scale.x': 0.23 + 0.77 * oCubic(ring), 'scale.y': 0.23 + 0.77 * oCubic(ring), alpha: 1 - ring };
      });
    });
  }
  return function (p, g) {
    var gx = gcx(g, c.node), gy = gcy(g, c.node), vx = Tl[0] - gx, vy = Tl[1] - gy, dd = Math.hypot(vx, vy);
    var q = win(p, cl((dd - sz * 0.8) / Math.max(1, dm - sz * 0.8)), 0.5);
    if (q <= 0) return null;
    if (q >= 0.94) return HIDE;
    var e = Math.min(1, iQuad(q / 0.94)), bend = rs(sd, g.i, 63) * dd * 0.1 * Math.sin(PI * e);
    var nx = -vy / Math.max(1, dd), ny = vx / Math.max(1, dd), st2 = Math.min(1.8, 3 * q * q), along = (!vert) !== !!g.r90;
    return { dx: vx * e + nx * bend, dy: vy * e + ny * bend, s: Math.max(0.05, 1 - 0.8 * e),
      sx: along ? 1 + st2 : 1 - 0.3 * st2 / 1.8, sy: along ? 1 - 0.3 * st2 / 1.8 : 1 + st2 };
  };
});

reg('zipOut', 'src/11p_exitB.js', function (c) {
  var vert = !!c.node.vertical, sz = c.node.size, acc = H.accCol(c.sc), sub = c.sc.sub || c.sc.fg, rev = cutBit(c, 161);
  var gs0 = V.glyphs(c, c.node), rows = V.spans(gs0, vert), byLi = Object.create(null), rng = outRange(c);
  rows.forEach(function (L) { byLi[L.li] = L; });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      if (!isPrimary(c, gs)) return;
      var loc = V.local(c, c.node, 'Zipper');
      rows.slice(0, 3).forEach(function (L, li) {
        addLocalShape(c, loc, rng, 'Slider_' + li, H.roundRectCmds(0, 0, vert ? sz * 0.46 : sz * 0.3, vert ? sz * 0.3 : sz * 0.46, sz * 0.09), { fill: acc, alpha: 1 }, function (p) {
          var pos = mix(-0.12, 1.12, ioSine(cl(p / 0.8))), sp = mix(L.a0, L.a1, rev ? 1 - pos : pos);
          var fa = 1 - H.smoothstep(0.76, 0.96, p);
          if (p <= 0 || sp < L.a0 - sz * 0.5 || sp > L.a1 + sz * 0.5) return { alpha: 0 };
          return { 'position.x': vert ? L.c : sp, 'position.y': -(vert ? sp : L.c), alpha: fa };
        });
        for (var k = 0; k < 8; k++) {
          (function (kk) {
            var u = (kk + 0.5) / 8, aPos = mix(L.a0, L.a1, u), th = sz * 0.05, o = (kk & 1 ? 1 : -1) * th * 0.5;
            addLocalShape(c, loc, rng, 'Tooth_' + li + '_' + kk, G.rect(-th, -th * 0.6, th * 2, th * 1.2), { fill: sub, alpha: 1 }, function (p) {
              var pos = mix(-0.12, 1.12, ioSine(cl(p / 0.8))), fa = 1 - H.smoothstep(0.76, 0.96, p);
              var passed = rev ? (u > 1 - pos) : (u < pos);
              return (p > 0 && passed) ? { 'position.x': vert ? L.c + o : aPos, 'position.y': -(vert ? aPos : L.c + o), alpha: fa } : { alpha: 0 };
            });
          })(k);
        }
      });
    });
  }
  return function (p, g) {
    var L = byLi[g.li]; if (!L) return null;
    var pos = mix(-0.12, 1.12, ioSine(cl(p / 0.8))), v = vert ? gcy(g, c.node) : gcx(g, c.node);
    var o = (v - L.a0) / Math.max(1, L.a1 - L.a0); if (rev) o = 1 - o;
    var k = 1 - ioSine(cl((pos - o) / 0.22 + 0.15));
    if (k >= 1) return null;
    if (k <= 0.01) return HIDE;
    return (vert !== !!g.r90) ? { sx: k } : { sy: k };
  };
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
