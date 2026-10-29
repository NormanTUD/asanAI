#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy"]
# ///
"""Build the server-side retrieval index used by the optional RAG answer service.

This index stores the full chunk text (the browser semantic index stores short
display snippets) and uses the same packed potion-base-8M model as the browser
search. German questions are translated to English by the local LLM before
retrieval, and the answer is written in the question's language.

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
from build_semantic_index import Embedder, iter_chunks, load_packed  # noqa: E402

DEFAULT_MODEL = ROOT / "vendor" / "model2vec" / "models" / "potion-base-8M.bin"
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


def build(blog_dir: Path, out_dir: Path, model_path: Path, max_chars: int):
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

    embedder = Embedder(*load_packed(model_path))
    vectors = np.empty((len(chunks), embedder.dims), dtype=np.float32)
    for index, text in enumerate(texts):
        vectors[index] = embedder.embed(text)
    dims = int(embedder.dims)

    max_abs = np.max(np.abs(vectors), axis=1)
    inverse = np.zeros_like(max_abs)
    np.divide(127.0, max_abs, out=inverse, where=max_abs > 0)
    quantized = np.rint(vectors * inverse[:, None]).clip(-127, 127).astype(np.int8)
    scales = np.zeros_like(inverse, dtype=np.float32)
    np.divide(1.0, inverse, out=scales, where=inverse > 0)

    out_dir.mkdir(parents=True, exist_ok=True)
    meta = {
        "version": VERSION,
        "model": "potion-base-8M",
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
    return meta, quantized, scales, embedder


def probe(query, meta, quantized, scales, embedder):
    qvec = embedder.embed(query)
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
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--max-chars", type=int, default=900)
    parser.add_argument("--probe", action="append", default=[])
    args = parser.parse_args()

    meta, quantized, scales, embedder = build(
        args.blog_dir.resolve(),
        args.out_dir.resolve(),
        args.model.resolve(),
        args.max_chars,
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
