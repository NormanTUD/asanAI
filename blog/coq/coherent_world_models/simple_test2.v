Require Import Library.
Record T (r : Codomain) := { f : AccessFunction }.

Definition test (r : Codomain) : Prop :=
  exists (pt : T r), True.
Check test.

Definition test2 (s : SubjectMatter) (r : Codomain) (t : Trace r) : Prop :=
  exists (pt : T r), AF_source (f pt) = s.
Check test2.
