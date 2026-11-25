# Fünf Klassiker – interaktive Lese-Reise

Eine kleine, eigenständige Lernseite über Ordnung, Emergenz, Systeme, Wahrscheinlichkeit und Muster. Jede Etappe verbindet ein Originalwerk mit 2–3 interaktiven Labs, kurzen theoretischen Abschnitten, Temml-Formeln und einem Selbstcheck.

## Starten

Die Seiten laden Temml und die Schriften aus dem Blog-Wurzelverzeichnis. Deshalb am besten einen Server auf `blog/` starten:

```bash
cd /home/norman/websites/asanai/blog
python3 -m http.server 8000
```

Dann öffnen:

```text
http://localhost:8000/test/papers/
```

Ein direktes Öffnen der HTML-Dateien funktioniert meist auch, aber ein lokaler Server ist zuverlässiger.

## Die fünf Etappen

| Etappe | Seite | Werke | Labs |
|---|---|---|---|
| 01 | `kauffman.html` | Stuart A. Kauffman, *The Origins of Order* (1993) | NK-Fitnesslandschaft, Boolesches Netz, Katalyse-Netz |
| 02 | `anderson.html` | P. W. Anderson, *More Is Different* (1972) | Ising-Modell, Landau-Potenzial, Hierarchie-Leiter |
| 03 | `bertalanffy.html` | Ludwig von Bertalanffy, *General System Theory* (1968) | Offenes System, logistisches Wachstum, Rückkopplung |
| 04 | `kolmogorov.html` | A. N. Kolmogorov, *Foundations of the Theory of Probability* (1933) | Ereignis-Maler, Galton-Brett, Bayes-Test |
| 05 | `alexander.html` | Christopher Alexander et al., *A Pattern Language* (1977) | Lichtlabor, Pattern-Graph |

`index.html` ist der Einstieg mit Fortschritt und Denkfaden. `quellen.html` erklärt Quellen, Vereinfachungen und Nutzung. `_sources/` enthält die lokal geprüften Original-PDFs.

## Didaktische Linie

- **Erst spielen, dann begriffen:** Jedes Lab ist vor der Erklärung platziert, nicht danach.
- **Zwei Ebenen pro Formel:** Die Variablen werden in der inneren `\underbrace` benannt, die Bedeutung der Gleichung in der äußeren.
- **Explizite Grenzen:** Jedes Modell nennt, was es zeigt und was es nicht zeigt. Die Seite behauptet nicht, ein Spielzeugmodell sei die Wirklichkeit.
- **Keine Blackbox:** Alles ist Vanilla HTML/CSS/JS, Canvas und lokales Temml. Kein Tracking, kein Build-Schritt, keine CDN-Abhängigkeit.

## Technik

- `assets/style.css` – Designsystem, Typografie, responsive Layouts, Hell/Dunkel.
- `assets/app.js` – Theme, Fortschritt (localStorage), Temml-Rendering, Quizze, Scroll-Navigation, Reveal.
- `assets/boot.js` – setzt das Theme vor dem ersten Paint.
- `*.js` – je eine Lab-Datei pro Etappe.
- Fortschritt und Theme bleiben ausschließlich im Browser.

## Geprüft

- `node --check` für alle JS-Dateien
- `uv run blog/tests/js_validator.py blog/test/papers` → 0 Fehler, 0 Warnungen
- Playwright-Smoke-Tests: alle Seiten laden ohne Console-/Page-Errors, Labs reagieren, Theme und Fortschritt funktionieren
- lokale Link- und Asset-Prüfung: keine fehlenden Dateien
- responsive geprüft bei 1440, 1024 und 390 px ohne Body-Overflow

## Rechte

Die PDFs in `_sources/` sind lokale Lesekopien für dieses private Lernprojekt. Rechte an Texten und Abbildungen bleiben bei den jeweiligen Verlagen und Rechteinhabern. Details stehen in `_sources/MANIFEST.md` und in `quellen.html`. Bitte nicht weitergeben; für Unterricht oder Veröffentlichung die offiziellen Ausgaben nutzen.

Hinweis: `blog/.gitignore` ignoriert `test/papers/`. Die Sammlung ist also bewusst lokal und wird nicht versehentlich mit den großen PDFs committet.
