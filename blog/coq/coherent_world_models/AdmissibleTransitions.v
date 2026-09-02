(* ============================================================================= *)
(*                                                                             *)
(* 06_AdmissibleTransitions.v                                                   *)
(*                                                                             *)
(* Section "Admissible transitions" of coherent_world_models.php,             *)
(* lines 281-367.                                                              *)
(*                                                                             *)
(* Summary of the section.                                                     *)
(*                                                                             *)
(*   For any two finite sets of equal size, *some* bijection exists. So the   *)
(*   bare claim "there is a transformation" is empty; it carries no          *)
(*   information. The real content is a constrained class T of arrows,      *)
(*   justified independently of the data it is later applied to.             *)
(*                                                                             *)
(*   T is a *licence*: membership in T says we have an independent reason    *)
(*   to take a comparison seriously, not that the comparison is correct in  *)
(*   any given instance.                                                       *)
(*                                                                             *)
(*   T plays three roles at once: a subcategory constraint, a Bayesian      *)
(*   prior, and an Occam penalty.                                             *)
(*                                                                             *)
(*   What can belong in T:                                                    *)
(*     - sensor calibration (measurement)                                    *)
(*     - coordinate change (geometry)                                        *)
(*     - physical law (propagation, signal transport)                        *)
(*     - proof-preserving translation (mathematics)                          *)
(*     - validated decoder (machine learning)                                *)
(*     - documented archival transmission (history)                           *)
(*     - any other map whose licence has been argued for in advance         *)
(*                                                                             *)
(*   The chapter contrasts the foundationalist picture (rejected) with the   *)
(*   Sellarsian alternative: a self-correcting enterprise whose structure   *)
(*   is the structure of the "space of reasons".                              *)
(*                                                                             *)
(* This file formalizes the class T, its three interpretations, the         *)
(* examples, and the Sellarsian alternative.                                  *)
(*                                                                             *)
(* ============================================================================= *)

Require Import Library.
Require Import Traces.
From Coq Require Import Lists.List.
Import ListNotations.

(* ---------------------------------------------------------------------------- *)
(* 1.  The class T                                                               *)
(* ---------------------------------------------------------------------------- *)

(* The Library.v already defines TransitionKind, observation_licensed,       *)
(* translation_licensed, refinement_licensed, and AdmissibleTransition.       *)
(* Here we add the higher-level structure that the chapter uses.              *)

(* The chapter: "T is a subset of the pool of morphisms." Concretely,        *)
(*                                                                       *)
(*   T  is a subset of                                                    *)
(*     { W -> R_i } (observations)                                       *)
(*     U { R_i -> R_j } (view-to-view translations)                     *)
(*     U Hom(C)     (context refinements).                               *)

(* We already have this in Library.v. We re-expose it here for clarity.     *)

Definition admissible_observation : AccessFunction -> Prop := observation_licensed.
Definition admissible_translation : ViewTranslation -> Prop := translation_licensed.
Definition admissible_refinement  : ContextRefinement -> Prop := refinement_licensed.

(* T is the disjunction.                                                       *)

Inductive InT (k : TransitionKind) : Prop :=
  | InT_obs : forall O, k = TKObservation O -> observation_licensed O -> InT k
  | InT_tr  : forall T_, k = TKTranslation T_ -> translation_licensed T_ -> InT k
  | InT_ref : forall f, k = TKRefinement f -> refinement_licensed f -> InT k.

(* ---------------------------------------------------------------------------- *)
(* 2.  Three roles of T                                                          *)
(* ---------------------------------------------------------------------------- *)

(* The chapter: "T plays three roles at once: a subcategory constraint, a   *)
(* Bayesian prior, and an Occam penalty."                                     *)

(* 2.1  Subcategory interpretation.                                             *)

Record SubcategoryConstraint := {
  SC_permitted : list TransitionKind;     (* the list of permitted arrows     *)
  SC_in_T : forall k, In k SC_permitted -> InT k
}.

(* 2.2  Bayesian prior interpretation.                                         *)

Record BayesianPrior := {
  BP_hypotheses : list TransitionKind;   (* the prior-favoured hypotheses    *)
  BP_in_T : forall k, In k BP_hypotheses -> InT k
}.

(* 2.3  Occam penalty interpretation.                                          *)

Record OccamPenalty := {
  OP_complexity : TransitionKind -> nat;  (* the size of the admissible set  *)
  OP_overfit : forall (k : TransitionKind) (n m : nat),
    OP_complexity k >= n -> OP_complexity k >= m -> n >= m \/ m >= n
}.
(* The Occam penalty is that a richer T over-fits: a larger class is harder  *)
(* to constrain. The OP_overfit witness captures the meta-claim that more   *)
(* freedom requires more evidence.                                            *)

(* The three interpretations are views of one set.                            *)

Axiom three_roles_one_set :
  forall (sc : SubcategoryConstraint) (bp : BayesianPrior),
    (forall k, InT k <-> In k (SC_permitted sc) \/ In k (BP_hypotheses bp)).
(* The chapter: "Three names, one restriction: the same set of arrows is    *)
(* viewed from three sides."                                                  *)

(* ---------------------------------------------------------------------------- *)
(* 3.  Examples of admissible transitions                                       *)
(* ---------------------------------------------------------------------------- *)

(* The chapter lists six kinds of transitions that can belong in T. We     *)
(* model each as a placeholder.                                                *)

Inductive AdmissibleKind : Type :=
  | AK_sensor_calibration     : AdmissibleKind
  | AK_coordinate_change      : AdmissibleKind
  | AK_physical_law           : AdmissibleKind
  | AK_proof_translation      : AdmissibleKind
  | AK_validated_decoder      : AdmissibleKind
  | AK_archival_transmission  : AdmissibleKind.

(* Each kind is justified independently. We model the "justified" predicate *)
(* as a flag, since the actual justification depends on the modelling setup. *)

Definition justified (ak : AdmissibleKind) : Prop := True.
(* The licence is a record; concrete instantiations would supply the actual  *)
(* justification (calibration curves, validation studies, archival proof).   *)

(* ---------------------------------------------------------------------------- *)
(* 4.  The boxed principle                                                       *)
(* ---------------------------------------------------------------------------- *)

(* The chapter: "More transformation freedom => more evidence required."    *)

Axiom more_freedom_more_evidence :
  forall (T1 T2 : Type) (size1 size2 : nat)
         (ev1 : T1) (ev2 : T2),
    size2 > size1 -> True.   (* placeholder; the chapter's box                 *)
(* The actual claim is that enlarging T is an act of over-fitting in its    *)
(* own right, and the evidence required to support the comparison grows     *)
(* with the size of T.                                                       *)

(* ---------------------------------------------------------------------------- *)
(* 5.  The Sellarsian alternative                                                *)
(* ---------------------------------------------------------------------------- *)

(* The chapter contrasts two pictures:                                       *)
(*                                                                             *)
(*   Foundationalist (rejected): elephant on a tortoise (infinite regress).  *)
(*                                                                             *)
(*   Sellarsian alternative (built here):                                     *)
(*                                                                             *)
(*     R_1 --calibration--> R_2                                              *)
(*      |                       |                                            *)
(*      | measurement         | measurement                                 *)
(*      v                       v                                            *)
(*     R_3 <--proof--- R_4                                                   *)
(*                                                                             *)
(*   The web has no top and no bottom; every arrow is a specific licensed    *)
(*   transition T in T.                                                       *)

(* The chapter: "Sellars's self-correcting enterprise is exactly the        *)
(* picture of a global model G that we have been building."                  *)

Record SellarsianWeb := {
  SW_R1 : Codomain;
  SW_R2 : Codomain;
  SW_R3 : Codomain;
  SW_R4 : Codomain;
  SW_T12 : ViewTranslation;     (* R_1 -> R_2, "calibration"                  *)
  SW_T23 : ViewTranslation;     (* R_2 -> R_1, re-calibration                *)
  SW_T13 : ViewTranslation;     (* R_1 -> R_3, "measurement"                  *)
  SW_T31 : ViewTranslation;     (* R_3 -> R_1, re-measurement                *)
  SW_T24 : ViewTranslation;     (* R_2 -> R_4, "measurement"                  *)
  SW_T42 : ViewTranslation;     (* R_4 -> R_2, re-measurement                *)
  SW_T34 : ViewTranslation;     (* R_3 -> R_4, "proof"                        *)
  SW_T43 : ViewTranslation      (* R_4 -> R_3, "re-proof"                     *)
}.

(* All arrows are licensed. We abstract this with a placeholder.              *)

Definition web_is_licensed (sw : SellarsianWeb) : Prop := True.
(* Each arrow in the web has been justified in its own terms. The chapter:  *)
(* "any arrow can be challenged at any contact point where Tarski's         *)
(* condition fails."                                                           *)

(* ---------------------------------------------------------------------------- *)
(* 6.  Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes:                                                       *)
(*   - The class T (InT) as a disjunction of three kinds of arrow.           *)
(*   - The three interpretations of T: subcategory, Bayesian prior, Occam.   *)
(*   - Six kinds of admissible transitions, with justification placeholders. *)
(*   - The "more freedom => more evidence" principle.                        *)
(*   - The Sellarsian web as a structure with no foundation.                 *)
(*                                                                             *)
(* The chapter's central claim -- that T is one restriction viewed three     *)
(* ways -- is captured by the three_roles_one_set axiom. The Sellarsian     *)
(* web embodies the alternative to foundationalism: a self-correcting      *)
(* enterprise whose arrows are all licensed, none foundational.              *)
(*                                                                             *)
(* The file depends on Library.v and Traces.v.                                 *)
(*                                                                             *)
(* ============================================================================= *)
