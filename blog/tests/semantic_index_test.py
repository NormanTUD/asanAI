# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy"]
# ///
"""Checks the generated semantic index against its sources and the JS runtime.

Run from blog/:  uv run tests/semantic_index_test.py

Covers:
  - the index was built from the current .search_cache.json (freshness)
  - semantic_vectors.bin has the advertised shape
  - the Python tokenizer in tools/build_semantic_index.py matches the
    browser's tokenizer token for token
  - the stored int8 vectors still reproduce the model's float vectors
"""

import importlib.util
import json
import struct
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
MODEL = ROOT / "vendor" / "model2vec" / "models" / "potion-base-8M.bin"
INDEX = ROOT / "semantic_index.json"
VECTORS = ROOT / "semantic_vectors.bin"

spec = importlib.util.spec_from_file_location(
    "build_semantic_index", ROOT / "tools" / "build_semantic_index.py"
)
indexer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(indexer)

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


def node_tokenize(texts):
    model_module = (ROOT / "vendor" / "model2vec" / "model.js").as_uri()
    script = f"""
import {{ readFileSync }} from 'node:fs';
import {{ StaticModel }} from {json.dumps(model_module)};
const texts = JSON.parse(readFileSync(0, 'utf8'));
const model = StaticModel.fromBytes(new Uint8Array(readFileSync({json.dumps(str(MODEL))})));
process.stdout.write(JSON.stringify(texts.map((text) => model.tokenize(text))));
"""
    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        input=json.dumps(texts),
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(result.stdout)


def embed_text_for_chunk(chunk):
    if chunk["t"] == "page":
        return chunk["pt"] if chunk["x"] == chunk["pt"] else f"{chunk['pt']}. {chunk['x']}"
    if chunk["t"] == "heading":
        return f"{chunk['pt']}. {chunk['h']}"
    return f"{chunk['h'] or chunk['pt']}. {chunk['x']}"


def main():
    meta = json.loads(INDEX.read_text(encoding="utf-8"))
    data = VECTORS.read_bytes()

    check(meta.get("version") == 1, "index version is 1")
    check(meta.get("model") == "potion-base-8M", "index names the model")
    check(meta.get("sourceHash") == current_source_hash(),
          "index is fresh (run tools/build_semantic_index.py after lesson edits)")

    raw_macro = [
        chunk for chunk in meta["chunks"]
        if "frankrosenblattcommons.jpg" in chunk["x"]
        or "img_frank_rosenblatt" in chunk["x"]
    ]
    check(not raw_macro, "semantic chunks contain no raw figure or citation markup")

    check(not any(chunk["p"] == "untold_history" for chunk in meta["chunks"]),
          "redirect stubs are not in the semantic index")
    check(not any(chunk["x"].strip() == chunk["p"] for chunk in meta["chunks"]),
          "no chunk snippet is just a page slug")

    magic, version, count, dims = struct.unpack_from("<4I", data, 0)
    check(magic == 0x4D4E5356, "vector file magic is MNSV")
    check(version == 1, "vector file version is 1")
    check(count == len(meta["chunks"]), "vector count matches the chunk list")
    check(dims == meta["dims"], "vector dimensions match the index")
    check(len(data) == 16 + count * 4 + count * dims, "vector file is not truncated")

    scales = np.frombuffer(data, dtype="<f4", count=count, offset=16)
    quantized = np.frombuffer(
        data, dtype=np.int8, count=count * dims, offset=16 + count * 4
    ).reshape(count, dims)

    tokens, table, vocab, model_dims = indexer.load_packed(MODEL)
    check(model_dims == dims, "packed model and index share dimensions")
    embedder = indexer.Embedder(tokens, table, vocab, model_dims)

    sample_texts = [
        "Café “attention” — multi-head, don't panic.",
        "Why do neural networks need nonlinear activation functions?",
        "The cat sat on the mat because it was tired.",
        "e.g. backpropagation; 3.14159",
        "Ελληνικά and ∑ over x_i",
    ]
    sample_texts += [
        chunk["x"] for chunk in meta["chunks"][:7] if chunk["x"]
    ]
    js_ids = node_tokenize(sample_texts)
    for text, expected in zip(sample_texts, js_ids):
        got = indexer.word_piece(vocab, embedder.unk, text)
        check(got == expected, f"tokenizer matches the browser for {text[:40]!r}")

    checked_vectors = 0
    cosines = []
    for i, chunk in enumerate(meta["chunks"]):
        if chunk["x"].endswith("…"):
            continue
        vector = embedder.embed(embed_text_for_chunk(chunk))
        reconstructed = quantized[i].astype(np.float32) * scales[i]
        norm = float(np.linalg.norm(reconstructed))
        if norm == 0:
            continue
        cosines.append(float(np.dot(vector, reconstructed) / norm))
        checked_vectors += 1
        if checked_vectors >= 40:
            break
    check(checked_vectors >= 20, "enough untruncated chunks for the vector check")
    check(min(cosines) > 0.995, f"stored int8 vectors reproduce the model (min {min(cosines):.4f})")

    query = embedder.embed("why do neural networks need nonlinear activation functions")
    scores = (quantized.astype(np.float32) @ query) * scales
    best = meta["chunks"][int(np.argmax(scores))]
    check(best["p"] == "activationlab", "a known question still finds the activation lesson")

    print(f"\n{passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
