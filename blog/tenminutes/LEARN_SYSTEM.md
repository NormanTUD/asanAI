# Ten Minutes LearnSys

LearnSys is the reading and demo layer for Ten Minutes. It is deliberately
small in DOM and large in contract: a day is a list of steps, a step has a
short main text, deeper questions live in compact collapsible blocks, and a
demo changes only the objects that actually change.

Files:

- `intuition_learnsys.php` — the real intuition page. It loads `learnsys.js`,
  `intuition_learnsys-data.js`, and `learnsys.css`; it is the first production
  shell for the new system.
- `intuition_learnsys-data.js` — the day/step data used by the real page
  (currently the tested nine-demo set).
- `learnsystest.html` — the random demo-mix test page. It shares the same
  engine and data shape but keeps its inline copy for experiments.
- `learnsys.js` — the engine, the public API, and the built-in demos.
- `learnsys.css` — the shared LearnSys stylesheet extracted from the test page.
- `spacemorph_demo.html` — the most complex demo (MLP bends space), embedded
  as a self-contained iframe.
- `todo_learningsystem.md` — the working checklist.

## Mental model

- **Day**: one self-contained lesson block. Days are grouped by a track
  (`idea`, `failure`, `senses`, `transformer`, `assistant`, `questions`,
  `history`).
- **Step**: one short chapter of a day. The main text is 3–5 sentences.
- **Cue**: a scroll section that changes the demo state. Cues do not replace
  the step text; they are deeper reading inside it.
- **Depth**: `short`, `standard`, `deep`. The depth tree is always present;
  the setting decides how much is open. No content is removed.
- **Transition**: a day change may morph the dynamic layers. A step change
  never morphs the whole canvas: the demo animates its own changed objects.
- **Static vs dynamic**: labels, axes, block stacks, and images belong to the
  static layer. Bars, arcs, points, highlights, and surfaces belong to the
  dynamic layer. Static content must not move during a transition.

## Mix test mode

`learnsystest.html` passes `mix: true`. The page:

- removes the top bar completely; the text and demo fill the viewport;
- opens on a random day every load;
- shows a compact navigation bar at the top left of the text column, above the
  step kicker and title, with a 0–9 position scale and step back / forward;
- maps `0` to the first day, `9` to the last, `5` to the middle, and
  `1…8` evenly between them;
- supports `←`/`→` for steps, `Shift` + `←`/`→` for days, `Home`/`End` for
  the first/last day, `R` for another mix, `D` for depth, `F` for focus,
  `+`/`−` for text, and `?`/`Esc` for help;
- uses the same engine as a future single-day page: `LearnSys.mount(el,
  {days: [day], mix: false})` renders one day without needing the day rail.

## Public API

```js
LearnSys.mount(el, config)
LearnSys.version
LearnSys.motion
LearnSys.util
LearnSys.scene
LearnSys.defineDemo(name, factory, meta)
LearnSys.getDemoMeta(name)
LearnSys.prefs.normalize(raw)
```

### `mount(el, config)`

`config`:

```js
{
  lang: "de",
  tracks: [{ id, label, days }],
  days: [{
    id, track, label, kicker, title, demo, credit,
    steps: [{
      kicker, title, body, watch, demoState,
      context, deep, boxes, cues
    }],
    boxes: []
  }]
}
```

A step can carry `cues`:

```js
cues: [{
  label: "1D → 2D",
  title: "Die zweite Achse",
  text: "…",
  state: { dim: 1, mode: "neighbors" }
}]
```

When a cue reaches the centre of the text column, the engine calls
`demo.update(state)`. Cues are armed only after the reader scrolls, and they
are suppressed briefly after a step/day change so a new step is not
overridden by its own text position.

## Demo contract

A demo is a factory:

```js
LearnSys.defineDemo("my-demo", function (root, api) {
  return {
    update(state) {},   // required: apply the step/cue state
    resize() {},        // optional: container changed size
    destroy() {},       // optional: remove listeners/raf
    getScene() {}       // optional: Tier 2 scene description
  };
}, { tier: 1, label: "My demo", staticLayer: false });
```

`api` provides:

| Helper | Purpose |
|---|---|
| `colors()` | resolved ScaDS tokens |
| `esc()`, `termHTML()` | safe text and glossary terms |
| `fit(canvas, host)` | size a single canvas |
| `fitPair(wrap, staticCanvas, dynamicCanvas)` | size a static/dynamic pair |
| `motion` | shared durations and stagger |
| `scene` | scene validation, diff, interpolation, rendering |
| `util` | clamp, lerp, ease, font levels, prefs |
| `onHint(text)` | update the stage hint |
| `go(day, step)` | navigate from inside a demo |

### Static/dynamic demos

Use two canvases in a `.ls-canvas-wrap`:

```html
<div class="ls-canvas-wrap">
  <canvas class="ls-canvas ls-canvas--static"></canvas>
  <canvas class="ls-canvas ls-canvas--dynamic"></canvas>
</div>
```

Draw labels, axes, block stacks, and images on the static canvas. Draw the
things that change on the dynamic canvas. The engine captures only the
dynamic canvas for a day-change morph, so static content never warps.

## Scene API (the general layer)

The scene API is the migration target for the full demos. A demo can describe
its state instead of drawing only pixels:

```js
{
  camera: { yaw, pitch, zoom },
  primitives: [
    { id: "token:she", type: "label", x, y, text, fill },
    { id: "arc:she->maria", type: "arc", x1, y1, cx, cy, x2, y2, lineWidth },
    { id: "bar:paris", type: "bar", x, y, w, h, value, fill },
    { id: "block:attn1", type: "rect", x, y, w, h, fill, stroke },
    { id: "image:stop", type: "image", x, y, w, h, image },
    { id: "surface:loss", type: "mesh", vertices, fill }
  ]
}
```

Supported types: `rect`, `circle`, `point`, `line`, `arc`, `label`, `bar`,
`image`, `mesh`.

- `LearnSys.scene.validate(scene)` — unique ids, known types.
- `LearnSys.scene.diff(prev, next)` — `persistent`, `exit`, `enter`, `camera`.
- `LearnSys.scene.interpolate(prev, next, t)` — numeric fields interpolate;
  strings switch at the midpoint; exit/enter fade.
- `LearnSys.scene.render(ctx, scene)` — a small generic renderer.
- `LearnSys.scene.fromCanvas(canvas)` — fallback: the whole canvas as one
  image primitive.

A full demo can start at Tier 0 (static/dynamic canvases), publish named
layers at Tier 1, and return a primitive scene at Tier 2. The engine never
requires Tier 2; migration is incremental.

## Motion grammar

`LearnSys.motion`:

| Phase | Duration |
|---|---|
| Step/demo state change | 180 ms |
| Day morph | 180 ms |
| Camera | 240 ms |
| Text fade | 70 ms |
| Enter / exit | 160 / 120 ms |
| Stagger | 40 ms |

Rules:

- Step changes never use a whole-canvas overlay. The demo animates its own
  bars, arcs, points, or highlight.
- Day changes may use the dynamic-layer mesh morph. Static layers stay fixed.
- Text may fade/blur for the short window; it must not block the demo.
- `prefers-reduced-motion` switches to instant state changes.

## Font size and persistence

Five levels (`Klein`, `Normal`, `Groß`, `Sehr groß`, `Maximal`) set
`--ls-fs-body`, `--ls-fs-title`, and `--ls-fs-small`. The choice is stored in
`localStorage` under `tm_learnsys_pref_v1` and clamped to the five levels.
The `A−` / `A+` buttons, `+` / `-`, and `0` (reset) are supported. The
prototype top bar and the mobile layout both expose the control.

## Depth, details, and the hurried reader

`short`, `standard`, and `deep` change what is open, never what exists.
The depth tree is built from the current step's real `context`, `deep`, and
`boxes` (plus the day's `boxes` on the first step), not placeholder text. Each entry is a
native `<details>` and can be opened individually; `Alles` opens every level
and every formula box.

- `short`: the root is closed, but the summary "Tiefer eintauchen · N Fragen"
  is always visible and clickable.
- `standard`: root open, first context open.
- `deep`: root open, context open, remaining boxes one click away.
- `Alles`: opens every detail and sets `deep`.
- `Tiefe öffnen`: moves one level deeper and scrolls to the door.

The reader who wants everything can walk every day and step, open every box,
and read the formula/technique/history notes. The reader with five minutes
sees the short body and the depth door, but is never blocked from the detail.

## Glossary terms

Terms are inline buttons. Hover or focus shows a compact tip; the tip itself
is clickable and opens the inline definition, SVG, and lesson link. Clicking
the term toggles the same note. The tip is removed immediately on navigation,
depth change, text scroll, resize, focus mode, and day/track changes, so a
removed term cannot leave a floating card behind.

## Position scale and day pages

The mix page uses a ten-step position scale instead of a day rail. It sits
at the top left of the text column, above the kicker and title, so it never
covers the reading area. `0` is the first day and `9` the last, so `5` sits
in the middle. Clicking a tick jumps immediately; the active tick is green.
The two arrows beside the scale move one step back or forward. There is no
`Mix` button; the page still opens on a random day, and the scale is the
explicit way to move.

The real page uses the same mix shell with `startDay: 0`, so it opens on the
first day and keeps the 0–9 scale. The old day rail markup remains in the
engine for the coming per-day split, but it is not rendered in mix mode.

The embedding day is deliberately stepwise: 1D, 2D, 3D, then context. It has
no scroll cues anymore, so scrolling cannot silently change the dimension
while the text still talks about one state. The stage hint and the canvas
badge always name the active mode.

## Mobile

- The top navigation bar stays above the heading and its scale stays usable
  on a phone.
- `Demo groß` hides the text column and gives the demo the full stage.
- Canvases use `touch-action: none` where dragging matters.
- The text column keeps its own vertical scroll; the stage does not jump.
- Text size, depth, help, shuffle, and step navigation are available from the
  keyboard and the dock.

## Migrating a full demo

1. Add the full demo's markup to a self-contained page or a factory.
2. Wrap it in the demo contract (`update`, `resize`, `destroy`).
3. Separate static and dynamic drawing. If the demo cannot be split, start
   with `scene.fromCanvas` as the fallback.
4. Map the demo's state to step/cue `demoState` objects.
5. Add `getScene()` only when the demo can expose stable primitive ids.
6. Keep step-change animation inside the demo. Do not add a global overlay.
7. Test both languages if the demo produces text.

Start with `attentionlab` and `transformer`: they have the most complex state
and the clearest static/dynamic split. Then `embeddinglab`, `tokenizerlab`,
and `convolution`.

## Tests

Unit tests (pure API, scene diff, prefs, font bounds):

```bash
node blog/tests/learnsys_unit_test.js
```

Browser tests (font persistence/clamping, green day rail, smooth scroll,
back/forward day navigation, every step's real depth content, the hurried
reader, the deep reader, resume after reload, clickable glossary tips, stale
tips, step/day transitions, focus mode, mobile overflow and mobile wheel):

```bash
uv run blog/tests/learnsys_browser_test.py
```

Personas and behaviours exercised by the browser suite:

- **Hurried**: compact depth, short body, depth door still visible.
- **Deep**: every day and step, real context/deep/formula boxes, `Alles`
  opens all details, at least one maths box per walk.
- **Navigator**: `0`/`5`/`9`, position ticks, step arrows, `Shift` + arrows,
  `Home`/`End`, and the help overlay.
- **Mixer**: the random page still exposes every day through the scale, and
  the API shuffle reaches several distinct demos.
- **Embedding reader**: 1D → 2D → 3D hints, a drawn 3D scene, and reachable
  source links.
- **History reader**: timeline images load, captions keep their credit, and
  clicking a station changes the step.
- **Returner**: depth and font survive a reload; the mix day stays random.
- **Mobile**: no horizontal overflow, dock fits, shuffle and focus work.
- **Glossary user**: hover tip, click tip to open the note, click term to
  toggle, navigation removes stale tips.

Both must pass before a demo migration is considered finished. The browser
test serves `blog/` locally and drives `learnsystest.html` with headless
Chromium.

## Shared scene tools (2026-11-13)

The demos stay individual, but the shared layer now carries the parts they
were repeating.

- `assets/learnsys-visuals.js` (`window.LearnSysVisuals`) provides palette
  mixing, arrows, labels, grids, 2D/3D projection, heatmaps, and token chips.
  Use it through `api.visual` or `window.LearnSysVisuals`.
- `assets/learnsys-scene-kit.js` (`window.LearnSysSceneKit`) provides
  `canvas`, `nav`, `readout`, `range`, and `chips`. `canvas` centralises DPR
  sizing, resize, `tm:theme`, visibility, and reduced motion; `nav` and
  `range` centralise the common DOM. New demos should use the kit. Existing
  demos do not have to be rewritten.
- `api.colors()` now returns **one shared mutable palette**. On `tm:theme`
  the engine updates that object in place and calls the active demo's
  `resize()`. Scenes that cached `C = api.colors()` therefore see the new
  colours without re-reading CSS, and scenes do not need their own theme
  listeners (they can keep them; the redraw is idempotent).
- `api.visual`, `api.kit`, and `api.reducedMotion` are part of the demo API.
- `assets/learnsys-visuals.js` and `assets/learnsys-scene-kit.js` load before
  `learnsys.js`. Scene files load after the engine and before the data file.
- `learnsys.css` ends with a zero-specificity scene baseline
  (`:where(.ls-scene-host) …`) for readouts, controls, nav rows, progress
  labels, `output`, ranges, and canvases. Specific scene rules always win.
- Scene layers carry `data-scene="<name>"`; use it for debugging or for
  future shared CSS.
- Long-form prose in the text panel is justified with `hyphens: auto` and
  `text-align-last: left`.

New scene files in this pass: `assets/learnsys-unembed-scene.js` and
`assets/learnsys-gauss-scene.js`. The Gauss scene uses the coloured
Flammarion engraving from the blog root and a Dawn image of Ceres, both with
visible credits and links to their Wikimedia Commons sources.
