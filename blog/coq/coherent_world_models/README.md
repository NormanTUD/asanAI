# Coq formalization of coherent_world_models.php

This directory contains a Coq 8.20 formalization of the chapter
**From World to Model: Coherent Representation** (the file
`../coherent_world_models.php` in the parent directory).

The formalization is **structural**: it captures the shape of the
chapter's arguments at the level of types, records, and propositions,
but most of the substantive mathematical content is left as placeholders
(`True`, abstract `Prop` predicates, axioms). The chapter itself is a
*discipline* and an *attempt at organization*, not a derivation; we
follow it by formalizing the shapes of its claims rather than proving
the underlying mathematics.

The Coq files together compile into a single logical theory. Each file
covers one or more sections of the chapter, and the files form a
dependency-ordered stack: lower-numbered files provide concepts that
higher-numbered files use.

## File dependency graph

```
Library.v
   |
   v
Traces.v
   |
   v
Commitments.v
   |
   v
ThreeDifferences.v   NotionsOfSameness.v   Ologs.v
   \____________________|___________________/
                        |
                        v
              AdmissibleTransitions.v
                        |
                        v
              ContextsAndSites.v
                        |
                        v
                   Sheaves.v
                        |
                        v
              EqualizersAndPullbacks.v   HigherCoherence.v
                        \___________________/
                                |
                                v
                        ObserverInDiagram.v
                                 |
                                 v
                          MasterDiagram.v
                                 |
                                 v
                           Forbidden.v
                                 |
                                 v
                       PracticalProcedure.v
                                 |
                                 v
                           Tarski.v
                                 |
                                 v
                       ThreePathologies.v
                                 |
                                 v
                          TheoryChain.v
                                 |
                                 v
                            AILLM.v
```

## How to compile

From this directory, run `coqc` on the files in dependency order, or use
a build script. Each file's imports list all of its dependencies.

The files are designed so that `coqc Library.v` followed by `coqc Traces.v`,
`coqc Commitments.v`, etc. in dependency order builds the entire theory.

## What the chapter actually says, in one place

The chapter's central claim, in one boxed sentence, is:

> **A world model is the global section recovered from local descent
> data along an admissible cover, provisionally, revisably, and never
> identical to the subject matter it represents.**

The chapter unfolds this claim into:

1. **Traces** as outputs of access functions. Every observation is a
   trace; the trace is *transformed*, *mediated*, *underdetermined*, and
   *possibly indexical*.
2. **Three kinds of difference**: world-level (the subjects differ),
   channel-level (the instruments differ), processing-level (the
   interpretations differ).
3. **A hierarchy of sameness**, strongest to weakest: literal equality,
   isomorphism, homotopy equivalence, approximation, statistical
   agreement, model-theoretic compatibility. Each row implies the row
   below; silently promoting a weaker witness to a stronger claim is the
   chapter's standing category error.
4. **Ologs** as the picture-format used throughout (Spivak & Kent's
   ontology logs).
5. **Admissible transitions** `T`: the constrained class of arrows
   (observations, view-to-view translations, context refinements) that
   have been justified independently of any specific dataset.
6. **Contexts as a site**: contexts are "spaces" in the widest sense;
   refinements are arrows; covers are families of sub-contexts; an
   *admissible cover* is a cover whose arrows are in `T`. A site is a
   context-category equipped with a Grothendieck topology.
7. **Sheaves**: a presheaf is a functor `C^op -> V`; a *sheaf* turns
   compatible local data on an admissible cover into a unique global
   section.
8. **Equalizers and pullbacks**: the categorical building blocks of
   agreement.
9. **Higher coherence**: n-morphisms, Cech nerve, infinity-sheaves.
10. **The master diagram** `W -> R_i -> G`: the world through observation
    arrows into representations, glued by admissible transitions into a
    global model.
11. **Tarski's Convention T**: correspondence as an interface condition,
    with quotation, the meta-language, and the proposition `p`.
12. **The synthesis**: coherence (descent) AND correspondence (Tarski at
    every `T in T`), jointly, at every licensed contact.
13. **Three pathologies**: self-consistent fantasy, contact-point
    junkie, contact-point liar. Each breaks exactly one of the two
    conditions.
14. **The application to LLMs**: the LLM has only internal admissible
    transitions; the fix is to attach correspondence, piecemeal,
    auditable, licensed (retrieval, tools, code execution, formal
    verification, calibrated raters).

The formalization follows this structure.

---

# ASSUMPTIONS NOT FORMALIZED IN COQ

This section is the most important part of this README. It lists, file
by file and concept by concept, every claim that the chapter makes but
that the formalization does **not** capture.

There are three sources of these unformalized claims:

1. **Coq 8.20 strictness about dependent record projections.** Coq 8.20
   does not automatically substitute equalities between dependent
   projections, so comparisons between values whose types are only
   propositionally equal require explicit `eq_rect` rewriting. We
   sidestep these issues with placeholders, but the placeholders mean
   the formalization does not check the actual claim.

2. **Mathematics that the chapter gestures at without proving.** The
   chapter is a discipline, not a derivation. Many of its claims
   (e.g., that the Cech nerve reproduces F(c) as a limit in
   infinity-groupoids) are mathematical theorems that we do not state
   or prove.

3. **Substantive content that requires a real instantiation.** Many
   claims ("the licence was granted, but the licence does not deliver
   contact") are about particular modelling setups; we formalize the
   *shape* of such claims but not their instantiation.

In the lists below, each unformalized assumption is labelled with the
*kind* of gap:

- **[G]** : A gap due to a Coq 8.20 limitation on dependent record
  projections or universe polymorphism.
- **[M]** : A mathematical gap: the chapter gestures at a theorem that
  we have not stated or proved.
- **[I]** : An instantiation gap: the claim requires a concrete
  modelling setup that we have left abstract.

When a single claim combines several kinds of gaps, all are listed.

---

## File-by-file assumptions

### `Library.v`

**Purpose**: shared basic types and notions: subject matters, regions,
codomains, traces, access functions, view-to-view translations, context
refinements, the class `T` of admissible transitions, the six forms of
sameness, the hierarchy of weakenings, indexicality.

#### Sameness relations

- **Hierarchy of sameness** ([M]): the chapter claims that each row of
  the hierarchy implies the row below (equality implies isomorphism
  implies homotopy equivalence implies approximation implies
  statistical agreement implies model-theoretic compatibility). The
  formalization states the *implications* (e.g., `eq_to_iso_witness`,
  `iso_to_homotopy_witness`, `approx_to_stat_witness`) but the proofs are
  trivial case analyses or are admitted. The actual content of each
  implication (which in the chapter requires concrete construction of the
  stronger witness from the weaker) is not checked.

- **`stat_to_model_witness`** ([M]): admitted. The chapter says
  "statistical agreement implies model-theoretic compatibility under
  any reasonable interpretation"; a real proof would need to construct
  the common model from the statistical model, which we have not done.

- **`homotopy_to_approx_witness`** ([G]): the type signature of
  `ApproxSame` differs from what would be needed for a substantive proof.
  We supply a trivial bound (`d x y -> ApproxSame d eps x y`) but the
  intent was to express "homotopy equivalence implies approximation
  under any compatible metric". A full formalization would quantify over
  metrics and prove the implication for the metric induced by the
  homotopy.

#### Indexicality

- **`it_is_of` in `IndexicalTrace`** ([I]): a placeholder `Prop`. The
  chapter defines indexicality substantively ("a trace may point beyond
  itself to a source"), but the formalization's "is_of" predicate has
  no witness.

- **`FreePattern`** ([I]): the dichotomy "every trace is indexical or
  free" is not asserted as a theorem, per the chapter's note that
  indexicality is established by inference. The formalization provides
  both predicates and lets the user pick one or the other.

#### ApproxWitness

- **`ApproxWitness`** ([G]): declared with `Record ... : Prop` rather
  than as an inductive type. This avoids a Coq 8.20 issue with
  universe-polymorphic record projections. The cost: we cannot easily
  extract the bound `approx_d_le_eps` without explicit projection.

#### CommonModel

- **`cm_satisfies`** ([I]): the satisfaction predicate is supplied
  abstractly. The chapter's `Mod(T_D)` would specify which models
  satisfy which theories; we leave this to the instantiation.

---

### `Traces.v`

**Purpose**: the four properties of a trace (Transformed, Mediated,
Underdetermined, Possibly Indexical), the four worked examples
(electron track, tree shadow, archival document, proof in a paper),
the inference task as a possible-sources projection.

#### Type-equality workarounds

- **`ProducedTrace`** ([G]): the trace type uses `eq_rect` to coerce the
  type of `AF_map PT_access PT_region` from
  `R_carrier (AF_target PT_access)` to `R_carrier r`. The coercion is
  correct but inelegant; Coq 8.20's strict handling of dependent
  projections is the underlying cause.

- **`PossibleSource`** ([I]): the actual image-equality
  `AF_map PS_access PS_region, after coercion, equals t` is not stored
  as a field. We use a `Prop` placeholder `PS_image`. A real
  instantiation would supply the actual coercion and the equality
  proof.

#### Distinctness

- **`MediatedSetup.MS_distinct`** ([G]): the witness that the two
  access functions have distinct maps is stored as a placeholder
  `Prop`, because Coq 8.20 cannot compare two functions whose types
  are only propositionally equal. A concrete instantiation would have
  to define the equality-of-types more carefully.

- **`Underdetermined`** ([G]): the distinctness of two produced traces
  is again a placeholder. The actual content (regions differ or
  access functions differ) cannot be checked because the regions
  live in `W_carrier (AF_source (PT_access r pt))` and Coq does not
  reduce the equality of two such regions.

#### Inference

- **`PS_image`** ([G]): placeholder for the actual image-equality
  after type-coercion.

#### Inference disagreement

- **`inferences_disagree`** ([I]): the disjunction of regions and
  access functions. The chapter says two inferences are distinct when
  one or the other differs; we encode this as a disjunction. The actual
  decidability (whether two inferred pairs can be equal in both
  coordinates) is left to the instantiation.

---

### `Commitments.v`

**Purpose**: the five foundational commitments (indirect realism,
internal structure, admissible transitions, coherence not sufficient,
correspondence separate), the wordless introspection limit case, the
thing in itself, the dispute with qualia-primary views.

#### Coherence and correspondence

- **`CoherenceHolds`** ([I]): the predicate "coherence holds" is a
  placeholder `True`. The actual content (the sheaf condition holds on
  every admissible cover of `G`) is supplied in `Sheaves.v` as
  `sheaf_condition` and would be referenced here. We use `True` so
  that the commitments file can be compiled without depending on the
  sheaf machinery.

- **`CorrespondenceHolds`** ([I]): same: placeholder `True`. The actual
  content (Tarski's if-and-only-if at every `T in T`) is supplied in
  `Tarski.v`.

#### Axioms

- **`coherence_not_sufficient`** ([M]): axiom. The chapter says
  coherence is necessary but not sufficient; we capture this by an
  axiom that says no function from a coherent model to "true" exists
  in general. A concrete proof would need to exhibit a counterexample:
  a self-consistent fantasy.

- **`correspondence_not_implied_by_coherence`** ([M]): axiom. The
  chapter says correspondence is separate from coherence; we capture
  this by an axiom. Same caveat.

- **`truth_requires_both`** ([M]): axiom. The chapter says both are
  needed; we capture this by an axiom whose body is just `True`.
  Concrete content would require a proof that coherence +
  correspondence implies truth.

- **`limit_case_fragile`** ([M]): axiom. The chapter says the
  wordless-introspection limit case is fragile; we declare this as
  an axiom with no content.

- **`never_reach_ding_an_sich`** ([M]): axiom. The chapter says we
  never reach the thing in itself; we declare this as an axiom.

- **`dispute_is_foundational`** ([M]): axiom. The chapter says the
  dispute with qualia-primary views is foundational; we declare this
  as an axiom.

#### Records with Prop fields

- **`InternalStructure`** ([G]): the `IS_distinct` field is a
  projection-elided witness. Coq warns that the projections cannot
  be defined because `InternalStructure` is `Prop`-valued. This is a
  Coq 8.20 limitation; the formalization is correct in saying the
  record is a `Prop`.

---

### `ThreeDifferences.v`

**Purpose**: the three kinds of difference (world-level, channel-level,
processing-level), the diagnostic disjunction, the cartwrightian
caveat.

#### Distinctness placeholders

- **`ChannelDifference.CD_distinct`** ([G]): placeholder `Prop`. The
  actual content (the two instruments have distinct maps) cannot be
  compared directly because of Coq 8.20's strict dependent-projection
  handling.

#### Quantum caveat

- **QuantumIndistinguishability** ([I]): the placeholder is `True`.
  The chapter says identical quantum particles are literally
  indistinguishable; a real formalization would distinguish the
  particle case from the spacetime-region case. We mark this as a
  separate `WorldDifferenceKind`.

#### Doppler'shift

- **`ProcessingDifference.PD_disagree`** ([I]): the existence of a
  trace on which the two interpretations differ is a `Prop` that
  the user supplies.

---

### `NotionsOfSameness.v`

**Purpose**: the six forms of sameness, the hierarchy as a tower of
weakening lemmas, the forbidden moves (silent upgrade), the
transformation triangle, the parallel examples across sense data,
measurement, mathematics.

#### Hierarchy lemmas

- **`eq_to_iso_witness`**: proves equality-to-isomorphism via the
  identity iso. The chapter's claim is that equality witnesses
  trivially give isomorphism witnesses; this matches the formal
  proof.

- **`iso_to_homotopy_witness`**: destructures the isomorphism into
  its four fields and reassembles them as a homotopy equivalence.
  Coq 8.20 required destructuring because `iso_to` as a projection
  is not directly usable across different type variables.

- **`homotopy_to_approx_witness`**: rephrased as the trivial
  implication `d x y -> ApproxSame d eps x y`. The chapter's claim is
  stronger: that homotopy equivalence implies approximation under
  any compatible metric.

- **`approx_to_stat_witness`**: lifts an approximation witness to a
  statistical agreement via the placeholder `sa_intro`. The
  construction is trivial because `sa_intro` accepts any
  `True`-witness.

- **`stat_to_model_witness`** ([M]): **admitted**. The chapter says
  statistical agreement implies model-theoretic compatibility under
  any reasonable interpretation; we admit this without proof. A
  concrete proof would need to construct the common model.

#### Silent upgrade

- **SilentUpgradeError** ([I]): the inductive type enumerates the
  typical category errors; no proofs. A concrete use would supply
  specific witnesses of unjustified implications.

---

### `Ologs.v`

**Purpose**: the olog format (types as boxes, arrows as functional
relations, commutativity asserted), the thermometer olog, the master
olog.

#### Commutativity

- **`CommutativeSquare.CS_commutes`** ([G]): we initially tried to
  supply an explicit `forall x, OA_map h (OA_map f x) = OA_map k (OA_map g x)`,
  but the dependent projections of `OlogArrow` failed because of
  Coq 8.20's parameterized-record-projection issue. We replaced the
  field with a placeholder `Prop`.

#### Thermometer olog

- **`ThermometerReading`** ([G]): unused / awkward. The record was
  abandoned when we replaced the thermometer olog with the abstract
  `ThermometerOlog` record.

- **`MasterOlog.master_descent`**: trivially holds because both sides
  are identical. The substantive content (the sheaf condition) is in
  `Sheaves.v`.

---

### `AdmissibleTransitions.v`

**Purpose**: the class `T` (the disjunction of three kinds of
transition), the three interpretations (subcategory, Bayesian prior,
Occam penalty), the six kinds of admissible transition, the Sellarsian
web.

#### Three interpretations

- **`SubcategoryConstraint.SC_in_T`** ([I]): the membership witness is
  supplied abstractly. The actual content depends on the specific
  modelling setup.

- **`BayesianPrior.BP_in_T`** ([I]): same.

- **`OccamPenalty.OP_overfit`** ([I]): the meta-claim that more
  freedom requires more evidence. The chapter says this; we capture
  the shape but not the content.

- **`three_roles_one_set`** ([M]): axiom. The chapter says the three
  interpretations describe the same restriction; we declare this as
  an axiom.

#### Examples

- **`AdmissibleKind.justified`** ([I]): the actual justification
  (calibration curves, validation studies) is supplied externally.

#### Sellarsian web

- **`SellarsianWeb`**: a record of eight arrows. We declare `web_is_licensed`
  as `True`, deferring the actual licensing witness.

#### Axioms

- **`more_freedom_more_evidence`** ([M]): axiom. The chapter's box.

---

### `ContextsAndSites.v`

**Purpose**: contexts as tuples of six facets (where, when, who, how,
terms, tradition), refinements, covers, admissible covers, Grothendieck
topologies, sites, representation schemes, presheaves.

#### Cover

- **`Cover.CV_index`**: the index set is `Type`, which is concrete
  but informal. A real cover would have a specific index set.

- **`Cover.CV_maps`**: `forall i : CV_index, ContextRefinement`.
  The inclusions are abstract refinement maps.

- **`CoverCondition`** ([I]): the cover condition (`forall x, exists i`)
  is a placeholder `True`. A concrete cover would supply the
  existential witness.

#### GrothendieckTopology

- **`GT_pullback_stable`** ([G]): the closure-under-pullback axiom
  uses `forall (d : C_carrier (GT_underlying_category))` and the
  function space `d -> c` directly. Coq 8.20 had trouble with the
  more abstract version that lifts `d` back to a `Context`.

- **`GT_transitive`** ([G]): same issue, simplified to a placeholder.

#### Presheaf

- **`Presheaf.Prs_contravariant`** ([I]): the contravariance axiom is
  placeholder `True`. A real presheaf would specify how `F(c_1)`
  maps to `F(c_2)` under a refinement.

---

### `Sheaves.v`

**Purpose**: presheaves, compatibility on pairwise overlaps, the sheaf
condition, the pullback form, the three regimes, the running example
(train at a platform), the group-presentations parallel.

#### Sheaf condition

- **`sheaf_condition`** ([I]): the actual content (a family of
  compatible local sections lifts uniquely to a global one) is
  captured by a `forall (s1 s2 : Type), s1 = s2 -> exists g, True`
  shape. The `s1 = s2` is a placeholder for the actual compatibility
  condition (restrictions agreeing on overlaps); the `exists g, True`
  is a placeholder for the actual existence-and-uniqueness of a
  global section.

- **`sheaf_boxed`** ([M]): axiom. The chapter's box.

#### Pullback

- **`sheaf_pullback`** ([I]): the actual pullback shape is replaced
  with `True`. A concrete instantiation would specialize the
  projections and the universal property.

#### TrainChannel

- **`TrainChannel.TC_access`** ([G]): the access function is
  parameterized by a specific train event. Earlier versions had
  type-equality issues; we worked around them by parameterizing on
  the event.

#### GroupPresentations

- **`GroupPresentations.GP_transitions`** ([I]): the transitions
  between presentations are abstract `True` witnesses. A concrete
  formalization would specify each transition (e.g., the Cayley
  table is the composition table of the permutation action).

---

### `EqualizersAndPullbacks.v`

**Purpose**: equalizers and pullbacks as categorical limits, with the
set-level form, the worked examples (thermometers, proofs, tracks,
primes), the homotopical equalizer.

#### Equalizer

- **`Equalizer`** ([G]): the carrier `EQ_carrier` and the inclusion
  `EQ_inclusion` are part of a categorical-limit record. We do not
  prove the universal property from scratch; we just include it as a
  field.

- **`set_equalizer`** ([I]): the set-level form is given as a sigma
  type. A concrete instantiation would project out the witness.

- **`HomotopicalEqualizer.HE_homotopies`** ([I]): the higher-cell
  content (any two proofs of agreement are equal) is left abstract.

---

### `HigherCoherence.v`

**Purpose**: strict vs homotopical regimes, two-morphisms,
n-morphisms, three-morphisms, the Cech nerve, infinity-sheaves, the
lightning-and-thunder and equivalent-categories examples.

#### n-morphisms

- **`NCell`** ([I]): the abstract recursive type. A concrete
  instantiation would specify the map at each level.

- **`TwoCell.TC_homotopy`** ([G]): replaced with a placeholder
  `Prop` after Coq 8.20 issues with dependent projections of
  `OneCell`.

- **`ThreeCell.ThC_homotopy`** ([G]): same.

#### ThreeMorphism

- **`ThreeMorphism.TM_higher_filler`** ([I]): placeholder `True`.
  A concrete instantiation would specify the 3-cell data.

#### CechNerve

- **`CN_face_*`, `CN_degeneracy_*`** ([M]): the simplicial identities
  are not encoded. A real simplicial object would have proofs that
  the face and degeneracy maps compose correctly.

- **`CN_degree_n`** ([G]): the higher-degree overlaps are encoded as
  `nat -> Type`, but no actual maps are specified.

#### InfinitySheaf

- **`infinity_sheaf_condition`** ([I]): placeholder. The chapter says
  the limit over the Cech nerve reproduces F(c); we capture the
  shape but not the content.

---

### `ObserverInDiagram.v`

**Purpose**: the six-stage observer pipeline (W, S, rho, Sigma, M; I,
N, L, C), the observer composite, the four domain examples (vision,
audition, mathematics, history), the preservation question.

#### Composite

- **`observer_composite`** ([G]): defined using a local `compose`
  function rather than Coq's `Function` library or `compose` from
  `Program`, because the chapter uses `o` for composition in a way
  that conflicts with `Program`. A cleaner version would use the
  standard library.

#### Domain examples

- **VisionPipeline, AuditionPipeline, MathematicsPipeline,
  HistoryPipeline** ([I]): the actual content of each pipeline is
  minimal (types and arrows). A real formalization would specify
  the actual cognitive/neural mechanisms.

#### Backed claims

- **`BackedClaim.BC_licensed`** ([I]): placeholder `Prop`. A concrete
  claim would have an actual witness of the licence that preserves
  the structure.

---

### `MasterDiagram.v`

**Purpose**: parametric maps, three frameworks (Para, Lenses,
Optics), transformer layers, multi-head attention, embeddings,
multimodal alignment, training, generative models, hallucination, the
master diagram, the five settings, the hierarchy in the descent
context.

#### Parametric maps

- **`ParametricMap.PM_f`** ([I]): the parametric function is given as
  `theta -> X -> Y`. A concrete instantiation would specify the
  actual parametric family.

#### Transformer

- **`TransformerLayer`** ([I]): the residual update is given as a
  binary function. The actual content (the layer's weights) is
  abstract.

#### Multi-head attention

- **`MHA_*`** ([I]): the softmax and the output are abstract. A real
  formalization would specify the actual softmax computation.

#### Hallucination

- **`Hallucination.Hall_is_hallucination`** ([I]): the conjunction
  `self_consistent /\ ~ grounded` is a placeholder.

#### Master diagram

- **`global_section_exists`** ([I]): placeholder `True`. The
  substantive content (the sheaf condition holds) is in `Sheaves.v`.

- **`one_shape`** ([M]): axiom. The chapter's claim that the
  unification is not a metaphor.

---

### `Forbidden.v`

**Purpose**: the five forbidden moves (silent upgrade, unconstrained
T, identifying G with W, internal coherence as descent, analogy as
theorem).

#### Records

- **`SilentUpgrade`** ([I]): the unjustified implication is supplied.
  A concrete use would specify the actual upgrade and the missing
  witness.

- **`UnconstrainedT`** ([M]): the claim that coherence becomes vacuous
  is captured axiomatically.

- **`Identification`** ([M]): the chapter says identifying G with W is
  forbidden. We declare an axiom `identification_forbidden` that
  asserts no such identification exists.

- **`MistakenCoherence`** ([I]): the predicate `MC_mistake` is
  supplied.

- **`BorrowedAnalogy`** ([I]): the predicate `BA_analogy_used_as_theorem`
  is supplied.

#### Axioms

- **`upgrade_must_be_earned`** ([M]): axiom.
- **`coherence_vacuous_under_unconstrained_T`** ([M]): axiom.
- **`identification_forbidden`** ([M]): axiom.
- **`coherence_not_descent`** ([M]): axiom.
- **`analogy_not_theorem`** ([M]): axiom.

---

### `PracticalProcedure.v`

**Purpose**: the nine-step procedure (raw datum, interpretation,
chain, overlaps, licences, sameness, global model, residuals, next
observation), the procedure as a whole, the boxed principle.

#### Step records

Each step (Step1_RawDatum, ..., Step9_NextObservation) uses `Type`
fields and `Prop` placeholders for the actual content. A concrete
application of the procedure would supply:

- the actual `D` (raw datum),
- the actual interpretation `I(D)`,
- the actual chain `W -> D -> I`,
- the actual overlaps,
- the actual `T` (admissible transitions),
- the actual choice of sameness,
- the actual `G`,
- the actual residuals,
- the actual next-observation plan.

#### Boxed principle

- **`anomalies_are_constraints`** ([M]): axiom. The chapter's box.

---

### `Tarski.v`

**Purpose**: Tarski's Convention T, the three consequences
(non-primitive, semantic, conservative), truth as interface, the
coherence tradition, the synthesis, the completed diagram, the
three pathologies, Tarski's discipline, the practical protocol,
the closing synthesis.

#### Convention T

- **`ConventionT.CT_iff`** ([G]): replaced with a placeholder because
  Coq 8.20 could not unify `ML_carrier CT_ML` (the type of the
  quotation-name) with the actual proposition. A concrete
  formalization would require an equality between the two
  `ML_carrier` instances.

- **`SnowIsWhite.SIW_iff`** ([G]): placeholder `Prop`. The chapter's
  classical example.

- **`MetaLanguage.ML_quotes`** ([G]): declared but not used in
  Convention T. The actual quote-formation is left abstract.

#### Truth as interface

- **`TruthAsInterface.TAI_iff`** ([I]): placeholder. The actual
  content is the if-and-only-if between claim and fact.

#### Coherence tradition

- **`CoherenceTradition.CT_coherence_holds`** ([I]): placeholder
  `Prop`.

#### Synthesis

- **`coherence_and_correspondence`** ([M]): axiom. The chapter's box.

#### Three pathologies

- **`SelfConsistentFantasy.SCF_condition`** ([I]): placeholder.
  Concrete form would populate the descent with an actual cover.

- **ContactPointJunkie**: structure with placeholders.

- **ContactPointLiar**: structure with placeholders.

#### Tarski discipline

- **`TarskiDiscipline.TD_disciplines`** ([G]): the conjunction of
  four predicates is a single field. The four disciplines are
  abstract; a real formalization would prove them separately.

#### Audit state

- **`AuditState.Au_failures`** ([I]): the list of audit failures.
  A concrete audit would record actual failures.

#### Closing synthesis

- **`ClosingSynthesis.CS_truth`** ([I]): placeholder conjunction.

---

### `ThreePathologies.v`

**Purpose**: the three pathologies (self-consistent fantasy,
contact-point junkie, contact-point liar), their failure modes
(correspondence, coherence, correspondence), their break-points
(claim arrow, T arrows, O arrows), the unified diagnosis.

#### Records

- **All pathology records** ([I]): the actual content (descent holds,
  Tarski fails, etc.) is supplied as a `Prop` placeholder. A
  concrete formalization would specify each witness.

- **`Remedy.Rem_action`** ([I]): placeholder.

#### Axiom

- **`three_pathologies`** ([M]): axiom with a `BreakPoint_rect` that
  is too aggressive (we assert that any break-point matches the
  diagnosis). A real proof would be more careful.

---

### `TheoryChain.v`

**Purpose**: the chain of refinements (distinction, relation,
transformation, locality, compatibility, coherence, gluing, globality,
invariance), the contributions of each theory, structural realism,
perspectival difference, finite observers, the one-sentence thesis.

#### Chain stages

- **`next_stage`** ([I]): the function that takes a stage to its
  successor. Concrete and direct.

- **`stage_position`** ([I]): a function from stage to natural number.
  Concrete.

- **`StageMachinery`** ([I]): the carrier and construction at each
  stage. A real formalization would supply each.

#### Theory contributions

- **`TheoryContribution.TC_stages`** ([I]): the list of stages
  each theory contributes to. The lists are populated in the
  specific definitions (`set_type_theory_contributes`, etc.).

#### Structural realism

- **`chapter_position`** ([I]): the chapter's position is supplied
  via `exact` with a record. The actual content (the chapter commits
  to "any successful world model is the global section of some
  admissible cover") is captured as `True`.

- **`chapter_position.CP_denies`** ([I]): placeholder `True`. The
  chapter's denial (not OSR) is captured.

#### Master chain

- **`MasterChain.MC_chain`** ([G]): `W_carrier MC_W -> MC_R`. The
  arrow from the subject matter's carrier to the views. The arrow
  itself is not specified; a concrete formalization would supply
  the actual master arrow.

#### Perspectival difference

- **`Perspective.P_admissible_to_others`** ([I]): placeholder
  `Prop`. A concrete formalization would specify the admissible
  arrows between perspectives.

- **`coherence_relates_not_flattens`** ([M]): axiom. The chapter's
  boxed principle.

#### Finite observers

- **`ModelSequence.MS_update`** ([G]): `MS_models t -> DA_data -> MS_models (S t)`.
  The use of `S` (successor) for the time index requires nat to be
  in scope.

- **`ModelWithTime.MWT_*`** ([I]): placeholders. The chapter's
  boxed principle ("M_t is the best available at time t") is
  captured axiomatically.

- **`update_preserves_coherence`** ([M]): axiom. The actual claim
  (updating preserves coherence) is not proven.

#### One sentence

- **`WorldModelDefinition`** ([I]): placeholder fields. The
  chapter's thesis is captured axiomatically.

- **`choice_fixes_everything`** ([M]): axiom.

- **`coherence_is_evidence_not_proof`** ([M]): axiom.

---

### `AILLM.v`

**Purpose**: the LLM in the master diagram, internal descent
(in-context, chain-of-thought, self-consistency, verifier-guided
search), grounded observation (in-context, RAG, tools, formal
verification, RLHF), hallucination (non-glueable presheaf), the
augmented LLM, the LLM audit, the framework's limits, the honest
closing, the boxed principle.

#### Records

- **LLMSetup, InContextLearning, ChainOfThought, SelfConsistency,
  VerifierGuidedSearch, RAG, ToolUse, FormalVerification,
  NonGlueablePresheaf, HallucinationCase, AugmentedLLM, LLMAudit,
  HonestClosing** ([I]): all use `Prop` placeholders for the
  substantive content. The chapter offers each as a *lens*, not a
  theorem; the placeholders reflect this.

#### Axioms

- **`framework_has_limits`** ([M]): axiom.
- **`llm_world_model_kind`** ([M]): axiom.

---

# General notes

## What we *did* formalize, in summary

The shape of the chapter's argument is captured:

- The basic types: subject matter, codomain, trace, access function,
  view translation, context refinement.
- The class `T` of admissible transitions: `InT` is a disjunction of
  three kinds of transition.
- The hierarchy of sameness: `Same`, `Isomorphic`, `Homotopic`,
  `Approx`, `StatSame`, `ModelTheoreticSame`, with explicit
  `eq_to_iso_witness`, `iso_to_homotopy_witness`,
  `approx_to_stat_witness` lemmas.
- The four properties of a trace: `Transformed`, `MediatedSetup`,
  `Underdetermined`, `Indexical`/`FreePattern`.
- The three kinds of difference: `WorldDifference`, `ChannelDifference`,
  `ProcessingDifference`, plus the diagnostic `DisagreementKind`.
- The olog format: `OlogType`, `OlogArrow`, `CommutativeSquare`,
  `ThermometerOlog`, `MasterOlog`.
- The three interpretations of `T`: `SubcategoryConstraint`,
  `BayesianPrior`, `OccamPenalty`.
- Contexts, refinements, covers, admissible covers, Grothendieck
  topologies, sites, representation schemes, presheaves.
- Equalizers and pullbacks as categorical limits.
- n-morphisms: `NCell`, `Dimension`, `ZeroCell`, `OneCell`, `TwoCell`,
  `ThreeCell`.
- The Cech nerve: `CechNerve` with face and degeneracy placeholders.
- The observer pipeline: `ObserverPipeline`, `observer_composite`.
- The master diagram: `MasterDiagram`, `ParametricMap`,
  `TransformerLayer`, `MultiHeadAttention`, `Embedding`,
  `MultimodalAlignment`, `TrainingSetup`, `GenerativeModel`,
  `Hallucination`.
- Tarski's Convention T: `ObjectLanguage`, `MetaLanguage`,
  `ConventionT`, `TruthAsInterface`, `CoherenceTradition`.
- The synthesis: `CoherenceAndCorrespondence`, `CompletedDiagram`,
  `TarskiDiscipline`, `ClosingSynthesis`.
- The three pathologies: `SelfConsistentFantasy'`,
  `ContactPointJunkie'`, `ContactPointLiar'`, `FailureMode`,
  `BreakPoint`, `PathologyDiagnosis`, `Remedy`.
- The LLM section: `LLMSetup`, `InContextLearning`, `ChainOfThought`,
  `SelfConsistency`, `VerifierGuidedSearch`, `RAG`, `ToolUse`,
  `FormalVerification`, `NonGlueablePresheaf`, `HallucinationCase`,
  `AugmentedLLM`, `LLMAudit`, `TrainingDynamics`, `DataQuality`,
  `LossLandscape`, `HallucinationTableEntry`, `ValueAlignmentProblem`.
- The procedure: `Step1_RawDatum` through `Step9_NextObservation`,
  `Procedure`.
- The forbidden moves: `SilentUpgrade`, `UnconstrainedT`,
  `Identification`, `MistakenCoherence`, `BorrowedAnalogy`,
  `IsoCoinsExample`, `StatAgreement`, `ModelConsistency` (the
  four worked examples of silent-upgrade errors).
- The chain of refinements: `ChainStage`, `next_stage`, `stage_position`,
  `Theory`, `TheoryContribution`, structural realism (Worrall, Ladyman
  & Ross), `chapter_position`, `MasterChain`.
- Perspectival difference: `Perspective`, `SubjectWithPerspectives`,
  `coherence_relates_not_flattens`.
- Finite observers: `DataArrival`, `ModelSequence`, `ModelWithTime`,
  `update_preserves_coherence`.
- The one-sentence thesis: `WorldModelDefinition`, `world_model_thesis`,
  `ModelChoice`, `choice_fixes_everything`,
  `coherence_is_evidence_not_proof`.

## What we did **not** formalize, in summary

By kind:

- **[G] Coq 8.20 limitations**: ~12 places where we used placeholders
  because Coq 8.20's strict treatment of dependent record
  projections or universe polymorphism prevented a direct
  construction. These are technical limitations, not conceptual
  gaps. The chapter's claims would be expressible in a more
  recent Coq or with more careful use of `eq_rect`.

- **[M] Mathematical gaps**: ~30 axioms for claims that the
  chapter makes but that are mathematical theorems not proven in
  the chapter (or in this formalization). Examples: the
  contradiction between coherence and correspondence in the
  absence of truth; the identification forbidden; the framework
  has limits.

- **[I] Instantiation gaps**: most of the `Prop` placeholders
  throughout. The chapter's claims are about particular modelling
  setups; we formalize the *shape* of those claims but not the
  specific witnesses.

## Recommendations for further work

To turn this formalization into a full mechanisation, one would:

1. Replace each `[I]` placeholder with concrete instantiations,
   ideally from a real dataset or modelling setup (e.g., a concrete
   sheaf on a topological space).

2. Replace each `[M]` axiom with a real proof, ideally from the
   mathematical literature (e.g., the Cech nerve reproduces `F(c)`
   as a limit in infinity-groupoids).

3. Replace each `[G]` placeholder with a more elegant construction
   that side-steps Coq 8.20's strictness. Possible strategies:
   - use `eq_rect` more carefully;
   - use `Program` or `Equations` for dependent definitions;
   - use universe polymorphism explicitly;
   - move to a more recent Coq.

4. Add lemmas that connect the formalizations across files. For
   example: a lemma that says "if `MS_distinct` (in `Traces.v`) is
   supplied, then `MediatedSetup` is inhabited"; or "if
   `sheaf_condition` (in `Sheaves.v`) holds and `TAI_iff` (in
   `Tarski.v`) holds, then the model is true".

5. Add more concrete examples. The chapter gives many
   concrete examples (electron tracks, tree shadows, train at a
   platform, group presentations); some of these are abstracted in
   the formalization but not fully worked out. A full instantiation
   would carry each example through.

6. Add tests: for each lemma in the formalization, a `Theorem`
   that exercises the lemma on a concrete instance.

The shape of the chapter is now machine-checkable. The
substance is not.
