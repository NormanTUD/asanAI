# Ten Minutes — endings & formulas

Working checklist. Keep this file in sync with the opencode todo list.

## Done

- [x] Merge “Der Weg zum Brett” + “64 × 3 Zahlen werden ein Brett” into one slide.
- [x] Arrow-key / button stepping through six stages in the merged slide.
- [x] Move “Othello, auch Reversi” before “Token-Trajektorien durch GPT-2”.
- [x] Remove “Sicherheit ist ein Stapel, kein Schalter”.
- [x] Make the final geometry slide explicit (1 direction → subspace → many subspaces).
- [x] Add Gurnee & Tegmark as a source/box on the final geometry slide.

## Research (done)

- Sentiment directions: Tigges et al. (2023), arXiv:2310.15154.
- ITI: Li et al. (2023), arXiv:2306.03341.
- Induction heads: Olsson et al. (2022), Transformer Circuits.
- Grokking: Nanda et al. (2023), arXiv:2301.05217.
- Space & time: Gurnee & Tegmark (2023), arXiv:2310.02207.

## Open

### A. Formula audit

- [x] Find the plain-text formulas in the touched slides.
- [x] Convert the clear inline math to `$...$` (incl. `W_U`, `h`, `z_i`, `p_i`, `ŷ`, `L(w,b)`, `θ`, `η`, `∇L`, `α`, `σ`, `R²`).
- [x] Keep box `tex` fields for display math.
- [x] Verify `data-tex` renders in both languages via the page test.
- [x] Optional final sweep: older slides still contain names/architecture arrows, not equations.

### B. Redesign unembedding (“Ähnliche Worte finden”)

- [x] Remove the Euclidean metric toggle and the point-map representation.
- [x] Show tokens as directions/rays, not points.
- [x] Show that two points far apart on the same ray have the same angle.
- [x] Explain unembedding precisely: `z = W_U h`, or `z_i = w_i · h`; then softmax.
- [x] Replace map mode with a direction/compass view.
- [x] Keep angle / scale-invariance / unembed steps, visual and minimal.
- [x] Rewrite DE/EN text with `$...$` math.
- [x] Make the scene gorgeous: axis, arrows, projection, no clutter.

### C. Remove “Von Logits zu einer Verteilung”

- [x] Remove `softmaxSteps[0]` from the `steps` array.
- [x] Softmax remains explained in unembedding and sampling.
- [x] Deck slide count updated to 36 in the page test.

### D. New end slides

#### D1. Sentiment directions / ITI

- [x] New step + demo scene `sentiment`.
- [x] Visual: one axis, positive/negative clouds, projection, steering slider.
- [x] Visual: selected heads nudged by `+ α w` for ITI.
- [x] Minimal labels: “Richtung”, “Projektion”, “Steering”, “Wahrheit”.
- [x] Sources: Tigges et al. 2023; Li et al. 2023.
- [x] DE/EN text, boxes, questions.

#### D2. Induction heads

- [x] New step + demo scene `induction`.
- [x] Visual: `A B … A → B` with attention arc.
- [x] Visual: previous-token head + induction head two-layer circuit.
- [x] Visual: next-token bar and a tiny phase-change sparkline.
- [x] Source: Olsson et al. 2022.
- [x] DE/EN text with minimal words.

#### D3. Grokking progress measures

- [x] New step + demo scene `grokking`.
- [x] Visual: train/test loss, three phases, delayed generalization.
- [x] Visual: restricted/excluded loss progress measures.
- [x] Visual: Fourier spectrum + angle-addition circle.
- [x] Source: Nanda et al. 2023.
- [x] DE/EN text with questions/answers.

#### D4. Space and time

- [x] New step + demo scene `spacetime`.
- [x] Load `../atlas_data/world.json` for a faint world map; fallback to grid.
- [x] Visual: map with predicted coordinates and R².
- [x] Visual: predicted year vs. true year diagonal.
- [x] Visual: space/time neurons heatmap.
- [x] Source: Gurnee & Tegmark 2023.
- [x] DE/EN text with minimal words.

### E. Integration & validation

- [x] Add new steps to `steps` at the end.
- [x] Update slide count in `blog/tests/tenminutes_pages_test.py` to 36.
- [x] Ensure all new demos register and mount.
- [x] No console errors and math rendered (page test passes).
- [x] Mobile horizontal-overflow audit (0 px on all new slides).
- [x] Desktop screenshots/OCR for the new slides.
- [x] Mobile screenshots/OCR for the new slides.
- [x] `tenminutes_pages_test.py` 32/32 and `tenminutes_height_test.py` 0 jumps.
- [x] `check_all.py --fast` after final edits.
- [x] `node --check` for all changed/new JS.
- [x] `php -l` and `git diff --check`.

## Final pass

- [x] Re-read the five research briefs and check every number/claim on the new slides.
- [x] Remove remaining overclaims; the sentiment phrase now says “carries a large part of the concept”.
- [x] Verified English/German parity for the new canvas labels and data text.
- [x] Full validation and mobile visual audit done.

## Navigation polish

- [x] Fix `ls-navbar` flicker on substep changes: the text ghost no longer clones the navbar and starts below it.
- [x] Remember the last substep per slide; Next/Prev, the step rail and step dots restore it.
- [x] Verified with Selenium: unembed 18.2 → 19 → 18 restores “Länge vs. Richtung”; sentiment 32.2 survives Next/Prev.
- [x] The merged worldmodel slide also remembers its internal phase when you leave and return.

## Paper figure, interactivity, reader roles

- [x] Checked the Gurnee & Tegmark figure licence: arXiv page says CC BY 4.0. Used Figure 10 with author, licence and source in the visible caption.
- [x] Copied the figure to `blog/gurnee-tegmark-world.png`; added `assets/image-credits.json` entry; served a resized version through `image.php`.
- [x] Space/time is clickable: cities, historical figures and neuron rows update a readout.
- [x] Induction is clickable: click any token; the arc, next-token bars and note update.
- [x] Grokking has an epoch scrubber: drag to see phase, vertical marker and measure dots.
- [x] Sentiment direction mode has a projection slider; steering and ITI remain interactive.
- [x] Wrote `todo_readers.md`: 20 questions per new slide, tagged by reader role, with visual/text/gap status.
- [x] Re-ran page test (32/32), height test (0 jumps), image-credit test, and `check_all.py --fast` after the final changes.
