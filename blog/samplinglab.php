<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Temperature & Sampling
description: Top-k, top-p, min-p, top-n, repetition penalty — every decoding strategy.
icon: &#127922;
part: 4
order: 23
color: sky
-->

<div class="md">
Given a probability distribution over the next token, which one do you pick? This is the **decoding strategy**, and it controls the model's "personality" — focused and deterministic, or wild and creative. The frontier in 2025: many subtle techniques beyond temperature and top-$k$.

This chapter covers every common decoding method with its mathematical formulation and recommended use.
</div>

<div class="md">
## The Probability Distribution

After the LLM produces logits $\mathbf{z} \in \mathbb{R}^{|V|}$ for the next token, softmax gives a probability distribution:

$$
P(\text{token } i) = \frac{e^{z_i / T}}{\sum_j e^{z_j / T}}
$$

where $T$ is **temperature**:

* $T \to 0$: argmax (greedy). Always picks the most likely token.
* $T = 1$: native distribution.
* $T \to \infty$: uniform distribution (random).
* $T > 1$: flatter distribution (more diverse, more random).
* $T < 1$: sharper distribution (more focused).

But that's only the beginning. Most modern systems use **additional filters** on top of temperature.
</div>

<div class="md">
## Greedy Decoding

Always pick $\arg\max_i P(i)$. Deterministic, fast. Used in production for fact-retrieval tasks where creativity is unwanted.

Drawback: **repetition loops** and **mode collapse** ("the the the the...").
</div>

<div class="md">
## Top-$k$ Sampling \cite[Fan et al., 2018]{fan2018topk}

Restrict to the $k$ tokens with highest probability, then renormalize:

$$
\mathcal{V}_k = \{i : z_i \geq z_{(k)}\}, \quad P'(i) = \begin{cases} P(i) / Z & i \in \mathcal{V}_k \\ 0 & \text{otherwise} \end{cases}
$$

where $Z = \sum_{j \in \mathcal{V}_k} P(j)$.

* $k = 1$: greedy.
* $k = 50$: typical for chat.
* $k = 1000+$ for creative writing.

Drawback: $k$ is a fixed number, but the appropriate $k$ varies per context. Sometimes only 3 tokens have meaningful probability; sometimes 100.
</div>

<div class="md">
## Top-$p$ (Nucleus) Sampling \cite[Holtzman et al., 2020]{holtzman2020nucleus}

Sample from the smallest set of tokens whose cumulative probability exceeds $p$:

$$
\mathcal{V}_p = \text{smallest set s.t. } \sum_{i \in \mathcal{V}_p} P(i) \geq p
$$

* $p = 0.9$: typical for chat (sample from top 90% of mass).
* $p = 0.95$: more diverse.
* $p = 0.5$: very focused.

This adapts the effective vocabulary size to the distribution. When the distribution is sharp (one token dominates), $\mathcal{V}_p$ is small; when flat, $\mathcal{V}_p$ is large.

Most production APIs default to **top-$p$ = 0.9 or 0.95**.
</div>

<div class="md">
## Min-$p$ Sampling \cite[Nguyen et al., 2025]{nguyen2025minp}

The new frontier method, recommended by many open-source models (Qwen, Mistral):

* Choose $m = \max_i P(i)$ (the highest probability).
* Include all tokens with $P(i) \geq s \cdot m$ where $s \in [0, 1]$ is the min-$p$ parameter.

$$
\mathcal{V}_{\text{min-p}} = \{i : P(i) \geq s \cdot \max_j P(j)\}
$$

* $s = 0.1$: include any token within 10× of the max.
* $s = 0.05$: more inclusive.
* $s = 0.0$: greedy.

Min-$p$ **scales with confidence**: when the model is sharp, few tokens qualify; when uncertain, more. Empirically outperforms top-$p$ on quality benchmarks.
</div>

<div class="md">
## Top-$n$ (Top-$N$) Sampling

A simpler variant: always include exactly the top $N$ tokens. Used in some open-source models.

* $N = 40$ for chat.

Less common than top-$p$ or min-$p$.
</div>

<div class="md">
## Tail-Free Sampling (TFS)

Discards tokens in the "tail" of the distribution where the second derivative of probability is small. Rarely used in production.
</div>

<div class="md">
## Eta ($\eta$) Sampling

Similar to min-$p$ but with a different criterion: cut off tokens with probability below an $\eta$-dependent threshold based on entropy. Generally less popular than min-$p$.
</div>

<div class="md">
## Repetition Penalty \cite[Keskar et al., 2019]{keskar2019ctrl}

Reduce the logits of tokens that have already appeared in the context:

$$
z_i' = \begin{cases} z_i / \theta & \text{if } i \in \text{context} \\ z_i \cdot \theta & \text{if } i \notin \text{context} \end{cases}
$$

* $\theta = 1.0$: no penalty.
* $\theta = 1.1$: mild penalty.
* $\theta = 1.3$: strong penalty.

Useful for chat where the model might otherwise loop. **Frequency penalty** (proportional to count) and **presence penalty** (binary) are common variants.
</div>

<div class="md">
## DRY (Don't Repeat Yourself) Sampling

A smarter repetition penalty (Cohere, 2023) that detects repeated n-grams and penalizes them only when they would create a degenerate loop:

* Match n-grams of length $n \geq n_{\text{min}}$ (e.g., 8).
* If the most recent n-gram matches an earlier one and would continue the repetition, apply penalty.

More nuanced than the basic repetition penalty. Used in Cohere's Command-R and recommended for long-context generation.
</div>

<div class="md">
## XTC (Exclude Top Choices)

A 2024 technique: randomly exclude the top token from sampling with some probability. Forces the model to use less-likely words. Useful for breaking out of repetitive patterns in creative writing.

* $p_{\text{exclude}} = 0.1$: 10% of the time, the top token is excluded.
</div>

<div class="md">
## Contrastive Search (Su & Collier, 2022)

A **deterministic** decoding strategy that picks the token maximizing:

$$
\text{score}(i) = (1 - \alpha) \cdot P(i) - \alpha \cdot \max_{j \in \text{context}} \text{sim}(\mathbf{h}_i, \mathbf{h}_j)
$$

where $\mathbf{h}_i$ is the token's hidden state and $\alpha$ controls the degeneration penalty. Produces high-quality, **non-repetitive** output without randomness. Used in some summarization systems.
</div>

<div class="md">
## Beam Search

Maintain the top $B$ partial sequences at each step; expand all of them; keep the top $B$. Used in machine translation; rarely in modern LLM chat.

Drawbacks: tends to produce generic, "averaged" outputs in open-ended generation.
</div>

<div class="md">
## mirostat \cite[Basu et al., 2020]{basu2020mirostat}

A sampling scheme that **targets a fixed perplexity** during generation. The model adjusts its sampling to maintain target surprise:

* Target perplexity $\tau$ (e.g., $\tau = 5$).
* After each generated token, compute current perplexity.
* Adjust $k$ (top-$k$) to drive perplexity toward $\tau$.

Produces output with consistent information density. Used by some LLM writers for creative prose.
</div>

<div class="md">
## Speculative Sampling

A generalization of speculative decoding: the draft model samples tokens probabilistically, the target model verifies, and corrections are sampled from the target's adjusted distribution:

$$
P_{\text{final}}(x) = \frac{\min(P_{\text{target}}(x),\, \alpha P_{\text{draft}}(x))}{\sum_x \min(P_{\text{target}}(x),\, \alpha P_{\text{draft}}(x))} + (1 - \alpha)\, P_{\text{target}}(x)
$$

This guarantees the output distribution exactly matches the target model's distribution, while achieving speedup.
</div>

<div class="md">
## Recommended Settings (2025)

| Use case | Temperature | Top-$p$ | Min-$p$ | Repetition penalty |
|----------|-------------|---------|---------|-------------------|
| **Chat (factual)** | 0.7 | 0.9 | 0.0 | 1.1 |
| **Chat (creative)** | 1.0 | 0.95 | 0.05 | 1.1 |
| **Code generation** | 0.2 | 0.95 | 0.0 | 1.0 |
| **Math/reasoning** | 0.0 | 1.0 | 0.0 | 1.0 |
| **Translation** | 0.3 | 0.9 | 0.0 | 1.0 |
| **Creative writing** | 1.2 | 0.95 | 0.1 | 1.2 + DRY |
| **Summarization** | 0.5 | 0.9 | 0.0 | 1.1 |

**The frontier in 2025**: most open-source models (Qwen, DeepSeek, Mistral) default to **temperature 0.7 + min-$p$ 0.05**. Closed APIs (OpenAI, Anthropic) typically default to **temperature 1.0 + top-$p$ 0.95** (though Anthropic recommends temperature 1.0 with no top-$p$).
</div>

<div class="md">
## Dynamic Temperature

A 2024 idea: adjust temperature based on the entropy of the predicted distribution. When the model is confident (low entropy), lower temperature; when uncertain (high entropy), raise it. The intuition: respect the model's confidence rather than always applying the same temperature.

Implementations: **entropy-aware sampling** \cite[Wang et al., 2024]{wang2024entropy}, **DynTemp**, and proprietary variants in vLLM and llama.cpp.

Not yet standardized but promising.
</div>

<div class="md">
## Practical Tips

* **Reproducibility**: set temperature = 0 (or very low) for reproducible outputs. Some APIs accept `seed`.
* **For evals**: temperature = 0 + greedy. Otherwise the eval is noisy.
* **For chat**: temperature 0.7–1.0, top-$p$ 0.9. Different per task.
* **For code**: low temperature, no top-$p$, possibly beam search.
* **For batch inference**: deterministic, greedy.

A common mistake: using temperature 1.0 with top-$p$ 0.9 AND min-$p$ 0.05. These compound; the effective sampling becomes very restricted. **Pick one filter method** unless you know what you're doing.
</div>

<script>
// Visualization: top-k vs top-p vs min-p on a sample distribution
async function loadSamplingLabModule() {
	updateLoadingStatus("Loading section about Temperature & Sampling...");

	const container = document.getElementById('sampling-viz');
	if (!container) return;
	container.innerHTML = `
		<div style="background: var(--mn-surface); padding: 20px; border-radius: 12px; border: 1px solid var(--mn-border); margin-bottom: 20px;">
			<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
				<label><b>Temperature</b> <span id="sl-temp">1.0</span><br><input type="range" id="sl-temp-in" min="0.1" max="2.0" step="0.1" value="1.0"></label>
				<label><b>Top-p</b> <span id="sl-topp">0.9</span><br><input type="range" id="sl-topp-in" min="0.1" max="1.0" step="0.05" value="0.9"></label>
				<label><b>Min-p</b> <span id="sl-minp">0.0</span><br><input type="range" id="sl-minp-in" min="0.0" max="0.5" step="0.05" value="0.0"></label>
			</div>
			<div id="sl-plot" style="height: 350px;"></div>
		</div>
	`;

	const tokens = ['the', 'a', 'one', 'his', 'my', 'her', 'their', 'our', 'some', 'any', 'no', 'every', 'each', 'this', 'that'];
	const logitsRaw = [3.2, 2.1, 1.5, 0.8, 0.6, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05, 0.0, -0.1, -0.2];

	function render() {
		const T = parseFloat(document.getElementById('sl-temp-in').value);
		const p = parseFloat(document.getElementById('sl-topp-in').value);
		const mp = parseFloat(document.getElementById('sl-minp-in').value);

		document.getElementById('sl-temp').textContent = T.toFixed(1);
		document.getElementById('sl-topp').textContent = p.toFixed(2);
		document.getElementById('sl-minp').textContent = mp.toFixed(2);

		// Apply temperature
		const probs = logitsRaw.map(z => Math.exp(z / T));
		const Z = probs.reduce((a, b) => a + b, 0);
		const norm = probs.map(p => p / Z);

		// Sort by probability
		const sorted = tokens.map((t, i) => ({ token: t, p: norm[i] }))
			.sort((a, b) => b.p - a.p);
		const cumsum = [];
		sorted.reduce((s, x, i) => cumsum[i] = s + x.p, 0);

		const maxP = sorted[0].p;

		// Apply filters
		const filtered = sorted.map((x, i) => {
			const inTopP = cumsum[i] <= p;
			const inMinP = x.p >= mp * maxP;
			return { ...x, inTopP, inMinP, sampled: inTopP && inMinP };
		});

		const colors = filtered.map(x => {
			if (!x.inMinP) return '#94a3b8';  // excluded by min-p
			if (!x.inTopP) return '#94a3b8';
			return '#22c55e';
		});

		Plotly.newPlot('sl-plot', [{
			x: filtered.map(x => x.token), y: filtered.map(x => x.p * 100),
			type: 'bar', marker: { color: colors },
			text: filtered.map(x => (x.p * 100).toFixed(1) + '%'), textposition: 'outside'
		}], {
			title: { text: 'Decoding filter (green = sampled, gray = excluded)', font: { size: 13 } },
			xaxis: { title: 'next-token candidates' },
			yaxis: { title: 'probability (%)' },
			margin: { t: 50, b: 70, l: 60, r: 20 },
			paper_bgcolor: 'rgba(0,0,0,0)',
			plot_bgcolor: 'rgba(0,0,0,0)'
		}, { responsive: true });
	}

	['sl-temp-in', 'sl-topp-in', 'sl-minp-in'].forEach(id => {
		document.getElementById(id).addEventListener('input', render);
	});

	render();
}

async function loadTemperatureModule() {
	// Compatibility alias for existing index
	return loadSamplingLabModule();
}
</script>
