/* Runs only in Cavalry's JavaScript Editor or a Scripts-folder panel, never in the browser.
   Needs families.js and presets.js concatenated before it (build_cavalry.py does that). */
var JZCavalry = (function () {
'use strict';
var Z = typeof JZPresets !== 'undefined' ? JZPresets : null;
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

/* One report per run: what this host built exactly, what it approximated, what it dropped, and any builder
   that threw. Everything here is printed at the end so a preset never disappears silently. */
var REPORT = { built: {}, fallback: {}, missing: {}, errors: [] };
function resetReport() { REPORT = { built: {}, fallback: {}, missing: {}, errors: [] }; }
function snapshot() {
  return { built: Object.assign({}, REPORT.built), fallback: Object.assign({}, REPORT.fallback),
    missing: Object.assign({}, REPORT.missing), errors: REPORT.errors.slice() };
}
function runPreset(kind, preset, ctx) {
  if (!preset) return null;
  if (typeof preset.name !== 'string' || !preset.name) { REPORT.missing[kind + ':?'] = 1; return null; }
  var key = kind + ':' + preset.name;
  /* 'none' is an explicit "no preset"; the two envelope presets are built by the opacity keys in buildText */
  if (preset.name === 'none' || ((kind === 'enter' || kind === 'exit') && (preset.name === 'cut' || preset.name === 'fade'))) {
    REPORT.built[key] = 1; return null;
  }
  var r = Z && Z.resolve(kind, preset.name);
  if (!r) { REPORT.missing[key] = 1; return null; }
  try { r.fn(Object.assign({}, ctx, { preset: preset })); }
  catch (e) { REPORT.errors.push(key + ': ' + (e && e.message || e)); return null; }
  if (r.exact) REPORT.built[key] = 1; else REPORT.fallback[key] = r.as;
  return r;
}

/* Opacity envelope of a node: linear in, hold, linear out.
   Keys are sparse (4 per node) unless in/out overlap - the product of two ramps is not linear. */
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
  // Named enter/exit presets add transform motion on top of the opacity envelope.
  var P = cut.presets || {}, base = { motion: motion, text: id, comp: comp, cut: cut, node: node };
  var applyIO = function (kind, from, to, dir) {
    if (!P[kind]) return;
    runPreset(kind, P[kind], Object.assign({}, base, { from: from, to: to, dir: dir }));
  };
  applyIO('enter', appear, appear + cut.inFrames, 1);
  applyIO('exit', cut.sourceEnd - cut.outFrames, cut.sourceEnd, -1);
  return { text: id, motion: motion };
}
function run(assembly, options) {
  options = options || {};
  options.fontOverrides = options.fontOverrides || {};
  resetReport();
  if (!assembly || assembly.format !== 'jizura.cavalry.assembly' || [1, 2, 3].indexOf(assembly.version) < 0) throw new Error('Unsupported JIZURA Cavalry assembly');
  var comp = assembly.composition;
  if (!comp || ![comp.width, comp.height, comp.fps, comp.frameCount].every(function (v) { return typeof v === 'number' && isFinite(v) && v > 0; }) ||
      Math.floor(comp.frameCount) !== comp.frameCount || !Array.isArray(assembly.cuts)) throw new Error('Invalid composition');
  assembly.cuts.forEach(function (cut) {
    if (!Number.isInteger(cut.start) || !Number.isInteger(cut.end) || cut.start < 0 || cut.end <= cut.start || cut.end > comp.frameCount ||
        !Number.isInteger(cut.origin) || !Number.isInteger(cut.sourceEnd) || !(cut.inFrames > 0) || !(cut.outFrames > 0) || !Array.isArray(cut.nodes)) throw new Error('Invalid cut');
    var presets = cut.presets;
    if (presets != null && (typeof presets !== 'object' || Array.isArray(presets))) throw new Error('Invalid cut presets');
    if (presets) {
      ['enter', 'exit', 'bg', 'cam', 'trans', 'treat'].forEach(function (k) {
        var p = presets[k];
        if (p != null && (typeof p !== 'object' || typeof p.name !== 'string')) throw new Error('Invalid cut preset: ' + k);
      });
      if (presets.decor != null && !Array.isArray(presets.decor)) throw new Error('Invalid cut preset: decor');
      (presets.decor || []).forEach(function (d) {
        if (!d || typeof d.name !== 'string') throw new Error('Invalid cut preset: decor');
      });
    }
    cut.nodes.forEach(function (node) {
      if (!node.font || typeof node.text !== 'string' || ![node.x, node.y, node.size, node.sx, node.rotation, node.delayFrames].every(function (v) { return typeof v === 'number' && isFinite(v); }) || node.size <= 0) throw new Error('Invalid text node');
      if (node.kind && node.kind !== 'text') throw new Error('Unsupported node kind: ' + node.kind);
      if (node.animationBackend && node.animationBackend !== 'individual-layers') throw new Error('Unsupported animation backend: ' + node.animationBackend);
      if (node.align && ['left', 'center', 'right'].indexOf(node.align) < 0) throw new Error('Unsupported text alignment: ' + node.align);
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
    var rig = api.create('null', cut.id + ' / Camera');
    api.parent(rig, group); clip(rig, cut.start, cut.end); ids.push(rig);
    var pz = cut.presets || {}, ctx0 = { cut: cut, comp: comp, assembly: assembly, parent: rig, rig: rig, texts: [] };
    var runCutPreset = function (kind, pr) { runPreset(kind, pr, ctx0); };
    runCutPreset('bg', pz.bg);
    for (var n = 0; n < cut.nodes.length; n++) {
      var built = buildText(comp, cut, cut.nodes[n], rig, options);
      if (built) { ids.push(built.text); ids.push(built.motion); ctx0.texts.push(built.text); }
    }
    runCutPreset('treat', pz.treat);
    (pz.decor || []).forEach(function (d) { runCutPreset('decor', d); });
    runCutPreset('cam', pz.cam);
    /* transitions composite two cuts in the planner; this runtime builds one cut at a time */
    if (pz.trans) REPORT.missing['trans:' + pz.trans.name] = 1;
  }
  api.setFrame(0); api.select([root]);
  if (options.componentPath && !api.writeToFile(options.componentPath, api.serialise(ids, true), false)) throw new Error('Failed to write Cavalry component');
  console.log('JIZURA: set Composition Settings to ' + comp.fps + ' fps, frame range 0\u2013' + (comp.frameCount - 1) + '.');
  console.log('Checks before rendering:\n' + (assembly.hostChecks || []).join('\n'));
  if (assembly.blockingWarnings && assembly.blockingWarnings.length) console.warn('Approximations:\n' + assembly.blockingWarnings.join('\n'));
  var missing = Object.keys(REPORT.missing).sort();
  var fallback = Object.keys(REPORT.fallback).sort();
  if (missing.length) console.warn('JIZURA: presets kept in the JSON but not built by this runtime:\n' + missing.join('\n'));
  if (fallback.length) console.warn('JIZURA: presets built as a family approximation:\n' +
    fallback.map(function (k) { return k + ' as ' + REPORT.fallback[k]; }).join('\n'));
  if (REPORT.errors.length) console.warn('JIZURA: preset builders that threw:\n' + REPORT.errors.join('\n'));
  return { compositionId: compId, rootId: root, layerIds: ids, report: snapshot() };
}
return { run: run };
})();
