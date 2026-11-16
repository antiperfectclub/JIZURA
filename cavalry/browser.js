/* Independent browser-plan -> Cavalry assembly. No AE export dependency.
   Geometry comes from the real layout renderers (src/06_layouts.js + packs), captured at the cut's
   resting moment. What the capture cannot express is reported per feature instead of being hidden. */
(() => {
'use strict';
const C = J.Cavalry = {};
const STYLES = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };

/* Host the runtime can build today. Kept small on purpose: every entry here is exercised by a test. */
C.CAPABILITIES = Object.freeze({
  layouts: 'captured',
  nodes: ['text'],
  granularity: ['whole-text', 'per-character'],
  animationBackend: ['individual-layers'],
  enter: ['cut', 'fade'],
  exit: ['cut', 'fade'],
  align: ['left', 'center', 'right'],
  text: ['multiline'],
  shapes: false, decoration: false, treatments: false, backgroundGraphics: false,
  camera: false, transitions: false, effects: false, hud: false, audio: false, timing: 'manual'
});

function familyOf(key) {
  if (!J.FONTS[key]) throw new Error('Unknown font key: ' + key);
  const f = J.faceOf ? J.faceOf(key) : J.FONTS[key];
  return String(f.family).replace(/["']/g, '').split(',')[0].trim();
}
function fontOf(key) {
  if (!J.FONTS[key]) throw new Error('Unknown font key: ' + key);
  const f = J.faceOf ? J.faceOf(key) : J.FONTS[key];
  const weight = f.weight || 400;
  return { key, family: familyOf(key), style: STYLES[weight] || 'Regular' };
}

/* --- capture env: layout renderers only need geometry, so every drawing helper is inert --- */
function stubCtx() {
  const base = { canvas: { width: 1, height: 1 } };
  return new Proxy(base, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === 'getTransform') return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
      if (key === 'measureText') return text => ({ width: Math.max(1, [...String(text)].length) * 0.5 });
      if (key === 'createLinearGradient' || key === 'createPattern') return () => ({ addColorStop() {}, setTransform() {} });
      return () => {};
    },
    set(target, key, value) { target[key] = value; return true; }
  });
}
const noop = () => {};
function makeEnv(plan, cut, sc, lt, onText) {
  const env = {
    ctx: stubCtx(), W: plan.W, H: plan.H, sc, st: plan.style, fx: plan.fx, fps: plan.fps, plan,
    cut, lt, ltb: lt - (cut.inDur || 0), pIn: 1, pOut: 0, pass: 'main', scale: 1,
    step: Math.round(lt * (plan.fps || 30)), beat: 0, energy: 0, t: lt,
    line: noop, rect: noop, circle: noop, arc: noop, rrect: noop, poly: noop, blob: noop, polyPartial: noop
  };
  env.draw = item => { if (item) onText(item, 'supplement'); };
  return env;
}

/* a bbox good enough for layouts that place a second item relative to the first one */
function syntheticBB(it) {
  let w = 0, h = Math.abs(it.size) || 0;
  try { const m = J.measure(it); w = m.w; h = m.h; } catch (e) { w = h * [...String(it.text)].length * 0.6; }
  const x0 = it.align === 'left' ? it.x : it.align === 'right' ? it.x - w : it.x - w / 2;
  return { x0, x1: x0 + w, y0: it.y - h / 2, y1: it.y + h / 2, cx: x0 + w / 2, cy: it.y, boxes: [] };
}

/* run the real layout renderer and keep every text item it asks for */
function captureLayout(plan, cut, sc, lt) {
  const items = [];
  const push = (it, role) => {
    if (typeof it.text !== 'string' || !it.text || !(it.size > 0.5)) return;
    if (![it.x, it.y, it.size].every(Number.isFinite)) return;
    if (J.hideDecoText && J.hideDecoText({ fx: plan.fx, cut }, it.text)) return;
    items.push({
      text: it.text, font: fontOf(it.font), size: it.size, x: it.x, y: it.y,
      sx: Number.isFinite(it.sx) ? it.sx : 1, rotation: it.rot || 0,
      align: it.align === 'left' || it.align === 'right' ? it.align : 'center',
      vertical: !!it.vertical, track: it.track || 0, lead: it.lead || 0,
      color: typeof it.color === 'string' ? it.color : sc.fg,
      delay: (it.mi | 0) * (cut.stagger || 0), role
    });
  };
  const env = makeEnv(plan, cut, sc, lt, push);
  const origMain = J.mainDraw;
  J.mainDraw = (innerEnv, it) => { push(it, 'lyric'); return syntheticBB(it); };
  try {
    J.LAYOUTS[cut.layout].render(env);
  } finally {
    J.mainDraw = origMain;
  }
  return items;
}
const sameGeometry = (a, b) => a.length === b.length && a.every((x, i) => {
  const y = b[i];
  return x.text === y.text && Math.abs(x.x - y.x) < 0.5 && Math.abs(x.y - y.y) < 0.5 &&
    Math.abs(x.size - y.size) < 0.5 && Math.abs((x.rotation || 0) - (y.rotation || 0)) < 0.5;
});
/* a cut that is still moving at two different times is exported as the later still */
const layoutItems = (plan, cut, sc) => {
  const dur = Math.max(0.01, (cut.end || 0) - (cut.start || 0));
  const at = t => Math.min(dur, Math.max(0, t));
  const late = at(dur - Math.min(dur * 0.4, cut.outDur || 0) - 0.001);
  const early = at(late * 0.6);
  const a = captureLayout(plan, cut, sc, late);
  let moving = false;
  try { moving = a.length && !sameGeometry(a, captureLayout(plan, cut, sc, early)); } catch (e) { moving = false; }
  return { items: a, moving, at: late };
};

const CENTER_DEFAULTS = {
  sx: 1, track: 0, lead: 1.2, ox: 0, oy: 0, accent: false, sub: false, under: false
};
function centerFallback(plan, cut, sc, text) {
  const p = Object.assign({}, CENTER_DEFAULTS, { font: (cut.params && cut.params.font) || plan.style.fonts.display[0] }, text ? { text } : {});
  const W = plan.W, H = plan.H, lines = J.splitLines(p.text || cut.text, W < H ? 5 : 11);
  const size = Math.min(J.fitSize(lines, p.font, W * 0.84, H * 0.5, { sx: p.sx, track: p.track, lead: p.lead }), H * 0.33);
  return [{ text: lines, font: fontOf(p.font), size, x: W / 2, y: H / 2, sx: 1, rotation: 0,
    align: 'center', vertical: false, track: 0, lead: 0, color: sc.fg, delay: 0, role: 'lyric' }];
}

C.assemble = function ({ plan, project = {}, range = null, strict = false }) {
  if (!plan) throw new Error('No plan to export.');
  const p = JSON.parse(JSON.stringify(plan, (k, v) => ['energy', 'buffer', 'peaks'].includes(k) ? undefined : v));
  if (p.centerFree) throw new Error('Cavalry: centerFree clipping is not supported yet.');
  const fps = Number(p.fps), t0 = range ? Math.max(0, range.t0) : 0;
  const t1 = range ? Math.min(p.duration, range.t1) : p.duration;
  if (![fps, t0, t1, p.W, p.H].every(Number.isFinite) || fps <= 0 || t1 <= t0 || p.W <= 0 || p.H <= 0 ||
      !p.style?.schemes?.length || !Array.isArray(p.cuts)) {
    throw new Error('Invalid plan dimensions, palette, range or fps.');
  }
  const hostChecks = [], blocking = [];
  const host = message => hostChecks.push(message);
  const warn = message => blocking.push(message);
  const frame = seconds => Math.round(seconds * fps), frameCount = Math.max(1, frame(t1 - t0));
  const out = {
    format: 'jizura.cavalry.assembly', version: 1, title: p.title || project.title || 'JIZURA',
    composition: { width: p.W, height: p.H, fps, frameCount },
    audioOffset: t0, capabilities: C.CAPABILITIES,
    cuts: [], warnings: [], hostChecks: [], blockingWarnings: [], nodeCount: 0
  };

  host('Set Composition Settings manually: ' + fps + ' fps, frame range 0–' + (frameCount - 1) + '.');
  host('Installed font style names must be checked once in Cavalry (fontOverrides in the exported script).');
  host('Y axis, rotation direction and glyph bounds need one asymmetric test scene.');
  host('Audio is not embedded. Import the song and offset it by ' + t0 + ' seconds.');
  if (p.events?.length) warn('Global event FX are not ported.');
  if (p.hud) warn('HUD is not ported.');
  if (p.fx && J.komaOf(p.fx) > 0) warn('Koma/on-twos sampling is not ported.');
  if ((p.fx?.chroma ?? 0.7) > 0 || (p.fx?.texture ?? 0.6) > 0 || (p.fx?.glitch ?? 0.5) > 0) {
    warn('Ghosts, glow, texture, vignette and screen FX are not ported.');
  }

  const oldLang = J.lang;
  try {
    if (J.setLang) J.setLang(p.lang || 'ja');
    for (const [i, cut] of p.cuts.entries()) {
      if (!Number.isFinite(cut.start) || !Number.isFinite(cut.end)) throw new Error('Invalid cut timing: ' + i);
      if (cut.end <= t0 || cut.start >= t1) continue;
      const start = Math.max(0, frame(Math.max(cut.start, t0) - t0));
      const end = Math.min(frameCount, frame(Math.min(cut.end, t1) - t0));
      if (end <= start) continue;
      const sc = p.style.schemes[(cut.scheme || 0) % p.style.schemes.length] || p.style.schemes[0];
      const label = 'cut ' + i + ': ';
      let nodes = [], moving = false, fallback = false;
      if (cut.layout !== 'interlude') {
        const def = J.LAYOUTS[cut.layout];
        if (def && typeof def.render === 'function') {
          try {
            const cap = layoutItems(p, cut, sc);
            nodes = cap.items; moving = cap.moving;
          } catch (e) {
            warn(label + 'layout "' + cut.layout + '" could not be captured (' + e.message + ') → center fallback');
            fallback = true;
          }
        } else {
          warn(label + 'layout "' + cut.layout + '" is not registered → center fallback');
          fallback = true;
        }
        if (!nodes.length && cut.text) {
          if (!fallback) warn(label + 'layout "' + cut.layout + '" produced no text → center fallback');
          nodes = centerFallback(p, cut, sc);
        }
        if (moving) warn(label + 'layout "' + cut.layout + '" keeps moving; exported as a still near its end.');
      }

      const tracks = nodes.filter(n => Math.abs(n.track) > 1e-6).length;
      const leads = nodes.filter(n => n.lead && Math.abs(n.lead - 1.3) > 1e-6).length;
      const verticals = nodes.filter(n => n.vertical).length;
      if (tracks) warn(label + tracks + ' item(s) use letter tracking, not ported.');
      if (leads) warn(label + leads + ' item(s) use custom line leading, not ported.');
      if (verticals) warn(label + verticals + ' item(s) are vertical text, not ported.');
      if (nodes.some(n => n.align !== 'center')) warn(label + 'left/right anchored text uses a measured bbox offset.');

      const enter = ['cut', 'fade'].includes(cut.enter) ? cut.enter : 'fade';
      const exit = ['cut', 'fade'].includes(cut.exit) ? cut.exit : 'fade';
      if (nodes.length && enter !== cut.enter) warn(label + 'enter "' + cut.enter + '" → fade fallback');
      if (nodes.length && exit !== cut.exit) warn(label + 'exit "' + cut.exit + '" → fade fallback');
      if (cut.hold && cut.hold !== 'still') warn(label + 'hold "' + cut.hold + '" is not ported.');
      if (cut.decor?.length) warn(label + 'decoration is not ported.');
      if (cut.treat && cut.treat !== 'none') warn(label + 'treatment "' + cut.treat + '" is not ported.');
      if (cut.bg && cut.bg !== 'none') warn(label + 'background graphic "' + cut.bg + '" is not ported.');
      if (cut.cam) warn(label + 'camera is not ported.');
      if (cut.trans || cut.morph) warn(label + 'transition/morph → hard cut');

      out.cuts.push({
        id: 'cut-' + i, source: { layout: cut.layout, params: cut.params, seed: cut.seed }, start, end,
        origin: frame(cut.start - t0), sourceEnd: frame(cut.end - t0),
        inFrames: Math.max(1, frame(cut.inDur ?? 0.25)), outFrames: Math.max(1, frame(cut.outDur ?? 0.25)),
        enter: cut.inDur === 0 ? 'cut' : enter, exit: cut.outDur === 0 ? 'cut' : exit,
        background: p.keyBg === 'transparent' ? null : p.keyBg === 'green' ? '#00ff00' : p.keyBg === 'black' ? '#000000' : sc.bg,
        nodes: nodes.map((node, n) => ({
          ...node, id: 'cut-' + i + '-text-' + n, kind: 'text',
          granularity: !node.text.includes('\n') && [...node.text].length === 1 ? 'per-character' : 'whole-text',
          animationBackend: 'individual-layers',
          delayFrames: frame(node.delay || 0)
        }))
      });
      out.nodeCount += nodes.length;
    }
  } finally {
    if (J.setLang) J.setLang(oldLang);
  }

  out.hostChecks = [...new Set(hostChecks)];
  out.blockingWarnings = [...new Set(blocking)];
  out.warnings = [...out.hostChecks, ...out.blockingWarnings];
  if (strict && out.blockingWarnings.length) throw new Error(out.blockingWarnings.join('\n'));
  return out;
};

C.download = function (assembly, filename) {
  const payload = JSON.stringify(assembly).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const script = '/* Generated by JIZURA. Run in Cavalry JavaScript Editor. */\n' + C.runtimeSource
    + '\nJZCavalry.run(' + payload + ', { componentPath: null, fontOverrides: {}, timingPaths: null });\n';
  const safe = String(filename || assembly.title).replace(/[\\/:*?"<>|\x00-\x1f]/g, '_') || 'JIZURA';
  return J.saveFile(safe + '.cavalry.js', new Blob([script], { type: 'text/javascript;charset=utf-8' }));
};
})();
