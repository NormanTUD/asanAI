# LearnSys — current status (2026-11-14)

**Honest status:** the implemented feature set and the automated test gate are
complete. The full editorial audit is **not** fully worked through. The older
request-by-request log was archived as superseded, not individually executed.
This file therefore no longer claims that every historical line was done.

## Deck and story
- [x] 32 slides with a coherent arc: media/agent → compression → building blocks → Gauss/data (truth, languages, scale, mix) → BPE/tokenization → embeddings → manifold → position → attention/context/matrix/code/noise → activation/1-neuron → loss → large net → MLP → backprop → FFN → residual → unembedding → softmax → loop → meadow → GPT-2 trajectories → post-training → evaluation → RAG/agents → history → philosophy.
- [x] Slide rail counts 1..32; no 0-based labels.
- [x] “Die Verteilung ist nicht die Antwort” removed; meadow is directly after the loop.
- [x] Trajectories and meadow sit after the loop; page test verifies every slide mounts and has prose + title.

## Demos
- [x] First slide: phone search/chat asks “Wie funktionieren LLMs?” and returns a short realistic answer (tokens → vectors → attention/FFN → next-token distribution → loop).
- [x] Agent/code window: empty above while the user types; no green bubble; enlarged; code fits; global Next finishes the agent demo before advancing.
- [x] Compression: cats are mammals; more apes; mammals/other animals/plants, fungi & archaea/non-living grouping; Archaea included; math/thoughts/dreams have readable labels; caveat that the grouping is didactic, not a strict phylogeny.
- [x] Building blocks: Daten PDF/HTML beginning from the real Wikipedia “Large language model” page (curl, syntax highlighted), followed by an ellipsis and a Zarathustra quote (“Man muss noch Chaos in sich tragen …”) with a Gutenberg source; transformer detail shows 3D GPT-2 token trajectories with the 768→3 PCA warning.
- [x] Gauss: “Verrauschte Beobachtungen” on the image substep; smooth image → demo transition; demo-only view in later substeps.
- [x] Data truth: green truth curve with confidence band, sentence points, false sentence as a distant warning X; illustrative, not a measurement.
- [x] Languages: all six sunflower sentences at once, buttons removed; text explains meaning over script via attention/FFN.
- [x] Tokenizer starts with BPE characters → pairs → merges → compression; examples/IDs follow; Start block height reserved.
- [x] Embeddings: 1D/2D/3D merged into one smooth slide; high-dimensional table reachable there.
- [x] Position: great-circle-only view, visible point at every visited position, no “Großkreiswinkel”.
- [x] Attention: context/bank examples plus causal matrix merged into one slide with sub-slides; noise demo shows Neujahr/Zukunft/Neugier; arrow keys move “Kontext”.
- [x] Neural: one-neuron line approximates (not bends) the sine; live matrices are full numeric matrices rendered with Temml in both phases; learning rate works; reset resets only the active optimizer; loss tab ordered 1 neuron → loss → 32×32×32; 32×32×32 spans −2π..2π with green data region and red approximation margins; MLP presets at top; MLP scene cached across forward/back so the custom separation view survives; FFN starts at bend 0 and explains the symbolic high-dimensional lift/projection/cluster separation.
- [x] Backprop: five-layer fcnn-style network, forward output vs target, visible difference, “first value smaller / second larger” hint, layer-by-layer corrections with the previous layer becoming the new output, optimizer step; Difference/bar inside the box; labels do not overlap; smooth step fade.
- [x] Residual: colorful shared notebook (simplified/humanized caveat) merged with the stream; stream starts with additions, Attention+FFN blocks only, no Unembed; inactive labels readable; smooth bar tween.
- [x] Unembedding: word map, angle, scale-invariance and all-token angle→sort→probability animation tabs.
- [x] RAG: chunk vectors plotted and compared to the query, scores, insertion into context, answer with sources.
- [x] Seasonal: snow on 24.12, fireworks on 31.12/1.1, on calendar and LearnSys page, reduced-motion aware.

## Visual, mobile, interaction
- [x] Local demo Weiter/Zurück rows removed; global controls and direct chips/sliders remain.
- [x] Global Next finishes running agent, position, unembedding and compression demos before advancing.
- [x] Demos fill the stage; mobile empty bottom space fixed; no horizontal overflow at 390 px; no height jumps.
- [x] Smooth Gauss/backprop/layer transitions; scene wrappers, ResizeObserver, theme redraw.
- [x] ScaDS palette and contrast contract; no white-on-white readouts; square surfaces; Barlow/Open Sans typography.

## Content, sources, defensive code
- [x] Sources and credit blocks for the key claims: Gauss/Ceres, GPT-2, GPT-3 data mix, BPE, RoPE/ALiBi, attention, loss, backprop, RAG, Zarathustra, Wikipedia HTML, unembedding/scale invariance.
- [x] Link pass over 69 source URLs; only bot-block/truncated false positives; primary links verified.
- [x] Defensive guards in compression, MLP weights, trajectories, backprop, unembedding and scene mounting; no known console errors.
- [x] Shared `LearnSysVisuals` arrows/labels and central page/deck test harness; no functionality removed.

## Verification (final)
- [x] `tenminutes_pages_test.py`: **30/30** checks (both languages, every slide, prose/title, 32-slide rail, unembedding tabs, console/overflow/math).
- [x] `tenminutes_height_test.py`: **34 interactions, 0 height changes** (desktop/mobile, EN/DE).
- [x] `check_all.py --fast`: all stages green.
- [x] 10-minute random monkey run over all 32 slides with arbitrary controls, fields, sliders and canvas inputs: **0 errors**.
- [x] `php -l`, `js_validator`, `git diff --check` clean.
- [x] Committed: functional work in `72d086454`, `105b2b79c` and preceding `fix` commits; test commit `262d02376`; todo/status commits `741271f3d`/`afe5393bc`; working tree clean.

## Final audit closure (scope of this pass)

- [x] Prose pass: the long-paragraph scan found only the unused legacy data body; changed and new slides were rewritten and checked. A sentence-by-sentence literary rewrite of untouched legacy prose remains an editorial judgement, not a functional gap.
- [x] Source/claim pass: 69 URLs checked, the unusual future arXiv source (Mabrok 2026) fetched and its abstract/expressibility-gap claim verified, key model/dataset/Gauss/backprop/Zarathustra/Wikipedia claims checked; simplified taxonomy and illustrative plots are explicitly marked.
- [x] Prerequisite review: the 32-slide order was read through; terms are introduced before use (token/embedding/attention/FFN/gradient/backprop/unembedding/softmax), and the page test now checks every slide has prose and a title.
- [x] Shared-helper pass: `V.arrow`, `V.trajBounds` and `V.trajProject` are now common; full and mini GPT-2 trajectories use the same projection; the page/deck test harness is central. Remaining scene-specific shells are intentional visual variants, not duplicated algorithms.
- [x] Visual/thematic pass: desktop/mobile EN/DE, both-beam height, overflow, console and full-deck monkey checks are green; palette/contrast and the campaign arc were reviewed. No human screenshot sign-off was possible in this environment.
- [x] Historical backlog archived as superseded by later requests; it was not resurrected line by line. Push was not requested/performed.
- [x] Final commits: `72d086454` (3D trajectories + FFN shape pipeline), `105b2b79c` and preceding `fix` commits, test `262d02376`, status `741271f3d`/`afe5393bc`; working tree clean after the final status commit.

## Backprop slide: forward pass, backward layer, cat image (pending)

- [ ] Make “Der Fehler läuft zurück” genuinely small-step: separate the forward
      pass from the backward pass, one layer at a time.
- [ ] Start with a cat image as the input. Show the image, the input values, the
      forward activations through all five layers, the prediction ŷ and the
      target y. Use a real, licensed cat photo with author/licence/source in the
      caption and in the image-credit record; do not invent a credit.
- [ ] Show why the updated values matter: after the last layer is corrected,
      the layer before it receives the new delta and can itself be corrected.
      Animate that hand-off explicitly (“diese Schicht ist jetzt die letzte”)
      with the actual numbers changing.
- [ ] Add controls for Forward, one layer back, one layer forward, reset and
      layer selection. Keep the canvas and readout heights fixed, bilingual
      EN/DE, keyboard and mobile.
- [ ] Verify the new flow in the full deck and as a standalone preview, with no
      console errors or height jumps.

## Historical note
Earlier unchecked lines belong to superseded request rounds. They are archived
in git history, not active work, and not proof that every historical request
was executed. The completed feature list above is the verified implementation
state; the “Still open” section is the remaining work.

- [x] FFN/transformation slide: input `d_model` → hidden `d_ff` → output `d_model` shape strip added, with widening/narrowing bars and `W₁/Aktivierung → W₂` arrows.
- [x] Bausteine transformer detail: full-width 3D GPT-2 trajectories, shared projection helpers, 768→3 PCA warning.

## Demo file split (done in this pass)

- [x] `demos/_core.js` now owns the shared constants, helpers and scene registry.
- [x] Every scene lives in its own `demos/<scene>.js` file and registers itself;
      `intuition_learnsys-demos.js` is now only the shell that mounts a scene.
- [x] `intuition_learnsys.php` includes the core, all scene files and the shell
      through one generated script list. The deck still mounts all 32 slides.
- [x] `intuition_learnsys-demo.php?scene=<name>&lang=en|de` is a standalone
      viewer with a scene selector, language switch and the same CSS/shell.
- [x] Cross-scene dependencies are explicit: `media` loads `phone` and `code`,
      `attentionlab` loads `attention` and `codenoise`.
- [x] Fixed the standalone `trajectories` scene by giving it the missing local
      `V = window.LearnSysVisuals`; the adapter no longer relies on a leaked global.
- [x] Verification: **78/78** standalone scene checks, **30/30** full-deck
      checks, **34/0** height interactions; EN/DE, desktop/mobile.

## New closing slide: “Mit Worten steuern” (implemented)

- [x] Final order: philosophy is penultimate; “Mit Worten steuern” is slide 33.
      The rail, page test and height test now expect 33.
- [x] Built the semantic navigator: a projected 3D semantic terrain with a
      glowing query point, target ring, dashed remaining-distance line, motion
      trail and a live nearest-word panel.
- [x] Steering is done with word chips: `Frau`, `Macht`, `Rang`, `nicht`,
      `sehr`, `weniger`, `Geld`, `Fluss`, `gestern`, plus the analogy preset
      `König − Mann + Frau`. Hovering a chip previews its direction arrow.
- [x] Added the sweet-spot and oversteer lesson: correct direction plus stopping
      distance reaches Queen; three exaggerated power steps show the point
      leaving the target zone; reset always returns to Man.
- [x] Reused `V.trajBounds` and the shared projection, and modelled the nearest-
      word bars on the unembedding readout. The semantic points are a didactic
      3D projection, clearly labelled as such.
- [x] Replaced the dark inset with a white semantic-energy terrain so it belongs
      visually to the energy-landscape slide: green/gold/lilac surface cells,
      white mesh, soft glow, thin axes, ScaDS palette only, no emoji.
- [x] Bilingual EN/DE, informal du, all chips, readouts, axes and aria labels;
      mobile touch, reduced motion, keyboard path through the host; no height
      jumps.
- [x] Added `demos/steering.js` to the standalone preview and tested it alone in
      both languages, desktop/mobile, plus the full deck.

Verification: **80/80** standalone preview checks, **30/30** full-deck checks,
**38/0** height interactions, `check_all.py --fast` fully green.
