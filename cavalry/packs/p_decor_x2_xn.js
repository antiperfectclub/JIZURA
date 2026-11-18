/* JIZURA Cavalry Pack: x2decC (30 typographic / infographic / UI decor recipes from src/11p_x2_decC.js) */
(function (N, G, C, R, V, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, TAU = H.TAU, DEG = H.DEG;

function reg(key, build) {
  N.register('decor', key, {
    source: 'src/11p_x2_decC.js D(' + key + ')',
    scope: 'cut',
    build: build,
    differences: ['Native Cavalry editable shape/text geometry following src/11p_x2_decC.js.']
  });
}

function acc(c) { return H.accCol(c.sc, c.sc.bg, false); }
function acc2(c) { return H.accCol(c.sc, c.sc.bg, true); }
function sub(c) { return H.subCol(c.sc, c.sc.bg); }
function onC(c, fill) { return H.textOn(fill, c.sc.bg, c.sc); }
function FS(c) { return Math.max(12, 17 * H.decU(c)); }
function ein(t, d, delay, ease) { return (ease || E.outExpo)(cl((t - (delay || 0)) / (d || 0.4))); }
function pad2(n, k) { return String(Math.max(0, Math.floor(n))).padStart(k || 2, '0'); }
function chars(s) { return Array.from(String(s == null ? '' : s)); }
function glyphs(s) { return chars(s).filter(function (ch) { return ch.trim(); }); }
function clip(s, n) {
  var a = chars(String(s || '').replace(/\s+/g, ' ').trim());
  return a.length > n ? a.slice(0, Math.max(1, n - 1)).join('') + '...' : a.join('');
}
function cutText(c) {
  var src = c.cut.source || {}, n0 = c.cut.nodes && c.cut.nodes[0];
  return String(src.text || (n0 && n0.text) || 'lyric').replace(/\s+/g, ' ').trim();
}
function lineText(c) {
  var src = c.cut.source || {};
  return String(src.lineText || cutText(c)).replace(/\s+/g, ' ').trim();
}
function hasCJK(s) { return /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(String(s || '')); }
function noNo(c) { return !!(H.styleFx(c).hideNo); }
function noTime(c) { return !!(H.styleFx(c).hideTime); }
function tw(s, size, tr) { return Array.from(String(s || '')).length * size * (0.62 + (tr == null ? 0.06 : tr)); }
function fmtTime(sec) {
  var s = Math.max(0, sec || 0), m = Math.floor(s / 60), r = s - m * 60;
  return pad2(m) + ':' + pad2(Math.floor(r)) + '.' + pad2(Math.floor((r % 1) * 100));
}
function phaseOf(c, f) {
  var env = R.env(c, f), t = env.lt - 0.04, o = 1 - E.inCubic(env.pOut || 0);
  return { env: env, t: t, o: o, ltb: env.ltb, lt: env.lt, ok: t > 0 && o > 0.003 };
}
function spot(c, bb, w, h, P, gap) {
  return P && P.corner ? H.cornerSpot(c, bb, w, h, P, 0.8) : H.nearBB(c, bb, w, h, P, gap);
}
function band(c, bb, w, h, P, gap) {
  var W = c.comp.width, Hh = c.comp.height, m = H.decMG(c) * 0.8;
  var ord = P.low ? [true, false] : [false, true];
  for (var i = 0; i < ord.length; i++) {
    var y = ord[i] ? bb.y1 + gap : bb.y0 - gap - h;
    if (y >= m && y + h <= Hh - m && w <= W - 2 * m) {
      return { x: cl(bb.cx - w / 2, m, W - m - w), y: y, ok: true, below: ord[i] };
    }
  }
  return spot(c, bb, w, h, P, gap);
}

/* 1. xnPrompt */
reg('xnPrompt', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), fs = FS(c);
  var pre = ['$ say', '> print', '>>> sing', '# echo'][(H.p(P, 'v', 0) | 0) % 4];
  var body = '"' + clip(cutText(c), 14) + '"', wp = tw(pre, fs) + fs * 0.6, wb = tw(body, fs);
  var w = wp + wb + fs * 0.9, lh = fs * 1.55, h = lh * 3, sp = spot(c, bb, w, h, P, 22 * u), A = sp.ok ? 1 : 0.3;
  var y1 = sp.y + lh * 0.5, cp = chars(pre), cb = chars(body), nT = cp.length + cb.length, dT = Math.min(0.75, nT * 0.045);
  H.stepText(c, 'xnPrompt cmd', sp.x, y1, fs, { role: 'mono', align: 'left', color: acc(c) }, function (env) {
    var t = env.lt - 0.04; if (t <= 0) return '';
    var k = Math.max(1, Math.floor(nT * cl((t - 0.12) / dT) + 1e-6));
    return cp.slice(0, k).join('') || ' ';
  }, 6);
  H.stepText(c, 'xnPrompt body', sp.x + wp, y1, fs, { role: 'body', align: 'left', color: sc.fg }, function (env) {
    var t = env.lt - 0.04, k = Math.floor(nT * cl((t - 0.12) / dT) + 1e-6), kb = Math.max(0, k - cp.length);
    return kb > 0 ? cb.slice(0, kb).join('') : '';
  }, 6);
  var gn = glyphs(cutText(c)).length;
  var okTxt = noNo(c) ? '[ok]' : ('[ok] ' + gn + (gn === 1 ? ' glyph out' : ' glyphs out'));
  H.addText(c, 'xnPrompt ok', okTxt, sp.x, y1 + lh, fs * 0.92, { role: 'mono', align: 'left', color: sub(c) }, function (env) {
    var t = env.lt - 0.04, o = 1 - E.inCubic(env.pOut || 0);
    return { alpha: t > 0.12 + dT + 0.18 ? A * o * ein(t, 0.25, 0.12 + dT + 0.18) : 0 };
  });
  var curId = H.rect(c, 'xnPrompt cursor', sp.x + wp, y1 + lh * 2 - fs * 0.55, fs * 0.55, fs * 1.1, { fill: sc.fg, alpha: 0.85 });
  C.sample(c.graph, curId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
    var blink = Math.floor(q.lt * 2.6) % 2 === 0;
    return { alpha: blink ? A * 0.85 * q.o : 0 };
  });
  return { x: sp.x, y: sp.y };
});

/* 2. xnMicroPara */
reg('xnMicroPara', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var src = glyphs(lineText(c)).length ? lineText(c) : 'lyric', cj = hasCJK(src);
  var fs = FS(c) * 0.82, per = cj ? 12 : 24, nL = 3 + cl(H.p(P, 'n', 1) | 0, 1, 3), lh = fs * 1.6;
  var unit = chars(src + ' / '), lines = [];
  for (var i = 0; i < nL; i++) {
    var s = '';
    for (var j = 0; j < per; j++) s += unit[(i * per + j) % unit.length];
    lines.push(s.trim() || 'lyric');
  }
  var w = 0; lines.forEach(function (s) { w = Math.max(w, tw(s, fs, 0.04)); });
  var ind = fs * 1.5, W2 = w + ind, h = nL * lh, sp = spot(c, bb, W2, h, P, 24 * u), A = sp.ok ? 1 : 0.3, rt = !!P.right;
  var rx = rt ? sp.x + W2 : sp.x;
  var barId = H.line(c, 'xnMicroPara bar', [[rx, sp.y], [rx, sp.y + h]], P.accent ? acc(c) : sub(c), Math.max(1, 1.5 * u), 0.9 * A);
  C.sample(c.graph, barId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); return { alpha: q.ok ? 0.9 * A * q.o : 0, 'scale.y': q.ok ? Math.max(0.01, ein(q.t, 0.5)) : 0.01 };
  });
  H.addText(c, 'xnMicroPara mark', '\u00b6', rt ? sp.x + W2 - ind * 0.45 : sp.x + ind * 0.45, sp.y + lh * 0.5, fs * 1.15, {
    role: 'body', align: 'center', color: acc(c)
  }, function (env) {
    var q = phaseOf(c, Math.round(env.t * c.comp.fps)); return { alpha: q.ok ? A * q.o * ein(q.t, 0.3, 0.1) : 0 };
  });
  lines.forEach(function (ln, idx) {
    H.addText(c, 'xnMicroPara ln ' + idx, ln, rt ? sp.x + w : sp.x + ind, sp.y + lh * (idx + 0.5), fs, {
      role: 'body', align: rt ? 'right' : 'left', color: idx === 0 ? sc.fg : sub(c)
    }, function (env) {
      var q = phaseOf(c, Math.round(env.t * c.comp.fps));
      return { alpha: q.ok ? A * q.o * ein(q.t, 0.4, 0.08 + idx * 0.07, E.outCubic) * (idx === 0 ? 0.95 : 0.6) : 0 };
    });
  });
  return { lines: nL };
});

/* 3. xnFootnote */
reg('xnFootnote', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var m = H.decMG(c), fs = FS(c), mk = ['*', '\u2020', '\u203b', '\u2021'][(H.p(P, 'v', 0) | 0) % 4], ac = acc(c);
  var ms = fs * 1.7, mx = bb.x1 + ms * 0.55, my = bb.y0 + ms * 0.1;
  if (mx > W - m * 0.5) { mx = cl(bb.cx, m, W - m); my = bb.y0 - ms * 0.7; }
  H.addText(c, 'xnFootnote sup', mk, mx, my, ms, { role: 'body', align: 'center', color: ac }, function (env) {
    var q = phaseOf(c, Math.round(env.t * c.comp.fps));
    var e = q.ok ? ein(q.t, 0.35, 0.1, function (x) { return E.outBack(x, 1.8); }) : 0;
    return { 'scale.x': Math.max(0.01, e), 'scale.y': Math.max(0.01, e), alpha: q.ok ? q.o : 0 };
  });
  var lt2 = lineText(c), note = String((c.cut.source && c.cut.source.note) || lt2 || cutText(c));
  var txt = clip(note, hasCJK(note) ? 26 : 44), nw = tw(txt, fs * 0.9, 0.05) + fs * 1.4, h = fs * 2.3;
  var below = Hh - bb.y1 >= h + m + 16 * u || Hh - bb.y1 > bb.y0;
  var y0 = below ? Hh - m - h : m, x0 = P.right ? W - m - nw : m, A = H.hitBB(0, y0, W, y0 + h, bb, 4 * u) ? 0.3 : 1;
  var lineId = H.line(c, 'xnFootnote rule', [[x0, y0], [x0 + Math.min(nw, 150 * u), y0]], sub(c), Math.max(1, u), 0.8 * A);
  C.sample(c.graph, lineId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); return { alpha: q.ok ? 0.8 * A * q.o : 0, 'scale.x': q.ok ? Math.max(0.01, ein(q.t, 0.45, 0.25)) : 0.01 };
  });
  H.addText(c, 'xnFootnote mk', mk, x0, y0 + fs * 1.25, fs * 1.05, { role: 'body', align: 'left', color: ac }, function (env) {
    var q = phaseOf(c, Math.round(env.t * c.comp.fps)); return { alpha: q.ok ? A * q.o * ein(q.t, 0.45, 0.25) : 0 };
  });
  H.addText(c, 'xnFootnote body', txt, x0 + fs * 1.3, y0 + fs * 1.3, fs * 0.9, { role: 'body', align: 'left', color: sub(c) }, function (env) {
    var q = phaseOf(c, Math.round(env.t * c.comp.fps)); return { alpha: q.ok ? A * 0.85 * q.o * ein(q.t, 0.5, 0.35) : 0 };
  });
  return { below: below };
});

/* 4. xnDiff */
reg('xnDiff', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), fs = FS(c), lh = fs * 1.7, ac = acc(c);
  var g = chars(cutText(c)), neu = clip(cutText(c), 14);
  var old = g.length > 2 ? clip(g.slice(0, Math.max(1, g.length - 1 - ((H.p(P, 'v', 0) | 0) % 2))).join(''), 12) + '?' : '...';
  var ln = (c.cut.line | 0) + 1, gut = noNo(c) ? 0 : fs * 2.1, sg = fs * 1.2;
  var w = gut + sg + Math.max(tw(neu, fs), tw(old, fs)) + fs * 0.8, h = lh * 2 + fs * 1.3;
  var sp = spot(c, bb, w, h, P, 22 * u), A = sp.ok ? 1 : 0.3;
  H.addText(c, 'xnDiff hdr', '@@ lyric.txt @@', sp.x, sp.y + fs * 0.5, fs * 0.72, { role: 'mono', align: 'left', color: sub(c) }, function (env) {
    var q = phaseOf(c, Math.round(env.t * c.comp.fps)); return { alpha: q.ok ? A * 0.7 * q.o * ein(q.t, 0.3) : 0 };
  });
  var y1 = sp.y + fs * 1.3 + lh * 0.5, y2 = y1 + lh;
  if (!noNo(c)) {
    H.addText(c, 'xnDiff ln1', pad2(ln), sp.x, y1, fs * 0.8, { role: 'mono', align: 'left', color: sub(c) }, function (env) {
      var q = phaseOf(c, Math.round(env.t * c.comp.fps)); return { alpha: q.ok ? A * 0.6 * q.o * ein(q.t, 0.35, 0.08) : 0 };
    });
    H.addText(c, 'xnDiff ln2', pad2(ln + 1), sp.x, y2, fs * 0.8, { role: 'mono', align: 'left', color: sub(c) }, function (env) {
      var q = phaseOf(c, Math.round(env.t * c.comp.fps)); return { alpha: q.ok ? A * 0.6 * q.o * ein(q.t, 0.4, 0.32) : 0 };
    });
  }
  H.addText(c, 'xnDiff minus', '-', sp.x + gut, y1, fs, { role: 'mono', align: 'left', color: sub(c) }, function (env) {
    var q = phaseOf(c, Math.round(env.t * c.comp.fps)); return { alpha: q.ok ? A * q.o * ein(q.t, 0.35, 0.08) : 0 };
  });
  H.addText(c, 'xnDiff old', old, sp.x + gut + sg, y1, fs, { role: 'body', align: 'left', color: sub(c) }, function (env) {
    var q = phaseOf(c, Math.round(env.t * c.comp.fps)); return { alpha: q.ok ? A * 0.75 * q.o * ein(q.t, 0.35, 0.08) : 0 };
  });
  var ow = tw(old, fs);
  var strikeId = H.line(c, 'xnDiff strike', [[sp.x + gut + sg - 3 * u, y1], [sp.x + gut + sg + ow + 3 * u, y1]], sub(c), Math.max(1, 1.4 * u), A);
  C.sample(c.graph, strikeId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); return { alpha: q.ok ? A * q.o : 0, 'scale.x': q.ok ? Math.max(0.01, ein(q.t, 0.3, 0.45, E.inOutCubic)) : 0.01 };
  });
  var boxId = H.rect(c, 'xnDiff bg', sp.x + gut - fs * 0.3, y2 - lh * 0.46, w - gut + fs * 0.3, lh * 0.92, { fill: ac, alpha: 0.16 * A });
  C.sample(c.graph, boxId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); return { alpha: q.ok ? A * 0.16 * q.o * ein(q.t, 0.4, 0.32) : 0 };
  });
  H.addText(c, 'xnDiff plus', '+', sp.x + gut, y2, fs, { role: 'mono', align: 'left', color: ac }, function (env) {
    var q = phaseOf(c, Math.round(env.t * c.comp.fps)); return { alpha: q.ok ? A * q.o * ein(q.t, 0.4, 0.32) : 0 };
  });
  H.addText(c, 'xnDiff new', neu, sp.x + gut + sg, y2, fs, { role: 'body', align: 'left', color: sc.fg }, function (env) {
    var q = phaseOf(c, Math.round(env.t * c.comp.fps)); return { alpha: q.ok ? A * 0.95 * q.o * ein(q.t, 0.4, 0.4) : 0 };
  });
  return { x: sp.x, y: sp.y };
});

/* 5. xnSyllables */
function syllableTokens(txt) {
  var a = chars(txt), out = [];
  for (var i = 0; i < a.length && out.length < 10; i++) {
    var ch = a[i];
    if (!ch.trim() || /^[.,!?\u3001\u3002\uff01\uff1f\u30fb]$/.test(ch)) continue;
    if (/[A-Za-z]/.test(ch)) {
      var wd = ch;
      while (i + 1 < a.length && /[A-Za-z]/.test(a[i + 1]) && wd.length < 10) wd += a[++i];
      out.push([wd.toLowerCase(), true]);
    } else {
      out.push([ch, false]);
    }
  }
  return out;
}
reg('xnSyllables', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), toks = syllableTokens(cutText(c));
  if (!toks.length) toks = [['lyric', true]];
  var W = c.comp.width, m = H.decMG(c), fs = FS(c) * 1.05, gap, ws, tot;
  for (var it = 0; it < 4; it++) {
    gap = fs * 1.1; ws = toks.map(function (tk) { return tw(tk[0], fs, 0.04); });
    tot = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (toks.length - 1);
    if (tot <= W - m * 2.4) break;
    fs *= 0.8;
  }
  var h = fs * 2.2, sp = band(c, bb, tot, h, P, 20 * u + bb.h * 0.06), A = sp.ok ? 1 : 0.3, y = sp.y + h * 0.42, x = sp.x;
  toks.forEach(function (tk, i) {
    H.addText(c, 'xnSyl ' + i, tk[0], x + ws[i] / 2, y, fs, {
      role: tk[1] ? 'mono' : 'body', align: 'center', color: tk[1] ? sub(c) : sc.fg
    }, function (env) {
      var q = phaseOf(c, Math.round(env.t * c.comp.fps));
      return { alpha: q.ok ? A * q.o * ein(q.t, 0.3, 0.08 + i * 0.055, E.outCubic) : 0 };
    });
    if (i < toks.length - 1) H.circle(c, 'xnSyl dot ' + i, x + ws[i] + gap / 2, y, 1.8 * u, 1.8 * u, { fill: P.accent ? acc(c) : sub(c), alpha: 0.9 * A });
    x += ws[i] + gap;
  });
  var yb = sp.y + h * 0.92;
  H.poly(c, 'xnSyl bracket', [[sp.x, yb - 5 * u], [sp.x, yb], [sp.x + tot, yb], [sp.x + tot, yb - 5 * u]], false, { stroke: acc(c), width: Math.max(1, 1.2 * u), alpha: 0.8 * A });
  return { count: toks.length };
});

/* 6. xnGlyphStats */
reg('xnGlyphStats', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), g = glyphs(cutText(c));
  if (!g.length) return { skip: true };
  var cnt = [0, 0, 0, 0];
  g.forEach(function (ch) {
    if (/[\uac00-\ud7af]/.test(ch)) cnt[0]++;
    else if (/[\u4e00-\u9fff]/.test(ch)) cnt[1]++;
    else if (/[A-Za-z]/.test(ch)) cnt[2]++;
    else cnt[3]++;
  });
  var names = ['\ud55c\uae00', '\u6f22\u5b57', 'ABC', 'etc'], pal = [sc.fg, acc(c), acc2(c), sub(c)], ci = 0;
  var fs = FS(c) * 0.9, w = cl(bb.w * 0.6, 220 * u, 340 * u), barH = Math.max(6, 9 * u), h = fs * 1.5 + barH + fs * 1.9;
  var sp = spot(c, bb, w, h, P, 22 * u), A = sp.ok ? 1 : 0.3;
  H.addText(c, 'xnGlyphStats hdr', 'GLYPHS', sp.x, sp.y + fs * 0.5, fs * 0.8, { role: 'mono', align: 'left', color: sub(c) }, function (env) {
    var q = phaseOf(c, Math.round(env.t * c.comp.fps)); return { alpha: q.ok ? A * q.o * ein(q.t, 0.3) : 0 };
  });
  if (!noNo(c)) {
    H.addText(c, 'xnGlyphStats tot', pad2(g.length), sp.x + w, sp.y + fs * 0.5, fs, { role: 'mono', align: 'right', color: sc.fg }, function (env) {
      var q = phaseOf(c, Math.round(env.t * c.comp.fps)); return { alpha: q.ok ? A * q.o * ein(q.t, 0.4) : 0 };
    });
  }
  var by = sp.y + fs * 1.5, x = sp.x, lx = sp.x;
  H.rect(c, 'xnGlyphStats track', sp.x, by, w, barH, { fill: sub(c), alpha: A * 0.18 });
  for (var i = 0; i < 4; i++) {
    if (!cnt[i]) continue;
    (function (idx, xPos, lxPos, sw, col) {
      var bId = H.rect(c, 'xnGlyphStats seg ' + idx, xPos + 1, by, Math.max(2, sw - 2), barH, { fill: col, alpha: A });
      C.sample(c.graph, bId, c.cut.start, c.cut.end, function (f0) {
        var q = phaseOf(c, f0); return { alpha: q.ok ? A * q.o : 0, 'scale.x': q.ok ? Math.max(0.01, ein(q.t, 0.45, 0.15 + idx * 0.1, E.outCubic)) : 0.01 };
      });
      H.rect(c, 'xnGlyphStats sw ' + idx, lxPos, by + barH + fs * 0.75, fs * 0.55, fs * 0.55, { fill: col, alpha: A });
      var lab = noNo(c) ? names[idx] : (names[idx] + ' ' + cnt[idx]);
      H.addText(c, 'xnGlyphStats lb ' + idx, lab, lxPos + fs * 0.85, by + barH + fs * 1.03, fs * 0.82, { role: 'body', align: 'left', color: sub(c) }, function (env) {
        var q = phaseOf(c, Math.round(env.t * c.comp.fps)); return { alpha: q.ok ? A * 0.9 * q.o * ein(q.t, 0.45, 0.15 + idx * 0.1) : 0 };
      });
      lx += fs * 0.85 + tw(lab, fs * 0.82, 0.06) + fs * 0.9;
    })(i, x, lx, w * cnt[i] / g.length, pal[ci++ % 4]);
    x += w * cnt[i] / g.length;
  }
  return { total: g.length };
});

/* 7. xnBoxCoords */
reg('xnBoxCoords', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var m = H.decMG(c) * 0.5, fs = FS(c) * 0.8, pd = 12 * u, col = P.accent ? acc(c) : sc.fg, k = 6 * u;
  var all = [[bb.x0, bb.y0, -1, -1, 'TL'], [bb.x1, bb.y1, 1, 1, 'BR'], [bb.x1, bb.y0, 1, -1, 'TR'], [bb.x0, bb.y1, -1, 1, 'BL']];
  var list = P.big ? all : (H.p(P, 'v', 0) | 0) % 2 ? all.slice(2) : all.slice(0, 2);
  list.forEach(function (it, i) {
    var px = cl(it[0] + it[2] * pd, m, W - m), py = cl(it[1] + it[3] * pd, m, Hh - m);
    var cid = C.shape(c.graph, c.cut, c.cut.id + ' / xnBoxCoord ' + i, c.parent, H.segCmds(c, [[px - k, py, px + k, py], [px, py - k, px, py + k]]), { stroke: col, width: Math.max(1, 1.3 * u), alpha: 1 });
    C.sample(c.graph, cid, c.cut.start, c.cut.end, function (f0) {
      var q = phaseOf(c, f0); return { alpha: q.ok ? q.o * ein(q.t, 0.45, i * 0.08) : 0 };
    });
    var txt = noNo(c) ? it[4] : (it[4] + ' ' + pad2(it[0], 4) + ',' + pad2(it[1], 4)), wt = tw(txt, fs);
    var ty = py + it[3] * (k + fs * 0.9); if (ty < m + fs * 0.5 || ty > Hh - m - fs * 0.5) ty = py - it[3] * (k + fs * 0.9);
    var tx = it[2] < 0 ? cl(px - k, m, W - m - wt) : cl(px + k - wt, m, W - m - wt);
    if (!H.hitBB(tx, ty - fs * 0.6, tx + wt, ty + fs * 0.6, bb, 0)) {
      H.addText(c, 'xnBoxCoord txt ' + i, txt, tx, ty, fs, { role: 'mono', align: 'left', color: sub(c) }, function (env) {
        var q = phaseOf(c, Math.round(env.t * c.comp.fps)); return { alpha: q.ok ? 0.9 * q.o * ein(q.t, 0.45, i * 0.08) : 0 };
      });
    }
  });
  return { count: list.length };
});

/* 8. xnRemain */
reg('xnRemain', function (c) {
  if (noTime(c)) return { intentionalSkip: true };
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), fs = FS(c), dur = Math.max(0.2, c.cut.dur || 1);
  var w = 230 * u, h = fs * 3.6, sp = spot(c, bb, w, h, P, 22 * u), A = sp.ok ? 1 : 0.3;
  H.addText(c, 'xnRemain hdr', 'REMAIN', sp.x, sp.y + fs * 0.45, fs * 0.72, { role: 'mono', align: 'left', color: sub(c) }, function (env) {
    var q = phaseOf(c, Math.round(env.t * c.comp.fps)); return { alpha: q.ok ? A * 0.8 * q.o * ein(q.t, 0.45) : 0 };
  });
  H.stepText(c, 'xnRemain tm', sp.x + w, sp.y + fs * 1.6, fs * 1.45, { role: 'mono', align: 'right', color: sc.fg }, function (env) {
    return '-' + fmtTime(Math.max(0, dur - env.lt));
  }, 10);
  var y = sp.y + h - fs * 0.5;
  H.line(c, 'xnRemain track', [[sp.x, y], [sp.x + w, y]], sub(c), Math.max(1, u), 0.35 * A);
  var barId = C.shape(c.graph, c.cut, c.cut.id + ' / xnRemain fill', c.parent, [['M', 0, 0], ['L', -w, 0]], { stroke: acc(c), width: Math.max(2, 3 * u), alpha: A });
  c.graph.byId[barId].attrs.position = H.toScene(c, sp.x + w, y);
  C.sample(c.graph, barId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
    var fr = cl(Math.max(0, dur - q.lt) / dur) * ein(q.t, 0.45);
    return { 'scale.x': Math.max(0.01, fr), alpha: A * q.o };
  });
  return { x: sp.x, y: sp.y };
});

/* 9. xnAsciiGauge */
reg('xnAsciiGauge', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), fs = FS(c) * 1.05;
  var N = 12 + 4 * (cl(H.p(P, 'n', 1) | 0, 1, 3) - 1), cw = fs * 0.66, dur = Math.max(0.3, c.cut.dur || 1);
  var w = cw * (N + 2) + fs * 3.4, h = fs * 2.9, sp = band(c, bb, w, h, P, 22 * u), A = sp.ok ? 1 : 0.3, fillC = ['#', '=', '|', '\u25a0'][(H.p(P, 'v', 0) | 0) % 4];
  H.stepText(c, 'xnAsciiGauge st', sp.x + cw * 1.4, sp.y + fs * 0.6, fs * 0.8, { role: 'mono', align: 'left', color: sub(c) }, function (env) {
    var pr = cl((env.lt - 0.2) / Math.max(0.2, dur * 0.88 - 0.2));
    return (pr >= 1 ? 'v done' : '| rendering');
  }, 4);
  H.stepText(c, 'xnAsciiGauge bar', sp.x, sp.y + fs * 2.1, fs, { role: 'mono', align: 'left', color: acc(c) }, function (env) {
    var pr = cl((env.lt - 0.2) / Math.max(0.2, dur * 0.88 - 0.2)), k = Math.floor(pr * N + 1e-6);
    var s = '['; for (var i = 0; i < N; i++) s += i < k ? fillC : '-'; s += ']';
    return s + (noNo(c) ? '' : ' ' + pad2(pr * 100, 3) + '%');
  }, 10);
  return { width: N, alpha: A };
});

/* 10. xnBreadcrumb */
reg('xnBreadcrumb', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), fs = FS(c) * 0.95, nn = noNo(c);
  var items = [
    [['song', 'lyrics', 'home', 'track'][(H.p(P, 'v', 0) | 0) % 4], 'mono'],
    [nn ? 'verse' : ('line ' + pad2((c.cut.line | 0) + 1)), 'mono'],
    [nn ? 'cut' : ('cut ' + pad2((c.cut.index | 0) + 1)), 'mono'],
    [clip(cutText(c), 7), 'body']
  ];
  var gap = fs * 1.5, ws = items.map(function (it) { return tw(it[0], fs); }), tot = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (items.length - 1), h = fs * 1.6;
  var sp = band(c, bb, tot, h, P, 22 * u + bb.h * 0.05), A = sp.ok ? 1 : 0.3, y = sp.y + h / 2, x = sp.x;
  items.forEach(function (it, i) {
    var last = i === items.length - 1;
    H.addText(c, 'xnBreadcrumb ' + i, it[0], x, y, fs, { role: it[1], align: 'left', color: last ? sc.fg : sub(c) }, function (env) {
      var q = phaseOf(c, Math.round(env.t * c.comp.fps));
      return { alpha: q.ok ? A * q.o * ein(q.t, 0.35, i * 0.13) * (last ? 1 : 0.8) : 0 };
    });
    if (last) {
      var uline = H.line(c, 'xnBreadcrumb under', [[x, y + fs * 0.75], [x + ws[i], y + fs * 0.75]], acc(c), Math.max(1.5, 2 * u), A);
      C.sample(c.graph, uline, c.cut.start, c.cut.end, function (f0) {
        var q = phaseOf(c, f0); return { alpha: q.ok ? A * q.o : 0, 'scale.x': q.ok ? Math.max(0.01, ein(q.t, 0.4, 0.55)) : 0.01 };
      });
    } else {
      var cx = x + ws[i] + gap / 2, k = fs * 0.24;
      H.poly(c, 'xnBreadcrumb sep ' + i, [[cx - k * 0.6, y - k], [cx + k * 0.6, y], [cx - k * 0.6, y + k]], false, { stroke: acc(c), width: Math.max(1, 1.4 * u), alpha: A * 0.8 });
    }
    x += ws[i] + gap;
  });
  return { count: items.length };
});

/* 11. xnVersionTags */
reg('xnVersionTags', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), fs = FS(c) * 0.9, nn = noNo(c);
  var ln = (c.cut.line | 0) + 1, ix = (c.cut.index | 0) + 1, ac = acc(c), word = ['draft', 'final', 'beta', 'wip', 'stable', 'demo'][(H.p(P, 'v', 0) | 0) % 6];
  var tags = (nn ? ['lyric.txt', word, 'text'] : ['v' + (1 + ln % 3) + '.' + pad2(ix), word, 'take ' + pad2(ln)]).slice(0, 1 + cl(H.p(P, 'n', 1) | 0, 1, 3));
  var ph = fs * 1.9, px = fs * 0.8, gap = fs * 0.55, ws = tags.map(function (s) { return tw(s, fs) + px * 2; });
  var tot = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (tags.length - 1), sp = spot(c, bb, tot, ph, P, 20 * u), A = sp.ok ? 1 : 0.3, x = sp.x;
  tags.forEach(function (s, i) {
    var fill = i === (P.accent ? 0 : 1) % tags.length;
    var pid = H.rect(c, 'xnVersion pill ' + i, x, sp.y, ws[i], ph, {
      fill: fill ? ac : null, stroke: fill ? null : sub(c), width: fill ? 0 : Math.max(1, 1.2 * u), round: P.big ? 4 * u : ph / 2, alpha: A
    });
    C.sample(c.graph, pid, c.cut.start, c.cut.end, function (f0) {
      var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
      var e = ein(q.t, 0.4, 0.05 + i * 0.12, function (z) { return E.outBack(z, 1.4); });
      return { 'scale.x': Math.max(0.01, e), alpha: A * q.o * cl(e * 2) };
    });
    H.addText(c, 'xnVersion lbl ' + i, s, x + ws[i] / 2, sp.y + ph / 2, fs, {
      role: 'mono', align: 'center', color: fill ? onC(c, ac) : sc.fg
    }, function (env) {
      var q = phaseOf(c, Math.round(env.t * c.comp.fps)); return { alpha: q.ok ? A * q.o * ein(q.t, 0.25, 0.2 + i * 0.12) : 0 };
    });
    x += ws[i] + gap;
  });
  return { count: tags.length };
});

/* 12. xnTooltip */
reg('xnTooltip', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, m = H.decMG(c), sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var fs = FS(c) * 0.9, txt = clip(cutText(c), 16), w = tw(txt, fs) + fs * 1.6, h = fs * 2, tip = 9 * u, gap = 10 * u + bb.h * 0.04;
  var below = !!P.low; if (below ? bb.y1 + gap + tip + h > Hh - m : bb.y0 - gap - tip - h < m) below = !below;
  var A = (below ? bb.y1 + gap + tip + h <= Hh - m * 0.6 : bb.y0 - gap - tip - h >= m * 0.6) ? 1 : 0.3;
  var ax = cl(mix(bb.x0, bb.x1, P.right ? 0.72 : 0.28), m + 20 * u, W - m - 20 * u), ay = below ? bb.y1 + gap : bb.y0 - gap, s = below ? 1 : -1;
  var x0 = cl(ax - w / 2, m, W - m - w), rig = c.graph.add('null', c.cut.id + ' / xnTooltip rig', c.parent, c.cut.start, c.cut.end, { position: H.toScene(c, ax, ay) });
  C.shape(c.graph, c.cut, c.cut.id + ' / xnTooltip ptr', rig, [['M', 0, 0], ['L', -tip * 0.8, -s * (tip + 1)], ['L', tip * 0.8, -s * (tip + 1)], ['Z']], { fill: sc.fg, alpha: A });
  var boxY = below ? tip : -(tip + h);
  C.shape(c.graph, c.cut, c.cut.id + ' / xnTooltip box', rig, H.roundRectCmds(x0 + w / 2 - ax, -(boxY + h / 2), w, h, 5 * u), { fill: sc.fg, alpha: A });
  H.addText(c, 'xnTooltip txt', txt, W / 2 + x0 + w / 2 - ax, Hh / 2 + (below ? tip + h / 2 : -tip - h / 2), fs, {
    role: 'body', align: 'center', color: onC(c, sc.fg), parent: rig
  });
  C.sample(c.graph, rig, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok) return { 'scale.x': 0.01, 'scale.y': 0.01 };
    var e = ein(q.t, 0.35, 0.3, function (z) { return E.outBack(z, 1.7); }) * q.o;
    var bob = Math.sin(q.ltb * 2.2) * 2 * u * H.motionAmt(c);
    var sp = H.toScene(c, ax, ay + bob);
    return { 'position.x': sp[0], 'position.y': sp[1], 'scale.x': Math.max(0.01, e), 'scale.y': Math.max(0.01, e) };
  });
  return { rig: rig };
});

/* 13. xnSparkline */
reg('xnSparkline', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), seed = H.p(P, 'seed', c.cut.seed || 13);
  var fs = FS(c) * 0.85, w = 190 * u + 40 * u * cl(H.p(P, 'n', 1) | 0, 1, 3), gh = 46 * u, h = gh + fs * 1.6, n = 18;
  var sp = spot(c, bb, w + fs * 3.2, h, P, 22 * u), A = sp.ok ? 1 : 0.3, ac = acc(c);
  var vals = [], lo = 0, hi = 0;
  for (var i = 0; i < n; i++) {
    var v = 0.5 + 0.42 * R.noise1(i * 0.55, seed) + (i / n - 0.5) * 0.35 * (P.right ? 1 : -1) + R.rs(seed, i, 3) * 0.07;
    vals.push(v); if (v < vals[lo]) lo = i; if (v > vals[hi]) hi = i;
  }
  var mn = vals[lo], mx = vals[hi];
  function X(i) { return sp.x + w * i / (n - 1); }
  function Y(v) { return sp.y + fs * 1.4 + gh * (1 - (v - mn) / Math.max(0.001, mx - mn)); }
  H.addText(c, 'xnSparkline hdr', ['TREND', 'PULSE', 'MOOD', 'TEMPO'][(H.p(P, 'v', 0) | 0) % 4], sp.x, sp.y + fs * 0.5, fs * 0.82, { role: 'mono', align: 'left', color: sub(c) }, function (env) {
    var q = phaseOf(c, Math.round(env.t * c.comp.fps)); return { alpha: q.ok ? A * q.o * ein(q.t, 0.3) : 0 };
  });
  var pts = vals.map(function (v, idx) { return [X(idx), Y(v)]; });
  var lineId = H.poly(c, 'xnSparkline line', pts, false, { stroke: sc.fg, width: Math.max(1.4, 2 * u), alpha: A });
  C.sample(c.graph, lineId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); return { alpha: q.ok ? A * q.o * ein(q.t, 0.8, 0.1, E.inOutCubic) : 0 };
  });
  H.circle(c, 'xnSparkline hi', X(hi), Y(mx), 3.5 * u, 3.5 * u, { stroke: ac, width: Math.max(1, 1.2 * u), alpha: A });
  H.circle(c, 'xnSparkline head', X(n - 1), Y(vals[n - 1]), 4 * u, 4 * u, { fill: ac, alpha: A });
  if (!noNo(c)) {
    var curVal = 0.12 + 0.8 * cl(1 - (Y(vals[n - 1]) - sp.y - fs * 1.4) / gh);
    H.addText(c, 'xnSparkline val', (curVal * 100).toFixed(1), sp.x + w + fs * 0.5, Y(vals[n - 1]), fs, { role: 'mono', align: 'left', color: sc.fg });
  }
  return { points: n };
});

/* 14. xnVowels */
reg('xnVowels', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), g = glyphs(lineText(c).toLowerCase());
  if (!g.length) g = ['a', 'i', 'u', 'e', 'o'];
  var map = Object.create(null); g.forEach(function (ch) { map[ch] = (map[ch] || 0) + 1; });
  var rows = Object.keys(map).map(function (k) { return [k.toUpperCase(), map[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 3 + cl(H.p(P, 'n', 1) | 0, 1, 3));
  var mx = Math.max(1, rows[0][1]), fs = FS(c), rh = fs * 1.45, barW = 150 * u, w = fs * 1.6 + barW + fs * 1.8, h = rows.length * rh;
  var sp = spot(c, bb, w, h, P, 22 * u), A = sp.ok ? 1 : 0.3, x0 = sp.x + fs * 1.6;
  H.line(c, 'xnVowels axis', [[x0 - 4 * u, sp.y], [x0 - 4 * u, sp.y + h]], sub(c), Math.max(1, u), 0.7 * A);
  rows.forEach(function (row, i) {
    var y = sp.y + rh * (i + 0.5), bwd = Math.max(2 * u, barW * (row[1] / mx));
    H.addText(c, 'xnVowels ch ' + i, row[0], sp.x + fs * 0.6, y, fs, { role: 'body', align: 'center', color: sc.fg });
    var bid = H.rect(c, 'xnVowels bar ' + i, x0, y - rh * 0.26, bwd, rh * 0.52, { fill: i === 0 ? acc(c) : sub(c), alpha: A * (i === 0 ? 1 : 0.55) });
    C.sample(c.graph, bid, c.cut.start, c.cut.end, function (f0) {
      var q = phaseOf(c, f0); return { alpha: q.ok ? A * q.o * (i === 0 ? 1 : 0.55) : 0, 'scale.x': q.ok ? Math.max(0.01, ein(q.t, 0.5, 0.1 + i * 0.07)) : 0.01 };
    });
    if (!noNo(c)) H.addText(c, 'xnVowels ct ' + i, String(row[1]), x0 + bwd + fs * 0.4, y, fs * 0.85, { role: 'mono', align: 'left', color: sub(c) });
  });
  return { rows: rows.length };
});

/* 15. xnLegend */
reg('xnLegend', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), txt = cutText(c), g = glyphs(txt);
  if (!g.length) return { skip: true };
  var wds = txt.split(' ').filter(Boolean), labs = [];
  if (wds.length >= 2) {
    var k = Math.min(3, wds.length), per = Math.ceil(wds.length / k);
    for (var i = 0; i < wds.length; i += per) labs.push(wds.slice(i, i + per).join(' '));
  } else {
    var k2 = Math.min(3, g.length), per2 = Math.ceil(g.length / k2);
    for (var j = 0; j < g.length; j += per2) labs.push(g.slice(j, j + per2).join(''));
  }
  labs = labs.slice(0, 3).map(function (s) { return clip(s, 9); });
  var fs = FS(c) * 0.95, rh = fs * 1.7, sw = 34 * u, pd = P.big ? fs * 0.8 : 0;
  var maxW = 0; labs.forEach(function (s) { maxW = Math.max(maxW, tw(s, fs)); });
  var w = sw + fs * 0.7 + maxW + pd * 2, h = labs.length * rh + pd * 2;
  var sp = spot(c, bb, w, h, P, 22 * u), A = sp.ok ? 1 : 0.3, cols = [sc.fg, acc(c), acc2(c)];
  if (P.big) H.rect(c, 'xnLegend box', sp.x, sp.y, w, h, { stroke: sub(c), width: Math.max(1, u), round: 3 * u, alpha: A * 0.6 });
  labs.forEach(function (s, idx) {
    var y = sp.y + pd + rh * (idx + 0.5), x = sp.x + pd, kind = (idx + (H.p(P, 'v', 0) | 0)) % 3;
    if (kind === 1) C.shape(c.graph, c.cut, c.cut.id + ' / xnLegend dash ' + idx, c.parent, H.segCmds(c, [[x, y, x + 12 * u, y], [x + 18 * u, y, x + sw, y]]), { stroke: cols[idx], width: Math.max(2, 2.6 * u), alpha: A });
    else H.line(c, 'xnLegend line ' + idx, [[x, y], [x + sw, y]], cols[idx], Math.max(1.2, (kind === 2 ? 1.2 : 2.6) * u), A);
    if (kind === 2) H.circle(c, 'xnLegend dot ' + idx, x + sw * 0.5, y, 4.5 * u, 4.5 * u, { fill: cols[idx], alpha: A });
    H.addText(c, 'xnLegend lbl ' + idx, s, x + sw + fs * 0.7, y, fs, { role: 'body', align: 'left', color: sub(c) }, function (env) {
      var q = phaseOf(c, Math.round(env.t * c.comp.fps)); return { alpha: q.ok ? A * 0.9 * q.o * ein(q.t, 0.45, 0.08 + idx * 0.12) : 0 };
    });
  });
  return { rows: labs.length };
});

/* 16. xnAxes */
reg('xnAxes', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var m = H.decMG(c) * 0.5, fs = FS(c) * 0.78, pd = 18 * u + Math.min(bb.w, bb.h) * 0.1, col = P.accent ? acc(c) : sc.fg, lw = Math.max(1, 1.4 * u);
  var ox = Math.max(m, bb.x0 - pd), oy = Math.min(Hh - m - fs * 1.7, bb.y1 + pd);
  var xe = Math.min(W - m, bb.x1 + pd * 1.7), ye = Math.max(m, bb.y0 - pd * 1.7);
  if (oy < bb.y1 + 4 * u || ox > bb.x0 - 4 * u) return { skip: true };
  H.line(c, 'xnAxes x', [[ox, oy], [xe, oy]], col, lw, 1);
  H.line(c, 'xnAxes y', [[ox, oy], [ox, ye]], col, lw, 1);
  var ah = 6 * u;
  H.poly(c, 'xnAxes ax', [[xe - ah, oy - ah * 0.7], [xe, oy], [xe - ah, oy + ah * 0.7]], false, { stroke: col, width: lw, alpha: 1 });
  H.poly(c, 'xnAxes ay', [[ox - ah * 0.7, ye + ah], [ox, ye], [ox + ah * 0.7, ye + ah]], false, { stroke: col, width: lw, alpha: 1 });
  var n = Math.max(1, Math.min(glyphs(cutText(c)).length, 12, Math.floor(bb.w / (fs * 1.5)))), tk = [];
  for (var i = 0; i < n; i++) {
    var x = bb.x0 + bb.w * (i + 0.5) / n; tk.push([x, oy, x, oy + 6 * u]);
    if (!noNo(c) && (n <= 8 || i % 2 === 0)) H.addText(c, 'xnAxes n ' + i, String(i + 1), x, oy + 6 * u + fs * 0.8, fs, { role: 'mono', align: 'center', color: sub(c) });
  }
  for (var j = 0; j < 3; j++) { var y = mix(bb.y1, bb.y0, j / 2); tk.push([ox, y, ox - 6 * u, y]); }
  C.shape(c.graph, c.cut, c.cut.id + ' / xnAxes ticks', c.parent, H.segCmds(c, tk), { stroke: col, width: lw, alpha: 0.9 });
  var tx = ['time', 'words'][(H.p(P, 'v', 0) | 0) % 2], ty = ['feeling', 'voice'][(H.p(P, 'v', 0) | 0) % 2];
  if (xe - bb.x1 > 10 * u) H.addText(c, 'xnAxes tx', tx, xe, oy - fs * 0.9, fs, { role: 'body', align: 'right', color: sub(c) });
  if (bb.y0 - ye > fs * 1.7) H.addText(c, 'xnAxes ty', ty, ox + 9 * u, ye + fs * 0.6, fs, { role: 'body', align: 'left', color: sub(c) });
  return { ticks: n };
});

/* 17. xnLevelMeter */
reg('xnLevelMeter', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), s = H.p(P, 'seed', c.cut.seed || 17);
  var fs = FS(c) * 0.8, N = 14, sw = 12 * u, sg = 4 * u, shh = 12 * u, rg = 8 * u, lab = fs * 1.4;
  var w = lab + N * (sw + sg), h = shh * 2 + rg + fs * 1.6, sp = spot(c, bb, w, h, P, 22 * u), A = sp.ok ? 1 : 0.3, ac = acc(c), x0 = sp.x + lab;
  for (var ch = 0; ch < 2; ch++) {
    var y = sp.y + ch * (shh + rg);
    H.addText(c, 'xnMeter ch ' + ch, ch ? 'R' : 'L', sp.x, y + shh / 2, fs, { role: 'mono', align: 'left', color: sc.fg });
    for (var i = 0; i < N; i++) {
      (function (chIdx, segIdx, yPos) {
        var hotc = segIdx >= N * 0.75;
        var bid = H.rect(c, 'xnMeter seg ' + chIdx + '_' + segIdx, x0 + segIdx * (sw + sg), yPos, sw, shh, { fill: hotc ? ac : sc.fg, alpha: A });
        C.sample(c.graph, bid, c.cut.start, c.cut.end, function (f0) {
          var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
          var lvl = cl((0.52 + 0.36 * R.noise1(q.ltb * 3.1 + chIdx * 7.3, s + chIdx) + 0.1 * Math.sin(q.ltb * 9 + chIdx)) * ein(q.t, 0.45));
          return { alpha: A * q.o * (segIdx < Math.round(lvl * N) ? 1 : 0.2) };
        });
      })(ch, i, y);
    }
  }
  if (!noNo(c)) {
    [['-24', 0.2], ['-12', 0.5], ['-6', 0.75], ['0', 1]].forEach(function (pair, i) {
      H.addText(c, 'xnMeter db ' + i, pair[0], x0 + (N * (sw + sg) - sg) * pair[1], sp.y + shh * 2 + rg + fs * 0.95, fs * 0.85, {
        role: 'mono', align: pair[1] === 1 ? 'right' : 'center', color: sub(c)
      });
    });
  }
  return { segments: N * 2 };
});

/* 18. xnTimeline */
reg('xnTimeline', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), seed = H.p(P, 'seed', c.cut.seed || 18);
  var fs = FS(c) * 0.72, nT = 2 + (cl(H.p(P, 'n', 1) | 0, 1, 3) > 1 ? 1 : 0), th = 15 * u, tg = 6 * u, lab = fs * 2, w = 340 * u, ruler = 13 * u;
  var h = ruler + nT * (th + tg), sp = spot(c, bb, w + lab, h, P, 22 * u), A = sp.ok ? 1 : 0.3, x0 = sp.x + lab, ac = acc(c);
  var tk = []; for (var i = 0; i <= 30; i++) { var x = x0 + w * i / 30; tk.push([x, sp.y + ruler - 3 * u, x, sp.y + ruler - (i % 5 ? 6 : 10) * u]); }
  C.shape(c.graph, c.cut, c.cut.id + ' / xnTimeline ruler', c.parent, H.segCmds(c, tk), { stroke: sub(c), width: Math.max(1, u), alpha: A * 0.6 });
  var c0 = 0.3, c1 = 0.7;
  for (var k = 0; k < nT; k++) {
    var y = sp.y + ruler + k * (th + tg);
    H.addText(c, 'xnTimeline tr ' + k, ['V1', 'A1', 'A2'][k], sp.x, y + th / 2, fs, { role: 'mono', align: 'left', color: sub(c) });
    var xp = R.random(seed, k, 1) * 0.08, idx = 0;
    while (xp < 0.98 && idx < 6) {
      var len = Math.min(1 - xp, 0.14 + R.random(seed, k, idx, 2) * 0.26), cur = k === 0 && idx === 1;
      if (cur) { c0 = xp; c1 = xp + len; }
      H.rect(c, 'xnTimeline clip ' + k + '_' + idx, x0 + xp * w, y, Math.max(2, len * w - 3 * u), th, {
        fill: cur ? ac : (k ? sub(c) : sc.fg), round: 2.5 * u, alpha: A * (cur ? 0.95 : k ? 0.3 : 0.38)
      });
      xp += len + 0.012; idx++;
    }
  }
  var dur = Math.max(0.2, c.cut.dur || 1);
  var phLine = C.shape(c.graph, c.cut, c.cut.id + ' / xnTimeline playhead', c.parent, [['M', 0, 0], ['L', 0, -(h - tg - ruler + 2 * u)]], { stroke: sc.fg, width: Math.max(1.2, 1.6 * u), alpha: A });
  C.sample(c.graph, phLine, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
    var pr = cl(q.lt / dur), pt = H.toScene(c, x0 + w * mix(c0, c1, pr), sp.y + ruler - 2 * u);
    return { 'position.x': pt[0], 'position.y': pt[1], alpha: A * q.o };
  });
  return { tracks: nT };
});

/* 19. xnTrackList */
reg('xnTrackList', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), seed = H.p(P, 'seed', c.cut.seed || 19);
  var fs = FS(c) * 0.9, rows = 3 + (cl(H.p(P, 'n', 1) | 0, 1, 3) > 2 ? 1 : 0), rh = fs * 1.9, w = 290 * u, h = rows * rh, cur = 1;
  var sp = spot(c, bb, w, h, P, 22 * u), A = sp.ok ? 1 : 0.3, ac = acc(c), base = (c.cut.line | 0) + 1, nx = fs * 1.9;
  for (var i = 0; i < rows; i++) {
    var y = sp.y + rh * (i + 0.5), is = i === cur;
    if (i > 0) H.line(c, 'xnTrack sep ' + i, [[sp.x, sp.y + rh * i], [sp.x + w, sp.y + rh * i]], sub(c), Math.max(1, 0.8 * u), A * 0.3);
    if (is) {
      for (var k = 0; k < 3; k++) {
        (function (barIdx, yPos) {
          var bid = C.shape(c.graph, c.cut, c.cut.id + ' / xnTrack eq ' + barIdx, c.parent, [['M', 0, 0], ['L', 0, fs * 0.85]], { stroke: ac, width: Math.max(1.5, 3 * u), alpha: A });
          c.graph.byId[bid].attrs.position = H.toScene(c, sp.x + barIdx * 5 * u + 1.5 * u, yPos + fs * 0.45);
          C.sample(c.graph, bid, c.cut.start, c.cut.end, function (f0) {
            var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
            return { 'scale.y': 0.25 + 0.6 * Math.abs(Math.sin(q.ltb * (5 + barIdx * 1.7) + barIdx * 2)), alpha: A * q.o };
          });
        })(k, y);
      }
      H.addText(c, 'xnTrack cur', clip(lineText(c), hasCJK(lineText(c)) ? 11 : 20), sp.x + nx, y, fs, { role: 'body', align: 'left', color: sc.fg });
    } else {
      if (!noNo(c)) H.addText(c, 'xnTrack num ' + i, pad2(Math.max(1, base - cur + i)), sp.x, y, fs * 0.85, { role: 'mono', align: 'left', color: sub(c) });
      H.rect(c, 'xnTrack skel ' + i, sp.x + nx, y - fs * 0.22, w * (0.25 + 0.3 * R.random(seed, i, 5)), fs * 0.44, { fill: sub(c), round: fs * 0.22, alpha: A * 0.32 });
    }
    if (!noTime(c)) H.addText(c, 'xnTrack tm ' + i, (2 + (R.hash(seed, i, 7) % 3)) + ':' + pad2(R.hash(seed, i, 8) % 60), sp.x + w, y, fs * 0.82, { role: 'mono', align: 'right', color: sub(c) });
  }
  return { rows: rows };
});

/* 20. xnStars */
reg('xnStars', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), seed = H.p(P, 'seed', c.cut.seed || 20);
  var Rr = 13 * u + 3 * u * cl(H.p(P, 'n', 1) | 0, 1, 3), gap = Rr * 2.35, fs = FS(c), rating = 3.5 + (R.hash(seed, 3) % 4) * 0.5;
  var nn = noNo(c), w = gap * 4 + Rr * 2 + (nn ? 0 : fs * 2.4), h = Rr * 2.1, sp = spot(c, bb, w, h, P, 20 * u), A = sp.ok ? 1 : 0.3, ac = acc(c);
  for (var i = 0; i < 5; i++) {
    (function (idx) {
      var cx = sp.x + Rr + idx * gap, cy = sp.y + h / 2 + Rr * 0.06, filled = rating - idx >= 0.5;
      var pts = H.starPts(cx, cy, Rr, Rr * 0.42, 5, 0);
      var sid = H.poly(c, 'xnStar ' + idx, pts, true, { fill: filled ? ac : null, stroke: filled ? ac : sub(c), width: Math.max(1.2, 1.6 * u), alpha: A });
      C.sample(c.graph, sid, c.cut.start, c.cut.end, function (f0) {
        var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
        var e = ein(q.t, 0.35, idx * 0.06, function (z) { return E.outBack(z, 1.6); });
        return { 'scale.x': Math.max(0.01, e), 'scale.y': Math.max(0.01, e), alpha: A * q.o };
      });
    })(i);
  }
  if (!nn) H.addText(c, 'xnStars score', rating.toFixed(1), sp.x + w, sp.y + h / 2, fs * 1.15, { role: 'mono', align: 'right', color: sc.fg });
  return { rating: rating };
});

/* 21. xnBattery */
reg('xnBattery', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), seed = H.p(P, 'seed', c.cut.seed || 21);
  var fs = FS(c) * 0.9, hh = fs * 1.05, nn = noNo(c), nt = noTime(c);
  var sigW = 26 * u, batW = 34 * u, pcW = nn ? 0 : fs * 2.5, tmW = nt ? 0 : fs * 3.2, g = fs * 0.7;
  var w = sigW + g + tmW + (tmW ? g : 0) + pcW + batW + 4 * u, sp = spot(c, bb, w, hh, Object.assign({}, P, { corner: true }), 20 * u);
  var A = sp.ok ? 1 : 0.3, cy = sp.y + hh / 2, x = sp.x;
  for (var i = 0; i < 4; i++) {
    var bhh = hh * (0.3 + 0.23 * i);
    H.rect(c, 'xnBattery sig ' + i, x + i * 7 * u, sp.y + hh - bhh, 4.5 * u, bhh, { fill: sc.fg, alpha: A * 0.9 });
  }
  x += sigW + g;
  if (tmW) {
    var mm = R.hash(seed, 2) % 60, hr = 1 + (R.hash(seed, 1) % 12);
    H.addText(c, 'xnBattery tm', hr + ':' + pad2(mm), x, cy, fs, { role: 'mono', align: 'left', color: sc.fg });
    x += tmW + g;
  }
  if (!nn) {
    H.stepText(c, 'xnBattery pct', x + pcW - fs * 0.4, cy, fs * 0.9, { role: 'mono', align: 'right', color: sc.fg }, function (env) {
      var lvl = cl(1 - 0.85 * cl(env.lt / Math.max(0.3, c.cut.dur || 1)));
      return Math.round(lvl * 100) + '%';
    }, 6);
    x += pcW;
  }
  H.rect(c, 'xnBattery shell', x, sp.y + hh * 0.08, batW, hh * 0.84, { stroke: sc.fg, width: Math.max(1, 1.3 * u), round: 3 * u, alpha: A });
  H.rect(c, 'xnBattery tip', x + batW + 1.5 * u, cy - hh * 0.16, 2.5 * u, hh * 0.32, { fill: sc.fg, alpha: A });
  var fillId = H.rect(c, 'xnBattery fill', x + 3 * u, sp.y + hh * 0.08 + 3 * u, batW - 6 * u, hh * 0.84 - 6 * u, { fill: acc(c), round: 1.5 * u, alpha: A });
  C.sample(c.graph, fillId, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
    var lvl = cl(1 - 0.85 * cl(q.lt / Math.max(0.3, c.cut.dur || 1))) * ein(q.t, 0.5, 0.15);
    return { 'scale.x': Math.max(0.01, lvl), alpha: A * q.o };
  });
  return { x: sp.x };
});

/* 22. xnSliders */
var SL_LABS = [['TEMPO', 'PITCH', 'REVERB'], ['GAIN', 'PAN', 'ECHO'], ['WARMTH', 'BLUR', 'GRAIN']];
reg('xnSliders', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), seed = H.p(P, 'seed', c.cut.seed || 22);
  var fs = FS(c) * 0.85, n = Math.min(3, 1 + cl(H.p(P, 'n', 1) | 0, 1, 3)), labs = SL_LABS[(H.p(P, 'v', 0) | 0) % 3], rh = fs * 2.1, tr = 150 * u, nn = noNo(c);
  var lw0 = 0; labs.slice(0, n).forEach(function (s) { lw0 = Math.max(lw0, tw(s, fs, 0.1)); }); lw0 += fs * 0.9;
  var w = lw0 + tr + (nn ? 8 * u : fs * 2.2), h = n * rh, sp = spot(c, bb, w, h, P, 22 * u), A = sp.ok ? 1 : 0.3, ac = acc(c);
  for (var i = 0; i < n; i++) {
    (function (idx) {
      var y = sp.y + rh * (idx + 0.5), x0 = sp.x + lw0, tgt = 0.2 + 0.7 * R.random(seed, idx, 4);
      H.addText(c, 'xnSlider lb ' + idx, labs[idx], sp.x, y, fs, { role: 'body', align: 'left', color: sub(c) });
      H.line(c, 'xnSlider track ' + idx, [[x0, y], [x0 + tr, y]], sub(c), Math.max(2, 3 * u), A * 0.4);
      H.line(c, 'xnSlider fill ' + idx, [[x0, y], [x0 + tr * tgt, y]], ac, Math.max(2, 3 * u), A);
      var knob = H.circle(c, 'xnSlider knob ' + idx, x0 + tr * tgt, y, 7 * u, 7 * u, { fill: sc.fg, stroke: sc.bg, width: 2 * u, alpha: A });
      C.sample(c.graph, knob, c.cut.start, c.cut.end, function (f0) {
        var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
        var v = tgt * ein(q.t, 0.6, 0.3 + idx * 0.18, function (z) { return E.outBack(z, 1.3); }) + 0.03 * Math.sin(q.ltb * 1.7 + idx * 2) * H.motionAmt(c) * cl(q.t - 1);
        var pt = H.toScene(c, x0 + tr * cl(v), y);
        return { 'position.x': pt[0], 'position.y': pt[1], alpha: A * q.o };
      });
      if (!nn) H.addText(c, 'xnSlider val ' + idx, pad2(tgt * 100), sp.x + w, y, fs, { role: 'mono', align: 'right', color: sc.fg });
    })(i);
  }
  return { count: n };
});

/* 23. xnDropdown */
var DD_OPTS = [['Verse', 'Chorus', 'Bridge'], ['Soft', 'Normal', 'Loud'], ['Slow', 'Mid', 'Fast']];
reg('xnDropdown', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), seed = H.p(P, 'seed', c.cut.seed || 23);
  var fs = FS(c) * 0.92, opts = DD_OPTS[(H.p(P, 'v', 0) | 0) % 3], rh = fs * 1.9, sel = 1 + (R.hash(seed, 2) % 2);
  var mw = 0; opts.forEach(function (s) { mw = Math.max(mw, tw(s, fs)); });
  var w = mw + fs * 3.4, h = rh * 4 + 6 * u, sp = spot(c, bb, w, h, P, 22 * u), A = sp.ok ? 1 : 0.3, ac = acc(c);
  H.rect(c, 'xnDropdown box', sp.x, sp.y, w, rh, { stroke: ac, width: Math.max(1, 1.3 * u), round: 5 * u, alpha: A });
  H.addText(c, 'xnDropdown sel', opts[sel], sp.x + fs * 0.8, sp.y + rh / 2, fs, { role: 'body', align: 'left', color: sc.fg });
  var ly = sp.y + rh + 6 * u;
  var menuBg = H.rect(c, 'xnDropdown menu', sp.x, ly, w, rh * 3, { stroke: sub(c), width: Math.max(1, 1.3 * u), round: 5 * u, alpha: A });
  var hlId = H.rect(c, 'xnDropdown hl', sp.x + 3 * u, ly + 3 * u, w - 6 * u, rh - 6 * u, { fill: ac, round: 3 * u, alpha: A * 0.9 });
  var dur = Math.max(0.6, c.cut.dur || 1), tc = Math.min(1.45, dur * 0.62);
  [menuBg, hlId].forEach(function (id, idx) {
    C.sample(c.graph, id, c.cut.start, c.cut.end, function (f0) {
      var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
      var open = ein(q.t, 0.3, 0.3) * (1 - ein(q.t, 0.25, tc, E.inOutCubic));
      var out = { alpha: open > 0.02 ? A * q.o * (idx ? 0.9 : 1) : 0 };
      if (idx === 1) {
        var hl = mix(0, sel, ein(q.t, 0.45, 0.6, E.inOutCubic));
        out['position.y'] = H.toScene(c, sp.x + w / 2, ly + rh * hl + rh / 2)[1];
      }
      return out;
    });
  });
  return { selected: opts[sel] };
});

/* 24. xnPager */
reg('xnPager', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), fs = FS(c) * 0.95;
  var cs2 = fs * 1.9, g = fs * 0.35, n = 5, ln = c.cut.line | 0, base = Math.floor(ln / n) * n, act = ln % n, nn = noNo(c);
  var w = (n + 2) * cs2 + (n + 1) * g, sp = band(c, bb, w, cs2, P, 24 * u + bb.h * 0.05), A = sp.ok ? 1 : 0.3, ac = acc(c), lw = Math.max(1, 1.3 * u);
  function cx(i) { return sp.x + (i + 1) * (cs2 + g) + cs2 / 2; }
  var cy = sp.y + cs2 / 2;
  var activePill = H.rect(c, 'xnPager active', cx(act) - cs2 / 2, sp.y, cs2, cs2, { fill: ac, round: P.big ? cs2 / 2 : 4 * u, alpha: A });
  for (var i = 0; i < n; i++) {
    if (i !== act) H.rect(c, 'xnPager btn ' + i, cx(i) - cs2 / 2, sp.y, cs2, cs2, { stroke: sub(c), width: lw, round: P.big ? cs2 / 2 : 4 * u, alpha: A * 0.5 });
    if (nn) H.circle(c, 'xnPager d ' + i, cx(i), cy, 3 * u, 3 * u, { fill: i === act ? onC(c, ac) : sub(c), alpha: A });
    else H.addText(c, 'xnPager num ' + i, String(base + i + 1), cx(i), cy, fs, { role: 'mono', align: 'center', color: i === act ? onC(c, ac) : sub(c) });
  }
  C.sample(c.graph, activePill, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
    var from = act === 0 ? 0 : act - 1, hx = mix(cx(from), cx(act), ein(q.t, 0.4, 0.4, function (z) { return E.outBack(z, 1.5); }));
    return { 'position.x': H.toScene(c, hx, cy)[0], alpha: A * q.o * ein(q.t, 0.3, 0.15) };
  });
  return { page: act + 1 };
});

/* 25. xnSearch */
reg('xnSearch', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), seed = H.p(P, 'seed', c.cut.seed || 25);
  var fs = FS(c), qTxt = clip(cutText(c), 12), hgt = fs * 2.3, w = cl(tw(qTxt, fs) + fs * 4.2, 230 * u, 420 * u), h = hgt + fs * 1.7;
  var sp = spot(c, bb, w, h, P, 22 * u), A = sp.ok ? 1 : 0.3, lw = Math.max(1, 1.4 * u);
  H.rect(c, 'xnSearch pill', sp.x, sp.y, w, hgt, { stroke: sc.fg, width: lw, round: P.big ? 5 * u : hgt / 2, alpha: A });
  var mx = sp.x + fs * 1.3, my = sp.y + hgt / 2, mr = fs * 0.36;
  H.circle(c, 'xnSearch lens', mx, my - mr * 0.2, mr, mr, { stroke: sub(c), width: lw * 1.2, alpha: A });
  H.line(c, 'xnSearch handle', [[mx + mr * 0.7, my + mr * 0.5], [mx + mr * 1.35, my + mr * 1.15]], sub(c), lw * 1.4, A);
  var cs = chars(qTxt), dT = Math.min(0.7, cs.length * 0.07);
  H.stepText(c, 'xnSearch input', sp.x + fs * 2.4, my, fs, { role: 'body', align: 'left', color: sc.fg }, function (env) {
    var k = Math.max(1, Math.floor(cs.length * cl((env.lt - 0.34) / dT) + 1e-6));
    return cs.slice(0, k).join('') || ' ';
  }, 6);
  var nRes = 100 + R.hash(seed, 9) % 9000;
  H.addText(c, 'xnSearch hits', noNo(c) ? 'results' : (nRes + ' results'), sp.x + fs, sp.y + hgt + fs, fs * 0.8, { role: 'body', align: 'left', color: sub(c) }, function (env) {
    var q = phaseOf(c, Math.round(env.t * c.comp.fps));
    return { alpha: q.ok ? A * 0.85 * q.o * ein(q.t, 0.3, 0.3 + dT + 0.15) : 0 };
  });
  return { x: sp.x, y: sp.y };
});

/* 26. xnKeycaps */
reg('xnKeycaps', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), fs = FS(c) * 0.9;
  var ks = chars(cutText(c).toUpperCase()).filter(function (ch) { return /[A-Z0-9]/.test(ch); }).slice(0, 8);
  if (!ks.length) ks = ['L', 'Y', 'R', 'I', 'C'];
  var k = fs * 2, g = fs * 0.35, n = ks.length, ew = k * 1.8, w = n * (k + g) + ew, h = k + 5 * u;
  var sp = band(c, bb, w, h, P, 22 * u + bb.h * 0.05), A = sp.ok ? 1 : 0.3, ac = acc(c), lw = Math.max(1, 1.3 * u);
  for (var i = 0; i <= n; i++) {
    (function (idx) {
      var kw = idx === n ? ew : k, x = sp.x + idx * (k + g), y = sp.y;
      H.rect(c, 'xnKeycap base ' + idx, x, sp.y + 5 * u, kw, k, { stroke: sub(c), width: lw, round: 5 * u, alpha: A * 0.6 });
      var capId = H.rect(c, 'xnKeycap top ' + idx, x, y, kw, k, { fill: idx === n ? ac : sc.bg, stroke: idx === n ? ac : sc.fg, width: lw, round: 5 * u, alpha: A });
      H.addText(c, 'xnKeycap ch ' + idx, idx === n ? 'RET' : ks[idx], x + kw / 2, y + k / 2, idx === n ? fs * 0.72 : fs, {
        role: 'mono', align: 'center', color: idx === n ? onC(c, ac) : sc.fg
      });
      C.sample(c.graph, capId, c.cut.start, c.cut.end, function (f0) {
        var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
        var tp = 0.4 + idx * 0.13, dt = q.t - tp, pr = dt > 0 ? Math.exp(-dt * 9) : 0;
        var pt = H.toScene(c, x + kw / 2, y + k / 2 + pr * 4 * u);
        return { 'position.x': pt[0], 'position.y': pt[1], alpha: A * q.o * ein(q.t, 0.3, idx * 0.035) };
      });
    })(i);
  }
  return { keys: n + 1 };
});

/* 27. xnTyping */
reg('xnTyping', function (c) {
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), fs = FS(c) * 0.8;
  var Rr = 5 * u + 1.5 * u * cl(H.p(P, 'n', 1) | 0, 1, 3), bwid = Rr * 11, bht = Rr * 5.4, h = bht + fs * 1.7;
  var sp = spot(c, bb, bwid + Rr, h, P, 22 * u), A = sp.ok ? 1 : 0.3, rt = !!P.right;
  var x0 = sp.x + (rt ? 0 : Rr), fillC = P.accent ? acc(c) : sc.fg;
  H.rect(c, 'xnTyping bubble', x0, sp.y, bwid, bht, {
    fill: P.accent ? fillC : null, stroke: P.accent ? null : sub(c), width: P.accent ? 0 : Math.max(1, 1.2 * u), round: bht / 2, alpha: A * (P.accent ? 0.95 : 0.8)
  });
  for (var i = 0; i < 3; i++) {
    (function (idx) {
      var did = H.circle(c, 'xnTyping dot ' + idx, x0 + bwid / 2 + (idx - 1) * Rr * 2.6, sp.y + bht / 2, Rr * 0.9, Rr * 0.9, { fill: P.accent ? onC(c, fillC) : sc.fg, alpha: A });
      C.sample(c.graph, did, c.cut.start, c.cut.end, function (f0) {
        var q = phaseOf(c, f0); if (!q.ok) return { alpha: 0 };
        var ph = ((q.ltb * 1.5 - idx * 0.16) % 1 + 1) % 1, b = ph < 0.4 ? Math.sin(ph / 0.4 * Math.PI) : 0;
        var pt = H.toScene(c, x0 + bwid / 2 + (idx - 1) * Rr * 2.6, sp.y + bht / 2 - b * Rr * 1.3);
        return { 'position.x': pt[0], 'position.y': pt[1], alpha: A * q.o * (0.55 + 0.45 * b) };
      });
    })(i);
  }
  H.addText(c, 'xnTyping cap', hasCJK(cutText(c)) ? '\uc785\ub825 \uc911...' : 'typing...', rt ? x0 + bwid - Rr : x0 + Rr, sp.y + bht + fs, fs, {
    role: 'body', align: rt ? 'right' : 'left', color: sub(c)
  });
  return { x: sp.x, y: sp.y };
});

/* 28. xnCalendar */
var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
reg('xnCalendar', function (c) {
  if (noNo(c)) return { intentionalSkip: true };
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), seed = H.p(P, 'seed', c.cut.seed || 28);
  var fs = FS(c) * 0.72, cw = fs * 1.75, chh = fs * 1.5, mo = R.hash(seed, 1) % 12, off = R.hash(seed, 2) % 7;
  var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo], rowsN = Math.ceil((off + days) / 7);
  var w = cw * 7, h = fs * 1.9 + chh * (rowsN + 1), sp = spot(c, bb, w, h, P, 22 * u), A = sp.ok ? 1 : 0.3, ac = acc(c);
  var today = 1 + ((c.cut.line | 0) * 7 + (c.cut.index | 0) * 3 + R.hash(seed, 3)) % days;
  H.addText(c, 'xnCal month', MONTHS[mo], sp.x + cw * 0.15, sp.y + fs * 0.6, fs * 1.25, { role: 'mono', align: 'left', color: sc.fg });
  H.line(c, 'xnCal rule', [[sp.x, sp.y + fs * 1.55], [sp.x + w, sp.y + fs * 1.55]], sub(c), Math.max(1, u), 0.7 * A);
  var y0 = sp.y + fs * 1.9;
  'SMTWTFS'.split('').forEach(function (d, i) {
    H.addText(c, 'xnCal dow ' + i, d, sp.x + cw * (i + 0.5), y0 + chh * 0.5, fs * 0.85, { role: 'mono', align: 'center', color: i === 0 ? ac : sub(c) });
  });
  for (var d = 1; d <= days; d++) {
    var k = off + d - 1, col = k % 7, row = Math.floor(k / 7), x = sp.x + cw * (col + 0.5), y = y0 + chh * (row + 1.5), is = d === today;
    if (is) H.circle(c, 'xnCal today', x, y, chh * 0.62, chh * 0.62, { stroke: ac, width: Math.max(1.2, 1.6 * u), alpha: A });
    H.addText(c, 'xnCal d ' + d, String(d), x, y, fs, { role: 'mono', align: 'center', color: is ? sc.fg : sub(c) });
  }
  return { month: MONTHS[mo], day: today };
});

/* 29. xnClock */
reg('xnClock', function (c) {
  if (noTime(c)) return { intentionalSkip: true };
  var P = c.preset.params || {}, sc = c.sc, u = H.decU(c), bb = H.decBB(c), seed = H.p(P, 'seed', c.cut.seed || 29);
  var fs = FS(c) * 0.85, Rr = 38 * u + 9 * u * cl(H.p(P, 'n', 1) | 0, 1, 3), w = Rr * 2.1, h = Rr * 2.1 + fs * 1.7;
  var sp = spot(c, bb, w, h, P, 22 * u), A = sp.ok ? 1 : 0.3, cx = sp.x + w / 2, cy = sp.y + Rr * 1.05, ac = acc(c), lw = Math.max(1, 1.4 * u);
  H.circle(c, 'xnClock dial', cx, cy, Rr, Rr, { stroke: sc.fg, width: lw, alpha: A });
  var tk = [];
  for (var i = 0; i < 60; i++) {
    if (i % 5 && !P.big) continue;
    var a = -Math.PI / 2 + i / 60 * TAU, r0 = Rr * (i % 15 === 0 ? 0.8 : i % 5 === 0 ? 0.86 : 0.93);
    tk.push([cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * Rr * 0.96, cy + Math.sin(a) * Rr * 0.96]);
  }
  C.shape(c.graph, c.cut, c.cut.id + ' / xnClock ticks', c.parent, H.segCmds(c, tk), { stroke: sc.fg, width: lw, alpha: A * 0.9 });
  var hr = 1 + R.hash(seed, 1) % 12, mm = (R.hash(seed, 2) % 12) * 5;
  var scPt = H.toScene(c, cx, cy);
  var hHand = C.shape(c.graph, c.cut, c.cut.id + ' / xnClock h', c.parent, [['M', 0, 0], ['L', 0, Rr * 0.48]], { stroke: sc.fg, width: Math.max(2.4, 3.6 * u), alpha: A });
  var mHand = C.shape(c.graph, c.cut, c.cut.id + ' / xnClock m', c.parent, [['M', 0, 0], ['L', 0, Rr * 0.74]], { stroke: sc.fg, width: Math.max(1.6, 2.4 * u), alpha: A });
  var sHand = C.shape(c.graph, c.cut, c.cut.id + ' / xnClock s', c.parent, [['M', 0, -Rr * 0.16], ['L', 0, Rr * 0.84]], { stroke: ac, width: Math.max(1, 1.3 * u), alpha: A });
  [hHand, mHand, sHand].forEach(function (id) { c.graph.byId[id].attrs.position = scPt; });
  H.circle(c, 'xnClock center', cx, cy, 3.5 * u, 3.5 * u, { fill: ac, alpha: A });
  C.sample(c.graph, hHand, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); return { rotation: -(((hr % 12 + mm / 60) / 12) * 360 * ein(q.t, 0.9, 0.2)), alpha: q.ok ? A * q.o : 0 };
  });
  C.sample(c.graph, mHand, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0); return { rotation: -((mm / 60) * 360 * ein(q.t, 0.9, 0.2)), alpha: q.ok ? A * q.o : 0 };
  });
  C.sample(c.graph, sHand, c.cut.start, c.cut.end, function (f0) {
    var q = phaseOf(c, f0), s0 = Math.floor(q.ltb), fr = q.ltb - s0;
    var sec = s0 + E.outBack(cl(fr / 0.2), 2.2);
    return { rotation: -(sec / 60 * 360), alpha: q.ok ? A * q.o : 0 };
  });
  H.addText(c, 'xnClock digital', pad2(hr) + ':' + pad2(mm), cx, sp.y + Rr * 2.1 + fs * 0.95, fs, { role: 'mono', align: 'center', color: sub(c) });
  return { time: pad2(hr) + ':' + pad2(mm) };
});

/* 30. xnTicker */
reg('xnTicker', function (c) {
  var P = c.preset.params || {}, W = c.comp.width, Hh = c.comp.height, sc = c.sc, u = H.decU(c), bb = H.decBB(c);
  var fs = FS(c), bhh = fs * 2.4, src = clip(lineText(c) || 'lyric', 30);
  var top = !P.low; if ((top ? bb.y0 : Hh - bb.y1) < bhh + 14 * u) top = !top;
  var A = (top ? bb.y0 : Hh - bb.y1) < bhh + 4 * u ? 0.3 : 1, y0 = top ? 0 : Hh - bhh, cy = y0 + bhh / 2, ry = top ? y0 + bhh : y0;
  H.rect(c, 'xnTicker bg', 0, y0, W, bhh, { fill: sc.fg, alpha: A * 0.07 });
  H.line(c, 'xnTicker rule', [[0, ry], [W, ry]], P.accent ? acc(c) : sc.fg, Math.max(1.2, 1.6 * u), A * 0.9);
  var unit = src + '  \u25b2  ' + (noNo(c) ? '' : '+1.24  '), per = Math.max(160 * u, tw(unit, fs, 0.05)), dir = P.right ? 1 : -1;
  var txtId = H.addText(c, 'xnTicker tape', unit + unit + unit + unit, W / 2, cy, fs, { role: 'body', align: 'center', color: sc.fg }, function (env) {
    var q = phaseOf(c, Math.round(env.t * c.comp.fps)); if (!q.ok) return { alpha: 0 };
    var off = ((q.ltb * (50 + 60 * H.motionAmt(c)) * u) % per) * dir;
    return { 'position.x': off, alpha: A * 0.8 * q.o };
  });
  return { tape: txtId };
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZHelpers);
