Require Import Library.
Record T (r : Codomain) := { f : AccessFunction }.

Definition test3 (s : SubjectMatter) (r : Codomain) : Prop :=
  forall pt : T r, AF_source (f pt) = s.
Check test3.
