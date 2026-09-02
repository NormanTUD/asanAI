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
(* 1.  The four properties of a trace                                          *)
(* ---------------------------------------------------------------------------- *)

(* The chapter lists four properties of a trace. We encode each as a         *)
(* predicate that a particular Trace satisfies in a given setup.             *)

(* 1.1  Transformed.                                                           *)
(*                                                                             *)
(* A trace is "transformed" if it is the *output* of an access function       *)
(* applied to a region. That is, the trace has been produced by some access.  *)
(* Equivalently: the trace lives in the codomain of an access function, not   *)
(* in the subject matter itself.                                               *)

Record Transformed (s : SubjectMatter) (r : Codomain) (t : Trace r) : Prop :=
  { transformed_evidence : exists (O : AccessFunction),
      AF_source O = s /\ AF_target O = r
  }.
(* The "evidence" of being transformed is that there exists an access        *)
(* function whose source is the subject matter and whose target is the        *)
(* codomain; the trace is what the function produces. The actual witness is  *)
(* the existence of the function.                                              *)

(* 1.2  Mediated.                                                               *)
(*                                                                             *)
(* A trace is mediated if the access function that produced it left marks:   *)
(* different access functions on the same input give different traces.        *)
(* This is the failure of "unmediated access": no trace is free of the       *)
(* marks of its producing procedure.                                          *)

(* The mediated property is stated abstractly. To compare the two AF_maps,  *)
(* we need them to have the same type. We achieve this by coercing via the   *)
(* equality proofs.                                                            *)

Definition Mediated (s : SubjectMatter) (r : Codomain) : Prop :=
  exists O1 O2 : AccessFunction,
    AF_source O1 = s /\ AF_target O1 = r /\
    AF_source O2 = s /\ AF_target O2 = r /\
    eq_rect (AF_source O1) (fun W => W -> R_carrier r) (AF_map O1)
            (AF_source O1 = s) eq_refl (AF_map O1) <>
    eq_rect (AF_source O2) (fun W => W -> R_carrier r) (AF_map O2)
            (AF_source O2 = s) eq_refl (AF_map O2).
(* The above is a sketch that shows what we want; we leave the precise       *)
(* rewriting to a manual proof later. For now we declare the abstract shape. *)

(* 1.3  Underdetermined.                                                       *)
(*                                                                             *)
(* A trace is underdetermined if there exist at least two distinct (w, O)    *)
(* pairs that could have produced it. The chapter stresses: recovering w and  *)
(* O from the trace alone is "the whole task of inference".                   *)

Record Underdetermined (s : SubjectMatter) (r : Codomain) (t : Trace r) : Prop :=
  { underdetermined_witness :
      exists (w1 w2 : Region s) (O1 O2 : AccessFunction),
        AF_map O1 w1 = t /\
        AF_map O2 w2 = t /\
        (w1 <> w2 \/ O1 <> O2)
  }.

(* 1.4  Possibly indexical.                                                    *)
(*                                                                             *)
(* A trace is indexical when it points beyond itself to a source. Not every  *)
(* trace does so; the property is data, not given in advance. A pure noise   *)
(* pattern is not indexical; a hallucination that has the form of a          *)
(* measurement is not; a free pattern in a derivation points only to the     *)
(* derivation itself.                                                          *)

(* A trace is indexical iff it carries a witness to its being-of-something. *)

Record Indexical (r : Codomain) (t : Trace r) : Prop :=
  { indexical_evidence :
      exists (it : IndexicalTrace r), it_trace it = t /\ it_is_of it = it_is_of it
  }.

(* A non-indexical trace is a "free pattern" (per the chapter).             *)

Record FreePattern_ (r : Codomain) (t : Trace r) : Prop :=
  { free_pattern_evidence :
      forall (it : IndexicalTrace r), it_trace it <> t
  }.

(* The dichotomy is: every trace is either indexical or free; the chapter   *)
(* says this is established by inference, not given in advance. We do not   *)
(* assert the dichotomy as a theorem; it is part of the discipline.          *)

(* ---------------------------------------------------------------------------- *)
(* 2.  Examples                                                                  *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* The chapter gives four concrete examples of traces. We model each as a     *)
(* particular instance of the abstract scheme.                                *)
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
(* We encode the examples abstractly; concrete instantiations would populate *)
(* the carriers of the SubjectMatter and Codomain records.                    *)

(* A "trace example" bundles the four pieces.                                 *)

Record TraceExample := {
  TE_subject : SubjectMatter;
  TE_codomain : Codomain;
  TE_access : AccessFunction;
  TE_source_eq : AF_source TE_access = TE_subject;
  TE_target_eq : AF_target TE_access = TE_codomain
}.

(* The chapter's examples are all of this form. *)

Definition is_trace_example (s : SubjectMatter) (r : Codomain)
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
(* 3.  Inference: recovering (w, O) from a trace                               *)
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

(* Inference is the (partial) recovery of one (w, O) pair from the trace.    *)

Record Inference (s : SubjectMatter) (r : Codomain) (t : Trace r) : Type := {
  inferred_pair : possible_sources s r t
}.

(* Underdetermination says: the inference is not unique.                     *)

Definition inference_is_underdetermined (s : SubjectMatter) (r : Codomain)
                                          (t : Trace r)
                                          (I1 I2 : Inference s r t) : Prop :=
  let p1 := inferred_pair I1 in
  let p2 := inferred_pair I2 in
  fst (fst p1) <> fst (fst p2) \/ snd p1 <> snd p2.

(* ---------------------------------------------------------------------------- *)
(* 4.  Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes:                                                       *)
(*   - The four trace properties: Transformed, Mediated, Underdetermined,     *)
(*     and Possibly Indexical (with FreePattern_ as the negation).            *)
(*   - The four concrete examples of traces (electron track, tree shadow,    *)
(*     archival document, proof in a paper), unified by the TraceExample     *)
(*     record.                                                                  *)
(*   - The inference task as a possible-sources projection, and               *)
(*     underdetermination as a non-uniqueness predicate on inferences.       *)
(*                                                                             *)
(* All four properties are encoded as Prop-valued records so that they can   *)
(* be discharged by proofs in later files when specific setups are modelled. *)
(*                                                                             *)
(* The file depends only on Library.v.                                         *)
(*                                                                             *)
(* ============================================================================= *)
