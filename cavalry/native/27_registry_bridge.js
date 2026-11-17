/*
 * One registry, two interfaces.
 * JZPresets delegates to JZNative; it does not copy recipe definitions.
 * Scene-space clipping samples the graph transforms that were just built.
 */
var JZPresets = (function (N) {
'use strict';

function resolve(group, key) {
  var definition = N.get(group, key);
  return {
    state: definition ? 'exact' : 'missing',
    as: definition ? key : null,
    definition: definition
  };
}

function build(group, preset, context) {
  var p = typeof preset === 'string' ? { name: preset } : preset;
  if (!p || !p.name || p.name === 'none') return null;
  var definition = N.get(group, p.name);
  if (!definition) throw new Error('Unimplemented native recipe ' + group + ':' + p.name);
  return definition.build(Object.assign({}, context, { preset: p }));
}

function built(group) {
  var manifest = N.manifest();
  if (!manifest[group]) throw new Error('Unknown recipe group ' + group);
  return Object.keys(manifest[group]).sort();
}

return { register: N.register, get: N.get, manifest: N.manifest, groups: N.groups,
  resolve: resolve, build: build, built: built };
})(JZNative);

var JZSceneTools = (function (N) {
'use strict';

/* Attribute lookup: explicit dotted attrs, vector-array fallback, then sampled keys. */
function value(node, attribute, frame, fallback) {
  var track = node.keys[attribute], attrs = node.attrs, result = attrs[attribute];
  if (result == null && attribute.indexOf('.') > 0) {
    var parts = attribute.split('.');
    if (parts.length === 2 && Array.isArray(attrs[parts[0]])) {
      var index = parts[1] === 'x' ? 0 : parts[1] === 'y' ? 1 : -1;
      if (index >= 0) result = attrs[parts[0]][index];
    }
  }
  if (result == null) result = fallback;
  if (!track) return result;

  var frames = Object.keys(track).map(Number).sort(function (a, b) { return a - b; });
  if (!frames.length) return result;
  if (frame < frames[0]) return track[frames[0]].value;
  for (var i = 1; i < frames.length; i++) {
    if (frame < frames[i]) {
      var left = track[frames[i - 1]], right = track[frames[i]];
      if (left.type === 2) return left.value;
      if (left.type !== 1) throw new Error('Scene clipping requires sampled linear/step tracks: ' + attribute);
      var t = (frame - frames[i - 1]) / (frames[i] - frames[i - 1]);
      return left.value + (right.value - left.value) * t;
    }
  }
  return track[frames[frames.length - 1]].value;
}

function multiply(a, b) {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5]
  ];
}

function matrix(graph, id, frame, visited) {
  visited = visited || Object.create(null);
  if (visited[id]) throw new Error('Parent transform cycle: ' + id);
  visited[id] = true;
  var node = graph.byId[id];
  if (!node) throw new Error('Unknown transform node ' + id);

  var rotation = value(node, 'rotation', frame, 0) * Math.PI / 180;
  var sx = value(node, 'scale.x', frame, 1), sy = value(node, 'scale.y', frame, 1);
  var cs = Math.cos(rotation), sn = Math.sin(rotation);
  var local = [
    cs * sx, sn * sx, -sn * sy, cs * sy,
    value(node, 'position.x', frame, 0), value(node, 'position.y', frame, 0)
  ];
  return node.parent ? multiply(matrix(graph, node.parent, frame, visited), local) : local;
}

function inverse(m) {
  var determinant = m[0] * m[3] - m[1] * m[2];
  if (Math.abs(determinant) < 1e-12) return null;
  return [
    m[3] / determinant, -m[1] / determinant,
    -m[2] / determinant, m[0] / determinant,
    (m[2] * m[5] - m[3] * m[4]) / determinant,
    (m[1] * m[4] - m[0] * m[5]) / determinant
  ];
}

function point(m, p) {
  return [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
}

/* Polygons arrive in scene coordinates; the deformer needs target-local coordinates. */
function clip(graph, target, polygons, profile) {
  var node = graph.byId[target];
  if (!node) throw new Error('Unknown clip target ' + target);
  var layerType = profile && typeof profile.layerType === 'string' && profile.layerType
    ? profile.layerType : 'javaScriptDeformer';
  var frames = Object.create(null);
  for (var frame = node.start; frame < node.end; frame++) {
    if (!polygons[frame]) continue;
    var inv = inverse(matrix(graph, target, frame));
    frames[frame] = inv ? polygons[frame].map(function (p) {
      var local = point(inv, p);
      local.forEach(function (v) { N.finite(v, 'clip point'); });
      return local;
    }) : [[0, 0], [1e-8, 0], [0, 1e-8]];
  }
  if (!Object.keys(frames).length) return null;

  /* Only compiler-generated numeric geometry is embedded; assembly JSON is never evaluated. */
  var expression = [
    '(function(){', 'var F=', JSON.stringify(frames), ';',
    'var q=F[Math.floor(n0)];', 'if(!q)return;',
    'var clip=new cavalry.Path();',
    'q.forEach(function(p,i){', 'if(i)clip.lineTo(p[0],p[1]);', 'else clip.moveTo(p[0],p[1]);', '});',
    'clip.close();', 'var depth=def.highestDepthWithPath();', 'var meshes=def.getMeshesAtDepth(depth);',
    'meshes.forEach(function(mesh){', 'for(var i=0;i<mesh.count();i++){',
    'var path=mesh.getPathAtIndex(i);', 'path.intersect(clip);', 'mesh.setPathAtIndex(i,path);', '}',
    '});', 'def.setMeshesAtDepth(depth,meshes);', '})();'
  ].join('');

  var id = graph.add(layerType, node.name + ' / Polygon iris clip', target, node.start, node.end,
    { expression: expression, 'array.0': node.start });
  graph.key(id, 'array.0', node.start, node.start, 1);
  if (node.end > node.start + 1) graph.key(id, 'array.0', node.end - 1, node.end - 1, 1);
  graph.connect(id, 'id', target, 'deformers');
  return id;
}

return { value: value, matrix: matrix, inverse: inverse, point: point, multiply: multiply, clip: clip };
})(JZNative);
