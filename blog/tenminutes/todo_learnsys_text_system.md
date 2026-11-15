# LearnSys text system — Plan, Fortschritt, Probleme

Status: **[in work]**
Stand: 14. November 2026
Datei: `todo_learnsys_text_system.md`
Zugehörige Todo-Liste: opencode `todowrite` (gleiche Reihenfolge, gleiche Stati).

## Ziel

Die linke Textspalte von LearnSys wird ein globales, editierbares
Textsystem. Jede Folie und jede Unterfolie hat einen eigenen Kurztext
(3–5 Sätze, Temml-Formeln erlaubt). Alles Weitere lebt in einem
„Mehr erfahren“-Bereich mit beliebig tief verschachtelten Fragen. Texte,
Fragen, Reihenfolge, ausgeblendete Folien und Deep-Links werden im Browser
bearbeitet und als JSON exportiert. Die Demo-Daten bleiben dabei unangetastet:
Ausblenden entfernt keine Demo, Verschieben ändert keine Demo.

## Nutzeranforderungen (verdichtet)

1. Unterframes/Unterfolien werden in ein globales System überführt.
2. Jede Unterfolie zeigt links einen eigenen Text.
3. Oben maximal 3–5 Sätze, inklusive Temml-Formeln.
4. Darunter ein Button „Mehr erfahren“.
5. Fragen lassen sich einzeln bearbeiten und hinzufügen.
6. Ein globaler GUI-Button exportiert alle **geänderten** Texte als JSON.
7. Der Export soll im Browser live weiterbearbeitbar sein (WYSIWYG, nur Texte).
8. Folien lassen sich per GUI nach vorn/hinten verschieben und ausblenden.
9. Die Demos bleiben erhalten, auch wenn ihre Folie ausgeblendet ist.
10. Eine einzelne Unterseite/Demo ist über eine URL mit `#` erreichbar.
11. Demos und Unterseiten können dieselben weiteren Fragen teilen, müssen aber nicht.
12. Fragen können wieder Fragen enthalten, ad infinitum (meist 2–4 Kinder, selten 4 Stufen).
13. Beim Umbau darf keine Demo verloren gehen oder kaputtgehen.

## Arbeitsregeln für diesen Umbau

- Demo-Daten (`demos/*.js`, `day.demo`, `step.demoState`) werden nicht
  umgeschrieben, nur gelesen.
- Layout- und Textänderungen liegen in getrennten localStorage-Overlays:
  - `tm_learnsys_text_v1` — Texte/Fragen, pro Sprache, Tag, Schritt, Substep.
  - `tm_learnsys_layout_v1` — Reihenfolge und Sichtbarkeit, pro Tag.
- Originaldaten bleiben die Quelle der Wahrheit und sind immer
  wiederherstellbar (Zurücksetzen, `textDraft: false`, Layout-Reset).
- Jede neue UI-Zeichenkette existiert auf Deutsch und Englisch.
- Nach jeder Phase: Tests ausführen und hier eintragen.

## Datenmodell (Ziel)

### Text-Dokument pro View

Ein „View“ ist `(dayId, stepIndex, substepIndex)`. Der Schlüssel im Overlay ist
`"<step>.<substep>"`. Ein Dokument:

```js
{
  body: "3–5 Sätze mit $f\\colon X \\to Y$",
  groups: [{
    id: "g-basics",
    title: "Eine Ebene tiefer",
    questions: [{
      id: "q-context",
      title: "Was ist der Kontext?",
      body: "Antwort",
      tex: "\\underbrace{...}_{...}",
      questions: [/* rekursiv */]
    }]
  }]
}
```

- `questions` darf an jeder Frage wieder `questions` enthalten (ad infinitum).
- Quellen sind eine Gruppe mit `sources: [...]` (nicht editierbar).
- „Bisheriger Text“ ist eine automatisch erzeugte Gruppe im Draft-Modus.

### Geteilte Fragen

Mögliche Ebenen:

```js
day.questionGroups       // für alle Folien dieses Tages
step.questionGroups      // nur diese Folie
step.substeps[i].questionGroups // nur diese Unterfolie
```

Merge-Reihenfolge (Vorschlag):

1. `day.questionGroups`
2. automatisch abgeleitete Fragen (`context`, `deep`, `boxes`, `sources`)
3. `step.questionGroups`
4. `substep.questionGroups`
5. automatische „Bisheriger Text“-Gruppe im Draft-Modus

Explizite Gruppen können mit `inherit: false` die geerbten Gruppen ersetzen.
Das wird erst gebaut, wenn die Basis stabil ist.

### Layout-Overlay

```js
{
  "<dayId>": {
    order: [0, 2, 1, 3],   // Originalindizes
    hidden: [4, 5]          // Originalindizes
  }
}
```

- `state.step` bleibt der Index in der **sichtbaren** Liste.
- `visibleSteps(day)` liefert die sichtbaren Schritt-Objekte in Overlay-Reihenfolge.
- Die Originaldaten werden nie mutiert.

### Export/Import

```js
{
  "version": 1,
  "generated_at": "2026-11-14T...",
  "texts": {
    "de": { "<dayId>": { "0.0": { body, groups } } },
    "en": { ... }
  },
  "layout": { "<dayId>": { order, hidden } }
}
```

- `texts` enthält nur Einträge, die im Browser bearbeitet wurden.
- Import akzeptiert dieses Format und das reine Overlay-Format.

### Deep Links

Unterstützte Hash-Formen:

- `#day=<id>&step=<n>&sub=<n>`
- `#/<dayId>/<step>/<sub>`
- `#<step>` (nur bei einer Ein-Tages-Seite)

Beim Navigieren wird der Hash per `history.replaceState` aktualisiert.
Ein „Link kopieren“-Button liefert die aktuelle URL.

## Phasen und Checkliste

### Phase 0 — Bestandsaufnahme und erste Fassung (DONE)

- [x] Linke Textspalte auf Kurztext + „Mehr wissen“-Klappe umgestellt.
- [x] 3–5-Satz-Grenze im Renderer, Rest wandert automatisch in eine Fortsetzung.
- [x] Gruppierte Fragen aus `context`, `deep`, `boxes` (nach `lens`) und `sources`.
- [x] Fragenindex oben in der Klappe.
- [x] Draft-Modus `textDraft: true` mit Lorem ipsum und Temml-Beispielformel.
- [x] Alter Text bleibt als „Bisheriger Text“-Gruppe erhalten.
- [x] Inline-Editor für Kurztext, Gruppen und Fragen.
- [x] localStorage-Overlay, Speichern, Kopieren, Zurücksetzen.
- [x] Erste Unit- und Browsertests.
- [x] `check_all.py --fast`, Seiten- und Height-Test grün.

### Phase 1 — Unterfolien als eigene Texte (DONE)

- [x] `go(day, step, substep)` und `LearnSys.goView(day, step, substep)`.
- [x] Jede Unterfolie bekommt einen eigenen Platzhaltertext mit Substep-Marker.
- [x] Originaltext jeder Unterfolie landet in ihrer eigenen „Bisheriger Text“-Gruppe.
- [x] Editor-Kontext wechselt korrekt zwischen Substeps und speichert getrennt.
- [x] „Bisheriger Text“-Gruppe pro Substep getestet.
- [x] Demo-Mount pro Substep geprüft (keine Demo vergessen).

### Phase 2 — „Mehr erfahren“ und tiefe Fragen (DONE)

- [x] Root-Label „Mehr erfahren“ (EN: „Learn more“).
- [x] Rekursiver Renderer für `question.questions`.
- [x] Rekursiver Editor: Unterfragen hinzufügen, bearbeiten, löschen.
- [x] Zähler rekursiv.
- [x] CSS-Einrückung für Tiefen 1–4+.
- [x] Browser-Test: Unterfrage anlegen, speichern, wieder öffnen.

### Phase 3 — Geteilte und spezifische Fragen (DONE)

- [x] `day.questionGroups`, `step.questionGroups`, `substep.questionGroups`.
- [x] Merge-Reihenfolge implementiert (abgeleitet → Tag → Schritt → View).
- [x] `inherit: false` respektiert.
- [x] Tests: geteilte Frage erscheint in zwei Views, spezifische nur in einer.

### Phase 4 — Globaler Export/Import (DONE)

- [x] Globale GUI-Buttons „JSON ↓“ (Modal) und „JSON ↑“ (Datei).
- [x] Export nur geänderter Texte, beide Sprachen, inkl. Layout.
- [x] JSON-Modal mit Copy-Paste-Textarea, Kopieren und Herunterladen.
- [x] Import per Datei; merge mit lokalem Overlay.
- [x] Statusmeldungen DE/EN.
- [x] Test: Export enthält nur geänderte Einträge; Import stellt sie wieder her.

### Phase 5 — Folien verschieben, ausblenden, einblenden (DONE)

- [x] Layout-Overlay und zentrale `visibleEntries` / `visibleCount` / `stepAt`.
- [x] Alle Stellen auf `visibleEntries` umgestellt (Navigation, Rails, Kalender, Preload).
- [x] GUI-Panel „Folien“ mit ▲, ▼, Ausblenden, Einblenden.
- [x] Aktive Folie nach Verschieben/Ausblenden stabil halten.
- [x] Letzte sichtbare Folie nicht ausblendbar.
- [x] Demos bleiben nach Ausblenden im Datenmodell und werden beim Einblenden wieder gemountet.
- [x] Test: Reihenfolge ändern, ausblenden, einblenden, Demo prüfen.

### Phase 5b — Unterfolien zu Folien machen (DONE)

- [x] GUI-Aktion „Aufteilen“ macht aus jeder Unterfolie eine eigene Folie.
- [x] Die Elternfolie wird dabei ausgeblendet, bleibt aber im Datenmodell.
- [x] Promoted-Folien behalten den Text-Key ihrer Unterfolie (`10.1`), damit bearbeitete Texte und Überschriften beim Aufteilen erhalten bleiben.
- [x] „Zusammenführen“ stellt die Elternfolie wieder her.
- [x] Test: Promote, 35 Folien, jede mit Demo und Text, Unpromote.

### Phase 6 — Deep Links (DONE)

- [x] Hash-Parser und -Writer (`#/day/step/sub`, `#day=…&step=…`, `#3`).
- [x] Navigation aktualisiert den Hash per `replaceState`.
- [x] `hashchange` navigiert.
- [x] „Link“-Button kopiert die aktuelle URL.
- [x] „Demo solo“-Link öffnet `intuition_learnsys-demo.php?scene=…`.
- [x] Test: URL mit `#` öffnet exakt die Folie/Unterfolie.

### Phase 6b — Überschriften und Kicker bearbeiten (DONE)

- [x] Text-Overlay speichert zusätzlich `title`, `kicker` und `watch`.
- [x] Editor-Felder für Überschrift, Kicker und Beobachte-Hinweis.
- [x] Linke Spalte und Bühnenkopf reagieren live auf die Eingabe.
- [x] Folienleiste, Kalender und Layout-Panel zeigen den bearbeiteten Titel.
- [x] Export/Import enthalten die kopierten Überschriften.
- [x] Test: Überschrift/Kicker live, nach Speichern und im Export.

### Phase 6c — Frage oder Trivia (DONE)

- [x] Jede optionale Frage trägt `kind: "question" | "trivia"`.
- [x] Ableitung: Kontext/Tiefe = Frage; Boxen mit `?` = Frage, sonst Trivia; „Bisheriger Text“ = Trivia.
- [x] Sichtbarer Tag „Frage“ / „Trivia“ in der Zusammenfassung.
- [x] Editor-Auswahl pro Frage.
- [x] Quellen bleiben unverändert und sind weiterhin erreichbar.

### Phase 7 — Demo-Vollständigkeit und Regressionen (DONE)

- [x] Jede Folie und Unterfolie: Text vorhanden, Demo gemountet, keine Console-Fehler.
- [x] Reorder/Exclude/Promote: keine Demo verschwindet aus den Daten.
- [x] Bestehende Tests aktualisiert.
- [x] Neue Browser-Tests für Subframes, Nested Questions, Export/Import, Layout, Hash.
- [x] `check_all.py --fast` (letzter Lauf: alle 33 Stages PASS).
- [x] `tenminutes_pages_test.py` und `tenminutes_height_test.py`.
- [x] `js_validator` (keine kritischen Fehler), `php_validator`, `git diff --check`.

## Probleme, Risiken, offene Fragen

1. **`state.step` Bedeutung.** Wechsel von „Originalindex“ zu „sichtbarer
   Index“ berührt Navigation, Rails, Kalender, Preload und Tests. Muss zentral
   über `visibleSteps` laufen, sonst brechen Demos oder Sprünge.
2. **Unterfolien mit geteilten Objekten.** Manche `substeps` referenzieren
   dieselben Schritt-Objekte. Text-Overlays müssen trotzdem pro Substep
   getrennt bleiben; der Originalschlüssel ist `step.substep`, nicht die
   Objektidentität.
3. **Draft-Modus und Demos.** Lorem ipsum ersetzt nur den linken Text. Der
   Demo-Mount hängt an `activeView().demoState`; das darf sich nicht ändern.
4. **Rekursiver Editor.** Pfade wie `0.1.2` müssen stabil bleiben, auch wenn
   Geschwister gelöscht werden. Nach jedem Add/Remove neu rendern.
5. **Export nur geänderter Texte.** Ein gespeicherter, aber unveränderter
   Eintrag ist trotzdem ein Overlay-Eintrag. Das ist akzeptabel, muss aber
   dokumentiert werden.
6. **Sprache.** Overlays sind pro Sprache getrennt. Ein Import für `de`
   überschreibt nicht `en`.
7. **Höhe/Fokus.** Editor und Fragenbaum dürfen die Demo-Spalte nicht
   verschieben. Height-Test nach jeder Phase.
8. **Bestehende Tests.** `learnsystest.html` hat eine eigene, ältere Inline-CSS-
   Kopie. Neue Styles müssen dort nicht perfekt sein, aber die Struktur muss
   weiter funktionieren.

## Testbefehle

```bash
node blog/tests/learnsys_unit_test.js
uv run blog/tests/learnsys_browser_test.py
uv run blog/tests/learnsys_text_edit_browser_test.py
uv run blog/tests/learnsys_loop_landscape_test.py
uv run blog/tests/learnsys_global_text_browser_test.py
uv run blog/tests/tenminutes_pages_test.py --pages intuition_learnsys.php
uv run blog/tests/tenminutes_height_test.py --pages intuition_learnsys.php --langs en,de --viewports desktop,mobile --monkey 4
python3 blog/tools/check_all.py --fast
git diff --check
```

## Änderungsprotokoll

- 2026-11-14: Erste Fassung (Kurztext, Mehr-wissen-Klappe, Gruppierung,
  Editor, Draft-Modus, Tests). Alle Phase-0-Punkte grün.
- 2026-11-14: Plan für das globale Textsystem angelegt; Phase 1–7 offen.
- 2026-11-14: Phasen 1–6c implementiert. Unterfolien sind eigene Text-Views;
  Fragen sind rekursiv; geteilte Fragen und `inherit: false` funktionieren;
  JSON-Modal mit Copy-Paste, Import und Download ist da; Folien lassen sich
  verschieben, ausblenden und in Unterfolien aufteilen; Deep-Links per Hash;
  Überschrift/Kicker/Beobachte sind editierbar; jede Frage ist Frage oder
  Trivia. Neue Tests: `learnsys_global_text_browser_test.py` (59 Checks).
- 2026-11-14: Verifikation: `learnsys_browser_test` 87/0,
  `learnsys_text_edit_browser_test` 27/0, `learnsys_global_text_browser_test`
  59/0, `learnsys_loop_landscape_test` 15/0, `learnsys_unit_test` 20/0,
  Seiten-Test 30/30, Height-Test 34/0, `check_all.py --fast` 33/33 Stages PASS,
  `js_validator` 0 Fehler, `php_validator` 0 Issues, `git diff --check` sauber.

## Bekannte Grenzen und Entscheidungen

- `textDraft: true` in `intuition_learnsys-data.js` zeigt den Lorem-Kurztext.
  Die alten Texte stehen unverändert in den Daten und als „Bisheriger Text“
  in „Mehr erfahren“. Für die echten Texte entweder im Editor überschreiben
  oder `textDraft: false` setzen.
- Der Export enthält alle Einträge im Text-Overlay. Ein bewusst gespeicherter,
  aber inhaltlich unveränderter Text ist deshalb ebenfalls enthalten. Das ist
  die einfache, nachvollziehbare Regel: gespeichert = geändert.
- Geteilte Fragen (`day.questionGroups`) sind im Engine-Test abgedeckt. Die
  echte Intuition-Seite definiert derzeit noch keine Tagesgruppen; sie kann
  sie später ohne Codeänderung aufnehmen.
- `learnsystest.html` hat eine ältere Inline-CSS-Kopie. Die Struktur und die
  Tests funktionieren, aber neue Editor-/Layout-Styles sind dort nicht
  vollständig. Die echte Seite nutzt `learnsys.css`.
- Verschieben einer Folie tauscht ihre Position in der Layout-Reihenfolge.
  Ausgeblendete Einträge bleiben in der Reihenfolge und werden beim
  Einblenden an ihrer alten Position sichtbar.
- Unterfolien zu Folien machen blendet die Elternfolie aus, löscht sie aber
  nicht. „Zusammenführen“ stellt sie wieder her.
- Der „Demo solo“-Link nutzt `demoPreview` aus der Mount-Konfiguration. Ohne
  diese Option wird der Link nicht angezeigt.
