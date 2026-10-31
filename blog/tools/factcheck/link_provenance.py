# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Add a provenance backbone to the fact graph.

Every non-metadata claim subject gets a `mentioned_in` edge to its lesson
node (the lesson slug).  This is not a semantic influence claim; it is the
provenance edge that guarantees every fact entry is reachable in traces.

Run:
    uv run blog/tools/factcheck/link_provenance.py blog/
"""

from __future__ import annotations

import argparse
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from facts_lib import fact_files, load_fact_file, save_json  # noqa: E402

METADATA_PREDICATES = {"title", "part", "order"}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("blog", nargs="?", default="blog")
    args = parser.parse_args()
    blog = Path(args.blog)

    total = 0
    for slug, path in sorted(fact_files(blog).items()):
        document, claims = load_fact_file(path)
        relations = document.setdefault("relations", [])
        seen = {(r.get("from"), r.get("to"), r.get("kind")) for r in relations}
        added = 0
        for claim in claims:
            subject = claim["subject"]
            if subject == slug or claim["predicate"] in METADATA_PREDICATES:
                continue
            edge = (subject, slug, "mentioned_in")
            if edge in seen:
                continue
            seen.add(edge)
            relations.append({
                "id": f"prov-{slug}-{subject}",
                "from": subject,
                "to": slug,
                "kind": "mentioned_in",
                "qualifiers": {},
                "quote": claim.get("quote", ""),
                "citation_keys": claim.get("citation_keys", []),
                "confidence": "provenance",
            })
            added += 1
        if added:
            save_json(path, document)
            total += added
    print(f"[OK] added {total} provenance relation(s)")


if __name__ == "__main__":
    main()
