# Bildquellen-Problemliste

Stand: 2026-10-23
Grundlage: alle `*.php`/`*.js`-Lektionen im Ordner `blog/`, die Prüfdatei
`bildquellen-pruefung.txt` und die Lizenzangaben in `literature.js`.

**Kurzfassung**

- 292 Bilddateien liegen im Blog-Wurzelverzeichnis.
- 269 davon werden tatsächlich in Lektionen verwendet.
- Nur 107 lokale Dateinamen sind in `bildquellen-pruefung.txt` dokumentiert.
- **5 Bilder sind nach Aktenlage nicht nutzbar** (Fair Use bzw. ausdrücklich unklare Lizenz).
- **6 weitere Bilder sind stark risikobehaftet** (kein Lizenznachweis, kommerzielle/Paper-Quelle).
- **169 verwendete Bilder sind in der Prüfdatei gar nicht erfasst** und müssen vor einer Veröffentlichung nachgeprüft werden.

---

## 1. Definitiv nicht verwenden

Diese Bilder haben nach der vorhandenen Quellenlage keine belastbare freie Lizenz.
Sie müssen ersetzt oder entfernt werden.

| Datei | Verwendet in | Quelle | Problem |
|---|---|---|---|
| `Mark_I_perceptron.jpeg` | `history.php:660`, `mirror_in_machine.php:47` | en.wikipedia.org, `File:Mark_I_perceptron.jpeg` | **Fair Use / non-free.** Wikipedia nutzt das Foto nur unter Fair-Use-Regel; eine Weiterverwendung im Blog ist nicht erlaubt. |
| `FrankRosenblattWiringPerceptron.jpg` | `atlas.js:1936` (Cosmic Journey, Perceptron-Stopp); `history.php:636` und `intro.php:21` nur auskommentiert | perceptrondemo.com / Cornell Aeronautical Laboratory | **Prüfdatei: UNCLEAR.** Fotograf unbekannt (1960), keine Lizenzangabe auf der Quelle. Das Bild ist im Atlas weiterhin aktiv. |
| `mcculloch.png` | `history.php:382` | historyofinformation.com (Jeremy Norman) | **Prüfdatei: UNCLEAR** (`mccullochpittsimage`). Die Seite hat keine CC-Lizenz; die Bilder stammen von externen, unklaren Quellen. |
| `pitts.jpg` | `history.php:386` | historyofinformation.com (Jeremy Norman) | **Prüfdatei: UNCLEAR** (wie oben). |
| `perceptron_smithsonian.jpg` | `history.php:797` | ronkowitz.blogspot.com (Repost eines Smithsonian-Fotos, 1968) | **Prüfdatei: UNCLEAR.** Blog ohne CC-Hinweis; Original-Lizenz des Smithsonian-Fotos ungeklärt. |

## 2. Stark risikobehaftet / vor Nutzung klären

Kein Eintrag in `bildquellen-pruefung.txt`; die Quelle ist erkennbar
urheberrechtlich geschützt oder die Lizenz ist nicht nachgewiesen.

| Datei | Verwendet in | Quelle | Problem |
|---|---|---|---|
| `laws_of_form_cover.jpg` | `coherent_difference.php:146` | Buchcover *Laws of Form* (Spencer-Brown, 1969) | Buchcover, kein Lizenznachweis in `literature.js` oder der Prüfdatei. |
| `snarc.jpg` | `history.php:432` | the-scientist.com, „Machine, Learning, 1951“ (Jef Akst, 2019) | Archiv-/Artikelbild ohne Lizenzangabe. |
| `fukushimarelu.png` | `activationlab.php:173` | Abbildung aus Fukushima (1969), IEEE-Paper | Paper-Abbildung, keine freie Lizenz dokumentiert. |
| `householderrelu.png` | `activationlab.php:169` | Abbildung aus Householder (1941), Springer-Paper | Paper-Abbildung, keine freie Lizenz dokumentiert. |
| `rosenblatt_ad.png` | `history.php:652` | archive.org, *Research Trends* (1958) | Zeitschriftenseite/Scan, kein Lizenznachweis. |
| `navy.png` | `history.php:699` | New-York-Times-/Navy-Kontext (`newyorktimesperceptron`) | Fotoquelle und Lizenz nicht dokumentiert. |

## 3. Eingeschränkt nutzbar (Attribution zwingend, aber frei)

| Datei | Verwendet in | Lizenz | Hinweis |
|---|---|---|---|
| `lebombo.jpg` | `geometry_i.php:70`, `history.php:43`, `atlas.js:1940` | PNAS: nur **noncommercial/educational** | Für das kostenlose Lehrbuch ok; bei kommerzieller Nutzung (z. B. Verkauf) ist eine PNAS-Permission nötig. |

## 4. Lizenzangaben in `literature.js` sind unpräzise

Die tatsächlichen Lizenzen wurden per Commons-API geprüft; die Labels sollten
korrigiert werden. Nutzung mit Attribution ist möglich.

| Key | Datei(en) | Label in `literature.js` | Tatsächlich |
|---|---|---|---|
| `leibnizcc` | `Leibnizrechenmaschine.jpg` | `"CC"` | CC BY-SA 4.0 |
| `babbage` | `babbage.jpg` | `"CC"` | CC BY-SA 2.0 |
| `ishangobonephoto` | `ishango.jpg` | `"GNU"` | CC BY-SA 3.0 |
| `conicsections_wiki` | `conic_sections.png` | `"CC BY-SA"` | Versionsnummer fehlt |
| `diffusion_astronaut_img` | `diffusion_astronaut.webp` | kein Lizenzfeld | Public Domain (Commons) |
| `diffusion_architecture_img` | `diffusion_architecture.png` | kein Lizenzfeld | MIT (Commons) |
| `diffusion_ddim_img` | `diffusion_ddim_steps.jpg` | kein Lizenzfeld | CC BY-SA 4.0 (Commons) |

## 5. Ungeprüft — in `bildquellen-pruefung.txt` nicht erfasst

Alle folgenden 169 Dateien werden in Lektionen verwendet, stehen aber nicht in
der Prüfdatei. Das heißt nicht automatisch, dass sie rechtswidrig sind — aber
ihre Lizenz ist dort nicht belegt. Vor Veröffentlichung prüfen oder in die
Prüfdatei aufnehmen.

### `activationlab.php`
- `fukushimarelu.png` — activationlab.php:173
- `householderrelu.png` — activationlab.php:169

### `agents.php`
- `shrdlu.gif` — agents.php:85

### `agents.php`, `ai_and_society.php`
- `alphago_leesedol.jpg` — agents.php:104, ai_and_society.php:121

### `ai_and_society.php`, `history.php`
- `deep_blue_kasparov.jpg` — ai_and_society.php:41, history.php:996

### `ai_for_science.php`
- `alphafold_protein.jpg` — ai_for_science.php:28

### `atlas.js`, `foam_of_meaning.php`
- `cosmic_web.jpg` — atlas.js:977, foam_of_meaning.php:114

### `atlas.js`, `geometry_i.php`, `history.php`
- `lebombo.jpg` — atlas.js:1940, geometry_i.php:70, history.php:43

### `atlas.js`, `history.php`, `intro.php`
- `FrankRosenblattWiringPerceptron.jpg` — atlas.js:1936, history.php:636, intro.php:21

### `atlas.js`, `history.php`, `software.php`
- `zuse.jpg` — atlas.js:1939, history.php:302, software.php:76

### `atlas.js`, `untold_history.php`
- `first_transistor.jpg` — atlas.js:1938, untold_history.php:1070
- `perseverance_selfie.gif` — atlas.js:1942, untold_history.php:1461

### `coherent_difference.php`
- `category_commutative.png` — coherent_difference.php:354
- `laws_of_form_cover.jpg` — coherent_difference.php:146
- `sheaf_gluing.png` — coherent_difference.php:374
- `sheaf_sections.png` — coherent_difference.php:369

### `computer_vision.js`, `computer_vision.php`
- `stop_sign.jpg` — computer_vision.js:543, computer_vision.php:196

### `computer_vision.php`
- `sam_demo.png` — computer_vision.php:322

### `differentiation.php`
- `lagrange.jpg` — differentiation.php:75
- `leibniz.jpg` — differentiation.php:32
- `newton.jpg` — differentiation.php:28

### `diffusion.php`
- `diffusion_architecture.png` — diffusion.php:149
- `diffusion_ddim_steps.jpg` — diffusion.php:182

### `diffusion.php`, `music_video_generation.php`
- `diffusion_astronaut.webp` — diffusion.php:17, diffusion.php:459, music_video_generation.php:16

### `embeddinglab.php`, `geometry_i.php`
- `riemann.jpeg` — embeddinglab.php:68, geometry_i.php:491

### `geometry_i.php`
- `acheulean_handaxe.jpg` — geometry_i.php:39
- `alhazen.jpg` — geometry_i.php:283
- `alkhwarizmi.jpg` — geometry_i.php:279
- `archimedes.jpg` — geometry_i.php:200
- `astrolabe.jpg` — geometry_i.php:323
- `bolyai.jpg` — geometry_i.php:479
- `conic_sections.png` — geometry_i.php:260
- `descartes.jpg` — geometry_i.php:374
- `euclid.jpg` — geometry_i.php:220
- `euclid_elements.jpg` — geometry_i.php:230
- `gauss.jpg` — geometry_i.php:436
- `grothendieck.jpg` — geometry_i.php:663
- `lobachevsky.jpg` — geometry_i.php:471
- `mobius.jpg` — geometry_i.php:507
- `mobius_strip.jpg` — geometry_i.php:510
- `platonic_solids.jpg` — geometry_i.php:237
- `pythagoras.jpg` — geometry_i.php:182
- `rhind_papyrus.png` — geometry_i.php:99
- `sextant.jpg` — geometry_i.php:343
- `si_427.jpg` — geometry_i.php:124
- `susa_geometry_tablet.jpg` — geometry_i.php:115
- `theorema_egregium.png` — geometry_i.php:451
- `trig_functions.svg` — geometry_i.php:315
- `trinil_shell.jpg` — geometry_i.php:48

### `geometry_i.php`, `geometry_iii.php`
- `konigsberg_bridges.png` — geometry_i.php:416, geometry_iii.php:37

### `geometry_i.php`, `geometry_iii.php`, `human_mind.php`
- `poincare.jpg` — geometry_i.php:524, geometry_iii.php:52, human_mind.php:192

### `geometry_i.php`, `history.php`
- `antikythera.jpg` — geometry_i.php:267, history.php:168
- `ishango.jpg` — geometry_i.php:63, history.php:64

### `geometry_i.php`, `language.php`
- `blombosochre.jpg` — geometry_i.php:57, language.php:31
- `cuneiform.jpg` — geometry_i.php:148, language.php:178

### `geometry_i.php`, `untold_history.php`
- `mercator_1569.png` — geometry_i.php:401, untold_history.php:787

### `geometry_ii.php`
- `cauchy.jpg` — geometry_ii.php:168
- `fourier.jpg` — geometry_ii.php:204
- `jacobi.jpg` — geometry_ii.php:127

### `history.php`
- `1280px-BRL61-IBM_702.jpg` — history.php:552
- `FigurScheiben.jpg` — history.php:232
- `abacus.jpg` — history.php:80
- `aiken.jpg` — history.php:515
- `ashby.jpg` — history.php:470
- `gonzalo.jpg` — history.php:329
- `homeostat.jpg` — history.php:466
- `lapicque.jpg` — history.php:359
- `mcculloch.png` — history.php:382
- `navy.png` — history.php:699
- `pitts.jpg` — history.php:386
- `rosenblatt_ad.png` — history.php:652
- `salamic_table.jpg` — history.php:76
- `shannon.png` — history.php:493
- `shannons_mouse.jpg` — history.php:497
- `snarc.jpg` — history.php:432
- `vonneumann.jpg` — history.php:449
- `wiener.jpg` — history.php:445

### `history.php`, `human_mind.php`
- `Sanzio_01_Plato_Aristotle.jpg` — history.php:115, human_mind.php:164

### `history.php`, `intro.php`
- `perceptron2.jpg` — history.php:664, intro.php:26

### `history.php`, `mirror_in_machine.php`
- `Mark_I_perceptron.jpeg` — history.php:660, mirror_in_machine.php:47

### `history.php`, `myths.php`
- `turing.jpg` — history.php:530, myths.php:45

### `history.php`, `software.php`
- `Leibnizrechenmaschine.jpg` — history.php:259, software.php:62
- `babbage.jpg` — history.php:275, software.php:69

### `human_mind.php`
- `dawkins.jpg` — human_mind.php:554
- `flames.jpg` — human_mind.php:34
- `freud.jpg` — human_mind.php:511
- `galilei.jpg` — human_mind.php:181
- `heidegger.jpg` — human_mind.php:525
- `jung.jpg` — human_mind.php:518
- `schmitz.jpg` — human_mind.php:532
- `simon_newell.jpg` — human_mind.php:211
- `slot_machine.jpg` — human_mind.php:472

### `human_mind.php`, `intro.php`, `language.php`
- `cave_hands.jpg` — human_mind.php:149, intro.php:16, language.php:156

### `human_mind.php`, `mirror_in_machine.php`
- `mirror_self_recognition.jpg` — human_mind.php:543, mirror_in_machine.php:125

### `language.php`
- `history_of_a.png` — language.php:248
- `wadielhol_inscription_i.jpg` — language.php:224
- `wadielhol_inscription_ii.jpg` — language.php:228

### `math_i.php`
- `euler.jpg` — math_i.php:307
- `napier.jpg` — math_i.php:389

### `math_ii.php`
- `rgb_color_cube.png` — math_ii.php:1044

### `mirror_in_machine.php`, `myths.php`, `untold_history.php`
- `cajal_cerebellum.jpg` — mirror_in_machine.php:29, myths.php:51, untold_history.php:634

### `myths.php`, `statistics.php`, `statistics_i.php`
- `flammarion.jpg` — myths.php:21, statistics.php:15, statistics_i.php:30

### `software.php`, `untold_history.php`
- `apollo_agc_modules.jpg` — software.php:454, untold_history.php:1437
- `eniac.jpg` — software.php:84, untold_history.php:1249, untold_history.php:1331
- `margaret_hamilton.jpg` — software.php:450, untold_history.php:1441

### `statistics.php`, `statistics_i.php`
- `ceres.jpg` — statistics.php:117, statistics_i.php:132
- `ceres_path.png` — statistics.php:128, statistics_i.php:143

### `untold_history.php`
- `anomalocaris_canadensis.png` — untold_history.php:188
- `apollo_alrr.jpg` — untold_history.php:1509
- `arithmometer_thomas.jpg` — untold_history.php:877
- `arpanet_map.png` — untold_history.php:2403
- `bessemer_converter.jpg` — untold_history.php:701
- `burgess_shale_fossils.jpg` — untold_history.php:192
- `cai_lun.jpg` — untold_history.php:744
- `charnia_masoni.jpg` — untold_history.php:162
- `colladon_lightpipe.jpg` — untold_history.php:979
- `colossus.jpg` — untold_history.php:1324
- `copernicus_portrait.jpg` — untold_history.php:382
- `crt.jpg` — untold_history.php:1034
- `curiosity_panorama.jpg` — untold_history.php:1533
- `data_center.jpg` — untold_history.php:1496
- `deep_space_1_spacecraft.jpg` — untold_history.php:1524
- `dickinsonia_costata.jpg` — untold_history.php:174
- `dolni_vestonice_head.jpg` — untold_history.php:330
- `eisgalgen_mittenwald.jpg` — untold_history.php:842
- `eisschlagen_traunsee.jpg` — untold_history.php:838
- `eniac_1946.jpg` — untold_history.php:1236
- `faraday_disk.jpg` — untold_history.php:674
- `first_web_browser.png` — untold_history.php:2416
- `great_chain_of_being_1579.jpg` — untold_history.php:349
- `gutenberg_press.jpg` — untold_history.php:763
- `gutta_percha_cable.png` — untold_history.php:1000
- `hallucigenia_smithsonian.jpg` — untold_history.php:205
- `hooke_cock_microscope.jpg` — untold_history.php:618
- `hubble_ultra_deep_field.jpg` — untold_history.php:1555
- `huygens_aerial_telescope_1684.jpg` — untold_history.php:591
- `huygens_horologium_1673.jpeg` — untold_history.php:811
- `iron_pillar_delhi.jpg` — untold_history.php:697
- `jacquard_loom.jpg` — untold_history.php:860
- `kimberella_quadrata.jpg` — untold_history.php:166
- `magdeburg_hemispheres.jpg` — untold_history.php:798
- `mendeleev_periodic_table.jpg` — untold_history.php:715
- `metropolis_hastings.png` — untold_history.php:1397
- `mice_galaxies.jpg` — untold_history.php:1544
- `micrographia_cork.jpg` — untold_history.php:608
- `micrographia_title_page.gif` — untold_history.php:614
- `monte_carlo_normal.gif` — untold_history.php:1378
- `morse_telegraph.jpg` — untold_history.php:964
- `muybridge_horse_gallop.jpg` — untold_history.php:903
- `niepce_le_gras.jpg` — untold_history.php:894
- `pacioli_portrait.jpg` — untold_history.php:774
- `qubit_cryostat.jpg` — untold_history.php:1240
- `ranger7_moon.jpg` — untold_history.php:938
- `shakey_robot.jpg` — untold_history.php:1351
- `sholes_typewriter.jpg` — untold_history.php:1017
- `stromatolite_sharkbay.png` — untold_history.php:146
- `submarine_cable.png` — untold_history.php:987
- `tesla_portrait.jpeg` — untold_history.php:678
- `venus_galgenberg.jpg` — untold_history.php:326
- `venus_hohle_fels.jpg` — untold_history.php:324
- `vetulicola_cuneatus.jpg` — untold_history.php:201
- `visicalc.jpg` — untold_history.php:2163
- `volta_portrait.jpg` — untold_history.php:660
- `voltaic_pile.png` — untold_history.php:666
- `von_neumann_lanl.gif` — untold_history.php:1388
- `vostok_ice_core.jpg` — untold_history.php:1232
- `watt_steam_engine_lauder.jpg` — untold_history.php:822
- `williams_tube.jpg` — untold_history.php:1260
- `wmap_cmb.png` — untold_history.php:52

---

## 6. Mängel in `bildquellen-pruefung.txt` selbst

- Der erste Abschnitt beginnt bei Eintrag **3** (`perceptronimagewiring`); die Einträge **1 und 2** fehlen.
- Die Atlas-Sektion springt von **25** auf **27** (Eintrag **26** fehlt).
- **7 dokumentierte Dateien werden nicht mehr verwendet:** `cosmic_web_foam.jpg`, `cosmic_web_texture.png`, `euclid_thevet.webp`, `loss_landscape_densenet121.png`, `loss_landscape_resnet110_noskip.png`, `paraboloids_comparison.png`, `titan_topo.jpg`.
- Eintrag 78 (`memex_diagram.jpg`) ist selbst mit Vorbehalt versehen: „PD laut File-Page … bei striktem Audit ggf. nachprüfen“.
- Eintrag 82 (`john_graunt.png`) ist kein authentisches Porträt, sondern eine Illustration von 1936.
- Eintrag 18 (`inceptionism`) schließt MIT-Places-Bilder bewusst aus; Eintrag 19 (`deconv`) schließt fremde Abbildungen aus. Diese Ausschlüsse sind korrekt dokumentiert.

## 7. Nicht mehr verwendete, aber vorhandene Bilder

Diese Dateien liegen im Ordner, werden aber in keiner Lektion referenziert
(kein akutes Problem, aber Kandidaten zum Aufräumen):

`Della_scoperta_del_nuovo_pianeta_Cerere_Ferdinandea_p1.jpg`, `ai_approx_world.png`,
`arsmagna.jpg`, `bateson.jpg`, `bh_blackhole.jpg`, `bh_nebula.jpg`,
`bh_supernova.jpg`, `euclid_thevet.webp`, `f9dfsnbdcukd1.jpeg`, `finneganswake.jpg`,
`layers.png`, `loss_landscape_densenet121.png`, `loss_landscape_resnet110_noskip.png`,
`neural_network.png`, `paraboloids_comparison.png`, `pythagorean_proof.png`,
`solsys_moon.jpg`, `solsys_sun.jpg`, `spaces_morph.png`, `titan_topo.jpg`,
`weltbild.jpg`

---

### Methodik

- Bildreferenzen wurden aus `<img src>`, `\marginfig{}`, `\sideimage{}{}`, CSS-`url(...)`,
  `image.php?f=...` und JS-Dateinamen in allen `*.php`/`*.js` extrahiert.
- Lizenzen der als Datei-URL in `literature.js` verlinkten Wikimedia-Dateien wurden
  über die Commons-/Wikipedia-API (`prop=imageinfo&iiprop=extmetadata`) geprüft.
- „Nicht in der Prüfdatei“ bedeutet nicht automatisch „nicht nutzbar“, sondern
  „Lizenz dort nicht belegt“.
