# Offene Arbeiten aus `intuition_learnsys_todo2`

Status: `[done]` erledigt, `[in work]` aktuell, `[pending]` offen.
Aktueller Stand: 32 Folien, inklusive zwei Geschichtsfolien vor dem Chinesischen Zimmer.
Nach dem geplanten Embedding-Merge: 29. Das Auffüllen auf 31 bleibt offen,
bis du sagst, womit gefüllt werden soll.

## Bereits erledigt (schnelle Schritte)
- [done] „Ein Block: Attention, dann FFN“ entfernt.
- [done] „Text rein, Geometrie, ein Wort raus“ entfernt.
- [done] „Eine Schicht, dann der Stapel“ direkt hinter „Die Bausteine“ verschoben.
- [done] „Die kausale Matrix und die Heads“ an das Ende der Attention-Folgen verschoben.
- [done] Trajektorien-Text ergänzt: „ the“ ist Top-Vorhersage, „Paris“ liegt schon nahe; echte GPT-2-Messungen.
- [done] Sprachbeispiele auf „Sonnenblumen sind die besten Blumen“ umgestellt.
- [done] Pfeiltasten gehen in „Dieselbe Schleife, viele Sprachen“ durch die Beispiele.
- [done] Chinesisches Zimmer: größere, besser lesbare Glyphen.
- [done] Attention-Demo: die ausgewählten Sätze schreiben ihre echten Wörter in Token-Zeile, Matrix und Formel; die Bank-Zeile wird pro Kontext ausgewählt.
- [done] Automatische Weiter-/Zurück-Tasten gehen durch alle endlichen Demo-Schritte (Tokenizer 9, Blöcke 5, Sprachen 6, FFN 2, Trajektorie 13, MLP 9, Geschichte 3/5).
- [done] 1D→2D-Übergang in „Zwei Beispiele, ein Durchschnitt“ weich geblendet (Achse, Gitter, Gruppen, Pfade).
- [done] Zwei Geschichtsfolien aus `history.php` vor dem Chinesischen Zimmer ergänzt: „Vom Perzeptron zur XOR-Krise“ und „Backpropagation und die Rückkehr“ (Rosenblatt, Minsky/Papert, Lighthill, Linnainmaa, Rumelhart et al.).

## Als Nächstes (schnell → langsam)
1. [pending] „Jeder Platz bekommt einen Fingerabdruck“: grünen „Großkreis“-Punkt entfernen, Euklid entfernen, klarstellen, dass das „Wort“ ein hochdimensionaler Vektor ist; mit Weiter durch Dimensionen und Kontext gehen.
2. [pending] „Text wird zu IDs“: Beispiele erst zentriert, dann BPE mehrstufig; Pfeiltasten für beide; Black Cat als zwei Emojis; UTF-8-/Join-Box verlinken.
3. [pending] Attention-Folie umbenennen („Attention zieht jedes Token an seinen Platz“), Kausalmaske optional, Aufmerksamkeitsgraph aus `../test/attention_as_graph.html` am Ende einbauen.
4. [in work] Sinnvolle Polysem-Sätze, gleiche Länge, unterschiedliche Tokens; Klick aktualisiert Matrix und Wortauswahl; Vektor-Erinnerung. Die Sätze und die Matrix sind umgesetzt; die Vektor-Erinnerung bleibt zu prüfen.
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
15. [in work] Zwei Geschichtsfolien aus `history.php` sind ergänzt. Das Auffüllen auf 31 wartet auf deine Vorgabe.

## Später / bewusst zurückgestellt
- [pending] Weitere Geschichtsbilder aus `history.php` (Perzeptron, Rosenblatt, XOR, Backprop) prüfen und credits ergänzen; die aktuelle Fassung nutzt Text und zwei eigene Schemata.
- [pending] Finale Folienzahl 31 festlegen (aktuell 32, nach Merge 29).
