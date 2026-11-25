"""
Attention, in PyTorch.

This is the framework version of the same scaled-dot-product attention that
custom.py builds by hand. Here the matrix products and the softmax are done
by torch, but the logic is identical:

    Attention(Q, K, V) = Softmax( Q K^T / sqrt(d_k) ) V

Run it (needs torch installed):
    python3 pytorch.py
"""

import math

import torch
import torch.nn.functional as F


def causal_mask(n, device):
    """A lower-triangular n x n boolean mask: token i may see tokens 0..i."""
    return torch.tril(torch.ones(n, n, device=device)).bool()


def attention(Q, K, V, mask=None):
    """
    Q, K: (T, d_k), V: (T, d_v) 2-D tensors.
    Returns (out, weights): out (T, d_v), weights (T, T).
    """
    d_k = Q.size(-1)
    S = (Q @ K.T) * (1.0 / math.sqrt(d_k))          # raw scores
    if mask is not None:
        S = S.masked_fill(~mask, float("-inf"))     # hide forbidden positions
    weights = F.softmax(S, dim=-1)                 # each row sums to 1
    out = weights @ V                              # weighted blend of values
    return out, weights


if __name__ == "__main__":
    # The same worked example as custom.py, so the numbers match.
    Q = torch.tensor([[1.0, 0.0],
                      [0.0, 1.0],
                      [1.0, 1.0]])
    K = torch.tensor([[1.0, 0.0],
                      [0.0, 1.0],
                      [0.0, 0.0]])
    V = torch.tensor([[10.0, 0.0],
                      [0.0, 10.0],
                      [1.0, 1.0]])

    mask = causal_mask(3, Q.device)
    out, weights = attention(Q, K, V, mask)

    print("Attention weights (row = query token, col = key token):")
    print(weights.numpy())
    print("\nOutput vectors (each is a weighted blend of the values):")
    print(out.numpy())
