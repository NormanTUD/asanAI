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

## Agent session log (2026-11-13)

- Read this file completely and audited the current implementation:
  `intuition_learnsys.php`, `intuition_learnsys-data.js`,
  `intuition_learnsys-demos.js`, `learnsys.js`, `learnsys.css`,
  `assets/tf-sinus-scene.js`, `assets/loss-landscape-*.js`, `assets/rag-scene.js`.
- Canonical open work set used for planning: whole-system generalisation,
  new Unembedding slide, move/reframe “Ein Wort nach dem anderen”,
  neural-network restructure, Bausteine overhaul, manifold and compression
  visual passes, browser visual checks, final bilingual/test gate.
- Several earlier unchecked boxes are already implemented in code and are
  logged as verify-only rather than rewrite: two-parameter loss landscape,
  Bausteine stack/details, compression taxonomy, MLP loss formula, token
  trajectories, causal mask, position math, ambiguity slide.
- Opencode todo list created and kept in sync with this file.

### Implementation pass 2026-11-13 (afternoon)

Done:

- **Shared visual layer.** Added `assets/learnsys-visuals.js` with palette
  mixing, arrows, labels, grid, 2D/3D projection, heatmaps, and token chips.
  The new Unembedding scene is its own file, so scenes no longer have to grow
  inside the 8k-line demo file.
- **New Unembedding slide** (`assets/learnsys-unembed-scene.js`): five steps
  (dot product/MAC, angle/cosine/arccos, W_U rows and logits, softmax and
  token draw, GPU shading). Includes the high-dimensional angle argument and
  verified sources (Aggarwal 2001, NVIDIA CUDA, Tensor Cores, CUDA guide,
  GeForce 256).
- **Slide order** now has 32 steps. “Ein Wort nach dem anderen” and “Die
  Verteilung ist nicht die Antwort” moved after the transformer material,
  immediately after the new Unembedding slide and the real GPT-2 softmax
  slide. The loop copy now closes the circle back to W_U and softmax.
- **Kicker numbers removed** from every step so the old thematic numbering
  cannot contradict the new order.
- **Neural-network slide** renamed to “Was sind neuronale Netze?”. The scene
  now starts with one linear neuron (`ŷ = w x + b`), draws the vertical
  errors, shows the line cannot bend the sine, then switches to
  `1 → 32 → 32 → 32 → 1`. The four weight matrices are a live overlay
  (behind “Matrizen zeigen”), training runs on CPU, starts automatically,
  pauses offscreen, and the loss chart is logarithmic.
- **Bausteine** rebuilt as one clean vertical stack (T → E → transformer
  group → U), with clickable stations, a green brace and `× N` badge,
  larger 16:9 mini demos, and the `new` + `york` FFN example.
- **Manifold** rebuilt as two 10×10 Pringle point sheets, one twisted
  relative to the other, with Vietoris–Rips edges, a radius slider, five
  bilingual word correspondences, drag/zoom, and slow idle rotation.
- **Compression** polished: phase pill, Barlow category labels with colour
  dots, softer paper glow, final “Seiendes” halo, and an unseen-case arrow
  into the universal hub. Category/Yoneda is still never named.
- **Loss landscape** starts training automatically when visible, pauses
  offscreen, and “Next” only leaves after SGD → Adam → Momentum finish.
- **Navigation** reserves a safe area above the fixed bottom arrows, and the
  height test now ignores slide-navigation controls and the language switch.

Tests so far:

- `uv run blog/tests/tenminutes_pages_test.py --pages intuition_learnsys.php
  --langs en,de` → **10/10 checks passed, 0 failed**.
- First `tenminutes_height_test.py` run reported 6 height changes and a
  crash. The changes came from the step-rail buttons (`9`, `10`) navigating
  between slides, and the crash came from the DE/EN language button
  reloading the page. Both now carry `data-no-height-test`.
- Targeted headless checks: all 32 steps render, no severe console errors,
  no horizontal overflow at 1400×1000; Unembedding steps 1–5 update readouts;
  sinus linear → net training and live matrices work; blocks stations and
  minis switch; manifold radius and auto-rotation change the canvas; loss
  landscape auto-starts and `Next` stays while training.

Still open:

- Rerun the height test after the navigation exclusions.
- Browser visual pass at 390 px and 1280 px, both languages.
- Final gate: `check_all.py --fast`, `php_validator.py`, `php -l`,
  `node --check`, `git diff --check`.
- Commit and push only after the gate and only with explicit approval.

## Latest user requests (2026-11-13 evening)

Status: implementation pass above is done and the page/height tests pass;
the following reorder and scene changes are the new active work.

### Slide order after “Die Bausteine eines LLM”
- [ ] Keep “Die Bausteine eines LLM” exactly where it is.
- [ ] Immediately after it: **Tokenizer** (“Text wird zu IDs”).
- [ ] Then **Embedding**: “Bedeutung wird eine Zahl” (1D), the 2D slide,
  the 3D slide, and an explicit **high-dimensional excerpt** (4096/10k
  dimensions or similar). The 1D slide must come before the 3D material.
- [ ] Then the **transformer**: position, attention (all four steps), FFN,
  residual, token trajectories.
- [ ] Then **“Weiche Kurven, ein Knick”** (activation) **before** the neural
  network material.
- [ ] Then the **neural-network section**:
  - “Was sind neuronale Netze?” with the one-neuron linear example first;
  - “Die Parameter leben auf einer Loss-Landschaft” directly after that;
  - then the larger network that fits the sine;
  - merge in “Sieh zu, wie das MLP den Raum biegt”: networks can fit lines
    *and* fold the space into higher dimensions and back.
- [ ] Then the output/assistant block: unembedding, softmax, loop,
  distribution, languages, post-training, evaluation, KV cache, RAG,
  history, philosophy.

### Tokenizer and embedding
- [ ] The tokenizer example
  `sprach / id 39281 / modell / id 27907 / e / … / teil / id 16180 / e`
  is too long. Shorten it and make the token blocks readable.
- [ ] Show **BPE = learned compression** properly: start from characters,
  merge the most frequent pair step by step, show the vocabulary growing and
  the token count dropping.
- [ ] Move “Bedeutung wird eine Zahl” directly after the tokenizer.
- [ ] Add the 10k/4096-dimensional excerpt explicitly; do not hide it only
  inside the 3D table.

### Neural networks, loss landscape, MLP
- [ ] The loss surface looks upside down: the smallest loss appears at the
  top. Flip the projection so low loss is at the bottom and high loss at the
  top.
- [ ] Label the axes correctly: `a` becomes `w`, `b` stays `b`.
- [ ] Move the loss landscape into the neural-network section, after the
  one-neuron example and before the larger sine network.
- [ ] Say that the larger network has too many directions to draw, but the
  principle (parameters, loss, gradient) is the same.
- [ ] Merge “Was sind neuronale Netze?” with “Sieh zu, wie das MLP den Raum
  biegt”: a network can fit a line *and* bend the space so a flat cut
  separates the classes.

### “Von Beziehungen zur Übersetzung”
- [ ] Remove the radius slider.
- [ ] Add rotation and translation controls instead.
- [ ] Add a **“Übersetzung finden”** button that rotates and translates the
  two point clouds onto each other and reveals the token translations from
  positions alone. “Weiter” should trigger the same translation.
- [ ] The other points are words too: allow hover to reveal their labels.
- [ ] Verify every translation; make the two manifolds slightly different but
  still visibly match; make the motion smooth and beautiful.

### “Wörter sind neutral; Nachbarschaften tragen Bedeutung”
- [ ] The inline LaTeX for `\text{new}`, `\text{york}`, and
  `\text{new york}` is still on its own line, far from the explanation.
  Put each token inline with its sentence and remove the block gaps.

### Shared system pass (after the reorder)
- [ ] Central live palette so all scenes update on theme change without each
  scene re-reading colours.
- [ ] Central theme refresh in the engine; generic scene CSS for readouts,
  controls, outputs, range labels, and nav rows.
- [ ] A small scene kit (canvas sizing, visibility/reduced motion, nav,
  readout, range, chips) for future demos. Do not rewrite every existing
  demo; wrap and style them.

### Verification after these changes
- [ ] Page test and height test in EN/DE, desktop and mobile.
- [ ] Visual check of every reordered slide and every new control.
- [ ] `check_all.py --fast`, `php_validator.py`, `php -l`, `node --check`,
  `git diff --check`.

## Full state after the latest user round (2026-11-13, evening)

This section supersedes the older checklists for the current work. It records
what is already in the code, what is partially edited, and what is still open.

### Working files

- `intuition_learnsys-data.js` — slide content and the `steps` order.
- `intuition_learnsys-demos.js` — the `SCENES` registry and most demos.
- `learnsys.js` — engine, public API, navigation, theme handling.
- `learnsys.css` — shared scene and page styling.
- `assets/learnsys-visuals.js` — shared canvas helpers.
- `assets/learnsys-unembed-scene.js` — new Unembedding scene.
- `assets/tf-sinus-scene.js` — one-neuron / large-net sine scene.
- `assets/loss-landscape-scene.js` — two-parameter loss landscape.
- `assets/loss-landscape-worker.js` — worker for the landscape.

### Already done and tested

- [x] Shared visual helpers: palette mixing, arrows, labels, grids, 2D/3D
  projection, heatmaps, token chips.
- [x] New Unembedding slide with dot product, angle, `W_U`, logits, softmax,
  token draw, and GPU lineage. Sources: Aggarwal 2001, NVIDIA CUDA, Tensor
  Cores, CUDA guide, GeForce 256.
- [x] First big reorder pass: loop and distribution moved after the
  transformer material, new Unembedding slide inserted, 32 steps, kicker
  numbers removed.
- [x] Neural slide rewritten: one-neuron line, errors, large sine network,
  live matrix overlay, CPU training, auto-start, offscreen pause, log loss.
- [x] Bausteine rewritten: clean T → E → transformer → U stack, clickable
  stations, brace and ×N badge, large 16:9 minis, `new` + `york` example.
- [x] Compression polished: phase pill, Barlow category labels, halo,
  unseen-case arrow into the universal hub.
- [x] Loss landscape starts automatically, pauses offscreen, “Next” stays
  while training.
- [x] Manifold rebuilt with two 10×10 Pringle point sheets, Rips edges,
  radius slider, five bilingual pairs, drag/zoom, idle rotation.
- [x] Height-test false positives fixed with `data-no-height-test` on
  navigation controls and the language switch.
- [x] `uv run blog/tests/tenminutes_pages_test.py --pages
  intuition_learnsys.php --langs en,de` → 10/10 checks passed.
- [x] `uv run blog/tests/tenminutes_height_test.py --pages
  intuition_learnsys_page.php --langs en,de --viewports desktop,mobile
  --monkey 4` → 48 interactions, 0 height changes.
- [x] `php_validator.py blog/` → all clean.
- [x] `python3 blog/tools/check_all.py --fast` → all 33 stages passed.
- [x] `node --check` on every changed JS, `php -l` on the page,
  `git diff --check` → clean.

### Partially edited right now (do not assume the page is consistent)

- [~] The first neural object in `insideSteps` (DE and EN) has been replaced
  with the new “1 Neuron” step (`demoState: { scene: "model", phase:
  "linear" }`). The rest of the slide order still uses the older `steps`
  array. The page will look inconsistent until the next pass finishes.
- [~] The new `neuralLargeSteps` and `highdimSteps` arrays are planned but
  not yet inserted.
- [~] `gradientSteps` still uses `a` in its copy and still needs the `w`
  rename and the flipped loss surface.
- [~] `mlpSteps` still has the old title/body; it has not yet been merged
  into the neural-network section.
- [~] `manifoldSteps` copy still mentions the radius slider; the scene still
  has the radius interaction instead of rotation/translation.
- [~] `tokenizeScene` still uses the long sentence and the old BPE layout.
- [~] `noiseScene` still renders the `new` / `york` rows as separate blocks.

### Final intended slide order

0. Was ist ein LLM? Chat und Code
1. Verstehen heißt komprimieren
2. **Die Bausteine eines LLM** (stays exactly here)
3. **Gauß / Ceres** (new; before the data slide)
4. **Dieselbe Schleife, viele Sprachen** (early; data situation clear)
5. Text wird zu IDs (tokenizer)
6. Bedeutung wird eine Zahl (embedding 1D)
7. Bedeutung bekommt eine zweite Achse (2D)
8. Drei Dimensionen, ein Schatten (3D)
9. **Tausende Dimensionen** (new high-dimensional excerpt)
10. Von Beziehungen zur Übersetzung (manifold translation)
11. Jeder Platz bekommt einen Fingerabdruck (position)
12. Kontext zieht die Bank an seinen Platz (attention 1)
13. Attention verschiebt Bedeutungen in Kontexte (attention 2)
14. Attention reduziert Rauschen (attention 3)
15. Die kausale Matrix und die Heads (attention 4)
16. Ein Muster passt, ein Wert wird geschrieben (FFN)
17. Jede Schicht schreibt in denselben Stream (residual)
18. Token-Trajektorien durch GPT-2
19. Weiche Kurven, ein Knick (activation; before neural networks)
20. Was sind neuronale Netze? · 1 Neuron
21. Was sind neuronale Netze? · Loss-Landschaft
22. Was sind neuronale Netze? · Großes Netz
23. Was sind neuronale Netze? · Raum biegen (MLP merged in)
24. Die Karte der Wörter (meadow)
25. Aus einem Vektor wird ein Wort (unembedding)
26. Von Logits zu einer Verteilung (real GPT-2 softmax)
27. Ein Wort nach dem anderen (loop)
28. Die Verteilung ist nicht die Antwort
29. Dieselbe Schleife, viele Sprachen? No: this is moved to step 4.
30. Vom Basismodell zum Assistenten
31. Wie gut ist das Modell?
32. Der KV-Cache wächst mit dem Kontext
33. Suchen, lesen, einsetzen
34. Geschichte in zehn Schritten
35. Du bist das Chinesische Zimmer

(Slide 29 in this sketch is intentionally empty after moving the language
slide; the final array should have 35 slides. Renumber the kickers only by
content labels, not by these numbers.)

### Open work, in order

1. [ ] Finish the `steps` array for the order above and add
   `neuralLargeSteps` and `highdimSteps`.
2. [ ] Tokenizer: shorter sentence example, new split map, BPE merge
   equation, token/vocabulary counters, prominent “BPE = gelernte
   Kompression”.
3. [ ] Embedding: keep 1D directly after the tokenizer; add the highdim
   excerpt slide.
4. [ ] Neural networks: finish the 1-neuron → loss → large-net → MLP
   sequence; adjust `TfSinusScene.next()`/`prev()` so the step order drives
   the phase, not an internal auto-switch.
5. [ ] Loss landscape: flip the projection so low loss is at the bottom,
   rename `a` → `w`, label axes and formula `ŷ = w x + b`, `L(w,b)`.
6. [ ] Manifold: remove radius; add rotation + translation; add
   “Übersetzung finden”; hover labels for every point; verify all 49 word
   pairs; smooth animation; “Weiter” also finds the translation.
7. [ ] Noise slide: inline `\text{new}`, `\text{york}`, `\text{new york}`;
   place Empire State Building and Statue of Liberty near the New York
   cluster; `new york` around width 4; Statue of Liberty above at
   neighbourhood 4 height.
8. [ ] Data/language slide: move early (step 4), add the zettabyte era
   (since about 2016, 10^21 bytes), curation, Wikipedia vs peer-reviewed,
   wrong data, lies, Nile/Egypt vs Nile/Paraguay, and the averaging argument.
9. [ ] New Gauss/Ceres slide (step 3): true orbit, noisy observations,
   Gaussian error curve, telescope-quality slider, Ceres image, Flammarion
   image, least squares, Stigler 1981, synthetic-data disclaimer,
   “no single measurement is believed” conclusion, and the history text
   about least squares returning in modern training.
10. [ ] Shared-system pass: live shared palette, central theme refresh,
    generic scene CSS for readouts/controls/outputs/ranges/nav, and a small
    scene kit for future demos.
11. [ ] Re-run page test, height test, `check_all.py --fast`, PHP/JS syntax,
    `git diff --check`; fix regressions.
12. [ ] Commit and push only after the final gate and only with explicit
    approval.

### Visual bar for the remaining work

The page should feel like one continuous, calm, premium visual essay:
square surfaces, thin lines, Open Sans body, Barlow display, the ScaDS
palette, no clutter, no jumpy heights, no white-on-white or lime-on-white.
Every scene should have one clear idea, a large readable canvas, a small
readout, and a smooth transition. The Ceres/Gauss demo especially should be
stunning: a quiet astronomical plate, a true orbit, a cloud of noisy
measurements, a Gaussian error curve, and a telescope slider that visibly
narrows the uncertainty while the fitted curve stays near the truth.

## Final state after the second implementation pass (2026-11-13)

This section supersedes the earlier “partial” and “open work” lists. The page
is now functionally complete for the current request; the only remaining
items are a human visual review and an explicit commit/push decision.

### Final slide order (35 steps)

0. Was ist ein LLM? Chat und Code
1. Verstehen heißt komprimieren
2. Die Bausteine eines LLM (stays exactly here)
3. **Gauß, Ceres und die Methode der kleinsten Quadrate** (new)
4. **Dieselbe Schleife, viele Sprachen** (moved early; data situation clear)
5. Text wird zu IDs (tokenizer; shorter example + real BPE merges)
6. Bedeutung wird eine Zahl (embedding 1D)
7. Bedeutung bekommt eine zweite Achse (embedding 2D)
8. Drei Dimensionen, ein Schatten (embedding 3D)
9. **Tausende Dimensionen** (new high-dimensional excerpt)
10. Von Beziehungen zur Übersetzung (rotation + translation + hover + find)
11. Jeder Platz bekommt einen Fingerabdruck
12. Kontext zieht die Bank an seinen Platz
13. Attention verschiebt Bedeutungen in Kontexte
14. Attention reduziert Rauschen (inline LaTeX + New York cluster)
15. Die kausale Matrix und die Heads
16. Ein Muster passt, ein Wert wird geschrieben
17. Jede Schicht schreibt in denselben Stream
18. Token-Trajektorien durch GPT-2
19. Weiche Kurven, ein Knick (before the neural-network section)
20. Was sind neuronale Netze? · 1 Neuron
21. Was sind neuronale Netze? · Loss-Landschaft (`w`/`b`, flipped surface)
22. Was sind neuronale Netze? · Großes Netz
23. Was sind neuronale Netze? · Raum biegen (MLP merged into the section)
24. Die Karte der Wörter
25. Aus einem Vektor wird ein Wort (unembedding)
26. Von Logits zu einer Verteilung (real GPT-2 softmax)
27. Ein Wort nach dem anderen (loop)
28. Die Verteilung ist nicht die Antwort
29. Vom Basismodell zum Assistenten
30. Wie gut ist das Modell?
31. Der KV-Cache wächst mit dem Kontext
32. Suchen, lesen, einsetzen
33. Geschichte in zehn Schritten
34. Du bist das Chinesische Zimmer

### What is implemented

- **Gauss/Ceres slide (new).** `assets/learnsys-gauss-scene.js` draws a true
  Ceres orbit, 18 noisy observations, a least-squares fitted closed curve,
  residual lines, a glowing Sun, a Ceres marker, and a Gaussian error curve.
  The telescope slider moves σ from 0.22 to 0.04; the cloud visibly tightens
  and the fit error falls. “Neue Messungen” resamples the standardized
  Gaussian errors. The side column shows the Dawn image of Ceres and the
  **coloured** Flammarion engraving copied from `blog/flammarion.jpg` (source
  from `literature.js`: `Flammarion_Woodcut_1888_Color_2.jpg`, public domain)
  and resized to 900 px. The Ceres image is the existing credited
  `blog/ceres.jpg` (cropped Dawn image, public domain). Both have visible
  captions with author, licence, and a Wikimedia Commons link. The slide
  cites Stigler (1981), says explicitly that the data are synthetic, and
  connects least squares back to modern training.
- **Data/language slide (moved to step 4).** Adds the zettabyte era since
  about 2016 (10²¹ bytes), curation, Wikipedia vs peer-reviewed papers,
  human errors, measurement errors, lies, and the Nile/Egypt vs
  Nile/Paraguay averaging argument. The scene now has a KB → … → ZB data
  scale strip with 2016 highlighted, the GPT-3 mix bars, and six language
  samples. Source: Cisco (2016), Brown et al. (2020), Petrov et al. (2023),
  Lee et al. (2021).
- **Tokenizer (step 5).** The long sentence was replaced by “Sprachmodell
  liest Text” (EN “Models read text”). The BPE section has a dedicated BPE
  chip, a large merge equation (`e + s → es 9×`), highlighted pairs, live
  token-count and vocabulary meters, and the top pair counts. BPE is now
  visibly a learned compression, not a note.
- **Embeddings + highdim.** 1D directly after the tokenizer, then 2D, 3D,
  and the explicit “Tausende Dimensionen” table (16 of 4096 dimensions).
- **Transformer block.** Position, all four attention steps, FFN, residual,
  token trajectories, then activation before the neural-network section.
- **Neural-network section.** 1 Neuron → Loss-Landschaft → Großes Netz →
  Raum biegen. The loss landscape now uses `w` and `b`, the surface is
  flipped so low loss is at the bottom, the axes are labelled `w`/`b`, and
  the Temml formula shows `ŷ = w x + b`, `L(w,b)`, and live values. The large
  network says explicitly that it has too many directions to draw but the
  principle is the same. The MLP slide is merged conceptually into the same
  section: networks can fit lines *and* fold space.
- **Manifold translation.** Radius removed. Two sliders: rotation and
  translation. “Übersetzung finden” (and “Weiter”) animates the Japanese
  cloud onto the English one, reaching 100 % alignment. Hovering any of the
  49 points shows its English and Japanese word; all 49 pairs were extracted
  and checked. The clouds use slightly different jitter and edge sets, so
  they are not a trivial copy, but they visibly align. The correspondence
  line shows the pair; five anchors keep their labels.
- **Noise/ambiguity slide.** The `\text{new}`, `\text{york}`, and
  `\text{new york}` rows are now inline flex rows with a 5 px gap, not
  separate blocks. The city anchor is at width ≈ 0.40 with the label
  “Stadt · New York”; the Empire State Building and the Statue of Liberty
  sit just above/right of the city, with the Statue higher up. The ambiguous
  car/England alternatives still fade with context.
- **Shared system.** `assets/learnsys-visuals.js` (palette, arrows, labels,
  grids, projection, heatmaps, chips), `assets/learnsys-scene-kit.js`
  (canvas, nav, readout, range, chips), a live shared palette in
  `learnsys.js`, one central `tm:theme` refresh that calls the active demo’s
  `resize()`, `api.visual` / `api.kit` / `api.reducedMotion`, `data-scene`
  on every scene layer, a zero-specificity scene baseline in `learnsys.css`,
  and justified long-form prose. `LEARN_SYSTEM.md` documents the system.
- **Theme and navigation.** The fixed bottom arrows keep their reserved safe
  area; navigation controls and the language switch are excluded from the
  height test. Kicker numbers were removed from every step so the old
  thematic numbering cannot contradict the new order.
- **Images and credits.** The Gauss scene uses local `assets/img/ceres.jpg`
  and `assets/img/flammarion.jpg`. The Flammarion is the coloured parent
  image, resized; the Ceres is the existing parent image. Both have visible
  author/licence/source captions and are recorded in the slide sources.

### Verification (all observed, not inferred)

- `uv run blog/tests/tenminutes_pages_test.py --pages
  intuition_learnsys.php --langs en,de` → **10/10 checks passed, 0 failed**.
- `uv run blog/tests/tenminutes_height_test.py --pages
  intuition_learnsys.php --langs en,de --viewports desktop,mobile --monkey 4`
  → **48 interactions, 0 height changes**.
- `uv run blog/tests/php_validator.py blog/` → **209 files, 0 issues**.
- `python3 blog/tools/check_all.py --fast` → **all 33 stages passed**.
- `node --check` on every changed JS file, `php -l
  intuition_learnsys.php`, `git diff --check -- blog/tenminutes` → clean.
- Targeted headless checks: all 35 slides render; no severe console errors;
  no horizontal overflow; all math typeset; Gauss images load; telescope
  slider changes σ/readout; 49 manifold hover pairs verified; BPE merge
  equation and meters update; neural phase/loss/large-net flow and
  `Next`-while-training work; theme toggle redraws and changes the palette.

### Still open

- [ ] **Human visual review.** The automated checks prove layout and
  behaviour, not beauty. The page should be opened at 1280–1400 px and at
  390 px in both languages. Pay special attention to the Gauss side column,
  the coloured Flammarion crop, the manifold labels when aligned, and the
  BPE meters.
- [ ] **Commit and push.** Not done. The repository rule says commit only
  on explicit request. The working tree contains all changes above; ask
  before committing.
- [ ] Optional later polish: refine the exact Gauss wording or add more
  residue points, and tune the noise-cluster positions if the visual review
  finds the Statue of Liberty too high/low.

### Caveats

- The Gauss observations are synthetic, not Piazzi’s original measurements.
  The fit is a Fourier least-squares closed curve, not a reconstruction of
  Gauss’s actual orbit computation; the slide says both.
- The Ceres image is the existing parent `blog/ceres.jpg` (cropped Dawn
  image). The Flammarion is the coloured parent `blog/flammarion.jpg`,
  resized to 900 px.
- The manifold translation is a 3D rotation plus horizontal translation of a
  synthetic point cloud, not a measured cross-lingual embedding. The slide
  says it is a didactic simplification.
- The “year 2016 / zettabyte era” is sourced to Cisco (2016), “The
  Zettabyte Era Officially Begins”; 10²¹ bytes is the definition used there.

## Correction after visual review (2026-11-13, latest)

1. [~] **Gauss/Ceres visualization must match the statistics page.**
   The current orbit/ellipse + Fourier-fit canvas is not the wanted visual.
   Replace it with the visualization from `blog/statistics_i.php` /
   `statistics.js` (`renderCeresAstronomy`):
   - left panel: a green “True Orbit” spline over time / arc, with about 150
     blue/indigo noisy observations;
   - right panel: a histogram of the actual residual errors plus the red
     theoretical bell curve;
   - one slider from “Better Telescopes” to “Worse Telescopes” (sigma about
     0.1–2.0);
   - title “Ceres: Wahrheit gegen verrauschte Beobachtungen”;
   - synthetic-data note: “Synthetische Daten, nicht Piazzis Messungen.”
   Keep the Ceres image and the **coloured Flammarion** image with their
   credits. Simulate the same two-panel look in the LearnSys canvas instead
   of the current orbit/ellipse scene.

2. [ ] **Manifold permanent bilingual labels.**
   On “Von Beziehungen zur Übersetzung”, a few anchor words must be visible
   in both languages without hovering: English label on the English cloud,
   Japanese label on the Japanese cloud, and both together when the clouds
   are aligned. Keep the hover for all 49 words.

3. [ ] Re-run the page test, height test, `php_validator.py`,
   `check_all.py --fast`, `node --check`, `php -l`, and `git diff --check`
   after both changes.

## Queued corrections after the latest review (2026-11-13)

1. [~] **Ceres layout is squeezed.** The two-panel statistics visual is much
   better, but it is compressed on screen. Remove the narrow side column;
   give the two-panel plot the full width and move the Ceres/Flammarion
   images into a compact horizontal strip so the scatter and histogram stay
   legible. Keep the credits visible.
2. [ ] **Agent window chat roles.** When
   “Schreibe ein Python-Programm, das die Rayleigh-Streuung berechnet.” is
   submitted, it must appear in the agent window at the **top right**, with a
   blue background. The LLM answer stays **left**, green, as now.
3. [ ] **Agent input row.** After submitting, the input row moves up one line
   and keeps only the `$` on the left.
4. [ ] **Rayleigh output.** The provided code must produce
   `Blau wird 4.35× stärker gestreut als Rot.` (currently the demo shows a
   different/missing result).
5. [ ] **Agent taskbar.** `Agent` and `Terminal` must fit; currently the last
   two letters of `Agent` are clipped (`age`) and `Terminal` is cut
   (`terminal`).
6. [ ] Re-run the page test, height test, `php_validator.py`,
   `check_all.py --fast`, syntax checks, and `git diff --check`.

## Latest corrections implemented (2026-11-13, final pass)

- [x] **Ceres visualization now matches the statistics page.** The
  orbit/ellipse and Fourier fit were replaced with the two-panel
  `renderCeresAstronomy` visual: left = green true sine path + 150 noisy blue
  observations; right = histogram of actual residuals + red/lilac
  theoretical bell curve; Better/Worse telescope slider (σ 0.1–2.0). The
  Ceres image and the coloured Flammarion image are now a compact horizontal
  strip below the plot, so the plot has the full width and is no longer
  squeezed. The synthetic-data note and credits remain.
- [x] **Agent chat roles.** The submitted prompt
  “Schreibe ein Python-Programm, das die Rayleigh-Streuung berechnet.” now
  appears as a blue, right-aligned bubble at the top of the agent chat. The
  LLM text stays left/green. After submit, the bottom prompt row clears to
  `$` and moves up one line.
- [x] **Rayleigh output.** The terminal prints exactly
  `Blau wird 4.35× stärker gestreut als Rot.`
- [x] **Taskbar.** `Agent` and `Terminal` now fit; the old 12 px width that
  clipped them to `age`/`terminal` was removed.
- [x] **Manifold rotation + surfaces.** “Von Beziehungen zur Übersetzung” has
  three controls: Drehung (yaw), Rotation (roll), Verschiebung
  (translation). “Übersetzung finden” animates all three to zero. The two
  Pringle sheets now have lightly translucent surface faces under the
  Vietoris–Rips edges.
- [x] **Manifold permanent labels.** Five anchor words are labelled in both
  languages without hovering (English on the English cloud, Japanese on the
  Japanese cloud, combined `en · jp` chips when aligned). Hover still works
  for all 49 words.
- [x] **Position great-circle only.** The Euclidean toggle and path were
  removed. The right plot is now a clean unit sphere with the start/current
  vectors and the great-circle arc. The left copy says that only the angle
  counts, not Euclidean distance.
- [x] **Position 3D formula.** The sinusoidal encoding now uses the standard
  pair formula: even dimension `sin(pos / 10000^(2⌊i/2⌋/d))`, odd dimension
  `cos(pos / 10000^(2⌊i/2⌋/d))`. The first three dimensions feed the 3D
  vector; the angle is `acos` of the dot product of the normalized vectors,
  and the arc length is that angle. Checked numerically.

Remaining:

- [ ] Final gate after these edits: page test, height test,
  `php_validator.py`, `check_all.py --fast`, `node --check`, `php -l`,
  `git diff --check`.
- [ ] Commit/push only on explicit request.

## Newest queue — added, not started (2026-11-13)

These are queued. Do not start them until the current final gate is closed.

1. [ ] **Phone transition Search → Chat.** The phone currently disappears and
   reappears; the phone frame itself must stay and only the screen content
   should cross-fade smoothly.
2. [ ] **Reset demos on return.** When the reader goes back to a slide that was
   already visited (media slide 1, “Verstehen heißt komprimieren”, etc.), the
   demo must restart from the beginning. Same for other scenes.
3. [ ] **Bausteine tokenizer mini.** In the `unzerbrechlich` graphic the token
   boxes are all over the place; align them exactly to the split positions.
4. [ ] **Bausteine neural text.** Add that the individual components
   (Attention, FFN, etc.) are explained in more detail later.
5. [ ] **Ceres responsive canvas.** When the window is very small, the Ceres
   plots keep their old text size and look squashed. Re-render fonts and
   labels at the new canvas size.
6. [ ] **Merge Gauss/Ceres with the data slide.** “Dieselbe Schleife, viele
   Sprachen” should be called something like “Daten”. Merge “Gauß, Ceres und
   die Methode der kleinsten Quadrate” with “Daten” into one slide with two
   sub-slides and different left-hand texts. Show that data are not exact:
   different people describe the same situation differently, sometimes
   contradictorily, but in sum the real result hopefully shines through, as
   with Gauss.
7. [ ] **Manifold Back behavior (preferred over reset-on-entry).** Instead of
   resetting the slide whenever it is entered, pressing Back should undo the
   manifold alignment/translation step by step, so the two clouds return to
   their unaligned state. This is the user's preferred option; the
   reset-on-entry idea is only an alternative. Confirm the exact step order
   (e.g. first undo the found translation, then the manual yaw/roll).
8. [ ] **Attention context demo.** In “Kontext zieht die Bank an seinen Platz”:
   remove “Summe 100%” from the right context, recompute the token position,
   show `x' = Σ w·v` above the matrix, and remove “Zeile = Frage, Spalte =
   Antwort” from the plot.
9. [ ] **Causal-mask text.** Move the “Causal Mask · nur vergangene Tokens
   beachten …” explanation into an optional box on the left text side, not
   inside the demo, while the left text still controls the right demo.
10. [ ] **New noise demo.** “Attention reduziert Rauschen” needs a completely
    new, mouthwateringly gorgeous demo: use `function` vs `def` in code,
    camelCase vs snake_case, `quickSort` vs `quick_sort`, or similar surface
    noise. Move this demo into “Attention verschiebt Bedeutungen in Kontexte”.
11. [ ] **Remove duplicate causal-matrix slide.** “Die kausale Matrix und die
    Heads” is duplicated; remove it. Keep its content on “Attention
    verschiebt Bedeutungen in Kontexte”.
12. [ ] **Merge activation + 1 neuron + loss landscape.** Merge “Weiche
    Kurven, ein Knick”, “Was sind neuronale Netze? · 1 Neuron” and “Was sind
    neuronale Netze? · Loss-Landschaft” into one slide that shows the
    different left-hand texts one after another. Move it before “Ein Muster
    passt, ein Wert wird geschrieben” (FFN).

13. [ ] **Global native responsive graphics.** Every canvas/graphic must
    re-render natively at the current container width, not be CSS-scaled or
    stretched. Add a shared `ResizeObserver` path (or equivalent) so that
    layout changes (not only window resizes) trigger `api.fit` + redraw for
    all scenes. This explicitly covers the loss charts during training, the
    TF.js sine scene, the loss landscape, the Ceres two-panel plot, the
    manifold, the position sphere, the compression graph, and any other
    canvas. Fonts, labels, axes, and line widths must be recalculated at the
    new pixel size.

14. [ ] **Calendar overview top-left.** Add a calendar icon in the top-left
    chrome. Clicking it opens a calendar/overview of the slides: what comes
    when, in which order, with the current slide marked.

15. [ ] **Remove the KV-cache slide, add a short optional box.** Delete the
    standalone “Der KV-Cache wächst mit dem Kontext” slide. Add an optional
    box to an attention slide that explains the KV cache briefly: keys and
    values of earlier tokens are reused instead of recomputed, which turns
    the quadratic generation cost into a linear one. Research the exact
    mechanism and cite a primary source.

## Implementation status (2026-11-13, latest)

The remaining queue is fully listed above. Work started with the **global
native responsive canvas system** (a shared `ResizeObserver` path so every
scene redraws at its real pixel size, not a CSS-scaled bitmap). The other
queued items are still open and will be handled in order:

1. Phone Search → Chat transition
2. Scene reset on re-entry (manifold uses Back-to-undo instead)
3. Bausteine tokenizer alignment + neural text note
4. Ceres/global responsive verification
5. Gauss/Ceres + data merge
6. Attention context, causal-mask box, new noise demo, duplicate removal
7. Activation + 1-neuron + loss merge
8. Calendar overview
9. KV-cache removal + attention KV box
10. Full test gate again

16. [ ] **Final quality pass (the last point).** Make everything
    mouthwateringly gorgeous: as minimalist and beautiful as possible, with
    clean spacing, typography, colour, transitions, and no clutter. The page
    must still teach something real on every slide; beauty must serve the
    takeaway, not replace it.

## Latest large request — training, MLP, residual, unembedding (2026-11-13)

Marked as todo; work through carefully, one block at a time.

### Training and optimizers
- [x] Loss landscape: do not auto-start. Start only on “Training starten” or
  “Weiter”. The optimizers must go through one after another when the reader
  presses Weiter, instead of starting automatically.
- [x] Neural networks (1 neuron and 32×32×32): do not auto-start. Start only
  on “Weiter” or the Start button.
- [x] “Weiter” while training must **stop the training and go to the next
  slide** (not stay on the training slide).
- [x] “Matrizen zeigen” must work in both the 1-neuron and the 32×32×32
  variants, show the correct matrices for the active phase, and explain
  briefly what the reader sees. The 1-neuron button must not switch to the
  big network.

### MLP / “Raum biegen”
- [x] Remove the `watch` text “Klicke dich durch die neun Folien. Wo biegt
  sich der Raum, wo erscheint der Schnitt?”.
- [x] In “Die Dense-Schicht in Zahlen”, remove the top “Skala”, “n”, etc.
  labels/controls and put the controls into the demo itself.
- [x] Repair the linear-separation check; on the “Eigene” slide show where
  the separating plane really is; verify the algorithm from different angles.
- [x] Remove the formulas `s(x,y)=…` and `L … = 0.5563`. Remove the duplicate
  `a=W1…, z=W2…` formula; keep the existing top formula
  `x=(x1,x2) → h=act(W1x+b1) → z=W2h+b2`.
- [x] Remove the second “✓ Linear trennbar: ja (s = 0.00)” text on the right;
  keep the one in the canvas.
- [x] Fix `CanvasRenderingContext2D.arc: Negative radius` in
  `assets/space-morph.js` when sliders are moved.
- [x] Fix the weight number inputs at 8 neurons: they are too wide and
  overlap; make the matrix editor fit and stay readable.
- [x] Keep all current information but make the MLP page clearer and less
  cluttered.

### Residual stream
- [x] Make “Jede Schicht schreibt in denselben Stream” step through the
  layers on Weiter.
- [x] Attention and FFN belong together: both write into the residual stream;
  the output after the projection keeps the same size, so layers can only add
  to the signal.
- [x] Import the shared-notebook demo from `blog/lndw/index.html` as the
  intuition at the beginning of the residual slide. German exactly like the
  source; English must translate and keep all annotations fitting and equally
  good.

### Order and blocks
- [x] Move “Token-Trajektorien durch GPT-2” to directly after “Ein Wort nach
  dem anderen”.
- [x] Add the data at the very beginning of “Die Bausteine eines LLM”; then
  put the data slide after the Bausteine slide and move the content there.
- [x] Fix “unzerbrechlich” in the Bausteine tokenizer mini: the ID texts
  overlap, and the parts (`un`/`zer`, `e`/`b`-like neighbours) overlap.
  Increase the space and keep the boxes exactly on the split.

### Unembedding / “Ähnliche Worte finden”
- [x] Rename “Aus einem Vektor wird ein Wort” to something like “Ähnliche
  Worte finden”.
- [x] Remove the first “Winkel” step.
- [x] Start by explaining/showning why angle is better than Euclidean
  distance in high dimensions; research the topic and write it briefly.
- [x] New gorgeous demo: two words that are almost the same (small angle),
  unrelated (about 90°), and opposite words. Use researched approximate
  values that fit; make it mouthwateringly beautiful.
- [x] Remove the fifth step with the triangle (GPU demo).
- [x] On the last step, show the resulting percentages at the words
  themselves.
- [x] Keep all information that is currently there, but clearer.

### Finish
- [x] Re-run page test, height test, php_validator, check_all --fast,
  syntax/diff.
- [~] Final quality pass: mouthwateringly gorgeous, minimalist, real takeaway.
- [ ] Commit and push only with explicit approval.
## Final quality and robustness requests (2026-11-13)

- [x] **Right arrow must reach every demo.** On every slide, pressing Weiter
  repeatedly must step through every demo/sub-demo the slide contains, so the
  reader can see all of them even without touching every slider. Verify this
  on every base slide and every substep.
- [~] **Intuitive, smooth, fun.** Review the whole sequence for intuitiveness,
  smooth transitions, and a coherent flow; nothing should jump, stutter, or
  feel disconnected. Make it fun because everything flows into the next.
- [x] **Gremlins.js monkey test.** At the very end, obtain gremlins.js and run
  it with many workers. Provoke failures deliberately, analyze every error
  precisely, and fix it at the root. The software must survive 50 monkeys:
  every control clickable, arbitrary text/numbers in every field, sliders
  moved anywhere, no crash.
- [x] **Move “Die Karte der Wörter” after “Ein Wort nach dem anderen”.**
  The meadow slide moves directly after the loop slide.

### Ordering notes
- Final order (31 slides): media, compression, Bausteine, Gauss (4
  substeps), data, tokenizer, embeddings, highdim, manifold, position,
  attention (intro, context), code attention, neural (activation/1 neuron),
  neural (loss/large net/MLP), FFN, notebook, residual stream, unembedding,
  softmax, loop, trajectories, meadow, distribution, post-training, eval, RAG,
  history, philosophy.
- Trajectories and meadow now sit directly after the loop.

## Final extras (2026-11-13, very end)

- [x] **Fireworks on 31 December and 1 January.** When the page is opened on
  31.12 or 1.1, show a tasteful fireworks effect (no sound, no blocking of
  the lesson, theme-aware, reduced-motion friendly).
- [x] **Position sweep to 10000.** On “Every slot gets a fingerprint”, pressing
  Weiter must sweep the position quickly from the current value up to 10000
  (about 5 seconds), leave a visible point at every visited position in the
  space, and show exactly where the sweep currently is.
- [x] **Slide count check at the very end.** Count the total slides. If there
  are fewer than 31, split e.g. the merged Gauss/data slide back into a Gauss
  slide and a data slide so the count is at least 31. Recheck the order and
  the calendar afterwards.
- [x] **Gauss and MSE.** Explicitly name MSE (mean squared error / mittlerer
  quadratischer Fehler) on the Gauss slide. On the neural-network loss slide,
  say that the loss is MSE and that this is how the model is judged; add an
  optional box explaining that other problem types use other loss functions
  (cross-entropy, MAE, etc.), with sources.
- [x] **Snow on 24 December.** When the page is opened on 24.12, show a brief
  tasteful snow effect (no sound, does not block the lesson, theme-aware,
  reduced-motion friendly).

## Latest pass (2026-11-14)

- 31 base slides now: Gauss and data are separate; attention bank and code
  are separate; neural activation/1-neuron and loss/large-net/MLP are
  separate; notebook and residual stream are separate.
- Gauss slide is bilingual and names MSE; the loss slide names MSE and has
  the optional other-loss box with sources.
- Loss/optimizer behavior: no auto-start; loss optimizers step on Weiter;
  NNs start on Weiter/Start; Weiter while training stops and advances.
- Matrices work in both phases; 1-neuron stays linear and shows W/b; the
  overlay explains the shapes. The MLP controls are bottom, the copy is
  hidden on the dense steps, the separation check is robust, the plane sits
  at the threshold, and the number inputs fit.
- Notebook (five layers) and stream (Embedding, Attention+FFN 1,
  Attention+FFN 2, Unembed) step on Weiter; Attention and FFN are one block.
- Unembedding is now “Ähnliche Worte finden”: word map, neighbours,
  percentages, angle vs Euclidean, no songs/GPU steps.
- Position Weiter sweeps 7 → 10000 in 5 s, leaves 200 trail points, and shows
  the current position.
- Trajectories and meadow sit after the loop.
- Snow on 24.12, fireworks on 31.12/1.1 on calendar and LearnSys page.
- Gremlins 50 monkeys and a full control stress found and fixed the hidden
  trajectory layer crash (`prevRaw` out of range). All base steps pass the
  stress run.
- Phone click on the first slide now advances Search → Chat → Code → next slide.
- Agent code area measures only after it is visible, shrinks to fit, and falls
  back to scroll; the code is fully shown on desktop and mobile.
- Tests: tenminutes pages 10/10, height 38/0, php_validator 0 issues,
  check_all --fast all green.

## Newest request (2026-11-14, after phone/code fix)

- [x] **Bausteine:** add **Daten** as a fifth building block; update stack, body, and mini.
- [x] **Tokenizer mini:** remove the heading above “unzerbrechlich”; show labels and IDs only below the word; fix all overlaps.
- [x] **Gauss:** on the second substep hide both images at the bottom and show only the demo at the top.
- [x] **Data slide:** add more; add a truth-line plot with paraphrases around the truth and a red X for a false sentence (DE: Berlin/Spree/Elbe; EN: Nile/Egypt, known false sentence).
- [x] **Tokenizer slide:** start with BPE, explain characters → adjacent pairs → merge most frequent pair, mention compression; fix “Start: Jedes Wort besteht aus Zeichen.” height jump.
- [x] **Embeddings:** merge 1D, 2D, 3D, and high-dimensional slides into one slide with a very smooth transition.
- [x] **Position:** make the great-circle trail/traces visible, not only the current point.
- [x] **Attention:** merge “Kontext zieht die Bank an seinen Platz” with “Attention verschiebt Bedeutungen in Kontexte”.
- [x] **Neural:** substitute the current w/b directly in wx+b; mention wx+b in the left prose; fix the learning-rate control; reset only the active optimizer; enlarge the formula; add a small loss-landscape tab.
- [x] **32×32×32:** extend to -2π..2π, shade the data region green and the approximation margins red.
- [x] **MLP:** move the preset bar back above the demo.
- [x] **Notebook/stream:** make the notebook as colourful as `../lndw`, state clearly that it is a strongly simplified, humanised view; merge notebook and stream slides; fix inactive box text; show only additions; remove Unembed from the residual stream.
- [x] **Remove** “Die Verteilung ist nicht die Antwort”.
- [x] **Meadow:** put “Die Karte der Wörter” directly after “Ein Wort nach dem anderen”.
- [x] **Navigation:** count slides 1..N instead of 0..N-1.
- [~] Re-run pages, height, PHP/JS validators, `check_all.py --fast`.

### Result of the newest request

- The deck is now **25 base slides** because the requested merges remove six
  base slides (embedding 4→1, attention 2→1, notebook+stream 2→1, and the
  distribution slide is gone). The navigation rail now counts **1..25**, not
  0..24; the old “1..31” label no longer matches the merged deck.
- The data slide has the language sample, GPT-3 mix, and the new sentence
  truth plot: DE Berlin/Spree with “Berlin liegt an der Elbe” as the false X;
  EN Nile/Egypt with “The Nile flows through Brazil” as the false X.
- BPE starts the tokenizer slide; the Start block is height-reserved.
- The loss tab, direct `w x + b` values, working learning rate, per-optimizer
  reset, larger formula, shaded -2π..2π margins, and top preset bar are in.
- Notebook + stream are one slide; the stream has Start + Attention/FFN 1 + 2,
  no Unembed, only positive additions, smooth bar tweens, and readable inactive
  labels. The notebook is colourful and explicitly marked as a simplified,
  humanised analogy.

## Newest request (2026-11-14, after the 25-slide merge)

- [ ] **Position:** show only the endpoints where the current point points, not the whole trail.
- [ ] **Attention:** “Kontext zieht die Bank an seinen Platz” must go through all three bank examples before advancing.
- [ ] **Forward/backward parity:** the same experience in both directions through every slide; activation must go back; complex demos such as the loss landscape may reset. Keep transitions smooth and everything visible.
- [ ] **Neural order:** 1 neuron → loss landscape → 32×32×32.
- [ ] **Live matrices:** in both “Matrizen zeigen” views show all numbers as live matrices rendered with Temml.
- [ ] **Neural→next hang:** find and fix the pause when leaving “Was sind neuronale Netze?”.
- [ ] **Similarity demo:** in “Ähnliche Worte finden”, add the embeddinglab-style angle/dot-product interpretation demo (Vector A/B, dot product, neutral/related/opposite).
- [ ] **Scale invariance:** add “Scale Invariance: Direction Is Often the Useful Signal” with a magnitude slider; cosine stays constant while Euclidean distance changes.
- [ ] Retest everything.

## Newest request (2026-11-14, after similarity/scale request)

- [ ] **Unembedding:** finish the angle/dot-product tab and the Scale Invariance tab; verify both in DE/EN and with keyboard/arrow navigation.
- [ ] **Position:** verify only the start/current endpoints remain (no trail).
- [ ] **Attention:** verify all three bank sentences are reachable with Next and Prev.
- [ ] **Forward/backward parity:** same experience in both directions; activation back; complex demos reset.
- [ ] **Neural order:** verify 1 neuron → loss landscape → 32×32×32.
- [ ] **Live matrices:** verify the numeric matrices are rendered with Temml in both phases.
- [ ] **Neural→next hang:** test and fix the pause when leaving “Was sind neuronale Netze?”.
- [ ] **RAG:** show a real chunk-vector demo: chunks → embeddings → compare the query with chunks → insert the best chunks into the context.
- [ ] **Compression:** the last step must not pop mathematics/objects/dreams out of nowhere; they emerge from the surroundings and from below after “Lebewesen” is summarized.
- [ ] **Data:** move “Viele Sätze, eine Wahrheit” to its own first substep of “Woher kommen die Daten?” and animate sentences near/far from the truth line.
- [ ] **Data:** replace the weak multilingual block with sunflower sentences in several languages pointing to the same fact.
- [ ] **Data:** explain that an LLM needs enormous amounts of data, that clean data at that scale is practically impossible, so noisy/wrong examples are included; the hope is that the errors average out.
- [ ] Re-run everything.

## Big finishing pass (2026-11-14, very last)

- [ ] At the very end run a **10-minute random monkey test on every slide**: click every control, fill every field with arbitrary values, drag every slider, exercise selects and canvases; capture crashes, fix at the root, and re-run.
- [ ] Measure interaction and transition times; optimize slow paths without losing functionality.
- [ ] Bring the deck to **31 slides**. Propose the remaining pages; inspect `..` and `../../` for eye-opening demos that can be adapted; make them beautiful, minimal, smooth and informative.
- [ ] Whole-deck coherence: what is missing, what is redundant, what should be reordered; keep it quick to grasp but technically solid.
- [ ] Smoothness and beauty pass across all demos, minimal but no important content removed.
- [ ] Re-run pages, height, PHP/JS validators, check_all --fast.

## Generalize and test the demo codebase (last)

- [ ] Read the whole Ten Minutes demo codebase again (all `assets/*scene*.js`, `intuition_learnsys-demos.js`, `learnsys.js`, shared visual helpers).
- [ ] Generalize repeated scene patterns without removing any functionality: DOM shell creation, canvas fit/resize, theme redraw, arrow-key navigation, tab bars, status/readout helpers, caption/controls layout.
- [ ] Deduplicate code; keep each scene self-contained and easy to modify.
- [ ] Write tests for every Ten Minutes page and a smoke path for every slide/demo: initial render, forward/back, controls, no console errors, no overflow, no height jump.
- [ ] Keep the existing validators green and add the new tests to the documented check list.

## Newest request (2026-11-14, after the long monkey run)

- [ ] First slide “Was ist ein LLM? Chat und Code”: while the user prompt is typed below, the agent window above must stay empty (no green bar). Make the window ~10% larger so everything fits without scrolling.
- [ ] Compression: name more early species/apes, not only human/chimp; fix the taxonomy grouping so “Katzenartige”, “Säugetiere” and the rest are plausible; cats are mammals. Mathematics, thoughts and dreams must not collapse into an unlabeled overlapping point; they should join at “Lebewesen”, together with archaea and the appropriate classification level; make it smooth.
- [ ] Bausteine: replace the “Die Spree liegt an Berlin” sentence block with the beginning of the real Wikipedia HTML for “Large language model”, syntax-highlighted, clearly labelled as one of many HTML documents. Explain the noise, the HTML structure and the factual text content; stress that an enormous amount of text is needed.
- [ ] Change the closing line to “Wir werden jeden dieser Schritte in den nächsten Tagen durchgehen und so erklären, dass man es wirklich versteht.” (EN equivalent).
- [ ] Unembedding: animate how the final vector forms an angle to every token direction, then sorts them, so the smallest angle becomes the highest probability; gorgeous, minimal.
- [ ] Position: leave a point at every visited position in the right great-circle view; never say “Großkreiswinkel”.
- [ ] “Attention reduziert Rauschen”: actually show “new” near Neujahr/Neubeginn etc.; let Left/Right move the context, not the “neighbourhood”; call it “Kontext”.
- [ ] Merge “Attention verschiebt Bedeutungen in Kontexte”, “Kontext zieht die Bank an seinen Platz”, and “Die kausale Matrix und die Heads” into one slide with sub-slides; remove the separate matrix slide.
- [ ] Neural: a line approximates the sine, it does not bend it.
- [ ] MLP own weights: after going forward/back the custom separation view stays empty except “noch nicht trennbar”; fix it from all angles.
- [ ] FFN: start with the bend at 0; explain the points are symbolic, live nonlinearly in high dimensions, and that the MLP lifts them higher and projects back to separate clusters; show how that lets the model represent contexts and continue to the next word.
- [ ] “Ähnliche Worte finden”: rework fundamentally with the angle/similarity demos from `../embeddinglab.php`.
- [ ] Re-test everything.

- [ ] Mobile: many demos leave a lot of empty space at the bottom, so they render smaller than necessary. Make every demo fill the available stage height without breaking controls or overflow.
