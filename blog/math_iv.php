<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Basic Math Concepts IV — Affine Maps & the Fold
description: Linear maps fix the origin; affine maps add translation. Then the first non-affine move — the fold — lifts data into a higher dimension where a flat hyperplane can finally separate it. Interactive checkerboards, chained tori, and the Hopf link.
icon: &#128290;
part: 1
order: 6
color: accent
topics: math-iv
tags: math-heavy
-->
<?php js("math_iv_affine"); ?>

<style>
/* ── Affine lab — sleek, theme-aware ── */
.af-card{background:linear-gradient(180deg,var(--mn-surface),var(--mn-surface-raised));border:1px solid var(--mn-border);border-radius:14px;padding:1.2rem 1.3rem;margin:1.4rem 0;box-shadow:0 4px 24px rgba(0,0,0,.08),0 1px 0 rgba(255,255,255,.03) inset}
.af-title{font:600 1.05rem var(--mn-font-heading);color:var(--mn-accent);margin-bottom:.8rem;display:flex;align-items:center;gap:.6rem}
.af-title .dot{width:9px;height:9px;border-radius:50%;background:var(--mn-accent);box-shadow:0 0 12px var(--mn-accent)}
.af-sub{font:700 .72rem/1 var(--mn-font-heading);letter-spacing:.08em;text-transform:uppercase;color:var(--mn-text-secondary);margin:.55rem 0 .4rem}
.af-grid{display:grid;gap:1.15rem;grid-template-columns:1fr 1fr}
.af-grid.wide{grid-template-columns:1.2fr 1fr}
.af-col{min-width:0}
.af-canvas{width:100%;height:auto;display:block;border-radius:10px;border:1px solid var(--mn-border);cursor:crosshair;touch-action:none;background:var(--mn-bg-subtle)}
.af-canvas.d3{cursor:grab}.af-canvas.d3:active{cursor:grabbing}
.af-matgrid{display:inline-block;border:1px solid var(--mn-border);border-radius:6px;overflow:hidden}
.af-matrow{display:flex}
.af-matcell{width:26px;height:26px;display:flex;align-items:center;justify-content:center;font:600 11px var(--mn-font-mono,monospace);background:#0f1420;color:#e8ecf7;transition:outline .15s}
.af-matcell.on{background:#f2f5fc;color:#0f1420}
.af-matcell.tr{outline:2px solid var(--mn-accent);outline-offset:-2px}
.af-matcell.hv{outline:2px solid #22d3ee;outline-offset:-2px}
.af-read{margin-top:.55rem;font:.78rem/1.5 var(--mn-font-mono,monospace);color:var(--mn-text-secondary);background:var(--mn-bg-subtle);border-radius:8px;padding:.6rem .75rem;min-height:2.4em;overflow-wrap:anywhere;border-left:2px solid var(--mn-accent)}
.af-row{display:flex;gap:.7rem;align-items:center;flex-wrap:wrap;margin-top:.55rem}
.af-lbl{font-size:.82rem;color:var(--mn-text-secondary);display:inline-flex;align-items:center;gap:.45rem}
.af-sel{padding:.32rem .55rem;background:var(--mn-surface-raised);color:var(--mn-text);border:1px solid var(--mn-border);border-radius:6px;font-size:.85rem}
.af-mxwrap{display:inline-flex;flex-direction:column;gap:.45rem;padding:.7rem;background:var(--mn-bg-subtle);border-radius:10px;border:1px solid var(--mn-border)}
.af-mxrow{display:flex;gap:.45rem}
.af-mx{width:78px;padding:.38rem .45rem;font:.85rem var(--mn-font-mono,monospace);background:var(--mn-surface-raised);color:var(--mn-text);border:1px solid var(--mn-border);border-radius:6px;transition:border-color .15s,box-shadow .15s}
.af-mx:focus{outline:none;border-color:var(--mn-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--mn-accent) 20%,transparent)}
.af-mx.bad{border-color:var(--mn-rose);box-shadow:0 0 0 2px color-mix(in srgb,var(--mn-rose) 25%,transparent)}
.af-presets{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.65rem}
.af-btn{padding:.32rem .8rem;border:1px solid var(--mn-border);border-radius:99px;font-size:.78rem;color:var(--mn-accent);background:transparent;cursor:pointer;transition:all .15s}
.af-btn:hover{background:color-mix(in srgb,var(--mn-accent) 12%,transparent);border-color:var(--mn-accent)}
.af-eq{background:var(--mn-bg-subtle);border-radius:8px;padding:.65rem .85rem;overflow-x:auto;border-left:3px solid var(--mn-accent)}
.af-eqm{background:var(--mn-bg-subtle);border-radius:8px;padding:.6rem .85rem;font:.78rem/1.55 var(--mn-font-mono,monospace);overflow-x:auto;margin:.45rem 0 0;color:var(--mn-text);white-space:pre}
.af-status{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.85rem}
.af-pill{padding:.3rem .75rem;border:1px solid var(--mn-border);border-radius:99px;font-size:.78rem;color:var(--mn-text-secondary);background:var(--mn-bg-subtle)}
.af-pill.warn{color:#b45309;border-color:#b45309;background:color-mix(in srgb,#b45309 8%,transparent)}
.af-pill.bad{color:var(--mn-rose);border-color:var(--mn-rose);background:color-mix(in srgb,var(--mn-rose) 8%,transparent)}
.af-pill.good{color:var(--mn-emerald);border-color:var(--mn-emerald);background:color-mix(in srgb,var(--mn-emerald) 8%,transparent)}
.af-checks{margin-top:.75rem;display:flex;flex-wrap:wrap;gap:.3rem .9rem;font-size:.8rem;align-items:center}
.af-check{color:var(--mn-text-secondary)}
.af-check.good{color:var(--mn-emerald)}
.af-check.bad{color:var(--mn-rose)}
.af-checksum{margin-left:.5rem;font-weight:600}
.af-checksum.good{color:var(--mn-emerald)}.af-checksum.warn{color:#b45309}.af-checksum.bad{color:var(--mn-rose)}
.af-callout{border-left:3px solid var(--mn-accent);background:linear-gradient(90deg,color-mix(in srgb,var(--mn-accent) 8%,transparent),transparent);padding:.9rem 1.1rem;border-radius:0 10px 10px 0;margin:1.1rem 0}
.af-err{margin-top:.8rem;padding:.7rem .9rem;border:1px solid var(--mn-rose);border-radius:8px;color:var(--mn-rose);font-size:.85rem;background:color-mix(in srgb,var(--mn-rose) 5%,transparent)}
.af-range{width:150px;accent-color:var(--mn-accent)}
.af-rv{font:.78rem var(--mn-font-mono,monospace);color:var(--mn-accent);min-width:3.6em;display:inline-block;text-align:right}
.af-sliders>.af-row{gap:.4rem}
.af-matview{display:inline-block;border:1px solid var(--mn-border);border-radius:6px;overflow:hidden}
.af-matview .af-matrow{display:flex}
.af-matview .af-matcell{cursor:default;font-weight:500}
@media(max-width:820px){.af-grid,.af-grid.wide{grid-template-columns:1fr}}
</style>

<div class="md">
**The one-paragraph story.** Every "movement" of data — a linear layer $y = Wx + b$, an image warp, a camera transform — is a *map of space*. This chapter catalogs the simplest such maps (**affine**: linear + translation), then introduces the first non-affine move (**the fold**), which is exactly what a ReLU neuron does. The payoff comes at the end: two rings chained like a chain link (the **Hopf link**) that *no* affine motion can pull apart — but one fold, into a higher dimension, unthreads them. That is the geometry every classifier lives by.
</div>

## Linear maps aren't enough

<div class="md">
In <a href="math_ii">Math II</a> you met **linear maps** $f(\mathbf{x}) = M\mathbf{x}$. They rotate, scale, shear, mirror — but they must send the origin to itself: $f(\mathbf{0}) = \mathbf{0}$. The origin is glued in place.

Most useful "movements" of data need to move the origin too. The fix is the **affine transformation**:

$$
f(\mathbf{x}) = M\mathbf{x} + \mathbf{t}
$$

You've met it before: your first neuron $\hat{y} = ax + b$ (<a href="minimalneuron">Neuron</a>) is a 1-D affine map. Every linear layer $y = Wx + b$ is affine in high dimensions. This chapter makes that a full geometry.
</div>

## What affine maps preserve (and what they don't)

<div class="md">
An affine map is the most general map that sends **straight lines to straight lines**. Precisely: it preserves lines, parallelism, and the ratios in which a point divides a segment. It generally breaks lengths, angles, areas, and turns circles into ellipses.

Three facts we'll lean on repeatedly:

- **Composition closes.** $f \circ g$ is affine again: $(M_f M_g)\mathbf{x} + (M_f\mathbf{t}_g + \mathbf{t}_f)$. Chain a hundred affine maps — still one affine map.
- **Three points determine it.** Since lines and ratios are preserved, telling an affine map where three non-collinear points go fixes it everywhere.
- **The determinant $|\det M|$ is the volume scale.** $=1$ preserves area/volume; $>1$ expands; $<1$ compresses; $<0$ mirrors; $=0$ collapses a dimension.
</div>

<div class="optional md" data-headline="History: where the word comes from">
Descartes made points into coordinates (1637). Grassmann and Möbius separated *point* from *direction*, giving the $M\mathbf{x} + \mathbf{t}$ form. Riemann's 1854 habilitation sorted geometry into a ladder — **affine ⊂ similarity ⊂ Euclidean** — each rung defined by what its transformations preserve. The word *affine* is from Latin *affinis* ("related, connected"), coined for mathematics by **Euler** (1748): affine maps *keep things related* — collinearity, parallelism, ratios — even when they break lengths and angles.
</div>

## Homogeneous coordinates: the trick that makes it a matrix

<div class="md">
Matrix multiplication can't express $M\mathbf{x} + \mathbf{t}$ directly — there's no place for the $+\mathbf{t}$. Fix: **add a coordinate that's always 1**.

$$
\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} =
\underbrace{\begin{bmatrix} M & \mathbf{t} \\ \mathbf{0}^\top & 1 \end{bmatrix}}_{\text{3×3 matrix }A}
\begin{bmatrix} x \\ y \\ 1 \end{bmatrix}
$$

Check the top row: $\mathbf{x}' = M\mathbf{x} + \mathbf{t}$. The bottom row $[0,0,1]$ keeps the last coordinate at 1. And composition of two affine maps *is* the matrix product $A_2 A_1$ — automatically. That single trick is why:

- 3D graphics engines store every object as a $4\times 4$ matrix,
- computer vision uses $3\times 3$ homographies,
- robotics writes each joint pose as a $4\times 4$ homogeneous matrix,
- every biased linear layer in every network is one row of this pattern.

**The crack in the wall.** Pin the last row to $[0,\dots,0,1]$ → affine. Unpin it → you leave the affine family for the **projective** family: parallel lines can now meet at a vanishing point (perspective). The labs below let you break that pin and see what happens.
</div>

<div class="optional md" data-headline="Beyond affine: projective and Möbius maps">
Unpinning the last row gives $\mathbf{x}' = H\mathbf{x} / (H\mathbf{x})_{n+1}$ — a **projective transformation**. In 2D, an $H \in \mathbb{R}^{3\times 3}$ has 8 degrees of freedom (vs affine's 6); the extra two are the "what happens at infinity" freedom. This is what makes vanishing points appear.

A separate non-affine family is the **Möbius maps** $z \mapsto (az+b)/(cz+d)$ on the complex plane: they preserve *angles* (conformal) and send circles/lines to circles/lines. Three families, sorted by what they preserve:

| Family | Preserves | 2D dof |
|---|---|---|
| Affine | lines, parallelism, ratios | 6 |
| Projective | lines only | 8 |
| Möbius | angles, circles/lines | 6 (real) |
</div>

## The image is a matrix

<div class="md">
Take the simplest picture worth looking at: an **8×8 checkerboard**. It *is* an $8\times 8$ matrix of 0s and 1s:

$$
I_{ij} = (i+j) \bmod 2
$$

A checkerboard hides no texture, so every distortion shows: a shear leans the squares, a non-uniform scale turns them into rectangles, a rotation tilts them all.

To warp an image by an affine map: for every output pixel $\mathbf{q}$, ask *which source pixel lands here?* The answer is $\mathbf{p} = A^{-1}\mathbf{q}$. This is **inverse mapping**: every output pixel gets exactly one value. (Forward mapping — pushing source pixels out — leaves holes.) When $\mathbf{p}$ falls between pixels: **nearest neighbour** (crisp 0/1) or **bilinear** (smooth 0-to-1 blend along seams).
</div>

## Lab 1 — The 2D affine machine

<div class="md">
Edit any entry of the $3\times 3$ matrix. Click the source to move the tracked point $p$. Hover the warped image — each pixel is a lookup $I(M^{-1}\mathbf{q})$ in the 0/1 grid.

**Try:** *Rotate 90° @ center* — the board maps to itself, but every square flips color. *Scale ×2* — the area pill reads ×4 ($2\times 2$). Edit the bottom row and cross into projective territory: parallel lines curve toward a vanishing point.
</div>

<div class="af-card" id="af-2d">
	<div class="af-title"><span class="dot"></span>2D — checkerboard through a 3×3 matrix</div>
	<div class="af-grid">
		<div class="af-col">
			<div class="af-sub">Source · click to move p</div>
			<canvas id="af2d-src" class="af-canvas" width="440" height="440"></canvas>
			<div class="af-sub" style="margin-top:.9rem">The image as data · 8×8 matrix</div>
			<div id="af2d-mat" class="af-matgrid"></div>
		</div>
		<div class="af-col">
			<div class="af-sub">Warped · hover to trace M⁻¹·q</div>
			<canvas id="af2d-out" class="af-canvas" width="440" height="440"></canvas>
			<div id="af2d-hover" class="af-read"></div>
			<div class="af-row">
				<label class="af-lbl">Sampling
					<select id="af2d-samp" class="af-sel">
						<option value="nearest">nearest (crisp 0/1)</option>
						<option value="bilinear">bilinear (smooth)</option>
					</select>
				</label>
			</div>
		</div>
	</div>
	<div class="af-grid" style="margin-top:1rem">
		<div class="af-col">
			<div class="af-sub">Matrix M · edit any cell (cos(30°), pi/6 accepted)</div>
			<div id="af2d-mx" class="af-mxwrap"></div>
			<div id="af2d-presets" class="af-presets"></div>
		</div>
		<div class="af-col">
			<div class="af-sub">Live equation for the tracked point</div>
			<div id="af2d-eq" class="af-eq"></div>
			<pre id="af2d-eqm" class="af-eqm"></pre>
		</div>
	</div>
	<div id="af2d-status" class="af-status"></div>
	<div id="af2d-checks" class="af-checks"></div>
</div>

## Lab 2 — The 3D affine machine

<div class="md">
Same story, one dimension up: $4\times 4$ matrices, the determinant scales *volume*. A cube stays a parallelepiped — corners to corners, edges to edges, each face a parallelogram. The ghost cube shows where things started; the dotted line follows the tracked corner from $p$ to $M\cdot p$. Click any corner to track it.
</div>

<div class="af-card" id="af-3d">
	<div class="af-title"><span class="dot"></span>3D — checkerboard cube through a 4×4 matrix</div>
	<div class="af-grid wide">
		<div class="af-col">
			<canvas id="af3d-canvas" class="af-canvas d3" width="560" height="440"></canvas>
			<div class="af-row"><label class="af-lbl"><input type="checkbox" id="af3d-auto" checked> auto-rotate</label></div>
		</div>
		<div class="af-col">
			<div class="af-sub">Matrix M · 4×4 homogeneous</div>
			<div id="af3d-mx" class="af-mxwrap"></div>
			<div id="af3d-presets" class="af-presets"></div>
		</div>
	</div>
	<div class="af-sub" style="margin-top:1rem">Live equation for the tracked corner</div>
	<div id="af3d-eq" class="af-eq"></div>
	<pre id="af3d-eqm" class="af-eqm"></pre>
	<div id="af3d-status" class="af-status"></div>
	<div id="af3d-checks" class="af-checks"></div>
</div>

## The first non-affine move: the fold

<div class="md">
Every map so far is **one-to-one**: each output has exactly one input. Nothing gets glued. Such maps are called **homeomorphisms** — continuous, invertible, continuous inverse. Their unbreakable rule:

> A homeomorphism cannot change the topology of space. Lines stay lines, holes stay holes, links stay linked.

The simplest map that breaks this rule is the **fold**:

$$
f(\mathbf{p}) = \mathbf{p} - \lambda \cdot \mathrm{ReLU}(\hat{\mathbf{n}} \cdot \mathbf{p} - c) \cdot \hat{\mathbf{n}}
$$

The crease is the hyperplane $\hat{\mathbf{n}} \cdot \mathbf{p} = c$. Points on the near side ($\hat{\mathbf{n}} \cdot \mathbf{p} \le c$) are untouched. Points on the far side are pushed a distance $\lambda$ times their distance from the crease. One knob $\lambda$:

- $\lambda = 0$ — identity (still affine)
- $0 < \lambda < 1$ — bent, still one-to-one
- $\lambda = 1$ — far half flattened *onto* the crease (maximum overlap)
- $\lambda = 2$ — mirror in the crease (a paper fold)
- $\lambda > 2$ — overshoot; far side passes through near side

**The ReLU is a fold.** $\max(0, x) = x - \mathrm{ReLU}(-x)$ is the 1-D fold with $\lambda = 1$. A rectifier layer is a stack of these — one per neuron. That is the starting point of the <a href="origami">Origami</a> chapter.

**The pieces are still affine.** On each side of the crease the map is a plain matrix. The fold is a *piecewise*-affine map — two affine matrices glued along a crease.
</div>

## Lab 3 — The 2D fold machine

<div class="md">
The same 0/1 checkerboard. But a fold *cannot be inverted* — a pixel in the image has zero or two preimages — so we draw the board **forward** (push source cells to where they land). The far half is tinted so you can see the overlap.

**Try:** slide $\lambda$ from 0 to 2.5. Below 1: bent but one-to-one. At 1: flattened. At 2: perfect paper fold. Hover the warped board — in the overlap region the machine finds *two* preimages and marks both on the source. The straight test line crosses the crease and arrives as two straight pieces with a corner: no single affine map can do that.

The 3D view shows the same image as bent paper: the far half rotated about the crease by $\varphi = \arccos(1-\lambda)$. Its flat shadow is exactly the 2D image.
</div>

<div class="af-card" id="fold-2d">
	<div class="af-title"><span class="dot"></span>Fold 2D — checkerboard through a crease</div>
	<div class="af-grid">
		<div class="af-col">
			<div class="af-sub">Source · click to move p</div>
			<canvas id="fd2d-src" class="af-canvas" width="440" height="440"></canvas>
		</div>
		<div class="af-col">
			<div class="af-sub">Image · hover to count preimages</div>
			<canvas id="fd2d-out" class="af-canvas" width="440" height="440"></canvas>
			<div id="fd2d-hover" class="af-read"></div>
		</div>
	</div>
	<div class="af-sub" style="margin-top:1rem">3D · the fold as bent paper — the far half rotates about the crease by φ = arccos(1−λ); its flat shadow is the 2D image above · drag to rotate</div>
	<canvas id="fd3d-canvas" class="af-canvas d3" width="900" height="320"></canvas>
	<div class="af-grid" style="margin-top:1rem">
		<div class="af-col">
			<div class="af-sub">The two affine pieces</div>
			<div style="display:flex;gap:1.4rem;flex-wrap:wrap">
				<div>
					<div class="af-sub" style="margin-top:0">Piece 1 · n̂·p ≤ c (identity)</div>
					<div id="fd2d-m1" class="af-matview"></div>
				</div>
				<div>
					<div class="af-sub" style="margin-top:0">Piece 2 · n̂·p > c (the push)</div>
					<div id="fd2d-m2" class="af-matview"></div>
				</div>
			</div>
			<div class="af-sliders">
				<div class="af-row"><label class="af-lbl">Crease angle θ <input type="range" id="fd2d-theta" class="af-range" min="0" max="180" step="1" value="0"><span class="af-rv" id="fd2d-theta-v">0°</span></label></div>
				<div class="af-row"><label class="af-lbl">Crease offset c <input type="range" id="fd2d-c" class="af-range" min="-1" max="2" step="0.05" value="0.5"><span class="af-rv" id="fd2d-c-v">0.50</span></label></div>
				<div class="af-row"><label class="af-lbl">Fold strength λ <input type="range" id="fd2d-lambda" class="af-range" min="0" max="2.5" step="0.05" value="1.5"><span class="af-rv" id="fd2d-lambda-v">1.50</span></label></div>
			</div>
			<div id="fd2d-presets" class="af-presets"></div>
		</div>
		<div class="af-col">
			<div class="af-sub">Live equation for the tracked point</div>
			<div id="fd2d-eq" class="af-eq"></div>
			<pre id="fd2d-eqm" class="af-eqm"></pre>
			<div class="af-sub" style="margin-top:.9rem">The same fold, 1D: x ↦ x − λ·ReLU(x − c₁)</div>
			<canvas id="fd1d-canvas" class="af-canvas" width="440" height="150" style="cursor:default"></canvas>
		</div>
	</div>
	<div id="fd2d-status" class="af-status"></div>
	<div id="fd2d-checks" class="af-checks"></div>
</div>

## The move no homeomorphism can do: unthreading a chain

<div class="md">
Two rings threaded like a chain link — the **Hopf link**. The only legal way to move one link into another is an **ambient isotopy**: the whole space deformed continuously, one-to-one at every instant. Two configurations connected by such a motion are the *same* link.

The certificate that says the Hopf link *cannot* be unthreaded is a single integer, the **linking number**:

$$
\mathrm{Lk}(A,B) = \frac{1}{4\pi}\oint_A\oint_B \frac{(\mathbf{p}-\mathbf{q})\cdot(d\mathbf{p}\times d\mathbf{q})}{|\mathbf{p}-\mathbf{q}|^3}
$$

For the Hopf link it is $\pm 1$; for two unlinked circles it is $0$. Every homeomorphism preserves it — so *no* affine, projective, or Möbius motion can drop it from $1$ to $0$.

**The tie-in with rectifier networks.** In this book's language: every layer's affine part is a homeomorphism (when invertible), so it cannot change topological content — it cannot unthread anything by itself. The ReLU *fold* is the one non-homeomorphic step: at $\lambda>1$ it overlaps space, and only then can the linking number fall. This is exactly the mechanism the Origami view formalises — Keup & Helias's central claim is that networks **fold the data manifold into unoccupied higher dimensions** to expose an inner class to the outside \cite[Keup & Helias, 2022]{keup2022origami}, and the picture that opens this chapter (`higher_dim.png`) is its 2-D cartoon: lift into a fresh dimension → apply a hyperplane.

**Two steps, one recipe.** Fold to change the topology (the single controlled cut), then move affinely to separate (the free part). The lab below runs both steps live and reads out Lk after every change.
</div>

<div class="af-card" id="unlink-3d">
	<div class="af-title"><span class="dot"></span>Unlink 3D — two chained rings through a fold</div>
	<div class="af-grid wide">
		<div class="af-col">
			<canvas id="u3d-canvas" class="af-canvas d3" width="560" height="440"></canvas>
			<div class="af-row">
				<label class="af-lbl"><input type="checkbox" id="u3d-auto" checked> auto-rotate</label>
				<label class="af-lbl"><input type="checkbox" id="u3d-cores" checked> core circles</label>
			</div>
		</div>
		<div class="af-col">
			<div class="af-sub">The fold  f(p) = p − λ·ReLU(n̂·p − c)·n̂</div>
			<div class="af-sliders">
				<div class="af-row"><label class="af-lbl">Tilt of crease plane <input type="range" id="u3d-tilt" class="af-range" min="0" max="180" step="1" value="0"><span class="af-rv" id="u3d-tilt-v">0°</span></label></div>
				<div class="af-row"><label class="af-lbl">Spin of crease plane <input type="range" id="u3d-spin" class="af-range" min="0" max="360" step="1" value="0"><span class="af-rv" id="u3d-spin-v">0°</span></label></div>
				<div class="af-row"><label class="af-lbl">Crease offset c <input type="range" id="u3d-c" class="af-range" min="-1.5" max="1.5" step="0.05" value="0"><span class="af-rv" id="u3d-c-v">0.00</span></label></div>
				<div class="af-row"><label class="af-lbl">Fold strength λ <input type="range" id="u3d-lambda" class="af-range" min="0" max="2.5" step="0.05" value="0"><span class="af-rv" id="u3d-lambda-v">0.00</span></label></div>
				<div class="af-row"><label class="af-lbl">Separation <input type="range" id="u3d-sep" class="af-range" min="0" max="1.2" step="0.05" value="0"><span class="af-rv" id="u3d-sep-v">0.00</span></label></div>
			</div>
			<div id="u3d-presets" class="af-presets"></div>
			<button type="button" id="u3d-sepbtn" class="af-btn" style="margin-top:.6rem">separate the rings</button>
		</div>
	</div>
	<div class="af-sub" style="margin-top:1rem">Live readout — the linking number, Gauss's integral over the two core circles</div>
	<div id="u3d-eq" class="af-eq"></div>
	<pre id="u3d-eqm" class="af-eqm"></pre>
	<div id="u3d-status" class="af-status"></div>
	<div id="u3d-checks" class="af-checks"></div>
</div>

## Where these maps show up (spoiler: everywhere)

<div class="md">
- **Every linear layer is affine.** $y = Wx + b$ *is* $f(x) = Mx + t$. Delete the nonlinearities and a whole network collapses into a single affine map (composition closes). That collapse is *why* activation functions exist.
- **Every ReLU layer is a stack of folds.** One crease per neuron. The Origami view is the natural geometry of what a rectifier network *is*.
- **Transformers are affine machines with attention on top.** Q, K, V, and output projections are $Wx + b$; attention routes between them.
- **Data augmentation** teaches models what the affine group leaves *invariant* (rotations, crops, flips are affine).
- **Camera + robotics + graphics** live in $4\times 4$ homogeneous matrices; document scanners + AR live in $3\times 3$ homographies (the projective cousin).
- **Interpretability probes** (logit lens, tuned lens) are literally learned affine maps from a hidden state to the output.
</div>

<div class="af-callout md">
**One line.** An affine map is the most general motion that keeps lines straight ($f(x) = Mx + t$); homogeneous coordinates turn its composition into ordinary matrix multiplication, which is why the same $3\times 3$ / $4\times 4$ arithmetic runs image warps, graphics, camera math, and every biased linear layer. The determinant reads off how much area/volume survives; the last row decides whether you are still affine at all. And the first non-affine move — the fold $p \mapsto p - \lambda\,\mathrm{ReLU}(\hat n \cdot p - c)\,\hat n$ — is exactly a ReLU: bent for $\lambda>0$, overlapping space for $\lambda>1$, and the only move in this chapter that can drop a linking number. Fold to change topology, move affinely to separate — the two-step recipe every rectifier classifier uses.
</div>

<script>
if (typeof loadMathIVModule === 'undefined') {
	async function loadMathIVModule() { updateLoadingStatus("Loading Math IV…"); return Promise.resolve(); }
}
</script>
