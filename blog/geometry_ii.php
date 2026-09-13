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
-->

<div class="md">
## The one picture this chapter keeps returning to

The [Shape of Space](geometry_i) chapter asked what *space* is, and how we came to see it as something that can bend. This chapter is its working twin. It does not ask what space is — it asks what a neural network *does* to the numbers that live in space, and it draws each operation as a picture. The claim is simple and, we hope, a little surprising: **nearly every layer in a modern network is a single geometric move**, and once you can see the move you can predict what the layer is for, where it can fail, and what it costs.

The moves we will draw, in order:

* **The inner product** — the operation underneath everything. A dot product is a *measurement of alignment*, and its shadow, the Gram matrix, is where “similarity” is actually stored \cite{scholkopf2002learning}.
* **Projection** — fitting anything (a line, a low-rank approximation, a prediction) is *shading*: the best fit is the shadow the data throws onto a subspace, and the error is exactly the piece left standing.
* **The singular value decomposition** — every matrix, no matter how ugly, is secretly a rotation, a set of pure stretches, and a rotation again. The stretches *are* the shape of the map \cite{svd_wiki}.
* **Descent** — why the gradient points where it points, and why “steepest” is a geometric fact, not an optimiser’s choice \cite{cauchy1847}.
* **Convolution and the Fourier transform** — a convolution is a dot product that slides across space, and the Fourier transform is the change of coordinates that turns that sliding into ordinary multiplication \cite{fourier1822} \cite{cooley1965fft}.
* **Symmetry** — invariance and equivariance, the group-theoretic reason a filter may be *shared*, and the shape of the attention map \cite{zaheer2017deepsets}.

Each section ends with a hands-on plot — drag the sliders, the picture is the point. We deliberately do **not** re-teach the parts the earlier chapters own: the dot product itself, what attention is as a convex combination, the optimisers, least squares, or PCA. We link to them instead. This chapter is the connective tissue that turns those isolated facts into one coherent geometry.
</div>

<div class="md">
## I. The one operation: the inner product

Everything in a neural network is a vector, and everything a layer *does* is a measurement of how those vectors line up. That measurement is the **inner product** (dot product):

$$
\underbrace{\langle \mathbf{u}, \mathbf{v} \rangle}_{\substack{\text{“how aligned are} \\ u \text{ and } v\text{?”}} \;} \;=\; \underbrace{\sum_{i=1}^{n} u_i v_i}_{\text{sum of term-by-term agreements}} \;=\; \underbrace{\lVert \mathbf{u} \rVert \, \lVert \mathbf{v} \rVert \, \cos\theta}_{\text{lengths times their alignment } \theta}
$$

The third form is the one that matters. The inner product factors into *how long* each vector is and *how close to pointing the same way* they are. Point the same way: maximum. Perpendicular: exactly zero. Opposite: minimum. So a dot product is not really a multiplication — it is a **verdict on alignment**.

This single fact is the load-bearing wall of the whole field. A neuron’s weighted sum $w \cdot x + b$ is an inner product plus a shift. Similarity search is “find the vector with the largest inner product.” Attention is a weighted average whose *weights* are normalised inner products (see [Attention](attentionlab)). And cosine similarity — the inner product with the lengths divided out — is the “are these two embeddings about the same thing?” test that powers retrieval \citeauthor{mikolov2013word2vec} (\citeyear{mikolov2013word2vec}).

### The Gram matrix: where similarity lives

Now line up $k$ data vectors as the columns of a matrix $X \in \mathbb{R}^{n \times k}$. Their pairwise inner products form the **Gram matrix**

$$
G \;=\; \underbrace{X^{\top} X}_{\text{“all pairwise alignments at once”}} \qquad\qquad G_{ij} \;=\; \underbrace{\langle x_i, x_j \rangle}_{\text{“how much do data } i \text{ and } j \text{ agree?”}}
$$

Two things make $G$ more than a convenience. First, it is **always symmetric and positive semi-definite**: the diagonal holds $G_{ii} = \lVert x_i \rVert^2 \ge 0$, and for *any* coefficient vector $c$, $c^{\top} G c = \lVert Xc \rVert^2 \ge 0$. That positivity is not an accident — it is the statement that the data fits inside a real space. (The deep version is Mercer’s theorem \citeyear{mercerno1909}: a positive-definite “kernel” is *exactly* a Gram matrix of features in some space, possibly infinite-dimensional — the whole reason kernel methods and the “kernel trick” work.)

Second, and this is the punchline for AI: **$G$ stores the geometry of the data independent of the coordinates you happened to choose.** Rotate every column of $X$ by the *same* rotation $R$ and $X$ changes to $XR$, but $G$ does not:

$$
(XR)^{\top}(XR) \;=\; R^{\top} \underbrace{\cancel{X^{\top}X}}_{G} R \;=\; R^{\top} G R
$$

and if $R$ is the identity this is just $G$. The point is that **all the information about distances and angles between your data — the only thing a downstream layer can ever see — lives in this one symmetric matrix, and only in its eigenvalues.** Change coordinates and $G$’s entries shuffle, but its eigenvalues, and therefore the shape of the data, do not move.

That last sentence is the seed of the entire chapter. Everything that follows is an operation that reads or manipulates $G$’s eigenstructure: **projection** picks out a subspace, the **SVD** diagonalises the stretch, **descent** walks across a level set, **convolution** is a translation-invariant inner product, and **symmetry** is the group of rotations that leave $G$ unchanged.
</div>

<div class="md">
## II. Projection: the best fit is a shadow

Suppose you do not know the answer, but you are told it *must* lie in a particular subspace $S$ — a line, a plane, or, in a network, the low-dimensional set of all outputs a layer can produce. Given a target point $p$ that does not lie in $S$, **which point $s \in S$ is closest to $p$?**

The answer is the **orthogonal projection**, and its proof is one of the shortest and most useful in all of applied mathematics. Take any candidate $s \in S$ and split the distance to it into two pieces:

$$
\lVert p - s \rVert^2 \;=\; \underbrace{\lVert p - p_S \rVert^2}_{\text{distance from } p \text{ to the whole subspace } S} \;+\; \underbrace{\lVert p_S - s \rVert^2}_{\text{extra distance you add by not picking } p_S}
$$

where $p_S$ is the projection of $p$ onto $S$. The cross term that would otherwise appear vanishes, because $p - p_S$ is *perpendicular to the entire subspace* while $s - p_S$ lies *inside* it, so their inner product is zero. The first term does not depend on $s$ at all; the second is non-negative and is zero exactly when $s = p_S$. So the closest point is **the shadow $p_S$**, and the error $p - p_S$ is the part of $p$ that sticks out, perpendicular to $S$.

That “the error is perpendicular to the model” line is not a footnote — it is a *working diagnostic*. It is the whole of least squares: a fit is optimal exactly when the residual is orthogonal to every direction the model can move in \cite{legendre1805} \cite{gauss1809} (see [Loss](losslab)). It is the whole of a low-rank approximation: truncating to a few directions gives the best shadow of your data in that lower-dimensional subspace \cite{svd_wiki} (see [Beyond LLMs](beyond_llms)). And it is how to *read* a single neuron: its output $\langle w, x \rangle$ is the shadow of the input $x$ onto the one direction $w$ — one number, the coordinate of $x$ along $w$. Attention does the same move in reverse: project each key onto the query to get a similarity, then recombine the values (see [Attention](attentionlab)).

The picture is always: *a target, a family of allowed answers, keep the shadow.* The interactive below lets you move the target and tilt the subspace. Watch the residual stay perpendicular — that right angle *is* the proof — and watch the “explained” number behave exactly like the $R^2$ of a regression.
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
## III. The SVD: the shape of any linear map

A linear map $A:\mathbb{R}^n\to\mathbb{R}^m$ looks, in coordinates, like a scary matrix of mixed-up numbers. But there is a coordinate system in which it is dead simple. The **singular value decomposition** (SVD) says every such $A$ factors as

$$
A \;=\; \underbrace{U}_{\substack{\text{a rotation in} \\ \text{the output space}}} \;\underbrace{\Sigma}_{\substack{\text{pure stretches} \\ \text{along the axes}}} \;\underbrace{V^{\top}}_{\substack{\text{a rotation in} \\ \text{the input space}}}
$$

where $U$ and $V$ are pure rotations (orthogonal: $U^{\top}U = V^{\top}V = I$) and $\Sigma$ is diagonal, its entries $\sigma_1 \ge \sigma_2 \ge \cdots \ge 0$ the **singular values** — non-negative, and ordered from largest to smallest.

Read the factorisation as a story about a circle:

1. $V^{\top}$ **rotates** the input unit circle so its axes line up with the directions that $A$ is about to stretch most and least.
2. $\Sigma$ **stretches** purely along the coordinate axes, by $\sigma_1$ and $\sigma_2$ — no rotation, no shear, just scaling.
3. $U$ **rotates** the result into the output space.

The upshot: *every* linear map is **rotate, stretch, rotate**. The circle $\lVert x\rVert = 1$ is carried to an **ellipse**, and the singular values are exactly the **semi-axis lengths** of that ellipse \cite{svd_wiki}. The right singular vectors (columns of $V$) point along the axes of the circle that get stretched; the left singular vectors (columns of $U$) point along where those stretched axes end up.

\marginfig{jacobi.jpg}{Carl Gustav Jacobi (1804–1851). In 1842 he gave the method of *alternately rotating a quadratic form between two sets of variables until it is diagonal* \cite{jacobi1842} — the “Jacobi rotations” that, in various descendants, are still the workhorse behind computing eigenvalues and the SVD today.}

Two facts turn the picture into engineering:

* **Rank is the number of non-zero singular values.** If $\sigma_2 = 0$ the ellipse collapses to a line and the map forgets an entire input dimension — its image is lower-dimensional. A rank-1 map is “one direction in, one direction out.” This is why keeping only the top $r$ terms, $A \approx \sum_{i\le r}\sigma_i\, u_i v_i^{\top}$, is the *best* rank-$r$ approximation: it keeps the biggest stretches and drops the smallest \cite{svd_wiki}.
* **Singular values are the “true sizes.”** Unlike eigenvalues, they are always real and non-negative and are defined for *any* rectangular matrix. The ratio $\kappa = \sigma_{\max}/\sigma_{\min}$, the **condition number**, measures how much more one direction is stretched than another — the number that controls how ill-conditioned the map is, and therefore how hard it is to invert, or how sensitive its output is to noise.

That is why the SVD shows up across this course wearing different names. **PCA** is “the singular vectors of the data matrix, ordered by the variance they explain.” **Matrix factorisation / low-rank compression** is “keep the top singular values.” **LoRA** fine-tunes a huge weight matrix by learning only a *low-rank* correction $\Delta W = BA$ \cite{hu2021lora} — the bet that the useful change lives in a few directions. And the “effective rank” of a layer’s weight matrix (how fast its singular values decay) is a working proxy for how much of its high-dimensional capacity the layer actually uses. See [Beyond LLMs](beyond_llms) for PCA and factorisation as algorithms.

The interactive below shows the unit circle (white) and its image under a map with singular values $\sigma_1, \sigma_2$ and output rotation $\theta$. The coloured arrows are the singular-vector axes, and their lengths are exactly $\sigma_1, \sigma_2$. Drag $\sigma_2$ down to zero and watch the ellipse pinch shut — the rank falling from 2 to 1.
</div>

<!-- ─── Interactive: SVD / the shape of a linear map ─── -->
<div style="background:#fff; padding:20px; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); margin:20px 0;">
	<p style="color:#64748b; font-size:0.9em; margin-top:0;">The <b>white</b> circle is the unit circle $\lVert x\rVert = 1$. The coloured <b>ellipse</b> is its image under a map that rotates by $\theta$, stretches by $\sigma_1$ and $\sigma_2$, and rotates back — “rotate, stretch, rotate.” The two coloured arrows are the singular-vector axes; their lengths are exactly $\sigma_1$ and $\sigma_2$. Drag <b>σ₂ → 0</b> and the ellipse collapses to a line: the rank drops from 2 to 1.</p>
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
## IV. Descent: why the gradient is steepest

Training a model reduces to walking downhill on a loss landscape $L$. At any point $w$ the gradient $\nabla L(w)$ is a vector, and two questions arise: which way is *down*, and is “the gradient” actually the steepest way, or just a convenient choice? The answer is geometric, and it is just the section-I identity pointed at a function. The **directional derivative** of $L$ in a unit direction $d$ is an inner product:

$$
\underbrace{dL(d)}_{\text{“slope going in direction } d\text{”}} \;=\; \underbrace{\langle \nabla L, \, d \rangle}_{\text{gradient dotted with the direction}} \;=\; \underbrace{\lVert \nabla L \rVert}_{\text{the steepest slope there is}} \;\underbrace{\cos\angle(\nabla L, d)}_{\le 1,\ \text{and } 1 \text{ only when } d \parallel \nabla L}
$$

So $\langle \nabla L, d\rangle$ is largest when $d$ points *along* $\nabla L$ and most negative when $d$ points *against* it. The steepest ascent is $+\nabla L$ and the steepest descent is $-\nabla L$ — not because we *choose* gradient descent, but because the inner product *forces* the steepest direction to be the gradient. Cauchy wrote this down in 1847 as the method of steepest descent, decades before neural networks \cite{cauchy1847}.

\marginfig{cauchy.jpg}{Augustin-Louis Cauchy (1789–1857). In 1847 he proposed moving a point *against the gradient* to solve systems of equations and to fit by least squares \cite{cauchy1847} — the move later christened the **method of steepest descent**, and the same move every gradient-based optimiser makes on a loss landscape.}

Read the same identity a different way and it says the gradient is **perpendicular to the level sets** of $L$ — the “same loss” contours. Moving along a contour keeps $L$ constant, so its direction $d$ satisfies $\langle \nabla L, d\rangle = 0$, i.e. $d \perp \nabla L$. The contour lines are level sets of the quadratic forms you keep meeting, and the gradient is their normal. This is also why a *curved* landscape is hard to descend: in a narrow valley the contours crowd together on one side and spread out on the other, the gradient points *across* the valley rather than down it, and a plain gradient step zig-zags. The **condition number** from section III — the ratio of the loss’s biggest to smallest curvature — is precisely the width of that valley, and it is conditioning, not the gradient itself, that decides whether optimisation is fast or slow.

The *schedule* laid on top of this one geometric fact — momentum, Adam, learning-rate decay — is optimisation, not geometry, and is covered in [The Optimizer](optimizerlab) and [Automatic Differentiation](autodiff). What we keep here is the truth underneath all of them: **the gradient is the normal to the level sets, and the steepest way down is to follow it.** In the interactive below, drag the point around an oval bowl and watch the descent arrow (−∇) stay perpendicular to the contours; then drag the valley narrow and watch the arrow start pointing across it.
</div>

<!-- ─── Interactive: Gradient = steepest = normal to the contours ─── -->
<div style="background:#fff; padding:20px; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); margin:20px 0;">
	<p style="color:#64748b; font-size:0.9em; margin-top:0;">An anisotropic bowl $L(x,y)=\tfrac12(x^2/w + y^2 w)$ with oval level sets. The grey dot is your position; the <b>red</b> arrow is $-\nabla L$, the steepest-descent direction. It is always <b>perpendicular</b> to the contour it crosses. Drag the point off the valley floor and the arrow points across the valley (the zig-zag); drag <b>valley width $w$</b> large and the zig-zag gets worse — the condition number is $w^2$.</p>
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
## V. Convolution is a sliding dot product — and the DFT is its shape

A convolution takes a short pattern (the **kernel** $c$) and a long signal (the **input** $x$), flips the kernel, slides it across the signal, and at each position takes a **dot product** and sums:

$$
(c * x)_t \;=\; \underbrace{\sum_{k} c_k \, x_{t-k}}_{\text{“flip } c\text{, slide it to } t\text{, take the dot product”}}
$$

That is all a convolution is: an inner product, repeated at every offset $t$. The word “convolution” hides the fact that the operation *under* it is the same one from section I — a measurement of alignment between the kernel and a sliding window of the input. This is exactly why a CNN filter works the way it does: each filter is a kernel, and “applying” it to an image is “taking the dot product with every patch,” so the filter *detects* precisely the local pattern it is shaped like (see [Convolutions](visionlab)).

\marginfig{fourier.jpg}{Jean-Baptiste Joseph Fourier (1768–1830). In his 1822 *Théorie analytique de la chaleur* he argued that any signal is a sum of sines \cite{fourier1822} — the Fourier idea that makes the next paragraph possible.}

The payoff is the **Fourier transform**, and it is a *change of coordinates*. Write the signal and the kernel in the basis of pure sine waves — the “frequency” coordinates — instead of in time. In that coordinate system the sliding sum above does something astonishing: **it becomes ordinary multiplication**, point by point,

$$
\mathcal{F}(c * x) \;=\; \underbrace{\mathcal{F}(c)\,\cdot\,\mathcal{F}(x)}_{\text{no sliding — just multiply each frequency}}
$$

Convolution in time is multiplication in frequency \cite{fourier1822}. The reason is the same one running through this whole chapter: the sines are the directions in which the *slide* is **normal**. Shifting a sine wave in time only rotates its phase — it does not change the wave — so in the sine basis a shift is a rotation, and a sliding dot product of rotations is just a product. The DFT finds those special directions; the FFT is merely the fast way to compute them \cite{cooley1965fft}.

This is not a curiosity. “Smooth the signal” means “multiply its spectrum by a low-pass.” “Detect an edge” means “the output lights up at high frequency.” “A periodic hum” means “energy piled up at one frequency.” In audio, the whole short-time Fourier view of sound is this one identity (see [Speech & Audio](speech_audio)); in vision it underlies frequency filtering and the DFT-based tricks behind positional encoding and grokking (see [Positional Embeddings](positionalembeddingslab) and [The Shape of Space](geometry_i)). The two interactives below share one kernel: drag its three taps and watch the time-domain output get smoothed (left) *and* the frequency-domain reason for it — pointwise multiplication — happen at the same time (right).
</div>

<!-- ─── Interactive: Convolution = sliding dot product; DFT = its shape ─── -->
<div style="background:#fff; padding:20px; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); margin:20px 0;">
	<p style="color:#64748b; font-size:0.9em; margin-top:0;">One 3-tap kernel $c = [c_{-1}, c_0, c_1]$ (drag the three taps) applied to a fixed signal $x$ (a short pulse on a wiggly baseline). <b>Left:</b> the time-domain result $y = c*x$ — the sliding dot product. <b>Right:</b> the frequency-domain reason: $|F(y)| = |F(c)|\cdot|F(x)|$, point by point. Make the taps a wide average and the output smooths (left) while the high frequencies get cancelled (right).</p>
	<div style="margin-bottom:10px; display:flex; gap:18px; flex-wrap:wrap; align-items:center;">
		<label><b>left $c_{-1}$:</b></label>
		<input type="range" id="geo2-conv-c0" min="0" max="0.5" step="0.01" value="0.25" style="width:110px; vertical-align:middle;">
		<span id="geo2-conv-c0v" style="font-family:monospace; font-weight:bold; color:#2563eb;">0.25</span>
		<label><b>centre $c_0$:</b></label>
		<input type="range" id="geo2-conv-c1" min="0" max="1" step="0.01" value="0.5" style="width:110px; vertical-align:middle;">
		<span id="geo2-conv-c1v" style="font-family:monospace; font-weight:bold; color:#2563eb;">0.50</span>
		<label><b>right $c_1$:</b></label>
		<input type="range" id="geo2-conv-c2" min="0" max="0.5" step="0.01" value="0.25" style="width:110px; vertical-align:middle;">
		<span id="geo2-conv-c2v" style="font-family:monospace; font-weight:bold; color:#2563eb;">0.25</span>
	</div>
	<div style="display:flex; gap:16px; flex-wrap:wrap;">
		<div style="flex:1; min-width:320px;">
			<div style="font-size:0.85em; color:#64748b; margin-bottom:4px;">time domain — $y = c * x$</div>
			<div id="geo2-conv-time" class="plot-container" style="width:100%; height:300px;"></div>
		</div>
		<div style="flex:1; min-width:320px;">
			<div style="font-size:0.85em; color:#64748b; margin-bottom:4px;">frequency domain — $|F(y)| = |F(c)|\cdot|F(x)|$</div>
			<div id="geo2-conv-freq" class="plot-container" style="width:100%; height:300px;"></div>
		</div>
	</div>
	<div id="geo2-conv-readout" style="margin-top:8px; font-family:monospace; font-size:0.9em; color:#334155;"></div>
</div>

<div class="md">
## VI. Symmetry: invariance, equivariance, and the shape of attention

A neural network is a stack of functions $f$. A function has a **symmetry** when some operation on its input changes the input but the output moves in a predictable, *structured* way. There are two such behaviours, and they are the difference between a network that works and one that wastes capacity re-learning what it already knows.

* **Invariant** — the output does not change at all: $f(\sigma \cdot x) = f(x)$ for a symmetry $\sigma$ (say, reordering the inputs). The output “forgets” the symmetry.
* **Equivariant** — the output changes, but *the same way* the input did: $f(\sigma \cdot x) = \sigma \cdot f(x)$. The output “commutes” with the symmetry.

Write the equivariance condition as a diagram that **commutes**: do the symmetry first, then the function, or the function first, then the symmetry — both paths land on the same point.

$$
x \;\xrightarrow{\ \sigma\ }\; \sigma x \;\xrightarrow{\ f\ }\; \sigma f(x)
\qquad\text{and}\qquad
x \;\xrightarrow{\ f\ }\; f(x) \;\xrightarrow{\ \sigma\ }\; \sigma f(x)
$$

That little commuting square is the whole idea of equivariance, and it is a *geometric* statement: $f$ and the symmetry $\sigma$ are two motions of space that get along.

The deep result is that these are not exotic — they are *forced*. **Deep Sets** \cite{zaheer2017deepsets} proved that any function of a *set* of inputs that is permutation-invariant must factor as “map each item, add them up, then pool”:

$$
f(x_1,\dots,x_n) \;=\; \underbrace{\rho}_{\text{one final map}}\Big(\underbrace{\textstyle\sum_{i}}_{\text{“add up all the items”}}\; \underbrace{\phi(x_i)}_{\text{“map each item”}}\Big)
$$

and it gives the matching necessary-and-sufficient condition for equivariance. “Map, sum, pool” is not a design choice — it is *the* shape any invariant or equivariant function on a set must have. That is the geometry a set-based architecture has no choice but to obey.

Why should a working-geometry chapter care? Because **weight sharing is equivariance in disguise**, and attention is a *symmetric* operation:

* A **CNN** shares one kernel across every location — that is translation-equivariance: shift the input and the feature map shifts the same way (see [Convolutions](visionlab)). Section V’s “sliding dot product” is the *mechanism*; this section is the *reason it is allowed*.
* **Pooling** (mean, max) is the invariant readout: reorder or shift what you pool over and the pooled number does not move.
* **Attention** is permutation-equivariant over the token set: shuffle the input tokens and every output token — and every attention weight — shuffles along with it. Order is not something attention knows, which is exactly why position has to be *added in explicitly* (see [Positional Embeddings](positionalembeddingslab)). The attention map is a function on *pairs* of tokens that commutes with permutation — a symmetric object in the group-theoretic sense.
* The same logic reaches **graphs**: a GNN is equivariant under re-labelling the vertices, which is why it can be pure message-passing — sum over neighbours — and no more (the broader programme is **geometric deep learning** \cite{bronstein2021geometric}).

The interactive below holds a bag of six “tokens.” Drag the **shift** to reorder them. The <b>blue</b> (input) and <b>orange</b> (a per-item equivariant output) traces rotate *together* — that is equivariance, the commutative square closing. The flat <b>green</b> line is the invariant readout (the mean), and it does not move no matter how you reorder the bag.
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
## VII. Synthesis: one forward pass, as geometry

Pull the six moves together and a forward pass reads as a *sequence of geometric operations*, each with a fixed shape and a handful of learned parameters:

| Geometric move | The operation | The layer that is it | You met it in |
|---|---|---|---|
| Inner product | measure alignment $\langle u, v\rangle$ | a neuron, similarity, attention weights | [Attention](attentionlab), [Embeddings](embeddinglab) |
| Projection | best fit = shadow, ⟂ residual | least squares, low-rank approximation | [Loss](losslab) |
| SVD | rotate → stretch → rotate | PCA, low-rank compression, LoRA | [Beyond LLMs](beyond_llms) |
| Descent | $-\nabla$, ⟂ to the level sets | gradient descent, backprop | [Optimizer](optimizerlab), [Autodiff](autodiff) |
| Convolution + DFT | sliding dot product | CNN filter, FFT | [Convolutions](visionlab), [Positional](positionalembeddingslab) |
| Symmetry | invariant / equivariant | pooling, attention, weight sharing | [Convolutions](visionlab), [Mech. Interp.](mechanistic_interpretability) |

Notice what is *learned* and what is *fixed*. The geometry — that a dot product measures alignment, that the best fit is a shadow, that the steepest direction is the normal to the level sets, that convolution multiplies in frequency, that a symmetric operation must commute with its symmetry — is **fixed by mathematics**. What training learns are the *parameters inside* each move: which directions to stretch (the singular vectors), which kernel to slide (the filter weights), which per-item map to apply (the non-linearity). The shape of the operations is a prior; the data supplies the numbers. That is the working geometry of a neural network: a fixed set of geometric moves, parametrised, stacked, and trained.

And that is why the picture transfers. The same inner product that measures a neuron’s alignment measures a word’s similarity. The same projection that fits a line explains a low-rank approximation. The same SVD that shapes a matrix ranks a layer’s effective capacity. The same symmetry that justifies a shared filter is the reason attention needs position. Stop seeing a network as “matrices of weights” and start seeing it as **geometry — points, shadows, stretches, level sets, sliding alignments, and symmetries** — and the layers stop being a list of tricks and become a single, navigable space. That is the shape of the machine.
</div>

<!--GEO2_MORE-->
