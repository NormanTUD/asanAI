# Fact audit — unresolved questions

Scope: all 95 course lessons in `blog/*.php`, their citations in
`literature.js`, and the generated Atlas/search data. The audit treated each
lesson as a local chart and then checked the gluing data across lessons:
repeated model specifications, dates, formulas, historical attributions and
bibliographic identities.

What is **not** in this file: issues that were checked and fixed. Those are in
the commits listed at the bottom and are guarded by
`blog/tests/fact_consistency_test.py`.

This file lists only claims that could not be settled with the sources
available here, or where a primary source could not be read. Each row says
what would settle it. Nothing here should be read as “known false”; it is a
worklist for a human with library access.

---

## 1. Primary source not accessible

| Where | Claim | Why unresolved | What would settle it |
|---|---|---|---|
| `derivativelab.php:41`, `derivativelab.php:235`, `optimizerlab.php:435`, `geometry_ii.php:186` | Hadamard’s 1908 memoir introduced steepest descent for clamped elastic plates. | The `hadamard1908` bibliography entry is still a Wikipedia history page (`literature.js`, author “Wikipedia contributors”, 2026). Gallica and the BnF catalogue block automated access from this host, and no DOI/Numdam record was found. | The original *Mémoire sur le problème d’analyse relatif à l’équilibre des plaques élastiques encastrées* (1908), or a scholarly history that quotes it. Replace the Wikipedia entry with that record. |
| `math_i.php:21` | The Lebombo bone is dated to 42,000–43,000 years ago “by 24 radiocarbon measurements”. | The cited Bruderer (2024) CACM article returned HTTP 403; the exact count of measurements was not visible in the abstract. | Full Bruderer article, or the original Border Cave/Lebombo dating paper. |
| `foam_of_meaning.php:369` | Intrinsic dimension “peaks around 19–22” and is “only 1–3 % of the ambient width”. | The cited arXiv abstract confirms an hourglass profile and the fitted slopes, but not these two numbers. | Full Mabrok (2026) paper, tables/figures with the per-layer intrinsic-dimension estimates. |
| `language.php:23` | The language capacity was “likely entering widespread social use by 100,000 years ago”. | The cited 2025 Frontiers paper supports linguistic capacity around 135 kya; the 100 kya social-use date is not in the title/abstract. | Full Miyagawa et al. (2025) article. |
| `history.php:1461` | Venture investment $1.3 bn (2010) → >$40 bn (2020); ~$70 bn corporate investment; twelve-fold article growth; tenfold NeurIPS attendance. | Taken from the Toosi et al. review; the underlying AI Index/source tables were not re-read. | Toosi et al. (2021) plus the AI Index tables it cites. |
| `information_market.php:51` | Pope John Paul II proposed Isidore of Seville as patron saint of the internet “around 1997”. | The lesson itself flags that sources disagree whether this was ever a formal decree. | Vatican act or a documented papal audience/statement. |
| `computer_vision.php:24` | LeNet-5 was “the first commercially deployed convolutional network”, fielded in U.S. banks “from about 1996”. | LeCun et al. (1989) confirms the ZIP-code task; the 1998 paper’s exact deployment date and the “first” priority were not cleanly extractable. | LeCun et al. (1998) full text plus NCR/deployment records. |
| `origami.php:462` | The Huzita–Justin axioms were written by Justin (1986) and rediscovered by Huzita (1989). | Secondary sources usually date Huzita’s presentation to the 1991 conference; a 1989 publication may exist but was not verified. | Huzita’s original paper/proceedings. |
| `deconvolution.php:65` | Distill’s DeepDream figure uses “8×8 random shifts per iteration”. | The Distill article describes an 8×8 jitter grid, not the exact per-iteration protocol. | Distill source code/figure caption or author note. |
| `normalizationlab.php:39` | “GPT-4 family is estimated around 100+ layers.” | An estimate, not a published architecture fact. | OpenAI technical report or a credible architecture leak; otherwise label explicitly as speculation. |
| `deeplearninglab.php:20` | “Dechter (1986)” and Aizenberg’s priority for the term/idea. | The exact priority was not verified from the primary works. | Dechter (1986) and Aizenberg et al. primary texts. |
| `resnetlab.php:38` | Hochreiter’s 1991 analysis “already contained the germ” of skip connections. | Interpretive; the constant-error carousel is usually dated to the 1997 LSTM paper. | Hochreiter (1991) Diplomarbeit, read in full. |

## 2. Numbers not re-derived from the primary text

| Where | Claim | Why unresolved |
|---|---|---|
| `mechanistic_interpretability.php` | Othello-GPT’s exact probe errors, Merullo’s 5σ / 7–14 % figures, Marks & Tegmark’s 0.77 vs 0.13 effects. | Abstracts confirm the qualitative result; the exact numbers were not re-read from the papers. |
| `attentionlab.php` | Various interpretability/attention numbers. | Same: qualitative claim is sourced, exact figures are not independently recomputed. |
| `alternative_architectures.php:93,161` | Jamba uses “~25 % of the memory”; Striped Hyena-7B has 128K context; RWKV-7 matches 7B Transformers. | Model cards/PDFs were not retrievable for these specific figures. |
| `multimodal.php:64,90` | ViT-L/14 “~304M parameters”; LLaVA-1.5 “~600k image-instruction pairs”. | Plausible and close to published counts, but the exact dataset/model card was not read. |
| `music_video_generation.php:348` | Deezer “50,000 AI-generated tracks a day — about a third of all uploads”; Billboard country song; UMG/Sony v. Suno. | 2025 news claims; the primary announcements were not re-fetched. |
| `vibe_coding.php` (many lines) | 2026-specific ArtCraft/PhotoCraft/FilmCraft, Adobe/Figma figures, DORA 2025, SUSVIBES/Veracode percentages, 22,953-PR study, Stack Overflow 2025. | The lesson is future-dated relative to the stable literature; most 2026 primary sources could not be resolved from this host. |
| `reasoning.php:143` | “approximate values along the curve” for o1-style pass rates at n=100/1,000/10,000. | The lesson labels them approximate and gives no source; they are illustrative, not measured. |
| `promptengineering.php:47` | “J-space, or logit-accumulation space”. | Not a standard term in the interpretability literature and no source is given. |
| `symbolic_ai.php:176` | DENDRAL pruned “eleven million” candidates to “twenty-two thousand”; MYCIN matched “nine human clinicians”. | Taken from Crevier’s secondary history; the primary DENDRAL/MYCIN papers were not read. |
| `websearch.php:89` | ChatGPT used the Bing Search API. | Provider backends are not fully public and change over time; the Microsoft partnership is historical, not a permanent architectural fact. |
| `ai_and_society.php:152` | AF2 cited “~48,000 times”; “over 40 %” of protein-structure papers in *Cell/Nature/Science* 2023 cited AlphaFold. | Citation counts are time-dependent; the 40 % figure was not found in the Nature page. |
| `ai_and_society.php:272` | Khanmigo “ca. 65,000 students across 53 districts by March 2024”. | Plausible; not independently fetched. |
| `ai_and_society.php:328` | Pew data essay: “1 in 10 webpages” AI-written. | The Pew data essay page did not expose the exact figure in the retrieved text. |
| `ai_for_science.php:38` | OpenAI’s September 2026 Navier–Stokes result (~10,000 agents, 88 h, ~130 bn tokens), not peer-reviewed, priority disputed. | The lesson already states the caveats; the claim is future-dated and could not be independently verified. |
| `law_regulation.php:150` | Colorado AI Act effective 30 June 2026. | The official bill page still shows 1 February 2026; the 2025 delay is widely reported but not visible on the page fetched here. |
| `untold_history_ii.php:822` | IEA: data-centre electricity 485 TWh (2025) → 950 TWh (2030); +50 % in 2025. | The 2026 IEA report was not fetched. |
| `untold_history_iii.php:1464` | BIS 2026 advanced-computing export-control rules. | Future-dated; not fetched. |
| `history.php` | Shakey dated 1966 in one place and 1969–1972 in another. | Project start vs operational system; the wording should distinguish them, but both dates can be defended. |

## 3. Deliberately softened, not fully settled

These were overclaims or contested interpretations. They were rewritten to
match the cited source, but a specialist may want to review the new wording:

- `philosophy.php` — consciousness claims now say “most leading theories” /
  “the three theories considered here”, not “every theory”.
- `metaphysics_of_ai.php` — the Gödelian anti-mechanism paragraph now says
  “the standard reply … though the debate is not settled”.
- `unexpected_capabilities.php` — ToM, metaphor and exploration claims are
  now qualified as prompt-sensitive / not benchmarked / exploration-like.
- `frontier.php` — CAI, cross-model universality and Llama data-composition
  claims are now qualified.
- `ai_and_society.php` — AlphaFold, Goldman Sachs, Sensity, C2PA and the
  New Hampshire robocall case were narrowed to what the sources say.

## 4. Link / source integrity

`uv run blog/tests/link_checker.py blog/` currently reports **230 hard
failures** out of 3,276 bibliography entries. Most are not factual
contradictions:

- many arXiv URLs fail with `Connection refused` from this host (the same IDs
  are valid elsewhere), especially the 2025–2026 entries;
- DOI/publisher pages often return HTTP 403 to automated clients and are
  counted as soft passes;
- a smaller set are genuinely dead or wrongly typed URLs.

The five worst dead entries found during this audit were fixed or removed:

- `ramsauer2021hopfield` pointed at the wrong paper (Santos et al. 2024);
  corrected to Ramsauer et al., arXiv:2008.02217.
- `brooks2024sora` pointed at Wikipedia; corrected to OpenAI’s report.
- `anthropic2025shutdown` pointed at a 404; corrected to the
  *Agentic Misalignment* page.
- `fli2025ban` pointed at a 404; corrected to
  `https://superintelligence-statement.org`.
- `tien2026rogue` pointed at a 404 arXiv ID; the lesson now uses
  `rogue_agents` (arXiv:2606.00341) and the dead entry was removed.

To see the current list:

```bash
uv run blog/tests/link_checker.py blog/ > /tmp/linkcheck.txt 2>&1
grep -B3 -A3 '^✗' /tmp/linkcheck.txt
```

## 5. How to re-run the settled checks

```bash
uv run blog/tests/fact_consistency_test.py
uv run blog/tests/php_validator.py blog/
uv run blog/tests/js_validator.py blog/
uv run blog/tests/lesson_guard.py blog/
uv run blog/tests/literature_dup_keys.py blog/
uv run blog/tests/semantic_index_test.py
uv run blog/tests/rag_index_test.py
python3 atlas_data/atlas_check.py
```

## 6. Commits from this audit

- `2ed4b8b7f` — Part 1: history/math/bibliography.
- `33d40f1fe` — Part 2: optimization, scaling laws, memory.
- `2715cc5e2` — Part 3: Inceptionism quotations, architecture claims.
- `12f19f51f` — Part 4: model specs and music/audio history.
- `d9af7ffba` — Part 5: cost, memory and benchmark claims.
- `5bef5e418` — Part 6: history, society and attribution.
- `dd3d57697` — cross-lesson fact-consistency test.
- `cbb81fb09` — remaining claims + regenerated search indexes.
