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
const read = name => fs.readFileSync(path.join(root, 'cavalry', name), 'utf8');
const bundle = fs.readFileSync(path.join(root, 'src/11r_cavalry.js'), 'utf8');
assert(bundle.includes(read('browser.js')), 'browser bundle must be current');
assert(bundle.includes(read('families.js')), 'the shared preset vocabulary must ship with the page');
for (const name of ['families.js', 'presets.js', 'runtime.js']) {
  assert(J.Cavalry.runtimeSource.includes(read(name)), 'host bundle must carry ' + name);
}
for (const name of ['bridge.js', 'panel.js']) assert(J.Cavalry.panelSource.includes(read(name)), 'panel bundle must carry ' + name);
for (const name of ['bridge.js', 'loader.js']) assert(J.Cavalry.loaderSource.includes(read(name)), 'loader bundle must carry ' + name);

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
assert.deepEqual(Array.from(a.capabilities.enter), ['cut', 'fade', 'slide', 'rise', 'drop', 'pop', 'flip', 'type']);
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
/* a family approximation is built and named, so it is not a reason to stop; a missing preset is */
assert.doesNotThrow(() => J.Cavalry.assemble({ plan: { ...plan, cuts: [{ ...baseCut, cam: 'push' }] }, strict: true }),
  'strict allows named approximations');
assert.equal(J.Cavalry.assemble({ plan: { ...plan, cuts: [{ ...baseCut, cam: 'push' }] } }).presetReport.fallback['cam:push'], 'zoom');
assert.throws(() => J.Cavalry.assemble({ plan: { ...plan, centerFree: true } }), /clipping/);
assert.throws(() => J.Cavalry.assemble({ plan, range: { t0: 2, t1: 1 } }), /Invalid/);
assert.throws(() => J.Cavalry.assemble({ plan: { ...plan, fps: Infinity } }), /Invalid/);
const decorated = { ...baseCut, decor: [{ id: 'zodiacWheel' }] };
assert.throws(() => J.Cavalry.assemble({ plan: { ...plan, cuts: [decorated] }, strict: true }), /decoration/,
  'a decoration with no family blocks exact-only export');

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

/* the same name resolves to the same builder on both sides; families are marked as approximations */
assert.deepEqual(Array.from(extras.capabilities.presets.cam), ['pan', 'zoom', 'roll', 'handheld']);
assert.equal(extras.presetReport.fallback['cam:push'], 'zoom', 'push is built as the zoom family');
assert.equal(extras.presetReport.fallback['decor:crosshair'], 'cropMarks');
assert.equal(extras.presetReport.missing['bg:grain'], 1);
assert.equal(extras.presetReport.missing['trans:wipe'], 1, 'transitions stay unbuilt');
assert.equal(extras.presetReport.missing['treat:grain'], 1);
assert.equal(extras.presetReport.built['enter:fade'], 1, 'the envelope presets are exact');
assert(extras.approxWarnings.some(w => /camera "push" ≈ zoom/.test(w)), 'approximations are named, not hidden');
assert(extras.blockingWarnings.some(w => /background graphic "grain" is not built/.test(w)));
assert(extras.warnings.length >= extras.approxWarnings.length + extras.blockingWarnings.length);

/* the two modules must advertise the same vocabulary, or a warning would lie about the host */
{
  const vocab = vm.createContext({ console: { warn() {} } });
  vm.runInContext(read('families.js') + '\n' + read('presets.js'), vocab);
  for (const kind of vocab.JZFamilies.kinds()) {
    assert.deepEqual(vocab.JZPresets.built(kind), vocab.JZFamilies.built(kind).sort(),
      'families.js and presets.js disagree on the ' + kind + ' presets');
  }
}

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
class Path { moveTo() {} lineTo() {} close() {} append() {} cubicTo() {} }
const warnings = [];
const host = vm.createContext({ api, cavalry: { Path }, console: { log() {}, warn: m => warnings.push(String(m)) } });
vm.runInContext(J.Cavalry.runtimeSource, host);
const result = host.JZCavalry.run(a, { componentPath: '/tmp/song.cvc' });
assert.equal(result.report.built['enter:fade'], 1, 'the opacity envelope is an exact preset');
assert.equal(result.report.missing['cam:push'], undefined, 'no camera asked for, none reported');
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
const v2 = host.JZCavalry.run(extras);
assert(layers.size > count, 'v2 assemblies build');
assert.equal(v2.report.fallback['cam:push'], 'zoom', 'runtime resolves the family the page predicted');
assert.equal(v2.report.fallback['decor:crosshair'], 'cropMarks');
assert.equal(v2.report.missing['bg:grain'], 1);
assert.equal(v2.report.missing['trans:wipe'], 1);
/* the host must not surprise the dialog: every approximation or drop it reports was predicted */
for (const [key, as] of Object.entries(v2.report.fallback)) {
  assert.equal(extras.presetReport.fallback[key], as, 'runtime approximated ' + key + ' without predicting it');
}
for (const key of Object.keys(v2.report.missing)) {
  assert.equal(extras.presetReport.missing[key], 1, 'runtime dropped ' + key + ' without predicting it');
}
assert(warnings.some(w => /family approximation/.test(w) && /cam:push as zoom/.test(w)), 'approximations are printed');
assert(warnings.some(w => /not built by this runtime/.test(w) && /bg:grain/.test(w)));
const afterV2 = layers.size;
assert.throws(() => host.JZCavalry.run({ ...a, version: 4 }), /Unsupported/);
assert.equal(layers.size, afterV2, 'reject before mutating host');
const badBackend = JSON.parse(JSON.stringify(a));
badBackend.cuts[0].nodes[0].animationBackend = 'submesh';
assert.throws(() => host.JZCavalry.run(badBackend), /animation backend/);
assert.equal(layers.size, afterV2, 'unknown backend is rejected before creating layers');
const late = JSON.parse(JSON.stringify(scatter));
late.cuts[0].nodes.forEach(n => n.delayFrames = 100);
const textsBefore = [...layers.values()].filter(l => l.type === 'textShape').length;
assert.equal(host.JZCavalry.run(late).layerIds.length, 4, 'root + cut group + background + camera rig');
assert.equal([...layers.values()].filter(l => l.type === 'textShape').length, textsBefore, 'late stagger produces no text layers');

/* ---- bridge: optional, feature-detected, never required ---- */
const bridgeSrc = read('bridge.js');
const bridgeHost = api2 => {
  const c = vm.createContext({ api: api2, console: { log() {}, warn() {} } });
  vm.runInContext(bridgeSrc, c);
  return c.JZBridge;
};
const plain = bridgeHost({});
assert.equal(plain.server(), false, 'no WebServer in this host');
assert.equal(plain.start(() => { throw new Error('must not run'); }), false, 'panel builds from a picked file instead');
assert.equal(plain.handoff('/tmp/x.json'), false, 'loader builds locally instead');

const serverCalls = [];
let serverInstance = null;
class MockServer {
  constructor() { serverCalls.push(['new']); serverInstance = this; }
  setResultForGet(v) { serverCalls.push(['result', v]); }
  addCallbackObject(callbacks) { this.callbacks = callbacks; serverCalls.push(['callbacks']); }
  listen(host, port) { serverCalls.push(['listen', host, port]); }
  setHighFrequency() { serverCalls.push(['high']); }
  postCount() { return this.postCount_ || 0; }
  getNextPost() { this.postCount_ = Math.max(0, (this.postCount_ || 1) - 1); return { result: JSON.stringify({ path: '/tmp/a.json' }) }; }
}
const delivered = [];
const serverBridge = bridgeHost({
  WebServer: MockServer,
  readFromFile: file => JSON.stringify({ format: 'jizura.cavalry.assembly', file })
});
assert.equal(serverBridge.start(assembly => delivered.push(assembly)), true);
assert.deepEqual(serverCalls.map(c => c[0]), ['new', 'result', 'callbacks', 'listen', 'high']);
assert.deepEqual(serverCalls.find(c => c[0] === 'listen').slice(1), ['localhost', 41234]);
assert.equal(serverCalls.find(c => c[0] === 'result')[1], 'JIZURA_CV/1');
serverInstance.postCount_ = 1;
serverInstance.callbacks.onPost();
serverInstance.postCount_ = 1;
assert.equal(delivered.length, 1, 'a posted path is read and handed to the panel');
assert.equal(delivered[0].format, 'jizura.cavalry.assembly');
assert.equal(serverBridge.start(() => {}), true, 'a second start reuses the bound server');
assert.equal(serverCalls.filter(c => c[0] === 'listen').length, 1, 'the port is bound once');

const throwing = bridgeHost({ WebServer: class { constructor() { throw new Error('no port'); } } });
assert.equal(throwing.start(() => {}), false, 'a host without a usable port still exports');

let clientStatus = 200, clientBody = 'JIZURA_CV/1';
const clientCalls = [];
class MockClient {
  constructor(base) { clientCalls.push(['new', base]); }
  get(path) { clientCalls.push(['get', path]); }
  status() { return clientStatus; }
  body() { return clientBody; }
  post(path, body, type) { clientCalls.push(['post', path, body, type]); }
}
const clientBridge = bridgeHost({ WebClient: MockClient });
assert.equal(clientBridge.handoff('/tmp/song.json'), true);
assert.deepEqual(clientCalls[0], ['new', 'http://localhost:41234']);
assert.deepEqual(clientCalls[1], ['get', '/get']);
assert.deepEqual(JSON.parse(clientCalls[2][2]), { type: 'path', path: '/tmp/song.json' });
clientCalls.length = 0; clientStatus = 404;
assert.equal(clientBridge.handoff('/tmp/song.json'), false, 'no panel answering -> loader builds');
clientCalls.length = 0; clientStatus = 200; clientBody = 'something else';
assert.equal(clientBridge.handoff('/tmp/song.json'), false, 'another server on the port is not ours');
assert(!clientCalls.some(c => c[0] === 'post'), 'nothing is posted to a stranger');
new vm.Script(J.Cavalry.panelSource);
new vm.Script(J.Cavalry.loaderSource);

/* ---- panel and loader UIs (Cavalry is closed, so the widgets are mocked) ---- */
function uiHarness(source, opts) {
  const labels = [], buttons = [], calls = { run: 0 };
  const ui = {
    setTitle() {}, add() {}, addStretch() {}, show() {},
    Label: class { constructor(text) { this.text = text; labels.push(this); } setText(text) { this.text = text; } },
    Button: class { constructor(text) { this.text = text; buttons.push(this); } }
  };
  const api2 = {
    presentOpenFile: () => opts.file, readFromFile: () => opts.json,
    getFolderFromPath: () => '', getSceneFilePath: () => ''
  };
  if (opts.webClient) {
    api2.WebClient = class {
      constructor(base) { this.base = base; }
      get() {}
      status() { return opts.webClient.status; }
      body() { return opts.webClient.body; }
      post(path, body) { opts.webClient.posted = body; }
    };
  }
  const JZCavalry = { run: () => { calls.run += 1; return { layerIds: ['a', 'b'], report: { built: {}, fallback: { 'cam:push': 'zoom' }, missing: {}, errors: [] } }; } };
  const sandbox = { ui, api: api2, JZCavalry, console: { log() {}, warn() {} } };
  const c = vm.createContext(sandbox);
  vm.runInContext(source, c);
  return { labels, buttons, calls };
}
const assemblyJson = JSON.stringify({ format: 'jizura.cavalry.assembly', version: 2, nodeCount: 4 });
const panelRun = uiHarness(J.Cavalry.panelSource, { file: '/tmp/a.json', json: assemblyJson });
assert.equal(panelRun.buttons.length, 1, 'the panel shows one button');
panelRun.buttons[0].onClick();
assert.equal(panelRun.calls.run, 1, 'the panel builds the picked file');
assert.match(panelRun.labels[0].text, /完了/);
assert.match(panelRun.labels[0].text, /近似 1/, 'the panel shows the fallback count');

const loaderLocal = uiHarness(J.Cavalry.loaderSource, { file: '/tmp/a.json', json: assemblyJson });
loaderLocal.buttons[0].onClick();
assert.equal(loaderLocal.calls.run, 1, 'without a panel the loader builds locally');
assert.match(loaderLocal.labels[0].text, /パネルは未接続/);

const client = { status: 200, body: 'JIZURA_CV/1', posted: null };
const loaderBridge = uiHarness(J.Cavalry.loaderSource, { file: '/tmp/a.json', json: assemblyJson, webClient: client });
loaderBridge.buttons[0].onClick();
assert.equal(JSON.parse(client.posted).path, '/tmp/a.json', 'the loader hands the path to the open panel');
assert.equal(loaderBridge.calls.run, 0, 'the loader does not rebuild what the panel accepted');
assert.match(loaderBridge.labels[0].text, /送信/);

const loaderBad = uiHarness(J.Cavalry.loaderSource, { file: '/tmp/a.json', json: '{"format":"other"}' });
loaderBad.buttons[0].onClick();
assert.equal(loaderBad.calls.run, 0, 'a foreign JSON is refused before building');
assert.match(loaderBad.labels[0].text, /JIZURA の JSON ではありません/);

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

  /* panel install file: host code + UI, runnable from Cavalry's Scripts folder */
  assert.equal(await J.Cavalry.downloadPanel(), 'saved');
  assert.equal(saved.name, 'JIZURA_CV.js');
  assert(saved.script.includes('JZCavalry'));
  assert(saved.script.includes('ui.setTitle'));
  new vm.Script(saved.script);
  const dist = path.join(root, 'dist', 'cavalry', 'JIZURA_CV.js');
  assert(fs.existsSync(dist), 'build_cavalry.py must emit the panel install file');
  const distSource = fs.readFileSync(dist, 'utf8');
  assert(distSource.includes('JZCavalry'), 'dist file carries the runtime');
  assert(distSource.includes(read('panel.js').trim()), 'dist panel is current');

  /* loader: same host code, a file picker instead of a resident panel */
  assert.equal(await J.Cavalry.downloadLoader(), 'saved');
  assert.equal(saved.name, 'JIZURA_CV_Loader.js');
  assert(saved.script.includes('JZBridge.handoff'));
  new vm.Script(saved.script);
  const loaderDist = path.join(root, 'dist', 'cavalry', 'JIZURA_CV_Loader.js');
  assert(fs.existsSync(loaderDist), 'build_cavalry.py must emit the loader');
  assert(fs.readFileSync(loaderDist, 'utf8').includes(read('loader.js').trim()), 'dist loader is current');

  /* ---- the shipped file, not a bundle of its parts: run it against a mock Cavalry and press the button ---- */
  function runDist(distPath, options) {
    const files = new Map(), made = [], labels = [], buttons = [];
    let n = 0;
    const mk = (type, name) => { const id = type + '#' + n++; files.set(id, { type, name }); return id; };
    const hostApi = {
      create: mk, createComp: name => mk('composition', name), setActiveComp() {},
      set(id, values) { Object.assign(files.get(id), values); }, parent() {},
      setInFrame() {}, setOutFrame() {}, setFill() {}, setStroke() {}, select() {}, moveToBack() {}, setFrame() {},
      createEditable: (_, name) => mk('editableShape', name),
      getBoundingBox: () => ({ centre: { x: 0, y: 0 }, width: 100, height: 20 }), get: () => 100,
      keyframe() {}, modifyKeyframe() {}, serialise() { return '[]'; }, writeToFile() { return true; },
      presentOpenFile: () => options.file, readFromFile: () => options.json,
      getFolderFromPath: () => '', getSceneFilePath: () => ''
    };
    if (options.webClient) {
      hostApi.WebClient = class {
        get() {} status() { return options.webClient.status; } body() { return options.webClient.body; }
        post(path, body) { options.webClient.posted = body; }
      };
    }
    const ui = {
      setTitle() {}, add() {}, addStretch() {}, show() {},
      Label: class { constructor(text) { this.text = text; labels.push(this); } setText(text) { this.text = text; } },
      Button: class { constructor(text) { this.text = text; buttons.push(this); } }
    };
    const sandbox = { api: hostApi, ui, cavalry: { Path }, console: { log() {}, warn() {} } };
    vm.runInContext(fs.readFileSync(distPath, 'utf8'), vm.createContext(sandbox));
    return { files, made, labels, buttons };
  }

  const panelDist = runDist(path.join(root, 'dist', 'cavalry', 'JIZURA_CV.js'),
    { file: '/tmp/song.json', json: JSON.stringify(a) });
  assert.equal(panelDist.buttons.length, 1, 'the installed panel exposes one button');
  panelDist.buttons[0].onClick();
  assert([...panelDist.files.values()].some(l => l.type === 'textShape'), 'the panel file builds text layers from the JSON');
  assert([...panelDist.files.values()].some(l => l.type === 'composition'), 'it creates a composition');
  assert.match(panelDist.labels[0].text, /完了/, 'the panel reports the result');
  assert.match(panelDist.labels[0].text, /正確 [1-9]/, 'the report counts exact builds');

  const loaderDistRun = runDist(path.join(root, 'dist', 'cavalry', 'JIZURA_CV_Loader.js'),
    { file: '/tmp/song.json', json: JSON.stringify(a) });
  loaderDistRun.buttons[0].onClick();
  assert([...loaderDistRun.files.values()].some(l => l.type === 'textShape'), 'the loader file builds without a panel');
  assert.match(loaderDistRun.labels[0].text, /パネルは未接続/);

  console.log('Cavalry assembly/runtime/JSON/panel/loader contracts passed.');
})().catch(e => { console.error(e); process.exitCode = 1; });
