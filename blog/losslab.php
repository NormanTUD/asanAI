<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Loss: Teaching through Failure
description: How models know they're wrong, MSE, cross-entropy, and the mathematics of measuring error.
icon: &#127919;
part: 2
order: 1
color: coral
topics: training, math-i, programming
tags: math-heavy, code-heavy
-->

<div class="md">
In the previous section, we saw how AI represents data as **Tensors**. But how does a model actually learn to give the right answer? It uses a **Loss Function**.

A Loss Function is a mathematical way of measuring *“how wrong”* the AI is. If the AI's guess is far from the truth, the Loss is a high number. If the guess is perfect, the Loss is zero. Training an AI is essentially the process of turning knobs (parameters) to make this Loss number *as small as possible*.
</div>

<div class="md" data-mathlevel="50">
## Regression: Mean Squared Error (MSE)

When we want the AI to predict a specific number, like the price of a house or the temperature tomorrow, we use **Regression**. The most common tool here is **Mean Squared Error (MSE)**, first published by \citeauthor{legendre1805} in \citeyear{legendre1805} (for fitting celestial orbits) and independently developed by \citeauthor{gauss1809} in \citeyear{gauss1809} (§ 179, 213).

For a single example the error is $(y_{\text{target}} - \hat{y}_{\text{pred}})^2$; the **mean** squared error averages this over the whole batch:

$$\text{MSE} = \frac{1}{N} \sum_{i=1}^{N} (y_i - \hat{y}_i)^2$$

(Textbooks and the Backpropagation chapter sometimes scale the sum by an extra factor $\frac{1}{2}$ for algebraic convenience; the location of the minimum is unchanged.)

In the plot below, the loss creates a “bowl” shape. To train the AI, we calculate the **slope** (the derivative). If the slope is negative, the AI needs to increase its guess. If the slope is positive, it needs to decrease it.
</div>

<style>
#mse-lab, #ce-lab { --lab-accent: var(--mn-accent); --lab-accent-2: var(--mn-rose); }
#ce-lab { --lab-accent: var(--mn-coral); --lab-accent-2: var(--mn-rose); }
.ll-plot { width: 100%; height: 320px; }
#mse-lab .mnlab-stat[data-tone="bad"] .v, #ce-lab .mnlab-stat[data-tone="bad"] .v { color: var(--mn-rose); }
#ce-lab .mnlab-stat[data-tone="good"] .v { color: var(--mn-emerald); }
#ce-lab .ce-table { display: grid; gap: 8px; }
#ce-lab .ce-head, #ce-lab .ce-row {
	display: grid; grid-template-columns: 6.5ch minmax(0, 1.3fr) 2ch minmax(0, 1fr) 5.5ch;
	align-items: center; gap: 10px;
}
#ce-lab .ce-head { font-size: .66rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--mn-text-muted); }
#ce-lab .ce-row { padding: 6px 8px; border-radius: 10px; border: 1px solid transparent; transition: background .3s ease, border-color .3s ease; }
#ce-lab .ce-row.is-target { border-color: color-mix(in srgb, var(--mn-emerald) 45%, transparent); background: color-mix(in srgb, var(--mn-emerald) 8%, transparent); }
#ce-lab .ce-name { font-weight: 700; color: var(--mn-heading); white-space: nowrap; }
#ce-lab .ce-track { position: relative; height: 18px; border-radius: 6px; background: color-mix(in srgb, var(--mn-text-muted) 12%, transparent); overflow: hidden; }
#ce-lab .ce-p {
	position: absolute; inset: 0 auto 0 0; width: 0; border-radius: 6px;
	background: linear-gradient(90deg, var(--mn-coral), var(--mn-rose));
	transition: width .35s cubic-bezier(.2, .8, .2, 1);
}
#ce-lab .ce-row.is-target .ce-p { background: linear-gradient(90deg, var(--mn-emerald), var(--mn-sky)); }
#ce-lab .ce-pv { position: absolute; right: 6px; top: 0; line-height: 18px; font-family: var(--mn-font-mono); font-size: .72rem; font-weight: 700; color: var(--mn-heading); }
#ce-lab .ce-y { font-family: var(--mn-font-mono); font-weight: 700; text-align: center; color: var(--mn-text-secondary); }
#ce-lab .ce-row.is-target .ce-y { color: var(--mn-emerald); }
#ce-lab .ce-gtrack { position: relative; height: 18px; border-radius: 6px; background: color-mix(in srgb, var(--mn-text-muted) 8%, transparent); }
#ce-lab .ce-gtrack::before { content: ""; position: absolute; left: 50%; top: -3px; bottom: -3px; border-left: 1px solid var(--mn-text-muted); opacity: .6; }
#ce-lab .ce-g { position: absolute; top: 3px; bottom: 3px; width: 0; left: 50%; border-radius: 4px; background: var(--mn-rose); transition: width .35s ease, left .35s ease; }
#ce-lab .ce-g.is-neg { background: var(--mn-emerald); }
#ce-lab .ce-gv { font-family: var(--mn-font-mono); font-size: .72rem; font-weight: 600; color: var(--mn-text-secondary); text-align: right; }
#ce-lab .ce-logits { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px 18px; }
@container mnlab (max-width: 620px) {
	.ll-plot { height: 260px; }
	#ce-lab .ce-logits { grid-template-columns: minmax(0, 1fr); }
	#ce-lab .ce-head, #ce-lab .ce-row { grid-template-columns: 6ch minmax(0, 1fr) 2ch minmax(0, .8fr) 5ch; gap: 6px; }
}
</style>

<div class="mnlab" id="mse-lab" data-interactive>
	<div class="mnlab-head">
		<div>
			<div class="mnlab-kicker">Interactive lab</div>
			<div class="mnlab-title">The Loss Bowl</div>
			<p class="mnlab-sub">Set the truth, move the guess, and let the slope of the loss pull the prediction home. Compare squared and absolute error.</p>
		</div>
		<div class="mnlab-chips" role="group" aria-label="Loss function">
			<button type="button" class="mnlab-chip" data-mode="mse" aria-pressed="true">Squared (y − ŷ)²</button>
			<button type="button" class="mnlab-chip" data-mode="mae" aria-pressed="false">Absolute |y − ŷ|</button>
		</div>
	</div>
	<div class="mnlab-well" style="padding: 6px 4px 2px;">
		<div class="ll-plot" data-ml="plot" data-plot-theme="self"></div>
	</div>
	<div class="mnlab-legend" style="margin: 8px 2px 0;">
		<span><i style="background: var(--mn-accent);"></i>loss of the chosen function</span>
		<span><i style="background: repeating-linear-gradient(90deg, var(--mn-text-muted) 0 3px, transparent 3px 6px);"></i>the other loss, for comparison</span>
		<span><i style="background: repeating-linear-gradient(90deg, var(--mn-emerald) 0 5px, transparent 5px 8px);"></i>slope at the guess</span>
	</div>
	<div class="mnlab-grid mnlab-grid--3" style="margin-top: 14px; gap: 6px 22px;">
		<label class="mnlab-ctrl">
			<span class="mnlab-ctrl-top"><span class="mnlab-label">Truth</span><span class="mnlab-val" data-ml="yv">y</span></span>
			<input type="range" data-ml="y" min="0" max="10" step="0.5" value="7" aria-label="Target value y">
		</label>
		<label class="mnlab-ctrl">
			<span class="mnlab-ctrl-top"><span class="mnlab-label">AI guess</span><span class="mnlab-val" data-ml="yhv">ŷ</span></span>
			<input type="range" data-ml="yh" min="0" max="10" step="0.01" value="2" aria-label="Prediction y hat">
		</label>
		<label class="mnlab-ctrl">
			<span class="mnlab-ctrl-top"><span class="mnlab-label">Learning rate</span><span class="mnlab-val" data-ml="lrv">η</span></span>
			<input type="range" data-ml="lr" min="0.02" max="0.9" step="0.01" value="0.15" aria-label="Learning rate">
		</label>
	</div>
	<div class="mnlab-row" style="margin-top: 10px;">
		<button type="button" class="mnlab-btn" data-ml="step">One gradient step</button>
		<button type="button" class="mnlab-btn mnlab-btn--ghost" data-ml="run">▶ Train</button>
		<button type="button" class="mnlab-btn mnlab-btn--ghost" data-ml="reset">↺ Reset</button>
	</div>
	<div class="mnlab-grid mnlab-grid--4" style="margin-top: 14px;">
		<div class="mnlab-stat"><span class="k">Error y − ŷ</span><span class="v" data-ml="err">–</span></div>
		<div class="mnlab-stat"><span class="k">Loss</span><span class="v" data-ml="loss">–</span></div>
		<div class="mnlab-stat"><span class="k">Slope ∂L/∂ŷ</span><span class="v" data-ml="grad">–</span></div>
		<div class="mnlab-stat"><span class="k">Next guess</span><span class="v" data-ml="next">–</span></div>
	</div>
	<div class="mnlab-note" data-ml="note" aria-live="polite"></div>
</div>

<div class="md" data-mathlevel="48">
## Classification: Cross-Entropy

When an AI has to choose between categories (like “Cat” vs “Dog”), it doesn't just pick one; it outputs a **probability** for each. This is represented as a vector where all numbers add up to $1.0$ ($100\%$).

**Cross-Entropy Loss** looks at the probability the AI gave to the *correct* answer. 
* If the AI is $99\%$ sure it's a cat (and it is), the loss is almost $0$.
* If the AI is only $1\%$ sure it's a cat, the loss becomes **extremely high**.

The math uses a *logarithm* ($-\ln(P)$), which creates a steep “wall” as confidence approaches zero. This forces the AI to be very “uncomfortable” when it is wrong.
</div>

<div class="mnlab" id="ce-lab" data-interactive>
	<div class="mnlab-head">
		<div>
			<div class="mnlab-kicker">Interactive lab</div>
			<div class="mnlab-title">Cross-Entropy Playground</div>
			<p class="mnlab-sub">The network outputs three raw scores (logits). Softmax turns them into probabilities, and the loss only asks one question: how much probability went to the right answer?</p>
		</div>
		<div class="mnlab-chips" role="group" aria-label="Correct class">
			<button type="button" class="mnlab-chip" data-target="0" aria-pressed="true">🐱 truth: cat</button>
			<button type="button" class="mnlab-chip" data-target="1" aria-pressed="false">🐶 dog</button>
			<button type="button" class="mnlab-chip" data-target="2" aria-pressed="false">🐦 bird</button>
		</div>
	</div>

	<div class="ce-logits">
		<label class="mnlab-ctrl">
			<span class="mnlab-ctrl-top"><span class="mnlab-label">🐱 logit z<sub>cat</sub></span><span class="mnlab-val" data-ce="zv0">0</span></span>
			<input type="range" data-ce="z0" min="-5" max="5" step="0.05" value="-0.5" aria-label="Logit cat">
		</label>
		<label class="mnlab-ctrl">
			<span class="mnlab-ctrl-top"><span class="mnlab-label">🐶 logit z<sub>dog</sub></span><span class="mnlab-val" data-ce="zv1">0</span></span>
			<input type="range" data-ce="z1" min="-5" max="5" step="0.05" value="1.6" aria-label="Logit dog">
		</label>
		<label class="mnlab-ctrl">
			<span class="mnlab-ctrl-top"><span class="mnlab-label">🐦 logit z<sub>bird</sub></span><span class="mnlab-val" data-ce="zv2">0</span></span>
			<input type="range" data-ce="z2" min="-5" max="5" step="0.05" value="0.4" aria-label="Logit bird">
		</label>
	</div>

	<div class="mnlab-grid mnlab-grid--2" style="margin-top: 14px; align-items: stretch;">
		<div class="mnlab-well">
			<div class="ce-table">
				<div class="ce-head"><span>class</span><span>softmax ŷ</span><span>y</span><span style="grid-column: span 2;">gradient ŷ − y</span></div>
				<div class="ce-row" data-ce="row0"><span class="ce-name">🐱 cat</span><span class="ce-track"><span class="ce-p"></span><span class="ce-pv"></span></span><span class="ce-y"></span><span class="ce-gtrack"><span class="ce-g"></span></span><span class="ce-gv"></span></div>
				<div class="ce-row" data-ce="row1"><span class="ce-name">🐶 dog</span><span class="ce-track"><span class="ce-p"></span><span class="ce-pv"></span></span><span class="ce-y"></span><span class="ce-gtrack"><span class="ce-g"></span></span><span class="ce-gv"></span></div>
				<div class="ce-row" data-ce="row2"><span class="ce-name">🐦 bird</span><span class="ce-track"><span class="ce-p"></span><span class="ce-pv"></span></span><span class="ce-y"></span><span class="ce-gtrack"><span class="ce-g"></span></span><span class="ce-gv"></span></div>
			</div>
			<p class="mnlab-hint" style="margin: 12px 0 0;">Green gradient = this logit will be raised by training, red = lowered. Training subtracts η · (ŷ − y) from every logit.</p>
		</div>
		<div class="mnlab-well" style="padding: 6px 4px 2px;">
			<div class="ll-plot" data-ce="plot" data-plot-theme="self" style="height: 250px;"></div>
		</div>
	</div>

	<div class="mnlab-row" style="margin-top: 12px; justify-content: space-between;">
		<div class="mnlab-row">
			<button type="button" class="mnlab-btn" data-ce="step">One training step</button>
			<button type="button" class="mnlab-btn mnlab-btn--ghost" data-ce="run">▶ Train</button>
			<button type="button" class="mnlab-btn mnlab-btn--ghost" data-ce="reset">↺ Reset</button>
		</div>
		<label class="mnlab-ctrl" style="min-width: 180px; flex: 0 1 240px;">
			<span class="mnlab-ctrl-top"><span class="mnlab-label">Learning rate</span><span class="mnlab-val" data-ce="lrv">η</span></span>
			<input type="range" data-ce="lr" min="0.1" max="3" step="0.1" value="1" aria-label="Learning rate">
		</label>
	</div>

	<div class="mnlab-grid mnlab-grid--4" style="margin-top: 12px;">
		<div class="mnlab-stat"><span class="k">Prediction</span><span class="v" data-ce="pred">–</span></div>
		<div class="mnlab-stat"><span class="k">p(correct)</span><span class="v" data-ce="pt">–</span></div>
		<div class="mnlab-stat"><span class="k">Loss −ln p</span><span class="v" data-ce="loss">–</span></div>
		<div class="mnlab-stat"><span class="k">Surprise</span><span class="v" data-ce="bits">–</span></div>
	</div>
	<div class="mnlab-note" data-ce="note" aria-live="polite"></div>
</div>

<div class="md">
## Beware of Goodhart's Law

\citealternativetitle{goodhartslaw} (p. 116) states that every measure which becomes a target becomes a bad measure. That is, 
when we focus solely on optimizing a single metric, we often lose sight of the actual goal. 
In the context of Language Models, this manifests as the gap between “Loss” and “True Intelligence.”

While a model is trained to minimize **Loss** (predicting the next token), a low loss doesn't 
inherently mean the model is “smart” or “truthful.” If we only optimize for mathematical 
probability, we risk creating a “Stochastic Parrot”, a model that is statistically perfect 
but logically hollow, or worse, one that learns to “game” the benchmarks.

To truly evaluate success, we must look beyond the loss curve and use diverse benchmarks:
* **Perplexity:** Measures how well the model predicts a sample, but it can be misleadingly low 
if the model just memorizes data.
* **Benchmarks (MMLU, HumanEval):** Tests for reasoning and coding, though even these can
fall victim to Goodhart's Law if the test data “leaks” into the training set.
* **Human Evaluation:** Ultimately, the best version of an Language Models is determined by whether
it is actually helpful, safe, and accurate in real-world use.
</div>

<div class="optional md" data-headline="The benchmarks themselves are Goodhart targets">
See the <a href="evaluation">Evaluation & Benchmarks chapter</a> for the full tour of MMLU, HumanEval, GSM8K, and the contamination crisis. The disease named here has many symptoms; that chapter is where you see them.
</div>

<div class="optional md" data-headline="The Mathematical Modeling of Loss">
In the study \citetitle{hoffmann2022chinchilla}, the researchers estimated optimal performance by decomposing the loss function $L$. They proposed that the loss of a language model can be described as a function of the number of parameters $N$ and the number of training tokens $D$:

$$L(N, D) = E + \frac{A}{N^\alpha} + \frac{B}{D^\beta}$$

In this equation:
* $E$: Represents the “irreducible loss” (the theoretical minimum error that remains even with infinite data and parameters).
* $A, B, \alpha, \beta$: Are constants determined through empirical data fitting on over 400 models.

By minimizing this function under the constraint of a fixed compute budget $C \approx 6ND$, the study concluded that for compute-optimal scaling, $N$ and $D$ must be increased in equal proportions (\cite[Hoffmann et al., 2022]{hoffmann2022chinchilla}).
</div>

<div class="md" data-mathlevel="60">
## The Deepest Insight: Cross-Entropy Is Shannon Entropy

The connection between cross-entropy loss and information theory is not a superficial analogy, it is an **identity**. The loss function used to train every LLM is mathematically identical to Shannon's measure of surprise.

Shannon's cross-entropy $H(P, Q)$ between a true distribution $P$ and a predicted distribution $Q$ is defined as:

$$H(P, Q) = -\sum_{x} P(x) \log Q(x)$$

With base-2 logarithms this measures how many **bits** are needed to encode events from $P$ using a code optimized for $Q$; with the natural logarithm (as in $-\ln(P)$ above) it measures the same quantity in *nats*, which differ from bits only by the constant factor $\ln 2$. When $P$ and $Q$ match perfectly, $H(P, Q) = H(P)$, the minimal possible number of bits (the true entropy). When they diverge, you waste extra bits.

The same fact is the heart of \citetitle{colah2015visualinfo} (\citeyear{colah2015visualinfo}): cross-entropy counts the bits you *waste* when you code the world with the wrong model of it. Entropy is the cost of the *right* code, cross-entropy is the cost of *your* code, and their difference is the KL divergence — the model's regret, paid in bits \cite{colah2015visualinfo}.

Cross-entropy loss for a classification task is:

$$\mathcal{L} = -\frac{1}{N} \sum_{i=1}^{N} \sum_{c=1}^{C} y_{i,c} \log \hat{y}_{i,c}$$

where $y$ is the one-hot true label (the “true distribution” for a single example) and $\hat{y}$ is the predicted probability. This is **exactly** the per-example Shannon cross-entropy.

The “aha-moment”: training an LLM is equivalent to building the world's best text compression algorithm. Every time the model computes cross-entropy loss, it is measuring how many extra bits it would need to encode the training text using its current beliefs. Reducing the loss means finding a shorter description of the data. This is why scaling works: more parameters allow more compression (finding more patterns in the data), which requires more accurate world models (because the best compression of natural language requires modeling physics, psychology, and causality), which produces more “intelligent” behavior.

Intelligence, from this perspective, is not a separate objective, it is a side effect of optimal compression. The connection to Hutter's prize (\cite{hutter2006universal}) and the “intelligence is compression” thesis is direct: a model that achieves the minimal possible cross-entropy on human text has implicitly learned the causal structure of the world that generates that text.

### Why Cross-Entropy Pairs Perfectly with Softmax

The gradient of cross-entropy with softmax is beautifully simple:

$$\frac{\partial \mathcal{L}}{\partial z_i} = \hat{y}_i - y_i$$

The error signal is just “how wrong were you?”, the difference between prediction and truth. This simplicity is why this combination dominates classification: the gradient points directly from the prediction toward the target, with no complicating curvature or saturation effects (unlike MSE with softmax, which saturates when predictions are confidently wrong).
</div>


