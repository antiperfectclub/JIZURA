/* Theme-based text treatments (30 recipes across horror2, kinetic3, typo3, and x2_*B packs).
 * Built as editable Cavalry textShape clones, clipDeformers, shear/extrude layers, and local shapes.
 */
(function (N, G, C, R, V, S, H) {
'use strict';

var cl = H.cl, mix = H.mix, E = H.E, DEG = H.DEG, TAU = H.TAU;
var ctr = H.contrast, isDark = H.dark, mixHex = H.mixHex, lum = H.lum;

function reg(key, src, fn, diffs) {
  N.register('treat', key, { source: src, scope: 'glyph', build: fn, differences: diffs || [] });
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
function markCol(sc, col) {
  return firstOK([sc.accent, sc.accent2, col], function (c) { return ctr(c, sc.bg) >= 2; }, col);
}
function subCol(sc) {
  return firstOK([sc.sub, sc.ghostA, sc.fg], function (c) { return ctr(c, sc.bg) >= 1.6; }, mixHex(sc.fg || '#ffffff', sc.bg || '#101010', 0.45));
}
function quietCol(sc, col) {
  return firstOK([sc.sub, sc.ghostA], function (c) { return ctr(c, sc.bg) >= 1.5; }, mixHex(col, sc.bg || '#101010', 0.55));
}
function onPlate(sc, col) { return ctr(col, sc.bg || '#101010') < 1.5; }
function isSp(ch) { return ch === ' ' || ch === '\u3000'; }
function isPunct(ch) { return /^[\u3001\u3002\uff0c\uff0e\uff01\uff1f.,!?\u30fb\u2026\u2025\u300c\u300d\u300e\u300f\uff08\uff09()\uff3b\uff3d\[\]\u3010\u3011\u30fc\u301c\uff5e:;\uff1a\uff1b\-"'\u2018\u2019\u201c\u201d]$/.test(ch); }
function isKanji(ch) { return /[\u4e00-\u9faf\u3400-\u34bf\uf900-\ufaff\u3005]/.test(ch); }
function isKata(ch) { return /[\u30a0-\u30ff\u31f0-\u31ff]/.test(ch); }
function isHira(ch) { return /[\u3040-\u309f]/.test(ch); }
function isLatin(ch) { return /[A-Za-z0-9]/.test(ch); }
function glyphN(t) { return Array.from(String(t || '')).filter(function (c) { return c.trim(); }).length; }
function keyChar(t) {
  var cs = Array.from(String(t || ''));
  return cs.find(isKanji) || cs.find(isKata) || cs.find(isLatin) || cs.find(function (c) { return !isSp(c) && !isPunct(c); }) || cs[0] || '';
}
function pad2(n) { return (n < 10 ? '0' : '') + Math.floor(n); }
function hashSeed(a, b, c) {
  var h = ((a | 0) * 374761393 + (b | 0) * 668265263 + (c | 0) * 2147483647) | 0;
  h = ((h ^ (h >>> 13)) * 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function hashSigned(a, b, c) { return hashSeed(a, b, c) * 2 - 1; }
function oCubic(x) { return E.outCubic(cl(x)); }

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
function setAttrAlpha(layer, a) {
  if (layer.keys.alpha) V.changeTrack(layer, 'alpha', function (v) { return cl((v == null ? 1 : v) * a); });
  else layer.attrs.alpha = cl((layer.attrs.alpha == null ? 1 : layer.attrs.alpha) * a);
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
function scaleLayer(layer, s) {
  if (s === 1) return;
  if (layer.keys['scale.x']) V.changeTrack(layer, 'scale.x', function (v) { return (v == null ? 1 : v) * s; });
  else layer.attrs.scale = [(layer.attrs.scale ? layer.attrs.scale[0] : 1) * s, layer.attrs.scale ? layer.attrs.scale[1] : 1];
  if (layer.keys['scale.y']) V.changeTrack(layer, 'scale.y', function (v) { return (v == null ? 1 : v) * s; });
  else layer.attrs.scale = [layer.attrs.scale ? layer.attrs.scale[0] : 1, (layer.attrs.scale ? layer.attrs.scale[1] : 1) * s];
}
function rotLayer(layer, dDeg) {
  if (!dDeg) return;
  if (layer.keys.rotation) V.changeTrack(layer, 'rotation', function (v) { return (v == null ? 0 : v) - dDeg; });
  else layer.attrs.rotation = (layer.attrs.rotation || 0) - dDeg;
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
function itemBox(ng) { var b = itemBounds(ng); return { cx: b.cx, cy: b.cy, hw: b.w / 2, hh: b.h / 2 }; }
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
function inP(c, ng, f, d, dur) {
  var cp = cutProgress(c, ng, f);
  return cl((cp.lt - (d || 0)) / Math.max(0.05, dur || 0.35));
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
function cutLineNo(c) {
  var cuts = c.assembly && c.assembly.cuts || [];
  var idx = cuts.findIndex(function (row) { return row.id === c.cut.id; });
  return idx >= 0 ? idx + 1 : 1;
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

/* Place an auxiliary text label inside item-local `ng.parent` (using Cavalry +y-up directly, NOT scene-space H.addText). */
function addLocalText(c, ng, name, txt, xAE, yAE, fs, col, alignH, sampleFn, fontOverride) {
  var lyr = ng.items[0].src;
  var f = fontOverride || C.font(ng.node, c.options);
  var hAlign = alignH === 'left' ? 0 : alignH === 'right' ? 2 : 1;
  var attrs = {
    text: String(txt), fontSize: fs, autoWidth: true, autoHeight: true,
    horizontalAlignment: hAlign, verticalAlignment: 1,
    position: [xAE, -yAE], rotation: 0, scale: [1, 1],
    fill: true, stroke: false, 'material.materialColor': col, alpha: 1
  };
  if (f && f.family && f.style) attrs.font = { font: f.family, style: f.style };
  var id = c.graph.add('textShape', c.cut.id + ' / ' + ng.node.id + ' / ' + name, ng.parent, lyr.start, lyr.end, attrs);
  if (sampleFn) C.sample(c.graph, id, lyr.start, lyr.end, sampleFn);
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

function clipParentPolysToGlyph(graph, targetId, parentId, polysAtFrameFn, difference, label, options) {
  var tNode = graph.byId[targetId], pNode = graph.byId[parentId];
  var frames = [];
  for (var f = tNode.start; f < tNode.end; f++) {
    var polys = polysAtFrameFn(f);
    if (!polys || !polys.length) { frames.push([[[-99999, -99999], [-99998, -99999], [-99999, -99998]]]); continue; }
    var inv = S.inverse(S.matrix(graph, targetId, f));
    var pMat = S.matrix(graph, parentId, f);
    if (!inv || !pMat) { frames.push([[[-99999, -99999], [-99998, -99999], [-99999, -99998]]]); continue; }
    frames.push(polys.map(function (poly) {
      return poly.map(function (pt) { return S.point(inv, S.point(pMat, pt)); });
    }));
  }
  return localMultiClip(graph, targetId, frames, difference, label, options);
}

function wrapNodeShear(c, ng, deg) {
  var g = c.graph, first = g.byId[ng.firstTid], pId = ng.parent;
  var pNode = g.byId[pId];
  var rigId = g.add('null', c.cut.id + ' / ' + ng.node.id + ' / Shear', pNode.parent, pNode.start, pNode.end, {
    position: pNode.attrs.position ? pNode.attrs.position.slice() : [0, 0],
    rotation: pNode.attrs.rotation || 0,
    scale: pNode.attrs.scale ? pNode.attrs.scale.slice() : [1, 1]
  });
  var at = g.layers.indexOf(pNode);
  var rig = g.layers.pop();
  g.layers.splice(at, 0, rig);
  pNode.attrs.position = [0, 0]; pNode.attrs.rotation = 0; pNode.attrs.scale = [1, 1];
  if (pNode.keys && Object.keys(pNode.keys).length) {
    Object.keys(pNode.keys).forEach(function (attr) { rig.keys[attr] = V.copy(pNode.keys[attr]); });
    pNode.keys = {};
  }
  pNode.parent = rigId;
  var k = Math.tan(deg * DEG);
  var v = 0.5 * Math.atan2(2 * k, -k * k);
  var a = Math.cos(v) + k * Math.sin(v), b = Math.sin(v), s = Math.hypot(a, b);
  pNode.attrs.rotation = -(Math.atan2(b, a) / DEG);
  pNode.attrs.scale = [s, 1 / s];
  if (first && rigId) {
    var innerId = g.add('null', c.cut.id + ' / ' + ng.node.id + ' / Shear pre', pNode.id, pNode.start, pNode.end, { rotation: v / DEG });
    ng.items.forEach(function (it) { if (it.src.parent === pNode.id) it.src.parent = innerId; });
    var inner = g.layers.pop();
    var idx2 = g.layers.indexOf(first);
    if (idx2 >= 0) g.layers.splice(idx2, 0, inner);
    else g.layers.push(inner);
  }
}

/* ============================================================================
   1. HORROR2 TREATMENTS (4)
   ============================================================================ */

/* hrInkBleed — layered halo seepage + growing vertical ink drips from glyphs */
reg('hrInkBleed', 'src/11p_horror2.js', function (c) {
  var drips = V.param(c, 'drips', 0.35), red = V.param(c, 'red', false);
  var cs = c.seed | 0;
  nodeGroups(c).forEach(function (ng) {
    var col = nodeCol(c, ng);
    var halo = red ? c.sc.accent : mixHex(col, c.sc.bg, isDark(c.sc.bg) ? 0.5 : 0.3);
    var dc = red ? c.sc.accent : col, s = ng.node.size;
    var single = ng.gs.length === 1 && (c.cut.nodes || []).length > 4;
    if (!single && !hasPieceMotion(c)) {
      ng.items.forEach(function (it) {
        var h1 = V.cloneLayer(c.graph, it.tid, 'Ink halo outer');
        setAttrStroke(h1, halo, Math.max(1.5, it.src.attrs.fontSize * 0.08));
        setAttrAlpha(h1, 0.24);
        shiftLayer(h1, 0, s * 0.02);
        behind(c.graph, h1.id, it.tid);
        var h2 = V.cloneLayer(c.graph, it.tid, 'Ink halo inner');
        setAttrStroke(h2, halo, Math.max(1, it.src.attrs.fontSize * 0.04));
        setAttrAlpha(h2, 0.42);
        shiftLayer(h2, 0, s * 0.01);
        behind(c.graph, h2.id, it.tid);
      });
    }
    ng.items.forEach(function (it) {
      var k = hashSeed(cs, it.idx, Math.round(ng.node.x) ^ 141);
      if (k > drips || isPunct(it.g.ch) || isSp(it.g.ch)) return;
      var dx = hashSigned(cs, it.idx, 2) * it.g.w * 0.25;
      var x = it.g.x + dx, yTop = it.g.y + it.g.h * 0.36;
      var len = s * (0.2 + 0.9 * hashSeed(cs, it.idx, 3));
      var sway = hashSigned(cs, it.idx, 5) * s * 0.02;
      var lw = Math.max(1, s * (0.018 + 0.02 * hashSeed(cs, it.idx, 4)));
      var lid = addLocalShape(c, ng, 'Drip ' + it.idx, localCmds([[0, 0], [sway, len]], false),
        { stroke: dc, width: lw, alpha: 0.9 }, [x, yTop], function (f) {
          var cp = cutProgress(c, ng, f), d0 = cp.inDur * 1.1;
          var grow = E.outCubic(cl((cp.lt - d0) / Math.max(0.8, cp.dur * 0.7)));
          var ok = outK(c, f), a = valAt(it.src, 'alpha', f, 1) * ok * 0.9;
          return {
            'scale.y': Math.max(0.002, grow),
            alpha: grow > 0.01 && a > 0.05 ? cl(a) : 0
          };
        });
      afterLayer(c.graph, lid, it.tid);
      var bid = addLocalShape(c, ng, 'Drip drop ' + it.idx, G.ellipse(0, 0, lw * 0.9, lw * 0.9),
        { fill: dc, alpha: 0.9 }, [x, yTop], function (f) {
          var cp = cutProgress(c, ng, f), d0 = cp.inDur * 1.1;
          var grow = E.outCubic(cl((cp.lt - d0) / Math.max(0.8, cp.dur * 0.7)));
          var ok = outK(c, f), a = valAt(it.src, 'alpha', f, 1) * ok * 0.9;
          return {
            'position.x': x + sway * grow,
            'position.y': -(yTop + len * grow),
            'scale.x': Math.max(0.002, Math.min(1, grow * 3)),
            'scale.y': Math.max(0.002, Math.min(1, grow * 3)),
            alpha: grow > 0.01 && a > 0.05 ? cl(a) : 0
          };
        });
      afterLayer(c.graph, bid, lid);
    });
  });
});

/* hrEroded — circular pits and diagonal scratches carved out of glyph geometry */
reg('hrEroded', 'src/11p_horror2.js', function (c) {
  var dens = V.param(c, 'dens', 1), scr = V.param(c, 'scr', true);
  var cs = c.seed | 0;
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var s = ng.node.size;
    ng.items.forEach(function (it) {
      if (isSp(it.g.ch)) return;
      var n = Math.min(26, Math.round((12 + hashSeed(cs, it.idx, 151) * 12) * dens));
      var polys = [];
      for (var j = 0; j < n; j++) {
        var r = Math.max(0.8, s * (0.012 + 0.044 * Math.pow(hashSeed(cs, it.idx * 97 + j, 2), 2)));
        var px = hashSigned(cs, it.idx * 97 + j, 3) * it.g.w * 0.45;
        var py = -hashSigned(cs, it.idx * 97 + j, 4) * it.g.h * 0.45;
        var oct = [];
        for (var k = 0; k < 6; k++) oct.push([px + Math.cos(k * TAU / 6) * r, py + Math.sin(k * TAU / 6) * r]);
        polys.push(oct);
      }
      if (scr && hashSeed(cs, it.idx, 5) < 0.45) {
        var ang = hashSeed(cs, it.idx, 6) * Math.PI, L = it.g.w * 0.65;
        var dx = Math.cos(ang) * L / 2, dy = Math.sin(ang) * L / 2;
        var nx = -Math.sin(ang) * Math.max(0.9, s * 0.012), ny = Math.cos(ang) * Math.max(0.9, s * 0.012);
        polys.push([[-dx - nx, -dy - ny], [dx - nx, dy - ny], [dx + nx, dy + ny], [-dx + nx, -dy + ny]]);
      }
      if (polys.length) localMultiClip(c.graph, it.tid, polys, true, 'Eroded pits', c.options);
    });
  });
});

/* hrRedact — redaction bar over part of the line pulls away leaving an outline frame */
reg('hrRedact', 'src/11p_horror2.js', function (c) {
  var at = V.param(c, 'at', 0.35), frac = V.param(c, 'frac', 0.45), from = V.param(c, 'from', 0.3);
  nodeGroups(c).forEach(function (ng, ni) {
    var items = ng.items;
    if (!items.length) return;
    if (items.length === 1 && (c.cut.nodes || []).length > 1) {
      var ord = ni / Math.max(1, (c.cut.nodes || []).length - 1), a0 = from * (1 - frac);
      if (ord < a0 || ord > a0 + frac) return;
    }
    var s0 = 0, s1 = items.length - 1;
    if (items.length > 2) {
      var m = Math.max(1, Math.round(items.length * frac));
      s0 = Math.min(items.length - m, Math.floor(from * (items.length - m + 1)));
      s1 = s0 + m - 1;
    }
    var subGs = items.slice(s0, s1 + 1).map(function (it) { return it.g; });
    var b = V.bounds(subGs), s = ng.node.size, pd = s * 0.06, col = nodeCol(c, ng);
    var x0 = b.x0 - pd, x1 = b.x1 + pd, y0 = b.y0 - pd * 0.5, y1 = b.y1 + pd * 0.5;
    var w = Math.max(2, x1 - x0), h = Math.max(2, y1 - y0), yc = (y0 + y1) / 2;
    var bid = addLocalShape(c, ng, 'Redact bar', G.rect(-w, -h / 2, w, h), { fill: col, alpha: 1 }, [x1, yc], function (f) {
      var cp = cutProgress(c, ng, f), t0 = cp.inDur + Math.max(0.1, cp.dur - cp.inDur - cp.outDur) * at;
      var k = E.inOutCubic(cl((cp.lt - t0) / 0.35)), ok = outK(c, f);
      return { 'scale.x': Math.max(0.002, 1 - k), alpha: k < 0.99 ? cl(ok) : 0 };
    });
    afterLayer(c.graph, bid, ng.lastTid);
    var fid = addLocalShape(c, ng, 'Redact frame', G.rect(x0, -y1, w, h),
      { stroke: c.sc.sub || col, width: Math.max(1, s * 0.012), alpha: 0.5 }, null, function (f) {
        var cp = cutProgress(c, ng, f), t0 = cp.inDur + Math.max(0.1, cp.dur - cp.inDur - cp.outDur) * at;
        var k = E.inOutCubic(cl((cp.lt - t0) / 0.35)), ok = outK(c, f);
        return { alpha: k > 0.01 ? cl(0.5 * k * ok) : 0 };
      });
    afterLayer(c.graph, fid, bid);
  });
});

/* hrDoubleExp — faint scaled duplicate drifting out of register behind the line */
reg('hrDoubleExp', 'src/11p_horror2.js', function (c) {
  var amp = V.param(c, 'amp', 0.22), kScale = V.param(c, 'k', 1.05);
  var cs = c.seed | 0;
  nodeGroups(c).forEach(function (ng) {
    var col = nodeCol(c, ng), s = ng.node.size;
    var dc = firstOK([c.sc.sub, c.sc.ghostA, c.sc.fg], function (x) {
      return x && x !== col && ctr(x, c.sc.bg) > 1.3;
    }, c.sc.sub || col);
    var p1 = (cs % 360) * DEG, p2 = ((cs * 7 + 53) % 360) * DEG;
    ng.items.forEach(function (it) {
      var gh = V.cloneLayer(c.graph, it.tid, 'Double exposure');
      setAttrColor(gh, dc);
      behind(c.graph, gh.id, it.tid);
      C.sample(c.graph, gh.id, gh.start, gh.end, function (f) {
        var t = (f - c.cut.origin) / c.comp.fps;
        var nx = 0.58 * Math.sin(t * 2.4 + p1) + 0.42 * Math.cos(t * 1.43 + p2);
        var ny = 0.58 * Math.cos(t * 2.0 + p2) + 0.42 * Math.sin(t * 1.27 + p1);
        var bx = valAt(it.src, 'position.x', f, it.g.x), by = valAt(it.src, 'position.y', f, -it.g.y);
        var sx = valAt(it.src, 'scale.x', f, 1) * kScale, sy = valAt(it.src, 'scale.y', f, 1) * kScale;
        var a = valAt(it.src, 'alpha', f, 1) * 0.4;
        return { 'position.x': bx + nx * s * amp, 'position.y': by - ny * s * amp * 0.7, 'scale.x': sx, 'scale.y': sy, alpha: cl(a) };
      });
    });
  });
});

/* ============================================================================
   2. KINETIC3 TREATMENTS (2)
   ============================================================================ */

/* knWordScale — one key word enlarged and others shrunk, re-flowing baseline spacing */
reg('knWordScale', 'src/11p_kinetic3.js', function (c) {
  var big = V.param(c, 'big', 1.35), small = V.param(c, 'small', 0.82), pick = V.param(c, 'pick', 'long');
  nodeGroups(c).forEach(function (ng) {
    var W = H.wordsOf(c, ng.gs);
    if (!W.words || W.words.length < 2) return;
    var nW = W.words.length, cnt = [], kan = [];
    for (var j = 0; j < nW; j++) { cnt[j] = 0; kan[j] = 0; }
    ng.gs.forEach(function (g) {
      var wIdx = W.membership[g.i];
      if (wIdx != null) { cnt[wIdx]++; if (isKanji(g.ch)) kan[wIdx]++; }
    });
    var kw = 0;
    if (pick === 'last') kw = nW - 1;
    else if (pick === 'first') kw = 0;
    else {
      for (var w = 1; w < nW; w++) {
        if (cnt[w] + kan[w] * 0.5 > cnt[kw] + kan[kw] * 0.5) kw = w;
      }
    }
    var vert = !!ng.node.vertical, track = (ng.node.track || 0) * ng.node.size;
    var tb = 0, ts2 = 0;
    ng.gs.forEach(function (g) {
      if (W.membership[g.i] == null) return;
      var a = vert ? g.h : g.w;
      if (W.membership[g.i] === kw) tb += a; else ts2 += a;
    });
    var norm = Math.min(1, (tb + ts2) / Math.max(1e-6, tb * big + ts2 * small));
    var scaleOf = function (g) {
      var wIdx = W.membership[g.i];
      return (wIdx === kw ? big : small) * norm;
    };
    var byLine = Object.create(null);
    ng.gs.forEach(function (g) { (byLine[g.li] = byLine[g.li] || []).push(g); });
    var align = ng.node.align || 'center';
    Object.keys(byLine).forEach(function (li) {
      var L = byLine[li];
      var first = L[0], last = L[L.length - 1];
      var a0 = vert ? first.y - first.h / 2 : first.x - first.w / 2;
      var a1 = vert ? last.y + last.h / 2 : last.x + last.w / 2;
      var old = a1 - a0, pos = 0, np = [];
      L.forEach(function (g) {
        var k = scaleOf(g), adv = (vert ? g.h : g.w) * k;
        np.push(pos + adv / 2); pos += adv + track;
      });
      var len = pos - track;
      var start = align === 'left' ? a0 : align === 'right' ? a1 - len : a0 + (old - len) / 2;
      L.forEach(function (g, q) {
        var it = ng.items.find(function (x) { return x.idx === g.i; });
        if (!it) return;
        var k = scaleOf(g), na = start + np[q], oa = vert ? g.y : g.x;
        var dx = vert ? 0 : (na - oa), dy = vert ? (na - oa) : (1 - k) * g.h * 0.36;
        shiftLayer(it.src, dx, dy);
        scaleLayer(it.src, k);
      });
    });
  });
});

/* knWordPlate — alternating words knocked out onto solid tilted backing plates */
reg('knWordPlate', 'src/11p_kinetic3.js', function (c) {
  var first = V.param(c, 'first', true), pad = V.param(c, 'pad', 0.11), tilt = V.param(c, 'tilt', 0);
  nodeGroups(c).forEach(function (ng) {
    var W = H.wordsOf(c, ng.gs);
    if (!W.words || W.words.length < 2) return;
    var sc = c.sc, plate = ctr(sc.ink || sc.fg, sc.bg) >= 2 ? (sc.ink || sc.fg) : sc.fg;
    var tc = textOn(plate, sc.bg, sc), s = ng.node.size, pd = s * pad;
    var on = function (wIdx) { return (wIdx % 2 === 0) === !!first; };
    var boxes = Object.create(null);
    ng.items.forEach(function (it) {
      var wIdx = W.membership[it.g.i];
      if (wIdx == null || !on(wIdx)) return;
      setAttrColor(it.src, tc);
      var key = wIdx + ':' + it.g.li;
      var box = boxes[key] || (boxes[key] = { items: [] });
      box.items.push(it);
    });
    Object.keys(boxes).sort().forEach(function (key, qi) {
      var bItems = boxes[key].items, gs = bItems.map(function (it) { return it.g; });
      var b = V.bounds(gs), w = b.w + pd * 2, h = b.h + pd * 1.4;
      var t = tilt ? (qi % 2 ? tilt : -tilt) : 0;
      var cx0 = b.cx, cy0 = b.cy;
      var pid = addLocalShape(c, ng, 'Word plate ' + qi, G.rect(-w / 2, -h / 2, w, h),
        { fill: plate, alpha: 1 }, [cx0, cy0], function (f) {
          var sxSum = 0, sySum = 0, aMin = 1, dxSum = 0, dySum = 0;
          bItems.forEach(function (it) {
            dxSum += valAt(it.src, 'position.x', f, it.g.x) - it.g.x;
            dySum += -valAt(it.src, 'position.y', f, -it.g.y) - it.g.y;
            sxSum += valAt(it.src, 'scale.x', f, 1);
            sySum += valAt(it.src, 'scale.y', f, 1);
            aMin = Math.min(aMin, valAt(it.src, 'alpha', f, 1));
          });
          var cnt = bItems.length;
          return {
            'position.x': cx0 + dxSum / cnt, 'position.y': -(cy0 + dySum / cnt),
            rotation: -t,
            'scale.x': Math.max(0.002, sxSum / cnt), 'scale.y': Math.max(0.002, sySum / cnt),
            alpha: aMin > 0.01 ? cl(aMin) : 0
          };
        });
      behind(c.graph, pid, ng.firstTid);
    });
  });
});

/* ============================================================================
   3. TYPO3 TREATMENTS (4)
   ============================================================================ */

/* tyHollowKey — key kanji/glyph rendered as outline-only (or reversed) */
reg('tyHollowKey', 'src/11p_typo3.js', function (c) {
  var rev = V.param(c, 'rev', false);
  nodeGroups(c).forEach(function (ng) {
    var plain = ng.items.filter(function (it) { return !isSp(it.g.ch); });
    if (!plain.length) return;
    var col = nodeCol(c, ng), wholeText = (c.cut.source && c.cut.source.text) || ng.node.text;
    if (plain.length === 1) {
      var kc = keyChar(wholeText);
      if (plain[0].g.ch !== kc) return;
      if (!rev) setAttrStroke(plain[0].src, col, Math.max(1.2, plain[0].src.attrs.fontSize * 0.03));
      return;
    }
    var kc2 = keyChar(ng.node.text), match = plain.find(function (it) { return it.g.ch === kc2; }) || plain[0];
    plain.forEach(function (it) {
      if ((it.idx === match.idx) !== !!rev) {
        setAttrStroke(it.src, col, Math.max(1.2, it.src.attrs.fontSize * 0.03));
      }
    });
  });
});

/* tyHeadRules — heavy top rule and hairline bottom rule drawing from opposite ends */
reg('tyHeadRules', 'src/11p_typo3.js', function (c) {
  var k = V.param(c, 'k', 0.075), acc = V.param(c, 'acc', false);
  nodeGroups(c).forEach(function (ng) {
    if (glyphN(ng.node.text) < 2) return;
    var col = acc ? markCol(c.sc, nodeCol(c, ng)) : nodeCol(c, ng);
    var vert = !!ng.node.vertical, s = ng.node.size, pad = s * 0.12;
    var thick = Math.max(3, s * k), thin = Math.max(1, s * 0.018);
    itemSpans(ng).forEach(function (L, li) {
      var a0 = L.a0 - pad, a1 = L.a1 + pad, len = Math.max(2, a1 - a0);
      var top = L.c + (vert ? 1 : -1) * s * 0.66, bot = L.c + (vert ? -1 : 1) * s * 0.66;
      var topId = addLocalShape(c, ng, 'Head thick ' + li,
        localCmds([uvPt(vert, 0, 0), uvPt(vert, len, 0)], false),
        { stroke: col, width: thick, alpha: 1 }, uvPt(vert, a0, top), function (f) {
          var cp = cutProgress(c, ng, f), q = E.outExpo(cl((cp.lt - 0.05 - li * 0.08) / 0.5)), o = E.inCubic(1 - outK(c, f));
          var sc = cl(q - o);
          var base = uvPt(vert, a0 + len * o, top);
          var res = { 'position.x': base[0], 'position.y': -base[1], alpha: sc > 0.01 ? 1 : 0 };
          res[vert ? 'scale.y' : 'scale.x'] = Math.max(0.002, sc);
          return res;
        });
      afterLayer(c.graph, topId, ng.lastTid);
      var botId = addLocalShape(c, ng, 'Head thin ' + li,
        localCmds([uvPt(vert, 0, 0), uvPt(vert, -len, 0)], false),
        { stroke: col, width: thin, alpha: 1 }, uvPt(vert, a1, bot), function (f) {
          var cp = cutProgress(c, ng, f), q = E.outExpo(cl((cp.lt - 0.05 - li * 0.08) / 0.5)), o = E.inCubic(1 - outK(c, f));
          var sc = cl(q - o);
          var base = uvPt(vert, a1 - len * o, bot);
          var res = { 'position.x': base[0], 'position.y': -base[1], alpha: sc > 0.01 ? 1 : 0 };
          res[vert ? 'scale.y' : 'scale.x'] = Math.max(0.002, sc);
          return res;
        });
      afterLayer(c.graph, botId, topId);
    });
  });
});

/* tyHeadBig — first non-space/non-punct glyph enlarged on baseline, remaining glyphs make room */
reg('tyHeadBig', 'src/11p_typo3.js', function (c) {
  var k = V.param(c, 'k', 1.48), acc = V.param(c, 'acc', true);
  nodeGroups(c).forEach(function (ng) {
    if (glyphN(ng.node.text) < 2) return;
    var g0Item = ng.items.find(function (it) { return !isSp(it.g.ch) && !isPunct(it.g.ch); });
    if (!g0Item) return;
    var g0 = g0Item.g, vert = !!ng.node.vertical;
    var extra = (k - 1) * (vert ? g0.h : g0.w), align = ng.node.align || 'center';
    var sh = (align !== 'left' && align !== 'right') ? -extra / 2 : (align === 'right' ? -extra : 0);
    var ac = acc && ctr(c.sc.accent, c.sc.bg) >= 1.8 ? c.sc.accent : null;
    ng.items.forEach(function (it) {
      if (it.g.li !== g0.li) return;
      if (it.idx === g0Item.idx) {
        if (ac) setAttrColor(it.src, ac);
        scaleLayer(it.src, k);
        if (vert) shiftLayer(it.src, 0, sh + extra / 2);
        else shiftLayer(it.src, sh + extra / 2, -(k - 1) * it.g.h * 0.36);
      } else if (it.g.ci < g0.ci) {
        shiftLayer(it.src, vert ? 0 : sh, vert ? sh : 0);
      } else {
        shiftLayer(it.src, vert ? 0 : sh + extra, vert ? sh + extra : 0);
      }
    });
  });
});

/* tyIndexSup — tiny superscript index number beside every glyph */
reg('tyIndexSup', 'src/11p_typo3.js', function (c) {
  var acc = V.param(c, 'acc', true);
  nodeGroups(c).forEach(function (ng) {
    var col = acc ? markCol(c.sc, nodeCol(c, ng)) : subCol(c.sc);
    var plain = ng.items.filter(function (it) { return !isSp(it.g.ch); });
    var base = plain.length === 1 ? Math.round(ng.node.mi || 0) : 0, vert = !!ng.node.vertical, s = ng.node.size;
    var fs = Math.max(10, s * 0.26);
    var n = base;
    plain.forEach(function (it) {
      n++;
      if (n > 40) return;
      var ox = vert ? it.g.w * 0.55 : it.g.w * 0.52, oy = vert ? -it.g.h * 0.3 : -it.g.h * 0.42;
      var tid = addLocalText(c, ng, 'Sup ' + n, String(n), it.g.x + ox, it.g.y + oy, fs, col, 'left', function (f) {
        var cp = cutProgress(c, ng, f), q = cl((cp.lt - 0.15) / 0.3) * outK(c, f);
        var ga = valAt(it.src, 'alpha', f, 1);
        var gx = valAt(it.src, 'position.x', f, it.g.x), gy = -valAt(it.src, 'position.y', f, -it.g.y);
        var gs = valAt(it.src, 'scale.x', f, 1);
        return {
          'position.x': gx + ox * gs, 'position.y': -(gy + oy * gs),
          alpha: cl(q * ga)
        };
      });
      afterLayer(c.graph, tid, it.tid);
    });
  });
});

/* ============================================================================
   4. X2 HORROR B TREATMENTS (5)
   ============================================================================ */

/* hzUneven — uneven ink saturation: occasional dimmer and slightly dropped glyphs */
reg('hzUneven', 'src/11p_x2_horrorB.js', function (c) {
  var lo = V.param(c, 'lo', 0.42), rate = V.param(c, 'rate', 0.26);
  var cs = c.seed | 0;
  nodeGroups(c).forEach(function (ng, ni) {
    var N = Math.max(ng.gs.length, (c.cut.nodes || []).length), s = ng.node.size;
    var single = glyphN(ng.node.text) < 2, sure = N > 1 ? Math.floor(hashSeed(cs, 512, 0) * N) : -1;
    ng.items.forEach(function (it) {
      var ix = single ? (ng.node.mi != null ? (ng.node.mi | 0) : ni) : it.idx;
      var r1 = hashSeed(cs, ix, 511), rPrev = hashSeed(cs, ix - 1, 511);
      var weak = ix === sure || (r1 < rate && ix !== sure + 1 && !(rPrev < rate && (ix & 1)));
      if (weak) {
        setAttrAlpha(it.src, lo);
        shiftLayer(it.src, 0, s * 0.025);
      } else {
        setAttrAlpha(it.src, 0.72 + 0.28 * hashSeed(cs, ix, 513));
      }
    });
  });
});

/* hzHairlines — thin background-colored scratch cuts through bounds + faint extensions */
reg('hzHairlines', 'src/11p_x2_horrorB.js', function (c) {
  var count = V.param(c, 'n', 4), slant = V.param(c, 'slant', 0);
  var seed = c.seed | 0;
  nodeGroups(c).forEach(function (ng) {
    var b = itemBox(ng), s = ng.node.size, w = b.hw * 2, h = b.hh * 2;
    if (w < 2 || h < 2) return;
    var one = ng.gs.length <= 1, n = one ? 1 + (seed & 1) : count;
    var lw = Math.max(1.2, s * 0.014), bg = c.sc.bg, sub = subCol(c.sc);
    var x0 = b.cx - b.hw, x1 = b.cx + b.hw, y0 = b.cy - b.hh, y1 = b.cy + b.hh;
    for (var j = 0; j < n; j++) {
      var f = (j + 0.5 + hashSigned(seed, j, 521) * 0.32) / n;
      var horiz = one || w >= h, sl = (slant + hashSigned(seed, j, 522) * 0.12) * (horiz ? h : w);
      var p0, p1;
      if (horiz) { var y = mix(y0, y1, 0.12 + 0.76 * f); p0 = [x0 - s * 0.12, y - sl]; p1 = [x1 + s * 0.12, y + sl]; }
      else { var x = mix(x0, x1, 0.12 + 0.76 * f); p0 = [x - sl, y0 - s * 0.12]; p1 = [x + sl, y1 + s * 0.12]; }
      var lid = addLocalShape(c, ng, 'Scratch ' + j, localCmds([p0, p1], false),
        { stroke: bg, width: lw * (1 + hashSeed(seed, j, 523)), alpha: 1 }, null, function (fr) {
          var a = valAt(ng.items[0].src, 'alpha', fr, 1) * outK(c, fr);
          return { alpha: a > 0.25 ? cl(a) : 0 };
        });
      afterLayer(c.graph, lid, ng.lastTid);
      var ex = s * (0.25 + 0.5 * hashSeed(seed, j, 524)), ux = p1[0] - p0[0], uy = p1[1] - p0[1], ul = Math.hypot(ux, uy) || 1;
      var e0 = hashSeed(seed, j, 525) < 0.5 ? p0 : p1, sg = e0 === p0 ? -1 : 1;
      var e1 = [e0[0] + sg * ux / ul * ex, e0[1] + sg * uy / ul * ex];
      var eid = addLocalShape(c, ng, 'Scratch ext ' + j, localCmds([e0, e1], false),
        { stroke: sub, width: lw * 0.8, alpha: 0.4 }, null, function (fr) {
          var a = valAt(ng.items[0].src, 'alpha', fr, 1) * outK(c, fr);
          return { alpha: a > 0.25 ? cl(a * 0.4) : 0 };
        });
      afterLayer(c.graph, eid, lid);
    }
  });
});

/* hzColdRim — shaded glyph face with crisp offset cold rim catching light on one side */
reg('hzColdRim', 'src/11p_x2_horrorB.js', function (c) {
  var side = V.param(c, 'side', -1), dRatio = V.param(c, 'd', 0.026);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng), s = ng.node.size, d = Math.max(1.5, s * dRatio);
    var shade = mixHex(col, c.sc.bg, ctr(col, c.sc.bg) > 6 ? 0.6 : 0.48);
    ng.items.forEach(function (it) {
      var rim = V.cloneLayer(c.graph, it.tid, 'Cold rim');
      setAttrColor(rim, col);
      shiftLayer(rim, side * d, -d * 0.8);
      behind(c.graph, rim.id, it.tid);
      setAttrColor(it.src, shade);
    });
  });
});

/* hzHusk — broken dashed irregular outline with faint inner stain */
reg('hzHusk', 'src/11p_x2_horrorB.js', function (c) {
  var k = V.param(c, 'k', 1), fillA = V.param(c, 'fill', 0.15);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng);
    ng.items.forEach(function (it) {
      var sz = it.src.attrs.fontSize, lw = Math.max(1.3, sz * 0.024);
      var rim = V.cloneLayer(c.graph, it.tid, 'Husk outline');
      setAttrStroke(rim, col, lw);
      afterLayer(c.graph, rim.id, it.tid);
      var gaps = [], yTop = -sz * 0.9, yBot = sz * 0.9, x = -sz * 0.7;
      var pat = [0.2, 0.05, 0.05, 0.07, 0.34, 0.06, 0.1, 0.11];
      for (var p = 0; p < 12; p++) {
        var vis = pat[(p * 2) % pat.length] * sz * k, gap = pat[(p * 2 + 1) % pat.length] * sz * k;
        x += vis;
        if (x > sz * 0.85) break;
        gaps.push(V.polygon(x, yTop, x + gap, yBot));
        x += gap;
      }
      if (gaps.length) localMultiClip(c.graph, rim.id, gaps, true, 'Husk dashes', c.options);
      setAttrAlpha(it.src, fillA);
    });
  });
});

/* hzDragMarks — 9-step dragged fading ghost trail below glyphs */
reg('hzDragMarks', 'src/11p_x2_horrorB.js', function (c) {
  var len = V.param(c, 'len', 0.35), lean = V.param(c, 'lean', 0);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng), tc = mixHex(col, c.sc.bg, 0.45), n = 9, s = ng.node.size;
    ng.items.forEach(function (it) {
      for (var step = n; step >= 1; step--) {
        var frac = step / n;
        var g = V.cloneLayer(c.graph, it.tid, 'Drag trail ' + step);
        setAttrColor(g, tc);
        setAttrAlpha(g, 0.42 * (1 - (step - 1) / n));
        shiftLayer(g, s * lean * frac, s * len * frac);
        behind(c.graph, g.id, it.tid);
      }
    });
  });
});

/* ============================================================================
   5. X2 KINETIC B TREATMENTS (5)
   ============================================================================ */

/* kzSpeedShadow — trailing accent offset copies clipped through speed-line comb */
reg('kzSpeedShadow', 'src/11p_x2_kineticB.js', function (c) {
  var dRatio = V.param(c, 'd', 0.44), n = V.param(c, 'n', 3), gapRatio = V.param(c, 'gap', 0.19);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng), tc = accentFor(c.sc, col, 1.5), vert = !!ng.node.vertical, s = ng.node.size;
    var B = itemBox(ng), ex = B.hw * 2 + s * (dRatio + 1), ey = B.hh * 2 + s * (dRatio + 1);
    var th = s * 0.07, gp = Math.max(3, s * gapRatio);
    var comb = [];
    if (!vert) {
      for (var y = -ey + gp * 0.35; y < ey && comb.length < 160; y += gp) comb.push(V.polygon(-ex, y, ex, y + th));
    } else {
      for (var x = -ex + gp * 0.35; x < ex && comb.length < 160; x += gp) comb.push(V.polygon(x, -ey, x + th, ey));
    }
    var rotRad = (ng.node.rotation || 0) * DEG, ca = Math.cos(rotRad), sa = Math.sin(rotRad);
    for (var step = n; step >= 1; step--) {
      (function (stIdx) {
        ng.items.forEach(function (it) {
          var cln = V.cloneLayer(c.graph, it.tid, 'Speed ' + stIdx);
          setAttrColor(cln, tc);
          behind(c.graph, cln.id, it.tid);
          C.sample(c.graph, cln.id, cln.start, cln.end, function (f) {
            var q = E.outCubic(inP(c, ng, f, 0.02, 0.4)) * outK(c, f);
            var L = s * dRatio * q * stIdx / n;
            var dx = vert ? L * sa : -L * ca, dy = vert ? -L * ca : -L * sa;
            var bx = valAt(it.src, 'position.x', f, it.g.x), by = valAt(it.src, 'position.y', f, -it.g.y);
            var a = valAt(it.src, 'alpha', f, 1) * (1 - 0.7 * (stIdx - 1) / Math.max(1, n - 1)) * (q > 0.02 ? 1 : 0);
            return { 'position.x': bx + dx, 'position.y': by - dy, alpha: cl(a) };
          });
          clipParentPolysToGlyph(c.graph, cln.id, ng.parent, function () { return comb; }, false, 'Speed comb', c.options);
        });
      })(step);
    }
  });
});

/* kzOnionSkin — trailing hollow outline frames tipped back about foot of line */
reg('kzOnionSkin', 'src/11p_x2_kineticB.js', function (c) {
  var r0 = V.param(c, 'r', 3), n = V.param(c, 'n', 2);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng), tc = accentFor(c.sc, col, 1.4), s = ng.node.size;
    var B = itemBox(ng), w = Math.min(B.hw * 2, s * 9), h = B.hh * 2;
    for (var step = n; step >= 1; step--) {
      (function (stIdx) {
        var decay = Math.pow(0.62, stIdx - 1) * 0.85;
        ng.items.forEach(function (it) {
          var gh = V.cloneLayer(c.graph, it.tid, 'Onion ' + stIdx);
          setAttrStroke(gh, tc, Math.max(1.2, it.src.attrs.fontSize * 0.024));
          behind(c.graph, gh.id, it.tid);
          C.sample(c.graph, gh.id, gh.start, gh.end, function (f) {
            var cp = cutProgress(c, ng, f);
            var amt = E.outBack(inP(c, ng, f, 0.08, 0.5), 1.6) * outK(c, f);
            var th = r0 * amt * (0.9 + 0.1 * Math.sin(cp.ltb * 2.6)) * DEG;
            var dx = (th * h / 2) * stIdx, dy = (-Math.abs(th) * w / 2) * stIdx;
            var bx = valAt(it.src, 'position.x', f, it.g.x), by = valAt(it.src, 'position.y', f, -it.g.y);
            var br = valAt(it.src, 'rotation', f, it.g.r90 ? -90 : 0);
            var a = valAt(it.src, 'alpha', f, 1) * decay * (amt > 0.01 ? 1 : 0);
            return { 'position.x': bx + dx, 'position.y': by - dy, rotation: br - (th / DEG) * stIdx, alpha: cl(a) };
          });
        });
      })(step);
    }
  });
});

/* kzCrescendo — progressive glyph size ramp along each line preserving original gaps */
reg('kzCrescendo', 'src/11p_x2_kineticB.js', function (c) {
  var kk = V.param(c, 'k', 0.4), rev = V.param(c, 'rev', false);
  nodeGroups(c).forEach(function (ng) {
    var vert = !!ng.node.vertical, align = ng.node.align || 'center', byLine = Object.create(null);
    ng.gs.forEach(function (g) { (byLine[g.li] = byLine[g.li] || []).push(g); });
    Object.keys(byLine).forEach(function (li) {
      var Lg = byLine[li], m = Lg.length;
      if (m < 2) return;
      var first = Lg[0], last = Lg[m - 1];
      var a0 = vert ? first.y - first.h / 2 : first.x - first.w / 2;
      var a1 = vert ? last.y + last.h / 2 : last.x + last.w / 2, old = a1 - a0;
      var sc0 = function (q) { var u = q / (m - 1); return mix(1 - kk * 0.55, 1 + kk * 0.45, rev ? 1 - u : u); };
      var tot = 0, rawSum = 0;
      Lg.forEach(function (g, q) { var e = vert ? g.h : g.w; tot += e * sc0(q); rawSum += e; });
      var gapSum = old - rawSum, norm = Math.min(1, (old - gapSum) / Math.max(1e-6, tot));
      var pos = 0, np = [];
      Lg.forEach(function (g, q) {
        var adv = (vert ? g.h : g.w) * sc0(q) * norm;
        if (q > 0) {
          var pv = Lg[q - 1];
          pos += vert ? (g.y - g.h / 2) - (pv.y + pv.h / 2) : (g.x - g.w / 2) - (pv.x + pv.w / 2);
        }
        np.push(pos + adv / 2); pos += adv;
      });
      var start = align === 'left' ? a0 : (align === 'right' && !vert ? a1 - pos : a0 + (old - pos) / 2);
      Lg.forEach(function (g, q) {
        var it = ng.items.find(function (x) { return x.idx === g.i; });
        if (!it) return;
        var sc = sc0(q) * norm, na = start + np[q];
        var dx = vert ? 0 : (na - g.x), dy = vert ? (na - g.y) : (1 - sc) * g.h * 0.36;
        shiftLayer(it.src, dx, dy);
        scaleLayer(it.src, sc);
      });
    });
  });
});

/* kzHopArc — word-by-word sine hop arch & cosine tilt */
reg('kzHopArc', 'src/11p_x2_kineticB.js', function (c) {
  var hh = V.param(c, 'h', 0.2), tl = V.param(c, 'tilt', 11);
  nodeGroups(c).forEach(function (ng) {
    var W = H.wordsOf(c, ng.gs);
    if (!W.words || !W.words.length) return;
    var vert = !!ng.node.vertical, s = ng.node.size;
    W.words.forEach(function (w) {
      var m = w.gs.length;
      if (m < 2) return;
      w.gs.forEach(function (g, idxInW) {
        if (isPunct(g.ch)) return;
        var it = ng.items.find(function (x) { return x.idx === g.i; });
        if (!it) return;
        var u = 0.12 + 0.76 * idxInW / (m - 1);
        var lift = (Math.sin(Math.PI * u) - 0.55) * hh * s * Math.min(1, 0.55 + m * 0.15);
        var rot = -Math.cos(Math.PI * u) * tl;
        if (vert) { shiftLayer(it.src, lift, 0); rotLayer(it.src, rot * 0.6); }
        else { shiftLayer(it.src, 0, -lift); rotLayer(it.src, -rot); }
      });
    });
  });
});

/* kzStepShear — line sliced into horizontal stepped shear bands */
reg('kzStepShear', 'src/11p_x2_kineticB.js', function (c) {
  var n = V.param(c, 'n', 4), d = V.param(c, 'd', 0.06), dir = V.param(c, 'dir', 1);
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    if (ng.node.vertical) { ng.items.forEach(function (it) { rotLayer(it.src, 5 * dir); }); return; }
    if (Math.abs(ng.node.rotation || 0) > 0.5) { wrapNodeShear(c, ng, -9 * dir); return; }
    var s = ng.node.size, lead = (ng.node.lead || 1.3) * s;
    var lineIds = Object.create(null);
    ng.gs.forEach(function (g) { lineIds[g.li] = 1; });
    var lines = Object.keys(lineIds).length || 1;
    var strips = [];
    for (var li = 0; li < lines; li++) {
      var y0 = (li - (lines - 1) / 2) * lead - lead / 2;
      for (var b = 0; b < n; b++) {
        strips.push({ y0: y0 + b * lead / n, y1: y0 + (b + 1) * lead / n, k: dir * d * s * ((n - 1) / 2 - b) });
      }
    }
    var B = itemBox(ng), xW = B.hw + s * 2;
    ng.items.forEach(function (it) {
      var src = it.src, origId = it.tid;
      strips.forEach(function (st, bi) {
        var clone = bi === 0 ? src : V.cloneLayer(c.graph, origId, 'Shear strip ' + bi);
        if (bi > 0) afterLayer(c.graph, clone.id, origId);
        var box = V.polygon(-xW, -st.y1, xW, -st.y0);
        C.sample(c.graph, clone.id, clone.start, clone.end, function (f) {
          var q = E.outBack(inP(c, ng, f, 0.05, 0.4), 1.8) * outK(c, f);
          var bx = valAt(src, 'position.x', f, it.g.x), by = valAt(src, 'position.y', f, -it.g.y);
          return { 'position.x': bx + st.k * q, 'position.y': by };
        });
        clipParentPolysToGlyph(c.graph, clone.id, ng.parent, function () { return [box]; }, false, 'Strip clip ' + bi, c.options);
      });
    });
  });
});

/* ============================================================================
   6. X2 TYPO B TREATMENTS (5)
   ============================================================================ */

/* tzLineNo — small tabular line number + divider tick before line */
reg('tzLineNo', 'src/11p_x2_typoB.js', function (c) {
  var acc = V.param(c, 'acc', true);
  nodeGroups(c).forEach(function (ng) {
    if (glyphN(ng.node.text) < 2) return;
    var col = acc ? markCol(c.sc, nodeCol(c, ng)) : subCol(c.sc), txt = pad2(cutLineNo(c) % 100);
    var Ls = itemSpans(ng); if (!Ls.length) return;
    var L = Ls[0], s = ng.node.size, fs = Math.max(12, s * 0.24), gap = s * 0.16, lw = Math.max(1, s * 0.014);
    var mg = Math.min(c.comp.width, c.comp.height) * 0.06, nw = fs * 1.35, vert = !!ng.node.vertical;
    var sampleAlpha = function (f) {
      var q = E.outExpo(inP(c, ng, f, 0.1, 0.45)), ok = outK(c, f);
      return { alpha: cl(q * 1.5) * ok > 0.01 ? cl(cl(q * 1.5) * ok) : 0 };
    };
    if (vert) {
      var y = L.a0 - fs * 0.95;
      addLocalText(c, ng, 'Line no', txt, L.c, y, fs, col, 'center', sampleAlpha);
      addLocalShape(c, ng, 'Line no div', localCmds([[-fs * 0.6, 0], [fs * 0.6, 0]], false),
        { stroke: col, width: lw, alpha: 1 }, [L.c, L.a0 - fs * 0.3], function (f) {
          var q = E.outExpo(inP(c, ng, f, 0.1, 0.45)), ok = outK(c, f);
          return { 'scale.x': Math.max(0.002, q), alpha: cl(q * 1.5) * ok > 0.01 ? cl(cl(q * 1.5) * ok) : 0 };
        });
    } else if (!ng.node.rotation && (ng.node.x + L.a0) - mg >= nw + gap * 2) {
      addLocalText(c, ng, 'Line no', txt, L.a0 - gap * 2, L.c + s * 0.36 - fs * 0.36, fs, col, 'right', sampleAlpha);
      var hh = s * 0.42;
      addLocalShape(c, ng, 'Line no div', localCmds([[0, -hh], [0, hh]], false),
        { stroke: col, width: lw, alpha: 1 }, [L.a0 - gap, L.c], function (f) {
          var q = E.outExpo(inP(c, ng, f, 0.1, 0.45)), ok = outK(c, f);
          return { 'scale.y': Math.max(0.002, q), alpha: cl(q * 1.5) * ok > 0.01 ? cl(cl(q * 1.5) * ok) : 0 };
        });
    } else {
      var yAlt = L.c - s * 0.5 - fs * 0.85;
      addLocalText(c, ng, 'Line no', txt, L.a0 + fs * 0.05, yAlt, fs, col, 'left', sampleAlpha);
      addLocalShape(c, ng, 'Line no div', localCmds([[0, 0], [nw, 0]], false),
        { stroke: col, width: lw, alpha: 1 }, [L.a0, yAlt + fs * 0.62], function (f) {
          var q = E.outExpo(inP(c, ng, f, 0.1, 0.45)), ok = outK(c, f);
          return { 'scale.x': Math.max(0.002, q), alpha: cl(q * 1.5) * ok > 0.01 ? cl(cl(q * 1.5) * ok) : 0 };
        });
    }
  });
});

/* tzSuperNote — small superscript note number or asterisk after last glyph */
reg('tzSuperNote', 'src/11p_x2_typoB.js', function (c) {
  var star = V.param(c, 'star', false), acc = V.param(c, 'acc', true);
  nodeGroups(c).forEach(function (ng) {
    if (glyphN(ng.node.text) < 2) return;
    var Ls = itemSpans(ng); if (!Ls.length) return;
    var L = Ls[Ls.length - 1], col = acc ? markCol(c.sc, nodeCol(c, ng)) : nodeCol(c, ng);
    var txt = star ? '\uff0a' : String((cutLineNo(c) - 1) % 9 + 1), s = ng.node.size, fs = Math.max(12, s * 0.3);
    var vert = !!ng.node.vertical, mg = Math.min(c.comp.width, c.comp.height) * 0.05;
    var px, py, al = 'left';
    if (vert) { px = L.c + s * 0.5 + fs * 0.5; py = L.a1 - fs * 0.4; al = 'center'; }
    else {
      px = L.a1 + fs * 0.12; py = L.c - s * 0.36;
      if (!ng.node.rotation && ng.node.x + px + fs * 0.75 > c.comp.width - mg) { px = L.a1; py = L.c - s * 0.5 - fs * 0.7; al = 'right'; }
    }
    var tid = addLocalText(c, ng, 'Super note', txt, px, py, fs, col, al, function (f) {
      var q = E.outExpo(inP(c, ng, f, 0.2, 0.4)), ok = outK(c, f);
      return { 'position.y': -(py + (1 - q) * fs * 0.3), alpha: cl(q * 2) * ok > 0.01 ? cl(cl(q * 2) * ok) : 0 };
    });
    afterLayer(c.graph, tid, ng.lastTid);
  });
});

/* tzTypeGuides — body top/bottom + optional dashed center type-design guide lines behind text */
reg('tzTypeGuides', 'src/11p_x2_typoB.js', function (c) {
  var mid = V.param(c, 'mid', true), extRatio = V.param(c, 'ext', 0.42), acc = V.param(c, 'acc', false);
  nodeGroups(c).forEach(function (ng) {
    if (glyphN(ng.node.text) < 2) return;
    var col = acc ? markCol(c.sc, nodeCol(c, ng)) : subCol(c.sc), vert = !!ng.node.vertical, s = ng.node.size;
    var lw = Math.max(1.5, s * 0.015), ext = s * extRatio;
    itemSpans(ng).slice(0, 6).forEach(function (L, li) {
      var a0 = L.a0 - ext, a1 = L.a1 + ext, midPt = (a0 + a1) / 2, half = Math.max(2, (a1 - a0) / 2);
      [-0.56, 0.56].forEach(function (cf, bi) {
        var gid = addLocalShape(c, ng, 'Guide ' + li + '_' + bi,
          localCmds([uvPt(vert, -half, 0), uvPt(vert, half, 0)], false),
          { stroke: col, width: lw, alpha: 0.8 }, uvPt(vert, midPt, L.c + s * cf), function (f) {
            var q = E.outExpo(inP(c, ng, f, 0.02 + li * 0.06, 0.55)) * outK(c, f);
            var res = { alpha: q > 0.01 ? 0.8 : 0 };
            res[vert ? 'scale.y' : 'scale.x'] = Math.max(0.002, q);
            return res;
          });
        behind(c.graph, gid, ng.firstTid);
      });
      if (mid) {
        var segs = [], step = Math.max(4, s * 0.14), dash = step * 0.5;
        for (var u = a0; u < a1; u += step) {
          var p0 = uvPt(vert, u, L.c), p1 = uvPt(vert, Math.min(a1, u + dash), L.c);
          segs.push(['M', p0[0], -p0[1]], ['L', p1[0], -p1[1]]);
        }
        if (segs.length >= 2) {
          var midId = addLocalShape(c, ng, 'Guide center ' + li, segs, { stroke: col, width: lw, alpha: 0.42 }, null, function (f) {
            var q = E.outExpo(inP(c, ng, f, 0.02 + li * 0.06, 0.55)) * outK(c, f);
            return { alpha: q > 0.01 ? cl(0.42 * q) : 0 };
          });
          behind(c.graph, midId, ng.firstTid);
        }
      }
      [L.a0, L.a1].forEach(function (ax, ti) {
        var t0 = uvPt(vert, ax, L.c - s * 0.56 - s * 0.1), t1 = uvPt(vert, ax, L.c - s * 0.56);
        var tickId = addLocalShape(c, ng, 'Guide tick ' + li + '_' + ti, localCmds([t0, t1], false),
          { stroke: col, width: lw, alpha: 0.8 }, null, function (f) {
            var q = E.outExpo(inP(c, ng, f, 0.02 + li * 0.06, 0.55)), ok = outK(c, f);
            return { alpha: q > 0.6 && ok > 0.6 ? 0.8 : 0 };
          });
        behind(c.graph, tickId, ng.firstTid);
      });
    });
  });
});

/* tzTocLeader — dot leaders + 2-digit index number after or below line */
reg('tzTocLeader', 'src/11p_x2_typoB.js', function (c) {
  var acc = V.param(c, 'acc', true);
  nodeGroups(c).forEach(function (ng) {
    if (glyphN(ng.node.text) < 3) return;
    var Ls = itemSpans(ng); if (!Ls.length) return;
    var L = Ls[Ls.length - 1], col = acc ? markCol(c.sc, nodeCol(c, ng)) : subCol(c.sc);
    var txt = pad2(cutLineNo(c) % 100), s = ng.node.size, vert = !!ng.node.vertical;
    var fs = Math.max(12, s * 0.26), mg = Math.min(c.comp.width, c.comp.height) * 0.07, pitch = s * 0.2, r = Math.max(1.2, s * 0.024), nw = fs * 1.4;
    var room = ng.node.rotation ? 0 : vert ? (c.comp.height - mg) - (ng.node.y + L.a1 + s * 0.2) - nw : (c.comp.width - mg) - (ng.node.x + L.a1 + s * 0.2) - nw - s * 0.1;
    var start, len, cv, nc;
    if (room >= s * 0.8) { start = L.a1 + s * 0.2; len = Math.min(room, s * 1.8); cv = vert ? L.c : L.c + s * 0.3; nc = vert ? L.c : L.c + s * 0.36 - fs * 0.36; }
    else { start = L.a0; len = (L.a1 - L.a0) - nw - s * 0.08; cv = L.c + s * 0.7; nc = cv + (vert ? 0 : -fs * 0.06); }
    if (len < s * 0.5) return;
    var cnt = Math.min(40, Math.floor(len / pitch));
    for (var k = 0; k < cnt; k++) {
      (function (kk) {
        var pt = uvPt(vert, start + pitch * (kk + 0.5), cv);
        addLocalShape(c, ng, 'Toc dot ' + kk, G.ellipse(0, 0, r, r), { fill: col, alpha: 1 }, pt, function (f) {
          var q = E.outExpo(inP(c, ng, f, 0.15, 0.6)) * outK(c, f);
          var shown = Math.ceil(cnt * cl(q * 1.4));
          return { alpha: kk < shown && q > 0.01 ? 1 : 0 };
        });
      })(k);
    }
    var nx = vert ? nc : start + cnt * pitch + s * 0.08, ny = vert ? start + cnt * pitch + fs * 0.7 : nc;
    addLocalText(c, ng, 'Toc num', txt, nx, ny, fs, col, vert ? 'center' : 'left', function (f) {
      var q = E.outExpo(inP(c, ng, f, 0.15, 0.6)) * outK(c, f);
      return { alpha: cl(q * 3 - 2) };
    });
  });
});

/* tzKanaSmall — hiragana scaled down cleanly on shared baseline with tightened advance */
reg('tzKanaSmall', 'src/11p_x2_typoB.js', function (c) {
  var k = V.param(c, 'k', 0.8);
  nodeGroups(c).forEach(function (ng) {
    var plain = ng.items.filter(function (it) { return !isSp(it.g.ch); });
    if (!plain.length) return;
    var ref = Array.from(String((plain.length <= 1 ? ((c.cut.source && c.cut.source.text) || ng.node.text) : ng.node.text) || ''));
    var hasBig = ref.some(function (ch) { return isKanji(ch) || isKata(ch) || isLatin(ch); });
    var hasSmall = ref.some(isHira);
    if (!hasBig || !hasSmall) return;
    var vert = !!ng.node.vertical, align = ng.node.align || 'center';
    var byLine = Object.create(null);
    plain.forEach(function (it) { (byLine[it.g.li] = byLine[it.g.li] || []).push(it); });
    Object.keys(byLine).forEach(function (li) {
      var gs = byLine[li], cum = 0, tmp = [];
      gs.forEach(function (it) {
        if (isHira(it.g.ch)) {
          var free = (1 - k) * (vert ? it.g.h : it.g.w);
          tmp.push([it, -(cum + free / 2), true]);
          cum += free;
        } else {
          tmp.push([it, -cum, false]);
        }
      });
      var base = vert ? (align === 'left' ? 0 : cum / 2) : (align === 'left' ? 0 : align === 'right' ? cum : cum / 2);
      tmp.forEach(function (row) {
        var it = row[0], d = row[1] + base, small = row[2];
        if (small) {
          scaleLayer(it.src, k);
          if (vert) shiftLayer(it.src, 0, d);
          else shiftLayer(it.src, d, (1 - k) * it.g.h * 0.36);
        } else if (d) {
          shiftLayer(it.src, vert ? 0 : d, vert ? d : 0);
        }
      });
    });
  });
});

/* ============================================================================
   7. X2 WA B TREATMENTS (5)
   ============================================================================ */

/* wzRakkan — vermilion carved artist seal stamp beside end of line */
reg('wzRakkan', 'src/11p_x2_waB.js', function (c) {
  var v = V.param(c, 'v', 0) | 0, rot = V.param(c, 'r', 2), kRatio = V.param(c, 'k', 0.4);
  nodeGroups(c).forEach(function (ng) {
    if (!lineLike(c, ng)) return;
    var col = nodeCol(c, ng);
    if (onPlate(c.sc, col)) return;
    var seal = firstOK([c.sc.accent, '#b83a2e'], function (x) { return ctr(x, c.sc.bg) >= 2 && ctr(x, col) >= 1.25; }, '#b83a2e');
    var knock = ctr(c.sc.bg, seal) >= 1.6 ? c.sc.bg : (isDark(seal) ? '#ffffff' : '#000000');
    ng.items.forEach(function (it) { scaleLayer(it.src, 0.94); });
    var b = itemBox(ng), s = ng.node.size * 0.94 * kRatio, vert = !!ng.node.vertical;
    var cx = vert ? (b.cx - b.hw - s * 0.72) : (b.cx + b.hw + s * 0.72), cy = b.cy + b.hh - s * 0.5;
    var wait = (c.cut.inFrames / c.comp.fps) * 0.75;
    var popFn = function (f) {
      var q = cl((cutProgress(c, ng, f).lt - wait) / 0.26), ok = outK(c, f);
      var pop = mix(1.45, 1, oCubic(q));
      return {
        rotation: -rot, 'scale.x': pop, 'scale.y': pop,
        alpha: q > 0.01 && ok > 0.01 ? cl(ok * Math.min(1, q * 3)) : 0
      };
    };
    var sealCmds = H.roundRectCmds(-s / 2, -s / 2, s, s, s * 0.1);
    var sid = addLocalShape(c, ng, 'Rakkan seal', sealCmds, { fill: seal, alpha: 1 }, [cx, cy], popFn);
    afterLayer(c.graph, sid, ng.lastTid);
    var ii = s * 0.3, lw = s * 0.085, rects = [];
    if (v === 1) {
      [-ii, 0, ii].forEach(function (y) { rects.push([-ii, y - lw / 2, ii * 2, lw]); });
      rects.push([-lw / 2, -ii, lw, ii * 2]);
    } else {
      rects.push([-ii, -ii, ii * 2, lw], [-ii, ii - lw, ii * 2, lw], [-ii, -ii, lw, ii * 2], [ii - lw, -ii, lw, ii * 2]);
      if (v === 0) rects.push([-ii, -lw / 2, ii * 2, lw], [-lw / 2, -ii, lw, ii * 2]);
      else rects.push([-ii * 0.42, -ii * 0.42, ii * 0.84, ii * 0.84]);
    }
    rects.forEach(function (r, ri) {
      var rid = addLocalShape(c, ng, 'Rakkan stroke ' + ri, G.rect(r[0], -(r[1] + r[3]), r[2], r[3]),
        { fill: knock, alpha: 1 }, [cx, cy], popFn);
      afterLayer(c.graph, rid, sid);
    });
  });
});

/* wzKinpaku — scattered gold-leaf polygonal flecks clipped inside glyphs */
reg('wzKinpaku', 'src/11p_x2_waB.js', function (c) {
  var d = V.param(c, 'd', 0.7), seed = V.param(c, 's', 101) | 0;
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    var col = nodeCol(c, ng);
    var gold = firstOK([c.sc.accent, c.sc.accent2], function (x) { return ctr(x, col) >= 1.35; }, mixHex(col, c.sc.bg, 0.5));
    var gold2 = mixHex(gold, col, 0.45);
    ng.items.forEach(function (it) {
      if (isSp(it.g.ch)) return;
      var sz = it.src.attrs.fontSize, span = sz * 1.15;
      var cnt = Math.min(28, Math.round(12 + 12 * d));
      var polys1 = [], polys2 = [];
      for (var i = 0; i < cnt; i++) {
        var px = hashSigned(seed ^ it.idx, i, 401) * span * 0.55;
        var py = hashSigned(seed ^ it.idx, i, 402) * span * 0.55;
        var R = sz * (0.04 + 0.1 * Math.pow(hashSeed(seed ^ it.idx, i, 403), 1.6));
        var a0 = hashSeed(seed ^ it.idx, i, 404) * TAU, poly = [];
        for (var k = 0; k < 4; k++) {
          var an = a0 + k * TAU / 4 + hashSigned(seed ^ it.idx, i * 11 + k, 406) * 0.5;
          var rr = R * (0.55 + 0.6 * hashSeed(seed ^ it.idx, i * 11 + k, 407));
          poly.push([px + Math.cos(an) * rr, py + Math.sin(an) * rr]);
        }
        (hashSeed(seed ^ it.idx, i, 405) < 0.7 ? polys1 : polys2).push(poly);
      }
      if (polys1.length) {
        var g1 = V.cloneLayer(c.graph, it.tid, 'Kinpaku gold');
        setAttrColor(g1, gold);
        afterLayer(c.graph, g1.id, it.tid);
        localMultiClip(c.graph, g1.id, polys1, false, 'Kinpaku leaf', c.options);
      }
      if (polys2.length) {
        var g2 = V.cloneLayer(c.graph, it.tid, 'Kinpaku leaf2');
        setAttrColor(g2, gold2);
        afterLayer(c.graph, g2.id, it.tid);
        localMultiClip(c.graph, g2.id, polys2, false, 'Kinpaku tone2', c.options);
      }
    });
  });
});

/* wzKasure — dry-brush tapered diamond ink starvation streaks carved out of glyphs */
reg('wzKasure', 'src/11p_x2_waB.js', function (c) {
  var d = V.param(c, 'd', 0.8), seed = V.param(c, 's', 202) | 0;
  nodeGroups(c).forEach(function (ng) {
    if (hasPieceMotion(c)) return;
    ng.items.forEach(function (it) {
      if (isSp(it.g.ch)) return;
      var sz = it.src.attrs.fontSize, span = sz * 1.15;
      var cnt = Math.min(34, Math.round(18 + 14 * d)), polys = [];
      var vert = !!ng.node.vertical !== !!it.g.r90;
      for (var i = 0; i < cnt; i++) {
        var band = ((i % 6) / 6 - 0.5 + hashSigned(seed, i % 6, 411) * 0.08) * span;
        var y = band + hashSigned(seed ^ it.idx, i, 412) * sz * 0.06;
        var h = Math.max(0.8, sz * (0.015 + 0.045 * Math.pow(hashSeed(seed ^ it.idx, i, 413), 2)));
        var x = hashSigned(seed ^ it.idx, i, 414) * span * 0.5;
        var len = sz * (0.25 + 0.65 * hashSeed(seed ^ it.idx, i, 415));
        var pts = [[x - len * 0.5, y], [x, y - h / 2], [x + len * 0.5, y], [x, y + h / 2]];
        if (vert) pts = pts.map(function (p) { return [p[1], p[0]]; });
        polys.push(pts);
      }
      if (polys.length) localMultiClip(c.graph, it.tid, polys, true, 'Kasure brush', c.options);
    });
  });
});

/* wzObi — traditional repeat sash band (ichimatsu / uroko / seigaiha / hishi) along foot */
reg('wzObi', 'src/11p_x2_waB.js', function (c) {
  var v = V.param(c, 'v', 0) | 0, hRatio = V.param(c, 'h', 0.22);
  nodeGroups(c).forEach(function (ng) {
    if (!lineLike(c, ng)) return;
    var col = nodeCol(c, ng);
    if (onPlate(c.sc, col)) return;
    var mc = markCol(c.sc, col), vert = !!ng.node.vertical, s = ng.node.size, hb = s * hRatio;
    ng.items.forEach(function (it) { shiftLayer(it.src, vert ? -s * 0.14 : 0, vert ? 0 : -s * 0.14); });
    var b = itemBox(ng);
    var U0 = (vert ? (b.cy - b.hh) : (b.cx - b.hw)) - s * 0.08;
    var U1 = (vert ? (b.cy + b.hh) : (b.cx + b.hw)) + s * 0.08;
    var V0 = vert ? (b.cx + b.hw) : (b.cy + b.hh);
    var L = Math.max(4, U1 - U0), cmds = [];
    function putTri(a, b2, c2) {
      var p1 = uvPt(vert, a[0], a[1]), p2 = uvPt(vert, b2[0], b2[1]), p3 = uvPt(vert, c2[0], c2[1]);
      cmds.push(['M', p1[0], -p1[1]], ['L', p2[0], -p2[1]], ['L', p3[0], -p3[1]], ['Z']);
    }
    function putRect(u, vv, w, h) {
      var p1 = uvPt(vert, u, vv), p2 = uvPt(vert, u + w, vv), p3 = uvPt(vert, u + w, vv + h), p4 = uvPt(vert, u, vv + h);
      cmds.push(['M', p1[0], -p1[1]], ['L', p2[0], -p2[1]], ['L', p3[0], -p3[1]], ['L', p4[0], -p4[1]], ['Z']);
    }
    var paint;
    if (v === 0) {
      var ch = hb / 2, nc = Math.min(200, Math.ceil(L / ch));
      for (var i = 0; i < nc; i++) putRect(U0 + i * ch, V0 + (i % 2 ? ch : 0), ch + 0.4, ch);
      paint = { fill: mc, alpha: 1 };
    } else if (v === 1) {
      var nt = Math.min(180, Math.ceil(L / hb));
      for (var ti = 0; ti < nt; ti++) putTri([U0 + ti * hb, V0 + hb], [U0 + (ti + 0.5) * hb, V0], [U0 + (ti + 1) * hb, V0 + hb]);
      paint = { fill: mc, alpha: 1 };
    } else if (v === 2) {
      var ns = Math.min(100, Math.ceil(L / (hb * 2)) + 1);
      for (var si = 0; si < ns; si++) {
        var cu = U0 + (si + 0.5) * hb * 2;
        [1, 0.66, 0.33].forEach(function (rr) {
          for (var a = 0; a <= 8; a++) {
            var ang = Math.PI + Math.PI * (a / 8), pt = uvPt(vert, cu + Math.cos(ang) * hb * rr, V0 + hb + Math.sin(ang) * hb * rr);
            cmds.push([a === 0 ? 'M' : 'L', pt[0], -pt[1]]);
          }
        });
      }
      paint = { stroke: mc, width: Math.max(1, hb * 0.1), alpha: 1 };
    } else {
      var wH = hb * 1.3, nh = Math.min(160, Math.ceil(L / wH));
      putRect(U0, V0, L, hb * 0.1); putRect(U0, V0 + hb * 0.9, L, hb * 0.1);
      for (var hi = 0; hi < nh; hi++) {
        var cx = U0 + (hi + 0.5) * wH, cy = V0 + hb / 2;
        var pA = uvPt(vert, cx - wH * 0.38, cy), pB = uvPt(vert, cx, cy - hb * 0.27);
        var pC = uvPt(vert, cx + wH * 0.38, cy), pD = uvPt(vert, cx, cy + hb * 0.27);
        cmds.push(['M', pA[0], -pA[1]], ['L', pB[0], -pB[1]], ['L', pC[0], -pC[1]], ['L', pD[0], -pD[1]], ['Z']);
      }
      paint = { fill: mc, alpha: 1 };
    }
    if (cmds.length >= 2) {
      var oid = addLocalShape(c, ng, 'Obi sash', cmds, paint, null, function (f) {
        var q = oCubic(inP(c, ng, f, 0.05, 0.5)) * outK(c, f);
        return { alpha: q > 0.01 ? cl(q) : 0 };
      });
      behind(c.graph, oid, ng.firstTid);
    }
  });
});

/* wzBinsen — letter paper ruled lines + empty line + colored head rule */
reg('wzBinsen', 'src/11p_x2_waB.js', function (c) {
  var extra = V.param(c, 'n', 1) | 0, dbl = V.param(c, 'd', false);
  nodeGroups(c).forEach(function (ng) {
    if (!lineLike(c, ng)) return;
    var col = nodeCol(c, ng);
    if (onPlate(c.sc, col)) return;
    var rule = quietCol(c.sc, col), head = markCol(c.sc, col), vert = !!ng.node.vertical, sg = vert ? -1 : 1, s = ng.node.size;
    var lead = (ng.node.lead || 1.3) * s, lw = Math.max(1.5, s * 0.014);
    var sh = lead * 0.25 * extra;
    ng.items.forEach(function (it) { shiftLayer(it.src, vert ? sh : 0, vert ? 0 : -sh); });
    var b = itemBox(ng), Ls = itemSpans(ng); if (!Ls.length) return;
    var U0 = (vert ? (b.cy - b.hh) : (b.cx - b.hw)) - s * 0.3;
    var U1 = (vert ? (b.cy + b.hh) : (b.cx + b.hw)) + s * 0.3;
    var len = Math.max(4, U1 - U0);
    var vs = Ls.map(function (L) { return L.c + (vert ? sh : -sh) + sg * lead / 2; });
    var last = vs[vs.length - 1];
    for (var j = 1; j <= extra; j++) vs.push(last + sg * lead * j);
    vs.forEach(function (vPos, j) {
      var rid = addLocalShape(c, ng, 'Binsen rule ' + j,
        localCmds([uvPt(vert, 0, 0), uvPt(vert, len, 0)], false),
        { stroke: rule, width: lw, alpha: 0.75 }, uvPt(vert, U0, vPos), function (f) {
          var q = oCubic(inP(c, ng, f, 0.04 * (j + 1), 0.45)), ok = outK(c, f);
          var res = { alpha: q * ok > 0.01 ? cl(0.75 * ok) : 0 };
          res[vert ? 'scale.y' : 'scale.x'] = Math.max(0.002, q);
          return res;
        });
      behind(c.graph, rid, ng.firstTid);
    });
    var hv = Ls[0].c + (vert ? sh : -sh) - sg * lead / 2;
    var hid = addLocalShape(c, ng, 'Binsen head',
      localCmds([uvPt(vert, 0, 0), uvPt(vert, len, 0)], false),
      { stroke: head, width: lw * 2, alpha: 1 }, uvPt(vert, U0, hv), function (f) {
        var q = oCubic(inP(c, ng, f, 0, 0.45)), ok = outK(c, f);
        var res = { alpha: q * ok > 0.01 ? cl(ok) : 0 };
        res[vert ? 'scale.y' : 'scale.x'] = Math.max(0.002, q);
        return res;
      });
    behind(c.graph, hid, ng.firstTid);
    if (dbl) {
      var hid2 = addLocalShape(c, ng, 'Binsen head2',
        localCmds([uvPt(vert, 0, 0), uvPt(vert, len, 0)], false),
        { stroke: head, width: lw, alpha: 0.8 }, uvPt(vert, U0, hv - sg * lw * 4), function (f) {
          var q = oCubic(inP(c, ng, f, 0, 0.45)), ok = outK(c, f);
          var res = { alpha: q * ok > 0.01 ? cl(0.8 * ok) : 0 };
          res[vert ? 'scale.y' : 'scale.x'] = Math.max(0.002, q);
          return res;
        });
      behind(c.graph, hid2, ng.firstTid);
    }
  });
});

})(JZNative, JZGraph, JZComponents, JZRecipeTools, JZRecipeComponents, JZSceneTools, JZHelpers);
