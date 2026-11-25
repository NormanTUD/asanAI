# todo_space_warps.md — Crash-Recovery + Fortschritt

Datei: `blog/test/space_warps.html`
Paper: **Keup & Helias (2022), "Origami in N dimensions: How feed-forward networks manufacture linear separability", arXiv:2203.11355**. Fold-and-Cut-Theorem: Demaine et al. (1998).

## STATUS: ✅ ERLEDIGT (2026-09-21)
Kompletter Rewrite als **ein** sauberes Dokument. Alle Sektionen 1–9, alle Demos live, Formeln (temml→MathML) überall, alle Berechnungen im Browser.

### Verifiziert (Headless-Chromium + node-Math-Checks):
- JS-Syntax `node --check`: OK · keine dupl. IDs · keine Runtime-Errors
- 3× Plotly-3D-Plot + 11× temml-Formeln rendern
- S1: "Zwei Haufen" linear trennbar (Fehler→0 machbar), "Ei" unmöglich (Fehler=260)
- S4b Rotation: θ=0° → nicht trennbar; θ=±90° → ReLU trennt ✓
- S5 3-Neuronen (Abbildung 2): innere/äußere z-Ränge disjunkt → Trennebene ✓ (N=3,4,6,8)
- S6: Formen in Px-Skala sichtbar (78–101px), 2^k Stapelschichten, Cut-Linie korrekt

## Aufgaben (alle erledigt)
- [x] **0** Root-Cause: Datei war 2× HTML + dupl. IDs (`sx`,`sy`,`th`,`bx`,`by`) + abgeschnittenes Dok 1 (kein Script → leerer Canvas `c1`). → 1 sauberes Dokument, eindeutige IDs.
- [x] **1** S1: Trennlinie per Slider (Winkel+Offset) + live Fehlklassifikations-Zähler + Urteil; Datensatz-Umschalter (Haufen vs. Ei) → spielerisch.
- [x] **2** S2: tote Slider fix; live-Formel `fLive2` unter Slidern: konkrete W-Matrix + b + Beispiel-Punkt `W·x+b → ReLU`, live.
- [x] **3** S3 Hammer: beibehalten; Formel `ReLU(w·x+b)` (Hammer-Projektion).
- [x] **4** S4: 3D-Lift-Regler fix (ID-Kollision beseitigt) + **NEU** "gelernte Rotation + Hammer": links 2 Kategorien mit 90° gedrehter Trennlinie, θ drehen, ReLU trennt in 3D (z=ReLU(x′)); live-Indikator + Formel.
- [x] **5** S5 Abbildung 2: Plot behalten; **temml-Formeln**: Dense Layer `z=ReLU(A·x+b)`, N Neuronen explizit (w_k, b_k=−d); oben 2D-Faltlinien, 3D-Wanne, Trennebene + Urteil.
- [x] **6** S6 Fold-and-Cut: ELI5 (Form=jedes Polygon, "ausschneiden"=Rand trennen, warum Problem); Falten **echt** per Spiegelung; smooth ge-Eased Zoom/Drehung; Text-Overlay statt Weiß-auf-Weiß; mittlere Falte vorhanden; Scherenschnitt gestrichelt → isolierte Form (gestrichelte Kontur).
- [x] **7** S7 Scheren: 2D→2D ReLU-Layer (2 Neuronen) knüllt die Wolke sichtbar zusammen (norm 0.92→0.36), bleibt **nicht** linear trennbar → erklärt warum ohne freie Dim ineffizient.
- [x] **8/9** Global: Formeln überall + live; IDs eindeutig; validate (node + Headless).

## Log / Learnings (Probleme & Lösungen)
1. **Korrupte Datei = Haupt-Quelle der Bugs.** Zwei aneinandergeklebte HTML-Dok. → Browser parse unbestimmt, `getElementById` lieferte die ERSTE (entkoppelte) Duplikat-ID → Slider "taten nix", ein Canvas leer. *Lerne:* Bei "Slider macht nix" ZUERST auf dupl. IDs prüfen (`grep -oE 'id="…"'` + Counter), nicht blind am Code rumfummeln.
2. **Abbildung 2 ist NICHT in (x,y,z) durch eine horizontale Ebene trennbar.** Konstruktion A `z=ΣReLU(d−n·x)` (innere konstant oben) → Außenklettert HÖHER als Innen (Wand) → keine horizontale Ebene. Lösung: Konstruktion B `z=ΣReLU(n·x−d)` mit **breit genugem Ring** (Innen r≤0.22, Außen r≥0.70, Inradius d=0.25): Innen=0 (Boden), Außen=steigende Wannenwände → Ebene `z=c` trennt echt. *Lerne:* "ist super"-Plot heißt nicht "mathematisch korrekt" — Trennbarkeit IMMER numerisch verifizieren (min/max pro Klasse, gap>0).
3. **Dreieck (N=3) passt in engen Ring nicht** (In-/Umrisshalbmesser-Ratio 1:2). → Radien weiten. *Lerne:* N-Eck-Geometrie: inradius=circumradius·cos(π/N); für saubere Trennung braucht Innen⊂Polygon⊂Außenlücke.
4. **2D→2D ReLU-Layer ist idempotent, wenn er in ein flaches Regime klappt** (meine erste Scher-Schicht: bbox konstant, "nichts passiert"). Fix: Rotation(g)+Skalierung(<1)+ReLU → Wolke rotiert/knüllt pro Schritt sichtbar, bleibt beschränkt, bleibt nicht-trennbar (der ehrliche Punkt). *Lerne:* Iterierte PwL-Abbildungen in node simulieren, bevor man sie ins UI steckt.
5. **Canvas-Skalierung:** shape-Koordinaten ~0.7 × Faktor 1.15 = 0.8px = unsichtbar. Original nutzte Pixel (90px/200px). → `s=130*animScale`, `P=160*animScale`. *Lerne:* bei "Plots leer/klein" die tatsächliche Px-Größe der gezeichneten Objekte nachrechnen.
6. **temml rendert zu `<math>` (MathML)**, nicht `.temml`/`.katex` — Fallback-Suche nach falscher Class sah "0 Formeln" (Falsch-Positiv).
7. **Headless-Validierung ohne Bild-Betrachtung:** Chromium `--dump-dom` + Marker (zählt `.js-plotly-plot`, `<math>`, `.formula code`) + Error-Catcher; dazu node-Simulationen der reinen Math. *Lerne:* Bild-basierte Checks ersetzen durch (a) DOM-Marker, (b) node-Geometrie-Sim.
