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

- [done] Die separate Unterfolie „Jede Schicht baut auf der vorherigen auf“
  wurde wieder entfernt. Der Schichten-Inhalt steht jetzt in „Eine Kette von
  Funktionen“: Kurztext, Beobachte-Text mit Formel und Residual-Stream-Hinweis
  sowie eine Daten-Box.
- [done] Der Beobachte-Text rendert `$$…$$` mit Temml und `<i>…</i>` als
  Kursivtext.
- [done] Die Daten haben jetzt eine eigene Unterfolie vor der Architektur
  („Daten: der erste Schritt, aber extern“) und sind ausdrücklich nicht Teil
  des LLM, sondern Input für das Training.
- [done] Daten-Unterfolie zeigt Training, Korpus, Datenmenge und
  Menschenfragen; die Architektur-Unterfolie beginnt beim Tokenizer und zeigt
  fünf Schritte ohne Datenstation.
- [done] Die Bausteine-Folie endet nach Daten und Architektur; eine eigene
  Folie „Die nächsten Tage“ zeigt den Fahrplan und die fünf Ebenen als Ausblick.
- [pending] EN- und DE-Fassung gemeinsam prüfen; keine Englisch-Reste auf der
  deutschen Seite.
- [pending] Quellen und Begriffe mit der restlichen Transformer-Folge
  abstimmen (Attention, FFN, Residual Stream).
