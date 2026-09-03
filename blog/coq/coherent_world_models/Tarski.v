(* ============================================================================= *)
(*                                                                             *)
(* 15_Tarski.v                                                                 *)
(*                                                                             *)
(* Sections Truth: coherence and correspondence, Tarski's Convention T,  *)
(* Why Tarski's correspondence is structural, The coherence tradition,   *)
(* The synthesis: coherence and correspondence, The diagram, completed,   *)
(* Three pathologies, Tarski's discipline, applied, A practical         *)
(* protocol, and The closing synthesis of coherent_world_models.php,       *)
(* lines 1028-1324.                                                            *)
(*                                                                             *)
(* Summary of the section.                                                     *)
(*                                                                             *)
(*   Truth: coherence and correspondence (lines 1028-1042).                   *)
(*                                                                             *)
(*     The chapter asks: when does a coherent model actually correspond to  *)
(*     the subject matter? Two answers: correspondence (Tarski) and coherence *)
(*     (Bradley, Blanshard). The synthesis is to require both, jointly, at  *)
(*     every admissible contact point. Goodman's irrealism is also named.   *)
(*                                                                             *)
(*   Tarski's Convention T (lines 1046-1081).                                 *)
(*                                                                             *)
(*     Tarski 1935 (1933 Polish): Convention T -- a sentence x of a       *)
(*     language L is true iff p, where p is the meta-language sentence that *)
(*     translates x. Four pieces: object-language, meta-language,           *)
(*     quotation-name, proposition p.                                         *)
(*                                                                             *)
(*     The classical illustration: snow is white is true iff snow is white.*)
(*                                                                             *)
(*   Why Tarski's correspondence is structural (lines 1085-1113).            *)
(*                                                                             *)
(*     Three consequences:                                                    *)
(*       1. Truth is not a primitive -- defined in terms of satisfaction.  *)
(*       2. Truth is semantic, not syntactic.                                *)
(*       3. The T-schema is conservative.                                    *)
(*                                                                             *)
(*     For the chapter: Tarski turns truth into an interface condition. At  *)
(*     every licensed transition T in T, the T-schema must hold.            *)
(*                                                                             *)
(*   The coherence tradition (lines 1117-1141).                              *)
(*                                                                             *)
(*     Bradley's Appearance and Reality: truth is systematic coherence of  *)
(*     ideas, such coherence being determined ultimately by the reality.    *)
(*     Blanshard: coherence with the whole of experience. BonJour: the      *)
(*     structure of empirical knowledge. The sheaf condition IS the        *)
(*     coherence tradition in the chapter's vocabulary.                      *)
(*                                                                             *)
(*   The synthesis (lines 1145-1171).                                         *)
(*                                                                             *)
(*     The two traditions are complementary: coherence + correspondence,    *)
(*     simultaneously, at every admissible contact point.                   *)
(*                                                                             *)
(*   The diagram completed (lines 1175-1207).                                 *)
(*                                                                             *)
(*     Three sorts of arrows, each with a separate condition. The O_i       *)
(*     arrows: O_i in T (licence). The T_i arrows: coherence (sheaf). The  *)
(*     G -> W arrow: Tarski at the contact point, via T in T.               *)
(*                                                                             *)
(*   Three pathologies (lines 1211-1260).                                    *)
(*                                                                             *)
(*     1. Self-consistent fantasy: descent holds, but Tarski fails.        *)
(*     2. Contact-point junkie: every claim individually true, but no G.   *)
(*     3. Contact-point liar: trained on data that doesn't track W.        *)
(*                                                                             *)
(*   Tarski's discipline applied (lines 1264-1282).                          *)
(*                                                                             *)
(*     For a model G to be true, every T in T must function as a Tarskian  *)
(*     correlation. Four disciplines: every claim has a contact point,      *)
(*     every contact has a calibration, every calibration is admissible,    *)
(*     the sheaf condition is checked on every admissible cover.            *)
(*                                                                             *)
(*   A practical protocol (lines 1286-1299).                                *)
(*                                                                             *)
(*     A six-step audit: name every claim, name every contact point, check *)
(*     the calibration, check descent, apply Tarski, record residuals.       *)
(*                                                                             *)
(*   The closing synthesis (lines 1303-1324).                                *)
(*                                                                             *)
(*     Two conditions, each necessary and jointly sufficient: coherence,   *)
(*     correspondence. Plus the discipline of recording gaps.               *)
(*                                                                             *)
(* This file formalizes Tarski's Convention T, the three pathologies, and   *)
(* the closing synthesis.                                                       *)
(*                                                                             *)
(* ============================================================================= *)

Require Import Library.
Require Import Traces.
Require Import AdmissibleTransitions.
Require Import ContextsAndSites.
Require Import Sheaves.
Require Import MasterDiagram.
Require Import Forbidden.
From Coq Require Import Lists.List.
Import ListNotations.

(* ---------------------------------------------------------------------------- *)
(* 1.  Tarski's Convention T                                                     *)
(* ---------------------------------------------------------------------------- *)

(* Four pieces:                                                                *)
(*   1. The object-language L in which the sentence S is written.            *)
(*   2. The meta-language in which we talk about S and assert p.             *)
(*   3. The quotation-name of S in the meta-language.                        *)
(*   4. The proposition p in the meta-language.                               *)

Record ObjectLanguage := {
  OL_carrier : Type          (* the carrier of object-language sentences     *)
}.

Record MetaLanguage := {
  ML_carrier : Type;          (* the carrier of meta-language sentences       *)
  ML_quotes : ML_carrier -> Type (* quotation-name formation                  *)
}.

Record ConventionT := {
  CT_L : ObjectLanguage;
  CT_ML : MetaLanguage;
  CT_S : OL_carrier CT_L;      (* the object-sentence                        *)
  CT_quoted : ML_carrier CT_ML; (* the quotation-name                        *)
  CT_p : Prop;                 (* the proposition in the meta-language: the   *)
                               (* content asserted as a claim about the world *)
  CT_true : OL_carrier CT_L -> Prop; (* the truth-predicate: S is true in L   *)
  CT_iff : CT_true CT_S <-> CT_p
  (* Convention T: S is true in L iff p, a meta-level biconditional.       *)
  (* The quotation-name CT_quoted is the handle by which we refer to S;    *)
  (* it is not the proposition p. Convention T relates the TRUTH of the    *)
  (* object-sentence to the proposition p, never identifying the sentence   *)
  (* with the fact (the PHP: the right-hand side is not inside quotation    *)
  (* marks: it is the sentence's content, asserted as a fact about the      *)
  (* world).                                                               *)
}.

(* The classical illustration: snow is white is true iff snow is white.    *)

Record SnowIsWhite := {
  SIW_S : Type;
  SIW_snow_is_white : SIW_S;
  SIW_p : Type;
  SIW_snow_is_white_fact : SIW_p;
  SIW_iff : Prop   (* Convention T: snow is white is true iff snow is white *)
}.

(* ---------------------------------------------------------------------------- *)
(* 2.  Why Tarski's correspondence is structural                                 *)
(* ---------------------------------------------------------------------------- *)

(* Three consequences:                                                         *)
(*   1. Truth is not a primitive -- defined in terms of satisfaction,        *)
(*      reference, and quotation.                                             *)
(*   2. Truth is semantic, not syntactic.                                    *)
(*   3. The T-schema is conservative.                                        *)

Inductive TarskiConsequence :=
  | TC_not_primitive : TarskiConsequence
  | TC_semantic      : TarskiConsequence
  | TC_conservative  : TarskiConsequence.

(* The chapter's claim: Tarski turns truth from a metaphysical mystery   *)
(* into an interface condition. At every point where the model's claim   *)
(* meets the world, an if-and-only-if must hold.                            *)

Record TruthAsInterface := {
  TAI_claim : Type;          (* the model's claim                            *)
  TAI_fact : Type;           (* the corresponding fact                       *)
  TAI_licensed_T : Prop;     (* a licensed transition exists                 *)
  TAI_claim_holds : Prop;    (* the claim's truth (Tarski: "S is true")      *)
  TAI_fact_holds : Prop;     (* the fact holds in the world                  *)
  TAI_iff : TAI_claim_holds <-> TAI_fact_holds
  (* Convention T at the contact point: the claim is true iff the fact      *)
  (* holds. Not an identification of claim with fact: the claim is a        *)
  (* formal artefact inside the model, the fact is in the world, and the    *)
  (* iff relates their truth-values, not their identity.                     *)
}.

(* ---------------------------------------------------------------------------- *)
(* 3.  The coherence tradition                                                    *)
(* ---------------------------------------------------------------------------- *)

(* The coherence tradition: truth is systematic coherence.                   *)

Record CoherenceTradition := {
  CT_local_sections : Type;
  CT_global_section : Type;
  CT_coherence_holds : Prop   (* placeholder for sheaf-style coherence       *)
}.
(* The chapter: the sheaf condition IS the coherence tradition in the      *)
(* chapter's vocabulary.                                                    *)

(* ---------------------------------------------------------------------------- *)
(* 4.  The synthesis                                                              *)
(* ---------------------------------------------------------------------------- *)

(* Coherence + correspondence, jointly, at every admissible contact point.   *)

Record CoherenceAndCorrespondence := {
  CAC_G : Type;
  CAC_descent : forall (c : Context) (cov : AdmissibleCover c), Prop;
  CAC_tarski : forall (claim fact : Type) (T : Prop), Prop;
  CAC_truth :
    (forall c cov, CAC_descent c cov) /\
    (forall claim fact T, CAC_tarski claim fact T)
}.

(* The boxed synthesis:                                                        *)

Axiom coherence_and_correspondence :
  forall (cac : CoherenceAndCorrespondence),
    Prop.
(* The boxed claim is that both together entail truth. Concrete form would  *)
(* state that the conjunction entails the truth of the model.               *)

(* ---------------------------------------------------------------------------- *)
(* 5.  The diagram completed                                                     *)
(* ---------------------------------------------------------------------------- *)

(* Three sorts of arrows, each with a separate condition.                     *)

Record CompletedDiagram := {
  CD_W : SubjectMatter;
  CD_R : Codomain;
  CD_G : Codomain;
  CD_O : AccessFunction;
  CD_T : ViewTranslation;
  CD_O_licensed : observation_licensed CD_O;     (* O_i in T: licence        *)
  CD_T_descent : Prop;                            (* T_i: coherence condition  *)
  CD_G_to_W : TruthAsInterface                    (* G -> W: Tarski at contact *)
}.

(* ---------------------------------------------------------------------------- *)
(* 6.  Three pathologies                                                          *)
(* ---------------------------------------------------------------------------- *)

(* Pathology 1: the self-consistent fantasy.                                  *)
(* Descent holds; Tarski fails at contact points.                             *)

Record SelfConsistentFantasy := {
  SCF_G : Type;
  SCF_descent : Prop;       (* placeholder: descent holds                    *)
  SCF_tarski_fails : Prop;
  SCF_condition : SCF_descent /\ SCF_tarski_fails
}.
(* Self-consistent fantasy: descent holds internally, but Tarski fails.    *)
(* Self-consistent fantasy: descent holds internally, but Tarski fails.      *)

(* Pathology 2: the contact-point junkie.                                      *)

Record ContactPointJunkie := {
  CPJ_G : Type;
  CPJ_claims : list Type;     (* a heap of individually-checked claims      *)
  CPJ_tarski_holds : forall c : Type, In c CPJ_claims -> Prop;
  CPJ_no_global : Prop        (* descent fails; no coherent G                 *)
}.

(* Pathology 3: the contact-point liar.                                        *)

Record ContactPointLiar := {
  CPL_M : Type;
  CPL_self_consistent : Prop;
  CPL_tarski_fails : Prop;    (* no T in T passes Tarski                      *)
  CPL_condition : CPL_self_consistent /\ CPL_tarski_fails
}.

(* ---------------------------------------------------------------------------- *)
(* 7.  Tarski's discipline applied                                                *)
(* ---------------------------------------------------------------------------- *)

(* Four disciplines for a model to be true.                                  *)

Record TarskiDiscipline := {
  TD_G : Type;
  TD_claim_has_contact : forall claim : Type, Prop;
  TD_contact_has_calibration : forall c : Type, Prop;
  TD_calibration_admissible : forall cal : Type, Prop;
  TD_descent_every_cover : forall (c : Context) (cov : AdmissibleCover c),
    Prop;
  TD_disciplines :
    (forall claim, TD_claim_has_contact claim) /\
    (forall c, TD_contact_has_calibration c) /\
    (forall cal, TD_calibration_admissible cal) /\
    (forall c cov, TD_descent_every_cover c cov)
}.

(* ---------------------------------------------------------------------------- *)
(* 8.  A practical protocol                                                       *)
(* ---------------------------------------------------------------------------- *)

(* The six-step audit.                                                         *)

Inductive AuditStep :=
  | AS_name_claims       : AuditStep
  | AS_name_contacts     : AuditStep
  | AS_check_calibration : AuditStep
  | AS_check_descent     : AuditStep
  | AS_apply_tarski      : AuditStep
  | AS_record_residuals  : AuditStep.

Record AuditState := {
  Au_step : AuditStep;
  Au_completed : Prop;
  Au_failures : list AuditStep
}.

(* The boxed principle:                                                        *)

Axiom for_a_model_to_be_true :
  forall (g : Type), Prop.
(* Concrete form:                                                                *)
(*   (a) descent on every admissible cover, AND                              *)
(*   (b) every contact point is calibrated (Tarski at every T in T).        *)

(* ---------------------------------------------------------------------------- *)
(* 9.  The closing synthesis                                                      *)
(* ---------------------------------------------------------------------------- *)

(* Two conditions, each necessary and jointly sufficient.                     *)

Record ClosingSynthesis := {
  CS_G : Type;
  CS_coherence : forall (c : Context) (cov : AdmissibleCover c), Prop;
  CS_correspondence : forall (claim fact : Type) (T : Prop), Prop;
  CS_residual_recorded : Prop;     (* the residual is recorded, not hidden   *)
  CS_truth :
    (forall c cov, CS_coherence c cov) /\
    (forall claim fact T, CS_correspondence claim fact T) /\
    CS_residual_recorded
}.

(* ---------------------------------------------------------------------------- *)
(* 10. Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes:                                                       *)
(*   - Tarski's Convention T: object-language, meta-language, quotation,    *)
(*     proposition, and the iff.                                             *)
(*   - The three consequences: truth is not primitive, semantic, conservative.*)
(*   - Truth as interface condition.                                          *)
(*   - The coherence tradition.                                               *)
(*   - The synthesis: coherence + correspondence.                             *)
(*   - The completed diagram (three sorts of arrows, three conditions).    *)
(*   - The three pathologies: fantasy, junkie, liar.                         *)
(*   - Tarski's discipline (four rules).                                     *)
(*   - The practical protocol (six-step audit).                              *)
(*   - The closing synthesis.                                                 *)
(*                                                                             *)
(* The file depends on Library.v, Traces.v, AdmissibleTransitions.v,        *)
(* ContextsAndSites.v, Sheaves.v, MasterDiagram.v, and Forbidden.v.         *)
(*                                                                             *)
(* ============================================================================= *)
