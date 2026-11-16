/* JZPresets: preset name -> Cavalry builder. Runs only inside Cavalry (needs api and cavalry), never in the browser.
   Every builder is wrapped by runtime.js in try/catch, so one bad attribute path cannot stop a composition.
   Attribute paths used here are the ones already used by runtime.js plus documented API calls; verify others
   with Copy Scripting Path in Cavalry. */
var JZPresets = (function () {
'use strict';
var R = { enter: {}, exit: {}, bg: {}, cam: {}, treat: {}, decor: {} };
var FAMILY = {
  enter: [[/wip|slide|sweep|push|shutter/i, 'slide'], [/flip|spin|roll/i, 'flip'],
          [/bounce|drop|pour|fall/i, 'drop'], [/pop|stamp|zoom|scale/i, 'pop'],
          [/rise|mask|up/i, 'rise'], [/type|cursor/i, 'type']],
  exit:  [[/wip|sweep|cover|slide|finder/i, 'slide'], [/sink|fall|drop/i, 'drop'],
          [/pop|spin|zoom/i, 'pop'], [/redact|focus|blind|split/i, 'fade']],
  cam:   [[/pan/i, 'pan'], [/zoom|wind|step/i, 'zoom'], [/roll|tilt|italic/i, 'roll'],
          [/hand|shake|rock|arc|sweep/i, 'handheld']],
  bg:    [[/dot|halftone|plexus|grid/i, 'dots'], [/frame|border/i, 'frame'], [/big|char/i, 'bigChar'], [/split/i, 'split']],
  treat: [[/under|toc|leader/i, 'underline'], [/box|outline/i, 'boxed'], [/marker|high|scale|dots/i, 'marker']],
  decor: [[/crop|track/i, 'cropMarks'], [/ruler|ladder|slider/i, 'ruler'], [/index|timecode|num/i, 'indexNum']]
};
function reg(kind, name, fn) { R[kind][name] = fn; }
function resolve(kind, name) {
  if (R[kind][name]) return R[kind][name];
  var list = FAMILY[kind] || [];
  for (var i = 0; i < list.length; i++) if (list[i][0].test(name) && R[kind][list[i][1]]) return R[kind][list[i][1]];
  return null;
}
function has(kind, name) { return !!(name && (name === 'cut' || name === 'fade' || resolve(kind, name))); }

function rng(seed) { var a = (seed >>> 0) || 1; return function () { a |= 0; a = a + 0x6D2B79F5 | 0;
  var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function rectPath(x, y, w, h) { var p = new cavalry.Path(); p.moveTo(x, y); p.lineTo(x + w, y); p.lineTo(x + w, y + h); p.lineTo(x, y + h); p.close(); return p; }
function circle(p, cx, cy, r) { var k = 0.5523 * r;
  p.moveTo(cx + r, cy); p.cubicTo(cx + r, cy + k, cx + k, cy + r, cx, cy + r);
  p.cubicTo(cx - k, cy + r, cx - r, cy + k, cx - r, cy); p.cubicTo(cx - r, cy - k, cx - k, cy - r, cx, cy - r);
  p.cubicTo(cx + k, cy - r, cx + r, cy - k, cx + r, cy); p.close(); }
function fillShape(path, name, parent, color, c, opacity) {
  var id = api.createEditable(path, name);
  api.parent(id, parent); api.setFill(id, true); api.setStroke(id, false);
  api.set(id, { position: [0, 0], 'material.materialColor': color });
  if (opacity != null) api.set(id, { opacity: api.get(id, 'opacity') * opacity });
  api.setInFrame(id, c.cut.start); api.setOutFrame(id, c.cut.end - 1);
  return id;
}
function key(id, attr, f, v) { var d = {}; d[attr] = v; api.keyframe(id, f, d); }
function ease(id, attr, f, name) { try { api.magicEasing(id, attr, f, name); } catch (e) { /* easing name unavailable in this build */ } }
function tween(id, attr, f0, f1, v0, v1, easing) { key(id, attr, f0, v0); key(id, attr, f1, v1); if (easing) ease(id, attr, f0, easing); }
function scheme(c) { return c.assembly.style.schemes[c.cut.presets.scheme] || c.assembly.style.schemes[0]; }
function unionBox(c) {
  var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  (c.texts || []).forEach(function (t) {
    api.setFrame(c.cut.start);
    var b = api.getBoundingBox(t, false), p = api.get(t, 'position'), s = api.get(t, 'scale');
    var cx = p[0] + b.centre.x * s[0], cy = p[1] + b.centre.y * s[1], hw = b.width * s[0] / 2, hh = b.height * s[1] / 2;
    x0 = Math.min(x0, cx - hw); x1 = Math.max(x1, cx + hw); y0 = Math.min(y0, cy - hh); y1 = Math.max(y1, cy + hh);
  });
  return x0 > x1 ? null : { x0: x0, x1: x1, y0: y0, y1: y1 };
}

/* ENTER / EXIT: ctx = { motion, text, from, to, dir (+1 enter, -1 exit), comp, cut, node } */
function pose(c, attr, rest, off, easing) {
  var a = c.dir > 0 ? off : rest, b = c.dir > 0 ? rest : off;
  tween(c.motion, attr, c.from, c.to, a, b, easing);
}
reg('enter', 'slide', function (c) { pose(c, 'position.x', 0, -c.comp.width * 0.12 * (c.node.x < c.comp.width / 2 ? 1 : -1), 'ExpoOut'); });
reg('exit',  'slide', function (c) { pose(c, 'position.x', 0,  c.comp.width * 0.12 * (c.node.x < c.comp.width / 2 ? -1 : 1)); });
reg('enter', 'rise',  function (c) { pose(c, 'position.y', 0, -c.node.size * 0.8, 'ExpoOut'); });
reg('exit',  'rise',  function (c) { pose(c, 'position.y', 0,  c.node.size * 0.8); });
reg('enter', 'drop',  function (c) { pose(c, 'position.y', 0,  c.comp.height * 0.25, 'BounceOut'); });
reg('exit',  'drop',  function (c) { pose(c, 'position.y', 0, -c.comp.height * 0.25); });
reg('enter', 'pop',   function (c) { pose(c, 'scale.x', 1, 0.6, 'ExpoOut'); pose(c, 'scale.y', 1, 0.6, 'ExpoOut'); });
reg('exit',  'pop',   function (c) { pose(c, 'scale.x', 1, 1.4); pose(c, 'scale.y', 1, 1.4); });
reg('enter', 'flip',  function (c) { pose(c, 'scale.x', 1, 0.02, 'ExpoOut'); });
reg('exit',  'flip',  function (c) { pose(c, 'scale.x', 1, 0.02); });
/* per-character stagger: Sub-Mesh + Stagger (pattern from Cavalry's bouncy-text example) */
reg('enter', 'type', function (c) {
  var chars = c.node.text.replace(/\n/g, '').length || 1, offset = Math.min(c.to - c.from, chars * 2);
  var sm = api.create('subMesh', c.node.id + ' / Char Reveal');
  api.keyframe(sm, c.from, { 'shapePosition.y': -c.node.size * 0.6 }); api.keyframe(sm, c.from + 8, { 'shapePosition.y': 0 });
  ease(sm, 'shapePosition.y', c.from, 'BounceOut');
  api.connect(sm, 'id', c.text, 'deformers'); api.parent(sm, c.text);
  var st = api.create('stagger', c.node.id + ' / Stagger');
  api.set(st, { minimum: -offset, maximum: 0 }); api.flipGraph(st, 'graph', 'vertical');
  api.connect(st, 'id', sm, 'shapeTimeOffset'); api.parent(st, c.text);
});

/* BG: ctx = { cut, comp, assembly, parent, preset } */
reg('bg', 'dots', function (c) {
  var S = scheme(c), P = c.preset.params || {}, r = rng(P.seed || c.cut.source.seed || 1);
  var W = c.comp.width, H = c.comp.height, cell = Math.max(24, (P.cell || 0.04) * W), p = new cavalry.Path();
  var dir = (P.dir || 135) * Math.PI / 180, dx = Math.cos(dir), dy = Math.sin(dir);
  for (var y = -H / 2; y <= H / 2; y += cell) for (var x = -W / 2; x <= W / 2; x += cell) {
    var g = ((x * dx + y * dy) / (W * 0.5) + 1) / 2;
    var rad = cell * 0.5 * Math.max(0, Math.min(1, g)) * (0.6 + 0.4 * r());
    if (rad > 1) circle(p, x, y, rad);
  }
  var id = fillShape(p, c.cut.id + ' / Halftone', c.parent, S.dim || S.sub, c, 0.55);
  api.select([id]); api.moveToBack();
});
reg('bg', 'frame', function (c) {
  var S = scheme(c), W = c.comp.width, H = c.comp.height, m = 36, t = 4, p = new cavalry.Path();
  p.append(rectPath(-W / 2 + m, H / 2 - m - t, W - 2 * m, t)); p.append(rectPath(-W / 2 + m, -H / 2 + m, W - 2 * m, t));
  p.append(rectPath(-W / 2 + m, -H / 2 + m, t, H - 2 * m)); p.append(rectPath(W / 2 - m - t, -H / 2 + m, t, H - 2 * m));
  fillShape(p, c.cut.id + ' / Frame', c.parent, S.fg, c);
});
reg('bg', 'bigChar', function (c) {
  var S = scheme(c), n0 = c.cut.nodes[0], id = api.create('textShape', c.cut.id + ' / Big Char');
  api.parent(id, c.parent);
  api.set(id, { text: (n0 ? n0.text : ' ').replace(/\n/g, '').charAt(0), fontSize: c.comp.height * 1.1,
    'material.materialColor': S.dim || S.sub, autoWidth: true, autoHeight: true });
  if (n0 && n0.font) api.set(id, { font: { font: n0.font.family, style: n0.font.style } });
  api.set(id, { opacity: api.get(id, 'opacity') * 0.5 });
  api.setInFrame(id, c.cut.start); api.setOutFrame(id, c.cut.end - 1);
  api.select([id]); api.moveToBack();
});
reg('bg', 'split', function (c) {
  var S = scheme(c), W = c.comp.width, H = c.comp.height;
  var id = fillShape(rectPath(-W / 2, -H / 2, W, H / 2), c.cut.id + ' / Split', c.parent, S.accent, c, 0.9);
  api.select([id]); api.moveToBack();
});

/* CAM: moves the per-cut Camera null. ctx = { rig, cut, comp, preset } */
reg('cam', 'pan', function (c) {
  var P = c.preset.params || {}, d = (P.dir || (/R/.test(c.preset.name) ? -1 : 1)), a = (P.a || 0.04) * c.comp.width * d;
  tween(c.rig, 'position.x', c.cut.start, c.cut.end - 1, -a / 2, a / 2);
});
reg('cam', 'zoom', function (c) {
  var P = c.preset.params || {}, z = 1 + (P.a || P.b || 0.05);
  tween(c.rig, 'scale.x', c.cut.start, c.cut.end - 1, 1, z); tween(c.rig, 'scale.y', c.cut.start, c.cut.end - 1, 1, z);
});
reg('cam', 'roll', function (c) {
  var P = c.preset.params || {}; tween(c.rig, 'rotation', c.cut.start, c.cut.end - 1, 0, (P.a || 2) * (P.dir || 1));
});
reg('cam', 'handheld', function (c) {
  var P = c.preset.params || {}, r = rng(c.cut.source.seed || 7), amp = (P.f || P.a || 1) * 6;
  for (var f = c.cut.start; f < c.cut.end; f += 3) {
    key(c.rig, 'position.x', f, (r() - 0.5) * amp); key(c.rig, 'position.y', f, (r() - 0.5) * amp);
  }
});

/* TREAT / DECOR: ctx = { cut, comp, parent, texts, preset, assembly } */
reg('treat', 'underline', function (c) {
  var b = unionBox(c); if (!b) return; var S = scheme(c), h = Math.max(4, c.comp.height * 0.006);
  fillShape(rectPath(b.x0, b.y0 - h * 3, b.x1 - b.x0, h), c.cut.id + ' / Underline', c.parent, S.accent, c);
});
reg('treat', 'boxed', function (c) {
  var b = unionBox(c); if (!b) return; var S = scheme(c), m = 14, t = 5, p = new cavalry.Path();
  var x = b.x0 - m, y = b.y0 - m, w = b.x1 - b.x0 + 2 * m, h = b.y1 - b.y0 + 2 * m;
  p.append(rectPath(x, y, w, t)); p.append(rectPath(x, y + h - t, w, t)); p.append(rectPath(x, y, t, h)); p.append(rectPath(x + w - t, y, t, h));
  fillShape(p, c.cut.id + ' / Box', c.parent, S.accent, c);
});
reg('treat', 'marker', function (c) {
  var b = unionBox(c); if (!b) return; var S = scheme(c);
  var id = fillShape(rectPath(b.x0, b.y0, b.x1 - b.x0, (b.y1 - b.y0) * 0.45), c.cut.id + ' / Marker', c.parent, S.accent2 || S.accent, c, 0.45);
  api.select([id]); api.moveToBack();
});
reg('decor', 'cropMarks', function (c) {
  var S = scheme(c), W = c.comp.width, H = c.comp.height, m = 40, L = 36, t = 3, p = new cavalry.Path();
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) {
    var x = s[0] * (W / 2 - m), y = s[1] * (H / 2 - m);
    p.append(rectPath(x - (s[0] > 0 ? L : 0), y - t / 2, L, t)); p.append(rectPath(x - t / 2, y - (s[1] > 0 ? L : 0), t, L));
  });
  fillShape(p, c.cut.id + ' / Crop marks', c.parent, S.sub, c);
});
reg('decor', 'ruler', function (c) {
  var S = scheme(c), W = c.comp.width, H = c.comp.height, p = new cavalry.Path();
  for (var i = 0; i <= 40; i++) { var x = -W / 2 + (W * i) / 40, h = i % 5 === 0 ? 28 : 14; p.append(rectPath(x - 1, H / 2 - 30 - h, 2, h)); }
  fillShape(p, c.cut.id + ' / Ruler', c.parent, S.sub, c);
});
reg('decor', 'indexNum', function (c) {
  var S = scheme(c), id = api.create('textShape', c.cut.id + ' / Index'); api.parent(id, c.parent);
  api.set(id, { text: 'No.' + ('0' + (parseInt(String(c.cut.id).replace(/\D/g, ''), 10) + 1)).slice(-2), fontSize: 28,
    position: [-c.comp.width / 2 + 90, c.comp.height / 2 - 60], 'material.materialColor': S.sub, autoWidth: true, autoHeight: true });
  api.setInFrame(id, c.cut.start); api.setOutFrame(id, c.cut.end - 1);
});

return { has: has, resolve: resolve };
})();
