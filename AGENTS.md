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
4.  **Learned State**: 
    - Use `BlogTopics.toggleLearned('slug')` to allow readers to mark a lesson as mastered.
    - State is persisted in `localStorage` and synced via cookies (`topics_pref`).
    - Learned status can be displayed with a green indicator: `<div class="topic-deps-pill topic-deps-met">...</div>`.
    - The top "Builds on" pill lets a reader **confirm each prerequisite as learned in one tap** (a "✓" per unmet prerequisite) without navigating away — and lists what the current lesson **unlocks** once marked learned (reverse `LESSON_DEPS`).
5.  **Visual States for Topic Blocks**:

    - **Normal**: Fully visible.
    - **Dimmed**: `topic-block-dimmed`. Used for blocks that don't meet current math/topic filters but are still part of the page flow.
    - **Tucked (Collapsed)**: `topic-block-collapsed`. Used for highly technical or optional content.
        - Features a gradient-fade (`mask-image`) and a small `topic-block-fade-badge` at the bottom with a "tap to reveal" action.
        - If a block is tucked, it is still "part of the page" (not `display: none`) but visually recedes.
