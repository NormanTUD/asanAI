<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Inference vs Training — the KV-cache and the two regimes
description: Why inference is a different form of computation than training: prefill versus decode, compute-bound versus memory-bound, and the KV-cache that shapes the entire serving economy.
icon: &#9889;
part: 5
order: 19
color: rose
topics: inference, hardware, architecture
tags: math-heavy, code-heavy
math: 55
-->

<div class="md" data-lesson-id="inference_vs_training">
Training and inference are the *same function* — the same weights, the same attention, the same layers — but they are **different forms of computation**, and the difference is the load-bearing fact of the whole serving economy. In [Attention](attentionlab.php) you saw the mechanism; in [Inference optimization](inference_optimization.php) and [Production serving](production_serving.php) you will meet the tricks. This chapter gives them the *reason*: why a model that took minutes to train on a batch takes *seconds per token* to serve, and why "how many tokens per second?" and "how many users at once?" are two different questions with two different answers.
</div>

<div class="md">
## Training runs over a batch; inference runs over a stream

During **training**, the model sees the *whole* sequence at once — a prompt and its target, as a dense block of $T$ tokens processed in parallel. That parallelism is what makes a GPU fast: a big block of tokens is a dense matrix multiply, and dense matrix multiplies are exactly the work a GPU's arithmetic units are built for. Training is **compute-bound** — the bottleneck is the sheer number of floating-point operations.

**Inference** is different. Generation is *autoregressive*: you produce **one token at a time**, and each new token must attend to every token that came before it. There is no "batch of $T$ new tokens" to parallelize — there is exactly one. So the question at each step is no longer "how many multiplies?" (just one token's worth) but "how much *data* do I have to move to compute this one token?" And the answer is: *a lot* — the entire model's weights, plus every past token's attention state. That makes decode **memory-bandwidth-bound**: the arithmetic units sit mostly idle while the memory bus is the thing keeping up.

<figure>
	<svg viewBox="0 0 560 130" role="img" aria-label="Prefill is one big parallel block; decode is one token at a time, each reading a growing KV-cache" style="width:100%; height:auto; max-width:560px; display:block; margin:0 auto;">
		<text x="12" y="20" font-size="12" fill="var(--mn-text-secondary)">PREFILL (prompt, length T)</text>
		<rect x="12" y="30" width="250" height="34" rx="6" fill="var(--mn-bg-subtle)" stroke="var(--mn-accent)"/>
		<text x="137" y="51" text-anchor="middle" font-size="12" fill="var(--mn-text)">T tokens in parallel → dense matmul</text>
		<text x="272" y="51" font-size="12" fill="var(--mn-text-secondary)">compute-bound</text>
		<text x="12" y="95" font-size="12" fill="var(--mn-text-secondary)">DECODE (one token at a time)</text>
		<rect x="12" y="104" width="40" height="20" rx="4" fill="var(--mn-bg-subtle)" stroke="var(--mn-accent)"/>
		<text x="32" y="118" text-anchor="middle" font-size="11" fill="var(--mn-text)">t</text>
		<rect x="58" y="104" width="40" height="20" rx="4" fill="var(--mn-bg-subtle)" stroke="var(--mn-accent)"/>
		<text x="78" y="118" text-anchor="middle" font-size="11" fill="var(--mn-text)">t+1</text>
		<rect x="104" y="104" width="40" height="20" rx="4" fill="var(--mn-bg-subtle)" stroke="var(--mn-accent)"/>
		<text x="124" y="118" text-anchor="middle" font-size="11" fill="var(--mn-text)">t+2</text>
		<text x="160" y="118" font-size="13" fill="var(--mn-text-secondary)">…</text>
		<rect x="180" y="98" width="368" height="34" rx="6" fill="none" stroke="var(--mn-text-secondary)" stroke-dasharray="4 3"/>
		<text x="364" y="119" text-anchor="middle" font-size="12" fill="var(--mn-text-secondary)">KV-cache — grows by one entry per step</text>
	</svg>
	<figcaption class="md">Prefill processes the whole prompt in parallel (a dense, compute-bound block). Decode then appends one token at a time, and every step must read the entire KV-cache that has grown up to that point (a memory-bound step).</figcaption>
</figure>
</div>

<div class="md">
## The KV-cache: stop recomputing the past

Attention is $O(T^2)$ in the naive reading: token $i$ attends to all $i$ preceding tokens. If you recomputed that from scratch for every new token, generation would be catastrophically slow — the cost would grow quadratically with length. The **KV-cache** is the fix: the keys and values for each past token are computed *once* and **stored**, so when the next token arrives its attention *reuses* the cached keys and values instead of recomputing them. You trade memory for arithmetic: the cache grows by one key and one value per layer, per head, per new token — **linear** in sequence length — and decode stays $O(T)$ rather than $O(T^2)$ per step.

That cache is also, quietly, the most important *physical* object in serving. It is where the memory goes as context length grows, and it is the thing the memory-bound decode step has to move. Everything below — why long contexts are expensive, why people quantize, why they build PagedAttention — is a consequence of that cache.
</div>

<div class="md">
## Why the two regimes set the economics

Because decode is memory-bandwidth-bound, its cost is dominated by *how many bytes you read*, not how many flops you do. And you read two things: the model weights (once per step) and the KV-cache (which grows with context). Three consequences follow, and they shape the entire serving industry (\cite[Pope et al., 2022]{pope2022scaling}).

**Long contexts are expensive, per token.** A 32k-token context means every decode step reads a 32k-token cache. The per-token cost of *decoding* climbs with the length of what is already in the window — which is why "how long can it read?" and "how fast does it answer?" are coupled, and why the [context window](contextwindows.php) is a cost dial, not just a feature.

**The optimizations are all about moving fewer bytes.** **Quantization** shrinks the bytes of both weights and cache (lower precision, fewer bits to move). **FlashAttention** (\cite[Dao et al., 2022]{flashattention2022}) reorders the computation so the attention matrix is never materialized in memory, cutting the memory traffic of the attention itself. And **PagedAttention** (\cite[Kwon et al., vLLM (2023)]{vllm2023}) manages the KV-cache like an operating system manages virtual memory — in fixed-size *blocks* — so you do not reserve a worst-case contiguous chunk per sequence and waste half the memory to fragmentation.

**Throughput and concurrency are different numbers.** "Tokens per second" is the speed of *one* stream — a property of the memory-bound decode step. "How many *users* at once" is a property of *how many KV-caches fit in memory* — a capacity question. Continuous batching interleaves many sequences' decode steps so the (memory-bound) hardware is kept busy with more than one stream, trading a little latency-per-stream for a lot more total users. A serving system is a machine for managing that trade-off, and the KV-cache is the working set it manages.

> The reason the "optimizations" in the next chapters work is the reason a single token takes as long as it does: inference is not a smaller version of training. It is a *different bottleneck* — one where moving bytes, not computing them, is the scarce resource, and where a linearly growing cache is the object of all the attention.
</div>

<div class="mn-quiz" data-quiz="inference_vs_training"><script type="application/json">{"title": "Inference vs training", "questions": [{"q": "What are the two phases of generating an answer?", "options": ["Prefill (process the whole prompt in parallel) and decode (one token at a time)", "Training the model on the corpus, then testing it on a set of held-out examples", "Tokenizing the prompt, then detokenizing the generated answer for the user", "A forward pass through the network, then a backward pass for the gradients"], "answer": 0, "explain": "Prefill is compute-bound; decode is memory-bound."}, {"q": "Why is the decode phase memory-bound?", "options": ["Each new token needs all weights loaded, but does little computation with them", "It performs more floating-point operations per token than training does overall", "Its tokens are larger than the ones that the prefill phase works with", "It runs on the CPU instead of the GPU, which makes every token much slower"], "answer": 0, "explain": "Memory bandwidth, not arithmetic, limits tokens per second."}, {"q": "What does the KV cache avoid?", "options": ["Recomputing keys and values of past tokens at every new step", "Storing all the model weights between successive forward passes", "Running the attention operation over the prompt at all", "Tokenizing the prompt again for every generated token"], "answer": 0, "explain": "Each step computes K and V only for the new token and reuses the rest."}, {"q": "During training, how are all positions of a sequence processed?", "options": ["In parallel, thanks to the causal mask", "Strictly one after another, in sequence order", "Only the last position of the sequence", "In random order, shuffled at every step"], "answer": 0, "explain": "Teacher forcing plus masking lets every position learn its next token in one pass."}]}</script></div>
