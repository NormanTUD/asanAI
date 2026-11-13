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
