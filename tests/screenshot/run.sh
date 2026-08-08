#!/usr/bin/env bash
#
# Screenshot regression test for asanAI.
#
# Thin wrapper that invokes take_screenshot.py with the parameters from the
# current environment (and CLI flags).
#
# Exit codes:
#   0  - screenshot matches reference (or --update succeeded)
#   1  - screenshot differs from reference
#   2  - bad usage / missing dependency
#
# Environment variables (also see take_screenshot.py --help):
#   SCREENSHOT_URL              URL to screenshot (default: http://localhost:1122/)
#   SCREENSHOT_WIDTH            Viewport width  (default: 1300)
#   SCREENSHOT_HEIGHT           Viewport height (default: 1500)
#   SCREENSHOT_REFERENCE        Reference PNG (default: tests/screenshot/reference.png)
#   SCREENSHOT_READY_SELECTOR   Selector that signals the app is loaded
#                               (default: #mainsite)
#   SCREENSHOT_READY_TIMEOUT_MS How long to wait for that selector
#                               (default: 30000)
#   SCREENSHOT_SETTLE_MS        Extra settle time after ready (default: 1500)
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Locate a python that has playwright available. The test runner activates a
# virtualenv at ~/.asanai_test_env before invoking us; honor that.
PYTHON_BIN="${PYTHON:-python3}"
if [[ -f "$HOME/.asanai_test_env/bin/activate" ]]; then
	# shellcheck disable=SC1091
	source "$HOME/.asanai_test_env/bin/activate"
	PYTHON_BIN=python
fi

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
	echo "ERROR: $PYTHON_BIN was not found on PATH." >&2
	exit 2
fi

# Make sure playwright is importable; if not, point the user at the right fix.
if ! "$PYTHON_BIN" -c "import playwright" >/dev/null 2>&1; then
	echo "ERROR: Playwright is not installed for $PYTHON_BIN." >&2
	echo "Run the project test setup (e.g. ./run_tests) which installs it in ~/.asanai_test_env," >&2
	echo "or install it manually: $PYTHON_BIN -m pip install playwright && $PYTHON_BIN -m playwright install chromium" >&2
	exit 2
fi

# Make sure Pillow is importable for the pixel comparison.
if ! "$PYTHON_BIN" -c "from PIL import Image" >/dev/null 2>&1; then
	echo "ERROR: Pillow (python3-pil) is required for pixel comparison." >&2
	echo "Install it with:    sudo apt install python3-pil" >&2
	echo "                or: $PYTHON_BIN -m pip install --user Pillow" >&2
	exit 2
fi

exec "$PYTHON_BIN" "$SCRIPT_DIR/take_screenshot.py" "$@"
