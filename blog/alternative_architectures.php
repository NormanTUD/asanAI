<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Beyond Transformers
description: State-space models (Mamba, S4), linear attention, RWKV, and the post-transformer landscape.
icon: &#9883;
part: 4
order: 30
color: sky
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
\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d}}\right) V
$$

The $QK^\top$ matrix has shape $n \times n$, where $n$ is the sequence length. Both compute and memory scale as $O(n^2)$. For $n = 128{,}000$, that matrix alone is $128{,}000^2 \times 2$ bytes $\approx 30$ GB in fp16. The architectural alternatives attack this in three different ways:

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

### Mamba (\cite[Gu & Dao, 2023]{gu2023mamba}

Mamba's key contribution is making the SSM **input-dependent**:

$$
B_t, C_t, \Delta_t = \text{Linear}(x_t)
$$

i.e. the state-transition matrices depend on the current input. This breaks linearity at inference (the recurrence must be computed step by step), but allows the model to selectively remember or forget based on context. Mamba matches Transformer quality at language modelling, scales linearly in $n$, and at inference runs as fast as a Transformer with KV-cache disabled.
</div>

<div id="ssm-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
### Mamba-2 and SSD (\cite[Dao & Gu, 2024]{dao2024mamba2}

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

By computing $\sum_j \phi(K_j) V_j^\top$ once as an $d \times d$ outer product (the "state"), compute drops to $O(n \cdot d^2)$ and memory is $O(d^2)$ — independent of $n$.

### Performer \cite[Choromanski et al., 2021]{choromanski2021performer}

$\phi(x) = \exp(-\|x\|^2/2) \cdot (x, x^2 \text{ random features})$. Provably unbiased kernel approximation.

### RetNet (Sun et al., Microsoft, 2023)

RetNet uses $\phi = \text{ELU} + 1$ (a simple element-wise nonlinearity) and supports three computation modes:

* **Parallel**: same $O(n^2 \cdot d)$ as Transformer during training.
* **Recurrent**: $O(d^2)$ state, like an SSM at inference.
* **Chunkwise**: hybrid, sliding window.

RetNet claims 8× lower latency and 7× lower memory than vanilla Transformer at inference.

### RWKV (\cite[Peng et al., 2023]{peng2023rwkv}-7 (2025) matches 7B Transformers on language tasks.
</div>

<div id="linear-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## Other Architectures

* **Hyena** \cite[Poli et al., 2023]{poli2023hyena}: replaces attention with **implicit long convolutions** parameterised by an MLP, with element-wise gating. Achieves Transformer-quality language modelling at sub-quadratic cost.
* **Mega** (\cite[Ma et al., 2022]{ma2022mega} average with attention. Position-aware.
* **Striped Hyena-7B** (Together, 2024): Hyena + attention hybrid, 128K context.
* **\cite[Bubeck et al., 2023]{fedus2022moe}-of-Depths** (\cite[Raposo et al., 2024]{raposo2024mod}: routes tokens through different numbers of layers, averaging $0.5\times$ the compute of a standard Transformer.
* **Universal Transformers**: recurrent application of the same Transformer block with a halting mechanism.

The field is in active flux; no single "Transformer replacement" has emerged, but hybrids are clearly the immediate future.
</div>

<div class="md">
## Compute / Memory Comparison

For sequence length $n$, model dim $d$, batch size $b$:

| Architecture | Training FLOPs | Inference memory | Long-context scaling |
|--------------|---------------|------------------|----------------------|
| **Transformer** | $O(bnd^2 + bn^2d)$ | $O(bnd + bn^2)$ | Quadratic |
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
// SSM block diagram
(function() {
	const c = document.getElementById('ssm-viz');
	if (!c) return;

	const box = (x, y, w, h, color) => ({
		type: 'rect', x0: x, x1: x + w, y0: y, y1: y + h,
		fillcolor: color, line: { color: 'rgba(0,0,0,0.3)', width: 1.5 }
	});

	const shapes = [
		box(0, 1.5, 1.5, 1.5, '#22c55e'),
		box(2, 1.5, 1.5, 1.5, '#3b82f6'),
		box(4, 1.5, 1.5, 1.5, '#0ea5e9'),
		box(6, 1.5, 1.5, 1.5, '#8b5cf6'),
		box(8, 1.5, 1.5, 1.5, '#a78bfa'),
		box(2, 0, 1.5, 1, '#f59e0b'),
		box(4, 0, 1.5, 1, '#fb923c'),
		box(6, 0, 1.5, 1, '#f59e0b'),
		box(2, -1.5, 1.5, 1, '#64748b'),
		box(4, -1.5, 1.5, 1, '#64748b'),
		box(6, -1.5, 1.5, 1, '#64748b')
	];

	const arrows = [];
	// Forward flow
	for (const [x1, x2] of [[1.5, 2], [3.5, 4], [5.5, 6], [7.5, 8]]) {
		arrows.push({ ax: x1, ay: 2.25, x: x2, y: 2.25, showarrow: true, arrowhead: 2, arrowsize: 1, arrowwidth: 1.5, arrowcolor: '#475569' });
	}
	// Input-dependent projections
	for (const x of [2.75, 4.75, 6.75]) {
		arrows.push({ ax: 2.75, ay: 1.5, x: x, y: 1.0, showarrow: true, arrowhead: 2, arrowsize: 1, arrowwidth: 1.5, arrowcolor: '#f59e0b' });
		arrows.push({ ax: x, ay: 0, x: x, y: 1.5, showarrow: true, arrowhead: 2, arrowsize: 1, arrowwidth: 1.5, arrowcolor: '#f59e0b' });
	}
	// Recurrent state loop (h_{t-1} → h_t)
	arrows.push({ ax: 7.5, ay: 2.25, x: 2.75, y: 2.25, showarrow: true, arrowhead: 2, arrowsize: 1, arrowwidth: 1.5, arrowcolor: '#ef4444' });

	const annotations = [
		{ x: 0.75, y: 2.25, text: '<b>xₜ</b>', showarrow: false, font: { size: 13, color: '#fff' } },
		{ x: 2.75, y: 2.25, text: '<b>Linear(x)</b>', showarrow: false, font: { size: 10, color: '#fff' } },
		{ x: 4.75, y: 2.25, text: '<b>Δₜ, Bₜ, Cₜ</b>', showarrow: false, font: { size: 10, color: '#fff' } },
		{ x: 6.75, y: 2.25, text: '<b>Scan</b>', showarrow: false, font: { size: 10, color: '#fff' } },
		{ x: 8.75, y: 2.25, text: '<b>yₜ</b>', showarrow: false, font: { size: 13, color: '#fff' } },
		{ x: 2.75, y: 0.5, text: 'Δₜ', showarrow: false, font: { size: 10, color: '#fff' } },
		{ x: 4.75, y: 0.5, text: 'Bₜ', showarrow: false, font: { size: 10, color: '#fff' } },
		{ x: 6.75, y: 0.5, text: 'Cₜ', showarrow: false, font: { size: 10, color: '#fff' } },
		{ x: 2.75, y: -1, text: '<b>A</b>', showarrow: false, font: { size: 10, color: '#fff' } },
		{ x: 4.75, y: -1, text: '<b>exp</b>', showarrow: false, font: { size: 10, color: '#fff' } },
		{ x: 6.75, y: -1, text: '<b>Āₜ, B̄ₜ</b>', showarrow: false, font: { size: 9, color: '#fff' } }
	];

	Plotly.newPlot('ssm-viz', [], {
		shapes, annotations,
		xaxis: { range: [-0.5, 10], showgrid: false, zeroline: false, showticklabels: false },
		yaxis: { range: [-2.5, 3.5], showgrid: false, zeroline: false, showticklabels: false, scaleanchor: 'x' },
		margin: { t: 20, b: 20, l: 20, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)'
	}, { displayModeBar: false, responsive: true });
})();

// Linear attention recurrence
(function() {
	const c = document.getElementById('linear-viz');
	if (!c) return;

	const n = 20;
	const tArr = Array.from({length: n}, (_, i) => i);
	const transformerMem = tArr.map(t => (t + 1) * (t + 1));  // O(n^2)
	const linearMem = tArr.map(t => (t + 1) * 1);             // O(n·d^2) ~ O(n)
	const ssmMem = tArr.map(t => 1);                            // O(d^2)

	Plotly.newPlot('linear-viz', [
		{ x: tArr, y: transformerMem.map(v => v / 100), mode: 'lines+markers', name: 'Transformer O(n²)', line: { color: '#ef4444', width: 2.5 } },
		{ x: tArr, y: linearMem.map(v => v), mode: 'lines+markers', name: 'Linear attention O(n)', line: { color: '#3b82f6', width: 2.5 } },
		{ x: tArr, y: ssmMem, mode: 'lines+markers', name: 'SSM O(d²) = const', line: { color: '#22c55e', width: 2.5 } }
	], {
		title: { text: 'Memory vs sequence length (normalized)', font: { size: 13 } },
		xaxis: { title: 'sequence length n' },
		yaxis: { title: 'memory (arbitrary units)', type: 'log' },
		margin: { t: 50, b: 50, l: 60, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		legend: { x: 0.02, y: 0.98 }
	}, { responsive: true });
})();

async function loadAlternativeArchitecturesModule() {
	updateLoadingStatus("Loading section about Alternative Architectures...");
	return Promise.resolve();
}
</script>
