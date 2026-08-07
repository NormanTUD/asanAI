#!/usr/bin/env bash
#
# Screenshot regression test for asanAI.
#
# Takes a headless-chromium screenshot of the running asanAI instance and
# compares it pixel-perfectly against tests/screenshot/reference.png. Use
# --update to regenerate the reference after an intentional UI change.
#
# Exit codes:
#   0  - screenshot matches reference (or --update succeeded)
#   1  - screenshot differs from reference
#   2  - bad usage / missing dependency
#
# Environment variables:
#   SCREENSHOT_URL      URL to screenshot (default: http://localhost:1122/)
#   SCREENSHOT_WIDTH    Viewport width  (default: 1300)
#   SCREENSHOT_HEIGHT   Viewport height (default: 1500)
#   SCREENSHOT_VTB      Virtual-time budget in ms (default: 30000)
#   SCREENSHOT_BIN      Chromium binary (default: auto-detected)
#   SCREENSHOT_TIMEOUT  Timeout for chromium in seconds (default: 90)
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REFERENCE="${SCREENSHOT_REFERENCE:-$SCRIPT_DIR/reference.png}"
URL="${SCREENSHOT_URL:-http://localhost:1122/}"
WIDTH="${SCREENSHOT_WIDTH:-1300}"
HEIGHT="${SCREENSHOT_HEIGHT:-1500}"
VTB="${SCREENSHOT_VTB:-30000}"
TIMEOUT="${SCREENSHOT_TIMEOUT:-90}"

UPDATE=0
while [[ $# -gt 0 ]]; do
	case "$1" in
		--update)
			UPDATE=1
			shift
			;;
		--url=*)
			URL="${1#--url=}"
			shift
			;;
		--width=*)
			WIDTH="${1#--width=}"
			shift
			;;
		--height=*)
			HEIGHT="${1#--height=}"
			shift
			;;
		--reference=*)
			REFERENCE="${1#--reference=}"
			shift
			;;
		--help|-h)
			cat <<EOF
Usage: $(basename "$0") [--update] [options]

Options:
  --update           Overwrite the reference screenshot with the new one.
  --url=URL          Override the URL to screenshot.
  --width=N          Override the viewport width  (default: 1300).
  --height=N         Override the viewport height (default: 1500).
  --reference=PATH   Override the reference screenshot path.

Environment variables: SCREENSHOT_URL, SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT,
SCREENSHOT_VTB, SCREENSHOT_REFERENCE, SCREENSHOT_BIN, SCREENSHOT_TIMEOUT.

Examples:
  $(basename "$0")                       # run the regression test
  $(basename "$0") --update              # regenerate the reference
  SCREENSHOT_URL=http://localhost/ $(basename "$0") --update
EOF
			exit 0
			;;
		*)
			echo "Unknown argument: $1" >&2
			echo "Try '$(basename "$0") --help' for usage." >&2
			exit 2
			;;
	esac
done

RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
RESET=$'\033[0m'

log()  { echo -e "$*"; }
warn() { echo -e "${YELLOW}$*${RESET}" >&2; }
err()  { echo -e "${RED}$*${RESET}" >&2; }
ok()   { echo -e "${GREEN}$*${RESET}"; }

detect_chromium() {
	if [[ -n "${SCREENSHOT_BIN:-}" ]]; then
		echo "$SCREENSHOT_BIN"
		return 0
	fi
	for candidate in chromium chromium-browser google-chrome google-chrome-stable chrome; do
		if command -v "$candidate" >/dev/null 2>&1; then
			command -v "$candidate"
			return 0
		fi
	done
	return 1
}

CHROMIUM_BIN="$(detect_chromium || true)"
if [[ -z "$CHROMIUM_BIN" ]]; then
	err "Could not find a chromium binary on PATH."
	err "Install chromium (e.g. 'sudo apt install chromium' or 'sudo apt install chromium-browser')"
	err "or set SCREENSHOT_BIN=/path/to/chromium."
	exit 2
fi

if ! command -v python3 >/dev/null 2>&1; then
	err "python3 is required for pixel comparison but was not found."
	exit 2
fi

if ! python3 -c "from PIL import Image" >/dev/null 2>&1; then
	warn "Pillow is not installed for system python3; attempting to install it..."
	if command -v sudo >/dev/null 2>&1; then
		if ! sudo -n true >/dev/null 2>&1; then
			err "Pillow is missing and sudo is not passwordless; install it manually:"
			err "    sudo apt install python3-pil"
			err "or run:    pip3 install --user Pillow"
			exit 2
		fi
		SUDO="sudo"
	else
		SUDO=""
	fi

	if command -v apt-get >/dev/null 2>&1; then
		$SUDO apt-get install -y python3-pil || {
			err "Failed to install python3-pil via apt."
			exit 2
		}
	elif command -v pip3 >/dev/null 2>&1; then
		pip3 install --user Pillow || {
			err "Failed to install Pillow via pip3."
			exit 2
		}
	else
		err "Pillow is missing and neither apt-get nor pip3 is available."
		exit 2
	fi
fi

TMP_DIR="$(mktemp -d -t asanai_screenshot.XXXXXX)"
TMP_SCREENSHOT="$TMP_DIR/screenshot.png"
trap 'rm -rf "$TMP_DIR"' EXIT

log "====== Screenshot test ======"
log "URL:               $URL"
log "Viewport:          ${WIDTH}x${HEIGHT}"
log "Virtual time:      ${VTB} ms"
log "Chromium:          $CHROMIUM_BIN"
log "Reference:         $REFERENCE"
if [[ $UPDATE -eq 1 ]]; then
	log "Mode:              ${YELLOW}update reference${RESET}"
else
	log "Mode:              ${GREEN}compare${RESET}"
fi
log ""

log "Taking screenshot..."
if ! timeout "$TIMEOUT" "$CHROMIUM_BIN" \
	--headless=new \
	--disable-gpu \
	--no-sandbox \
	--hide-scrollbars \
	--virtual-time-budget="$VTB" \
	--window-size="${WIDTH},${HEIGHT}" \
	--screenshot="$TMP_SCREENSHOT" \
	"$URL" >/dev/null 2>"$TMP_DIR/chromium.log"; then
	err "Chromium failed to take a screenshot. Last log lines:"
	tail -n 10 "$TMP_DIR/chromium.log" >&2 || true
	exit 1
fi

if [[ ! -s "$TMP_SCREENSHOT" ]]; then
	err "Chromium did not write a non-empty screenshot at $TMP_SCREENSHOT."
	tail -n 10 "$TMP_DIR/chromium.log" >&2 || true
	exit 1
fi

TMP_SIZE=$(stat -c%s "$TMP_SCREENSHOT" 2>/dev/null || stat -f%z "$TMP_SCREENSHOT" 2>/dev/null || echo "?")
log "Screenshot captured: $TMP_SCREENSHOT ($TMP_SIZE bytes)"
log ""

if [[ $UPDATE -eq 1 ]]; then
	mkdir -p "$(dirname "$REFERENCE")"
	cp "$TMP_SCREENSHOT" "$REFERENCE"
	ok "====== Reference screenshot updated: $REFERENCE ======"
	exit 0
fi

if [[ ! -f "$REFERENCE" ]]; then
	err "Reference screenshot not found: $REFERENCE"
	err "Generate one with:  $(basename "$0") --update"
	exit 1
fi

log "Comparing against reference (pixel-perfect)..."
set +e
	python3 "$SCRIPT_DIR/compare.py" "$REFERENCE" "$TMP_SCREENSHOT"
compare_rc=$?
set -e

log ""
if [[ $compare_rc -eq 0 ]]; then
	ok "====== Screenshot test PASSED ======"
	exit 0
fi

err "====== Screenshot test FAILED ======"
err "Current screenshot:    $TMP_SCREENSHOT"
err "Reference screenshot:  $REFERENCE"
err "To accept the new design, run:"
err "    $(basename "$0") --update"
exit 1
