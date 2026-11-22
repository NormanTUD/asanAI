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
2. **"Drei Dimensionen"**
   - The old 2D plane must lie straight/flat in 3D, not skewed; when the new
     plane is added, the old plane should sit completely flat in the middle.
   - Add a categorical second plane: human / animal / (fairy tale or a better
     fitting category). Use plausible analogies; they do not need to be exact.
   - Make the categories visually clear and arrange the old plane between them.
3. **"Zwei Schichten, ein Trick"**
   - Replace "„$A$ und $B$ sind Platzhalter für beliebige Wörter.“" with the
     accurate statement that $A$ and $B$ can also be whole sub-sentences or
     longer phrases the head reacts to.
4. **Bias example — rich/poor, access to knowledge**
   - Replace the speech-recognition/noise example with one about **access to
     knowledge**: models learn mostly from digitally abundant, wealthier,
     English-speaking contexts; questions about low-income regions, local
     legal/medical knowledge, or low-resource languages are answered worse.
   - Find and cite the studies while implementing. Starting points:
     Joshi et al. (2020), *The State and Fate of Linguistic Diversity and
     Inclusion in the NLP World*; Gururangan et al. (2022), *Whose Language
     Counts as High Quality?*; Dodge et al. (2021), *Documenting Large Webtext
     Corpora*. Verify each source before using it.
   - Update the risk-map bias item, `aiRiskSub` body/boxes/sources, and any test
     that assumes the speech-recognition example.
5. **Limits page — complete presentation rewrite**
   - "Grenzen: Was LLMs nicht zuverlässig können" is currently the weakest page:
     the questions are arbitrary, and the lab pretends to show real LLM output
     when it does not. Keep the same content, but rebuild the presentation from
     scratch with better, realistic examples.
   - Do not fake model output. Label simulated examples clearly and explain what
     is reconstructed vs measured. Use realistic failure cases and make the
     reasoning visible.
   - Keep the four failure modes (paraphrase brittleness, fabricated citations,
     knowledge boundary, long-context position) and the countermeasures, but
     present them as a credible test bench, not as arbitrary quiz questions.
6. **Tests and finish**
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
