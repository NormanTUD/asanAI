#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Repair the structural block/statement relations without re-parsing prose.

Useful after a relation cleanup: reads ``blocks``/``statements`` from each fact
file and re-adds block -> lesson, statement -> block, adjacent ``before`` and
same-section ``related_to`` edges.

Run:
    ./blog/tools/factcheck/sync_blocks.py blog/
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from extract_statements import sync_relations  # noqa: E402
from facts_lib import fact_files, save_json  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("blog", nargs="?", default="blog")
    args = parser.parse_args()
    blog = Path(args.blog)
    total = 0
    for slug, path in sorted(fact_files(blog).items()):
        document = json.loads(path.read_text(encoding="utf-8"))
        blocks = document.get("blocks", [])
        statements = document.get("statements", [])
        if not blocks and not statements:
            continue
        sync_relations(document, slug, blocks, statements)
        save_json(path, document)
        total += 1
    print(f"[OK] synced structural relations for {total} fact file(s)")


if __name__ == "__main__":
    main()
