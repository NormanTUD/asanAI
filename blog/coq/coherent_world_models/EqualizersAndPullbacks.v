(* ============================================================================= *)
(*                                                                             *)
(* 09_EqualizersAndPullbacks.v                                                  *)
(*                                                                             *)
(* Sections Equalizers: where two maps agree and Pullbacks: agreement    *)
(* through a shared target of coherent_world_models.php, lines 517-553.     *)
(*                                                                             *)
(* Summary of the two sections.                                                *)
(*                                                                             *)
(*   Equalizers (lines 517-537).                                               *)
(*                                                                             *)
(*     Given parallel maps f, g : X =>> Y, the equalizer selects the part   *)
(*     of X on which they agree:                                              *)
(*                                                                             *)
(*       E --e--> X ==f,g==> Y                                                 *)
(*                                                                             *)
(*     In Set, E = {x in X : f(x) = g(x)}. In an (infinity,1)-category the  *)
(*     equalizer is a space of paths of agreement.                           *)
(*                                                                             *)
(*   Pullbacks (lines 541-553).                                                *)
(*                                                                             *)
(*     Given f : X -> Z and g : Y -> Z, the pullback X x_Z Y is the object  *)
(*     of agreements: pairs (x, y) such that f(x) = g(y).                    *)
(*                                                                             *)
(*       X x_Z Y --pi_X--> X                                                  *)
(*                |                |                                          *)
(*                | pi_Y          | f                                        *)
(*                v                v                                          *)
(*                Y -------g------> Z                                         *)
(*                                                                             *)
(*     The pullback IS the object of agreements. The chapter: Visual and   *)
(*     radar tracks pull back over a calibrated position-time space to      *)
(*     give the pairs that could be the same train.                         *)
(*                                                                             *)
(* This file formalizes equalizers and pullbacks.                            *)
(*                                                                             *)
(* ============================================================================= *)

Require Import Library.
Require Import Traces.

(* ---------------------------------------------------------------------------- *)
(* 1.  Equalizers                                                                *)
(* ---------------------------------------------------------------------------- *)

(* Given parallel maps f, g : X =>> Y, the equalizer E selects the part of *)
(* X on which f and g agree. We model E as a record with a witness of the  *)
(* agreement.                                                                   *)

Record Equalizer (X Y : Type) (f g : X -> Y) := {
  EQ_carrier : Type;                  (* the agreement locus                    *)
  EQ_inclusion : EQ_carrier -> X;
  EQ_commutes : forall x : EQ_carrier, f (EQ_inclusion x) = g (EQ_inclusion x);
  EQ_universal : forall (W : Type) (h : W -> X)
                       (H : forall w : W, f (h w) = g (h w)),
    exists u : W -> EQ_carrier,
      forall w : W, EQ_inclusion (u w) = h w
}.

(* In Set, the explicit form is the set of points of X where f and g agree. *)

Definition set_equalizer (X Y : Type) (f g : X -> Y) : Type :=
  { x : X | f x = g x }.
(* This is the explicit, naive equalizer in Set. The Equalizer record above*)
(* is the categorical version (with the universal property).               *)

(* A worked example: two thermometers over time.                            *)

Record TwoThermometersExample := {
  TTE_X : Type;                     (* time                                    *)
  TTE_Y : Type;                     (* temperature readings                    *)
  TTE_f : TTE_X -> TTE_Y;           (* thermometer 1's reading                *)
  TTE_g : TTE_X -> TTE_Y;           (* thermometer 2's reading                *)
  TTE_equalizer : Equalizer TTE_X TTE_Y TTE_f TTE_g
}.

(* The chapter: Two thermometers report a temperature over time: the      *)
(* equalizer is the times at which they agree exactly.                    *)

Definition times_of_agreement (e : TwoThermometersExample) : Type :=
  EQ_carrier (TTE_X e) (TTE_Y e) (TTE_f e) (TTE_g e) (TTE_equalizer e).
(* The equalizer's carrier is exactly the times at which thermometer 1     *)
(* and thermometer 2 agree: the agreement locus.                           *)

(* A second worked example: two proofs of the same theorem produce numeric  *)
(* outputs by two different routes.                                          *)

Record TwoProofsExample := {
  TPE_inputs : Type;                (* the inputs                              *)
  TPE_outputs : Type;               (* the numeric outputs                     *)
  TPE_p1 : TPE_inputs -> TPE_outputs;
  TPE_p2 : TPE_inputs -> TPE_outputs;
  TPE_equalizer : Equalizer TPE_inputs TPE_outputs TPE_p1 TPE_p2
}.

(* In an (infinity,1)-category, the equalizer is a space of paths of        *)
(* agreement. We model this abstractly.                                       *)

Record HomotopicalEqualizer (X Y : Type) (f g : X -> Y) := {
  HE_carrier : Type;
  HE_paths : HE_carrier -> X;
  HE_agreement : forall x : HE_carrier, f (HE_paths x) = g (HE_paths x);
  HE_homotopies :
    forall (x : HE_carrier) (p : f (HE_paths x) = g (HE_paths x)),
      p = HE_agreement x
}.
(* The HE_homotopies field witnesses that any two proofs of agreement are   *)
(* themselves equal -- this is the higher-cell content.                      *)

(* ---------------------------------------------------------------------------- *)
(* 2.  Pullbacks                                                                  *)
(* ---------------------------------------------------------------------------- *)

(* Given f : X -> Z and g : Y -> Z, the pullback X x_Z Y is the object of *)
(* pairs (x, y) with f(x) = g(y).                                              *)

Record PullbackGeneral (X Y Z : Type) (f : X -> Z) (g : Y -> Z) := {
  PB_carrier : Type;
  PB_pi1 : PB_carrier -> X;
  PB_pi2 : PB_carrier -> Y;
  PB_commutes : forall z : PB_carrier, f (PB_pi1 z) = g (PB_pi2 z);
  PB_universal : forall (W : Type) (h1 : W -> X) (h2 : W -> Y)
                       (eq : forall w : W, f (h1 w) = g (h2 w)),
    exists u : W -> PB_carrier,
      (forall w : W, PB_pi1 (u w) = h1 w) /\
      (forall w : W, PB_pi2 (u w) = h2 w)
}.

(* In Set, the explicit form is the sigma type of pairs with matching     *)
(* images.                                                                     *)

Definition set_pullback (X Y Z : Type) (f : X -> Z) (g : Y -> Z) : Type :=
  { p : X * Y | f (fst p) = g (snd p) }.

(* A worked example: visual and radar tracks pull back over a calibrated  *)
(* position-time space.                                                       *)

Record TwoTracksExample := {
  TTE_V : Type;                     (* visual track                            *)
  TTE_R : Type;                     (* radar track                             *)
  TTE_PT : Type;                    (* calibrated position-time space         *)
  TTE_to_PT_v : TTE_V -> TTE_PT;
  TTE_to_PT_r : TTE_R -> TTE_PT;
  TTE_pullback : PullbackGeneral TTE_V TTE_R TTE_PT TTE_to_PT_v TTE_to_PT_r
}.

(* A second worked example: two definitions of prime pull back over Z    *)
(* to the integers on which both definitions coincide.                       *)

Record TwoPrimeDefinitions := {
  TPD_Z : Type;                     (* the integers                            *)
  TPD_prime_1 : TPD_Z -> Prop;     (* first primality criterion               *)
  TPD_prime_2 : TPD_Z -> Prop;     (* second primality criterion              *)
  TPD_carrier : Type;               (* the integers on which both agree       *)
  TPD_in_1 : TPD_carrier -> TPD_Z;
  TPD_in_2 : TPD_carrier -> TPD_Z;
  TPD_agrees : forall n : TPD_carrier,
                 TPD_prime_1 (TPD_in_1 n) <-> TPD_prime_2 (TPD_in_2 n)
}.

(* ---------------------------------------------------------------------------- *)
(* 3.  Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes:                                                       *)
(*   - Equalizers as categorical limits, with the universal property.       *)
(*   - The set-level form of equalizers: {x in X : f(x) = g(x)}.              *)
(*   - The thermometer and proofs-of-the-same-theorem examples.              *)
(*   - Homotopical equalizers with the higher-cell content.                  *)
(*   - Pullbacks as categorical limits, with the universal property.        *)
(*   - The set-level form of pullbacks: {(x, y) : f(x) = g(y)}.               *)
(*   - The two-tracks and two-prime-definitions examples.                    *)
(*                                                                             *)
(* The Equalizer and PullbackGeneral records carry both the carrier and the *)
(* universal property, so they can be specialised to Set, metric spaces,   *)
(* probability spaces, or infinity-groupoids (the universal property is    *)
(* independent of the underlying category).                                  *)
(*                                                                             *)
(* The file depends on Library.v and Traces.v.                                 *)
(*                                                                             *)
(* ============================================================================= *)
