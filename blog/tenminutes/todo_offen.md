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
- [pending] Prüfen, ob die philosophische Antwort in DE/EN auf Desktop und Mobil gut lesbar ist.
- [done] Quellenlink Leibniz (Gutenberg) und Jocax (MedCrave) geprüft: beide HTTP 200.

## Code-Folie
- [done] Monitor mit opera.jpg, Taskleiste und zwei Fenstern.
- [done] Agenten-Konsole: kurzes Nachdenken, Datei schreiben.
- [done] Der Code steht im Agentenfenster, nicht in einem separaten Editor.
- [done] Codefenster ohne Scrollen: Code gekürzt und Schriftgröße passt sich automatisch an.
- [done] „Weiter“ öffnet das Lauf-Fenster und tippt `python3 himmel.py` in 200 ms.
- [done] Agent führt `himmel.py` automatisch aus (Weiter bleibt als manueller Auslöser); Lauf-Fenster zeigt die berechnete Ausgabe.
- [pending] Auf Mobil prüfen, ob Taskleiste, Agenten-Chat, Code und Lauf-Fenster ohne Überlappung passen. (Agentenlauf in DE/EN bereits gezielt geprüft: Befehl und 4.35-Ausgabe erscheinen.)

## „Eine Beziehung lässt sich übertragen“
- [done] Macht/Geschlecht-Beispiele durch Tierpaare ersetzt: Löwe/Löwin, Hengst/Stute, Stier/Kuh, Hahn/Henne.
- [done] Spezies als z-Achse, Rolle (wild/domestiziert) als x-Achse, Geschlecht als y-Achse.
- [done] Neue `animals`-Szene: parallele Pfeile, Paar anklicken, Readout.
- [done] DE/EN-Texte, Achsenlabels und Klickziele auf Desktop geprüft.
- [pending] Dieselben Tierpaar-Checks auf Mobil ausführen.
- [done] Desktop: Tierpaare, Rollenachse und Readout funktionieren; keine Konsolenfehler, kein Überlauf.
- [pending] Mobil: Überlappung der Tierlabels und Achsen prüfen.

## Modelle
- [done] „Modelle“ und „Die Bausteine eines LLM“ als zwei Folien trennen.
- [done] Funktionsplot nur auf „Modelle“, Bausteine nur auf „Die Bausteine“.
- [done] Optionaler Kasten zu weiteren Architekturen.
- [pending] Prüfen, ob Plot und Bausteine auf Mobil groß genug und ohne Abschneiden sind.

## Position / „Jeder Platz bekommt einen Fingerabdruck“
- [done] Text oben vereinfachen: Tokens haben von sich aus keine Reihenfolge.
- [done] Klarstellen: viele Methoden; RoPE ist die moderne, u. a. in Llama genutzte Methode.
- [done] Sinus, gelernte absolute Positionen, relative Bias, ALiBi und RoPE benennen.
- [done] Quellen ergänzen: Vaswani 2017, Su et al. 2021 (RoPE), Touvron et al. 2023 (Llama 2), Press et al. 2021 (ALiBi), Raffel et al. 2020 (T5).
- [done] Optionalen Kasten ergänzen: Muster, „Drache an Position 5/22“, trennbare Tokens, Positionsinformation bleibt im Netz, Stellenwertsystem durch schnelle/langsame Rotationen.
- [done] Linien-/Kurvenzeichnung über Position 500–1000 hinaus reparieren (kein `maxT`-Deckel).
- [done] Großkreis als Default beibehalten und die Großkreis-Distanz als Länge im Plot erklären.
- [pending] Detailbox für RoPE-Implementierung (Query/Key-Rotation) und Abgrenzung zur Demo noch feinprüfen.
- [pending] Prüfen, dass die optionalen Positionsboxen auf Mobil nicht zu lang/abgeschnitten sind.

## Tokenizer / BPE
- [done] Lange Tokenkette horizontal scrollbar statt Zeilenumbruch.
- [done] BPE interaktiv: unbelievable, Sprachmodell, ahimsa, अहिंसा, hello, 🔥.
- [done] Kompression sichtbar: Zeichen/Bytes → Tokens, inkl. Byte-Tokens für seltene Schrift.
- [done] Quellen Sennrich et al. 2016 und GPT-2 (Radford et al. 2019).
- [pending] Prüfen, dass die BPE-Beispiele auf Mobil ohne Überlauf bedienbar sind.

## „Ein Wort nach dem anderen“ / Landschaft
- [done] Satz „Es war einmal ein …“ ausdrücklich als Aufgabe nennen; bis `<|endoftext|>`.
- [done] Klarstellen, dass die Landschaft nur eine Demo ist.
- [done] „Fluss“ und „Schloss“ als sehr unwahrscheinliche Tokens weiter links/außen platzieren.
- [done] Landschaft über die Tokens hinaus weiterlaufen lassen und am Rand ausfransen (weicher Rand).
- [pending] Stärkerer Videospiel-Weltrand: 5 Ideen vorstellen, eine auswählen und umsetzen.
- [done] Fog of War: ferne Tokens werden ausgeblendet; nahe/gesehene bleiben sichtbar.
- [done] Wiese der Wörter als sehr blasser Hintergrund hinter die Landschaft gelegt.
- [done] Klick in die Nähe eines Tokens genügt; breite Trefferflächen um die aktuellen Tokens.
- [done] Blasen als 2D-Darstellung eines höherdimensionalen Raums erklären.
- [done] Expressivitätslücke neutral als nicht einheitlichen Begriff erklärt; Detailrecherche bleibt offen.
- [done] Mehr Wörter in der Wiese (Default 20, bis 40), Voronoi-Seams bleiben erhalten.

## Allgemein
- [done] Scrollen im linken Textfeld dreht keine Folie mehr weiter.
- [pending] Gesamten Seiten-Test DE/EN, Desktop/Mobil, Konsole und Höhen erst am Ende ausführen.
- [pending] `node --check`, `php -l`, `git diff --check`, `check_all.py --fast`, `tenminutes_pages_test.py` erst am Ende ausführen.
