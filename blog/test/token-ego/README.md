# TOKEN / EGO

**You are one token inside a transformer.** For one forward pass, the game puts you in the residual stream, inside the attention heads, inside the embedding space, and inside the 512-neuron feed-forward layer. Everything is 3D, first-person, and driven by a real forward pass.

Open `index.html` directly, or open the single-file build `dist/token-ego.html`. No server, no network, no build step is needed to play.

```bash
# play the source version
xdg-open index.html

# rebuild the single self-contained file
python3 tools/build.py
xdg-open dist/token-ego.html

# the model / math tests
node tests/model_test.js
```

## The promise

- **A real forward pass, not an animation of one.** The model is a decoder-only transformer with 6 layers, 4 causal attention heads, `d_model = 128`, `d_head = 32`, `d_ff = 512`, a 258-token vocabulary, and 1,227,008 parameters. All numbers in the monitors come from that model.
- **Exact arithmetic.** LayerNorm, Q/K/V projections, scaled dot-product attention, the causal mask, softmax, the value weighted sum, W_O, GELU, W_1/W_2, the residual adds, the final LayerNorm, and the tied unembedding are the standard equations. The residual ledger reconstructs the final vector to about `1e-7`.
- **Honest weights.** The token directions are a PCA projection of real model2vec `potion-base-8M` static embeddings. The attention and MLP weights are a seeded, structured synthetic checkpoint built for interpretability: each head owns a fixed 32-dimensional slice, and W_Q/W_K/W_V/W_O are orthogonal rotations inside that slice. No pretrained transformer checkpoint is used. The in-game codex says this too.
- **Directions, not distances.** A token is a direction in 128-dimensional space. Similarity is the angle between directions: a **small angle** means a similar direction. The 3D clouds are PCA projections for the eye; the exact similarity is the cosine shown in the lists.

## Controls

| input | action |
|---|---|
| **Space / N / Enter** | continue to the next step |
| **P** | pause / resume |
| **A** | toggle guided / auto pacing |
| **1–4** | select attention head (all four are always computed and visible) |
| **O** | all at once: all four heads + FFN chamber + residual braid |
| **M** | math monitor (Vector, Attention, FFN, Residual, Logits) |
| **W** | weight inspector (W_Q, W_K, W_V, W_O, W₁, W₂, LN) |
| **D** | 128-dimensional vector inspector |
| **C** | codex: the equations and sources |
| **H** | help |
| **V** | orbit view |
| **Q** | quality |
| **S** | sound |
| **R** | replay |
| drag | look around (ego view) |
| click a token | inspect it; during the attention challenge, guess it |

The default is **guided**: every beat waits for you. The scene keeps breathing, but the explanation does not run away. If you want a film, press **A** or click **Auto**.

## What you can see

### Boot → tokenization
The sentence is a line of discrete tokens. You are the white one. The past is gold, the future is violet. The token id is an integer; the model has not seen the word.

### Embedding matrix
A tall 258 × 128 wall. The token id selects one row. The row is the token's 128-dimensional embedding. The camera flies toward the selected row.

### Embedding space
You are inside the semantic cloud. The 128 filaments radiating from you are the dimensions of your direction: length is magnitude, cyan is positive, magenta is negative. The nearby stars are other token directions, connected into a constellation. The list on the right gives the exact cosine similarity, `cos θ`. The 3D layout is a PCA projection, so nearness is only a hint: **small angle = similar direction**.

### Position
A fixed sinusoidal position vector `P_pos` is added. Cyan = `E[token]`, gold = `P`, white = `x₀ = E + P`. The 128 dimensions combine dimension by dimension. The model now knows what you are and where you are.

### The six layers
Every layer is a ring in the tower around a central residual-stream pillar.

1. **LayerNorm** — a lens centres your vector (mean 0, variance 1). It is a normalized copy for the next sublayer; the residual stream is unchanged.
2. **Q · K · V** — your token splits into Q, K, V ghost crystals. Three holographic panels show the actual 32-dimensional head slice. Q is what you are looking for; K is what you offer; V is what you hand over.
3. **Attention** — the beams are the four heads at once. Thickness and brightness are `α`. The future is behind a luminous causal curtain: its score is `−∞`. The right HUD shows the player row; the **α / QKᵀ / mask** tabs let you switch between the raw scores, the causal mask, and the softmax. The math monitor has all four head matrices, the full score/mask/α matrices, and the exact numbers.
4. **Mix** — value particles flow from the attended tokens into you; the crystal tint warms. The attention budget list shows each `α` and the weighted value contribution `‖α·v‖`. The deep-dive panel draws the head-to-tail vector addition `z = Σ α v`. This is where you become a weighted mixture.
5. **Write** — the mixed head output is projected by `W_O` and added to the residual stream. Nothing is overwritten. The 128-bar collar around the pillar morphs to the new vector.
6. **FFN** — the camera becomes the vector and travels through the chamber: `LN(x)` → W₁ → 512 neurons → GELU → W₂ → `y`. All 512 neurons glow; the top connections are drawn; the weight walls show the actual W₁/W₂. The math monitor opens one neuron and shows its 128 W₁ weights and 128 W₂ weights.
7. **Residual add** — `x ← x + y`. The collar morphs again, the norm sparkline rises, and the layer lifts to the next ring.

The **braid** of six coloured helices around the pillar is the residual stream as a sum of writes. The **ledger** panel decomposes your final vector into the embedding, every attention head write, every attention bias, and every FFN write, and reports the reconstruction error.

### Unembedding
The final vector is multiplied by the tied embedding matrix. 258 token stars form the probability sky. Size and brightness are softmax probability. The temperature slider rescales the logits: low T sharpens the sky, high T flattens it. You choose a star. The chosen token is appended to the sequence, you become it, and the next forward pass begins.

### All at once
Press **O**. The FFN chamber opens inside the attention ring, all four head beams remain visible, and the residual braid keeps flowing. This is the layer as one simultaneous object instead of a sequence of steps.

## Guided, not a movie

The director is a list of beats. In guided mode a beat never advances until you press Space, Enter, or **Continue**. Each beat has three layers of text:

- a poetic caption,
- the exact equation,
- **what you see** and **what it means**.

The in-beat animation (camera, particles, collar morph) continues while you read. Press **P** to freeze it.

The **attention challenge** asks you to predict which past token gets the largest α under the current head. Click the token chip or click the token in 3D. A correct answer adds **resonance**; the answer is highlighted either way. Completing a layer and choosing a next token also add resonance. It is a small game layer on top of the exact computation, not a replacement for it.

## Technical correctness

- **Pre-LN decoder-only transformer.** `x = x + Attn(LN(x))`, then `x = x + MLP(LN(x))`, final LN, tied unembedding.
- **Sinusoidal positions** (Vaswani et al.), not learned positions. The rest of the architecture is GPT-2-like: pre-LN, GELU, tied embeddings. This is a pedagogical hybrid, not a specific checkpoint.
- **Causal mask:** `j > i` gets `−∞` before softmax, so exactly 0 weight. The game checks `Σ α = 1` and `max future α = 0` in the attention panel.
- **Multi-head:** 4 heads × 32 dimensions; the 128-dimensional residual stream is split into four fixed slices. Each head uses orthogonal rotations of its slice.
- **GELU:** the tanh approximation used by GPT-2: `0.5x(1 + tanh(√(2/π)(x + 0.044715x³)))`.
- **Residual ledger:** the additive decomposition is checked numerically; the reconstruction error is shown in the panel.
- **Embedding similarity:** cosine, not Euclidean distance. The 3D projection is explicitly labelled as a projection.
- **Synthetic checkpoint:** the attention/MLP weights are generated once from a seed. The token directions are real model2vec embeddings projected by PCA. This is stated in the title, the codex, the math panel, and the README.
- **No network, no telemetry.** All graphics and audio are generated locally; three.js is vendored and the final file inlines it.

## Sources

- Vaswani et al., *Attention Is All You Need* (2017). https://arxiv.org/abs/1706.03762
- Elhage et al., *A Mathematical Framework for Transformer Circuits* (2021). https://transformer-circuits.pub/2021/framework/index.html
- Ba, Kiros & Hinton, *Layer Normalization* (2016). https://arxiv.org/abs/1607.06450
- Hendrycks & Gimpel, *Gaussian Error Linear Units (GELUs)* (2016). https://arxiv.org/abs/1606.08415
- Radford et al., *Language Models are Unsupervised Multitask Learners* (2019). https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf
- model2vec / potion-base-8M: https://huggingface.co/minishlab/potion-base-8M

The full derivation, parameter count and the visual-mapping contract are in [`research.md`](research.md).

## Files

```
index.html                 source shell (works directly from file://)
src/config.js              architecture constants, prompts, palette, phases
src/embeddings.js          generated 258 × 128 token directions + 3D PCA map
src/util.js                math, PRNG, easing, canvas labels, heatmaps
src/model.js               the actual transformer forward pass + trace
src/shaders.js             custom GLSL materials and post-processing
src/audio.js               small Web Audio score, no files
src/scene.js               Three.js world: tower, embeddings, attention, FFN, sky
src/ui.js                  HUD, explanations, math/weight/dimension panels
src/game.js                guided director, input, challenge, loop
src/style.css              HUD, title screen, panels
vendor/                    three.js r160 + post-processing passes
tools/gen_embeddings.py    model2vec → PCA → src/embeddings.js
tools/build.py             inline everything → dist/token-ego.html
tests/model_test.js        white-box + black-box forward-pass tests
```

## Build

```bash
python3 tools/gen_embeddings.py   # only if the vocabulary changes
python3 tools/build.py            # single self-contained dist/token-ego.html
```

The final file is about 1.3 MiB and works from `file://`.
