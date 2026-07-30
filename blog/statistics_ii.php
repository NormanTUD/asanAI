<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Statistics II — Inference and Information
description: Bayesian updating, entropy, the Dirichlet distribution, EM, Markov chains, Zipf.
icon: &#128200;
part: 1
order: 4
color: accent
-->

<div class="md">
This second statistics chapter covers **inference**: how we update our beliefs given new data, and how we measure uncertainty. These are the tools that turn raw distributions into actionable predictions.

By the end, you will understand Bayesian reasoning, Shannon entropy, latent variable models (including EM), and Markov chains — all central to modern machine learning.
</div>

<div class="md">
## Bayesian Updating: The Logic of Science

Bayesian statistics (Reverend Thomas Bayes, 1763) treats probability as **degree of belief** rather than long-run frequency. The core equation, **Bayes' theorem**, updates a prior belief in light of new evidence:

$$P(H \mid E) = \frac{P(E \mid H) \cdot P(H)}{P(E)}$$

* $P(H)$: **prior** probability of the hypothesis (before seeing evidence).
* $P(E \mid H)$: **likelihood** of observing the evidence if the hypothesis is true.
* $P(E)$: **marginal likelihood** of the evidence (under all hypotheses).
* $P(H \mid E)$: **posterior** probability of the hypothesis after seeing the evidence.

Bayesian reasoning is the formal version of "scientific method": start with a hypothesis, predict what you'd see, compare to actual evidence, update your belief.

### The Anatomy of an Update

Suppose a medical test for a disease has:
* 99% sensitivity: $P(\text{+} \mid \text{disease}) = 0.99$
* 95% specificity: $P(\text{-} \mid \text{no disease}) = 0.95$
* Disease prevalence: $P(\text{disease}) = 0.01$ (1% of population)

You test positive. What's $P(\text{disease} \mid \text{+})$? Naively, "99%". But Bayes' theorem gives:

$$P(\text{disease} \mid \text{+}) = \frac{0.99 \cdot 0.01}{0.99 \cdot 0.01 + 0.05 \cdot 0.99} = \frac{0.0099}{0.0594} \approx 16.7\%$$

Most positives are false positives — because the disease is so rare. This is the **base rate fallacy**: ignoring prior probabilities leads to wildly incorrect conclusions.

### The "Spam Filter" Logic

Naive Bayes spam filters apply this at scale. Words have likelihoods $P(\text{word} \mid \text{spam})$ and $P(\text{word} \mid \text{ham})$ estimated from training data. Given an email's words, compute the posterior:

$$P(\text{spam} \mid \text{words}) \propto P(\text{spam}) \prod_{\text{word}} P(\text{word} \mid \text{spam})$$

Threshold the result: if above 0.5, classify as spam. Despite strong independence assumptions, this approach achieves >95% accuracy and was the workhorse of spam filtering until the deep-learning era.

In modern AI, Bayesian methods are central to:
* **Uncertainty quantification**: a Bayesian neural network outputs a distribution over predictions, not a point estimate.
* **Active learning**: choose the example whose expected information gain is highest.
* **Hyperparameter optimization**: Bayesian optimization searches hyperparameter space more efficiently than grid search.
* **Reinforcement learning**: Thompson sampling and other Bayesian approaches to exploration.
</div>

<div id="bayes-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## Entropy (The Messiness Scale)

Claude Shannon's 1948 insight: information can be measured. The **entropy** of a probability distribution quantifies its uncertainty:

$$H(P) = -\sum_{i} P(x_i) \log P(x_i)$$

in bits if the log is base 2, nats if natural log.

* **Low entropy**: distribution is concentrated (predictable). E.g., $P = (1, 0, 0)$ has $H = 0$.
* **High entropy**: distribution is spread out (unpredictable). E.g., uniform over $N$ outcomes has $H = \log N$.
* **Maximal entropy**: the uniform distribution, given a fixed support.

Entropy is the **expected number of bits** needed to encode a sample from the distribution. It's also the **expected surprise**: $-\log P(x_i)$ averaged over samples.

In machine learning:
* **Cross-entropy loss** is the standard loss for classification (see the Loss chapter). It equals $H(P, Q) = -\sum P(x) \log Q(x)$ for true distribution $P$ and predicted $Q$.
* **Information gain** in decision trees: how much entropy is reduced by splitting on a feature.
* **Softmax with temperature**: a temperature $T$ scales logits, changing the entropy of the output distribution.
* **Maximum entropy models**: choose the most uniform distribution consistent with observed constraints (a foundational principle in physics and ML).

The deep connection between entropy and the Boltzmann distribution from physics has driven much of statistical machine learning.
</div>

<div id="entropy-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## The Dirichlet Distribution: The Probability of Probabilities

The Dirichlet distribution is the natural distribution over **probability vectors** $\mathbf{p} = (p_1, \dots, p_K)$ where $\sum p_k = 1$ and $p_k \geq 0$. It has a concentration parameter $\alpha = (\alpha_1, \dots, \alpha_K)$:

$$\text{Dir}(\mathbf{p} \mid \alpha) \propto \prod_{k=1}^{K} p_k^{\alpha_k - 1}$$

* $\alpha_k > 1$: distribution concentrated away from 0.
* $\alpha_k = 1$: uniform on the simplex.
* $\alpha_k < 1$: distribution concentrated at corners (sparse probabilities).

### History & The "Urn" Motivation

The Dirichlet distribution arises naturally from **Polya's urn scheme**:

1. Start with an urn containing $\alpha_k$ balls of each color $k$.
2. Draw a ball, observe its color, replace it along with $c$ additional balls of the same color.
3. Repeat.

The proportion of each color after many draws follows a Dirichlet distribution. This generative story explains Dirichlet's appearance everywhere we model **compositional data** (topic mixtures, word distributions, class proportions).

In modern AI:
* **Latent Dirichlet Allocation (LDA)** (Blei et al., 2003) — the foundational topic model.
* **Dirichlet process** — a non-parametric extension used in clustering.
* **Mixture models** — Dirichlet priors over cluster proportions.
</div>

<div class="md">
## Latent Variables: The Hidden Logic of Context

Many phenomena are best modeled by **latent variables** that we never observe directly.

* **Topic of a document**: not written anywhere, but inferred from word frequencies.
* **User intent in a query**: not stated, but inferred from phrasing.
* **Cluster identity of a point**: not labeled, but inferred from features.

A latent variable model specifies:
* $P(\mathbf{z})$: prior on latent variables.
* $P(\mathbf{x} \mid \mathbf{z})$: likelihood of observations given latents.
* $P(\mathbf{z} \mid \mathbf{x}) \propto P(\mathbf{x} \mid \mathbf{z}) P(\mathbf{z})$: posterior, usually intractable.

### Expectation-Maximization (EM)

The EM algorithm (Dempster et al., 1977) finds maximum-likelihood estimates when the model has latent variables:

1. **E-step**: compute the posterior over latents given current parameters: $q(\mathbf{z}) = P(\mathbf{z} \mid \mathbf{x}, \theta^{\text{old}})$.
2. **M-step**: maximize the expected log-likelihood under this posterior: $\theta^{\text{new}} = \arg\max_\theta \mathbb{E}_{q}[\log P(\mathbf{x}, \mathbf{z} \mid \theta)]$.
3. **Iterate** until convergence.

EM is guaranteed to increase the data log-likelihood at every step, converging to a local optimum. Variants include **Variational EM** (use a variational approximation for the posterior) and **Stochastic EM** (use mini-batches).

Modern LLMs can be seen as having latent variables too: the internal representations at each layer can be viewed as progressively refined posterior estimates of the "meaning" the model is computing.

### The Statistical "Vibe"

Latent variable models give statistics its characteristic flavor: **inferring hidden structure from observed data**. This is fundamentally harder than fitting a curve; the model must search a combinatorially large space of possible hidden structures.
</div>

<div class="md">
## The Law of Large Numbers

The most important limit theorem in probability:

**As $n \to \infty$, the sample mean $\bar X_n = \frac{1}{n}\sum X_i$ converges (in probability) to the true mean $\mu$.**

$$\bar X_n \xrightarrow{p} \mu$$

This is why we can estimate population parameters from samples: with enough data, the sample mean gets arbitrarily close to the true mean. It is also why **Monte Carlo methods** work: averaging many independent random samples gives a reliable estimate.

In LLMs, the law of large numbers manifests as:
* Training on more tokens produces more reliable parameter estimates.
* Evaluation accuracy increases with the number of test examples.
* Batching multiple examples reduces gradient noise.

A direct corollary: the **central limit theorem** tells us how fast convergence happens — the standard error of the sample mean is $\sigma / \sqrt{n}$. Quadrupling the sample size halves the standard error.
</div>

<div class="md">
## Markovian Transitions (The Probability of "Next")

A **Markov chain** is a sequence of random variables where each variable depends only on the previous one:

$$P(X_t \mid X_{t-1}, X_{t-2}, \dots) = P(X_t \mid X_{t-1})$$

This "memoryless" property is the foundation of:
* **n-gram language models**: $P(w_n \mid w_{n-1}, w_{n-2}, \dots) \approx P(w_n \mid w_{n-1}, w_{n-2})$ (bigram).
* **PageRank**: random walk on the web graph.
* **MCMC sampling**: generate samples from a complex distribution by simulating a Markov chain.

For LLMs, the Markov property is **explicitly broken** by the attention mechanism: the model can attend to *any* past token, not just the last one. This is what makes Transformers superior to RNNs for language modeling.

But simpler Markovian models remain useful:
* **Markov text generators**: build a transition matrix from a corpus; sample by walking.
* **Topic models**: latent states evolve as a Markov chain over document positions.
* **MCTS in AlphaGo-style reasoning**: a Markov decision process over game states.
</div>

<div class="md">
## Boltzmann Distributions

Originally formulated by **\citeauthor{boltzmann}** (c. \citeyear{boltzmann}) in his work on *Statistical Mechanics*, this was designed to solve the problem of **Molecular Velocity**. He wanted to know: in a room full of gas, how many molecules are moving fast versus slow?

In LLMs, we apply this to the "vocabulary" instead of "molecules." The **Temperature** ($T$) determines how much energy is in the system.

* **The Graph:** Shows the probability of picking specific tokens.
* **Live Logic:** At high $T$, the distribution flattens (Entropy increases). At low $T$, the "cold" model only picks the most certain word.

Mathematically:

$$p_i = \frac{e^{z_i / T}}{\sum_j e^{z_j / T}}$$

At $T = 1$, this is standard softmax. At $T \to 0$, it becomes argmax. At $T \to \infty$, it becomes uniform.

The Boltzmann distribution is also the inspiration for **Boltzmann Machines** (Hinton & Sejnowski, 1985) — one of the earliest generative neural networks. Modern LLMs retain Boltzmann-style softmax in their output layers.
</div>

<div class="md">
## Maximum Likelihood Estimation (MLE): The Fisherian Fit

Popularized by **Sir \citeauthor{fisher1922}**, MLE was created to solve the problem of **Parameter Estimation**. If you see 10 tall people, what is the "most likely" average height of the whole population?

LLMs use this to find the best weights ($\theta$) for the model. Given data $\mathcal{D} = \{x_1, \dots, x_n\}$ and a model $p_\theta(x)$:

$$\theta_{\text{MLE}} = \arg\max_\theta \sum_i \log p_\theta(x_i)$$

Equivalently, minimize the **negative log-likelihood**, which is exactly the cross-entropy loss. The MLE estimate is the parameter setting under which the observed data has the highest probability.

For neural networks, MLE gives us the standard cross-entropy loss; the optimizer (Adam, see the Optimizer chapter) finds the MLE parameters. **Maximum a Posteriori (MAP)** estimation extends MLE with a prior: $\theta_{\text{MAP}} = \arg\max_\theta \left[ \sum_i \log p_\theta(x_i) + \log p(\theta) \right]$. MAP estimation is the basis for weight decay and most regularization techniques.
</div>

<div class="md">
## The Chain Rule: Kolmogorov's Logic

Formalized by **\citeauthor{kolmogorov1933}** in *\citetitle{kolmogorov1933}* (\citeyear{kolmogorov1933}), the Chain Rule solves the problem of **Sequential Dependencies**. It explains how to calculate the probability of a complex event by breaking it into a series of conditional steps.

In an LLM, the probability of the sentence "The cat sat" is calculated as:

$$P(\text{The}) \times P(\text{cat} \mid \text{The}) \times P(\text{sat} \mid \text{The cat})$$

In general, for any sequence of tokens $w_1, w_2, \dots, w_n$:

$$P(w_1, w_2, \dots, w_n) = \prod_{i=1}^{n} P(w_i \mid w_1, \dots, w_{i-1})$$

This is the autoregressive factorization that defines language modeling. Every LLM is fundamentally computing this product, one factor at a time.
</div>

<div class="md">
## KL Divergence: Information Gain

Introduced in \citeauthorlastnameand{leiblerkullback} *\citetitle{leiblerkullback}* (\citeyear{leiblerkullback}), this was originally used for **Cryptanalysis** and military intelligence. It measures the "surprise" or extra bits of info needed if you use Distribution Q to approximate Distribution P.

$$D_{\text{KL}}(P \,\|\, Q) = \sum_x P(x) \log \frac{P(x)}{Q(x)}$$

* Always $\geq 0$, with equality iff $P = Q$.
* **Asymmetric**: $D_{\text{KL}}(P \| Q) \neq D_{\text{KL}}(Q \| P)$.
* Measures the **expected extra bits** to encode samples from $P$ using a code optimized for $Q$.

KL divergence is the central quantity in variational inference, RLHF (as the regularization against the reference policy), knowledge distillation, and many other ML methods.

* **The Graph:** Shows the overlap between P (Truth) and Q (Model).
* **Live Logic:** The divergence $D_{KL}$ is 0 only when the distributions are identical.
</div>

<div class="md">
## Bag of Words (BoW): The Linguistic Atom

The "Distributional Hypothesis", the idea that words occurring in similar contexts have similar meanings, was popularized by **\citeauthor{zelligharris}** in his \citeyear{zelligharris} article *\citetitle{zelligharris}*. It treats a document not as a sequence, but as a "bag": you lose the grammar, the order, and the syntax, keeping only the raw counts.

This was the primary method for **Spam Filtering** and early **Search Engines** before LLMs.

* **The Graph:** Visualizes the "Vector" of your text. Each unique word is a dimension.
* **Live Logic:** Watch how "The cat sat" and "Sat the cat" produce the exact same statistical signature, demonstrating the model's "blindness" to word order.

BoW was the predecessor of **TF-IDF** and ultimately of **dense embeddings** (see the Embeddings chapter). The trajectory of NLP can be summarized as: BoW → TF-IDF → Word2Vec → contextual embeddings → Transformers — each step preserves more structure while remaining computationally tractable.
</div>

<script>
// Bayesian update visualization
(function() {
	const c = document.getElementById('bayes-viz');
	if (!c) return;

	// Two beta distributions: prior and posterior
	const x = Array.from({length: 200}, (_, i) => i / 200);
	function beta(x, a, b) {
		// Normalized beta PDF (rough)
		const B = (a, b) => {
			// Beta function via gamma ratio
			function gamma(z) {
				// Lanczos approximation
				const g = 7;
				const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
					771.32342877765313, -176.61502916214059, 12.507343278686905,
					-0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
				if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
				z -= 1;
				let x = c[0];
				for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
				const t = z + g + 0.5;
				return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
			}
			return gamma(a) * gamma(b) / gamma(a + b);
		};
		const num = Math.pow(x, a - 1) * Math.pow(1 - x, b - 1);
		return num / B(a, b);
	}

	// Weak prior Beta(1,1) uniform; after seeing k successes, n-k failures: posterior is Beta(1+k, 1+n-k)
	const prior = x.map(xi => beta(xi, 1, 1));
	const post_k5 = x.map(xi => beta(xi, 1 + 5, 1 + 5));
	const post_k50 = x.map(xi => beta(xi, 1 + 50, 1 + 50));
	const post_k500 = x.map(xi => beta(xi, 1 + 500, 1 + 500));

	Plotly.newPlot('bayes-viz', [
		{ x, y: prior, mode: 'lines', name: 'prior (no data)', line: { color: '#94a3b8', width: 2, dash: 'dot' } },
		{ x, y: post_k5, mode: 'lines', name: '5 successes, 5 failures', line: { color: '#3b82f6', width: 2 } },
		{ x, y: post_k50, mode: 'lines', name: '50 successes, 50 failures', line: { color: '#f59e0b', width: 2 } },
		{ x, y: post_k500, mode: 'lines', name: '500 successes, 500 failures', line: { color: '#22c55e', width: 2 } }
	], {
		title: { text: 'Bayesian updating: posterior concentrates with more data', font: { size: 13 } },
		xaxis: { title: 'θ (success probability)' },
		yaxis: { title: 'posterior density' },
		margin: { t: 50, b: 50, l: 60, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		legend: { x: 0.55, y: 0.95 }
	}, { responsive: true });
})();

// Entropy of distributions
(function() {
	const c = document.getElementById('entropy-viz');
	if (!c) return;

	const x = Array.from({length: 100}, (_, i) => (i + 1) / 100);
	// Entropy of a 2-outcome distribution with prob p
	const H = x.map(p => -p * Math.log2(p) - (1 - p) * Math.log2(1 - p));
	const Hnorm = H.map(h => h / 1.0);

	Plotly.newPlot('entropy-viz', [
		{ x, y: H, mode: 'lines', line: { color: '#3b82f6', width: 3 }, name: 'H(p) for Bernoulli' }
	], {
		title: { text: 'Entropy of Bernoulli(p): maximum at p=0.5', font: { size: 13 } },
		xaxis: { title: 'p (success probability)' },
		yaxis: { title: 'entropy (bits)', range: [0, 1.1] },
		margin: { t: 50, b: 50, l: 60, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		shapes: [{
			type: 'line', x0: 0.5, x1: 0.5, y0: 0, y1: 1,
			line: { color: '#ef4444', dash: 'dash', width: 1.5 }
		}],
		annotations: [{
			x: 0.5, y: 1.05, text: 'max = 1 bit', showarrow: false, font: { size: 11, color: '#ef4444' }
		}]
	}, { responsive: true });
})();

async function loadStatisticsIIModule() {
	updateLoadingStatus("Loading section about Statistics II...");
	return Promise.resolve();
}
</script>
