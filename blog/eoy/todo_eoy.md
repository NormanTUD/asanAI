# EOY deck — working notes (2026-11-22)

This file is the durable checklist for the current EOY pass. It records what is
done, what is still open, and the exact validation commands. The user asked for
this file before further edits.

## Current state

The last takeaway slide was the main target of the previous pass. The FFN and
attention slides were also edited because the previous message explicitly asked
for those two changes. The old slides were not changed for their own sake.

- Takeaway (`demos/takeaway.js`)
  - Removed the "Prüffragen" row.
  - Removed the green focus cycle, the moving green border, the progress bar and
    the bottom focus dots. Panels are now static.
  - Removed the pulsing distribution bar and the pulsing "sampeln" label.
  - Fixed the visible `[object HTMLDivElement]`: a trailing `+` concatenated
    `root.appendChild(el)` into `el.innerHTML`.
- FFN (`demos/ffn.js`)
  - Added a soft background gradient, cluster halos, active-point glow, a
    translucent separating plane and a clearer cluster label.
- Attention (`demos/attention.js`)
  - Fully connected graph: all token pairs have edges; selected row edges are
    thicker, brighter and carry arrowheads and percentages.
  - Tokens show a leading `␣` for whitespace; table and readout use the same
    labels. The 2D vector panel keeps its animated row transition and now has a
    grid and a `␣` legend.
- Residual (`demos/residual.js`)
  - **Open:** the top graphic on "Das gemeinsame Notizbuch wird zum Stream" has
    blue text on a blue background in at least one theme. Make the top title,
    badges, legend and stream labels high-contrast, using `C.ink` / `onDark`
    instead of `C.petrol` / `C.muted` where the background is dark.
- Hallucination types (`demos/hallucinationtypes.js`, `data.js`)
  - **Open:** the page does not make the difference between **context** and
    **training data** explicit. Add a visible two-source model and label every
    type by its evidence base.
  - **Open:** improve the lab further; keep it interactive and explanatory.
- Risk / limits / society (`demos/riskmap.js`, `demos/limitslab.js`, `data.js`)
  - Bias example is now speech recognition in noise/microphones.
  - Power risk names concrete censorship (Chinese models / Tiananmen; Western
    model red lines) with Noels et al. (2025) and Naseh et al. (2025).
  - Alignment risk uses an agent that edits the test that grades it.
  - Limits page is the new four-test reliability bench (paraphrase, citation,
    knowledge boundary, long context).
  - Society page is a five-stage value chain plus cross-section conflicts.
- Mary's Room (`demos/mindintro.js`, `data.js`)
  - No `S/W` / `Rot` pseudo-labels. Text says she lives in a grayscale world,
    has never had access to anything red, and knows every theoretical fact about
    colour.

## Open tasks

1. **Residual contrast**
   - Inspect the notebook and stream drawings.
   - Replace blue-on-blue text with `C.ink` on paper and `onDark` / `onDarkSoft`
     on the dark petrol panel. Check light and dark.
2. **3D embedding slide**
   - The 3D slide is `embedding` with `mode: "space", dim: 2`.
   - At the start, state that a word is not a point but a vector from the
     origin, i.e. a direction.
   - Show the normal 3D point plot first; then show the same words as arrows
     from the origin (or add a contrast step after the point plot). Add the
     explanatory sentence in the slide body and in the demo readout.
   - Keep the existing 3D drag and the tables.
3. **Hallucination types — context vs training data**
   - Add a clear two-source visual: **weights / training data** vs **context
     window / prompt / RAG source**.
   - Label each type:
     - training-data hallucination: false facts, outdated knowledge, fabricated
       citations, entity swaps;
     - context hallucination: intrinsic (contradicts the source) and extrinsic
       (adds unsupported details);
     - conflict: the context and the training data disagree, and the model picks
       one.
   - Explain that factuality is about the world, faithfulness about the source.
   - Keep the existing evidence inspector and countermeasures; add the source
     dimension to the claim readout.
4. **Tests**
   - Update `blog/tests/eoy_media_interactions_test.py` for the residual,
     embedding and hallucination changes.
   - Run:
     - `uv run --with playwright python3 blog/tests/eoy_media_interactions_test.py --langs de --steps 1 --cycles 1`
     - same with `--langs en`
     - `uv run blog/tests/eoy_pages_test.py --pages 27.php 30.php 31.php --langs en,de`
     - full `eoy_pages_test.py --langs en,de` if time allows.
     - `uv run blog/tests/js_validator.py blog/eoy`
     - `php -l` for changed PHP files.
5. **Commit / push**
   - Only after the suites are green. Include `todo_eoy.md` if useful.
   - Do not stage unrelated files.

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
- The 3D embedding slide uses the existing `embedding` scene. Do not introduce a
  second scene just for arrows; add a phase/toggle inside the scene so the
  `demoState` contract stays stable.
- The residual scene is a canvas; use the `C` palette from `api.colors()` and
  avoid hardcoded theme colours.
