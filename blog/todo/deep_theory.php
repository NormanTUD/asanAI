<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Why Do Networks Generalize?
description: The open theory of deep learning — double descent, the loss landscape and edge of stability, the NTK, NNGP, implicit bias, and why memorizing data still generalizes.
icon: &#128200;
part: 6
order: 5
color: accent
topics: math-ii, architecture, philosophy, emergence
tags: math-heavy, logic-heavy
math: 75
-->

<div class="md">
The central mystery of deep learning: we can *derive* a network that *memorizes* its training data perfectly, yet it generalizes beautifully to new data. Every textbook bound suggests this should be the worst possible outcome. This chapter is the honest attempt to understand why it isn't — and it has a geometric answer that connects to the <a href="coherent_difference">Coherent Difference chapter</a>. It is worth keeping in mind that the field is still young: Olah called it **ad-hoc**, held together by an extremely successful but not-yet-fundamental tool, with several competing narratives — neuroscience, representations, probability — all making claims about what it really is \cite[Olah, 2015]{colah2015types}.
</div>

<div class="optional md" data-headline="Neighbouring chapters">
* The **empirical law** (scaling) lives in the <a href="frontier">Frontier chapter</a>.
* **How the optimizer navigates** the landscape lives in the <a href="optimizerlab">Optimizer chapter</a>.
* The <a href="overandunderfittinglab">Over- and Underfitting chapter</a> is the classical picture this one revises.
* **What a "space" is**, in the most abstract sense, is the <a href="coherent_difference">Coherent Difference chapter</a>.
</div>

<div class="md" data-mathlevel="55" data-optionaltitle="The classical picture, and why it broke">
## The classical picture, and why it broke

Classical learning rests on the **bias–variance trade-off**: as capacity increases, error follows a U-curve (under-fitting = high bias, over-fitting = high variance). Theory via **VC dimension** and **PAC** bounds says that once capacity exceeds the sample size, the model will just fit the noise. \cite[Belkin et al., 2019]{belkin2019}

Modern networks violate this. They have orders of magnitude more parameters than training examples, yet they generalize. Classical complexity theory does not merely fail to predict this — it predicts the *opposite*. That failure is the whole problem this chapter addresses. It helps to start from what universality does *not* explain: a single hidden layer can be used as a lookup table to fit *any* training data, but being able to fit everything is a very weak claim about generalizing to new inputs \cite[Olah, 2014]{colah2014nlp}.
</div>

<div class="md" data-mathlevel="65" data-optionaltitle="Double descent — and now, a proof">
## Double descent — and now, a proof

The U-curve is incomplete. Past the **interpolation threshold** (where training error first hits zero), test error **rises to a peak and then falls again** — in model size, in data, or in epochs. \cite[Nakkiran et al., 2019]{nakkiran2019deepdd} \cite[Belkin et al., 2019]{belkin2019}

What was once only an empirical curve is now partially *theoremed*. Under an eigenvalue-gap condition, the minimum-norm interpolating solution of linear regression **does** generalize \cite[Bartlett et al., 2019]{bartlett_benign_overfitting} — **interpolation does not imply overfitting**, a phenomenon now called **benign overfitting**. Random-matrix "spiked-covariance" analysis locates the interpolation threshold and the memorization/greenalization boundary in the lazy regime \cite[Montanari et al., 2020]{montanari_interpolation}. The honest limit: every such theorem is for linear, kernel, or *lazy* models — the feature-learning deep net has no matching proof.
</div>

<div class="md" data-mathlevel="70" data-optionaltitle="The loss landscape, and the edge of stability">
## The loss landscape, and the edge of stability

The high-dimensional **loss landscape** is not a swamp of spurious local minima. Distinct minima are **mode-connected**: they sit in one near-barrier-free low-loss region \cite[Draxler et al., 2018]{draxler_mode_connectivity}. And **flatness matters** — flat basins generalize better than sharp ones, which **Sharpness-Aware Minimization** exploits directly \cite[Foret et al., 2021]{foret2021sam}.

There is also a *dynamical* story. With a step size near the stability limit, gradient descent doesn't settle into a minimum — it slides to the **edge of stability**, where the top Hessian eigenvalue creeps up to $2/\eta$ and the iterates start to **oscillate**. This *progressive sharpening* into a chaotic, self-stabilizing phase is now seen as a core driver of learning, not an accident. \cite[Li et al., 2022]{progressive_sharpening} \cite[Agarwala et al., 2022]{edge_of_stability}
</div>

<div class="md" data-mathlevel="70" data-optionaltitle="Two limits of width: NNGP, NTK, and why the NTK is lazy">
## Two limits of width: NNGP, NTK, and why the NTK is *lazy*

The cleanest mathematical handle on a wide network comes from taking width to infinity, and there are **two different limits** \cite[nLab]{nlab_neural_network}:

* **NNGP (at initialization).** A random wide net, viewed as a distribution over functions, is a **Gaussian process** — the network is a fixed kernel on inputs.
* **NTK (during training).** Under infinitesimal gradient descent, training behaves like **kernel regression** with a fixed kernel \cite[Jacot et al., 2018]{jacot2018ntk} — the cleanest proof of *why interpolation can generalize*.

But both are **lazy**: the weights barely move, and the network does *not* learn features. The honest caveat, stated plainly in the reference literature: infinite networks "don't encode abstracted features", and NTK results "start to significantly fail for practical networks" \cite[nLab]{nlab_neural_network}. Real feature learning requires a *different* width scaling, not more of the same \cite[Yang & Hu, 2020]{yang_hu_feature_learning}. The field's most rigorous results all live in the lazy limit; the feature-learning regime that real nets occupy is where the theorems stop.
</div>

<div class="md" data-mathlevel="70" data-optionaltitle="Why simple and spatial solutions win">
## Why simple and *spatial* solutions win

Over-parameterized nets carry an **implicit bias**: gradient descent, with no explicit penalty, still converges to **low-norm / flat** solutions \cite[Arora et al., 2019]{implicit_reg_deep}. They also show a **spectral bias** — learning low frequencies before high-frequency detail \cite[Rahaman et al., 2019]{rahaman2019spectral}.

The deepest geometric signature is **neural collapse**: in the terminal phase of training, class means collapse to the vertices of a tight simplex while features become equi-angular \cite[Papyan et al., 2020]{neural_collapse}. The network has organized its features into a *coherent geometric structure* — the data carved into a space whose shape is stable.

This is the book's own thesis applied to networks: a model generalizes when it learns the data **as coherent difference** — a geometry of local relations that glue into a global whole (\cite[Coherent Difference]{coherent_difference}). Once the space is learned, a new example is simply a *point that lands in it*. Generalization is not magic; it is the data falling into place inside a structure the net has already built. \cite[Roberts, Yaida & Hanin, 2021]{principles_dl_theory}

The same idea has a sharp **quantitative** form in *population geometry*. For a population of
neurons feeding a linear readout of tasks that share a common latent structure,
\cite[Wakhloo, Slatton & Chung, 2024]{wakhloo2024population} show the generalization error is
governed by exactly three measurable statistics — the **correlation** between neurons and the
latent factors, the **alignment** (how orthogonal each factor's coding direction is to the
noise), and the **dimensionality** (participation ratio) of the response — and that the
*optimal* code is a **disentangled** one: each latent factor along its own orthogonal
direction. The variance spent on the weaker factors then tracks the data budget: compressed
when data is scarce, expanded when it is abundant. Remarkably, the *same* signature — **lower
pair-wise correlation** and **greater input-separation** in the population — is what plasticity
rules do inside an *untrained, recurrent* reservoir to raise prediction accuracy
\cite[Morales, Mirasso & Soriano, 2021]{morales2021reservoir}. So whether you optimize a
feed-forward net or let a reservoir settle near the edge of instability, "separate the factors,
decorrelate the neurons" is a recurring geometric recipe for generalization — a concrete,
measurable cousin of the coherent-difference thesis above.
</div>

<div class="md" data-mathlevel="60" data-optionaltitle="Three lenses that (partially) explain it">
## Three lenses that (partially) explain it

No single lens suffices; the three most-developed partial accounts:

* **The kernel / NTK lens.** Infinite-width gradient descent $\approx$ kernel regression — the cleanest proof that *interpolating* solutions can generalize \cite[Jacot et al., 2018]{jacot2018ntk}.
* **The sparsity lens (Lottery Ticket).** Dense nets contain sparse "winning tickets" that, trained in isolation, match the whole net — evidence that generalization rides on a small, well-structured subnetwork \cite[Frankle & Carbin, 2019]{frankle2019lottery}.
* **The phase-transition lens (Grokking).** Generalization can arrive as a *sudden* transition long after memorization — modeled as a representation-learning phase transition, closely tied to **induction heads** emerging abruptly \cite[Power et al., 2022]{power2022grokking} \cite[Liu et al., 2022]{grokking_effective}.
</div>

<div class="md" data-mathlevel="70" data-optionaltitle="A single mechanism: the eNTK splits signal from noise">
## A single mechanism: the eNTK splits signal from noise

The lenses above each carry their own tool. A recent line of work argues the phenomena are in fact *one* mechanism seen from different angles, and locates it entirely in **output space** rather than parameter space. \cite[Litman & Guo (2026)]{litman2026theory} start from the empirical neural tangent kernel $K_{SS} = J_S J_S^\top$ — the Jacobian of every output against every parameter (\cite[Jacot et al., 2018]{jacot2018ntk}) — and integrate it along the training trajectory. Its eigen-decomposition splits the output space into two parts: a **signal channel**, where the kernel's eigenvalues are large and training *dissipates* error, and a **reservoir**, where the eigenvalues sit near zero and training dissipated almost nothing. The load-bearing claim is that the operator which carries training progress out to the test set **vanishes on the reservoir** — so whatever the network memorized there is, by construction, *invisible at test time*.

That one sentence is the theory. **Benign overfitting** is noise parked in the reservoir at interpolation. **Double descent** is the same noise *crossing between* the reservoir and the channel as capacity sweeps the interpolation threshold: it enters the channel and test error spikes, then is re-absorbed. **Implicit bias** is the spectral *schedule* — gradient flow fills the channel from the largest kernel eigenvalue down, learning high-mobility modes first and low-mobility modes last. **Grokking** is *signal* migrating from the reservoir into the channel as the kernel itself evolves, so a rule that was unreachable becomes learnable only late in training (\cite[see Litman, 2026]{litman2026a_theory_of_dl}).

Two honest caveats. First, this is a 2026 preprint — one of the several competing narratives, not settled consensus — and its headline, a proof that survives the **feature-learning** regime (the kernel moving $\mathcal{O}(1)$ in operator norm, not frozen as the NTK theorems require), is precisely the gap the sections above flagged as unsolved: a strong claim, not yet established. Second, the account ships a concrete, falsifiable by-product — a "population-risk" rule that reads out each parameter's signal-to-noise ratio and skips updates below it, an SNR preconditioner on Adam that the authors report accelerates grokking $\sim5\times$ and suppresses memorization (\cite[Litman & Guo, 2026]{litman2026theory}).
</div>

<div class="md" data-mathlevel="55" data-optionaltitle="The honest state of the art">
## The honest state of the art

A short list of what is *still* not settled. The deepest item is the **lazy/feature-learning gap**: the rigorous results above hold for kernels that barely move, while real nets feature-learn. \cite[Litman & Guo (2026)]{litman2026theory} claim to close it with a proof that survives the kernel moving $\mathcal{O}(1)$ in operator norm — the strongest such claim to date, but a recent preprint among several competing narratives, not yet consensus. Otherwise, double descent still has no *independent* deep-nonlinear proof; "flat minima generalize" remains a correlate, not a proven cause (reaching *very* flat regions early can even hurt); and no generalization bound that is both valid and *tight* for real nets exists. That divide — between elegant infinite-width theory and the non-linear scaling of real networks — remains the field's **central open problem**, exactly the question the <a href="coherent_world_models">Coherent World Models</a> chapter takes up.
</div>

<script>
async function loadDeepTheoryModule() {
	updateLoadingStatus("Loading section about Why Do Networks Generalize?...");
	return Promise.resolve();
}
</script>