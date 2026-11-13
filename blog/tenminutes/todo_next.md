# LearnSys — status and next work

## Done (verified in the page)
- [x] 31-slide order: intro → compression → neural nets → tokenizer → transformer → assistant/eval/RAG → history/philosophy.
- [x] Phone demo with separate Search / Chat / Code sub-slides, no auto-advance.
- [x] Chat answer box and “LLM” label only appear with the first answer token.
- [x] Code prompt is typed into the `$` shell; answer stays in chat.
- [x] Code taskbar has clickable Agent and Terminal windows.
- [x] `himmel.py` file header appears only when code typing starts.
- [x] Compression slide: dense 144-node graph, cross-edges disappear, 12 subclusters; hierarchical levels 0–4 and auto mode.
- [x] Borges text moved into optional box; no book-page layout.
- [x] FFN slide: fine point-cloud/neighbourhood graph; “Weiter” raises the bend automatically.
- [x] MLP slide: old controls hidden, global bottom arrows, dense controls at bottom, sigmoid, preset cycling, weight sliders half width.
- [x] Real TF.js sinus model: x → 32 → 32 → 32 → 1, dense + ReLU, 18 live points, drag points, training loop, loss.
- [x] Worker-based real loss landscape: 1 → 4 → 1, 13 parameters, 21×21 surface, network diagram, trajectory, play/step.
- [x] RAG/Agents slide: chunks, scores, context insertion, cited answer, agent loop.
- [x] Mobile demo-first layout with text overlay.
- [x] Centralised `clamp`, `smoothstep`, `hexMix`, `arrowKey`, `goNext`, `goPrev` in `LS.util` / demo API.

## Next (not finished)
- [ ] “Ein Wort nach dem anderen”: energy landscape must be isometric from above, not from below.
- [ ] “Verstehen heißt komprimieren”: slow down auto mode; “Weiter” must advance exactly one level; cluster points must stay at the previous point locations in the visible order; add lossless/lossy compression text (tokenization lossless, transformer lossy) and the training/world-model argument; final zoom-out must show connected higher-level points.
- [ ] “Ein kleines Netz lernt den Sinus”: user must start training manually; show loss chart below; show sinus left and right outside data; label data points as (x, y) / (input, output).
- [ ] “Die Parameter leben auf einer Loss-Landschaft”: “Weiter” should train/advance the ball; show the real data and the 1 → 4 → 1 network formula.
- [ ] Phone chat answer: explain that Google’s summary is written by a language model, very similar to this chat, which is also an LLM; give a first intuition.
- [ ] Verify MLP copy block no longer stacks/moves under the canvas; check every step on desktop and mobile.
- [ ] Bilingual audit EN/DE, height test, check_all, commit and push.

## Open from `todo_important_nnnn`
- [ ] Book/compression wording: lossless vs lossy, tokenization vs transformer, contradictory/incomplete training data, realistic world model.
- [ ] RAG/Agents wording and demo already added; keep the full source story.
- [ ] Any remaining visual polish requested after the last review.
