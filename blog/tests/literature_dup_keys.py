# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""
Literature duplicate-key guard.

window.bibData in literature.js is a plain JS object, so a repeated top-level
key silently last-wins: the later entry overwrites the earlier one with no
error, and no other validator catches it. A wrong entry placed second can
therefore mask the correct first one (and vice-versa), which has surfaced as
mismatched author lists in the rendered course.

This guard scans literature.js for top-level keys that appear more than once
and fails if any are found, so a duplicated entry can never again hide a
stale or wrong record.

Usage: uv run blog/tests/literature_dup_keys.py [blog_dir]
"""
import re
import sys
from pathlib import Path


def find_duplicates(lit_path: Path) -> dict[str, list[int]]:
	text = lit_path.read_text(encoding="utf-8")
	keys: dict[str, list[int]] = {}
	for i, line in enumerate(text.splitlines(), start=1):
		m = re.match(r'^\t"([^"]+)"\s*:\s*\{', line)
		if m:
			keys.setdefault(m.group(1), []).append(i)
	return {k: v for k, v in keys.items() if len(v) > 1}


def main() -> int:
	blog_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
	lit = blog_dir / "literature.js"
	if not lit.exists():
		print(f"error: {lit} not found")
		return 2
	dups = find_duplicates(lit)
	if dups:
		print(f"FAIL: {len(dups)} duplicated top-level key(s) in literature.js "
		      f"(JS object last-wins silently overwrites the earlier entry):")
		for k, lines in sorted(dups.items()):
			print(f"  {k}: lines {lines}")
		return 1
	print("OK: no duplicated keys in literature.js")
	return 0


if __name__ == "__main__":
	sys.exit(main())
