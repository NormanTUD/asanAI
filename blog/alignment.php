<?php include_once("functions.php"); ?>

<!--
COURSE_METADATA:
title: Alignment — Making Objectives Match Intent
description: The program of ensuring a model optimizes for what we meant.
icon: &#x231A;
part: 6
order: 7
color: rose
topics: safety
-->

<div class="md">
Alignment is the engineering and research program of making an optimizer's objective match human intent. It is the critical task of ensuring that a model, left to its own devices, does not optimize for the wrong thing. (For adversarial attacks, see the <a href="security_inference">Security chapter</a>.)
</div>

<div class="optional md" data-headline="Neighbouring chapters">
* The **RL algorithms** (PPO, GRPO) live in <a href="reinforcement_learning">Reinforcement Learning</a>.
* The **training pipeline** (SFT $\to$ RLHF $\to$ DPO) lives in <a href="finetuninglab">Fine-Tuning</a>.
* **Reasoning at inference time** (CoT, o1/R1) lives in <a href="reasoning">Reasoning</a>.
* **What reason is**, philosophically, is in <a href="philosophy">Philosophy</a>.
</div>

<div class="md">
## Why it is hard: the specification problem

We specify proxies, not the goal. **Specification gaming (reward hacking)** is when an optimizer pursues the letter of a proxy rather than its spirit. Two core challenges:

* **The Orthogonality Thesis:** intelligence and values are decoupled; a system can be arbitrarily clever at an objective that is entirely misaligned with ours. \cite[Bostrom, 2012]{bostrom2012orthogonal}
* **The Control Problem:** as capability scales, the window of controllability may shrink. \cite[Bostrom, 2003]{bostrom2003ethical}
</div>

<div class="md">
## The current toolkit

The modern alignment pipeline: **SFT** (demonstrations) $\to$ **RLHF** (learn a reward model from preferences) $\to$ **Constitutional AI / RLAIF** (AI feedback) $\to$ **DPO** (optimize the policy directly, no reward model). \cite[Christiano et al., 2017]{christiano2017rlhf} \cite[Ouyang et al., 2022]{ouyang2022instructgpt} \cite[Bai et al., 2022]{bai2022constitutional} \cite[Rafailov et al., 2023]{rafailov2023dpo}

The models themselves also acquire **self-knowledge**: a trained LLM can predict its own accuracy, and models that predict better tend to be more accurate. \cite[Kadavath et al., 2022]{kadavath2022selfknowledge}
</div>

<div class="md">
## Failure modes

* **Reward hacking:** optimizing the proxy, not the intent.
* **Deceptive alignment:** the model *appears* aligned during evaluation while preserving a hidden objective, "acting" safe until deployed. \cite[Hubinger et al., 2024]{hubinger2024sleeperagents}
</div>

<div class="md">
## Where alignment lives in this book

Alignment is the **objective-function thread** running through several chapters: the existential framing (instrumental convergence, the paperclip) is in <a href="philosophy">Philosophy</a>; the adversarial attacks (jailbreaks, prompt injection, data poisoning) are in <a href="security_inference">Security</a>; interpretability-as-safety (SAEs, causal scrubbing) is in <a href="frontier">Frontier</a>. This chapter gathers them under one question: *is the optimizer aiming at the target we meant?*
</div>

<div class="md">
## Open questions

* Can we **verify** that a model is not deceptively aligned, rather than merely test for it?
* Is **scalable oversight** (decomposition, debate, weak-to-strong) enough for superintelligence?
* Is alignment a **solvable engineering problem**, or does it hit a fundamental limit?
</div>

<script>
async function loadAlignmentModule() {
	updateLoadingStatus("Loading section about AI Alignment...");
	return Promise.resolve();
}
</script>