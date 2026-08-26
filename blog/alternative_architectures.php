<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Beyond Transformers (Mamba, RWKV, RetNet)
description: State-space models (Mamba, S4), linear attention, RWKV, and the post-transformer landscape.
icon: &#9883;
part: 4
order: 31
color: sky
topics: architecture, math-i, math-ii, programming
-->

<div class="md">
The Transformer is not the end of the road. Its $O(n^2)$ attention cost creates a quadratic wall: doubling the context length quadruples compute and memory. For long-context applications (genomes, codebases, hour-long video), this is prohibitive. Since 2020, a small but rapidly growing field has produced **sub-quadratic alternatives** that match Transformers on language modelling while scaling to million-token contexts.

This chapter surveys the main candidates, with the mathematical core of each.
</div>

<div class="md">
## The Quadratic Wall

**KV-cache mitigation:** Even standard Transformers handle long contexts via **KV-caching** (see the Production Serving chapter), which stores past K/V matrices so per-token compute stays linear in sequence length during autoregressive generation. The O(n²) cost appears in **training** and in **prefill** of long prompts; generation with a KV cache is O(n) per token. The practical gap between Transformers and sub-quadratic alternatives is therefore smaller than the asymptotic notation suggests.

Standard self-attention (see the Attention chapter) computes:

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

<div class="md">
## State-Space Models: S4 and Mamba

A **state-space model** (SSM) describes a continuous linear dynamical system:

$$
\dot{h}(t) = A h(t) + B x(t), \qquad y(t) = C h(t)
$$

where $x(t)$ is the input signal, $h(t) \in \mathbb{R}^{N}$ is the latent state, and $y(t)$ is the output. Discretized with step $\Delta$:

$$
h_t = \bar A h_{t-1} + \bar B x_t, \qquad y_t = C h_t
$$

where $\bar A = \exp(\Delta A)$, $\bar B = (\Delta A)^{-1}(\exp(\Delta A) - \mathbf{I}) \Delta B$.

This is a **linear recurrent network** with a fixed-size state $h_t \in \mathbb{R}^{N}$. Compute is $O(N)$ per step, memory is $O(N)$ regardless of sequence length.

### S4

\cite[Gu et al., 2021]{gu2021s4} made training stable by parameterizing $A$ in a **HiPPO structure** (high-order polynomial projection operator), which captures long-range dependencies efficiently. S4 set state-of-the-art on the Long Range Arena benchmark, beating Transformers by a large margin on sequences of length $16{,}000$.

### Mamba \cite[Gu & Dao, 2023]{gu2023mamba}

Mamba's key contribution is making the SSM **input-dependent**:

$$
B_t, C_t, \Delta_t = \text{Linear}(x_t)
$$

i.e. the state-transition matrices depend on the current input. This breaks linearity at inference (the recurrence must be computed step by step), but allows the model to selectively remember or forget based on context. Mamba matches Transformer quality at language modelling, scales linearly in $n$, and at inference runs roughly as fast as a Transformer with KV-cache enabled (the standard optimized setting; see Production Serving chapter).
</div>

<div class="md">
### Mamba-2 and SSD \cite[Dao & Gu, 2024]{dao2024mamba2}

Mamba-2 reveals that selective SSMs and attention are **algebraically dual** through a tensor contraction framework called **Structured State-Space Duality (SSD)**. In practice this lets Mamba-2 use an efficient attention-like kernel for compute, retaining the linear-time recurrence for inference.

### Jamba (AI21, 2024): Hybrid SSM + Attention

Jamba interleaves Mamba and Transformer blocks in a 1:7 ratio:

$$
\text{block}_i = \begin{cases} \text{Mamba} & i \mod 8 \neq 0 \\ \text{Attention} & i \mod 8 = 0 \end{cases}
$$

This hybrid scales to 256K context (Jamba-1.5-Large), uses ~25% of the memory of an equivalent Transformer, and matches its quality. Other hybrids: Zamba (Zyphra), RecurrentGemma (Google), Striped Hyena (Together AI).
</div>

<div class="md">
## Linear Attention

The softmax in attention is what makes the operation non-associative, forcing the $O(n^2)$ cost. Replace softmax with a feature map $\phi$:

$$
\text{LinearAttn}(Q, K, V)_i = \frac{\phi(Q_i)^\top \sum_{j=1}^{n} \phi(K_j) V_j^\top}{\phi(Q_i)^\top \sum_{j=1}^{n} \phi(K_j)}
$$

By computing $\sum_j \phi(K_j) V_j^\top$ once as an $d \times d$ outer product (the “state”), compute drops to $O(n \cdot d^2)$ and memory is $O(d^2)$, independent of $n$.

### Performer \cite[Choromanski et al., 2021]{choromanski2021performer}

$\phi(x) = \exp(-\|x\|^2/2) \cdot (x, x^2 \text{ random features})$. Provably unbiased kernel approximation.

### RetNet (Sun et al., Microsoft, 2023)

RetNet uses $\phi = \text{ELU} + 1$ (a simple element-wise nonlinearity) and supports three computation modes:

* **Parallel**: same $O(n^2 \cdot d)$ as Transformer during training.
* **Recurrent**: $O(d^2)$ state, like an SSM at inference.
* **Chunkwise**: hybrid, sliding window.

RetNet claims 8× lower latency and 7× lower memory than vanilla Transformer at inference.

### RWKV

\cite[Peng et al., 2023]{peng2023rwkv} introduced a linear-attention-with-decay RNN. RWKV-7 (2025) matches 7B Transformers on language tasks.
</div>

<div class="md">
## Other Architectures

* **Hyena** \cite[Poli et al., 2023]{poli2023hyena}: replaces attention with **implicit long convolutions** parameterised by an MLP, with element-wise gating. Achieves Transformer-quality language modelling at sub-quadratic cost.
* **Mega** \cite[Ma et al., 2022]{ma2022mega}: combines moving-average gated linear units with attention. Position-aware.
* **Striped Hyena-7B** (Together, 2024): Hyena + attention hybrid, 128K context.
* **Mixture-of-Depths** \cite[Raposo et al., 2024]{raposo2024mod}: routes tokens through different numbers of layers, averaging $0.5\times$ the compute of a standard Transformer.
* **Universal Transformers**: recurrent application of the same Transformer block with a halting mechanism.

The field is in active flux; no single “Transformer replacement” has emerged, but hybrids are clearly the immediate future.
</div>

<div class="md">
## Compute / Memory Comparison

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
## Where Transformers Still Win

Despite the architectural menu, vanilla Transformers remain dominant in 2025 because:

* **Hardware maturity**: GPUs have highly optimized kernels for dense matmul + softmax. SSM and linear-attention kernels are catching up (Mamba-2, FlashAttention-3) but still trail.
* **In-context learning**: Transformers' ability to learn from a few in-context examples seems related to their attention pattern. Some SSMs are weaker here.
* **Ecosystem**: every training framework (PyTorch, JAX, Megatron) is tuned for Transformers.

The picture is changing fast: in 2025, Jamba, RecurrentGemma, RWKV-7, Striped Hyena, and several Mamba variants are deployed in production.
</div>

<div class="md">
## Open Questions

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
