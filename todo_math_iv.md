# TODO — Math IV (Affine Maps & the Fold)

Last updated: 2026-09-21. Scratch pad so work survives a crash.

## 1. UX overhaul batch (in progress)

Status of the user's multi-part request:

- [x] Remove "The image as data · 8×8 matrix" section (D2) — heading + `#af2d-mat` grid gone, JS removed
- [x] Live equations right-clickable (copy dialog) — `tex()` now passes `annotate: true` so the site's LaTeX popup finds the `<annotation>`
- [x] Step-by-step lines (x', y', w') as real math — `termLineTex()` renders rows as `\cos(30°)\cdot 0.250 …`
- [x] Live equation expanded to full step-by-step (D2, D3): one `aligned` block = matrix product + per-row terms + result (perspective divide when w'≠1)
- [x] 4×4 matrix now displays 4×4 (CSS: `.af-mxrow{flex-wrap:nowrap}`, `.af-mx{flex:1 1 0}`, `.af-mxwrap{width:100%}`)
- [x] `af2d-presets` moved above the warped image
- [x] Fold sliders (θ, c, λ) moved above the plots
- [x] Fold piece matrices rendered as symbolic math (identity + `1−λcos²θ` / `−λsinθcosθ` / `λc·cosθ` bmatrix)
- [x] Self-tests removed from D2, D3, F2 (and U3 for consistency) — `renderChecks` + `selfTests` gone, `.af-check*` CSS gone
- [x] Fold status pills removed (`#fd2d-status` gone)
- [x] U3 readout: Lk integral + n̂/c/λ + separation + min‖A−B‖ as one right-clickable aligned math block
- [x] U3 plot clearer: ring labels A/B, crease label, n̂ arrow; sliders got `.af-hint` explanations; "How to unthread" 3-step recipe added
- [x] D2/D3 live equation, line 1: point vector symbolic `x, y(, z), 1` + `p = (x, y[, z]) = (values)`
      line. Verified in browser: `p=(x,y,z)=(1.000,1.000,1.000)` then `[x′y′z′w′]=M·[x y z 1]`.
- [x] **Browser verification finished** — all labs boot, zero err boxes, all D2/D3/F2/U3 checks
      pass, AND copy dialog proven: contextmenu on `#af2d-eq math` → `.lp-box` visible with the
      full aligned LaTeX source in the code area (`_extractLatex` reads the x-tex annotation).
- [x] Final validator pass: php -l OK, js_validator 0 errors, lesson_guard all 7 pass,
      php_validator only the known line-76 false positive (raw divs balanced, renders fine).

→ **UX overhaul batch: DONE.** Next: section 2 (activation-functions lab).

### Verification notes (2026-09-21)

Headless results via direct chromedriver HTTP (`/tmp/opencode/verify_mathiv.py`):
- all labs boot, `__affineMath` present, zero `.af-err` boxes
- D2: 8×8 gone, presets above warped image, eq is `<math>` with `aligned` annotation;
  rendered text = `[x′y′w′]=[cos30° −sin30° 0; …][0.250 0.750 1] x′=cos30°⋅0.250−sin30°⋅0.750+0=−0.158 …`
- D3: matrix editor 4 rows × 4 cols, rows fill the column width (no 2×8 wrap)
- F2: sliders above source canvas, status/checks/eqm gone, m1/m2 symbolic bmatrix, eq has ReLU
- U3: Lk ≈ −0.994 ⇒ LINKED rendered as math, 5 hints, 3 recipe items
- canvases all have non-bg content
- validators: js_validator 0 errors (math_iv_affine.js clean); php_validator 1 known false-positive
  (line 76 div warning — raw divs balanced 90/90); lesson_guard all 7 pass
- gotcha fixed: `(identity)'}` quote/brace swap in F2 eq broke the validator's brace counter

~~Still to prove: contextmenu …~~ PROVEN 2026-09-21: dialog opens, `vis: true`, code area
contains the full `\begin{aligned}\mathbf{p} &= (x,\, y) = ...` source. Headless note:
execute/sync can't await a Promise — dispatch the event in one call, read the dialog in a
second call after a sleep.

## 2. NEW lab (user request): "Activation functions as folds" — BUILT 2026-09-21

### What was built (all verified in headless Chrome)

- **Math core**: `Fold.radialPhi`, `Fold.radialLift`, `Fold.radialApply` (exposed on
  `__affineMath.Fold`). ReLU radial fold reuses F2's φ = arccos(1−λ) (λ=1 flattens onto the
  crease circle, λ=2 mirrors in it — arc length kept); tanh is a smooth developable lift
  z = 0.4λ·tanh((r−c)/s), plane untouched.
- **Lab A2** in `math_iv_affine.js` (`initA2`, wired in `bootAll`):
  - `#act-src` (2D): two data rings (inner accent / outer bad), dashed cyan crease circle,
    ghost of the folded rings (flat shadow), tracked p + f(p), hover crosshair + trace.
  - `#act3d-canvas`: bent sheet (annular-band checkerboard, 10×24 quads, z-sorted),
    both rings on the sheet, crease circle, **separator plane** at z=(z₁+z₂)/2 colored
    good/bad, drag-rotate + wheel zoom (`bind3DNav`), axes.
  - `#act1d-canvas`: activation profile r ↦ (r′, z) with identity dashed, crease at c,
    r₁/r₂ markers, tracked-point dots, legend.
  - `#act-eq`: full step-by-step aligned math (right-clickable, annotate:true) +
    `#act-status` pill `separable ✓ — margin m` / `not separable`.
  - Presets: Identity, ReLU cut (λ=1), Paper fold (λ=2), Overshoot (λ=2.5), tanh smooth,
    Bias inside (c<r₁), Bias outside (c>r₂). Sliders: c, λ, s (with `.af-hint`s).
- **Prose**: `### Separating a ring with one fold` between the fold card and
  `## Unthreading a chain` — no-line-can-separate argument, the three bias cases,
  Keup & Helias tie-in (existing citation `keup2022origami`).
- **CSS**: `#act-src,#act3d-canvas` added to the aspect-ratio rule.
- **Guard**: `THREE_3D` 3→4 (docstring updated); all 7 guards pass.

### Verified headless (`/tmp/opencode/verify_a2.py`)

- all elements boot, zero `.af-err`, `radialLiftExposed: true`, all 3 canvases draw
- preset physics: bias-outside → not separable; bias-inside → margin 0.225; tanh →
  margin 0.339 with `\tanh` in eq; identity → not separable; relu-cut → margin 0.115
- copy dialog on `#act-eq math` opens with the full aligned LaTeX
- no regressions: af2d/af3d/fd2d/u3d equations all render
- bug caught & fixed in review: `mp.far` → `mp.L.far` in `updateEq` (far-side branch
  never rendered before)
- validators: php -l OK, js_validator 0 errors, lesson_guard PASS, php_validator only
  the known line-76 false positive

### Optional polish (not requested, parked)

- tanh preset could auto-dim the λ/s hints per activation
- a "straight cut can't do it" animated line in the 2D source (prose covers it)
- screenshot/visual pass by a human: 3D sheet shading + separator plane legibility

## 2a. (old spec, kept for reference)

**Goal:** interactive demo of how tanh(x), ReLU(x), … behave on the *circle-in-a-circle*
(a.k.a. ring-in-ring / target) problem — the flat 2-D cousin of the Hopf link, and Keup &
Helias's test case. Folding must make a problem that no straight line can solve suddenly
separable by a flat cut.

### Concept

Data: two concentric circles of labeled points inside the unit square (inner = one class,
outer ring = other). A **radial fold** at crease radius `c` with strength `λ`:

    r ↦ r − λ·ReLU(r − c)          (ReLU fold — the bent paper)
    r ↦ c + a·tanh((r − c)/s)      (tanh — smooth, bounded push)

- ReLU "cuts off": far side (outer ring) is pushed in / lifted; at λ=1 it lands on the crease.
- tanh "pushes at the border" smoothly — curved (not flat) sheet, no sharp corner.
- In the **bent 3-D space** the outer ring sits at a different height → a **flat plane**
  (horizontal cut) separates the classes. That is the whole point: *curved space + flat cut*.
- **Bias = crease offset c.** Settings to expose:
  - c between the two radii → only the outer ring moves (cleanest)
  - c < inner radius → both rings lift (still separable, different heights)
  - c > outer radius → nothing folds (no change, still not separable)

### Layout (match the house style — reuse everything learned from F2/U3)

New card `#act-2d` after the fold card, new subsection
`### Separating a ring with one fold` (inside `## The fold` group, before `## Unthreading a chain`).

- **Left col:** 2-D source canvas (440×440, fluid square) — inner circle (accent),
  outer ring (bad/warn), dashed cyan **crease circle** at radius c, unit-square frame + grid
  (same look as F2 source). Click to track a point.
- **Right col top:** 3-D "curved space" canvas (same projection/nav as F2 3-D —
  reuse `bind3DNav`, `drawAxes3D`): the two rings as tubes/point-clouds on the bent sheet,
  translucent **separator plane** between them; plane color = good (separable) / bad (not).
- **Right col bottom (or below):** 1-D activation curve — x ↦ fold(x; c, λ, act) with the
  identity dashed, crease at x=c marked, curve in accent (like the existing `fd1d-canvas`).
- **Sliders** (top of card, above the plots — same convention as F2 now):
  - Activation: preset buttons — `identity`, `ReLU cut (λ=1)`, `ReLU fold (λ=2)`,
    `tanh smooth`, `overshoot (λ=2.5)` (class `af-presets`/`af-btn`)
  - Crease radius c (bias) 0.05–0.95
  - Fold strength λ 0–2.5
  - (tanh only) steepness s
- **Live equation** (`.af-eq`, right-clickable via `annotate:true`, one `aligned` block):
  the activation formula, then for the tracked point the full numeric step-by-step
  (r, r−c, ReLU(·)/tanh(·), new radius, new z-height) via `termLineTex`-style rendering.
- **Readout pill:** `separable ✓ / ✗ — margin m` (compute min gap between the two lifted
  rings vs the plane) — this is the "did the fold work?" signal.
- **Self-contained module code:** append to `math_iv_affine.js` as Lab A2 with `initA2()`,
  added to `bootAll()`; expose math core on `window.__affineMath` (Fold already has the 2-D
  primitives; add `Fold.radial2` or reuse `apply2` with a normal per point).
- **Prose (short):** tie to the Origami/Keup & Helias paragraph already in the unlink section
  ("their 2-D test case — a ring inside a ring — is the flat cousin of the chained rings");
  explain bias = where you cut, λ = how far you push, and why a flat cut then works.

### Guard updates when building

- `lesson_guard.py`: THREE_3D canvases → 4 (add act3d to bind3DNav/drawAxes3D counts).
- Keep raw div balance; any new `##`/`###` headings inside `<div class="md">` (G1).

## 3. Housekeeping

- Untracked files from earlier sessions: `blog/tests/typography_fix.html`, `blog/tests/typography_fix.sh`
  (not agent-created — leave alone unless asked).
- php_validator known false positive: math_iv.php "line 76 div never closed" — raw divs
  balanced 90/90, page renders fine.
- User commits in parallel — always re-check `git status`/`git diff` before assuming state.
