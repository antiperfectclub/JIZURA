/* Native recipe components shared by the requested packs.
 * Loaded after 25_recipe_tools.js and before every pack.
 *
 * The JavaScript Deformer uses its documented native layer type; a different verified type can be supplied
 * through `hostProfile`. The Gaussian-blur layer type remains opt-in through `hostProfile`; without it the
 * build fails instead of drawing an unblurred substitute.
 */
var JZRecipeComponents = (function (N, G, C, R) {
'use strict';

var EPS = 1e-6;
var D = Math.PI / 180;
var TAU = Math.PI * 2;

function copy(v) { return JSON.parse(JSON.stringify(v)); }

function param(c, key, fallback) {
  var p = c.preset && c.preset.params || {};
  return p[key] == null ? fallback : p[key];
}

/* One resolver for every recipe: options.fontOverrides, host availability, and fallback are handled by
 * C.font. Recipes must not re-implement (or disagree with) that substitution order. */
function font(c, node) {
  return C.font(node, c.options || {});
}

function glyphs(c, node) { return C.glyphs(node, font(c, node)); }

function bounds(gs) {
  if (!gs.length) throw new Error('Cannot measure empty glyph geometry');
  var b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  gs.forEach(function (g) {
    var x = g.x + (g.vx || 0);
    var y = g.y + (g.vy || 0);
    b.x0 = Math.min(b.x0, x - g.w / 2); b.x1 = Math.max(b.x1, x + g.w / 2);
    b.y0 = Math.min(b.y0, y - g.h / 2); b.y1 = Math.max(b.y1, y + g.h / 2);
  });
  b.w = b.x1 - b.x0; b.h = b.y1 - b.y0;
  b.cx = (b.x0 + b.x1) / 2; b.cy = (b.y0 + b.y1) / 2;
  [b.x0, b.y0, b.x1, b.y1].forEach(function (x) { N.finite(x, 'rest bounds'); });
  return b;
}

/* Resting bounds in design space, including node rotation and x-scale. */
function rest(c) {
  var points = [];
  c.cut.nodes.forEach(function (node) {
    var a = (node.rotation || 0) * D, cs = Math.cos(a), sn = Math.sin(a), sx = node.sx == null ? 1 : node.sx;
    glyphs(c, node).forEach(function (g) {
      [-1, 1].forEach(function (ix) {
        [-1, 1].forEach(function (iy) {
          var x = (g.x + (g.vx || 0) + ix * g.w / 2) * sx;
          var y = g.y + (g.vy || 0) + iy * g.h / 2;
          points.push([node.x + x * cs - y * sn, node.y + x * sn + y * cs]);
        });
      });
    });
  });
  if (!points.length) throw new Error('No rest geometry: ' + c.cut.id);
  var xs = points.map(function (p) { return p[0]; });
  var ys = points.map(function (p) { return p[1]; });
  var b = { x0: Math.min.apply(null, xs), x1: Math.max.apply(null, xs),
    y0: Math.min.apply(null, ys), y1: Math.max.apply(null, ys) };
  b.w = b.x1 - b.x0; b.h = b.y1 - b.y0;
  b.cx = (b.x0 + b.x1) / 2; b.cy = (b.y0 + b.y1) / 2;
  return b;
}

/* One row per source line: used by kerning and counter-rule graphics. */
function spans(gs, vertical) {
  var map = Object.create(null);
  gs.forEach(function (g) {
    if (/^[\s\u3000]$/.test(g.ch)) return;
    var a = vertical ? g.y : g.x, z = vertical ? g.h : g.w;
    var cross = vertical ? g.x : g.y, li = g.li || 0, row = map[li];
    if (!row) row = map[li] = { li: li, a0: Infinity, a1: -Infinity, c: cross, glyphs: [] };
    row.a0 = Math.min(row.a0, a - z / 2); row.a1 = Math.max(row.a1, a + z / 2);
    row.glyphs.push(g);
  });
  return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return a.li - b.li; });
}

function polygon(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }

/* Design space (y down, composition origin at the top left) -> Cavalry path commands. */
function commands(points, close) {
  if (!points || points.length < 2) throw new Error('Insufficient path points');
  var out = points.map(function (p, i) {
    N.finite(p[0], 'path x'); N.finite(p[1], 'path y');
    return [i ? 'L' : 'M', p[0], -p[1]];
  });
  if (close) out.push(['Z']);
  return out;
}

function shape(c, name, points, paint, parent) {
  return C.shape(c.graph, c.cut, c.cut.id + ' / ' + name, parent == null ? c.parent : parent,
    commands(points, true), paint);
}
function line(c, name, points, color, width, alpha, parent) {
  return C.shape(c.graph, c.cut, c.cut.id + ' / ' + name, parent == null ? c.parent : parent,
    commands(points, false), { stroke: color, width: width, alpha: alpha == null ? 1 : alpha });
}
function rect(c, name, x, y, w, h, paint, parent) {
  if (!(w > 0 && h > 0)) throw new Error('Degenerate rectangle: ' + name);
  return shape(c, name, polygon(x, y, x + w, y + h), paint, parent);
}

function local(c, node, label) {
  return c.graph.add('null', c.cut.id + ' / ' + node.id + ' / ' + label, c.parent, c.cut.start, c.cut.end, {
    position: [node.x - c.comp.width / 2, c.comp.height / 2 - node.y],
    rotation: -(node.rotation || 0), scale: [node.sx == null ? 1 : node.sx, 1]
  });
}

function envelope(c, node, frame) {
  var start = c.cut.origin + (node.delayFrames || 0);
  var pin = R.clamp((frame - start) / c.cut.inFrames);
  var pout = R.clamp((frame - c.cut.sourceEnd + c.cut.outFrames) / c.cut.outFrames);
  var amt = R.clamp((frame - start - c.cut.inFrames * 0.85) / (c.comp.fps * 0.25)) * (1 - pout);
  return { t: (frame - c.cut.origin) / c.comp.fps, pin: pin, pout: pout, amt: amt };
}

function animate(c, id, fn) {
  C.sample(c.graph, id, c.cut.start, c.cut.end, function (f) { return fn(R.env(c, f), f); });
}

function cloneLayer(graph, id, label) {
  var src = graph.byId[id];
  if (!src) throw new Error('Missing source layer: ' + id);
  var dst = graph.add(src.type, src.name + ' / ' + label, src.parent, src.start, src.end,
    copy(src.attrs), src.commands ? copy(src.commands) : null);
  graph.byId[dst].keys = copy(src.keys);
  return graph.byId[dst];
}

function changeTrack(n, attr, fn) {
  if (n.keys[attr]) {
    Object.keys(n.keys[attr]).forEach(function (f) {
      n.keys[attr][f].value = fn(n.keys[attr][f].value, +f);
    });
  } else {
    n.attrs[attr] = fn(n.attrs[attr], n.start);
  }
}

function axisPoint(vertical, along, cross) { return vertical ? [cross, along] : [along, cross]; }
function state() { return { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, a: 1 }; }

/* Convert an item-local clipping polygon into glyph-local Cavalry coordinates after motion. */
function glyphClip(points, g, s) {
  var gx = g.x + (g.vx || 0) + s.dx, gy = g.y + (g.vy || 0) + s.dy;
  var a = -(s.rot + (g.r90 ? 90 : 0)) * D, cs = Math.cos(a), sn = Math.sin(a);
  if (Math.abs(s.sx) < EPS || Math.abs(s.sy) < EPS) return polygon(0, 0, EPS, EPS);
  return points.map(function (p) {
    var x = p[0] - gx, y = p[1] - gy;
    return [(x * cs - y * sn) / s.sx, -(x * sn + y * cs) / s.sy];
  });
}

/* The deformer expression is data, not arbitrary assembly-supplied JavaScript. Its globals (`n0`, `def`)
 * follow the documented JavaScript Deformer module. The documented layer type is the default; a different
 * verified type can be supplied through hostProfile. Actual host/render verification is still pending. */
function clipDeformer(graph, target, frames, difference, label, options) {
  var profile = options && options.hostProfile && options.hostProfile.javaScriptDeformer ||
    { layerType: 'javaScriptDeformer' };
  if (!profile || typeof profile.layerType !== 'string' || !profile.layerType) {
    throw new Error('Invalid JavaScript Deformer layer profile');
  }
  var n = graph.byId[target], data = JSON.stringify(frames);
  var method = difference ? 'difference' : 'intersect';
  var expression = [
    '(function(){', 'var frames=', data, ';',
    'var at=Math.max(0,Math.min(frames.length-1,', 'Math.floor(n0)-' + String(n.start), '));',
    'var points=frames[at];', 'if(!points)return;',
    'var clip=new cavalry.Path();',
    'points.forEach(function(p,i){', 'if(i)clip.lineTo(p[0],p[1]);', 'else clip.moveTo(p[0],p[1]);', '});',
    'clip.close();', 'var depth=def.highestDepthWithPath();', 'var meshes=def.getMeshesAtDepth(depth);',
    'meshes.forEach(function(mesh){', 'for(var i=0;i<mesh.count();i++){',
    'var p=mesh.getPathAtIndex(i);', 'p.' + method + '(clip);', 'mesh.setPathAtIndex(i,p);', '}',
    '});', 'def.setMeshesAtDepth(depth,meshes);', '})();'
  ].join('');
  var id = graph.add(profile.layerType, n.name + ' / ' + label, target, n.start, n.end,
    { expression: expression, 'array.0': n.start });
  graph.key(id, 'array.0', n.start, n.start, 1);
  if (n.end - n.start > 1) graph.key(id, 'array.0', n.end - 1, n.end - 1, 1);
  graph.connect(id, 'id', target, 'deformers');
  return id;
}

/* Gaussian blur stays semantic until emit. emit() resolves it only from an explicit host profile. */
var originalEmit = G.Graph.prototype.emit;
G.Graph.prototype.emit = function (options) {
  options = options || {};
  var profile = (options.hostProfile || {}).gaussianBlur, saved = [], graph = this;
  var layersBefore = this.layers, edgesBefore = this.edges;
  var dropped = Object.create(null);
  this.layers.forEach(function (n) {
    if (n.type !== '$gaussianBlur') return;
    if (!profile || profile.verified !== true || !profile.layerType || !profile.radius || !profile.input) {
      dropped[n.id] = true;
      graph.emitErrors = graph.emitErrors || [];
      graph.emitErrors.push({ kind: 'effect', label: n.name,
        message: 'Gaussian blur skipped: hostProfile.gaussianBlur {verified:true, layerType, radius, input} is missing.' });
      return;
    }
    saved.push({ node: n, type: n.type, attrs: n.attrs, keys: n.keys });
    var attrs = {}; attrs[profile.radius] = n.attrs.radius;
    n.attrs = attrs;
    var keys = {}; keys[profile.radius] = n.keys.radius; n.keys = keys;
    n.type = profile.layerType;
  });
  if (Object.keys(dropped).length) {
    this.layers = this.layers.filter(function (n) { return !dropped[n.id]; });
    this.edges = this.edges.filter(function (e) { return !dropped[e.from] && !dropped[e.to]; });
  }
  var edgeSaved = [];
  this.edges.forEach(function (e) {
    if (e.input !== '$gaussianBlur') return;
    edgeSaved.push({ edge: e, input: e.input }); e.input = profile.input;
  });
  try {
    return originalEmit.call(graph, options);
  } finally {
    saved.forEach(function (s) { s.node.type = s.type; s.node.attrs = s.attrs; s.node.keys = s.keys; });
    edgeSaved.forEach(function (s) { s.edge.input = s.input; });
    /* emit() mutates only its temporary view: dropped blur nodes stay in the editable graph so the
       report and a later host-profile retry still see them. */
    graph.layers = layersBefore; graph.edges = edgesBefore;
  }
};

/* Extend the glyph builder with the channels the old C.text discarded. Nothing changes unless a recipe
 * actually returns clipPolygon, blur, ch or color, or marks the node as a comet. */
var originalText = C.text;
C.text = function (graph, cut, node, parent, options, sampler) {
  var records = Object.create(null);
  var ids = originalText(graph, cut, node, parent, options, function (s, g, gs, frame) {
    sampler(s, g, gs, frame);
    if (!records[g.i]) records[g.i] = { glyph: g, glyphs: gs, frames: Object.create(null) };
    records[g.i].frames[frame] = copy(s);
  });

  Object.keys(records).map(Number).sort(function (a, b) { return a - b; }).forEach(function (index, outputIndex) {
    var id = ids[outputIndex];
    if (!id) return;
    var n = graph.byId[id], rec = records[index];
    var clipFrames = [], hasClip = false, blur = [], hasBlur = false, lastText = null, lastColor = null;
    for (var f = n.start; f < n.end; f++) {
      var s = rec.frames[f];
      if (!s) throw new Error('Missing glyph sample: ' + n.name);
      if (s.clipPolygon) { hasClip = true; clipFrames.push(glyphClip(s.clipPolygon, rec.glyph, s)); }
      else clipFrames.push(null);
      var radius = s.blur || 0;
      blur.push(radius); hasBlur = hasBlur || radius > EPS;
      if (s.ch != null && s.ch !== lastText) { graph.key(id, 'text', f, String(s.ch), 2); lastText = String(s.ch); }
      if (s.color && s.color !== lastColor) { graph.key(id, 'material.materialColor', f, s.color, 2); lastColor = s.color; }
    }
    if (hasClip) clipDeformer(graph, id, clipFrames, false, 'Native clip', options);
    if (hasBlur) {
      var filter = graph.add('$gaussianBlur', n.name + ' / Focus blur', id, n.start, n.end, { radius: blur[0] });
      for (var bf = n.start; bf < n.end; bf++) graph.key(filter, 'radius', bf, blur[bf - n.start], 1);
      graph.connect(filter, 'id', id, '$gaussianBlur');
    }
    if (node._jzComet) {
      for (var tail = 8; tail >= 1; tail--) {
        var clone = cloneLayer(graph, id, 'Comet trail ' + tail);
        clone.keys = {};
        for (var tf = n.start; tf < n.end; tf++) {
          var delay = cut.inFrames * 0.6 * tail / 8, ss = state();
          sampler(ss, rec.glyph, rec.glyphs, tf - delay);
          var pin = R.clamp((tf - cut.origin - (node.delayFrames || 0)) / cut.inFrames);
          var alpha = pin > 0 && pin < 1 ? N.clamp(ss.a) * Math.pow(0.66, tail) : 0;
          graph.key(clone.id, 'position.x', tf, rec.glyph.x + (rec.glyph.vx || 0) + ss.dx, 1);
          graph.key(clone.id, 'position.y', tf, -rec.glyph.y - (rec.glyph.vy || 0) - ss.dy, 1);
          graph.key(clone.id, 'rotation', tf, -(rec.glyph.r90 ? 90 : 0) - ss.rot, 1);
          graph.key(clone.id, 'scale.x', tf, ss.sx, 1);
          graph.key(clone.id, 'scale.y', tf, ss.sy, 1);
          graph.key(clone.id, 'alpha', tf, alpha, 1);
        }
      }
    }
  });
  return ids;
};

return { copy: copy, param: param, font: font, glyphs: glyphs, bounds: bounds, rest: rest,
  spans: spans, polygon: polygon, commands: commands, shape: shape, line: line, rect: rect,
  local: local, envelope: envelope, animate: animate, cloneLayer: cloneLayer,
  changeTrack: changeTrack, axisPoint: axisPoint, clipDeformer: clipDeformer, TAU: TAU, D: D };
})(JZNative, JZGraph, JZComponents, JZRecipeTools);
