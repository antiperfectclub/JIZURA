# Cavalry export (native graph engine)

**Cavalry用に書き出し** (next to **AE用に書き出し**) turns the current piece into data Cavalry can build.
The AE exporter (`ae/`, `JIZURA_AE*`) is not involved and is not rebuilt.

| button | file | when |
| --- | --- | --- |
| **JSONを書き出す** (primary) | `*.jizura.cavalry.json` | the data; re-import it any time, with no new script |
| **パネル（初回のみ）** | `JIZURA_CV.js` | install once in Cavalry's Scripts folder; stays docked |
| **ローダー** | `JIZURA_CV_Loader.js` | no install: pick a JSON once and build (or hand it to the open panel) |
| **スクリプト** | `*.cavalry.js` | no install: the assembly is embedded and built on run |

Cavalry cannot build a composition from JSON on its own — `api.importScene()` reads `.cv` / `.cvc` scenes and
the Presets folder holds attribute presets, not scenes. The JSON is therefore always read by a script:

1. **Help → Show Scripts Folder**, save `JIZURA_CV.js` there.
2. **Window → Scripts → JIZURA CV** (scripts are hot-loaded; no restart).
3. Press the button, pick a `.jizura.cavalry.json`.

`JIZURA_CV_Loader.js` carries the same runtime and the optional `WebClient` handoff. It posts the path to an
open panel when Cavalry answers on `localhost:41234`; otherwise it builds the composition itself.

The new composition is named after the song. Each cut becomes a null group with its background, a three-node
camera rig, one editable path per captured graphic, and one null + text shape per glyph. The currently open
Scene and its save path are not touched.

After running, set **Composition Settings** by hand:

```
Frame Rate:   assembly.composition.fps
Frame Range:  0 … frameCount - 1
```

The scripting paths for frame rate and range are version specific, so the exporter does not guess them. Pass
them only after checking with **Copy Scripting Path**:

```js
JZCavalry.run(assembly, {
  componentPath: null,
  fontOverrides: {},
  timingPaths: { fps: '…', start: '…', end: '…' }
});
```

Audio is not embedded. Import the song and trim it by `audioOffset` seconds.

## Schema v3: a native graph, not a name list

```js
{
  format: 'jizura.cavalry.assembly', version: 3,
  buildId, nativeManifest, composition: { width, height, fps, frameCount },
  audioOffset, lang, keyBg,
  style: { schemes, glow, ghost, texture, fonts, fx: { motion, glitch, decor, texture, chroma } },
  capabilities, cuts, warnings, approxWarnings, blockingWarnings, hostChecks,
  presetReport, nativeReport, nodeCount, shapeCount, graphicPrimitives
}
```

Every cut carries:

```js
cut.source = { layout, params, seed, text, lineText, note, words }
cut.layoutInstruction = { name, params }   // browser export: 'graphics' (capture)
cut.presets = {
  enter: { name, params }, exit: { name, params }, hold: { name, params },
  bg, cam, trans, treat: { name, params } | null,
  decor: [{ name, params }], scheme, seed, morph
}
cut.background     // '#rrggbb' or null
cut.graphics[]     // captured paths: { name, path, fill, stroke, width, alpha, parts }
cut.nodes[]        // text items: glyphs, x/y, size, font, colour, align, vertical, delayFrames
```

`presetReport` is the page's prediction and has the same shape as the host report: `built`, `fallback`,
`missing`. The native registry is exact-name only. `fallback` is kept in the data model for a future negotiated
port, but this build never generates one:

- **exact / built** — a native recipe with that exact name exists. It is still `hostVerified: false`; exact
  means "no alias substitution", not "pixel-identical to the web renderer".
- **missing** — no native recipe. The name stays in the JSON, is listed in `blockingWarnings`, and is the only
  thing that blocks **対応できる項目だけで書き出す**.

`assembly.capabilities.presets` lists the exact registered names per kind. There is no family table and no
`push → zoom` style reinterpretation.

## What is exported

Geometry is captured by running the **real layout renderer** (`src/06_layouts.js` and every pack) at the cut's
resting moment. Captured text keeps its own composition instead of falling back to a centred block. The plan's
deterministic seed is carried; no new random values are drawn.

- Layout text: per-item stagger (`mi × cut.stagger`), colour, size, rotation, x-scale, left/centre/right
  anchoring, multi-line copy and secondary copy that layouts draw themselves.
- Layout graphics: `env.rect`, `line`, `circle`, `arc`, `rrect`, `poly`, `blob` and `polyPartial` are recorded as
  editable path commands. Adjacent primitives with the same paint merge into one path, so a hatch is one layer,
  not eight hundred. Non-solid paints (gradients, patterns) are dropped and counted in the warnings.
  `arc` strokes are exported as 4° polylines. Captured graphics are stacked behind all text; the web renderer
  can interleave them, so this is a listed host check.
- Clip in/out points. `cut` and linear `fade` enter/exit become per-frame opacity keys; overlapping in/out is
  baked per frame because the product of two ramps is not linear.
- Enter/exit/hold presets that have a native recipe (see the manifest for the current list).
- Three-node camera rig: **Camera Rotation** (position + roll) → **Camera Stretch** (shear decomposition) →
  **Camera** (scale + counter-rotation). Camera formulas are sampled once per frame onto real transform keys;
  no JavaScript Utility node and no easing-name table is assumed. Ghost-pass lag is not implemented.
- Background graphics, treatments and decorations with a native recipe (see `packs/`); their geometry is built
  in Cavalry coordinates, not mapped to a different named effect.
- Export ranges keep the original animation phase: a cut that starts before the range keeps its fade-in
  progress, and a cut that ends after it keeps its fade-out.

### Requested recipes added in this build

| group | names | notes |
| --- | --- | --- |
| layout | `center`, `vcols`, `dictionary`, `xbTwistFrames` | for hand-authored/AE assemblies; browser exports use captured `graphics` |
| enter | `xgComet`, `tyKeyFirst` | comet trails are eight real delayed glyph copies |
| exit | `xjFocusPull`, `xiPlateCarry`, `knCloseGap` | clip uses the documented deformer; blur needs a host profile (below) |
| hold | `tzKernNudge`, `tzCounterRules` | kerning ticks and counter rules are real paths |
| bg | `skyline`, `xpRingDots` | two parallax city planes with windows; concentric dot rings |
| treat | `inline`, `outlineOffset`, `xoDoublePrint` | real glyph copies, not underline/box aliases |
| decor | `romajiLine`, `xlLadder`, `tyGlyphBody` | reading line, ladder rails/rungs/cursor, glyph em boxes/baselines/indices |
| trans | `xqPolyIris` | incoming-cut polygon iris with real deformer clipping |

`skyline` omits the source's feathered horizon glow. `xoDoublePrint` rotates per glyph rather than around the
whole line. `xiPlateCarry` and `xqPolyIris` clip through the documented JavaScript Deformer; `xjFocusPull`
emits a semantic blur node. Treatments clone the exported glyph layers, so a clip or blur deformer created by
another recipe is not copied onto those clones. `romajiLine` rejects kanji without `source.romaji` or
`params.text` instead of inventing a reading. `xlLadder` and `tyGlyphBody` are native reconstructions whose
parameter conformance with the AE formulas is still pending.

### Host profile for the unverified blur layer

Clip deformers use the documented `javaScriptDeformer` layer type by default and write a data-only
`Path.intersect()` expression. The expression globals (`n0`, `def`) still have not been exercised against a
running Cavalry in this build. A different verified deformer type can be supplied, and the Gaussian-blur layer
type remains opt-in; without it the build fails instead of drawing an unblurred substitute:

```js
JZCavalry.run(assembly, {
  hostProfile: {
    javaScriptDeformer: { layerType: 'javascriptDeformer' }, // optional override
    gaussianBlur: { verified: true, layerType: 'Blur', radius: 'radius', input: 'input' }
  }
});
```

Without the blur profile:

```
Gaussian blur requires hostProfile.gaussianBlur {verified:true, layerType, radius, input}. No substitute was applied.
```

The blur layer also passes through `emit()` and is restored to its semantic form afterwards, so a failed run
does not leave a partially rewritten graph.

## Warning model

The dialog lists every known difference before download:

- **Approximations / port notes (amber)** — a native port that differs from the AE recipe (glyph-bounds pivot,
  frame-sampled formulas, per-glyph print pivot). Supported, but not pixel-identical.
- **Not built (red)** — a preset with no native recipe, HUD, global event FX, ghosts/glow/texture, screen FX,
  transitions other than `xqPolyIris`, and `fx`. These stay in the JSON and block exact-only export.
- **Host checks (muted)** — manual Composition Settings, installed font style names, Y axis / rotation
  direction / glyph bounds, letter tracking, line leading, left/right bbox anchoring, vertical glyph rotation,
  on-twos (koma) sampling, audio, the graphics z-order, and deformer render appearance.

Layouts that keep moving over the cut are exported as a still near the end and reported. Layouts that throw
during capture fall back to a centred block with the original error in `blockingWarnings`.

## Coordinates and time

```
Assembly: top-left origin, x → right, y → down, fps-quantised frames
Cavalry:  composition centre origin, 0,0 = centre
cavalryX = x - width / 2
cavalryY = height / 2 - y
```

Cuts use `[start, end)` internally; `api.setOutFrame()` receives `end - 1`. Rotation is negated and left/right
anchors are placed by the measured bounding box; both need one asymmetric test scene in the host before they
can be called verified.

## Native module layout

| file | role |
| --- | --- |
| `cavalry/browser.js` | page side: run layouts, capture text + paths, assemble JSON, classify presets, download |
| `cavalry/native/00_registry.js` | `JZNative`: one exact-name recipe registry |
| `cavalry/native/10_graph.js` | graph nodes, path validation, text round-trip, rollback, emit |
| `cavalry/native/20_components.js` | glyph placement and editable-path components |
| `cavalry/native/25_recipe_tools.js` | shared math, camera helpers, sampler registration |
| `cavalry/native/26_recipe_components.js` | requested-package helpers; clip/blur extensions |
| `cavalry/native/27_registry_bridge.js` | `JZPresets` view over `JZNative`; scene-space transform and clip tools |
| `cavalry/native/30_assembly.js` | preflight, cut assembly, deferred cut-pair transitions, camera rig, report |
| `cavalry/native/browser_adapter.js` | browser assembly → v3 native payload + glyphs + words |
| `cavalry/packs/*.js` | native recipes: geometry, motion, hold, camera, x2 packs, requested packs (motion/backgrounds/treatments/layouts/decor/transitions) |
| `cavalry/bridge.js` | optional `WebServer`/`WebClient` handoff |
| `cavalry/panel.js`, `cavalry/loader.js` | dockable panel and one-shot loader UI |

The old `presets.js`, `runtime.js`, `families.js`, `host-values.js` and `procedural.js` files are removed.
`JZPresets` is now a thin view over `JZNative` (same definition object, no copy), so a second registry cannot
drift. `10_graph.js` validates finite host values, empty paths and Unicode round-trips, and
`25_recipe_tools.js` owns deterministic seeded math.

`build_cavalry.py` writes `src/11r_cavalry.js` (page bundle), `JIZURA_CV.js` / `dist/cavalry/JIZURA_CV.js`
(panel), `JIZURA_CV_Loader.js` / `dist/cavalry/JIZURA_CV_Loader.js` (loader), `dist/cavalry/build-report.json`
and `dist/cavalry/build-manifest.json`. Each dist file is self-contained.

## Build manifest and coverage

`dist/cavalry/build-manifest.json` is the machine-readable contract:

```json
{
  "format": "jizura.cavalry.build-manifest",
  "buildId": "…",
  "modules": ["native/00_registry.js", "…", "native/30_assembly.js"],
  "recipes": { "cam": { "panL": { "exact": false, "hostVerified": false, "source": "…", "scope": "cut-camera" } } },
  "coverage": { "layout": { "method": "native", "registered": ["graphics", "center", "…"], "blockingMissing": ["accordion", "…"] } },
  "catalog": { "total": 1717, "groups": { "layout": { "count": 366, "notPorted": 366 } } },
  "blockingMissing": 1613,
  "status": "preview",
  "hostVerified": false,
  "renderVerified": false
}
```

- Every group uses `method: "native"`; `blockingMissing` equals `missing`.
- Browser cuts resolve through the captured `graphics` recipe, but that is an export path, not a native
  implementation of each layout name. An unregistered layout name still counts as unported in the inventory.
- `release` refuses to build while `blockingMissing > 0`.

### AE catalog

```sh
node cavalry/tools/extract_ae_catalog.js
```

Instruments `jzReg` in the real jsx sources and records 1,717 registrations (layout 366, enter 251, hold 102,
exit 221, decor 260, treat 122, bg 130, cam 71, fx 138, trans 56), their source file, flags and function
bodies. Every entry says `implementationStatus: "not-ported"`: the catalog is evidence of what the AE recipe
does, not a claim that Cavalry implements it. Outputs `cavalry/catalog/ae-presets.json` and `.csv`
(git-ignored; regenerate on demand).

## Build and test

```sh
python3 build_cavalry.py          # bundles + build-report.json + build-manifest.json
python3 build_cavalry.py --check  # fail if any generated file is stale
node tools/test_cavalry_export.js # contracts: capture, graph, packs, catalog, panel, loader
node cavalry/tools/test_requested_native.js # registry identity, 46 recipe/graph checks
python3 build.py --dev            # page HTML with the regenerated src/11r_cavalry.js
```

The build also proves every requested recipe is executable, present in the manifest, and the same definition
via `JZPresets` before writing outputs. The tests run each new recipe at least once against a mock host. They do
not replace rendering the file in Cavalry: `hostVerified` and `renderVerified` stay false.

## Deliberately not built yet

1. The remaining AE names (from the catalog): layout 360, enter 227, exit 208, hold 94, bg 127, cam 33,
   treat 116, decor 255, trans 55, fx 138. `fx` still has no native recipe.
2. Real host verification of attribute paths, `api.getBoundingBox`, text metrics, `WebServer`/`WebClient`, the
   JavaScript Deformer globals and the blur layer type.
3. The source's feathered horizon glow (`skyline`), whole-line print pivot (`xoDoublePrint`), and AE Echo's exact
   sampling (`xgComet` uses frame-based delayed copies). `xlLadder` and `tyGlyphBody` are reconstructions whose
   original formula conformance is pending.
4. Global events, HUD, audio embedding, ghosts/glow/texture and screen FX. They are reported, never faked.
5. A negotiated `fallback` mode. The data shape keeps the slot, but the current registry is exact-only.

## References

- [Getting started with scripting](https://cavalry.studio/docs/tech-info/scripting/scripting-getting-started/)
- [API module](https://cavalry.studio/docs/tech-info/scripting/api-module/)
- [JavaScript Deformer](https://cavalry.studio/docs/nodes/behaviours/javascript-deformer/)
- [Deformer module](https://cavalry.studio/docs/tech-info/scripting/deformer-module/)
- [JavaScript Editor](https://cavalry.studio/docs/user-interface/menus/window-menu/javascript-editor/)
