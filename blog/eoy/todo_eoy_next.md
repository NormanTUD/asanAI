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

1. **3D "Drei Dimensionen" — user-driven directions**
   - Do **not** auto-hide the category planes. They stay until the reader acts.
   - Remove the "Ebenen" option; use "Richtungen" instead.
   - The first action after showing the planes is a "Richtungen" control:
     hide the planes, fade out every point, and grow an arrow from (0, 0, 0) to
     exactly the old point position. Not a jump: animate point → vector.
   - Hovering an arrow shows the word and its numbers.
   - Keep the existing category-plane content briefly, then let the reader
     choose the direction view.
2. **"Die Architektur als Funktion" — move to its own sub-slide**
   - It must come **immediately after** "Die Architektur von LLMs" and **before**
     the data slide that currently comes first.
   - Move the f(x) card out of the architecture overview/transformer subpages
     into a dedicated scene/substep.
   - Keep the f(x) card, the Nudge button, pretraining/fine-tuning, and the
     next-word example. Show all candidate options and state which cannot be the
     next word (in the data, plausible but not in this example, impossible).
3. **Residual stream — left long line**
   - Keep the left vertical line, the hover tooltips, and the short sentence:
     tokens from the embedding form the initial values; every layer adds to
     these word positions.
   - Verify the new 3-column layout and the mobile fallback.
4. **Test fixes**
   - Remove "Die nächsten Seiten …" from the architecture body as well, not just
     the subnav; the media test checks the body.
   - Give the FFN separation canvas an aria-label in the HTML so it is present
     before/without a draw.
   - Re-run all tests once at the end; fix regressions.
5. **Final gate**
   - DE + EN media suite.
   - `eoy_pages_test` 27/30/31 and the full suite.
   - `js_validator`, `php -l`, commit/push.

## Notes

- f(x) slide order: `bausteineIntro` → new function sub-slide → `bausteineData`.
- Do not fake LLM output; the limits page keeps its simulation labels.
- Sources used in this pass: Liu et al. 2023; Gururangan et al. 2022; Joshi et al.
  2020; Dodge et al. 2021; Ozer et al. 2026; Zhang 2026.
