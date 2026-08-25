<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Training Infrastructure
description: Distributed training, FSDP, tensor/pipeline parallelism, and how to fit a 70B model in memory.
icon: &#128296;
part: 5
order: 40
color: rose
topics: training, hardware, data, programming
-->

<div class="md">
A 70B-parameter model in fp16 takes **140 GB just for the weights**. With Adam optimizer states, gradients, and activations, a single training step requires **>1 TB** of GPU memory. Modern training infrastructure is the art of splitting this across thousands of GPUs while keeping them busy and synchronized.

This chapter covers the core parallelism strategies: data, tensor, pipeline, sequence, and the FSDP/ZeRO families that underpin frontier training.
</div>

<div class="md">
## The Memory Budget

A single training step requires storing:

| Component | Size | Notes |
|-----------|------|-------|
| **Parameters (W)** | $2 \cdot N$ bytes | fp16: $N \cdot 2$; e.g. 70B = 140 GB |
| **Optimizer states (O)** | $8 \cdot N$ bytes | Adam: 2 moments × fp32 = 8 bytes/param |
| **Gradients (G)** | $2 \cdot N$ bytes | fp16 |
| **Activations (A)** | $O(L \cdot B \cdot S \cdot d)$ bytes | L layers, B batch, S seq, d hidden |

For a 70B model: $W + G + O = 140 + 140 + 560 = 840$ GB just for parameters + gradients + optimizer. An H100 has 80 GB. The model literally does not fit.

This is why **distributed training** is mandatory.
</div>

<div class="md">
## Parallelism Strategies

### Data Parallelism (DP)

Each GPU holds a **full copy** of the model. Each step:

1. Distribute a different **shard of the batch** to each GPU.
2. Each GPU computes gradients on its shard.
3. **All-reduce** the gradients across GPUs (average).
4. Each GPU updates its model copy.

Memory: $W + G + O$ per GPU. Compute: linear in number of GPUs. Communication: one all-reduce per step. Scales well up to ~100 GPUs; beyond that, the all-reduce becomes the bottleneck.

### ZeRO (Zero Redundancy Optimizer, Microsoft, 2019)

The key insight: in data parallelism, each GPU stores **redundant** optimizer states, gradients, and parameters. ZeRO partitions these across $P$ GPUs:

* **ZeRO-1**: partition optimizer states → memory $\frac{1}{P}$, communication increases ~50%.
* **ZeRO-2**: partition optimizer states + gradients → memory $\frac{1}{P}$, more comms.
* **ZeRO-3** (FSDP): partition optimizer + gradients + parameters → memory $\frac{1}{P}$, comms doubles but training fits much larger models.

FSDP (Fully Sharded Data Parallel) is PyTorch's native implementation of ZeRO-3. With 64 H100s, you can train a 70B model that wouldn't fit on a single GPU.
</div>

<div id="parallelism-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
### Tensor Parallelism (TP)

**Split individual weight matrices** across GPUs. For a $d \times d$ linear layer:

$$
\begin{bmatrix} W_1 \\ W_2 \end{bmatrix} x = \begin{bmatrix} W_1 x \\ W_2 x \end{bmatrix}, \quad W_1, W_2 \in \mathbb{R}^{d/2 \times d}
$$

Each GPU computes half the output; results are concatenated (or all-gathered). TP requires **fast interconnect** (NVLink, InfiniBand) because every layer requires a sync.

Megatron-LM (Shoeybi et al., NVIDIA, 2019) tensor-parallels the MLP and attention blocks of a Transformer. For attention:

$$
\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{Q K^\top}{\sqrt{d}}\right) V
$$

The query, key, value heads are split across GPUs; each GPU computes a partial attention output, then an all-reduce aggregates. Communication per layer: 2 all-reduces.

### Pipeline Parallelism (PP)

**Split the model depth-wise**: GPU 0 holds layers 0–7, GPU 1 holds layers 8–15, etc. Each mini-batch propagates through the pipeline like data through a pipeline of CPUs.

The challenge: **pipeline bubbles**, idle time waiting for the previous stage to finish. GPipe \cite[Huang et al., 2018]{huang2018gpipe} splits each mini-batch into $m$ micro-batches, processing them in staggered fashion. PipelineFLUSH and 1F1B (One-Forward-One-Backward, used in Megatron and DeepSpeed) reduce bubble overhead.
</div>

<div class="md">
### Sequence Parallelism

For very long contexts, the attention matrix $QK^\top$ is $O(n^2)$ per head. **Sequence parallelism** splits the sequence dimension across GPUs: GPU $i$ holds tokens $[i \cdot n/P, (i+1) \cdot n/P)$. Each computes attention on its local chunk; only the relevant $QK^\top$ slice is computed, reducing memory by $1/P$.

Ring Attention \cite[Liu et al., 2023]{liu2023ring} and Striped Attention implement sequence parallelism with overlapping communication, enabling million-token context training.

### Expert Parallelism (for MoE)

For \cite[Bubeck et al., 2023]{bubeck2023moeoverview}-of-Experts models (see the Transformer chapter): different experts live on different GPUs. Tokens routed to expert $E_i$ are sent to GPU $i$. **All-to-all** communication routes tokens to their expert GPU.
</div>

<div class="md">
## Putting It Together: A Real-World Recipe

Llama 3 (Meta, 2024) was trained on **16,384 H100s** using a combination:

* **Tensor Parallelism** = 8 (within a node, using NVLink)
* **Pipeline Parallelism** = 16 (across nodes, using InfiniBand)
* **Data Parallelism** = 128 (model replicas)

Total: $8 \times 16 \times 128 = 16{,}384$ GPUs, training a 405B model in ~3,700 GPU-days.

GPT-4 was estimated at ~25,000 A100s for ~3 months. The trend: more GPUs, larger models, longer training, but the math is the same.
</div>

<div class="md">
## Communication: AllReduce and Friends

Three primitives dominate:

| Primitive | Description | Used by |
|-----------|-------------|---------|
| **AllReduce** | Sum across all GPUs, every GPU gets the result | DP gradient sync |
| **AllGather** | Each GPU gets the full tensor | ZeRO-3 param fetch |
| **ReduceScatter** | Each GPU gets a slice of the reduced tensor | ZeRO-3 + optimizer |
| **AllToAll** | Every GPU sends a unique chunk to every other | MoE routing |

Bandwidth hierarchy: NVLink (~900 GB/s) > InfiniBand NDR (~400 Gb/s) > Ethernet (~100 Gb/s). Modern training uses **NVLink within node, InfiniBand across nodes**.

**Gradient accumulation** amortizes communication by computing gradients over multiple micro-batches before syncing. **Gradient compression** (1-bit Adam, PowerSGD) reduces the bytes sent.
</div>

<div class="md">
## Activation Checkpointing (Gradient Checkpointing)

Activations dominate memory at training time. For a 70B model with batch size 1 and 4K context, activations can reach hundreds of GB.

**Activation checkpointing** trades compute for memory: instead of storing all activations, store only every $k$-th. During backward pass, recompute the missing ones.

$$
\text{Memory} \propto \frac{L \cdot B \cdot S \cdot d}{k}, \quad \text{Compute} \propto \frac{L \cdot B \cdot S \cdot d \cdot (1 + 1/k)}{1}
$$

With $k = \sqrt{L}$, memory drops to $O(\sqrt{L})$ at 33% extra compute. Universal practice for frontier training.
</div>

<div class="md">
## Mixed Precision and bf16

Modern training uses **bfloat16** (bf16) for forward and backward, **fp32** for optimizer states and master weights:

* bf16 has the same dynamic range as fp32 (8 exponent bits) but only 7 mantissa bits.
* Master weights in fp32 ensure optimizer updates are precise.
* Loss scaling handles gradient underflow in earlier stages.

NVIDIA's **Transformer Engine** (H100) supports fp8 matmul, halving memory and doubling throughput. Adoption is becoming standard.
</div>

<div class="md">
## Fault Tolerance

A 10,000-GPU training run experiences **multiple hardware failures per day**. Naive checkpointing once a day wastes hours of compute on recovery.

Modern systems:

* **Asynchronous checkpointing**: write checkpoints in parallel with training, every 30 minutes.
* **Elastic training**: nodes can drop out and rejoin; the training run continues.
* **Failure prediction**: ML models predict GPU failures minutes in advance.
* **Redundant computation**: double-check critical steps on a second GPU.

The result: training runs achieve **>95% efficiency** even on unreliable hardware.
</div>

<div class="md">
## Frameworks

* **Megatron-LM** (NVIDIA): the canonical tensor-parallel + pipeline-parallel implementation.
* **DeepSpeed** (Microsoft): ZeRO, 3D parallelism, optimizer offload, compression. Now merged with PyTorch as FSDP2.
* **FSDP** (PyTorch native): ZeRO-3 with PyTorch-native sharding.
* **FairScale** (Meta, archived): predecessor of FSDP.
* **JAX/pjit/pmap** (Google): functional programming model for distributed compute; underlies PaLM and Gemma.
* **Hugging Face Accelerate**: lightweight wrapper around FSDP/DeepSpeed.
* **torchtitan** (Meta, 2024): new PyTorch-native training stack.
* **Nanotron** (HuggingFace, 2024): reference implementation for training a Llama-style model from scratch.

For a new training run today, **FSDP-2 with bf16 + activation checkpointing** is the standard starting point.
</div>

<div class="md">
## Practical Sizing Guide

For a 70B model with bf16:

| Component | Memory |
|-----------|--------|
| Parameters | 140 GB |
| Optimizer (Adam fp32) | 560 GB |
| Gradients (bf16) | 140 GB |
| Activations (8K seq, bs=1, ckpt) | ~80 GB |
| **Total** | **~920 GB** |

On 8 H100s with 80 GB each = 640 GB total. **FSDP across 16 H100s** (1280 GB) comfortably fits. With TP=8 within node + ZeRO-3 across 16 nodes = 128 GPUs, you have headroom for larger batch sizes.

For a 405B model (Llama 3): a *theoretical minimum* configuration with TP=8, PP=16, FSDP across 8 replicas = **1024 H100s** would suffice. (In practice, Meta's published report for the same 405B run used the larger **16,384 H100s** configuration cited above, trading additional compute for faster wall-clock training.)

The frontier in 2025: **multi-trillion parameter models on 100,000+ GPU clusters**, with training runs costing $100M–$1B.
</div>

<script>
// Parallelism strategies comparison
(function() {
	const c = document.getElementById('parallelism-viz');
	if (!c) return;

	const strategies = ['Data\nParallelism', 'Tensor\nParallelism', 'Pipeline\nParallelism', 'Sequence\nParallelism', 'FSDP\n(ZeRO-3)'];
	const memPerGPU = [840, 420, 60, 840, 60];  // GB for 70B model on 8 GPUs
	const commGB = [10, 60, 5, 80, 40];          // per-step communication
	const ease = [9, 5, 4, 4, 6];                // ease of implementation (subjective)

	Plotly.newPlot('parallelism-viz', [
		{ x: strategies, y: memPerGPU, type: 'bar', name: 'memory per GPU (GB)', marker: { color: '#3b82f6' } },
		{ x: strategies, y: commGB, type: 'bar', name: 'comm per step (GB)', marker: { color: '#f59e0b' } }
	], {
		title: { text: 'Parallelism strategies for a 70B model on 8 GPUs', font: { size: 13 } },
		barmode: 'group',
		yaxis: { title: 'GB' },
		xaxis: { tickangle: 0 },
		margin: { t: 50, b: 80, l: 60, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		legend: { x: 0.02, y: 0.98 }
	}, { responsive: true });
})();

async function loadTrainingInfrastructureModule() {
	updateLoadingStatus("Loading section about Training Infrastructure...");
	return Promise.resolve();
}
</script>
