/* Cavalry Host Smoke Import Script.
 * Run inside Cavalry's Script Editor after installing JIZURA_CV.js (or with JZCavalry in scope).
 * Verifies: comp creation, Unicode Japanese text readback, finite bounding boxes, and layer serialisation. */
(function () {
'use strict';
if (typeof api === 'undefined' || typeof cavalry === 'undefined') {
  throw new Error('Run this smoke script inside Cavalry.');
}
if (typeof JZCavalry === 'undefined' || typeof JZCavalry.run !== 'function') {
  throw new Error('Load JIZURA_CV.js before running host_smoke_import.js.');
}
var sample = {
  format: 'jizura.cavalry.assembly',
  version: 3,
  title: 'JIZURA Host Smoke',
  composition: { width: 1920, height: 1080, fps: 24, frameCount: 72 },
  style: {
    schemes: [{ bg: '#E6E5E0', fg: '#111111', sub: '#4E4E4C', accent: '#D8141B', accent2: '#0A82C8', ink: '#111111', dim: '#D8D7D1', ghostA: '#E4007F', ghostB: '#00A0E9' }],
    ghost: 0.45,
    glow: 0.3,
    texture: { grain: 0.2, paper: 0.2, scan: 0.2 },
    fx: { motion: 0.5, glitch: 0.3, decor: 0.6, texture: 0.6, chroma: 0.3 }
  },
  cuts: [{
    id: 'cut-0', start: 0, end: 72, origin: 0, sourceEnd: 72, inFrames: 8, outFrames: 8,
    background: null,
    source: { layout: 'center', seed: 101 },
    layoutInstruction: { name: 'center', params: {} },
    graphics: [],
    nodes: [{
      id: 'smoke-text-0', kind: 'text', text: '夜明けの色を覚えてる',
      font: { key: 'mincho', family: 'Hiragino Mincho ProN', style: 'W6' },
      x: 960, y: 540, size: 72, sx: 1, rotation: 0, delayFrames: 0,
      track: 0.08, lead: 1.3, align: 'center', color: '#111111'
    }],
    presets: {
      enter: { name: 'cut' }, hold: { name: 'still' }, exit: { name: 'cut' },
      cam: { name: 'tzItalicSet', params: { dir: 1, a: 6.2 } },
      bg: { name: 'skyline', params: { seed: 723624947, k: 0.09, dir: 1, win: 0.28 } },
      decor: [{ name: 'cropMarks', params: {} }]
    }
  }],
  events: [{ t: 0.5, type: 'shake', amp: 0.6, dur: 0.25 }]
};
var result = JZCavalry.run(sample, {});
var textMismatch = [], badBounds = [];
result.layerIds.forEach(function (id) {
  var t = api.get(id, 'text');
  if (typeof t === 'string' && t.indexOf('?') >= 0) textMismatch.push(id + ':' + t);
  var b = api.getBoundingBox(id, false);
  if (b && (!isFinite(b.width) || !isFinite(b.height))) badBounds.push(id);
});
var serialised = api.serialise(result.layerIds, true);
console.log('JIZURA host smoke summary:', JSON.stringify({
  comp: result.compositionId,
  layers: result.layerIds.length,
  serialisedBytes: serialised ? serialised.length : 0,
  textMismatch: textMismatch,
  badBounds: badBounds,
  report: result.report
}));
})();
