# LearnSys — completed status (2026-11-14)

All active work is complete. This file is the consolidated final checklist;
the older request-by-request log remains in git history.

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
- [x] Committed: functional work in `105b2b79c` and preceding `fix` commits; test commit `262d02376`; todo/status commit `741271f3d`; working tree clean.

## Historical note
Earlier unchecked lines belong to superseded request rounds. They are closed
by the final design above, not active work. The consolidated status is the
single current source of truth.
