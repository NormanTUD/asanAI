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

## Temporary camera capture (Ein Wort nach dem anderen)
- [x] Red “Kamera erfassen (temporär)” button under the loop demo.
- [x] Button writes a copyable `camera: { yaw, pitch, zoom }` line from the current rotated view.
- [x] `loopScene` accepts `demoState.camera` so the captured values can be installed as the default later.
- [ ] Wait for the user’s captured camera line, then set it as the default for the “Ein Wort nach dem anderen” slide.
