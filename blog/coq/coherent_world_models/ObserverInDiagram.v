(* ============================================================================= *)
(*                                                                             *)
(* 11_ObserverInDiagram.v                                                       *)
(*                                                                             *)
(* Section "The observer is part of the diagram" of                           *)
(* coherent_world_models.php, lines 612-640.                                   *)
(*                                                                             *)
(* Summary of the section.                                                     *)
(*                                                                             *)
(*   So far the discussion has been structural: equalizers, pullbacks,     *)
(*   Cech nerves, higher cells. The diagrams have had objects and           *)
(*   morphisms, but no agents. The next step is to put the inquirer back   *)
(*   in: every structural claim about subject matter W is made by someone,  *)
(*   through some access pipeline, encoded in some report.                  *)
(*                                                                             *)
(*   Every access to a subject matter is a composite, in every domain:     *)
(*                                                                             *)
(*     W --stimulus pickup (I)--> S --neural processing (N)--> rho          *)
(*     --language / encoding (L)--> Sigma --calibration / check (C)--> M   *)
(*                                                                             *)
(*     subject        signal         internal rep.    report         model   *)
(*                                                                             *)
(*   The boxed question: "Which structure of the subject matter does this *)
(*   representation preserve, and what does it discard?"                    *)
(*                                                                             *)
(* This file formalizes the observer's pipeline as a composite of six     *)
(* stages.                                                                      *)
(*                                                                             *)
(* ============================================================================= *)

Require Import Library.
Require Import Traces.
From Coq Require Import Basics.FunctionalExtensionality.
Import Coq.Init.Notations.

(* ---------------------------------------------------------------------------- *)
(* 1.  The six-stage pipeline                                                    *)
(* ---------------------------------------------------------------------------- *)

(* The chapter names five stages (W, S, rho, Sigma, M) plus the four        *)
(* transitions (I, N, L, C). We model the pipeline as a record.            *)

Record ObserverPipeline := {
  OP_W : SubjectMatter;                (* the subject matter                    *)
  OP_S : Type;                          (* the stimulus/signal                   *)
  OP_rho : Type;                        (* the internal representation           *)
  OP_Sigma : Type;                      (* the report/encoding                   *)
  OP_M : Type;                          (* the model                              *)

  OP_I : W_carrier OP_W -> OP_S;        (* stimulus pickup                       *)
  OP_N : OP_S -> OP_rho;                (* neural processing                     *)
  OP_L : OP_rho -> OP_Sigma;            (* language / encoding                   *)
  OP_C : OP_Sigma -> OP_M               (* calibration / check                   *)
}.

(* The full composite is the pipeline from W to M.                           *)

Definition observer_composite (p : ObserverPipeline)
  : W_carrier (OP_W p) -> OP_M p :=
  OP_C p o OP_L p o OP_N p o OP_I p.
(* This is the chapter's W -> M composite via the five stages.             *)

(* ---------------------------------------------------------------------------- *)
(* 2.  Examples from each domain                                                 *)
(* ---------------------------------------------------------------------------- *)

(* Vision: light -> retinal image -> V1 -> ... -> conscious percept.        *)

Record VisionPipeline := {
  VP_light : Type;
  VP_retinal : Type;
  VP_V1 : Type;
  VP_percept : Type;
  VP_I : VP_light -> VP_retinal;
  VP_N : VP_retinal -> VP_V1;
  VP_L : VP_V1 -> VP_percept
}.
(* We omit the calibration step for simplicity.                               *)

(* Audition: air-pressure variations -> cochlear response -> auditory      *)
(* cortex -> perceived sound.                                                  *)

Record AuditionPipeline := {
  AP_pressure : Type;
  AP_cochlear : Type;
  AP_cortex : Type;
  AP_percept : Type;
  AP_I : AP_pressure -> AP_cochlear;
  AP_N : AP_cochlear -> AP_cortex;
  AP_L : AP_cortex -> AP_percept
}.

(* Mathematics: abstract structure -> formal statements -> derivations ->    *)
(* published proofs.                                                           *)

Record MathematicsPipeline := {
  MP_structure : Type;
  MP_statements : Type;
  MP_derivations : Type;
  MP_proof : Type;
  MP_I : MP_structure -> MP_statements;
  MP_N : MP_statements -> MP_derivations;
  MP_L : MP_derivations -> MP_proof
}.

(* History: past events -> archival documents -> historiographic claims ->  *)
(* published narrative.                                                         *)

Record HistoryPipeline := {
  HP_events : Type;
  HP_documents : Type;
  HP_claims : Type;
  HP_narrative : Type;
  HP_I : HP_events -> HP_documents;
  HP_N : HP_documents -> HP_claims;
  HP_L : HP_claims -> HP_narrative
}.

(* ---------------------------------------------------------------------------- *)
(* 3.  The boxed question                                                        *)
(* ---------------------------------------------------------------------------- *)

(* "Which structure of the subject matter does this representation         *)
(* preserve, and what does it discard?"                                       *)

Record RepresentationQuestion := {
  RQ_pipeline : ObserverPipeline;
  RQ_preserved : Type -> Prop;     (* the structure preserved                *)
  RQ_discarded : Type -> Prop      (* the structure discarded                *)
}.

Definition ask_preservation (q : RepresentationQuestion) : Type -> Prop :=
  RQ_preserved q.

Definition ask_discarding (q : RepresentationQuestion) : Type -> Prop :=
  RQ_discarded q.

(* ---------------------------------------------------------------------------- *)
(* 4.  The invariance discipline                                                 *)
(* ---------------------------------------------------------------------------- *)

(* The chapter (in the later section "Invariants") says: "Speak only of    *)
(* what your admissible transitions preserve." We capture this as a       *)
(* discipline: every claim about the subject matter should be backed by    *)
(* an admissible transition that preserves the structure invoked.          *)

Record BackedClaim := {
  BC_pipeline : ObserverPipeline;
  BC_structure : Type -> Prop;
  BC_licensed : Prop   (* witness that some T in T preserves the structure *)
}.

Definition claim_is_backed (c : BackedClaim) : Prop :=
  BC_licensed c.   (* the claim is backed by a licensed transition          *)

(* ---------------------------------------------------------------------------- *)
(* 5.  Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes:                                                       *)
(*   - The six-stage observer pipeline (W, S, rho, Sigma, M; I, N, L, C).  *)
(*   - The observer composite as a function W -> M.                          *)
(*   - Worked examples: vision, audition, mathematics, history.             *)
(*   - The preservation question (what is preserved, what is discarded).  *)
(*   - The backed-claim discipline: every claim about W should be backed   *)
(*     by an admissible transition that preserves the structure invoked.   *)
(*                                                                             *)
(* The pipeline makes the abstract "subject matter" concrete: every claim *)
(* about W arrives at M through a specific sequence of transformations.   *)
(* Each transformation may discard structure, and the disciplines of the  *)
(* rest of the chapter apply at each stage.                                  *)
(*                                                                             *)
(* The file depends on Library.v and Traces.v.                                 *)
(*                                                                             *)
(* ============================================================================= *)
