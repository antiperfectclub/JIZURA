/* Native global & event FX pack. Reference: ae/p_fx1.jsx, ae/p_fx2.jsx, ae/p_x2_fx.jsx (read-only). */
(function (N, G, C, R) {
'use strict';
var cl = N.clamp;

function lum(hex) {
  var h = String(hex || '#000000').replace(/^#/, '');
  if (h.length === 3) h = h.replace(/./g, function (c) { return c + c; });
  var n = parseInt(h.slice(0, 6), 16);
  return ((n >> 16 & 255) * 0.2126 + (n >> 8 & 255) * 0.7152 + (n & 255) * 0.0722) / 255;
}

function span(c) {
  var P = c.preset && c.preset.params || {};
  var fps = c.comp.fps, fc = c.comp.frameCount;
  var t = N.finite(P.t == null ? 0 : P.t, 'fx.t');
  var dur = Math.max(1 / fps, N.finite(P.dur == null ? 0.2 : P.dur, 'fx.dur'));
  var f0 = Math.max(0, Math.min(fc - 1, Math.round(t * fps)));
  var f1 = Math.max(f0 + 1, Math.min(fc, Math.round((t + dur) * fps)));
  var amp = Math.max(0.05, N.finite(P.amp == null ? 1 : P.amp, 'fx.amp'));
  var sc = (c.assembly.style && c.assembly.style.schemes && c.assembly.style.schemes[0]) || { bg: '#101010', fg: '#ffffff', accent: '#ff5577', accent2: '#55ccff', sub: '#999999' };
  var fx = (c.assembly.style && c.assembly.style.fx) || {};
  var glitchScale = fx.glitch == null ? 0.5 : N.finite(fx.glitch, 'fx.glitch');
  var seed = Math.round(t * 1000) ^ (P.seed || 17);
  return { f0: f0, f1: f1, dur: dur, amp: amp, sc: sc, glitch: glitchScale, seed: seed, W: c.comp.width, H: c.comp.height, u: Math.min(c.comp.width, c.comp.height) / 1080 };
}

function reg(key, fn, diffs) {
  N.register('fx', key, {
    source: 'ae/p_fx1.jsx, ae/p_fx2.jsx, ae/p_x2_fx.jsx / fx:' + key,
    scope: 'event',
    differences: diffs || [],
    build: function (c) { return fn(c, span(c)); }
  });
}

function fullRect(c, s, name, color, alphaFn) {
  var cut = { start: s.f0, end: s.f1 };
  var id = C.shape(c.graph, cut, name, c.parent, G.rect(-s.W / 2, -s.H / 2, s.W, s.H), { fill: color, alpha: 1 });
  C.sample(c.graph, id, s.f0, s.f1, function (f) {
    var p = (f - s.f0) / Math.max(1, s.f1 - s.f0);
    return { alpha: cl(alphaFn(p, f - s.f0)) };
  });
  return id;
}

function rigTarget(c, key, s) { return typeof c.addFxRig === "function" ? c.addFxRig(key + " @" + s.f0) : (c.fxRig || c.parent); }

/* ---- Built-in global events ---- */
reg('shake', function (c, s) {
  var target = rigTarget(c, "fx", s);
  var fEnd = Math.min(c.comp.frameCount, s.f0 + Math.max(s.f1 - s.f0, 14));
  for (var f = s.f0; f < fEnd; f++) {
    var dt = (f - s.f0) * (24 / c.comp.fps);
    var k = s.amp * Math.pow(0.62, dt);
    var step = Math.floor(f * 12 / c.comp.fps);
    var dx = (N.random(s.seed, step, 1) * 2 - 1) * k * 16 * s.u;
    var dy = (N.random(s.seed, step, 2) * 2 - 1) * k * 11 * s.u;
    c.graph.key(target, 'position.x', f, dx, 1);
    c.graph.key(target, 'position.y', f, -dy, 1);
  }
  if (fEnd < c.comp.frameCount) {
    c.graph.key(target, 'position.x', fEnd, 0, 1);
    c.graph.key(target, 'position.y', fEnd, 0, 1);
  }
});

reg('chroma', function () {
  /* Chromatic spike is also applied to per-cut Ghost A/B offsets in 30_assembly.js. */
  return { handledByGhostRig: true };
}, ['Drives chromatic ghost separation when style.ghost > 0.']);

reg('flash', function (c, s) {
  var col = lum(s.sc.bg) < 0.5 ? s.sc.fg : '#ffffff';
  return fullRect(c, s, 'FX Flash @' + s.f0, col, function (p) { return Math.pow(1 - p, 1.5) * 0.92 * Math.min(1, s.amp); });
});

reg('whiteFrame', function (c, s) {
  return fullRect(c, s, 'FX White Frame @' + s.f0, '#ffffff', function () { return Math.min(1, s.amp); });
});

reg('blackFrame', function (c, s) {
  return fullRect(c, s, 'FX Black Frame @' + s.f0, '#000000', function () { return Math.min(1, s.amp); });
});

reg('invert', function (c, s) {
  return fullRect(c, s, 'FX Invert @' + s.f0, s.sc.fg, function () { return 0.85 * Math.min(1, s.amp); });
}, ['Native invert flash uses an editable high-contrast foreground overlay rather than a pixel invert shader.']);

reg('strobe', function (c, s) {
  var col = lum(s.sc.bg) < 0.5 ? s.sc.fg : '#000000';
  return fullRect(c, s, 'FX Strobe @' + s.f0, col, function (p, df) { return (df % 2 === 0) ? 0.75 * Math.min(1, s.amp) : 0; });
});

['zoom', 'zoomPunch'].forEach(function (key) {
  reg(key, function (c, s) {
    var target = rigTarget(c, "fx", s);
    var peak = 1 + (key === 'zoomPunch' ? 0.16 : 0.1) * s.amp;
    for (var f = s.f0; f < s.f1; f++) {
      var p = (f - s.f0) / Math.max(1, s.f1 - s.f0);
      var sc = 1 + (peak - 1) * (1 - R.E.outCubic(p));
      c.graph.key(target, 'scale.x', f, sc, 1);
      c.graph.key(target, 'scale.y', f, sc, 1);
    }
    if (s.f1 < c.comp.frameCount) {
      c.graph.key(target, 'scale.x', s.f1, 1, 1);
      c.graph.key(target, 'scale.y', s.f1, 1, 1);
    }
  });
});

reg('slice', function (c, s) {
  var cut = { start: s.f0, end: s.f1 };
  var count = 5;
  var ids = [];
  for (var i = 0; i < count; i++) {
    var h = Math.max(8, s.H * (0.02 + 0.08 * N.random(s.seed, i, 3)));
    var y = (N.random(s.seed, i, 4) - 0.5) * (s.H - h);
    var col = i % 2 ? (s.sc.accent2 || s.sc.fg) : s.sc.accent;
    var id = C.shape(c.graph, cut, 'FX Slice ' + i + ' @' + s.f0, c.parent, G.rect(-s.W / 2, y - h / 2, s.W, h), { fill: col, alpha: 0.45 });
    C.sample(c.graph, id, s.f0, s.f1, function (f) {
      var dx = (N.random(s.seed, f, i, 5) * 2 - 1) * s.W * 0.06 * s.amp * (0.4 + 0.6 * s.glitch);
      return { 'position.x': dx, alpha: 0.45 * cl(s.amp) };
    });
    ids.push(id);
  }
  return ids;
});

['block', 'mosaic', 'macroBlock', 'pixelDrift', 'pixelSort', 'tileShift'].forEach(function (key) {
  reg(key, function (c, s) {
    var cut = { start: s.f0, end: s.f1 }, rects = [];
    var n = key === 'macroBlock' ? 6 : 12;
    for (var i = 0; i < n; i++) {
      var w = s.W * (0.06 + 0.16 * N.random(s.seed, i, 11));
      var h = s.H * (0.04 + 0.12 * N.random(s.seed, i, 12));
      var x = (N.random(s.seed, i, 13) - 0.5) * (s.W - w);
      var y = (N.random(s.seed, i, 14) - 0.5) * (s.H - h);
      rects = rects.concat(G.rect(x, y, w, h));
    }
    var id = C.shape(c.graph, cut, 'FX ' + key + ' @' + s.f0, c.parent, rects, { fill: s.sc.accent, alpha: 0.35 });
    C.sample(c.graph, id, s.f0, s.f1, function (f) {
      var dx = (N.random(s.seed, f, 15) * 2 - 1) * s.W * 0.04 * s.amp;
      return { 'position.x': dx, alpha: 0.35 * cl(s.amp) };
    });
    return id;
  });
});

['panelWipe', 'doors', 'blindsTrans', 'splitSlide', 'irisTrans'].forEach(function (key) {
  reg(key, function (c, s) {
    var cut = { start: s.f0, end: s.f1 };
    var id = C.shape(c.graph, cut, 'FX ' + key + ' @' + s.f0, c.parent, G.rect(-s.W / 2, -s.H / 2, s.W, s.H), { fill: s.sc.accent, alpha: 0.7 });
    C.sample(c.graph, id, s.f0, s.f1, function (f) {
      var p = (f - s.f0) / Math.max(1, s.f1 - s.f0);
      var k = Math.sin(p * Math.PI);
      return { 'scale.x': key === 'blindsTrans' ? 1 : Math.max(0.01, k), 'scale.y': key === 'blindsTrans' ? Math.max(0.01, k) : 1, alpha: 0.65 * k };
    });
    return id;
  });
});

['vhsRoll', 'trackingNoise', 'interlace', 'waveWarp', 'crtOff'].forEach(function (key) {
  reg(key, function (c, s) {
    var cut = { start: s.f0, end: s.f1 }, bars = [];
    var n = key === 'crtOff' ? 2 : 16;
    for (var i = 0; i < n; i++) {
      var y = -s.H / 2 + (s.H * (i + 0.5) / n);
      var h = Math.max(2, s.H / (n * 3));
      bars = bars.concat(G.rect(-s.W / 2, y - h / 2, s.W, h));
    }
    var id = C.shape(c.graph, cut, 'FX ' + key + ' @' + s.f0, c.parent, bars, { fill: s.sc.fg, alpha: 0.25 });
    C.sample(c.graph, id, s.f0, s.f1, function (f) {
      var p = (f - s.f0) / Math.max(1, s.f1 - s.f0);
      return { 'position.y': key === 'vhsRoll' ? (p - 0.5) * s.H * 0.4 : 0, 'scale.y': key === 'crtOff' ? Math.max(0.02, 1 - p) : 1, alpha: 0.25 * cl(s.amp) };
    });
    return id;
  });
});

['rgbSplit', 'radialChroma', 'smear', 'mirrorFlash', 'posterize', 'hueShift', 'filmBurn', 'whipBlur', 'gridRepeat', 'lightSweep', 'bloomFlash', 'bulge', 'halftone', 'duotone', 'xrDiscTurn', 'xrShutterStep', 'xrScanWipe'].forEach(function (key) {
  reg(key, function (c, s) {
    var cut = { start: s.f0, end: s.f1 };
    var col = key === 'filmBurn' || key === 'lightSweep' || key === 'bloomFlash' ? (s.sc.accent2 || s.sc.accent) : s.sc.accent;
    var id = C.shape(c.graph, cut, 'FX ' + key + ' @' + s.f0, c.parent, G.rect(-s.W / 2, -s.H / 2, s.W, s.H), { fill: col, alpha: 0.28 });
    C.sample(c.graph, id, s.f0, s.f1, function (f) {
      var p = (f - s.f0) / Math.max(1, s.f1 - s.f0);
      var env = Math.sin(p * Math.PI);
      return { 'position.x': key === 'lightSweep' ? (p - 0.5) * s.W * 0.6 : 0, 'scale.x': key === 'lightSweep' ? 0.25 : 1, alpha: 0.3 * env * cl(s.amp) };
    });
    return id;
  });
});

reg('xrDropBounce', function (c, s) {
  var target = rigTarget(c, "fx", s);
  for (var f = s.f0; f < s.f1; f++) {
    var p = (f - s.f0) / Math.max(1, s.f1 - s.f0);
    var lift = p < 0.16 ? R.E.outCubic(p / 0.16) : 1 - R.E.outQuart((p - 0.16) / 0.84);
    var dy = -Math.round(s.H * 0.2 * s.amp * lift);
    c.graph.key(target, 'position.y', f, -dy, 1);
  }
  if (s.f1 < c.comp.frameCount) c.graph.key(target, 'position.y', s.f1, 0, 1);
});
})(JZNative, JZGraph, JZComponents, JZRecipeTools);
