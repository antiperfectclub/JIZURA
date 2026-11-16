/* Runs only in Cavalry's JavaScript Editor, never in the browser. */
var JZCavalry = (function () {
'use strict';
function clip(id, start, end) {
  api.setInFrame(id, start);
  api.setOutFrame(id, end - 1);
}
function setOne(id, path, value) {
  var data = {};
  data[path] = value;
  api.set(id, data);
}
function background(comp, cut, parent) {
  if (!cut.background) return null;
  var p = new cavalry.Path(), w = comp.width / 2, h = comp.height / 2;
  p.moveTo(-w, -h); p.lineTo(w, -h); p.lineTo(w, h); p.lineTo(-w, h); p.close();
  var id = api.createEditable(p, cut.id + ' / Background');
  api.parent(id, parent);
  api.setFill(id, true); api.setStroke(id, false);
  api.set(id, { position: [0, 0], 'material.materialColor': cut.background });
  clip(id, cut.start, cut.end);
  api.select([id]); api.moveToBack();
  return id;
}
var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

/* Opacity envelope of a node: linear in, hold, linear out.
   Keys are sparse (4 per node) unless in/out overlap — the product of two ramps is not linear. */
function envelopeFrames(cut, appear) {
  var start = Math.max(cut.start, appear), end = cut.end;
  if (start >= end) return null;
  var inEnd = appear + cut.inFrames, outStart = cut.sourceEnd - cut.outFrames;
  var overlap = cut.enter !== 'cut' && cut.exit !== 'cut' && inEnd > outStart;
  if (overlap) {
    var all = [];
    for (var f = start; f < end; f++) all.push(f);
    return all;
  }
  var seen = {};
  [start, inEnd, outStart, end - 1].forEach(function (f) {
    f = Math.max(start, Math.min(end - 1, Math.round(f)));
    seen[f] = 1;
  });
  return Object.keys(seen).map(Number).sort(function (a, b) { return a - b; });
}
function alphaAt(cut, appear, f) {
  var a = cut.enter === 'cut' ? 1 : clamp01((f - appear) / cut.inFrames);
  var b = cut.exit === 'cut' ? 1 : clamp01((cut.sourceEnd - f) / cut.outFrames);
  return a * b;
}
function buildText(comp, cut, node, parent, options) {
  var appear = cut.origin + node.delayFrames, start = Math.max(cut.start, appear);
  if (start >= cut.end) return null;
  if (node.kind && node.kind !== 'text') throw new Error('Unsupported node kind: ' + node.kind);
  if (node.animationBackend && node.animationBackend !== 'individual-layers') {
    throw new Error('Unsupported animation backend: ' + node.animationBackend);
  }
  var motion = api.create('null', node.id + ' / Motion');
  api.parent(motion, parent);
  clip(motion, start, cut.end);
  var id = api.create('textShape', node.id);
  api.parent(id, motion);
  var font = options.fontOverrides[node.font.key] || node.font;
  api.set(id, { text: node.text, font: { font: font.family, style: font.style }, fontSize: node.size,
    horizontalAlignment: 1, verticalAlignment: 1, autoWidth: true, autoHeight: true,
    position: [0, 0], scale: [1, 1], rotation: 0, 'material.materialColor': node.color });
  api.setFill(id, true); api.setStroke(id, false);
  if (node.vertical) console.warn('JIZURA: vertical text is built horizontally: ' + node.id);
  // Measure in the visible clip, even when the previous scene's playhead was elsewhere.
  clip(id, start, cut.end);
  api.setFrame(start);
  var box = api.getBoundingBox(id, false), sx = node.sx;
  var angle = -node.rotation, radians = angle * Math.PI / 180;
  // left/right anchored items are placed by their measured bbox, not by the centre alignment
  var anchor = node.align === 'left' ? 0.5 : node.align === 'right' ? -0.5 : 0;
  var dx = anchor * (box.width || 0) * sx - box.centre.x * sx;
  var dy = -box.centre.y;
  api.set(id, { scale: [sx, 1], rotation: angle,
    position: [node.x - comp.width / 2 + (dx * Math.cos(radians) - dy * Math.sin(radians)),
      comp.height / 2 - node.y + (dx * Math.sin(radians) + dy * Math.cos(radians))] });
  var full = api.get(motion, 'opacity');
  if (typeof full !== 'number' || !isFinite(full) || full <= 0) throw new Error('Could not determine native opacity range');
  var frames = envelopeFrames(cut, appear);
  for (var i = 0; i < frames.length; i++) {
    var f = frames[i];
    api.keyframe(motion, f, { opacity: full * alphaAt(cut, appear, f) });
    api.modifyKeyframe(motion, { opacity: { frame: f, type: 1 } });
  }
  return { text: id, motion: motion };
}
function run(assembly, options) {
  options = options || {};
  options.fontOverrides = options.fontOverrides || {};
  if (!assembly || assembly.format !== 'jizura.cavalry.assembly' || assembly.version !== 1) throw new Error('Unsupported JIZURA Cavalry assembly');
  var comp = assembly.composition;
  if (!comp || ![comp.width, comp.height, comp.fps, comp.frameCount].every(function (v) { return typeof v === 'number' && isFinite(v) && v > 0; }) ||
      Math.floor(comp.frameCount) !== comp.frameCount || !Array.isArray(assembly.cuts)) throw new Error('Invalid composition');
  assembly.cuts.forEach(function (cut) {
    if (!Number.isInteger(cut.start) || !Number.isInteger(cut.end) || cut.start < 0 || cut.end <= cut.start || cut.end > comp.frameCount ||
        !Number.isInteger(cut.origin) || !Number.isInteger(cut.sourceEnd) || !(cut.inFrames > 0) || !(cut.outFrames > 0) || !Array.isArray(cut.nodes)) throw new Error('Invalid cut');
    cut.nodes.forEach(function (node) {
      if (!node.font || typeof node.text !== 'string' || ![node.x, node.y, node.size, node.sx, node.rotation, node.delayFrames].every(function (v) { return typeof v === 'number' && isFinite(v); }) || node.size <= 0) throw new Error('Invalid text node');
    });
  });
  var compId = api.createComp(assembly.title);
  api.setActiveComp(compId);
  api.set(compId, { 'resolution.x': comp.width, 'resolution.y': comp.height });
  // Timing paths are version specific: pass a profile only after checking Copy Scripting Path in the host.
  // shortcut: timing stays manual until a real profile exists; see docs/CAVALRY_EXPORT.md.
  if (options.timingPaths) {
    setOne(compId, options.timingPaths.fps, comp.fps);
    if (options.timingPaths.start != null) setOne(compId, options.timingPaths.start, 0);
    if (options.timingPaths.end != null) setOne(compId, options.timingPaths.end, comp.frameCount - 1);
  }
  var root = api.create('null', 'JIZURA / ' + assembly.title);
  clip(root, 0, comp.frameCount);
  var ids = [root];
  for (var i = 0; i < assembly.cuts.length; i++) {
    var cut = assembly.cuts[i], group = api.create('null', cut.id);
    api.parent(group, root); clip(group, cut.start, cut.end); ids.push(group);
    var bg = background(comp, cut, group);
    if (bg) ids.push(bg);
    for (var n = 0; n < cut.nodes.length; n++) {
      var built = buildText(comp, cut, cut.nodes[n], group, options);
      if (built) { ids.push(built.text); ids.push(built.motion); }
    }
  }
  api.setFrame(0); api.select([root]);
  if (options.componentPath && !api.writeToFile(options.componentPath, api.serialise(ids, true), false)) throw new Error('Failed to write Cavalry component');
  console.log('JIZURA: set Composition Settings to ' + comp.fps + ' fps, frame range 0–' + (comp.frameCount - 1) + '.');
  console.log('Checks before rendering:\n' + (assembly.hostChecks || []).join('\n'));
  if (assembly.blockingWarnings && assembly.blockingWarnings.length) console.warn('Approximations:\n' + assembly.blockingWarnings.join('\n'));
  return { compositionId: compId, rootId: root, layerIds: ids };
}
return { run: run };
})();
