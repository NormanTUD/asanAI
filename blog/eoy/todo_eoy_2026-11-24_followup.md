# EOY follow-up (2026-11-24)

Use this as the active checklist for the new requests. Keep the opencode todo
list in sync and exactly one item `[in work]`.

## Current

- [done] "Arten von Halluzinationen": the window must have its maximum needed
  height from the start; switching types must not change the container height.
  Measured 520 px for all eight types, DE+EN.
- [done] "So werden Halluzinationen seltener": replace the exact percentage
  with a qualitative risk word: relativ gering / mittel / hoch (EN: relatively
  low / medium / high). The ring stays; the `%` unit is gone.
- [done] "Geschichte in zehn Schritten": remove the aurora background and make
  the slide substantially prettier: calmer paper stage, stronger timeline,
  clearer active step, more editorial panel, larger media and source chips.
- [done] New mouseovers: insert line breaks between clauses and values; stop
  "Vom Zug zum Brett" from opening the global tooltip on top of its own tooltip.
  Position canvas: 2 lines; worldmodel: global hidden, custom tip multiline.
- [done] "Vom Zug zum Brett": hovering the three 8×8 probability fields names
  the matching 64×3 row/column and highlights that 64×3 cell.
- [done] "Wie ein LLM sein Weltmodell aufbaut": hovering a 64×3 cell
  highlights the matching field only in the map for that state (leer, mein
  Spieler, Gegner), not in all three; hovering a map cell keeps the link.
  Tooltip names the 64×3 row/column and the source activation/probe row.
- [done] Run eoy media interactions + JS validator and record raw output.
  `eoy_media_interactions_test.py`: 2176 checks, 0 failures (DE+EN), including
  the rebuilt limits bench and its auto-run navigation. `js_validator.py`:
  0 errors, 236 existing warnings.
- [done] "Grenzen: Was LLMs nicht zuverlässig können": rebuilt as a single-focus
  four-test bench. One evaluated text, one result, one aha line and three
  practical actions per test. Real newlines in prompt cards, stable container
  height, no moving background, no fake delay, clear source per test. Next
  starts the current test and auto-runs the next; Back restarts the previous.
- [done] Commit/push after explicit confirmation.

## Notes

- Do not touch the eoy search indexes; the eoy course is not indexed.
- Keep all existing hover explanations and `data-tip` attributes intact.
