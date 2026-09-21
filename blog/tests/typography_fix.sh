#!/bin/bash
# TYPOGRAPHY FIX — headless regression test.
#
# Loads the production typography_fix.js against a synthetic .md column and
# asserts the three passes convert ALL occurrences in a node (not just the
# first), leave <code> alone, and leave .no-typo-fix alone. See
# typography_fix.html for the checked invariants.
#
# Requires a headless Chromium and the site to be reachable (Apache).
# Override with TYPOGRAPHY_GUARD_BASE_URL / CHROME_BIN if needed.

set -e

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

BASE_URL="${TYPOGRAPHY_GUARD_BASE_URL:-http://localhost/asanai/blog/tests/typography_fix.html}"
CHROME="${CHROME_BIN:-chromium}"

if ! command -v "$CHROME" >/dev/null 2>&1; then
	echo "typography_fix: SKIP ($CHROME not found)"
	exit 0
fi

if command -v curl >/dev/null 2>&1 && ! curl -s -o /dev/null --max-time 5 "$BASE_URL"; then
	echo "typography_fix: SKIP (site not reachable at $BASE_URL)"
	exit 0
fi

OUT="$("$CHROME" --headless --no-sandbox --disable-gpu \
	--virtual-time-budget=8000 --timeout=20000 \
	--dump-dom "$BASE_URL" 2>/dev/null || true)"

if echo "$OUT" | grep -q "<title>TYPOGRAPHY_FIX PASS"; then
	echo "typography_fix: PASS"
	exit 0
fi

echo "typography_fix: FAIL"
echo "$OUT" | grep -o "<title>TYPOGRAPHY_FIX FAIL[^<]*" | head -3 || true
exit 1
