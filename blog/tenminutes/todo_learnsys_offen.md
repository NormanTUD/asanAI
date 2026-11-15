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

- [done] Die zwischenzeitliche Unterfolie „Jede Schicht baut auf der
  vorherigen auf“ wurde wieder entfernt. Der Inhalt steht jetzt in „Eine Kette
  von Funktionen“ (Kurztext, Beobachte-Text, Daten-Box).
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

## 5. Neue Wünsche aus dem Chat

- [done] Code-Demo: Terminalfenster vergrößern, sodass die vollständige
  Antwort hineinpasst. Prüfen, ob die englische Fassung sauber übersetzt ist
  und in beiden Sprachfenstern ein jeweils passendes Modell verwendet wird.
- [done] „Eine Kette von Funktionen“: klarer machen, dass die Daten eine
  eigene Unterseite sind. Die Daten sind keine Schicht der Architektur; sie
  stehen davor und werden zum Training der Architektur verwendet.
- [done] „Beobachte“ auf derselben Folie: `$$…$$` mit Temml rendern und
  `<i>…</i>` als Kursivtext ausgeben. Der Text mit den Schichten und dem
  Residual Stream darf nicht als Rohtext erscheinen.
- [done] Unterfolie „Jede Schicht baut auf der vorherigen auf“ wieder
  entfernt. Den Schichten-Inhalt in „Eine Kette von Funktionen“ integrieren.
- [done] „Gauß, Ceres und die Daten“: beim Weiterblättern links nichts neu
  rendern, wenn sich der Inhalt nicht geändert hat.
- [pending] Tests erst ausführen, wenn der Nutzer es ausdrücklich sagt.
  Bekannt: `learnsys_browser_test.py` meldet derzeit „day morph finishes“.

## 6. Ceres-Bilder, neue Texte und Wahrheitsplot

- [done] Flammarion-Holzschnitt und Ceres-Bild tauschen: links Flammarion,
  rechts Ceres.
- [done] Hinweis „Synthetische Daten, nicht Piazzis Messungen …“ erst zeigen,
  wenn der Plot sichtbar ist (nicht in der Intro-Bildansicht).
- [done] Neue Texte aus `new_texts.json` für die ersten Folien übernehmen:
  `0.0`, `1.0` (Architektur) und `2.0` (Gauß, Ceres und die Daten).
- [done] Wahrheitsplot „Viele Sätze, eine Wahrheit“: Satz 2 knapp unter die
  Kurve, Satz 4 als unsichere, aber wahre Aussage, Satz 5 weiter weg mit rotem
  X.
- [done] Schichtenformel im Beobachte-Text von `$$…$$` auf `$…$` umgestellt.
- [done] „Ceres“ im Ceres-Text fett statt kursiv; nur das Wort ist hervorgehoben.
- [pending] Nach der Übernahme prüfen, ob die Gruppen und Teasers in EN/DE
  konsistent sind; Tests erst auf Anweisung.
- [done] Daten als eigene Unterfolie vor der Architektur innerhalb derselben
  Bausteine-Folie: „Daten: der erste Schritt, aber extern“, danach
  „Die Architektur von LLMs“, danach die Übersicht. Daten sind ausdrücklich
  nicht Teil des LLM, sondern Input für das Training.
- [done] Daten-Unterfolie: Training mit vielen Beispielen erklärt; langer
  HTML-/Nietzsche-Korpus, Datenmenge und Menschenfragen als sichtbare
  Beobachte-/Scroll-Karten (Cues) ergänzt. Menschenfragen sind prozentual kleiner; Wikipedia liefert Fakten,
  Frage-Antwort-Daten liefern das Antwortformat; erst großes, dann kleines
  Training.
- [done] Bausteine-Demo zeigt jetzt fünf Architektur-Schritte ohne Datenstation;
  die Architektur-Unterfolie beginnt beim Tokenizer.
- [done] Unterfolie „Die Bausteine im Überblick“ (3/3) entfernt; die Bausteine-Folie
  hat jetzt nur noch Daten und Architektur (2/2).
- [done] Der Ausblick „Die nächsten Tage“ ist jetzt eine eigene dritte
  Unterfolie nach der Architektur (nach dem Unembedding).
- [done] Ceres-/Flammarion-Bilder ohne weißen Rahmen und ohne Boxen: nur die
  Bilder mit abgerundeten Ecken auf dem Hintergrund, Quellen als schlichter
  Text darunter.
- [done] `<i>Ceres</b>` in `new_texts.json` zu `<b>Ceres</b>` korrigiert.
- [done] Beim Revisionswechsel wird auch der gespeicherte Folienstand
  zurückgesetzt, damit die neue Daten-Unterfolie nach dem Laden als 1/2
  sichtbar ist und nicht die alte Architektur-Position stehen bleibt.
- [done] Daten-Unterfolie nennt jetzt ausdrücklich Wikipedia, Reddit, Bücher,
  Webseiten und Quellcode sowie „extrem viele Daten“, damit klar wird, was das
  Modell wie vorhersagen lernt. Die GPT-3-spezifische Mischung ist durch eine
  allgemeine Beschreibung ersetzt.
