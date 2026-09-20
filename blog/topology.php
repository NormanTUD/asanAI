<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Topology and the Geometry of Thought
description: Why a layer can stretch and squish data but never cut or fold it, what that means for the minimum width of a network, and how to watch a net untangle data in real time.
icon: &#128640;
part: 3
order: 3
color: sky
topics: architecture, math-iii, deep-learning, interpretability, topology
-->

<style>
	.tp-demo { background: var(--mn-surface); border: 1px solid var(--mn-border); border-radius: 12px; padding: 18px; margin: 22px 0; }
	.tp-demo h3 { margin: 0 0 8px; font-size: 1.05rem; color: var(--mn-text); }
	.tp-controls { display: flex; flex-wrap: wrap; gap: 14px; margin: 12px 0; align-items: flex-end; }
	.tp-control { display: flex; flex-direction: column; gap: 4px; min-width: 150px; }
	.tp-control label { font-size: .85rem; color: var(--mn-text-secondary); }
	.tp-control .val { color: var(--mn-accent); font-family: var(--mn-font-mono, monospace); }
	.tp-control input[type="range"] { width: 100%; accent-color: var(--mn-accent); }
	.tp-control select { background: var(--mn-surface); color: var(--mn-text); border: 1px solid var(--mn-border); padding: 5px 8px; border-radius: 6px; }
	.tp-btn { background: var(--mn-accent); color: #fff; border: none; padding: 7px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: .85rem; }
	.tp-btn.sec { background: var(--mn-surface); color: var(--mn-text); border: 1px solid var(--mn-border); }
	.tp-btn:disabled { opacity: .5; cursor: not-allowed; }
	.tp-canvas-wrap { position: relative; margin: 12px 0; text-align: center; }
	.tp-canvas-wrap canvas { display: inline-block; max-width: 100%; height: auto; border-radius: 8px; background: var(--mn-bg-subtle); cursor: crosshair; touch-action: none; }
	.tp-legend { display: flex; gap: 16px; flex-wrap: wrap; font-size: .85rem; margin: 8px 0; color: var(--mn-text-secondary); }
	.tp-legend span { display: inline-flex; align-items: center; gap: 6px; }
	.tp-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
	.tp-note { background: color-mix(in srgb, var(--mn-accent) 8%, var(--mn-surface)); border-left: 3px solid var(--mn-accent); padding: 12px 16px; margin: 14px 0; border-radius: 4px; font-size: .95rem; color: var(--mn-text); }
	.tp-out { margin-top: 8px; color: var(--mn-text-secondary); font-size: .9rem; font-family: var(--mn-font-mono, monospace); min-height: 1.2em; }
	.tp-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
	@media (max-width: 700px) { .tp-grid2 { grid-template-columns: 1fr; } }
</style>

<div class="md">
## Stretch, Squish — but Never Cut

In the previous chapter we met feed-forward networks as **paper folders**: a ReLU layer
is a hammer-blow that creases the data into a spare, higher dimension, and depth is a
cascade of such creases \cite{keup2022origami}. That story is about *what a layer can do
when the activation is allowed to crush*. There is a second, cleaner story, and it starts
from a question \citeauthor{colah2014manifolds} (\citeyear{colah2014manifolds}) asked in
2014 \cite{colah2014manifolds}:

> *What if the bend is **smooth** — a tanh, a sigmoid, a softplus instead of a ReLU? What
> can a layer then do to the data, and what is it **forbidden** from doing?*

The answer is beautifully restrictive, and it is the whole reason the word *topology*
appears in a story about neural networks.

Start with the simplest setting. A network with only a handful of neurons per layer is
**visualizable**. Feed every point of a fine grid through the net and you can *watch* the
data move. Each layer emits a **representation** — the data re-expressed in the coordinates
of that layer's neurons. The very last layer is just a **linear readout**: it draws a single
flat hyperplane (a line in 2-D) and calls one side "class 0" and the other "class 1". So
the entire job of every hidden layer is to *reshape the data until that final flat cut
succeeds*.

And here is the surprise. With a **smooth** activation, each layer is a
**homeomorphism**: it can stretch and squish space, rotate and shear it, but it can **never
cut, tear, or fold** it. It preserves every topological property — a loop stays a loop, a
region that surrounds another still surrounds it, connected things stay connected.
</div>

<div class="optional md" data-headline="The homeomorphism theorem, proved">
A feed-forward layer computes $\mathbf{h} = \Phi(W\,\mathbf{x} + \mathbf{b})$: a linear
map, a shift, then a pointwise activation. Olah's claim is that — with $N$ inputs and
$N$ outputs — this is a **homeomorphism** whenever $W$ is non-singular. The proof is just
"three homeomorphisms glued together":

1. **$\mathbf{x} \mapsto W\,\mathbf{x}$.** If $\det W \neq 0$ then $W$ is invertible, with
   inverse $W^{-1}$. A linear map and its inverse are both continuous, so this is a
   homeomorphism. (A non-singular matrix is exactly a change of basis — a reversible
   stretch-and-rotate of the whole space.)
2. **$\mathbf{u} \mapsto \mathbf{u} + \mathbf{b}$.** A translation. Its inverse subtracts
   $\mathbf{b}$. Both are continuous. A homeomorphism.
3. **$\mathbf{z} \mapsto \Phi(\mathbf{z})$ applied coordinate-wise.** tanh, sigmoid and
   softplus are continuous *and* have continuous inverses, so each is a homeomorphism of
   the line (careful about range: tanh lands in $(-1,1)$, not $\mathbb{R}$). Applied to
   each coordinate independently, it is a homeomorphism of $\mathbb{R}^N$.

A composition of homeomorphisms is a homeomorphism, so the layer is one. **And so is any
stack of them.** $\blacksquare$

Two cautions carry all the weight of what follows. First, the **width must be full**: if
$W$ is singular (more inputs than outputs, or dependent columns) the map *folds the space
onto a lower-dimensional set* and information is destroyed — that is the one moment a
"smooth" layer can actually crush data. Second, the activation must genuinely be invertible.
**ReLU is not**: $\max(0, x)$ flattens its entire negative half onto $0$. That single
difference is the whole distance between this chapter and the last one — a ReLU layer is
free to *fold*, a tanh layer is not.
</div>

<div class="md">
## A Straight Line Has a Topology Problem

Now the consequence that makes this more than a curiosity. Take the **"2-D egg"**: one
class is a solid **disk** in the middle, the other is a **ring** that completely surrounds
it. This is the same shape the origami chapter opened with, and the same honest first
question: *can a single flat line separate the two?* No — try dragging one and you'll see
it plateaus, no matter how you aim it.

But the homeomorphism argument goes much deeper than "a line won't do it". It says a
**2-wide** smooth network — *any number of layers* — **cannot solve the egg at all**.

> **Claim.** Let the inner class be a disk $A = \{x : \|x\| < \tfrac13\}$ and the outer
> class a ring $B = \{x : \tfrac23 < \|x\| < 1\}$. No network of width $\le 2$ with smooth
> activations, **at any depth**, can separate $A$ from $B$. Add a **third** hidden unit and
> a single layer does it.

The intuition is the homeomorphism again. Every width-2 layer either preserves the shape
(the disk is still *surrounded* by the ring, and no straight line separates a region from
the ring that encloses it) or, if some layer's $W$ is singular, it *collapses* the data
onto a line — at which moment points of the disk and the ring are squashed on top of each
other and can no longer be told apart. There is no width-2 move that escapes the enclosure.
**The only way out is sideways into a new dimension.**

Give the network a third hidden unit and the enclosure breaks: the layer lifts the disk
*up* along that third axis into a little tent while the ring lies flat, and one horizontal
plane now separates them cleanly. Width — not depth — is the resource that unlocks the
problem. This is a genuine **topological lower bound** on the width of a network, and it is
the first time a topological property of the *data* has produced a hard statement about the
*architecture* that is needed to solve it.

In the demo below, train a 2-layer tanh net on the egg with **two** hidden units and watch
it flounder at a ceiling well short of 100%. Then switch to **three** and watch the same
network suddenly succeed. Nothing about the depth, the optimizer, or the data changed — only
the width, and only because a third dimension let the disk escape the ring.
</div>

<div class="tp-demo">
	<h3>Topological lower bound: the egg needs a third unit</h3>
	<p style="margin:0 0 4px; color: var(--mn-text-secondary)">A 2-layer tanh network trained
	live on the 2-D egg. The coloured background is the network's own decision grid, painted
	fine over the plane. Set the width to <b>2</b> and train — it plateaus. Set it to <b>3</b>
	and train — the disk pops out of the ring.</p>
	<div class="tp-controls">
		<div class="tp-control"><label>Hidden units (width)</label>
			<select id="tp-egg-units">
				<option value="2">2 units (doomed)</option>
				<option value="3">3 units (escapes)</option>
			</select>
		</div>
		<button class="tp-btn" id="tp-egg-train">▶ Train</button>
		<button class="tp-btn sec" id="tp-egg-reset">↺ Reset data &amp; weights</button>
	</div>
	<div class="tp-canvas-wrap"><canvas id="tp-egg" width="640" height="460"></canvas></div>
	<div class="tp-legend">
		<span><span class="tp-dot" style="background:#ff6b9d"></span>Inner disk (class 0)</span>
		<span><span class="tp-dot" style="background:#4ecdc4"></span>Outer ring (class 1)</span>
	</div>
	<div class="tp-out" id="tp-egg-out"></div>
</div>

<div class="md">
## The One-Dimensional Egg

Strip the picture down to a single number and the mechanism becomes impossible to miss.
Put one class on the middle of a line — $A = [-\tfrac13, \tfrac13]$ — and the other on the
two ends — $B = [-1, -\tfrac23] \cup [\tfrac23, 1]$.

A single neuron can only produce **one bump** of activation; its decision boundary is a
single threshold, so it can carve out *one interval* — never the middle-with-ends-outside
pattern the task demands. One hidden unit is topologically doomed, for exactly the same
reason the width-2 egg was.

But **two** hidden units learn a lovely trick: one fires for "$x > -\tfrac12$", the other
for "$x > \tfrac12$". Stacked, they lift the middle of the line *up* into a second
dimension while the two ends stay *down* — a curve in 2-D that a flat line now separates
easily. Watch the representation below: with one unit the data stays a flat, inseparable
line; with two, it bends into an arch.
</div>

<div class="tp-demo">
	<h3>The 1-D egg: one unit can't, two units bend the line</h3>
	<p style="margin:0 0 4px; color: var(--mn-text-secondary)">Left: the data on a line and the
	network's decision on it. Right: the **hidden-layer representation** of the same data —
	the curve the network has sculpted. Set the width to <b>2</b> and train: the middle is
	lifted off the line into a second dimension, and the classes separate.</p>
	<div class="tp-controls">
		<div class="tp-control"><label>Hidden units</label>
			<select id="tp-1d-units">
				<option value="1">1 unit (doomed)</option>
				<option value="2" selected>2 units (bends the line)</option>
			</select>
		</div>
		<button class="tp-btn" id="tp-1d-train">▶ Train</button>
		<button class="tp-btn sec" id="tp-1d-reset">↺ Reset</button>
	</div>
	<div class="tp-grid2">
		<div><h4 style="text-align:center; margin:0 0 4px; font-size:.9rem">Input line (1-D)</h4><div class="tp-canvas-wrap"><canvas id="tp-1d" width="360" height="300"></canvas></div></div>
		<div><h4 style="text-align:center; margin:0 0 4px; font-size:.9rem">Hidden representation</h4><div class="tp-canvas-wrap"><canvas id="tp-1d-rep" width="360" height="300"></canvas></div></div>
	</div>
	<div class="tp-out" id="tp-1d-out"></div>
</div>

<div class="md">
## Now You Untangle It

The egg is a fixed puzzle; real data isn't. So let's do what \citeauthor{karpathy2015convnetjs}
invites you to do \cite{karpathy2015convnetjs}: **make your own data** and watch a small
network untangle it, live.

Click to drop a **red** point, <kbd>Shift</kbd>-click a **green** one, and
<kbd>Ctrl</kbd>-click (or right-click) to remove the nearest point. A two-layer net trains
in the background every few hundredths of a second, and its decision is painted across the
plane in real time.

The payoff is the **second canvas**. It shows the data *after* the first layer — every point
expressed in the coordinates of two hidden neurons at a time (cycle through the pairs). At
the start the two colours are hopelessly intermixed. As training runs you watch them **drift
apart** until a flat line between them exists. That drifting-apart *is* the network
learning; the hidden layer is slowly, continuously pulling the two manifolds apart in the
direction the third dimension allows.
</div>

<div class="tp-demo">
	<h3>Build your own 2-D data — watch it become linearly separable</h3>
	<p style="margin:0 0 4px; color: var(--mn-text-secondary)">
	<b>Click</b> = red point &nbsp;·&nbsp; <b>Shift + click</b> = green point &nbsp;·&nbsp;
	<b>Ctrl / right-click</b> = remove nearest. The net trains continuously. The right panel
	is the live hidden representation (cycling neuron pairs).</p>
	<div class="tp-controls">
		<div class="tp-control"><label>Hidden units</label>
			<select id="tp-play-units">
				<option value="2">2</option>
				<option value="4" selected>4</option>
				<option value="6">6</option>
			</select>
		</div>
		<div class="tp-control"><label>Activation</label>
			<select id="tp-play-act">
				<option value="tanh" selected>tanh</option>
				<option value="relu">relu</option>
			</select>
		</div>
		<button class="tp-btn" id="tp-play-cycle">⇄ Cycle neurons</button>
		<button class="tp-btn sec" id="tp-play-pause">⏸ Pause</button>
		<button class="tp-btn sec" id="tp-play-reset">↺ Reset</button>
	</div>
	<div class="tp-grid2">
		<div><h4 style="text-align:center; margin:0 0 4px; font-size:.9rem">Input space (click to add points)</h4><div class="tp-canvas-wrap"><canvas id="tp-play" width="380" height="380"></canvas></div></div>
		<div><h4 style="text-align:center; margin:0 0 4px; font-size:.9rem">Hidden representation — <span id="tp-play-rep-label" style="color:var(--mn-accent)">neurons 0,1</span></h4><div class="tp-canvas-wrap"><canvas id="tp-play-rep" width="380" height="380"></canvas></div></div>
	</div>
	<div class="tp-out" id="tp-play-out"></div>
</div>

<div class="optional md" data-headline="Links, knots, and the fourth dimension">
The egg is a *surrounding*; a nastier tangle is a *link* — two rings threaded through each
other like a chain, which you cannot pull apart without cutting. Colah's point is that a
network classifying such data is, in the language of knot theory, performing an **ambient
isotopy**: a *continuous family of homeomorphisms* that deforms one configuration into the
separated one, the data moving smoothly and never tearing. The continuous layer-by-layer
visualization is not just a pretty animation — it is the isotopy itself, made visible.

And the dimension count returns with a vengeance: a single link of 1-D curves lives in 3-D
but can only be *unknotted* in 4-D. In general, an $n$-dimensional manifold may need up to
$2n + 2$ dimensions to untangle. Topology keeps handing the network a price tag, and the
price is, again, **extra dimensions** — the same currency the fold-and-cut story paid with.
</div>

<div class="optional md" data-headline="The easy way out">
There is a trap worth naming, because it is the trap an optimizer actually falls into.
Faced with an entangled pair of manifolds, the *genuinely* correct move is to pull them
cleanly apart into a new dimension. The *lazy* move is to leave the tangle in place and
just **stretch the thin bits until they are near-singular** — pulling the boundary into an
ever-thinner sliver that threads the gaps. This can reach high training accuracy, so it
presents itself as a tempting local minimum, with very high derivatives and sharp
near-discontinuities exactly where the stretching happens.

The tell is in the decision grid: instead of two clean regions, you get a boundary that
snakes and thins to a hair. The standard countermeasure is a **contractive penalty** —
regularize the derivative of each layer so the network is charged for precisely this kind of
near-singular stretching. It pushes training back toward the honest isotopy. (In the egg
demo, a width-2 net that "almost" works by snaking a boundary is doing exactly this.)
</div>

<div class="md">
## The Geometry of Thought

Step back and the two chapters fit together into one picture of *what a hidden layer is for*.

A layer is a change of coordinates. The final readout is a flat cut. The data starts out
topologically knotted around itself, and the network's job is to carry it, layer by layer,
to a place where one flat cut suffices. Two mechanisms do the carrying:

* **Smooth (tanh / sigmoid) layers** are *homeomorphisms* — they preserve topology, so they
  can only **stretch and squish**. They cannot free a surrounded class on their own; they
  need a **spare dimension** (width) to do it. Depth helps, but *width is what breaks the
  enclosure* \cite{colah2014manifolds}.
* **ReLU layers** are *not* homeomorphisms — they **fold**. That single freedom lets them
  manufacture separability by creasing the data into unoccupied dimensions, layer after
  layer \cite{keup2022origami}.

So "folding" and "topology" are not two ideas; they are the *same* idea read from two
directions. A network must move data through space to make a flat cut work. If the moves
are homeomorphisms, topology dictates exactly how many extra dimensions the journey requires.
If the moves are allowed to fold, the network spends those same dimensions as creases.

This is the **manifold hypothesis** made mechanical \cite{manifold_wiki}: natural data sits
on low-dimensional manifolds, and classification is the business of **separating tangled
manifolds**. The theorem you can take away is a clean one —

> A network's power is bounded by its **width**, because topology cannot be changed by
> depth alone. To un-knot the data, a network must be allowed to think in *more dimensions
> than the data itself has*.

That is the geometry of thought: not a set of numbers to memorize, but a shape to be
untangled, one reversible stretch (or one well-placed fold) at a time.
</div>

<div class="optional md" data-headline="Where this connects">
* **Origami in N Dimensions** — the ReLU side of the same coin: folding as the
  non-homeomorphic escape hatch, with the poker-hand experiment as the causal proof.
* **Deep Learning** — the composition view and the Universal Approximation Theorem this
  chapter gives a *topological* reason for.
* **Basic Math III** — the manifold hypothesis and why intrinsic dimension is low.
* **The foam of meaning** — the same "data lives on a low-dimensional structure in a high-
  dimensional void" geometry, applied to language.
* **Mechanistic Interpretability** — the "easy way out" (thin, high-derivative boundaries)
  is the same pathology interpretability research keeps hunting in trained nets.
</div>
