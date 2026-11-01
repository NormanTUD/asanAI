#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Tests for the content claims in blog/facts/.

This is intentionally about content, not just schema:
  * every lesson has at least one non-metadata claim;
  * the four history chapters are deep;
  * core facts (GPT-3 size, backprop year, H100 specs, ...) are present;
  * no fact file stores line numbers;
  * every non-metadata claim has a quote and unit.

Run:
    uv run blog/tests/content_claims_test.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools" / "factcheck"))

import facts_lib  # noqa: E402

FACTS = ROOT / "facts"
LESSONS = facts_lib.lesson_files(ROOT)
METADATA = {"title", "part", "order"}


def load_all():
    result = {}
    for path in sorted(FACTS.glob("*.facts.json")):
        slug = path.name[: -len(".facts.json")]
        document, claims = facts_lib.load_fact_file(path)
        result[slug] = (document, claims)
    return result


def main() -> None:
    data = load_all()
    failures: list[str] = []

    statement_exempt = {"knowledge_map", "search_lib"}
    for slug in sorted(LESSONS):
        if slug.startswith("_"):
            continue
        if slug not in data:
            failures.append(f"{slug}: no fact file")
            continue
        document, claims = data[slug]
        content = [c for c in claims if c["predicate"] not in METADATA]
        if not content:
            failures.append(f"{slug}: no non-metadata content claim")
        if "line" in document:
            failures.append(f"{slug}: top-level line field")
        statements = document.get("statements", []) if isinstance(document, dict) else []
        blocks = document.get("blocks", []) if isinstance(document, dict) else []
        if slug not in statement_exempt and not statements:
            failures.append(f"{slug}: no statements (prose not protocolled)")
        if slug not in statement_exempt and not blocks:
            failures.append(f"{slug}: no blocks (paragraphs not protocolled)")
        for block in blocks:
            if not block.get("quote"):
                failures.append(f"{slug}: block {block.get('id')} has no quote")
            if "line" in block:
                failures.append(f"{slug}: block {block.get('id')} has a line field")
        for statement in statements:
            if not statement.get("quote"):
                failures.append(f"{slug}: statement {statement.get('id')} has no quote")
            if "line" in statement:
                failures.append(f"{slug}: statement {statement.get('id')} has a line field")
        for claim in content:
            if not claim.get("quote"):
                failures.append(f"{slug}: claim {claim.get('id')} has no quote")
            if not claim.get("unit"):
                failures.append(f"{slug}: claim {claim.get('id')} has no unit")

    thresholds = {
        "history": (400, 100),
        "untold_history_i": (200, 50),
        "untold_history_ii": (200, 50),
        "untold_history_iii": (400, 100),
    }
    for slug, (min_claims, min_relations) in thresholds.items():
        document, claims = data.get(slug, ({}, []))
        content = [c for c in claims if c["predicate"] not in METADATA]
        relations = document.get("relations", []) if isinstance(document, dict) else []
        if len(content) < min_claims:
            failures.append(f"{slug}: {len(content)} content claims, expected >= {min_claims}")
        if len(relations) < min_relations:
            failures.append(f"{slug}: {len(relations)} relations, expected >= {min_relations}")

    all_claims = [c for _, claims in data.values() for c in claims]

    def has(subject: str, predicate: str, expected, unit: str | None = None, qualifier: str | None = None) -> bool:
        for claim in all_claims:
            if claim["subject"] != subject or claim["predicate"] != predicate:
                continue
            if qualifier and claim["qualifiers"].get(qualifier) is None:
                continue
            if unit and claim["unit"] != unit:
                continue
            value, _ = facts_lib.normalize_value(claim["value"], claim["unit"])
            target, _ = facts_lib.normalize_value(expected, unit)
            if isinstance(value, (int, float)) and isinstance(target, (int, float)):
                if abs(value - target) <= max(1e-9, abs(target) * 1e-9):
                    return True
            elif value == target:
                return True
        return False

    core = [
        ("gpt-3", "parameters", 175_000_000_000),
        ("backpropagation", "year", 1986),
        ("h100", "memory", 80),
        ("h100", "tflops", 989),
        ("alexnet", "year", 2012),
        ("transformer", "year", 2017),
        ("chinchilla", "tokens_per_parameter", 20),
    ]
    for subject, predicate, expected in core:
        if not has(subject, predicate, expected):
            failures.append(f"missing core fact: {subject} {predicate} = {expected}")

    # Raw files must not carry line numbers.
    for path in sorted(FACTS.glob("*.facts.json")):
        raw = path.read_text(encoding="utf-8")
        if '"line"' in raw:
            failures.append(f"{path.name}: contains a line field")

    if failures:
        print(f"[FAIL] content claims: {len(failures)} problem(s)")
        for failure in failures:
            print(f"  ✗ {failure}")
        sys.exit(1)

    print(
        f"[PASS] content claims: {len(LESSONS)} lessons, {len(all_claims)} claims, "
        f"{sum(len(d.get('blocks', [])) for d, _ in data.values())} blocks, "
        f"{sum(len(d.get('statements', [])) for d, _ in data.values())} statements, "
        f"{sum(len(d.get('relations', [])) for d, _ in data.values())} relations"
    )


if __name__ == "__main__":
    main()
