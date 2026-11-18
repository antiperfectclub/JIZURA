/* X2 text treatments (39 recipes matching src/11p_x2_treat.js).
 * Built as editable Cavalry textShape clones, clipDeformers, shear/extrude layers, and local shapes.
 */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, DEG = H.DEG, TAU = H.TAU;
var ctr = H.contrast, isDark = H.dark, mixHex = H.mixHex, lum = H.lum;

function reg(key, fn, diffs) {
  N.register('treat', key, { source: 'src/11p_x2_treat.js', scope: 'glyph', build: fn, differences: diffs || [] });
}

/* ================= shared helpers ================= */
function firstOK(list, test, fb) {
  for (var i = 0; i < list.length; i++) if (list[i] && test(list[i])) return list[i];
  return fb;
}
function bestCol(list, against) {
  var b = list[0] || '#ffffff', bv = -1;
  for (var i = 0; i < list.length; i++) {
    var c = list[i]; if (!c) continue;
    var v = ctr(c, against);
    if (v > bv) { bv = v; b = c; }
  }
  return b;
}
function accentFor(sc, col, min) {
  min = min == null ? 1.6 : min;
  return firstOK([sc.accent, sc.accent2, sc.ghostA, sc.ghostB], function (c) {
    return ctr(c, col) >= min && ctr(c, sc.bg) >= 1.5;
  }, H.fitContrast(sc.accent || '#ff5577', col, min + 0.3));
}
function twoTone(sc, col) {
  return firstOK([sc.accent, sc.accent2, sc.ghostA, sc.ghostB], function (c) {
    return ctr(c, col) >= 1.5 && ctr(c, sc.bg) >= 2;
  }, mixHex(col, sc.bg || '#101010', 0.45));
}
function textOn(box, pref, sc) {
  if (ctr(pref, box) >= 3) return pref;
  return bestCol([sc.bg, sc.fg, sc.ink, '#111111', '#FFFFFF'], box);
}
function markCol(sc, col) {
  return firstOK([sc.accent, sc.accent2, col], function (c) { return ctr(c, sc.bg) >= 2; }, col);
}
function shadeCol(sc, col) {
  return isDark(sc.bg) ? mixHex(sc.bg, accentFor(sc, col, 1.5), 0.5) : mixHex(sc.bg, sc.fg, 0.32);
}
function onPlate(sc, col) { return ctr(col, sc.bg || '#101010') < 1.5; }
function isSp(ch) { return ch === ' ' || ch === '\u3000'; }
function isPunct(ch) { return /^[\u3001\u3002\uff0c\uff0e\uff01\uff1f.,!?\u30fb\u2026\u2025\u300c\u300d\u300e\u300f\uff08\uff09()\uff3b\uff3d\[\]\u3010\u3011\u30fc\u301c\uff5e:;\uff1a\uff1b\-"'\u2018\u2019\u201c\u201d]$/.test(ch); }
function isKanji(ch) { return /[\u4e00-\u9faf\u3400-\u4dbf\uf900-\ufaff\u3005]/.test(ch); }
function isKata(ch) { return /[\u30a0-\u30ff\u31f0-\u31ff]/.test(ch); }
function isLatin(ch) { return /[A-Za-z0-9]/.test(ch); }
function glyphN(t) { return Array.from(String(t || '')).filter(function (c) { return c.trim(); }).length; }

function behind(graph, layerId, targetId) {
  var node = graph.byId[layerId], target = graph.byId[targetId];
  var i = graph.layers.indexOf(node), j = graph.layers.indexOf(target);
  if (i >= 0 && j >= 0 && i !== j) {
    graph.layers.splice(i, 1);
    j = graph.layers.indexOf(target);
    graph.layers.splice(j, 0, node);
  }
}
function afterLayer(graph, layerId, targetId) {
  var node = graph.byId[layerId], target = graph.byId[targetId];
  var i = graph.layers.indexOf(node), j = graph.layers.indexOf(target);
  if (i >= 0 && j >= 0 && i !== j) {
    graph.layers.splice(i, 1);
    j = graph.layers.indexOf(target);
    graph.layers.splice(j + 1, 0, node);
  }
}
function valAt(layer, attr, f, fallback) {
  var keys = layer && layer.keys && layer.keys[attr];
  if (keys) {
    var fs = Object.keys(keys);
    if (fs.length) {
      if (Object.prototype.hasOwnProperty.call(keys, f)) return keys[f].value;
      var nums = fs.map(Number).sort(function (a, b) { return a - b; });
      if (f <= nums[0]) return keys[nums[0]].value;
      if (f >= nums[nums.length - 1]) return keys[nums[nums.length - 1]].value;
      for (var i = 0; i < nums.length - 1; i++) {
        if (nums[i] <= f && f <= nums[i + 1]) {
          var a = keys[nums[i]], b = keys[nums[i + 1]];
          if (a.type === 2 || typeof a.value !== 'number' || typeof b.value !== 'number') return a.value;
          return a.value + (b.value - a.value) * (f - nums[i]) / Math.max(1e-6, nums[i + 1] - nums[i]);
        }
      }
    }
  }
  if (layer && layer.attrs) {
    if (attr === 'position.x' && Array.isArray(layer.attrs.position)) return layer.attrs.position[0];
    if (attr === 'position.y' && Array.isArray(layer.attrs.position)) return layer.attrs.position[1];
    if (attr === 'scale.x' && Array.isArray(layer.attrs.scale)) return layer.attrs.scale[0];
    if (attr === 'scale.y' && Array.isArray(layer.attrs.scale)) return layer.attrs.scale[1];
    if (Object.prototype.hasOwnProperty.call(layer.attrs, attr)) return layer.attrs[attr];
  }
  return fallback;
}
function clearKeys(layer, attr) { if (layer && layer.keys && layer.keys[attr]) delete layer.keys[attr]; }
function setAttrColor(layer, col) { clearKeys(layer, 'material.materialColor'); layer.attrs['material.materialColor'] = col; }
function setAttrStroke(layer, col, width) {
  layer.attrs.fill = false; layer.attrs.stroke = true;
  clearKeys(layer, 'stroke.strokeColor');
  layer.attrs['stroke.strokeColor'] = col;
  layer.attrs['stroke.width'] = Math.max(0.5, width);
}
function shiftLayer(layer, dx, dy) {
  if (!dx && !dy) return;
  if (layer.keys['position.x'] || layer.keys['position.y']) {
    if (dx) {
      if (layer.keys['position.x']) V.changeTrack(layer, 'position.x', function (v) { return v + dx; });
      else layer.attrs.position = [(layer.attrs.position ? layer.attrs.position[0] : 0) + dx, layer.attrs.position ? layer.attrs.position[1] : 0];
    }
    if (dy) {
      if (layer.keys['position.y']) V.changeTrack(layer, 'position.y', function (v) { return v - dy; });
      else layer.attrs.position = [layer.attrs.position ? layer.attrs.position[0] : 0, (layer.attrs.position ? layer.attrs.position[1] : 0) - dy];
    }
  } else {
    var p = layer.attrs.position || [0, 0];
    layer.attrs.position = [p[0] + dx, p[1] - dy];
  }
}

function nodeGroups(c) {
  var out = [];
  (c.cut.nodes || []).forEach(function (node) {
    var gs = V.glyphs(c, node), prefix = node.id + ' / ', items = [];
    (c.texts || []).forEach(function (tid) {
      var lyr = c.graph.byId[tid];
      if (!lyr || lyr.type !== 'textShape' || lyr.name.indexOf(prefix) !== 0) return;
      var idx = parseInt(lyr.name.slice(prefix.length), 10);
      if (!isFinite(idx) || idx < 0 || idx >= gs.length) return;
      items.push({ tid: tid, src: lyr, g: gs[idx], idx: idx });
    });
    if (!items.length) return;
    items.sort(function (a, b) { return a.idx - b.idx; });
    out.push({ node: node, gs: gs, items: items, parent: items[0].src.parent, firstTid: items[0].tid, lastTid: items[items.length - 1].tid });
  });
  return out;
}
function itemBounds(ng) { return V.bounds(ng.gs); }
function itemSpans(ng) { return V.spans(ng.gs, !!ng.node.vertical); }
function itemBox(ng) {
  var b = itemBounds(ng);
  return { cx: b.cx, cy: b.cy, hw: b.w / 2, hh: b.h / 2 };
}
function cutProgress(c, ng, frame) {
  var start = c.cut.origin + (ng.node.delayFrames || 0);
  return {
    lt: (frame - start) / c.comp.fps,
    ltb: (frame - c.cut.origin) / c.comp.fps,
    inDur: c.cut.inFrames / c.comp.fps,
    outDur: c.cut.outFrames / c.comp.fps,
    dur: (c.cut.sourceEnd - c.cut.origin) / c.comp.fps
  };
}
function outK(c, frame) {
  var pout = cl((frame - (c.cut.sourceEnd - c.cut.outFrames)) / Math.max(1, c.cut.outFrames));
  return 1 - E.inCubic(pout);
}
function nodeCol(c, ng) { return (ng.node && ng.node.color) || c.sc.fg || '#ffffff'; }
function lineLike(c, ng) {
  var whole = glyphN((c.cut.source && c.cut.source.text) || c.cut.nodes.map(function (n) { return n.text; }).join(''));
  return glyphN(ng.node.text) >= 2 || whole <= 1;
}
function hasPieceMotion(c) {
  var P = c.cut.presets || {}, en = P.enter && P.enter.name, ex = P.exit && P.exit.name;
  var pieceEn = { shards: 1, pixelate: 1, shatter: 1, sliceUp: 1, tornado: 1 };
  var pieceEx = { shatter: 1, explode: 1, implode: 1, pixelOff: 1, sliceOff: 1, dissolve: 1 };
  return (en && pieceEn[en]) || (ex && pieceEx[ex]);
}
function pieceLagSec(c) {
  var P = c.cut.presets || {}, en = P.enter && P.enter.name;
  var pieceEn = { shards: 1, pixelate: 1, shatter: 1, sliceUp: 1, tornado: 1 };
  return (en && pieceEn[en]) ? (c.cut.inFrames / c.comp.fps) * 1.3 + 0.05 : 0;
}
function localCmds(pts, closed) {
  var out = pts.map(function (pt, i) { return [i ? 'L' : 'M', pt[0], -pt[1]]; });
  if (closed) out.push(['Z']);
  return out;
}
function uvPt(vert, u, v) { return vert ? [v, u] : [u, v]; }
function addLocalShape(c, ng, name, cmds, paint, pos, sampleFn) {
  var lyr = ng.items[0].src, range = { start: lyr.start, end: lyr.end };
  var p0 = Object.assign({}, paint), reqZero = p0.alpha != null && !(p0.alpha > 0);
  if (reqZero) p0.alpha = 1;
  var id = C.shape(c.graph, range, c.cut.id + ' / ' + ng.node.id + ' / ' + name, ng.parent, cmds, p0);
  if (pos) c.graph.byId[id].attrs.position = [pos[0], -pos[1]];
  if (sampleFn) C.sample(c.graph, id, lyr.start, lyr.end, sampleFn);
  else if (reqZero) c.graph.key(id, 'alpha', lyr.start, 0, 1);
  return id;
}
function addGlyphShape(c, item, name, cmds, paint, sampleFn, isBehind) {
  var src = item.src, range = { start: src.start, end: src.end };
  var p0 = Object.assign({}, paint);
  if (p0.alpha != null && !(p0.alpha > 0)) p0.alpha = 1;
  var id = C.shape(c.graph, range, src.name + ' / ' + name, src.parent, cmds, p0);
  if (isBehind) behind(c.graph, id, item.tid);
  else afterLayer(c.graph, id, item.tid);
  if (sampleFn) C.sample(c.graph, id, src.start, src.end, sampleFn);
  return id;
}
function localMultiClip(graph, targetId, polysOrFrames, difference, label, options) {
  var n = graph.byId[targetId];
  var profile = options && options.hostProfile && options.hostProfile.javaScriptDeformer || { layerType: 'javaScriptDeformer' };
  var method = difference ? 'difference' : 'intersect', isStatic = Array.isArray(polysOrFrames);
  var dataStr = JSON.stringify(polysOrFrames);
  var expr = isStatic ? [
    '(function(){var polys=', dataStr, ';var clip=new cavalry.Path();',
    'polys.forEach(function(q){if(!q||q.length<2)return;q.forEach(function(p,i){if(i)clip.lineTo(p[0],p[1]);else clip.moveTo(p[0],p[1]);});clip.close();});',
    'var d=def.highestDepthWithPath(),m=def.getMeshesAtDepth(d);m.forEach(function(ms){for(var i=0;i<ms.count();i++){var p=ms.getPathAtIndex(i);p.', method, '(clip);ms.setPathAtIndex(i,p);}});def.setMeshesAtDepth(d,m);})();'
  ].join('') : [
    '(function(){var F=', dataStr, ';var at=Math.max(0,Math.min(F.length-1,Math.floor(n0)-' + String(n.start) + '));var polys=F[at];if(!polys||!polys.length)return;',
    'var clip=new cavalry.Path();polys.forEach(function(q){if(!q||q.length<2)return;q.forEach(function(p,i){if(i)clip.lineTo(p[0],p[1]);else clip.moveTo(p[0],p[1]);});clip.close();});',
    'var d=def.highestDepthWithPath(),m=def.getMeshesAtDepth(d);m.forEach(function(ms){for(var i=0;i<ms.count();i++){var p=ms.getPathAtIndex(i);p.', method, '(clip);ms.setPathAtIndex(i,p);}});def.setMeshesAtDepth(d,m);})();'
  ].join('');
  var id = graph.add(profile.layerType, n.name + ' / ' + (label || 'Clip'), targetId, n.start, n.end,
    { expression: expr, 'array.0': n.start });
  graph.key(id, 'array.0', n.start, n.start, 1);
  if (n.end - n.start > 1) graph.key(id, 'array.0', n.end - 1, n.end - 1, 1);
  graph.connect(id, 'id', targetId, 'deformers');
  return id;
}
function clipSliceY(graph, targetId, g, yLoAE, yHiAE, label, options) {
  var hw = Math.max(g.w, g.h) * 1.15;
  var cy0 = -yHiAE * g.h, cy1 = -yLoAE * g.h;
  if (cy1 - cy0 < 0.05) cy1 = cy0 + 0.05;
  return localMultiClip(graph, targetId, [V.polygon(-hw, cy0, hw, cy1)], false, label, options);
}
function patternPolys(kind, g) {
  var w = Math.max(g.w, g.h * 0.65) * 1.15, h = Math.max(g.h, g.w * 0.65) * 1.15, polys = [];
  if (kind === 'dots') {
    var cell = Math.max(4, Math.min(w, h) / 4.2), rad = cell * 0.34;
    for (var y = -h * 0.65; y <= h * 0.65; y += cell) for (var x = -w * 0.65; x <= w * 0.65; x += cell) {
      polys.push([[x - rad, y], [x, y - rad], [x + rad, y], [x, y + rad]]);
    }
  } else if (kind === 'lines') {
    var step = Math.max(3.5, h / 5.5), bh = step * 0.44;
    for (var ly = -h * 0.65; ly <= h * 0.65; ly += step) polys.push(V.polygon(-w * 0.8, ly - bh / 2, w * 0.8, ly + bh / 2));
  } else if (kind === 'grid') {
    var gp = Math.max(4, Math.min(w, h) / 4.5), gw = Math.max(1.2, gp * 0.22);
    for (var gx = -w * 0.7; gx <= w * 0.7; gx += gp) polys.push(V.polygon(gx - gw / 2, -h * 0.75, gx + gw / 2, h * 0.75));
    for (var gy = -h * 0.7; gy <= h * 0.7; gy += gp) polys.push(V.polygon(-w * 0.75, gy - gw / 2, w * 0.75, gy + gw / 2));
  } else {
    var pitch = Math.max(4, Math.min(w, h) / 4.5), sw = pitch * 0.44, span = (w + h) * 0.9;
    function addBands(angDeg) {
      var a = angDeg * DEG, cs = Math.cos(a), sn = Math.sin(a);
      for (var p = -span; p <= span; p += pitch) {
        var dx = cs * p, dy = sn * p, tx = -sn * span, ty = cs * span, nx = cs * sw * 0.5, ny = sn * sw * 0.5;
        polys.push([[dx - tx - nx, dy - ty - ny], [dx + tx - nx, dy + ty - ny], [dx + tx + nx, dy + ty + ny], [dx - tx + nx, dy - ty + ny]]);
      }
    }
    addBands(45);
    if (kind === 'hatch') addBands(-45);
  }
  return polys.slice(0, 64);
}
function decompShear(k) {
  if (Math.abs(k) < 1e-9) return [0, 1, 1, 0];
  var v = 0.5 * Math.atan2(2 * k, -k * k);
  var a = Math.cos(v) + k * Math.sin(v), b = Math.sin(v), s = Math.hypot(a, b);
  return [Math.atan2(b, a) / DEG, s, 1 / s, -v / DEG];
}

/* ============================================================================
   FILLS
   ============================================================================ */

/* xoRampAcross — glyph-by-glyph color ramp from text color to accent */
reg('xoRampAcross', function (c) {
  var v = V.param(c, 'v', 'ramp'), rev = V.param(c, 'rev', false);
  var ngs = nodeGroups(c);
  if (!ngs.length) return;
  var whole = glyphN(ngs.map(function (ng) { return ng.node.text; }).join(''));
  ngs.forEach(function (ng, ni) {
    var col = nodeCol(c, ng);
    if (onPlate(c.sc, col)) return;
    var c2 = twoTone(c.sc, col), n = ng.gs.length, mi = ng.node.mi != null ? ng.node.mi : ni;
    if (n < 2 && whole < 2) return;
    ng.items.forEach(function (it) {
      var u = n >= 2 ? (it.g.n > 1 ? it.g.ci / (it.g.n - 1) : 0.5) : (mi / Math.max(1, whole - 1));
      if (rev) u = 1 - u;
      var f = v === 'mid' ? 1 - Math.abs(u * 2 - 1) : u;
      if (f > 0.01) setAttrColor(it.src, mixHex(col, c2, f));
    });
  });
});

/* xoBeltBand — belt of accent color with hairline bg gaps across glyph waist */
reg('xoBeltBand', function (c) {
  var at = V.param(c, 'at', 0.39), hBand = V.param(c, 'h', 0.23);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng), c2 = twoTone(c.sc, col);
    var a = at - 0.5, b = at + hBand - 0.5, g = onPlate(c.sc, col) ? 0 : 0.025;
    ng.items.forEach(function (it) {
      if (g > 0) {
        var gap = V.cloneLayer(c.graph, it.tid, 'Belt gap');
        setAttrColor(gap, c.sc.bg);
        afterLayer(c.graph, gap.id, it.tid);
        clipSliceY(c.graph, gap.id, it.g, a, b, 'Belt gap slice', c.options);
      }
      var belt = V.cloneLayer(c.graph, it.tid, 'Belt accent');
      setAttrColor(belt, c2);
      afterLayer(c.graph, belt.id, it.tid);
      clipSliceY(c.graph, belt.id, it.g, a + g, b - g, 'Belt inner slice', c.options);
    });
  });
});

/* xoFoldHalf — split vertically down the middle in shaded tone or accent */
reg('xoFoldHalf', function (c) {
  var v = V.param(c, 'v', 'tone'), at = V.param(c, 'at', 0);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng);
    var c2 = v === 'acc' ? twoTone(c.sc, col) : (lum(col) < 0.5 ? mixHex(col, '#FFFFFF', 0.42) : mixHex(col, '#000000', 0.36));
    if (ctr(c2, c.sc.bg) < 1.6 || ctr(c2, col) < 1.25) c2 = mixHex(col, c.sc.bg, 0.5);
    ng.items.forEach(function (it) {
      var back = V.cloneLayer(c.graph, it.tid, 'Fold back half');
      setAttrColor(back, c2);
      behind(c.graph, back.id, it.tid);
      var w = Math.max(it.g.w, it.g.h) * 1.15, h = Math.max(it.g.h, it.g.w) * 1.15;
      localMultiClip(c.graph, it.tid, [V.polygon(-w * 0.85, -h, at * it.g.w, h)], false, 'Fold left half', c.options);
    });
  });
});

/* xoDiagSplit — slanted color split sweeping across whole lyric via multiClip */
reg('xoDiagSplit', function (c) {
  var ang = V.param(c, 'ang', 32), at = V.param(c, 'at', 0);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng);
    if (onPlate(c.sc, col)) return;
    var c2 = twoTone(c.sc, col), B = itemBox(ng), Rrad = Math.hypot(B.hw, B.hh) + ng.node.size;
    var a = ang * DEG, nx = Math.cos(a), ny = Math.sin(a), tx = -ny, ty = nx, Lg = Rrad * 4;
    var spanAlong = ng.node.vertical ? B.hh : B.hw;
    ng.items.forEach(function (it) {
      var over = V.cloneLayer(c.graph, it.tid, 'Diag split color');
      setAttrColor(over, c2);
      afterLayer(c.graph, over.id, it.tid);
      var byF = Object.create(null);
      for (var f = it.src.start; f < it.src.end; f++) {
        var cp = cutProgress(c, ng, f), q = E.outCubic(cl((cp.lt - cp.inDur * 0.3) / 0.5)) * outK(c, f);
        if (q <= 0.01) { byF[f] = []; continue; }
        var off = Rrad * (1 - q) + at * spanAlong * 2;
        var px = B.cx + nx * off, py = B.cy + ny * off;
        var m = S.matrix(c.graph, ng.parent, f);
        var pts = [
          [px + tx * Lg, py + ty * Lg],
          [px - tx * Lg, py - ty * Lg],
          [px - tx * Lg + nx * Lg, py - ty * Lg + ny * Lg],
          [px + tx * Lg + nx * Lg, py + ty * Lg + ny * Lg]
        ].map(function (pt) { return S.point(m, [pt[0], -pt[1]]); });
        byF[f] = [pts];
      }
      H.multiClip(c.graph, over.id, byF, false, 'Diag split clip', c.options);
    });
  });
});

/* xoGraphFill — fine grid fill over pale tone + keyline */
reg('xoGraphFill', function (c) {
  var v = V.param(c, 'v', 'tone');
  nodeGroups(c).forEach(function (ng) {
    var col = nodeCol(c, ng), bgCol = v === 'duo' ? accentFor(c.sc, col, 1.6) : mixHex(col, c.sc.bg, 0.7);
    ng.items.forEach(function (it) {
      var sz = it.src.attrs.fontSize;
      var bgL = V.cloneLayer(c.graph, it.tid, 'Graph fill bg');
      setAttrColor(bgL, bgCol);
      behind(c.graph, bgL.id, it.tid);
      var rim = V.cloneLayer(c.graph, it.tid, 'Graph fill rim');
      setAttrStroke(rim, col, Math.max(1.3, sz * 0.022));
      afterLayer(c.graph, rim.id, it.tid);
      localMultiClip(c.graph, it.tid, patternPolys('grid', it.g), false, 'Graph grid clip', c.options);
    });
  });
});

/* xoFadeHem — glyphs dissolve smoothly toward top or bottom edge */
reg('xoFadeHem', function (c) {
  var up = V.param(c, 'up', false), k = V.param(c, 'k', 0.4), lo = V.param(c, 'lo', 0.1);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var bands = up
      ? [[-0.65, -0.3, lo], [-0.3, -0.05, mix(lo, 1, 0.4)], [-0.05, 0.15, mix(lo, 1, 0.75)], [0.15, 0.65, 1]]
      : [[-0.65, k - 0.5, 1], [k - 0.5, 0.08, mix(1, lo, 0.35)], [0.08, 0.28, mix(1, lo, 0.7)], [0.28, 0.65, lo]];
    ng.items.forEach(function (it) {
      var origA = it.src.attrs.alpha == null ? 1 : it.src.attrs.alpha;
      var slices = [bands[0]];
      for (var i = 1; i < bands.length; i++) {
        var b = bands[i];
        var cln = V.cloneLayer(c.graph, it.tid, 'Fade hem ' + i);
        if (cln.keys.alpha) V.changeTrack(cln, 'alpha', function (v) { return cl(v * b[2]); });
        else cln.attrs.alpha = cl(origA * b[2]);
        afterLayer(c.graph, cln.id, it.tid);
        clipSliceY(c.graph, cln.id, it.g, b[0], b[1], 'Hem slice ' + i, c.options);
      }
      if (it.src.keys.alpha) V.changeTrack(it.src, 'alpha', function (v) { return cl(v * slices[0][2]); });
      else it.src.attrs.alpha = cl(origA * slices[0][2]);
      clipSliceY(c.graph, it.tid, it.g, slices[0][0], slices[0][1], 'Hem slice 0', c.options);
    });
  });
});

/* xoHalfScreen — solid top half, patterned halftone/lines lower half */
reg('xoHalfScreen', function (c) {
  var at = V.param(c, 'at', 0.03), pat = V.param(c, 'pat', 'dots');
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng);
    ng.items.forEach(function (it) {
      var sz = it.src.attrs.fontSize;
      var lower = V.cloneLayer(c.graph, it.tid, 'HalfScreen lower');
      behind(c.graph, lower.id, it.tid);
      var rim = V.cloneLayer(c.graph, it.tid, 'HalfScreen rim');
      setAttrStroke(rim, col, Math.max(1.2, sz * 0.016));
      afterLayer(c.graph, rim.id, lower.id);
      clipSliceY(c.graph, it.tid, it.g, -0.8, at, 'HalfScreen top solid', c.options);
      clipSliceY(c.graph, rim.id, it.g, at, 0.8, 'HalfScreen bot rim', c.options);
      localMultiClip(c.graph, lower.id, patternPolys(pat, it.g).map(function (poly) {
        return poly;
      }).concat([]), false, 'HalfScreen dots', c.options);
      clipSliceY(c.graph, lower.id, it.g, at, 0.8, 'HalfScreen bot crop', c.options);
    });
  });
});

/* xoBorderBands — 5..7 alternating horizontal color bands */
reg('xoBorderBands', function (c) {
  var n = V.param(c, 'n', 5), first = V.param(c, 'first', true);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng), c2 = twoTone(c.sc, col), lo = -0.43, span = 0.86;
    ng.items.forEach(function (it) {
      setAttrColor(it.src, first ? col : c2);
      for (var k = 1; k < n; k++) {
        var bCol = ((k % 2 === 0) === !!first) ? col : c2;
        var y0 = lo + span * k / n, y1 = (k === n - 1) ? 0.7 : lo + span * (k + 1) / n;
        var cln = V.cloneLayer(c.graph, it.tid, 'Border band ' + k);
        setAttrColor(cln, bCol);
        afterLayer(c.graph, cln.id, it.tid);
        clipSliceY(c.graph, cln.id, it.g, y0, y1, 'Band ' + k, c.options);
      }
      clipSliceY(c.graph, it.tid, it.g, -0.7, lo + span / n, 'Band 0', c.options);
    });
  });
});

/* ============================================================================
   OUTLINES
   ============================================================================ */

/* xoContour — three concentric contour outlines */
reg('xoContour', function (c) {
  var uF = V.param(c, 'u', 0.018), cc = V.param(c, 'c', false);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng), outer = cc ? accentFor(c.sc, col, 1.4) : col;
    var small = ng.node.size < Math.min(c.comp.width, c.comp.height) * 0.085;
    ng.items.forEach(function (it) {
      var u = Math.max(1.3, it.src.attrs.fontSize * uF);
      setAttrStroke(it.src, col, u * 1.15);
      var rings = small ? [[5, outer], [3, c.sc.bg]] : [[9, outer], [7, c.sc.bg], [5, col], [3, c.sc.bg]];
      rings.forEach(function (rSpec, ri) {
        var cln = V.cloneLayer(c.graph, it.tid, 'Contour ' + ri);
        setAttrStroke(cln, rSpec[1], u * rSpec[0]);
        behind(c.graph, cln.id, it.tid);
      });
    });
  });
});

/* xoCutLine — solid glyphs with offset dashed coupon line */
reg('xoCutLine', function (c) {
  var df = V.param(c, 'd', 0.17), cc = V.param(c, 'c', 0);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng);
    if (onPlate(c.sc, col)) return;
    var rc = cc ? markCol(c.sc, col) : accentFor(c.sc, col, 1.3);
    ng.items.forEach(function (it) {
      var sz = it.src.attrs.fontSize, d = sz * df, lw = Math.max(1.6, sz * 0.022);
      var outer = V.cloneLayer(c.graph, it.tid, 'Cut line ring');
      setAttrStroke(outer, rc, d + lw * 2);
      behind(c.graph, outer.id, it.tid);
      var w = Math.max(it.g.w, sz) * 1.15, h = Math.max(it.g.h, sz) * 1.15, per = sz * 0.15, dash = sz * 0.085;
      var polys = [];
      for (var x = -(w + h); x < w + h; x += per) polys.push(V.polygon(x, -h, x + dash, h));
      localMultiClip(c.graph, outer.id, polys, false, 'Cut line dashes', c.options);
      var inner = V.cloneLayer(c.graph, it.tid, 'Cut line gap');
      setAttrStroke(inner, c.sc.bg, d);
      behind(c.graph, inner.id, it.tid);
    });
  });
});

/* xoAltHollow — alternating solid and hollow glyphs */
reg('xoAltHollow', function (c) {
  var v = V.param(c, 'v', 'alt'), first = V.param(c, 'first', true);
  nodeGroups(c).forEach(function (ng, ni) {
    var col = nodeCol(c, ng);
    var chars = ng.gs.map(function (g) { return g.ch; }).filter(function (ch) { return ch.trim(); });
    var isK = function (ch) { return isKanji(ch) || isKata(ch) || isLatin(ch); };
    var useKana = v === 'kana' && chars.some(isK) && chars.some(function (ch) { return !isK(ch) && !isPunct(ch); });
    var mi = ng.node.mi != null ? (ng.node.mi | 0) : ni, one = glyphN(ng.node.text) < 2;
    ng.items.forEach(function (it) {
      if (isPunct(it.g.ch)) return;
      var ix = one ? mi : (it.g.ci + it.g.li);
      var hollow = useKana ? !isK(it.g.ch) : ((ix + (first ? 0 : 1)) % 2 === 1);
      if (hollow) setAttrStroke(it.src, col, Math.max(1.3, it.src.attrs.fontSize * 0.024));
    });
  });
});

/* xoTwinOutline — two hollow outlines in two colors knocked apart */
reg('xoTwinOutline', function (c) {
  var df = V.param(c, 'd', 0.055), dir = V.param(c, 'dir', [1, 1]), k = V.param(c, 'k', 0.027);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng), c2 = accentFor(c.sc, col, 1.3), sz = ng.node.size, d = sz * df;
    ng.items.forEach(function (it) {
      setAttrStroke(it.src, col, Math.max(1.5, it.src.attrs.fontSize * k));
      var cln = V.cloneLayer(c.graph, it.tid, 'Twin outline');
      setAttrStroke(cln, c2, Math.max(1.5, it.src.attrs.fontSize * k));
      behind(c.graph, cln.id, it.tid);
      var gx = it.g.x + (it.g.vx || 0), gy = it.g.y + (it.g.vy || 0);
      C.sample(c.graph, cln.id, it.src.start, it.src.end, function (f) {
        var cp = cutProgress(c, ng, f), q = E.outCubic(cl((cp.lt - 0.02) / 0.4)) * outK(c, f);
        return {
          'position.x': valAt(it.src, 'position.x', f, gx) + dir[0] * d * q,
          'position.y': valAt(it.src, 'position.y', f, -gy) - dir[1] * d * q,
          alpha: valAt(it.src, 'alpha', f, 1)
        };
      });
    });
  });
});

/* xoBlobKnock — fat ink rim fuses glyphs into a blob while inner glyphs knock out in bg */
reg('xoBlobKnock', function (c) {
  var k = V.param(c, 'k', 0.3);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng);
    if (onPlate(c.sc, col)) return;
    var tc = textOn(col, c.sc.bg, c.sc), lag = pieceLagSec(c);
    ng.items.forEach(function (it) {
      var sz = it.src.attrs.fontSize;
      setAttrColor(it.src, tc);
      var blob = V.cloneLayer(c.graph, it.tid, 'Blob rim');
      setAttrStroke(blob, col, Math.max(4, sz * k));
      behind(c.graph, blob.id, it.tid);
      if (lag > 0) {
        C.sample(c.graph, blob.id, it.src.start, it.src.end, function (f) {
          var cp = cutProgress(c, ng, f), grow = E.outCubic(cl((cp.lt - lag) / 0.22));
          return { alpha: grow > 0.01 ? cl(valAt(it.src, 'alpha', f, 1) * grow) : 0 };
        });
      }
    });
  });
});

/* ============================================================================
   DEPTH
   ============================================================================ */

/* xoEmboss — highlight + dark shadow offset edges */
reg('xoEmboss', function (c) {
  var df = V.param(c, 'd', 0.033), flip = V.param(c, 'flip', false);
  nodeGroups(c).forEach(function (ng) {
    var col = nodeCol(c, ng);
    var hi = mixHex(col, '#FFFFFF', 0.7), lo = mixHex(col, '#000000', 0.62);
    if (ctr(hi, col) < 1.3) hi = accentFor(c.sc, col, 1.3);
    if (ctr(lo, col) < 1.3) lo = accentFor(c.sc, col, 1.3);
    if (ctr(lo, c.sc.bg) < 1.15) lo = mixHex(c.sc.bg, c.sc.fg, 0.35);
    if (ctr(hi, c.sc.bg) < 1.15) hi = mixHex(c.sc.bg, c.sc.fg, 0.3);
    var d = ng.node.size * df * (flip ? -1 : 1);
    ng.items.forEach(function (it) {
      var clLo = V.cloneLayer(c.graph, it.tid, 'Emboss low');
      setAttrColor(clLo, lo);
      shiftLayer(clLo, d, d);
      behind(c.graph, clLo.id, it.tid);
      var clHi = V.cloneLayer(c.graph, it.tid, 'Emboss high');
      setAttrColor(clHi, hi);
      shiftLayer(clHi, -d, -d);
      behind(c.graph, clHi.id, it.tid);
    });
  });
});

/* xoBandExtrude — three-band striped 3D extrusion */
reg('xoBandExtrude', function (c) {
  var df = V.param(c, 'd', 0.175), dir = V.param(c, 'dir', [1, 1]);
  nodeGroups(c).forEach(function (ng) {
    var col = nodeCol(c, ng), A = accentFor(c.sc, col, 1.6);
    var B = firstOK([c.sc.accent2, c.sc.ink, c.sc.ghostB, c.sc.fg, c.sc.sub], function (x) {
      return ctr(x, A) >= 1.4 && ctr(x, col) >= 1.3 && ctr(x, c.sc.bg) >= 1.3;
    }, mixHex(A, isDark(A) ? '#FFFFFF' : '#000000', 0.45));
    var totalL = ng.node.size * df, steps = ng.gs.length > 10 ? 6 : 9;
    ng.items.forEach(function (it) {
      for (var s = steps; s >= 1; s--) {
        var f = s / steps, band = s <= steps / 3 ? A : (s <= (2 * steps) / 3 ? B : A);
        var cln = V.cloneLayer(c.graph, it.tid, 'Band extrude ' + s);
        setAttrColor(cln, band);
        shiftLayer(cln, dir[0] * totalL * f, dir[1] * totalL * f);
        behind(c.graph, cln.id, it.tid);
      }
    });
  });
});

/* xoFloorShadow — slanted mirrored floor shadow anchored under line */
reg('xoFloorShadow', function (c) {
  var kf = V.param(c, 'k', 0.49), sk = V.param(c, 'sk', 0.72), aFrac = V.param(c, 'a', 0.8);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var sh = shadeCol(c.sc, nodeCol(c, ng)), b = itemBounds(ng), s = ng.node.size;
    var yb = b.y1 - s * 0.075;
    ng.items.forEach(function (it) {
      var cln = V.cloneLayer(c.graph, it.tid, 'Floor shadow');
      setAttrColor(cln, sh);
      behind(c.graph, cln.id, it.tid);
      C.sample(c.graph, cln.id, it.src.start, it.src.end, function (f) {
        var cp = cutProgress(c, ng, f), q = E.outCubic(cl((cp.lt - 0.04) / 0.45)) * outK(c, f);
        var k = Math.max(0.02, kf * q);
        var bx = valAt(it.src, 'position.x', f, it.g.x), byAE = -valAt(it.src, 'position.y', f, -it.g.y);
        var dyFromFloor = (yb - byAE) * k;
        var ryAE = yb + dyFromFloor;
        return {
          'position.x': bx + dyFromFloor * sk,
          'position.y': -ryAE,
          'scale.x': valAt(it.src, 'scale.x', f, 1),
          'scale.y': -valAt(it.src, 'scale.y', f, 1) * k,
          alpha: q > 0.01 ? cl(valAt(it.src, 'alpha', f, 1) * aFrac * 0.55 * q) : 0
        };
      });
    });
  });
});

/* xoGroundDots — oval contact shadow under each glyph resting on ground */
reg('xoGroundDots', function (c) {
  var wf = V.param(c, 'w', 0.44), hf = V.param(c, 'h', 0.058);
  nodeGroups(c).forEach(function (ng) {
    var sh = shadeCol(c.sc, nodeCol(c, ng)), vert = !!ng.node.vertical, s = ng.node.size;
    ng.items.forEach(function (it, idx) {
      if (isPunct(it.g.ch)) return;
      if (vert && idx + 1 < ng.items.length && ng.items[idx + 1].g.li === it.g.li) return;
      var rx = Math.max(1, Math.max(it.g.w, s * 0.5) * wf), ry = Math.max(1, s * hf);
      var gy0 = it.g.y + (it.g.vy || 0), gx0 = it.g.x + (it.g.vx || 0);
      addGlyphShape(c, it, 'Ground shadow', G.ellipse(0, 0, rx, ry), { fill: sh, alpha: 0.85 }, function (f) {
        var cp = cutProgress(c, ng, f), q = E.outCubic(cl((cp.lt - 0.02) / 0.3)) * outK(c, f);
        var gx = valAt(it.src, 'position.x', f, gx0), gyAE = -valAt(it.src, 'position.y', f, -gy0);
        var sc = Math.min(1, Math.abs(valAt(it.src, 'scale.x', f, 1)));
        var lift = cl(Math.max(0, gy0 - gyAE) / (s * 0.9));
        var fac = (1 - 0.55 * lift) * (0.5 + 0.5 * sc) * q;
        return {
          'position.x': gx,
          'position.y': -(gy0 + it.g.h * 0.5 + ry * 0.9),
          'scale.x': Math.max(0.002, fac),
          'scale.y': Math.max(0.002, fac),
          alpha: q > 0.01 ? cl(valAt(it.src, 'alpha', f, 1) * q * (0.85 - 0.45 * lift)) : 0
        };
      }, true);
    });
  });
});

/* xoHollowBlock — sign-painter hollow paper face + solid colored extrusion */
reg('xoHollowBlock', function (c) {
  var df = V.param(c, 'd', 0.11), dir = V.param(c, 'dir', [1, 1]), k = V.param(c, 'k', 0.03);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng);
    if (onPlate(c.sc, col)) return;
    var L = ng.node.size * df, steps = Math.max(4, Math.min(ng.gs.length > 10 ? 7 : 11, Math.round(L / 2.5)));
    ng.items.forEach(function (it) {
      var sz = it.src.attrs.fontSize;
      setAttrColor(it.src, c.sc.bg);
      it.src.attrs.fill = true; it.src.attrs.stroke = true;
      it.src.attrs['stroke.strokeColor'] = col;
      it.src.attrs['stroke.width'] = Math.max(1.5, sz * k);
      for (var s = steps; s >= 1; s--) {
        var f = s / steps, cln = V.cloneLayer(c.graph, it.tid, 'Hollow block ext ' + s);
        setAttrColor(cln, col);
        cln.attrs.fill = true; cln.attrs.stroke = false;
        shiftLayer(cln, dir[0] * L * f, dir[1] * L * f);
        behind(c.graph, cln.id, it.tid);
      }
    });
  });
});

/* xoBlowUp — pale scaled ghost behind lyric */
reg('xoBlowUp', function (c) {
  var kf = V.param(c, 'k', 1.32), aFrac = V.param(c, 'a', 0.12);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    if (ng.node.size > Math.min(c.comp.width, c.comp.height) * 0.5) return;
    var B = itemBox(ng);
    ng.items.forEach(function (it) {
      var cln = V.cloneLayer(c.graph, it.tid, 'BlowUp ghost');
      behind(c.graph, cln.id, it.tid);
      var gx = it.g.x + (it.g.vx || 0), gy = it.g.y + (it.g.vy || 0);
      C.sample(c.graph, cln.id, it.src.start, it.src.end, function (f) {
        var cp = cutProgress(c, ng, f), q = E.outCubic(cl(cp.lt / 0.7)) * outK(c, f);
        var k = 1 + (kf - 1) * q * (1 + 0.04 * Math.sin(cp.ltb * 1.7));
        var bx = valAt(it.src, 'position.x', f, gx), byAE = -valAt(it.src, 'position.y', f, -gy);
        return {
          'position.x': B.cx + (bx - B.cx) * k,
          'position.y': -(B.cy + (byAE - B.cy) * k),
          'scale.x': valAt(it.src, 'scale.x', f, 1) * k,
          'scale.y': valAt(it.src, 'scale.y', f, 1) * k,
          alpha: q > 0.02 ? cl(valAt(it.src, 'alpha', f, 1) * aFrac * q) : 0
        };
      });
    });
  });
});

/* ============================================================================
   PLATES & MARKS
   ============================================================================ */

/* xoLeadBar — heading bar / triangle / square before the line */
reg('xoLeadBar', function (c) {
  var v = V.param(c, 'v', 'bar'), k = V.param(c, 'k', 0.125);
  nodeGroups(c).forEach(function (ng) {
    if (!lineLike(c, ng)) return;
    var spans = itemSpans(ng); if (!spans.length) return;
    var lc = markCol(c.sc, nodeCol(c, ng)), vert = !!ng.node.vertical, s = ng.node.size;
    var a0 = Infinity, c0 = Infinity, c1 = -Infinity;
    spans.forEach(function (L) { a0 = Math.min(a0, L.a0); c0 = Math.min(c0, L.c); c1 = Math.max(c1, L.c); });
    var p = a0 - s * 0.2, cm = (c0 + c1) / 2, half = ((c1 - c0) + s * 0.96) / 2, pts;
    if (v === 'tri') {
      var t = s * 0.4;
      pts = [uvPt(vert, p - t * 0.95, cm - t), uvPt(vert, p, cm), uvPt(vert, p - t * 0.95, cm + t)];
    } else if (v === 'sq') {
      var q = s * 0.17;
      pts = [uvPt(vert, p - q * 2, cm - q), uvPt(vert, p, cm - q), uvPt(vert, p, cm + q), uvPt(vert, p - q * 2, cm + q)];
    } else {
      var bw = s * k;
      pts = [uvPt(vert, p - bw, cm - half), uvPt(vert, p, cm - half), uvPt(vert, p, cm + half), uvPt(vert, p - bw, cm + half)];
    }
    var sid = addLocalShape(c, ng, 'Lead bar', localCmds(pts, true), { fill: lc, alpha: 1 }, null, function (f) {
      var cp = cutProgress(c, ng, f), q = E.outExpo(cl((cp.lt - 0.04) / 0.4)) * outK(c, f);
      return { alpha: q > 0.01 ? cl(q) : 0 };
    });
    behind(c.graph, sid, ng.firstTid);
  });
});

/* xoDimLine — dimension line under each line with ticks, dots, or arrows */
reg('xoDimLine', function (c) {
  var v = V.param(c, 'v', 'tick');
  nodeGroups(c).forEach(function (ng) {
    if (glyphN(ng.node.text) < 2) return;
    var lc = markCol(c.sc, nodeCol(c, ng)), vert = !!ng.node.vertical, s = ng.node.size, lw = Math.max(1.5, s * 0.022), t = s * 0.1;
    itemSpans(ng).forEach(function (L, li) {
      var mid = (L.a0 + L.a1) / 2, half = Math.max(2, (L.a1 - L.a0) / 2), off = L.c + s * 0.64;
      var linePts = [uvPt(vert, -half, 0), uvPt(vert, half, 0)];
      var lid = addLocalShape(c, ng, 'Dim line ' + li, localCmds(linePts, false), { stroke: lc, width: lw, alpha: 1 }, uvPt(vert, mid, off), function (f) {
        var cp = cutProgress(c, ng, f), q = E.outExpo(cl((cp.lt - 0.1 - li * 0.08) / 0.5)), ok = outK(c, f);
        var res = { alpha: q * ok > 0.01 ? cl(ok) : 0 };
        res[vert ? 'scale.y' : 'scale.x'] = Math.max(0.002, q);
        return res;
      });
      afterLayer(c.graph, lid, ng.lastTid);
      [-1, 1].forEach(function (d, ei) {
        var uEnd = mid + d * half;
        var cmds, paint;
        if (v === 'dot') {
          cmds = G.ellipse(0, 0, s * 0.045, s * 0.045); paint = { fill: lc, alpha: 1 };
        } else if (v === 'arrow') {
          var pts = [uvPt(vert, d * t * 0.5, 0), uvPt(vert, -d * t * 0.9, -t * 0.55), uvPt(vert, -d * t * 0.9, t * 0.55)];
          cmds = localCmds(pts, true); paint = { fill: lc, alpha: 1 };
        } else {
          cmds = localCmds([uvPt(vert, 0, -t), uvPt(vert, 0, t)], false); paint = { stroke: lc, width: lw, alpha: 1 };
        }
        var eid = addLocalShape(c, ng, 'Dim cap ' + li + '_' + ei, cmds, paint, uvPt(vert, uEnd, off), function (f) {
          var cp = cutProgress(c, ng, f), q = E.outExpo(cl((cp.lt - 0.1 - li * 0.08) / 0.5)), ok = outK(c, f);
          var pos = uvPt(vert, mid + d * half * q, off);
          return { 'position.x': pos[0], 'position.y': -pos[1], alpha: q * ok > 0.01 ? cl(ok) : 0 };
        });
        afterLayer(c.graph, eid, ng.lastTid);
      });
    });
  });
});

/* xoCropMarks — printer registration & crop marks at the 4 corners */
reg('xoCropMarks', function (c) {
  var lenF = V.param(c, 'len', 0.28), regMark = V.param(c, 'reg', true);
  nodeGroups(c).forEach(function (ng) {
    if (!lineLike(c, ng)) return;
    var lc = firstOK([c.sc.sub, c.sc.fg, nodeCol(c, ng)], function (x) { return ctr(x, c.sc.bg) >= 2.2; }, nodeCol(c, ng));
    var B = itemBox(ng), s = ng.node.size, pad = s * 0.12, gap = s * 0.1, len = s * lenF, lw = Math.max(1.2, s * 0.013);
    var x0 = B.cx - B.hw - pad, x1 = B.cx + B.hw + pad, y0 = B.cy - B.hh - pad, y1 = B.cy + B.hh + pad;
    var cmds = [];
    [[x0, y0, -1, -1], [x1, y0, 1, -1], [x1, y1, 1, 1], [x0, y1, -1, 1]].forEach(function (cr) {
      cmds.push(['M', cr[0] + cr[2] * gap, -cr[1]], ['L', cr[0] + cr[2] * (gap + len), -cr[1]]);
      cmds.push(['M', cr[0], -(cr[1] + cr[3] * gap)], ['L', cr[0], -(cr[1] + cr[3] * (gap + len))]);
    });
    if (regMark) {
      var r = Math.max(2, s * 0.085), vert = !!ng.node.vertical;
      var tx = vert ? B.cx : x0 - gap - len * 0.5, ty = vert ? y0 - gap - len * 0.5 : B.cy;
      cmds = cmds.concat(G.ellipse(tx, -ty, r, r));
      cmds.push(['M', tx - r * 1.7, -ty], ['L', tx + r * 1.7, -ty]);
      cmds.push(['M', tx, -(ty - r * 1.7)], ['L', tx, -(ty + r * 1.7)]);
    }
    var sid = addLocalShape(c, ng, 'Crop marks', cmds, { stroke: lc, width: lw, alpha: 1 }, null, function (f) {
      var cp = cutProgress(c, ng, f), q = E.outCubic(cl((cp.lt - cp.inDur * 0.4) / 0.4)), ok = outK(c, f);
      return { alpha: q * ok > 0.01 ? cl(q * ok) : 0 };
    });
    afterLayer(c.graph, sid, ng.lastTid);
  });
});

/* xoSeparators — spaced glyphs with dot / slash / hairline separators between them */
reg('xoSeparators', function (c) {
  var v = V.param(c, 'v', 'dot'), t = V.param(c, 't', 0.3);
  nodeGroups(c).forEach(function (ng) {
    if (ng.gs.length < 2) return;
    var vert = !!ng.node.vertical, lc = markCol(c.sc, nodeCol(c, ng)), s = ng.node.size, lw = Math.max(1.3, s * 0.02);
    var add = t * s, byLine = Object.create(null);
    ng.gs.forEach(function (g) { (byLine[g.li] = byLine[g.li] || []).push(g); });
    var shifts = Object.create(null);
    Object.keys(byLine).forEach(function (li) {
      var gs = byLine[li], n = gs.length;
      gs.forEach(function (g, k) {
        shifts[g.i] = ng.node.align === 'left' ? k * add : ng.node.align === 'right' && !vert ? (k - (n - 1)) * add : (k - (n - 1) / 2) * add;
      });
    });
    ng.items.forEach(function (it) {
      var d = shifts[it.idx] || 0;
      shiftLayer(it.src, vert ? 0 : d, vert ? d : 0);
    });
    for (var k = 0; k + 1 < ng.gs.length && k < 60; k++) {
      var A = ng.gs[k], B = ng.gs[k + 1];
      if (A.li !== B.li || B.ci !== A.ci + 1 || isPunct(A.ch) || isPunct(B.ch)) continue;
      var ax = A.x + (vert ? 0 : (shifts[A.i] || 0)), ay = A.y + (vert ? (shifts[A.i] || 0) : 0);
      var bx = B.x + (vert ? 0 : (shifts[B.i] || 0)), by = B.y + (vert ? (shifts[B.i] || 0) : 0);
      var mx = vert ? (ax + bx) / 2 : (ax + A.w / 2 + bx - B.w / 2) / 2;
      var my = vert ? (ay + A.h / 2 + by - B.h / 2) / 2 : (ay + by) / 2;
      var cmds, paint;
      if (v === 'dot') {
        cmds = G.ellipse(0, 0, Math.max(1.5, s * 0.05), Math.max(1.5, s * 0.05)); paint = { fill: lc, alpha: 1 };
      } else if (v === 'slash') {
        var h = s * 0.34, w = s * 0.09;
        cmds = localCmds(vert ? [[-h, w], [h, -w]] : [[-w, h], [w, -h]], false);
        paint = { stroke: lc, width: lw * 1.2, alpha: 1 };
      } else {
        var rh = s * 0.46;
        cmds = localCmds(vert ? [[-rh, 0], [rh, 0]] : [[0, -rh], [0, rh]], false);
        paint = { stroke: lc, width: lw * 0.8, alpha: 1 };
      }
      (function (kk) {
        var sid = addLocalShape(c, ng, 'Sep ' + kk, cmds, paint, [mx, my], function (f) {
          var cp = cutProgress(c, ng, f), q = E.outBack(cl((cp.lt - cp.inDur * 0.4 - kk * 0.03) / 0.24), 1.8) * outK(c, f);
          var sc = Math.max(0.002, q);
          return { 'scale.x': sc, 'scale.y': sc, alpha: q > 0.01 ? cl(q) : 0 };
        });
        afterLayer(c.graph, sid, ng.lastTid);
      })(k);
    }
  });
});

/* xoGlyphUnders — individual short underscore bar beneath every glyph */
reg('xoGlyphUnders', function (c) {
  var k = V.param(c, 'k', 0.052), wf = V.param(c, 'w', 0.79);
  nodeGroups(c).forEach(function (ng) {
    var lc = markCol(c.sc, nodeCol(c, ng)), vert = !!ng.node.vertical, s = ng.node.size, th = Math.max(2, s * k);
    ng.items.forEach(function (it) {
      if (isPunct(it.g.ch)) return;
      var len = Math.max(vert ? it.g.h : it.g.w, s * 0.45) * wf;
      var cmds = vert ? G.rect(s * 0.6 - th / 2, -len / 2, th, len) : G.rect(-len / 2, -(s * 0.6 + th / 2), len, th);
      addGlyphShape(c, it, 'Underscore ' + it.idx, cmds, { fill: lc, alpha: 1 }, function (f) {
        var cp = cutProgress(c, ng, f), q = E.outExpo(cl((cp.lt - 0.06 - it.idx * 0.035) / 0.3)) * outK(c, f);
        return {
          'position.x': valAt(it.src, 'position.x', f, it.g.x),
          'position.y': valAt(it.src, 'position.y', f, -it.g.y),
          'scale.x': vert ? 1 : Math.max(0.002, q),
          'scale.y': vert ? Math.max(0.002, q) : 1,
          alpha: q > 0.01 ? cl(valAt(it.src, 'alpha', f, 1)) : 0
        };
      }, false);
    });
  });
});

/* xoOffsetFrame — hairline frame + offset tint backing plate */
reg('xoOffsetFrame', function (c) {
  var df = V.param(c, 'd', 0.125), dir = V.param(c, 'dir', [1, 1]), cc = V.param(c, 'c', 0);
  nodeGroups(c).forEach(function (ng) {
    if (!lineLike(c, ng)) return;
    var col = nodeCol(c, ng);
    if (onPlate(c.sc, col)) return;
    var base = cc ? (c.sc.accent2 || c.sc.accent) : c.sc.accent;
    var tone = mixHex(c.sc.bg, base, 0.34);
    if (ctr(col, tone) < 3) tone = mixHex(c.sc.bg, base, 0.16);
    var lc = ctr(col, c.sc.bg) >= 2 ? col : markCol(c.sc, col);
    var B = itemBox(ng), s = ng.node.size, pad = s * 0.2, d = s * df, vert = !!ng.node.vertical;
    var x0 = B.cx - B.hw - pad, y0 = B.cy - B.hh - pad, w = Math.max(2, (B.hw + pad) * 2), h = Math.max(2, (B.hh + pad) * 2);
    var pid = addLocalShape(c, ng, 'Offset plate', G.rect(0, -h, w, h), { fill: tone, alpha: 1 }, [x0 + d * dir[0], y0 + d * dir[1]], function (f) {
      var cp = cutProgress(c, ng, f), q = E.outExpo(cl(cp.lt / 0.5)), ok = outK(c, f);
      var res = { alpha: q * ok > 0.01 ? cl(ok) : 0 };
      res[vert ? 'scale.y' : 'scale.x'] = Math.max(0.002, q);
      return res;
    });
    behind(c.graph, pid, ng.firstTid);
    var fid = addLocalShape(c, ng, 'Offset frame', G.rect(0, -h, w, h), { stroke: lc, width: Math.max(1.5, s * 0.022), alpha: 1 }, [x0, y0], function (f) {
      var cp = cutProgress(c, ng, f), q2 = E.inOutCubic(cl((cp.lt - 0.08) / 0.6)), ok = outK(c, f);
      return { alpha: q2 * ok > 0.01 ? cl(q2 * ok) : 0 };
    });
    behind(c.graph, fid, ng.firstTid);
  });
});

/* xoGlyphCorners — viewfinder ticks on opposite corners of every glyph */
reg('xoGlyphCorners', function (c) {
  var tf = V.param(c, 't', 0.17), flip = V.param(c, 'flip', false);
  nodeGroups(c).forEach(function (ng) {
    var lc = markCol(c.sc, nodeCol(c, ng)), vert = !!ng.node.vertical, s = ng.node.size, lw = Math.max(1.3, s * 0.02), t = s * tf, fl = flip ? -1 : 1;
    ng.items.forEach(function (it) {
      if (isPunct(it.g.ch)) return;
      var hw = (vert ? s : Math.max(it.g.w, s * 0.5)) * 0.5, hh = (vert ? Math.max(it.g.h, s * 0.5) : s) * 0.5;
      var cmds = localCmds([[-hw * fl, -hh + t], [-hw * fl, -hh], [(-hw + t) * fl, -hh]], false)
        .concat(localCmds([[hw * fl, hh - t], [hw * fl, hh], [(hw - t) * fl, hh]], false));
      addGlyphShape(c, it, 'Corners ' + it.idx, cmds, { stroke: lc, width: lw, alpha: 1 }, function (f) {
        var cp = cutProgress(c, ng, f), q = E.outCubic(cl((cp.lt - 0.05 - it.idx * 0.04) / 0.3)), ok = outK(c, f);
        var k = 1 + (1 - q) * 0.45;
        return {
          'position.x': valAt(it.src, 'position.x', f, it.g.x),
          'position.y': valAt(it.src, 'position.y', f, -it.g.y),
          'scale.x': k, 'scale.y': k,
          alpha: q * ok > 0.01 ? cl(valAt(it.src, 'alpha', f, 1) * q * ok) : 0
        };
      }, false);
    });
  });
});

/* xoRuler — ruler hairline with 5-tick cadence under each line */
reg('xoRuler', function (c) {
  var pf = V.param(c, 'p', 0.105), up = V.param(c, 'up', false);
  nodeGroups(c).forEach(function (ng) {
    if (glyphN(ng.node.text) < 2) return;
    var lc = markCol(c.sc, nodeCol(c, ng)), vert = !!ng.node.vertical, s = ng.node.size, sgn = up ? -1 : 1, lw = Math.max(1.2, s * 0.014);
    itemSpans(ng).forEach(function (L, li) {
      var pitch = Math.max(4, s * pf), u0 = L.a0 - s * 0.05, len = Math.max(4, L.a1 + s * 0.05 - u0), m = Math.min(80, Math.max(2, Math.floor(len / pitch)));
      var step = len / m, off = L.c + sgn * s * 0.62, cmds = [];
      var a = uvPt(vert, u0, off), b = uvPt(vert, u0 + len, off);
      cmds.push(['M', a[0], -a[1]], ['L', b[0], -b[1]]);
      for (var j = 0; j <= m; j++) {
        var u = u0 + step * j, h = s * (j % 5 === 0 ? 0.13 : 0.065);
        var p0 = uvPt(vert, u, off), p1 = uvPt(vert, u, off + sgn * h);
        cmds.push(['M', p0[0], -p0[1]], ['L', p1[0], -p1[1]]);
      }
      var sid = addLocalShape(c, ng, 'Ruler ' + li, cmds, { stroke: lc, width: lw, alpha: 1 }, null, function (f) {
        var cp = cutProgress(c, ng, f), q = E.outCubic(cl((cp.lt - 0.08 - li * 0.08) / 0.6)), ok = outK(c, f);
        return { alpha: q * ok > 0.01 ? cl(q * ok) : 0 };
      });
      afterLayer(c.graph, sid, ng.lastTid);
    });
  });
});

/* xoThread — extended line threading behind glyphs separated by bg stroke */
reg('xoThread', function (c) {
  var ext = V.param(c, 'ext', 0.55), k = V.param(c, 'k', 0.026), dots = V.param(c, 'dots', true);
  nodeGroups(c).forEach(function (ng) {
    if (!lineLike(c, ng)) return;
    var col = nodeCol(c, ng);
    if (onPlate(c.sc, col)) return;
    var lc = markCol(c.sc, col), vert = !!ng.node.vertical, s = ng.node.size, lw = Math.max(1.5, s * k);
    ng.items.forEach(function (it) {
      var sep = V.cloneLayer(c.graph, it.tid, 'Thread cutout');
      setAttrStroke(sep, c.sc.bg, Math.max(2, it.src.attrs.fontSize * 0.1));
      behind(c.graph, sep.id, it.tid);
    });
    itemSpans(ng).forEach(function (L, li) {
      var u0 = L.a0 - s * ext, u1 = L.a1 + s * ext, len = Math.max(2, u1 - u0), cPos = L.c + (vert ? 0 : s * 0.02), mid = (u0 + u1) / 2;
      var lyrId = addLocalShape(c, ng, 'Thread line ' + li, localCmds([uvPt(vert, -len / 2, 0), uvPt(vert, len / 2, 0)], false),
        { stroke: lc, width: lw, alpha: 1 }, uvPt(vert, mid, cPos), function (f) {
          var cp = cutProgress(c, ng, f), q = E.outExpo(cl((cp.lt - li * 0.08) / 0.55)), ok = outK(c, f);
          var res = { alpha: q * ok > 0.01 ? cl(ok) : 0 };
          res[vert ? 'scale.y' : 'scale.x'] = Math.max(0.002, q);
          return res;
        });
      behind(c.graph, lyrId, ng.firstTid);
      if (dots) {
        [-1, 1].forEach(function (sd, di) {
          var did = addLocalShape(c, ng, 'Thread dot ' + li + '_' + di, G.ellipse(0, 0, lw * 1.9, lw * 1.9),
            { fill: lc, alpha: 1 }, uvPt(vert, mid + sd * len / 2, cPos), function (f) {
              var cp = cutProgress(c, ng, f), q = E.outExpo(cl((cp.lt - li * 0.08) / 0.55)), ok = outK(c, f);
              var pt = uvPt(vert, mid + sd * len / 2 * q, cPos);
              return { 'position.x': pt[0], 'position.y': -pt[1], alpha: q * ok > 0.01 ? cl(ok) : 0 };
            });
          behind(c.graph, did, ng.firstTid);
        });
      }
    });
  });
});

/* xoSwoosh — tapered brush swoosh underline */
reg('xoSwoosh', function (c) {
  var k = V.param(c, 'k', 0.13), bow = V.param(c, 'bow', 0.075), rev = V.param(c, 'rev', false);
  nodeGroups(c).forEach(function (ng) {
    if (glyphN(ng.node.text) < 2) return;
    var lc = markCol(c.sc, nodeCol(c, ng)), vert = !!ng.node.vertical, s = ng.node.size;
    itemSpans(ng).forEach(function (L, li) {
      var u0 = L.a0 - s * 0.08, len = Math.max(4, L.a1 + s * 0.14 - u0), off = L.c + s * 0.66, M = 18, top = [], bot = [];
      for (var j = 0; j <= M; j++) {
        var t = j / M, tt = rev ? 1 - t : t;
        var th = s * k * (0.08 + 0.92 * Math.pow(1 - t, 0.8)) * Math.sqrt(Math.min(1, t / 0.05 + 0.15));
        var v = off + s * bow * (1 - Math.sin(t * Math.PI * 0.85)) - s * bow * 0.5;
        top.push(uvPt(vert, u0 + len * tt, v - th / 2));
        bot.push(uvPt(vert, u0 + len * tt, v + th / 2));
      }
      var poly = top.concat(bot.reverse());
      var sid = addLocalShape(c, ng, 'Swoosh ' + li, localCmds(poly, true), { fill: lc, alpha: 1 }, null, function (f) {
        var cp = cutProgress(c, ng, f), q = E.outCubic(cl((cp.lt - 0.1 - li * 0.1) / 0.45)), ok = outK(c, f);
        return { alpha: q * ok > 0.01 ? cl(q * ok) : 0 };
      });
      afterLayer(c.graph, sid, ng.lastTid);
    });
  });
});

/* xoTapedNote — paper slip held by 1 or 2 tilted strips of tape */
reg('xoTapedNote', function (c) {
  var tilt = V.param(c, 'tilt', 1.7), cc = V.param(c, 'c', 0), one = V.param(c, 'one', false);
  nodeGroups(c).forEach(function (ng) {
    if (!lineLike(c, ng)) return;
    var col = nodeCol(c, ng);
    if (onPlate(c.sc, col)) return;
    var paper = mixHex(c.sc.bg, c.sc.fg, 0.16);
    if (ctr(col, paper) < 2.6) paper = mixHex(c.sc.bg, c.sc.fg, 0.08);
    var tape = mixHex(cc ? (c.sc.accent2 || c.sc.accent) : c.sc.accent, c.sc.bg, 0.25);
    var B = itemBox(ng), s = ng.node.size, pad = s * 0.24, hw = B.hw + pad, hh = B.hh + pad * 0.8;
    var pid = addLocalShape(c, ng, 'Note slip', G.rect(-hw, -hh, hw * 2, hh * 2), { fill: paper, alpha: 1 }, [B.cx, B.cy], function (f) {
      var cp = cutProgress(c, ng, f), q = E.outBack(cl(cp.lt / 0.36), 1.3), ok = outK(c, f);
      return {
        rotation: -(tilt * (1 + (1 - q) * 3)),
        'scale.x': 0.9 + 0.1 * q, 'scale.y': 0.9 + 0.1 * q,
        alpha: q * ok > 0.01 ? cl(ok * Math.min(1, q * 1.4)) : 0
      };
    });
    behind(c.graph, pid, ng.firstTid);
    var tw = Math.min(s * 0.62, hw * 0.9), th = s * 0.19;
    var strips = one ? [[0, -hh, -3]] : [[-hw, -hh, -40], [hw, -hh, 40]];
    strips.forEach(function (st, si) {
      var tid = addLocalShape(c, ng, 'Note tape ' + si, G.rect(-tw / 2, -th / 2, tw, th), { fill: tape, alpha: 0.82 }, [B.cx + st[0], B.cy + st[1]], function (f) {
        var cp = cutProgress(c, ng, f), q = E.outBack(cl(cp.lt / 0.36), 1.3), tq = E.outCubic(cl((cp.lt - 0.18) / 0.25)), ok = outK(c, f);
        return { rotation: -st[2], alpha: q * ok > 0.01 ? cl(ok * Math.min(1, q * 1.4) * 0.82 * tq) : 0 };
      });
      behind(c.graph, tid, ng.firstTid);
    });
  });
});

/* xoHiliter — two overlapping translucent round-ended highlighter strokes */
reg('xoHiliter', function (c) {
  var cc = V.param(c, 'c', 0), tilt = V.param(c, 'tilt', 0.015), kf = V.param(c, 'k', 0.51);
  nodeGroups(c).forEach(function (ng) {
    if (!lineLike(c, ng)) return;
    var col = nodeCol(c, ng);
    if (onPlate(c.sc, col)) return;
    var hc = H.fitContrast(firstOK(cc ? [c.sc.accent2, c.sc.accent] : [c.sc.accent, c.sc.accent2], function (x) { return ctr(x, col) >= 2; }, c.sc.accent), col, 2.4);
    var dk = isDark(c.sc.bg), vert = !!ng.node.vertical, s = ng.node.size, aPass = dk ? 0.78 : 0.6;
    itemSpans(ng).forEach(function (L, li) {
      var len = Math.max(4, L.a1 - L.a0), w1 = s * kf, w2 = s * kf * 0.8, t = len * tilt;
      [
        { d: 0.06, u0: L.a0 + w1 * 0.2, u1: L.a1 + s * 0.06, v0: L.c - s * 0.06 + t, v1: L.c - s * 0.06 - t, w: w1 },
        { d: 0.22, u0: L.a1 - w2 * 0.1, u1: L.a0 + len * 0.12, v0: L.c + s * 0.26 - t * 0.6, v1: L.c + s * 0.3 + t * 0.6, w: w2 }
      ].forEach(function (st, si) {
        var pid = addLocalShape(c, ng, 'Hiliter ' + li + '_' + si, localCmds([uvPt(vert, st.u0, st.v0), uvPt(vert, st.u1, st.v1)], false),
          { stroke: hc, width: Math.max(4, st.w), alpha: aPass }, null, function (f) {
            var cp = cutProgress(c, ng, f), q = E.outCubic(cl((cp.lt - st.d - li * 0.1) / 0.3)), ok = outK(c, f);
            return { alpha: q * ok > 0.01 ? cl(aPass * q * ok) : 0 };
          });
        behind(c.graph, pid, ng.firstTid);
      });
    });
  });
});

/* xoAccentTicks — three comic emphasis ticks at top corner of lyric */
reg('xoAccentTicks', function (c) {
  var left = V.param(c, 'left', false), count = V.param(c, 'n', 3), kf = V.param(c, 'k', 0.49);
  nodeGroups(c).forEach(function (ng) {
    if (!lineLike(c, ng)) return;
    var lc = markCol(c.sc, nodeCol(c, ng)), B = itemBox(ng), s = ng.node.size, sg = left ? -1 : 1;
    var ox = B.cx + sg * (B.hw + s * 0.02), oy = B.cy - B.hh + s * 0.04, lw = Math.max(2.5, s * 0.065);
    var angs = count === 2 ? [-62, -28] : [-76, -45, -14];
    var cmds = [];
    angs.forEach(function (deg, k) {
      var ang = deg * DEG, r0 = s * 0.22, r1 = r0 + s * kf * (k === 1 || count === 2 ? 1 : 0.7);
      var p0 = [sg * Math.cos(ang) * r0, Math.sin(ang) * r0];
      var p1 = [sg * Math.cos(ang) * r1, Math.sin(ang) * r1];
      cmds.push(['M', p0[0], -p0[1]], ['L', p1[0], -p1[1]]);
    });
    var sid = addLocalShape(c, ng, 'Accent ticks', cmds, { stroke: lc, width: lw, alpha: 1 }, [ox, oy], function (f) {
      var cp = cutProgress(c, ng, f), q = E.outBack(cl((cp.lt - cp.inDur * 0.6) / 0.28), 2.2), ok = outK(c, f);
      var sc = Math.max(0.002, q * (1 + 0.07 * Math.sin(cp.ltb * 5)));
      return { 'scale.x': sc, 'scale.y': sc, alpha: q * ok > 0.01 ? cl(ok * Math.min(1, q)) : 0 };
    });
    afterLayer(c.graph, sid, ng.lastTid);
  });
});

/* ============================================================================
   PER-GLYPH ALTERNATION
   ============================================================================ */

/* xoAltWeight — alternating heavy (fattened) and light (pared) glyphs */
reg('xoAltWeight', function (c) {
  var kf = V.param(c, 'k', 1.02), first = V.param(c, 'first', true);
  nodeGroups(c).forEach(function (ng, ni) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng), plate = onPlate(c.sc, col), mi = ng.node.mi != null ? (ng.node.mi | 0) : ni;
    var one = glyphN(ng.node.text) < 2, fKey = String((ng.node.font && ng.node.font.key) || ng.node.font || '');
    var black = /black|dela|reggae|potta|pop|brush|rampart/i.test(fKey);
    var fine = /light|mincho|klee|tokumin|shippori|mono|kiwi|sansui|med/i.test(fKey);
    var kB = (black ? 0.026 : fine ? 0.062 : 0.045) * kf, kT = (black ? 0.046 : fine ? 0 : 0.022) * kf;
    ng.items.forEach(function (it) {
      if (isPunct(it.g.ch)) return;
      var ix = one ? mi : (it.g.ci + it.g.li);
      var heavy = (ix + (first ? 0 : 1)) % 2 === 0;
      var sz = it.src.attrs.fontSize;
      if (heavy) {
        var fat = V.cloneLayer(c.graph, it.tid, 'Heavy stem');
        setAttrStroke(fat, col, Math.max(1, sz * kB));
        behind(c.graph, fat.id, it.tid);
      } else if (!plate && kT > 0) {
        var pare = V.cloneLayer(c.graph, it.tid, 'Light pare');
        setAttrStroke(pare, c.sc.bg, Math.max(1, sz * kT));
        afterLayer(c.graph, pare.id, it.tid);
      }
    });
  });
});

/* xoTallWide — alternating condensed-tall and flat-wide glyph proportions */
reg('xoTallWide', function (c) {
  var kf = V.param(c, 'k', 0.79), first = V.param(c, 'first', true);
  nodeGroups(c).forEach(function (ng, ni) {
    var mi = ng.node.mi != null ? (ng.node.mi | 0) : ni, one = glyphN(ng.node.text) < 2, K = 1.13;
    ng.items.forEach(function (it) {
      if (isPunct(it.g.ch)) return;
      var ix = one ? mi : (it.g.ci + it.g.li);
      var tall = (ix + (first ? 0 : 1)) % 2 === 0;
      var sx = tall ? kf : K, sy = tall ? K : kf;
      V.changeTrack(it.src, 'scale.x', function (val) { return (val == null ? 1 : val) * sx; });
      V.changeTrack(it.src, 'scale.y', function (val) { return (val == null ? 1 : val) * sy; });
    });
  });
});

/* xoMixedFills — glyphs cycle through solid ink, dots/grid, and lines/hatch */
reg('xoMixedFills', function (c) {
  var aPat = V.param(c, 'a', 'dots'), bPat = V.param(c, 'b', 'lines'), off = V.param(c, 'o', 0);
  nodeGroups(c).forEach(function (ng, ni) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng), tone = mixHex(col, c.sc.bg, 0.72), mi = ng.node.mi != null ? (ng.node.mi | 0) : ni;
    var one = glyphN(ng.node.text) < 2;
    ng.items.forEach(function (it) {
      if (isPunct(it.g.ch)) return;
      var ix = one ? mi : (it.g.ci + it.g.li), mode = (ix + off) % 3;
      if (mode === 0) return;
      var sz = it.src.attrs.fontSize, pat = mode === 1 ? aPat : bPat;
      var bgL = V.cloneLayer(c.graph, it.tid, 'MixFill bg');
      setAttrColor(bgL, tone);
      behind(c.graph, bgL.id, it.tid);
      var rim = V.cloneLayer(c.graph, it.tid, 'MixFill rim');
      setAttrStroke(rim, col, Math.max(1.2, sz * 0.02));
      afterLayer(c.graph, rim.id, it.tid);
      localMultiClip(c.graph, it.tid, patternPolys(pat, it.g), false, 'MixFill pat', c.options);
    });
  });
});

/* xoTrackRamp — progressive letter spacing widening along each line while keeping total width */
reg('xoTrackRamp', function (c) {
  var t = V.param(c, 't', 0.37), rev = V.param(c, 'rev', false);
  nodeGroups(c).forEach(function (ng) {
    var vert = !!ng.node.vertical, byLine = Object.create(null);
    ng.gs.forEach(function (g) { (byLine[g.li] = byLine[g.li] || []).push(g); });
    var has3 = Object.keys(byLine).some(function (li) { return byLine[li].length >= 3; });
    if (!has3) return;
    var sh = 1 / (1 + t), shifts = Object.create(null);
    var ext = function (g) { return vert ? g.h : g.w; }, pos = function (g) { return vert ? g.y : g.x; };
    Object.keys(byLine).forEach(function (li) {
      var gs = byLine[li], n = gs.length;
      var old0 = pos(gs[0]) - ext(gs[0]) / 2, old1 = pos(gs[n - 1]) + ext(gs[n - 1]) / 2, len = old1 - old0, T = t * len;
      var Wsum = Math.max(1, (n - 1) * (n - 2) / 2), cum = 0;
      for (var k = 0; k < n; k++) {
        var g = gs[k], xp = pos(g) + cum, x2;
        if (ng.node.align === 'left') x2 = old0 + (xp - old0) * sh;
        else if (ng.node.align === 'right' && !vert) x2 = old1 + (xp - (old1 + T)) * sh;
        else { var cm = (old0 + old1) / 2; x2 = cm + (xp - (cm + T / 2)) * sh; }
        shifts[g.i] = x2 - pos(g);
        if (k < n - 1) cum += n >= 3 ? T * (rev ? n - 2 - k : k) / Wsum : T;
      }
    });
    ng.items.forEach(function (it) {
      var d = shifts[it.idx] || 0;
      V.changeTrack(it.src, 'scale.x', function (val) { return (val == null ? 1 : val) * sh; });
      V.changeTrack(it.src, 'scale.y', function (val) { return (val == null ? 1 : val) * sh; });
      shiftLayer(it.src, vert ? 0 : d, vert ? d : 0);
    });
  });
});

/* ============================================================================
   PRINT LOOKS
   ============================================================================ */

/* xoHalfKnock — solid ink bar covers lower/top half of line, flipping covered glyph parts to bg */
reg('xoHalfKnock', function (c) {
  var at = V.param(c, 'at', 0.03), top = V.param(c, 'top', false);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng);
    if (onPlate(c.sc, col)) return;
    var tc = textOn(col, c.sc.bg, c.sc), lag = pieceLagSec(c), vert = !!ng.node.vertical, s = ng.node.size;
    var spans = itemSpans(ng); if (!spans.length) return;
    spans.forEach(function (L, li) {
      var pad = s * 0.16, a0 = L.a0 - pad, len = Math.max(2, L.a1 + pad - a0);
      var v0 = top ? L.c - s * 0.62 : L.c + s * at, v1 = top ? L.c - s * at : L.c + s * 0.62;
      var cmds = vert ? G.rect(v0, -(a0 + len), Math.max(1, v1 - v0), len) : G.rect(a0, -v1, len, Math.max(1, v1 - v0));
      var pid = addLocalShape(c, ng, 'HalfKnock plate ' + li, cmds, { fill: col, alpha: 1 }, null, function (f) {
        var cp = cutProgress(c, ng, f), q = E.outExpo(cl((cp.lt - 0.03 - lag - li * 0.07) / 0.4)), ok = outK(c, f);
        return { alpha: q * ok > 0.01 ? cl(ok * q) : 0 };
      });
      behind(c.graph, pid, ng.firstTid);
    });
    ng.items.forEach(function (it) {
      var knock = V.cloneLayer(c.graph, it.tid, 'HalfKnock inner');
      setAttrColor(knock, tc);
      afterLayer(c.graph, knock.id, it.tid);
      if (vert) {
        var w = Math.max(it.g.w, s) * 1.15, h = Math.max(it.g.h, s) * 1.15;
        var vx0 = top ? -0.62 * w : at * w, vx1 = top ? -at * w : 0.62 * w;
        localMultiClip(c.graph, knock.id, [V.polygon(vx0, -h, vx1, h)], false, 'HalfKnock crop', c.options);
      } else {
        clipSliceY(c.graph, knock.id, it.g, top ? -0.62 : at, top ? -at : 0.62, 'HalfKnock crop', c.options);
      }
    });
  });
});

/* xoTopCrop — trimmed top/foot glyph edge + accent trim hairline */
reg('xoTopCrop', function (c) {
  var kf = V.param(c, 'k', 0.215), foot = V.param(c, 'foot', false);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var vert = !!ng.node.vertical, lc = markCol(c.sc, nodeCol(c, ng)), s = ng.node.size;
    var side = (foot !== vert) ? 1 : -1;
    ng.items.forEach(function (it) {
      var w = Math.max(it.g.w, s) * 1.15, h = Math.max(it.g.h, s) * 1.15, frames = [];
      for (var f = it.src.start; f < it.src.end; f++) {
        var cp = cutProgress(c, ng, f), g = kf * E.outCubic(cl((cp.lt - cp.inDur * 0.5) / 0.35)) * outK(c, f);
        if (vert) {
          var cx0 = side > 0 ? -0.8 * w : (-0.5 + g) * w, cx1 = side > 0 ? (0.5 - g) * w : 0.8 * w;
          frames.push([V.polygon(cx0, -h, cx1, h)]);
        } else {
          var yLoAE = side > 0 ? -0.8 : (-0.5 + g), yHiAE = side > 0 ? (0.5 - g) : 0.8;
          frames.push([V.polygon(-w, -yHiAE * it.g.h, w, -yLoAE * it.g.h)]);
        }
      }
      localMultiClip(c.graph, it.tid, frames, false, 'TopCrop', c.options);
    });
    if (lineLike(c, ng)) {
      itemSpans(ng).forEach(function (L, li) {
        var u0 = L.a0 - s * 0.3, u1 = L.a1 + s * 0.3, v = L.c + side * (0.5 - kf) * s;
        var sid = addLocalShape(c, ng, 'Crop rule ' + li, localCmds([uvPt(vert, u0, v), uvPt(vert, u1, v)], false),
          { stroke: lc, width: Math.max(1.4, s * 0.018), alpha: 1 }, null, function (f) {
            var cp = cutProgress(c, ng, f), g = kf * E.outCubic(cl((cp.lt - cp.inDur * 0.5) / 0.35)) * outK(c, f);
            var q = E.outExpo(cl((cp.lt - cp.inDur * 0.5 - li * 0.06) / 0.4));
            var al = Math.min(1, g / kf * 1.5) * q;
            return { alpha: al > 0.01 ? cl(al) : 0 };
          });
        afterLayer(c.graph, sid, ng.lastTid);
      });
    }
  });
});

/* xoOverlapKern — tight overlapping poster kerning with bg separator stroke */
reg('xoOverlapKern', function (c) {
  var t = V.param(c, 't', 0.15), k = V.param(c, 'k', 0.058);
  nodeGroups(c).forEach(function (ng) {
    if (ng.gs.length < 2) return;
    var col = nodeCol(c, ng);
    if (onPlate(c.sc, col)) return;
    var vert = !!ng.node.vertical, latin = /[A-Za-z0-9]/.test(ng.node.text || '');
    var step = t * (latin ? 0.4 : vert ? 0.8 : 1) * ng.node.size;
    var byLine = Object.create(null);
    ng.gs.forEach(function (g) { (byLine[g.li] = byLine[g.li] || []).push(g); });
    var shifts = Object.create(null);
    Object.keys(byLine).forEach(function (li) {
      var gs = byLine[li], n = gs.length;
      gs.forEach(function (g, idx) {
        shifts[g.i] = (n > 1 ? (idx - (n - 1) / 2) : 0) * -step;
      });
    });
    ng.items.forEach(function (it) {
      var d = shifts[it.idx] || 0;
      shiftLayer(it.src, vert ? 0 : d, vert ? d : 0);
      if (!hasPieceMotion(c)) {
        var sep = V.cloneLayer(c.graph, it.tid, 'Overlap stroke');
        setAttrStroke(sep, c.sc.bg, Math.max(2, it.src.attrs.fontSize * k));
        behind(c.graph, sep.id, it.tid);
      }
    });
  });
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
