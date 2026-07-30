<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Math III — Approximation & The Geometry of High Dimensions
description: Why AI works on approximations, accuracy vs precision, and the blessing of dimensionality.
icon: &#128290;
part: 1
order: 3
color: accent
-->

<div class="md">
This third math chapter steps back from mechanics and addresses two conceptual questions that recur throughout the rest of the textbook:

1. **Why is "good enough" the goal of AI?** Most AI is approximation; what does that mean precisely?
2. **Why do neural networks work so well in high dimensions?** Classical statistics calls high dimensions a "curse" — but neural networks thrive.

Both questions reveal deep truths about the geometry of the spaces in which models learn.
</div>

<div class="md">
## What are approximations?

In traditional programming, we aim for **exactness**. If you write a function to calculate a tax rate, you want the result to be 100% correct every single time. However, the real world is messy and doesn't always follow simple, rigid rules.

An **approximation** (from latin *approximātus*, "to come near, approach", see \citetitle{kleinetymology}, p. 45) is a result that is "close enough" to the truth to be useful, even if it isn't perfect.

### Most Artificial Intelligence is approximations

Most tasks we want AI to solve, like recognizing a face, translating a language, or driving a car, are too complex for "if-then" logic.

* **Complexity:** There is no single mathematical formula for a "cat." A cat can be any color, in any pose, and in any lighting.
* **The Goal:** Instead of looking for a perfect rule, AI looks for a **statistical likelihood**. It approximates the pattern of a cat based on the thousands of examples it has seen.

### Accuracy vs. Precision

When we talk about models being "good enough," we are looking at the balance of error.

* **A "Perfect" Model:** Would have 0% error but is often impossible to build for complex data.
* **An "Approximate" Model:** Might be 98% accurate. While it may occasionally mistake a fluffy pillow for a cat, its ability to process millions of images in seconds makes it incredibly valuable anyways.

**Key takeaway:** AI doesn't "know" what a cat is in the way humans do. It has simply built a very sophisticated mathematical approximation of "cat-ness."
</div>

<div class="md">
## The Mathematical Toolkit of Approximation

AI leans on three families of approximation:

### 1. Numerical Approximation

Floating-point arithmetic cannot represent most real numbers exactly (0.1 in binary is an infinite repeating fraction). The IEEE 754 standard bounds the rounding error so that the accumulation of error stays within predictable limits.

For a sequence of operations $f_1, f_2, \dots, f_n$, the **forward error** grows at worst as:

$$
|\hat y - y| \leq C \cdot n \cdot \epsilon_{\text{machine}}
$$

where $\epsilon_{\text{machine}}$ is machine precision ($\approx 10^{-7}$ for fp32) and $C$ is a problem-dependent constant. So even if individual steps are approximate, the result is bounded.

### 2. Statistical Approximation

When we say a model "predicts the next token", we mean: of all the tokens that *could* plausibly follow, the model assigns probabilities. The **expectation** of the probability distribution is a "best guess" — but a single sample is approximate.

Maximum Likelihood Estimation (MLE), Bayesian inference, and Monte Carlo methods are all formal ways of reasoning about the uncertainty inherent in statistical approximation.

### 3. Function Approximation

A neural network is, mathematically, a **function approximator**. Given a function $f^*: X \to Y$, the network learns parameters $\theta$ such that $f_\theta(x) \approx f^*(x)$ for the inputs in the training distribution.

The **Universal Approximation Theorem** \cite[Cybenko, 1989]{cybenko1989} \cite[Hornik et al., 1989]{hornik1989} states that a feed-forward network with a single hidden layer of sufficient width can approximate **any continuous function** on a compact domain to arbitrary precision. The theorem says nothing about *how to find* such a network — only that one exists.
</div>

<div class="md">
## Approximation vs. Exact Computation: When Each Wins

| Task | Better with exact | Better with approximation |
|------|--------------------|---------------------------|
| **Arithmetic** | Deterministic arithmetic | Floating-point ≈ correct |
| **Logic** | SAT solvers, theorem provers | LLMs are approximate |
| **Search** | A* with admissible heuristic | Monte Carlo Tree Search |
| **Pattern recognition** | — | Neural networks |
| **Natural language** | — | Neural networks |
| **Verification** | Symbolic execution, Lean | — |

A good engineer uses exact tools where they suffice, and approximate tools where they are the only option.
</div>

<div class="md">
## Vector Spaces: A Brief Recap

(See Math II for the full treatment.) Recall the central idea: a vector lives in a space, and operations on vectors (addition, scaling, dot product) correspond to geometric operations on the space. Modern AI happens in vector spaces of dimension 768 to 16,000.

For the rest of this chapter, the only fact about vector spaces we need is the following: **most vector-space intuition from 2D and 3D fails catastrophically in high dimensions**. Understanding the difference is essential to understanding modern AI.
</div>

<div class="md">
## The Curse of Dimensionality

Classical statistics warns: **as dimensionality grows, geometry breaks down**.

* **Distance concentration**: in $d$ dimensions, the ratio between the nearest and farthest distance from a point to its $k$ nearest neighbors approaches 1 as $d \to \infty$. All points become roughly equidistant.

* **Volume explosion**: the unit cube in $d$ dimensions has volume 1, but most of its volume is in the corners. A uniform sample from the cube is almost always close to a corner.

* **Sample complexity**: to densely cover a $d$-dimensional unit cube with samples, you need exponentially many samples as $d$ grows. With $d = 100$ and 10 samples per axis, you need $10^{100}$ samples — more than atoms in the universe.

These are real problems for classical statistical methods. Naïve nearest-neighbor classifiers, density estimators, and clustering algorithms all degrade as $d$ grows.
</div>

<div id="curse-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## The Blessing of Dimensionality

You may have heard of the "curse of dimensionality": in high dimensions, distance metrics break down, and all points become roughly equidistant. But there is a corresponding **blessing of dimensionality** that makes neural networks possible.

In high-dimensional spaces, random vectors are almost always **nearly orthogonal**. In 768 dimensions (a typical embedding size), two random vectors have an expected cosine similarity near 0 with vanishingly small variance:

$$
P(|\cos(\mathbf{v}_1, \mathbf{v}_2)| > 0.1) \approx 0
$$

This means the model can store thousands of **nearly-independent features** because high-dimensional space provides exponentially many "almost-orthogonal" directions for free. This is what makes **superposition** (the ability to represent more features than dimensions) geometrically possible.

The "aha-moment": the very property that makes high dimensions terrifying for classical statistics — the concentration of measure — is what makes neural networks so powerful. In low dimensions, features compete for the same axes. In high dimensions, every feature can have its own private direction with minimal interference. The curse and the blessing are two sides of the same coin.

### Superposition

Mechanistic interpretability research (Anthropic, 2024) has shown that LLMs represent **more features than they have dimensions**. A 768-dimensional model might encode tens of thousands of interpretable features by letting each feature occupy a *combination* of dimensions.

This is possible precisely because high-dimensional space has exponentially many "almost-orthogonal" directions. The cost: features interfere slightly, leading to hallucinations and brittle reasoning when the model is pushed out of distribution.
</div>

<div id="blessing-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## Concentration of Measure

A foundational result in high-dimensional probability. For any function $f$ that is Lipschitz with constant $L$, the values of $f$ on random points in a high-dimensional ball are tightly concentrated around their mean:

$$
P\!\left(|f(\mathbf{x}) - \mathbb{E}[f(\mathbf{x})]| > t\right) \leq 2 \exp\!\left(-\frac{c t^2}{L^2 d}\right)
$$

In words: as dimension $d$ grows, the probability of deviating from the mean shrinks **exponentially**. Random high-dimensional vectors are almost deterministic in their statistical properties.

This is why a 70B-parameter LLM, despite the astronomical size of its hypothesis space, behaves reliably on novel inputs: high-dimensional concentration ensures that any new input is "close" (in cosine similarity) to many training examples.
</div>

<div class="md">
## The Manifold Hypothesis

A corollary of the blessing: real-world data does not actually fill high-dimensional space. A photo of a face lives on a low-dimensional **manifold** — the space of all possible faces — embedded in a much higher-dimensional pixel space. The intrinsic dimensionality of "face-ness" might be ~100, even though a $1024 \times 1024$ image has over a million dimensions.

Neural networks work because they learn to **parameterize these manifolds**. Each layer progressively deforms the high-dimensional space so that the manifold becomes linearly separable at the output. The "universal approximation" theorem applies to functions on compact subsets of $\mathbb{R}^d$ — and a manifold is exactly such a subset.

This is why deep learning is so effective on images, audio, and text: each of these modalities has low intrinsic dimensionality, and neural networks are essentially manifold learners.
</div>

<div class="md">
## Why Approximations Compound and Bound

A surprising property of well-behaved approximations: errors don't necessarily compound.

* **Forward stability** (numerical analysis): small perturbations in input cause bounded perturbations in output.
* **Generalization bounds** (statistical learning theory): with $n$ samples and a network of $V$ parameters, the gap between training and test loss scales as $O\!\left(\sqrt{V / n}\right)$. More data reduces the bound; more parameters increases it.
* **Smoothness priors**: most natural signals are smooth — adjacent pixels in an image, adjacent tokens in text, are correlated. Neural networks encode this prior through their architecture.

These guarantees are why training a 70B model on 15T tokens can produce a model that generalizes to novel inputs — even though the model has never seen them before.
</div>

<div class="md">
## Beyond Approximation: Exact Computation with LLMs

In 2025, the frontier is the **hybrid** system: LLM for intuition, exact tools for verification.

* **Mathematics**: LLM proposes a proof, Lean verifies it.
* **Code**: LLM writes code, tests execute it.
* **Search**: LLM frames the question, vector DB retrieves the answer.
* **Reasoning**: LLM suggests a path, formal verifier checks it.

The most reliable AI systems in 2025 are not pure LLMs — they are LLMs orchestrating exact symbolic systems. The approximation engine handles ambiguity; the exact system handles precision.

The student who masters both — and knows when to use which — will be far more capable than one trained in either alone. This is the synthesis the field is moving toward.
</div>

<script>
// Curse of dimensionality: distance concentration
(function() {
	const c = document.getElementById('curse-viz');
	if (!c) return;

	const dims = [1, 2, 3, 10, 50, 100, 500, 1000];
	const meanNN = dims.map(d => 1 - 1 / Math.sqrt(d));
	const stdNN = dims.map(d => 1 / Math.sqrt(d));

	Plotly.newPlot('curse-viz', [
		{ x: dims, y: meanNN, mode: 'lines+markers', name: 'mean nearest-neighbor distance (normalized)', line: { color: '#ef4444', width: 2.5 } },
		{ x: dims, y: stdNN, mode: 'lines+markers', name: 'std (variance)', line: { color: '#3b82f6', width: 2.5 } }
	], {
		title: { text: 'Curse of dimensionality: distances concentrate as d grows', font: { size: 13 } },
		xaxis: { title: 'dimension d', type: 'log' },
		yaxis: { title: 'normalized distance', range: [0, 1.1] },
		margin: { t: 50, b: 50, l: 60, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		legend: { x: 0.02, y: 0.3 }
	}, { responsive: true });
})();

// Blessing of dimensionality: orthogonality of random vectors
(function() {
	const c = document.getElementById('blessing-viz');
	if (!c) return;

	const dims = [2, 5, 10, 50, 100, 500, 1000, 4096];
	const probAboveThreshold = dims.map(d => {
		// P(|cos| > 0.1) for two random vectors in d dimensions
		// cos theta ~ Normal(0, 1/d) approximately
		const sigma = 1 / Math.sqrt(d);
		const z = 0.1 / sigma;
		// 2 * (1 - Phi(z)) approximation
		return 2 * (1 - 0.5 * (1 + Math.tanh(z / Math.sqrt(2))));
	});

	Plotly.newPlot('blessing-viz', [
		{ x: dims, y: probAboveThreshold.map(p => p * 100), mode: 'lines+markers',
		  line: { color: '#22c55e', width: 2.5 },
		  marker: { size: 10 },
		  name: 'P(|cos| > 0.1) for two random vectors' }
	], {
		title: { text: 'Blessing of dimensionality: random vectors become orthogonal', font: { size: 13 } },
		xaxis: { title: 'dimension d', type: 'log' },
		yaxis: { title: 'P(|cos| > 0.1) (%)', type: 'log' },
		margin: { t: 50, b: 50, l: 60, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)'
	}, { responsive: true });
})();

async function loadMathIIIModule() {
	updateLoadingStatus("Loading section about Math III...");
	return Promise.resolve();
}
</script>
