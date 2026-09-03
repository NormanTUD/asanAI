# Coq Formalisation vs. PHP Source: Consistency Analysis

## Status (updated)
All 19 `.v` files now compile cleanly with zero warnings in dependency order
(Library → Traces → Commitments → ThreeDifferences → NotionsOfSameness → Ologs →
AdmissibleTransitions → ContextsAndSites → Sheaves → EqualizersAndPullbacks →
HigherCoherence → ObserverInDiagram → MasterDiagram → Forbidden →
PracticalProcedure → TheoryChain → Tarski → ThreePathologies → AILLM). AILLM.v
that the old note below said "FAILS TO COMPILE" now builds cleanly.

Fixes applied since the original audit:
- **Commitments.v** `InternalStructure`: `: Prop` → `: Type` (fixed
  cannot-define-projection warning).
- **Tarski.v** `ConventionT.CT_iff` was `CT_quoted = CT_p` (wrongly identifying
  quotation-name with proposition) → now `CT_true CT_S <-> CT_p`, with a
  dedicated truth-predicate field and a comment spelling out Convention T as a
  meta-level biconditional. `TruthAsInterface.TAI_iff` similarly became a
  biconditional between separate `claim_holds`/`fact_holds` Props.
- **Sheaves.v** `sheaf_condition` now asserts `exists g` with a comment noting
  uniqueness is required (shape-only; uniqueness deliberately retained as a
  placeholder).
- **ContextsAndSites.v** `Presheaf` → `SetValuedPresheaf` (resolved the
  name-collision with Sheaves.v `Presheaf` referenced by AILLM.v).
- **Forbidden.v** `identification_forbidden` no longer asserts `False` for all
  identifications (which was inconsistent); re-shaped as "no coherent model
  identifies G with W" via a `CoherentModel` record. Removed stray quotes that
  were triggering Coq's comment-terminator warnings.
- **EqualizersAndPullbacks.v** `times_of_agreement` now returns the
  equalizer-carrier type instead of a bare `Type` placeholder.

Note: The Coq-side issues above have **no effect on the PHP content**. The PHP
is the prose source of truth and is correct (e.g., its Convention T presentation
is accurate). Issues were only in how the `.v` files encoded that content.

A **separate content audit of the PHP itself** is in `corrections.md` (G-object/
G-element conflation, cover/chain mismatch, "coherence = descent" self-referential
tension, uniqueness vs. non-flattening, the admitted stat→model weakening,
symbol overload, the hallucination-diagnosis reversal, and a Tarski date fix).

---

## File-by-file comparison

### Library.v — Shared foundations
**PHP lines 47–84.** Correctly defines SubjectMatter, Codomain, AccessFunction, ViewTranslation, Context, ContextRefinement, TransitionKind, and AdmissibleTransition. The six sameness relations are formalised with witnesses. Two weakening lemmas (eq→iso, iso→homotopy) are proved.
**Gap:** All three licence predicates (`observation_licensed`, `translation_licensed`, `refinement_licensed`) are hardcoded to `True`. The PHP says membership in T is "justified independently of any specific dataset" but that justification is never supplied. The file is structurally correct but substantively vacuous at the licence level.

### Traces.v — Four properties of a trace
**PHP lines 49–57.** The ProducedTrace record uses `eq_rect` to handle Coq 8.20's dependent projection rules. The four properties (Transformed, Mediated, Underdetermined, Indexical/FreePattern) are formalised.
**Gap:** The Mediated and Underdetermined properties carry placeholder Props (`True`) for the actual distinctness proofs. The PHP says "different access functions on the same w produce different traces"; the Coq record has a `MS_distinct : Prop` field that is never discharged. The structure is faithful; the content is a stub.

### Commitments.v — Five foundational commitments
**PHP lines 60–84.** All five commitments are formalised as Records. The wordless-inspection limit case, the Ding an sich, and the qualia-primary dispute are also captured.
**Gap:** `coherence_not_sufficient` is an axiom (`~ True`, i.e., `False` — the placeholder says coherence is not sufficient for truth but the actual axiom is just `False`). `correspondence_not_implied_by_coherence` is similarly ungrounded. These are noted in comments as placeholders.

### NotionsOfSameness.v — Hierarchy of sameness
**PHP lines 158–247.** All six sameness levels are defined. Four of the five weakening lemmas (eq→iso, iso→homotopy, homotopy→approx, approx→stat) are proved. The stat→model weakening is `Admitted`. The forbidden silent-upgrade errors and the transformation triangle are formalised. The parallel examples across sense data, measurement, and mathematics are present as Records.
**Gap:** The stat→model weakening is admitted without proof. The hierarchy_implications definition bundles the implications but relies on the admitted lemma. The PHP's HoTT discussion (univalence axiom, spaces of witnesses) is not captured.

### Ologs.v — Ologs
**PHP lines 251–277.** OlogType, OlogArrow (with functional arrows), CommutativeSquare, and the thermometer olog are formalised. The master olog W→R→G is defined.
**Gap:** The master descent condition is a degenerate identity (`T(O(w)) = T(O(w))`), not the real sheaf condition. The PHP's statement that "every diagram so far is an olog in disguise" is noted but not formalised beyond the degenerate case.

### AdmissibleTransitions.v — The class T
**PHP lines 281–367.** The class T is formalised as a disjunction of three kinds (InT). The six admissible kinds are listed. The Sellarsian web is defined.
**Gap:** `three_roles_one_set` is an axiom relating SubcategoryConstraint and BayesianPrior, never discharged. `more_freedom_more_evidence` is an axiom. `web_is_licensed` is `True`. The PHP's three-role diagram (subcategory, Bayesian prior, Occam penalty) is captured structurally but not proved equivalent.

### ContextsAndSites.v — Contexts as a site
**PHP lines 371–420.** ContextFacet (where/when/who/how/terms/tradition), Cover, AdmissibleCover, GrothendieckTopology, Site, and RepresentationScheme are formalised.
**Gap:** `cover_condition` is `True`. The Grothendieck topology axioms (pullback stability, transitivity) are `True` placeholders. The Presheaf record here (in ContextsAndSites.v) conflicts in naming with the Presheaf in Sheaves.v (both define `Presheaf` at different types). This is a **compilation hazard** (one shadows the other via Coq module system).

### Sheaves.v — Sheaves and descent
**PHP lines 424–513.** The sheaf condition, TwoPatchCover, TwoPatchCompatibility, the pullback form, the three regimes, and the train/group-presentation examples are formalised.
**Gap:** `sheaf_condition` is a simplified version (exists g, not uniqueness). `sheaf_pullback` is `True`. The PHP's equaliser-form equation (F(c) ≃ Eq(∏F(c_i) ⇉ ∏F(c_i ×_c c_j))) is not captured — the equaliser is only in EqualizersAndPullbacks.v, not connected to the sheaf condition. The three regimes (strict, homotopical, empirical) are defined as an Inductive but their inter-relationships are not formalised.

### EqualizersAndPullbacks.v — Equalizers and pullbacks
**PHP lines 517–553.** Both equalizers and pullbacks are formalised with full universal properties. The set-level forms are given explicitly. Worked examples (two thermometers, two proofs, two tracks, two prime definitions) are present.
**Gap:** `times_of_agreement` is `Type` (a type, not a Prop — this is a type error in the formalisation). The homotopical equalizer is present but its higher-cell content is a Prop placeholder.

### HigherCoherence.v — Higher coherence
**PHP lines 557–608.** StrictCoherence, TwoMorphism, n-morphisms (Dimension, NCell, ZeroCell, OneCell, TwoCell, ThreeCell), ThreeMorphism, CechNerve, and InfinitySheaf are formalised. Examples: lightning/thunder, equivalent categories.
**Gap:** The Čech nerve's simplicial identities are not enforced (face and degeneracy maps are present but their laws are not stated). The infinity_sheaf_condition is a trivially-true Prop. The PHP's statement that "relations can themselves have relations — the tower is not decoration" is captured structurally.

### ObserverInDiagram.v — The observer is part of the diagram
**PHP lines 612–640.** The six-stage pipeline (W→S→ρ→Σ→M) is formalised as ObserverPipeline with the composite function. Examples: vision, audition, mathematics, history.
**Gap:** No gaps — this file is a faithful structural transcription.

### MasterDiagram.v — The master diagram
**PHP lines 644–842.** ParametricMap, TransformerLayer, MultiHeadAttention, Embedding, MultimodalAlignment, TrainingSetup, GenerativeModel, Hallucination, MasterDiagram, and MasterSetting are formalised. The hierarchy_in_descent record captures the six-level hierarchy.
**Gap:** `global_section_exists` is `True`. `one_shape` is an axiom. The PHP's five-row table (strict, homotopical, model-theoretic, probabilistic, ML) is captured as an Inductive but not proved to share a common structure. The TransformerLayer residual is parameterised oddly (TL_F takes a Type, not TL_H).

### Forbidden.v — Five forbidden moves
**PHP lines 846–866.** All five forbidden moves are formalised as Records with axioms.
**Gap:** `identification_forbidden` is an axiom that `False` holds for any Identification — but the actual Identification record allows `Id_eq := eq_refl` when `Id_G = Id_W` trivially, so the axiom is inconsistent (it asserts False of a type that is always inhabited when G and W happen to be the same type). The axiom should be: for any Identification where G and W are *distinct* subject matters, the identification is false. The current formulation is technically provable (by providing G := W) but the *intent* is not captured.

### PracticalProcedure.v — Nine-step procedure
**PHP lines 870–890.** All nine steps are formalised as separate Records, bundled into a Procedure record. The boxed principle is an axiom.
**Gap:** The SamenessChoice in this file conflicts with the SamenessChoice in the same file (defined twice — lines 91–97 and used in the record). This is a naming issue within the file but compiles because the second definition shadows the first. The procedure does not enforce ordering constraints between steps.

### TheoryChain.v — Theory chain
**PHP lines 894–1024.** The nine ChainStages, eight Theories, their contributions, structural realism, the master chain, perspectival difference, finite observers, and the one-sentence thesis are formalised.
**Gap:** `coherence_relates_not_flattens`, `update_preserves_coherence`, `world_model_thesis`, `choice_fixes_everything`, and `coherence_is_evidence_not_proof` are all axioms. The WMD_cover field uses `cov : AdmissibleCover c` which has a binding syntax issue (the colon inside a field definition). The structural realism position is captured but the philosophical nuance (weaker than OSR) is only in comments.

### Tarski.v — Tarski's Convention T
**PHP lines 1028–1324.** ConventionT (with four pieces), SnowIsWhite, TarskiConsequence, TruthAsInterface, CoherenceTradition, CoherenceAndCorrespondence, CompletedDiagram, three pathologies (SCF, CPJ, CPL), TarskiDiscipline, AuditStep/AuditState, and ClosingSynthesis are formalised.
**Gap:** The ConventionT record has `CT_iff : CT_quoted = CT_p`, which says the quotation-name equals the proposition — this is *not* what Tarski says. Tarski says "S is true iff p", where the iff is a *meta-level* biconditional, not an equality in the meta-language. The current formalisation conflates the quotation-name of S with the proposition p, which is the wrong identification. The PHP is precise about this ("the right-hand side is not inside quotation marks: it is not the name of a sentence, it is the sentence's content, asserted as a fact about the world"). The Coq file's `CT_iff : CT_quoted = CT_p` is structurally wrong.

### ThreePathologies.v — Three pathologies
**PHP lines 1211–1260.** The three pathologies (SCF, CPJ, CPL), their failure modes, break points, and remedies are formalised. The PathologyDiagnosis and Remedy records are present.
**Gap:** `three_pathologies` axiom is vacuous (it always returns `True` regardless of inputs). The break-point/remedy correspondence is noted in comments but not enforced in code.

### AILLM.v — AI and LLM application (FAILS TO COMPILE)
**PHP lines 1328–1565.** LLMSetup, LLMInternalOnly, InContextLearning, ChainOfThought, SelfConsistency, VerifierGuidedSearch, InContextObservation, RAG, ToolUse, FormalVerification, NonGlueablePresheaf, HallucinationDiagnosis, AugmentedLLM, TrainingDynamics, HallucinationTableEntry, LLMAudit, FrameworkLimit, HonestClosing are defined.
**Likely compilation failures:**
1. `NGP_presheaf : Presheaf` references the Presheaf from Sheaves.v, but `NGP_local_sections : forall c : Context, Type` uses a bare `Context` that may conflict with the Context defined in ContextsAndSites.v vs. Library.v.
2. `TrainingDynamics` has a `TD_sample : TD_D -> TD_B` field but TD_D and TD_B are defined as Type in the same record, which may cause universe inconsistency.
3. Multiple naming conflicts with the SamenessChoice type (defined in PracticalProcedure.v, re-used here via import).
4. `LLMAudit` references `SamenessChoice` which is imported from PracticalProcedure.v but may not be in scope.

---

## Summary of consistency

### What is consistent
1. **Structural shape.** Every section of the PHP is represented by a corresponding .v file. The mapping is 1:1 and complete.
2. **The master diagram.** W→R_i→G is faithfully captured in MasterDiagram.v.
3. **The hierarchy of sameness.** Six levels, with four of five weakening lemmas proved.
4. **The observer pipeline.** W→S→ρ→Σ→M is a clean transcription.
5. **Equalizers and pullbacks.** Full universal properties, explicit set-level forms.
6. **The nine-step procedure.** All nine steps, structurally correct.
7. **The three pathologies.** Correctly typed, failure modes correctly assigned.
8. **The five forbidden moves.** All five present.
9. **Ologs.** Three rules, thermometer example, master olog.
10. **The chain of nine stages.** Correctly enumerated with the right theory contributions.

### What is not consistent or problematic
1. **Convention T is formally wrong.** `CT_iff : CT_quoted = CT_p` equates the quotation-name with the proposition. Tarski's Convention T is a meta-level biconditional, not an object-level equality. This is the single most important formalisation error in the entire corpus.
2. **Licences are all True.** Every admissible-transition licence is hardcoded to `True`. The PHP says "membership in T is justified independently of any specific dataset" — the Coq files never supply that justification. This makes the entire admissible-transition machinery vacuous.
3. **Sheaf condition is incomplete.** The sheaf condition requires *uniqueness* of the global section, not just existence. The current definition only asserts existence.
4. **Presheaf name collision.** ContextsAndSites.v and Sheaves.v both define `Presheaf` at different types, creating a shadowing hazard.
5. **Forbidden move 3 is inconsistent.** `identification_forbidden` asserts `False` for all Identification records, but the Identification record is always inhabited (set G := W). The axiom should be restricted to cases where G and W are genuinely distinct subject matters.
6. **`times_of_agreement` is a type, not a Prop.** In EqualizersAndPullbacks.v line 81, the definition returns `Type` instead of a meaningful Prop.
7. **Stat→model weakening is admitted.** The last link in the sameness hierarchy is `Admitted`, leaving the hierarchy incomplete.
8. **All boxed principles are axioms.** Every "boxed" claim from the PHP is an axiom in Coq (`Axiom ... : Prop`), never discharged. The formalisation captures shapes but not content.
9. **AILLM.v fails to compile.** The most application-heavy file does not build, likely due to naming conflicts and universe issues.
10. **The PHP's HoTT/univalence content is absent.** The PHP discusses dependent type theory, identity types as spaces, and the univalence axiom; the Coq files do not capture this (they use plain Coq type theory, not HoTT).

### Verdict
The Coq files are a **structurally faithful but substantively thin** transcription of the PHP. The mapping is complete (every PHP section has a .v file), and the structural shapes are correct. But nearly all the real content — licences, sheaf uniqueness, the Tarskian biconditional, the boxed principles — lives in axioms or placeholders. The Convention T formalisation error is the most consequential: the chapter's central claim about truth as a contact-point condition is formally misstated. The rest is correct at the level of data structure but empty at the level of proof.
