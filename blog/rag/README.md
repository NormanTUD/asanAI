# RAG answer service (optional)

A small, local “Ask the course” chat beside the search. It retrieves passages
from the blog, reranks them, and lets a small CPU-only language model answer
**only** from those passages, with lesson links. No API key, no GPU.

```
browser  ──POST /ask.php──▶  PHP proxy  ──▶  127.0.0.1:8090  (queue + retrieval)
                                                    │
                                                    ├── rag_data/ (static Model2Vec index)
                                                    ├── fastembed reranker (MiniLM)
                                                    └── 127.0.0.1:11434 (Ollama, Qwen2.5)
```

- **Queue:** one generation at a time. The browser shows the queue position and
  an ETA. The queue holds 20 requests; per-IP limits are 20/day and one every
  5 seconds.
- **Grounded answers:** top passages are supplied with `[S1]…` markers. The
  system prompt forbids outside knowledge and requires citations. If the model
  finds no support, it returns a localized “the course does not cover that”.
- **Multilingual:** questions in other languages are translated to English for
  retrieval (the corpus is English); the answer is written in the question’s
  language.
- **Local-only:** the Python service binds to `127.0.0.1`; `ask.php` is the only
  public entry.

## Requirements

- Ubuntu/Debian with `sudo` and `systemd`.
- 2 CPU cores are enough. About 2–3 GB free disk, ~2–3 GB RAM in use.
- The blog directory must be readable by `www-data` (Apache already needs this).
- The current model is **Qwen2.5-1.5B-Instruct** (~1.0 GB, Apache-2.0) with the
  **ms-marco-MiniLM-L-6-v2** reranker (~80 MB, Apache-2.0). The LLM is capped at
  `MemoryMax=2G` in the Ollama drop-in.

## Install

```bash
cd /var/www/asanai/blog/rag
sudo ./install.sh
```

If the blog is somewhere else:

```bash
sudo ASANAI_BLOG_DIR=/srv/asanai/blog ./install.sh
```

The installer is idempotent and does the following:

1. installs Python, PHP CLI/cURL, curl and certificates;
2. installs Ollama if missing;
3. creates `/opt/asanai-rag` and a virtualenv (numpy + fastembed);
4. installs the Ollama memory/CPU limits and the `asanai-rag` systemd unit;
5. `ollama pull qwen2.5:1.5b` (~1 GB);
6. downloads the reranker (~80 MB);
7. builds the retrieval index into `/var/lib/asanai-rag/data`;
8. starts `asanai-rag` and prints the health JSON.

The chat button appears on blog pages automatically once
`http://127.0.0.1:8090/health` reports `"ok": true`. `ask.php` exposes the
health check to the page; a missing service simply means no button.

## Check it

```bash
curl http://127.0.0.1:8090/health
systemctl status asanai-rag
journalctl -u asanai-rag -f
journalctl -u ollama -f
ollama ps
```

A healthy response looks like:

```json
{"ok": true, "ready": true, "ollama": true, "model": "qwen2.5:1.5b", "model_present": true, ...}
```

Ask the public endpoint directly:

```bash
curl -s http://localhost/asanai/blog/ask.php \
  -H 'Content-Type: application/json' \
  -d '{"question":"What is a perceptron?","lang":"en"}' | jq
# -> {"id": "...", "status": "queued", "position": 1, "eta_seconds": 30}
curl -s 'http://localhost/asanai/blog/ask.php?status=<id>' | jq
```

## Rebuild after content changes

Agents and editors already rebuild the browser search indexes:

```bash
uv run blog/tools/build_semantic_index.py
uv run blog/tools/build_rag_index.py
```

After editing lessons, `literature.js` or `search_lib.php`, also rebuild the
server-side RAG index and restart the service:

```bash
sudo /opt/asanai-rag/reindex.sh
```

This calls `blog/tools/build_rag_index.py`, which refreshes
`.search_cache.json` through PHP, re-embeds the full chunks, and writes
`/var/lib/asanai-rag/data/rag_index.json` + `rag_vectors.bin`.

If you only changed CSS or JavaScript, no reindex is needed.

## Switch models

```bash
sudo /opt/asanai-rag/set-model.sh qwen2.5:0.5b    # faster, weaker
sudo /opt/asanai-rag/set-model.sh qwen2.5:1.5b    # default
sudo /opt/asanai-rag/set-model.sh qwen2.5:3b      # better, needs more RAM
```

The script updates `OLLAMA_MODEL` in `/etc/asanai-rag.env`, runs
`ollama pull`, restarts the service and prints the health JSON. Keep the model
under the 2 GB Ollama `MemoryMax`; `3b` at Q4 is already tight with context.

## Tuning

Edit `/etc/asanai-rag.env` and `systemctl restart asanai-rag`:

| Variable | Default | Meaning |
|---|---|---|
| `OLLAMA_MODEL` | `qwen2.5:1.5b` | Generation model |
| `RERANK_MODEL` | `Xenova/ms-marco-MiniLM-L-6-v2` | Cross-encoder |
| `MAX_QUEUE` | `20` | Pending requests before 429 |
| `MAX_ANSWER_TOKENS` | `220` | Answer length |
| `NUM_CTX` | `4096` | Context window |
| `RATE_DAY` | `20` | Requests per IP per day |
| `RATE_SECONDS` | `5` | Minimum gap per IP |
| `CACHE_TTL_SECONDS` | `30 days` | Answer cache lifetime |

CPU/memory limits are in `/etc/systemd/system/ollama.service.d/override.conf`
and `asanai-rag.service`. On a 2-core server the defaults leave headroom for
Apache; lower `CPUQuota` if the site feels sluggish.

## Tests

CI never downloads the Ollama model or the reranker:

- `node blog/tests/rag_chat_test.js` — status text, citations and escaping only;
- `uv run blog/tests/rag_index_test.py` — reads the committed index;
- `uv run blog/tests/rag_server_test.py` — fake engine, fake Ollama HTTP server,
  queue/ETA/cache/proxy checks;
- `uv run blog/tests/rag_browser_test.py` — mocks the `ask.php` replies in the
  page, checks the chat UI without a backend.

Only `install.sh` and the real `server.py` use Ollama and the reranker model.

## Uninstall

```bash
sudo systemctl disable --now asanai-rag
sudo rm -f /etc/systemd/system/asanai-rag.service /etc/asanai-rag.env
sudo rm -rf /opt/asanai-rag /var/lib/asanai-rag
sudo rm -rf /etc/systemd/system/ollama.service.d/override.conf
# optional: remove the pulled model
sudo -u ollama ollama rm qwen2.5:1.5b
sudo systemctl daemon-reload
```

The chat button disappears on the next page load because the health check
fails; no site code needs to be removed.
