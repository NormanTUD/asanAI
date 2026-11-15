# LearnSys: offene Arbeiten

Status: `[pending]` offen, `[in work]` aktuell, `[done]` erledigt.
Diese Liste sammelt alles aus dem laufenden Chat, damit nichts verloren geht.

## 1. Ceres-Folie und Daten-Abschnitt

- [done] Bilder in der Ceres-Folie (`assets/img/ceres.jpg`,
  `assets/img/flammarion.jpg`) sollen während des Ladens einen Spinner zeigen,
  nicht kurz leer erscheinen.
- [done] Ceres-Folie in den Daten-Abschnitt einordnen, nicht zu den
  Bausteinen. Schritt in der Leiste: „Gauß, Ceres und die Daten“ zwischen
  „Bausteine eines LLM“ und „Viele Sätze, eine Wahrheit“.
- [done] Titel prüfen: Die Folie wird im Browser teilweise als „Die
  Bausteine eines LLM“ angezeigt. Ursache ist sehr wahrscheinlich das alte
  indexbasierte Text-Overlay aus `new_texts.json` (Schlüssel `2.0` zeigt nach
  der Umsortierung auf die Ceres-Folie). Overlay migrieren oder invalidieren,
  danach den richtigen Titel der Ceres-Folie sicherstellen.
- [done] Entscheiden, ob die Ceres-Folie als eigener Schritt im
  Daten-Abschnitt bleibt oder eine Unterfolie der Datenfolie wird. Danach
  Reihenfolge in `steps` und ggf. `substeps` anpassen.

## 2. Bausteine und Schichten

- [done] „Die Bausteine eines LLM“ bekommt vor den sechs Stationen eine
  zweite innere Unterfolie „Jede Schicht baut auf der vorherigen auf“.
  Inhalt: erste Schicht arbeitet direkt auf den Daten, zweite auf dem Ergebnis
  der ersten, usw.; unterschiedliche Aufgaben nacheinander; jede Schicht nutzt
  die Ergebnisse der vorherigen. Demo: `stack` mit `mode: "pipeline"`.
- [done] Neue Unterfolie in EN und DE visuell prüfen, inklusive Demo,
  Quellen und Höhe.
- [done] `todo_schichten.md` als eigene Konzept-/Arbeitsliste angelegt
  (Schichten, Stream, Residual, Aufgabenverteilung).

## 3. Bedienung und Text

- [done] Unten nur noch „Zurück“, „Weiter“ und „Text bearbeiten“/„Fertig“.
  Pfeil-Buttons unten entfernt; „Tiefe“ unten entfernt.
- [done] „Zurück“ und „Weiter“ sind grün, fest am unteren Seitenrand, und als Textbuttons sofort sichtbar.
- [done] „Der Kurztext oben ist der Einstieg …“ entfernt.
- [done] Gibt es nur eine Frage, wird sie automatisch geöffnet.
- [done] Leere Quellen- und Fragegruppen werden im Lesemodus nicht angezeigt
  (kein „Quellen 0“).
- [done] Im Editor lassen sich Quellen auch dann hinzufügen, wenn die Folie
  noch keine Quellengruppe hat („+ Quellen“).
- [done] „Frage“/„Trivia“-Badge (`.ls-qkind`) entfernt; die Fragezeile zeigt nur den Titel.
- [pending] Beide Sprachen und schmale Viewports prüfen; keine
  Höhensprünge und keine Konsolenfehler.

## 4. Validierung

- [pending] `node --check` für `learnsys.js`, `intuition_learnsys-data.js` und
  alle geänderten Demo-Dateien.
- [pending] `uv run blog/tests/tenminutes_pages_test.py --pages
  intuition_learnsys.php --langs en,de`.
- [pending] `uv run blog/tests/learnsys_browser_test.py` (nach Anpassung des
  Tiefe-Buttons).
- [pending] `uv run blog/tests/tenminutes_height_test.py --pages
  intuition_learnsys.php --langs en,de --viewports desktop,mobile --monkey 4`.
- [pending] `git diff --check` und Sichtprüfung der geänderten Folien.
