#!/usr/bin/env bash
# Switch the Ollama model without editing files by hand.
#
#   sudo ./set-model.sh qwen2.5:0.5b
#   sudo ./set-model.sh qwen2.5:1.5b
set -euo pipefail

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
	echo "Run as root: sudo $0 <model>" >&2
	exit 1
fi

MODEL="${1:-}"
if [ -z "$MODEL" ]; then
	echo "Usage: sudo $0 <ollama-model>" >&2
	exit 1
fi
if ! [[ "$MODEL" =~ ^[A-Za-z0-9._:/-]+$ ]]; then
	echo "Refusing a model name with unexpected characters: $MODEL" >&2
	exit 1
fi

sed -i "s|^OLLAMA_MODEL=.*|OLLAMA_MODEL=$MODEL|" /etc/asanai-rag.env
ollama pull "$MODEL"
systemctl restart asanai-rag
sleep 1
curl -fsS "http://127.0.0.1:8090/health" || true
