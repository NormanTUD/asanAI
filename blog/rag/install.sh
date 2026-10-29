#!/usr/bin/env bash
# Install the optional asanAI RAG answer service on Ubuntu/Debian.
#
#   cd /var/www/asanai/blog/rag
#   sudo ./install.sh
#
# Optional overrides:
#   sudo ASANAI_BLOG_DIR=/var/www/asanai/blog OLLAMA_MODEL=qwen2.5:1.5b ./install.sh
#
# The script is idempotent: rerun it after updating the blog checkout.
set -euo pipefail

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
	echo "Please run this installer as root: sudo ./install.sh" >&2
	exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOG_DIR="${ASANAI_BLOG_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
SERVICE_DIR="/opt/asanai-rag"
DATA_DIR="/var/lib/asanai-rag"
RAG_DATA="$DATA_DIR/data"
MODEL="${OLLAMA_MODEL:-qwen2.5:1.5b}"
RERANK_MODEL="${RERANK_MODEL:-Xenova/ms-marco-MiniLM-L-6-v2}"

if [ ! -f "$BLOG_DIR/tools/build_rag_index.py" ]; then
	echo "error: $BLOG_DIR/tools/build_rag_index.py is missing." >&2
	echo "Point ASANAI_BLOG_DIR at the blog directory." >&2
	exit 1
fi

echo "== asanAI RAG installer =="
echo "blog:      $BLOG_DIR"
echo "service:   $SERVICE_DIR"
echo "data:      $DATA_DIR"
echo "model:     $MODEL"
echo "reranker:  $RERANK_MODEL"
echo

echo "[1/8] Installing system packages"
apt-get update
apt-get install -y \
	python3 python3-venv python3-pip \
	php-cli php-curl \
	curl ca-certificates

echo "[2/8] Installing Ollama"
if ! command -v ollama >/dev/null 2>&1; then
	curl -fsSL https://ollama.com/install.sh | sh
else
	echo "Ollama already installed"
fi

echo "[3/8] Creating service directories and virtualenv"
install -d -m 0755 "$SERVICE_DIR"
install -d -m 0755 -o www-data -g www-data "$DATA_DIR" "$RAG_DATA"
install -d -m 0755 -o www-data -g www-data "$DATA_DIR/hf" "$DATA_DIR/fastembed"
chown -R www-data:www-data "$DATA_DIR"
install -m 0644 "$SCRIPT_DIR/server.py" "$SCRIPT_DIR/requirements.txt" "$SCRIPT_DIR/README.md" "$SERVICE_DIR/"
install -m 0755 "$SCRIPT_DIR/reindex.sh" "$SCRIPT_DIR/set-model.sh" "$SERVICE_DIR/"
python3 -m venv "$SERVICE_DIR/venv"
"$SERVICE_DIR/venv/bin/pip" install --upgrade pip
"$SERVICE_DIR/venv/bin/pip" install -r "$SERVICE_DIR/requirements.txt"

echo "[4/8] Configuring Ollama limits and the service user"
install -d -m 0755 /etc/systemd/system/ollama.service.d
install -m 0644 "$SCRIPT_DIR/ollama-override.conf" /etc/systemd/system/ollama.service.d/override.conf

cat > /etc/asanai-rag.env <<EOF
ASANAI_BLOG_DIR=$BLOG_DIR
ASANAI_RAG_DATA=$RAG_DATA
ASANAI_RAG_CACHE=$DATA_DIR/cache.sqlite
ASANAI_RAG_HOST=127.0.0.1
ASANAI_RAG_PORT=8090

OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=$MODEL
RERANK_MODEL=$RERANK_MODEL

HF_HOME=$DATA_DIR/hf
FASTEMBED_CACHE_PATH=$DATA_DIR/fastembed

MAX_QUEUE=20
MAX_QUESTION_CHARS=2000
MAX_ANSWER_TOKENS=220
NUM_CTX=4096
REQUEST_TIMEOUT=180
RATE_DAY=20
RATE_SECONDS=5
CACHE_TTL_SECONDS=2592000
INITIAL_ETA_SECONDS=30
EOF
chown root:www-data /etc/asanai-rag.env
chmod 0640 /etc/asanai-rag.env

echo "[5/8] Pulling the language model (about 1 GB)"
systemctl daemon-reload
systemctl enable --now ollama
systemctl restart ollama
ollama pull "$MODEL"

echo "[6/8] Downloading the reranker (about 80 MB)"
sudo -u www-data env \
	HF_HOME="$DATA_DIR/hf" \
	FASTEMBED_CACHE_PATH="$DATA_DIR/fastembed" \
	"$SERVICE_DIR/venv/bin/python" - "$RERANK_MODEL" <<'PY'
import sys
from fastembed.rerank.cross_encoder import TextCrossEncoder
TextCrossEncoder(sys.argv[1])
print("reranker ready")
PY

echo "[7/8] Building the retrieval index"
# The builder lives in the blog checkout, so it can import the shared chunker.
sudo -u www-data env \
	HF_HOME="$DATA_DIR/hf" \
	FASTEMBED_CACHE_PATH="$DATA_DIR/fastembed" \
	"$SERVICE_DIR/venv/bin/python" "$BLOG_DIR/tools/build_rag_index.py" \
		--blog-dir "$BLOG_DIR" \
		--out-dir "$RAG_DATA"

echo "[8/8] Starting the answer service"
install -m 0644 "$SCRIPT_DIR/asanai-rag.service" /etc/systemd/system/asanai-rag.service
systemctl daemon-reload
systemctl enable --now asanai-rag
sleep 2

echo
echo "== Health =="
curl -fsS "http://127.0.0.1:8090/health" || true
echo
echo "The chat button appears on blog pages when /ask.php reports a healthy service."
echo
echo "Useful commands:"
echo "  journalctl -u asanai-rag -f"
echo "  journalctl -u ollama -f"
echo "  sudo $SERVICE_DIR/reindex.sh          # after content changes"
echo "  sudo $SERVICE_DIR/set-model.sh qwen2.5:0.5b"
echo "  curl http://127.0.0.1:8090/health"
