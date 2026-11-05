# Ten Minutes — local agent notes

Scope: `blog/tenminutes/` is a standalone companion to *From Nothing to Large
Language Models*. Every page is an HTML document served as `.php`; `index.php`
embeds the calendar, and `bootstrap.php` adds the date-gated full-lesson links.
There is no build step and no package manager. The root `AGENTS.md` still
applies; this file records choices that are specific to this directory.

## Typography and scads.ai visual match

The Ten Minutes pages follow the public scads.ai theme, not the standalone
`asanai.scads.ai` site and not the blog's Lingua Franca stack.

- Body and prose: **Open Sans 300**, 18px / 30px, self-hosted from
  `assets/fonts/open-sans-v40-latin-*.woff2`.
- Headings and display type: **Barlow 700**, self-hosted from
  `assets/fonts/barlow-*.woff2`.
- UI labels and buttons: Open Sans.
- Surfaces are square: no rounded cards or buttons. Cards are white with thin
  borders and a subtle hover shadow.
- Primary buttons are square, green `#63a44b` or dark blue `#004B6F`, with
  white text.
- The calendar landing page starts with the intro text and the calendar, with
  no hero title or title band, and sits on `#ffffff` in light mode. `advent`
  and `library` pages sit on `#F9F9F9`.
- Do not switch back to Lingua Franca / system-ui / Source Serif 4 without
  checking against the live scads.ai theme.

## Branding and page chrome

- The brand name is **ScaDS.AI Dresden/Leipzig** (not just `ScaDS.AI`).
- Internal links are extensionless (`intuition`, `advent`, `library`); Apache
  rewrites them to the matching `.php`. Do not add `.php` or `.html` to
  internal hrefs.
- No Ten Minutes page uses the topbar. `index.php` uses
  `data-page="calendar"` and is full-width; subpages use `lesson`, `advent`, or
  `library`.
- `assets/site.css` keeps the old guard anyway:
  ```css
  body:not([data-page="home"]) { --tm-topbar: 0px; }
  body:not([data-page="home"]) .topbar { display: none; }
  ```
- Consequence: there is no theme toggle anywhere. The saved theme from
  `localStorage` still applies; do not add a second toggle unless the design
  decision is revisited.
- Do not paste the topbar or the old home footer back in. If a new page needs
  navigation, solve it explicitly; the current design deliberately removes the
  chrome.

## Full lessons are linked outside December 2026

The original lesson pages (`../*.php`) are private source material during the
calendar month, but the compact pages link to the relevant full lessons outside
it:

- From 1 December 2026 through 31 December 2026, no full-lesson link is shown.
- Before 1 December 2026 or after 31 December 2026, `bootstrap.php` injects a
  `.full-article` block at the end of every `data-page="lesson"` page.
- `globals.php` is the single source of truth: `TM_BLOG_BASE` (currently
  `https://asanai.scads.ai/blog`) and `TM_FULL_LESSON_MAP` map each compact slug
  to one or more relevant full lessons. Add a new compact page to the map.
- The block links to `TM_BLOG_BASE . '/' . full-slug . '.php'` with
  `target="_blank" rel="noopener"` and `?lang=de` on German pages. It does
  not link the full blog home.
- `bootstrap.php` is auto-prepended through `.htaccess` / `.user.ini`;
  `bootstrap.php` and `globals.php` are denied to the web.
- `?date=1.12.2026` or `?datum=1.12.2026` simulates the calendar month; use
  `1.1.2027` for the post-calendar state.
- Compact pages still do not link to the full lesson in their prose. The only
  generated full-lesson links are in the end-of-page block.
- Compact pages must be self-contained. The library’s non-compact cards are
  non-clickable reference entries, not links.
- `index.php`, `advent.php`, and `library.php` only navigate to compact
  extensionless pages and assets.

## Bilingual pages (`?lang=de` / `?lang=en`)

- English is the default. `?lang=de` or `?lang=en` switches the page; the choice
  is stored in the `tm_lang` cookie and `localStorage`, and internal links keep
  `?lang=de`.
- One HTML tree per page, with German strings in `lang/de/<slug>.php`
  (`texts`, `attrs`, `blocks`, `title`, `description`). Shared UI strings live
  in `lang/de/shared.php`; calendar cards and section labels in
  `lang/de/calendar.php`.
- `bootstrap.php` injects the dictionary as `#tm-i18n` JSON and loads
  `assets/i18n.js`. The script translates text nodes, selected attributes, and
  dynamically generated demo DOM; it skips `script`, `style`, `code`, `pre`,
  `math`, `[data-tex]`, and `.full-article`.
- Use informal **du** consistently in German: “Klicke”, “Nutze”, “du siehst”.
  Do not switch to “Sie” or impersonal “man” inside a page.
- Keep established ML jargon in English: Token, Attention, Embedding,
  Transformer, Prompt, Agent, Fine-Tuning, Feature Map, Residual Stream, Head,
  Logits, Sampling, Top-p, Context Window, Query/Key/Value, Softmax, Loss,
  Batch, Gradient, Epoch, Overfitting, Underfitting, Pretraining,
  Post-Training, Self-Attention. Translate the surrounding sentence, not the
  technical noun.
- The full-article block is translated server-side; its links carry
  `?lang=de`. `TM_FULL_LESSON_TITLES_DE` must cover every full-lesson slug used
  by `TM_FULL_LESSON_MAP`.

## Bilingual demo content

The static prose is only half of the translation. Every demo must be checked in
both languages, including the strings its JavaScript builds at runtime.

- **Static text** lives in `lang/de/<slug>.php` (`texts`, `attrs`, `blocks`).
  **Runtime text** must be localised in the code that creates it.
  - `assets/demos.js` has `DEMO_DE`; use it for demo data and messages.
  - Page-local demos use `DE = TM.lang() === "de"` and a `DE ? ... : ...`
    branch. Do not use `document.documentElement.lang` while the page script is
    starting: `i18n.js` sets that attribute later.
- **Localise demo data, not just labels.** Examples, candidate words, sentences,
  captions, statuses, readouts, tooltips, aria-labels, canvas labels, axis text,
  and branch alternatives all need an English and a German version. Keep proper
  paper titles, code identifiers, and technical terms in English.
- **Keep the dictionary key and the English source string in sync.** When you
  edit an English string in HTML or JS, update its German key in the same edit.
  A tag inside a text node splits it; either use a `blocks` entry for the whole
  element (`innerHTML`) or keep tags out of the node. A silently unmatched key
  falls back to English.
- **Generated language must be grammatical.** For German, store the article,
  gender, and relative pronoun with each noun (for example
  `ein Drache, der`, `eine Prinzessin, die`, `ein Schloss, das`). Test every
  reachable combination of noun, relative pronoun, modal, negator, action, and
  punctuation, not one random path.
- **Branching demos need real alternatives at every position.** An alternative
  must be semantically or grammatically possible at that slot and must open a
  different plausible path. Do not use placeholders, `?`, or branches that
  cannot continue.
- **Dynamic formulas** use Temml: set `data-tex`, remove
  `data-tex-rendered`, then call `TM.typesetMath(el.parentNode)`.
  `TM.typesetMath(root)` queries descendants, so the root element itself is
  skipped. Every new display equation carries two levels of `\underbrace`.
- **Canvas and SVG demos** must read colours from `TM.colors()` or palette
  tokens, redraw on `tm:theme`, and cap oversized diagrams. A 3×3 logic or
  convolution plot should not grow to the width of a full column.
- **Bars and fills** must be block-level (`display: block`); an inline `<span>`
  ignores the width assignment and the bar looks empty.

## Paragraph layout

`assets/site.css` is the single source of truth for text layout.

- Long-form prose is justified with `hyphens: auto`; the last line stays left
  (`text-align-last: left`). Do not justify headings, buttons, chips, or short
  UI labels.
- `.prose > p` has a clear `1.5em` bottom margin. Consecutive paragraphs in
  other long-form containers get extra top spacing. Keep the visual break
  obvious; do not collapse it back to browser defaults.
- When adding a new text container, include it in the justification selector
  group in `assets/site.css` instead of adding a one-off rule.

## History content and imagery

The compact history page is a summary of `../history.php`; read the parent and
the primary source before rewriting it.

- Do not assert a simplification the sources do not support. Name the
  uncertainty (for example disputed dates, interpretations, or `not settled`)
  and explain jargon before using it (`prior`, `frame problem`, `backprop`).
- Keep wording in flow: each paragraph should follow from the previous one, not
  read as a list of facts. Replace metaphors that imply inevitability or a
  single cause (for example “fuse”) with a neutral description of the
  accumulated developments.
- A timeline node has `date`, `name`, `era`, `title`, `text`, `img`, `alt`, and
  `cap`. Adding or removing a node requires updating the “turning points”
  count in the section kicker and the demo title.
- Every timeline image needs an `assets/image-credits.json` entry and a caption
  with the same author, licence, and source link. Every static figure needs a
  visible `<figcaption>` with a source link and a licence keyword.
- Prefer Wikimedia Commons images with a verified licence. If the parent page
  has an unlicensed image, do not copy the problem: find a licensed equivalent
  or omit the image. Never invent a licence, author, or source.

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

Paper, card, muted text, and near-black are neutrals, not brand accents. In
light mode the page and card surfaces are pure white (`#ffffff`); borders and
shadows carry the separation. `--tm-muted` remains `#627476` so small text
stays readable.

## Design tokens

`assets/site.css` is the source of truth. The important tokens:

| Token | Light | Dark | Role |
|---|---|---|---|
| `--tm-paper` | `#ffffff` | `#071a22` | page surface |
| `--tm-paper-2` | `#ffffff` | `#0a222c` | raised surface |
| `--tm-card` | `#ffffff` | `#0d2a35` | cards |
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
  - `intuition.php`: meadow, token, embedding, and attention colours.
  - `embeddinglab.php`: relation colours and the point cloud.
  - `transformer.php`: attention-scene colours.
  - `tokenizerlab.php`: token palette.
  - `library.php`: `style="--part-color:#…"` dots.
  - `attentionlab.php`: attention heatmap.
- Chart palettes must keep enough distinct slots. If an array has eight
  entries, use eight different palette colours rather than repeating one.
  Current useful set: Green, Light Blue, Yellow, Lilac, Light Green, Blue,
  Teal, Grey.
- `intuition.php` 3D scene: the floor grid is drawn once by the warped grid
  loop. Do not add a second flat grid or dashed back rectangles; they double
  the lines and clutter the view.
- No CDN colours, no external font/colour services, no build step.

## Compact-page demos

Shared demo code lives in `assets/demos.js`; pages with a demo include it
after `assets/site.js`. The markup is keyed by `data-demo`:

- `sampling` — temperature / top-p probability bars and a live draw
- `decoding` — greedy / top-k / top-p / min-p decoding studio
- `predict` — autoregressive next-token loop with branching context
- `linefit` — weight/bias line fitting with real gradient steps
- `perceptron` — trainable 2-D decision boundary
- `gradient` — gradient descent on a loss landscape + loss curve
- `optimizer` — SGD / momentum / Adam race on a shared loss surface
- `polyfit` — polynomial degree, true curve, train/test gap
- `activation` — ReLU / tanh / sigmoid / GELU plots
- `datamix` — training-corpus composition
- `filter` — quality filtering of a document stream
- `convolution` — kernel / feature-map grid
- `visionlayers` — edges → parts → objects
- `receptive` — receptive-field growth with depth and kernel size
- `vram` — model-size / precision / device calculator
- `budget` — context-window budget
- `retrieval` — keyword-overlap RAG ranking
- `ragspace` — 2-D retrieval geometry (query → nearest chunks)
- `entropy` — prompt constraints shrinking the output space
- `prompt` — prompt builder with candidate answers and sampling
- `cot` — answer-only vs step-by-step reasoning (legacy)
- `reasoning` — answer vs steps, token cost, self-consistency votes
- `timeline` — generic clickable timeline / stepper (`.tl-node` + `.tl-panel`). Optional `data-image`, `data-image-alt`, `data-image-caption`, and `data-image-link` on a node add a credited figure to the panel.
- `contamination` — benchmark score vs true skill
- `science` — pLDDT confidence + protein contact map
- `position` — positional-encoding heatmap
- `trajectory` — positional rail: one token \(+\) many positions, 2-D circle / 3-D helix
- `bend` — a layer bends space until a flat cut separates the classes
- `headbudget` — one attention head's zero-sum budget across tokens
- `waveform` — waveform + spectrogram + codec tokens
- `align` — image/text embedding alignment toggle
- `preference` — preference-pair choice for post-training
- `logitlens` — next-token distribution across layers
- `residual` — residual-stream updates across blocks
- `mary` — Mary's Room colour reveal
- `chinese` — Chinese Room inside/whole-room toggle
- `ambiguity` — one sentence, two readings
- `verify` — synthetic-media evidence-strength calculator
- `citecheck` — real vs fabricated citation spotter
- `myths` — click-to-reveal myth cards (legacy; not used in a current page)

Use the existing `.demo demo--paper` shell: `demo-head`, `demo-body`,
`demo-controls`, `demo-readout`, `demo-insight`, `demo-foot`. Canvas demos use
`.demo-canvas` plus `.demo-canvas--sm|md|lg` for height, read colors through
`TM.colors()`, and re-render on `tm:theme`. Keep every demo inside the paper
theme unless there is a specific reason not to.

## Arrow-key navigation

`assets/site.js` installs one global keydown handler for demos marked
`data-arrow-nav`. Put `data-arrow-prev` and `data-arrow-next` on the demo's
step buttons. When one or more such demos are visible, Left/Right click the
button of the demo with the largest visible fraction; the topmost demo wins
ties. Form fields are ignored. Use this mechanism instead of adding a local
`keydown` handler. Timelines use it for their scroll buttons; the
space-curvature demo uses it for its step buttons.

## Calendar conventions (`advent.php`)

- `index.php` embeds the calendar between `<!-- CALENDAR:START -->` and
  `<!-- CALENDAR:END -->` in `advent.php`, so the doors have one source of
  truth. Keep those markers.
- Before 29 November 2026 every door is visible. On 29 and 30 November 2026
  the start page replaces the grid with a `.calendar-notice` saying that Day 1
  opens on 1 December. From 1 December 2026, day N opens on 1 December +
  (N - 1) days; future doors become dashed `.is-locked` cards with a `?`
  placeholder and no link. `index.php?date=1.12.2026` or
  `index.php?datum=1.12.2026` simulates a date for testing.
- A week label whose first day is still locked is reduced server-side to
  “Section N · Locked · Opens on <date>”, so the section theme is not revealed
  early but the unlock date stays visible.
- The calendar has exactly **31 doors**: `id="day-1"` … `id="day-31"`.
  `data-day`, `.dc-num` (zero-padded), and the `id` must agree.
- Compact doors use:
  ```html
  <a class="day-card is-available" id="day-4" href="tokenizerlab"
     data-day="4" data-slug="tokenizerlab">
  ```
  They carry the green top bar, `Open lesson →`, and feed the local progress
  counter. The day cards do not show duration or math-level tags.
- Every card keeps a hidden `<span class="dc-today">`; the script reveals it in
  December.
- Current arc, keep it coherent if you reorder:
  1. The Idea (1–5): prediction, history, language, tokens (4), embeddings (5)
  2. Failure, Data, and Learning (6–11): hallucination (6), training data (7),
     smallest learner (8), generalization (9), nonlinearity (10), depth (11)
  3. Senses and Signals (12–15): vision (12), inceptionism (13), multimodal (14),
     speech/audio (15)
  4. Inside the Transformer (16–20): attention (16), context (17), position (18),
     facts (19), transformer (20 ≈ 65 %)
  5. From Model to Assistant (21–27): sampling, fine-tuning, RAG, prompt,
     reasoning, running locally, evaluation
  6. The Larger Questions (28–31): society (28), AI for science (29),
     philosophy (30), people (31)
- Deliberate merges / omissions:
  - `minimalneuron.php` represents the old “smallest network” and
    “watch it learn” pair. Do not re-add `traininglab.php` as a separate door
    unless the calendar gets a different structure.
  - `people_of_ai.php` is the final “People and the Map” door. The Atlas is not
    linked from this directory.
  - `agents.php` exists but is intentionally not in the calendar.
- If the compact-door count changes, update the “x of 31 doors” and
  “compact lessons open” pills in `index.php`.
- Every calendar door has a compact `.php` page. Compact pages are
  self-contained; the only full-lesson links are generated by `bootstrap.php`.
- A compact page uses the shared lesson skeleton: `data-lesson="<slug>"`,
  `data-page="lesson"`, a `hero--lesson`, `section-block`s with
  `section-kicker`/`section-title`/`prose`, a `keypoints` grid, an `aha` box,
  and the CTA. No topbar.
- `library.php` marks every compact page with `is-compact` and
  `data-compact="1"`, and links to the extensionless page. Update the library
  card when adding or removing a compact page.

Pages with mathematics load Temml (`../Temml-Local.min.css`, `../temml.min.js`).
`transformer.php` renders the pipeline shape line with `temml.renderToString(...)`.
`assets/site.js` exposes `TM.typesetMath()`, which typesets every `[data-tex]`
element on page init (inline math uses `data-tex-display="false"`) and falls back
to the TeX source if Temml is unavailable. Keep the fallback.

`assets/space-morph.js` is the seven-step space-curvature demo used by
`intuition.php`; `assets/chinese-room.js` is the Inuktitut Chinese Room
simulator used by `philosophy.php`. Both are plain-JS and self-initialising.

## Example content preferences

- Avoid cooking, meat, and food examples in the language lesson. The author is
  vegetarian; use the non-food ambiguity examples (telescope, flying planes,
  visiting relatives) instead.

## Sentence review (use this for every prose edit)

German uses informal **du**; imperatives are the default (“Klicke”, “Nutze”).
Read every sentence on its own, then in its paragraph, and fix it in this order:

1. **Fact.** Is the claim true and supported by the parent lesson or primary
   source? If not, rewrite or remove it; never keep a nice sentence that makes
   an unsupported simplification, causal claim, or equivalence.
2. **Grammar and clarity.** Check subject–verb agreement, article/gender/case,
   relative pronouns, tense, and unambiguous references. A sentence that needs
   a second read is not finished.
3. **Flow.** Does it follow from the previous sentence? Does the paragraph make
   one argument? Split, merge, or reorder if it reads as a list of facts.
4. **Translation.** Translate the idea, not the English syntax. Rebuild German
   word order, split long sentences, and avoid calques such as “wiegen” for
   *weigh*, “Adresse” for *address*, or “konditioniert auf” for *conditioned on*.
5. **Metaphor and tone.** Keep a metaphor only when it explains something that
   would otherwise be harder to see. Remove metaphors that imply inevitability,
   a single cause, or a hidden agent (“Zündschnur”, “handgebaut”, “Maschinerie”,
   “ultimative Indirektion”, “reduktiv”). “Not X but Y” is allowed only when the
   surrounding text gave the reader a reason to believe X.
6. **Uncertainty.** Name disputed dates, interpretations, and causal claims:
   “umstritten”, “nicht gesichert”, “eine Lesart”, “die Quellen entscheiden das
   nicht”. Never present a contested simplification as settled fact.
7. **Technical terms.** Established ML jargon stays English (see the list in
   “Bilingual pages”). Translate the rest of the sentence fully; do not produce
   halfway-German syntax.
8. **Demo data.** Localise examples, candidate words, sentences, captions,
   statuses, readouts, tooltips, aria-labels, and canvas text. Code, paper
   titles, proper names, and technical terms may stay English.
9. **Record the review.** In the page’s `*_todo.txt`, remove the fixed item and
   write one line saying what was wrong and what it is now. Add a self-critique
   when the new sentence is still a simplification or a judgement call.

## Prose style: no filler contrasts

State the claim positively. Most “X is not Y” sentences do real work: they name
a default the reader holds and replace it. Keep those. Cut the sentence that
denies a claim nobody made, merely upgrades the text's own simplification, or
dresses a plain point in metaphor.

**Keep: the negation is load-bearing.** The test: has the surrounding prose
given the reader a reason to hold the negated view, or does the positive claim
depend on rejecting it? If yes, the contrast is content.

- “The key takeaway when studying distributions is not to memorize them, but to
  understand how large datasets behave.” (corrects “studying = memorizing”)
- “Alignment is not one technique; it is a family of problems …” (rejects the
  expectation of a single method)
- “Depth is not just ‘more capacity’ […] it is the composition budget.”
- “A vector is not a ‘list of numbers’. A vector is an *element* of a vector
  space.”
- “The model is not lying; it is completing a pattern.” (the negation is the
  lesson)
- “Generative models now produce 3D and video, not just stills.” (adds scope)

**Cut: the negation is a straw man, a heading, an upgrade of the text's own
simplification, or decoration.**

- “The checklist is not a bureaucratic ritual.” (nobody accused it)
- A heading like “Data is not just Numbers; it is a Distribution”.
- “This landscape is not flat; it is a jagged mountain range of probabilities.”
- “The point is not X; it is Y” when X was never on the table.
- “It is worth …”, “Notice that …” when the sentence only flags that a point is
  coming.

**Page announcements** are fine when they give a roadmap. They are filler when
they only re-label the topic (“This page is about alignment”).

To list candidates for review, run:

```bash
grep -rniE '\b(is|are|was|were) not\b|\bnot (just|only|merely)\b|this page (is|asks|gives|traces|turns|shows)' blog/tenminutes/*.php
```

## Prose style: dashes, paragraphs, flow

- **No em dash or en dash in lesson prose.** Use a comma, a colon,
  parentheses, or two sentences. Keep the hyphen only in compounds and numeric
  ranges.
- **Keep paragraphs short.** One idea per paragraph, usually three to six
  sentences. Start a new paragraph when the idea changes.
- **Group related sentences.**
- **Keep the argument in flow.** Each paragraph should connect to the one before
  it.

## Image credits (`history.php`)

`assets/image-credits.json` is the local source of truth for the history
timeline images. The page does **not** load `literature.js`; the manifest copies
the author, license, and source URL, and entries with a `literatureKey` are
cross-checked against the bibliography by the test below. Every timeline image
needs a manifest entry and a caption with the same author, license, and source
link. Static figures need a visible `<figcaption>` with a source link and a
license keyword. Original diagrams are credited as `Ten Minutes` with a local
source link and a CC BY-SA 4.0 licence.

## Demo audit (run for every page)

A page is not finished when it renders. For every page with `data-demo` or an
inline demo:

1. Run `python3 blog/tools/check_all.py --fast` and
   `python3 blog/tests/tenminutes_image_credits_test.py`.
2. Open the page with `?lang=de` and `?lang=en` at desktop width and at a narrow
   mobile width (about 390 px). Check:
   - no `pageerror` or console error;
   - `document.querySelectorAll('[data-tex]:not([data-tex-rendered="1"])').length === 0`;
   - `document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1`;
   - every visible `[data-demo]` has initialised (required canvases/lists are non-empty);
   - computed prose style is `text-align: justify` and `text-align-last: left`.
3. Exercise every control once, not just the initial state: chips, sliders,
   presets, sample/step buttons, timeline nodes, and kernel/objective switches.
   Check that labels, readouts, captions, status text, `aria-label`s, and canvas
   text switch language with the page.
4. For demos that generate text from slots, enumerate all reachable combinations
   and assert grammar and article/relative-pronoun agreement for German.
5. For branch/tunnel demos, assert that every non-final position offers at
   least one meaningful alternative and that no branch is dead or nonsensical.
6. For bar/fill demos, assert that at least one fill has a computed width above
   zero. For formula demos, assert that changing a control changes `data-tex`
   and that a rendered `<math>` exists afterwards.
7. Search the German page for untranslated English prose. Technical terms,
   code identifiers, and proper paper titles are allowed; English sentences in
   demo data, statuses, captions, or notes are not.

Possible automated browser helper: use Playwright, wait for `load`, run the
checks above, then click the demo controls and repeat. The same audit must run
for both languages; a page that only looks right in English is not finished.

## Validation

The blog validators are built around lesson `.php` files and the main blog's
shared JS; they do not render or validate these standalone HTML pages. Before
finishing, run:

1. `python3 blog/tools/check_all.py --fast` (from the repository root). When a
   top-level lesson, fact file, statement ledger, `literature.js`, or the search
   chunker changed, run the full `python3 blog/tools/check_all.py` instead and
   commit the regenerated `blog/.search_cache.json`, `blog/semantic_index.json`,
   `blog/semantic_vectors.bin`, and `blog/rag_data/*` files.
2. `python3 blog/tests/tenminutes_image_credits_test.py` — checks the history
   image credits against `assets/image-credits.json` and cross-checks entries
   with a `literatureKey` against `literature.js`. Every static figure also
   needs a source link and a licence keyword in its caption.
3. `php -l` every changed `.php`; `node --check` every changed JS file and every
   extracted inline `<script>`; `git diff --check` for whitespace.
4. Run the demo audit above in both languages, including the control clicks and
   generated-text/branch checks.

If `check_all.py` reports a stale statement ledger or index, regenerate only
the affected part, then commit it:

```bash
uv run blog/tools/factcheck/extract_statements.py blog/ --only <slug>
uv run blog/tools/build_semantic_index.py
uv run blog/tools/build_rag_index.py
```

The pages are static; there is no compile, test, or deploy step in this
directory.
