# todo_space_warps.md — Crash-Recovery + Fortschritt

Datei: `blog/test/space_warps.html`
Paper: Keup & Helias (2022) — „Origami in N Dimensionen" (Falten von Datenmannigfaltigkeiten durch piecewise-linear/ReLU-Netze).

## WARUM (Root Cause der meisten Bugs)
Die Datei enthielt **zwei aneinandergeklebte HTML-Dokumente** (2× `<!DOCTYPE>`, 2× `<html>`, nur 1× `</html>`).
- Dok 1 (abschnitt s0–s3, canvas `c1`,`c2`) ist **abgeschnitten** → kein `<script>` dafür → Canvas `c1` („Spiele mit einer Schicht 2D→2D") bleibt **leer**.
- **Duplikate IDs** (`sx`,`sy`,`th`,`bx`,`by`) → `getElementById` liefert die erste (entkoppelte) Kopie → Slider in Dok 2 tun **nichts**.
- Lösung: als **ein einziges, sauberes Dokument** neu aufbauen (Basis = Dok 2, Sektionen 1–9), alle IDs eindeutig, alle Demos live + Formeln (temml) überall.

## Aufgaben (schritt für Schritt)
- [ ] **0** Root-Cause: Datei in EIN sauberes Dokument umschreiben, IDs eindeutig.  (in progress)
- [ ] **1** S1 Motivation: Trennlinie **selbst per Slider definieren** (Winkel + Offset), live Fehlklassifikations-Zähler + Urteil „trennt ✓/✗" → spielerisch.
- [ ] **2** S2 Baustein: tote Slider fixen (eindeutige IDs); **live-Formel** unter den Slidern: konkrete, innerlich gerechnete `W·x+b` mit den aktuellen Zahlen (W-Matrix, b, Beispiel-Punkt), überall live.
- [ ] **3** S3 Hammer: beibehalten (funktioniert); Formel `ReLU(w·x+b)` ergänzen/sichern.
- [ ] **4** S4 Kreis-im-Kreis: tote 3D-Regler fixen; **NEU „gelernte Rotation + Hammer"**: links 2 Kategorien mit gedrehter Trennlinie, Datensatz per Drehwinkel drehen, so dass ReLU in höherer Dim trennt; live Trennbarkeits-Indikator + Formel.
- [ ] **5** S5 2D-Ei/3 Neuronen (Abbildung 2): Plot beibehalten („ist super"); **Formeln (temml) ergänzen**, dass es ein Dense Layer `ReLU(A·x+b)` ist (3 Neuronen explizit); Trennebene einzeichnen.
- [ ] **6** S6 Fold-and-Cut: **ELI5** neu (was ist eine „Form" → jedes Polygon; was heißt „ausschneiden"; warum Problem). Falten **echt** via Spiegelungen berechnen; Zoom/Drehung **smooth animiert**; **Text-Überlagerung auf weißem Papier fixen**; fehlende mittlere Falte bei Schritt≥2 fixen; **Scherenschnitt als gestrichelte Linie** anzeigen, die die Form isoliert; live berechnen.
- [ ] **7** S7 Scheren: wirklich sichtbar machen (2D→2D PwL „Sägen", Masse bewegt sich), erklären warum ohne freie Dim kein Schneller (tiefe schmale Netze); live + Formel.
- [ ] **8** Global: Formeln (temml) überall relevant, alle live-updating; IDs eindeutig; `node --check` auf dem JS.
- [ ] **9** Validate: JS-Syntax (node --check / headless), ggf. Fehler fixen.

## Log / Learnings (Probleme & Lösungen, kompakt nach Unter-aufgabe)
- _leer – wird nach jeder erledigten Unter-aufgabe ergänzt_
