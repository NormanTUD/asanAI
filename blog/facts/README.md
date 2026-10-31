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

# Alle Dateien gegeneinander prüfen.
uv run blog/tools/factcheck/check_facts.py blog/

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
      "line": 29,
      "citation_keys": [],
      "source_url": "",
      "confidence": "stated"
    }
  ]
}
```

### Pflichtfelder pro Claim

`subject`, `predicate`, `value`, `unit`, `quote`, `line`.

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
- `quote` ist der exakte Substring aus der Lektion, `line` die 1-basierte
  Zeile in der PHP-Datei.

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
| `line` | `lineno`, `line_number`, `line_no` |
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
