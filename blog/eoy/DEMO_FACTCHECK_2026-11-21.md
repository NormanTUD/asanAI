# EOY demo fact check

Date: 2026-11-21
Scope: every active scene under `blog/eoy/demos/` and the scene files under
`blog/eoy/assets/`, plus the shared toy data in `demos/_core.js`.
`demos/archive/` is not loaded by the EOY app and is excluded.

Method: read every user-visible string, data array, formula label, caption,
ARIA label, source line and image credit; cross-check dates, model sizes,
token counts, token IDs, paper claims, licenses and hand-built data against
the primary sources already cited in `data.js`. Fixed direct errors in place.
Kept didactic values when the surrounding lesson explicitly labels them as
schematic.

## Summary

- Confirmed source or quotation errors fixed: 4.
- Internal count or label errors fixed: 4.
- Stale, schematic or caveat fixes: 5.
- Total fixed rows in the table below: 13.
- Remaining didactic or unverified values: 12, all labelled below.
- Key verified external facts: GPT-3 data mix and size, GPT-2 token IDs,
  Transformer dates, Othello probe shape, Gurnee/Tegmark world map and
  death-year probe, BPE counts, Chinese translations, Eiffel Tower height,
  Project Gutenberg Nietzsche quotation.

## Fixed in this pass

| File | Problem | Fix |
|---|---|---|
| `demos/blocks.js` | Nietzsche quotation said `Chaos in sich tragen`; the original is `Chaos in sich haben`. | Corrected the German quotation. |
| `demos/blocks.js` | Exact enwiki HTML byte count `1 062 378` is a stale snapshot; current page is 1 069 552 bytes and changes. | Replaced with `over 1 MB HTML`. |
| `demos/langdata.js` | GPT-3 corpus list included Reddit and source code. GPT-3 used Common Crawl, WebText2, Books1, Books2 and Wikipedia; WebText2 is web pages linked from Reddit, not Reddit comments. | Removed Reddit and source code; now `Webseiten, Bücher, Wikipedia`. |
| `demos/riskmap.js` | `Falsche Nachrichten verbreiten sich online schneller` generalized the Vosoughi et al. (2018) Twitter sample to the whole internet. | Scoped to `In der untersuchten Twitter-Stichprobe`. |
| `demos/codesemantic.js` | Caption claimed a `sprachunabhängiger Bedeutungs-Knoten`. `data.js` correctly says there is no explicit language-independent layer, only a learned approximation. | Changed to `angenähert sprachübergreifend`. |
| `demos/codesemantic.js` | Node labels said `drei Sätze` and `beide landen hier`; the scene has nine sentences and five code blocks. | Changed to `neun Sätze` and `fünf landen hier`. |
| `data.js` | The semantic caveat still said `drei Sätze, zwei Codeblöcke`. | Changed to `neun Sätze, fünf Codeblöcke` (DE and EN). |
| `demos/meadow.js` | Valleys in a probability landscape were called `unsicher`; low probability means unlikely, not uncertain. | Changed to `unwahrscheinlich`. |
| `assets/space-morph.js` | `z = r²` overstated the exact lift, and a ReLU neuron was called a `smooth ridge`. | Changed to `z ≈ r²` and `one ridge` / `einen Grat`. |
| `assets/learnsys-unembed-scene.js` | Hand-built token angles were presented as `learned` GPT-2 directions. | Changed captions and ARIA to `schematic`; updated the unembed step in `data.js` accordingly. |
| `demos/qkv.js` | The fully connected graph was labelled without saying it is the view without a causal mask. | Added `ohne Causal Mask` / `without a causal mask` to the visible note and ARIA label. |
| `demos/worldmodel.js` | ARIA summary said `Zwei Richtungen für Othello`; the probe has three logits per square (empty, mine, yours). | Changed to `Drei Logits pro Feld`. |
| `demos/spacetime.js` | `R² = 0.835` was shown next to synthetic points that actually have R² ≈ 0.999; the schematic label disappeared when a person was selected. | Card and bottom label now say the R² is the paper value and the points are schematic. |

## Per-demo audit

Status values: **correct**, **fixed**, **correct but illustrative**,
**correct with caveat**, **no factual claim**.

### `demos/activation.js`
- ReLU, GELU, sigmoid, tanh are named and compared correctly.
- Sigmoid and tanh are invertible; GELU is smooth but not monotonic. Correct.
Status: correct.

### `demos/agents.js`
- `1³ + 12³ = 1729`; 1729 is the Hardy-Ramanujan number.
- `bc` is a console calculator; the loop is still next-token prediction with
  tool calls; the browser returns HTML before a screenshot; a multimodal model
  can read the screenshot as tokens. Correct.
Status: correct.

### `demos/attention.js`
- `Bank` is used as a genuine ambiguity example in German and English.
- `2D embeddings` and the weighted sum of value vectors are didactic but
  mathematically correct; the lesson text explicitly calls the movement a
  demonstration, not the full computation.
Status: correct but illustrative.

### `demos/blocks.js`
- Token definition, repeated IDs, embedding-row lookup, attention/FFN/residual
  framing: correct.
- Firth (1957) quotation: correct.
- Nietzsche quotation: fixed.
- HTML size: fixed to `over 1 MB`.
- GPT-2 small `d_model = 768`, 12 layers: correct.
- Sinusoidal position encodings lie on a sphere: correct for the sinusoidal
  scheme.
Status: fixed and correct.

### `demos/chineseroom.js`
- Chinese inputs and German/English translations:
  `今天天气怎么样？` = how is the weather today;
  `今天天气很冷。` = the weather is very cold today;
  `你叫什么名字？` = what is your name;
  `我叫小明。` = I am called Xiaoming;
  `现在几点？` = what time is it;
  `现在三点。` = it is three o'clock. Correct.
- Searle (1980) and the symbol-manipulation/understanding distinction:
  correct; the scene correctly says the conclusion is disputed.
Status: correct.

### `demos/code.js`
- `oliverguhr/german-sentiment-bert` and
  `distilbert-base-uncased-finetuned-sst-2-english` are real model names.
- The Python `pipeline(..., top_k=None)` shape is correct.
- The exact scores (`0.9915`, `0.9993`, ...) are illustrative. They were not
  produced by running the models here, and the German model card recommends
  its own preprocessing. Do not treat them as measured outputs.
Status: model names correct; scores illustrative.

The scene also says `Keine Updates verfügbar. Alles läuft lokal.` That is a
desktop joke, not a claim that a real LLM runs locally.

### `demos/codesemantic.js`
- Nine sentence variants in German, English and French: correct.
- Three per language: two typo variants and one clean variant. The caption
  `mit und ohne Tippfehler` is accurate.
- Five code cards are declarations (`def quickSort`, `function quick_sort`,
  `void quickSort`, `fn quick_sort`, `func quickSort`), not full quicksort
  implementations. Calling the shared node `Quicksort` is a didactic role,
  not evidence that the snippets implement quicksort.
- `sprachunabhängig` and the old three-sentence/two-code counts: fixed.
Status: fixed; code snippets are illustrative role labels.

### `demos/consciousness.js`
- Global workspace as broadcast/access/integration/report: correct.
- IIT and Phi as a measure of an irreducible cause-effect structure: correct.
- The claim that Phi is hard to compute and has not been measured for LLMs:
  reasonable as of the cited literature, but the theory is contested and the
  sentence already says so.
- Predictive processing as controlled hallucination: correct as a description
  of the theory.
- Kastrup's analytic idealism, new mysterianism and the rat analogy: correct
  as descriptions of positions, not as established facts.
Status: correct with caveat.

### `demos/crossentropy.js`
- Capital facts (France/Paris, UK/London, Germany/Berlin, Italy/Rome):
  correct.
- The `London 50 %, Paris 30 %` example and `-log(0.30) ≈ 1.20` are
  illustrative but numerically correct.
Status: correct but illustrative.

### `demos/embedding.js`
- `16 of 4096` is explicitly hypothetical; GPT-2 small uses 768 dimensions.
- The 1D/2D/3D word coordinates in `_core.js` are hand-built, not GPT
  weights. The lesson's `emb-11` box says the demo is a simplification, not a
  measurement of a real model, but the scene captions themselves still say
  `gelernt`.
Status: correct with caveat; hand-built data.

### `demos/ffn.js`
- `d_model -> d_ff -> d_model` is the correct FFN shape.
- `core inside ring, lift until a plane separates` is a didactic picture of
  an MLP, not a measurement.
Status: correct but illustrative.

### `demos/headconcat.js`
- Each head produces a per-token vector; concat joins the four demo heads;
  `W_O` projects back to `d_model`; the FFN sees one token vector, not the
  individual heads. Correct.
Status: correct.

### `demos/highdim.js`
- GPT-2 token IDs and the 768/4096 distinction were checked against the GPT-2
  encoder and against `data.js`. Correct.
- The 4096-column table is explicitly hypothetical.
Status: correct.

### `demos/history.js`
- Dates and facts checked:
  Dolní Věstonice wolf bone 55 notches; Salamis tablet about 300 BCE;
  Llull 1305; Leibniz 1673/1694; McCulloch/Pitts 1943; Hebb 1949;
  Rosenblatt 1958/1961; Minsky/Papert 1969; Lighthill 1973;
  Linnainmaa 1970; Rumelhart/Hinton/Williams 1986; LeCun 1989;
  AlexNet 2012; Bahdanau 2014; Transformer 2017; GPT-1 117M 2018;
  GPT-2 1.5B 2019; GPT-3 175B 2020; Chinchilla 2022; InstructGPT
  SFT+RLHF 2022. Correct.
- Image credits checked: J3n6 CC BY-SA 3.0; Kubitschek 1899 PD;
  Llull PD; Eremeev CC BY-SA 4.0; Francis Bello PD; Hay/Murray PD;
  Steamtalks CC BY-SA 2.0; HNF CC BY-SA 4.0; Vaswani figure CC BY-SA 4.0.
- `The original Commons file is currently unavailable` is a time-sensitive
  status note, not a historical fact.
Status: correct; one time-sensitive note.

### `demos/induction.js`
- Previous-token head in layer 1 and induction head in layer 2: correct for
  the two-layer circuit.
- Phase window 2.5-5 billion tokens; ICL below 0.15, about 0.4 nats, more than
  75 % of final ICL in the window: correct for Olsson et al. (2022).
- `Four attention-head types` is a functional grouping. `data.js` correctly
  adds that the labels are not fixed anatomical categories.
Status: correct with caveat.

### `demos/inductionmatrix.js`
- Position 6 current A, position 3 earlier A, position 4 B: correct.
- QK selects the source, softmax normalizes, OV writes B; the concrete 82 %
  is explicitly illustrative.
Status: correct but illustrative.

### `demos/langdata.js`
- Six scripts and translations of `Sunflowers are the best flowers`:
  correct; Arabic is correctly marked right-to-left.
- GPT-3 mix: Common Crawl 60 %, WebText2 22 %, Books1 8 %, Books2 8 %,
  Wikipedia 3 %, rounded from Brown et al. (2020), Table 2.2. Correct.
- GPT-3 300 billion training tokens; the filtered Common Crawl portion was about 570 GB, roughly 400 billion tokens; 1 ZB = 10^21 bytes;
  zettabyte era is total digital data, not the training corpus. Correct.
- Petrov et al. (2023) tokenizer cost across languages: correct.
- Pretraining corpus list: fixed.
- The scene moves from GPT-3 pretraining to a generic instruction-tuned
  assistant (`Menschenfragen`, `nützliche Antworten`) without naming the
  switch. This is a precision issue, not a false claim.
Status: fixed; one naming caveat.

### `demos/loop.js`
- Token plane with `z = -p`; blue unlikely, green likely; deepest point is
  highest probability. Correct.
- Greedy, sampling and top-p read the same distribution differently.
- `<|endoftext|>` ends the loop. Correct.
- The landscape is explicitly simplified in `data.js`.
Status: correct with caveat.

### `demos/manifold.js`
- Vietoris-Rips edges connect points below a distance threshold. Correct.
- Rotating/translating the Japanese cloud onto the English one is a didactic
  alignment, not a measured model mapping; `data.js` says so.
Status: correct but illustrative.

### `demos/meadow.js`
- Voronoi cells and `height = closeness` are correct for the constructed
  field.
- Valleys were called uncertain; fixed to unlikely.
Status: fixed.

### `demos/mindintro.js`
- Other-minds problem, access versus phenomenal consciousness, Tulving's
  anoetic/noetic/autonoetic levels: correct.
- The Unfinishable Map is AI-generated and human-supervised; `data.js` labels
  it that way in the sources.
Status: correct with source caveat.

### `demos/mlp.js`
- Core inside a ring, lift until a plane separates: didactic but correct.
Status: correct but illustrative.

### `demos/phone.js`
- Next-token loop, tokenization, vectors, attention/FFN, probability
  distribution, append and repeat: correct.
- The search results are a UI mockup, not a live search.
Status: correct; mockup.

### `demos/position.js`
- Sinusoidal position encodings are directions on a hypersphere; the 3D view
  is a projection. Correct.
Status: correct.

### `demos/qkv.js`
- Q, K, V roles; scaling by `sqrt(d_k)`; softmax row sum 1; weighted sum of
  values; self-loops. Correct.
- The graph view is the view without a causal mask; visible note and ARIA
  now say so.
Status: fixed and correct.

### `demos/residual.js`
- Residual stream as a per-token notebook, `x <- x + Layer(x)`, attention and
  FFN add updates, dimensions stay the same. Correct.
- The five layer descriptions (nouns/verbs, syntax, pronouns, semantics,
  communicative purpose) are a strongly simplified, anthropomorphic picture.
  `data.js` says so explicitly.
Status: correct with caveat.

### `demos/riskmap.js`
- Phishing, malware, fakes, bias, compute concentration, alignment,
  monitoring, evals as samples, EU AI Act/NIST, automation, copyright:
  correct at the level of the cited sources.
- The Vosoughi false-news claim was generalized beyond Twitter; fixed.
Status: fixed.

### `demos/spacetime.js`
- Llama-2-70B world map is from Gurnee/Tegmark (2023), Figure 10, CC BY 4.0;
  image credit correct.
- Death years for the shown people are correct; Newton 1727 Gregorian
  (Julian 1726/27) is correct.
- `R² = 0.835` is the paper value. The plotted points are synthetic and have
  R² ≈ 0.999. The card and bottom label now say `Paper` and `points
  schematic`.
- Space/time neuron heatmap is explicitly schematic.
- `decodable ≠ causally used` is the correct limit.
Status: fixed caveat; data points remain synthetic.

### `demos/takeaway.js`
- Summary claims are conceptual restatements of the course, not new
  measurements.
Status: correct.

### `demos/tokenize.js`
- 79 tokens for the demo corpus and 10 starting characters were verified.
- Character-level BPE is distinguished from byte-level BPE; GPT-2 is named as
  byte-level. Correct.
Status: correct.

### `demos/weekday.js`
- Weekdays form a cyclic order with the same angular step in the demo.
  Engels et al. (2024) is the source for circular weekday features.
Status: correct but illustrative.

### `demos/worldmodel.js`
- The 30-move Othello sequence is legal and rule-conforming.
- `L6` state has 512 numbers per token; three probabilities/logits per square
  (empty, mine, yours); chess has 13 states per square; argmax picks the
  largest. Correct.
- `Zwei Richtungen für Othello` was inconsistent with the three-logit probe;
  fixed.
Status: fixed and correct.

### Shared and shim files
- `demos/_core.js`: hand-built toy word vectors and temperature labels. The
  vectors are not model measurements; `emb-11` in `data.js` says so.
- `demos/gauss.js`, `demos/gradient.js`, `demos/unembed.js`: delegating
  shims, no factual claims.
- `demos/media.js`: frame/UI shell, no factual claims.
- `demos/model.js`: error text only.
- `demos/_preview.js`: preview renderer, no factual claims.
- `demos/archive/steering.js`, `demos/archive/compress.js`: not loaded by the
  EOY app; excluded.

## Asset scenes

### `assets/learnsys-gauss-scene.js`
- Ceres and the Dawn mission: correct.
- Ceres image: NASA material public domain, processing by Justin Cowart, CC BY 2.0; Flammarion engraving 1888,
  public domain: credits verified.
- The plot uses synthetic data, not Piazzi's measurements; the scene says so.
- `Gauss believes no single measurement` was changed to `No single measurement
  decides alone`, a didactic phrase rather than a quotation from Gauss.
Status: correct with caveat.

### `assets/learnsys-unembed-scene.js`
- Angle equals cosine similarity for normalized directions; length does not
  change the angle but does scale the logit. Correct.
- The token angles are hand-built. Captions now say `schematic`, and `data.js`
  no longer presents the demo as a GPT-2 measurement.
Status: fixed.

### `assets/loss-landscape-scene.js`
- 18 noisy sine points and MSE are consistent.
Status: correct.

### `assets/tf-sinus-scene.js`
- Architecture and training display are didactic, no external factual claim.
Status: correct but illustrative.

### `assets/space-morph.js`
- A linear classifier cannot separate a core from a surrounding ring; the
  obstruction is topological. Correct.
- The lift `z ≈ r²` is schematic; it is smooth and invertible on the shown
  domain.
- A single neuron gives one ridge, not necessarily a smooth one; fixed.
Status: fixed and correct.

### `assets/word-meadow.js`
- Cell/seam readouts are UI text, no external factual claim.
Status: no factual claim.

## Remaining open items

1. `demos/code.js` exact sentiment scores are not independently verified.
   If they should be real, run both models with their recommended
   preprocessing and replace the numbers; otherwise keep the scene labelled
   as an example.
2. `demos/spacetime.js` still plots synthetic points, not the paper's
   held-out values. The R² is now labelled as the paper value, but the dots and
   the R² do not correspond numerically. Replace the points with the paper
   data if the visual should be quantitatively faithful.
3. `demos/codesemantic.js` code cards are declarations, not full quicksort
   implementations. The shared `Quicksort` node is a role label.
4. `demos/residual.js` layer functions are a teaching metaphor, not measured
   layer behaviour.
5. `demos/embedding.js` and `_core.js` use hand-built vectors; the caveat is in
   `emb-11`, not in the scene caption.
6. `demos/induction.js` `four head types` is a functional grouping; `data.js`
   already qualifies it.
7. `demos/langdata.js` moves from GPT-3 pretraining to a generic
   instruction-tuned assistant without naming the switch.
8. `demos/mindintro.js` depends on the AI-generated Unfinishable Map; the
   source label in `data.js` discloses this.
9. `demos/phone.js` search results are a mockup.
10. `demos/hallucinationguard.js` uses 330 m including antenna, which is the
    current figure; older sources say 324 m without the latest antenna.
11. `demos/history.js` has a time-sensitive `Commons file currently
    unavailable` note.
12. `assets/learnsys-gauss-scene.js` now says `No single measurement decides
    alone`; this is a didactic phrase, not a quote from Gauss.

## Validation

Raw runs after the edits:

```text
node --check all demos/assets: OK
php_validator.py blog/eoy/: 36 PHP files, 0 files with issues, 0 total issues
js_validator.py blog/eoy/: 84 JS files, 0 errors, 67 pre-existing warnings
git diff --check: exit 0
```

`eoy_pages_test.py --pages index.php --langs de`:

```text
335 checks, 1 failure(s)
FAILURE ('index.php', 'de', 'middle: forward right', "{'left': 0, 'right': 0}")
```

`eoy_pages_test.py --pages index.php --langs en`:

```text
335 checks, 1 failure(s)
FAILURE ('index.php', 'en', 'middle: forward right', "{'left': 0, 'right': 0}")
```

The single failure is the existing navigation-layout assertion at the
`middle` transition; all console, math, overflow, slide and substep checks
passed. It is not caused by any string or data change in this pass.

## Addendum: LayerNorm and the hypersphere

The architecture slide now contains a short LayerNorm card and demo, plus a
left residual rail that shows x running through the blocks with updates added
to it. The requested wording was checked against Ba, Kiros & Hinton (2016),
Vaswani et al. (2017), and GPT-2 (Radford et al., 2019):

- LayerNorm computes the mean and variance across the features of one token,
  normalizes that token row to mean 0 and variance 1, then applies learned
  gain γ and bias β.
- A transformer block has two LayerNorm sites, one for attention and one for
  the FFN. The original transformer places them after the residual additions
  (post-LN); GPT-2 places them before the sub-blocks and adds a final
  LayerNorm after the last block.
- It does not bound the values to [-1, 1]. A normalized row can contain
  values such as ±1.41.
- It does not put every vector on a unit hypersphere. With γ = 1 and β = 0,
  the normalized row has L2 length √d, not 1. Learned γ/β move it away from
  that sphere again.
- The residual stream is a running sum through all blocks; it is not globally
  normalized and does not stay on one sphere. The sphere/cosine view is a
  useful direction projection, not an exact description of the whole
  transformer.

Sources: Ba, Kiros & Hinton (2016), arXiv:1607.06450; Vaswani et al. (2017),
arXiv:1706.03762; Radford et al. (2019), GPT-2.
