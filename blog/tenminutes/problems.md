# Prüfbericht: faktische und technische Probleme

- Stand: 17. November 2026
- Geprüfte Fassung: deutsche Laufzeitfassung von `intuition_learnsys.php`
- Volltext-Dump: `/tmp/opencode/deck_de.md` (1.453 Zeilen)
- Methode: Laufzeitstrings, Quelltexte der Demos und Primärliteratur, wo verfügbar. Die englische Fassung und die Bildrechte wurden nicht gesondert geprüft.

**Wichtig:** Es wurden keine Inhalte geändert. Diese Datei ist nur der Prüfbericht.

## Legende

- **Blocker:** Rohtext, sichtbares TODO oder eine nicht gerenderte Formel.
- **Faktisch falsch:** widerspricht einer Primärquelle oder einer mathematischen Tatsache.
- **Überzogen:** Die Quelle stützt eine schwächere Aussage.
- **Quelle fehlt/falsch:** Die Behauptung ist nicht durch die angegebene Quelle gedeckt.
- **Sprache/Redundanz:** Grammatik, Kopierfehler oder doppelter Inhalt.

## Nachtrag: Formelreparatur

Die kaputten Formeln sind behoben. Geändert wurden nur Backslashes in Mathematik-Strings und die Display-Math-Behandlung in `proseBlock`; der Inhalt der Folien wurde nicht umgeschrieben.

- 40 Mathematik-Spans in `intuition_learnsys-data.js` korrigiert, 74 zusätzliche Backslashes, in Deutsch und Englisch.
- 18.1 rendert beide `$$`-Formeln jetzt als Display-Mathematik. `proseBlock` erkennt reine `$$…$$`-Blöcke und gibt sie an `mathBlock` weiter.
- Statische Prüfung: 380 Mathematik-Spans, 0 verbliebene einfache Backslashes.
- Browser-Prüfung: 215 `[data-tex]`-Elemente pro Sprache, 0 ungerendert, 0 rohe `$$`, 0 sichtbare kaputte Formeln, 0 schwere Konsolenfehler.
- `node --check` für `intuition_learnsys-data.js` und `learnsys.js`: bestanden.
- `tenminutes_pages_test.py --pages intuition_learnsys.php --langs en,de`: 30/30 Checks bestanden.
- `tenminutes_height_test.py` für Desktop und Mobil: 24 Interaktionen, 0 Höhenänderungen.
- `js_validator.py`: 0 Fehler, 66 Warnungen, alle bereits vorhanden.

**Offen bleibt:** nichts aus dieser Liste. Das TODO in 14.1 ist ersetzt, die inhaltlichen Befunde sind unten dokumentiert und im Code korrigiert.

## Nachtrag: inhaltliche Korrekturen

Die inhaltlichen Befunde wurden in Deutsch und Englisch umgesetzt:

- Daten und Training: 2.1, 2.2.
- Gauß, BPE und Embeddings: 3.1 bis 3.5, 4.1, 5.1, 6.4.
- Geometrie, Position und Attention: 7.1, 8.1, 9.1, 10.2, 10.3, 10.5, 10.6, 11.1, 11.2, 12.1, 12.3.
- Netze und Training: 14.1, 15.1, 17.1, 18.1.
- Weltmodell, Raum/Zeit, Agenten, Halluzinationen und RAG: 23.1, 24.2, 25.1, 25.2, 26.1, 27.1, 28.1.
- Geschichte, Grenzen, Gesellschaft, Bewusstsein, Sentiment und Grokking: 29.1, 30.1, 31.2, 31.3, 32.1, 33.3, 34.1.

Zusätzlich wurden für 4.1/5.1 die Petrov-Quelle und für 29.1 die Salamis-/Leibniz-Quellen ergänzt.

**Prüfung nach den inhaltlichen Korrekturen:**

- `node --check` für die geänderten JS-Dateien: bestanden.
- `tenminutes_pages_test.py --pages intuition_learnsys.php --langs en,de`: 30/30 Checks bestanden.
- `tenminutes_height_test.py` für Desktop und Mobil: 24 Interaktionen, 0 Höhenänderungen.
- `js_validator.py`: 0 Fehler; die 10 Warnungen in `learnsys.js` sind bereits vorhanden.
- `git diff --check`: sauber.

## Kurzfassung

Die schwersten Probleme sind (Prüfstand; alle Punkte sind inzwischen behoben):

1. **Behoben: kaputte Formeln** in 10.3, 10.6, 13.1, 14.1 und 22.1. Sie zeigten `sum`, `alpha`, `hat`, `cdot`, `rac`, `propto`, `exp` und `to` (mit Tab vor `o`) als Text.
2. **Behoben: sichtbares TODO** in Folie 14.1, Box „Automatisches Ableiten“.
3. **Behoben: rohe `$$`-Formeln** in Folie 18.1. Beide Formeln werden jetzt als Display-Mathematik gerendert.
4. **Causal Mask fehlt**: 10.2 und 10.5 behaupten, jedes Token könne auf jedes andere schauen. Das gilt für einen GPT-Decoder nicht.
5. **Positionskodierung falsch erklärt**: 8.1 behauptet, die Vektoren lägen auf der Einheitskugel und Attention messe Großkreise. Sinusförmige Positionskodierungen sind nicht normiert, und Attention rechnet mit Skalarprodukten.
6. **GELU ist nicht umkehrbar**: 15.1 sagt, glatte Aktivierungen blieben umkehrbar. GELU ist glatt, aber nicht monoton und damit nicht injektiv.
7. **QK- und K-Composition verwechselt**: 12.1 und 12.3 nennen den Induktionsschaltkreis „QK-Composition“, 12.2 sagt korrekt „K-Composition“.
8. **Gurnee & Tegmark werden überzogen**: 25.1 verspricht eine „präzise“ Karte mit „korrekten Relationen“, 25.2 einen „inneren Zeitstrahl“. Das Papier sagt ausdrücklich, die Repräsentationen seien kein dynamisches kausales Weltmodell, und die Karte sei relativ, nicht absolut.
9. **Othello wird verallgemeinert**: 24.2 schließt von Othello-GPT auf „LLMs“ und „ein inneres Modell der Welt“. Das ist zu stark.
10. **Kopierfehler in 33.3**: Context- und Deep-Text sprechen von Sentiment, nicht von Wahrheit und ITI.
11. **Ratten lernen keine Gleichungen**: 32.1 sagt „so wie Ratten einfache Gleichungen für ein Labyrinth lernen“. Der Vergleich ist sachlich falsch.
12. **Behoben: Geschichtsfolie**: Die 30/25-Gruppierung des Wolfsknochens war nicht gedeckt und ist entfernt; Leibniz’ Rechenmaschine ist jetzt mit Beginn 1673 und Fertigstellung 1694 beschrieben.
13. **14 gegen 16 Dimensionen**: 6.4 sagt „14 von 4096“, die Demo sagt „16 von 4096“.
14. **Expressibility Gap falsch wiedergegeben**: 23.1 macht daraus ein „Band um eine Naht“; Mabrok definiert den Begriff als Maß der semantischen Verzerrung durch Vokabular-Diskretisierung.
15. **Unbelegte Aufmerksamkeitsbehauptung**: 27.1 sagt, Attention verschiebe „nicht exakt auf das Antonym“. Dafür gibt es keine Quelle.

## Befunde nach Folie

**Status:** Die folgenden Befunde sind behoben. Die Abschnitte dokumentieren den Prüfstand und die Begründung; die Korrekturhinweise sind umgesetzt.

### 2.1 Daten

**Befund:** „zuerst auf mehr oder weniger dem ganzen öffentlich erreichbaren Internet“ und „Das Training geschieht in zwei Stufen“.

**Problem:** Das ist eine unbelegte Vereinfachung. Pretraining-Korpora sind gefilterte, kuratierte und teils lizenzierte Teilmengen, nicht „das ganze Internet“. Moderne LLMs durchlaufen außerdem mehr als zwei Stufen: Pretraining, Instruction-Tuning und häufig Preference Optimization wie RLHF oder DPO.

**Schweregrad:** Überzogen.

**Korrekturhinweis (umgesetzt):** „Pretraining auf einem großen, gefilterten Textkorpus; danach Instruction-Tuning und häufig Preference Optimization.“

### 2.2 Die Architektur von LLMs

**Befund:** „das nächste sinnvolle Wort vorherzusagen“.

**Problem:** Das Modell sagt das nächste **Token** voraus, nicht das nächste Wort. Die Folien verwenden später selbst den Token-Begriff. Die Aussage ist dadurch intern inkonsistent.

**Schweregrad:** Sprache/Redundanz.

### 3.1 bis 3.5 Gauß, Ceres und die Daten

**Befund:** „Daraus entstanden die Methode der kleinsten Quadrate und der mittlere quadratische Fehler (MSE), mit dem man noch heute neuronale Netze trainiert.“

**Problem:** Die Methode der kleinsten Quadrate wurde 1805 von Legendre publiziert; Gauß verwendete sie für Ceres und beanspruchte Priorität. Die Formulierung gibt Gauß die alleinige Urheberschaft. Außerdem ist MSE eine Loss-Funktion für Regression, nicht die allgemeine Loss-Funktion für neuronale Netze. Folie 21.1 verwendet für LLMs korrekt Cross-Entropy. Der Satz widerspricht damit der späteren Folie.

**Quelle:** Stigler (1981), *Gauss and the Invention of Least Squares*, DOI 10.1214/aos/1176345451; Goodfellow, Bengio & Courville (2016), *Deep Learning*, Kapitel 6.

**Schweregrad:** Überzogen und intern inkonsistent.

**Korrekturhinweis (umgesetzt):** „Gauß nutzte die Methode der kleinsten Quadrate und trug zu ihrer Verbreitung bei; MSE ist eine ihrer Loss-Formen, Cross-Entropy eine andere.“

### 4.1 Text wird zu IDs

**Befund:** „BPE beginnt bei Zeichen“ und „Seltene Schriften bleiben teurer, weil sie im Korpus seltener sind.“

**Problem:** GPT-2 verwendet byte-level BPE, nicht zeichenbasiertes BPE. Die Box sagt zwar „Zeichen oder Bytes“, der Haupttext bleibt aber bei „Zeichen“. Der zweite Satz ist eine empirische Behauptung über Tokenizer-Ungleichheit und braucht eine eigene Quelle; die Folie nennt nur Sennrich et al. (2016) und Radford et al. (2019).

**Quelle:** Radford et al. (2019), *GPT-2*; Petrov et al. (2023), *Language Model Tokenizers Introduce Unfairness Between Languages*, arXiv:2305.15425.

**Schweregrad:** Faktisch ungenau und Quelle fehlt.

### 5.1 BPE: Zeichen → Paare → Merges

**Befund:** „BPE beginnt bei Zeichen“, „Hapax legomena … bekommen kein eigenes Token“ und „Das ist gelernte, verlustfreie Kompression.“

**Problem:** Für GPT-2 ist der Ausgangspunkt die Bytefolge, nicht das Zeichen. „Hapax legomena bekommen kein eigenes Token“ ist zu absolut: Gemeint ist, dass das ganze Wort keinen eigenen Merge erhält; es kann aber aus vorhandenen Tokens bestehen. „Verlustfreie Kompression“ ist als Tokenisierung reversibel, aber nicht im informationstheoretischen Sinn eine Kompression des Textes.

**Quelle:** Sennrich et al. (2016), arXiv:1508.07909; Radford et al. (2019), *GPT-2*.

**Schweregrad:** Überzogen.

### 6.4 Tausende Dimensionen

**Befund:** „Die Tabelle zeigt einen Ausschnitt: 14 von 4096 Dimensionen.“

**Problem:** Die Demo schreibt an derselben Stelle „Ausschnitt: 16 von 4096 Dimensionen“ (`demos/embedding.js`). Die Zahl ist intern inkonsistent. Die Tabelle ist didaktisch, aber der Widerspruch bleibt sichtbar.

**Schweregrad:** Sprache/Redundanz.

### 7.1 Von Beziehungen zur Übersetzung

**Befund:** „Die Struktur, die sich aus den Punkten im hochdimensionalen Raum bildet, nennen Mathematiker Mannigfaltigkeit.“ und „Eine Mannigfaltigkeit ist lokal flach und global gekrümmt.“

**Problem:** Nicht jede endliche Punktwolke ist eine Mannigfaltigkeit. Der Vietoris–Rips-Komplex ist ein simplizialer Komplex, nicht automatisch eine Mannigfaltigkeit. Außerdem ist eine Mannigfaltigkeit nicht zwingend global gekrümmt: Der euklidische Raum und der flache Torus sind Gegenbeispiele. Die Box sagt korrekt „Global kann der Raum gekrümmt sein“, der Haupttext verabsolutiert.

**Schweregrad:** Faktisch falsch.

**Korrekturhinweis (umgesetzt):** „Die Punktwolke kann lokal wie eine Mannigfaltigkeit aussehen; der Vietoris–Rips-Komplex macht Nachbarschaften sichtbar. Global kann sie gekrümmt sein, muss es aber nicht.“

### 8.1 Jeder Platz bekommt einen Fingerabdruck

**Befund:** „Die Vektoren liegen auf der Einheitskugel; die gezeigte 3D-Kugel ist nur eine Projektion der Hyperkugel. Gemessen wird der Großkreis zwischen den Richtungen, nicht der euklidische Abstand: Längen zählen nicht, nur der Winkel.“

**Problem:** Sinusförmige Positionskodierungen nach Vaswani et al. sind Vektoren aus Sinus- und Kosinuswerten, die zu den Token-Embeddings addiert werden. Sie sind nicht auf die Einheitskugel normiert. Attention misst außerdem keine Großkreis-Distanz, sondern Skalarprodukte zwischen Query und Key. Die Einheitskugel und der Großkreis sind eine Visualisierungsentscheidung der Demo, keine Eigenschaft der Transformer-Positionskodierung.

Zusätzlich: Der Haupttext sagt „Die Position wird Teil des Tokens“, die Box sagt korrekt, dass RoPE Query und Key dreht, nicht den Token-Vektor. Für Llama/RoPE ist die Formulierung im Haupttext falsch.

**Quelle:** Vaswani et al. (2017), *Attention Is All You Need*, §3.5; Su et al. (2021), *RoFormer*, arXiv:2104.09864.

**Schweregrad:** Faktisch falsch.

**Korrekturhinweis (umgesetzt):** „Die Demo normiert die Vektoren für die Kugeldarstellung. Das echte Modell addiert die Positionskodierung zum Token-Embedding; RoPE dreht stattdessen Query und Key.“

### 9.1 Attention bewegt Punkte anhand des Kontextes

**Befund:** „Jedes Token hat 100% Attention zur Verfügung …“.

**Problem:** Das gilt pro Attention-Head. Bei mehreren Heads hat jeder Head eine eigene Softmax-Verteilung. Die Aussage ist nicht falsch, aber ohne „pro Head“ missverständlich.

**Schweregrad:** Sprache/Redundanz.

### 10.2 Attention ist ein vollverbundener Graph

**Befund:** „Jedes Token kann auf jedes andere schauen: Die Attention-Matrix hat keine fehlenden Einträge.“

**Problem:** In einem decoder-only LLM wie GPT ist die Attention kausal maskiert. Token `i` kann nicht auf Token `j > i` schauen; die obere Dreiecksmatrix ist maskiert. Die Folie zeigt offenbar eine bidirektionale Attention, sagt das aber nicht. Das widerspricht auch Folie 9.1, wo der Kontext „alles, was bisher gesagt worden ist“ ist.

**Quelle:** Vaswani et al. (2017), §3.1 (masked decoder); Radford et al. (2019), *GPT-2*.

**Schweregrad:** Faktisch falsch.

**Korrekturhinweis (umgesetzt):** „In dieser Darstellung ohne Causal Mask kann jedes Token auf jedes andere schauen. Ein GPT-Decoder maskiert die Zukunft; dort ist die Matrix nicht voll besetzt.“

### 10.3 Attention als Mischung der Value-Vektoren

**Befund:** `$r_i = sum_j alpha_{ij} v_j$`, `$alpha$`, `$ge 0$`, `$sum alpha = 1$` und `$r_i = sum_j alpha_{ij} v_j$` erschienen als Text. Außerdem: „Deshalb liegt $r_i$ immer im Dreieck, das die drei Value-Vektoren aufspannen.“

**Problem:** Die Backslashes fehlten im Laufzeitstring; die Formeln wurden nicht als Mathematik gesetzt. Das war ein Blocker. **Status:** behoben.

Der Dreieckssatz gilt nur, wenn `r_i` wirklich nur die drei ausgewählten Values mischt. Der Context-Text sagt aber, der echte Mischungsvektor nutze **alle** Values. Dann liegt `r_i` in der konvexen Hülle aller `n` Values, nicht in dem gezeigten Dreieck. Die Aussage „immer im Dreieck“ ist also falsch, sobald mehr als drei Values beitragen.

**Quelle:** Vaswani et al. (2017), §3.2; Elhage et al. (2021), *A Mathematical Framework for Transformer Circuits*.

**Schweregrad:** War ein Blocker; behoben.

### 10.5 Head 2 als Graph

**Befund:** „Die Topologie bleibt vollständig: Jedes Token kann auf jedes andere schauen“.

**Problem:** Dieselbe fehlende Causal Mask wie in 10.2. In einem GPT-Decoder ist die Topologie nicht vollständig.

**Schweregrad:** Faktisch falsch.

### 10.6 Head 2 als Value-Mischung

**Befund:** Dieselben Formeln wie 10.3 waren kaputt, außerdem `$ge 0$`, `$sum alpha = 1$` und der Satz „Das Dreieck bleibt die Grenze für $r_i$“.

**Problem:** Die Formeln wurden nicht gesetzt; das ist behoben. Der Satz ist nur für die drei ausgewählten Values richtig; der echte Mischungsvektor nutzt alle Values. Die Box „Was ist ein Simplex?“ ist außerdem sprachlich und mathematisch verunglückt: „eine Landkarte, die es erlaubt, alle mathematisch gültigen Wege zu zeigen, zu 100% zu kommen“. Das erklärt keinen Simplex.

**Schweregrad:** War ein Blocker; behoben.

### 11.1 Attention hilft, Rauschen zu ignorieren

**Befund:** „Attention versucht, eine innere, sprachunabhängige Repräsentation zu finden, die diese Unterschiede ignoriert.“ und „Und das ist nur ein Head“.

**Problem:** Ein echtes Modell hat keine ausdrücklich sprachunabhängige Ebene; der Context-Text sagt das selbst. Die Formulierung im Haupttext ist absolut und widerspricht der Einschränkung. „Nur ein Head“ ist ebenfalls irreführend: Mehrsprachige Repräsentationen entstehen über viele Heads und Schichten, nicht durch einen einzelnen Head.

**Quelle:** Conneau et al. (2020), arXiv:1911.02116; Pires et al. (2019), arXiv:1906.01502.

**Schweregrad:** Überzogen und intern widersprüchlich.

### 11.2 Attention hilft, Rauschen zu ignorieren

**Befund:** Wortgleiche Wiederholung von 11.1, inklusive derselben Überzogenheit.

**Schweregrad:** Redundanz.

### 12.1 A B … A → B

**Befund:** „Mechanisch ist der Schaltkreis eine QK-Composition“.

**Problem:** Der Previous-Token-Head schreibt in den Key des Induktionskopfs. Das ist **K-Composition**, nicht QK-Composition. Folie 12.2 sagt selbst: „Das ist K-Composition, keine V- oder Q-Composition.“ Die beiden Deep-Texte widersprechen sich.

**Quelle:** Elhage et al. (2021), *A Mathematical Framework for Transformer Circuits*; Olsson et al. (2022), *In-context Learning and Induction Heads*.

**Schweregrad:** Faktisch falsch.

### 12.3 Zwei Heads, ein Algorithmus

**Befund:** „Mechanisch ist der Schaltkreis eine QK-Composition“.

**Problem:** Derselbe Fehler wie 12.1. Der Haupttext sagt korrekt „Das ist K-Composition“, der Deep-Text sagt „QK-Composition“.

**Schweregrad:** Faktisch falsch.

### 13.1 Was sind neuronale Netze?

**Befund:** `$hat y = wcdot x + b$` und `$a = operatorname{activation}(z)$` erschienen als Text.

**Problem:** Die Backslashes fehlten; die Formeln wurden nicht gesetzt. Das war ein Blocker. **Status:** behoben. Die gemeinten Formeln sind `\hat y = w\cdot x + b` und `a = \operatorname{activation}(z)`.

**Schweregrad:** War ein Blocker; behoben.

### 14.1 Wie findet man gute Punkte?

**Befund:** Die Loss-Formel enthielt einen Wagenrücklauf vor `ac`, die Schrittformel enthielt Tabs und einen Zeilenumbruch. Beide erschienen als Text. Außerdem steht in der Box „Automatisches Ableiten“ ein sichtbares `<b>TODO:</b>`.

**Problem:** Die Formeln waren durch fehlende Backslashes und literale Tabs/Zeilenumbrüche zerstört; das ist behoben. Das TODO ist durch eine Erklärung zu Autograd ersetzt.

Zusätzlich: „Es gibt fast immer eine Richtung, in der der Loss wieder fällt“ ist zu stark. Sattelpunkte sind in hohen Dimensionen häufig, aber lokale Minima existieren; „fast immer“ ist keine garantierte Eigenschaft jedes kritischen Punktes.

**Quelle:** Dauphin et al. (2014), arXiv:1406.2572.

**Schweregrad:** War ein Blocker; TODO und Überzogenheit sind behoben.

### 15.1 Was sind neuronale Netze?

**Befund:** „Glatte Aktivierungen bleiben für endliche Eingaben umkehrbar.“

**Problem:** Das ist falsch. GELU ist glatt, aber nicht monoton und damit nicht injektiv; aus Glattheit folgt keine Umkehrbarkeit. Die Folie sagt im selben Absatz selbst, dass GELU nicht monoton ist. Sigmoid und tanh sind umkehrbar, GELU nicht.

**Quelle:** Hendrycks & Gimpel (2016), *Gaussian Error Linear Units*, arXiv:1606.08415.

**Schweregrad:** Faktisch falsch.

### 17.1 Der Raum biegt sich

**Befund:** „Eine Schicht hebt die Punkte in eine höhere Dimension“ und „Im LLM macht das FFN pro Token genau diese Art von Biegung.“

**Problem:** Eine Dense-Schicht kann die Dimension erhöhen, senken oder gleich lassen; „hebt in eine höhere Dimension“ ist keine allgemeine Eigenschaft. Das FFN ist außerdem kein explizites räumliches Falten; Geva et al. beschreiben es als Key-Value-Gedächtnis. Die Formulierung ist eine didaktische Metapher, die als Mechanismus gelesen werden kann.

**Quelle:** Geva et al. (2021), *Transformer Feed-Forward Layers Are Key-Value Memories*, arXiv:2010.01019.

**Schweregrad:** Überzogen.

### 18.1 Die Rolle von neuronalen Netzen im Transformer

**Befund:** „Jedes Token wird nach jedem Attention durch das gleiche Neuronale Netz getan, dass dann die kontextualisierten Tokens unabhängig voneinander verschiebt.“ Außerdem enthielt die Box „Wie sind FFN mathematisch aufgebaut?“ rohe `$$…$$`-Blöcke.

**Problem:** „dass“ muss „das“ heißen. Die rohen `$$`-Blöcke wurden vom Box-Renderer nicht als Display-Mathematik verarbeitet; `proseBlock` in `learnsys.js` erkannte nur `$…$`, nicht `$$…$$`. **Status:** behoben; `proseBlock` behandelt reine `$$…$$`-Blöcke jetzt als Display-Mathematik.

**Schweregrad:** Sprache und Display-Math sind behoben.

### 22.1 Ein Wort nach dem anderen

**Befund:** `$p_i propto exp(z_i/T)$` und `$T` mit einem Tab vor `o 0$` erschienen als Text.

**Problem:** Die Backslashes fehlten; die Formeln wurden nicht gesetzt. **Status:** behoben. Gemeint sind `p_i \propto \exp(z_i/T)` und `T \to 0`.

**Schweregrad:** War ein Blocker; behoben.

### 23.1 Die Karte der Wörter

**Befund:** „Nähe zum Zentrum ist Wahrscheinlichkeit.“ und „Mabrok (2026) nennt das Band um eine Naht die Expressibility Gap.“

**Problem:** So allgemein ist der Satz nicht richtig: Token-Wahrscheinlichkeiten entstehen durch Softmax über Logits, nicht durch Nähe zu einem Zentrum. Die Wiese ist eine Voronoi-/Landschaftsvisualisierung, keine Wahrscheinlichkeitsgeometrie des Modells.

Mabrok definiert die „expressibility gap“ als geometrisches Maß für die semantische Verzerrung durch die Diskretisierung des Vokabulars, nicht als „Band um eine Naht“. Die Formulierung ist eine Umdeutung.

**Quelle:** Mabrok (2026), *Latent Semantic Manifolds in Large Language Models*, arXiv:2603.22301, Abstract.

**Schweregrad:** Faktisch ungenau und Quelle falsch wiedergegeben.

### 24.2 Wie ein LLM sein Weltmodell aufbaut

**Befund:** „Damit ist gezeigt, dass LLMs nicht nur das nächste Wort vorhersagen, sondern dabei auf einem inneren Modell der Welt arbeiten.“ und „Jeder der Punkte in dem LLM hat eine Richtung und eine Entsprechung des Nullpunkts“.

**Problem:** Die Studie untersucht ein kleines Othello-GPT, nicht „LLMs“ allgemein. Sie zeigt eine lesbare Brettrepräsentation, keinen allgemeinen Beweis für Weltmodelle in LLMs. „Jeder der Punkte in dem LLM“ ist unklar; die Probe liest pro Feld einen Zustand, nicht jeden Punkt im Modell.

**Quelle:** Li et al. (2023), arXiv:2210.13382; Nanda, Lee & Wattenberg (2023), arXiv:2309.00941.

**Schweregrad:** Überzogen und unklar.

### 25.1 Wo liegt Paris?

**Befund:** „Das Ergebnis zeigte, dass die KI tatsächlich eine präzise, geometrische Weltkarte und ein Zeitverständnis in ihren Gewichten entwickelt, in denen Städte und Ereignisse in ihren korrekten Relationen zueinander stehen.“

**Problem:** Das Papier sagt ausdrücklich, die räumlichen und zeitlichen Repräsentationen seien „not a dynamic causal world model in their own right“. Die Karte ist relativ: Die Probe trifft die relative Position besser als die absolute; die Fehler sind messbar. „Präzise“ und „korrekte Relationen“ überziehen das Ergebnis. Der Context-Text sagt selbst „Relativ, nicht absolut“, der Haupttext widerspricht ihm. Außerdem liest die Probe Aktivierungen, nicht die Gewichte; „in ihren Gewichten“ ist ungenau.

**Quelle:** Gurnee & Tegmark (2023), arXiv:2310.02207, Abstract und §3.1.

**Schweregrad:** Überzogen und intern widersprüchlich.

### 25.2 Wann starb Turing?

**Befund:** „Das Paper zeigt, dass Sprachmodelle rein durch das Lesen von Texten einen inneren Zeitstrahl entwickeln.“ und in der Box „Kausalität für das Modell“: „Verschiebt man die Aktivierungspunkte entlang der Raum- oder Zeitachse, gibt die KI … Städte aus einer anderen Himmelsrichtung aus oder verlegt historische Ereignisse in eine andere Epoche.“

**Problem:** Das Papier zeigt lineare Lesbarkeit von Zeit und einzelne Zeit-Neuronen. Es sagt selbst, die Repräsentationen seien kein dynamisches kausales Weltmodell. Die Intervention im Papier pinnt einzelne Neuronen und ablatiert sie; sie verschiebt nicht „Aktivierungspunkte entlang der Raum- oder Zeitachse“. Die Box beschreibt also eine Intervention, die so nicht durchgeführt wurde. Auch „ordnet Ereignisse plötzlich anderen Zeiträumen zu“ ist stärker als die Änderung der nächsten Token-Vorhersage.

**Quelle:** Gurnee & Tegmark (2023), §5 und Appendix B, insbesondere „Time Intervention“ und „Neuron Ablations“.

**Schweregrad:** Überzogen und faktisch falsch.

### 26.1 Ein Agent ist dasselbe Modell mit Werkzeugen

**Befund:** „Es sind dieselben Gewichte wie im Browser.“

**Problem:** Ein Agent kann dasselbe Basismodell verwenden, aber nicht jeder Agent nutzt dieselben Gewichte, und die Browser-Demo ist kein Agent. Die Formulierung verwechselt „gleiches Modell“ mit „gleiche Gewichte wie diese Demo“. Besser: „Ein Agent ist ein Loop um ein LLM; die Gewichte können dieselben sein, der Kontext und die Werkzeuge ändern sich.“

**Quelle:** Yao et al. (2022), ReAct, arXiv:2210.03629; Schick et al. (2023), Toolformer, arXiv:2302.04761.

**Schweregrad:** Überzogen und irreführend.

### 27.1 Arten von Halluzinationen

**Befund:** „‚nicht traurig‘ ist nicht automatisch ‚glücklich‘, weil Attention nicht exakt auf das Antonym verschiebt.“

**Problem:** Das ist eine unbelegte mechanistische Behauptung. Attention ist kein lexikalischer Negationsoperator; sie verschiebt keine Token-Bedeutungen „auf das Antonym“. Die Quellen der Folie (Ji et al., Maynez et al., Huang et al., Rawte et al.) belegen diese Aussage nicht. Der Satz sollte entfernt oder durch eine belegte Erklärung von Negationsfehlern ersetzt werden.

**Schweregrad:** Faktisch unbelegt.

### 28.1 Suchen, lesen, einsetzen

**Befund:** „RAG gibt ihm Werkzeuge“.

**Problem:** RAG (Retrieval-Augmented Generation) ist kein Werkzeug, sondern ein Verfahren, das Retrieval mit Generierung verbindet. Ein Agent kann Retrieval als Werkzeug nutzen; RAG selbst ist keine Tool-Schnittstelle. Die Kicker-Zeile „RAG und Agents“ trägt zur Vermischung bei.

**Quelle:** Lewis et al. (2020), arXiv:2005.11401.

**Schweregrad:** Faktisch ungenau.

### 29.1 Geschichte in zehn Schritten

**Befund:** „Der Wolfsknochen von Dolní Věstonice trägt 55 Kerben in zwei Gruppen von 30 und 25.“ und „Leibniz baut eine Rechenmaschine für alle vier Grundrechenarten“.

**Problem:** Die Gruppierung 30/25 war durch die Bildquelle nicht gedeckt; sie ist entfernt. Leibniz begann 1673 mit dem Holzmodell, stellte die Rechenmaschine aber erst 1694 fertig; sie arbeitete wegen Getriebe- und Übertragsproblemen nicht zuverlässig. Die Formulierung ist jetzt entsprechend korrigiert. Die Timeline-Tabs haben eigene Quellen; die Hauptquellenliste bleibt schlank.

**Quelle:** Wikimedia Commons, *Wolf Bone from Dolní Věstonice*; Wikipedia, *Stepped reckoner* (Start 1673, Fertigstellung 1694, unzuverlässig); Wikipedia, *Salamis Tablet*; die Quellen der Timeline-Tabs.

**Schweregrad:** War eine ungedeckte Aussage; behoben.

### 30.1 Du bist das Chinesische Zimmer

**Befund:** „Ein LLM … manipuliert Tokens nach gelernten Regeln, ohne den Weltbezug der Wörter zu haben.“

**Problem:** Das ist eine philosophische Position, nicht eine feststehende Tatsache. LLMs haben keinen direkten Weltzugang, können aber indirekte statistische Erdung aus Text und multimodalen Daten lernen. Die Folie sollte „keinen direkten Weltzugang“ sagen, nicht „ohne Weltbezug“. Die Quellen Harnad und Searle stützen das Problem, nicht die starke Schlussfolgerung.

**Quelle:** Harnad (1990), *The Symbol Grounding Problem*, DOI 10.1016/0167-2789(90)90087-6; Searle (1980), DOI 10.1017/S0140525X00005756.

**Schweregrad:** Überzogen.

### 31.2 Grenzen: Was LLMs nicht zuverlässig können

**Befund:** Der Titel „Was ein LLM strukturell nicht kann“ und „Sprache allein erdet Bedeutung nicht“ sowie „Halluzinationen sind Folge des Ziels ‚plausibler Text‘“.

**Problem:** Der Titel widerspricht dem Context-Text: „Manche sind heute brüchig, andere fehlen strukturell.“ Die meisten genannten Grenzen sind empirisch und modellabhängig, nicht strukturell. „Sprache allein erdet Bedeutung nicht“ ist eine umstrittene Position (Bender & Koller, Bisk et al.), keine bewiesene Tatsache. „Halluzinationen sind Folge des Ziels“ ist monokausal; Folie 27.1 nennt selbst mehrere Ursachen.

**Quelle:** Bender & Koller (2020), ACL; Bisk et al. (2020), arXiv:2004.10151; Ji et al. (2023), arXiv:2202.03629.

**Schweregrad:** Überzogen und intern widersprüchlich.

### 31.3 KI verteilt Macht neu

**Befund:** „Falsche Nachrichten verbreiten sich online schneller als wahre.“

**Problem:** Die Studie von Vosoughi, Roy und Aral untersucht Twitter-Daten von 2006 bis 2017. „Online“ verallgemeinert die Stichprobe auf alle Plattformen. Die Aussage sollte auf Twitter beziehungsweise die untersuchte Plattform begrenzt werden.

**Quelle:** Vosoughi, Roy & Aral (2018), *The spread of true and false news online*, Science, DOI 10.1126/science.aap9559.

**Schweregrad:** Überzogen.

### 32.1 Bewusstsein: die offene Frage

**Befund:** „New Mysterianism sagt, dass Menschen hier an eine kognitive Grenze stoßen könnten, so wie Ratten einfache Gleichungen für ein Labyrinth lernen, an einem Punkt aber scheitern.“

**Problem:** Der Vergleich ist sachlich falsch. Ratten lernen ein Labyrinth, keine Gleichungen. Gemeint ist offenbar: Ratten können einfache Lernaufgaben lösen, aber keine höhere Mathematik. Der Satz ist umgedreht: Ratten lernen ein Labyrinth, aber keine Gleichungen.

Zusätzlich ist „Zugang, Bericht und Kontrolle lassen sich funktional erklären“ stärker, als die Theorien es stützen; die Folie sagt selbst, die Theorien seien uneinig.

**Quelle:** McGinn (1989), *Can We Solve the Mind-Body Problem?*, DOI 10.1093/mind/XCVIII.391.349; Chalmers (1995), *Facing Up to the Problem of Consciousness*.

**Schweregrad:** Faktisch falsch und überzogen.

### 33.3 Wahrheit als Richtung

**Befund:** Der Context-Text lautet: „Die Achse ist gelernt. Positive und negative Beispiele liegen auf verschiedenen Seiten; die Projektion ist ein linearer Readout.“ Der Deep-Text lautet: „Eine lineare Probe ist ein Readout … Die Autoren fragen selbst, ob es eine universelle Richtung oder die erste Hauptkomponente mehrerer Sentiment-Richtungen ist.“

**Problem:** Beide Texte sind aus der Sentiment-Folie 33.1 kopiert. Auf der Wahrheitsfolie geht es um ITI, Wahrheitsrichtungen in Attention-Heads und TruthfulQA, nicht um Sentiment. Das ist ein klarer Kopierfehler und inhaltlich falsch.

**Quelle:** Li et al. (2023), *Inference-Time Intervention*, arXiv:2306.03341; Tigges et al. (2023), arXiv:2310.15154.

**Schweregrad:** Faktisch falsch und Redundanz.

### 34.1 Erst memoriert, dann verstanden

**Befund:** „eine einschichtige ReLU-Transformer mit $d = 128$“.

**Problem:** Grammatik: „ein einschichtiger ReLU-Transformer“. Der Rest der Angaben (P=113, d=128, vier Heads, 512 MLP-Einheiten, 30 % Trainingsdaten, Phasen 1,4k/9,4k/14k) ist durch Nanda et al. gedeckt.

**Quelle:** Nanda et al. (2023), arXiv:2301.05217, §2 und §4.

**Schweregrad:** Sprache.

## Geprüft ohne Befund

Diese Folien wurden vollständig gelesen und hatten keine faktischen oder technischen Probleme, die über den oben genannten Rahmen hinausgehen:

1.1, 2.3, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 10.1, 10.4, 12.2, 12.4, 12.5, 16.1, 19.1, 20.1, 20.2, 20.3, 21.1, 24.1, 24.3, 27.2, 31.1, 33.1, 33.2, 34.2, 34.3.

Bei 3.2 bis 3.5 wiederholt sich die MSE-/Gauß-Formulierung aus 3.1; sie ist dort nicht separat neu zu bewerten. Bei 9.1 und 10.1 ist die didaktische Rede von „fragen“ und „antworten“ durch den Deep-Text als didaktisch markiert; 9.1 hat zusätzlich den sprachlichen Hinweis oben. Bei 19.1 ist die Notizbuch-Analogie ausdrücklich als „stark vereinfachte, vermenschlichte Sichtweise“ gekennzeichnet.

## Quellenqualität

- **Gurnee & Tegmark (2023):** Die Folien zitieren das Papier, überziehen aber die Aussage. Das Papier sagt selbst, die Repräsentationen seien kein dynamisches kausales Weltmodell.
- **Mabrok (2026):** arXiv-Preprint, nicht begutachtet. Die Folie verwendet ihn für eine starke geometrische Aussage; der Begriff „Expressibility Gap“ wird dabei umgedeutet.
- **J3n6 (2012):** Wikimedia-Bild, keine Quelle für die 30/25-Gruppierung des Wolfsknochens.
- **Geschichtsfolie:** Die Hauptquellenliste ist schlank; die Timeline-Tabs haben eigene Quellen. Die 30/25-Gruppierung war nicht gedeckt und ist entfernt.
- **The Unfinishable Map:** Website/Framework, keine begutachtete Quelle; für den Bewusstseinsüberblick als Einstieg brauchbar, aber nicht als Beleg für die Ratten-Analogie.
- **Bender & Koller (2020), Bisk et al. (2020):** argumentieren für eine Position; sie beweisen nicht, dass Sprache allein keine Bedeutung erden kann.

## Quellenverzeichnis

- Stigler (1981), *Gauss and the Invention of Least Squares*: https://doi.org/10.1214/aos/1176345451
- Goodfellow, Bengio & Courville (2016), *Deep Learning*: https://www.deeplearningbook.org/
- Radford et al. (2019), *GPT-2*: https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf
- Petrov et al. (2023), *Language Model Tokenizers Introduce Unfairness Between Languages*: https://arxiv.org/abs/2305.15425
- Sennrich et al. (2016), *Neural Machine Translation of Rare Words with Subword Units*: https://arxiv.org/abs/1508.07909
- Vaswani et al. (2017), *Attention Is All You Need*: https://arxiv.org/abs/1706.03762
- Su et al. (2021), *RoFormer*: https://arxiv.org/abs/2104.09864
- Elhage et al. (2021), *A Mathematical Framework for Transformer Circuits*: https://transformer-circuits.pub/2021/framework/index.html
- Olsson et al. (2022), *In-context Learning and Induction Heads*: https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html
- Geva et al. (2021), *Transformer Feed-Forward Layers Are Key-Value Memories*: https://arxiv.org/abs/2010.01019
- Hendrycks & Gimpel (2016), *Gaussian Error Linear Units*: https://arxiv.org/abs/1606.08415
- Dauphin et al. (2014), *Identifying and attacking the saddle point problem*: https://arxiv.org/abs/1406.2572
- Li et al. (2023), *Emergent World Representations*: https://arxiv.org/abs/2210.13382
- Nanda, Lee & Wattenberg (2023), *Emergent Linear Representations in World Models*: https://arxiv.org/abs/2309.00941
- Gurnee & Tegmark (2023), *Language Models Represent Space and Time*: https://arxiv.org/abs/2310.02207
- Mabrok (2026), *Latent Semantic Manifolds in Large Language Models*: https://arxiv.org/abs/2603.22301
- Yao et al. (2022), *ReAct*: https://arxiv.org/abs/2210.03629
- Schick et al. (2023), *Toolformer*: https://arxiv.org/abs/2302.04761
- Lewis et al. (2020), *Retrieval-Augmented Generation*: https://arxiv.org/abs/2005.11401
- Harnad (1990), *The Symbol Grounding Problem*: https://doi.org/10.1016/0167-2789(90)90087-6
- Searle (1980), *Minds, Brains, and Programs*: https://doi.org/10.1017/S0140525X00005756
- Bender & Koller (2020), *Climbing towards NLU*: https://aclanthology.org/2020.acl-main.463/
- Bisk et al. (2020), *Experience Grounds Language*: https://arxiv.org/abs/2004.10151
- Ji et al. (2023), *Survey of Hallucination in Natural Language Generation*: https://arxiv.org/abs/2202.03629
- Vosoughi, Roy & Aral (2018), *The spread of true and false news online*: https://doi.org/10.1126/science.aap9559
- McGinn (1989), *Can We Solve the Mind-Body Problem?*: https://doi.org/10.1093/mind/XCVIII.391.349
- Chalmers (1995), *Facing Up to the Problem of Consciousness*: https://consc.net/papers/facing.pdf
- Li et al. (2023), *Inference-Time Intervention*: https://arxiv.org/abs/2306.03341
- Tigges et al. (2023), *Linear Representations of Sentiment in Large Language Models*: https://arxiv.org/abs/2310.15154
- Nanda et al. (2023), *Progress Measures for Grokking via Mechanistic Interpretability*: https://arxiv.org/abs/2301.05217
- Wikipedia, *Stepped reckoner*: https://en.wikipedia.org/wiki/Stepped_reckoner
- Wikimedia Commons, *Wolf Bone from Dolní Věstonice*: https://commons.wikimedia.org/wiki/File:Vl%C4%8D%C3%AD_radius.jpg

## Technische Ursache der Formelprobleme

Die Laufzeitstrings in `intuition_learnsys-data.js` enthielten an mehreren Stellen einfache Backslashes statt doppelter Backslashes. JavaScript interpretiert `\c`, `\s`, `\a`, `\h`, `\p`, `\e`, `\t` und `\n` als Escape-Sequenzen oder entfernt den Backslash. Dadurch kamen `cdot`, `sum`, `alpha`, `hat`, `rac`, `propto`, `exp`, `theta`, `eta`, `nabla` und `to` (mit Tab vor `o`) als Text an. Die betroffenen Stellen waren:

- 10.3 und 10.6: `sum`, `alpha`, `ge`, `sum alpha = 1`
- 13.1: `hat y`, `wcdot`, `operatorname`
- 14.1: `hat y`, `wcdot`, `rac`, `sum`, `theta`, `eta`, `nabla`
- 22.1: `propto`, `exp`, `to` (mit Tab vor `o`)

Die englischen Gegenstücke in derselben Datei enthielten teilweise dieselben Fehler; die Korrektur erfolgte in beiden Sprachen. Eine vollständige inhaltliche Prüfung der englischen Fassung steht weiterhin aus.

## Empfohlene Priorität

1. **Keine offenen Blocker.** Formeln und TODO sind behoben.
2. **Zentrale Faktenfehler:** 7.1, 8.1, 10.2, 10.5, 12.1, 12.3, 15.1, 23.1, 24.2, 25.1, 25.2, 33.3.
3. **Überzogene Aussagen:** 2.1, 3.1, 4.1, 5.1, 11.1, 17.1, 26.1, 28.1, 30.1, 31.2, 31.3, 32.1.
4. **Quellen und Sprache:** 2.2, 6.4, 9.1, 29.1, 34.1.
