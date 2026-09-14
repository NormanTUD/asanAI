<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Why Do Networks Generalize?
description: The open theory of deep learning — double descent, loss landscapes, the NTK, lottery tickets, and why memorizing data still generalizes.
icon: &#128200;
part: 6
order: 5
color: accent
topics: math-ii, architecture, philosophy, emergence
-->

<div class="md">
The central mystery of deep learning: we can *derive* a network that *memorizes* its training data perfectly, yet it generalizes beautifully to new data. Every textbook theorem suggests this should be the worst possible outcome. This chapter is the honest attempt to understand why it isn't.
</div>

<div class="optional md" data-headline="Neighbouring chapters">
* The **empirical law** (scaling) lives in the <a href="frontier">Frontier chapter</a>.
* **How the optimizer navigates** the landscape lives in the <a href="optimizerlab">Optimizer chapter</a>.
* The <a href="overandunderfittinglab">Over- and Underfitting chapter</a> is the classical picture this one revises.
</div>

<div class="md">
## The classical picture, and why it broke

Classical learning rests on the **bias–variance trade-off**: as capacity increases, error follows a U-curve (under-fitting high bias, over-fitting high variance). Theory via **VC dimension** and **PAC** bounds suggests that if capacity exceeds sample size, the model will just fit the noise. \cite[Belkin et al., 2019]{belkin2019}

Modern networks violate this. They have orders of magnitude more parameters than training examples, yet they generalize beautifully.
</div>

<div class="md">
## Double descent

The U-curve is incomplete. Beyond the **interpolation threshold** (where training error hits zero), test error **rises to a peak and then falls again**:

$$
\text{test error} \;\approx\; \underbrace{\text{descent}}_{\text{under-parameterized}}
\;\to\; \underbrace{\text{peak}}_{\text{interpolation threshold}}
\;\to\; \underbrace{\text{second descent}}_{\text{over-parameterized}}
$$

This **double descent** — in model size, data, or epochs — is a fundamental feature of the over-parameterized regime, where **interpolation and generalization coexist** in what is called **benign overfitting**. \cite[Nakkiran et al., 2019]{nakkiran2019deepdd} \cite[Belkin et al., 2019]{belkin2019}
</div>

<div class="md">
## The loss landscape

The high-dimensional **loss landscape** is not a trap of spurious local minima. Instead, optimizers largely ride **low-loss manifolds**, and distinct minima are **mode-connected** via low-loss paths. Crucially, **flatness matters**: flat basins (low loss across a neighborhood) generalize better than sharp ones. \cite[Foret et al., 2020]{foret2021sam}

**Sharpness-Aware Minimization (SAM)** explicitly optimizes for this flatness, measurably improving performance across vision and language models. \cite[Foret et al., 2020]{foret2021sam}
</div>

<div class="md">
## Why simple functions win

Over-parameterized nets carry a learned **inductive bias** toward **simple, low-frequency** solutions. ReLU networks, for instance, exhibit a **spectral bias**, learning low frequencies before attempting high-frequency detail. \cite[Rahaman et al., 2019]{rahaman2019spectral} This bias is an emergent property of the architecture and optimizer working together.
</div>

<div class="md">
## Two theories that (partially) explain it

* **Neural Tangent Kernel (NTK):** In the infinite-width limit, gradient descent on a wide network behaves like kernel regression with a fixed kernel. \cite[Jacot et al., 2018]{jacot2018ntk} It is the cleanest mathematical handle on *why interpolation can generalize*.
* **Lottery Ticket Hypothesis:** Dense networks contain sparse 'winning tickets' — subnetworks that, when trained in isolation, match the original performance. \cite[Frankle & Carbin, 2019]{frankle2019lottery}
* **Grokking:** Generalization can emerge as a sudden phase transition long after the network appears to have memorized the training data. \cite[Power et al., 2022]{power2022grokking} \cite[Nanda et al., 2023]{nanda2023grokking}
</div>

<div class="md">
## The honest state of the art

No single theorem explains generalization. The gap between elegant kernel theory (infinite width) and the real, non-linear scaling of modern networks is the field's **central open problem**. Scaling laws provide the *empirical* answer; we are still waiting for the *theoretical* reason. This is the question addressed in <a href="coherent_world_models">Coherent World Models</a>.
</div>

<script>
async function loadDeepTheoryModule() {
	updateLoadingStatus("Loading section about Why Do Networks Generalize?...");
	return Promise.resolve();
}
</script>
<script>
async function loadDeepTheoryModule() {
	updateLoadingStatus("Loading section about Why Do Networks Generalize?...");
	return Promise.resolve();
}
</script>
