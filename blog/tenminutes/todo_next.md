# LearnSys — complete requested work

Legend: `[x]` done, `[~]` partially done / verify, `[ ]` todo.

## Structure and story
- [x] 31 slides, reordered: intro → compression → neural nets → tokenizer → transformer → assistant/eval/RAG → history/philosophy.
- [x] “Was ist ein LLM?” + “KI-Chat” + code merged into one slide with three sub-slides: Suche, Chat, Code.
- [x] “Eine Schicht, dann der Stapel” removed as a duplicate.
- [x] Embedding pairs merged; total remains 31.
- [x] Mobile demo-first layout with collapsible text overlay; desktop unchanged.
- [x] Global bottom-left/back and bottom-right/next arrows.
- [x] Repeated helpers centralised in `LS.util` / demo API: `clamp`, `smoothstep`, `hexMix`, `arrowKey`, `goNext`, `goPrev`.

## Phone / chat
- [x] User types the message at the bottom and “Enter” is simulated; message appears above in the chat.
- [x] LLM label and answer bubble appear only with the first answer token.
- [x] Answer says the Google summary is written by a language model, very similar to this chat, which is also an LLM.
- [x] Answer says the next word is appended to the text and the whole text goes back as context.
- [~] Input field grows while typing; typing speed is about half the old speed.
- [x] Chat compose box appears smoothly when the user types / the LLM answers.

## Agent / code slide
- [x] Prompt is typed into the bottom `$` shell, not the top chat.
- [x] `himmel.py` header and code block appear only when code typing starts; window is uniform before.
- [x] Taskbar windows: Agent and Terminal are clickable.
- [x] Removed minimize/maximize buttons and taskbar minimize behaviour.
- [x] Start menu / start-bar buttons do something playful.
- [x] `python3 himmel.py` types letter by letter in about 300 ms with randomised delays.

## Compression slide
- [x] Borges/book layout removed; Borges in an optional box.
- [x] Dense 144-node graph: cross-edges disappear, groups become islands.
- [x] Hierarchical levels 0–4: nodes → subclusters → groups → one point → larger connected whole.
- [~] Auto mode is too fast; needs slower pacing.
- [~] “Weiter” should advance exactly one level; verify and fix.
- [ ] Cluster points must keep the position of the individual points they replace, in this exact visual order.
- [ ] Add lossless vs lossy compression text: tokenization is lossless; the transformer as a whole is lossy.
- [ ] Add the training argument: models fit partly contradictory/incomplete data; the best average strategy is a realistic world model.
- [ ] Make the slide mouthwateringly gorgeous and truly visual: structures stay, details are forgotten; this is generalisation.
- [ ] Use the gravity example: newborn notices falling objects; adult compresses to “things fall, whatever the object”; scientific theory compresses further to acceleration/curved spacetime, covering more cases with better predictions.
- [ ] Final zoom-out: larger connected structures become points again, and those points are connected.

## Sinus neural network
- [x] Real TF.js model: x → 32 → 32 → 32 → 1, Dense + ReLU, live points, draggable points, loss.
- [ ] Training must start only when the user presses start, not automatically.
- [ ] Show a clear loss chart/curve below the canvas.
- [ ] Show the sinus both left and right outside the training data.
- [ ] Label points explicitly as (x, y) / (input, output) pairs.
- [ ] Pause training when the slide is not visible; keep CPU low.

## Loss landscape (parameters)
- [x] Real worker-based 1 → 4 → 1 model, 13 parameters, 21×21 loss surface, network diagram, trajectory, ball, play/step, lr.
- [ ] “Weiter” should train/advance the ball on the loss landscape.
- [ ] Show the real data points used by the model.
- [ ] Show the real network formula (1 → 4 → 1, tanh, output, MSE).

## MLP / manifold slide
- [x] Fine point-cloud / neighbourhood graph, auto-bend on “Weiter”.
- [x] Old controls, dots, duplicates hidden; dense controls moved to the bottom.
- [x] Sigmoid activation added; presets walk to “Trenner” and skip custom.
- [x] Weight sliders half width.
- [~] Copy text no longer stacks/moves under canvas; verify all 9 steps.
- [ ] Real one-layer network formula and real losses as in `../../loss_landscape.html`; show real loss values, not only schematic text.

## RAG and agents
- [x] New chapter/slide: chunks, vectors/angles, retrieval, context insertion, cited answer.
- [x] Agent loop: search → read → insert → answer; internet as a RAG corpus.
- [ ] Final wording/source polish if needed.

## Validation and delivery
- [x] Page test 10/10 EN/DE; check_all --fast 33/33; syntax/diff checks.
- [x] Centralisation refactor verified on worker, compression, FFN, TF sinus, chat/code, RAG.
- [ ] Re-run bilingual audit and height test after the latest UI edits.
- [ ] Commit and push the final batch.
