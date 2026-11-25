# darkmode-ci

Dark-mode theme-switch + font-readability CI tester for the asanai blog.

This tool runs every subpage in a headless browser, scrolls through it,
takes screenshots in both light and dark mode, and detects:

1. **Theme-switch bugs** — elements whose `background-color` or `color`
   stays the same when toggling between light and dark mode (i.e. a white
   box that should have become dark).
2. **Stuck-white pixel clusters** — regions of the screenshot that are
   white in *both* light and dark mode (visual confirmation of a
   theme-switch bug, with stricter size thresholds).
3. **Font-readability issues** — text whose contrast against the page
   background falls below WCAG AA (4.5:1 for normal text, 3:1 for large
   text). Severity is `critical` (< 2), `bad` (2–3), `warn` (3–4.5), or
   `tiny-font` (< 11 px).

It then auto-generates CSS rules that override the dark-mode appearance
of the offending elements.

## Install

```bash
cd darkmode-ci
npm install
```

The tool needs a Chromium binary on the system. By default it looks for
`/usr/bin/chromium` (Debian/Ubuntu). Override with `--executable-path` or
set `puppeteer.executablePath` in `test.js`.

## Run

The blog must be reachable (default: `http://localhost/asanai/blog`).
Override with `BASE_URL=…` or `--base-url`.

```bash
# All pages, 10s wait per scroll block (slow — ~2 hours)
npm test

# Fast smoke test (5s wait, 4 parallel workers)
npm run test:fast

# Single page
node test.js --only history

# Specific pages
node test.js --only history,index,intro

# JSON output for CI
node test.js --json
```

### CLI options (test.js)

| Flag             | Description                                            |
| ---------------- | ------------------------------------------------------ |
| `--only a,b,c`   | Only test the given page slugs                         |
| `--wait <ms>`    | Wait after each scroll block (default 10000)           |
| `--parallel N`   | Browser contexts in parallel (default 3)               |
| `--base-url URL` | Override base URL (default `http://localhost/asanai/blog`) |
| `--out DIR`      | Output directory (default `./darkmode-ci-out`)         |
| `--json`         | Print summary as JSON to stdout                        |
| `--headed`       | Run with visible browser (for debugging)               |
| `--help`         | Show README                                            |

### Environment variables

| Var                   | Default                  | Description                |
| --------------------- | ------------------------ | -------------------------- |
| `WAIT_AFTER_SCROLL_MS`| `10000`                  | Settle time per scroll block |
| `PARALLEL`            | `3`                      | Parallel browser contexts  |
| `BASE_URL`            | `http://localhost/asanai/blog` | Base URL of the blog       |
| `OUT_DIR`             | `./darkmode-ci-out`      | Output directory           |
| `VIEWPORT_W`          | `1280`                   | Viewport width             |
| `VIEWPORT_H`          | `800`                    | Viewport height            |
| `SCROLL_STEP`         | `700`                    | Scroll step (px)           |
| `MAX_HEIGHT`          | `20000`                  | Cap on tested page height  |

## Auto-fix

After running the tester, generate CSS fixes for the critical/bad
issues:

```bash
npm run fix:dry     # preview what would be applied
npm run fix         # apply, with backup of style.css
npm run fix:critical # only critical severity
npm run fix:all     # also fix stuck-white containers
```

`autofix.js` reads `./darkmode-ci-out/_stream.jsonl` and inserts CSS
rules into `../style.css`. It will not modify HUD/overlay elements
(drawer, search, topic overlays, …) or non-text elements (SVG, MathJax,
Plotly). A backup of the original CSS is saved as
`../style.css.bak-autofix`.

## scroll-capture

For one-off visual inspection, `scroll-capture.js` is a thin CLI around
the same `lib/scroll-capture.js` library used internally by `test.js`:

```bash
# Capture just the history page in both themes
node scroll-capture.js --slug history --out ./shots --themes light,dark

# Capture a custom URL
node scroll-capture.js --url http://example.com/foo --out ./shots

# With smaller viewport and no module loader wait
node scroll-capture.js --slug history --out ./shots \
  --width 800 --height 600 --no-modules --wait 2000
```

## Library API

For deeper integration, use the modules directly:

```js
const { ScrollCapture } = require('darkmode-ci/lib/scroll-capture');
const { snapshotVisibleElements } = require('darkmode-ci/lib/element-snapshot');
const { detectBlock } = require('darkmode-ci/lib/bug-detector');

const cap = new ScrollCapture({ baseUrl: 'http://localhost/asanai/blog' });
await cap.launch();
const { ctx, page } = await cap.openPage();
await cap.navigate(page, 'http://localhost/asanai/blog/history.php', { theme: 'light' });

// Scroll to a position
await cap.scrollTo(page, 1500);
await new Promise(r => setTimeout(r, 5000));

// Capture both themes
await cap.captureAt(page, 1500, {
    themes: ['light', 'dark'],
    outDir: './shots',
    basename: 'history',
});
```

See `lib/` for the full module surface.

## Output

```
darkmode-ci-out/
├── _stream.jsonl              # per-block findings (newline-delimited JSON)
├── partial.json               # in-progress structured report
├── bug_report.json            # final structured report
├── summary.json               # top-level summary (used by CI exit code)
├── autofix_report.json        # autofix report (after running autofix)
├── <page-slug>/
│   ├── block-00-y0-light.png
│   ├── block-00-y0-dark.png
│   ├── block-01-y700-light.png
│   └── …
```

## Exit codes

- `0` — clean (no critical/bad bugs, no stuck-white clusters)
- `1` — bugs found (good for CI gating)
- `2` — fatal error

## CI integration

A sample GitHub Actions workflow lives at `ci/github-actions.yml`. It
runs the tester on every push and PR, comments on PRs with the bug
summary, and uploads screenshots as an artifact.

```yaml
- name: Dark-mode check
  run: |
    cd darkmode-ci
    npm ci
    npm run test:fast
```

## Architecture

```
darkmode-ci/
├── test.js                  # main orchestrator (CLI)
├── autofix.js               # CSS rule generator
├── scroll-capture.js        # standalone scroll-and-screenshot CLI
├── lib/
│   ├── scroll-capture.js    # ScrollCapture class — the core library
│   ├── theme-controller.js  # toggle html.dark class + cookie
│   ├── element-snapshot.js  # DOM → computed-style snapshot
│   ├── pixel-diff.js        # PNG → cluster analysis
│   ├── color-utils.js       # parseRgba, contrastRatio, relLum
│   ├── bug-detector.js      # match light↔dark, find bugs
│   └── selectors.js         # HUD/overlay classification
├── ci/
│   └── github-actions.yml   # example CI config
└── package.json
```

Every module is independently importable. Add new detection heuristics
in `bug-detector.js`; add new selectors to classify in `selectors.js`;
add new bug severity rules in `autofix.js`.

## Notes on detection

- **Backdrop-filter** elements look visually different than their
  computed `background-color`. The detector skips them for the
  theme-switch bug check, since the visual is dominated by the blurred
  page bg.
- **Indigo accents** (`rgb(99, 102, 241)` etc.) are intentional brand
  colors and skipped — they're meant to look the same in both themes.
- **Image elements** naturally have white content (scanned documents).
  Stuck-white clusters that point to `img` are skipped.
- **MathJax / Plotly / ECharts** render their text into SVG — contrast
  checks are skipped because computed `color` is misleading.
- **HUD/overlay** (drawer, search, topic overlays, …) are skipped — they
  are meant to look consistent across themes.

If a real bug is hidden behind one of these filters, edit
`lib/selectors.js` to remove the exclusion.
