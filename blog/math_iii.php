<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Math III — Approximation & The Geometry of High Dimensions
description: Why AI works on approximations, accuracy vs precision, and the blessing of dimensionality.
icon: &#128290;
part: 1
order: 3
color: accent
topics: math-iii
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

In high-dimensional spaces, random vectors are almost always **nearly orthogonal**. In 768 dimensions (a typical embedding size), two random vectors have an expected cosine similarity near 0 with small variance — the probability of a cosine above $0.1$ is only about $0.6\%$:

$$
P(|\cos(\mathbf{v}_1, \mathbf{v}_2)| > 0.1) \approx 0.006
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

<div class="md">
## The Other Side of the Bridge: Types, Spaces, and Equality

Every loss function, every embedding, every layer of every network is a function between *types*. A loss is a map $\mathcal{L} : \theta \to \mathbb{R}_+$ from the space of parameters to the positive reals. An embedding is a map $E : V \to \mathbb{R}^d$ from a vocabulary to a vector space. A transformer block is a map $T : \mathbb{R}^{L \times d} \to \mathbb{R}^{L \times d}$ from token sequences to token sequences. Once you see this, every chapter in this book is secretly a chapter about *typed functions*.

In most of this textbook we write types informally ("$x$ is a vector, $w$ is a matrix"). For most purposes that's enough. But sometimes a sharper language helps — and the sharpest language for "spaces + functions between them" turns out to be **type theory**.
</div>

<div class="optional md" data-headline="Type Theory and Homotopy Type Theory (for the curious)">
**Type theory** is a foundation for mathematics where the basic objects are *types* (think: sets with structure) and the basic maps are *functions* between them. Most modern proof assistants (Lean, Coq, Agda) are built on type theory for the same reason Tensor notation is built on tensors: once you commit, the compiler / kernel checks every step.

### What a type actually is

A **type** is, at minimum, *a collection of things* — often just a set. Sometimes there is an additional *rule for how to construct its inhabitants* (and how to tell them apart), but that rule is optional: `bool` is perfectly fine as the bare set $\{\texttt{True}, \texttt{False}\}$, while $\mathbb{R}^d$ additionally comes with the linear-algebraic operations of addition and scaling. The simplest types are familiar from every programming language:

* $\texttt{int}$ — the whole numbers: $\{\dots, -2, -1, 0, 1, 2, \dots\}$
* $\texttt{bool}$ — exactly two values: $\{\texttt{True}, \texttt{False}\}$
* $\texttt{string}$ — finite sequences of characters
* $\texttt{float}$ — the IEEE-754 reals (not the real $\mathbb{R}$ of pure maths; this distinction matters)
* $\mathbb{R}^d$ — the $d$-dimensional vectors, i.e. functions $\{1,\dots,d\} \to \mathbb{R}$

But types need not be "primitive" — they can be *anything* with a rule for membership. Trees, graphs, proofs, game states, regular expressions, probability distributions, even *other types*. Types can also be *built* from other types (the type constructors below). This is the same freedom you have in any typed programming language, just made explicit.

A **term** is something that *has* a type. We write $x : A$ for "$x$ is a term of type $A$". So $42 : \texttt{int}$, $\texttt{True} : \texttt{bool}$, and a token embedding $\vec{e}_{4181} : \mathbb{R}^{768}$.

### Functions as types

The key idea: **functions are also typed**. If $A$ and $B$ are types, the type $A \to B$ ("$A$ arrow $B$") is *the type of functions from $A$ to $B$*. A term $f : A \to B$ is a rule that turns any $a : A$ into an $f(a) : B$.

The canonical example — and the simplest piece of every neural network — is the **is-even** test:

$$\texttt{isEven} : \texttt{int} \rightarrow \texttt{bool}$$

with the rule $\texttt{isEven}(n) = \texttt{True}$ iff $n \equiv 0 \pmod{2}$. In code:

```python
is_even : int → bool
is_even(n) = (n % 2 == 0)
```

The type signature `int → bool` is doing real work: it is a *promise to the compiler* that no matter what `int` you pass in, you get back a `bool` and nothing else. The compiler can now refuse to let you write `is_even("hello")` — `"hello"` is not an `int`, so the function is simply not applicable.

Now translate this to the textbook:

* The **ReLU** activation: $\text{ReLU} : \mathbb{R} \to \mathbb{R}_{\geq 0}$
* The **sigmoid** activation: $\sigma : \mathbb{R} \to (0,1)$
* The **softmax** (see `math_ii.php`): $\text{softmax} : \mathbb{R}^K \to \Delta^{K-1}$, where $\Delta^{K-1}$ is the probability simplex — *the type of probability distributions over $K$ outcomes*
* A **linear layer** with weight $W$ and bias $b$: $L_{W,b} : \mathbb{R}^{d_\text{in}} \to \mathbb{R}^{d_\text{out}}$
* The **loss function** in this very chapter: $\mathcal{L} : \Theta \to \mathbb{R}_+$ (parameters to non-negative reals)
* A **token embedding lookup**: $E : \texttt{int} \to \mathbb{R}^d$ — exactly the same shape as `isEven`, just a different codomain

Once you see every function in ML as "$A \to B$", a lot of design choices stop looking arbitrary. A *classifier head* is the composition of a feature extractor $\mathbb{R}^{d_\text{in}} \to \mathbb{R}^{d_\text{hidden}}$ with a final layer $\mathbb{R}^{d_\text{hidden}} \to \Delta^{K-1}$. A *diffusion model* (see the Diffusion chapter) is a function from $(\text{image}, \text{noise-level})$ to the denoised image — type $\mathbb{R}^{H \times W \times 3} \times [0,1] \to \mathbb{R}^{H \times W \times 3}$.

### Type constructors

You can build new types from old with **type constructors**:

* **Product** $A \times B$: pairs $(a, b)$ with $a : A$ and $b : B$. An RGB image is $\mathbb{R}^{H \times W} \times \mathbb{R}^{H \times W} \times \mathbb{R}^{H \times W}$.

    The name *product* is literal: the type $A \times B$ has exactly $|A| \cdot |B|$ inhabitants — one pair for every combination of an $A$-thing and a $B$-thing. If $A = \{\texttt{A}, \texttt{B}, \texttt{C}\}$ and $B = \texttt{bool} = \{\texttt{true}, \texttt{false}\}$, then $A \times B$ is the table

    |       | $\texttt{true}$       | $\texttt{false}$       |
    |-------|-----------------------|------------------------|
    | $\texttt{A}$ | $(\texttt{A}, \texttt{true})$  | $(\texttt{A}, \texttt{false})$ |
    | $\texttt{B}$ | $(\texttt{B}, \texttt{true})$  | $(\texttt{B}, \texttt{false})$ |
    | $\texttt{C}$ | $(\texttt{C}, \texttt{true})$  | $(\texttt{C}, \texttt{false})$ |

    — six inhabitants, which is $|A| \cdot |B| = 3 \cdot 2$. The same rule extends to three or more factors: an RGB image $\mathbb{R}^H \times \mathbb{R}^W \times \mathbb{R}^3$ has $|\mathbb{R}|^{H \cdot W \cdot 3}$ inhabitants.

    The two **projection maps** go the other way:

    $$\pi_1 : A \times B \to A, \qquad \pi_1(a, b) = a$$
    $$\pi_2 : A \times B \to B, \qquad \pi_2(a, b) = b$$

    So $\pi_1(\texttt{A}, \texttt{true}) = \texttt{A}$ and $\pi_2(\texttt{B}, \texttt{false}) = \texttt{false}$. Picking a column of the table is applying $\pi_2$; picking a row is applying $\pi_1$. Together they let you recover each factor from the pair — and the universal property of the product says this is the *only* way to do it cleanly.

* **Sum** $A + B$: tagged unions — *either* an $A$ *or* a $B$, with a tag telling you which. The result of a parser is a Sum: `ParseSuccess(string) + ParseFailure(error)`. Cardinality: $|A| + |B|$.
* **Function space** $A \to B$: already covered. Cardinality: $|B|^{|A|}$ — for every one of the $|A|$ inputs you pick one of the $|B|$ outputs, and there are $|B|^{|A|}$ such functions. A function `int → bool` has $2^{|\mathbb{Z}|}$ inhabitants (one for each even/odd rule), which is a *lot*.
* **List** $\texttt{List}(A)$: finite sequences of $A$'s. A batch of token sequences is $\texttt{List}(\mathbb{R}^{L \times d})$.
* **Dependent types** $x : A \vdash B(x)$: the type $B$ *depends on the value* $x$. "A vector of length $n$" is a dependent type — the length is part of the type, so you cannot pass a length-3 vector to a function expecting length-4. This is the level at which proof assistants really earn their keep.

These four constructors are essentially all you need. Most type theories add a few more (e.g. $\Sigma$-types for dependent pairs, identity types for equality — see below) but they are all variants on the same four ideas.

### Currying: one-argument at a time

Every multi-argument function can be rewritten as a chain of one-argument functions. This trick is named after Haskell Curry and is the default in most typed languages:

$$f(a, b, c) \quad\equiv\quad f(a)(b)(c) \quad\equiv\quad f : A \to B \to C$$

with the convention that $\to$ **associates to the right**, so $A \to B \to C$ means $A \to (B \to C)$. Concretely, a function $f : \texttt{int} \to \texttt{bool} \to \texttt{string}$ is "give me an `int`, and I'll hand you back a function from `bool` to `string`." You call it as `f(42)`, get back a function, and call *that* with `true` or `false`.

This is not just a notational trick. It is what makes **partial application** and **point-free style** possible, and it is why every ML function with several hyperparameters can be written as a pipeline of small composable pieces. A transformer block $T$ is $T : \mathbb{R}^{L \times d} \to \mathbb{R}^{L \times d}$; multi-layer perceptrons are just nested $\to$'s of vector spaces.

**Homotopy Type Theory (HoTT)**, developed by the \citetitle{hottbook} (\citeyear{hottbook}), pushes this further. The big idea: *types are spaces, terms are points, and proofs of equality are paths in the space between them*. Two things are equal not just when a binary "=" returns true, but when there exists a *continuous deformation* (a homotopy) from one to the other.

This matters because the **univalence axiom** says: $(A \simeq B) \simeq (A = B)$, "equality of types *is* equivalence of types." Two mathematical structures are identical precisely when you can translate between them without losing **structural** information. This is much richer than the binary `==` in a programming language: it accommodates symmetries, isomorphisms, and equivalences as first-class objects.

**A free bridge to the rest of this book.** Once you read types as spaces and proofs as paths, a surprising amount of this textbook *clicks*:

- An **embedding space** is a type $\mathbb{R}^d$ whose points are vectors. Cosine similarity becomes a path-flavored statement about angle.
- An **isomorphism between neural-network layers** (same function, different parameterization) is exactly the kind of "$A = B$" HoTT treats as "$A \simeq B$".
- A **theorem prover checking an LLM's proof** (see the <a href="symbolic_ai">Symbolic AI chapter</a> and the <a href="reasoning">Reasoning chapter</a>) is a function between two types — and HoTT makes the *equality* of the prover's output with the formal statement into something you can *transport structure along*, not just check with a boolean.
- **Constitutional AI** and reward modeling become functions whose codomain is *preferences*, a type with structure (transitivity, asymmetry) that HoTT handles cleanly.

You do not need HoTT to read this book. But once you have the picture in your head — *types are spaces, proofs are paths, equality is equivalence* — you will start spotting it everywhere in deep learning. And you will have a name for the structure the field is moving toward: **a sheaf of types, glued by proofs, where equality is a path you can walk**.
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

	const dims = [2, 5, 10, 50, 100, 500, 768, 1000, 4096];
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
