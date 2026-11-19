/* JIZURA Cavalry Pack: special core layouts (`title` and `interlude`).
 * Completes the remaining 2 core layouts from src/06_layouts.js & ae/30_layouts.jsx.
 */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, DEG = H.DEG, TAU = H.TAU;

function reg(key, fn, diffs) {
  N.register('layout', key, {
    source: 'src/06_layouts.js (' + key + ')',
    scope: 'cut',
    build: fn,
    differences: diffs || ['Native Cavalry text nodes and editable vector geometry matching ' + key + '.']
  });
}

function uMin(c) { return Math.min(c.comp.width, c.comp.height); }
function isPort(c) { return c.comp.height > c.comp.width * 1.08; }
function bodyFont(c) { return H.layFontObj(c, 'body'); }
function monoFont(c) { return H.layFontObj(c, 'mono'); }
function serifFont(c) { return H.layFontObj(c, 'serif'); }

function envAlpha(c, delay, dur, mul) {
  var m = mul == null ? 1 : mul;
  return function (env, f) {
    return { a: cl(H.layTin(c, f, delay || 0, dur || 0.4, E.outCubic) * H.layTout(c, f) * m, 0, 1) };
  };
}

/* 1. title: opening / section title card with expanding accent rules, subtitle/artist, and corner index */
reg('title', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var raw = String(P.title || H.layText(c) || (c.assembly && c.assembly.title) || '').trim();
  var text = raw ? H.laySplitLines(raw, isPort(c) ? 8 : 14) : 'TITLE';
  var align = P.align === 'left' ? 'left' : 'center';
  var cx = align === 'left' ? W * 0.14 : W / 2;
  var cy = Hh * (P.oy != null ? 0.5 + P.oy : 0.48);
  var maxW = W * (align === 'left' ? 0.72 : 0.8);
  var size = Math.min(H.layFitSize(c, text, maxW, Hh * 0.34, { track: 0.08, lead: 1.15 }), u * 0.22);
  var m = H.layMeasure(c, text, size, { track: 0.08, lead: 1.15 });
  var ruleW = Math.min(W * 0.78, Math.max(m.w * 1.08, u * 0.36));
  var ruleH = Math.max(2, u * 0.0032);
  var ruleX = align === 'left' ? cx + ruleW / 2 : W / 2;

  /* Top and bottom expanding hairline rules framing the title block */
  var topY = cy - m.h / 2 - size * 0.38;
  var botY = cy + m.h / 2 + size * 0.38;
  H.layRectAt(c, 'Title rule top', ruleX, topY, ruleW, ruleH, { fill: sc.accent, alpha: 0.9 }, function (env, f) {
    var q = E.outExpo(cl((env.t - 0.06) / 0.45)) * H.layTout(c, f);
    return { sx: Math.max(0.005, q), sy: 1, a: q > 0.01 ? 0.9 : 0 };
  });
  H.layRectAt(c, 'Title rule bottom', ruleX, botY, ruleW * 0.62, Math.max(1.5, ruleH * 0.7), { fill: sc.sub, alpha: 0.65 }, function (env, f) {
    var q = E.outExpo(cl((env.t - 0.12) / 0.45)) * H.layTout(c, f);
    return { sx: Math.max(0.005, q), sy: 1, a: q > 0.01 ? 0.65 : 0 };
  });

  /* Subtle corner frame ticks */
  var mg = u * 0.06, tk = u * 0.032, lw = Math.max(1.2, u * 0.0018);
  var corners = [
    [[mg, mg + tk], [mg, mg], [mg + tk, mg]],
    [[W - mg - tk, mg], [W - mg, mg], [W - mg, mg + tk]],
    [[mg, Hh - mg - tk], [mg, Hh - mg], [mg + tk, Hh - mg]],
    [[W - mg - tk, Hh - mg], [W - mg, Hh - mg], [W - mg, Hh - mg - tk]]
  ];
  corners.forEach(function (pts, idx) {
    var id = H.line(c, 'Title corner ' + idx, pts, sc.sub, lw, 0.55);
    if (id) C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) {
      return { alpha: 0.55 * H.layTin(c, f, 0.05, 0.35, E.outCubic) * H.layTout(c, f) };
    });
  });

  /* Optional artist / subtitle line */
  var sub = String(P.artist || P.sub || (c.assembly && c.assembly.artist) || (c.cut.source && c.cut.source.note) || '').trim();
  if (sub && sub !== raw) {
    var subSize = cl(u * 0.028, 13, 30);
    H.addText(c, 'Title subtitle', sub, cx, botY + subSize * 1.35, subSize, {
      font: bodyFont(c), align: align, color: sc.sub, alpha: 0.88
    }, envAlpha(c, 0.18, 0.4, 0.88));
  }

  /* Track index / timecode header */
  var tagFs = cl(u * 0.018, 11, 20);
  H.addText(c, 'Title tag', 'No.' + H.layLineNo(c) + '  /  ' + H.layFmtTime((c.cut.origin || 0) / c.comp.fps),
    cx, topY - tagFs * 1.25, tagFs, {
      font: monoFont(c), align: align, color: sc.accent, alpha: 0.82
    }, envAlpha(c, 0.1, 0.35, 0.82));

  H.laySetNodes(c, [{
    text: text,
    font: P.serif ? serifFont(c) : H.layFontObj(c, 'display'),
    size: Math.max(16, size),
    x: cx,
    y: cy,
    align: align,
    track: 0.08,
    lead: 1.15,
    color: P.accent ? sc.accent : sc.fg
  }]);
}, ['Native Cavalry title card layout with expanding accent rules, corner ticks, and subtitle.']);

/* 2. interlude: instrumental break with breathing concentric rings, equalizer ticks, and progress bar */
reg('interlude', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = uMin(c);
  var cx = W / 2, cy = Hh / 2, seed = H.laySeed(c);
  var dur = Math.max(0.4, ((c.cut.sourceEnd || c.cut.end) - (c.cut.origin || c.cut.start)) / c.comp.fps);

  /* Concentric breathing guide rings */
  for (var r = 0; r < 3; r++) {
    (function (idx) {
      var rad = u * (0.14 + idx * 0.085);
      var col = idx === 1 ? sc.accent : sc.sub;
      var baseA = idx === 1 ? 0.55 : 0.28;
      H.layCircleAt(c, 'Interlude ring ' + idx, cx, cy, rad, rad, {
        stroke: col, width: Math.max(1.2, u * (idx === 1 ? 0.0024 : 0.0014)), alpha: baseA
      }, function (env, f) {
        var tin = H.layTin(c, f, idx * 0.08, 0.45, E.outCubic);
        var tout = H.layTout(c, f);
        var pulse = 1 + Math.sin(env.t * 1.8 - idx * 0.9) * 0.045;
        return { s: Math.max(0.01, tin * pulse), a: baseA * tin * tout };
      });
    })(r);
  }

  /* Subtle rhythmic equalizer ticks across the center horizon */
  var bars = Math.min(21, Math.max(7, Math.round(P.bars || 13)));
  var spanW = Math.min(W * 0.52, u * 0.62);
  var barW = Math.max(2, u * 0.0036);
  var maxBarH = u * 0.08;
  for (var i = 0; i < bars; i++) {
    (function (idx) {
      var frac = bars > 1 ? idx / (bars - 1) : 0.5;
      var envShape = Math.sin(frac * Math.PI);
      var bx = cx + (frac - 0.5) * spanW;
      var ph = R.hash01(seed, idx, 11) * TAU;
      var freq = 2.4 + R.hash01(seed, idx, 12) * 2.2;
      H.layRectAt(c, 'Interlude bar ' + idx, bx, cy, barW, maxBarH, {
        fill: idx % 4 === 0 ? sc.accent : sc.sub, alpha: 0.65
      }, function (env, f) {
        var io = H.layTin(c, f, idx * 0.02, 0.35, E.outCubic) * H.layTout(c, f);
        var h = (0.18 + 0.82 * envShape * (0.45 + 0.55 * Math.abs(Math.sin(env.t * freq + ph)))) * io;
        return { sx: 1, sy: Math.max(0.02, h), a: 0.65 * io };
      });
    })(i);
  }

  /* Progress rail + filling bar across the cut duration */
  var railW = Math.min(W * 0.48, u * 0.56), railY = cy + u * 0.16, railH = Math.max(2, u * 0.003);
  H.layRectAt(c, 'Interlude rail', cx, railY, railW, railH, { fill: sc.sub, alpha: 0.28 }, envAlpha(c, 0.05, 0.3, 0.28));
  H.layRectAt(c, 'Interlude progress', cx, railY, railW, railH, { fill: sc.accent, alpha: 0.9 }, function (env, f) {
    var p = cl(env.t / dur);
    var io = H.layTin(c, f, 0.05, 0.25, E.outCubic) * H.layTout(c, f);
    return { x: cx - railW / 2 + railW * p / 2, sx: Math.max(0.005, p), sy: 1, a: 0.9 * io };
  });

  /* Subtle instrumental caption & timecode */
  var capFs = cl(u * 0.02, 11, 22);
  var rawText = String((c.cut.source && c.cut.source.text) || '').trim();
  var label = String(P.label || (rawText || 'INTERLUDE'));
  if (rawText) {
    var sz = Math.min(H.layFitSize(c, rawText, W * 0.5, Hh * 0.12, { track: 0.14 }), u * 0.06);
    H.laySetNodes(c, [{
      text: rawText,
      font: monoFont(c),
      size: Math.max(12, sz),
      x: cx,
      y: cy - u * 0.15,
      track: 0.14,
      color: sc.fg
    }]);
  } else {
    if (P.showLabel !== false) {
      H.addText(c, 'Interlude label', label, cx, cy - u * 0.15, capFs, {
        font: monoFont(c), align: 'center', color: sc.sub, alpha: 0.72
      }, envAlpha(c, 0.1, 0.4, 0.72));
    }
    H.laySetNodes(c, []);
  }

  H.addText(c, 'Interlude time', H.layFmtTime((c.cut.origin || 0) / c.comp.fps), cx, railY + capFs * 1.4, capFs * 0.85, {
    font: monoFont(c), align: 'center', color: sc.sub, alpha: 0.65
  }, envAlpha(c, 0.12, 0.35, 0.65));
}, ['Native Cavalry interlude layout with breathing rings, rhythmic bars, and cut progress rail.']);

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
