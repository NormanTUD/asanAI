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

The build is incremental: unchanged chunks reuse their existing int8 vector and
scale, and an unchanged sourceHash skips the build entirely. Per-page hashes are
stored in the index so a later run can report what changed. Use --force to
re-embed everything.

Usage:
    uv run tools/build_rag_index.py
    uv run tools/build_rag_index.py --force
    uv run tools/build_rag_index.py --probe "What is a perceptron?"

The generated files live in rag_data/ (blocked from the web) and are read by
rag/server.py. Rerun after editing lessons, literature.js or search_lib.php.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import struct
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from build_semantic_index import iter_chunks  # noqa: E402

DEFAULT_MODEL = "BAAI/bge-small-en-v1.5"
DEFAULT_OUT = ROOT / "rag_data"
MAGIC = 0x4D4E5356
VERSION = 1
DEFAULT_MAX_CHARS = 900


def load_blocks(blog_dir: Path):
    result = subprocess.run(
        ["php", str(blog_dir / "tools" / "dump_search_blocks.php")],
        cwd=blog_dir,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def page_hashes(chunks):
    """One content hash per page, built from that page's ordered chunk keys."""
    hashes = {}
    for chunk in chunks:
        digest = hashes.setdefault(chunk["p"], hashlib.sha256())
        digest.update(chunk["u"].encode("utf-8"))
        digest.update(b"\0")
        digest.update(chunk["x"].encode("utf-8"))
        digest.update(b"\0")
    return {page: digest.hexdigest() for page, digest in hashes.items()}


def load_existing(out_dir: Path, model_name: str):
    """Load a previous index, or return None when it cannot be reused."""
    meta_path = out_dir / "rag_index.json"
    vectors_path = out_dir / "rag_vectors.bin"
    if not meta_path.exists() or not vectors_path.exists():
        return None
    try:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        data = vectors_path.read_bytes()
    except (OSError, ValueError):
        return None
    if meta.get("model") != model_name:
        return None
    if len(data) < 16:
        return None
    magic, version, count, dims = struct.unpack_from("<4I", data, 0)
    if magic != MAGIC or version != VERSION:
        return None
    if count != len(meta.get("chunks", [])):
        return None
    expected = 16 + count * 4 + count * dims
    if len(data) != expected:
        return None
    scales = np.frombuffer(data, dtype="<f4", count=count, offset=16).astype(
        np.float32, copy=True
    )
    vectors = (
        np.frombuffer(data, dtype=np.int8, count=count * dims, offset=16 + count * 4)
        .reshape(count, dims)
        .copy()
    )
    return {"meta": meta, "dims": dims, "scales": scales, "vectors": vectors}


def reusable_chunks(chunks, old):
    """Map new chunk indexes to identical chunks in the previous index."""
    if old is None:
        return {}
    old_keys = {}
    for index, chunk in enumerate(old["meta"].get("chunks", [])):
        old_keys[(chunk.get("p"), chunk.get("u"), chunk.get("x"))] = index
    reuse = {}
    for index, chunk in enumerate(chunks):
        previous = old_keys.get((chunk.get("p"), chunk.get("u"), chunk.get("x")))
        if previous is not None and previous < len(old["vectors"]):
            reuse[index] = previous
    return reuse


def default_embed(texts, model_name: str, batch_size: int):
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
    return vectors


def normalize_and_quantize(vectors):
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    np.divide(vectors, np.maximum(norms, 1e-9), out=vectors)

    max_abs = np.max(np.abs(vectors), axis=1)
    inverse = np.zeros_like(max_abs)
    np.divide(127.0, max_abs, out=inverse, where=max_abs > 0)
    quantized = np.rint(vectors * inverse[:, None]).clip(-127, 127).astype(np.int8)
    scales = np.zeros_like(inverse, dtype=np.float32)
    np.divide(1.0, inverse, out=scales, where=inverse > 0)
    return quantized, scales


def write_index(out_dir: Path, meta, vectors, scales):
    """Write the index atomically so an interrupted build leaves the old one."""
    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / "rag_index.json"
    vectors_path = out_dir / "rag_vectors.bin"
    json_tmp = out_dir / ".rag_index.json.tmp"
    vectors_tmp = out_dir / ".rag_vectors.bin.tmp"
    try:
        json_tmp.write_text(
            json.dumps(meta, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        with vectors_tmp.open("wb") as handle:
            count, dims = vectors.shape
            handle.write(struct.pack("<4I", MAGIC, VERSION, count, dims))
            handle.write(scales.astype("<f4").tobytes())
            handle.write(vectors.tobytes())
        os.replace(json_tmp, json_path)
        os.replace(vectors_tmp, vectors_path)
    finally:
        for path in (json_tmp, vectors_tmp):
            try:
                path.unlink()
            except FileNotFoundError:
                pass


def build(
    blog_dir: Path,
    out_dir: Path,
    model_name: str,
    max_chars: int,
    batch_size: int,
    *,
    incremental: bool = True,
    embed_fn: Callable | None = None,
):
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

    hashes = page_hashes(chunks)
    old = load_existing(out_dir, model_name) if incremental else None
    if (
        old is not None
        and old["meta"].get("sourceHash") == payload.get("sourceHash", "")
        and old["meta"].get("maxChars", DEFAULT_MAX_CHARS) == max_chars
        and old["meta"].get("count") == len(chunks)
    ):
        print("RAG index is already fresh; nothing to embed.")
        return old["meta"], old["vectors"], old["scales"], {
            "fresh": True,
            "reused": len(chunks),
            "embedded": 0,
            "pages_changed": [],
        }

    reuse = reusable_chunks(chunks, old)
    todo = [index for index in range(len(chunks)) if index not in reuse]
    if embed_fn is None:
        embed_fn = lambda batch, size: default_embed(batch, model_name, size)

    old_hashes = (old["meta"].get("pageHashes") or {}) if old else {}
    pages_changed = sorted(
        page for page, digest in hashes.items() if old_hashes.get(page) != digest
    )

    if todo:
        new_vectors = embed_fn([texts[index] for index in todo], batch_size)
        if new_vectors is None or len(new_vectors) != len(todo):
            raise ValueError("embed_fn returned the wrong number of vectors")
        new_vectors = np.asarray(new_vectors, dtype=np.float32)
        dims = int(new_vectors.shape[1])
        if old is not None and dims != old["dims"]:
            raise ValueError("embedding dimensions changed; use --force to rebuild")
        new_quantized, new_scales = normalize_and_quantize(new_vectors)
    else:
        if old is None:
            raise ValueError("no chunks to index")
        dims = old["dims"]
        new_quantized = np.empty((0, dims), dtype=np.int8)
        new_scales = np.empty(0, dtype=np.float32)

    quantized = np.empty((len(chunks), dims), dtype=np.int8)
    scales = np.empty(len(chunks), dtype=np.float32)
    for index, previous in reuse.items():
        quantized[index] = old["vectors"][previous]
        scales[index] = old["scales"][previous]
    for offset, index in enumerate(todo):
        quantized[index] = new_quantized[offset]
        scales[index] = new_scales[offset]

    meta = {
        "version": VERSION,
        "model": model_name,
        "dims": dims,
        "count": len(chunks),
        "maxChars": max_chars,
        "built": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "sourceHash": payload.get("sourceHash", ""),
        "pageHashes": hashes,
        "chunks": chunks,
    }
    write_index(out_dir, meta, quantized, scales)
    return meta, quantized, scales, {
        "fresh": False,
        "reused": len(reuse),
        "embedded": len(todo),
        "pages_changed": pages_changed,
    }


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
    parser.add_argument("--max-chars", type=int, default=DEFAULT_MAX_CHARS)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument(
        "--force",
        action="store_true",
        help="re-embed every chunk, ignoring the existing index",
    )
    parser.add_argument("--probe", action="append", default=[])
    args = parser.parse_args()

    meta, quantized, scales, stats = build(
        args.blog_dir.resolve(),
        args.out_dir.resolve(),
        args.model,
        args.max_chars,
        args.batch_size,
        incremental=not args.force,
    )
    print(
        f"wrote {meta['count']} chunks, {meta['dims']} dims "
        f"(reused {stats['reused']}, embedded {stats['embedded']})\n"
        f"  {args.out_dir / 'rag_index.json'}: "
        f"{(args.out_dir / 'rag_index.json').stat().st_size / 1e6:.2f} MB\n"
        f"  {args.out_dir / 'rag_vectors.bin'}: "
        f"{(args.out_dir / 'rag_vectors.bin').stat().st_size / 1e6:.2f} MB\n"
        f"  sourceHash: {meta['sourceHash']}"
    )
    if stats["pages_changed"]:
        print(f"  pages changed: {len(stats['pages_changed'])}")
    for query in args.probe:
        probe(query, meta, quantized, scales, args.model)
    return 0


if __name__ == "__main__":
    sys.exit(main())
