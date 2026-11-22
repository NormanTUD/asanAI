# EOY deck — working notes (2026-11-22)

This file is the durable checklist for the current EOY pass. It records what is
done, what is still open, and the exact validation commands. The user asked for
this file before further edits.

## Status (last updated 2026-11-22)

**Done before the latest request**
- Takeaway: no "Prüffragen" row, no green focus cycle/progress bar/dots, no
  pulsing distribution bar or "sampeln", no `[object HTMLDivElement]`.
- FFN main visual: gradient, halos, glow, translucent separating plane.
- Attention: fully connected graph, weighted edges with arrowheads and
  percentages, visible `␣` whitespace labels, prettier 2D vector panel.
- Residual: high-contrast notebook/stream labels (`C.ink`, `onDark`).
- 3D embedding: normal point plot plus an "Pfeile" view that draws every word
  as an arrow from the origin; body/watch text updated.
- Hallucination types: two-source strip (weights/training data vs context/RAG),
  source-kind highlight, RAG context-position strip with Liu et al. (2023),
  richer boxes and sources.
- Risk/limits/society: speech-recognition bias, censorship examples, agent
  test-editing, four-test limits bench, five-stage value chain.
- Mary's Room: grayscale world, no S/W/Rot pseudo-labels.
- Architecture overview: current sub-step marked in the left stack and residual
  flow; "Die nächsten Seiten …" subnav removed.
- Architecture "Denken = Punkte verschieben": restored to the animated
  5-layer, 4-token trajectory with thick, visible lines and a step button.

**Current work when the latest requests arrived**
- The static "Input / Hidden / Output" separation diagram was moved to the FFN
  **sub-slide** ("Im FFN: auffächern und zurück", scene `ffnsplit`) and the extra
  card was removed from the main FFN role slide. This is done.
- Tests: DE quick run reached 681 checks with one performance flake in the
  media switch (`maxFrame` 286 ms); EN reached 680 checks with one case-sensitive
  workspace string check (test fixed). A clean DE+EN run is still needed.

**Open tasks (work stepwise)**

1. **FFN sub-slide placement / main FFN cleanup**
   - Remove the extra "2D-Bewegung / Eine Schicht verschiebt die Punkte im Raum.
     Vorher → nachher." card from the main FFN role slide ("Die Rolle von
     neuronalen Netzen im Transformer") so the top has enough space.
   - Put the static "Input / Hidden / Output" separation diagram on the FFN
     sub-slide (`ffnSplitSubstep`, scene `ffnsplit`) instead. Keep it static and
     purely visual: tangled input, separated hidden regions, isolated/reassembled
     output, with dashed region ellipses and W₁/W₂ arrows.
   - Update the FFN sub-slide body/watch text accordingly.
2. **"Drei Dimensionen"** — **done**
   - Human words now sit at z = 0, so the old power × gender plane is flat.
   - The category axis is human (z = 0) / animal (z = -1) / fiction (z = +1),
     drawn as three planes; rank stays on the power axis.
   - The layer text labels inside the 3D plot were removed; the planes are
     visible without them.
   - Table header and 3D text updated; sources unchanged.
3. **"Zwei Schichten, ein Trick"** — **done**
   - The text now says $A$ and $B$ are tokens and can be words, word pieces, or
     larger recurring units; in real text the pattern can span word groups or
     whole sub-sentences.
4. **Bias example — rich/poor, access to knowledge** — **done**
   - The risk-map item is now "Ungleicher Zugang / Unequal access"; it uses the
     quality-filter finding (Gururangan et al., 2022), language inequality
     (Joshi et al., 2020), and webtext filtering (Dodge et al., 2021).
   - Sources verified on arXiv; body, box and test updated.
5. **Limits page — complete presentation rewrite** — **done**
   - Four realistic test scenarios: support-ticket classification, source for an
     article, current city-office hours, and a contract clause at different
     positions.
   - Each test now has a task, a real testing protocol, a clearly stamped
     simulated observation, and the countermeasure. A top disclaimer says the
     answers are constructed examples, not real model output.
6. **"Wie findet man gute Punkte?" — loss-landscape plot** — **done**
   - Surface range now includes all three optimiser trajectories with padding;
     base range is wider; default camera is turned to look into the valley.
   - Bottom 10% green, then green→gold→red; legend added.
7. **"Tiefe Netze biegen die Kurve" — full width** — **done**
   - Removed the 900 px cap and fixed 16:9 box; the stage now fills the available
     width and uses the dynamic height.
8. **"Die Rolle von neuronalen Netzen im Transformer" — clipped "Burg" label** — **done**
   - Bend content shifted down and halo label clamped below the top edge.
9. **"Das gemeinsame Notizbuch wird zum Stream" — top background** — **done**
   - Stream panel is now a pale blue tint with dark text instead of saturated
     petrol with white text.
10. **"Ähnliche Worte finden" — stop the rotation** — **done**
   - Added "Drehung stoppen / Drehung starten"; dragging also pauses the spin.
11. **Alignment example — name the Hugging Face incident** — **done**
   - The alignment item now names the July 2026 Hugging Face incident and cites
     Ozer et al. (2026), arXiv:2609.32390, and Zhang (2026), arXiv:2609.15494.
   - `aiRiskSub` body, box and sources updated; test checks the name.
12. **Architecture slide — f(x), pretraining, fine-tuning, next-word nudge** — **done**
   - Added a compact f(x) card: x → f(x) → P(next token), with the 01–04 loop
     (input, prediction, compare with the data, nudge weights).
   - Pretraining f(almost the whole internet) and fine-tuning f(small question
     set) are shown side by side.
   - Next-word example: "Die Katze sitzt auf der ___" with Matte / Heizung /
     Gleichung and a Nudge button that shifts the bars toward Matte.
13. **Trajectory plot — crisp scaling and hover** — **done**
   - Larger stage, thicker lines and points, all five layer points visible.
   - Hover shows a ring and a tooltip like "Katze · L1".
14. **Architecture subpage order** — **done**
   - Transformer subpages and prose now go Attention → LayerNorm → FFN, matching
     the displayed pills and architecture list. The blocks test was updated.
15. **3D embedding — final direction state** — **done**
   - With "Pfeile" active the points disappear; every word is an arrow from
     (0, 0, 0) to its position.
   - "Bedeutung ist Richtung" is shown in the plot and in the aria-label.
16. **"Die Karte der Wörter" — hover percentage bars** — **done**
   - The track is now a neutral ink tint with an outline; winner fill is green,
     other fills are ink; percentages use ink text.
17. **Residual stream — left long line with hover**
   - Rework the residual stream at the top of the architecture slide back into a
     long line on the left, with mouseover details.
   - Add one short sentence in the text: the tokens from the embedding form the
     initial values, and every layer adds to these word positions.
18. **Tests and finish**
   - Run DE and EN media suites; investigate the performance flake if it repeats.
   - Run `eoy_pages_test` for 27/30/31 and the full suite.
   - Run `js_validator`, `php -l`, and commit/push.

## Prior open items carried over

- Update the tests for the new takeaway state (no `.ls-tk-questions`; static
  panels; no object text). The media test currently checks the absence of the
  question row but should also assert that the `[object HTMLDivElement]` text is
  gone.
- Confirm the new limits test bench is covered in both languages.
- Confirm the society value chain and the risk examples are covered.
- Re-run the EN media suite and the 27/30/31 page walk after all edits.
- Run the full EOY pages suite before declaring done.
- Commit and push.

## Validation commands (from repository root)

```bash
node --check blog/eoy/demos/residual.js
node --check blog/eoy/demos/embedding.js
node --check blog/eoy/demos/hallucinationtypes.js
node --check blog/eoy/demos/takeaway.js
node --check blog/eoy/data.js
uv run --with playwright python3 blog/tests/eoy_media_interactions_test.py --langs de --steps 1 --cycles 1
uv run --with playwright python3 blog/tests/eoy_media_interactions_test.py --langs en --steps 1 --cycles 1
uv run blog/tests/eoy_pages_test.py --pages 27.php 30.php 31.php --langs en,de
uv run blog/tests/eoy_pages_test.py --langs en,de
uv run blog/tests/js_validator.py blog/eoy
```

## Notes

- Hallucination claims are grounded in Ji et al. (2023), Maynez et al. (2020),
  Huang et al. (2023), Rawte et al. (2023), Walters & Wilder (2023), Min et al.
  (2023), and the RAG/CoVe/SelfCheckGPT/Semantic Entropy sources already used on
  the page.
- RAG position effect: Liu et al. (2023), arXiv:2307.03172, finds performance is
  often highest when relevant information is at the beginning or end of the
  context and degrades when it is in the middle, even for long-context models.
- The 3D embedding slide uses the existing `embedding` scene. Do not introduce a
  second scene just for arrows; add a phase/toggle inside the scene so the
  `demoState` contract stays stable.
- The residual scene is a canvas; use the `C` palette from `api.colors()` and
  avoid hardcoded theme colours.
