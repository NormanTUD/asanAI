"""
A transformer, from scratch.

Pure Python. The only imports are the standard library ``math`` (for sqrt and
exp) and ``random`` (for reproducible weight initialisation). No numpy, no
torch, no tensorflow -- every matrix product, the numerically-stable softmax,
the causal mask and the whole stack of layers are written by hand.

The structure follows nanoGPT: a stack of ``Block``s, each of which is the
two-line residual recurrence

    z = x + CausalSelfAttention( LayerNorm(x) )
    h = z + MLP( LayerNorm(z) )

fed by a token embedding + a positional embedding, and finished by a final
LayerNorm and a linear projection that turns the last hidden vector into a
logit for every token in the vocabulary.

Run it directly:
    python3 custom.py
"""

import math
import random


# ─────────────────────────────────────────────────────────────────────────────
# 1. Vectors and matrices, built by hand
# ─────────────────────────────────────────────────────────────────────────────
def dot(u, v):
    """Dot product of two equal-length vectors."""
    return sum(a * b for a, b in zip(u, v))


def matvec(W, x):
    """Matrix (m x n) times vector (n) gives a vector (m)."""
    return [dot(row, x) for row in W]


def add_vectors(a, b):
    """Element-wise sum of two equal-length vectors."""
    return [x + y for x, y in zip(a, b)]


def softmax(z):
    """
    Numerically stable softmax: subtract the row's max before exponentiating
    so the numbers cannot overflow. The result sums to 1.
    """
    m = max(z)
    exps = [math.exp(s - m) for s in z]
    total = sum(exps)
    return [e / total for e in exps]


def causal_mask(n):
    """Lower-triangular n x n 0/1 mask: token i may see tokens 0..i only."""
    return [[1.0 if j <= i else 0.0 for j in range(n)] for i in range(n)]


def attention(Q, K, V, mask=None):
    """
    Attention(Q, K, V) = Softmax( Q K^T / sqrt(d_k) ) V.
    Returns (out, weights); each row of weights is one query's probabilities.
    """
    scale = 1.0 / math.sqrt(len(Q[0]))
    S = [[dot(q_i, k_j) * scale for k_j in K] for q_i in Q]
    if mask is not None:
        S = [[s if m else float("-inf") for m, s in zip(m_row, s_row)]
             for m_row, s_row in zip(mask, S)]
    weights = [softmax(row) for row in S]
    out = []
    for w in weights:
        acc = [0.0] * len(V[0])
        for j, w_j in enumerate(w):
            for c in range(len(V[0])):
                acc[c] += w_j * V[j][c]
        out.append(acc)
    return out, weights


# ─────────────────────────────────────────────────────────────────────────────
# 2. The layers
# ─────────────────────────────────────────────────────────────────────────────
class Linear:
    """A learned linear map  y = W x + b, with W (out_dim x in_dim)."""

    def __init__(self, in_dim, out_dim, seed):
        rng = random.Random(seed)
        scale = 1.0 / math.sqrt(in_dim)
        self.W = [[rng.uniform(-scale, scale) for _ in range(in_dim)]
                  for _ in range(out_dim)]
        self.b = [0.0] * out_dim

    def __call__(self, x):
        z = matvec(self.W, x)
        return [z[i] + self.b[i] for i in range(len(z))]


def gelu(x):
    """GELU -- the smooth non-linearity nanoGPT/GPT-2 use (a tanh fit)."""
    c = math.sqrt(2.0 / math.pi)
    return 0.5 * x * (1.0 + math.tanh(c * (x + 0.044715 * x * x * x)))


class LayerNorm:
    """Rescale a token to mean 0 / std 1, then apply a learned scale + shift."""

    def __init__(self, dim, eps=1e-5):
        self.gamma = [1.0] * dim
        self.beta = [0.0] * dim
        self.eps = eps

    def __call__(self, x):
        n = len(x)
        mean = sum(x) / n
        var = sum((xi - mean) ** 2 for xi in x) / n
        std = math.sqrt(var + self.eps)
        return [self.gamma[i] * (x[i] - mean) / std + self.beta[i]
                for i in range(n)]


class CausalSelfAttention:
    """Project each token into Q, K, V, then run masked scaled attention."""

    def __init__(self, dim, n_head, seed):
        assert dim % n_head == 0
        self.n_head = n_head
        self.head_dim = dim // n_head
        self.Wq = Linear(dim, dim, seed + 1)
        self.Wk = Linear(dim, dim, seed + 2)
        self.Wv = Linear(dim, dim, seed + 3)
        self.Wo = Linear(dim, dim, seed + 4)

    def __call__(self, xs, return_weights=False):
        q = [self.Wq(x) for x in xs]
        k = [self.Wk(x) for x in xs]
        v = [self.Wv(x) for x in xs]
        # (Multi-head attention runs this on n_head slices of each vector in
        # parallel and concatenates the results; here we use the full dim.)
        out, weights = attention(q, k, v, causal_mask(len(xs)))
        proj = [self.Wo(y) for y in out]
        if return_weights:
            return proj, weights
        return proj


class MLP:
    """The feed-forward network: expand to 4x, GELU, contract back to 1x."""

    def __init__(self, dim, seed):
        self.fc = Linear(dim, 4 * dim, seed + 1)
        self.proj = Linear(4 * dim, dim, seed + 2)

    def __call__(self, x):
        return self.proj([gelu(v) for v in self.fc(x)])


class Block:
    """One transformer block = the two-line residual recurrence."""

    def __init__(self, dim, n_head, seed):
        self.ln1 = LayerNorm(dim)
        self.attn = CausalSelfAttention(dim, n_head, seed + 1)
        self.ln2 = LayerNorm(dim)
        self.mlp = MLP(dim, seed + 2)

    def __call__(self, xs, return_weights=False):
        if return_weights:
            attn_out, weights = self.attn([self.ln1(x) for x in xs],
                                          return_weights=True)
        else:
            attn_out = self.attn([self.ln1(x) for x in xs])
            weights = None
        xs = [add_vectors(xs[i], attn_out[i]) for i in range(len(xs))]
        xs = [add_vectors(xs[i], self.mlp(self.ln2(x)))
              for i, x in enumerate(xs)]
        if return_weights:
            return xs, weights
        return xs


class GPT:
    """Embed tokens, run every block, normalise, and score the vocabulary."""

    def __init__(self, vocab_size, n_embd, n_head, n_layer, block_size, seed=1):
        rng = random.Random(seed)
        scale = 1.0 / math.sqrt(n_embd)
        self.tok_emb = [[rng.uniform(-scale, scale) for _ in range(n_embd)]
                        for _ in range(vocab_size)]
        self.pos_emb = [[rng.uniform(-scale, scale) for _ in range(n_embd)]
                        for _ in range(block_size)]
        self.blocks = [Block(n_embd, n_head, seed + i + 1)
                       for i in range(n_layer)]
        self.ln_f = LayerNorm(n_embd)
        self.lm_head = Linear(n_embd, vocab_size, seed + 100)

    def forward(self, ids, return_weights=False):
        """
        ids: a list of token ints (the prompt).
        Returns ``logits``: one row per position, each row a score for every
        token in the vocabulary (the last row predicts the next token).
        """
        dim = len(self.tok_emb[0])
        assert len(ids) <= len(self.pos_emb)
        xs = [[self.tok_emb[t][c] + self.pos_emb[p][c] for c in range(dim)]
              for p, t in enumerate(ids)]
        weights_by_layer = []
        for block in self.blocks:
            if return_weights:
                xs, weights = block(xs, return_weights=True)
                weights_by_layer.append(weights)
            else:
                xs = block(xs)
        xs = [self.ln_f(x) for x in xs]
        logits = [self.lm_head(x) for x in xs]
        if return_weights:
            return logits, weights_by_layer
        return logits


if __name__ == "__main__":
    # A tiny GPT: 4 "words", 8-D vectors, 2 heads, 2 layers, block of 8.
    vocab = ["<pad>", "the", "cat", "sat"]
    tok2id = {t: i for i, t in enumerate(vocab)}
    model = GPT(vocab_size=4, n_embd=8, n_head=2, n_layer=2, block_size=8, seed=7)

    prompt = [tok2id["the"], tok2id["cat"]]
    logits, weights = model.forward(prompt, return_weights=True)

    print("Prompt tokens:", [vocab[t] for t in prompt])
    print("\nLast-position logits (a score for every token in the vocab):")
    for i, score in enumerate(logits[-1]):
        print("  %s: %.3f" % (vocab[i], score))

    next_id = max(range(len(logits[-1])), key=lambda i: logits[-1][i])
    print("\nPredicted next token (the argmax): %r" % vocab[next_id])

    print("\nFirst block attention weights (row = query position, col = key):")
    for row in weights[0]:
        print("  " + ", ".join("%.3f" % x for x in row))
