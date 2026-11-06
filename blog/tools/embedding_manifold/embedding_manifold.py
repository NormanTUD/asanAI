#!/usr/bin/env python3
"""Build the real-embedding data behind the Vietoris–Rips demo.

The script downloads GPT-2's token and position embedding tables, tokenizes
the Alice sentence, adds the position vectors, reduces the result to three
dimensions with PCA, and writes the small JavaScript data file the two
embeddinglab pages load.  No transformer forward pass is needed: the demo is
about the geometry of the embedding table, not about prediction.

Run from the repository root:

    uv run --with-requirements blog/tools/embedding_manifold/requirements.txt \
        blog/tools/embedding_manifold/embedding_manifold.py

The model is cached under /tmp by default.  Use --cache to change that.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np
from huggingface_hub import hf_hub_download
from safetensors.numpy import load_file
from tokenizers import Tokenizer

MODEL_ID = "gpt2"
DEFAULT_CACHE = Path("/tmp/embedding-manifold-gpt2")
BLOG_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT = BLOG_ROOT / "embedding_manifold_data.js"

SENTENCE_DE = "Wer in aller Welt bin ich? Ah, das ist das große Rätsel!"
SENTENCE_EN = "Who in the world am I? Ah, that's the great puzzle!"

SOURCE = {
    "author": "Lewis Carroll",
    "book_en": "Alice's Adventures in Wonderland",
    "book_de": "Alice's Abenteuer im Wunderland",
    "chapter": 2,
    "chapter_en": "The Pool of Tears",
    "chapter_de": "Der Thränenpfuhl",
    "year_en": 1865,
    "year_de": 1869,
    "translator_de": "Antonie Zimmermann",
    "note_de": "Schreibweise modernisiert",
}


def download_model(cache_dir: Path) -> tuple[Path, Path]:
    cache_dir.mkdir(parents=True, exist_ok=True)
    weights = hf_hub_download(MODEL_ID, "model.safetensors", cache_dir=str(cache_dir))
    tokenizer = hf_hub_download(MODEL_ID, "tokenizer.json", cache_dir=str(cache_dir))
    return Path(weights), Path(tokenizer)


def tokenize(tokenizer: Tokenizer, text: str) -> list[dict]:
    encoding = tokenizer.encode(text)
    tokens = []
    for position, token_id in enumerate(encoding.ids):
        raw = tokenizer.id_to_token(token_id) or ""
        piece = tokenizer.decode([token_id])
        tokens.append(
            {
                "id": int(token_id),
                "raw": raw,
                "text": piece,
                "display": piece.replace(" ", "␣"),
                "position": position,
            }
        )
    return tokens


def pca3(matrix: np.ndarray) -> tuple[np.ndarray, list[float]]:
    centered = matrix - matrix.mean(axis=0, keepdims=True)
    _, singular, vt = np.linalg.svd(centered, full_matrices=False)
    components = vt[:3]
    # Fix the sign of each component so the file is stable across LAPACK runs.
    for row in range(components.shape[0]):
        if components[row].sum() < 0:
            components[row] *= -1
    coords = centered @ components.T
    variance = singular**2
    explained = (variance[:3] / variance.sum()).tolist()
    return coords, explained


def pairwise(coords: np.ndarray) -> np.ndarray:
    diff = coords[:, None, :] - coords[None, :, :]
    return np.sqrt((diff**2).sum(axis=-1))


def _rank_gf2(rows: list[int], columns: int) -> int:
    rows = rows[:]
    rank = 0
    for column in range(columns):
        pivot = None
        for row in range(rank, len(rows)):
            if (rows[row] >> column) & 1:
                pivot = row
                break
        if pivot is None:
            continue
        rows[rank], rows[pivot] = rows[pivot], rows[rank]
        for row in range(len(rows)):
            if row != rank and ((rows[row] >> column) & 1):
                rows[row] ^= rows[rank]
        rank += 1
        if rank == len(rows):
            break
    return rank


def betti_numbers(coords: np.ndarray, epsilon: float) -> tuple[int, int, int]:
    """Betti numbers of the Vietoris–Rips clique complex over GF(2)."""
    n = len(coords)
    dist = pairwise(coords)
    edges: list[tuple[int, int]] = []
    edge_index: dict[tuple[int, int], int] = {}
    adjacent = np.zeros((n, n), dtype=bool)
    for i in range(n):
        for j in range(i + 1, n):
            if dist[i, j] <= epsilon:
                edge_index[(i, j)] = len(edges)
                edges.append((i, j))
                adjacent[i, j] = adjacent[j, i] = True

    boundary1 = [(1 << i) | (1 << j) for i, j in edges]
    rank1 = _rank_gf2(boundary1, n)
    b0 = n - rank1

    triangles: list[tuple[int, int, int]] = []
    for i in range(n):
        for j in range(i + 1, n):
            if not adjacent[i, j]:
                continue
            for k in range(j + 1, n):
                if adjacent[i, k] and adjacent[j, k]:
                    triangles.append((i, j, k))

    boundary2 = []
    for i, j, k in triangles:
        mask = 0
        for edge in ((i, j), (i, k), (j, k)):
            mask |= 1 << edge_index[edge]
        boundary2.append(mask)
    rank2 = _rank_gf2(boundary2, len(edges))
    b1 = len(edges) - rank1 - rank2
    b2 = len(triangles) - rank2
    return b0, b1, b2


def _graph_cycle_rank(coords: np.ndarray, epsilon: float) -> int:
    """Cycle rank E - V + C of the 1-skeleton (not the filled complex)."""
    n = len(coords)
    dist = pairwise(coords)
    parent = list(range(n))

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    edges = 0
    for i in range(n):
        for j in range(i + 1, n):
            if dist[i, j] <= epsilon:
                edges += 1
                a, b = find(i), find(j)
                if a != b:
                    parent[a] = b
    components = len({find(i) for i in range(n)})
    return edges - n + components


def epsilon_scan(coords: np.ndarray, steps: int = 64) -> dict:
    dist = pairwise(coords)
    values = dist[np.triu_indices_from(dist, k=1)]
    lo = float(np.percentile(values, 8))
    hi = float(np.percentile(values, 92))
    if not math.isfinite(lo) or not math.isfinite(hi) or hi <= lo:
        lo, hi = float(values.min()), float(values.max())
    grid = np.linspace(lo, hi, steps).tolist()
    scan = []
    for epsilon in grid:
        b0, b1, b2 = betti_numbers(coords, epsilon)
        cycle = _graph_cycle_rank(coords, epsilon)
        scan.append({"eps": round(epsilon, 6), "b0": b0, "b1": b1, "b2": b2, "cycle": cycle})

    best = max(scan, key=lambda row: row["b1"])
    if best["b1"] == 0:
        # No loop survives once all triangles are filled. Pick a sparse complex
        # with several components and a visible 1-skeleton loop instead of the
        # fully saturated graph at the top of the range.
        candidates = [
            row
            for row in scan
            if row["b0"] > 1 and row["cycle"] > 0 and 0 < row["b2"] <= 4 * len(coords)
        ]
        if candidates:
            best = min(candidates, key=lambda row: abs(row["b2"] - 2 * len(coords)))
        else:
            candidates = [row for row in scan if 1 < row["b0"] < len(coords)]
            best = candidates[len(candidates) // 2] if candidates else scan[-1]
    return {"grid": scan, "suggested": best}


def build(mode: str, matrix: np.ndarray) -> dict:
    coords, explained = pca3(matrix)
    scan = epsilon_scan(coords)
    return {
        "coords": [[round(float(v), 6) for v in row] for row in coords],
        "explained": [round(float(v), 5) for v in explained],
        "epsilon": scan,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", type=Path, default=DEFAULT_CACHE)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    if args.check:
        return check(args.out)

    weights_path, tokenizer_path = download_model(args.cache)
    print(f"weights:   {weights_path}")
    print(f"tokenizer: {tokenizer_path}")

    tables = load_file(str(weights_path))
    wte = np.asarray(tables["wte.weight"], dtype=np.float64)
    wpe = np.asarray(tables["wpe.weight"], dtype=np.float64)

    tokenizer = Tokenizer.from_file(str(tokenizer_path))
    tokens = tokenize(tokenizer, SENTENCE_DE)
    ids = [token["id"] for token in tokens]
    positions = [token["position"] for token in tokens]
    if max(ids) >= wte.shape[0] or max(positions) >= wpe.shape[0]:
        raise SystemExit("token id or position outside the GPT-2 tables")

    token_vectors = wte[ids]
    position_vectors = wpe[positions]
    combined = token_vectors + position_vectors

    data = {
        "model": MODEL_ID,
        "modelLabel": "GPT-2 (124M)",
        "sentence": {"de": SENTENCE_DE, "en": SENTENCE_EN},
        "source": SOURCE,
        "tokens": tokens,
        "dModel": int(wte.shape[1]),
        "positions": int(wpe.shape[0]),
        "modes": {
            "combined": build("combined", combined),
            "token": build("token", token_vectors),
        },
    }

    payload = (
        "/* Generated by blog/tools/embedding_manifold/embedding_manifold.py. */\n"
        "window.TM_EMBEDDING_MANIFOLD = "
        + json.dumps(data, ensure_ascii=False, indent="\t")
        + ";\n"
    )
    args.out.write_text(payload, encoding="utf-8")
    print(f"wrote {args.out} ({len(tokens)} tokens)")
    print(f"combined explained: {data['modes']['combined']['explained']}")
    print(f"combined epsilon:   {data['modes']['combined']['epsilon']['suggested']}")
    return 0


def check(path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    start = text.index("window.TM_EMBEDDING_MANIFOLD = ") + len(
        "window.TM_EMBEDDING_MANIFOLD = "
    )
    end = text.rindex(";")
    data = json.loads(text[start:end])
    tokens = data["tokens"]
    print(f"model: {data['modelLabel']} ({data['dModel']} dims)")
    print(f"tokens: {len(tokens)}")
    print(" ".join(token["display"] for token in tokens))
    for mode, payload in data["modes"].items():
        coords = np.asarray(payload["coords"], dtype=float)
        if coords.shape != (len(tokens), 3):
            raise SystemExit(f"{mode}: bad coordinate shape {coords.shape}")
        if not np.isfinite(coords).all():
            raise SystemExit(f"{mode}: non-finite coordinates")
        suggested = payload["epsilon"]["suggested"]
        print(
            f"{mode}: explained={payload['explained']} "
            f"eps={suggested['eps']} b0={suggested['b0']} b1={suggested['b1']}"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
