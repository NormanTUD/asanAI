#!/usr/bin/env python3
# /// script
# requires-python = ">=3.9"
# dependencies = ["numpy"]
# ///
"""Build the browser-side semantic search index from the blog's search blocks.

The embedding model is the packed 4-bit potion-base-8M file that
vendor/model2vec ships. Everything here is pure Python + numpy: the packed
format is read directly, and the BERT WordPiece tokenizer is reimplemented to
match vendor/model2vec/tokenizer.js token for token. That keeps the vectors
produced here identical to the query vectors the browser computes.

Usage:
    uv run tools/build_semantic_index.py
    uv run tools/build_semantic_index.py --probe "why do networks need bias?"
    python3 tools/build_semantic_index.py        # if numpy is installed

Re-run after editing any lesson. The script also refreshes .search_cache.json
through PHP, so the semantic index always mirrors the lexical one.
"""

from __future__ import annotations

import argparse
import json
import math
import struct
import subprocess
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MODEL = ROOT / "vendor" / "model2vec" / "models" / "potion-base-8M.bin"
DEFAULT_JSON = ROOT / "semantic_index.json"
DEFAULT_VECTORS = ROOT / "semantic_vectors.bin"
MAGIC = 0x4D4E5356  # "MNSV"
VERSION = 1
MODEL_NAME = "potion-base-8M"
MODEL_MAX_TOKENS = 512
SNIPPET_CHARS = 320


# ---------------------------------------------------------------------------
# Packed model (format.md in the model2vec-js package)
# ---------------------------------------------------------------------------

def _pad4(n: int) -> int:
    return (n + 3) & ~3


def load_packed(path: Path):
    data = path.read_bytes()
    magic, version, n, dims, bits, group, vocab_len = struct.unpack_from(
        "<7I", data, 0
    )
    if magic != 0x4D514146 or version != 1:
        raise ValueError(f"{path}: not a model2vec-js model file")
    off = 28
    tokens = data[off : off + vocab_len].decode("utf-8").split("\n")
    if len(tokens) != n:
        raise ValueError(f"{path}: corrupt vocabulary ({len(tokens)} != {n})")
    off = _pad4(off + vocab_len)
    count = n * dims

    if bits == 32:
        table = np.frombuffer(data, dtype="<f4", count=count, offset=off)
        table = table.reshape(n, dims).astype(np.float32, copy=True)
    elif bits in (4, 8):
        groups = count // group
        scales = np.frombuffer(
            data, dtype="<f2", count=groups, offset=off
        ).astype(np.float32)
        off = _pad4(off + groups * 2)
        if bits == 8:
            q = np.frombuffer(data, dtype=np.int8, count=count, offset=off)
            q = q.astype(np.float32)
        else:
            raw = np.frombuffer(data, dtype=np.uint8, count=count // 2, offset=off)
            nibbles = np.empty(count, dtype=np.int16)
            nibbles[0::2] = (raw & 0x0F).astype(np.int16) - 8
            nibbles[1::2] = (raw >> 4).astype(np.int16) - 8
            q = nibbles.astype(np.float32)
        table = (q * np.repeat(scales, group)).reshape(n, dims)
    else:
        raise ValueError(f"{path}: unsupported bit width {bits}")

    vocab = {token: i for i, token in enumerate(tokens)}
    return tokens, table, vocab, dims


# ---------------------------------------------------------------------------
# BERT tokenizer, matching vendor/model2vec/tokenizer.js
# ---------------------------------------------------------------------------

def _is_punct(ch: str) -> bool:
    cp = ord(ch)
    if 33 <= cp <= 47 or 58 <= cp <= 64 or 91 <= cp <= 96 or 123 <= cp <= 126:
        return True
    return unicodedata.category(ch).startswith("P")


def _is_cjk(cp: int) -> bool:
    return (
        0x4E00 <= cp <= 0x9FFF
        or 0x3400 <= cp <= 0x4DBF
        or 0x20000 <= cp <= 0x2A6DF
        or 0x2A700 <= cp <= 0x2B73F
        or 0x2B740 <= cp <= 0x2B81F
        or 0x2B820 <= cp <= 0x2CEAF
        or 0xF900 <= cp <= 0xFAFF
        or 0x2F800 <= cp <= 0x2FA1F
    )


def _normalize(text: str) -> str:
    out = []
    for ch in text:
        cp = ord(ch)
        if cp == 0 or cp == 0xFFFD:
            continue
        if unicodedata.category(ch).startswith("C") and ch not in "\t\n\r":
            continue
        if ch.isspace():
            out.append(" ")
        elif _is_cjk(cp):
            out.append(f" {ch} ")
        else:
            out.append(ch)
    normalized = unicodedata.normalize("NFD", "".join(out))
    normalized = "".join(c for c in normalized if unicodedata.category(c) != "Mn")
    return normalized.lower()


def _pre_tokenize(text: str):
    words = []
    for chunk in text.split(" "):
        word = ""
        for ch in chunk:
            if _is_punct(ch):
                if word:
                    words.append(word)
                words.append(ch)
                word = ""
            else:
                word += ch
        if word:
            words.append(word)
    return words


def word_piece(vocab, unk: int, text: str):
    ids = []
    for word in _pre_tokenize(_normalize(text)):
        chars = list(word)
        if len(chars) > 100:
            ids.append(unk)
            continue
        pieces = []
        start = 0
        while start < len(chars):
            end = len(chars)
            token_id = None
            while end > start:
                piece = ("##" if start else "") + "".join(chars[start:end])
                token_id = vocab.get(piece)
                if token_id is not None:
                    break
                end -= 1
            if end == start:
                pieces = [unk]
                break
            pieces.append(token_id)
            start = end
        ids.extend(pieces)
    return ids


# ---------------------------------------------------------------------------
# Embedder
# ---------------------------------------------------------------------------

class Embedder:
    def __init__(self, tokens, table, vocab, dims):
        self.tokens = tokens
        self.table = table
        self.vocab = vocab
        self.dims = dims
        self.unk = vocab.get("[UNK]", -1)
        lengths = sorted(len(token) for token in tokens)
        mid = len(lengths) >> 1
        self.median_token_length = int(
            lengths[mid] if len(lengths) % 2 else (lengths[mid - 1] + lengths[mid]) / 2
        )

    def embed(self, text: str) -> np.ndarray:
        chars = MODEL_MAX_TOKENS * self.median_token_length
        if len(text) > chars:
            text = text[:chars]
        ids = [i for i in word_piece(self.vocab, self.unk, text)[:MODEL_MAX_TOKENS] if i != self.unk]
        vector = np.zeros(self.dims, dtype=np.float32)
        if ids:
            vector = self.table[np.asarray(ids, dtype=np.int32)].sum(axis=0)
        norm = float(np.linalg.norm(vector))
        if norm:
            vector /= norm
        return vector


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

def split_text(text: str, max_chars: int):
    text = " ".join(text.split())
    if len(text) <= max_chars:
        return [text] if len(text) >= 40 else []

    pieces = []
    buffer = ""
    for sentence in _split_sentences(text):
        if not buffer:
            buffer = sentence
        elif len(buffer) + 1 + len(sentence) <= max_chars:
            buffer += " " + sentence
        else:
            pieces.append(buffer)
            buffer = sentence
        while len(buffer) > max_chars:
            cut = buffer.rfind(" ", 0, max_chars)
            if cut <= 0:
                cut = max_chars
            pieces.append(buffer[:cut].strip())
            buffer = buffer[cut:].strip()
    if buffer:
        pieces.append(buffer)

    merged = []
    for piece in pieces:
        if merged and len(piece) < 120 and len(merged[-1]) + 1 + len(piece) <= max_chars:
            merged[-1] = merged[-1] + " " + piece
        else:
            merged.append(piece)
    return [piece for piece in merged if len(piece) >= 40]


def _split_sentences(text: str):
    sentences = []
    start = 0
    for i, ch in enumerate(text):
        if ch in ".!?" and i + 1 < len(text) and text[i + 1] == " ":
            sentences.append(text[start : i + 1].strip())
            start = i + 1
    tail = text[start:].strip()
    if tail:
        sentences.append(tail)
    return sentences or [text]


def iter_chunks(page, max_chars: int):
    name = page["name"]
    title = page.get("title") or name
    blocks = page.get("blocks") or []

    intro = next(
        (block["text"][:320] for block in blocks if block["type"] == "text" and len(block["text"]) >= 40),
        "",
    )
    yield {
        "t": "page",
        "p": name,
        "pt": title,
        "h": "",
        "x": intro or title,
        "u": name,
        "i": "",
        "e": f"{title}. {intro}" if intro else title,
    }

    heading = ""
    heading_slug = ""
    for block_index, block in enumerate(blocks):
        kind = block["type"]
        if kind == "heading":
            heading = block["text"]
            heading_slug = block.get("slug", "")
            next_text = next(
                (
                    later["text"][:200]
                    for later in blocks[block_index + 1 :]
                    if later["type"] == "text" and len(later["text"]) >= 40
                ),
                "",
            )
            yield {
                "t": "heading",
                "p": name,
                "pt": title,
                "h": heading,
                "x": f"{heading} — {next_text}" if next_text else heading,
                "u": name + (f"#{heading_slug}" if heading_slug else ""),
                "i": "",
                "e": f"{title}. {heading}",
            }
        elif kind == "text":
            context = heading or title
            url = name + (f"#{heading_slug}" if heading_slug else "")
            for piece in split_text(block["text"], max_chars):
                yield {
                    "t": "content",
                    "p": name,
                    "pt": title,
                    "h": heading,
                    "x": piece,
                    "u": url,
                    "i": "",
                    "e": f"{context}. {piece}",
                }
        elif kind == "caption":
            context = heading or title
            url = name + (f"#{heading_slug}" if heading_slug else "")
            yield {
                "t": "caption",
                "p": name,
                "pt": title,
                "h": heading,
                "x": block["text"],
                "u": url,
                "i": block.get("img", ""),
                "e": f"{context}. {block['text']}",
            }


# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------

def load_blocks():
    result = subprocess.run(
        ["php", str(ROOT / "tools" / "dump_search_blocks.php")],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def build(model_path: Path, json_path: Path, vectors_path: Path, max_chars: int):
    payload = load_blocks()
    pages = payload["pages"]
    embedder = Embedder(*load_packed(model_path))

    chunks = []
    seen = set()
    embed_texts = []
    for page in pages.values():
        for chunk in iter_chunks(page, max_chars):
            key = (chunk["p"], chunk["u"], chunk["x"])
            if key in seen:
                continue
            seen.add(key)
            embed_texts.append(chunk.pop("e"))
            if len(chunk["x"]) > SNIPPET_CHARS:
                chunk["x"] = chunk["x"][:SNIPPET_CHARS].rstrip() + "…"
            chunks.append(chunk)

    vectors = np.empty((len(chunks), embedder.dims), dtype=np.float32)
    for i, text in enumerate(embed_texts):
        vectors[i] = embedder.embed(text)

    max_abs = np.max(np.abs(vectors), axis=1)
    inverse = np.zeros_like(max_abs)
    np.divide(127.0, max_abs, out=inverse, where=max_abs > 0)
    quantized = np.rint(vectors * inverse[:, None]).clip(-127, 127).astype(np.int8)
    scales = np.zeros_like(inverse, dtype=np.float32)
    np.divide(1.0, inverse, out=scales, where=inverse > 0)

    reconstructed = quantized.astype(np.float32) * scales[:, None]
    norms = np.linalg.norm(reconstructed, axis=1)
    cosines = (vectors * reconstructed).sum(axis=1) / np.maximum(norms, 1e-9)

    meta = {
        "version": VERSION,
        "model": MODEL_NAME,
        "dims": int(embedder.dims),
        "count": len(chunks),
        "built": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "sourceKey": payload.get("key", ""),
        "sourceHash": payload.get("sourceHash", ""),
        "chunks": chunks,
    }
    json_path.write_text(
        json.dumps(meta, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    with vectors_path.open("wb") as handle:
        handle.write(struct.pack("<4I", MAGIC, VERSION, len(chunks), embedder.dims))
        handle.write(scales.astype("<f4").tobytes())
        handle.write(quantized.tobytes())

    return meta, quantized, scales, embedder, cosines


def probe(queries, meta, quantized, scales, embedder, limit=8):
    for query in queries:
        query_vector = embedder.embed(query)
        scores = (quantized.astype(np.float32) @ query_vector) * scales
        order = np.argsort(-scores)[:limit]
        print(f"\n? {query}")
        for rank, index in enumerate(order, 1):
            chunk = meta["chunks"][int(index)]
            snippet = chunk["x"][:120].replace("\n", " ")
            print(f"  {rank:2d}. {scores[index]:.3f}  {chunk['pt']}  <{chunk['u']}>")
            print(f"      {snippet}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--json", type=Path, default=DEFAULT_JSON)
    parser.add_argument("--vectors", type=Path, default=DEFAULT_VECTORS)
    parser.add_argument("--max-chars", type=int, default=900)
    parser.add_argument("--probe", action="append", default=[])
    args = parser.parse_args()

    meta, quantized, scales, embedder, cosines = build(
        args.model, args.json, args.vectors, args.max_chars
    )
    json_size = args.json.stat().st_size
    vector_size = args.vectors.stat().st_size
    print(
        f"wrote {meta['count']} chunks, {meta['dims']} dims\n"
        f"  {args.json.name}: {json_size / 1e6:.2f} MB\n"
        f"  {args.vectors.name}: {vector_size / 1e6:.2f} MB\n"
        f"  int8 cosine: mean {cosines.mean():.4f}, min {cosines.min():.4f}\n"
        f"  sourceHash: {meta['sourceHash']}"
    )
    if args.probe:
        probe(args.probe, meta, quantized, scales, embedder)
    return 0


if __name__ == "__main__":
    sys.exit(main())
