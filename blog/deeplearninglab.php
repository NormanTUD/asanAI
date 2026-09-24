<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Deep Learning
description: From linear units to deep architectures, function composition and the Universal Approximation Theorem.
icon: &#127961;
part: 3
order: 1
color: emerald
topics: math-i, math-ii, architecture, training
tags: math-heavy, code-heavy
-->

<div class="md" data-mathlevel="50" data-optionaltitle="From a Single Neuron to a Deep Network">
## From a Single Neuron to a Deep Network

In the **Minimal Neuron** section, we saw that one neuron does something very simple: it multiplies its input by a weight, adds a bias, and then bends the result with an activation function. That's it. A single neuron can draw *one* straight line through data, and nothing more.

**Deep Learning** — a term first used in a different context by \citeauthor{deeplearningfirstuse} (\citeyear{deeplearningfirstuse}), reintroduced for neural networks by \citeauthor{aizenberg2000}, and popularized after \citeauthor{hinton2006} — is what happens when we stop using one neuron and start **stacking many of them in layers**, feeding the output of one layer as the input to the next.

### One Layer at a Time

A single layer takes a vector of inputs $\mathbf{x}$ and produces a vector of outputs $\mathbf{h}$ (called a *hidden state*, because it sits between the input and the final answer):

$$\mathbf{h} = \sigma\big(W\,\mathbf{x} + \mathbf{b}\big)$$

Reading this from the inside out:
- $W$ is a **matrix of weights**. Each row is like one neuron's weights, and stacking many neurons side by side gives us a matrix instead of a single number. Multiplying by $W$ mixes the inputs together in many different learned combinations at once.
- $\mathbf{b}$ is a **bias vector**, one offset per neuron.
- $\sigma$ is the **activation function** (the "bend"), applied to each entry.

That is one layer. Nothing exotic — just a matrix multiplication, an addition, and a bend.

### Stacking Layers = Function Composition

"Deep" simply means: the output of one layer becomes the input of the next. In math, this is called **function composition**. For a two-layer network:

$$\hat{y} \;=\; \underbrace{\sigma_2\big(W_2\,\mathbf{h} + \mathbf{b}_2\big)}_{\text{layer 2}} \quad\text{where}\quad \underbrace{\mathbf{h} = \sigma_1\big(W_1\,\mathbf{x} + \mathbf{b}_1\big)}_{\text{layer 1}}$$

Each layer has its own weights $W_n$ and biases $\mathbf{b}_n$. This stacking is what lets the network build a **ladder of features**: layer 1 might pick up simple things (edges, basic patterns), layer 2 combines those into shapes, and deeper layers combine those into full concepts (a face, a word, a chess position).

</div>

<div class="optional md" data-headline="The Universal Approximation Theorem">

There is a beautiful mathematical guarantee behind all of this, called the **Universal Approximation Theorem**. It's actually a *family* of related results — notably \citeauthor{cybenko1989} (\citeyear{cybenko1989}) and \citeauthor{hornik1989universal} (\citeyear{hornik1989universal}) — and they all say roughly the same thing:

> A network with just **one hidden layer** can approximate **any reasonable continuous function** as closely as you want, as long as it has enough neurons.

Formally, such a network computes:

$$h(x) \;=\; \sum_{j=1}^{n} \beta_j\, \psi\!\big(a_j^{\top} x - \theta_j\big)$$

which is just: take $n$ neurons, each one bends the input its own way ($\psi$ with weights $a_j$ and threshold $\theta_j$), then add up their outputs weighted by $\beta_j$. If $n$ is large enough, this sum can match the shape of *any* well-behaved function.

**Two important caveats**, because this theorem is often oversold:
1. It's an **existence** proof, not a **learning** proof. It says the right weights *exist*, not that gradient descent will find them.
2. "Enough neurons" can mean *astronomically* many. In practice, a shallow-but-huge network is almost never the right choice — **depth is dramatically more efficient** than width, as we'll see next.

And the cleanest modern characterization, \citeauthor{petersen2024mathdl} (\citeyear{petersen2024mathdl}), gives an exact *if and only if*: the one-hidden-layer network is a universal approximator **if and only if** the activation is not a polynomial. That means sigmoid, ReLU, tanh, SiLU — every standard activation — qualifies, while no amount of width can compensate for a polynomial activation.

So the theorem is foundational, but it doesn't explain *why* deep networks work so well. For that, we need to look at what depth actually buys us.

</div>

<div class="md" data-mathlevel="50" data-optionaltitle="Why Deep Learning Works (And Why It Works So Well)">

## Why Deep Learning Works (And Why It Works *So* Well)

Here's the honest, mechanical answer to why "a big pile of matrix multiplications" ends up being able to translate languages, recognize faces, and play chess better than any human. It comes down to four ingredients working together: **depth**, **nonlinearity**, **backpropagation**, and the **optimizer's hidden preferences**.

### The One-Paragraph Answer

A deep network is a **composition of many simple functions**. Each function (a "layer") is a matrix multiplication followed by a small bend. On its own, one layer is powerless — it can only mix, rotate, and scale. But **chained together, simple steps stack into arbitrarily complex ones**. Then **training** (forward pass → measure error → **backprop** → **optimizer step**) tunes the weights until the whole composition implements the right input-to-output map. The "storage" of knowledge is nothing more than the final tuned weights. Depth gives us **expressivity**, the nonlinearity prevents **collapse**, backprop provides an **efficient learning signal**, and the optimizer has a built-in **bias toward simple, generalizing solutions** rather than memorization.

---

### Depth = Composition, and Why the "Bend" Is Everything

One layer looks like:

$$h_{\ell} \;=\; \underbrace{\sigma}_{\text{the bend}}\Big(\underbrace{W_{\ell}}_{\text{learned mixing}}\, h_{\ell-1} \;+\; \underbrace{b_{\ell}}_{\text{offset}}\Big)$$

A deep network with $L$ layers just feeds each layer's output into the next:

$$\hat{y} \;=\; f_L\!\big(f_{L-1}(\cdots f_1(x)\cdots)\big)$$

**Here's the crucial part.** If you removed the bend $\sigma$, the whole stack collapses:

$$W_L\,W_{L-1}\cdots W_1\,x \;=\; \underbrace{(W_L W_{L-1}\cdots W_1)}_{\text{just one matrix}}\, x$$

A stack of pure linear layers is **mathematically identical to one linear layer**. No matter how deep, it can only draw straight lines. It cannot compute $x^2$, it cannot solve XOR, it cannot tell a cat from a dog.

The nonlinearity **prevents that collapse**. Each $\sigma$ re-bends the space, so the next matrix multiplies something that has *already been transformed*. Depth alone isn't the power — **depth with a bend in between** is.

---

### Why Depth Beats Width: Reuse

The mechanical reason depth is so effective is **reuse**. A sub-result computed by an early layer is reused by everything downstream. Depth turns "compute, throw away, recompute" into "compute once, reuse everywhere."

**A concrete example.** Suppose we want to check "is a point inside an $n$-dimensional unit box?" — meaning each coordinate must be in $(0,1)$.

- A **shallow** (2-layer) network needs roughly $2^n$ neurons to capture this — **exponential** growth.
- A **deep** network with $n$ layers of just a few neurons each does it in $O(n)$ total neurons. Each layer checks one coordinate and multiplies by the running result from the previous layer.

Same function. Linear vs. exponential. This isn't a fluke: \citeauthor{telgarsky2016wars} proved there exist functions a deep net represents with $O(n)$ neurons that a shallow net needs $2^{\Omega(n)}$ neurons to match. And \citeauthor{montufar2014regions} showed that the number of distinct "linear regions" a ReLU network can carve out **grows exponentially with depth** — the compositional structure is exactly what buys the exponential expressivity. And the bound is **tight**: a depth-$L$ ReLU network of width 2 produces a "sawtooth" with exactly $2^L$ linear regions, so the exponential growth is guaranteed, not merely possible \cite{petersen2024mathdl}.

**What this looks like conceptually:** each layer builds features **on top of** the previous layer's features.
- Layer 1: edges, simple patterns.
- Layer 2: patterns *made of* layer-1 patterns (corners, textures).
- Layer $k$: patterns made of $(k{-}1)$-level patterns.

This matches how **the real world is structured**: pixels → edges → parts → objects; sounds → phonemes → words → meaning. Deep networks are compact for the same reason: the world itself is compositional.

---

</div>

<div class="md" data-mathlevel="60" data-optionaltitle="How the Knowledge Gets Into the Weights">
### How the Knowledge Gets Into the Weights

Before training, the weights are random and the network's output is garbage. Training runs a loop:

**1. Forward pass** — run input $x$ through all layers, get prediction $\hat{y}$.

**2. Loss** — measure how wrong we were in a single number:

$$\mathcal{L} = L(\hat{y}, y)$$

**3. Backpropagation** — figure out, for every single weight, "if I nudge it slightly, does the error go up or down?" Because the network is a composition, the influence of a weight in layer $\ell$ flows through *every layer after it*. The **chain rule** from calculus handles this:

$$\frac{\partial \mathcal{L}}{\partial W_{\ell}} \;=\; \frac{\partial \mathcal{L}}{\partial \hat{y}} \;\cdot\; \frac{\partial \hat{y}}{\partial h_\ell} \;\cdot\; \frac{\partial h_\ell}{\partial W_{\ell}}$$

The clever part is that backprop **reuses intermediate results**, walking the error signal *backward* through the network. What would naively be exponential bookkeeping becomes **linear in the number of layers**.

**4. Optimizer step** — nudge every weight a small amount in the direction that reduces the error:

$$W_{\ell} \;\leftarrow\; W_{\ell} - \underbrace{\eta}_{\text{step size}}\, \underbrace{\nabla_{W_\ell}\mathcal{L}}_{\text{direction of steepest error increase}}$$

Repeat millions of times. The **trajectory of the weights through weight-space** is literally what writes the knowledge into the matrices. There is no separate memory — the knowledge *is* the final numbers.

---

### Residual Connections: How We Actually Train *Really* Deep Networks

There's a practical problem with stacking many layers. When backprop sends the error signal backward through, say, 100 layers, it gets multiplied by many small numbers along the way. The signal often **shrinks to nearly zero** (the "vanishing gradient" problem) or occasionally explodes. Early layers stop learning because they receive no meaningful feedback.

\citeauthor{he2015resnet} introduced a stunningly simple fix: the **residual connection** (also called a skip connection). Instead of each layer computing an entirely new representation, it computes just a **correction** and adds it to the running state:

$$h_{\ell} \;=\; \underbrace{h_{\ell-1}}_{\text{running state}} \;+\; \underbrace{f_\ell(h_{\ell-1})}_{\text{small correction from this layer}}$$

This one change transforms deep networks in three ways:

**1. Gradients flow freely.** Because of the $+h_{\ell-1}$ term, the derivative through the skip path is exactly $1$. The error signal has a **highway back to the earliest layers** — it can no longer be strangled by many small multiplications. This is what makes training networks with hundreds or even thousands of layers actually possible.

**2. Each layer only has to learn a small refinement.** Instead of every layer needing to reinvent the entire representation, layers are free to add tiny, targeted adjustments. If a layer has nothing useful to add, it can just learn $f_\ell \approx 0$ and let the input pass through unchanged. Bad layers become harmless; good layers become powerful.

**3. It creates the "residual stream."** In modern transformers, this idea becomes central: the running state $h_{\ell-1} + h_\ell + h_{\ell+1} + \dots$ acts like a **shared communication bus** that every layer can read from and write to. Attention heads and MLPs across the whole network exchange information by adding features into this stream and reading them out later. This is why transformer analyses (see \citeauthor{elhage2021framework}) treat the residual stream as the central object of the network — it's the substrate on which computation actually happens.

Residual connections also **flatten the loss landscape** \cite[Li et al.]{li2018losslandscape}, making the optimization problem itself easier and pushing training toward solutions that generalize better. It's one of the rare tricks in deep learning that improves trainability, generalization, *and* interpretability all at once.

---

### The Loss Landscape and the "Implicit Bias" That Makes It Work

The loss $\mathcal{L}(W)$ is a surface in a space with **millions or billions of dimensions**. Gradient descent is a ball rolling downhill on this surface. Two facts shape what it finds.

**Saddle points, not local minima, are the real obstacle.** In very high dimensions, almost every flat spot is a saddle (curving up in some directions, down in others), not a true trap \cite[Dauphin et al.]{dauphin2014saddle}. The **randomness in mini-batch training** acts like little kicks that knock the ball off saddles, which is why training huge networks actually works. And for a single-hidden-layer network with at least as many neurons as training samples, the loss landscape has **no spurious valleys at all** — every local minimum is a global minimum \cite{petersen2024mathdl}.

<div class="smart-quote" data-cite="petersen2024mathdl" data-after="Ch. 12, Prop. 12.4">
Then, ΛA,σ,S,L, has no spurious valleys.
</div>

**Which solution does the optimizer pick?** In modern over-parameterized networks, there are **infinitely many** weight configurations that perfectly fit the training data. The question isn't "can we fit the data" — it's "*which* fit do we get?"

This is called the **implicit bias** of the optimizer, and it's decisive. Gradient descent from small initial weights, combined with a small penalty on weight size (weight decay), consistently prefers the **simplest, most compact** solution among all the ones that fit:

$$\mathcal{L}_{\text{total}} = \underbrace{\mathcal{L}_{\text{data}}}_{\text{fit the examples}} + \underbrace{\lambda \sum_{\ell}\|W_\ell\|_F^2}_{\text{prefer smaller / simpler weights}}$$

The simple solution is usually the one that **generalizes** to unseen data, rather than memorizing. This bias is arguably the single most important reason deep learning works in the real world.

---

### Grokking: Watching Understanding Emerge

The most striking demonstration of this implicit bias is **grokking** \cite[Power et al.]{grokking}. Train a small transformer on modular arithmetic (like $a \times b \bmod p$) with weight decay, and watch the test accuracy:

1. **Memorization phase.** The network quickly memorizes the training examples. Training accuracy shoots to 100%, but test accuracy stays at chance. It has learned a lookup table.
2. **Long plateau.** Test accuracy stays terrible for a long time — sometimes tens of thousands of steps — while training accuracy stays perfect. It looks completely hopeless.
3. **Grokking.** Then suddenly, test accuracy jumps to 100%. The network has discovered the actual **mathematical rule** for modular multiplication, replacing its lookup table with a compact algorithm.

Mechanistic analysis \cite[Nanda et al.]{nanda2023grokking} shows exactly what happens: the network swaps its memorizing representation for a small, elegant circuit built from learned features. \citeauthor{davies2023unifying} unified this with the older **double descent** phenomenon \cite[Belkin et al.]{belkin2019reconciling}: generalizing solutions are learned *more slowly* than memorizing ones, but if you give the optimizer enough time (or enough parameters), the slow-but-simple solution wins.

This is the deepest answer to why deep learning works so well: **the optimizer is quietly biased toward discovering the actual underlying structure of the problem**, not just fitting the data.

---

### Putting It All Together

So, why does "just matrix multiplication" work?

1. **A single matrix multiplication is intentionally weak.** It can only mix, rotate, scale.
2. **The bend + composition is the expressivity.** Stacking bent maps produces piecewise functions of exponential complexity, and each layer combines *already-learned features* from the previous one.
3. **Backprop + the optimizer sculpt the weights** into implementing the specific function the data demands.
4. **The implicit bias** ensures the network finds a compact, generalizing solution rather than a giant lookup table.
5. **Residual connections** are what makes all of this scalable to hundreds of layers, turning depth from a liability back into a strength.

The "understanding" a network appears to have doesn't live in any single multiplication. It lives in **the pattern of all the weights across all the layers** — a pattern shaped by the compositional structure of the world, discovered by gradient descent, and stored as the final numbers in the matrices.

</div>

<div class="md">
### The Role of Non-Linearity

The activation function $\sigma$ (like **ReLU** or **Sigmoid**) is the glue that makes stacking work. Without it, the whole network — no matter how deep — collapses into a single linear function, because "a linear function of a linear function is still linear."

By keeping non-linear "bends" between the stacks, the network can warp the coordinate space in complex ways, letting it solve problems that no straight line ever could — like the classic **XOR** gate.

**Tip:** Try changing the activation function of the hidden layer in the playground below and watch what happens.
</div>

<div style="margin-bottom: 15px; display: flex; gap: 10px;">
	<button class="btn" onclick="DeepLab.loadPreset('AND')">AND</button>
	<button class="btn" onclick="DeepLab.loadPreset('XOR')">XOR</button>
	LR: <input type="number" id="deep-lr" value="0.05" step="0.01" style="width: 100px;">
	Epochs: <input type="number" id="deep-epochs" value="100" style="width: 100px;">
</div>
<div id="deep-gui" class="layers-vertical"></div>
<div>
	<div id="fcnn_wrapper">
		<canvas id="fcnn_canvas"></canvas>
	</div>
	<div style="display: flex; gap: 15px; flex-wrap: wrap;">
		<div id="deep-loss-chart" class="dll-plot-container"></div>
		<div id="deep-data-chart" class="dll-plot-container"></div>
	</div>
	<div style="margin-top: 10px;">
		<b>Weights (Live):</b>
		<div id="deep-tensor-viz" style="display:flex; gap:5px; flex-wrap: wrap;"></div>
	</div>
	<div id="deep-math-monitor" style="padding:15px; margin-top:10px;"></div>
	<table id="deep-train-table">
		<thead><tr id="deep-thr"></tr></thead>
		<tbody></tbody>
	</table>
	<button class="btn" style="background:#10b981; color:white; width:100%" onclick="DeepLab.addRow('deep')">+ Add New Data Row</button>
	<div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top:10px;">
		<div id="manual-input-area" style="display:inline-block; margin: 0 10px;"></div>
		<span>→ <strong id="manual-result" style="color:#b45309">0.00</strong></span>
	</div>
	<button id="btn-deep-train" class="btn btn-train" onclick="DeepLab.toggleTraining('deep')">🚀 Start Training</button>
	<button class="btn" style="background:#64748b; color:white; width:100%" onclick="DeepLab.init('deep')">🔄 Reset Model</button>
	<div id="deep-console" class="status-console"></div>
</div>
