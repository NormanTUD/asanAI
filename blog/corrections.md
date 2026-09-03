# Corrections for `coherent_world_models.php`

*Content audit — consistency of the mathematics, philosophy, and internal logic.
Line numbers refer to the current file. These are **content** fixes, not syntax.*

---

## 1. TYPE-LEVEL CONFUSION: `G` is used both as an *object* and as an *element*

**Where:** "The one diagram" (lines 808, 824) and the sheaf section (line 509).

**Problem:** `G` is simultaneously (a) a *codomain object* that the transitions
`T_i : R_i → G` map **into** (line 808, and the diagram around 930–941), and
(b) an *element/section* `G ∈ F(c)` of the presheaf (lines 509 and 824,
"the global model becomes the element $G \in F(c)$"). These are two different
type-level things: an object of the target category vs. an element of the set
`F(c)`. The chapter glides between them without marking the shift.

**Consequence:** a reader cannot tell whether the `T_i` arrows terminate in the
*limit object* or in the *chosen global section* of that limit.

**Fix:** pick one convention and mark the other. Suggested: keep
`T_i : R_i → G` with `G` the **limit object** (the coherent whole), and say the
global section is the *witness/selected element* `g ∈ G` (or `g ∈ F(c)`),
using a lower-case `g` for the element and reserving `G` for the object. Then
line 824's "the global model becomes the element $G \in F(c)$" should read
"the global model becomes the element $g \in G \cong F(c)$". This removes the
element/object conflation that repeats across lines 509, 808, and 824.

---

## 2. THE TWO STRUCTURES DO NOT MATCH: fan (master diagram) vs. chain (running example)

**Where:** "The running example" (lines 495–511) vs. "The one diagram"
(lines 802–842).

**Problem:** The *master diagram* is a **fan**: `W → R_i → G`, all `R_i`
mapping independently into a single `G` (the cover `{c_i} → c`). The *running
example* (lines 495–507) is a **sequential chain** in which one channel is
downstream of the others: `R_v, R_a, R_r → R_ℓ → C → R_h` (the spoken report
is *fed by* the sensory channels; the archive is a century downstream of the
report). The linguistic and archival "patches" are not sibling patches of the
same cover as the sensors; they are *composites/derivatives* of the others.
Treating them all as components of `{c_v, c_a, c_r, c_ℓ, c_h} → c` (line 509)
is therefore a distinct structural claim.

**Consequence:** the claim "the same shape governs" (line 511) overstates. A
set of five sibling local sections is not the same shape as a feed-forward
pipeline with branching and nesting.

**Fix:** explicitly label the running example as a *refined/decorated* cover —
the sensory channels form the cover `{c_v, c_a, c_r} → c` and the
linguistic/archival nodes are *derived representations* (transitions
`T`, not patches). Replace line 509's "the admissible cover ... is the family
`{c_v, c_a, c_r, c_ℓ, c_h}`" with a two-level description: cover `{c_v,c_a,c_r}`
plus derived linguistic/archival stages. This removes the implied equality
between a chain and a cover.

---

## 3. SELF-REFERENTIAL TENSION: the chapter forbids silent upgrades, then performs its own

**Where:** "The status of this chapter" (line 41), "Sheaves: coherence =
descent" (line 424) and the boxed principle at line 1138; the forbidden-move
"never silently strengthen" (lines 186–221, 768–796).

**Problem:** The chapter's own standing rule is that no claim should be
silently promoted to a stronger category and that identifying distinct things
is forbidden (e.g., "G is *never* identical to the subject matter"). But the
chapter *itself* asserts, categorically and unqualified, that **"coherence =
descent"** (line 424) and that the sheaf condition **is** the coherence
tradition (the "identity" reading at line 1147 is only hedged "on the most
careful reading"). These are precisely the kind of un-earned identifications
the chapter forbids — the boxed "coherence = descent" treats an analogy built
up over hundreds of lines as a definitional equality.

**Fix:** this is the single most philosophically important correction because
it is *self-undermining*. Either (a) qualify the boxed equality so it respects
the "ally, not identity" disclaimer of line 41 — e.g. change the box to
"Coherence *is modelled by* descent" or "Coherence, so far as this chapter
uses it, *is* the descent condition on an admissible cover (a working
definition, not a claim of identity)"; or (b) soften the forbidden-move
statement to allow the chapter's own controlled upgrade. As written, a
careful reader can apply the chapter's own rule to the chapter and find it
guilty. Recommend (a): mark "coherence = descent" explicitly as the chapter's
**operative definition** (a stipulation), which is a different logical act
from the forbidden silent empirical upgrade.

---

## 4. UNIQUENESS OF THE GLOBAL SECTION vs. "PERSPECTIVES ARE NOT FLATTENED"

**Where:** sheaf conditions, lines 426–476 and 509 vs. "Perspectival
difference is not erased" (lines 949–968).

**Problem:** The sheaf condition asserts a **unique** global section: given
compatible local data, the glued section is determined (line 509 "A global
$G\in F(c)$ exists iff descent holds"; the equalizer/limit at 824 picks out a
single agreement-witness). But "Coherence relates perspectives; it does not
flatten them" (line 955) says reports "need not coincide to be about one
subject" and that differences survive, factorable through admissible
transitions. If the global section is *unique*, then on overlaps the views are
forced to agree — which is exactly the "flattening" the chapter disclaims.

**Consequence:** the two boxed principles (unique glue vs. non-flattening)
pull in opposite directions and are both asserted categorically.

**Fix:** resolve at the level where the chapter actually works: uniqueness
holds *within a sameness-regime* (strict: identical on overlaps; homotopical:
coherently equivalent, so differences factor through transitions). Make the
"perspectives are not flattened" box say explicitly *which* regime allows
non-coincidence: "their reports need not _be identical_ to be about one
subject; they must only be coherent in the regime (isomorphic, homotopic,
approximate, statistical) that is licensed." As written, the reader cannot tell
whether G forces literal agreement or tolerates diversity. Add the regime
qualifier to line 959–966.

---

## 5. THE WEAKEST LINK IS ASSERTED AS A GIVEN: "statistical ⇒ model-theoretic"

**Where:** the hierarchy table (lines 186–221, esp. the `stat → model` row)
and "The hierarchy: never upgrade silently" (lines 768–796).

**Problem:** the table asserts each `⇓` is a *weakening* — i.e. every witness
of the row above is automatically a witness of every row below. For the last
step, *statistical agreement under a probabilistic model* implies
*model-theoretic compatibility (a common classical model exists)*. This is the
one implication that is philosophically over-strong and that the associated
Coq formalisation could **not** prove (it had to be left `Admitted`). It is
not a theorem that high likelihood under a statistical model entails the
existence of a single first-order model satisfying all the views.

**Fix:** demote this from "automatically" to a *conditional/listed assumption*.
Rewrite the last row of the table (around line 202) and the corresponding
sentence so that model-theoretic compatibility is *not* asserted to follow
from statistical agreement as a matter of course, but as "under a suitable
model, and only where the statistical and model-theoretic descriptions pick
out the same structures." Mark it as the chapter's most contested weakening
rather than an automatic one. This keeps the chapter honest against its own
"never silently strengthen" rule.

---

## 6. SYMBOL OVERLOAD: the same letters mean different things in different sections

**Where:** throughout, but concretely:
- `I` = *stimulus pickup* arrow in the observer pipeline (ObserverInDiagram,
  `W → S` via `I`), but `I(D)` = *interpretation* of a raw datum in
  "A practical procedure" step 2 (line ~1492, "What reading is the model
  imposing?").
- `M` = the *final-stage model* in the observer pipeline, a *time-indexed model*
  `M_t` (lines 977–986), *and* a *probabilistic model* in the statistical
  sameness row (line 201).
- `G` = covered in item 1.

**Consequence:** each of these is a legitimately different object that happens
to wear the same letter; the reader must disambiguate by context. This is a
real clarity/consistency defect in a chapter whose whole argument is about
not conflating levels.

**Fix:** rename the interpretation in the practical procedure to
`J(D)` (or `R(D)`), leaving `I` for stimulus pickup; rename the probabilistic
model in the statistical row to `𝓜` (calligraphic M) to distinguish it from
the observer's `M` and the time-indexed `M_t`. Add one sentence at each spot
disambiguating. These are renaming passes, but they remove genuine
cross-section collisions.

---

## 7. HALLUCINATION DIAGNOSIS REVERSES ITSELF (acknowledged, but still an inconsistency)

**Where:** "Three pathologies" (lines 1211–1260, esp. pathology 3 "the
contact-point liar") vs. "Hallucination, precisely" (lines 1416–1433).

**Problem:** In the pathologies section, pathology 3 (the contact-point liar,
which is glossed as the self-consistent-fantasy/hallucination case) is
declared a **special sub-case of failure-1 and to break *only***
**correspondence** (failure is correspondence, not coherence). But the AI
section (lines 1416–1421) explicitly states that this is *inaccurate*: the
**typical** hallucination is a "non-glueable presheaf" that breaks **both**
coherence **and** correspondence, and the chapter "changes the failure-mode
table" (line 1424). The two sections make contradictory claims about where
hallucination fails.

**Fix:** the chapter is already self-aware ("This is a more accurate diagnosis
than the chapter's default", line 1424) but it leaves the earlier statement
standing. Insert a forward-reference in the pathologies section (around line
~1250) noting that the contact-point-liar diagnosis will be *revised* by the
AI section, and that pathology 3 as originally stated holds only for the
*rare* pure self-consistent fantasy, not the typical case. Otherwise the
"Three pathologies" and the "Hallucination, precisely" sections contradict
each other and a reader reading linearly hits the contradiction before the
retraction.

---

## 8. DATE INCONSISTENCY: Tarski 1935 vs 1936

**Where:** lines 1048 (correctly explains 1933 Polish, 1936 German) vs.
lines 1098 and 1308 (both cite "Tarski, 1935").

**Problem:** the body correctly distinguishes the 1933 Polish original and the
1936 German publication, but the inline citations at lines 1098 and 1308 give
"1935" as the year. "Tarski, 1935" is a common shorthand (the 1935 attribution
used by some bibliographies for the Polish result), but within a single section
that has just carefully stated 1933/1936 it is an internal inconsistency.

**Fix:** make lines 1098 and 1308 consistent with line 1048 — either cite the
1936 German paper there too, or add a "(1933/1936)" qualifier. A one-line
consistency pass.

---

## 9. MINOR: "which regime?" unstated in two other boxed claims

**Where:** the "safeguard" box (lines 1016–1022) and "Convention T: the
internal distinction" (lines 1160–1210).

**Problem/Suggestions (lower severity):**
- The safeguard "Coherence is evidence for structural adequacy, not proof that
  the model is true" relies on the coherence/correspondence split that is only
  settled in the *following* section ("Truth: coherence and correspondence",
  line 1028). It is bootstrapped before its own justification. Consider moving
  the safeguard after section 1028 or deferring it with a forward reference.
- The Convention T subsection (1046–1086) correctly states the *material
  adequacy* (T-schema) and the *formal correctness* (consistency) conditions;
  this is accurate. No change needed there beyond confirming the date fix of
  item 8.

---

## Summary of priorities

| # | Fix | Severity | Lines |
|---|-----|----------|-------|
| 1 | `G` object vs. element | High | 509, 808, 824 |
| 2 | cover (fan) vs. chain structure | High | 495–511 |
| 3 | chapter itself violates "no silent upgrade" in "coherence = descent" | High | 41, 424, 1138, 1147 |
| 4 | unique global section vs. non-flattening | High | 426–476, 949–968 |
| 5 | "statistical ⇒ model-theoretic" asserted as automatic | Medium-High | 186–221, 768–796 |
| 6 | symbol overload `I`, `M`, `G` | Medium | throughout |
| 7 | hallucination diagnosis contradicts itself | Medium | 1211–1260 vs 1416–1433 |
| 8 | Tarski date 1935 vs 1936 | Low | 1048 vs 1098, 1308 |
| 9 | safeguard ordering / Convention T check | Low | 1016–1022, 1046–1086 |

Items 1–3 are the substantive mathematical/logical inconsistencies. Items
4–7 are internal-consistency tensions. Items 8–9 are clarity/polish fixes.
