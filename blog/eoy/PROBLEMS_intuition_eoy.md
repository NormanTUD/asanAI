# Prüfbericht: EOY Intuition

- Stand: 20. November 2026
- Geprüfte Fassung: `blog/eoy/data.js`, `blog/eoy/demos/*.js`, `blog/eoy/learnsys.js`, `blog/eoy/learnsys.css`
- Umfang: 31 Schritte, 61 Substeps, Deutsch und Englisch
- Methode: Laufzeitstrings aus `data.js`, Quelltexte der Demos, Sichtprüfung in Chromium, Primärquellen wo erreichbar
- Nicht vollständig geprüft: alle 107 externen Links (nur die inhaltlich tragenden Quellen wurden geöffnet), Bildrechte, komplette Barrierefreiheit

**Zweck.** Diese Datei sammelt jeden gefundenen inhaltlichen, mathematischen, sprachlichen und Demo-Fehler. Layoutsprünge wurden direkt behoben; alles andere steht hier als Arbeitsliste. Die Datei ist kein Ersatz für die Quelltexte, sondern der Prüfstand.

## Arbeitsstand

- [x] Bestandsaufnahme und Problemsammlung
- [x] BPE: Byte- und Zeichen-Ebene trennen
- [x] Wochentags-Kreis: Unterraum-Behauptung entfernen
- [x] Attention: Values statt Tokens, Gewichte zu 1
- [x] Q/K/V: Projektionen statt gelernter Gewichte
- [x] OV-Formel: doppeltes `W_V` entfernen
- [x] Neuron: 2 vs. 4 Parameter erklären
- [x] FFN: doppelte Aktivierung entfernen
- [x] Unembedding: `R^768` statt `R^512`
- [x] Schritt 29: nächste Folie und Duplikat
- [x] EN-Formeln: deutsche Labels übersetzen
- [x] Quellen: nicht gewünschte Quellenforderungen aus der Liste entfernt
- [x] Rattenvergleich: als bewusste Analogie behalten
- [x] Verifikation: Syntax und ausgewählte Seiten

**Gerade in Arbeit:** abgeschlossen. Geprüft mit `node --check` für alle EOY-JS-Dateien, 95 statischen MD-Assertions und Chromium/CDP: alle 61 Substeps in DE und EN sowie 62 Step-Seiten liefen ohne JS-Fehler. Die Änderungen im Working Tree sind noch nicht committed.

**Umsetzungsstand:** P0-01 bis P0-06 sind nachgezogen; ab P0-07 sind alle Code-Befunde umgesetzt: Attention/Values, Q/K/V, OV, Neuron, GELU, FFN, Unembedding, Schritt 29, QKV-Normalisierung, die EN-Formeln, P1-02 bis P1-13 sowie P2-01 bis P2-12. P0-12 bleibt bewusst unverändert. Die Befunde unten bleiben als Prüfprotokoll stehen.

## Legende

- **P0:** mathematisch oder faktisch falsch, irreführend oder ohne belastbare Quelle. Vor Veröffentlichung beheben.
- **P1:** Aussage ist zu stark, Quelle fehlt/falsch, Übersetzung oder Navigation kaputt. Zeitnah beheben.
- **P2:** Stil, Redundanz, Politur, Konsistenz. Kann warten.
- **Demo:** sichtbarer Fehler oder Zustand in einer interaktiven Szene.
- **Layout:** Sprung, Überlauf, reservierte Höhe, Flackern.

## Kurzfassung

Die schwersten Probleme sind:

1. **BPE vermischt Byte- und Zeichen-Ebene.** Der Text sagt „256 Zeichen“, die Demo startet mit einzelnen Zeichen.
2. **Der Wochentags-Kreis wird „Unterraum“ genannt.** Ein Kreis ist kein linearer Unterraum.
3. **Attention addiert „Tokens prozentual“.** Gemeint sind Value-Vektoren; die Demo rechnet außerdem mit Prozentkoeffizienten, deren Summe 100 statt 1 ist.
4. **Q/K/V werden als „gelernte Gewichte“ bezeichnet.** Es sind berechnete Vektoren aus gelernten Projektionen.
5. **Die OV-Formel wendet `W_V` doppelt an.** `W_O W_V v_j` ist falsch, wenn `v_j = W_V x_j` schon eingesetzt ist.
6. **Neuron-Parameter widersprechen der Architektur-Box.** Text: 2 Parameter; `mod-layer` auf der Neuron-Folie: 4 Parameter plus Aktivierung.
7. **Dense und Aktivierung werden verwechselt.** Die Biegung kommt von der Nichtlinearität, nicht von der Dense-Schicht.
8. **Die FFN-Formel aktiviert doppelt.** `dense` enthält bereits eine Aktivierung; `activation(dense1(x))` aktiviert ein zweites Mal.
9. **`R^512` ist nicht GPT-2 small.** GPT-2 small hat 768 Dimensionen; 512 ist Othello-GPT.
10. **Schritt 29 verweist auf die falsche nächste Folie** und dupliziert Schritt 31.0.
11. **EN-Formeln enthalten deutsche Beschriftungen** in mehreren Schaubildern.

## P0: Inhalt und Mathematik

### P0-01: BPE: Byte-Ebene und Zeichen-Ebene sind vermischt

**Folie:** 5.0, `BPE: Bytes/Zeichen → Paare → Merges`

**Befund:** Der Text sagt:

> „BPE beginnt normalerweise mit einer Liste von 256 fest definierten Zeichen, das sind alle Kombinationen, die in einem Byte vorkommen können.“

Das ist keine saubere Beschreibung. Byte-Level-BPE startet mit 256 möglichen Byte-Werten, nicht mit 256 „Zeichen“ und nicht mit „allen Kombinationen“. Die Demo startet dagegen sichtbar mit einzelnen Zeichen:

> „Start: einzelne Zeichen“

Damit passen Text, Titel und Demo nicht zusammen.

**Risiko:** Leser:innen lernen die falsche Vokabulargröße und verwechseln Zeichen-, Byte- und Subword-Ebene.

**Korrektur:** Zwei Varianten explizit trennen:

- Zeichen-BPE: Start mit den Zeichen des Korpus.
- Byte-BPE: Start mit 256 Byte-Werten, damit jedes Unicode-Zeichen darstellbar bleibt.

Die Demo als Zeichen-BPE kennzeichnen oder auf Byte-Werte umstellen.

### P0-02: Der Wochentags-Kreis ist kein Unterraum

**Folie:** 6.1, `Wochentage auf einer Linie`

**Befund:**

> „Da auf Sonntag wieder Montag folgt, bilden sie einen Kreis. Dieser Kreis ist ein Beispiel für einen sogenannten Unterraum: ein Raum, der in einen höheren Raum eingebettet, aber in sich abgeschlossen ist.“

Ein Kreis ist kein Vektor-Unterraum. Ein Unterraum muss den Nullvektor enthalten und unter Addition und skalarer Multiplikation abgeschlossen sein. Ein Kreis erfüllt das nicht.

**Risiko:** Der zentrale Begriff „Unterraum“ wird falsch eingeführt und später in 10.2/10.5 für den Simplex wieder gebraucht.

**Korrektur:** „Teilmenge“, „topologischer Teilraum“ oder „Untermannigfaltigkeit“ sagen. Wenn der lineare Begriff gemeint ist, eine Gerade oder Ebene als Beispiel nehmen.

### P0-03: `Kalt + Lauwarm = Warm` ist kein allgemeines Embedding-Gesetz

**Status:** behoben.

**Folie:** 6.0, `Bedeutung wird eine Zahl`

**Befund:**

> „Nun kann man Kalt + Lauwarm rechnen und landet bei 60, also bei Warm.“

Das ist ein handgebautes 1D-Spielzeug. Es zeigt keine Eigenschaft echter Embeddings, sondern nur, dass man einer skalierten Achse beliebige Zahlen zuweisen kann.

**Risiko:** Die Addition von Bedeutungsvektoren wird als allgemeine Rechenregel missverstanden.

**Korrektur:** Explizit als „Spielzeug mit einer einzigen Achse“ markieren; danach klar sagen, dass echte Embeddings viele Achsen haben und Addition nur eine lokale Richtung approximiert.

### P0-04: 4096 Dimensionen gegen GPT-2 small mit 768

**Status:** behoben.

**Folie:** 6.4, `Tausende Dimensionen`

**Befund:** Der Text sagt korrekt:

> „GPT-2 small nutzt 768“

und direkt danach:

> „Die Tabelle zeigt einen Ausschnitt: 16 von 4096 Dimensionen.“

Die Tabelle ist also nicht GPT-2 small. 4096 ist eine andere Modellgröße oder eine hypothetische Darstellung.

**Risiko:** Leser:innen verbinden 4096 mit GPT-2 small.

**Korrektur:** Entweder die Tabelle auf 768 Spalten beziehen oder klar beschriften: „hypothetisches 4096-dimensionales Modell; GPT-2 small hat 768“.

### P0-05: Punktwolke, Mannigfaltigkeit und Übersetzung werden überzogen

**Status:** behoben.

**Folie:** 7.0, `Von Beziehungen zur Übersetzung`

**Befund:**

> „Man nennt solche Gebilde Mannigfaltigkeit“

Eine beliebige Punktwolke ist nicht automatisch eine Mannigfaltigkeit. Außerdem:

> „Übersetzung ist dann dasselbe wie Verschieben, Skalieren und Drehen dieser Mannigfaltigkeit.“

Das ist eine didaktische Metapher, keine mathematische Äquivalenz. Die Demo bietet nur Drehung (yaw), Rotation (roll) und Verschiebung; Skalierung und Scherung fehlen.

**Risiko:** Der Begriff wird zugleich zu stark und zu eng eingeführt.

**Korrektur:** „Diese Punktwolke sieht lokal wie eine niedrigdimensionale Struktur aus; ob sie global eine Mannigfaltigkeit ist, wäre eine eigene Frage.“ Und: „Die Demo zeigt eine Ähnlichkeitstransformation aus Drehung und Verschiebung, nicht jede Übersetzung.“

### P0-06: Positionskodierung: Sinuswellen sind keine Rotationen

**Status:** behoben.

**Folie:** 8.0, `Jeder Platz bekommt einen Fingerabdruck`

**Befund:**

> „Diese schnellen und langsamen Rotationen“

Sinus- und Cosinus-Positionskodierungen sind Schwingungen pro Dimension, keine Rotationen des Token-Vektors. Auch:

> „die Sätze … wären identisch“

ist für einen kausalen Transformer zu stark. Ohne Positionsinformation wäre die Reihenfolge nicht unterscheidbar, aber die Sätze wären nicht notwendig identisch, weil die Tokens selbst unterschiedlich sind.

------------------------------------------------- BIS HIER HIN HAB ICH DEM GESAGT ER SOLL DAS FIXEN ------------------------------------------------------------------------------

**Risiko:** Positions-Embedding und Rotation werden vermischt.

**Korrektur:** „Sinus-/Cosinus-Wellen“ sagen und die Aussage auf „ohne Positionsinformation kann das Modell die Reihenfolge nicht zuverlässig unterscheiden“ abschwächen.

### P0-07: Attention addiert Tokens, nicht Values, und Prozent vs. Bruch

**Folie:** 9.0, `Attention bewegt Punkte anhand des Kontextes`

**Befund:**

> „indem man es prozentual mit allen anderen Tokens addiert“

Gemeint ist eine gewichtete Summe der Value-Vektoren, nicht der Tokens. Die Formel in der Demo zeigt:

> „Summe der Gewichte = 100 %“

und verwendet Koeffizienten wie `1 %`, `8 %`, `89 %`. Mathematisch müssen die Gewichte zu 1 summieren, nicht zu 100. Mit `1 % = 0.01` wäre die Summe 1, die Anzeige „Summe 100 %“ ist dann eine Prozentdarstellung, aber die Formel schreibt die Prozentzahl direkt als Koeffizient.

**Risiko:** Faktor 100 und falsches Objekt der Summe.

**Korrektur:** `x'_i = Σ_j α_ij v_j` mit `α_ij ≥ 0`, `Σ_j α_ij = 1`. In der Demo entweder `0.01` oder `1 %` mit klarer Division durch 100 verwenden.

### P0-08: Q/K/V sind Vektoren, keine gelernten Gewichte

**Folie:** 10.0, `Wie Attention rechnet`

**Befund:** Der Deep-Text sagt:

> „Q, K und V sind gelernte Gewichte“

Q, K und V sind pro Token berechnete Vektoren: `q_i = W_Q x_i`, `k_j = W_K x_j`, `v_j = W_V x_j`. Gelernt sind die Projektionsmatrizen `W_Q`, `W_K`, `W_V`.

**Risiko:** Der Unterschied zwischen Parametern und Aktivierungen geht verloren.

**Korrektur:** „Q, K und V entstehen durch gelernte Projektionen“ schreiben.

### P0-09: Die OV-Formel wendet `W_V` doppelt an

**Folie:** 12.0 `ind-2` und 12.2 `copy-1`

**Befund:** Die Formel lautet:

> `Δx_i = W_O W_V v_j`

Wenn `v_j = W_V x_j` bereits der Value-Vektor ist, ist `W_O W_V v_j` eine doppelte Anwendung von `W_V`. Richtig ist je nach Schreibweise:

- `Δx_i = W_O v_j`, oder
- `Δx_i = W_O W_V x_j`.

**Risiko:** Die zentrale OV-Schaltung ist falsch.

**Korrektur:** Eine der beiden konsistenten Formen wählen und `v_j` klar definieren.

### P0-10: Neuron: 2 Parameter im Text, 4 in der Architektur-Box

**Folie:** 13.0, Text `Was sind neuronale Netze?`; Kontrast: `mod-layer` auf derselben Folie

**Befund:** Der Text in 13.0 sagt:

> „Das kleinste Beispiel ist ein Neuron: $\hat y = w\cdot x + b$. Es hat zwei Parameter“

Die Box `mod-layer` in 13.0 sagt dagegen:

> „w, b, v und c sind Parameter“ und zeigt eine Aktivierung.

Damit beschreiben Text und Box nicht dieselbe Funktion.

**Risiko:** Leser:innen zählen Parameter falsch.

**Korrektur:** Entweder die Demo auf ein lineares Neuron mit `w`, `b` reduzieren oder im Text klar sagen: „Das Modell-Neuron hat vier Parameter und eine Aktivierung; das einfachste lineare Neuron hat zwei.“

### P0-11: GELU: „nicht monoton, daher nicht umkehrbar“ ist kein gültiger Schluss

**Folie:** 15.0, Deep-Text `act-2`

**Befund:**

> „GELU ist glatt, aber nicht monoton und daher nicht umkehrbar.“

Nicht-Monotonie impliziert nicht automatisch Nicht-Invertierbarkeit. GELU ist tatsächlich nicht injektiv, aber die Begründung muss die Nicht-Injektivität zeigen, nicht nur die Nicht-Monotonie.

**Risiko:** Formal falsche Begründung in einem Abschnitt, der Ableitungen und Aktivierungen erklären soll.

**Korrektur:** „GELU ist nicht injektiv, weil verschiedene Eingaben denselben Ausgabewert treffen können; Monotonie ist dafür nicht der richtige Test.“

### P0-12: Dense und Aktivierung (bewusst so, kein Fix)

**Status:** zurückgestellt. Die Dense-Schicht verschiebt/hebt die Punkte, die Aktivierung knickt sie. Die Formulierung „Die Biegung ist eine Dense-Schicht“ ist didaktisch unscharf, aber die Demo und der Abschnitt verweisen auf Origami in $N$ Dimensionen. Deshalb bleibt der Text hier unverändert.


**Folie:** 17.0, `Der Raum biegt sich`

**Befund:** Der Context sagt:

> „Die Biegung ist eine Dense-Schicht“

Eine Dense-Schicht ist affin, also linear plus Bias. Die Biegung kommt von der Aktivierung. Die Dense-Schicht hebt lediglich in eine höhere Dimension.

**Risiko:** Der Unterschied zwischen affiner Projektion und Nichtlinearität wird genau an der Stelle verwischt, an der er gelernt werden soll.

**Korrektur:** „Die Dense-Schicht hebt die Punkte an; die Aktivierung biegt sie.“

### P0-13: FFN-Formel aktiviert doppelt

**Folie:** 18.0, Box `ffn-1`

**Befund:** Die Formel definiert:

> `dense(x) = Aktivierung(W x + b)`

und danach:

> `FFN(x) = dense_2(Aktivierung(dense_1(x)))`

Damit wird `dense_1` bereits aktiviert und danach noch einmal. Richtig ist entweder:

- `dense(x) = W x + b` und `FFN(x) = dense_2(Aktivierung(dense_1(x)))`, oder
- `FFN(x) = dense_2(dense_1(x))` mit `dense` inklusive Aktivierung.

**Risiko:** Die zentrale FFN-Formel ist falsch.

**Korrektur:** Eine konsistente Definition verwenden und `dense` klar als affin oder als affin plus Aktivierung markieren.

### P0-14: `R^512` ist nicht GPT-2 small

**Folie:** 20.0, `Ähnliche Worte finden`

**Befund:**

> „$W_U$ hat eine Zeile $w_i \in \mathbb{R}^{512}$ pro Token“

GPT-2 small hat 768 Dimensionen. 512 ist die Hidden-Größe von Othello-GPT. In 24.0 wird 512 korrekt für Othello verwendet; in 20.0 wird derselbe Wert ohne Kennzeichnung auf das Unembedding übertragen.

**Risiko:** Modellgrößen werden verwechselt.

**Korrektur:** `R^{768}` für GPT-2 small oder „in diesem Spielzeugmodell 512“.

### P0-15: Schritt 29 verweist auf die falsche nächste Folie

**Folie:** 29.0, `Hat eine KI Bewusstsein?`

**Befund:**

> „Auf der nächsten Folie wird daraus die Frage, ob Regeln allein schon Verstehen sind.“

Die nächste Folie ist 30.0 (`Was KI mit uns macht`), nicht das Chinesische Zimmer. Das Chinesische Zimmer folgt erst in 31.0. Außerdem ist der Text von 29.0 fast identisch mit 31.0.

**Risiko:** Leser:innen erwarten den falschen nächsten Schritt; die Wiederholung wirkt wie ein Kopierfehler.

**Korrektur:** 29.0 auf Gesellschaft/Risiken verweisen lassen oder 29.0 und 31.0 zusammenlegen. Den Verweis auf das Chinesische Zimmer in 30.x/31.x verschieben.

### P0-16: QKV-Readout kann Werte über 1000 % zeigen

**Folie:** 10.3 und 10.4, `Head 2: Wo ist es?` und `Head 2 als Graph`

**Befund:** Bei der automatisierten Textextraktion stand im QKV-Readout:

> `Straße 2739.9%` bzw. `Straße 2645.3%`

Ein frischer Aufruf von 10.3/10.4 zeigt dagegen korrekt:

> `Tier 34.0% · Straße 28.4% · war 8.0%`
> `Tier 35.6% · Straße 26.7% · war 8.0%`

Der Zustand ist also nicht bei jedem frischen Laden reproduzierbar. Er deutet auf einen transienten oder stale-scene-Zustand nach Head-/View-Wechsel hin. `drawArcs` in `demos/qkv.js` multipliziert `weights[i]` direkt mit 100, ohne vor der Anzeige zu normalisieren.

**Risiko:** Sichtbare Werte über 100 % zerstören die Glaubwürdigkeit der ganzen Attention-Demo.

**Korrektur:**

- Vor jeder Prozentanzeige `weights` auf Summe 1 normalisieren.
- Einen Test hinzufügen, der nach schnellem Wechsel `Head 1 → Head 2 → Graph → Bögen` prüft, dass alle angezeigten Werte in `[0, 100]` liegen.
- `canvas.__lsQkv.weights` nach jedem Draw auf `Σ ≈ 1` prüfen.

## P1: Inhalt, Quellen, Übersetzung

### P1-01: EN-Formeln enthalten deutsche Beschriftungen

**Status:** behoben. Die Formeln in 12.0, 12.2, 12.3, 14.0, 24.1 und 25.0 haben jetzt englische Labels.

**Folien:** 12.0 `ind-2`, 12.2 `copy-1`, 12.3 `circ-1`, 14.0 `q-box-grad-1`, 24.1 `wm-probe-math`, 25.0 `st-1`

**Befund:** In der englischen Fassung stehen deutsche Formel-Labels, zum Beispiel:

- `QK-Schaltkreis`, `wen besuchen?`, `Kopie`, `was ankommt?`
- `gelernt`, `Key mit Vorgänger`
- `Ausgabe`, `zwei Parameter`
- `Probe-Logit`, `Dot-Products`
- `vorhergesagte Koordinaten`, `lineare Probe`

**Risiko:** Die englische Fassung wirkt unfertig; Formeln sind gemischtsprachig.

**Korrektur:** Labels pro Sprache aus `DE ? … : …` erzeugen oder in eigene `tex`-Felder auslagern.

### P1-02: 11.1: Code-Boxen fehlen, Deep-Boxen bleiben Sprachtext

**Folie:** 11.1, `Code`

**Befund:** Der Substep ist als `scene: "codesemantic", kind: "code"` deklariert und schaltet die Szene um. Die Deep-Boxen sind aber identisch mit 11.0: `sem-1`, `sem-3` und `sem-5` bleiben sprachzentriert; die Code-Boxen `sem-2` und `sem-4` werden nicht in den Vordergrund gestellt. In der geprüften Laufzeit wirkt der Textkasten wie eine Wiederholung von 11.0.

**Risiko:** Der versprochene Code-Vergleich wird nicht vertieft; die Folie wiederholt 11.0.

**Korrektur:** Für 11.1 eigene Code-Boxen anlegen und `sem-2`/`sem-4` sichtbar machen.

### P1-03: 13/15/16 haben identische Titel und Kicker

**Folien:** 13.0, 15.0, 16.0

**Befund:** Alle drei tragen `Was sind neuronale Netze?` als Titel; 13 und 15 haben zusätzlich denselben leeren Kicker. Der Inhalt ist unterschiedlich: lineares Neuron, Aktivierungen, größeres MLP.

**Risiko:** Die Navigation und der Lernpfad wirken kaputt; Leser:innen können die Schritte nicht auseinanderhalten.

**Korrektur:** Titel differenzieren, zum Beispiel:

- 13: `Ein Neuron als Gerade`
- 15: `Aktivierungen machen den Knick`
- 16: `Tiefe Netze biegen die Kurve`

### P1-04: 28.0: Grammatik (behoben), Quellenlage dünn

**Status:** Der Grammatikfehler ist behoben; die Quellenlage der Geschichtsfolie bleibt dünn und ist hier nicht weiter ausgebaut.

**Folie:** 28.0, `Geschichte in zehn Schritten`

**Befund:**

> „Rechnen als Zählen mit Steinen und Kerben: externen Tools“

Grammatikalisch falsch; gemeint ist „externe Tools“ oder „der Gebrauch externer Tools“. Die Geschichtsfolie hat außerdem nur eine sehr dünne Quellenliste für viele Jahresangaben.

**Risiko:** Der Abschnitt liest sich wie ein Stichpunktbruch; die Chronologie ist nicht durchgehend belegt.

**Korrektur:** Satz neu schreiben; für die Jahresangaben mindestens eine Übersichtsquelle pro Strang nennen.

### P1-05: 31.1: „Was Qualia sind, weiß niemand“ ist zu stark

**Folie:** 31.1, `Bewusstsein: die offene Frage`

**Befund:**

> „Was Bewusstsein und Qualia eigentlich sind, weiß niemand.“

Das ist eine globale metaphysische Behauptung, keine gesicherte Tatsache. Der Text sagt selbst, dass es verschiedene Theorien gibt. Der Rattenvergleich bleibt als bewusste Analogie stehen.

**Risiko:** Der Abschnitt verschiebt sich von „umstritten“ zu „niemand weiß es“, obwohl die Quellenlage genau das nicht hergibt.

**Korrektur:** „Es gibt keine allgemein akzeptierte Antwort“ schreiben; den Rattenvergleich unverändert lassen.

### P1-06: 22.0: „kein anderes Arbeitsgedächtnis als den Kontext“ ist zu absolut

**Folie:** 22.0, `Ein Wort nach dem anderen`

**Befund:**

> „Das Modell hat kein anderes Arbeitsgedächtnis als den Kontext.“

Modelle haben Gewichte, Hidden States und einen KV-Cache; „Arbeitsgedächtnis“ ist hier eine Metapher. Der Kontext ist der sichtbare Arbeitsbereich, aber nicht die einzige Informationsquelle.

**Risiko:** Die Aussage ist als Architekturbehauptung falsch.

**Korrektur:** „Was das Modell im aktuellen Schritt sieht, steht im Kontext; die Gewichte tragen das gelernte Wissen, der KV-Cache beschleunigt die Wiederholung.“

### P1-07: 19.0: „frühere Notizen bleiben lesbar“ ist zu stark

**Folie:** 19.0, `Das gemeinsame Notizbuch wird zum Stream`

**Befund:**

> „Frühere Notizen bleiben lesbar, weil addiert und nicht überschrieben wird.“

Residualverbindungen verhindern kein Überschreiben im Sinne der linearen Überlagerung; spätere Schichten können frühere Informationen überdecken oder interferieren. „Lesbar“ ist zu stark.

**Risiko:** Die Residual-Verbindung wird als perfekter Speicher missverstanden.

**Korrektur:** „Frühere Informationen bleiben als Summand erhalten; ob sie lesbar bleiben, hängt von den späteren Projektionen ab.“

### P1-08: 20.0/20.1: Cosine und Logit werden vermischt

**Folie:** 20.0 und 20.1

**Befund:** 20.0 sagt:

> „Die Länge ändert daran nichts“

Das gilt für den Cosinus, nicht für den Logit. 20.2 sagt korrekt:

> „Der Winkel misst die Ähnlichkeit, die Länge skaliert den Logit.“

20.0 und 20.1 sollten diesen Unterschied bereits nennen, sonst wirkt 20.2 wie ein Widerspruch.

**Risiko:** Leser:innen denken, die Länge sei für die Vorhersage irrelevant; tatsächlich kann sie den Logit skalieren.

**Korrektur:** „Für die reine Richtungsähnlichkeit (Cosinus) ist die Länge egal; im Logit `w_i · h` skaliert sie den Wert.“

### P1-09: 10.0: `x'_i` unterschlägt `W_O`

**Folie:** 10.0, `Wie Attention rechnet`

**Befund:** Die Formel definiert:

> `x'_i = Σ_j α_ij v_j`

und nennt `x'_i` „neuer Vektor für Position i“. Die Head-Ausgabe ist aber `y_i = W_O r_i`; `x'_i` ist nur die Mischung `r_i`. Ohne `W_O` ist die Formel nicht die vollständige Attention-Ausgabe.

**Risiko:** Der Unterschied zwischen Mischung und Head-Ausgabe geht verloren.

**Korrektur:** `r_i = Σ_j α_ij v_j` und `y_i = W_O r_i` getrennt schreiben.

### P1-10: 3.0: Ceres war 1801 kein „Zwergplanet“

**Folie:** 3.0, `Gauß, Ceres und die Daten`

**Befund:** Ceres wird rückblickend als Zwergplanet bezeichnet, der Begriff existiert aber erst seit 2006. 1801 war Ceres ein neu entdeckter Himmelskörper zwischen Mars und Jupiter, zunächst als Planet geführt.

**Risiko:** Anachronismus in einer historischen Erzählung.

**Korrektur:** „Ceres, damals als Planet geführt“ oder „heute als Zwergplanet klassifiziert“.

### P1-11: 2.1: Tokenizer wird als „Layer“ behandelt

**Folie:** 2.1, `Bausteine eines LLM`

**Befund:** Die Übersicht listet `T Tokenizer` neben `E Embedding`, `P Positional Embedding`, `×N Transformer-Blöcke` und `U Unembedding` und nennt das „Layer“. Der Tokenizer ist keine gelernte Schicht des Netzwerks; er ist eine Vorverarbeitung.

**Risiko:** Die Architekturgrenze zwischen Datenaufbereitung und Modell verschwimmt.

**Korrektur:** „Stufen der Pipeline“ statt „Layer“; den Tokenizer als Vorverarbeitung markieren.

### P1-12: 14.0: Backprop-Erklärung ist unscharf

**Folie:** 14.0, `q-box-grad-1`

**Befund:** Die Box erklärt den Gradienten als „Ausgabe minus Ziel“ und die Kettenregel, aber der Text sagt nicht klar, dass `p - y` der Gradient des Softmax-Cross-Entropy-Loss nach den Logits ist. Ohne diese Einordnung wirkt `p - y` wie ein allgemeiner Gradient.

**Risiko:** Leser:innen verallgemeinern eine modellspezifische Ableitung.

**Korrektur:** „Für Softmax plus Cross-Entropy ist der Gradient nach den Logits `p - y`; für andere Losses gilt das nicht automatisch.“

### P1-13: 31.2: Filler-Kontrast „keine neue Liste“

**Folie:** 31.2, `Was du mitnimmst`

**Befund:**

> „Die drei Karten sind keine neue Liste von Themen.“

Das ist ein Kontrast ohne Gegner; der Satz verteidigt die Karten gegen einen Vorwurf, den niemand erhoben hat. Der Inhalt danach ist die eigentliche Aussage.

**Risiko:** Der Abschluss wirkt rechtfertigend statt zusammenfassend.

**Korrektur:** „Die drei Karten fassen eine Bewegung zusammen: …“ direkt sagen.

### P1-14: 29.0/31.0: Duplikat und Navigation (behoben)

**Status:** behoben. 29.0 ist jetzt das Chinesische Zimmer mit Searle-Quelle; 31.0 bleibt die Bewusstseinsfrage. Der falsche Verweis auf die nächste Folie ist entfernt, die Doppelung aufgelöst.

## P2: Stil, Politur, Konsistenz

### P2-01: „der Probe“ statt „die Probe“

**Folien:** 24.0, 24.1, 24.2

**Befund:** Mehrfach:

> „der Probe“

richtig ist:

> „die Probe“

**Korrektur:** Alle Vorkommen ersetzen.

### P2-02: 24.0: `die Head-Ausgabe` nach Punkt

**Folie:** 10.5

**Befund:**

> „… nutzt alle Values. die Head-Ausgabe ist …“

Satzanfang klein.

**Korrektur:** `Die Head-Ausgabe`.

### P2-03: 15.0: „ReLU faltet bei null“

**Folie:** 15.0

**Befund:**

> „ReLU faltet bei null“

Gemeint ist „knickt bei null“ oder „faltet den Raum bei null“. „Faltet“ allein ist missverständlich.

**Korrektur:** „ReLU knickt bei null“.

### P2-04: 18.0: Grammatik „getan“

**Folie:** 18.0

**Befund:**

> „Jedes Token wird nach jedem Attention durch das gleiche Neuronale Netz getan“

**Korrektur:** „Jedes Token wird nach jeder Attention durch dasselbe neuronale Netz geschickt“.

### P2-05: 14.0: Beispielwerte mit vielen Nachkommastellen

**Folie:** 14.0

**Befund:** Die Beispielsliste zeigt Werte wie `0.13529411764705884`, `0.17058823529411765`, `-2.38`. Das ist im UI unruhig und suggeriert eine Präzision, die die Demo nicht braucht.

**Korrektur:** Auf 2 oder 3 Nachkommastellen formatieren.

### P2-06: 9.0/10.0: `%`-Anzeige und Formelzeichen

**Folien:** 9.0, 10.0

**Befund:** Die Demo mischt `1 %` als Koeffizient und `Σ = 100 %`. Besser: entweder überall Brüche (`0.01`) oder überall Prozent mit klarer Division durch 100.

**Korrektur:** Eine Darstellung wählen und in Formel und UI gleich halten.

### P2-07: 22.0: `Drache·Ritter` ohne Leerzeichen (bereits korrekt)

**Status:** Die Demo nutzt bereits ein Trenner-Element mit `margin: 0 5px`; im DOM-Text wirkt es nur ohne Leerzeichen. Kein Fix nötig.

**Folie:** 22.0

**Befund:** Die Vorschlagsliste zeigt `Drache·Ritter·Roboter·Schloss·Fluss` ohne Abstände. Das ist auf kleinen Displays schwer lesbar.

**Korrektur:** `Drache · Ritter · Roboter · Schloss · Fluss`.

### P2-08: 26.0: `Gleiches Modell ein Agent …`

**Folie:** 26.0

**Befund:** Die Überschrift/Zeile ist grammatisch abgebrochen:

> „Gleiches Modell ein Agent kann dasselbe Modell verwenden“

**Korrektur:** „Ein Agent ist dasselbe Modell mit Werkzeugen“.

### P2-09: 28.0: `~27.000 v. Chr.` und `Antike–1305`

**Folie:** 28.0

**Befund:** Die Zeitachse mischt Epochenbezeichnungen und Jahreszahlen; `~27.000 v. Chr.` ist als Zahl korrekt, aber die Gruppe „Antike–1305“ ist unscharf. Das ist kein Rechenfehler, aber eine didaktische Unschärfe.

**Korrektur:** Einheitliche Zeitachsen-Labels; die Llull-Grenze klar als „1305, Llull“ markieren.

### P2-10: 27.1: Eiffelturm-Antwort 300 m

**Folie:** 27.1

**Befund:** Die Demo zeigt als ungedeckte Antwort:

> „Der Eiffelturm ist 300 m hoch.“

Mit Antenne sind es 330 m. Die 300-m-Antwort ist als absichtliche Halluzination gedacht, aber der Text markiert sie nicht explizit als falsch. Wer nur den Satz liest, nimmt 300 m mit.

**Korrektur:** „300 m (ohne Antenne; falsch für die gestellte Frage)“ oder eine eindeutig falsche Zahl verwenden und als falsch labeln.

### P2-11: 11.0: „Sprache selbst ist Rauschen“

**Folie:** 11.0

**Befund:** Die Metapher ist stark und wird nicht aufgelöst. Sie ist als Einstieg okay, aber der Satz danach sollte klarstellen, dass Rauschen hier „Oberflächenvariation“ meint, nicht informationstheoretisches Rauschen.

**Korrektur:** „Sprache variiert an der Oberfläche: …“.

### P2-12: 17.0: „Jeder Punkt behält seine Nachbarschaft“

**Folie:** 17.0

**Befund:** Der Text sagt, die Biegung sei eine Intuition. Die Formulierung „jeder Punkt behält seine Nachbarschaft“ ist topologisch zu stark; eine nichtlineare Abbildung kann Nachbarschaften verzerren oder zusammenlegen.

**Korrektur:** „Die Darstellung bleibt lokal zusammenhängend, aber Abstände und Nachbarschaften können sich verändern.“

## Demo-Prüfung

### Geprüfte Szenen

| Szene | Folie | Befund |
|---|---|---|
| `gauss` | 3.x | Synthetische Daten sind im Plot als solche gekennzeichnet; gut. |
| `tokenize` | 4.0 | Token-IDs und Subword-Splits sind illustrativ; kein Rechenfehler gefunden. |
| `bpe` | 5.x | Zeichen-BPE und Byte-BPE sind getrennt; die Demo ist als Zeichen-BPE markiert. |
| `weekday` | 6.1 | Linie→Kreis→Linie ist sichtbar; der Unterraum-Begriff ist entfernt. |
| `embedding` | 6.2/6.3 | Vektoren und `≈ Königin` stimmen; 1D-Spielzeug und 4096-Tabelle sind erklärt. |
| `manifold` | 7.0 | Nur Drehung/Rotation/Verschiebung; die Mannigfaltigkeits-Behauptung ist entfernt. |
| `position` | 8.0 | Startzustand leer; Sinuswellen statt Rotationen, keine Kugel-Behauptung. |
| `qkv` | 9.x/10.x | Gewichte werden vor der Anzeige normalisiert; Readout bleibt in `[0, 100]`. |
| `induction` | 12.0–12.5 | 82 % in 12.1 und die 2.5–5B/0.15→0.4-nats-Zahlen in 12.5 sind gedeckt. |
| `linear` | 13.0 | 2-Parameter-Neuron und 4-Parameter-Box sind erklärt. |
| `gradient` | 14.0 | Loss-Werte und `p(Paris)=30 %` stimmen; Formatierung der x-Werte ist unruhig. |
| `activation` | 15.0 | GELU-Begründung korrigiert. |
| `mlp` | 16.0/17.0 | Dense/Aktivierung bewusst als Origami-Bild, kein Fix. |
| `ffn` | 18.0 | Formel korrigiert: `dense` ist affin, die Aktivierung sitzt dazwischen. |
| `residual` | 19.0 | „Notizbuch“ ist als Analogie markiert; „lesbar“ ist abgeschwächt. |
| `unembed` | 20.x | `R^768`; Cosine und Logit sind getrennt. |
| `loss` | 21.0 | `-log(0.30) ≈ 1.20` und `p-y` stimmen für Softmax-Cross-Entropy. |
| `loop` | 22.0 | Sampling/Greedy/Top-p getrennt; Kontext-Metapher korrigiert. |
| `meadow` | 23.0 | „Naht“ ist als Visualisierung markiert; Mabrok/Expressibility Gap ist im Deep-Text korrekt. |
| `worldmodel` | 24.x | Othello-Zahlen 8 Layer/8 Heads/512 Dim stimmen. |
| `worldmap` | 25.x | Gurnee & Tegmark NYC/ridge/MLP/3000 Jahre stimmen. |
| `agent` | 26.0 | Loop und Tool-Ausgaben sind klar; Untertitel korrigiert. |
| `hallucination` | 27.0 | Typen und Ji et al. sind okay; 300 m ist jetzt als falsch markiert. |
| `history` | 28.0 | Grammatik korrigiert; Llull-Grenze ist im Label markiert. |
| `chineseroom` | 29.0/31.x | 29.0 ist jetzt das Chinesische Zimmer; kein Duplikat, kein falscher Verweis. |
| `riskmap` | 30.x | Mechanismen und Gegenmittel sind sachlich; Quellen sind knapp, aber vorhanden. |
| `consciousness` | 31.x | Theorien sind getrennt; Qualia-Formulierung abgeschwächt. |

### Ohne inhaltlichen Befund geprüft

Diese Schritte wurden vollständig gesichtet und haben in dieser Prüfung keinen inhaltlichen Fehler ergeben:

- 1.0, 2.0, 3.1–3.4, 4.0: Einstieg, Daten, Gauß-Demo und Tokenizer.
- 6.2, 6.3: Vektoranalogie und 3D-Tabelle; die Rechnung stimmt.
- 12.1, 12.5: 82-%-Zeile und Induktionszahlen sind gedeckt.
- 21.0: `-log(0.30) ≈ 1.20` und `p - y` stimmen für Softmax-Cross-Entropy.
- 23.0: Wiese und Expressibility Gap sind korrekt eingeordnet.
- 30.0: Risikokarte und die zentralen Quellen sind sachlich konsistent.

Das heißt nicht, dass jede Formulierung optimal ist; nur, dass hier kein P0/P1-Fehler gefunden wurde.

### Canvas-only Demos

Die leeren `innerText`-Werte bei 12.0/12.2/12.3/12.4/12.5, 11.1, 24.1/24.2 und 25.1 sind kein Fehler. Diese Szenen zeichnen ihren Inhalt auf Canvas; der Text ist nicht als DOM-Text vorhanden. Für Screenreader fehlt teilweise eine ausreichende `aria-label`-Beschreibung, besonders bei den reinen Canvas-Szenen.

## Layout-Prüfung

### Direkt behoben

- **`.ls-stage`:** Desktop-Unterrand entfernt, damit die Bühne nicht nach dem Laden springt.
- **`embedding`:** Formel- und Controls-Höhe synchron reserviert; `reserveHeights()` läuft jetzt vor dem ersten Render, nicht asynchron.
- **`manifold`:** Readout-Grid und Wertespalten haben feste Breiten; der Button `Übersetzung finden` springt nicht mehr.
- **`position`:** Startzustand ohne vorab gefüllten Trail; der erste „Weiter“-Schritt baut den Trail sichtbar auf.
- **`weekday`:** Linie→Kreis→Linie mit exakten Bögen; der erste „Weiter“ rollt zur Linie, der zweite zurück, danach geht es weiter.
- **Sim-/Unembed-Controls:** `min-height: 78px`, damit die Buttons beim Umschalten nicht die Bühne verschieben.
- **Riskmap-Kurzbeschreibungen:** `.ls-rm-short` clamp auf zwei Zeilen, damit lange Labels die Karte nicht aufziehen.
- **Loader:** dezenter Modus (`{subtle:true}`) mit transparentem Wash, kleinerem Label und ruhigerem Puls.

### Restbefunde

- Der automatische Scan über 61 Substeps sieht nach dem Mounten weiterhin ein kurzes „Scene layer appeared“-Ereignis. Das ist wahrscheinlich der Wechsel von der leeren Bühne zur ersten Szene, nicht ein Inhaltsfehler. Ein Loader bis zum ersten `draw()` würde das letzte Flackern entfernen.
- Der Scan meldet globale Stage-Änderungen von etwa 4.6 px. Das passt zur Scrollbar-Breite/Layout-Höhe, nicht zu einem einzelnen Demo-Element. Nochmals mit fixierter Viewport-Breite und ohne Scrollbar prüfen.
- Fokus-Probe für 20.2 und 30.1 zeigte nach den Fixes keine Höhenänderung. Das ist kein Beweis für alle 61 Substeps; der vollständige `php_render_validator.py --all-lessons --check-width` fehlt noch.

## Quellenprüfung

### Verifiziert

- **Olsson et al. (2022):** Induktionsfenster etwa 2.5–5B Tokens, Loss `<0.15` → etwa `0.4` nats, sichtbarer Loss-Bump. Die Zahlen in 12.5 sind gedeckt.
- **Mabrok (2026):** `https://arxiv.org/abs/2603.22301`, „Latent Semantic Manifolds in Large Language Models“; Expressibility Gap und Voronoi-Regionen sind vorhanden. Der Deep-Text in 23.0 gibt das korrekt wieder.
- **Gurnee et al. (2026):** `https://arxiv.org/abs/2607.15495`, „Verbalizable Representations Form a Global Workspace in Language Models“; J-space und verbale Reportbarkeit sind gedeckt.
- **Gurnee & Tegmark (2023):** `https://arxiv.org/html/2310.02207v1`; NYC als schwächster Fall, Ridge-/MLP-Probes und 3000-Jahres-Bereich sind gedeckt.
- **Othello-GPT:** 8 Layer, 8 Heads, 512-dimensionaler Residualstrom, 60 legale Züge.
- **International AI Safety Report 2025:** `https://arxiv.org/abs/2501.17805`; als Quelle für 30.0 vorhanden.
- **12.1:** 82 % Attention von Position 6 auf Position 4 ist in der Demo und im Text konsistent.

### Fehlt oder ist zu dünn

- **Rattenvergleich:** bleibt als bewusste Analogie, keine Quellenforderung.
- **Eiffelturm 330 m** als explizite Korrektur der 300-m-Halluzination.
- **Alle 107 URLs** wurden nicht vollständig auf HTTP-Status geprüft. Vor dem nächsten Release `blog/tests/link_checker.py` laufen lassen.

## Empfohlene Reihenfolge

Die Liste ist abgearbeitet. Offen bleiben nur P0-12 (bewusst), die dünne Quellenlage in P1-04 und der vollständige Render-/Link-Check.

1. **P0-07, P0-08, P0-09, P0-13:** Attention- und FFN-Formeln zuerst, weil sie das technische Rückgrat sind.
2. **P0-01, P0-02, P0-04, P0-14:** Begriffe und Modellgrößen, bevor Leser:innen sie weiterverwenden.
3. **P0-10, P0-11:** Neuron und GELU.
4. **P0-15/P1-14:** erledigt (29.0 und 31.0 entwirrt, Navigation repariert).
5. **P1-01:** EN-Formel-Labels; das ist eine schnelle, sichtbare Korrektur.
6. **P0-16:** QKV-Prozentanzeige normalisieren und testen.
7. **P1-03:** Titel differenzieren.
8. **P2:** Stil, Formatierung, Eiffelturm-Label.

## Prüfartefakte

- `/tmp/opencode/eoy_steps_de.json`, `/tmp/opencode/eoy_steps_en.json`
- `/tmp/opencode/all_steps_de.txt`, `/tmp/opencode/all_steps_en.txt`
- `/tmp/opencode/demo_text_de.json`
- `/tmp/opencode/layoutscan.txt`
- `/tmp/opencode/extract_eoy.js`, `/tmp/opencode/show_step.js`

## Prüfstatus

- **Inhalt:** P0-01 bis P0-06 sind nachgezogen; ab P0-07 sind alle Code-Befunde umgesetzt. P0-12 bleibt bewusst unverändert; P1-04 hat weiterhin eine dünne Quellenlage.
- **Demo:** QKV-Gewichte werden normalisiert; BPE, Wochentag, Code-Boxen, Eiffelturm und History-Label sind nachgezogen. Alle 61 Substeps in DE/EN liefen ohne JS-Fehler.
- **Layout:** direkte Sprünge behoben; ein vollständiger Render-Sweep über alle Lessons steht noch aus.
- **Quellen:** tragende Quellen geprüft; vollständiger Link-Check offen.
- **EN:** Formel-Labels und die geänderten Demo-/Textstellen sind übersetzt; vollständiger EN-Durchlauf offen.
