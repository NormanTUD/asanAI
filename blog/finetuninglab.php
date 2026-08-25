<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Fine-Tuning & Post-Training
description: SFT, RLHF, DPO, KTO, GRPO, and the modern alignment stack from internet to assistant.
icon: &#127912;
part: 5
order: 27
color: rose
topics: programming, architecture, training
-->

<div class="md">
A pretrained LLM is a “loud internet simulator”: it produces plausible text but doesn't follow instructions, refuses harmful requests, or engage in dialogue. The path from raw internet text to a useful assistant runs through a series of post-training stages. This chapter walks through the modern pipeline: **SFT → DPO/KTO/GRPO → RLHF (PPO) refinement → reasoning RL**, with the math behind each.

The trend in 2024–2025: most alignment work has moved away from RLHF toward **DPO-family** methods that are simpler, more stable, and don't require a separate reward model.
</div>

<div class="md">
## Stage 0: Pretraining (recap)

The base model is trained on the next-token-prediction objective (see the Intuition chapter) over ~10T tokens of web text. The result is a model that completes sentences in the style of its training data, but does not behave as an assistant.

Stage 1: **Supervised Fine-Tuning (SFT)** teaches it to follow instructions.
Stage 2: **Preference optimization** aligns its outputs with human values.
Stage 3: **Reasoning RL** (optional) teaches it to think longer on hard problems.

The total post-training cost is typically **1–10% of pretraining** but produces most of the perceived improvement in helpfulness.
</div>

<div class="md">
## Stage 1: Supervised Fine-Tuning (SFT)

SFT trains the base model on **instruction–response pairs**:

```json
{"instruction": "What is the capital of France?", "response": "The capital of France is Paris."}
```

The loss is the standard cross-entropy on the response tokens (the instruction tokens contribute zero loss):

$$
\mathcal{L}_{\text{SFT}}(\theta) = -\sum_{(x, y) \in \mathcal{D}} \sum_{t=1}^{|y|} \log \pi_\theta(y_t \mid x, y_{<t})
$$

where $x$ is the instruction and $y$ is the response.

**Data sources**:

* **Human-written** (highest quality): OpenAI's early InstructGPT used ~13K human-written examples.
* **Distilled from stronger models** (scalable): Self-instruct, WizardLM, Alpaca. Use GPT-4 to generate 100K–1M examples.
* **Synthetic** (cheap, controllable): Constitutional AI, Evol-Instruct, Magpie.

A typical 2025 SFT dataset: 100K–1M examples. Llama 3 used ~10M SFT examples.

**Key insights**:

* **Data quality > quantity**: 10K carefully curated examples beat 1M noisy ones.
* **Diversity matters**: instruction-following, code, math, multilingual, refusal, formatting.
* **Format**: ChatML, Alpaca, ShareGPT — pick one and stick to it.
* **Multi-turn**: include conversations, not just single Q&A.
</div>

<div id="sft-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## Stage 2: Reward Modeling (for RLHF)

For PPO-based RLHF, you need a **reward model** (RM). Collect human preferences over pairs of model outputs, then train a classifier:

$$
\mathcal{L}_{\text{RM}}(\phi) = -\mathbb{E}_{(x, y_w, y_l) \sim \mathcal{D}}\!\left[\log \sigma\!\left(R_\phi(x, y_w) - R_\phi(x, y_l)\right)\right]
$$

where $y_w$ is the human-preferred (winner) response and $y_l$ the loser.

A 2025 RM is typically a 7B–70B language model with a **single scalar output head**. It is trained on **100K–1M preference pairs**.

**Multi-dimensional rewards**: production RMs score multiple axes — helpfulness, harmlessness, factuality, style. The final reward is a weighted sum:

$$
R(x, y) = \sum_{i} w_i R_i(x, y)
$$

**Reward hacking** (see the Reinforcement Learning chapter) is the constant danger: a sufficiently good optimizer will find ways to maximize reward without improving quality. Defenses: KL penalty, ensemble of RMs, process supervision.
</div>

<div class="md">
## Stage 3a: RLHF with PPO

The InstructGPT pipeline \cite[Ouyang et al., 2022]{ouyang2022instructgpt}:

$$
\mathcal{L}_{\text{PPO}}(\theta) = -\mathbb{E}_{(x, y) \sim \pi_\theta}\!\Big[\,R_\phi(x, y) - \beta\, \text{KL}\!\big(\pi_\theta(y \mid x) \,\|\, \pi_{\text{ref}}(y \mid x)\big)\Big]
$$

Where $\pi_{\text{ref}}$ is the SFT model (frozen reference). The KL term prevents the policy from drifting too far. Typical $\beta$ values: $0.05$–$0.2$.

The PPO loss includes three components in practice:

$$
\mathcal{L} = -\mathbb{E}\!\left[\frac{\pi_\theta(a_t \mid s_t)}{\pi_{\theta_{\text{old}}}(a_t \mid s_t)} \hat A_t\right] + \beta \text{KL} + \gamma \text{(value loss)} + \delta \text{(entropy bonus)}
$$

**Why PPO is hard**:

* Four models in memory simultaneously (policy, reference, reward, value).
* Unstable; requires careful tuning.
* Memory-hungry: a 70B PPO setup needs ~16 H100s.
* Slow: rollouts are sequential.

By 2025, most frontier labs use PPO **only** for the final "alignment tax" refinement; primary alignment is now done with DPO-family methods.
</div>

<div class="md">
## Stage 3b: DPO and the Preference Optimization Family

DPO \cite[Rafailov et al., 2023]{rafailov2023dpo} showed that the RLHF objective has a closed-form solution. The implicit reward is:

$$
R(x, y) = \beta \log \frac{\pi^*(y \mid x)}{\pi_{\text{ref}}(y \mid x)} + \beta \log Z(x)
$$

Substituting into the Bradley-Terry loss gives:

$$
\mathcal{L}_{\text{DPO}}(\theta) = -\mathbb{E}_{(x, y_w, y_l)}\!\left[\log \sigma\!\left(\beta \log \frac{\pi_\theta(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \beta \log \frac{\pi_\theta(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)}\right)\right]
$$

**No reward model. No RL. No rollouts.** Just supervised learning on (prompt, winner, loser) triples.

DPO matches PPO on alignment benchmarks while being 5–10× simpler to implement. Most open-source fine-tunes (Llama-3-Instruct, Qwen-Instruct, Mistral-Instruct) use DPO or a variant.
</div>

<div id="dpo-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
### DPO Variants

| Method | Key change | Pros | Cons |
|--------|-----------|------|------|
| **DPO** | Bradley-Terry from log-ratio | Simple, no RM | Overfits on long responses |
| **IPO** | $\sigma^{-1}$ regularizer instead of $\log \sigma$ | Robust to deterministic preferences | Slightly weaker on standard benchmarks |
| **KTO** | Kahneman-Tversky utility; binary good/bad labels | Uses cheaper binary feedback | Less sample-efficient |
| **ORPO** | Odds-ratio penalty on SFT loss | Combines SFT + preference in one loss | Newer, less battle-tested |
| **SimPO** | Length-normalized log-prob, no reference | Reference-free | Quality slightly behind DPO |
| **Cal-DPO** | Calibrated DPO with length normalization | Best of both worlds | More complex |

The choice in 2025: **DPO with length normalization** or **SimPO** for most cases.
</div>

<div class="md">
## Stage 4: GRPO for Reasoning

GRPO (Group Relative Policy Optimization) is the breakthrough that enabled DeepSeek-R1's reasoning training (see the Reasoning chapter). It combines:

* **Group sampling**: for each prompt, sample $G$ candidate responses from the current policy.
* **Verifiable reward**: for math, the reward is binary — the answer is correct or not. For code, it's test pass/fail.
* **Group-relative advantage**: $A_i = (r_i - \mu_G) / \sigma_G$ where $\mu_G, \sigma_G$ are the group's mean and std.
* **No critic**: the group statistics serve as the baseline.

GRPO has been used to train DeepSeek-R1, Qwen-QwQ, and others. It produces emergent long chain-of-thought, self-correction, and backtracking behavior.

The training loop:

```
for each prompt x:
    sample G responses {y_1, ..., y_G} from π_θ
    score each: r_i = verifier(y_i)
    compute advantages A_i = (r_i - mean(r)) / std(r)
    update π_θ with PPO-style objective using A_i
```

The reward is typically a combination of:

* **Correctness** (verifier-based): 1.0 if correct, 0 otherwise.
* **Format**: bonus for proper answer formatting.
* **Length penalty**: discourage very long or very short responses.
* **Language consistency**: stay in the same language as the prompt.
</div>

<div id="grpo-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## Stage 5: Online RL and Iterative DPO

A 2024 frontier-lab pattern:

1. **Sample** multiple candidate responses for each prompt using the current policy.
2. **Judge** using a strong model (or LLM-as-judge), pick winner and loser.
3. **Train** the policy with DPO on these on-policy preferences.
4. **Repeat** with the updated policy.

This iterative DPO produces stronger alignment than offline DPO (where preferences are static). It is the standard for state-of-the-art open-source models.
</div>

<div class="md">
## LoRA and Parameter-Efficient Fine-Tuning

Full fine-tuning of a 70B model requires ~1 TB of GPU memory (params + grads + optimizer). **Parameter-Efficient Fine-Tuning (PEFT)** methods train only a tiny fraction of parameters:

### LoRA (Low-Rank Adaptation)

Freeze the original weights $W \in \mathbb{R}^{d \times k}$ and train low-rank updates $\Delta W = BA$ where $B \in \mathbb{R}^{d \times r}$, $A \in \mathbb{R}^{r \times k}$, $r \ll \min(d, k)$:

$$
W' = W + \alpha \cdot BA
$$

With $r = 16$ on a 4096×4096 weight matrix, LoRA adds ~131K parameters (0.78% of the original).

### QLoRA \cite[Dettmers et al., 2023]{dettmers2023qlora}

Combines 4-bit quantization of the base model with LoRA adapters in fp16. A 70B QLoRA fine-tune fits on a single 48 GB GPU.

### Other PEFT Methods

* **Adapters** \cite[Houlsby et al., 2019]{houlsby2019adapters}: small bottleneck layers inserted between Transformer blocks.
* **Prompt tuning** \cite[Lester et al., 2021]{lester2021prompttuning}: learnable soft prompts prepended to inputs.
* **IA³** \cite[Liu et al., 2022]{liu2022ia3}: learnable scaling vectors on attention and FFN.
* **DoRA** \cite[Liu et al., 2024]{liu2024dora}: decomposed magnitude and direction updates, often outperforms LoRA at the same rank.
</div>

<div id="lora-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## Practical Fine-Tuning Recipe

For a 7B–13B model with QLoRA on a single consumer GPU (24 GB):

```python
from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM, BitsAndBytesConfig
import torch

# 4-bit base model
bnb = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
                          bnb_4bit_compute_dtype=torch.bfloat16)
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.1-8B",
                                              quantization_config=bnb)

# LoRA adapter
lora = LoraConfig(r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"],
                   lora_dropout=0.05, task_type="CAUSAL_LM")
model = get_peft_model(model, lora)
model.print_trainable_parameters()  # ~0.1% of params

# Train
trainer = Trainer(model=model, args=TrainingArguments(...), train_dataset=ds)
trainer.train()
```

Merge the adapter back:

```python
merged = model.merge_and_unload()
merged.save_pretrained("my-fine-tuned-model")
```

For DPO:

```python
from trl import DPOTrainer, DPOConfig

trainer = DPOTrainer(
    model=model,
    ref_model=None,  # uses LoRA-disabled copy automatically
    args=DPOConfig(output_dir="dpo-out", beta=0.1, ...),
    train_dataset=preference_dataset,
    tokenizer=tokenizer
)
trainer.train()
```

Training time: ~6 hours for a 7B model with QLoRA on 10K examples. Cost: < $5 of compute on a rented H100.
</div>

<div class="md">
## When to Fine-Tune (and When Not To)

Fine-tuning is the right tool when:

* You need a **specific style, tone, or format** consistently across responses.
* The model's base behavior is **inappropriate** for your domain (e.g., medical).
* You have **proprietary data** that the model should learn from.
* **Latency** matters and you want a smaller fine-tuned model that beats a larger prompted one.

Fine-tuning is the wrong tool when:

* You need **real-time knowledge**, use RAG instead.
* The behavior you want is **achievable via prompting**, much cheaper.
* You don't have **at least 1K high-quality examples**, quality data is the bottleneck.
* The model needs to **generalize** to situations not in your data, prompts generalize better.

Rule of thumb: **prompt first, RAG second, fine-tune third**. Fine-tuning is a significant engineering investment; do it only after the lower-cost options are exhausted.
</div>

<div class="md">
## Safety-Critical Post-Training

For models that will be deployed widely:

1. **Red-teaming**: hundreds of adversarial users try to elicit bad behavior. Their discoveries go into training.
2. **Refusal training**: explicit examples of “this prompt, refuse this way” pairs.
3. **Jailbreak resistance**: train against known jailbreak patterns (DAN, roleplay exploits, encoding tricks).
4. **Constitutional AI**: self-critique against written principles.
5. **Debate / scalable oversight**: a stronger model critiques a weaker one's outputs.
6. **Robustness evaluation**: test against held-out adversarial prompts monthly.

A frontier model in 2025 typically has **multiple post-training stages** with different objectives: helpful SFT, harmless SFT, helpful DPO, harmless DPO, reasoning RL, and final safety refinement.
</div>

<div class="md">
## The Modern Frontier Pipeline

The state-of-the-art pipeline for a 2025 frontier model:

```
1. Pretrain on 10T+ tokens (foundation)
2. SFT on 1-10M instruction-response pairs (instruction following)
3. Online DPO / RLHF on 100K-1M preferences (alignment)
4. Reasoning RL (GRPO) on math/code/science (deep thinking)
5. Safety SFT + RLHF (refusal, jailbreak resistance)
6. Constitutional AI pass (self-critique against principles)
7. Domain-specific fine-tunes (specialized variants)
```

Total cost of post-training: ~$5–30M for a frontier model (10–30% of training cost). Produces most of the perceived improvement.

For practitioners: skip stages 4–6 unless you're training a frontier model. SFT + DPO is enough for most applications.
</div>

<script>
// SFT loss curve
(function() {
	const c = document.getElementById('sft-viz');
	if (!c) return;

	const steps = Array.from({length: 50}, (_, i) => (i + 1) * 100);
	const sft = steps.map(s => 1.5 * Math.exp(-s / 3000) + 0.4);
	const dpo = steps.map(s => 0.6 * Math.exp(-s / 4000) + 0.15);

	Plotly.newPlot('sft-viz', [
		{ x: steps, y: sft, mode: 'lines', name: 'SFT loss', line: { color: '#3b82f6', width: 2.5 } },
		{ x: steps, y: dpo, mode: 'lines', name: 'DPO loss (after SFT)', line: { color: '#22c55e', width: 2.5 } }
	], {
		title: { text: 'Typical fine-tuning loss curves', font: { size: 13 } },
		xaxis: { title: 'training step' },
		yaxis: { title: 'loss' },
		margin: { t: 50, b: 50, l: 60, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		legend: { x: 0.65, y: 0.95 }
	}, { responsive: true });
})();

// DPO loss landscape
(function() {
	const c = document.getElementById('dpo-viz');
	if (!c) return;

	const N = 30;
	const x = Array.from({length: N}, (_, i) => (i - N/2) * 0.15);
	const y = Array.from({length: N}, (_, i) => (i - N/2) * 0.15);
	const z = [];
	for (let i = 0; i < N; i++) {
		const row = [];
		for (let j = 0; j < N; j++) {
			const ratio = Math.exp(x[i] - y[j]);
			row.push(-Math.log(1 / (1 + 1 / ratio)));
		}
		z.push(row);
	}

	Plotly.newPlot('dpo-viz', [{
		z, x, y, type: 'heatmap',
		colorscale: [[0, '#fef3c7'], [0.5, '#3b82f6'], [1, '#1e3a8a']],
		colorbar: { title: 'L_DPO' }
	}], {
		title: { text: 'DPO loss landscape (lower = better)', font: { size: 13 } },
		xaxis: { title: 'log π(y_winner)' },
		yaxis: { title: 'log π(y_loser)', scaleanchor: 'x' },
		margin: { t: 50, b: 50, l: 60, r: 30 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)'
	}, { responsive: true });
})();

// GRPO advantage distribution
(function() {
	const c = document.getElementById('grpo-viz');
	if (!c) return;

	const rewards = Array.from({length: 16}, (_, i) => Math.random());
	const mean = rewards.reduce((a, b) => a + b) / rewards.length;
	const std = Math.sqrt(rewards.reduce((s, r) => s + (r - mean) ** 2, 0) / rewards.length);
	const advantages = rewards.map(r => (r - mean) / std);
	const colors = rewards.map(r => r >= 0.7 ? '#22c55e' : r >= 0.3 ? '#f59e0b' : '#ef4444');

	Plotly.newPlot('grpo-viz', [{
		x: rewards.map(r => r.toFixed(2)), y: advantages,
		type: 'bar', marker: { color: colors },
		text: advantages.map(a => a.toFixed(2)), textposition: 'outside'
	}], {
		title: { text: 'GRPO advantages: 16 sampled responses, normalized', font: { size: 13 } },
		xaxis: { title: 'reward (correctness score)' },
		yaxis: { title: 'group-normalized advantage', range: [-2.5, 2.5] },
		margin: { t: 50, b: 70, l: 60, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)'
	}, { responsive: true });
})();

// LoRA matrix
(function() {
	const c = document.getElementById('lora-viz');
	if (!c) return;

	const d = 8, r = 2;
	const trace = (data, colorscale) => ({
		z: data, type: 'heatmap', colorscale, showscale: false
	});

	const W = Array.from({length: d}, () => Array.from({length: d}, () => Math.random() - 0.5));
	const A = Array.from({length: r}, () => Array.from({length: d}, () => Math.random() - 0.5));
	const B = Array.from({length: d}, () => Array.from({length: r}, () => Math.random() - 0.5));
	const BA = Array.from({length: d}, (_, i) =>
		Array.from({length: d}, (_, j) => {
			let s = 0;
			for (let k = 0; k < r; k++) s += B[i][k] * A[k][j];
			return s;
		})
	);
	const Wprime = W.map((row, i) => row.map((v, j) => v + BA[i][j]));

	Plotly.newPlot('lora-viz', [
		{ z: W, type: 'heatmap', colorscale: 'RdBu', showscale: false, xaxis: 'x', yaxis: 'y' },
		{ z: BA, type: 'heatmap', colorscale: 'RdBu', showscale: false, xaxis: 'x2', yaxis: 'y2' },
		{ z: Wprime, type: 'heatmap', colorscale: 'RdBu', showscale: false, xaxis: 'x3', yaxis: 'y3' }
	], {
		title: { text: 'LoRA: W (frozen) + B·A (trainable, rank r=' + r + ')', font: { size: 13 } },
		grid: { rows: 1, columns: 3, pattern: 'independent' },
		xaxis: { title: 'W (frozen, ' + d + '×' + d + ')' },
		xaxis2: { title: 'BA (trainable, rank ' + r + ')' },
		xaxis3: { title: 'W + BA (effective)' },
		yaxis: { showticklabels: false },
		yaxis2: { showticklabels: false },
		yaxis3: { showticklabels: false },
		annotations: [
			{ x: 0.18, y: 1.05, xref: 'paper', yref: 'paper', text: '<b>' + (d * d) + ' params (frozen)</b>', showarrow: false, font: { size: 11 } },
			{ x: 0.5, y: 1.05, xref: 'paper', yref: 'paper', text: '<b>' + (d * r + r * d) + ' params (trained)</b>', showarrow: false, font: { size: 11, color: '#22c55e' } },
			{ x: 0.82, y: 1.05, xref: 'paper', yref: 'paper', text: '<b>effective ' + d + '×' + d + '</b>', showarrow: false, font: { size: 11 } }
		],
		margin: { t: 80, b: 50, l: 30, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)'
	}, { responsive: true });
})();

// Keep existing TrainingLab lazy init from old code
const TrainingLab = window.TrainingLab || {
	scenarios: {
		paris: { base: 'Raw web text about Paris.', lang: 'markup', fine: 'Q: Capital of France? A: Paris.' },
		sorting: { base: 'C++ quicksort code.', lang: 'clike', fine: 'Q: Sort in Python? A: Use sorted().', code: 'sorted([3, 1, 2])' },
		reasoning: { base: 'Math forum debate.', lang: 'markup', fine: 'Q: Prove 0.999... = 1. A: Algebraic proof.' }
	},
	init: function() { if (typeof this.update === 'function') this.update(); },
	update: function() {
		const val = document.getElementById('scenario-select').value;
		const data = this.scenarios[val];
		if (!data) return;
		const baseEl = document.getElementById('base-output');
		const fineEl = document.getElementById('fine-output');
		if (baseEl) baseEl.innerHTML = '<pre><code>' + data.base.replace(/</g, '&lt;') + '</code></pre>';
		if (fineEl) fineEl.innerHTML = '<div class="md">' + data.fine.replace(/\n/g, '<br>') + '</div>';
		if (typeof render_temml === 'function') render_temml();
	}
};

const _ftLazyRegistry = [];
let _ftLazyObserver = null;
function _ftLazyRegister(elementId, initFn) {
	const el = document.getElementById(elementId);
	if (!el) return;
	_ftLazyRegistry.push({ el, initFn, initialized: false });
}
function _ftLazyCreateObserver() {
	if (_ftLazyObserver) return;
	_ftLazyObserver = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (!entry.isIntersecting) return;
			const match = _ftLazyRegistry.find(r => r.el === entry.target);
			if (match && !match.initialized) {
				match.initialized = true;
				_ftLazyObserver.unobserve(match.el);
				match.initFn();
			}
		});
	}, { rootMargin: rootMargin });
	_ftLazyRegistry.forEach(r => { if (!r.initialized) _ftLazyObserver.observe(r.el); });
}

async function loadFinetuningModule() {
	updateLoadingStatus("Loading section about Fine-Tuning & Post-Training...");
	_ftLazyRegister('base-output', () => { TrainingLab.init(); });
	_ftLazyCreateObserver();
	return Promise.resolve();
}
</script>
