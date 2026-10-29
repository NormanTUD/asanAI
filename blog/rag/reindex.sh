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
BLOG_OWNER="$(stat -c '%U' "$ASANAI_BLOG_DIR")"
INDEX_TMP="$(mktemp -d)"
chown "$BLOG_OWNER:$BLOG_OWNER" "$INDEX_TMP"

sudo -u "$BLOG_OWNER" env \
	"$SERVICE_DIR/venv/bin/python" "$ASANAI_BLOG_DIR/tools/build_rag_index.py" \
		--blog-dir "$ASANAI_BLOG_DIR" \
		--out-dir "$INDEX_TMP"
install -o www-data -g www-data -m 0644 \
	"$INDEX_TMP/rag_index.json" "$INDEX_TMP/rag_vectors.bin" "$ASANAI_RAG_DATA/"
rm -rf "$INDEX_TMP"

systemctl restart asanai-rag
sleep 1
curl -fsS "http://127.0.0.1:8090/health" || true
