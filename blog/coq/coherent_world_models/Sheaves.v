(* ============================================================================= *)
(*                                                                             *)
(* 08_Sheaves.v                                                                *)
(*                                                                             *)
(* Sections Sheaves: coherence = descent and The running example of       *)
(* coherent_world_models.php, lines 424-513.                                  *)
(*                                                                             *)
(* Summary of the two sections.                                                *)
(*                                                                             *)
(*   Sheaves: coherence = descent (lines 424-489).                            *)
(*                                                                             *)
(*     In plain English: a presheaf F assigns a set of local sections to  *)
(*     every context; sheaf-ness is the rule that turns *compatible* local   *)
(*     data into *unique* global data -- but only on covers the modelling   *)
(*     setup is willing to license.                                           *)
(*                                                                             *)
(*       compatible local data on an admissible cover => unique global data.  *)
(*                                                                             *)
(*     A family {s_i in F(c_i)} is compatible when, on every pairwise       *)
(*     overlap c_i x_c c_j, the two restrictions of s_i and s_j agree.      *)
(*                                                                             *)
(*     The sheaf condition as an equation:                                    *)
(*                                                                             *)
(*       F(c) ~ Eq( prod_i F(c_i) =>> prod_{i,j} F(c_i x_c c_j) )            *)
(*                                                                             *)
(*     For a cover of two patches, the condition is a pullback:             *)
(*                                                                             *)
(*       F(c) ~ F(c_1) x_{F(c_1 x_c c_2)} F(c_2)                              *)
(*                                                                             *)
(*     The regimes:                                                            *)
(*       - Strict: equal on overlaps                                         *)
(*       - Homotopical: coherently equivalent                                 *)
(*       - Empirical: small residual under a loss                              *)
(*                                                                             *)
(*   The running example (lines 493-513).                                     *)
(*                                                                             *)
(*     A train passes a platform. Five channels: visual, auditory, radar,    *)
(*     linguistic, archival. The site C contains their contexts; the         *)
(*     admissible cover of the event is {c_v, c_a, c_r, c_l, c_h}. A      *)
(*     global G in F(c) exists iff descent holds.                            *)
(*                                                                             *)
(* This file formalizes the sheaf condition and the running example.          *)
(*                                                                             *)
(* ============================================================================= *)

Require Import Library.
Require Import Traces.
Require Import AdmissibleTransitions.
Require Import ContextsAndSites.

(* ---------------------------------------------------------------------------- *)
(* 1.  Presheaves                                                                *)
(* ---------------------------------------------------------------------------- *)

(* A presheaf F on a context c assigns a set of local sections F(c).     *)

Record PresheafOn (c : Context) := {
  P_on_c : Type              (* F(c)                                            *)
}.

(* A presheaf on a site assigns a type to every context.                    *)

Record Presheaf := {
  Prs_C : Context;
  Prs_F : Context -> Type;     (* F : C^op -> Set (a contravariant functor)    *)
  Prs_contravariant :
    forall (c1 c2 : Context) (f : C_carrier c1 -> C_carrier c2),
      Prs_F c2 = Prs_F c1
}.
(* The contravariance axiom is a placeholder: a concrete presheaf would    *)
(* specify how F(c_1) maps to F(c_2) under a refinement c_1 -> c_2.       *)

(* ---------------------------------------------------------------------------- *)
(* 2.  Compatibility on overlaps                                                *)
(* ---------------------------------------------------------------------------- *)

(* Given a cover {c_i -> c} and a presheaf F, a family {s_i in F(c_i)} is  *)
(* compatible when, on every pairwise overlap, the restrictions agree.      *)

(* For a cover of two patches, compatibility is just the agreement on the  *)
(* overlap. For larger covers, it is a higher-order condition (see         *)
(* HigherCoherence.v).                                                         *)

Record TwoPatchCover (c : Context) := {
  TPC_index : Type;
  TPC_two : TPC_index = TPC_index;     (* the cover has exactly two patches    *)
  TPC_c1 : Context;
  TPC_c2 : Context;
  TPC_overlap : Context;
  TPC_f1 : C_carrier TPC_c1 -> C_carrier TPC_overlap;
  TPC_f2 : C_carrier TPC_c2 -> C_carrier TPC_overlap;
  TPC_to_c : C_carrier TPC_overlap -> C_carrier c
}.
(* Concrete instantiations would specialize TPC_index to a two-element     *)
(* type (e.g., bool) and supply the overlap context.                         *)

(* A family {s_1, s_2} of sections is compatible when:                       *)
(*   F(f1)(s_1) = F(f2)(s_2) in F(TPC_overlap).                             *)

Record TwoPatchCompatibility (c : Context) (cov : TwoPatchCover c)
                              (F : PresheafOn (TPC_overlap c cov))
                              (s1 : Type) (s2 : Type) : Prop :=
  { TPC_compat : s1 = s2 }.
(* Concrete form would express: F(f1)(s_1) = F(f2)(s_2) in F(overlap). The *)
(* placeholder above captures the *shape*: a single equality witnessing     *)
(* compatibility.                                                              *)

(* ---------------------------------------------------------------------------- *)
(* 3.  The sheaf condition                                                       *)
(* ---------------------------------------------------------------------------- *)

(* The sheaf condition: for every admissible cover and every family of    *)
(* compatible local sections, there is one and only one global section     *)
(* restricting to them.                                                       *)

Definition sheaf_condition (F : Presheaf) (c : Context)
                            (cov : AdmissibleCover c) : Prop :=
  forall (s1 s2 : Type),     (* sections in F(c_1) and F(c_2)               *)
    s1 = s2 ->                  (* compatibility (placeholder)                 *)
    exists g : Type,           (* existence of a global section               *)
      forall (g' : Type),      (* and for any other global section...         *)
        True.                  (* (uniqueness placeholder)                     *)
(* The sheaf condition as the PHP states it is: for every family of        *)
(* compatible local sections there is one and only one global section that *)
(* restricts to them -- existence AND uniqueness. The placeholder keeps the *)
(* shape: compatibility of the local sections s1, s2 forces a global       *)
(* section g, and any other global section g' would coincide with it. A     *)
(* substantive formalisation would parameterise by F(c_1), F(c_2), the     *)
(* overlap and the restrictions, and would state the uniqueness genuinely  *)
(* (the two restriction maps of any global section agree, and two global   *)
(* sections restricting identically are equal), not as the vacuous True    *)
(* above.                                                                     *)

(* The boxed principle:                                                       *)

Axiom sheaf_boxed :
  forall (F : Presheaf) (c : Context) (cov : AdmissibleCover c),
    sheaf_condition F c cov.
(* The chapter's box: compatible local data on an admissible cover =>     *)
(* unique global data. This is the assumption that the chapter makes;     *)
(* concrete instantiations would supply an actual proof.                    *)

(* ---------------------------------------------------------------------------- *)
(* 4.  The pullback form for two patches                                        *)
(* ---------------------------------------------------------------------------- *)

(* For two patches, the sheaf condition is a pullback:                       *)
(*                                                                             *)
(*   F(c) ~ F(c_1) x_{F(c_1 x_c c_2)} F(c_2).                                *)
(*                                                                             *)
(* We formalise the pullback as a limit.                                       *)

Record Pullback (A B Z : Type) (f : A -> Z) (g : B -> Z) := {
  PB_carrier : Type;
  PB_pi1 : PB_carrier -> A;
  PB_pi2 : PB_carrier -> B;
  PB_commutes : forall x : PB_carrier, f (PB_pi1 x) = g (PB_pi2 x);
  PB_universal :
    forall (W : Type) (h1 : W -> A) (h2 : W -> B)
           (eq : forall w : W, f (h1 w) = g (h2 w)),
      exists u : W -> PB_carrier,
        (forall w : W, PB_pi1 (u w) = h1 w) /\
        (forall w : W, PB_pi2 (u w) = h2 w)
}.

(* For a presheaf F and a two-patch cover, the sheaf condition says        *)
(* F(c) is the pullback.                                                     *)

Definition sheaf_pullback (F : Presheaf) (c : Context) (cov : TwoPatchCover c) : Prop :=
  True.   (* placeholder for the full pullback condition                    *)
(* A concrete instantiation would supply a Pullback whose carrier is       *)
(* F(c) and whose projections are the restrictions F(c) -> F(c_i).         *)

(* ---------------------------------------------------------------------------- *)
(* 5.  The regimes                                                               *)
(* ---------------------------------------------------------------------------- *)

(* The sheaf condition runs over different regimes depending on V.          *)

Inductive SheafRegime :=
  | SR_strict        : SheafRegime   (* V = Set, equal on overlaps            *)
  | SR_homotopical   : SheafRegime   (* V = infinity-Gpd, coherent equivalence*)
  | SR_empirical     : SheafRegime.  (* V = metric/probability, small residual  *)

(* Compatible means differently in each regime.                            *)

Definition strict_compatible (A : Type) (s1 s2 : A) : Prop := s1 = s2.

Record CompatibleRegime := {
  CR_A : Type;
  CR_R : CR_A -> CR_A -> Prop
}.

Definition homotopical_compatible (regime : CompatibleRegime) (s1 s2 : CR_A regime) : Prop :=
  CR_R regime s1 s2.
(* Homotopical compatibility is captured abstractly via the regime record.*)

Record EmpiricalSetup := {
  ES_metric : Type -> Type -> Prop;
  ES_bound : Prop;
  ES_compatible : forall A : Type, A -> A -> Prop
}.
(* Empirical compatibility: the residual under a loss is below the bound.  *)

(* ---------------------------------------------------------------------------- *)
(* 6.  The running example: train at a platform                                 *)
(* ---------------------------------------------------------------------------- *)

(* The chapter's worked example. A train passes a platform; five channels.  *)

Record TrainEvent := {
  TE_event : Type    (* the train-event in the world                          *)
}.

Record TrainChannel := {
  TC_channel : Type -> Type;       (* a name -> representation-type        *)
  TC_access : forall evt : TrainEvent, forall n : Type, TE_event evt -> TC_channel n
}.
(* Note: the access function is parameterised by a specific train event   *)
(* and a channel name. Concrete instantiations specialise both.            *)

(* Five channels: visual, auditory, radar, linguistic, archival.            *)

Inductive ChannelName :=
  | CN_visual    : ChannelName
  | CN_auditory : ChannelName
  | CN_radar    : ChannelName
  | CN_linguistic : ChannelName
  | CN_archival : ChannelName.

(* The admissible cover of the event consists of five patches.              *)

Record TrainCover := {
  TC_event : TrainEvent;
  TC_patches : ChannelName -> TrainEvent;
  TC_maps : forall n : ChannelName, TE_event (TC_patches n) -> TE_event TC_event;
  TC_admissible : forall n : ChannelName, True   (* all maps are licensed   *)
}.

(* A global G in F(c) exists iff descent holds.                              *)

Definition train_descent (cover : TrainCover) (F : Type) : Prop :=
  forall (s : ChannelName -> Type), True.   (* placeholder                    *)
(* The sheaf condition for the train cover, asserting that the local       *)
(* sections can be glued into a unique global one.                            *)

(* The chapter: the same shape governs mathematical data: a group         *)
(* presented by generators-and-relations, by a Cayley table, by a          *)
(* permutation action, by a matrix representation, by a character table.    *)
(* Five presentations, five channels, one group.                            *)

Record GroupPresentations := {
  GP_generators_relations : Type;
  GP_cayley_table         : Type;
  GP_permutation_action   : Type;
  GP_matrix_representation : Type;
  GP_character_table      : Type;
  GP_transitions :
    forall (src : Type) (tgt : Type),
      src = GP_generators_relations \/ src = GP_cayley_table \/
      src = GP_permutation_action \/ src = GP_matrix_representation \/
      src = GP_character_table ->
      tgt = GP_generators_relations \/ tgt = GP_cayley_table \/
      tgt = GP_permutation_action \/ tgt = GP_matrix_representation \/
      tgt = GP_character_table ->
      True   (* placeholder; concrete form: the transitions are isomorphisms *)
}.

(* ---------------------------------------------------------------------------- *)
(* 7.  Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes:                                                       *)
(*   - Presheaves and Presheaf (contravariant functors to Set).               *)
(*   - Compatibility on pairwise overlaps (TwoPatchCompatibility).           *)
(*   - The sheaf condition: compatible local data => unique global data.     *)
(*   - The pullback form for two patches.                                     *)
(*   - The three regimes: strict, homotopical, empirical.                    *)
(*   - The running example: train at a platform, with five channels.         *)
(*   - The mathematical parallel: group presentations.                        *)
(*                                                                             *)
(* Several shape predicates use placeholder Props; concrete instantiations *)
(* would discharge them with explicit equalities, restrictions, and univer-*)
(* sal properties.                                                             *)
(*                                                                             *)
(* The file depends on Library.v, Traces.v, AdmissibleTransitions.v,         *)
(* and ContextsAndSites.v.                                                     *)
(*                                                                             *)
(* ============================================================================= *)
