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
from facts_lib import canon_ref, canon_subject, fact_files, load_fact_file, save_json  # noqa: E402

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
        seen = {(canon_ref(r.get("from")), canon_ref(r.get("to")), r.get("kind")) for r in relations}
        added = 0
        # Lesson -> part -> course provenance backbone.
        lesson = canon_subject(slug)
        part_claim = next(
            (c for c in claims if c["subject"] == lesson and c["predicate"] == "part"),
            None,
        )
        part_num = None
        if part_claim is not None:
            try:
                part_num = int(float(part_claim["value"]))
            except (TypeError, ValueError):
                part_num = None
        if part_num is not None and 1 <= part_num <= 6:
            edge = (canon_ref(lesson), canon_ref(f"part-{part_num}"), "part_of")
            if edge not in seen:
                seen.add(edge)
                relations.append({
                    "id": f"prov-{slug}-part",
                    "from": lesson,
                    "to": f"part-{part_num}",
                    "kind": "part_of",
                    "qualifiers": {},
                    "quote": part_claim.get("quote", ""),
                    "citation_keys": [],
                    "confidence": "provenance",
                })
                added += 1

        for claim in claims:
            subject = claim["subject"]
            if subject == lesson or claim["predicate"] in METADATA_PREDICATES:
                continue
            edge = (canon_ref(subject), canon_ref(lesson), "mentioned_in")
            if edge in seen:
                continue
            seen.add(edge)
            relations.append({
                "id": f"prov-{slug}-{subject}",
                "from": subject,
                "to": lesson,
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
