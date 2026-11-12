# Offene Arbeiten — intuition_learnsys

Status: `[done]` erledigt, `[in work]` aktuell, `[pending]` offen.
Regel: Höhen-/Browser-Checks erst ausführen, wenn alle Folien umgebaut sind.

## Folie 1 / Einstieg
- [done] Titel „Was ist ein LLM?“ und „Large Language Model“ ausschreiben.
- [done] Adventskalender-Satz ergänzen.
- [done] Satz ergänzen: Diese Netze werden mit großen Datenmengen trainiert; das Training im Detail kommt später.
- [done] Zwei Handys als aufeinanderfolgende Folien (Suche, dann KI-Chat), kein Toggle mehr.
- [done] KI-Chat statt ChatGPT; Frage „Warum ist überhaupt irgendwas?“ und philosophische Kurzantwort.
- [done] KI-Chat ist eine eigene Folie nach „Was ist ein LLM?“.
- [done] Leibniz als klassische Formulierung und Jocax als neuerer Gedanke erwähnen, neutral bleiben.
- [done] Philosophische Antwort in DE/EN auf Desktop und Mobil geprüft (vollständig, kein Overflow).
- [done] Quellenlink Leibniz (Gutenberg) und Jocax (MedCrave) geprüft: beide HTTP 200.

## Code-Folie
- [done] Monitor mit opera.jpg, Taskleiste und zwei Fenstern.
- [done] Agenten-Konsole: kurzes Nachdenken, Datei schreiben.
- [done] Der Code steht im Agentenfenster, nicht in einem separaten Editor.
- [done] Codefenster ohne Scrollen: Code gekürzt und Schriftgröße passt sich automatisch an.
- [done] Mobil geprüft: Code passt ohne vertikales/horizontales Scrollen (DE 7.5 px, EN 6 px).
- [done] „Weiter“ öffnet das Lauf-Fenster und tippt `python3 himmel.py` in 200 ms.
- [done] Agent führt `himmel.py` automatisch aus (Weiter bleibt als manueller Auslöser); Lauf-Fenster zeigt die berechnete Ausgabe.
- [done] Mobil geprüft: Taskleiste, Agenten-Chat, Code und Lauf-Fenster ohne Überlappung; Code ohne Scrollen; 4.35-Ausgabe erscheint.

## „Eine Beziehung lässt sich übertragen“
- [done] Macht/Geschlecht-Beispiele durch Tierpaare ersetzt: Löwe/Löwin, Hengst/Stute, Stier/Kuh, Hahn/Henne.
- [done] Spezies als z-Achse, Rolle (wild/domestiziert) als x-Achse, Geschlecht als y-Achse.
- [done] Neue `animals`-Szene: parallele Pfeile, Paar anklicken, Readout.
- [done] DE/EN-Texte, Achsenlabels und Klickziele auf Desktop geprüft.
- [done] Tierpaar-Checks auf Mobil ausgeführt: vier Paare, Klick, kein Overflow, keine Konsolenfehler.
- [done] Desktop: Tierpaare, Rollenachse und Readout funktionieren; keine Konsolenfehler, kein Überlauf.
- [done] Mobil keine Seitenüberläufe; Tier-Szene bleibt bedienbar.

## Modelle
- [done] „Modelle“ und „Die Bausteine eines LLM“ als zwei Folien trennen.
- [done] Funktionsplot nur auf „Modelle“, Bausteine nur auf „Die Bausteine“.
- [done] Optionaler Kasten zu weiteren Architekturen.
- [done] Modelle/Bausteine auf Mobil geprüft: Plot sichtbar, vier Blöcke klickbar, kein Overflow.

## Position / „Jeder Platz bekommt einen Fingerabdruck“
- [done] Text oben vereinfachen: Tokens haben von sich aus keine Reihenfolge.
- [done] Klarstellen: viele Methoden; RoPE ist die moderne, u. a. in Llama genutzte Methode.
- [done] Sinus, gelernte absolute Positionen, relative Bias, ALiBi und RoPE benennen.
- [done] Quellen ergänzen: Vaswani 2017, Su et al. 2021 (RoPE), Touvron et al. 2023 (Llama 2), Press et al. 2021 (ALiBi), Raffel et al. 2020 (T5).
- [done] Optionalen Kasten ergänzen: Muster, „Drache an Position 5/22“, trennbare Tokens, Positionsinformation bleibt im Netz, Stellenwertsystem durch schnelle/langsame Rotationen.
- [done] Linien-/Kurvenzeichnung über Position 500–1000 hinaus reparieren (kein `maxT`-Deckel).
- [done] Großkreis als Default beibehalten und die Großkreis-Distanz als Länge im Plot erklären.
- [done] RoPE-Detailbox vorhanden; Query/Key-Rotation, Abgrenzung zur Sinus-Demo und Quellen geprüft.
- [done] Positionsboxen auf Mobil im DOM vorhanden, Seiten-Overflow 0.

## Tokenizer / BPE
- [done] Lange Tokenkette horizontal scrollbar statt Zeilenumbruch.
- [done] BPE interaktiv: unbelievable, Sprachmodell, ahimsa, अहिंसा, hello, 🔥.
- [done] Kompression sichtbar: Zeichen/Bytes → Tokens, inkl. Byte-Tokens für seltene Schrift.
- [done] Quellen Sennrich et al. 2016 und GPT-2 (Radford et al. 2019).
- [done] BPE-Beispiele auf Mobil bedienbar, Tokenkette scrollt horizontal, kein Seiten-Overflow.

## Token-Trajektorien durch GPT-2
- [done] Demo beschleunigt: Plotly durch eine leichte Canvas-Szene ersetzt.
- [done] Standardmetrik ist Winkel / Großkreis; Euklid bleibt als Umschalter.
- [done] Erklärt in Notiz, Kontext und optionalem Kasten: andere Metrik als Euklid, Netz vergleicht am Ende Richtungen.
- [done] DE/EN, Default, Layer-Regler und Kandidaten auf Desktop geprüft; keine Konsolenfehler.
- [done] Trajektorien-Szene auf Mobil geprüft: Canvas, Winkel-Default, Layer 12 mit Paris, kein Overflow.

## „Ein Wort nach dem anderen“ / Landschaft
- [done] Satz „Es war einmal ein …“ ausdrücklich als Aufgabe nennen; bis `<|endoftext|>`.
- [done] Klarstellen, dass die Landschaft nur eine Demo ist.
- [done] „Fluss“ und „Schloss“ als sehr unwahrscheinliche Tokens weiter links/außen platzieren.
- [done] Landschaft über die Tokens hinaus weiterlaufen lassen und am Rand ausfransen (weicher Rand).
- [done] Stärkerer Videospiel-Weltrand: „Nebel & Token-Silhouetten“ gewählt und umgesetzt (ausgefranste Kante, Nebelbänke, ferne Token-Namen).
- [done] Weltrand in DE/EN und Desktop/Mobil ohne Konsolenfehler geprüft.
- [done] Fog of War: ferne Tokens werden ausgeblendet; nahe/gesehene bleiben sichtbar.
- [done] Wiese der Wörter als sehr blasser Hintergrund hinter die Landschaft gelegt.
- [done] Klick in die Nähe eines Tokens genügt; breite Trefferflächen um die aktuellen Tokens.
- [done] Blasen als 2D-Darstellung eines höherdimensionalen Raums erklären.
- [done] Expressivitätslücke neutral als nicht einheitlichen Begriff erklärt; Detailrecherche bleibt offen.
- [done] Mehr Wörter in der Wiese (Default 20, bis 40), Voronoi-Seams bleiben erhalten.

## Allgemein
- [done] Scrollen im linken Textfeld dreht keine Folie mehr weiter.
- [done] Seiten-Test DE/EN, Desktop/Mobil, Konsole und gezielte Höhenprüfungen ausgeführt. Der generische `tenminutes_height_test.py` ist für diese Seite nicht anwendbar (kein `__tmMeasureHeights`); der eigene Höhentest für alle relevanten Szenen ist grün.
- [done] `node --check`, `php -l`, `git diff --check`, `check_all.py --fast` und `tenminutes_pages_test.py` ausgeführt: alle grün.
