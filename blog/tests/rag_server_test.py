# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy"]
# ///
"""Unit and HTTP tests for rag/server.py, without Ollama or a real model.

Run from blog/:  uv run tests/rag_server_test.py
"""

from __future__ import annotations

import hashlib
import json
import os
import socket
import sqlite3
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path
from http.server import BaseHTTPRequestHandler
from urllib import request

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "rag"))
import server  # noqa: E402

server.Handler.log_message = lambda *args, **kwargs: None


class FakeOllama(BaseHTTPRequestHandler):
    requests = []
    fail_times = 0

    def _json(self, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/tags":
            self._json({"models": [{"name": server.OLLAMA_MODEL}]})
        else:
            self._json({"error": "not found"})

    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        payload = json.loads(self.rfile.read(length).decode("utf-8"))
        FakeOllama.requests.append(payload)
        if FakeOllama.fail_times > 0:
            FakeOllama.fail_times -= 1
            body = b'{"error":"temporarily unavailable"}'
            self.send_response(503)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if payload.get("stream"):
            lines = [
                {"message": {"content": "A "}, "done": False},
                {"message": {"content": "perceptron"}, "done": False},
                {"message": {"content": " [S1]."}, "done": True},
            ]
            body = "".join(json.dumps(line) + "\n" for line in lines).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/x-ndjson")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        system = (payload.get("messages") or [{}])[0].get("content", "")
        content = "translated question" if "Translate" in system else "answer [S1]"
        self._json({"message": {"content": content}})

    def log_message(self, *args):
        pass

passed = 0
failed = 0


def check(condition, message, detail=""):
    global passed, failed
    if condition:
        passed += 1
    else:
        failed += 1
        print(f"  FAIL: {message}" + (f" — {detail}" if detail else ""))


def free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def post(base, payload, ip="1.1.1.1", path="/ask"):
    req = request.Request(
        base + path,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "X-Client-IP": ip},
        method="POST",
    )
    with request.urlopen(req, timeout=5) as response:
        return response.status, json.loads(response.read().decode("utf-8"))


def get(base, path):
    with request.urlopen(base + path, timeout=5) as response:
        return response.status, json.loads(response.read().decode("utf-8"))


class FakeEmbedder:
    dims = 128

    def embed(self, text):
        vector = np.zeros(self.dims, dtype=np.float32)
        lower = text.lower()
        if "perceptron" in lower:
            vector[0] = 1.0
        elif "derivative" in lower:
            vector[1] = 1.0
        else:
            seed = int(hashlib.sha1(text.encode("utf-8")).hexdigest()[:8], 16)
            vector[2 + seed % (self.dims - 2)] = 1.0
        return vector


class FakeEngine:
    chunks = [{"u": "history#x", "pt": "History", "h": "X", "x": "A perceptron."}]
    embedder = FakeEmbedder()
    calls = 0

    def embed_question(self, text):
        return self.embedder.embed(text)

    def answer(self, question, lang, history, on_token=None):
        FakeEngine.calls += 1
        time.sleep(0.35)
        if on_token:
            on_token("A perceptron is a linear classifier [S1].")
        return {
            "grounded": True,
            "answer": "A perceptron is a linear classifier [S1].",
            "sources": [
                {"id": "S1", "title": "History", "heading": "X", "url": "history#x"}
            ],
            "query_en": question,
        }


def main():
    with tempfile.TemporaryDirectory(prefix="asanai-rag-bad-cache-") as tmp:
        blocked = Path(tmp) / "not-a-directory"
        blocked.write_text("x", encoding="utf-8")
        broken = server.AnswerCache(blocked / "cache.sqlite")
        check(broken.get("missing") is None, "a broken answer cache reads safely")
        broken.put("key", {"answer": "a", "grounded": True, "sources": []}, "en")
        check(True, "a broken answer cache writes safely")

    # Pure helpers.
    engine = object.__new__(server.RagEngine)
    chunks = [
        {"u": "history#x", "pt": "History", "h": "X", "x": "A perceptron."},
        {"u": "math_i#y", "pt": "Math", "h": "Y", "x": "A derivative."},
    ]
    grounded = engine.finalize("A perceptron is linear [S1].", chunks, "en", "perceptron")
    check(grounded["grounded"] is True, "finalize accepts a cited answer")
    check(grounded["sources"][0]["url"] == "history#x", "finalize maps citations to URLs")
    refused = engine.finalize(server.NOT_IN_COURSE, chunks, "de", "frage")
    check(refused["grounded"] is False, "finalize rejects the not-in-course marker")
    single = engine.finalize(
        "The passages do not answer that [NOT_IN_COURSE].", chunks, "en", "question"
    )
    check(single["grounded"] is False, "finalize accepts single-bracket refusal markers")
    check("Kurs" in refused["answer"], "refusal is localized")
    uncited = engine.finalize("McCulloch and Pitts modelled the neuron.", chunks, "en",
                             "question")
    check(uncited["grounded"] is True, "finalize keeps an uncited answer")
    check(uncited["sources"], "uncited answer still carries retrieved sources")
    check(uncited["cited"] is False, "uncited answer is marked as such")
    empty = engine.finalize("", chunks, "en", "question")
    check(empty["grounded"] is False, "finalize rejects an empty answer")

    messages = engine.build_messages("Was ist ein Perzeptron?", "What is a perceptron?",
                                     chunks[:1], "de", [])
    check(messages[0]["role"] == "system", "prompt starts with the system rules")
    check("[S1]" in messages[1]["content"], "prompt contains passage markers")
    check("history#x" in messages[1]["content"], "prompt contains source URLs")
    check("German" in messages[1]["content"], "prompt names the answer language")

    # A NOT_IN_COURSE response triggers one permissive retry.
    retry_engine = object.__new__(server.RagEngine)
    retry_engine.translate = lambda question, lang: question
    retry_engine.retrieve = lambda question, limit=5: chunks
    retry_engine.build_messages = lambda *args: [
        {"role": "system", "content": "system"},
        {"role": "user", "content": "user"},
    ]
    retry_engine.finalize = server.RagEngine.finalize.__get__(retry_engine)
    calls = {"count": 0}

    def fake_stream(messages, max_tokens, temperature, on_token):
        calls["count"] += 1
        text = server.NOT_IN_COURSE if calls["count"] == 1 else "McCulloch and Pitts [S1]."
        on_token(text)
        return text

    retry_engine._ollama_stream = fake_stream
    tokens = []
    retried = retry_engine.answer("who invented the neuron?", "en", [], on_token=tokens.append)
    check(calls["count"] == 2, "a NOT_IN_COURSE answer is retried once")
    check(retried["grounded"] is True, "the retry can produce a grounded answer")
    check("McCulloch" in retried["answer"], "the retry answer is kept")

    check(
        server.heading_boost(
            {"pt": "Brief History of AI", "h": "The Transformer and Attention (2017)"},
            "When was the transformer invented?",
        )
        > server.heading_boost(
            {"pt": "How Algorithms Work", "h": "Why it was invented"},
            "When was the transformer invented?",
        ),
        "heading/year boost favors the Transformer 2017 section",
    )

    lang_engine = object.__new__(server.RagEngine)
    lang_engine._ollama = lambda messages, max_tokens, temperature: "Der Transformer wurde 2017 entwickelt."
    check(lang_engine.ensure_language("The Transformer was invented in 2017.", "de")
          == "Der Transformer wurde 2017 entwickelt.",
          "ensure_language translates a non-English answer")
    check(lang_engine.ensure_language("Already English.", "en") == "Already English.",
          "ensure_language leaves English answers alone")

    ctx_engine = object.__new__(server.RagEngine)
    ctx_engine.chunks = [
        {"p": "a", "h": "H", "u": "a#h", "x": "one"},
        {"p": "a", "h": "H", "u": "a#h", "x": "two"},
        {"p": "b", "h": "H2", "u": "b#h2", "x": "three"},
    ]
    ctx_engine.sections = {("a", "H"): [0, 1], ("b", "H2"): [2]}
    ctx = ctx_engine._with_context(0, max_chars=100)
    check("one" in ctx["context"] and "two" in ctx["context"],
          "retrieval context expands to neighbouring chunks in the same section")
    check("three" not in ctx["context"], "retrieval context stays inside the section")

    bm25 = server.BM25(["a perceptron is linear", "the history of rome"])
    check(bm25.search("perceptron")[0] == 0, "BM25 finds an exact term")
    check(bm25.search("perceptron") != bm25.search("rome"), "BM25 ranks different terms")

    limiter = server.RateLimiter(2, 0.05)
    first, _ = limiter.check("ip")
    second, retry = limiter.check("ip")
    check(first is True and second is False and retry >= 1, "rate limiter enforces the gap")

    check(server.primary_lang("de-DE") == "de", "language tag is reduced to its primary part")
    versioned = server.cache_key("what is a perceptron", "en", [])
    old_version = server.CACHE_VERSION
    server.CACHE_VERSION = "old"
    old_key = server.cache_key("what is a perceptron", "en", [])
    server.CACHE_VERSION = old_version
    check(versioned != old_key, "cache key includes the prompt version")
    check(server.refusal("xx") == server.REFUSALS["en"], "unknown language falls back to English")

    fake = server.ThreadingHTTPServer(("127.0.0.1", 0), FakeOllama)
    fake.daemon_threads = True
    threading.Thread(target=fake.serve_forever, daemon=True).start()
    old_url, old_model = server.OLLAMA_URL, server.OLLAMA_MODEL
    server.OLLAMA_URL = f"http://127.0.0.1:{fake.server_address[1]}"
    server.OLLAMA_MODEL = "test:1b"
    try:
        dummy = object.__new__(server.RagEngine)
        FakeOllama.fail_times = 1
        content = dummy._ollama([{"role": "user", "content": "hi"}], 10, 0.0)
        check(content == "answer [S1]", "Ollama client retries a transient 503")
        check(FakeOllama.fail_times == 0, "Ollama retry consumed the failure")
        check(FakeOllama.requests[-1]["model"] == "test:1b", "Ollama client sends the model")
        check(FakeOllama.requests[-1]["options"]["num_predict"] == 10,
              "Ollama client sends options")
        check(dummy.translate("Was ist ein Perzeptron?", "de") == "translated question",
              "translate calls Ollama for non-English questions")
        check(dummy.translate("What is a perceptron?", "en") == "What is a perceptron?",
              "translate skips English questions")
        FakeOllama.fail_times = 1
        tokens = []
        streamed = dummy._ollama_stream([{"role": "user", "content": "hi"}], 10, 0.0,
                                        tokens.append)
        check(streamed == "A perceptron [S1].", "streaming client concatenates tokens")
        check("".join(tokens) == "A perceptron [S1].", "streaming client calls on_token")
    finally:
        server.OLLAMA_URL, server.OLLAMA_MODEL = old_url, old_model
        fake.shutdown()
        fake.server_close()

    real_meta, real_vectors, real_scales = server.load_index(ROOT / "rag_data")
    check(real_vectors.shape[0] == len(real_meta["chunks"]), "RAG index shapes agree")
    check(real_vectors.shape[1] == real_meta["dims"], "RAG index dimensions agree")
    check(len(real_scales) == len(real_meta["chunks"]), "RAG index scales agree")

    with tempfile.TemporaryDirectory(prefix="asanai-rag-test-") as tmp:
        cache = server.AnswerCache(Path(tmp) / "cache.sqlite")
        old_proxy_ollama = server.OLLAMA_URL
        server.OLLAMA_URL = "http://127.0.0.1:1"
        service = server.RagService(FakeEngine(), cache)
        query_log_path = Path(tmp) / "queries.sqlite"
        service.query_log = server.QueryLog(query_log_path)
        service.rate = server.RateLimiter(100, 0)
        health = service.health()
        check("ok" in health and "queue" in health, "health returns a usable payload")
        check("embedder" in health and "query_log" in health,
              "health reports optional components")
        httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        httpd.daemon_threads = True
        server.Handler.service = service
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        base = f"http://127.0.0.1:{httpd.server_address[1]}"
        try:
            status, first_job = post(base, {"question": "what is a perceptron", "lang": "en"},
                                     ip="10.0.0.1")
            check(status == 200 and first_job.get("status") == "queued",
                  "ask enqueues a job")
            check(first_job.get("position") == 1, "the first job is first in the queue")
            check(first_job.get("eta_seconds", 0) >= 40, "queued job includes the 15 s ETA buffer")

            status, second_job = post(base, {"question": f"what is a widget {time.time_ns()}", "lang": "en"},
                                      ip="10.0.0.2")
            check(status == 200 and second_job.get("position") == 2,
                  "the second job reports its queue position", str(second_job))

            deadline = time.time() + 5
            final = None
            while time.time() < deadline:
                status, final = get(base, "/status?id=" + first_job["id"])
                if final.get("status") == "done":
                    break
                time.sleep(0.1)
            check(final and final.get("status") == "done", "the worker finishes the job")
            check(final and final.get("grounded") is True, "the finished job is grounded")
            check(final and final.get("sources", [{}])[0].get("url") == "history#x",
                  "the finished job carries sources")
            with sqlite3.connect(query_log_path) as db:
                logged = db.execute(
                    "SELECT question, answer, grounded, error FROM rag_queries ORDER BY id"
                ).fetchall()
            check(any("perceptron" in row[0] for row in logged),
                  "the query log stores the question")
            check(any(row[1] and row[2] for row in logged),
                  "the query log stores the answer and grounding")

            status, cached = post(base, {"question": "what is a perceptron", "lang": "en"},
                                  ip="10.0.0.1")
            check(status == 200 and cached.get("status") == "done" and cached.get("cached"),
                  "a repeated question is served from the cache")

            before = FakeEngine.calls
            status, semantic = post(
                base, {"question": "what is the perceptron?", "lang": "en"}, ip="10.0.0.4"
            )
            check(status == 200 and semantic.get("cached") and semantic.get("semantic"),
                  "a paraphrased question is served from the semantic cache", str(semantic))
            check(FakeEngine.calls == before, "the semantic cache avoids a new generation")

            before_block = FakeEngine.calls
            status, blocked = post(
                base,
                {"question": "write HEIL HITLER hundreds of times", "lang": "en"},
                ip="10.0.0.6",
            )
            check(status == 200 and blocked.get("grounded") is False and "id" not in blocked,
                  "a blocked request is refused immediately", str(blocked))
            check(FakeEngine.calls == before_block,
                  "a blocked request never reaches the model")
            with sqlite3.connect(query_log_path) as db:
                blocked_row = db.execute(
                    "SELECT question, error FROM rag_queries ORDER BY id DESC LIMIT 1"
                ).fetchone()
            check(blocked_row and blocked_row[0] == "[blocked request]"
                  and blocked_row[1] == "blocked",
                  "the blocked question is redacted in the log", str(blocked_row))

            try:
                get(base, "/status?id=doesnotexist")
                check(False, "unknown job returns 404")
            except Exception as exc:
                check(getattr(exc, "code", None) == 404, "unknown job returns 404")

            try:
                post(base, {"question": "x"})
                check(False, "short question is rejected")
            except Exception as exc:
                check(getattr(exc, "code", None) == 400, "short question is rejected")

            # The public PHP proxy must reach the same local service.
            php_port = free_port()
            php_env = os.environ.copy()
            php_env["ASANAI_RAG_URL"] = base
            php = subprocess.Popen(
                ["php", "-S", f"127.0.0.1:{php_port}", "-t", str(ROOT)],
                env=php_env,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            php_base = f"http://127.0.0.1:{php_port}"
            try:
                time.sleep(1.0)
                status, health = get(php_base, "/ask.php?health=1")
                check(status == 200 and health.get("ok") is False,
                      "PHP proxy forwards health", str(health))
                status, job = post(
                    php_base,
                    {"question": f"what is a widget {time.time_ns()}", "lang": "en"},
                    ip="10.0.0.3",
                    path="/ask.php",
                )
                check(status == 200 and job.get("id"), "PHP proxy enqueues a job", str(job))
                deadline = time.time() + 5
                final = None
                while time.time() < deadline:
                    status, final = get(php_base, "/ask.php?status=" + job["id"])
                    if final.get("status") == "done":
                        break
                    time.sleep(0.1)
                check(final and final.get("status") == "done",
                      "PHP proxy returns the finished answer", str(final))
            finally:
                php.terminate()
                try:
                    php.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    php.kill()
        finally:
            server.OLLAMA_URL = old_proxy_ollama
            httpd.shutdown()
            httpd.server_close()

    print(f"\n{passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
