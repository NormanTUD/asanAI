# EOY next pass — checklist (2026-11-22)

New durable checklist for the remaining work. Work top to bottom; update this
file after every completed item.

## Done already (do not redo)

- Takeaway: no green focus cycle, no jumping, no `[object HTMLDivElement]`.
- Attention: fully connected weighted graph, visible `␣` tokens, 2D vector panel.
- Residual: high-contrast labels and a pale-blue stream panel.
- Hallucination types: context vs training data, RAG lost-in-the-middle
  (Liu et al., 2023), source-kind strip.
- Risk/limits/society: unequal-access bias, Hugging Face alignment incident,
  four-test limits bench, society value chain.
- Mary's Room: grayscale world, no S/W/Rot labels.
- Architecture: current sub-step marker, next-pages subnav removed, animated
  5-layer trajectory with hover, f(x) card, Attention → LayerNorm → FFN order.
- FFN: static separation diagram on the FFN sub-slide (`ffnsplit`).
- "Zwei Schichten, ein Trick": A/B can span word groups/sub-sentences.
- "Drei Dimensionen": human plane flat, category planes, layer text labels gone.
- "Wie findet man gute Punkte?": wider surface, valley camera, momentum inside,
  green bottom 10%, red top.
- "Tiefe Netze biegen die Kurve": full dynamic width.
- "Die Rolle von neuronalen Netzen im Transformer": bend content shifted down.
- "Ähnliche Worte finden": stop/start rotation.
- "Die Karte der Wörter": high-contrast hover percentage bars.

## Open tasks

1. **3D "Drei Dimensionen" — user-driven directions** — **done**
   - The category planes stay until the reader presses "Richtungen"; no timer.
   - "Richtungen" fades the points out while arrows grow from (0, 0, 0) to the
     old point positions; hovering an arrow shows word and numbers.
2. **"Die Architektur als Funktion" — move to its own sub-slide** — **done**
   - New `demos/fx.js` scene and `bausteineFunctionStep`; order is now
     architecture overview → function sub-slide → data slide.
   - The f(x) card keeps pretraining/fine-tuning, the Nudge button, and the
     Matte / Heizung / Gleichung options with explicit status labels.
3. **Residual stream — left long line** — **done**
   - Vertical left line with hover tooltips; 3-column layout with mobile
     fallback. The text says the embedding tokens form the initial values and
     every layer adds to these word positions.
4. **Test fixes** — **done**
   - Removed the "Die nächsten Seiten …" phrase from the architecture body.
   - FFN separation canvas now has an aria-label in the HTML.
   - Tests updated for the new sub-step order and the f(x) slide.
5. **f(x) Nudge interaction**
   - Make the Nudge button green.
   - Pressing Next on the f(x) slide should click the Nudge a few times
     (advance the steps) before leaving the slide.
6. **f(x) Nudge behavior**
   - Nudge itself twice automatically.
   - Let the user keep nudging Matte up to 99%.
   - At 99%, let the percentages fluctuate slightly instead of freezing.
   - Comment the behavior so it is not removed accidentally.
7. **3D: planes out, arrows guaranteed**
   - Remove the category planes from the 3D view completely.
   - In 3D, every word must be a bare arrow from (0, 0, 0) to the word position;
     no points, no planes.
   - Implement five independent guards (state, draw, points, arrows, aria/test)
     and add comments so this cannot regress silently.
8. **Final gate**
   - DE + EN media suite.
   - `eoy_pages_test` 27/30/31 and the full suite.
   - `js_validator`, `php -l`, commit/push.

## Notes

- f(x) slide order: `bausteineIntro` → new function sub-slide → `bausteineData`.
- Do not fake LLM output; the limits page keeps its simulation labels.
- Sources used in this pass: Liu et al. 2023; Gururangan et al. 2022; Joshi et al.
  2020; Dodge et al. 2021; Ozer et al. 2026; Zhang 2026.
