<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Inference Optimization
description: Quantization, KV-cache, paged attention, FlashAttention, speculative decoding — every knob.
icon: &#9889;
part: 5
order: 35
color: rose
topics: inference, hardware, programming, math-i, math-ii
-->

<div class="md">
Training a frontier model costs US Dollar 100M+; serving it can cost **US Dollar 1M+ per day at scale**. Inference optimization makes LLMs economically viable. The frontier in 2025: serving 100+ million tokens per second per cluster with sub-100ms latency.

This chapter covers every lever: quantization, KV-cache management, paged attention, FlashAttention, speculative decoding, batching, distillation, and the serving stacks that tie it together.
</div>

<div class="md">
## The Inference Math

For a single token generation step on a 70B model (fp16):

| Component | Memory / Compute |
|-----------|------------------|
| Read all weights from HBM | 140 GB ÷ HBM bandwidth (3 TB/s on H100) = ~46 ms |
| Compute matmul (forward pass) | ~10 ms with batch=1, ~50 TFLOPS |
| Generate one token | dominated by memory bandwidth |

LLM inference is **memory-bandwidth bound**, not compute-bound. This is why:

* **Batching helps** (amortize weight read across many requests).
* **Quantization helps** (less data to move).
* **Caching helps** (avoid recomputing).
* **Smaller models help** (less memory pressure).
</div>

<div class="md">
## Quantization

### Weight Quantization

Reduce the bit precision of model weights:

| Format | Bits/weight | 70B size | Perplexity increase |
|--------|-------------|----------|---------------------|
| FP32 | 32 | 280 GB | Baseline |
| FP16 / BF16 | 16 | 140 GB | ~0% |
| INT8 | 8 | 70 GB | &lt;0.5% |
| INT4 (GPTQ, AWQ) | 4 | 35 GB | 1–3% |
| INT3 (QuIP, QuIP#) | 3 | 26 GB | 3–7% |
| INT2 (QuIP#) | 2 | 17 GB | 5–15% |
| 1.58-bit (BitNet b1.58) | 1.58 | 13 GB | Comparable to FP16 at scale |

Standard tools:

* **GPTQ** \cite[Frantar et al., 2022]{frantar2022gptq}: post-training quantization using second-order information. The de facto standard.
* **AWQ** \cite[Lin et al., 2023]{lin2023awq}: activation-aware weight quantization. Identifies salient weight channels and preserves them at higher precision.
* **SmoothQuant** \cite[Xiao et al., 2022]{xiao2022smoothquant}: migrates quantization difficulty from activations to weights.
* **BitsAndBytes** \cite[Dettmers et al., 2022]{dettmers2022llmint8}: k-bit quantization for PyTorch (popular for QLoRA).
* **GGUF** (llama.cpp): many quantization schemes in a single file (Q2_K, Q3_K, Q4_K_M, Q5_K_M, Q6_K, Q8_0).
* **BitNet** \cite[Ma et al., 2024]{ma2024bitnet}: 1.58-bit ternary quantization. Surprisingly competitive at scale.
* **QuIP#** \cite[Chee et al., 2024]{che2024quip}: lattice-based 2-bit quantization with incoherence processing.

### KV-Cache Quantization

The KV-cache is the dominant memory cost for long contexts. Quantizing it:

* **INT8 KV**: ~2× memory reduction, negligible quality loss.
* **INT4 KV**: ~4× memory reduction, 1–2% quality loss.
* **FP8 KV** (H100 native): same as INT8 in effect.

Used by vLLM, TGI, and most production stacks. Critical for serving 100K+ contexts.
</div>

<div id="quant-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## KV-Cache Optimizations

Beyond quantization:

* **Multi-Query Attention (MQA)** (Shazeer, 2019): all query heads share a single K and V head. 64× KV memory reduction.
* **Grouped-Query Attention (GQA)** \cite[Ainslie et al., 2023]{ainslie2023gqa}: middle ground — 8 KV heads for 64 query heads gives 8× reduction with quality close to MHA. Used by Llama 2/3, Mistral, Qwen.
* **Sliding Window Attention** \cite[Beltagy et al., 2020]{beltagy2020longformer}: only attend to the last $w$ tokens. KV memory is $O(w)$ instead of $O(n)$. Combine with a few "global" attention layers to preserve long-range context.
* **Paged Attention** (vLLM, 2023): non-contiguous KV allocation like OS virtual memory. Eliminates fragmentation.
* **Prefix caching**: KV cache for a system prompt is computed once and reused across requests. Standard for chatbot APIs.
* **Cross-request KV sharing**: identical prompts across users share KV blocks. Used in vLLM and SGLang.

A 70B model with GQA + INT8 KV + prefix caching can serve 128K context to roughly 20–30 concurrent users on a single 8xH100 node (the 335 GB of fp16 KV per user drops to ~21 GB with GQA and INT8, and an 8xH100 node holds 640 GB).
</div>

<div class="md">
## FlashAttention \cite[Dao et al., 2022]{dao2022flashattention}

The single biggest speedup for training **and** inference in 2022–2023. Reduces attention memory from $O(n^2)$ to $O(n)$ by **never materializing the full attention matrix**:

$$
\text{Standard: } \quad S = QK^\top \in \mathbb{R}^{n \times n} \quad \text{(then softmax, then } \cdot V)
$$

FlashAttention computes the same result in tiles, with the softmax applied incrementally:

$$
\text{Flash: } \quad m_i = \max(\text{partial logits}), \quad \ell_i = \sum \exp(\text{partial logits} - m_i)
$$

This is mathematically equivalent but requires only $O(n)$ memory and exploits **SRAM** (the GPU's fast on-chip cache) to avoid round-trips to HBM.

FlashAttention-2 (2023): further 2× speedup via better work partitioning.
FlashAttention-3 (2024): asynchronous warp specialization on H100, FP8 support, ~2× over FA-2.

FlashAttention is now standard in **all** major training and inference stacks (PyTorch SDPA, vLLM, TGI, TensorRT-LLM, llama.cpp).
</div>

<div class="md">
## Paged Attention \cite[Kwon et al., 2023]{kwon2023vllm}

The OS-virtual-memory approach to KV management:

* Allocate KV cache in fixed-size **blocks** (typically 16 tokens).
* Each request has a **block table** mapping logical → physical blocks.
* Blocks can be **shared** across requests with the same prefix.
* No fragmentation; near-100% memory utilization.

Effect: **2–4× throughput improvement** over contiguous allocation for chat workloads with varied sequence lengths.

The vLLM paper showed 14–24× throughput vs. naïve HuggingFace serving at high concurrency.
</div>

<div class="md">
## Speculative Decoding (\cite[Leviathan et al., 2023]{leviathan2023speculative})

LLM decoding is sequential: each token requires a full forward pass. **Speculative decoding** breaks this:

1. A small **draft model** generates $k$ candidate tokens autoregressively.
2. The large **target model** verifies all $k$ in a **single parallel forward pass**.
3. Accept the longest prefix where target agrees with draft.
4. Resample from the target's corrected distribution on the first mismatch.

If $k = 5$ speculative tokens are drafted and per-token acceptance rate is $\alpha = 80\%$, the expected number of tokens accepted per verification step is $\frac{1 - \alpha^{k+1}}{1 - \alpha} = \frac{1 - 0.8^6}{0.2} \approx 3.69$. Net speedup: **2–3×**.

Variants:

* **Self-speculative decoding**: use early-exit from the same model. No draft model needed.
* **Medusa** \cite[Cai et al., 2024]{cai2024medusa}: parallel draft heads attached to the main model.
* **EAGLE** \cite[Li et al., 2024]{li2024eagle}: draft at the feature level, not the token level. Higher acceptance.
* **Lookahead decoding**: parallel candidate generation with Jacobi iteration.
</div>

<div class="md">
## Batching Strategies

### Static Batching

Generate one token for $B$ requests simultaneously. All requests advance in lockstep. Simple but **straggler-bound**: longest request dictates the batch's pace.

### Dynamic Batching

Add new requests whenever an old one finishes. Better throughput than static; still has stragglers.

### Continuous Batching (Iteration-Level Scheduling)

After **every** generated token, swap finished sequences out and swap new ones in. The GPU is never idle waiting for stragglers.

vLLM, TGI, TensorRT-LLM, and SGLang all implement continuous batching. **Throughput improvement: 10–20×** over static batching for chat workloads.

### In-flight Batching (NVIDIA TensorRT-LLM)

Same idea as continuous batching but with tighter integration into TensorRT's kernel scheduling.

### Chunked Prefill

A request with a 100K-token prompt would otherwise block the GPU for many seconds. Chunked prefill splits the prompt into smaller chunks and interleaves them with decode steps of other requests. Critical for long-context serving.
</div>

<div class="md">
## Distillation Recap

A small "student" model trained to mimic a larger "teacher":

* **Logit distillation**: match full output distribution: $\mathcal{L} = \text{KL}(p_T \| p_S)$
* **Hidden-state distillation**: match intermediate activations.
* **Attention distillation**: match attention matrices.
* **Generative distillation**: train on teacher text outputs.
* **Distillation with reasoning**: student trained on teacher's CoT traces (R1-distill style).

DeepSeek-R1-Distill-Qwen-1.5B (2025) reached 70% on MATH despite being 1.5B parameters, by training on R1's full reasoning traces.
</div>

<div class="md">
## Hardware-Specific Tricks

### Tensor Parallelism

Split weight matrices across GPUs. Each GPU computes a partial output, all-reduces. Megatron-style.

### Pipeline Parallelism

Split layers across GPUs. Required for very large models on low-GPU-count servers.

### Expert Parallelism (MoE)

For MoE models (Mixtral, DeepSeek-V3), different experts live on different GPUs. Tokens routed to expert $i$ are sent to GPU $i$.

### CUDA Graph Capture

For fixed-shape models, the entire inference forward pass can be captured as a **CUDA graph**: a pre-compiled sequence of GPU operations with minimal launch overhead. Reduces per-token latency by ~20%.

### Mixed Precision (FP8, INT4)

H100's **Transformer Engine** does FP8 matmuls natively. INT4 path for Hopper is via TensorRT-LLM. Speedups: 1.5–2× over BF16.

### Speculative Prefill

When the prompt is long and the system has many concurrent decoders, prefill can preempt decode. Some systems schedule prefill on a separate "prefill pool" of GPUs.
</div>

<div class="md">
## Caching Strategies

* **Exact prompt caching**: identical prompts reuse computed KV. Standard for system prompts.
* **Semantic caching**: similar prompts (cosine > threshold) reuse responses. Saves API cost at the application layer.
* **Speculative cache lookup**: precompute common responses (FAQ, help articles).
* **CDN for LLM responses**: edge-cached LLM outputs for high-traffic questions.

A good caching strategy can reduce effective cost by **5–10×** for chat workloads with predictable queries.
</div>

<div class="md">
## Choosing a Serving Stack

| Stack | Best for | Notes |
|-------|----------|-------|
| **vLLM** | Most production workloads | Paged attention, continuous batching, broadest model support |
| **TGI** | HuggingFace ecosystem | Clean Rust implementation, integrated with Hub |
| **TensorRT-LLM** | Max throughput on NVIDIA | Tightest GPU optimization, requires more setup |
| **SGLang** | Structured generation, agents | Optimized for JSON/grammar output |
| **llama.cpp** | Local / consumer GPUs | GGUF format, single-user |
| **MLX** | Apple Silicon | Optimized for M-series |
| **OpenLLM** | Python-native deployments | Simpler than vLLM for small scale |
| **Ray Serve + vLLM** | Autoscaling multi-model | Cloud-native orchestration |

For most production deployments: **vLLM** is the default in 2025.
</div>

<div class="md">
## Practical Numbers (2025, approximate)

For a 70B model on 8x H100:

| Optimization | Throughput (tokens/s) | vs. baseline |
|--------------|----------------------|--------------|
| Naïve (HF generate) | 500 | 1× |
| + Continuous batching | 4,000 | 8× |
| + Paged attention | 6,000 | 12× |
| + INT8 quantization | 9,000 | 18× |
| + INT4 quantization | 12,000 | 24× |
| + Speculative decoding | 25,000 | 50× |
| + Multi-node | 100,000+ | 200× |

Combined, a single 8-GPU node can serve ~100 concurrent users generating at 30+ tokens/sec each. A 100-node cluster serves **10,000 concurrent users**.
</div>

<div class="md">
## The Frontier of Inference

Active research in 2025:

* **Sub-quadratic architectures** for inference (see the Beyond Transformers chapter) — Mamba-2, Jamba.
* **FP4/FP6 inference**: lower precision for further speedups.
* **Network compression**: distilling large reasoning models into small fast ones.
* **Distributed speculative decoding**: one draft model serving many target models.
* **Energy-aware scheduling**: route to the most power-efficient GPU.

For most practitioners in 2025, **vLLM + INT4 + continuous batching + prefix caching + speculative decoding** is the production stack. It produces ~50× throughput over naïve serving and is the difference between an economically viable LLM product and a bankrupt one.
</div>

<script>
// Quantization: size and quality trade-off
(function() {
	const c = document.getElementById('quant-viz');
	if (!c) return;

	const formats = ['FP32', 'FP16', 'INT8', 'INT4', 'INT3', 'INT2', '1.58-bit'];
	const sizes = [280, 140, 70, 35, 26, 17, 13];
	const qualityLoss = [0, 0, 0.5, 2.5, 5, 12, 0];

	Plotly.newPlot('quant-viz', [
		{ x: formats, y: sizes, type: 'bar', name: '70B model size (GB)', marker: { color: '#3b82f6' }, yaxis: 'y' },
		{ x: formats, y: qualityLoss, type: 'scatter', mode: 'lines+markers', name: 'Quality loss (%)', marker: { color: '#ef4444', size: 10 }, yaxis: 'y2' }
	], {
		title: { text: 'Weight quantization: size vs quality (70B model)', font: { size: 13 } },
		yaxis: { title: 'model size (GB)' },
		yaxis2: { title: 'quality loss (%)', overlaying: 'y', side: 'right' },
		margin: { t: 50, b: 70, l: 60, r: 60 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		legend: { x: 0.02, y: 0.98 }
	}, { responsive: true });
})();

async function loadInferenceOptimizationModule() {
	updateLoadingStatus("Loading section about Inference Optimization...");
	return Promise.resolve();
}
</script>
