/* Host value normalisation for the Cavalry runtime.
   Cavalry returns some attributes as arrays and some as {x, y, z} objects depending on node type and build;
   reading only one shape silently produces NaN coordinates. Everything here fails loudly instead, so a
   mis-read value becomes a report entry rather than an invisible broken layer. */
var JZHostValues = (function () {
'use strict';

function finite(value, label) {
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new Error('Invalid numeric host value: ' + label + ' (' + JSON.stringify(value) + ')');
  }
  return value;
}

/* position / scale / rotation come back as [x, y] or { x, y, z } */
function vector2(value, label) {
  if (Array.isArray(value)) {
    if (value.length < 2) throw new Error('Expected a 2D vector from host: ' + label);
    return [finite(value[0], label + '.x'), finite(value[1], label + '.y')];
  }
  if (value && typeof value === 'object' && 'x' in value && 'y' in value) {
    return [finite(value.x, label + '.x'), finite(value.y, label + '.y')];
  }
  throw new Error('Expected vector from host: ' + label + ' (' + JSON.stringify(value) + ')');
}

/* text may round-trip as a plain string or as { text } */
function text(value, label) {
  if (typeof value === 'string') return value;
  if (value && typeof value.text === 'string') return value.text;
  throw new Error('Unexpected text value returned by host: ' + (label || 'text') + ' (' + JSON.stringify(value) + ')');
}

/* After api.set(id, { text }): the host value must still be exactly what the assembly asked for.
   This does not restore anything; it fails at the layer that lost the string. */
function assertTextRoundTrip(layerId, expected) {
  var actual = text(api.get(layerId, 'text'), layerId + '.text');
  if (actual !== expected) {
    throw new Error('Text round-trip failed for ' + layerId +
      '\nExpected: ' + JSON.stringify(expected) + '\nActual: ' + JSON.stringify(actual));
  }
}

function validateBounds(bounds, label) {
  if (!bounds || !bounds.centre) throw new Error('Missing bounds: ' + label);
  [['width', bounds.width], ['height', bounds.height],
    ['centre.x', bounds.centre.x], ['centre.y', bounds.centre.y]].forEach(function (pair) {
    finite(pair[1], label + '.' + pair[0]);
  });
  if (bounds.width < 0 || bounds.height < 0) throw new Error('Negative bounds: ' + label);
  return bounds;
}

/* Path.empty() / pointCount() / boundingBox() are documented; older builds may lack them, so each check is
   used only when present, and a path that is provably empty never becomes a "built" shape. */
function assertPath(path, label, minPoints) {
  if (!path) throw new Error('Missing path: ' + label);
  if (typeof path.empty === 'function' && path.empty()) throw new Error('Empty input geometry: ' + label);
  if (typeof path.pointCount === 'function' && path.pointCount() < (minPoints || 2)) {
    throw new Error('Degenerate path (' + path.pointCount() + ' points): ' + label);
  }
  if (typeof path.boundingBox === 'function') {
    var box = validateBounds(path.boundingBox(), label);
    if (!(box.width > 0) || !(box.height > 0)) throw new Error('Degenerate bounds: ' + label);
  }
  return path;
}

/* api.get(id, 'opacity') is the node's own 100%: scale a shape relative to it rather than assuming 100. */
function scaledOpacity(layerId, factor) {
  var full = api.get(layerId, 'opacity');
  finite(full, layerId + '.opacity');
  if (!(full > 0)) return null;
  return full * factor;
}

return {
  finite: finite, vector2: vector2, text: text,
  assertTextRoundTrip: assertTextRoundTrip, validateBounds: validateBounds,
  assertPath: assertPath, scaledOpacity: scaledOpacity
};
})();
