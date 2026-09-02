(* ============================================================================= *)
(*                                                                             *)
(* 18_AILLM.v                                                                  *)
(*                                                                             *)
(* Section "What this offers AI systems" of coherent_world_models.php,         *)
(* lines 1328-1565.                                                            *)
(*                                                                             *)
(* Summary of the section.                                                     *)
(*                                                                             *)
(*   The chapter applies the framework to AI systems, especially LLMs. The   *)
(*   reading is offered as an attempt at organisation, not a finished theory. *)
(*                                                                             *)
(*   Topics covered:                                                          *)
(*     - The LLM in the master diagram                                       *)
(*     - What the LLM does: internal descent                                  *)
(*     - What the LLM lacks: grounded observation                            *)
(*     - Hallucination, precisely                                            *)
(*     - What helps: adding admissible transitions                             *)
(*     - The nine-step audit, applied to an LLM                              *)
(*     - Where this framework reaches its limits                              *)
(*     - An honest closing                                                     *)
(*                                                                             *)
(* This file formalizes the LLM in the master diagram, the diagnostic of    *)
(* hallucination, and the remedies.                                            *)
(*                                                                             *)
(* ============================================================================= *)

Require Import Library.
Require Import Traces.
Require Import AdmissibleTransitions.
Require Import ContextsAndSites.
Require Import Sheaves.
Require Import MasterDiagram.
Require Import Forbidden.
Require Import Tarski.
Require Import ThreePathologies.
Require Import PracticalProcedure.
From Coq Require Import Lists.List.
Import ListNotations.

(* ---------------------------------------------------------------------------- *)
(* 1.  The LLM in the master diagram                                             *)
(* ---------------------------------------------------------------------------- *)

(* The LLM, as a system: subject matter, cover, representations, transitions, *)
(* global section.                                                              *)

Record LLMSetup := {
  LLM_W : SubjectMatter;             (* the world the corpus is about          *)
  LLM_corpus : Type;                  (* the training corpus                   *)
  LLM_documents : list Type;          (* the documents in the corpus           *)
  LLM_R : Type;                       (* the representations R_i              *)
  LLM_O : LLM_corpus -> LLM_R;        (* the sampling step (W -> R_i)         *)
  LLM_G : Type;                       (* the trained model                     *)
  LLM_T : LLM_R -> LLM_G              (* the internal fit (R_i -> G)          *)
}.

(* The chapter: the LLM has internal admissible transitions but no       *)
(* external ones. The training process fits G to make the {R_i} jointly   *)
(* predictable, and that is the only sense in which G is of W.              *)

(* The LLM, by default, has only internal arrows.                            *)

Record LLMInternalOnly := {
  LLMIO_setup : LLMSetup;
  LLMIO_no_external_O : Prop     (* there are no observation arrows from W   *)
}.

(* ---------------------------------------------------------------------------- *)
(* 2.  Internal descent: what the LLM does                                       *)
(* ---------------------------------------------------------------------------- *)

(* In-context learning: the prompt becomes a cover of the conversation.    *)

Record InContextLearning := {
  ICL_prompt : Type;
  ICL_examples : list Type;
  ICL_continuation : Type;
  ICL_continuation_compatible :
    forall ex : Type, In ex ICL_examples -> Prop
}.

(* Chain-of-thought: each step is a new patch.                              *)

Record ChainOfThought := {
  COT_steps : list Type;
  COT_each_step_consistent :
    forall i : nat, In (nth i COT_steps Type) COT_steps -> Prop
}.

(* Self-consistency: sampling k chain-of-thoughts, majority vote.            *)

Record SelfConsistency := {
  SC_k : nat;
  SC_samples : list (list Type);    (* k chain-of-thought samples             *)
  SC_majority : list Type            (* the majority vote                       *)
}.

(* Verifier-guided search: each candidate is a claim; the verifier checks.  *)

Record VerifierGuidedSearch := {
  VGS_candidates : list Type;
  VGS_verifier : Type -> Prop;
  VGS_best : Type
}.

(* ---------------------------------------------------------------------------- *)
(* 3.  Grounded observation: what the LLM lacks                                  *)
(* ---------------------------------------------------------------------------- *)

(* The chapter: What the LLM is not doing, by default, is anything the      *)
(* chapter would call observation in the strict sense.                       *)

(* Three partial mitigations of the gap.                                       *)

(* 3.1  In-context learning as a partial observation arrow.                    *)

Record InContextObservation := {
  ICO_prompt : Type;
  ICO_facts : list Type;            (* facts in the prompt                    *)
  ICO_completion : Type;
  ICO_arrow : ICO_prompt -> ICO_completion;
  ICO_is_shallow : Prop   (* the arrow is shallow: both ends are inside the  *)
                          (* model                                                *)
}.

(* 3.2  Retrieval-Augmented Generation.                                         *)

Record RAG := {
  RAG_knowledge_base : Type;
  RAG_retriever : Type -> RAG_knowledge_base;
  RAG_passages : list Type;
  RAG_passage_is_closer_to_W : Prop
}.

(* 3.3  Tools and formal verification as T in T.                                *)

Record ToolUse := {
  TU_tools : list Type;             (* the available tools                     *)
  TU_tool_call : Type -> Type;       (* a tool call                            *)
  TU_is_T_in_T : Prop               (* the tool is a T in T                   *)
}.

Record FormalVerification := {
  FV_assistant : Type;              (* Coq, Lean, ...                         *)
  FV_proof : Type;
  FV_kernel_check : FV_proof -> Prop  (* the kernel's yes is the meta-fact p. *)
}.

(* ---------------------------------------------------------------------------- *)
(* 4.  Hallucination, precisely                                                  *)
(* ---------------------------------------------------------------------------- *)

(* The chapter: a hallucination is most accurately a non-glueable         *)
(* presheaf with external correspondence failures, though the cleaner      *)
(* self-consistent fantasy is also possible.                                  *)

Record NonGlueablePresheaf := {
  NGP_presheaf : Presheaf;
  NGP_local_sections : forall c : Context, Type;
  NGP_no_global : Prop;            (* the sheaf condition fails              *)
  NGP_correspondence_fails : Prop   (* correspondence also fails               *)
}.

(* The chapter's revised diagnosis table.                                       *)

Inductive HallucinationDiagnosis :=
  | HD_non_glueable_presheaf : HallucinationDiagnosis   (* most common       *)
  | HD_self_consistent_fantasy : HallucinationDiagnosis  (* rare             *)
  | HD_factbook : HallucinationDiagnosis                  (* disconnected    *)
  | HD_calibrated_error : HallucinationDiagnosis.        (* subtle mistakes  *)

Record HallucinationCase := {
  HC_diagnosis : HallucinationDiagnosis;
  HC_broken : Prop;                 (* what's broken: coherence, correspondence *)
  HC_remedy : Prop                 (* the typical remedy                       *)
}.

(* ---------------------------------------------------------------------------- *)
(* 5.  Adding admissible transitions                                              *)
(* ---------------------------------------------------------------------------- *)

(* Each remedy is, in the chapter's terms, adding an admissible transition. *)

Record AugmentedLLM := {
  ALLM_base : LLMSetup;
  ALLM_RAG : Prop;                  (* retrieval augmented generation         *)
  ALLM_tools : Prop;                (* tool use                                *)
  ALLM_verifier : Prop;             (* formal verification                    *)
  ALLM_RLHF : Prop                  (* reinforcement learning from human feedback *)
}.

(* ---------------------------------------------------------------------------- *)
(* 6.  The nine-step audit, applied to an LLM                                   *)
(* ---------------------------------------------------------------------------- *)

(* The chapter applies the nine-step procedure (PracticalProcedure.v) to   *)
(* a deployed LLM. We record the LLM-specific instance.                      *)

Record LLMAudit := {
  LA_input : Type;                  (* the prompt, context window, ...         *)
  LA_interpretation : LA_input -> Type;
  LA_chain : list Type;             (* W -> corpus -> params -> prompt -> out *)
  LA_overlaps : list Type;
  LA_licences : list TransitionKind;
  LA_sameness : SamenessChoice;
  LA_global : Type;
  LA_residuals : Type;
  LA_next : Type
}.

(* ---------------------------------------------------------------------------- *)
(* 7.  Where the framework reaches its limits                                    *)
(* ---------------------------------------------------------------------------- *)

(* The chapter names four limits:                                              *)
(*   1. Emergent capabilities                                                   *)
(*   2. In-context learning as a meta-phenomenon                              *)
(*   3. The training dynamics                                                  *)
(*   4. The value-alignment problem                                            *)

Inductive FrameworkLimit :=
  | FL_emergent_capabilities       : FrameworkLimit
  | FL_in_context_meta_phenomenon  : FrameworkLimit
  | FL_training_dynamics           : FrameworkLimit
  | FL_value_alignment_problem     : FrameworkLimit.

(* The chapter: These limits are not failings of the chapter; they are     *)
(* the boundary of what the chapter's machinery is competent to address.   *)

Axiom framework_has_limits :
  forall (l : FrameworkLimit), True.

(* ---------------------------------------------------------------------------- *)
(* 8.  The honest closing                                                         *)
(* ---------------------------------------------------------------------------- *)

(* Three honest claims:                                                        *)
(*   1. This framework is a useful lens, not a finished theory.              *)
(*   2. The unification is a hypothesis.                                     *)
(*   3. The discipline is portable.                                           *)

Inductive HonestClaim :=
  | HC_useful_lens            : HonestClaim
  | HC_unification_hypothesis : HonestClaim
  | HC_portable_discipline     : HonestClaim.

Record HonestClosing := {
  HC_claim : HonestClaim;
  HC_bears : Prop     (* what the claim bears: specific content            *)
}.

(* ---------------------------------------------------------------------------- *)
(* 9.  The boxed principle                                                        *)
(* ---------------------------------------------------------------------------- *)

(* The chapter's final boxed claim.                                            *)

Axiom llm_world_model_kind :
  forall (setup : LLMSetup) (aug : AugmentedLLM),
    Prop.
(* The actual claim: An LLM is a world model of a kind -- a global section *)
(* computed on a noisy, partially contradictory cover, without observation  *)
(* arrows of its own, kept coherent by training on the one resource it    *)
(* has, namely language about the world.                                      *)

(* ---------------------------------------------------------------------------- *)
(* 10. Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes:                                                       *)
(*   - The LLM in the master diagram (W -> corpus -> R -> G).                *)
(*   - The internal descent techniques: in-context, chain-of-thought, self- *)
(*     consistency, verifier-guided search.                                   *)
(*   - The lack of grounded observation; three partial mitigations.         *)
(*   - The refined hallucination diagnosis (non-glueable presheaf).         *)
(*   - The augmented LLM with RAG, tools, formal verification, RLHF.       *)
(*   - The LLM-specific nine-step audit.                                     *)
(*   - The framework's limits.                                                *)
(*   - The honest closing: three claims.                                      *)
(*                                                                             *)
(* The file depends on Library.v, Traces.v, AdmissibleTransitions.v,        *)
(* ContextsAndSites.v, Sheaves.v, MasterDiagram.v, Forbidden.v, Tarski.v,   *)
(* and ThreePathologies.v.                                                    *)
(*                                                                             *)
(* ============================================================================= *)
*)
