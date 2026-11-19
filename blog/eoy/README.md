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
