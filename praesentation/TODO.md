# Präsentation „Wie funktioniert Machine Learning mit neuronalen Netzen?" — Aufgaben & Plan

> Diese Datei ist die zentrale Aufgabenliste. Sie wird **bei jedem Schritt aktualisiert**
> (Status: `[ ]` offen · `[~]` in Arbeit · `[x]` fertig · `[-]` verworfen).
> Letzte Aktualisierung: Folie-2-Batch (Cross-Morph gebaut) + große Feedback-Runde
> (Folie 2 manuell + f fix, Constant-Heading, Rename, Smooth-Transition, Loss-Plot,
> Hierarchy-ausgliedern, Idealisiert-verschieben). Alle neuen Punkte unten als T15–T27.
> **Nächste (in Arbeit): T15** (Folie 2: Switch erst auf manuelles Weiter + f fix, nur
> Zahlen/Ergebnisse rotieren) → dann T16–T27 der Reihe nach.
> Noch offen aus vorher: T7 (Hund im Training), T8 (RGB-Matrix), T9 (Filter-Folie).

## Dateien die ich analysiert habe
- `index.html` — 13 Folien, Reihenfolge unten.
- `katze.js` — KatzeKit-Framework (Steps: k/t/p/c/i/f) + ConvDemo (Folie 6, 8 Schritte),
  FlattenDemo (Folie 7, 2 Schritte), PipelineDemo (Folie 11, 8 Schritte).
- `dense_raum.js` — DenseRaum (Folie 10, „Vom Bild zu Punkten", 5 Schritte, Sattel z=x·y).
- `space_morph.js` — SpaceMorph (Folie 9, „Was machen Dense Layer?", Ei/Schale, schön).
- `hierarchy.js` — HierarchyDemo (Folie 12, echte Faltung auf stop_sign.jpg).
- `nn_demos.js` — NeuronIntroViz (Folie 8, 2 Szenen), TypewriterViz.
- `hund.html` — ASCII-Hund (32×32, `HundKit`, `RGB`, `ART`), Vorlage für den Hund-Track.
- `presentation.js` — DemoRegistry, Fragment-System, Navigation, Boot (runBootSequence).
- `index.css` — `.kz-*` Framework, `.kz-arrow` (grau `#c3c8d2`, **nicht** blau).

## ⚠️ Harte Grenze
- **Kein Bild-Input**: Ich kann keine PNG/JPG ansehen und lade keine externen Bilder.
  → Echte Fotos/Screenshots muss Norman liefern ODER ich baue Canvas-/ASCII-Nachbildungen.

## Folien-Reihenfolge (aktuell, index.html)
1. Titel · 2. Klassisch vs. KI · 3. Geschichte · 4. Man arbeitet in Schichten
· 5. Drei Bausteine (Zielzustand) · 6. ConvDemo „Jeder Pixel ist nur eine Zahl"
· 7. Flatten · 8. Was sind Dense Layer? (NeuronIntro) · 9. Was machen Dense Layer? (SpaceMorph)
· 10. Vom Bild zu Punkten (DenseRaum) · 11. Der gesamte Prozess (Pipeline)
· 12. Convolutions (Hierarchy) · 13. asanAI · 14. Alles idealisiert (neu, T1).

**Geplante Struktur-Änderungen (T17–T27):** Folie 5 Titel (T17) · Folie 9 → „Was sind Dense
Layer?" (T19) · Folie 12 (Convolutions) **raus** → eigene Datei (T24, Deck 14→13) ·
„Alles idealisiert" eine Position **vor** asanAI (T27). → Nummern 12–14 verschieben sich.

---

## Aufgaben

### T1 · Neue Folie am Ende: „Alles idealisiert"  `[x]`
- ✅ Fertig: neue Folie 14 `id="slide-idealisiert"` ganz am Ende (nach asanAI), `node --check` + headless clean.
- Inhalt: idealisiert; Filter müssen nicht „Augen" lernen → passen an Trainingsdaten.
  Beispiel Auto vor blauem Himmel → lernt den Himmel (Shortcut). + Abschluss-Key-Insight.
- **Bild** (Q1 beantwortet): LKW-Foto, URL in HTML-Kommentar als CC-Credit:
  `https://i1.pickpik.com/photos/518/540/912/truck-antique-mexico-cozumel-preview.jpg`
  → lokal `img/truck-antique-mexico-cozumel-preview.jpg`.

### T2 · Folie 4 „Man arbeitet in Schichten": `[Image 1]` = `dense.png` entfernen  `[x]`
- **Annahme**: `[Image 1]` = `img/dense.png` (das erste Bild der Folie). → `<img src="img/dense.png">` löschen.
- `first_layers_vs_last_layers.png` bleibt VORBESTAND, wird aber in T3 ersetzt.
- ⚠️ Falls `[Image 1]` = first_layers gemeint war: umkehren (bestätigt in der Antwort?).

### T3 · Folie 4 Bild: `first_layers_vs_last_layers.png`  `[x]` (REVERT)
- Zuerst durch Inline-SVG-Hierarchie ersetzt, dann von Norman **zurück zum PNG**
  („first_layers_vs_last_layers.png ist besser"). → Folie 4 zeigt wieder
  `<img src="img/first_layers_vs_last_layers.png">` (567×269). SVG entfernt, headless clean.

### T4 · Ziel-Folie (Folie 5): „Katze = 100 %" als Ziel, Training endet bei 95 %  `[x]`
- ✅ Fertig: Key-Insight → „**Katze = 100 %**" (Ziel). `pipeline_ziel.png` **entfernt**, ersetzt
  durch **Live-Canvas** `#goal-cv` (always visible, `.kz-stage` 38vh) → `PipelineGoalDemo` rendert
  das Ziel dynamisch (Katze 100 %, Loss 0,000).
- **Refactor (Q3 „wiederverwenden")**: PipelineDemo-Zeichnerei in geteiltes `PipelineKit`
  (EDGE_MAPS/MAPS, Lernkurve, arrow/Maps/Dense/Neuronen/Loss-Panel, `geom()`, `drawScene()`).
  PipelineDemo (animiert, Folie 11) + PipelineGoalDemo (statisches Ziel, Folie 5) nutzen es.
  `PipelineKit` auf `window` (testbar).
- **Ziel zeigt Katze UND Hund** (Nachtrag von Norman, „je das richtige"): `PipelineGoalDemo`
  rendert **zwei Zeilen** — Katze-Bild → Katze 100 % · Hund-Bild → Hund 100 %, je das Richtige
  leuchtet + „richtig ✓". Wiederverwendet `KatzeKit.drawGrid`/`drawGridHund` + `PipelineKit.drawNeuron`.
- **Verifiziert**: `node --check` + node-Harness (drawScene 5 Zustände + Ziel-Render) + headless clean.
- Training (Folie 11, Schritt 8) endet weiterhin bei **95 %** (unverändert).

### T5 · Folie 6 (ConvDemo) Bug: kein Titel + Bild „springt rein"  `[~]`
- (b) **Bug (FIX, `[x]`)**: Bild „springt rein" behoben. Ursache: `resize()` setzte bei jedem
  Layout-Pass `cv.width/height` neu → Canvas wird gezwittrt (schwarz) → Bild flackert/„springt".
  Fix in `katze.js`: `resize()` setzt width/height nur wenn sich was geändert hat; neu `clear()`
  (weiß füllen, Transform zurück); `presentation.js` convolution `onEnter` → `d.clear()` + `init()`
  nach 80 ms. `node --check` + headless clean.
- (a) **Titel (OFFEN, deferred)**: Folie 6 nutzt dynamische `kz-title` statt `<h2>` — aber das
  tun Folien 6/7/10/11 ALLE (kz-Framework). Ein `<h2>` würde doppeln. → Bewusst offen lassen,
  außer Norman will es explizit.

### T6 · Underbrace unter x (Folie 8, NeuronIntro)  `[x]`
- Unter der x-Spalte in Szene 2 ein **`\underbrace{...}_{\text{das Bild}}`** setzen
  (analog zu „lernbar" unter W und B).

### T7 · Hund-Track: Netz lernt Katze UND Hund  `[~]`
- ✅ **Ziel-Teil fertig**: Folie 5 (Ziel) zeigt Katze UND Hund, je das Richtige (→ T4).
- ✅ **Hund-Raster in KatzeKit** ergänzt: `HUND_ART`/`HUND_RGB`/`drawGridHund` (aus hund.html).
  Dient T7 + T11 (Mini-Hund-Beispieldot).
- ⏳ **Training-Teil (offen)**: PipelineDemo Schritt „Lernen" (6) soll das Eingangs-Bild
  **wechselnd Katze↔Hund** blenden (Normans Entscheidung: „Abwechselnd im Training").
  Ziel bleibt Katze=100 %. → im nächsten Schritt umsetzen.

### T8 · „Katze wird zu Zahlen" → RGB-Matrix-Darstellung  `[ ]`
- Problem: „Katze wird zu Zahlen" ergibt keinen Sinn (ein Bild **ist** schon Zahlen).
- Stattdessen zeigen: Das Bild ist eine **große Matrix**, in der **kleinere Matrizen** stecken
  (je **3 Werte R,G,B** pro Pixel). Mit **LaTeX-Dots** (`\ddots`/`\cdots`) andeuten, dass sie riesig
  ist (32×32×3). **Echte Pixelwerte** aus dem Bild einfüllen, RGB **farbig** ein.
- **Wo**: Folie 6 (Conv), **nach „Jeder Pixel ist nur eine Zahl"**, **statt dem blauen
  Pixel-Zoom** (= das blau markierte Beispiel-Pixel + Zeile zum Wert-Kasten, `drawPixelZoom`,
  `#2563eb`). Zeigt den **linken/oberen Teil** der Bild-Matrix mit RGB-Untermatrizen.
- → **Frage 5** (genauer Einbau: neuer Schritt / Schritt ersetzen / eigene Folie).
- Verknüpft mit T8-Konzept: „das Flatten-Band wird so verbogen, dass es auf die richtige
  Kategorie zeigt" — **zu komplex zu zeigen**, wir zeigen stattdessen die Matrix.

### T9 · „Ein Filter ist ein Muster" → eigene Folie mit Titel  `[ ]`
- Ab Schritt „Ein Filter ist ein Muster für einen Bestandteil." (ConvDemo Schritt 5) aus der
  Conv-Folie ausgliedern → **eigene Folie**, die **einen `<h2>`-Titel** bekommt.
- Konsequent: die Conv-Folie (Folie 6) endet bei „Jeder Pixel ist nur eine Zahl" (+ ggf. T8-Matrix),
  die Filter-/Sweep-/8×8-Schritte ziehen auf die neue Folie.
- ⚠️ Verändert die Schrittanzahl von ConvDemo + DemoRegistry-Eintrag + Folienanzahl (13 → 14+).

### T10 · Terminologie — zwei VERSCHIEDENE Dinge sauber trennen  `[x]`
- (DenseRaum-Teil „Faltung" wird in T11 gesetzt.)
- **Normans Klarstellung**: „die Faltung des Raumes" ≠ „die Convolution".
  - **Layer-Typen / die Convolution** (Filter, Strukturen erkennen) → **„Convolutions"** (Fachbegriff, bleibt).
  - **die Faltung** = das **Wölben/Krümmen des (Merkmals-)Raums** durch eine Schicht
    (SpaceMorph „krümmt den Raum", DenseRaum „wölbt den Raum") → **„Faltung"**.
- **Fix**: `hierarchy.js` Caption[0] „eine echte **Faltung**" beschreibt die Convolution am
  Stoppschild → **„Convolution"** (nicht „Faltung"). „Faltung" ist ab jetzt NUR für die
  Raumkrümmung reserviert. In T11 die Raumkrümmung konsequent „Faltung" nennen.
- Code-Identifier (`slide-convolution`, `ConvDemo`) bleiben.
- ✅ BEANTWORTET (war Frage 2).

### T11 · Folie 10 (DenseRaum) Redesign — „Der Layer wölbt den Raum"  `[x]`
- ✅ Fertig: `dense_raum.js` neu geschrieben. Organischer Cluster (Hunde oben/rot, Katzen
  unten/grün, mit Overlap in der Mitte), **wellige** Grenzfunktion b(x)=0.45·sin(2.1x),
  Wölbung z=y−b(x) im SpaceMorph-Stil, feines Gitter auf der Fläche, Trennebene (z=0),
  Rückprojektion auf Score-Achse (links Hund, rechts Katze). „Unser Bild" (Mini-Katze) +
  Beispiel-Hund (Mini-Hund, `KatzeKit.drawGridHund`) als hervorgehobene Punkte.
  `node --check` + headless (Folie 10) clean.
- **Problem (vorher)**: „häßlich wie Sau" (Sattel z=x·y, sauberes XOR-Quadranten-Muster).
- Die **vorherige Folie (SpaceMorph, Folie 9) ist schöner** → deren Raumkrümmungs-Stil übernehmen.
- Neue Anforderungen:
  - 2D-Punkt-Darstellung. „Unser Bild" ist **ein Punkt im 32×32=1024-dimensionalen Raum**
    (den wir nicht zeigen können) → andeuten.
  - **Komplexere Trennfunktion** als z=x·y: sieht **komplex** aus, aber **ich (Autor) kenne die
    Trennfunktion** (deterministisch, damit Trennung + Projektion sauber funktionieren).
  - Punkte **halbwegs random** streuen → **länglicher Cluster**: **Hunde oben, Katzen unten**,
    mit **Overlap in vielen Regionen** (Nicht-XOR). Simuliert, „wie PCA auf 1000 Hund-/Katzenbildern".
  - **Ein Beispiel-Hund-Punkt** (rot, mit Mini-Hund aus `hund.html`) + **ein Beispiel-Katzen-Punkt**
    (grün, Mini-Katze) hervorheben; „unser Bild" landet am Ende auf der **Katzen-Seite**.
  - Farben: Hund = **rot**, Katze = **grün** (konsistent zu Pipeline/DenseRaum-Legende).
- Schrittfolge (aktuell 5): Panel(Zahlen) → Punkte → Wölbung → Ebene → Linie.
  → Panel-Schritt (0) evtl. durch T8-Matrix-Logik ersetzen/kürzen? (siehe Annahmen/Fragen)

### T13 · Folie 2 „Klassisch vs. KI": Funktionen + Flip-Clock  `[x]`
- ✅ Fertig: beide Seiten als **LaTeX-Funktion**. Klassisch = formale Definition mit **großer
  Klammer** (`\begin{cases}` + If/Else): f(a,b)=1 wenn a=1∧b=1, 0 sonst. KI = `f(a,b)=?`
  (Netz findet f aus Beispielen).
- **Flip-Clock** (`FlipClockViz` in nn_demos.js, DOM+rAF, kein Canvas): die 4 korrekten UND-
  Auswertungen `f(0,0)=0 · f(0,1)=0 · f(1,0)=0 · f(1,1)=1` **fließen** wie ein alter
  Zahlenblender durch die fixierte f. Aktuelles Beispiel immer in der **Mitte** (unter dem
  Zeiger + „f"-Badge), die anderen rotieren links durch. Nahtloser Loop (Periode 4·spacing),
  per-Tile Opacity/Scale nach Distanz zur Mitte, Kantengradient (mask). **Flüssig** (rAF),
  MathML (temml), formal korrektes UND-Tableau.
- Typewriter (Code-Block) auf dieser Folie entfernt → `TypewriterViz.activate()` no-oped
  (sonst blockierte sie die Pfeiltasten). Registry: `klassisch-flipclock` (guard=false →
  frisst keine Tasten). `node --check` + headless (Folie 2) + DOM-Dump (22 Tiles, MathML,
  cases gerendert) clean.

### T14 · Ziel-Folie (Folie 5) zentrieren  `[x]`
- ✅ Fertig: `PipelineGoalDemo.render()` zentriert jetzt den Inhalt (Gesamtbreite berechnen,
  mittig platzieren) — vorher saß alles links, rechts zu viel Freiraum. `node --check` +
  headless (Folie 5) clean.

### T13b · Folie 2 Cross-Morph BAST (Grundlage für T15)  `[~]`
- BAST (ungetestet im Real-Time-Morph): `#klassik-stage` (zentriert, volle Höhe, keine Karten)
  mit zwei Layern — `.klassik-formula` (LaTeX `f(a,b)={cases}`) + `#flip-clock`. `FlipClockViz`
  (nn_demos.js) baut 16 Tiles, vertikaler Loop, per-Tile Opacity/Scale. `node --check` + headless
  (Folie 2) clean; DOM-Dump: 16 Tiles, richtige Helligkeit (Mitte hell). Morph-Zeitpunkt =
  `enterT + 1200 ms` (AUTO) — **wird in T15 auf manuell umgestellt**.

### T15 · Folie 2: Switch erst auf manuelles Weiter + `f(...)` fix, nur Zahlen rotieren  `[x]`
- ✅ Fertig: (1) Switch nur auf manuelles Weiter — Registry `klassisch-flipclock`
  (`guard:()=>true`, `canNext:'canSwitch'`, `nextMethod:'advance'`) frisst den **ersten Next**
  (triggert `advance()` → Cross-Morph), danach fallen Fragmente/Navigation normal durch.
  (2) Flip-Clock = **fixes `f( , ) =`** (Glyphen) + **3 Spalten** `a`,`b`,`o` (vertikale Slots,
  Werte rollen von oben durch die Auslese-Zeile, sync, nahtloser Loop, Vorwärts 0,1,2,3).
- **Verifiziert:** `node --check` + headless (Folie 2) clean; DOM-Dump (4 Glyphen, 3 Spalten,
  36 Werte, Formel sichtbar / Flip-Clock versteckt am Start); Real-Time-Run (autoswitch-Hook,
  danach entfernt): Cross-Morph komplett (`aOp=0 cOp=1`), offset steigt, `ex`=0→1→2→3.
- **Norman (2×):** (1) Der Switch (Formel → Flip-Clock) soll **erst kommen, wenn ich manuell
  weitermache** (Pfeil/Next) — nicht auto nach 1,2 s. (2) Das **`f(...)` soll stehen bleiben**,
  nur die **Zahlen und Ergebnisse** rotieren rein (von oben).
- **Umsetzung:**
  - Trigger manuell: `FlipClockViz` bekommt `canSwitch()` (true solange Switch offen) +
    `advance()` (triggert den Switch). Registry `klassisch-flipclock`: `guard:()=>true`,
    `canNext:'canSwitch'`, `nextMethod:'advance'` (frisst den ersten Next, danach fallen
    Fragments/Navigation normal durch). `start()` baut Flip-Clock (versteckt) + zeigt Formel,
    wartet auf `advance()`.
  - Flip-Clock-Struktur: **fixes `f( , ) =`** + **3 rotierende Spalten** `a`,`b`,`o`
    (jeweils vertikaler Slot, Werte rollen von oben durch die mittlere Auslese-Zeile, sync).
    `f(0,0)=0 · f(0,1)=0 · f(1,0)=0 · f(1,1)=1`.
  - Cross-Morph (Formel → Flip-Clock) **gleiche Mitte**, flüssig, auf `advance()`.
- `stop()` setzt `switched=false` zurück (beim Verlassen → beim Wiedereintreten Formel zuerst).

### T16b · Folie 2: Beispiel von **AND** auf **x²** (erkennbar, etwas komplexer) umstellen  `[x]`
- ✅ Fertig: `FlipClockViz` **datengetrieben** (`LAYOUT=['f(','x',')','=','o']`, `FIELDS=['x','o']`,
  `EX`), Formel `f(x)=x²` (MathML), 2 Spalten, Beispiele (0,0),(1,1),(2,4),(3,9). `ki-catchout`
  generalisiert („so eine Funktion"). **Verifiziert:** `node --check` + headless clean; DOM-Dump
  (3 Glyphen, 2 Spalten, 24 Werte, x-Kolonne 0,3,2,1 / o-Kolonne 0,9,4,1 → f(0)=0…f(3)=9).
- **Norman:** „such ein anderes Beispiel statt AND … nehme x² oder irgendwas, was man wieder
  erkennt und etwas komplexer ist."
- **Umsetzung:** Haupt-Beispiel = **f(x) = x²** (Parabel, erkennbar, etwas komplexer als AND).
  - Formel (`.klassik-formula`): `$$f(x) = x^2$$`.
  - Flip-Clock: **2 Spalten** `x`,`o` (statt 3 für AND); Beispiele (0,0),(1,1),(2,4),(3,9)
    rollen von oben. Layout `f( [x] ) = [o]`.
  - `ki-catchout`: „Überkill"-Bezug generalisieren (nicht mehr AND, sondern „so eine Funktion").
- → macht FlipClockViz **datengetrieben** (LAYOUT + FIELDS + EX), damit man die Funktion leicht tauschen kann.

### T16 · Folie 2: `ki-catchout`-Text überarbeiten  `[x]`
- Alt-Text („springende Punkt … Katze/Hund") bleibt als Kern, **erweitern**:
  - Für **AND** wäre Lernen **Overkill** — klassisch ist viel **schneller geschrieben**.
  - Aber für **Katze/Hund-Erkennung** geht's klassisch **gar nicht**: es gibt **viel zu viele
    Möglichkeiten** (keine Regeln, die man in Code gießen könnte).
  - Genau da helfen **neurale Netze** (lernen die Regeln aus Beispielen).
- Element: `.ki-catchout.fragment` auf Folie 2 (`slide-klassisch-vs-ki`).

### T17 · Folie 5 (bausteine) Titel: „Drei Bausteine" → „Was wir wollen und drei Bausteine dafür"  `[x]`
- ✅ Fertig: `data-title` + `<h2>` umbenannt. Headless (Folie 5) clean.

### T18 · Konstanter Haupttitel für die kz-Folien (6, 7, 10, 11)  `[ ]`
- **Problem:** Folien 6 (Conv), 7 (Flatten), 10 (DenseRaum), 11 (Pipeline) haben **keinen
  konstanten `<h2>`** wie „Was sind Dense Layer?" (Folie 8) — nur die dynamische `kz-title`.
- **Wunsch (Norman):** konstanter Haupttitel (`<h2>`), der bleibt; die Schritt-`kz-title`
  wird zum **Untertitel**. Wie Folie 9 (SpaceMorph: `<h2>` + `#sm-title`-Overlay).
- Offene Unterfrage: Was ist der **konstante Titel** je Folie? (z. B. Folie 10 „Der Layer
  wölbt den Raum", Folie 7 „Flatten", Folie 6 „Convolution", Folie 11 „Der gesamte Prozess")
  → bei Umsetzen kurz mit Norman abgleichen ODER sinnvoll wählen.

### T19 · Folie 9 (SpaceMorph): „Was machen Dense Layer?" → „Was sind Dense Layer?"  `[x]`
- ✅ Fertig: `data-title` + `<h2>` umbenannt → Folie 8 + 9 tragen denselben Titel (eine Sektion).
- ⚠️ Kollisions-Schutz: `neuron-intro`-Demo + `NeuronIntroViz.isOnIntroSlide()` auf **ID-basiert**
  (`slide-neuronales-netz-intro`) umgestellt, damit der identische Titel Folie 9 nicht trifft.
  `node --check` + headless (Folie 8 + 9) clean.

### T20 · Smooth-Transition Folie 8 → Folie 9 (Inhalt-Wechsel, keine neue Folie)  `[ ]`
- **Norman:** Der Wechsel von „**Universelle Approximation: genug Neuronen → jede stetige
  Funktion**" (letztes Fragment Folie 8, NeuronIntro) zu „**Zwei Klassen, keine Gerade**"
  (Schritt 1 Folie 9, SpaceMorph) soll **smoother** sein — **Inhalt wird ausgetauscht, keine
  neue Folie**, „so wie die anderen Übergänge, richtig smooth".
- **Haken:** Folie 8 = `NeuronIntroViz` (Fragments), Folie 9 = `SpaceMorph` (eigene Steps) —
  zwei getrennte Folien/Demos. Umsetzungsoptionen: (a) beide unter einen Hut bringen (eine
  Folie, mehrere Szenen, Smooth-Content-Swap), (b) Crossfade zwischen 8→9 so soften, dass es
  wie ein Inhalt-Wechsel wirkt. → **konkrete Herangehensweise bei Umsetzen festlegen.**

### T21 · „Aus Zahlen werden Punkte" (Folie 10, DenseRaum): Klar trennbar betonen  `[ ]`
- **Norman:** „da sind die beiden Klassen eben doch **klar trennbar**, was der Rest der
  Layer (Räume wölben) möglich machen soll." → Der Schritt soll den **Payoff** zeigen: nach der
  Faltung/Wölbung sind Katze & Hund **deutlich trennbar**. (Naheliegend mit T25/T26: Trennung
  als Linie.) → ggf. Caption/Insight schärfen. *(Klarstellung: Narrativ-Punkt, evtl. nur Text.)*

### T22 · „Die Katze wird zu Zahlen" entfernen  `[x]`
- ✅ (Interpretation) Schritt-0-Titel der Folie 10 (DenseRaum) von „Die Katze wird zu Zahlen"
  → **„Ein Bild ist schon Zahlen"** (T8: ein Bild **ist** schon Zahlen; „wird zu" war irreführend).
  `node --check` + headless (Folie 10) clean.
- **Norman:** „entferne die ‚Die Katze wird zu Zahlen.' bei ‚Das Ziel: Katze = 100 %.'".
  *(Norman-Referenz „bei Das Ziel" = vermutlich Verwechslung; Text stand nur in Folie 10.
  Falls er ihn woanders meinte: bitte konkretisieren.)*

### T23 · Loss-Plot erst beim „Training" zeigen (Folie 11, Pipeline)  `[x]`
- ✅ Fertig: Loss-Panel (Wert + Mini-Lernkurve) zeigt jetzt **nur im Training** (Schritt 6) —
  `tLossA = step === 6 ? 1 : 0`. Davor/danach bleibt der Loss-Wert im Schritt-Text/Chip stehen.
  `node --check` + headless (Folie 11) clean. *(Wahl: ganzes Panel, nicht nur die Kurve.)*
- **Norman:** „zeige nicht den loss plot. zeige den erst beim ‚training'."
- **Lage:** `PipelineKit.drawLossPanel()` zeichnet Panel **+ Mini-Lernkurve**; wird in
  `drawScene` bei `aLoss ≥ 0,01` gezeichnet, `aLoss` wird in `PipelineDemo` bei
  `step >= 4` (50:50) auf 1 gesetzt. → **Mini-Plot (Kurve)** erst ab dem **Trainings-Schritt
  („Lernen: die Daten immer wieder angucken")** zeichnen; davor nur (oder gar nicht) Wert.
  *(Klarstellung: nur die Kurve, oder das ganze Panel erst beim Training?)*

### T24 · Folie 12 „Convolutions: Strukturen in Bildern finden" → eigene Datei, aus Deck raus  `[ ]`
- **Norman:** „entferne auch die folie … und schiebe sie in ne eigene datei."
- Folie 12 (`slide-hierarchie`, `hierarchy.js`) aus `index.html` entfernen + **eigene Datei**
  (z. B. `hierarchy.html`, lädt `hierarchy.js`), damit sie separat aufzurufen ist. Deck:
  14 → 13 Folien. Registry-Eintrag `hierarchy` anpassen/entfernen (läuft nur in der neuen Datei).
  → verknüpft mit T9 (Filter → eigene Folie), Reihenfolge achten.

### T25 · DenseRaum „Eine Ebene passt dazwischen": große Ebene → Linie  `[x]`
- ✅ Fertig: Schritt 3 (Ebene) zeichnet jetzt **eine Linie** (horizontal, Mitte `z=0`) statt
  einer großen gefüllten Quad-Ebene. `node --check` + headless (Folie 10) clean.
- **Norman (vorige Runde):** In dieser Ansicht reicht eine **Linie** zum Trennen, nicht eine
  große Ebene (Plane). → *(Canvas, nicht visuell geprüft — Linie-Sitz ggf. noch nachschärfen.)*

### T26 · DenseRaum „Alles fällt auf eine Linie": großer Block → normale Linie  `[x]`
- ✅ Fertig: Trennung blendet in Schritt 4 aus (`planeA` nur noch in Schritt 3) → der
  **Score-Strich** (unten, links Hund / rechts Katze) ist der Fokus, kein Block mehr oben.
  `node --check` + headless (Folie 10) clean.
- **Norman (vorige Runde):** Aktuell ist ein großer **Block** oben sichtbar statt einer
  normalen Linie. Soll eine **Linie** sein, die links (Hund) / rechts (Katze) trennt.
  Schritt 4 (Achse/Linie) umstellen. *(Canvas, nicht visuell geprüft — ggf. nachschärfen.
  Verknüpft mit T11-Neuschreiben + T21.)*

### T27 · „Alles idealisiert" (Folie 14) eine Position früher + ausbauen  `[ ]`
- **Norman (vorige Runde):** Folie „Alles idealisiert" **eine Position früher** (vor asanAI)
  und **ausbauen**: rüberbringen, dass es nur die **Intuition** ist, mit der wir arbeiten —
  **nicht** das be-all-end-all, da ist **viel mehr Interessantes + Ungeklärtes** dahinter.

### T12 · Diese TODO.md pflegen  `[~]`
- Bei jeder Änderung Status + Notizen hier aktualisieren.

---

## Offene Fragen (5) — alle beantwortet ✅
1. **Blaues-Himmel-Bild** ✅ = LKW-Foto (Pickpik), Creative Commons. URL in HTML-Kommentar als
   CC-Credit; lokal `img/truck-antique-mexico-cozumel-preview.jpg`. → T1.
2. **Begriff** Faltung vs. Convolution ✅: Layer-Typen = „Convolutions", Raumkrümmung = „Faltung" (→ T10).
3. **Ziel-Folie PNG** ✅: `pipeline_ziel.png` **entfernen** und das Ziel **dynamisch** generieren,
   wiederverwendend aus der Trainings-Animation (PipelineDemo), „Katze = 100 %". → T4.
4. **Hund-Track Umfang** ✅: Hund nur in **Ziel + Training**, **1×** gezeigt, Deck bleibt **katzenzentriert**. → T7.
5. **RGB-Matrix (Folie 6)** ✅: **neuer Schritt** nach „Jeder Pixel ist nur eine Zahl" (nicht eigene Folie). → T8.

## Annahmen (bitte bei Gelegenheit bestätigen)
- `[Image 1]` = `dense.png` (T2).
- Neue „idealisiert"-Folie kommt ganz **am Ende** (nach asanAI).
- „Der blaue Pfeil" = der blaue Pixel-Zoom in ConvDemo (`drawPixelZoom`, `#2563eb`).
- Farben Katze=grün / Hund=rot bleiben (Pipeline-Demos nutzen Grün für die „heiße" Katze).
