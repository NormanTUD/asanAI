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
.af-read{margin-top:.55rem;font:.78rem/1.5 var(--mn-font-mono,monospace);color:var(--mn-text-secondary);background:var(--mn-bg-subtle);border-radius:8px;padding:.6rem .75rem;min-height:2.4em;overflow-wrap:anywhere;border-left:2px solid var(--mn-accent)}
#fd2d-hover{min-height:4.5em}
#fd2d-src,#fd3d-canvas{width:100%;height:auto;aspect-ratio:1/1}
.af-row{display:flex;gap:.7rem;align-items:center;flex-wrap:wrap;margin-top:.55rem}
.af-lbl{font-size:.82rem;color:var(--mn-text-secondary);display:inline-flex;align-items:center;gap:.45rem}
.af-sel{padding:.32rem .55rem;background:var(--mn-surface-raised);color:var(--mn-text);border:1px solid var(--mn-border);border-radius:6px;font-size:.85rem}
.af-mxwrap{display:flex;flex-direction:column;gap:.45rem;padding:.7rem;background:var(--mn-bg-subtle);border-radius:10px;border:1px solid var(--mn-border);width:100%;box-sizing:border-box}
.af-mxrow{display:flex;gap:.45rem;flex-wrap:nowrap}
.af-mx{flex:1 1 0;min-width:0;padding:.38rem .45rem;font:.85rem var(--mn-font-mono,monospace);background:var(--mn-surface-raised);color:var(--mn-text);border:1px solid var(--mn-border);border-radius:6px;transition:border-color .15s,box-shadow .15s}
.af-mx:focus{outline:none;border-color:var(--mn-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--mn-accent) 20%,transparent)}
.af-mx.bad{border-color:var(--mn-rose);box-shadow:0 0 0 2px color-mix(in srgb,var(--mn-rose) 25%,transparent)}
.af-presets{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.65rem}
.af-btn{padding:.32rem .8rem;border:1px solid var(--mn-border);border-radius:99px;font-size:.78rem;color:var(--mn-accent);background:transparent;cursor:pointer;transition:all .15s}
.af-btn:hover{background:color-mix(in srgb,var(--mn-accent) 12%,transparent);border-color:var(--mn-accent)}
.af-eq{background:var(--mn-bg-subtle);border-radius:8px;padding:.65rem .85rem;overflow-x:auto;border-left:3px solid var(--mn-accent)}
.af-status{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.85rem}
.af-pill{padding:.3rem .75rem;border:1px solid var(--mn-border);border-radius:99px;font-size:.78rem;color:var(--mn-text-secondary);background:var(--mn-bg-subtle)}
.af-pill.warn{color:#b45309;border-color:#b45309;background:color-mix(in srgb,#b45309 8%,transparent)}
.af-pill.bad{color:var(--mn-rose);border-color:var(--mn-rose);background:color-mix(in srgb,var(--mn-rose) 8%,transparent)}
.af-pill.good{color:var(--mn-emerald);border-color:var(--mn-emerald);background:color-mix(in srgb,var(--mn-emerald) 8%,transparent)}
.af-callout{border-left:3px solid var(--mn-accent);background:linear-gradient(90deg,color-mix(in srgb,var(--mn-accent) 8%,transparent),transparent);padding:.9rem 1.1rem;border-radius:0 10px 10px 0;margin:1.1rem 0}
.af-err{margin-top:.8rem;padding:.7rem .9rem;border:1px solid var(--mn-rose);border-radius:8px;color:var(--mn-rose);font-size:.85rem;background:color-mix(in srgb,var(--mn-rose) 5%,transparent)}
.af-range{width:150px;accent-color:var(--mn-accent)}
.af-rv{font:.78rem var(--mn-font-mono,monospace);color:var(--mn-accent);min-width:3.6em;display:inline-block;text-align:right}
.af-sliders>.af-row{gap:.4rem}
.af-hint{font-size:.68rem;font-weight:400;letter-spacing:0;text-transform:none;opacity:.75}
.af-recipe{margin:.35rem 0 0;padding-left:1.15rem;font-size:.8rem;line-height:1.55;color:var(--mn-text-secondary)}
@media(max-width:820px){.af-grid,.af-grid.wide{grid-template-columns:1fr}}
</style>

<div class="md">
**The one-paragraph story.** Every "movement" of data — a linear layer $y = Wx + b$, an image warp, a camera transform — is a *map of space*. This chapter catalogs the simplest such maps (**affine**: linear + translation), then introduces the first non-affine move (**the fold**), which is exactly what a ReLU neuron does. The payoff comes at the end: two rings chained like a chain link (the **Hopf link**) that *no* affine motion can pull apart — but one fold, into a higher dimension, unthreads them. That is the geometry every classifier lives by.
</div>

<div class="md">
## Affine maps

### Linear maps aren't enough

In <a href="math_ii">Math II</a> you met **linear maps** $f(\mathbf{x}) = M\mathbf{x}$. They rotate, scale, shear, mirror — but they must send the origin to itself: $f(\mathbf{0}) = \mathbf{0}$. The origin is glued in place.

Most useful "movements" of data need to move the origin too. The fix is the **affine transformation**:

$$
f(\mathbf{x}) = M\mathbf{x} + \mathbf{t}
$$

You've met it before: your first neuron $\hat{y} = ax + b$ (<a href="minimalneuron">Neuron</a>) is a 1-D affine map. Every linear layer $y = Wx + b$ is affine in high dimensions. This chapter makes that a full geometry.
</div>

<div class="md">
### What affine maps preserve (and what they don't)

An affine map is the most general map that sends **straight lines to straight lines**. Precisely: it preserves lines, parallelism, and the ratios in which a point divides a segment. It generally breaks lengths, angles, areas, and turns circles into ellipses.

Three facts we'll lean on repeatedly:

- **Composition closes.** $f \circ g$ is affine again: $(M_f M_g)\mathbf{x} + (M_f\mathbf{t}_g + \mathbf{t}_f)$. Chain a hundred affine maps — still one affine map.
- **Three points determine it.** Since lines and ratios are preserved, telling an affine map where three non-collinear points go fixes it everywhere.
- **The determinant $|\det M|$ is the volume scale.** $=1$ preserves area/volume; $>1$ expands; $<1$ compresses; $<0$ mirrors; $=0$ collapses a dimension.
</div>

<div class="optional md" data-headline="History: where the word comes from">
**Descartes** made points into coordinates (1637) \cite[Descartes, 1637]{descartesgeometrie}. **Grassmann**'s *Ausdehnungslehre* (1844) and **Möbius**' barycentric work then split a point into a fixed origin plus a free direction — exactly the $M\mathbf{x} + \mathbf{t}$ form \cite{mobiusband}. **Riemann's** 1854 habilitation sorted geometry into a ladder — **affine ⊂ similarity ⊂ Euclidean** \cite[Riemann, 1854]{riemann1854raum} — each rung defined by what its transformations preserve; the affine rung measures *nothing* (no distances, no angles) and keeps exactly lines, parallelism, and ratios \cite{affine_geometry_wiki}. The word *affine* is Latin *affinis* ("related, connected"); it entered mathematics via **Euler** (1748) \cite[Euler, 1748]{euler1748introductio}, and **Klein's** 1948 survey credits the name "affine transformation" to Möbius and Gauss \cite[Klein, 1948]{klein1948geometry}. Affine maps *keep things related* — collinearity, parallelism, ratios — even when they break lengths and angles.
</div>

<div class="md">
### Homogeneous coordinates: the trick that makes it a matrix

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
Unpinning the last row gives $\mathbf{x}' = H\mathbf{x} / (H\mathbf{x})_{n+1}$ — a **projective transformation** \cite{projective_transformation_wiki}. In 2D, an $H \in \mathbb{R}^{3\times 3}$ is a **homography** \cite{homography_cv_wiki} with 8 degrees of freedom (vs affine's 6); the extra two are the "what happens at infinity" freedom. This is what makes vanishing points appear — the same object Renaissance painters used for linear perspective \cite{albertidepictura}, the mathematics of **Desargues**' *Brouillon* (1639) \cite{desarguesbrouillon} and of **Poncelet**'s founding treatise (1822) \cite[projective geometry]{projective_geometry_wiki}\cite[Poncelet, 1822]{poncelet1822traite}.

A separate non-affine family is the **Möbius maps** $z \mapsto (az+b)/(cz+d)$ \cite{mobius_transformation_wiki} on the complex plane: they preserve *angles* (conformal) and send circles/lines to circles/lines. **Riemann** spent his later life on exactly this family — conformal maps of the Riemann sphere \cite{riemann1854raum}. Three families, sorted by what they preserve:

| Family | Preserves | 2D dof |
|---|---|---|
| Affine | lines, parallelism, ratios | 6 |
| Projective | lines only | 8 |
| Möbius | angles, circles/lines | 6 (real) |
</div>

<div class="md">
### The image is a matrix

Take the simplest picture worth looking at: an **8×8 checkerboard**. It *is* an $8\times 8$ matrix of 0s and 1s:

$$
I_{ij} = (i+j) \bmod 2
$$

A checkerboard hides no texture, so every distortion shows: a shear leans the squares, a non-uniform scale turns them into rectangles, a rotation tilts them all.

To warp an image by an affine map: for every output pixel $\mathbf{q}$, ask *which source pixel lands here?* The answer is $\mathbf{p} = A^{-1}\mathbf{q}$. This is **inverse mapping**: every output pixel gets exactly one value. (Forward mapping — pushing source pixels out — leaves holes.) When $\mathbf{p}$ falls between pixels: **nearest neighbour** (crisp 0/1) or **bilinear** (smooth 0-to-1 blend along seams).
</div>

<div class="md">
## Hands-on: the affine machine

### The 2D affine machine

Edit any entry of the $3\times 3$ matrix. Click the source to move the tracked point $p$. Hover the warped image — each pixel is a lookup $I(M^{-1}\mathbf{q})$ in the 0/1 grid.

**Try:** *Rotate 90° @ center* — the board maps to itself, but every square flips color. *Scale ×2* — the area pill reads ×4 ($2\times 2$). Edit the bottom row and cross into projective territory: parallel lines curve toward a vanishing point.
</div>

<div class="af-card" id="af-2d">
	<div class="af-title"><span class="dot"></span>2D — checkerboard through a 3×3 matrix</div>
	<div class="af-grid">
		<div class="af-col">
			<div class="af-sub">Source · click to move p</div>
			<canvas id="af2d-src" class="af-canvas" width="440" height="440"></canvas>
		</div>
		<div class="af-col">
			<div id="af2d-presets" class="af-presets" style="margin-top:0"></div>
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
		</div>
		<div class="af-col">
			<div class="af-sub">Live equation for the tracked point</div>
			<div id="af2d-eq" class="af-eq"></div>
		</div>
	</div>
	<div id="af2d-status" class="af-status"></div>
</div>

<div class="md">
### The 3D affine machine

Same story, one dimension up: $4\times 4$ matrices, the determinant scales *volume*. A cube stays a parallelepiped — corners to corners, edges to edges, each face a parallelogram. The ghost cube shows where things started; the dotted line follows the tracked corner from $p$ to $M\cdot p$. Click any corner to track it.
</div>

<div class="af-card" id="af-3d">
	<div class="af-title"><span class="dot"></span>3D — checkerboard cube through a 4×4 matrix</div>
	<div class="af-grid wide">
		<div class="af-col">
			<canvas id="af3d-canvas" class="af-canvas d3" width="560" height="440"></canvas>
			<div class="af-row"><label class="af-lbl"><input type="checkbox" id="af3d-auto"> auto-rotate</label></div>
		</div>
		<div class="af-col">
			<div class="af-sub">Matrix M · 4×4 homogeneous</div>
			<div id="af3d-mx" class="af-mxwrap"></div>
			<div id="af3d-presets" class="af-presets"></div>
		</div>
	</div>
	<div class="af-sub" style="margin-top:1rem">Live equation for the tracked corner</div>
	<div id="af3d-eq" class="af-eq"></div>
	<div id="af3d-status" class="af-status"></div>
</div>

<div class="md">
## The fold

### The first non-affine move

Every map so far is **one-to-one**: each output has exactly one input. Nothing gets glued. Such maps are called **homeomorphisms** — continuous, invertible, continuous inverse \cite[nLab, homeomorphism]{nlab_homeomorphism}; by **Brouwer's invariance of domain** (~1910), any continuous one-to-one map of $\mathbb{R}^n$ onto its image is one, so this is the largest such family \cite[nLab, invariance of domain]{nlab_invariance_of_domain}. Their unbreakable rule:

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

<div class="md">
### The 2D fold machine

The same 0/1 checkerboard. But a fold *cannot be inverted* — a point in the image has zero or two preimages. The right panel shows the fold as **bent paper**: the near half stays flat, the far half rotated up about the crease by $\varphi = \arccos(1-\lambda)$.

**Try:** slide $\lambda$ from 0 to 2.5. Below 1: bent but one-to-one. At 1: flattened. At 2: perfect paper fold. **Hover the bent paper** — in the overlap region the machine finds *two* preimages and marks both on the source at left; **hover the source** to trace where a point lands on the paper. The straight test line crosses the crease and arrives as two straight pieces with a corner: no single affine map can do that.

The bent paper's flat shadow (its projection onto the crease plane) is exactly the 2-D image of the fold — the same picture a forward draw of the checkerboard would give.
</div>

<div class="af-card" id="fold-2d">
	<div class="af-title"><span class="dot"></span>Fold — checkerboard through a crease</div>
	<div class="af-sliders">
		<div class="af-row"><label class="af-lbl">Crease angle θ <input type="range" id="fd2d-theta" class="af-range" min="0" max="180" step="1" value="0"><span class="af-rv" id="fd2d-theta-v">0°</span></label></div>
		<div class="af-row"><label class="af-lbl">Crease offset c <input type="range" id="fd2d-c" class="af-range" min="-1" max="2" step="0.05" value="0.5"><span class="af-rv" id="fd2d-c-v">0.50</span></label></div>
		<div class="af-row"><label class="af-lbl">Fold strength λ <input type="range" id="fd2d-lambda" class="af-range" min="0" max="2.5" step="0.05" value="1.5"><span class="af-rv" id="fd2d-lambda-v">1.50</span></label></div>
	</div>
	<div class="af-grid">
		<div class="af-col">
			<div class="af-sub">Source · click to move p · hover to trace</div>
			<canvas id="fd2d-src" class="af-canvas" width="440" height="440"></canvas>
		</div>
		<div class="af-col">
			<div class="af-sub">3D · hover the paper to count preimages · drag to rotate · scroll to zoom</div>
			<canvas id="fd3d-canvas" class="af-canvas d3" width="440" height="440"></canvas>
			<div id="fd2d-hover" class="af-read"></div>
		</div>
	</div>
	<div class="af-grid" style="margin-top:1rem">
		<div class="af-col">
			<div class="af-sub">The two affine pieces</div>
			<div style="display:flex;gap:1.4rem;flex-wrap:wrap;align-items:flex-start">
				<div>
					<div class="af-sub" style="margin-top:0">Piece 1 · n̂·p ≤ c (identity)</div>
					<div id="fd2d-m1"></div>
				</div>
				<div>
					<div class="af-sub" style="margin-top:0">Piece 2 · n̂·p > c (the push)</div>
					<div id="fd2d-m2"></div>
				</div>
			</div>
			<div id="fd2d-presets" class="af-presets"></div>
		</div>
		<div class="af-col">
			<div class="af-sub">Live equation for the tracked point</div>
			<div id="fd2d-eq" class="af-eq"></div>
			<div class="af-sub" style="margin-top:.9rem">The same fold, 1D: x ↦ x − λ·ReLU(x − c₁)</div>
			<canvas id="fd1d-canvas" class="af-canvas" width="440" height="150" style="cursor:default"></canvas>
		</div>
	</div>
</div>

<div class="md">
## Unthreading a chain

### The move no homeomorphism can do

Two rings threaded like a chain link — the **Hopf link** \cite[nLab, Hopf link]{nlab_hopf_link}\cite[Wikipedia, Hopf link]{hopf_link_wiki}. A **knot** is one closed loop; a **link** is several \cite[nLab, knot]{nlab_knot}\cite[nLab, link]{nlab_link}. The only legal way to move one link into another is an **ambient isotopy**: the whole space deformed continuously, one-to-one at every instant \cite[nLab, isotopy]{nlab_isotopy}. Two configurations connected by such a motion are the *same* link; the trivial state — two loops that are not linked — is the **unlink** \cite[nLab, unknot]{nlab_unknot}.

The certificate that says the Hopf link *cannot* be unthreaded is a single integer, the **linking number** \cite[nLab, linking number]{nlab_linking_number}:

$$
\mathrm{Lk}(A,B) = \frac{1}{4\pi}\oint_A\oint_B \frac{(\mathbf{p}-\mathbf{q})\cdot(d\mathbf{p}\times d\mathbf{q})}{|\mathbf{p}-\mathbf{q}|^3}
$$

For the Hopf link it is $\pm 1$; for two unlinked circles it is $0$. The formula above is **Gauss's integral** over the two curves \cite[Wikipedia, linking number (Gauss integral)]{linking_number_wiki} — the lab below runs it live. Every homeomorphism preserves the number (it is a topological invariant \cite[nLab, topological property]{nlab_topological_property}\cite[Wikipedia, homeomorphism]{homeomorphism_wiki}), so *no* affine, projective, or Möbius motion can drop it from $1$ to $0$.

**The tie-in with rectifier networks.** In this book's language: every layer's affine part is a homeomorphism (when invertible) \cite[nLab, invariance of domain]{nlab_invariance_of_domain}, so it cannot change topological content — it cannot unthread anything by itself. The ReLU *fold* is the one non-homeomorphic step: at $\lambda>1$ it overlaps space, and only then can the linking number fall. Four papers make each piece precise:

- **Montúfar, Pascanu, Cho & Bengio** — the piecewise-linear regions of a rectifier net tile the input space, and their count grows exponentially with depth \cite[Montúfar et al., 2014]{montufar2014regions}.
- **Keup & Helias** — to make tangled classes separable, a network **folds the data manifold into unoccupied higher dimensions** until a flat cut reaches the "island" class another class surrounds \cite[Keup & Helias, 2022]{keup2022origami}; their 2-D test case — a ring inside a ring — is the flat cousin of the chained rings above.
- **Amrami & Goldberg** — problems that need exponentially many parameters at any fixed depth are solved with zero error by a net of *linear* depth and width $\le 4$, via an explicit space-folding construction \cite[Amrami & Goldberg, 2021]{amrami2021depth}.
- **Lewandowski et al.** — a straight input line arrives in activation space as a non-convex path (each crease loses convexity), and their space-folding measure grows with depth in well-trained nets \cite[Lewandowski et al., 2025]{lewandowski2025spacefolds}.

Four papers, one object: the piecewise-affine map that creases and overlaps space. The <a href="origami">Origami</a> chapter is the full treatment; this chapter hands you the geometry to play with.

**Two steps, one recipe.** Fold to change the topology (the single controlled cut), then move affinely to separate (the free part). The lab below runs both steps live and reads out Lk after every change.
</div>

<div class="af-card" id="unlink-3d">
	<div class="af-title"><span class="dot"></span>Unlink 3D — two chained rings through a fold</div>
	<div class="af-grid wide">
		<div class="af-col">
			<canvas id="u3d-canvas" class="af-canvas d3" width="560" height="440"></canvas>
			<div class="af-row">
				<label class="af-lbl"><input type="checkbox" id="u3d-auto"> auto-rotate</label>
				<label class="af-lbl"><input type="checkbox" id="u3d-cores" checked> core circles</label>
			</div>
		</div>
		<div class="af-col">
			<div class="af-sub">The fold  f(p) = p − λ·ReLU(n̂·p − c)·n̂</div>
			<div class="af-sliders">
				<div class="af-row"><label class="af-lbl">Tilt of crease plane <span class="af-hint">how far n̂ tips from vertical</span> <input type="range" id="u3d-tilt" class="af-range" min="0" max="180" step="1" value="0"><span class="af-rv" id="u3d-tilt-v">0°</span></label></div>
				<div class="af-row"><label class="af-lbl">Spin of crease plane <span class="af-hint">rotates n̂ around the vertical axis</span> <input type="range" id="u3d-spin" class="af-range" min="0" max="360" step="1" value="0"><span class="af-rv" id="u3d-spin-v">0°</span></label></div>
				<div class="af-row"><label class="af-lbl">Crease offset c <span class="af-hint">plane position: n̂·p = c</span> <input type="range" id="u3d-c" class="af-range" min="-1.5" max="1.5" step="0.05" value="0"><span class="af-rv" id="u3d-c-v">0.00</span></label></div>
				<div class="af-row"><label class="af-lbl">Fold strength λ <span class="af-hint">push = λ × distance past the crease</span> <input type="range" id="u3d-lambda" class="af-range" min="0" max="2.5" step="0.05" value="0"><span class="af-rv" id="u3d-lambda-v">0.00</span></label></div>
				<div class="af-row"><label class="af-lbl">Separation <span class="af-hint">slide the two rings apart along x</span> <input type="range" id="u3d-sep" class="af-range" min="0" max="1.2" step="0.05" value="0"><span class="af-rv" id="u3d-sep-v">0.00</span></label></div>
			</div>
			<div id="u3d-presets" class="af-presets"></div>
			<button type="button" id="u3d-sepbtn" class="af-btn" style="margin-top:.6rem">separate the rings</button>
			<div class="af-sub">How to unthread</div>
			<ol class="af-recipe">
				<li>Tilt the crease until the plane slices the red ring A (≈ 70–90°).</li>
				<li>Push λ past 1 — ring A is folded through ring B and Lk drops from 1 to 0.</li>
				<li>Hit <b>separate the rings</b> — the chain is apart for good.</li>
			</ol>
		</div>
	</div>
	<div class="af-sub" style="margin-top:1rem">Live readout — the linking number, Gauss's integral over the two core circles</div>
	<div id="u3d-eq" class="af-eq"></div>
	<div id="u3d-status" class="af-status"></div>
</div>

<div class="optional md" data-headline="Who found all this, and why">
* **Knots.** The first systematic study of knotted loops is **Listing's** *Vorstudien zur Topologie* (1847) — the same book that coined the word "topology" \cite[Listing, 1847]{listingtopologie}. **Poincaré's** *Analysis Situs* (1895) turned knots into a theory of the space *around* the loop, not of the loop itself \cite[Poincaré, 1895]{poincareanalysissitus}.
* **The linking number.** Gauss expressed the linking of two closed curves as a single integral — the formula the unlink machine runs \cite[Wikipedia, linking number]{linking_number_wiki}. The two-ring link was studied by **Hopf** in 1931, while working on what is now the Hopf fibration; Gauss knew it earlier, and a Japanese Buddhist sect (Buzan-ha) had used the motif as a crest centuries before \cite[Wikipedia, Hopf link]{hopf_link_wiki}.
* **Invariance of domain.** Brouwer's theorem (~1910) that a continuous one-to-one map of $\mathbb{R}^n$ onto its image is a homeomorphism settled the open question "is dimension a topological invariant?" \cite[nLab, invariance of domain]{nlab_invariance_of_domain}.
* **Folding as a map.** Paper-folding mathematics proves that any straight-sided shape can be cut from one sheet with a single straight cut after folding \cite[Wikipedia, fold-and-cut theorem]{foldandcut_wiki}. The neural-network side of the same idea: linear regions (Montúfar et al. 2014 \cite{montufar2014regions}), folding as the separability tool (Keup & Helias 2022 \cite{keup2022origami}), depth via folding (Amrami & Goldberg 2021 \cite{amrami2021depth}), and a quantitative folding measure (Lewandowski et al. 2025 \cite{lewandowski2025spacefolds}).
</div>

<div class="md">
## Where these maps show up (spoiler: everywhere)

- **Every linear layer is affine.** $y = Wx + b$ *is* $f(x) = Mx + t$. Delete the nonlinearities and a whole network collapses into a single affine map (composition closes). That collapse is *why* activation functions exist, as the <a href="minimalneuron">Neuron</a> and <a href="origami">Origami</a> chapters argue from the other side.
- **Every ReLU layer is a stack of folds.** One crease per neuron. The Origami view is the natural geometry of what a rectifier network *is*.
- **Transformers are affine machines with attention on top.** Query, key, value, and output projections are all $Wx + b$ \cite[Vaswani et al., 2017]{vaswani2017attention}; attention is a learned, input-dependent weighted average on top — the affine parts do the coordinate changes, the attention does the routing.
- **Data augmentation** teaches models what the affine group leaves *invariant* (rotations, crops, flips are affine).
- **Camera + robotics + graphics** live in $4\times 4$ homogeneous matrices; document scanners + AR live in $3\times 3$ homographies (the projective cousin).
- **Interpretability probes** (logit lens, tuned lens) are literally learned affine maps from a hidden state to the output (see the <a href="fact_lookup">Fact Lookup</a> and <a href="mechanistic_interpretability">Mechanistic Interpretability</a> chapters).
</div>

<div class="af-callout md">
**In one glance.**

- **Affine = lines stay lines.** $f(x) = Mx + t$ is the most general motion that does that.
- **The trick:** append a $1$, and composing affine maps is just multiplying the $3\times 3$ / $4\times 4$ matrices — the arithmetic behind image warps, graphics, cameras, and every linear layer.
- **Two dials to read:** $|\det M|$ says how much area/volume survives; the last row says whether you are still affine at all.
- **The first non-affine move is a fold** — exactly a ReLU: bent for $\lambda>0$, overlapping for $\lambda>1$, and the only move that can unthread a chain. Fold, then move affinely.
</div>

<script>
if (typeof loadMathIVModule === 'undefined') {
	async function loadMathIVModule() { updateLoadingStatus("Loading Math IV…"); return Promise.resolve(); }
}
</script>
