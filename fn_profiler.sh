#!/usr/bin/env bash
# fn_profiler.sh — CLI installer for fn_profiler.js ("opencodelog")
#
#   bash fn_profiler.sh install     add the profiler <script> to index.php
#   bash fn_profiler.sh uninstall   remove it again
#   bash fn_profiler.sh status      show whether it is installed
#
# After install: reload the app, open the browser console and run
#   __opencodelog.enable()
# reproduce your case, then inspect with
#   __opencodelog.running()
#   __opencodelog.watch(1000)
#   __opencodelog.slowest(20)
#   __opencodelog.disable()

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INDEX="$HERE/index.php"
PROFILER="fn_profiler.js"
SELF_LINE='_js("fn_profiler.js");'
ANCHOR='_js("main.js");'

usage() {
	sed -n '2,14p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

require_files() {
	if [ ! -f "$INDEX" ]; then
		echo "error: $INDEX not found" >&2
		exit 1
	fi
	if [ ! -f "$HERE/$PROFILER" ]; then
		echo "error: $HERE/$PROFILER not found" >&2
		exit 1
	fi
}

cmd_install() {
	require_files
	if grep -qF "$SELF_LINE" "$INDEX"; then
		echo "already installed: $SELF_LINE"
	else
		if ! grep -qF "$ANCHOR" "$INDEX"; then
			echo "error: anchor '$ANCHOR' not found in index.php" >&2
			exit 1
		fi
		sed -i "s|\t\t$ANCHOR|\t\t$ANCHOR\n\n\t\t$SELF_LINE|" "$INDEX"
		echo "installed: $SELF_LINE"
	fi
}

cmd_uninstall() {
	require_files
	if grep -qF "$SELF_LINE" "$INDEX"; then
		tmp="$(mktemp)"
		awk -v self="$SELF_LINE" '
			index($0, self) { skip = 1; next }
			skip && $0 ~ /^[[:space:]]*$/ { skip = 0; next }
			{ skip = 0; print }
		' "$INDEX" > "$tmp"
		mv "$tmp" "$INDEX"
		echo "uninstalled"
	else
		echo "not installed"
	fi
}

cmd_status() {
	require_files
	if grep -qF "$SELF_LINE" "$INDEX"; then
		echo "installed"
	else
		echo "not installed"
	fi
}

case "${1:-}" in
	install) cmd_install ;;
	uninstall) cmd_uninstall ;;
	status) cmd_status ;;
	*)
		usage
		exit 1
		;;
esac
