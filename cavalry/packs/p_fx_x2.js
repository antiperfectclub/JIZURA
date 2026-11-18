/* Remaining 43 native xr* FX recipes from ae/p_x2_fx.jsx (read-only reference).
 * Completes 138/138 of the ae/data.json fx catalog alongside p_fx.js and p_fx_ext.js.
 */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = R.clamp, mix = R.mix, E = R.E, PI = Math.PI, TAU = R.T, DEG = PI / 180;

function reg(key, fn, diffs) {
  N.register('fx', key, {
    source: 'ae/p_x2_fx.jsx / fx:' + key,
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
function ahs(p, a, b) {
  return p < a ? E.outCubic(p / Math.max(1e-4, a)) : (p > b ? 1 - E.inOutCubic((p - b) / Math.max(1e-4, 1 - b)) : 1);
}
function punch(p, a) {
  return p < a ? E.outExpo(p / Math.max(1e-4, a)) : 1 - E.inOutCubic((p - a) / Math.max(1e-4, 1 - a));
}
function spring(p, a) {
  if (p < a) return E.outCubic(p / Math.max(1e-4, a));
  var q = (p - a) / Math.max(1e-4, 1 - a);
  return Math.exp(-2.2 * q) * Math.cos(q * PI * 2.5) * (1 - q);
}
function oq(x) { x = cl(x); return 1 - (1 - x) * (1 - x); }
function iq(x) { x = cl(x); return x * x; }
function ios(x) { return -(Math.cos(PI * cl(x)) - 1) / 2; }
function pop(sc) { return H.accCol(sc); }
function tints(sc) {
  var l = [sc.accent, sc.accent2, sc.ghostA, sc.ghostB], o = [];
  for (var i = 0; i < l.length; i++) if (l[i] && H.contrast(l[i], sc.bg) > 1.3) o.push(l[i]);
  return o.length ? o : [sc.fg];
}
function shade(sc) {
  return H.dark(sc.bg) ? '#000000' : (sc.ink && H.dark(sc.ink) ? sc.ink : (H.dark(sc.fg) ? sc.fg : '#111111'));
}
function prog(f, s) { return (f - s.f0) / Math.max(1, s.f1 - s.f0 - 1); }

/* J.h / J.r / J.rs hash matching ae/p_x2_fx.jsx */
function imul(a, b) { return Math.imul ? Math.imul(a, b) : ((a & 0xffff) * b + (((a >>> 16) * b & 0xffff) << 16)) | 0; }
function xh(a, b, c, d, e) {
  var h = 0x9e3779b9 ^ (a | 0);
  h = imul(h ^ (h >>> 16), 0x85ebca6b);
  h = (h + imul((b | 0) + 0x632be5ab, 0xc2b2ae35)) | 0;
  h = imul(h ^ (h >>> 13), 0xc2b2ae35);
  h = (h + imul((c | 0) + 0x5bd1e995, 0x27d4eb2f)) | 0;
  h = imul(h ^ (h >>> 15), 0x165667b1);
  h = (h + imul((d | 0) + 0x1b873593, 0x85ebca6b)) | 0;
  h = imul(h ^ (h >>> 16), 0x27d4eb2f);
  h = (h + imul((e | 0) + 0x68e31da4, 0x9e3779b1)) | 0;
  h ^= h >>> 15; h = imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = imul(h, 0x297a2d39); h ^= h >>> 15;
  return h >>> 0;
}
function xr(a, b, c, d, e) { return xh(a, b, c, d, e) / 4294967296; }
function xrs(a, b, c, d, e) { return xr(a, b, c, d, e) * 2 - 1; }
function xS(s) { return xh(Math.round((s.f0 / s.fps) * 1000), 5519); }
function xSteps(s) {
  var t0 = s.f0 / s.fps, t1 = Math.max(t0 + 1 / 24, s.f1 / s.fps), st = Math.floor(t0 * 24 + 1e-6), out = [];
  for (; st / 24 < t1 - 1e-4 && out.length < 16; st++) {
    var fStart = Math.max(s.f0, Math.round(st / 24 * s.fps));
    var fEnd = Math.min(s.f1, Math.round((st + 1) / 24 * s.fps));
    if (fEnd > fStart) out.push({ st: st, f0: fStart, f1: fEnd, t0: Math.max(t0, st / 24) });
  }
  if (!out.length) out.push({ st: st, f0: s.f0, f1: s.f1, t0: t0 });
  out[out.length - 1].f1 = s.f1;
  return out;
}

function addOverlay(c, f0, f1, name, cmds, paint, fn) {
  var id = C.shape(c.graph, { id: 'fx', start: f0, end: f1 }, name, c.parent, cmds, paint);
  if (fn) C.sample(c.graph, id, f0, f1, fn);
  return id;
}

function addFullBg(c, s, label) {
  return C.shape(c.graph, { id: 'fx', start: s.f0, end: s.f1 }, 'FX ' + label + ' bg @' + s.f0,
    c.parent, G.rect(-s.W / 2, -s.H / 2, s.W, s.H), { fill: s.sc.bg, alpha: 1 });
}

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

function rotAboutScene(px, py, deg) {
  var th = deg * DEG, cs = Math.cos(th), sn = Math.sin(th);
  return { 'position.x': px - (px * cs + py * sn), 'position.y': py - (-px * sn + py * cs), rotation: -deg };
}

/* 1. xrAccordion */
reg('xrAccordion', function (c, s) {
  var sd = xS(s), n = 2 * (4 + (xh(sd, 1) % 3)), w0 = s.W / n;
  var Q0 = 0.62 * cl(s.amp, 0.5, 1.3) * (xr(sd, 2) < 0.5 ? 1 : -1);
  function qAt(p) { var q = Q0 * Math.sin(p * TAU) * (1 - 0.35 * p); return Math.abs(q) < 0.004 ? 0 : q; }
  addFullBg(c, s, 'xrAccordion');
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var odd = idx % 2, xa = idx * w0, xb = (idx + 1) * w0;
      var pivScX = (odd ? xb : xa) - s.W / 2;
      var cln = cloneActiveCuts(c, s, 'Accordion ' + (idx + 1));
      var polys = Object.create(null), poly = rectPoly(xa - 0.3, -20, xb + 0.3, s.H + 20, s.W, s.H);
      for (var f = s.f0; f < s.f1; f++) polys[f] = poly;
      cln.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
        var sx = Math.max(0.02, 1 + (odd ? -1 : 1) * qAt(prog(f, s)));
        return { 'position.x': pivScX * (1 - sx), 'scale.x': sx };
      });
      addOverlay(c, s.f0, s.f1, 'FX Accordion shade ' + (idx + 1) + ' @' + s.f0,
        G.rect(odd ? -1 : 0, -s.H / 2, 1, s.H), { fill: '#000000', alpha: 1 }, function (f) {
          var q = qAt(prog(f, s)), scX = Math.max(0.02, w0 * (odd ? 1 - q : 1 + q));
          var al = odd ? (q > 0 ? 0.42 * q : 0) : (q < 0 ? -0.42 * q : 0);
          return { 'position.x': pivScX, 'scale.x': scX, alpha: cl(al) };
        });
    })(i);
  }
});

/* 2. xrBandRepeat */
reg('xrBandRepeat', function (c, s) {
  var bh = Math.round(s.H * 0.26), y0 = Math.round(s.H / 2 - bh / 2);
  var SP = bh * 0.92 * cl(cl(s.amp, 0.5, 1.3), 0.7, 1.1);
  for (var i = 3; i >= 1; i--) for (var j = 0; j < 2; j++) {
    (function (idx, dir) {
      var cln = cloneActiveCuts(c, s, 'BandRepeat ' + idx + '_' + dir);
      var polys = Object.create(null), poly = rectPoly(-20, y0, s.W + 20, y0 + bh, s.W, s.H);
      for (var f = s.f0; f < s.f1; f++) polys[f] = poly;
      cln.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
        var e = punch(prog(f, s), 0.3), sp = SP * e < 1 ? 0 : SP * e;
        return { 'position.y': -sp * (dir ? 1 : -1) * idx };
      });
      cln.paintables.forEach(function (pid) {
        var node = c.graph.byId[pid], base = node.attrs.alpha == null ? 1 : node.attrs.alpha;
        node.keys.alpha = node.keys.alpha || {};
        for (var f = s.f0; f < s.f1; f++) {
          var e = punch(prog(f, s), 0.3), sp = SP * e < 1 ? 0 : SP * e;
          node.keys.alpha[f] = { value: sp > 0 ? base * cl(e * 2.5) * (0.7 - idx * 0.16) : 0, type: 1 };
        }
      });
    })(i, j);
  }
});

/* 3. xrBandZoom */
reg('xrBandZoom', function (c, s) {
  var sd = xS(s), nb = 4 + (xh(sd, 1) % 3), A = cl(s.amp, 0.5, 1.3);
  addFullBg(c, s, 'xrBandZoom');
  for (var b = 0; b < nb; b++) {
    (function (idx) {
      var y0 = Math.round(idx * s.H / nb), y1 = Math.round((idx + 1) * s.H / nb);
      var piv = scPt(s.W * (0.5 + xrs(sd, idx, 3) * 0.12), (y0 + y1) / 2, s.W, s.H);
      var k = 0.03 + 0.2 * xr(sd, idx, 2);
      var cln = cloneActiveCuts(c, s, 'BandZoom ' + (idx + 1));
      var polys = Object.create(null), poly = rectPoly(0, y0, s.W, y1, s.W, s.H);
      for (var f = s.f0; f < s.f1; f++) polys[f] = poly;
      cln.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
        var e = punch(prog(f, s), 0.22) * A;
        e = e < 0.004 ? 0 : e;
        var z = 1 + e * k;
        return { 'position.x': piv[0] * (1 - z), 'position.y': piv[1] * (1 - z), 'scale.x': z, 'scale.y': z };
      });
    })(b);
  }
});

/* 4. xrBlink */
reg('xrBlink', function (c, s) {
  var col = H.lum(s.sc.bg) < 0.08 ? H.mixHex(s.sc.bg, s.sc.fg, 0.1) : shade(s.sc);
  function lidPoly(rx, ry) {
    var out = [], Np = 36;
    for (var i = 0; i < Np; i++) {
      var a = i / Np * TAU;
      out.push([Math.cos(a) * rx, Math.sin(a) * ry]);
    }
    return out;
  }
  var contours = Object.create(null);
  for (var f = s.f0; f < s.f1; f++) {
    var p = prog(f, s), b = 4 / 9, cv = p < b ? iq(p / b) : 1 - oq((p - b) / (1 - b));
    var rx = s.W * 0.8 * Math.pow(Math.max(1e-4, 1 - cv), 0.22), ry = s.H * 0.86 * Math.max(0, 1 - cv);
    contours[f] = (cv < 0.003 || ry <= 0.5) ? [] : [lidPoly(rx, ry)];
  }
  var lid = addOverlay(c, s.f0, s.f1, 'FX Blink lids @' + s.f0, G.rect(-s.W / 2 - 4, -s.H / 2 - 4, s.W + 8, s.H + 8), { fill: col, alpha: 1 }, function (f) {
    var p = prog(f, s), b = 4 / 9, cv = p < b ? iq(p / b) : 1 - oq((p - b) / (1 - b));
    return { alpha: cv < 0.003 ? 0 : 1 };
  });
  H.multiClip(c.graph, lid, contours, true, 'Eye opening', c.options);
  addOverlay(c, s.f0, s.f1, 'FX Blink lash @' + s.f0, G.ellipse(0, 0, 1, 1),
    { stroke: pop(s.sc), width: Math.max(1.5, s.H * 0.005), alpha: 1 }, function (f) {
      var p = prog(f, s), b = 4 / 9, cv = p < b ? iq(p / b) : 1 - oq((p - b) / (1 - b));
      var rx = s.W * 0.8 * Math.pow(Math.max(1e-4, 1 - cv), 0.22), ry = s.H * 0.86 * Math.max(0, 1 - cv);
      return { 'scale.x': Math.max(1, rx), 'scale.y': Math.max(1, ry), alpha: (cv < 0.003 || ry <= 1) ? 0 : cl(cv * 2) };
    });
});

/* 5. xrBorderPunch */
reg('xrBorderPunch', function (c, s) {
  var M = Math.min(s.W, s.H), lw = Math.max(1, M * 0.003), A = cl(s.amp, 0.5, 1.3), T0K = M * 0.055 * A;
  function envAt(p) { return p < 0.2 ? E.outBack(p / 0.2, 2) : 1 - E.inOutCubic((p - 0.2) / 0.8); }
  var target = H.rigTarget(c, 'xrBorderPunch', s);
  C.sample(c.graph, target, s.f0, s.f1, function (f) {
    var e = envAt(prog(f, s)), t = T0K * e < 0.5 ? 0 : T0K * e, z = t > 0 ? 1 - 0.07 * A * e : 1;
    return { 'scale.x': Math.max(0.1, z), 'scale.y': Math.max(0.1, z) };
  });
  var borderHole = Object.create(null), bgHole = Object.create(null);
  for (var f = s.f0; f < s.f1; f++) {
    var e = envAt(prog(f, s)), t = T0K * e < 0.5 ? 0 : T0K * e, z = t > 0 ? 1 - 0.07 * A * e : 1;
    borderHole[f] = t > 0 ? [rectPoly(t, t, s.W - t, s.H - t, s.W, s.H)] : [rectPoly(0, 0, s.W, s.H, s.W, s.H)];
    bgHole[f] = z < 1 ? [rectPoly(s.W * (1 - z) / 2, s.H * (1 - z) / 2, s.W * (1 + z) / 2, s.H * (1 + z) / 2, s.W, s.H)] : [rectPoly(0, 0, s.W, s.H, s.W, s.H)];
  }
  var bgId = addOverlay(c, s.f0, s.f1, 'FX BorderPunch ground @' + s.f0, G.rect(-s.W / 2 - 4, -s.H / 2 - 4, s.W + 8, s.H + 8), { fill: s.sc.bg, alpha: 1 });
  H.multiClip(c.graph, bgId, bgHole, true, 'Ground hole', c.options);
  var brId = addOverlay(c, s.f0, s.f1, 'FX BorderPunch border @' + s.f0, G.rect(-s.W / 2 - 4, -s.H / 2 - 4, s.W + 8, s.H + 8), { fill: pop(s.sc), alpha: 1 });
  H.multiClip(c.graph, brId, borderHole, true, 'Border hole', c.options);
  addOverlay(c, s.f0, s.f1, 'FX BorderPunch line @' + s.f0, G.rect(-s.W / 2, -s.H / 2, s.W, s.H), { stroke: s.sc.fg, width: lw, alpha: 1 }, function (f) {
    var e = envAt(prog(f, s)), t = T0K * e < 0.5 ? 0 : T0K * e, o = t * 1.35;
    return { 'scale.x': Math.max(1e-3, (s.W - 2 * o) / s.W), 'scale.y': Math.max(1e-3, (s.H - 2 * o) / s.H), alpha: t > 0 ? cl(e) : 0 };
  });
});

/* 6. xrCheckerInvert */
reg('xrCheckerInvert', function (c, s) {
  var sd = xS(s), cell = Math.min(s.W, s.H) / (4 + (xh(sd, 1) % 2));
  var nx = Math.ceil(s.W / cell / 2) * 2 + 1, ny = Math.ceil(s.H / cell / 2) * 2 + 1;
  var ox = (s.W - nx * cell) / 2, oy = (s.H - ny * cell) / 2, AM = Math.min(1, cl(s.amp, 0.3, 1.6));
  var col = H.dark(s.sc.bg) ? '#FFFFFF' : s.sc.fg;
  for (var ph = 0; ph < 2; ph++) {
    var contours = Object.create(null);
    for (var f = s.f0; f < s.f1; f++) {
      var p = prog(f, s);
      if ((ph === 0 && p >= 0.5) || (ph === 1 && p < 0.5)) { contours[f] = []; continue; }
      var e = (p < 0.5 ? ahr(p * 2, 0.5, 0.82) : ahr((p - 0.5) * 2, 0.18, 0.5)) * AM, sz = cell * e;
      if (sz < 0.5) { contours[f] = []; continue; }
      var polys = [];
      for (var iy = 0; iy < ny; iy++) for (var ix = 0; ix < nx; ix++) {
        if ((ix + iy) % 2 !== ph) continue;
        var cx = ox + (ix + 0.5) * cell, cy = oy + (iy + 0.5) * cell;
        polys.push(rectPoly(cx - sz / 2, cy - sz / 2, cx + sz / 2, cy + sz / 2, s.W, s.H));
      }
      contours[f] = polys;
    }
    var id = addOverlay(c, s.f0, s.f1, 'FX CheckerInvert ph' + (ph + 1) + ' @' + s.f0,
      G.rect(-s.W / 2, -s.H / 2, s.W, s.H), { fill: col, alpha: 0.72 });
    H.multiClip(c.graph, id, contours, false, 'Checker phase ' + ph, c.options);
  }
}, ['Checker invert uses high-contrast silhouette squares rather than a Difference blend mode.']);

/* 7. xrClockInvert */
reg('xrClockInvert', function (c, s) {
  var sd = xS(s), q4 = xh(sd, 1) % 4, ccw = xr(sd, 2) < 0.5, sg = ccw ? -1 : 1, R = Math.hypot(s.W, s.H);
  function wedgePoly(a0Deg, a1Deg) {
    var pts = [scPt(s.W / 2, s.H / 2, s.W, s.H)], n = 20;
    for (var i = 0; i <= n; i++) {
      var a = (a0Deg + (a1Deg - a0Deg) * i / n) * DEG;
      pts.push(scPt(s.W / 2 + Math.cos(a) * R, s.H / 2 + Math.sin(a) * R, s.W, s.H));
    }
    return pts;
  }
  var contours = Object.create(null);
  for (var f = s.f0; f < s.f1; f++) {
    var p = prog(f, s), fa = p < 0.5 ? E.inOutCubic(p * 2) : 1, fb = p < 0.5 ? 0 : E.inOutCubic((p - 0.5) * 2);
    var a0 = -90 + q4 * 90 + sg * 360 * fb, a1 = -90 + q4 * 90 + sg * 360 * fa;
    contours[f] = Math.abs(a1 - a0) < 1 ? [] : [wedgePoly(a0, a1)];
  }
  var wId = addOverlay(c, s.f0, s.f1, 'FX ClockInvert wedge @' + s.f0,
    G.rect(-s.W / 2, -s.H / 2, s.W, s.H), { fill: H.dark(s.sc.bg) ? '#FFFFFF' : s.sc.fg, alpha: 0.55 });
  H.multiClip(c.graph, wId, contours, false, 'Clock wedge', c.options);
  var lw = Math.max(1.5, Math.min(s.W, s.H) * 0.005);
  addOverlay(c, s.f0, s.f1, 'FX ClockInvert hand @' + s.f0, G.rect(0, -lw / 2, R, lw), { fill: pop(s.sc), alpha: 1 }, function (f) {
    var p = prog(f, s), fa = p < 0.5 ? E.inOutCubic(p * 2) : 1, fb = p < 0.5 ? 0 : E.inOutCubic((p - 0.5) * 2);
    var deg = -90 + q4 * 90 + sg * 360 * (p < 0.5 ? fa : fb);
    return { rotation: -deg, alpha: (fa - fb) < 0.002 ? 0 : 1 };
  });
}, ['Clock sweep renders a translucent high-contrast wedge overlay rather than a Difference pixel buffer.']);

/* 8. xrColorStrobe */
reg('xrColorStrobe', function (c, s) {
  var sd = xS(s), cols = tints(s.sc), off = xh(sd, 1) % cols.length, dk = H.dark(s.sc.bg), AM = cl(s.amp, 0.5, 1);
  for (var seg = 0; seg < 3; seg++) {
    var f0 = s.f0 + Math.floor(seg * (s.f1 - s.f0) / 3);
    var f1 = seg < 2 ? s.f0 + Math.floor((seg + 1) * (s.f1 - s.f0) / 3) : s.f1;
    if (f1 <= f0) continue;
    (function (col, i) {
      addOverlay(c, f0, f1, 'FX ColorStrobe ' + (i + 1) + ' @' + s.f0,
        G.rect(-s.W / 2, -s.H / 2, s.W, s.H), { fill: col, alpha: 1 }, function (f) {
          var p = prog(f, s), fr = p * 3 - i, a = AM * (1 - 0.55 * fr) * (1 - p * p * p);
          return { alpha: a < 0.01 ? 0 : cl((dk ? 0.5 : 0.4) * a) };
        });
    })(cols[(seg + off) % cols.length], seg);
  }
});

/* 9. xrColumnDrop */
reg('xrColumnDrop', function (c, s) {
  var sd = xS(s), n = 10 + (xh(sd, 1) % 8), rev = xr(sd, 2) < 0.5, up = xr(sd, 4) < 0.3 ? -1 : 1, A = cl(s.amp, 0.5, 1.3);
  addFullBg(c, s, 'xrColumnDrop');
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var x0 = Math.round(idx * s.W / n), x1 = Math.round((idx + 1) * s.W / n);
      var o = (rev ? n - 1 - idx : idx) / (n - 1), cf = 0.09 + 0.15 * xr(sd, idx, 3);
      var cln = cloneActiveCuts(c, s, 'ColDrop ' + (idx + 1));
      var polys = Object.create(null), poly = rectPoly(x0, 0, x1, s.H, s.W, s.H);
      for (var f = s.f0; f < s.f1; f++) polys[f] = poly;
      cln.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
        var u = cl((prog(f, s) - o * 0.42) / 0.58), e = u < 0.38 ? iq(u / 0.38) : 1 - E.inOutCubic((u - 0.38) / 0.62);
        return { 'position.y': -Math.round(up * s.H * cf * A * e) };
      });
    })(i);
  }
});

/* 10. xrCornerFold */
reg('xrCornerFold', function (c, s) {
  var sd = xS(s), cn = xh(sd, 1) % 4, lw = Math.max(1, Math.min(s.W, s.H) * 0.003);
  var F0 = Math.min(s.W, s.H) * 0.4 * cl(s.amp, 0.5, 1.3);
  var sx = (cn & 1) ? -1 : 1, sy = (cn & 2) ? 1 : -1;
  var cx = (cn & 1) ? s.W / 2 : -s.W / 2, cy = (cn & 2) ? -s.H / 2 : s.H / 2;
  function tri(pts, name, paint) {
    var norm = pts.map(function (q) { return [q[0] * sx / 100, q[1] * sy / 100]; });
    addOverlay(c, s.f0, s.f1, name, V.commands(norm, true), paint, function (f) {
      var fo = F0 * ahs(prog(f, s), 0.3, 0.62);
      if (fo < 1) return { 'position.x': cx, 'position.y': cy, 'scale.x': 1, 'scale.y': 1, alpha: 0 };
      return { 'position.x': cx, 'position.y': cy, 'scale.x': fo, 'scale.y': fo, alpha: paint.alpha == null ? 1 : paint.alpha };
    });
  }
  tri([[0, 0], [100, 0], [0, 100]], 'FX CornerFold under @' + s.f0, { fill: pop(s.sc), alpha: 1 });
  tri([[125, 0], [0, 125], [125, 125]], 'FX CornerFold shadow @' + s.f0, { fill: '#000000', alpha: 0.17 });
  tri([[100, 0], [0, 100], [100, 100]], 'FX CornerFold flap @' + s.f0, { fill: H.mixHex(s.sc.bg, s.sc.fg, H.dark(s.sc.bg) ? 0.24 : 0.1), alpha: 1 });
  tri([[100, 0], [0, 100], [50, 100], [100, 50]], 'FX CornerFold shade @' + s.f0, { fill: '#000000', alpha: 0.12 });
  addOverlay(c, s.f0, s.f1, 'FX CornerFold crease @' + s.f0,
    V.commands([[sx, 0], [0, sy]], false), { stroke: s.sc.fg, width: lw, alpha: 0.6 }, function (f) {
      var fo = F0 * ahs(prog(f, s), 0.3, 0.62);
      return { 'position.x': cx, 'position.y': cy, 'scale.x': Math.max(1, fo), 'scale.y': Math.max(1, fo),
        'stroke.width': lw / Math.max(1, fo), alpha: fo >= 1 ? 0.6 : 0 };
    });
});

/* 11. xrCrossFringe */
reg('xrCrossFringe', function (c, s) {
  var sd = xS(s), sw = xr(sd, 1) < 0.5, DK = 0.1 * cl(s.amp, 0.5, 1.3);
  var gA = s.sc.ghostA || s.sc.accent, gB = s.sc.ghostB || s.sc.accent2 || s.sc.accent;
  var cols = [sw ? gB : gA, sw ? gA : gB];
  cols.forEach(function (col, k) {
    var cln = cloneActiveCuts(c, s, 'CrossFringe ' + (k ? 'wide' : 'tall'), { inkOnly: true, tintColor: col, belowCuts: true });
    C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
      var d = DK * punch(prog(f, s), 0.2); d = d < 0.002 ? 0 : d;
      return k ? { 'scale.x': 1 + d } : { 'scale.y': 1 + d * 1.6 };
    });
    cln.paintables.forEach(function (pid) {
      var n = c.graph.byId[pid], base = n.attrs.alpha == null ? 1 : n.attrs.alpha;
      n.keys.alpha = n.keys.alpha || {};
      for (var f = s.f0; f < s.f1; f++) {
        var d = DK * punch(prog(f, s), 0.2);
        n.keys.alpha[f] = { value: d >= 0.002 ? base * 0.95 : 0, type: 1 };
      }
    });
  });
});

/* 12. xrCrossSplit */
reg('xrCrossSplit', function (c, s) {
  var sd = xS(s), M = Math.min(s.W, s.H), lw = Math.max(1, M * 0.003), G0 = M * 0.04 * cl(s.amp, 0.5, 1.3);
  var xs = Math.round(s.W * (0.5 + xrs(sd, 1) * 0.1)), ys = Math.round(s.H * (0.5 + xrs(sd, 2) * 0.06));
  addFullBg(c, s, 'xrCrossSplit');
  var Q = [[0, 0, xs, ys, -1, -1], [xs, 0, s.W, ys, 1, -1], [0, ys, xs, s.H, -1, 1], [xs, ys, s.W, s.H, 1, 1]];
  Q.forEach(function (q, idx) {
    var cln = cloneActiveCuts(c, s, 'CrossSplit Q' + (idx + 1));
    var polys = Object.create(null), poly = rectPoly(q[0], q[1], q[2], q[3], s.W, s.H);
    for (var f = s.f0; f < s.f1; f++) polys[f] = poly;
    cln.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
    C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
      var e = punch(prog(f, s), 0.25), g = G0 * e < 0.5 ? 0 : G0 * e;
      return { 'position.x': q[4] * g, 'position.y': -q[5] * g };
    });
  });
  var scCenter = scPt(xs, ys, s.W, s.H);
  addOverlay(c, s.f0, s.f1, 'FX CrossSplit v @' + s.f0, G.rect(scCenter[0] - lw / 2, -s.H / 2, lw, s.H), { fill: pop(s.sc), alpha: 1 }, function (f) {
    var e = punch(prog(f, s), 0.25), g = G0 * e;
    return { alpha: g >= 0.5 ? cl(e * 1.3) : 0 };
  });
  addOverlay(c, s.f0, s.f1, 'FX CrossSplit h @' + s.f0, G.rect(-s.W / 2, scCenter[1] - lw / 2, s.W, lw), { fill: pop(s.sc), alpha: 1 }, function (f) {
    var e = punch(prog(f, s), 0.25), g = G0 * e;
    return { alpha: g >= 0.5 ? cl(e * 1.3) : 0 };
  });
});

/* 13. xrCrosshair */
reg('xrCrosshair', function (c, s) {
  var sd = xS(s), M = Math.min(s.W, s.H), a = cl(s.amp, 0.7, 1.3);
  var tx = Math.round(s.W * (0.5 + xrs(sd, 1) * 0.16)), ty = Math.round(s.H * (0.5 + xrs(sd, 2) * 0.12));
  var x0 = xr(sd, 3) < 0.5 ? 0 : s.W, y0 = xr(sd, 4) < 0.5 ? 0 : s.H;
  var lw = Math.max(1, Math.round(M * 0.004 * a)), R0 = M * 0.045 * a, tSc = scPt(tx, ty, s.W, s.H);
  var Cpts = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  var brCmds = [];
  for (var i = 0; i < 4; i++) {
    brCmds.push(['M', Cpts[i][0], Cpts[i][1] * 0.55], ['L', Cpts[i][0], Cpts[i][1]], ['L', Cpts[i][0] * 0.55, Cpts[i][1]]);
  }
  addOverlay(c, s.f0, s.f1, 'FX Crosshair reticle @' + s.f0, brCmds, { stroke: s.sc.fg, width: lw * 1.5, alpha: 1 }, function (f) {
    var p = prog(f, s), q = (p - 0.38) / 0.62, r = R0 * (1 + 1.6 * E.outCubic(Math.max(0, q)));
    return { 'position.x': tSc[0], 'position.y': tSc[1], 'scale.x': Math.max(1, r), 'scale.y': Math.max(1, r),
      'stroke.width': lw * 1.5 / Math.max(1, r), alpha: q > 0 ? cl(1 - iq(q)) : 0 };
  });
  addOverlay(c, s.f0, s.f1, 'FX Crosshair vx @' + s.f0, G.rect(-lw / 2, -s.H / 2, lw, s.H), { fill: pop(s.sc), alpha: 1 }, function (f) {
    var p = prog(f, s), pp = E.outExpo(cl(p / 0.42)), fade = p > 0.62 ? 1 - iq((p - 0.62) / 0.38) : 1;
    var x = x0 + (tx - x0) * pp;
    return { 'position.x': x - s.W / 2, alpha: cl(fade * cl(p * 12)) };
  });
  addOverlay(c, s.f0, s.f1, 'FX Crosshair hy @' + s.f0, G.rect(-s.W / 2, -lw / 2, s.W, lw), { fill: pop(s.sc), alpha: 1 }, function (f) {
    var p = prog(f, s), pp = E.outExpo(cl(p / 0.42)), fade = p > 0.62 ? 1 - iq((p - 0.62) / 0.38) : 1;
    var y = y0 + (ty - y0) * pp;
    return { 'position.y': s.H / 2 - y, alpha: cl(fade * cl(p * 12)) };
  });
  addOverlay(c, s.f0, s.f1, 'FX Crosshair lock @' + s.f0, G.rect(-1, -1, 2, 2), { fill: '#FFFFFF', alpha: 0.7 }, function (f) {
    var p = prog(f, s), q = (p - 0.38) / 0.62, r = R0 * (1 + 1.6 * E.outCubic(Math.max(0, q)));
    return { 'position.x': tSc[0], 'position.y': tSc[1], 'scale.x': Math.max(1, r), 'scale.y': Math.max(1, r), alpha: (q > 0 && q < 0.25) ? 0.65 : 0 };
  });
});

/* 14. xrDiagSlice */
reg('xrDiagSlice', function (c, s) {
  var sd = xS(s), th = (xr(sd, 1) < 0.5 ? 1 : -1) * (18 + 20 * xr(sd, 2)) * DEG;
  var D = Math.hypot(s.W, s.H), cs = Math.cos(th), sn = Math.sin(th), cx = s.W / 2, cy = s.H / 2;
  var lw = Math.max(1.5, Math.min(s.W, s.H) * 0.004), D0 = Math.min(s.W, s.H) * 0.13 * cl(s.amp, 0.5, 1.3);
  function P(x, y) { return scPt(cx + x * cs - y * sn, cy + x * sn + y * cs, s.W, s.H); }
  addFullBg(c, s, 'xrDiagSlice');
  for (var hf = 0; hf < 2; hf++) {
    (function (h) {
      var sg = h ? -1 : 1, ux = sg * cs, uy = sg * sn;
      var half = [P(-D, h ? 0 : -D), P(D, h ? 0 : -D), P(D, h ? D : 0), P(-D, h ? D : 0)];
      var cln = cloneActiveCuts(c, s, 'DiagSlice ' + (h ? 'B' : 'A'));
      var polys = Object.create(null);
      for (var f = s.f0; f < s.f1; f++) polys[f] = half;
      cln.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
        var d = D0 * punch(prog(f, s), 0.3); d = d < 0.5 ? 0 : d;
        return { 'position.x': ux * d, 'position.y': -uy * d };
      });
    })(hf);
  }
  addOverlay(c, s.f0, s.f1, 'FX DiagSlice cut @' + s.f0, G.rect(-D, -lw / 2, 2 * D, lw),
    { fill: pop(s.sc), alpha: 1 }, function (f) {
      var e = punch(prog(f, s), 0.3), d = D0 * e;
      return { rotation: -(th / DEG), alpha: d >= 0.5 ? cl(e * 1.4) : 0 };
    });
});

/* 15. xrDotWave */
reg('xrDotWave', function (c, s) {
  var sd = xS(s), M = Math.min(s.W, s.H), pt = M / 19, cn = xh(sd, 1) % 4;
  var ox = (cn & 1) ? s.W : 0, oy = (cn & 2) ? s.H : 0, DG = Math.hypot(s.W, s.H), BD = DG * 0.2;
  var rm = pt * 0.47 * cl(s.amp, 0.7, 1.05), nx = Math.ceil(s.W / pt) + 1, ny = Math.ceil(s.H / pt) + 1;
  var col = pop(s.sc), tiers = [[0.36, 0.92], [0.72, 0.64], [0.95, 0.34]];
  for (var iy = 0; iy < ny; iy++) for (var ix = 0; ix < nx; ix++) {
    var x = ix * pt + (iy % 2 ? pt / 2 : 0), y = iy * pt;
    var dist = Math.hypot(x - ox, y - oy);
    if (dist > DG + BD * 1.2) continue;
    (function (px, py, dd) {
      var pSc = scPt(px, py, s.W, s.H);
      addOverlay(c, s.f0, s.f1, 'FX DotWave dot @' + s.f0, G.ellipse(pSc[0], pSc[1], rm, rm), { fill: col, alpha: 1 }, function (f) {
        var R = -BD + (DG + 2 * BD) * oq(prog(f, s)), d = Math.abs(dd - R);
        if (d > BD * 0.92) return { 'scale.x': 0.01, 'scale.y': 0.01, alpha: 0 };
        var scf = d < BD * 0.34 ? 0.95 : (d < BD * 0.64 ? 0.72 : 0.36);
        return { 'position.x': pSc[0] * (1 - scf), 'position.y': pSc[1] * (1 - scf), 'scale.x': scf, 'scale.y': scf, alpha: 1 };
      });
    })(x, y, dist);
  }
});

/* 16. xrDropout */
reg('xrDropout', function (c, s) {
  var sd = xS(s), St = xSteps(s), B = Math.max(4, Math.round(Math.min(s.W, s.H) / 10));
  var n0 = (4 + (xh(sd, 1) % 4)) * cl(s.amp, 0.5, 1.3), nx = Math.ceil(s.W / B), ny = Math.ceil(s.H / B);
  var lw = Math.max(1, Math.round(B * 0.05)), gc = [s.sc.ghostA || s.sc.accent, s.sc.ghostB || s.sc.accent2 || s.sc.accent];
  St.forEach(function (step, j) {
    var st = step.st * 29 + sd, k = cl((step.f0 - s.f0) / Math.max(1, s.f1 - s.f0 - 1));
    var n = Math.round(n0 * (1 - k)), holeCmds = [], lineCmds = [[], []];
    for (var i = 0; i < n; i++) {
      var gw = 1 + (xh(st, i, 2) % 4), gh = 1 + (xh(st, i, 3) % 2);
      var x = (xh(st, i, 4) % Math.max(1, nx - gw + 1)) * B, y = Math.round(ny * (0.2 + 0.6 * xr(st, i, 5)) - gh / 2) * B;
      holeCmds = holeCmds.concat(G.rect(x - s.W / 2, s.H / 2 - (y + gh * B), gw * B, gh * B));
      var cc = xr(st, i, 6) < 0.5 ? 0 : 1;
      var lrect = xr(st, i, 7) < 0.5
        ? G.rect(x - s.W / 2, s.H / 2 - (y + gh * B), lw, gh * B)
        : G.rect(x - s.W / 2, s.H / 2 - (y + gh * B), gw * B, lw);
      lineCmds[cc] = lineCmds[cc].concat(lrect);
    }
    for (var cc2 = 0; cc2 < 2; cc2++) {
      if (lineCmds[cc2].length) addOverlay(c, step.f0, step.f1, 'FX Dropout edge ' + j + '_' + cc2, lineCmds[cc2], { fill: gc[cc2], alpha: 0.8 });
    }
    if (holeCmds.length) addOverlay(c, step.f0, step.f1, 'FX Dropout holes ' + j, holeCmds, { fill: s.sc.bg, alpha: 1 });
  });
});

/* 17. xrEdgeBars */
reg('xrEdgeBars', function (c, s) {
  var sd = xS(s), vert = xr(sd, 1) < (s.W >= s.H ? 0.3 : 0.55), LL = vert ? s.W : s.H, M = vert ? s.H : s.W;
  var col = pop(s.sc), TK = LL * 0.06 * cl(s.amp, 0.5, 1.3);
  function thAt(p) { var e = p < 0.14 ? E.outExpo(p / 0.14) : Math.pow(Math.max(0, 1 - (p - 0.14) / 0.86), 1.6); return { e: e, th: TK * e < 0.5 ? 0 : TK * e }; }
  [0, 1].forEach(function (side) {
    addOverlay(c, s.f0, s.f1, 'FX EdgeBars bar ' + side + ' @' + s.f0,
      vert ? G.rect(0, -M / 2, 1, M) : G.rect(-M / 2, -1, M, 1), { fill: col, alpha: 1 }, function (f) {
        var r = thAt(prog(f, s)), th = r.th;
        if (th <= 0) return { alpha: 0 };
        return vert
          ? { 'position.x': side ? s.W / 2 - th : -s.W / 2, 'scale.x': th, alpha: 1 }
          : { 'position.y': side ? -s.H / 2 + th : s.H / 2, 'scale.y': th, alpha: 1 };
      });
    addOverlay(c, s.f0, s.f1, 'FX EdgeBars glow ' + side + ' @' + s.f0,
      vert ? G.rect(0, -M / 2, 1, M) : G.rect(-M / 2, -1, M, 1), { fill: col, alpha: 0.25 }, function (f) {
        var r = thAt(prog(f, s));
        return vert
          ? { 'position.x': side ? s.W / 2 - LL * 0.1 : -s.W / 2, 'scale.x': LL * 0.1, alpha: r.th > 0 ? cl(0.28 * r.e) : 0 }
          : { 'position.y': side ? -s.H / 2 + LL * 0.1 : s.H / 2, 'scale.y': LL * 0.1, alpha: r.th > 0 ? cl(0.28 * r.e) : 0 };
      });
    addOverlay(c, s.f0, s.f1, 'FX EdgeBars line ' + side + ' @' + s.f0,
      vert ? G.rect(0, -M / 2, 1, M) : G.rect(-M / 2, -1, M, 1), { fill: s.sc.fg, alpha: 1 }, function (f) {
        var r = thAt(prog(f, s)), th = r.th;
        if (th <= 0) return { alpha: 0 };
        var lw = Math.max(0.5, th * 0.15), a = side ? LL - th * 1.45 : th * 1.3;
        return vert
          ? { 'position.x': a - s.W / 2, 'scale.x': lw, alpha: cl(r.e) }
          : { 'position.y': s.H / 2 - a, 'scale.y': lw, alpha: cl(r.e) };
      });
  });
});

/* 18. xrExposureDip */
reg('xrExposureDip', function (c, s) {
  var dk = H.dark(s.sc.bg), AM = cl(s.amp, 0.6, 1.1);
  H.fullRect(c, s, 'FX ExposureDip dim @' + s.f0, shade(s.sc), function (p) {
    var d = p < 0.28 ? E.outCubic(p / 0.28) : 1 - E.inOutCubic(cl((p - 0.28) / 0.34));
    return d > 0.005 ? (dk ? 0.86 : 0.7) * AM * d : 0;
  });
  H.fullRect(c, s, 'FX ExposureDip over @' + s.f0, dk ? s.sc.fg : '#FFFFFF', function (p) {
    var o = p > 0.55 ? H.bell((p - 0.55) / 0.45) : 0;
    return o > 0.005 ? (dk ? 0.13 : 0.4) * AM * o : 0;
  });
});

/* 19. xrFlipTiles */
reg('xrFlipTiles', function (c, s) {
  var sd = xS(s), M = Math.min(s.W, s.H), gx = Math.max(3, Math.round(s.W / (M / 3.2))), gy = Math.max(3, Math.round(s.H / (M / 3.2)));
  var rev = xr(sd, 1) < 0.5, back = pop(s.sc), back2 = H.mixHex(back, s.sc.bg, 0.35), part = 0.55 + 0.35 * cl(s.amp - 0.3, 0, 1);
  function ccAt(p, o) { var u = cl((p - o * 0.45) / 0.55); return (u <= 0 || u >= 1) ? 2 : Math.cos(TAU * E.inOutCubic(u)); }
  for (var j = 0; j < gy; j++) for (var i = 0; i < gx; i++) {
    if (xr(sd, i, j, 2) > part) continue;
    (function (ix, iy) {
      var x0 = Math.round(ix * s.W / gx), x1 = Math.round((ix + 1) * s.W / gx);
      var y0 = Math.round(iy * s.H / gy), y1 = Math.round((iy + 1) * s.H / gy);
      var tw = x1 - x0, th = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      var o = ((rev ? gx - 1 - ix : ix) + iy) / Math.max(1, gx + gy - 2), pSc = scPt(cx, cy, s.W, s.H);
      addOverlay(c, s.f0, s.f1, 'FX FlipTiles bg ' + ix + '_' + iy, G.rect(pSc[0] - tw / 2, pSc[1] - th / 2, tw, th), { fill: s.sc.bg, alpha: 1 }, function (f) {
        return { alpha: ccAt(prog(f, s), o) <= 1 ? 1 : 0 };
      });
      var cln = cloneActiveCuts(c, s, 'FlipTile ' + ix + '_' + iy);
      var polys = Object.create(null), poly = rectPoly(x0, y0, x1, y1, s.W, s.H);
      for (var f = s.f0; f < s.f1; f++) polys[f] = poly;
      cln.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
        var cv = ccAt(prog(f, s), o), sx = cv > 1 ? 1 : Math.max(0.01, cv);
        return { 'position.x': pSc[0] * (1 - sx), 'scale.x': sx };
      });
      cln.paintables.forEach(function (pid) {
        var nd = c.graph.byId[pid], base = nd.attrs.alpha == null ? 1 : nd.attrs.alpha;
        nd.keys.alpha = nd.keys.alpha || {};
        for (var f = s.f0; f < s.f1; f++) {
          var cv = ccAt(prog(f, s), o);
          nd.keys.alpha[f] = { value: cv > 0 ? base : 0, type: 1 };
        }
      });
      addOverlay(c, s.f0, s.f1, 'FX FlipTiles back ' + ix + '_' + iy, G.rect(-tw / 2, -th / 2, tw, th),
        { fill: (ix + iy) % 2 ? back : back2, alpha: 1 }, function (f) {
          var cv = ccAt(prog(f, s), o);
          return cv < 0 ? { 'position.x': pSc[0], 'position.y': pSc[1], 'scale.x': Math.max(0.01, -cv), alpha: 1 } : { alpha: 0 };
        });
    })(i, j);
  }
});

/* 20. xrFourTints */
reg('xrFourTints', function (c, s) {
  var sd = xS(s), base = tints(s.sc), cols = [], xs = Math.round(s.W / 2), ys = Math.round(s.H / 2);
  for (var i = 0; i < 4; i++) cols.push(i < base.length ? base[i] : H.mixHex(base[i % base.length], s.sc.fg, 0.5));
  var R0 = xh(sd, 1) % 4, AM = Math.min(1, s.amp);
  var Q = [[0, 0, xs, ys], [xs, 0, s.W - xs, ys], [xs, ys, s.W - xs, s.H - ys], [0, ys, xs, s.H - ys]];
  for (var seg = 0; seg < 4; seg++) {
    var f0 = s.f0 + Math.floor(seg * (s.f1 - s.f0) / 4);
    var f1 = seg < 3 ? s.f0 + Math.floor((seg + 1) * (s.f1 - s.f0) / 4) : s.f1;
    if (f1 <= f0) continue;
    for (var q = 0; q < 4; q++) {
      var col = cols[(q + seg + R0) % 4], r = Q[q], pSc = scPt(r[0], r[1] + r[3], s.W, s.H);
      addOverlay(c, f0, f1, 'FX FourTints s' + seg + '_q' + q, G.rect(pSc[0], pSc[1], r[2], r[3]), { fill: col, alpha: 0.45 }, function (f) {
        var a = ahr(prog(f, s), 0.12, 0.7) * AM;
        return { alpha: a < 0.01 ? 0 : cl(0.45 * a) };
      });
    }
  }
});

/* 21. xrLampFlicker */
reg('xrLampFlicker', function (c, s) {
  var sd = xS(s), St = xSteps(s), AM = cl(s.amp, 0.6, 1.15), col = shade(s.sc);
  H.fullRect(c, s, 'FX LampFlicker @' + s.f0, col, function (p, df, f) {
    var st = St[0].st;
    for (var j = 0; j < St.length; j++) if (f >= St[j].f0 && f < St[j].f1) { st = St[j].st; break; }
    var v = xr(st, sd, 1), lvl = p < 0.12 ? 0.8 : (v < 0.3 ? 0.78 : (v < 0.55 ? 0.42 : (v < 0.75 ? 0.14 : 0)));
    var a = Math.min(0.88, lvl * AM * Math.pow(Math.max(0, 1 - p), 0.6));
    return a < 0.01 ? 0 : a;
  });
});

/* 22. xrLetterSnap */
reg('xrLetterSnap', function (c, s) {
  var list = [s.sc.ink, s.sc.fg, s.sc.bg], dkst = null;
  for (var i = 0; i < list.length; i++) if (list[i] && (dkst === null || H.lum(list[i]) < H.lum(dkst))) dkst = list[i];
  var col = H.contrast(dkst, s.sc.bg) > 1.25 ? dkst : H.mixHex(s.sc.bg, s.sc.fg, 0.2);
  var lw = Math.max(1, s.H * 0.003), HB = s.H * (s.W >= s.H ? 0.125 : 0.075) * cl(s.amp, 0.7, 1.2);
  function hbAt(p) { var e = p < 0.22 ? E.outBack(p / 0.22, 2.2) : (p > 0.7 ? 1 - E.inCubic((p - 0.7) / 0.3) : 1); return { e: e, hb: HB * e < 0.5 ? 0 : HB * e }; }
  [0, 1].forEach(function (bot) {
    addOverlay(c, s.f0, s.f1, 'FX LetterSnap bar ' + (bot ? 'B' : 'T') + ' @' + s.f0,
      G.rect(-s.W / 2, bot ? 0 : -1, s.W, 1), { fill: col, alpha: 1 }, function (f) {
        var r = hbAt(prog(f, s));
        return r.hb > 0 ? { 'position.y': bot ? -s.H / 2 : s.H / 2, 'scale.y': r.hb, alpha: 1 } : { alpha: 0 };
      });
    addOverlay(c, s.f0, s.f1, 'FX LetterSnap line ' + (bot ? 'B' : 'T') + ' @' + s.f0,
      G.rect(-s.W / 2, -lw / 2, s.W, lw), { fill: pop(s.sc), alpha: 1 }, function (f) {
        var r = hbAt(prog(f, s));
        if (r.hb <= 0) return { alpha: 0 };
        var y = bot ? s.H - r.hb - lw / 2 : r.hb + lw / 2;
        return { 'position.y': s.H / 2 - y, alpha: cl(r.e) };
      });
  });
});

/* 23. xrLongShadow */
reg('xrLongShadow', function (c, s) {
  var sd = xS(s), col = xr(sd, 1) < 0.6 ? s.sc.accent : (s.sc.accent2 || s.sc.accent);
  var ang = (xr(sd, 2) < 0.5 ? 45 : 135) * DEG, L0 = Math.min(s.W, s.H) * 0.085 * cl(s.amp, 0.5, 1.3);
  var steps = 8, dxU = Math.cos(ang), dyU = Math.sin(ang);
  for (var k = steps; k >= 1; k--) {
    (function (idx) {
      var fr = idx / steps, cln = cloneActiveCuts(c, s, 'LongShadow ' + idx, { inkOnly: true, tintColor: col, belowCuts: true });
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
        var L = L0 * ahs(prog(f, s), 0.3, 0.6); L = L < 1 ? 0 : L;
        return { 'position.x': dxU * L * fr, 'position.y': -dyU * L * fr };
      });
      cln.paintables.forEach(function (pid) {
        var nd = c.graph.byId[pid], base = nd.attrs.alpha == null ? 1 : nd.attrs.alpha;
        nd.keys.alpha = nd.keys.alpha || {};
        for (var f = s.f0; f < s.f1; f++) {
          var L = L0 * ahs(prog(f, s), 0.3, 0.6);
          nd.keys.alpha[f] = { value: L >= 1 ? base * (0.95 - fr * 0.25) : 0, type: 1 };
        }
      });
    })(k);
  }
});

/* 24. xrLoupe */
reg('xrLoupe', function (c, s) {
  var sd = xS(s), M = Math.min(s.W, s.H), dir = xr(sd, 1) < 0.5, lw = Math.max(1.5, M * 0.007);
  var R0 = M * 0.21 * Math.sqrt(cl(s.amp, 0.5, 1.3)), YB = s.H * (0.5 + xrs(sd, 2) * 0.05);
  function lensAt(p) {
    var env = p < 0.22 ? E.outBack(p / 0.22, 1.4) : (p > 0.75 ? 1 - E.inCubic((p - 0.75) / 0.25) : 1);
    var r = R0 * env >= 1 ? R0 * env : 0, q = ios(p);
    var x = s.W * (dir ? 0.26 + 0.48 * q : 0.74 - 0.48 * q), y = YB - Math.sin(q * PI) * s.H * 0.03;
    return { r: r, x: x, y: y, sc: scPt(x, y, s.W, s.H) };
  }
  function lensPoly(st) {
    if (st.r <= 0) return [];
    var out = [];
    for (var i = 0; i < 28; i++) {
      var a = i / 28 * TAU;
      out.push([st.sc[0] + Math.cos(a) * st.r, st.sc[1] + Math.sin(a) * st.r]);
    }
    return [out];
  }
  addOverlay(c, s.f0, s.f1, 'FX Loupe bg @' + s.f0, G.ellipse(0, 0, 1, 1), { fill: s.sc.bg, alpha: 1 }, function (f) {
    var st = lensAt(prog(f, s));
    return st.r > 0 ? { 'position.x': st.sc[0], 'position.y': st.sc[1], 'scale.x': st.r, 'scale.y': st.r, alpha: 1 } : { alpha: 0 };
  });
  var cln = cloneActiveCuts(c, s, 'Loupe zoom');
  C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
    var st = lensAt(prog(f, s));
    return { 'position.x': st.sc[0] * (1 - 1.6), 'position.y': st.sc[1] * (1 - 1.6), 'scale.x': 1.6, 'scale.y': 1.6 };
  });
  var contours = Object.create(null);
  for (var f = s.f0; f < s.f1; f++) contours[f] = lensPoly(lensAt(prog(f, s)));
  cln.paintables.forEach(function (id) { H.multiClip(c.graph, id, contours, false, 'Loupe circle', c.options); });
  addOverlay(c, s.f0, s.f1, 'FX Loupe rim @' + s.f0, G.ellipse(0, 0, 1, 1), { stroke: s.sc.fg, width: lw, alpha: 1 }, function (f) {
    var st = lensAt(prog(f, s));
    return st.r > 0 ? { 'position.x': st.sc[0], 'position.y': st.sc[1], 'scale.x': st.r, 'scale.y': st.r, 'stroke.width': lw / st.r, alpha: 1 } : { alpha: 0 };
  });
  var glintPts = H.arcPts(0, 0, 1, -138, -86, 10);
  addOverlay(c, s.f0, s.f1, 'FX Loupe glint @' + s.f0, V.commands(glintPts, false), { stroke: pop(s.sc), width: lw * 0.6, alpha: 0.8 }, function (f) {
    var st = lensAt(prog(f, s)), rr = st.r > lw * 3 ? st.r - lw * 1.6 : 0;
    return rr > 0 ? { 'position.x': st.sc[0], 'position.y': st.sc[1], 'scale.x': rr, 'scale.y': rr, 'stroke.width': lw * 0.6 / rr, alpha: 0.8 } : { alpha: 0 };
  });
});

/* 25. xrMoire */
reg('xrMoire', function (c, s) {
  var sd = xS(s), M = Math.min(s.W, s.H), gp = Math.max(4, M / 22), n = Math.ceil(Math.hypot(s.W, s.H) / gp) + 1;
  var AL = 0.2 * cl(s.amp, 0.6, 1.1), A0 = xr(sd, 1) * TAU;
  var cmds = [];
  for (var i = 1; i <= n; i++) cmds = cmds.concat(G.ellipse(0, 0, i * gp, i * gp));
  [0, 1].forEach(function (k) {
    addOverlay(c, s.f0, s.f1, 'FX Moire set ' + (k + 1) + ' @' + s.f0, cmds, { stroke: s.sc.fg, width: gp * 0.32, alpha: 1 }, function (f) {
      var p = prog(f, s), al = AL * ahs(p, 0.25, 0.6), an = A0 + p * 0.9, sep = M * (0.03 + 0.1 * p), sg = k ? 1 : -1;
      return { 'position.x': sg * Math.cos(an) * sep, 'position.y': -sg * Math.sin(an) * sep, alpha: al < 0.01 ? 0 : cl(al) };
    });
  });
});

/* 26. xrNested */
reg('xrNested', function (c, s) {
  var sd = xS(s), cx = s.W * (0.5 + xrs(sd, 1) * 0.08), cy = s.H * (0.5 + xrs(sd, 2) * 0.06);
  var piv = scPt(cx, cy, s.W, s.H), lw = Math.max(1, Math.min(s.W, s.H) * 0.004), FK = 0.27 * cl(s.amp, 0.5, 1.3);
  function ffAt(p) { var e = punch(p, 0.3), ff = 1 - FK * e; return { e: e, ff: ff > 0.997 ? 1 : ff }; }
  for (var i = 1; i <= 4; i++) {
    (function (idx) {
      var cln = cloneActiveCuts(c, s, 'Nested ' + idx);
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
        var st = ffAt(prog(f, s)), z = Math.pow(st.ff, idx);
        return { 'position.x': piv[0] * (1 - z), 'position.y': piv[1] * (1 - z), 'scale.x': z, 'scale.y': z };
      });
      cln.paintables.forEach(function (pid) {
        var nd = c.graph.byId[pid], base = nd.attrs.alpha == null ? 1 : nd.attrs.alpha;
        nd.keys.alpha = nd.keys.alpha || {};
        for (var f = s.f0; f < s.f1; f++) nd.keys.alpha[f] = { value: ffAt(prog(f, s)).ff < 1 ? base : 0, type: 1 };
      });
      addOverlay(c, s.f0, s.f1, 'FX Nested frame ' + idx + ' @' + s.f0, G.rect(-s.W / 2, -s.H / 2, s.W, s.H),
        { stroke: pop(s.sc), width: lw, alpha: 1 }, function (f) {
          var st = ffAt(prog(f, s)), z = Math.pow(st.ff, idx);
          return st.ff < 1
            ? { 'position.x': piv[0] * (1 - z), 'position.y': piv[1] * (1 - z), 'scale.x': z, 'scale.y': z, 'stroke.width': lw / Math.max(0.1, z), alpha: 0.85 * cl(st.e * 1.5) }
            : { alpha: 0 };
        });
    })(i);
  }
});

/* 27. xrPixelSparks */
reg('xrPixelSparks', function (c, s) {
  var sd = xS(s), St = xSteps(s), q = Math.max(2, Math.round(Math.min(s.W, s.H) * 0.016));
  var cols = tints(s.sc).concat([s.sc.fg]);
  St.forEach(function (step, j) {
    var st = step.st * 17 + sd, kk = cl((step.f0 - s.f0) / Math.max(1, s.f1 - s.f0 - 1));
    var n = Math.round(54 * cl(s.amp, 0.5, 1.3) * Math.pow(Math.sin(PI * kk), 0.7));
    if (n < 1) return;
    var by = cols.map(function () { return []; });
    for (var i = 0; i < n; i++) {
      var z = q * (1 + (xh(st, i, 1) % 3)), x = Math.floor(xr(st, i, 2) * s.W / q) * q, y = Math.floor(xr(st, i, 3) * s.H / q) * q;
      var w = xr(st, i, 5) < 0.3 ? z * (2 + (xh(st, i, 6) % 4)) : z, h = xr(st, i, 5) < 0.3 ? q : z;
      by[xh(st, i, 4) % cols.length] = by[xh(st, i, 4) % cols.length].concat(G.rect(x - s.W / 2, s.H / 2 - (y + h), w, h));
    }
    cols.forEach(function (col, cIdx) {
      if (by[cIdx].length) addOverlay(c, step.f0, step.f1, 'FX PixelSparks ' + j + '_' + cIdx, by[cIdx], { fill: col, alpha: 1 });
    });
  });
});

/* 28. xrQuadCycle */
reg('xrQuadCycle', function (c, s) {
  var sd = xS(s), cwD = xr(sd, 1) < 0.5 ? 1 : 3, hw = s.W / 2, hh = s.H / 2, SL = [[0, 0], [1, 0], [1, 1], [0, 1]];
  var SK = 0.08 * cl(s.amp, 0.5, 1.3);
  addFullBg(c, s, 'xrQuadCycle');
  for (var q = 0; q < 4; q++) {
    (function (idx) {
      var x0 = SL[idx][0] * hw, y0 = SL[idx][1] * hh, piv = scPt(x0 + hw / 2, y0 + hh / 2, s.W, s.H);
      var cln = cloneActiveCuts(c, s, 'QuadCycle ' + (idx + 1));
      var polys = Object.create(null), poly = rectPoly(x0, y0, x0 + hw, y0 + hh, s.W, s.H);
      for (var f = s.f0; f < s.f1; f++) polys[f] = poly;
      cln.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
        var p = prog(f, s), ff = p * 4, j = Math.min(3, Math.floor(ff)), fr = E.inOutCubic(ff - j), sh = 1 - SK * H.bell(p);
        var a = SL[(idx + j * cwD) % 4], b = SL[(idx + (j + 1) * cwD) % 4];
        var dstSc = scPt((a[0] + (b[0] - a[0]) * fr + 0.5) * hw, (a[1] + (b[1] - a[1]) * fr + 0.5) * hh, s.W, s.H);
        return { 'position.x': dstSc[0] - piv[0] * sh, 'position.y': dstSc[1] - piv[1] * sh, 'scale.x': sh, 'scale.y': sh };
      });
    })(q);
  }
});

/* 29. xrRibbonTwist */
reg('xrRibbonTwist', function (c, s) {
  var sd = xS(s), Np = 16, down = xr(sd, 1) < 0.5;
  function ccAt(p, o) { var u = cl((p - 0.5 * o) / 0.5); return (u <= 0 || u >= 1) ? 1 : Math.cos(TAU * E.inOutCubic(u)); }
  addFullBg(c, s, 'xrRibbonTwist');
  for (var i = 0; i < Np; i++) {
    (function (idx) {
      var y0 = Math.floor(idx * s.H / Np), y1 = Math.floor((idx + 1) * s.H / Np), o = down ? idx / Np : 1 - idx / Np;
      var cln = cloneActiveCuts(c, s, 'RibbonTwist ' + (idx + 1));
      var polys = Object.create(null), poly = rectPoly(0, y0, s.W, y1, s.W, s.H);
      for (var f = s.f0; f < s.f1; f++) polys[f] = poly;
      cln.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
        var cv = ccAt(prog(f, s), o);
        return { 'scale.x': Math.abs(cv) < 0.01 ? (cv < 0 ? -0.01 : 0.01) : cv };
      });
      var yc = s.H / 2 - (y0 + y1) / 2, rh = Math.max(1, y1 - y0);
      addOverlay(c, s.f0, s.f1, 'FX RibbonTwist shade ' + (idx + 1), G.rect(-s.W / 2, yc - rh / 2, s.W, rh),
        { fill: '#000000', alpha: 1 }, function (f) {
          var ac = Math.abs(ccAt(prog(f, s), o));
          return { 'scale.x': Math.max(0.01, ac), alpha: cl(0.22 * (1 - ac)) };
        });
    })(i);
  }
});

/* 30. xrScanBurst */
reg('xrScanBurst', function (c, s) {
  var sd = xS(s), AM = Math.min(1, s.amp), P0 = Math.max(4, s.H / 150), DR = xr(sd, 1) < 0.5 ? 1 : -1;
  var nBars = Math.min(24, Math.ceil(s.H / (s.H / 28)) + 2), hl = Math.max(1, s.H * 0.0015);
  for (var i = 0; i < nBars; i++) {
    (function (idx) {
      addOverlay(c, s.f0, s.f1, 'FX ScanBurst bar ' + (idx + 1) + ' @' + s.f0, G.rect(-s.W / 2, 0, s.W, 1),
        { fill: s.sc.bg, alpha: 1 }, function (f) {
          var p = prog(f, s), a = Math.pow(Math.max(0, 1 - p), 0.9) * AM;
          var PP = P0 + (s.H / 8 - P0) * iq(p), th = PP * 0.5 * (0.35 + 0.65 * a), o = ((p * s.H * 0.35 * DR) % PP + PP) % PP;
          var y = o - PP + idx * PP;
          if (a < 0.01 || y > s.H || y + th < 0) return { alpha: 0 };
          return { 'position.y': s.H / 2 - (y + th), 'scale.y': Math.max(0.5, th), alpha: cl(a * 1.6) };
        });
      addOverlay(c, s.f0, s.f1, 'FX ScanBurst light ' + (idx + 1) + ' @' + s.f0, G.rect(-s.W / 2, -hl / 2, s.W, hl),
        { fill: pop(s.sc), alpha: 1 }, function (f) {
          var p = prog(f, s), a = Math.pow(Math.max(0, 1 - p), 0.9) * AM;
          var PP = P0 + (s.H / 8 - P0) * iq(p), th = PP * 0.5 * (0.35 + 0.65 * a), o = ((p * s.H * 0.35 * DR) % PP + PP) % PP;
          var y = o - PP + th + hl / 2 + idx * PP;
          if (a < 0.01 || PP <= s.H / 40 || y > s.H || y < 0) return { alpha: 0 };
          return { 'position.y': s.H / 2 - y, alpha: cl(0.5 * a) };
        });
    })(i);
  }
});

/* 31. xrShearSnap */
reg('xrShearSnap', function (c, s) {
  var sd = xS(s), sg = xr(sd, 1) < 0.5 ? 1 : -1, hor = xr(sd, 2) < 0.75;
  var K = sg * 0.24 * cl(s.amp, 0.5, 1.3) * (hor ? 1 : 0.55);
  function decomp(k) {
    if (Math.abs(k) < 1e-6) return [0, 1, 1, 0];
    var v = 0.5 * Math.atan2(2 * k, -k * k), a = Math.cos(v) + k * Math.sin(v), b = Math.sin(v), sc = Math.hypot(a, b);
    return [Math.atan2(b, a) / DEG, sc, 1 / sc, -v / DEG];
  }
  var rIn = H.rigTarget(c, 'xrShearSnap in', s), rStr = H.rigTarget(c, 'xrShearSnap stretch', s), rOut = H.rigTarget(c, 'xrShearSnap out', s);
  C.sample(c.graph, rIn, s.f0, s.f1, function (f) {
    var sk = K * spring(prog(f, s), 0.2); sk = Math.abs(sk) < 0.0015 ? 0 : sk;
    var d = decomp(hor ? -sk : sk);
    return { rotation: (hor ? 0 : -90) + d[3] };
  });
  C.sample(c.graph, rStr, s.f0, s.f1, function (f) {
    var sk = K * spring(prog(f, s), 0.2); sk = Math.abs(sk) < 0.0015 ? 0 : sk;
    var d = decomp(hor ? -sk : sk);
    return { 'scale.x': d[1], 'scale.y': d[2] };
  });
  C.sample(c.graph, rOut, s.f0, s.f1, function (f) {
    var sk = K * spring(prog(f, s), 0.2); sk = Math.abs(sk) < 0.0015 ? 0 : sk;
    var d = decomp(hor ? -sk : sk);
    return { rotation: (hor ? 0 : 90) + d[0] };
  });
  var marginContours = Object.create(null);
  for (var f = s.f0; f < s.f1; f++) {
    var sk = K * spring(prog(f, s), 0.2); sk = Math.abs(sk) < 0.0015 ? 0 : sk;
    if (sk === 0) { marginContours[f] = [rectPoly(0, 0, s.W, s.H, s.W, s.H)]; continue; }
    var hw = s.W / 2, hh = s.H / 2;
    marginContours[f] = hor
      ? [[[-hw + sk * hh, hh], [hw + sk * hh, hh], [hw - sk * hh, -hh], [-hw - sk * hh, -hh]]]
      : [[[-hw, hh - sk * hw], [hw, hh + sk * hw], [hw, -hh + sk * hw], [-hw, -hh - sk * hw]]];
  }
  var mId = addOverlay(c, s.f0, s.f1, 'FX ShearSnap margins @' + s.f0,
    G.rect(-s.W / 2 - 4, -s.H / 2 - 4, s.W + 8, s.H + 8), { fill: s.sc.bg, alpha: 1 });
  H.multiClip(c.graph, mId, marginContours, true, 'Shear margins', c.options);
});

/* 32. xrSlotReel */
reg('xrSlotReel', function (c, s) {
  var sd = xS(s), n = (s.W >= s.H ? 3 : 2) + (xh(sd, 1) % 2), lag = 0.14, par = xh(sd, 2) % 2;
  var DN = Math.max(0.1, 1 - (n - 1) * lag);
  addFullBg(c, s, 'xrSlotReel');
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var x0 = Math.round(idx * s.W / n), x1 = Math.round((idx + 1) * s.W / n), dir = (idx + par) % 2 ? -1 : 1;
      [0, 1].forEach(function (wrapCopy) {
        var cln = cloneActiveCuts(c, s, 'SlotReel ' + idx + '_' + wrapCopy);
        C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
          var u = cl((prog(f, s) - idx * lag) / DN), shift = E.inOutCubic(u) * s.H * dir;
          return { 'position.y': -(shift - wrapCopy * dir * s.H) };
        });
        var polys = Object.create(null), poly = rectPoly(x0, 0, x1, s.H, s.W, s.H);
        for (var f = s.f0; f < s.f1; f++) polys[f] = poly;
        cln.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      });
    })(i);
  }
  var lw = Math.max(1, Math.round(Math.min(s.W, s.H) * 0.003));
  for (var k = 1; k < n; k++) {
    var x = Math.round(k * s.W / n) - s.W / 2;
    addOverlay(c, s.f0, s.f1, 'FX SlotReel div ' + k + ' @' + s.f0, G.rect(x - lw / 2, -s.H / 2, lw, s.H), { fill: s.sc.fg, alpha: 0.5 }, function (f) {
      return { alpha: 0.5 * H.bell(prog(f, s)) };
    });
  }
});

/* 33. xrSpotlight */
reg('xrSpotlight', function (c, s) {
  var sd = xS(s), r = Math.min(s.W, s.H) * 0.3, dir = xr(sd, 1) < 0.5, AM = cl(s.amp, 0.6, 1.1);
  var Y = s.H * (0.5 + xrs(sd, 2) * 0.06), maxAl = H.dark(s.sc.bg) ? 0.8 : 0.6, col = shade(s.sc);
  function circlePoly(cx, cy, rad) {
    var out = [];
    for (var i = 0; i < 28; i++) { var a = i / 28 * TAU; out.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); }
    return [out];
  }
  [[0.75, 0.35], [1.0, 0.35], [1.28, 0.3]].forEach(function (tier, ti) {
    var contours = Object.create(null);
    for (var f = s.f0; f < s.f1; f++) {
      var q = ios(prog(f, s)), x = s.W * (dir ? 0.2 + 0.6 * q : 0.8 - 0.6 * q), pSc = scPt(x, Y, s.W, s.H);
      contours[f] = circlePoly(pSc[0], pSc[1], r * tier[0]);
    }
    var id = addOverlay(c, s.f0, s.f1, 'FX Spotlight tier ' + ti + ' @' + s.f0,
      G.rect(-s.W / 2 - 4, -s.H / 2 - 4, s.W + 8, s.H + 8), { fill: col, alpha: 1 }, function (f) {
        var a = ahr(prog(f, s), 0.2, 0.72) * AM;
        return { alpha: a < 0.01 ? 0 : cl(maxAl * tier[1] * a) };
      });
    H.multiClip(c.graph, id, contours, true, 'Spotlight hole ' + ti, c.options);
  });
});

/* 34. xrStretchWave */
reg('xrStretchWave', function (c, s) {
  var sd = xS(s), dir = xr(sd, 1) < 0.5, sig = s.W * 0.1, a = 0.85 * cl(s.amp, 0.5, 1.3);
  for (var j = -10; j <= 10; j++) {
    var d = j * 0.2, sy = 1 + a * Math.exp(-d * d);
    if (sy < 1.004) continue;
    (function (dd, scaleY) {
      var x0 = (dd - 0.1) * sig, x1 = (dd + 0.1) * sig;
      var cln = cloneActiveCuts(c, s, 'StretchWave ' + dd.toFixed(1));
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function () { return { 'scale.y': scaleY }; });
      var contours = Object.create(null);
      for (var f = s.f0; f < s.f1; f++) {
        var p = prog(f, s), bx = s.W * (dir ? -0.3 + 1.6 * p : 1.3 - 1.6 * p);
        contours[f] = [rectPoly(bx + x0, 0, bx + x1, s.H, s.W, s.H)];
      }
      cln.paintables.forEach(function (id) { H.multiClip(c.graph, id, contours, false, 'Stretch slice', c.options); });
    })(d, sy);
  }
});

/* 35. xrStripeMosaic */
reg('xrStripeMosaic', function (c, s) {
  var sd = xS(s), rows = xr(sd, 1) < 0.3, LL = rows ? s.H : s.W, nBars = 12;
  var col1 = pop(s.sc), col2 = s.sc.fg;
  for (var i = 0; i < nBars; i++) {
    (function (idx) {
      var a0 = idx * LL / nBars, bw = LL / nBars;
      addOverlay(c, s.f0, s.f1, 'FX StripeMosaic bar ' + idx + ' @' + s.f0,
        rows ? G.rect(-s.W / 2, s.H / 2 - (a0 + bw), s.W, bw) : G.rect(a0 - s.W / 2, -s.H / 2, bw, s.H),
        { fill: idx % 2 ? col1 : col2, alpha: 0.32 }, function (f) {
          var e = punch(prog(f, s), 0.3), jit = 0.4 + 0.6 * xr(sd + f, idx, 2);
          return { alpha: e < 0.02 ? 0 : cl(0.26 * e * jit * cl(s.amp, 0.5, 1.3)) };
        });
    })(i);
  }
}, ['Mosaic pixel shader is represented as discrete translucent stripe bands pulsing across frames.']);

/* 36. xrSwingEcho */
reg('xrSwingEcho', function (c, s) {
  var sd = xS(s), dk = H.dark(s.sc.bg), up = xr(sd, 1) < 0.3, piv = scPt(s.W / 2, up ? -s.H * 0.9 : s.H * 1.9, s.W, s.H);
  var TH = 3.4 * cl(s.amp, 0.5, 1.3);
  for (var i = 3; i >= 1; i--) for (var j = 0; j < 2; j++) {
    (function (idx, side) {
      var cln = cloneActiveCuts(c, s, 'SwingEcho ' + idx + '_' + side, { belowCuts: dk });
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
        var e = punch(prog(f, s), 0.3), th = TH * e < 0.034 ? 0 : TH * e;
        return rotAboutScene(piv[0], piv[1], th * (side ? 1 : -1) * idx);
      });
      cln.paintables.forEach(function (pid) {
        var nd = c.graph.byId[pid], base = nd.attrs.alpha == null ? 1 : nd.attrs.alpha;
        nd.keys.alpha = nd.keys.alpha || {};
        for (var f = s.f0; f < s.f1; f++) {
          var e = punch(prog(f, s), 0.3), th = TH * e;
          nd.keys.alpha[f] = { value: th >= 0.034 ? base * cl(e * 2) * (0.62 - idx * 0.14) : 0, type: 1 };
        }
      });
    })(i, j);
  }
});

/* 37. xrSyncBend */
reg('xrSyncBend', function (c, s) {
  var sd = xS(s), St = xSteps(s), top = xr(sd, 1) < 0.7, dir = xr(sd, 2) < 0.5 ? 1 : -1, zone = s.H * 0.78, Np = 22;
  var A0 = dir * s.W * 0.34 * cl(s.amp, 0.5, 1.3);
  function jtAt(i, f, v) {
    var st = St[0].st;
    for (var j = 0; j < St.length; j++) if (f >= St[j].f0 && f < St[j].f1) { st = St[j].st; break; }
    return xrs(st * 7 + sd, i * 2, 3) * s.W * 0.006 * v;
  }
  addOverlay(c, s.f0, s.f1, 'FX SyncBend zone bg @' + s.f0,
    top ? G.rect(-s.W / 2, s.H / 2 - zone, s.W, zone) : G.rect(-s.W / 2, -s.H / 2, s.W, zone), { fill: s.sc.bg, alpha: 1 });
  for (var i = 0; i < Np; i++) {
    (function (idx) {
      var a0 = Math.floor(idx * zone / Np), a1 = Math.floor((idx + 1) * zone / Np), y = top ? a0 : s.H - a1, h = a1 - a0;
      if (h < 1) return;
      var v = 1 - (idx + 0.5) / Np;
      [0, -1].forEach(function (wrap) {
        var cln = cloneActiveCuts(c, s, 'SyncBend ' + idx + '_' + wrap);
        var polys = Object.create(null), poly = rectPoly(0, y, s.W, y + h, s.W, s.H);
        for (var f = s.f0; f < s.f1; f++) polys[f] = poly;
        cln.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
        C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
          var b = H.bell(prog(f, s)), A = Math.abs(A0 * b) < 1 ? 0 : A0 * b;
          var dx = A ? A * Math.pow(v, 1.7) + jtAt(idx, f, v) * b : 0;
          var raw = ((dx % s.W) + s.W) % s.W;
          return { 'position.x': wrap ? raw - s.W : raw };
        });
      });
    })(i);
  }
});

/* 38. xrTapeCrease */
reg('xrTapeCrease', function (c, s) {
  var sd = xS(s), HB = Math.min(s.W, s.H) * 0.05 * cl(s.amp, 0.5, 1.3), dir = xr(sd, 1) < 0.5 ? 1 : -1;
  var dk = H.dark(s.sc.bg), lw = Math.max(1, s.H * 0.0025), Y0 = s.H * (0.28 + 0.44 * xr(sd, 2)), DY = s.H * 0.06 * xrs(sd, 3);
  function bandAt(p) {
    var amt = Math.sin(PI * cl((p - 0.1) / 0.85)), y0 = Y0 + DY * p, hb = HB * amt < 1 ? 0 : HB * amt;
    return { amt: amt, y0: y0, hb: hb };
  }
  addOverlay(c, s.f0, s.f1, 'FX TapeCrease bg @' + s.f0, G.rect(-s.W / 2, -1, s.W, 2), { fill: s.sc.bg, alpha: 1 }, function (f) {
    var st = bandAt(prog(f, s));
    return st.hb > 0 ? { 'position.y': s.H / 2 - st.y0, 'scale.y': st.hb, alpha: 1 } : { alpha: 0 };
  });
  var cln = cloneActiveCuts(c, s, 'TapeCrease squeeze');
  C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
    var st = bandAt(prog(f, s)), sy = 1 / 1.8, pivY = s.H / 2 - st.y0;
    return { 'position.x': dir * s.W * 0.024 * cl(s.amp, 0.5, 1.3) * st.amt, 'position.y': pivY * (1 - sy), 'scale.y': sy };
  });
  var contours = Object.create(null);
  for (var f = s.f0; f < s.f1; f++) {
    var st = bandAt(prog(f, s));
    contours[f] = st.hb > 0 ? [rectPoly(0, st.y0 - st.hb, s.W, st.y0 + st.hb, s.W, s.H)] : [];
  }
  cln.paintables.forEach(function (id) { H.multiClip(c.graph, id, contours, false, 'Crease band', c.options); });
  addOverlay(c, s.f0, s.f1, 'FX TapeCrease line @' + s.f0, G.rect(-s.W / 2, -lw / 2, s.W, lw),
    { fill: dk ? '#FFFFFF' : shade(s.sc), alpha: 1 }, function (f) {
      var st = bandAt(prog(f, s));
      return st.hb > 0 ? { 'position.y': s.H / 2 - st.y0, alpha: cl((dk ? 0.6 : 0.45) * st.amt) } : { alpha: 0 };
    });
  addOverlay(c, s.f0, s.f1, 'FX TapeCrease shadow @' + s.f0, G.rect(-s.W / 2, -0.5, s.W, 1),
    { fill: '#000000', alpha: 1 }, function (f) {
      var st = bandAt(prog(f, s));
      return st.hb > 0 ? { 'position.y': s.H / 2 - (st.y0 + lw / 2 + st.hb * 0.25), 'scale.y': st.hb * 0.5, alpha: cl(0.3 * st.amt) } : { alpha: 0 };
    });
});

/* 39. xrThumbRow */
reg('xrThumbRow', function (c, s) {
  var sd = xS(s), n = s.W >= s.H ? 5 : 4, a = cl(cl(s.amp, 0.5, 1.3), 0.8, 1.15);
  var tw = s.W * 0.86 / n * 0.86 * a, th = tw * s.H / s.W, gap = (s.W - n * tw) / (n + 1);
  var top = xr(sd, 1) < 0.35, yb = top ? s.H * 0.045 : s.H * 0.955 - th, rev = xr(sd, 2) < 0.5;
  var lw = Math.max(1, Math.min(s.W, s.H) * 0.004);
  function zzAt(p, o) { var z = E.outBack(cl((p - o) / 0.22), 1.6) * (1 - E.inCubic(cl((p - 0.66 - o * 0.5) / 0.2))); return z < 0.02 ? 0 : z; }
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var o = (rev ? n - 1 - idx : idx) * 0.06, xc = gap + idx * (tw + gap) + tw / 2, yc = yb + th / 2, pSc = scPt(xc, yc, s.W, s.H);
      addOverlay(c, s.f0, s.f1, 'FX ThumbRow bg ' + (idx + 1), G.rect(-tw / 2, -th / 2, tw, th), { fill: s.sc.bg, alpha: 1 }, function (f) {
        var z = zzAt(prog(f, s), o);
        return z > 0 ? { 'position.x': pSc[0], 'position.y': pSc[1], 'scale.x': z, 'scale.y': z, alpha: 1 } : { alpha: 0 };
      });
      var cln = cloneActiveCuts(c, s, 'Thumb ' + (idx + 1));
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
        var z = zzAt(prog(f, s), o), scf = Math.max(0.01, (tw / s.W) * z);
        return { 'position.x': pSc[0], 'position.y': pSc[1], 'scale.x': scf, 'scale.y': scf };
      });
      cln.paintables.forEach(function (pid) {
        var nd = c.graph.byId[pid], base = nd.attrs.alpha == null ? 1 : nd.attrs.alpha;
        nd.keys.alpha = nd.keys.alpha || {};
        for (var f = s.f0; f < s.f1; f++) nd.keys.alpha[f] = { value: zzAt(prog(f, s), o) > 0 ? base : 0, type: 1 };
      });
      addOverlay(c, s.f0, s.f1, 'FX ThumbRow frame ' + (idx + 1), G.rect(-tw / 2, -th / 2, tw, th),
        { stroke: (idx % 2) ? s.sc.fg : pop(s.sc), width: lw, alpha: 1 }, function (f) {
          var z = zzAt(prog(f, s), o);
          return z > 0 ? { 'position.x': pSc[0], 'position.y': pSc[1], 'scale.x': z, 'scale.y': z, 'stroke.width': lw / Math.max(0.1, z), alpha: 1 } : { alpha: 0 };
        });
    })(i);
  }
});

/* 40. xrTileLights */
reg('xrTileLights', function (c, s) {
  var sd = xS(s), M = Math.min(s.W, s.H), gx = Math.max(3, Math.round(s.W / (M / 4.5))), gy = Math.max(3, Math.round(s.H / (M / 4.5)));
  var cols = tints(s.sc), rev = xr(sd, 1) < 0.5, gp = Math.max(1, Math.round(M * 0.004)), A = cl(s.amp, 0.6, 1.2);
  var maxD = Math.max(1, gx + gy - 2);
  for (var d = 0; d <= gx + gy - 2; d++) {
    var by = cols.map(function () { return []; });
    for (var j = 0; j < gy; j++) for (var i = 0; i < gx; i++) {
      if ((rev ? gx - 1 - i : i) + j !== d || xr(sd, i, j, 2) > 0.62) continue;
      var x0 = Math.round(i * s.W / gx) + gp, x1 = Math.round((i + 1) * s.W / gx) - gp;
      var y0 = Math.round(j * s.H / gy) + gp, y1 = Math.round((j + 1) * s.H / gy) - gp;
      if (x1 <= x0 || y1 <= y0) continue;
      var pSc = scPt(x0, y1, s.W, s.H);
      var colIdx = xh(sd, i, j, 3) % cols.length;
      by[colIdx] = by[colIdx].concat(G.rect(pSc[0], pSc[1], x1 - x0, y1 - y0));
    }
    (function (off) {
      by.forEach(function (cmds, ci) {
        if (!cmds.length) return;
        addOverlay(c, s.f0, s.f1, 'FX TileLights d' + off + '_' + ci, cmds, { fill: cols[ci], alpha: 0.6 }, function (f) {
          var u = cl((prog(f, s) - off * 0.62) / 0.38);
          return { alpha: (u <= 0 || u >= 1) ? 0 : cl((u < 0.2 ? 1 : 1 - oq((u - 0.2) / 0.8)) * 0.62 * A) };
        });
      });
    })(d / maxD);
  }
});

/* 41. xrWaist */
reg('xrWaist', function (c, s) {
  var sd = xS(s), A0 = (xr(sd, 1) < 0.35 ? -0.2 : 0.3) * cl(s.amp, 0.5, 1.3), yc = 0.5 + xrs(sd, 2) * 0.06, Np = 20;
  function aAt(p) { var A = A0 * punch(p, 0.28); return Math.abs(A) < 0.003 ? 0 : A; }
  addFullBg(c, s, 'xrWaist');
  for (var i = 0; i < Np; i++) {
    (function (idx) {
      var v0 = -0.85 + 1.7 * idx / Np, v1 = -0.85 + 1.7 * (idx + 1) / Np, vm = (v0 + v1) / 2;
      var ya = cl(Math.round((yc + v0 / 2) * s.H), 0, s.H), yb = cl(Math.round((yc + v1 / 2) * s.H), 0, s.H);
      if (yb - ya < 1) return;
      var gf = Math.exp(-(vm * vm) / 0.16);
      var cln = cloneActiveCuts(c, s, 'Waist ' + (idx + 1));
      var polys = Object.create(null), poly = rectPoly(0, ya, s.W, yb, s.W, s.H);
      for (var f = s.f0; f < s.f1; f++) polys[f] = poly;
      cln.paintables.forEach(function (id) { S.clip(c.graph, id, polys); });
      C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
        return { 'scale.x': Math.max(0.05, 1 - aAt(prog(f, s)) * gf) };
      });
    })(i);
  }
});

/* 42. xrWaterMirror */
reg('xrWaterMirror', function (c, s) {
  var DP = s.H * 0.34 * cl(cl(s.amp, 0.3, 1.6), 0.8, 1.1), lh = Math.max(1, s.H * 0.003);
  function waterAt(p) { var lift = ahr(p, 0.3, 0.68), dep = DP * lift < 2 ? 0 : DP * lift; return { lift: lift, dep: dep, y0: Math.round(s.H - dep) }; }
  addOverlay(c, s.f0, s.f1, 'FX WaterMirror bg @' + s.f0, G.rect(-s.W / 2, -1, s.W, 1), { fill: s.sc.bg, alpha: 1 }, function (f) {
    var st = waterAt(prog(f, s));
    return st.dep > 0 ? { 'position.y': -s.H / 2 + st.dep, 'scale.y': st.dep, alpha: 1 } : { alpha: 0 };
  });
  var cln = cloneActiveCuts(c, s, 'WaterMirror refl');
  C.sample(c.graph, cln.rigId, s.f0, s.f1, function (f) {
    var st = waterAt(prog(f, s)), pScY = s.H / 2 - st.y0, sy = -1 / 1.55;
    return { 'position.x': Math.sin(prog(f, s) * 16) * s.W * 0.008, 'position.y': pScY * (1 - sy), 'scale.y': sy };
  });
  var contours = Object.create(null);
  for (var f = s.f0; f < s.f1; f++) {
    var st = waterAt(prog(f, s));
    contours[f] = st.dep > 0 ? [rectPoly(0, st.y0, s.W, s.H, s.W, s.H)] : [];
  }
  cln.paintables.forEach(function (id) { H.multiClip(c.graph, id, contours, false, 'Water region', c.options); });
  [0.35, 0.28, 0.3].forEach(function (vo, k) {
    var kFrac = 1 - k / 3;
    addOverlay(c, s.f0, s.f1, 'FX WaterMirror veil ' + (k + 1) + ' @' + s.f0, G.rect(-s.W / 2, 0, s.W, 1), { fill: s.sc.bg, alpha: vo }, function (f) {
      var st = waterAt(prog(f, s)), h = st.dep * kFrac;
      return st.dep > 0 ? { 'position.y': -s.H / 2, 'scale.y': Math.max(0.5, h), alpha: vo } : { alpha: 0 };
    });
  });
  addOverlay(c, s.f0, s.f1, 'FX WaterMirror line @' + s.f0, G.rect(-s.W / 2, -lh / 2, s.W, lh), { fill: pop(s.sc), alpha: 0.7 }, function (f) {
    var st = waterAt(prog(f, s));
    return st.dep > 0 ? { 'position.y': s.H / 2 - (st.y0 - 1 + lh / 2), alpha: 0.7 * cl(st.lift) } : { alpha: 0 };
  });
});

/* 43. xrZebra */
reg('xrZebra', function (c, s) {
  var sd = xS(s), D = Math.hypot(s.W, s.H) / 2 + 2, P = Math.max(6, Math.min(s.W, s.H) / 26);
  var DU = 0.5 * cl(s.amp, 0.7, 1.1), deg = xr(sd, 1) < 0.5 ? 45 : -45;
  var nStripes = Math.ceil(2 * D / P) + 3;
  var rigId = c.graph.add('null', 'FX Zebra rot @' + s.f0, c.parent, s.f0, s.f1, { rotation: -deg });
  for (var i = 0; i < nStripes; i++) {
    (function (idx) {
      var id = C.shape(c.graph, { id: 'fx', start: s.f0, end: s.f1 }, 'FX Zebra stripe ' + (idx + 1) + ' @' + s.f0,
        rigId, G.rect(-0.5, -D, 1, 2 * D), { fill: s.sc.bg, alpha: 0.85 });
      C.sample(c.graph, id, s.f0, s.f1, function (f) {
        var p = prog(f, s), duty = DU * ahr(p, 0.22, 0.7);
        if (duty < 0.02) return { alpha: 0 };
        var o = (p * 3 * P) % P, x = -D - P + o + idx * P + P * duty / 2;
        return { 'position.x': x, 'scale.x': Math.max(0.5, P * duty), alpha: 0.85 };
      });
    })(i);
  }
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
