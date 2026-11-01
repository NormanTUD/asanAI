#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Course-order guard: detect duplicate or broken lesson positions.

`parse_course_metadata()` in functions.php sorts every lesson by
`[part, order]`. A duplicated `(part, order)` pair is therefore invisible at
runtime: one of the two lessons silently moves to an arbitrary position. This
has happened before (Part 6 had two `order: 18` entries), so it gets its own
cheap, dependency-free check.

Rules:
  * every scanned lesson has `title` and `part` (same skip list as runtime);
  * `part` is a non-negative integer, `order` is a positive integer;
  * no two lessons share the same `(part, order)` pair  -> ERROR;
  * parts 1..6 each contain at least one lesson            -> ERROR;
  * orders within a part are contiguous starting at 1      -> WARN (not fatal,
    so deleting a lesson does not force a renumbering in the same commit).

Run:
    uv run blog/tests/course_order_test.py [blog/]

Exit code 0 = no errors (warnings allowed), 1 = at least one error.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

SKIP = {"index", "index_full", "functions", "asanai_blog_proxy", "graph", "intro"}
META_RE = re.compile(r"<!--\s*\n?\s*COURSE_METADATA:\s*\n((?:.*\n)*?)\s*-->")


def read_metadata(path: Path) -> dict[str, str] | None:
    match = META_RE.search(path.read_text(encoding="utf-8"))
    if not match:
        return None
    meta: dict[str, str] = {}
    for line in match.group(1).splitlines():
        line = line.strip()
        if re.match(r"^\w+:\s*.+$", line):
            key, value = line.split(":", 1)
            meta[key.strip()] = value.strip()
    return meta


def check_course_order(root: Path) -> tuple[list[str], list[str]]:
    """Return (errors, warnings) for the course metadata under *root*."""
    errors: list[str] = []
    warnings: list[str] = []
    by_part: dict[int, list[tuple[int, str]]] = {}

    for path in sorted(root.glob("*.php")):
        slug = path.stem
        if slug in SKIP:
            continue
        meta = read_metadata(path)
        if meta is None or "part" not in meta or "title" not in meta:
            continue
        try:
            part = int(meta["part"])
        except ValueError:
            errors.append(f"{slug}: part is not an integer: {meta['part']!r}")
            continue
        order_raw = meta.get("order")
        if order_raw is None:
            errors.append(f"{slug}: missing order (runtime would sort it as 999)")
            continue
        try:
            order = int(order_raw)
        except ValueError:
            errors.append(f"{slug}: order is not an integer: {order_raw!r}")
            continue
        if part < 0:
            errors.append(f"{slug}: part must be >= 0, got {part}")
        if order < 1:
            errors.append(f"{slug}: order must be >= 1, got {order}")
        by_part.setdefault(part, []).append((order, slug))

    seen: dict[tuple[int, int], str] = {}
    for part, rows in sorted(by_part.items()):
        for order, slug in rows:
            key = (part, order)
            if key in seen:
                errors.append(
                    f"duplicate course position part={part} order={order}: "
                    f"{seen[key]} and {slug}"
                )
            else:
                seen[key] = slug

        orders = sorted(order for order, _ in rows)
        for previous, current in zip(orders, orders[1:]):
            if current == previous:
                continue  # already reported as a duplicate
            if current != previous + 1:
                warnings.append(
                    f"part {part}: order gap {previous} -> {current} "
                    f"({', '.join(slug for order, slug in sorted(rows) if order in (previous, current))})"
                )
        expected_first = 1
        if orders and orders[0] != expected_first:
            warnings.append(
                f"part {part}: orders start at {orders[0]}, expected {expected_first}"
            )

    for part in range(1, 7):
        if part not in by_part:
            errors.append(f"part {part}: no lessons found")

    return errors, warnings


def main() -> None:
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
    errors, warnings = check_course_order(root)

    for warning in warnings:
        print(f"  ! {warning}")
    for error in errors:
        print(f"  ✗ {error}")

    if errors:
        print(f"[FAIL] course order: {len(errors)} error(s), {len(warnings)} warning(s)")
        sys.exit(1)
    print(f"[PASS] course order: no duplicates or gaps across 6 parts ({len(warnings)} warning(s))")
    sys.exit(0)


if __name__ == "__main__":
    main()
