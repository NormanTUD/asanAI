<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Economic Layer
description: What training costs as a function of parameters and tokens, the 6ND FLOPs rule, inference cost per token, why caching saves roughly 10×, and when a 7B on a laptop beats an API call.
icon: &#128176;
part: 5
order: 21
color: rose
topics: hardware, inference, data
tags: math-heavy
math: 50
-->

<div class="md" data-lesson-id="ai_economics">
The course has covered what AI *is* and what it *can do*; this chapter is the part that decides what it *can afford to do* — and it is missing until now. Economics is not a business afterthought bolted onto the technology; it is a **physical layer**, and it explains decisions you have already seen without a word of arithmetic: why the frontier moved to [Mixture of Experts](mixture_of_experts.php) (more knowledge, same active cost), why the field moved from large under-trained models toward smaller models trained on far more data ([Scaling](hyperparameters.php), \cite[Hoffmann et al., 2022]{hoffmann2022chinchilla}), and why "just run it locally" is sometimes the cheapest option and sometimes the most expensive. The whole layer reduces to two numbers — *FLOPs for training* and *FLOPs per token for inference* — and everything below is arithmetic on top of those two.
</div>

<div class="md">
## The cost model

### The 6ND rule: training cost in one line

Here is the load-bearing estimate. Training a transformer on $D$ tokens, with $N$ parameters, costs approximately

<div>
$$ \text{FLOPs}_{\text{train}} \approx 6\, N\, D $$
</div>

floating-point operations. The "6" has a clean origin, and it is worth deriving rather than memorizing:

* **Forward pass.** For each token, each parameter participates in roughly one multiply-add — one FLOP-pair, i.e. **2 FLOPs** — to transform the activation. Forward over $D$ tokens: $\approx 2ND$ FLOPs.
* **Backward pass.** Backpropagation computes gradients *with respect to the weights* (to update them) and *with respect to the activations* (to pass the gradient back) — about **twice** the forward work, so $\approx 4ND$ FLOPs.
* **Total.** $2ND$ (forward) $+$ $4ND$ (backward) $= 6ND$.

The reason this is so robust is the reason it is useful: to **first order it does not depend on the architecture**. Whether the parameters sit in attention or in feed-forward blocks, each one does one multiply-add per token in the forward pass, so the total is $2N$ FLOPs per token forward, regardless of *where* the parameters live. (The one term that *does* depend on architecture is the attention $O(n^2)$ over sequence length $n$, but for typical $n$ that is small against $ND$, so $6ND$ holds.) This is the same estimate that \cite[Kaplan et al. (2020)]{kaplan2020scaling} built its scaling laws on, and it is the number every "how much will this cost?" conversation starts from.

**Turn it into money.** FLOPs are not dollars; you need the GPU's *achievable* rate. A GPU has a *peak* FLOP/s, but a real training run reaches only a fraction of it — the **model FLOP utilization (MFU)** — typically around **40%**, because of communication, memory waits, and pipeline bubbles. So:

<div>
$$ \text{GPU-seconds} \approx \frac{6ND}{\text{MFU} \times \text{peak FLOP/s}}, \qquad \$ = \text{GPU-seconds} \times \frac{\$}{\text{second}} $$
</div>

Double $N$ or double $D$ and you double the cost — that linearity is why "make it bigger" is a *line item*, not a hope. The calculators below make the arithmetic live.
</div>

<div id="train-cost" style="max-width: var(--mn-col-width); margin: 1.5em auto; padding: 20px; border: 1px solid var(--mn-border); border-radius: 12px; background: var(--mn-surface);">
	<h3 style="margin-top:0; color: var(--mn-text);">Price your training run</h3>
	<p style="color:var(--mn-text-secondary); line-height:1.5;">Pick a model size, a data budget, a GPU, and an MFU. Watch the FLOPs, hours, and dollars move.</p>
	<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:14px; margin: 12px 0;">
		<label style="color:var(--mn-text-secondary);">Params $N$ (billions)<br><input type="number" id="tc-n" value="7" min="0.1" step="0.1" style="width:100%; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-bg-subtle); color:var(--mn-text);"></label>
		<label style="color:var(--mn-text-secondary);">Tokens $D$ (billions)<br><input type="number" id="tc-d" value="20" min="1" step="1" style="width:100%; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-bg-subtle); color:var(--mn-text);"></label>
		<label style="color:var(--mn-text-secondary);">GPU<br><select id="tc-gpu" style="width:100%; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-bg-subtle); color:var(--mn-text);">
			<option value="312" data-price="3.0">A100 (~312 TFLOP/s BF16)</option>
			<option value="495" data-price="4.0" selected>H100 (~495 TFLOP/s TF32)</option>
			<option value="989" data-price="4.5">H100 BF16 (~989 TFLOP/s)</option>
		</select></label>
		<label style="color:var(--mn-text-secondary);">MFU % (default 40)<br><input type="number" id="tc-mfu" value="40" min="1" max="100" step="1" style="width:100%; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-bg-subtle); color:var(--mn-text);"></label>
	</div>
	<p id="tc-out" style="font-family:monospace; color:var(--mn-text); line-height:1.7;"></p>
</div>

<script>
(function () {
	function fmtBig(x) {
		if (x === 0) return "0";
		return x.toExponential(2);
	}
	function fmtMoney(x) {
		if (x >= 1e9) return "$" + (x / 1e9).toPrecision(3) + "B";
		if (x >= 1e6) return "$" + (x / 1e6).toPrecision(3) + "M";
		if (x >= 1e3) return "$" + (x / 1e3).toPrecision(3) + "K";
		return "$" + x.toPrecision(3);
	}
	function compute() {
		var n = parseFloat(document.getElementById("tc-n").value) || 0;
		var d = parseFloat(document.getElementById("tc-d").value) || 0;
		var gpu = document.getElementById("tc-gpu");
		var peakTF = parseFloat(gpu.value) || 0;
		var perHour = parseFloat(gpu.options[gpu.selectedIndex].dataset.price) || 4;
		var mfu = (parseFloat(document.getElementById("tc-mfu").value) || 40) / 100;
		var N = n * 1e9, D = d * 1e9;
		var flops = 6 * N * D;
		var peak = peakTF * 1e12;
		var eff = mfu * peak;
		var seconds = flops / eff;
		var hours = seconds / 3600;
		var cards;
		if (hours > 0) cards = hours; /* hours on one card; scale below */
		var cost = hours * perHour;
		var out = document.getElementById("tc-out");
		out.innerHTML =
			"FLOPs ≈ 6ND = " + fmtBig(flops) + "<br>" +
			"effective rate = MFU × peak = " + (mfu * 100).toFixed(0) + "% × " + peakTF + " TFLOP/s<br>" +
			"GPU-hours ≈ " + Math.round(hours).toLocaleString() + " &nbsp;·&nbsp; cost ≈ " + fmtMoney(cost) + " (one stream)<br>" +
			"(spread across 1,000 cards, wall-clock ≈ " + (hours / 1000).toFixed(2) + " h; the total spend is the same.)";
	}
	["tc-n", "tc-d", "tc-gpu", "tc-mfu"].forEach(function (id) {
		var el = document.getElementById(id);
		if (el) el.addEventListener("input", compute);
	});
	compute();
})();
</script>

<div class="md">
### Inference cost per token: active parameters, not total

Inference is a **forward pass only** — no backward — so the per-token cost equals one training step's forward pass, about **2 FLOPs per active parameter per token** (one third of the $6N$ used for a full training step):

<div>
$$ \text{FLOPs}_{\text{infer}}/\text{token} \approx 2 \times (\text{active params}) $$
</div>

Notice the word **active**. For a dense model that is the total $N$; for a [MoE](mixture_of_experts.php) model it is the *active* expert count — DeepSeek-V3 costs its serving on **37B**, not its **671B**. That is the economic meaning of sparsity, made explicit: the *total* parameters decide the memory you must pay to *load* the model, but the *active* parameters decide the *compute* you pay for *every token*. This is exactly why serving a frontier model is "cheap per token" in compute while still "expensive to host" in memory — the two costs are set by two different numbers, and MoE widens the gap between them.
</div>

<div id="token-cost" style="max-width: var(--mn-col-width); margin: 1.5em auto; padding: 20px; border: 1px solid var(--mn-border); border-radius: 12px; background: var(--mn-surface);">
	<h3 style="margin-top:0; color: var(--mn-text);">Price your tokens</h3>
	<p style="color:var(--mn-text-secondary); line-height:1.5;">Enter a price per million tokens and a session's token count. Slide the cached fraction to see the effect of prompt caching on the bill.</p>
	<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:14px; margin: 12px 0;">
		<label style="color:var(--mn-text-secondary);">$/M tokens<br><input type="number" id="tk-price" value="3" min="0" step="0.1" style="width:100%; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-bg-subtle); color:var(--mn-text);"></label>
		<label style="color:var(--mn-text-secondary);">Tokens per session (millions)<br><input type="number" id="tk-tokens" value="0.5" min="0" step="0.05" style="width:100%; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-bg-subtle); color: var(--mn-text);"></label>
		<label style="color:var(--mn-text-secondary);">Cached fraction<br><input type="range" id="tk-cache" value="60" min="0" max="100" step="5" style="width:100%;"><span id="tk-cache-lbl" style="color:var(--mn-text);">60%</span></label>
	</div>
	<p id="tk-out" style="font-family:monospace; color:var(--mn-text); line-height:1.7;"></p>
</div>

<script>
(function () {
	function compute() {
		var price = parseFloat(document.getElementById("tk-price").value) || 0;
		var tokensM = parseFloat(document.getElementById("tk-tokens").value) || 0;
		var cache = (parseFloat(document.getElementById("tk-cache").value) || 0) / 100;
		document.getElementById("tk-cache-lbl").textContent = Math.round(cache * 100) + "%";
		/* cached tokens cost ~1/10 of uncached (the ~10x claim) */
		var costNoCache = tokensM * price;
		var effPerM = price * (1 - 0.9 * cache);
		var costWithCache = tokensM * effPerM;
		var savings = costNoCache > 0 ? (1 - costWithCache / costNoCache) * 100 : 0;
		document.getElementById("tk-out").innerHTML =
			"without caching ≈ $" + costNoCache.toFixed(3) + " / session<br>" +
			"with " + Math.round(cache * 100) + "% cached ≈ $" + costWithCache.toFixed(3) + " / session<br>" +
			"savings ≈ " + savings.toFixed(0) + "% of the bill";
	}
	["tk-price", "tk-tokens", "tk-cache"].forEach(function (id) {
		var el = document.getElementById(id);
		if (el) el.addEventListener("input", compute);
	});
	compute();
})();
</script>

<div class="md">
## Paying for it in practice

### Why caching saves ~10×: the prefill is paid once

The single most important serving cost-saver is **prompt caching**, and its arithmetic is the [prefill/decode split](inference_vs_training.php) you already met. The expensive part of a call is often the **prefill** — reading a long, *repeated* system prompt, tool definitions, or few-shot examples into context. Without caching, you pay the prefill FLOPs *every call*. With caching, the repeated prefix's keys and values are computed **once** and *reused*, so the second and later calls skip that prefill almost entirely.

That is where the "~10×" comes from: when a call is dominated by a long, repeated prefix (say 4,000 tokens of system prompt) plus a short completion (say 400), uncached you pay for all 4,400 tokens' prefill+decode, but cached you pay mostly for the 400-token completion — roughly **one tenth** of the work per call. \cite[Anthropic, Prompt caching]{promptcaching} is the production example: cached tokens are billed at a fraction of uncached ones, precisely because the prefill that would have been recomputed is not. The calculator above models this directly — slide the cached fraction and watch the bill fall by up to ~90% on the cached part.

The deeper point: caching is not a trick, it is a consequence of the two regimes. **Prefill is compute-bound and pay-once-able; decode is memory-bound and per-step.** Anything you can make *pay-once* (a repeated prefix) you should cache, because you are moving cost out of the per-call path and into a one-time one.
</div>

<div class="md">
### 7B on a laptop, or the API: fixed cost vs per-token cost

The last comparison is the one people get wrong. "Run it locally" and "call the API" are not the same cost shape:

* **The API is *per-token*.** You pay for what you use — zero when idle, high when busy. The marginal cost of a token is the price; there is no fixed cost. This is cheap for a **light, spiky** workload and expensive for a heavy, steady one (you keep paying per token forever).
* **Local is *fixed*.** You pay for the hardware (a GPU that holds a 7B model) once, and then tokens cost almost nothing in compute — the marginal cost is just electricity. This is expensive for a **light** workload (you bought a GPU to use 2% of the time) and cheap for a **heavy, steady** one (the fixed cost amortizes to nothing over millions of tokens).

They cross at a **breakeven**: local is better when your *steady* token volume is high enough that the hardware cost is recovered within your horizon; the API is better when your volume is light, spiky, or private-data-light. And there is a third axis the arithmetic ignores — **privacy**: local keeps the data on the machine, which is sometimes worth the worse economics. This is the [Running locally](running_locally.php) and [Inference optimization](inference_optimization.php) decision, made into a number.

> The economic layer is two numbers and one split. Training costs $6ND$; inference costs 2× active-params per token. Caching moves the pay-once prefill out of the per-call path; the active-vs-total gap is what sparsity buys; and fixed-versus-per-token is what "local or API" really means. None of it is about the technology being *worth* it — it is about the technology being *affordable*, which is a different question, and the one that decides what gets built.
</div>

<div class="mn-quiz" data-quiz="ai_economics"><script type="application/json">{"title": "The economic layer", "questions": [{"q": "The 6ND rule estimates…", "options": ["training compute in FLOPs: about 6 × parameters × training tokens", "the number of GPUs needed to train the model to convergence", "the inference cost for every single generated output token", "the accuracy the model will reach once the training run is complete"], "answer": 0, "explain": "About 2ND for the forward pass and 4ND for the backward pass."}, {"q": "For a mixture-of-experts model, inference cost per token scales with…", "options": ["the active parameters", "the total parameter count", "the number of experts", "the number of users"], "answer": 0, "explain": "Only the experts a token is routed to are computed."}, {"q": "Why can prompt caching save roughly 10×?", "options": ["A long shared prefix is prefilled once and reused for later requests", "It compresses the final generated answer before sending it back to you", "It skips the token-by-token decode phase for every response", "It runs the request on a smaller and cheaper model than usual"], "answer": 0, "explain": "Re-reading the same long system prompt or document is the expensive part."}, {"q": "When does running a 7B model on your own laptop beat an API?", "options": ["At high, steady usage — fixed hardware cost versus per-token fees", "Almost never, because the hardware always costs far more up front", "For every task, regardless of how often it is used", "Only when generating images rather than writing text"], "answer": 0, "explain": "Local inference has a fixed cost; APIs charge per token but need no hardware."}]}</script></div>
