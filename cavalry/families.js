/* One preset vocabulary for both sides of the export.
   The page predicts what Cavalry will build (warnings in the export dialog) and the runtime resolves the
   same names to the same builders, so the two cannot drift apart.
   `built` lists canonical builders registered in presets.js; the two envelope presets `cut` and `fade`
   are listed for enter/exit because the runtime handles them without a builder.
   `native` lists names that have their own Cavalry port (not a family stand-in). A native port is still
   `exact: false`: it is a port, not a pixel-identical copy of the web renderer.
   `map` is a family rule: an approximation, never an exact port. `resolve` always says which it is. */
var JZFamilies = (function () {
'use strict';

var KINDS = {
  enter: {
    built: ['cut', 'fade', 'slide', 'rise', 'drop', 'pop', 'flip', 'type'],
    native: [],
    map: [
      [/type|typing|scramble|matrix|odometer|count|dither|hatch|brush|ink|stroke|draw|print|register|echo/i, 'type'],
      [/flip|spin|roll|fold|card|cylinder|spiral|tilt|skew|rotate|unroll|fan|zipper/i, 'flip'],
      [/bounce|drop|fall|pour|squash|ball|settle|spring|pendulum|rock|slingshot|magnet|toss|domino/i, 'drop'],
      [/pop|zoom|scale|stretch|snap|punch|sticker/i, 'pop'],
      [/rise|mask|lift|float/i, 'rise'],
      [/wip|slide|sweep|push|pull|shutter|track|rail|iris|blind|checker|diag|split|slice|clock|quarter/i, 'slide']
    ]
  },
  exit: {
    built: ['cut', 'fade', 'slide', 'rise', 'drop', 'pop', 'flip'],
    map: [
      [/flip|spin|roll|fold|card|rotate|tilt|skew|cylinder|spiral/i, 'flip'],
      [/sink|fall|drop|pour|squash|melt|gravity|ball|bounce/i, 'drop'],
      [/rise|lift|float/i, 'rise'],
      [/pop|zoom|scale|shrink|punch|snap|stamp/i, 'pop'],
      [/wip|slide|sweep|cover|finder|shutter|track|iris|blind|split|slice|wipe/i, 'slide']
    ]
  },
  bg: {
    built: ['dots', 'frame', 'bigChar', 'split'],
    map: [
      [/big|char|glyph|letter|kanji|typ/i, 'bigChar'],
      [/frame|border|letterbox|crop|ruler|registration|bars/i, 'frame'],
      [/dot|halftone|plexus|grid|polka|tess|hex|truchet|moire|ascii/i, 'dots'],
      [/split|band|stripe|panel|half|curtain|ring|disc/i, 'split']
    ]
  },
  cam: {
    built: ['pan', 'zoom', 'roll', 'handheld'],
    map: [
      [/push|pull|zoom|dolly|rush|focus|lens|tele|vertigo|punch|impact|breath|heartbeat|beat|long/i, 'zoom'],
      [/roll|dutch|tilt|italic|twist|spin|shear|card|ladder|kick|turn/i, 'roll'],
      [/hand|shake|nudge|tripod|float|jelly|nervous|quake|earth|shiver|recoil|skid|wind|leaf|creep|sway/i, 'handheld'],
      [/pan|truck|side|drift|sweep|whip|snap|orbit|arc|walk|flip/i, 'pan']
    ]
  },
  treat: {
    built: ['underline', 'boxed', 'marker'],
    map: [
      [/box|outline|frame|border|crop|bracket|plate|circled|hollow|stencil|emboss|extrude|shadow|glow/i, 'boxed'],
      [/under|toc|leader|rule|line|thread|baseline|dim|water/i, 'underline'],
      [/marker|high|accent|spot|stripe|band|fill|neon|hiliter|kerning|baseline|size/i, 'marker']
    ]
  },
  decor: {
    built: ['cropMarks', 'ruler', 'indexNum'],
    map: [
      [/index|num|timecode|count|page|date|version|stamp|badge|counter|tally|clock|calendar|serial/i, 'indexNum'],
      [/crop|registration|corner|guide|tick|mark|bracket|tether|frame|reticle|crosshair|grid/i, 'cropMarks'],
      [/ruler|ladder|scale|measure|dimension|caliper|protractor|level|plumb|compass|gauge|progress|bar|axis/i, 'ruler']
    ]
  },
  /* Not implemented at all: reported as missing, never approximated. */
  trans: { built: [], map: [] },
  fx: { built: [], map: [] }
};

function resolve(kind, name) {
  var k = KINDS[kind];
  if (!k || typeof name !== 'string' || !name) return { state: 'missing', as: null };
  if (k.built.indexOf(name) >= 0) return { state: 'exact', as: name };
  for (var i = 0; i < k.map.length; i++) {
    if (k.map[i][0].test(name) && k.built.indexOf(k.map[i][1]) >= 0) return { state: 'fallback', as: k.map[i][1] };
  }
  return { state: 'missing', as: null };
}
function built(kind) { return KINDS[kind] ? KINDS[kind].built.slice() : []; }
function kinds() { return Object.keys(KINDS); }

return { kinds: kinds, built: built, resolve: resolve };
})();
