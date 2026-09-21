<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Reliability — Calibration & Knowing When to Stop
description: Calibration, aleatoric versus epistemic uncertainty, abstention and conformal prediction — making model confidence trustworthy.
icon: &#127919;
part: 5
order: 17
color: rose
topics: inference, safety, data, philosophy
tags: math-heavy
-->

<div class="md">
A model that is right 95% of the time but **confident when it is wrong** is not a model you can deploy in a hospital, a courtroom, or a cockpit. **Reliability** is the discipline of matching *confidence* to *correctness* — and of knowing when to **decline**. It pairs with the <a href="hallucinations">Hallucinations</a> chapter: there we ask *why models lie*; here we ask *how to make their confidence mean something*.
</div>

<div class="md" data-mathlevel="30" data-optionaltitle="Calibration">
## Calibration

A **calibrated** model says $P(\text{cat}) = 0.9$ only when roughly 90% of its 0.9-cat cases are actually cats. Modern networks are not — they are systematically **over-confident**, especially out of distribution.

The cheap fix is **temperature scaling**: learn a single scalar $T$ and divide the logits by it, stretching the sharp softmax back onto the diagonal. It costs nothing at inference. \cite[Guo et al., 2017]{guo2017calibration}

LLMs expose a related signal. When asked to estimate the chance that they *know* an answer, they track their actual accuracy surprisingly well \cite[Kadavath et al., 2022]{kadavath2022selfknowledge} — **models mostly know what they know**, and that self-assessment is a usable, cheap reliability lever.
</div>

<div class="md">
## Two kinds of uncertainty

\cite[Kendall & Gal, 2017]{kendall2017uncertainties} separate the one uncertainty everyone means into two:

* **Aleatoric** — irreducible noise *in the data* (a blurry photo). More data will not help.
* **Epistemic** — the *model's* ignorance (a species it has never seen). More data *would* help.

The distinction drives safe autonomy: a car should brake for epistemic uncertainty ("I don't know what that is"), not merely aleatoric ("the rain makes this noisy"). **Deep ensembles** — train several networks, average them — cheaply approximate Bayesian uncertainty: they agree in-distribution and **disagree on out-of-distribution input**, which is exactly the disagreement you want as an alarm. \cite[Lakshminarayanan et al., 2017]{lakshminarayanan2017ensembles}
</div>

<div class="md">
## When to stop: abstention & OOD

**Selective prediction** predicts only when confident and **abstains** the rest, trading *coverage* for *risk*. **Out-of-distribution (OOD) detection** is its cousin: flag inputs far from anything seen in training (ensemble disagreement, low similarity to the training manifold) and route them to a human or a fallback. The goal is not to be right everywhere; it is to **know the boundary of where you are allowed to answer**.
</div>

<div class="md" data-mathlevel="40" data-optionaltitle="Conformal prediction: finite-sample guarantees">
## Conformal prediction: finite-sample guarantees

Everything above is empirical. **Conformal prediction** is different: wrap any black-box model in a calibration procedure that outputs a **set** of answers guaranteed to contain the truth with probability $\ge 1-\varepsilon$ — **distribution-free**, no assumptions about the data or the model. It is the rigorous, assumption-light way to hand a user an honest "I'm not sure," and it applies to LLMs, vision, and structured outputs alike. \cite[Angelopoulos & Bates, 2021]{angelopoulos2021conformal}
</div>

<div class="md">
## For LLMs in practice

Combine the tools: **calibrated confidence** + an explicit **"I don't know"** (abstain or defer) + **retrieval to verify** (see <a href="rag">RAG</a>). The target is a system whose confidence you can *trust* under stakes — one that is right when confident, and quiet when it is not.
</div>

<script>
async function loadReliabilityModule() {
	updateLoadingStatus("Loading section about Reliability...");
	return Promise.resolve();
}
</script>
