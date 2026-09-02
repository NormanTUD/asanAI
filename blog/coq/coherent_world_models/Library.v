(* ============================================================================= *)
(*                                                                             *)
(* 00_Library.v                                                                *)
(*                                                                             *)
(* Shared library for the formalization of                                     *)
(* From World to Model: Coherent Representation                              *)
(* (coherent_world_models.php).                                                *)
(*                                                                             *)
(* This file defines the most basic types and notions that later files depend  *)
(* on. Every other file in this directory either imports this one or extends   *)
(* the conventions established here.                                            *)
(*                                                                             *)
(* Conventions used throughout:                                                 *)
(*   * Subject matter : a type W with internal structure                     *)
(*   * Access function: O : W -> R, producing traces                         *)
(*   * Representation: a value living in some codomain R or F(c)             *)
(*   * Admissible transition: an arrow belonging to a class T                *)
(*   * Sameness relations are encoded as explicit predicates with witnesses *)
(*                                                                             *)
(* We deliberately keep the formalization at the level of plain type theory    *)
(* plus a few higher-order predicates. Infinity-categorical content is        *)
(* captured by explicit homotopy and n-morphism predicates rather than     *)
(* by literal higher inductive types, since the chapter itself uses the        *)
(* latter only metaphorically.                                                  *)
(*                                                                             *)
(* ============================================================================= *)

From Coq Require Import Lists.List.
Import ListNotations.

(* ---------------------------------------------------------------------------- *)
(* 1.  Subject matters, regions, codomains                                      *)
(* ---------------------------------------------------------------------------- *)

(* A subject matter W is any type with internal structure (regions, points,    *)
(* sub-systems). We do not commit to a particular kind of internal structure: *)
(* the chapter leaves it open whether W is a set, a topological space, a      *)
(* groupoid, or anything else. We only need W to be a type.                    *)

Record SubjectMatter := {
  W_carrier : Type
}.

(* A region of a subject matter is any element of the carrier type. We do  *)
(* not axiomatize which subsets qualify as regions; the chapter notes that    *)
(* regions, points, or sub-systems is intentionally broad.                 *)

Definition Region (s : SubjectMatter) : Type := W_carrier s.

(* A codomain R is the type in which traces land. We allow R to be any type: *)
(* a set, a metric space, an infinity-groupoid, etc.                         *)

Record Codomain := {
  R_carrier : Type
}.

(* A trace is an element of a codomain R. *)

Definition Trace (r : Codomain) : Type := R_carrier r.

(* ---------------------------------------------------------------------------- *)
(* 2.  Access functions                                                         *)
(* ---------------------------------------------------------------------------- *)

(* An access function O : W -> R maps a region w of the subject matter to a   *)
(* trace r in the codomain. The chapter calls such a map observation arrow  *)
(* and requires that such an arrow belong to T to be licensed. Membership  *)
(* in T is a separate, additional property, defined later.                    *)

Record AccessFunction := {
  AF_source : SubjectMatter;
  AF_target : Codomain;
  AF_map    : W_carrier AF_source -> R_carrier AF_target
}.

(* ---------------------------------------------------------------------------- *)
(* 3.  Admissible transitions ----------------------------------------------------*)
(* ---------------------------------------------------------------------------- *)

(* The class T of admissible transitions is the key licence machinery.        *)
(* Membership of an arrow in T is justified independently of any data it is  *)
(* later applied to. We model T as a predicate on access functions and on    *)
(* inter-representation maps.                                                 *)

(* The chapter considers three kinds of admissible transition:                *)
(*   (1) observations W -> R_i                                                *)
(*   (2) view-to-view translations R_i -> R_j                                 *)
(*   (3) context refinements Hom(C)                                          *)

(* We model each kind as a separate predicate, joined into T by union.       *)

(* (1) An observation is licensed. *)
Definition observation_licensed (O : AccessFunction) : Prop :=
  (* Membership in T is a marker justified by the modelling setup. We leave   *)
  (* the justification open; the chapter only requires that licence be         *)
  (* recorded, not that it be derivable from nothing.                          *)
  True.

(* (2) A view-to-view translation. We encode it as an arbitrary function      *)
(* between two codomains, with a licence predicate on the pair.              *)

Record ViewTranslation := {
  VT_source : Codomain;
  VT_target : Codomain;
  VT_map    : R_carrier VT_source -> R_carrier VT_target
}.

Definition translation_licensed (T_ : ViewTranslation) : Prop :=
  True.

(* (3) Context refinements. We model contexts as elements of a small type    *)
(* and refinements as functions between them.                                *)

Record Context := {
  C_carrier : Type
}.

Record ContextRefinement := {
  CR_source : Context;
  CR_target : Context;
  CR_map    : C_carrier CR_source -> C_carrier CR_target
}.

Definition refinement_licensed (f : ContextRefinement) : Prop :=
  True.

(* The whole class T is the disjunction of the three licences.               *)

Inductive TransitionKind :=
  | TKObservation : AccessFunction -> TransitionKind
  | TKTranslation : ViewTranslation -> TransitionKind
  | TKRefinement  : ContextRefinement -> TransitionKind.

(* An admissible transition is a transition whose carrier is licensed.       *)

Inductive AdmissibleTransition : TransitionKind -> Prop :=
  | AT_Observation :
      forall O, observation_licensed O ->
                AdmissibleTransition (TKObservation O)
  | AT_Translation :
      forall T_, translation_licensed T_ ->
                 AdmissibleTransition (TKTranslation T_)
  | AT_Refinement :
      forall f, refinement_licensed f ->
                AdmissibleTransition (TKRefinement f).

(* A useful abbreviation: T denotes the set of all admissible transitions   *)
(* of any of the three kinds.                                                  *)

Definition T (k : TransitionKind) : Prop := AdmissibleTransition k.

(* ---------------------------------------------------------------------------- *)
(* 4.  Representations                                                          *)
(* ---------------------------------------------------------------------------- *)

(* A representation R_i is just an element living in some codomain. The       *)
(* master diagram of the chapter reads: W --O_i--> R_i --T_i--> G.            *)

Record Representation := {
  Rep_codomain : Codomain;
  Rep_value    : R_carrier Rep_codomain
}.

(* ---------------------------------------------------------------------------- *)
(* 5.  Sameness relations                                                       *)
(*                                                                             *)
(* The chapter's central discipline is the hierarchy of sameness relations.    *)
(* We encode each level as a predicate with an explicit witness.               *)
(* ---------------------------------------------------------------------------- *)

(* 5.1  Equality (literal sameness). The witness is a proof of equality.      *)

Definition Same (A : Type) (x y : A) : Prop := x = y.

(* 5.2  Isomorphism. The witness is an invertible map.                       *)

Record Iso (A B : Type) : Type := {
  iso_to   : A -> B;
  iso_from : B -> A;
  iso_to_from : forall b, iso_to (iso_from b) = b;
  iso_from_to : forall a, iso_from (iso_to a) = a
}.

Definition Isomorphic (A B : Type) : Type := Iso A B.

(* 5.3  Homotopy equivalence. The witness is a deformation that can be        *)
(* undone up to coherent cells. At the level of plain set theory, we model    *)
(* this as: there exist functions f, g and homotopies H, K.                    *)

Record HomotopyEquiv (A B : Type) : Type := {
  he_to   : A -> B;
  he_from : B -> A;
  he_homotopy_to   : forall a, he_from (he_to a) = a;
  he_homotopy_from : forall b, he_to (he_from b) = b
}.

Definition Homotopic (A B : Type) : Type := HomotopyEquiv A B.

(* A weaker, more homotopically-flavored version: allow the equalities to    *)
(* themselves be paths up to higher cells. We model the higher cells as       *)
(* separate fillers whose existence is left abstract.                       *)

Inductive HigherPath : forall (A : Type), A -> A -> Prop :=
  | hp_intro : forall (A : Type) (x y : A), x = y -> HigherPath A x y.

(* 5.4  Approximation. The witness is a quantified bound.                    *)

Record Approx (A : Type) (d : A -> A -> Prop) (eps : Prop) (x y : A) : Prop
  := { approx_bound : d x y }.

(* 5.5  Statistical agreement. The witness is a likelihood under a model.    *)

Inductive StatisticalAgreement (D1 D2 M : Type) : Prop :=
  | sa_intro : (* P(D1, D2 | M) high *) True -> StatisticalAgreement D1 D2 M.

(* 5.6  Model-theoretic compatibility. The witness is a common model.         *)

Record Model := {
  Model_carrier : Type
}.

Record Theory := {
  Theory_signature : Type;
  Theory_models : Model -> Prop
}.

Record CommonModel (S_all : list Theory) : Type := {
  cm_model : Model;
  cm_satisfies : forall t, In t S_all -> Theory_models t cm_model
}.

(* ---------------------------------------------------------------------------- *)
(* 6.  Hierarchy of sameness                                                    *)
(* ---------------------------------------------------------------------------- *)

(* The chapter's hierarchy:                                                   *)
(*   =   (literal)                                                             *)
(*   v   (implies)                                                             *)
(*   ~=  (isomorphism)                                                         *)
(*   v                                                                            *)
(*   ~   (homotopy equivalence)                                                *)
(*   v                                                                            *)
(*   <=eps (approximation)                                                     *)
(*   v                                                                            *)
(*   P high (statistical)                                                      *)
(*   v                                                                            *)
(*   exists M (model-theoretic)                                                *)
(*                                                                             *)
(* Each implication is a weakening: a witness of the stronger relation is   *)
(* a witness of the weaker one. We give one such weakening here for           *)
(* illustration; the others are defined similarly.                            *)

(* From equality to isomorphism: a proof of equality lifts to an identity     *)
(* isomorphism.                                                               *)

Lemma eq_to_iso : forall (A : Type) (x y : A),
    x = y -> Iso A A.
Proof.
  intros A x y _.
  exact {| iso_to := id; iso_from := id;
          iso_to_from := fun _ => eq_refl;
          iso_from_to := fun _ => eq_refl |}.
Qed.

(* From isomorphism to homotopy equivalence.                                  *)

Lemma iso_to_homotopy : forall (A B : Type),
    Iso A B -> HomotopyEquiv A B.
Proof.
  intros A B f.
  destruct f as [to from to_from from_to].
  exact {| he_to := to; he_from := from;
          he_homotopy_to := from_to;
          he_homotopy_from := to_from |}.
Qed.

(* ---------------------------------------------------------------------------- *)
(* 7.  Indexicality                                                             *)
(* ---------------------------------------------------------------------------- *)

(* The chapter distinguishes genuinely of something from free pattern.    *)
(* A trace may or may not be indexical; the property is data.                *)

Record IndexicalTrace (R : Codomain) := {
  it_trace : Trace R;
  it_points_to : Type;    (* a possible source the trace points to          *)
  it_is_of : it_points_to -> Prop   (* the substantive relation               *)
}.

(* A non-indexical trace is just a pattern.                                 *)

Definition FreePattern (R : Codomain) : Type := Trace R.

(* ---------------------------------------------------------------------------- *)
(* 8.  Convenience abbreviations                                               *)
(* ---------------------------------------------------------------------------- *)

(* The chapter uses W for subject matter, R for representation, T for         *)
(* admissible transitions. We expose short aliases.                          *)

Notation "'W'" := SubjectMatter.
Notation "'R'" := Codomain.
Notation "'Region' s" := (Region s) (at level 10).
Notation "'Trace' r" := (Trace r) (at level 10).

(* ---------------------------------------------------------------------------- *)
(* 9.  Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)

(* This library provides:                                                     *)
(*   - SubjectMatter, Region, Codomain, Trace                                  *)
(*   - AccessFunction, ViewTranslation, ContextRefinement                     *)
(*   - TransitionKind, AdmissibleTransition                                   *)
(*   - Same, Isomorphic, HomotopyEquiv, HigherPath, Approx,                   *)
(*     StatisticalAgreement, CommonModel                                       *)
(*   - Hierarchy weakenings (eq_to_iso, iso_to_homotopy)                       *)
(*   - IndexicalTrace, FreePattern                                            *)
(*                                                                             *)
(* Subsequent files build on this and add:                                    *)
(*   - ThreeDifferences   : world / channel / processing levels              *)
(*   - Ologs              : ontology logs                                     *)
(*   - Sheaves            : presheaves, sheaf condition                       *)
(*   - MasterDiagram      : the master W -> R_i -> G shape                   *)
(*   - Tarski             : Convention T                                      *)
(*   - ThreePathologies   : self-consistent fantasy, factbook, liar          *)
(*   - AILLM              : LLM applications                                  *)
(*                                                                             *)
(* ============================================================================= *)
