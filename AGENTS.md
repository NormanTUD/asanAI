# asanAI — Notes for AI Agents

Stable, high-level orientation. Details change; these observations are unlikely to.
Rules are stated in the imperative. If a rule conflicts with a validator, the
validator wins — then fix the rule here.

## What this repository is

`asanAI` is one project in two parts that share a philosophy — *make machine
learning transparent by letting you see and touch it* — built in vanilla JS +
PHP, no build step, no server-side compute.

1. **The Toolkit** (repository root) — a no-code, in-browser machine-learning
   toolkit. Design a network, train it (TensorFlow.js), inspect it, export
   Python. Entry point: `index.php`. Live: `asanai.scads.ai`.
   Reference: `arXiv:2501.06226`.
2. **The Blog** (`blog/`) — *"From Big Bang to ChatGPT"*: a free digital
   textbook taking the reader from Stone Age tools through the history of math
   and machines, the math of deep learning, to how modern LLMs work. Prose
   lessons interleave interactive in-browser visualizations. Most writing work
   happens here.

Both parts are authored as **PHP templates + vanilla JS**, served statically by
Apache. No framework, no package manager, no minify/build step in the
authoring flow (no `package.json` at the root). Libraries are vendored as files
(`libs/`, `tf/`, `blog/*.min.js`) — **offline-first: never add CDN `<script>`
tags.**

## Design philosophy (the ideas, durable)

- **Show, don't tell**: every abstract claim in the textbook is paired with an
  in-browser artifact (plot, lab, 3-D scene) the reader can touch. When writing
  a lesson, prefer adding/adjusting an interactive block over more prose.
- **Everything is cited.** Prose claims, images, and even map dots carry a
  `literature.js` key or an explicit credit; the Atlas's `conf` field exists to
  make guess-vs-fact explicit. Honesty about uncertainty is a feature.
- **Meet the reader where they are**: the interests overlay, tone dials,
  math-comfort gate, learned-state progress, and plain-language twins
  (`.topic-block-alt`, `.math-alt`) exist so a curious layperson and a
  graduate student both get a good path. New content should carry the metadata
  (`topics`/`tags`/`math`/`data-mathlevel`) that lets these systems place it.
- **Progressive disclosure is structural**: collapsible `.optional` blocks,
  tuck/dim of advanced sections, keypoint cards for the impatient. Use the
  existing mechanisms; don't invent new ones.
- **The course is a graph with a spine** (`LESSON_DEPS`), not a flat list —
  prerequisites unlock content. Keep the spine honest when adding lessons.

## Repository map (what each directory is)

| Path | What it is |
|---|---|
| `*.js`, `*.php`, `css/`, `tabs/`, `php_files/`, `libs/`, `tf/` | The Toolkit app (global-function site) |
| `visualizer/` | Self-contained per-layer-type visualizers (auto-included by glob) |
| `tests/`, `run_tests`, `_run_tests.py` | Toolkit test suite (static + in-browser Playwright) |
| `blog/` | The Blog: one `<slug>.php` per lesson + shared infra |
| `blog/tests/` | Blog test suite (Python validators, Node unit tests) |
| `blog/atlas/` | Atlas 3D-map data (generated JSON) + Python pipeline |
| `blog/todo/` | **Staging** draft lessons — not part of the course |
| `blog/test/` | One-off HTML experiments/scratch — not part of the course |
| `blog/py/` | Python snippets inlined into lessons via `get_string_of_file_or_die()` |
| `blog/lndw*/`, `blog/coq/`, `blog/nanoGPT/`, `blog/llm_interpretability_papers/` | Research/working material, not served |
| `cosmo*/`, `taurus/`, `presentation/` | Kiosk/exhibition variants (standalone, don't refactor for the main site). **`cosmo_ok/` is gitignored** — local only, never commit |
| `manual/`, `manual.html`, `screens/`, `documentation/` | Toolkit docs & assets |
| `traindata/` | Toolkit dataset catalog (XOR/AND/signs + Keras configs, served) |
| `api/save_error_log.php` | The one server endpoint: Toolkit failure reports (see Guardrails) |

**Serving & URLs (blog):** `blog/.htaccess` rewrites pretty URLs —
`/slug` 301-redirects to the extensionless form and `/slug` internally
serves `slug.php`; `.search_cache.json` is denied to the web.
`blog/.user.ini` sets `auto_prepend_file = mobile-prepend.php`, which
auto-injects `mobile.css` + `mobile.js` into every page's `<head>` (deduped).
`mobile.js` handles touch-only polish (glossary tap-tooltips, drawer
swipe-close, iOS `--vh` sync). Consequence: lesson code can assume
`mobile.css` is present even on direct-access pages.

## The Blog: load & render pipeline (order matters)

1. PHP emits the page shell: theme class on `<html>`, `load_base_js()` in
   `<head>`, then the lesson body via `incl($title, $slug)` (or direct access —
   `call_js_if_matching_file_exists()` auto-loads `<slug>.js`).
2. `js()` (functions.php) dedupes script tags, cache-busts with `?v=filemtime`,
   and — if the file defines a `load…Module()` function — pushes the function
   name onto `window.__moduleLoaderQueue`.
3. **DOMContentLoaded**: `BlogSidenotes.extract()` runs **before marked.js ever
   sees the text** (marked mangles `\sidenote{…}`); then `loader_fn` runs all
   queued module loaders concurrently.
4. **window load** → `runPostLoad()` runs exactly once, in this order:
   `bibtexify()` → `renderMarkdown()` → `BlogSidenotes.finalize()` →
   `postLoadInit()` → force-load fonts (4 s hard cap) → `revealContent()`.
5. `window.dispatchEvent(new CustomEvent('blogPostLoadComplete'))`.

Durable consequences:

- `renderMarkdown()` **rewrites `.md` innerHTML** — nodes captured earlier are
  detached. Re-query after the rewrite, or hook `blogPostLoadComplete`.
- Interactive widget containers live as raw HTML **between** `.md` blocks, so
  they survive the rewrite.
- The loader stays on screen until modules + fonts are done; use
  `updateLoadingStatus(msg)` (start.js) to report progress.
- Math is protected from marked by a placeholder hook (`$…$`/`$$…$$` stashed
  and restored); currency like `$100` is left alone (no letters/backslash rule).
- Sidenote extraction runs **exactly once** (guard `window._sidenotesExtracted`);
  a second `extract()` resets the store and loses markers.

**Base JS** — `load_base_js()` loads the same core on every page:
temml, bpe (`BPETokenizer` class), start.js (`updateLoadingStatus`,
`render_temml`, `postLoadInit`), effects (scroll-reveal), prism + langs,
style.css, font override, echarts (+gl), sidenotes, literature,
citation_graph, jquery, plotly, tf, marked, toc, fcnn_visualization
(#fcnn_canvas drawing), init, cluster (Aurora color lanes), polish (heading
anchors, TOC scroll-spy, keyboard shortcuts), layout_guardrail,
math_guardrail, typography_fix, helper, master_vis, loader, three, search,
topics, keypoint, progress_tracker, then everything in `blog/modules/*.js`
(directory currently empty — dropping a file there makes it a base module).
A new cross-lesson helper belongs in one of these, not copied into lessons.

## The Blog: lesson authoring contract

Each lesson is one `blog/<slug>.php`. The shape is a contract, not a style
choice:

```php
<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Human Readable Title
description: One or two sentences shown on the course tile.
icon: &#128290;
part: 2
order: 3
color: coral
topics: math-i, programming
tags: math-heavy
math: 60
-->

<div class="md">
Prose in **Markdown**, with inline math $ax+b$ and citations
\citeauthor{rosenblatt1958perceptron} (\citeyear{rosenblatt1958perceptron}).
</div>

<!-- raw-HTML widget block BETWEEN .md blocks -->
<div id="my-plot" class="plot-container" style="height:250px;"></div>

<div class="md">
## Next section
More prose…
</div>
```

**Metadata** — `parse_course_metadata()` (functions.php) scans these blocks and
builds the drawer, the index tiles, `index_full.php`, and prev/next nav
*automatically*. Order is `[part, order]`.

| key | required | notes |
|---|---|---|
| `title` | **yes** | becomes `<title>` and `<h1>` — **never write your own `<h1>` in the body** |
| `part` | **yes** | `1`–`6`. `intro.php` is part 0: injected first by `index.php`/`index_full.php`, skipped by the scanner by name |
| `order` | strongly conventional | int within the part |
| `description` | conventional | tile blurb |
| `icon` | conventional | HTML entity `&#128290;` or raw emoji — both work |
| `color` | conventional | **must be one of the six `--mn-*` tokens**: `accent, coral, emerald, rose, sky, text-secondary` (rendered as `var(--mn-<color>)`) |
| `topics` | conventional | comma list of topic ids (feeds interest dimming) |
| `tags` | optional | tone categories: `math-heavy, code-heavy, logic-heavy, language-heavy, interested-layman` |
| `math` | optional | int 0–100, min math-comfort for full-opacity tile |
| `featured` | rare | `true` → highlighted tile |

Scanned names are skipped: `index`, `index_full`, `functions`,
`asanai_blog_proxy`, `graph`, `intro`. So: **to add a lesson, create the `.php`
with valid metadata — it appears in drawer, tiles, linear course, and nav
without touching any other file.** Remove a lesson by deleting its file
(and its `.js` if any).

**Body rules:**

- Prose is Markdown **inside `<div class="md">` blocks** — the idiom is *many
  short `.md` blocks*, not one giant one.
- Headings are Markdown (`##`/`###`/`####`) **inside `.md` blocks**; never raw
  `<h2>` in prose (a heading outside `.md` neither renders nor reaches the TOC).
- Raw HTML between `.md` blocks hosts widgets; keep it **tag-balanced**
  (php_validator stack-checks tracked tags).
- **Code blocks: house style is raw HTML**, not fences:
  `<pre><code class="language-python">…</code></pre>` (Prism highlights
  python/json; `addCopyButtons()` adds copy buttons). Markdown fences are the
  exception. Inline external code: `<?php print get_string_of_file_or_die("py/…"); ?>`.
- **Cross-references**: link sibling lessons by slug (`[The Atlas](map.php)`)
  and use raw anchors `<a id="…"></a>` + `[text](#anchor)`. The `\label{}` /
  `\index{}` machinery exists but is **dormant — do not use it**.
- **Inline `<script>` and lesson-local `<style>` blocks are accepted** for
  small glue; prefer a separate `<slug>.js` for anything substantial.

**Custom macros** (runtime-processed inside `.md`; see "Citations" below for
the cite family):

- `\marginfig{file.jpg}{caption}` — inline marginal figure (caption may cite).
- `\sidenote{…}` — marginalia; may contain `\cite`; extracted pre-markdown.
- `\sideimage[float]{file.jpg}{caption}` — sidebar image.
- `\index{term}` — glossary index term (registered for search).
- `[[t:topic]]…[[/t]]` — topic-block markers (currently unused in lessons).
- **Aurora cluster lanes** `[[c:name]]…[[/c]]` (or `[[cluster:name]]`) in `.md`
  wrap text in a softly glowing color lane; the hue is stable per name. Also
  **dormant** — no lesson uses it yet.

**Interactive blocks (raw HTML, between `.md` blocks):**

- `<div class="optional md" data-headline="Title">` — collapsible aside
  (click to expand; nested markdown is re-rendered).
- `<div class="topic-block" data-optionaltitle="…" data-mathlevel="70">` —
  interest/math-gated block that dims or tucks per reader settings. Give every
  gated block a `data-optionaltitle` **or an inner heading** (math_guardrail
  flags missing ones in debug mode). A plain-language twin can be added as a
  `.topic-block-alt` child.
- `<div class="smart-quote" data-cite="key" [data-page="…"]>` — pull quote bound
  to a bib entry; optional `.full-quote`/`.short-quote` children become a
  toggleable quote.
- **Lab lessons** (`*lab.php`) follow the same structure but center on a
  dashboard: controls bar (sliders/inputs/buttons with
  `onclick="<Class>.method('id')"`, e.g. `onclick="TrainLab.toggleTraining(…)"`),
  Plotly `div.plot-container` targets, data tables, and a live "math monitor".
  They **always** ship a `<slug>.js`.
- **3-D canvas labs** (three.js, e.g. `math_iv_affine.js`): follow the
  conventions enforced by `lesson_guard.py` — no `*-auto` checkbox is
  `checked` by default (labs start still); every 3-D canvas is wired to
  `bind3DNav` (wheel/pinch zoom + touch rotate) **and** `drawAxes3D`; when
  mapping 2-D grid coordinates into 3-D quads, destructure the pair
  (`cs.map(([u, v]) => …)`) — a bare `cs.map(fn)` passes the point array as
  `u` and NaNs every quad.

**Lesson JS modules:**

- `<slug>.js` is optional; if present and it defines `function load…Module()`
  (any name matching `load\w+Module`, conventionally descriptive:
  `loadTrainingModule`, `loadMathLabModule`), it is queued and run at
  DOMContentLoaded. Label for the loader checklist comes from the `incl()`
  headline or the `updateLoadingStatus("Loading section about …")` string.
- Heavy canvas work should lazy-init via IntersectionObserver (pattern:
  `_mnLazyRegister` in minimalneuron.js) — don't build every plot at load.
- Use `lazyInit(sectionId, initFn)` (helper.js) for scroll-triggered init.
- **Never call `Plotly.resize()` on a `display:none` plot** (throws) — the
  lazy-init observer re-renders on reveal instead.

**Images:**

- Local images live in `blog/`. Only reference files that exist.
- Dominant pattern: `<figure><img src="file.jpg" alt="…">
  <figcaption class="md">…\cite[Credit]{key}…</figcaption></figure>` — the
  `class="md"` on `<figcaption>` is what makes markdown/citations render in
  the caption. `.image-row md` wraps two figures side-by-side.
- **Every image needs credit in its caption** naming copyright holder +
  license, and must be recorded in `bildquellen-pruefung.txt` (free-form
  German audit: `=== TOPIC (lesson.php) ===` sections, entries with
  URL / Lizenz / Autor / Lokal / Status).
- The only case where a plain hyperlink (not `\cite`) is required is a file
  *license* page (e.g. the Wikimedia Commons page for a CC BY-SA image).
- Resized/cropped variants go through `image.php?f=…&w=&q=&fmt=&ar=W:H&
  ar-base=<other image>` (GD, ETag-cached); `ar-base` adopts a sibling figure's
  aspect ratio.

## The Blog: citations (the important part)

- Macros are processed at runtime by `bibtexify()` (helper.js):
  `\cite[Display text]{key}`, `\citeauthor`, `\citeauthorlastnameand`,
  `\citetitle`, `\citealternativetitle`, `\citeyear`, `\citeurl`, `\footcite`.
  Comma-separated keys work: `\cite{key1, key2}`. The optional `[Display text]`
  overrides the inline label; default `\cite` renders `[Author, Year]`.
- **Every key must exist in `blog/literature.js`** (`window.bibData`) or the
  citation renders broken with a console error. Verify each key before writing.
- Entry shape (JS object, unquoted keys, section comment headers group
  entries by lesson):
  ```js
  "ho2020ddpm": {
      title: "Denoising Diffusion Probabilistic Models",
      author: "Jonathan Ho et al.",
      year: 2020,
      url: "https://arxiv.org/abs/2006.11239",
      alternativetitle: "Ho et al., 2020"
  },
  ```
- **Never invent a source.** Every `url:` is link-checked in CI
  (`tests/link_checker.py` requires HTTP 2xx; `.pdf` URLs must serve a real
  PDF). Before adding an entry, confirm the work exists, author/title/year are
  correct, and the URL returns 200. Prefer stable authoritative URLs
  (publisher, author page, Wikipedia, arXiv, PMC, SEP, Wayback Machine).
- **Keep keys unique** — JS object semantics make a duplicate silently
  last-wins (no validator catches it today).
- Quotes must be genuine and verifiable. Paraphrase when you cannot verify
  exact wording.
- Citation ids are stable (`cite-<key>` on the first occurrence per `.md`
  block); the Sources section backlinks rely on that — don't hand-roll `id=`
  values that look like them.
- Captions are **not** a citation-free zone: `bibtexify()` sweeps
  `figcaption` / `table caption` / `.figcap` / legacy small-gray caption divs
  even outside `.md` blocks, and `processFigcapsMarkdown()` renders
  `*emphasis*`/`[links]` in captions.

## The Blog: theming & canvas modules

- Design tokens live in `style.css`: `--mn-*` custom properties on `:root`
  (light = Tufte cream `#FAF8F1`) overridden under `html.dark` (slate
  `#0f172a`). **Dark is the blog default** (cookie `theme`; only an explicit
  light choice or OS-dark-preference-without-cookie decide). Never hardcode
  theme colors in lesson CSS — use `var(--mn-…)`.
- Serif face is switchable via `$GLOBALS["blog_font"]` in functions.php:
  `"utopia"` (Lingua Franca, default) or `"computer-modern"`.
- **Reader mode**: `html.reader-mode` (key `R`, localStorage) widens the column
  to 90ch and drops chrome.
- **Canvas/Plotly/ECharts/TF.js modules must be theme-reactive**:
  - read colors via `window.__MN_DARK`: `themeColor(c)`, `cssVar('--mn-…')`,
    `isDark()`;
  - subscribe to re-render via `__MN_DARK.onChange(fn)` — one shared debounced
    MutationObserver, all callbacks batched;
  - **never hardcode `paper_bgcolor`/`#ffffff`/font colors in chart options** —
    a global Plotly observer patches charts on theme toggle (see
    `setupGlobalPlotlyThemeObserver` at the bottom of helper.js), but the
    first paint must already be correct.
- `blog/darkmode-ci/` (local tool, needs Chromium + served site): screenshots
  every page light+dark, detects stuck-white elements and WCAG contrast
  failures, auto-generates override CSS. Run it before declaring theme fixes
  done; known-issue history is in `blog/darkmode_todo.txt`.
- Lesson-local `<style>` blocks are an accepted pattern for one-off widget CSS
  — keep them token-based so both themes work.

## The Blog: reader-adaptation systems (topics.js)

The top-right "interests" toggle opens a `BlogTopics` overlay. Durable facts:

- **Interests**: `TOPICS` registry (27 ids: `math-i/ii/iii`, `geometry`,
  `statistics-i/ii`, `programming`, `architecture`, `training`, `data`,
  `hardware`, `inference`, `vision`, `audio`, `multimodal`, `agents`,
  `reasoning`, `interpretability`, `language`, `history`, `philosophy`,
  `ethics`, `safety`, `society`, `law`, `frontier`, `reference`) + exactly 5
  tone `CATEGORIES`: `math-heavy, code-heavy, logic-heavy, language-heavy`
  (suppress, ON by default) and `interested-layman` (include, OFF). Tiles and
  `.topic-block`s score 3-state: full / dimmed (`.topic-block-dimmed`) / tucked.
- **Math-comfort dial**: stored 0–100; the *dial* snaps to 5 stops
  (`MATH_LEVELS` = 0/25/50/75/100: No math / High school / University /
  Graduate / Research, default 50), the *gate* stays fine-grained (compares
  stored level vs each block's `data-mathlevel`; strict `<` — `level ==
  required` passes). `BlogTopics.snapMath(v)` / `mathLevelLabel(v)` guard
  non-numeric input.
- **Math-gate bypass (auto-reveal)**: if the user marks all prerequisites of a
  lesson as learned, gated blocks in it are revealed. `LESSON_DEPS` currently
  lists `math-i, math-ii, math-iii, math-iv, differentiation`.
- **Tucking**: tucked blocks clip to `TUCK_H = 168` px (must match the
  `.topic-block--clipped` CSS `max-height`) + fade badge. Blocks wrapping
  `iframe/video/audio/embed/object/[data-interactive]/.widget` or a large
  canvas (>320×240) are **never clipped** — they dim instead.
- **Learned state**: `BlogTopics.toggleLearned('slug')`; lesson id from
  `[data-lesson-id]` (put `<div class="md" data-lesson-id="slug">` on the first
  block) with URL-slug fallback. Every lesson shows a progress line
  (`Lesson N of M` + bar + "Next up") driven by `window.__moduleNavData`;
  "Builds on" / "unlocks" lines are added for spine lessons (`LESSON_DEPS`
  keys) only. `#topic-learned-btn` **must be appended to `#contents`** when
  created (a detached node is invisible).
- **Persistence**: localStorage `blog_topics_pref` is authoritative; the
  `topics_pref` cookie is a size-guarded mirror (skipped above ~3900 chars).
  Pref shape: `{topics, categories, profile, level, mathLevel, corePersonas,
  learned}`.
- **Math-alts**: a host `[data-math-opt="math-heavy"]` containing a rendered
  `<math>` plus a `.math-alt` plain-language twin; the twin shows when the
  tone is switched off. (Mechanism + test exist; no course content uses it
  yet.) The whole-section twin `<div class="md topic-block-alt">` inside a
  `data-mathlevel` block **is** used in production (e.g. `differentiation.php`).
- **Keypoints** (`keypoint.js`): qualifying `>` blockquotes inside `.md` are
  upgraded to `.kp-block` cards (byline → `.kp-source`). Skips: >2 paragraphs,
  >500 chars, code, `<footer>`-attributed, non-`.md`.
- **Search** (`Ctrl+K` or `/`): modes are plain, `/regex/`, `~fuzzy`;
  normalization folds diacritics and Greek letters (search_lib.php). Indexing
  is server-side per request, cached in `blog/.search_cache.json`.
- **Read-progress** (`progress_tracker.js`): per-tile 10-segment "where I've
  been" bars, dwell-time based (a band counts as read after ≥3 s). Passive —
  nothing to wire up in lessons.
- **Attribute separators are not interchangeable**: `data-topic` is
  **space**-separated (from the `[[t:]]` marked extension); `data-tags` /
  `data-math-opt` are **comma**-separated. All ids go through `cssSafe()` —
  a mismatch silently mis-tags a block.
- **Chrome ids exempt from tucking** (`NO_TUCK_IDS` in start.js): `footnotes`,
  `sources`, `toc`, `course-status-box`, `topic-learned-btn`,
  `sidenotes-rail`, `curiosity-score`, …

## The Blog: layout & typography guardrails

- **Reading column = `--mn-col-width`** (80ch normal, 90ch reader). Nothing in
  the prose flow may render wider. Exempt: margin notes (`.sideimage`,
  `.sidenote`), boxes (`.optional`, `.cl-block`), opt-in scrollers
  (`.lg-scroll`, `.lg-widescroll`), and absolute/fixed/sticky overlays.
  `layout_guardrail.js` outlines offenders red with a fix banner;
  `window.__layoutGuardrailCheck()` is the programmatic entry point the render
  validator drives. Wide content that *should* be wide gets `.lg-scroll`.
- **Block math rule**: `$$…$$` containing `_` or backslash commands must sit
  inside a `<div>` **inside** a `.md` block — otherwise the render validator
  fails (exit 2) and marked can mangle it.
- `math_guardrail.js` runs **only in debug mode** (`?debug=1` or
  `window.__MATH_GUARDRAIL__ = true`): flags `data-mathlevel` blocks lacking a
  `data-optionaltitle`/inner heading and raw `$$` outside `.md`. It reports via
  `console.error` — it must never fire in CI.
- **Typography**: author straight quotes/dashes/ellipsis (`"a"`, `--`, `...`);
  `smartPunct()` (render pass) and `typography_fix.js` (DOM pass, incl.
  `blogPostLoadComplete` + MutationObserver) convert them, skipping
  code/math/`.no-typo-fix`. Both passes are idempotent — don't add your own
  quote-fixing.

## The Atlas (interactive 3D course map)

`blog/map.php` + `blog/map.js`: an interactive three.js globe where every named
**person / place / institution / event / artifact** in the textbook is a dot,
great-circle **threads** link them, and a "cosmic journey" tour zooms from
Earth to the Big Bang and back.

The Atlas is **data-driven**. Dots/threads are *not* drawn in `map.js` — they
load from five generated files in `blog/atlas/`: `entities.json` (dots with
`lat/lng`, `type`, `active[]`, `cited_in[]`, `bibkeys[]`, `conf`),
`authors.json` (one dot per bibliography author), `threads.json`
(`kind` ∈ {influence, journey, signal}; endpoints are entity **ids**),
`bibliography.json` (parsed from `literature.js`), `world.json`
(Natural-Earth land/borders, exposed but not drawn — continents come from the
baked `earth_texture.jpg`).

Regenerate from `blog/`, in this order:

```
python3 atlas/atlas_parse_bib.py          literature.js  -> raw/bib_parsed.json
python3 atlas/atlas_merge.py --merge      raw/           -> entities/authors/bibliography/world.json
python3 atlas/atlas_threads.py --build    entities.json  -> threads.json
python3 atlas/atlas_check.py              independent audit — must exit 0
```

`raw/BRIEF_entities.md` and `raw/BRIEF_authors.md` are the worker specs for
entity/author extraction.

**The contract: add it to the data, not to the JS.** If a thing is real and
on-topic, it is a dot — searchable, filterable, eligible as a thread endpoint
and tour stop. A hardcoded marker in `map.js` breaks all of that:

- **New entity** → record in a raw list (`raw/out_part*.json`, schema in
  `BRIEF_entities.md`) → `merge --merge` → `threads --build` (if a thread
  endpoint) → `check`.
- **New author dot** → row in `raw/placed_*.json`
  (`[name, lat, lng, "City, Country", year, conf]`) → `merge --merge` →
  `check`. `works`/`keys`/`cited_in` are joined automatically — don't hand-write.
- **New cited work** → source of truth is `literature.js`, not the JSON. Add
  the key, `\cite{key}` it, then `parse_bib` → `merge --merge` → `check`.
- **New thread** → curated `INFLUENCE` / `JOURNEYS` / `SIGNALS` arrays in
  `atlas_threads.py` (endpoints by display name) → `threads --build` →
  `check`. Both endpoints must already be entities or the thread is silently
  dropped.
- **New tour stop** → `JOURNEY` array in `map.js` (one of the few legitimate
  hardcoded pieces); its `dot` must be a real `entities.json` id and its `img`
  a real file in `blog/`.

**Invariants** (all enforced by `atlas_check.py`):

- Thread endpoints / tour-stop `dot`s are entity ids; `cited_in` = real lesson
  slugs; `bibkeys`/author `keys` = real `literature.js` keys (invalid ones are
  *dropped*, not errors).
- `authors.json` covers the bibliography author list exactly once; conf rule:
  `conf: 1` ⇒ real lat/lng **and** non-empty city, `conf: 0` ⇒ nulls.
- Entity ids are unique and type-prefixed kebab-case
  (`person-alan-turing`, `place-bletchley-park`); `conf` ∈ stated/known/inferred.
- **Hand-maintained magic numbers** in `atlas_check.py`: bibliography entry
  count (`entries == 2120` — bump when literature.js grows), thread floor
  (`>= 100`), and the fixed list of expected `raw/` files (a new
  `out_part11.json` is not audited until added to that list).
  **The Atlas data is currently stale** (literature.js has grown past 2120
  keys) — re-run the pipeline and bump the count before relying on `check`.
- Every texture loaded in `map.js` must be a real file in `blog/`, cited in
  `map.php` with a `literature.js` key, and recorded in
  `bildquellen-pruefung.txt` (known outlier: the public-domain WMAP CMB photo
  is credited with a direct link and has no key).

## The Toolkit (repository root)

- **Site ≠ class.** The shipped site is a **global-function app** bootstrapped
  by `main.js` (`$(document).ready` → `_init_app_backend_and_ui` →
  `_init_app_data_and_handlers` → `_init_app_finalization`; the last sets the
  `finished_loading` flag and calls `updated_page()`). Central change flow:
  any GUI change → `updated_page()` → re-render; model rebuilds only when the
  layer config md5 changes (`model.js`). `asanai.js` is a separate **embeddable
  `asanAI` class** (demo: `class_test.html`, one-file bundle endpoint:
  `asanai.js.php`); `index.php` does **not** load it — and `embedding.js` is
  likewise an orphan. Editing them does not change the deployed site.
- **The four engines**: `model.js` (build/compile from the DOM, hash-gated),
  `train.js` (`train_neural_network()` entry, manual train/val split,
  callbacks; Stop = `model.stopTraining = true`), `predict.js`, `data.js`
  (`get_x_and_y()` — the central data provider for default/image/tensor/CSV).
- **`updated_page()` is the event bus and a hand-rolled FIFO mutex**
  (`waiting_updated_page_uuids`, 10 ms busy-poll). Route every
  "something changed, recompute" through it; train/fit call
  `wait_for_updated_page(n)` first. Do not introduce parallel state changes.
- **Global state** lives in `variables.js` (plain `var` window globals +
  per-layer registries: `layer_options`, activations, initializers,
  `js_names_to_python_names` …). Files reach across by global name;
  `.eslintrc.js` carries a ~600-entry `globals:` whitelist (editor-only, not
  wired into CI) — **add new cross-file globals there**.
- **New root JS files start line 1 with `"use strict";`** (check
  `tests/all_js_files_are_use_strict` exists; it is not in the fast gate and
  12 legacy files are non-conforming — don't let new files join that list).
- **jQuery** drives the DOM; there is no component framework. Controls carry
  inline `onchange="updated_page(null, null, this)"`.
- **TF.js is wrapped**: call the TensorFlow.js API through `base_wrappers.js`
  wrappers (`tf_add`, `buffer`, `tensor2d`, `tf_model`, `grad`, `fromPixels`,
  …) which register tensors in the on-screen debugger and route errors.
  `tests/find_unwrapped_base_functions` audits that raw `tf.*` symbols appear
  only in `base_wrappers.js` / `manual.js` / `asanai.js` / comments (needs
  `ack` + network; excluded from the standard smoke loop). Engine-level
  `tf.ready()`, `tf.engine()`, `tf.keep()`, `tf.env()` may be called directly.
- **Layer types** are the keys of `layer_options` (+ `layer_options_defaults`,
  `valid_layer_options`) in `variables.js`. Adding a layer type means adding to
  those registries. Custom layers (`DebugLayer`, `Snake`, `MultiActivation`)
  extend `tf.layers.Layer` + `tf.serialization.registerClass(X)`.
- **Datasets**: drop a JSON in `traindata/` — `php_files/traindata.php` scans
  the directory into the `traindata_struct` global; a sibling
  `<name>_weights.json` marks pre-trained weights.
- **Visualizers** in `visualizer/` are self-contained: instance-scoped CSS
  string, HTML template, a class with a `requestAnimationFrame` animation
  loop, and a `make_*_visual_explanation(selector, options)` registration
  function. Dropping a file in `visualizer/` auto-includes it (glob in
  index.php, alphabetical).
- **Themes (Toolkit)**: three **full-override sheets**
  (`css/{light,dark,natural}mode.css` + `ribbon*` variants) swapped as
  `rel="stylesheet alternative"` links (`#css_mode`, `#css_ribbon`) by
  `theme_choser()` (theme.js); **light is the server-side default**, dark is
  auto-applied only for OS dark preference without a cookie. Canvas code keys
  off the `is_dark_mode` global / `body.darkmode`. The `--color-*`/`--space-*`
  tokens in `css/style.css` are a static design-token layer, not the theme
  mechanism.
- **i18n is mandatory for UI strings**: keys in `translations.php` (de/en,
  shipped as the `language` global; a parity check `die()`s if en/de key sets
  differ — **add every new string to BOTH**). Markup via
  `class="TRANSLATEME_<key>"` or `data-tr-title/-alt/-placeholder/-option/-text`
  (swept by `update_translations()`); code via `language[lang]["key"]` /
  `trm()`. `find_missing_translations` fails the build on missing keys.
- **Error idiom**: `log/dbg/info/wrn/err` (debug.js) write to console **and**
  the on-screen status bar and increment `num_errs`/`num_wrns` — the
  in-browser test suite fails if those counters grow, so swallow nothing.
  `assert(cond, msg)` (safety.js) throws and re-enables the disabled GUI.
  `write_error()` (gui.js) pops SweetAlert2 and POSTs a bug report to
  `api/save_error_log.php`. **Fragile:** several paths route on exact TF.js
  error strings (`handle_page_update_error`, fit retry) — don't reword errors
  without updating every matching branch.
- **`eval()` is load-bearing** in two places: optimizer construction
  (`eval("tf.train.adam(…)")`, train.js) and custom-layer instantiation
  (`new (eval(type))(data)`, model.js). Name strings must stay valid
  `tf.layers.*` / `tf.train.*` identifiers.
- **Async discipline**: async functions must be awaited (static smoke test);
  call sites that genuinely can't await carry a `// cannot be async` comment.
- **Persistence**: cookies via `cookies_and_url.js` (always
  `SameSite=None; secure; path=/`), URL params via `history.replaceState`.
- **COOP/COEP headers** are set in index.php (TF.js threads) — don't remove.
  The page forces `tf.setBackend('cpu')` at load; `try_to_set_backend()` may
  switch to WebGL at boot.
- Indentation is tabs; Unix line endings; `semi: always` per .eslintrc.js.

## Validate before you finish

Run from the **repository root**. Python validators self-bootstrap under `uv`
(PEP 723 headers; `UV_EXCLUDE_NEWER` pinned to 8 days back — a brand-new
dependency in a header won't resolve for a few days).

| Command | Checks | Fails on | CI |
|---|---|---|---|
| `php -l blog/<slug>.php` | PHP syntax | syntax errors | via php_validator |
| `uv run blog/tests/php_validator.py blog/` | php -l, **HTML tag balance** (strips PHP/comments/script/style, stack-checks tracked tags), BOM, extra `?>` | **any issue** | `blog/**` |
| `uv run blog/tests/js_validator.py blog/` | bracket/brace balance, unclosed strings/comments, `debugger`/`alert`/`eval`, duplicate function names, DOM-API typos, TODO comments, BOM/line-endings | **critical issues only** (warnings don't block) | `blog/**` |
| `uv run blog/tests/lesson_guard.py blog/` | per-lesson static regression guards (currently `math_iv.php`: headings-in-md, citation keys, 3D wiring) — extend the `LESSONS` list per lesson | any guard | `blog/**` |
| `uv run blog/tests/link_checker.py blog/` | every `url:` in `literature.js` returns 2xx; PDFs must start `%PDF`; TLS/bot-block soft-passes never fail | real failures | `blog/**` + weekly cron |
| `node blog/tests/{topics,math_alt,keypoint,search_js}_test.js` | DOM-stubbed unit tests of BlogTopics (interests, math dial, learned), math-alts, keypoints, search | any failed check | `blog/**` |
| `uv run blog/tests/php_render_validator.py blog/` | headless-Chrome render (PHP built-in server): console error → exit 1; unrendered `$$` (with `_`/`\`) outside a `<div>` → exit 2; width overflow → exit 3 (only with `--check-width`); `--all-lessons --check-width --width-only` sweeps every lesson + the width gate via `window.__layoutGuardrailCheck()` | per exit codes | index.php only (width job currently disabled in CI) |
| `uv run blog/tests/typo_checker.py blog/` | spell-checks lesson prose; whitelist `blog/tests/typo_whitelist.txt` (one word/line, case-insensitive, append to add) | typos | **local only** |
| `uv run blog/tests/latex_error_checker.py --docroot blog/` | Playwright sweep of every lesson for LaTeX/render errors + static risk scan (`--trace` for traces) | failures (risk warnings don't) | **local only** |
| `python3 blog/atlas/atlas_check.py` | Atlas audit (see above) | any check | manual |
| `bash tests/smoke_tests` | Toolkit static analysis: `tests/find_*` (deep nesting, long functions, missing translations, unawaited async, uncalled functions, unused variables) — **skips** `find_unwrapped_base_functions` (network + `ack`) and `find_double_defined_functions` | any finding | Toolkit CI |
| `bash run_tests` (needs Docker) | Full Toolkit: docker build (port 1122), in-browser Playwright suite (the real tests are `run_tests()` inside `tests.js`, run in Firefox then Chromium; the in-page result **is** the exit code), optional `--screenshot-test` pixel diff | failed tests | Toolkit CI |

The two workflows are complementary: `main.yml` **ignores** `blog/**`
(toolkit only); `blog_php_validator.yml` runs **only** on `blog/**` (plus a
weekly Monday cron for link rot). A new lesson gets static CI coverage for
free (validators scan the whole directory), but the render job only renders
`index.php` — **also run the render validator with `--all-lessons` locally on
your lesson**. `tuck_layout_test.js` and the `.sh` layout guards
(`hover_layout_guard.sh`, `width_layout_guard.sh`, `typography_fix.sh`) are
local-only; the `.sh` guards silently SKIP (exit 0) without a served site at
`http://localhost/asanai/blog/tests/…` + Chromium.

## Guardrails

- **User data never leaves the browser.** No telemetry, no new outbound calls
  in authoring code. The single existing exception is the Toolkit's failure
  report (`send_bug_report()` → `api/save_error_log.php`, sent on uncaught
  errors / training failures): the report contains error + URL + env, but the
  **screenshot is omitted** when `privacy_is_tainted` — which happens on
  localhost automatically and as soon as the user draws, uses the webcam, or
  uploads own data (`taint_privacy()` in drawing.js/webcam.js/data_origin.js).
  Preserve that gating; never attach user content to reports.
- **Keep it lightweight**: no heavy frameworks, no new build tooling, no
  package manager in the authoring flow. New libraries are vendored files.
- **Match the existing style of the file you are editing**; add no comments
  unless asked. Comment language is mixed German/English — German inline
  comments are normal in this codebase, identifiers are English.
- **Don't edit vendored/minified files** (`*.min.js`, `libs/`, `tf/`) —
  validators ignore them and they're not meant for human editing.
- **Staging areas**: draft lessons go in `blog/todo/` until ready (they are
  excluded from the course and from search); one-off experiments in
  `blog/test/`. Promote deliberately.
- **Never invent a source, a location, or a quote** — applies to citations,
  Atlas entities (`conf` field makes the honesty rule explicit), and prose.
- Git history style is terse (`fix`, feature names); don't rewrite history,
  don't create empty commits.

## Pitfalls (verified landmines)

**Toolkit**

- `asanai.js` (385 KB, 181 methods) and `embedding.js` are **orphaned** —
  nothing in `index.php` loads them. The live app is the ~60-file split.
- The Matomo block in `index.php` is dead: PHP emits it only when host ≠
  localhost, the inner JS only runs when host == localhost. Don't
  "repair" it into life.
- `functions.php::_js()` **`die()`s the whole page** if a listed JS file is
  missing (and appends `?t=<filemtime>` cache-busters).
- `translations.js` is `async` in `<head>` (defer ignored when async is set) —
  its top-level binding can run before the body parses; language switching
  works only via the inline `onclick="update_lang(…)"` handlers.
- Theme cookie mismatch: the chooser writes `naturalmode`, but `index.php`
  tests `== "natural"` — a saved natural theme falls back to light on reload.
- HPC/SSH helpers (`ssh_taurus`, `get_number_model_names`) exist **only in the
  gitignored `cosmo_ok/` tree**, so `php_files/current_status.php` and
  `get_number_of_model_names.php` are legacy in the live root deployment.
- Duplicate definitions exist in legacy code (e.g. `_predict_table` twice in
  `predict.js` — the first is dead).

**Blog**

- Render order is a load-bearing contract (sidenotes → bibtexify → markdown →
  finalize). See the pipeline above.
- `renderMarkdown()` **skips nested `.md`** — `div.optional.md` inside an
  outer `.md` is re-parsed by `initOptionalBlocks`, not by `renderMarkdown`.
- The render validator fails on **any SEVERE console entry** (JS errors;
  `console.error` in page code qualifies) — all guardrails and runtime
  diagnostics must stay silent in production (debug mode only).
- `js_validator.py` carries a hardcoded `known_globals` set for its
  implied-globals check (currently defined but not in the active checker list)
  — a newly vendored library that introduces a global may need an entry there
  if that check is re-enabled.
- `blog/todo/` lessons carry real `COURSE_METADATA` but are not scanned by
  `parse_course_metadata()` (top-level glob only); they **are** in the Atlas
  slug universe.
