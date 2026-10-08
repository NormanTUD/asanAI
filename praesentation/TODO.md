# Präsentation „Wie funktioniert Machine Learning mit neuronalen Netzen?" — Aufgaben & Plan

> Diese Datei ist die zentrale Aufgabenliste. Sie wird **bei jedem Schritt aktualisiert**
> (Status: `[ ]` offen · `[~]` in Arbeit · `[x]` fertig · `[-]` verworfen).
> Letzte Aktualisierung: T1, T2, T3, T4, T5(Bug), T6, T10 fertig; Ziel-Folie zeigt
> Katze+Hund (je das Richtige). Hund-Entscheidung: **wechselnd im Training**.
> Nächstes: **T11 DenseRaum-Redesign** (in Arbeit: Hund-Raster in KatzeKit ergänzt).

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

### T3 · `first_layers_vs_last_layers.png` ersetzen (Gesicht-Hierarchie)  `[x]`
- ✅ Fertig: `first_layers_vs_last_layers.png` durch **Inline-SVG-Hierarchie** ersetzt (Folie 4),
  headless clean. 3 Ebenen (früh=Linien blau → mittel=Augen/Nase/Mund amber → spät=Gesicht grün)
  mit nach-oben Pfeilen + Note „Das Netz lernt selbst, worauf es achten muss".
- Konsistent zu Folie 11 (Layer 2 = Augen/Nase/Mund) und Katze=grün-Legende.

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

### T11 · Folie 10 (DenseRaum) Redesign — „Der Layer wölbt den Raum"  `[ ]`
- **Problem**: aktuell „häßlich wie Sau" (Sattel z=x·y, sauberes XOR-Quadranten-Muster).
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


neu: von der folie "Klassisches Programmieren vs. KI" eher so zeigen dass es ne fkt ist die in latex ist beide male und beim einen mal provided der user ihre formale definition  mit soner großen klammer und if else und dann "fließen" beispiele durch so dass er zeile(0, 0 = 0\n1,0 = 0\nf(0,1) = 1 durchfließen sieht und die quasi wie sone alte uhr wo die aktuelle zeit immer da ist wo das f ist was inder mitte bleibt die anderen da durch rotieren
