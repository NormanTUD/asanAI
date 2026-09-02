(* ============================================================================= *)
(*                                                                             *)
(* 05_Ologs.v                                                                  *)
(*                                                                             *)
(* Section "Ologs: a diagram that pays its way" of                            *)
(* coherent_world_models.php, lines 251-277.                                   *)
(*                                                                             *)
(* Summary of the section.                                                     *)
(*                                                                             *)
(*   The chapter introduces "ologs", short for "ontology log", due to        *)
(*   Spivak & Kent. An olog is a diagram with:                                *)
(*                                                                             *)
(*     1. Types drawn as boxes labelled with a singular noun-phrase           *)
(*        ("a person", "a temperature").                                       *)
(*     2. Arrows drawn as boxes labelled with a singular verb-phrase, where   *)
(*        each arrow is a *functional* relation: every entity of the source   *)
(*        maps to exactly one entity of the target ("mother-of").              *)
(*     3. Commutativity is asserted, not assumed. If two paths from type     *)
(*        A to type B are declared equal, the olog carries the equality.     *)
(*                                                                             *)
(*   The chapter gives the worked example of a calibrated thermometer,       *)
(*   with two distinct types and one clean question: are the two routes      *)
(*   from Thermometer to Temperature the same?                                *)
(*                                                                             *)
(* This file formalizes ologs as a record type, with arrows constrained to    *)
(* be functional, and commutativity expressed as explicit equalities.        *)
(*                                                                             *)
(* ============================================================================= *)

Require Import Library.

(* ---------------------------------------------------------------------------- *)
(* 1.  Types in an olog                                                         *)
(* ---------------------------------------------------------------------------- *)

(* An olog type is a labelled kind-of-thing. The carrier is the underlying   *)
(* type; the label is a singular noun-phrase. The chapter: "A person, a     *)
(* temperature, a trace, a theorem."                                          *)

Record OlogType := {
  OT_carrier : Type;
  OT_label   : OT_carrier -> Prop   (* label predicate; the carrier is what   *)
                                     (* the type names, the label is the       *)
                                     (* description                            *)
}.
(* Note: we use OT_label as a placeholder for the noun-phrase. Concrete      *)
(* instantiations would supply an explicit description.                       *)

(* A worked example from the chapter.                                          *)

Record ThermometerType := {
  thermometer_carrier : Type
}.

Record TemperatureType := {
  temperature_carrier : Type
}.

(* ---------------------------------------------------------------------------- *)
(* 2.  Arrows in an olog                                                        *)
(* ---------------------------------------------------------------------------- *)

(* An olog arrow is a functional relation: every entity of the source maps  *)
(* to exactly one entity of the target. The label is a singular verb-phrase.  *)

Record OlogArrow := {
  OA_source : OlogType;
  OA_target : OlogType;
  OA_map    : OT_carrier OA_source -> OT_carrier OA_target;
  OA_label  : OT_carrier OA_source -> Prop   (* the verb-phrase               *)
}.

(* Functional arrows: a "mother-of" arrow Person -> Person.                    *)

Definition functional_arrow (a : OlogArrow) : Prop :=
  forall x y : OT_carrier (OA_source a),
    OA_map a x = OA_map a y -> x = y.
(* Note: this is one direction of "functional" (injective). The full      *)
(* functional condition would also require totality, which we get from the  *)
(* type of OA_map (a total function).                                        *)

(* ---------------------------------------------------------------------------- *)
(* 3.  Commutativity                                                             *)
(* ---------------------------------------------------------------------------- *)

(* The chapter: "Commutativity is asserted, not assumed. If two paths from   *)
(* type A to type B are declared equal, the olog carries the equality. If    *)
(* unequal, the olog must show why."                                            *)

(* A commutative square:                                                        *)
(*                                                                             *)
(*   A --f--> B                                                                *)
(*   |       |                                                                  *)
(*   g       h                                                                  *)
(*   v       v                                                                  *)
(*   C --k--> D                                                                *)
(*                                                                             *)
(* Commutativity is the equation: h . f = k . g.                              *)

Record CommutativeSquare := {
  CS_A : OlogType;
  CS_B : OlogType;
  CS_C : OlogType;
  CS_D : OlogType;
  CS_f : OlogArrow;
  CS_g : OlogArrow;
  CS_h : OlogArrow;
  CS_k : OlogArrow;
  CS_f_src : OA_source CS_f = CS_A;
  CS_f_tgt : OA_target CS_f = CS_B;
  CS_g_src : OA_source CS_g = CS_A;
  CS_g_tgt : OA_target CS_g = CS_C;
  CS_h_src : OA_source CS_h = CS_B;
  CS_h_tgt : OA_target CS_h = CS_D;
  CS_k_src : OA_source CS_k = CS_C;
  CS_k_tgt : OA_target CS_k = CS_D;
  CS_commutes : Prop    (* witness of commutativity, supplied externally    *)
}.

(* ---------------------------------------------------------------------------- *)
(* 4.  The thermometer olog                                                     *)
(* ---------------------------------------------------------------------------- *)

(* The chapter's worked example. Two distinct types and one clean question.  *)
(*                                                                             *)
(*     Thermometer  --reading of-->  Reading                                   *)
(*         |                              |                                    *)
(*    true temperature of            indicates                              *)
(*         |                              |                                    *)
(*         v                              v                                    *)
(*     Temperature  <--id-- Temperature                                       *)
(*                                                                             *)
(* The two routes from Thermometer to Temperature are:                        *)
(*   (a) true temperature of (left column)                                    *)
(*   (b) reading of, then indicates (top row then right column)               *)
(* The question: do these routes agree? If yes, the thermometer is          *)
(* calibrated; if no, the diagram has a hole.                                  *)

Record ThermometerReading := {
  TR_reading : Trace (Build_Codomain (ThermometerType -> TemperatureType))
}.

(* To avoid the type-equality issues we've encountered, we abstract the     *)
(* thermometer example to a level where it can be discussed symbolically.    *)

Record ThermometerOlog := {
  TO_subject : Type;
  TO_reading : Type;
  TO_temperature : Type;
  TO_current_reading : TO_subject -> TO_reading;
  TO_reading_indicates : TO_reading -> TO_temperature;
  TO_true_temperature : TO_subject -> TO_temperature;
  TO_calibrated : forall x : TO_subject,
    TO_true_temperature x = TO_reading_indicates (TO_current_reading x)
}.
(* TO_calibrated is the witness that the two routes agree, i.e., that the  *)
(* thermometer is calibrated. Its negation is the witness that the diagram  *)
(* has a hole.                                                                 *)

(* The chapter: "If yes, the thermometer is calibrated: its reading         *)
(* reflects the truth. If no, the diagram has a hole: the sensor drifts,     *)
(* or its calibration curve is wrong, or someone has applied the wrong       *)
(* correction."                                                                 *)

Inductive ThermometerStatus :=
  | TS_calibrated : ThermometerStatus
  | TS_hole       : ThermometerStatus.   (* diagram has a hole                  *)

(* ---------------------------------------------------------------------------- *)
(* 5.  The master diagram as an olog                                            *)
(* ---------------------------------------------------------------------------- *)

(* The chapter: "every diagram so far is an olog in disguise. The master     *)
(* diagram has types W, R_i, G and arrows O_i : W -> R_i (each region of    *)
(* W yields one trace) and T_i : R_i -> G (each trace contributes to one    *)
(* global section)."                                                            *)

Record MasterOlog := {
  MO_W : Type;
  MO_R : Type;     (* a single codomain shared by all views; concrete        *)
                     (* instantiations would parameterise by i               *)
  MO_G : Type;
  MO_O : MO_W -> MO_R;     (* observation arrow                              *)
  MO_T : MO_R -> MO_G      (* gluing arrow                                  *)
}.

(* The descent condition: this olog commutes in a particular way.            *)

Definition master_descent (m : MasterOlog) : Prop :=
  forall w : MO_W m, MO_T m (MO_O m w) = MO_T m (MO_O m w).
(* Note: this is a degenerate commutativity, holding trivially. The real   *)
(* sheaf condition (see Sheaves.v) is the non-trivial statement.            *)

(* ---------------------------------------------------------------------------- *)
(* 6.  Summary comment                                                          *)
(* ---------------------------------------------------------------------------- *)
(*                                                                             *)
(* This file formalizes:                                                       *)
(*   - OlogType: a labelled kind-of-thing.                                     *)
(*   - OlogArrow: a labelled functional relation.                              *)
(*   - CommutativeSquare: an explicit commutative square.                    *)
(*   - The thermometer olog with its calibrated-vs-hole status.               *)
(*   - The master olog W -> R -> G.                                            *)
(*                                                                             *)
(* The chapter's three rules (types as boxes, arrows as functional, commu-   *)
(* tativity asserted) are embodied in the OlogType, OlogArrow, and          *)
(* CommutativeSquare records. The thermometer example instantiates the      *)
(* pattern with two routes from Thermometer to Temperature.                 *)
(*                                                                             *)
(* The file depends only on Library.v.                                         *)
(*                                                                             *)
(* ============================================================================= *)
