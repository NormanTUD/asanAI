# Präsentation „Wie funktioniert Machine Learning mit neuronalen Netzen?" — Aufgaben & Plan

> Diese Datei ist die zentrale Aufgabenliste. Sie wird **bei jedem Schritt aktualisiert**
> (Status: `[ ]` offen · `[~]` in Arbeit · `[x]` fertig · `[-]` verworfen).
> Letzte Aktualisierung: **6. Runde (Agent) — T42–T45.**
> 1. **T42** `[x]` „Klassisch vs. KI": `prev` nach Morph geht jetzt zurück zu
>    x² (Reverse-Morph via `unswitching`-State). 2. **T43** `[x]` Folie 6:
>    „Für dich jetzt im Abstrakten…" entfernt. 3. **T44** `[x]` „Das Bild als
>    Zahlen": neuer Schritt 6 „f(Bild) = f(Matrix)" — Canvas-Annotation um das
>    Bild + HTML-Label unter der Matrix. 4. **T45** `[x]` „Alles idealisiert":
>    „Es weiß nichts über unser Ziel — es sieht nur die Daten."
> 1. **T36** `[x]` „Was sind Dense Layer?": weißer Raum oben — `#slide-dense-layer`
>    trägt jetzt `style="background:#f8fafc;"` (inline, überschreibt `.slide`'s
>    weißes CSS). 2. **T37** `[x]` „Klassisch vs. KI": persistentes Skelett
>    `f( [x] ) = [o]` — die Glyphen `f(` / `)` / `=` sind dieselben DOM-Knoten
>    in beiden Modi; nur die Slot-Inhalte wechseln (statisch → rotierende Spalten).
>    3. **T38** `[x]` „Das Bild als Zahlen": `tint()` hat für den Blau-Kanal
>    (`i===2`) `lo=0` statt `90` → Stapel nicht mehr fast weiß. 4. **T39** `[x]`
>    DenseRaum-Folie komplett raus: kein `slide-dense-raum`-Div, kein
>    `<script src="dense_raum.js">`, kein Registry-Eintrag. Deck = **13 Folien**.
>    5. **T40** `[x]` SpaceMorph Egg-Szene: Schritt 7 (Index 6) „Und jetzt: unsere
>    Bilder" — Verweis auf 3072D, gleiches Prinzip. 6. **T41** `[x]` Pipeline
>    „Lernen": `cdLock` friert `cdT` auf der Mitte des nächsten Katze-Blocks ein;
>    95 %-Fußtext erst wenn das Bild definitiv Katze ist. **Deck 13 Folien.**
> 1. **T30** `[x]` Matrix auf „Das Bild als Zahlen" → **große LaTeX-`pmatrix`, je Pixel
>    (oben links) ein kleines `pmatrix [R;G;B]`** (Shape (32,32,3), farbiges Bild daneben).
>    2. **T31** kz-Headlines (Folie 7–9/11/12)
>    bekommen **Unterlinie** wie normales `<h2>`. 3. **T32** DenseRaum „Vom Bild zu Punkten"
>    **neu machen**: vorher NICHT linear trennbar → echte Krümmung → Ebene trennt wirklich →
>    „unser Bild" = random Punkt; **Schritt-0-Panel raus** (= T11). 4. **T33** Pipeline
>    „Lernen": Bilder **Hund/Katz ~1 s** je mit **aufleuchtendem Tag** (statt Crossfade).
>    5. **T34** „Das Auto selbst? Kommt ganz hinten dran." **raus**. 6. **T35** Filter-Layout
>    (Folie 8) **robust** machen. Dazu **T12** (diese Pflege). **Deck 14 Folien.**
> **Reihenfolge: T30 → T31 → T32 → T33 → T34 → T35.**

## Dateien die ich analysiert habe
- `index.html` — 14 Folien, Reihenfolge unten.
- `katze.js` — KatzeKit-Framework (Steps: k/t/p/c/i/f) + ConvDemo (Folie 7, 6 Schritte,
  T8: RGB-Matrix als Schritt 5, blauer Pixel-Zoom raus),
  **FilterDemo (Folie 8, 4 Schritte, T9: aus ConvDemo herausgelöst)**,
  FlattenDemo (Folie 9, 2 Schritte), PipelineDemo (Folie 12, 8 Schritte),
  PipelineGoalDemo (Folie 4).
- `dense_raum.js` — DenseRaum (Folie 11, „Vom Bild zu Punkten", 5 Schritte).
- `space_morph.js` — SpaceMorph (Szene B von Folie 10 „Was sind Dense Layer?", Ei/Schale).
- `hierarchy.js` — HierarchyDemo (eigene Datei `hierarchy.html`, T24, aus dem Deck).
- `nn_demos.js` — NeuronIntroViz (Szene A von Folie 10), FlipClockViz (Folie 2), TypewriterViz.
- `hund.html` — ASCII-Hund (32×32, `HundKit`, `RGB`, `ART`), Vorlage für den Hund-Track.
- `presentation.js` — DemoRegistry, Fragment-System, Navigation, Boot (runBootSequence).
- `index.css` — `.kz-*` Framework, `.kz-arrow` (grau `#c3c8d2`, **nicht** blau).

## ⚠️ Harte Grenze
- **Kein Bild-Input**: Ich kann keine PNG/JPG ansehen und lade keine externen Bilder.
  → Echte Fotos/Screenshots muss Norman liefern ODER ich baue Canvas-/ASCII-Nachbildungen.

## Folien-Reihenfolge (aktuell, index.html — 13 Folien)
1. Titel · 2. Klassisch vs. KI · 3. Geschichte · **4. Was wir wollen** (Ziel, T29)
· **5. Man arbeitet in Schichten** · **6. Drei Bausteine dafür** (T29) ·
7. **Das Bild als Zahlen** (ConvDemo, 6 Schritte; Matrix → T30, Blaustapel → T38) ·
8. **Ein Filter ist ein Muster** (FilterDemo, 4 Schritte, T9) · 9. Flatten ·
10. **Was sind Dense Layer?** (gemerged: NeuronIntro = Szene A + SpaceMorph =
Szene B, T20; Egg-Szene endet mit dem Bild-Verweis, T40) ·
11. **Der gesamte Prozess** (Pipeline, T41) · 12. Alles idealisiert (T27, vor asanAI)
· 13. asanAI (Schluss/Live-Demo).
**Raus (T39):** „Vom Bild zu Punkten“ (DenseRaum) — 1024D-Raum kann man nicht
zeigen; der Verweis lebt jetzt am Ende der Egg-Szene (T40). `dense_raum.js` bleibt
als Datei, wird nicht mehr geladen.
**Eigene Datei:** Convolutions (Hierarchy) → `hierarchy.html` (T24, aus dem Deck).

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

### T5 · Folie 6 (ConvDemo) Bug: kein Titel + Bild „springt rein"  `[x]`
- ✅ (a) Titel jetzt über **T18** erledigt: Folie 6 hat `<h2 class="kz-const">Convolution</h2>`
  (konstant) + `kz-title` als Untertitel — kein Doppel-Titel mehr.
- (b) **Bug (FIX, `[x]`)**: Bild „springt rein" behoben. Ursache: `resize()` setzte bei jedem
  Layout-Pass `cv.width/height` neu → Canvas wird gezwittrt (schwarz) → Bild flackert/„springt".
  Fix in `katze.js`: `resize()` setzt width/height nur wenn sich was geändert hat; neu `clear()`
  (weiß füllen, Transform zurück); `presentation.js` convolution `onEnter` → `d.clear()` + `init()`
  nach 80 ms. `node --check` + headless clean.
- (a) **Titel (✅ erledigt, T18)**: ALLE kz-Folien (7/8/9/11/12) haben jetzt
  `<h2 class="kz-const">` (konstant, oben absolut) + `kz-title` als grauen Untertitel —
  kein Doppel-Titel mehr (CSS `.kz-head .kz-const` entblaut, border:none). → **Fertig.**
  (Die **Unterlinie** für die kz-Headlines, wie normales `<h2>`, fehlt noch = **T31**.)

### T6 · Underbrace unter x (Folie 8, NeuronIntro)  `[x]`
- Unter der x-Spalte in Szene 2 ein **`\underbrace{...}_{\text{das Bild}}`** setzen
  (analog zu „lernbar" unter W und B).

### T7 · Hund-Track: Netz lernt Katze UND Hund  `[x]`
- ✅ **Ziel-Teil fertig**: Folie 5 (Ziel) zeigt Katze UND Hund, je das Richtige (→ T4).
- ✅ **Hund-Raster in KatzeKit** ergänzt: `HUND_ART`/`HUND_RGB`/`drawGridHund` (aus hund.html).
  Dient T7 + T11 (Mini-Hund-Beispieldot).
- ✅ **Training-Teil fertig**: PipelineDemo Schritt „Lernen" (6) blendet das Eingangs-Bild
  **wechselnd Katze↔Hund** (smoothstep-Tripelwellen, `cdT`/`mixCD`, Vollzyklus ~3 s); die
  Ausgabe folgt dem Eingang (pCat/pDog/hotCat/hotDog), der Fuß-Text folgt (Katze/Hund X %).
  Ziel bleibt Katze=100 %. `node --check` katze.js clean. *(Crossfade-Gefühl nicht visuell geprüft.)*

### T8 · „Katze wird zu Zahlen" → RGB-Matrix-Darstellung  `[x]`
- ✅ Fertig (Frage 5: **neuer Schritt** nach „Jeder Pixel ist nur eine Zahl"). ConvDemo hat jetzt
  **5 Schritte** (Schritt 5 = „Das ganze Bild ist eine Zahlen-Matrix"): links die graue Katze,
  rechts `drawRGBMatrix` (katze.js) — ein 4×4-Block der oberen/linken echten Pixel, jedes Pixel
  als Zelle mit Farb-Swatch + **R/G/B-Werten farbig** (echt aus `KatzeKit.RGB`), daneben/unten
  **LaTeX-Punkte** (⋯/⋮/⋱) für den riesigen Rest + Label **(32, 32, 3)**.
- **Blauer Pixel-Zoom entfernt**: `drawPixelZoom` + `ZW/ZH/ZR/ZC/ZVAL`/`zoomA` aus dem ConvDemo
  raus (Schritt 4 = graue Katze mittig, kein Zoom-Panel mehr).
- **Verifiziert:** `node --check` katze.js; Nav-Simulation (headless): `conv:0→1→2→3→4` (Matrix)
  → `filter:0→…`; Schritt-5-Inhalt (Titel/Pill/Insight) rendert; keine Console-/Frame-Errors.
  *(Canvas-Look der Matrix nicht visuell geprüft — Zellen-Maße ggf. noch nachschärfen.)*

### T9 · „Ein Filter ist ein Muster" → eigene Folie mit Titel  `[x]`
- ✅ Fertig: ConvDemo auf 4 Schritte gekürzt (Farbbild → 3 Kanäle → Grau → Pixel), Filter-/
  Sweep-/8×8-Logik in neues **`FilterDemo`** (katze.js) ausgegliedert → neue Folie 8
  `slide-filter` „Ein Filter ist ein Muster" (kz-const „Convolution", 4 Schritte: Filter →
  auf Bild gelegt → Sweep → Augen leuchten). Conv-Folie (Folie 7) hat jetzt kz-const
  „Das Bild als Zahlen" (4 Schritte). ConvDemo-Dead-Code (Filter-Setup + Sweep-Guardrails)
  entfernt. Registry: neuer Eintrag `filter` (slideTest `slide-filter`), `convolution`-Kommentar
  auf 4 Schritte aktualisiert. Deck 13 → **14** Folien, Folie-Kommentare umnummeriert.
- **Verifiziert:** `node --check` katze.js + presentation.js; Nav-Simulation (headless, 16×
  ArrowRight ab Folie 7): `conv:0→1→2→3` → `filter:0→1→2→3` → `flatten:0→1` → `dense-layer`.
  Keine Console-Errors. *(Canvas-Rendering der Filter-Folie nicht visuell geprüft.)*

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
- **Nachtrag (2. Runde):** T11 wird in **T32** (DenseRaum-Re-Work) abgeschlossen —
  Schritt-0-Panel („Ein Bild ist schon Zahlen") wird dort **entfernt** (Norman: „entferne
  den Part … aber lasse 'Vom Bild zu Punkten'"). Demo wird 4 Schritte.

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

### T13b · Folie 2 Cross-Morph BAST (Grundlage für T15)  `[x]`
- ✅ Abgeschlossen über **T15**: der letzte offene Punkt (Morph-Zeitpunkt AUTO → manuell) ist
  mit T15 umgesetzt, der Cross-Morph läuft real-time.
- BAST: `#klassik-stage` (zentriert, volle Höhe, keine Karten) mit zwei Layern —
  `.klassik-formula` (LaTeX `f(a,b)={cases}`) + `#flip-clock`. `FlipClockViz` (nn_demos.js)
  baut 16 Tiles, vertikaler Loop, per-Tile Opacity/Scale. `node --check` + headless (Folie 2)
  clean; DOM-Dump: 16 Tiles, richtige Helligkeit (Mitte hell).

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

### T18 · Konstanter Haupttitel für die kz-Folien (6, 7, 10, 11)  `[x]`
- ✅ Fertig (Norman bestätigt Titel): konstanter `<h2 class="kz-const">` in jeder `kz-head`
  (oben, absolut) + Schritt-`kz-title` zum **Untertitel** (kleiner, grau #64748b) demotiert.
  Titel: Folie 6 **Convolution** · Folie 7 **Flatten** · Folie 10 **Vom Bild zu Punkten** ·
  Folie 11 **Der gesamte Prozess**. CSS-Spezifität: `.kz-head .kz-const` (0,2,0) schlägt
  `.slide h2` (0,1,1) → kein blauer Standard-H2 + keine Border. `node --check` n/a +
  headless (Folie 6) clean, 4 Headings im DOM. *(Canvas nicht visuell geprüft — H2/Untertitel-Sitz.)*
- **Problem:** Folien 6 (Conv), 7 (Flatten), 10 (DenseRaum), 11 (Pipeline) haben **keinen
  konstanten `<h2>`** wie „Was sind Dense Layer?" (Folie 8) — nur die dynamische `kz-title`.
- **Wunsch (Norman):** konstanter Haupttitel (`<h2>`), der bleibt; die Schritt-`kz-title`
  wird zum **Untertitel**. Wie Folie 9 (SpaceMorph: `<h2>` + `#sm-title`-Overlay).

### T19 · Folie 9 (SpaceMorph): „Was machen Dense Layer?" → „Was sind Dense Layer?"  `[x]`
- ✅ Fertig: `data-title` + `<h2>` umbenannt → Folie 8 + 9 tragen denselben Titel (eine Sektion).
- ⚠️ Kollisions-Schutz: `neuron-intro`-Demo + `NeuronIntroViz.isOnIntroSlide()` auf **ID-basiert**
  (`slide-neuronales-netz-intro`) umgestellt, damit der identische Titel Folie 9 nicht trifft.
  `node --check` + headless (Folie 8 + 9) clean.

### T20 · Smooth-Transition Folie 8 → Folie 9 (Inhalt-Wechsel, keine neue Folie)  `[x]`
- ✅ Fertig (Ansatz: 8+9 mergen, Norman bestätigt). Folie 8 (NeuronIntro) + Folie 9
  (SpaceMorph) → **eine Folie** `slide-dense-layer` mit **Szene A** (NeuronIntro-Fragmente)
  + **Szene B** (SpaceMorph-Canvas), Crossfade per `#dl-scene-wrap.in-b` (CSS opacity .45s).
  Neues Demo `dense_merge.js`: nach LETZTEM Fragment frisst „next" den Swap A→B (kein
  Folienwechsel), dann SpaceMorph-Schritte; „prev" am SpaceMorph-Anfang zurück zu A.
  Registry: `raumkruemmung`-Eintrag entfernt (SpaceMorph jetzt über `dense-merge`),
  `neuron-intro` auf Slide-ID + Szene-A-Gate (`isOnIntroSlide` schaltet in .in-b ab),
  SpaceMorph `SLIDE_ID` → merged. Deck 13 → 12.
  **Nav-Test (headless, 13× next):** F1→F2→F3 → bei N5 (alle frags sichtbar) Swap A→B
  (gleiche Folie, inB:false→true, dm:0→1) → SpaceMorph-Schritte → nächste Folie. Clean.
  `node --check` ×4 + headless (Deck) clean. *(Crossfade-Gefühl nicht visuell geprüft.)*
- **Norman:** Der Wechsel von „**Universelle Approximation: genug Neuronen → jede stetige
  Funktion**" (letztes Fragment Folie 8, NeuronIntro) zu „**Zwei Klassen, keine Gerade**"
  (Schritt 1 Folie 9, SpaceMorph) soll **smoother** sein — **Inhalt wird ausgetauscht, keine
  neue Folie**, „so wie die anderen Übergänge, richtig smooth".
- **Haken:** Folie 8 = `NeuronIntroViz` (Fragments), Folie 9 = `SpaceMorph` (eigene Steps) —
  zwei getrennte Folien/Demos. Umsetzungsoptionen: (a) beide unter einen Hut bringen (eine
  Folie, mehrere Szenen, Smooth-Content-Swap), (b) Crossfade zwischen 8→9 so soften, dass es
  wie ein Inhalt-Wechsel wirkt. → **konkrete Herangehensweise bei Umsetzen festlegen.**

### T21 · „Aus Zahlen werden Punkte" (Folie 10, DenseRaum): Klar trennbar betonen  `[x]`
- ✅ Fertig: Payoff-Insight (Schritt 4 „Eine Ebene passt dazwischen") geschärft: „Das ist der
  **Payoff**: nach dem Wölben sind Katze & Hund **klar trennbar** … genau das, wozu die Schicht
  den Raum wölbt." Passt zur Linie (T25/T26). `node --check` + headless (Folie 10) clean.
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

### T24 · Folie 12 „Convolutions: Strukturen in Bildern finden" → eigene Datei, aus Deck raus  `[x]`
- ✅ Fertig: Folie 12 aus `index.html` entfernt (Deck 14 → 13, statischer Zähler stimmt jetzt auch).
  Neue Datei `hierarchy.html` (einzige Folie, lädt `hierarchy.js` + `presentation.js` + Deck-Chrome).
  Registry-Eintrag `hierarchy` bleibt (matcht nur in `hierarchy.html`; im Deck harmlos inaktiv).
  Verifiziert über HTTP: `index.html` + `hierarchy.html` beide clean, 6 Filter-Panels bauen,
  Lade-Spinner blendet aus. (`file://`-SecurityError bei getImageData = nur File-Protokoll, kein Bug.)
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

### T27 · „Alles idealisiert" (Folie 14) eine Position früher + ausbauen  `[x]`
- ✅ Fertig: „Alles idealisiert" vor asanAI geschoben (jetzt Folie 12; asanAI = Folie 13 =
  Schluss/Live-Demo-Überleitung). Haupt-Keypoint ergänzt: „Was ihr gesehen habt, ist die
  **Intuition** … **nicht** das be-all-end-all. Dahinter steckt **viel mehr**:
  **Interessantes und Ungeklärtes**." Blaues-Himmel-Shortcut als Beispiel drunter.
  `node --check` n/a (HTML) + headless (Folie 12/13, Deck 13) clean.
- **Norman (vorige Runde):** Folie „Alles idealisiert" **eine Position früher** (vor asanAI)
  und **ausbauen**: rüberbringen, dass es nur die **Intuition** ist, mit der wir arbeiten —
  **nicht** das be-all-end-all, da ist **viel mehr Interessantes + Ungeklärtes** dahinter.

### T28 · Folie 2 KI-Teil: Flip-Clock → endloser Zahlen-Stream  `[x]`
- ✅ Fertig: Norman „kommt mit den Beispielen 0 und 3 und dann wars das — soll einen
  **endlosen Stream von Zahlen** haben, die **nach oben ausgeblendet** werden". Flip-Clock
  (nn_demos.js `FlipClockViz`) neu: x=0..9, o=x² (Periode 10, nahtlos), Spalten **steigen
  nach oben** (`ty=-offset·VH`), oben per **CSS-Maske** ausgeblendet (`fc-col`-Mask
  `transparent→#000 30%→#000 90%→transparent`), hohe Spalte (`measure` → `min(0.86·H,380px)`),
  Fenster höher (`min(52vh,400px)`), `STEP_S 2.6→1.2` (klar fließend). Pro-Wert-Opacity raus
  (Maske macht das Blenden). **Test (headless, ?start=2 + advance):** post-morph
  `rootOpacity=1`, x-Spalte `0,1,2,…,9,0,1,2…` (40 Werte), Track scrollt (`-68px→-101px`,
  `scrolling=true`), keine Console-Errors. *(Stream-Gefühl/Tempo nicht visuell geprüft.)*
- **Norman:** „bei dem KI-Teil … soll einen endlosen stream von zahlen die nach oben
  ausgeblendet werden da haben".

### T29 · „Was wir wollen" vor „Man arbeitet in Schichten", Bausteine danach  `[x]`
- ✅ Fertig: Norman „die **'was wir wollen'** parts von 'Was wir wollen und drei Bausteine
  dafür' **vor** dem 'Man arbeitet in Schichten', aber das mit den **bausteinen danach**".
  Folie 5 (bausteine) gesplittet → Folie 4 `slide-ziel` „**Was wir wollen**" (Ziel-Keypoint +
  `#goal-cv`/PipelineGoalDemo) vor `slide-schichten`; Folie 6 `slide-bausteine` „**Drei
  Bausteine dafür**" (Chips + Formel + Übergang) danach. Registry `pipeline-goal`
  `slideTest` → `slide-ziel`. Deck 12 → **13**. Kommentare Folie 6/7/8 → 7/8/9 umnummeriert.
  `node --check` + headless (Deck, 13 Folien) clean.
- **Norman:** „mach die 'was wir wollen' parts … vor dem 'Man arbeitet in Schichten'. aber
  das mit den bausteinen danach".

### T30 · „Das Bild als Zahlen" (Folie 7): Matrix → RGB-LaTeX-`pmatrix`  `[x]`
- **Norman:** „das Bild ist schwarzweiß, aber die Matrix nicht. nutze eine reale Matrix
  mit LaTeX." → **Korrektur (Runde 3):** „es muss ne große pmatrix sein, in der je für
  jeden Pixel der oberen linken Ecke ne kleinere pmatrix ist, in der die Farbwerte für
  R·G·B untereinander stehen."
- ✅ **Fertig:** Schritt 5 zeigt jetzt das **farbige** Bild (links, Canvas) + eine **große
  LaTeX-`pmatrix`** (rechts, HTML-Overlay `#conv-matrix`, temml). Jedes Element der großen
  Matrix (je Pixel oben links, 3×3-Block + ⋯/⋮/⋱) ist selbst eine **kleine `pmatrix`
  `[R;G;B]`** mit echten Werten aus `KatzeKit.P` (`.`=[181,176,43], `k`=[20,20,20],
  `d`=[74,51,42], `b`=[122,82,56]). Shape **(32, 32, 3)**.
- `drawRGBMatrix` + `MB/MB_TOP/MB_LEFT/MCC_*/MAT_*` aus dem ConvDemo **raus**; Opazität
  des Overlays wird **event-gesteuert** in `onStep` gesetzt (CSS-Fade `.45s`, robust —
  nicht rAF-Lerp, der in Headless `dt=0` macht). Matrix passt zur Stage (headless:
  `fits=true` bei 1280×800 und 900×560; 27 `<mn>`-Zahlen, alle RGB-Werte da).
- Verknüpft mit „Layout robust": die alte Canvas-Matrix war fix in px (MAT_H ≈ 372) →
  lief bei kleiner Stage über. Die LaTeX-HTML-Matrix skaliert mit dem Text → erledigt.

### T31 · kz-Headlines: Unterlinie wie normaler `<h2>` (alle kz-Folien)  `[x]`
- ✅ **Fertig:** `.kz-head .kz-const` (index.css) jetzt mit `border-bottom: 3px solid #e2e8f0;
  padding-bottom: 8px;` = exakt wie `.slide h2`. Gilt für ALLE kz-Folien (7 Conv, 8 Filter,
  9 Flatten, 11 DenseRaum, 12 Pipeline). Headless verifiziert: `border-bottom=3px rgb(226,232,240)`.
- **Norman:** „Folie 9 und 8 haben keine Headline-Unterlinie wie z. B.
  `<h2>Was sind Dense Layer?</h2>`." → Die `.kz-const`-Headlines (Folie 7 Conv „Das Bild
  als Zahlen", 8 Filter „Convolution", 9 Flatten, 11 „Vom Bild zu Punkten", 12 „Der
  gesamte Prozess") haben **keine** Unterlinie; normale `.slide h2` haben eine.
- → `.kz-head .kz-const` (index.css) bekommt dieselbe **Unterkante** wie `.slide h2`
  (border-bottom / Unterlinie). Gilt für ALLE kz-Folien. Erst prüfen, welche Unterlinie
  `.slide h2` konkret hat, dann 1:1 übernehmen (Farbe/Abstand).

### T32 · DenseRaum „Vom Bild zu Punkten" (Folie 11) neu machen  `[x]`
- ✅ **Fertig** (`dense_raum.js` komplett neu geschrieben, **4 Schritte**).
- (a) **Schritt 0 (Panel) entfernt** (= T11); „Vom Bild zu Punkten"-Titel bleibt. Schritte:
  **Punkte → wölbt → Ebene → Linie**.
- (b) **Nicht linear trennbar**: Katzen (grün) = **Scheibe in der Mitte** (r ≤ 0,5),
  Hunde (rot) = **Ring drumherum** (r ∈ [0,9; 1,25]) — der Ring umschließt die Scheibe,
  KEINE Gerade trennt (3 gestrichelte Kandidat-Geraden H/V/Diagonal zeigen's).
- (c) **Wölbt = Schüssel** `z = x²+y²` (Bowl, `AMP=0,55`): Ring klettert die Wände hinauf,
  Katzen bleiben im Grund — echte, sichtbare Raumkrümmung.
- (d) **Ebene trennt wirklich**: horizontale Ebene `z = R0²` (R0=0,7). Headless verifiziert:
  `catAbovePlane=0, dogBelowPlane=0` (alle 184 Punkte auf der richtigen Seite), `offscreen=0`.
- (e) **„Unser Bild" = zufälliger Katzen-Punkt** (+ Beispiel-Hund = zufälliger Hund-Punkt),
  bei jedem (Re-)Besuch neu (`pickRandom()` in `onStep(0)`, `Math.random`).
- index.html: initialer `#dr-*`-Inhalt auf Schritt 0 („Punkte") umgestellt. `node --check` +
  headless (Geometrie + 4-Schritt-Navigation + Folien-Übergang) clean.
- **Norman:** „das Set ist zu klar linear trennbar"; „'Der Layer wölbt den Raum' zeigt nicht
  so richtig einen gekrümmten Raum — mach es nochmal neu und wirklich gut, so dass es vorher
  NICHT linear trennbar ist, aber nach der Raumkrümmung, die du neu machst, schon"; „bei
  'Eine Ebene passt dazwischen' passt sie eben NICHT dazwischen"; „'Alles fällt auf eine
  Linie': zeige das Bild jeweils einen random Punkt"; „entferne den Part mit 'Vom Bild zu
  Punkten', aber lasse 'Vom Bild zu Punkten'".
- → (a) **Schritt 0 (Panel „Ein Bild ist schon Zahlen") entfernen** (= T11; der
  „Vom Bild zu Punkten"-**Titel** bleibt). Demo wird **4 Schritte**: Punkte → wölbt → Ebene
  → Linie.
- (b) Punkte-Set so streuen, dass Katze & Hund in der **flachen 2D-Ansicht NICHT linear
  trennbar** sind (keine einfachen „oben/unten"; echtes Verschachteln/Overlappen).
- (c) **„wölbt den Raum" neu**: die Krümmung muss die Punkte so umfalten, dass **vorher**
  keine Gerade trennt, **nachher** aber eine Ebene/Linie es kann. Der Übergang
  (nicht-trennbar → trennbar) muss sichtbar sein (z = y − b(x), b(x) passend wählen).
- (d) **„Ebene passt dazwischen"**: die Ebene/Linie muss die beiden Klassen **tatsächlich**
  trennen (alle Hunde einerseits, alle Katzen andererseits) — nicht irgendwo in der Mitte
  liegen, wo Punkte drüber/drunter hängen.
- (e) **„Alles fällt auf eine Linie"**: „unser Bild" = **ein random Punkt** aus dem Set
  (nicht immer derselbe Mini-Katzen-Dot), bei jedem (Re-)Besuch neu gewählt.
- Schließt **T11** ab.

### T33 · PipelineDemo „Lernen" (Folie 12, Schritt 6): Bilder Hund/Katz ~1 s  `[x]`
- ✅ **Fertig** (katze.js, PipelineDemo Schritt 7 / index 6).
- **Diskrete ~1-s-Blöcke** statt Crossfade (T7): `cdState(t)` — `CD_DUR=1,0`, Block
  `floor(t)%2` (0=Hund, 1=Katze, …). Am Block-Wechsel kurzer Crossfade (~0,15 s,
  smoothstep), sonst hart. `cdT += dt/60` (Sekunden).
- **Passender Tag leuchtet**: `hotDog=dog, hotCat=!dog` → das Ausgabe-Neuron der
  aktuellen Bild-Klasse glüht (statt nur bei conf≥90). Confidence wächst 50→95 %
  (`trainP`), Loss ↓, Fuß-Text folgt dem Bild (Hund %/Katze %).
- Node-Unit-Test von `cdState` verifiziert: Hund 0–1 s → Katze 1–2 s → Hund 2–3 s …
  (mixCD hart, Weichschluss am Rand). Headless: Folie erreichbar, keine Fehler
  (Zeit-Animation läuft per rAF/`dt`, in Virtual-Time steht `dt=0` → im Browser normal).
- **Norman:** „jedes Bild soll Hund, Katze, Hund, Katze … ~1 s angezeigt werden, und dazu der
  passende aufleuchtende Tag." → Statt dem **Crossfade** (T7, `cdT`/`mixCD`, weicher
  Katze↔Hund-Blend) **diskrete Blöcke**: **Hund ~1 s** (Hund-Neuron/Tag leuchtet) →
  **Katze ~1 s** (Katze-Neuron/Tag leuchtet) → …, jeweils Eingangs-Bild + **passendes
  leuchtendes Ausgabe-Neuron** + Fuß-Text (Hund %/Katze %).
- In `PipelineDemo` (katze.js, Schritt „Lernen" = 6): statt `mixCD`-Blend ein ~1-s-Takt, der
  Eingang + leuchtendes Output-Neuron + Fuß-Text schaltet.

### T34 · „Alles idealisiert" (Folie 13): „Auto selbst"-Satz entfernen  `[x]`
- ✅ **Fertig:** Satz „<b>Das Auto selbst? Kommt ganz hinten dran.</b>" aus
  `index.html` (Folie 13 `slide-idealisiert`) gelöscht. Absatz endet jetzt bei
  „…weil der <b>einfacher</b> zu erkennen ist als das Auto." — Rest bleibt.
- **Norman:** „'Das Auto selbst? Kommt ganz hinten dran.' ist schlecht formuliert, entferne
  das einfach." → Satz aus `index.html` (Folie 13 `slide-idealisiert`, Absatz „…findet es den
  blauen Himmel — weil der einfacher zu erkennen ist als das Auto. **Das Auto selbst? Kommt
  ganz hinten dran.**") löschen. Rest des Absatzes bleibt.

### T35 · Layout robust: Filter-Folie (Folie 8) Kernel+Katze+Map  `[x]`
- ✅ **Fertig** (katze.js, FilterDemo `layoutFor`).
- **Breiten-Beschränkung** für `s`: `s = min(H/N·.86, W/N·.86, (W−320)/64, 13)`.
  Gesamtbreite Kernel(138px, fix)+Lücken(107)+Katze+Map = `2·imgW + 245` → Gruppe
  **mittig zentriert** (`o.tx = (W−totalW)/2 + 185`). → Kernel läuft nie mehr links ran,
  Map nie mehr rechts über.
- Headless (Target-Geometrie) verifiziert, `fits=true` + keine Overlap bei
  1280×800 / 1024×700 / 800×560 / 640×480. (RGB-Matrix-Teil war in **T30** erledigt.)
- (aus „mach die offenen") Die Filter-Folie (FilterDemo, Folie 8) positioniert
  **Kernel-Panel** (links der Katze) + **Katze** + **8×8-Map** (rechts) mit Größen, die bei
  schmaler Stage nicht mehr alle in `W` passen (Kernel läuft links, Map rechts über).
- → `layoutFor` (katze.js FilterDemo) `s` um eine **Breiten-Beschränkung** erweitern
  (z. B. `s = min(..., (W - ~420) / 64)`), damit Kernel + Katze + Map immer in `W` passen.
  (Der RGB-Matrix-Teil von „Layout robust" ist in **T30** erledigt.)

### T36 · „Was sind Dense Layer?“: weißer Raum oben  `[x]`
- **Norman:** „ist oben weißer raum übrig bevor die folie beginnt, den man nur
  sieht, weil die Folie selbst nen anderen Background hat als die anderen
  (reines weiß).“
- **Ursache:** `#slide-dense-layer .slide-content` trägt `background:#f8fafc`,
  die `.slide` (volle Höhe) ist weiß. Der Content ist via Flex zentriert +
  `fitSlides` skaliert → oben bleibt eine ~22 px weiße Lücke (verifiziert
  headless: y 4..26 weiß, ab y 26 #f8fafc).
- **Fix:** Background auf die `.slide` legen (ganze Folie #f8fafc, Lücke
  verschwindet visuell).
- ✅ **Verifiziert (Runde 5):** `#slide-dense-layer` trägt `style="background:#f8fafc;"`
  (index.html Zeile 317) — inline überschreibt `.slide`'s CSS `background:#ffffff`.

### T37 · „Klassisch vs. KI“: `f(` und `) =` exakt gleich in Modus 1 + 2  `[x]`
- **Norman:** „ist fast wie ich will, aber zwischen Modus 1 und 2 wechseln
  fonts usw. Ich will, dass das ‚f(‘ und ‚) = ‘ exakt gleich bleibt und sich
  nur der [Inhalt] ändert.“
- **Ursache:** Modus 1 = temml-MathML `f(x)=x²` (1.9em, dünne Math-Font),
  Modus 2 = Flip-Clock mit `fc-glyph` (Georgia italic 700 46px) → beim
  Cross-Morph ändern sich Schriftart, Größe UND Position der fixen Glyphen.
- **Fix:** **persistentes Skelett**: eine Zeile `f( [x] ) = [o]` mit EINER
  Schrift (Georgia italic 700) in beiden Modi. Modus 1: Slots zeigen statisch
  `x` / `x²`. Modus 2 (nach `advance()`): statische Werte faden aus,
  rotierende Spalten faden ein (+ Fenster-Box). `f(`, `)`, `=` sind
  dieselben DOM-Knoten → bleiben pixelgleich. `#klassik-formula` (MathML)
  raus, `#flip-clock` → `#ko-odo` + Slots. Registry `klassisch-flipclock`
  unverändert (guard/canSwitch/advance).
- ✅ **Verifiziert (Runde 5):** `#klassik-stage` in index.html hat `.ko-odo`
  mit `.ko-glyph`-Spans (`f(`, `)`, `=`) — dieselben DOM-Knoten in beiden
  Modi. `FlipClockViz` (nn_demos.js) fadet nur die `.ko-static`-Werte aus
  und die `.ko-col`-Spalten ein; die Glyphen werden nie angefasst.

### T38 · „Das Bild als Zahlen“: 3. Bild (Blaustapel) fast komplett weiß  `[x]`
- **Norman:** „ist das 3. Bild falsch und fast komplett weiß.“
- **Diagnose (headless-Screenshot):** „3. Bild“ = der **dritte Stapel** (BLAU)
  in Schritt 2 „drei Stapel“. `tint()` nutzt für alle Kanäle dasselbe
  Kontrastfenster `(v−90)/165` — zugeschnitten auf den Grün-Kanal
  (Hintergrund 176). Der Blau-Kanal der Katze ist fast überall 20–60
  (Gelb = Rot+Grün, kaum Blau) → landet komplett unter dem Fenster →
  `ink=255` → der Stapel ist fast rein weiß, nur die Schnauze leuchtet blau.
  Verifiziert: rechter Stapel ≈ weiß mit blauem Fleck.
- **Fix:** `tint()` bekommt für den **Blau-Kanal ein eigenes Fenster**
  (`lo=0` statt `90`): Hintergrund wird sichtbar hell-blau, Gesicht/Schnurr
  bleibt kräftig blau, Ohren/Umrisse dezent. R/G-Kurven bleiben unverändert.
- ✅ **Verifiziert (Runde 5):** `tint()` in katze.js Zeile 117: `const lo =
  i === 2 ? 0 : 90;` — Blau-Kanal nutzt das volle Fenster (0–255), R/G
  bleiben bei (90–255). Blaustapel nicht mehr fast weiß.

### T39 · DenseRaum-Folie komplett raus  `[x]`
- **Norman:** „lass die Folie komplett weg mit ‚Vom Bild zu Punkten / Aus
  Zahlen werden Punkte.‘ und ‚Der Layer wölbt den Raum.‘ danach. Weil das
  kannst du nicht.“ (einen 1024-dimensionalen Raum kann man nicht zeigen)
- **Fix:** `slide-dense-raum`-Block aus `index.html`, `<script
  src="dense_raum.js">`, Registry-Eintrag `dense-raum` (presentation.js).
  Datei `dense_raum.js` bleibt auf der Platte (nicht mehr geladen). Deck
  14 → **13** Folien; statischer Zähler „1 / 13“ stimmt danach.
- ✅ **Verifiziert (Runde 5):** Kein `slide-dense-raum`-Div in index.html,
  kein `<script src="dense_raum.js">`, kein Registry-Eintrag in presentation.js.
  13 Folien gezählt, Zähler „1 / 13“ korrekt.

### T40 · Egg-Szene (SpaceMorph): Verweis „die Punkte sind jetzt die Bilder“  `[x]`
- **Norman:** „verweise auf die andere Folie, sag, dass das, was vorher diese
  Egg-Shape war, jetzt die Bilder sind, viel zu hochdimensional, um es zu
  zeigen. Aber gleiches Prinzip.“
- **Fix:** neuer **letzter Schritt** (Index 6) der Egg-Phase in
  `space_morph.js`: gleiche Szene wie Schritt 5 (Linie), Text: die
  Punkt-Wolke = unsere Bilder, jedes Bild ein Punkt in 32×32×3 = 3072
  Dimensionen — zu hochdimensional zum Zeigen — **gleiches Prinzip**.
  `is1D` in `updateTables` auf `cur >= 5` (Tabelle bleibt im 1D-Zustand).
- ✅ **Verifiziert (Runde 5):** `space_morph.js` S[6] = „Und jetzt: unsere Bilder“
  (3072D, gleiches Prinzip). `is1D = cur >= 5` in `updateTables`.

### T41 · Pipeline „Lernen“: nach Trainingsende bei Katze bleiben  `[x]`
- **Norman:** „Der gesamte Prozess / Lernen: die Daten immer wieder angucken.
  Nach dem er mit dem Lernen durch ist, soll er bei Katze bleiben.“
- **Diagnose:** `cdT` läuft ewig weiter (`cdT += dt/60`) → Hund/Katze-Blöcke
  wechseln auch nach `trainP >= 1` weiter (headless-Protokoll verifiziert:
  15 s lang HU/KA im Takt).
- **Fix:** sobald `trainP >= 1`: `cdT` weich auf die **Mitte des nächsten
  Katze-Blocks** (ungerade Block-Nummer = Katze, `block = 1,3,5,7 …`) ziehen
  und dort **einfrieren**; der 95 %-Fußtext erscheint erst, wenn das Bild
  definitiv Katze ist (vorher konnte er beim Hund-Block auslösen).
- ✅ **Verifiziert (Runde 5):** `cdLock` in katze.js Zeile 1632; tick()-Logik
  (Zeilen 1748–1758) friert `cdT` auf Mitte des nächsten Katze-Blocks ein;
  95%-Fußtext erst bei `cdT >= cdLock`.

### T42 · „Klassisch vs. KI": prev nach Morph zurück zu x²  `[x]`
- **Problem:** Nach `advance()` (Cross-Morph zu Flip-Clock) ging „prev" nicht
  zurück zu x², sondern direkt zu Folie 1 (FlipClockViz hatte keine
  `canGoPrev`/`prev`-Methode).
- **Fix:** `FlipClockViz` bekommt `canGoPrev()` (true wenn `switched`) +
  `prev()` (triggert Reverse-Morph: `unswitching`-State, fade Stream→statisch
  über MORPH_DUR, dann `offset=0`). `stop()` resetet auch `unswitching`.
- ✅ `node --check` nn_demos.js clean.

### T43 · Folie 6: „Für dich jetzt im Abstrakten…" entfernen  `[x]`
- Fragment-Div aus `index.html` (slide-bausteine) gelöscht.
- ✅ Headless: Folie 6 hat jetzt nur 2 Fragmente (Chips + Formel).

### T44 · „Das Bild als Zahlen": Schritt 6 „f(Bild) = f(Matrix)"  `[x]`
- Neuer Schritt 6 (Index 5) in ConvDemo: gleiches Layout wie Schritt 5
  (Bild links, Matrix rechts), zusätzlich:
  - Canvas: `f(` / `)` um das Bild + „Bild" Label unten (Georgia italic 28px)
  - HTML-Overlay `#conv-f-annot`: `f( Matrix )` unter der Matrix
  - Insight: „Das Bild ist die Matrix. f(Bild) und f(Matrix) sind dasselbe."
- CSS: `#conv-f-annot` (positioniert unter der Matrix, Fade-in .45s).
- `onStep`: Matrix + Annotation sichtbar bei Schritt 4 UND 5.
- ✅ `node --check` katze.js clean.

### T45 · „Alles idealisiert": Satz korrigieren  `[x]`
- Alt: „…bestimmt, worauf es achtet — auch auf Merkmale, die mit dem Ziel
  nichts zu tun haben."
- Neu: „Es weiß nichts über unser Ziel — es sieht nur die Daten. Was wir ihm
  zeigen, bestimmt, worauf es achtet."
- ✅ `node --check` n/a (HTML).

### T12 · Diese TODO.md pflegen  `[x]`
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
