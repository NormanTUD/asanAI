# LearnSys Style Guidelines

Scope: every page that uses `learnsys.css` / `learnsys.js`, including
`intuition_learnsys.php` and every later conversion. These rules are the
visual contract. If a demo looks different from the rest, the demo is wrong,
not the guideline.

The goal is not "a dashboard". It is a calm, precise, slightly luxurious
reading instrument: paper, hairlines, one accent at a time, data as ink, and
a demo that feels like it was drawn by hand for this one sentence.

## 1. The feeling

- **Quiet confidence.** White paper, deep petrol ink, one green signal.
- **Air.** Generous negative space around text and around the canvas. If a
  block feels crowded, remove a border before removing space.
- **Precision.** Hairlines, exact alignment, tabular numbers, labels in small
  caps. Every element sits on the same grid.
- **One idea per screen.** The text says one thing; the demo shows that one
  thing. Deep material is one click away, never in the way.
- **A living surface, not a card.** The canvas is a stage on paper with a
  faint aurora behind it. It is not a rounded widget in a box.
- **Motion is punctuation.** 120–240 ms, ease-out, no bounce, no decoration.
- **No chrome for chrome's sake.** No topbar, no floating panels, no
  unnecessary badges. Navigation lives at the top of the text column.

## 2. Layout

```
┌────────────────────────────────────────────────────────────┐
│  text column (37 %)                 │  demo stage (63 %)    │
│  kicker · title · 3–5 sentences    │  stage head           │
│  watch · depth door · next         │  canvas (fills)       │
│                                     │  stage foot           │
└────────────────────────────────────────────────────────────┘
```

- Text column: `minmax(330px, 37%)`, inner max `680px`.
- Stage: `minmax(0, 1fr)`, fills the remaining width and the viewport height.
- Text scrolls inside its own column. The stage never jumps when text grows.
- At `≤ 980px`: one column, text above stage, roughly `44% / 56%`.
- At `≤ 640px`: compact chrome, smaller title, no horizontal overflow.
- The stage has a fixed visual frame; the canvas is measured with
  `ResizeObserver` / `fitCanvas`, never with a hard-coded height.
- Minimum canvas size: `320 × 240` logical pixels. Mobile may be taller, not
  wider.

## 3. Typography

| Role | Face | Size | Line | Details |
|---|---|---|---|---|
| Kicker | Barlow 700 | 10 px | 1.2 | uppercase, `letter-spacing:.13em`, petrol |
| Page/step title | Barlow 700 | `clamp(26px,2.9vw,42px)` | 1.02 | tracking `-.025em`, `text-wrap:balance` |
| Main body | Open Sans 300 | `clamp(16px,1.15vw,18px)` | 1.65 | soft ink, max `64ch`, left aligned |
| Watch line | Open Sans 300 | `13px` | 1.55 | green micro-label above |
| Depth summary | Barlow 700 | `11–12px` | 1.25 | square, hairline rule, `+`/`−` |
| Depth body | Open Sans 300 | `16–17px` | 1.65 | max `62ch` |
| Demo micro-label | Open Sans 600 | `9–10px` | 1.2 | uppercase, tracking `.1em`, muted |
| Demo readout number | Barlow 700 | `16–20px` | 1.0 | tabular, ink |
| Canvas label | Open Sans 600 | `10–12px` | 1.2 | never smaller than 9 px |
| Source / credit | Open Sans 400 | `10–12px` | 1.45 | muted, links petrol |

Rules:

- Body copy in the step column is **left aligned** with `text-wrap: pretty`.
  Long prose inside depth boxes may justify with `hyphens:auto` and
  `text-align-last:left`.
- No em dash or en dash in lesson prose. Use comma, colon, parentheses, or a
  second sentence.
- No all-caps sentence. Uppercase is reserved for micro-labels.
- Numbers in readouts and axes use `font-variant-numeric: tabular-nums`.
- Do not scale text below 9 px on canvas. If it does not fit, abbreviate or
  move the label outside the canvas.
- Use `--ls-fs-body`, `--ls-fs-title`, `--ls-fs-small` for reader-controlled
  size. Never hard-code a second font-size system.

## 4. Colour

Only these tokens. No new accent hue.

| Token | Value | Use |
|---|---|---|
| `--ls-ink` | `#000000` | primary text, axes, active numbers |
| `--ls-soft` | `#2c464d` | body text, secondary labels |
| `--ls-muted` | `#627476` | captions, ticks, inactive chrome |
| `--ls-petrol` | `#004b6f` | interaction, links, selected chrome |
| `--ls-blue` | `#1275ac` | hover, secondary interaction |
| `--ls-green` | `#63a44b` | signal, success, active, "this is the point" |
| `--ls-lime` | `#869b55` | light-green highlight, warm secondary data |
| `--ls-gold` | `#9f9700` | alternatives, ambiguity, attention, warning |
| `--ls-lilac` | `#9185be` | context, "one level deeper", alternative reading |
| `--ls-sky` | `#5c9baf` | temperature, air, light secondary data |
| `--ls-teal` | `#009299` | very interactive / living-lab signal |
| `--ls-line` | `#dbe3e0` | hairlines on paper |
| `--ls-line-strong` | `#b9c8c3` | control borders, stronger separators |
| `--ls-paper` | `#ffffff` | page and text surface |
| `--ls-paper-2` | `#f7f9f8` | stage wash, tracks |
| `--ls-shadow` | `0 18px 50px rgba(0,0,0,.08)` | overlays only |

Semantic rules:

- Green means "the signal", not decoration. One green element per demo is
  usually enough.
- Gold is for alternatives, uncertainty, seams, and "possible but not
  chosen".
- Lilac marks context, a deeper reading, or an alternative interpretation.
- Blue is interaction. Hover and focus may use it; do not use blue for data
  that is not interactive.
- Never encode meaning by colour alone. Pair every colour with a label,
  position, shape, or readout.
- In dark mode, read colours through `TM.colors()` / `api.colors()`. Never
  hard-code light hex values in canvas code.
- Red is not in the palette. A warning is lilac + text label, not red.

## 5. Surfaces and chrome

- **Square everything.** `border-radius:0` for cards, buttons, chips, inputs,
  stage panels, canvas frames. The only circles are data points, the ball, and
  the logo mark.
- Paper stage:
  - background: `linear-gradient(180deg, rgba(255,255,255,.72), rgba(247,249,248,.62))`
  - border: `1px solid rgba(0,75,111,.10)`
  - inner light: `inset 0 1px 0 rgba(255,255,255,.75)`
  - no heavy drop shadow; the stage sits on the page.
- Behind the app: one fixed aurora wash (green/blue/lilac/teal, blurred,
  slowly drifting). It must never reduce text contrast and must be disabled
  under `prefers-reduced-motion`.
- Hairlines do the structural work. Use `1px` lines, not boxes inside boxes.
- Buttons: white/62 % paper, `1px` strong line, square, 6/10 px padding,
  `11px` Open Sans. Hover: petrol border + petrol text + 1 px lift.
  Primary: petrol fill, white text. Ghost: transparent.
- Chips: `1px` line, `9px` uppercase-ish label, square. Active: petrol fill,
  white text, a small shadow. On canvas: same look, drawn with a `1px` stroke.
- Sliders: `3px` track in `rgba(0,75,111,.10)`, `2px` green progress,
  square thumb with a white centre. Focus ring green.
- Readouts: a row of small blocks separated by hairlines, not cards.
  Label above, number below, tabular. One accent number maximum.
- No nested rounded cards. No glassmorphism except the thin nav/help overlay.
- No pure decorative icons. If an icon has no action, remove it.

## 6. The text column

- Kicker, title, body, watch, depth door, prev/next. Nothing else by default.
- The first sentence is a hook, not a recap.
- Main body: 3–5 sentences, ideally under 120 words. One idea per paragraph.
- The "watch" line tells the reader exactly what to do with the demo.
- Depth door: `Tiefer eintauchen · N Fragen`, always visible and clickable.
- Depth boxes:
  - root summary: petrol, Barlow 700, `12px`;
  - child summary: soft, Barlow 700, `11px`;
  - `+` / `−` in green;
  - content: `16–17px`, `1.65`, max `62ch`;
  - no rounded corners, no background cards; a hairline top border is enough.
- Sources live in the depth tree as a normal `<details>`, never as a floating
  panel.
- Formulas: Temml, display mode, inside a depth box. Every display equation
  gets two `\underbrace` levels; keep the outer label short.
- Terms: inline dotted underline, petrol text. Hover/focus tip; click opens
  the inline note. The tip must disappear on navigation, scroll, resize,
  focus mode, and day/step change. No stale floating card.

## 7. Canvas: the demo language

### 7.1 Frame

Every canvas demo lives in a `.ls-canvas-wrap` and uses `fitCanvas` /
`fitPair`. The canvas is transparent; the stage supplies the paper wash. Draw
only content, not another card.

```html
<div class="ls-canvas-wrap">
  <canvas class="ls-canvas" aria-label="…"></canvas>
</div>
```

- Static layer: axes, labels, frames, block stacks, images.
- Dynamic layer: bars, points, arcs, highlights, surfaces.
- A step change animates only the changed objects. A scene change may
  crossfade the whole stage for 180 ms.
- Reserve the maximum height while measuring; never let the stage jump.

### 7.2 Canvas grid and chrome

- Padding: `24–44px` depending on width; keep the same padding on all sides.
- Grid: `48px`, `rgba(0,75,111,.06)`; axes `1px` `rgba(0,75,111,.12)`.
- Micro-label: 9–10 px, uppercase, tracking `.1em`, muted.
- Readout number: Barlow 700, 16–20 px, tabular, ink.
- Axis ticks: `4px` long, `1px` muted; labels 9–10 px.
- No black canvas borders. The stage frame is the only border.
- Do not draw a second grid or decorative dotted rectangles. One grid.

### 7.3 Data marks

- Point: `4–5px` filled circle + `2px` paper ring. Hover: `7px` + blue ring.
  Selected: `8px` + green ring + 1 px outer glow.
- Line: `1.2–1.8px`; strong path `2–2.4px`. No shadow on data lines.
- Arrow: `1.6px` shaft, `7px` head. Label on a square paper pill with a
  `1px` hairline.
- Bar: track `rgba(0,75,111,.07)`, fill gradient green → sky, `14–18px` high,
  square ends. Fill must be `display:block`.
- Arc: quadratic curve, `1–10px` depending on weight, blue at low alpha.
  The active arc gets a brighter stroke, not a second hue.
- Surface/mesh: depth-sort cells; fill with the loss/attention palette; use a
  light `0.6px` paper stroke between cells, not black.
- Text in canvas: always `Open Sans` or `Barlow`; never a system serif.

### 7.4 Clickable canvas (hard rule)

Every interaction that existed in the old demo must still work, and it must be
reachable by clicking the canvas itself.

- Define explicit hit regions with a minimum of `28 × 28px` (touch: `44 × 44px`).
- On hover: change the cursor to `pointer`, draw a `1px` blue focus ring, and
  show the same label/readout as the DOM version.
- On click: update state, re-render immediately, and update an `aria-live`
  readout.
- Every canvas hit region also has a keyboard path:
  - DOM chip/button row, or
  - `tabindex="0"` + Enter/Space on a transparent button, or
  - the shared arrow-key navigation.
- Canvas must not be the only control. Screen-reader users get a compact
  control row and a live text summary.
- Drag, pan, zoom, and rotate: pointer events, `touch-action:none`, wheel
  zoom, pinch on touch. No page scroll while dragging.
- A click on empty space clears the selection; it never does nothing.

### 7.5 Demo chrome

- Controls sit below the canvas in a single row, wrap on mobile, never cover
  data.
- Control label: 9 px uppercase muted. Value: 10–11 px ink.
- One primary action per demo. Secondary actions are ghost buttons.
- Readouts go under the controls or in the stage foot. Do not scatter numbers
  around the canvas.
- The stage foot carries one sentence of interpretation and the credit.
- Every demo has an empty/initial state that already looks composed.

## 8. Motion

| Change | Duration | Easing |
|---|---|---|
| Hover / focus | 120–140 ms | ease-out |
| Step state | 180 ms | ease-out |
| Scene crossfade | 180 ms | ease-out |
| Day change | 180 ms | ease-out |
| Camera | 240 ms | ease-out |
| Text fade | 70 ms | ease-out |

- No bounce, no spring, no elastic overshoot.
- Continuous input is coalesced through `requestAnimationFrame`.
- A visible, already drawn canvas repaints immediately. Never show a loader
  on a hover/slider update.
- `prefers-reduced-motion`: instant state changes, no aurora animation, no
  view-transition.
- Do not animate layout properties. Animate opacity, transform, and canvas
  geometry only.

## 9. Depth and the hurried reader

- `short`: root closed, but `Tiefer eintauchen · N Fragen` visible.
- `standard`: root open, first context open.
- `deep`: root open, context open, remaining boxes one click away.
- `Alles`: opens every detail and sets depth to deep.
- `Tiefe öffnen`: moves one level deeper and scrolls to the door.
- The hurried reader sees a complete thought in the main text. The deep
  reader can open every source, formula, caveat, and alternative.
- No content is removed by depth; only disclosure changes.

## 10. Responsive

- `> 980px`: two columns, text 37 %, stage 63 %.
- `≤ 980px`: stacked, text `minmax(0,44%)`, stage `minmax(0,56%)`, text
  scrolls independently.
- `≤ 640px`:
  - compact navbar, arrows only, position ticks shrink but remain tappable;
  - title `calc(var(--ls-fs-title) * .86)`;
  - stage padding `6px 8px 2px`;
  - canvas labels may abbreviate; hide non-essential tick labels;
  - no horizontal scroll: `document.documentElement.scrollWidth -
    clientWidth <= 1`.
- Canvas hit targets scale with the stage, never below 28 px.
- Test at 1440, 1024, 768, 390, and 320 px width.

## 11. Bilingual

- Every visible string exists in EN and DE: titles, body, watch, box labels,
  sources, readouts, canvas labels, ticks, legends, tooltips, aria-labels,
  status messages, and generated demo data.
- Use `api.lang` (`"en"` / `"de"`). Do not read
  `document.documentElement.lang` at demo start.
- German uses informal **du**.
- Technical ML terms stay English: Token, Attention, Embedding, Transformer,
  Prompt, Logits, Sampling, Softmax, Loss, Gradient, Epoch, Fine-Tuning,
  Residual Stream, Head.
- Translate the sentence, not the syntax. Rebuild German word order.
- Number formatting: German uses comma decimals, English uses point. Labels
  and units follow the language.
- The English and German pages must have the same steps, states, and demo
  behaviour.

## 12. Accessibility and contrast

- Body text on paper: at least 4.5:1. Muted text at 12 px or smaller: at
  least 4.5:1. Large display text: at least 3:1.
- Never leave light-shell colours on a white card. In a paper demo, use ink,
  petrol, and muted. In a dark demo shell, use light text and lime.
- Focus-visible: `2px` green outline, `2px` offset. Never remove focus styles.
- All controls are native buttons/inputs or have `role` + keyboard handlers.
- Canvas has `role="img"` or `role="application"` and a useful `aria-label`.
  The live readout is `aria-live="polite"`.
- Reduced motion is honoured.
- Do not rely on hover for essential information. Hover is an enhancement.

## 13. File and code conventions

- Shared engine and chrome: `learnsys.css`, `learnsys.js`.
- Page data: `<slug>_learnsys-data.js`; page demos:
  `<slug>_learnsys-demos.js`.
- Register a demo with `LearnSys.defineDemo(name, factory, meta)`.
- A demo factory returns `{ update, resize, destroy }`; optional `getScene`.
- Use `api.colors()`, `api.lang`, `api.fit`, `api.motion`, `api.util`.
- Redraw on `tm:theme`. Recompute colours, do not cache them forever.
- No iframe demos. No CDN. No new dependency without asking.
- No inline `<style>` except a tiny page-specific rule; put shared styles in
  `learnsys.css`.
- Every canvas draw function is deterministic for a given state and size.
- Clean up `requestAnimationFrame`, observers, and window listeners in
  `destroy`.

## 14. Do / Don't

**Do**

- Let the text breathe; one idea, one demo, one accent.
- Draw the data, not a picture of a dashboard.
- Use hairlines and alignment instead of boxes.
- Make the canvas clickable and show the same readout as the DOM controls.
- Animate the object that changed, not the whole screen.
- Keep the same visual grammar across Embedding, Attention, Position, FFN,
  Residual, and Output.

**Don't**

- Don't add a second card inside the stage.
- Don't use rounded corners, pill buttons, or floating glass panels.
- Don't use red, neon, or a new accent hue.
- Don't hide the only control in a hover state.
- Don't let a demo jump in height when a label wraps.
- Don't use a white-on-white or lime-on-white readout.
- Don't translate technical terms into half-German syntax.
- Don't leave a stale glossary tip after navigation.

## 15. Definition of done (visual)

A page is visually finished when:

1. It looks like the same product as the previous LearnSys page.
2. The text column reads in 3–5 sentences per step; the depth door is
   visible.
3. Every old demo action is reachable by click, drag, slider, or keyboard.
4. Clicking the canvas gives immediate visual feedback and updates a readout.
5. EN and DE have the same layout, states, and interactions.
6. Desktop, tablet, 390 px, and 320 px have no horizontal overflow and no
   clipped labels.
7. Light and dark both have readable text, tracks, chips, readouts, and
   canvas labels.
8. `prefers-reduced-motion` produces a calm, instant interface.
9. No console error, no unrendered `$$`, no missing gloss term.
10. The page is pleasant to look at for ten minutes without a single element
    asking for attention it did not earn.
