/* Core, looks, and treattrans text treatments (46 recipes matching src/11p_looks.js, src/11p_treattrans.js).
 * Built as editable Cavalry textShape layers, stroke/extrude clones, clipDeformers, and vector shapes.
 */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, DEG = H.DEG, TAU = H.TAU;
var ctr = H.contrast, isDark = H.dark, mixHex = H.mixHex, lum = H.lum;

function reg(key, src, scope, fn, diffs) {
  N.register('treat', key, { source: src, scope: scope || 'glyph', build: fn, differences: diffs || [] });
}

/* ================= color & scheme helpers ================= */
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
function textOn(box, pref, sc) {
  if (ctr(pref, box) >= 3) return pref;
  return bestCol([sc.bg, sc.fg, sc.ink, '#111111', '#FFFFFF'], box);
}
function markCol(sc, col) {
  return firstOK([sc.accent, sc.accent2, col], function (c) { return ctr(c, sc.bg) >= 2; }, col);
}
function twoTone(sc, col) {
  return firstOK([sc.accent, sc.accent2, sc.ghostA, sc.ghostB], function (c) {
    return ctr(c, col) >= 1.5 && ctr(c, sc.bg) >= 2;
  }, mixHex(col, sc.bg || '#101010', 0.45));
}
function onPlate(sc, col) { return ctr(col, sc.bg || '#101010') < 1.5; }

/* ================= character classification helpers ================= */
function isSp(ch) { return ch === ' ' || ch === '\u3000'; }
function isPunct(ch) { return /^[\u3001\u3002\uff0c\uff0e\uff01\uff1f.,!?\u30fb\u2026\u2025\u300c\u300d\u300e\u300f\uff08\uff09()\uff3b\uff3d\[\]\u3010\u3011\u30fc\u301c\uff5e:;\uff1a\uff1b\-"'\u2018\u2019\u201c\u201d]$/.test(ch); }
function isKanji(ch) { return /[\u4e00-\u9faf\u3400-\u4dbf\uf900-\ufaff\u3005]/.test(ch); }
function isKata(ch) { return /[\u30a0-\u30ff\u31f0-\u31ff]/.test(ch); }
function isLatin(ch) { return /[A-Za-z0-9]/.test(ch); }
function glyphN(t) { return Array.from(String(t || '')).filter(function (c) { return c.trim(); }).length; }

/* ================= graph & track helpers ================= */
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
          var t = (f - nums[i]) / Math.max(1e-6, nums[i + 1] - nums[i]);
          return a.value + (b.value - a.value) * t;
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
function clearKeys(layer, attr) {
  if (layer && layer.keys && layer.keys[attr]) delete layer.keys[attr];
}
function setAttrColor(layer, col) {
  clearKeys(layer, 'material.materialColor');
  layer.attrs['material.materialColor'] = col;
}
function setAttrStroke(layer, col, width) {
  layer.attrs.fill = false;
  layer.attrs.stroke = true;
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
function scaleLayerAlpha(layer, mult) {
  if (layer.keys.alpha) V.changeTrack(layer, 'alpha', function (v) { return cl(v * mult); });
  else layer.attrs.alpha = cl((layer.attrs.alpha == null ? 1 : layer.attrs.alpha) * mult);
}

/* Gather glyph textShapes grouped per cut node in node.id order */
function nodeGroups(c) {
  var out = [];
  (c.cut.nodes || []).forEach(function (node) {
    var gs = V.glyphs(c, node);
    var prefix = node.id + ' / ';
    var items = [];
    (c.texts || []).forEach(function (tid) {
      var lyr = c.graph.byId[tid];
      if (!lyr || lyr.type !== 'textShape') return;
      if (lyr.name.indexOf(prefix) !== 0) return;
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

function itemBounds(ng) {
  return V.bounds(ng.gs);
}
function itemSpans(ng) {
  return V.spans(ng.gs, !!ng.node.vertical);
}
function inProg(c, ng, frame, delay, len) {
  var start = c.cut.origin + (ng.node.delayFrames || 0);
  var lt = (frame - start) / c.comp.fps;
  return cl((lt - (delay || 0)) / Math.max(0.01, len || 0.3));
}
function outK(c, frame) {
  var pout = cl((frame - (c.cut.sourceEnd - c.cut.outFrames)) / Math.max(1, c.cut.outFrames));
  return 1 - E.inCubic(pout);
}
function cutProgress(c, ng, frame) {
  var start = c.cut.origin + (ng.node.delayFrames || 0);
  var lt = (frame - start) / c.comp.fps;
  var ltb = (frame - c.cut.origin) / c.comp.fps;
  return { lt: lt, ltb: ltb, inDur: c.cut.inFrames / c.comp.fps, outDur: c.cut.outFrames / c.comp.fps, dur: (c.cut.sourceEnd - c.cut.origin) / c.comp.fps };
}
function nodeCol(c, ng) { return (ng.node && ng.node.color) || c.sc.fg || '#ffffff'; }
function hasPieceMotion(c, ng) {
  var P = c.cut.presets || {};
  var en = P.enter && P.enter.name, ex = P.exit && P.exit.name;
  var pieceEn = { shards: 1, pixelate: 1, shatter: 1, sliceUp: 1, tornado: 1 };
  var pieceEx = { shatter: 1, explode: 1, implode: 1, pixelOff: 1, sliceOff: 1, dissolve: 1 };
  return (en && pieceEn[en]) || (ex && pieceEx[ex]);
}
function seedH() { return R.hash.apply(null, arguments); }
function rand() { return N.random.apply(null, arguments); }
function randS() { return R.signed.apply(null, arguments); }
function randR(a, b) {
  var args = Array.prototype.slice.call(arguments, 2);
  return a + (b - a) * rand.apply(null, args);
}

/* Convert AE item-local polygon / polyline / rect to Cavalry item-local path commands */
function localCmds(pts, closed) {
  var out = pts.map(function (pt, i) { return [i ? 'L' : 'M', pt[0], -pt[1]]; });
  if (closed) out.push(['Z']);
  return out;
}
function addLocalShape(c, ng, name, cmds, paint, pos, sampleFn) {
  var lyr = ng.items[0].src;
  var range = { start: lyr.start, end: lyr.end };
  var p0 = Object.assign({}, paint);
  var reqZero = p0.alpha != null && !(p0.alpha > 0);
  if (reqZero) p0.alpha = 1;
  var id = C.shape(c.graph, range, c.cut.id + ' / ' + ng.node.id + ' / ' + name, ng.parent, cmds, p0);
  if (pos) c.graph.byId[id].attrs.position = [pos[0], -pos[1]];
  if (pos && pos.rot) c.graph.byId[id].attrs.rotation = -pos.rot;
  if (sampleFn) {
    C.sample(c.graph, id, lyr.start, lyr.end, sampleFn);
  } else if (reqZero) {
    c.graph.key(id, 'alpha', lyr.start, 0, 1);
  }
  return id;
}
function addGlyphShape(c, item, name, cmds, paint, sampleFn, isBehind) {
  var src = item.src;
  var range = { start: src.start, end: src.end };
  var p0 = Object.assign({}, paint);
  if (p0.alpha != null && !(p0.alpha > 0)) p0.alpha = 1;
  var id = C.shape(c.graph, range, src.name + ' / ' + name, src.parent, cmds, p0);
  if (isBehind) behind(c.graph, id, item.tid);
  else afterLayer(c.graph, id, item.tid);
  if (sampleFn) C.sample(c.graph, id, src.start, src.end, sampleFn);
  return id;
}

/* Local multi-polygon javaScriptDeformer in glyph-local Cavalry coordinates */
function localMultiClip(graph, targetId, polysOrFrames, difference, label, options) {
  var n = graph.byId[targetId];
  if (!n) throw new Error('Unknown localMultiClip target: ' + targetId);
  var profile = options && options.hostProfile && options.hostProfile.javaScriptDeformer || { layerType: 'javaScriptDeformer' };
  var method = difference ? 'difference' : 'intersect';
  var isStatic = Array.isArray(polysOrFrames);
  var dataStr = JSON.stringify(polysOrFrames);
  var expr = isStatic ? [
    '(function(){', 'var polys=', dataStr, ';',
    'var clip=new cavalry.Path();',
    'polys.forEach(function(q){if(!q||q.length<2)return;q.forEach(function(p,i){if(i)clip.lineTo(p[0],p[1]);else clip.moveTo(p[0],p[1]);});clip.close();});',
    'var depth=def.highestDepthWithPath();var meshes=def.getMeshesAtDepth(depth);',
    'meshes.forEach(function(mesh){for(var i=0;i<mesh.count();i++){var p=mesh.getPathAtIndex(i);p.', method, '(clip);mesh.setPathAtIndex(i,p);}});',
    'def.setMeshesAtDepth(depth,meshes);})();'
  ].join('') : [
    '(function(){', 'var frames=', dataStr, ';',
    'var at=Math.max(0,Math.min(frames.length-1,Math.floor(n0)-' + String(n.start) + '));',
    'var polys=frames[at];if(!polys||!polys.length)return;',
    'var clip=new cavalry.Path();',
    'polys.forEach(function(q){if(!q||q.length<2)return;q.forEach(function(p,i){if(i)clip.lineTo(p[0],p[1]);else clip.moveTo(p[0],p[1]);});clip.close();});',
    'var depth=def.highestDepthWithPath();var meshes=def.getMeshesAtDepth(depth);',
    'meshes.forEach(function(mesh){for(var i=0;i<mesh.count();i++){var p=mesh.getPathAtIndex(i);p.', method, '(clip);mesh.setPathAtIndex(i,p);}});',
    'def.setMeshesAtDepth(depth,meshes);})();'
  ].join('');
  var id = graph.add(profile.layerType, n.name + ' / ' + (label || 'Clip'), targetId, n.start, n.end,
    { expression: expr, 'array.0': n.start });
  graph.key(id, 'array.0', n.start, n.start, 1);
  if (n.end - n.start > 1) graph.key(id, 'array.0', n.end - 1, n.end - 1, 1);
  graph.connect(id, 'id', targetId, 'deformers');
  return id;
}

/* Clip a single Y fraction slice [yLoAE, yHiAE] in glyph local space (AE y-down: -0.5=top, +0.5=bottom) */
function clipSliceY(graph, targetId, g, yLoAE, yHiAE, label, options) {
  var hw = Math.max(g.w, g.h) * 1.15, hh = Math.max(g.h, g.w) * 1.15;
  var cy0 = -yHiAE * g.h, cy1 = -yLoAE * g.h;
  if (cy1 - cy0 < 0.05) cy1 = cy0 + 0.05;
  return localMultiClip(graph, targetId, [V.polygon(-hw, cy0, hw, cy1)], false, label, options);
}

/* Multi-stop horizontal gradient by slicing glyph into clean clipped textShape clones */
function applyGradientBands(c, item, stops, label, options) {
  var src = item.src, col0 = stops[0][1];
  setAttrColor(src, col0);
  var w = Math.max(item.g.w, item.g.h) * 1.15, h = item.g.h;
  for (var i = 1; i < stops.length; i++) {
    var s0 = stops[i][0], s1 = (i + 1 < stops.length ? stops[i + 1][0] : 1.35);
    var col = stops[i][1];
    if (s1 <= s0 + 0.002) continue;
    var cln = V.cloneLayer(c.graph, item.tid, (label || 'Grad') + ' ' + i);
    setAttrColor(cln, col);
    afterLayer(c.graph, cln.id, item.tid);
    clipSliceY(c.graph, cln.id, item.g, s0 - 0.55, s1 - 0.5, label, options);
  }
  clipSliceY(c.graph, item.tid, item.g, -0.7, stops.length > 1 ? stops[1][0] - 0.55 : 0.7, (label || 'Grad') + ' 0', options);
}

/* Build shear decomposition chain around a null parent for skew/italic */
function decompShear(k) {
  if (Math.abs(k) < 1e-9) return [0, 1, 1, 0];
  var v = 0.5 * Math.atan2(2 * k, -k * k);
  var a = Math.cos(v) + k * Math.sin(v), b = Math.sin(v), s = Math.hypot(a, b);
  return [Math.atan2(b, a) / DEG, s, 1 / s, -v / DEG];
}
function wrapNodeShear(c, ng, skewDeg, label) {
  var p = c.graph.byId[ng.parent];
  if (!p) return;
  var d = decompShear(-Math.tan(skewDeg * DEG));
  var nOuter = c.graph.add('null', p.name + ' / ' + label + ' R1', p.parent, p.start, p.end, { rotation: d[0] });
  var nStretch = c.graph.add('null', p.name + ' / ' + label + ' S', nOuter, p.start, p.end, { scale: [d[1], d[2]] });
  behind(c.graph, nOuter, p.id);
  behind(c.graph, nStretch, p.id);
  p.parent = nStretch;
  p.attrs.rotation = (p.attrs.rotation || 0) + d[3];
}

/* Helper to copy base glyph kinematics into a clone positioned behind src */
function buildOffsetClones(c, ng, specs) {
  ng.items.forEach(function (it) {
    var src = it.src;
    for (var s = specs.length - 1; s >= 0; s--) {
      var sp = specs[s];
      var cln = V.cloneLayer(c.graph, it.tid, sp.label || ('Layer ' + s));
      if (sp.strokeWidth != null) {
        setAttrStroke(cln, sp.color, sp.strokeWidth);
        if (sp.alphaMult != null) scaleLayerAlpha(cln, sp.alphaMult);
      } else {
        setAttrColor(cln, sp.color);
        cln.attrs.fill = sp.fill !== false;
        cln.attrs.stroke = false;
        if (sp.alphaMult != null) scaleLayerAlpha(cln, sp.alphaMult);
      }
      if (sp.dx || sp.dy) shiftLayer(cln, sp.dx || 0, sp.dy || 0);
      behind(c.graph, cln.id, it.tid);
    }
  });
}

/* Pattern clip polygons in glyph-local space */
function patternPolys(kind, g) {
  var w = Math.max(g.w, g.h * 0.65) * 1.15, h = Math.max(g.h, g.w * 0.65) * 1.15;
  var polys = [];
  if (kind === 'dots') {
    var cell = Math.max(4, Math.min(w, h) / 4.2), rad = cell * 0.34;
    for (var y = -h * 0.65; y <= h * 0.65; y += cell) {
      for (var x = -w * 0.65; x <= w * 0.65; x += cell) {
        var r = rad;
        polys.push([[x - r, y], [x, y - r], [x + r, y], [x, y + r]]);
      }
    }
  } else if (kind === 'lines') {
    var step = Math.max(3.5, h / 5.5), bh = step * 0.44;
    for (var ly = -h * 0.65; ly <= h * 0.65; ly += step) {
      polys.push(V.polygon(-w * 0.8, ly - bh / 2, w * 0.8, ly + bh / 2));
    }
  } else {
    /* stripes or hatch: rotated strip rectangles */
    var pitch = Math.max(4, Math.min(w, h) / 4.5), sw = pitch * 0.44;
    var span = (w + h) * 0.9;
    function addBands(angDeg) {
      var a = angDeg * DEG, cs = Math.cos(a), sn = Math.sin(a);
      for (var p = -span; p <= span; p += pitch) {
        var dx = cs * p, dy = sn * p, tx = -sn * span, ty = cs * span;
        var nx = cs * sw * 0.5, ny = sn * sw * 0.5;
        polys.push([
          [dx - tx - nx, dy - ty - ny],
          [dx + tx - nx, dy + ty - ny],
          [dx + tx + nx, dy + ty + ny],
          [dx - tx + nx, dy - ty + ny]
        ]);
      }
    }
    addBands(45);
    if (kind === 'hatch') addBands(-45);
  }
  return polys.slice(0, 64);
}

/* ============================================================================
   1. CORE (1)
   ============================================================================ */
reg('none', 'ae/45_core.jsx', 'cut', function () {});

/* ============================================================================
   2. 11p_looks.js TREATMENTS (20)
   ============================================================================ */

/* outlineFill — thick colored outline sitting cleanly under filled glyphs */
reg('outlineFill', 'src/11p_looks.js', 'glyph', function (c) {
  var k = V.param(c, 'k', 0.095), cc = V.param(c, 'c', 0);
  nodeGroups(c).forEach(function (ng) {
    var col = nodeCol(c, ng);
    var scColor = cc === 2
      ? firstOK([c.sc.accent2, c.sc.accent], function (x) { return ctr(x, col) >= 1.8; }, accentFor(c.sc, col, 1.8))
      : accentFor(c.sc, col, 1.8);
    ng.items.forEach(function (it) {
      var cln = V.cloneLayer(c.graph, it.tid, 'Outline fill under');
      setAttrStroke(cln, scColor, Math.max(2, it.src.attrs.fontSize * k));
      behind(c.graph, cln.id, it.tid);
    });
  });
});

/* doubleOutline — gap stroke + outer colored ring behind glyph fill */
reg('doubleOutline', 'src/11p_looks.js', 'glyph', function (c) {
  var a = V.param(c, 'a', 0.08), b = V.param(c, 'b', 0.095);
  nodeGroups(c).forEach(function (ng) {
    var col = nodeCol(c, ng), ring = accentFor(c.sc, col, 1.6);
    var gap = ctr(c.sc.bg, col) >= 1.5 && ctr(c.sc.bg, ring) >= 1.3 ? c.sc.bg : bestCol([c.sc.ink, c.sc.fg, '#000000', '#FFFFFF'], ring);
    ng.items.forEach(function (it) {
      var sz = it.src.attrs.fontSize;
      var outer = V.cloneLayer(c.graph, it.tid, 'Double outline outer');
      setAttrStroke(outer, ring, Math.max(4, sz * (a + b)));
      var inner = V.cloneLayer(c.graph, it.tid, 'Double outline gap');
      setAttrStroke(inner, gap, Math.max(2, sz * a));
      behind(c.graph, outer.id, it.tid);
      behind(c.graph, inner.id, it.tid);
    });
  });
});

/* extrude — 3D extruded stack behind glyphs */
reg('extrude', 'src/11p_looks.js', 'glyph', function (c) {
  var d = V.param(c, 'd', 0.11), dir = V.param(c, 'dir', [1, 1]), cc = V.param(c, 'c', 0);
  nodeGroups(c).forEach(function (ng) {
    var col = nodeCol(c, ng);
    var base = cc
      ? firstOK([c.sc.ink, c.sc.accent2], function (x) { return ctr(x, col) >= 1.6 && ctr(x, c.sc.bg) >= 1.4; }, accentFor(c.sc, col, 1.6))
      : accentFor(c.sc, col, 1.6);
    var ec = mixHex(base, '#000000', isDark(c.sc.bg) ? 0.3 : 0.2);
    var L = ng.node.size * d, N = Math.max(4, Math.min(ng.gs.length > 10 ? 8 : 14, Math.round(L / 2.5)));
    var specs = [];
    for (var s = 1; s <= N; s++) {
      var f = s / N;
      specs.push({ label: 'Extrude ' + s, dx: dir[0] * L * f, dy: dir[1] * L * f, color: ec });
    }
    buildOffsetClones(c, ng, specs);
  });
});

/* longShadow — long diagonal fading shadow behind glyphs */
reg('longShadow', 'src/11p_looks.js', 'glyph', function (c) {
  var Lf = V.param(c, 'L', 0.48), ang = V.param(c, 'ang', 45);
  var ca = Math.cos(ang * DEG), sa = Math.sin(ang * DEG);
  nodeGroups(c).forEach(function (ng) {
    var col = nodeCol(c, ng);
    var sh = isDark(c.sc.bg) ? mixHex(c.sc.bg, accentFor(c.sc, col, 1.5), 0.5) : mixHex(c.sc.bg, c.sc.fg, 0.28);
    var L = ng.node.size * Lf, N = Math.max(8, Math.min(ng.gs.length > 10 ? 10 : 16, Math.round(L / Math.max(2, ng.node.size * 0.025))));
    var specs = [];
    for (var s = 1; s <= N; s++) {
      var f = s / N;
      specs.push({ label: 'LongShadow ' + s, dx: ca * L * f, dy: sa * L * f, color: sh, alphaMult: 0.9 * (1 - 0.72 * f) });
    }
    buildOffsetClones(c, ng, specs);
  });
});

/* hardShadow — single crisp accent offset drop shadow */
reg('hardShadow', 'src/11p_looks.js', 'glyph', function (c) {
  var d = V.param(c, 'd', 0.068), dir = V.param(c, 'dir', [1, 1]);
  nodeGroups(c).forEach(function (ng) {
    var col = nodeCol(c, ng), sh = accentFor(c.sc, col, 1.6), L = ng.node.size * d;
    buildOffsetClones(c, ng, [{ label: 'Hard shadow', dx: dir[0] * L, dy: dir[1] * L, color: sh }]);
  });
});

/* softShadow — layered translucent feather shadow without $gaussianBlur */
reg('softShadow', 'src/11p_looks.js', 'glyph', function (c) {
  var b = V.param(c, 'b', 0.11), dy = V.param(c, 'dy', 0.05);
  nodeGroups(c).forEach(function (ng) {
    var darkBg = isDark(c.sc.bg);
    var scCol = darkBg ? mixHex(c.sc.bg, c.sc.accent || c.sc.fg, 0.45) : mixHex(c.sc.fg, '#000000', 0.5);
    var aBase = darkBg ? 0.5 : 0.26;
    var sz = ng.node.size, dx = sz * 0.02, oy = sz * dy;
    buildOffsetClones(c, ng, [
      { label: 'Soft shadow core', dx: dx, dy: oy, color: scCol, alphaMult: aBase * 0.75 },
      { label: 'Soft shadow mid', dx: dx, dy: oy, color: scCol, strokeWidth: Math.max(1.5, sz * b * 0.55), alphaMult: aBase * 0.45 },
      { label: 'Soft shadow outer', dx: dx, dy: oy, color: scCol, strokeWidth: Math.max(3, sz * b * 1.1), alphaMult: aBase * 0.22 }
    ]);
  });
}, ['Soft blur shadow is built from layered translucent stroke/fill silhouettes without gaussianBlur.']);

/* glow — luminous outer halo with subtle breathing alpha pulse */
reg('glow', 'src/11p_looks.js', 'glyph', function (c) {
  var b = V.param(c, 'b', 0.21), self = V.param(c, 'self', false);
  nodeGroups(c).forEach(function (ng) {
    var col = nodeCol(c, ng), dk = isDark(c.sc.bg);
    var gc = dk
      ? firstOK(self ? [col, c.sc.accent, c.sc.accent2] : [c.sc.accent, c.sc.accent2, col], function (x) { return lum(x) > lum(c.sc.bg) + 0.2; }, col)
      : firstOK([c.sc.accent, c.sc.accent2, c.sc.ghostA, c.sc.ghostB], function (x) { return ctr(x, c.sc.bg) >= 2 && lum(x) > 0.08 && ctr(x, col) >= 1.4; }, col);
    var aBase = dk ? 0.48 : 0.34;
    ng.items.forEach(function (it) {
      var sz = it.src.attrs.fontSize;
      [0.36, 0.78].forEach(function (mult, idx) {
        var cln = V.cloneLayer(c.graph, it.tid, 'Glow halo ' + (idx + 1));
        setAttrStroke(cln, gc, Math.max(2, sz * b * mult));
        behind(c.graph, cln.id, it.tid);
        C.sample(c.graph, cln.id, it.src.start, it.src.end, function (f) {
          var ltb = (f - c.cut.origin) / c.comp.fps;
          var pulse = 0.9 + 0.1 * Math.sin(ltb * 3.2);
          var baseA = valAt(it.src, 'alpha', f, 1);
          return { alpha: cl(baseA * aBase * (idx ? 0.45 : 0.85) * pulse) };
        });
      });
    });
  });
}, ['Glow bloom is represented via breathing outer stroke halos rather than gaussianBlur.']);

/* strike — animated strikethrough bar (one or two tilted lines) */
reg('strike', 'src/11p_looks.js', 'glyph', function (c) {
  var v = V.param(c, 'v', 'one'), ang = V.param(c, 'ang', 0), k = V.param(c, 'k', 0.072);
  nodeGroups(c).forEach(function (ng) {
    var col = nodeCol(c, ng), lc = accentFor(c.sc, col, 1.8), vert = !!ng.node.vertical;
    var s = ng.node.size, th = Math.max(2, s * k);
    itemSpans(ng).forEach(function (L, li) {
      var a0 = L.a0 - s * 0.08, a1 = L.a1 + s * 0.08, len = Math.max(2, a1 - a0), mid = (a0 + a1) / 2;
      var cx = vert ? L.c : mid, cy = vert ? mid : L.c + s * 0.02;
      var offs = v === 'two' ? [-th * 0.8, th * 0.8] : [0], wLine = v === 'two' ? th * 0.6 : th;
      offs.forEach(function (d, oi) {
        var pA = vert ? [d, -len / 2] : [-len / 2, d], pB = vert ? [d, len / 2] : [len / 2, d];
        var sid = addLocalShape(c, ng, 'Strike ' + li + '_' + oi, localCmds([pA, pB], false), { stroke: lc, width: wLine, alpha: 1 }, [cx, cy], function (f) {
          var cp = cutProgress(c, ng, f), q = E.outExpo(cl((cp.lt - cp.inDur * 0.7 - li * 0.1) / 0.3)), ok = outK(c, f);
          var sc = Math.max(0.002, q * ok);
          var res = { alpha: q * ok > 0.01 ? 1 : 0 };
          res[vert ? 'scale.y' : 'scale.x'] = sc;
          return res;
        });
        c.graph.byId[sid].attrs.rotation = -ang;
        afterLayer(c.graph, sid, ng.lastTid);
      });
    });
  });
});

/* gradientV — vertical 4-band gradient across each glyph */
reg('gradientV', 'src/11p_looks.js', 'glyph', function (c) {
  var up = V.param(c, 'up', false), useGrad = V.param(c, 'g', false);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c, ng)) return;
    var col = nodeCol(c, ng);
    var g = useGrad && Array.isArray(c.sc.grad) && c.sc.grad.length >= 2 && c.sc.grad.every(function (x) { return ctr(x, c.sc.bg) >= 1.6; })
      ? c.sc.grad.slice() : [col, twoTone(c.sc, col)];
    if (up) g.reverse();
    var cA = g[0], cB = g[g.length - 1];
    var stops = [[0, cA], [0.33, mixHex(cA, cB, 0.33)], [0.66, mixHex(cA, cB, 0.66)], [0.88, cB]];
    ng.items.forEach(function (it) { applyGradientBands(c, it, stops, 'GradV', c.options); });
  });
}, ['Vertical gradient represented via discrete clipped horizontal tonal bands.']);

/* splitColor — hard two-tone vertical split */
reg('splitColor', 'src/11p_looks.js', 'glyph', function (c) {
  var sp = V.param(c, 'sp', 0.53), top = V.param(c, 'top', false);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c, ng)) return;
    var col = nodeCol(c, ng), c2 = twoTone(c.sc, col);
    var a = top ? c2 : col, b = top ? col : c2;
    ng.items.forEach(function (it) {
      setAttrColor(it.src, a);
      clipSliceY(c.graph, it.tid, it.g, -0.7, sp - 0.5, 'Split top', c.options);
      var cln = V.cloneLayer(c.graph, it.tid, 'Split bottom');
      setAttrColor(cln, b);
      afterLayer(c.graph, cln.id, it.tid);
      clipSliceY(c.graph, cln.id, it.g, sp - 0.5, 0.7, 'Split bot', c.options);
    });
  });
});

/* halftone, stripes, hatch — patterned glyph fills using localMultiClip */
function registerPatternTreat(key, kind, alt) {
  reg(key, 'src/11p_looks.js', 'glyph', function (c) {
    var v = V.param(c, 'v', 'tone');
    var patKind = (v === 'lines' && alt) ? alt : kind;
    nodeGroups(c).forEach(function (ng) {
      var col = nodeCol(c, ng);
      var bgCol = v === 'duo' ? accentFor(c.sc, col, 1.6) : mixHex(col, c.sc.bg, 0.62);
      ng.items.forEach(function (it) {
        var sz = it.src.attrs.fontSize;
        var bgClone = V.cloneLayer(c.graph, it.tid, key + ' bg');
        setAttrColor(bgClone, bgCol);
        behind(c.graph, bgClone.id, it.tid);
        if (v !== 'duo') {
          var rim = V.cloneLayer(c.graph, it.tid, key + ' rim');
          setAttrStroke(rim, col, Math.max(1.2, sz * 0.018));
          afterLayer(c.graph, rim.id, it.tid);
        }
        localMultiClip(c.graph, it.tid, patternPolys(patKind, it.g), false, key + ' pattern', c.options);
      });
    });
  }, ['Pattern fill represented via clipped vector pattern geometry layered over glyph backing fill.']);
}
registerPatternTreat('halftone', 'dots');
registerPatternTreat('stripes', 'stripes', 'lines');
registerPatternTreat('hatch', 'hatch');

/* dotted — dashed stroke outline via multi-band local clip (with optional crawl speed) */
reg('dotted', 'src/11p_looks.js', 'glyph', function (c) {
  var k = V.param(c, 'k', 0.035), spd = V.param(c, 'spd', 1);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c, ng)) return;
    var col = nodeCol(c, ng);
    ng.items.forEach(function (it) {
      var sz = it.src.attrs.fontSize, aLen = sz * 0.075, gLen = sz * 0.055, per = aLen + gLen;
      setAttrStroke(it.src, col, Math.max(1.6, sz * k));
      var w = Math.max(it.g.w, sz) * 0.9, h = Math.max(it.g.h, sz) * 0.9;
      function makeBands(off) {
        var polys = [], span = w + h;
        for (var x = -span + off; x < span; x += per) {
          polys.push(V.polygon(x, -h * 0.9, x + aLen, h * 0.9));
        }
        return polys;
      }
      if (!spd) {
        localMultiClip(c.graph, it.tid, makeBands(0), false, 'Dotted mask', c.options);
      } else {
        var frames = [];
        for (var f = it.src.start; f < it.src.end; f++) {
          var ltb = (f - c.cut.origin) / c.comp.fps;
          var off = ((ltb * sz * 0.22) % per + per) % per;
          frames.push(makeBands(off));
        }
        localMultiClip(c.graph, it.tid, frames, false, 'Dotted crawl', c.options);
      }
    });
  });
});

/* alternate — alternating accent color per glyph or kanji/katakana */
reg('alternate', 'src/11p_looks.js', 'glyph', function (c) {
  var v = V.param(c, 'v', 'alt');
  nodeGroups(c).forEach(function (ng, ni) {
    var col = nodeCol(c, ng), c2 = accentFor(c.sc, col, 1.6);
    var chars = ng.gs.map(function (g) { return g.ch; }).filter(function (ch) { return ch.trim(); });
    var isK = function (ch) { return isKanji(ch) || isKata(ch); };
    var mixed = chars.some(isK) && chars.some(function (ch) { return !isK(ch); });
    var mi = ng.node.mi != null ? (ng.node.mi | 0) : ni;
    ng.items.forEach(function (it) {
      var hit = (v === 'kanji' && (mixed || chars.length === 1)) ? isK(it.g.ch) : ((it.idx + mi) % 2 === 1);
      if (hit) setAttrColor(it.src, c2);
    });
  });
});

/* italic — horizontal shear via 2-null decomposition (vertical: per-glyph tilt) */
reg('italic', 'src/11p_looks.js', 'glyph', function (c) {
  var a = V.param(c, 'a', 12.5);
  nodeGroups(c).forEach(function (ng) {
    if (ng.node.vertical) {
      var r = a * 0.65;
      ng.items.forEach(function (it) { V.changeTrack(it.src, 'rotation', function (v) { return (v || 0) - r; }); });
    } else {
      wrapNodeShear(c, ng, -a, 'Italic');
    }
  });
});

/* wide — expanded horizontal aspect ratio */
reg('wide', 'src/11p_looks.js', 'glyph', function (c) {
  nodeGroups(c).forEach(function (ng) {
    var place = c.graph.byId[ng.parent];
    if (!place) return;
    if (!ng.node.vertical) {
      var b = itemBounds(ng), lim = c.comp.width * 0.9;
      V.changeTrack(place, 'scale.x', function (v) { return (v == null ? 1 : v) * 1.1; });
      if (b.w <= lim && b.w * 1.1 > lim) {
        var shrink = lim / (b.w * 1.1);
        V.changeTrack(place, 'scale.x', function (v) { return (v == null ? 1 : v) * shrink; });
        V.changeTrack(place, 'scale.y', function (v) { return (v == null ? 1 : v) * shrink; });
      }
    }
    V.changeTrack(place, 'scale.y', function (v) { return (v == null ? 1 : v) * 0.84; });
  });
});

/* tall — condensed horizontal / tall vertical */
reg('tall', 'src/11p_looks.js', 'glyph', function (c) {
  nodeGroups(c).forEach(function (ng) {
    var place = c.graph.byId[ng.parent];
    if (!place) return;
    V.changeTrack(place, 'scale.x', function (v) { return (v == null ? 1 : v) * 0.8; });
    V.changeTrack(place, 'scale.y', function (v) { return (v == null ? 1 : v) * (ng.node.vertical ? 1.02 : 1.05 * 1.05); });
  });
});

/* echoOutline — pulsing outline echoes behind glyphs */
reg('echoOutline', 'src/11p_looks.js', 'glyph', function (c) {
  var v = V.param(c, 'v', 'diag'), count = V.param(c, 'n', 3), df = V.param(c, 'd', 0.055);
  nodeGroups(c).forEach(function (ng) {
    var col = nodeCol(c, ng), ec = accentFor(c.sc, col, 1.4), sz = ng.node.size;
    ng.items.forEach(function (it) {
      var gx = it.g.x + (it.g.vx || 0), gy = it.g.y + (it.g.vy || 0);
      for (var k = count; k >= 1; k--) {
        var cln = V.cloneLayer(c.graph, it.tid, 'Echo outline ' + k);
        setAttrStroke(cln, ec, Math.max(1.2, sz * 0.02));
        behind(c.graph, cln.id, it.tid);
        (function (kk, cid) {
          var decayA = 0.8 * Math.pow(0.72, kk - 1);
          C.sample(c.graph, cid, it.src.start, it.src.end, function (f) {
            var cp = cutProgress(c, ng, f);
            var amt = E.outCubic(cl((cp.lt - 0.05) / 0.45)) * outK(c, f) * (0.85 + 0.15 * Math.sin(cp.ltb * 3.4));
            var d = sz * df * amt * kk;
            var dx = v === 'zoom' ? 0 : (v === 'rise' ? 0 : (v === 'side' ? d * 1.3 : d));
            var dy = v === 'zoom' ? 0 : (v === 'rise' ? -d * 1.2 : (v === 'side' ? 0 : d));
            var sc = v === 'zoom' ? Math.pow(1 + 0.035 * amt, kk) : 1;
            return {
              'position.x': valAt(it.src, 'position.x', f, gx) + dx,
              'position.y': valAt(it.src, 'position.y', f, -gy) - dy,
              'scale.x': valAt(it.src, 'scale.x', f, 1) * sc,
              'scale.y': valAt(it.src, 'scale.y', f, 1) * sc,
              alpha: amt > 0.01 ? cl(valAt(it.src, 'alpha', f, 1) * decayA * amt) : 0
            };
          });
        })(k, cln.id);
      }
    });
  });
});

/* emphasisDots — bouten dots / rings / sesame marks popping beside glyphs */
reg('emphasisDots', 'src/11p_looks.js', 'glyph', function (c) {
  var v = V.param(c, 'v', 'dot');
  nodeGroups(c).forEach(function (ng) {
    var dc = markCol(c.sc, nodeCol(c, ng)), vert = !!ng.node.vertical, sz = ng.node.size;
    var r = Math.max(2, sz * 0.07);
    ng.items.forEach(function (it) {
      if (isPunct(it.g.ch)) return;
      var ox = vert ? sz * 0.64 : 0, oy = vert ? 0 : -sz * 0.64;
      var cmds, paint;
      if (v === 'ring') {
        cmds = G.ellipse(0, 0, r * 0.85, r * 0.85);
        paint = { stroke: dc, width: Math.max(1, r * 0.42), alpha: 1 };
      } else if (v === 'sesame') {
        cmds = G.ellipse(0, 0, r * 1.25, r * 0.6);
        paint = { fill: dc, alpha: 1 };
      } else {
        cmds = G.ellipse(0, 0, r, r);
        paint = { fill: dc, alpha: 1 };
      }
      var sid = addGlyphShape(c, it, 'Bouten ' + it.idx, cmds, paint, function (f) {
        var cp = cutProgress(c, ng, f);
        var q = E.outBack(cl((cp.lt - cp.inDur * 0.45 - it.idx * 0.04) / 0.22), 2.2) * outK(c, f);
        var sx = valAt(it.src, 'scale.x', f, 1), sy = valAt(it.src, 'scale.y', f, 1);
        var bx = valAt(it.src, 'position.x', f, it.g.x), by = valAt(it.src, 'position.y', f, -it.g.y);
        var al = valAt(it.src, 'alpha', f, 1);
        var sc = Math.max(0.002, q * Math.min(Math.abs(sx), Math.abs(sy)));
        return {
          'position.x': bx + ox,
          'position.y': by - oy,
          'scale.x': sc, 'scale.y': sc,
          rotation: v === 'sesame' ? 40 : 0,
          alpha: q > 0.01 ? cl(al * q) : 0
        };
      }, false);
    });
  });
});

/* ============================================================================
   3. 11p_treattrans.js TREATMENTS (25)
   ============================================================================ */

/* neonOutline — neon stroke tube + wide outer bloom + per-glyph flicker */
reg('neonOutline', 'src/11p_treattrans.js', 'glyph', function (c) {
  var k = V.param(c, 'k', 0.028), fl = V.param(c, 'fl', true);
  nodeGroups(c).forEach(function (ng, ni) {
    if (hasPieceMotion(c, ng)) return;
    var col = nodeCol(c, ng), dk = isDark(c.sc.bg);
    var gc = dk
      ? firstOK([c.sc.accent, c.sc.accent2, c.sc.ghostA, c.sc.ghostB], function (x) { return lum(x) > lum(c.sc.bg) + 0.15 && ctr(x, col) >= 1.2; }, col)
      : firstOK([c.sc.accent, c.sc.accent2, c.sc.ghostA, c.sc.ghostB], function (x) { return ctr(x, c.sc.bg) >= 1.8; }, col);
    var tube = dk ? mixHex(col, '#FFFFFF', 0.4) : col;
    var s0 = seedH((c.cut.source && c.cut.source.seed) || 1, (ng.node.mi != null ? ng.node.mi : ni) + 3, 41);
    ng.items.forEach(function (it) {
      var sz = it.src.attrs.fontSize;
      setAttrStroke(it.src, tube, Math.max(1.4, sz * k));
      [4.5, 8.5].forEach(function (m, bi) {
        var bloom = V.cloneLayer(c.graph, it.tid, 'Neon bloom ' + (bi + 1));
        setAttrStroke(bloom, gc, Math.max(2.5, sz * k * m));
        scaleLayerAlpha(bloom, (dk ? 0.24 : 0.16) * (bi ? 0.45 : 1));
        behind(c.graph, bloom.id, it.tid);
      });
      if (fl) {
        C.sample(c.graph, it.tid, it.src.start, it.src.end, function (f) {
          var step = Math.floor(f / 2), r = rand(s0, it.idx, step);
          var mult = r < 0.03 ? 0.22 : r < 0.05 ? 0.6 : 1;
          return { alpha: cl(valAt(it.src, 'alpha', f, 1) * mult) };
        });
      }
    });
  });
}, ['Neon outer bloom uses layered wide stroke halos instead of gaussianBlur.']);

/* chrome — metallic horizontal multi-stop banding + keyline */
reg('chrome', 'src/11p_treattrans.js', 'glyph', function (c) {
  var v = V.param(c, 'v', 'silver'), h = V.param(c, 'h', 0.53);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c, ng)) return;
    var col = nodeCol(c, ng), light = lum(col) > 0.42, acc = accentFor(c.sc, col, 1.3);
    var top0 = light ? '#FFFFFF' : mixHex(col, '#FFFFFF', 0.55);
    var top1 = light ? mixHex(col, '#000000', 0.42) : col;
    var band = mixHex(col, '#000000', light ? 0.62 : 0.45);
    var low0 = v === 'sunset' ? mixHex(acc, '#FFFFFF', 0.5) : mixHex(col, '#FFFFFF', light ? 0.75 : 0.42);
    var low1 = v === 'sunset' ? acc : mixHex(col, '#000000', light ? 0.12 : 0.25);
    var keyline = light ? mixHex(col, '#000000', 0.7) : mixHex(col, '#000000', 0.35);
    var stops = [[0, top0], [h * 0.55, top1], [h, band], [h + 0.04, low0], [0.76, low1]];
    ng.items.forEach(function (it) {
      var ol = V.cloneLayer(c.graph, it.tid, 'Chrome keyline');
      setAttrStroke(ol, keyline, Math.max(1.2, it.src.attrs.fontSize * 0.022));
      behind(c.graph, ol.id, it.tid);
      applyGradientBands(c, it, stops, 'Chrome', c.options);
    });
  });
}, ['Metallic chrome shading is built from clipped horizontal gradient bands + stroke keyline.']);

/* rainbow — palette color drift or step cycle across glyphs */
reg('rainbow', 'src/11p_treattrans.js', 'glyph', function (c) {
  var v = V.param(c, 'v', 'drift'), sp = V.param(c, 'sp', 0.36), dir = V.param(c, 'dir', 1);
  nodeGroups(c).forEach(function (ng, ni) {
    var col = nodeCol(c, ng);
    if (onPlate(c.sc, col)) return;
    var pal = [col];
    [c.sc.accent, c.sc.accent2, c.sc.ghostA, c.sc.ghostB, c.sc.sub].forEach(function (cand) {
      if (cand && ctr(cand, c.sc.bg) >= 1.8 && pal.every(function (p) { return ctr(p, cand) >= 1.25; })) pal.push(cand);
    });
    if (pal.length < 3) pal.push(H.fitContrast(mixHex(c.sc.accent || '#ff5577', c.sc.accent2 || c.sc.fg, 0.5), c.sc.bg, 2));
    var L = pal.length, off = ng.node.mi != null ? (ng.node.mi | 0) : ni;
    ng.items.forEach(function (it) {
      clearKeys(it.src, 'material.materialColor');
      C.sample(c.graph, it.tid, it.src.start, it.src.end, function (f) {
        var ltb = (f - c.cut.origin) / c.comp.fps;
        var outCol;
        if (v === 'steps') {
          var k = ((it.idx + off + Math.floor(ltb * 2.2) * dir) % L + L) % L;
          outCol = pal[k];
        } else {
          var u = (it.idx + off) * sp - ltb * 0.75 * dir, kk = ((u % L) + L) % L, a = Math.floor(kk);
          var t = H.smoothstep(0.3, 0.7, kk - a);
          outCol = mixHex(pal[a], pal[(a + 1) % L], t);
        }
        return { 'material.materialColor': outCol };
      });
    });
  });
});

/* glitchSplit — two color-plate split copies jolting on glitch steps */
reg('glitchSplit', 'src/11p_treattrans.js', 'glyph', function (c) {
  var df = V.param(c, 'd', 0.07), up = V.param(c, 'up', false);
  nodeGroups(c).forEach(function (ng, ni) {
    if (hasPieceMotion(c, ng)) return;
    var col = nodeCol(c, ng);
    var cands = [c.sc.ghostA, c.sc.ghostB, c.sc.accent, c.sc.accent2].filter(function (x) {
      return x && ctr(x, c.sc.bg) >= 1.4 && ctr(x, col) >= 1.15;
    });
    var cA = cands[0] || accentFor(c.sc, col, 1.4);
    var cB = cands.find ? (cands.filter(function (x) { return ctr(x, cA) >= 1.3; })[0] || mixHex(cA, c.sc.bg, 0.4)) : mixHex(cA, c.sc.bg, 0.4);
    var s0 = seedH((c.cut.source && c.cut.source.seed) || 1, (ng.node.mi != null ? ng.node.mi : ni) + 5, 43);
    var sz = ng.node.size;
    ng.items.forEach(function (it) {
      var gx = it.g.x + (it.g.vx || 0), gy = it.g.y + (it.g.vy || 0);
      [{ label: 'Plate A', col: cA, dir: -1 }, { label: 'Plate B', col: cB, dir: 1 }].forEach(function (sp) {
        var cln = V.cloneLayer(c.graph, it.tid, sp.label);
        setAttrColor(cln, sp.col);
        behind(c.graph, cln.id, it.tid);
        C.sample(c.graph, cln.id, it.src.start, it.src.end, function (f) {
          var step = Math.floor(f / 2), lt = (f - c.cut.origin) / c.comp.fps, inDur = c.cut.inFrames / c.comp.fps;
          var r = rand(s0, step), hit = r < 0.2 && lt > inDur * 0.5;
          var d = sz * df * (hit ? 1.8 + rand(s0, step, 2) : 1);
          var dy = (up ? d * 0.45 : 0) + (hit ? randS(s0, step, 3) * sz * 0.02 : 0);
          return {
            'position.x': valAt(it.src, 'position.x', f, gx) + d * sp.dir,
            'position.y': valAt(it.src, 'position.y', f, -gy) - dy * sp.dir,
            alpha: cl(valAt(it.src, 'alpha', f, 1) * 0.85)
          };
        });
      });
    });
  });
});

/* shadowStack — 3-4 stepped multi-colored drop shadows separated by bg keylines */
reg('shadowStack', 'src/11p_treattrans.js', 'glyph', function (c) {
  var df = V.param(c, 'd', 0.048), dir = V.param(c, 'dir', [1, 1]), n = V.param(c, 'n', 3);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c, ng)) return;
    var col = nodeCol(c, ng), cols = [];
    [c.sc.accent, c.sc.accent2, c.sc.ghostB, c.sc.ghostA, c.sc.ink, c.sc.sub, c.sc.fg].forEach(function (x) {
      if (x && ctr(x, c.sc.bg) >= 1.4 && ctr(x, col) >= 1.12 && cols.every(function (p) { return ctr(p, x) >= 1.12; })) cols.push(x);
    });
    while (cols.length < n) cols.push(mixHex(cols.length ? cols[cols.length - 1] : accentFor(c.sc, col), c.sc.bg, 0.35));
    var d = ng.node.size * df, sw = Math.max(1.5, ng.node.size * 0.028);
    ng.items.forEach(function (it) {
      var fgRim = V.cloneLayer(c.graph, it.tid, 'Stack fg keyline');
      setAttrStroke(fgRim, c.sc.bg, sw);
      behind(c.graph, fgRim.id, it.tid);
      for (var k = 1; k <= n; k++) {
        var fill = V.cloneLayer(c.graph, it.tid, 'Stack shadow ' + k);
        setAttrColor(fill, cols[k - 1]);
        shiftLayer(fill, dir[0] * d * k, dir[1] * d * k);
        var rim = V.cloneLayer(c.graph, fill.id, 'Stack keyline ' + k);
        setAttrStroke(rim, c.sc.bg, sw);
        behind(c.graph, rim.id, fgRim.id);
        behind(c.graph, fill.id, fgRim.id);
      }
    });
  });
});

/* stencilGap — horizontal bridge gaps cut cleanly through glyphs via difference deformer */
reg('stencilGap', 'src/11p_treattrans.js', 'glyph', function (c) {
  var v = V.param(c, 'v', 'one'), at = V.param(c, 'at', 0.01), gf = V.param(c, 'g', 0.04);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c, ng)) return;
    var cuts = v === 'two' ? [-0.13, 0.13] : [at];
    ng.items.forEach(function (it) {
      var hw = Math.max(it.g.w, it.g.h) * 1.15, h = it.g.h;
      var frames = [];
      for (var f = it.src.start; f < it.src.end; f++) {
        var cp = cutProgress(c, ng, f);
        var gAmt = gf * E.outCubic(cl((cp.lt - 0.04) / 0.4)) * outK(c, f);
        if (gAmt < 0.003) {
          frames.push([[[-99999, -99999], [-99998, -99999], [-99999, -99998]]]);
        } else {
          frames.push(cuts.map(function (cAt) {
            return V.polygon(-hw, (-cAt - gAmt) * h, hw, (-cAt + gAmt) * h);
          }));
        }
      }
      localMultiClip(c.graph, it.tid, frames, true, 'Stencil bridges', c.options);
    });
  });
});

/* waterline — outlined glyphs with rising/bobbing liquid fill and meniscus highlight */
reg('waterline', 'src/11p_treattrans.js', 'glyph', function (c) {
  var lvl = V.param(c, 'lvl', 0.52), cc = V.param(c, 'c', 0), k = V.param(c, 'k', 0.023);
  nodeGroups(c).forEach(function (ng, ni) {
    if (hasPieceMotion(c, ng)) return;
    var col = nodeCol(c, ng), liq = cc ? accentFor(c.sc, col, 1.3) : col;
    var surf = mixHex(liq, '#FFFFFF', isDark(liq) ? 0.35 : 0.5), phase = ng.node.mi != null ? (ng.node.mi | 0) : ni;
    ng.items.forEach(function (it) {
      var sz = it.src.attrs.fontSize, w = Math.max(it.g.w, it.g.h) * 1.15, h = it.g.h;
      setAttrStroke(it.src, col, Math.max(1.3, sz * k));
      var liqLayer = V.cloneLayer(c.graph, it.tid, 'Water fill');
      setAttrColor(liqLayer, liq);
      liqLayer.attrs.fill = true; liqLayer.attrs.stroke = false;
      behind(c.graph, liqLayer.id, it.tid);
      var foamLayer = V.cloneLayer(c.graph, it.tid, 'Water meniscus');
      setAttrColor(foamLayer, surf);
      foamLayer.attrs.fill = true; foamLayer.attrs.stroke = false;
      behind(c.graph, foamLayer.id, it.tid);
      var liqFrames = [], foamFrames = [];
      for (var f = it.src.start; f < it.src.end; f++) {
        var cp = cutProgress(c, ng, f);
        var q = E.inOutCubic(cl((cp.lt - 0.05) / 0.8)) * outK(c, f);
        var L = mix(1.02, lvl, q) + Math.sin(cp.ltb * 2.6 + phase) * 0.022 * q;
        var yAE = cl(L) - 0.5;
        var cySurf = -yAE * h;
        liqFrames.push([V.polygon(-w, -h * 0.75, w, Math.max(-h * 0.74, cySurf - h * 0.03))]);
        foamFrames.push([V.polygon(-w, cySurf - h * 0.03, w, cySurf + h * 0.015)]);
      }
      localMultiClip(c.graph, liqLayer.id, liqFrames, false, 'Water level', c.options);
      localMultiClip(c.graph, foamLayer.id, foamFrames, false, 'Water surface', c.options);
    });
  });
});

/* karaoke — color wipe runs through lines over cut duration via clipped highlight clones */
reg('karaoke', 'src/11p_treattrans.js', 'glyph', function (c) {
  var sp = V.param(c, 'sp', 0.78), ol = V.param(c, 'ol', true);
  nodeGroups(c).forEach(function (ng) {
    var col = nodeCol(c, ng);
    if (onPlate(c.sc, col)) return;
    var hot = accentFor(c.sc, col, 1.8), vert = !!ng.node.vertical, spans = itemSpans(ng);
    if (!spans.length) return;
    var tot = spans.reduce(function (a, L) { return a + (L.a1 - L.a0); }, 0);
    var s = ng.node.size, pad = s * 0.14, cr = s * 0.72;
    var oc = bestCol([c.sc.bg, c.sc.ink, '#111111', '#FFFFFF'], col);
    var pMat = S.matrix(c.graph, ng.parent, c.cut.start);
    ng.items.forEach(function (it) {
      if (ol) {
        var rim = V.cloneLayer(c.graph, it.tid, 'Karaoke outline');
        setAttrStroke(rim, oc, Math.max(1.5, it.src.attrs.fontSize * 0.06));
        behind(c.graph, rim.id, it.tid);
      }
      var wiped = V.cloneLayer(c.graph, it.tid, 'Karaoke hot');
      setAttrColor(wiped, hot);
      afterLayer(c.graph, wiped.id, it.tid);
      var byF = Object.create(null);
      for (var f = it.src.start; f < it.src.end; f++) {
        var cp = cutProgress(c, ng, f), t0 = cp.inDur * 0.6, T = Math.max(0.3, (cp.dur - cp.outDur - t0) * sp);
        var q = E.inOutSine(cl((cp.lt - t0) / T));
        if (q <= 0.005) { byF[f] = []; continue; }
        var rem = q * tot, m = S.matrix(c.graph, ng.parent, f) || pMat, polys = [];
        for (var si = 0; si < spans.length && rem > 0; si++) {
          var L = spans[si], len = L.a1 - L.a0, take = Math.min(len, rem); rem -= take;
          var a0 = L.a0 - pad, a1 = L.a0 + take + (take >= len - 0.01 ? pad : 0);
          var rect = vert ? V.polygon(L.c - cr, -a1, L.c + cr, -a0) : V.polygon(a0, -L.c - cr, a1, -L.c + cr);
          polys.push(rect.map(function (pt) { return S.point(m, pt); }));
        }
        byF[f] = polys;
      }
      H.multiClip(c.graph, wiped.id, byF, false, 'Karaoke clip', c.options);
    });
  });
});

/* sizeWave — alternating / script / ramp / wave glyph scaling tightly re-spaced on baseline */
reg('sizeWave', 'src/11p_treattrans.js', 'glyph', function (c) {
  var vP = V.param(c, 'v', 'alt'), kP = V.param(c, 'k', 0.69), rev = V.param(c, 'rev', false);
  nodeGroups(c).forEach(function (ng, ni) {
    var chars = ng.gs.map(function (g) { return g.ch; }).filter(function (ch) { return ch.trim(); });
    var isK = function (ch) { return isKanji(ch) || isKata(ch) || isLatin(ch); };
    var v = vP;
    if (v === 'kanji' && !(chars.some(isK) && chars.some(function (ch) { return !isK(ch); }))) v = 'alt';
    if ((v === 'ramp' || v === 'wave') && chars.length < 3) v = 'alt';
    var off = ng.node.mi != null ? (ng.node.mi | 0) : ni, S = Object.create(null);
    ng.gs.forEach(function (g) {
      var u = g.n > 1 ? g.ci / (g.n - 1) : 0.5, s = 1;
      if (v === 'alt') s = (g.ci + g.li + off) % 2 ? kP : 1.04;
      else if (v === 'kanji') s = isK(g.ch) ? 1.08 : kP + 0.04;
      else if (v === 'ramp') s = mix(1.1, kP, rev ? 1 - u : u);
      else s = 0.87 + 0.17 * Math.sin(g.ci * 1.25 + off);
      if (isPunct(g.ch)) s = Math.min(s, 0.9);
      S[g.i] = s;
    });
    var vert = !!ng.node.vertical, size0 = ng.node.size, tr = (ng.node.track || 0) * size0;
    var byLine = Object.create(null);
    ng.gs.forEach(function (g) { (byLine[g.li] = byLine[g.li] || []).push(g); });
    var shift = Object.create(null);
    Object.keys(byLine).forEach(function (li) {
      var gs = byLine[li];
      var ext = function (g) { return vert ? g.h : g.w; }, pos = function (g) { return vert ? g.y : g.x; };
      var tot = gs.reduce(function (a, g) { return a + ext(g) * S[g.i]; }, 0) + tr * Math.max(0, gs.length - 1);
      var old0 = pos(gs[0]) - ext(gs[0]) / 2, old1 = pos(gs[gs.length - 1]) + ext(gs[gs.length - 1]) / 2;
      var p = ng.node.align === 'left' ? old0 : (ng.node.align === 'right' && !vert) ? old1 - tot : (old0 + old1) / 2 - tot / 2;
      gs.forEach(function (g) {
        var w = ext(g) * S[g.i];
        shift[g.i] = p + w / 2 - pos(g);
        p += w + tr;
      });
    });
    ng.items.forEach(function (it) {
      var s = S[it.idx] || 1, d = shift[it.idx] || 0;
      V.changeTrack(it.src, 'scale.x', function (val) { return (val == null ? 1 : val) * s; });
      V.changeTrack(it.src, 'scale.y', function (val) { return (val == null ? 1 : val) * s; });
      shiftLayer(it.src, vert ? 0 : d, vert ? d : (1 - s) * 0.4 * it.g.h);
    });
  });
});

/* rotateAlt — alternating hand-set tilt per character */
reg('rotateAlt', 'src/11p_treattrans.js', 'glyph', function (c) {
  var a = V.param(c, 'a', 11.5), v = V.param(c, 'v', 'alt');
  nodeGroups(c).forEach(function (ng, ni) {
    var off = ng.node.mi != null ? (ng.node.mi | 0) : ni;
    var s0 = seedH((c.cut.source && c.cut.source.seed) || 1, off + 9, 47);
    ng.items.forEach(function (it) {
      if (isPunct(it.g.ch)) return;
      var sg = (it.idx + off) % 2 ? 1 : -1;
      var r = v === 'rand' ? sg * a * randR(0.45, 1.25, s0, it.idx) : sg * a;
      V.changeTrack(it.src, 'rotation', function (val) { return (val || 0) - r; });
      V.changeTrack(it.src, 'scale.x', function (val) { return (val == null ? 1 : val) * 0.94; });
      V.changeTrack(it.src, 'scale.y', function (val) { return (val == null ? 1 : val) * 0.94; });
    });
  });
});

/* baselineShift — alternating up/down, stairs, or arch baseline shift */
reg('baselineShift', 'src/11p_treattrans.js', 'glyph', function (c) {
  var v = V.param(c, 'v', 'alt'), k = V.param(c, 'k', 0.095), dir = V.param(c, 'dir', 1);
  nodeGroups(c).forEach(function (ng, ni) {
    var off = ng.node.mi != null ? (ng.node.mi | 0) : ni, vert = !!ng.node.vertical;
    var kk = String(ng.node.text || '').indexOf('\n') >= 0 ? 0.7 : 1;
    ng.items.forEach(function (it) {
      var u = it.g.n > 1 ? it.g.ci / (it.g.n - 1) : 0.5, o;
      if (v === 'stairs') o = (u - 0.5) * k * Math.min(3.2, it.g.n * 0.55) * dir;
      else if (v === 'arc') o = (Math.sin(Math.PI * u) - 0.6) * k * 2.2;
      else o = ((it.g.ci + off) % 2 ? 1 : -1) * k;
      shiftLayer(it.src, vert ? o * kk * it.g.w : 0, vert ? 0 : -o * kk * it.g.h);
    });
  });
});

/* fauxBold — same-color outer stroke + slight extra tracking */
reg('fauxBold', 'src/11p_treattrans.js', 'glyph', function (c) {
  var k = V.param(c, 'k', 0.042);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c, ng)) return;
    var col = nodeCol(c, ng);
    ng.items.forEach(function (it) {
      var sz = it.src.attrs.fontSize;
      var bold = V.cloneLayer(c.graph, it.tid, 'Faux bold stroke');
      setAttrStroke(bold, col, Math.max(1, sz * k));
      behind(c.graph, bold.id, it.tid);
      var dx = (it.g.ci - (it.g.n - 1) / 2) * sz * k;
      if (!ng.node.vertical) { shiftLayer(it.src, dx, 0); shiftLayer(bold, dx, 0); }
      else { shiftLayer(it.src, 0, dx); shiftLayer(bold, 0, dx); }
    });
  });
});

/* circled — each character enclosed in its own popping circle ring or solid disc */
reg('circled', 'src/11p_treattrans.js', 'glyph', function (c) {
  var v = V.param(c, 'v', 'ring'), k = V.param(c, 'k', 0.71);
  nodeGroups(c).forEach(function (ng) {
    var col = nodeCol(c, ng), disc = v === 'disc';
    if (onPlate(c.sc, col)) return;
    var rc = disc
      ? firstOK([c.sc.accent, c.sc.accent2, c.sc.ink, c.sc.fg], function (x) { return ctr(x, c.sc.bg) >= 2 && ctr(x, col) >= 1.3; }, c.sc.fg)
      : markCol(c.sc, col);
    var tc = disc ? textOn(rc, col, c.sc) : col;
    ng.items.forEach(function (it) {
      if (isPunct(it.g.ch)) return;
      var sz = it.src.attrs.fontSize, r = Math.max(2, sz * 0.49);
      V.changeTrack(it.src, 'scale.x', function (val) { return (val == null ? 1 : val) * k; });
      V.changeTrack(it.src, 'scale.y', function (val) { return (val == null ? 1 : val) * k; });
      if (disc && tc !== col) {
        clearKeys(it.src, 'material.materialColor');
        C.sample(c.graph, it.tid, it.src.start, it.src.end, function (f) {
          var cp = cutProgress(c, ng, f);
          var q = E.outBack(cl((cp.lt - it.idx * 0.04) / 0.26), 1.6) * (1 - E.inCubic(cl((1 - outK(c, f)) * 1.4 - it.idx * 0.03)));
          return { 'material.materialColor': q > 0.55 ? tc : col };
        });
      }
      var paint = disc ? { fill: rc, alpha: 1 } : { stroke: rc, width: Math.max(1.5, sz * 0.045), alpha: 1 };
      addGlyphShape(c, it, 'Circle', G.ellipse(0, 0, r * (disc ? 1 : 0.97), r * (disc ? 1 : 0.97)), paint, function (f) {
        var cp = cutProgress(c, ng, f);
        var pout = cl((f - (c.cut.sourceEnd - c.cut.outFrames)) / Math.max(1, c.cut.outFrames));
        var q = E.outBack(cl((cp.lt - it.idx * 0.04) / 0.26), 1.6) * (1 - E.inCubic(cl(pout * 1.4 - it.idx * 0.03)));
        var sx = valAt(it.src, 'scale.x', f, k) / k, sy = valAt(it.src, 'scale.y', f, k) / k;
        var s = Math.max(0.002, q * Math.min(Math.abs(sx), Math.abs(sy)));
        return {
          'position.x': valAt(it.src, 'position.x', f, it.g.x),
          'position.y': valAt(it.src, 'position.y', f, -it.g.y),
          'scale.x': s, 'scale.y': s,
          alpha: q > 0.01 ? cl(valAt(it.src, 'alpha', f, 1) * q) : 0
        };
      }, true);
    });
  });
});

/* bracketsQuote — 「 」 corner brackets around first/last glyph spans */
reg('bracketsQuote', 'src/11p_treattrans.js', 'glyph', function (c) {
  var v = V.param(c, 'v', 'single'), k = V.param(c, 'k', 0.056);
  var ngs = nodeGroups(c);
  if (!ngs.length) return;
  var whole = String((c.cut.source && c.cut.source.text) || ngs.map(function (ng) { return ng.node.text; }).join('')).replace(/[\s\u3000]/g, '');
  var hasWhole = ngs.some(function (ng) { return String(ng.node.text || '').replace(/[\s\u3000]/g, '') === whole; });
  ngs.forEach(function (ng, ni) {
    var mine = String(ng.node.text || '').replace(/[\s\u3000]/g, '');
    if (!mine || !whole) return;
    var open = whole.indexOf(mine) === 0, close = whole.slice(-mine.length) === mine;
    if (Array.from(mine).length === 1 && !hasWhole) {
      open = ni === 0;
      close = ni === ngs.length - 1;
    }
    if (!open && !close) return;
    var spans = itemSpans(ng);
    if (!spans.length) return;
    var lc = markCol(c.sc, nodeCol(c, ng)), vert = !!ng.node.vertical;
    var s = ng.node.size, lw = Math.max(1.5, s * k), g = s * 0.3, arm = s * 0.36, leg = s * 0.74;
    var L0 = spans[0], L1 = spans[spans.length - 1];
    function addCorner(name, pts) {
      var sid = addLocalShape(c, ng, name, localCmds(pts, false), { stroke: lc, width: lw, alpha: 1 }, null, function (f) {
        var cp = cutProgress(c, ng, f), q = E.outCubic(cl((cp.lt - cp.inDur * 0.45) / 0.35)) * outK(c, f);
        return { alpha: q > 0.01 ? cl(q) : 0 };
      });
      afterLayer(c.graph, sid, ng.lastTid);
    }
    function one(d, suf) {
      if (!vert) {
        var xL = L0.a0 - g - d, yT = L0.c - s * 0.52 - d, xR = L1.a1 + g + d, yB = L1.c + s * 0.52 + d;
        if (open) addCorner('Quote open' + suf, [[xL + arm, yT], [xL, yT], [xL, yT + leg]]);
        if (close) addCorner('Quote close' + suf, [[xR - arm, yB], [xR, yB], [xR, yB - leg]]);
      } else {
        var xr = L0.c + s * 0.52 + d, yt = L0.a0 - g - d, xl = L1.c - s * 0.52 - d, yb = L1.a1 + g + d;
        if (open) addCorner('Quote open' + suf, [[xr, yt + arm], [xr, yt], [xr - leg, yt]]);
        if (close) addCorner('Quote close' + suf, [[xl, yb - arm], [xl, yb], [xl + leg, yb]]);
      }
    }
    one(0, '');
    if (v === 'double') one(-lw * 2.2, ' inner');
  });
});

/* reflection — vertically flipped fading floor reflection */
reg('reflection', 'src/11p_treattrans.js', 'glyph', function (c) {
  var k = V.param(c, 'k', 0.68), aFrac = V.param(c, 'a', 0.4), gapF = V.param(c, 'gap', 0.06);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c, ng)) return;
    var b = itemBounds(ng), s = ng.node.size, gap = s * gapF;
    var floorY = b.y1 + gap;
    ng.items.forEach(function (it) {
      var cln = V.cloneLayer(c.graph, it.tid, 'Reflection');
      behind(c.graph, cln.id, it.tid);
      C.sample(c.graph, cln.id, it.src.start, it.src.end, function (f) {
        var bx = valAt(it.src, 'position.x', f, it.g.x), byAE = -valAt(it.src, 'position.y', f, -it.g.y);
        var sy = valAt(it.src, 'scale.y', f, 1), rot = valAt(it.src, 'rotation', f, 0);
        var ryAE = floorY + (floorY - byAE) * k;
        return {
          'position.x': bx,
          'position.y': -ryAE,
          'scale.x': valAt(it.src, 'scale.x', f, 1),
          'scale.y': -sy * k,
          rotation: -rot,
          alpha: cl(valAt(it.src, 'alpha', f, 1) * aFrac * 0.65)
        };
      });
    });
  });
});

/* sticker — die-cut paper sticker border, keyline, drop shadow & slight tilt */
reg('sticker', 'src/11p_treattrans.js', 'glyph', function (c) {
  var k = V.param(c, 'k', 0.15), rot = V.param(c, 'rot', 3), sh = V.param(c, 'sh', 0.042);
  nodeGroups(c).forEach(function (ng, ni) {
    if (hasPieceMotion(c, ng)) return;
    var col = nodeCol(c, ng), dk = isDark(c.sc.bg);
    var paper = firstOK([c.sc.ink, c.sc.fg, c.sc.sub], function (x) { return lum(x) > 0.78; }, '#FFFFFF');
    var key = ctr(col, paper) < 2.5 ? firstOK([c.sc.accent, c.sc.accent2, c.sc.ghostB, c.sc.ghostA], function (x) {
      return ctr(x, paper) >= 2.2 && ctr(x, col) >= 1.8;
    }, '#111111') : null;
    var edge = mixHex(paper, '#000000', 0.16);
    var mi = ng.node.mi != null ? (ng.node.mi | 0) : ni;
    var tilt = rot * (mi % 2 ? -0.7 : 1);
    var place = c.graph.byId[ng.parent];
    if (place && (!ng.node.vertical || ng.gs.length <= 4)) {
      V.changeTrack(place, 'rotation', function (val) { return (val || 0) - tilt; });
    }
    ng.items.forEach(function (it) {
      var sz = it.src.attrs.fontSize;
      var shadow = V.cloneLayer(c.graph, it.tid, 'Sticker shadow');
      setAttrStroke(shadow, '#000000', sz * (k + 0.018));
      scaleLayerAlpha(shadow, dk ? 0.45 : 0.25);
      shiftLayer(shadow, sz * 0.015, sz * sh);
      behind(c.graph, shadow.id, it.tid);
      var rim = V.cloneLayer(c.graph, it.tid, 'Sticker edge');
      setAttrStroke(rim, edge, sz * (k + 0.016));
      behind(c.graph, rim.id, it.tid);
      var pap = V.cloneLayer(c.graph, it.tid, 'Sticker paper');
      setAttrStroke(pap, paper, sz * k);
      behind(c.graph, pap.id, it.tid);
      if (key) {
        var kl = V.cloneLayer(c.graph, it.tid, 'Sticker keyline');
        setAttrStroke(kl, key, sz * 0.07);
        behind(c.graph, kl.id, it.tid);
      }
    });
  });
});

/* gradientSweep — animated metallic glint / tide sweeping across glyphs */
reg('gradientSweep', 'src/11p_treattrans.js', 'glyph', function (c) {
  var v = V.param(c, 'v', 'glint'), per = V.param(c, 'per', 1.9), ph = V.param(c, 'ph', 0);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c, ng)) return;
    var col = nodeCol(c, ng);
    var hl = v === 'tide'
      ? mixHex(accentFor(c.sc, col, 1.5), '#FFFFFF', 0.45)
      : (lum(col) > 0.6 ? firstOK([c.sc.accent, c.sc.accent2, c.sc.ghostA], function (x) { return lum(x) > 0.3 && ctr(x, col) >= 1.3; }, mixHex(col, c.sc.bg, 0.45)) : mixHex(col, '#FFFFFF', 0.72));
    var c2 = v === 'tide' ? accentFor(c.sc, col, 1.5) : hl;
    ng.items.forEach(function (it) {
      var band = V.cloneLayer(c.graph, it.tid, 'Sweep glint');
      setAttrColor(band, c2);
      afterLayer(c.graph, band.id, it.tid);
      var w = Math.max(it.g.w, it.g.h) * 1.15, h = it.g.h;
      var frames = [];
      for (var f = it.src.start; f < it.src.end; f++) {
        var ltb = (f - c.cut.origin) / c.comp.fps;
        var t = ltb / per + ph;
        var u = v === 'tide' ? 0.52 + 0.3 * Math.sin(t * TAU) : ((t % 1) * 1.7 - 0.35);
        if (v === 'tide') {
          var cy = -(u - 0.5) * h;
          frames.push([V.polygon(-w, -h * 0.7, w, cy)]);
        } else {
          var c0 = -((u + 0.14) - 0.5) * h, c1 = -((u - 0.14) - 0.5) * h;
          frames.push([V.polygon(-w, c0, w, Math.max(c0 + 1, c1))]);
        }
      }
      localMultiClip(c.graph, band.id, frames, false, 'Sweep band', c.options);
    });
  });
});

/* kerningWide — expanded glyph spacing keeping composition width capped */
reg('kerningWide', 'src/11p_treattrans.js', 'glyph', function (c) {
  var t = V.param(c, 't', 0.42), grow = V.param(c, 'grow', 1.09);
  nodeGroups(c).forEach(function (ng) {
    if (ng.gs.length < 2) return;
    var vert = !!ng.node.vertical, b = itemBounds(ng), a0 = vert ? b.h : b.w;
    var add = (vert ? t * 0.7 : t) * ng.node.size;
    var byLine = Object.create(null);
    ng.gs.forEach(function (g) { (byLine[g.li] = byLine[g.li] || []).push(g); });
    var shifts = Object.create(null), maxAlong = a0;
    Object.keys(byLine).forEach(function (li) {
      var gs = byLine[li], n = gs.length, extraTot = Math.max(0, n - 1) * add;
      maxAlong = Math.max(maxAlong, a0 + extraTot);
      gs.forEach(function (g, k) {
        var d = ng.node.align === 'left' ? k * add : ng.node.align === 'right' && !vert ? (k - (n - 1)) * add : (k - (n - 1) / 2) * add;
        shifts[g.i] = d;
      });
    });
    var cap = (vert ? c.comp.height : c.comp.width) * 0.9;
    var sc = Math.min(1, (a0 * grow) / Math.max(1, maxAlong));
    if (maxAlong * sc > cap && a0 <= cap) sc = Math.min(sc, cap / maxAlong);
    sc = Math.max(0.55, sc);
    ng.items.forEach(function (it) {
      var d = shifts[it.idx] || 0;
      shiftLayer(it.src, vert ? 0 : d, vert ? d : 0);
      if (sc < 0.999) {
        V.changeTrack(it.src, 'position.x', function (val) { return val * sc; });
        V.changeTrack(it.src, 'position.y', function (val) { return val * sc; });
        V.changeTrack(it.src, 'scale.x', function (val) { return (val == null ? 1 : val) * sc; });
        V.changeTrack(it.src, 'scale.y', function (val) { return (val == null ? 1 : val) * sc; });
      }
    });
  });
});

/* monoGrid — manuscript square-cell grid (genkouyoushi) snapping glyphs + drawn cells */
reg('monoGrid', 'src/11p_treattrans.js', 'glyph', function (c) {
  var pitch = V.param(c, 'pitch', 1.22), cc = V.param(c, 'c', 1);
  nodeGroups(c).forEach(function (ng) {
    var col = nodeCol(c, ng), vert = !!ng.node.vertical;
    var lc = cc ? firstOK([c.sc.accent, c.sc.accent2], function (x) { return ctr(x, c.sc.bg) >= 1.5; }, c.sc.sub) : c.sc.sub;
    var sz = ng.node.size, cell = pitch * sz, lw = Math.max(1, sz * 0.013), gut = cell * 0.24;
    function tgt(g) {
      if (ng.node.align === 'left') return (g.ci + 0.5) * cell;
      if (ng.node.align === 'right' && !vert) return -(g.n - g.ci - 0.5) * cell;
      return (g.ci - (g.n - 1) / 2) * cell;
    }
    ng.items.forEach(function (it) {
      var d = tgt(it.g) - (vert ? it.g.y : it.g.x);
      shiftLayer(it.src, vert ? 0 : d, vert ? d : 0);
      V.changeTrack(it.src, 'scale.x', function (val) { return (val == null ? 1 : val) * 0.86; });
      V.changeTrack(it.src, 'scale.y', function (val) { return (val == null ? 1 : val) * 0.86; });
    });
    if (ng.gs.length < 2 || onPlate(c.sc, col)) return;
    var tint = mixHex(c.sc.bg, lc, isDark(c.sc.bg) ? 0.1 : 0.08);
    var rows = Object.create(null);
    ng.gs.forEach(function (g) { if (!rows[g.li]) rows[g.li] = g; });
    Object.keys(rows).forEach(function (li) {
      var g = rows[li], n = g.n; if (!n) return;
      var c0 = tgt({ ci: 0, n: n }) - cell / 2, len = n * cell, cross = vert ? g.x : g.y;
      var v0 = cross - cell / 2, v1 = cross + cell / 2;
      var rPts = vert ? [[v0, c0], [v1, c0], [v1, c0 + len], [v0, c0 + len]] : [[c0, v0], [c0 + len, v0], [c0 + len, v1], [c0, v1]];
      var bgId = addLocalShape(c, ng, 'Grid fill ' + li, localCmds(rPts, true), { fill: tint, alpha: 0.9 }, null, function (f) {
        var cp = cutProgress(c, ng, f), q = E.outCubic(cl(cp.lt / 0.45)) * outK(c, f);
        return { alpha: q > 0.01 ? cl(0.9 * q) : 0 };
      });
      behind(c.graph, bgId, ng.firstTid);
      var ruleCmds = [];
      var addRule = function (p0, p1) { ruleCmds.push(['M', p0[0], -p0[1]], ['L', p1[0], -p1[1]]); };
      addRule(vert ? [v0, c0] : [c0, v0], vert ? [v0, c0 + len] : [c0 + len, v0]);
      addRule(vert ? [v1, c0] : [c0, v1], vert ? [v1, c0 + len] : [c0 + len, v1]);
      var gv = vert ? v1 + gut : v0 - gut;
      addRule(vert ? [gv, c0 - cell * 0.1] : [c0 - cell * 0.1, gv], vert ? [gv, c0 + len + cell * 0.1] : [c0 + len + cell * 0.1, gv]);
      for (var k = 0; k <= n; k++) {
        var p = c0 + k * cell;
        addRule(vert ? [v0, p] : [p, v0], vert ? [v1, p] : [p, v1]);
      }
      var lyrId = addLocalShape(c, ng, 'Grid lines ' + li, ruleCmds, { stroke: lc, width: lw, alpha: 0.85 }, null, function (f) {
        var cp = cutProgress(c, ng, f), q = E.outCubic(cl(cp.lt / 0.45)) * outK(c, f);
        return { alpha: q > 0.01 ? cl(0.85 * q) : 0 };
      });
      behind(c.graph, lyrId, ng.firstTid);
    });
  });
});

/* toneShadow — offset halftone/hatch/stripes screen-tone shadow */
reg('toneShadow', 'src/11p_treattrans.js', 'glyph', function (c) {
  var v = V.param(c, 'v', 'dots'), df = V.param(c, 'd', 0.105), dir = V.param(c, 'dir', [1, 1]);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c, ng)) return;
    var col = nodeCol(c, ng), tc = firstOK([c.sc.accent, c.sc.accent2, c.sc.fg, c.sc.ink], function (x) {
      return ctr(x, c.sc.bg) >= 2.2 && ctr(x, col) >= 1.3;
    }, markCol(c.sc, col));
    var d = ng.node.size * df;
    ng.items.forEach(function (it) {
      var cln = V.cloneLayer(c.graph, it.tid, 'Tone shadow');
      setAttrColor(cln, tc);
      shiftLayer(cln, dir[0] * d, dir[1] * d);
      behind(c.graph, cln.id, it.tid);
      localMultiClip(c.graph, cln.id, patternPolys(v, it.g), false, 'Tone pattern', c.options);
    });
  });
});

/* fadeChars — trailing opacity fade along head / tail / both ends */
reg('fadeChars', 'src/11p_treattrans.js', 'glyph', function (c) {
  var v = V.param(c, 'v', 'tail'), lo = V.param(c, 'lo', 0.35);
  nodeGroups(c).forEach(function (ng) {
    ng.items.forEach(function (it) {
      if (it.g.n < 3) return;
      var u = it.g.ci / (it.g.n - 1);
      var f = v === 'both' ? Math.pow(Math.abs(u - 0.5) * 2, 1.4) : v === 'head' ? E.inQuad(1 - u) : E.inQuad(u);
      scaleLayerAlpha(it.src, 1 - (1 - lo) * f);
    });
  });
});

/* cutShift — glyph horizontally/vertically sliced with lower half sliding off */
reg('cutShift', 'src/11p_treattrans.js', 'glyph', function (c) {
  var at = V.param(c, 'at', -0.01), df = V.param(c, 'd', 0.135), showLine = V.param(c, 'line', true);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c, ng)) return;
    var vert = !!ng.node.vertical, lc = accentFor(c.sc, nodeCol(c, ng), 1.6), s = ng.node.size;
    ng.items.forEach(function (it) {
      var cln = V.cloneLayer(c.graph, it.tid, 'Cut shift half B');
      behind(c.graph, cln.id, it.tid);
      var w = Math.max(it.g.w, s) * 1.15, h = Math.max(it.g.h, s) * 1.15;
      if (vert) {
        localMultiClip(c.graph, it.tid, [V.polygon(-w * 0.75, -h, at * w, h)], false, 'Cut half A', c.options);
        localMultiClip(c.graph, cln.id, [V.polygon(at * w, -h, w * 0.75, h)], false, 'Cut half B', c.options);
      } else {
        clipSliceY(c.graph, it.tid, it.g, -0.75, at, 'Cut half A', c.options);
        clipSliceY(c.graph, cln.id, it.g, at, 0.75, 'Cut half B', c.options);
      }
      var gx = it.g.x + (it.g.vx || 0), gy = it.g.y + (it.g.vy || 0);
      C.sample(c.graph, cln.id, it.src.start, it.src.end, function (f) {
        var cp = cutProgress(c, ng, f), q = E.outBack(cl((cp.lt - cp.inDur * 0.55) / 0.3), 2.2) * outK(c, f);
        var d = s * df * q;
        return {
          'position.x': valAt(it.src, 'position.x', f, gx) + (vert ? 0 : d),
          'position.y': valAt(it.src, 'position.y', f, -gy) - (vert ? d : 0),
          alpha: valAt(it.src, 'alpha', f, 1)
        };
      });
    });
    if (showLine) {
      itemSpans(ng).forEach(function (L, li) {
        var cpCross = L.c + at * s, ex = s * 0.35;
        var p0 = vert ? [cpCross, L.a0 - ex] : [L.a0 - ex, cpCross], p1 = vert ? [cpCross, L.a1 + ex] : [L.a1 + ex, cpCross];
        var sid = addLocalShape(c, ng, 'Cut seam ' + li, localCmds([p0, p1], false), { stroke: lc, width: Math.max(1.2, s * 0.012), alpha: 1 }, null, function (f) {
          var cp = cutProgress(c, ng, f), q = E.outBack(cl((cp.lt - cp.inDur * 0.55) / 0.3), 2.2) * outK(c, f);
          return { alpha: q > 0.02 ? cl(q) : 0 };
        });
        afterLayer(c.graph, sid, ng.lastTid);
      });
    }
  });
});

/* focusPull — sharpness band sweeps across glyphs; out-of-focus glyphs get soft outer halo + dimmed alpha */
reg('focusPull', 'src/11p_treattrans.js', 'glyph', function (c) {
  var b = V.param(c, 'b', 0.042), rev = V.param(c, 'rev', false);
  var ngs = nodeGroups(c);
  if (!ngs.length) return;
  var whole = glyphN(ngs.map(function (ng) { return ng.node.text; }).join(''));
  ngs.forEach(function (ng, ni) {
    var N = ng.gs.length, mi = ng.node.mi != null ? ng.node.mi : ni;
    if (N < 3 && whole < 3) return;
    ng.items.forEach(function (it) {
      var pos = N >= 3 ? it.idx / Math.max(1, N - 1) : mi / Math.max(1, whole - 1);
      var col = valAt(it.src, 'material.materialColor', c.cut.start, nodeCol(c, ng));
      var halo = V.cloneLayer(c.graph, it.tid, 'Focus soften halo');
      setAttrStroke(halo, col, Math.max(2, it.src.attrs.fontSize * b * 1.5));
      behind(c.graph, halo.id, it.tid);
      C.sample(c.graph, halo.id, it.src.start, it.src.end, function (f) {
        var cp = cutProgress(c, ng, f), f0 = cl((cp.lt - cp.inDur * 0.4) / Math.max(0.4, cp.dur - cp.outDur - cp.inDur * 0.4));
        var foc = mix(-0.15, 1.15, rev ? 1 - f0 : f0);
        var d = cl(Math.abs(pos - foc) * 2.4 - 0.2);
        return { alpha: d > 0.02 ? cl(valAt(it.src, 'alpha', f, 1) * 0.32 * d) : 0 };
      });
      C.sample(c.graph, it.tid, it.src.start, it.src.end, function (f) {
        var cp = cutProgress(c, ng, f), f0 = cl((cp.lt - cp.inDur * 0.4) / Math.max(0.4, cp.dur - cp.outDur - cp.inDur * 0.4));
        var foc = mix(-0.15, 1.15, rev ? 1 - f0 : f0);
        var d = cl(Math.abs(pos - foc) * 2.4 - 0.2);
        return { alpha: cl(valAt(it.src, 'alpha', f, 1) * (1 - 0.35 * d)) };
      });
    });
  });
}, ['Rack focus blur halo simulated via soft stroke silhouette + focus falloff opacity without gaussianBlur.']);

/* spotChar — single kanji/key glyph highlighted on disc, diamond, or square badge */
reg('spotChar', 'src/11p_treattrans.js', 'glyph', function (c) {
  var v = V.param(c, 'v', 'disc'), k = V.param(c, 'k', 1.1), rPick = V.param(c, 'r', 0.3);
  var ngs = nodeGroups(c);
  if (!ngs.length) return;
  var candidates = [];
  ngs.forEach(function (ng) {
    ng.items.forEach(function (it) {
      if (!isSp(it.g.ch) && !isPunct(it.g.ch)) candidates.push({ ng: ng, it: it });
    });
  });
  if (!candidates.length) return;
  var kan = candidates.filter(function (x) { return isKanji(x.it.g.ch); });
  var kat = candidates.filter(function (x) { return isKata(x.it.g.ch); });
  var pool = kan.length ? kan : kat.length ? kat : candidates;
  var picked = pool[Math.floor(rPick * pool.length) % pool.length];
  var ng = picked.ng, it = picked.it, col = nodeCol(c, ng);
  if (onPlate(c.sc, col)) return;
  var pc = firstOK([c.sc.accent, c.sc.accent2, c.sc.ink, c.sc.fg], function (x) {
    return ctr(x, c.sc.bg) >= 2 && ctr(x, col) >= 1.4;
  }, accentFor(c.sc, col, 1.6));
  var tc = textOn(pc, col, c.sc);
  V.changeTrack(it.src, 'scale.x', function (val) { return (val == null ? 1 : val) * k; });
  V.changeTrack(it.src, 'scale.y', function (val) { return (val == null ? 1 : val) * k; });
  if (tc !== col) {
    clearKeys(it.src, 'material.materialColor');
    C.sample(c.graph, it.tid, it.src.start, it.src.end, function (f) {
      var cp = cutProgress(c, ng, f), pout = cl((f - (c.cut.sourceEnd - c.cut.outFrames)) / Math.max(1, c.cut.outFrames));
      var q = E.outBack(cl((cp.lt - cp.inDur * 0.5) / 0.3), 1.8) * (1 - E.inCubic(cl(pout * 1.3)));
      return { 'material.materialColor': q > 0.5 ? tc : col };
    });
  }
  var sz = it.src.attrs.fontSize * k;
  var cmds = v === 'disc' ? G.ellipse(0, 0, sz * 0.64, sz * 0.64) : G.rect(-sz * 0.62, -sz * 0.62, sz * 1.24, sz * 1.24);
  addGlyphShape(c, it, 'Spot badge', cmds, { fill: pc, alpha: 1 }, function (f) {
    var cp = cutProgress(c, ng, f), pout = cl((f - (c.cut.sourceEnd - c.cut.outFrames)) / Math.max(1, c.cut.outFrames));
    var q = E.outBack(cl((cp.lt - cp.inDur * 0.5) / 0.3), 1.8) * (1 - E.inCubic(cl(pout * 1.3)));
    var sc = Math.max(0.002, q);
    var rot = v === 'disc' ? 0 : (v === 'diamond' ? 45 : -6) + (1 - q) * 40;
    return {
      'position.x': valAt(it.src, 'position.x', f, it.g.x),
      'position.y': valAt(it.src, 'position.y', f, -it.g.y),
      'scale.x': sc, 'scale.y': sc,
      rotation: valAt(it.src, 'rotation', f, 0) - rot,
      alpha: q > 0.01 ? cl(valAt(it.src, 'alpha', f, 1)) : 0
    };
  }, true);
});

/* ransom — each glyph sits on an uneven cutout paper scrap, tilted & resized */
reg('ransom', 'src/11p_treattrans.js', 'glyph', function (c) {
  var seed = V.param(c, 's', 1357);
  nodeGroups(c).forEach(function (ng, ni) {
    var col = nodeCol(c, ng);
    if (onPlate(c.sc, col)) return;
    var s0 = seedH(seed, (ng.node.mi != null ? ng.node.mi : ni) | 0, 53);
    var plates = [];
    [c.sc.ink, c.sc.fg, c.sc.accent, c.sc.accent2, c.sc.sub, c.sc.ghostB].forEach(function (x) {
      if (x && ctr(x, c.sc.bg) >= 1.5 && plates.every(function (p) { return ctr(p, x) >= 1.2; })) plates.push(x);
    });
    if (!plates.length) plates.push(H.fitContrast(c.sc.accent || '#ff5577', c.sc.bg, 2));
    ng.items.forEach(function (it) {
      if (isSp(it.g.ch)) return;
      var k = it.idx, pc = plates[seedH(s0, k, 1) % plates.length];
      var alt = bestCol([c.sc.bg, col, c.sc.fg, c.sc.ink, '#111111', '#FFFFFF'].filter(function (x) { return x !== pc; }), pc);
      var tc = ctr(col, pc) >= 3 && rand(s0, k, 2) < 0.5 ? col : alt;
      var rot = randS(s0, k, 3) * 8, sc0 = randR(0.84, 1.02, s0, k, 4), dyF = randS(s0, k, 5) * 0.05;
      var pad = [randR(0.06, 0.16, s0, k, 6), randR(0.06, 0.16, s0, k, 7), randR(0.06, 0.16, s0, k, 8), randR(0.06, 0.16, s0, k, 9)];
      var j = [0, 1, 2, 3].map(function (q) { return randS(s0, k, 10 + q) * 0.06; });
      V.changeTrack(it.src, 'rotation', function (val) { return (val || 0) - rot; });
      V.changeTrack(it.src, 'scale.x', function (val) { return (val == null ? 1 : val) * sc0; });
      V.changeTrack(it.src, 'scale.y', function (val) { return (val == null ? 1 : val) * sc0; });
      shiftLayer(it.src, 0, dyF * it.g.h);
      clearKeys(it.src, 'material.materialColor');
      C.sample(c.graph, it.tid, it.src.start, it.src.end, function (f) {
        var cp = cutProgress(c, ng, f), pout = cl((f - (c.cut.sourceEnd - c.cut.outFrames)) / Math.max(1, c.cut.outFrames));
        var q = E.outBack(cl((cp.lt - k * 0.03) / 0.22), 1.5) * (1 - E.inCubic(cl(pout * 1.4 - k * 0.03)));
        return { 'material.materialColor': q > 0.5 ? tc : col };
      });
      var S = ng.node.size, w = Math.max(it.g.w, S * 0.55) / 2, h = S / 2;
      var poly = localCmds([
        [-w - pad[0] * S, -h - pad[1] * S + j[0] * S],
        [w + pad[2] * S, -h - pad[1] * S + j[1] * S],
        [w + pad[2] * S + j[2] * S, h + pad[3] * S],
        [-w - pad[0] * S + j[3] * S, h + pad[3] * S]
      ], true);
      addGlyphShape(c, it, 'Ransom scrap ' + k, poly, { fill: pc, alpha: 1 }, function (f) {
        var cp = cutProgress(c, ng, f), pout = cl((f - (c.cut.sourceEnd - c.cut.outFrames)) / Math.max(1, c.cut.outFrames));
        var q = E.outBack(cl((cp.lt - k * 0.03) / 0.22), 1.5) * (1 - E.inCubic(cl(pout * 1.4 - k * 0.03)));
        var sx = valAt(it.src, 'scale.x', f, sc0), sy = valAt(it.src, 'scale.y', f, sc0);
        return {
          'position.x': valAt(it.src, 'position.x', f, it.g.x),
          'position.y': valAt(it.src, 'position.y', f, -it.g.y),
          rotation: valAt(it.src, 'rotation', f, -rot),
          'scale.x': Math.max(0.002, Math.abs(sx) * q),
          'scale.y': Math.max(0.002, Math.abs(sy) * q),
          alpha: q > 0.01 ? cl(valAt(it.src, 'alpha', f, 1)) : 0
        };
      }, true);
    });
  });
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
