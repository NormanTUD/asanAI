# history_todo.md — the displaced prerequisites the textbook is still missing

Working document. Tracks the ten **historical / concept-origin** blind spots in the
*From Nothing to Large Language Models* course — the "Vorgeschichte" gaps where the narrative jumps
from artefact to concept without explaining *how a mind came to be able to do this*.
Each item is a self-contained brief: an agent (or a person) should be able to execute
it end-to-end from this file alone.

The technical (non-history) blind spots — training dynamics, MoE, KV-cache, tokenizer
pathologies, evaluation-as-discipline, economics, retrieval-depth, model→system — live
in the companion **`todo_blindspots.md`**.

---

## Protocol: how to work an item, step by step

Run every item through this loop. Do not skip the source-verification step.

1. **Research (agent).** Launch a research task to (a) confirm the historical facts
   and (b) collect **canonical, stable, link-checkable URLs** for every source you will
   cite. Prefer a stable authoritative home per item: arXiv, publisher, SEP
   (Stanford Encyclopedia), Wikipedia (last resort), author page, or Wayback Machine.
   Record, per source: display label, author, year, and the exact URL to use.
2. **Never invent a source.** Every `url:` added to `literature.js` is link-checked in
   CI (`tests/link_checker.py` requires HTTP 2xx; a `.pdf` URL must serve a real PDF).
   Before adding a key, confirm the work exists, the author/title/year are correct, and
   the URL returns 200. **Reuse an existing key if the work is already in `literature.js`**
   (grep it first) — a duplicate key silently last-wins and no validator catches it.
3. **Write in house style.** Prose is Markdown inside many short `<div class="md">`
   blocks. Headings are Markdown inside `.md`. Block math `$$…$$` (with `_` or `\`) must
   sit in a `<div>` inside a `.md`. Citations sit in the prose per the citation-integration
   rules (parenthetical `(\cite[…]{key})` or narrative `\citeauthor{key}… (\citeyear{key})`);
   never float a self-contained reference between words; no cites in headings; merge
   adjacent cites into one `(` group. Use `\sidenote{}` for marginalia, `\marginfig{}`
   for inline figures, `\index{term}` for glossary terms.
4. **Images.** Only reference files that exist in `blog/`. Dominant pattern:
   `<figure><img …><figcaption class="md">… \cite[Credit]{key} …</figcaption></figure>`.
   **Every image needs credit in its caption (holder + license) and an entry in
   `bildquellen-pruefung.txt`** (German audit: `=== TOPIC (lesson.php) ===` section,
   entries with URL / Lizenz / Autor / Lokal / Status). Verify the license via the
   Wikimedia Commons / Wikipedia file page before citing.
5. **Extend vs new lesson.** If the item's "Home" is an existing lesson, insert the new
   section(s) at the point the mapping table below says, preserving that lesson's existing
   voice and flow. If it's a new lesson, create `blog/<slug>.php` with a valid
   `COURSE_METADATA` block (title / part / order / description / icon / color / topics);
   it then appears in the drawer, tiles, linear course and nav automatically. Keep
   `order` a free integer at the **end** of its part (see the placement table) so you
   never renumber existing lessons.
6. **Theme + validators.** Any interactive block must be theme-reactive (`themeColor()`,
   `isDarkMode()`, `window.__MN_DARK.onChange()`). Then run, from the repo root:
   - `php -l blog/<slug>.php`
   - `uv run blog/tests/php_validator.py blog/`  (HTML tag balance)
   - `uv run blog/tests/js_validator.py blog/`    (only if you added a `.js`)
   - `uv run blog/tests/lesson_guard.py blog/`
   - `uv run blog/tests/latex_error_checker.py --docroot blog/` (local)
   - `uv run blog/tests/php_render_validator.py blog/` on your lesson (local)
   Fix everything it flags before marking the item done.
7. **Atlas (follow-up).** If the item introduces new named persons/places/institutions
   that belong on the course map, record them in `atlas_data/raw/` and re-run
   `atlas_parse_bib → atlas_merge --merge → atlas_threads --build → atlas_check`.
   Mark this sub-step in the item; it can be batched at the end.
8. **Update this file.** Flip the item's status, note what was added and where.

**Statuses:** `[ ]` pending · `[~]` in progress · `[x]` done (validators green) ·
`[-]` descoped with reason.

---

## Placement map

| # | Area | Home today (what already exists) | Decision | Placement |
|---|------|----------------------------------|----------|-----------|
| 1 | Cognitive evolution | `human_mind.php` (Miller 1956 + Dehaene number sense, full) | **Extend** `human_mind.php` | Part 6, order 3 |
| 2 | Causality | `beyond_llms.php` (Pearl do-calculus + "correlation≠causality", full) | **Extend** `beyond_llms.php` | Part 6, order 4 |
| 3 | Memory / mnemonics | none (only oral tradition in `language.php`; extended-mind in `human_mind.php`) | **New lesson** `memorypalace.php` | Part 1, order 12 |
| 4 | Cumulative-knowledge institutions | mechanism full in `human_mind.php` §V; Royal Society / *Phil. Trans.* in `untold_history.php` | **Extend** `human_mind.php` §V | Part 6, order 3 |
| 5 | Controlled experiment | Fisher/Gosset in `statistics_i.php`; Ibn al-Haytham (1 line) in `untold_history.php` | **Extend** `statistics_i.php` | Part 1, order 8 |
| 6 | Market for information | Encyclopédie gestured at in `untold_history.php` | **New lesson** `information_market.php` | Part 1, order 12 |
| 7 | Bush → Memex chain | endpoint only (Berners-Lee/WWW) in `untold_history.php` | **Extend** `untold_history.php` | Part 6, order 2 |
| 8 | Statistics as state technique | Galton/Pearson regression in `statistics_i.php` + `minimalneuron.php` | **Extend** `statistics_i.php` | Part 1, order 8 |
| 9 | Algorithm as a concept | al-Khwārizmī (word) + Turing machine scattered in `history.php` | **New lesson** `algorithm_concept.php` | Part 1, order 12 |
| 10 | Information before Shannon | Shannon + Boltzmann full in `statistics_ii.php` / `samplinglab.php` | **Extend** `statistics_ii.php` | Part 1, order 9 |

Note: Part 1 (Foundations) is where the pre-history of concepts most naturally lives,
alongside `math_i…iv`, `statistics_i/ii`, `language`, `geometry_i`. New-lesson slugs are
chosen to read well in the drawer; adjust if they collide.

---

## The ten items

### H1 — Cognitive evolution: from object-recognition to symbol
`[x]` done 2026-10-11 — `human_mind.php`: added "Mental Imagery: Turning Things in the Head" (Shepard–Metzler 1971 + figure) and extended "The Number Sense" (subitizing ≤4 + Pirahã/Mundurucú numberless-peoples). ToM already covered by "Shared Intentionality." Keys: shepardmetzler1971, subitizing, piraha2004, picamundurucu2004 (Mundurucú via Pica/Lemer/Izard/Dehaene 2004, not the unverifiable Pica/Noveck/Correia).
- **Gap.** The course shows artefacts (handaxe, shell, bone) but not the cognitive
  bridge: how a brain that *recognises objects* becomes one that *uses symbols*.
- **Cover to add**
  - **Working memory & the "magical number 7±2"** — \cite{miller1956magicalnumber}
    (already present in `human_mind.php`, keep). Why external memory was *necessary* at
    all: the in-head buffer is tiny. Frame as the reason every later external store
    (notch → tablet → book → vector DB) exists.
  - **Dual coding / mental rotation** — Shepard & Metzler 1971, *Mental rotation of
    three-dimensional objects* (Science). People rotate images in their head; response
    time is **linear in the angle** — the brain runs a real simulation. Add the classic
    3D-cube experiment and the slope-of-time-vs-angle plot (this is a natural
    interactive: a 3D object the reader rotates, with an estimated "mental time").
  - **Subitizing** — we *see* small cardinality (≤3–4 objects) instantly and accurately
    without counting; beyond ~4 it degrades into serial counting (Feigenson / Dehaene).
    The "4" is a hard cognitive limit. Interactive: dot-arrays, click to judge
    "exact vs approximate".
  - **Numberless peoples** — Pirahã (Gordon 2004, *Language*) has no exact number words
    ("hoi" = a little, "hohz" = many); Mundurucú (Pica, Noveck & Correia 2004,
    *Cognition*) has a **bounded** approximate number system (accurate only to small
    magnitudes). What arithmetic words *add* to a brain that already has an ANS.
  - **Theory of Mind in hominid evolution** — when did a hominid start modelling what
    *another* thinks? (Shared intentionality / Tomasello; social brain). Distinguish from
    the ToM-in-LLMs discussion that already lives in `unexpected_capabilities.php`.
- **Home.** `human_mind.php` — add to the "Biological Engine" / "Psychology of
  Abstraction" region, after the Miller + Dehaene sections.
- **Sources to verify.** miller1956magicalnumber (exists); Shepard-Metzler 1971;
  Feigenson on subitizing; Gordon 2004; Pica/Noveck/Correia 2004; Tomasello shared
  intentionality.
- **Images.** a Shepard–Metzler cube pair; a subitizing dot-grid (can be drawn, no
  license issue); a Pirahã/Mundurucú ethnographic photo (verify CC license).

### H2 — The emergence of causality as a concept
`[x]` done 2026-10-11 — `beyond_llms.php`: prepended "The long history of the word *cause*" (Hume 1739 → Kant 1781 → Pearl) to the existing Causal Inference section. Reused keys hume_treatise, kant_critique_pure_reason, pearl2009book.
- **Gap.** The narrative jumps from *mythos* to *logos* without treating causality
  itself (A causes B) as an acquired concept. This is load-bearing because the later
  claim "LLMs have correlation, not causality" needs its own prehistory.
- **Cover to add**
  - **Hume (1739/1748)** — *A Treatise of Human Nature* / *An Enquiry Concerning Human
    Understanding*: no observable "necessary connection"; causality is **custom/habit**
    from constant conjunction. (The course already cites Hume for the *is/ought* gap in
    `philosophy.php`; add the *causality* reading, don't duplicate.)
  - **Kant** — rescues causality as an **a priori category of the understanding**
    (Critique of Pure Reason): the mind *imposes* the category of cause on experience.
  - **Pearl** — formalises it (do-calculus, structural causal models, the ladder of
    causation). Already treated fully in `beyond_llms.php` §Causal inference; **link** to
    it rather than repeat the math.
  - **The thesis.** A trained model sees correlations (constant conjunction) — exactly
    Hume's "regularity" — but not the *interventional* / *counterfactual* structure.
    Tie Hume→Kant→Pearl into one arc and end on "so an LLM is a very elaborate engine
    for Hume's regularity, and causality is what it is missing."
- **Home.** `beyond_llms.php` — prepend a short "The long history of the word *cause*"
  section to the existing causal-inference section.
- **Sources to verify.** hume1739treatise (exists — check the key/URL); kant
  Critique of Pure Reason; Pearl Causality (2000/2009) (exists); SEP entries on
  Hume/Kant causality as stable URLs.

### H3 — Memory as technology: the mnemotechnique (NEW LESSON `memorypalace.php`)
`[x]` done 2026-10-11 — `memorypalace.php` (Part 1, order 12) + Palace-recall interactive + 3 images. Origin story corrected to the banquet-hall/Dioscuri version (Simonides, Larissa/Thessaly), **not** "Battle of Cunaxa." Keys: methodofloci, simonidesofceos, artoffemoryyates, brunodeumbris1582, giordanobruno.
- **Gap.** The course has external stores (bone, tablet, paper) but not the *internal*
  storage technology: mnemonics. This is relevant because it is the **first technique
  that used spatial structure for semantic storage — exactly what an embedding space
  does. A memory palace is a hand-built vector space.**
- **Cover to add**
  - **Method of Loci** — Simonides of Ceos (~500 BC): after the Thessalian hall
    collapsed at the Battle of Cunaxa, he located buried guests by the *place* each had
    sat. Store by **placing items in familiar locations**; recall by walking the route.
  - **The medieval *ars memoriae*** — the palace becomes an architecture of images and
    moral/religious ordering; the monastic memory treatises.
  - **Giordano Bruno** — the *spacemem*: memory as navigation of a **three-dimensional
    space of locations** (he used it to memorise whole books). The clearest
    ancestor of "navigate a space to recall a stored item."
  - **Matteo Ricci** (Jesuit, China) — adapted the art for teaching; *On the Great
    Memory* (1585).
  - **Frances Yates, *The Art of Memory* (1966)** — the scholarly spine of the whole
    thread; the link between Renaissance memory, Hermeticism, and the imagination.
  - **The through-line (the payoff).** Loci = *content → spatial key → recall by
    traversal*. An embedding = *content → vector key → recall by similarity traversal*.
    The "walk the palace to find the item" is the human version of "nearest-neighbour
    in embedding space." This is the strongest possible "show don't tell" bridge to the
    [Embeddings](embeddinglab) chapter.
- **Home.** New lesson `memorypalace.php`, Part 1 (Foundations) — it is the pre-history
  of the *extended mind / external memory* idea that later reappears in `human_mind.php`
  §V and in retrieval/vector search.
- **Sources to verify.** Simonides / method of loci (ancient sources + SEP); Yates 1966
  *The Art of Memory* (Chicago Univ. Press); Bruno's memory art; Ricci *On the Great
  Memory*.
- **Images.** a classical memory-palace / palace-diagram; a Simonides / Bruno portrait
  (verify CC license).
- **Interactive (strong candidate).** a tiny "build your own palace": the reader places
  N items along a familiar route and is later quizzed on recall — demonstrating the
  spatial-index mechanism, and (optionally) a side-by-side where the same N items are
  "placed" as points in a 2-D embedding and retrieved by nearest-neighbour. Keep it
  lightweight; a `.js` module is fine.

### H4 — Institutions that make knowledge cumulative
`[x]` done 2026-10-11 — `human_mind.php` §V: added "Institutions that outlive their founders" (Pergamon, Bologna 1088, Phil. Trans. 1665, Venice patent 1474) + 2 figures. Phil. Trans. corrected to **longest-running** (2nd science-only journal), not "first." Keys: libraryofpergamum, universityofbologna, philtrans1665, venicepatent1474.
- **Gap.** The course has settlement + writing, but not the **institutions** that let
  knowledge outlive the individual. "A displaced prerequisite of the first rank":
  without institutions there is no cumulative science.
- **Cover to add** (each as a short, named block)
  - **The Library** — Alexandria (and its rival **Pergamon**), and the **House of
    Wisdom** (Bayt al-Ḥikma, Baghdad, 9th c.) as *machines for accumulating and copying
    knowledge*. (Alexandria + House of Wisdom already appear in `geometry_i.php` for
    Euclid/al-Khwārizmī context — add Pergamon and the institutional framing here.)
  - **The University** — **Bologna (1088)**, Paris, Oxford, Salamanca: the invention of
    an *institution that outlives its members* and a shared, peer-reviewable body of
    knowledge.
  - **The scientific journal** — *Philosophical Transactions of the Royal Society*
    (**1665**): the invention of **priority** and **peer review** as a *technology*.
    (The Royal Society + *Phil. Trans.* already appear in `untold_history.php` — add the
    "why it matters" institutional reading here.)
  - **The patent** — **Venice, 1474**: the invention of intellectual property; a
    trade-off (secrecy vs disclosure) that makes *disclosure* the default for
    accumulation.
- **Home.** `human_mind.php` §V ("The Social and Cultural Ratchet") — that section is
  already the *concept* (ratchet + "a mind plus a library"); insert the four named
  institutions as concrete instances of the ratchet.
- **Sources to verify.** Library of Alexandria; Library of Pergamon; House of Wisdom;
  University of Bologna 1088; *Philosophical Transactions* 1665; Venetian patent
  statute 1474 (SEP / Wikipedia / institutional pages).

### H5 — The emergence of the controlled experiment
`[x]` done 2026-10-11 — `statistics_i.php`: added "The controlled experiment: from scurvy to ablation" (Lind 1747/1753, Fisher 1935 *Design of Experiments*, double-blind, A/B + ablation payoff) + Lind portrait. Lind born **1716** (not 1736). Kitchiner 1948 pneumonia trial not verifiable → used the *Randomized controlled trial* page for the 1948 anchor. Keys: lind1747scurvy, fisher1935design, doubleblind, rct1948.
- **Gap.** The course has Ibn al-Haytham (good) and Bacon, but the *invention of the
  controlled experiment as a method* is missing as its own step.
- **Cover to add**
  - **The control group** — **James Lind, scurvy, 1747** (*A Treatise of Scurvy*):
    pairing sailors on different diets and watching which recovers — the first
    controlled clinical comparison. (Honest caveat: 2 of the 12 recovered with citrus;
    it's a *quasi*-controlled experiment, and that's fine — the *idea* is the point.)
  - **Randomization** — **Fisher, *The Design of Experiments* (1935/1936)**: the
    randomised controlled trial, ANOVA, and the randomization principle in one move.
  - **The double-blind procedure** — Kitchiner, 1948 (streptomycin vs sulfonamide):
    blinding both subject and observer.
  - **The payoff (why it's here).** Fisher's randomization + significance is the
    **direct prehistory of every A/B test and every ablation study in ML**. "Ablation
    study" = "turn one component off, hold the rest fixed, compare" — exactly
    controlled-experiment logic applied to a model. Link to the [Statistics I](statistics_i)
    and [Evaluation](evaluation) chapters.
- **Home.** `statistics_i.php` — it already hosts the Fisher/Gosset randomization
  debate and the t-test; insert a "The controlled experiment, from scurvy to ablation"
  section there.
- **Sources to verify.** Lind 1747 *Treatise on Scurvy*; Fisher 1935/36 *Design of
  Experiments*; Kitchiner 1948 double-blind; (the existing `ziliak2008guinnessometrics`
  / Fisher–Student context is already in `statistics_i.php`).

### H6 — The emergence of the market for information (NEW LESSON `information_market.php`)
`[x]` done 2026-10-11 — `information_market.php` (Part 1, order 14) + 5 images. Fugger news market, Habermas coffee-house, Encyclopédie, Otlet/Mundaneum + the 1934 "paper internet." Otlet's vision framed as **prefiguring** Bush's Memex (precursor), not "Bush read Otlet." "Imperia-Blatt" term dropped (unverifiable). Keys: fuggernews, habermaspublicsphere, encyclopedie, paulotlet, mundaneum, traitededocumentation, catalogingtheworld.
- **Gap.** The course gestures at newspapers and the Encyclopédie but never treats the
  **market and infrastructure for information** as a system — and **Otlet is missing
  entirely**, which is the single most painful omission here.
- **Cover to add**
  - **The news market** — the **Fugger newsletters** (*Augsburger/Imperia-Blätter*,
    16th c.): news as a *commodity* with producers, price, and a readership that pays.
  - **The coffee-house public sphere** — **Habermas, *Strukturwandel der
    Öffentlichkeit* (1962)**: the café/salon as the venue where a *public* forms around
    shared, printable information.
  - **The Encyclopédie** — Diderot & d'Alembert (1751–72): the first systematic attempt
    to *compile all knowledge* in one, cross-referenced, citable corpus. (This is the
    "corpus" idea that the training data eventually becomes.)
  - **Paul Otlet & the Mundaneum** — the **Mundaneum** (Brussels, 1910, with Henri La
    Fontaine; concept from 1904): a universal, cross-indexed documentation of the
    world. Otlet's **1934–35** paper-internet: a world of interlinked document cards
    ("mundotheque", a machine that displays documents on demand, telephote-style).
    **This is Memex before Bush.** Make the Otlet→Bush link explicit (Bush read Otlet).
- **Home.** New lesson `information_market.php`, Part 1. It is the pre-history of the
  *corpus* and of *retrieval* — the natural bridge from the [Language](language) and
  [history](history) lessons toward RAG / vector search.
- **Sources to verify.** Fugger newsletters; Habermas *Strukturwandel der
  Öffentlichkeit* (1962); the Encyclopédie; Paul Otlet + the Mundaneum (1904/1910) and
  his 1934 documentation work (Otlet / Mundaneum museum pages, SEP, Wayback).
- **Images.** the Fugger *Imperia-Blatt*; a coffee-house engraving; the Encyclopédie
  title page; the Mundaneum / Otlet (verify CC licenses).

### H7 — Vannevar Bush & the Memex chain
`[x]` done 2026-10-11 — `untold_history.php`: added "The pre-history: the Memex and hypertext (1945–1968)" (Bush *As We May Think* 1945 → Engelbart *Augmenting Human Intellect* 1962 + 1968 demo → Nelson "hypertext" 1965), inserted before ARPANET so it flows into the existing Berners-Lee section. 4 images. Nelson's paper is **"Complex Information Processing" (1965)**, not "Coherent Systems." Keys: aswemaythink, memex, augmentinghumanintellect, motherofalldemos, tednelsonhypertext, tednelson.
- **Gap.** Bush is absent entirely, and the hypertext chain that leads to the web — and
  thus to the **training corpus** — is missing its front half.
- **Cover to add** (the chain, in order, each a short block)
  - **Vannevar Bush, "As We May Think" (Atlantic Monthly, July 1945)** — the **Memex**:
    a desk-sized device of microfilm + linkage, where you store a page and *associate
    it with other pages by a trail you lay down*. Associative, not just sequential,
    indexing.
  - **Engelbart** — *Augmenting Human Intellect* (1962) and the **Mother of All Demos**
    (December 9, 1968): the first demonstration of the mouse, hypertext, shared screen,
    and collaborative editing.
  - **Ted Nelson** — *Coherent Systems* (1965): coined the word **"hypertext"** and the
    Xanadu vision (random access, linking, versioning).
  - **Berners-Lee** — the **WWW** (1989 memo → 1991): *already covered* in
    `untold_history.php`. This section should **land on** that existing section, i.e.
    end by pointing at it ("and here is where the chain becomes the web, and then the
    corpus").
- **Home.** `untold_history.php` — insert the Bush→Engelbart→Nelson blocks *immediately
  before* the existing "Tim Berners-Lee and the World Wide Web" section, so the chain
  reads continuously into it.
- **Sources to verify.** Bush 1945 "As We May Think" (the Atlantic / MIT page);
  Engelbart 1962 + the 1968 demo (the "Mother of All Demos" archive); Nelson 1965
  *Coherent Systems* / hypertext (Nelson page / Wayback).
- **Images.** Bush's Memex diagram (the famous "memex desk" drawing — verify license);
  the 1968 Engelbart demo still; the 1989 Berners-Lee memo (already present).

### H8 — Statistics as state technique (not just probability)
`[x]` done 2026-10-11 — `statistics_i.php`: added "Statistics as a state technique: from mortality tables to the average man" (Graunt 1662, Quetelet 1835, Galton/eugenics as the dark origin of regression) before the existing Galton/Pearson section + 3 portraits. Quetelet dated 1835 (not 1833). Keys: graunt1662, quetelet1835, galton_eugenics (reused galton for the regression paper).
- **Gap.** The course has probability (Pascal/Fermat/Bayes/Laplace — good) but not
  statistics as a **Herrschaftsinstrument** — a technique of the state. And the dark
  origin of regression (eugenics) is present only as a footnote.
- **Cover to add**
  - **The census** as the original state dataset.
  - **John Graunt, *Natural and Political Observations* (1662)** — the first mortality
    tables, the birth of **demography** / "political arithmetic."
  - **Quetelet & the "homme moyen" (1835)** — the invention of the **average person**
    and "social physics"; the average as a *moral/physical* object the state can
    manage.
  - **Galton & eugenics** — **the dark origin of regression**: regression was invented
    to measure **hereditary variation**, with **eugenic intent**. The course already
    touches Galton→regression in `minimalneuron.php` and `statistics_i.php`; add the
    ethical context explicitly — "this is not a footnote, it is the origin."
- **Home.** `statistics_i.php` — insert "Statistics as a state technique: from Graunt
  to the average person" alongside the existing Galton/Pearson regression section.
- **Sources to verify.** Graunt 1662; Quetelet 1833/35; Galton *Hereditary Genius*
  (1869) / "eugenics" (1883) and the regression-to-the-mean papers (1885/1889).

### H9 — The algorithm as a concept (NEW LESSON `algorithm_concept.php`)
`[x]` done 2026-10-11 — `algorithm_concept.php` (Part 1, order 13) + Euclid-gcd "watch it terminate" interactive + 4 images. Euclid gcd → Sieve of Eratosthenes → the verb/object gap → Hilbert Entscheidungsproblem 1928 → Church & Turing 1936; added a short, accurate Gödel-1931 bridge. Keys: euclideanalgorithm, sieveoferatosthenes, churchturing1936 (reused euclidelements, hilbert1928entscheidung, turing1937, godel1931incompleteness).
- **Gap.** The course has al-Khwarizmi (the *word*) but not the path from a *procedure*
  to the **algorithm as a mathematical object**.
- **Cover to add**
  - **Euclid's algorithm (gcd)** — *Elements*, Book VII (~300 BC): the first
    non-trivial algorithm; a procedure that *terminates* and is *correct by
    construction*. Emphasise the two properties that make it an *algorithm*: termination
    and a correctness argument (the invariant).
  - **The Sieve of Eratosthenes (~240 BC)** — another early, elegant, terminating
    procedure; the idea of a *filter* over a finite set.
  - **The gap between "procedure" and "the algorithm as an object"** — for most of
    history, algorithms were *used*, never *studied as objects*. al-Khwarizmi gives the
    name (the course has this); the object itself waits for the 20th c.
  - **The Entscheidungsproblem** — **Hilbert (1928)**: is there a general method that,
    given any statement of arithmetic, decides in finite time whether it is provable?
    This is the *question* the whole modern theory of computation was built to answer.
  - **Church & Turing (1936)** — two independent, incompatible-looking formalisms
    (lambda calculus; the tape machine) that turn out to compute exactly the same
    things. The answer to the Entscheidungsproblem is **no** (and the undecidability
    proof is the direct ancestor of the halting problem). The course has Turing the
    person and the Church–Turing thesis in `philosophy.php`; here, frame the Turing
    machine as *the answer to Hilbert's 1928 question*.
- **Home.** New lesson `algorithm_concept.php`, Part 1 — the pre-history of the
  [Algorithms](algorithms) and [software](software) lessons and of what a "computation"
  *is*. Connect forward to `history.php`'s "logical thought can be mechanically
  calculated" section.
- **Sources to verify.** Euclid *Elements* Book VII; Sieve of Eratosthenes; Hilbert
  1928 "Über das Unentscheidbare"; Church 1936; Turing 1936 "On computable numbers";
  SEP entries on the Entscheidungsproblem / halting problem as stable URLs.
- **Interactive (strong candidate).** a tiny Euclid-gcd / Sieve-of-Eratosthenes
  "watch it terminate" visual (the reader picks numbers, the algorithm runs, and a
  counter shows *why it must stop*). Reinforces the termination-invariant point.

### H10 — Information as a measurable quantity, before Shannon
`[x]` done 2026-10-11 — `statistics_ii.php`: added "The birth of information: from Boltzmann to Shannon" (Nyquist 1924, Hartley 1928, Szilard 1929, the Boltzmann→Shannon bridge) before the Entropy section. It is **Harry** Nyquist (not Harold). Attached URLs to the pre-existing url-less keys nyquist1924certain + hartley1928transmission; added szilard1929entropy.
- **Gap.** The course has Shannon and (at the formula level) Boltzmann, but not the
  *pre-Shannon* lineage and not the **thermodynamic bridge** that makes "information"
  a physical quantity.
- **Cover to add**
  - **Nyquist (1924)** — the sampling result (a band-limited signal is fully
    determined by its samples at 2× the highest frequency); the precursor of the
    Nyquist–Shannon sampling theorem (already named, but not the 1924 information paper).
  - **Hartley (1928), "Transmission of Information"** — the *first* information-theoretic
    paper, three decades before Shannon's 1948 work.
  - **Boltzmann entropy → Shannon entropy, the bridge** — $S = k\ln W$ (Boltzmann,
    1872–77) measures the number of microstates; Shannon's $H$ measures the number of
    distinguishable messages. The course already makes the *formula* bridge in
    `samplinglab.php` ("softmax with temperature is exactly the Boltzmann
    distribution"); here, tell the *history*: information is a thermodynamic quantity
    before it is a telegraphic one.
  - **Szilard's demon (1929)** — a one-bit, two-state demon; the first clean link
    between a *bit* and *entropy* (Landau later, "information is physical"). Why a
    single yes/no measurement lowers entropy by $k\ln 2$.
- **Home.** `statistics_ii.php` — it already has "Entropy (The Messiness Scale)" +
  "Boltzmann Distributions"; insert "The birth of information: from Boltzmann to
  Shannon" there.
- **Sources to verify.** Nyquist 1924/1928; Hartley 1928 "Transmission of
  Information"; Szilard 1929 "On the Reduction of Entropy by Physical Processes"; the
  existing Boltzmann / Shannon entries (reuse).

---

## Atlas follow-up (batch at the end)

Items add many named persons/places (Otlet, Bush, Engelbart, Nelson, Simonides, Bruno,
Ricci, Yates, Graunt, Quetelet, Galton, Lind, Fisher, Kitchiner, Hilbert, Church,
Turing, Nyquist, Hartley, Szilard, Pergamon, Bologna, Venice 1474, the Mundaneum …).
When an item is done, record its new entities in `atlas_data/raw/` (see
`atlas_data/raw/BRIEF_entities.md`) and re-run:
`atlas_parse_bib.py → atlas_merge.py --merge → atlas_threads.py --build → atlas_check.py`.

## Cross-reference

The technical blind spots (training dynamics, MoE, KV-cache, tokenizer pathologies,
evaluation-as-discipline, the economic layer, retrieval-depth, model→system) are tracked
separately in **`todo_blindspots.md`**.
