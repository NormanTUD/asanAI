<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Basic Math Concepts IV — Affine Transformations: Moving Space Itself
description: Linear maps fix the origin; affine maps add the missing freedom — translation. Homogeneous coordinates, image warping, and hands-on 2D/3D checkerboard labs where you edit the matrix and watch the math execute.
icon: &#128290;
part: 1
order: 6
color: accent
topics: math-iv
tags: math-heavy
-->
<?php js("math_iv_affine"); ?>

<style>
/* ── Affine interactive lab (theme-aware, scoped by .aff-* prefix) ── */
.aff-card { background: var(--mn-surface); border: 1px solid var(--mn-border); border-radius: var(--mn-radius-md); padding: 1rem 1.1rem; margin: 1.2rem 0; box-shadow: var(--mn-shadow-md); }
.aff-card-title { font-weight: 600; color: var(--mn-accent); margin-bottom: .7rem; display: flex; align-items: center; gap: .5rem; font-family: var(--mn-font-heading); font-size: 1.02rem; }
.aff-card-title .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--mn-accent); box-shadow: 0 0 10px var(--mn-accent); flex: 0 0 auto; }
.aff-lead { color: var(--mn-text-secondary); font-size: .95rem; }
.aff-sub { font-size: .74rem; letter-spacing: .05em; text-transform: uppercase; color: var(--mn-text-secondary); margin: .5rem 0 .35rem; font-weight: 700; }
.aff-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem; }
.aff-grid2b { margin-top: 1rem; }
.aff-grid2c { grid-template-columns: 1.15fr 1fr; }
.aff-col { min-width: 0; }
.aff-canvas { width: 100%; height: auto; display: block; border-radius: 10px; border: 1px solid var(--mn-border); cursor: crosshair; touch-action: none; }
.aff-canvas3d { cursor: grab; }
.aff-canvas3d:active { cursor: grabbing; }
.aff-matwrap { margin-top: .7rem; }
.aff-matgrid { display: inline-block; border: 1px solid var(--mn-border); border-radius: 6px; overflow: hidden; }
.aff-matrow { display: flex; }
.aff-matcell { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font: 600 11px var(--mn-font-mono, monospace); background: #10141f; color: #e8ecf7; }
.aff-matcell.on { background: #f2f5fc; color: #10141f; }
.aff-matcell.aff-tr { outline: 2px solid var(--mn-accent); outline-offset: -2px; }
.aff-matcell.aff-hv { outline: 2px solid #22d3ee; outline-offset: -2px; }
.aff-readout { margin-top: .55rem; font-family: var(--mn-font-mono, monospace); font-size: .78rem; line-height: 1.45; color: var(--mn-text-secondary); background: var(--mn-bg-subtle); border-radius: 8px; padding: .55rem .7rem; min-height: 2.4em; overflow-wrap: anywhere; }
.aff-ctrlrow { margin-top: .55rem; display: flex; gap: .9rem; align-items: center; flex-wrap: wrap; }
.aff-lbl { font-size: .82rem; color: var(--mn-text-secondary); display: inline-flex; align-items: center; gap: .4rem; }
.aff-select { padding: .3rem .5rem; background: var(--mn-surface-raised); color: var(--mn-text); border: 1px solid var(--mn-border); border-radius: 6px; }
.aff-mxwrap { display: inline-flex; gap: .45rem; padding: .6rem; background: var(--mn-bg-subtle); border-radius: 8px; }
.aff-mxrow { display: flex; gap: .45rem; }
.aff-mx { width: 76px; padding: .35rem .4rem; font-family: var(--mn-font-mono, monospace); font-size: .85rem; background: var(--mn-surface-raised); color: var(--mn-text); border: 1px solid var(--mn-border); border-radius: 6px; }
.aff-mx.aff-bad { border-color: var(--mn-rose); box-shadow: 0 0 0 1px var(--mn-rose); }
.aff-presetrow { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .65rem; }
.aff-btn { padding: .32rem .75rem; border: 1px solid var(--mn-border); border-radius: 99px; font-size: .78rem; color: var(--mn-accent); background: var(--mn-accent-lighter, transparent); cursor: pointer; }
.aff-btn:hover { filter: brightness(1.15); }
.aff-eq { background: var(--mn-bg-subtle); border-radius: 8px; padding: .6rem .8rem; overflow-x: auto; margin-top: .2rem; }
.aff-eqmono { background: var(--mn-bg-subtle); border-radius: 8px; padding: .55rem .8rem; font-family: var(--mn-font-mono, monospace); font-size: .79rem; line-height: 1.55; overflow-x: auto; margin: .45rem 0 0; color: var(--mn-text); white-space: pre; }
.aff-status { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: .85rem; }
.aff-pill { padding: .28rem .7rem; border: 1px solid var(--mn-border); border-radius: 99px; font-size: .78rem; color: var(--mn-text-secondary); }
.aff-pill.warn { color: #b45309; border-color: #b45309; }
.aff-pill.bad { color: var(--mn-rose); border-color: var(--mn-rose); }
.aff-checks { margin-top: .75rem; display: flex; flex-wrap: wrap; gap: .3rem .9rem; font-size: .8rem; align-items: center; }
.aff-check { color: var(--mn-text-secondary); }
.aff-check.good { color: var(--mn-emerald); }
.aff-check.bad { color: var(--mn-rose); }
.aff-check.na { opacity: .7; }
.aff-checksum.good { color: var(--mn-emerald); font-weight: 600; }
.aff-checksum.warn { color: #b45309; font-weight: 600; }
.aff-checksum.bad { color: var(--mn-rose); font-weight: 600; }
.aff-callout { border-left: 3px solid var(--mn-accent); background: var(--mn-bg-warm); padding: .8rem 1rem; border-radius: 0 10px 10px 0; margin: 1rem 0; }
.aff-error { margin-top: .8rem; padding: .7rem .9rem; border: 1px solid var(--mn-rose); border-radius: 8px; color: var(--mn-rose); font-size: .85rem; }
@media (max-width: 800px) { .aff-grid2, .aff-grid2c { grid-template-columns: 1fr; } }
</style>

<div class="md">
In <a href="math_ii">Math II</a> you met **linear maps**: $f(\mathbf{x}) = M\mathbf{x}$. They can rotate, stretch, shear, and mirror space — but there is one thing they can never do. They must send the origin to the origin: $f(\mathbf{0}) = M\mathbf{0} = \mathbf{0}$. The origin is glued in place.

But most things we actually want to do with points — moving an image across the screen, placing an object in a 3D scene, shifting a whole point cloud — require **moving the origin itself**. That missing one degree of freedom is the topic of this chapter.

You have, without knowing it, already met the answer in your very first lesson: the neuron's $\hat{y} = ax + b$ <a href="minimalneuron">Neuron</a> is an affine map in one dimension. Every linear layer $y = Wx + b$ in every network is an affine map in high dimensions. This chapter makes that one sentence into a complete geometry.
</div>

<div class="md">
## What is an affine transformation?

An **affine transformation** is a linear map plus a translation:

$$
f(\mathbf{x}) = M\mathbf{x} + \mathbf{t}
$$

where $M$ is a square matrix (the **linear part**) and $\mathbf{t}$ is a vector (the **translation**, the "bias").

It is *not* a linear map, for the exact reason above. Take the pure translation $f(x, y) = (x + 1, y)$. Then $f(0, 0) = (1, 0) \neq (0, 0)$, while every linear map must send $\mathbf{0}$ to $\mathbf{0}$. Equivalently, the additivity law breaks:

$$
f(\mathbf{x} + \mathbf{y}) = M\mathbf{x} + M\mathbf{y} + \mathbf{t} \;\neq\; M\mathbf{x} + M\mathbf{y} + 2\mathbf{t} = f(\mathbf{x}) + f(\mathbf{y})
$$

The translation is counted once on the left and twice on the right, so the two sides disagree by exactly $\mathbf{t}$.

And yet affine maps are the **next simplest kind of function** after linear ones, and they are characterized by a beautiful geometric property:

> A map between spaces is affine **if and only if** it sends straight lines to straight lines and preserves the ratios in which a point divides a line segment.

Rotations, translations, scalings, shears, mirrors — and any combination of them — are all affine. What they *preserve*: lines stay lines, parallel lines stay parallel, midpoints stay midpoints. What they can *break*: lengths, angles, areas, and circles (which become ellipses).

Three more facts that will keep paying off:

* **Composition closes.** The composition of two affine maps is affine again: $f \circ g(\mathbf{x}) = M_f(M_g\mathbf{x} + \mathbf{t}_g) + \mathbf{t}_f = (M_f M_g)\mathbf{x} + (M_f \mathbf{t}_g + \mathbf{t}_f)$. Chain a hundred affine maps together and you get a single affine map.
* **Fixed points are a linear equation.** The points that stay put satisfy $\mathbf{x} = M\mathbf{x} + \mathbf{t}$, i.e. $(I - M)\mathbf{x} = \mathbf{t}$. For a rotation about a point, that point is the unique solution.
* **Everything is decided by three points.** Two points determine a line, three non-collinear points determine a triangle — and since affine maps preserve lines and ratios, **an affine map is completely determined by where it sends three non-collinear points**.
</div>

<div class="md">
## The determinant: how much space is rescaled?

The linear part $M$ carries the whole story of *how much* space is distorted, and one number summarizes it: the **determinant**.

$$
|\det M| = \text{the factor by which areas (2D) or volumes (3D) are scaled}
$$

* $|\det M| = 1$: area/volume is preserved. Rotations and shears live here — the checkerboard gets tilted but never fattened.
* $|\det M| > 1$: space is blown up; $< 1$: squeezed.
* $\det M < 0$: **orientation flips** — a mirror image, left hand becomes right hand.
* $\det M = 0$: the map **collapses a dimension** — a square becomes a line segment, a cube becomes a flat pancake. Information is lost and the map can no longer be inverted.

That last case matters for the labs below: the moment your determinant hits zero, the image has nowhere left to go, and the software has to notice and cope.
</div>

<div class="md">
## Homogeneous coordinates: smuggling a translation into a matrix

Matrix multiplication alone cannot express $\mathbf{x} \mapsto M\mathbf{x} + \mathbf{t}$, because it has no room for the $+ \mathbf{t}$. The classic fix is to **add a coordinate that is always equal to 1**:

$$
\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix}
=
\underbrace{\begin{bmatrix} M & \mathbf{t} \\ \mathbf{0}^{\top} & 1 \end{bmatrix}}_{\displaystyle 3 \times 3 \; \text{matrix } A}
\begin{bmatrix} x \\ y \\ 1 \end{bmatrix}
$$

Writing $(x, y)$ as $(x, y, 1)$ is called using **homogeneous coordinates**. Check the top row: $x' = M\mathbf{x} + \mathbf{t}$, exactly our affine map. And the bottom row $\mathbf{0}^{\top}, 1$ guarantees the last coordinate stays $1$, so the point remains a valid point after every application.

Now watch what happens when we compose two affine maps, written as $3 \times 3$ matrices $A_1, A_2$:

$$
A_2 A_1 \;=\;
\begin{bmatrix} M_2 & \mathbf{t}_2 \\ \mathbf{0}^{\top} & 1 \end{bmatrix}
\begin{bmatrix} M_1 & \mathbf{t}_1 \\ \mathbf{0}^{\top} & 1 \end{bmatrix}
=
\begin{bmatrix} M_2 M_1 & M_2 \mathbf{t}_1 + \mathbf{t}_2 \\ \mathbf{0}^{\top} & 1 \end{bmatrix}
$$

The composition formula from the last section **falls out of ordinary matrix multiplication**. That single trick — one extra row and column — is why:

* every 3D graphics engine stores object placement as a **$4 \times 4$ matrix** (the "model matrix"),
* camera calibration in computer vision works with $3 \times 3$ and $4 \times 4$ matrices,
* and robotics describes the pose of a robot arm as one $4 \times 4$ homogeneous matrix.

In 3D we write $(x, y, z)$ as $(x, y, z, 1)$ and use $4 \times 4$ matrices:

$$
A = \begin{bmatrix} M & \mathbf{t} \\ \mathbf{0}^{\top} & 1 \end{bmatrix} \in \mathbb{R}^{4 \times 4}
$$

**One deliberate crack in the wall.** The last row $[0, 0, \dots, 0, 1]$ is exactly what *keeps the map affine*. If you edit it — and the labs below let you — you leave the affine family and enter the **projective** family: maps that can make parallel lines meet at a vanishing point, i.e. *perspective*. Affine maps are the subfamily of projective maps where the last row is pinned to $[0, \dots, 0, 1]$. The software will warn you when you cross that line, but it will still render what you ask for.
</div>

<div class="md">
## The image as a 0/1 matrix

In <a href="math_ii">Math II</a> we noted that a black-and-white photo *is* a matrix: $0$ = black, $255$ = white. Now take the simplest picture worth looking at: an **8×8 checkerboard**. It is literally an $8 \times 8$ matrix whose entries are only $0$ and $1$:

$$
I_{i,j} = (i + j) \bmod 2 \qquad
I = \begin{pmatrix} 0 & 1 & 0 & 1 & \cdots \\ 1 & 0 & 1 & 0 & \cdots \\ 0 & 1 & 0 & 1 & \cdots \\ \vdots & \vdots & & & \ddots \end{pmatrix}
$$

A checkerboard is the perfect test pattern for transformations: it has no texture to hide behind, so **every distortion is visible immediately** — a shear leans the squares, a non-uniform scale turns them into rectangles, a rotation tilts them all.

Now: how do we *warp* this image with an affine map $f(\mathbf{x}) = M\mathbf{x} + \mathbf{t}$? For every point $\mathbf{q}$ of the **output** picture we ask: *which pixel of the source image lands here?* Since $\mathbf{q} = M\mathbf{p} + \mathbf{t}$, we solve for the source point:

$$
\mathbf{p} = M^{-1}(\mathbf{q} - \mathbf{t}) \qquad\text{(in homogeneous coordinates: } \mathbf{p} = A^{-1} \mathbf{q}\text{)}
$$

and then look up $I$ at $\mathbf{p}$. This is called **inverse (backward) mapping**, and it is how essentially every image-warping program works, because it assigns exactly one value to every output pixel. (Forward mapping — pushing each source pixel to its destination — can leave holes or double-paint.)

Two ways to "look up $I$ at $\mathbf{p}$" when $\mathbf{p}$ lands between pixels:

* **Nearest neighbour:** take the pixel you are closest to. The warped image stays a pure 0/1 checkerboard — crisp, jagged, honest.
* **Bilinear:** average the four surrounding entries with weights by distance. You get thin grey seams where $0$ and $1$ blend — the exact same smoothing your phone applies when it upscales a pixelated photo.
</div>

<div class="md">
## The 2D affine machine

Below, the source image is the $8 \times 8$ 0/1 matrix, shown both as a rendered picture and *as data* (the little grid under it). The default matrix is a rotation by $30^\circ$.

**What to do:**

1. Edit any entry of the $3 \times 3$ matrix on the right — the warped image, the equations, and the status pills all update live.
2. Click the source image to move the tracked point $p$ and watch its full matrix–vector product, term by term.
3. Hover the warped image: each pixel you point at is a lookup $I(M^{-1} \cdot p)$, and the highlighted cell in the 0/1 grid is the entry that pixel reads.
4. Try "Rotate 90° @ center": the board maps onto itself — except every square changes color. Try "Scale ×2": the area pill says $\times 4$, because $2 \times 2 = 4$. Set the last row to something else and cross into projective territory.

The self-test row at the bottom is the lab checking *itself*: it verifies the inverse, the warping code, and the determinant–area claim against known truths, every time the page loads.
</div>

<div class="aff-card" id="aff-2d">
	<div class="aff-card-title"><span class="dot"></span>Affine machine, 2D — the checkerboard as an image</div>
	<div class="aff-grid2">
		<div class="aff-col">
			<div class="aff-sub">Source image — click to move the tracked point p</div>
			<canvas id="aff2d-src" class="aff-canvas" width="440" height="440"></canvas>
			<div class="aff-matwrap">
				<div class="aff-sub">The image, as data: an 8×8 matrix, 0 = black, 1 = white</div>
				<div id="aff2d-matgrid" class="aff-matgrid"></div>
			</div>
		</div>
		<div class="aff-col">
			<div class="aff-sub">Warped image — every pixel is I(M⁻¹ · p)</div>
			<canvas id="aff2d-out" class="aff-canvas" width="440" height="440"></canvas>
			<div id="aff2d-hover" class="aff-readout"></div>
			<div class="aff-ctrlrow">
				<label class="aff-lbl">Sampling
					<select id="aff2d-bilinear" class="aff-select">
						<option value="nearest">nearest (pure 0/1)</option>
						<option value="bilinear">bilinear (interpolated)</option>
					</select>
				</label>
			</div>
		</div>
	</div>
	<div class="aff-grid2 aff-grid2b">
		<div class="aff-col">
			<div class="aff-sub">Affine matrix M (homogeneous, 3×3) — edit any entry</div>
			<div id="aff2d-mx" class="aff-mxwrap"></div>
			<div id="aff2d-presets" class="aff-presetrow"></div>
		</div>
		<div class="aff-col">
			<div class="aff-sub">The equation, live, for the tracked point</div>
			<div id="aff2d-eq" class="aff-eq"></div>
			<pre id="aff2d-eqmono" class="aff-eqmono"></pre>
		</div>
	</div>
	<div id="aff2d-status" class="aff-status"></div>
	<div id="aff2d-checks" class="aff-checks"></div>
</div>

<div class="md">
## The same idea, one axis up

In 3D an affine map is $f(\mathbf{x}) = M\mathbf{x} + \mathbf{t}$ with a $3 \times 3$ linear part, written as a **$4 \times 4$ homogeneous matrix**. Nothing new, just one more column and row — but the geometry gets richer:

* The determinant now measures **volume** scale, not area.
* A cube stays a *parallelepiped* under any affine map: corners go to corners, edges to edges, and each face (a square) becomes a parallelogram. The checkerboard on the faces makes the distortion obvious.
* Shears, non-uniform scales and rotations can be composed freely; the cube is the shape that reveals every one of them.

The next machine works the same way: edit the $4 \times 4$ matrix, watch the checkerboard cube deform, and read off the volume scale. The faint dashed cube shows where the cube *started*; the dotted line follows the tracked corner from $p$ to $M \cdot p$. Click any corner of the deformed cube to track it instead.
</div>

<div class="aff-card" id="aff-3d">
	<div class="aff-card-title"><span class="dot"></span>Affine machine, 3D — a checkerboard cube through a 4×4</div>
	<div class="aff-grid2 aff-grid2c">
		<div class="aff-col">
			<canvas id="aff3d-canvas" class="aff-canvas aff-canvas3d" width="560" height="440"></canvas>
			<div class="aff-ctrlrow">
				<label class="aff-lbl"><input type="checkbox" id="aff3d-auto" checked> auto-rotate</label>
			</div>
		</div>
		<div class="aff-col">
			<div class="aff-sub">Affine matrix M (homogeneous, 4×4) — edit any entry</div>
			<div id="aff3d-mx" class="aff-mxwrap"></div>
			<div id="aff3d-presets" class="aff-presetrow"></div>
		</div>
	</div>
	<div class="aff-col" style="margin-top:1rem">
		<div class="aff-sub">The equation, live, for the tracked corner (click a corner on the cube to change it)</div>
		<div id="aff3d-eq" class="aff-eq"></div>
		<pre id="aff3d-eqmono" class="aff-eqmono"></pre>
	</div>
	<div id="aff3d-status" class="aff-status"></div>
	<div id="aff3d-checks" class="aff-checks"></div>
</div>

<div class="md">
## Where affine maps show up (spoiler: everywhere)

**Every linear layer is an affine map.** $y = Wx + b$ is exactly $f(x) = Mx + t$ with $M = W$ and $\mathbf{t} = b$. A whole neural network is a stack of affine maps interrupted by nonlinearities — and if you delete the nonlinearities, the entire stack **collapses into a single affine map**, because affine maps close under composition (the first bullet above). That collapse is *why activation functions exist*, as the <a href="minimalneuron">Neuron</a> and <a href="origami">Origami</a> chapters argue from the other side.

**Transformers are affine machines with attention on top.** Every projection in the Transformer — query, key, value, and output — is an affine map $Wx + b$ \cite[Vaswani et al., 2017]{vaswani2017attention}. Attention itself is a *learned, input-dependent* weighted average on top of those affine projections; the affine parts do the coordinate changes, the attention does the routing.

**Data augmentation is affine maps as training data.** Random rotations, crops, flips and warps are affine (or projective) transformations applied to images before training, teaching vision models to recognize objects regardless of pose — the model is being forced to care about what is *invariant* under the affine group.

**Camera and pose math is homogeneous coordinates by trade.** The transformation from an object's coordinates to camera coordinates, and from camera to screen, is a $4 \times 4$ matrix; a *homography* (the map between two views of a plane, the math behind document scanners and AR) is a $3 \times 3$ projective matrix — the generalization we poked at by breaking the last row.

**Interpretability uses affine probes.** To ask "what does layer $k$ know?", researchers fit a small affine map from that layer's activations to the model's output — the logit lens and its refined cousin, the tuned lens (see the <a href="fact_lookup">Fact Lookup</a> and <a href="mechanistic_interpretability">Mechanistic Interpretability</a> chapters). The probe is literally an affine transformation, learned by the same $Wx + b$ recipe.
</div>

<div class="md">
<div class="aff-callout"><b>Key point.</b> An affine transformation is the most general map that sends straight lines to straight lines: a linear part $M$ plus a translation $\mathbf{t}$, written $f(x) = Mx + t$. Homogeneous coordinates — appending a $1$ and using a bigger matrix — turn composition of affine maps into plain matrix multiplication, which is why $3 \times 3$ and $4 \times 4$ matrices run image warping, 3D graphics, camera math, and every biased linear layer in every neural network. The determinant tells you how much area or volume survives the trip; the last row tells you whether you are still in the affine family at all.</div>
</div>

<script>
if (typeof loadMathIVModule === 'undefined') {
	async function loadMathIVModule() {
		updateLoadingStatus("Loading section about Math IV...");
		return Promise.resolve();
	}
}
</script>
