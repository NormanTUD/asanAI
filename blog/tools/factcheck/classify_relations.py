#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Mark relations as inferred when their quote does not mention both ends.

Text-grounded relations keep `confidence: stated`; relations derived from
claims or graph structure become `confidence: inferred`. The deep audit only
requires endpoint grounding for `stated` relations.

Run:
    uv run blog/tools/factcheck/classify_relations.py blog/
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from facts_lib import fact_files  # noqa: E402


def tokens(ref: str) -> list[str]:
    ref = ref.replace("-", " ").replace("_", " ").lower()
    ref = re.sub(r"[^a-z0-9 ]+", " ", ref)
    return [t for t in ref.split() if len(t) >= 3]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("blog", nargs="?", default="blog")
    args = parser.parse_args()
    marked = 0
    for path in fact_files(Path(args.blog)).values():
        document = json.loads(path.read_text(encoding="utf-8"))
        changed = False
        for rel in document.get("relations", []):
            if rel.get("confidence") == "provenance":
                continue
            quote = str(rel.get("quote", "")).lower()
            if not quote:
                rel["confidence"] = "inferred"
                changed = True
                continue
            missing = False
            for side in ("from", "to"):
                ref = str(rel.get(side, ""))
                candidates = tokens(ref)
                if candidates and not any(token in quote for token in candidates):
                    missing = True
            if missing and rel.get("confidence") != "inferred":
                rel["confidence"] = "inferred"
                changed = True
                marked += 1
        if changed:
            path.write_text(json.dumps(document, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"[OK] marked {marked} relation(s) as inferred")


if __name__ == "__main__":
    main()
