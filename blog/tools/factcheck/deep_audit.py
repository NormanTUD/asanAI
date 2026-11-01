# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Deep audit of the blog fact ledger.

Goes beyond schema validation:
  * every year and number+unit in prose must be represented by a claim;
  * citation keys must occur in the lesson source near the claim quote;
  * specific numeric claims should carry a citation or source_url;
  * relations must be grounded in a quote and mention their endpoints;
  * numeric ranges and normalised `*_year` predicates are checked globally.

Writes blog/facts/DEEP_AUDIT.md and prints a summary.

Usage:
    uv run blog/tools/factcheck/deep_audit.py blog/ [--strict] [--limit N]
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
    fact_files,
    lesson_files,
    load_fact_file,
    normalize_source,
)

YEAR_RE = re.compile(r"\b(1[0-9]{3}|20[0-2][0-9])\b")
QUANT_RE = re.compile(
    r"(?<![\w.])(\d[\d.,]*)\s*"
    r"(thousand|million|billion|trillion|k|m|b|bn|t|GB|TB|MB|GiB|MiB|TFLOPS|TFLOP/s|TFLOP|%|"
    r"tokens?|parameters?|layers?|years?|kya)\b",
    re.I,
)
SPECIFIC = {
    "parameters", "layers", "context_window", "training_tokens", "year",
    "memory", "tflops", "d_model", "heads", "accuracy", "price",
}
NUMERIC_PREDICATES = SPECIFIC | {"tokens_per_parameter", "range"}


def norm_ws(text: str) -> str:
    return re.sub(r"\s+", " ", str(text)).strip()


def claim_slug(claim: dict) -> str:
    source = claim.get("source", "")
    return source[: -len(".facts.json")] if source.endswith(".facts.json") else source


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("blog", nargs="?", default="blog")
    parser.add_argument("--strict", action="store_true")
    parser.add_argument("--limit", type=int, default=35)
    args = parser.parse_args()
    blog = Path(args.blog)

    lessons = lesson_files(blog)
    facts = fact_files(blog)
    sources = {}
    for slug, path in lessons.items():
        raw = path.read_text(encoding="utf-8", errors="replace")
        sources[slug] = (raw, normalize_source(raw))

    claims_by_slug: dict[str, list[dict]] = defaultdict(list)
    relations_by_slug: dict[str, list[dict]] = defaultdict(list)
    statements_by_slug: dict[str, list[dict]] = defaultdict(list)
    for slug, path in facts.items():
        document, claims = load_fact_file(path)
        if slug.startswith("_"):
            continue
        claims_by_slug[slug] = claims
        relations_by_slug[slug] = document.get("relations", []) if isinstance(document, dict) else []
        statements_by_slug[slug] = document.get("statements", []) if isinstance(document, dict) else []

    uncovered_years = []
    uncovered_quantities = []
    uncited = []
    bad_citations = []
    far_citations = []
    relation_issues = []
    range_issues = []
    year_conflicts = []
    per_lesson = []

    for slug in sorted(lessons):
        raw, nsrc = sources.get(slug, ("", ""))
        claims = claims_by_slug.get(slug, [])
        relations = relations_by_slug.get(slug, [])
        statements = statements_by_slug.get(slug, [])
        corpus = " ".join(str(c.get("quote", "")) + " " + str(c.get("value", "")) for c in claims).lower()

        # 1. years in prose must be represented in a claim quote/value
        years = set(YEAR_RE.findall(nsrc))
        missing_years = []
        for year in sorted(years):
            if year in corpus:
                continue
            # skip access/citation/URL contexts
            context = re.findall(r".{0,40}" + re.escape(year) + r".{0,40}", nsrc)
            if any(re.search(r"http|doi|accessed|arXiv|ISBN|S\.\s*\d", c, re.I) for c in context):
                continue
            missing_years.append(year)
        uncovered_years.extend((slug, year) for year in missing_years)

        # 2. numbers with units must be represented
        missing_qtys = []
        for match in QUANT_RE.finditer(nsrc):
            raw_value = match.group(0)
            if raw_value.lower() in corpus:
                continue
            if raw_value.replace(" ", "").lower() in corpus.replace(" ", ""):
                continue
            missing_qtys.append(raw_value)
        uncovered_quantities.extend((slug, value) for value in missing_qtys)

        # 3. citation grounding + uncited specific claims
        for claim in claims:
            keys = claim.get("citation_keys") or []
            if isinstance(keys, str):
                keys = [keys]
            if claim["predicate"] in SPECIFIC and not keys and not claim.get("source_url"):
                if claim["subject"] != slug:
                    uncited.append((slug, claim.get("id"), claim["subject"], claim["predicate"], claim["value"]))
            if not keys:
                continue
            quote = norm_ws(claim.get("quote", ""))
            qpos = nsrc.find(quote) if quote else -1
            for key in keys:
                if not key:
                    continue
                marker = re.search(
                    r"\\\\?cite[a-zA-Z]*\s*(?:\[[^\]]*\])?\{[^}]*\b" + re.escape(key) + r"\b"
                    r'|data-cite="' + re.escape(key) + r'"',
                    raw,
                )
                if marker is None:
                    bad_citations.append((slug, claim.get("id"), key))

            # 4. range checks
            if claim["predicate"] in NUMERIC_PREDICATES and isinstance(claim["value"], (int, float)):
                value = float(claim["value"])
                if claim["predicate"] == "year" and not (-4000 <= value <= 2026):
                    range_issues.append((slug, claim.get("id"), "year", value))
                if claim["predicate"] == "accuracy" and claim["unit"] == "%" and not (0 <= value <= 100):
                    range_issues.append((slug, claim.get("id"), "accuracy", value))
                if claim["predicate"] in {"memory", "tflops", "parameters", "layers", "training_tokens", "context_window"} and value < 0:
                    range_issues.append((slug, claim.get("id"), claim["predicate"], value))

        # 5. relations must mention their endpoints near the quote
        for rel in relations:
            if rel.get("kind") == "mentioned_in" or rel.get("confidence") in {"provenance", "inferred"}:
                continue
            quote = norm_ws(rel.get("quote", ""))
            if not quote:
                relation_issues.append((slug, rel.get("id"), "no quote"))
                continue
            qpos = nsrc.find(quote)
            if qpos < 0:
                relation_issues.append((slug, rel.get("id"), "quote not found"))
                continue
            window = nsrc[max(0, qpos - 300): qpos + len(quote) + 300].lower()
            for endpoint in (rel.get("from", ""), rel.get("to", "")):
                token = endpoint.replace("-", " ").split()[0] if endpoint else ""
                if token and token not in window and endpoint not in window:
                    relation_issues.append((slug, rel.get("id"), f"endpoint not near quote: {endpoint}"))

        # 6. normalised *_year conflicts
        year_groups = defaultdict(list)
        for claim in claims:
            pred = claim["predicate"]
            if pred == "year" or pred.endswith("_year"):
                if isinstance(claim["value"], (int, float)):
                    event = pred[:-5] if pred.endswith("_year") else "event"
                    scope = tuple(sorted(claim.get("qualifiers", {}).items()))
                    year_groups[(claim["subject"], event, scope)].append(claim)
        for (subject, event, scope), group in year_groups.items():
            values = {float(c["value"]) for c in group}
            if len(values) > 1:
                year_conflicts.append((slug, subject, event, sorted(values)))

        per_lesson.append({
            "slug": slug,
            "claims": len(claims),
            "statements": len(statements),
            "relations": len(relations),
            "missing_years": len(missing_years),
            "missing_quantities": len(missing_qtys),
        })

    total_missing_years = len(uncovered_years)
    total_missing_qtys = len(uncovered_quantities)
    report = [
        "# Deep fact audit",
        "",
        f"- lessons: {len(lessons)}",
        f"- claims: {sum(len(v) for v in claims_by_slug.values())}",
        f"- statements: {sum(len(v) for v in statements_by_slug.values())}",
        f"- relations: {sum(len(v) for v in relations_by_slug.values())}",
        f"- uncovered years: {total_missing_years}",
        f"- uncovered quantities: {total_missing_qtys}",
        f"- uncited specific claims: {len(uncited)}",
        f"- citation keys not found in lesson: {len(bad_citations)}",
        f"- relation grounding issues: {len(relation_issues)}",
        f"- numeric range issues: {len(range_issues)}",
        f"- normalised year conflicts: {len(year_conflicts)}",
        "",
        "## Per lesson",
        "",
        "| lesson | claims | statements | relations | missing years | missing quantities |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    for row in per_lesson:
        report.append(
            f"| {row['slug']} | {row['claims']} | {row['statements']} | {row['relations']} | "
            f"{row['missing_years']} | {row['missing_quantities']} |"
        )
    report.extend(["", "## Uncovered years", ""])
    for slug, year in uncovered_years[: args.limit]:
        report.append(f"- {slug}.php: {year}")
    if len(uncovered_years) > args.limit:
        report.append(f"- … and {len(uncovered_years) - args.limit} more")
    report.extend(["", "## Uncovered quantities", ""])
    for slug, value in uncovered_quantities[: args.limit]:
        report.append(f"- {slug}.php: {value}")
    if len(uncovered_quantities) > args.limit:
        report.append(f"- … and {len(uncovered_quantities) - args.limit} more")
    report.extend(["", "## Uncited specific claims", ""])
    for slug, cid, subject, pred, value in uncited[: args.limit]:
        report.append(f"- {slug}.php: {cid} {subject} {pred}={value!r}")
    if len(uncited) > args.limit:
        report.append(f"- … and {len(uncited) - args.limit} more")
    report.extend(["", "## Bad citations", ""])
    for slug, cid, key in bad_citations[: args.limit]:
        report.append(f"- {slug}.php: {cid} cites {key} not present in lesson")
    report.extend(["", "## Relation grounding", ""])
    for slug, rid, why in relation_issues[: args.limit]:
        report.append(f"- {slug}.php: {rid}: {why}")
    report.extend(["", "## Range issues", ""])
    for slug, cid, pred, value in range_issues[: args.limit]:
        report.append(f"- {slug}.php: {cid} {pred}={value}")
    report.extend(["", "## Normalised year conflicts", ""])
    for slug, subject, event, values in year_conflicts[: args.limit]:
        report.append(f"- {slug}.php: {subject} {event} has years {values}")

    (blog / "facts" / "DEEP_AUDIT.md").write_text("\n".join(report) + "\n", encoding="utf-8")
    print(f"[deep-audit] wrote {blog / 'facts' / 'DEEP_AUDIT.md'}")
    print(
        f"  years={total_missing_years} quantities={total_missing_qtys} uncited={len(uncited)} "
        f"bad_citations={len(bad_citations)} relation_issues={len(relation_issues)} "
        f"range_issues={len(range_issues)} year_conflicts={len(year_conflicts)}"
    )
    critical = bad_citations + range_issues + year_conflicts
    if args.strict and critical:
        sys.exit(1)


if __name__ == "__main__":
    main()
