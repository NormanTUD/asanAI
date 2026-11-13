# Offene Arbeiten aus `intuition_learnsys_todo2`

Status: `[done]` erledigt, `[in work]` aktuell, `[pending]` offen.
Aktueller Stand: 29 Folien. „Was ist ein LLM?“ und „KI-Chat“ sind eine Folie mit
aufeinanderfolgender Suche-und-Chat-Demo; die Tier-Folie wurde entfernt. Das Auffüllen auf 31 bleibt offen.

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
- [done] Automatische Weiter-/Zurück-Tasten gehen durch alle endlichen Demo-Schritte (Tokenizer 8, Blöcke 5, Sprachen 6, FFN 2, Trajektorie 13, MLP 9, Geschichte 10).
- [done] 1D→2D-Übergang in „Zwei Beispiele, ein Durchschnitt“ weich geblendet (Achse, Gitter, Gruppen, Pfade).
- [done] Geschichte als eine Folie mit zehn Tabs aus `history.php` umgesetzt: Wolfsknochen, Salamis-Tafel, Logik, Maschinen, Neuron, Perzeptron/XOR, Backprop, Deep Learning, Transformer, GPT.
- [done] Beim Perzeptron/XOR-Tab stehen Mark-I-Bild und Minsky-Bild übereinander, darunter das XOR-Schema.
- [done] „Vier Paare, drei Achsen“ entfernt; die Pfeil-Übertragung steht jetzt bei König/Königin.
- [done] Attention-Sätze auf „Ich gehe zur Bank“, „Ich bringe mein Geld auf die Bank“, „Ich sitze im Park auf der Bank“ umgestellt und die Texte gekürzt.
- [done] FFN-Folie: Punkte als „Burg · Turm · König“ und „Mechanik · Tür · öffnen“ benannt; das FFN ist ausdrücklich ein MLP pro Token und trennt verworrene Strukturen.
- [done] KI-Chat fragt nach der Google-Zusammenfassung und sagt, dass beide dieselbe Technik nutzen.
- [done] Code-Szene tippt die Nutzerfrage über ca. 2 s, zeigt Syntaxfarben und gibt den f-String „Blau wird 4.35× stärker gestreut als Rot.“ aus.
- [done] „Modelle“ zeigt Daten, echte Funktion, Modellfit, Fehlerlinien und einen Trainieren-Button.
- [done] „Text wird zu IDs“ hat zwei Modi auf einer Folie: Trennung und echtes BPE über vier Merge-Stufen; Datenabhängigkeits-Box ergänzt.
- [done] Performance: Modell-Loop stoppt nach dem Fit, Höhenmessung läuft idle, Geschichtsbilder lazy; Chromium-Profil erstellt.
- [done] „Was ist ein LLM?“ und „KI-Chat“ zu einer Folie zusammengeführt; die Phone-Demo zeigt erst die Suche, dann den Chat.
- [done] „Modelle“ zeigt sechs Schritte: Daten, Modell, Loss, Update 1, Update 2, Fit; mit Loss-Inset, Fehlerlinien und Vorhersage-Sonde.

## Als Nächstes (schnell → langsam)
1. [pending] „Jeder Platz bekommt einen Fingerabdruck“: grünen „Großkreis“-Punkt entfernen, Euklid entfernen, klarstellen, dass das „Wort“ ein hochdimensionaler Vektor ist; mit Weiter durch Dimensionen und Kontext gehen.
2. [pending] „Text wird zu IDs“: Beispiele erst zentriert, dann BPE mehrstufig; Pfeiltasten für beide; Black Cat als zwei Emojis; UTF-8-/Join-Box verlinken.
3. [pending] Attention-Folie umbenennen („Attention zieht jedes Token an seinen Platz“), Kausalmaske optional, Aufmerksamkeitsgraph aus `../test/attention_as_graph.html` am Ende einbauen.
4. [done] Sinnvolle Polysem-Sätze mit kurzen, unterschiedlichen Tokens; Klick aktualisiert Matrix, Wortauswahl und Vektor.
5. [pending] „Die kausale Matrix und die Heads“: Formeln mit Temml setzen, Inhalt als Attention-Unterschritt schärfen.
6. [pending] „Weiche Kurven, ein Knick“: Kurven einzeln per Weiter, Morph, Vor-/Nachteile, ReLU-Detail in Optionalbox.
7. [pending] „Sieh zu, wie das MLP den Raum biegt“: Button-Stil vereinheitlichen; Text darf nicht hinter dem Canvas verschwinden.
8. [done] „Ein Muster passt, ein Wert wird geschrieben“: Punkte als Burg/Turm/König und Mechanik/Tür/öffnen benannt; das FFN ist ausdrücklich ein MLP pro Token und trennt verworrene Strukturen.
9. [pending] Embedding-Sammelfolie: „Zwei Beispiele“, „zweite Achse“, „Eine Richtung“, „Drei Dimensionen“, „Eine Beziehung“ mit internen Weiter-Schritten zusammenlegen.
10. [pending] „Die Bausteine eines LLM“: bewegten Punkt entfernen; Blöcke nacheinander, links Block, rechts Erklärung; LayerNorm u. a. in Optionalbox; Attention/FFN/Iteration/Winkel/Softmax erklären.
11. [pending] „Jede Schicht schreibt in denselben Stream“: klare, schöne Visualisierung; jeder Layer schreibt, Attention und FFN sind Sublayer; Gesamtraum als Optionalbox.
12. [pending] „Von Logits zu einer Verteilung“: Overlay beheben; interaktiv und visuell auf das Niveau der anderen Folien bringen.
13. [pending] Sprachfolie: Datenqualität visualisieren, Caveat in Optionalbox, mehr zu Filtern/Dedupe/Decontamination recherchieren.
14. [pending] Chinesisches Zimmer: mehr Philosophie ergänzen (Searle, Systems Reply, Symbol Grounding, LLM-Bezug).
15. [in work] Die Geschichte ist als Zehn-Tab-Folie umgesetzt. Das Auffüllen auf 31 wartet auf deine Vorgabe.

## Später / bewusst zurückgestellt
- [pending] Weitere Geschichtsbilder aus `history.php` prüfen und Credits ergänzen; die aktuelle Fassung nutzt Wolfsknochen, Salamis-Tafel, Llull, Leibniz, Pitts, Mark I, Minsky, Rosenblatt und Transformer.
- [pending] Finale Folienzahl 31 festlegen (aktuell 29).
