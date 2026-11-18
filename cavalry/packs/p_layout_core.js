/* Core JIZURA layouts (15 recipes ported from src/06_layouts.js & ae/30_layouts.jsx).
 * Produces Cavalry text nodes (inheriting cut enter/hold/exit/treat) and animated vector geometry.
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
function envAlpha(c, startDelay, dur) {
  return function (env, f) {
    var tin = H.layTin(c, f, startDelay || 0, dur || 0.35, E.outCubic);
    var tout = H.layTout(c, f);
    return { a: cl(tin * tout, 0, 1) };
  };
}

/* 1. mixed: variable scale/font/angle per glyph across balanced rows */
reg('mixed', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var seed = H.laySeed(c), src = H.layFlat(H.layText(c));
  var chars = Array.from(src), perRow = chars.length > 9 ? Math.ceil(chars.length / (chars.length > 26 ? 3 : 2)) : chars.length;
  var lines = H.laySplitLines(src, perRow).split('\n').filter(Boolean);
  var mode = P.mode || ['line', 'stair', 'wave'][R.hash(seed, 1, 1) % 3];
  var rotAmp = P.rotAmp == null ? 6 : P.rotAmp, smallK = P.smallK == null ? 0.56 : P.smallK;
  var accentIdx = P.accentIdx == null ? R.hash(seed, 2, 2) % Math.max(1, chars.length) : P.accentIdx;
  var specs = [], nTotal = 0;
  lines.forEach(function (ln) { nTotal += Array.from(ln).length; });
  var base = Math.min(Hh * (lines.length > 2 ? 0.22 : lines.length > 1 ? 0.28 : 0.38), W * 0.84 / Math.max(1, perRow * 0.86));
  var gi = 0;
  lines.forEach(function (ln, r) {
    var row = Array.from(ln);
    var ks = row.map(function (ch, j) {
      if (ch === ' ') return 0.35;
      var k = H.layIsKanji(ch) ? 1 : H.layIsPunct(ch) ? 0.45 : (smallK + R.hash01(seed, gi + j, 3) * 0.28);
      return k;
    });
    var ws = ks.map(function (k, j) { return row[j] === ' ' ? 0.28 : k * (H.layHasLatin(row[j]) ? 0.72 : 0.96); });
    var sumW = ws.reduce(function (a, b) { return a + b; }, 0) || 1;
    var rScale = Math.min(base, W * 0.86 / sumW);
    var x = W / 2 - sumW * rScale / 2;
    var baseline = Hh / 2 + (r - (lines.length - 1) / 2) * rScale * 1.1;
    row.forEach(function (ch, j) {
      var idx = gi++;
      if (ch === ' ') { x += ws[j] * rScale; return; }
      var sz = Math.max(8, ks[j] * rScale);
      var y = baseline + (R.hash01(seed, idx, 5) * 2 - 1) * rScale * 0.06;
      if (mode === 'stair') y += (j - (row.length - 1) / 2) * rScale * 0.12;
      if (mode === 'wave') y += Math.sin(j * 1.1) * rScale * 0.1;
      specs.push({
        text: ch, size: sz,
        x: x + ws[j] * rScale / 2, y: y,
        rot: (R.hash01(seed, idx, 6) * 2 - 1) * rotAmp,
        color: (idx === accentIdx % Math.max(1, nTotal) && !H.layIsKanji(ch)) ? sc.accent : sc.fg,
        mi: idx
      });
      x += ws[j] * rScale;
    });
  });
  H.laySetNodes(c, specs);
});

/* 2. marquee: main hero line with counter-scrolling peripheral ribbon strips */
reg('marquee', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var text = H.layText(c), seed = H.laySeed(c);
  var sx = P.sx == null ? 1.35 : P.sx;
  var style = P.rowStyle || ['outline', 'dim', 'box'][R.hash(seed, 3, 1) % 3];
  var rowsN = P.rows || 2, speed = P.speed == null ? 0.8 : P.speed;
  var size = Math.min(H.layFitSize(c, text, W * 0.82, Hh * 0.3, { sx: sx, track: 0.05 }), Hh * 0.28);
  var rs = Math.max(10, size * 0.42), ks = rowsN === 2 ? [-1, 1] : [-2, -1, 1, 2];
  var unit = text + '   /   ';
  var mU = H.layMeasure(c, unit, rs, { sx: sx, track: 0.05 });
  var period = Math.max(40, mU.w + rs * 0.05);
  var reps = Math.min(18, Math.ceil(W * 2.4 / period) + 1);
  var stripText = new Array(reps + 1).join(unit);
  ks.forEach(function (k, r) {
    var y = Hh / 2 + (k > 0 ? 1 : -1) * (size * 0.55 + rs * 0.95) + (Math.abs(k) - 1) * (k > 0 ? 1 : -1) * rs * 1.25;
    if (y < rs * 0.6 || y > Hh - rs * 0.6) return;
    if (style === 'box') {
      H.layRectAt(c, 'Marquee band ' + r, W / 2, y, W + 40, rs * 1.26, { fill: sc.ink || sc.fg, alpha: 0.95 }, envAlpha(c, Math.abs(k) * 0.05, 0.2));
    }
    var dir = r % 2 ? 1 : -1;
    var opts = {
      font: H.layFontObj(c), align: 'center',
      color: style === 'box' ? H.textOn(sc.ink || sc.fg, sc.bg, sc) : (style === 'dim' ? sc.sub : sc.fg),
      fill: style !== 'outline', stroke: style === 'outline',
      strokeColor: sc.fg, strokeWidth: Math.max(1.2, rs * 0.025),
      alpha: style === 'dim' ? 0.38 : style === 'outline' ? 0.85 : 1
    };
    var id = H.addText(c, 'Marquee row ' + r, stripText, W / 2, y, rs, opts, function (env, f) {
      var a = cl((env.t - Math.abs(k) * 0.05) / 0.14) * H.layTout(c, f);
      var off = ((env.t * speed * W * 0.2 * dir + r * period * 0.37) % period + period) % period - period / 2;
      return { 'position.x': off, 'scale.x': sx, alpha: opts.alpha * a };
    });
    if (id && c.graph.byId[id]) c.graph.byId[id].attrs.scale = [sx, 1];
  });
  H.laySetNodes(c, [{ text: text, size: size, sx: sx, track: 0.05, x: W / 2, y: Hh / 2, color: sc.fg }]);
});

/* 3. tile: scrolling typographic texture wallpaper behind knocked-out hero title */
reg('tile', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var text = H.layText(c), seed = H.laySeed(c);
  var rowsN = P.rowsN || (isPort(c) ? 14 : 10);
  var unitText = (P.unit === 'line' ? H.layLineText(c) : text) + '   ';
  var rowH = Hh / rowsN, ts = Math.max(10, rowH * 0.68);
  var per = Math.max(40, H.layMeasure(c, unitText, ts, { track: 0.02 }).w);
  var reps = Math.min(16, Math.ceil(W * 1.8 / per) + 2);
  var stripText = new Array(reps + 1).join(unitText);
  for (var r = 0; r < rowsN; r++) {
    (function (rowIdx) {
      var y = (rowIdx + 0.5) * rowH;
      var dir = rowIdx % 2 ? 1 : -1;
      var ap = R.hash01(seed, rowIdx, 91) * 0.35;
      H.addText(c, 'Tile row ' + rowIdx, stripText, W / 2, y, ts, {
        font: bodyFont(c), align: 'center', color: sc.sub, alpha: 0.38
      }, function (env, f) {
        var a = 0.38 * cl((env.t - ap) / 0.14) * H.layTout(c, f);
        var off = (((rowIdx % 2) * per * 0.5 + env.t * 28 * dir) % per + per) % per - per / 2;
        return { 'position.x': off, alpha: a };
      });
    })(r);
  }
  var mt = isPort(c) ? H.laySplitLines(text, 5) : text;
  var size = Math.min(H.layFitSize(c, mt, W * 0.8, Hh * 0.36, { track: 0.04, lead: 1.15 }), Hh * 0.28);
  var m = H.layMeasure(c, mt, size, { track: 0.04, lead: 1.15 });
  var knock = P.knock || (R.hash(seed, 4, 2) % 2 ? 'box' : 'stroke');
  if (knock === 'box') {
    H.layRectAt(c, 'Tile knockout plate', W / 2, Hh / 2, m.w + size * 0.7, m.h + size * 0.56, { fill: sc.bg, alpha: 1 }, function (env, f) {
      var sx = E.outExpo(cl(env.t / 0.32)) * H.layTout(c, f);
      return { sx: Math.max(0.001, sx), sy: 1, a: sx > 0.01 ? 1 : 0 };
    });
  }
  var mainSpec = { text: mt, size: size, x: W / 2, y: Hh / 2, track: 0.04, lead: 1.15, color: sc.fg };
  if (knock !== 'box') {
    mainSpec.post = function (graph, ids) {
      ids.forEach(function (id) {
        var cl = V.cloneLayer(graph, id, 'Knockout stroke');
        cl.attrs.fill = false; cl.attrs.stroke = true;
        cl.attrs['stroke.strokeColor'] = sc.bg;
        cl.attrs['stroke.width'] = Math.max(4, size * 0.16);
        var si = graph.layers.indexOf(graph.byId[id]), ci = graph.layers.indexOf(cl);
        if (ci > si && si >= 0) { graph.layers.splice(ci, 1); graph.layers.splice(si, 0, cl); }
      });
    };
  }
  H.laySetNodes(c, [mainSpec]);
});

/* 4. scatter: free-floating sized/tilted glyphs + ambient typographic tags */
reg('scatter', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var s = H.laySeed(c), text = H.layText(c), chars = H.layChars(text), n = chars.length;
  if (P.extras !== false) {
    for (var k = 0; k < 7; k++) {
      (function (idx) {
        var top = R.hash01(s, idx, 82) < 0.5;
        var ey = top ? mix(Hh * 0.08, Hh * 0.24, R.hash01(s, idx, 85)) : mix(Hh * 0.76, Hh * 0.92, R.hash01(s, idx, 85));
        var ex = mix(W * 0.1, W * 0.9, R.hash01(s, idx, 84));
        H.addText(c, 'Scatter echo ' + idx, text, ex, ey, mix(Hh * 0.02, Hh * 0.042, R.hash01(s, idx, 83)), {
          font: bodyFont(c), rotation: (R.hash01(s, idx, 86) * 2 - 1) * 18, color: sc.sub, alpha: 0.65
        }, envAlpha(c, R.hash01(s, idx, 81) * 0.4, 0.25));
      })(k);
    }
  }
  var base = Math.min(Hh * 0.28, W * 0.86 / Math.max(1, n) * 1.15);
  var specs = chars.map(function (ch, i) {
    var k = 0.65 + R.hash01(s, i, 73) * 0.8 * (H.layIsKanji(ch) ? 1 : 0.75);
    return {
      text: ch, size: Math.max(10, base * k),
      x: W * (0.12 + 0.76 * (i + 0.5) / Math.max(1, n)) + (R.hash01(s, i, 71) * 2 - 1) * W * 0.03,
      y: Hh / 2 + (R.hash01(s, i, 72) * 2 - 1) * Hh * 0.18,
      rot: (R.hash01(s, i, 74) * 2 - 1) * 24,
      color: R.hash01(s, i, 75) < 0.18 ? sc.accent : sc.fg,
      mi: i
    };
  });
  H.laySetNodes(c, specs);
});

/* 5. ring: orbital character wheel around central medallion or word */
reg('ring', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var text = H.layFlat(H.layText(c)), chars = H.layChars(text), seed = H.laySeed(c);
  var rad = Math.min(Hh * (P.R || 0.31), W * 0.38), cx = W / 2, cy = Hh / 2;
  var centerMode = P.center || ['word', 'disc', 'none'][R.hash(seed, 5, 1) % 3];
  var orient = P.orient || 'tangent';
  var speed = P.speed == null ? 8 : P.speed;
  H.layCircleAt(c, 'Outer ring guide', cx, cy, rad * 1.15, rad * 1.15, { stroke: sc.sub, width: 1.4, alpha: 0.35 }, envAlpha(c, 0, 0.3));
  H.layCircleAt(c, 'Inner ring guide', cx, cy, rad * 0.85, rad * 0.85, { stroke: sc.sub, width: 1.4, alpha: 0.55 }, envAlpha(c, 0.05, 0.3));
  var specs = [];
  if (centerMode === 'disc') {
    H.layCircleAt(c, 'Ring center disc', cx, cy, rad * 0.7, rad * 0.7, { fill: sc.accent, alpha: 1 }, function (env, f) {
      var s = E.outBack(cl(env.t / 0.32), 1.6) * H.layTout(c, f);
      return { s: Math.max(0.001, s), a: s > 0.01 ? 1 : 0 };
    });
    specs.push({
      text: text, size: Math.min(H.layFitSize(c, text, rad * 1.1, rad * 0.75), Hh * 0.18),
      x: cx, y: cy, color: H.textOn(sc.accent, sc.bg, sc), mi: 0
    });
  } else if (centerMode === 'word') {
    specs.push({
      text: text, size: Math.min(H.layFitSize(c, text, rad * 1.28, rad * 0.85), Hh * 0.2),
      x: cx, y: cy, color: sc.fg, mi: 0
    });
  }
  var unit = chars.concat(['\u00b7']), cnt = Math.max(unit.length, Math.min(28, Math.floor(TAU * rad / Math.max(18, Hh * 0.072))));
  var ringSize = Math.min(Hh * 0.065, TAU * rad / Math.max(4, cnt * 1.25));
  for (var i = 0; i < cnt; i++) {
    (function (idx) {
      var ch = unit[idx % unit.length];
      var baseAng = idx / cnt * 360 - 90;
      specs.push({
        text: ch, size: Math.max(8, ringSize),
        x: cx + Math.cos(baseAng * DEG) * rad, y: cy + Math.sin(baseAng * DEG) * rad,
        rot: orient === 'tangent' ? baseAng + 90 : 0,
        color: ch === '\u00b7' ? sc.accent : sc.fg,
        mi: idx * 0.25,
        animPlace: function (env) {
          var ang = baseAng + env.t * speed;
          return {
            x: cx + Math.cos(ang * DEG) * rad,
            y: cy + Math.sin(ang * DEG) * rad,
            rot: orient === 'tangent' ? ang + 90 : 0
          };
        }
      });
    })(i);
  }
  H.laySetNodes(c, specs);
});

/* 6. wave: sinusoidal traveling curve with ghosted ribbon trails */
reg('wave', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var chars = H.layChars(H.layText(c)), n = chars.length, seed = H.laySeed(c);
  var amp = P.amp == null ? 0.12 : P.amp, freq = P.freq == null ? 1.15 : P.freq;
  var size = Math.min(Hh * 0.2, W * 0.72 / Math.max(1, n));
  var du = size * 1.05 / W, dur = Math.max(0.5, (c.cut.sourceEnd - c.cut.origin) / c.comp.fps);
  var travel = P.travel == null ? (R.hash01(seed, 6, 1) > 0.5 ? 0.35 : -0.35) : P.travel;
  function pathPt(u, t) {
    return [W * u, Hh / 2 + Hh * amp * Math.sin(TAU * freq * u + t * 1.3)];
  }
  function angAt(u, t) {
    var a = pathPt(u - 0.002, t), b = pathPt(u + 0.002, t);
    return Math.atan2(b[1] - a[1], b[0] - a[0]) / DEG;
  }
  var trailN = P.trail == null ? 4 : Math.min(6, P.trail);
  for (var k = trailN; k >= 1; k--) {
    (function (tk) {
      chars.forEach(function (ch, i) {
        var pt0 = pathPt(0.5 + (i - (n - 1) / 2) * du, 0);
        H.addText(c, 'Wave trail ' + tk + '-' + i, ch, pt0[0], pt0[1], size * (1 - tk * 0.04), {
          color: sc.sub, alpha: 0.45 * (1 - tk / (trailN + 1))
        }, function (env, f) {
          var u0 = 0.5 - (env.t / dur - 0.5) * travel;
          var u = u0 + (i - (n - 1) / 2) * du + tk * du * 0.2 * (travel >= 0 ? 1 : -1);
          var pt = pathPt(u, env.t);
          return {
            'position.x': pt[0] - pt0[0], 'position.y': pt0[1] - pt[1],
            rotation: -angAt(u, env.t),
            alpha: 0.45 * (1 - tk / (trailN + 1)) * H.layTin(c, f, 0, 0.25) * H.layTout(c, f)
          };
        });
      });
    })(k);
  }
  var specs = chars.map(function (ch, i) {
    var pt0 = pathPt(0.5 + (i - (n - 1) / 2) * du, 0);
    return {
      text: ch, size: size, x: pt0[0], y: pt0[1], rot: angAt(0.5 + (i - (n - 1) / 2) * du, 0),
      color: sc.fg, mi: i * 0.5,
      animPlace: function (env) {
        var u0 = 0.5 - (env.t / dur - 0.5) * travel;
        var u = u0 + (i - (n - 1) / 2) * du;
        var pt = pathPt(u, env.t);
        return { x: pt[0], y: pt[1], rot: angAt(u, env.t) };
      }
    };
  });
  H.laySetNodes(c, specs);
});

/* 7. huge: edge-bleeding monolithic copy + corner pill badge */
reg('huge', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var t0 = H.layStrip(H.layText(c)), n = Array.from(t0).length;
  var text = n >= 5 ? H.laySplitLines(t0, Math.ceil(n / 2)) : t0;
  var lines = text.split('\n').length;
  var size = lines > 1 ? Math.min(Hh * 0.52, W * 1.15 / Math.max(1, Math.ceil(n / 2) * 0.96)) : Math.min(Hh * 0.9, W * 1.25 / Math.max(1, n * 0.95));
  var dir = P.dir || (H.laySeed(c) % 2 ? 1 : -1);
  var dur = Math.max(0.5, (c.cut.sourceEnd - c.cut.origin) / c.comp.fps);
  if (P.label !== false) {
    var ls = cl(Hh * 0.026, 14, 28), full = H.layText(c);
    var lw = H.layMeasure(c, full, ls, { track: 0.1, font: bodyFont(c) }).w + ls * 1.4;
    H.layRectAt(c, 'Huge corner pill', W * 0.05 + lw / 2, Hh * 0.86, lw, ls * 2, { fill: sc.ink || sc.fg, alpha: 1 }, envAlpha(c, 0.15, 0.25));
    H.addText(c, 'Huge label text', full, W * 0.05 + ls * 0.7, Hh * 0.86, ls, {
      font: bodyFont(c), align: 'left', color: H.textOn(sc.ink || sc.fg, sc.bg, sc)
    }, envAlpha(c, 0.15, 0.25));
  }
  H.laySetNodes(c, [{
    text: text, size: Math.max(16, size), x: W / 2, y: Hh / 2, lead: 0.98, track: -0.02, color: sc.fg,
    animPlace: function (env) { return { dx: (0.5 - env.t / dur) * W * 0.15 * dir, dy: 0 }; }
  }]);
});

/* 8. labels: sticker/badge array arranged radially, in staggered rows, or scattered */
reg('labels', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var s = H.laySeed(c), text = H.layText(c);
  var units = H.layChars(text).filter(function (ch) { return !H.layIsPunct(ch); });
  if (!units.length) units = [text];
  var variant = P.variant || ['radial', 'rows', 'scatter'][R.hash(s, 8, 1) % 3];
  var center = P.center || (R.hash01(s, 8, 2) > 0.5 ? 'word' : 'orb');
  var plateC = sc.ink || sc.fg, tc = H.textOn(plateC, sc.bg, sc);
  var specs = [];
  if (variant === 'radial') {
    var rad = Math.min(Hh * 0.3, W * 0.36), fs = Math.min(Hh * 0.06, W * 0.052);
    var m = Math.max(units.length, 10);
    if (center === 'orb') {
      H.layCircleAt(c, 'Labels core orb', W / 2, Hh / 2, rad * 0.5, rad * 0.5, { fill: sc.accent, alpha: 1 }, function (env, f) {
        var q = E.outBack(cl(env.t / 0.32), 1.4) * H.layTout(c, f);
        return { s: Math.max(0.001, q), a: q > 0.01 ? 1 : 0 };
      });
    } else if (center === 'word') {
      specs.push({ text: text, size: Math.min(H.layFitSize(c, text, rad * 1.1, rad * 0.7), Hh * 0.18), x: W / 2, y: Hh / 2, color: sc.fg });
    }
    for (var i = 0; i < m; i++) {
      (function (idx) {
        var u = units[idx % units.length], ang = idx / m * 360 - 90;
        var lx = W / 2 + Math.cos(ang * DEG) * rad, ly = Hh / 2 + Math.sin(ang * DEG) * rad;
        var bw = H.layMeasure(c, u, fs, { track: 0.04 }).w + fs * 0.75, bh = fs * 1.38;
        H.layRRect(c, 'Label plate ' + idx, lx - bw / 2, ly - bh / 2, bw, bh, bh * 0.12, { fill: plateC, rot: ang, alpha: 1 }, function (env, f) {
          var q = E.outBack(cl((env.t - idx * 0.025) / 0.22), 1.8) * H.layTout(c, f);
          var a2 = idx / m * 360 + env.t * 7 - 90;
          return { x: W / 2 + Math.cos(a2 * DEG) * rad, y: Hh / 2 + Math.sin(a2 * DEG) * rad, rot: a2, s: Math.max(0.001, q), a: q > 0.01 ? 1 : 0 };
        });
        H.addText(c, 'Label text ' + idx, u, lx, ly, fs, { color: tc, rotation: ang }, function (env, f) {
          var q = E.outBack(cl((env.t - idx * 0.025) / 0.22), 1.8) * H.layTout(c, f);
          var a2 = idx / m * 360 + env.t * 7 - 90;
          return { 'position.x': (W / 2 + Math.cos(a2 * DEG) * rad) - W / 2, 'position.y': Hh / 2 - (Hh / 2 + Math.sin(a2 * DEG) * rad), rotation: -a2, 'scale.x': Math.max(0.001, q), 'scale.y': Math.max(0.001, q), alpha: q > 0.01 ? 1 : 0 };
        });
      })(i);
    }
    if (specs.length) H.laySetNodes(c, specs);
    return;
  }
  var k = units.length, rowFs = variant === 'rows' ? Math.min(Hh * 0.095, Hh * 0.68 / Math.max(1, k * 1.5)) : Hh * 0.085;
  units.forEach(function (u, i) {
    var x = variant === 'rows' ? W / 2 + (R.hash01(s, i, 5) * 2 - 1) * W * 0.12 : W * (0.16 + 0.68 * ((i + 0.5) / Math.max(1, k)));
    var y = variant === 'rows' ? Hh / 2 + (i - (k - 1) / 2) * rowFs * 1.55 : Hh / 2 + (R.hash01(s, i, 8) * 2 - 1) * Hh * 0.22;
    var rot = (R.hash01(s, i, 9) * 2 - 1) * (variant === 'rows' ? 4 : 20);
    var fs = variant === 'rows' ? rowFs : rowFs * (0.8 + R.hash01(s, i, 10) * 0.45);
    var bw = H.layMeasure(c, u, fs, { track: 0.04 }).w + fs * 0.8, bh = fs * 1.38;
    H.layRectAt(c, 'Badge plate ' + i, x, y, bw, bh, { fill: plateC, rot: rot, alpha: 1 }, function (env, f) {
      var q = E.outBack(cl((env.t - i * 0.04) / 0.22), 1.8) * H.layTout(c, f);
      return { s: Math.max(0.001, q), a: q > 0.01 ? 1 : 0 };
    });
    specs.push({ text: u, size: fs, x: x, y: y, rot: rot, color: tc, delaySec: i * 0.04, mi: i });
  });
  H.laySetNodes(c, specs);
});

/* 9. condensed: vertically tall / horizontally compressed architectural columns */
reg('condensed', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var text = H.layFlat(H.layText(c)), n = H.layChars(text).length;
  var count = P.count || (n <= 4 ? 3 : n <= 7 ? 2 : 1);
  var sx = P.sx == null ? 0.5 : P.sx, sy = P.sy == null ? 1.2 : P.sy;
  var slot = W * 0.9 / count;
  var size = Math.min(H.layFitSize(c, text, slot * 0.92, Hh * 0.78, { sx: sx, sy: sy, track: 0.04 }), Hh * 0.58);
  var order = [1, 0, 2, 3], specs = [];
  for (var i = 0; i < count; i++) {
    specs.push({
      text: text, size: size, sx: sx, sy: sy, track: 0.04,
      x: W / 2 + (i - (count - 1) / 2) * slot, y: Hh / 2,
      color: sc.fg, mi: count > 1 ? order[i % order.length] * 2 : 0
    });
  }
  H.laySetNodes(c, specs);
});

/* 10. gloss: off-center headword with leader polyline callout & margin gloss */
reg('gloss', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var text = H.layText(c), seed = H.laySeed(c);
  var right = (P.side || (seed % 2 ? 'right' : 'left')) === 'right';
  var bgText = P.bgText != null ? P.bgText : (R.hash01(seed, 10, 1) > 0.4);
  if (bgText) {
    var rep = new Array(5).join(H.layStrip(text));
    for (var r = 0; r < 3; r++) {
      (function (row) {
        H.addText(c, 'Gloss bg ' + row, rep, W / 2, Hh * (0.2 + row * 0.3), Hh * 0.26, {
          color: sc.dim || sc.sub, alpha: 0.35
        }, function (env, f) {
          return { 'position.x': ((env.t * 24 * (row % 2 ? 1 : -1)) % (Hh * 0.4)), alpha: 0.35 * H.layTout(c, f) };
        });
      })(r);
    }
  }
  var size = Math.min(H.layFitSize(c, text, W * 0.48, Hh * 0.28, { track: 0.03 }), Hh * 0.22);
  var tx = right ? W * 0.38 : W * 0.62, ty = Hh * 0.55;
  var m = H.layMeasure(c, text, size, { track: 0.03 });
  var ax = right ? tx + m.w / 2 + size * 0.1 : tx - m.w / 2 - size * 0.1;
  var ay = ty - m.h / 2 + size * 0.2;
  var nx = right ? Math.min(W * 0.88, ax + W * 0.12) : Math.max(W * 0.12, ax - W * 0.12);
  var ny = Math.max(Hh * 0.16, ay - Hh * 0.12), mx = mix(ax, nx, 0.45);
  var pts = [[ax, ay], [mx, ay], [nx, ny]];
  H.line(c, 'Gloss callout', pts, sc.sub, Math.max(1.5, uMin(c) * 0.002), 0.9);
  H.layCircleAt(c, 'Gloss anchor dot', ax, ay, Math.max(3, size * 0.05), Math.max(3, size * 0.05), { fill: sc.accent, alpha: 1 }, envAlpha(c, 0.15, 0.3));
  var ns = cl(Hh * 0.024, 13, 24), align = right ? 'left' : 'right';
  H.addText(c, 'Gloss head', '[' + H.layStrip(text) + ']', nx, ny - ns * 1.3, ns * 1.15, { font: serifFont(c), align: align, color: sc.fg }, envAlpha(c, 0.2, 0.35));
  H.addText(c, 'Gloss note', H.layAltCopy(c), nx, ny + ns * 0.3, ns, { font: bodyFont(c), align: align, color: sc.sub }, envAlpha(c, 0.25, 0.35));
  H.addText(c, 'Gloss index', 'No.' + H.layLineNo(c), nx, ny + ns * 1.8, ns * 0.85, { font: monoFont(c), align: align, color: sc.accent }, envAlpha(c, 0.3, 0.35));
  H.laySetNodes(c, [{ text: text, size: size, x: tx, y: ty, track: 0.03, color: sc.fg }]);
});

/* 11. type: monospace terminal/typewriter lyric line with metadata footer */
reg('type', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var text = H.laySplitLines(H.layText(c), 14), lines = text.split('\n');
  var size = Math.min(Hh * 0.1, H.layFitSize(c, text, W * 0.72, Hh * 0.36, { track: 0.06, lead: 1.35 }));
  var left = (P.align || (H.laySeed(c) % 2 ? 'left' : 'center')) === 'left';
  var x = left ? W * 0.14 : W / 2;
  var m = H.layMeasure(c, text, size, { track: 0.06, lead: 1.35 });
  if (P.prompt !== false) {
    var px = (left ? x : x - m.w / 2) - size * 0.9;
    H.addText(c, 'Type prompt', '>', px, Hh / 2 - (lines.length - 1) * size * 0.65, size * 0.85, { font: monoFont(c), color: sc.accent }, envAlpha(c, 0, 0.2));
  }
  H.addText(c, 'Type status', 'LINE ' + H.layLineNo(c) + '  —  ' + H.layFmtTime(c.cut.origin / c.comp.fps), W * 0.14, Hh * 0.8, cl(Hh * 0.02, 12, 20), {
    font: monoFont(c), align: 'left', color: sc.sub, alpha: 0.85
  }, envAlpha(c, 0.1, 0.3));
  H.laySetNodes(c, [{ text: text, size: size, x: x, y: Hh / 2, align: left ? 'left' : 'center', track: 0.06, lead: 1.35, color: sc.fg }]);
});

/* 12. diag: full-width diagonal accent band with companion ticker & rotated title */
reg('diag', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var text = H.layText(c), seed = H.laySeed(c);
  var ang = (P.ang == null ? 15 : P.ang) * (seed % 2 ? 1 : -1);
  var bandCol = (P.band || (seed % 3 ? 'accent' : 'ink')) === 'accent' ? sc.accent : (sc.ink || sc.fg);
  var txtCol = H.textOn(bandCol, sc.bg, sc);
  var size = Math.min(H.layFitSize(c, text, W * 0.7, Hh * 0.24, { track: 0.05 }), Hh * 0.19);
  var bh = size * 1.65;
  var bw = Math.hypot(W, Hh) * 1.4;
  H.layRectAt(c, 'Diagonal banner', W / 2, Hh / 2, bw, bh, { fill: bandCol, rot: -ang, alpha: 1 }, function (env, f) {
    var e = E.outExpo(cl(env.t / 0.35)) * H.layTout(c, f);
    return { sx: 1, sy: Math.max(0.001, e), a: e > 0.01 ? 1 : 0 };
  });
  if (P.second !== false) {
    var h2 = bh * 0.32, yOff = bh * 0.85, rad = -ang * DEG;
    var sx2 = W / 2 - Math.sin(rad) * yOff, sy2 = Hh / 2 + Math.cos(rad) * yOff;
    H.layRectAt(c, 'Diagonal sub-band', sx2, sy2, bw, h2, { fill: sc.fg, rot: -ang, alpha: 0.9 }, envAlpha(c, 0.1, 0.3));
    var subTxt = new Array(5).join(H.layLineText(c) + '  /  ');
    H.addText(c, 'Diagonal sub-text', subTxt, sx2, sy2, h2 * 0.55, {
      font: bodyFont(c), rotation: -ang, color: H.textOn(sc.fg, sc.bg, sc)
    }, envAlpha(c, 0.15, 0.3));
  }
  H.laySetNodes(c, [{ text: text, size: size, x: W / 2, y: Hh / 2, rot: -ang, track: 0.05, color: txtCol }]);
});

/* 13. circle: central circular emblem (disc, orbital arc ring, or solar eclipse) */
reg('circle', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var text = H.layStrip(H.layText(c)), seed = H.laySeed(c);
  var variant = P.variant || ['disc', 'ring', 'eclipse'][R.hash(seed, 13, 1) % 3];
  var cx = W / 2 + (P.off || 0) * W, cy = Hh / 2;
  if (variant === 'eclipse') {
    var sizeE = Math.min(H.layFitSize(c, H.laySplitLines(text, 6), W * 0.8, Hh * 0.45), Hh * 0.32);
    var rE = Hh * 0.2;
    H.layCircleAt(c, 'Eclipse rim', W / 2, Hh / 2 + Hh * 0.1, rE * 1.04, rE * 1.04, { stroke: sc.fg, width: 3, alpha: 0.9 }, function (env, f) {
      return { dx: mix(-0.08, 0.08, cl(env.t / 2)) * W, dy: 0, s: H.layTout(c, f) };
    });
    H.layCircleAt(c, 'Eclipse moon', W / 2, Hh / 2 + Hh * 0.1, rE, rE, { fill: H.mixHex(sc.bg, '#000000', 0.35), alpha: 1 }, function (env, f) {
      return { dx: mix(-0.08, 0.08, cl(env.t / 2)) * W, dy: 0, s: H.layTout(c, f) };
    });
    H.laySetNodes(c, [{ text: H.laySplitLines(text, 6), size: sizeE, x: W / 2, y: Hh / 2, lead: 1.05, color: sc.fg }]);
    return;
  }
  var rad = Math.min(Hh * 0.3, W * 0.4);
  if (variant === 'disc') {
    H.layCircleAt(c, 'Circle disc', cx, cy, rad, rad, { fill: sc.accent, alpha: 1 }, function (env, f) {
      var s = E.outBack(cl(env.t / 0.35), 1.5) * H.layTout(c, f);
      return { s: Math.max(0.001, s), a: s > 0.01 ? 1 : 0 };
    });
  } else {
    H.layCircleAt(c, 'Circle stroke ring', cx, cy, rad, rad, { stroke: sc.fg, width: 3, alpha: 1 }, function (env, f) {
      var s = E.outExpo(cl(env.t / 0.45)) * H.layTout(c, f);
      return { s: Math.max(0.001, s), a: s > 0.01 ? 1 : 0 };
    });
  }
  var vert = P.vertical != null ? !!P.vertical : (Array.from(text).length <= 4 && R.hash01(seed, 13, 2) > 0.5);
  var sizeC = Math.min(H.layFitSize(c, text, rad * (vert ? 1.05 : 1.45), rad * (vert ? 1.35 : 0.9), { vertical: vert }), rad * 0.8);
  H.laySetNodes(c, [{ text: text, size: sizeC, x: cx, y: cy, vertical: vert, color: variant === 'disc' ? H.textOn(sc.accent, sc.bg, sc) : sc.fg }]);
});

/* 14. stack: vertical layered copy echoes in fade or outline treatment */
reg('stack', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var text = H.layText(c), seed = H.laySeed(c);
  var copies = cl(P.copies || 4, 2, 6), dir = P.dir || (seed % 2 ? 1 : -1);
  var style = P.style || (R.hash01(seed, 14, 1) > 0.5 ? 'outline' : 'fade');
  var gap = P.gap == null ? 0.9 : P.gap, xs = P.xs == null ? (R.hash01(seed, 14, 2) - 0.5) * 0.05 : P.xs;
  var size = Math.min(H.layFitSize(c, text, W * 0.8, Hh * 0.22, { track: 0.03 }), Hh * 0.18);
  var step = size * gap, y0 = Hh / 2 - dir * (copies - 1) * step / 2, specs = [];
  for (var k = copies - 1; k >= 0; k--) {
    var sp = {
      text: text, size: size, x: W / 2 + xs * W * k, y: y0 + dir * k * step,
      track: 0.03, color: sc.fg, mi: k * 1.2
    };
    if (k > 0) {
      if (style === 'outline') { sp.fill = false; sp.stroke = true; sp.strokeColor = sc.fg; sp.strokeWidth = Math.max(1.2, size * 0.016); sp.alpha = 0.82; }
      else { sp.alpha = 0.6 * Math.pow(0.58, k - 1); }
    }
    specs.push(sp);
  }
  H.laySetNodes(c, specs);
});

/* 15. pill: glowing/solid capsule plate with hero text + orbiting mini pills */
reg('pill', function (c) {
  var P = (c.preset && c.preset.params) || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc;
  var text = H.layText(c);
  var size = Math.min(H.layFitSize(c, text, W * 0.62, Hh * 0.2, { track: 0.04 }), Hh * 0.17);
  var m = H.layMeasure(c, text, size, { track: 0.04 });
  var w = m.w + size * 1.3, h = size * 1.65;
  var plate = sc.accent || sc.ink || sc.fg, tc = H.textOn(plate, sc.bg, sc);
  H.layRRect(c, 'Pill capsule', W / 2 - w / 2, Hh / 2 - h / 2, w, h, h / 2, { fill: plate, alpha: 1 }, function (env, f) {
    var e = E.outExpo(cl(env.t / 0.32)) * H.layTout(c, f);
    return { sx: Math.max(0.001, e), sy: 1, a: e > 0.01 ? 1 : 0 };
  });
  if (P.smalls !== false) {
    var fs = cl(Hh * 0.022, 12, 22);
    var labs = [H.layNote(c) || 'LYRIC', 'No.' + H.layLineNo(c), H.layFmtTime(c.cut.origin / c.comp.fps)];
    labs.forEach(function (lb, i) {
      var mw = H.layMeasure(c, lb, fs, { track: 0.1, font: bodyFont(c) }).w + fs * 1.6;
      var px = W / 2 + (i === 0 ? -w * 0.3 : i === 1 ? w * 0.42 : w * 0.1);
      var py = Hh / 2 + (i === 1 ? -h * 0.95 : h * 0.95);
      H.layRRect(c, 'Mini pill ' + i, px - mw / 2, py - fs * 0.85, mw, fs * 1.7, fs * 0.85, { stroke: sc.fg, width: 1.4, alpha: 1 }, envAlpha(c, 0.12 + i * 0.06, 0.25));
      H.addText(c, 'Mini pill text ' + i, lb, px, py, fs, { font: bodyFont(c), color: sc.fg }, envAlpha(c, 0.12 + i * 0.06, 0.25));
    });
  }
  H.laySetNodes(c, [{ text: text, size: size, x: W / 2, y: Hh / 2, track: 0.04, color: tc }]);
});
})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
