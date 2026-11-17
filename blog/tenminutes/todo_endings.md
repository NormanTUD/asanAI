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

- [ ] Find every displayed formula/expression in `intuition_learnsys-data.js` that is plain text.
- [ ] Convert inline math to `$...$` and display math to `$$...$$` inside `.md`/body/watch.
- [ ] Check `W_U`, `h`, `z_i`, `p_i`, `cos`, `softmax`, `Σ`, `α`, `R²`.
- [ ] Keep box `tex` fields; they already use TeX.
- [ ] Verify `data-tex` renders in both languages.

### B. Redesign unembedding (“Ähnliche Worte finden”)

- [ ] Remove the Euclidean metric toggle and the point-map representation.
- [ ] Show tokens as directions/rays, not points.
- [ ] Show that two points far apart on the same ray have the same angle.
- [ ] Explain unembedding precisely: `z = W_U h`, or `z_i = w_i · h`; then softmax.
- [ ] Replace map mode with a direction/compass view.
- [ ] Keep angle / scale-invariance / unembed steps, but make them visual and minimal.
- [ ] Rewrite DE/EN text with `$...$` math.
- [ ] Make the scene gorgeous: axis, arrows, projection, steering, no clutter.

### C. Remove “Von Logits zu einer Verteilung”

- [ ] Remove `softmaxSteps[0]` from the `steps` array.
- [ ] Ensure softmax remains explained in unembedding and sampling.
- [ ] Update deck slide count in the page test.

### D. New end slides

#### D1. Sentiment directions / ITI

- [ ] New step + demo scene `sentiment`.
- [ ] Visual: one axis, positive/negative clouds, projection, steering slider.
- [ ] Visual: selected heads nudged by `+ α w` for ITI.
- [ ] Minimal labels: “Richtung”, “Projektion”, “Steering”, “Wahrheit”.
- [ ] Sources: Tigges et al. 2023; Li et al. 2023.
- [ ] DE/EN text, boxes, questions.

#### D2. Induction heads

- [ ] New step + demo scene `induction`.
- [ ] Visual: `A B … A → B` with attention arc.
- [ ] Visual: previous-token head + induction head two-layer circuit.
- [ ] Visual: next-token bar and a tiny phase-change sparkline.
- [ ] Source: Olsson et al. 2022.
- [ ] DE/EN text with minimal words.

#### D3. Grokking progress measures

- [ ] New step + demo scene `grokking`.
- [ ] Visual: train/test loss, three phases, delayed generalization.
- [ ] Visual: restricted/excluded loss progress measures.
- [ ] Visual: Fourier spectrum + angle-addition circle.
- [ ] Source: Nanda et al. 2023.
- [ ] DE/EN text with questions/answers.

#### D4. Space and time

- [ ] New step + demo scene `spacetime`.
- [ ] Load `../atlas_data/world.json` for a faint world map; fallback to grid.
- [ ] Visual: map with predicted coordinates and R².
- [ ] Visual: predicted year vs. true year diagonal.
- [ ] Visual: space/time neurons heatmap.
- [ ] Source: Gurnee & Tegmark 2023.
- [ ] DE/EN text with minimal words.

### E. Integration & validation

- [ ] Add new steps to `steps` at the end.
- [ ] Update slide count in `blog/tests/tenminutes_pages_test.py`.
- [ ] Ensure all new demos register and mount.
- [ ] Check no horizontal overflow, no console errors, math rendered.
- [ ] Desktop + mobile screenshots/OCR.
- [ ] `tenminutes_pages_test.py`, `tenminutes_height_test.py`, `check_all.py --fast`.
- [ ] `node --check` new JS files, `php -l`, `git diff --check`.
