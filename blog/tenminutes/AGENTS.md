# Ten Minutes — local agent notes

Scope: `blog/tenminutes/` is a standalone static companion to *From Nothing to
ChatGPT*. It is plain HTML + shared CSS/JS, with no PHP include, no build step,
and no package manager. The root `AGENTS.md` still applies; this file records
choices that are specific to this directory.

## Branding and page chrome

- The brand name is **ScaDS.AI Dresden/Leipzig** (not just `ScaDS.AI`).
- The topbar exists only on `index.html`. Every other page has no topbar.
- `index.html` uses `data-page="home"`. All subpages use a non-home value
  (`lesson`, `advent`, `library`).
- `assets/site.css` enforces this:
  ```css
  body:not([data-page="home"]) { --tm-topbar: 0px; }
  body:not([data-page="home"]) .topbar { display: none; }
  ```
- Consequence: subpages have no theme toggle. The saved theme from
  `localStorage` still applies; do not add a second toggle just on subpages
  unless the design decision is revisited.
- Do not paste the topbar back into a subpage. If a new page needs navigation,
  solve it explicitly; the current design deliberately removes the chrome.

## Colour palette

These are the only accent colours. Do not introduce new accent hues.

### Standard

| Name | HEX | RGB |
|---|---|---|
| Black | `#000000` | `0/0/0` |
| Dark Blue | `#004b6f` | `0/75/111` |
| Green | `#63a44b` | `99/164/75` |
| Blue | `#1275ac` | `18/117/172` |
| Teal | `#009299` | `0/146/153` |

### Research areas / Living Lab

| Name | HEX | RGB |
|---|---|---|
| Lilac | `#9185be` | `145/133/190` |
| Light Blue | `#5c9baf` | `92/155/175` |
| Grey | `#92a19a` | `137/152/145` |
| Light Green | `#869b55` | `134/155/85` |
| Yellow | `#9f9700` | `159/151/0` |

Paper, card, muted text, and near-black are neutrals, not brand accents. They
stay because they carry the editorial reading surface and contrast. In
particular, `--tm-muted` remains `#627476` so small text stays readable.

## Design tokens

`assets/site.css` is the source of truth. The important tokens:

| Token | Light | Dark | Role |
|---|---|---|---|
| `--tm-paper` | `#f7f3e8` | `#071a22` | page surface |
| `--tm-paper-2` | `#fdfbf4` | `#0a222c` | raised surface |
| `--tm-card` | `#fffdf7` | `#0d2a35` | cards |
| `--tm-ink` | `#000000` | `#e9f2ee` | body text |
| `--tm-ink-soft` | `#2c464d` | `#c4d8d6` | secondary text |
| `--tm-muted` | `#627476` | `#9db5b5` | muted prose |
| `--tm-faint` | `#92a19a` | `#92a19a` | faint labels |
| `--tm-petrol` | `#004b6f` | `#5c9baf` | primary links |
| `--tm-petrol-deep` | `#000000` | `#000000` | deep surfaces |
| `--tm-petrol-mid` | `#009299` | `#009299` | teal mid-tone |
| `--tm-blue` | `#1275ac` | `#009299` | hover / secondary |
| `--tm-sky` | `#5c9baf` | `#5c9baf` | light-blue accent |
| `--tm-green` | `#63a44b` | `#869b55` | signal green |
| `--tm-green-deep` | `#004b6f` | `#63a44b` | readable green-family text |
| `--tm-lime` | `#869b55` | `#869b55` | light-green highlight |
| `--tm-gold` | `#9f9700` | `#9f9700` | yellow highlight |
| `--tm-coral` | `#9185be` | `#9185be` | lilac accent |

Notes:

- The palette has no red. `--tm-coral` is therefore the **lilac** accent; it is
  used for warnings and alternative highlights. Keep the token name to avoid
  churn, but remember the value is lilac.
- In light mode `--tm-green-deep` is Dark Blue on purpose: `#63a44b` and
  `#869b55` do not have enough contrast for small green text on cream.
- Light/dark values are intentionally different only where contrast requires
  it. `--tm-blue` in dark mode is Teal so it stays visible on the dark surface.

## Where colour lives

- `assets/site.css`: tokens, gradients, component styles. Prefer
  `var(--tm-*)` over hard-coded hex values.
- `assets/site.js`: `TM.colors()` reads the computed tokens. If you change a
  token, update the **fallback** in `TM.colors()` too.
- Inline/canvas colours are palette hexes and must stay in the palette:
  - `intuition.html`: meadow, token, embedding, and attention colours.
  - `embeddinglab.html`: relation colours and the point cloud.
  - `transformer.html`: attention-scene colours.
  - `tokenizerlab.html`: token palette.
  - `library.html`: `style="--part-color:#…"` dots.
  - `attentionlab.html`: attention heatmap.
- Chart palettes must keep enough distinct slots. If an array has eight
  entries, use eight different palette colours rather than repeating one.
  Current useful set: Green, Light Blue, Yellow, Lilac, Light Green, Blue,
  Teal, Grey.
- No CDN colours, no external font/colour services, no build step.

## Calendar conventions (`advent.html`)

- The calendar has exactly **31 doors**: `id="day-1"` … `id="day-31"`.
  `data-day`, `.dc-num` (zero-padded), and the `id` must agree.
- Compact doors use:
  ```html
  <a class="day-card is-available" id="day-4" href="tokenizerlab.html"
     data-day="4" data-slug="tokenizerlab">
  ```
  They carry the green top bar, `Open compact →`, and feed the local progress
  counter.
- Original-lesson doors link to `../<lesson>.php` and have no `data-slug`.
- Every card keeps a hidden `<span class="dc-today">`; the script reveals it in
  December.
- Current arc, keep it coherent if you reorder:
  1. The Idea (1–5): prediction, history, language, tokens (4), embeddings (5)
  2. Failure and Learning (6–11): hallucination (6), smallest learner,
     dreams, overfitting, depth, nonlinearity
  3. Data, Senses, and Practice (12–17)
  4. Inside the Transformer (18–22): attention, context, position, facts,
     transformer (22 ≈ 70 %)
  5. From Model to Assistant (23–27)
  6. The Larger Questions (28–31)
- Deliberate merges / omissions:
  - `minimalneuron.php` represents the old “smallest network” and
    “watch it learn” pair. Do not re-add `traininglab.php` as a separate door
    unless the calendar gets a different structure.
  - `people_of_ai.php` is the final “People and the Map” door; the Atlas stays
    linked in the “After December” feature strip rather than as its own door.
  - `agents.html` exists but is intentionally not in the calendar.
- If the compact-door count changes, update the “x of 31 doors” and
  “compact lessons open” pills in `index.html`.

## Validation

The blog validators are built around lesson `.php` files and the main blog's
shared JS; they do not render or validate these standalone HTML pages. Before
finishing, run these light checks:

1. `node --check assets/site.js`
2. Check inline scripts, for example by extracting each inline `<script>` to a
   temporary `.js` file and running `node --check` on it.
3. Check HTML tag balance and that every `href` target exists.
4. `git diff --check` to catch whitespace errors.

The pages are static; there is no compile, test, or deploy step in this
directory.
