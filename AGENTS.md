# asanAI — Notes for AI Agents

Stable, high-level orientation. Details change; these observations are unlikely to.

## What this repository is

`asanAI` is one project in two parts that share a philosophy — *make machine learning
transparent by letting you see and touch it* — built in vanilla JS + PHP, no build step,
no server-side compute, no data leaves the browser.

1. **The Toolkit** (repository root) — a no-code, in-browser machine-learning toolkit.
   Design a network, train it (TensorFlow.js), inspect it, export Python.
   Entry point: `index.php`. Orchestrator class `asanAI` in `asanai.js`.
   Live: `asanai.scads.ai`. Reference: `arXiv:2501.06226`.

2. **The Blog** (`blog/`) — *"From Big Bang to ChatGPT"*: a free digital textbook that
   takes the reader from Stone Age tools, the history of math and machines, through the
   math of deep learning, to how modern LLMs actually work. Prose lessons interleave
   interactive in-browser visualizations. This is where most writing work happens.

Both parts are authored as **PHP templates + vanilla JS**, served statically by Apache.
There is no framework, no package manager, no minify/build step in the authoring flow.

## The Blog's lesson format (durable contract)

Each lesson is one `blog/<slug>.php` file. Its shape is a contract, not a style choice:

- **Line 1** is always `<?php include_once("functions.php"); ?>`.
- **A `<!-- COURSE_METADATA: ... -->` block** follows, with keys:
  `title`, `description`, `icon` (an HTML entity), `part` (1–6), `order` (int within the
  part), `color` (one of the `--mn-*` tokens: `accent, coral, emerald, rose, sky,
  text-secondary`), and `topics` (comma-separated). The drawer + index tiles are built
  *automatically* by scanning these blocks (`parse_course_metadata()` in `functions.php`).
- **Body** is Markdown inside one or more `<div class="md"> … </div>` blocks, rendered
  client-side (`marked.js` → `renderMarkdown()`). Raw HTML between `<div class="md">`
  blocks hosts interactive widgets. **Raw HTML captions work too:** caption-like
  elements (real `figcaption` / `table caption`, plus the legacy small-gray-`div`
  pattern) are swept by the renderer (`blogCaptionElements()` in `helper.js`), so
  `*emphasis*` / `[links]` inside captions render, and `bibtexify()` processes
  `\cite`/`\footcite` macros there as well — captions are not a citation-free zone.
  **Prefer `<figure><figcaption>`**; a `.figcap`-classed element works too.
- A lesson optionally has a matching `blog/<slug>.js`. If it exists and defines
  `load…Module()`, it is loaded and added to a module queue. **If it does not exist, the
  lesson still renders** — static lessons are fine and need no JS.
- Reading order is set by `incl("Human Title", "slug");` lines in `blog/index_full.php`.
  A lesson reachable in the drawer but absent from `index_full.php` is not in the linear
  course. Add both.

### Citations (the important part)

- Citations are LaTeX-like macros processed at runtime by `bibtexify()` (`blog/helper.js`):
  `\cite[Display text]{key}`, plus `\citeauthor`, `\citeyear`, `\citetitle`,
  `\citealternativetitle`, `\citeurl`, and `\footcite`. The optional `[Display text]`
  overrides what is shown inline; the `key` must exist in `blog/literature.js`.
- **Every citation key must exist in `blog/literature.js`** (`window.bibData`). A missing
  key logs an error and renders broken. Verify each key before writing.
- **Never invent a source.** Every `url:` field in `literature.js` is link-checked in CI
  (`tests/link_checker.py` requires HTTP 2xx). Before adding an entry, confirm the work
  exists, the author/title/year are correct, and the URL actually returns 200. Prefer
  stable, authoritative URLs (publisher, author's page, Wikipedia, arXiv, PMC, SEP,
  Wayback Machine). Keep keys unique (duplicate keys fail the JS validator).
- Quotes must be genuine and verifiable. Paraphrase when you cannot verify exact wording.
- **Image/figure credits in captions should be cited with `\cite[Credit text]{key}`** —
  not inline links to the source article. The only exception is file *license*
  attribution (e.g. a Wikimedia Commons page for a CC BY-SA image), which must stay a
  hyperlink because the license requires one. In both cases the attribution must name
  the copyright holder and the license.

### Images

- Local images live in `blog/` and are embedded with `\marginfig{file}{markdown caption}`
  or Markdown `![](...)`. Only reference files that exist in `blog/` (there is a source
  audit file, `bildquellen-pruefung.txt`, and image credit is expected in captions).

## The Atlas (interactive 3D course map)

`blog/map.php` + `blog/map.js` is a course lesson that renders an interactive 3D globe
(three.js): every named **person / place / institution / event / artifact** in the textbook
is a dot, great-circle **threads** link them, and a "cosmic journey" tour zooms out from
Earth to the Big Bang and back into a question-mark world.

The Atlas is **data-driven**. The dots and threads are *not* drawn in `map.js` — they are
loaded from five generated files in `blog/atlas/`:

- `entities.json` — the dots, each with its own `lat`/`lng`, `type`, `active[]`,
  `cited_in[]` (lesson slugs) and `bibkeys[]`.
- `authors.json` — one dot per bibliography author (same lat/lng/city/conf shape).
- `threads.json` — the edges; `kind` ∈ {influence, journey, signal}, endpoints are entity
  **ids**.
- `bibliography.json` — parsed from `literature.js` (`{entries, cites, authors}`); powers
  each dot's "works" list.
- `world.json` — Natural-Earth land/borders geometry (`{land, borders}`, `[lng, lat]`).
  Loaded and exposed as `window.ATLAS_WORLD` but **not drawn** — the continents come from
   the baked `earth_texture.jpg`.

They are regenerated by a pipeline (run **from `blog/`**, in this order):

```
python3 atlas/atlas_parse_bib.py          literature.js  -> raw/bib_parsed.json
python3 atlas/atlas_merge.py --merge      raw/           -> entities/authors/bibliography/world.json
python3 atlas/atlas_threads.py --build    entities.json  -> threads.json
python3 atlas/atlas_check.py              independent audit — must exit 0
```

`blog/atlas/raw/BRIEF_entities.md` and `BRIEF_authors.md` are the worker specs that feed
the entity and author extraction.

### The contract: add it to the data, not to the JS

**Anything you add to the Atlas must go into these data structures (via the pipeline), not
be hardcoded in `map.js`.** The globe is one consistent system: if a thing is real and
on-topic, it is a dot — searchable, filterable by time and type, and eligible to be a
thread endpoint and a tour stop. A one-off hardcoded marker breaks all of that, and it is
the thing most likely to be forgotten by a later agent. Route every addition through the
data so it can never drift from the rest of the map:

- **New person / place / institution / event / artifact** → add a record to a raw entity
  list (`blog/atlas/raw/out_part*.json`, schema in `BRIEF_entities.md`), then run
  `merge --merge` → `threads --build` (if it is a thread endpoint) → `check`.
- **New bibliography author (dot)** → add a row to `raw/placed_*.json`
  (`[name, lat, lng, "City, Country", year, conf]`, spec in `BRIEF_authors.md`), then
  `merge --merge` → `check`. `works` / `keys` / `cited_in` are joined automatically from
  the bibliography — do not hand-write them.
- **New cited work** → the source of truth is `blog/literature.js`, not the JSON. Add the
  key there and `\cite{key}` it in a lesson, then `parse_bib` → `merge --merge` → `check`.
- **New thread / edge** → add to the curated `INFLUENCE` / `JOURNEYS` / `SIGNALS` arrays in
  `blog/atlas/atlas_threads.py` (endpoints by display name), then `threads --build` →
  `check`. Both endpoints must already be entities or the thread is silently dropped.
- **New tour stop** → a stop in the `JOURNEY` array in `map.js` (one of the few legitimate
  hardcoded pieces), but its `dot` must be a real `entities.json` id and its `img` a real
  file in `blog/` — a missing id silently loses the stop's highlight.

### Invariants to keep in sync

- Thread endpoints and tour-stop `dot`s are **entity ids** — they must exist in
  `entities.json` or they silently no-op.
- `cited_in` must be real lesson slugs; `bibkeys` / author `keys` must be real
  `literature.js` keys (invalid ones are *dropped*, not errors).
- `authors.json` must cover the bibliography author list exactly once and obey the conf
  rule: `conf: 1` ⇒ real lat/lng **and** a non-empty city; `conf: 0` ⇒ nulls.
- **Every texture** loaded in `map.js` must be a real file in `blog/`, cited with a
  `\cite{key}` in `map.php` (a matching `literature.js` entry), and recorded in
  `bildquellen-pruefung.txt`. (Known outlier: the public-domain WMAP CMB photo is credited
  with a direct link and has no `literature.js` key.)
- `atlas_check.py` carries **hand-maintained magic numbers** — the bibliography entry
  count, a thread floor, and a fixed list of expected `raw/` files. Bump them when data
  grows; a new `out_part9.json` is not audited until that list is updated.

### Validate the Atlas

`python3 atlas/atlas_check.py` (exit 0) is the Atlas gate, on top of the usual
`php -l` / `js_validator` / `php_validator` / `link_checker` below.

## The Toolkit's key patterns (durable)

- **Global state** lives in `variables.js`; files reach across by global name.
- **jQuery** drives the DOM; there is no component framework.
- **TF.js is wrapped**: call the TensorFlow.js API through `base_wrappers.js` wrappers
  (enforced by a test), not directly.
- **Visualizers** in `visualizer/` are self-contained (own CSS + own JS class).
- **Themes** are CSS custom-property sets swapped at runtime (`theme.js`); dark is the
  default.

## Validate before you finish

Run these from the repository root (they use `uv`):

```
php -l blog/<slug>.php
uv run blog/tests/php_validator.py blog/      # php -l, HTML tag balance, brackets
uv run blog/tests/js_validator.py blog/       # JS syntax, duplicate keys, style
uv run blog/tests/link_checker.py blog/       # every literature.js URL must be 2xx
```

The blog `.php` lessons are checked for **balanced HTML tags** (the validator strips
PHP, comments, `<script>`/`<style>`, then stack-checks tracked tags). Keep any raw HTML
you add balanced. The whole suite runs in CI on changes under `blog/**`.

## Guardrails

- User data never leaves the browser; no telemetry, no cloud calls in authoring code.
- Keep it lightweight — no heavy frameworks or new build tooling.
- Match the existing style of the file you are editing; add no comments unless asked.

### Learned & Dependencies (Interactivity)

Lessons can implement a "Learned" system to adapt the course experience:

1.  **Lesson ID**: Each lesson PHP file should have a unique identifier. The most reliable way is to include `<div class="md" data-lesson-id="slug">` at the top of the lesson body.
2.  **Dependency Graph**: Define prerequisites in `blog/topics.js` using the `LESSON_DEPS` constant. 
    `LESSON_DEPS = { 'lesson-slug': ['dependency-slug-1', 'dependency-slug-2'] };`
3.  **Math-Gate & Auto-Reveal**:
    - Interactive blocks (e.g., `<div class="topic-block" data-mathlevel="70">`) are automatically tucked (hidden) if the user's math level is too low.
    - **Bypassing**: If a user marks all prerequisites of a lesson as "learned" (via `BlogTopics.toggleLearned('lesson-slug')`), the math gate is bypassed and the block is automatically revealed.
    - **The dial snaps to 5 stops** (`MATH_LEVELS`): No math / High school / University / Graduate / Research, at 0/25/50/75/100 (default `DEFAULT_MATH_LEVEL = 50` = University). Only the *dial* snaps — the gate itself stays fine-grained (it compares the stored 0–100 level against each block's `data-mathlevel`). `BlogTopics.snapMath(v)` / `BlogTopics.mathLevelLabel(v)` map a level to its stop/label and guard against non-numeric input.
4.  **Learned State**: 
    - Use `BlogTopics.toggleLearned('slug')` to allow readers to mark a lesson as mastered.
    - State is persisted in `localStorage` and synced via cookies (`topics_pref`). (The cookie write is size-guarded — it is skipped once the payload nears 4 KB, so `learned` can safely grow as a reader marks many lessons; `localStorage` always holds the full state.)
    - **Every lesson shows a course-progress line** at the top of the content (`Lesson N of M`, a thin progress bar, and a "Next up: [next lesson]" link), driven by the linear course order in `window.__moduleNavData`. A "Mark this lesson as learned" button at the end of the content records progress. The math **"Builds on" / "unlocks" lines are added on top for spine lessons only** (`LESSON_DEPS` keys).
    - Learned status can be displayed with a green indicator: `<div class="topic-deps-pill topic-deps-met">...</div>`.
    - The "Builds on" pill lets a reader **confirm each prerequisite as learned in one tap** (a "✓" per unmet prerequisite) without navigating away — and lists what the current lesson **unlocks** once marked learned (reverse `LESSON_DEPS`).
    - The `#topic-learned-btn` must be **appended to `#contents`** when created (a detached node is invisible and `getElementById` can't find it) — `showLearnedUI()` does `contents.appendChild(btn)` then `settleLearnedButton()` to pin it to the end.
5.  **Visual States for Topic Blocks**:

    - **Normal**: Fully visible.
    - **Dimmed**: `topic-block-dimmed`. Used for blocks that don't meet current math/topic filters but are still part of the page flow.
    - **Tucked (Collapsed)**: `topic-block-collapsed`. Used for highly technical or optional content.
        - Features a gradient-fade (`mask-image`) and a small `topic-block-fade-badge` at the bottom with a "tap to reveal" action.
        - If a block is tucked, it is still "part of the page" (not `display: none`) but visually recedes.
