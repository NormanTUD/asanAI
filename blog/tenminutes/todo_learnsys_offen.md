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
- [done] Daten-Unterfolie heißt nur noch „Daten“ und erklärt zwei Datensätze:
  das riesige Internet (Wikipedia, Reddit, Bücher, Webseiten, Code) und kleine,
  gezielte Menschenfragen mit Tippfehlern/unklaren Formulierungen plus
  nützlichen Antworten. Danach: erst Vortraining auf dem großen Datensatz,
  dann Fine-Tuning auf dem kleinen, damit das Netz für Menschen nützlich ist.
- [done] Transformer-Station: Trajektorien zeichnen nur bis zur aktuellen
  Schicht, sodass die Linien mit den Layern wachsen; das gesamte Konstrukt
  bleibt im Bild. Metrik-Umschalter „Winkel/Großkreis“ und „Euklid“ entfernt;
  kurzer Hinweis auf die Großkreis-Metrik im Text darunter.
- [done] Roadmap-Sätze aus den Blocks-Stationen entfernt; der Ausblick steht
  auf der eigenen dritten Unterfolie nach dem Unembedding.
- [done] Ceres-/Flammarion-Bilder: globalen `figure img`-Rahmen mit `border:0`
  entfernt; nur die abgerundeten Bilder bleiben.
- [done] Slider-Hinweis in „Gauß, Ceres und die Daten“ steht jetzt auf der
  Unterfolie mit den Teleskop-Slidern, nicht auf der Bild-Introfolie.
- [done] „Die nächsten Tage“ setzt die Blocks-Demo auf Station 1 zurück, statt
  die Unembedding-Station der vorherigen Unterfolie weiterzuzeigen.
- [done] Wahrheitsplot: Satz 4 „relativ nah“ und etwas höher; Grünbereich
  größer, Rot weiter außen.
- [done] „Eine Wahrheit, viele Sprachen“ als vierte Karte in die Daten-Unterfolie
  übernommen; die separate Folie ist entfernt. Die Karte zeigt, dass die
  Sprachen auf denselben Sachverhalt zeigen.
- [done] Folie „Die kausale Matrix und die Heads“ entfernt und aus der
  Attention-Merge-Unterfolie genommen.
- [done] Folie „Attention reduziert Rauschen“ entfernt und aus der
  Folienliste gestrichen.
- [done] Code-Folie: „Weiter“ vor dem Terminal beendet jetzt zuerst den
  Code-Lauf und zeigt das Terminal; erst der nächste Klick blättert weiter.
- [done] „Die nächsten Tage“ zeigt keine Stationen mehr. In der Demo steht die
  kurze Botschaft „Die nächsten Tage werden wir diese Bausteine genauer
  anschauen.“; der linke Text ist nur noch ein kurzer Ausblick.
- [done] Daten-Unterfolie: linke Spalte auf drei Sätze gekürzt. In der Demo
  rechts steht jetzt eine Tabelle mit den zwei Trainingsstufen und
  Beispielvervollständigungen: Stufe 1 setzt den Paris-Wikipedia-HTML-Text fort,
  Stufe 2 antwortet auf die Frankreich-Frage mit „Paris“. Die langen Cues und
  die GPT-3-Balken erscheinen dort nicht mehr.
- [done] Ceres-Folie: Kicker ist auf allen Unterfolien „Daten“ (EN „Data“),
  damit oben nichts springt. Der Teleskop-Slider animiert σ weich zwischen den
  Schritten.
- [done] „Viele Sätze, eine Wahrheit“ als fünfte Unterfolie an das Ende von
  „Gauß, Ceres und die Daten“ gemerged; der Text vergleicht Textdaten mit den
  Ceres-Messungen.
- [done] „Sehr viele, sehr schmutzige Daten“ und „Die Mischung macht den
  Korpus“ aus der Folienliste entfernt; die Inhalte liegen in der Datenfolie.
- [done] Tokenizer-Reihenfolge: erst „Text wird zu IDs“ (Beispiele), dann BPE
  als eigene Unterfolie. Der BPE-Chip in den Beispielen ist entfernt; die
  Demo-Weiter-Taste wechselt nicht mehr intern in den BPE-Modus.
- [done] Beispiele und BPE sind in der Tokenizer-Demo vertikal zentriert.
- [done] Neuronale-Netze-Folie in einzelne Folien aufgeteilt: 1 Neuron,
  Loss-Landschaft, Aktivierungsfunktionen, drei Schichten 32×32×32; danach
  bleibt die MLP-Raumbiege-Folie separat.
- [done] „Mit Worten steuern“ und „Verstehen heißt komprimieren“ aus der
  Folienliste entfernt; ihre Definitionen liegen in
  `intuition_learnsys_removed.js` und werden nicht geladen.
- [done] Daten-Demo: Stufe-1-Beispiel ist jetzt ein HTML-Codeblock mit mehr
  Wikipedia-Kontext (`<div class="mw-parser-output">`, `<h1>`, `<p>`, `<b>`).
- [done] Daten-Demo: Die Frageblase in Stufe 2 beginnt nur ca. 1 cm rechts
  vom Antwortblock statt am rechten Rand.
- [done] Tokenizer-Beispiele: alle drei Beispiele (Verständnis, unzerbrechlich,
  Sprachmodell liest Text) sind in der Pfeiltasten-Reihenfolge; die Token-Chips
  umbrechen, sodass auch das letzte Token sichtbar ist.
- [done] Neuronale Netze: Die vier Folien heißen jetzt alle „Was sind neuronale
  Netze?“ und haben keinen Kicker mehr. Die Tabs „1 Neuron“, „Loss-Landschaft“
  und „32×32×32“ sind aus der Demo entfernt.
- [done] „Matrizen zeigen“: größere Schrift und `pmatrix` (runde Klammern)
  statt `bmatrix`.
- [done] Neue Folie „Vom Softmax zum Trainingssignal“ + Demo `crossentropy`:
  Ziel-Token, vertikale Wahrscheinlichkeitstürme, Ghost der vorherigen
  Verteilung, Gradienten-Chips, Loss-Gauge, Trainings-Beam und Loss-Sparkline.
- [done] Neue Folie „Wie Attention rechnet“ + Demo `qkv`: Query/Key/Value,
  gewichtete Bögen, Weight-Bars, zwei Heads, Q/K/V-Vektorbars und Partikel,
  die von Key zu Query wandern.
- [done] Neue Folie „Warum Modelle halluzinieren“ + Demo `calibration`:
  Konfidenz/Trefferquote, Temperatur-Skalierung, Ghost-Kurve,
  High-Confidence-Band, „zu sicher“/„zu unsicher“-Flächen und Achsen-Ticks.
- [done] Alle drei Demos sind DE/EN, theme-reaktiv, mit Quellen zu Bengio 2003,
  Goodfellow 2016, Vaswani 2017, Ji 2023, Guo 2017, Kadavath 2022 und Lin 2022.
- [pending] Die visuelle Sprache auf die bestehenden Demos ausrollen; die drei
  neuen Demos sind der Maßstab.
- [done] Daten-Demo: Tabelle aufgelöst. Stufe 1 (Vortraining) und Stufe 2
  (Fine-Tuning) stehen jetzt untereinander, erscheinen nacheinander und zeigen
  ihre eigenen Daten und Beispiele. Stufe 2 antwortet mit „Die Hauptstadt von
  Frankreich ist Paris.“
- [done] Der Petrov-/Mehr-Tokens-Caveat ist auf der Datenfolie ausgeblendet.
- [done] Der Kurztext sagt klarer, dass das Netz zuerst die Internetbreite für
  Muster braucht und danach per Fine-Tuning detaillierter auf Fragen antwortet.
- [done] Q/K/V-Folie: falscher Titel kam vom alten indexbasierten Text-Overlay;
  Overlay-Revision erhöht. Der Watch-Text nennt jetzt Head 1 → animal und
  Head 2 → street.
- [done] „Code“-Kicker der Code-Attention-Unterfolie ist jetzt „Attention“.
- [done] Loss-Landschaft: Graph größer, Formelbereich kleiner; fette
  TODO-Box „Automatisches Ableiten“ ergänzt.
- [done] 1-Neuron-Folie: Live-Formel `ŷ = w x + b` unter der Demo, ohne
  „Matrizen zeigen“.
- [done] 32×32×32-Folie: Formel und Loss-Chart standardmäßig aus, Stage groß.
- [done] FFN-Folie heißt jetzt „Die Rolle von neuronalen Netzen im Transformer“.
- [done] Unembedding-Folie: „Weiter“ geht durch Wortkarte, Winkel,
  Skaleninvarianz und Unembedding; „Scale Invariance“ ist lokalisiert.
- [done] Softmax-Demo: DE nutzt deutsche Prompts/Tokens, EN englische;
  Beschriftung ist „illustrative Logits“, nicht echte GPT-2-Messung.
- [done] Cross-Entropy-Folie klarer: konkretes Paris/London-Beispiel,
  −log(0.30) ≈ 1.20, Gradient p−y und Trainingsschritt; Demo-Logits passen
  zu 30 %/50 %.
- [done] Daten-Demo: Stufe 1 erscheint beim Laden; Fine-Tuning (Stufe 2)
  erscheint erst nach dem nächsten „Weiter“. Ein weiterer „Weiter“-Klick geht
  zur nächsten Folie; „Zurück“ blendet Stufe 2 wieder aus. Ursache für die
  unsichtbaren Stufen war eine doppelte `summaryStages`/`summaryBridge`-
  Deklaration, die die DOM-Referenzen überschrieben hat; entfernt.
- [done] Scrollbar-Flackern links analysiert: die `mask-image` auf dem
  Scroll-Container und ein nicht reservierter Scrollbar-Platz waren die
  Ursache. Maske entfernt, `scrollbar-gutter: stable`, `overflow-x: hidden`
  und Quellen-Links umbrechen jetzt.
- [done] Embedding-Gruppe um eine vierte Unterfolie „Tausende Dimensionen“ erweitert:
  3D reicht nicht, 1D hat auch nicht gereicht; die Tabelle zeigt 64 von 4096
  Dimensionen, Auslassungspunkte rechts und unten, klickbare Token-Zeilen und
  eine Positionsanzeige. Demo `highdim` überarbeitet.
- [done] „Drei Dimensionen, ein Schatten“: Weiter/Pfeiltaste geht jetzt durch
  alle EXAMPLES (König−Mann+Frau, Mann+Macht, Prinz+Macht, Geschlecht,
  Machtrichtung, alle Richtungen); danach kommt die Highdim-Unterfolie.
- [done] Q/K/V-Demo: deutsche Tokens („Das Tier lief nicht über die Straße,
  weil es zu müde war“) mit denselben Head-Rollen; Layout nach unten zentriert,
  damit die Aufmerksamkeitsbögen nicht oben abgeschnitten werden.
- [done] Code-Attention heißt jetzt „Attention verschiebt Punkte und vergisst
  Oberflächen“ und ist DE/EN vollständig übersetzt.
- [done] Loss-Landschaft: Spinner über der Bühne, `busy()` blockiert
  „Weiter“, bis die Fläche berechnet ist.
- [done] Cross-Entropy-Demo zeigt den Loss jetzt zusätzlich als DOM-Readout
  (Loss, p(Ziel), Gradient).
- [done] „Warum Modelle halluzinieren“ ist eine Gruppe mit Kalibrierung und
  einer neuen Ursachen-Folie: falsche Daten, Sampling, Lücken, Negation.
  Die Demo `hallucinationtypes` zeigt die vier Ursachen visuell; „nicht
  glücklich“ liegt näher an „glücklich“ als an „traurig“.
- [done] Neue letzte Folie „Bewusstsein: viele Karten, eine offene Frage“ mit
  klickbarer Theorienkarte: Zugang/Erfahrung, Global Workspace, J-space,
  IIT/Phi, Qualia, Predictive Processing, Illusionismus, Panpsychismus.
  Quellen: Mashour 2020, Tononi 2016, Block 1995, Nagel 1974, Anthropic 2026,
  SEP.
- [done] Visuelle Politur: Halluzinationsursachen haben jetzt Icons,
  Roulette-Sampling, Wissenslücken-Grid, Negations-Abstandsdiagramm und
  Partikel; die Bewusstseinskarte hat zwei Felder (Zugang/Erfahrung), gekrümmte
  Kanten, Partikel, offene Grenze, Legende und Branch-Dimming.
- [done] Weitere visuelle Politur: Partikelfelder, rotierende Ringe,
  Modus-Reveal-Ringe, tumbling Die, Negationsdreieck, Branch-Spotlight und
  Kernringe in den Halluzinations- und Bewusstseinsdemos; Loss-Spinner fällt
  bei Worker-Fehler nicht in eine Endlossperre.
- [done] JSON-Export v2 (`learnsys-changes/v2`): nur echte Overlay-Änderungen,
  pro Change mit `lang`, `translate_to`, `apply_to`, `data_file`, `page`,
  `day_title`, `track`, `step`, `substep`, `substep_count`, `text_key`,
  `slide_title`, `slide_kicker`, `changed_fields`, `source` und `edit`.
  Import akzeptiert v2 und das alte v1-Format.
- [done] Weitere Politur: Halluzinationsdemo mit Glyphen-Fragmenten, HUD-Icon
  und Einflug-Reveal; Bewusstseinskarte mit schwebenden Knoten, Halos,
  Licht-Sweep, Hover-Glow, Klick-Ripple und pulsierender offener Grenze;
  Cross-Entropy mit 1/0-One-Hot-Labels; Q/K/V mit Prozent-Chips auf den
  Aufmerksamkeitsbögen.
- [done] Q/K/V-Folie ist jetzt eine Gruppe: „Wie Attention rechnet“ (Bögen) und
  „Attention als gewichtete Mischung“ (Simplex). Die Simplex-Demo zeigt drei
  Value-Punkte als Dreieck, den gewichteten Ausgabepunkt, Baryzentrik-Grid,
  Partikel von den Vertices zur Ausgabe und eine Spur. Mathematik geprüft:
  Softmax-Gewichte sind ≥ 0 und summieren zu 1, also ist die Ausgabe eine
  konvexe Kombination der Values; bei drei Values ein 2-Simplex. Die echte
  Ausgabe nutzt alle Values und liegt in deren konvexer Hülle.
- [done] „Viele Sätze, eine Wahrheit“ horizontal zentriert (max. 1040 px,
  Plot und Satzliste als Block). GPT-2-Trajektorien sagen nur noch „Zustände“
  statt „echte Zustände“.
- [done] FFN-Miniplot im Transformer-Block nach unten gerückt: Chips
  (Muster/Bestandteile/neu geordnet) stehen in einer Zeile unter der
  Überschrift, das Netz beginnt darunter. Text sagt jetzt „trennt sauberer“
  und „isoliert Bedeutungen“, nicht „zerlegt sauber“.
- [done] Unembedding: Plot ohne Outline, größere Bühne, mehr Innenfläche,
  alle Token-Richtungen mit Namensschildern (weißer Hintergrund, an den Rand
  geklemmt), damit kein Name aus dem Bild läuft.
- [done] „Attention als gewichtete Mischung“ zeigt die Umrechnung der
  Rohgewichte in Prozente: Rohsumme → ÷ Σ → × 100, jeweils mit Summe.
- [done] Q/K/V-Gruppe hat vier Unterstufen: Head 1 Bögen, Head 2 Bögen,
  Head 1 Simplex, Head 2 Simplex. Jede Stufe zeigt die passenden Gewichte und
  die Prozentumrechnung. Overlay-Revision auf attention-3 erhöht.
- [done] „Attention verschiebt Punkte und vergisst Oberflächen“ heißt jetzt
  „Attention hilft, Rauschen zu ignorieren“. Die Demo zeigt zwei Codeblöcke
  (`def quickSort`, `function quick_sort`), markiert `def`, `function` und `_`
  als lilafarbenes Rauschen, lässt die Rauschpfade vor dem Filter enden und
  führt die Bedeutungs-Tokens beider Blöcke auf denselben abstrakten
  Quicksort-Punkt. Danach wird erwähnt: viele Heads laufen parallel und achten
  auf ganz verschiedene Dinge.
- [done] „Ähnliche Worte finden“ ist eine Gruppe mit vier Unterstufen
  (Wortkarte, Winkel, Skaleninvarianz, Unembedding). Weiter und Pfeiltasten
  gehen mit weichem Moduswechsel durch alle vier. Skaleninvarianz zeigt zwei
  sichtbar verschiedene, parallele Vektoren A und B mit Längenlabels.
- [done] Das rechte Panel „Wahrscheinlichkeit / kleinster Winkel → höchste“
  hat jetzt eine feste Breite und eine zweizeilige Überschrift; die Balken
  werden nicht mehr über die ganze Browserbreite gestreckt.
- [done] Loss-Demo: Weiter/→ geht Paris, London, Berlin, the nacheinander
  durch und macht für jedes Zielwort einen Trainingsschritt; Zurück/← geht
  rückwärts, der Reset startet die Folge neu.
- [done] Geometrie der Attention nachrecherchiert: Vaswani et al. (2017, §3.2)
  definieren die Ausgabe als „weighted sum of the values“; Lilian Weng (2018)
  und Elhage et al. (2021) bestätigen die Mischung der Values. Die Ecken sind
  input-abhängige Value-Vektoren v_j = W_V x_j, nicht Tokens. Die drei Gewichte
  α sind die Variablen (zwei Freiheitsgrade wegen Σ = 1). Der Simplex ist die
  konvexe Hülle der Values, keine eigene gelernte Größe. Attention allein bleibt
  darin; das FFN danach kann die Hülle verlassen.
- [done] Simplex-Folie entsprechend präzisiert: Titel „Attention als Mischung
  der Value-Vektoren“, Ecken als v(Tier) usw., Formel v_j = W_V x_j, α-Umrechnung,
  Quellen Vaswani/Weng/Elhage, Hinweis auf das FFN.
- [done] „Viele Sätze, eine Wahrheit“ vertikal zentriert.
- [done] JSON-Änderung übernommen: q-context entfernt, g-basics leer.
- [done] Transformer-Blöcke in „Die Architektur von LLMs“: Die GPT-2-Zustands-
  Trajektorie und ihre Beschriftung sind entfernt. Die Folie zeigt nur noch die
  beiden Mini-Demos zu Attention und FFN; der Text verweist nicht mehr auf
  „Linien, die mit jeder Schicht wachsen“. Die separate Folie
  „Token-Trajektorien durch GPT-2“ bleibt unverändert.
- [done] Unembedding: h erklärt (letzter Vektor nach allen Transformer-Blöcken,
  Kontext über viele Heads/Schichten eingemischt), eigene Box und Readout.
  Die Token-Richtungen werden jetzt nach den Winkelsektoren gezeichnet und
  an der Panelkante geklemmt; die rechte Liste beginnt höher und passt alle
  Zeilen ein, sodass „city“ nicht mehr unten herausfällt.
- [done] „Jeder Platz bekommt einen Fingerabdruck“: Jeder grüne Punkt trägt
  jetzt ein Label `Hund@Position`; links steht der Hinweis auf den
  hochdimensionalen Raum und die Hyperkugel (3D = Projektion). Text, Kontext
  und Box pos-4 nennen die Hyperkugel ausdrücklich.
- [done] „Wie Attention rechnet“: Head 1/Head 2 stehen links vor Bögen/Simplex;
  die Unterstufen sind Head 1 Bögen, Head 2 Bögen, Head 1 Simplex,
  Head 2 Simplex. Neue fünfte Stufe „Attention ist ein vollverbundener Graph“:
  alle Token im Kreis, blasses vollständiges Netz, farbige Query-Kanten mit
  Gewicht, animierte Partikel, Knotenringe, Hover-Tooltip mit Verbindung und
  Prozentwert.
- [done] Positionsdemo startet mit mehreren grünen Trail-Punkten (Hund@0,
  Hund@2, …), damit sofort sichtbar ist: Jeder Punkt ist dasselbe Wort an einer
  anderen Position.
- [done] „Attention hilft, Rauschen zu ignorieren“ hat jetzt einen
  Sprache/Code-Umschalter. Sprache zeigt drei Sätze in drei Sprachen mit
  Tippfehlern (Hundt/dgo/chienn, Strasse), die auf denselben
  sprachunabhängigen Bedeutungs-Knoten zeigen. Text und Quellen (XLM-R, mBERT)
  erklären die gelernte Annäherung, nicht eine eingebaute Universalschicht.
- [done] Loss-Demo: Weiter/→ trainiert jetzt das aktuelle Zielwort animiert
  und geht danach zum nächsten; alle vier Wörter bekommen ihren Schritt.
- [done] Escape beendet den Bearbeiten-Modus (und schließt das Textpanel),
  auch wenn er durch Klick auf den Text oder den Bearbeiten-Button geöffnet
  wurde.
- [done] Post-Training- und Evaluationsfolie entfernt (Daten, Ablauf, Demo-Dateien
  und Demo-Label). Stattdessen eine Agents-Folie: dasselbe Modell, Tool-Loop,
  Terminal, Screenshot, Bildtokens im Kontext; opencode/Claude Code/Cursor
  als Beispiele.
- [done] Attention-Box „Auch für Bilder“ ergänzt: Vision Transformer zerlegt
  Bilder in Patches und nutzt dieselbe Self-Attention (Dosovitskiy et al., 2021).
- [done] Kalibrierungsfolie „Konfidenz und Trefferquote“ entfernt; die
  Halluzinationsgruppe besteht jetzt aus Typen und Schutz.
- [done] Halluzinationsarten als inhaltsreiche Karten-Demo mit neun Typen
  (falsche Fakten, erfundene Quellen, intrinsic/extrinsic, Kontext ignoriert,
  veraltet, Entitätsvertauschung, Negation, Sampling), Beispielen,
  Erkennungsmerkmalen, Gegenmitteln und Papers (Ji, Maynez, Huang, Rawte).
- [done] Schutz-Demo mit RAG, schrittweiser Prüfung und Gegenprüfung:
  Schalter zeigen, wann die Antwort gedeckt ist und wann sie „keine Quelle“
  sagt. Quellen: Lewis, Wei, Dhuliawala.
- [done] „Bedeutung wird eine Zahl“: Weiter/→ geht die vier Wortpaare
  nacheinander durch; der Start ist kalt+warm. Optional-Box ergänzt: echte
  Embeddings sind nicht so sauber getrennt, Achsen sind gelernte Richtungen,
  Cluster überlappen, Wörter liegen schief, Superposition.
- [done] „Jeder Platz bekommt einen Fingerabdruck“: keine permanenten
  Hund@n-Labels und keine Dauer-Zahlen mehr. Nur beim Mouseover über einen
  grünen Punkt erscheinen Position, Vektor, Bogenlänge und Winkel.
- [done] „Winkel statt Abstand“: Der Winkelbogen liegt jetzt auf der richtigen
  Seite (Canvas-Winkel negiert).
- [done] Skaleninvarianz: A und B starten am selben Punkt, zeigen in
  verschiedene Richtungen. Der Regler skaliert B; Cosinus bleibt, euklidischer
  Abstand ändert sich. Titel/Text als „Länge vs. Winkel“ präzisiert.
- [done] Unembedding: Winkel/Scale/Unembedding per Pfeiltaste/Weiter,
  kürzere Aufbauanimation (650 ms), maximale Bühnenbreite gegen die verzerrte
  Darstellung.
- [done] Token-Trajektorien: Projektion etwas kleiner und mit mehr Rand, damit
  das ganze Bild sichtbar bleibt.
- [done] Token-Trajektorien: Ursache der Beschnittung gefunden. `fitBounds`
  bekam verschachtelte Token-Listen statt flacher Punkte; dadurch war die
  Projektion falsch skaliert und spätere Layer flogen aus dem Bild. Jetzt werden
  alle Punkte flach übergeben, mit Rand und etwas größerem Zoom. Per
  Canvas-Pixelprüfung: kein Inhalt mehr an den Rändern.
- [done] Rückwärtsnavigation über Foliengrenzen: `prev()` springt jetzt auf
  die letzte Unterstufe der vorherigen Folie und läuft dann rückwärts durch
  alle Unterstufen. Damit landet man nach „Gauß, Ceres und die Daten“ wieder
  auf der Stelle, an der man vorwärts gegangen ist.
- [done] „Drei Dimensionen, ein Schatten“: Die Formel unter dem Plot rechnet
  jetzt mit drei Komponenten, wenn die 3D-Ansicht aktiv ist; auch Nearest-Word,
  Readout und Zwischenschritte nutzen z. Aus `Prinz + Macht = (25.0, −10.0)`
  wird `(25.0, −10.0, 0.70)`.
- [done] LearnSys-Changes-V2 für „Von Beziehungen zur Übersetzung“ eingepflegt:
  neuer Kicker „Mannigfaltigkeiten“, neuer zweiparagraphiger Body, q-box-man-1
  und Morris-Quelle entfernt, q-box-man-3/4 aktualisiert. `proseBlock`
  unterstützt jetzt Absätze durch Leerzeilen, damit der Body wirklich zweigeteilt
  rendert; inline `$R^n$` in Boxen bleibt erhalten.
