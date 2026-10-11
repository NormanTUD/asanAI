"""
Attention, from scratch.

Pure Python. The only import is the standard library ``math`` (for sqrt and
exp). No numpy, no torch, no tensorflow -- every matrix operation below is
written by hand so you can see exactly what the frameworks do for you.

This file implements the single equation at the heart of the transformer:

    Attention(Q, K, V) = Softmax( Q K^T / sqrt(d_k) ) V

Q, K and V are lists of row-vectors (one per token). We build the pieces --
the dot product, the numerically-stable softmax, and the causal mask -- and
then compose them into the scaled-dot-product attention that the lesson
explains. A small worked example runs at the bottom.

Run it directly:
    python3 custom.py
"""

import math


# ─────────────────────────────────────────────────────────────────────────────
# 1. Vectors and matrices, built by hand
# ─────────────────────────────────────────────────────────────────────────────
# A vector is a plain list of floats, e.g. [0.1, -0.2, 0.3].
# A matrix is a list of row-vectors, e.g. [[1, 0], [0, 1]].

def dot(u, v):
    """Dot product of two equal-length vectors: the sum of pairwise products."""
    return sum(a * b for a, b in zip(u, v))


def matvec(W, x):
    """Matrix (m x n) times vector (n) gives a vector (m)."""
    return [dot(row, x) for row in W]


def matmul(A, B):
    """Matrix A (m x n) times matrix B (n x p) gives a matrix (m x p)."""
    B_cols = list(zip(*B))
    return [[dot(a_row, b_col) for b_col in B_cols] for a_row in A]


# ─────────────────────────────────────────────────────────────────────────────
# 2. Softmax -- turns a row of scores into a row of probabilities
# ─────────────────────────────────────────────────────────────────────────────
def softmax(z):
    """
    Numerically stable softmax of a 1-D list of scores.

    Before exponentiating we subtract the row's maximum, so the largest
    exponent is e^0 = 1. That keeps the numbers from overflowing when the
    scores are large. The result always has non-negative entries that sum to 1.
    """
    m = max(z)
    exps = [math.exp(s - m) for s in z]
    total = sum(exps)
    return [e / total for e in exps]


# ─────────────────────────────────────────────────────────────────────────────
# 3. The causal mask -- a token may only look at itself and the past
# ─────────────────────────────────────────────────────────────────────────────
def causal_mask(n):
    """
    A lower-triangular n x n matrix of 0/1 for a sequence of length n.

    mask[i][j] == 1 means "token i is allowed to attend to token j". Because
    the matrix is lower-triangular, token i can only see tokens 0..i and never
    the future -- which is exactly what makes the model autoregressive.
    """
    return [[1.0 if j <= i else 0.0 for j in range(n)] for i in range(n)]


# ─────────────────────────────────────────────────────────────────────────────
# 4. Scaled dot-product attention
# ─────────────────────────────────────────────────────────────────────────────
def attention(Q, K, V, mask=None):
    """
    Attention(Q, K, V) = Softmax( Q K^T / sqrt(d_k) ) V

    Q, K:  T x d_k   (a list of T row-vectors, each of length d_k)
    V:     T x d_v   (a list of T row-vectors, each of length d_v)
    mask:  optional T x T 0/1 matrix; 0 entries are hidden (set to -inf)

    Returns (out, weights) where
      weights: T x T, each row is the attention probabilities of one query
      out:     T x d_v, each row is a query's weighted blend of the values
    """
    d_k = len(Q[0])
    scale = 1.0 / math.sqrt(d_k)

    # Step 1 -- raw scores.  S[i][j] = dot(query_i, key_j) / sqrt(d_k)
    S = [[dot(q_i, k_j) * scale for k_j in K] for q_i in Q]

    # Step 2 -- apply the causal mask: hide every position marked 0.
    if mask is not None:
        S = [[s if m else float("-inf") for m, s in zip(m_row, s_row)]
             for m_row, s_row in zip(mask, S)]

    # Step 3 -- softmax over each row. Every row now sums to 1.
    weights = [softmax(row) for row in S]

    # Step 4 -- each output is the weighted sum of the value vectors:
    #           out_i = sum_j weights[i][j] * V[j]
    out = []
    for w in weights:
        acc = [0.0] * len(V[0])
        for j, w_j in enumerate(w):
            for c in range(len(V[0])):
                acc[c] += w_j * V[j][c]
        out.append(acc)

    return out, weights


if __name__ == "__main__":
    # A tiny worked example: 3 tokens, each a 2-D vector, one head (d_k = 2).
    Q = [[1.0, 0.0],        # token 0 "asks" about the [1, 0] direction
         [0.0, 1.0],        # token 1 "asks" about the [0, 1] direction
         [1.0, 1.0]]        # token 2 "asks" about both
    K = [[1.0, 0.0],        # each token "advertises" this key
         [0.0, 1.0],
         [0.0, 0.0]]        # ... except token 2 advertises nothing
    V = [[10.0, 0.0],       # token 0 "carries" the value [10, 0]
         [0.0, 10.0],       # token 1 "carries" the value [0, 10]
         [1.0, 1.0]]        # token 2 "carries" the value [1, 1]

    mask = causal_mask(len(Q))
    out, weights = attention(Q, K, V, mask)

    print("Attention weights (row = the querying token, column = a key token):")
    for i, row in enumerate(weights):
        print("  token %d: %s" % (i, ", ".join("%.3f" % w for w in row)))

    print("\nOutput vectors (each is a weighted blend of the value vectors):")
    for i, row in enumerate(out):
        print("  token %d: %s" % (i, ", ".join("%.3f" % x for x in row)))
