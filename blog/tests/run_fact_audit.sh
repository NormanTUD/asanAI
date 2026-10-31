#!/usr/bin/env bash
# Run the blog fact/consistency checks from the repository root.
# Usage: bash blog/tests/run_fact_audit.sh [--fast]
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

FAST=0
if [[ "${1:-}" == "--fast" ]]; then
	FAST=1
fi

echo "== fact consistency"
uv run blog/tests/fact_consistency_test.py

echo "== course order"
uv run blog/tests/course_order_test.py blog/

echo "== lesson guards (includes course order)"
uv run blog/tests/lesson_guard.py blog/

echo "== php validator"
uv run blog/tests/php_validator.py blog/

echo "== js validator"
uv run blog/tests/js_validator.py blog/

echo "== literature duplicate keys"
uv run blog/tests/literature_dup_keys.py blog/

echo "== fact ledger (unit tests + cross-lesson check)"
uv run blog/tests/fact_ledger_test.py
uv run blog/tools/factcheck/check_facts.py blog/ --strict-relations --strict-quotes

echo "== node unit tests"
for test in topics math_alt keypoint search_js semantic_js rag_chat; do
	node "blog/tests/${test}_test.js"
done

if [[ "$FAST" -eq 0 ]]; then
	echo "== semantic index freshness"
	uv run blog/tests/semantic_index_test.py

	echo "== rag index freshness"
	uv run blog/tests/rag_index_test.py

	echo "== rag incremental builder"
	uv run blog/tests/rag_incremental_test.py

	echo "== atlas data"
	(cd blog && python3 atlas_data/atlas_check.py)
fi

echo "== all fact/consistency checks passed (fast=$FAST)"
