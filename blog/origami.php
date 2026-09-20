<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Origami in N Dimensions
description: How feed-forward networks manufacture linear separability by progressively folding the data manifold into unoccupied higher dimensions.
icon: &#128208;
part: 3
order: 2
color: emerald
topics: architecture, math-iii, deep-learning, interpretability
tags: math-heavy, logic-heavy
-->

<style>
	.og-demo { background: var(--mn-surface); border: 1px solid var(--mn-border); border-radius: 12px; padding: 18px; margin: 22px 0; }
	.og-demo h3 { margin: 0 0 8px; font-size: 1.05rem; color: var(--mn-text); }
	.og-controls { display: flex; flex-wrap: wrap; gap: 16px; margin: 12px 0; align-items: flex-end; }
	.og-control { display: flex; flex-direction: column; gap: 4px; min-width: 150px; }
	.og-control label { font-size: .85rem; color: var(--mn-text-secondary); }
	.og-control .val { color: var(--mn-accent); font-family: var(--mn-font-mono, monospace); }
	.og-control input[type="range"] { width: 100%; accent-color: var(--mn-accent); }
	.og-control select { background: var(--mn-surface); color: var(--mn-text); border: 1px solid var(--mn-border); padding: 5px 8px; border-radius: 6px; }
	.og-btn { background: var(--mn-accent); color: #fff; border: none; padding: 7px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: .85rem; }
	.og-btn.sec { background: var(--mn-surface); color: var(--mn-text); border: 1px solid var(--mn-border); }
	.og-canvas-wrap { position: relative; margin: 12px 0; text-align: center; }
	.og-canvas-wrap canvas { display: inline-block; max-width: 100%; height: auto; border-radius: 8px; background: var(--mn-bg-subtle); }
	.og-legend { display: flex; gap: 16px; flex-wrap: wrap; font-size: .85rem; margin: 8px 0; color: var(--mn-text-secondary); }
	.og-legend span { display: inline-flex; align-items: center; gap: 6px; }
	.og-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
	.og-note { background: color-mix(in srgb, var(--mn-accent) 8%, var(--mn-surface)); border-left: 3px solid var(--mn-accent); padding: 12px 16px; margin: 14px 0; border-radius: 4px; font-size: .95rem; color: var(--mn-text); }
	.og-out { margin-top: 8px; color: var(--mn-text-secondary); font-size: .9rem; font-family: var(--mn-font-mono, monospace); }
	.og-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
	@media (max-width: 700px) { .og-grid2 { grid-template-columns: 1fr; } }
</style>

<div class="md">
## Why a Straight Line Is Not Enough

In the previous chapter we saw that a deep network is a **composition of many simple
functions**, and that — as the Universal Approximation Theorem guarantees — a wide
feed-forward net can approximate any continuous function \cite[Cybenko, 1989]{cybenko1989}
\cite[Hornik et al., 1989]{hornik1989universal}. But the theorem is an *existence* result.
It does not answer a more mechanical question: **what does a layer actually *do* to the
data, step by step, to make a task solvable?**

Before we start, name the object we are looking at, because the answer changes depending on
which one it is. The folding story of this chapter is about a specific kind of layer — the
**dense (fully-connected) ReLU block**: a tower of layers, each of which multiplies the data
by a matrix and then applies a ReLU to every neuron. That is the setting in which the
folding picture holds, and it is also the sub-block that the bigger architectures you have
seen (CNNs, transformers) are built out of. We come back to exactly what the claim does and
does *not* cover at the end.

Start from what classification demands. The very last layer of a network is a **linear
readout** — it just computes a weighted sum and thresholds it. Geometrically, it can only
draw a *flat* boundary: a line in 2D, a plane in 3D, a hyperplane in general. So for the
final readout to work, the representation in the last hidden layer must already be
**linearly separable** \cite{linear_separability_wiki}: the classes must be cleanly
separated by a flat surface. (For a **multi-class** head there is simply one such readout *per
class* — one linear "cut" per class — and a softmax over them picks the winner
\cite{softmax_wiki}; everything in this chapter carries over unchanged.)

But the raw data almost never is. A classic example is the **"2d-egg"**: one class forms
a ring *surrounding* another. No straight line — no matter how you rotate or slide it — can
separate the inside from the outside. Real-world data is full of such entanglement: a
"pair" in poker is *defined by* what surrounds it, a digit "0" is a hole, a face is an
island inside a sea of background.

So there is a gap the network *must* close: the hidden layers have to take a
**linearly non-separable** distribution and progressively **manufacture** a linearly
separable one. *Keup & Helias (2022)* ask exactly this \cite{keup2022origami}: which
**elementary operations** does a feed-forward layer have at hand, and which of them are
efficient? The answer they arrive at is a beautiful one — the network is, in effect,
**folding paper**.

Below you can drag the separating line yourself and feel why the egg resists it.
</div>

<div class="og-demo">
	<h3>Try it: no single line can separate the egg</h3>
	<p style="margin:0 0 4px; color: var(--mn-text-secondary)">Pick a dataset, then drag the
	<b>angle</b> and <b>offset</b> of a straight line and watch the best accuracy it can
	reach. The "inner" class is always trapped by the "outer" one, so a flat boundary plateaus
	well below 100%.</p>
	<div class="og-controls">
		<div class="og-control"><label>Angle of separating line: <span class="val" id="og-angle-v">0°</span></label><input type="range" id="og-angle" min="0" max="360" value="45"></div>
		<div class="og-control"><label>Offset: <span class="val" id="og-shift-v">0.00</span></label><input type="range" id="og-shift" min="-2" max="2" step="0.05" value="0"></div>
		<div class="og-control"><label>Dataset</label>
			<select id="og-setup">
				<option value="egg">2D-Egg (ring)</option>
				<option value="xor">XOR</option>
				<option value="spiral">Spiral</option>
			</select>
		</div>
	</div>
	<div class="og-canvas-wrap"><canvas id="og-nonsep" width="640" height="420"></canvas></div>
	<div class="og-legend">
		<span><span class="og-dot" style="background:#ff6b9d"></span>Inner class</span>
		<span><span class="og-dot" style="background:#4ecdc4"></span>Outer class</span>
		<span><span class="og-dot" style="background:#ffe66d"></span>Separator line</span>
	</div>
	<div class="og-out" id="og-nonsep-out"></div>
</div>

<div class="md">
## The Two Tools of a Layer: the Anvil and the Hammer

Every layer does **two** things in sequence:

$$x_i^{(l)} \;=\; \Phi\!\left(\sum_j W^{(l)}_{ij}\, x_j^{(l-1)} \;+\; b_i^{(l)}\right)$$

1. **An affine transformation** $W\,\mathbf{x} + \mathbf{b}$. This is rotation, scaling,
   shearing and translation. It *positions* the data — but it maps **lines to lines**, so
   it cannot change whether classes are linearly separable. Picture it as sliding the data
   around on a blacksmith's **anvil**.
2. **A nonlinearity** $\Phi$, applied to each neuron independently. With ReLU,
   $\Phi(x) = \max(0, x)$ \cite{relu_wiki}, this is the **hammer**: every neuron is a
   hyperplane, and all the data on its *negative* side gets **pressed flat onto that
   hyperplane** (those preactivations become $0$). The combined effect of all neurons in a
   layer is to jam the data distribution into **the corner of an $N$-dimensional room**.

This is not just intuition — it has been made rigorous. The affine step is precisely the part that preserves convexity (straight lines stay straight); the ReLU is what breaks it. Map a straight line in the input to the network's activation ("Hamming") space and its image is generally a *non-convex* path whose distance can even decrease. This convexity-breaking has been proved and quantified \cite{lewandowski2025spacefolds}.

Here is the first, important limitation: a hammer only dents the **outer boundary** of a
clump. To reach a data point that sits *inside* the distribution, you would have to crush
everything outside it first. In other words, the nonlinearity can only reshape the
**convex hull** of the data \cite{convex_hull_wiki} — it cannot selectively grab an inner
class. So how does a network ever get at an "island" class that is completely surrounded?
</div>

<div class="og-demo">
	<h3>The ReLU as a hammer-blow</h3>
	<p style="margin:0 0 4px; color: var(--mn-text-secondary)">Each neuron is a hyperplane
	(yellow). Drag its <b>angle</b> and <b>bias</b>: points on the negative side are projected
	onto the plane (shown pink, "flattened"), points on the positive side stay put. Watch how
	the dent can only ever bite the *outside* of the cloud.</p>
	<div class="og-controls">
		<div class="og-control"><label>Hyperplane angle: <span class="val" id="og-hp-a-v">90°</span></label><input type="range" id="og-hp-a" min="0" max="360" value="90"></div>
		<div class="og-control"><label>Bias (offset): <span class="val" id="og-hp-b-v">0.00</span></label><input type="range" id="og-hp-b" min="-2" max="2" step="0.05" value="0"></div>
	</div>
	<div class="og-grid2">
		<div><h3 style="text-align:center; font-size:.95rem">Before</h3><div class="og-canvas-wrap"><canvas id="og-before" width="360" height="320"></canvas></div></div>
		<div><h3 style="text-align:center; font-size:.95rem">After the ReLU</h3><div class="og-canvas-wrap"><canvas id="og-after" width="360" height="320"></canvas></div></div>
	</div>
</div>

<div class="md">
## The Key Idea: Fold, Don't Crush

The crucial observation is about **unused dimensions**. In a real network the layers are
almost always **wider than the data**: the input might be 10-dimensional, but a hidden
layer has 100 units. That leaves 90 directions in activation space that the data does not
yet touch.

Now here is the magic. If a ReLU hyperplane hits the data **from one of those unoccupied
directions**, it does *not* flatten the points on top of each other. Instead it **folds**
the data along the fold line and lifts it off into the new dimension. Crucially, this fold
is still *injective* — no information is lost, unlike a flattening. And right along the
fold, an **internal region of the distribution is exposed** to the outside of the
embedding space. A linear readout from the next layer can now grab that previously-hidden
region.

Fold a 1D "egg" — the class living on a line, with the interesting bits in the middle —
into the unused second dimension, and the middle pops *up* while the ends stay *down*.
Suddenly a flat horizontal line separates them.
</div>

<div class="og-demo">
	<h3>Folding a 1-D "egg" into 2-D</h3>
	<p style="margin:0 0 4px; color: var(--mn-text-secondary)">The data lives on a line (the
	$X$-axis). A ReLU with a component in the unused vertical direction folds it. Move the
	<b>fold position</b>, change the <b>fold angle</b>, or add more <b>folds</b>, and watch
	the best horizontal separation improve.</p>
	<div class="og-controls">
		<div class="og-control"><label>Fold position: <span class="val" id="og-fold-b-v">-0.50</span></label><input type="range" id="og-fold-b" min="-1.5" max="1.5" step="0.05" value="-0.5"></div>
		<div class="og-control"><label>Fold angle: <span class="val" id="og-fold-a-v">60°</span></label><input type="range" id="og-fold-a" min="10" max="170" value="60"></div>
		<div class="og-control"><label>Number of folds: <span class="val" id="og-fold-n-v">1</span></label><input type="range" id="og-fold-n" min="1" max="4" value="1"></div>
	</div>
	<div class="og-canvas-wrap"><canvas id="og-fold1d" width="700" height="380"></canvas></div>
	<div class="og-legend">
		<span><span class="og-dot" style="background:#ff6b9d"></span>Inner</span>
		<span><span class="og-dot" style="background:#4ecdc4"></span>Outer</span>
		<span><span class="og-dot" style="background:#ffe66d"></span>Fold edge</span>
	</div>
	<div class="og-out" id="og-fold1d-out"></div>
</div>

<div class="md">
Now scale the picture up. The famous **2D egg** (a ring inside a ring) can be solved by a
*single* hidden layer of just **three** ReLU neurons. Each neuron is a flat hyperplane
tilted at $120^\circ$ to the others; their ReLU outputs are stacked into a new **third**
dimension. The result is a folded 3-D shape where the inner ring is lifted up into a
**tent**, while the outer ring lies flat. A single flat horizontal plane now cleanly
separates them — recall of $100\%$ for the inner class and $\approx 97\%$ for the outer
one. Drag to look around the folded representation:
</div>

<div class="og-demo">
	<h3>3-D view: three neurons fold the 2-D egg apart</h3>
	<p style="margin:0 0 4px; color: var(--mn-text-secondary)">Three hyperplanes (one per
	neuron) fold the flat egg into 3-D. <b>Drag to rotate</b>, or animate the fold from flat
	($0\%$) to fully lifted ($100\%$). The yellow plane is the flat readout that finishes the
	job in the output layer.</p>
	<div class="og-controls">
		<button class="og-btn" id="og-fold-anim">▶ Animate fold</button>
		<button class="og-btn sec" id="og-reset-3d">Reset view</button>
		<div class="og-control" style="min-width:220px"><label>Fold progress: <span class="val" id="og-3d-tval">100%</span></label><input type="range" id="og-3d-t" min="0" max="100" value="100"></div>
	</div>
	<div class="og-canvas-wrap"><canvas id="og-fold3d" width="640" height="460"></canvas></div>
</div>

<div class="og-demo">
	<div class="og-note">📐 <b>Why one layer suffices.</b> The folding edge of an $N$-dimensional
	egg is a hyperplane of one lower dimension, and a single layer can apply several folds at
	once. In general an $N$-dimensional egg is (approximately) solved by <b>one layer of
	$N+1$ neurons</b> — a small, constant overhead, not an exponential one.</div>
</div>

<div class="optional md" data-headline="The Fold-and-Cut Theorem">
This paper-folding intuition is not just a metaphor. In origami mathematics there is a
classic result — the **fold-and-cut theorem** (also called the one-cut theorem) — that
states a mind-bending rule: **you can cut out any shape made of straight lines from a
single sheet of paper using just one single, straight cut** — as long as you fold the
paper correctly beforehand. Whether it is a five-pointed star, the entire alphabet, or a
highly detailed silhouette of a swan: mathematics guarantees that there exists a folding
pattern which lines up the shape's *entire perimeter* onto a single straight line. Once
folded, you take your scissors, make one straight snip, and the shape falls out perfectly
\cite{foldandcut_wiki}.

<figure style="max-width:560px; margin:1.5em auto; text-align:center;">
	<img src="folded_koch.gif" alt="Animation: a sheet of paper is folded flat step by step until the entire perimeter of a Koch snowflake lies on a single straight line, so that one straight cut cuts out the whole curve" style="width:100%; height:auto; border-radius:6px;" />
	<figcaption class="md">The theorem in action, animated: a **Koch snowflake** created
	by the fold-and-cut method. Step by step the paper is folded flat until the
	snowflake's *entire perimeter* lies on **one** straight line — after which a single
	complete, straight cut cuts out the whole curve at once. \cite[Image: FoldedKoch.gif, Greg Egan, CC BY-SA 4.0 (Wikimedia Commons)]{foldedkoch_img}</figcaption>
</figure>

A neural network is doing exactly this — in $N$ dimensions. The hidden layers perform the
"paper folding"; the **final linear layer is the single straight cut**. Fold the data
manifold appropriately, and one flat hyperplane can separate *any* class you care about.
This is a remarkably concrete way to think about the Universal Approximation Theorem for
ReLU networks: **universal approximation $\approx$ $N$-dimensional origami + one flat
cut.**
</div>

<div class="md">
## Deep Networks: an Origami Cascade

A deep network does not fold once and stop. **Each layer folds the already-folded object
again**, exactly like real origami. After a few folds a sheet has exponentially more edges
than the number of folds you actually made — the creases compound. The same is true here:
a deep ReLU network is a **piecewise-linear** function whose number of linear regions
**grows exponentially with depth**. Depth buys a combinatorial explosion of boundaries that
a wide but shallow net cannot match.
</div>

<div class="og-demo">
	<h3>Progressive folding: regions multiply with depth</h3>
	<p style="margin:0 0 4px; color: var(--mn-text-secondary)">Each colour is a distinct
	linear region — a place where the network is just a fixed linear function. Add layers or
	neurons and count how fast the mosaic of regions explodes.</p>
	<div class="og-controls">
		<div class="og-control"><label>Layers: <span class="val" id="og-cas-l-v">3</span></label><input type="range" id="og-cas-l" min="1" max="6" value="3"></div>
		<div class="og-control"><label>Neurons / layer: <span class="val" id="og-cas-n-v">2</span></label><input type="range" id="og-cas-n" min="1" max="4" value="2"></div>
	</div>
	<div class="og-canvas-wrap"><canvas id="og-cascade" width="700" height="360"></canvas></div>
	<div class="og-out" id="og-cas-out"></div>
</div>

<div class="md">
## The Inefficient Alternative: Shear (Peeling the Orange)

Folding is the *efficient* route, and it depends on having spare dimensions. What if a
layer is **narrow** — no room to fold into? Then the only remaining trick is
**shear**: using tilted hyperplanes together with the ReLU, the network nudges a slice of
probability mass *to the side*, one thin layer of the outer class at a time. It is like
**peeling an orange** — you have to work around the whole surface. In 3-D it gets worse:
you cannot just go around once, you must trace a **spiral** (peel an orange, not a sheet).
Only **one** piece can be shaved off *per layer*, so even the toy 2-D egg needs several
layers, and higher-dimensional eggs need many more. This is why the authors argue shear
plays only a minor role in real, wide networks — and it is consistent with the result that
**deep but fixed-width ("skinny") networks are not universal approximators**
\cite{johnson2018skinny}.
</div>

<div class="og-demo">
	<h3>Peeling, one layer at a time</h3>
	<p style="margin:0 0 4px; color: var(--mn-text-secondary)">Each step peels off one slice
	of the outer class with a sheared hyperplane. Step through the layers and watch how many
	it takes before a flat line (dashed) can separate the classes — versus **one** folded layer.</p>
	<div class="og-controls">
		<div class="og-control"><label>Peeling layers: <span class="val" id="og-shear-l-v">7</span></label><input type="range" id="og-shear-l" min="1" max="12" value="7"></div>
		<button class="og-btn" id="og-shear-step">Step +1 layer</button>
	</div>
	<div class="og-canvas-wrap"><canvas id="og-shear" width="700" height="380"></canvas></div>
	<div class="og-out" id="og-shear-out"></div>
</div>

<div class="md">
## Reading the Folds Out of a Trained Network

All of the above is a story about *what a network could do*. How do we check that a
**trained** network actually *did* it? In high dimensions we cannot simply look. Instead
the authors define **observables** — measurable quantities that are the causal fingerprint
of a fold:

* **Dimensionality expansion.** A fold opens a new direction, so the effective dimension
  of the layer's representation (via PCA) should *grow* as we go down.
* **Bimodal tuning curves.** A good fold responds *weakly* to the inner class but
  *strongly* to the outer class (or not at all). So the preactivation histogram of such a
  neuron shows a **dip near zero** for one class — a bimodal (or multi-modal) shape — while
  it is unimodal for the others. This is a signature of **mixed selectivity**.
* **Hyperplane angle.** A folding neuron's hyperplane should sit at an *intermediate* angle
  to the data subspace (neither parallel nor orthogonal).

The strongest test is causal: if the bimodal neurons are the ones doing the separating
work, then **silencing** them should crash the accuracy, while silencing unimodal neurons
should barely matter.

A second, independent line of work provides a **quantitative measure** of this folding.
Instead of looking at individual neurons, **Lewandowski et al. (2025)** \cite{lewandowski2025spacefolds}
take a *straight line* in the input space, map it through the net, and watch what happens
to it in the activation ("Hamming") space. Because the ReLU breaks convexity, the image
is generally a *non-convex* path whose distance can even decrease. They turn this
deviation from convexity into a single number, a **space-folding measure** $\chi$ based on
range metrics (a random-walk-inspired approach). On a self-similar fractal benchmark
(CantorNet) and on MNIST, they find that the maximum folding $\chi$ grows with
**depth** in well-trained networks (correlating with depth at $r \approx 0.99$) and
tracks generalization; they also find that while wider networks don't fold *more* per
path, a far larger *fraction* of paths fold at all (from roughly a third to essentially
all as width increases).

**The same authors rebuilt the measure on firmer ground.** In *The Space Between*
\cite{lewandowski2025spacebetween} the fold of a path is defined as the gap between how far
it wanders from its start and how much total distance it travels,
$\chi = 1 - \dfrac{\max_i d_H(\pi_i,\pi_1)}{\sum_i d_H(\pi_i,\pi_{i+1})}$, with inputs grouped
into **equivalence classes** — all inputs that hit the same active/inactive pattern (a linear
region, for ReLU). That single move generalizes $\chi$ to Swish, GELU and SwiGLU, and exposes
two facts the first paper left implicit: folding is **direction-sensitive**
($\chi(\Gamma)\neq\chi(-\Gamma)$ in general, although *flatness*, $\chi=0$, is not), and it can
be turned into a **regularizer** — a penalty that is large when the fold is *small* early in
training nudges the net to fold more, and that improves generalization. Folding becomes an
explicit term in the loss: a "reward for folding".

**And there is a constructive proof that folding is what buys depth.** Amrami & Goldberg
(2021) \cite{amrami2021depth} give an elementary, geometry-only argument that *exploits* exactly
this mechanism: a family of classification problems, indexed by $m$, that any **fixed-depth**
ReLU net needs **exponentially many** parameters to solve, yet a net of **linear** depth and
width $\le 4$ solves every one with zero error — by literally folding the input space until the
classes separate. It is a compact, undergraduate-friendly proof that the folding above is
*load-bearing*, a clean modern statement of why depth beats width in the same geometric
language as Keup & Helias.

Keep two numbers straight, because they disagree and both are true. The **worst-case** count
of linear regions a deep ReLU net can carve is **exponential** in depth
\cite{montufar2014regions}, but the **realized** count in a trained net is far smaller. The
space-fold work confirms it: wider nets fold *more paths* yet each path folds about as much,
and the per-path fold saturates. So a trained net is not *enumerating* its region budget; it
spends **depth** to fold only the structure the task needs and leaves the exponential slack
unspent. That gap between the exponential upper bound and the sparse realized geometry is what
the polyhedral view makes precise (see *The polyhedral backbone* below).
</div>

<div class="og-demo">
	<h3>The fingerprint of a fold: bimodal tuning</h3>
	<p style="margin:0 0 4px; color: var(--mn-text-secondary)">A single neuron's preactivation
	$z = \mathbf{w}\cdot\mathbf{x} + b$, bucketed by class. Move the <b>angle</b> and
	<b>bias</b> so the fold edge lands on the inner class: the inner class develops a **dip at
	zero** while the outer classes pile up on either side. The "dip score" readout turns
	positive exactly when that happens.</p>
	<div class="og-controls">
		<div class="og-control"><label>Neuron angle: <span class="val" id="og-tune-a-v">60°</span></label><input type="range" id="og-tune-a" min="0" max="180" value="60"></div>
		<div class="og-control"><label>Neuron bias: <span class="val" id="og-tune-b-v">0.00</span></label><input type="range" id="og-tune-b" min="-2" max="2" step="0.05" value="0"></div>
	</div>
	<div id="og-tuning" style="width:100%;height:340px"></div>
	<div class="og-out" id="og-dip-out"></div>
</div>

<div class="md">
## Validation: the Poker-Hand Task

To test the theory on a real (if small) problem, the authors train a three-layer fully
connected ReLU network on the **poker-hand** dataset \cite{poker_hand_uci}. A five-card hand
is encoded as a **10-dimensional** input (suit and rank of each card), and the target is one
of **10 hand types** (nothing, pair, two pairs, three of a kind, straight, flush, full
house, …). The architecture is $10 \to 100 \to 100 \to 10$.

This task is a perfect probe for four reasons: a linear classifier sits near chance (so the
network *must* manufacture separability); the tabular data offers no advantage to
convolution (so we stay in the fully-connected regime); the dataset is exhaustive (so the
true task structure is actually learned); and it is high-dimensional enough to defeat
3-D visualization, yet simple enough to reason about.

What the trained network shows is exactly the predicted pattern — strong **dimensionality
expansion** in the hidden layers (the folds opening new directions), the **emergence of
bimodal tuning** during training (whereas a random, untrained network has near-Gaussian
curves), and — most tellingly — a **causality test** in which silencing ten strongly
*bimodal* neurons drops the macro-F1 score sharply, while silencing ten *unimodal* ones
barely does:
</div>

<div class="og-demo">
	<h3>What the trained network found</h3>
	<p style="margin:0 0 4px; color: var(--mn-text-secondary)">Left: effective
	representation dimensionality grows through the hidden layers during training (folding in
	action). Middle: the distribution of the **Hartigan dip statistic** — a non-parametric
	measure of non-unimodality — shifts to higher values once trained. Bottom: the causality
	test — which neurons carry the separability work?</p>
	<div class="og-grid2">
		<div id="og-dim" style="height:280px"></div>
		<div id="og-dip" style="height:280px"></div>
	</div>
	<div id="og-silence" style="height:260px; margin-top:12px"></div>
</div>

<div class="md">
## The Answer

Put all the pieces together and the paper's central claim is a clean one:

> A **stack of dense (fully-connected) ReLU layers** manufactures linear separability by
> **progressively folding the data manifold into unoccupied, higher dimensions** — it is, in
> effect, doing $N$-dimensional origami. Each layer folds the already-folded object a little
> further; at the end the structure is spread out enough that a **single flat cut** (the
> output layer) classifies it.

Read the subject carefully: the *object* is the **dense ReLU block**, not "a feed-forward
network" in general. The folding mechanism — a layer wider than the data, with a pointwise
ReLU creasing it into a spare dimension — belongs to the fully-connected layer, and the
rigorous backbone of the story (the number of **linear regions** a deep piecewise-linear
network can carve, growing exponentially with depth \cite{montufar2014regions}) is a theorem
about exactly that object. It **need not** carry over to a convolutional, attention, or
recurrent layer, and we should not read it as doing so (see *Scope and open questions*
below). What *is* architecture-agnostic is the weaker outer principle — manufacture a
linearly-separable representation for a final linear readout.

The vocabulary is worth keeping:

* **Affine transform** = *positioning on the anvil* — no separability is created here.
* **ReLU** = *the hammer-blow* — it can only dent the convex hull.
* **Folding** (into unused dimensions) = the *primary, efficient* way to create
  separability, whenever layers are wider than the data.
* **Shear** (peeling) = an *inefficient* fallback that needs very deep networks.
* **Bimodal tuning curves** = the *fingerprint* of active folds in a trained network.
* **One flat cut** = the final linear readout; in a multi-class head this is *one flat cut
  per class*, with a softmax over them picking the winner \cite{softmax_wiki}.
* And the bridge to theory: **universal approximation $\approx$ origami + one flat cut**,
  echoing the **fold-and-cut theorem** \cite{foldandcut_wiki}.

This is more than a picture. It reframes a mechanistic question — *what is a hidden layer
for?* — in terms you can draw, measure, and (as the poker experiment shows) causally
verify.
</div>

<div class="optional md" data-headline="Scope and open questions">
To be clear about what this framework covers and does not:

* It is restricted to **fully-connected, deep feed-forward networks** on **classification**
  tasks, and the *folding* mechanism in particular is a property of the dense ReLU layer.
  The other layer types do not share its shape, and the picture need not reach them: a
  **convolutional** layer is a *local, weight-shared* affine map plus a nonlinearity (not a
  single pointwise-ReLU hyperplane across the whole feature), an **attention** layer is built
  from $QK^\top V$, and a **recurrent** layer reuses its weights across time. Keup & Helias
  are careful to flag convolutional networks only as a *possible application* of the picture
  \cite{keup2022origami}, not as a result. (A natural first step, if one did extend it: treat
  each conv filter patch as a tiny fully-connected net, where folding is only possible if
  there are *more* filters than data dimensions under the patch.)
* The claim that shear is much less efficient than folding is argued **intuitively**, not
  proven: a rigorous statement would require assumptions about the class of realistic data
  distributions, which the authors note is not yet available. It is, however, consistent
  with the theorem that deep but fixed-width networks fail to be universal approximators
  \cite{johnson2018skinny}.
* The poker-hand validation is **small-scale** and the data are **categorical**, which makes
  the bimodality in the tuning curves a little harder to read off (the discrete inputs
  already produce multi-modal structure along the original axes).
</div>

<div class="optional md" data-headline="Where this connects">
This chapter is a deep dive that pays off across the book:

* **Where the block actually lives** — the dense ReLU block is rarely a model by itself; it
  is an *in-between* sub-block. In a **transformer** it is the position-wise feed-forward
  network (a two-layer dense MLP with a ReLU/GELU) wrapped between attention sub-layers
  \cite{vaswani2017attention}, which interpretability work reads as the model's local
  "memory" \cite{keyvalmem}. In a **classical CNN** it is the stack of fully-connected
  layers capping the convolutional body (VGGNet: thirteen conv layers then three dense
  layers \cite{simonyan2014vgg}; ResNet: a conv body topped by a dense head
  \cite{he2015resnet}). The "fold until separable, then one flat readout" story happens
  inside that block in both cases.
* **Deep Learning** — the composition view, the "bend" that prevents collapse, and the
  Universal Approximation Theorem it operationalises.
* **Basic Math III** — the formal Universal Approximation Theorem
  \cite[Cybenko, 1989]{cybenko1989} \cite[Hornik et al., 1989]{hornik1989universal} and why
  *depth* beats width.
* **Mechanistic Interpretability** — the "mixed selectivity" and bimodal neurons identified
  here are the same phenomenon neuroscientists and interpretability researchers keep
  finding: individual units are *not* "one class = one neuron"; the class is computed
  *across* the population.
* **Why Do Networks Generalize?** — the fold-and-cut picture is a concrete candidate for
  *what kind of functions the architecture's prior favours*.
</div>

<div class="optional md" data-headline="The polyhedral backbone">
This chapter has a formal home in **polyhedral theory**, the study of the solid shapes cut out
by finitely many linear inequalities \cite{groetschel2005polyhedral}. Every linear region of a
ReLU net is a **polyhedron**: the input points for which exactly the same set of ReLUs is
active. A polyhedron has two equivalent descriptions — *externally* as a stack of
inequalities, $P=\{x:Ax\le b\}$ (the "H-representation", how the net is actually given), or
*internally* as the convex hull of points plus a cone,
$P=\operatorname{conv}(V)+\operatorname{cone}(E)$ (the "V-representation"). **Farkas' lemma**
is the workhorse that decides whether a region is empty at all, and **Fourier–Motzkin
elimination** converts one description into the other by projecting variables away. The catch
is the deep reason the region count is exponential: that conversion **blows up exponentially**
in the worst case — the $n$-cube and the $n$-cross-polytope are each trivial in one form and
exponential in the other.

That single fact powers three things here. It is why a trained net is *intractable* to inspect
by enumerating its regions; why you instead **optimize over** it — because each region is an
affine map, a trained ReLU net can be re-expressed as a **mixed-integer linear program**
(binary variables mark which ReLUs fire), letting you verify robustness, bound each neuron's
output range, or embed the net inside a larger optimization problem, and even *train* with
LP/MILP when you want integer or otherwise structured weights
\cite{huchette2026polyhedral}; and why folding — which merely changes *which* inequalities bind
— is such an efficient lever. The geometry of the fold and the algebra of the polyhedron are
the same object.
</div>
