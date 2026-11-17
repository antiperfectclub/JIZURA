/* Independent browser-plan -> Cavalry assembly. No AE export dependency.
   Geometry comes from the real layout renderers (src/06_layouts.js + packs), captured at the cut's
   resting moment. What the capture cannot express is reported per feature instead of being hidden. */
(() => {
'use strict';
const C = J.Cavalry = {};
const STYLES = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };

/* Assembly schema. v2 carries the design presets (names + planner params) next to the geometry, so the
   runtime can grow into them without changing the JSON again. */
C.SCHEMA = 2;

/* The preset vocabulary is the native manifest injected by build_cavalry.py, so the warnings here predict
   exactly what Cavalry will build: exact names only, no family substitution. */
const FAM = typeof JZFamilies !== 'undefined' ? JZFamilies : null;
if (!FAM) throw new Error('Cavalry preset vocabulary is missing; rebuild with build_cavalry.py.');
const PRESETS = kind => FAM.built(kind);

/* Host the runtime can build today. Kept small on purpose: every entry here is exercised by a test. */
C.CAPABILITIES = Object.freeze({
  layouts: 'captured',
  nodes: ['text'],
  granularity: ['whole-text', 'per-character'],
  animationBackend: ['individual-layers'],
  enter: PRESETS('enter'),
  exit: PRESETS('exit'),
  align: ['left', 'center', 'right'],
  text: ['multiline'],
  /* preset names are always exported; only exact native names are built */
  presets: Object.freeze({ enter: PRESETS('enter'), exit: PRESETS('exit'), hold: PRESETS('hold'), bg: PRESETS('bg'),
    cam: PRESETS('cam'), trans: [], treat: PRESETS('treat'), decor: PRESETS('decor') }),
  shapes: true, decoration: PRESETS('decor').length > 0, treatments: PRESETS('treat').length > 0,
  backgroundGraphics: PRESETS('bg').length > 0, camera: PRESETS('cam').length > 0,
  transitions: false, effects: false, hud: false, audio: false, timing: 'manual'
});
C.families = FAM;

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

/* --- capture env: the layout renderers are run for real, but every paint call is recorded as path
   commands instead of being drawn. Coordinates stay in web space (x right, y down); the host flips them. --- */
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
const KAPPA = 0.5522847498307936;
const isNum = v => typeof v === 'number' && isFinite(v);
const pathPoints = pts => Array.isArray(pts) && pts.length >= 2 && pts.every(p => Array.isArray(p) && isNum(p[0]) && isNum(p[1]));

/* Each primitive mirrors the signature and the early-outs of src/09_render.js, so the captured geometry is
   the geometry the browser would have drawn at that instant. */
function rectPath(x, y, w, h) {
  return [['M', x, y], ['L', x + w, y], ['L', x + w, y + h], ['L', x, y + h], ['Z']];
}
function circlePath(cx, cy, r) {
  const k = KAPPA * r;
  return [['M', cx + r, cy],
    ['C', cx + r, cy + k, cx + k, cy + r, cx, cy + r],
    ['C', cx - k, cy + r, cx - r, cy + k, cx - r, cy],
    ['C', cx - r, cy - k, cx - k, cy - r, cx, cy - r],
    ['C', cx + k, cy - r, cx + r, cy - k, cx + r, cy], ['Z']];
}
function arcPath(cx, cy, r, a0, a1) {
  const steps = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 4)), out = [];
  for (let i = 0; i <= steps; i++) {
    const a = (a0 + (a1 - a0) * (i / steps)) * J.DEG;
    out.push([i ? 'L' : 'M', cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}
function rrectPath(x, y, w, h, r) {
  r = Math.min(Math.max(0, r), w / 2, h / 2);
  if (!(r > 0)) return rectPath(x, y, w, h);
  const k = KAPPA * r;
  return [['M', x + r, y], ['L', x + w - r, y],
    ['C', x + w - r + k, y, x + w, y + r - k, x + w, y + r], ['L', x + w, y + h - r],
    ['C', x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h], ['L', x + r, y + h],
    ['C', x + r - k, y + h, x, y + h - r + k, x, y + h - r], ['L', x, y + r],
    ['C', x, y + r - k, x + r - k, y, x + r, y], ['Z']];
}
function polyPath(pts) {
  return pts.map((p, i) => [i ? 'L' : 'M', p[0], p[1]]).concat([['Z']]);
}
function linePath(pts) { return pts.map((p, i) => [i ? 'L' : 'M', p[0], p[1]]); }
function blobPath(pts) {
  const n = pts.length, mid = i => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  const m0 = mid(0), out = [['M', m0[0], m0[1]]];
  for (let i = 1; i <= n; i++) { const p = pts[i % n], m = mid(i); out.push(['Q', p[0], p[1], m[0], m[1]]); }
  out.push(['Z']);
  return out;
}

function makeEnv(plan, cut, sc, lt, onText, shapes, gauge) {
  const env = {
    ctx: stubCtx(), W: plan.W, H: plan.H, sc, st: plan.style, fx: plan.fx, fps: plan.fps, plan,
    cut, lt, ltb: lt - (cut.inDur || 0), pIn: 1, pOut: 0, pass: 'main', scale: 1,
    step: Math.round(lt * (plan.fps || 30)), beat: 0, energy: 0, t: lt
  };
  const push = (commands, paint) => {
    if (!commands || commands.length < 2) return;
    const fill = typeof paint.fill === 'string' ? paint.fill : null;
    const stroke = typeof paint.stroke === 'string' ? paint.stroke : null;
    if (!fill && !stroke) { gauge.unsupported += 1; return; }
    const width = isNum(paint.width) && paint.width > 0 ? paint.width : 1;
    const alpha = isNum(paint.alpha) ? J.clamp(paint.alpha) : 1;
    if (!(alpha > 0)) return;
    /* adjacent primitives with the same paint become one editable path: a hatch is one layer, not 800 */
    const last = shapes[shapes.length - 1];
    if (last && last.fill === fill && last.stroke === stroke && last.width === (stroke ? width : null) && Math.abs(last.alpha - alpha) < 1e-9) {
      last.path.push(...commands); last.parts += 1; return;
    }
    shapes.push({ path: commands, fill, stroke, width: stroke ? width : null, alpha, parts: 1 });
  };
  env.rect = (x, y, w, h, c, a = 1, g = true) => {
    if (typeof c !== 'string' || !isNum(x) || !isNum(y) || !isNum(w) || !isNum(h) || !(w > 0) || !(h > 0)) { gauge.unsupported += 1; return; }
    if (a <= 0) return;
    push(rectPath(x, y, w, h), { fill: c, alpha: a });
  };
  env.line = (pts, c, lw = 1, a = 1, g = true) => {
    if (!(a > 0) || !pathPoints(pts)) return;
    if (typeof c !== 'string') { gauge.unsupported += 1; return; }
    push(linePath(pts), { stroke: c, width: lw, alpha: a });
  };
  env.polyPartial = (pts, e, c, lw = 1, a = 1, g = true) => {
    if (!(e > 0) || !pathPoints(pts)) return;
    let total = 0; const seg = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
    let rem = total * J.clamp(e); const out = [pts[0]];
    for (let i = 1; i < pts.length && rem > 0; i++) {
      const d = seg[i - 1];
      if (rem >= d) { out.push(pts[i]); rem -= d; }
      else { const k = rem / d; out.push([J.lerp(pts[i - 1][0], pts[i][0], k), J.lerp(pts[i - 1][1], pts[i][1], k)]); rem = 0; }
    }
    env.line(out, c, lw, a, g);
  };
  env.circle = (cx, cy, r, fill, stroke, lw = 1, a = 1, g = true) => {
    if (!(r > 0) || !(a > 0) || !isNum(cx) || !isNum(cy)) return;
    if ((fill && typeof fill !== 'string') || (stroke && typeof stroke !== 'string')) { gauge.unsupported += 1; return; }
    if (!fill && !stroke) return;
    push(circlePath(cx, cy, r), { fill, stroke, width: lw, alpha: a });
  };
  env.arc = (cx, cy, r, a0, a1, c, lw = 1, a = 1, g = true) => {
    if (!(a > 0) || !(r > 0) || !isNum(cx) || !isNum(cy) || !isNum(a0) || !isNum(a1)) return;
    if (typeof c !== 'string') { gauge.unsupported += 1; return; }
    gauge.facets.push('arc');
    push(arcPath(cx, cy, r, a0, a1), { stroke: c, width: lw, alpha: a });
  };
  env.rrect = (x, y, w, h, r, fill, a = 1, g = true, stroke, lw = 1) => {
    if (!(a > 0) || !(w > 0) || !(h > 0) || !isNum(x) || !isNum(y) || !isNum(r)) return;
    if ((fill && typeof fill !== 'string') || (stroke && typeof stroke !== 'string')) { gauge.unsupported += 1; return; }
    if (!fill && !stroke) return;
    push(rrectPath(x, y, w, h, r), { fill, stroke, width: lw, alpha: a });
  };
  env.poly = (pts, c, a = 1, g = true) => {
    if (!(a > 0) || !pathPoints(pts)) return;
    if (typeof c !== 'string') { gauge.unsupported += 1; return; }
    push(polyPath(pts), { fill: c, alpha: a });
  };
  env.blob = (pts, c, a = 1, g = true) => {
    if (!(a > 0) || !pathPoints(pts)) return;
    if (typeof c !== 'string') { gauge.unsupported += 1; return; }
    push(blobPath(pts), { fill: c, alpha: a });
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

/* run the real layout renderer and keep every text item and every graphic it asks for */
function captureLayout(plan, cut, sc, lt) {
  const items = [], shapes = [], gauge = { unsupported: 0, facets: [] };
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
  const env = makeEnv(plan, cut, sc, lt, push, shapes, gauge);
  const origMain = J.mainDraw;
  J.mainDraw = (innerEnv, it) => { push(it, 'lyric'); return syntheticBB(it); };
  try {
    J.LAYOUTS[cut.layout].render(env);
  } finally {
    J.mainDraw = origMain;
  }
  return { items, shapes, gauge };
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
  try {
    const b = captureLayout(plan, cut, sc, early);
    moving = (a.items.length > 0 && !sameGeometry(a.items, b.items)) ||
      JSON.stringify(a.shapes) !== JSON.stringify(b.shapes);
  } catch (e) { moving = false; }
  return { items: a.items, shapes: a.shapes, gauge: a.gauge, moving, at: late };
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
  /* preset names are classified once per name, then written as one line with the number of cuts that use it */
  const KIND_LABEL = { enter: 'enter', exit: 'exit', hold: 'hold', bg: 'background graphic', cam: 'camera',
    treat: 'treatment', decor: 'decoration', trans: 'transition' };
  const presetRows = new Map();
  const hit = (kind, name) => {
    if (!name) return;
    const r = FAM ? FAM.resolve(kind, name) : { state: 'missing', as: null };
    const key = kind + ':' + name;
    const row = presetRows.get(key);
    if (row) { row.cuts += 1; return; }
    presetRows.set(key, { kind, name, state: r.state, as: r.as, cuts: 1 });
  };
  const frame = seconds => Math.round(seconds * fps), frameCount = Math.max(1, frame(t1 - t0));
  const out = {
    format: 'jizura.cavalry.assembly', version: C.SCHEMA, title: p.title || project.title || 'JIZURA',
    composition: { width: p.W, height: p.H, fps, frameCount },
    audioOffset: t0, lang: p.lang || 'ja', keyBg: p.keyBg || null,
    /* the design language stays in the file even where the runtime cannot build it yet */
    style: {
      schemes: (p.style.schemes || []).map(s => Object.assign({}, s)),
      glow: p.style.glow ?? 0, ghost: p.style.ghost ?? 0,
      texture: p.style.texture || {},
      fonts: p.style.fonts ? JSON.parse(JSON.stringify(p.style.fonts)) : null,
      fx: { motion: p.fx?.motion ?? 0, glitch: p.fx?.glitch ?? 0, decor: p.fx?.decor ?? 0,
        texture: p.fx?.texture ?? 0, chroma: p.fx?.chroma ?? 0 }
    },
    capabilities: C.CAPABILITIES,
    cuts: [], warnings: [], hostChecks: [], blockingWarnings: [], nodeCount: 0, shapeCount: 0, graphicPrimitives: 0
  };

  host('Set Composition Settings manually: ' + fps + ' fps, frame range 0–' + (frameCount - 1) + '.');
  host('Installed font style names must be checked once in Cavalry (fontOverrides in the exported script).');
  host('Y axis, rotation direction and glyph bounds need one asymmetric test scene.');
  host('Audio is not embedded. Import the song and offset it by ' + t0 + ' seconds.');
  if (p.events?.length) warn('Global event FX are not ported.');
  if (p.hud) warn('HUD is not ported.');
  if (p.fx && J.komaOf(p.fx) > 0) host('On-twos (koma) sampling is not reproduced; fades are frame-accurate.');
  if ((p.fx?.chroma ?? 0.7) > 0 || (p.fx?.texture ?? 0.6) > 0 || (p.fx?.glitch ?? 0.5) > 0) {
    warn('Ghosts, glow, texture, vignette and screen FX are not ported.');
  }

  const oldLang = J.lang;
  let verticalItems = 0;
  try {
    if (J.setLang) J.setLang(p.lang || 'ja');
    for (const [i, cut] of p.cuts.entries()) {
      if (!Number.isFinite(cut.start) || !Number.isFinite(cut.end)) throw new Error('Invalid cut timing: ' + i);
      if (cut.end <= t0 || cut.start >= t1) continue;
      const start = Math.max(0, frame(Math.max(cut.start, t0) - t0));
      const end = Math.min(frameCount, frame(Math.min(cut.end, t1) - t0));
      if (end <= start) continue;
      const schemeIndex = (cut.scheme || 0) % p.style.schemes.length;
      const sc = p.style.schemes[schemeIndex] || p.style.schemes[0];
      const label = 'cut ' + i + ': ';
      let nodes = [], graphics = [], dropped = 0, moving = false, fallback = false;
      if (cut.layout !== 'interlude' && cut.layout !== 'none') {
        const def = J.LAYOUTS[cut.layout];
        if (def && typeof def.render === 'function') {
          try {
            const cap = layoutItems(p, cut, sc);
            nodes = cap.items; graphics = cap.shapes; dropped = cap.gauge.unsupported; moving = cap.moving;
            if (cap.gauge.facets.includes('arc')) host(label + 'arc strokes are exported as 4° polylines.');
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
      if (fallback) graphics = [];
      if (dropped) warn(label + dropped + ' graphic(s) use a paint that is not a solid colour → dropped');
      if (graphics.length) host(label + graphics.length + ' graphic(s) are stacked behind all text; the web renderer interleaves them.');

      const tracks = nodes.filter(n => Math.abs(n.track) > 1e-6).length;
      const leads = nodes.filter(n => n.lead && Math.abs(n.lead - 1.3) > 1e-6).length;
      const verticals = nodes.filter(n => n.vertical).length;
      if (tracks) host(label + tracks + ' item(s) use letter tracking; Cavalry spacing depends on the installed font.');
      if (leads) host(label + leads + ' item(s) use custom line leading; Cavalry spacing depends on the installed font.');
      if (verticals) { verticalItems += verticals; }
      if (nodes.some(n => n.align !== 'center')) host(label + 'left/right anchored text uses a measured bbox offset.');

      const enter = ['cut', 'fade'].includes(cut.enter) ? cut.enter : 'fade';
      const exit = ['cut', 'fade'].includes(cut.exit) ? cut.exit : 'fade';
      /* the runtime resolves the *requested* names (cut.presets below), so the report predicts those.
         Every kind, hold included, goes through the same exact/missing classification. */
      if (nodes.length) {
        hit('enter', cut.enter || 'fade'); hit('exit', cut.exit || 'fade'); hit('hold', cut.hold || 'still');
      }
      /* These ports are exact, but their host layer type is not verified yet. Say so at export time,
         not only when the build stops. */
      if (cut.exit === 'xiPlateCarry') host(label + 'exit "xiPlateCarry" needs hostProfile.javaScriptDeformer {verified:true}; the build stops without it.');
      if (cut.exit === 'xjFocusPull') host(label + 'exit "xjFocusPull" needs hostProfile.gaussianBlur {verified:true}; the build stops without it.');
      (cut.decor || []).forEach(d => hit('decor', typeof d === 'string' ? d : d && (d.id || d.name)));
      if (cut.treat && cut.treat !== 'none') hit('treat', cut.treat);
      if (cut.bg && cut.bg !== 'none') hit('bg', cut.bg);
      if (cut.cam && cut.cam !== 'none') hit('cam', cut.cam);
      if (cut.trans) hit('trans', cut.trans);
      if (cut.morph) warn(label + 'morph → hard cut');

      out.cuts.push({
        id: 'cut-' + i, source: { layout: cut.layout, params: cut.params, seed: cut.seed }, start, end,
        origin: frame(cut.start - t0), sourceEnd: frame(cut.end - t0),
        inFrames: Math.max(1, frame(cut.inDur ?? 0.25)), outFrames: Math.max(1, frame(cut.outDur ?? 0.25)),
        enter: cut.inDur === 0 ? 'cut' : enter, exit: cut.outDur === 0 ? 'cut' : exit,
        /* the names the planner asked for; `enter`/`exit` above are what this runtime can actually build */
        presets: {
          enter: { name: cut.enter || 'fade', inDur: cut.inDur ?? 0.25 },
          exit: { name: cut.exit || 'fade', outDur: cut.outDur ?? 0.25 },
          bg: cut.bg && cut.bg !== 'none' ? { name: cut.bg, params: cut.bgP || {} } : null,
          cam: cut.cam && cut.cam !== 'none' ? { name: cut.cam, params: cut.camP || {} } : null,
          trans: cut.trans ? { name: cut.trans, params: cut.transP || {}, frames: Math.max(0, frame(cut.transDur || 0)) } : null,
          treat: cut.treat && cut.treat !== 'none' ? { name: cut.treat, params: cut.treatP || {} } : null,
          decor: (Array.isArray(cut.decor) ? cut.decor : []).map(d => {
            const item = typeof d === 'string' ? { id: d } : (d || {});
            const params = {}; Object.keys(item).forEach(k => { if (k !== 'id') params[k] = item[k]; });
            return { name: item.id || item.name || 'unknown', params };
          }),
          hold: cut.hold || 'still', scheme: schemeIndex, seed: cut.seed ?? null, morph: !!cut.morph
        },
        background: p.keyBg === 'transparent' ? null : p.keyBg === 'green' ? '#00ff00' : p.keyBg === 'black' ? '#000000' : sc.bg,
        graphics: graphics.map((s, gi) => ({
          name: 'cut-' + i + '-graphic-' + gi, source: 'layout', path: s.path,
          fill: s.fill, stroke: s.stroke, width: s.width, alpha: s.alpha, parts: s.parts
        })),
        nodes: nodes.map((node, n) => ({
          ...node, id: 'cut-' + i + '-text-' + n, kind: 'text',
          granularity: !node.text.includes('\n') && [...node.text].length === 1 ? 'per-character' : 'whole-text',
          animationBackend: 'individual-layers',
          delayFrames: frame(node.delay || 0)
        }))
      });
      out.nodeCount += nodes.length;
      out.shapeCount += graphics.length;
      out.graphicPrimitives = (out.graphicPrimitives || 0) + graphics.reduce((n, s) => n + (s.parts || 1), 0);
    }
  } finally {
    if (J.setLang) J.setLang(oldLang);
  }

  /* one line per preset name: exact builds are silent, approximations carry ≈, drops stop strict mode */
  const approx = [], missing = [];
  const presetReport = { built: {}, fallback: {}, missing: {} };
  if (verticalItems) host(verticalItems + ' item(s) are vertical text: built per glyph. Glyph rotation and punctuation offsets need one visual check.');
  [...presetRows.values()]
    .sort((a, b) => (a.kind + ':' + a.name).localeCompare(b.kind + ':' + b.name))
    .forEach(row => {
      const key = row.kind + ':' + row.name, many = row.cuts > 1 ? ' (' + row.cuts + ' cuts)' : '';
      if (row.state === 'exact') { presetReport.built[key] = 1; return; }
      if (row.state === 'fallback') {
        presetReport.fallback[key] = row.as;
        approx.push(KIND_LABEL[row.kind] + ' "' + row.name + '" ≈ ' + row.as + many);
        return;
      }
      presetReport.missing[key] = 1;
      missing.push(KIND_LABEL[row.kind] + ' "' + row.name + '" is not built' + many);
    });
  out.presetReport = presetReport;
  out.approxWarnings = [...new Set(approx)];
  out.blockingWarnings = [...new Set([...blocking, ...missing])];
  out.hostChecks = [...new Set(hostChecks)];
  out.warnings = [...out.hostChecks, ...out.approxWarnings, ...out.blockingWarnings];
  if (strict && out.blockingWarnings.length) throw new Error(out.blockingWarnings.join('\n'));
  return out;
};

const safeName = (filename, assembly) =>
  (String(filename || (assembly && assembly.title) || 'JIZURA').replace(/[\\/:*?"<>|\x00-\x1f]/g, '_') || 'JIZURA');

/* Data first: the JSON is what the installed panel reads, and what a later runtime can grow into. */
C.downloadJson = function (assembly, filename) {
  return J.saveFile(safeName(filename, assembly) + '.jizura.cavalry.json',
    new Blob([JSON.stringify(assembly)], { type: 'application/json;charset=utf-8' }));
};

/* One-time install: Help > Show Scripts Folder, save as JIZURA_CV.js, then Window > Scripts > JIZURA CV. */
C.downloadPanel = function (filename) {
  if (!C.panelSource) throw new Error('Cavalry panel source is missing; run build_cavalry.py.');
  const script = '/* Generated by JIZURA. Save in Cavalry\'s Scripts folder (Help > Show Scripts Folder), then Window > Scripts. */\n'
    + C.runtimeSource + '\n' + C.panelSource + '\n';
  return J.saveFile(safeName(filename || 'JIZURA_CV') + '.js', new Blob([script], { type: 'text/javascript;charset=utf-8' }));
};

/* Optional companion: pick a JSON and hand it to the open panel, or build it here when no panel answers. */
C.downloadLoader = function (filename) {
  if (!C.loaderSource) throw new Error('Cavalry loader source is missing; run build_cavalry.py.');
  const script = '/* Generated by JIZURA. Loader for an installed JIZURA CV panel; it also builds on its own. */\n'
    + C.runtimeSource + '\n' + C.loaderSource + '\n';
  return J.saveFile(safeName(filename || 'JIZURA_CV_Loader') + '.js', new Blob([script], { type: 'text/javascript;charset=utf-8' }));
};

C.download = function (assembly, filename) {
  const payload = JSON.stringify(assembly).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const script = '/* Generated by JIZURA. Run in Cavalry JavaScript Editor. */\n' + C.runtimeSource
    + '\nJZCavalry.run(' + payload + ', { componentPath: null, fontOverrides: {}, timingPaths: null });\n';
  return J.saveFile(safeName(filename, assembly) + '.cavalry.js', new Blob([script], { type: 'text/javascript;charset=utf-8' }));
};
})();
