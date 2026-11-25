#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Check image credits in the Ten Minutes history page.

Ten Minutes is standalone: it does not load literature.js at runtime. Its image
credits therefore live in assets/image-credits.json and in the page itself.
This test keeps the two in sync, and cross-checks entries that name a
literature.js key against the bibliography.

It also requires every static <img> in history.php to have a figcaption with
a source link and a license keyword, so a new image cannot ship without credit.

Usage: uv run blog/tests/tenminutes_image_credits_test.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEN = ROOT / "blog" / "tenminutes"
HISTORY = TEN / "history.php"
MANIFEST = TEN / "assets" / "image-credits.json"
LITERATURE = ROOT / "blog" / "literature.js"

LICENSE_RE = re.compile(r"public domain|CC BY|CC BY-SA|CC0", re.I)
IMAGE_RE = re.compile(
    r'<img\b[^>]*\bsrc="([^"]+)"[^>]*>[\s\S]*?<figcaption[^>]*>([\s\S]*?)</figcaption>',
    re.I,
)
ENTRY_RE = re.compile(r'\{\s*date:\s*"([^"]*)",(.*?)\n\t\t\t\}', re.S)


def literature_entry(text: str, key: str) -> dict[str, str] | None:
    """Return the fields of a top-level literature.js entry, or None."""
    lines = text.splitlines()
    start = None
    for i, line in enumerate(lines):
        if re.match(r'^\t"' + re.escape(key) + r'"\s*:\s*\{', line):
            start = i
            break
    if start is None:
        return None
    body: list[str] = []
    for line in lines[start + 1:]:
        if line.startswith("\t},") or line == "\t}":
            break
        body.append(line)
    joined = "\n".join(body)
    fields: dict[str, str] = {}
    for name in ("author", "license", "url"):
        m = re.search(r'^\t\t' + name + r':\s*"([^"]*)"', joined, re.M)
        if m:
            fields[name] = m.group(1)
    return fields


def main() -> int:
    if not HISTORY.exists():
        print(f"FAIL: missing {HISTORY}")
        return 2
    if not MANIFEST.exists():
        print(f"FAIL: missing {MANIFEST}")
        return 2
    if not LITERATURE.exists():
        print(f"FAIL: missing {LITERATURE}")
        return 2

    page = HISTORY.read_text(encoding="utf-8")
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    lit_text = LITERATURE.read_text(encoding="utf-8")

    images = manifest.get("images", [])
    by_src: dict[str, dict] = {}
    failures: list[str] = []
    for item in images:
        src = item.get("src", "")
        if not src:
            failures.append("manifest entry has no src")
            continue
        if src in by_src:
            failures.append(f"duplicate manifest src: {src}")
        by_src[src] = item
        path = (TEN / src).resolve()
        if not path.exists():
            failures.append(f"missing image file: {src}")

    timeline = ENTRY_RE.findall(page)
    if not timeline:
        failures.append("could not parse timeline entries in history.php")

    checked = 0
    for date, body in timeline:
        img_m = re.search(r'img:\s*"([^"]*)"', body)
        cap_m = re.search(r'cap:\s*"([^"]*)"', body)
        if not img_m:
            failures.append(f"{date}: timeline entry has img: null")
            continue
        src = img_m.group(1)
        cap = cap_m.group(1) if cap_m else ""
        item = by_src.get(src)
        if item is None:
            failures.append(f"{date}: {src} is not in image-credits.json")
            continue
        if "<a href=" not in cap:
            failures.append(f"{date}: caption for {src} has no source link")
        if not LICENSE_RE.search(cap):
            failures.append(f"{date}: caption for {src} has no license")
        if item["source"] not in cap:
            failures.append(f"{date}: caption for {src} does not contain source {item['source']}")
        if item["license"].lower() not in cap.lower():
            failures.append(f"{date}: caption for {src} does not contain license {item['license']}")
        if item["author"].lower() not in cap.lower():
            failures.append(f"{date}: caption for {src} does not contain author {item['author']}")
        checked += 1

    # Every static figure must carry a visible credit and a source link.
    static = 0
    for src, cap in IMAGE_RE.findall(page):
        if "' +" in src or src.startswith("data:"):
            continue
        static += 1
        if "<a href=" not in cap:
            failures.append(f"static image {src}: figcaption has no source link")
        if not LICENSE_RE.search(cap):
            failures.append(f"static image {src}: figcaption has no license")

    # Cross-check the copied metadata against literature.js where a key exists.
    synced = 0
    for src, item in by_src.items():
        key = item.get("literatureKey")
        if not key:
            continue
        entry = literature_entry(lit_text, key)
        if entry is None:
            failures.append(f"{src}: literature key '{key}' not found")
            continue
        synced += 1
        expected_author = item.get("literatureAuthor", item["author"])
        if entry.get("author") != expected_author:
            failures.append(
                f"{src}: author differs from literature.js ({entry.get('author')!r} != {expected_author!r})"
            )
        if entry.get("license", "").casefold() != item["license"].casefold():
            failures.append(
                f"{src}: license differs from literature.js "
                f"({entry.get('license')!r} != {item['license']!r})"
            )
        if entry.get("url") != item["source"]:
            failures.append(
                f"{src}: source differs from literature.js ({entry.get('url')!r} != {item['source']!r})"
            )

    if failures:
        print(f"FAIL: {len(failures)} image-credit issue(s)")
        for failure in failures:
            print("  -", failure)
        return 1

    print(
        f"OK: {checked} timeline images credited, {static} static figures credited, "
        f"{synced} entries synced with literature.js"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
