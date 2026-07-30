<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Reasoning & Test-Time Compute
description: Chain-of-thought, self-consistency, ToT, and the o1/R1 paradigm of scaling compute at inference.
icon: &#129518;
part: 5
order: 37
color: rose
-->

<div class="md">
For most of the LLM era, scaling meant **training**: bigger models on more tokens. In late 2024, OpenAI's **o1** and DeepSeek's **R1** introduced a different scaling axis: **reasoning at inference time**. The model thinks longer, explores more paths, verifies its answers — and gets dramatically better at math, code, and logic.

This chapter covers the techniques behind reasoning models, from the cheap and effective (prompting tricks) to the heavyweight (RL-trained chain-of-thought).
</div>

<div class="md">
## Chain-of-Thought Prompting

Wei et al. (Google, 2022) discovered that simply adding *"Let's think step by step"* to a prompt dramatically improves performance on arithmetic, commonsense, and symbolic reasoning tasks. The model decomposes the problem into intermediate steps rather than jumping to an answer.

$$
P_{\text{CoT}}(y \mid x) = \sum_z P(y \mid x, z)\, P(z \mid x)
$$

where $z$ is a chain-of-thought (a sequence of intermediate reasoning tokens). Marginalizing over $z$ gives the answer distribution; the prompt induces the model to sample informative $z$'s.

**Few-shot CoT**: include examples of step-by-step solutions in the prompt. **Zero-shot CoT**: just add the magic phrase.
</div>

<div class="md">
## Variants

| Method | Year | Idea |
|--------|------|------|
| **Zero-shot CoT** | 2022 | *"Let's think step by step"* |
| **Few-shot CoT** | 2022 | Hand-written reasoning examples |
| **Self-consistency** | 2022 | Sample $k$ CoTs, take majority vote on answers |
| **Least-to-most prompting** | 2022 | Decompose into subproblems, solve sequentially |
| **Tree of Thoughts (ToT)** | 2023 | BFS/DFS over partial reasoning paths with self-evaluation |
| **Graph of Thoughts (GoT)** | 2023 | DAG of thoughts, with merging and feedback |
| **Skeleton-of-Thought** | 2023 | Generate outline first, then fill in each section in parallel |
| **Self-Refine** | 2023 | Generate, critique, refine iteratively |
| **Chain-of-Density** | 2023 | Iterative summarization with increasing entity density |
| **Verifier-guided search** | 2023 | Generate $k$ candidates, score with a learned verifier |
| **ReAct** | 2022 | Interleave reasoning with tool use |
</div>

<div id="sc-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## Self-Consistency \cite[Wang et al., 2022]{wang2022selfconsistency}

The simplest and most reliable inference-time scaling trick:

1. Sample $k$ independent CoTs from the model: $\{z^{(1)}, \dots, z^{(k)}\}$.
2. Extract the final answer from each: $\{y^{(1)}, \dots, y^{(k)}\}$.
3. Take the **majority vote**: $\hat y = \text{mode}(y^{(1)}, \dots, y^{(k)})$.

This works because **diverse reasoning paths converge on the same answer** when the model is correct, but **diverge when it is uncertain**. Self-consistency gives 10–20% accuracy gains on GSM8K and similar benchmarks at $k=40$.

The cost is $k \times$ more inference, but no retraining required.
</div>

<div class="md">
## Tree of Thoughts (\cite[Yao et al., 2023]{yao2023tot} rather than a linear chain:

1. **Generate** $b$ candidate thoughts at each step.
2. **Evaluate** each candidate (by prompting the model itself).
3. **Search**: BFS or DFS, keeping the top-$n$ candidates by evaluation score.
4. **Backtrack** if a path looks unpromising.

ToT can solve problems that linear CoT cannot (e.g., 24-game, crossword puzzles), at the cost of $O(b^d)$ model calls for depth $d$.
</div>

<div id="tot-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## The o1 / R1 Paradigm: Inference-Time Training

OpenAI's o1 (September 2024) and DeepSeek's R1 (January 2025) pushed reasoning further by **training the model to think longer**:

* The model is fine-tuned on **long, detailed chain-of-thought traces** that include backtracking, self-correction, and verification.
* At inference, the model produces **thousands of tokens of internal reasoning** before answering.
* **Test-time compute scaling**: performance improves monotonically with the number of reasoning tokens the model is allowed to use.

R1 was trained purely with RL (no SFT) using a technique called **GRPO** (\cite[Shao et al., 2024]{shao2024grpo} Policy Optimization), which scores groups of sampled responses and updates the policy to favour the best in each group. This produced emergent long-CoT behaviour without explicit supervision on reasoning traces.

### Why It Works

The hypothesis: **a hard problem is easier to solve step-by-step than in one forward pass**, because each intermediate step reduces the conditional entropy of the next. A 100-token CoT might involve ~10 reasoning "chunks", each of which the model has seen many times in pretraining. The model is essentially **decomposing a single hard prediction into many easy ones**.

Forcing the model to verify its own work (critique-then-revise, search over candidates) gives another order-of-magnitude improvement on hard math and code.
</div>

<div class="md">
## Process Reward Models (PRMs)

A **reward model** (used in \cite[Ouyang et al., 2022]{ouyang2022instructgpt}, see the Fine-Tuning chapter) scores the *final* output. A **Process Reward Model** scores every **step** of a reasoning trace.

Training a PRM:

1. Collect model-generated CoTs.
2. Have humans label each step as correct / incorrect.
3. Train a classifier on (state, step) → score.

At inference, beam search guided by the PRM dramatically improves accuracy on math (used in o1, Qwen-QwQ, and many open-source replicas). The cost is labelling data; synthetic PRMs (auto-labelling using a stronger model) are now competitive.

The Math-Shepherd method (2024) auto-labels step correctness by checking whether later steps can reach the correct final answer from this point — eliminating the need for human step labels.
</div>

<div class="md">
## Inference-Time Scaling Laws

Snell et al. (Google, 2024) and others have shown that **inference-time compute scaling** follows a power law similar to training-time scaling:

$$
\text{accuracy}(n) = a \cdot n^b
$$

where $n$ is the number of reasoning tokens or search depth. The exponent $b$ depends on problem difficulty: easy problems saturate quickly, hard problems benefit enormously.

For o1-style reasoning on competition math:
* $n = 100$ tokens: 50% accuracy
* $n = 1{,}000$ tokens: 70% accuracy
* $n = 10{,}000$ tokens: 85% accuracy

Compare this with training: achieving 85% on AIME by training would require either a much larger base model or domain-specific data. **Inference-time scaling is often cheaper and more flexible**.
</div>

<div id="scaling-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## When Reasoning Helps (and When It Doesn't)

Reasoning improves performance on tasks where:

* The problem can be **decomposed** into verifiable substeps.
* The model has the relevant **knowledge** in its weights (it just needs to compose it).
* More compute at inference is **affordable** (latency, cost).

It does **not** help with:

* **Factual recall** (the model either knows the date of the Battle of Hastings or it doesn't).
* **Subjective tasks** (creative writing, preference — there's no "correct" reasoning path).
* **Hard perception** (recognizing fine-grained visual details).
* **Distribution shift** (if the test prompt is unlike any training example, no amount of thinking will help).

The bitter lesson still applies: **scale helps**. But now you have two knobs — training and inference.
</div>

<div class="md">
## Practical Patterns for Reasoning

For practitioners building with today's models:

1. **For easy tasks**: zero-shot prompting suffices. Don't pay for reasoning tokens you don't need.
2. **For medium tasks**: few-shot CoT, or enable the model's built-in thinking mode.
3. **For hard tasks**: best-of-$n$ sampling + verifier. Use a cheaper model for $n$ candidates, an expensive model for the final judgement.
4. **For multi-step tasks**: ReAct (Reason + Act), or chain agents with explicit tool use.

The frontier of research is **meta-reasoning**: training the model to *decide how much to think* based on the problem.
</div>

<div class="md">
## Summary

| Method | Compute cost | When to use |
|--------|-------------|-------------|
| Zero-shot CoT | $1\times$ | Quick win on \cite[Hendrycks et al., 2021]{hendrycks2021math}s |
| o1-style long thinking | $10{-}100\times$ | Hard math, code, science |
| Process Reward Model search | $k \cdot d\times$ | Maximum accuracy on verifiable tasks |

The era of "scale by training" is now supplemented by **scale by thinking**. The frontier in 2025 is figuring out how to spend inference compute *adaptively* — think hard when it matters, save tokens when it doesn't.
</div>

<script>
// Self-consistency: 8 sampled CoTs and majority vote
(function() {
	const c = document.getElementById('sc-viz');
	if (!c) return;

	const samples = [
		'17', '17', '17', '23', '17', '17', '23', '17'
	];
	const correct = '17';
	const counts = {};
	samples.forEach(s => counts[s] = (counts[s] || 0) + 1);

	const trace = (idx) => ({
		x: [0, 1], y: [idx, idx], mode: 'lines+markers+text',
		text: ['', samples[idx]], textposition: 'top center',
		line: { color: samples[idx] === correct ? '#22c55e' : '#ef4444', width: 2 },
		marker: { size: 14 },
		showlegend: false,
		hoverinfo: 'text', hovertext: 'sample ' + (idx + 1) + ' → ' + samples[idx]
	});

	const traces = [];
	for (let i = 0; i < samples.length; i++) traces.push(trace(i));

	// Bar chart of vote counts (overlay)
	const answers = Object.keys(counts);
	traces.push({
		x: [1.6, 1.7], y: [counts[correct] || 0, counts[correct] || 0],
		type: 'bar', orientation: 'h',
		marker: { color: '#22c55e' }, name: 'correct',
		showlegend: false
	});
	traces.push({
		x: [1.6, 1.7], y: [counts[Object.keys(counts).find(k => k !== correct)] || 0,
		                  counts[Object.keys(counts).find(k => k !== correct)] || 0],
		type: 'bar', orientation: 'h',
		marker: { color: '#ef4444' }, name: 'wrong',
		showlegend: false
	});

	const annotations = [
		{ x: 0.5, y: samples.length + 0.5, text: '<b>8 sampled CoTs</b>', showarrow: false, font: { size: 12 } },
		{ x: 1.65, y: 3, text: '<b>Majority</b>', showarrow: false, font: { size: 11, color: '#22c55e' } },
		{ x: 1.65, y: 1.2, text: '<b>Wrong</b>', showarrow: false, font: { size: 11, color: '#ef4444' } },
		{ x: 1.65, y: 0.2, text: '→ pick <b>17</b> (6/8 votes)', showarrow: false, font: { size: 12 } }
	];

	Plotly.newPlot('sc-viz', traces, {
		title: { text: 'Self-consistency: majority vote over sampled CoTs', font: { size: 13 } },
		xaxis: { range: [-0.3, 2], showgrid: false, zeroline: false, showticklabels: false },
		yaxis: { range: [-0.5, samples.length + 1], showgrid: false, zeroline: false, showticklabels: false },
		annotations,
		margin: { t: 50, b: 30, l: 30, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)'
	}, { displayModeBar: false, responsive: true });
})();

// Tree of Thoughts: branching tree
(function() {
	const c = document.getElementById('tot-viz');
	if (!c) return;

	const nodes = [
		{ x: 5, y: 5, label: 'Problem' },
		{ x: 3, y: 4, label: 'Path A' },
		{ x: 5, y: 4, label: 'Path B' },
		{ x: 7, y: 4, label: 'Path C' },
		{ x: 2.5, y: 3, label: 'a1' },
		{ x: 3.5, y: 3, label: 'a2' },
		{ x: 4.5, y: 3, label: 'b1' },
		{ x: 5.5, y: 3, label: 'b2' },
		{ x: 6.5, y: 3, label: 'c1' },
		{ x: 7.5, y: 3, label: 'c2' },
		{ x: 2, y: 2, label: 'a1.1 ✓' },
		{ x: 3, y: 2, label: 'a1.2 ✗' },
		{ x: 4, y: 2, label: 'b1.1 ✓' },
		{ x: 5, y: 2, label: 'b2.1 ✗' },
		{ x: 6, y: 2, label: 'c1.1 ✓' },
		{ x: 7, y: 2, label: 'c2.1 ✓' }
	];

	const edges = [
		[0, 1], [0, 2], [0, 3],
		[1, 4], [1, 5], [2, 6], [2, 7], [3, 8], [3, 9],
		[4, 10], [4, 11], [6, 12], [7, 13], [8, 14], [9, 15]
	];

	const shapes = nodes.map(n => ({
		type: 'circle', x0: n.x - 0.4, x1: n.x + 0.4, y0: n.y - 0.25, y1: n.y + 0.25,
		fillcolor: n.label.includes('✓') ? '#22c55e' : n.label.includes('✗') ? '#ef4444' : '#3b82f6',
		line: { color: 'rgba(0,0,0,0.4)', width: 1.5 }
	}));

	const annotations = nodes.map(n => ({
		x: n.x, y: n.y, text: '<b>' + n.label + '</b>',
		showarrow: false, font: { size: 9, color: '#fff' }
	}));

	const lineShapes = edges.map(e => ({
		type: 'line', x0: nodes[e[0]].x, x1: nodes[e[1]].x,
		y0: nodes[e[0]].y, y1: nodes[e[1]].y,
		line: { color: '#64748b', width: 1.5 }
	}));

	Plotly.newPlot('tot-viz', [], {
		shapes: [...shapes, ...lineShapes],
		annotations,
		xaxis: { range: [0, 10], showgrid: false, zeroline: false, showticklabels: false },
		yaxis: { range: [0, 7], showgrid: false, zeroline: false, showticklabels: false, scaleanchor: 'x' },
		margin: { t: 20, b: 20, l: 20, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		title: { text: 'Tree of Thoughts: search + prune + backtrack', font: { size: 13 } }
	}, { displayModeBar: false, responsive: true });
})();

// Inference-time scaling
(function() {
	const c = document.getElementById('scaling-viz');
	if (!c) return;

	const n = Array.from({length: 50}, (_, i) => (i + 1) * 100);
	const easy = n.map(t => 95 - 20 / Math.sqrt(t / 100));
	const medium = n.map(t => 95 - 60 / Math.pow(t / 100, 0.3));
	const hard = n.map(t => 95 - 90 / Math.pow(t / 100, 0.25));

	Plotly.newPlot('scaling-viz', [
		{ x: n, y: easy, mode: 'lines', name: 'Easy (GSM8K basic)', line: { color: '#22c55e', width: 2.5 } },
		{ x: n, y: medium, mode: 'lines', name: 'Medium (MATH)', line: { color: '#f59e0b', width: 2.5 } },
		{ x: n, y: hard, mode: 'lines', name: 'Hard (AIME / FrontierMath)', line: { color: '#ef4444', width: 2.5 } }
	], {
		title: { text: 'Inference-time compute scaling (illustrative)', font: { size: 13 } },
		xaxis: { title: 'reasoning tokens', type: 'log' },
		yaxis: { title: 'accuracy (%)', range: [40, 100] },
		margin: { t: 50, b: 50, l: 60, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		legend: { x: 0.55, y: 0.25 }
	}, { responsive: true });
})();

async function loadReasoningModule() {
	updateLoadingStatus("Loading section about Reasoning & Test-Time Compute...");
	return Promise.resolve();
}
</script>
