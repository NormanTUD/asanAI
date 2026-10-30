# asanAI — Notes for AI Agents

Stable, high-level orientation. Details change; these observations are unlikely to.
Rules are stated in the imperative. If a rule conflicts with a validator, the
validator wins — then fix the rule here.

## Rules for every change

These are hard constraints, not preferences. Re-read them before editing and
again before reporting done.

**RULES**
- Do not break existing functionality. — Every change must preserve current
  behavior; the tests in "Validate before you finish" are the proof, not your
  intention.
- Existing module interfaces are sacrosanct. — Do not rename or re-sign
  exported functions, globals in `variables.js`, `load…Module()` entry points,
  `updated_page()` call shapes, `.mn-quiz` / `COURSE_METADATA` markup, or
  `literature.js` keys. Add alongside; never break a caller.
- Minimal change — no new dependencies without asking. — Smallest diff that
  solves the problem. Libraries stay vendored (no CDN, no package manager);
  ask before adding anything new.
- Rebuild the search indexes after blog source changes. — After editing a
  top-level lesson `.php`, `literature.js`, `search_lib.php`, or the semantic
  chunker, run `uv run blog/tools/build_semantic_index.py` **and**
  `uv run blog/tools/build_rag_index.py` from the repository root, then commit
  the regenerated `.search_cache.json`, `semantic_index.json`,
  `semantic_vectors.bin`, `blog/rag_data/rag_index.json` and
  `blog/rag_data/rag_vectors.bin`. They refresh the lexical cache through PHP,
  the browser vectors and the server-side RAG vectors;
  `blog/tests/semantic_index_test.py` and `blog/tests/rag_index_test.py` fail in
  CI when they are stale. The RAG builder is incremental: it reuses the int8
  vector and scale of every unchanged chunk, skips the build entirely when the
  source hash is fresh, and stores per-page hashes in `rag_index.json`. Use
  `--force` only for a model/dimension change or a suspected corrupt index; a
  first run after a clean checkout (or after `--force`) still embeds everything.
- Leave it cleaner than you found it. — Code, markup, prose, and structure
  should be better after your change than before. Tidy only what you touch; do
  not start unrelated refactors.

**QUALITY (high risk)**
- Comprehensive tests: happy path, edge cases, failure cases. — Cover the
  normal path, boundaries/empty/malformed input, and failure modes; add a test
  when the existing suite does not reach the change.
- Test both white-box and black-box. — Read the implementation to target
  branches, error paths, and internal state, then exercise it through its
  public interface as a caller would; neither view alone is enough.
- Check for race conditions. — Look for shared mutable state, async ordering,
  debounce/observer timing, and load-order dependencies; verify behavior under
  concurrent, repeated, or interrupted invocation.
- Run ALL tests and show me the raw output. — Run the relevant
  validators/commands from "Validate before you finish" with their raw output,
  including failures; never summarize a green run you did not observe.
- No hardcoded values to make tests pass. — Fix the cause, not the assertion;
  no special-casing test inputs, slugs, or filenames.
- Explain every non-obvious design decision. — When a choice is not obvious
  from the code (ordering, workaround, trade-off, guard), say why in the
  response so the reasoning survives the session; durable constraints belong
  in this file, not only in chat.
- Always evaluate your own code quality — and do it more than once. — Code
  must be human-readable, clear, and beautiful. Working is not done: after
  writing, re-read your own diff two or three times (naming, structure,
  readability, dead code, consistency with the surrounding file, comment
  noise) and fix what you find each pass. Do not stop at the first version
  that runs.
- The same applies to any text you write. — Prose, explanations, commit
  messages, and docs must be clear, precise, and pleasant to read. Re-read
  them before sending, cut filler, fix ambiguity and rhythm, and verify every
  claim; a text is not done on the first draft.
- Read the primary source before writing about it. — For every historical or
  scientific claim, locate the original paper, patent, book, or report, read at
  least the relevant passage, and cite that work directly. Use secondary
  sources to find the primary work or for uncontroversial context; do not cite
  a secondary source for a claim the primary source makes. If the original is
  inaccessible, say so and cite the best available source; never invent a
  citation, a quotation, or a result.

**WORKING DISCIPLINE**
- Test everything, automatically. — Every behavior change needs automated
  coverage: the happy path, boundaries, malformed input, and failure modes.
  A bug fix comes with a regression test that fails without the fix. Do not
  rely on manual clicking as proof.
- Run the real suite, not a guess. — Execute the relevant validators and the
  in-browser suite; include the raw output in the final report. A green run
  you did not observe is not evidence.
- Write clean, modular code. — Small functions with one job, clear names,
  explicit inputs, no duplicated logic, no dead code, and no hidden global
  state. Extend existing patterns instead of copying them.
- Work carefully and in passes. — Read the surrounding code first, state
  assumptions, make the smallest correct diff, then re-read the diff two or
  three times for correctness, consistency, readability, and test coverage.
- Iterate with focused slices, finish with the full gate. — Use filtered test
  runs while developing (see "Focused Toolkit test runs"), but run the full
  suite before declaring the task done.

## What this repository is

`asanAI` is one project in two parts that share a philosophy — *make machine
learning transparent by letting you see and touch it* — built in vanilla JS +
PHP, no build step, no server-side compute.

1. **The Toolkit** (repository root) — a no-code, in-browser machine-learning
   toolkit. Design a network, train it (TensorFlow.js), inspect it, export
   Python. Entry point: `index.php`. Live: `asanai.scads.ai`.
   Reference: `arXiv:2501.06226`.
2. **The Blog** (`blog/`) — *"From Nothing to Large Language Models"*: a free digital
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
| `blog/atlas_data/` | Atlas 3D-map data (generated JSON) + Python pipeline |
| `blog/todo/` | **Staging** draft lessons — not part of the course |
| `blog/test/` | One-off HTML experiments/scratch — not part of the course |
| `blog/py/` | Python snippets inlined into lessons via `get_string_of_file_or_die()` |
| `blog/rag/` | Optional server-side RAG answer service (Ollama + queue + installer); not web-served |
| `blog/rag_data/` | Generated server-side RAG index (full chunks + int8 vectors), web-denied |
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
`blog/asanai_blog_proxy.php` is a method/cookie-aware reverse proxy for
embeds: it forwards POST bodies, the blog's cookie allowlist and visitor
headers, rewrites links/forms/CSS/fonts and the analytics endpoint, and makes
stats login/CSV/backup work through the proxy. Override its remote base with
`ASANAI_BLOG_PROXY_REMOTE` for staging/tests.

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
- Every page rendered through the shared shell ends with the legal footer
  (`render_site_footer()`): `functions.php` closes `#contents` in a shutdown
  handler so the footer stays *after* the sources/footnotes JS appends inside
  it. `index.php` / `index_full.php` call the helper explicitly.

**Base JS** — `load_base_js()` loads the same core on every page:
temml, bpe (`BPETokenizer` class), start.js (`updateLoadingStatus`,
`render_temml`, `postLoadInit`), effects (scroll-reveal), prism + langs,
style.css, font override, echarts (+gl), sidenotes, literature,
citation_graph, jquery, plotly, tf, marked, toc, fcnn_visualization
(#fcnn_canvas drawing), init, cluster (Aurora color lanes), polish (heading
anchors, TOC scroll-spy, keyboard shortcuts), layout_guardrail,
math_guardrail, typography_fix, helper, master_vis, loader, three, search,
topics, keypoint, progress_tracker, then everything in `blog/modules/*.js`
(dropping a file there makes it a base module). Current modules: `intro.js`
(cosmic loader sequence), `chapter_switcher.js` (margin dock + sub-TOC spy),
`link_preview.js` (Wikipedia-style hover previews on course links — fetches
the target lesson, shows its first content image + title above the link;
`window.__LKP_FORCE__ = true` bypasses the fine-pointer gate for headless
tests, where `hover:hover` reports false), `a11y.js` (labels unlabeled form
controls and chart/canvas containers, keyboard-activates non-native clickables,
keeps closed overlays inert; `window.__a11yCheck()` is the debug audit),
`youtube.js` (`[youtube]ID[/youtube]` click-to-load cards — see the macro list
below). A new cross-lesson helper belongs in one of these, not copied into
lessons.

**Reader-retention modules** (all state in localStorage, nothing leaves the
browser): `quests.js` (`MNQuest`: XP, levels, achievements, lesson quests, the
progress overview; other modules add overview tabs via `MNQuest.addTab`),
`quiz.js` (`.mn-quiz` cards; emits `mnquiz:answer` / `mnquiz:finish`),
`lab_challenges.js` (goals inside labs; old labs without a `root` use
`anchor`), `review.js` (spaced-repetition deck of missed quiz questions),
`resume.js` ("pick up where you left off" banner;
`?continue=1` jumps to the saved spot), `predict.js`
(`.mn-predict` "predict first" cards before demos), `paths.js` (curated
learning paths + one per part, PNG certificate; all in one window opened by
the route icon `#paths-toggle` in the top-right chrome, `render_paths_toggle()`).
A path card's Start/Continue link picks it and jumps to its next lesson
(localStorage `mn_path_pick`); its Follow button only picks it. A picked path weaves through
the site: a calm hero in the picker (one path with an interactive route map,
the rest behind a searchable "all paths" drawer), a "Your path · step N" strip
at the top of the lesson TOC, a "next stop" card at the lesson end, a resume
card in `#mn-home-dash`, "Step N" badges on `#course-overview` tiles. The top
strip and the lesson-end card both carry a prev/next pager with a picker for
any lesson in the path. Every lesson ends with a
"Check yourself" quiz; `render_daily_question()` (functions.php) can draw a
daily question from all of them (not rendered on the intro/home page) — so keep quiz markup
exactly `<div class="mn-quiz" data-quiz="<slug>"><script type="application/json">…</script></div>`.
**Quiz options must not reveal the answer by their length.** The correct
option is historically the longest one by a wide margin, which makes guessing
trivial. All four options must be roughly equal in length and equally specific;
rewrite the three distractors as plausible *wrong* claims, not jokes or
one-word non-answers, and keep the correct option at the same `answer` index.
This applies to `.mn-predict` cards as well. Hard rule enforced by
`lesson_guard.py` (Q1): for short answers (longest ≤ 12 chars) the spread may
be at most 5; otherwise the shortest option must be at least 70 % of the
longest and the spread at most 22 characters. The correct option must be
neither the unique longest nor the unique shortest.
`.mn-predict` uses the same shape with `{q, options, answer, explain, try}`.
Mid-lesson checkpoints use `class="mn-quiz mn-quiz--checkpoint"` (with the
section's `data-depth` where the lesson is depth-tagged) and are not in the
daily pool. A module that must call `MNQuest` at start-up starts with
`setTimeout(start, 0)` when the document is already parsed (the home page
loads base JS with `defer`, and module files run in alphabetical order).

**Reader feedback** (`modules/feedback.js`, `feedback_capture.js`,
`feedback_track.php`, admin `feedback.php`): selecting text in a lesson opens a
small rail card to the **right of the paragraph** (never at the cursor) with
👍/👎/💡/❓/🐞 reactions, an optional comment and an optional email. The email
is remembered in `localStorage` only when the reader ticks the box, and is sent
with the message so the editor can reply. Bug reports attach console output and
recent clicks only after explicit consent (`feedback_capture.js` keeps that
buffer in memory, never sends on its own). Storage shares the analytics SQLite
DB: `block_feedback` (main row + location + prompt state), `feedback_selections`
(selected text/HTML, offsets, context, geometry) and `feedback_bug_context`
(consent-gated) plus `feedback_history` (status/prompt movements). The unified
admin page `/stats?view=feedback` shares the `/stats` password, session, header
and top-level nav with analytics (`/feedback` redirects there); the feedback
panel is embedded same-origin with `?embed=1`. It is tabbed (Overview, Inbox,
Accepted, Pages, Resolved, Bugs, All), tracks reactions per page (especially
👍/👎), lets the editor edit/delete a row, and can accept a row and copy an
editable AI-fix prompt (file, lesson, part, section, block, verbatim reader
words, editor instruction, constraints, validators; no source line numbers by
design). The feedback page's `X-Frame-Options` is `SAMEORIGIN` and CSP
`frame-ancestors 'self'` specifically so the unified shell can embed it.

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
- **Cross-references**: link sibling lessons by slug (`[The Atlas](atlas.php)`)
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
- `[youtube]VIDEO_ID[/youtube]` — a privacy-friendly click-to-load YouTube
  card. `modules/youtube.js` replaces the marker before marked runs; the card
  makes no outbound request until the reader presses play, then inserts a
  `youtube-nocookie.com` iframe. Use the 11-character video id only; invalid
  ids are left as literal text. `search_lib.php` strips the markers so ids do
  not enter lexical, semantic or RAG chunks.
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
  last-wins; `tests/literature_dup_keys.py` fails the build if any top-level
  key appears more than once.
- Quotes must be genuine and verifiable. Paraphrase when you cannot verify
  exact wording.
- Citation ids are stable (`cite-<key>` on the first occurrence per `.md`
  block); the Sources section backlinks rely on that — don't hand-roll `id=`
  values that look like them.
- Captions are **not** a citation-free zone: `bibtexify()` sweeps
  `figcaption` / `table caption` / `.figcap` / legacy small-gray caption divs
  even outside `.md` blocks, and `processFigcapsMarkdown()` renders
  `*emphasis*`/`[links]` in captions.
- **Citation integration — how a cite must sit in the prose.**
  `\cite[display]{key}` renders `display` verbatim, **without brackets**;
  plain `\cite{key}` renders `[Author, Year]` (bracketed, fine as-is — never
  double-wrap it). A display cite must sit in the text in one of two forms:
  - **Parenthetical** — the reference sits inside round brackets in the
    sentence: `…nothing at inference. (\cite[Guo et al., 2017]{guo2017calibration})`
    — add the `(...)` in the prose around the macro.
  - **Narrative** — the author/title is a grammatical part of the sentence:
    `As \citeauthor{morris2007topology} shows (Ch. 4, p. 75), …`, or the
    author as subject with a parenthesized year:
    `\cite[Zhou et al. (2022)]{zhou2022algorithmic} proved that …`. Concept
    names work as display because they *are* the noun:
    `…connects to the \cite[Lottery Ticket Hypothesis]{frankle2019lottery}: …`.
  - A **self-contained reference** (Author, Year / book title / "Section N")
    must never float between words:
    `…is a homeomorphism Morris, Topology Without Tears, Ch. 4, p. 75: it can…`
    is broken — either wrap it in `(...)` or rewrite the sentence so the cite
    is the subject.
  - **Book cites with chapter/page**: mid-sentence → narrative;
    sentence-final → parenthetical.
  - **Already inside a parenthetical?** A display cite inside an existing
    `(...)` group is already compliant — do *not* wrap it again
    (`(word (cite))` is a double wrap; the inner pair must go).
  - **Adjacent cites merge into one group**: `(\cite[A]) (\cite[B])` →
    `(\cite[A]; \cite[B])`. Never leave `(\cite[A]) (\cite[B])` side by side.
  - **Method-name + cite**: `(\cite[A, Year]) (Name)` or
    `Name (\cite[A, Year]) (product)` — keep the name as the noun and attach
    the cite to it: `**Name** (\cite[A, Year])`.
  - **Narrative subject takes `Author (Year)`**, not `Author, Year`:
    `\cite[Hahn (2020)]{hahn2020limitations} proved that …` — the bare
    `Author, Year` form reads as a floating reference outside parens.
  - **No cites in headings** (`##`/`###`): the citation goes into the first
    sentence of the section.
  - **No empty parts**: `\cite[]{key}` renders an empty link;
    `\cite[disp]{}` renders literal garbage — both are bugs.
  - Enforced statically by `blog/tests/lesson_guard.py` (cite guard; C3
    "not floating" uses line-level paren depth — a cite counts as
    parenthetical if any `(` opens unclosed before it on its line).

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
- **History-depth dial**: a second dial, parallel to math-comfort, for *how
   far back in time* the course should reach (the textbook spans Big Bang →
   present, so a reader who only cares about AI can skip the ancient history).
   Stored 0–100 in the pref as `depth` (default 100 = full depth); the *dial*
   snaps to 6 stops (`DEPTH_LEVELS` = 0/20/40/60/80/100: Just AI / Computers /
   1600s / Ancient / Prehistory / Big Bang and beyond). A block **or course
   tile** tagged `data-depth="N"` (alias `data-depthlevel`) is tucked while the
   reader's depth is `< N` — `N` is the farthest-back era the unit reaches
   into, shown only once the reader sets at least that depth. Gate is
   `scoreUnit({ depthReq })` (reason `'depth'`); the slider (step 20) sits in
   the overlay and the inline widgets. API: `getDepthLevel` / `setDepthLevel` /
   `snapDepth` / `depthEra`. Tagged examples: `intro.php` (one test block) and
   `untold_history.php` (fully tagged — the reference for rollout). **Tagging
   convention**: tag a section div (top-level `div.md`) with the *farthest
   back era it substantively reaches* — 1900s+ → `20`, ~1500–1799 → `40`,
   ~500 BC–1499 (antiquity/medieval) → `60`, prehistory (before ~3300 BC) →
   `80`, deep time (cosmos, life, Earth, hominid evolution) → `100`. Passing
   one-line mentions don't count; purely modern / CS-only sections stay
   untagged (visible at every depth). Blocks with an inner heading collapse
   with a reason banner when tucked; untitled blocks dim instead. Rolling the
   tag across the rest of the course is a separate task.
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
   Pref shape: `{topics, categories, profile, level, mathLevel, depth,
   corePersonas, learned}`.
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
- **Semantic search** (`semantic_search.js`): normal-language queries are also
  embedded in the browser by the vendored `blog/vendor/model2vec/` (packed
  4-bit potion-base-8M, English-only) and ranked against precomputed chunk
  vectors. Question-like queries follow semantic order; short keyword queries
  fuse lexical + semantic with reciprocal rank fusion. **After editing lessons,
  `literature.js`, `search_lib.php`, or the chunker, rerun
  `uv run blog/tools/build_semantic_index.py` and
  `uv run blog/tools/build_rag_index.py`, then commit the regenerated
  `.search_cache.json`, `semantic_index.json`, `semantic_vectors.bin` and
  `rag_data/`.** The scripts refresh the lexical cache via PHP, the browser
  vectors and the server-side RAG vectors. The semantic builder rebuilds its
  chunk list and vectors; the RAG builder is incremental and prints
  `reused N, embedded M`. Tests:
  `node blog/tests/semantic_js_test.js`,
  `uv run blog/tests/semantic_index_test.py`,
  `uv run blog/tests/rag_index_test.py`,
  `uv run blog/tests/rag_incremental_test.py`; the index tests fail when stale.
- **RAG answer chat** (`rag_chat.js` + `ask.php` + `rag/`): optional floating
  “Ask the course” panel. It only appears when `ask.php?health=1` reports a
  healthy local service. `rag/server.py` runs one generation at a time with a
  queue, per-IP rate limits and an answer cache; it retrieves with the packed
  bge-small-en-v1.5 vectors in `rag_data/`, reranks the top candidates, and
  answers with a small CPU-only Ollama model (default Qwen2.5-1.5B). Non-English
  questions are translated to English for retrieval and answered in the
  question's language (with a final language-normalisation pass); section
  titles/page titles feed BM25, reranking and a heading/year boost. Answers must
  cite `[S1]…` or return a localized “not in the course”. Install on a server with `blog/rag/install.sh`; after content
  changes run `blog/rag/reindex.sh` (or the repo builders above). The repo
  builder is incremental: unchanged chunks keep their existing int8 vector and
  scale, an unchanged `sourceHash` is a no-op, and `--force` re-embeds
  everything. It writes `pageHashes` into `rag_index.json`; on the first run
  after an older index those hashes are absent, so every page is reported as
  changed even though only changed chunks are embedded. The Python
  service binds to `127.0.0.1`; `ask.php` is the public proxy. Q&A are logged
  to `/var/lib/asanai-rag/queries.sqlite` (no IPs; blocked requests redacted)
  and shown at `/questions`, linked from the stats nav and using the same
  admin session/password. The browser client persists the transcript, resumes
  an in-flight job after a reload, retries transient failures and never
  force-scrolls a reader who scrolled up. Tests: `node blog/tests/rag_chat_test.js`,
  `uv run blog/tests/rag_server_test.py`, `uv run blog/tests/rag_index_test.py`.

**Updating the RAG index (incremental).** The normal update is two commands
from the repository root:

```bash
uv run blog/tools/build_semantic_index.py
uv run blog/tools/build_rag_index.py          # incremental; prints reused/embedded
uv run blog/tools/build_rag_index.py --force  # only for model/dims changes or corruption
```

The RAG builder reuses the int8 vector and scale of every chunk whose text is
unchanged, and skips the whole build when `sourceHash` is fresh. On the first
run after an index built before `pageHashes` existed, every page is reported as
changed even though only changed chunks are embedded. The write is atomic, so
an interrupted build leaves the previous index intact.

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
- **Equation readability rule**: every new display equation must carry **two
  levels of `\underbrace`**. The inner level names the variables, functions and
  parameters; the outer level explains in plain English what the equation is
  doing. Use `\substack{…\\…}` for multi-line labels, and keep the brace text
  short enough that the equation still fits the reading column. Split long
  equations with `\begin{aligned}` rather than letting them overflow.
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

`blog/atlas.php` + `blog/atlas.js`: an interactive three.js globe where every named
**person / place / institution / event / artifact** in the textbook is a dot,
great-circle **threads** link them, and a "cosmic journey" tour zooms from
Earth to the Big Bang and back.

The Atlas is **data-driven**. Dots/threads are *not* drawn in `atlas.js` — they
 load from five generated files in `blog/atlas_data/`: `entities.json` (dots with
`lat/lng`, `type`, `active[]`, `cited_in[]`, `bibkeys[]`, `conf`),
`authors.json` (one dot per bibliography author), `threads.json`
(`kind` ∈ {influence, journey, signal}; endpoints are entity **ids**),
`bibliography.json` (parsed from `literature.js`), `world.json`
(Natural-Earth land/borders, exposed but not drawn — continents come from the
baked `earth_texture.jpg`).

Regenerate from `blog/`, in this order:

```
python3 atlas_data/atlas_parse_bib.py     literature.js  -> raw/bib_parsed.json
python3 atlas_data/atlas_merge.py --merge raw/           -> entities/authors/bibliography/world.json
python3 atlas_data/atlas_threads.py --build entities.json -> threads.json
python3 atlas_data/atlas_check.py         independent audit — must exit 0
```

`atlas_data/raw/BRIEF_entities.md` and `atlas_data/raw/BRIEF_authors.md` are the
worker specs for entity/author extraction.

**The contract: add it to the data, not to the JS.** If a thing is real and
on-topic, it is a dot — searchable, filterable, eligible as a thread endpoint
and tour stop. A hardcoded marker in `atlas.js` breaks all of that:

- **New entity** → record in a raw list (`atlas_data/raw/out_part*.json`, schema in
  `atlas_data/raw/BRIEF_entities.md`) → `merge --merge` → `threads --build` (if a thread
  endpoint) → `check`.
- **New author dot** → row in `atlas_data/raw/placed_*.json`
  (`[name, lat, lng, "City, Country", year, conf]`) → `merge --merge` →
  `check`. `works`/`keys`/`cited_in` are joined automatically — don't hand-write.
- **New cited work** → source of truth is `literature.js`, not the JSON. Add
  the key, `\cite{key}` it, then `parse_bib` → `merge --merge` → `check`.
- **New thread** → curated `INFLUENCE` / `JOURNEYS` / `SIGNALS` arrays in
  `atlas_threads.py` (endpoints by display name) → `threads --build` →
  `check`. Both endpoints must already be entities or the thread is silently
  dropped.
- **New tour stop** → `JOURNEY` array in `atlas.js` (one of the few legitimate
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
- The only remaining hand-tuned constant is the **thread floor** (`>= 100`).
  The bibliography entry count is now **derived from `literature.js`** at check
  time (unique top-level keys — duplicates are caught by
  `tests/literature_dup_keys.py`, so the check counts *unique* keys to match
  `atlas_parse_bib.py`), and provenance is **glob-based** per raw file family
  (`out_part*.json`, `placed_*.json`, `authors_chunk_*.json`, …) so a new
  `out_part15.json` / `placed_12.json` is audited automatically. No re-bumping.
  **When literature.js or any lesson's `\cite` macros change:** re-run
  `atlas_parse_bib.py` → `atlas_merge.py --merge` → `atlas_threads.py --build`
  → `atlas_check.py`; the 234→310 thread / 1456→1887 entity baseline grows as
  lessons cite more sources.
- Every texture loaded in `atlas.js` must be a real file in `blog/`, cited in
  `atlas.php` with a `literature.js` key, and recorded in
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
| `php blog/tests/analytics_test.php` | standalone analytics tests: UA/referrer classification, pageview lifecycle, section/event details, dedupe, cleanup, backup, health checks | any failed check | `blog/**` (workflow) |
| `uv run blog/tests/stats_filters_test.py` | HTTP regression: stats login and one-month cookies, global search, chips, reset/source removal, hour/day/weekday/humans, empty form values | any failed check | `blog/**` (workflow) |
| `uv run blog/tests/proxy_stats_test.py` | proxy regression: login/cookies, filters, `__proxy_path`, CSV/backup, rewritten tracker endpoint, section/event beacon | any failed check | `blog/**` (workflow) |
| `uv run blog/tests/analytics_client_test.py` | browser tracker regression: section visibility + aggregate events, no query/full URL, payload <4 KB | any failed check | `blog/**` (render job) |
| `uv run blog/tests/stats_ui_test.py` | stats UI regression: briefing/explore, lazy charts, compare, saved views, present/light, overflow | any failed check | `blog/**` (render job) |
| `uv run blog/tests/admin_ui_test.py` | admin regression: global search, presentation slides/cards/URL state, reader-feedback tabs/search/accept/edit/done/bug/delete | any failed check | `blog/**` (render job) |
| `uv run blog/tests/js_validator.py blog/` | bracket/brace balance, unclosed strings/comments, `debugger`/`alert`/`eval`, duplicate function names, DOM-API typos, TODO comments, BOM/line-endings | **critical issues only** (warnings don't block) | `blog/**` |
| `uv run blog/tests/lesson_guard.py blog/` | per-lesson static regression guards (currently `math_iv.php`: headings-in-md, citation keys, 3D wiring) — extend the `LESSONS` list per lesson — plus blog-wide citation-integration, quiz-option-balance and site-footer guards | any guard | `blog/**` |
| `uv run blog/tests/link_checker.py blog/` | every `url:` in `literature.js` returns 2xx; PDFs must start `%PDF`; TLS/bot-block soft-passes never fail | real failures | `blog/**` + weekly cron |
| `uv run blog/tests/literature_dup_keys.py blog/` | every top-level key in `literature.js` appears exactly once (JS object last-wins would silently hide a duplicate) | **any duplicate** | `blog/**` |
| `node blog/tests/{topics,math_alt,keypoint,search_js,semantic_js}_test.js` | DOM-stubbed unit tests of BlogTopics (interests, math dial, learned), math-alts, keypoints, search, semantic ranking | any failed check | `blog/**` |
| `node blog/tests/rag_chat_test.js` | RAG chat status text, citation links, HTML escaping | any failed check | `blog/**` |
| `uv run blog/tests/semantic_index_test.py` | semantic index freshness vs `.search_cache.json`, vector shape, Python↔JS tokenizer parity, int8 vector fidelity | stale index or any failed check | `blog/**` (semantic-index job) |
| `uv run blog/tests/rag_index_test.py` | server RAG index freshness vs `.search_cache.json`, vector shape, no redirect/macro chunks | stale index or any failed check | `blog/**` (semantic-index job) |
| `uv run blog/tests/rag_incremental_test.py` | incremental RAG builder: fresh sourceHash is a no-op, only changed chunks re-embed, reused rows stay byte-identical | any failed check | `blog/**` (semantic-index job) |
| `uv run blog/tests/rag_server_test.py` | RAG retrieval helpers, grounding/citations, queue position/ETA, answer cache, HTTP API (fake Ollama) | any failed check | `blog/**` (semantic-index job) |
| `uv run blog/tests/{semantic,rag}_browser_test.py` | headless-Chrome UI: semantic question + AI toggle + fallback; RAG chat health, queue/ETA text, answer and source links | any failed check | `blog/**` (php-render job) |
| `uv run blog/tests/php_render_validator.py blog/` | headless-Chrome render (PHP built-in server): console error → exit 1; unrendered `$$` (with `_`/`\`) outside a `<div>` → exit 2; width overflow → exit 3 (only with `--check-width`); `--all-lessons --check-width --width-only` sweeps every lesson + the width gate via `window.__layoutGuardrailCheck()` | per exit codes | index.php only (width job currently disabled in CI) |
| `uv run blog/tests/typo_checker.py blog/` | spell-checks lesson prose; whitelist `blog/tests/typo_whitelist.txt` (one word/line, case-insensitive, append to add) | typos | **local only** |
| `uv run blog/tests/latex_error_checker.py --docroot blog/` | Playwright sweep of every lesson for LaTeX/render errors + static risk scan (`--trace` for traces) | failures (risk warnings don't) | **local only** |
| `python3 blog/atlas_data/atlas_check.py` | Atlas audit (see above) | any check | manual |
| `bash tests/smoke_tests` | Toolkit static analysis: `tests/find_*` (deep nesting, long functions, missing translations, unawaited async, uncalled functions, unused variables) — **skips** `find_unwrapped_base_functions` (network + `ack`) and `find_double_defined_functions` | any finding | Toolkit CI |
| `bash run_tests` (needs Docker) | Full Toolkit: docker build (port 1122), in-browser Playwright suite (the real tests are `run_tests()` inside `tests.js`, run in Firefox then Chromium; the in-page result **is** the exit code), optional `--screenshot-test` pixel diff | failed tests | Toolkit CI |
| `python _run_tests.py --browser <name> [--quick] --url <url>` | Cross-platform Playwright runner (no Docker): `chromium`/`firefox`/`webkit` use Playwright's bundled builds, `chrome`/`msedge` the installed branded channels, `opera` a best-effort Chromium launch; `--quick` runs `run_tests(1)`; `--parallel N` runs up to N browsers at once; `--stop-on-failure` skips remaining browsers after a failure; `--artifacts-dir` stores screenshots/HTML/traces; `--timings-json FILE` records per-browser durations | failed tests | Windows/macOS Toolkit CI |

`main.yml` runs the full Docker suite on Ubuntu and a direct-PHP/Playwright
matrix with one job per OS and all browsers inside it. Browsers run
**sequentially** on every OS; WebKit runs first because it is the most
platform-sensitive engine, then Chromium, Firefox, branded Chrome, Edge and
Opera. Matrices use `fail-fast: false`. New pushes do **not** cancel older runs
(no workflow `concurrency`), and there is no cross-job cancellation: every OS
job finishes so the other OS results and timings survive a failure in one of
them.
The version tag is only pushed after all jobs succeed. Browser failures are
summarized on the job's GitHub summary page (failed test, result counts,
concrete error trace, collapsible raw log), and `run-summary` runs
`if: always()` and writes a per-OS/browser job-duration table to the run
summary. CI caches pip + Playwright browsers from
`tests/ci-requirements.txt`, uses `--stop-on-failure`, and uploads failure
screenshots/traces with 7-day retention.
The two workflows are complementary: `main.yml` **ignores** `blog/**`
(toolkit only); `blog_php_validator.yml` runs **only** on `blog/**` (plus a
weekly Monday cron for link rot). A new lesson gets static CI coverage for
free (validators scan the whole directory), but the render job only renders
`index.php` — **also run the render validator with `--all-lessons` locally on
your lesson**. `tuck_layout_test.js` and the `.sh` layout guards
(`hover_layout_guard.sh`, `width_layout_guard.sh`, `typography_fix.sh`) are
local-only; the `.sh` guards silently SKIP (exit 0) without a served site at
`http://localhost/asanai/blog/tests/…` + Chromium.

### Focused Toolkit test runs

The full suite (`bash run_tests`) is the release gate. While iterating, do not
pay for a complete run every time — resume late, or run only matching tests:

```bash
# one-time server + browser environment
bash docker.sh --local-port 1122
source ~/.asanai_test_env/bin/activate

# run only matching tests in Chromium against the already-running server
python3 _run_tests.py --chromium --url http://localhost:1122 \
  --from-test "test_maximally_activated_last_layer" \
  --only-test "Feature map" --only-test "Growing a map" \
  --only-test-count 25

# the wrapper forwards unknown flags to _run_tests.py
bash run_tests --no-smoke-tests --no-docker --chromium \
  --from-test "test_maximally_activated_last_layer" --only-test "Feature map"
```

- `--from-test NAME` skips every `test_equal` before the first matching name.
  Non-`test_equal` setup still runs so global state stays valid — the suite
  therefore still spends time on training/setup, but skips the assertions.
- `--only-test NAME` (repeatable) runs only `test_equal` names containing that
  substring; `--only-test-count N` stops after N executed assertions.
- Both options are forwarded as `?from_test=…` / `?only_test=…`; you can also
  use them directly in the browser URL.
- The suite prints `[====      ] 42% of tests done (N/TOTAL), estimated time
  left: …` for every test. The bar always shows progress; the ETA only starts
  after at least five tests that each took ≥30 s, so the fast opening tests do
  not produce a misleading estimate. `TOTAL` comes from the last completed run
  in this browser; `DEFAULT_EXPECTED_TEST_COUNT` in `tests.js` is the
  fresh-browser fallback and `?expected_tests=N` overrides it. Update the
  fallback when the suite count changes for real.

## Guardrails

- **User data never leaves the browser.** No telemetry, no new outbound calls
  in authoring code. The single existing exception is the Toolkit's failure
  report (`send_bug_report()` → `api/save_error_log.php`, sent on uncaught
  errors / training failures): the report contains error + URL + env, but the
  **screenshot is omitted** when `privacy_is_tainted` — which happens on
  localhost automatically and as soon as the user draws, uses the webcam, or
  uploads own data (`taint_privacy()` in drawing.js/webcam.js/data_origin.js).
  Preserve that gating; never attach user content to reports.
- **Blog analytics kill switch**: the gitignored, web-denied
  `blog/.analytics_disabled` disables pageview tracking, the tracker script,
  `track.php` updates, the public setup banner and admin health warnings, and
  automatic cleanup; the dashboard stays readable (read-only, no new DB is
  created) with a neutral disabled notice. Delete the file to re-enable. Do
  not add a GUI delete/reset path.
- **Blog analytics detail logging**: `pageview_sections` and
  `pageview_events` store heading reach/dwell and coarse interaction events
  (target/domain/citation/code language/search position/quiz correctness),
  keyed to the pageview id and deleted with it. Never store raw search queries,
  full external URLs, form contents or per-person learning profiles.
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
- **Don't use `git stash` / `git stash pop` as a routine tool** (e.g. to
  A/B-test "is this pre-existing or from my change?"). The human and other
  agents commit **mid-session**, and the branch carries **pre-existing
  stashes**. `git stash` can find nothing (your edits already committed) while
  the paired `git stash pop` then applies *someone else's* WIP stash and
  drops merge conflicts into the working tree (seen in `train.js`). To
  compare against the prior state, use read-only inspection
  (`git show HEAD:<file>`, `git log -p -- <file>`, `git diff HEAD -- <file>`)
  instead — never mutate the working tree or the stash stack.

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
- Never reset form controls from `pageshow`: it fires after `load`, so on a
  slow page it can wipe `set_config()` while boot is still applying it (empty
  input shape → `conv2d` model creation fails). Reset defaults synchronously at
  the start of `$(document).ready` instead; `test_pageshow_does_not_reset_app_state`
  guards this.
- Never call `localStorage.clear()` in the Toolkit. It and the blog share one
  origin, so it wiped every reader's XP, achievements, learning paths, review
  deck and lesson progress. `bottom.js` only removes its own
  `tensorflowjs_models/` keys; `tests/find_local_storage_clear` guards this.

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
