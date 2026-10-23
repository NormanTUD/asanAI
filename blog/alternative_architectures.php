<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Beyond Transformers (Mamba, RWKV, RetNet)
description: State-space models (Mamba, S4), linear attention, RWKV, and the post-transformer landscape.
icon: &#9883;
part: 4
order: 17
color: sky
topics: architecture, math-i, math-ii, programming
tags: math-heavy, code-heavy
math: 58
-->

<div class="md">
The Transformer is not the end of the road. Its $O(n^2)$ attention cost creates a quadratic wall: doubling the context length quadruples compute and memory. For long-context applications (genomes, codebases, hour-long video), this is prohibitive. Since 2020, a small but rapidly growing field has produced **sub-quadratic alternatives** that match Transformers on language modelling while scaling to million-token contexts.

This chapter surveys the main candidates, with the mathematical core of each. The reason the field keeps circling back to a small palette of building blocks — recurrence, convolution, attention — is that each one is, in functional-programming terms, a **higher-order function** (a fold, a windowed map, and so on) that a network can reuse, so that a model is "a very rough functional program, with these flexible, learnable pieces" (\cite[Olah, 2015]{colah2015types}).
</div>

<div class="md" data-mathlevel="55">
## The Quadratic Wall

**KV-cache mitigation:** Even standard Transformers handle long contexts via **KV-caching** (see the Production Serving chapter), which stores past K/V matrices so per-token compute stays linear in sequence length during autoregressive generation. The O(n²) cost appears in **training** and in **prefill** of long prompts; generation with a KV cache is O(n) per token. The practical gap between Transformers and sub-quadratic alternatives is therefore smaller than the asymptotic notation suggests.

Standard self-attention (see the <a href="attentionlab">Attention chapter</a>) computes:

$$
\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right) V
$$

where $d_k$ is the dimension of the keys (the head dimension). The $QK^\top$ matrix has shape $n \times n$, where $n$ is the sequence length. Both compute and memory scale as $O(n^2)$. For $n = 128{,}000$, that matrix alone is $128{,}000^2 \times 2$ bytes $\approx 33$ GB in fp16. The architectural alternatives attack this in three different ways:

| Approach | Idea | Memory |
|----------|------|--------|
| **Sparse / Sliding-window attention** | Attend only to a local window (Mistral, Longformer) | $O(n \cdot w)$ |
| **Linear attention** | Replace softmax with a kernel $\phi(Q)\phi(K)^\top$ | $O(n \cdot d)$ |
| **State-space models** | Maintain a fixed-size recurrent state | $O(d^2)$ |
| **Recurrence + windowed attention hybrids** | Jamba, Zamba, etc. | $O(n \cdot w)$ with SSM long range |
</div>

<div class="md" data-mathlevel="72">
## Sequence-model alternatives

### State-Space Models: S4 and Mamba

A **state-space model** (SSM) describes a continuous linear dynamical system:

$$
\dot{h}(t) = A h(t) + B x(t), \qquad y(t) = C h(t)
$$

where $x(t)$ is the input signal, $h(t) \in \mathbb{R}^{N}$ is the latent state, and $y(t)$ is the output. Discretized with step $\Delta$:

$$
h_t = \bar A h_{t-1} + \bar B x_t, \qquad y_t = C h_t
$$

where $\bar A = \exp(\Delta A)$, $\bar B = (\Delta A)^{-1}(\exp(\Delta A) - \mathbf{I}) \Delta B$.

This is a **linear recurrent network** with a fixed-size state $h_t \in \mathbb{R}^{N}$. Compute is $O(N)$ per step, memory is $O(N)$ regardless of sequence length. The lineage runs back through the [Networks with Memory](recurrent_networks.php) chapter: an LSTM is exactly this state update with a learned, gated nonlinearity bolted on — the gates decide *what to keep*, and the fixed-size state is why these models dominated before attention scaled up \cite{colah2015lstm,lstm}.
</div>

<div class="md">
#### S4

\cite[Gu et al. (2021)]{gu2021s4} made training stable by parameterizing $A$ in a **HiPPO structure** (high-order polynomial projection operator), which captures long-range dependencies efficiently. S4 set state-of-the-art on the Long Range Arena benchmark, beating Transformers by a large margin on sequences of length $16{,}000$.

#### Mamba

Mamba's key contribution (\cite[Gu & Dao, 2023]{gu2023mamba}) is making the SSM **input-dependent**:

$$
B_t, C_t, \Delta_t = \text{Linear}(x_t)
$$

i.e. the state-transition matrices depend on the current input. This breaks linearity at inference (the recurrence must be computed step by step), but allows the model to selectively remember or forget based on context. Mamba matches Transformer quality at language modelling, scales linearly in $n$, and at inference runs roughly as fast as a Transformer with KV-cache enabled (the standard optimized setting; see Production Serving chapter).
</div>

<div class="md">
#### Mamba-2 and SSD

Mamba-2 (\cite[Dao & Gu, 2024]{dao2024mamba2}) reveals that selective SSMs and attention are **algebraically dual** through a tensor contraction framework called **Structured State-Space Duality (SSD)**. In practice this lets Mamba-2 use an efficient attention-like kernel for compute, retaining the linear-time recurrence for inference.

#### Jamba (AI21, 2024): Hybrid SSM + Attention

Jamba interleaves Mamba and Transformer blocks in a 1:7 ratio:

$$
\text{block}_i = \begin{cases} \text{Mamba} & i \mod 8 \neq 0 \\ \text{Attention} & i \mod 8 = 0 \end{cases}
$$

This hybrid scales to 256K context (Jamba-1.5-Large), uses ~25% of the memory of an equivalent Transformer, and matches its quality. Other hybrids: Zamba (Zyphra), RecurrentGemma (Google), Striped Hyena (Together AI).
</div>

<div class="md" data-mathlevel="58">
### Linear Attention

The softmax in attention is what makes the operation non-associative, forcing the $O(n^2)$ cost. Replace softmax with a feature map $\phi$:

$$
\text{LinearAttn}(Q, K, V)_i = \frac{\phi(Q_i)^\top \sum_{j=1}^{n} \phi(K_j) V_j^\top}{\phi(Q_i)^\top \sum_{j=1}^{n} \phi(K_j)}
$$

By computing $\sum_j \phi(K_j) V_j^\top$ once as an $d \times d$ outer product (the “state”), compute drops to $O(n \cdot d^2)$ and memory is $O(d^2)$, independent of $n$.

#### Performer

$\phi(x) = \exp(-\|x\|^2/2) \cdot (\exp(\omega_1 \cdot x), \ldots, \exp(\omega_m \cdot x))$ for random $\omega_i \sim \mathcal{N}(0, I)$ (positive random features). Provably unbiased kernel approximation (\cite[Choromanski et al., 2021]{choromanski2021performer}).
</div>

<div class="md">
#### RetNet (Sun et al., Microsoft, 2023)

RetNet uses $\phi = \text{ELU} + 1$ (a simple element-wise nonlinearity) and supports three computation modes:

* **Parallel**: same $O(n^2 \cdot d)$ as Transformer during training.
* **Recurrent**: $O(d^2)$ state, like an SSM at inference.
* **Chunkwise**: hybrid, sliding window.

RetNet claims 8× lower latency and 7× lower memory than vanilla Transformer at inference.

#### RWKV

\cite[Peng et al. (2023)]{peng2023rwkv} introduced a linear-attention-with-decay RNN. RWKV-7 (2025) matches 7B Transformers on language tasks.
</div>

<div class="md" data-mathlevel="55">
### Diffusion Language Models: Denoising Instead of Decoding

Every architecture above still generates left to right. A **diffusion language model** (dLLM) attacks the serialism itself: instead of predicting one token per forward pass, it starts from a fully corrupted sequence and refines **all positions in parallel** over a handful of denoising steps, in the same spirit as image diffusion (\cite[Austin et al., 2021]{austin2021d3pm}).

The dominant formulation for text is an **absorbing-state** process. Each token is independently replaced by a special mask symbol $m$ with probability $\beta_t$ per step, and once masked it stays masked:

$$
\underbrace{q(x_t^{i} \mid x_0^{i}) = \bar{\alpha}_t\,\delta_{x_t^{i}=x_0^{i}} + (1-\bar{\alpha}_t)\,\delta_{x_t^{i}=m}}_{\text{at step } t \text{ the token is either still the original or has become a mask}},
\qquad
\underbrace{\bar{\alpha}_t = \prod_{s=1}^{t}(1-\beta_s)}_{\text{probability the token has survived unmasked so far}}
$$

At the final step the sequence is almost entirely masks. Training reverses the process with a weighted masked-token cross-entropy over randomly sampled masking rates:

$$
\underbrace{\mathcal{L} = -\,\mathbb{E}_{t,\,x_0,\,x_t}\left[\,w(t)\sum_{i:\,x_t^{i}=m}\log p_\theta(x_0^{i}\mid x_t)\right]}_{\text{cross-entropy only on the masked positions, at a randomly chosen masking rate}}
$$

That objective is BERT's fill-in-the-blank loss, rearranged so that it defines a principled generative process. Sampling starts from a fully masked sequence, asks the bidirectional Transformer for a distribution at every masked position, and commits the predictions whose confidence clears a threshold. Easy, constrained tokens (punctuation, function words) lock in first; hard content words last. Because the model attends in both directions, it can also revise earlier tokens in light of later ones and fill in the middle of a document natively.

The appeal is throughput: one forward pass can commit many tokens, and the number of denoising steps is an explicit quality-versus-speed dial. **LLaDA** (2025), an 8-billion-parameter masked diffusion model trained from scratch, reported in-context learning and instruction following competitive with Llama 3 8B — the first evidence that the recipe holds at mainstream open-model scale (\cite[Nie et al., 2025]{nie2025llada}). Inception Labs' Mercury and Google DeepMind's experimental Gemini Diffusion followed in 2025, reporting sampling speeds in the thousands of tokens per second on H100-class hardware.

The costs are real. Bidirectional attention is incompatible with the standard KV cache, so every denoising step recomputes attention over the whole sequence; the speedup depends on keeping the step count well below the sequence length. Tokens committed in the same step are also treated as conditionally independent, so jointly dependent words can clash, which is why practical systems use confidence schedules and semi-autoregressive block decoding. Whether dLLMs reach full quality parity with autoregressive models at frontier scale remains open as of 2026.
</div>

<div class="md">
## Trade-offs

### Other Architectures

* **Hyena** (\cite[Poli et al., 2023]{poli2023hyena}): replaces attention with **implicit long convolutions** parameterised by an MLP, with element-wise gating. Achieves Transformer-quality language modelling at sub-quadratic cost.
* **Mega** (\cite[Ma et al., 2022]{ma2022mega}): combines moving-average gated linear units with attention. Position-aware.
* **Striped Hyena-7B** (Together, 2024): Hyena + attention hybrid, 128K context.
* **Mixture-of-Depths** (\cite[Raposo et al., 2024]{raposo2024mod}): routes tokens through different numbers of layers, averaging $0.5\times$ the compute of a standard Transformer.
* **Universal Transformers**: recurrent application of the same Transformer block with a halting mechanism.

The field is in active flux; no single “Transformer replacement” has emerged, but hybrids are clearly the immediate future.
</div>

<div class="md">
### Compute / Memory Comparison

For sequence length $n$, model dim $d$, batch size $b$:

| Architecture | Training FLOPs | Inference memory | Long-context scaling |
|--------------|---------------|------------------|----------------------|
| **Transformer** | $O(bnd^2 + bn^2d)$ | $O(bnd)$ per generated token (KV-cache) | Quadratic prefill, linear decode |
| **Sliding-window attention** | $O(bnd^2 + bnwd)$ | $O(bnd)$ | Linear in $n$ (fixed window) |
| **Linear attention** | $O(bnd^2)$ | $O(bd^2)$ | Linear in $n$ |
| **State-space model (S4/Mamba)** | $O(bnd^2)$ | $O(bd^2)$ | Linear in $n$ |
| **RetNet recurrent mode** | $O(bnd^2)$ | $O(bd^2)$ | Linear in $n$ |
| **RWKV** | $O(bnd^2)$ | $O(bd^2)$ | Linear in $n$ (with decay) |

The constant factors matter: an SSM with state $N = 16$ is roughly comparable in cost to an attention head with head-dim 16, but its long-context behaviour is qualitatively different.
</div>

<div class="md">
### Where Transformers Still Win

Despite the architectural menu, vanilla Transformers remain dominant in 2025 because:

* **Hardware maturity**: GPUs have highly optimized kernels for dense matmul + softmax. SSM and linear-attention kernels are catching up (Mamba-2, FlashAttention-3) but still trail.
* **In-context learning**: Transformers' ability to learn from a few in-context examples seems related to their attention pattern. Some SSMs are weaker here.
* **Ecosystem**: every training framework (PyTorch, JAX, Megatron) is tuned for Transformers.

The picture is changing fast: in 2025, Jamba, RecurrentGemma, RWKV-7, Striped Hyena, and several Mamba variants are deployed in production.
</div>

<div class="md">
### Open Questions

* Can pure-SSM models match Transformers at long-horizon reasoning, or are hybrids strictly necessary?
* Will the in-context-learning gap close?
* How do these architectures behave on **multimodal** data (images, audio)?
* What new inductive biases emerge at the million-token scale?

The next decade of architecture research is open. For a working practitioner today, **hybrid models (Jamba, Mamba-2-Transformer hybrids) are the safest choice** for long-context production deployments.
</div>

<script>

async function loadAlternativeArchitecturesModule() {
	updateLoadingStatus("Loading section about Alternative Architectures...");
	return Promise.resolve();
}
</script>

<div class="mn-quiz" data-quiz="alternative_architectures"><script type="application/json">{"title": "Beyond transformers", "questions": [{"q": "How does the cost of standard self-attention grow with sequence length n?", "options": ["Quadratically, O(n²)", "Linearly, O(n)", "Logarithmically", "It is constant"], "answer": 0, "explain": "Every token is compared with every other token."}, {"q": "What characterises state-space models like Mamba?", "options": ["They process sequences in linear time with a recurrent state, using input-dependent (selective) dynamics", "They use quadratic attention", "They need no training", "They only work on images"], "answer": 0, "explain": "Selectivity lets the model decide what to keep in its fixed-size state."}, {"q": "What is RWKV?", "options": ["An architecture that trains like a transformer but runs like an RNN", "A tokenizer", "A GPU brand", "A benchmark"], "answer": 0, "explain": "It combines parallel training with constant-memory recurrent inference."}, {"q": "Where do transformers still tend to win?", "options": ["Tasks needing precise retrieval or copying from anywhere in a long context", "Nowhere", "Only on tiny models", "Image compression"], "answer": 0, "explain": "A fixed-size state must compress the past; full attention can look anything up exactly."}, {"q": "How does a diffusion language model generate text?", "options": ["It refines a whole corrupted (masked) sequence in parallel over several denoising steps", "It predicts one token at a time from left to right", "It retrieves whole sentences from a database", "It only edits images"], "answer": 0, "explain": "Parallel denoising trades the strict left-to-right order for throughput and bidirectional context."}]}</script></div>
