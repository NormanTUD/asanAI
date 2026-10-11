"""
A transformer, in PyTorch (the nanoGPT structure).

This is the framework version of the same transformer that custom.py builds by
hand. The structure is exactly nanoGPT's: a stack of Blocks, each Block being
the two-line residual recurrence

    x = x + CausalSelfAttention( LayerNorm(x) )
    x = x + MLP( LayerNorm(x) )

fed by a token embedding + a positional embedding, and finished by a final
LayerNorm and a linear head that scores the vocabulary.

Run it (needs torch installed):
    python3 pytorch.py
"""

import math

import torch
import torch.nn as nn
import torch.nn.functional as F


class CausalSelfAttention(nn.Module):
    """Project each token into Q, K, V (per head), then run masked attention."""

    def __init__(self, n_embd, n_head):
        super().__init__()
        assert n_embd % n_head == 0
        self.n_head = n_head
        self.head_dim = n_embd // n_head
        self.Wq = nn.Linear(n_embd, n_embd, bias=False)
        self.Wk = nn.Linear(n_embd, n_embd, bias=False)
        self.Wv = nn.Linear(n_embd, n_embd, bias=False)
        self.Wo = nn.Linear(n_embd, n_embd, bias=False)

    def forward(self, x):
        B, T, C = x.size()
        q = self.Wq(x).view(B, T, self.n_head, self.head_dim).transpose(1, 2)
        k = self.Wk(x).view(B, T, self.n_head, self.head_dim).transpose(1, 2)
        v = self.Wv(x).view(B, T, self.n_head, self.head_dim).transpose(1, 2)
        att = (q @ k.transpose(-2, -1)) * (1.0 / math.sqrt(self.head_dim))
        mask = torch.tril(torch.ones(T, T, device=x.device)).view(1, 1, T, T).bool()
        att = att.masked_fill(~mask, float("-inf"))
        att = F.softmax(att, dim=-1)
        y = att @ v
        y = y.transpose(1, 2).contiguous().view(B, T, C)
        return self.Wo(y)


class MLP(nn.Module):
    """The feed-forward network: expand to 4x, GELU, contract back to 1x."""

    def __init__(self, n_embd):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(n_embd, 4 * n_embd),
            nn.GELU(),
            nn.Linear(4 * n_embd, n_embd),
        )

    def forward(self, x):
        return self.net(x)


class Block(nn.Module):
    """One transformer block = the two-line residual recurrence."""

    def __init__(self, n_embd, n_head):
        super().__init__()
        self.ln1 = nn.LayerNorm(n_embd)
        self.attn = CausalSelfAttention(n_embd, n_head)
        self.ln2 = nn.LayerNorm(n_embd)
        self.mlp = MLP(n_embd)

    def forward(self, x):
        x = x + self.attn(self.ln1(x))
        x = x + self.mlp(self.ln2(x))
        return x


class GPT(nn.Module):
    """Embed tokens, run every block, normalise, and score the vocabulary."""

    def __init__(self, vocab_size, n_embd, n_head, n_layer, block_size):
        super().__init__()
        self.tok_emb = nn.Embedding(vocab_size, n_embd)
        self.pos_emb = nn.Embedding(block_size, n_embd)
        self.blocks = nn.ModuleList([Block(n_embd, n_head) for _ in range(n_layer)])
        self.ln_f = nn.LayerNorm(n_embd)
        self.lm_head = nn.Linear(n_embd, vocab_size, bias=False)

    def forward(self, idx):
        b, t = idx.size()
        pos = torch.arange(0, t, device=idx.device)
        x = self.tok_emb(idx) + self.pos_emb(pos).unsqueeze(0)
        for block in self.blocks:
            x = block(x)
        x = self.ln_f(x)
        return self.lm_head(x)


if __name__ == "__main__":
    torch.manual_seed(7)
    model = GPT(vocab_size=4, n_embd=8, n_head=2, n_layer=2, block_size=8)

    vocab = ["(pad)", "the", "cat", "sat"]
    idx = torch.tensor([[1, 2]])           # the prompt: "the cat"
    logits = model(idx)

    print("Prompt tokens:", [vocab[i] for i in idx[0].tolist()])
    print("Last-position logits:", [round(float(s), 3) for s in logits[0, -1].tolist()])
    next_id = int(logits[0, -1].argmax())
    print("Predicted next token:", vocab[next_id])
