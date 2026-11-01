#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Protocol every prose block, sentence and their structural relations.

``blocks``      — every non-empty prose paragraph/line from the PHP file.
``statements``  — every sentence inside those blocks.
Relations       — block -> lesson (part_of), sentence -> block (part_of),
                  adjacent blocks (before), same-section blocks (related_to).

Usage:
    ./blog/tools/factcheck/extract_statements.py blog/          # write
    ./blog/tools/factcheck/extract_statements.py blog/ --check  # CI gate
"""

from __future__ import annotations

import argparse
import html as _html
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from facts_lib import canon_subject, lesson_files, save_json, strip_html_tags  # noqa: E402

HEADING_RE = re.compile(r"^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$")
LIST_RE = re.compile(r"^\s*(?:[-*+]|\d+[.)])\s+")
ABBREV = ("e.g.", "i.e.", "et al.", "Fig.", "fig.", "Dr.", "St.", "vs.", "cf.", "No.", "approx.")
NO_PROSE = {"search_lib", "knowledge_map"}
CODE_RE = re.compile(r"^\s*(?:\$|\{|\}|if\b|while\b|for\b|function\b|return\b|echo\b|class\b|const\b|let\b|var\b|import\b|from\b|def\b|//|/\*|\*)")
ATTR_RE = re.compile(r"^(?:value|placeholder|class|id|type|name|data-|aria-|style)=")
HTML_INPUT_RE = re.compile(r"^<(?:input|button|select|option|label|textarea|form)\b", re.I)


def _split_sentences(text: str) -> list[str]:
    protected = text
    for abbrev in ABBREV:
        protected = protected.replace(abbrev, abbrev.replace(".", "\u2024"))
    parts = re.split(r"(?<=[.!?])\s+", protected)
    out = []
    for part in parts:
        part = part.replace("\u2024", ".").strip()
        part = re.sub(r"\s+", " ", part)
        if len(part) < 25 or not re.search(r"[A-Za-zÄÖÜäöüß]", part):
            continue
        out.append(part)
    return out


def prose_blocks(text: str):
    """Yield (section, kind, quote) for every non-empty prose block."""
    text = re.sub(r"<\?php.*?\?>", " ", text, flags=re.S)
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.S)
    text = re.sub(r"<script.*?</script>|<style.*?</style>|<pre.*?</pre>|<code.*?</code>",
                  " ", text, flags=re.S | re.I)
    text = re.sub(r"\$\$.*?\$\$", " ", text, flags=re.S)

    section = ""
    in_code = False
    buffer: list[str] = []

    def flush():
        nonlocal buffer
        if buffer:
            quote = re.sub(r"\s+", " ", " ".join(buffer)).strip()
            if quote:
                yield section, "paragraph", quote
            buffer = []

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if line.startswith("```") or line.startswith("~~~"):
            in_code = not in_code
            continue
        if in_code:
            continue
        line = _html.unescape(line)
        line = strip_html_tags(line)
        line = re.sub(r"\s+", " ", line).strip()
        if not line:
            yield from flush()
            continue
        if CODE_RE.match(line) or ATTR_RE.match(line) or HTML_INPUT_RE.match(line):
            continue
        if re.search(r"\$[A-Za-z_]|strpos\(|preg_match\(|=>|->|<\?", line):
            continue
        if re.search(r"<[A-Za-z/]|on[a-z]+=|(?:class|id|style|value|placeholder)=", line):
            continue
        if re.match(r"^\|?\s*:?-{3,}", line):
            continue
        heading = HEADING_RE.match(line)
        if heading:
            yield from flush()
            section = re.sub(r"\s+", " ", heading.group(1)).strip()
            yield section, "heading", section
            continue
        kind = "list-item" if LIST_RE.match(line) else ("table-row" if line.startswith("|") else "paragraph")
        if kind in {"list-item", "table-row"}:
            yield from flush()
            yield section, kind, line
        else:
            buffer.append(line)
    yield from flush()


def build(slug: str, path: Path) -> tuple[list[dict], list[dict]]:
    blocks: list[dict] = []
    statements: list[dict] = []
    seen_blocks = set()
    seen_statements = set()
    for section, kind, quote in prose_blocks(path.read_text(encoding="utf-8")):
        if not quote or quote in seen_blocks:
            continue
        seen_blocks.add(quote)
        block_id = f"{slug}-block-{len(blocks) + 1}"
        blocks.append({"id": block_id, "quote": quote, "kind": kind, "section": section})
        if kind == "heading":
            continue
        for sentence in _split_sentences(quote):
            if sentence in seen_statements:
                continue
            seen_statements.add(sentence)
            statements.append({
                "id": f"{slug}-stmt-{len(statements) + 1}",
                "quote": sentence,
                "block_id": block_id,
                "section": section,
                "kind": "statement",
            })
    return blocks, statements


def structural_edges(slug: str, blocks: list[dict], statements: list[dict]) -> list[tuple[str, str, str]]:
    lesson = canon_subject(slug)
    edges: list[tuple[str, str, str]] = []
    section_anchor: dict[str, str] = {}
    previous = None
    for block in blocks:
        edges.append((block["id"], lesson, "part_of"))
        if previous:
            edges.append((previous, block["id"], "before"))
        previous = block["id"]
        anchor = section_anchor.setdefault(block["section"], block["id"])
        if anchor != block["id"]:
            edges.append((block["id"], anchor, "related_to"))
    for statement in statements:
        edges.append((statement["id"], statement["block_id"], "part_of"))
    return edges


def sync_relations(document: dict, slug: str, blocks: list[dict], statements: list[dict]) -> None:
    relations = [
        r for r in document.get("relations", [])
        if not (str(r.get("from", "")).startswith(f"{slug}-block-")
                or str(r.get("from", "")).startswith(f"{slug}-stmt-")
                or str(r.get("to", "")).startswith(f"{slug}-block-")
                or str(r.get("to", "")).startswith(f"{slug}-stmt-"))
    ]
    seen = {(r.get("from"), r.get("to"), r.get("kind")) for r in relations}
    for src, dst, kind in structural_edges(slug, blocks, statements):
        if (src, dst, kind) in seen:
            continue
        seen.add((src, dst, kind))
        relations.append({
            "id": f"struct-{src}-{kind}-{dst}",
            "from": src,
            "to": dst,
            "kind": kind,
            "qualifiers": {},
            "quote": "",
            "citation_keys": [],
            "confidence": "provenance",
        })
    document["relations"] = relations


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("blog", nargs="?", default="blog")
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--only", help="comma-separated lesson slugs")
    args = parser.parse_args()
    blog = Path(args.blog)
    lessons = lesson_files(blog)
    if args.only:
        wanted = {x.strip() for x in args.only.split(",") if x.strip()}
        lessons = {k: v for k, v in lessons.items() if k in wanted}
    stale = []
    total_blocks = total_statements = 0
    for slug, path in sorted(lessons.items()):
        fact_path = blog / "facts" / f"{slug}.facts.json"
        if not fact_path.exists():
            stale.append(f"{slug}: missing fact file")
            continue
        document = json.loads(fact_path.read_text(encoding="utf-8"))
        if slug in NO_PROSE:
            blocks, statements = [], []
        else:
            blocks, statements = build(slug, path)
        total_blocks += len(blocks)
        total_statements += len(statements)
        current_blocks = document.get("blocks", [])
        current_statements = document.get("statements", [])
        blocks_ok = [b.get("quote") for b in current_blocks] == [b["quote"] for b in blocks]
        statements_ok = [s.get("quote") for s in current_statements] == [s["quote"] for s in statements]
        expected_edges = set(structural_edges(slug, blocks, statements))
        actual_edges = {(r.get("from"), r.get("to"), r.get("kind")) for r in document.get("relations", [])}
        relations_ok = expected_edges <= actual_edges
        if not (blocks_ok and statements_ok and relations_ok):
            stale.append(
                f"{slug}: ledger out of date "
                f"(blocks={len(current_blocks)}/{len(blocks)}, "
                f"statements={len(current_statements)}/{len(statements)}, "
                f"relations_ok={relations_ok})"
            )
            if not args.check:
                document["blocks"] = blocks
                document["statements"] = statements
                sync_relations(document, slug, blocks, statements)
                save_json(fact_path, document)
    if args.check:
        if stale:
            print(f"[FAIL] block/statement ledger: {len(stale)} file(s) stale")
            for item in stale[:40]:
                print(f"  ✗ {item}")
            sys.exit(1)
        print(f"[PASS] block/statement ledger: {len(lessons)} lessons, "
              f"{total_blocks} blocks, {total_statements} statements")
    else:
        print(f"[OK] block/statement ledger: {len(lessons)} lessons, "
              f"{total_blocks} blocks, {total_statements} statements")


if __name__ == "__main__":
    main()
