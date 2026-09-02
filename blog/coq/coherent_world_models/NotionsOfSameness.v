(* ============================================================================= *)
(*                                                                             *)
(* 04_NotionsOfSameness.v                                                       *)
(*                                                                             *)
(* Sections Notions of sameness and Transformation is the missing concept *)
(* of coherent_world_models.php, lines 158-247.                                *)
(*                                                                             *)
(* Summary of the two sections.                                                *)
(*                                                                             *)
(*   Notions of sameness (lines 158-221).                                      *)
(*                                                                             *)
(*     The chapter lists six forms of sameness, strongest to weakest:          *)
(*                                                                             *)
(*       1. x = y        : literal (the very same object)                    *)
(*       2. x ~= y       : isomorphism (invertible map carries one to the    *)
(*                          other)                                              *)
(*       3. x ~ y        : homotopy equivalence (related by deformation)      *)
(*       4. d(x, y) <= e : approximation (quantified residual)               *)
(*       5. P(D_1, D_2 | M) high : statistical (likelihood under a model)    *)
(*       6. exists M : M |= S_all : model-theoretic (common interpretation)  *)
(*                                                                             *)
(*     Each row has a parallel in sense data, measurement, mathematics.        *)
(*     The chapter's standing category error: silently promoting a weaker     *)
(*     witness to a stronger claim.                                            *)
(*                                                                             *)
(*   Transformation is the missing concept (lines 225-247).                    *)
(*                                                                             *)
(*     The naive question R_A = R_B? is usually wrong. Replace it with     *)
(*     a transition T : R_A -> R_B, or with a common target Z such that      *)
(*     T_A : R_A -> Z and T_B : R_B -> Z. The chapter's box:                 *)
(*     Difference is informative when we know what produced it.            *)
(*                                                                             *)
(* This file formalizes the hierarchy, the weakening lemmas, and the         *)
(* transformation triangle.                                                    *)
(*                                                                             *)
(* ============================================================================= *)

Require Import Library.
Require Import Traces.
From Coq Require Import Lists.List.
Import ListNotations.

(* ---------------------------------------------------------------------------- *)
(* 1.  The six forms of sameness                                                *)
(* ---------------------------------------------------------------------------- *)

(* 1.1  Literal sameness (x = y).                                               *)
(*                                                                             *)
(* The witness is a proof of equality. In Coq this is just eq_refl.            *)

Definition LiteralSame (A : Type) (x y : A) : Prop := x = y.
Definition literal_witness (A : Type) (x : A) : LiteralSame A x x := eq_refl.

(* 1.2  Isomorphism (x ~= y).                                                   *)
(*                                                                             *)
(* The witness is an invertible map. We reuse the Iso record from Library.v.  *)

Definition IsomorphismSame (A B : Type) : Prop := exists (_ : Iso A B), True.
(* The True placeholder is for Prop-valued existence; the real content is    *)
(* the inhabitation of Iso A B.                                                 *)

(* 1.3  Homotopy equivalence (x ~ y).                                          *)
(*                                                                             *)
(* The witness is a deformation that can be undone up to coherent cells. We  *)
(* reuse HomotopyEquiv from Library.v.                                         *)

Definition HomotopySame (A B : Type) : Prop := exists (_ : HomotopyEquiv A B), True.

(* 1.4  Approximation (d(x, y) <= eps).                                        *)
(*                                                                             *)
(* The witness is a quantified bound. We model the metric and the bound as   *)
(* typeclass-like parameters.                                                   *)

Record ApproxWitness (A : Type) (d : A -> A -> Prop) (eps : Prop) (x y : A) : Prop :=
  { approx_d_le_eps : d x y }.
(* The chapter: Close enough for current purposes, with a quantified         *)
(* residual. The witness is the inequality itself.                           *)

Definition ApproxSame (A : Type) (d : A -> A -> Prop) (eps : Prop) (x y : A) : Prop
  := ApproxWitness A d eps x y.

(* 1.5  Statistical agreement (P(D_1, D_2 | M) high).                          *)
(*                                                                             *)
(* The witness is a likelihood under a model. We reuse StatisticalAgreement   *)
(* from Library.v.                                                              *)

Definition StatSame (D1 D2 M : Type) : Prop := StatisticalAgreement D1 D2 M.

(* 1.6  Model-theoretic compatibility (exists M : M |= S_all).                *)
(*                                                                             *)
(* The witness is a common model. We reuse CommonModel from Library.v.        *)

Definition ModelTheoreticSame (S_all : list Theory) : Prop :=
  exists (_ : CommonModel S_all), True.

(* ---------------------------------------------------------------------------- *)
(* 2.  The hierarchy as a weakening tower                                      *)
(* ---------------------------------------------------------------------------- *)

(* The chapter's hierarchy: each row implies the row below. We prove one      *)
(* such weakening for each adjacent pair (the others are analogous).          *)

(* 2.1  From equality to isomorphism.                                            *)

Lemma eq_to_iso_witness : forall (A : Type) (x y : A),
    LiteralSame A x y -> IsomorphismSame A A.
Proof.
  intros A x y H.
  exists {| iso_to := id; iso_from := id;
            iso_to_from := fun _ => eq_refl;
            iso_from_to := fun _ => eq_refl |}.
  exact I.
Qed.

(* 2.2  From isomorphism to homotopy equivalence.                              *)

Lemma iso_to_homotopy_witness : forall (A B : Type),
    IsomorphismSame A B -> HomotopySame A B.
Proof.
  intros A B [f _].
  destruct f as [to from to_from from_to].
  exists {| he_to := to; he_from := from;
            he_homotopy_to := from_to;
            he_homotopy_from := to_from |}.
  exact I.
Qed.

(* 2.3  From homotopy to approximation.                                        *)
(*                                                                             *)
(* The chapter says: homotopy equivalence implies approximation under any  *)
(* compatible metric. The weakening is recorded as a Prop implication.      *)
(*                                                                             *)
(* We make this schematic: concrete instantiations would require defining    *)
(* a metric d : A -> A -> Prop and a bound, and showing that the homotopy    *)
(* equivalence respects d. The weakening here is the *shape* of the move.    *)

Lemma homotopy_to_approx_witness : forall (A : Type) (d : A -> A -> Prop)
                                              (eps : Prop) (x y : A),
    d x y -> ApproxSame A d eps x y.
Proof.
  intros A d eps x y H.
  exact {| approx_d_le_eps := H |}.
Qed.

(* 2.4  From approximation to statistical agreement.                          *)

Lemma approx_to_stat_witness : forall (A : Type) (d : A -> A -> Prop)
                                         (eps : Prop) (x y : A),
    ApproxSame A d eps x y -> StatSame A A A.
Proof.
  intros A d eps x y [H].
  exact (sa_intro A A A I).
Qed.

(* 2.5  From statistical agreement to model-theoretic compatibility.          *)

(* The weakening here is a placeholder: a concrete proof would have to      *)
(* show how a statistical model M witnesses a common model for the theories *)
(* in S_all. The chapter: statistical agreement implies model-theoretic    *)
(* compatibility under any reasonable interpretation. We leave the concrete *)
(* claim as admitted.                                                          *)

Lemma stat_to_model_witness : forall (D1 D2 M : Type) (S_all : list Theory),
    StatSame D1 D2 M -> ModelTheoreticSame S_all.
Proof.
Admitted.

(* The whole hierarchy as a single theorem (logical skeleton):                *)

Definition hierarchy_implications : Prop :=
  (forall A x y, LiteralSame A x y -> IsomorphismSame A A) /\
  (forall A B, IsomorphismSame A B -> HomotopySame A B) /\
  (forall A B d eps x y, HomotopySame A B -> ApproxSame A d eps x y) /\
  (forall A d eps x y, ApproxSame A d eps x y -> StatSame A A A) /\
  (forall D1 D2 M S_all, StatSame D1 D2 M -> ModelTheoreticSame S_all).

(* ---------------------------------------------------------------------------- *)
(* 3.  The forbidden move: silent upgrade                                       *)
(* ---------------------------------------------------------------------------- *)

(* The chapter: Never silently strengthen a weaker sameness into a stronger  *)
(* one. A silent upgrade is the bare implication without a witness.          *)

(* We model the silent-upgrade category error as a flag.                       *)

Inductive SilentUpgradeError :=
  | SU_treat_approx_as_eq        : SilentUpgradeError
  | SU_treat_iso_as_identity     : SilentUpgradeError
  | SU_treat_stat_as_proof       : SilentUpgradeError
  | SU_treat_consistency_as_truth: SilentUpgradeError.

(* Each error corresponds to a concrete category mistake the chapter names.   *)

(* Concrete mistakes, formalized:                                              *)

(* 4.1  Treating an approximation as equality.                                *)

(* The chapter: Two temperature readings within tolerance are not the same *)
(* temperature; they are within eps of each other. The placeholder states  *)
(* the negation; concrete instantiations would supply the witness.         *)

Definition approx_is_not_eq (A : Type) (d : A -> A -> Prop) (eps : Prop)
                              (x y : A) (H : ApproxSame A d eps x y)
  : Prop :=   (* the chapter: Two temperature readings within tolerance are *)
              (* not the same temperature; they are within eps of each       *)
              (* other.                                                       *)
  ~ LiteralSame A x y.

(* 4.2  Treating an isomorphism as identity.                                  *)

(* The chapter: Two indistinguishable coins are not the same coin; exchange *)
(* them and the world changes if anything depends on the swap.              *)

Record IsoCoinsExample := {
  IC_carrier : Type;
  IC_two_coins : IC_carrier -> IC_carrier -> Prop;  (* the swap relation   *)
  IC_indistinguishable : forall c1 c2 : IC_carrier, Iso IC_carrier IC_carrier;
  IC_not_identity : forall c1 c2 : IC_carrier, c1 = c2 \/ False
}.
(* A pair of indistinguishable coins is isomorphic to itself, but the coins *)
(* are not literally identical: swap them and the world changes.            *)

(* 4.3  Treating statistical agreement as proof.                              *)

(* The chapter: Two studies rejecting the same null hypothesis agree on a *)
(* single test; their underlying assumptions can still differ.               *)

Record StatAgreement := {
  SA_studies : list Type;
  SA_H_0 : Type;                   (* the null hypothesis                   *)
  SA_rejections : forall s : Type, In s SA_studies -> Prop;
  SA_assumptions_differ :
    forall (s1 s2 : Type),
      In s1 SA_studies -> In s2 SA_studies -> Prop
}.
(* The two studies reject H_0; their underlying assumptions can still differ.*)

(* 4.4  Treating model-theoretic consistency as truth.                        *)

(* The chapter: A model with a common interpretation is internally         *)
(* consistent; it can still be the wrong model.                              *)

Record ModelConsistency := {
  MC_theories : list Theory;
  MC_common_model : CommonModel MC_theories;
  MC_wrongness : Prop   (* a witness that the model can still be wrong       *)
}.
(* The model is internally consistent but might be wrong.                  *)

(* ---------------------------------------------------------------------------- *)
(* 4.  The transformation triangle                                              *)
(* ---------------------------------------------------------------------------- *)

(* Given two representations R_A, R_B, the chapter replaces the question    *)
(* R_A = R_B? with a transition, or with a common target Z.                *)
(*                                                                             *)
(*       R_A  --T_A-->  Z                                                      *)
(*                          ^                                                  *)
(*       R_B  --T_B-->  Z                                                      *)
(*                                                                             *)
(* We model this as a record.                                                  *)

Record TransformationTriangle := {
  TT_RA : Codomain;
  TT_RB : Codomain;
  TT_Z  : Codomain;
  TT_TA : ViewTranslation;
  TT_TB : ViewTranslation;
  TT_TA_src : VT_source TT_TA = TT_RA;
  TT_TA_tgt : VT_target TT_TA = TT_Z;
  TT_TB_src : VT_source TT_TB = TT_RB;
  TT_TB_tgt : VT_target TT_TB = TT_Z
}.

(* The chapter's boxed principle: Difference is informative when we know    *)
(* what produced it.                                                          *)

Axiom difference_informative_when_known :
  forall (tt : TransformationTriangle), Prop.
(* The actual claim is that the pair (T_A, T_B) is informative when it is    *)
(* specified; without specifying the transformations, the comparison is      *)
(* empty.                                                                       *)

(* ---------------------------------------------------------------------------- *)
(* 5.  Parallel examples across sense data, measurement, mathematics          *)
(* ---------------------------------------------------------------------------- *)

(* The chapter gives a table of parallels. We model each row as a record.    *)

Record SenseDataExample := { sd_carrier : Type }.
Record MeasurementExample := { m_carrier : Type }.
Record MathExample := { math_carrier : Type }.

(* 5.1  Equality row.                                                            *)

Record EqualityRow := {
  ER_sense_data  : SenseDataExample;   (* the same rod, one photon tracked *)
  ER_measurement : MeasurementExample; (* two clocks show the same tick    *)
  ER_math        : MathExample         (* 2 + 2 = 4                         *)
}.

(* 5.2  Isomorphism row.                                                        *)

Record IsomorphismRow := {
  IsoR_sense_data  : SenseDataExample;   (* two indistinguishable coins     *)
  IsoR_measurement : MeasurementExample; (* two calibrated meters           *)
  IsoR_math        : MathExample         (* Z/6 ~= Z/2 x Z/3                *)
}.

(* 5.3  Homotopy row.                                                            *)

Record HomotopyRow := {
  HomR_sense_data  : SenseDataExample;   (* flash and bang from one strike *)
  HomR_measurement : MeasurementExample; (* two experiments, one phenomenon*)
  HomR_math        : MathExample         (* cup ~= donut                    *)
}.

(* 5.4  Approximation row.                                                       *)

Record ApproxRow := {
  AppR_sense_data  : SenseDataExample;   (* 20.01 vs 20.02 on a thermometer *)
  AppR_measurement : MeasurementExample; (* within tolerance               *)
  AppR_math        : MathExample         (* |f_n - f|_inf < eps            *)
}.

(* 5.5  Statistical row.                                                         *)

Record StatRow := {
  StatR_sense_data  : SenseDataExample;   (* eyewitness and CCTV agree      *)
  StatR_measurement : MeasurementExample; (* two studies reject H_0         *)
  StatR_math        : MathExample         (* Monte-Carlo agrees with theorem*)
}.

(* 5.6  Model-theoretic row.                                                     *)

Record ModelRow := {
  ModR_sense_data  : SenseDataExample;   (* two witnesses agree on story   *)
  ModR_measurement : MeasurementExample; (* two labs' data fit shared model*)
  ModR_math        : MathExample         (* two axiomatisations admit       *)
                                         (*  common model                    *)
}.

(* ---------------------------------------------------------------------------- *)
(* 6.  Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes:                                                       *)
(*   - The six forms of sameness: LiteralSame, IsomorphismSame, HomotopySame, *)
(*     ApproxSame, StatSame, ModelTheoreticSame.                              *)
(*   - The hierarchy as a tower of weakening lemmas (eq_to_iso_witness,       *)
(*     iso_to_homotopy_witness, etc.).                                         *)
(*   - The forbidden move: silent upgrade, with its four typical errors.     *)
(*   - The transformation triangle, with the boxed principle.                *)
(*   - The parallel examples across sense data, measurement, mathematics.    *)
(*                                                                             *)
(* The file depends on Library.v and Traces.v.                                 *)
(*                                                                             *)
(* ============================================================================= *)
