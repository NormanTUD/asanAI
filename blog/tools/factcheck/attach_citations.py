#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Attach nearby citation keys to specific claims that lack them.

For a claim without `citation_keys`, find its exact quote in the lesson and
take `\\cite…{key}` macros in the following 600 characters (same paragraph).
This is deterministic provenance repair, not source interpretation.

Run:
    uv run blog/tools/factcheck/attach_citations.py blog/
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from facts_lib import fact_files, load_fact_file, save_json  # noqa: E402

CITE_RE = re.compile(r"\\cite[a-zA-Z]*\s*(?:\[[^\]]*\])?\{([^}]*)\}")
SPECIFIC = {
    "parameters", "layers", "context_window", "training_tokens", "year",
    "memory", "tflops", "d_model", "heads", "accuracy", "price",
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("blog", nargs="?", default="blog")
    args = parser.parse_args()
    blog = Path(args.blog)
    added = 0
    for slug, path in sorted(fact_files(blog).items()):
        if slug.startswith("_"):
            continue
        document, claims = load_fact_file(path)
        source_path = blog / f"{slug}.php"
        if not source_path.exists():
            continue
        raw = source_path.read_text(encoding="utf-8", errors="replace")
        changed = False
        for claim in document.get("claims", []):
            if claim.get("citation_keys") or claim.get("source_url"):
                continue
            if claim.get("predicate") not in SPECIFIC and not str(claim.get("predicate", "")).endswith("_year"):
                continue
            quote = claim.get("quote", "")
            if not quote:
                continue
            pos = raw.find(quote)
            if pos < 0:
                continue
            keys = []
            for match in CITE_RE.finditer(raw[pos: pos + 600]):
                for key in (part.strip() for part in match.group(1).split(",")):
                    if key and key not in keys:
                        keys.append(key)
            if keys:
                claim["citation_keys"] = keys
                changed = True
                added += 1
        if changed:
            save_json(path, document)
    print(f"[OK] attached citations to {added} claim(s)")


if __name__ == "__main__":
    main()
