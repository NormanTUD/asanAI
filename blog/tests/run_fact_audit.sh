#!/usr/bin/env bash
# Compatibility wrapper. The real runner is blog/tools/check_all.py.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
ASANAI_CHECK_ALL_BOOTSTRAPPED=1 exec uv run "$ROOT/blog/tools/check_all.py" "$@"
