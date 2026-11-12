# Offene Arbeiten — intuition_learnsys

Status: `[done]` erledigt, `[in work]` aktuell, `[pending]` offen.

## Folie 1 / Einstieg
- [done] Titel „Was ist ein LLM?“ und „Large Language Model“ ausschreiben.
- [done] Adventskalender-Satz ergänzen.
- [pending] Satz ergänzen: Diese Netze werden mit großen Datenmengen trainiert; das Training im Detail kommt später.
- [done] Zwei Handys nacheinander statt nebeneinander; Umschalter Suche / KI-Chat.
- [done] KI-Chat statt ChatGPT; Frage „Warum ist überhaupt irgendwas?“ und philosophische Kurzantwort.
- [pending] Prüfen, ob die philosophische Antwort in DE/EN auf Desktop und Mobil gut lesbar ist.

## Code-Folie
- [done] Monitor mit opera.jpg, Taskleiste und zwei Fenstern.
- [done] Agenten-Konsole: kurzes Nachdenken, Datei schreiben.
- [done] „Weiter“ öffnet das Lauf-Fenster und tippt `python3 himmel.py` in 200 ms.
- [pending] Auf Mobil prüfen, ob Taskleiste, Agenten-Chat und Lauf-Fenster ohne Überlappung passen.

## Modelle
- [done] „Modelle“ und „Die Bausteine eines LLM“ als zwei Folien trennen.
- [done] Funktionsplot nur auf „Modelle“, Bausteine nur auf „Die Bausteine“.
- [done] Optionaler Kasten zu weiteren Architekturen.
- [pending] Prüfen, ob Plot und Bausteine auf Mobil groß genug und ohne Abschneiden sind.

## Position / „Jeder Platz bekommt einen Fingerabdruck“
- [pending] Text oben vereinfachen: Tokens haben von sich aus keine Reihenfolge.
- [pending] Klarstellen: viele Methoden; RoPE ist die moderne, u. a. in Llama genutzte Methode.
- [pending] Sinus, gelernte absolute Positionen, relative Bias, ALiBi und RoPE benennen.
- [pending] Quellen ergänzen: Vaswani 2017, Su et al. 2021 (RoPE), Touvron et al. 2023 (Llama 2), Press et al. 2021 (ALiBi), ggf. Raffel et al. 2020 (T5).
- [pending] Optionalen Kasten ergänzen: Muster, „Drache an Position 5/22“, trennbare Tokens, Positionsinformation bleibt im Netz, Stellenwertsystem durch schnelle/langsame Rotationen.
- [pending] Linien-/Kurvenzeichnung über Position 500–1000 hinaus reparieren (kein `maxT`-Deckel).
- [pending] Großkreis als Default beibehalten und die Großkreis-Distanz als Länge im Plot erklären.
- [pending] Detailbox für RoPE-Implementierung (Query/Key-Rotation) und Abgrenzung zur Demo.

## Tokenizer / BPE
- [done] Lange Tokenkette horizontal scrollbar statt Zeilenumbruch.
- [done] BPE interaktiv: unbelievable, Sprachmodell, ahimsa, अहिंसा, hello, 🔥.
- [done] Kompression sichtbar: Zeichen/Bytes → Tokens, inkl. Byte-Tokens für seltene Schrift.
- [done] Quellen Sennrich et al. 2016 und GPT-2 (Radford et al. 2019).
- [pending] Prüfen, dass die BPE-Beispiele auf Mobil ohne Überlauf bedienbar sind.

## Allgemein
- [done] Scrollen im linken Textfeld dreht keine Folie mehr weiter.
- [pending] Gesamten Seiten-Test DE/EN, Desktop/Mobil, Konsole und Höhen prüfen.
- [pending] `node --check`, `php -l`, `git diff --check`, `check_all.py --fast`, `tenminutes_pages_test.py` ausführen.
