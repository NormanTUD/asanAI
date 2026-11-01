# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Regression test for the sentence-level contradiction report.

Builds a temporary two-lesson ledger with a fabricated contradiction
(“first neural network” 1958 Rosenblatt vs 2003 Sam Altman) and asserts that
`check_sentence_conflicts.py --strict` prints the sentence pair and exits 1.
Also checks that a consistent ledger exits 0.

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


def write_fact(root: Path, slug: str, claim: dict) -> None:
    facts = root / "facts"
    facts.mkdir(exist_ok=True)
    (facts / f"{slug}.facts.json").write_text(
        json.dumps({"source": f"{slug}.php", "claims": [claim]}),
        encoding="utf-8",
    )


def run(root: Path) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(SCRIPT), str(root), "--strict"],
        capture_output=True,
        text=True,
    )


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_fact(root, "history", {
            "id": "history-rosenblatt-1958",
            "subject": "first-neural-network",
            "predicate": "year",
            "value": 1958,
            "unit": "year",
            "qualifiers": {"event": "built"},
            "quote": "The first neural network was built in 1958 by Frank Rosenblatt.",
        })
        write_fact(root, "fake", {
            "id": "fake-altman-2003",
            "subject": "first-neural-network",
            "predicate": "year",
            "value": 2003,
            "unit": "year",
            "qualifiers": {"event": "built"},
            "quote": "The first neural network was done in 2003 by Sam Altman.",
        })
        result = run(root)
        assert result.returncode == 1, result.stdout + result.stderr
        for token in ("contradicts", "first-neural-network", "1958", "2003", "fake.php", "history.php"):
            assert token in result.stdout, f"missing {token!r} in:\n{result.stdout}"

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_fact(root, "history", {
            "id": "history-rosenblatt-1958",
            "subject": "first-neural-network",
            "predicate": "year",
            "value": 1958,
            "unit": "year",
            "qualifiers": {"event": "built"},
            "quote": "The first neural network was built in 1958 by Frank Rosenblatt.",
        })
        write_fact(root, "other", {
            "id": "other-rosenblatt-1958",
            "subject": "first-neural-network",
            "predicate": "year",
            "value": 1958,
            "unit": "year",
            "qualifiers": {"event": "built"},
            "quote": "Frank Rosenblatt built the first neural network in 1958.",
        })
        result = run(root)
        assert result.returncode == 0, result.stdout + result.stderr
        assert "no sentence-level factual contradictions" in result.stdout

    print("[PASS] sentence-conflict report: contradiction detected; consistent ledger passes")


if __name__ == "__main__":
    main()
