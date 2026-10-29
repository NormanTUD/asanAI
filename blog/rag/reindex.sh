#!/usr/bin/env bash
# Rebuild the retrieval index after editing lessons, literature.js or
# search_lib.php, then restart the answer service.
set -euo pipefail

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
	echo "Run as root: sudo $0" >&2
	exit 1
fi

set -a
# shellcheck disable=SC1091
source /etc/asanai-rag.env
set +a

SERVICE_DIR="/opt/asanai-rag"

sudo -u www-data env \
	HF_HOME="$HF_HOME" \
	FASTEMBED_CACHE_PATH="$FASTEMBED_CACHE_PATH" \
	"$SERVICE_DIR/venv/bin/python" "$ASANAI_BLOG_DIR/tools/build_rag_index.py" \
		--blog-dir "$ASANAI_BLOG_DIR" \
		--out-dir "$ASANAI_RAG_DATA"

systemctl restart asanai-rag
sleep 1
curl -fsS "http://127.0.0.1:8090/health" || true
