#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "fastembed"]
# ///
"""Build the server-side retrieval index used by the optional RAG answer service.

This index stores the full chunk text (the browser semantic index stores short
display snippets) and embeds it with bge-small-en-v1.5, a real transformer
retriever that is much stronger than the browser's static Model2Vec model.
German questions are translated to English by the local LLM before retrieval,
and the answer is written in the question's language.

Usage:
    uv run tools/build_rag_index.py
    uv run tools/build_rag_index.py --probe "What is a perceptron?"

The generated files live in rag_data/ (blocked from the web) and are read by
rag/server.py. Rerun after editing lessons, literature.js or search_lib.php.
"""

from __future__ import annotations

import argparse
import json
import struct
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from build_semantic_index import iter_chunks  # noqa: E402

DEFAULT_MODEL = "BAAI/bge-small-en-v1.5"
DEFAULT_OUT = ROOT / "rag_data"
MAGIC = 0x4D4E5356
VERSION = 1


def load_blocks(blog_dir: Path):
    result = subprocess.run(
        ["php", str(blog_dir / "tools" / "dump_search_blocks.php")],
        cwd=blog_dir,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def build(blog_dir: Path, out_dir: Path, model_name: str, max_chars: int, batch_size: int):
    payload = load_blocks(blog_dir)
    chunks = []
    texts = []
    seen = set()
    for page in payload["pages"].values():
        for chunk in iter_chunks(page, max_chars):
            key = (chunk["p"], chunk["u"], chunk["x"])
            if key in seen:
                continue
            seen.add(key)
            texts.append(chunk.pop("e"))
            chunks.append(chunk)

    from fastembed import TextEmbedding

    model = TextEmbedding(model_name=model_name)
    # Group similar lengths: transformer batches pad to the longest text in the
    # batch, and these chunks vary from 40 to 900 characters.
    order = sorted(range(len(texts)), key=lambda index: len(texts[index]))
    ordered_texts = [texts[index] for index in order]
    vectors = None
    for count, vector in enumerate(
        model.passage_embed(ordered_texts, batch_size=batch_size), 1
    ):
        if vectors is None:
            vectors = np.empty((len(texts), len(vector)), dtype=np.float32)
        vectors[order[count - 1]] = vector
        if count % 1000 == 0:
            print(f"  embedded {count}/{len(texts)}", flush=True)
    dims = int(vectors.shape[1])
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    np.divide(vectors, np.maximum(norms, 1e-9), out=vectors)

    max_abs = np.max(np.abs(vectors), axis=1)
    inverse = np.zeros_like(max_abs)
    np.divide(127.0, max_abs, out=inverse, where=max_abs > 0)
    quantized = np.rint(vectors * inverse[:, None]).clip(-127, 127).astype(np.int8)
    scales = np.zeros_like(inverse, dtype=np.float32)
    np.divide(1.0, inverse, out=scales, where=inverse > 0)

    out_dir.mkdir(parents=True, exist_ok=True)
    meta = {
        "version": VERSION,
        "model": model_name,
        "dims": dims,
        "count": len(chunks),
        "built": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "sourceHash": payload.get("sourceHash", ""),
        "chunks": chunks,
    }
    (out_dir / "rag_index.json").write_text(
        json.dumps(meta, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    with (out_dir / "rag_vectors.bin").open("wb") as handle:
        handle.write(struct.pack("<4I", MAGIC, VERSION, len(chunks), dims))
        handle.write(scales.astype("<f4").tobytes())
        handle.write(quantized.tobytes())
    return meta, quantized, scales


def probe(query, meta, quantized, scales, model_name):
    from fastembed import TextEmbedding

    model = TextEmbedding(model_name=model_name)
    qvec = np.asarray(list(model.query_embed([query]))[0], dtype=np.float32)
    qvec /= max(float(np.linalg.norm(qvec)), 1e-9)
    scores = (quantized.astype(np.float32) @ qvec) * scales
    order = np.argsort(-scores)[:8]
    print(f"\n? {query}")
    for rank, index in enumerate(order, 1):
        chunk = meta["chunks"][int(index)]
        print(f"  {rank:2d}. {scores[index]:.3f}  {chunk['pt']}  <{chunk['u']}>")
        print(f"      {chunk['x'][:140]}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--blog-dir", type=Path, default=ROOT)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--max-chars", type=int, default=900)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--probe", action="append", default=[])
    args = parser.parse_args()

    meta, quantized, scales = build(
        args.blog_dir.resolve(),
        args.out_dir.resolve(),
        args.model,
        args.max_chars,
        args.batch_size,
    )
    print(
        f"wrote {meta['count']} chunks, {meta['dims']} dims\n"
        f"  {args.out_dir / 'rag_index.json'}: "
        f"{(args.out_dir / 'rag_index.json').stat().st_size / 1e6:.2f} MB\n"
        f"  {args.out_dir / 'rag_vectors.bin'}: "
        f"{(args.out_dir / 'rag_vectors.bin').stat().st_size / 1e6:.2f} MB\n"
        f"  sourceHash: {meta['sourceHash']}"
    )
    for query in args.probe:
        probe(query, meta, quantized, scales, embedder)
    return 0


if __name__ == "__main__":
    sys.exit(main())
