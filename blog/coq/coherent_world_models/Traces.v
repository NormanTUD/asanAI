(* ============================================================================= *)
(*                                                                             *)
(* 01_Traces.v                                                                 *)
(*                                                                             *)
(* Section "Traces" of coherent_world_models.php, lines 47-58.                *)
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
(* This file formalizes these notions.                                         *)
(*                                                                             *)
(* ============================================================================= *)

Require Import Library.

(* ---------------------------------------------------------------------------- *)
(* 1.  Traces and access functions                                              *)
(* ---------------------------------------------------------------------------- *)

(* A trace is just an element of a codomain R; it is an "image" of some      *)
(* region of the subject matter under some access function. We do not need  *)
(* to commit to the existence of such an image at this stage: the library   *)
(* already supplies Trace, Codomain, AccessFunction.                          *)

(* The chapter says a trace r is a point such that r = O(w) for some w.     *)
(* We model this as a record that bundles an access function O and a        *)
(* region w in its source; the trace is given as the value at w directly.    *)

Record ProducedTrace := {
  PT_access : AccessFunction;
  PT_region : Region (AF_source PT_access);
  PT_trace : R_carrier (AF_target PT_access);
  PT_image : AF_map PT_access PT_region = PT_trace
}.

(* ---------------------------------------------------------------------------- *)
(* 2.  The four properties of a trace                                          *)
(* ---------------------------------------------------------------------------- *)

(* 2.1  Transformed.                                                           *)
(*                                                                             *)
(* A trace is "transformed" if it is the *output* of an access function       *)
(* applied to a region. The chapter phrases this as "the trace is not w but *)
(* the result of an access procedure applied to w". A ProducedTrace already  *)
(* witnesses this property by construction: the trace is the image of a    *)
(* region under an access function. We define the predicate Transformed as  *)
(* the existence of such a record.                                            *)

Definition Transformed (r : Codomain) (t : Trace r) : Prop :=
  exists pt : ProducedTrace,
    PT_codomain pt = r /\ PT_trace pt = t.

(* 2.2  Mediated.                                                               *)
(*                                                                             *)
(* A trace is mediated if the access function that produced it left marks:   *)
(* different access functions on the same source/target can produce          *)
(* different traces. The chapter says: "An unmediated trace is a            *)
(* contradiction in terms."                                                  *)
(*                                                                             *)
(* We model the mediated property by saying: given a setup with a subject   *)
(* matter W and a codomain R, there exist two distinct access functions     *)
(* from W to R.                                                                *)

Record MediatedSetup := {
  MS_subject : SubjectMatter;
  MS_codomain : Codomain;
  MS_O1 : AccessFunction;
  MS_O2 : AccessFunction;
  MS_O1_src : AF_source MS_O1 = MS_subject;
  MS_O1_tgt : AF_target MS_O1 = MS_codomain;
  MS_O2_src : AF_source MS_O2 = MS_subject;
  MS_O2_tgt : AF_target MS_O2 = MS_codomain;
  MS_distinct : AF_map MS_O1 <> AF_map MS_O2
}.

(* 2.3  Underdetermined.                                                       *)
(*                                                                             *)
(* A trace is underdetermined if there exist at least two distinct (w, O)    *)
(* pairs that could have produced it. The chapter: "From the trace alone,   *)
(* neither the source w nor the procedure O is uniquely determined."         *)
(*                                                                             *)
(* We model underdetermination as the existence of two distinct              *)
(* ProducedTrace records that yield the same trace.                          *)

Record UnderdeterminedSetup (r : Codomain) (t : Trace r) : Prop :=
  { und_pt1 : ProducedTrace ;
    und_pt2 : ProducedTrace ;
    und_t1_eq : PT_codomain und_pt1 = r ;
    und_t2_eq : PT_codomain und_pt2 = r ;
    und_trace1_eq : PT_trace und_pt1 = t ;
    und_trace2_eq : PT_trace und_pt2 = t ;
    und_distinct :
      PT_region und_pt1 <> PT_region und_pt2 \/
      AF_map (PT_access und_pt1) <> AF_map (PT_access und_pt2)
  }.

(* 2.4  Possibly indexical.                                                    *)
(*                                                                             *)
(* A trace is indexical when it points beyond itself to a source. Not every  *)
(* trace does so; the property is data, not given in advance. A pure noise   *)
(* pattern is not indexical; a hallucination that has the form of a          *)
(* measurement is not; a free pattern in a derivation points only to the     *)
(* derivation itself.                                                          *)

(* The dichotomy: a trace is indexical iff it carries a witness to its      *)
(* being-of-something; otherwise it is a free pattern.                      *)

Record Indexical (r : Codomain) (t : Trace r) : Prop :=
  { indexical_evidence :
      exists (it : IndexicalTrace r), it_trace it = t
  }.

(* A non-indexical trace is a "free pattern".                                *)

Definition FreePattern (r : Codomain) (t : Trace r) : Prop :=
  forall (it : IndexicalTrace r), it_trace it <> t.

(* The dichotomy is not asserted as a theorem in this library: the chapter    *)
(* explicitly says that indexicality is established by inference, not given  *)
(* in advance. We provide both predicates; concrete instantiations may      *)
(* discharge one or the other (or neither).                                  *)

(* ---------------------------------------------------------------------------- *)
(* 3.  Examples                                                                  *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* The chapter gives four concrete examples of traces. We model each as a     *)
(* particular instance of the abstract scheme, with the carrier types left   *)
(* abstract.                                                                   *)
(*                                                                             *)
(*   Example 1. An electron leaves a track in a cloud chamber.                *)
(*     W = (states of the electron)                                          *)
(*     R = (tracks in the chamber, a metric space)                            *)
(*     O : W -> R = (the chamber's response to the passing electron)         *)
(*                                                                             *)
(*   Example 2. A tree leaves a shadow on the ground.                          *)
(*     W = (the tree, as a 3D solid)                                          *)
(*     R = (shadows on the ground plane)                                      *)
(*     O : W -> R = (the projection of the tree onto the plane)               *)
(*                                                                             *)
(*   Example 3. A past event leaves a document in an archive.                  *)
(*     W = (the past event)                                                   *)
(*     R = (archival documents)                                               *)
(*     O : W -> R = (the historical production of the document)               *)
(*                                                                             *)
(*   Example 4. An abstract structure leaves a proof in a published paper.    *)
(*     W = (the abstract structure)                                           *)
(*     R = (formal proofs in a paper)                                         *)
(*     O : W -> R = (the construction of a proof)                             *)
(*                                                                             *)
(* We encode these as a single record type, parameterised by the carriers.   *)

Record TraceExample := {
  TE_subject : SubjectMatter;
  TE_codomain : Codomain;
  TE_access : AccessFunction;
  TE_source_eq : AF_source TE_access = TE_subject;
  TE_target_eq : AF_target TE_access = TE_codomain
}.

(* Constructors for the four named examples. Each leaves the carrier types  *)
(* as abstract parameters; concrete instances would fill them in.            *)

Definition ElectronTrackExample (s : SubjectMatter) (r : Codomain)
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

Definition TreeShadowExample (s : SubjectMatter) (r : Codomain)
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

Definition ArchivalDocumentExample (s : SubjectMatter) (r : Codomain)
                                     (O : AccessFunction)
                                     (Hs : AF_source O = s)
                                     (Ht : AF_target O = r) :
  TraceExample.
Proof.
  exact {| TE_subject := s;
           TE_codomain := r;
           TE_access := O;
           TE_source_eq := Hs;
           TE_target_eq := Ht |}.
Defined.

Definition ProofInPaperExample (s : SubjectMatter) (r : Codomain)
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

(* The chapter says: "From the trace alone, neither the source w nor the      *)
(* procedure O is uniquely determined; recovering them is the whole task of  *)
(* inference." We model the inference task abstractly: given a trace, the    *)
(* space of possible (w, O) pairs is the inverse image of the access         *)
(* function.                                                                   *)

Definition possible_sources (s : SubjectMatter) (r : Codomain)
                              (t : Trace r) : Type :=
  { p : Region s * AccessFunction |
      AF_source (snd p) = s /\
      AF_target (snd p) = r /\
      AF_map (snd p) (fst p) = t }.

(* Inference is the (partial) recovery of one (w, O) pair from the trace.   *)

Record Inference (s : SubjectMatter) (r : Codomain) (t : Trace r) : Type := {
  inferred_pair : possible_sources s r t
}.

(* Underdetermination says: the inference is not unique. There exist two     *)
(* distinct inferences from the same trace.                                  *)

Definition inferences_disagree (s : SubjectMatter) (r : Codomain)
                                 (t : Trace r) (I1 I2 : Inference s r t) : Prop :=
  let p1 := inferred_pair I1 in
  let p2 := inferred_pair I2 in
  fst (fst p1) <> fst (fst p2) \/ snd p1 <> snd p2.

(* ---------------------------------------------------------------------------- *)
(* 5.  Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes:                                                       *)
(*   - ProducedTrace: a trace paired with its producing access function       *)
(*     and region, with a proof that the trace is the image of the region.    *)
(*   - The four trace properties:                                              *)
(*       * Transformed  (existence of a ProducingTrace)                       *)
(*       * Mediated     (existence of two distinct access functions)          *)
(*       * Underdetermined (two distinct produced traces yielding the same t) *)
(*       * Indexical / FreePattern dichotomy, left non-theorematic            *)
(*   - The four concrete examples, unified by the TraceExample record.       *)
(*   - The inference task as a possible-sources projection, with a            *)
(*     non-uniqueness predicate.                                              *)
(*                                                                             *)
(* All four properties are encoded as Prop-valued records or definitions so  *)
(* that they can be discharged by proofs in later files when specific        *)
(* setups are modelled.                                                       *)
(*                                                                             *)
(* The file depends only on Library.v.                                         *)
(*                                                                             *)
(* ============================================================================= *)
