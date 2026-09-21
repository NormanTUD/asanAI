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
	.og-h2 { margin: 34px 0 10px; font-size: 1.5rem; font-weight: 800; letter-spacing: -.5px;
		background: var(--og-grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
	.og-lead { color: var(--mn-text-secondary); margin: .2rem 0 14px; }
	.og-small { font-size: .88rem; color: var(--mn-text-secondary); }
	.og-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
	@media (max-width: 820px) { .og-grid2 { grid-template-columns: 1fr; } }

	.og-demo {
		background: linear-gradient(180deg, var(--mn-surface), var(--mn-bg-subtle));
		border: 1px solid var(--mn-border);
		border-radius: 16px;
		padding: 18px 20px;
		margin: 20px 0;
		box-shadow: 0 10px 40px rgba(0,0,0,.16);
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
</style>

<div class="og-card">
	<h2 class="og-h2">Fold-and-Cut — Origami meets Neural Networks</h2>
	<p class="og-lead">Paper cranes — the most familiar object in the art of the fold.</p>

	<div class="md">
Here is the surprising fact at the heart of this chapter: **you can cut out any shape made of straight lines from a single sheet of paper with just one straight cut** — provided you fold the paper correctly first. Stated the way a ten-year-old would take it in: a *shape* is any closed outline (a triangle, a star, even your own signature), and *cutting* just means the scissors follow that outline to free the shape from the rest of the paper. The catch is that one straight snip can only ever remove a straight line, so a jagged star seems impossible from a single flat cut. The trick is to **fold** the paper until every edge of the shape lies exactly on top of every other edge; then one straight cut passes through all the stacked layers at once, and when you unfold, the shape falls out perfectly. That same move — *fold first, then one flat cut* — is exactly what a stack of ReLU layers does to the data before the final linear readout.
</div>

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
		<div class="og-formula"><div class="cap">The Fold-and-Cut Theorem (Demaine et al. 1998):</div><div id="og-fc-formula"></div></div>
	</div>

	<figure style="max-width:640px; margin:1.2em auto; text-align:center;">
		<img src="https://upload.wikimedia.org/wikipedia/commons/3/30/Origami_made_by_Brighton_University_to_support_Japan%3B_April_2011.jpg" alt="Hundreds of folded paper cranes" style="width:100%; height:auto; border-radius:8px;" />
		<figcaption class="md">Paper cranes — the most familiar object in the art of the fold. \cite[Image: Dominic Alves, origami cranes (Wikimedia Commons, CC BY 2.0)]{origami_cranes_img}.</figcaption>
	</figure>
</div>

<div class="og-card">
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

<div class="og-card">
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

This is not just intuition — it has been made rigorous. The affine step is precisely the part that preserves convexity (straight lines stay straight); the ReLU is what breaks it. Map a straight line in the input to the network's activation ("Hamming") space and its image is generally a *non-convex* path whose distance can even decrease. This convexity-breaking has been proved and quantified \cite{lewandowski2025spacefolds}.

Here is the first, important limitation: a hammer only dents the **outer boundary** of a
clump. To reach a data point that sits *inside* the distribution, you would have to crush
everything outside it first. In other words, the nonlinearity can only reshape the
**convex hull** of the data \cite{convex_hull_wiki} — it cannot selectively grab an inner
class. So how does a network ever get at an "island" class that is completely surrounded?
</div>

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
			<div class="og-control" style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" id="og-aff-relu"><label>Append ReLU</label></div>
		</div>
		<div class="og-canvas-wrap"><canvas id="og-affine" width="560" height="400"></canvas></div>
		<div class="og-formula live"><div class="cap">Live weight matrix (rot · scale · shear):</div><div id="og-aff-live"></div></div>
	</div>

	<div class="og-demo">
		<h3>The ReLU step: one fold in 1-D</h3>
		<p class="og-small">A single ReLU neuron $\Phi(x)=\max(0,x)$ is a <em>fold</em> at $x=0$. Drag the input and watch the output: everything negative is pressed flat to zero.</p>
		<div class="og-controls">
			<div class="og-control" style="min-width:260px"><label>Input $x$: <span class="val" id="og-relu-xv">-1.0</span></label><input type="range" id="og-relu-x" min="-3" max="3" step="0.1" value="-1"></div>
		</div>
		<div class="og-canvas-wrap"><canvas id="og-relu1d" width="560" height="280"></canvas></div>
		<div class="og-formula live"><div id="og-relu-live"></div></div>
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

<div class="og-card">
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

<div class="og-card">
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

<div class="og-card">
	<h2 class="og-h2">The Circle-in-Circle Lift — Seeing the Fold in 3-D</h2>
	<p class="og-lead">Watch the inner class rise out of the plane. Toggle between 2-D and 3-D views, adjust the lift height, and slide the separating plane.</p>

	<div class="og-demo">
		<h3>2-D → 3-D: the fold lifts the inner class</h3>
		<p class="og-small">The inner ring (pink) is lifted into a third dimension by the ReLU fold. In 2-D no flat line can separate the classes; in 3-D a single horizontal plane does the job. Drag the <b>lift</b> slider to control how high the inner class rises, and the <b>plane</b> slider to position the separating hyperplane.</p>
		<div class="og-controls">
			<div class="og-control"><label>Lift height: <span class="val" id="og-egg-lift-v">1.0</span></label><input type="range" id="og-egg-lift" min="0" max="2" step="0.1" value="1"></div>
			<div class="og-control"><label>Separating plane z: <span class="val" id="og-egg-plane-v">0.5</span></label><input type="range" id="og-egg-plane" min="0" max="2" step="0.05" value="0.5"></div>
			<div class="og-control"><label>View</label>
				<select id="og-egg-mode">
					<option value="3d">3-D (Plotly)</option>
					<option value="2d">2-D (canvas)</option>
				</select>
			</div>
		</div>
		<div class="og-canvas-wrap"><canvas id="og-egg2d" width="640" height="400"></canvas></div>
		<div id="og-egg3d" class="og-plot" style="height:420px"></div>
		<div id="og-egg-verdict" class="og-verdict no" style="display:none"></div>
		<div class="og-formula"><div id="og-egg-f1"></div></div>
		<div class="og-formula"><div id="og-egg-f2"></div></div>
		<div class="og-formula"><div id="og-egg-f3"></div></div>
	</div>
</div>

<div class="og-card">
	<h2 class="og-h2">Learned Rotation — The Hammer Finds Its Angle</h2>
	<p class="og-lead">A single ReLU neuron can learn the optimal rotation angle for the data. Watch the hyperplane rotate until the fold aligns with the data's structure.</p>

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
		<div class="og-formula"><div id="og-rot-f1"></div></div>
		<div class="og-formula"><div id="og-rot-f2"></div></div>
	</div>
</div>

<div class="og-card">
	<h2 class="og-h2">8 · The 3-Neuron Egg — From Dense to Separable</h2>
	<p class="og-lead">Three ReLU neurons, three hyperplanes, one fold. The top view shows the fold lines; the 3-D view shows the resulting basin. Adjust the number of neurons and fold strength to see how the separability emerges.</p>

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
		<div class="og-formula"><div id="og-egg3-dense"></div></div>
		<div class="og-formula"><div id="og-egg3-sep"></div></div>
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

<div class="og-card">
	<h2 class="og-h2">9 · Deep Networks — An Origami Cascade</h2>
	<p class="og-lead">Each layer folds the already-folded object again. The creases compound: the number of linear regions grows exponentially with depth.</p>

	<div class="md">
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
</div>

<div class="og-card">
	<h2 class="og-h2">10 · The Inefficient Alternative — Shear (Peeling the Orange)</h2>
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

<div class="og-card">
	<h2 class="og-h2">11 · Reading the Folds — The Fingerprint in a Trained Network</h2>
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

<div class="og-card">
	<h2 class="og-h2">12 · Validation — The Poker-Hand Task</h2>
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

<div class="og-card">
	<h2 class="og-h2">13 · The Answer — What a Hidden Layer Is For</h2>
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

This is more than a picture. It reframes a mechanistic question — *what is a hidden layer
for?* — in terms you can draw, measure, and (as the poker experiment shows) causally
verify.
</div>
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
