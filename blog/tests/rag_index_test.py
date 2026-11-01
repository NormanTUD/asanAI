#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy"]
# ///
"""Checks the server-side RAG retrieval index without loading a model.

Run from blog/:  uv run tests/rag_index_test.py
"""

from __future__ import annotations

import json
import re
import struct
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "rag_data" / "rag_index.json"
VECTORS = ROOT / "rag_data" / "rag_vectors.bin"
SMALL_INDEX = ROOT / "rag_data" / "rag_index_small.json"
SMALL_VECTORS = ROOT / "rag_data" / "rag_vectors_small.bin"
MAGIC = 0x4D4E5356
MACRO = re.compile(
    r"\\(?:cite|citeauthor|citeyear|citetitle|citealternativetitle|"
    r"footcite|marginfig|sideimage|sidenote|index|label)\b"
)

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


def check_index(label, index_path, vectors_path, max_chars, model_name):
    meta = json.loads(index_path.read_text(encoding="utf-8"))
    data = vectors_path.read_bytes()

    check(meta.get("version") == 1, f"{label}: index version is 1")
    check(meta.get("model") == model_name,
          f"{label}: index names its embedding model")
    check(meta.get("sourceHash") == current_source_hash(),
          f"{label}: index is fresh (run tools/build_rag_index.py after lesson edits)")

    magic, version, count, dims = struct.unpack_from("<4I", data, 0)
    check(magic == MAGIC, f"{label}: vector magic is MNSV")
    check(version == 1, f"{label}: vector version is 1")
    check(count == len(meta["chunks"]), f"{label}: vector count matches chunks")
    check(dims == meta["dims"], f"{label}: vector dimensions match the index")
    check(len(data) == 16 + count * 4 + count * dims,
          f"{label}: vector file is complete")

    chunks = meta["chunks"]
    check(len(chunks) > 1000, f"{label}: index contains the course")
    check(all(chunk.get("p") and chunk.get("pt") and chunk.get("x") and chunk.get("u")
              for chunk in chunks), f"{label}: every chunk has page, title, text and url")
    check(all(len(chunk["x"]) <= max_chars for chunk in chunks),
          f"{label}: every chunk fits {max_chars} characters")
    check(not any(chunk["p"] == "untold_history" for chunk in chunks),
          f"{label}: redirect stubs are not indexed")
    check(not any("frankrosenblattcommons.jpg" in chunk["x"]
                  or "img_frank_rosenblatt" in chunk["x"] for chunk in chunks),
          f"{label}: no raw figure or citation markup")
    check(not any(MACRO.search(chunk["x"]) for chunk in chunks),
          f"{label}: no raw LaTeX citation macros")
    check(any(chunk.get("img") or chunk.get("i") for chunk in chunks),
          f"{label}: figure captions and image paths are kept")

    scales = np.frombuffer(data, dtype="<f4", count=count, offset=16)
    vectors = np.frombuffer(
        data, dtype=np.int8, count=count * dims, offset=16 + count * 4
    ).reshape(count, dims)
    check(bool(np.all(scales >= 0)), f"{label}: scales are non-negative")
    check(int(vectors.min()) >= -127 and int(vectors.max()) <= 127,
          f"{label}: vectors fit int8")
    return meta


def main():
    large = check_index("large", INDEX, VECTORS, 900, "BAAI/bge-small-en-v1.5")
    small = check_index("small", SMALL_INDEX, SMALL_VECTORS, 50, "potion-base-8M")

    check(small.get("kind") == "small", "small index records its kind")
    check(small.get("maxChars") == 50, "small index uses 50-character chunks")
    check(small.get("minChars") == 10, "small index keeps 10-character fragments")
    check(small.get("strict") is True, "small index clips summary chunks too")
    check(len(small["chunks"]) > len(large["chunks"]),
          "small index has more chunks than the large one")
    small_chunks = small["chunks"]
    check(any(small_chunks[i]["p"] == small_chunks[i + 1]["p"]
              for i in range(len(small_chunks) - 1)),
          "small chunks keep neighbouring text within a page")

    print(f"\n{passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
