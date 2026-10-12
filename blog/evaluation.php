<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Evaluation & Benchmarks
description: How we measure LLM capability — MMLU, HumanEval, contamination, and the limits of benchmarks — plus how to build an evaluation for your own problem: rubric design, inter-annotator agreement, LLM-judge calibration, and telling a real effect from noise.
icon: &#127942;
part: 5
order: 16
color: rose
topics: programming, philosophy, society, data, inference
tags: code-heavy
math: 40
-->

<div class="md">
You cannot improve what you cannot measure. The evaluation problem is one of the hardest open issues in modern AI: benchmarks shape what models optimize for, and poorly designed benchmarks produce models that are great at benchmarks but useless in practice.

This chapter covers the major benchmarks, their mathematical formulation, and the crisis of **benchmark contamination**, the central concern that LLMs have already seen every test set during pretraining.
</div>

<div class="optional md" data-headline="Every benchmark here is a Goodhart target">
\citetitle{goodhartslaw} (p. 116) states that *every measure which becomes a target becomes a bad measure*. The benchmarks below, MMLU, HumanEval, GSM8K, are exactly such measures. Once a model is trained to maximize them, the benchmark stops measuring what it was supposed to measure. See the <a href="losslab">Loss chapter</a> § Beware of Goodhart's Law for the training-side version of this disease.
</div>

<div class="md">
## The Taxonomy of Evaluations

LLM evaluations fall into four families:

| Family | What it measures | Example |
|--------|------------------|---------|
| **Multiple-choice** | Knowledge / recognition | (\cite[Hendrycks et al., 2021]{hendrycks2021mmlu}), HellaSwag, ARC |
| **Generative, exact-match** | Verifiable outputs | (\cite[Chen et al., 2021]{chen2021humaneval}), GSM8K, MATH |
| **Generative, judged** | Open-ended quality | MT-Bench, AlpacaEval, (\cite[Zheng et al., 2023]{zheng2023lmsys}) |
| **Human preference** | Real-world quality | LMSYS (\cite[Zheng et al., 2023]{zheng2023lmsys}), Anthropic HH |

Each has failure modes:

* Multiple-choice can be hacked by always answering “C” (random baseline ~25% on 4-choice, calibration tests measure this).
* Exact-match fails on tasks with multiple valid answers (any equivalent SQL query, any correct translation).
* LLM-as-judge inherits the judge's biases.
* Human preference is gold-standard but slow and expensive.
</div>

<div class="md" data-mathlevel="40" data-optionaltitle="Multiple-choice benchmarks (MMLU accuracy)">
## Multiple-Choice Benchmarks

### MMLU: Massive Multitask Language Understanding

MMLU (\cite[Hendrycks et al., 2021]{hendrycks2021mmlu}) comprises 14,144 multiple-choice questions across 57 subjects. Covers STEM, humanities, social sciences, professional law, medicine. The model sees the question and four options (A/B/C/D); we measure:

$$
\text{accuracy} = \frac{1}{N}\sum_{i=1}^{N} \mathbb{1}[\arg\max_j P_\theta(y_{i,j} \mid x_i) = y_i^*]
$$

By 2025, frontier models exceed 88% on (\cite[Hendrycks et al., 2021]{hendrycks2021mmlu}); the benchmark is **saturated**. The community has moved to **MMLU-Pro** (\cite[Hendrycks et al., 2021]{hendrycks2021mmlu}) (more options, harder questions, no shortcut hacks) and **GPQA** (Google, graduate-level questions in biology, chemistry, physics).
</div>

<div class="md">
### HellaSwag

HellaSwag (\cite[Zellers et al., 2019]{zellers2019hellaswag}) tests commonsense completion: given a context, choose the most plausible continuation from four adversarial distractors. Saturated by GPT-4.

### ARC

ARC (\cite[Clark et al., 2018]{clark2018arc}) is the AI2 Reasoning Challenge: grade-school science questions. Saturated by 2023.
</div>

<div class="md">
## Generative, Exact-Match

### GSM8K

GSM8K (\cite[Cobbe et al., 2021]{cobbe2021gsm8k}) provides grade-school math problems (\cite[Hendrycks et al., 2021]{hendrycks2021math}):

$$
\text{Q: Janet's ducks lay 16 eggs/day. She eats 3, bakes with 4. The rest sell for \$2 each. How much per day?}
$$

The model must produce a numerical answer after reasoning. **Exact-match accuracy** requires the final integer (here, $\$18$) to be correct, with tolerance for units, commas, etc. (\cite[Cobbe et al., 2021]{cobbe2021gsm8k}).

### MATH

MATH (\cite[Hendrycks et al., 2021]{hendrycks2021math}) comprises 12,500 competition math problems from AMC, AIME, etc. Each has a step-by-step LaTeX solution. Models must produce the final answer; correctness is checked symbolically.
</div>

<div class="md" data-mathlevel="45" data-optionaltitle="HumanEval (pass@k formula)">
### HumanEval

HumanEval (\cite[Chen et al., 2021]{chen2021humaneval}) consists of 164 hand-written Python programming problems with unit tests. The model's code is executed; **pass@k** measures whether at least one of $k$ samples passes all tests:

$$
\text{pass@k} = \mathbb{E}\!\left[1 - \frac{\binom{n-c}{k}}{\binom{n}{k}}\right]
$$

where $n$ is the number of samples and $c$ is the number that pass. This unbiased estimator handles low $k$ correctly. For $k=1$, it's the unbiased greedy accuracy.
</div>

<div class="md">
### MBPP

MBPP (\cite[Austin et al., 2021]{austin2021mbpp}) comprises 974 Python problems, slightly easier than (\cite[Chen et al., 2021]{chen2021humaneval}). Used as a complement.

### BIG-Bench

BIG-Bench (\cite[Srivastava et al., 2022]{srivastava2022bigbench}) comprises 204 tasks ranging from linguistics to physics, designed to be **beyond current capabilities**. Mostly saturated by 2025 but historically important.
</div>

<div id="mmlu-viz" style="width:100%; max-width:var(--mn-col-width); margin:1em auto;"></div>

<div class="md" data-mathlevel="45" data-optionaltitle="LLM-as-judge (preference and Elo)">
## Generative, LLM-as-Judge

For open-ended tasks (summarization, dialogue, instruction-following), there's no single correct answer. The standard approach is **LLM-as-judge** (Zheng et al., LMSYS, 2023):

* Present two model outputs (A and B) to a strong judge model (typically GPT-4 or Claude).
* Ask: *“Which response is better, A or B?”*
* Score: win-rate of model X vs. baseline.

The mathematical formulation assumes the judge's preference is a noisy signal of true quality:

$$
P(\text{A wins}) \propto \sigma\!\left(\frac{Q(A) - Q(B)}{T}\right)
$$

where $Q$ is true quality and $T$ is “judge noise”. Empirical agreement with humans is ~70-80% on chat data.

### MT-Bench / AlpacaEval

MT-Bench / AlpacaEval (\cite[Zheng et al., 2023]{zheng2023lmsys}) — **MT-Bench**: 80 high-quality multi-turn questions across 8 categories, judged by GPT-4. Reported as a 1-10 score.

AlpacaEval: 805 questions, judged by GPT-4 Turbo, reports win-rate against GPT-4 baseline.

### LMSYS

LMSYS (\cite[Zheng et al., 2023]{zheng2023lmsys}) is the gold standard for human preference. Real users chat with two anonymous models side-by-side, then vote which they prefer. The Elo ranking:

$$
E_A^{\text{new}} = E_A + K \cdot \left(S_{AB} - \frac{1}{1 + 10^{(E_B - E_A)/400}}\right)
$$

with $K=32$, $S_{AB} = 1$ if A wins. Updated continuously with hundreds of thousands of votes.

A critical finding: **arena Elo and academic benchmarks correlate only weakly** ($r \approx 0.5$). Models optimized for benchmarks often underperform on real user preference.
</div>

<div id="arena-viz" style="width:100%; max-width:var(--mn-col-width); margin:1em auto;"></div>

<div class="md">
## Benchmark Contamination: The Crisis

The dirty secret of LLM evaluation: **most public benchmarks have been seen during pretraining**. GPT-4's training included Common Crawl through April 2023; many benchmarks were uploaded to GitHub, posted on Stack Overflow, or discussed on Reddit before then.

\marginfig{canary_coal_mine.jpg}{A foreman holding a canary in a cage — the miners' carbon-monoxide detector (U.S. Bureau of Mines, 1928). The bird dies well before a human does, turning an invisible poison into an early alarm. **Canary strings** do the same job for benchmarks: you plant a unique token that a model could never emit naturally, and if it ever reappears in output, the test set has leaked into the training data. [Photo: public domain](https://commons.wikimedia.org/wiki/File:Canary_coal_mine.jpg)}

Evidence of contamination:

* **Exact-match memorization**: models regurgitate benchmark items verbatim.
* **Ordering effects**: models perform anomalously well on benchmark-internal “Question 17” but badly on a shuffled version.
* **Min-checksum tests** (\cite[Carlini et al., 2021]{carlini2021extracting}): if a model can complete the second half of a passage, it has probably seen the first half.
* **Test-set perplexity**: a model that has seen the test set has lower perplexity than a fresh one.

### Mitigations

* **Dynamic benchmarks**: questions are generated fresh each test (e.g., LiveBench, MMLU-Pro (\cite[Hendrycks et al., 2021]{hendrycks2021mmlu})).
* **Held-out private benchmarks**: ARC-AGI (Chollet), FrontierMath (Epoch AI), SEAL (MIT). These cost money and are not public.
* **Time-shifted benchmarks**: questions created after the model's training cutoff, then benchmarked in real-time.
* **Adversarial filtering**: maintain a “contaminated” list of items that appear in pretraining corpora (ProxiMix, D-Clean).
* **Canary strings**: a unique token injected into benchmark items; if it appears in model output, the model has been trained on the benchmark.

**FrontierMATH** problems (\cite[Hendrycks et al., 2021]{hendrycks2021math}) are novel, require expert construction, and are not available online.
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
* **Process-based evaluation**: scoring not just final answers but the **reasoning steps** (PRM, see the <a href="reasoning">Reasoning chapter</a>).
* **Behavioral red-teaming**: probing for specific failure modes (jailbreaks, hallucinations, bias).
* **Task-specific evaluation**: medical QA with clinician review, legal tasks with lawyer review, code with actual execution and CI.

### HELM: Holistic Evaluation of Language Models

The Holistic Evaluation of Language Models benchmark suite (\cite[Liang et al., 2022]{liang2023helm}) evaluates models across **42 scenarios × 7 metrics** (accuracy, calibration, robustness, fairness, bias, toxicity, efficiency). It pioneered the multi-axis, transparent reporting standard.

### The State of Evaluation in 2025

The most reliable current evaluations are:

1. **LMSYS (\cite[Zheng et al., 2023]{zheng2023lmsys}) Elo**, for general chat quality.
2. **GPQA / FrontierMath / ARC-AGI**, for hard reasoning, contamination-resistant.
3. **HumanEval** (\cite[Chen et al., 2021]{chen2021humaneval}) / LiveCodeBench / SWE-Bench, for code.
4. **Human preference studies**, the gold standard, when affordable.

Static benchmarks like (\cite[Hendrycks et al., 2021]{hendrycks2021mmlu}) are **informative but no longer load-bearing** for frontier-model comparison.
</div>

<div class="md">
## Practical Guidance

When evaluating an LLM for your application:

1. **Build your own evaluation set** with 100–500 examples from your real workload. Static benchmarks won't reflect your distribution.
2. **Use LLM-as-judge carefully**, verify agreement with human raters on a held-out subset.
3. **Track variance**: run with temperature > 0 and report mean ± std.
4. **Test for regressions**: regression suite on every model update.
5. **Watch for contamination**: time-shift your evaluation set creation.
6. **Include adversarial examples**: prompts designed to break the system.

The goal is **not** to maximize a leaderboard score. It is to **measure real-world utility**, and that requires effort that no static benchmark can replace.
</div>

<div class="md">
The first part of this chapter covered *public* benchmarks — MMLU, HumanEval, the leaderboards — the shared rulers by which models are compared to one another. This second part is the other half, and the one that is actually used at work: **how do you build an evaluation for *your* problem?** "Report the MMLU score" and "measure whether *my* feature works for *my* users" are different skills, and the second is where most ML time is actually spent. The gap between them is small in principle and large in practice — and it is closed by a handful of concrete techniques, not by a feel for the answer.
</div>

<div class="md">
## From benchmark to your-own eval

A public benchmark answers a *fixed* question ("can the model do general knowledge?"). Your product has its own question — "does it extract the invoice fields correctly?", "does it refuse the out-of-scope request?", "does it sound like our voice?" — and no leaderboard answers it for you. Building your own eval is the move from the fixed question to the specific one, and it has three parts: a **set of inputs** that represent the real cases you care about, a **way to score** each answer, and a **number** that lets you compare two versions.

The trap is that the scoring part is where it goes wrong. A score is only as good as the *standard* behind it, and a standard that lives only in your head ("this looks right") is not a standard — it is a mood, and it will drift between you, your teammate, and your judge. So the first real task is to write the standard down.
</div>

<div class="md">
## Rubric design: a specification, not a vibe

A **rubric** turns "good answer" into a scored, written standard: a small set of **criteria** (what matters), a **scale** (what a 1, 3, 5 each means), and **anchors** (a concrete example of what each score looks like). The anchors are the load-bearing part — they are the difference between a rubric that two people can apply identically and one they cannot.

A useful pattern is *dimensional* scoring rather than a single holistic score, because a single score hides *what* went wrong. For a "write a support reply" task, you might score separately:

| Dimension | What a 1 looks like | What a 3 looks like | What a 5 looks like |
|---|---|---|---|
| **Correctness** | States a wrong fact or misses the point | Correct but incomplete | Correct and complete |
| **Grounding** | Invents details not in the ticket | Uses the ticket, small gaps | Every claim traceable to the ticket |
| **Tone** | Robotic or off-voice | Polite, generic | Matches the product's voice |
| **Safety** | Leaks PII / over-promises | Safe | Safe, and declines what it should |

Each dimension gets its own anchor examples. The point of writing the "what a 3 looks like" column is that *most* real outputs land in the middle, and the middle is where two scorers diverge — so the middle is where the anchors must be most precise. A rubric without sharp middle anchors will not give you reproducible scores, no matter how careful the scorers are.

> A rubric is a *specification*. If two trained annotators do not agree, the rubric — not the annotators — is wrong. You fix the rubric, you do not blame the score.
</div>

<div class="md">
## Inter-annotator agreement: is the rubric sound?

Before you trust any score, you must trust the *standard*. The test is **inter-annotator agreement (IAA)**: have two (or more) people score the *same* answers independently, and measure how often they agree — but not naively. Two people both scoring "3" most of the time could just be lazy; the right statistic adjusts for the agreement you would expect **by chance**.

The standard is **Cohen's κ** (kappa) \cite[Wikipedia, Cohen's kappa]{cohenkappa}:

<div>
$$ \kappa = \frac{p_{\text{observed}} - p_{\text{expected}}}{1 - p_{\text{expected}}} $$
</div>

where $p_{\text{observed}}$ is the fraction of items the annotators agree on, and $p_{\text{expected}}$ is the fraction they would agree on if they were guessing independently according to their individual scoring habits. κ ranges from $-1$ (systematic disagreement) through $0$ (no better than chance) to $1$ (perfect agreement). In practice:

* **κ ≥ 0.7** — the rubric is sound enough to measure with; the standard is stable.
* **κ ≈ 0.4–0.6** — the rubric is *almost* usable, but some criteria are ambiguous; find where the annotators split and sharpen those anchors.
* **κ < 0.4** — the rubric is not measuring anything stable; the criteria are too vague. Do not collect more data until this is fixed — more data on a broken ruler is just more noise.

(Krippendorff's α is the generalization when you have more than two annotators or different data types; κ is the two-annotator workhorse.) The discipline is that IAA is a property of the *rubric*, and you iterate the rubric until κ is high *before* you use it to compare model versions. This is the single most skipped step in practice, and the most expensive.
</div>

<div class="md">
## Calibrating an LLM judge: trust it only where it agrees

You will want to scale this past two humans — human scoring is slow and costs money. The obvious move is to use a strong LLM as the judge, and the first part of this chapter introduced it. The failure is that a judge *inherits its own biases* (it prefers its own style, longer answers, a particular phrasing), so an uncalibrated LLM judge can systematically prefer the wrong thing. **Calibration** is the fix, and it is the same IAA idea applied to the machine:

1. **Hold out a subset** (say 50–200 answers) and score it *by hand*, with your κ-verified rubric. This is the ground truth.
2. **Have the LLM judge score the same subset.**
3. **Measure the judge's agreement with the humans** — a κ, or a correlation, or an agreement rate.
4. **Trust the judge only where it agrees.** If the judge matches human scoring at κ ≥ 0.7 on your held-out set, you can let it scale the rest. Where it disagrees systematically (a particular dimension, a particular answer style), either fix the prompt/rubric or score that part by hand.

This is the LLM-as-judge method of \cite[Zheng et al. (2023)]{llmjudge2023} in its practical form: an LLM judge is not a substitute for a standard, it is a *cheap instrument that you must calibrate against the standard first*. The held-out human subset is the calibration set; without it, the judge is a black box with a plausible face on it.
</div>

<div class="md">
## Variance and significance: is the difference real?

The last trap is the smallest and the most damaging: **reading too much into a small number.** You ship a prompt change and the eval goes from 82% to 87% — "up 5 points, shipped." But with $n = 100$ examples, 82% is 82 correct and 87% is 87 correct, and a difference of five correct answers out of one hundred is exactly the kind of thing that happens by chance. The question is never "did it go up?" but "**could it go up by this much if nothing changed?**"

The answer is a **confidence interval** on the difference. The cheap, assumption-light way is the **bootstrap**: draw *with replacement* samples of size $n$ from your scored data, recompute the accuracy on each, and repeat thousands of times. The spread of those recomputed accuracies is your uncertainty. Do it for both versions and for the *difference*, and you get a bootstrap distribution of "how much could this gap be explained by sampling noise." If the bootstrap distribution of the difference overlaps zero a lot — if the 5% lift's error bar straddles 0 — the lift is not real, and you should not ship on it.

Two corollaries that bite in practice:

* **Small $n$ needs big effects.** At $n = 100$, you need a change of roughly *ten* points or more to be confident; a three-point change is inside the noise. Either the effect is large, or you need more examples.
* **The multiple-comparisons trap.** If you try twenty prompt variants and report the best one, you have *selected on the noise* — the best of twenty random draws will look like a winner by construction. The fix is to hold out a *final* test set you look at only once, or to pre-register which metric you will optimize. [HELM](helm2022) exists, in part, to make these measurement practices consistent across benchmarks \cite[Liang et al., HELM (2022)]{helm2022}.

> An eval is a measurement instrument, and like any instrument it has a resolution. Below the resolution, the number is not a result — it is a rounding error with a label on it. The whole discipline of building an eval is: write the standard down, verify two people can read it the same way, calibrate the cheap judge against the careful one, and refuse to act on a number smaller than the noise.
</div>

<script>
// (\cite[Hendrycks et al., 2021]{hendrycks2021mmlu}) leaderboard (illustrative 2024-2025 scores)
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
		hovertemplate: '%{text}<br>Elo: %{x}<br>(\cite[Hendrycks et al., 2021]{hendrycks2021mmlu}): %{y}%<extra></extra>'
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
