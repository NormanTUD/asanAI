"""
A transformer, in TensorFlow.

The framework version of the same transformer that custom.py builds by hand.
The structure mirrors nanoGPT: a stack of Blocks, each Block being

    x = x + CausalSelfAttention( LayerNorm(x) )
    x = x + MLP( LayerNorm(x) )

fed by a token embedding + a positional embedding, and finished by a final
LayerNorm and a linear head that scores the vocabulary.

Run it (needs tensorflow installed):
    python3 tensorflow.py
"""

import math

import tensorflow as tf
from tensorflow.keras import layers


class CausalSelfAttention(layers.Layer):
    """Project each token into Q, K, V (per head), then run masked attention."""

    def __init__(self, n_embd, n_head, **kwargs):
        super().__init__(**kwargs)
        assert n_embd % n_head == 0
        self.n_head = n_head
        self.head_dim = n_embd // n_head
        self.Wq = layers.Dense(n_embd, use_bias=False)
        self.Wk = layers.Dense(n_embd, use_bias=False)
        self.Wv = layers.Dense(n_embd, use_bias=False)
        self.Wo = layers.Dense(n_embd, use_bias=False)

    def call(self, x):
        B, T, C = int(x.shape[0]), int(x.shape[1]), int(x.shape[2])

        def split(t):
            t = tf.reshape(t, (B, T, self.n_head, self.head_dim))
            return tf.transpose(t, (0, 2, 1, 3))

        q, k, v = split(self.Wq(x)), split(self.Wk(x)), split(self.Wv(x))
        mask = tf.linalg.band_part(tf.ones((T, T)), -1, 0) > 0
        mask = tf.expand_dims(tf.expand_dims(mask, 0), 0)
        scores = tf.matmul(q, k, transpose_b=True) / math.sqrt(float(self.head_dim))
        scores = tf.where(mask, scores, tf.fill(tf.shape(scores), -1e9))
        att = tf.nn.softmax(scores)
        y = tf.matmul(att, v)
        y = tf.reshape(tf.transpose(y, (0, 2, 1, 3)), (B, T, C))
        return self.Wo(y)


class Block(layers.Layer):
    """One transformer block = the two-line residual recurrence."""

    def __init__(self, n_embd, n_head, **kwargs):
        super().__init__(**kwargs)
        self.ln1 = layers.LayerNormalization()
        self.attn = CausalSelfAttention(n_embd, n_head)
        self.ln2 = layers.LayerNormalization()
        self.mlp = tf.keras.Sequential([
            layers.Dense(4 * n_embd, activation="gelu"),
            layers.Dense(n_embd),
        ])

    def call(self, x):
        x = x + self.attn(self.ln1(x))
        x = x + self.mlp(self.ln2(x))
        return x


class GPT(layers.Layer):
    """Embed tokens, run every block, normalise, and score the vocabulary."""

    def __init__(self, vocab_size, n_embd, n_head, n_layer, block_size, **kwargs):
        super().__init__(**kwargs)
        self.tok_emb = layers.Embedding(vocab_size, n_embd)
        self.pos_emb = layers.Embedding(block_size, n_embd)
        self.blocks = [Block(n_embd, n_head) for _ in range(n_layer)]
        self.ln_f = layers.LayerNormalization()
        self.lm_head = layers.Dense(vocab_size, use_bias=False)

    def call(self, idx):
        t = int(idx.shape[1])
        pos = tf.range(t)
        x = self.tok_emb(idx) + tf.expand_dims(self.pos_emb(pos), 0)
        for block in self.blocks:
            x = block(x)
        x = self.ln_f(x)
        return self.lm_head(x)


if __name__ == "__main__":
    tf.random.set_seed(7)
    model = GPT(vocab_size=4, n_embd=8, n_head=2, n_layer=2, block_size=8)

    vocab = ["(pad)", "the", "cat", "sat"]
    idx = tf.constant([[1, 2]])            # the prompt: "the cat"
    logits = model(idx)

    print("Prompt tokens:", [vocab[i] for i in idx[0].numpy().tolist()])
    print("Last-position logits:", [round(float(s), 3) for s in logits[0, -1].numpy().tolist()])
    next_id = int(tf.argmax(logits[0, -1]).numpy())
    print("Predicted next token:", vocab[next_id])
