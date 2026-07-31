<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Production Serving & Inference
description: vLLM, continuous batching, paged attention, and how to serve an LLM to millions of users.
icon: &#9889;
part: 5
order: 41
color: rose
-->

<div class="md">
Training is once; inference is forever. A frontier LLM might be trained for $100M and then **served billions of times** at a per-call cost that determines profitability. This chapter covers the systems stack that makes LLM inference fast, cheap, and reliable.

The frontier in 2025: serving 100+ million tokens per second per GPU cluster with sub-100ms latency for chat workloads.
</div>

<div class="md">
## The Inference Challenge

Generating one token from a 70B model in bf16 on an H100 takes ~30 ms of compute. But users experience **time to first token (TTFT)** of < 500 ms and **time per output token (TPOT)** of < 50 ms for natural conversation.

Three bottlenecks:

1. **Memory bandwidth**: each generated token requires reading the full model weights from HBM. For a 70B model in bf16 (140 GB), on an H100 with 3 TB/s HBM, that's ~46 ms per token — and that is just for one user.
2. **Compute throughput**: matmuls saturate FLOPs only at large batch sizes.
3. **Latency**: chat workloads are bursty; prefill and decode have different characteristics.

Solutions attack each in turn.
</div>

<div class="md">
## KV-Cache: The Hidden Memory Tax

Recall from the Attention chapter: during autoregressive generation, each new token must attend to all previous tokens. Without caching, every step recomputes the K and V matrices for the full history — $O(n^2)$ work per token.

The **KV-cache** stores the K and V projections of past tokens in GPU memory. Memory per token:

$$
\text{KV memory per token} = 2 \cdot L \cdot h \cdot d_h \cdot \text{bytes}
$$

For a 70B model ($L = 80$ layers, $h = 64$ heads, $d_h = 128$) with fp16 KV (2 bytes): $2 \cdot 80 \cdot 64 \cdot 128 \cdot 2 = 2.6$ MB per token. For 4K context: 10.5 GB; for 128K context: 336 GB — **exceeding the model weights themselves**.

This is the dominant memory cost in inference. Several techniques address it:

* **Multi-Query Attention (MQA) / Grouped-Query Attention (GQA)** \cite[Ainslie et al., 2023]{ainslie2023gqa}: share K/V across multiple query heads. Llama 2 70B uses GQA with 8 KV heads for 64 query heads → 8× less KV memory.
* **Paged Attention** \cite[Kwon et al., 2023]{kwon2023vllm} (vLLM): allocate KV cache in non-contiguous pages, like OS virtual memory. Eliminates fragmentation, enables sharing across requests.
* **KV-cache compression**: quantize KV to int4 or int8 (≈4× memory reduction, minor quality loss).
* **Sliding-window attention**: only cache the last $w$ tokens' KV. Used in Mistral and Gemma 2.
* **Prefix caching**: reuse KV across requests with the same prompt prefix. Standard for system prompts.
</div>

<div id="kv-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## Batching: The Key to GPU Efficiency

A single forward pass for one user underutilizes the GPU. **Batching** amortizes memory reads across many requests:

### Static Batching

Generate one token for $B$ requests at the same time. All requests run synchronously; some finish early but wait for others. **Straggler problem**: one long request blocks the rest.

### Dynamic Batching

Continuously add new requests to the batch as they arrive. Better throughput, but still has stragglers.

### Continuous Batching (Iteration-level Scheduling)

**vLLM** \cite[Kwon et al., 2023]{kwon2023vllm} and **TGI** (HuggingFace) introduced this: after each token is generated, immediately swap finished sequences out of the batch and swap new ones in. GPU stays at peak utilization; no waiting.

Continuous batching alone can give 10–20× throughput improvement over static batching for chat workloads.
</div>

<div id="batching-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## Paged Attention \cite[Kwon et al., 2023]{kwon2023vllm}

Naïve KV-cache allocation reserves a contiguous block per request: if a request needs 4K tokens but only 2K are used, the rest is wasted. With many requests, fragmentation can waste **30–60%** of KV memory.

**Paged Attention** (vLLM) treats the KV cache like OS virtual memory \cite[Kwon et al., 2023]{kwon2023vllm}:

* Allocate fixed-size **physical blocks** (typically 16 tokens each).
* Each request has a **block table** mapping logical → physical blocks.
* Blocks can be **shared** across requests with the same prefix (e.g., the system prompt).
* No fragmentation; near-100% memory utilization.

Paged Attention \cite[Kwon et al., 2023]{kwon2023vllm} is now the standard in vLLM, TGI, TensorRT-LLM, and most production systems.
</div>

<div class="md">
## Speculative Decoding (Leviathan, Chen, et al., 2023)

LLM decoding is **memory-bound**, not compute-bound. Each token requires reading all model weights once. A 70B model can generate at most ~30 tokens/s on a single H100, regardless of FLOPs.

**Speculative decoding** breaks this:

1. A small, fast **draft model** (e.g., 1B) generates $k$ candidate tokens autoregressively (fast, ~10× the throughput).
2. The large **target model** verifies all $k$ tokens in a **single forward pass** (parallel).
3. Accept the longest prefix the target model agrees with; resample from the corrected distribution on rejection.

If the draft and target agree on $k$ tokens, you get $k$ tokens for the cost of 1 forward pass. Typical speedup: **2–3×** with high acceptance rate (90%+ for chat).

**Self-speculative decoding**: use early-exit or layer-skipping to draft with a partial version of the same model. No separate draft model needed.
</div>

<div class="md">
## Quantization

Reduce precision of weights and/or activations:

| Format | Bits | 70B size | Quality loss |
|--------|------|----------|--------------|
| fp32 | 32 | 280 GB | Baseline |
| fp16 / bf16 | 16 | 140 GB | Negligible |
| int8 (weights only) | 8 | 70 GB | ~0.5% on benchmarks |
| int4 (GPTQ, AWQ) | 4 | 35 GB | 1–3% |
| int3 / int2 (QuIP, QuIP#) | 2–3 | 17–23 GB | 3–10% |
| 1-bit (BitNet, 2024) | 1.58 | 13 GB | Comparable to fp16 at scale |

Modern quantization is **nearly free** at int8 and acceptable at int4 for most workloads. AWQ (Activation-aware Weight Quantization \cite[Lin et al., 2023]{lin2023awq}) and GPTQ are the standard tools. The trade-off is non-uniform: outliers in some channels cause big errors; per-channel scaling mitigates.

For activations, **fp8** (H100 native) gives 2× throughput with minimal quality loss. **INT4 KV-cache** is a separate axis, giving up to 4× KV memory reduction.
</div>

<div class="md">
## Distillation Revisited

A small student model trained to mimic a large teacher:

* **Logit distillation** \cite[Hinton et al., 2015]{hinton2015distilling}: match the teacher's full output distribution: $\mathcal{L} = \text{KL}\!\big(p_T \,\|\, p_S\big)$.
* **Hidden-state distillation**: match intermediate activations layer-by-layer.
* **Attention distillation**: match attention matrices.
* **Generative distillation**: train on the teacher's text outputs (supervised fine-tuning).

Modern distilled families:

* **DeepSeek-V3 → DeepSeek-R1-Distill** (2025): 1.5B–70B student models trained on R1 outputs.
* **Llama 3.1-8B-Instruct** → trained partly on Llama 3.1-405B outputs.
* **Phi-3-mini** (3.8B) → trained on Phi-3-medium's outputs.

Distilled models can match the teacher on specific benchmarks within 5–10% of its quality, at $10\times$ lower inference cost.
</div>

<div class="md">
## Serving Stacks

### vLLM (UC Berkeley)

The most widely used open-source serving system. Paged Attention \cite[Kwon et al., 2023]{kwon2023vllm}, continuous batching, tensor parallelism, speculative decoding, prefix caching. Powers ChatGPT-style deployments at major labs.

### TGI (HuggingFace Text Generation Inference)

Rust-based serving stack. Optimized for transformer inference with built-in quantization, batching, and streaming. Production-grade at HuggingFace, AWS, and many enterprises.

### TensorRT-LLM (NVIDIA)

NVIDIA's optimized inference engine. Tightly integrated with TensorRT for kernel fusion, in-flight batching, and fp8/int4 quantization. Highest raw throughput on NVIDIA hardware.

### SGLang (Stanford LMSYS)

Optimized for **structured generation** — JSON output, grammar-constrained decoding, multi-turn tool use. Powers Vicuna and many agent systems.

### llama.cpp (Georgi Gerganov)

The reference CPU and consumer-GPU inference engine. **GGUF** format, dozens of quantization levels, runs Llama 70B on a MacBook. The cornerstone of local LLM inference.

### Inference Endpoints (Cloud)

* **OpenAI API**: GPT-4o, o1, o3. Managed, OpenAI's own stack.
* **Anthropic API**: Claude 3.5/3.7/4. Managed.
* **Google Vertex AI**: Gemini models.
* **Together.ai, Fireworks, Groq, Anyscale**: third-party inference providers running open-source models on optimized hardware.
* **AWS Bedrock**, **Azure AI Foundry**: enterprise multi-model.
</div>

<div class="md">
## Hardware: What to Use When

| Workload | Hardware | Why |
|----------|----------|-----|
| Frontier (GPT-4-class, 1T+ params) | H100 / B200 clusters | Memory bandwidth + interconnect |
| Open-source (Llama 70B) | A100 / H100 | Standard tooling |
| Edge (Llama 8B) | RTX 4090, L40S, Apple Silicon | Quantization-friendly |
| Mobile (sub-3B) | Snapdragon, Apple Neural Engine | Low power |
| Latency-critical | Groq LPU, Cerebras | Custom silicon; sub-second TTFT |
| Cost-optimized | AMD MI300X | 192 GB HBM3 per card |

The custom-silicon competition (Groq's LPU, Cerebras WSE, SambaNova, AWS Trainium, Google TPU) is making inference **dramatically cheaper** in 2024–2025.
</div>

<div class="md">
## Observability: The Hidden Half

A production LLM system needs:

* **Latency monitoring**: TTFT, TPOT, end-to-end, p50/p95/p99.
* **Throughput**: tokens/sec/GPU, requests/sec/GPU.
* **Quality**: periodic sampling + LLM-as-judge on real traffic.
* **Safety**: jailbreak detection, PII redaction, hallucination flags.
* **Cost tracking**: per-request token cost, dollar-cost-per-conversation.
* **A/B testing**: shadow traffic to new models, statistical comparison.

Tools: Langfuse, Helicone, LangSmith, Helicone, Arize Phoenix, Honeycomb.

A common production mistake: shipping an LLM endpoint without **cost attribution**. At scale, a single user can rack up thousands of dollars per session if the system prompt is bloated or the conversation loops.
</div>

<div class="md">
## When NOT to Use an LLM

A good production engineer knows when to skip the LLM entirely:

* **Deterministic logic** (date parsing, math, lookups): use code, regex, traditional ML.
* **Sub-millisecond latency**: precompute, cache, use heuristics.
* **Strict reproducibility**: LLMs are stochastic; can't guarantee byte-identical output.
* **Auditability**: every LLM call needs human review for high-stakes decisions (medical, legal).
* **Cost ceiling**: a chat that costs $0.50 is fine; one that costs $5 is not.

Rule of thumb: prototype with the best model; measure cost; downgrade if necessary; cache aggressively; consider a hybrid pipeline (cheap heuristic + occasional LLM fallback).
</div>

<script>
// KV cache memory growth
(function() {
	const c = document.getElementById('kv-viz');
	if (!c) return;

	const seqLens = [1024, 4096, 16384, 65536, 131072];
	const kvStandard = seqLens.map(s => s * 2.6 / 1024);     // GB, MHA
	const kvGqa = seqLens.map(s => s * 0.33 / 1024);          // GQA 8 KV heads

	Plotly.newPlot('kv-viz', [
		{ x: seqLens.map(s => s / 1024 + 'K'), y: kvStandard, type: 'bar', name: 'Multi-Head Attention', marker: { color: '#ef4444' } },
		{ x: seqLens.map(s => s / 1024 + 'K'), y: kvGqa, type: 'bar', name: 'Grouped-Query Attention (8 KV heads)', marker: { color: '#22c55e' } }
	], {
		title: { text: 'KV-cache memory for 70B model (80 layers, 64 heads)', font: { size: 13 } },
		barmode: 'group',
		xaxis: { title: 'sequence length' },
		yaxis: { title: 'KV cache (GB)' },
		margin: { t: 50, b: 50, l: 60, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		legend: { x: 0.02, y: 0.98 }
	}, { responsive: true });
})();

// Batching strategies comparison
(function() {
	const c = document.getElementById('batching-viz');
	if (!c) return;

	const time = Array.from({length: 10}, (_, i) => i + 1);
	// Static batching: GPU sits idle as shorter requests finish
	const staticBatch = [0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3.0];
	const continuousBatch = [0.3, 0.5, 0.6, 0.7, 0.7, 0.65, 0.6, 0.55, 0.5, 0.5];

	Plotly.newPlot('batching-viz', [
		{ x: time, y: staticBatch, mode: 'lines+markers', name: 'Static batching (idle stragglers)', line: { color: '#ef4444', width: 2.5 } },
		{ x: time, y: continuousBatch, mode: 'lines+markers', name: 'Continuous batching', line: { color: '#22c55e', width: 2.5 } }
	], {
		title: { text: 'GPU utilization over time (illustrative)', font: { size: 13 } },
		xaxis: { title: 'time step' },
		yaxis: { title: 'GPU utilization (normalized)', range: [0, 3.5] },
		margin: { t: 50, b: 50, l: 60, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		legend: { x: 0.02, y: 0.98 }
	}, { responsive: true });
})();

async function loadProductionServingModule() {
	updateLoadingStatus("Loading section about Production Serving...");
	return Promise.resolve();
}
</script>
