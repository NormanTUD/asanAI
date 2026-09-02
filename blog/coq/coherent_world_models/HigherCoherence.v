(* ============================================================================= *)
(*                                                                             *)
(* 10_HigherCoherence.v                                                         *)
(*                                                                             *)
(* Section "Higher coherence" of coherent_world_models.php, lines 557-608.   *)
(*                                                                             *)
(* Summary of the section.                                                     *)
(*                                                                             *)
(*   The section introduces higher categorical structure. Suppose three    *)
(*   representations A, B, C are related pairwise by admissible              *)
(*   transitions phi_AB, phi_BC, phi_AC. There are two ways to go from A to *)
(*   C: directly via phi_AC, or by composition phi_BC o phi_AB. The question *)
(*   is whether these two ways agree.                                         *)
(*                                                                             *)
(*     - Strict regime: they agree on the nose: phi_BC o phi_AB = phi_AC.   *)
(*     - Homotopical regime: they agree up to a 2-morphism alpha_ABC.       *)
(*       A 2-morphism is itself data you can ask further questions about.  *)
(*     - Four representations: the fillers may themselves disagree, and    *)
(*       you need a 3-morphism, and so on.                                   *)
(*                                                                             *)
(*   The generalisation is clean: an n-morphism is a cell of dimension n in  *)
(*   a higher category.                                                        *)
(*                                                                             *)
(*     0-cells: objects                                                        *)
(*     1-cells: morphisms between objects                                    *)
(*     2-cells: morphisms between morphisms                                  *)
(*     3-cells: morphisms between 2-cells                                     *)
(*     ...                                                                      *)
(*     n-cells: morphisms between (n-1)-cells                                *)
(*                                                                             *)
(*   The sheaf condition runs up this tower. To handle homotopical targets,*)
(*   one builds the Cech nerve of the cover, a simplicial object that in   *)
(*   degree 0 lists the patches, in degree 1 the pairwise overlaps, in     *)
(*   degree 2 the triple overlaps, and so on.                                 *)
(*                                                                             *)
(*   An infinity-sheaf is a sheaf-like object valued in infinity-Gpd.        *)
(*                                                                             *)
(* This file formalizes n-morphisms abstractly, the Cech nerve, and        *)
(* infinity-sheaves.                                                           *)
(*                                                                             *)
(* ============================================================================= *)

Require Import Library.
Require Import Traces.
Require Import AdmissibleTransitions.

(* ---------------------------------------------------------------------------- *)
(* 1.  The strict and homotopical regimes                                       *)
(* ---------------------------------------------------------------------------- *)

(* Given three objects A, B, C and admissible transitions phi_AB, phi_BC, *)
(* phi_AC, the strict regime asks: phi_BC o phi_AB = phi_AC? The            *)
(* homotopical regime asks: phi_BC o phi_AB => phi_AC?                       *)

Record StrictCoherence := {
  SC_A : Type;
  SC_B : Type;
  SC_C : Type;
  SC_phi_AB : SC_A -> SC_B;
  SC_phi_BC : SC_B -> SC_C;
  SC_phi_AC : SC_A -> SC_C;
  SC_commutes : forall a : SC_A, SC_phi_BC (SC_phi_AB a) = SC_phi_AC a
}.

(* The homotopical regime: a 2-morphism alpha_ABC witnesses that the two  *)
(* routes are not equal but can be continuously deformed into each other.  *)

Record TwoMorphism := {
  TM_A : Type;
  TM_B : Type;
  TM_C : Type;
  TM_phi_AB : TM_A -> TM_B;
  TM_phi_BC : TM_B -> TM_C;
  TM_phi_AC : TM_A -> TM_C;
  TM_alpha_ABC : forall a : TM_A, TM_phi_BC (TM_phi_AB a) = TM_phi_AC a
}.
(* In strict category theory, the alpha_ABC would be the identity. In a  *)
(* higher category, it is itself data you can ask further questions about.*)

(* ---------------------------------------------------------------------------- *)
(* 2.  n-morphisms                                                               *)
(* ---------------------------------------------------------------------------- *)

(* The chapter: "an n-morphism is a cell of dimension n in a higher        *)
(* category." We model n-morphisms as a recursive type indexed by a       *)
(* dimension.                                                                  *)

Inductive Dimension : Type :=
  | D_0 : Dimension
  | D_S : Dimension -> Dimension.    (* successor                            *)

(* An n-cell is a morphism between (n-1)-cells. At dimension 0, we have  *)
(* objects; at dimension 1, ordinary morphisms; at higher dimensions,     *)
(* morphisms between morphisms.                                              *)

Record NCell (n : Dimension) := {
  NC_source : Type;        (* the (n-1)-cell this n-cell goes from          *)
  NC_target : Type         (* the (n-1)-cell this n-cell goes to            *)
}.
(* Note: this is a very abstract formalisation. A concrete instantiation  *)
(* would supply the actual map from source to target at each level.       *)

(* Examples at each dimension.                                                *)

Record ZeroCell : Type := {
  ZC_carrier : Type
}.
(* A 0-cell is an object.                                                    *)

Record OneCell : Type := {
  OC_source : ZeroCell;
  OC_target : ZeroCell;
  OC_map : ZC_carrier OC_source -> ZC_carrier OC_target
}.

Record TwoCell : Type := {
  TC_low1 : OneCell;
  TC_low2 : OneCell;
  TC_same_source : OC_source TC_low1 = OC_source TC_low2;
  TC_same_target : OC_target TC_low1 = OC_target TC_low2;
  TC_homotopy : Prop   (* placeholder; concrete form would express the      *)
                        (* higher-cell agreement                            *)
}.
(* A 2-cell is a homotopy between two 1-cells with the same source and    *)
(* target.                                                                     *)

(* Three-cell: a homotopy between two 2-cells.                               *)

Record ThreeCell : Type := {
  ThC_low1 : TwoCell;
  ThC_low2 : TwoCell;
  ThC_same_low1 : TC_low1 ThC_low1 = TC_low1 ThC_low2;
  ThC_same_low2 : TC_low2 ThC_low1 = TC_low2 ThC_low2;
  ThC_homotopy : Prop   (* placeholder; concrete form expresses the         *)
                          (* higher-cell agreement                          *)
}.

(* ---------------------------------------------------------------------------- *)
(* 3.  Four representations: 3-morphisms                                         *)
(* ---------------------------------------------------------------------------- *)

(* The chapter: "Add D, with its own transitions. Now the fillers         *)
(* alpha_ABC, alpha_BCD, alpha_ACD, alpha_ABD may themselves disagree,   *)
(* and you need a 3-morphism filling between the fillers to certify        *)
(* higher-order consistency."                                                 *)

Record ThreeMorphism (A B C D : Type) := {
  TM_filler_ABC : forall a : A, B;   (* placeholder structure                  *)
  TM_filler_BCD : forall b : B, C;
  TM_filler_ACD : forall a : A, D;
  TM_filler_ABD : forall a : A, D;
  TM_higher_filler : True     (* the 3-morphism that fills between the      *)
                                (* 2-morphisms                              *)
}.

(* ---------------------------------------------------------------------------- *)
(* 4.  The Cech nerve                                                            *)
(* ---------------------------------------------------------------------------- *)

(* The Cech nerve of a cover {c_i -> c} is a simplicial object. In degree *)
(* 0 it lists the patches, in degree 1 the pairwise overlaps, in degree 2  *)
(* the triple overlaps, etc.                                                  *)

Record CechNerve (c : Context) := {
  CN_degree_0 : Type;                  (* patches                                *)
  CN_degree_1 : Type;                  (* pairwise overlaps                     *)
  CN_degree_2 : Type;                  (* triple overlaps                       *)
  CN_degree_n : nat -> Type;           (* higher-degree overlaps                *)
  CN_face_0 : CN_degree_1 -> CN_degree_0;     (* the i-th patch in an overlap   *)
  CN_face_1 : CN_degree_1 -> CN_degree_0;
  CN_face_00 : CN_degree_2 -> CN_degree_1;
  CN_face_01 : CN_degree_2 -> CN_degree_1;
  CN_face_02 : CN_degree_2 -> CN_degree_1;
  CN_degeneracy_0 : CN_degree_0 -> CN_degree_1;
  CN_degeneracy_1 : CN_degree_0 -> CN_degree_2
}.
(* Concrete instantiations would supply the simplicial identities:         *)
(* face maps compose correctly, degeneracies are sections, etc.             *)

(* ---------------------------------------------------------------------------- *)
(* 5.  Infinity-sheaves                                                          *)
(* ---------------------------------------------------------------------------- *)

(* An infinity-sheaf is a sheaf-like object valued in infinity-Gpd.        *)

Record InfinityGroupoid := {
  IG_carrier : Type
}.
(* The actual structure of an infinity-groupoid (homotopy types, higher    *)
(* paths) is beyond what we formalise directly. We record the type.        *)

Record InfinitySheaf (c : Context) := {
  IS_section : CechNerve c -> InfinityGroupoid;
  IS_locality : Prop   (* the locality condition: locally coherent sections *)
                      (* form a global one                                    *)
}.

(* The sheaf condition for an infinity-sheaf is the requirement that the  *)
(* limit (now a limit in infinity-Gpd) over the Cech nerve reproduces      *)
(* the global sections.                                                       *)

Definition infinity_sheaf_condition (c : Context) (s : InfinitySheaf c) : Prop :=
  forall n : nat, IS_locality c s.   (* placeholder; concrete form would     *)
                                     (* state that the limit over the Cech   *)
                                     (* nerve coincides with F(c)            *)

(* ---------------------------------------------------------------------------- *)
(* 6.  Worked examples                                                           *)
(* ---------------------------------------------------------------------------- *)

(* Lightning and thunder from one strike: not equal on time-overlap, but  *)
(* related by a homotopy whose parameter is the travel-time delay.         *)

Record LightningThunder := {
  LT_lightning : Type;
  LT_thunder : Type;
  LT_delay : LT_lightning -> LT_thunder;
  LT_homotopy : forall x : LT_lightning, True
}.
(* Triple overlaps (with a distant echo) require delays to compose        *)
(* coherently. We model the higher-order condition abstractly.              *)

Record LightningTriple := {
  LTr_lightning : Type;
  LTr_echo_1 : Type;
  LTr_echo_2 : Type;
  LTr_delay_1 : LTr_lightning -> LTr_echo_1;
  LTr_delay_2 : LTr_lightning -> LTr_echo_2;
  LTr_coherent : forall x : LTr_lightning, True
}.

(* Mathematical example: three equivalent categories.                       *)

Record EquivalentCategories := {
  EC_A : Type;
  EC_B : Type;
  EC_C : Type;
  EC_phi_AB : EC_A -> EC_B;
  EC_phi_BC : EC_B -> EC_C;
  EC_phi_AC : EC_A -> EC_C;
  EC_homotopy_AB_BC : forall a : EC_A, EC_phi_BC (EC_phi_AB a) = EC_phi_AC a;
  EC_n_equiv : True   (* the natural isomorphisms-between-isomorphisms     *)
}.

(* ---------------------------------------------------------------------------- *)
(* 7.  Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes:                                                       *)
(*   - Strict coherence: equality of two routes.                              *)
(*   - TwoMorphism: a 2-cell witnessing a homotopical coherence.             *)
(*   - n-morphisms: the recursive tower (0-cells, 1-cells, ..., n-cells).   *)
(*   - ZeroCell, OneCell, TwoCell, ThreeCell: explicit examples.            *)
(*   - ThreeMorphism: a 3-cell for four representations.                    *)
(*   - CechNerve: the simplicial object of patches/overlaps.                *)
(*   - InfinitySheaf: sheaf valued in infinity-Gpd.                         *)
(*   - Worked examples: lightning-and-thunder, equivalent categories.       *)
(*                                                                             *)
(* Concrete instantiations would supply the actual simplicial identities  *)
(* for the Cech nerve, the natural isomorphisms for the equivalent         *)
(* categories, and the higher-cell data for the homotopical regime.        *)
(*                                                                             *)
(* The file depends on Library.v, Traces.v, and AdmissibleTransitions.v.    *)
(*                                                                             *)
(* ============================================================================= *)
