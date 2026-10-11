"""
Attention, in TensorFlow.

The framework version of the same scaled-dot-product attention that custom.py
builds by hand. The logic is identical:

    Attention(Q, K, V) = Softmax( Q K^T / sqrt(d_k) ) V

Run it (needs tensorflow installed):
    python3 tensorflow.py
"""

import math

import tensorflow as tf


def causal_mask(n):
    """A lower-triangular n x n float mask: token i may see tokens 0..i."""
    return tf.linalg.band_part(tf.ones((n, n)), -1, 0)


def attention(Q, K, V, mask=None):
    """
    Q, K: (T, d_k), V: (T, d_v) 2-D tensors.
    Returns (out, weights): out (T, d_v), weights (T, T).
    """
    d_k = Q.shape[-1]
    S = tf.matmul(Q, tf.transpose(K)) * (1.0 / math.sqrt(float(d_k)))
    if mask is not None:
        S = tf.where(mask > 0, S, tf.fill(tf.shape(S), -1e9))
    weights = tf.nn.softmax(S, axis=-1)
    out = tf.matmul(weights, V)
    return out, weights


if __name__ == "__main__":
    # The same worked example as custom.py, so the numbers match.
    Q = tf.constant([[1.0, 0.0],
                     [0.0, 1.0],
                     [1.0, 1.0]])
    K = tf.constant([[1.0, 0.0],
                     [0.0, 1.0],
                     [0.0, 0.0]])
    V = tf.constant([[10.0, 0.0],
                     [0.0, 10.0],
                     [1.0, 1.0]])

    mask = causal_mask(3)
    out, weights = attention(Q, K, V, mask)

    print("Attention weights (row = query token, col = key token):")
    print(weights.numpy())
    print("\nOutput vectors (each is a weighted blend of the values):")
    print(out.numpy())
