#!/usr/bin/env python3
"""
Mini-Attention-Modell – Schritt für Schritt nachrechenbar.

Satz: "the cat sat on the mat" (6 Token)
Embeddings: 4 Dimensionen (d_model = 4)
Kopf 1: Artikel<->Nomen   (W_Q = W_K = [1, 0, 0, 1])
Kopf 2: Subjekt<->Verb    (W_Q = [0, 1, 1, 0], W_K = [0, 1, 0, 0])

d_k = 1  ->  Skalierung 1/sqrt(d_k) = 1  (entfällt).

Nur numpy noetig. Schreibt outputs/mini_h1.json und outputs/mini_h2.json.
"""

import json
import math
import os

import numpy as np

TOKENS = ["the₁", "cat", "sat", "on", "the₂", "mat"]

# dim0 = "ist ein Artikel", dim1 = "ist ein Nomen/Ding",
# dim2 = "ist ein Verb",     dim3 = "gleiche Kongruenz-Gruppe"
EMBEDDINGS = np.array(
    [
        [0.9, 0.1, 0.0, 1.0],  # the₁
        [0.1, 0.9, 0.1, 1.0],  # cat
        [0.0, 0.3, 1.0, 0.0],  # sat
        [0.5, 0.4, 0.3, 0.2],  # on
        [0.9, 0.1, 0.0, 1.0],  # the₂
        [0.1, 0.9, 0.2, 1.0],  # mat
    ]
)

HEADS = {
    "H1 Artikel<->Nomen": (
        np.array([[1.0, 0.0, 0.0, 1.0]]),
        np.array([[1.0, 0.0, 0.0, 1.0]]),
    ),
    "H2 Subjekt<->Verb": (
        np.array([[0.0, 1.0, 1.0, 0.0]]),
        np.array([[0.0, 1.0, 0.0, 0.0]]),
    ),
}


def causal_mask(n):
    """Strict-upper triangle -> -inf (Autoregression: nur Token 0..i)."""
    mask = np.full((n, n), -np.inf)
    mask[np.tril_indices(n)] = 0.0
    return mask


def softmax_rows(M):
    out = np.exp(M - M.max(axis=1, keepdims=True))
    return out / out.sum(axis=1, keepdims=True)


def run_head(name, wq, wk):
    n = len(TOKENS)
    q = EMBEDDINGS @ wq.T  # (n, 1)
    k = EMBEDDINGS @ wk.T  # (n, 1)

    scores = q @ k.T  # raw, VOR Maske
    masked = scores + causal_mask(n)
    A = softmax_rows(masked)

    print("=" * 70)
    print(f"Kopf: {name}")
    print("=" * 70)
    print("Token    e0   e1   e2   e3   |  q (Frage)   k (Angebot)")
    for i, t in enumerate(TOKENS):
        print(
            f"{t:>8} {EMBEDDINGS[i][0]:4.1f} {EMBEDDINGS[i][1]:4.1f} "
            f"{EMBEDDINGS[i][2]:4.1f} {EMBEDDINGS[i][3]:4.1f} | "
            f"{q[i][0]:7.1f}      {k[i][0]:7.1f}"
        )

    print("\nScore-Matrix Q·Kᵀ (VOR Kausalmaske):")
    print(np.round(scores, 2))

    print("\nScore-Matrix NACH Kausalmaske (oberes Dreieck = -oo):")
    display = scores.copy()
    display[np.triu_indices(n, 1)] = np.nan
    print(np.round(display, 2))

    print("\nAttention A = softmax(Spalten, pro Zeile) – Zeilensummen = 1:")
    for i, t in enumerate(TOKENS):
        row = "  ".join(f"{v:5.2f}" for v in A[i])
        print(f"  {t:>8} | {row}   (Σ={A[i].sum():.2f})")
    print(f"  Zeilensummen: {A.sum(axis=1)}")
    print()

    return {
        "name": name,
        "tokens": TOKENS,
        "embeddings": EMBEDDINGS.tolist(),
        "q": q.tolist(),
        "k": k.tolist(),
        "scores_raw": scores.tolist(),
        "attention": A.tolist(),
    }


def main():
    os.makedirs("outputs", exist_ok=True)
    all_out = {}
    for name, (wq, wk) in HEADS.items():
        result = run_head(name, wq, wk)
        key = "mini_h1" if "H1" in name else "mini_h2"
        all_out[key] = result
        path = os.path.join("outputs", key + ".json")
        with open(path, "w") as fh:
            json.dump(result, fh, indent=2)
        print(f"-> geschrieben: {path}")

    # Beispiel-Zelle per Hand (cat -> the₁, Kopf 1):
    #   q_cat = 0.1 + 1.0 = 1.1 ; k_the = 0.9 + 1.0 = 1.9
    #   score(cat,the) = 1.1 * 1.9 = 2.09 ; score(cat,cat) = 1.1*1.1 = 1.21
    e2 = math.exp(2.09)
    e1 = math.exp(1.21)
    print("\nKontrolle einer Zelle (cat->the₁, Kopf1):")
    print(f"  exp(2.09) / (exp(2.09)+exp(1.21)) = {e2/(e2+e1):.4f}")


if __name__ == "__main__":
    main()