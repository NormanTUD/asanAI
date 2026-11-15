# Schichten: Konzept und offene Arbeit

Status: `[pending]` offen, `[in work]` aktuell, `[done]` erledigt.

## Die Idee, die sichtbar werden soll

Ein LLM rechnet nicht in einem einzigen Schritt. Es verkettet Schichten:

1. Die erste Schicht arbeitet direkt auf den Daten.
2. Die zweite Schicht arbeitet auf dem Ergebnis der ersten.
3. Die dritte Schicht arbeitet auf dem Ergebnis der zweiten, und so weiter.
4. Unterschiedliche Schichten übernehmen unterschiedliche Aufgaben
   nacheinander: Muster erkennen, Kontext verknüpfen, Ausgabe vorbereiten.
5. Jede Schicht nutzt die Ergebnisse der vorherigen, statt von vorn zu
   beginnen. Deshalb wird die Darstellung mit jeder Stufe reicher.

Wichtig für die Formulierung: Das ist eine Architekturentscheidung, keine
Naturkonstante. Schichten kann man austauschen, wiederholen oder überspringen.
Im Transformer werden Updates über Residualverbindungen addiert, nicht einfach
überschrieben; das gehört als spätere Präzisierung dazu.

## Aktueller Stand

- [in work] Neue Unterfolie „Jede Schicht baut auf der vorherigen auf“ in
  `intuition_learnsys-data.js` vor den sechs Stationen der Bausteine-Folie.
  Demo: `stack` mit `mode: "pipeline"`.
- [pending] Prüfen, ob die Demo die Verkettung wirklich zeigt oder ob eine
  eigene, ruhigere Schichten-Visualisierung nötig ist.
- [pending] Die sechs Stationen danach als konkrete Ausprägung derselben Idee
  anschließen.
- [pending] EN- und DE-Fassung gemeinsam prüfen; keine Englisch-Reste auf der
  deutschen Seite.
- [pending] Quellen und Begriffe mit der restlichen Transformer-Folge
  abstimmen (Attention, FFN, Residual Stream).
