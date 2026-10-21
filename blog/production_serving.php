<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Production Serving & Inference
description: vLLM, continuous batching, paged attention, and how to serve an LLM to millions of users — plus the engineering around the model: routing, guardrails, tool-calling, retry and fallback, observability, and cost tracking.
icon: &#9889;
part: 5
order: 14
color: rose
topics: inference, hardware, programming, society, architecture, safety
tags: code-heavy
math: 30
-->

<div class="md">
Training is once; inference is forever. A frontier LLM might be trained for $100M and then **served billions of times** at a per-call cost that determines profitability. This chapter covers the systems stack that makes LLM inference fast, cheap, and reliable.

The frontier in 2025: serving **hundreds of thousands of tokens per second per cluster** (a 100-node cluster of 70B-class models serving ~10,000 concurrent users at ~30 tokens/sec each) with sub-100 ms TPOT for chat workloads.
</div>

<div class="md">
## The inference challenge

### The Inference Challenge

For a 70B model in bf16 on a single H100, each generated token requires reading the full model weights from HBM. With 140 GB at ~3 TB/s HBM bandwidth, this gives **~46 ms per token** as a *pure memory-bandwidth lower bound*, the absolute floor for fp16, single-user, single-GPU decode. Production chat targets are tighter: **TTFT** (time to first token) of < 500 ms and **TPOT** (time per output token) of < 50 ms. To beat the 46 ms floor, systems use FP8 quantization, speculative decoding (multiple tokens per memory pass), and/or multi-GPU sharding that reduces per-GPU memory traffic, the techniques discussed in this chapter.

Three bottlenecks:

1. **Memory bandwidth (the hard floor)**: see above, sets the minimum per-token latency for a given precision.
2. **Compute throughput**: matmuls saturate FLOPs only at large batch sizes.
3. **Latency**: chat workloads are bursty; prefill and decode have different characteristics.

Solutions attack each in turn.
</div>

<div class="md" data-mathlevel="50">
### KV-Cache: The Hidden Memory Tax

Recall from the Attention chapter: during autoregressive generation, each new token must attend to all previous tokens. Without caching, every step recomputes the K and V matrices for the full history, $O(n^2)$ work per token.

The **KV-cache** stores the K and V projections of past tokens in GPU memory. Memory per token:

$$
\text{KV memory per token} = 2 \cdot L \cdot h \cdot d_h \cdot \text{bytes}
$$

For a 70B model ($L = 80$ layers, $h = 64$ heads, $d_h = 128$) with fp16 KV (2 bytes): $2 \cdot 80 \cdot 64 \cdot 128 \cdot 2 = 2.6$ MB per token. For 4K context: 10.5 GB; for 128K context: **335 GB**, **exceeding the model weights themselves**.

This is the dominant memory cost in inference. Several techniques address it:

* **Multi-Query Attention (MQA) / Grouped-Query Attention (GQA)** (\cite[Ainslie et al., 2023]{ainslie2023gqa}): share K/V across multiple query heads. Llama 2 70B uses GQA with 8 KV heads for 64 query heads → 8× less KV memory.
* **Paged Attention** (\cite[Kwon et al., 2023]{kwon2023vllm}) (vLLM): allocate KV cache in non-contiguous pages, like OS virtual memory. Eliminates fragmentation, enables sharing across requests.
* **KV-cache compression**: quantize KV to int4 or int8 (≈4× memory reduction, minor quality loss).
* **Sliding-window attention**: only cache the last $w$ tokens' KV. Used in Mistral and Gemma 2.
* **Prefix caching**: reuse KV across requests with the same prompt prefix. Standard for system prompts.
</div>

<div id="kv-viz" style="width:100%; max-width:var(--mn-col-width); margin:1em auto;"></div>

<div class="md">
### Batching: The Key to GPU Efficiency

A single forward pass for one user underutilizes the GPU. **Batching** amortizes memory reads across many requests:

#### Static Batching

Generate one token for $B$ requests at the same time. All requests run synchronously; some finish early but wait for others. **Straggler problem**: one long request blocks the rest.

#### Dynamic Batching

Continuously add new requests to the batch as they arrive. Better throughput, but still has stragglers.

#### Continuous Batching (Iteration-level Scheduling)

**vLLM** (\cite[Kwon et al., 2023]{kwon2023vllm}) and **TGI** (HuggingFace) introduced this: after each token is generated, immediately swap finished sequences out of the batch and swap new ones in. GPU stays at peak utilization; no waiting.

Continuous batching alone can give 10–20× throughput improvement over static batching for chat workloads.
</div>

<div id="batching-viz" style="width:100%; max-width:var(--mn-col-width); margin:1em auto;"></div>

<div class="md">
### Paged Attention

Naïve KV-cache allocation reserves a contiguous block per request: if a request needs 4K tokens but only 2K are used, the rest is wasted. With many requests, fragmentation can waste **30–60%** of KV memory.

**Paged Attention** (vLLM) treats the KV cache like OS virtual memory (\cite[Kwon et al., 2023]{kwon2023vllm}):

* Allocate fixed-size **physical blocks** (typically 16 tokens each).
* Each request has a **block table** mapping logical → physical blocks.
* Blocks can be **shared** across requests with the same prefix (e.g., the system prompt).
* No fragmentation; near-100% memory utilization.

Paged Attention (\cite[Kwon et al., 2023]{kwon2023vllm}) is now the standard in vLLM, TGI, TensorRT-LLM, and most production systems.
</div>

<div class="md">
### Speculative Decoding

LLM decoding is **memory-bound**, not compute-bound. Each token requires reading all model weights once. A 70B model can generate at most ~20 tokens/s on a single H100, regardless of FLOPs.

**Speculative decoding** (\cite[Leviathan et al., 2023]{leviathan2023speculative}) breaks this:

1. A small, fast **draft model** (e.g., 1B) generates $k$ candidate tokens autoregressively (fast, ~10× the throughput).
2. The large **target model** verifies all $k$ tokens in a **single forward pass** (parallel).
3. Accept the longest prefix the target model agrees with; resample from the corrected distribution on rejection.

If the draft and target agree on $k$ tokens, you get $k$ tokens for the cost of 1 forward pass. Typical speedup: **2–3×** with high acceptance rate (90%+ for chat).

**Self-speculative decoding**: use early-exit or layer-skipping to draft with a partial version of the same model. No separate draft model needed.
</div>

<div class="md" data-mathlevel="50">
### Quantization

Reduce precision of weights and/or activations:

| Format | Bits | 70B size | Quality loss |
|--------|------|----------|--------------|
| fp32 | 32 | 280 GB | Baseline |
| fp16 / bf16 | 16 | 140 GB | Negligible |
| int8 (weights only) | 8 | 70 GB | ~0.5% on benchmarks |
| int4 (GPTQ, AWQ) | 4 | 35 GB | 1–3% |
| int3 / int2 (QuIP, QuIP#) | 2–3 | 17–23 GB | 3–10% |
| 1-bit (BitNet \cite[Ma et al., 2024]{ma2024bitnet}) | 1.58 | 13 GB | Comparable to fp16 at scale |

Modern quantization is **nearly free** at int8 and acceptable at int4 for most workloads. AWQ (Activation-aware Weight Quantization \cite[Lin et al., 2023]{lin2023awq}) and GPTQ (\cite[Frantar et al., 2023]{frantar2022gptq}) are the standard tools. The trade-off is non-uniform: outliers in some channels cause big errors; per-channel scaling mitigates.

For activations, **fp8** (H100 native) gives 2× throughput with minimal quality loss. **INT4 KV-cache** is a separate axis, giving up to 4× KV memory reduction.
</div>

<div class="md">
### Distillation Revisited

A small student model trained to mimic a large teacher:

* **Logit distillation** (\cite[Hinton et al., 2015]{hinton2015distilling}): match the teacher's full output distribution: $\mathcal{L} = \text{KL}\!\big(p_T \,\|\, p_S\big)$.
* **Hidden-state distillation**: match intermediate activations layer-by-layer.
* **Attention distillation**: match attention matrices.
* **Generative distillation**: train on the teacher's text outputs (supervised fine-tuning).

Modern distilled families:

* **DeepSeek-V3 → DeepSeek-R1-Distill** (2025): 1.5B–70B student models trained on R1 outputs.
* **Llama 3.1-Instruct (2024)**: the smaller instruct models use SFT data that is partly synthesized by the Llama 3.1-405B.
* **Phi-3-mini** (3.8B) → trained on Phi-3-medium's outputs.

Distilled models can match the teacher on specific benchmarks within 5–10% of its quality, at $10\times$ lower inference cost.
</div>

<div class="md">
## Serving stacks and hardware

### Serving Stacks

#### vLLM (UC Berkeley)

The most widely used open-source serving system. Paged Attention (\cite[Kwon et al., 2023]{kwon2023vllm}), continuous batching, tensor parallelism, speculative decoding, prefix caching. Powers ChatGPT-style deployments at major labs.

#### TGI (HuggingFace Text Generation Inference)

Rust-based serving stack. Optimized for transformer inference with built-in quantization, batching, and streaming. Production-grade at HuggingFace, AWS, and many enterprises.

#### TensorRT-LLM (NVIDIA)

NVIDIA's optimized inference engine. Tightly integrated with TensorRT for kernel fusion, in-flight batching, and fp8/int4 quantization. Highest raw throughput on NVIDIA hardware.

#### SGLang (Stanford LMSYS)

Optimized for **structured generation**, JSON output, grammar-constrained decoding, multi-turn tool use. Powers Vicuna and many agent systems.

#### llama.cpp (Georgi Gerganov)

The reference CPU and consumer-GPU inference engine. **GGUF** format, dozens of quantization levels, runs Llama 70B on a MacBook. The cornerstone of local LLM inference.

#### Inference Endpoints (Cloud)

* **OpenAI API**: GPT-4o, o1, o3. Managed, OpenAI's own stack.
* **Anthropic API**: Claude 3.5/3.7/4. Managed.
* **Google Vertex AI**: Gemini models.
* **Together.ai, Fireworks, Groq, Anyscale**: third-party inference providers running open-source models on optimized hardware.
* **AWS Bedrock**, **Azure AI Foundry**: enterprise multi-model.
</div>

<div class="md">
### Hardware: What to Use When

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
## The product around the model

### From Model to Product: the pipeline around the model

Everything up to this point has been about *serving* the model — the stack, the batching, the memory, the hardware. A deployed LLM **product** is a different animal, and the difference is structural, not incidental. **The model is a component, not the system.** It is a *stochastic* component — it can produce a different answer to the same prompt twice, it can be slow, it can exceed its budget, and it can, occasionally, fail outright — wrapped in a *deterministic* system that decides which model to call, what it is allowed to say, what it is allowed to do, what to do when it fails, and what it all cost. [Agents](agents.php) showed one piece of this; the sections below are the whole shape, because a "model" and a "product made with a model" are two different architectures, and most LLM engineering is the second one.
</div>

<div class="md">
#### The reframe: services around a thing that sometimes fails

Start from the property that drives everything: the model is **non-deterministic** (temperature > 0) and **reliably wrong sometimes**. A traditional service is deterministic and either works or returns an error; you design for the error. An LLM service is *probabilistic*: it returns *an* answer, most of the time *a good one*, occasionally *a bad one you cannot distinguish from a good one by its shape*. So the system around it is not a wrapper that calls it; it is a set of **services that manage a stochastic component's failures** — the same way a system around a flaky network manages packet loss, except here the "loss" is a confident, plausible, wrong answer.

The product, then, is a pipeline, and each stage is a service with its own job:

<figure>
	<svg viewBox="0 0 560 120" role="img" aria-label="The LLM product pipeline: query to router to guardrails to model to validation to retry or fallback to cost ledger" style="width:100%; height:auto; max-width:560px; display:block; margin:0 auto;">
		<defs><marker id="pparrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--mn-text-secondary)"/></marker></defs>
		<rect x="8" y="44" width="66" height="32" rx="7" fill="var(--mn-bg-subtle)" stroke="var(--mn-border)"/>
		<text x="41" y="64" text-anchor="middle" font-size="11" fill="var(--mn-text)">query</text>
		<rect x="90" y="44" width="70" height="32" rx="7" fill="var(--mn-bg-subtle)" stroke="var(--mn-accent)"/>
		<text x="125" y="64" text-anchor="middle" font-size="11" fill="var(--mn-text)">router</text>
		<rect x="176" y="44" width="70" height="32" rx="7" fill="var(--mn-bg-subtle)" stroke="var(--mn-accent)"/>
		<text x="211" y="64" text-anchor="middle" font-size="11" fill="var(--mn-text)">guard-rails</text>
		<rect x="262" y="44" width="60" height="32" rx="7" fill="var(--mn-bg-subtle)" stroke="var(--mn-border)"/>
		<text x="292" y="64" text-anchor="middle" font-size="11" fill="var(--mn-text)">model</text>
		<rect x="338" y="44" width="70" height="32" rx="7" fill="var(--mn-bg-subtle)" stroke="var(--mn-accent)"/>
		<text x="373" y="64" text-anchor="middle" font-size="11" fill="var(--mn-text)">validate</text>
		<rect x="424" y="44" width="70" height="32" rx="7" fill="var(--mn-bg-subtle)" stroke="var(--mn-accent)"/>
		<text x="459" y="60" text-anchor="middle" font-size="10" fill="var(--mn-text)">retry /</text>
		<text x="459" y="72" text-anchor="middle" font-size="10" fill="var(--mn-text)">fallback</text>
		<rect x="508" y="44" width="46" height="32" rx="7" fill="var(--mn-bg-subtle)" stroke="var(--mn-border)"/>
		<text x="531" y="64" text-anchor="middle" font-size="10" fill="var(--mn-text)">cost</text>
		<line x1="74" y1="60" x2="88" y2="60" stroke="var(--mn-text-secondary)" stroke-width="1.5" marker-end="url(#pparrow)"/>
		<line x1="160" y1="60" x2="174" y2="60" stroke="var(--mn-text-secondary)" stroke-width="1.5" marker-end="url(#pparrow)"/>
		<line x1="246" y1="60" x2="260" y2="60" stroke="var(--mn-text-secondary)" stroke-width="1.5" marker-end="url(#pparrow)"/>
		<line x1="322" y1="60" x2="336" y2="60" stroke="var(--mn-text-secondary)" stroke-width="1.5" marker-end="url(#pparrow)"/>
		<line x1="408" y1="60" x2="422" y2="60" stroke="var(--mn-text-secondary)" stroke-width="1.5" marker-end="url(#pparrow)"/>
		<line x1="494" y1="60" x2="506" y2="60" stroke="var(--mn-text-secondary)" stroke-width="1.5" marker-end="url(#pparrow)"/>
		<line x1="459" y1="76" x2="292" y2="76" stroke="var(--mn-border)" stroke-width="1" stroke-dasharray="3 3" marker-end="url(#pparrow)"/>
	</svg>
	<figcaption class="md">The pipeline. A query is routed to the right model, filtered in, answered, filtered out, and checked; if it fails, the retry/fallback loop re-enters the model (dashed) with a different choice; every call is metered. Each box is a service with its own failure mode.</figcaption>
</figure>
</div>

<div class="md">
#### The router: pick the model per query

The cheapest and highest-leverage service is the **router**. Not every query needs the biggest, most expensive model. A simple "what's the weather?" needs a small, fast model; a multi-step reasoning task needs a large one; a domain question needs a specialized or fine-tuned one. A router inspects the query and dispatches it — for **cost, quality, and latency** at once — and the common pattern is **cheap-then-escalate**: answer with a small model, and only if it signals low confidence (or the query classifies as hard) do you *escalate* to the big one. \cite[Ong et al., RouteLLM (2024)]{routellm2024} make this concrete: a lightweight learner, trained on preference data, predicts which model a query needs, and routes the easy ones to the small model — saving the large model's cost on the queries it was never going to beat anyway.

Routing is the first place the "the model is a component" reframe pays off: you are not *using* a model, you are *scheduling work across models*, exactly as a system schedules work across machines.
</div>

<div class="md">
#### Guardrails: enforced layers, not prompts

A guardrail is a check that runs **outside** the model, on its input or its output, that the model itself does not enforce. Input guardrails screen the query (is it in scope? does it contain PII you are not allowed to process? is it a prompt-injection attempt?). Output guardrails screen the answer (does it actually answer the question? does it contain a prohibited claim or a leaked secret? does it match the required format?). The key word is **enforced**: a guardrail is a *layer* the answer must pass, not a line in the system prompt asking the model to "please be careful." A prompt is a *request* to a stochastic component; a guardrail is a *gate* in the deterministic system. \cite[Rebedea et al., NeMo Guardrails (2023)]{nemocguardrails} is the canonical framing of guardrails as programmable, checkable "rails" the model's output must follow — safety, factuality, format, and scope as *checks*, not *advice*.

This is the same move as the entire course: you do not *trust* the stochastic part to do the thing you need; you *check* it. Guardrails are the deterministic system's way of holding the model to a contract the model alone would not keep.
</div>

<div class="md">
#### The tool-calling schema: a specification the model fills

When the model can act — read a file, call an API, run a function — the interface is a **schema**: a JSON description of the available tools, their arguments, and their types. The model does not "use the tool"; it *fills in the schema* — it emits a structured call (function name + arguments) that the *system* validates and executes. This is the [tool use](agents.php) half, but the architectural point is that the schema is a **specification**: a typed contract between a stochastic emitter (the model) and a deterministic executor (your code). The executor does not trust the emitted arguments; it *validates* them against the schema, and if the arguments are malformed or out of range, it rejects them and re-prompts. The model proposes; the schema disposes. The [ReAct](react2022) pattern (\cite[Yao et al., 2022]{react2022}) — reason, act, observe, repeat — is the loop this runs in, but the *contract* is the schema, and a schema is exactly the kind of written, checkable standard the [evaluation](evaluation.php) chapter keeps coming back to.
</div>

<div class="md">
#### Retry, fallback, and degradation: determinism is built, not had

Because the component is non-deterministic, the system must handle its failures *explicitly*, the way a distributed system handles a flaky dependency:

* **Retry with backoff.** A malformed call, a truncated output, a rate-limit error — retry, with a backoff, before giving up. Some failures are transient (a hiccup in the API); some are structural (the model keeps producing an out-of-schema answer), and those are not fixed by retrying — they are the guardrail's job to catch.
* **Fallback.** If the primary model fails or is too slow, fall back to a secondary model (a different provider, or a smaller/cheaper model of the same capability class). The product defines what "fallback" *means* — a degraded answer is acceptable, a wrong answer is not — and that definition is a product decision, not a model property.
* **Degradation and the all-down case.** What does the product do when *every* model is unavailable? A cached answer, a canned response, an honest "I can't do that right now" — one of these, *decided in advance*. A system with no defined behavior for total failure is not a system; it is a model with a network cable.

The through-line: **determinism is a property you build, not one the model has.** The model gives you a distribution; the pipeline collapses it to a single, checkable, recoverable outcome. The reliability the user experiences is engineered around the model, not supplied by it.
</div>

<div class="md">
> A model is a component. A product is a deterministic system that *schedules* a stochastic component (routing), *checks* it (guardrails), *contracts* with it (schemas), *recovers* from its failures (retry, fallback, degradation), and *sees* and *prices* everything it does (observability, cost). The model is the only box in the diagram you did not design; every other box you did. That is the whole discipline, and it is why "it works in the notebook" and "it works in production" are two different sentences.
</div>

<div class="md">
### Observability: The Hidden Half

A production LLM system needs:

* **Latency monitoring**: TTFT, TPOT, end-to-end, p50/p95/p99.
* **Throughput**: tokens/sec/GPU, requests/sec/GPU.
* **Quality**: periodic sampling + LLM-as-judge on real traffic.
* **Safety**: jailbreak detection, PII redaction, hallucination flags.
* **Cost tracking**: per-request token cost, dollar-cost-per-conversation.
* **A/B testing**: shadow traffic to new models, statistical comparison.

The reason the first two alone are not enough is the shape of the failures: an LLM product fails **one in two hundred** requests, not one in a thousand. You cannot debug a failure you cannot *reproduce by name* — the only way to find the 1-in-200 is to have logged the exact prompt that produced the bad answer. **Observability** is the record of *every call*: the prompt, the completion, tokens in and out, latency, which model it was routed to, which guardrail fired, whether it retried. \cite[OpenTelemetry GenAI (CNCF)]{otelgenai} standardizes exactly this — the GenAI semantic conventions for tracing LLM calls — so an LLM product has logs, metrics, and *traces* the way any other service does. It is what makes a probabilistic system *debuggable* at all.

**Cost tracking** is the per-request and per-user accounting of tokens — a first-class feature, not an afterthought, because the pipeline *creates* the cost: routing decides which model's price applies, retries multiply it, and fallbacks change the profile. Without per-user accounting you cannot answer the only question a business asks — *"what did this customer's usage actually cost us?"* (see [The economic layer](ai_economics)).

Tools: Langfuse, Helicone, LangSmith, Arize Phoenix, Honeycomb.

A common production mistake: shipping an LLM endpoint without **cost attribution**. At scale, a single user can rack up thousands of dollars per session if the system prompt is bloated or the conversation loops.
</div>

<div class="md">
### When NOT to Use an LLM

A good production engineer knows when to skip the LLM entirely:

* **Deterministic logic** (date parsing, math, lookups): use code, regex, traditional ML.
* **Sub-millisecond latency**: precompute, cache, use heuristics.
* **Strict reproducibility**: LLMs are stochastic; can't guarantee byte-identical output.
* **Auditability**: every LLM call needs human review for high-stakes decisions (medical, legal).
* **Cost ceiling**: a chat that costs $0.50 is fine; one that costs $5 is not.

Rule of thumb: prototype with the best model; measure cost; downgrade if necessary; cache aggressively; consider a hybrid pipeline (cheap heuristic + occasional LLM fallback).
</div>

<div class="md">
### MLOps / LLM-Ops: life after deployment

Serving is only the start. In production a model is a **system** that drifts, regresses, and costs money:

* **Monitoring & drift.** Inputs and quality shift over time (new slang, new user populations, data leaks). Track latency and error rate *and* the statistical shape of what is coming in.
* **Evals in CI.** Run a regression suite of prompts + automatic metrics on every change, like unit tests for code; A/B new weights against old on live traffic.
* **Versioning & rollback.** Treat weights, prompts, and retrieval indexes as versioned artifacts you can roll back in minutes.
* **Feedback loops.** Capture corrections and rejections, label a slice, and fold it back into fine-tuning — a data flywheel.
* **Cost governance.** Token cost, batch size, and model routing (cheap model first, expensive on escalation) are first-class constraints, not afterthoughts.

The discipline borrows its bones from software **continuous delivery** \cite[Wikipedia]{continuous_delivery_wiki} — build, test, ship, observe, repeat — now applied to a model whose "code" is a billion floating-point weights. The goal is the same as in the <a href="evaluation">Evaluation chapter</a>: a measurement loop tight enough that you learn, before a user does, when the model has started to fail.
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

<div class="mn-quiz" data-quiz="production_serving"><script type="application/json">{"title": "Production serving", "questions": [{"q": "What does continuous batching do?", "options": ["Adds and removes requests from a running batch at every generation step", "Waits until a fixed batch is full", "Processes one request at a time", "Batches only identical prompts"], "answer": 0, "explain": "GPUs stay busy even though requests have very different lengths."}, {"q": "Why is batching so important for GPU efficiency during decoding?", "options": ["Generating one token is memory-bound; batching reuses each loaded weight for many requests", "It makes answers longer", "It reduces the vocabulary", "It is not important"], "answer": 0, "explain": "Loading the weights once per step for 64 users instead of 1 multiplies throughput."}, {"q": "What does “observability” mean for an LLM service?", "options": ["Logging and measuring latency, costs, errors and output quality in production", "Making the model visible on the web", "Watching the GPU temperature only", "Interpretability research"], "answer": 0, "explain": "Without it, regressions and failures go unnoticed."}, {"q": "When should you not use an LLM at all?", "options": ["When a deterministic, cheaper method solves the task reliably", "Never — always use an LLM", "For any text task", "When the users are experts"], "answer": 0, "explain": "A regular expression or database query beats an LLM where exact rules suffice."}]}</script></div>
