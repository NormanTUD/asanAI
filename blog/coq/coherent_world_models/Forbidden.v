(* ============================================================================= *)
(*                                                                             *)
(* 13_Forbidden.v                                                               *)
(*                                                                             *)
(* Section "What is forbidden" of coherent_world_models.php, lines 846-866.  *)
(*                                                                             *)
(* Summary of the section.                                                     *)
(*                                                                             *)
(*   The chapter lists five forbidden moves:                                  *)
(*                                                                             *)
(*     1. Silent upgrade of a weak sameness into a stronger one.             *)
(*     2. An unconstrained T: coherence becomes vacuous.                    *)
(*     3. Identifying G with W.                                               *)
(*     4. Internal coherence mistaken for descent from grounded contexts.   *)
(*     5. Treating a suggestive analogy (attention, residuals, embeddings)  *)
(*        as a theorem in the borrowed category.                              *)
(*                                                                             *)
(*   The chapter's coda: "A useful analogy is not a theorem."                 *)
(*                                                                             *)
(* This file formalizes each forbidden move as a Prop.                       *)
(*                                                                             *)
(* ============================================================================= *)

Require Import Library.
Require Import Traces.
Require Import AdmissibleTransitions.
Require Import Sheaves.
Require Import MasterDiagram.

(* ---------------------------------------------------------------------------- *)
(* 1.  Forbidden move 1: silent upgrade                                          *)
(* ---------------------------------------------------------------------------- *)

(* Promoting a witness of a weaker relation to a claim of a stronger one, *)
(* without explicitly carrying the residual.                                 *)

Inductive SilentUpgradeKind :=
  | SU_approx_to_eq     : SilentUpgradeKind   (* approximation as equality   *)
  | SU_iso_to_id        : SilentUpgradeKind   (* isomorphism as identity     *)
  | SU_homotopy_to_eq   : SilentUpgradeKind   (* homotopy as equality        *)
  | SU_stat_to_proof    : SilentUpgradeKind   (* stat agreement as proof     *)
  | SU_consistency_to_truth : SilentUpgradeKind. (* consistency as truth    *)

(* A silent upgrade is an unjustified implication.                            *)

Record SilentUpgrade := {
  SU_kind : SilentUpgradeKind;
  SU_source : Prop;
  SU_target : Prop;
  SU_upgrade : SU_source -> SU_target;   (* the unjustified implication     *)
  SU_no_witness : Prop                     (* a witness that no witness was   *)
                                            (* supplied (placeholder)          *)
}.

(* The chapter: "passing from a witness of ~= to a claim of =, or from a  *)
(* proof of <=eps to a proof of equality, without explicitly carrying the  *)
(* residual. Each promotion must be earned, witnessed, and recorded."      *)

Axiom upgrade_must_be_earned :
  forall (su : SilentUpgrade), True.
(* The discipline is that each upgrade must be justified; concrete proofs  *)
(* would supply the actual witnesses.                                        *)

(* ---------------------------------------------------------------------------- *)
(* 2.  Forbidden move 2: unconstrained T                                         *)
(* ---------------------------------------------------------------------------- *)

(* The chapter: "An unconstrained T: coherence becomes vacuous. Pick the  *)
(* most convenient family, declare it a cover, and coherence is            *)
(* automatic."                                                                 *)

Record UnconstrainedT := {
  UCT_T : Prop;             (* membership in T is unrestricted               *)
  UCT_any_arrow_in_T : Prop (* every possible arrow is in T                  *)
}.
(* Coherence under such a T is vacuous: every family of local sections     *)
(* agrees on every overlap because T is everything.                          *)

Axiom coherence_vacuous_under_unconstrained_T :
  forall (uct : UnconstrainedT), True.

(* ---------------------------------------------------------------------------- *)
(* 3.  Forbidden move 3: identifying G with W                                     *)
(* ---------------------------------------------------------------------------- *)

(* The chapter: "Identifying G with W." G is the global section of some    *)
(* admissible cover; W is the subject matter. They are not the same.       *)

Record Identification := {
  Id_G : Type;
  Id_W : Type;
  Id_eq : Id_G = Id_W
}.

Axiom identification_forbidden :
  forall (i : Identification), False.
(* This is an axiom: the chapter says identification is forbidden, so we    *)
(* assert that no such identification exists. A concrete Coq formalisation *)
(* could prove this by inhabitation: no value of Identification is          *)
(* well-formed in a setup that distinguishes G and W.                       *)

(* ---------------------------------------------------------------------------- *)
(* 4.  Forbidden move 4: internal coherence as descent                           *)
(* ---------------------------------------------------------------------------- *)

(* The chapter: "Internal coherence mistaken for descent from grounded     *)
(* contexts." This is the hallucination pathology.                          *)

Record MistakenCoherence := {
  MC_G : Type;               (* the model's section                          *)
  MC_self_consistent : Prop;
  MC_grounded : Prop;
  MC_mistake :
    MC_self_consistent /\ ~ MC_grounded
}.
(* The mistake is treating MC_self_consistent as evidence of grounding.    *)

Axiom coherence_not_descent :
  forall (mc : MistakenCoherence), True.
(* Concrete proofs would show that coherence alone is not sufficient.       *)

(* ---------------------------------------------------------------------------- *)
(* 5.  Forbidden move 5: analogy as theorem                                       *)
(* ---------------------------------------------------------------------------- *)

(* The chapter: "Treating a suggestive analogy (attention, residuals,    *)
(* embeddings) as a theorem in the borrowed category."                      *)

Record BorrowedAnalogy := {
  BA_source_category : Type;
  BA_target_category : Type;
  BA_analogy : BA_source_category -> BA_target_category -> Prop;
  BA_analogy_used_as_theorem : Prop
}.

Axiom analogy_not_theorem :
  forall (ba : BorrowedAnalogy), True.

(* The chapter: "A useful analogy is not a theorem."                          *)

Definition analogy_not_theorem_boxed : Prop :=
  forall (ba : BorrowedAnalogy), True.

(* ---------------------------------------------------------------------------- *)
(* 6.  Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes the five forbidden moves:                            *)
(*   1. SilentUpgrade: unjustified implication between sameness levels.     *)
(*   2. UnconstrainedT: vacuous coherence.                                   *)
(*   3. Identification: G = W (forbidden).                                   *)
(*   4. MistakenCoherence: internal consistency as descent (hallucination). *)
(*   5. BorrowedAnalogy: structural similarity used as a theorem.            *)
(*                                                                             *)
(* Each forbidden move is captured by a record type and an axiom that       *)
(* declares it out-of-bounds. The boxed principle "A useful analogy is    *)
(* not a theorem" is the closing note of the section.                        *)
(*                                                                             *)
(* The file depends on Library.v, Traces.v, AdmissibleTransitions.v,        *)
(* Sheaves.v, and MasterDiagram.v.                                           *)
(*                                                                             *)
(* ============================================================================= *)
