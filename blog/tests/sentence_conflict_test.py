#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Regression test for the sentence-level contradiction report.

Builds a temporary two-lesson ledger with a generic fabricated contradiction
(entity X, 1900 vs 2000) and asserts that `check_sentence_conflicts.py
--strict` prints the sentence pair and exits 1. Also checks that a consistent
ledger exits 0 and that an explicit `contradicts` relation is not misreported
as a sentence pair.

Run:
    uv run blog/tests/sentence_conflict_test.py
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "tools" / "factcheck" / "check_sentence_conflicts.py"


def write_fact(root: Path, slug: str, claim: dict, relations=None) -> None:
    facts = root / "facts"
    facts.mkdir(exist_ok=True)
    (facts / f"{slug}.facts.json").write_text(
        json.dumps({"source": f"{slug}.php", "claims": [claim],
                    "relations": relations or []}),
        encoding="utf-8",
    )


def run(root: Path, *extra: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(SCRIPT), str(root), "--strict", *extra],
        capture_output=True,
        text=True,
    )


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_fact(root, "history", {
            "id": "entity-x-1900",
            "subject": "entity-x",
            "predicate": "year",
            "value": 1900,
            "unit": "year",
            "qualifiers": {"event": "built"},
            "quote": "Entity X was established in 1900.",
        })
        write_fact(root, "fake", {
            "id": "entity-x-2000",
            "subject": "entity-x",
            "predicate": "year",
            "value": 2000,
            "unit": "year",
            "qualifiers": {"event": "built"},
            "quote": "Entity X was established in 2000.",
        })
        result = run(root)
        assert result.returncode == 1, result.stdout + result.stderr
        for token in ("contradicts", "entity-x", "1900", "2000", "fake.php", "history.php"):
            assert token in result.stdout, f"missing {token!r} in:\n{result.stdout}"

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_fact(root, "history", {
            "id": "entity-x-1900",
            "subject": "entity-x",
            "predicate": "year",
            "value": 1900,
            "unit": "year",
            "qualifiers": {"event": "built"},
            "quote": "Entity X was established in 1900.",
        })
        write_fact(root, "other", {
            "id": "entity-x-1900-alt",
            "subject": "entity-x",
            "predicate": "year",
            "value": 1900,
            "unit": "year",
            "qualifiers": {"event": "built"},
            "quote": "Entity X was founded in 1900.",
        })
        result = run(root)
        assert result.returncode == 0, result.stdout + result.stderr
        assert "no sentence-level factual contradictions" in result.stdout

    # An explicit `contradicts` relation is an entity/theory opposition, not a
    # sentence-level factual contradiction. It must not be printed as a
    # "sentence ... contradicts sentence ..." pair.
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_fact(root, "history", {
            "id": "entity-a",
            "subject": "entity-a",
            "predicate": "finding",
            "value": "property a",
            "unit": "name",
            "quote": "Entity A has property a.",
        }, relations=[{
            "id": "rel-entity-a-entity-b",
            "from": "entity-a",
            "to": "entity-b",
            "kind": "contradicts",
            "quote": "Entity A and entity B cannot both hold.",
        }])
        write_fact(root, "theory", {
            "id": "entity-b",
            "subject": "entity-b",
            "predicate": "definition",
            "value": "property b",
            "unit": "name",
            "quote": "Entity B has property b.",
        })
        result = run(root)
        assert result.returncode == 0, result.stdout + result.stderr
        assert "no sentence-level factual contradictions" in result.stdout
        result = run(root, "--include-relations")
        assert "relation 'rel-entity-a-entity-b'" in result.stdout
        assert "sentence A (entity-a)" in result.stdout
        assert "sentence B (entity-b)" in result.stdout
        assert "note: explicit entity/theory opposition" in result.stdout
        assert "contradicts sentence" not in result.stdout

    print("[PASS] sentence-conflict report: contradiction detected; explicit relation not misreported")


if __name__ == "__main__":
    main()
