# Automatische Fakten- und Konsistenzprüfung

Diese Datei beschreibt (a) was heute schon automatisch läuft, (b) wie man es
mit einem Befehl ausführt, und (c) den Vorschlag für ein inhaltliches
Fakten-Prüfsystem, das aus den Texten selbst Claims extrahiert und global
verklebt.

Die Kurzfassung: **deterministische Prüfungen blockieren in der CI, LLM/NLI
schlägt nur vor und braucht immer eine Belegstelle.** Kein Modell darf allein
darüber entscheiden, ob eine Aussage falsch ist.

---

## 1. Was heute automatisch läuft

| Prüfung | Datei / Befehl | Was sie findet | In CI? |
|---|---|---|---|
| Kurs-Reihenfolge | `blog/tests/course_order_test.py` | doppelte `(part, order)`-Paare, fehlende Teile, Lücken | ja, über `lesson_guard.py` |
| Querschnitts-Fakten | `blog/tests/fact_consistency_test.py` | bekannte falsche Formulierungen, Bibliographie-Identitäten, Citation-Keys, `literature.js`-Syntax | nein (manuell / Runner) |
| PHP-Syntax + HTML-Balance | `uv run blog/tests/php_validator.py blog/` | PHP-Fehler, kaputte Tags, BOM | ja |
| JS-Grundprüfung | `uv run blog/tests/js_validator.py blog/` | Klammern, Strings, `debugger`, DOM-Tippfehler | ja |
| Lesson-Guards | `uv run blog/tests/lesson_guard.py blog/` | Zitate, Quiz-Balance, Footer, **Order** | ja |
| Bibliographie-Duplikate | `uv run blog/tests/literature_dup_keys.py blog/` | doppelte Top-Level-Keys | ja |
| Node-Unit-Tests | `node blog/tests/{topics,math_alt,keypoint,search_js,semantic_js,rag_chat}_test.js` | DOM-/Such-/Quiz-Logik | ja |
| Suchindex-Frische | `uv run blog/tests/{semantic,rag}_index_test.py` | Index passt nicht zum Inhalt | ja |
| RAG inkrementell | `uv run blog/tests/rag_incremental_test.py` | Builder reused/embedded falsch | ja |
| Atlas | `python3 blog/atlas_data/atlas_check.py` | Entities/Threads/Bibliographie | manuell |
| Link-Checker | `uv run blog/tests/link_checker.py blog/` | tote URLs, falsche PDFs | wöchentlich |
| Render-Validator | `uv run blog/tests/php_render_validator.py blog/ --pages …` | JS-Fehler, LaTeX, Breite | teilweise |

### Ein-Kommando-Runner

```bash
bash blog/tests/run_fact_audit.sh          # schnelle + Index-/Atlas-Prüfungen
bash blog/tests/run_fact_audit.sh --fast   # nur die schnellen Guards
```

Der Runner bricht beim ersten Fehler ab (`set -euo pipefail`) und gibt die
rohen Ausgaben der Tests aus.

### Order-Test im Detail

`blog/tests/course_order_test.py` prüft:

- `part` und `order` sind Integer,
- `order >= 1`,
- **keine doppelte `(part, order)`-Kombination** → harter Fehler,
- Teile 1–6 existieren,
- Lücken in einer Teil-Reihenfolge → Warnung (kein harter Fehler, damit das
  Löschen einer Lektion nicht sofort alles blockiert).

Er ist in `lesson_guard.py` importiert und läuft damit in der bestehenden
CI. Ein künstliches Duplikat erzeugt:

```
✗ duplicate course position part=3 order=1: lesson04 and lesson05
[FAIL] course order: 1 error(s), 0 warning(s)
```

---

## 2. Vorschlag: Claim-Ledger mit Gluing-Checks

### Grundidee

Jede Lektion ist eine lokale Sektion. Jede prüfbare Aussage wird zu einem
Claim mit Provenienz:

```json
{
  "claim_id": "language-23-1",
  "lesson": "language",
  "file": "blog/language.php",
  "line": 23,
  "quote": "likely entering widespread social use by 100,000 years ago",
  "subject_id": "concept:language",
  "predicate": "widespread_social_use",
  "value": {"kind": "time", "approx": true, "years_before_present": 100000},
  "qualifiers": {"species": "Homo sapiens"},
  "citation_keys": ["earlylanguage"],
  "status": "extracted"
}
```

Überlappungen sind dieselben `(subject_id, predicate)`-Paare. Das ist die
Verklebe-Bedingung: Wenn zwei Lektionen über dasselbe Entität-Merkmal reden,
müssen die normalisierten Werte übereinstimmen — sonst gibt es einen
Obstruktionsbericht. Die Presheaf-Sprache ist hier nützlich, aber der
Implementierung ist sie egal; entscheidend sind kanonische Entitäten,
explizite Qualifier und ein Report statt stiller Annahmen.

### Stufen

**Tier 0 — deterministisch, jeder Push, < 10 s**

- PHP/Markdown → Textspans, Sätze, `\cite`-Bindung.
- Regex + kuratierte Dictionaries für Zahlen, Einheiten, Jahre, Modellnamen,
  Versionen.
- Kanonisierung: `175 billion` → `1.75e11`, `1,4 Billionen` → `1.4e12`,
  `~20` → Intervall.
- Abgleich gegen ein kleines **Fact Registry** (`registry.yaml`): 30–50
  Kernentitäten (GPT-2/3/4, Transformer, Chinchilla, Llama 2/3, AlexNet,
  ResNet, H100, AlphaFold, …).
- Meldet harte Widersprüche: gleiche Entität + gleiches Merkmal +
  verschiedene Werte ohne Versions-/Zeit-Qualifier.

**Tier 1 — Cross-Lesson-Checks, nightly**

- Alle Claims als JSONL/SQLite sammeln.
- Constraints: Gleichheit, Toleranz, Intervalle, Ordnungsrelationen,
  Einheitenumrechnung, Formel-AST-Vergleich.
- Optional Z3 für harte Constraint-Systeme (Datumsordnungen, Budgets,
  FLOPs).
- Output: `fact_report.md` mit `file:line`, Claim, Widerspruch,
  Schweregrad.

**Tier 2 — Quellenprüfung, weekly**

- Citation-Keys → Crossref/OpenAlex/arXiv/Semantic Scholar.
- PDF/HTML cachen, Text extrahieren (GROBID/`pdftotext`/`docling`).
- Für jeden Claim die relevante Passage per BM25 + Embedding holen.
- NLI (z. B. DeBERTa-MNLI) **oder** lokales LLM (Ollama/Qwen) als Judge,
  aber mit Pflicht auf **wörtliches Zitat + Seite/Abschnitt**.
- Numerische Claims zusätzlich deterministisch parsen und vergleichen —
  NLI ist bei Zahlen unzuverlässig.
- Ergebnis: `supported` / `contradicted` / `unverified`. Ohne Belegstelle
  niemals `contradicted`.

### Datenmodell (JSONL / SQLite)

```
claim_id, lesson, file, line, span, quote,
subject_id, predicate, value, unit, time, qualifiers,
citation_keys[], source_urls[], source_evidence{quote,page},
status, severity, detector, confidence
```

### Ordnerstruktur (Vorschlag)

```
blog/tools/factcheck/
  extract.py        # Lektionen -> claims.jsonl
  registry.yaml     # kanonische Entitäten und Specs
  normalize.py      # Einheiten, Jahre, Intervalle, Modellnamen
  check.py          # Cross-Lesson-Constraints + Report
  verify_sources.py # Tier 2: Quellen holen, NLI/LLM, Belegstellen
  report.py         # Markdown/HTML-Report
  golden/           # manuell gelabelte Claims (Precision/Recall)
```

Keine Laufzeit-Abhängigkeit für die Site: eigene PEP-723-Umgebung, nicht im
Apache-Build.

### Erster Meilenstein

1. `extract.py`: Lektionen parsen, Sätze mit Zitaten und Zahlen als JSONL.
2. `registry.yaml`: 30 Kernentitäten mit kanonischen Specs.
3. `check.py`: Registry-Abgleich + Cross-Lesson-Duplikate, Report als
   Markdown.
4. Zuerst **non-blocking** in CI, Baseline-Snapshot committen.
5. Golden Set (ca. 200 Claims, 10 Lektionen) labeln; Precision/Recall pro
   Detektor messen.
6. Erst dann die hochsicheren Regeln blockierend schalten.
7. Tier 2 als separaten Nightly-Job.

### CI-Integration

Schnelle Guards (heute schon):

```yaml
- name: Fact audit (fast)
  run: bash blog/tests/run_fact_audit.sh --fast
```

Nightly (Tier 1/2):

```yaml
- name: Full fact report
  run: bash blog/tests/run_fact_audit.sh
- name: Source verification
  run: uv run blog/tools/factcheck/verify_sources.py blog/
```

### Evaluierung

- Golden Set: ca. 200 manuell gelabelte Claims
  (`supported` / `contradicted` / `unverified`) und ca. 50 bekannte
  Cross-Lesson-Konflikte.
- Precision-first: keine Fehlalarme in der CI.
- Jede akzeptierte Korrektur wird Regressionstest (Ledger oder
  `fact_consistency_test.py`).

### Grenzen und Risiken

- Entity-Resolution ist der schwierigste Teil; mit einem kleinen kuratierten
  Registry starten und manuell erweitern.
- PDFs/HTML/Paywalls: cachen und als `unverified` markieren, nicht raten.
- LLM-Halluzination: nur mit Beleg-Span akzeptieren.
- Versionen und Definitionen explizit machen: `GPT-3 175B` ≠ `GPT-4`;
  `total params` ≠ `active params`; `context window` ≠ `training tokens`.
- Toleranzen statt Scheingenaugkeit: exakt bei Zählern, relativ bei
  Schätzungen, Intervalle bei „~“, „about“, „mehr als“.

---

## 3. Aktueller Audit-Stand

- Lesbarer Diff der Quelltext-Änderungen: `FACT_AUDIT_CHANGES.diff`
  (Basis `bfb28faa1`, Ende `fd03b2afa`; generierte Binärdateien/Indizes
  ausgeschlossen).
- Ungeklärte Punkte: `blog/FACT_AUDIT_UNRESOLVED.md`.
- Order-Guard: `blog/tests/course_order_test.py`, eingebunden in
  `lesson_guard.py`.
- Querschnitts-Fakten: `blog/tests/fact_consistency_test.py`.

### Nützliche Einzelbefehle

```bash
uv run blog/tests/fact_consistency_test.py
uv run blog/tests/course_order_test.py blog/
uv run blog/tests/lesson_guard.py blog/
uv run blog/tests/php_validator.py blog/
uv run blog/tests/js_validator.py blog/
uv run blog/tests/literature_dup_keys.py blog/
uv run blog/tests/semantic_index_test.py
uv run blog/tests/rag_index_test.py
uv run blog/tests/rag_incremental_test.py
(cd blog && python3 atlas_data/atlas_check.py)
```

### Bekannte Einschränkungen

- Der vollständige `php_render_validator.py --all-lessons`-Lauf braucht lokal
  sehr lange (> 30 min) und wurde hier nicht komplett abgeschlossen; ein
  repräsentativer Seiten-Subset-Lauf war grün.
- `link_checker.py` meldet aktuell 230 harte Fehlschläge, überwiegend
  arXiv-Verbindungsabbrüche und DOI-403 (Bot-Schutz), nicht inhaltliche
  Widersprüche. Die fünf schlimmsten toten Einträge wurden behoben; Details
  in `blog/FACT_AUDIT_UNRESOLVED.md`.
