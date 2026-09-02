(* ============================================================================= *)
(*                                                                             *)
(* 03_ThreeDifferences.v                                                       *)
(*                                                                             *)
(* Section "Three kinds of difference" of coherent_world_models.php,          *)
(* lines 114-154.                                                              *)
(*                                                                             *)
(* Summary of the section.                                                     *)
(*                                                                             *)
(*   Between the "subject matter W" and the trace r in R that was received,   *)
(* the chapter locates three independent sources of difference:              *)
(*                                                                             *)
(*     1. World-level difference (W_1 != W_2). Two subjects genuinely       *)
(*        differ. Reports disagree because the world itself is different.    *)
(*        Example: Alice and Bob weigh different stones.                      *)
(*                                                                             *)
(*     2. Channel-level difference (I_1 != I_2). Two instruments read the    *)
(*        same world differently. The remedy is calibration.                 *)
(*        Example: two thermometers disagree at the same point.              *)
(*                                                                             *)
(*     3. Processing-level difference (nu_1 != nu_2). Two interpretations   *)
(*        of the same trace yield different conclusions.                      *)
(*        Example: Doppler shift read as moving source vs expanding universe.*)
(*                                                                             *)
(*   The chapter's moral: "Two reports disagreeing does not, by itself,     *)
(*   tell you which level is responsible. Locate the difference at the      *)
(*   right level."                                                              *)
(*                                                                             *)
(* This file formalizes each level as a record, and provides the diagnostic   *)
(* disjunction.                                                                *)
(*                                                                             *)
(* ============================================================================= *)

Require Import Library.
Require Import Traces.

(* ---------------------------------------------------------------------------- *)
(* 1.  World-level difference (W_1 != W_2)                                    *)
(* ---------------------------------------------------------------------------- *)

(* Two subject matters W_1 and W_2 are "different" when there is no          *)
(* procedure to identify their regions. The chapter: "two distinct stones,   *)
(* two historical events, two specific classical objects."                     *)

Record WorldDifference := {
  WD_W1 : SubjectMatter;
  WD_W2 : SubjectMatter;
  WD_genuine : WD_W1 <> WD_W2
}.

(* Caveat from the chapter: identical quantum particles are literally        *)
(* indistinguishable. World-level difference for such systems is the         *)
(* difference of spacetime region or quantum state, not of individual        *)
(* particles. We record this as a separate flag.                             *)

Record QuantumIndistinguishability := {
  QI_carrier : Type;
  QI_indistinguishable : True   (* witness that the particles are not       *)
                                  (* individuated                              *)
}.

(* A world-level difference for indistinguishable systems must be expressed   *)
(* via spacetime regions, not particle identities. We model the redirect as  *)
(* a separate constructor.                                                    *)

Inductive WorldDifferenceKind :=
  | WDK_Particles : WorldDifferenceKind
  | WDK_Regions   : WorldDifferenceKind.

(* Example from the chapter: Alice weighs stone A; Bob weighs stone B.        *)

Record StonesExample := {
  Stones_subject_A : SubjectMatter;
  Stones_subject_B : SubjectMatter;
  Stones_distinct : Stones_subject_A <> Stones_subject_B
}.

(* ---------------------------------------------------------------------------- *)
(* 2.  Channel-level difference (I_1 != I_2)                                   *)
(* ---------------------------------------------------------------------------- *)

(* Two instruments I_1 and I_2 read the same world differently. The remedy  *)
(* is calibration against each other, against an external standard, or via  *)
(* a third instrument to adjudicate.                                          *)

Record ChannelDifference := {
  CD_subject : SubjectMatter;
  CD_codomain : Codomain;
  CD_I1 : AccessFunction;
  CD_I2 : AccessFunction;
  CD_I1_src : AF_source CD_I1 = CD_subject;
  CD_I1_tgt : AF_target CD_I1 = CD_codomain;
  CD_I2_src : AF_source CD_I2 = CD_subject;
  CD_I2_tgt : AF_target CD_I2 = CD_codomain;
  CD_distinct : Prop      (* witness of map-distinctness (placeholder)        *)
}.

(* Co-location matters. The chapter: "If the thermometers are at different   *)
(* positions in a non-uniform temperature field... they may legitimately    *)
(* report different values, and that would be a world-level difference       *)
(* (different points in the field), not a channel-level one."                *)
(*                                                                             *)
(* We model co-location by tagging each instrument with a position in W.    *)

Record CoLocatedInstruments := {
  CL_subject : SubjectMatter;
  CL_codomain : Codomain;
  CL_I1 : AccessFunction;
  CL_I2 : AccessFunction;
  CL_I1_src : AF_source CL_I1 = CL_subject;
  CL_I1_tgt : AF_target CL_I1 = CL_codomain;
  CL_I2_src : AF_source CL_I2 = CL_subject;
  CL_I2_tgt : AF_target CL_I2 = CL_codomain;
  CL_position_I1 : Region CL_subject;   (* position at which I1 is placed    *)
  CL_position_I2 : Region CL_subject;   (* position at which I2 is placed    *)
  CL_same_position : CL_position_I1 = CL_position_I2
}.

(* When instruments are co-located, a difference in reading is a channel-    *)
(* level difference; when they are not, it is a world-level difference.     *)

Inductive ChannelDiagnosis :=
  | ChannelDiff_calibration_needed  (* co-located: difference is in the      *)
                                    (* instruments                            *)
  | ChannelDiff_position_different  (* not co-located: difference may be     *)
                                    (* world-level                            *)
  | ChannelDiff_resolved.           (* difference resolved by calibration    *)

(* Example from the chapter: two thermometers reading 20.01 and 20.02.       *)

Record ThermometersExample := {
  Therm_subject : SubjectMatter;
  Therm_codomain : Codomain;
  Therm_I1 : AccessFunction;
  Therm_I2 : AccessFunction;
  Therm_I1_src : AF_source Therm_I1 = Therm_subject;
  Therm_I1_tgt : AF_target Therm_I1 = Therm_codomain;
  Therm_I2_src : AF_source Therm_I2 = Therm_subject;
  Therm_I2_tgt : AF_target Therm_I2 = Therm_codomain;
  Therm_reading_I1 : Trace Therm_codomain;
  Therm_reading_I2 : Trace Therm_codomain;
  Therm_readings_distinct : Therm_reading_I1 <> Therm_reading_I2
}.

(* ---------------------------------------------------------------------------- *)
(* 3.  Processing-level difference (nu_1 != nu_2)                              *)
(* ---------------------------------------------------------------------------- *)

(* Two interpretations of the same trace yield different conclusions. The   *)
(* chapter: "the same Doppler-shifted spectrum is read by one physicist as   *)
(* evidence for a moving source, by another as evidence for an expanding    *)
(* universe."                                                                  *)

Record ProcessingDifference := {
  PD_subject : SubjectMatter;
  PD_codomain : Codomain;
  PD_access : AccessFunction;
  PD_src : AF_source PD_access = PD_subject;
  PD_tgt : AF_target PD_access = PD_codomain;
  PD_nu1 : Trace PD_codomain -> Prop;    (* first interpretation, as a      *)
                                         (* predicate over traces            *)
  PD_nu2 : Trace PD_codomain -> Prop;    (* second interpretation             *)
  PD_disagree : exists t : Trace PD_codomain, PD_nu1 t /\ ~ PD_nu2 t
}.

(* The chapter's caveat: "the equations of fundamental physics are true of   *)
(* the highly idealized model setups in which they were derived... and       *)
(* approximately true of many real systems, but often false of the messy,   *)
(* multifactorial, dappled world in which we actually use them."              *)
(* (Cartwright, *How the Laws of Physics Lie*.)                              *)

(* Silent upgrade between world-level and channel-level (or processing-       *)
(* level) is one of the chapter's standing category errors.                  *)

Definition silent_upgrade (P Q : Prop) : Prop := P -> Q.
(* A silent upgrade is the implication from one level to another. The       *)
(* chapter warns against silently drawing implications that are not earned.  *)

(* ---------------------------------------------------------------------------- *)
(* 4.  The diagnostic disjunction                                              *)
(* ---------------------------------------------------------------------------- *)

(* Given two disagreeing reports, the chapter's diagnostic picture is a     *)
(* three-way disjunction. We formalize it as an inductive type whose        *)
(* inhabitants are the three locations at which the difference can live.    *)

Inductive DisagreementKind :=
  | DK_World      : DisagreementKind   (* W_1 != W_2                            *)
  | DK_Channel    : DisagreementKind   (* I_1 != I_2                            *)
  | DK_Processing : DisagreementKind   (* nu_1 != nu_2                          *)
  | DK_Unknown    : DisagreementKind.  (* cannot yet tell                       *)

(* The chapter's boxed principle: "Two reports disagreeing does not, by     *)
(* itself, tell you which level is responsible."                             *)

Axiom disagreement_underdetermined :
  forall (s : SubjectMatter) (r : Codomain) (t1 t2 : Trace r),
    t1 <> t2 -> DisagreementKind.
(* The chapter says: disagreement does not, by itself, tell you which level. *)
(* We model the underdetermination axiomatically. Concrete proofs would     *)
(* require explicit evidence at one of the three levels.                    *)

(* The chapter's boxed discipline: "Locate the difference at the right       *)
(* level."                                                                      *)

Definition locate_difference (k : DisagreementKind) : Prop := True.
(* The discipline is to *ask* which level; this is a placeholder for the     *)
(* actual diagnosis.                                                           *)

(* ---------------------------------------------------------------------------- *)
(* 5.  Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes:                                                       *)
(*   - WorldDifference, with the quantum-indistinguishability caveat.        *)
(*   - ChannelDifference, with the co-location check.                        *)
(*   - ProcessingDifference, with the cartwrightian caveat.                  *)
(*   - The diagnostic disjunction (DK_World, DK_Channel, DK_Processing).     *)
(*   - The principles: disagreement is underdetermined; locate the difference*)
(*     at the right level.                                                     *)
(*                                                                             *)
(* The file depends on Library.v and Traces.v.                                 *)
(*                                                                             *)
(* ============================================================================= *)
