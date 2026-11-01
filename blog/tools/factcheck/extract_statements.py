# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Protocol every prose statement/sentence in each lesson.

Structured ``claims`` capture checkable facts.  ``statements`` capture the
full prose: every sentence is stored verbatim (normalised whitespace) with a
stable id and the surrounding heading.  This makes the “every claim is
protocolled” promise deterministic and reviewable.

Usage:
    uv run blog/tools/factcheck/extract_statements.py blog/          # write
    uv run blog/tools/factcheck/extract_statements.py blog/ --check  # CI gate
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from facts_lib import lesson_files, normalize_source, save_json, strip_html_tags  # noqa: E402

HEADING_RE = re.compile(r"^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$")
SKIP_LINE_RE = re.compile(r"^\s*(?:\||:?-{3,}|```|~~~|\{\{|\}\}|</?[a-zA-Z])")
ABBREV = ("e.g.", "i.e.", "et al.", "Fig.", "fig.", "Dr.", "St.", "vs.", "cf.", "No.", "approx.")


def sentences(text: str) -> list[tuple[str, str]]:
    """Return (section, sentence) pairs from a lesson's prose."""
    import html as _html

    text = re.sub(r"<\?php.*?\?>", " ", text, flags=re.S)
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.S)
    text = re.sub(r"<script.*?</script>|<style.*?</style>|<pre.*?</pre>|<code.*?</code>",
                  " ", text, flags=re.S | re.I)
    # Only prose blocks: <div class="…md…"> and <figcaption class="…md…">.
    blocks = re.findall(
        r'<(?:div|figcaption)[^>]*class="[^"]*\bmd\b[^"]*"[^>]*>(.*?)</(?:div|figcaption)>',
        text, flags=re.S | re.I,
    )
    if not blocks:
        return []
    text = "\n".join(blocks)
    text = re.sub(r"\$\$.*?\$\$", " ", text, flags=re.S)

    out: list[tuple[str, str]] = []
    section = ""
    in_code = False
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
            continue
        heading = HEADING_RE.match(line)
        if heading:
            section = re.sub(r"\s+", " ", heading.group(1)).strip()
            continue
        if re.match(r"^\|?\s*:?-{3,}", line):
            continue
        protected = line
        for abbrev in ABBREV:
            protected = protected.replace(abbrev, abbrev.replace(".", "\u2024"))
        parts = re.split(r"(?<=[.!?])\s+", protected)
        for part in parts:
            part = part.replace("\u2024", ".")
            part = re.sub(r"\s+", " ", part).strip()
            if len(part) < 25:
                continue
            if not re.search(r"[A-Za-zÄÖÜäöüß]", part):
                continue
            out.append((section, part))
    seen = set()
    unique = []
    for section, sentence in out:
        if sentence in seen:
            continue
        seen.add(sentence)
        unique.append((section, sentence))
    return unique


def build(slug: str, path: Path) -> list[dict]:
    rows = []
    for index, (section, sentence) in enumerate(sentences(path.read_text(encoding="utf-8")), 1):
        rows.append({
            "id": f"{slug}-stmt-{index}",
            "quote": sentence,
            "section": section,
            "kind": "statement",
        })
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("blog", nargs="?", default="blog")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    blog = Path(args.blog)
    lessons = lesson_files(blog)
    stale = []
    total = 0
    for slug, path in sorted(lessons.items()):
        fact_path = blog / "facts" / f"{slug}.facts.json"
        if not fact_path.exists():
            stale.append(f"{slug}: missing fact file")
            continue
        document = json.loads(fact_path.read_text(encoding="utf-8"))
        expected = build(slug, path)
        current = document.get("statements", [])
        total += len(expected)
        if [s.get("quote") for s in current] != [s["quote"] for s in expected]:
            stale.append(f"{slug}: statements out of date ({len(current)} stored, {len(expected)} expected)")
            if not args.check:
                document["statements"] = expected
                save_json(fact_path, document)
    if args.check:
        if stale:
            print(f"[FAIL] statement ledger: {len(stale)} file(s) stale")
            for item in stale[:40]:
                print(f"  ✗ {item}")
            sys.exit(1)
        print(f"[PASS] statement ledger: {len(lessons)} lessons, {total} statements")
    else:
        print(f"[OK] statement ledger: {len(lessons)} lessons, {total} statements")


if __name__ == "__main__":
    main()
