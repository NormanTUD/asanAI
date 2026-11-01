#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Derive relations from explicit claim predicates.

Many claims already encode a relation:
    {"subject": "euclid", "predicate": "work", "value": "Elements"}
This tool turns such claims into edges when the object matches another
subject id in the ledger.  It is deterministic and conservative: it only
connects exact/normalised subject aliases, never invents endpoints.

Run:
    uv run blog/tools/factcheck/derive_relations.py blog/ [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from facts_lib import (  # noqa: E402
    SUBJECT_ALIASES,
    fact_files,
    load_fact_file,
    save_json,
)

RELATION_PREDICATES = {
    "work": "wrote", "wrote": "wrote", "author": "wrote", "authored": "wrote",
    "invention": "invented", "invented": "invented", "created": "invented",
    "designed": "invented", "developed": "invented", "built": "invented",
    "founded": "founded", "founder": "founded",
    "discovered": "discovered", "discovery": "discovered",
    "part_of": "part_of", "member_of": "part_of",
    "same_as": "same_as", "alias_of": "same_as", "also_known_as": "same_as",
    "influenced": "influenced", "inspired": "influenced", "shaped": "influenced",
    "derived_from": "derived_from", "based_on": "derived_from",
    "uses": "uses", "used": "uses",
    "located_in": "located_in",
    "caused": "caused", "led_to": "caused",
}


def norm(text: str) -> str:
    text = str(text).lower().replace("-", " ").replace("_", " ")
    text = re.sub(r"[^a-z0-9.+/ ]+", "", text)
    return re.sub(r"\s+", " ", text).strip()


def aliases_for(subject: str) -> set[str]:
    aliases = {subject, subject.replace("-", " "), subject.replace("-", " ").title()}
    for alias, canon in SUBJECT_ALIASES.items():
        if canon == subject:
            aliases.add(alias)
    return {norm(a) for a in aliases if a}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("blog", nargs="?", default="blog")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    blog = Path(args.blog)

    paths = fact_files(blog)
    documents: dict[str, dict] = {}
    claims_by_file: dict[str, list[dict]] = {}
    all_subjects: set[str] = set()
    for slug, path in sorted(paths.items()):
        document, claims = load_fact_file(path)
        documents[slug] = document
        claims_by_file[slug] = claims
        all_subjects.update(c["subject"] for c in claims)

    alias_to_subject: dict[str, str] = {}
    for subject in all_subjects:
        for alias in aliases_for(subject):
            if len(alias) >= 4:
                alias_to_subject.setdefault(alias, subject)

    # One compiled alternation is much faster than scanning every alias for
    # every claim (the ledger has thousands of subjects).
    aliases_sorted = sorted(alias_to_subject, key=len, reverse=True)
    alias_re = re.compile("|".join(re.escape(a) for a in aliases_sorted)) if aliases_sorted else None

    added = 0
    for slug, claims in claims_by_file.items():
        document = documents[slug]
        existing = document.setdefault("relations", [])
        seen_edges = {(r.get("from"), r.get("to"), r.get("kind")) for r in existing}
        for claim in claims:
            kind = RELATION_PREDICATES.get(claim["predicate"])
            if not kind:
                continue
            value = claim["value"]
            if not isinstance(value, str) or not value.strip():
                continue
            value_norm = norm(value)
            if alias_re is None:
                continue
            candidates = {
                alias_to_subject[m.group(0)]
                for m in alias_re.finditer(value_norm)
                if alias_to_subject.get(m.group(0)) != claim["subject"]
            }
            if not candidates:
                continue
            # If several subjects match, choose the longest matching alias
            # (e.g. "alan turing" over "turing"); ties are ambiguous.
            lengths = defaultdict(list)
            for m in alias_re.finditer(value_norm):
                subject = alias_to_subject.get(m.group(0))
                if subject and subject != claim["subject"]:
                    lengths[len(m.group(0))].append(subject)
            longest = max(lengths) if lengths else 0
            best = set(lengths.get(longest, []))
            if len(best) != 1:
                continue
            target = next(iter(best))
            edge = (claim["subject"], target, kind)
            if edge in seen_edges:
                continue
            seen_edges.add(edge)
            existing.append({
                "id": f"derived-{claim['subject']}-{kind}-{target}",
                "from": claim["subject"],
                "to": target,
                "kind": kind,
                "qualifiers": {},
                "quote": claim.get("quote", ""),
                "citation_keys": claim.get("citation_keys", []),
                "confidence": "inferred",
            })
            added += 1

    if args.dry_run:
        print(f"[dry-run] would add {added} derived relation(s)")
        return
    for slug, document in documents.items():
        save_json(paths[slug], document)
    print(f"[OK] added {added} derived relation(s)")


if __name__ == "__main__":
    main()
