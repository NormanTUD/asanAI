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
    ACYCLIC_KINDS,
    KNOWN_RELATION_KINDS,
    claim_normalized,
    fact_files,
    is_functional,
    iter_claims,
    iter_relations,
    lesson_files,
    load_fact_file,
    relation_normalized,
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


def _clusters(claims: list[dict]) -> list[list[dict]]:
    clusters: list[list[dict]] = []
    approximate = any("approx" in c["qualifiers"] for c in claims)
    for claim in claims:
        for cluster in clusters:
            if _same_value(claim, cluster[0], approximate=approximate):
                cluster.append(claim)
                break
        else:
            clusters.append([claim])
    return clusters


def _has_cycle(edges: list[tuple[str, str]]) -> str | None:
    graph: dict[str, list[str]] = defaultdict(list)
    for src, dst in edges:
        graph[src].append(dst)
    state: dict[str, int] = {}

    def visit(node: str) -> str | None:
        state[node] = 1
        for nxt in graph.get(node, []):
            if state.get(nxt) == 1:
                return f"{node} -> {nxt}"
            if state.get(nxt, 0) == 0:
                found = visit(nxt)
                if found:
                    return found
        state[node] = 2
        return None

    for node in list(graph):
        if state.get(node, 0) == 0:
            found = visit(node)
            if found:
                return found
    return None


def check(blog: Path, coverage: bool = True, verbose: bool = False,
          strict_relations: bool = False, strict_temporal: bool = False):
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
    all_claims: list[dict] = []
    relations: list[dict] = []
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
        for raw_rel in iter_relations(document):
            rel = relation_normalized(raw_rel)
            if rel is None:
                errors.append(f"{path}: relation missing from/to/kind: {raw_rel!r}")
                continue
            rel["source"] = path.name
            relations.append(rel)
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
            all_claims.append(claim)
            if is_functional(claim):
                groups[(claim["subject"], claim["predicate"], scope_key(claim))].append(claim)

    for (subject, predicate, scope), claim_group in sorted(groups.items()):
        clusters = _clusters(claim_group)
        if len(clusters) > 1:
            lines = [f"conflict: {subject} {predicate} scope={scope}"]
            for cluster in clusters:
                lines.append("  value: " + " | ".join(
                    f"{c['value']!r} {c['unit']} @ "
                    f"{c.get('source', '?')} — {_describe(c)}"
                    for c in cluster
                ))
            conflicts.append("\n".join(lines))

    # ---- relations: endpoints, cycles, temporal and same_as compatibility ----
    fact_ids = {c["id"]: c for c in all_claims if c.get("id")}
    subject_ids = {c["subject"] for c in all_claims}

    def ref_subject(ref: str) -> str:
        return fact_ids[ref]["subject"] if ref in fact_ids else ref

    seen_relation_ids: set[str] = set()
    seen_edges: set[tuple[str, str, str]] = set()
    relation_warnings: list[str] = []
    for rel in relations:
        if not rel["id"]:
            errors.append(f"{rel['source']}: relation without id ({rel['kind']} {rel['from']} -> {rel['to']})")
        elif rel["id"] in seen_relation_ids:
            errors.append(f"{rel['source']}: duplicate relation id {rel['id']!r}")
        else:
            seen_relation_ids.add(rel["id"])
        edge = (rel["from"], rel["to"], rel["kind"])
        if edge in seen_edges:
            relation_warnings.append(
                f"{rel['source']}: duplicate relation edge {rel['from']} -[{rel['kind']}]-> {rel['to']}"
            )
        else:
            seen_edges.add(edge)
        if rel["kind"] not in KNOWN_RELATION_KINDS:
            errors.append(
                f"{rel['source']}: unknown relation kind {rel['kind']!r} "
                f"(use one of {', '.join(sorted(KNOWN_RELATION_KINDS))})"
            )
        for endpoint in (rel["from"], rel["to"]):
            if endpoint not in fact_ids and endpoint not in subject_ids:
                errors.append(
                    f"{rel['source']}: relation {rel['id'] or rel['kind']} endpoint "
                    f"{endpoint!r} is neither a fact id nor a subject id"
                )
        if rel["from"] == rel["to"] and rel["kind"] != "same_as":
            errors.append(f"{rel['source']}: self-loop relation {rel['id'] or rel['kind']}")

    # Relation coverage: which non-metadata subjects are isolated?
    relation_subjects: set[str] = set()
    for rel in relations:
        for endpoint in (rel["from"], rel["to"]):
            if endpoint in fact_ids:
                relation_subjects.add(fact_ids[endpoint]["subject"])
            elif endpoint in subject_ids:
                relation_subjects.add(endpoint)
    claim_subjects = {
        c["subject"] for c in all_claims
        if c["predicate"] not in {"title", "part", "order"}
    }
    isolated = sorted(claim_subjects - relation_subjects)
    if isolated:
        print(f"[relations] {len(isolated)} isolated subject(s) without any relation:")
        for subject in isolated[:40]:
            print(f"  - {subject}")
        if len(isolated) > 40:
            print(f"  … and {len(isolated) - 40} more")
        if strict_relations:
            errors.append(f"{len(isolated)} subject(s) have no relation at all")

    edges_by_kind: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for rel in relations:
        if rel["from"] in fact_ids or rel["from"] in subject_ids:
            if rel["to"] in fact_ids or rel["to"] in subject_ids:
                edges_by_kind[rel["kind"]].append((rel["from"], rel["to"]))

    for kind in sorted(ACYCLIC_KINDS & set(edges_by_kind)):
        cycle = _has_cycle(edges_by_kind[kind])
        if cycle:
            conflicts.append(f"relation cycle ({kind}): {cycle}")

    # same_as merges subject identities; claims then have to agree on overlaps.
    parent: dict[str, str] = {}

    def find(node: str) -> str:
        parent.setdefault(node, node)
        while parent[node] != node:
            parent[node] = parent[parent[node]]
            node = parent[node]
        return node

    def union(a: str, b: str) -> None:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra

    for rel in relations:
        if rel["kind"] == "same_as":
            union(ref_subject(rel["from"]), ref_subject(rel["to"]))

    merged: dict[tuple[str, str, str], list[dict]] = defaultdict(list)
    for claim in all_claims:
        if is_functional(claim):
            merged[(find(claim["subject"]), claim["predicate"], scope_key(claim))].append(claim)
    for (root, predicate, scope), claim_group in sorted(merged.items()):
        clusters = _clusters(claim_group)
        if len(clusters) > 1:
            lines = [f"conflict after same_as merge: {root} {predicate} scope={scope}"]
            for cluster in clusters:
                lines.append("  value: " + " | ".join(
                    f"{c['value']!r} {c['unit']} @ "
                    f"{c.get('source', '?')} — {_describe(c)}"
                    for c in cluster
                ))
            conflicts.append("\n".join(lines))

    year_claims_by_ref: dict[str, list[dict]] = defaultdict(list)
    for claim in all_claims:
        if claim["predicate"] == "year" and isinstance(claim["value"], (int, float)):
            year_claims_by_ref[claim["id"]].append(claim)
            year_claims_by_ref[claim["subject"]].append(claim)

    def year_values(ref: str) -> list[float]:
        return [float(c["value"]) for c in year_claims_by_ref.get(ref, [])]

    def event_qualified(ref: str) -> bool:
        return any({"event", "at", "definition"} & set(c["qualifiers"])
                   for c in year_claims_by_ref.get(ref, []))

    def family_year(ref: str) -> bool:
        return any(str(c["qualifiers"].get("family", "")).lower() == "true"
                   for c in year_claims_by_ref.get(ref, []))

    temporal_warnings: list[str] = []
    for kind in ("before", "influenced", "caused", "derived_from"):
        for rel in relations:
            if rel["kind"] != kind:
                continue
            from_years = year_values(rel["from"])
            to_years = year_values(rel["to"])
            if not from_years or not to_years:
                continue
            if family_year(rel["from"]) or family_year(rel["to"]):
                # A family's first-release year is not an upper bound; later
                # members can be influenced by later work.
                continue
            if kind == "derived_from":
                bad = min(to_years) > max(from_years)
                detail = f"{rel['to']} ({min(to_years):g}) later than {rel['from']} ({max(from_years):g})"
            else:
                bad = min(from_years) > max(to_years)
                detail = f"{rel['from']} ({min(from_years):g}) later than {rel['to']} ({max(to_years):g})"
            if not bad:
                continue
            message = f"temporal conflict ({kind}): {detail} in {rel['source']}"
            if kind in {"influenced", "derived_from"} and not (
                event_qualified(rel["from"]) and event_qualified(rel["to"])
            ):
                temporal_warnings.append(message + " [no event-qualified year; warning]")
            else:
                conflicts.append(message)

    if relation_warnings:
        print("=" * 72)
        print("RELATION WARNINGS")
        print("=" * 72)
        for warning in relation_warnings:
            print(f"  ! {warning}")
    if temporal_warnings:
        print("=" * 72)
        print("TEMPORAL WARNINGS (non-blocking unless --strict-temporal)")
        print("=" * 72)
        for warning in temporal_warnings:
            print(f"  ! {warning}")
    if conflicts:
        print("=" * 72)
        print("FACT CONFLICTS")
        print("=" * 72)
        for conflict in conflicts:
            print(conflict)
            print()
    if strict_temporal and temporal_warnings:
        errors.extend(temporal_warnings)
    if strict_relations and relation_warnings:
        errors.extend(relation_warnings)
    if errors:
        print("=" * 72)
        print("FACT LEDGER ERRORS")
        print("=" * 72)
        for error in errors:
            print(f"  ✗ {error}")

    print(
        f"[{'FAIL' if (errors or conflicts) else 'PASS'}] "
        f"{len(facts)} fact files, {len(all_claims)} claims, {len(relations)} relations, "
        f"{len(isolated)} isolated subject(s), "
        f"{len(conflicts)} conflict(s), {len(errors)} error(s)"
    )
    return 1 if (errors or conflicts) else 0


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("blog", nargs="?", default="blog", help="blog directory")
    parser.add_argument("--no-coverage", action="store_true", help="skip the one-file-per-lesson check")
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument("--strict-relations", action="store_true",
                        help="fail if a non-metadata subject has no relation")
    parser.add_argument("--strict-temporal", action="store_true",
                        help="promote temporal warnings to errors")
    args = parser.parse_args()
    sys.exit(check(Path(args.blog), coverage=not args.no_coverage,
                   verbose=args.verbose, strict_relations=args.strict_relations,
                   strict_temporal=args.strict_temporal))


if __name__ == "__main__":
    main()
