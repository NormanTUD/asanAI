# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Check the blog fact ledger for cross-lesson contradictions.

Each lesson has ``blog/facts/<slug>.facts.json``.  This script loads every
fact file, normalises the claims (field aliases, subject/predicate aliases,
units, dates), and reports any two claims that talk about the same
``(subject, predicate, scope)`` with incompatible values.

Usage:
    uv run blog/tools/factcheck/check_facts.py [blog/] [--no-coverage] [--verbose]

Exit code 0 = no conflicts/schema/coverage errors, 1 otherwise.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from facts_lib import (  # noqa: E402
    claim_normalized,
    fact_files,
    iter_claims,
    lesson_files,
    load_fact_file,
    scope_key,
)


def _to_base(value, unit):
    """Convert a numeric claim to a comparable base value/unit."""
    if not isinstance(value, (int, float)):
        return value, unit
    unit_str = str(unit)
    if unit_str in {"1e3", "1e6", "1e9", "1e12"}:
        return float(value) * {"1e3": 1e3, "1e6": 1e6, "1e9": 1e9, "1e12": 1e12}[unit_str], "count"
    if unit_str == "TB":
        return float(value) * 1024.0, "GB"
    if unit_str == "TiB":
        return float(value) * 1099.511627776, "GB"
    if unit_str == "GiB":
        return float(value) * 1.073741824, "GB"
    if unit_str == "MB":
        return float(value) / 1024.0, "GB"
    return float(value), unit_str


def _same_value(a, b, approximate=False):
    av, au = _to_base(a["value"], a["unit"])
    bv, bu = _to_base(b["value"], b["unit"])
    if isinstance(av, (int, float)) and isinstance(bv, (int, float)):
        if au != bu:
            return False
        if approximate or "approx" in a["qualifiers"] or "approx" in b["qualifiers"]:
            scale = max(abs(av), abs(bv), 1.0)
            return abs(av - bv) / scale <= 0.02
        return math.isclose(av, bv, rel_tol=1e-9, abs_tol=1e-12)
    return av == bv and au == bu


def _describe(claim):
    keys = claim.get("citation_keys") or []
    if isinstance(keys, str):
        keys = [keys]
    cite = f" [{' ; '.join(str(k) for k in keys)}]" if keys else ""
    return f"{claim['quote']!r} ({claim['value']!r} {claim['unit']}){cite}"


def check(blog: Path, coverage: bool = True, verbose: bool = False):
    errors: list[str] = []
    conflicts: list[str] = []

    lessons = lesson_files(blog)
    facts = fact_files(blog)

    if coverage:
        for slug in sorted(set(lessons) - set(facts)):
            errors.append(f"missing fact file: blog/facts/{slug}.facts.json")
        for slug in sorted(set(facts) - set(lessons)):
            errors.append(f"orphan fact file: blog/facts/{slug}.facts.json (no lesson {slug}.php)")

    literature_keys = set()
    literature_path = blog / "literature.js"
    if literature_path.exists():
        import re
        literature_keys = set(re.findall(
            r'^\s*"?([A-Za-z0-9_\-]+)"?\s*:\s*\{',
            literature_path.read_text(encoding="utf-8"),
            re.M,
        ))

    groups: dict[tuple[str, str, str], list[dict]] = defaultdict(list)
    for slug, path in sorted(facts.items()):
        try:
            document, claims = load_fact_file(path)
        except Exception as exc:  # noqa: BLE001 - report, do not crash the CI run
            errors.append(f"{path}: cannot parse: {exc}")
            continue
        source = document.get("source") if isinstance(document, dict) else None
        if source and source != f"{slug}.php":
            errors.append(f"{path}: source is {source!r}, expected {slug}.php")
        lesson = document.get("lesson") if isinstance(document, dict) else None
        if lesson and lesson != slug:
            errors.append(f"{path}: lesson is {lesson!r}, expected {slug!r}")
        if literature_keys:
            cited = document.get("citations", []) if isinstance(document, dict) else []
            if isinstance(cited, str):
                cited = [cited]
            for key in cited:
                if key and key not in literature_keys:
                    errors.append(f"{path}: citation not in literature.js: {key}")
        if not claims and verbose:
            print(f"[info] {path}: no claims")
        for raw in iter_claims(document):
            claim = claim_normalized(raw)
            if claim is None:
                errors.append(f"{path}: claim missing subject/predicate/value: {raw!r}")
                continue
            claim["source"] = path.name
            keys = claim.get("citation_keys") or []
            if isinstance(keys, str):
                keys = [keys]
            for key in keys:
                if key and literature_keys and key not in literature_keys:
                    errors.append(f"{path}: claim {claim.get('id', '?')}: citation not in literature.js: {key}")
            groups[(claim["subject"], claim["predicate"], scope_key(claim))].append(claim)

    for (subject, predicate, scope), claims in sorted(groups.items()):
        # Cluster compatible values.
        clusters: list[list[dict]] = []
        approximate = any("approx" in c["qualifiers"] for c in claims)
        for claim in claims:
            for cluster in clusters:
                if _same_value(claim, cluster[0], approximate=approximate):
                    cluster.append(claim)
                    break
            else:
                clusters.append([claim])
        if len(clusters) > 1:
            lines = [
                f"conflict: {subject} {predicate} scope={scope}",
            ]
            for cluster in clusters:
                lines.append("  value: " + " | ".join(
                    f"{c['value']!r} {c['unit']} @ "
                    f"{c.get('source', '?')}:{c.get('line', '?')} — {_describe(c)}"
                    for c in cluster
                ))
            conflicts.append("\n".join(lines))

    if conflicts:
        print("=" * 72)
        print("FACT CONFLICTS")
        print("=" * 72)
        for conflict in conflicts:
            print(conflict)
            print()
    if errors:
        print("=" * 72)
        print("FACT LEDGER ERRORS")
        print("=" * 72)
        for error in errors:
            print(f"  ✗ {error}")

    print(
        f"[{'FAIL' if (errors or conflicts) else 'PASS'}] "
        f"{len(facts)} fact files, {sum(len(v) for v in groups.values())} claims, "
        f"{len(conflicts)} conflict(s), {len(errors)} error(s)"
    )
    return 1 if (errors or conflicts) else 0


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("blog", nargs="?", default="blog", help="blog directory")
    parser.add_argument("--no-coverage", action="store_true", help="skip the one-file-per-lesson check")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()
    sys.exit(check(Path(args.blog), coverage=not args.no_coverage, verbose=args.verbose))


if __name__ == "__main__":
    main()
