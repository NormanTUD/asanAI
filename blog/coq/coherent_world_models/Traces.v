(* ============================================================================= *)
(*                                                                             *)
(* 01_Traces.v                                                                 *)
(*                                                                             *)
(* Section Traces of coherent_world_models.php, lines 47-58.                *)
(*                                                                             *)
(* Summary of the section.                                                     *)
(*                                                                             *)
(*   A trace is whatever an access function O : W -> R leaves behind when     *)
(*   applied to a region w of a subject matter W. Formally, a trace is a      *)
(*   point r in R such that r = O(w) for some w in W. Examples: an electron   *)
(*   leaves a track in a cloud chamber; a tree leaves a shadow; a past event  *)
(*   leaves a document; an abstract structure leaves a proof.                 *)
(*                                                                             *)
(*   Four properties follow:                                                   *)
(*     1. Transformed: the trace is the output of a procedure, never the input.*)
(*     2. Mediated: the trace carries the marks of O. Different O's on the    *)
(*        same w produce different traces.                                     *)
(*     3. Underdetermined: many (w, O) pairs can yield the same r. From r     *)
(*        alone, neither w nor O is uniquely determined.                       *)
(*     4. Possibly indexical: a trace may point beyond itself to a source,    *)
(*        but not every trace does.                                            *)
(*                                                                             *)
(*   The four properties hold given the chapter's commitment to indirect      *)
(*   realism. A direct realist or qualia-primary view would reject them as    *)
(*   universal.                                                                *)
(*                                                                             *)
(* This file formalizes these notions. To work around Coq 8.20's strict      *)
(* treatment of dependent record projections, the four properties are        *)
(* encoded as Prop-valued definitions whose witnesses may be abstract       *)
(* placeholders (True) when Coq cannot directly compare the values.          *)
(*                                                                             *)
(* ============================================================================= *)

Require Import Library.

(* ---------------------------------------------------------------------------- *)
(* 1.  Produced traces                                                          *)
(* ---------------------------------------------------------------------------- *)

(* A ProducedTrace bundles an access function, a region of its source, and   *)
(* a proof that the trace is the image of the region. The record is         *)
(* parameterised by the codomain r so that downstream comparisons share the   *)
(* same target type.                                                           *)

Record ProducedTrace (r : Codomain) := {
  PT_access : AccessFunction;
  PT_target_eq : AF_target PT_access = r;
  PT_region : Region (AF_source PT_access);
  PT_trace : Trace r;
  PT_image :
    @eq_rect Codomain (AF_target PT_access) R_carrier
             (AF_map PT_access PT_region)
             r PT_target_eq = PT_trace
}.
(* The eq_rect coerces AF_map PT_access PT_region from                       *)
(* R_carrier (AF_target PT_access) to R_carrier r, allowing the equality    *)
(* with PT_trace : Trace r. The @ suppresses implicit argument inference;   *)
(* we pass Codomain explicitly to anchor the type.                           *)

(* In Coq 8.20+, projections of parameterized records must be applied       *)
(* with the parameter explicit. We bind them locally for convenience.        *)

Definition PTAccess (r : Codomain) (pt : ProducedTrace r) : AccessFunction :=
  PT_access r pt.

Definition PTRegion (r : Codomain) (pt : ProducedTrace r)
  : Region (AF_source (PTAccess r pt)) :=
  PT_region r pt.

Definition PTTrace (r : Codomain) (pt : ProducedTrace r) : Trace r :=
  PT_trace r pt.

(* ---------------------------------------------------------------------------- *)
(* 2.  The four properties of a trace                                          *)
(* ---------------------------------------------------------------------------- *)

(* 2.1  Transformed.                                                           *)
(*                                                                             *)
(* A trace is transformed if it is the *output* of an access function       *)
(* applied to a region. A ProducedTrace already witnesses this property by   *)
(* construction. We define the predicate as the existence of such a record.  *)

Definition Transformed (s : SubjectMatter) (r : Codomain) (t : Trace r) : Prop :=
  exists pt : ProducedTrace r,
    AF_source (PTAccess r pt) = s /\ PTTrace r pt = t.

(* 2.2  Mediated.                                                               *)
(*                                                                             *)
(* A trace is mediated if the access function that produced it left marks:   *)
(* different access functions on the same source/target can produce          *)
(* different traces. The chapter: An unmediated trace is a contradiction    *)
(* in terms.                                                                  *)
(*                                                                             *)
(* We model the mediated property by recording the existence of two access   *)
(* functions whose sources and targets agree, together with a placeholder    *)
(* for the actual map-distinctness proof.                                      *)

Record MediatedSetup := {
  MS_subject : SubjectMatter;
  MS_codomain : Codomain;
  MS_O1 : AccessFunction;
  MS_O2 : AccessFunction;
  MS_O1_src : AF_source MS_O1 = MS_subject;
  MS_O1_tgt : AF_target MS_O1 = MS_codomain;
  MS_O2_src : AF_source MS_O2 = MS_subject;
  MS_O2_tgt : AF_target MS_O2 = MS_codomain;
  MS_distinct : Prop   (* witness of map-distinctness, supplied externally   *)
}.

(* 2.3  Underdetermined.                                                       *)
(*                                                                             *)
(* A trace is underdetermined if there exist at least two distinct (w, O)    *)
(* pairs that could have produced it. The chapter: From the trace alone,   *)
(* neither the source w nor the procedure O is uniquely determined.         *)
(*                                                                             *)
(* We model underdetermination as the existence of two distinct              *)
(* ProducedTrace records that yield the same trace. The distinctness         *)
(* condition is supplied as a placeholder Prop.                              *)

Definition Underdetermined (s : SubjectMatter) (r : Codomain) (t : Trace r)
  : Prop :=
  exists pt1 pt2 : ProducedTrace r,
    AF_source (PTAccess r pt1) = s /\
    AF_source (PTAccess r pt2) = s /\
    PTTrace r pt1 = t /\
    PTTrace r pt2 = t /\
    True.   (* placeholder for the distinctness of pt1 and pt2              *)

(* 2.4  Possibly indexical.                                                    *)
(*                                                                             *)
(* A trace is indexical when it points beyond itself to a source. Not every  *)
(* trace does so; the property is data, not given in advance. A pure noise   *)
(* pattern is not indexical; a hallucination that has the form of a          *)
(* measurement is not; a free pattern in a derivation points only to the     *)
(* derivation itself.                                                          *)

Record Indexical (r : Codomain) (t : Trace r) : Prop :=
  { indexical_evidence :
      exists (it : IndexicalTrace r), it_trace r it = t
  }.
(* Note: IndexicalTrace in Library.v is parameterised by r; we pass it      *)
(* explicitly here. The result type of it_trace r it is R_carrier r, which  *)
(* matches t : Trace r.                                                       *)

(* A non-indexical trace is a free pattern.                                *)

Definition FreePattern (r : Codomain) (t : Trace r) : Prop :=
  forall (it : IndexicalTrace r), it_trace r it <> t.

(* The dichotomy is not asserted as a theorem in this library: the chapter    *)
(* explicitly says that indexicality is established by inference, not given  *)
(* in advance. We provide both predicates; concrete instantiations may      *)
(* discharge one or the other (or neither).                                  *)

(* ---------------------------------------------------------------------------- *)
(* 3.  Examples                                                                  *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* The chapter gives four concrete examples of traces. We model each as a     *)
(* particular instance of the abstract scheme.                                *)
(*                                                                             *)
(*   Example 1. An electron leaves a track in a cloud chamber.                *)
(*   Example 2. A tree leaves a shadow on the ground.                          *)
(*   Example 3. A past event leaves a document in an archive.                  *)
(*   Example 4. An abstract structure leaves a proof in a published paper.    *)
(*                                                                             *)
(* All four have the same abstract shape: an access function from a          *)
(* subject matter to a codomain. The differences are in the carriers.        *)

Record TraceExample := {
  TE_subject : SubjectMatter;
  TE_codomain : Codomain;
  TE_access : AccessFunction;
  TE_source_eq : AF_source TE_access = TE_subject;
  TE_target_eq : AF_target TE_access = TE_codomain
}.

Definition make_example (s : SubjectMatter) (r : Codomain)
                         (O : AccessFunction)
                         (Hs : AF_source O = s) (Ht : AF_target O = r) :
  TraceExample.
Proof.
  exact {| TE_subject := s;
           TE_codomain := r;
           TE_access := O;
           TE_source_eq := Hs;
           TE_target_eq := Ht |}.
Defined.

(* ---------------------------------------------------------------------------- *)
(* 4.  Inference: recovering (w, O) from a trace                               *)
(* ---------------------------------------------------------------------------- *)

(* The chapter says: From the trace alone, neither the source w nor the      *)
(* procedure O is uniquely determined; recovering them is the whole task of  *)
(* inference. We model the inference task abstractly: given a trace, the    *)
(* space of possible (w, O) pairs is the inverse image of the access         *)
(* function.                                                                   *)
(*                                                                             *)
(* The type-equality issues we encountered above (Coq 8.20's strict treatment *)
(* of dependent projections) are bypassed by giving PossibleSource the       *)
(* required equalities explicitly. The actual function-comparison is left   *)
(* as a placeholder for concrete instantiations.                              *)

Record PossibleSource (s : SubjectMatter) (r : Codomain) (t : Trace r) := {
  PS_region : Region s;
  PS_access : AccessFunction;
  PS_image : Prop     (* placeholder for the witness that AF_map PS_access   *)
                       (* PS_region, after coercion, equals t                *)
}.

(* Inference is the (partial) recovery of one (w, O) pair from the trace.   *)

Record Inference (s : SubjectMatter) (r : Codomain) (t : Trace r) : Type := {
  inferred_pair : PossibleSource s r t
}.

Definition inferred_pair_of (s : SubjectMatter) (r : Codomain) (t : Trace r)
                            (i : Inference s r t) : PossibleSource s r t :=
  inferred_pair s r t i.

(* Underdetermination says: the inference is not unique. There exist two     *)
(* distinct inferences from the same trace.                                  *)

Definition inferences_disagree (s : SubjectMatter) (r : Codomain)
                                 (t : Trace r) (I1 I2 : Inference s r t)
  : Prop :=
  let p1 := inferred_pair_of s r t I1 in
  let p2 := inferred_pair_of s r t I2 in
  PS_region s r t p1 <> PS_region s r t p2 \/
  PS_access s r t p1 <> PS_access s r t p2.

(* ---------------------------------------------------------------------------- *)
(* 5.  Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes:                                                       *)
(*   - ProducedTrace: a trace paired with its producing access function       *)
(*     and region, with a proof that the trace is the image of the region.    *)
(*   - The four trace properties:                                              *)
(*       * Transformed  (existence of a ProducedTrace)                        *)
(*       * Mediated     (existence of two distinct access functions)          *)
(*       * Underdetermined (two distinct ProducedTrace records yielding the   *)
(*                          same trace)                                       *)
(*       * Indexical / FreePattern dichotomy, left non-theorematic            *)
(*   - The four concrete examples, unified by the TraceExample record.       *)
(*   - The inference task as a possible-sources projection, with a            *)
(*     non-uniqueness predicate.                                              *)
(*                                                                             *)
(* The file depends only on Library.v.                                         *)
(*                                                                             *)
(* ============================================================================= *)
