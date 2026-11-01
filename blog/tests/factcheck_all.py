#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""One command for the whole fact audit.

Runs every deterministic fact check, prints each section plus a compact
findings list, and exits 1 if any gate fails.

    ./blog/tests/factcheck_all.py
    ./blog/tests/factcheck_all.py --quiet   # no section output, only FINDINGS + summary

Exit 0 = all gates pass; exit 1 = at least one error (warnings do not fail).
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
BLOG = ROOT / "blog"
FC = BLOG / "tools" / "factcheck"
TESTS = BLOG / "tests"

STEPS = [
    ("fact ledger", [FC / "check_facts.py", str(BLOG),
                     "--strict-relations", "--strict-quotes", "--require-claims"]),
    ("sentence contradictions", [FC / "check_sentence_conflicts.py", str(BLOG),
                                  "--strict", "--include-relations"]),
    ("statement freshness", [FC / "extract_statements.py", str(BLOG), "--check"]),
    ("content claims", [TESTS / "content_claims_test.py"]),
    ("deep audit", [FC / "deep_audit.py", str(BLOG), "--strict"]),
    ("ledger unit tests", [TESTS / "fact_ledger_test.py"]),
    ("sentence-report test", [TESTS / "sentence_conflict_test.py"]),
]

MARKERS = ("conflict", "contradicts", "relation ", "sentence ", "claim ",
           "✗", "[FAIL]", "uncovered", "unregistered", "missing", "stale",
           "unknown relation", "isolated", "! ", "? ")

DEEP_SECTIONS = (
    "## Uncovered years",
    "## Uncovered quantities",
    "## Uncited specific claims",
    "## Bad citations",
    "## Relation grounding",
    "## Range issues",
    "## Normalised year conflicts",
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--quiet", action="store_true", help="only findings + summary")
    args = parser.parse_args()

    failures: list[str] = []
    findings: list[str] = []
    for index, (name, cmd) in enumerate(STEPS, 1):
        if not args.quiet:
            print("=" * 80)
            print(f"[{index}/{len(STEPS)}] {name}")
            print("=" * 80)
        result = subprocess.run(
            [sys.executable, *map(str, cmd)],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        output = (result.stdout + result.stderr).strip()
        if output and not args.quiet:
            print(output)
        for line in output.splitlines():
            stripped = line.strip()
            if stripped.startswith(MARKERS):
                findings.append(f"{name}: {stripped}")
        if result.returncode != 0:
            failures.append(name)
            if args.quiet and output:
                print(output)
        if name == "deep audit":
            report = BLOG / "facts" / "DEEP_AUDIT.md"
            if report.exists():
                active = False
                for line in report.read_text(encoding="utf-8").splitlines():
                    if line.startswith("## "):
                        active = line.strip() in DEEP_SECTIONS
                        continue
                    if active and line.strip().startswith("- "):
                        findings.append(f"deep audit: {line.strip()[2:]}")

    unique_findings = list(dict.fromkeys(findings))
    print("\n" + "=" * 80)
    print("FINDINGS")
    print("=" * 80)
    if unique_findings:
        for item in unique_findings:
            print(f"  - {item}")
    else:
        print("  (none)")

    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    for name, _ in STEPS:
        print(f"  [{'FAIL' if name in failures else 'PASS'}] {name}")
    if failures:
        print(f"\nRESULT: {len(failures)} failing check(s): {', '.join(failures)}")
        sys.exit(1)
    print("\nRESULT: all fact checks passed")
    sys.exit(0)


if __name__ == "__main__":
    main()
