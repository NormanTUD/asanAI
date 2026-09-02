(* ============================================================================= *)
(*                                                                             *)
(* 18_AILLM.v                                                                  *)
(*                                                                             *)
(* Section What this offers AI systems of coherent_world_models.php,         *)
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

(* The training dynamics: the chain D -> B -> L -> grad L -> theta_{t+1}.    *)

Record TrainingDynamics := {
  TD_D : Type;                       (* the dataset                              *)
  TD_B : Type;                       (* the batch at time t                      *)
  TD_L : Type;                       (* the loss value                           *)
  TD_grad : Type;                    (* the gradient                             *)
  TD_theta : Type;                   (* the parameter vector                    *)
  TD_sample : TD_D -> TD_B;          (* D -> B (sample batch)                    *)
  TD_forward : TD_B -> TD_L;          (* B -> L (forward + loss)                 *)
  TD_backward : TD_L -> TD_grad;      (* L -> grad (backward)                     *)
  TD_SGD : TD_grad -> TD_theta;       (* grad -> theta (eta-SGD)                  *)
  TD_theta_t : TD_theta;             (* the current theta                        *)
  TD_theta_tp1 : TD_theta;           (* the updated theta                        *)
  TD_chain : Prop                    (* placeholder: the chain commutativity     *)
}.

(* The four operations compose to one step of gradient descent.            *)

Axiom training_chain_commutes :
  forall (td : TrainingDynamics), Prop.
(* Concrete content: the chain rule says the backward step is exactly    *)
(* the differential of the forward-plus-loss step.                          *)

(* Data quality and scale enter at the top edge (D -> B).                  *)

Record DataQuality := {
  DQ_dataset : Type;
  DQ_quality : DQ_dataset -> Prop;     (* the cleaner the better                  *)
  DQ_scale : nat                      (* the size of the dataset                 *)
}.

(* Backpropagation is the chain-rule implementation of the implicit        *)
(* backward arrow.                                                            *)

Axiom backprop_is_chain_rule :
  Prop.
(* Concrete content: a real proof would exhibit the chain rule explicitly.*)

(* Gradient descent and the loss landscape.                                  *)

Record LossLandscape := {
  LL_theta : Type;                   (* the parameter space                      *)
  LL_loss : LL_theta -> Type;        (* the loss as a function                   *)
  LL_geometry : Type -> Type -> Prop (* a notion of distance on the landscape  *)
}.

(* SGD regularisation: the implicit noise in B (sampling from D) keeps    *)
(* the parameters from settling exactly on the noise.                        *)

Axiom sgd_regularisation :
  Prop.

(* The hallucination table from the chapter. The chapter's revised diagnosis *)
(* distinguishes four LLM failure modes, each with its own remedy.            *)

Record HallucinationTableEntry := {
  HTE_pathology : HallucinationDiagnosis;
  HTE_failure_mode : Type -> Prop;        (* what's broken                       *)
  HTE_typical_remedy : Prop              (* the typical remedy                   *)
}.

Definition hallucination_table : list HallucinationTableEntry := nil.
(* A concrete formalization would populate this with:                         *)
(*   - Non-glueable presheaf: confident hallucination, local incoherence.    *)
(*     Broken: coherence + correspondence.                                   *)
(*     Remedy: retrieval, RAG, tools, calibration of training data.          *)
(*   - Self-consistent fantasy: fluent nonsense with internal consistency.   *)
(*     Broken: correspondence only.                                          *)
(*     Remedy: grounding in actual sources.                                  *)
(*   - Factbook: disconnected reasoning; correct facts but no synthesis.    *)
(*     Broken: coherence.                                                     *)
(*     Remedy: better reasoning, chain-of-thought, structured scratchpads. *)
(*   - Calibrated error: subtle, plausible-sounding mistakes.                 *)
(*     Broken: correspondence.                                                *)
(*     Remedy: re-calibrated licences, formal verification.                 *)

(* The chapter: "The diagnosis matters because the remedy differs in each   *)
(* case. The typical hallucination needs both more coherence and more        *)
(* correspondence... A single fix does not address all four, and conflating *)
(* them is one of the most common ways to talk uselessly about AI safety."  *)

Axiom diagnosis_matters_for_remedy :
  forall (t1 t2 : HallucinationDiagnosis) (e : HallucinationTableEntry),
    HTE_pathology e = t1 ->
    HTE_pathology e = t2 ->
    (* same pathology, same remedy; different pathology, different remedy    *)
    (forall r1 r2, HTE_typical_remedy e = r1 -> HTE_typical_remedy e = r2 -> r1 = r2) ->
    True.

(* The value-alignment problem in the strong sense. The chapter explicitly  *)
(* acknowledges that it does not address this.                                *)

Record ValueAlignmentProblem := {
  VAP_goals : Type;
  VAP_observer : Type;
  VAP_alignment : VAP_goals -> VAP_observer -> Prop;
  VAP_chapter_does_not_address : Prop
}.

Axiom value_alignment_separate :
  forall (vap : ValueAlignmentProblem), Prop.
(* The chapter: "how to ensure that a system with the right epistemic       *)
(* standing still pursues goals we want it to pursue. That is a separate   *)
(* problem, with separate tools (preference learning, Constitutional AI,    *)
(* debate, scalable oversight, formal verification), and the chapter's     *)
(* vocabulary does not extend to it."                                        *)

(* ---------------------------------------------------------------------------- *)
(* 6.  The nine-step audit, applied to an LLM                                   *)
(* ---------------------------------------------------------------------------- *)

(* ---------------------------------------------------------------------------- *)
(* 6.  The nine-step audit, applied to an LLM                                   *)
(* ---------------------------------------------------------------------------- *)

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
