#!/bin/bash
# HOVER LAYOUT GUARD — headless regression test.
#
# Asserts that hovering a mouseoverable text (glossary entry) inside a
# chapter introduction NEVER moves the stuff around the drop cap.
# See hover_layout_guard.html for the checked invariants.
#
# Requires a headless Chromium and the site to be reachable (Apache).
# Override with HOVER_GUARD_BASE_URL / CHROME_BIN if needed.

set -e

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

BASE_URL="${HOVER_GUARD_BASE_URL:-http://localhost/asanai/blog/tests/hover_layout_guard.html}"
CHROME="${CHROME_BIN:-chromium}"

if ! command -v "$CHROME" >/dev/null 2>&1; then
	echo "hover_layout_guard: SKIP ($CHROME not found)"
	exit 0
fi

if command -v curl >/dev/null 2>&1 && ! curl -s -o /dev/null --max-time 5 "$BASE_URL"; then
	echo "hover_layout_guard: SKIP (site not reachable at $BASE_URL)"
	exit 0
fi

OUT="$("$CHROME" --headless --no-sandbox --disable-gpu \
	--virtual-time-budget=30000 --timeout=60000 \
	--dump-dom "$BASE_URL" 2>/dev/null || true)"

# The verdict is set exactly once in <title> (idempotent finish in the
# page). Match the title tag specifically so the script's own source
# text can never produce a false positive.
if echo "$OUT" | grep -q "<title>HOVER_LAYOUT_GUARD PASS"; then
	echo "hover_layout_guard: PASS"
	exit 0
fi

echo "hover_layout_guard: FAIL"
echo "$OUT" | grep -o "<title>HOVER_LAYOUT_GUARD FAIL[^<]*" | head -3 || true
exit 1
