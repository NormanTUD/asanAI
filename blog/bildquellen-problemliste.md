# Bildquellen-Prüfung — vollständige Liste

Stand: 2026-10-23

Analysiert wurden **alle** `*.php`-Lektionen und die zugehörigen `*.js`-Dateien. Erfasst: `<img src>`, `srcset`, `<source>`, `poster`, CSS-`url(...)`, `image.php?f=...`, `\marginfig{}`, `\sideimage{}{}` und Bilddateinamen in JS. Quellen/Lizenzen wurden gegen `literature.js` und die Wikimedia-API geprüft. Der vollständige Audit **aller** Bild-Einträge in `literature.js` steht in `literature-bildlizenzen.md`.

## Zusammenfassung

| Status | Anzahl | Bedeutung |
|---|---:|---|
| **NICHT VERWENDEN** | 5 | Fair Use / Lizenz ausdrücklich unklar |
| Lizenz nicht belegt | 15 | Quelle in `literature.js`, aber kein Lizenzfeld |
| Keine Quelle | 12 | weder Key noch Credit im Caption |
| Frei, nur im Caption | 7 | Quelle+Lizenz im Caption, nicht in `literature.js` |
| Frei (literature.js/Commons) | 184 | Lizenz sauber belegt |
| Frei (Prüfdatei) | 46 | in `bildquellen-pruefung.txt` als OK dokumentiert |
| **Gesamt genutzt** | 269 | |

> Neu: Die Lizenz wird jetzt am Ende jeder Quelle im Quellenverzeichnis auf Englisch angezeigt: `— License: …` bzw. `— Image license: …` (`helper.js`, Feld `license`/`image_license`).

## 1. Definitiv nicht verwenden — mit Ersatzvorschlag

| Datei | Wo genutzt | Problem | Freier Ersatz | Lizenz |
|---|---|---|---|---|
| `FrankRosenblattWiringPerceptron.jpg` | history.php:636 (The Beginning of Artificial Neural Networks) [auskommentiert]; intro.php:21 [auskommentiert]; atlas.js:1936 | UNCLEAR | [File:Frank Rosenblatt.jpg](https://commons.wikimedia.org/wiki/File:Frank_Rosenblatt.jpg) | CC BY-SA 4.0 |
| `Mark_I_perceptron.jpeg` | history.php:660 (The Beginning of Artificial Neural Networks); mirror_in_machine.php:47 (II. The First Machines Were Built on the Body's Own Laws) | Fair use | [File:Mark I Perceptron, Figure 2 of operator's manual.png](https://commons.wikimedia.org/wiki/File:Mark_I_Perceptron,_Figure_2_of_operator%27s_manual.png) | Public domain |
| `mcculloch.png` | history.php:382 (The formalization of Neurons) | UNCLEAR | [File:Mcculloch-pitts-neuron-model.png](https://commons.wikimedia.org/wiki/File:Mcculloch-pitts-neuron-model.png) | Public domain |
| `perceptron_smithsonian.jpg` | history.php:797 (The Hype (1958)) | UNCLEAR (Prüfdatei) | [File:Mark I Perceptron, Figure 2 of operator's manual.png](https://commons.wikimedia.org/wiki/File:Mark_I_Perceptron,_Figure_2_of_operator%27s_manual.png) | Public domain |
| `pitts.jpg` | history.php:386 (The formalization of Neurons) | UNCLEAR | [File:1954 Walter Pitts and a blackboard.jpg](https://commons.wikimedia.org/wiki/File:1954_Walter_Pitts_and_a_blackboard.jpg) | Public domain |

Hinweise zu den Ersatzbildern:

- **`Mark_I_perceptron.jpeg`** → Technische Zeichnung statt Foto; alternativ das bereits genutzte US-Navy-Foto `perceptron2.jpg` (Public domain).
- **`FrankRosenblattWiringPerceptron.jpg`** → Porträt statt Verdrahtungsfoto; alternativ PD-Diagramm `File:Organization of a biological brain and a perceptron.png`.
- **`mcculloch.png`** → Kein freies McCulloch-Porträt auf Commons gefunden; das PD-Neuronenmodell ist der beste Ersatz.
- **`pitts.jpg`** → Direktes freies Porträt von Walter Pitts (1954).
- **`perceptron_smithsonian.jpg`** → Alternativ das bereits genutzte US-Navy-Foto `perceptron2.jpg`.

## 2. Lizenz-Label in `literature.js` unpräzise (Nutzung möglich)

Keine offenen Fälle — die Labels `CC`/`GNU` wurden bereits korrigiert (siehe Abschnitt 6).

## 3. Quelle in `literature.js`, aber keine Lizenz belegt

| Datei | Wo genutzt | Key | Quelle (URL) | Maßnahme / freie Alternative |
|---|---|---|---|---|
| `aiken.jpg` | history.php:515 (Howard Aiken & The Harvard Mark I (1944)) | `aikenphoto` | https://www.mediastorehouse.com/fine-art-storehouse/bettmann-archive/mathematician-howard-aiken-early-computer-39321803.html | [File:Aiken.jpeg](https://commons.wikimedia.org/wiki/File:Aiken.jpeg) (Public domain) |
| `ceres_path.png` | statistics.php:128 (The Astronomical Origin: Hunting Ceres); statistics_i.php:143 (The Astronomical Origin: Hunting Ceres) | `cerespath` | https://www.astronomy.com/observing/the-sky-today-wednesday-december-24-2025/ | [File:Ceres Orbit.svg](https://commons.wikimedia.org/wiki/File:Ceres_Orbit.svg) (CC BY-SA 3.0) |
| `euclid_elements.jpg` | geometry_i.php:230 (Euclid's Elements: the machine of proof) | `euclidelements` | https://en.wikisource.org/wiki/The_Elements_(Euclid,_Heath) | [File:Euclid Lueneburg ms 13v.jpg](https://commons.wikimedia.org/wiki/File:Euclid_Lueneburg_ms_13v.jpg) (Public domain) |
| `fukushimarelu.png` | activationlab.php:173 (The Breaking Point: Vanishing Gradients) | `relufirst` | https://ieeexplore.ieee.org/document/4082265 | Formel neu zeichnen (eine mathematische Formel ist nicht urheberrechtlich geschützt) oder Bild entfernen. |
| `grothendieck.jpg` | geometry_i.php:663 (Grothendieck: the space revealed by its functions) | `grothendieck_image` | https://www.heidelberg-laureate-forum.org/laureate/alexander-grothendieck/ | [File:Alexander Grothendieck - face.jpg](https://commons.wikimedia.org/wiki/File:Alexander_Grothendieck_-_face.jpg) (CC BY-SA 4.0) |
| `history_of_a.png` | language.php:248 (The Phoenician Alphabet (c. 1050 BCE)) | `history_of_a` | https://en.wikipedia.org/wiki/A | Kein verifiziertes freies Äquivalent gefunden; eigene Grafik erstellen. |
| `householderrelu.png` | activationlab.php:169 (The Breaking Point: Vanishing Gradients) | `steadystates` | https://link.springer.com/article/10.1007/BF02478220 | Formel neu zeichnen oder Bild entfernen. |
| `laws_of_form_cover.jpg` | coherent_difference.php:146 (The first move: distinction) | `spencerbrown1969form` | https://en.wikipedia.org/wiki/Laws_of_Form | Kein freies Cover; den Titel im Text nennen statt das Buchcover zu zeigen. |
| `lebombo.jpg` | geometry_i.php:70 (Tally bones: Lebombo and Ishango); history.php:43 (The Lebombo Bone); atlas.js:1940 | `lebombobone` | https://cacm.acm.org/blogcacm/technical-marvels-part-2-lebombo-and-ishango-bones/ | Kein freies Foto auf Commons gefunden; beim CACM/Autor anfragen oder Bild entfernen. |
| `navy.png` | history.php:699 (The Beginning of Artificial Neural Networks) | `newyorktimesperceptron` | https://timesmachine.nytimes.com/timesmachine/1958/07/08/83417341.html?pageNumber=25 | [perceptron2.jpg (bereits im Blog)](history.php:664) (Public domain) |
| `platonic_solids.jpg` | geometry_i.php:237 (Euclid's Elements: the machine of proof) | `euclidelements` | https://en.wikisource.org/wiki/The_Elements_(Euclid,_Heath) | [File:Platonic Solids Transparent.svg](https://commons.wikimedia.org/wiki/File:Platonic_Solids_Transparent.svg) (CC0) |
| `rosenblatt_ad.png` | history.php:652 (The Beginning of Artificial Neural Networks) | `rosenblattad` | https://archive.org/details/sim_research-trends_summer-1958_6_2/page/2/mode/2up | [File:Frank Rosenblatt.jpg](https://commons.wikimedia.org/wiki/File:Frank_Rosenblatt.jpg) (CC BY-SA 4.0) |
| `shannons_mouse.jpg` | history.php:497 (Shannon, chess and the rat) | `shannonratphoto` | https://circlesofemotion.org/vocabularies/faces/item/31e7bb6b/faces-of-human-to-non-human-encounter | Kein freies Äquivalent gefunden; Bild entfernen oder Lizenz klären. |
| `si_427.jpg` | geometry_i.php:124 (Babylon: geometry on clay) | `si427_image` | https://news.unsw.edu.au/en/australian-mathematician-reveals-oldest-applied-geometry | [File:Si427o.jpg](https://commons.wikimedia.org/wiki/File:Si427o.jpg) (CC BY-SA 4.0) |
| `snarc.jpg` | history.php:432 (The SNARC: The First Physical Neural Network (1951)) | `snarcphoto` | https://www.the-scientist.com/machine--learning--1951-65792 | Kein freies Äquivalent gefunden; Bild entfernen oder Lizenz klären. |

## 4. Keine Quelle belegt — mit Quellenvorschlag

Weder `literature.js`-Key noch Credit im Caption. Für alle zwölf wurde ein freies Wikimedia-Äquivalent gefunden; das aktuelle Bild sollte durch dieses ersetzt oder die Quelle nachgetragen werden.

| Datei | Wo genutzt | Mögliche freie Quelle | Lizenz |
|---|---|---|---|
| `alhazen.jpg` | geometry_i.php:283 (IV. Transmission: the Islamic Golden Age) | [File:Ibn al-Haytham crop.jpg](https://commons.wikimedia.org/wiki/File:Ibn_al-Haytham_crop.jpg) | Public domain |
| `alkhwarizmi.jpg` | geometry_i.php:279 (IV. Transmission: the Islamic Golden Age) | [File:Al-Khwarizmi portrait.jpg](https://commons.wikimedia.org/wiki/File:Al-Khwarizmi_portrait.jpg) | Public domain |
| `archimedes.jpg` | geometry_i.php:200 (Archimedes: exhaustion perfected) | [File:Domenico-Fetti Archimedes 1620.jpg](https://commons.wikimedia.org/wiki/File:Domenico-Fetti_Archimedes_1620.jpg) | Public domain |
| `bolyai.jpg` | geometry_i.php:479 (Lobachevsky and Bolyai: the parallel postulate is a choice) | [File:Bolyai János (Márkos Ferenc festménye).jpg](https://commons.wikimedia.org/wiki/File:Bolyai_J%C3%A1nos_(M%C3%A1rkos_Ferenc_festm%C3%A9nye).jpg) | CC BY-SA 3.0 |
| `descartes.jpg` | geometry_i.php:374 (Descartes and analytic geometry (1637)) | [File:Frans Hals - Portret van René Descartes.jpg](https://commons.wikimedia.org/wiki/File:Frans_Hals_-_Portret_van_Ren%C3%A9_Descartes.jpg) | Public domain |
| `euclid.jpg` | geometry_i.php:220 (Euclid's Elements: the machine of proof) | [File:Italian - Euclid - Google Art Project.jpg](https://commons.wikimedia.org/wiki/File:Italian_-_Euclid_-_Google_Art_Project.jpg) | Public domain |
| `gauss.jpg` | geometry_i.php:436 (Gauss: curvature is intrinsic) | [File:Carl Friedrich Gauss 1840 by Jensen.jpg](https://commons.wikimedia.org/wiki/File:Carl_Friedrich_Gauss_1840_by_Jensen.jpg) | Public domain |
| `lapicque.jpg` | history.php:359 (The formalization of Neurons) | [File:Louis Lapicque.jpg](https://commons.wikimedia.org/wiki/File:Louis_Lapicque.jpg) | Public domain |
| `lobachevsky.jpg` | geometry_i.php:471 (Lobachevsky and Bolyai: the parallel postulate is a choice) | [File:Lobachevsky 03 crop.jpg](https://commons.wikimedia.org/wiki/File:Lobachevsky_03_crop.jpg) | Public domain |
| `mobius.jpg` | geometry_i.php:507 (Möbius and Listing: the word "topology") | [File:August Ferdinand Möbius.jpg](https://commons.wikimedia.org/wiki/File:August_Ferdinand_M%C3%B6bius.jpg) | Public domain |
| `pythagoras.jpg` | geometry_i.php:182 (Thales, Pythagoras and the theorem) | [File:Pythagoras Bust Vatican Museum (cropped).jpg](https://commons.wikimedia.org/wiki/File:Pythagoras_Bust_Vatican_Museum_(cropped).jpg) | Public domain |
| `visicalc.jpg` | untold_history.php:2163 (The Origin Story) | [File:Visicalc.png](https://commons.wikimedia.org/wiki/File:Visicalc.png) | Public domain |

## 5. Frei, aber nur im Caption belegt (nicht in `literature.js`)

| Datei | Wo genutzt | Caption-Lizenz | Quelle |
|---|---|---|---|
| `deep_blue_kasparov.jpg` | ai_and_society.php:41 (The Arc of Public Perception: Winters and Springs); history.php:996 (The Triumph of Symbolic AI) | Caption: CC BY 2.0 | https://www.theguardian.com/sport/2021/feb/12/deep-blue-computer-beats-kasparov-chess-1996 |
| `dolni_vestonice_head.jpg` | untold_history.php:330 (The Development of Humans) | Caption: CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Female_face,_ivory_carving,_Doln%C3%AD_V%C4%9Bstonice,_Gravettian,_28_000_-_22_000_BP.jpg |
| `eniac_1946.jpg` | untold_history.php:1236 (The Polar Program That Nudged the State of the Art) | Caption: public domain | https://commons.wikimedia.org/wiki/File:Two_women_operating_ENIAC_%28full_resolution%29.jpg |
| `qubit_cryostat.jpg` | untold_history.php:1240 (The Polar Program That Nudged the State of the Art) | Caption: CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Measuring_a_qubit_leaves_no_room_for_error.jpg |
| `venus_galgenberg.jpg` | untold_history.php:326 (The Development of Humans) | Caption: CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Venus_vom_Galgenberg.JPG |
| `venus_hohle_fels.jpg` | untold_history.php:324 (The Development of Humans) | Caption: CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:VenusHohlefels2.jpg |
| `vostok_ice_core.jpg` | untold_history.php:1232 (The Polar Program That Nudged the State of the Art) | Caption: public domain | https://commons.wikimedia.org/wiki/File:Wostok-Station_core32.jpg |

## 6. Neu ergänzte Lizenzen in `literature.js`

Diese Felder wurden ergänzt und erscheinen jetzt im Quellenverzeichnis. `license` = die Quelle selbst ist das Bild; `image_license` = die Lizenz gilt für das im Artikel eingebettete Bild. Hinzu kommen **69 automatisch ergänzte Wikimedia-Lizenzen**; die vollständige Tabelle aller 169 Wikimedia-Bildquellen steht in `literature-bildlizenzen.md`.

| Key | Feld | Lizenz | Grundlage |
|---|---|---|---|
| `antikytheraimage` | `license` | CC BY 2.0 | Datei: Fragments of the Antikythera Mechanism.jpg |
| `crt` | `license` | CC BY-SA 3.0 | Datei: A macro of a CRT picture tube.jpg |
| `salamictablet` | `license` | Public domain | Datei: Salaminische Tafel (1899) |
| `muybridge1887catalogue` | `license` | Public domain | Animal Locomotion, 1887 |
| `cauchy1847` | `license` | Public domain | Gallica-Scan, 1847 |
| `sam_demo_img` | `license` | Apache-2.0 | facebookresearch/segment-anything |
| `zusez1` | `image_license` | CC BY-SA 3.0 | Datei: Zuse Z1.jpg |
| `fourier1822` | `image_license` | Public domain | Porträt Joseph Fourier |
| `jacobi1842` | `image_license` | Public domain | Porträt Carl Jacobi |
| `gaussdisquisitiones` | `image_license` | Public domain | Gauss, Theorema Egregium (1827) |
| `rhindpapyrus` | `image_license` | Public domain | Rhind Mathematical Papyrus |
| `eulerbridges` | `image_license` | CC BY-SA 3.0 | Königsberg-Brücken-Diagramm |
| `mobiusband` | `image_license` | CC BY-SA 3.0 | Möbiusband-Foto |
| `leibnizcc` | `license` | CC BY-SA 4.0 | Commons-Datei Rechenmaschine von Leibniz (Nachbau) |
| `babbage` | `license` | CC BY-SA 2.0 | Commons-Datei Babbages Analytical Engine |
| `ishangobonephoto` | `license` | CC BY-SA 3.0 | Commons-Datei Os d'Ishango IRSNB |
| `arsmagnavolvelle` | `license` | Public domain | Llull-Diagramm (1305) |

## 7. Vollständige Liste aller tatsächlich genutzten Bilder

Status: `NICHT VERWENDEN`, `Label`, `unbelegt`, `keine Quelle`, `Caption`, `frei`, `Prüfdatei`.

| Datei | Status | Key | Lizenz | Wo genutzt |
|---|---|---|---|---|
| `FrankRosenblattWiringPerceptron.jpg` | NICHT VERWENDEN | `perceptronimagewiring` | UNCLEAR | history.php:636 (The Beginning of Artificial Neural Networks) [auskommentiert]; intro.php:21 [auskommentiert]; atlas.js:1936 |
| `Mark_I_perceptron.jpeg` | NICHT VERWENDEN | `perceptronimagecables` | Fair use | history.php:660 (The Beginning of Artificial Neural Networks); mirror_in_machine.php:47 (II. The First Machines Were Built on the Body's Own Laws) |
| `mcculloch.png` | NICHT VERWENDEN | `mccullochpittsimage` | UNCLEAR | history.php:382 (The formalization of Neurons) |
| `perceptron_smithsonian.jpg` | NICHT VERWENDEN | `ronkowitz2017perceptron` | UNCLEAR (Prüfdatei) | history.php:797 (The Hype (1958)) |
| `pitts.jpg` | NICHT VERWENDEN | `mccullochpittsimage` | UNCLEAR | history.php:386 (The formalization of Neurons) |
| `aiken.jpg` | unbelegt | `aikenphoto` |  | history.php:515 (Howard Aiken & The Harvard Mark I (1944)) |
| `ceres_path.png` | unbelegt | `cerespath` |  | statistics.php:128 (The Astronomical Origin: Hunting Ceres); statistics_i.php:143 (The Astronomical Origin: Hunting Ceres) |
| `euclid_elements.jpg` | unbelegt | `euclidelements` |  | geometry_i.php:230 (Euclid's Elements: the machine of proof) |
| `fukushimarelu.png` | unbelegt | `relufirst` |  | activationlab.php:173 (The Breaking Point: Vanishing Gradients) |
| `grothendieck.jpg` | unbelegt | `grothendieck_image` |  | geometry_i.php:663 (Grothendieck: the space revealed by its functions) |
| `history_of_a.png` | unbelegt | `history_of_a` |  | language.php:248 (The Phoenician Alphabet (c. 1050 BCE)) |
| `householderrelu.png` | unbelegt | `steadystates` |  | activationlab.php:169 (The Breaking Point: Vanishing Gradients) |
| `laws_of_form_cover.jpg` | unbelegt | `spencerbrown1969form` |  | coherent_difference.php:146 (The first move: distinction) |
| `lebombo.jpg` | unbelegt | `lebombobone` |  | geometry_i.php:70 (Tally bones: Lebombo and Ishango); history.php:43 (The Lebombo Bone); atlas.js:1940 |
| `navy.png` | unbelegt | `newyorktimesperceptron` |  | history.php:699 (The Beginning of Artificial Neural Networks) |
| `platonic_solids.jpg` | unbelegt | `euclidelements` |  | geometry_i.php:237 (Euclid's Elements: the machine of proof) |
| `rosenblatt_ad.png` | unbelegt | `rosenblattad` |  | history.php:652 (The Beginning of Artificial Neural Networks) |
| `shannons_mouse.jpg` | unbelegt | `shannonratphoto` |  | history.php:497 (Shannon, chess and the rat) |
| `si_427.jpg` | unbelegt | `si427_image` |  | geometry_i.php:124 (Babylon: geometry on clay) |
| `snarc.jpg` | unbelegt | `snarcphoto` |  | history.php:432 (The SNARC: The First Physical Neural Network (1951)) |
| `alhazen.jpg` | keine Quelle | — |  | geometry_i.php:283 (IV. Transmission: the Islamic Golden Age) |
| `alkhwarizmi.jpg` | keine Quelle | — |  | geometry_i.php:279 (IV. Transmission: the Islamic Golden Age) |
| `archimedes.jpg` | keine Quelle | — |  | geometry_i.php:200 (Archimedes: exhaustion perfected) |
| `bolyai.jpg` | keine Quelle | — |  | geometry_i.php:479 (Lobachevsky and Bolyai: the parallel postulate is a choice) |
| `descartes.jpg` | keine Quelle | — |  | geometry_i.php:374 (Descartes and analytic geometry (1637)) |
| `euclid.jpg` | keine Quelle | — |  | geometry_i.php:220 (Euclid's Elements: the machine of proof) |
| `gauss.jpg` | keine Quelle | — |  | geometry_i.php:436 (Gauss: curvature is intrinsic) |
| `lapicque.jpg` | keine Quelle | — |  | history.php:359 (The formalization of Neurons) |
| `lobachevsky.jpg` | keine Quelle | — |  | geometry_i.php:471 (Lobachevsky and Bolyai: the parallel postulate is a choice) |
| `mobius.jpg` | keine Quelle | — |  | geometry_i.php:507 (Möbius and Listing: the word "topology") |
| `pythagoras.jpg` | keine Quelle | — |  | geometry_i.php:182 (Thales, Pythagoras and the theorem) |
| `visicalc.jpg` | keine Quelle | — |  | untold_history.php:2163 (The Origin Story) |
| `deep_blue_kasparov.jpg` | Caption | `deepblue` | Caption: CC BY 2.0 | ai_and_society.php:41 (The Arc of Public Perception: Winters and Springs); history.php:996 (The Triumph of Symbolic AI) |
| `dolni_vestonice_head.jpg` | Caption | — | Caption: CC BY-SA 4.0 | untold_history.php:330 (The Development of Humans) |
| `eniac_1946.jpg` | Caption | — | Caption: public domain | untold_history.php:1236 (The Polar Program That Nudged the State of the Art) |
| `qubit_cryostat.jpg` | Caption | — | Caption: CC BY 4.0 | untold_history.php:1240 (The Polar Program That Nudged the State of the Art) |
| `venus_galgenberg.jpg` | Caption | — | Caption: CC BY-SA 3.0 | untold_history.php:326 (The Development of Humans) |
| `venus_hohle_fels.jpg` | Caption | — | Caption: CC BY-SA 3.0 | untold_history.php:324 (The Development of Humans) |
| `vostok_ice_core.jpg` | Caption | — | Caption: public domain | untold_history.php:1232 (The Polar Program That Nudged the State of the Art) |
| `1280px-BRL61-IBM_702.jpg` | frei | `ibm702image` | Public domain | history.php:552 (IBM 702: The First Commercial Business Computer (1953)) |
| `abacus.jpg` | frei | `earliestabacusphoto` | CC BY-SA 2.0 | history.php:80 (The Salamis Tablet and the Abacus) |
| `acheulean_handaxe.jpg` | frei | `achleuleanhandaxe_image` | CC BY-SA 4.0 | geometry_i.php:39 (The Acheulean handaxe (c. 1.76 million years ago)) |
| `alchemist_in_his_studio.jpg` | frei | `img_alchemist_studio` | Public domain | untold_history.php:1137 (Alchemy: The Displaced Root of Chemistry) |
| `alphafold_protein.jpg` | frei | `alphafold_protein_img` | CC0 | ai_for_science.php:28 (The flagship: AlphaFold) |
| `alphago_leesedol.jpg` | frei | `alphago_leesedol_image` | CC BY-SA 4.0 | agents.php:104 (2. Reinforcement Learning Agents (1990s–2010s)); ai_and_society.php:121 (The Cultural Flashpoints) |
| `anomalocaris_canadensis.png` | frei | `img_anomalocaris_canadensis` | CC BY 4.0 | untold_history.php:188 (The Development of Life) |
| `antikythera.jpg` | frei | `antikytheraimage` | CC BY 2.0 | geometry_i.php:267 (Beyond Euclid: Heron, Apollonius and Menelaus); history.php:168 (The Antikythera Mechanism: Ancient Analog Computing) |
| `apollo_agc_modules.jpg` | frei | `agc_module_image` | CC BY-SA 3.0 | software.php:454 (What Was Required, in the End, for a Human to Build Somet…); untold_history.php:1437 (The Apollo Guidance Computer) |
| `apollo_alrr.jpg` | frei | `img_apollo_alrr` | CC0 | untold_history.php:1509 (The Corner Cubes on the Moon: How a Range Finder Became t…) |
| `archaeopteryx_durbed.jpg` | frei | `img_archaeopteryx_durbed` | CC BY-SA 3.0 | untold_history.php:224 (The Age of Dinosaurs and the Shifting Continents) |
| `arithmometer_thomas.jpg` | frei | `arithmometer_thomas` | CC BY-SA 4.0 | untold_history.php:877 (The Jacquard Loom: Weaving the Concept of Programmable Input) |
| `arpanet_map.png` | frei | `arpanet_map` | Public domain | untold_history.php:2403 (ARPANET: Connecting the First Nodes) |
| `ashby.jpg` | frei | `ashbyphoto` | Public domain | history.php:470 (Ross Ashby and the Homeostat) |
| `astrolabe.jpg` | frei | `astrolabe_image` | CC BY-SA 4.0 | geometry_i.php:323 (The Islamic formalisation: six functions and a subject of…) |
| `audio_spectrogram.png` | frei | `audio_spectrogram_img` | CC BY-SA 4.0 | music_video_generation.php:147 (Turning time into frequencies: the MDCT) |
| `babbage.jpg` | frei | `babbage` | CC BY-SA 2.0 | history.php:275 (The Physical Manifestation: Babbage's Analytical Engine); software.php:69 (Before the Transistor: The Machine Learns to Be Programmed) |
| `bessemer_converter.jpg` | frei | `img_bessemer_converter` | Public domain | untold_history.php:701 (From Bloomery to Boolean: The Metals That Compute) |
| `blombosochre.jpg` | frei | `blombosochre` | CC-BY-2.5 | geometry_i.php:57 (Blombos Cave (c. 75,000 years ago)); language.php:31 (The Cognitive Ignition: From Indexical Signaling to Symbo…) |
| `brazen_head.jpg` | frei | `brazenheadimage` | Public domain | history.php:184 (The Antikythera Mechanism: Ancient Analog Computing) |
| `brazen_head_pub.jpg` | frei | `brazenheadpubimage` | CC BY-SA 4.0 | history.php:197 (The Antikythera Mechanism: Ancient Analog Computing) |
| `burgess_shale_fossils.jpg` | frei | `img_burgess_shale_fossils` | CC BY 2.0 | untold_history.php:192 (The Development of Life) |
| `cai_lun.jpg` | frei | `img_cai_lun` | Public domain | untold_history.php:744 (Paper: The Substrate That Made Mass Distribution Possible) |
| `cajal_cerebellum.jpg` | frei | `img_cajal_cerebellum` | Public domain | mirror_in_machine.php:29 (I. The Vocabulary Was Stolen From Neurology); myths.php:51 (The brain is a computer, so a computer can think); untold_history.php:634 (From Cork to Circuits: The Microscope That Gave AI Its Mo…) |
| `category_commutative.png` | frei | `category_diagram_image` | Public domain | coherent_difference.php:354 (Locality: the decisive turn) |
| `cauchy.jpg` | frei | `cauchy1847` | Public domain | geometry_ii.php:168 (Descent: why the gradient is steepest) |
| `cave_hands.jpg` | frei | `cuevadelasmanos_image` | CC BY-SA 2.0 | human_mind.php:149 (Art and the Symbolic Revolution); intro.php:16; language.php:156 (Cave Paintings and Symbolic Art) |
| `cd_compact_disc.jpg` | frei | `cd_compact_disc_img` | Public domain | music_video_generation.php:116 (Digital: the Red Book and the number 44,100) |
| `ceres.jpg` | frei | `ceresimage` | Public domain | statistics.php:117 (The Normal Distribution: From the Stars to AI); statistics_i.php:132 (The Normal Distribution: From the Stars to AI) |
| `charnia_masoni.jpg` | frei | `img_charnia_masoni` | CC BY-SA 3.0 | untold_history.php:162 (The Development of Life) |
| `chicxulub_impact_artist.jpg` | frei | `img_chicxulub_impact_artist` | Public domain | untold_history.php:244 (The Meteor That Ended the Age of Dinosaurs) |
| `colladon_lightpipe.jpg` | frei | `colladon_lightpipe` | Public domain | untold_history.php:979 (Fiber Optics and Submarine Cables: The Physical Internet) |
| `colossus.jpg` | frei | `colossus_image` | Public domain | untold_history.php:1324 (The First Electronic Computers: Colossus and ENIAC) |
| `conic_sections.png` | frei | `conicsections_wiki` | CC BY-SA | geometry_i.php:260 (Beyond Euclid: Heron, Apollonius and Menelaus) |
| `copernicus_portrait.jpg` | frei | `img_copernicus_portrait` | CC BY 4.0 | untold_history.php:382 (The Scientific Revolution: 1543–1687) |
| `cosmic_web.jpg` | frei | `cosmic_web_image` | Public domain | foam_of_meaning.php:114 (The possibility space $X$); atlas.js:977 |
| `crab_nebula.jpg` | frei | `crab_nebula_image` | Public Domain (NASA) | atlas.js:713 |
| `crt.jpg` | frei | `crt` | CC BY-SA 3.0 | untold_history.php:1034 (Cathode Rays and Glowing Phosphors: The Screen That Gave …) |
| `cuneiform.jpg` | frei | `cuneiform` | CC BY-SA 4.0 | geometry_i.php:148 (Babylon: geometry on clay); language.php:178 (Cuneiform and Formal Grammar) |
| `curiosity_panorama.jpg` | frei | `img_curiosity_panorama` | Public domain | untold_history.php:1533 (Fitting a Mountain in a Matchbox: The Compression Standar…) |
| `data_center.jpg` | frei | `img_data_center` | CC BY-SA 2.0 | untold_history.php:1496 (Space Radiation: The Bit Flip That Now Haunts the Data Ce…) |
| `dawkins.jpg` | frei | `dawkins_image` | CC BY 3.0 | human_mind.php:554 (The Collective Brain and the Meme) |
| `deconv_deepdream_jitter.png` | frei | `odena2016deconvolution` | CC BY 2.0 | deconvolution.php:64 (It's in the Gradients, Not Just the Pixels) |
| `deconv_style_clean.png` | frei | `odena2016deconvolution` | CC BY 2.0 | deconvolution.php:46 (Where the Checkerboard Comes From) |
| `deep_space_1_spacecraft.jpg` | frei | `img_deep_space_1` | Public domain | untold_history.php:1524 (Forty Minutes of Silence: The Light-Delay That Invented "…) |
| `dickinsonia_costata.jpg` | frei | `img_dickinsonia_costata` | CC BY-SA 3.0 | untold_history.php:174 (The Development of Life) |
| `diffusion_architecture.png` | frei | `diffusion_architecture_img` | MIT | diffusion.php:149 (3. Cross-attention, how the U-Net reads the text) |
| `diffusion_astronaut.webp` | frei | `diffusion_astronaut_img` | Public domain | diffusion.php:17; diffusion.php:459 (Try it yourself); music_video_generation.php:16 |
| `diffusion_ddim_steps.jpg` | frei | `diffusion_ddim_img` | CC BY-SA 4.0 | diffusion.php:182 (Stable Diffusion: doing it in a compressed space) |
| `earth_night.jpg` | frei | `earth_night_lights` | Public domain | atlas.js:473 |
| `earth_texture.jpg` | frei | `earth_moon_cc_textures` | CC BY 4.0 | atlas.js:466 |
| `eisgalgen_mittenwald.jpg` | frei | `eisgalgen_mittenwald` | CC BY 4.0 | untold_history.php:842 (Refrigeration and Cooling: Keeping the Mind from Melting) |
| `eisschlagen_traunsee.jpg` | frei | `eisschlagen_traunsee` | Public domain | untold_history.php:838 (Refrigeration and Cooling: Keeping the Mind from Melting) |
| `eniac.jpg` | frei | `eniac1946_image` | Public domain | software.php:84 (Before the Transistor: The Machine Learns to Be Programmed); untold_history.php:1249 (The Central Processing Unit (CPU)); untold_history.php:1331 (The First Electronic Computers: Colossus and ENIAC) |
| `euler.jpg` | frei | `euler_portrait` | Public domain | math_i.php:307 (Euler's Number ($e$)) |
| `faraday_disk.jpg` | frei | `faraday_disk` | Public domain | untold_history.php:674 (From Amber to Amperes: The Discovery and Harnessing of El…) |
| `FigurScheiben.jpg` | frei | `arsmagnavolvelle` | Public domain | history.php:232 (The earliest attempt: Ramon Llull) |
| `film_strip_35mm.jpg` | frei | `film_strip_35mm_img` | CC BY 3.0 | music_video_generation.php:269 (Analog moving pictures) |
| `first_transistor.jpg` | frei | `first_transistor` | CC BY-SA 4.0 | untold_history.php:1070 (Quantum Mechanics and the Transistor: From Beach Sand to …); atlas.js:1938 |
| `first_web_browser.png` | frei | `first_web_browser` | Public domain | untold_history.php:2416 (Tim Berners-Lee and the World Wide Web) |
| `flames.jpg` | frei | `flames_image` | CC BY-SA 3.0 | human_mind.php:34 (The Expensive Brain) |
| `flaming_heart_alchemical.jpg` | frei | `img_flaming_heart` | Public domain | untold_history.php:1169 (Alchemy: The Displaced Root of Chemistry) |
| `flammarion.jpg` | frei | `flammarion` | Public domain | myths.php:21 (The habits, not the machines); statistics.php:15; statistics_i.php:30 |
| `folded_koch.gif` | frei | `foldedkoch_img` | CC BY-SA 4.0 | origami.php:444 |
| `fourier.jpg` | frei | `fourier1822` | Public domain | geometry_ii.php:204 (Convolution is a sliding dot product — the DFT is its shape) |
| `freud.jpg` | frei | `freud_image` | Public domain | human_mind.php:511 (The Interior: Knowing the Mind from the Inside) |
| `galilei.jpg` | frei | `galilei_image` | Public domain | human_mind.php:181 ("The Book of Nature Is Written in the Language of Mathema…) |
| `gonzalo.jpg` | frei | `wienerajedrecista` | Public domain | history.php:329 (The First Practical AI (1914)) |
| `great_chain_of_being_1579.jpg` | frei | `img_great_chain_of_being_1579` | Public domain | untold_history.php:349 (The Mythos: How Story Shaped the Mind) |
| `grey_walter_tortoise.jpg` | frei | `img_walter_tortoise` | CC BY-SA 4.0 | history.php:420 (The Electric Tortoise: Machina speculatrix (1936)) |
| `gutenberg_press.jpg` | frei | `img_caxton_celebration` | Public domain | untold_history.php:763 (The Printing Press: Mass-Producing Knowledge) |
| `gutta_percha_cable.png` | frei | `img_gutta_percha_cable` | Public domain | untold_history.php:1000 (The Silent Other Half: Insulating Electricity from Itself) |
| `h264_coding_structure.jpg` | frei | `h264_coding_structure_img` | Public domain | music_video_generation.php:295 (Within a frame and across frames) |
| `hallucigenia_smithsonian.jpg` | frei | `img_hallucigenia_smithsonian` | Public domain | untold_history.php:205 (The Development of Life) |
| `hammerhead_ribozyme.png` | frei | `img_hammerhead_ribozyme` | CC BY-SA 3.0 | untold_history.php:135 (The Development of Life) |
| `heidegger.jpg` | frei | `heidegger_image` | CC BY-SA 3.0 | human_mind.php:525 (The Interior: Knowing the Mind from the Inside) |
| `homeostat.jpg` | frei | `homeostatphoto` | CC BY-SA 4.0 | history.php:466 (Ross Ashby and the Homeostat) |
| `hooke_cock_microscope.jpg` | frei | `img_hooke_cock_microscope` | Public domain | untold_history.php:618 (From Cork to Circuits: The Microscope That Gave AI Its Mo…) |
| `hubble_ultra_deep_field.jpg` | frei | `img_hubble_udf` | Public domain | untold_history.php:1555 (Unblurring the Sky: The Inverse Problem That Became the D…) |
| `huygens_aerial_telescope_1684.jpg` | frei | `img_huygens_aerial_telescope` | Public domain | untold_history.php:591 (Glass and Lenses: The Instruments That Expanded Perception) |
| `huygens_horologium_1673.jpeg` | frei | `img_huygens_horologium` | Public domain | untold_history.php:811 (Precision Clocks: The Metronome of Computation) |
| `inceptionism_classvis.png` | frei | `mordvintsev2015inceptionism` | CC BY 4.0 | inceptionism.php:39 (Gradient Ascent on a Class) |
| `inceptionism_dream_map.png` | frei | `mordvintsev2015inceptionism` | CC BY 4.0 | inceptionism.php:91 (The Dream Map) |
| `inceptionism_dumbbells.png` | frei | `mordvintsev2015inceptionism` | CC BY 4.0 | inceptionism.php:62 (Dream Logic: The Weightlifter's Dumbbells) |
| `inceptionism_funny_animals.png` | frei | `mordvintsev2015inceptionism` | CC BY 4.0 | inceptionism.php:73 (Dream Logic: The Weightlifter's Dumbbells) |
| `inceptionism_ibis.png` | frei | `mordvintsev2015inceptionism` | CC BY 4.0 | inceptionism.php:51 (Let the Network Choose: Layer by Layer) |
| `inceptionism_sky_arrow.png` | frei | `mordvintsev2015inceptionism` | CC BY 4.0 | inceptionism.php:69 (Dream Logic: The Weightlifter's Dumbbells) |
| `iron_pillar_delhi.jpg` | frei | `img_iron_pillar_delhi` | Public domain | untold_history.php:697 (From Bloomery to Boolean: The Metals That Compute) |
| `ishango.jpg` | frei | `ishangobonephoto` | CC BY-SA 3.0 | geometry_i.php:63 (Blombos Cave (c. 75,000 years ago)); history.php:64 (The Ishango Bone) |
| `jabir_alembic.jpg` | frei | `img_jabir_alembic` | Public domain | untold_history.php:1128 (Alchemy: The Displaced Root of Chemistry) |
| `jacobi.jpg` | frei | `jacobi1842` | Public domain | geometry_ii.php:127 (The SVD: the shape of any linear map) |
| `jacquard_loom.jpg` | frei | `jacquard_loom` | CC BY-SA 4.0 | untold_history.php:860 (The Jacquard Loom: Weaving the Concept of Programmable Input) |
| `jung.jpg` | frei | `jung_image` | Public domain | human_mind.php:518 (The Interior: Knowing the Mind from the Inside) |
| `kimberella_quadrata.jpg` | frei | `img_kimberella_quadrata` | CC BY-SA 4.0 | untold_history.php:166 (The Development of Life) |
| `kirsch_baby_1957.jpg` | frei | `img_kirsch_baby` | Public domain | untold_history.php:927 (From a Baby's Face to the GPU: Space Image Processing); atlas.js:1937 |
| `konigsberg_bridges.png` | frei | `eulerbridges` | CC BY-SA 3.0 | geometry_i.php:416 (Euler: the geometry of connectivity); geometry_iii.php:37 (The founding era: from bridges to groups) |
| `kpge_iridium_anomaly.png` | frei | `img_kpge_iridium_anomaly` | CC BY-SA 4.0 | untold_history.php:248 (The Meteor That Ended the Age of Dinosaurs) |
| `lagrange.jpg` | frei | `lagrange_portrait` | Public domain | differentiation.php:75 (The Instantaneous Rate of Change (The Tangent Line)) |
| `leibniz.jpg` | frei | `leibniz_portrait` | Public domain | differentiation.php:32 |
| `Leibnizrechenmaschine.jpg` | frei | `leibnizcc` | CC BY-SA 4.0 | history.php:259 (Gottfried Wilhelm Leibniz); software.php:62 (Before the Transistor: The Machine Learns to Be Programmed) |
| `libavius_alembics.png` | frei | `img_libavius_alembics` | Public domain | untold_history.php:1143 (Alchemy: The Displaced Root of Chemistry) |
| `loss_landscape_resnet56_noskip.png` | frei | `li2018losslandscape` | MIT | loss_landscape.php:30 (The Loss Landscape) |
| `loss_landscape_resnet56_skip.png` | frei | `li2018losslandscape` | MIT | loss_landscape.php:37 (The Loss Landscape) |
| `m87_real.jpg` | frei | `m87_blackhole_image` | CC BY 4.0 | atlas.js:738 |
| `magdeburg_hemispheres.jpg` | frei | `img_magdeburg_hemispheres` | Public domain | untold_history.php:798 (Vacuum Technique: Emptying Space to Fill It with Electrons) |
| `margaret_hamilton.jpg` | frei | `hamilton1969_image` | Public domain | software.php:450 (What Was Required, in the End, for a Human to Build Somet…); untold_history.php:1441 (The Apollo Guidance Computer) |
| `mechanical_turk.jpg` | frei | `mechanicalturkimage` | Public domain | history.php:345 (The First Practical AI (1914)) |
| `mendeleev_periodic_table.jpg` | frei | `mendeleev_periodic_table` | Public domain | untold_history.php:715 (The Periodic Table as Foundation) |
| `mercator_1569.png` | frei | `img_mercator_1569` | Public domain | geometry_i.php:401 (Mercator: flattening the sphere (1569)); untold_history.php:787 (Navigation and the Longitude Problem) |
| `merlin_enchanteur.jpg` | frei | `img_merlin_enchanteur` | Public domain | untold_history.php:1113 (Alchemy: The Displaced Root of Chemistry) |
| `metropolis_hastings.png` | frei | `metropolis_hastings_image` | CC BY 4.0 | untold_history.php:1397 (Metropolis–Hastings in Modern ML) |
| `mice_galaxies.jpg` | frei | `img_mice_galaxies` | Public domain | untold_history.php:1544 (A Deluge of Galaxies: When the Data Was Bigger Than the A…) |
| `micrographia_cork.jpg` | frei | `img_micrographia_cork` | Public domain | untold_history.php:608 (From Cork to Circuits: The Microscope That Gave AI Its Mo…) |
| `micrographia_title_page.gif` | frei | `img_micrographia_titlepage` | Public domain | untold_history.php:614 (From Cork to Circuits: The Microscope That Gave AI Its Mo…) |
| `midi_keyboard.jpg` | frei | `midi_keyboard_img` | CC BY-SA 4.0 | music_video_generation.php:79 (The symbolic score: MIDI) |
| `miller_urey_apparatus.png` | frei | `img_miller_urey_apparatus` | CC BY-SA 3.0 | untold_history.php:124 (The Development of Life) |
| `mirror_self_recognition.jpg` | frei | `mirrorselfrecognition_image` | CC BY 2.0 | human_mind.php:543 (The Self-Model and the Mirror); mirror_in_machine.php:125 (VII. The Mirror on You) |
| `mobius_strip.jpg` | frei | `mobiusband` | CC BY-SA 3.0 | geometry_i.php:510 (Möbius and Listing: the word "topology") |
| `monte_carlo_normal.gif` | frei | `monte_carlo_animation_image` | CC BY-SA 3.0 | untold_history.php:1378 (Monte Carlo Methods) |
| `moon_texture.png` | frei | `earth_moon_cc_textures` | CC BY 4.0 | atlas.js:512 |
| `morse_telegraph.jpg` | frei | `img_morse_telegraph` | CC BY-SA 4.0 | untold_history.php:964 (Land Telegraphy: The First Digital Network) |
| `muybridge_horse_gallop.jpg` | frei | `muybridge1887catalogue` | Public domain | untold_history.php:903 (From Niépce's Pewter Plate to Muybridge's Plates: The Bir…) |
| `napier.jpg` | frei | `napier_portrait` | Public domain | math_i.php:389 (Logarithms: Reversing the Process) |
| `newton.jpg` | frei | `newton_portrait` | Public domain | differentiation.php:28 |
| `niepce_le_gras.jpg` | frei | `niepce_le_gras` | Public domain | untold_history.php:894 (From Niépce's Pewter Plate to Muybridge's Plates: The Bir…) |
| `oscilloscope_waveform.jpg` | frei | `oscilloscope_waveform_img` | Public domain | music_video_generation.php:92 (The raw wave: PCM) |
| `pacioli_portrait.jpg` | frei | `img_pacioli_portrait` | Public domain | untold_history.php:774 (Double-Entry Bookkeeping: The First Error-Detecting Code) |
| `pangaea_200ma.jpg` | frei | `img_pangaea_200ma` | CC BY-SA 4.0 | untold_history.php:232 (The Age of Dinosaurs and the Shifting Continents) |
| `paracelsus_portrait.jpg` | frei | `img_paracelsus_portrait` | Public domain | untold_history.php:1154 (Alchemy: The Displaced Root of Chemistry) |
| `perceptron2.jpg` | frei | `perceptronimagedetection` | Public domain | history.php:664 (The Beginning of Artificial Neural Networks); intro.php:26 |
| `perseverance_selfie.gif` | frei | `perseverance_selfie_image` | Public domain | untold_history.php:1461 (Robotic Autonomy on Mars); atlas.js:1942 |
| `poincare.jpg` | frei | `poincare_image` | No restrictions | geometry_i.php:524 (VIII. The modern shape of space — and why it matters for AI); geometry_iii.php:52 (The bridge that started it all); human_mind.php:192 (The Psychology of Mathematical Discovery) |
| `pygmalion_galatea.jpg` | frei | `pygmalionimage` | CC BY-SA 4.0 | history.php:204 (The Antikythera Mechanism: Ancient Analog Computing) |
| `ranger7_guericke.jpg` | frei | `img_ranger7_guericke` | Public domain | untold_history.php:944 (From a Baby's Face to the GPU: Space Image Processing) |
| `ranger7_impact.jpg` | frei | `img_ranger7_impact` | Public domain | untold_history.php:948 (From a Baby's Face to the GPU: Space Image Processing) |
| `ranger7_moon.jpg` | frei | `img_ranger7_moon` | Public domain | untold_history.php:938 (From a Baby's Face to the GPU: Space Image Processing) |
| `rgb_color_cube.png` | frei | `rgb_color_cube` | CC BY-SA 3.0 | math_ii.php:1044 (3D: The Color Cube) |
| `rhind_papyrus.png` | frei | `rhindpapyrus` | Public domain | geometry_i.php:99 (Egypt: the Rhind Papyrus) |
| `riemann.jpeg` | frei | `riemann_portrait` | Public domain | embeddinglab.php:68; geometry_i.php:491 (Riemann: the general idea of "space") |
| `saddle_hyperbolic_paraboloid.png` | frei | `hyperbolic_paraboloid_saddle` | CC0 | loss_landscape.php:566 (Saddles outnumber minima in high dimensions) |
| `salamic_table.jpg` | frei | `salamictablet` | Public domain | history.php:76 (The Salamis Tablet and the Abacus) |
| `sam_demo.png` | frei | `sam_demo_img` | Apache-2.0 | computer_vision.php:322 (Segmentation: pixels, not boxes) |
| `Sanzio_01_Plato_Aristotle.jpg` | frei | `aristotleandplato` | Public domain | history.php:115 (The Roots of Formal Logic); human_mind.php:164 (From Wonder to Philosophy) |
| `schmitz.jpg` | frei | `schmitz_image` | CC BY-SA 4.0 | human_mind.php:532 (The Interior: Knowing the Mind from the Inside) |
| `sextant.jpg` | frei | `humboldtsextant` | CC BY-SA 4.0 | geometry_i.php:343 (How do you measure an angle? (the instruments)) |
| `shakey_robot.jpg` | frei | `shakey_robot_image` | CC BY-SA 4.0 | untold_history.php:1351 (ARPA/DARPA: The Government Patron of AI) |
| `shannon.png` | frei | `shannonphoto` | Public domain | history.php:493 (Shannon, chess and the rat) |
| `sheaf_gluing.png` | frei | `sheaf_gluing_image` | CC BY-SA 3.0 | coherent_difference.php:374 (The sheaf picture: local islands, glued into a continent) |
| `sheaf_sections.png` | frei | `sheaf_sections_image` | CC BY-SA 3.0 | coherent_difference.php:369 (The sheaf picture: local islands, glued into a continent) |
| `sholes_typewriter.jpg` | frei | `sholes_typewriter` | Public domain | untold_history.php:1017 (From Typewriters to Keyboards: The Mechanical Alphabet) |
| `shrdlu.gif` | frei | `shrdlu_image` | CC BY-SA 4.0 | agents.php:85 (1. Classical AI: Symbolic Agents (1950s–1990s)) |
| `simon_newell.jpg` | frei | `simonnewell_image` | Public domain | human_mind.php:211 (The Cognitive Revolution and the Birth of AI as a Discipline) |
| `slot_machine.jpg` | frei | `slotmachine_image` | CC BY 4.0 | human_mind.php:472 (The Slot Machine in the Skull) |
| `starfield_eso.jpg` | frei | `starfield_eso_image` | CC BY 4.0 | atlas.js:295 |
| `stop_sign.jpg` | frei | `stopsignimage` | CC0 | computer_vision.php:196 (Understanding the Preset Filters); computer_vision.js:543 |
| `stromatolite_sharkbay.png` | frei | `img_stromatolite_sharkbay` | CC BY 4.0 | untold_history.php:146 (The Development of Life) |
| `submarine_cable.png` | frei | `submarine_cable` | Public domain | untold_history.php:987 (Fiber Optics and Submarine Cables: The Physical Internet) |
| `susa_geometry_tablet.jpg` | frei | `susa_geometry_tablet` | CC BY-SA 2.0 fr | geometry_i.php:115 (Babylon: geometry on clay) |
| `tesla_portrait.jpeg` | frei | `tesla_portrait` | Public domain | untold_history.php:678 (From Amber to Amperes: The Discovery and Harnessing of El…) |
| `theorema_egregium.png` | frei | `gaussdisquisitiones` | Public domain | geometry_i.php:451 (Gauss: curvature is intrinsic) |
| `transformer_architecture.png` | frei | `transformer_attention_figure` | CC BY-SA 4.0 | atlas.js:1935 |
| `trig_functions.svg` | frei | `trigfunctions_image` | CC BY-SA 3.0 | geometry_i.php:315 (The Indian sine: the chord becomes a function) |
| `trinil_shell.jpg` | frei | `trinilshell_image` | CC BY-SA 3.0 | geometry_i.php:48 (The Trinil shell (c. 500,000 years ago)) |
| `turing.jpg` | frei | `turingimage` | Public domain | history.php:530 (Alan Turing: Theory and the Universal Machine (1936-1950)); myths.php:45 (It talks like us, so it thinks like us) |
| `tyrannosaurus_rex_mount.jpg` | frei | `img_tyrannosaurus_rex_mount` | CC BY-SA 3.0 | untold_history.php:220 (The Age of Dinosaurs and the Shifting Continents) |
| `universe_radial_budassi.jpg` | frei | `budassi_universe_image` | CC BY-SA 3.0 | untold_history.php:57 (The Development of the Universe and Earth); atlas.js:969 |
| `vestonice_wolf_bone.jpg` | frei | `wolfbonephoto` | CC BY-SA 3.0 | history.php:54 (The Dolní Věstonice Bone (Wolf Bone)) |
| `vetulicola_cuneatus.jpg` | frei | `img_vetulicola_cuneatus` | CC BY-SA 4.0 | untold_history.php:201 (The Development of Life) |
| `vhs_cassette.jpg` | frei | `vhs_cassette_img` | CC BY-SA 4.0 | music_video_generation.php:274 (Analog moving pictures) |
| `vinyl_lp_record.jpg` | frei | `vinyl_lp_record_img` | Public domain | music_video_generation.php:107 (Analog: grooves, tape, and the voice in the box) |
| `volta_portrait.jpg` | frei | `volta_portrait` | Public domain | untold_history.php:660 (From Amber to Amperes: The Discovery and Harnessing of El…) |
| `voltaic_pile.png` | frei | `voltaic_pile` | Public domain | untold_history.php:666 (From Amber to Amperes: The Discovery and Harnessing of El…) |
| `von_neumann_lanl.gif` | frei | `vonneumann_lanl_image` | Attribution | untold_history.php:1388 (Game Theory and the Architecture of Computation) |
| `vonneumann.jpg` | frei | `vonneumannphoto` | Attribution | history.php:449 (The Cyberneticians (1943-1953)) |
| `wadielhol_inscription_i.jpg` | frei | `wadielholinscription_i` | Public domain | language.php:224 (Proto-Sinaitic Script and the Wadi el-Hol Inscriptions (c…) |
| `wadielhol_inscription_ii.jpg` | frei | `wadielholinscription_ii` | Public domain | language.php:228 (Proto-Sinaitic Script and the Wadi el-Hol Inscriptions (c…) |
| `warren_weaver.jpg` | frei | `img_warren_weaver` | Public domain | history.php:979 (The Illusion of Empathy: The ELIZA-Effect) |
| `watt_steam_engine_lauder.jpg` | frei | `img_watt_steam_engine` | Public domain | untold_history.php:822 (The Steam Engine: Powering Precision Manufacturing) |
| `widrow_adaline.jpg` | frei | `img_widrow_adaline` | Public domain | history.php:808 (The ADALINE: An Engineer's Neural Network (1959)) |
| `wiener.jpg` | frei | `wienerphoto` | CC BY-SA 2.0 de | history.php:445 (The Cyberneticians (1943-1953)) |
| `williams_tube.jpg` | frei | `williams_tube` | CC BY-SA 2.0 | untold_history.php:1260 (Random Access Memory (RAM)) |
| `wmap_cmb.png` | frei | `wmap_cmb` | Public domain | untold_history.php:52 (The Development of the Universe and Earth) |
| `zhang_heng_seismoscope.jpg` | frei | `zhanghengseismoscopeimage` | Public domain | history.php:215 (The Antikythera Mechanism: Ancient Analog Computing) |
| `zuse.jpg` | frei | `zusez1` | CC BY-SA 3.0 | history.php:302 (Konrad Zuse: The Engineer); software.php:76 (Before the Transistor: The Machine Learns to Be Programmed); atlas.js:1939 |
| `adolphe_quetelet.jpg` | Prüfdatei | — |  | statistics_i.php:702 (Statistics as a state technique: from mortality tables to…) |
| `ancient_pergamon.jpg` | Prüfdatei | — |  | human_mind.php:413 (Institutions that outlive their founders) |
| `canary_coal_mine.jpg` | Prüfdatei | — | Caption: public domain | evaluation.php:158 (Benchmark Contamination: The Crisis) |
| `coffee_house_1674.png` | Prüfdatei | — |  | information_market.php:41 (The coffee-house public sphere) |
| `deconv_style_artifacts.png` | Prüfdatei | — |  | deconvolution.php:42 (Where the Checkerboard Comes From) |
| `encyclopedie_title.jpg` | Prüfdatei | — |  | information_market.php:64 (The Encyclopédie: compiling everything at once) |
| `eratosthenes.jpg` | Prüfdatei | — |  | algorithms.php:68 (Another shape of algorithm: the Sieve of Eratosthenes (c.…) |
| `frances_yates.jpg` | Prüfdatei | — |  | human_mind.php:324 (A millennium of the *ars memoriae*) |
| `galaxy_1.jpg` | Prüfdatei | `galaxy_photos` |  | atlas.js:562 |
| `galaxy_2.jpg` | Prüfdatei | `galaxy_photos` |  | atlas.js:562 |
| `galaxy_3.jpg` | Prüfdatei | `galaxy_photos` |  | atlas.js:562 |
| `galaxy_4.jpg` | Prüfdatei | `galaxy_photos` |  | atlas.js:562 |
| `galaxy_5.jpg` | Prüfdatei | `galaxy_photos` |  | atlas.js:562 |
| `giordano_bruno_mnemonic.gif` | Prüfdatei | `giordanobruno` |  | human_mind.php:258 (The method of loci) |
| `giordano_bruno_portrait.jpg` | Prüfdatei | `giordanobruno` |  | human_mind.php:310 (A millennium of the *ars memoriae*) |
| `hilbert_1907.jpg` | Prüfdatei | — |  | algorithms.php:94 (The question that built everything: the Entscheidungsprob…) |
| `james_lind.jpg` | Prüfdatei | — |  | statistics_i.php:878 (The controlled experiment: from scurvy to ablation) |
| `john_graunt.png` | Prüfdatei | — |  | statistics_i.php:698 (Statistics as a state technique: from mortality tables to…) |
| `justitia_statue.jpg` | Prüfdatei | — | Caption: CC BY-SA 4.0, Rigorius | law_regulation.php:17; myths.php:81 (It is neutral and objective) |
| `library_card_catalog.jpg` | Prüfdatei | — | Caption: CC BY-SA 4.0 | rag.php:32 (What is RAG?) |
| `memex_diagram.jpg` | Prüfdatei | — |  | untold_history.php:2381 (The pre-history: the Memex and hypertext (1945–1968)) |
| `mental_rotation.jpg` | Prüfdatei | — |  | human_mind.php:96 (Mental Imagery: Turning Things in the Head) |
| `noise_to_banana.png` | Prüfdatei | — |  | inceptionism.php:35 (Gradient Ascent on a Class) |
| `palais_mondial_1930.jpg` | Prüfdatei | — |  | information_market.php:84 (1934: the paper internet) |
| `pareidolia_jupiter_face.jpg` | Prüfdatei | — |  | hallucinations.php:25 (The Problem: Why AI Lies to You) |
| `paul_otlet.jpg` | Prüfdatei | `paulotlet` |  | information_market.php:74 (Paul Otlet and the Mundaneum: the library that wanted to …) |
| `procession_trojan_horse.jpg` | Prüfdatei | — | Caption: public domain | security_inference.php:40 (Data Poisoning) |
| `relation_1609.jpg` | Prüfdatei | — |  | information_market.php:29 (News becomes a commodity: the Fugger network (16th c.)) |
| `rnn_unrolled.svg` | Prüfdatei | — | Caption: CC BY-SA 4.0 | recurrent_networks.php:35 (Unrolling: One Network, Many Copies) |
| `sir_francis_galton.jpg` | Prüfdatei | — |  | statistics_i.php:706 (Statistics as a state technique: from mortality tables to…) |
| `solsys_earth.jpg` | Prüfdatei | — |  | atlas.js:779 |
| `solsys_jupiter.jpg` | Prüfdatei | — |  | atlas.js:779 |
| `solsys_mars.jpg` | Prüfdatei | — |  | atlas.js:779 |
| `solsys_mercury.jpg` | Prüfdatei | — |  | atlas.js:779 |
| `solsys_neptune.jpg` | Prüfdatei | — |  | atlas.js:779 |
| `solsys_saturn.jpg` | Prüfdatei | — |  | atlas.js:779 |
| `solsys_uranus.jpg` | Prüfdatei | — |  | atlas.js:779 |
| `solsys_venus.jpg` | Prüfdatei | — |  | atlas.js:779 |
| `spectrogram_speech_open.png` | Prüfdatei | — | Caption: CC BY-SA 3.0 | speech_audio.php:38 (1. Spectrograms (and Mel-spectrograms)) |
| `sri_computer_mouse_1968.jpg` | Prüfdatei | — |  | untold_history.php:2389 (The pre-history: the Memex and hypertext (1945–1968)) |
| `ted_nelson.jpg` | Prüfdatei | — |  | untold_history.php:2393 (The pre-history: the Memex and hypertext (1945–1968)) |
| `theseus_minotaur_mosaic.jpg` | Prüfdatei | — | Caption: public domain | reasoning.php:87 (Tree of Thoughts) |
| `turing_machine_2a.svg` | Prüfdatei | — |  | algorithms.php:112 (1936: two machines, one answer) |
| `university_of_bologna.jpg` | Prüfdatei | — |  | human_mind.php:417 (Institutions that outlive their founders) |
| `vannevar_bush_portrait.jpg` | Prüfdatei | — |  | untold_history.php:2385 (The pre-history: the Memex and hypertext (1945–1968)) |
| `word2vec_embedding_tsne.png` | Prüfdatei | — | Caption: CC BY-SA 4.0 | vectorsearch.php:69 (2. Semantic Search (Dense Vector Search)) |

## 8. Mängel der Prüfdatei `bildquellen-pruefung.txt`

- Der erste Abschnitt beginnt bei Eintrag **3**; die Einträge **1–2** fehlen.
- Die Atlas-Sektion springt von **25** auf **27**; Eintrag **26** fehlt.
- **7 dokumentierte Dateien werden nicht mehr verwendet:** `cosmic_web_foam.jpg`, `cosmic_web_texture.png`, `euclid_thevet.webp`, `loss_landscape_densenet121.png`, `loss_landscape_resnet110_noskip.png`, `paraboloids_comparison.png`, `titan_topo.jpg`.
- Eintrag 78 (`memex_diagram.jpg`) trägt selbst den Vorbehalt „bei striktem Audit ggf. nachprüfen“.
- Eintrag 82 (`john_graunt.png`) ist kein authentisches Porträt, sondern eine Illustration von 1936.
- Die Atlas-Journey (`atlas.js`) nutzt `zuse.jpg`, `first_transistor.jpg`, `lebombo.jpg`, `perseverance_selfie.gif` und `FrankRosenblattWiringPerceptron.jpg`; diese sind in `atlas.php` nicht alle creditiert.

### Methodik

- Bildreferenzen aus allen `*.php`-Lektionen und nicht-vendored `*.js` extrahiert; HTML-Kommentare als „auskommentiert“ markiert.
- Pro Bild der umgebende `<figure>`-/`\marginfig`-/`\sideimage`-Block gelesen und darin `\cite{…}`, Markdown-Links und Lizenzwörter gesucht.
- `literature.js`-Keys gegen `url`, `license`, `image_license` und `licensenotes` aufgelöst; Wikimedia-Dateien zusätzlich via API geprüft.
- Prüfdatei-Einträge (OK/UNCLEAR) als Fallback verwendet.
