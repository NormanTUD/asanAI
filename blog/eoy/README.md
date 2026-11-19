# eoy: Einzeldateien der Intuition-Lektion

`eoy/index.php` zeigt alle 31 Einträge in der gewohnten LearnSys-Leiste.
`eoy/1.php` bis `eoy/31.php` zeigen jeweils genau einen Eintrag ohne die
obere Leiste. Über `.htaccess` funktionieren auch `eoy/1`, `eoy/2` usw.;
`eoy/1.php` leitet auf `eoy/1` weiter.

## Bearbeiten aktivieren

Der Bearbeitungsmodus wird durch eine leere Datei mit dem Namen

```text
.local-editor
```

im Ordner `blog/eoy/` aktiviert:

```bash
touch blog/eoy/.local-editor
```

Solange diese Datei fehlt, sind die Seiten schreibgeschützt: Es gibt keine
Bearbeiten-Schaltflächen, und Textblöcke bekommen beim Darüberfahren mit der
Maus keine grüne Hervorhebung. Die Datei ist lokal und wird nicht committet.

Zum Deaktivieren reicht:

```bash
rm blog/eoy/.local-editor
```

Optional blendet eine zweite leere Datei namens `.hide-expand-all` die
Schaltfläche „Alle öffnen“ aus:

```bash
touch blog/eoy/.hide-expand-all
```

## Wie die Erkennung funktioniert

`_page.php` prüft `is_file(__DIR__ . '/.local-editor')` und setzt
`window.TM_LOCAL_EDITOR`. `learnsys.js` setzt daraufhin die Klasse
`ls-no-editor` am `#learnsys`-Container. Diese Klasse versteckt die
Bearbeiten-Bedienelemente und schaltet den Hover-Effekt der Textblöcke ab.

## WordPress-Einbettung ohne iframe

`wordpress-embed.html` enthält den Snippet für eine Div-Einbettung:

```html
<div id="asanai-eoy-embed" data-src="eoy/1?lang=de" data-height="1500"></div>
<script src="/asanai_blog_proxy.php?eoy/div-embed.js"></script>
```

`div-embed.js` lädt die Lesson über den Proxy, scoped deren CSS auf das Div,
injiziert das Markup und lädt die Lesson-Skripte in Reihenfolge. Spinner,
Navigation und Overlays bleiben im Div. `data-height` ist die **Maximalhöhe**
(Pixel oder CSS-Länge); nach dem Laden schrumpft das Div auf den tatsächlichen
Inhalt. `data-demo-height` setzt die bevorzugte Demo-Höhe in Pixel (Default
600, `media` 780), damit die Höhe nicht an der Demo vorbei wächst. Ohne
`data-height` gilt `min(90vh, 1100px)` als Maximum. Pro Seite ist eine
Einbettung vorgesehen, weil die Lesson feste IDs und globale Zustände nutzt.
