# Präsentation „Wie funktioniert Machine Learning mit neuronalen Netzen?" — Aufgaben & Plan

> Diese Datei ist die zentrale Aufgabenliste. Sie wird **bei jedem Schritt aktualisiert**
> (Status: `[ ]` offen · `[~]` in Arbeit · `[x]` fertig · `[-]` verworfen).
> Letzte Aktualisierung: Anfang (Analyse von index.html + JS-Framework).

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
· 12. Convolutions (Hierarchy) · 13. asanAI.

---

## Aufgaben

### T1 · Neue Folie am Ende: „Alles idealisiert"  `[ ]`
- Inhalt: Das bisher Gezeigte ist **idealisiert**. Filter **müssen** nicht „Augen" lernen
  (können es aber). Sie lernen, **möglichst gut auf die Trainingsdaten** zu passen.
- Beispiel: Kategorie „Auto", alle Autos vor **blauem Himmel** → das Netz lernt den
  **blauen Himmel** (weil das der einfache Shortcut ist), nicht das Auto.
- **Bild**: „creative crommons" — **UNKLAR** (siehe Frage 1). Ich kann es nicht suchen/lesen.
- Platz: „am Ende" (nach asanAI? oder vor asanAI?) — siehe Annahmen.

### T2 · Folie 4 „Man arbeitet in Schichten": `[Image 1]` entfernen  `[ ]`
- **Annahme**: `[Image 1]` = `img/dense.png` (das erste Bild der Folie). → `<img src="img/dense.png">` löschen.
- `first_layers_vs_last_layers.png` bleibt VORBESTAND, wird aber in T3 ersetzt.
- ⚠️ Falls `[Image 1]` = first_layers gemeint war: umkehren (bestätigt in der Antwort?).

### T3 · `first_layers_vs_last_layers.png` ersetzen (Gesicht-Hierarchie)  `[ ]`
- Statt Screenshot: Konzept **Gesichtserkennung ist schwer → leichter: Augen, Nase, Mund
  erkennen → daraus das Gesicht. Aber wie baut man die? → leichter: gerade + gekrümmte
  Linien erkennen (als Auge) → also startet man dort.**
- + „Das tolle: der Computer **lernt selbst**, worauf er achten muss."
- Umsetzung: wahrscheinlich als **neues Canvas-/ASCII-Visual** (kein externer Screenshot).
  → Design-Entscheidung (Konsistenz mit Folie 11 „Layer 2 = Augen/Nase/Mund").

### T4 · Ziel-Folie (Folie 5): „Katze = 100 %" als Ziel, Training endet bei 95 %  `[ ]`
- Aktuell: Key-Insight „Katze ≈ 95 %". → soll „**Katze = 100 %**" (das **Ziel**) sagen.
- Das **Training** (Pipeline, Schritt 8) endet bei **95 %** (bleibt so).
- ⚠️ Statische Grafik `pipeline_ziel.png` (Screenshot, zeigt 95 %) — ich kann sie nicht
  lesen/neu rendern. → **Frage 3**.
- Achtung: PipelineDemo hat bereits P_GOAL=100 / P1=95 (Schritt 5 = Ziel 100 %, Schritt 8 = 95 %).
  Die **Text-Folie 5** ist noch inkonsistent (sagt 95 %) → auf 100 % bringen.

### T5 · Folie 6 (ConvDemo) Bug: kein Titel + Bild „springt rein"  `[ ]`
- (a) Folie hat **kein `<h2>`** wie die anderen (nutzt dynamische `kz-title`). → konsistent machen.
- (b) **Bug**: Beim (Re-)Laden ist das Bild sofort da → verschwindet → taucht erst animiert auf.
  Ursache vermute ich in `init()`/Erst-Frame vs. Entrance-Alpha (PipelineDemo hat `entrancePlayed`-
  Guard, ConvDemo nicht). → reproduzieren & fixen.

### T6 · Underbrace unter x (Folie 8, NeuronIntro)  `[ ]`
- Unter der x-Spalte in Szene 2 ein **`\underbrace{...}_{\text{das Bild}}`** setzen
  (analog zu „lernbar" unter W und B).

### T7 · Hund-Track: Netz lernt Katze UND Hund  `[ ]`
- Ziel: am Ende **beide** ~95 % (Katze-Bild → Katze 95 %, Hund-Bild → Hund 95 %).
- **Training** (Pipeline) soll zeigen, dass das Netz **abwechselnd Hund- und Katzenbild**
  anschaut und dabei besser wird.
- Hund-Daten: ASCII-Hund aus `hund.html` (`HundKit.ART/RGB`) → in katze.js als `Hund`-Raster
  importieren (analog zu `KatzeKit.RGB`).
- **Umfang: Frage 4.**

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

### T10 · Terminologie-Konsistenz (Faltung vs. Convolution)  `[ ]`
- Gemischt: „Convolution"/"Convolutions" (Folien-Titel, Chips, Formel `conv2d`, hierarchy.js
  Titel, katze.js) vs. „Faltung" (hierarchy.js Caption „eine echte Faltung").
- → **Ein Begriff durchgängig** im sichtbaren Text, **Deutsch, so einfach wie möglich**.
- **Welcher: Frage 2.** Code-Identifier (`slide-convolution`, `ConvDemo`) bleiben.

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

## Offene Fragen (5) — warte auf Antwort
1. **Blaues-Himmel-Bild / „creative crommons"**: Was ist das? Bild/URL liefern,
   selbst nachbauen, oder bestimmtes Meme?
2. **Begriff**: „Faltung" (reines DE) vs. „Convolution" (Fachbegriff) durchgängig?
3. **Ziel-Folie PNG**: `pipeline_ziel.png` (Screenshot, 95 %) — Live-Canvas nachbauen,
   nur Text ändern, oder neues 100 %-Bild von Norman?
4. **Hund-Track Umfang**: nur Key-Points (Ziel+Training+1 Dot), oder alle katzen-Folien
   auf Katze+Hund umstellen?
5. **RGB-Matrix (Folie 6)**: neuer Schritt nach „Pixel = Zahl", Schritt ersetzen, oder eigene Folie?

## Annahmen (bitte bei Gelegenheit bestätigen)
- `[Image 1]` = `dense.png` (T2).
- Neue „idealisiert"-Folie kommt ganz **am Ende** (nach asanAI).
- „Der blaue Pfeil" = der blaue Pixel-Zoom in ConvDemo (`drawPixelZoom`, `#2563eb`).
- Farben Katze=grün / Hund=rot bleiben (Pipeline-Demos nutzen Grün für die „heiße" Katze).
