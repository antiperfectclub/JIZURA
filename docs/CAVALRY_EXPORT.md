# Cavalry export (experimental)

**Cavalry用に書き出し** (next to **AE用に書き出し**) turns the current piece into data Cavalry can edit. There
are four artefacts in the dialog:

| button | file | when |
| --- | --- | --- |
| **JSONを書き出す** (primary) | `*.jizura.cavalry.json` | the data; re-import it any time, with no new script |
| **パネル（初回のみ）** | `JIZURA_CV.js` | install once in Cavalry's Scripts folder; stays docked |
| **ローダー** | `JIZURA_CV_Loader.js` | no install: pick a JSON once and build (or hand it to the open panel) |
| **スクリプト** | `*.cavalry.js` | no install: the assembly is embedded and built on run |

Cavalry cannot build a composition from JSON on its own — `api.importScene()` reads `.cv` / `.cvc` scenes and
the Presets folder holds attribute presets, not scenes. The JSON is therefore always read by a script. The
panel is that script, installed once:

1. **Help → Show Scripts Folder**, save `JIZURA_CV.js` there.
2. **Window → Scripts → JIZURA CV** (scripts are hot-loaded; no restart).
3. Press the button, pick a `.jizura.cavalry.json`.

`JIZURA_CV_Loader.js` is the same host code with a file picker instead of a resident panel. It posts the path
to an open panel when Cavalry's `WebClient` can reach it, and builds the composition itself otherwise, so it
never depends on the panel being open.

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
  capabilities, cuts: [...], warnings, approxWarnings, blockingWarnings, hostChecks, presetReport, nodeCount
}
```

`presetReport` is the page's prediction, in the same shape the host returns: `built` (exact), `fallback`
(`kind:name → canonical builder`) and `missing` (`kind:name`). The runtime returns the same three maps after a
run, so the dialog and the console can be compared one to one.

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

`assembly.capabilities.presets` lists the canonical builders per kind. Every requested name is resolved by
`cavalry/families.js`, the one vocabulary both the page and the host read, so the warning here is what the
runtime will actually do:

- **exact** — a builder for that name (`fade`, `pop`, `zoom`, …): built as asked, no warning.
- **fallback** — a family rule (`cam:push → zoom`, `decor:crosshair → cropMarks`): built, listed as
  `camera "push" ≈ zoom (3 cuts)`. Approximations are counted, not hidden.
- **missing** — no family (`bg:grain`, `trans:wipe`, `decor:zodiacWheel`): kept in the JSON, reported as
  `background graphic "grain" is not built`, and the only thing that blocks exact-only export.

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
- Enter/exit transform presets (`slide`, `rise`, `drop`, `pop`, `flip`, `type`) keyframed on the item's motion
  null; the `type` preset adds a `subMesh` + `stagger` pair for character-by-character reveal.
- Per-cut camera (`pan`, `zoom`, `roll`, `handheld`) on a keyframed `null` inside the cut group, background
  graphics (`dots`, `frame`, `bigChar`, `split`), treatments (`underline`, `boxed`, `marker`) and decoration
  (`cropMarks`, `ruler`, `indexNum`).
- Export ranges keep the original animation phase: a cut that starts before the range keeps its fade-in
  progress, and a cut that ends after it keeps its fade-out.

## Warning model

The dialog lists every known difference before you download, in three groups:

- **Approximations (⚠, amber)** — a preset built by a family rule, a layout exported as a still, vertical text
  built horizontally, hold motion. Supported, but not the requested design.
- **Not built (⚠, red)** — a preset with no builder (`bg:grain`, `trans:wipe`, a decoration with no family),
  HUD, global event FX, ghosts/glow/texture and other screen FX. These stay in the JSON.
- **Checks (muted)** — differences in the host or in text metrics: manual Composition Settings, installed
  font style names, Y axis / rotation direction / glyph bounds, letter tracking and line leading, left/right
  bbox anchoring, on-twos (koma) sampling and audio. They stay listed even in strict mode.

**対応できる項目だけで書き出す** (exact support only) blocks the download when anything is *not built*.
Approximations are permitted because they are built and named; they are listed first, one line per preset name
with the number of cuts that use it.

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
| animations | `cut`, `fade`, `slide`, `rise`, `drop`, `pop`, `flip`, `type` (exit has no `type`) |
| presets | `assembly.capabilities.presets`: canonical builders per kind; every other name is a family approximation or reported missing |
| align | `left`, `center`, `right` |
| decoration, treatments, backgroundGraphics, camera | `true` (family builders; see the preset list) |
| shapes, transitions, effects, HUD, audio | `false` |
| timing | `manual` |

Each text node also carries `kind`, `granularity` and `animationBackend`, so a second backend can be added
without changing the data shape.

### Next backend: Sub-Mesh + Stagger

The `type` enter preset already uses Cavalry's own pattern: a `subMesh` connected to the text's `deformers`
with a `stagger` connected to `shapeTimeOffset` (see the official scripting example). Node data still says
`individual-layers`, because every text item is still its own layer; a future assembly will be able to say:

```js
{ kind: 'text', granularity: 'whole-text', animationBackend: 'submesh' }
```

Per-character colour/font layouts keep individual text layers. The runtime rejects an unknown backend before
creating any layer, so an assembly made for a newer backend cannot be half-built by an older runtime.

## Module layout

| file | role |
| --- | --- |
| `cavalry/browser.js` | page side: capture layouts, assemble JSON, classify presets, download |
| `cavalry/families.js` | the shared name → canonical builder table (browser + host) |
| `cavalry/presets.js` | builders for enter/exit/bg/cam/treat/decor; reads `families.js` |
| `cavalry/runtime.js` | validate the assembly, build the composition, return `report` |
| `cavalry/bridge.js` | optional `WebServer`/`WebClient` handoff between panel and loader |
| `cavalry/panel.js` | dockable panel UI |
| `cavalry/loader.js` | one-shot loader UI |

`build_cavalry.py` writes `src/11r_cavalry.js` (page bundle), `dist/cavalry/JIZURA_CV.js` (panel) and
`dist/cavalry/JIZURA_CV_Loader.js` (loader). Each dist file is self-contained: Cavalry gives every script its
own JS environment, so panel and loader never call each other directly.

## Build and test

```sh
python3 build_cavalry.py     # src/11r_cavalry.js + dist/cavalry/JIZURA_CV.js + JIZURA_CV_Loader.js
node tools/test_cavalry_export.js
python3 build.py --dev
```

Edit the sources, not the generated bundles. The tests cover assembly, layout capture, coordinate conversion,
frame boundaries, stagger, sparse fades, overlap baking, serialisation scope, the v2 preset block, family
resolution and the `built` / `fallback` / `missing` report, the JSON / panel / loader / script downloads, the
bridge against a mock `WebServer`/`WebClient` (including hosts without either), the agreement between
`families.js` and `presets.js`, and the two shipped `dist/cavalry/*.js` files run end to end against a mock
host (button press → composition). They do not replace rendering the file in Cavalry.

### Order of work, and what is deliberately not built yet

1. JSON + panel + loader + schema v2 (done) — the data path is complete and stable.
2. Preset families for enter/exit, background, camera, treatment and decoration (done, approximations named).
3. Ghosts (duplicated text with an offset and a dimmed colour) — ready in principle; the duplicated-shape
   colour path needs one host check.
4. Background lift, texture and screen FX — Cavalry is node-based, so AE's effect stack has no 1:1 mapping;
   they stay reported instead of faked.
5. Real host verification of `WebServer`/`WebClient`, attribute paths, easing names and text metrics.

`api.magicEasing` names used here (`ExpoOut`, `BounceOut`) come from the documented list; any that this
Cavalry build rejects are skipped by the builder's `try/catch` and never break a composition.

The AE exporter (`J.planForAE()`, `ae/50_build.jsx`) and the AE releases are not involved and are not rebuilt.

## References

- [Getting started with scripting (Text / Sub-Mesh / Stagger example)](https://cavalry.studio/docs/tech-info/scripting/scripting-getting-started/)
- [API module](https://cavalry.studio/docs/tech-info/scripting/api-module/)
- [JavaScript Editor](https://cavalry.studio/docs/user-interface/menus/window-menu/javascript-editor/)
