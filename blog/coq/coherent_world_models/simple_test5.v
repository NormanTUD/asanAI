Require Import Library.
Record T (r : Codomain) := { f : AccessFunction }.

Definition test5 (s : SubjectMatter) (r : Codomain) : Prop :=
  forall pt : T r, AF_source (@f r pt) = s.
Check test5.
