# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy"]
# ///
"""Incremental-build test for tools/build_rag_index.py.

Run with:  uv run blog/tests/rag_incremental_test.py

The real embedder is replaced by a deterministic fake, so this test checks the
reuse logic without downloading a model:
  • an unchanged sourceHash makes the second build a no-op
  • a changed page re-embeds only that page's chunks
  • unchanged pages keep byte-identical int8 vectors and scales
  • per-page hashes are stored in the index
"""

from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "tools"))
import build_rag_index as rag  # noqa: E402

PASS = 0
FAIL = 0
FAILURES = []


def check(condition, message):
    global PASS, FAIL
    if condition:
        PASS += 1
    else:
        FAIL += 1
        FAILURES.append(message)
        print(f"  FAIL: {message}")


def page(name, title, text):
    return {
        "name": name,
        "title": title,
        "blocks": [
            {"type": "heading", "text": title, "slug": title.lower()},
            {"type": "text", "text": text},
        ],
    }


def payload(version, text_a):
    return {
        "sourceHash": version,
        "pages": {
            "a": page("a", "Alpha", text_a),
            "b": page("b", "Beta", "Beta " + ("B" * 140)),
        },
    }


def fake_embed(texts, batch_size):
    rows = []
    for text in texts:
        rows.append([
            float(len(text)),
            float(sum(map(ord, text)) % 211),
            float(len(set(text))),
            1.0,
        ])
    return np.asarray(rows, dtype=np.float32)


def main():
    original_load_blocks = rag.load_blocks
    calls = []

    def recording_embed(texts, batch_size):
        calls.append(list(texts))
        return fake_embed(texts, batch_size)

    def fail_embed(texts, batch_size):
        raise AssertionError("unchanged index must not embed")

    try:
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "rag_data"
            current = payload("v1", "Alpha " + ("A" * 140))
            rag.load_blocks = lambda blog_dir: current

            meta1, vectors1, scales1, stats1 = rag.build(
                Path(tmp), out, "fake-model", 900, 8, embed_fn=fake_embed
            )
            check(stats1["fresh"] is False, "first build is not fresh")
            check(stats1["reused"] == 0, "first build reuses nothing")
            check(stats1["embedded"] == meta1["count"], "first build embeds every chunk")
            check("pageHashes" in meta1, "per-page hashes are stored")
            check(set(meta1["pageHashes"]) == {"a", "b"}, "hashes cover both pages")
            check((out / "rag_index.json").exists(), "index json was written")
            check((out / "rag_vectors.bin").exists(), "vector file was written")
            check(not (out / ".rag_index.json.tmp").exists(), "no json temp file left")
            check(not (out / ".rag_vectors.bin.tmp").exists(), "no vector temp file left")

            meta2, vectors2, scales2, stats2 = rag.build(
                Path(tmp), out, "fake-model", 900, 8, embed_fn=fail_embed
            )
            check(stats2["fresh"] is True, "same sourceHash is a no-op")
            check(stats2["embedded"] == 0, "fresh build embeds nothing")
            check(np.array_equal(vectors2, vectors1), "fresh build keeps vectors")

            calls.clear()
            current = payload("v2", "Alpha changed " + ("A" * 140))
            meta3, vectors3, scales3, stats3 = rag.build(
                Path(tmp), out, "fake-model", 900, 8, embed_fn=recording_embed
            )
            check(stats3["fresh"] is False, "changed sourceHash rebuilds")
            check(stats3["pages_changed"] == ["a"], "only page a is reported changed")
            check(stats3["embedded"] < meta3["count"], "changed build reuses some chunks")
            check(stats3["embedded"] > 0, "changed page is re-embedded")
            check(len(calls) == 1, "embedder is called once")
            check(
                all("Alpha changed" in text or "Alpha" in text for text in calls[0]),
                "only page-a chunks are embedded",
            )

            indexed = {
                (chunk["p"], chunk["u"], chunk["x"]): i
                for i, chunk in enumerate(meta3["chunks"])
            }
            for i, chunk in enumerate(meta2["chunks"]):
                if chunk["p"] != "b":
                    continue
                j = indexed[(chunk["p"], chunk["u"], chunk["x"])]
                check(
                    np.array_equal(vectors3[j], vectors2[i])
                    and scales3[j] == scales2[i],
                    "unchanged page b row is byte-identical",
                )

            meta_path = out / "rag_index.json"
            loaded = json.loads(meta_path.read_text(encoding="utf-8"))
            check(loaded["count"] == meta3["count"], "index count matches meta")
            check(loaded["sourceHash"] == "v2", "index records the new sourceHash")

            (out / "rag_vectors.bin").write_bytes(b"broken")
            check(rag.load_existing(out, "fake-model") is None, "corrupt vectors are rejected")
    finally:
        rag.load_blocks = original_load_blocks

    print(f"\n{PASS} passed, {FAIL} failed")
    if FAILURES:
        for message in FAILURES:
            print(f"  - {message}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
