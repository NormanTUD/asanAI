# EOY Faktenprüfung

- Geprüfte Quellen: `blog/eoy/data.js`, aktive Demos, `PERFORMANCE.md`-Seiten.
- Extrahierte Sätze: 2.961 Deutsch, 2.952 Englisch (inklusive Teaser, Context, Deep, Boxen und Fragen).
- Davon gesichtet: 317 numerische Claims, 553 Kandidaten mit Modell-, Personen- oder Werknamen.
- `url:`-Felder: 120 geprüft, keine 404er; 8 Antworten waren Bot-Blocker (403/202).

## Korrekturen

- **Othello-Attribution:** Der Text schrieb die lineare Probe Li et al. zu. Li et al. (2023) nutzten nichtlineare Probes; Nanda, Lee und Wattenberg (2023) zeigten die lineare Lesbarkeit. Text in DE/EN korrigiert.
- **Zeitachse:** „innerer Zeitstrahl“ ist zu stark; ersetzt durch „linear aus den Aktivierungen auslesbar“.
- **Sprache:** „Rechtebegrenzung“ durch „Berechtigungsgrenzen“ ersetzt.
- **QKV-Graph:** Hinweis ergänzt, dass die Gewichte für nicht ausgewählte Queries illustrativ sind.

## Verifizierte Kernfakten

| Fakt | Status | Quelle/Prüfung |
|---|---|---|
| GPT-2 small: 768 Dimensionen | korrekt | GPT-2/Modellkonfiguration |
| Othello-GPT: 8 Layer, 8 Heads, 512 Dimensionen, 60 Tokens | korrekt | Nanda et al. (2023), Abschnitt 2.2 |
| Induktionsfenster: ca. 2,5–5 Mrd. Tokens, ICL <0,15 → ca. 0,4 nats | korrekt | Olsson et al. (2022) |
| Gurnee & Tegmark: Llama-2-70B, historische Figuren, lineare Probe R² = 0,835 | korrekt | Gurnee & Tegmark (2023), Tabelle 2 |
| Gurnee & Tegmark: Todesjahre 1000 v. Chr.–2000 n. Chr.; 7B/13B/70B | korrekt | Gurnee & Tegmark (2023), Abschnitt 2.1/2.2 |
| Piazzi entdeckt Ceres am 1. Januar 1801; 41 Tage Beobachtung | korrekt | Stigler (1981), Ceres-Demo |
| Gauß/Legendre: kleinste Quadrate, Legendre 1805 | korrekt | Stigler (1981) |
| GPT-1 117 Mio., GPT-2 1,5 Mrd., GPT-3 175 Mrd., Chinchilla 2022 | korrekt | Originalarbeiten/History-Demo |
| AlexNet 2012, Transformer 2017, Bahdanau 2014 | korrekt | History-Demo |
| Eiffelturm mit Antenne: 330 m | korrekt | Halluzinations-Demo, als falsche 300-m-Antwort markiert |
| Cross-Entropy: −log(0,30) ≈ 1,20; Gradient p−y ≈ −0,70 | korrekt | nachgerechnet |
| BPE-Demo: 10 Startzeichen, 79 Korpus-Tokens, Merges 9/9/8/7 | korrekt | nachgerechnet |
| Othello-Demo: alle 30 Züge legal | korrekt | unabhängige Othello-Regelprüfung |
| Llama-2-70B-Karte: Abb. 10, CC BY 4.0 | korrekt | Gurnee & Tegmark (2023), Bildquelle vorhanden |

## Bewusste didaktische Werte

- 4096-dimensionale Tabelle: hypothetisch, nicht GPT-2 small.
- Embedding-Vektoren, König/Königin, Temperaturlinie: handgebaute Lernspielzeuge.
- Othello-Probe: L6 ist eine konkrete Schicht des 8-Layer-Modells; die Probe liest einen 512-dimensionalen Residualstrom.
- Attention-Prozentwerte in der QKV-Demo: illustrativ, keine Messung eines echten Heads.
- R² und Todesjahr-Punkte in `spacetime`: schematische Demo auf Basis der Paper-Werte.

## Offen

- `P1-04` (Geschichtsfolie) hat weiterhin eine dünne Quellenlage, aber keine gefundene falsche Jahresangabe.
- Der vollständige externe Link-Check außerhalb der 120 `url:`-Felder steht aus.
