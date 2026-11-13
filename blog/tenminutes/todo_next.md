# LearnSys — status after the latest pass

Legend: `[x]` done, `[~]` implemented but needs visual verification, `[ ]` still todo.

## Structure, mobile, centralisation
- [x] 31-slide story: intro → compression → neural nets → tokenizer → transformer → assistant/eval/RAG → history/philosophy.
- [x] Intro merge: Suche / Chat / Code on one slide, no auto-advance.
- [x] Removed the duplicate “Eine Schicht, dann der Stapel”; merged embedding pairs.
- [x] Mobile demo-first layout; text overlays the demo and closes again.
- [x] Global bottom-left/back and bottom-right/next arrows.
- [x] Repeated helpers centralised: `clamp`, `smoothstep`, `hexMix`, `arrowKey`, `goNext`, `goPrev`.

## Phone / chat
- [x] User types at the bottom; Enter is simulated; message appears above.
- [x] LLM label and answer bubble appear only with the first answer token.
- [x] Answer explains Google summary ≈ language model ≈ this chat, and that the next word is appended and the text returns as context.
- [~] Input grows while typing; speed halved. Verify on the phone.
- [x] Compose box appears smoothly for typing and answering.

## Agent / code slide
- [x] Prompt is typed into the bottom `$` shell.
- [x] `himmel.py` and code appear only when code typing starts; window is uniform before.
- [x] Taskbar Agent/Terminal buttons focus windows; no minimize/maximize buttons.
- [x] Start menu has a playful local joke.
- [x] `python3 himmel.py` types in about 300 ms with randomised delays.

## Compression
- [x] Dense 144-node graph; cross-edges disappear into groups.
- [x] Hierarchical levels: nodes → subclusters at their centroids → groups → one point → larger connected whole.
- [x] Auto mode now steps one level at a time, slower.
- [x] “Weiter” advances exactly one level.
- [x] Lossless vs lossy text: tokenization lossless, transformer lossy.
- [x] Training text: incomplete/contradictory data, realistic world model, prediction over many cases.
- [x] Gravity example: newborn → adult → physical theory.
- [~] Final zoom-out connected-points visual: verify the level-4 look.
- [ ] Still make the whole slide mouthwateringly gorgeous; current graph is functional, not the final visual.

## Sinus neural network
- [x] Real TF.js model x → 32 → 32 → 32 → 1, Dense + ReLU.
- [x] User must press “Training starten”; no auto-start.
- [x] Loss curve below the canvas.
- [x] Sinus visible left and right outside the training range.
- [x] Data points labelled as (x, y) = (input, output).
- [x] Dragging points changes the training data; pause when not visible.

## Loss landscape (parameters)
- [x] Real worker model 1 → 4 → 1, 13 parameters, 21×21 surface, network diagram, ball/trajectory.
- [x] “Weiter” advances the ball/training; at the end it goes to the next slide.
- [x] Real data points shown in the side panel.
- [x] Real network and loss formula shown and typeset.

## Loop landscape
- [~] Camera raised to a near-top isometric view; quads depth-sorted back-to-front.
- [ ] Visual check that rear valleys no longer overlap front valleys.

## MLP / manifold
- [x] Fine point-cloud/neighbourhood graph; “Weiter” raises the bend.
- [x] Old controls/dots hidden; dense controls at the bottom; sigmoid; preset walk; half-width weight sliders.
- [~] Copy block no longer stacks; verify all 9 steps.
- [ ] Real one-layer network formula and real loss values from the `loss_landscape` reference (currently still schematic).

## RAG / agents
- [x] Chunks, scores, context insertion, cited answer, agent loop.
- [ ] Final wording/source polish only if needed.

## Final gate (do only when everything is done)
- [ ] Bilingual EN/DE audit, height test, page test, `check_all.py --fast`.
- [ ] Commit and push.

## New requests (latest)
- [ ] Rework the whole system again, then generalise the tools it needs (shared scene/nav/lesson utilities).
- [ ] Make “Verstehen heißt komprimieren” much more mouthwateringly gorgeous and visual; use category-theory/Yoneda intuition internally, but do not mention it in the page.
- [x] “Ein kleines Netz lernt den Sinus”: “Weiter” starts training.
- [x] Sinus loss chart switched to log scale so the curve is visible.
- [x] “Weiche Kurven, ein Knick”: activation functions shown one after another via Weiter/Zurück.
- [ ] Still verify the activation sequence and sinus loss chart in the browser at the end.

## Latest queue — sorted fastest first
1. [x] **Causal mask (quick).** Default on; checkbox visible left; text left says the upper triangle is the causal mask and why: tokens see only the past so they learn to complete sentences whose end they do not yet know. Rename `vSatzzeichen` → `v_Punkt`; draw the self-connection.
2. [~] **Trajectory “Weiter” (quick).** Make every Weiter step advance one GPT-2 layer visibly; verify it does not jump to the next slide.
3. [x] **Position demos real height data (medium).** “Relativer Abstand im selben Satz” and “Jeder Platz bekommt einen Fingerabdruck” are distorted like the loss; use the real positional height data where each belongs.
4. [x] **Manifold Vietoris–Rips (medium).** “Von Beziehungen zur Übersetzung”: build the shapes from their points as a Vietoris–Rips complex, not heavy surfaces; reuse the “Die Verteilung ist nicht die Antwort” canvas framework; keep it light.
5. [x] **Loss landscape rebuild (large).** Replace the broken surface with a real computed loss landscape like `../../loss_landscape.html`; real training; live Temml formula below showing the current point; optimizer sequence on Weiter: SGD → Adam → Momentum; show SGD’s direct path, Adam’s variation and damping of frequently updated parameters / strengthening of rarely updated ones; add an optional box on local minima vs high-dimensional saddle points (research/verify claim).
6. [x] **Compression gorgeous (large).** Make “Verstehen heißt komprimieren” mouthwateringly beautiful; internal category-theory/Yoneda intuition, never named on the page.
7. [ ] **Whole system generalisation (large).** Rework the system and generalise shared scene/nav/tool utilities.
8. [x] **MLP real formula/loss (medium, after loss landscape).** Real one-layer formula and real loss values from the verified reference.
9. [ ] **Final gate.** Bilingual audit, height test, page test, `check_all.py --fast`, syntax/diff checks; commit and push only then.

## Progress after implementation pass
- [x] Causal mask is on by default; checkbox is visible at the left of the attention demo, explanatory text is in the left context, `v_Punkt` replaces `vSatzzeichen`, and the self-loop is drawn.
- [~] Token trajectories: scene already exposes `next`/`prev` and advances the layer; still needs the end-to-end browser click check.
- [x] Position demos: the 3D fingerprint curve now uses the real sinusoidal dimensions, and the relative-distance plot computes Sinus/ALiBi/RoPE from their formulas instead of schematic curves.
- [x] Manifold demo: two point clouds with Vietoris–Rips edges on a canvas, matching label links, drag/zoom; no Plotly or heavy surfaces.
- [x] Loss landscape: real 1→4→1 worker, SGD/Adam/Momentum trajectories, live Temml formula with α/β/L, optimizer sequence on Weiter, optional saddle-point box with sources.
- [x] Compression: denser visual language, fibres through the hierarchy, glow/rings, universal hub and unseen-case arrow; category/Yoneda not named.
- [x] MLP: added a live logistic-loss formula computed over the actual point cloud.
- [ ] Whole-system/general shared-tools pass.
- [ ] Final browser audit and test gate.

## Camera (Ein Wort nach dem anderen)
- [x] Temporary red capture button was used and then removed.
- [x] Default installed: `camera: { yaw: -0.86, pitch: 0.918, zoom: 1 }`.
- [x] Top view on “Die Verteilung ist nicht die Antwort” remains independent.


## Newest requests — taxonomy, blocks, tokenizer
1. [x] **Compression taxonomy.** Replace the abstract 144-node example with a named biological taxonomy ladder: Hauskatze/Katzenartige → Säugetiere → Wirbeltiere → Bilaterien → Tiere → Eukaryoten → Lebewesen → Etwas. Show objects, mathematical facts, and thoughts joining at the top. Make the structure visibly emerge as details are forgotten.
2. [x] **Blocks earlier + mini demos.** Move “Die Bausteine eines LLM” before the neural-network details. Show T, E, then many repeated A/FFN layers indented, then U. Add tiny demos for Tokenizer, Embedding, Attention, FFN, Repeat, Unembedding. Make it gorgeous.
3. [x] **Tokenizer slide.** Center “Text wird zu IDs”. Fix “Beispiele”: Weiter must step through the examples, not do nothing. Add the advantage below: subwords let the model read new words from context and word parts.
3b. [x] **Camera bleed:** at the end, “Die Verteilung ist nicht die Antwort” changes the camera; keep its top view independent from the default camera on “Ein Wort nach dem anderen”.
4. [~] **Token trajectories.** Fixed the `li` shadowing bug and made the max layer dynamic; readout now updates during the tween. Browser click check still open.
5. [ ] **Whole-system generalisation.**
6. [ ] **Final gate.**

## Status snapshot
- [x] Camera default: `yaw -0.86, pitch 0.918, zoom 1`; capture button removed; top view preserved.
- [x] Compression: named taxonomy, 12 → 4 → 2 → 1, Etwas at the top, labels in the plot.
- [x] Bausteine moved before the neural details; T/E/A/FFN×80/U stack with mini demos.
- [x] Tokenizer: centered title, example stepping fixed, subword/new-word advantage added.
- [~] Token trajectories: visual ghost segment and layer readout added; browser click check still open.
- [ ] Whole-system generalisation.
- [ ] Final gate.


## Regression fix
- [x] Restored the scene functions accidentally removed by the blocks-scene rewrite: media, book, compress, stack, animal, activation, langdata, chineseroom, history, posttrain, eval, gradient, kvcache.
- [x] `SCENES` now has no undefined function references; “Demo nicht gefunden: intuition” should be gone.
- [~] Token trajectories still need the end-to-end click check.
- [ ] Whole-system generalisation.
- [ ] Final gate.

## Current status after regression + follow-ups
- [x] Removed the microphone and the bottom waveform from the phone demo.
- [x] Landscape stops after `<|endoftext|>`; the ball snaps to its final point and no further animation loop runs.
- [x] Compression starts with living things already grouped in local regions; non-living cases (number 7, dreams, …) appear only at the end and then fall under **Seiendes**.
- [x] Restored missing scene functions; all `SCENES` entries are defined.
- [~] Token trajectories still need the end-to-end click check.
- [ ] Whole-system generalisation.
- [ ] Final gate.

## Detailed next work — Bausteine and loss landscape
### Bausteine eines LLM
- [ ] Replace the 7 repeated A/FFN rows with one vertical `Attention` row and one `FFN` row, enclosed by a bracket/arrow labelled `diese n mal` / `these n times`.
- [ ] Stack hierarchy must be: `T` tokenizer → `E` embedding → `Transformer-Blöcke` → `U` unembedding. The transformer group contains Attention first, then FFN. Attention/FFN must not sit under Embedding.
- [ ] The transformer-level detail must say: this block runs dozens to hundreds of times in a row; each block has its own weights; the running vector is updated, not overwritten.
- [ ] The Attention detail must say: it determines how important every word is for every other word, then mixes the token information according to those weights.
- [ ] The FFN detail must use the `new` + `york` example: separately “new” is like “neu” (Neuwagen) and “york” is a place in England; directly together they mean the US metropolis. The FFN shifts the tokens so that the unembedding gets the right angle. FFN comes after Attention.
- [ ] Add the roadmap note: from this slide we will go into Attention and FFN on the next days, one after the other, each explained intuitively: what it does and why.
- [ ] Redesign every mini demo image in the Bausteine slide: consistent size/aspect ratio, crisp alignment, no stretching, mouthwateringly gorgeous. This is its own large point.
- [ ] Fix navigation: the Back/Next buttons must sit fixed at the edge and never overlap content; add reserved padding/scrolling so the detail area cannot slide under them.

### Loss landscape — two-parameter linear model
- [ ] Replace the 13-parameter 1→4→1 model with `ŷ = a·x + b`: exactly two parameters, weight `a` and bias `b`.
- [ ] Plot the loss surface with `a` on the x-axis and `b` on the y-axis; compute `L(a,b) = 1/n Σ (a·x_i + b − y_i)²` from a visible list of predefined example pairs `(x_i, y_i)`.
- [ ] Show the example list in the demo (values visible to the reader), and mark the current `a`, `b`, loss, and predictions.
- [ ] Training starts automatically when the slide opens or via the offered train button; the user must not have to press Weiter for every training step. Weiter should only leave the slide when training/demo is done.
- [ ] Animate the real trajectory on the surface for SGD, Adam, and Momentum; keep the direct-vs-adaptive comparison and the saddle-point optional box.
- [ ] The Temml formula below the plot must be the actual network/loss: `ŷ = a x + b`, `L = 1/n Σ (ŷ_i − y_i)²`, with live values substituted for `a`, `b`, and `L`.
- [ ] Ensure axes, labels, contour/height colours, and the formula stay readable in EN/DE and both themes.


## Token trajectory fix
- [x] Verified in headless Chromium: Weiter moved Layer 0/12 → 1/12 and updated the readout.
- [x] The layer label collision loop reused the variable `li`, overwriting the active layer index for every later token. Renamed it to `lbi`.
- [x] `setLayer` now updates the readout during the tween, not only before it.
- [x] Max layer is derived from `data.points[0].length`; slider/next/readout use it.
- [x] Added a dashed segment from the previous layer position to the current marker.
- [x] Browser click check passed.


## Newest requests — linear network, matrices, 3D manifold
### Rename and expand “Ein kleines Netz lernt den Sinus”
- [ ] Rename the slide to “Was sind neuronale Netze?” / “What are neural networks?”.
- [ ] First demo: a single linear layer with **one neuron** fitting a line: `ŷ = w·x + b`. Show the network formula, the current line, and the vertical distances/errors to the data points live during training.
- [ ] Show explicitly that this one-neuron network can only approximate a line, never a more complex function such as a sine. Conclude that more neurons and larger networks are needed.
- [ ] Only then show the sine example.
- [ ] In both examples, show the weight matrices live during training so the reader sees them improve; hide the larger sine matrices behind an optional “show matrices” disclosure.
- [ ] Keep the one-neuron linear example simple enough to be unintimidating; it is the entry point.

### “Von Beziehungen zur Übersetzung”
- [ ] Rebuild the demo as a true 3D Vietoris–Rips complex of two **Pringle-shaped manifolds** that are twisted relative to each other in space.
- [ ] Keep it lightweight: points plus Rips edges, genuine 3D projection/rotation, no broken surface or flat fake.
- [ ] Preserve the correspondence lines, drag/zoom, and bilingual labels.

### Token trajectories
- [x] Verified in headless Chromium: step 21 is the slide; clicking Weiter moves Layer 0/12 → 1/12 and updates the readout.


## Verification pass
- [x] Headless Chromium: page loads, no fatal scene errors; token trajectories step 0→1.
- [x] Blocks slide: Transformer group has one Attention + FFN, roadmap, 2 sub-demos; next reaches Unembedding.
- [x] Loss landscape: 2-parameter model, examples list, live formula, training runs SGD→Adam→Momentum automatically.
- [~] Mini-demo polish and fixed navigation still open.
- [~] Manifold: Pringle-style 3D point clouds with Rips edges implemented; browser visual check still open.
- [ ] Sinus/linear-network restructure.


## Latest verified state
- [x] Token trajectories: headless Chromium moved Layer 0/12 → 1/12.
- [x] Bausteine: group stack, detail text, new+york, roadmap, sub-demos; page loads.
- [x] Loss landscape: two-parameter model, examples, live formula, automatic SGD→Adam→Momentum.
- [~] Manifold: two 8×8 Pringle point surfaces, target rotated in 3D, Rips edges; canvas renders. Visual quality still needs a human look.
- [ ] Mini-demo visual polish and fixed navigation check.
- [ ] Linear-network slide restructure (one neuron, errors, linear limit, then sine; live/hidden matrices).
- [ ] Whole-system pass and final test gate.

## Correction batch — position, credit, causal mask, ambiguity
### “Jeder Platz bekommt einen Fingerabdruck”
- [x] Re-derived both views: Euclidean uses ||p(t)-p(0)||; angle uses arccos(p(0)·p(t)) on unit vectors.
- [x] Removed the “Relativer Abstand im selben Satz” graphic entirely.
- [x] Added the circular-orbit / different-frequency explanation.
- [x] Re-checked the plot logic; removed “Gerade im Raum”.
- [x] Bilingual copy updated.

### Page chrome
- [x] Removed the demo credit.

### Causal mask
- [x] Added evaluation-vs-generation distinction to context and mask details.

### “Wörter allein sind mehrdeutig”
- [x] Inline LaTeX rendering for new/york/new york added.
- [x] Slider/heading/copy renamed to neighbourhood/neutral words.
- [x] Neutral-neighbourhood examples added.
- [x] New York landmark labels added.
- [x] Bilingual copy updated.

## Correction batch status
- [x] Position math rewritten: start-relative Euclidean distance and unit-vector great-circle angle; removed methods plot and “Gerade im Raum”; circular-wave note added.
- [x] Demo credit removed.
- [x] Causal mask distinction added.
- [x] Ambiguity slide now uses inline LaTeX tokens, neutral neighbourhoods, York variants, and New York landmarks.
- [~] Browser visual check of the position scene still pending; full tests remain for the end.

## New ordering + unembedding slide + Bausteine overhaul
### Slide order
- [ ] Move “Ein Wort nach dem anderen” far to the end, after the transformer/attention/FFN material.
- [ ] Insert a new Unembedding slide immediately before “Ein Wort nach dem anderen”.

### New Unembedding slide
- [ ] Show how the angle between two vectors is computed: dot product, norms, `cos θ = (u·v)/(|u||v|)`, then `θ = arccos(...)`.
- [ ] Show how the angle is measured in space with two embedding vectors and a visible arc between them.
- [ ] Explain why angle instead of distance: in high dimensions Euclidean distances lose contrast; most points are roughly similarly far apart, while directions remain informative. The network’s distances can also vary strongly.
- [ ] Show the learned Unembedding matrix `W_U` and the multiplication `logits = h · W_U^T` (or `W_U h` depending on layout), with a concrete small matrix.
- [ ] Show how logits become a probability distribution via softmax, and how one token is chosen.
- [ ] Make this a mouthwateringly gorgeous canvas/SVG demo in the same visual language as the other scenes: vector pair, angle arc, matrix multiply, scores, softmax bars.
- [ ] Bilingual EN/DE, informal du, LaTeX for formulas.

### “Ein Wort nach dem anderen”
- [ ] Reframe it as the repeated loop after unembedding: choose a token, append it, run attention/FFN again, compute the next distribution, and crawl through the high-dimensional space step by step.
- [ ] Keep the camera default and the existing landscape; make the repetition explicit in the copy.

### Bausteine eines LLM — full overhaul
- [ ] Reduce clutter substantially: fewer simultaneous labels, cleaner hierarchy, stronger visual focus.
- [ ] Redraw the mini graphics consistently, with correct aspect ratios and no stretching/distortion.
- [ ] Keep the T → E → Transformer-Blöcke (Attention → FFN, × N) → U structure and the new Attention/FFN explanations.
- [ ] Ensure the redesigned graphics are gorgeous and readable on desktop and mobile.

## Unembedding: dot product + GPU lineage
- [ ] In the new Unembedding slide, show the **dot product** explicitly and as a per-component multiply-accumulate: `u·v = Σ u_i v_i`, then the norms, cosine, and `arccos`.
- [ ] Show the learned unembedding matrix multiplication as a stack of dot products: every row of `W_U` is compared with the final vector `h`; each row produces one logit.
- [ ] Add the GPU/hardware point: 3D gaming and real-time graphics already required massive parallel matrix/vector math, lighting dot products, and 4×4 transforms. GPUs evolved for that workload (hardware transform-and-lighting, programmable shaders, SIMT execution, CUDA, tensor cores), so transformer matrix multiplication could reuse existing parallel hardware.
- [ ] Technical details to check and cite before writing:
  - GeForce 256 (1999) marketed as the first GPU with hardware transform and lighting; 4×4 matrix-vector transforms and lighting dot products.
  - Programmable vertex/pixel shaders (DirectX 8/9 era) made GPUs general-purpose enough for non-graphics math.
  - CUDA (2007) exposed massive data-parallel compute; OpenCL followed.
  - SIMT/SIMD execution: the same multiply-accumulate runs across many lanes/pixels/vertices.
  - Tensor Cores (Volta, 2017) added dedicated matrix multiply-accumulate units, later used directly by transformer training/inference.
- [ ] Keep it short and vivid: the same dot-product/MAC operation that shades a 3D scene also computes logits.
- [ ] Add named sources with working links in the slide sources, EN and DE.

# AGENT HANDOFF — read this before touching the LearnSys lesson

## 1. What this page is
- Files live in `blog/tenminutes/`.
- `intuition_learnsys.php` is the shell. It loads, in order:
  `../temml.min.js`, `assets/site.js`, `learnsys.js`, `../manifold_scenes.js`,
  `assets/space-morph.js`, `intuition_gpt2_data.js`,
  `assets/loss-landscape-scene.js`, `assets/rag-scene.js`, `assets/tf.min.js`,
  `assets/tf-sinus-scene.js`, `intuition_learnsys-demos.js`,
  `intuition_learnsys-data.js`.
- `intuition_learnsys-data.js` owns slide content and `steps` order.
- `intuition_learnsys-demos.js` owns the `SCENES` registry and most demos.
- `learnsys.js` is the generic engine: mount, next/prev, text, arrows. Do not
  change its public API without checking every lesson that loads it.
- `intuition_learnsys-demos.js` ends with
  `LearnSys.defineDemo("intuition", function (root, api) { ... })`. That wrapper
  mounts the scene named in `demoState.scene` and forwards `.next()` / `.prev()`.

## 2. Hard-won traps
### Do not replace a range up to `var SCENES` blindly
A previous edit replaced everything from `function blocksScene` to `var SCENES = {`.
That silently deleted `mediaScene`, `bookScene`, `compressScene`, `stackScene`,
`animalScene`, `activationScene`, `langdataScene`, `chineseroomScene`,
`historyScene`, `posttrainScene`, `evalScene`, etc. The page then failed with
`Demo nicht gefunden: intuition` and `ReferenceError: mediaScene is not defined`.
After every scene edit, run this check:

```bash
node - <<'NODE'
const fs=require('fs'); const s=fs.readFileSync('blog/tenminutes/intuition_learnsys-demos.js','utf8');
const m=s.match(/var SCENES = \{([\s\S]*?)\n  \};/); const body=m?m[1]:'';
const re=/^\s*(\w+):\s*([A-Za-z0-9_]+),/gm; let x, undef=[];
while((x=re.exec(body))){ const name=x[2];
  if(!new RegExp('function\\s+'+name+'\\s*\\(').test(s)) undef.push(x[1]+':'+name);
}
console.log(undef.length ? undef : 'all SCENES functions defined');
NODE
```

### Token trajectories
- The real bug was variable shadowing in `draw()`: the label collision loop used
  `var li` and overwrote the current layer index. It is now `lbi`.
- The readout now updates inside the tween, max layer is derived from
  `data.points[0].length`, and a dashed segment shows the previous→current move.
- Verified with headless Chromium: step 21 is the slide, and Weiter moves
  Layer 0/12 → 1/12.
- Do not revert the `li`/`lbi` rename.

### Camera
- “Ein Wort nach dem anderen” default camera:
  `camera: { yaw: -0.86, pitch: 0.918, zoom: 1 }` in both EN/DE step data.
- The temporary red capture button was removed. Do not re-add it.
- “Die Verteilung ist nicht die Antwort” uses `view: "top"` and must stay
  independent of the default camera. `loopScene.update` applies `s.camera`
  first, then `view`.
- After `<|endoftext|>` the ball must stop; `drawLandBall` now snaps on EOS and
  clears `landTrail`. Do not reintroduce an auto rAF after EOS.

### Loss landscape
- `assets/loss-landscape-worker.js` and `assets/loss-landscape-scene.js` were
  rewritten for the requested **two-parameter** linear model:
  `ŷ = a·x + b`, axes `a` and `b`, visible examples, real MSE.
- Worker cache bust is important: the scene loads
  `assets/loss-landscape-worker.js?v=4`. Bump it when changing the worker.
- `next()` starts training if idle; while training it returns true (stay);
  after completion it returns false (leave slide). Do not restore per-step Next.
- Training auto-runs SGD → Adam → Momentum. `R`/pause/reset are present.
- Verified: examples render, formula renders, training advances and ends.

### Blocks
- `blocks` is now 4 stations: Tokenizer, Embedding, Transformer blocks,
  Unembedding. The old separate “Repeat” station was removed.
- Stack is T → E → Transformer blocks → U. The transformer group has one
  Attention pill and one FFN pill inside a green brace, head says
  `× N · diese n mal`.
- Transformer detail must keep: repetition dozens–hundreds, attention weights
  and mixing, FFN after, `new`+`york` → US metropolis, unembedding angle,
  roadmap for the next days.
- Mini canvases use the shared `api.fit`; keep aspect ratio and no stretching.
- Nav is a grid row with a top border; do not turn it into an overlay.

### Position
- The old “Relativer Abstand im selben Satz” canvas and `drawMethods` are gone.
- Euclidean: distance between `p(t)` and `p(0)`.
- Angle: unit vectors, `arccos(dot)`, great-circle arc; start is `p(0)`, not
  `[1,0,0]`.
- Top label “Gerade im Raum” removed. `curve.__lsPosition` exposes
  `{pos, metric, start, current, distance, angle}` for checks.
- `positionScene` keeps a `ls-position-note` explaining circular waves and
  different frequencies.

### Causal mask / ambiguity
- Causal mask is on by default and visible.
- Copy distinguishes generative models from models that score finished text.
- Ambiguity slide uses inline Temml `data-tex="\\text{new}"` etc.; it calls
  `api.typeset(el)` after mount. Slider/heading use “Nachbarschaft”, not
  “Kontext”. The text names car/future/New Year/curiosity, York variants, and
  Empire State Building/Statue of Liberty.

### Manifold
- `manifoldScene` is a canvas 3D Vietoris–Rips demo: two 8×8 Pringle point
  sheets, target twisted in 3D, edges within radius, correspondence lines,
  drag/zoom.
- Canvas renders at ~756×240 in Chromium. Human visual judgement is still
  pending; it may need point/edge density tuning.

### Credit
- The `credit` field was removed from the day object. Do not restore
  “Interaktive Demo · Ten Minutes”.

## 3. Current open work (priority order)
1. **Unembedding slide** before “Ein Wort nach dem anderen”:
   - dot product `u·v = Σ u_i v_i`, norms, cosine, arccos;
   - two vectors + visible angle arc;
   - why angle beats Euclidean distance in high dimensions;
   - learned `W_U`, row-wise dot products, logits, softmax, token choice;
   - GPU lineage: 3D transform/lighting dot products, programmable shaders,
     SIMT, CUDA, tensor cores. Cite sources.
2. Move “Ein Wort nach dem anderen” after transformer/attention/FFN; reframe as
   the repeated unembedding loop.
3. Bausteine full visual overhaul: less clutter, better undistorted graphics.
4. Rename/extend “Ein kleines Netz lernt den Sinus” to “Was sind neuronale
   Netze?”:
   - one neuron `ŷ = w·x + b`, vertical errors, line-only limit;
   - then sine and larger matrices; matrices live during training, larger ones
     behind an optional disclosure.
5. Position browser visual check, manifold visual check, mini-demo polish.
6. Final bilingual/test gate.

## 4. Useful verification commands
```bash
node --check blog/tenminutes/intuition_learnsys-demos.js
node --check blog/tenminutes/intuition_learnsys-data.js
node --check blog/tenminutes/assets/loss-landscape-scene.js
node --check blog/tenminutes/assets/loss-landscape-worker.js
git diff --check -- blog/tenminutes

php -l blog/tenminutes/intuition_learnsys.php
uv run blog/tests/php_validator.py blog/

# full page audit at the end
uv run blog/tests/tenminutes_pages_test.py --pages intuition_learnsys.php --langs en,de
uv run blog/tests/tenminutes_height_test.py --pages intuition_learnsys.php --langs en,de --viewports desktop,mobile --monkey 4
python3 blog/tools/check_all.py --fast
```

### Headless debugging that worked
A PHP server plus Chromium remote debugging was used. Port 8099/8101/8123 were
already occupied; pick a free port. Chromium CDP allowed:
`Runtime.evaluate` → `LearnSys.go(0, n)` to find a slide by its title, then
`document.querySelector('#ls-next').click()` and inspect
`canvas.__lsTraj` / `.ls-traj-readout`.

## 5. Rules that will bite you
- Every EN string needs its DE counterpart. Test both.
- No em/en dashes in lesson prose; use commas/colons/parentheses.
- No new accent colours; use the existing palette.
- Display equations get two levels of `\underbrace`.
- Do not add CDN scripts. TF.js and Temml are vendored.
- `git` may auto-commit mid-session. Check `git status`; never use
  `git stash`/`git stash pop` as a daily tool.
- There is an untracked `todo_ddd` file with the user’s raw notes. Do not
  overwrite it.
- Full tests are intentionally deferred until the page work is done, but
  static syntax checks and targeted headless checks are allowed.
