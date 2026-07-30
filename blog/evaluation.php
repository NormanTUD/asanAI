<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Evaluation & Benchmarks
description: How we measure LLM capability — MMLU, HumanEval, contamination, and the limits of benchmarks.
icon: &#127942;
part: 5
order: 38
color: rose
-->

<div class="md">
You cannot improve what you cannot measure. The evaluation problem is one of the hardest open issues in modern AI: benchmarks shape what models optimize for, and poorly designed benchmarks produce models that are great at benchmarks but useless in practice.

This chapter covers the major benchmarks, their mathematical formulation, and the crisis of **benchmark contamination** — the central concern that LLMs have already seen every test set during pretraining.
</div>

<div class="md">
## The Taxonomy of Evaluations

LLM evaluations fall into four families:

| Family | What it measures | Example |
|--------|------------------|---------|
| **Multiple-choice** | Knowledge / recognition | \cite[Hendrycks et al., 2021]{hendrycks2021mmlu}, HellaSwag, ARC |
| **Generative, exact-match** | Verifiable outputs | \cite[Chen et al., 2021]{chen2021humaneval}, GSM8K, MATH |
| **Generative, judged** | Open-ended quality | MT-Bench, AlpacaEval, \cite[Zheng et al., 2023]{zheng2023lmsys} |
| **Human preference** | Real-world quality | LMSYS \cite[Zheng et al., 2023]{zheng2023lmsys}, Anthropic HH |

Each has failure modes:

* Multiple-choice can be hacked by always answering "C" (random baseline ~25% on 4-choice, calibration tests measure this).
* Exact-match fails on tasks with multiple valid answers (any equivalent SQL query, any correct translation).
* LLM-as-judge inherits the judge's biases.
* Human preference is gold-standard but slow and expensive.
</div>

<div class="md">
## Multiple-Choice Benchmarks

### \cite[Hendrycks et al., 2021]{hendrycks2021mmlu} (\cite[Hendrycks et al., 2021]{hendrycks2021mmlu} Language Understanding benchmark: 57 subjects × ~100 multiple-choice questions each. Covers STEM, humanities, social sciences, professional law, medicine. The model sees the question and four options (A/B/C/D); we measure:

$$
\text{accuracy} = \frac{1}{N}\sum_{i=1}^{N} \mathbb{1}[\arg\max_j P_\theta(y_{i,j} \mid x_i) = y_i^*]
$$

By 2025, frontier models exceed 88% on \cite[Hendrycks et al., 2021]{hendrycks2021mmlu}; the benchmark is **saturated**. The community has moved to **\cite[Hendrycks et al., 2021]{hendrycks2021mmlu}-Pro** (more options, harder questions, no shortcut hacks) and **GPQA** (Google, graduate-level questions in biology, chemistry, physics).

### HellaSwag \cite[Zellers et al., 2019]{zellers2019hellaswag}

Tests commonsense completion: given a context, choose the most plausible continuation from four adversarial distractors. Saturated by GPT-4.

### ARC \cite[Clark et al., 2018]{clark2018arc}

AI2 Reasoning Challenge: grade-school science questions. Saturated by 2023.
</div>

<div class="md">
## Generative, Exact-Match

### GSM8K \cite[Cobbe et al., 2021]{cobbe2021gsm8k}

Grade-school \cite[Hendrycks et al., 2021]{hendrycks2021math}s:

$$
\text{Q: Janet's ducks lay 16 eggs/day. She eats 3, bakes with 4. The rest sell for \$2 each. How much per day?}
$$

The model must produce a numerical answer after reasoning. **Exact-match accuracy** requires the final integer (here, \$18) to be correct, with tolerance for units, commas, etc. \cite[Cobbe et al., 2021]{cobbe2021gsm8k}.

### MATH \cite[Hendrycks et al., 2021]{hendrycks2021math}

12,500 competition-\cite[Hendrycks et al., 2021]{hendrycks2021math}s from AMC, AIME, etc. Each has a step-by-step LaTeX solution. Models must produce the final answer; correctness is checked symbolically.

### HumanEval \cite[Chen et al., 2021]{chen2021humaneval}

164 hand-written Python programming problems with unit tests. The model's code is executed; **pass@k** measures whether at least one of $k$ samples passes all tests:

$$
\text{pass@k} = \mathbb{E}\!\left[1 - \frac{\binom{n-c}{k}}{\binom{n}{k}}\right]
$$

where $n$ is the number of samples and $c$ is the number that pass. This unbiased estimator handles low $k$ correctly. For $k=1$, it's the unbiased greedy accuracy.

### MBPP (\cite[Austin et al., 2021]{austin2021mbpp}

974 Python problems, slightly easier than \cite[Chen et al., 2021]{chen2021humaneval}. Used as a complement.

### BIG-Bench \cite[Srivastava et al., 2022]{srivastava2022bigbench}

204 tasks ranging from linguistics to physics, designed to be **beyond current capabilities**. Mostly saturated by 2025 but historically important.
</div>

<div id="mmlu-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## Generative, LLM-as-Judge

For open-ended tasks (summarization, dialogue, instruction-following), there's no single correct answer. The standard approach is **LLM-as-judge** (Zheng et al., LMSYS, 2023):

* Present two model outputs (A and B) to a strong judge model (typically GPT-4 or Claude).
* Ask: *"Which response is better, A or B?"*
* Score: win-rate of model X vs. baseline.

The mathematical formulation assumes the judge's preference is a noisy signal of true quality:

$$
P(\text{A wins}) \propto \sigma\!\left(\frac{Q(A) - Q(B)}{T}\right)
$$

where $Q$ is true quality and $T$ is "judge noise". Empirical agreement with humans is ~70-80% on chat data.

### MT-Bench / AlpacaEval \cite[Zheng et al., 2023]{zheng2023lmsys}

MT-Bench: 80 high-quality multi-turn questions across 8 categories, judged by GPT-4. Reported as a 1-10 score.

AlpacaEval: 805 questions, judged by GPT-4 Turbo, reports win-rate against GPT-4 baseline.

### LMSYS \cite[Zheng et al., 2023]{zheng2023lmsys}

The gold standard for human preference. Real users chat with two anonymous models side-by-side, then vote which they prefer. The Elo ranking:

$$
E_A^{\text{new}} = E_A + K \cdot (S_{AB} - E_A / (E_A + E_B))
$$

with $K=32$, $S_{AB} = 1$ if A wins. Updated continuously with hundreds of thousands of votes.

A critical finding: **arena Elo and academic benchmarks correlate only weakly** ($r \approx 0.5$). Models optimized for benchmarks often underperform on real user preference.
</div>

<div id="arena-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## Benchmark Contamination: The Crisis

The dirty secret of LLM evaluation: **most public benchmarks have been seen during pretraining**. GPT-4's training included Common Crawl through April 2023; many benchmarks were uploaded to GitHub, posted on Stack Overflow, or discussed on Reddit before then.

Evidence of contamination:

* **Exact-match memorization**: models regurgitate benchmark items verbatim.
* **Ordering effects**: models perform anomalously well on benchmark-internal "Question 17" but badly on a shuffled version.
* **Min-checksum tests** \cite[Carlini et al., 2021]{carlini2021extracting}: if a model can complete the second half of a passage, it has probably seen the first half.
* **Test-set perplexity**: a model that has seen the test set has lower perplexity than a fresh one.

### Mitigations

* **Dynamic benchmarks**: questions are generated fresh each test (e.g., LiveBench, \cite[Hendrycks et al., 2021]{hendrycks2021mmlu}-Pro's harder subset).
* **Held-out private benchmarks**: ARC-AGI (Chollet), FrontierMath (Epoch AI), SEAL (MIT). These cost money and are not public.
* **Time-shifted benchmarks**: questions created after the model's training cutoff, then benchmarked in real-time.
* **Adversarial filtering**: maintain a "contaminated" list of items that appear in pretraining corpora (ProxiMix, D-Clean).
* **Canary strings**: a unique token injected into benchmark items; if it appears in model output, the model has been trained on the benchmark.

**Frontier\cite[Hendrycks et al., 2021]{hendrycks2021math}s are novel, require expert construction, and are not available online.
</div>

<div class="md">
## LLM-as-Judge Failure Modes

* **Position bias**: prefers the response shown first.
* **Length bias**: prefers longer responses.
* **Self-preference**: prefers outputs similar to its own style.
* **Sycophancy**: agrees with the user's stated preference regardless of quality.
* **Verbosity bias**: prefers detailed, formatted answers even when conciseness is correct.

Mitigations: swap A/B positions, average over multiple judges, use pairwise tournament design rather than direct scoring, use specialized fine-tuned judges.
</div>

<div class="md">
## Beyond Static Benchmarks

The community is moving towards:

* **Live evaluations**: continuous, time-stamped, on novel data.
* **Capability-specific benchmarks**: LiveCodeBench (contests from the past month), MathArena (rolling math contests).
* **Process-based evaluation**: scoring not just final answers but the **reasoning steps** (PRM, see the Reasoning chapter).
* **Behavioral red-teaming**: probing for specific failure modes (jailbreaks, hallucinations, bias).
* **Task-specific evaluation**: medical QA with clinician review, legal tasks with lawyer review, code with actual execution and CI.

### \cite[Liang et al., 2022]{liang2023helm} (Stanford, 2022)

The Holistic Evaluation of Language Models benchmark suite evaluates models across **42 scenarios × 7 metrics** (accuracy, calibration, robustness, fairness, bias, toxicity, efficiency). It pioneered the multi-axis, transparent reporting standard.

### The State of Evaluation in 2025

The most reliable current evaluations are:

1. **LMSYS \cite[Zheng et al., 2023]{zheng2023lmsys} Elo** — for general chat quality.
2. **GPQA / FrontierMath / ARC-AGI** — for hard reasoning, contamination-resistant.
3. **\cite[Chen et al., 2021]{chen2021humaneval} / LiveCodeBench / SWE-Bench** — for code.
4. **Human preference studies** — the gold standard, when affordable.

Static benchmarks like \cite[Hendrycks et al., 2021]{hendrycks2021mmlu} are **informative but no longer load-bearing** for frontier-model comparison.
</div>

<div class="md">
## Practical Guidance

When evaluating an LLM for your application:

1. **Build your own evaluation set** with 100–500 examples from your real workload. Static benchmarks won't reflect your distribution.
2. **Use LLM-as-judge carefully** — verify agreement with human raters on a held-out subset.
3. **Track variance**: run with temperature > 0 and report mean ± std.
4. **Test for regressions**: regression suite on every model update.
5. **Watch for contamination**: time-shift your evaluation set creation.
6. **Include adversarial examples**: prompts designed to break the system.

The goal is **not** to maximize a leaderboard score. It is to **measure real-world utility** — and that requires effort that no static benchmark can replace.
</div>

<script>
// \cite[Hendrycks et al., 2021]{hendrycks2021mmlu} leaderboard (illustrative 2024-2025 scores)
(function() {
	const c = document.getElementById('mmlu-viz');
	if (!c) return;

	const models = [
		'GPT-3 (2020)', 'GPT-3.5 (2022)', 'GPT-4 (2023)', 'Claude 3 Opus',
		'Gemini 1.5 Pro', 'Claude 3.5 Sonnet', 'GPT-4o', 'o1', 'Gemini 2.0', 'Claude 3.7', 'GPT-5'
	];
	const scores = [43.9, 70.0, 86.4, 86.8, 85.9, 88.7, 88.7, 91.8, 90.0, 92.0, 93.2];
	const colors = scores.map(s => s > 90 ? '#22c55e' : s > 80 ? '#3b82f6' : s > 60 ? '#f59e0b' : '#ef4444');

	Plotly.newPlot('mmlu-viz', [{
		x: models, y: scores, type: 'bar',
		marker: { color: colors },
		text: scores.map(s => s.toFixed(1) + '%'), textposition: 'outside'
	}], {
		title: { text: 'MMLU benchmark scores over time (illustrative)', font: { size: 13 } },
		xaxis: { tickangle: -45 },
		yaxis: { title: 'MMLU accuracy (%)', range: [0, 100] },
		margin: { t: 50, b: 100, l: 60, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)'
	}, { responsive: true });
})();

// Arena Elo vs benchmark score
(function() {
	const c = document.getElementById('arena-viz');
	if (!c) return;

	const models = [
		{ name: 'Claude 3.5 Sonnet', x: 1287, y: 88.7 },
		{ name: 'GPT-4o', x: 1310, y: 88.7 },
		{ name: 'Gemini 1.5 Pro', x: 1262, y: 85.9 },
		{ name: 'Llama 3.1 405B', x: 1264, y: 88.6 },
		{ name: 'o1-preview', x: 1338, y: 91.8 },
		{ name: 'DeepSeek-V3', x: 1238, y: 88.5 },
		{ name: 'Claude 3 Opus', x: 1248, y: 86.8 },
		{ name: 'GPT-4 Turbo', x: 1254, y: 86.5 }
	];

	Plotly.newPlot('arena-viz', [{
		x: models.map(m => m.x), y: models.map(m => m.y),
		mode: 'markers+text',
		text: models.map(m => m.name),
		textposition: 'top center',
		marker: { size: 14, color: '#3b82f6' },
		hovertemplate: '%{text}<br>Elo: %{x}<br>\cite[Hendrycks et al., 2021]{hendrycks2021mmlu}: %{y}%<extra></extra>'
	}], {
		title: { text: 'LMSYS Arena Elo vs MMLU (correlation only ~0.5)', font: { size: 13 } },
		xaxis: { title: 'Arena Elo (Jan 2025)' },
		yaxis: { title: 'MMLU accuracy (%)', range: [80, 95] },
		margin: { t: 50, b: 50, l: 60, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)'
	}, { responsive: true });
})();

async function loadEvaluationModule() {
	updateLoadingStatus("Loading section about Evaluation & Benchmarks...");
	return Promise.resolve();
}
</script>
