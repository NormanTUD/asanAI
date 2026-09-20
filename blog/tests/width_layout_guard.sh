#!/bin/bash
# WIDTH LAYOUT GUARD — headless regression test.
#
# Loads the production layout_guardrail.js against a synthetic #contents
# column and asserts that a normal element wider than the reading column is
# flagged while the same width inside a box (.cl-block / .optional) or a
# margin note (.sideimage) is exempt. See width_layout_guard.html for the
# checked invariants.
#
# Requires a headless Chromium and the site to be reachable (Apache).
# Override with WIDTH_GUARD_BASE_URL / CHROME_BIN if needed.

set -e

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

BASE_URL="${WIDTH_GUARD_BASE_URL:-http://localhost/asanai/blog/tests/width_layout_guard.html}"
CHROME="${CHROME_BIN:-chromium}"

if ! command -v "$CHROME" >/dev/null 2>&1; then
	echo "width_layout_guard: SKIP ($CHROME not found)"
	exit 0
fi

if command -v curl >/dev/null 2>&1 && ! curl -s -o /dev/null --max-time 5 "$BASE_URL"; then
	echo "width_layout_guard: SKIP (site not reachable at $BASE_URL)"
	exit 0
fi

OUT="$("$CHROME" --headless --no-sandbox --disable-gpu \
	--virtual-time-budget=15000 --timeout=30000 \
	--dump-dom "$BASE_URL" 2>/dev/null || true)"

# The verdict is set exactly once in <title> (idempotent finish). Match the
# title tag specifically so the script's own source text can never produce a
# false positive.
if echo "$OUT" | grep -q "<title>WIDTH_LAYOUT_GUARD PASS"; then
	echo "width_layout_guard: PASS"
	exit 0
fi

echo "width_layout_guard: FAIL"
echo "$OUT" | grep -o "<title>WIDTH_LAYOUT_GUARD FAIL[^<]*" | head -3 || true
exit 1
