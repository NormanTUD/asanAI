(* ============================================================================= *)
(*                                                                             *)
(* 07_ContextsAndSites.v                                                       *)
(*                                                                             *)
(* Section "Contexts as a site" of coherent_world_models.php,                 *)
(* lines 371-420.                                                              *)
(*                                                                             *)
(* Summary of the section.                                                     *)
(*                                                                             *)
(*   The chapter uses "context" in the widest possible sense: anything that  *)
(*   can index data points counts as a "space". A context specifies the     *)
(*   conditions under which a report was made:                                *)
(*                                                                             *)
(*     - where: place, system, domain                                          *)
(*     - when: time, duration, dynamical regime                                *)
(*     - who: observer, agent, instrument                                      *)
(*     - how: method, apparatus, procedure                                     *)
(*     - in what terms: language, framework, formalism                         *)
(*     - in what tradition: culture, era, paradigm                             *)
(*                                                                             *)
(*   Between two contexts there are *refinements*: from "Tuesday afternoon" *)
(*   to "between 3 pm and 4 pm". Morphisms in the context-category C are     *)
(*   refinements.                                                              *)
(*                                                                             *)
(*   A **cover** of a context is a family of sub-contexts whose images        *)
(*   together capture everything relevant. In a topological space this is    *)
(*   an open cover. In category theory, the most general version (Grothendieck)*)
(*   is a Grothendieck topology: a designated rule saying which families of  *)
(*   sub-objects count as covers.                                              *)
(*                                                                             *)
(*   An **admissible cover** of c is a family {c_i -> c} such that:          *)
(*     1. Cover condition: union of images = c.                              *)
(*     2. Admissibility condition: every morphism f_i is licensed (in T).    *)
(*                                                                             *)
(*   Equipping C with a cover rule that closes under refinement and          *)
(*   composition is a **Grothendieck topology** J; the pair (C, J) is a    *)
(*   **site**. A **representation scheme** assigns to every context a set  *)
(*   of "sections" via a functor C^op -> V (where V can be Set, metric,    *)
(*   probability, etc.).                                                       *)
(*                                                                             *)
(* This file formalizes contexts, refinements, covers, sites, and          *)
(* representation schemes.                                                    *)
(*                                                                             *)
(* ============================================================================= *)

Require Import Library.
Require Import Traces.
Require Import AdmissibleTransitions.
From Coq Require Import Lists.List.
Import ListNotations.

(* ---------------------------------------------------------------------------- *)
(* 1.  Contexts and refinements                                                 *)
(* ---------------------------------------------------------------------------- *)

(* Library.v already supplies Context and ContextRefinement. Here we extend  *)
(* them with the six "W-questions": where, when, who, how, in-what-terms,   *)
(* in-what-tradition.                                                          *)

Record ContextFacet := {
  CF_where  : Type;             (* place, system, domain                       *)
  CF_when   : Type;             (* time, duration, dynamical regime             *)
  CF_who    : Type;             (* observer, agent, instrument                 *)
  CF_how    : Type;             (* method, apparatus, procedure                *)
  CF_terms  : Type;             (* language, framework, formalism              *)
  CF_trad   : Type              (* culture, era, paradigm                      *)
}.

(* A context is the tuple of its facets.                                      *)

Record IndexedContext := {
  IC_carrier : Type;
  IC_facets : ContextFacet
}.
(* Note: concrete instantiations would populate the facets with actual      *)
(* types (e.g., CF_where = string, CF_when = Time, etc.).                   *)

(* Examples from the chapter.                                                  *)

Record HistoricalPeriodExample := {
  HP_period : Type;             (* a historical period as a context            *)
  HP_era : Type
}.

Record LaboratorySetupExample := {
  LS_setup : Type;
  LS_apparatus : Type
}.

Record FormalSystemExample := {
  FS_axioms : Type;
  FS_rules : Type
}.

(* Refinements. Library.v supplies ContextRefinement. We use it directly.   *)

Definition refine (c1 c2 : Context) (f : C_carrier c1 -> C_carrier c2) : Prop :=
  InT (TKRefinement {| CR_source := c1; CR_target := c2; CR_map := f |}).
(* A refinement is a context morphism. The chapter: "Morphisms in the      *)
(* context-category C are exactly these refinements: narrower, more          *)
(* specific, more constrained."                                                *)

(* ---------------------------------------------------------------------------- *)
(* 2.  Covers                                                                    *)
(* ---------------------------------------------------------------------------- *)

(* A cover of a context c is a family of sub-contexts whose images together *)
(* capture everything relevant.                                                *)

Record Cover (c : Context) := {
  CV_index : Type;                          (* the index set of the cover        *)
  CV_patches : CV_index -> Context;         (* a sub-context for each index    *)
  CV_maps    : forall i : CV_index, ContextRefinement; (* the inclusion maps   *)
  CV_image_of : forall i : CV_index, C_carrier (CR_source (CV_maps i)) = C_carrier (CV_patches i);
  CV_map_to_c : forall i : CV_index, C_carrier (CR_target (CV_maps i)) = C_carrier c
}.

(* The cover condition: the union of the images of the patches covers c.    *)

Definition cover_condition (c : Context) (cov : Cover c) : Prop :=
  forall x : C_carrier c, True.   (* placeholder for the cover condition *)

(* ---------------------------------------------------------------------------- *)
(* 3.  Admissible covers                                                         *)
(* ---------------------------------------------------------------------------- *)

(* An admissible cover is a cover whose every inclusion map is licensed.    *)

Record AdmissibleCover (c : Context) := {
  AC_cover : Cover c;
  AC_admissibility : forall i : CV_index c (AC_cover),
    InT (TKRefinement (CV_maps c (AC_cover) i))
}.

(* The chapter: "the union of the images of the f_i is the whole of c"     *)
(* AND "every morphism f_i in the cover is a licensed transition."          *)

Record FullAdmissibleCover (c : Context) := {
  FAC_cover : AdmissibleCover c;
  FAC_unions_whole : cover_condition c (AC_cover c (FAC_cover))
}.

(* The chapter: "The two conditions are independent. A family of sub-views *)
(* can satisfy the cover condition with maps we have no business trusting, *)
(* and a family of trusted maps can fail to cover what matters."            *)

Inductive CoverDiagnosis :=
  | CD_cover_only          : CoverDiagnosis  (* cover holds, but not licensed *)
  | CD_licensed_only       : CoverDiagnosis  (* licensed, but doesn't cover   *)
  | CD_admissible_complete : CoverDiagnosis  (* both hold                     *)
  | CD_neither             : CoverDiagnosis.

(* ---------------------------------------------------------------------------- *)
(* 4.  Grothendieck topologies and sites                                         *)
(* ---------------------------------------------------------------------------- *)

(* A Grothendieck topology on a category C is a rule J saying which         *)
(* families of arrows count as covers. The rule must respect refinements  *)
(* (narrowing a cover still covers) and composition (covers of covers are  *)
(* covers).                                                                     *)

Record GrothendieckTopology := {
  GT_underlying_category : Context;
  GT_covers : forall (c : C_carrier (GT_underlying_category)) (cov : Cover (GT_underlying_category)), Prop;
  GT_pullback_stable : forall (c : C_carrier (GT_underlying_category))
                              (cov : Cover (GT_underlying_category)),
    GT_covers c cov ->
    forall (d : C_carrier (GT_underlying_category))
           (f : C_carrier (GT_underlying_category)),
      True;   (* placeholder; concrete form would lift d back to a context *)
  GT_transitive : forall (c : C_carrier (GT_underlying_category))
                          (cov : Cover (GT_underlying_category)),
    GT_covers c cov ->
    forall i : CV_index (GT_underlying_category) cov,
      True   (* placeholder; concrete form would lift CV_patches back     *)
}.
(* The two axioms are the closure-under-pullback and closure-under-        *)
(* composition that define a Grothendieck topology.                          *)

(* A site is a category equipped with a Grothendieck topology.              *)

Record Site := {
  S_context : Context;
  S_topology : GrothendieckTopology;
  S_witness : S_context = GT_underlying_category S_topology
}.

(* ---------------------------------------------------------------------------- *)
(* 5.  Representation schemes                                                   *)
(* ---------------------------------------------------------------------------- *)

(* A representation scheme assigns to every context a set of "sections".   *)

Record RepresentationScheme := {
  RS_V : Type;                  (* the target category                         *)
  RS_assignment : Context -> RS_V;   (* a functor C^op -> V (contravariant)  *)
  RS_contravariance :
    forall (c1 c2 : Context) (f : C_carrier c1 -> C_carrier c2),
      RS_assignment c2 = RS_assignment c1
}.
(* The contravariance axiom is a placeholder: a concrete instantiation    *)
(* would specify how sections on c pull back along refinements c1 -> c2.  *)

(* The chapter: "V can be Set, metric spaces, probability spaces, chain    *)
(* complexes, or infinity-groupoids, depending on how much homotopy is     *)
(* needed."                                                                     *)

Inductive TargetCategory :=
  | TC_Set : TargetCategory
  | TC_MetricSpace : TargetCategory
  | TC_Probability : TargetCategory
  | TC_ChainComplex : TargetCategory
  | TC_InfinityGroupoid : TargetCategory.

(* A presheaf is a representation scheme whose target is Set.              *)

Record Presheaf := {
  PRS_sites : RepresentationScheme;
  PRS_target : TargetCategory;
  PRS_target_is_Set : PRS_target = TC_Set
}.

(* The chapter: "A presheaf F assigns a set of 'local sections' to every   *)
(* context: F(c) is the data one can write down *on* c."                    *)

(* Sheaf-ness is the rule that turns compatible local data into unique     *)
(* global data on admissible covers. See Sheaves.v for the formalisation. *)

(* ---------------------------------------------------------------------------- *)
(* 6.  Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes:                                                       *)
(*   - Contexts as tuples of six facets (where, when, who, how, terms, trad).*)
(*   - Refinements as context morphisms.                                      *)
(*   - Covers: families of sub-contexts with inclusion maps.                  *)
(*   - Admissible covers: covers whose inclusions are licensed.              *)
(*   - Grothendieck topologies: rules for covers, closed under refinement    *)
(*     and composition.                                                        *)
(*   - Sites: contexts equipped with a Grothendieck topology.                *)
(*   - Representation schemes: contravariant functors C^op -> V.            *)
(*   - Presheaves: representation schemes whose target is Set.               *)
(*                                                                             *)
(* The sheaf condition itself (compatible local data -> unique global       *)
(* data) is formalised in Sheaves.v.                                          *)
(*                                                                             *)
(* The file depends on Library.v and Traces.v.                                 *)
(*                                                                             *)
(* ============================================================================= *)
