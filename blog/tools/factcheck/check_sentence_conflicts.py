# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Report contradictions as sentence pairs.

Uses the same deterministic claim grouping as ``check_facts.py`` but prints the
anchoring quotes instead of internal claim ids:

    sentence "..." (a.php) contradicts sentence "..." (b.php)
      because subject=gpt-3 predicate=parameters has 1.75e11 vs 1.7e11

Only functional predicates are compared; statements themselves are the
provenance layer. Explicit `contradicts` relations are reported too.

Run:
    uv run blog/tools/factcheck/check_sentence_conflicts.py blog/ [--strict]
"""

from __future__ import annotations

import argparse
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from check_facts import _clusters, _lesson_of  # noqa: E402
from facts_lib import (  # noqa: E402
    fact_files,
    is_functional,
    load_fact_file,
    relation_normalized,
    iter_relations,
    scope_key,
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("blog", nargs="?", default="blog")
    parser.add_argument("--strict", action="store_true",
                        help="exit 1 on factual claim contradictions")
    parser.add_argument("--include-relations", action="store_true",
                        help="also print explicit contradicts relations")
    parser.add_argument("--strict-relations", action="store_true",
                        help="exit 1 if explicit contradicts relations are present")
    args = parser.parse_args()
    blog = Path(args.blog)

    groups: dict[tuple[str, str, str], list[dict]] = defaultdict(list)
    relation_conflicts: list[str] = []
    quote_by_subject: dict[str, tuple[str, str]] = {}
    for path in sorted(fact_files(blog).values()):
        document, claims = load_fact_file(path)
        for claim in claims:
            claim["source"] = path.name
            if claim.get("quote") and claim["subject"] not in quote_by_subject:
                quote_by_subject[claim["subject"]] = (claim["quote"], _lesson_of(claim))
            if is_functional(claim):
                groups[(claim["subject"], claim["predicate"], scope_key(claim))].append(claim)
        for raw in iter_relations(document):
            rel = relation_normalized(raw)
            if rel and rel["kind"] == "contradicts":
                rel["source"] = path.name
                lesson = rel["source"][: -len(".facts.json")] + ".php"
                fq = quote_by_subject.get(rel["from"], (rel["from"], lesson))
                tq = quote_by_subject.get(rel["to"], (rel["to"], lesson))
                relation_conflicts.append(
                    f"sentence {fq[0]!r} ({fq[1]}) contradicts sentence {tq[0]!r} ({tq[1]})\n"
                    f"  because explicit relation {rel['id']!r} in {lesson} ({rel['from']} -> {rel['to']})"
                )

    pairs: list[str] = []
    for (subject, predicate, scope), claims in sorted(groups.items()):
        clusters = _clusters(claims)
        if len(clusters) < 2:
            continue
        for i in range(len(clusters)):
            for j in range(i + 1, len(clusters)):
                a, b = clusters[i][0], clusters[j][0]
                pairs.append(
                    f"sentence {a.get('quote', '')!r} ({_lesson_of(a)}) contradicts "
                    f"sentence {b.get('quote', '')!r} ({_lesson_of(b)})\n"
                    f"  because subject={subject} predicate={predicate} "
                    f"has {a['value']!r} {a['unit']} vs {b['value']!r} {b['unit']}"
                )

    output = []
    if not pairs:
        output.append("[PASS] no sentence-level factual contradictions found")
    else:
        output.append("=" * 72)
        output.append("SENTENCE CONTRADICTIONS — incompatible factual claims")
        output.append("=" * 72)
        output.extend(pairs)
    if relation_conflicts and args.include_relations:
        output.append("")
        output.append("=" * 72)
        output.append("EXPLICIT CONTRADICTS RELATIONS — historical/intellectual opposition")
        output.append("=" * 72)
        output.extend(relation_conflicts)
    print("\n\n".join(output))
    all_pairs = pairs + (relation_conflicts if args.include_relations else [])
    if all_pairs:
        (blog / "facts" / "CONFLICTS.md").write_text(
            "# Sentence contradictions\n\n" + "\n\n".join(all_pairs) + "\n",
            encoding="utf-8",
        )
        print(f"\n({len(pairs)} factual pair(s), {len(relation_conflicts)} explicit relation(s); "
              f"also written to {blog / 'facts' / 'CONFLICTS.md'})")
    if args.strict and pairs:
        sys.exit(1)
    if args.strict_relations and relation_conflicts:
        sys.exit(1)


if __name__ == "__main__":
    main()
