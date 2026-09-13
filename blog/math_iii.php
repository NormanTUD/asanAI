<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Basic Math Concepts III — Approximation & The Geometry of High Dimensions
description: Why AI works on approximations, accuracy vs precision, and the blessing of dimensionality.
icon: &#128290;
part: 1
order: 5
color: accent
topics: math-iii
-->
<?php js("math_iii_hott"); ?>

<style>
/* ── HoTT interactive lab (theme-aware, scoped by .hott-* prefix) ── */
.hott-card { background: var(--mn-surface); border: 1px solid var(--mn-border); border-radius: var(--mn-radius-md); padding: 1rem 1.1rem; margin: 1.2rem 0; box-shadow: var(--mn-shadow-md); }
.hott-card-title { font-weight: 600; color: var(--mn-accent); margin-bottom: .7rem; display: flex; align-items: center; gap: .5rem; font-family: var(--mn-font-heading); font-size: 1.02rem; }
.hott-card-title .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--mn-accent); box-shadow: 0 0 10px var(--mn-accent); flex: 0 0 auto; }
.hott-lead { color: var(--mn-text-secondary); }
.hott-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem; }
.hott-controls { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; margin: .7rem 0; padding: .7rem; background: var(--mn-bg-subtle); border-radius: 10px; }
.hott-control { display: flex; flex-direction: column; gap: .35rem; min-width: 150px; flex: 1; }
.hott-control label { font-size: .8rem; color: var(--mn-text-secondary); display: flex; justify-content: space-between; gap: .5rem; }
.hott-control label b { color: var(--mn-accent); font-family: var(--mn-font-mono); }
.hott-controls input[type=range], .hott-lab-range { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; background: var(--mn-border); border-radius: 2px; outline: none; }
.hott-controls input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: var(--mn-accent); border-radius: 50%; cursor: pointer; }
.hott-controls input[type=range]::-moz-range-thumb { width: 16px; height: 16px; background: var(--mn-accent); border-radius: 50%; cursor: pointer; border: 0; }
.hott-btn { background: var(--mn-accent); color: #fff; border: 0; padding: .5rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: .85rem; align-self: flex-end; }
.hott-btn:hover { filter: brightness(1.12); }
.hott-canvas { width: 100%; height: auto; display: block; border-radius: 10px; border: 1px solid var(--mn-border); }
.hott-plot { width: 100%; max-width: 80%; min-height: 340px; margin: 0 auto; }
.hott-3d { width: 100%; height: 440px; border-radius: 10px; border: 1px solid var(--mn-border); cursor: grab; overflow: hidden; }
.hott-row { display: flex; gap: .6rem; flex-wrap: wrap; margin: .6rem 0; }
.hott-pill { padding: .3rem .75rem; border: 1px solid var(--mn-border); border-radius: 99px; font-size: .8rem; color: var(--mn-accent); background: var(--mn-accent-lighter); }
.hott-pill.good { color: var(--mn-emerald); border-color: var(--mn-emerald); background: var(--mn-emerald-light); }
.hott-pill.bad { color: var(--mn-rose); border-color: var(--mn-rose); background: var(--mn-coral-light); }
.hott-callout { border-left: 3px solid var(--mn-accent); background: var(--mn-bg-warm); padding: .8rem 1rem; border-radius: 0 10px 10px 0; margin: .9rem 0; }
.hott-callout.a { border-color: var(--mn-emerald); }
.hott-math { background: var(--mn-bg-subtle); padding: .55rem .9rem; border-radius: 8px; overflow-x: auto; margin: .6rem 0; }
.hott-stepper { display: flex; gap: .4rem; margin: .7rem 0; flex-wrap: wrap; }
.hott-step { padding: .42rem .8rem; background: var(--mn-surface-raised); border: 1px solid var(--mn-border); border-radius: 8px; font-size: .83rem; color: var(--mn-text-secondary); cursor: pointer; transition: all .15s; }
.hott-step.active { background: var(--mn-accent); color: #fff; border-color: var(--mn-accent); font-weight: 600; }
.hott-select { padding: .5rem; background: var(--mn-surface-raised); color: var(--mn-text); border: 1px solid var(--mn-border); border-radius: 6px; }
.hott-tcresult { padding: 1rem; background: var(--mn-bg-subtle); border-radius: 8px; font-family: var(--mn-font-mono); font-size: .9rem; white-space: pre-wrap; }
.hott-chview { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: .8rem; }
.hott-chcell { padding: 1rem; border-radius: 8px; }
.hott-chcell.logic { background: var(--mn-accent-lighter); }
.hott-chcell.types { background: var(--mn-coral-light); }
.hott-chcell .lbl { font-size: .75rem; margin-bottom: .5rem; font-weight: 700; letter-spacing: .05em; }
.hott-chcell.logic .lbl { color: var(--mn-accent); }
.hott-chcell.types .lbl { color: var(--mn-coral); }
.hott-chcell .body { font-size: 1.05rem; }
.hott-chcell.types .body { font-family: var(--mn-font-mono); font-size: .95rem; }
.hott-chcell .sub { color: var(--mn-text-secondary); font-size: .82rem; margin-top: .6rem; }
@media (max-width: 800px) { .hott-grid2 { grid-template-columns: 1fr; } .hott-chview { grid-template-columns: 1fr; } }
</style>

<div class="md">
This third math chapter steps back from mechanics and addresses two conceptual questions that recur throughout the rest of the textbook:

1. **Why is “good enough” the goal of AI?** Most AI is approximation; what does that mean precisely?
2. **Why do neural networks work so well in high dimensions?** Classical statistics calls high dimensions a “curse”, but neural networks thrive.

Both questions turn on the geometry of the spaces in which models learn.
</div>

<div class="md">
## What are approximations?

In traditional programming, we aim for **exactness**. If you write a function to calculate a tax rate, you want the result to be 100% correct every single time. However, the real world is messy and doesn't always follow simple, rigid rules.

An **approximation** (from latin *approximātus*, “to come near, approach”, see \citetitle{kleinetymology}, p. 45) is a result that is “close enough” to the truth to be useful, even if it isn't perfect.

### Most Artificial Intelligence is approximations

Most tasks we want AI to solve, like recognizing a face, translating a language, or driving a car, are too complex for “if-then” logic.

* **Complexity:** There is no single mathematical formula for a “cat.” A cat can be any color, in any pose, and in any lighting.
* **The Goal:** Instead of looking for a perfect rule, AI looks for a **statistical likelihood**. It approximates the pattern of a cat based on the thousands of examples it has seen.

### Accuracy vs. Precision

When we talk about models being “good enough,” we are looking at the balance of error.

* **A “Perfect” Model:** Would have 0% error but is often impossible to build for complex data.
* **An “Approximate” Model:** Might be 98% accurate. While it may occasionally mistake a fluffy pillow for a cat, its ability to process millions of images in seconds makes it incredibly valuable anyways.

**Key takeaway:** AI doesn't “know” what a cat is in the way humans do. It has simply built a very sophisticated mathematical approximation of “cat-ness.”
</div>

<div class="md">
## The Mathematical Toolkit of Approximation

AI leans on three families of approximation:

### 1. Numerical Approximation

Floating-point arithmetic cannot represent most real numbers exactly (0.1 in binary is an infinite repeating fraction). The IEEE 754 standard bounds the rounding error so that the accumulation of error stays within predictable limits.

For a sequence of operations $f_1, f_2, \dots, f_n$, the **forward error** grows at worst as:

$$
\underbrace{|\hat y - y|}_{\text{forward error}} \leq C \cdot n \cdot \epsilon_{\text{machine}}
$$

where $\epsilon_{\text{machine}}$ is machine precision ($\approx 10^{-7}$ for fp32) and $C$ is a problem-dependent constant. So even if individual steps are approximate, the result is bounded.

### 2. Statistical Approximation

When we say a model “predicts the next token”, we mean: of all the tokens that *could* plausibly follow, the model assigns probabilities. The **expectation** of the probability distribution is a “best guess”, but a single sample is approximate.

Maximum Likelihood Estimation (MLE), Bayesian inference, and Monte Carlo methods are all formal ways of reasoning about the uncertainty inherent in statistical approximation.

### 3. Function Approximation

A neural network is, mathematically, a **function approximator**. Given a function $f^*: X \to Y$, the network learns parameters $\theta$ such that $f_\theta(x) \approx f^*(x)$ for the inputs in the training distribution.

The **Universal Approximation Theorem** \cite[Cybenko, 1989]{cybenko1989} \cite[Hornik et al., 1989]{hornik1989} states that a feed-forward network with a single hidden layer of sufficient width can approximate **any continuous function** on a compact domain to arbitrary precision. The theorem says nothing about *how to find* such a network, only that one exists.
</div>

<div class="md">
## The integral and the closed integral

Two more signs show up throughout this book, so it is worth learning them once. Both come from the **calculus**, which **Newton** and **Leibniz** invented independently in the 1660s to 1680s to turn "what is changing" into "what has accumulated."

### The integral $\int$

The integral $\int_a^b f(x)\,\mathrm{d}x$ **adds a quantity up continuously** over an interval. The picture: cut $[a,b]$ into $n$ thin slices of width $\Delta x$, replace $f$ in each slice by its height $f(x_i)$, and add up the little rectangles $\sum f(x_i)\,\Delta x$. As the slices get thinner and thinner ($n \to \infty$), this **Riemann sum** settles down to the exact area under the curve,

$$\int_a^b f(x)\,\mathrm{d}x = \underbrace{\lim_{n\to\infty}\sum_{i=1}^{n} f(x_i)\,\Delta x}_{\text{Riemann sum}} .$$

The sign $\int$ is a stretched Latin *s*, short for *summa* (sum); **Leibniz** introduced it in 1675 \cite{historyofmathematicalnotation}. The idea of finding areas by summing infinitely thin pieces is much older: **Archimedes** did it by the method of exhaustion, and **Cavalieri** by "indivisibles"; Newton and Leibniz turned it into a general calculation. The result that makes the integral *useful* is the **Fundamental Theorem of Calculus**: if $F'(x) = f(x)$ (so $F$ is an antiderivative of $f$), then

$$\int_a^b f(x)\,\mathrm{d}x = F(b) - F(a).$$

So you rarely take the limit by hand. You find an antiderivative and subtract its endpoint values. For example $\int_0^3 2x\,\mathrm{d}x = \big[\,x^2\,\big]_0^3 = 9 - 0 = 9$, since $(x^2)' = 2x$.

### The closed integral $\oint$

Put a small circle in the middle of the $\int$ and you get $\oint$, the **closed integral**. It means: integrate over a *closed* thing, a curve that returns to its starting point, or a closed surface. In physics it turns a local rule into a global total: the sum of a field all the way around a closed loop (its *circulation*), or the net flow of a field across a closed surface (its *flux*). Gauss's law, for instance, says the net outward flow of an electric field across a closed surface equals the charge inside, $\oint \mathbf{E}\cdot\mathrm{d}\mathbf{A} = Q/\varepsilon_0$. You will meet it again in [Geometry III](geometry_iii): the Gauss–Bonnet theorem sums all the curvature of a closed surface, $\oint_{M} K\,\mathrm{d}A = 2\pi\chi$, and the answer turns out to be pure topology.
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

Recall from Math II, the central idea: a vector lives in a space, and operations on vectors (addition, scaling, dot product) correspond to geometric operations on the space. Modern AI happens in vector spaces of dimension 768 to 16,000.

For the rest of this chapter, the only fact about vector spaces we need is the following: **most vector-space intuition from 2D and 3D fails catastrophically in high dimensions**. Understanding the difference is essential to understanding modern AI.
</div>

<div class="md">
## The Curse of Dimensionality

Classical statistics warns: **as dimensionality grows, geometry breaks down**.

* **Distance concentration**: in $d$ dimensions, the ratio between the nearest and farthest distance from a point to its $k$ nearest neighbors approaches 1 as $d \to \infty$. All points become roughly equidistant.

* **Volume explosion**: the unit cube in $d$ dimensions has volume 1, but most of its volume is in the corners. A uniform sample from the cube is almost always close to a corner.

* **Sample complexity**: to densely cover a $d$-dimensional unit cube with samples, you need exponentially many samples as $d$ grows. With $d = 100$ and 10 samples per axis, you need $10^{100}$ samples, more than atoms in the universe.

These are real problems for classical statistical methods. Naïve nearest-neighbor classifiers, density estimators, and clustering algorithms all degrade as $d$ grows.
</div>

<div id="curse-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## The Blessing of Dimensionality

You may have heard of the “curse of dimensionality”: in high dimensions, distance metrics break down, and all points become roughly equidistant. But there is a corresponding **blessing of dimensionality** that makes neural networks possible.

In high-dimensional spaces, random vectors are almost always **nearly orthogonal**. In 768 dimensions (a typical embedding size), two random vectors have an expected cosine similarity near 0 with small variance, the probability that a cosine has magnitude above $0.1$ is only about $0.6\%$:

$$
P(|\cos(\mathbf{v}_1, \mathbf{v}_2)| > 0.1) \approx 0.006
$$

This means the model can store thousands of **nearly-independent features** because high-dimensional space provides exponentially many “almost-orthogonal” directions for free. This is what makes **superposition** (the ability to represent more features than dimensions) geometrically possible.

The key idea: the same property that makes high dimensions difficult for classical statistics, the concentration of measure, is what makes neural networks powerful. In low dimensions, features compete for the same axes. In high dimensions, every feature can have its own private direction with minimal interference. The curse and the blessing are two sides of the same coin.

### Superposition

Mechanistic interpretability research (Anthropic, 2024) has shown that LLMs represent **more features than they have dimensions**. A 768-dimensional model might encode tens of thousands of interpretable features by letting each feature occupy a *combination* of dimensions.

This is possible precisely because high-dimensional space has exponentially many “almost-orthogonal” directions. The cost: features interfere slightly, leading to hallucinations and brittle reasoning when the model is pushed out of distribution.
</div>

<div id="blessing-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## Concentration of Measure

A foundational result in high-dimensional probability. For any function $f$ that is Lipschitz with constant $L$, the values of $f$ on random points in a high-dimensional ball are tightly concentrated around their mean:

$$
P\!\left(\underbrace{|f(\mathbf{x}) - \mathbb{E}[f(\mathbf{x})]|}_{\text{deviation from the mean}} > t\right) \leq 2 \exp\!\left(-\frac{c d t^2}{L^2}\right)
$$

In words: as dimension $d$ grows, the probability of deviating from the mean shrinks **exponentially**. Random high-dimensional vectors are almost deterministic in their statistical properties.

This is why a 70B-parameter LLM, despite the vast size of its hypothesis space, behaves reliably on novel inputs: high-dimensional concentration ensures that any new input is “close” (in cosine similarity) to many training examples.
</div>

<div class="md">
## The Manifold Hypothesis

A corollary of the blessing: real-world data does not actually fill high-dimensional space. A photo of a face lives on a low-dimensional **manifold**, the space of all possible faces, embedded in a much higher-dimensional pixel space. The intrinsic dimensionality of “face-ness” might be ~100, even though a $1024 \times 1024$ image has over a million dimensions.

Neural networks work because they learn to **parameterize these manifolds**. Each layer progressively deforms the high-dimensional space so that the manifold becomes linearly separable at the output. The “universal approximation” theorem applies to functions on compact subsets of $\mathbb{R}^d$, and a manifold is exactly such a subset.

This is why deep learning is so effective on images, audio, and text: each of these modalities has low intrinsic dimensionality, and neural networks are essentially manifold learners.
</div>

<div class="md">
## Why Approximations Compound and Bound

A surprising property of well-behaved approximations: errors don't necessarily compound.

* **Forward stability** (numerical analysis): small perturbations in input cause bounded perturbations in output.
* **Generalization bounds** (statistical learning theory): with $n$ samples and a network of $V$ parameters, the gap between training and test loss scales as $O\!\left(\sqrt{V / n}\right)$. More data reduces the bound; more parameters increases it.
* **Smoothness priors**: most natural signals are smooth, adjacent pixels in an image, adjacent tokens in text, are correlated. Neural networks encode this prior through their architecture.

These guarantees are why training a 70B model on 15T tokens can produce a model that generalizes to novel inputs, even though the model has never seen them before.
</div>

<div class="md">
## Beyond Approximation: Exact Computation with LLMs

In 2025, the frontier is the **hybrid** system: LLM for intuition, exact tools for verification.

* **Mathematics**: LLM proposes a proof, Lean verifies it.
* **Code**: LLM writes code, tests execute it.
* **Search**: LLM frames the question, vector DB retrieves the answer.
* **Reasoning**: LLM suggests a path, formal verifier checks it.

The most reliable AI systems in 2025 are not pure LLMs, they are LLMs orchestrating exact symbolic systems. The approximation engine handles ambiguity; the exact system handles precision.

The student who masters both, and knows when to use which, will be far more capable than one trained in either alone. This is the synthesis the field is moving toward.
</div>

<div class="md">
## The Other Side of the Bridge: Types, Spaces, and Equality

Every loss function, every embedding, every layer of every network is a function between *types*. A loss is a map $\mathcal{L} : \Theta \to \mathbb{R}_+$ from the space of parameters to the positive reals. An embedding is a map $E : V \to \mathbb{R}^d$ from a vocabulary to a vector space. A transformer block is a map $T : \mathbb{R}^{L \times d} \to \mathbb{R}^{L \times d}$ from token sequences to token sequences. Once you see this, every chapter in this book is secretly a chapter about *typed functions*.

In most of this textbook we write types informally (“$x$ is a vector, $w$ is a matrix”). For most purposes that's enough. But sometimes a sharper language helps, and the sharpest language for “spaces + functions between them” turns out to be **type theory**.
</div>

<div class="optional md" data-headline="Type Theory and Homotopy Type Theory (for the curious)">
**Type theory** is a foundation for mathematics where the basic objects are *types* (think: sets with structure) and the basic maps are *functions* between them. Most modern proof assistants (Lean, Coq, Agda) are built on type theory for the same reason Tensor notation is built on tensors: once you commit, the compiler / kernel checks every step.

### What a type actually is

A **type** is, at minimum, *a collection of things*, often just a set. Sometimes there is an additional *rule for how to construct its inhabitants* (and how to tell them apart), but that rule is optional: `bool` is perfectly fine as the bare set $\{\texttt{True}, \texttt{False}\}$, while $\mathbb{R}^d$ additionally comes with the linear-algebraic operations of addition and scaling. The simplest types are familiar from every programming language:

* $\texttt{int}$, the whole numbers: $\{\dots, -2, -1, 0, 1, 2, \dots\}$
* $\texttt{bool}$, exactly two values: $\{\texttt{True}, \texttt{False}\}$
* $\texttt{string}$, finite sequences of characters
* $\texttt{float}$, the IEEE-754 reals (not the real $\mathbb{R}$ of pure maths; this distinction matters)
* $\mathbb{R}^d$, the $d$-dimensional vectors, i.e. functions $\{1,\dots,d\} \to \mathbb{R}$

But types need not be “primitive”, they can be *anything* with a rule for membership. Trees, graphs, proofs, game states, regular expressions, probability distributions, even *other types*. Types can also be *built* from other types (the type constructors below). This is the same freedom you have in any typed programming language, just made explicit.

A **term** is something that *has* a type. We write $x : A$ for “$x$ is a term of type $A$”. So $42 : \texttt{int}$, $\texttt{True} : \texttt{bool}$, and a token embedding $\vec{e}_{4181} : \mathbb{R}^{768}$.

### Functions as types

The key idea: **functions are also typed**. If $A$ and $B$ are types, the type $A \to B$ (“$A$ arrow $B$”) is *the type of functions from $A$ to $B$*. A term $f : A \to B$ is a rule that turns any $a : A$ into an $f(a) : B$.

The canonical example, and the simplest piece of every neural network, is the **is-even** test:

$$\texttt{isEven} : \texttt{int} \rightarrow \texttt{bool}$$

with the rule $\texttt{isEven}(n) = \texttt{True}$ iff $n \equiv 0 \pmod{2}$. In code:

```python
is_even : int → bool
is_even(n) = (n % 2 == 0)
```

The type signature `int → bool` is doing real work: it is a *promise to the compiler* that no matter what `int` you pass in, you get back a `bool` and nothing else. The compiler can now refuse to let you write `is_even("hello")`, `"hello"` is not an `int`, so the function is simply not applicable.

Now translate this to the textbook:

* The **ReLU** activation: $\text{ReLU} : \mathbb{R} \to \mathbb{R}_{\geq 0}$
* The **sigmoid** activation: $\sigma : \mathbb{R} \to (0,1)$
* The **softmax** (see `math_ii.php`): $\text{softmax} : \mathbb{R}^K \to \Delta^{K-1}$, where $\Delta^{K-1}$ is the probability simplex, *the type of probability distributions over $K$ outcomes*
* A **linear layer** with weight $W$ and bias $b$: $L_{W,b} : \mathbb{R}^{d_\text{in}} \to \mathbb{R}^{d_\text{out}}$
* The **loss function** in this very chapter: $\mathcal{L} : \Theta \to \mathbb{R}_+$ (parameters to non-negative reals)
* A **token embedding lookup**: $E : \texttt{int} \to \mathbb{R}^d$, exactly the same shape as `isEven`, just a different codomain

Once you see every function in ML as “$A \to B$”, a lot of design choices stop looking arbitrary. A *classifier head* is the composition of a feature extractor $\mathbb{R}^{d_\text{in}} \to \mathbb{R}^{d_\text{hidden}}$ with a final layer $\mathbb{R}^{d_\text{hidden}} \to \Delta^{K-1}$. A *diffusion model* (see the Diffusion chapter) is a function from $(\text{image}, \text{noise-level})$ to the denoised image, type $\mathbb{R}^{H \times W \times 3} \times [0,1] \to \mathbb{R}^{H \times W \times 3}$.

### Type constructors

You can build new types from old with **type constructors**:

* **Product** $A \times B$: pairs $(a, b)$ with $a : A$ and $b : B$. An RGB image is $\mathbb{R}^{H \times W} \times \mathbb{R}^{H \times W} \times \mathbb{R}^{H \times W}$.

    The name *product* is literal: the type $A \times B$ has exactly $|A| \cdot |B|$ inhabitants, one pair for every combination of an $A$-thing and a $B$-thing. If $A = \{\texttt{A}, \texttt{B}, \texttt{C}\}$ and $B = \texttt{bool} = \{\texttt{true}, \texttt{false}\}$, then $A \times B$ is the table

    |             | $\texttt{true}$       | $\texttt{false}$       |
    |-------------|-----------------------|------------------------|
    | $\texttt{A}$ | $(\texttt{A}, \texttt{true})$  | $(\texttt{A}, \texttt{false})$ |
    | $\texttt{B}$ | $(\texttt{B}, \texttt{true})$  | $(\texttt{B}, \texttt{false})$ |
    | $\texttt{C}$ | $(\texttt{C}, \texttt{true})$  | $(\texttt{C}, \texttt{false})$ |

, six inhabitants, which is $|A| \cdot |B| = 3 \cdot 2$. The same rule extends to three or more factors: an RGB image $\mathbb{R}^{H \times W} \times \mathbb{R}^{H \times W} \times \mathbb{R}^{H \times W}$ has $|\mathbb{R}|^{H \cdot W \cdot 3}$ inhabitants.

    The two **projection maps** go the other way:

    $$\pi_1 : A \times B \to A, \qquad \pi_1(a, b) = a$$
    $$\pi_2 : A \times B \to B, \qquad \pi_2(a, b) = b$$

    So $\pi_1(\texttt{A}, \texttt{true}) = \texttt{A}$ and $\pi_2(\texttt{B}, \texttt{false}) = \texttt{false}$. Picking a column of the table is applying $\pi_2$; picking a row is applying $\pi_1$. Together they let you recover each factor from the pair, and the universal property of the product says this is the *only* way to do it cleanly.

* **Sum** $A + B$: tagged unions, *either* an $A$ *or* a $B$, with a tag telling you which. The result of a parser is a Sum: `ParseSuccess(string) + ParseFailure(error)`. Cardinality: $|A| + |B|$.
* **Function space** $A \to B$: already covered. Cardinality: $|B|^{|A|}$, for every one of the $|A|$ inputs you pick one of the $|B|$ outputs, and there are $|B|^{|A|}$ such functions. A function `int → bool` has $2^{|\mathbb{Z}|}$ inhabitants (one for each subset of the integers), which is a *lot*.
* **List** $\texttt{List}(A)$: finite sequences of $A$'s. A batch of token sequences is $\texttt{List}(\mathbb{R}^{L \times d})$.
* **Dependent types** $x : A \vdash B(x)$: the type $B$ *depends on the value* $x$. “A vector of length $n$” is a dependent type, the length is part of the type, so you cannot pass a length-3 vector to a function expecting length-4. This is the level at which proof assistants really earn their keep.

These four constructors are essentially all you need. Most type theories add a few more (e.g. $\Sigma$-types for dependent pairs, identity types for equality, see below) but they are all variants on the same four ideas.

### Currying: one-argument at a time

Every multi-argument function can be rewritten as a chain of one-argument functions. This trick is named after Haskell Curry and is the default in most typed languages:

$$f(a, b, c) \quad\equiv\quad f(a)(b)(c) \quad\equiv\quad f : A \to B \to C$$

with the convention that $\to$ **associates to the right**, so $A \to B \to C$ means $A \to (B \to C)$. Concretely, a function $f : \texttt{int} \to \texttt{bool} \to \texttt{string}$ is “give me an `int`, and I'll hand you back a function from `bool` to `string`.“ You call it as `f(42)`, get back a function, and call *that* with `true` or `false`.

This is not just a notational trick. It is what makes **partial application** and **point-free style** possible, and it is why every ML function with several hyperparameters can be written as a pipeline of small composable pieces. A transformer block $T$ is $T : \mathbb{R}^{L \times d} \to \mathbb{R}^{L \times d}$; multi-layer perceptrons are just nested $\to$'s of vector spaces.

**Homotopy Type Theory (HoTT)**, as set out in the \citetitle{hottbook} (\citeyear{hottbook}), pushes this further. The big idea: *types are spaces, terms are points, and proofs of equality are paths in the space between them*. Two things are equal not just when a binary “=” returns true, but when there exists a *continuous deformation* (a homotopy) from one to the other.

This matters because the **univalence axiom** says: $(A \simeq B) \simeq (A = B)$, “equality of types *is* equivalence of types.” Two mathematical structures are identical precisely when you can translate between them without losing **structural** information. This is much richer than the binary `==` in a programming language: it accommodates symmetries, isomorphisms, and equivalences as first-class objects.

### Equality all the way up: paths, homotopies, ∞-groupoids

Once equality is a *path* rather than a boolean, a new question opens up: **when are two paths the same?** The answer is: another path, a *homotopy* between the two paths, i.e. a continuous deformation of one path into the other. This is a *2-path*, a path between paths.

And then: **when are two 2-paths the same?** Answer: a *3-path*. And so on, ad infinitum. At every level there are paths-between-paths, and the question of whether *those* are equal pushes you up one more level. HoTT takes the full infinite tower seriously: an equality is not a single bit, it is an entire **∞-groupoid**.

What is an *∞-groupoid*? A **groupoid** is the same thing as a **group**, except that a group is the special case with a single object, while a groupoid can have many objects. Concretely: a groupoid is a collection of objects together with *invertible* maps between them (called **morphisms**), where the morphisms compose and every morphism has an inverse. The “group” part means morphisms are reversible symmetries; the “-oid” part (“resembling”) means there can be more than one object, it is a *group-like* structure, not a single group. A permutation group is a groupoid with one object. A category of *isomorphisms* is a groupoid. The set of symmetries of any mathematical object forms a groupoid.

An **∞-groupoid** is a groupoid where, in addition to objects and invertible morphisms between them, you have:

* invertible 2-morphisms between parallel 1-morphisms (“two symmetries are homotopic”),
* invertible 3-morphisms between parallel 2-morphisms,
* …
* at every finite level, and the tower never stops.

This is exactly what a *space* is, in the sense topologists mean: points, paths between points, homotopies between paths, homotopies-between-homotopies, all the way up. The slogan of HoTT is therefore:

$$
\begin{aligned}
\text{types} &= \text{spaces} \\
\text{terms} &= \text{points} \\
\text{equalities} &= \text{paths} \\
\text{equalities-of-equalities} &= \text{homotopies}
\end{aligned}
$$

The payoff for AI: when a Transformer learns “cat = small dog” and someone asks whether *that* equality is the same as the equality “feline = canine”, the question is no longer a yes/no, it is a path between paths, which itself has structure. Two learned representations are “equal” only up to some continuous deformation, and HoTT gives you the language to *talk about* that deformation as a first-class object, not as an afterthought.

**A free bridge to the rest of this book.** Once you read types as spaces and proofs as paths, a surprising amount of this textbook *clicks*:

- An **embedding space** is a type $\mathbb{R}^d$ whose points are vectors. Cosine similarity becomes a path-flavored statement about angle.
- An **isomorphism between neural-network layers** (same function, different parameterization) is exactly the kind of “$A = B$” HoTT treats as “$A \simeq B$”.
- A **theorem prover checking an LLM's proof** (see the <a href="symbolic_ai">Symbolic AI chapter</a> and the <a href="reasoning">Reasoning chapter</a>) is a function between two types, and HoTT makes the *equality* of the prover's output with the formal statement into something you can *transport structure along*, not just check with a boolean.
- **Constitutional AI** and reward modeling become functions whose codomain is *preferences*, a type with structure (transitivity, asymmetry) that HoTT handles cleanly.

You do not need HoTT to read this book. But once you have the picture in your head, *types are spaces, proofs are paths, equality is equivalence*, you will start spotting it everywhere in deep learning. And you will have a name for the structure the field is moving toward: **a sheaf of types, glued by proofs, where equality is a path you can walk**.

**Hands-on, right below this box:** an interactive lab lets you deform paths into one another, watch equality become a path, and try out each of the AI applications \citeauthor{youvan2024} proposes — sliders instead of formulas.
</div>

<div class="md">
## An interactive tour: HoTT as a foundation for AI

The math in the box above is precisely the machinery \citeauthor{youvan2024} (\citeyear{youvan2024}) argues for as a *foundation for how AI systems are built*. This is not a benchmark or a new network; it is a position paper. Its claim: if a model is written in a language that already understands **types**, **paths**, and **higher equality**, then reliability, verifiability, and explainability stop being bolted on afterwards and become built-in properties of the design. The tour below follows the paper's own arc — two prerequisites, the core idea, then the six application areas it targets. Everything is interactive; drag the sliders and click around.
</div>

<div class="md">
### Motivation

Modern AI is startlingly capable — and at the same time **opaque**, **brittle**, and **hard to guarantee**. Nobody can say why the model called the picture a cat, an imperceptible pixel-noise flips a panda into a gibbon, and "passed ten thousand tests" says nothing about the infinite inputs it has not seen. Click through the three problems to see how each one feels:
</div>

<div class="hott-card" id="hott-wrap">
	<div class="hott-card-title"><span class="dot"></span>The three core problems of today's AI</div>
	<div class="hott-stepper" id="hott-probSteps">
		<div class="hott-step active" data-p="0">Black box</div>
		<div class="hott-step" data-p="1">Brittleness</div>
		<div class="hott-step" data-p="2">No guarantees</div>
	</div>
	<canvas id="hott-probCanvas" class="hott-canvas" width="1000" height="360"></canvas>
	<p id="hott-probText" class="hott-lead"></p>
</div>

<div class="hott-callout"><b>Youvan's question.</b> Can a mathematically deeper language — one that <em>knows</em> from the start how data objects, transformations, and equality are related — attack all three problems at the root?</div>

<div class="md">
### Prerequisite: what a type is, and programs-as-proofs

A **type** is a set with discipline: every object has exactly one type, and the language checks — *for you, before anything runs* — that you never feed a function the wrong kind of input. The left-hand widget lets you pick a value and a function and watch that check pass or fail. The right-hand one is the deeper trick (the **Curry–Howard correspondence**): in type theory a logical *statement* is itself a type, and a *proof* of it is a *program* of that type. That is why type theory is the natural home for verifying AI at all.
</div>

<div class="hott-grid2" id="hott-lab-1">
	<div class="hott-card">
		<div class="hott-card-title"><span class="dot"></span>Playground: type-check</div>
		<p class="hott-lead">Pick a value and a function. The type check decides whether they fit together.</p>
		<div class="hott-controls">
			<div class="hott-control"><label>Value</label>
				<select id="hott-tcVal" class="hott-select">
					<option value="int">42 : &Zeta; (integer)</option>
					<option value="str">"hello" : String</option>
					<option value="bool">true : Bool</option>
					<option value="img">&#128444;&#65039; : Image</option>
				</select>
			</div>
			<div class="hott-control"><label>Function</label>
				<select id="hott-tcFun" class="hott-select">
					<option value="succ">succ : &Zeta; &rarr; &Zeta;</option>
					<option value="len">length : String &rarr; &Zeta;</option>
					<option value="not">not : Bool &rarr; Bool</option>
					<option value="classify">classify : Image &rarr; Label</option>
				</select>
			</div>
		</div>
		<div id="hott-tcResult" class="hott-tcresult"></div>
	</div>
	<div class="hott-card">
		<div class="hott-card-title"><span class="dot"></span>Curry&ndash;Howard: programs = proofs</div>
		<p class="hott-lead">In type theory, statements are also types, and a proof is a program of that type. Move the slider to see the translation.</p>
		<div class="hott-controls">
			<div class="hott-control"><label>Statement <b id="hott-chVal">A &and; B</b></label><input type="range" id="hott-chSlider" min="0" max="3" step="1" value="0"></div>
		</div>
		<div class="hott-chview">
			<div class="hott-chcell logic"><div class="lbl">LOGIC</div><div class="body" id="hott-chLogic"></div></div>
			<div class="hott-chcell types"><div class="lbl">TYPES</div><div class="body" id="hott-chType"></div></div>
		</div>
	</div>
</div>

<div class="md">
### Prerequisite: homotopy — when are two paths "the same"?

Recall the core slogan: **types are spaces, terms are points, equalities are paths.** But *what* is a path, really? Two routes from $a$ to $b$ count as "the same" when you can **continuously deform** one into the other without lifting the endpoints. That is a **homotopy**. The slider below deforms a blue start-path into a purple target-path; the white curve in between is the homotopy at that instant. And here is the twist that makes the subject deep: in a space with a **hole**, some paths simply cannot be deformed into each other — the hole is an obstacle the deformation would have to pass through.
</div>

<div class="hott-card" id="hott-lab-2">
	<div class="hott-card-title"><span class="dot"></span>Deform one path into another</div>
	<div class="hott-controls">
		<div class="hott-control"><label>Deformation <b id="hott-defVal">0.00</b></label><input type="range" id="hott-def" min="0" max="1" step="0.01" value="0"></div>
		<div class="hott-control"><label>Path shape <b id="hott-shapeVal">Arc</b></label><input type="range" id="hott-shape" min="0" max="2" step="1" value="0"></div>
	</div>
	<canvas id="hott-homoCanvas" class="hott-canvas" width="1000" height="420"></canvas>
	<p class="hott-lead">Blue = start path <em>p</em>, purple = target path <em>q</em>. The white in-between is the current homotopy <em>H</em>(<em>t</em>) — a continuous family of paths connecting them. No jumping, no tearing.</p>
</div>

<div class="hott-card">
	<div class="hott-card-title"><span class="dot"></span>Not every pair of paths is homotopic</div>
	<p class="hott-lead">In a space <b>with a hole</b>, a path that loops around the hole cannot be deformed into one that avoids it. Drag the slider and watch the deformation attempt collide with the obstacle:</p>
	<div class="hott-controls">
		<div class="hott-control"><label>Try to deform <b id="hott-holeVal">0.00</b></label><input type="range" id="hott-hole" min="0" max="1" step="0.01" value="0"></div>
	</div>
	<canvas id="hott-holeCanvas" class="hott-canvas" width="600" height="360"></canvas>
	<p id="hott-holeStatus" class="hott-lead"></p>
</div>

<div class="md">
### Core idea: equality is a path

Now the marriage of the two prerequisites. Instead of treating $a = b$ as a bare true/false, HoTT says: **"$a = b$" is itself a type** — the type of all the paths connecting $a$ to $b$. Two objects can be equal in *several different ways*, one for each path. That is the whole point, and it is what the box above only hinted at: equality is not a bit, it is a structure you can manipulate.
</div>

<div class="hott-card" id="hott-lab-3">
	<div class="hott-card-title"><span class="dot"></span>Equality is a path</div>
	<p class="hott-lead">Two points in a type <em>A</em>. Between them sit every possible "proof that they are equal" — each proof is a path. Raise the slider to add more, or play the animation.</p>
	<canvas id="hott-idCanvas" class="hott-canvas" width="1000" height="380"></canvas>
	<div class="hott-controls">
		<div class="hott-control"><label>Number of paths between <em>a</em> and <em>b</em> <b id="hott-idNVal">1</b></label><input type="range" id="hott-idN" min="1" max="5" step="1" value="1"></div>
		<button id="hott-idAnim" class="hott-btn">Path animation &#9654;</button>
	</div>
	<div class="hott-math" id="hott-idMath"></div>
</div>

<div class="md">
### Core idea: paths between paths, all the way up

If paths are objects, can two paths be *equal*? Yes — by a **path between the two paths** (a 2-path, or homotopy). And two 2-paths can be equal by a 3-path, and so on, without end. The result is an **&infin;-groupoid**: points, paths, paths-between-paths, … at every level. Rotate the scene below and strip the tower down dimension by dimension — a single type can carry an entire landscape of such relationships.
</div>

<div class="hott-card" id="hott-lab-4">
	<div class="hott-card-title"><span class="dot"></span>The tower of equalities (drag to rotate)</div>
	<p class="hott-lead">Points (0D) &rarr; paths (1D) &rarr; surfaces between paths (2D) &rarr; volumes between surfaces (3D). HoTT manages all of this in one language.</p>
	<div id="hott-higher3d" class="hott-3d"></div>
	<div class="hott-controls">
		<div class="hott-control"><label>Show dimensions up to <b id="hott-dimVal">2</b></label><input type="range" id="hott-dim" min="0" max="3" step="1" value="2"></div>
		<div class="hott-control"><label>Auto-rotation <b id="hott-rotVal">0.30</b></label><input type="range" id="hott-rot" min="0" max="1" step="0.01" value="0.3"></div>
	</div>
</div>

<div class="hott-callout a"><b>What that buys AI.</b> "Two networks do the same thing" is a level-1 statement. "Two <em>proofs</em> that they do the same thing are equivalent" is level 2. A refactoring, a reparameterization, a fine-tune that provably changes nothing — all become things you can <em>justify formally</em>, not just hope about.</div>

<div class="md">
### Application: formal verification of AI

Instead of testing a model on ten thousand cases and hoping, **prove** it behaves correctly under *all* conditions. This is the dream of formal verification, and HoTT's precise notion of "equal" (equal up to a small perturbation, equal regardless of gender, …) is what makes a mechanically checkable proof possible. Pick a scenario from the paper:
</div>

<div class="hott-card" id="hott-lab-5">
	<div class="hott-card-title"><span class="dot"></span>Verification scenarios (from the paper)</div>
	<div class="hott-stepper" id="hott-vSteps">
		<div class="hott-step active" data-v="0">Differential privacy</div>
		<div class="hott-step" data-v="1">Loan fairness</div>
		<div class="hott-step" data-v="2">Adversarial robustness</div>
	</div>
	<div class="hott-grid2" style="margin-top:1rem">
		<div><canvas id="hott-vCanvas" class="hott-canvas" width="500" height="360"></canvas></div>
		<div>
			<div id="hott-vTitle" class="hott-card-title" style="margin-top:0"></div>
			<p id="hott-vDesc" class="hott-lead"></p>
			<div class="hott-math" id="hott-vMath"></div>
			<p id="hott-vExplain" class="hott-lead"></p>
		</div>
	</div>
</div>

<div class="md">
### Application: typing uncertainty

In the real world a model is never *certain*. HoTT offers a clean way to **type uncertainty itself** — even uncertainty *about* uncertainty, the second-order quantity that Bayesian networks struggle to express naturally. The first widget combines a symptom and a test into a distribution over diagnoses; the second shows that "how sure am I about my own certainty" is a 2-path between distributions.
</div>

<div class="hott-card" id="hott-lab-6">
	<div class="hott-card-title"><span class="dot"></span>Medical diagnosis example</div>
	<p class="hott-lead">Move the sliders — symptom strength and test results. The model combines the uncertainties. Watch the distribution over diagnoses update.</p>
	<div class="hott-controls">
		<div class="hott-control"><label>Symptom strength <b id="hott-s1Val">0.50</b></label><input type="range" id="hott-s1" min="0" max="1" step="0.01" value="0.5"></div>
		<div class="hott-control"><label>Test positivity <b id="hott-s2Val">0.50</b></label><input type="range" id="hott-s2" min="0" max="1" step="0.01" value="0.5"></div>
		<div class="hott-control"><label>Test reliability <b id="hott-s3Val">0.90</b></label><input type="range" id="hott-s3" min="0.5" max="1" step="0.01" value="0.9"></div>
	</div>
	<div id="hott-uncertPlot" class="hott-plot"></div>
	<p class="hott-lead">In HoTT the type <code>ProbabilityDistribution(Diagnosis)</code> is itself a rich object. Two distributions can be "equal up to rounding" via an identity type — provable, not assumed.</p>
</div>

<div class="hott-card">
	<div class="hott-card-title"><span class="dot"></span>Higher-order uncertainty</div>
	<p class="hott-lead">Bayes: "How sure am I that it is the flu?" &mdash; HoTT: "How sure am I <b>about my own certainty</b>?" That second level becomes a 2-path between distributions.</p>
	<canvas id="hott-metaUncert" class="hott-canvas" width="1000" height="260"></canvas>
	<div class="hott-controls">
		<div class="hott-control"><label>Meta-uncertainty <b id="hott-muVal">0.30</b></label><input type="range" id="hott-mu" min="0" max="1" step="0.01" value="0.3"></div>
	</div>
</div>

<div class="md">
### Application: knowledge representation & the Semantic Web

The web is full of the same thing described in different ways. HoTT's answer: *different descriptions, but there exists an **identity path** between them.* Raise "data sources" in the graph below to make duplicates appear under different names, then switch on the HoTT equivalences to watch identity paths link them together without destroying the structure.
</div>

<div class="hott-card" id="hott-lab-7">
	<div class="hott-card-title"><span class="dot"></span>Ontology graph: diseases, symptoms, treatments</div>
	<canvas id="hott-ontoCanvas" class="hott-canvas" width="1000" height="480"></canvas>
	<div class="hott-controls">
		<div class="hott-control"><label>Show HoTT equivalences <b id="hott-eqVal">off</b></label><input type="range" id="hott-eq" min="0" max="1" step="1" value="0"></div>
		<div class="hott-control"><label>Data sources <b id="hott-dsVal">1</b></label><input type="range" id="hott-ds" min="1" max="3" step="1" value="1"></div>
	</div>
</div>

<div class="md">
### Application: quantum AI

A qubit is both $|0\rangle$ and $|1\rangle$ until you measure it. HoTT's higher-dimensional types turn out to be a surprisingly natural language for that **superposition** and **entanglement**: the quantum state space is topological, a path on the Bloch sphere is a quantum gate, and a *higher* path is a proof that two gate sequences do the same job. Move the state around the sphere and measure it.
</div>

<div class="hott-card" id="hott-lab-8">
	<div class="hott-card-title"><span class="dot"></span>A qubit on the Bloch sphere (drag to rotate)</div>
	<div class="hott-grid2">
		<div id="hott-bloch3d" class="hott-3d" style="height:380px"></div>
		<div>
			<p class="hott-lead">Every point on the sphere is a state of the qubit. North = |0&#10217;, south = |1&#10217;, the equator is perfect superposition.</p>
			<div class="hott-controls" style="flex-direction:column">
				<div class="hott-control"><label>&theta; (latitude) <b id="hott-thVal">0.80</b></label><input type="range" id="hott-th" min="0" max="3.14" step="0.01" value="0.8"></div>
				<div class="hott-control"><label>&phi; (longitude) <b id="hott-phVal">0.50</b></label><input type="range" id="hott-ph" min="0" max="6.28" step="0.01" value="0.5"></div>
			</div>
			<div class="hott-math" id="hott-qMath"></div>
			<button id="hott-qMeasure" class="hott-btn">Measure! &#128207;</button>
			<p id="hott-qResult" class="hott-lead" style="margin-top:.5rem;font-family:var(--mn-font-mono)"></p>
		</div>
	</div>
</div>

<div class="md">
### Application: explainable AI

A deep model makes a decision — but why? HoTT offers a structure for making the **path of the decision** trackable: click an input on the left and trace the path it takes through the network. Inputs that land in the same class share similar paths, and HoTT makes that path-equivalence a first-class, checkable fact.
</div>

<div class="hott-card" id="hott-lab-9">
	<div class="hott-card-title"><span class="dot"></span>Decision-path explorer</div>
	<p class="hott-lead">Click an input point — see which path it takes through the model, and how similar inputs take similar paths (HoTT identity paths between decisions).</p>
	<canvas id="hott-xaiCanvas" class="hott-canvas" width="1000" height="440"></canvas>
	<div class="hott-controls">
		<div class="hott-control"><label>Show equivalence classes <b id="hott-xaiEqVal">no</b></label><input type="range" id="hott-xaiEq" min="0" max="1" step="1" value="0"></div>
		<button id="hott-xaiReset" class="hott-btn">Reset</button>
	</div>
	<p id="hott-xaiInfo" class="hott-lead"></p>
</div>

<div class="md">
### Youvan's answer to his own question

**Yes — HoTT is not a trick, it is a foundation.** When AI systems are built from the ground up in a language that knows types, paths, and higher equality, then **verification, explainability, and expressiveness** become *built-in properties*, not after-the-fact repairs. Concretely, \citeauthor{youvan2024} proposes:

* AI **programming languages** with a HoTT type system
* **formal proofs** of fairness, privacy, and robustness
* types for **higher-order uncertainty**
* **Semantic-Web** integration via identity paths
* HoTT as a **bridging language** toward quantum AI
* **explainability** through structured decision paths

Be clear, though, about what the paper is and is not. It is a **position paper / vision**: it names the direction and the tools, but it ships **no experiments, no benchmark numbers, no code, and no worked proof constructions**. The hard work — the languages, libraries, and compilers — is exactly what it is *asking the community* to build, and it is honest about the cost: HoTT is mathematically demanding, existing ML frameworks do not fit it out of the box, and the extra structure carries real computational overhead. The payoff, if the interdisciplinary effort (mathematics + computer science + AI) pays off, is a generation of AI that is robust, verifiable, and genuinely understandable.
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
