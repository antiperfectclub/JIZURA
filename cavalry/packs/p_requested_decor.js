/*
 * Native editable decoration geometry.
 * xlLadder and tyGlyphBody are explicit native reconstructions,
 * not aliases to ruler/boxed. Visual conformance remains pending.
 */
(function (N, C, G, R, V) {
'use strict';

function register(key, build, differences) {
  N.register('decor', key, {
    source: 'Cavalry native ' + key,
    scope: 'cut',
    build: build,
    differences: differences || []
  });
}

function alpha(c, frame, delay) {
  var t = (frame - c.cut.origin) / c.comp.fps;
  var pout = R.clamp((frame - c.cut.sourceEnd + c.cut.outFrames) / c.cut.outFrames);
  return R.E.outCubic((t - (delay || 0)) / 0.4) * (1 - R.E.inCubic(pout));
}

function line(c, label, points, color, width, delay) {
  var local = points.map(function (p) { return [p[0] - c.comp.width / 2, p[1] - c.comp.height / 2]; });
  var id = V.line(c, label, local, color, Math.max(0.5, width), 1);
  V.animate(c, id, function (env, frame) { return { alpha: alpha(c, frame, delay) }; });
  return id;
}

function resolvedFont(c, node, role) {
  var f = (c.options.decorFonts || {})[role] || V.font(c, node);
  if (!f || !f.family || !f.style) throw new Error('Missing decoration font ' + role);
  return f;
}

function label(c, key, text, x, y, size, role, color, delay) {
  if (!text) throw new Error('Empty decoration label ' + key);
  var source = c.cut.nodes[0];
  if (!source) throw new Error('Decoration requires a resolved font');
  var node = {
    id: c.cut.id + '/' + key, text: String(text), font: resolvedFont(c, source, role),
    x: x, y: y, size: size, sx: 1, rotation: 0, delayFrames: 0,
    track: 0.08, lead: 1.3, align: 'center', color: color
  };
  return C.text(c.graph, c.cut, node, c.parent, c.options, function (state, glyph, glyphs, frame) {
    state.a *= alpha(c, frame, delay);
  });
}

/* Supported alphabet and null-on-unknown behaviour match src/01_util.js J.romaji. */
var base = Object.create(null);
var kana = (
  'あいうえお かきくけこ さしすせそ たちつてと ' +
  'なにぬねの はひふへほ まみむめも やゆよ ' +
  'らりるれろ わをん がぎぐげご ざじずぜぞ ' +
  'だぢづでど ばびぶべぼ ぱぴぷぺぽ ぁぃぅぇぉ ゔ'
).replace(/ /g, '');
var latin = (
  'a i u e o ka ki ku ke ko sa shi su se so ' +
  'ta chi tsu te to na ni nu ne no ha hi fu he ho ' +
  'ma mi mu me mo ya yu yo ra ri ru re ro wa wo n ' +
  'ga gi gu ge go za ji zu ze zo da ji zu de do ' +
  'ba bi bu be bo pa pi pu pe po a i u e o vu'
).split(' ');
Array.from(kana).forEach(function (character, index) { base[character] = latin[index]; });

function romaji(text) {
  var chars = Array.from(String(text)).map(function (c) {
    return /[゠-ヿㇰ-ㇿｦ-ﾟ]/.test(c) && c !== 'ー' ? String.fromCharCode(c.charCodeAt(0) - 96) : c;
  });
  var yo = { 'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo' };
  var out = '';
  for (var i = 0; i < chars.length; i++) {
    var c = chars[i], next = chars[i + 1], b = base[c];
    if (c === 'っ') {
      var nx = base[next] || '';
      out += nx ? nx[0] : '';
      continue;
    }
    if (c === 'ー') { out += out.slice(-1); continue; }
    if (next && yo[next] && b) {
      out += (b.length > 1 && b.slice(-1) === 'i' ? b.slice(0, -1) : b) +
        (b === 'shi' || b === 'chi' || b === 'ji' ? yo[next].slice(1) : yo[next]);
      i++;
      continue;
    }
    if (b) out += b;
    else if (/[A-Za-z0-9 ]/.test(c)) out += c;
    else return null;
  }
  return out;
}

register('romajiLine', function (c) {
  var P = c.preset.params || {}, source = c.cut.source || {};
  var main = c.cut.nodes.slice().sort(function (a, b) { return b.size - a.size; })[0];
  if (!main) throw new Error('romajiLine requires text');
  var reading = P.text || P.romaji || source.romaji || main.romaji || romaji(main.text.replace(/\s+/g, ''));
  if (!reading) {
    throw new Error('romajiLine: non-kana source requires source.romaji or params.text. No invented reading was emitted.');
  }
  var b = V.rest(c);
  var size = R.clamp(Math.min(c.comp.width, c.comp.height) * 0.019, 11, 24);
  var y = P.up ? b.y0 - size * 1.8 : b.y1 + size * 1.8;
  y = R.clamp(y, size, c.comp.height - size);
  var text = P.upper === false ? String(reading) : String(reading).toUpperCase();
  label(c, 'Romaji annotation', text, b.cx, y, size, 'mono', c.sc.sub, 0.18);
  var rule = line(c, 'Romaji leader', [[b.x0, y - size * 0.9], [b.x1, y - size * 0.9]],
    c.sc.sub, Math.max(1, size * 0.06), 0.1);
  return { rule: rule, text: text };
}, ['Kana conversion follows src/01_util.js.',
  'Kanji requires an explicit reading; unsupported text is not silently replaced.',
  'Annotation placement is a native reconstruction; visual conformance is pending.']);

register('xlLadder', function (c) {
  var P = c.preset.params || {}, b = V.rest(c);
  var U = Math.min(c.comp.width, c.comp.height) / 1080;
  var vertical = P.vertical == null ? b.h > b.w * 1.25 : !!P.vertical;
  var steps = R.clamp(Math.round(P.steps || 12), 2, 80);
  var gap = 28 * U, lo = vertical ? b.y0 : b.x0, hi = vertical ? b.y1 : b.x1;
  var span = Math.max(1, hi - lo), width = Math.max(12 * U, span * 0.07);
  var cross = vertical ? (P.right ? b.x1 + gap : b.x0 - gap) : (P.low ? b.y1 + gap : b.y0 - gap);
  function axes(along, across) { return vertical ? [across, along] : [along, across]; }
  var color = P.accent ? c.sc.accent : c.sc.fg;
  [-1, 1].forEach(function (side) {
    line(c, 'Ladder rail ' + side, [axes(lo, cross + side * width / 2), axes(hi, cross + side * width / 2)],
      color, Math.max(1, 1.6 * U), 0);
  });
  for (var i = 0; i <= steps; i++) {
    var at = lo + span * i / steps;
    line(c, 'Ladder rung ' + i, [axes(at, cross - width / 2), axes(at, cross + width / 2)],
      color, Math.max(1, 1.3 * U), 0.04 * i);
  }
  var radius = Math.max(1, 4 * U);
  var cursor = C.shape(c.graph, c.cut, c.cut.id + ' / Ladder cursor', c.parent,
    G.ellipse(0, 0, radius, radius), { fill: c.sc.accent });
  V.animate(c, cursor, function (env, frame) {
    var q = (1 - Math.cos(env.t * 1.5)) * 0.5;
    var p = axes(lo + span * q, cross);
    return { 'position.x': p[0] - c.comp.width / 2, 'position.y': c.comp.height / 2 - p[1],
      alpha: alpha(c, frame, 0.2) };
  });
}, ['Two rails, staggered rungs and a moving cursor are native geometry, not the ruler preset.',
  'Native reconstruction; original xlLadder formula and parameter conformance are pending.']);

register('tyGlyphBody', function (c) {
  var P = c.preset.params || {}, count = 0;
  var U = Math.min(c.comp.width, c.comp.height) / 1080;
  c.cut.nodes.forEach(function (node) {
    var glyphs = V.glyphs(c, node), parent = V.local(c, node, 'Glyph bodies');
    glyphs.forEach(function (g) {
      if (/^[\s\u3000]$/.test(g.ch)) return;
      var x = g.x + (g.vx || 0), y = g.y + (g.vy || 0), w = g.w, h = g.h;
      var box = V.rect(c, 'Glyph body ' + count, x - w / 2, y - h / 2, w, h,
        { stroke: c.sc.sub, width: Math.max(0.6, U) }, parent);
      V.animate(c, box, function (env, frame) { return { alpha: 0.45 * alpha(c, frame, 0.12 + g.i * 0.025) }; });
      var baseline = V.line(c, 'Glyph baseline ' + count,
        [[x - w / 2, y + h * 0.36], [x + w / 2, y + h * 0.36]],
        c.sc.accent, Math.max(0.6, U), 1, parent);
      V.animate(c, baseline, function (env, frame) { return { alpha: 0.65 * alpha(c, frame, 0.15 + g.i * 0.025) }; });
      if (P.labels !== false) {
        var font = resolvedFont(c, node, 'mono');
        var id = c.graph.add('textShape', node.id + ' / Body index ' + g.i, parent, c.cut.start, c.cut.end, {
          text: String(g.i + 1).padStart(2, '0'),
          font: { font: font.family, style: font.style },
          fontSize: Math.max(8, node.size * 0.12),
          autoWidth: true, autoHeight: true, horizontalAlignment: 1, verticalAlignment: 1,
          position: [x, -y - h * 0.64], fill: true, stroke: false,
          'material.materialColor': c.sc.sub
        });
        V.animate(c, id, function (env, frame) { return { alpha: alpha(c, frame, 0.2 + g.i * 0.025) }; });
      }
      count++;
    });
  });
  if (!count) throw new Error('tyGlyphBody produced no glyph bodies');
  return count;
}, ['Editable glyph-em boxes, baselines and indices.',
  'Uses advance/em bounds, not font ink outlines.',
  'Native reconstruction; original tyGlyphBody formula and parameter conformance are pending.']);

JZPresets.romaji = romaji;
})(JZNative, JZComponents, JZGraph, JZRecipeTools, JZRecipeComponents);
