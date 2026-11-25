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

<div class="md" data-mathlevel="30">
## Confidence and uncertainty

### Calibration

A **calibrated** model says $P(\text{cat}) = 0.9$ only when roughly 90% of its 0.9-cat cases are actually cats. Modern networks are not — they are systematically **over-confident**, especially out of distribution.

The cheap fix is **temperature scaling**: learn a single scalar $T$ and divide the logits by it, stretching the sharp softmax back onto the diagonal. It costs nothing at inference. (\cite[Guo et al., 2017]{guo2017calibration})

LLMs expose a related signal. Asked for the probability that a proposed answer is true ($P(\text{True})$), larger models are reasonably calibrated on multiple-choice and true/false items, and the signal improves with scale (\cite[Kadavath et al., 2022]{kadavath2022selfknowledge}). Their direct "do I know this?" estimate ($P(\text{IK})$) generalises less reliably to new tasks, so it is a usable but not a free reliability lever.
</div>

<div class="md">
### Two kinds of uncertainty

\cite[Kendall & Gal (2017)]{kendall2017uncertainties} separate the one uncertainty everyone means into two:

* **Aleatoric** — irreducible noise *in the data* (a blurry photo). More data will not help.
* **Epistemic** — the *model's* ignorance (a species it has never seen). More data *would* help.

The distinction drives safe autonomy: a car should brake for epistemic uncertainty ("I don't know what that is"), not merely aleatoric ("the rain makes this noisy"). **Deep ensembles** — train several networks, average them — approximate Bayesian uncertainty at the cost of training $M$ models: they agree in-distribution and **disagree on out-of-distribution input**, which is exactly the disagreement you want as an alarm. (\cite[Lakshminarayanan et al., 2017]{lakshminarayanan2017ensembles})
</div>

<div class="md">
## Knowing when to decline

### When to stop: abstention & OOD

**Selective prediction** predicts only when confident and **abstains** the rest, trading *coverage* for lower *risk*. **Out-of-distribution (OOD) detection** is its cousin: flag inputs far from anything seen in training (ensemble disagreement, low similarity to the training manifold) and route them to a human or a fallback. The goal is not to be right everywhere; it is to **know the boundary of where you are allowed to answer**.
</div>

<div class="md" data-mathlevel="40">
### Conformal prediction: finite-sample guarantees

Everything above is empirical. **Conformal prediction** is different: wrap any black-box model in a calibration procedure that outputs a **set** of answers with a marginal coverage guarantee of at least $1-\varepsilon$, averaged over exchangeable calibration and test draws. It is **distribution-free** in the sense that it assumes only exchangeability — not a particular data distribution or model class. It is the rigorous, assumption-light way to hand a user an honest "I'm not sure," and it applies to LLMs, vision, and structured outputs alike. (\cite[Angelopoulos & Bates, 2021]{angelopoulos2021conformal})
</div>

<div class="md">
Post-hoc calibration is older than deep learning. Platt introduced a sigmoid fit that maps an SVM's margin to a probability, learned on held-out data (\cite[Platt, 1999]{platt1999probabilistic}). Guo et al. later compared this and other post-hoc methods on modern networks and found temperature scaling — a single scalar dividing the logits — the best simple trade-off between calibration and accuracy (\cite[Guo et al., 2017]{guo2017calibration}). Neither method changes the ranking of predictions; they only make the scores mean what they say.

Selective classification turns abstention into a measurable contract. Geifman and El-Yaniv give a procedure that, given a trained network and a target risk, rejects test instances until the remaining predictions meet that risk with high probability (\cite[Geifman & El-Yaniv, 2017]{geifman2017selective}). The output is a risk–coverage curve: you choose how much of the input distribution the system is allowed to answer.

Conformal prediction was developed by Vovk and colleagues as a way to put finite-sample guarantees on sequential predictions (\cite[Vovk et al., 2005]{vovk2005algorithmic}). Split conformal prediction later made it practical: hold out a calibration set, compute a nonconformity score for each example, and use the empirical quantile of those scores to build the test set (\cite[Angelopoulos & Bates, 2021]{angelopoulos2021conformal}). The guarantee is marginal and distribution-free only under exchangeability. For language generation the score is the hard part; Quach et al. construct conformal sets of sequences and show how the coverage–efficiency trade-off behaves in practice (\cite[Quach et al., 2023]{quach2023conformal}).

## Red-teaming and safety evaluation

Red-teaming is evaluation with an adversary. Perez et al. showed that one language model can generate test cases that make another model produce harmful replies, scaling the search far beyond hand-written probes (\cite[Perez et al., 2022]{perez2022redteaming}). Wei et al. taxonomise why safety training fails — competing objectives and mismatched generalisation — and Mazeika et al. standardise the attacks and defences so results are comparable across models (\cite[Wei et al., 2024]{wei2024jailbroken}; \cite[Mazeika et al., 2024]{mazeika2024harmbench}). Safety evaluation is broader than jailbreaks: Weidinger et al. argue for measuring capability, human interaction and systemic risk together, because a model that passes a toxicity filter can still cause harm in deployment (\cite[Weidinger et al., 2023]{weidinger2023sociotechnical}).

## For LLMs in practice

Combine the tools: **calibrated confidence** + an explicit **"I don't know"** (abstain or defer) + **retrieval to verify** (see <a href="rag">RAG</a>). The target is a system whose confidence you can *trust* under stakes — one that is right when confident, and quiet when it is not.
</div>

<script>
async function loadReliabilityModule() {
	updateLoadingStatus("Loading section about Reliability...");
	return Promise.resolve();
}
</script>

<div class="mn-quiz" data-quiz="reliability"><script type="application/json">{"title": "Calibration and reliability", "questions": [{"q": "What does it mean that a model is well calibrated?", "options": ["When it says 80 % confident, it is right about 80 % of the time", "It gives the correct answer on every question, without any exceptions", "It reports 50 % confidence for every question asked of it", "It returns answers faster than an uncalibrated model of the same size"], "answer": 0, "explain": "Calibration matches stated confidence to observed accuracy."}, {"q": "What is the difference between aleatoric and epistemic uncertainty?", "options": ["Aleatoric is noise in the world; epistemic is the model's lack of knowledge", "They are the same thing: both name irreducible randomness in the data", "Aleatoric can be fixed with more data, while epistemic cannot be reduced at all", "Epistemic exists only in images; aleatoric exists only in text tasks"], "answer": 0, "explain": "More data reduces epistemic uncertainty; aleatoric uncertainty remains."}, {"q": "What does conformal prediction provide?", "options": ["Prediction sets that contain the true answer with a guaranteed probability", "A single best answer, together with a separate point estimate of its confidence", "Faster training, by skipping examples the model already predicts well", "Better tokenization, by merging rare tokens into much more common ones"], "answer": 0, "explain": "With a calibration set, it gives finite-sample coverage guarantees under mild assumptions."}, {"q": "What is abstention?", "options": ["Letting the model decline to answer when it is too uncertain", "Removing uncertain examples from the training data before fitting", "Skipping layers that barely affect the final prediction", "Refusing every question, regardless of how confident the model is"], "answer": 0, "explain": "Trading coverage for accuracy is often the right choice in high-stakes settings."}]}</script></div>
