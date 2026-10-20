<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Temperature & Sampling
description: Top-k, top-p, min-p, top-n, repetition penalty — every decoding strategy.
icon: &#127922;
part: 4
order: 8
color: sky
topics: architecture, statistics-i, statistics-ii
tags: math-heavy
-->

<div class="md">
Given a probability distribution over the next token, which one do you pick? This is the **decoding strategy**, and it controls the model's “personality”, focused and deterministic, or wild and creative. The frontier in 2025: many subtle techniques beyond temperature and top-$k$.

This chapter covers every common decoding method with its mathematical formulation and recommended use, grouped from the baseline distribution, through the candidate-set filters, to the diversity and search tricks and the practical settings that tie them together.
</div>

<div class="optional md" data-headline="Where the math comes from">
Three of the four quantities in this chapter, **Boltzmann distributions**, **entropy**, and **KL-divergence**, were born long before language models. They appear in the <a href="statistics_ii">Statistics II chapter</a> § Boltzmann Distributions, § Entropy, § KL Divergence. If softmax + temperature looks familiar from physics, that is because it *is* physics. The softmax with temperature $T$ is exactly the **Boltzmann distribution** (\cite[Boltzmann, 1877]{boltzmann}) over the token "energy levels" $E_i = -z_i$ (the logit, negated), written in dimensionless form by absorbing the Boltzmann constant into $T$: $\;P_i = e^{z_i/T} / \sum_j e^{z_j/T}$. So $T$ is not a knob we invented — it is a **temperature** in the thermodynamic sense. $T \to 0$ is the **ground state**: the system collapses onto the single lowest-energy, highest-probability token (greedy). $T \to \infty$ is the **infinite-temperature** limit, where every state is equally populated (uniform). Raising $T$ does not make the model "creative" in any vague sense; it lets higher-energy, rarer tokens be occupied at all, the way a hotter gas puts its particles into excited states. Sampling is thermodynamics in disguise.
</div>

<div class="md">
## The Baseline: Temperature and Greedy
</div>

<div class="md" data-mathlevel="50" data-optionaltitle="The Probability Distribution">
### The Probability Distribution

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
### Greedy Decoding

Always pick $\arg\max_i P(i)$. Deterministic, fast. Used in production for fact-retrieval tasks where creativity is unwanted.

Drawback: **repetition loops** and **mode collapse** (“the the the the...”).
</div>

<div class="md">
## Truncating the Candidate Set
</div>

<div class="md" data-mathlevel="55" data-optionaltitle="Top-k Sampling">
### Top-$k$ Sampling

Restrict to the $k$ tokens with highest probability, then renormalize (\cite[Fan et al., 2018]{fan2018topk}):

$$
\mathcal{V}_k = \{i : z_i \geq z_{(k)}\}, \quad P'(i) = \begin{cases} P(i) / Z & i \in \mathcal{V}_k \\ 0 & \text{otherwise} \end{cases}
$$

where $Z = \sum_{j \in \mathcal{V}_k} P(j)$.

* $k = 1$: greedy.
* $k = 50$: typical for chat.
* $k = 1000+$ for creative writing.

Drawback: $k$ is a fixed number, but the appropriate $k$ varies per context. Sometimes only 3 tokens have meaningful probability; sometimes 100.
</div>

<div class="md" data-mathlevel="55" data-optionaltitle="Top-p (Nucleus) Sampling">
### Top-$p$ (Nucleus) Sampling

Sample from the smallest set of tokens whose cumulative probability exceeds $p$ (\cite[Holtzman et al., 2020]{holtzman2020nucleus}):

$$
\mathcal{V}_p = \text{smallest set s.t. } \sum_{i \in \mathcal{V}_p} P(i) \geq p
$$

* $p = 0.9$: typical for chat (sample from top 90% of mass).
* $p = 0.95$: more diverse.
* $p = 0.5$: very focused.

This adapts the effective vocabulary size to the distribution. When the distribution is sharp (one token dominates), $\mathcal{V}_p$ is small; when flat, $\mathcal{V}_p$ is large.

Most production APIs default to **top-$p$ = 0.9 or 0.95**.
</div>

<div class="md" data-mathlevel="50" data-optionaltitle="Min-p Sampling">
### Min-$p$ Sampling

The new frontier method (\cite[Nguyen et al., 2025]{nguyen2025minp}), recommended by many open-source models (Qwen, Mistral):

* Choose $m = \max_i P(i)$ (the highest probability).
* Include all tokens with $P(i) \geq s \cdot m$ where $s \in [0, 1]$ is the min-$p$ parameter.

$$
\mathcal{V}_{\text{min-p}} = \{i : P(i) \geq s \cdot \max_j P(j)\}
$$

* $s = 0.1$: include any token within 10× of the max.
* $s = 0.05$: more inclusive.
* $s = 1.0$: greedy (only the top token qualifies). $s = 0.0$ switches the filter off (keeps every token).

Min-$p$ **scales with confidence**: when the model is sharp, few tokens qualify; when uncertain, more. Empirically outperforms top-$p$ on quality benchmarks.
</div>

<div class="md">
### Top-$n$ (Top-$N$) Sampling

A simpler variant: always include exactly the top $N$ tokens. Used in some open-source models.

* $N = 40$ for chat.

Less common than top-$p$ or min-$p$.
</div>

<div class="md">
### Tail-Free Sampling (TFS)

Discards tokens in the “tail” of the distribution where the second derivative of probability is small. Rarely used in production.
</div>

<div class="md">
### Eta ($\eta$) Sampling

Similar to min-$p$ but with a different criterion: cut off tokens with probability below an $\eta$-dependent threshold based on entropy. Generally less popular than min-$p$.
</div>

<div class="md">
### Try it: the Decoding Studio

Every method above is a different way of answering the same question: *which candidates are still allowed?* Below, a model has produced logits for the next word. Turn the temperature, switch the filters on and off, and sample. The faint bar behind each token is its probability after temperature; the bright bar is what is left after the filters cut the tail and the survivors are renormalized. Then switch to the factual prompt and notice how top-$k$ keeps nonsense while top-$p$ and min-$p$ shrink to a single word on their own.
</div>

<style>
#decoding-studio .ds-prompt {
	display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 8px;
	font-family: var(--mn-font-prose); font-size: 1.12rem; line-height: 1.5; color: var(--mn-heading);
}
#decoding-studio .ds-next {
	display: inline-block; min-width: 4.5ch; padding: 0 10px; border-radius: 8px;
	font-weight: 700; color: var(--mn-accent);
	background: color-mix(in srgb, var(--mn-accent) 14%, transparent);
	border-bottom: 2px solid var(--mn-accent);
	transition: background .3s ease;
}
#decoding-studio .ds-next.is-empty { color: var(--mn-text-muted); border-bottom-style: dashed; }
#decoding-studio .ds-historyrow { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; min-height: 24px; align-items: center; }
#decoding-studio .ds-hist {
	font-family: var(--mn-font-mono); font-size: .72rem; padding: 1px 8px; border-radius: 999px;
	border: 1px solid var(--mn-border); color: var(--mn-text-secondary);
}
#decoding-studio .ds-rows { position: relative; display: flex; flex-direction: column; gap: 3px; padding-right: 2px; }
#decoding-studio .ds-row {
	--h: 22px;
	display: grid; grid-template-columns: minmax(64px, 11ch) minmax(0, 1fr) 6ch 9ch;
	align-items: center; gap: 8px; min-height: var(--h);
	border-radius: 6px; transition: opacity .3s ease, background .3s ease;
}
#decoding-studio .ds-tok {
	font-family: var(--mn-font-mono); font-size: .8rem; font-weight: 600; color: var(--mn-heading);
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: right;
}
#decoding-studio .ds-track { position: relative; height: 16px; border-radius: 5px; background: color-mix(in srgb, var(--mn-text-muted) 10%, transparent); overflow: hidden; }
#decoding-studio .ds-ghost, #decoding-studio .ds-bar, #decoding-studio .ds-emp {
	position: absolute; left: 0; border-radius: 5px; width: 0;
	transition: width .45s cubic-bezier(.2, .8, .2, 1), opacity .3s ease;
}
#decoding-studio .ds-ghost { top: 0; bottom: 0; background: color-mix(in srgb, var(--mn-accent) 22%, transparent); }
#decoding-studio .ds-bar {
	top: 2px; bottom: 2px;
	background: linear-gradient(90deg, var(--mn-accent), var(--mn-sky));
	box-shadow: 0 0 12px -2px color-mix(in srgb, var(--mn-sky) 60%, transparent);
}
#decoding-studio .ds-emp { bottom: 0; height: 3px; background: var(--mn-coral); border-radius: 2px; }
#decoding-studio .ds-pct { font-size: .74rem; color: var(--mn-text-secondary); text-align: right; }
#decoding-studio .ds-tag { font-size: .68rem; font-weight: 600; color: var(--mn-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#decoding-studio .ds-tag[data-reason="top-k"] { color: var(--mn-coral); }
#decoding-studio .ds-tag[data-reason="top-p"] { color: var(--mn-rose); }
#decoding-studio .ds-tag[data-reason="min-p"] { color: var(--mn-sky); }
#decoding-studio .ds-row.is-cut { opacity: .45; }
#decoding-studio .ds-row.is-cut .ds-tok { text-decoration: line-through; text-decoration-color: color-mix(in srgb, var(--mn-text-muted) 70%, transparent); }
#decoding-studio .ds-row.is-pick { background: color-mix(in srgb, var(--mn-coral) 12%, transparent); }
#decoding-studio .ds-row.is-pick .ds-tok { color: var(--mn-coral); }
#decoding-studio .ds-row.is-flash { animation: ds-flash .7s ease-out; }
@keyframes ds-flash { 0% { background: color-mix(in srgb, var(--mn-coral) 45%, transparent); transform: scale(1.015); } 100% { transform: none; } }
#decoding-studio .ds-row.is-nucleus-end { box-shadow: 0 2px 0 0 var(--mn-rose); border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
#decoding-studio .ds-thr {
	position: absolute; top: -3px; bottom: -3px; width: 0; margin-left: -1px;
	border-left: 2px dotted var(--mn-sky); opacity: 0;
	transition: left .45s cubic-bezier(.2, .8, .2, 1), opacity .3s ease;
}
#decoding-studio .ds-controls { display: flex; flex-direction: column; gap: 12px; }
#decoding-studio .ds-section-label { font-size: .68rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--mn-text-muted); margin-bottom: 4px; }
#decoding-studio .ds-drawcount { font-size: .74rem; color: var(--mn-text-muted); min-height: 1.2em; margin-top: 6px; }
@container mnlab (max-width: 620px) {
	#decoding-studio .ds-row { grid-template-columns: minmax(56px, 10ch) minmax(0, 1fr) 6ch; }
	#decoding-studio .ds-tag { display: none; }
}
</style>

<div class="mnlab" id="decoding-studio" data-interactive>
	<div class="mnlab-head">
		<div>
			<div class="mnlab-kicker">Interactive lab</div>
			<div class="mnlab-title">Decoding Studio</div>
			<p class="mnlab-sub">One set of logits, four knobs. Watch which words survive — then let the dice decide.</p>
		</div>
		<div class="mnlab-chips" role="group" aria-label="Prompt">
			<button type="button" class="mnlab-chip" data-scenario="story" aria-pressed="true">Open story</button>
			<button type="button" class="mnlab-chip" data-scenario="fact" aria-pressed="false">Factual question</button>
		</div>
	</div>

	<div class="mnlab-well" style="margin-bottom: 16px;">
		<div class="ds-prompt"><span data-ds="prompt"></span> <span class="ds-next is-empty" data-ds="next" aria-live="polite">▁▁▁</span></div>
		<div class="ds-historyrow"><span class="mnlab-hint">Recent draws:</span><span data-ds="history" style="display:contents"></span></div>
	</div>

	<div class="ds-controls">
		<div class="mnlab-row" style="justify-content: space-between;">
			<div class="mnlab-chips" role="group" aria-label="Presets">
				<span class="ds-section-label" style="align-self:center; margin: 0 4px 0 0;">Presets</span>
				<button type="button" class="mnlab-chip" data-preset="greedy" aria-pressed="false">Greedy</button>
				<button type="button" class="mnlab-chip" data-preset="precise" aria-pressed="false">Precise</button>
				<button type="button" class="mnlab-chip" data-preset="chat" aria-pressed="false">Chat default</button>
				<button type="button" class="mnlab-chip" data-preset="creative" aria-pressed="false">Creative</button>
				<button type="button" class="mnlab-chip" data-preset="chaos" aria-pressed="false">Chaos</button>
			</div>
		</div>
		<div class="mnlab-grid mnlab-grid--2" style="gap: 6px 24px;">
			<label class="mnlab-ctrl">
				<span class="mnlab-ctrl-top"><span class="mnlab-label">Temperature T</span><span class="mnlab-val" data-ds="Tv">1.00</span></span>
				<input type="range" data-ds="T" min="0" max="2" step="0.05" value="1" aria-label="Temperature">
				<span class="mnlab-hint">0 = greedy · 1 = the model as trained · 2 = very flat</span>
			</label>
			<label class="mnlab-ctrl">
				<span class="mnlab-ctrl-top"><span class="mnlab-label">Top-k</span><span class="mnlab-val" data-ds="kv">off</span></span>
				<input type="range" data-ds="k" min="1" max="16" step="1" value="16" aria-label="Top-k">
				<span class="mnlab-hint">keep the k most likely tokens (far right = off)</span>
			</label>
			<label class="mnlab-ctrl">
				<span class="mnlab-ctrl-top"><span class="mnlab-label">Top-p (nucleus)</span><span class="mnlab-val" data-ds="pv">off</span></span>
				<input type="range" data-ds="p" min="0.05" max="1" step="0.01" value="1" aria-label="Top-p">
				<span class="mnlab-hint">smallest set whose probability adds up to p</span>
			</label>
			<label class="mnlab-ctrl">
				<span class="mnlab-ctrl-top"><span class="mnlab-label">Min-p</span><span class="mnlab-val" data-ds="mpv">off</span></span>
				<input type="range" data-ds="mp" min="0" max="0.5" step="0.01" value="0" aria-label="Min-p">
				<span class="mnlab-hint">drop tokens below s × (best token's probability)</span>
			</label>
		</div>
	</div>

	<div class="mnlab-well" style="margin-top: 14px;">
		<div class="mnlab-row" style="justify-content: space-between; margin-bottom: 12px;">
			<div class="ds-section-label" style="margin: 0;">Next-word candidates</div>
			<div class="mnlab-row">
				<button type="button" class="mnlab-btn" data-ds="sample">🎲 Sample next word</button>
				<button type="button" class="mnlab-btn mnlab-btn--ghost" data-ds="sample100" title="Draw 200 times">×200</button>
				<button type="button" class="mnlab-btn mnlab-btn--ghost" data-ds="reset" aria-label="Reset draws" title="Reset draws">↺</button>
			</div>
		</div>
		<div class="ds-rows" data-ds="rows"></div>
		<div class="ds-drawcount" data-ds="drawCount"></div>
		<div class="mnlab-legend" style="margin-top: 8px;">
			<span><i style="background: color-mix(in srgb, var(--mn-accent) 25%, transparent);"></i>after temperature</span>
			<span><i style="background: linear-gradient(90deg, var(--mn-accent), var(--mn-sky));"></i>after filters (renormalized)</span>
			<span><i style="background: var(--mn-coral); height: 3px;"></i>observed draws</span>
			<span><i style="background: var(--mn-rose); height: 2px;"></i>end of the top-p nucleus</span>
			<span><i style="border-left: 2px dotted var(--mn-sky); width: 2px; height: 12px; border-radius: 0;"></i>min-p threshold</span>
		</div>
	</div>

	<div class="mnlab-grid mnlab-grid--4" style="margin-top: 16px;">
		<div class="mnlab-stat"><span class="k">Candidates left</span><span class="v" data-ds="statKept">–</span></div>
		<div class="mnlab-stat"><span class="k">Mass cut away</span><span class="v" data-ds="statCut">–</span></div>
		<div class="mnlab-stat"><span class="k">Entropy</span><span class="v" data-ds="statH">–</span></div>
		<div class="mnlab-stat"><span class="k">Effective choices</span><span class="v" data-ds="statEff">–</span></div>
	</div>
	<div class="mnlab-note" data-ds="note" aria-live="polite"></div>
</div>

<div class="md">
## Anti-Repetition and Diversity
</div>

<div class="md" data-mathlevel="45" data-optionaltitle="Repetition Penalty">
### Repetition Penalty

Reduce the logits of tokens that have already appeared in the context (\cite[Keskar et al., 2019]{keskar2019ctrl}):

$$
z_i' = \begin{cases} z_i / \theta & \text{if } i \in \text{context} \\ z_i & \text{if } i \notin \text{context} \end{cases}
$$

* $\theta = 1.0$: no penalty.
* $\theta = 1.1$: mild penalty.
* $\theta = 1.3$: strong penalty.

Useful for chat where the model might otherwise loop. **Frequency penalty** (proportional to count) and **presence penalty** (binary) are common variants.
</div>

<div class="md">
### DRY (Don't Repeat Yourself) Sampling

A smarter repetition penalty (Cohere, 2023) that detects repeated n-grams and penalizes them only when they would create a degenerate loop:

* Match n-grams of length $n \geq n_{\text{min}}$ (e.g., 8).
* If the most recent n-gram matches an earlier one and would continue the repetition, apply penalty.

More nuanced than the basic repetition penalty. Used in Cohere's Command-R and recommended for long-context generation.
</div>

<div class="md">
### XTC (Exclude Top Choices)

A 2024 technique: randomly exclude the top token from sampling with some probability. Forces the model to use less-likely words. Useful for breaking out of repetitive patterns in creative writing.

* $p_{\text{exclude}} = 0.1$: 10% of the time, the top token is excluded.
</div>

<div class="md" data-mathlevel="55" data-optionaltitle="Contrastive Search">
### Contrastive Search (Su & Collier, 2022)

A **deterministic** decoding strategy that picks the token maximizing:

$$
\text{score}(i) = (1 - \alpha) \cdot \log P(i) - \alpha \cdot \max_{j \in \text{context}} \text{sim}(\mathbf{h}_i, \mathbf{h}_j)
$$

where $\mathbf{h}_i$ is the token's hidden state and $\alpha$ controls the degeneration penalty. Produces high-quality, **non-repetitive** output without randomness. Used in some summarization systems.
</div>

<div class="md">
### mirostat

A sampling scheme (\cite[Basu et al., 2020]{basu2020mirostat}) that **targets a fixed perplexity** during generation. The model adjusts its sampling to maintain target surprise:

* Target perplexity $\tau$ (e.g., $\tau = 5$).
* After each generated token, compute current perplexity.
* Adjust $k$ (top-$k$) to drive perplexity toward $\tau$.

Produces output with consistent information density. Used by some LLM writers for creative prose.
</div>

<div class="md">
## Search and Speculation

### Beam Search

Maintain the top $B$ partial sequences at each step; expand all of them; keep the top $B$. Used in machine translation; rarely in modern LLM chat.

Drawbacks: tends to produce generic, “averaged” outputs in open-ended generation.
</div>

<div class="md" data-mathlevel="60" data-optionaltitle="Speculative Sampling">
### Speculative Sampling

A generalization of speculative decoding: the draft model samples tokens probabilistically, the target model verifies, and corrections are sampled from the target's adjusted distribution:

$$
\begin{aligned}
&\text{accept } x \text{ with probability } \min\!\left(1,\, \frac{P_{\text{target}}(x)}{P_{\text{draft}}(x)}\right); \\[4pt]
&\text{on rejection, resample from } \frac{\max\!\left(0,\, P_{\text{target}}(x) - P_{\text{draft}}(x)\right)}{\sum_{x'} \max\!\left(0,\, P_{\text{target}}(x') - P_{\text{draft}}(x')\right)}
\end{aligned}
$$

This guarantees the output distribution exactly matches the target model's distribution, while achieving speedup.
</div>

<div class="md">
## Choosing and Tuning

### Recommended Settings (2025)

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
### Dynamic Temperature

A 2024 idea: adjust temperature based on the entropy of the predicted distribution. When the model is confident (low entropy), lower temperature; when uncertain (high entropy), raise it. The intuition: respect the model's confidence rather than always applying the same temperature.

Implementations: **entropy-aware sampling** (\cite[Wang et al., 2024]{wang2024entropy}), **DynTemp**, and proprietary variants in vLLM and llama.cpp.

Not yet standardized but promising.
</div>

<div class="md">
### Practical Tips

* **Reproducibility**: set temperature = 0 (or very low) for reproducible outputs. Some APIs accept `seed`.
* **For evals**: temperature = 0 + greedy. Otherwise the eval is noisy.
* **For chat**: temperature 0.7–1.0, top-$p$ 0.9. Different per task.
* **For code**: low temperature, no top-$p$, possibly beam search.
* **For batch inference**: deterministic, greedy.

A common mistake: using temperature 1.0 with top-$p$ 0.9 AND min-$p$ 0.05. These compound; the effective sampling becomes very restricted. **Pick one filter method** unless you know what you're doing.
</div>
