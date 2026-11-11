# Ten Minutes LearnSys

LearnSys is the reading and demo layer for Ten Minutes. It is deliberately
small in DOM and large in contract: a day is a list of steps, a step has a
short main text, deeper questions live in compact collapsible blocks, and a
demo changes only the objects that actually change.

Files:

- `learnsystest.html` — the prototype shell and the day/step data.
- `learnsys.js` — the engine, the public API, and the built-in demos.
- `spacemorph_demo.html` — the most complex demo (MLP bends space), embedded
  as a self-contained iframe.
- `todo_learningsystem.md` — the working checklist.

## Mental model

- **Day**: one self-contained lesson block. Days are grouped by a track
  (`idea`, `failure`, `senses`, `transformer`, `assistant`, `questions`).
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

## Day rail

The bottom bar always contains every day:

- all days are rendered, even when a track is selected; the track is a lens
  that dims the other days, not a filter that hides them;
- days grow to fill the width when they fit (about 76 px minimum); a longer
  arc scrolls, with edge fade, snap, drag, and wheel support;
- active day: filled green, white text, `aria-current="step"`, plus a
  track-colour top stripe;
- clicking a dimmed day jumps to it and moves the lens to its track;
- `← Zurück` and `Weiter →` move one day back/forward and are disabled at the
  ends;
- `Home` / `End` jump to the first/last day;
- the active day is centred after a change;
- the bar uses `auto` height and a safe-area bottom padding, so day labels are
  never clipped.

## Mobile

- The controls wrap and the day rail scrolls horizontally.
- `Demo groß` hides the text column and gives the demo the full stage.
- Canvases use `touch-action: none` where dragging matters.
- The text column keeps its own vertical scroll; the stage does not jump.
- The font control is available in the top bar.

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

Personas exercised by the browser suite:

- **Hurried**: compact depth, short body, depth door still visible, all days
  one tap away.
- **Deep**: every day and step, real context/deep/formula boxes, `Alles`
  opens all details, at least one maths box per walk.
- **Returner**: day, step, depth, and font survive a reload.
- **Backtracker**: bottom `← Zurück` reaches previous days, disabled at the
  first day, re-enabled after moving forward.
- **Mobile**: no horizontal overflow, rail on screen, wheel reaches later
  days, focus mode works.
- **Glossary user**: hover tip, click tip to open the note, click term to
  toggle, navigation removes stale tips.

Both must pass before a demo migration is considered finished. The browser
test serves `blog/` locally and drives `learnsystest.html` with headless
Chromium.
