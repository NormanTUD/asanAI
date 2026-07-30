<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Running Models Locally
description: llama.cpp, Ollama, LM Studio, GGUF, and how to run a frontier-class LLM on your laptop.
icon: &#128187;
part: 5
order: 42
color: rose
-->

<div class="md">
You don't need a GPU cluster to run a powerful LLM. A quantized 70B model runs on a MacBook. A 7B model in fp16 fits on a phone. The local-LLM ecosystem in 2025 is mature enough for serious work: privacy-preserving inference, offline use, fine-tuning on consumer hardware, and even agents that never touch the cloud.

This chapter covers the practical stack: from llama.cpp's GGUF format to Ollama's one-line setup.
</div>

<div class="md">
## The Hardware Reality

A consumer GPU in 2025:

| GPU | VRAM | What it can run |
|-----|------|------------------|
| RTX 3060 | 12 GB | 7B in int4, 13B in int3 |
| RTX 4070 Ti | 12 GB | Same |
| RTX 4090 | 24 GB | 13B fp16, 70B int4 |
| RTX 5090 | 32 GB | 30B fp16, 70B int4/8 |
| Apple M3 Max | 64–128 GB unified | 70B fp16, 405B int4 |
| Apple M4 Max | 64–128 GB unified | Same |

The **unified memory** on Apple Silicon is the killer feature: you can use 64–128 GB for both model weights and OS, making local 70B inference practical on a laptop. A Mac Studio M3 Ultra with 192 GB runs a 405B model in int4 at usable speeds.
</div>

<div class="md">
## GGUF: The Universal Format

**GGUF** (GPT-Generated Unified Format) is the de facto standard for local LLMs, designed by Georgi Gerganov for **llama.cpp**. Every popular open model is published in GGUF.

GGUF supports many quantization schemes in a single file:

| Type | Bits/weight | Quality | Size (70B) |
|------|-------------|---------|------------|
| F32 | 32 | Lossless | 280 GB |
| F16 / BF16 | 16 | Negligible loss | 140 GB |
| Q8_0 | 8 | ~0.5% loss | 70 GB |
| Q6_K | 6.5 | ~1% | 60 GB |
| Q5_K_M | 5.5 | ~1.5% | 48 GB |
| Q4_K_M | 4.5 | ~2–3% | 40 GB |
| Q3_K_M | 3.5 | ~5% | 32 GB |
| Q2_K | 2.5 | ~10% | 25 GB |
| IQ1_S | 1.5 | Major loss | 18 GB |

The K-quant schemes (Q2_K through Q5_K_M) use **k-quantization** with importance-aware mixed precision: most weights are quantized to the target bits, but sensitive layers get extra bits. **IQ-quants** (Importance-aware Quantization) push to 1–2 bits with surprisingly good quality.

A rule of thumb: **Q4_K_M is the sweet spot** for most local use. Q5_K_M for quality-sensitive work. Q8_0 if you have memory to spare.
</div>

<div class="md">
## llama.cpp: The Reference Engine

**llama.cpp** (https://github.com/ggerganov/llama.cpp) is a C++ inference engine, originally designed to run Llama 7B on a MacBook. It now supports:

* All major open models (Llama, Mistral, Qwen, DeepSeek, Phi, Gemma, etc.)
* CPU, CUDA, Metal (Apple GPU), ROCm (AMD), Vulkan, SYCL (Intel), OpenCL
* Speculative decoding, prefix caching, multi-GPU
* LoRA adapter loading at runtime
* Batched inference (server mode)

Basic CLI:

```
./llama-cli -m model.gguf -p "Hello, my name is" -n 200
```

Server mode (OpenAI-compatible API):

```
./llama-server -m model.gguf --port 8080 -c 8192
```

Then point any OpenAI client at `http://localhost:8080/v1`. **Drop-in local replacement for OpenAI's API**.

Performance: a 70B Q4_K_M on M3 Max generates ~10–15 tokens/second. A 7B Q4_K_M on RTX 4090: ~80–120 tokens/second. A 405B Q4 on M3 Ultra: ~5 tokens/second. Slow, but useful.
</div>

<div class="md">
## Ollama: One-Line Local LLMs

**Ollama** (https://ollama.com) wraps llama.cpp in a clean interface:

```
ollama pull llama3.1:8b
ollama run llama3.1:8b "Explain transformers in 3 sentences"
```

Ollama handles model downloads (from its registry), quantization (you can specify the quant level), and exposes an OpenAI-compatible API at `localhost:11434`. It also ships a Modelfile system for custom system prompts and parameters.

```dockerfile
# Modelfile
FROM llama3.1:8b
SYSTEM "You are a helpful coding assistant. Always explain your reasoning."
PARAMETER temperature 0.7
PARAMETER num_ctx 8192
```

```
ollama create my-coder -f Modelfile
ollama run my-coder
```

The Ollama library has thousands of community-contributed models, including fine-tunes for specific tasks (code, math, roleplay, embeddings).
</div>

<div class="md">
## LM Studio: GUI for Local LLMs

**LM Studio** (https://lmstudio.ai) is the desktop app version: search, download, chat, and run a local API. Built on llama.cpp but with a polished UI. Targets non-technical users.

* Built-in model browser (HuggingFace integration).
* Chat UI with conversation history.
* OpenAI-compatible local server.
* GPU/CPU control, KV-cache size, context length.
* Available on macOS, Windows, Linux.

For most people, LM Studio is the easiest entry point. For developers, Ollama or llama.cpp directly.
</div>

<div class="md">
## Other Local Tools

* **Jan** (https://jan.ai): open-source desktop client, similar to LM Studio.
* **GPT4All** (Nomic): local model runner with retrieval built in.
* **PrivateGPT / LocalAI**: OpenAI drop-in replacements with local model backends.
* **mlx** (Apple): Apple's ML framework, optimized for Apple Silicon.
* **exllamav2** (turboderp): high-throughput inference for NVIDIA GPUs.
* **koboldcpp**: llama.cpp with a KoboldAI-style UI for creative writing.
* **text-generation-webui** (oobabooga): the original local LLM web UI.
* **vLLM**: primarily a server, but can run locally on multi-GPU machines.
* **SGLang**: production-grade local server with structured generation.

For Python notebooks: **transformers + accelerate + bitsandbytes** loads any HuggingFace model in 4–8 bits with two lines of code.
</div>

<div class="md">
## Fine-Tuning Locally

The 2024–2025 democratization of fine-tuning is real:

* **QLoRA** (Dettmers et al., 2023): 4-bit base model + LoRA adapters trainable in fp16. Fits a 70B fine-tune on a single 48 GB GPU.
* **Unsloth**: 2× faster QLoRA, kernels optimized for consumer GPUs.
* **Axolotl**: popular framework for instruction fine-tuning.
* **LoRA / QLoRA / DoRA**: rank-$r$ adapters that train a tiny fraction of parameters.
* **torchtune** (PyTorch native): clean library for fine-tuning recipes.

A typical local fine-tune:

1. Pick a base model (Llama 3.1 8B, Mistral 7B, Qwen 2.5 7B).
2. Format your data as instruction-response pairs (JSONL, Alpaca format).
3. Train a LoRA adapter with QLoRA on your consumer GPU (hours, not days).
4. Merge the adapter into the base model.
5. Quantize to GGUF and serve with Ollama.

Total time: an afternoon for a small fine-tune. Cost: your electricity.
</div>

<div class="md">
## What You Can Realistically Do Locally

A 7B model on a modern laptop:

* Chat, summarization, basic reasoning
* Code completion and review (with quantization-aware models like DeepSeek-Coder)
* Lightweight RAG over personal documents
* Local agent loops with tool use
* Privacy-preserving inference for sensitive data

A 70B model on a beefy Mac Studio:

* Near-frontier quality on most tasks
* Longer contexts (32K+) at usable speeds
* Strong coding and reasoning
* Acceptable throughput for a single user

What local cannot do (yet):

* Match frontier model quality on hard reasoning (MATH, GPQA)
* Real-time voice (latency too high)
* Run on phones for serious workloads (3B max)
* Multi-user serving at scale

The gap is closing: by 2026, expect frontier-quality 70B models running comfortably on laptops.
</div>

<div class="md">
## The Privacy Argument

For many organizations, **local inference is mandatory**:

* **Healthcare**: HIPAA-compliant inference on patient data without cloud transmission.
* **Legal**: attorney-client privilege requires no third-party data sharing.
* **Finance**: proprietary trading strategies never leave the firewall.
* **Defense / government**: air-gapped deployments.
* **Personal use**: conversation logs never uploaded.

The local-LLM ecosystem in 2025 makes this practical. A small fine-tune on internal data + a quantized local model = a private AI assistant that never phones home.
</div>

<div class="md">
## Local vs Cloud: The Decision Matrix

| Consideration | Local | Cloud |
|--------------|-------|-------|
| **Setup cost** | Hardware ($2–10K) | $0 |
| **Per-query cost** | Electricity | Token-based pricing |
| **Latency** | 10–50 ms + compute | 100–1000 ms network + compute |
| **Privacy** | Total | Limited by provider |
| **Model quality** | Open-source only | Frontier (GPT-4o, Claude 4, Gemini 2) |
| **Customization** | Full fine-tune access | Limited to API |
| **Scalability** | Single-machine | Elastic |
| **Maintenance** | You | Provider |

For most individuals and small businesses: **hybrid**. Use local for privacy-sensitive workloads and high-volume routine tasks. Use cloud for hard reasoning and frontier capabilities.
</div>

<script>
async function loadRunningLocallyModule() {
	updateLoadingStatus("Loading section about Running Models Locally...");
	return Promise.resolve();
}
</script>
