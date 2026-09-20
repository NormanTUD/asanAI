<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Shape of the Machine — A Working Geometry for AI
description: The working geometric toolkit behind every network — projection, singular values, descent, convolution, and symmetry — each operation drawn as a picture of space, and tied to the layer that uses it.
icon: &#129517;
part: 1
order: 7
color: accent
topics: geometry, math-ii, math-iii, architecture
tags: math-heavy
-->

<div class="md">
## One picture for the whole chapter

The [Shape of Space](geometry_i) chapter asked what *space* is. This chapter asks what a neural network *does* to the numbers that live in space, and draws each operation as a picture. The claim: **nearly every layer in a modern network is a single geometric move**. Once you can see the move, you can predict what the layer is for, where it can fail, and what it costs.

The moves, in order:

* **The inner product** — a dot product is a *measurement of alignment*; its shadow, the Gram matrix, is where “similarity” is stored \cite{scholkopf2002learning}.
* **Projection** — fitting anything is the same move: the best fit is the *shadow* the data throws onto a subspace, and the error is the piece left standing.
* **The singular value decomposition** — every matrix is a rotation, a set of pure stretches, and a rotation again; the stretches *are* the shape of the map \cite{svd_wiki}.
* **Descent** — why the gradient points where it points, and why “steepest” is geometry, not an optimizer’s choice \cite{cauchy1847}.
* **Convolution and the Fourier transform** — a convolution is a dot product that slides across space; the Fourier transform is the change of coordinates that turns that sliding into multiplication \cite{fourier1822} \cite{cooley1965fft}.
* **Symmetry** — invariance and equivariance, why a filter may be *shared*, and the shape of the attention map \cite{zaheer2017deepsets}.

Each section ends with a hands-on plot. We do **not** re-teach what the earlier chapters own — the dot product, attention as a convex combination, optimizers, least squares, or PCA. We link to those instead.
</div>

<div class="md">
## The inner product

Everything in a neural network is a vector, and every layer *does* a measurement of how those vectors line up. That measurement is the **inner product** (dot product). Three signs appear in the formula that follows: **$\langle u, v\rangle$** (angle brackets) is the general inner product — the plain dot product suffices in $\mathbb{R}^n$, where $\mathbb{R}$ denotes the **real numbers** ($\mathbb{R}^2$ is the plane); **$\sum$** (sigma) means “sum”; and **$\lVert v \rVert$** (double bars) is the *length* of a vector. Read the identity as “alignment = (one length) × (the other length) × (closeness to parallel).” The three forms are the same quantity:

$$
\underbrace{\langle \mathbf{u}, \mathbf{v} \rangle}_{\substack{\text{“how aligned are} \\ u \text{ and } v\text{?”}} \;} \;=\; \underbrace{\sum_{i=1}^{n} u_i v_i}_{\text{sum of term-by-term agreements}} \;=\; \underbrace{\lVert \mathbf{u} \rVert \, \lVert \mathbf{v} \rVert \, \cos\theta}_{\text{lengths times their alignment } \theta}
$$

The third form is what matters. The inner product splits into *how long* each vector is and *how close to parallel* they are: same direction is maximum, perpendicular is zero, opposite is minimum. A dot product is a **measure of alignment**.

This fact drives the whole field. A neuron’s weighted sum $w \cdot x + b$ is an inner product plus a shift. Similarity search finds the vector with the largest inner product. Attention is a weighted average whose *weights* are normalized inner products (see [Attention](attentionlab)). Cosine similarity — the inner product with the lengths divided out — powers retrieval \citeauthor{mikolov2013word2vec} (\citeyear{mikolov2013word2vec}).

### The Gram matrix: where similarity lives

Line up $k$ data vectors as the columns of a matrix $X \in \mathbb{R}^{n \times k}$ ($n$ rows, $k$ columns). The superscript $^{\top}$ is the *transpose* — flipping a matrix over its main diagonal. $X^{\top}X$ dots each column of $X$ (one data point) against every other. The result is the **Gram matrix**

$$
G \;=\; \underbrace{X^{\top} X}_{\text{“all pairwise alignments at once”}} \qquad\qquad G_{ij} \;=\; \underbrace{\langle x_i, x_j \rangle}_{\text{“how much do data } i \text{ and } j \text{ agree?”}}
$$

Two things matter. First, $G$ is **always symmetric and positive semi-definite**: the diagonal is $G_{ii} = \lVert x_i \rVert^2 \ge 0$, and for any vector $c$, $c^{\top} G c = \lVert Xc \rVert^2 \ge 0$. (The deep version is Mercer’s theorem \citeyear{mercerno1909}: a positive-definite “kernel” is *exactly* a Gram matrix of features in some space — the reason the “kernel trick” works.)

Second: **$G$ describes the data’s geometry without any coordinates.** It records only *inner products*, which are unchanged by a rigid motion. Rotate every data point by the same rotation $R$ and every pairwise dot product stays the same, so $G$ is **unchanged**:

$$
\underbrace{(RX)^{\top}(RX)}_{\text{the Gram matrix of the rotated data}} \;=\; X^{\top}\underbrace{R^{\top}R}_{\text{a rotation undoes itself }=\, I}\,X \;=\; \underbrace{X^{\top}X}_{\text{the original Gram matrix } G}
$$

Rotate the whole point cloud and nothing in $G$ moves — a coordinate-free description. Even more rigid: the **eigenvalues** of $G$ are invariant under *any* orthogonal change of basis, so they capture the data’s shape independent of coordinates.

That is the seed of the chapter. Everything that follows is a geometric operation on those vectors: **projection** picks out a subspace, the **SVD** diagonalizes the stretch, **descent** walks across a level set, **convolution** is a sliding dot product that commutes with shifts, and **symmetry** is the set of transformations a network respects.
</div>

<div class="md">
## Projection: the best fit is a shadow

Suppose the answer *must* lie in a subspace $S$ — a line, a plane, or the set of all outputs a layer can produce. Given a target point $p$ outside $S$, **which point $s \in S$ is closest to $p$?**

The answer is the **orthogonal projection**. Take any candidate $s \in S$ and split the distance into two pieces:

$$
\underbrace{\lVert p - s \rVert^2}_{\text{squared distance from } p \text{ to your candidate } s} \;=\; \underbrace{\lVert p - p_S \rVert^2}_{\text{distance from } p \text{ to the whole subspace } S} \;+\; \underbrace{\lVert p_S - s \rVert^2}_{\text{extra you add by not picking } p_S}
$$

where $p_S$ is the projection of $p$ onto $S$. The cross term vanishes because $p - p_S$ is *perpendicular to* $S$ while $s - p_S$ lies *in* it. The first term does not depend on $s$; the second is non-negative and zero only when $s = p_S$. So the closest point is **the shadow $p_S$**, and the error $p - p_S$ is the part of $p$ sticking out, perpendicular to $S$.

“The error is perpendicular to the model” is a *working diagnostic*. It is the whole of least squares: a fit is optimal exactly when the residual is orthogonal to every direction the model can move in \cite{legendre1805} \cite{gauss1809} (see [Loss](losslab)). It is the whole of low-rank approximation: truncating to a few directions gives the best shadow of the data in that subspace \cite{svd_wiki} (see [Beyond LLMs](beyond_llms)). And it reads a single neuron: its output $\langle w, x \rangle$ is how much of the input $x$ points along $w$. Attention does the same move in reverse — project each key onto the query for a similarity, then recombine the values (see [Attention](attentionlab)).

The picture is always *a target, a family of allowed answers, keep the shadow.* In the interactive, move the target and tilt the subspace. The residual stays perpendicular — that right angle *is* the proof — and “explained” behaves like a regression’s $R^2$.
</div>

<!-- ─── Interactive: Orthogonal Projection ─── -->
<div style="background:#fff; padding:20px; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); margin:20px 0;">
	<p style="color:#64748b; font-size:0.9em; margin-top:0;">Move the point <b>P</b> (grey dot) and tilt the line (the subspace $S$). The <b>blue</b> arrow is P’s shadow on the line — its projection. The <b>red</b> arrow is the residual. No matter where you put P, the red arrow is always <b>perpendicular</b> to the line: that right angle is the entire proof. “Explained” is the fraction of P’s length the shadow captures — the single-point version of a regression’s $R^2$.</p>
	<div style="margin-bottom:10px; display:flex; gap:18px; flex-wrap:wrap; align-items:center;">
		<label><b>P x:</b></label>
		<input type="range" id="geo2-proj-px" min="-4" max="4" step="0.1" value="3" style="width:120px; vertical-align:middle;">
		<span id="geo2-proj-pxv" style="font-family:monospace; font-weight:bold; color:#2563eb;">3.0</span>
		<label><b>P y:</b></label>
		<input type="range" id="geo2-proj-py" min="-4" max="4" step="0.1" value="2.2" style="width:120px; vertical-align:middle;">
		<span id="geo2-proj-pyv" style="font-family:monospace; font-weight:bold; color:#2563eb;">2.2</span>
		<label><b>line angle φ:</b></label>
		<input type="range" id="geo2-proj-phi" min="0" max="180" step="1" value="35" style="width:140px; vertical-align:middle;">
		<span id="geo2-proj-phiv" style="font-family:monospace; font-weight:bold; color:#2563eb;">35°</span>
	</div>
	<div id="geo2-projection" class="plot-container" style="width:100%; height:380px;"></div>
	<div id="geo2-proj-readout" style="margin-top:8px; font-family:monospace; font-size:0.9em; color:#334155;"></div>
</div>

<div class="md">
## The SVD: the shape of any linear map

A linear map $A:\mathbb{R}^n\to\mathbb{R}^m$ looks like a messy matrix of mixed-up numbers. But in one coordinate system it is simple. The **singular value decomposition** (SVD) says every such $A$ factors as

$$
A \;=\; \underbrace{U}_{\substack{\text{a rotation in} \\ \text{the output space}}} \;\underbrace{\Sigma}_{\substack{\text{pure stretches} \\ \text{along the axes}}} \;\underbrace{V^{\top}}_{\substack{\text{a rotation in} \\ \text{the input space}}}
$$

where $U$ and $V$ are pure rotations (orthogonal: $U^{\top}U = V^{\top}V = I$) and $\Sigma$ is diagonal, its entries $\sigma_1 \ge \sigma_2 \ge \cdots \ge 0$ the **singular values**.

Read the factorisation as a story about a circle:

1. $V^{\top}$ **rotates** the input unit circle so its axes line up with the directions $A$ stretches most and least.
2. $\Sigma$ **stretches** purely along the axes, by $\sigma_1$ and $\sigma_2$ — no rotation, no shear.
3. $U$ **rotates** the result into the output space.

So *every* linear map is **rotate, stretch, rotate**. The circle $\lVert x\rVert = 1$ becomes an **ellipse**, and the singular values are its **semi-axis lengths** \cite{svd_wiki}. The right singular vectors (columns of $V$) are the axes of the circle that get stretched; the left singular vectors (columns of $U$) are where those stretched axes end up.

\marginfig{jacobi.jpg}{Carl Gustav Jacobi (1804–1851). In 1842 he gave the theory of *reducing a quadratic form to its principal axes by successive linear substitutions* \cite{jacobi1842} — the “Jacobi rotations” that, in various descendants, are still the workhorse behind computing eigenvalues and the SVD today.}

Two facts turn the picture into engineering:

* **Rank is the number of non-zero singular values.** If $\sigma_2 = 0$ the ellipse collapses to a line and the map forgets an input dimension — its image is lower-dimensional. Keeping only the top $r$ terms, $A \approx \sum_{i\le r}\sigma_i\, u_i v_i^{\top}$, is the *best* rank-$r$ approximation: it keeps the biggest stretches and drops the smallest \cite{svd_wiki}.
* **Singular values are the “true sizes.”** Unlike eigenvalues, they are always real and non-negative and are defined for *any* rectangular matrix. The ratio $\kappa = \sigma_{\max}/\sigma_{\min}$, the **condition number**, measures how much more one direction is stretched than another — it controls how ill-conditioned the map is, and how sensitive its output is to noise.

That is why the SVD appears across this course under different names. **PCA** is the singular vectors of the data matrix, ordered by the variance they explain. **Low-rank compression** is “keep the top singular values.” **LoRA** fine-tunes a weight matrix by learning only a *low-rank* correction $\Delta W = BA$ \cite{hu2021lora} — the bet that the useful change lives in a few directions. And a layer’s “effective rank” (how fast its singular values decay) proxies how much of its capacity it actually uses. Applied to an attention head, the same “keep the top singular directions” idea becomes an interpretability tool: an SVD of a head’s query–key or value–output matrix isolates the one or two directions that carry the real signal when that head talks to a head several layers later — the **communication channels** that can be read straight off the weights \cite[Merullo et al., 2024]{merullo2024talkingheads} (see [Mechanistic Interpretability](mechanistic_interpretability)). See [Beyond LLMs](beyond_llms) for PCA and factorisation as algorithms.

The interactive shows the unit circle (white) and its image under a map with singular values $\sigma_1, \sigma_2$ and rotation $\theta$. The colored arrows are the singular-vector axes, with lengths $\sigma_1, \sigma_2$. Drag $\sigma_2$ to zero and the ellipse collapses to a line — rank 2 to 1.
</div>

<!-- ─── Interactive: SVD / the shape of a linear map ─── -->
<div style="background:#fff; padding:20px; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); margin:20px 0;">
	<p style="color:#64748b; font-size:0.9em; margin-top:0;">The <b>white</b> circle is the unit circle $\lVert x\rVert = 1$. The colored <b>ellipse</b> is its image under a map that rotates by $\theta$, stretches by $\sigma_1$ and $\sigma_2$, and rotates back — “rotate, stretch, rotate.” The two colored arrows are the singular-vector axes; their lengths are exactly $\sigma_1$ and $\sigma_2$. Drag <b>σ₂ → 0</b> and the ellipse collapses to a line: the rank drops from 2 to 1.</p>
	<div style="margin-bottom:10px; display:flex; gap:18px; flex-wrap:wrap; align-items:center;">
		<label><b>σ₁ (major):</b></label>
		<input type="range" id="geo2-svd-s1" min="0.2" max="4" step="0.1" value="3" style="width:130px; vertical-align:middle;">
		<span id="geo2-svd-s1v" style="font-family:monospace; font-weight:bold; color:#2563eb;">3.0</span>
		<label><b>σ₂ (minor):</b></label>
		<input type="range" id="geo2-svd-s2" min="0" max="4" step="0.1" value="1.5" style="width:130px; vertical-align:middle;">
		<span id="geo2-svd-s2v" style="font-family:monospace; font-weight:bold; color:#2563eb;">1.5</span>
		<label><b>rotation θ:</b></label>
		<input type="range" id="geo2-svd-th" min="0" max="90" step="1" value="25" style="width:120px; vertical-align:middle;">
		<span id="geo2-svd-thv" style="font-family:monospace; font-weight:bold; color:#2563eb;">25°</span>
	</div>
	<div id="geo2-svd" class="plot-container" style="width:100%; height:380px;"></div>
	<div id="geo2-svd-readout" style="margin-top:8px; font-family:monospace; font-size:0.9em; color:#334155;"></div>
</div>

<div class="md">
## Descent: why the gradient is steepest

Training a model is walking downhill on a loss landscape $L$. At any point $w$ the **gradient** $\nabla L(w) = (\partial L/\partial w_1, \dots, \partial L/\partial w_d)$ is a vector pointing the way the function climbs *fastest*, so $-\nabla L$ points straight *downhill*. Is the gradient actually the steepest way, or just a convenient choice? The answer is geometric — it is the inner-product identity pointed at a function. The **directional derivative** of $L$ in a unit direction $d$ is an inner product, using two geometric signs: $a \parallel b$ (*parallel to*) and $a \perp b$ (*perpendicular to*):

$$
\underbrace{dL(d)}_{\text{“slope going in direction } d\text{”}} \;=\; \underbrace{\langle \nabla L, \, d \rangle}_{\text{gradient dotted with the direction}} \;=\; \underbrace{\lVert \nabla L \rVert}_{\text{the steepest slope there is}} \;\underbrace{\cos\angle(\nabla L, d)}_{\le 1,\ \text{and } 1 \text{ only when } d \parallel \nabla L}
$$

So $\langle \nabla L, d\rangle$ is largest when $d$ points *along* $\nabla L$ and most negative when $d$ points *against* it. Steepest ascent is $+\nabla L$ and steepest descent is $-\nabla L$ — not by choice, but because the inner product *forces* the steepest direction to be the gradient. Cauchy wrote this down in 1847 as the method of steepest descent, a century before neural networks \cite{cauchy1847}.

\marginfig{cauchy.jpg}{Augustin-Louis Cauchy (1789–1857). In 1847 he proposed moving a point *against the gradient* to solve systems of equations and to fit by least squares \cite{cauchy1847} — the move later christened the **method of steepest descent**, and the same move every gradient-based optimizer makes on a loss landscape.}

Read the same identity differently: the gradient is **perpendicular to the level sets** of $L$ — the “same loss” contours. Moving along a contour keeps $L$ constant, so its direction $d$ satisfies $\langle \nabla L, d\rangle = 0$, i.e. $d \perp \nabla L$. This is why a *curved* landscape is hard to descend: in a narrow valley the gradient points *across* the valley rather than down it, so a plain step zig-zags. The **condition number** from the SVD section — the ratio of the loss’s biggest to smallest curvature — measures how narrow the valley is, and it, not the gradient itself, decides whether optimization is fast or slow.

The *schedule* on top of this fact — momentum, Adam, learning-rate decay — is optimization, not geometry, covered in [The Optimizer](optimizerlab) and [Automatic Differentiation](autodiff). What we keep here: **the gradient is the normal to the level sets, and the steepest way down is to follow it.** In the interactive, drag the point around an oval bowl and watch the descent arrow (−∇) stay perpendicular to the contours; drag the valley narrow and it starts pointing across.
</div>

<!-- ─── Interactive: Gradient = steepest = normal to the contours ─── -->
<div style="background:#fff; padding:20px; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); margin:20px 0;">
	<p style="color:#64748b; font-size:0.9em; margin-top:0;">An anisotropic bowl $L(x,y)=\underbrace{\tfrac12(x^2/w + y^2 w)}_{\text{flat along } x\text{, steep along } y}$ with oval level sets. The grey dot is your position; the <b>red</b> arrow is $-\nabla L$, the steepest-descent direction. It is always <b>perpendicular</b> to the contour it crosses. Drag the point off the valley floor and the arrow points across the valley (the zig-zag); drag <b>valley width $w$</b> large and the zig-zag gets worse — the condition number is $w^2$.</p>
	<div style="margin-bottom:10px; display:flex; gap:18px; flex-wrap:wrap; align-items:center;">
		<label><b>x:</b></label>
		<input type="range" id="geo2-des-px" min="-3" max="3" step="0.05" value="1.5" style="width:120px; vertical-align:middle;">
		<span id="geo2-des-pxv" style="font-family:monospace; font-weight:bold; color:#2563eb;">1.5</span>
		<label><b>y:</b></label>
		<input type="range" id="geo2-des-py" min="-3" max="3" step="0.05" value="1.2" style="width:120px; vertical-align:middle;">
		<span id="geo2-des-pyv" style="font-family:monospace; font-weight:bold; color:#2563eb;">1.2</span>
		<label><b>valley width $w$:</b></label>
		<input type="range" id="geo2-des-w" min="1" max="6" step="0.1" value="2" style="width:130px; vertical-align:middle;">
		<span id="geo2-des-wv" style="font-family:monospace; font-weight:bold; color:#2563eb;">2.0</span>
	</div>
	<div id="geo2-descent" class="plot-container" style="width:100%; height:380px;"></div>
	<div id="geo2-des-readout" style="margin-top:8px; font-family:monospace; font-size:0.9em; color:#334155;"></div>
</div>

<div class="md">
## Convolution is a sliding dot product — the DFT is its shape

A convolution takes a short pattern (the **kernel** $c$) and a long signal (the **input** $x$), flips the kernel, slides it across the signal, and at each position takes a **dot product** and sums:

$$
\underbrace{(c * x)_t}_{\text{the output at position } t} \;=\; \underbrace{\sum_{k} c_k \, x_{t-k}}_{\text{“flip } c\text{, slide it to } t\text{, take the dot product”}}
$$

That is all a convolution is: an inner product, repeated at every offset $t$ — the same alignment measurement from the inner product. This is why a CNN filter works: each filter is a kernel, and applying it to an image is taking the dot product with every patch, so it *detects* the local pattern it is shaped like (see [Computer Vision](computer_vision)).

\marginfig{fourier.jpg}{Jean-Baptiste Joseph Fourier (1768–1830). In his 1822 *Théorie analytique de la chaleur* he argued that any signal is a sum of sines \cite{fourier1822} — the Fourier idea that makes the next paragraph possible.}

The payoff is the **Fourier transform** $\mathcal{F}$ — a *change of coordinates*. It sends a signal to the list of sine-wave ingredients that build it. Write the signal and kernel in the basis of pure sine waves (“frequency” coordinates) instead of time. In that system the sliding sum becomes **ordinary multiplication**, point by point,

$$
\underbrace{\mathcal{F}(c * x)}_{\text{spectrum of the convolved signal}} \;=\; \underbrace{\mathcal{F}(c)\,\cdot\,\mathcal{F}(x)}_{\text{no sliding — just multiply each frequency}}
$$

Convolution in time is multiplication in frequency \cite{fourier1822}. The reason: the sines are the directions in which the *slide* is normal. Shifting a sine in time only rotates its phase, so in the sine basis a shift is a rotation, and a sliding dot product of rotations is a product. The DFT finds those directions; the FFT is the fast way to compute them \cite{cooley1965fft}.

This is not a curiosity. “Smooth the signal” means multiply its spectrum by a low-pass; “detect an edge” means the output lights up at high frequency; “a periodic hum” means energy piled up at one frequency. In audio the short-time Fourier view of sound is this identity (see [Speech & Audio](speech_audio)); in vision it underlies frequency filtering and the DFT tricks behind positional encoding and grokking (see [Positional Embeddings](positionalembeddingslab) and [The Shape of Space](geometry_i)). The two interactives share one kernel: drag its three taps and the time-domain output smooths (left) while the frequency-domain reason — pointwise multiplication — appears at the same time (right).
</div>

<!-- ─── Interactive: Convolution = sliding dot product; DFT = its shape ─── -->
<div style="background:#fff; padding:20px; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); margin:20px 0;">
	<p style="color:#64748b; font-size:0.9em; margin-top:0;">One 3-tap kernel $c = [c_{-1}, c_0, c_1]$ (drag the three taps) applied to a fixed signal $x$ (a short pulse on a wiggly baseline). <b>Left:</b> the time-domain result $y = c*x$ — the sliding dot product. <b>Right:</b> the frequency-domain reason: $|F(y)| = |F(c)|\cdot|F(x)|$, point by point. Make the taps a wide average and the output smooths (left) while the high frequencies get cancelled (right).</p>
	<div style="margin-bottom:10px; display:flex; gap:18px; flex-wrap:wrap; align-items:center;">
		<label><b>left $c_{-1}$:</b></label>
		<input type="range" id="geo2-conv-c0" min="0" max="0.5" step="0.01" value="0.25" style="width:110px; vertical-align:middle;">
		<span id="geo2-conv-c0v" style="font-family:monospace; font-weight:bold; color:#2563eb;">0.25</span>
		<label><b>center $c_0$:</b></label>
		<input type="range" id="geo2-conv-c1" min="0" max="1" step="0.01" value="0.5" style="width:110px; vertical-align:middle;">
		<span id="geo2-conv-c1v" style="font-family:monospace; font-weight:bold; color:#2563eb;">0.50</span>
		<label><b>right $c_1$:</b></label>
		<input type="range" id="geo2-conv-c2" min="0" max="0.5" step="0.01" value="0.25" style="width:110px; vertical-align:middle;">
		<span id="geo2-conv-c2v" style="font-family:monospace; font-weight:bold; color:#2563eb;">0.25</span>
	</div>
	<div style="display:flex; gap:16px; flex-wrap:wrap; justify-content:center;">
		<div style="flex:0 0 300px; max-width:100%; overflow:hidden;">
			<div style="font-size:0.85em; color:#64748b; margin-bottom:4px;">time domain — $y = c * x$</div>
			<div id="geo2-conv-time" class="plot-container" style="width:100%; height:300px;"></div>
		</div>
		<div style="flex:0 0 300px; max-width:100%; overflow:hidden;">
			<div style="font-size:0.85em; color:#64748b; margin-bottom:4px;">frequency domain — $|F(y)| = |F(c)|\cdot|F(x)|$</div>
			<div id="geo2-conv-freq" class="plot-container" style="width:100%; height:300px;"></div>
		</div>
	</div>
	<div id="geo2-conv-readout" style="margin-top:8px; font-family:monospace; font-size:0.9em; color:#334155;"></div>
</div>

<div class="md">
## Symmetry: invariance, equivariance, and the shape of attention

A neural network is a stack of functions $f$. A function has a **symmetry** when some operation on its input changes the input but the output moves in a predictable, *structured* way. Write a symmetry as $\sigma$ and its action on an input $x$ as $\sigma \cdot x$ (here the dot means “apply $\sigma$ to $x$,” not multiplication). Two behaviors matter:

* **Invariant** — the output does not change: $f(\sigma \cdot x) = f(x)$ for a symmetry $\sigma$ (say, reordering the inputs). The output “forgets” the symmetry.
* **Equivariant** — the output changes *the same way* the input did: $f(\sigma \cdot x) = \sigma \cdot f(x)$. The function “commutes” with the symmetry.

Write the equivariance condition as a diagram that **commutes**: do the symmetry first, then the function, or the function first, then the symmetry — both paths land on the same point.

$$
x \;\xrightarrow{\ \sigma\ }\; \sigma x \;\xrightarrow{\ f\ }\; \underbrace{\sigma f(x)}_{\text{same point}}
\qquad\text{and}\qquad
x \;\xrightarrow{\ f\ }\; f(x) \;\xrightarrow{\ \sigma\ }\; \underbrace{\sigma f(x)}_{\text{same point}}
$$

The commuting square is the whole idea of equivariance, and it is *geometric*: $f$ and the symmetry $\sigma$ are two motions of space that get along.

These are not exotic — they are *forced*. **Deep Sets** \cite{zaheer2017deepsets} proved that any function of a *set* of inputs that is permutation-invariant must factor as “map each item, add them up, then pool”:

$$
\underbrace{f(x_1,\dots,x_n)}_{\text{an answer that does not care about order}} \;=\; \underbrace{\rho}_{\text{one final map}}\Big(\underbrace{\textstyle\sum_{i}}_{\text{“add up all the items”}}\; \underbrace{\phi(x_i)}_{\text{“map each item”}}\Big)
$$

and it gives the matching condition for equivariance. “Map, sum, pool” is not a design choice — it is *the* shape any invariant or equivariant function on a set must have.

This matters because **weight sharing is equivariance in disguise**, and attention is a *symmetric* operation:

* A **CNN** shares one kernel across every location — translation-equivariance: shift the input and the feature map shifts the same way (see [Computer Vision](computer_vision)). The convolution section’s “sliding dot product” is the *mechanism*; this section is the *reason it is allowed*.
* **Pooling** (mean, max) is the invariant readout: reorder what you pool over and the number does not move.
* **Attention** is permutation-equivariant over the token set: shuffle the tokens and every output token and attention weight shuffles along. Order is not something attention knows, which is why position must be *added in explicitly* (see [Positional Embeddings](positionalembeddingslab)).
* The same logic reaches **graphs**: a GNN is equivariant under re-labeling the vertices, which is why its basic form is message-passing — a sum over neighbors (the broader program is **geometric deep learning** \cite{bronstein2021geometric}).

The interactive holds a bag of six “tokens.” Drag the **shift** to reorder them. The <b>blue</b> (input) and <b>orange</b> (per-item equivariant output) traces rotate *together* — equivariance, the commutative square closing. The flat <b>green</b> line is the invariant readout (the mean), which does not move no matter how you reorder.
</div>

<!-- ─── Interactive: Invariance vs equivariance on a bag of tokens ─── -->
<div style="background:#fff; padding:20px; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); margin:20px 0;">
	<p style="color:#64748b; font-size:0.9em; margin-top:0;">Six “tokens” (a bag). Drag <b>shift</b> to cyclically reorder them. The <b>blue</b> trace is the reordered input and the <b>orange</b> trace is a fixed per-item function of it — an <b>equivariant</b> output, so the two move together. The flat <b>green</b> line is the <b>invariant</b> readout (the mean), which does not move for any reorder. The grey trace is the original order, for reference.</p>
	<div style="margin-bottom:10px; display:flex; gap:18px; flex-wrap:wrap; align-items:center;">
		<label><b>shift (reorder):</b></label>
		<input type="range" id="geo2-sym-shift" min="0" max="5" step="1" value="0" style="width:150px; vertical-align:middle;">
		<span id="geo2-sym-shv" style="font-family:monospace; font-weight:bold; color:#2563eb;">0</span>
	</div>
	<div id="geo2-sym" class="plot-container" style="width:100%; height:380px;"></div>
	<div id="geo2-sym-readout" style="margin-top:8px; font-family:monospace; font-size:0.9em; color:#334155;"></div>
</div>

<div class="md">
## Synthesis: one forward pass, as geometry

Pull the six moves together and a forward pass reads as a *sequence of geometric operations*, each with a fixed shape and a handful of learned parameters:

<table>
<thead><tr><th>Move</th><th>Operation</th><th>The layer</th><th>Met in</th></tr></thead>
<tbody>
<tr><td>Inner product</td><td>alignment $\langle u,v\rangle$</td><td>neuron, similarity, attention</td><td><a href="attentionlab">Attention</a>, <a href="embeddinglab">Embedding</a></td></tr>
<tr><td>Projection</td><td>best fit = shadow, ⟂</td><td>least squares, low-rank</td><td><a href="losslab">Loss</a></td></tr>
<tr><td>SVD</td><td>rotate → stretch → rotate</td><td>PCA, compression, LoRA</td><td><a href="beyond_llms">Beyond LLMs</a></td></tr>
<tr><td>Descent</td><td>$-\nabla$, ⟂ to level sets</td><td>descent, backprop</td><td><a href="optimizerlab">Optimizer</a>, <a href="autodiff">Autodiff</a></td></tr>
<tr><td>Conv + DFT</td><td>sliding dot product</td><td>CNN filter, FFT</td><td><a href="computer_vision">Vision</a>, <a href="positionalembeddingslab">Positional</a></td></tr>
<tr><td>Symmetry</td><td>invariant / equivariant</td><td>pooling, attention, sharing</td><td><a href="computer_vision">Vision</a>, <a href="mechanistic_interpretability">Mech. Interp.</a></td></tr>
</tbody>
</table>

Notice what is *learned* and what is *fixed*. The geometry — a dot product measures alignment, the best fit is a shadow, the steepest direction is the normal to the level sets, convolution multiplies in frequency, a symmetric operation commutes with its symmetry — is **fixed by mathematics**. Training learns only the *parameters inside* each move: which directions to stretch, which kernel to slide, which per-item map to apply. The shape of the operations is a prior; the data supplies the numbers.

That is why the picture transfers. The same inner product that measures a neuron’s alignment measures a word’s similarity. The same projection that fits a line explains a low-rank approximation. The same SVD that shapes a matrix ranks a layer’s capacity. The same symmetry that justifies a shared filter is the reason attention needs position. A network is not “matrices of weights” but **geometry — points, shadows, stretches, level sets, sliding alignments, and symmetries** — and its layers become a single, navigable space.
</div>

<script>
(function () {
	"use strict";

	function boot() {
		var gc = function (c) { try { return (typeof themeColor === "function") ? themeColor(c) : c; } catch (e) { return c; } };
		var cfg = { responsive: true, displayModeBar: false };
		function el(id) { return document.getElementById(id); }

		function baseLayout() {
			return {
				paper_bgcolor: gc("#ffffff"),
				plot_bgcolor: gc("#f8fafc"),
				font: { color: gc("#334155"), size: 12 },
				margin: { l: 48, r: 18, b: 42, t: 12 },
				showlegend: true,
				legend: { orientation: "h", y: 1.14, x: 0 },
				xaxis: { gridcolor: gc("#eef2f7"), zeroline: true, zerolinecolor: gc("#cbd5e1"), tickfont: { color: gc("#64748b") } },
				yaxis: { gridcolor: gc("#eef2f7"), zeroline: true, zerolinecolor: gc("#cbd5e1"), tickfont: { color: gc("#64748b") } }
			};
		}
		function on(id, fn) { var e = el(id); if (e) e.addEventListener("input", fn); }
		var inited = {};
		function mount(id, fn) {
			var box = el(id); if (!box) return;
			var doInit = function () { if (inited[id]) return; inited[id] = true; fn(); };
			if (typeof IntersectionObserver !== "undefined") {
				var ob = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { doInit(); ob.disconnect(); } }); }, { rootMargin: "300px", threshold: 0 });
				ob.observe(box);
			}
			var r = box.getBoundingClientRect();
			if (r.top < (window.innerHeight + 300) && r.bottom > -300) doInit();
		}

		/* ── II. Projection ─────────────────────────────────────────────── */
		function projRead() {
			var px = parseFloat(el("geo2-proj-px").value), py = parseFloat(el("geo2-proj-py").value), deg = parseFloat(el("geo2-proj-phi").value);
			el("geo2-proj-pxv").textContent = px.toFixed(1);
			el("geo2-proj-pyv").textContent = py.toFixed(1);
			el("geo2-proj-phiv").textContent = deg.toFixed(0) + "°";
			var phi = deg * Math.PI / 180, ux = Math.cos(phi), uy = Math.sin(phi);
			var s = px * ux + py * uy, pxp = s * ux, pyp = s * uy, rx = px - pxp, ry = py - pyp;
			var rlen = Math.sqrt(rx * rx + ry * ry);
			var data = [
				{ x: [-5 * ux, 5 * ux], y: [-5 * uy, 5 * uy], type: "scatter", mode: "lines", line: { color: gc("#94a3b8"), width: 2 }, name: "subspace S" }
			];
			if (rlen > 0.05) {
				var m = 0.35, dx = rx / rlen, dy = ry / rlen;
				var Ax = pxp + m * ux, Ay = pyp + m * uy, Bx = pxp + m * dx, By = pyp + m * dy, Cx = pxp + m * (ux + dx), Cy = pyp + m * (uy + dy);
				data.push({ x: [Ax, Cx, Bx], y: [Ay, Cy, By], type: "scatter", mode: "lines", line: { color: gc("#94a3b8"), width: 1.5 }, showlegend: false, hoverinfo: "skip" });
			}
			data.push({ x: [0, pxp], y: [0, pyp], type: "scatter", mode: "lines", line: { color: "#2563eb", width: 4 }, name: "projection (shadow)" });
			data.push({ x: [pxp, px], y: [pyp, py], type: "scatter", mode: "lines", line: { color: "#ef4444", width: 4 }, name: "residual (⊥ S)" });
			data.push({ x: [px], y: [py], type: "scatter", mode: "markers", marker: { size: 13, color: "#475569" }, name: "P" });
			data.push({ x: [pxp], y: [pyp], type: "scatter", mode: "markers", marker: { size: 9, color: "#2563eb" }, showlegend: false });
			var lay = baseLayout(); lay.xaxis.range = [-5, 5]; lay.yaxis.range = [-5, 5];
			Plotly.react("geo2-projection", data, lay, cfg);
			var norm2 = px * px + py * py, expl = norm2 > 1e-12 ? (s * s) / norm2 : 0;
			el("geo2-proj-readout").textContent = "residual² = " + (rx * rx + ry * ry).toFixed(3) + "   ·   explained (R²) = " + (100 * expl).toFixed(1) + "%   ·   the red residual is always ⊥ to S";
		}

		/* ── III. SVD ───────────────────────────────────────────────────── */
		function svdRead() {
			var s1 = parseFloat(el("geo2-svd-s1").value), s2 = parseFloat(el("geo2-svd-s2").value), th = parseFloat(el("geo2-svd-th").value) * Math.PI / 180;
			el("geo2-svd-s1v").textContent = s1.toFixed(1);
			el("geo2-svd-s2v").textContent = s2.toFixed(1);
			el("geo2-svd-thv").textContent = (th * 180 / Math.PI).toFixed(0) + "°";
			var N = 128, cx = [], cy = [], ex = [], ey = [];
			for (var i = 0; i <= N; i++) {
				var a = 2 * Math.PI * i / N, c = Math.cos(a), sn = Math.sin(a);
				cx.push(c); cy.push(sn);
				var X = s1 * c, Y = s2 * sn;
				ex.push(X * Math.cos(th) - Y * Math.sin(th));
				ey.push(X * Math.sin(th) + Y * Math.cos(th));
			}
			var majx = Math.cos(th), majy = Math.sin(th), minx = -Math.sin(th), miny = Math.cos(th);
			var data = [
				{ x: cx, y: cy, type: "scatter", mode: "lines", line: { color: gc("#cbd5e1"), width: 1.5 }, name: "unit circle" },
				{ x: ex, y: ey, type: "scatter", mode: "lines", line: { color: "#7c3aed", width: 2 }, name: "image (ellipse)" },
				{ x: [0, s1 * majx], y: [0, s1 * majy], type: "scatter", mode: "lines+markers", line: { color: "#2563eb", width: 4 }, marker: { size: 10, color: "#2563eb" }, name: "σ₁ axis (len σ₁)" },
				{ x: [0, s2 * minx], y: [0, s2 * miny], type: "scatter", mode: "lines+markers", line: { color: "#f59e0b", width: 4 }, marker: { size: 10, color: "#f59e0b" }, name: "σ₂ axis (len σ₂)" }
			];
			var R = Math.max(s1, s2) + 0.6;
			var lay = baseLayout(); lay.xaxis.range = [-R, R]; lay.yaxis.range = [-R, R];
			Plotly.react("geo2-svd", data, lay, cfg);
			var rk = s2 < 0.05 ? 1 : 2, kap = s2 > 1e-6 ? (s1 / s2).toFixed(1) : "∞";
			el("geo2-svd-readout").textContent = "σ₁ = " + s1.toFixed(2) + "   σ₂ = " + s2.toFixed(2) + "   →   rank " + rk + (s2 < 0.05 ? " (the ellipse is a line)" : "") + "   ·   condition κ = " + kap;
		}

		/* ── IV. Descent ────────────────────────────────────────────────── */
		function desRead() {
			var px = parseFloat(el("geo2-des-px").value), py = parseFloat(el("geo2-des-py").value), w = parseFloat(el("geo2-des-w").value);
			el("geo2-des-pxv").textContent = px.toFixed(2);
			el("geo2-des-pyv").textContent = py.toFixed(2);
			el("geo2-des-wv").textContent = w.toFixed(1);
			var gx = px / w, gy = py * w, gmag = Math.sqrt(gx * gx + gy * gy);
			var data = [];
			[0.5, 1.5, 3, 5].forEach(function (c) {
				var semX = Math.sqrt(2 * c * w), semY = Math.sqrt(2 * c / w), xs = [], ys = [];
				for (var i = 0; i <= 120; i++) { var a = 2 * Math.PI * i / 120; xs.push(semX * Math.cos(a)); ys.push(semY * Math.sin(a)); }
				data.push({ x: xs, y: ys, type: "scatter", mode: "lines", line: { color: gc("#cbd5e1"), width: 1 }, showlegend: false, hoverinfo: "skip" });
			});
			var tipx = 0, tipy = 0;
			if (gmag > 1e-6) { tipx = px - gx / gmag * 1.4; tipy = py - gy / gmag * 1.4; }
			data.push({ x: [px, tipx], y: [py, tipy], type: "scatter", mode: "lines", line: { color: "#ef4444", width: 4 }, name: "−∇L (steepest descent)" });
			data.push({ x: [px], y: [py], type: "scatter", mode: "markers", marker: { size: 13, color: "#475569" }, name: "position" });
			var lay = baseLayout(); lay.xaxis.range = [-4.5, 4.5]; lay.yaxis.range = [-4.5, 4.5];
			Plotly.react("geo2-descent", data, lay, cfg);
			el("geo2-des-readout").textContent = "∇L = (" + gx.toFixed(2) + ", " + gy.toFixed(2) + ")   |∇L| = " + gmag.toFixed(2) + "   condition κ = " + (w * w).toFixed(1) + "   ·   −∇L ⊥ to the contour it crosses";
		}

		/* ── V. Convolution + DFT ───────────────────────────────────────── */
		var NX = 64, L = 128, xSeq = new Array(L);
		(function () { for (var n = 0; n < L; n++) { var b = 0.25 * Math.sin(2 * Math.PI * n / 9); var p = (n >= 20 && n <= 44) ? 1 : 0; xSeq[n] = n < NX ? b + p : 0; } })();
		function dft(seq) { var re = new Array(L), im = new Array(L); for (var k = 0; k < L; k++) { var sr = 0, si = 0; for (var n = 0; n < L; n++) { var ang = -2 * Math.PI * k * n / L; sr += seq[n] * Math.cos(ang); si += seq[n] * Math.sin(ang); } re[k] = sr; im[k] = si; } return { re: re, im: im }; }
		var Xf = dft(xSeq);
		function convRead() {
			var cl = parseFloat(el("geo2-conv-c0").value), cc = parseFloat(el("geo2-conv-c1").value), cr = parseFloat(el("geo2-conv-c2").value);
			el("geo2-conv-c0v").textContent = cl.toFixed(2); el("geo2-conv-c1v").textContent = cc.toFixed(2); el("geo2-conv-c2v").textContent = cr.toFixed(2);
			var y = [], nx = [];
			for (var t = 0; t < NX; t++) { nx.push(t); y.push(cc * (xSeq[t] || 0) + cl * (xSeq[t + 1] || 0) + cr * (xSeq[t - 1] || 0)); }
			var tdata = [
				{ x: nx, y: xSeq.slice(0, NX), type: "scatter", mode: "lines", line: { color: gc("#94a3b8"), width: 2 }, name: "x (input)" },
				{ x: nx, y: y, type: "scatter", mode: "lines", line: { color: "#2563eb", width: 3 }, name: "y = c*x (sliding dot product)" }
			];
			var layT = baseLayout(); layT.showlegend = true; layT.legend = { orientation: "h", y: -0.28, x: 0 }; layT.xaxis.range = [0, NX - 1]; layT.xaxis.title = { text: "time t", font: { color: gc("#64748b") } };
			Plotly.react("geo2-conv-time", tdata, layT, cfg);
			var cSeq = new Array(L).fill(0); cSeq[0] = cc; cSeq[1] = cr; cSeq[L - 1] = cl;
			var Cf = dft(cSeq), fb = [], mx = [], mc = [], my = [];
			for (var k = 0; k < 64; k++) { var X = Math.hypot(Xf.re[k], Xf.im[k]), C = Math.hypot(Cf.re[k], Cf.im[k]); fb.push(k); mx.push(X); mc.push(C); my.push(X * C); }
			var fdata = [
				{ x: fb, y: mx, type: "scatter", mode: "lines", line: { color: gc("#94a3b8"), width: 2 }, name: "|F(x)|" },
				{ x: fb, y: mc, type: "scatter", mode: "lines", line: { color: "#f59e0b", width: 2 }, name: "|F(c)|" },
				{ x: fb, y: my, type: "scatter", mode: "lines", line: { color: "#2563eb", width: 3 }, name: "|F(y)| = |F(c)|·|F(x)|" }
			];
			var layF = baseLayout(); layF.legend = { orientation: "h", y: -0.28, x: 0 }; layF.xaxis.range = [0, 63]; layF.xaxis.title = { text: "frequency bin (0…Nyquist)", font: { color: gc("#64748b") } };
			Plotly.react("geo2-conv-freq", fdata, layF, cfg);
			el("geo2-conv-readout").textContent = "kernel [c₋₁, c₀, c₁] = [" + cl.toFixed(2) + ", " + cc.toFixed(2) + ", " + cr.toFixed(2) + "]   Σc = " + (cl + cc + cr).toFixed(2) + "   ·   right: |F(y)| = |F(c)|·|F(x)|, point by point";
		}

		/* ── VI. Symmetry ───────────────────────────────────────────────── */
		var TOKENS = [0.4, 2.2, 1.1, 3.0, 0.7, 1.8];
		function psi(v) { return v + 0.25 * v * v; }
		function symRead() {
			var k = parseInt(el("geo2-sym-shift").value, 10);
			el("geo2-sym-shv").textContent = String(k);
			var n = 6, pos = [], shifted = [], out = [];
			for (var i = 0; i < n; i++) { pos.push(i); shifted.push(TOKENS[(i + k) % n]); out.push(psi(shifted[i])); }
			var mean = TOKENS.reduce(function (a, b) { return a + b; }, 0) / n;
			var data = [
				{ x: pos, y: TOKENS, type: "scatter", mode: "lines+markers", line: { color: gc("#cbd5e1"), width: 1.5, dash: "dot" }, marker: { size: 8, color: gc("#94a3b8") }, name: "input (original)" },
				{ x: pos, y: shifted, type: "scatter", mode: "lines+markers", line: { color: "#2563eb", width: 2.5 }, marker: { size: 9, color: "#2563eb" }, name: "input (shifted)" },
				{ x: pos, y: out, type: "scatter", mode: "lines+markers", line: { color: "#f59e0b", width: 2.5 }, marker: { size: 9, color: "#f59e0b" }, name: "equivariant out ψ(input)" },
				{ x: [-0.3, n - 1 + 0.3], y: [mean, mean], type: "scatter", mode: "lines", line: { color: "#16a34a", width: 3, dash: "dash" }, name: "invariant (mean)" }
			];
			var lay = baseLayout(); lay.xaxis.range = [-0.3, n - 1 + 0.3]; lay.xaxis.title = { text: "token position", font: { color: gc("#64748b") } };
			Plotly.react("geo2-sym", data, lay, cfg);
			el("geo2-sym-readout").textContent = "shift = " + k + "   ·   mean = " + mean.toFixed(3) + " (unchanged for every shift)   ·   blue & orange move together = equivariant; green stays put = invariant";
		}

		/* ── Wire sliders + lazy-init ───────────────────────────────────── */
		on("geo2-proj-px", projRead); on("geo2-proj-py", projRead); on("geo2-proj-phi", projRead);
		on("geo2-svd-s1", svdRead); on("geo2-svd-s2", svdRead); on("geo2-svd-th", svdRead);
		on("geo2-des-px", desRead); on("geo2-des-py", desRead); on("geo2-des-w", desRead);
		on("geo2-conv-c0", convRead); on("geo2-conv-c1", convRead); on("geo2-conv-c2", convRead);
		on("geo2-sym-shift", symRead);
		mount("geo2-projection", projRead);
		mount("geo2-svd", svdRead);
		mount("geo2-descent", desRead);
		mount("geo2-conv-time", convRead);
		mount("geo2-sym", symRead);
	}

	if (typeof Plotly !== "undefined") { boot(); }
	else {
		var tries = 0, t = setInterval(function () {
			if (typeof Plotly !== "undefined") { clearInterval(t); boot(); }
			else if (++tries > 150) { clearInterval(t); }
		}, 100);
	}
})();
</script>
