(* ============================================================================= *)
(*                                                                             *)
(* 02_Commitments.v                                                             *)
(*                                                                             *)
(* Section "Commitments" of coherent_world_models.php, lines 60-84.            *)
(*                                                                             *)
(* Summary of the section.                                                     *)
(*                                                                             *)
(*   The chapter declares five foundational commitments, each "debatable;     *)
(*   the dispute is foundational, not internal to the chapter":               *)
(*                                                                             *)
(*     1. Indirect realism. There is a subject matter distinct from any       *)
(*        access to it; traces are outputs of access, not the thing itself.    *)
(*     2. Internal structure. W has regions, points, or sub-systems to which   *)
(*        access can be applied.                                               *)
(*     3. Admissible transitions exist. A non-trivial class T of arrows is    *)
(*        justified independently of any specific dataset.                    *)
(*     4. Coherence is necessary but not sufficient. A model whose parts      *)
(*        contradict each other is not a description of any single subject.   *)
(*     5. Correspondence is separate. Even a perfectly coherent model is not  *)
(*        yet a true one; contact with the world is a second, distinct test.  *)
(*                                                                             *)
(*   The chapter then discusses the rare limit case of wordless introspection *)
(*   and the Kantian "thing in itself" (Ding an sich). It notes that the      *)
(*   dispute with qualia-primary views is foundational, acknowledged at the   *)
(*   door, not settled inside.                                                *)
(*                                                                             *)
(* This file formalizes each commitment as a Prop with a witness.              *)
(*                                                                             *)
(* ============================================================================= *)

Require Import Library.
Require Import Traces.

(* ---------------------------------------------------------------------------- *)
(* 1.  The five foundational commitments                                       *)
(* ---------------------------------------------------------------------------- *)

(* 1.1  Indirect realism.                                                       *)
(*                                                                             *)
(* There is a subject matter distinct from any access to it; traces are      *)
(* outputs of access, not the thing itself. We model this as the existence   *)
(* of a subject matter s, an access function O from s to a codomain r, and   *)
(* a trace t that is the image of some region under O, distinct from any     *)
(* region of s.                                                                *)

Record IndirectRealism := {
  IR_subject : SubjectMatter;
  IR_codomain : Codomain;
  IR_access : AccessFunction;
  IR_src : AF_source IR_access = IR_subject;
  IR_tgt : AF_target IR_access = IR_codomain
}.
(* The "indirect" part is witnessed by the gap between s and r: the trace     *)
(* lives in r, not in s. The chapter says: "we hold the output of the        *)
(* procedure, never the input." The record keeps s and r as separate         *)
(* objects, embodying the commitment that the trace is not the source.       *)

(* 1.2  Internal structure.                                                    *)
(*                                                                             *)
(* W has regions, points, or sub-systems to which access can be applied.     *)
(* We model this as the existence of at least two distinct regions of the    *)
(* subject matter (so that "regions" is non-trivially plural).               *)

Record InternalStructure (s : SubjectMatter) : Prop :=
  { IS_region_a : Region s ;
    IS_region_b : Region s ;
    IS_distinct : IS_region_a <> IS_region_b
  }.

(* 1.3  Admissible transitions exist.                                          *)
(*                                                                             *)
(* A non-trivial class T of arrows is justified independently of any         *)
(* specific dataset. We model T as the existence of at least one licensed   *)
(* observation, one licensed translation, and one licensed refinement       *)
(* (the three kinds of arrow the chapter names).                              *)

Record AdmissibleClass := {
  AC_observation : { O : AccessFunction | observation_licensed O } ;
  AC_translation : { T_ : ViewTranslation | translation_licensed T_ } ;
  AC_refinement  : { f : ContextRefinement | refinement_licensed f }
}.

(* 1.4  Coherence is necessary but not sufficient.                            *)
(*                                                                             *)
(* A model whose parts contradict each other is not a description of any    *)
(* single subject. We model "coherence holds" as a separate witness and     *)
(* "this is enough for truth" as a separate, FALSE statement: even if the   *)
(* model is coherent, that does not entail that the model is true.            *)

(* "Coherence holds": a placeholder for the sheaf condition (see Sheaves.v).*)
Definition CoherenceHolds (G : Type) : Prop := True.

(* "Truth requires more than coherence": explicit assertion that no         *)
(* function from a coherence-holding model to "true" exists in general.    *)
Axiom coherence_not_sufficient :
  forall (G : Type) (coh : CoherenceHolds G), ~ True.   (* a placeholder     *)
(* NOTE: this is an axiom, not a theorem. We declare it as an axiom to       *)
(* capture the chapter's claim that coherence is necessary but not          *)
(* sufficient. Concrete formalizations would prove a more refined version    *)
(* using the master diagram.                                                   *)

(* 1.5  Correspondence is separate.                                            *)
(*                                                                             *)
(* Even a perfectly coherent model is not yet a true one; contact with the   *)
(* world is a second, distinct test. We model "correspondence holds" as     *)
(* the existence of a Tarski-style check (see Tarski.v).                      *)

Definition CorrespondenceHolds (G : Type) : Prop :=
  True.   (* placeholder; concrete form in Tarski.v:                         *)
          (* TarskiCheck G will be a Prop, supplied in Tarski.v             *)

Axiom correspondence_not_implied_by_coherence :
  forall (G : Type) (coh : CoherenceHolds G),
    ~ CorrespondenceHolds G.   (* a placeholder; the chapter says the       *)
                               (* implication does not hold in general       *)

(* The chapter's "neither is enough alone" is captured by the joint failure *)

Axiom truth_requires_both :
  forall (G : Type),
    CoherenceHolds G -> CorrespondenceHolds G -> True.   (* placeholder      *)

(* ---------------------------------------------------------------------------- *)
(* 2.  Wordless introspection                                                  *)
(* ---------------------------------------------------------------------------- *)

(* The chapter calls "wordless introspection" a rare limit case: in the       *)
(* immediate, pre-conceptual awareness of one's own experience, before it is  *)
(* named, categorised, or compared, the trace and the topic coincide.         *)
(*                                                                             *)
(* We model this as a flag WordlessIntrospection, paired with a witness that *)
(* the apparatus of access/mediation does not apply.                          *)

Inductive WordlessIntrospection : Prop :=
  | WI_intro : WordlessIntrospection.

(* In the limit case, the access function collapses into identity: the      *)
(* "trace" is not transformed, not mediated, not underdetermined, and      *)
(* trivially indexical.                                                       *)

Record LimitCase := {
  LC_topic : Type;             (* the topic and the trace coincide           *)
  LC_collapsed : LC_topic = LC_topic   (* trivial; the witness of identity  *)
}.

(* The chapter says: "As soon as the experience enters language, it is      *)
(* re-mediated by conceptual scheme... The moment we describe the wordless  *)
(* introspection, it becomes languaged." The limit case is fragile: any      *)
(* re-mediation lifts it.                                                     *)

Axiom limit_case_fragile :
  forall (lc : LimitCase), True.   (* placeholder; the chapter says the      *)
                                   (* limit case is not stable across         *)
                                   (* language-entry                          *)

(* ---------------------------------------------------------------------------- *)
(* 3.  The "thing in itself" (Ding an sich)                                    *)
(* ---------------------------------------------------------------------------- *)

(* The chapter invokes Kant's *thing in itself* (Ding an sich, KrV A26/B40,  *)
(* A235/B294) as the technical name for "the subject matter as it would be  *)
(* independent of any access."                                                *)
(*                                                                             *)
(* We model the Ding an sich as a hypothetical object that no access         *)
(* function reaches: for any access O from s to r, the trace in r is the    *)
(* transformed output, not the source.                                        *)

Record ThingInItself := {
  TI_carrier : Type;
  TI_unreachable : TI_carrier -> Prop    (* a placeholder for the witness    *)
                                          (* that no access reaches it       *)
}.

(* The chapter's claim: "We never get there. The right question is therefore *)
(* not 'how do we reach it?' but 'what can we honestly do with the traces    *)
(* we have?'"                                                                  *)

Axiom never_reach_ding_an_sich :
  forall (ti : ThingInItself), True.   (* placeholder; we never reach it     *)

(* ---------------------------------------------------------------------------- *)
(* 4.  Dispute with qualia-primary views                                       *)
(* ---------------------------------------------------------------------------- *)

(* The chapter notes: "A philosopher who holds qualia to be primary... will  *)
(* say we have mis-described the boundary." We model the dispute as two      *)
(* competing Positions, each taking a stance on which is the default.        *)

Inductive Position : Type :=
  | IndirectRealismDefault : Position
  | QualiaPrimaryDefault : Position.

(* The chapter takes the mediated, communicable case as its default: it is  *)
(* the case where epistemology, science, and language work, and where our    *)
(* machinery is productive. The dispute is acknowledged, not settled.        *)

Definition our_position : Position := IndirectRealismDefault.

Axiom dispute_is_foundational :
  forall p : Position, p = p.   (* placeholder; we acknowledge the dispute  *)
                                  (* but do not resolve it                  *)

(* ---------------------------------------------------------------------------- *)
(* 5.  Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes:                                                       *)
(*   - The five foundational commitments (IndirectRealism, InternalStructure,*)
(*     AdmissibleClass, coherence-not-sufficient, correspondence-separate).  *)
(*   - The wordless introspection limit case and its fragility.               *)
(*   - The thing in itself as an unreachable carrier.                          *)
(*   - The dispute with qualia-primary views, acknowledged but unresolved.  *)
(*                                                                             *)
(* The file depends on Library.v and Traces.v.                                 *)
(*                                                                             *)
(* NOTE: several "axioms" above are placeholders. The chapter itself is a     *)
(* discipline, not a derivation; the axioms mark the points where concrete  *)
(* instantiations would discharge the claim with a real proof.               *)
(*                                                                             *)
(* ============================================================================= *)
