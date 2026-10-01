# File Analyzer Spec — blog project

You are analyzing a batch of files from the **asanAI blog** ("From Big Bang to ChatGPT") — a free
interactive digital textbook about the history and math of AI. It is PHP templates + vanilla JS,
served statically; every lesson is one `*.php` file (Markdown in `<div class="md">` blocks) paired
with an optional `*.js` interactive-visualization module. Citations live in `literature.js`.

## Your job
For the batch of files listed in your data file, read each file and emit **GraphNode** and
**GraphEdge** objects. Write the result to the `outputPath` given in your prompt, as:

```json
{ "nodes": [ ... ], "edges": [ ... ] }
```

## Node shape
Every node MUST have: `id`, `type`, `name`, `summary`, `tags`, `filePath`.
- `id`: `<prefix>:<relative-path>` for file-level nodes; `function:<relative-path>:<name>` and
  `class:<relative-path>:<name>` for symbols. Relative path is relative to the blog root
  (e.g. `transformer.js`, `lndw/fcnn.js`, `functions.php`).
- `type`: one of `file`, `config`, `document`, `function`, `class`. Mapping by `fileCategory`
  in the data file: `code`/`markup`/`script`/`data` → `file`; `config` → `config`; `docs` → `document`.
- `name`: human-readable. For files use the basename (e.g. `transformer.js`, `functions.php`).
  For a PHP lesson, the lesson title from its `COURSE_METADATA` `title` field is ideal if present.
- `summary`: 1–2 sentences, specific (what the file does, not generic). No marketing fluff.
- `tags`: 3–6 lowercase kebab-case tags (e.g. `["attention","transformer","visualization"]`).
- `complexity` (file nodes only): `simple` | `moderate` | `complex`.
- `languageNotes` (optional, code files only): a short note on notable patterns.

For code files, ALSO emit `function` and `class` nodes for the **significant** public symbols
(the meaningful API surface — key functions, classes, exported helpers). Do NOT emit nodes for
trivial one-line helpers, getters, or boilerplate. The `symbolBaseline` in your data file lists
what the extractor found; use it as a checklist but only promote symbols that are genuinely
important, and write a real `summary` for each. `name` for a symbol node is the bare symbol name.
`filePath` for a symbol = the file it lives in.

## Edge shape
Every edge MUST have: `source`, `target`, `type`, `weight`.
- `source`/`target` are node `id`s. **Both must be ids of nodes you (or another batch) define.**
  For in-project `imports`/`depends_on`, the target is the imported file's node id
  (`<prefix>:<imported-relative-path>`). You may reference cross-batch node ids (given in
  `neighborMap`); do NOT invent ids for files not in your data.
- `type`: one of `imports`, `contains`, `calls`, `configures`, `documents`, `routes`,
  `depends_on`, `tested_by`, `related`, `defines_schema`.
- `weight`: use the convention (contains 1.0; inherits/implements 0.9; calls/exports 0.8;
  imports/depends_on 0.7; configures/triggers 0.6; tested_by/documents/related 0.5).

## Edge rules
- `contains`: file → each of its emitted function/class nodes (weight 1.0).
- `imports`/`depends_on`: from the importing file to each in-project import (use the data file's
  `importMap`; do not re-resolve from source). A PHP lesson's `include_once("functions.php")`
  becomes a `depends_on` edge to `file:functions.php`.
- `documents`: a `*.php` lesson that ships an interactive widget is `related` to its `*.js`
  module (same slug). If a lesson clearly is the prose for a JS viz, add `related`.
- `tested_by`: if a file in `tests/` tests a source file, add `tested_by` source=prod, target=test.
- Do NOT add edges to images, fonts, or vendor minified libraries (they are out of scope).

## Discipline
- Be high-signal. Prefer fewer, correct nodes/edges over exhaustive noise.
- Summaries in English, plain factual phrasing.
- Do not create nodes for files outside your data file.
- The output MUST be valid JSON. If a file is unreadable/empty, still emit its file node with a
  minimal summary and no symbol nodes.
