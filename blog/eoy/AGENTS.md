# Agent Notes

## Text is always multilingual

- Treat every slide text as a German/English pair. A content edit in **one** language is a request to update **both** languages.
- When the user supplies a local-editor diff with `"lang": "de"` or `"lang": "en"` and `"translate_to"`, translate the changed text into the other language and apply it there too.
- Keep the translation faithful: same facts, structure, paragraph breaks, emphasis (`<b>`/`<i>`), links, and math (`$...$`, `$$...$$`). Match the existing tone and British spelling used in the English content.
- Update every affected source, not just the rendered text:
  - `data.js` (both language branches, including `body`, `teaser`, `watch`, `context`, `deep`, box/question groups, etc.)
  - `text_preview.json` when the changed text is the preview body
  - `learnsys-texts-*.json` exports when they contain the changed text
- Never change unrelated fields. The diff is minimal: only apply the fields listed under `diff` / `changed_fields`.

## Local editor diff format

- Exports are minimal diffs: top-level `lang`, `page`, `step`, `substep`, `text_key`, `slide_title`, `changed_fields`, and a `diff` containing only changed values.
- `diff.groups_patch` contains only changed group/question/source paths; `diff.groups_replace` is used only for structural changes.
- The export is marked with `multi_language: true`, `apply_to: ["de", "en"]`, and `translation_note`; treat these as mandatory.
- Local editor copy/export payloads are for applying changes, not for dumping full source documents.
