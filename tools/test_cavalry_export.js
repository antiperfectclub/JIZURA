#!/usr/bin/env node
/* Contract tests; the API mock does not certify host rendering. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const J = { FONTS: { test: { family: '"Test Font"', weight: 900 } }, lang: 'ja',
  setLang(lang) { this.lang = lang; }, faceOf() { return { family: '"한국어 Font"', weight: 500 }; },
  fitSize: () => 80, komaOf: () => 0 };
const ctx = vm.createContext({ J, Blob, console });
for (const file of ['src/01_util.js', 'src/06_layouts.js']) {
  if (file.includes('01_util')) ctx.window = { J };
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx);
}
vm.runInContext(fs.readFileSync(path.join(root, 'src/11r_cavalry.js'), 'utf8'), ctx);
assert(fs.readFileSync(path.join(root, 'src/11r_cavalry.js'), 'utf8').includes(fs.readFileSync(path.join(root, 'cavalry/browser.js'), 'utf8')), 'browser bundle must be current');
assert.equal(J.Cavalry.runtimeSource, fs.readFileSync(path.join(root, 'cavalry/runtime.js'), 'utf8'), 'bundle must be current');
const cut = { index: 0, layout: 'center', text: '가사', start: 0, end: 2, seed: 42, inDur: 0.5, outDur: 0.5,
  enter: 'fade', exit: 'fade', hold: 'still', params: { font: 'test', sx: 1.2, ox: 0.1, oy: -0.2, track: 0.1 } };
const plan = { W: 800, H: 600, fps: 10, duration: 2, lang: 'ko', title: '</script>가사',
  style: { fonts: { display: ['test'] }, schemes: [{ fg: '#ffffff', bg: '#112233', accent: '#ff0000' }] },
  cuts: [cut], fx: { chroma: 0, texture: 0, glitch: 0 } };
const before = JSON.stringify(plan);
const a = J.Cavalry.assemble({ plan, range: { t0: 0.2, t1: 1.5 } });
assert.equal(JSON.stringify(plan), before);
assert.equal(J.lang, 'ja', 'language state restored');
assert.equal(a.audioOffset, 0.2);
assert.equal(a.composition.frameCount, 13);
assert.equal(a.cuts[0].origin, -2);
assert.equal(a.cuts[0].sourceEnd, 18);
assert.equal(a.cuts[0].nodes[0].font.style, 'Medium');
assert.throws(() => J.Cavalry.assemble({ plan, strict: true }), /Composition Settings/);
assert.throws(() => J.Cavalry.assemble({ plan: { ...plan, centerFree: true } }), /clipping/);
assert.throws(() => J.Cavalry.assemble({ plan, range: { t0: 2, t1: 1 } }), /Invalid/);
assert.throws(() => J.Cavalry.assemble({ plan: { ...plan, fps: Infinity } }), /Invalid/);
const fallback = J.Cavalry.assemble({ plan: { ...plan, cuts: [{ ...cut, layout: 'mixed', params: { fontBig: 'test', ox: 99 } }] } });
assert.equal(fallback.cuts[0].nodes[0].x, 400, 'fallback must not reinterpret layout params');
assert(fallback.warnings.some(w => w.includes('center fallback')));
const sc = { ...cut, layout: 'scatter', text: '漢가 A', stagger: 0.2, params: { font: 'test', fontB: 'test' } };
const scatter = J.Cavalry.assemble({ plan: { ...plan, cuts: [sc] } });
const drawn = [];
J.mainDraw = (_, it) => { drawn.push(it); return null; };
J.LAYOUTS.scatter.render({ W: 800, H: 600, sc: plan.style.schemes[0], cut: sc });
scatter.cuts[0].nodes.forEach((node, i) => {
  for (const k of ['text', 'size', 'x', 'y', 'color']) assert.equal(node[k], drawn[i][k], 'scatter ' + k);
  assert.equal(node.rotation, drawn[i].rot);
  assert.equal(node.delayFrames, i * 2);
});

const layers = new Map(), keys = [], writes = [];
let counter = 0;
const create = (type, name) => { const id = type + '#' + counter++; layers.set(id, { type, name }); return id; };
const api = {
  create, createComp: name => create('composition', name), setActiveComp() {},
  set(id, values) { Object.assign(layers.get(id), values); },
  parent(id, parent) { layers.get(id).parent = parent; },
  setInFrame(id, f) { layers.get(id).start = f; }, setOutFrame(id, f) { layers.get(id).end = f; },
  setFill() {}, setStroke() {}, select() {}, moveToBack() {}, setFrame() {},
  createEditable: (_, name) => create('editableShape', name),
  getBoundingBox: () => ({ centre: { x: 10, y: -5 } }), get: () => 100,
  keyframe(id, frame, value) { keys.push({ id, frame, value }); },
  modifyKeyframe(_, data) { assert.equal(data.opacity.type, 1); },
  serialise(ids, connections) { assert.equal(connections, true); assert(!ids.includes('unrelated')); return JSON.stringify(ids); },
  writeToFile(file, data, overwrite) { writes.push({ file, data, overwrite }); return true; }
};
class Path { moveTo() {} lineTo() {} close() {} }
const host = vm.createContext({ api, cavalry: { Path }, console: { log() {} } });
vm.runInContext(J.Cavalry.runtimeSource, host);
const result = host.JZCavalry.run(a, { componentPath: '/tmp/song.cvc' });
assert.equal(layers.get(result.rootId).end, 12, 'exclusive end -> inclusive clip');
const text = [...layers.values()].find(l => l.type === 'textShape');
assert.deepEqual(Array.from(text.position), [68, 125], 'asymmetric position and bbox correction');
assert.equal(keys[0].value.opacity, 40, 'range starts partway through original fade');
assert.equal(keys.at(-1).value.opacity, 100, 'range end must not cause premature exit');
assert.equal(new Set(keys.map(k => k.id + '/' + k.frame)).size, keys.length);
assert.equal(writes[0].overwrite, false);
const overlap = JSON.parse(JSON.stringify(a));
Object.assign(overlap.cuts[0], { start: 0, end: 1, origin: 0, sourceEnd: 1, inFrames: 5, outFrames: 5 });
const keyCount = keys.length;
host.JZCavalry.run(overlap);
assert.equal(keys.length - keyCount, 1, 'one-frame overlapping fades produce one key');
assert.equal(keys.at(-1).value.opacity, 0);
for (const [keyBg, color] of [['transparent', null], ['green', '#00ff00'], ['black', '#000000']]) {
  assert.equal(J.Cavalry.assemble({ plan: { ...plan, keyBg } }).cuts[0].background, color);
}
const count = layers.size;
assert.throws(() => host.JZCavalry.run({ ...a, version: 2 }), /Unsupported/);
assert.equal(layers.size, count, 'reject before mutating host');
const late = JSON.parse(JSON.stringify(scatter));
late.cuts[0].nodes.forEach(n => n.delayFrames = 100);
assert.equal(host.JZCavalry.run(late).layerIds.length, 3, 'late stagger produces no text or motion layers');

(async () => {
  let saved;
  J.saveFile = async (name, blob) => { saved = { name, script: await blob.text() }; return 'saved'; };
  assert.equal(await J.Cavalry.download(a), 'saved');
  assert(!saved.name.includes('/'));
  assert(!saved.script.includes('</script>'));
  new vm.Script(saved.script);
  console.log('Cavalry assembly/runtime/download contracts passed.');
})().catch(e => { console.error(e); process.exitCode = 1; });
