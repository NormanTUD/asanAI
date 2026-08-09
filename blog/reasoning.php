<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Reasoning & Test-Time Compute
description: Chain-of-thought, self-consistency, ToT, and the o1/R1 paradigm of scaling compute at inference.
icon: &#129518;
part: 5
order: 37
color: rose
topics: reasoning, agents, architecture, philosophy
-->

<div class="md">
For most of the LLM era, scaling meant **training**: bigger models on more tokens. In late 2024, OpenAI's **o1** — followed in January 2025 by DeepSeek's **R1** — introduced a different scaling axis: **reasoning at inference time**. The model thinks longer, explores more paths, verifies its answers — and gets dramatically better at math, code, and logic.

This chapter covers the techniques behind reasoning models, from the cheap and effective (prompting tricks) to the heavyweight (RL-trained chain-of-thought).
</div>

<div class="optional md" data-headline="Neighbouring chapters">
* The **algorithm** behind R1 (GRPO) lives in the <a href="reinforcement_learning">Reinforcement Learning chapter</a>.
* The **training pipeline** (SFT → RLHF → DPO) lives in the <a href="finetuninglab">Fine-Tuning chapter</a>.
* **CoT + tool use** as a control loop lives in the <a href="agents">AI Agents chapter</a> § ReAct.
* What **reason** and **reasoning** even *are*, philosophically, is unpacked in the <a href="philosophy#what-is-reason">Philosophy chapter</a> § What is Reason?
</div>

<div class="md">
## Chain-of-Thought Prompting

The **magic phrase** *"Let's think step by step"* — added to a zero-shot prompt — was introduced by \cite[Kojima et al., 2022]{kojima2022zeroshot} and dramatically improves performance on arithmetic, commonsense, and symbolic reasoning tasks. Independently and almost simultaneously, \cite[Wei et al., 2022]{wei2022cot} showed that **few-shot** chain-of-thought prompting — providing hand-written reasoning exemplars in the prompt — achieves an even larger effect. The model in both cases decomposes the problem into intermediate steps rather than jumping to an answer.

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
| **ReAct** | 2023 | Interleave reasoning with tool use |
</div>

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

<div class="md">
## The o1 / R1 Paradigm: Inference-Time Training

OpenAI's o1 (September 2024) and DeepSeek's R1 (January 2025) pushed reasoning further by **training the model to think longer**:

* The model is fine-tuned on **long, detailed chain-of-thought traces** that include backtracking, self-correction, and verification.
* At inference, the model produces **thousands of tokens of internal reasoning** before answering.
* **Test-time compute scaling**: performance improves monotonically with the number of reasoning tokens the model is allowed to use.

DeepSeek's **R1-Zero** was trained purely with RL (no SFT) using a technique called **GRPO** (\cite[Shao et al., 2024]{shao2024grpo} Policy Optimization), which scores groups of sampled responses and updates the policy to favour the best in each group. This produced emergent long-CoT behaviour without explicit supervision on reasoning traces; the released R1 model then added a cold-start SFT phase to stabilize the learned traces.
</div>

<div class="optional md" data-headline="R1 = GRPO (the bridge)">
R1's emergent long chain-of-thought is **not magic**. It is what falls out when you apply **Group Relative Policy Optimization** to a base model and reward it for getting verifiable answers right. The full algorithm — group sampling, group-relative advantage, PPO-style clipped objective without a critic — lives in the <a href="reinforcement_learning">Reinforcement Learning chapter</a> § GRPO. If a single line is all you remember: *R1 is what GRPO looks like when you let it run for a million steps on math problems*.
</div>

<div class="md">
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

\citetitle{snell2024testtime} (\citeyear{snell2024testtime}) and others have shown that **inference-time compute scaling** follows a power law similar to training-time scaling:

$$
\text{accuracy}(n) = a \cdot n^b
$$

where $n$ is the number of reasoning tokens or search depth. The exponent $b$ depends on problem difficulty: easy problems saturate quickly, hard problems benefit enormously.

For o1-style reasoning on competition math (approximate values along the curve):
* $n = 100$ tokens: 50% accuracy
* $n = 1{,}000$ tokens: 60% accuracy
* $n = 10{,}000$ tokens: 72% accuracy

Compare this with training: achieving 85% on AIME by training would require either a much larger base model or domain-specific data. **Inference-time scaling is often cheaper and more flexible**.
</div>

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
async function loadReasoningModule() {
	updateLoadingStatus("Loading section about Reasoning & Test-Time Compute...");
	return Promise.resolve();
}
</script>
