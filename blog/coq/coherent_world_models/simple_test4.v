Require Import Library.
Record T := { f : AccessFunction }.

Definition test4 (s : SubjectMatter) : Prop :=
  forall pt : T, AF_source (f pt) = s.
Check test4.
