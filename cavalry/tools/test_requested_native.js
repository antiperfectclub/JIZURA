'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = process.cwd();
const base = path.join(root, 'cavalry');

const natives = fs.readdirSync(path.join(base, 'native'))
  .filter(name => name.endsWith('.js') && name !== '30_assembly.js' && name !== 'browser_adapter.js')
  .sort()
  .map(name => path.join(base, 'native', name));

const packs = fs.readdirSync(path.join(base, 'packs'))
  .filter(name => /^p_.*\.js$/.test(name))
  .sort()
  .map(name => path.join(base, 'packs', name));

const sandbox = {
  console,
  cavalry: {
    fontExists() { return true; },
    measureText(text, family, style, size) {
      return { width: Array.from(String(text)).length * size * 0.62,
        height: size, x: 0, y: 0, centreX: 0, centreY: 0 };
    }
  }
};

vm.createContext(sandbox);

for (const file of natives.concat(packs, [path.join(base, 'native', '30_assembly.js')])) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file, timeout: 10000 });
}

const required = {
  layout: ['center', 'vcols', 'dictionary', 'xbTwistFrames'],
  enter: ['xgComet', 'tyKeyFirst'],
  exit: ['xjFocusPull', 'xiPlateCarry', 'knCloseGap'],
  hold: ['tzKernNudge', 'tzCounterRules'],
  bg: ['skyline', 'xpRingDots'],
  treat: ['inline', 'outlineOffset', 'xoDoublePrint'],
  decor: ['xlLadder', 'romajiLine', 'tyGlyphBody'],
  fx: ['shake', 'slice', 'invert', 'flash', 'zoom', 'chroma', 'xrDropBounce'],
  trans: ['xqPolyIris']
};

let checks = 0;
assert.strictEqual(sandbox.JZPresets, sandbox.JZNative,
  'Native and preset interfaces must be the same registry object');
checks++;
required.enter.push('blur', 'zoom', 'wipe');
required.exit.push('blur', 'shrink', 'wipe');

for (const [group, names] of Object.entries(required)) {
  for (const name of names) {
    const definition = sandbox.JZNative.get(group, name);
    assert(definition, `${group}:${name} is missing`);
    assert.strictEqual(typeof definition.build, 'function');
    assert.strictEqual(sandbox.JZPresets.get(group, name), definition,
      'JZPresets must share the JZNative definition');
    checks++;
  }
}

assert.strictEqual(sandbox.JZPresets.resolve('decor', '__missing__').state, 'missing');
checks++;

assert.strictEqual(sandbox.JZPresets.romaji('カタカナ'), 'katakana');
assert.strictEqual(sandbox.JZPresets.romaji('がっこう'), 'gakkou');
assert.strictEqual(sandbox.JZPresets.romaji('夜明け'), null);
checks += 3;

const font = { key: 'test', family: 'Mock Japanese', style: 'Regular' };

function cut(index, start, end) {
  return {
    id: `cut-${index}`, start, end, origin: start, sourceEnd: end, inFrames: 6, outFrames: 6,
    background: null,
    source: { layout: 'graphics', seed: 71, romaji: 'toumei na mama' },
    layoutInstruction: { name: 'graphics', params: {} }, graphics: [],
    nodes: [{
      id: `text-${index}`, kind: 'text', text: '透明なまま', font,
      x: 160, y: 90, size: 24, sx: 1, rotation: 0, delayFrames: 0,
      track: 0.03, lead: 1.3, align: 'center', color: '#ffffff'
    }],
    presets: { enter: { name: 'cut' }, hold: { name: 'still' }, exit: { name: 'cut' }, decor: [] }
  };
}

function assembly() {
  return {
    format: 'jizura.cavalry.assembly', version: 2, title: 'Requested native regression',
    composition: { width: 320, height: 180, fps: 24, frameCount: 96 },
    style: {
      schemes: [{ bg: '#101010', fg: '#ffffff', sub: '#999999', dim: '#666666',
        ink: '#eeeeee', accent: '#ff5577', accent2: '#55ccff', ghostA: '#e4007f', ghostB: '#00a0e9' }],
      fx: { motion: 0.7 }
    },
    cuts: [cut(0, 0, 48), cut(1, 48, 96)],
    events: []
  };
}

/* Compile-only tests. This is a font-metrics mock, not a Cavalry host. */
for (const [group, names] of Object.entries(required)) {
  for (const name of names) {
    const a = assembly();
    const target = a.cuts[1];
    const preset = { name, params: {} };

    if (group === 'layout') {
      target.layoutInstruction = preset;
      target.source.layout = name;
    } else if (group === 'decor') {
      if (name === 'romajiLine') preset.params.text = 'toumei na mama';
      target.presets.decor = [preset];
    } else if (group === 'fx') {
      a.events = [{ t: 0.5, type: name, amp: 0.8, dur: 0.25 }];
    } else {
      target.presets[group] = preset;
    }

    const before = JSON.stringify(a);
    const result = sandbox.JZCavalry.compile(a, {});

    assert.strictEqual(JSON.stringify(a), before, 'compile must not mutate assembly JSON');
    assert(result.graph.layers.length > 0);
    result.graph.validate();
    checks++;

    if (group === 'trans') {
      assert(result.graph.layers.some(n => n.type === 'javaScriptDeformer'),
        'iris must create actual clipping nodes');
      assert(result.graph.edges.length > 0);
      checks++;
    }
  }
}

const fxAssembly = assembly();
fxAssembly.style.ghost = 0.45;
fxAssembly.style.glow = 0.6;
fxAssembly.style.texture = { grain: 0.5, paper: 0.5, scan: 0.5 };
fxAssembly.style.fx = { motion: 0.48, glitch: 0.28, decor: 0.64, texture: 0.79, chroma: 0.28 };
fxAssembly.events = [
  { t: 0.2, type: 'shake', amp: 0.8, dur: 0.3 },
  { t: 0.4, type: 'slice', amp: 0.7, dur: 0.2 },
  { t: 0.6, type: 'flash', amp: 1, dur: 0.2 },
  { t: 0.8, type: 'invert', amp: 1, dur: 0.1 },
  { t: 1.0, type: 'zoom', amp: 0.8, dur: 0.25 },
  { t: 1.2, type: 'chroma', amp: 1, dur: 0.3 },
  { t: 1.5, type: 'xrDropBounce', amp: 1, dur: 0.35 }
];
const fxResult = sandbox.JZCavalry.compile(fxAssembly, {});
fxResult.graph.validate();
const fxNames = fxResult.graph.layers.map(l => l.name);
assert(fxNames.some(n => n.includes('Ghost A')));
assert(fxNames.some(n => n.includes('Ghost B')));
assert(fxNames.some(n => n.includes('Glow halo')));
assert(fxNames.some(n => n === 'Style / Scanlines'));
assert(fxNames.some(n => n === 'Style / Paper fiber'));
assert(fxNames.some(n => n === 'Style / Film grain'));
assert(fxNames.some(n => n.startsWith('FX Rig')));
checks += 8;

const transformGraph = {
  byId: {
    parent: { parent: null, attrs: { position: [12, -8], rotation: 30, scale: [2, 0.7] }, keys: {} },
    child: { parent: 'parent', attrs: { position: [5, 9], rotation: -12, scale: [0.8, 1.4] }, keys: {} }
  }
};

const S = sandbox.JZSceneTools;
const matrix = S.matrix(transformGraph, 'child', 0);
const inverse = S.inverse(matrix);
const input = [31.5, -17.25];
const roundtrip = S.point(inverse, S.point(matrix, input));

assert(Math.abs(roundtrip[0] - input[0]) < 1e-8);
assert(Math.abs(roundtrip[1] - input[1]) < 1e-8);
checks++;

const report = {
  checks,
  syntaxAndRegistration: 'passed',
  requestedRecipeGraphCompilation: 'passed',
  inputMutation: 'none',
  hostVerified: false,
  renderVerified: false,
  fontMetrics: 'mock',
  limitation: 'No actual Cavalry API execution or image comparison'
};

process.stdout.write(JSON.stringify(report, null, 2) + '\n');
