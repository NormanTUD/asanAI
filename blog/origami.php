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
math: 50
-->

<style>
	/* Origami — space_warps visual vocabulary, expressed via --mn-* so it
	   adapts to the blog's light/dark theme. Data-viz brand colors are fixed
	   (they must read on both cream and slate backgrounds). */
	:root {
		--og-inner: #ff6b9d;
		--og-outer: #4ecdc4;
		--og-amber: #ffd166;
		--og-grad: linear-gradient(90deg, var(--mn-emerald), var(--mn-coral) 55%, var(--og-amber));
	}
	.og-card {
		background: linear-gradient(180deg, var(--mn-surface), var(--mn-bg-subtle));
		border: 1px solid var(--mn-border);
		border-radius: 18px;
		padding: 22px 22px 26px;
		margin: 22px 0;
		box-shadow: 0 10px 40px rgba(0,0,0,.12);
	}
	.og-h2 { margin: 34px 0 10px; font-size: 1.5rem; font-weight: 800; letter-spacing: -.5px;
		background: var(--og-grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
	.og-lead { color: var(--mn-text-secondary); margin: .2rem 0 14px; }
	.og-small { font-size: .88rem; color: var(--mn-text-secondary); }
	.og-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
	@media (max-width: 820px) { .og-grid2 { grid-template-columns: 1fr; } }

	.og-demo {
		background: var(--mn-bg-subtle);
		border: 1px solid var(--mn-border);
		border-radius: 12px;
		padding: 16px 18px;
		margin: 14px 0;
	}
	.og-demo h3 { margin: 0 0 8px; font-size: 1.05rem; color: var(--mn-coral); }
	.og-canvas-wrap { position: relative; margin: 12px 0; text-align: center; }
	.og-canvas-wrap canvas, .og-demo canvas {
		display: block; width: 100%; max-width: 100%; height: auto; border-radius: 12px;
		background: var(--mn-bg-subtle); border: 1px solid var(--mn-border);
	}
	.og-plot { width: 100%; background: var(--mn-bg-subtle); border: 1px solid var(--mn-border); border-radius: 12px; }

	.og-controls { display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: flex-end; margin: 12px 0; padding: 12px; background: var(--mn-bg-subtle); border: 1px solid var(--mn-border); border-radius: 12px; }
	.og-control { display: flex; flex-direction: column; gap: 4px; min-width: 150px; font-size: .88rem; color: var(--mn-text-secondary); }
	.og-control label { font-size: .88rem; color: var(--mn-text-secondary); }
	.og-control .val { color: var(--mn-text); font-family: var(--mn-font-mono, monospace); font-variant-numeric: tabular-nums; font-weight: 600; }
	.og-control input[type="range"] { width: 100%; accent-color: var(--mn-emerald); }
	.og-control input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--mn-emerald); }
	.og-control select { background: var(--mn-surface); color: var(--mn-text); border: 1px solid var(--mn-border); padding: 5px 8px; border-radius: 6px; }
	.og-btn { background: var(--mn-emerald); color: #fff; border: none; padding: 7px 14px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: .85rem; transition: .15s; }
	.og-btn:hover { filter: brightness(1.1); }
	.og-btn.sec { background: var(--mn-surface); color: var(--mn-text); border: 1px solid var(--mn-border); }

	.og-formula { background: var(--mn-bg-subtle); border: 1px dashed var(--mn-border); border-radius: 12px; padding: 10px 14px; margin: 10px 0; overflow-x: auto; }
	.og-formula .cap { color: var(--mn-text-secondary); font-size: .8rem; margin-top: 6px; }
	.og-formula.live { border-color: var(--mn-emerald); border-style: solid; }

	.og-legend { display: flex; gap: 14px; flex-wrap: wrap; font-size: .85rem; margin: 8px 0; color: var(--mn-text-secondary); }
	.og-legend span { display: inline-flex; align-items: center; gap: 6px; }
	.og-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }

	.og-steps { counter-reset: ogstep; padding-left: 0; list-style: none; margin: 8px 0; }
	.og-steps li { counter-increment: ogstep; padding: 8px 0 8px 42px; position: relative; margin: 0 0 4px; }
	.og-steps li::before { content: counter(ogstep); position: absolute; left: 0; top: 7px; width: 28px; height: 28px; background: linear-gradient(135deg, var(--mn-emerald), var(--mn-coral)); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: .9rem; }

	.og-eli5 { background: color-mix(in srgb, var(--og-amber) 10%, var(--mn-surface)); border-left: 3px solid var(--og-amber); padding: 12px 16px; border-radius: 8px; margin: 12px 0; }
	.og-eli5 b { color: var(--og-amber); }

	.og-verdict { font-weight: 800; padding: 3px 10px; border-radius: 8px; border: 1px solid var(--mn-border); font-variant-numeric: tabular-nums; white-space: nowrap; font-size: .85rem; }
	.og-verdict.ok { color: var(--mn-emerald); border-color: var(--mn-emerald); background: color-mix(in srgb, var(--mn-emerald) 12%, transparent); }
	.og-verdict.no { color: var(--mn-rose); border-color: var(--mn-rose); background: color-mix(in srgb, var(--mn-rose) 12%, transparent); }

	.og-toc { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
	.og-toc a { color: var(--mn-emerald); text-decoration: none; background: var(--mn-bg-subtle); border: 1px solid var(--mn-border); padding: 6px 10px; border-radius: 8px; font-size: .85rem; }
	.og-toc a:hover { border-color: var(--mn-emerald); }

	.og-note { background: color-mix(in srgb, var(--mn-emerald) 10%, var(--mn-surface)); border-left: 3px solid var(--mn-emerald); padding: 12px 16px; margin: 14px 0; border-radius: 6px; font-size: .95rem; }
	.og-out { margin-top: 8px; color: var(--mn-text-secondary); font-size: .9rem; font-family: var(--mn-font-mono, monospace); }

	.og-fc-wrap { position: relative; }
	.og-fc-status { position: absolute; top: 8px; left: 12px; z-index: 2; font-size: .85rem; color: var(--og-amber); background: var(--mn-bg-glass); padding: 2px 8px; border-radius: 6px; }

	.og-regen-btn { margin-top: 12px; }
</style>

	<h2 class="og-h2">Fold-and-Cut — Origami meets Neural Networks</h2>

	<div class="md">
Here is the surprising fact at the heart of this chapter: **you can cut out any shape made of straight lines from a single sheet of paper with just one straight cut** — provided you fold the paper correctly first. Stated the way a ten-year-old would take it in: a *shape* is any closed outline (a triangle, a star, even your own signature), and *cutting* just means the scissors follow that outline to free the shape from the rest of the paper. The catch is that one straight snip can only ever remove a straight line, so a jagged star seems impossible from a single flat cut. The trick is to **fold** the paper until every edge of the shape lies exactly on top of every other edge; then one straight cut passes through all the stacked layers at once, and when you unfold, the shape falls out perfectly. That same move — *fold first, then one flat cut* — is exactly what a stack of ReLU layers does to the data before the final linear readout.
</div>

	<figure style="max-width:640px; margin:1.2em auto; text-align:center;">
		<img src="https://upload.wikimedia.org/wikipedia/commons/3/30/Origami_made_by_Brighton_University_to_support_Japan%3B_April_2011.jpg" alt="Hundreds of folded paper cranes" style="width:100%; height:auto; border-radius:8px;" />
		<figcaption class="md">Paper cranes — the most familiar object in the art of the fold. \cite[Image: Dominic Alves, origami cranes (Wikimedia Commons, CC BY 2.0)]{origami_cranes_img}.</figcaption>
	</figure>

<div class="og-card">
	<div class="og-demo">
		<h3 style="text-align:center">The Fold-and-Cut Theorem</h3>
		<p class="og-small" style="text-align:center">Fold the paper so that all edges of your shape lie exactly on top of each other. Then, make one straight cut.</p>
		<div class="og-fc-wrap">
			<div id="og-fc-status" class="og-fc-status">Step 0: shape drawn</div>
			<canvas id="og-fc" class="og-canvas" width="520" height="440"></canvas>
			<canvas id="og-fc-film" class="og-canvas" width="520" height="220" style="display:none"></canvas>
		</div>
		<div class="og-controls">
			<div class="og-control"><label>Shape</label><select id="og-fc-shape"><option value="tri">Triangle</option><option value="square">Square</option><option value="pent">Pentagon</option><option value="star">Star</option></select></div>
			<div class="og-control"><label>Fold step <span class="val" id="og-fc-step-v">0</span></label><input id="og-fc-step" type="range" min="0" max="4" value="0"></div>
			<button id="og-fc-cut" class="og-btn">✂ Cut!</button>
			<button id="og-fc-print" class="og-btn sec">🖨 Print</button>
		</div>
		<div class="og-formula lg-scroll"><div class="cap">The Fold-and-Cut Theorem (Demaine et al. 1998):</div><div id="og-fc-formula"></div></div>
	</div>
</div>

	<h2 class="og-h2">Motivation — Why a Straight Line Is Not Enough</h2>
	<p class="og-lead">The raw data almost never is linearly separable. The hidden layers must <em>manufacture</em> separability — here is the gap they must close.</p>

	<div class="md">
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

<div class="og-card">
	<div class="og-demo">
		<h3>Try it: no single line can separate the egg</h3>
		<p class="og-small">Pick a dataset, then drag the <b>angle</b> and <b>offset</b> of a straight line and watch the best accuracy it can reach. The "inner" class is always trapped by the "outer" one, so a flat boundary plateaus well below 100%.</p>
		<div class="og-controls">
			<div class="og-control"><label>Angle of separating line: <span class="val" id="og-angle-v">0°</span></label><input type="range" id="og-angle" min="0" max="360" value="45"></div>
			<div class="og-control"><label>Offset: <span class="val" id="og-shift-v">0.00</span></label><input type="range" id="og-shift" min="-2" max="2" step="0.05" value="0"></div>
			<div class="og-control"><label>Dataset</label>
				<select id="og-setup">
					<option value="egg">2D-Egg (ring)</option>
					<option value="blobs">Gaussian blobs</option>
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
		<div id="og-nonsep-verdict" class="og-verdict no" style="display:none"></div>
	</div>
</div>

	<h2 class="og-h2">The Building Block — The Anvil and the Hammer</h2>
	<p class="og-lead">Every layer does two things in sequence: position the data (affine), then fold it (ReLU). The affine step is the anvil; the ReLU is the hammer.</p>

	<div class="md">
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

**Name the primitive, because the rest of the chapter is made of it.** Step 2 is not only a bend — it is a *cut*. Each ReLU neuron is a single **line** (a hyperplane) that divides the space into two halves: the side that stays put, and the side that is folded over. That is exactly the first axiom of *Laws of Form* \cite[Spencer-Brown, 1969]{spencerbrown1969form} — *draw a distinction*: draw one line across the unmarked space, and it becomes two regions, one marked and one unmarked. Everything this chapter does to the data — the whole *spatiality* of a deep network — is built by repeating that one move. The book returns to "draw a distinction" as the foundation of a calculus of space in <a href="coherent_difference">Coherent Difference</a>; here you meet it first in geometry you can draw.

This is not just intuition — it has been made rigorous. The affine step is precisely the part that preserves convexity (straight lines stay straight); the ReLU is what breaks it. Map a straight line in the input to the network's activation ("Hamming") space and its image is generally a *non-convex* path whose distance can even decrease. This convexity-breaking has been proved and quantified \cite{lewandowski2025spacefolds}.

Here is the first, important limitation: a hammer only dents the **outer boundary** of a
clump. To reach a data point that sits *inside* the distribution, you would have to crush
everything outside it first. In other words, the nonlinearity can only reshape the
**convex hull** of the data \cite{convex_hull_wiki} — it cannot selectively grab an inner
class. So how does a network ever get at an "island" class that is completely surrounded?
</div>

<div class="og-card">
	<div class="og-demo">
		<h3>The affine step: positioning on the anvil</h3>
		<p class="og-small">Drag the parameters and watch the live $W$-matrix update. The data cloud rotates, scales, shears, and translates — but its *shape* (and separability) is preserved.</p>
		<div class="og-controls">
			<div class="og-control"><label>Rotation: <span class="val" id="og-aff-rot-v">0°</span></label><input type="range" id="og-aff-rot" min="0" max="360" value="0"></div>
			<div class="og-control"><label>Scale x: <span class="val" id="og-aff-sx-v">1.0</span></label><input type="range" id="og-aff-sx" min="0.2" max="2.5" step="0.1" value="1"></div>
			<div class="og-control"><label>Scale y: <span class="val" id="og-aff-sy-v">1.0</span></label><input type="range" id="og-aff-sy" min="0.2" max="2.5" step="0.1" value="1"></div>
			<div class="og-control"><label>Shear: <span class="val" id="og-aff-sh-v">0.0</span></label><input type="range" id="og-aff-sh" min="-1.5" max="1.5" step="0.1" value="0"></div>
			<div class="og-control"><label>Bias x: <span class="val" id="og-aff-bx-v">0.0</span></label><input type="range" id="og-aff-bx" min="-2" max="2" step="0.1" value="0"></div>
			<div class="og-control"><label>Bias y: <span class="val" id="og-aff-by-v">0.0</span></label><input type="range" id="og-aff-by" min="-2" max="2" step="0.1" value="0"></div>
			<div class="og-control"><label>Append ReLU: <span class="val" id="og-aff-relu-v">off</span></label><input type="checkbox" id="og-aff-relu"></div>
		</div>
		<div class="og-canvas-wrap"><canvas id="og-affine" width="560" height="400"></canvas></div>
		<div class="og-formula live lg-scroll"><div class="cap">Live weight matrix (rot · scale · shear):</div><div id="og-aff-live"></div></div>
	</div>

	<div class="og-demo">
		<h3>The ReLU step: one fold in 1-D</h3>
		<p class="og-small">A single ReLU neuron $\Phi(x)=\max(0,x)$ is a <em>fold</em> at $x=0$. Drag the input and watch the output: everything negative is pressed flat to zero.</p>
		<div class="og-controls">
			<div class="og-control" style="min-width:260px"><label>Input $x$: <span class="val" id="og-relu-xv">-1.0</span></label><input type="range" id="og-relu-x" min="-3" max="3" step="0.1" value="-1"></div>
		</div>
		<div class="og-canvas-wrap"><canvas id="og-relu1d" width="560" height="280"></canvas></div>
		<div class="og-formula live lg-scroll"><div id="og-relu-live"></div></div>
	</div>

	<div class="og-demo">
		<h3>The ReLU as a hammer-blow (2-D view)</h3>
		<p class="og-small">Each neuron is a hyperplane (yellow). Drag its <b>angle</b> and <b>bias</b>: points on the negative side are projected onto the plane (shown pink, "flattened"), points on the positive side stay put. Watch how the dent can only ever bite the <em>outside</em> of the cloud.</p>
		<div class="og-controls">
			<div class="og-control"><label>Hyperplane angle: <span class="val" id="og-hp-a-v">90°</span></label><input type="range" id="og-hp-a" min="0" max="360" value="90"></div>
			<div class="og-control"><label>Bias (offset): <span class="val" id="og-hp-b-v">0.00</span></label><input type="range" id="og-hp-b" min="-2" max="2" step="0.05" value="0"></div>
		</div>
		<div class="og-grid2">
			<div><h3 style="text-align:center; font-size:.95rem">Before</h3><div class="og-canvas-wrap"><canvas id="og-before" width="360" height="320"></canvas></div></div>
			<div><h3 style="text-align:center; font-size:.95rem">After the ReLU</h3><div class="og-canvas-wrap"><canvas id="og-after" width="360" height="320"></canvas></div></div>
		</div>
	</div>
</div>

	<h2 class="og-h2">The Geometry of the Crease — What the Hammer Does to Space</h2>
	<p class="og-lead">The affine step (the anvil) only moves and stretches space — it cannot change what is linearly separable. The nonlinearity reshapes it, and which one a layer uses fixes the <em>class of deformation</em> applied — and, topologically, what the network may do to the data.</p>

	<div class="md">
The hammer comes in several shapes, and they are not interchangeable:

* **ReLU** $\Phi(x)=\max(0,x)$ — piecewise-linear and *not invertible* \cite[ReLU]{relu_wiki}: the negative half-space is identified with the fold. As a **non-homeomorphism** it can *change the data's topology* — close a hole, merge components, drop a Betti number \cite[Olah, 2014]{colah2014manifolds}\cite[Naitzat et al. 2020]{naitzat2020topology}; that is what untangles. The pointwise map is non-injective, but a crease hitting the data from an unoccupied direction is injective *on the data* — the relational structure survives even as the topology is simplified (the next section's "fold, don't crush").
* **LeakyReLU** $\Phi(x)=\max(\alpha x,x)$, $\alpha\in(0,1)$ \cite[ReLU]{relu_wiki} — **bi-Lipschitz**, hence a *homeomorphism*: it bends at the crease but never crushes, so the topology is preserved. The activation of choice for invertible networks.
* **GELU** $\Phi(x)=x\,\Phi_{\mathrm{cdf}}(x)$ \cite[Hendrycks & Gimpel, 2016]{hendrycks2016gelu} and **SiLU / Swish** $\Phi(x)=x\,\sigma(x)$ \cite[Ramachandran et al. 2017]{ramachandran2017swish} — smooth ($C^\infty$) but non-monotone. Where the Jacobian has full rank they are **local diffeomorphisms** (inverse function theorem) \cite[Inverse function theorem]{inverse_function_theorem_wiki}; being non-monotone, they are *not* one-to-one, hence *not* global diffeomorphisms. Smoothing removes corners but not folding.
* **Tanh** and the **sigmoid** — smooth but *saturating*: they squash $\mathbb{R}^d$ into a bounded open box $(-1,1)^d$ or $(0,1)^d$, pressing the space flat against the boundary where the derivative $\to 0$. Geometrically that is *exactly* the vanishing-gradient problem \cite[Olah, 2015]{colah2015backprop}.
* **Softmax** — the only map in the list that is not *pointwise*: it reads the whole logit vector at once and lands it in the **probability simplex** $\Delta^{d-1}$, the $(d{-}1)$-dimensional set of all probability distributions \cite{softmax_wiki}. Distances there are not Euclidean but measured by the KL divergence / Fisher–Rao metric — *information geometry* \cite[Information geometry]{info_geometry_nlab}.

The ReLU's non-homeomorphism is the mechanism, not a defect: the high-dimensional section below shows it is exactly the non-homeomorphic activations that reduce Betti numbers and produce the separability this chapter is about \cite[Naitzat et al. 2020]{naitzat2020topology}.
</div>

	<h2 class="og-h2">The Key Idea — Fold, Don't Crush</h2>
	<p class="og-lead">The magic is in the <em>unused dimensions</em>. A ReLU hyperplane hitting the data from an unoccupied direction doesn't flatten — it <em>folds</em>, lifting the data off into a new axis.</p>

	<div class="md">
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

<div class="og-card">
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
</div>

	<h2 class="og-h2">The 2-D Egg in 3-D — Three Neurons, One Plane</h2>
	<p class="og-lead">The classic 2D egg (ring inside ring) can be solved by a single layer of just <em>three</em> ReLU neurons. Each is a hyperplane tilted 120° apart; their outputs stack into a third dimension that lifts the inner ring into a tent.</p>

	<div class="md">
Now scale the picture up. The famous **2D egg** (a ring inside a ring) can be solved by a
*single* hidden layer of just **three** ReLU neurons. Each neuron is a flat hyperplane
tilted at $120^\circ$ to the others; their ReLU outputs are stacked into a new **third**
dimension. The result is a folded 3-D shape where the inner ring is lifted up into a
**tent**, while the outer ring lies flat. A single flat horizontal plane now cleanly
separates them — recall of $100\%$ for the inner class and $\approx 97\%$ for the outer
one. Drag to look around the folded representation:
</div>

<div class="og-card">
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
</div>

	<h2 class="og-h2">The Circle-in-Circle Lift — Seeing the Fold in 3-D</h2>
	<p class="og-lead">Watch the inner class rise out of the flat plane into a third dimension. Adjust the <em>lift</em> height, slide the separating <em>plane</em>, and switch the fold from a smooth radial dome to a real <em>N</em>-neuron ReLU stack.</p>

<div class="og-card">
	<div class="og-demo">
		<h3>2-D → 3-D: the fold lifts the inner class</h3>
		<p class="og-small">The inner ring (pink) is lifted into a third dimension by the ReLU fold. In 2-D no flat line can separate the classes; in 3-D a single horizontal plane does the job. Drag the <b>lift</b> slider to control how high the inner class rises, and the <b>plane</b> slider to position the separating hyperplane.</p>
		<div class="og-controls">
			<div class="og-control"><label>Lift height: <span class="val" id="og-egg-lift-v">0.60</span></label><input type="range" id="og-egg-lift" min="0" max="1.5" step="0.05" value="0.6"></div>
			<div class="og-control"><label>Separating plane z = c: <span class="val" id="og-egg-plane-v">0.10</span></label><input type="range" id="og-egg-plane" min="0" max="1" step="0.05" value="0.1"></div>
			<div class="og-control"><label>Fold model</label>
				<select id="og-egg-mode">
					<option value="radial">Radial dome (the idea)</option>
					<option value="3">3 neurons (real)</option>
					<option value="6">6 neurons (real)</option>
					<option value="12">12 neurons (real)</option>
				</select>
			</div>
		</div>
		<div class="og-canvas-wrap"><canvas id="og-egg2d" width="640" height="400"></canvas></div>
		<div id="og-egg3d" class="og-plot" style="height:420px"></div>
		<div id="og-egg-verdict" class="og-verdict no" style="display:none"></div>
		<div class="og-formula lg-scroll"><div id="og-egg-f1"></div></div>
		<div class="og-formula lg-scroll"><div id="og-egg-f2"></div></div>
		<div class="og-formula lg-scroll"><div id="og-egg-f3"></div></div>
	</div>
</div>

	<h2 class="og-h2">Learned Rotation — The Hammer Finds Its Angle</h2>
	<p class="og-lead">A single ReLU neuron can learn the optimal rotation angle for the data. Watch the hyperplane rotate until the fold aligns with the data's structure.</p>

<div class="og-card">
	<div class="og-demo">
		<h3>One neuron, one rotation: finding the fold angle</h3>
		<p class="og-small">Drag the <b>angle</b> of the ReLU hyperplane. In 2-D you can see the fold line rotate; in 3-D you see the data cloud tilt. The "miscount" readout shows how many points are on the wrong side — the network's loss for this single neuron.</p>
		<div class="og-controls">
			<div class="og-control"><label>Hyperplane angle: <span class="val" id="og-rot-th-v">0°</span></label><input type="range" id="og-rot-th" min="0" max="360" step="1" value="0"></div>
		</div>
		<div class="og-grid2">
			<div class="og-canvas-wrap"><canvas id="og-rot2d" width="400" height="360"></canvas></div>
			<div id="og-rot3d" class="og-plot" style="height:360px"></div>
		</div>
		<div id="og-rot-verdict" class="og-verdict no" style="display:none"></div>
		<div class="og-formula lg-scroll"><div id="og-rot-f1"></div></div>
		<div class="og-formula lg-scroll"><div id="og-rot-f2"></div></div>
	</div>
</div>

	<h2 class="og-h2">The 3-Neuron Egg — From Dense to Separable</h2>
	<p class="og-lead">Three ReLU neurons, three hyperplanes, one fold. The top view shows the fold lines; the 3-D view shows the resulting basin. Adjust the number of neurons and fold strength to see how the separability emerges.</p>

<div class="og-card">
	<div class="og-demo">
		<h3>Top view + 3-D basin</h3>
		<p class="og-small">Top: the three fold lines in the 2-D input plane. Bottom (3-D): the folded data surface — the inner ring lifts into a basin that a single horizontal plane can now separate. Adjust <b>neurons</b> and <b>fold strength</b> to see the effect.</p>
		<div class="og-controls">
			<div class="og-control"><label>Neurons: <span class="val" id="og-egg3-n-v">3</span></label><input type="range" id="og-egg3-n" min="2" max="6" step="1" value="3"></div>
			<div class="og-control"><label>Fold strength: <span class="val" id="og-egg3-fs-v">1.0</span></label><input type="range" id="og-egg3-fs" min="0.1" max="2" step="0.1" value="1"></div>
			<div class="og-control"><label>Plane z: <span class="val" id="og-egg3-plane-v">0.5</span></label><input type="range" id="og-egg3-plane" min="0" max="2" step="0.05" value="0.5"></div>
		</div>
		<div class="og-canvas-wrap"><canvas id="og-egg3top" width="640" height="320"></canvas></div>
		<div id="og-egg3fold" class="og-plot" style="height:420px"></div>
		<div id="og-egg3-verdict" class="og-verdict no" style="display:none"></div>
		<div class="og-formula lg-scroll"><div id="og-egg3-dense"></div></div>
		<div class="og-formula lg-scroll"><div id="og-egg3-sep"></div></div>
	</div>
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

<div class="optional md" data-headline="Origins: the fold as a field (computational origami)">
The "fold" in this chapter is a neural-network metaphor — but *folding as mathematics and computation* is a genuine, decades-old field, and the metaphor is load-bearing. It is called **computational origami**, and it studies the algorithms and complexity of exactly the objects this chapter draws: crease patterns, folds, and what can be made from a flat sheet.

**Paper-folding geometry.** A single fold is a surprisingly strong geometric tool. **T. Sundara Row** (1893) collected the first paper constructions \cite[Mathematics of paper folding]{math_paper_folding_wiki}; **Houdini** (1922) turned them into stage tricks — folds, tears, puzzles — in *Paper Magic* \cite[Houdini, 1922]{houdini1922papermagic}. The turning point is **Margherita Piazzola Beloch** (1936): one special fold, the **Beloch fold**, solves the general cubic \cite[Beloch fold]{beloch_fold_wiki}\cite[Hull, 2011]{hull2011beloch}. That is why origami **trisects an angle** and **doubles the cube**, both impossible with ruler and compass — where a compass tops out at quadratics, a fold reaches cubics \cite[Hull, 1997]{hull1997origametry} and folds regular n-gons a compass cannot. The full single-fold power is the **Huzita–Justin axioms**: seven rules, written by **Justin** (1986), rediscovered by **Huzita** (1989), shown complete by **Lang** \cite[Huzita–Hatori axioms]{huzita_justin_wiki}.

<div style="display:flex; gap:1.1rem; justify-content:center; align-items:flex-start; flex-wrap:wrap; margin:1.3em 0;">
	<figure style="margin:0; text-align:center; flex:0 1 240px;">
		<img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Harry_Houdini%2C_half-length_portrait%2C_facing_front_LCCN96518797.jpg" alt="Portrait of Harry Houdini, 1906" style="width:100%; height:auto; border-radius:6px;" />
		<figcaption class="md">Harry Houdini (1874–1926), the escape artist who made paper a stage act. \cite[Image: Library of Congress (Wikimedia Commons, public domain)]{houdini_portrait_img}.</figcaption>
	</figure>
	<figure style="margin:0; text-align:center; flex:0 1 240px;">
		<img src="https://upload.wikimedia.org/wikipedia/commons/d/dc/Harry_Houdini_Cigarette_paper_trick.png" alt="Illustration from Houdini's 1922 book Paper Magic: Houdini performing the cigarette-paper tear" style="width:100%; height:auto; border-radius:6px;" />
		<figcaption class="md">The cigarette-paper tear, one of the opening paper tricks in Houdini's 1922 book *Paper Magic*. \cite[Image: Harry Houdini, cigarette-paper trick (Wikimedia Commons, public domain)]{houdini_papermagic_img}.</figcaption>
	</figure>
</div>

**Flat-foldability: local rules, global hard problem.** Can a crease pattern fold flat? At one vertex, two clean rules decide it: **Maekawa** — mountain and valley folds differ by two (so the faces two-color) \cite[Maekawa's theorem]{maekawa_theorem_wiki}; **Kawasaki** — the alternating angles around the vertex sum to 180° \cite[Kawasaki's theorem]{kawasaki_theorem_wiki}. Stack many vertices and it blows up: **Bern and Hayes (1996)** showed that deciding flat-foldability is **NP-complete** \cite[Mathematics of paper folding]{math_paper_folding_wiki}. Note the shape — *local rules, global difficulty* — the same split this book keeps returning to, from one neuron's activation to a whole network's generalization.

**The computational turn.** Around 1990 **Robert J. Lang** started *designing* folds by code instead of by hand \cite[Robert J. Lang]{robert_lang_wiki}. His **TreeMaker** turns a target shape into an efficient crease pattern; **Erik and Martin Demaine's** *Geometric Folding Algorithms* is the reference text \cite[Geometric Folding Algorithms]{geometric_folding_algorithms_wiki}, and the **fold-and-cut theorem** — any polygon from one straight cut — is its signature result \cite[Fold-and-cut problem]{fold_and_cut_problem_wiki}. **Erik Demaine**'s group has long lists of NP-completeness and universality results \cite[Erik Demaine]{erik_demaine_site}.

<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin: 1.5rem 0;">
	<figure style="margin:0; text-align:center;">
		<img src="https://upload.wikimedia.org/wikipedia/commons/0/0f/Dragon_Origami_%28153422653%29.jpeg" alt="Highly complex origami dragon" style="width:100%; height:auto; border-radius:6px;" />
		<figcaption class="md" style="font-size:0.75rem;">Complex single-base design: a dragon \cite[Image: Buffaloz Fotografie, CC BY 3.0]{dragon_origami_img}.</figcaption>
	</figure>
	<figure style="margin:0; text-align:center;">
		<img src="https://upload.wikimedia.org/wikipedia/commons/e/ea/Small_Modular_Origami_Structure.jpg" alt="Modular origami structure" style="width:100%; height:auto; border-radius:6px;" />
		<figcaption class="md" style="font-size:0.75rem;">Modular assembly: a spiked structure \cite[Image: Icyshadowking, CC0]{modular_origami_img}.</figcaption>
	</figure>
</div>

Lang's page maps the tools and people — TreeMaker, ReferenceFinder, ORIPA, and the Tachi / Mitani groups \cite[Lang, Computational Origami]{langorigami_computational}.

**From paper to orbit.** It is not about paper. **Rigid origami** treats folds as hinges on stiff panels — how satellite solar arrays and telescope mirrors pack flat and bloom in space, with the **Miura fold** the canonical case \cite[Miura fold]{miura_fold_wiki}\cite[Rigid origami]{rigid_origami_wiki}. The kicker: the hardware that runs a neural network often *ships folded* — and the model itself is nothing but folds. Same geometry, two layers of reality.

**Why it matters here.** Every one of these is a *piecewise-isometric fold of space* — exactly what a ReLU layer does. Computational origami proves what a fold can and can't do; the network borrows the vocabulary and turns it into a classifier.
</div>

	<h2 class="og-h2">Deep Networks — An Origami Cascade</h2>
	<p class="og-lead">Each layer folds the already-folded object again. The creases compound: the number of linear regions grows exponentially with depth.</p>

	<div class="md">
A deep network does not fold once and stop. **Each layer folds the already-folded object
again**, exactly like real origami. After a few folds a sheet has exponentially more edges
than the number of folds you actually made — the creases compound. The same is true here:
a deep ReLU network is a **piecewise-linear** function whose number of linear regions
**grows exponentially with depth**. Depth buys a combinatorial explosion of boundaries that
a wide but shallow net cannot match. The bound is tight: a depth-$L$ network of width 2 in one input dimension produces exactly $2^L$ regions (a "sawtooth" with $2^L$ spikes) \cite{petersen2024mathdl}.

**Many small separations, in a high-dimensional space, *are* the space.** Each crease is one straight cut; a deep network is a large arrangement of such cuts, and the cells they enclose — the **linear regions** — are the pieces the network's space is actually made of. Read those cells the way the book later defines a space (<a href="coherent_difference">Coherent Difference</a>): not as a container that already exists waiting to be filled, but as *distinguishable local data that cohere on their overlaps into an invariant global whole*. Here the local data are the affine regions, the overlaps are the creases they share, and the coherence is the fact that the network is continuous across every crease. So the spatiality a deep net has is not bought by adding dimensions alone; it is *assembled*, crease by crease, out of distinctions.

<div class="smart-quote" data-cite="petersen2024mathdl" data-after="Ch. 6, after Thm 6.3">
It is noteworthy that the effects of the depth and the width of a neural network are vastly different. While increasing the width can polynomially increase the number of pieces, increasing the depth can result in exponential increase.
</div>
</div>

<div class="og-card">
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
</div>

	<h2 class="og-h2">The Inefficient Alternative — Shear (Peeling the Orange)</h2>
	<p class="og-lead">When there's no room to fold, the network must shear: nudging one thin slice of the outer class to the side, per layer. Like peeling an orange, not a sheet.</p>

	<div class="md">
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

<div class="og-card">
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
</div>

	<h2 class="og-h2">Reading the Folds — The Fingerprint in a Trained Network</h2>
	<p class="og-lead">How do we verify a trained network actually *did* the folding? The authors define three observables: dimensionality expansion, bimodal tuning curves, and hyperplane angle.</p>

	<div class="md">
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

<div class="og-card">
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
</div>

	<h2 class="og-h2">Validation — The Poker-Hand Task</h2>
	<p class="og-lead">A real (if small) test: a 3-layer ReLU net on the poker-hand dataset shows exactly the predicted folding signature — dimensionality expansion, bimodal tuning, and causal dependence on the folding neurons.</p>

	<div class="md">
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

<div class="og-card">
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
</div>

	<h2 class="og-h2">The High-Dimensional Underpinnings — Why More Dimensions Make Data Separable</h2>
	<p class="og-lead">Folding is the <em>mechanism</em>. Why does lifting data into more dimensions make it separable at all? High-dimensional mathematics answers — and it is the same mathematics that makes the book's embedding chapters work.</p>

	<div class="md">
Five facts give it a quantitative backbone:

**1. Cover's counting function — the arithmetic of separability** \cite[Cover, 1965]{cover1965}.
A $d$-weight linear readout realizes only some of the $2^N$ two-colourings of $N$ points. Cover counted exactly how many, for $N$ points in general position in $\mathbb{R}^d$:
$$C(N,d) \;=\; 2\sum_{k=0}^{d-1}\binom{N-1}{k}.$$
When $N\le d$ it saturates at $2^N$: *every* dichotomy is separable (a $d$-weight classifier has VC dimension $d$; a bias adds one, up to $d+1$ points). Once $N$ outnumbers $d$, only a fraction $C(N,d)/2^N$ is separable — but for fixed $N$ that fraction **rises with $d$**, tending to $1$. Cover's point: a complex problem, cast *nonlinearly* in a high-dimensional, not-too-dense space, is more likely to be linearly separable than in a low-dimensional one. A layer wide enough that $d\ge N$ reaches that regime.

**2. Concentration of measure — the new directions are really new** \cite[Vershynin, 2018]{vershynin2018hd}.
In $\mathbb{R}^d$ two random unit vectors are almost surely near-orthogonal: $\langle u,v\rangle$ concentrates at $0$ with a sub-Gaussian tail,
$$\Pr\!\big(|\langle u,v\rangle|\ge \varepsilon\big)\;\le\;2\,e^{-c\,d\,\varepsilon^{2}},$$
for a universal positive constant $c$. A fold opened along an unoccupied direction is then, almost surely, independent of every existing data direction — the unused dimensions are *orthogonal* space, so the fold separates rather than shuffles.

**3. The Johnson–Lindenstrauss lemma — the geometry survives compression** \cite[Johnson & Lindenstrauss, 1984]{johnson1984lindenstrauss}.
The converse, and the link to the embedding chapters. For any $N$ points $X\subset\mathbb{R}^n$ and $\varepsilon\in(0,1)$, a linear map into $k=O(\log N/\varepsilon^{2})$ dimensions preserves *all* pairwise distances within $(1\pm\varepsilon)$:
$$(1-\varepsilon)\,\|u-v\| \;\le\; \|f(u)-f(v)\| \;\le\; (1+\varepsilon)\,\|u-v\|\qquad(u,v\in X).$$
The $\log N$ bound is **tight**. Read it both ways: (i) most high dimensions can be dropped while the geometry survives — which is why an embedding can be compact; (ii) the *distance/angle pattern*, not the coordinates, is the invariant. This is the quantitative case for *neighbourhood structure being the geometry, not the coordinates*. So Cover and JL are two faces of one fact: the relational structure is what matters, and enough dimensions put any finite set into a well-separated general-position configuration.

**And the reverse — what if you *remove* dimensions, say from 100d down to 10d?** The source dimension does not appear in the bound: going from $100$, or from $10^{6}$, dimensions down to $10$ depends only on the number of points $N$ and the tolerance $\varepsilon$. Ten dims preserve *all* pairwise distances whenever $10\ge c\,\varepsilon^{-2}\log N$, i.e. for $N\lesssim\exp(10\,\varepsilon^{2}/c)$ points — you can drop $999{,}999$ of a million dimensions and keep every pairwise distance. And this is the floor: Larsen and Nelson proved a matching lower bound, so no *linear* map can keep the relational structure of $N$ arbitrary points in fewer than $\approx\varepsilon^{-2}\log N$ dimensions \cite[Larsen & Nelson, 2014]{larsen2014jloptimal}. Caveat: JL preserves distances *among the $N$ points* only, and the surviving coordinates are random — only the *relational* structure is invariant. (On manifold data, structured methods such as PCA beat $\log N$, at the price of a worst-case guarantee.)

**4. Neural collapse — where the folding ends** \cite[Papyan, Han & Donoho, 2020]{papyan2020neuralcollapse}.
A well-trained classifier settles into a maximally symmetric geometry: in the terminal phase of training, each class's features collapse onto its class mean, and the $K$ class means form a **simplex equiangular tight frame** (ETF) — all pairwise angles equal, each point as far as possible from the others. The "one flat cut" therefore lands on the most separable configuration the space admits, not an arbitrary one.

**5. Folding is topological untangling** \cite[Naitzat, Zhitnikov & Lim, 2020]{naitzat2020topology}.
The "egg" is literally a topological object: the inner class is a *hole* in the outer class's distribution. Topological data analysis counts such holes with **Betti numbers** ($b_0$ components, $b_1$ loops, $b_2$ voids). Layer by layer a trained net drives them to the minimum per class, and ReLU does it *faster* than $\tanh$ — ReLU is a non-homeomorphism that *changes* topology, $\tanh$ a homeomorphism that preserves it. Deep ReLU nets are *exponentially* more efficient than shallow ones at this simplification \cite[Ergen & Grillo, 2024]{ergengrillo2024topological}. Lee and Ye go one step further and prove the width a net needs is bounded by the topology of the labels \cite[Lee & Ye, 2023]{lee2023topologywidth}.

Together these facts land on the **manifold hypothesis** \cite[Fefferman, Mitter & Narayanan, 2016]{fefferman2016testing}: real data sit on a low-dimensional, knotted manifold in the high-dimensional input space, and the network's job is to unfold it — *through the unused dimensions* — until one hyperplane suffices.
</div>

	<div class="og-note">
<b>One thread through the book.</b> The same facts that make *folding* work make *embeddings* work: concentration of measure is why high-dimensional space separates what is entangled, and the Johnson–Lindenstrauss lemma is why that geometry is carried by *distances*, which survive compression — a word's meaning is its <em>position in the web of its neighbours</em>, not its coordinates. See <a href="coherent_difference">Coherent Difference</a> and <a href="embeddinglab">Embeddings</a> for the full development. There is a second, more structural thread: the crease is a <em>distinction</em>, the linear regions are a <em>space</em>, and the whole they glue into is a <em>world model</em> — the local-to-global principle formalised in <a href="coherent_difference">Coherent Difference</a> and <a href="coherent_world_models">Coherent World Models</a>.
</div>

	<div class="optional md" data-headline="The precise statements, collected">
Cover's counting function (homogeneous separators, $N$ points in general position in $\mathbb{R}^d$):
$$C(N,d)=2\sum_{k=0}^{\min(d-1,\,N-1)}\binom{N-1}{k},\qquad C(N,d)=2^{N}\ \text{iff}\ N\le d.$$
Johnson–Lindenstrauss: for $\varepsilon\in(0,1)$, a random Gaussian (or sparse) $k\times n$ projection with $k\ge C\,\varepsilon^{-2}\log N$ satisfies
$$(1-\varepsilon)\,\|u-v\|^{2}\ \le\ \|f(u)-f(v)\|^{2}\ \le\ (1+\varepsilon)\,\|u-v\|^{2}\quad\text{for all pairs},$$
and $\Omega(\varepsilon^{-2}\log N)$ dimensions are necessary. Concentration on the sphere: for a uniform unit vector $u\in S^{d-1}$ the coordinate $\sqrt d\,u_1$ is sub-Gaussian with variance of order $1$, giving $\Pr(|\langle u,v\rangle|\ge\varepsilon)\le 2e^{-c d\varepsilon^{2}}$. Neural collapse (balanced classes, cross-entropy, terminal phase): within-class features obey $\|x-\mu_{y(x)}\|\to0$, and the class means satisfy $\mu_k^{\top}\mu_{\ell}\to-\tfrac{1}{K-1}\,\|\mu_k\|^{2}$ for $k\ne\ell$ — the simplex equiangular tight frame.
</div>

	<h2 class="og-h2">The Answer — What a Hidden Layer Is For</h2>
	<p class="og-lead">Put all the pieces together: a stack of dense ReLU layers manufactures linear separability by progressively folding the data manifold into unoccupied, higher dimensions. It is, in effect, doing <em>N</em>-dimensional origami.</p>

	<div class="md">
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
* **The high-dimensional underpinnings** — Cover's counting function, concentration of
  measure, the Johnson–Lindenstrauss lemma, neural collapse, and topological untangling:
  the quantitative *why* behind every one of the above, detailed in the section just before.
* **Origami as a world model** = the deeper reading of the whole chapter: a stack of creases
  is a *cover* of the input space, each linear region is a *local affine model* (a section),
  the creases are the *overlaps* where neighbouring regions meet, continuity is the
  *compatibility* that lets them agree, and the network's global function is the *section they
  glue into* — local-to-global descent, held at the strength of an analogy.

**And a deeper reading of what the folding is *for*.** The separability it manufactures is the goal of the classifier; the *method* is creasing. But creasing is precisely how a model is *assembled out of local pieces*. On every linear region the network is exactly one affine map — a **local model** — and the regions tile the input space, agreeing with their neighbours across the shared crease. Glue those compatible local affine sections together and you have the network's global function, recovered from its parts on the cover of its regions. In the vocabulary the book develops in <a href="coherent_difference">Coherent Difference</a> and, one chapter later, <a href="coherent_world_models">Coherent World Models</a>, that is *descent*: a global object recovered from compatible local data on an admissible cover — a **world model**. The regions are the cover, the creases are the seams, continuity is the compatibility condition, and the whole is the descended section. The local models are only *semi-coherent*: they glue continuously (hence coherent), but each is a flat piece with a kink at its edge, and the whole fits the task's distribution rather than the world as such. That is the honest shape of the claim — origami is a piecewise-linear, approximate instance of local-to-global gluing, the most concrete one in this book because you can draw every crease.

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
  from $QK^\top V$, and a **recurrent** layer reuses its weights across time. The 2025
  space-folding measure extends straightforwardly to residual and normalization layers but is
  **not directly applicable to attention layers** in its current form
  \cite{lewandowski2025spacefolds}. Keup & Helias
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
* **Embeddings & coherent difference** — the Johnson–Lindenstrauss lemma and the
  concentration of measure are not only what make *folding* work; they are what make an
  *embedding space* a space at all. The distance/angle structure that a fold manufactures
  is the same structure the <a href="embeddinglab">Embeddings</a> chapter reads as meaning,
  and the same "the neighbourhood structure is the geometry, not the coordinates" claim
  that <a href="coherent_difference">Coherent Difference</a> argues at the level of whole models.
* **Coherent world models (the structural thread).** Beyond the metric/embedding bridge above, this chapter is where you first *see* the local-to-global principle the book formalises later: a crease is a <em>distinction</em>, the linear regions are the <em>local patches</em> of a cover, their shared edges are the <em>overlaps</em> on which the pieces agree, and the network's global function is the <em>section they glue into</em>. That is the shape of <a href="coherent_difference">Coherent Difference</a> and, one chapter on, <a href="coherent_world_models">Coherent World Models</a> — descent, drawn.
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

<div class="optional md" data-headline="The geometric literature — further reading">
The "origami" picture sits inside a large body of work that studies neural networks as
geometric, topological, and differential objects. A curated map of it, grouped by the idea
each serves:

**Data that is a shape — topology & TDA.**
* \cite[Carlsson, 2009]{carlsson2009topologydata} — the founding "shape of data" paper: a point cloud carries stable features (components, loops, voids) you can read out of noise.
* \cite[Love et al., 2021]{love2021topdeepsurvey} — a survey of topological deep learning in both directions (topology for features; learning for topology).
* \cite[Lee & Ye, 2023]{lee2023topologywidth} — the width a net needs to separate data is bounded by the *topology* (holes) of the labels: interlocking classes provably need a wider net. The "inner class is a hole" claim, made rigorous.

**The fold — piecewise-linear / hyperplane geometry.**
* \cite[Montúfar et al., 2014]{montufar2014regions} — each ReLU is a hyperplane; a net is the cells of a hyperplane arrangement, and the count grows with depth.
* \cite[Hanin & Rolnick, 2019]{hanin2019linearregions} — the *typical* (not just maximal) number of linear regions.
* \cite[Raghu et al., 2017]{raghu2017expressive} — *trajectory length*: sweep a 1-D path through the input and the output crosses its boundary exponentially many times in depth — depth is exponential folding power.
* \cite[Grigsby & Lindsey, 2020]{grigsby2020transversality} — ReLU folds as *bent hyperplane arrangements*; transversality shows the fold pattern is generically stable.

**The map as a flow — diffeomorphisms & invertible nets.**
* \cite[Chen et al., 2018]{chen2018neuralode} — a continuous-depth net is the time-$T$ flow of an ODE, i.e. a diffeomorphism; depth becomes time.
* \cite[Papamakarios et al., 2019]{papamakarios2019flows} — normalizing flows: a base density pushed forward by a diffeomorphism.
* \cite[Teshima et al., 2020]{teshima2020inndiffeo} — coupling-based invertible nets are *universal diffeomorphism approximators*: the invertibility constraint costs nothing in expressivity.
* \cite[Dinh et al., 2016]{dinh2016realnvp} — RealNVP: the concrete invertible block, the mirror image of the non-invertible ReLU crease.

**Data that is a manifold — unfolding & higher dimensions.**
* \cite[Tenenbaum et al., 2000]{tenenbaum2000isomap} — the true distance between data points is the *geodesic* on the manifold, not the straight line: flatten without tearing.
* \cite[Chung et al., 2017]{chung2017perceptual} — each class is a low-dim *perceptual manifold*; classification is the geometry of separating them.
* \cite[Loaiza-Ganem et al., 2024]{loaizaganem2024manifoldsurvey} — the manifold hypothesis as a *live* deep/generative-learning assumption.

**Meaning as position — the namesake, made precise.**
* \cite[Yoneda embedding]{yoneda_nlab} — an object is fully determined by its relationships to everything else; the exact math of "meaning is position in the web of neighbours."
* \cite[Cruz Morales, 2021]{cruzmorales2021grothendieck} — Grothendieck's notion of *space* (schemes → toposes → forms), the philosophical home of the chapter's namesake (a secondary account).

**Very wide nets & the terminal geometry.**
* \cite[Jacot et al., 2018]{jacot2018ntk} — a wide net trained by gradient descent follows a *linear* kernel gradient flow in function space.
* \cite[Lee et al., 2019]{lee2019widelinear} — at infinite width, *any* depth acts linearly on the initial features: the nonlinearity's whole job is to choose a feature geometry, after which learning is linear.
* \cite[Wu & Papyan, 2024]{wu2024linguisticcollapse} — the same simplex-ETF terminal geometry that governs image classifiers also governs **language models**.
</div>
