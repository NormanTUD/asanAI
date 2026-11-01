#!/usr/bin/env -S uv run --script
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
import html
import json
import math
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from facts_lib import (  # noqa: E402
    ACYCLIC_KINDS,
    KNOWN_RELATION_KINDS,
    canon_ref,
    canon_subject,
    normalize_source,
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


def _normalize_source(text: str) -> str:
    return normalize_source(text)


def _lesson_of(claim: dict) -> str:
    source = str(claim.get("source", ""))
    return source[: -len(".facts.json")] + ".php" if source.endswith(".facts.json") else source


def _conflict_pair_lines(subject: str, predicate: str, scope: str, clusters: list[list[dict]]) -> list[str]:
    lines = []
    for i in range(len(clusters)):
        for j in range(i + 1, len(clusters)):
            first = clusters[i][0]
            second = clusters[j][0]
            extra_a = f" (+{len(clusters[i]) - 1} more)" if len(clusters[i]) > 1 else ""
            extra_b = f" (+{len(clusters[j]) - 1} more)" if len(clusters[j]) > 1 else ""
            lines.append(
                f"claim {first.get('id', '?')!r} in {_lesson_of(first)}{extra_a} "
                f"contradicts claim {second.get('id', '?')!r} in {_lesson_of(second)}{extra_b} "
                f"— subject={subject} predicate={predicate}"
            )
    return lines


def _format_conflict(subject: str, predicate: str, scope: str, clusters: list[list[dict]]) -> str:
    claims = [c for cluster in clusters for c in cluster]
    first_file = claims[0].get("source", "blog/facts/?")
    lines = [
        "=" * 80,
        "FACT CONFLICT — not globally gluable",
        "-" * 80,
        f"subject:   {subject}",
        f"predicate: {predicate}",
        f"scope:     {scope}",
        "why: two claims describe the same functional fact with incompatible normalized values.",
    ]
    for index, cluster in enumerate(clusters, 1):
        for claim in cluster:
            lines.append(
                f"claim {index}: id={claim.get('id', '?')} file={claim.get('source', '?')} "
                f"value={claim['value']!r} unit={claim['unit']} "
                f"quote={claim.get('quote', '')!r}"
            )
    lines.append(
        "fix: change one value to the verified one, or add a qualifier "
        "(precision, parameter_kind, variant, event, year) / use a versioned "
        "subject id so the scopes are legitimately different. Do not delete "
        "facts, do not add an allowlist, and do not remove qualifiers."
    )
    lines.append(
        "check: uv run blog/tools/factcheck/check_facts.py blog/ "
        "--strict-relations --strict-quotes --require-claims"
    )
    prompt = [
        "Fix this fact-ledger conflict:",
        f"- subject: {subject}",
        f"- predicate: {predicate}",
        f"- scope: {scope}",
    ]
    for index, cluster in enumerate(clusters, 1):
        for claim in cluster:
            prompt.append(
                f"- claim {index}: file={claim.get('source', '?')} id={claim.get('id', '?')} "
                f"value={claim['value']!r} unit={claim['unit']} quote={claim.get('quote', '')!r}"
            )
    prompt.extend([
        "- Why: the claims share the same (subject, predicate, scope) but normalize to different values.",
        "- How: correct the wrong value. If both are legitimate, add a qualifier "
        "(precision/parameter_kind/variant/event/year) or use a versioned subject id. "
        "Never add an allowlist or delete facts.",
        "- Then run: uv run blog/tools/factcheck/check_facts.py blog/ "
        "--strict-relations --strict-quotes --require-claims",
    ])
    lines.append("AI FIX PROMPT (copy the block):")
    lines.append("----- COPY FROM HERE -----")
    lines.extend(prompt)
    lines.append("----- COPY TO HERE -----")
    lines.append(
        f"::error file=blog/facts/{first_file}::FACT_CONFLICT subject={subject} "
        f"predicate={predicate} scope={scope} — see the block above for values and fix"
    )
    return "\n".join(lines)


def check(blog: Path, coverage: bool = True, verbose: bool = False,
          strict_relations: bool = False, strict_temporal: bool = False,
          strict_quotes: bool = False, require_claims: bool = False,
          strict_unregistered: bool = False):
    errors: list[str] = []
    conflicts: list[str] = []
    conflict_pairs: list[str] = []

    lessons = lesson_files(blog)
    facts = fact_files(blog)

    if coverage:
        for slug in sorted(set(lessons) - set(facts)):
            errors.append(f"missing fact file: blog/facts/{slug}.facts.json")
        for slug in sorted(set(facts) - set(lessons)):
            if slug.startswith("_"):
                continue  # structural file (course/part nodes)
            errors.append(f"orphan fact file: blog/facts/{slug}.facts.json (no lesson {slug}.php)")

    literature_keys = set()
    literature_path = blog / "literature.js"
    if literature_path.exists():
        literature_keys = set(re.findall(
            r'^\s*"?([A-Za-z0-9_\-]+)"?\s*:\s*\{',
            literature_path.read_text(encoding="utf-8"),
            re.M,
        ))

    groups: dict[tuple[str, str, str], list[dict]] = defaultdict(list)
    all_claims: list[dict] = []
    relations: list[dict] = []
    quote_warnings: list[str] = []
    statement_count = block_count = 0
    block_ids: set[str] = set()
    statement_ids: set[str] = set()
    statement_block: dict[str, str] = {}
    block_owner: dict[str, str] = {}
    documents: dict[str, dict] = {}
    files_without_claims: list[str] = []
    unregistered: list[str] = []
    seen_claim_ids: set[str] = set()
    source_cache: dict[str, tuple[str, str]] = {}
    for slug, path in sorted(facts.items()):
        try:
            document, claims = load_fact_file(path)
        except Exception as exc:  # noqa: BLE001 - report, do not crash the CI run
            errors.append(f"{path}: cannot parse: {exc}")
            continue
        if not slug.startswith("_"):
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
        source_path = blog / f"{slug}.php"
        if not slug.startswith("_") and source_path.exists():
            raw_source = source_path.read_text(encoding="utf-8", errors="replace")
            source_cache[slug] = (raw_source, _normalize_source(raw_source))
        elif not slug.startswith("_"):
            source_cache[slug] = ("", "")

        def quote_ok(quote: str) -> bool:
            if not quote or slug.startswith("_"):
                return True
            raw_source, norm_source = source_cache.get(slug, ("", ""))
            return quote in raw_source or quote in norm_source or _normalize_source(quote) in norm_source

        documents[slug] = document if isinstance(document, dict) else {}
        seen_block_ids: set[str] = set()
        for block in document.get("blocks", []) if isinstance(document, dict) else []:
            if not isinstance(block, dict):
                errors.append(f"{path}: malformed block entry")
                continue
            bid = block.get("id", "")
            quote = block.get("quote", "")
            block_count += 1
            if not bid:
                errors.append(f"{path}: block without id")
            elif bid in seen_block_ids:
                errors.append(f"{path}: duplicate block id {bid!r}")
            else:
                bid_c = canon_ref(bid)
                seen_block_ids.add(bid_c)
                block_ids.add(bid_c)
                block_owner[bid_c] = slug
            if not quote:
                errors.append(f"{path}: block {bid or '?'} has no quote")
            elif not quote_ok(quote):
                errors.append(f"{path}: block {bid or '?'} quote not found in source")
        seen_statement_ids: set[str] = set()
        for statement in document.get("statements", []) if isinstance(document, dict) else []:
            if not isinstance(statement, dict):
                errors.append(f"{path}: malformed statement entry")
                continue
            sid = statement.get("id", "")
            quote = statement.get("quote", "")
            statement_count += 1
            if not quote:
                errors.append(f"{path}: statement {sid or '?'} has no quote")
            elif not quote_ok(quote):
                errors.append(f"{path}: statement {sid or '?'} quote not found in source")
            block_id = canon_ref(statement.get("block_id", ""))
            if block_id and block_id not in seen_block_ids:
                errors.append(f"{path}: statement {sid or '?'} references unknown block {block_id!r}")
            if sid:
                sid_c = canon_ref(sid)
                if sid_c in seen_statement_ids:
                    errors.append(f"{path}: duplicate statement id {sid!r}")
                seen_statement_ids.add(sid_c)
                statement_ids.add(sid_c)
                statement_block[sid_c] = block_id
        for raw_rel in iter_relations(document):
            if "line" in raw_rel:
                errors.append(f"{path}: relation {raw_rel.get('id', '?')} has a line field; use quote only")
            rel = relation_normalized(raw_rel)
            if rel is None:
                errors.append(f"{path}: relation missing from/to/kind: {raw_rel!r}")
                continue
            rel["source"] = path.name
            if rel["quote"] and rel["kind"] not in {"mentioned_in", "part_of"} and not quote_ok(rel["quote"]):
                quote_warnings.append(f"{path}: relation {rel['id'] or rel['kind']} quote not found in source")
            relations.append(rel)
        if not claims and verbose:
            print(f"[info] {path}: no claims")
        lesson_subject = canon_subject(slug)
        nonmeta = [
            c for c in claims
            if not (c["subject"] == lesson_subject and c["predicate"] in {"title", "part", "order"})
        ]
        if not nonmeta and not slug.startswith("_"):
            files_without_claims.append(slug)

        for raw in iter_claims(document):
            if "line" in raw:
                errors.append(f"{path}: claim {raw.get('id', '?')} has a line field; use quote only")
            claim = claim_normalized(raw)
            if claim is None:
                errors.append(f"{path}: claim missing subject/predicate/value: {raw!r}")
                continue
            claim["source"] = path.name
            if claim.get("id"):
                if claim["id"] in seen_claim_ids:
                    errors.append(f"{path}: duplicate claim id {claim['id']!r} (global)")
                else:
                    seen_claim_ids.add(claim["id"])
            if not claim["quote"] and not slug.startswith("_") and claim["predicate"] not in {"title", "part", "order"}:
                errors.append(f"{path}: claim {claim.get('id', '?')} has no quote")
            elif claim["quote"] and claim["predicate"] not in {"title", "part", "order"} and not quote_ok(claim["quote"]):
                quote_warnings.append(f"{path}: claim {claim.get('id', '?')} quote not found in source")
            keys = claim.get("citation_keys") or []
            if isinstance(keys, str):
                keys = [keys]
            for key in keys:
                if key and literature_keys and key not in literature_keys:
                    errors.append(f"{path}: claim {claim.get('id', '?')}: citation not in literature.js: {key}")
            all_claims.append(claim)
            if is_functional(claim):
                groups[(claim["subject"], claim["predicate"], scope_key(claim))].append(claim)

    # Cheap unregistered-fact check: 4-digit years in lesson prose must be
    # represented by a claim value or a claim quote in that lesson's file.
    for slug, (_, norm_source) in source_cache.items():
        if not norm_source:
            continue
        if not documents.get(slug, {}).get("deep_audit"):
            continue  # full year-coverage scan is a gate for deep-audited ledgers
        known_years = set()
        for claim in all_claims:
            if claim.get("source") != f"{slug}.facts.json":
                continue
            if isinstance(claim["value"], (int, float)):
                known_years.add(str(int(claim["value"])))
            for match in re.finditer(r"\b(1[0-9]{3}|20[0-2][0-9])\b", claim.get("quote", "")):
                known_years.add(match.group(1))
        for match in re.finditer(r"\b(1[0-9]{3}|20[0-2][0-9])\b", norm_source):
            year = match.group(1)
            if year not in known_years:
                unregistered.append(f"{slug}.php: year {year} is not represented in {slug}.facts.json")

    for (subject, predicate, scope), claim_group in sorted(groups.items()):
        clusters = _clusters(claim_group)
        if len(clusters) > 1:
            conflicts.append(_format_conflict(subject, predicate, scope, clusters))
            conflict_pairs.extend(_conflict_pair_lines(subject, predicate, scope, clusters))

    # ---- relations: endpoints, cycles, temporal and same_as compatibility ----
    fact_ids = {c["id"]: c for c in all_claims if c.get("id")}
    subject_ids = {c["subject"] for c in all_claims}
    known_ids = set(fact_ids) | subject_ids | block_ids | statement_ids

    def ref_subject(ref: str) -> str:
        return fact_ids[ref]["subject"] if ref in fact_ids else ref

    relation_pairs: set[tuple[str, str, str]] = set()
    seen_relation_ids: set[str] = set()
    edge_sources: dict[tuple[str, str, str], set[str]] = defaultdict(set)
    relation_warnings: list[str] = []
    for rel in relations:
        if not rel["id"]:
            errors.append(f"{rel['source']}: relation without id ({rel['kind']} {rel['from']} -> {rel['to']})")
        elif rel["id"] in seen_relation_ids:
            errors.append(f"{rel['source']}: duplicate relation id {rel['id']!r}")
        else:
            seen_relation_ids.add(rel["id"])
        edge = (rel["from"], rel["to"], rel["kind"])
        relation_pairs.add(edge)
        if rel["source"] in edge_sources[edge]:
            relation_warnings.append(
                f"{rel['source']}: duplicate relation edge {rel['from']} -[{rel['kind']}]-> {rel['to']}"
            )
        edge_sources[edge].add(rel["source"])
        if rel["kind"] not in KNOWN_RELATION_KINDS:
            errors.append(
                f"{rel['source']}: unknown relation kind {rel['kind']!r} "
                f"(use one of {', '.join(sorted(KNOWN_RELATION_KINDS))})"
            )
        for endpoint in (rel["from"], rel["to"]):
            if endpoint not in known_ids:
                errors.append(
                    f"{rel['source']}: relation {rel['id'] or rel['kind']} endpoint "
                    f"{endpoint!r} is not a known fact/block/statement/subject id"
                )
        if rel["from"] == rel["to"] and rel["kind"] != "same_as":
            errors.append(f"{rel['source']}: self-loop relation {rel['id'] or rel['kind']}")

    # Every block must belong to its lesson, every statement to its block.
    for block_id, slug in block_owner.items():
        lesson_subject = canon_subject(slug)
        if (canon_ref(block_id), lesson_subject, "part_of") not in relation_pairs:
            errors.append(f"{slug}.facts.json: block {block_id} has no part_of relation to {lesson_subject}")
    for statement_id, block_id in statement_block.items():
        if block_id and (canon_ref(statement_id), canon_ref(block_id), "part_of") not in relation_pairs:
            errors.append(f"statement {statement_id} has no part_of relation to block {block_id}")

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
        if rel["from"] in known_ids and rel["to"] in known_ids:
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

    root_members: dict[str, set[str]] = defaultdict(set)
    for claim in all_claims:
        root_members[find(claim["subject"])].add(claim["subject"])

    merged: dict[tuple[str, str, str], list[dict]] = defaultdict(list)
    for claim in all_claims:
        if is_functional(claim):
            merged[(find(claim["subject"]), claim["predicate"], scope_key(claim))].append(claim)
    for (root, predicate, scope), claim_group in sorted(merged.items()):
        if len(root_members[root]) <= 1:
            continue  # no same_as merge touched this subject
        clusters = _clusters(claim_group)
        if len(clusters) > 1:
            conflicts.append(_format_conflict(root, predicate, scope, clusters))
            conflict_pairs.extend(_conflict_pair_lines(root, predicate, scope, clusters))

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

    if unregistered:
        print(f"[unregistered] {len(unregistered)} year(s) in prose have no matching fact:")
        limit = len(unregistered) if (verbose or strict_unregistered) else 5
        for item in unregistered[:limit]:
            print(f"  ? {item}")
        if len(unregistered) > limit:
            print(f"  … and {len(unregistered) - limit} more (use --verbose to list all)")
        if strict_unregistered:
            errors.extend(unregistered)

    if files_without_claims:
        print(f"[claims] {len(files_without_claims)} lesson(s) have only metadata, no checkable fact:")
        for slug in files_without_claims[:40]:
            print(f"  - {slug}")
        if len(files_without_claims) > 40:
            print(f"  … and {len(files_without_claims) - 40} more")
        if require_claims:
            errors.append(f"{len(files_without_claims)} lesson(s) have no non-metadata claim")

    if quote_warnings:
        print("=" * 72)
        print("QUOTE WARNINGS (non-blocking unless --strict-quotes)")
        print("=" * 72)
        for warning in quote_warnings:
            print(f"  ! {warning}")
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
    if strict_quotes and quote_warnings:
        errors.extend(quote_warnings)
    if conflict_pairs:
        print("=" * 72)
        print("CONTRADICTION LIST — all incompatible claim pairs")
        print("=" * 72)
        for line in dict.fromkeys(conflict_pairs):
            print(f"  {line}")
        report = ["# Fact conflicts", ""]
        report.extend(dict.fromkeys(conflict_pairs))
        (blog / "facts" / "CONFLICTS.md").write_text("\n".join(report) + "\n", encoding="utf-8")
        print(f"  (also written to {blog / 'facts' / 'CONFLICTS.md'})")

    if errors:
        print("=" * 72)
        print("FACT LEDGER ERRORS")
        print("=" * 72)
        for error in errors:
            print(f"  ✗ {error}")

    print(
        f"[{'FAIL' if (errors or conflicts) else 'PASS'}] "
        f"{len(facts)} fact files, {len(all_claims)} claims, {block_count} blocks, "
        f"{statement_count} statements, {len(relations)} relations, "
        f"{len(isolated)} isolated subject(s), {len(files_without_claims)} metadata-only lesson(s), "
        f"{len(unregistered)} unregistered year(s), {len(quote_warnings)} quote warning(s), "
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
    parser.add_argument("--strict-quotes", action="store_true",
                        help="promote quote-freshness warnings to errors")
    parser.add_argument("--require-claims", action="store_true",
                        help="fail if a lesson has no non-metadata claim")
    parser.add_argument("--strict-unregistered", action="store_true",
                        help="fail on years in prose that have no matching fact")
    args = parser.parse_args()
    sys.exit(check(Path(args.blog), coverage=not args.no_coverage,
                   verbose=args.verbose, strict_relations=args.strict_relations,
                   strict_temporal=args.strict_temporal, strict_quotes=args.strict_quotes,
                   require_claims=args.require_claims,
                   strict_unregistered=args.strict_unregistered))


if __name__ == "__main__":
    main()
