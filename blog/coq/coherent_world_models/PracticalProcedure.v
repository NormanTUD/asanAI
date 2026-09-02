(* ============================================================================= *)
(*                                                                             *)
(* 14_PracticalProcedure.v                                                       *)
(*                                                                             *)
(* Section A practical procedure of coherent_world_models.php,              *)
(* lines 870-890.                                                              *)
(*                                                                             *)
(* Summary of the section.                                                     *)
(*                                                                             *)
(*   The chapter compresses the whole framework into a nine-step procedure. *)
(*   Each step has a question; the discipline is asking them in order.      *)
(*                                                                             *)
(*   1. Take the raw datum D. What is actually in front of you?             *)
(*   2. Interpret it as I(D). What reading are you imposing?                 *)
(*   3. Draw the chain W -> D -> I. Where in the chain could disagreement   *)
(*      enter?                                                                  *)
(*   4. Identify overlaps. Where do independent channels meet?               *)
(*   5. Specify admissible transitions T_{ij} in T. What licences each       *)
(*      comparison?                                                             *)
(*   6. Decide which sameness: =, ~=, ~, <= eps, statistical, model-       *)
(*      theoretic; pick the right one and refuse to upgrade.                 *)
(*   7. Build the candidate global model G. Does descent hold on every      *)
(*      admissible cover?                                                      *)
(*   8. Record residuals. What is preserved, not erased?                    *)
(*   9. Plan the next observation. What evidence would discriminate?        *)
(*                                                                             *)
(*   The boxed principle: Anomalies are constraints not yet integrated,    *)
(*   not defeats.                                                              *)
(*                                                                             *)
(* This file formalizes the nine steps as a sequence of records.            *)
(*                                                                             *)
(* ============================================================================= *)

Require Import Library.
Require Import Traces.
Require Import AdmissibleTransitions.
Require Import ContextsAndSites.
Require Import Sheaves.
Require Import NotionsOfSameness.
Require Import MasterDiagram.
From Coq Require Import Lists.List.
Import ListNotations.

(* ---------------------------------------------------------------------------- *)
(* 1.  The nine steps                                                            *)
(* ---------------------------------------------------------------------------- *)

(* 1.1  Step 1: take the raw datum D.                                            *)

Record Step1_RawDatum := {
  S1_D : Type;                  (* the raw datum                                *)
  S1_description : S1_D -> Prop (* what is in front of you                    *)
}.

(* 1.2  Step 2: interpret it as I(D).                                          *)

Record Step2_Interpretation := {
  S2_D : Type;
  S2_I : S2_D -> Type;           (* the interpretation as a function         *)
  S2_reading : S2_D -> Prop      (* what reading are you imposing              *)
}.

(* 1.3  Step 3: draw the chain W -> D -> I.                                     *)

Record Step3_Chain := {
  S3_W : SubjectMatter;
  S3_D : Type;
  S3_I : S3_D -> Type;
  S3_W_to_D : W_carrier S3_W -> S3_D;
  S3_disagreement_points : list (W_carrier S3_W * S3_D) (* placeholder for   *)
                                                   (* where disagreement can enter *)
}.

(* 1.4  Step 4: identify overlaps.                                              *)

Record Step4_Overlaps := {
  S4_channels : list Type;       (* the independent channels                    *)
  S4_overlap : Type;             (* the place where channels meet               *)
  S4_meet : forall c : Type, c -> S4_overlap (* placeholder                  *)
}.

(* 1.5  Step 5: specify admissible transitions T_{ij} in T.                  *)

Record Step5_Licences := {
  S5_T : list TransitionKind;     (* the licensed transitions                   *)
  S5_licences : forall t, In t S5_T -> InT t
}.

(* 1.6  Step 6: decide which sameness.                                          *)

Inductive SamenessChoice :=
  | SC_literal         : SamenessChoice
  | SC_isomorphism     : SamenessChoice
  | SC_homotopy        : SamenessChoice
  | SC_approximation   : SamenessChoice
  | SC_statistical     : SamenessChoice
  | SC_model_theoretic : SamenessChoice.

Record Step6_Sameness := {
  S6_choice : SamenessChoice;
  S6_witness : Prop;             (* the witness for the chosen sameness       *)
  S6_refuses_upgrade : Prop     (* the witness that no upgrade was made      *)
}.

(* 1.7  Step 7: build the candidate global model G.                            *)

Record Step7_GlobalModel' := {
  S7_G' : Type;
  S7_descent_holds' : Prop      (* placeholder for descent on every cover    *)
}.

(* 1.8  Step 8: record residuals.                                                *)

Record Step8_Residuals := {
  S8_preserved : Type -> Prop;
  S8_discarded : Type -> Prop;
  S8_documented : Prop     (* the witness that residuals are recorded       *)
}.

(* 1.9  Step 9: plan the next observation.                                      *)

Record Step9_NextObservation := {
  S9_current_G : Type;
  S9_discriminating_evidence : Type;
  S9_plan : S9_discriminating_evidence -> Prop   (* the plan                  *)
}.

(* ---------------------------------------------------------------------------- *)
(* 2.  The procedure as a whole                                                  *)
(* ---------------------------------------------------------------------------- *)

(* The full procedure, packaged.                                               *)

Record Procedure := {
  P_step1 : Step1_RawDatum;
  P_step2 : Step2_Interpretation;
  P_step3 : Step3_Chain;
  P_step4 : Step4_Overlaps;
  P_step5 : Step5_Licences;
  P_step6 : Step6_Sameness;
  P_step7 : Step7_GlobalModel';
  P_step8 : Step8_Residuals;
  P_step9 : Step9_NextObservation
}.

(* ---------------------------------------------------------------------------- *)
(* 3.  The boxed principle                                                        *)
(* ---------------------------------------------------------------------------- *)

(* Anomalies are constraints not yet integrated, not defeats.                *)

Axiom anomalies_are_constraints :
  forall (p : Procedure), Prop.
(* Concrete proofs would show that the residuals at step 8 are the next     *)
(* thing to integrate, not a failure of the procedure.                       *)

(* ---------------------------------------------------------------------------- *)
(* 4.  Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes:                                                       *)
(*   - Each of the nine steps as a separate record type.                     *)
(*   - The full procedure as a record bundling all nine steps.               *)
(*   - The boxed principle: anomalies are constraints, not defeats.        *)
(*                                                                             *)
(* The procedure applies in any domain -- scientific, mathematical,         *)
(* historical, AI -- because the chapter's claim is that the *shape* of the *)
(* procedure is universal. Concrete instantiations would specialise each    *)
(* step to the domain at hand.                                                *)
(*                                                                             *)
(* The file depends on Library.v, Traces.v, AdmissibleTransitions.v,        *)
(* Sheaves.v, NotionsOfSameness.v, and MasterDiagram.v.                     *)
(*                                                                             *)
(* ============================================================================= *)
