# `blog/facts/` — deterministisches Fakten-Ledger

Hier liegt **pro Lektion** genau eine Datei:

```
blog/facts/<slug>.facts.json   für   blog/<slug>.php
```

Das gilt für jede Top-Level-Lektion mit `COURSE_METADATA` (auch `intro.php`).
Nicht-Lektionen (`index.php`, `index_full.php`, `functions.php`,
`asanai_blog_proxy.php`, `graph.php`) haben keine Fact-Datei.

Der Checker ist deterministisch: kein LLM, kein Netz, keine Embeddings.
Er vergleicht normalisierte Claims über alle Dateien und meldet Widersprüche.

## Befehle

```bash
# Fehlende Dateien anlegen; vorhandene kuratierte Dateien bleiben unangetastet.
uv run blog/tools/factcheck/extract_facts.py blog/

# Alle nicht-kuratierten Dateien neu erzeugen.
uv run blog/tools/factcheck/extract_facts.py blog/ --force

# Alle Dateien gegeneinander prüfen (strenge Gates).
uv run blog/tools/factcheck/check_facts.py blog/ --strict-relations --strict-quotes

# Optional: fehlende Fakten/Jahre als Fehler behandeln.
uv run blog/tools/factcheck/check_facts.py blog/ --require-claims --strict-unregistered

# Provenienz-Rückgrat (Entität -> Lektion) nach neuen Claims.
uv run blog/tools/factcheck/link_provenance.py blog/

# Zusätzliche Kanten aus expliziten Claim-Prädikaten ableiten.
uv run blog/tools/factcheck/derive_relations.py blog/

# Unit-Tests des Ledgers.
uv run blog/tests/fact_ledger_test.py
```

## Aufbau

```json
{
  "schema_version": 1,
  "source": "backproplab.php",
  "lesson": "backproplab",
  "title": "Backpropagation: …",
  "part": 2,
  "order": 5,
  "curated": true,
  "generated_by": "extract_facts.py",
  "citations": ["rumelhart1986"],
  "claims": [
    {
      "id": "backproplab-demo-layers",
      "subject": "backproplab-demo",
      "predicate": "layers",
      "value": 4,
      "unit": "count",
      "qualifiers": {},
      "quote": "the demo below runs a 4-layer network",
      "citation_keys": [],
      "source_url": "",
      "confidence": "stated"
    }
  ]
}
```

### Pflichtfelder pro Claim

`subject`, `predicate`, `value`, `unit`, `quote`. **Keine Zeilennummern**:
der `quote` ist der Anker, Zeilen driften zu schnell.

### Kanonische Namen

- **`subject`**: kleingeschriebene, stabile Kebab-Case-ID, keine Prosa:
  `gpt-3`, `gpt-4`, `llama-2-70b`, `h100`, `alexnet`, `resnet-152`,
  `chinchilla`, `imagenet`, `prompt-injection`.
  Version/Variante gehört in die ID, wenn sie den Wert ändert:
  `gpt-3` vs. `gpt-3-175b`, `model-7b`.
- **`predicate`**: kleingeschriebene snake_case aus dem kontrollierten
  Vokabular: `parameters`, `layers`, `context_window`, `training_tokens`,
  `year`, `memory`, `tflops`, `d_model`, `heads`, `accuracy`, `price`,
  `title`, `part`, `order`, `cites`. Domänenspezifisch erlaubt:
  `architecture`, `activation`, `loss`, `range`, `gradient_rule`.
- **`unit`**: `count`, `year`, `token`, `GB`, `TB`, `TFLOPS`, `%`, `USD`,
  `name`, `formula`, `interval`. Die Einheit gehört **nicht** in `value`.
- **`qualifiers`**: nur bedeutungsändernde Felder:
  `precision` (`bf16`, `fp16`, `fp32`, `int8`, `int4`, `32-bit`, `16-bit`,
  `8-bit`, `4-bit`), `parameter_kind` (`total`/`active`), `variant`,
  `event`, `definition`, `scope`, `approx` (`true`).

### Werte

- Zahlen als Zahl, Einheit separat:
  `"value": 175000000000, "unit": "count"` oder
  `"value": 175, "unit": "billion"`.
- Strings nur für Namen/Formeln/Intervalle:
  `"value": "half-sum-of-squares"`, `"value": "(0,1)"`.
- Näherungen: `"qualifiers": {"approx": true}`.
- `quote` ist der exakte Substring aus der Lektion und der einzige Anker.
  `line` wird nicht gespeichert (Legacy-Eingaben werden toleriert).

## Alias-Toleranz

Der Checker akzeptiert absichtlich auch andere Key-Namen, damit generierte
oder ältere Dateien nicht sofort brechen:

| kanonisch | akzeptierte Aliase |
|---|---|
| `claims` | `facts`, `items`, `entries`, `data`, `statements` |
| `subject` | `entity`, `topic`, `about`, `thing`, `name` |
| `predicate` | `property`, `attribute`, `relation`, `type`, `fact` |
| `value` | `val`, `amount`, `number`, `reading`, `data` |
| `qualifiers` | `qualifier`, `scope`, `context`, `version`, `conditions` |
| `quote` | `evidence`, `text`, `source_text`, `excerpt`, `sentence` |
| `line` | Legacy (`lineno`, `line_number`, `line_no`): wird gelesen, aber nicht erzeugt |
| `citation_keys` | `citations`, `cites`, `bibkeys`, `keys`, `references` |
| `source_url` | `url`, `source`, `link` |

Zusätzlich werden Prädikate normalisiert (`params` → `parameters`,
`context_length` → `context_window`) und Subjekte aliast
(`GPT3` → `gpt-3`, `Llama 2 70B` → `llama-2-70b`).

**Neue Dateien sollen trotzdem die kanonischen Namen verwenden.** Die
Aliase sind eine Kompatibilitätsschicht, kein Stil.

## Konfliktregel

Zwei Claims kollidieren, wenn sie dieselbe Kombination
`(subject, predicate, qualifiers)` haben und sich nach Normalisierung
widersprechen. Einheiten werden umgerechnet (`TB` ↔ `GB`), Zahlen mit
`approx: true` mit 2 % Toleranz verglichen, Strings exakt.

Beabsichtigte Unterschiede bekommen einen Qualifier oder ein anderes
Subjekt — **nicht** eine Ausnahme im Checker.

## CI

Die CI führt aus:

```bash
uv run blog/tools/factcheck/check_facts.py blog/
uv run blog/tests/fact_ledger_test.py
```

Ein fehlendes, verwaistes oder widersprüchliches Fact-File lässt den Job
fehlschlagen.

## Verbesserungs-Roadmap (erster Draft → belastbares System)

Das jetzige System ist bewusst konservativ. Es prüft **nur Claims, die im
Ledger stehen**. Damit ist die größte Lücke klar:

### P0 — unregistrierte Claims erkennen

Ein neuer Satz mit einer neuen Zahl, einem neuen Datum oder einer neuen
Modell-Spec, der nicht ins Fact-File eingetragen wurde, ist für den Checker
unsichtbar. Das ist die wichtigste nächste Ausbaustufe.

Vorschlag:

- `extract_candidates.py` extrahiert aus jeder **geänderten** Lektion alle
  Kandidaten (Zahl + Einheit, Jahr, Modellname, Formel).
- Für jeden Kandidaten: Gibt es einen passenden Claim im Fact-File?
- Nein → CI-Fehler `unregistered claim in file: quote`.
- Ausnahmen (Beispiel, Schätzung, Quiz-Antwort) müssen explizit markiert
  werden, z. B. `qualifiers: {"example": true}` oder ein Makro
  `<!-- fact-example -->`.
- Nur geänderte Lektionen prüfen (`git diff --name-only`), aber gegen das
  **volle** Registry vergleichen.

### P0 — Regeneration und Zitat-Frische

- `extract_facts.py --check`: erzeugt die Dateien in einem Temp-Verzeichnis
  und schlägt fehl, wenn ein nicht-kuratiertes Fact-File vom Generator
  abweicht. So kann niemand vergessen, nach einer Textänderung zu
  regenerieren.
- `check_facts.py` prüft, ob `quote` noch in der PHP-Datei vorkommt. Das
  findet veraltete Facts nach Umbauten.

### P1 — Datengetriebene Registry

Die Alias-Tabellen liegen aktuell in `facts_lib.py`. Besser:
`blog/facts/registry.json` mit

```json
{
  "subjects": {"gpt-3": {"aliases": ["GPT3", "GPT 3"], "kind": "model"}},
  "predicates": {"params": "parameters", "context_length": "context_window"},
  "units": {"billion": "1e9", "Billionen": "1e12"}
}
```

Dann können neue Entitäten ohne Python-Änderung ergänzt werden, und die
Registry ist versioniert und reviewbar.

### P1 — Manifest für wirklich jede PHP-Datei

`blog/facts/_manifest.json` listet **jede** Top-Level-PHP als
`lesson` oder `infrastructure`. Die Coverage-Prüfung vergleicht dagegen.
Damit ist „jede PHP-Datei“ explizit und neue, unklassifizierte Dateien
fallen sofort auf. Infrastruktur-Dateien bekommen ein Fact-File mit
`kind: "infrastructure"` und null Claims.

### P1 — Beispiele und Nicht-Fakten markieren

Zahlen in Quizfragen, hypothetischen Rechnungen („20 Layer“) und
didaktischen Beispielen dürfen keine Fakten werden. Der Extraktor sollte
Quiz-/`<script>`-Blöcke komplett überspringen (teilweise schon umgesetzt)
und `example: true` respektieren. Der Checker darf solche Claims nicht als
harte Widersprüche behandeln.

### P2 — Reichhaltigere Normalisierung

- Datumsintervalle (`ca.`, `~`, `vor`, `nach`, `zwischen`).
- Einheiten über eine kleine Konversionstabelle oder `pint`
  (`GB`/`GiB`/`TB`, `%`, `USD`, `TFLOPS`).
- Formeln als normalisierter AST (`sympy`), damit `6ND` und `2ND + 4ND`
  als gleich erkannt werden.
- Währungen mit explizitem Jahr/Preisstand.

### P2 — Quellen-Metadaten deterministisch prüfen

- Citation-Key existiert (bereits implementiert).
- Crossref/OpenAlex/arXiv-Metadaten: Autor, Titel, Jahr passen zum Claim.
- Optional: Keyword-/Entitäts-Overlap zwischen Claim und Quellentitel.
  Das ist deterministisch, aber nur ein Signal — keine Wahrheitsgarantie.

### P2 — Mutationstests gegen den echten Korpus

Für jeden der ~30 Kern-Fakten wird in einer temporären Kopie der Lektion
der Wert mutiert (`175e9` → `170e9`, `2012` → `2011`, `989` → `495`).
Der Checker muss anschlagen. Das beweist, dass die Erkennung nicht still
kaputtgeht. Ein Beispiel dafür ist bereits in
`blog/tests/fact_ledger_test.py`.

### P3 — Review-Workflow und Severity

- `--json`-Report mit `severity`, `confidence`, `status`.
- `unverified`-Queue für Claims ohne Belegstelle.
- `reviewed`-Feld, damit ein Mensch bestätigen kann.
- Getrennte CI-Stufen: harte Fehler blockieren, weiche Hinweise nur warnen.

### P3 — Schema-Migration

`schema_version` ernst nehmen: bei Änderungen ein Migrationsskript und
einen Test, der alte Dateien weiter lesen kann.

### Was das System weiterhin nicht kann

Es garantiert **interne Konsistenz und Registrierung**, nicht die Wahrheit
beliebiger Prosa. Kausale Behauptungen, Bewertungen, Interpretationen und
„X beeinflusste Y“ bleiben ohne typisiertes Prädikat + Quelle
`unverified` und gehören in die menschliche Review-Queue.

## Beziehungen und Traces

Fakten sind nicht nur Einzelwerte. Jede Fact-Datei darf ein `relations`-Array
enthalten:

```json
{
  "relations": [
    {
      "id": "rel-prompt-injection-scope",
      "from": "prompt-injection",
      "to": "llm-security",
      "kind": "part_of",
      "qualifiers": {},
      "quote": "Prompt injection occurs when an attacker embeds instructions",
      "citation_keys": ["greshake2023injection"]
    }
  ]
}
```

`from`/`to` dürfen Fact-IDs (`backproplab-demo-layers`) oder Subject-IDs
(`backproplab-demo`, `gpt-3`) sein. Beide müssen im Ledger existieren.

### Kanonische Beziehungsarten

| `kind` | Bedeutung | kanonische Richtung |
|---|---|---|
| `influenced` / `influenced_by` | X beeinflusste Y | Einflussquelle → Ziel |
| `before` / `after` / `preceded_by` / `followed_by` | zeitliche Ordnung | früher → später |
| `caused` / `caused_by` | Kausalität | Ursache → Wirkung |
| `authored_by` / `wrote` | Urheberschaft | Person → Werk |
| `part_of` | Teil-Ganzes | Teil → Ganzes |
| `same_as` / `alias_of` | Identität | symmetrisch |
| `derived_from` | Ableitung | Ableitung → Ursprung |
| `located_in` | Ort | Ding → Ort |
| `uses` / `used_by` | Verwendung | Nutzer → Werkzeug |
| `supports`, `contradicts`, `cites`, `related_to` | Evidenz/Assoziation | frei |
| `mentioned_in` | Provenienz: Entität kommt in dieser Lektion vor | Entität → Lektion |

`mentioned_in` ist die **Provenienz-Rückgrat**-Kante: Sie behauptet keine
inhaltliche Beeinflussung, sondern verbindet jeden Fakt-Eintrag mit seiner
Lektion. Dadurch ist jeder Knoten in Traces erreichbar; semantische Kanten
bleiben separat.

Der Checker normalisiert inverse Paare (`influenced_by` → `influenced`,
`after` → `before`, `authored_by` → `wrote`, `used_by` → `uses`) und prüft:

- Endpunkte existieren,
- keine Selbstkanten (außer `same_as`),
- `before`, `part_of`, `caused` sind azyklisch,
- `same_as` wird transitiv geschlossen; danach müssen die Claims der
  verschmolzenen Subjekte übereinstimmen,
- jeder nicht-metadatenhafte Subject hat mindestens eine Relation
  (`--strict-relations` macht daraus einen Fehler),
- zeitliche Kompatibilität: bei `before`/`influenced`/`caused`/`derived_from`
  darf die Quelle nicht später datiert sein als das Ziel (wenn beide ein
  `year`-Claim haben).

### Traces anzeigen

```bash
# Kürzester gerichteter Pfad
uv run blog/tools/factcheck/trace_facts.py blog/ \
  --from chain-rule --to backproplab-demo

# Nachbarn eines Knotens
uv run blog/tools/factcheck/trace_facts.py blog/ --neighbors backpropagation

# Graph als DOT (Graphviz)
uv run blog/tools/factcheck/trace_facts.py blog/ --dot > facts.dot

# Ungerichtete Pfade (für „wie hängt das zusammen?“)
uv run blog/tools/factcheck/trace_facts.py blog/ \
  --from prompt-injection --to llm-security --undirected

# Nur semantische Kanten, ohne mentioned_in-Provenienz
uv run blog/tools/factcheck/trace_facts.py blog/ \
  --from chain-rule --to backproplab-demo --no-provenance
```

Ein Trace zeigt jede Kante mit `kind`, Quote und `file`. So ist eine
Aussagekette nachvollziehbar: `chain-rule → backpropagation →
backproplab-demo`.

## Versionen, Familien und Zeitprüfung

Ein `year`-Claim ist nur dann ein harter Zeitanker, wenn er ein Ereignis
qualifiziert (`qualifiers.event`) und das Subjekt keine Familie ist.

- **Spezifische Version:** `python-3`, `python-2`, `gpt-3-175b`, `java-8`.
- **Familie:** `python`, `java`, `c-language`. Ein Familien-Jahr ist die
  Erstveröffentlichung, keine Obergrenze: spätere Mitglieder können von
  späterer Arbeit beeinflusst sein. Deshalb trägt der Familien-Claim
  `"family": true`.
- **Zeitprüfung:** `before`/`caused` sind hart. `influenced`/`derived_from`
  werden nur hart geprüft, wenn beide Endpunkte ein ereignisqualifiziertes
  Jahr haben; sonst gibt es eine Warnung. `--strict-temporal` macht daraus
  einen Fehler.

Beispiel: NumPy (2005) beeinflusste die spätere Python-Datenwissenschaft,
nicht die Sprache Python von 1991. Deshalb ist `python` eine Familie; die
Relation bleibt gültig, ohne den 1991er-Anker als Obergrenze zu missbrauchen.

`mentioned_in`-Kanten sind reine Provenienz (Entität → Lektion) und werden
vom `--strict-relations`-Check mitgezählt. Semantische Traces lassen sie sich
mit `--no-provenance` ausblenden.

## Inhaltliche Claims — Pflicht, nicht Deko

Metadaten (`title`, `part`, `order`) reichen nicht. Jede Lektion braucht
mindestens einen **inhaltlichen Claim**:

```json
{
  "id": "transformer-2017",
  "subject": "transformer",
  "predicate": "year",
  "value": 2017,
  "unit": "year",
  "qualifiers": {"event": "Vaswani et al. paper"},
  "quote": "The Transformer architecture (Vaswani et al., 2017)",
  "citation_keys": ["vaswani2017"]
}
```

Der `quote` ist der einzige Anker; **keine Zeilennummern**. Der Wert muss
normalisierbar sein (Zahl + Einheit, Jahr, Version, Definition, Formel).
Beziehungen zwischen Entitäten kommen in `relations`; `link_provenance.py`
ergänzt danach das `mentioned_in`-Rückgrat.

### Wie man eine Lektion befüllt

1. Prüfbare Aussagen sammeln: Zahlen, Daten, Modell-Specs, Benchmarks,
   benannte Werke/Ereignisse, Definitionen, Formeln.
2. Canonical `subject` / `predicate` / `unit` wählen, exakten `quote`
   eintragen, `citation_keys` nur aus demselben Satz.
3. Explizite Relationen ergänzen (`influenced`, `before`, `wrote`,
   `part_of`, `same_as`, …); Endpunkte müssen im Ledger existieren.
4. `link_provenance.py` laufen lassen, damit jeder Eintrag erreichbar ist.
5. Prüfen:

```bash
uv run blog/tests/content_claims_test.py
uv run blog/tools/factcheck/check_facts.py blog/ \
  --strict-relations --strict-quotes --require-claims
```

`--require-claims` macht aus einer metadata-only Lektion einen CI-Fehler.
`content_claims_test.py` prüft zusätzlich Kernfakten (GPT-3 175B, Backprop
1986, H100 80 GB / 989 TFLOPS, AlexNet 2012, Transformer 2017, Chinchilla
20 Tokens/Parameter), Tiefe der Geschichtskapitel und Quote/Einheit-Pflicht.

## Statement-Ledger — jeder Satz

Zusätzlich zu den strukturierten `claims` enthält jede Fact-Datei ein
`statements`-Array. Es protokolliert **jeden Prosa-Satz** aus den
`.md`-/`figcaption`-Blöcken:

```json
{
  "id": "tokenizerlab-stmt-12",
  "quote": "Before an AI can “calculate” a word, it must chop the text into pieces.",
  "section": "Tokenization",
  "kind": "statement"
}
```

Erzeugen und prüfen:

```bash
uv run blog/tools/factcheck/extract_statements.py blog/
uv run blog/tools/factcheck/extract_statements.py blog/ --check
```

`--check` schlägt fehl, wenn eine Lektion geändert wurde und ihre
Statement-Liste veraltet ist. Statements sind die Vollständigkeits- und
Provenienzschicht; numerische Konflikte werden über `claims` geprüft.

## Satz-Konflikte

```bash
# Nur faktische Widersprüche (Claim-Werte)
uv run blog/tools/factcheck/check_sentence_conflicts.py blog/ --strict

# Zusätzlich explizite `contradicts`-Relationen (historische/ideelle Gegensätze)
uv run blog/tools/factcheck/check_sentence_conflicts.py blog/ --include-relations
```

Ausgabe:

```text
sentence 'GPT-3 has 175 billion parameters.' (transformer.php) contradicts
sentence 'GPT-3, with 170 billion parameters.' (history.php)
  because subject=gpt-3 predicate=parameters has 1.75e11 count vs 1.7e11 count
```

## Tiefen-Audit und Konfliktliste

```bash
uv run blog/tools/factcheck/deep_audit.py blog/ --strict
```

Prüft zusätzlich: jedes Jahr/jede Quantity in der Prosa, Citation-Grounding,
ungestützte spezifische Claims, Relations-Grounding, Wertebereiche und
normalisierte `*_year`-Konflikte. Der Report landet in
`blog/facts/DEEP_AUDIT.md`.

Bei einem Claim-Konflikt endet `check_facts.py` mit einer
`CONTRADICTION LIST`, z. B.:

```text
claim 'a-params' in a.php contradicts claim 'b-params' in b.php — subject=gpt-3 predicate=parameters
```

Dieselbe Liste steht in `blog/facts/CONFLICTS.md` (generiert, nicht
committen).

### CI-Fehler sind kopierbar

Zwei nicht verklebbare Claims erzeugen einen Block mit `FACT CONFLICT`,
Claim-IDs, Dateien, Quotes, `why`, `fix`, einem GitHub-`::error`-Annotation
und einem fertigen `AI FIX PROMPT` zwischen `COPY FROM HERE` / `COPY TO
HERE`. Der Prompt nennt Subjekt, Prädikat, Scope, beide Werte, den Grund und
den exakten Reparaturbefehl. So kann Mensch oder KI den Fehler direkt
übernehmen, ohne die CI-Ausgabe zu interpretieren.
