# Cavalry export (experimental)

**Cavalry用に書き出し** (next to **AE用に書き出し**) turns the current piece into data Cavalry can edit. There
are three artefacts in the dialog:

| button | file | when |
| --- | --- | --- |
| **JSONを書き出す** (primary) | `*.jizura.cavalry.json` | the data; re-import it any time, with no new script |
| **パネル（初回のみ）** | `JIZURA_Cavalry.js` | install once in Cavalry's Scripts folder |
| **スクリプト** | `*.cavalry.js` | no install: run it once in the JavaScript Editor |

Cavalry cannot build a composition from JSON on its own — `api.importScene()` reads `.cv` / `.cvc` scenes and
the Presets folder holds attribute presets, not scenes. The JSON is therefore always read by a script. The
panel is that script, installed once:

1. **Help → Show Scripts Folder**, save `JIZURA_Cavalry.js` as `JIZURA.js`.
2. **Window → Scripts → JIZURA** (scripts are hot-loaded; no restart).
3. Press the button, pick a `.jizura.cavalry.json`.

The new composition is named after the song. Every cut becomes a null group with its background and one
null + text shape per text item. The currently open Scene and its save path are not touched.

After running, set **Composition Settings** by hand:

```
Frame Rate:   assembly.composition.fps
Frame Range:  0 … frameCount - 1
```

The exact scripting paths for frame rate and frame range are version specific, so this exporter does not guess
them. Once you have checked them with **Copy Scripting Path**, pass them to the exported call:

```js
JZCavalry.run(assembly, {
  componentPath: null,
  fontOverrides: {},
  timingPaths: { fps: '…', start: '…', end: '…' }
});
```

Audio is not embedded. Import the song and trim it by `audioOffset` seconds.

## Schema v2: geometry plus presets

`version: 2` carries what the planner decided next to the geometry it produced. The runtime builds the
geometry now and can grow into the presets later without the JSON changing again.

```js
{
  format: 'jizura.cavalry.assembly', version: 2,
  composition: { width, height, fps, frameCount },
  audioOffset, lang, keyBg,
  style: { schemes: [...], glow, ghost, texture, fonts, fx: { motion, glitch, decor, texture, chroma } },
  capabilities, cuts: [...], warnings, hostChecks, blockingWarnings, nodeCount
}
```

Each cut keeps both the resolved animation and the names the planner asked for:

```js
cut.enter   // 'cut' | 'fade' — what this runtime builds
cut.presets = {
  enter: { name, inDur }, exit: { name, outDur },
  bg:    { name, params } | null,
  cam:   { name, params } | null,
  trans: { name, params, frames } | null,
  treat: { name, params } | null,
  decor: [{ name, params }],
  hold, scheme, seed, morph
}
```

The field names come from the planner (`src/08_planner.js`), not from the AE layer builders — there is no
`enterP` / `exitP`; enter and exit presets read `cut.params`, and the others keep `bgP`, `camP`, `transP`,
`treatP`. Nothing is renamed on the way out.

`assembly.capabilities.presets` lists what is actually built per kind. The runtime warns once per
`kind:name` that it left unbuilt (`cam:push`, `decor:crosshair`, …), so a preset never disappears silently.

## What is exported

Geometry is captured by running the **real layout renderer** (`src/06_layouts.js` and every pack) once at the
cut's resting moment, so all registered layouts keep their own composition instead of falling back to a
centered block. The assembly keeps the plan's deterministic seed; no new random values are drawn.

- Layout geometry and per-item stagger (`mi × cut.stagger`), colour, size, rotation, x-scale and
  left/centre/right anchoring.
- Multi-line text items, secondary copy that layouts draw themselves (kicker, romaji line, labels) and the
  cut's background colour.
- Clip in/out points and the `cut` / linear `fade` enter and exit. Fades become four linear opacity keys per
  item; when in and out overlap, the envelope is baked per frame because the product of two ramps is not linear.
- Export ranges keep the original animation phase: a cut that starts before the range keeps its fade-in
  progress, and a cut that ends after it keeps its fade-out.

## Warning model

The dialog lists every known difference before you download.

- **Approximations (⚠)** are scene features the runtime cannot build: decorations, treatments, hold motion,
  camera, transitions/morphs, background graphics, vertical text, HUD, global event FX and screen FX
  (ghosts, glow, texture). A missing layout falls back to a centred block and is reported.
- **Checks** (muted) are differences in the host or in text metrics: manual Composition Settings, installed
  font style names, Y axis / rotation direction / glyph bounds, letter tracking and line leading, left/right
  bbox anchoring, on-twos (koma) sampling and audio. They stay listed even in strict mode.

**対応できる項目だけで書き出す** (exact support only) blocks the download when an approximation remains.
A plan with no approximations exports in strict mode; metric and host checks remain because they cannot be
proven from the browser.

Layouts that keep moving over the cut (tickers, typewriters) are exported as the still near the end of the
cut and reported. Shapes drawn with `env.rect` / `env.line` and everything in `src/07_decor.js` are not ported.

## Coordinates and time

```
Assembly: top-left origin, x → right, y → down, fps-quantised frames
Cavalry:  composition centre origin, 0,0 = centre
cavalryX = x - width / 2
cavalryY = height / 2 - y
```

Cuts use `[start, end)` internally; the runtime passes `end - 1` to `api.setOutFrame()`, which takes the last
frame of a Clip. Rotation is negated and left/right anchors are placed by the measured bounding box; both need
one asymmetric test scene in the host before they can be called verified.

## Optional native component

Change the last call of the downloaded file. The path is on the machine running Cavalry, not a browser path.

```js
JZCavalry.run(/* generated assembly */, {
  componentPath: '/absolute/path/song.cvc',
  fontOverrides: { gothic_black: { family: 'Noto Sans CJK KR', style: 'Black' } }
});
```

`api.serialise(layerIds, true)` serialises only the layers made by this run, and
`api.writeToFile(path, data, false)` refuses to overwrite. `.cvc` opens with **File → Import Scene…**; a JSON
string saved instead is loaded with `api.deserialise()`. Saving the whole Scene (`.cv`) stays a user action.

## Assembly and capabilities

`J.Cavalry.CAPABILITIES` (also copied into `assembly.capabilities`) is the honest list used by the tests:

| field | value |
| --- | --- |
| layouts | `captured` (all registered layouts, stills for time-dependent ones) |
| nodes | `text` |
| granularity | `whole-text`, `per-character` |
| animationBackend | `individual-layers` |
| enter / exit | `cut`, `fade` |
| presets | `assembly.capabilities.presets`: built names per kind; unbuilt names are exported and warned |
| align | `left`, `center`, `right` |
| shapes, decoration, treatments, effects, camera, transitions, HUD, audio | `false` |
| timing | `manual` |

Each text node also carries `kind`, `granularity` and `animationBackend`, so a second backend can be added
without changing the data shape.

### Next backend: Sub-Mesh + Stagger

For a whole text run that only needs per-character entrance, Cavalry's own pattern is a `subMesh` connected to
the text's `deformers` with a `stagger` connected to `shapeTimeOffset` (see the official scripting example).
A node will then say:

```js
{ kind: 'text', granularity: 'whole-text', animationBackend: 'submesh' }
```

Per-character colour/font layouts keep individual text layers. The runtime rejects an unknown backend before
creating any layer, so an assembly made for a newer backend cannot be half-built by an older runtime.

## Build and test

```sh
python3 build_cavalry.py     # src/11r_cavalry.js + dist/cavalry/JIZURA_Cavalry.js
node tools/test_cavalry_export.js
python3 build.py --dev
```

`cavalry/browser.js`, `cavalry/runtime.js` and `cavalry/panel.js` are bundled into `src/11r_cavalry.js`; the
first two plus the panel also become `dist/cavalry/JIZURA_Cavalry.js` for the Scripts folder. Edit the sources,
not the bundles. The tests cover assembly, layout capture, coordinate conversion, frame boundaries, stagger,
sparse fades, overlap baking, serialisation scope, the v2 preset block, unbuilt-preset warnings and the JSON /
panel / script download contracts against an API mock. They do not replace rendering the file in Cavalry.

### Order of work, and what is deliberately not built yet

1. JSON + panel + schema v2 (done) — the data path is complete and stable.
2. Camera and ghosts — cheap in principle (a keyframed `null` parent, a duplicated text shape), but the
   attribute paths (`scale`, `position`, `material.materialColor` on a duplicated shape) need one host check.
3. Background lift, decoration, textures — attribute paths and node names still unverified.
4. Enter/exit presets beyond `fade` — same dependency on verified attribute paths.

Node-graph glow, grain, texture and warp do not map 1:1 onto AE's effect stack, so those stay reported as
unsupported rather than approximated.

The AE exporter (`J.planForAE()`, `ae/50_build.jsx`) and the AE releases are not involved and are not rebuilt.

## References

- [Getting started with scripting (Text / Sub-Mesh / Stagger example)](https://cavalry.studio/docs/tech-info/scripting/scripting-getting-started/)
- [API module](https://cavalry.studio/docs/tech-info/scripting/api-module/)
- [JavaScript Editor](https://cavalry.studio/docs/user-interface/menus/window-menu/javascript-editor/)
