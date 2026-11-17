/* Requested motion recipes, ported from the AE core behaviour rather than mapped to a family.
 * Enter/exit/hold register glyph samplers; graphics are real editable paths.
 * Source: jizura_core.jsx (read-only). */
(function (N, R, C, V) {
'use strict';

var E = R.E;
var cl = R.clamp;
var mix = R.mix;
function motionAmount(c){var fx=c.assembly.style.fx||{};return fx.motion==null?.7:N.finite(fx.motion,'motion');}

function reg(group, key, build, differences) {
  N.register(group, key, {
    source: 'jizura_core.jsx / ' + group + ':' + key,
    scope: group === 'hold' ? 'glyph+graphics' : 'glyph',
    build: build,
    differences: differences || []
  });
}

function apply(s, o) {
  if (!o) return;
  if (o.hide) { s.a = 0; return; }
  s.dx += o.dx || 0; s.dy += o.dy || 0; s.rot += o.rot || 0;
  var scale = o.s == null ? 1 : o.s;
  s.sx *= scale * (o.sx == null ? 1 : o.sx);
  s.sy *= scale * (o.sy == null ? 1 : o.sy);
  s.a *= o.a == null ? 1 : o.a;
  if (o.clipPolygon) s.clipPolygon = o.clipPolygon;
  if (o.blur != null) s.blur = (s.blur || 0) + o.blur;
  if (o.color) s.color = o.color;
  if (o.ch != null) s.ch = o.ch;
}

function motion(group, key, factory, differences) {
  reg(group, key, function (c) {
    var fn = factory(c);
    return function (s, g, gs, frame) {
      var env = V.envelope(c, c.node, frame);
      var p = group === 'enter' ? env.pin : group === 'exit' ? env.pout : env.amt;
      apply(s, fn(p, g, gs, env, frame));
    };
  }, differences);
}

function seg(p, a, b) { return cl((p - a) / (b - a)); }
function isKanji(ch) {
  var cp = String(ch).codePointAt(0);
  return (cp >= 0x3400 && cp <= 0x9FFF) || (cp >= 0x20000 && cp <= 0x3134F);
}
function keyIndex(gs) {
  var best = -1, length = 0;
  [isKanji, function (ch) { return /[A-Za-z0-9]/.test(ch); }].some(function (test) {
    for (var i = 0; i < gs.length; i++) {
      if (!test(gs[i].ch)) continue;
      var j = i;
      while (j < gs.length && test(gs[j].ch)) j++;
      if (j - i > length) { best = i; length = j - i; }
      i = j - 1;
    }
    return best >= 0;
  });
  if (best >= 0) return best;
  for (var k = 0; k < gs.length; k++) if (!/[\s\u3000、。！？!?]/.test(gs[k].ch)) return k;
  return 0;
}

/* A screen-direction drop followed by eight delayed impressions. */
motion('enter', 'xgComet', function (c) {
  c.node._jzComet = true;
  var vertical = !!c.node.vertical;
  var distance = c.node.size * 3 * (0.7 + 0.5 * motionAmount(c));
  var dir = vertical ? (N.random(c.node.seed || 0, 49, 5) < 0.5 ? -1 : 1) : -1;
  return function (p) {
    var offset = distance * (1 - E.outExpo(p / 0.35));
    return vertical ? { dx: dir * offset, a: cl(p * 8) } : { dy: -offset, a: cl(p * 8) };
  };
}, ['Eight editable delayed glyph copies replace AE Echo.', 'Trail sampling is frame-based.']);

motion('exit', 'xjFocusPull', function (c) {
  var gs = V.glyphs(c, c.node), b = V.bounds(gs);
  return function (p, g) {
    var blur;
    if (p < 0.3) blur = 0.5 * E.inOutCubic(p / 0.3);
    else if (p < 0.48) blur = mix(0.5, 0.08, E.inOutCubic(seg(p, 0.3, 0.48)));
    else blur = mix(0.08, 1, E.inQuad(seg(p, 0.48, 1)));
    var scale = 1 + 0.1 * blur;
    var q = seg(p, 0.58, 1), smooth = q * q * (3 - 2 * q);
    return { dx: (g.x - b.cx) * (scale - 1), dy: (g.y - b.cy) * (scale - 1), s: scale, a: 1 - smooth,
      blur: c.node.size * 0.26 * blur };
  };
}, ['Emission requires a verified Gaussian-blur host profile.', 'No fade-only or scale-only fallback is used.']);

motion('enter', 'tyKeyFirst', function () {
  var cache = null;
  return function (p, g, gs) {
    if (!cache) {
      var ki = keyIndex(gs), md = 1;
      gs.forEach(function (x, i) { md = Math.max(md, Math.abs(i - ki)); });
      cache = { index: ki, glyph: gs[ki], max: md };
    }
    if (gs.length <= 1) {
      var solo = cl(p / 0.7);
      return { hide: solo <= 0, s: mix(1.9, 1, E.outExpo(solo)), a: cl(solo * 4) };
    }
    if (g.i === cache.glyph.i) {
      var first = cl(p / 0.42);
      return { hide: first <= 0, s: mix(2.1, 1, E.outExpo(first)), a: cl(first * 4) };
    }
    var distance = Math.abs(g.i - cache.glyph.i) / cache.max;
    var q = cl((p - 0.3 - distance * 0.35) / 0.35), e = E.outExpo(q);
    return { hide: q <= 0, dx: (cache.glyph.x - g.x) * (1 - e), dy: (cache.glyph.y - g.y) * (1 - e),
      s: mix(0.4, 1, e), a: cl(q * 2.5) };
  };
});

/* Explicit word payload wins. Otherwise use script-run chunks. */
function wordGroups(c, gs) {
  var supplied = c.node.words || c.cut.words || c.cut.source && c.cut.source.words;
  var chunks;
  if (Array.isArray(supplied) && supplied.length) chunks = supplied.map(String);
  else {
    chunks = c.node.text.match(/[A-Za-z0-9’']+|[\u3400-\u9FFF]+[\u3040-\u309F]*|[\u30A0-\u30FFー]+|[\u3040-\u309F]+|[^\s\u3000]/gu) || [];
  }
  var expected = chunks.join('').replace(/[\s\u3000]/g, '');
  var actual = gs.map(function (g) { return g.ch; }).join('').replace(/[\s\u3000]/g, '');
  if (expected !== actual) throw new Error('Word payload mismatch: ' + c.node.id);

  var cursor = 0, membership = Object.create(null), words = [];
  chunks.forEach(function (chunk) {
    var chars = Array.from(chunk.replace(/[\s\u3000]/g, ''));
    if (!chars.length) return;
    var members = [];
    while (members.length < chars.length && cursor < gs.length) {
      var g = gs[cursor++];
      if (/^[\s\u3000]$/.test(g.ch)) continue;
      members.push(g);
    }
    var b = V.bounds(members);
    var w = { gs: members, b: b, li: members[0].li || 0, index: words.length };
    members.forEach(function (g) { membership[g.i] = w.index; });
    words.push(w);
  });
  return { words: words, membership: membership };
}

motion('exit', 'knCloseGap', function (c) {
  var data = null, vertical = !!c.node.vertical;
  return function (p, g, gs) {
    if (!data) data = wordGroups(c, gs);
    var words = data.words, j = data.membership[g.i];
    if (j == null) return { hide: p > 0 };
    function rank(index) {
      var lo = 0, hi = words.length - 1, r = 0;
      while (lo <= hi) {
        if (lo === index) return r;
        r++;
        if (hi !== lo) { if (hi === index) return r; r++; }
        lo++; hi--;
      }
      return r;
    }
    function progress(index) { return E.inOutCubic(p * words.length - rank(index)); }
    function low(w) { return vertical ? w.b.y0 : w.b.x0; }
    function high(w) { return vertical ? w.b.y1 : w.b.x1; }
    var current = words[j], gone = progress(j);
    if (gone >= 0.999) return { hide: true };
    var row = words.filter(function (w) { return w.li === current.li; });
    var total = 0, i, w, width;
    row.forEach(function (item, k) {
      total += (high(item) - low(item)) * (1 - progress(item.index));
      if (k + 1 < row.length) {
        total += (low(row[k + 1]) - high(item)) * (1 - Math.max(progress(item.index), progress(row[k + 1].index)));
      }
    });
    var x = (low(row[0]) + high(row[row.length - 1])) / 2 - total / 2, centre = x;
    row.forEach(function (item, k) {
      width = (high(item) - low(item)) * (1 - progress(item.index));
      if (item.index === j) centre = x + width / 2;
      x += width;
      if (k + 1 < row.length) {
        x += (low(row[k + 1]) - high(item)) * (1 - Math.max(progress(item.index), progress(row[k + 1].index)));
      }
    });
    var s = Math.max(0.01, 1 - gone);
    var wc = (low(current) + high(current)) / 2;
    var along = vertical ? g.y : g.x, cross = vertical ? g.x : g.y;
    var cc = vertical ? current.b.cx : current.b.cy;
    var na = centre + (along - wc) * s, nc = cc + (cross - cc) * s;
    return vertical ? { dx: nc - g.x, dy: na - g.y, s: s } : { dx: na - g.x, dy: nc - g.y, s: s };
  };
}, ['When words are absent, script-run segmentation is used.', 'Export source.words for authoritative planner segmentation.']);

motion('exit', 'xiPlateCarry', function (c) {
  var node = c.node, gs = V.glyphs(c, node), b = V.bounds(gs);
  var pad = node.size * 0.16, vertical = !!node.vertical;
  var a0 = (vertical ? b.y0 : b.x0) - pad, a1 = (vertical ? b.y1 : b.x1) + pad;
  var b0 = (vertical ? b.x0 : b.y0) - pad, b1 = (vertical ? b.x1 : b.y1) + pad;
  var parent = V.local(c, node, 'Plate carry');
  var dir = N.random(node.seed || 0, 61, 5) < 0.5 ? 1 : -1;
  var far = (vertical ? c.comp.height : c.comp.width) + (a1 - a0) * 2;
  var plate = V.rect(c, 'Exit plate', vertical ? b0 : a0, vertical ? a0 : b0,
    vertical ? b1 - b0 : a1 - a0, vertical ? a1 - a0 : b1 - b0, { fill: c.sc.accent }, parent);
  V.animate(c, plate, function (e, f) {
    var p = V.envelope(c, node, f).pout;
    var qa = E.inOutCubic(seg(p, 0, 0.34)), qc = seg(p, 0.46, 1);
    var slide = dir * far * qc * qc * (2.4 * qc - 1.4) * 0.999;
    var result = { alpha: qa > 0 && p < 1 ? 1 : 0, rotation: -(vertical ? -1 : 1) * dir * 9 * qc * qc };
    result[vertical ? 'scale.x' : 'scale.y'] = Math.max(1e-6, qa);
    result[vertical ? 'position.y' : 'position.x'] = vertical ? -slide : slide;
    return result;
  });
  return function (p) {
    var qa = E.inOutCubic(seg(p, 0, 0.34)), front = mix(b0, b1, qa);
    if (qa >= 1) return { hide: true };
    return { clipPolygon: vertical ? V.polygon(front, a0, b1, a1) : V.polygon(a0, front, a1, b1) };
  };
});

reg('hold', 'tzKernNudge', function (c) {
  var node = c.node, gs = V.glyphs(c, node), rows = V.spans(gs, !!node.vertical);
  var mk = Math.min(1.3, motionAmount(c) / 0.7);
  var amplitude = node.size * 0.09 * mk, seed = node.seed || 0;
  function choice(frame) {
    var e = V.envelope(c, node, frame), tt = e.t / 1.3;
    var cycle = Math.floor(tt), fr = tt - cycle;
    var li = Math.floor(N.random(seed, cycle, 711) * rows.length);
    var row = rows[li], count = row ? row.glyphs.length : 0;
    var gap = count >= 3 ? 1 + Math.floor(N.random(seed, cycle, 370) * (count - 1)) : 0;
    var sign = N.random(seed, cycle, 530) < 0.5 ? 1 : -1;
    var profile = count >= 3 ? E.outExpo((fr - 0.12) / 0.1) * (1 - E.inOutCubic((fr - 0.68) / 0.2)) : 0;
    return { row: row, gap: gap, profile: profile, amount: sign * amplitude * e.amt * profile, alpha: cl(profile * e.amt) };
  }
  if (rows.length && amplitude >= 0.2) {
    var parent = V.local(c, node, 'Kerning tick');
    var tick = V.line(c, 'Kerning tick', [V.axisPoint(!!node.vertical, 0, node.size * 0.56),
      V.axisPoint(!!node.vertical, 0, node.size * 0.74)], c.sc.accent, Math.max(1, node.size * 0.02), 1, parent);
    V.animate(c, tick, function (e, frame) {
      var q = choice(frame);
      if (!q.row || !q.gap) return { alpha: 0 };
      var left = q.row.glyphs[q.gap - 1], right = q.row.glyphs[q.gap];
      var along = node.vertical ? (left.y + left.h / 2 + right.y - right.h / 2) / 2
        : (left.x + left.w / 2 + right.x - right.w / 2) / 2;
      return { 'position.x': node.vertical ? q.row.c : along, 'position.y': node.vertical ? -along : -q.row.c, alpha: q.alpha };
    });
  }
  return function (s, g, all, frame) {
    var q = choice(frame);
    if (!q.row) return;
    /* C.text and the sampler may hold different objects for the same glyph; match by stable indices. */
    var index = -1;
    for (var gi = 0; gi < q.row.glyphs.length; gi++) {
      if (q.row.glyphs[gi].i === g.i && q.row.glyphs[gi].li === g.li) { index = gi; break; }
    }
    if (index < 0) return;
    var delta = (index >= q.gap ? 0.5 : -0.5) * q.amount;
    if (node.vertical) s.dy += delta; else s.dx += delta;
  };
}, ['Gap selection uses the native deterministic hash, not AE\'s expression sine hash.']);

reg('hold', 'tzCounterRules', function (c) {
  var node = c.node, rows = V.spans(V.glyphs(c, node), !!node.vertical).slice(0, 4);
  var parent = V.local(c, node, 'Counter rules');
  var mk = Math.min(1.3, motionAmount(c) / 0.7), seed = Math.abs(node.seed || 0) % 7;
  rows.forEach(function (row, index) {
    [-1, 1].forEach(function (side) {
      var length = row.a1 - row.a0, segment = length * 0.3, cross = row.c + side * node.size * 0.64;
      var id = V.line(c, 'Counter rule ' + index + '/' + side,
        [V.axisPoint(!!node.vertical, row.a0, cross), V.axisPoint(!!node.vertical, row.a0 + segment, cross)],
        c.sc.accent, Math.max(1, node.size * 0.02), 1, parent);
      V.animate(c, id, function (e, frame) {
        var t = V.envelope(c, node, frame);
        var u = 0.5 - 0.5 * Math.cos(t.t * 1.4 * mk + seed);
        var offset = (length - segment) * (side < 0 ? u : 1 - u);
        var result = { alpha: Math.min(1, t.amt * mk * 1.5) };
        result[node.vertical ? 'position.y' : 'position.x'] = node.vertical ? -offset : offset;
        return result;
      });
    });
  });
  return function () {};
});
})(JZNative, JZRecipeTools, JZComponents, JZRecipeComponents);
