(* ============================================================================= *)
(*                                                                             *)
(* TheoryChain.v                                                               *)
(*                                                                             *)
(* Sections Where each theory lives on one chain,                           *)
(* Perspectival difference is not erased, Finite observers, provisional   *)
(* globality, and One sentence of coherent_world_models.php, lines 894-    *)
(* 1024.                                                                        *)
(*                                                                             *)
(* Summary of the four sections.                                               *)
(*                                                                             *)
(*   Where each theory lives on one chain (lines 894-944).                    *)
(*                                                                             *)
(*     The chapter lists a chain of refinements:                              *)
(*                                                                             *)
(*       distinction (sets, type theory)                                      *)
(*              |                                                              *)
(*       relation (graphs, typed identity)                                    *)
(*              |                                                              *)
(*       transformation (categories)                                          *)
(*              |                                                              *)
(*       locality (topology, sites)                                            *)
(*              |                                                              *)
(*       compatibility (sheaves)                                              *)
(*              |                                                              *)
(*       coherence (infinity-sheaves, HoTT)                                   *)
(*              |                                                              *)
(*       gluing (descent)                                                      *)
(*              |                                                              *)
(*       globality (model theory, ML)                                         *)
(*              |                                                              *)
(*       invariance (what survives T)                                        *)
(*                                                                             *)
(*     Each theory contributes to one or more rows.                            *)
(*                                                                             *)
(*     The chain's signature fact has a direct counterpart in the philosophy   *)
(*     of science: structural realism (Worrall 1989), ontic structural        *)
(*     realism (Ladyman & Ross 2007). The chapter's position is weaker:      *)
(*     not OSR, but the structural-relational claim that any successful world *)
(*     model is the global section of some admissible cover, and what survives *)
(*     an admissible change of cover is the structural content.                *)
(*                                                                             *)
(*   Perspectival difference is not erased (lines 947-968).                  *)
(*                                                                             *)
(*     The boxed principle: Coherence relates perspectives; it does not       *)
(*     flatten them. Two observers, two instruments, two cultures, two       *)
(*     centuries, two formal systems: their reports need not coincide to be   *)
(*     about one subject. What is required is that the differences factor    *)
(*     through admissible transitions.                                        *)
(*                                                                             *)
(*   Finite observers, provisional globality (lines 970-988).                *)
(*                                                                             *)
(*     Data arrive over time. A model is never final. M_t is the best        *)
(*     justified coherent model available at time t.                          *)
(*                                                                             *)
(*   One sentence (lines 991-1024).                                          *)
(*                                                                             *)
(*     The chapter's boxed sentence, repeated: A world model is the global   *)
(*     section recovered from local descent data along an admissible cover,  *)
(*     provisionally, revisably, and never identical to the subject matter   *)
(*     it represents. The choice of C, V, T fixes the rest.                    *)
(*                                                                             *)
(* This file formalizes each row of the chain as a stage, the perspective    *)
(* invariant, the finite-observer chain, and the one-sentence thesis.         *)
(*                                                                             *)
(* ============================================================================= *)

Require Import Library.
Require Import Traces.
Require Import AdmissibleTransitions.
Require Import ContextsAndSites.
Require Import Sheaves.
Require Import HigherCoherence.
From Coq Require Import Lists.List.
Import ListNotations.

(* ---------------------------------------------------------------------------- *)
(* 1.  The chain: nine stages                                                    *)
(* ---------------------------------------------------------------------------- *)

(* Each stage of the chain is a refinement of the previous. The chapter     *)
(* shows them in a vertical chain with arrows; we model each stage as a    *)
(* distinct record type.                                                       *)

Inductive ChainStage :=
  | CS_distinction  : ChainStage   (* sets, type theory                       *)
  | CS_relation     : ChainStage   (* graphs, typed identity                  *)
  | CS_transformation : ChainStage (* categories                              *)
  | CS_locality     : ChainStage   (* topology, sites                          *)
  | CS_compatibility : ChainStage  (* sheaves                                  *)
  | CS_coherence    : ChainStage   (* infinity-sheaves, HoTT                   *)
  | CS_gluing       : ChainStage   (* descent                                  *)
  | CS_globality    : ChainStage   (* model theory, ML                         *)
  | CS_invariance   : ChainStage.  (* what survives T                         *)

(* Each stage refines the previous. The chapter draws arrows downward; we *)
(* encode the refinement as a function from stage to stage (or as a      *)
(* relation).                                                                  *)

Definition next_stage (s : ChainStage) : option ChainStage :=
  match s with
  | CS_distinction    => Some CS_relation
  | CS_relation       => Some CS_transformation
  | CS_transformation => Some CS_locality
  | CS_locality       => Some CS_compatibility
  | CS_compatibility   => Some CS_coherence
  | CS_coherence       => Some CS_gluing
  | CS_gluing          => Some CS_globality
  | CS_globality       => Some CS_invariance
  | CS_invariance      => None
  end.

(* Each stage has its own machinery: types, relations, etc.                 *)

Record StageMachinery (s : ChainStage) := {
  SM_carrier : Type;                       (* the underlying type at this stage *)
  SM_construction : ChainStage -> Prop;    (* placeholder for the construction  *)
  SM_position : nat                        (* the position of this stage       *)
}.

Definition stage_position : ChainStage -> nat :=
  fun s => match s with
           | CS_distinction    => 0
           | CS_relation       => 1
           | CS_transformation => 2
           | CS_locality       => 3
           | CS_compatibility  => 4
           | CS_coherence      => 5
           | CS_gluing         => 6
           | CS_globality      => 7
           | CS_invariance     => 8
           end.

(* ---------------------------------------------------------------------------- *)
(* 2.  Which theory contributes to which stage                                   *)
(* ---------------------------------------------------------------------------- *)

(* The chapter's table of theories and their contributions:                   *)

Inductive Theory :=
  | Th_set_type_theory    : Theory   (* distinction, typed sameness         *)
  | Th_category_theory    : Theory   (* transformation, composition        *)
  | Th_topology_sites     : Theory   (* locality without metric            *)
  | Th_sheaf_theory       : Theory   (* compatibility => gluing             *)
  | Th_higher_categories  : Theory   (* higher coherence                   *)
  | Th_model_theory       : Theory   (* structures satisfying constraints  *)
  | Th_probability        : Theory   (* approximate compatibility           *)
  | Th_machine_learning   : Theory.  (* learned R, T, G                     *)

Record TheoryContribution := {
  TC_theory : Theory;
  TC_stages : list ChainStage
}.

(* Specific contributions, per the chapter's table.                          *)

Definition set_type_theory_contributes : TheoryContribution :=
  {| TC_theory := Th_set_type_theory;
     TC_stages := [CS_distinction; CS_relation] |}.
(* Set / type theory: distinction, typed sameness.                          *)

Definition category_theory_contributes : TheoryContribution :=
  {| TC_theory := Th_category_theory;
     TC_stages := [CS_transformation] |}.
(* Category theory: transformation, composition.                            *)

Definition topology_sites_contributes : TheoryContribution :=
  {| TC_theory := Th_topology_sites;
     TC_stages := [CS_locality] |}.
(* Topology / sites: locality without metric.                                *)

Definition sheaf_theory_contributes : TheoryContribution :=
  {| TC_theory := Th_sheaf_theory;
     TC_stages := [CS_compatibility; CS_gluing] |}.
(* Sheaf theory: compatibility => gluing.                                    *)

Definition higher_categories_contribute : TheoryContribution :=
  {| TC_theory := Th_higher_categories;
     TC_stages := [CS_coherence] |}.
(* infinity-categories, HoTT: higher coherence.                             *)

Definition model_theory_contributes : TheoryContribution :=
  {| TC_theory := Th_model_theory;
     TC_stages := [CS_globality] |}.
(* Model theory: structures satisfying constraints.                          *)

Definition probability_contributes : TheoryContribution :=
  {| TC_theory := Th_probability;
     TC_stages := [CS_compatibility] |}.
(* Probability: approximate compatibility.                                   *)

Definition machine_learning_contributes : TheoryContribution :=
  {| TC_theory := Th_machine_learning;
     TC_stages := [CS_globality] |}.
(* ML: learned R, T, G.                                                      *)

(* The full list of contributions.                                            *)

Definition all_contributions : list TheoryContribution :=
  set_type_theory_contributes ::
  category_theory_contributes ::
  topology_sites_contributes ::
  sheaf_theory_contributes ::
  higher_categories_contribute ::
  model_theory_contributes ::
  probability_contributes ::
  machine_learning_contributes ::
  nil.

(* ---------------------------------------------------------------------------- *)
(* 3.  Structural realism                                                         *)
(* ---------------------------------------------------------------------------- *)

(* The chapter invokes structural realism (Worrall 1989) and ontic          *)
(* structural realism (Ladyman & Ross 2007) as philosophical positions   *)
(* that take seriously the chain's signature fact: across theory change,  *)
(* what is preserved is the structure, not the unobservables.                *)

Inductive StructuralRealism :=
  | SR_structural_realism : StructuralRealism     (* Worrall 1989              *)
  | SR_ontic_structural_realism : StructuralRealism. (* Ladyman & Ross 2007    *)

(* The chapter's position: weaker than OSR, but commits to the            *)
(* structural-relational claim.                                              *)

Record ChapterPosition := {
  CP_structural_realism : StructuralRealism;
  CP_commits_to : Prop;       (* the chapter commits to this                *)
  CP_denies : Prop            (* the chapter does not commit to this       *)
}.

Definition chapter_position : ChapterPosition.
Proof.
  exact {| CP_structural_realism := SR_structural_realism;
           CP_commits_to := True;     (* any successful world model is     *)
                                       (* the global section of some        *)
                                       (* admissible cover                   *)
           CP_denies := True          (* not OSR: not there is nothing     *)
                                       (* but the structure                *)
        |}.
Defined.

(* ---------------------------------------------------------------------------- *)
(* 4.  The master chain as one shape                                             *)
(* ---------------------------------------------------------------------------- *)

(* The chapter: the master chain is one shape, not a metaphor.              *)

Record MasterChain := {
  MC_W : SubjectMatter;             (* one subject                            *)
  MC_R : Type;                       (* many views                             *)
  MC_T : list TransitionKind;        (* admissible transitions                *)
  MC_G : Type;                       (* coherent whole                         *)
  MC_chain : W_carrier MC_W -> MC_R  (* the master arrow                       *)
}.

(* No single discipline owns the picture; each refines one term of the    *)
(* chain.                                                                      *)

Definition chain_step (mc : MasterChain) : Prop :=
  (* each stage of the chain is a refinement of the previous                *)
  exists s : ChainStage, True.

(* ---------------------------------------------------------------------------- *)
(* 5.  Perspectival difference is not erased                                      *)
(* ---------------------------------------------------------------------------- *)

(* The boxed principle: Coherence relates perspectives; it does not flatten *)
(* them. Two observers, two instruments, two cultures, two centuries, two  *)
(* formal systems: their reports need not coincide to be about one subject. */

(* We model the *perspective* as a context (which can be a historical      *)
(* period, a laboratory setup, a formal system, a culture). The difference *)
(* factored through admissible transitions is the condition that the      *)
(* perspectives, though different, glue via T into a coherent whole.        *)

Record Perspective := {
  P_kind : Type;                     (* the kind of perspective                *)
  P_reports : list Type;             (* the reports from this perspective       *)
  P_admissible_to_others : forall other : Perspective, Prop  (* placeholder  *)
}.

(* Two perspectives need not coincide to be about one subject.             *)

Record SubjectWithPerspectives := {
  SWP_W : SubjectMatter;
  SWP_perspectives : list Perspective;
  SWP_difference_factors_through_T :
    forall (p1 p2 : Perspective),
      In p1 SWP_perspectives ->
      In p2 SWP_perspectives ->
      Prop     (* placeholder: the difference factors through T            *)
}.

(* The boxed principle as an axiom.                                          *)

Axiom coherence_relates_not_flattens :
  forall (swp : SubjectWithPerspectives), Prop.
(* A concrete proof would state that coherent local sections, possibly     *)
(* distinct, glue into a unique global section.                              *)

(* ---------------------------------------------------------------------------- *)
(* 6.  Finite observers, provisional globality                                   *)
(* ---------------------------------------------------------------------------- *)

(* Data arrive over time. A model is never final.                           *)

Record DataArrival := {
  DA_time : nat;                     (* the time of arrival                    *)
  DA_data : Type;                     (* the data that arrived                  *)
}.

Record ModelSequence := {
  MS_models : nat -> Type;           (* M_t: model at time t                   *)
  MS_arrivals : nat -> DataArrival;  (* the arrivals over time                 *)
  MS_update : forall t : nat, MS_models t -> DA_data -> MS_models (S t);
  (* each new datum updates the model                                       *)
}.

(* The boxed principle: M_t is not the complete world; it is the best    *)
(* justified coherent model available at time t.                            *)

Record ModelWithTime := {
  MWT_t : nat;
  MWT_model : Type;
  MWT_justified : Prop;
  MWT_coherent : Prop;
  MWT_best_available : Prop     (* MWT_model is the best available at time MWT_t *)
}.

(* The update step preserves the chain of coherence; this is the discipline *)
(* of recording residuals (PracticalProcedure.v).                            *)

Axiom update_preserves_coherence :
  forall (ms : ModelSequence) (t : nat),
    Prop.
(* A concrete proof would show that updating M_t with D_{t+1} yields a    *)
(* model M_{t+1} that is at least as coherent as M_t.                       *)

(* ---------------------------------------------------------------------------- *)
(* 7.  One sentence                                                              *)
(* ---------------------------------------------------------------------------- *)

(* The chapter's boxed sentence.                                              *)

Record WorldModelDefinition := {
  WMD_cover : Cover;
  WMD_descent : forall c : Context (cov : AdmissibleCover c), Prop;
  WMD_global_section : Type;
  WMD_provisional : Prop;             (* provisionally, revisably            *)
  WMD_revisable : Prop;               (* the model can be revised               *)
  WMD_not_identical_to_subject : Prop  (* never identical to W               *)
}.

(* A world model, per the chapter's one sentence, is the global section    *)
(* recovered from local descent data along an admissible cover,            *)
(* provisionally, revisably, and never identical to the subject matter.     *)

Axiom world_model_thesis :
  forall (wm : WorldModelDefinition), Prop.
(* The chapter's central thesis: a world model is *that*, and everything     *)
(* else (perception, measurement, physics, mathematics, model theory,       *)
(* neural networks) is a choice of C, V, T.                                  *)

(* The choice of C, V, T fixes everything else.                              *)

Record ModelChoice := {
  MC_C : Type;                         (* the site of contexts                  *)
  MC_V : Type;                         (* the target of representations         *)
  MC_T : Prop.                         (* the admissible transitions            *)
}.

Axiom choice_fixes_everything :
  forall (choice : ModelChoice), Prop.
(* The chapter: Everything else (perception, measurement, physics,         *)
(* mathematics, model theory, neural networks) is a choice of C, V, T.   *)

(* The safeguard, once more: coherence is evidence for structural adequacy, *)
(* not proof that the model is true.                                          *)

Axiom coherence_is_evidence_not_proof :
  forall (g : Type), Prop.

(* ---------------------------------------------------------------------------- *)
(* 8.  Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes:                                                       *)
(*   - The nine stages of the chain (ChainStage, next_stage, stage_position).*)
(*   - The eight theories that contribute (Theory, TheoryContribution,       *)
(*     specific contributions, all_contributions).                            *)
(*   - Structural realism (Worrall, Ladyman & Ross) and the chapter's       *)
(*     position.                                                               *)
(*   - The master chain as one shape.                                         *)
(*   - Perspectival difference (Perspective, SubjectWithPerspectives,        *)
(*     coherence_relates_not_flattens).                                       *)
(*   - Finite observers (DataArrival, ModelSequence, ModelWithTime,           *)
(*     update_preserves_coherence).                                          *)
(*   - The one-sentence thesis (WorldModelDefinition, world_model_thesis,    *)
(*     ModelChoice, choice_fixes_everything,                                 *)
(*     coherence_is_evidence_not_proof).                                      *)
(*                                                                             *)
(* The file depends on Library.v, Traces.v, AdmissibleTransitions.v,        *)
(* ContextsAndSites.v, Sheaves.v, and HigherCoherence.v.                     *)
(*                                                                             *)
(* Most of the substantive content is captured as axioms or placeholders;  *)
(* see the main README.md for the full inventory of assumptions.             *)
(*                                                                             *)
(* ============================================================================= *)
*)
