# Fakten-Audit — ungeklärte Punkte

Umfang: alle 95 Lektionen in `blog/*.php`, ihre Zitate in `literature.js` und
die generierten Atlas-/Suchdaten. Jede Lektion wurde zuerst lokal geprüft
(innere Widersprüche), danach global (wiederkehrende Modell-Specs, Daten,
Formeln, historische Zuschreibungen, bibliographische Identitäten).

**Nicht** in dieser Datei stehen Punkte, die geprüft und behoben wurden. Die
stehen in den Commits unten und sind durch
`blog/tests/fact_consistency_test.py` abgesichert.

Hier stehen nur Aussagen, die mit den hier verfügbaren Quellen nicht sicher
geklärt werden konnten, oder deren Primärquelle nicht lesbar war. Jede Zeile
sagt, was zur Klärung nötig wäre. Das ist **keine** Liste von bewusst falschen
Aussagen, sondern eine Arbeitsliste für einen Menschen mit Bibliothekszugang.

---

## 1. Primärquelle nicht zugänglich

| Ort | Aussage | Warum offen | Was es klären würde |
|---|---|---|---|
| `derivativelab.php:41`, `derivativelab.php:235`, `optimizerlab.php:435`, `geometry_ii.php:186` | Hadamards Memoir von 1908 führte das Steilste-Abstiegs-Verfahren für eingespannte elastische Platten ein. | Der Eintrag `hadamard1908` ist weiterhin eine Wikipedia-Geschichtsseite (`literature.js`, Autor „Wikipedia contributors“, 2026). Gallica und der BnF-Katalog blockieren automatisierte Zugriffe von diesem Host; ein DOI-/Numdam-Datensatz wurde nicht gefunden. | Das Original *Mémoire sur le problème d’analyse relatif à l’équilibre des plaques élastiques encastrées* (1908) oder eine wissenschaftliche Geschichte, die es zitiert. Dann den Wikipedia-Eintrag ersetzen. |
| `math_i.php:21` | Der Lebombo-Knochen sei „durch 24 Radiokarbonmessungen“ auf 42.000–43.000 Jahre datiert. | Der zitierte Bruderer-Artikel (CACM 2024) lieferte HTTP 403; die genaue Zahl der Messungen war im Abstract nicht sichtbar. | Volltext Bruderer (2024) oder die ursprüngliche Border-Cave-/Lebombo-Datierungsarbeit. |
| `foam_of_meaning.php:369` | Die intrinsische Dimension „peak around 19–22“ und „only 1–3 % of the ambient width“. | Das arXiv-Abstract bestätigt das Hourglass-Profil und die Fit-Steigungen, aber nicht diese beiden Zahlen. | Volltext Mabrok (2026), Tabellen/Abbildungen mit den Schätzungen pro Schicht. |
| `language.php:23` | Die Sprachfähigkeit sei „likely entering widespread social use by 100,000 years ago“. | Die zitierte Frontiers-Arbeit (2025) stützt Sprachfähigkeit um 135 kya; das 100-kya-Datum für gesellschaftliche Nutzung steht nicht in Titel/Abstract. | Volltext Miyagawa et al. (2025). |
| `history.php:1461` | Venture-Investitionen 1,3 Mrd. $ (2010) → >40 Mrd. $ (2020); ~70 Mrd. $ Unternehmensinvestitionen; zwölffaches Artikelwachstum; zehnfache NeurIPS-Teilnahme. | Aus dem Toosi-et-al.-Review übernommen; die zugrunde liegenden AI-Index-Tabellen wurden nicht erneut gelesen. | Toosi et al. (2021) plus die dort zitierten AI-Index-Tabellen. |
| `information_market.php:51` | Johannes Paul II. habe Isidor von Sevilla „um 1997“ als Internet-Patron vorgeschlagen. | Die Lektion kennzeichnet selbst, dass die Quellen uneinig sind, ob daraus je ein förmliches Dekret wurde. | Vatikanisches Dokument oder belegte päpstliche Audienz/Erklärung. |
| `computer_vision.php:24` | LeNet-5 sei „the first commercially deployed convolutional network“ gewesen, „from about 1996“ in US-Banken. | LeCun et al. (1989) bestätigen die ZIP-Code-Aufgabe; das exakte Deployment-Datum und der „erste“-Anspruch waren aus dem 1998er-Text nicht sauber extrahierbar. | LeCun et al. (1998) im Volltext plus NCR-/Deployment-Belege. |
| `origami.php:462` | Die Huzita–Justin-Axiome stammen von Justin (1986) und wurden von Huzita (1989) wiederentdeckt. | Sekundärquellen datieren Huzitas Vortrag meist auf die Konferenz 1991; eine Publikation von 1989 mag existieren, wurde aber nicht verifiziert. | Huzitas Originalarbeit/Konferenzband. |
| `deconvolution.php:65` | Distills DeepDream-Abbildung nutze „8×8 random shifts per iteration“. | Der Distill-Artikel beschreibt ein 8×8-Jitter-Raster, nicht das exakte Protokoll pro Iteration. | Distill-Quellcode/Bildunterschrift oder Autorenhinweis. |
| `normalizationlab.php:39` | „GPT-4 family is estimated around 100+ layers.“ | Schätzung, keine veröffentlichte Architekturangabe. | OpenAI-Bericht oder glaubwürdiger Architektur-Leak; sonst ausdrücklich als Spekulation kennzeichnen. |
| `deeplearninglab.php:20` | „Dechter (1986)“ und Aizenbergs Priorität für Begriff/Idee. | Die genaue Priorität wurde nicht an den Primärwerken geprüft. | Dechter (1986) und Aizenberg et al. im Original. |
| `resnetlab.php:38` | Hochreiters Analyse von 1991 enthalte „already the germ“ der Skip-Connections. | Interpretativ; das Constant-Error-Carousel wird meist auf das LSTM-Papier von 1997 datiert. | Hochreiters Diplomarbeit (1991) vollständig lesen. |

## 2. Zahlen nicht aus dem Primärtext nachgerechnet

| Ort | Aussage | Warum offen |
|---|---|---|
| `mechanistic_interpretability.php` | Exakte Othello-GPT-Probe-Fehler, Merullos 5σ-/7–14-%-Zahlen, Marks & Tegmarks 0,77-vs-0,13-Effekte. | Abstracts bestätigen das qualitative Ergebnis; die exakten Zahlen wurden nicht erneut aus den Papers gelesen. |
| `attentionlab.php` | Verschiedene Interpretability-/Attention-Zahlen. | Gleiches Bild: qualitative Aussage belegt, exakte Werte nicht unabhängig nachgerechnet. |
| `alternative_architectures.php:93,161` | Jamba nutze „~25 % of the memory“; Striped Hyena-7B habe 128K Kontext; RWKV-7 erreiche 7B-Transformer. | Model Cards/PDFs waren für diese konkreten Zahlen nicht abrufbar. |
| `multimodal.php:64,90` | ViT-L/14 „~304M parameters“; LLaVA-1.5 „~600k image-instruction pairs“. | Plausibel und nahe an veröffentlichten Zahlen, aber die exakte Dataset-/Model-Card wurde nicht gelesen. |
| `music_video_generation.php:348` | Deezer „50,000 AI-generated tracks a day — about a third of all uploads“; Billboard-Country-Song; UMG/Sony gegen Suno. | Nachrichtenaussagen aus 2025; die Primärmeldungen wurden nicht erneut abgerufen. |
| `vibe_coding.php` (viele Zeilen) | 2026-spezifische ArtCraft-/PhotoCraft-/FilmCraft-Angaben, Adobe-/Figma-Zahlen, DORA 2025, SUSVIBES/Veracode-Prozente, 22.953-PR-Studie, Stack-Overflow-2025. | Die Lektion ist relativ zur stabilen Literatur zukunftsdatig; die meisten 2026er-Primärquellen waren von diesem Host nicht auflösbar. |
| `reasoning.php:143` | „approximate values along the curve“ für o1-artige Pass-Raten bei n=100/1.000/10.000. | Die Lektion kennzeichnet sie als Näherung und nennt keine Quelle; sie sind illustrativ, nicht gemessen. |
| `promptengineering.php:47` | „J-space, or logit-accumulation space“. | Kein Standardbegriff der Interpretability-Literatur; keine Quelle angegeben. |
| `symbolic_ai.php:176` | DENDRAL habe „eleven million“ Kandidaten auf „twenty-two thousand“ reduziert; MYCIN habe „nine human clinicians“ erreicht. | Aus Creviers Sekundärgeschichte; die primären DENDRAL-/MYCIN-Papiere wurden nicht gelesen. |
| `websearch.php:89` | ChatGPT habe die Bing-Search-API genutzt. | Anbieter-Backends sind nicht vollständig öffentlich und ändern sich; die Microsoft-Partnerschaft ist historisch, kein dauerhaftes Architekturfaktum. |
| `ai_and_society.php:152` | AF2 sei „~48,000 times“ zitiert; „over 40 %“ der Protein-Struktur-Papers in *Cell/Nature/Science* 2023 hätten AlphaFold zitiert. | Zitationszahlen sind zeitabhängig; die 40-%-Zahl wurde auf der Nature-Seite nicht gefunden. |
| `ai_and_society.php:272` | Khanmigo „ca. 65,000 students across 53 districts by March 2024“. | Plausibel; nicht unabhängig abgerufen. |
| `ai_and_society.php:328` | Pew-Datenessay: „1 in 10 webpages“ KI-geschrieben. | Die Pew-Seite gab die exakte Zahl im abgerufenen Text nicht preis. |
| `ai_for_science.php:38` | OpenAIs Navier–Stokes-Ergebnis von September 2026 (~10.000 Agenten, 88 h, ~130 Mrd. Tokens), nicht peer-reviewed, Priorität umstritten. | Die Lektion nennt die Vorbehalte bereits; die Aussage ist zukunftsdatig und konnte nicht unabhängig verifiziert werden. |
| `law_regulation.php:150` | Colorado AI Act gelte ab 30. Juni 2026. | Die offizielle Bill-Seite zeigt weiterhin 1. Februar 2026; die Verzögerung 2025 wird breit berichtet, ist auf der abgerufenen Seite aber nicht sichtbar. |
| `untold_history_ii.php:822` | IEA: Rechenzentrums-Strom 485 TWh (2025) → 950 TWh (2030); +50 % in 2025. | Der IEA-Bericht 2026 wurde nicht abgerufen. |
| `untold_history_iii.php:1464` | BIS-Exportkontrollregeln 2026 für Advanced Computing. | Zukunftsdatig; nicht abgerufen. |
| `history.php` | Shakey einmal 1966, einmal 1969–1972. | Projektstart vs. operatives System; beide Daten sind verteidigbar, die Formulierung sollte sie aber unterscheiden. |

## 3. Bewusst abgeschwächt, nicht endgültig geklärt

Diese Stellen waren Overclaims oder umstrittene Deutungen. Sie wurden an die
zitierte Quelle angepasst; ein Fachmensch sollte die neue Formulierung
gegenlesen:

- `philosophy.php` — Bewusstseinsaussagen sagen jetzt „most leading theories“
  bzw. „the three theories considered here“, nicht „every theory“.
- `metaphysics_of_ai.php` — der Gödel-Absatz sagt jetzt „the standard reply …
  though the debate is not settled“.
- `unexpected_capabilities.php` — ToM-, Metaphern- und Explorationsaussagen
  sind jetzt als prompt-sensitiv / nicht benchmarkiert / explorationsartig
  qualifiziert.
- `frontier.php` — CAI, Cross-Model-Universalität und Llama-Datenmischung
  sind qualifiziert.
- `ai_and_society.php` — AlphaFold-, Goldman-Sachs-, Sensity-, C2PA- und
  New-Hampshire-Aussagen wurden auf das eingeengt, was die Quellen sagen.

## 4. Link-/Quellenintegrität

`uv run blog/tests/link_checker.py blog/` meldet aktuell **230 harte
Fehlschläge** bei 3.276 Bibliographie-Einträgen. Die meisten sind keine
inhaltlichen Widersprüche:

- viele arXiv-URLs scheitern von diesem Host mit `Connection refused` (dieselben
  IDs sind anderswo gültig), besonders die 2025–2026-Einträge;
- DOI-/Verlagsseiten liefern automatisierten Clients oft HTTP 403 und werden
  als Soft-Pass gezählt;
- ein kleinerer Teil sind wirklich tote oder falsch typisierte URLs.

Die fünf schlimmsten toten Einträge aus diesem Audit wurden behoben oder
entfernt:

- `ramsauer2021hopfield` zeigte auf das falsche Paper (Santos et al. 2024);
  korrigiert auf Ramsauer et al., arXiv:2008.02217.
- `brooks2024sora` zeigte auf Wikipedia; korrigiert auf OpenAIs Bericht.
- `anthropic2025shutdown` zeigte auf einen 404; korrigiert auf die Seite
  *Agentic Misalignment*.
- `fli2025ban` zeigte auf einen 404; korrigiert auf
  `https://superintelligence-statement.org`.
- `tien2026rogue` zeigte auf eine 404-arXiv-ID; die Lektion nutzt jetzt
  `rogue_agents` (arXiv:2606.00341), der tote Eintrag wurde entfernt.

Aktuelle Liste ansehen:

```bash
uv run blog/tests/link_checker.py blog/ > /tmp/linkcheck.txt 2>&1
grep -B3 -A3 '^✗' /tmp/linkcheck.txt
```

## 5. Geklärte Prüfungen erneut ausführen

```bash
uv run blog/tests/fact_consistency_test.py
uv run blog/tests/php_validator.py blog/
uv run blog/tests/js_validator.py blog/
uv run blog/tests/lesson_guard.py blog/
uv run blog/tests/literature_dup_keys.py blog/
uv run blog/tests/semantic_index_test.py
uv run blog/tests/rag_index_test.py
python3 atlas_data/atlas_check.py
```

## 6. Commits aus diesem Audit

- `2ed4b8b7f` — Teil 1: Geschichte/Mathematik/Bibliographie.
- `33d40f1fe` — Teil 2: Optimierung, Scaling Laws, Speicher.
- `2715cc5e2` — Teil 3: Inceptionism-Zitate, Architektur-Aussagen.
- `12f19f51f` — Teil 4: Modell-Specs und Musik-/Audio-Geschichte.
- `d9af7ffba` — Teil 5: Kosten-, Speicher- und Benchmark-Aussagen.
- `5bef5e418` — Teil 6: Geschichte, Gesellschaft, Zuschreibungen.
- `dd3d57697` — Cross-Lesson-Fakten-Regressionstest.
- `cbb81fb09` — restliche Aussagen + regenerierte Suchindizes.
- `e5b822fa2` — ungeklärte Punkte dokumentiert.
- `cf7b5e932` — Bibliographie-Syntax repariert und im Test abgesichert.
