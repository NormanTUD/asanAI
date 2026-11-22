# EOY — all open work (2026-11-22)

Use this file as the single current checklist. Update it after each completed
item.

## Completed

- Takeaway, attention graph, residual contrast/left line, hallucination types,
  risk/limits/society, Mary's Room, architecture marker and trajectory hover,
  FFN separation on the sub-slide, Drei Dimensionen planes/categories, loss
  landscape, deep-network width, rotation pause, word-map hover bars.
- 3D embedding: points first; after the last example (Zauberer − Mann + Frau),
  Next turns them into arrows from (0, 0, 0); no category planes.
- f(x) slide is its own substep after the architecture overview and before the
  data slide; options Matte/Heizung/Gleichung have status labels.
- Nudge: green, auto-nudges twice, user can go to 99 %, then percentages
  fluctuate.

## Open

1. **Rapid-navigation animation speed** — **done**
   - `LearnSys.next()` detects rapid presses and raises `LS.motion.speed`;
     animations use `LS.motion.scale`.
   - Weekday rolling/unrolling and the position sweep implement `speedUp()`;
     the rest fall back to `finish()`.
2. **Verify 3D guard**
   - Ensure the arrows only appear after the last example and never before.
   - Ensure no category planes and no points in the final direction state.
3. **Verify f(x)**
   - Auto 2 nudges; user can continue to 99 %; fluctuation at the top.
4. **Final tests**
   - DE + EN media suite; fix any failures.
   - `eoy_pages_test` 27/30/31 and the full suite.
   - `js_validator`, `php -l`.
5. **Commit and push**
   - `git add` all intended files, commit, push to origin/master.

## Notes

- New scene: `demos/fx.js`.
- Strong guards/comments in `demos/embedding.js` for the final 3D direction
  state; do not add planes or points back.
- Tests currently cover the f(x) substep, 3D final arrows, residual hover, FFN
  separation, and the limits simulation labels.
