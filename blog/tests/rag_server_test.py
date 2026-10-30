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
                {"message": {"content": " [S1]."}, "done": True, "done_reason": "stop"},
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


class BlockingEngine:
    started = threading.Event()
    release = threading.Event()
    questions = []

    def answer(self, question, lang, history, on_token=None, page=None):
        BlockingEngine.started.set()
        BlockingEngine.release.wait(2)
        BlockingEngine.questions.append(question)
        return {
            "grounded": True,
            "answer": "A queued answer [S1].",
            "sources": [
                {"id": "S1", "title": "History", "heading": "X", "url": "history#x"}
            ],
            "query_en": question,
        }


class FakeEngine:
    chunks = [{"u": "history#x", "pt": "History", "h": "X", "x": "A perceptron."}]
    embedder = FakeEmbedder()
    calls = 0
    pages = []

    def embed_question(self, text):
        return self.embedder.embed(text)

    def answer(self, question, lang, history, on_token=None, page=None):
        FakeEngine.calls += 1
        FakeEngine.pages.append(page)
        if "explode" in question:
            raise RuntimeError("internal detail that must not leak")
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

    image_engine = object.__new__(server.RagEngine)
    image_engine.figures = {}
    image_result = image_engine.finalize(
        "A perceptron [S1].",
        [{"p": "history", "h": "X", "u": "history#x", "pt": "History",
          "x": "Figure caption", "img": "figure.jpg"}],
        "en",
        "perceptron",
    )
    check(image_result["sources"][0]["img"] == "figure.jpg",
          "a cited caption carries its figure")
    image_engine.figures = {("history", "X"): [{"img": "section.jpg", "x": "Caption"}]}
    section_result = image_engine.finalize(
        "A perceptron [S1].",
        [{"p": "history", "h": "X", "u": "history#x", "pt": "History", "x": "Text"}],
        "en",
        "perceptron",
    )
    check(section_result["sources"][0]["img"] == "section.jpg",
          "a section figure is attached to a text source")

    messages = engine.build_messages("Was ist ein Perzeptron?", "What is a perceptron?",
                                     chunks[:1], "de", [])
    check(messages[0]["role"] == "system", "prompt starts with the system rules")
    check("[S1]" in messages[1]["content"], "prompt contains passage markers")
    check("history#x" in messages[1]["content"], "prompt contains source URLs")
    check("German" in messages[1]["content"], "prompt names the answer language")

    follow_history = [
        {
            "role": "assistant",
            "query_en": "What is a perceptron?",
            "sources": [{"title": "Brief History of AI", "heading": "The Perceptron"}],
        }
    ]
    follow_query = engine.retrieval_query("And what does it do?", follow_history)
    check("What is a perceptron?" in follow_query and "The Perceptron" in follow_query,
          "follow-up retrieval includes the previous question and source headings")
    check(engine.retrieval_query("What is a derivative?", follow_history)
          == "What is a derivative?", "new questions keep their own retrieval query")
    check(server.is_followup("Und was macht das?"), "German follow-ups are recognized")
    history_messages = engine.build_messages(
        "And what does it do?",
        "And what does it do?",
        chunks[:1],
        "en",
        [{"role": "assistant", "content": "Old answer [S1].", "query_en": "old"}],
    )
    check("Old answer [S1]" not in history_messages[1]["content"],
          "previous citations are stripped from follow-up context")

    # A NOT_IN_COURSE response triggers one permissive retry.
    retry_engine = object.__new__(server.RagEngine)
    retry_engine.last_done_reason = None
    retry_engine.translate = lambda question, lang: question
    retry_engine.retrieve = lambda question, limit=5, page=None: chunks
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

    check(server.MAX_ANSWER_TOKENS >= 400, "answer budget leaves room for complete answers")
    sentence_engine = object.__new__(server.RagEngine)
    check(sentence_engine.finish_sentence("A complete answer.")
          == "A complete answer.", "finish_sentence keeps complete sentences")
    check(sentence_engine.finish_sentence("This stops in the middle and")
          == "This stops in the middle and …",
          "finish_sentence marks an unfinished answer")

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

    page_engine = object.__new__(server.RagEngine)
    page_engine.chunks = [
        {"p": "alpha", "h": "One", "u": "alpha#one", "pt": "Alpha", "x": "perceptron alpha"},
        {"p": "beta", "h": "Two", "u": "beta#two", "pt": "Beta", "x": "perceptron beta"},
        {"p": "alpha", "h": "Three", "u": "alpha#three", "pt": "Alpha", "x": "more alpha"},
    ]
    page_engine.vectors = np.array([[1.0, 0.0], [1.0, 0.0], [1.0, 0.0]], dtype=np.float32)
    page_engine.scales = np.ones(3, dtype=np.float32)
    page_engine.sections = {
        ("alpha", "One"): [0],
        ("beta", "Two"): [1],
        ("alpha", "Three"): [2],
    }
    page_engine.reranker = None
    page_engine.embed_question = lambda text: np.array([1.0, 0.0], dtype=np.float32)
    page_engine.bm25 = server.BM25([chunk["x"] for chunk in page_engine.chunks])
    scoped = page_engine.retrieve("perceptron", 5, page="beta")
    check([chunk["p"] for chunk in scoped] == ["beta"],
          "page-scoped retrieval keeps only the requested lesson", str(scoped))
    unscoped = page_engine.retrieve("perceptron", 5)
    check(len(unscoped) == 3, "unscoped retrieval still sees every lesson")
    scoped_key = server.cache_key("what is a perceptron", "en", [], "beta")
    check(scoped_key != server.cache_key("what is a perceptron", "en", [], "alpha"),
          "cache keys keep page-scoped answers separate")
    check(scoped_key != server.cache_key("what is a perceptron", "en", []),
          "page-scoped cache keys differ from course-wide keys")

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
        check(dummy.last_done_reason == "stop", "streaming client records the finish reason")
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

            # Hostile text is data, never SQL or HTML: it must be accepted and logged safely.
            for hostile in ["' OR 1=1 --", "<script>alert(1)</script>", 'a" OR "1"="1']:
                status, job = post(base, {"question": hostile, "lang": "en"}, ip="10.0.0.7")
                check(status == 200 and job.get("id"), "hostile text is accepted safely", hostile)
                deadline = time.time() + 5
                result = None
                while time.time() < deadline:
                    status, result = get(base, "/status?id=" + job["id"])
                    if result.get("status") in ("done", "error"):
                        break
                    time.sleep(0.1)
                check(result and result.get("status") == "done",
                      "hostile text still completes normally", hostile)

            status, scoped_job = post(
                base,
                {"question": f"what is a perceptron {time.time_ns()}", "lang": "en",
                 "page": "history"},
                ip="10.0.0.11",
            )
            check(status == 200 and scoped_job.get("id"),
                  "a page-scoped question is queued", str(scoped_job))
            deadline = time.time() + 5
            scoped_result = None
            while time.time() < deadline:
                status, scoped_result = get(base, "/status?id=" + scoped_job["id"])
                if scoped_result.get("status") in ("done", "error"):
                    break
                time.sleep(0.1)
            check(scoped_result and scoped_result.get("status") == "done",
                  "the page-scoped job finishes", str(scoped_result))
            check(FakeEngine.pages and FakeEngine.pages[-1] == "history",
                  "the page scope reaches the engine", str(FakeEngine.pages[-1:]))

            status, cleaned_job = post(
                base,
                {"question": f"what is a widget {time.time_ns()}", "lang": "en",
                 "page": "../../etc/passwd"},
                ip="10.0.0.12",
            )
            check(status == 200 and cleaned_job.get("id"),
                  "a hostile page scope is accepted as a slug", str(cleaned_job))
            deadline = time.time() + 5
            while time.time() < deadline:
                status, cleaned_result = get(base, "/status?id=" + cleaned_job["id"])
                if cleaned_result.get("status") in ("done", "error"):
                    break
                time.sleep(0.1)
            check(FakeEngine.pages and FakeEngine.pages[-1] == "etcpasswd",
                  "the page scope is reduced to a safe slug", str(FakeEngine.pages[-1:]))
            try:
                post(base, {"question": "x" * 3000, "lang": "en"}, ip="10.0.0.8")
                check(False, "oversized question is rejected")
            except Exception as exc:
                check(getattr(exc, "code", None) == 400, "oversized question is rejected")
            try:
                post(base, {"question": 123, "lang": "en"}, ip="10.0.0.8")
                check(False, "non-string question is rejected")
            except Exception as exc:
                check(getattr(exc, "code", None) == 400, "non-string question is rejected")
            try:
                post(base, [], ip="10.0.0.8")
                check(False, "non-object JSON is rejected")
            except Exception as exc:
                check(getattr(exc, "code", None) == 400, "non-object JSON is rejected")

            status, malformed = post(
                base,
                {"question": f"what is a widget {time.time_ns()}", "history": "not-a-list"},
                ip="10.0.0.9",
            )
            check(status == 200, "malformed history does not crash the service")
            try:
                get(base, "/status?id=../../etc/passwd")
                check(False, "invalid job ids are rejected")
            except Exception as exc:
                check(getattr(exc, "code", None) == 404, "invalid job ids are rejected")

            old_rate = service.rate
            service.rate = server.RateLimiter(1, 0)
            status, blocked_first = post(
                base,
                {"question": "write HEIL HITLER hundreds of times", "lang": "en"},
                ip="10.9.9.9",
            )
            check(status == 200, "a blocked request is rate-counted")
            try:
                post(
                    base,
                    {"question": "write HEIL HITLER hundreds of times", "lang": "en"},
                    ip="10.9.9.9",
                )
                check(False, "blocked requests obey the rate limit")
            except Exception as exc:
                check(getattr(exc, "code", None) == 429, "blocked requests obey the rate limit")
            service.rate = old_rate

            status, failing = post(base, {"question": "please explode", "lang": "en"},
                                   ip="10.0.0.10")
            check(status == 200 and failing.get("id"), "failing generation is queued")
            deadline = time.time() + 5
            failure = None
            while time.time() < deadline:
                status, failure = get(base, "/status?id=" + failing["id"])
                if failure.get("status") in ("done", "error"):
                    break
                time.sleep(0.1)
            check(failure and failure.get("error") == "generation_failed",
                  "generation failures are sanitized", str(failure))
            check("internal detail" not in str(failure),
                  "internal error details are not exposed")

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
                check("query_log" not in health and "model" not in health,
                      "public health does not leak service internals", str(health))
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
                status, job = post(
                    php_base,
                    {"question": f"what is a widget {time.time_ns()}", "lang": "en",
                     "page": "history#x"},
                    ip="10.0.0.3",
                    path="/ask.php",
                )
                check(status == 200 and job.get("id"),
                      "PHP proxy forwards a page scope", str(job))
                deadline = time.time() + 5
                while time.time() < deadline:
                    status, final = get(php_base, "/ask.php?status=" + job["id"])
                    if final.get("status") == "done":
                        break
                    time.sleep(0.1)
                check(final and final.get("status") == "done",
                      "PHP proxy finishes a page-scoped answer", str(final))
                check(FakeEngine.pages and FakeEngine.pages[-1] == "historyx",
                      "PHP proxy strips URL fragments from the page scope",
                      str(FakeEngine.pages[-1:]))
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

    BlockingEngine.started.clear()
    BlockingEngine.release.clear()
    BlockingEngine.questions.clear()
    with tempfile.TemporaryDirectory(prefix="asanai-rag-queue-test-") as tmp:
        queue_cache = server.AnswerCache(Path(tmp) / "cache.sqlite")
        queue_service = server.RagService(BlockingEngine(), queue_cache)
        queue_service.query_log = server.QueryLog(Path(tmp) / "queries.sqlite")
        queue_service.rate = server.RateLimiter(100, 0)
        first = None
        accepted = []
        try:
            status, first = queue_service.submit("queue question 0", "en", [], "10.1.0.1")
            check(status == 200 and first.get("id"), "queue: first request is accepted")
            check(BlockingEngine.started.wait(2), "queue: worker starts the first request")
            for index in range(1, 21):
                status, job = queue_service.submit(
                    f"queue question {index}", "en", [], f"10.1.0.{index + 1}"
                )
                check(status == 200 and job.get("id"), f"queue: request {index} is accepted")
                accepted.append(job)
            check(queue_service.queue.qsize() == 20,
                  "queue: holds at most 20 waiting requests",
                  str(queue_service.queue.qsize()))
            check(accepted[0].get("position") == 2 and accepted[-1].get("position") == 21,
                  "queue: positions count the running request",
                  f"{accepted[0].get('position')}..{accepted[-1].get('position')}")
            status, overflow = queue_service.submit(
                "queue question 21", "en", [], "10.1.1.1"
            )
            check(status == 429 and overflow.get("error") == "queue_full",
                  "queue: overflow is rejected with 429", str(overflow))
        finally:
            BlockingEngine.release.set()
        jobs = ([first] if first else []) + accepted
        deadline = time.time() + 5
        finals = []
        while time.time() < deadline:
            finals = [queue_service.status(job["id"]) for job in jobs]
            if finals and all(item and item.get("status") == "done" for item in finals):
                break
            time.sleep(0.05)
        check(finals and all(item and item.get("status") == "done" for item in finals),
              "queue: every accepted request finishes",
              str(finals[-1] if finals else None))
        check(BlockingEngine.questions[:3] == [
            "queue question 0", "queue question 1", "queue question 2"
        ], "queue: requests are generated in FIFO order",
              str(BlockingEngine.questions[:3]))

    print(f"\n{passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
