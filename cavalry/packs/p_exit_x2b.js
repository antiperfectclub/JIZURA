/* 33 exit recipes: src/11p_x2_exB.js remaining 8 + src/11p_x2_exC.js all 25 unported whole-item exits. */
(function (N, G, C, R, V, S, H) {
'use strict';

var E = R.E, cl = R.clamp, mix = R.mix, TAU = R.T, PI = Math.PI, DEG = PI / 180, rand = N.random;
var HIDE = { hide: true };
var BIG = 5000;

function oCubic(x) { return 1 - Math.pow(1 - cl(x), 3); }
function iQuad(x) { x = cl(x); return x * x; }
function iCubic(x) { x = cl(x); return x * x * x; }
function ioCubic(x) { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function ioSine(x) { return -(Math.cos(PI * cl(x)) - 1) / 2; }
function oBack(x, s) { x = cl(x); return x <= 0 ? 0 : x >= 1 ? 1 : E.outBack(x, s); }
function oExpo(x) { return E.outExpo(cl(x)); }
function seg(x, a, b) { return cl((x - a) / Math.max(1e-6, b - a)); }
function win(p, o, spread) { return cl((p - o * spread) / Math.max(0.01, 1 - spread)); }
function rs(a, b, c2, d) { return rand(a, b, c2, d) * 2 - 1; }
function seedOf(c) { return c.node.seed == null ? ((c.cut.source || {}).seed || 1) : c.node.seed; }
function cutSeed(c) { return (c.cut && c.cut.seed) || seedOf(c); }
function cutBit(c, salt) { return rand(cutSeed(c), salt, 977) < 0.5; }
function isBlank(ch) { return /^[\s\u3000]$/.test(ch); }
function cutN(c) { return Array.from(String((c.cut && c.cut.text) || (c.node && c.node.text) || '').replace(/[\s\u3000]/g, '')).length || 1; }
function hotOf(c) {
  var sc = c.sc, col = c.node.color || sc.fg || '#ffffff';
  if (col === sc.accent) return sc.accent2 || sc.fg || '#ffffff';
  return sc.accent || sc.accent2 || sc.fg || '#ffffff';
}
function inkOf(c) { return c.node.color || c.sc.fg || '#ffffff'; }
function rot2(x, y, rad) { var cs = Math.cos(rad), sn = Math.sin(rad); return [x * cs - y * sn, x * sn + y * cs]; }

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
function pCAt(c, f) { return cl(poutAt(c, f) / 0.88); }
function post(c, fn) { (c.node._jzPost = c.node._jzPost || []).push(fn); }
function regPost(key, source, setupFn, diffs) {
  N.register('exit', key, {
    source: source + ' / exit:' + key, scope: 'node', differences: diffs || [],
    build: function (c) { setupFn(c); return function () {}; }
  });
}

function lineBounds(gs) {
  var b = V.bounds(gs);
  return { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1, w: b.w, h: b.h, cx: b.cx, cy: b.cy };
}
function frameOf(c, bx, pad) {
  var v = !!c.node.vertical;
  var x0 = bx.x0 - pad, x1 = bx.x1 + pad, y0 = bx.y0 - pad, y1 = bx.y1 + pad;
  var F = v
    ? { v: true, a0: y0, a1: y1, b0: x0, b1: x1, bb: { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 } }
    : { v: false, a0: x0, a1: x1, b0: y0, b1: y1, bb: { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 } };
  F.len = F.a1 - F.a0; F.cr = F.b1 - F.b0; F.ac = (F.a0 + F.a1) / 2; F.bc = (F.b0 + F.b1) / 2;
  return F;
}
function polyAB(v, a0, b0, a1, b1) { return v ? V.polygon(b0, a0, b1, a1) : V.polygon(a0, b0, a1, b1); }
function PT(v, a, b) { return v ? [b, a] : [a, b]; }
function barW(c) { return Math.max(3, c.node.size * 0.045); }

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
function addLocalShape(c, loc, rng, name, cmds, paint, sampleFn, onTwo) {
  if (!rng.ok) return null;
  var safePaint = (paint && typeof paint === 'object' && !(paint.alpha > 0))
    ? Object.assign({}, paint, { alpha: 1 }) : paint;
  var id = C.shape(c.graph, { start: rng.start, end: rng.end }, c.cut.id + ' / ' + c.node.id + ' / ' + name, loc, cmds, safePaint);
  if (sampleFn) C.sample(c.graph, id, rng.start, rng.end, function (f) { return sampleFn(onTwo ? pCAt(c, f) : poutAt(c, f), f); });
  else if (paint && typeof paint === 'object' && paint.alpha === 0) setKey(c.graph, id, 'alpha', rng.start, 0, 1);
  return id;
}

function applyExitWindowClip(c, difference, polysFn) {
  var rng = outRange(c);
  if (!rng.ok) return;
  post(c, function (graph, ids, gs, cut, parent, options) {
    var placeId = rootPlaceNull(graph, ids, cut, c.node, c.comp, parent);
    var b = lineBounds(gs), byFrame = Object.create(null);
    for (var f = rng.start; f < cut.end; f++) {
      var p = poutAt(c, f);
      if (p <= 0) continue;
      if (p >= 0.998) {
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
        var cid = graph.add(src.type, src.name + ' / XS' + idx, sliceRig, rng.start, rng.end,
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

function decompShear(k) {
  if (Math.abs(k) < 1e-6) return [0, 1, 1, 0];
  var v = 0.5 * Math.atan2(2 * k, -k * k);
  var a = Math.cos(v) + k * Math.sin(v), b = Math.sin(v), s = Math.max(0.05, Math.hypot(a, b));
  return [Math.atan2(b, a) / DEG, s, 1 / s, -v / DEG];
}

function applyExitWholeRigC(c, fn, stepped) {
  post(c, function (graph, ids, gs, cut, parent) {
    var curParent = ids.length && graph.byId[ids[0]] ? graph.byId[ids[0]].parent : rootPlaceNull(graph, ids, cut, c.node, c.comp, parent);
    var rigOuter = graph.add('null', cut.id + ' / ' + c.node.id + ' / Exit Outer', curParent, cut.start, cut.end, {});
    var rigStretch = graph.add('null', cut.id + ' / ' + c.node.id + ' / Exit Stretch', rigOuter, cut.start, cut.end, {});
    var rigInner = graph.add('null', cut.id + ' / ' + c.node.id + ' / Exit Inner', rigStretch, cut.start, cut.end, {});
    insertBeforeLayer(graph, rigOuter, ids[0]);
    insertBeforeLayer(graph, rigStretch, ids[0]);
    insertBeforeLayer(graph, rigInner, ids[0]);
    var rng = outRange(c), b = lineBounds(gs), base = Object.create(null);
    var ktype = stepped ? 2 : 1;
    ids.forEach(function (tid) {
      var n = graph.byId[tid];
      n.parent = rigInner;
      base[tid] = { a: n.attrs.alpha == null ? 1 : n.attrs.alpha };
    });
    var lastColor = null;
    for (var f = cut.start; f < cut.end; f++) {
      var p = f >= rng.start ? pCAt(c, f) : 0;
      var s = p > 0 ? (p >= 0.998 ? { a: 0 } : (fn(p, b, f) || {})) : {};
      var ax = s.ax == null ? 0 : s.ax, ay = s.ay == null ? 0 : s.ay;
      var sx = s.sx == null ? 1 : s.sx, sy = s.sy == null ? 1 : s.sy;
      var rot = s.rot || 0, dx = s.dx || 0, dy = s.dy || 0, skew = s.skew || 0;
      var sc = decompShear(Math.tan(skew * DEG));
      graph.key(rigOuter, 'position.x', f, dx + ax, ktype);
      graph.key(rigOuter, 'position.y', f, -(dy + ay), ktype);
      graph.key(rigOuter, 'rotation', f, -rot + sc[0], ktype);
      graph.key(rigStretch, 'scale.x', f, sc[1], ktype);
      graph.key(rigStretch, 'scale.y', f, sc[2], ktype);
      graph.key(rigInner, 'rotation', f, sc[3], ktype);
      graph.key(rigInner, 'scale.x', f, Math.abs(sx) < 0.01 ? (sx < 0 ? -0.01 : 0.01) : sx, ktype);
      graph.key(rigInner, 'scale.y', f, Math.abs(sy) < 0.01 ? (sy < 0 ? -0.01 : 0.01) : sy, ktype);
      graph.key(rigInner, 'position.x', f, -ax, ktype);
      graph.key(rigInner, 'position.y', f, ay, ktype);
      if (p > 0) {
        var am = p >= 0.998 ? 0 : (s.a == null ? 1 : cl(s.a));
        ids.forEach(function (tid) {
          var tn = graph.byId[tid];
          setKey(graph, tid, 'alpha', f, getKeyVal(tn, 'alpha', f, base[tid].a) * am, ktype);
          if (s.color && s.color !== lastColor) setKey(graph, tid, 'material.materialColor', f, s.color, 2);
        });
        if (s.color) lastColor = s.color;
      }
    }
  });
}

function offX(c, b, dir, pad) {
  var x0 = c.node.x + b.x0, x1 = c.node.x + b.x1;
  return (dir > 0 ? c.comp.width - x0 : x1) + pad;
}
function offDown(c, b, pad) { return c.comp.height - (c.node.y + b.y0) + pad; }
function offUp(c, b, pad) { return (c.node.y + b.y1) + pad; }
function alongVec(c) {
  var rad = (c.node.rotation || 0) * DEG;
  return c.node.vertical ? [-Math.sin(rad), Math.cos(rad)] : [Math.cos(rad), Math.sin(rad)];
}
function crossVec(c) {
  var rad = (c.node.rotation || 0) * DEG;
  return c.node.vertical ? [Math.cos(rad), Math.sin(rad)] : [Math.sin(rad), -Math.cos(rad)];
}
function ptAt(b, u, v) { return [mix(b.x0, b.x1, u), mix(b.y0, b.y1, v)]; }
function stretchBox(b, u, v, kx, ky) { return { ax: mix(b.x0, b.x1, u), ay: mix(b.y0, b.y1, v), sx: kx, sy: ky }; }
function stretchAlongSt(b, vert, a, kA, kC) { return vert ? stretchBox(b, 0.5, a, kC, kA) : stretchBox(b, a, 0.5, kA, kC); }

/* =====================================================================
   PART 1: Remaining 8 from src/11p_x2_exB.js
   ===================================================================== */

regPost('xiTwoPass', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, acc = hotOf(c), th = barW(c) * 1.3, rng = outRange(c);
  applyExitWindowClip(c, false, function (p, bx) {
    var F = frameOf(c, bx, sz * 0.3), n = cl(Math.ceil(F.cr / Math.max(3, sz * 0.085)), 4, 24), pitch = F.cr / n;
    var e1 = ioCubic(seg(p, 0, 0.46)), e2 = ioCubic(seg(p, 0.54, 1));
    var xa = mix(F.a0, F.a1, e1), xb = mix(F.a1, F.a0, e2), lim = Math.min(xa, xb);
    if (lim - F.a0 < 0.4 && e1 >= 1) return [];
    var out = [];
    if (e1 < 1) out.push(polyAB(v, xa, F.b0 - BIG, F.a1 + BIG, F.b1 + BIG));
    if (lim > F.a0) for (var j = 0; j < n; j += 2) out.push(polyAB(v, F.a0, F.b0 + j * pitch, lim, F.b0 + (j + 1) * pitch));
    return out;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var F = frameOf(c, lineBounds(gs), sz * 0.3), loc = V.local(c, c.node, 'XiTwoPassBar');
      addLocalShape(c, loc, rng, 'Bar', v ? G.rect(-0.5, -th / 2, 1, th) : G.rect(-th / 2, -0.5, th, 1), { fill: acc, alpha: 0 }, function (p) {
        var e1 = ioCubic(seg(p, 0, 0.46)), e2 = ioCubic(seg(p, 0.54, 1));
        var xa = mix(F.a0, F.a1, e1), xb = mix(F.a1, F.a0, e2), lim = Math.min(xa, xb);
        if (lim - F.a0 < 0.4 && e1 >= 1) return { alpha: 0 };
        var k = oCubic(seg(p, 0, 0.07)) * (1 - iCubic(seg(p, 0.93, 1))), h = (F.cr / 2 - sz * 0.12) * k;
        if (h < 0.4) return { alpha: 0 };
        var pos = p < 0.5 ? xa : xb;
        return v ? { 'position.x': F.bc, 'position.y': -pos, 'scale.x': h * 2, alpha: 1 }
          : { 'position.x': pos, 'position.y': -F.bc, 'scale.y': h * 2, alpha: 1 };
      });
    });
  }
});

regPost('xiSawBite', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, acc = hotOf(c), lw = Math.max(2, sz * 0.03), rng = outRange(c);
  function jawsAt(p, bx) {
    var F = frameOf(c, bx, sz * 0.25), A = Math.min(sz * 0.36, F.cr * 0.4), pitch = Math.max(sz * 0.62, F.len / 24), half = pitch / 2;
    var gap0 = F.cr + A, gf = p < 0.3 ? mix(1, 0.2, ioCubic(p / 0.3)) : p < 0.46 ? mix(0.2, 0.42, oCubic(seg(p, 0.3, 0.46))) : 0.42 * (1 - iCubic(seg(p, 0.46, 0.8)));
    var gap = gap0 * gf, bt = F.bc - A / 2 - gap / 2, bb2 = bt + A + gap;
    var m = Math.min(48, Math.ceil((F.len + sz) / half) + 1), aS = F.a0 - sz * 0.5, top = [], bot = [];
    for (var i = 0; i <= m; i++) {
      var a = aS + i * half;
      top.push(PT(v, a, bt + (i % 2 ? A : 0)));
      bot.push(PT(v, a, bb2 - (i % 2 ? 0 : A)));
    }
    return { top: top, bot: bot, gap: gap, m: m };
  }
  applyExitWindowClip(c, false, function (p, bx) {
    var j = jawsAt(p, bx);
    if (j.gap < 0.4) return [];
    return [j.top.concat(j.bot.slice().reverse())];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var bx = lineBounds(gs), loc = V.local(c, c.node, 'XiSawBite');
      ['Top', 'Bot'].forEach(function (lbl, side) {
        var id = addLocalShape(c, loc, rng, 'Jaw_' + lbl, G.rect(0, -lw / 2, 1, lw), { stroke: acc, width: lw, alpha: 0 }, null);
        if (!id) return;
        for (var f = rng.start; f < rng.end; f++) {
          var p = poutAt(c, f), j = jawsAt(p, bx), shut = iCubic(seg(p, 0.8, 1));
          var k0 = Math.floor(j.m / 2 * shut), k1 = j.m - k0, a = seg(p, 0, 0.1);
          if (a <= 0.01 || k1 - k0 < 1 || (side === 1 && j.gap < 0.4)) { setKey(graph, id, 'alpha', f, 0, 1); continue; }
          var pts = (side === 0 ? j.top : j.bot).slice(k0, k1 + 1);
          setKey(graph, id, 'alpha', f, a, 1);
          setKey(graph, id, 'path', f, V.commands(pts, false), 2);
        }
      });
    });
  }
});

regPost('xiRings', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, inward = cutBit(c, 31);
  applyExitWindowClip(c, false, function (p, bx) {
    var F = frameOf(c, bx, sz * 0.2), bb = F.bb, Rm = Math.hypot(bb.w, bb.h) / 2;
    var pitch = Math.max(sz * 0.3, Rm / 12), n = Math.max(2, Math.ceil(Rm / pitch)), polys = [];
    for (var k = 0; k < n; k++) {
      var o = inward ? 1 - k / (n - 1) : k / (n - 1), keep = 1 - ioCubic(win(p, o, 0.55));
      if (keep < 0.01) continue;
      var rm = (k + 0.5) * pitch, hw = pitch / 2 * keep + (keep > 0.995 ? 0.4 : 0);
      var r0 = Math.max(0, rm - hw), r1 = rm + hw;
      if (r0 <= 0.3) {
        var disk = [];
        for (var i = 0; i < 16; i++) { var a = i / 16 * TAU; disk.push([bb.cx + Math.cos(a) * r1, bb.cy + Math.sin(a) * r1]); }
        polys.push(disk);
      } else {
        for (var half = 0; half < 2; half++) {
          var a0 = half * PI - 0.02, a1 = (half + 1) * PI + 0.02, segs = 10, poly = [];
          for (var s = 0; s <= segs; s++) { var ang = mix(a0, a1, s / segs); poly.push([bb.cx + Math.cos(ang) * r1, bb.cy + Math.sin(ang) * r1]); }
          for (var s2 = segs; s2 >= 0; s2--) { var ang2 = mix(a0, a1, s2 / segs); poly.push([bb.cx + Math.cos(ang2) * r0, bb.cy + Math.sin(ang2) * r0]); }
          polys.push(poly);
        }
      }
    }
    return polys;
  });
});

function spiralOrder(nx, ny) {
  var o = new Array(nx * ny), x0 = 0, y0 = 0, x1 = nx - 1, y1 = ny - 1, k = 0;
  while (x0 <= x1 && y0 <= y1) {
    for (var x = x0; x <= x1; x++) o[y0 * nx + x] = k++;
    for (var y = y0 + 1; y <= y1; y++) o[y * nx + x1] = k++;
    if (y1 > y0) for (var x2 = x1 - 1; x2 >= x0; x2--) o[y1 * nx + x2] = k++;
    if (x1 > x0) for (var y2 = y1 - 1; y2 > y0; y2--) o[y2 * nx + x0] = k++;
    x0++; y0++; x1--; y1--;
  }
  return o;
}

regPost('xiSpiralTiles', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical;
  applyExitWindowClip(c, false, function (p, bx) {
    var F = frameOf(c, bx, sz * 0.15);
    var ny = cl(Math.round(F.cr / (sz * 0.5)), 2, 6), cell = F.cr / ny, nx = Math.max(1, Math.ceil(F.len / cell - 0.01));
    if (nx * ny > 72) nx = Math.max(1, Math.floor(72 / ny));
    var cw = F.len / nx, Nn = nx * ny, ord = spiralOrder(nx, ny), polys = [];
    for (var y = 0; y < ny; y++) for (var x = 0; x < nx; x++) {
      var keep = 1 - ioCubic(win(p, Nn > 1 ? ord[y * nx + x] / (Nn - 1) : 0, 0.62));
      if (keep < 0.015) continue;
      var a = F.a0 + x * cw, b = F.b0 + y * cell, e = keep > 0.995 ? 0.4 : 0;
      if ((x + y) & 1) polys.push(polyAB(v, a + cw * (1 - keep) / 2, b, a + cw * (1 + keep) / 2 + e, b + cell + e));
      else polys.push(polyAB(v, a, b + cell * (1 - keep) / 2, a + cw + e, b + cell * (1 + keep) / 2 + e));
    }
    return polys;
  });
});

regPost('xiSliceWave', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, rev = cutBit(c, 55);
  applyExitSliceTwins(c, function (bx) {
    var F = frameOf(c, bx, sz * 0.3), n = cl(Math.round(F.len / (sz * 0.4)), 4, 12), w = F.len / n;
    var far = F.b1 + sz * 0.6 + (v ? c.comp.width : c.comp.height) * 0.08, specs = [];
    for (var k = 0; k < n; k++) {
      (function (kk) {
        var o = ((rev ? n - 1 - kk : kk) + 0.5) / n;
        specs.push({
          fixed: false,
          sample: function (p) {
            var cc = mix(-0.2, 1.2, seg(p, 0, 0.42)), hop = Math.max(0, 1 - Math.pow((o - cc) / 0.2, 2));
            var sh = -sz * 0.2 * hop - far * iQuad(win(seg(p, 0.3, 0.98), o, 0.5));
            return { dx: v ? sh : 0, dy: v ? 0 : sh, a: p >= 0.99 ? 0 : 1 };
          },
          clip: function () { return [polyAB(v, F.a0 + kk * w - (kk === 0 ? sz : 0), -BIG, F.a0 + (kk + 1) * w + (kk < n - 1 ? 0.6 : sz), BIG)]; }
        });
      })(k);
    }
    return specs;
  });
});

regPost('xiTwinPlates', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, acc = hotOf(c), th = barW(c), rng = outRange(c);
  applyExitWindowClip(c, false, function (p, bx) {
    var F = frameOf(c, bx, sz * 0.16), qa = oCubic(seg(p, 0, 0.36));
    if (qa >= 1) return [];
    return [polyAB(v, mix(F.a0, F.ac, qa), F.b0 - BIG, mix(F.a1, F.ac, qa), F.b1 + BIG)];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var F = frameOf(c, lineBounds(gs), sz * 0.16), loc = V.local(c, c.node, 'XiTwinPlates');
      [0, 1].forEach(function (side) {
        addLocalShape(c, loc, rng, 'Plate_' + side, G.rect(0, 0, 1, 1), { fill: acc, alpha: 0 }, function (p) {
          var qa = oCubic(seg(p, 0, 0.36)), qb = ioCubic(seg(p, 0.46, 0.76)), qc = iCubic(seg(p, 0.76, 1));
          var eL = mix(F.a0, F.ac, qa), eR = mix(F.a1, F.ac, qa);
          var a0 = side === 0 ? F.a0 : mix(eR, F.a1, qc), a1 = side === 0 ? mix(eL, F.a0, qc) : F.a1;
          var b0 = side === 0 ? F.b0 : mix(F.b0, F.b1 - th, qb), b1 = side === 0 ? mix(F.b1, F.b0 + th, qb) : F.b1;
          if (a1 - a0 < 0.2 || b1 - b0 < 0.2) return { alpha: 0 };
          return v ? { 'position.x': b0, 'position.y': -a0, 'scale.x': b1 - b0, 'scale.y': -(a1 - a0), alpha: 1 }
            : { 'position.x': a0, 'position.y': -b0, 'scale.x': a1 - a0, 'scale.y': -(b1 - b0), alpha: 1 };
        });
      });
    });
  }
});

regPost('xiRollShutter', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, acc = hotOf(c), rng = outRange(c);
  applyExitWindowClip(c, false, function (p, bx) {
    var F = frameOf(c, bx, sz * 0.16), qa = oCubic(seg(p, 0, 0.4)), front = F.b0 + F.cr * qa;
    if (qa >= 1) return [];
    return [polyAB(v, F.a0 - BIG, front, F.a1 + BIG, F.b1 + BIG)];
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var F = frameOf(c, lineBounds(gs), sz * 0.16), loc = V.local(c, c.node, 'XiRollShutter');
      var n = cl(Math.ceil(F.cr / (sz * 0.17)), 3, 24), pitch = F.cr / n, sh = pitch * 0.84;
      for (var j = 0; j < n; j++) {
        (function (jj) {
          addLocalShape(c, loc, rng, 'Slat_' + jj, G.rect(0, 0, 1, 1), { fill: acc, alpha: 0 }, function (p) {
            var qa = oCubic(seg(p, 0, 0.4)), front = F.b0 + F.cr * qa, t0 = F.b0 + jj * pitch;
            if (t0 >= front) return { alpha: 0 };
            var p2 = seg(p, 0.5, 1), hh = sh * (1 - ioCubic(win(p2, n > 1 ? jj / (n - 1) : 0, 0.5))), cc = t0 + sh / 2;
            var b0 = cc - hh / 2, b1 = Math.min(front, cc + hh / 2);
            if (b1 - b0 < 0.2) return { alpha: 0 };
            return v ? { 'position.x': b0, 'position.y': -F.a0, 'scale.x': b1 - b0, 'scale.y': -F.len, alpha: 1 }
              : { 'position.x': F.a0, 'position.y': -b0, 'scale.x': F.len, 'scale.y': -(b1 - b0), alpha: 1 };
          });
        })(j);
      }
    });
  }
});

regPost('xiRedact', 'src/11p_x2_exB.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, sd = seedOf(c), col = inkOf(c), rng = outRange(c);
  var gs0 = V.glyphs(c, c.node), sx = c.node.sx == null ? 1 : c.node.sx;
  var lines = Object.create(null);
  gs0.forEach(function (g) {
    if (isBlank(g.ch)) return;
    if (!lines[g.li]) lines[g.li] = [];
    lines[g.li].push(g);
  });
  var segs = [], segOf = Object.create(null);
  Object.keys(lines).map(Number).sort(function (a, b) { return a - b; }).forEach(function (li) {
    var rgs = lines[li], n = rgs.length, parts = n <= 3 ? 1 : n <= 8 ? 2 : 3, cuts = [0];
    for (var k = 1; k < parts; k++) cuts.push(cl(Math.round(n * k / parts + rs(sd, li, k, 81) * n * 0.12), cuts[cuts.length - 1] + 1, n - 1));
    cuts.push(n);
    for (var k2 = 0; k2 < cuts.length - 1; k2++) {
      if (cuts[k2 + 1] <= cuts[k2]) continue;
      var S2 = { a0: 1e9, a1: -1e9, b0: 1e9, b1: -1e9, o: rand(sd, li, k2, 82), idx: segs.length };
      for (var i = cuts[k2]; i < cuts[k2 + 1]; i++) {
        var g = rgs[i]; segOf[g.i] = S2.idx;
        var ga = v ? g.y : g.x * sx, ha = (v ? g.h : g.w * sx) / 2, gb = v ? g.x * sx : g.y, hb = sz / 2;
        S2.a0 = Math.min(S2.a0, ga - ha); S2.a1 = Math.max(S2.a1, ga + ha);
        S2.b0 = Math.min(S2.b0, gb - hb); S2.b1 = Math.max(S2.b1, gb + hb);
      }
      segs.push(S2);
    }
  });
  if (!segs.length) return;
  post(c, function (graph, ids, gs) {
    ids.forEach(function (tid, idx) {
      var gi = gs[idx] ? gs[idx].i : idx, sIdx = segOf[gi];
      if (sIdx == null) return;
      var S2 = segs[sIdx];
      for (var f = rng.start; f < c.cut.end; f++) {
        var p = poutAt(c, f), on = seg(p, S2.o * 0.3, S2.o * 0.3 + 0.1);
        if (on >= 0.55) setKey(graph, tid, 'alpha', f, 0, 2);
      }
    });
    if (rng.ok) {
      var loc = V.local(c, c.node, 'XiRedactBars'), pa = sz * 0.07, pb = sz * 0.03;
      segs.forEach(function (S2, idx) {
        addLocalShape(c, loc, rng, 'Redact_' + idx, G.rect(0, 0, 1, 1), { fill: col, alpha: 0 }, function (p) {
          var on = seg(p, S2.o * 0.3, S2.o * 0.3 + 0.1), w = seg(p, 0.56 + S2.o * 0.2, 0.8 + S2.o * 0.2);
          var kb = oExpo(on) * mix(1, 0.07, ioCubic(seg(w, 0, 0.5))), ka = 1 - iCubic(seg(w, 0.4, 1));
          if (kb <= 0.002 || ka <= 0.002) return { alpha: 0 };
          var bc = (S2.b0 + S2.b1) / 2, hb = ((S2.b1 - S2.b0) / 2 + pb) * kb;
          var a0 = S2.a0 - pa, aw = (S2.a1 - S2.a0 + pa * 2) * ka;
          return v ? { 'position.x': bc - hb, 'position.y': -a0, 'scale.x': Math.max(0.2, hb * 2), 'scale.y': -Math.max(0.2, aw), alpha: 1 }
            : { 'position.x': a0, 'position.y': -(bc - hb), 'scale.x': Math.max(0.2, aw), 'scale.y': -Math.max(0.2, hb * 2), alpha: 1 };
        });
      });
    }
  });
});

/* =====================================================================
   PART 2: Remaining 25 from src/11p_x2_exC.js (time-scaled p/0.88)
   ===================================================================== */

regPost('xjGateSwing', 'src/11p_x2_exC.js', function (c) {
  var end = cutBit(c, 1) ? 1 : 0, v = !!c.node.vertical, sz = c.node.size, c0 = inkOf(c), bg = c.sc.bg || '#101010', acc = hotOf(c), rng = outRange(c);
  applyExitWholeRigC(c, function (p, b) {
    var q = seg(p, 0.1, 1), th = ioSine(q) * PI / 2, sn = Math.sin(th);
    var k = Math.cos(th) + 0.05 * Math.sin(PI * seg(p, 0, 0.3)) * (1 - q);
    var st = stretchAlongSt(b, v, end, Math.max(0.012, k), 1 + 0.14 * sn);
    st.a = k < 0.012 ? 0 : 1 - H.smoothstep(0.86, 1, q);
    st.color = H.mixHex(c0, bg, sn * 0.5);
    return st;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var b = lineBounds(gs), h0 = v ? ptAt(b, -0.12, end) : ptAt(b, end, -0.12), h1 = v ? ptAt(b, 1.12, end) : ptAt(b, end, 1.12);
      var loc = V.local(c, c.node, 'XjGateHinge'), lw = Math.max(2, sz * 0.03);
      addLocalShape(c, loc, rng, 'HingeBar', V.commands([h0, h1], false), { stroke: acc, width: lw, alpha: 0 }, function (p) {
        var la = Math.sqrt(Math.max(0, Math.sin(PI * cl(p))));
        return { alpha: la > 0.01 ? la : 0 };
      }, true);
    });
  }
});

regPost('xjQuarterTurn', 'src/11p_x2_exC.js', function (c) {
  var dir = cutBit(c, 2) ? 1 : -1, go = cutBit(c, 3) ? 1 : -1, sz = c.node.size, v = !!c.node.vertical;
  var room = (v ? c.comp.width : c.comp.height) * 0.8;
  function poseAt(p, b) {
    var L0 = v ? b.h : b.w, fit = L0 > room ? mix(1, room / L0, ioCubic(seg(p, 0, 0.45))) : 1;
    var deg = dir * 90 * oBack(seg(p, 0, 0.5), 1.3), rad = deg * DEG;
    var axV = v ? rot2(0, 1, rad) : rot2(1, 0, rad), dist = Math.max(c.comp.width, c.comp.height) + (L0 * fit) * 0.5 + sz;
    var u = iCubic(seg(p, 0.42, 1)), m = u > 0.004 ? Math.min(1, u * 5) : 0;
    var sx = fit * (v ? (1 - 0.1 * m) : (1 + 0.35 * m)), sy = fit * (v ? (1 + 0.35 * m) : (1 - 0.1 * m));
    return { ax: b.cx, ay: b.cy, rot: deg, sx: sx, sy: sy, dx: axV[0] * dist * u * go, dy: axV[1] * dist * u * go, a: 1 };
  }
  applyExitWholeRigC(c, function (p, b) { return poseAt(p, b); });
  var rng = outRange(c);
  if (rng.ok) {
    for (var k = 1; k <= 3; k++) {
      (function (kk) {
        (c.node._jzTwins = c.node._jzTwins || []).push({
          label: 'QuarterStreak_' + kk, below: true,
          setup: function (graph, clone, src, g, gs) {
            var b = lineBounds(gs); clone.keys = {};
            C.sample(graph, clone.id, clone.start, clone.end, function (f) {
              if (f < rng.start) return { alpha: 0 };
              var p = pCAt(c, f), u = iCubic(seg(p, 0.42, 1));
              if (u <= 0.004 || p >= 0.998) return { alpha: 0 };
              var ps = poseAt(p, b), rad = ps.rot * DEG, axV = v ? rot2(0, 1, rad) : rot2(1, 0, rad), m = Math.min(1, u * 5);
              var gx = g.x + (g.vx || 0) - b.cx, gy = g.y + (g.vy || 0) - b.cy;
              var gp = rot2(gx * ps.sx, gy * ps.sy, rad);
              var rx = b.cx + gp[0] + ps.dx - axV[0] * sz * 0.18 * kk * m * go;
              var ry = b.cy + gp[1] + ps.dy - axV[1] * sz * 0.18 * kk * m * go;
              return { 'position.x': rx, 'position.y': -ry, rotation: -(g.r90 ? 90 : 0) - ps.rot,
                'scale.x': ps.sx, 'scale.y': ps.sy, alpha: 0.32 * m * Math.pow(0.65, kk - 1) };
            });
          }
        });
      })(k);
    }
  }
});

regPost('xjNeedle', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, go = cutBit(c, 4) ? 1 : -1, v = !!c.node.vertical, c0 = inkOf(c), acc = hotOf(c);
  var crV = v ? [1, 0] : [0, -1];
  function poseAt(p, b) {
    var q1 = ioCubic(seg(p, 0, 0.44)), u = iCubic(seg(p, 0.46, 1)), cl2 = v ? b.w : b.h;
    var kA = mix(1, 0.022, q1), kC = mix(1, 1.55, q1) + 1.5 * u, dist = (v ? c.comp.width : c.comp.height) + cl2 * 4;
    var st = stretchAlongSt(b, v, 0.5, kA, kC);
    st.dx = crV[0] * dist * u * go; st.dy = crV[1] * dist * u * go;
    st.color = H.mixHex(c0, acc, q1 * 0.85);
    return st;
  }
  applyExitWholeRigC(c, function (p, b) { return poseAt(p, b); });
  var rng = outRange(c);
  if (rng.ok) {
    for (var k = 1; k <= 3; k++) {
      (function (kk) {
        (c.node._jzTwins = c.node._jzTwins || []).push({
          label: 'NeedleStreak_' + kk, below: true,
          setup: function (graph, clone, src, g, gs) {
            var b = lineBounds(gs); clone.keys = {};
            C.sample(graph, clone.id, clone.start, clone.end, function (f) {
              if (f < rng.start) return { alpha: 0 };
              var p = pCAt(c, f), u = iCubic(seg(p, 0.46, 1));
              if (u <= 0.004 || p >= 0.998) return { alpha: 0 };
              var ps = poseAt(p, b), m = Math.min(1, u * 6);
              var gx = ps.ax + (g.x + (g.vx || 0) - ps.ax) * ps.sx + ps.dx - crV[0] * sz * 0.2 * kk * m * go;
              var gy = ps.ay + (g.y + (g.vy || 0) - ps.ay) * ps.sy + ps.dy - crV[1] * sz * 0.2 * kk * m * go;
              return { 'position.x': gx, 'position.y': -gy, 'scale.x': ps.sx, 'scale.y': ps.sy, alpha: 0.4 * m * Math.pow(0.65, kk - 1) };
            });
          }
        });
      })(k);
    }
  }
});

regPost('xjBigWheel', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, side = cutBit(c, 5) ? 1 : -1, dir = cutBit(c, 6) ? 1 : -1;
  applyExitWholeRigC(c, function (p, b) {
    var R = Math.max(c.comp.height * 0.75, b.w * 0.65);
    var travel = c.comp.width / 2 + Math.abs(c.node.x + b.cx - c.comp.width / 2) + b.w / 2 + sz;
    var ang = travel < R * 0.9 ? Math.asin(travel / R) / DEG + 14 : 150;
    var back = -5 * oCubic(seg(p, 0, 0.2)) * (1 - ioCubic(seg(p, 0.2, 0.42)));
    return { ax: b.cx, ay: b.cy + side * R, rot: dir * side * (back + ang * iCubic(seg(p, 0.2, 1))), a: 1 - H.smoothstep(0.9, 1, p) };
  });
});

regPost('xjWiper', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, col = cutBit(c, 7) ? 0 : 1, acc = hotOf(c), rng = outRange(c);
  applyExitWholeRigC(c, function (p, b) {
    var pv = ptAt(b, col, 1), sc = 1 - 0.95 * iQuad(seg(p, 0.1, 0.9));
    return { ax: pv[0], ay: pv[1], rot: (col ? 1 : -1) * 112 * ioCubic(seg(p, 0.06, 0.88)), sx: sc, sy: sc, a: p > 0.9 ? 0 : 1 };
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var pv = ptAt(lineBounds(gs), col, 1), loc = V.local(c, c.node, 'XjWiperPin');
      addLocalShape(c, loc, rng, 'Pin', G.ellipse(0, 0, 1, 1), { fill: acc, alpha: 0 }, function (p) {
        var r = sz * 0.085 * oBack(seg(p, 0, 0.12), 2) * (1 - iCubic(seg(p, 0.86, 1)));
        if (r <= 0.3) return { alpha: 0 };
        return { 'position.x': pv[0], 'position.y': -pv[1], 'scale.x': r, 'scale.y': r, alpha: 1 };
      }, true);
    });
  }
});

regPost('xjRatchet', 'src/11p_x2_exC.js', function (c) {
  var dir = cutBit(c, 8) ? 1 : -1;
  applyExitWholeRigC(c, function (p, b) {
    var r = 0, s = 0;
    for (var i = 0; i < 5; i++) { var x = seg(p * 5 - i, 0.05, 0.5); r += oBack(x, 2.2); s += ioCubic(x); }
    var k = 1 - s / 5;
    if (k < 0.02) return { a: 0 };
    return { ax: b.cx, ay: b.cy, rot: dir * 30 * r, sx: k, sy: k, a: 1 };
  });
});

regPost('xjYank', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, dx = cutBit(c, 9) ? 1 : -1, v = !!c.node.vertical, acc = hotOf(c), rng = outRange(c);
  var d = [dx * 0.8, -0.6], hu = v ? 0.5 : (dx > 0 ? 1 : 0), hv = v ? 0 : 0.5;
  function poseAt(p, b) {
    var A = ptAt(b, hu, hv), far = (c.comp.width + b.w * 1.2 + sz) / 0.8;
    var j1 = Math.sin(PI * seg(p, 0.2, 0.32)), j2 = Math.sin(PI * seg(p, 0.35, 0.5)), u = seg(p, 0.55, 1);
    var e = Math.pow(u, 1.25), mv = sz * (0.07 * j1 + 0.16 * j2) + far * e;
    var deg = -dx * (2.5 * j1 + 5 * j2 + 13 * H.smoothstep(0, 0.3, u)) * (v ? -0.6 : 1);
    return { ax: A[0], ay: A[1], rot: deg, dx: d[0] * mv, dy: d[1] * mv, A: A, far: far, u: u };
  }
  applyExitWholeRigC(c, function (p, b) { return poseAt(p, b); });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var bx = lineBounds(gs), A0 = ptAt(bx, hu, hv), far = (c.comp.width + bx.w * 1.2 + sz) / 0.8;
      var T = [A0[0] + d[0] * far, A0[1] + d[1] * far], loc = V.local(c, c.node, 'XjYankString'), lw = Math.max(1.5, sz * 0.014);
      var lineId = addLocalShape(c, loc, rng, 'String', V.commands([T, A0], false), { stroke: acc, width: lw, alpha: 0 }, null);
      if (lineId) {
        for (var f = rng.start; f < rng.end; f++) {
          var p = pCAt(c, f), s1 = oCubic(seg(p, 0, 0.17)), sa = 1 - seg(p, 0.9, 1);
          if (sa <= 0.01) { setKey(graph, lineId, 'alpha', f, 0, 1); continue; }
          var ps = poseAt(p, bx), h = [A0[0] + ps.dx, A0[1] + ps.dy];
          var sag = sz * 0.35 * (1 - seg(p, 0.14, 0.24)), tip = [mix(T[0], h[0], s1), mix(T[1], h[1], s1)];
          setKey(graph, lineId, 'alpha', f, sa, 1);
          setKey(graph, lineId, 'path', f, V.commands([T, [(T[0] + tip[0]) / 2, (T[1] + tip[1]) / 2 + sag], tip], false), 2);
        }
      }
      addLocalShape(c, loc, rng, 'HookDot', G.ellipse(0, 0, lw * 2.2, lw * 2.2), { fill: acc, alpha: 0 }, function (p) {
        var s1 = oCubic(seg(p, 0, 0.17)), sa = 1 - seg(p, 0.9, 1);
        if (s1 < 0.99 || sa <= 0.01) return { alpha: 0 };
        var ps = poseAt(p, bx);
        return { 'position.x': A0[0] + ps.dx, 'position.y': -(A0[1] + ps.dy), alpha: sa };
      }, true);
    });
  }
});

regPost('xjTrapdoor', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, acc = hotOf(c), rng = outRange(c);
  applyExitWholeRigC(c, function (p, b) {
    var h = seg(p, 0.08, 0.36), sq = Math.sin(PI * seg(p, 0.36, 0.5)), cr = Math.sin(PI * seg(p, 0, 0.1));
    var st = stretchBox(b, 0.5, 1, 1 + 0.1 * sq + 0.05 * cr, 1 - 0.24 * sq - 0.1 * cr);
    st.dy = -sz * 0.45 * 4 * h * (1 - h) + offDown(c, b, sz) * iQuad(seg(p, 0.46, 1));
    return st;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var bx = lineBounds(gs), yf = bx.y1 + sz * 0.1, x0 = bx.x0 - sz * 0.2, x1 = bx.x1 + sz * 0.2, half = (x1 - x0) / 2;
      var loc = V.local(c, c.node, 'XjTrapdoor'), lw = Math.max(2, sz * 0.03);
      ['L', 'R'].forEach(function (side, sIdx) {
        addLocalShape(c, loc, rng, 'Leaf_' + side, G.rect(sIdx === 0 ? 0 : -half, -lw / 2, half, lw), { fill: acc, alpha: 0 }, function (p) {
          var l = oCubic(seg(p, 0, 0.1)), ang = 86 * oBack(seg(p, 0.43, 0.66), 1.4), la = 1 - seg(p, 0.84, 1);
          if (la <= 0.01 || l <= 0.01) return { alpha: 0 };
          return { 'position.x': sIdx === 0 ? x0 : x1, 'position.y': -yf, rotation: sIdx === 0 ? -ang : ang, 'scale.x': l, alpha: la };
        }, true);
      });
    });
  }
});

regPost('xjEdgeTeeter', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, dir = cutBit(c, 10) ? 1 : -1, acc = hotOf(c), rng = outRange(c);
  applyExitWholeRigC(c, function (p, b) {
    var yl = b.y1 + sz * 0.08, ex = b.cx + dir * b.w * 0.1, th = dir * 78 * iQuad(seg(p, 0.3, 0.8)), s2 = b.w * 0.9 * iQuad(seg(p, 0.42, 1));
    var dx = dir * b.w * 0.24 * oCubic(seg(p, 0, 0.4)) + dir * Math.cos(th * DEG) * s2;
    var dy = dir * Math.sin(th * DEG) * s2 + offDown(c, b, b.w * 0.5 + sz) * iQuad(seg(p, 0.55, 1));
    return { ax: ex, ay: yl, rot: th, dx: dx, dy: dy };
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var bx = lineBounds(gs), yl = bx.y1 + sz * 0.08, ex = bx.cx + dir * bx.w * 0.1, sx0 = dir > 0 ? bx.x0 - sz * 0.2 : bx.x1 + sz * 0.2;
      var ledgeW = Math.abs(ex - sx0), loc = V.local(c, c.node, 'XjEdgeLedge'), lw = Math.max(2, sz * 0.03);
      addLocalShape(c, loc, rng, 'Ledge', G.rect(dir > 0 ? -ledgeW : 0, -lw / 2, Math.max(1, ledgeW), lw), { fill: acc, alpha: 0 }, function (p) {
        var l = oCubic(seg(p, 0, 0.12)), la = 1 - seg(p, 0.8, 1);
        if (la <= 0.01 || l <= 0.01) return { alpha: 0 };
        return { 'position.x': ex, 'position.y': -yl, 'scale.x': l, alpha: la };
      }, true);
      addLocalShape(c, loc, rng, 'Prop', G.rect(-lw / 2, -sz * 0.22, lw, Math.max(1, sz * 0.22)), { fill: acc, alpha: 0 }, function (p) {
        var l = oCubic(seg(p, 0, 0.12)), la = 1 - seg(p, 0.8, 1);
        if (la <= 0.01 || l <= 0.01) return { alpha: 0 };
        return { 'position.x': ex, 'position.y': -(yl - lw / 2), 'scale.y': l, alpha: la };
      }, true);
    });
  }
});

regPost('xjPuckHit', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, dir = cutBit(c, 11) ? 1 : -1, acc = hotOf(c), rng = outRange(c);
  var s = sz * 0.3, t0 = 0.3;
  applyExitWholeRigC(c, function (p, b) {
    var u = seg(p, t0, 1);
    if (u <= 0) return {};
    var k = 1 - 0.14 * Math.sin(PI * seg(u, 0, 0.22)), st = stretchBox(b, dir > 0 ? 1 : 0, 0.5, k, 1);
    st.skew = dir * 22 * seg(u, 0, 0.05) * Math.pow(1 - u, 3);
    st.rot = dir * 9 * u;
    st.dx = dir * offX(c, b, dir, sz * 1.5) * Math.pow(u, 1.15); st.dy = -sz * 0.45 * u;
    return st;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var bx = lineBounds(gs), hitX = (dir > 0 ? bx.x0 : bx.x1) - dir * s * 0.5, loc = V.local(c, c.node, 'XjPuck');
      addLocalShape(c, loc, rng, 'Puck', G.rect(-s / 2, -s / 2, s, s), { fill: acc, alpha: 0 }, function (p) {
        var pa = 1 - seg(p, 0.6, 0.86);
        if (pa <= 0.01) return { alpha: 0 };
        var startX = dir > 0 ? -c.node.x - s : c.comp.width - c.node.x + s;
        var px = p < t0 ? mix(startX, hitX, iQuad(seg(p, 0, t0))) : hitX + dir * sz * 0.35 * oCubic(seg(p, t0, 0.62));
        return { 'position.x': px, 'position.y': -bx.cy, alpha: pa };
      }, true);
      [-1, 0, 1].forEach(function (ii) {
        addLocalShape(c, loc, rng, 'Spark_' + (ii + 1), G.rect(dir > 0 ? 0 : -s * 0.8, -1, s * 0.8, 2), { fill: acc, alpha: 0 }, function (p) {
          var pa = 1 - seg(p, 0.6, 0.86), f2 = Math.sin(PI * seg(p, t0, t0 + 0.12));
          if (pa <= 0.01 || f2 <= 0.02) return { alpha: 0 };
          return { 'position.x': hitX + dir * s * 0.7, 'position.y': -(bx.cy + ii * s * 0.7), 'scale.x': f2, alpha: pa * f2 };
        }, true);
      });
    });
  }
});

regPost('xjRubberSnap', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, a0 = cutBit(c, 12) ? 0 : 1, sgn = a0 ? -1 : 1, t0 = 0.52, acc = hotOf(c), rng = outRange(c);
  var axV = alongVec(c);
  applyExitWholeRigC(c, function (p, b) {
    var s1 = oCubic(seg(p, 0, t0)), K = 1 + 0.36 * s1, kc = 1 - 0.2 * s1;
    var st = stretchAlongSt(b, v, a0, K, kc);
    if (p > t0) {
      var u = seg(p, t0, 1), k2 = (mix(1.36, 0.5, oExpo(seg(u, 0, 0.22))) + 0.16 * Math.sin(u * 34) * Math.exp(-5 * u)) / 1.36;
      var kc2 = mix(1, 1.4, oCubic(seg(u, 0, 0.2)));
      st = stretchAlongSt(b, v, 1 - a0, K * k2, kc * kc2);
      var dist = Math.max(c.comp.width, c.comp.height) + (v ? b.h : b.w) + sz, e = iQuad(u);
      st.dx = axV[0] * sgn * dist * e; st.dy = axV[1] * sgn * dist * e;
    } else if (p > 0.3) {
      st.dx = Math.sin(p * 190) * sz * 0.006 * s1;
    }
    return st;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var bx = lineBounds(gs), pin = v ? ptAt(bx, 0.5, a0) : ptAt(bx, a0, 0.5), loc = V.local(c, c.node, 'XjRubberPin');
      addLocalShape(c, loc, rng, 'PinRing', G.ellipse(0, 0, 1, 1), { fill: acc, alpha: 0 }, function (p) {
        var pop = seg(p, t0, t0 + 0.12), r = sz * 0.07 * oBack(seg(p, 0, 0.1), 2) * (1 + 1.6 * pop), pa = 1 - pop;
        if (pa <= 0.01 || r <= 0.3) return { alpha: 0 };
        return { 'position.x': pin[0], 'position.y': -pin[1], 'scale.x': r, 'scale.y': r, alpha: pa };
      }, true);
    });
  }
});

regPost('xjCardToss', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, dir = cutBit(c, 13) ? 1 : -1, c0 = inkOf(c), bg = c.sc.bg || '#101010', v = !!c.node.vertical;
  applyExitWholeRigC(c, function (p, b) {
    var u = cl(p), ph = PI * 3.5 * Math.pow(u, 1.15), cs = Math.cos(ph), up = c.comp.height * 0.7;
    var sc = 1 - 0.42 * u, flip = Math.max(0.045, Math.abs(cs));
    return {
      ax: b.cx, ay: b.cy, rot: dir * 22 * u,
      sx: v ? sc * flip : sc, sy: v ? sc : sc * flip,
      dx: dir * c.comp.width * 0.3 * u, dy: -up * u + (up + offDown(c, b, sz) * 1.15) * u * u,
      color: cs < 0 ? H.mixHex(c0, bg, 0.5) : c0,
      a: 1 - H.smoothstep(0.92, 1, p)
    };
  });
});

regPost('xjWallSplat', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, dir = cutBit(c, 14) ? 1 : -1;
  applyExitWholeRigC(c, function (p, b) {
    var d = dir > 0 ? c.comp.width - (c.node.x + b.x1) : (c.node.x + b.x0);
    var q1 = iQuad(seg(p, 0, 0.4)), sq = oCubic(seg(p, 0.4, 0.5)), rb = Math.sin(PI * seg(p, 0.5, 0.66)), f = seg(p, 0.58, 1);
    var st = { dx: dir * d * q1, dy: offDown(c, b, b.h + sz) * iQuad(f), ax: dir > 0 ? b.x1 : b.x0, ay: b.cy, sx: 1, sy: 1 };
    if (sq > 0) {
      st.sx = 1 - 0.7 * sq + 0.1 * rb;
      st.sy = 1 + 0.3 * sq + 0.5 * f;
    }
    return st;
  });
});

regPost('xjSlump', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, dir = cutBit(c, 15) ? 1 : -1, Lv = [1, 0.68, 0.38, 0.09];
  applyExitWholeRigC(c, function (p, b) {
    var x = cl(p / 0.54) * 3, i = Math.min(2, Math.floor(x)), fr = x - i;
    var L = mix(Lv[i], Lv[i + 1], oCubic(seg(fr, 0, 0.6))) + 0.035 * Math.sin(PI * seg(fr, 0.6, 1)) * (p < 0.54 ? 1 : 0);
    var st = stretchBox(b, 0.5, 1, 1 + 0.1 * (1 - L), L);
    st.skew = dir * 42 * (1 - L);
    st.dx = dir * (offX(c, b, dir, sz * 2) * iQuad(seg(p, 0.55, 0.97)) + sz * 0.25 * (1 - L));
    st.a = 1 - H.smoothstep(0.9, 1, p);
    return st;
  });
});

regPost('xjSpringHop', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, acc = hotOf(c), rng = outRange(c);
  applyExitWholeRigC(c, function (p, b) {
    var cc = ioCubic(seg(p, 0, 0.34)), u = seg(p, 0.37, 1);
    var ky = u > 0 ? 1 - 0.5 * Math.cos(u * 17) * Math.exp(-4.2 * u) : 1 - 0.5 * cc;
    var st = stretchBox(b, 0.5, 1, 1 - 0.32 * (ky - 1), ky);
    st.dy = -offUp(c, b, sz * 0.8) * (1 - Math.pow(1 - u, 2.2));
    return st;
  });
  if (rng.ok) {
    post(c, function (graph, ids, gs) {
      var bx = lineBounds(gs), base = bx.y1 + sz * 0.04, th = Math.max(2, sz * 0.025), loc = V.local(c, c.node, 'XjSpringBase');
      addLocalShape(c, loc, rng, 'Pad', G.rect(-0.5, 0, 1, th), { fill: acc, alpha: 0 }, function (p) {
        var cc = ioCubic(seg(p, 0, 0.34)), u = seg(p, 0.37, 1), la = cc * (1 - seg(u, 0.05, 0.4));
        if (la <= 0.01) return { alpha: 0 };
        var w = bx.w * (0.5 + 0.5 * cc) * (1 + 0.5 * seg(u, 0, 0.3));
        return { 'position.x': bx.cx, 'position.y': -base, 'scale.x': Math.max(1, w), alpha: la };
      }, true);
    });
  }
});

regPost('xjTug', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, dir = cutBit(c, 16) ? 1 : -1, W = c.comp.width;
  var K = [0, -0.045 * W, 0.08 * W, -0.13 * W], T = [0, 0.17, 0.36, 0.56];
  applyExitWholeRigC(c, function (p, b) {
    var off = offX(c, b, dir, sz * 2);
    function xAt(q) {
      q = cl(q);
      if (q >= T[3]) return mix(K[3], off - K[3], Math.pow(seg(q, T[3], 0.97), 2.4));
      for (var i = 0; i < 3; i++) if (q < T[i + 1]) return mix(K[i], K[i + 1], ioCubic(seg(q, T[i], T[i + 1])));
      return K[3];
    }
    var x = xAt(p), vx = (xAt(p + 0.008) - xAt(p - 0.008)) / W, sp = Math.min(1, Math.abs(vx) * 40);
    return { ax: b.cx, ay: b.cy, dx: dir * x, skew: dir * cl(vx * 1100, -24, 24), sx: 1 + 0.12 * sp, sy: 1 - 0.05 * sp };
  });
});

regPost('xjDoubleVision', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, crV = crossVec(c), axV = alongVec(c), rng = outRange(c);
  function splitAt(p) {
    var e1 = sz * 0.46 * oCubic(seg(p, 0, 0.7)), e2 = sz * 0.3 * oCubic(seg(p, 0.28, 1));
    var A = mix(1, 0.5, seg(p, 0, 0.3)) * (1 - iQuad(seg(p, 0.4, 1))), k = 1 + 0.05 * p;
    return { e1: e1, e2: e2, A: A, k: k };
  }
  applyExitWholeRigC(c, function (p, b) {
    var s = splitAt(p);
    return { ax: b.cx, ay: b.cy, sx: s.k, sy: s.k, dx: crV[0] * s.e1 + axV[0] * s.e2, dy: crV[1] * s.e1 + axV[1] * s.e2, a: s.A };
  });
  if (rng.ok) {
    [[-1, 1], [1, -1], [-1, -1]].forEach(function (pair, idx) {
      (c.node._jzTwins = c.node._jzTwins || []).push({
        label: 'Double_' + idx, below: true,
        setup: function (graph, clone, src, g, gs) {
          var b = lineBounds(gs); clone.keys = {};
          C.sample(graph, clone.id, clone.start, clone.end, function (f) {
            if (f < rng.start) return { alpha: 0 };
            var p = pCAt(c, f), s = splitAt(p);
            if (s.A <= 0.004 || (pair[1] < 0 && s.e2 <= 0.3) || p >= 0.998) return { alpha: 0 };
            var gx = b.cx + (g.x + (g.vx || 0) - b.cx) * s.k + pair[0] * crV[0] * s.e1 + pair[1] * axV[0] * s.e2;
            var gy = b.cy + (g.y + (g.vy || 0) - b.cy) * s.k + pair[0] * crV[1] * s.e1 + pair[1] * axV[1] * s.e2;
            return { 'position.x': gx, 'position.y': -gy, 'scale.x': s.k, 'scale.y': s.k, alpha: s.A };
          });
        }
      });
    });
  }
});

regPost('xjColourDrain', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, rev = cutBit(c, 17), c0 = inkOf(c), bg = c.sc.bg || '#101010';
  var pale = H.mixHex(c0, bg, 0.8), band = sz * 0.45, Nn = 3, rng = outRange(c);
  function edgeAt(p, b) {
    var F = frameOf(c, b, sz * 0.3), e = ioCubic(seg(p, 0, 0.62));
    var edge = rev ? mix(F.a1 + band * Nn, F.a0, e) : mix(F.a0 - band * Nn, F.a1, e), sg = rev ? 1 : -1;
    return { edge: edge, sg: sg, e: e, F: F };
  }
  applyExitWindowClip(c, false, function (p, bx) {
    var pc = cl(p / 0.88), d = edgeAt(pc, bx);
    if (d.e >= 1 || pc >= 0.998) return [];
    var t0 = d.edge, t1 = d.edge + d.sg * (-BIG);
    return [polyAB(v, Math.min(t0, t1), -BIG, Math.max(t0, t1), BIG)];
  });
  if (rng.ok) {
    for (var k = 0; k <= Nn; k++) {
      (function (kk) {
        (c.node._jzTwins = c.node._jzTwins || []).push({
          label: 'DrainBand_' + kk, below: false,
          setup: function (graph, clone, src, g, gs) {
            var cut = c.cut, parent = c.parent, options = c.options;
            clone.attrs['material.materialColor'] = H.mixHex(c0, pale, (kk + 1) / (Nn + 1));
            clone.keys = {};
            var placeId = rootPlaceNull(graph, [clone.id], cut, c.node, c.comp, parent);
            var bx = lineBounds(gs), byFrame = Object.create(null);
            for (var f = rng.start; f < cut.end; f++) {
              var p = pCAt(c, f), fa = 1 - ioCubic(seg(p, 0.5, 1));
              if (fa <= 0.004 || p >= 0.998) { byFrame[f] = []; continue; }
              var d = edgeAt(p, bx), t0 = d.edge + d.sg * (kk * band), t1 = d.edge + d.sg * (kk === Nn ? BIG : (kk + 1) * band);
              byFrame[f] = [toScenePoly(graph, placeId, f, polyAB(v, Math.min(t0, t1), -BIG, Math.max(t0, t1), BIG))];
            }
            C.sample(graph, clone.id, clone.start, clone.end, function (f) {
              if (f < rng.start) return { alpha: 0 };
              var p = pCAt(c, f), fa = 1 - ioCubic(seg(p, 0.5, 1));
              return { alpha: p >= 0.998 || fa <= 0.004 ? 0 : fa };
            });
            H.multiClip(graph, clone.id, byFrame, false, 'ColourDrain ' + kk, options);
          }
        });
      })(k);
    }
  }
});

regPost('xjComet', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, dir = cutBit(c, 18) ? 1 : -1, c0 = inkOf(c), acc = hotOf(c), rng = outRange(c);
  function poseAt(u, b) {
    u = cl(u);
    var off = offX(c, b, dir, sz * 2), sc = 1 - 0.5 * u;
    return {
      ax: b.cx, ay: b.cy, sx: sc, sy: sc, rot: -dir * 10 * H.smoothstep(0.1, 0.7, u),
      dx: dir * off * Math.pow(u, 2.5), dy: -c.comp.height * 0.42 * Math.pow(u, 1.7) + sz * 0.3 * Math.sin(PI * Math.min(1, u * 2.4)) * (1 - u),
      a: 1 - H.smoothstep(0.9, 1, u)
    };
  }
  applyExitWholeRigC(c, function (p, b) { return poseAt(p, b); });
  if (rng.ok) {
    for (var k = 4; k >= 1; k--) {
      (function (kk) {
        (c.node._jzTwins = c.node._jzTwins || []).push({
          label: 'CometTail_' + kk, below: true,
          setup: function (graph, clone, src, g, gs) {
            var b = lineBounds(gs);
            clone.attrs['material.materialColor'] = H.mixHex(c0, acc, kk / 5);
            clone.keys = {};
            C.sample(graph, clone.id, clone.start, clone.end, function (f) {
              if (f < rng.start) return { alpha: 0 };
              var p = pCAt(c, f), ta = 0.55 * Math.min(1, p * 5);
              if (ta <= 0.01 || p >= 0.998) return { alpha: 0 };
              var ps = poseAt(p - kk * 0.055 * (0.4 + 0.6 * p), b), rad = ps.rot * DEG;
              var gp = rot2((g.x + (g.vx || 0) - b.cx) * ps.sx, (g.y + (g.vy || 0) - b.cy) * ps.sy, rad);
              return { 'position.x': b.cx + gp[0] + ps.dx, 'position.y': -(b.cy + gp[1] + ps.dy),
                rotation: -(g.r90 ? 90 : 0) - ps.rot, 'scale.x': ps.sx, 'scale.y': ps.sy, alpha: ta * Math.pow(0.7, kk - 1) };
            });
          }
        });
      })(k);
    }
  }
});

regPost('xjShellChase', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, dir = cutBit(c, 19) ? 1 : -1, c0 = inkOf(c), rng = outRange(c), lw = Math.max(1.5, sz * 0.02);
  applyExitWholeRigC(c, function (p, b) {
    var off = offX(c, b, dir, sz * 2), q = seg(p, 0, 0.48);
    if (q >= 1) return { a: 0 };
    return { ax: b.cx, ay: b.cy, dx: dir * off * iCubic(q), skew: -dir * 14 * Math.sin(PI * Math.min(1, q * 1.4)), a: 1 };
  });
  if (rng.ok) {
    (c.node._jzTwins = c.node._jzTwins || []).push({
      label: 'EmptyShell', below: true,
      setup: function (graph, clone, src, g, gs) {
        var b = lineBounds(gs), off = offX(c, b, dir, sz * 2);
        clone.attrs.fill = false; clone.attrs.stroke = true;
        clone.attrs['stroke.strokeColor'] = c0; clone.attrs['stroke.width'] = lw;
        clone.keys = {};
        C.sample(graph, clone.id, clone.start, clone.end, function (f) {
          if (f < rng.start) return { alpha: 0 };
          var p = pCAt(c, f), u = seg(p, 0.42, 0.96), e = iCubic(u);
          if (p >= 0.998) return { alpha: 0 };
          var sx = u > 0 ? 1 + 0.45 * Math.min(1, u * 2.5) : 1, sy = u > 0 ? 1 - 0.1 * Math.min(1, u * 2.5) : 1;
          var sh = Math.sin(p * 140) * sz * 0.012 * seg(p, 0.2, 0.4) * (1 - u) + dir * off * e;
          return { 'position.x': b.cx + (g.x + (g.vx || 0) - b.cx) * sx + sh, 'position.y': -(b.cy + (g.y + (g.vy || 0) - b.cy) * sy),
            'scale.x': sx, 'scale.y': sy, alpha: cl(p * 8) * (1 - H.smoothstep(0.9, 1, p)) };
        });
      }
    });
  }
});

regPost('xjShadowStay', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, c0 = inkOf(c), bg = c.sc.bg || '#101010', shC = H.mixHex(bg, c0, 0.34), rng = outRange(c);
  applyExitWholeRigC(c, function (p, b) {
    var q1 = oCubic(seg(p, 0, 0.32)), u = iCubic(seg(p, 0.26, 0.74)), k = 1 + 0.09 * q1 + 0.45 * u;
    return { ax: b.cx, ay: b.cy, sx: k, sy: k, dx: -sz * 0.03 * q1, dy: -sz * 0.22 * q1 - offUp(c, b, b.h * 0.8 + sz) * u };
  });
  if (rng.ok) {
    (c.node._jzTwins = c.node._jzTwins || []).push({
      label: 'LingeringShadow', below: true,
      setup: function (graph, clone, src, g, gs) {
        var b = lineBounds(gs);
        clone.attrs['material.materialColor'] = shC; clone.keys = {};
        C.sample(graph, clone.id, clone.start, clone.end, function (f) {
          if (f < rng.start) return { alpha: 0 };
          var p = pCAt(c, f), q1 = oCubic(seg(p, 0, 0.32)), u = iCubic(seg(p, 0.26, 0.74));
          var sa = seg(p, 0, 0.1) * (1 - ioCubic(seg(p, 0.66, 1))), k = 1 + 0.05 * u;
          if (sa <= 0.004 || p >= 0.998) return { alpha: 0 };
          var gx = b.cx + (g.x + (g.vx || 0) - b.cx) * k + sz * 0.05 * q1;
          var gy = b.cy + sz * 0.1 * q1 + (g.y + (g.vy || 0) - b.cy) * k;
          return { 'position.x': gx, 'position.y': -gy, 'scale.x': k, 'scale.y': k, alpha: sa };
        });
      }
    });
  }
});

regPost('xjThroughFocus', 'src/11p_x2_exC.js', function (c) {
  var t0 = 0.44;
  applyExitWholeRigC(c, function (p, b) {
    if (p < t0) {
      var k = Math.max(0.01, 1 - iCubic(p / t0));
      return { ax: b.cx, ay: b.cy, sx: k, sy: k, a: 1 };
    }
    var q = seg(p, t0, 1), g = oCubic(q), k2 = Math.max(0.01, 1.25 * g);
    return { ax: b.cx, ay: b.cy, rot: 180, sx: k2, sy: k2, a: 0.42 * Math.pow(1 - q, 1.3) };
  });
});

regPost('xjPanSmear', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, v = !!c.node.vertical, axV = alongVec(c), rng = outRange(c);
  applyExitWholeRigC(c, function (p, b) {
    var e = iQuad(p), st = stretchAlongSt(b, v, 0.5, 1 + 0.3 * e, 1 - 0.45 * e);
    st.a = 1 - ioCubic(seg(p, 0.22, 1));
    return st;
  });
  if (rng.ok) {
    [-3, -2, -1, 1, 2, 3].forEach(function (kk) {
      (c.node._jzTwins = c.node._jzTwins || []).push({
        label: 'Smear_' + kk, below: true,
        setup: function (graph, clone, src, g, gs) {
          var b = lineBounds(gs); clone.keys = {};
          C.sample(graph, clone.id, clone.start, clone.end, function (f) {
            if (f < rng.start) return { alpha: 0 };
            var p = pCAt(c, f), d = sz * 0.42 * oCubic(seg(p, 0, 0.85)), e = iQuad(p);
            var ca = 0.55 * seg(p, 0, 0.14) * (1 - ioCubic(seg(p, 0.22, 1)));
            if (ca <= 0.01 || p >= 0.998) return { alpha: 0 };
            var sx = v ? (1 - 0.45 * e) : (1 + 0.3 * e), sy = v ? (1 + 0.3 * e) : (1 - 0.45 * e);
            var amt = d * 1.25 * (kk / 3), gx = b.cx + (g.x + (g.vx || 0) - b.cx) * sx + axV[0] * amt;
            var gy = b.cy + (g.y + (g.vy || 0) - b.cy) * sy + axV[1] * amt;
            return { 'position.x': gx, 'position.y': -gy, 'scale.x': sx, 'scale.y': sy, alpha: ca * Math.pow(0.72, Math.abs(kk) - 1) * (kk < 0 ? 0.8 : 1) };
          });
        }
      });
    });
  }
});

regPost('xjStepFade', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, c0 = inkOf(c), bg = c.sc.bg || '#101010';
  var T = [0.07, 0.29, 0.51, 0.73, 0.92], A = [1, 0.66, 0.4, 0.2, 0.08], M = [0, 0.12, 0.26, 0.4, 0.5];
  applyExitWholeRigC(c, function (p, b) {
    var s = 0; while (s < 5 && p >= T[s]) s++;
    if (!s) return {};
    if (s >= 5) return { a: 0 };
    var k = 1 - 0.014 * s;
    return { ax: b.cx, ay: b.cy, sx: k, sy: k, dy: sz * 0.04 * s, a: A[s], color: H.mixHex(c0, bg, M[s]) };
  }, true);
});

regPost('xjOnionSkin', 'src/11p_x2_exC.js', function (c) {
  var sz = c.node.size, dir = cutBit(c, 20) ? 1 : -1, up = cutBit(c, 21) ? -1 : 1;
  var c0 = inkOf(c), acc = hotOf(c), lw = Math.max(1.5, sz * 0.016), rng = outRange(c);
  var L = Math.max(sz * 0.9, c.comp.width * 0.07), OF = [0, 1, 2.3, 3.9], RT = [0, -5, 4, -9], SC = [1, 0.95, 0.89, 0.82];
  function stepOf(p) { return p < 0.1 ? 0 : p < 0.3 ? 1 : p < 0.5 ? 2 : p < 0.7 ? 3 : 4; }
  applyExitWholeRigC(c, function (p, b) {
    var s = stepOf(p);
    if (!s) return {};
    if (s === 4) return { a: 0 };
    return { ax: b.cx, ay: b.cy, rot: dir * RT[s], sx: SC[s], sy: SC[s], dx: dir * L * OF[s], dy: up * L * 0.32 * OF[s], a: 1 };
  }, true);
  if (rng.ok) {
    [1, 2].forEach(function (backOffset) {
      (c.node._jzTwins = c.node._jzTwins || []).push({
        label: 'Onion_' + backOffset, below: true,
        setup: function (graph, clone, src, g, gs) {
          var b = lineBounds(gs);
          clone.attrs.fill = false; clone.attrs.stroke = true;
          clone.attrs['stroke.strokeColor'] = backOffset === 1 ? acc : c0; clone.attrs['stroke.width'] = lw;
          clone.keys = {};
          C.sample(graph, clone.id, clone.start, clone.end, function (f) {
            if (f < rng.start) return { alpha: 0 };
            var p = pCAt(c, f), s = stepOf(p), j = s - backOffset;
            if (!s || j < 0 || p >= 0.998) return { alpha: 0 };
            var fade = s === 4 ? 1 - seg(p, 0.7, 0.98) : 1, rot = dir * RT[j], sc = SC[j];
            var gp = rot2((g.x + (g.vx || 0) - b.cx) * sc, (g.y + (g.vy || 0) - b.cy) * sc, rot * DEG);
            return {
              'position.x': b.cx + gp[0] + dir * L * OF[j],
              'position.y': -(b.cy + gp[1] + up * L * 0.32 * OF[j]),
              rotation: -(g.r90 ? 90 : 0) - rot, 'scale.x': sc, 'scale.y': sc,
              alpha: (backOffset === 1 ? 0.75 : 0.35) * fade
            };
          });
        }
      });
    });
  }
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
