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
  var W = c.comp.width, H = c.comp.height;
  var u = Math.min(W, H) / 1080;
  var vertical = P.vertical == null ? b.h > b.w * 1.3 : !!P.vertical;
  var alongMax = vertical ? H : W;
  var crossMax = vertical ? W : H;
  var lo = vertical ? b.y0 : b.x0;
  var hi = vertical ? b.y1 : b.x1;
  var cross0 = vertical ? b.x0 : b.y0;
  var cross1 = vertical ? b.x1 : b.y1;

  /* Explicit native layout margin; not an undocumented host attribute. */
  var margin = P.margin == null ? Math.min(W, H) * 0.025 : P.margin;
  N.finite(margin, 'ladder margin');

  var a0 = Math.max(margin, lo - 10 * u);
  var a1 = Math.min(alongMax - margin, hi + 10 * u);
  if (!(a1 > a0)) throw new Error('xlLadder has no usable span');

  var gap = 16 * u + (cross1 - cross0) * 0.08;
  var band = 26 * u;
  var lower = !!P.low;
  var roomLow = crossMax - margin - cross1 - gap;
  var roomHigh = cross0 - gap - margin;
  if ((lower ? roomLow : roomHigh) < band &&
      (lower ? roomHigh : roomLow) >= band) lower = !lower;

  var room = lower ? roomLow : roomHigh;
  if (!(room > 0)) throw new Error('xlLadder has no side-band room');

  var half = Math.min(12 * u, Math.min(band, room) / 2);
  var cross = lower ? cross1 + gap + half : cross0 - gap - half;
  var step = Math.max(26 * u, (a1 - a0) / 110);
  var n = Math.max(1, Math.floor((a1 - a0) / step));
  var pitch = (a1 - a0) / n;
  var direction = P.right ? -1 : 1;
  var start = direction > 0 ? a0 : a1;
  var motion = (c.assembly.style.fx || {}).motion;
  motion = motion == null ? 0.7 : N.finite(motion, 'ladder motion');

  function axis(a, z) { return vertical ? [z, a] : [a, z]; }
  function local(p) { return [p[0] - W / 2, p[1] - H / 2]; }
  function phase(frame) {
    var t = (frame - c.cut.origin) / c.comp.fps;
    var out = R.clamp((frame - c.cut.sourceEnd + c.cut.outFrames) / c.cut.outFrames);
    var o = 1 - R.E.inCubic(out);
    return { t: t, e: R.E.outCubic(t / 0.6), o: o,
      lit: Math.floor(Math.max(0, t) * (5 + 8 * motion)) % (n + 1) };
  }

  [-1, 1].forEach(function (side) {
    var origin = local(axis(start, cross + side * half));
    var delta = local(axis(start + direction * (a1 - a0), cross + side * half));
    var rail = V.line(c, 'Ladder rail ' + side,
      [[0, 0], [delta[0] - origin[0], delta[1] - origin[1]]],
      c.sc.fg, Math.max(0.5, 2 * u), 0.9);
    V.animate(c, rail, function (env, frame) {
      var q = phase(frame), from = 1 - q.o;
      var extent = Math.max(0, q.e - from);
      return {
        'position.x': origin[0] + (delta[0] - origin[0]) * from,
        'position.y': -origin[1] - (delta[1] - origin[1]) * from,
        'scale.x': extent, 'scale.y': extent, alpha: 0.9 * q.o
      };
    });
  });

  for (var i = 0; i <= n; i++) {
    (function (index) {
      var at = start + direction * pitch * index;
      var pts = [axis(at, cross - half), axis(at, cross + half)].map(local);
      var id = V.line(c, 'Ladder rung ' + index, pts, c.sc.fg, Math.max(0.5, 1.6 * u), 0.8);
      V.animate(c, id, function (env, frame) {
        var q = phase(frame);
        var first = Math.ceil((1 - q.o) * n - 1e-6);
        var last = Math.floor(q.e * n + 1e-6);
        return { alpha: index >= first && index <= last ? q.o * 0.8 : 0 };
      });
    })(i);
  }

  for (var tail = 2; tail >= 0; tail--) {
    (function (delay) {
      var pts = [axis(0, -half - 3 * u), axis(0, half + 3 * u)];
      var id = V.line(c, 'Ladder lit rung ' + delay, pts, c.sc.accent, Math.max(0.5, 4 * u), 1);
      V.animate(c, id, function (env, frame) {
        var q = phase(frame), index = q.lit - delay;
        var p = local(axis(start + direction * pitch * index, cross));
        return {
          'position.x': p[0], 'position.y': -p[1],
          alpha: index >= 0 && index / n <= q.e ? q.o * (1 - delay * 0.35) : 0
        };
      });
    })(tail);
  }
  return { rungs: n + 1, litRungs: 3 };
}, [
  'Source: jizura_core.jsx axl_reg(xlLadder).',
  'Rung cadence, reveal interval and three lit rungs follow the source.',
  'AE side-band helper is expressed as explicit native geometry.',
  'Native margin is params.margin or 2.5% of the shorter composition edge.',
  'Actual host/render conformance remains pending.'
]);

register('tyGlyphBody', function (c) {
  var P = c.preset.params || {}, b = V.rest(c);
  var W = c.comp.width, H = c.comp.height;
  var k = Math.min(W, H) / 1080;
  var bw = b.x1 - b.x0, bh = b.y1 - b.y0;

  /* The source intentionally does not draw this design around vertical copy. */
  if (bh > bw * 1.3) {
    return { intentionalSkip: true, reason: 'Source suppresses vertical glyph-body rules' };
  }

  var main = c.cut.nodes.slice().sort(function (a, z) { return z.size - a.size; })[0];
  if (!main) throw new Error('tyGlyphBody requires source text');

  var sourceText = (c.cut.source || {}).text || main.text;
  var count = Array.from(String(sourceText).replace(/\s/g, '')).length;
  var n = Math.max(1, Math.min(16, count));
  var gap = 10 * k + bh * 0.06;
  var width = Math.max(1, 0.9 * k);
  var margin = P.margin == null ? Math.min(W, H) * 0.03 : P.margin;
  N.finite(margin, 'glyph-body margin');
  var created = 0;

  function rule(name, p0, p1, delay, duration) {
    var start = [p0[0] - W / 2, p0[1] - H / 2];
    var dx = p1[0] - p0[0], dy = p1[1] - p0[1];
    var id = V.line(c, name, [[0, 0], [dx, dy]], c.sc.sub, width, 0.45);
    V.animate(c, id, function (env, frame) {
      var q = R.E.outExpo((env.t - delay) / duration);
      var out = R.clamp((frame - c.cut.sourceEnd + c.cut.outFrames) / c.cut.outFrames);
      return {
        'position.x': start[0], 'position.y': -start[1],
        'scale.x': q, 'scale.y': q, alpha: 0.45 * (1 - R.E.inCubic(out))
      };
    });
    created++;
  }

  for (var i = 0; i <= n; i++) {
    var x = R.mix(b.x0, b.x1, i / n);
    if (b.y0 - gap > margin) {
      rule('Glyph body upper division ' + i, [x, b.y0 - gap], [x, margin], i * 0.015, 0.7);
    }
    if (b.y1 + gap < H - margin) {
      rule('Glyph body lower division ' + i, [x, b.y1 + gap], [x, H - margin], i * 0.015, 0.7);
    }
  }

  [b.y0, b.y1].forEach(function (y, index) {
    if (b.x0 - gap > margin) rule('Glyph body left ' + index, [b.x0 - gap, y], [margin, y], 0.1, 0.8);
    if (b.x1 + gap < W - margin) rule('Glyph body right ' + index, [b.x1 + gap, y], [W - margin, y], 0.1, 0.8);
  });

  if (!created) throw new Error('tyGlyphBody has no drawable outside divisions');

  var size = Math.max(8, Math.min(24, Math.min(W, H) * 0.019)) * 0.75;
  if (P.labels !== false && b.y0 - gap > margin + size * 2) {
    label(c, 'Glyph body dimensions',
      String(count).padStart(2, '0') + ' / W' + Math.round(bw / k),
      b.x0 + 4 * k, b.y0 - gap - size * 0.8,
      size, 'mono', c.sc.accent, 0.1);
  }
  return { rules: created, divisions: n };
}, [
  'Source: jizura_core.jsx decor:tyGlyphBody.',
  'Draws outside text divisions, not per-glyph boxes.',
  'Vertical suppression follows the source.',
  'Native margin is params.margin or 3% of the shorter composition edge.',
  'Actual host/render conformance remains pending.'
]);

JZPresets.romaji = romaji;
})(JZNative, JZComponents, JZGraph, JZRecipeTools, JZRecipeComponents);
