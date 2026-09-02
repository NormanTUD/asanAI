(* ============================================================================= *)
(*                                                                             *)
(* 17_ThreePathologies.v                                                        *)
(*                                                                             *)
(* Sections "Three pathologies" and related of coherent_world_models.php,     *)
(* lines 1211-1260.                                                             *)
(*                                                                             *)
(* Summary of the section.                                                     *)
(*                                                                             *)
(*   Each failure mode breaks exactly one of the two conditions (coherence   *)
(*   or correspondence).                                                        *)
(*                                                                             *)
(*   1. Self-consistent fantasy: G satisfies the sheaf condition; descent   *)
(*      holds, the global section is unique; O_i, T_i all in T, so the      *)
(*      modelling setup is licensed throughout. But Tarski fails at the     *)
(*      contact points. Result: a perfectly coherent fiction.               *)
(*      Failure: correspondence.                                               *)
(*                                                                             *)
(*   2. Contact-point junkie: every claim individually checked, Tarski      *)
(*      holds at every point. But the model has no internal structure:      *)
(*      claims do not fit together, descent fails. Result: a factbook.      *)
(*      Failure: coherence.                                                    *)
(*                                                                             *)
(*   3. Contact-point liar: special case of (1). Internal logic consistent, *)
(*      T_i in T all licensed, but the system has been trained on data     *)
(*      that doesn't reflect W. With enough data and fitting, descent       *)
(*      holds internally; predictions at contact points miss because the    *)
(*      licence doesn't deliver empirical contact. Result: hallucinating    *)
(*      language model.                                                        *)
(*      Failure: correspondence.                                               *)
(*                                                                             *)
(*   All three, located on the one diagram:                                  *)
(*                                                                             *)
(*     (1) breaks on the claim arrow G -> W: every arrow in the diagram is *)
(*         licensed, descent holds, yet Tarski fails.                        *)
(*     (2) breaks on the T_i arrows into G: every claim is individually     *)
(*         true at the contact, but descent never delivers a G.             *)
(*     (3) breaks on the O_i arrows: licences are in order, but the data   *)
(*         never tracked W.                                                   *)
(*                                                                             *)
(* This file formalizes the three pathologies, their locations, and their  *)
(* remedies.                                                                    *)
(*                                                                             *)
(* ============================================================================= *)

Require Import Library.
Require Import Traces.
Require Import AdmissibleTransitions.
Require Import ContextsAndSites.
Require Import Sheaves.
Require Import MasterDiagram.
Require Import Forbidden.
Require Import Tarski.
From Coq Require Import Lists.List.
Import ListNotations.

(* ---------------------------------------------------------------------------- *)
(* 0.  Failure modes                                                            *)
(* ---------------------------------------------------------------------------- *)

Inductive FailureMode :=
  | FM_coherence     : FailureMode   (* the sheaf condition fails            *)
  | FM_correspondence : FailureMode. (* Tarski fails at a contact point     *)

(* ---------------------------------------------------------------------------- *)
(* 1.  Pathology 1: self-consistent fantasy                                      *)
(* ---------------------------------------------------------------------------- *)

(* The self-consistent fantasy: G satisfies the sheaf condition; O_i and   *)
(* T_i all belong to T; the modelling setup is licensed. But Tarski fails  *)
(* at the contact points. Result: a perfectly coherent fiction.            *)

Record SelfConsistentFantasy' := {
  SCF_G : Type;
  SCF_descent : Prop;             (* descent holds (placeholder)              *)
  SCF_O_licensed : Prop;          (* the O_i arrows are licensed             *)
  SCF_T_licensed : Prop;          (* the T_i arrows are licensed             *)
  SCF_tarski_fails : Prop;        (* Tarski fails at the contact point       *)
  SCF_diagnosis : SCF_descent /\ SCF_O_licensed /\ SCF_T_licensed
                     /\ SCF_tarski_fails
}.

Definition SCF_failure_mode : FailureMode := FM_correspondence.
(* The self-consistent fantasy breaks correspondence.                         *)

Definition SCF_remedy : Prop :=
  True.   (* the remedy is to re-calibrate the licence to deliver empirical  *)
          (* contact; concrete instantiations would supply the specific     *)
          (* remedy                                                        *)

(* ---------------------------------------------------------------------------- *)
(* 2.  Pathology 2: contact-point junkie                                         *)
(* ---------------------------------------------------------------------------- *)

(* The contact-point junkie: every claim individually true, but the model   *)
(* has no internal structure; descent fails; the "global model" is a heap. */

Record ContactPointJunkie' := {
  CPJ_claims : list Type;          (* a heap of individually-checked claims  *)
  CPJ_tarski_holds : forall c : Type, In c CPJ_claims -> Prop;
  CPJ_no_descent : Prop;           (* descent fails; no G                      *)
  CPJ_diagnosis : CPJ_tarski_holds /\ CPJ_no_descent
}.

Definition CPJ_failure_mode : FailureMode := FM_coherence.
(* The contact-point junkie breaks coherence.                                 *)

Definition CPJ_remedy : Prop :=
  True.   (* the remedy is to add coherent structure: better reasoning,    *)
          (* chain-of-thought, structured scratchpads                       *)

(* ---------------------------------------------------------------------------- *)
(* 3.  Pathology 3: contact-point liar                                           *)
(* ---------------------------------------------------------------------------- *)

(* The contact-point liar: special case of (1). Internal logic consistent, *)
(* but the system trained on data that doesn't actually reflect W.         *)

Record ContactPointLiar' := {
  CPL_M : Type;
  CPL_self_consistent : Prop;
  CPL_O_licensed : Prop;          (* the O_i arrows are licensed             *)
  CPL_T_licensed : Prop;          (* the T_i arrows are licensed             *)
  CPL_no_tarski_pass : Prop;      (* no T in T passes Tarski                  *)
  CPL_diagnosis : CPL_self_consistent /\ CPL_O_licensed /\
                     CPL_T_licensed /\ CPL_no_tarski_pass
}.
(* Per the chapter, this is the same failure as (1), not a new mode: the   *)
(* licensing was too permissive.                                              *)

Definition CPL_failure_mode : FailureMode := FM_correspondence.

Definition CPL_remedy : Prop :=
  True.   (* the remedy is re-licensing: better calibration, formal          *)
          (* verification where applicable                                  *)

(* ---------------------------------------------------------------------------- *)
(* 4.  Locating the break-points                                                  *)
(* ---------------------------------------------------------------------------- *)

(* All three, located on the one diagram.                                    *)

Inductive BreakPoint :=
  | BP_claim_arrow_G_to_W  : BreakPoint   (* (1) breaks on G -> W            *)
  | BP_T_arrows_into_G     : BreakPoint   (* (2) breaks on T_i -> G          *)
  | BP_O_arrows_W_to_R     : BreakPoint.  (* (3) breaks on O_i : W -> R_i    *)

(* The chapter's claim: each pathology has a different break-point and a  *)
(* different remedy.                                                          *)

Record PathologyLocation := {
  PL_pathology : SelfConsistentFantasy' + ContactPointJunkie' + ContactPointLiar';
  PL_break_point : BreakPoint;
  PL_remedy : Prop
}.

(* ---------------------------------------------------------------------------- *)
(* 5.  The diagnosis                                                              *)
(* ---------------------------------------------------------------------------- *)

(* A unified diagnostic:                                                       *)

Inductive PathologyDiagnosis :=
  | PD_self_consistent_fantasy  : PathologyDiagnosis   (* (1)                 *)
  | PD_contact_point_junkie     : PathologyDiagnosis   (* (2)                 *)
  | PD_contact_point_liar       : PathologyDiagnosis.  (* (3)                 *)

(* Each diagnosis has its own remedy, in plain words:                          *)

Record Remedy := {
  Rem_diagnosis : PathologyDiagnosis;
  Rem_kind : Type -> Type;        (* the kind of fix                            *)
  Rem_action : Rem_kind Type -> Prop  (* the actual remediation action         *)
}.

(* The chapter's closing moral:                                                *)

Axiom three_pathologies :
  forall (d : PathologyDiagnosis) (b : BreakPoint) (r : Remedy),
    Rem_diagnosis r = d ->
    BreakPoint_rect (fun _ => Prop) (fun _ _ _ => True)
                            (fun _ _ _ => True)
                            (fun _ _ _ => True) b.

(* ---------------------------------------------------------------------------- *)
(* 6.  Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes:                                                       *)
(*   - The three pathologies: SelfConsistentFantasy',                         *)
(*     ContactPointJunkie', ContactPointLiar'.                               *)
(*   - Their failure modes: correspondence, coherence, correspondence.       *)
(*   - Their break-points: claim arrow, T_i arrows, O_i arrows.              *)
(*   - The unified PathologyDiagnosis with the corresponding Remedy.        *)
(*                                                                             *)
(* The diagnosis matters: each pathology has a different remedy, and       *)
(* conflating them is one of the most common ways to talk uselessly about   *)
(* AI safety.                                                                 *)
(*                                                                             *)
(* The file depends on Library.v, Traces.v, AdmissibleTransitions.v,        *)
(* ContextsAndSites.v, Sheaves.v, MasterDiagram.v, Forbidden.v,             *)
(* and Tarski.v.                                                              *)
(*                                                                             *)
(* ============================================================================= *)
*)
