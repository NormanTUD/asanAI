# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy"]
# ///
"""Checks the server-side RAG retrieval index without loading a model.

Run from blog/:  uv run tests/rag_index_test.py
"""

from __future__ import annotations

import json
import struct
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "rag_data" / "rag_index.json"
VECTORS = ROOT / "rag_data" / "rag_vectors.bin"
MAGIC = 0x4D4E5356

passed = 0
failed = 0


def check(condition, message):
    global passed, failed
    if condition:
        passed += 1
    else:
        failed += 1
        print(f"  FAIL: {message}")


def current_source_hash():
    result = subprocess.run(
        [
            "php",
            "-r",
            "require 'search_lib.php'; echo searchSourceHash(__DIR__, search_excludes());",
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


def main():
    meta = json.loads(INDEX.read_text(encoding="utf-8"))
    data = VECTORS.read_bytes()

    check(meta.get("version") == 1, "RAG index version is 1")
    check(meta.get("model") == "BAAI/bge-small-en-v1.5", "RAG index names the embedding model")
    check(meta.get("sourceHash") == current_source_hash(),
          "RAG index is fresh (run tools/build_rag_index.py after lesson edits)")

    magic, version, count, dims = struct.unpack_from("<4I", data, 0)
    check(magic == MAGIC, "RAG vector magic is MNSV")
    check(version == 1, "RAG vector version is 1")
    check(count == len(meta["chunks"]), "RAG vector count matches the chunk list")
    check(dims == meta["dims"], "RAG vector dimensions match the index")
    check(len(data) == 16 + count * 4 + count * dims, "RAG vector file is complete")

    chunks = meta["chunks"]
    check(len(chunks) > 1000, "RAG index contains the course")
    check(all(chunk.get("p") and chunk.get("pt") and chunk.get("x") and chunk.get("u")
              for chunk in chunks), "every RAG chunk has page, title, text and url")
    check(not any(chunk["p"] == "untold_history" for chunk in chunks),
          "redirect stubs are not in the RAG index")
    check(not any("frankrosenblattcommons.jpg" in chunk["x"]
                  or "img_frank_rosenblatt" in chunk["x"] for chunk in chunks),
          "RAG chunks contain no raw figure or citation markup")

    scales = np.frombuffer(data, dtype="<f4", count=count, offset=16)
    vectors = np.frombuffer(
        data, dtype=np.int8, count=count * dims, offset=16 + count * 4
    ).reshape(count, dims)
    check(bool(np.all(scales >= 0)), "RAG scales are non-negative")
    check(int(vectors.min()) >= -127 and int(vectors.max()) <= 127,
          "RAG vectors fit int8")

    print(f"\n{passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
