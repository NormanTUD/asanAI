#!/usr/bin/env python3
"""Build the token vocabulary and semantic embeddings for TOKEN / EGO.

Source of the vectors: the packed model2vec potion-base-8M model that already
ships with the blog (blog/vendor/model2vec/models/potion-base-8M.bin).  We use
its WordPiece vocabulary and 256-dimensional static word vectors, then take a
PCA projection to 128 dimensions for the transformer's token embedding matrix
and to 3 dimensions for the constellation in the logit sky.

The output is a plain JS file (no fetch, works from file://) that the game and
the Node tests can both load.

Usage:
    python3 tools/gen_embeddings.py
"""
from __future__ import annotations

import struct
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT.parents[1] / "vendor" / "model2vec" / "models" / "potion-base-8M.bin"
OUT = ROOT / "src" / "embeddings.js"

# The vocabulary is deliberately small: every word the prompts use, plus a
# cloud of related words for the final probability sky.  Keep it lowercase;
# the model2vec tokenizer lowercases anyway.
WORDS = """
the a an this that every all some no we you i it they her his our their
is are was were be become see seen watch watched carry carries pass passes
flow flows dream dreamed swallow open close hold holds release rise fall passing
enter leave remember forget think thought feel felt make made turn turns
break breaks burn burns gather gathers listen listens whisper whispers
token vector weight attention layer node cell river sea sky storm light
dark fire water word world memory signal thought dream future past present
time space mind machine model transformer key query value head stream
residual tower gate mirror shadow silence voice song current wave ocean
horizon lighthouse keeper shore stone spark ember rain wind cloud star moon
sun night day deep electric single last first old new cold warm bright quiet
strange infinite hidden inner outer small large high low soft hard slow fast
never always again still here now then into through of in on at by with
from to for and or but because as if not just only more less very
thoughts words tokens vectors weights layers nodes cells rivers seas skies
storms lights fires waters worlds memories signals dreams futures pasts
machines models transformers keys queries values heads streams towers gates
mirrors shadows voices songs currents waves oceans horizons keepers shores
stones sparks embers rains winds clouds stars moons suns nights days
swallowed watched carried passed flowed dreamed dreamed remembered forgotten
rising falling entering leaving turning breaking burning gathering listening
whispering electric deep hidden infinite strange bright quiet soft warm cold
""".split()

PUNCT = [".", ",", ";", ":", "?", "!", "—", "…", "'", '"']

# Words that must be in the vocabulary because the game's prompts use them.
PROMPTS = [
    "the lighthouse keeper watched the storm swallow the last light",
    "a single cell in the deep layer dreamed of electric fire",
    "the river of attention carries every word into the future",
    "we are all tokens passing through the weight of the world",
]
REQUIRED = sorted({w for p in PROMPTS for w in p.split()})


def decode_model(path: Path):
    b = path.read_bytes()
    magic, version, n, dims, bits, group, vocab_len = struct.unpack_from("<7I", b, 0)
    if magic != 0x4D514146 or version != 1:
        raise SystemExit(f"unexpected model header in {path}")
    if bits not in (4, 8, 32):
        raise SystemExit(f"unsupported bits: {bits}")
    off = 28
    tokens = b[off : off + vocab_len].decode("utf-8").split("\n")
    if len(tokens) != n:
        raise SystemExit("vocabulary size mismatch")
    off += (vocab_len + 3) & ~3
    count = n * dims
    if bits == 32:
        vectors = np.frombuffer(b, dtype="<f4", count=count, offset=off).copy()
    else:
        groups = count // group
        scales = np.frombuffer(b, dtype="<f2", count=groups, offset=off).astype(np.float32)
        off += (groups * 2 + 3) & ~3
        if bits == 8:
            q = np.frombuffer(b, dtype=np.int8, count=count, offset=off).astype(np.float32)
        else:
            packed = np.frombuffer(b, dtype=np.uint8, count=(count + 1) // 2, offset=off)
            low = (packed & 0x0F).astype(np.int16) - 8
            high = ((packed >> 4) & 0x0F).astype(np.int16) - 8
            q = np.empty(count, dtype=np.float32)
            q[0::2] = low[: (count + 1) // 2]
            q[1::2] = high[: count // 2]
        vectors = (q * np.repeat(scales, group)[:count]).astype(np.float32)
    return tokens, dims, vectors.reshape(n, dims)


def wordpiece_ids(token_to_id: dict[str, int], word: str) -> list[int]:
    """The same greedy longest-piece algorithm as model2vec's tokenizer."""
    if word in token_to_id:
        return [token_to_id[word]]
    ids: list[int] = []
    chars = list(word)
    start = 0
    while start < len(chars):
        end = len(chars)
        found = None
        while end > start:
            piece = ("##" if start else "") + "".join(chars[start:end])
            if piece in token_to_id:
                found = token_to_id[piece]
                break
            end -= 1
        if found is None:
            return []
        ids.append(found)
        start = end
    return ids


def embed_word(tokens: list[str], token_to_id: dict[str, int], vectors: np.ndarray, word: str):
    ids = wordpiece_ids(token_to_id, word)
    if not ids:
        return None
    v = vectors[ids].mean(axis=0)
    n = np.linalg.norm(v)
    return v / n if n else None


def main():
    tokens, dims, vectors = decode_model(MODEL)
    token_to_id = {t: i for i, t in enumerate(tokens)}

    vocab: list[str] = []
    for w in WORDS:
        if w not in vocab:
            vocab.append(w)
    for p in PUNCT:
        if p not in vocab:
            vocab.append(p)

    missing = [w for w in REQUIRED if w not in vocab]
    if missing:
        raise SystemExit(f"prompt words missing from the vocabulary: {missing}")

    raw = []
    kept = []
    for w in vocab:
        v = embed_word(tokens, token_to_id, vectors, w)
        if v is None:
            print(f"  drop (not in model2vec): {w}")
            continue
        raw.append(v)
        kept.append(w)
    vocab = kept
    X = np.stack(raw, axis=0)

    # Centre, then project onto the leading principal components.  The first
    # 128 components become the transformer's embedding dimensions; the first
    # 3 become the position in the semantic constellation.
    Xc = X - X.mean(axis=0, keepdims=True)
    U, S, Vt = np.linalg.svd(Xc, full_matrices=False)
    Z = U[:, :128] * S[:128]
    Z = Z / (np.linalg.norm(Z, axis=1, keepdims=True).mean() or 1.0) * 1.5

    Z3 = U[:, :3] * S[:3]
    Z3 = Z3 / (np.std(Z3, axis=0) + 1e-9)
    # A fixed, pleasant rotation so the semantic clusters do not lie on the
    # coordinate axes.  Deterministic and independent of the data.
    a, b, c = 0.61, -0.37, 1.13
    Rx = np.array([[1, 0, 0], [0, np.cos(a), -np.sin(a)], [0, np.sin(a), np.cos(a)]])
    Ry = np.array([[np.cos(b), 0, np.sin(b)], [0, 1, 0], [-np.sin(b), 0, np.cos(b)]])
    Rz = np.array([[np.cos(c), -np.sin(c), 0], [np.sin(c), np.cos(c), 0], [0, 0, 1]])
    Z3 = Z3 @ (Rx @ Ry @ Rz).T
    Z3 = Z3 / (np.max(np.abs(Z3)) or 1.0)

    def fmt(x: float) -> str:
        return f"{x:.6g}"

    lines = []
    lines.append("/* Generated by tools/gen_embeddings.py. Do not edit by hand. */")
    lines.append("(function (root, factory) {")
    lines.append("  var data = factory();")
    lines.append("  if (typeof module === \"object\" && module.exports) module.exports = data;")
    lines.append("  else { root.TEGO = root.TEGO || {}; root.TEGO.DATA = data; }")
    lines.append("})(typeof globalThis !== \"undefined\" ? globalThis : this, function () {")
    lines.append("  return {")
    lines.append("    dims: 128,")
    lines.append("    source: \"model2vec potion-base-8M (packed 4-bit), PCA to 128 dims\",")
    lines.append("    vocab: [")
    for i in range(0, len(vocab), 10):
        chunk = ", ".join('"' + w.replace('"', '\\"') + '"' for w in vocab[i : i + 10])
        lines.append("      " + chunk + ",")
    lines.append("    ],")
    lines.append("    emb: [")
    for row in Z:
        vals = ", ".join(fmt(float(x)) for x in row)
        lines.append("      [" + vals + "],")
    lines.append("    ],")
    lines.append("    sem3: [")
    for row in Z3:
        vals = ", ".join(fmt(float(x)) for x in row)
        lines.append("      [" + vals + "],")
    lines.append("    ],")
    lines.append("  };")
    lines.append("});")
    lines.append("")
    OUT.write_text("\n".join(lines), encoding="utf-8")

    # A small nearest-neighbour report is useful when tuning the vocabulary.
    print(f"wrote {OUT} · {len(vocab)} tokens · {dims}-dim source -> 128-dim PCA")
    print(f"kept {len(vocab)} / {len(vocab) + (len(WORDS) + len(PUNCT) - len(kept))} words")
    for probe in ["storm", "light", "attention", "token", "river", "fire", "future", "weight"]:
        if probe not in vocab:
            continue
        i = vocab.index(probe)
        d = np.linalg.norm(X - X[i], axis=1)
        nn = [vocab[j] for j in np.argsort(d)[1:7]]
        print(f"  {probe:10s} -> {', '.join(nn)}")


if __name__ == "__main__":
    main()
