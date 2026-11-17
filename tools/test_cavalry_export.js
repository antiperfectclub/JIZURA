#!/usr/bin/env node
/* Contract tests for the native Cavalry export. The API mock proves the emitted graph, never that Cavalry
   renders it; hostVerified/renderVerified stay false everywhere. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');

/* ---- page globals the exporter and the layout renderers read ---- */
const J = {
  FONTS: { test: { family: '"Test Font"', weight: 500 } },
  lang: 'ja',
  setLang(lang) { this.lang = lang; },
  faceOf() { return { family: '"한국어 Font"', weight: 500 }; },
  fitSize: () => 80,
  komaOf: () => 0,
  measure: it => ({ w: [...String(it.text)].length * 20, h: 40 }),
  layoutText: it => {
    const chars = [...String(it.text).replace(/\n/g, '')];
    return chars.map((ch, i) => ({ ch, i, li: 0, ci: i, n: chars.length,
      x: (i - (chars.length - 1) / 2) * 30, y: 0, w: 30, h: 40, r90: false, vx: 0, vy: 0, fs: 1 }));
  }
};
const ctx = vm.createContext({ J, Blob, console });
ctx.window = { J };
for (const file of ['src/01_util.js', 'src/06_layouts.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx);
}
J.measure = J.measure || (it => ({ w: [...String(it.text)].length * 20, h: 40 }));
J.layoutText = J.layoutText;
J.hideDecoText = () => false;
const bundle = fs.readFileSync(path.join(root, 'src', '11r_cavalry.js'), 'utf8');
vm.runInContext(bundle, ctx);

const read = name => fs.readFileSync(path.join(root, 'cavalry', name), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'dist/cavalry/build-manifest.json'), 'utf8'));
const report = JSON.parse(fs.readFileSync(path.join(root, 'dist/cavalry/build-report.json'), 'utf8'));

/* ---- 1. bundle freshness: the page ships the native engine, not the removed alias runtime ---- */
assert(bundle.includes(read('browser.js')), 'browser bundle must carry cavalry/browser.js');
assert(bundle.includes(read('native/browser_adapter.js')), 'browser bundle must carry the native adapter');
for (const module of manifest.modules) {
  assert(bundle.includes(read(module)), 'browser bundle is stale: missing ' + module);
  assert(J.Cavalry.runtimeSource.includes(read(module)), 'host runtime is stale: missing ' + module);
}
for (const gone of ['var JZPack', '})(JZPack)', 'var JZPresets', 'var JZFamilies', 'JZPresets.resolve']) {
  assert(!J.Cavalry.runtimeSource.includes(gone), 'removed alias runtime still present: ' + gone);
}
for (const name of ['bridge.js', 'panel.js']) assert(J.Cavalry.panelSource.includes(read(name)));
for (const name of ['bridge.js', 'loader.js']) assert(J.Cavalry.loaderSource.includes(read(name)));
assert.equal(J.Cavalry.buildInfo.buildId, manifest.buildId, 'page build id must match the host build');
assert.equal(J.Cavalry.buildInfo.hostVerified, false);
assert.equal(J.Cavalry.buildInfo.renderVerified, false);

/* ---- 2. build report: layout is captured, every other group is a native port ---- */
assert.equal(report.coverage.layout.method, 'capture');
assert.equal(report.coverage.layout.blockingMissing.length, 0, 'layout names are captured, not ported one by one');
for (const [group, row] of Object.entries(report.coverage)) {
  if (group === 'layout') continue;
  assert.equal(row.method, 'native', group + ' must be a native port');
  assert.deepEqual(row.blockingMissing, row.missing, group + ' blocking list must equal the missing names');
}
assert.equal(report.blockingMissing, Object.values(report.coverage).reduce((n, r) => n + r.blockingMissing.length, 0));
assert.equal(report.status, 'preview');
assert.equal(manifest.status, 'preview');
assert(manifest.coverage.cam.registered.includes('panL'));
assert(!manifest.coverage.cam.registered.includes('push'), 'aliases are not registered');
assert(manifest.modules[manifest.modules.length - 1] === 'native/30_assembly.js');
for (const row of Object.values(report.recipes)) for (const def of Object.values(row)) {
  assert.equal(def.hostVerified, false, 'no recipe may claim host verification');
  assert(typeof def.source === 'string' && def.scope);
}

/* ---- 3. the AE catalog, when extracted, is evidence and not a claim of porting ---- */
const catalogPath = path.join(root, 'cavalry', 'catalog', 'ae-presets.json');
if (fs.existsSync(catalogPath)) {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.format, 'jizura.cavalry.ae-source-catalog');
  assert.equal(catalog.version, 1);
  assert.equal(catalog.total, 1717, 'the AE core registers 1,717 names');
  assert.equal(catalog.counts.layout, 366);
  assert.equal(catalog.counts.enter, 251);
  assert.equal(catalog.counts.hold, 102);
  const keys = new Set();
  for (const entry of catalog.entries) {
    assert(entry.sourceFile && entry.sourceFile.startsWith('ae/'), 'every entry needs a real source file');
    assert.equal(entry.implementationStatus, 'not-ported');
    assert(entry.methods && Object.keys(entry.methods).length > 0, 'catalog must carry the recipe body');
    const key = entry.group + ':' + entry.name;
    assert(!keys.has(key), 'duplicate catalog entry ' + key);
    keys.add(key);
  }
  assert.equal(manifest.catalog.total, catalog.total);
  assert.equal(manifest.catalog.groups.layout.count, 366);
  console.log('AE catalog: ' + catalog.total + ' extracted registrations checked.');
} else {
  console.log('AE catalog absent; run node cavalry/tools/extract_ae_catalog.js to audit the source registry.');
}

/* ---- 4. assembly: real layout renderers are executed and their text kept ---- */
const style = {
  fonts: { display: ['test'], body: ['test'], mono: ['test'] },
  schemes: [{ fg: '#ffffff', bg: '#112233', accent: '#ff0000', sub: '#cccccc' }]
};
const unit = { render(env) {
  J.mainDraw(env, { text: env.cut.text, font: 'test', size: 40, x: env.W / 2, y: env.H / 2, color: '#ffffff' });
} };
const geom = { render(env) {
  env.rect(100, 100, 50, 40, '#ffffff', 1);
  env.rect(150, 100, 50, 40, '#ffffff', 1);
  env.line([[0, 0], [100, 100]], '#ff0000', 2, 1);
  env.circle(400, 300, 20, '#00ff00', null, 1, 1);
  env.arc(400, 300, 30, 0, 90, '#0000ff', 1, 1);
  env.rect(0, 0, 10, 10, { gradient: 'x' }, 1);
  J.mainDraw(env, { text: 'A', font: 'test', size: 30, x: 400, y: 300, color: '#ffffff' });
} };
const moving = { render(env) {
  J.mainDraw(env, { text: 'A', font: 'test', size: 40, x: env.W / 2 + env.lt * 50, y: 300, color: '#ffffff' });
} };
const lefty = { render(env) {
  J.mainDraw(env, { text: 'AB', font: 'test', size: 40, x: 100, y: 100, color: '#ffffff', align: 'left' });
} };
J.LAYOUTS.unit = unit;
J.LAYOUTS.geom = geom;
J.LAYOUTS.moving = moving;
J.LAYOUTS.lefty = lefty;

const cut = { index: 0, layout: 'unit', text: '漢가', start: 0, end: 2, seed: 42, inDur: 0.5, outDur: 0.5,
  enter: 'fade', exit: 'fade', hold: 'still', params: { font: 'test' } };
const plan = { W: 800, H: 600, fps: 10, duration: 2, lang: 'ko', title: '</script>가사',
  style, fx: { chroma: 0, texture: 0, glitch: 0 }, cuts: [cut] };
const fresh = patch => ({ ...plan, cuts: [{ ...cut, ...patch }] });

const before = JSON.stringify(plan);
const a = J.Cavalry.assemble({ plan, range: { t0: 0.2, t1: 1.5 } });
assert.equal(JSON.stringify(plan), before, 'the plan must not be mutated');
assert.equal(J.lang, 'ja', 'language state restored');
assert.equal(a.audioOffset, 0.2);
assert.equal(a.version, 3, 'the native adapter stamps schema v3');
assert.equal(a.buildId, manifest.buildId);
assert.equal(a.composition.frameCount, 13);
assert.equal(a.cuts[0].origin, -2);
assert.equal(a.cuts[0].sourceEnd, 18);
assert.equal(a.cuts[0].layoutInstruction.name, 'graphics');
assert.equal(a.cuts[0].nodes[0].font.style, 'Medium');
assert.equal(a.cuts[0].nodes[0].granularity, 'whole-text');
assert.equal(a.cuts[0].nodes[0].glyphs.map(g => g.ch).join(''), '漢가');
assert.equal(a.nodeCount, 1);
assert.equal(a.capabilities.shapes, true);
assert(a.capabilities.presets.cam.includes('panL'));
assert(!a.capabilities.presets.cam.includes('push'), 'exact-only: no family alias is advertised');
assert(a.capabilities.presets.hold.includes('breathe'));
assert.deepEqual(Array.from(a.cuts[0].presets.enter && [a.cuts[0].presets.enter.name]), ['fade']);
assert.equal(a.cuts[0].presets.scheme, 0);
assert.equal(a.cuts[0].presets.seed, 42);
assert.equal(a.keyBg, null);
assert.equal(a.lang, 'ko');
assert.equal(a.blockingWarnings.length, 0, 'basic exact export: ' + a.blockingWarnings.join(' | '));
assert(a.hostChecks.some(w => /Composition Settings/.test(w)));
assert.equal(a.presetReport.built['enter:fade'], 1);
assert.equal(a.presetReport.built['hold:still'], 1);
assert.equal(a.nativeReport.missing.length, 0);
assert.doesNotThrow(() => J.Cavalry.assemble({ plan, strict: true }), 'strict allows host checks');

/* ---- 5. shape capture: geometry, merging, paint drops and the z-order caveat ---- */
const g = J.Cavalry.assemble({ plan: fresh({ layout: 'geom' }) });
const gc = g.cuts[0];
assert.equal(gc.nodes.length, 1, 'text is still captured next to the graphics');
assert.equal(gc.graphics.length, 4, 'two rects merge, line/circle/arc stay separate');
const merged = gc.graphics[0];
assert.equal(merged.parts, 2);
assert.equal(merged.path.length, 10, 'one path carries both rectangles');
assert.equal(merged.path[0][0], 'M');
assert.equal(merged.path[0][1], 100, 'captured coordinates stay in web space');
assert.equal(merged.path[0][2], 100);
assert.equal(merged.fill, '#ffffff');
assert.equal(merged.stroke, null);
assert.equal(gc.graphics[1].stroke, '#ff0000');
assert.equal(gc.graphics[1].width, 2);
assert.equal(gc.graphics[1].path.length, 2, 'a line has two points');
assert.equal(gc.graphics[2].fill, '#00ff00');
assert(gc.graphics[3].path.length > 6, 'arc strokes are polylines');
assert.equal(g.shapeCount, 4);
assert.equal(g.graphicPrimitives, 5, 'merged rects count as two primitives');
assert(g.hostChecks.some(w => /stacked behind all text/.test(w)));
assert(g.hostChecks.some(w => /4°/.test(w)));
assert(g.blockingWarnings.some(w => /use a paint that is not a solid colour/.test(w)));

const separated = J.Cavalry.assemble({ plan: fresh({ layout: 'geom' }), strict: false });
assert(separated.cuts[0].graphics.every(s => Array.isArray(s.path) && s.path.length >= 2));

/* ---- 6. exact-name preflight: a missing recipe stops strict mode, never silently aliases ---- */
const strictMissing = J.Cavalry.assemble({ plan: fresh({ cam: 'push' }) });
assert.equal(strictMissing.presetReport.missing['cam:push'], 1);
assert(strictMissing.blockingWarnings.some(w => /camera "push" is not built/.test(w)));
assert.equal(strictMissing.presetReport.fallback['cam:push'], undefined);
assert.throws(() => J.Cavalry.assemble({ plan: fresh({ cam: 'push' }), strict: true }), /camera "push" is not built/);
assert.equal(J.Cavalry.assemble({ plan: fresh({ cam: 'panL' }) }).presetReport.built['cam:panL'], 1);
assert.equal(J.Cavalry.assemble({ plan: fresh({ hold: 'breathe' }) }).presetReport.built['hold:breathe'], 1);
assert.equal(J.Cavalry.assemble({ plan: fresh({ enter: 'slide' }) }).presetReport.built['enter:slide'], 1);
assert.equal(J.Cavalry.assemble({ plan: fresh({ decor: [{ id: 'cropMarks' }] }) }).presetReport.built['decor:cropMarks'], 1);
const dropped = J.Cavalry.assemble({ plan: fresh({ hold: 'nope', enter: 'alsonope', decor: [{ id: 'crosshair' }], bg: 'grain', treat: 'grain', trans: 'wipe' }) });
for (const key of ['hold', 'enter', 'decor', 'bg', 'treat', 'trans']) {
  assert(Object.keys(dropped.presetReport.missing).some(k => k.startsWith(key + ':')), key + ' miss must be reported');
}
assert(dropped.warnings.length >= dropped.blockingWarnings.length);
assert.equal(dropped.presetReport.built['exit:fade'], 1);

/* ---- 7. capture honesty: fallbacks and moving layouts are named ---- */
J.LAYOUTS.broken = { render() { throw new Error('boom'); } };
const broken = J.Cavalry.assemble({ plan: fresh({ layout: 'broken', params: { fontBig: 'test', ox: 99 } }) });
assert.equal(broken.cuts[0].nodes[0].x, 400, 'fallback must not reinterpret layout params');
assert(broken.blockingWarnings.some(w => w.includes('center fallback')));
assert(broken.blockingWarnings.some(w => w.includes('boom')));
const still = J.Cavalry.assemble({ plan: fresh({ layout: 'moving' }) });
assert(still.blockingWarnings.some(w => /keeps moving/.test(w)));
const left = J.Cavalry.assemble({ plan: fresh({ layout: 'lefty' }) });
assert.equal(left.cuts[0].nodes[0].align, 'left');

assert.throws(() => J.Cavalry.assemble({ plan: { ...plan, centerFree: true } }), /clipping/);
assert.throws(() => J.Cavalry.assemble({ plan, range: { t0: 2, t1: 1 } }), /Invalid/);
assert.throws(() => J.Cavalry.assemble({ plan: { ...plan, fps: Infinity } }), /Invalid/);
for (const [keyBg, color] of [['transparent', null], ['green', '#00ff00'], ['black', '#000000']]) {
  assert.equal(J.Cavalry.assemble({ plan: { ...plan, keyBg } }).cuts[0].background, color);
}

/* ---- 8. mock Cavalry host ---- */
class Path {
  constructor() { this.used = 0; }
  moveTo() { this.used++; } lineTo() { this.used++; } quadTo() { this.used++; } cubicTo() { this.used++; }
  close() {} append() {} empty() { return this.used === 0; }
}
function hostEnv(options = {}) {
  const layers = new Map(), keys = [], connects = [], deletes = [];
  let n = 0, active = null;
  const mk = (type, name) => { const id = type + '#' + n++; layers.set(id, { type, name, attrs: {}, parent: null }); return id; };
  const api = {
    createComp(name) { active = mk('composition', name); return active; },
    getActiveComp() { return active; }, setActiveComp(id) { active = id; },
    getFrame() { return 0; }, setFrame() {},
    create: mk,
    createEditable(p, name) { const id = mk('editableShape', name); layers.get(id).path = p; return id; },
    parent(id, parent) { layers.get(id).parent = parent; },
    set(id, values) { Object.assign(layers.get(id).attrs, values); },
    get(id, attr) {
      const layer = layers.get(id);
      if (attr === 'opacity') {
        if (['textShape', 'editableShape', 'null'].indexOf(layer.type) < 0) {
          throw new Error('opacity read on ' + layer.type);
        }
        return options.opacity == null ? 100 : options.opacity;
      }
      if (attr === 'text') return options.badText ? 'XX' : layer.attrs.text;
      return layer.attrs[attr];
    },
    setInFrame(id, f) { layers.get(id).start = f; }, setOutFrame(id, f) { layers.get(id).end = f; },
    setFill(id, v) { layers.get(id).fill = v; }, setStroke(id, v) { layers.get(id).stroke = v; },
    keyframe(id, frame, data) { keys.push({ id, frame, data }); }, modifyKeyframe() {},
    connect(from, output, to, input) { connects.push([from, output, to, input]); },
    serialise() { return '[]'; }, writeToFile() { return true; }, select() {},
    deleteLayer(id) { deletes.push(id); layers.delete(id); }
  };
  const warnings = [];
  const sandbox = {
    api, cavalry: {
      Path,
      fontExists: () => true,
      measureText: () => ({ width: 20 })
    },
    console: { log() {}, warn: m => warnings.push(String(m)) }
  };
  vm.runInContext(J.Cavalry.runtimeSource, vm.createContext(sandbox));
  return { run: sandbox.JZCavalry.run, preflight: sandbox.JZCavalry.preflight,
    layers, keys, connects, deletes, warnings, api };
}

const host = hostEnv();
const p = host.preflight(a);
assert.equal(p.missing.length, 0, 'preflight agrees with the page: ' + JSON.stringify(p.missing));
assert.equal(p.hostVerified, false);
const pushAssembly = JSON.parse(JSON.stringify(a));
pushAssembly.cuts[0].presets.cam = { name: 'push', params: {} };
const pushReport = host.preflight(pushAssembly);
assert.deepEqual(Array.from(pushReport.missing, r => r.group + ':' + r.name + '@' + r.cut), ['cam:push@cut-0']);

const result = host.run(a);
assert.equal(result.report.built['layout:graphics'], 1);
assert.equal(result.report.built['enter:fade'], 1);
assert.equal(result.report.built['hold:still'], 1);
assert.equal(result.report.missing.length, 0);
assert.equal(result.report.errors.length, 0);
const rootLayer = host.layers.get(result.rootId);
assert.equal(rootLayer.name, 'JIZURA / </script>가사');
assert.equal(rootLayer.end, 12, 'exclusive end -> inclusive clip');
const comp = [...host.layers.values()].find(l => l.type === 'composition');
assert.equal(comp.attrs['resolution.x'], 800);
const text = [...host.layers.values()].filter(l => l.type === 'textShape');
assert.equal(text.length, 2, 'one editable layer per glyph');
assert.deepEqual(text.map(l => l.attrs.text), ['漢', '가']);
assert(text.every(l => l.parent), 'glyph layers are parented to the placement null');
const bg = [...host.layers.values()].find(l => l.name === 'cut-0 / Background');
assert.equal(bg.type, 'editableShape');
assert.equal(bg.path.used, 4, 'background path has four corners');

/* camera rig: rotation -> stretch -> camera, with real per-frame keys */
const withCam = JSON.parse(JSON.stringify(a));
withCam.style.fx.motion = 0.8;
withCam.cuts[0].presets.cam = { name: 'tzItalicSet', params: { dir: 1, a: 6.5 } };
const camRun = hostEnv();
const camResult = camRun.run(withCam);
const byName = name => [...camRun.layers.values()].find(l => l.name === name);
const outer = byName('cut-0 / Camera Rotation'), stretch = byName('cut-0 / Camera Stretch'), rig = byName('cut-0 / Camera');
const idOf = layer => [...camRun.layers.entries()].find(([, l]) => l === layer)[0];
assert(outer && stretch && rig, 'three-node camera rig is created');
assert.equal(stretch.parent, idOf(outer), 'stretch hangs under rotation');
assert.equal(rig.parent, idOf(stretch), 'camera hangs under stretch');
assert(camRun.keys.filter(k => k.id === idOf(outer)).length >= 13 * 3, 'rotation keys are sampled per frame');
const stretchId = idOf(stretch);
const sx = camRun.keys.filter(k => k.id === stretchId && 'scale.x' in k.data);
const sy = camRun.keys.filter(k => k.id === stretchId && 'scale.y' in k.data);
assert(sx.length && sy.length);
for (let i = 0; i < sx.length; i++) {
  assert(Math.abs(sx[i].data['scale.x'] * sy[i].data['scale.y'] - 1) < 1e-6, 'shear SVD keeps determinant 1');
}
assert(sx.some(k => Math.abs(k.data['scale.x'] - 1) > 1e-4), 'tzItalicSet actually shears');
assert.equal(camResult.report.built['cam:tzItalicSet'], 1);

/* ---- 8b. requested packs: run every added recipe once, never only check its name ---- */
const fullBase = J.Cavalry.assemble({ plan });
function nativeAssembly(patch = {}) {
  const out = JSON.parse(JSON.stringify(fullBase));
  out.style.fx.motion = 0.8;
  out.cuts[0].graphics = [];
  out.cuts[0].nodes = [JSON.parse(JSON.stringify(fullBase.cuts[0].nodes[0]))];
  delete out.cuts[0].nodes[0].glyphs;
  out.cuts[0].layoutInstruction = { name: patch.layout || 'center', params: patch.params || {} };
  out.cuts[0].presets.enter = { name: patch.enter || 'fade', params: {} };
  out.cuts[0].presets.exit = { name: patch.exit || 'fade', params: {} };
  out.cuts[0].presets.hold = { name: patch.hold || 'still', params: {} };
  out.cuts[0].presets.bg = patch.bg ? { name: patch.bg, params: patch.params || {} } : null;
  out.cuts[0].presets.treat = patch.treat ? { name: patch.treat, params: patch.params || {} } : null;
  return out;
}
const count = (hostRun, type) => [...hostRun.layers.values()].filter(l => l.type === type).length;
const graphics = hostRun => [...hostRun.layers.values()].filter(l => l.type === 'editableShape' && !/\/ Background$/.test(l.name));
const named = (hostRun, part) => [...hostRun.layers.values()].filter(l => String(l.name).includes(part));

for (const layout of ['center', 'vcols', 'dictionary', 'xbTwistFrames']) {
  const run = hostEnv();
  assert.doesNotThrow(() => run.run(nativeAssembly({ layout, params: { n: 2, cols: 2, tabY: 0.5 } })), layout + ' must build');
  assert(count(run, 'textShape') > 0, layout + ' must keep the exported text');
  if (layout === 'dictionary' || layout === 'xbTwistFrames') assert(graphics(run).length > 0, layout + ' must emit its real graphics');
}
const twisted = hostEnv();
twisted.run(nativeAssembly({ layout: 'xbTwistFrames', params: { n: 2 } }));
assert.equal(named(twisted, 'Twisted frame').length, 3);

const comet = hostEnv();
const cometResult = comet.run(nativeAssembly({ enter: 'xgComet' }));
assert.equal(cometResult.report.built['enter:xgComet'], 1);
assert.equal(count(comet, 'textShape'), 18, 'two glyphs plus eight trails each');
assert(named(comet, 'Comet trail 8').length > 0);

for (const [patch, key] of [[{ enter: 'tyKeyFirst' }, 'enter:tyKeyFirst'], [{ exit: 'knCloseGap' }, 'exit:knCloseGap']]) {
  const run = hostEnv();
  const result = run.run(nativeAssembly(patch));
  assert.equal(result.report.built[key], 1, key + ' must execute');
}

/* clip and blur refuse to guess a host layer type, then build when a verified profile is supplied */
const clipNoProfile = hostEnv();
assert.throws(() => clipNoProfile.run(nativeAssembly({ exit: 'xiPlateCarry' })), /Clip deformer requires hostProfile\.javaScriptDeformer/);
const clipProfile = { javaScriptDeformer: { verified: true, layerType: 'javaScriptDeformer' } };
const clipped = hostEnv();
const clippedResult = clipped.run(nativeAssembly({ exit: 'xiPlateCarry' }), { hostProfile: clipProfile });
assert.equal(clippedResult.report.built['exit:xiPlateCarry'], 1);
const deformer = [...clipped.layers.values()].find(l => l.type === 'javaScriptDeformer');
assert(deformer && deformer.attrs.expression.includes('intersect'), 'clip expression is emitted, not a cover shape');

const blurNoProfile = hostEnv();
assert.throws(() => blurNoProfile.run(nativeAssembly({ exit: 'xjFocusPull' })), /Gaussian blur requires hostProfile\.gaussianBlur/);
const blurProfile = { gaussianBlur: { verified: true, layerType: 'blur', radius: 'radius', input: 'input' } };
const blurred = hostEnv();
const blurredResult = blurred.run(nativeAssembly({ exit: 'xjFocusPull' }), { hostProfile: blurProfile });
assert.equal(blurredResult.report.built['exit:xjFocusPull'], 1);
assert([...blurred.layers.values()].some(l => l.type === 'blur'), 'blur is a real host layer with keys');
assert(blurred.keys.some(k => 'radius' in k.data));
assert(blurred.connects.some(c => c[1] === 'id' && c[3] === 'input'));

const kern = hostEnv();
assert.equal(kern.run(nativeAssembly({ hold: 'tzKernNudge' })).report.built['hold:tzKernNudge'], 1);
assert(graphics(kern).length >= 1, 'kerning tick is a real line');
const rules = hostEnv();
assert.equal(rules.run(nativeAssembly({ hold: 'tzCounterRules' })).report.built['hold:tzCounterRules'], 1);
assert.equal(graphics(rules).length, 2, 'one counter rule per side of the line');

const rings = hostEnv();
assert.equal(rings.run(nativeAssembly({ bg: 'xpRingDots' })).report.built['bg:xpRingDots'], 1);
assert.equal(graphics(rings).length, 7, 'the 4:3 composition fits seven concentric dot rings');
const sky = hostEnv();
assert.equal(sky.run(nativeAssembly({ bg: 'skyline' })).report.built['bg:skyline'], 1);
const skyShapes = [...sky.layers.values()].filter(l => l.type === 'editableShape');
assert(skyShapes.length >= 2, 'two parallax planes with windows');
assert(skyShapes.some(l => l.path && l.path.used > 100), 'buildings are one real multi-rect path');

const inline = hostEnv();
inline.run(nativeAssembly({ treat: 'inline' }));
assert.equal(count(inline, 'textShape'), 6, 'two stroke copies per glyph');
const outline = hostEnv();
outline.run(nativeAssembly({ treat: 'outlineOffset' }));
assert.equal(count(outline, 'textShape'), 4, 'one offset fill per glyph');
assert.equal([...outline.layers.values()].filter(l => l.type === 'textShape' && l.fill === false).length, 2, 'source glyphs become outlines');
const doublePrint = hostEnv();
doublePrint.run(nativeAssembly({ treat: 'xoDoublePrint' }));
assert.equal(count(doublePrint, 'textShape'), 4, 'one second impression per glyph');


/* rollback: a corrupt Unicode read-back must remove everything this build created */
const failing = hostEnv({ badText: true });
const beforeFail = failing.layers.size;
assert.throws(() => failing.run(a), /Unicode readback mismatch/);
assert(failing.deletes.length > 0, 'created layers are deleted on failure');
assert.equal(failing.layers.size, beforeFail, 'rollback returns the scene to its previous state');
const invisible = hostEnv({ opacity: 0 });
assert.throws(() => invisible.run(a), /Invalid native opacity range/);

/* empty / unpainted geometry is an error, never an empty layer */
const badPath = JSON.parse(JSON.stringify(a));
badPath.cuts[0].nodes = [];
badPath.cuts[0].graphics = [{ name: 'bad', path: [['M', 0, 0]], fill: '#ffffff', alpha: 1 }];
assert.throws(() => hostEnv().run(badPath), /Missing geometry|Empty\/invalid path/);
const badPaint = JSON.parse(JSON.stringify(a));
badPaint.cuts[0].nodes = [];
badPaint.cuts[0].graphics = [{ name: 'bad', path: [['M', 0, 0], ['L', 10, 10]], fill: null, stroke: null, alpha: 1 }];
assert.throws(() => hostEnv().run(badPaint), /no paint/);

/* the adapter's host report may not invent a miss the page did not predict, nor print it twice */
const adapterMiss = J.Cavalry.assemble({ plan: fresh({ cam: 'push' }) });
const missLines = adapterMiss.blockingWarnings.filter(w => /camera "push"/.test(w));
assert.equal(missLines.length, 1, 'one line per miss, predicted by the page');
assert.equal(adapterMiss.blockingWarnings.filter(w => /cam:push/.test(w)).length, 0, 'no duplicate host line');
const holdMiss = J.Cavalry.assemble({ plan: fresh({ hold: 'nope' }) });
assert.equal(holdMiss.blockingWarnings.filter(w => /hold "nope"/.test(w)).length, 1);
assert.equal(holdMiss.blockingWarnings.filter(w => /hold:nope/.test(w)).length, 0, 'no duplicate host line');

/* ---- 9. bridge: optional, feature-detected, never required ---- */
const bridgeSrc = read('bridge.js');
const bridgeHost = api2 => {
  const c = vm.createContext({ api: api2, console: { log() {}, warn() {}, error() {} } });
  vm.runInContext(bridgeSrc, c);
  return c.JZBridge;
};
const plain = bridgeHost({});
assert.equal(plain.server(), false);
assert.equal(plain.start(() => { throw new Error('must not run'); }), false);
assert.equal(plain.handoff('/tmp/x.json'), false);

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
assert.equal(delivered.length, 1);
assert.equal(delivered[0].format, 'jizura.cavalry.assembly');
assert.equal(serverBridge.start(() => {}), true);
assert.equal(serverCalls.filter(c => c[0] === 'listen').length, 1);

const throwing = bridgeHost({ WebServer: class { constructor() { throw new Error('no port'); } } });
assert.equal(throwing.start(() => {}), false);

let clientStatus = 200, clientBody = 'JIZURA_CV/1';
const clientCalls = [];
class MockClient {
  constructor(base) { clientCalls.push(['new', base]); }
  get(p) { clientCalls.push(['get', p]); }
  status() { return clientStatus; }
  body() { return clientBody; }
  post(p, body, type) { clientCalls.push(['post', p, body, type]); }
}
const clientBridge = bridgeHost({ WebClient: MockClient });
assert.equal(clientBridge.handoff('/tmp/song.json'), true);
assert.deepEqual(clientCalls[0], ['new', 'http://localhost:41234']);
assert.deepEqual(clientCalls[1], ['get', '/get']);
assert.deepEqual(JSON.parse(clientCalls[2][2]), { type: 'path', path: '/tmp/song.json' });
clientCalls.length = 0; clientStatus = 404;
assert.equal(clientBridge.handoff('/tmp/song.json'), false);
clientCalls.length = 0; clientStatus = 200; clientBody = 'something else';
assert.equal(clientBridge.handoff('/tmp/song.json'), false);
assert(!clientCalls.some(c => c[0] === 'post'));
new vm.Script(J.Cavalry.panelSource);
new vm.Script(J.Cavalry.loaderSource);

/* ---- 10. panel and loader UIs (Cavalry is closed, so the widgets are mocked) ---- */
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
      get() {}
      status() { return opts.webClient.status; }
      body() { return opts.webClient.body; }
      post(p, body) { opts.webClient.posted = body; }
    };
  }
  const JZCavalry = { run: () => { calls.run += 1;
    return { layerIds: ['a', 'b'], report: { built: { 'enter:fade': 1 }, fallback: {}, missing: { 'cam:push': 1 }, errors: [] } }; } };
  const c = vm.createContext({ ui, api: api2, JZCavalry, console: { log() {}, warn() {}, error() {} } });
  vm.runInContext(source, c);
  return { labels, buttons, calls };
}
const assemblyJson = JSON.stringify({ format: 'jizura.cavalry.assembly', version: 3, nodeCount: 4 });
const panelRun = uiHarness(J.Cavalry.panelSource, { file: '/tmp/a.json', json: assemblyJson });
assert.equal(panelRun.buttons.length, 1);
panelRun.buttons[0].onClick();
assert.equal(panelRun.calls.run, 1);
assert.match(panelRun.labels[0].text, /完了/);
assert.match(panelRun.labels[0].text, /正確 1/);
assert.match(panelRun.labels[0].text, /未対応 1/);

const loaderLocal = uiHarness(J.Cavalry.loaderSource, { file: '/tmp/a.json', json: assemblyJson });
loaderLocal.buttons[0].onClick();
assert.equal(loaderLocal.calls.run, 1);
assert.match(loaderLocal.labels[0].text, /パネルは未接続/);

const client = { status: 200, body: 'JIZURA_CV/1', posted: null };
const loaderBridge = uiHarness(J.Cavalry.loaderSource, { file: '/tmp/a.json', json: assemblyJson, webClient: client });
loaderBridge.buttons[0].onClick();
assert.equal(JSON.parse(client.posted).path, '/tmp/a.json');
assert.equal(loaderBridge.calls.run, 0);
assert.match(loaderBridge.labels[0].text, /送信/);

const loaderBad = uiHarness(J.Cavalry.loaderSource, { file: '/tmp/a.json', json: '{"format":"other"}' });
loaderBad.buttons[0].onClick();
assert.equal(loaderBad.calls.run, 0);
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
  assert(saved.script.includes('JZCavalry.run('));

  assert.equal(await J.Cavalry.downloadJson(a, 'song/01'), 'saved');
  assert.equal(saved.name, 'song_01.jizura.cavalry.json');
  const parsed = JSON.parse(saved.script);
  assert.equal(parsed.version, 3);
  assert.equal(parsed.format, 'jizura.cavalry.assembly');
  assert.equal(parsed.cuts.length, a.cuts.length);

  assert.equal(await J.Cavalry.downloadPanel(), 'saved');
  assert.equal(saved.name, 'JIZURA_CV.js');
  assert(saved.script.includes('JZCavalry'));
  assert(saved.script.includes('ui.setTitle'));
  new vm.Script(saved.script);
  const dist = path.join(root, 'dist', 'cavalry', 'JIZURA_CV.js');
  assert(fs.existsSync(dist), 'build_cavalry.py must emit the panel install file');
  const distSource = fs.readFileSync(dist, 'utf8');
  assert(distSource.includes(read('panel.js').trim()), 'dist panel is current');
  assert(distSource.includes('var JZCavalryBuild='));

  assert.equal(await J.Cavalry.downloadLoader(), 'saved');
  assert.equal(saved.name, 'JIZURA_CV_Loader.js');
  assert(saved.script.includes('JZBridge.handoff'));
  new vm.Script(saved.script);
  const loaderDist = path.join(root, 'dist', 'cavalry', 'JIZURA_CV_Loader.js');
  assert(fs.existsSync(loaderDist), 'build_cavalry.py must emit the loader');
  assert(fs.readFileSync(loaderDist, 'utf8').includes(read('loader.js').trim()));

  /* ---- the shipped file, not a bundle of its parts ---- */
  function runDist(distPath, options) {
    const files = new Map(), labels = [], buttons = [];
    let n = 0, active = null;
    const mk = (type, name) => { const id = type + '#' + n++; files.set(id, { type, name, attrs: {} }); return id; };
    const hostApi = {
      create: mk,
      createComp(name) { active = mk('composition', name); return active; },
      getActiveComp: () => active, setActiveComp(id) { active = id; }, getFrame: () => 0, setFrame() {},
      set(id, values) { Object.assign(files.get(id).attrs, values); }, parent() {},
      setInFrame() {}, setOutFrame() {}, setFill() {}, setStroke() {}, select() {}, deleteLayer() {},
      createEditable: (_, name) => mk('editableShape', name),
      get(id, attr) { const l = files.get(id); return attr === 'opacity' ? 100 : attr === 'text' ? l.attrs.text : l.attrs[attr]; },
      keyframe() {}, modifyKeyframe() {}, connect() {}, serialise() { return '[]'; }, writeToFile() { return true; },
      presentOpenFile: () => options.file, readFromFile: () => options.json,
      getFolderFromPath: () => '', getSceneFilePath: () => ''
    };
    if (options.webClient) {
      hostApi.WebClient = class {
        get() {} status() { return options.webClient.status; } body() { return options.webClient.body; }
        post(p, body) { options.webClient.posted = body; }
      };
    }
    const ui = {
      setTitle() {}, add() {}, addStretch() {}, show() {},
      Label: class { constructor(text) { this.text = text; labels.push(this); } setText(text) { this.text = text; } },
      Button: class { constructor(text) { this.text = text; buttons.push(this); } }
    };
    const sandbox = { api: hostApi, ui,
      cavalry: { Path, fontExists: () => true, measureText: () => ({ width: 20 }) },
      console: { log() {}, warn() {}, error() {} } };
    vm.runInContext(fs.readFileSync(distPath, 'utf8'), vm.createContext(sandbox));
    return { files, labels, buttons };
  }

  const panelDist = runDist(path.join(root, 'dist', 'cavalry', 'JIZURA_CV.js'),
    { file: '/tmp/song.json', json: JSON.stringify(a) });
  assert.equal(panelDist.buttons.length, 1);
  panelDist.buttons[0].onClick();
  assert([...panelDist.files.values()].some(l => l.type === 'textShape'), 'the panel file builds text layers from the JSON');
  assert([...panelDist.files.values()].some(l => l.type === 'editableShape'), 'the panel file builds the background path');
  assert([...panelDist.files.values()].some(l => l.type === 'composition'));
  assert.match(panelDist.labels[0].text, /完了/);
  assert.match(panelDist.labels[0].text, /正確 [1-9]/);

  const loaderDistRun = runDist(path.join(root, 'dist', 'cavalry', 'JIZURA_CV_Loader.js'),
    { file: '/tmp/song.json', json: JSON.stringify(a) });
  loaderDistRun.buttons[0].onClick();
  assert([...loaderDistRun.files.values()].some(l => l.type === 'textShape'), 'loader dist: ' + loaderDistRun.labels[0].text);
  assert.match(loaderDistRun.labels[0].text, /パネルは未接続/);

  console.log('Cavalry native graph / capture / catalog / panel / loader contracts passed.');
})().catch(e => { console.error(e); process.exitCode = 1; });
