# Offene Arbeiten aus `intuition_learnsys_todo2`

Status: `[done]` erledigt, `[in work]` aktuell, `[pending]` offen.
Aktueller Stand: 30 Folien nach den schnellen Streichungen/Umstellungen.
Nach dem geplanten Embedding-Merge: 27. Geschichtsfolien und Auffüllen auf 31
kommen erst, wenn du sagst, wie gefüllt werden soll.

## Bereits erledigt (schnelle Schritte)
- [done] „Ein Block: Attention, dann FFN“ entfernt.
- [done] „Text rein, Geometrie, ein Wort raus“ entfernt.
- [done] „Eine Schicht, dann der Stapel“ direkt hinter „Die Bausteine“ verschoben.
- [done] „Die kausale Matrix und die Heads“ an das Ende der Attention-Folgen verschoben.
- [done] Trajektorien-Text ergänzt: „ the“ ist Top-Vorhersage, „Paris“ liegt schon nahe; echte GPT-2-Messungen.
- [done] Sprachbeispiele auf „Sonnenblumen sind die besten Blumen“ umgestellt.
- [done] Pfeiltasten gehen in „Dieselbe Schleife, viele Sprachen“ durch die Beispiele.
- [done] Chinesisches Zimmer: größere, besser lesbare Glyphen.

## Als Nächstes (schnell → langsam)
1. [pending] „Jeder Platz bekommt einen Fingerabdruck“: grünen „Großkreis“-Punkt entfernen, Euklid entfernen, klarstellen, dass das „Wort“ ein hochdimensionaler Vektor ist; mit Weiter durch Dimensionen und Kontext gehen.
2. [pending] „Text wird zu IDs“: Beispiele erst zentriert, dann BPE mehrstufig; Pfeiltasten für beide; Black Cat als zwei Emojis; UTF-8-/Join-Box verlinken.
3. [pending] Attention-Folie umbenennen („Attention zieht jedes Token an seinen Platz“), Kausalmaske optional, Aufmerksamkeitsgraph aus `../test/attention_as_graph.html` am Ende einbauen.
4. [pending] Sinnvolle Polysem-Sätze, gleiche Länge, unterschiedliche Tokens; Klick aktualisiert Matrix und Wortauswahl; Vektor-Erinnerung.
5. [pending] „Die kausale Matrix und die Heads“: Formeln mit Temml setzen, Inhalt als Attention-Unterschritt schärfen.
6. [pending] „Weiche Kurven, ein Knick“: Kurven einzeln per Weiter, Morph, Vor-/Nachteile, ReLU-Detail in Optionalbox.
7. [pending] „Sieh zu, wie das MLP den Raum biegt“: Button-Stil vereinheitlichen; Text darf nicht hinter dem Canvas verschwinden.
8. [pending] „Ein Muster passt, ein Wert wird geschrieben“: Trennebene korrigieren; als Visualisierung der Idee kennzeichnen.
9. [pending] Embedding-Sammelfolie: „Zwei Beispiele“, „zweite Achse“, „Eine Richtung“, „Drei Dimensionen“, „Eine Beziehung“ mit internen Weiter-Schritten zusammenlegen.
10. [pending] „Die Bausteine eines LLM“: bewegten Punkt entfernen; Blöcke nacheinander, links Block, rechts Erklärung; LayerNorm u. a. in Optionalbox; Attention/FFN/Iteration/Winkel/Softmax erklären.
11. [pending] „Jede Schicht schreibt in denselben Stream“: klare, schöne Visualisierung; jeder Layer schreibt, Attention und FFN sind Sublayer; Gesamtraum als Optionalbox.
12. [pending] „Von Logits zu einer Verteilung“: Overlay beheben; interaktiv und visuell auf das Niveau der anderen Folien bringen.
13. [pending] Sprachfolie: Datenqualität visualisieren, Caveat in Optionalbox, mehr zu Filtern/Dedupe/Decontamination recherchieren.
14. [pending] Chinesisches Zimmer: mehr Philosophie ergänzen (Searle, Systems Reply, Symbol Grounding, LLM-Bezug).
15. [pending] Zwei Geschichtsfolien vor der Philosophie und Auffüllen auf 31 — warten auf deine Vorgabe zur Füllung.

## Später / bewusst zurückgestellt
- [pending] Zwei Geschichtsfolien mit 5–10 Bildern aus `history.php` (Perzeptron, Rosenblatt, XOR, Backprop/Cauchy/Werbos/Lagrange, Mendel).
- [pending] Finale Folienzahl 31 festlegen (aktuell 30, nach Merge 27).
