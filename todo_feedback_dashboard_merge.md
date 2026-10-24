# TODO — Feedback dashboard, merge with analytics, selection coverage

Status: **implementation in progress**. Re-check `git status` / recent commits
before touching shared files because another agent is also active in this tree
(notably `literature.js` and `vibe_coding.php`).

This file is the persistent work list for the feedback/analytics work. The
in-session todo list carries the same high-level items.

## Progress log (latest first)

- Fixed the severe client false-success path (`response.json().catch(ok:true)` removed).
- Fixed the blog-root slug: token carries the server slug, `/asanai/blog/` stores `index`, legacy `blog` rows are migrated.
- Page tables + count cells now link to internal filtered views; separate ↗ opens the lesson.
- Added “Latest suggestions & bugs” to the feedback Overview and a reader-feedback summary card to the stats Overview.
- Regenerate/save/status actions now redirect to `…&open=<id>#feedback-<id>`; the row reopens and is scrolled into view.
- Selection now works outside `.md` (H1, sources, footnotes, smart-quotes, quizzes, demo text); quiz blocks no longer skipped wholesale.
- Added demo fallback buttons for SVG/canvas demos.
- Long selected passages scroll inside `.mnf-quote`.
- Mobile bottom sheet has a drag handle; quote scroll and touch targets improved.
- Security: random DB stored token secret, path-bound nonce token, path/file validation, daily cap, server-side title override, stricter HTML sanitizing, plaintext prompt/admin notes, action row checks.
- **One unified admin page:** `/stats?view=analytics|feedback` uses one shared header/nav; the feedback view is a same-origin embedded panel (`feedback?embed=1`) with its own internal tabs. `/feedback` redirects there. Theme and auth are shared; stats Overview also shows feedback KPIs/latest.

---

## A. Confirmed bugs and root causes

### A1. Page `blog` links to `/asanai/blog/blog`
- **Symptom:** The page table lists `blog` and clicking it opens `/asanai/blog/blog`.
- **Root cause:** `blog/modules/feedback.js` → `slugOf()`:
  - On `/asanai/blog/`, it strips trailing slashes → `/asanai/blog`
  - Takes the last path segment → `blog`
  - It has no equivalent of the server-side
    `mn_analytics_slug_from_path()` check for the blog directory / `index`.
- **Fix:**
  - Add `slug` to `window.__MNFeedback` from PHP (`mn_analytics_current_slug()`)
    and use that as the authoritative slug.
  - Also fix client fallback: if last segment equals the blog directory
    (`basename(dirname(__DIR__))` exposed in config) or is `index`/`index.php`,
    use `index`.
  - Normalize legacy rows on read/display: `path IN ('blog','index.php','')`
    → `index`, title `Course overview`.
  - Admin lesson links must use `index` for `index`, never `blog`.

### A2. Clicking page stats leaves the admin or goes to the wrong page
- **Symptom:** Clicking a page row links to the lesson URL (and currently to
  `/blog/blog`). The user wants to stay in the dashboard and see the filtered
  helpful/not-helpful feedback.
- **Fix:**
  - Page name and count cells link internally:
    `?tab=all&path=<slug>&reaction=helpful` (and analogous for
    `unhelpful`, `insight`, `confusing`, `bug`).
  - Keep a separate small “Open lesson” link, but not as the primary click.
  - Same behavior in the Overview page table, Pages tab, and latest-ideas card.
  - Keep `range`, `q`, and other filters when navigating.

### A3. Severe: submitting a new bug may show success but not appear
- **Observed DB state:** bug rows *are* stored in
  `~/.asanai-blog/analytics.sqlite` (e.g. recent `bug`/`new` rows on
  `history`). The data layer works.
- **Why it can look like “nowhere”:**
  1. The **Overview** tab only shows aggregates and leaderboards; it does not
     list individual feedback. New rows are visible only under Inbox/Bugs/All.
  2. The client treats a body-less/non-JSON response as success:
     `response.json().catch(... => ({ ok: true }))` in
     `blog/modules/feedback.js`. A 204 from a wrong/misconfigured endpoint or a
     disabled feedback endpoint would show “Thanks” without storing anything.
  3. A post-submit reload is required before the admin sees the row; no
     notification/badge exists.
- **Fix:**
  - Client success only when `response.ok === true` **and** JSON is parsed
    successfully **and** `result.ok === true`.
  - Treat 204 as failure for feedback (the endpoint must return JSON).
  - Surface real errors (`invalid_token`, `unavailable`, network) and keep the
    draft.
  - Put a **Latest suggestions / bugs** card on Overview, including newly
    submitted rows.
  - Make Inbox the default tab after login, or show a prominent “N new” badge.
  - Optional: lightweight polling/refresh badge while the dashboard is open.
  - Add an admin “Refresh” button.

### A4. “Regenerate prompt” loses context / looks like leaving the site
- **Observed:** Direct + proxy POST both return 303 to the same URL and the
  prompt is regenerated in the DB.
- **Why it feels broken:** The full-page POST/redirect collapses the open
  `<details>` row; the user lands at the top of the list and cannot see the
  regenerated prompt. It is also easy to miss the flash message.
- **Fix:**
  - Prefer an AJAX endpoint/action for save/regenerate: update the textarea in
    place, keep the row open, show an inline “Prompt regenerated” status.
  - If keeping the POST/redirect path: redirect to
    `…&open=<id>#feedback-<id>`, auto-open that row and scroll to it.
  - Keep `admin_note`, `include_bug`, and `id` intact; never lose the row.
  - Add a busy state and disable the button while regenerating.
  - Test both direct and via `asanai_blog_proxy.php`.

### A5. Heading / SmartQuote / Sources / Check yourself / demo selection
- **Root cause:** `checkSelection()` requires `el.closest("#contents .md")`.
  Everything outside a `.md` block is ignored:
  - page `<h1>` and generated section headings
  - `#sources-section` / `#sources` and `.bib-entry`
  - `#footnotes-section`
  - `.mn-quiz` (also in `SKIP_CLOSEST`, so doubly blocked)
  - raw HTML demo/widget blocks between `.md` blocks
  - smart-quotes placed outside `.md`
- Normal `##`/`###` headings inside `.md` do work; the failing headings are
  mostly page H1 / generated sections.
- **Fix:** see section B.

### A6. Long selected passage is cut off
- **Root cause:** `blog/style.css` `.mnf-quote` uses
  `-webkit-line-clamp: 3; overflow: hidden;`.
- **Fix:** see section C.

### A7. Mobile polish still incomplete
- Bottom sheet works, but no drag handle/swipe-close, and long quote/scroll
  behavior needs checking on touch.
- **Fix:** see section D.

---

## B. Selection coverage (headings, quotes, sources, quiz, demos)

### B1. Replace the `.md` gate
- Accept any text inside `#contents` (Sources/Footnotes are generated there).
- Keep explicit exclusions:
  - feedback panel, chrome, TOC, drawer, search
  - sidenote/sideimage rails
  - form controls: `button, input, textarea, select, [role=slider]`
  - quiz buttons/options: `.mnz-opt`, `.mnz-btn`, `.mnz-source`
  - code-copy buttons, Plotly modebar, demo control bars

### B2. Block resolution
Add `resolveReadableBlock(el)`:
1. nearest semantic block:
   - `h1–h6`, `p`, `li`, `blockquote`, `pre`, `figure`, `figcaption`,
     `table`, `td`, `th`
   - `.bib-entry`
   - `.mnz-q`, `.mnz-explain`, `.mnz-title`, `.mnz-result`
   - `.smart-quote`, `.rendered-quote`
   - `.cl-eq`, `.cl-block`, `summary`
2. fallback to stable container:
   - `[data-interactive]`, `.plot-container`, `.mnlab`, `.widget`,
     `.mn-quiz`, `figure`
   - `#sources-section`, `#footnotes-section`
   - nearest element with a stable `id`

Store:
- `context_kind` = `prose | heading | source | quiz | demo | smartquote | footnote`
- `container_selector` / `container_label`
- `block_selector` (concrete selected block)
- `block_index` broadened to all readable blocks in `#contents`

### B3. Section fallback
- `#sources-section` → “Sources”
- `#footnotes-section` → “Footnotes”
- `.mn-quiz` → quiz title from JSON/`data-quiz`, else “Check yourself”
- demo → nearest heading, else figcaption, else “Interactive demo”
- page H1 → lesson title

### B4. Quiz specifics
- Remove `.mn-quiz` from `SKIP_CLOSEST`.
- Allow question/explanation/result text.
- Skip option buttons and action buttons.
- `section_anchor` e.g. `quiz-<data-quiz>`.

### B5. Sources specifics
- `.bib-entry` block; use `#bib-<key>` as anchor.
- Prompt context should say this is a generated bibliography entry, point at
  `literature.js` / the citation key, not the lesson source text.

### B6. SmartQuotes
- Allow `.smart-quote` and `.rendered-quote` inside and outside `.md`.
- Don’t break the quote’s own expand/collapse behavior.

### B7. Demos / canvas
- HTML/SVG text inside demos should work after the root broadening.
- Fix `cssPath()` for SVG: use `getAttribute('class')`, not `className`
  (SVGAnimatedString).
- For canvas-only / no selectable text: add a small “Feedback on this demo”
  button on the demo container (visible on hover/focus, touch-friendly).
  Opens the panel with `selected_text=''`, container as block, comment still
  possible.

### B8. Long selection
- CSS: remove line clamp; `.mnf-quote` becomes a scroll area
  (`max-height`, `overflow-y:auto`, `overscroll-behavior:contain`,
  `touch-action:pan-y`, `tabindex=0`, `role=region`).
- Add bottom fade when scrollable; show scrollbar on hover/focus.
- Panel remains scrollable too; quote scroll must not scroll the page.

---

## C. Reader UX / mobile

- Pin the panel once the user types/selects a reaction; stop chasing scroll.
- If the block leaves the viewport: pin or hide cleanly, no jump.
- Min selection length ~3 chars; 120–180 ms debounce.
- Ignore `Ctrl/Cmd+C` copy selections.
- Restore focus to the selected block on close.
- Success message: `role=status`/`aria-live`.
- Specific errors: token expired → reload; rate limited → wait; offline →
  retry, keep draft.
- Optional: collapse email under “Get a reply (optional)”.
- Optional: one-time gentle “Select text to leave feedback” hint.
- Mobile sheet:
  - drag handle, swipe-down close only on handle
  - `overscroll-behavior: contain`, safe-area, `100dvh`
  - touch targets ≥ 44–52 px, inputs 16 px
  - test 390×844 and keyboard-open state
  - don’t fight native selection handles; keep the 380 ms delay

---

## D. Security hardening

### D1. Critical: detach feedback token secret from admin password
- Current `mn_feedback_secret()` derives the HMAC key from
  `mn_analytics_password_line()`; the token is public in every page.
- If the password file is plaintext, an attacker can brute-force the admin
  password offline from any token.
- Fix: random per-install secret in DB `meta` (`feedback_secret`), generated
  with `random_bytes(32)`.
- Token: timestamp + nonce + path, HMAC with that secret.
- If secret/DB unavailable: do not print feedback config / disable endpoint.
- Do not fall back to `__FILE__` or the password.

### D2. Rate limiting / spam
- Replace the ineffective `website` check with a real hidden honeypot field
  sent by the client.
- Add a global daily cap (configurable, e.g. 500/day) and a per-token cap
  (e.g. 10); no IP/cookie storage.
- Add a minimum elapsed time from panel open → send.
- On cap: `429`/`503` with a clear client message; alert admin.

### D3. Path/meta validation
- Reject non-existent `blog/<slug>.php`.
- Override `lesson_title`, `part`, `part_title` from server metadata.
- Only set `source_file` when the file exists.

### D4. Stored HTML / admin text
- `selected_html` / `block_html`: strict allowlist without attributes, or
  store plain text + offsets only.
- `admin_note` / `admin_prompt`: plain text with preserved newlines.
- Admin always escapes output.

### D5. Admin action integrity
- Check row existence before status/edit/prompt actions.
- Only write `feedback_history` when `rowCount() > 0`.
- Optional: foreign keys or explicit cleanup.

### D6. Other
- `X-Robots-Tag: noindex` on endpoint.
- Clear `mn_stats_exclude` on logout for consistency.
- Optional retention/purge and soft-delete.
- Optional nonce-based CSP for the admin page.

---

## E. Merge `stats.php` and `feedback.php` into one admin UI

Goal: one login/session, one visual shell, one tab bar, all data at once.

### E1. Shared shell
- New shared header/nav partial:
  - brand link to `index`
  - current time
  - theme toggle
  - “Exclude my own visits”
  - sign out
- Same CSS tokens/typography for both views.
- Top-level tabs:
  - **Analytics** (existing stats sections)
  - **Feedback** (Overview, Inbox, Accepted, Pages, Resolved, Bugs, All)
- Preserve `?range`, `?path`, `?q`, etc. across tabs where meaningful.

### E2. Architecture options
Recommended phased approach:
1. Extract feedback dashboard markup/SQL into `lib/feedback_admin.php`
   (or a view function) that outputs a fragment.
2. Make `stats.php` the canonical `/dashboard` shell and include the feedback
   fragment when `?view=feedback`.
3. Keep `/feedback` as a redirect/alias to `dashboard?view=feedback`.
4. Extract shared auth/session/header helpers into `lib/admin.php`.
5. Move stats body later if it becomes manageable; do not rewrite the whole
   5k-line stats.php in one step.

Alternative if extraction is too risky:
- Keep both files but include the same shared header/tabs/CSS and cross-link
  with a single visible tab bar. Still one visual GUI, same URL prefix.
- Avoid iframes.

### E3. Cross-links
- Analytics page rows → feedback filtered by path.
- Feedback page rows → analytics filtered by path.
- Both use the same internal path filters, not remote lesson links.

---

## F. Admin UX improvements

- Latest suggestions/bugs card on Overview (comment excerpt, reaction, page,
  edit/delete).
- Inbox as default after login, or a prominent new-items badge.
- Section-level stats (`path + section_title`).
- Helpful rate per page: `👍 / (👍 + 👎)`; attention = `👎 + ❓ + 🐞`.
- Page table cells link internally to filtered lists.
- Keep a separate “Open lesson” link.
- Block link `?mnfb=<block_index>` → scroll/highlight on lesson; fallback via
  `container_selector`.
- Prompt history snapshots.
- CSV export of filtered feedback.
- Filter by `context_kind`, section, reaction, status.
- Bulk actions (optional): mark visible as done/accepted.
- Prompt language: English (per decision).
- No line numbers in prompts; for sources/quiz/demos use context-specific
  instructions instead.

---

## G. Tests / verification

### Selection matrix (Selenium)
- `#contents > h1`
- `.md h2`, `.md h3`
- `.rendered-quote` / `.smart-quote`
- `#sources .bib-entry`
- `.mn-quiz .mnz-q`, `.mnz-explain`
- `#sources-section` / `#footnotes-section`
- `figcaption`
- demo text inside `[data-interactive]`
- canvas/demo button opens comment-only panel
- long selection scrolls inside quote, page does not move
- Escape preserves scroll position
- mobile 390×844: sheet, swipe, keyboard, no iOS zoom

### Security tests
- token is not HMAC of the admin password
- token/path mismatch rejected
- rate limit / daily cap
- honeypot + min elapsed
- invalid/nonexistent path rejected
- strings are escaped in admin
- history only for existing IDs
- CSRF still enforced

### Regression
- `php blog/tests/analytics_test.php`
- `uv run blog/tests/php_validator.py blog/`
- `uv run blog/tests/js_validator.py blog/`
- `uv run blog/tests/lesson_guard.py blog/`
- `uv run blog/tests/proxy_stats_test.py` (extend: feedback admin login,
  regenerate, new bug visibility)
- `uv run blog/tests/analytics_client_test.py`
- `uv run blog/tests/stats_filters_test.py`

---

## H. Suggested order after the other agent is done

1. Re-read all touched files and `git status` / `git diff` / recent commits.
2. Security fixes (token secret, rate limit, path validation, sanitation,
   action integrity).
3. Client success/error handling + index slug normalization + internal links.
4. Regenerate/save prompt UX.
5. Selection roots (headings, quotes, sources, quiz, demos) + long quote scroll.
6. Mobile polish.
7. Admin merge/shared shell + latest ideas + CSV/section stats.
8. Full test matrix and manual QA.

---

## I. Evidence notes (for quick reproduction)

- DB: `~/.asanai-blog/analytics.sqlite`
  - recent `bug/new` rows exist (so storage is not the immediate failure).
  - `path='blog'` rows come from `/asanai/blog/`.
- `blog/modules/feedback.js`:
  - `slugOf()` → `blog`
  - `el.closest("#contents .md")` gate
  - `SKIP_CLOSEST` contains `.mn-quiz`
  - `response.json().catch(... {ok:true})`
- `blog/style.css`:
  - `.mnf-quote { -webkit-line-clamp: 3; overflow: hidden; }`
- `blog/feedback.php`:
  - Page table uses `href="$p['path']"` (wrong for `blog`, leaves admin)
  - Regenerate uses full POST/redirect and collapses the `<details>` row
  - Overview has no individual-item list
- `blog/lib/analytics.php`:
  - `mn_feedback_secret()` derived from admin password line
  - `mn_feedback_store()` trusts `path` beyond regex
- `stats.php` / `feedback.php` currently separate shells; merge plan in E.
