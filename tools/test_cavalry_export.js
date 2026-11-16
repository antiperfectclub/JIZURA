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
assert.equal(J.Cavalry.panelSource, fs.readFileSync(path.join(root, 'cavalry/panel.js'), 'utf8'), 'panel bundle must be current');

const baseCut = { index: 0, layout: 'center', text: '가사', start: 0, end: 2, seed: 42, inDur: 0.5, outDur: 0.5,
  enter: 'fade', exit: 'fade', hold: 'still', params: { font: 'test', sx: 1.2, ox: 0.1, oy: -0.2, track: 0, lead: 1.2 } };
const plan = { W: 800, H: 600, fps: 10, duration: 2, lang: 'ko', title: '</script>가사',
  style: { fonts: { display: ['test'] }, schemes: [{ fg: '#ffffff', bg: '#112233', accent: '#ff0000' }] },
  cuts: [baseCut], fx: { chroma: 0, texture: 0, glitch: 0 } };

/* ---- assembly ---- */
const before = JSON.stringify(plan);
const a = J.Cavalry.assemble({ plan, range: { t0: 0.2, t1: 1.5 } });
assert.equal(JSON.stringify(plan), before, 'the plan must not be mutated');
assert.equal(J.lang, 'ja', 'language state restored');
assert.equal(a.audioOffset, 0.2);
assert.equal(a.version, 2, 'assembly schema v2');
assert.equal(a.composition.frameCount, 13);
assert.equal(a.cuts[0].origin, -2);
assert.equal(a.cuts[0].sourceEnd, 18);
assert.equal(a.cuts[0].nodes[0].font.style, 'Medium');
assert.equal(a.cuts[0].nodes[0].kind, 'text');
assert.equal(a.cuts[0].nodes[0].granularity, 'whole-text');
assert.equal(a.cuts[0].nodes[0].animationBackend, 'individual-layers');
assert.equal(a.nodeCount, 1);
assert.deepEqual(Array.from(a.capabilities.enter), ['cut', 'fade']);
/* v2 carries the design presets beside the geometry: names are exported even when not built */
assert.equal(a.cuts[0].presets.enter.name, 'fade');
assert.equal(a.cuts[0].presets.enter.inDur, 0.5);
assert.equal(a.cuts[0].presets.exit.name, 'fade');
assert.equal(a.cuts[0].presets.cam, null);
assert.equal(a.cuts[0].presets.hold, 'still');
assert.equal(a.cuts[0].presets.scheme, 0);
assert.equal(a.cuts[0].presets.seed, 42);
assert.equal(a.style.schemes.length, 1, 'palette travels with the assembly');
assert.equal(a.style.fx.chroma, 0);
assert.equal(a.keyBg, null);
assert.equal(a.lang, 'ko');
assert.equal(a.blockingWarnings.length, 0, 'center with no extras is exact: ' + a.blockingWarnings.join(' | '));
assert(a.hostChecks.some(w => /Composition Settings/.test(w)), 'manual FPS is a host check, not an approximation');
assert.doesNotThrow(() => J.Cavalry.assemble({ plan, strict: true }), 'strict allows host checks');
assert.throws(() => J.Cavalry.assemble({ plan: { ...plan, centerFree: true } }), /clipping/);
assert.throws(() => J.Cavalry.assemble({ plan, range: { t0: 2, t1: 1 } }), /Invalid/);
assert.throws(() => J.Cavalry.assemble({ plan: { ...plan, fps: Infinity } }), /Invalid/);
const decorated = { ...baseCut, decor: [{ id: 'crosshair' }] };
assert.throws(() => J.Cavalry.assemble({ plan: { ...plan, cuts: [decorated] }, strict: true }), /decoration/);

/* preset names and planner params are exported verbatim (AE naming, no reinterpretation) */
const extras = J.Cavalry.assemble({ plan: { ...plan, cuts: [{ ...baseCut, decor: [{ id: 'crosshair', n: 2 }],
  bg: 'grain', bgP: { a: 1 }, cam: 'push', camP: { z: 1.2 }, trans: 'wipe', transP: { dir: 1 }, transDur: 0.4,
  treat: 'grain', treatP: { k: 2 }, morph: true }] } });
const pr = extras.cuts[0].presets;
assert.equal(pr.decor[0].name, 'crosshair');
assert.equal(pr.decor[0].params.n, 2, 'decor params keep the planner shape');
assert.equal(pr.bg.name, 'grain');
assert.equal(pr.cam.params.z, 1.2);
assert.equal(pr.trans.name, 'wipe');
assert.equal(pr.trans.frames, 4, 'transition duration is exported in frames');
assert.equal(pr.treat.name, 'grain');
assert.equal(pr.morph, true);
assert.equal(extras.cuts[0].enter, 'fade', 'what will be built is separate from what was asked');

/* layout capture: the real scatter renderer is the source of truth */
const sc = { ...baseCut, layout: 'scatter', text: '漢가 A', stagger: 0.2, params: { font: 'test', fontB: 'test' } };
const scatter = J.Cavalry.assemble({ plan: { ...plan, cuts: [sc] } });
const drawn = [];
J.mainDraw = (_, it) => { drawn.push(it); return null; };
J.LAYOUTS.scatter.render({ W: 800, H: 600, sc: plan.style.schemes[0], cut: sc, lt: 1, pIn: 1, pOut: 0, step: 0,
  draw() {}, line() {}, rect() {}, circle() {}, arc() {}, rrect() {}, poly() {}, blob() {}, polyPartial() {}, st: plan.style, fx: plan.fx });
scatter.cuts[0].nodes.forEach((node, i) => {
  for (const k of ['text', 'size', 'x', 'y', 'color']) assert.equal(node[k], drawn[i][k], 'scatter ' + k);
  assert.equal(node.rotation, drawn[i].rot);
  assert.equal(node.granularity, 'per-character');
  assert.equal(node.delayFrames, i * 2);
});

/* unregistered / throwing layouts fall back with a warning; params are not reinterpreted */
J.LAYOUTS.broken = { render() { throw new Error('boom'); } };
const broken = J.Cavalry.assemble({ plan: { ...plan, cuts: [{ ...baseCut, layout: 'broken', params: { fontBig: 'test', ox: 99 } }] } });
assert.equal(broken.cuts[0].nodes[0].x, 400, 'fallback must not reinterpret layout params');
assert(broken.blockingWarnings.some(w => w.includes('center fallback')));
assert(broken.blockingWarnings.some(w => w.includes('boom')));
/* a layout that reads env.lt is reported as a still */
J.LAYOUTS.moving = { render(env) {
  J.mainDraw(env, { text: 'A', font: 'test', size: 40, x: env.W / 2 + env.lt * 50, y: 300, color: '#fff' });
} };
const moving = J.Cavalry.assemble({ plan: { ...plan, cuts: [{ ...baseCut, layout: 'moving' }] } });
assert(moving.blockingWarnings.some(w => /keeps moving/.test(w)));
/* left anchored text carries the anchor and is exported as such */
J.LAYOUTS.lefty = { render: env => J.mainDraw(env, { text: 'AB', font: 'test', size: 40, x: 100, y: 100, color: '#fff', align: 'left' }) };
const lefty = J.Cavalry.assemble({ plan: { ...plan, cuts: [{ ...baseCut, layout: 'lefty' }] } });
assert.equal(lefty.cuts[0].nodes[0].align, 'left');

/* ---- installed-runtime stand-in ---- */
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
  getBoundingBox: () => ({ centre: { x: 10, y: -5 }, width: 100, height: 20 }), get: () => 100,
  keyframe(id, frame, value) { keys.push({ id, frame, value }); },
  modifyKeyframe(_, data) { assert.equal(data.opacity.type, 1); },
  serialise(ids, connections) { assert.equal(connections, true); assert(!ids.includes('unrelated')); return JSON.stringify(ids); },
  writeToFile(file, data, overwrite) { writes.push({ file, data, overwrite }); return true; }
};
class Path { moveTo() {} lineTo() {} close() {} }
const warnings = [];
const host = vm.createContext({ api, cavalry: { Path }, console: { log() {}, warn: m => warnings.push(String(m)) } });
vm.runInContext(J.Cavalry.runtimeSource, host);
const result = host.JZCavalry.run(a, { componentPath: '/tmp/song.cvc' });
assert.equal(layers.get(result.rootId).end, 12, 'exclusive end -> inclusive clip');
const text = [...layers.values()].find(l => l.type === 'textShape');
assert.deepEqual(Array.from(text.position), [68, 125], 'asymmetric position and bbox correction');
assert.equal(keys[0].value.opacity, 40, 'range starts partway through original fade');
assert.equal(keys.at(-1).value.opacity, 100, 'range end must not cause premature exit');
assert.deepEqual(keys.map(k => k.frame), [0, 3, 12], 'sparse keys describe the same linear envelope');
assert.equal(new Set(keys.map(k => k.id + '/' + k.frame)).size, keys.length);
assert.equal(writes[0].overwrite, false);

/* left anchor: bbox width is added to the position before rotation */
const leftRun = host.JZCavalry.run(lefty);
const leftText = [...layers.values()].filter(l => l.type === 'textShape').at(-1);
assert.deepEqual(Array.from(leftText.position), [-260, 205], 'left anchor uses the measured bbox');
assert.equal(leftRun.layerIds.length, leftRun.layerIds.length);

/* overlapping in/out: the product of two ramps is baked, not approximated */
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
host.JZCavalry.run(extras);
assert(layers.size > count, 'v2 assemblies build');
assert(warnings.some(w => /not built by this runtime/.test(w) && /cam:push/.test(w)), 'unbuilt presets are reported, not dropped silently');
assert(warnings.some(w => /decor:crosshair/.test(w)));
const afterV2 = layers.size;
assert.throws(() => host.JZCavalry.run({ ...a, version: 3 }), /Unsupported/);
assert.equal(layers.size, afterV2, 'reject before mutating host');
const badBackend = JSON.parse(JSON.stringify(a));
badBackend.cuts[0].nodes[0].animationBackend = 'submesh';
assert.throws(() => host.JZCavalry.run(badBackend), /animation backend/);
assert.equal(layers.size, afterV2, 'unknown backend is rejected before creating layers');
const late = JSON.parse(JSON.stringify(scatter));
late.cuts[0].nodes.forEach(n => n.delayFrames = 100);
assert.equal(host.JZCavalry.run(late).layerIds.length, 3, 'late stagger produces no text or motion layers');

(async () => {
  let saved;
  J.saveFile = async (name, blob) => { saved = { name, script: await blob.text() }; return 'saved'; };
  assert.equal(await J.Cavalry.download(a), 'saved');
  assert(!saved.name.includes('/'));
  assert(!saved.script.includes('</script>'));
  assert(saved.script.includes('timingPaths: null'));
  assert(saved.name.endsWith('.cavalry.js'));
  new vm.Script(saved.script);

  /* JSON is the primary artefact: it is what the installed panel reads */
  assert.equal(await J.Cavalry.downloadJson(a, 'song/01'), 'saved');
  assert.equal(saved.name, 'song_01.jizura.cavalry.json');
  const parsed = JSON.parse(saved.script);
  assert.equal(parsed.version, 2);
  assert.equal(parsed.format, 'jizura.cavalry.assembly');
  assert.equal(parsed.cuts.length, a.cuts.length);

  /* panel install file: runtime + UI, runnable from Cavalry's Scripts folder */
  assert.equal(await J.Cavalry.downloadPanel(), 'saved');
  assert(saved.name.endsWith('.js'));
  assert(saved.script.includes('JZCavalry'));
  assert(saved.script.includes('ui.setTitle'));
  new vm.Script(saved.script);
  const dist = path.join(root, 'dist', 'cavalry', 'JIZURA_Cavalry.js');
  assert(fs.existsSync(dist), 'build_cavalry.py must emit the panel install file');
  const distSource = fs.readFileSync(dist, 'utf8');
  assert(distSource.includes('JZCavalry'), 'dist file carries the runtime');
  assert(distSource.includes(fs.readFileSync(path.join(root, 'cavalry/panel.js'), 'utf8').trim()), 'dist panel is current');
  console.log('Cavalry assembly/runtime/JSON/panel contracts passed.');
})().catch(e => { console.error(e); process.exitCode = 1; });
