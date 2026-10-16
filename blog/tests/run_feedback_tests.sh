#!/usr/bin/env bash
# Blog Feedback — Master Test Runner
# ------------------------------------
# Runs every feedback-system test, in order, with clear pass/fail output.
# Safe to run against a real production database — every test uses an
# isolated temp dir and never touches the user's actual data.
#
# Usage:  bash blog/tests/run_feedback_tests.sh

set -uo pipefail

cd "$(dirname "$0")/../.."

echo "================================================================"
echo "  Blog Feedback Test Suite"
echo "================================================================"
echo ""

overall=0
failures=()

run() {
    local name="$1"; shift
    echo "── $name ──"
    if "$@"; then
        echo "  ✓ $name PASSED"
    else
        echo "  ✗ $name FAILED"
        failures+=("$name")
        overall=$((overall + 1))
    fi
    echo ""
}

# 1. PHP integration tests (spins up isolated server)
run "PHP integration tests" \
    php blog/tests/feedback_api_test.php

# 2. JS unit tests
run "JS unit tests" \
    node blog/tests/feedback_anchor_test.js

# 3. Python render tests (spins up server, fetches pages)
run "Python render tests" \
    uv run blog/tests/feedback_render_test.py

# 4. Python validation tests (static checks, no DB)
run "Python validation tests" \
    uv run blog/tests/feedback_validation_test.py

# 5. Existing blog validators (catch regressions in shared infra)
run "Blog PHP validator" \
    uv run blog/tests/php_validator.py blog/

run "Blog JS validator" \
    uv run blog/tests/js_validator.py blog/feedback/

echo "================================================================"
if [ "$overall" -eq 0 ]; then
    echo "  ALL FEEDBACK TESTS PASSED ✓"
    echo "================================================================"
    exit 0
else
    echo "  ${#failures[@]} TEST SUITE(S) FAILED:"
    for f in "${failures[@]}"; do
        echo "    ✗ $f"
    done
    echo "================================================================"
    exit 1
fi
