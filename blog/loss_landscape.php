<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Loss Landscape
description: The high-dimensional surface every optimizer walks on, why it is non-convex but mostly benign, how skip connections flatten it, and how saddles outnumber minima.
icon: &#127956;
part: 2
order: 6
color: sky
topics: training, math-i, math-ii
tags: math-heavy
math: 55
-->

<div class="md">

## The Loss Landscape

A neural network is a parameterized function $f(x;\theta)$ with parameters $\theta \in \mathbb{R}^d$ (for a modern LLM, $d$ is in the billions). Training means finding the $\theta$ that makes $f$ predict the data. We measure "predicts well" with a scalar **loss**

$$\mathcal{L}(\theta) \;=\; \frac{1}{m}\sum_{i=1}^{m}\ell\!\left(f(x_i;\theta),\,y_i\right),$$

the average per-example error $\ell$ over the training set. Think of $\theta$ as one point in a $d$-dimensional space. The value $\mathcal{L}(\theta)$ is the *height* of a landscape above that point. Training is rolling a ball downhill on this landscape until it settles into a low valley. The whole question of "why does deep learning work?" reduces to the geometry of this landscape: how many valleys it has, how steep they are, how they connect, and which ones generalize.

The phrase "loss landscape" was popularised by \citeauthor{li2018losslandscape} (\citeyear{li2018losslandscape}), who gave the field its first systematic visualizations. The underlying mathematics, non-convex optimization in $10^7$ dimensions, goes back further: \citeauthor{rumelhart1986learning} noted in \citeyear{rumelhart1986learning} that gradient descent on a non-convex loss works "surprisingly often", and \citeauthor{hochreiter1991vanishing} (\citeyear{hochreiter1991vanishing}) had already linked the geometry to trainability.

</div>

<figure>
<img src="loss_landscape_resnet56_noskip.png" alt="Loss surface of ResNet-56 without skip connections: highly chaotic terrain with sharp cliffs">
<figcaption class="md">
**ResNet-56, no skip connections.** The loss surface is highly chaotic, with steep cliffs and many competing basins. Test error around 13%. Figure from \citeauthor{li2018losslandscape} (\citeyear{li2018losslandscape}) (code repo `tomgoldstein/loss-landscape`).
</figcaption>
</figure>

<figure>
<img src="loss_landscape_resnet56_skip.png" alt="Loss surface of ResNet-56 with skip connections: a single smooth convex-ish basin">
<figcaption class="md">
**ResNet-56, with skip connections.** The same architecture, the same training run, but the landscape is now a single smooth basin. Test error drops to around 6%. Figure from \citeauthor{li2018losslandscape} (\citeyear{li2018losslandscape}).
</figcaption>
</figure>

<div class="md" data-mathlevel="50" data-optionaltitle="The landscape is a function on a million-dimensional space">

### The landscape is a function on a million-dimensional space

A modern LLM has roughly $10^{10}$ parameters. The loss is one scalar value at each point of this space. The "landscape" is the graph $\{(\theta, \mathcal{L}(\theta))\}$: a hypersurface with one dimension for the loss value and $d$ more for the parameters, too big to draw. What we *can* do is take a 2-D slice through it: pick a center $\theta^\star$ (a trained minimum) and two directions $d_1, d_2$, then plot

$$g(\alpha, \beta) \;=\; \mathcal{L}\!\left(\theta^\star + \alpha\, d_1 + \beta\, d_2\right).$$

Most of the plots in this chapter are 2-D slices of that kind.

</div>

<div class="md">

### See it: walk a 2-D loss landscape

The static figures above are 2-D slices of real (huge) loss landscapes, but you only see the result — the *descent* that produced them is invisible. Here is the smallest landscape you can actually walk on: a single neuron

$$\hat{y} \;=\; \sigma(\mathbf{W}\,x + b),$$

fitted to 1-D data. There is one weight $\mathbf{W} \in \mathbb{R}$ and one bias $b \in \mathbb{R}$, so $\mathcal{L}(w, b)$ is a genuine 2-D surface and fits in a 3-D plot. The line drawn on the surface is the optimizer's *trajectory*, batch by batch.

Pick a target (try **Parabola**), tick one or two optimizers (SGD and Momentum are pre-selected), press **Start**, and watch. The point of the widget is to *feel* each claim above:

* **Non-convexity comes from non-linearities.** Switch the activation from `Linear` to `ReLU` and the same $(w, b)$ grid suddenly has flat plateaus, saddles, and sharp ridges.
* **Saddles outnumber minima.** With `ReLU` and a low learning rate, the SGD line stalls for many epochs on a flat plateau before a stochastic step kicks it downhill. Adam escapes faster.
* **Different basins.** `Adam` and `Momentum` often land in *different* minima of the same surface — the trajectories diverge visibly.
* **The noise-smoothed surface.** Crank the epoch count up; the trajectory visits cells the initial surface never sampled, because mini-batch noise is effectively smoothing the loss underneath it.

</div>

<style>
.ll-lab {
	margin: 28px 0 24px 0;
	padding: 22px 22px 18px 22px;
	background: var(--mn-surface, #FDFAF1);
	border: 1px solid var(--mn-border, #D8CFB6);
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	font-family: var(--mn-font-body, system-ui, sans-serif);
	color: var(--mn-text, #3A2F25);
}
.ll-lab .ll-title {
	margin: 0 0 4px 0;
	font-size: 1.15rem;
	font-weight: 700;
	color: var(--mn-heading, #1A140E);
}
.ll-lab .ll-sub {
	margin: 0 0 18px 0;
	font-size: 0.88rem;
	color: var(--mn-text-secondary, #5C5043);
}
.ll-lab .ll-controls {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 14px;
	margin-bottom: 18px;
}
@media (max-width: 900px) {
	.ll-lab .ll-controls { grid-template-columns: 1fr; }
}
.ll-lab .ll-card {
	background: var(--mn-bg, #FAF8F1);
	border: 1px solid var(--mn-border-light, #E8DFC6);
	border-radius: 10px;
	padding: 14px 16px;
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.ll-lab .ll-card h4 {
	margin: 4px 0 2px 0;
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: var(--mn-accent, #6366f1);
}
.ll-lab .ll-card label {
	font-size: 0.82rem;
	color: var(--mn-text-secondary, #5C5043);
	margin: 4px 0 0 0;
}
.ll-lab input[type="number"],
.ll-lab textarea,
.ll-lab select {
	background: var(--mn-surface, #FDFAF1);
	border: 1px solid var(--mn-border, #D8CFB6);
	border-radius: 6px;
	padding: 6px 8px;
	font-family: var(--mn-font-mono, ui-monospace, monospace);
	color: var(--mn-text, #3A2F25);
	font-size: 0.9rem;
	width: 100%;
	box-sizing: border-box;
}
.ll-lab input[type="number"]:focus,
.ll-lab textarea:focus,
.ll-lab select:focus {
	outline: none;
	border-color: var(--mn-accent, #6366f1);
	box-shadow: 0 0 0 2px var(--mn-accent-lighter, #eef2ff);
}
.ll-lab textarea {
	min-height: 50px;
	resize: vertical;
}
.ll-lab .ll-examples {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-top: 6px;
}
.ll-lab .ll-examples button {
	background: var(--mn-accent-lighter, #eef2ff);
	border: 1px solid var(--mn-accent-light, #c7d2fe);
	color: var(--mn-accent-dark, #4338ca);
	border-radius: 6px;
	padding: 4px 10px;
	font-size: 0.8rem;
	cursor: pointer;
	transition: background-color 0.15s;
}
.ll-lab .ll-examples button:hover {
	background: var(--mn-accent-light, #e0e7ff);
}
.ll-lab .ll-opts {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin: 4px 0 6px 0;
}
.ll-lab .ll-opt-label {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 4px 10px;
	background: var(--mn-bg-subtle, #F2EBD9);
	border: 1px solid var(--mn-border-light, #E8DFC6);
	border-radius: 6px;
	cursor: pointer;
	font-size: 0.85rem;
	color: var(--mn-text, #3A2F25);
}
.ll-lab .ll-opt-label:hover {
	background: var(--mn-surface-raised, #EBE3CE);
}
.ll-lab button#ll-start {
	background: var(--mn-accent, #6366f1);
	color: white;
	border: none;
	border-radius: 8px;
	padding: 10px 16px;
	font-weight: 600;
	font-size: 0.95rem;
	cursor: pointer;
	transition: background-color 0.15s;
	width: 100%;
}
.ll-lab button#ll-start:hover {
	background: var(--mn-accent-dark, #4338ca);
}
.ll-lab button#ll-start:disabled {
	opacity: 0.55;
	cursor: not-allowed;
}
.ll-lab button#ll-stop {
	background: #ef4444;
	color: white;
	border: none;
	border-radius: 8px;
	padding: 10px 16px;
	font-weight: 600;
	font-size: 0.95rem;
	cursor: pointer;
	width: 100%;
}
.ll-lab .ll-status {
	font-family: var(--mn-font-mono, ui-monospace, monospace);
	font-size: 0.85rem;
	color: var(--mn-text-secondary, #5C5043);
	background: var(--mn-bg-warm, #F5EFDC);
	border-radius: 6px;
	padding: 8px 10px;
	min-height: 18px;
}
.ll-lab .ll-progress-wrap {
	margin-top: 8px;
	height: 8px;
	background: var(--mn-bg, #FAF8F1);
	border: 1px solid var(--mn-border-light, #E8DFC6);
	border-radius: 4px;
	overflow: hidden;
}
.ll-lab .ll-progress {
	height: 100%;
	background: linear-gradient(90deg, var(--mn-accent, #6366f1), var(--mn-accent-dark, #4338ca));
	transition: width 0.18s ease-out;
	width: 0%;
}
.ll-lab .ll-run-bar {
	display: flex;
	align-items: center;
	gap: 10px;
	margin: 0 0 14px 0;
	padding: 8px 12px;
	background: var(--mn-bg-warm, #F5EFDC);
	border: 1px solid var(--mn-border-light, #E8DFC6);
	border-radius: 10px;
	min-width: 0;
}
.ll-lab .ll-run-bar .ll-run-btn {
	flex: 0 1 50%;
	min-width: 0;
	max-width: 50%;
	padding: 6px 14px;
	font-family: var(--mn-font-mono, ui-monospace, monospace);
	font-size: 0.88rem;
	font-weight: 600;
	background: var(--mn-accent, #6366f1);
	color: #fff;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.ll-lab .ll-run-bar .ll-run-btn:hover {
	background: var(--mn-accent-dark, #4338ca);
}
.ll-lab .ll-run-bar .ll-status {
	flex: 1 1 auto;
	min-width: 0;
	margin: 0;
	padding: 6px 10px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.ll-lab .ll-run-bar .ll-progress-wrap {
	flex: 2 1 auto;
	min-width: 60px;
	max-width: 240px;
	margin-top: 0;
}
.ll-lab .ll-original-eq {
	font-family: var(--mn-font-mono, ui-monospace, monospace);
	font-size: 0.85rem;
	color: var(--mn-text-secondary, #5C5043);
	margin-bottom: 6px;
	padding: 4px 8px;
	background: var(--mn-bg-warm, #F5EFDC);
	border-left: 3px solid var(--mn-border, #D8CDA8);
	border-radius: 4px;
}
.ll-lab .ll-plot-3d {
	background: var(--mn-surface, #FDFAF1);
	border: 1px solid var(--mn-border-light, #E8DFC6);
	border-radius: 10px;
	height: 500px;
	width: 100%;
	min-width: 0;
	margin-bottom: 14px;
}
.ll-lab .ll-plot-2d {
	background: var(--mn-surface, #FDFAF1);
	border: 1px solid var(--mn-border-light, #E8DFC6);
	border-radius: 10px;
	height: 360px;
	width: 100%;
	min-width: 0;
	margin-bottom: 14px;
}
.ll-lab .ll-loss {
	background: var(--mn-surface, #FDFAF1);
	border: 1px solid var(--mn-border-light, #E8DFC6);
	border-radius: 10px;
	height: 280px;
	width: 100%;
	min-width: 0;
	margin-top: 4px;
}
.ll-lab .ll-readout {
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 10px 14px;
	margin-bottom: 14px;
	background: var(--mn-bg-warm, #F5EFDC);
	border: 1px solid var(--mn-border-light, #E8DFC6);
	border-radius: 10px;
	min-height: 48px;
	flex-wrap: wrap;
}
.ll-lab .ll-readout-label {
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: var(--mn-accent, #6366f1);
	white-space: nowrap;
}
.ll-lab .ll-equation {
	display: flex;
	flex-direction: column;
	gap: 2px;
	flex: 1;
	min-width: 0;
}
.ll-lab .ll-equation .ll-eq-row {
	font-size: 1.15rem;
	color: var(--mn-text, #3A2F25);
}
.ll-lab .ll-equation .ll-eq-meta {
	font-family: var(--mn-font-mono, ui-monospace, monospace);
	font-size: 0.82rem;
	color: var(--mn-text-secondary, #5C5043);
}
.ll-lab .ll-cam-bar {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 10px;
	flex-wrap: wrap;
}
.ll-lab .ll-cam-label {
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: var(--mn-accent, #6366f1);
	margin-right: 4px;
}
.ll-lab .ll-cam-btn {
	background: var(--mn-bg-subtle, #F2EBD9);
	color: var(--mn-text, #3A2F25);
	border: 1px solid var(--mn-border-light, #E8DFC6);
	border-radius: 6px;
	padding: 4px 10px;
	font-size: 0.8rem;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.15s;
	margin: 0;
}
.ll-lab .ll-cam-btn:hover {
	background: var(--mn-surface-raised, #EBE3CE);
}
.ll-lab .ll-cam-hint {
	font-size: 0.75rem;
	color: var(--mn-text-secondary, #5C5043);
	font-style: italic;
	margin-right: auto;
}
.ll-lab .ll-scale-btn {
	background: var(--mn-bg, #FAF8F1);
	color: var(--mn-text, #3A2F25);
	border: 1px solid var(--mn-border-light, #E8DFC6);
	border-radius: 6px;
	padding: 4px 10px;
	font-size: 0.78rem;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.15s;
	margin: 0;
}
.ll-lab .ll-scale-btn.is-active {
	background: var(--mn-accent, #6366f1);
	color: white;
	border-color: var(--mn-accent, #6366f1);
}
.ll-lab .ll-scale-btn:hover {
	background: var(--mn-accent-light, #e0e7ff);
}
.ll-lab .ll-scale-btn.is-active:hover {
	background: var(--mn-accent-dark, #4338ca);
}
.ll-lab .ll-equation .ll-eq-row {
	display: grid;
	grid-template-columns: 70px max-content 1fr;
	align-items: baseline;
	gap: 10px;
	padding: 4px 0;
	border-bottom: 1px dashed var(--mn-border-light, #E8DFC6);
}
.ll-lab .ll-equation .ll-eq-row:last-child {
	border-bottom: none;
}
.ll-lab .ll-equation .ll-eq-name {
	font-family: var(--mn-font-mono, ui-monospace, monospace);
	font-size: 0.85rem;
	font-weight: 700;
}
.ll-lab .ll-equation .ll-eq-math {
	font-size: 1.05rem;
	color: var(--mn-text, #3A2F25);
}
.ll-lab .ll-equation .ll-eq-meta {
	font-family: var(--mn-font-mono, ui-monospace, monospace);
	font-size: 0.78rem;
	color: var(--mn-text-secondary, #5C5043);
	text-align: right;
}
</style>

<div class="ll-lab">
	<h4 class="ll-title">Loss Landscape — Interactive</h4>
	<p class="ll-sub">Single-neuron regression on 1-D data. Two optimizers are pre-selected; press Start and watch the descent.</p>

	<div class="ll-controls">
		<div class="ll-card">
			<h4>Data</h4>
			<label for="ll-x">x (comma-separated):</label>
			<textarea id="ll-x">0, 1, 2, 3, 4</textarea>
			<label for="ll-y">y (comma-separated):</label>
			<textarea id="ll-y">1.0, 3.0, 5.0, 7.0, 9.0</textarea>
			<div class="ll-examples">
				<button type="button" onclick="loadExample('linear')">Line (y=2x+1)</button>
				<button type="button" onclick="loadExample('linear_negative')">Line (y=-0.5x-0.8)</button>
				<button type="button" onclick="loadExample('parabola')">Parabola (y=x²)</button>
				<button type="button" onclick="loadExample('sine')">Sine</button>
			</div>
		</div>

		<div class="ll-card">
			<h4>Model</h4>
			<label for="ll-act">Activation:</label>
			<select id="ll-act">
				<option value="linear" selected>Linear</option>
				<option value="relu">ReLU</option>
				<option value="tanh">Tanh</option>
				<option value="sigmoid">Sigmoid</option>
			</select>

			<h4>Optimizers</h4>
			<div class="ll-opts">
				<label class="ll-opt-label"><input type="checkbox" class="ll-opt" value="SGD" checked> SGD</label>
				<label class="ll-opt-label"><input type="checkbox" class="ll-opt" value="Momentum"> Momentum</label>
				<label class="ll-opt-label"><input type="checkbox" class="ll-opt" value="Adam" checked> Adam</label>
				<label class="ll-opt-label"><input type="checkbox" class="ll-opt" value="RMSProp"> RMSProp</label>
			</div>

			<label for="ll-lr">Learning rate:</label>
			<input type="number" id="ll-lr" value="0.05" step="0.005" min="0.0001" max="1">

			<label for="ll-epochs">Epochs:</label>
			<input type="number" id="ll-epochs" value="100" min="1" max="5000">
		</div>
	</div>

	<div class="ll-readout">
		<div id="ll-original-eq" class="ll-original-eq" style="display:none;"></div>
		<span class="ll-readout-label">Trained models</span>
		<div id="ll-equation" class="ll-equation"></div>
	</div>

	<div class="ll-cam-bar">
		<span class="ll-cam-label">3-D view</span>
		<button type="button" class="ll-cam-btn" onclick="setCam3D('iso')">Isometric</button>
		<button type="button" class="ll-cam-btn" onclick="setCam3D('top')">Top</button>
		<button type="button" class="ll-cam-btn" onclick="setCam3D('front')">Front</button>
		<button type="button" class="ll-cam-btn" onclick="setCam3D('side')">Side</button>
		<button type="button" class="ll-cam-btn" onclick="setCam3D('reset')">Reset</button>
		<span class="ll-cam-hint">drag = rotate · scroll = zoom · shift-drag = pan</span>
		<button type="button" class="ll-scale-btn is-active" id="ll-scale-log"   onclick="setScale3D('log')">Log z</button>
		<button type="button" class="ll-scale-btn"            id="ll-scale-linear" onclick="setScale3D('linear')">Linear z</button>
	</div>

	<div class="ll-run-bar">
		<button type="button" id="ll-start" class="ll-run-btn" onclick="startExperiment()">Start</button>
		<button type="button" id="ll-stop" class="ll-run-btn" onclick="stopExperiment()" style="display:none;">Stop</button>
		<div id="ll-status" class="ll-status">Ready.</div>
		<div class="ll-progress-wrap">
			<div id="ll-progress" class="ll-progress" style="width:0%;"></div>
		</div>
	</div>

	<div id="ll-3d-plot" class="ll-plot-3d" data-plot-theme="self"></div>

	<div id="ll-fit-plot" class="ll-plot-2d" data-plot-theme="self"></div>
	<div id="ll-loss-plot" class="ll-loss" data-plot-theme="self"></div>
</div>

<div class="md" data-mathlevel="50" data-optionaltitle="Why naive plots of the landscape lie">

### Why naive plots of the landscape lie

A ReLU network has an embarrassing symmetry. Multiply the weights of layer $\ell$ by any positive number $c$ and divide the next layer by $c$:

$$f\!\left(x;\,\theta\right) \;=\; f\!\left(x;\;\theta\text{ with } W_\ell \mapsto c\,W_\ell,\; W_{\ell+1}\mapsto \tfrac{1}{c}W_{\ell+1}\right).$$

The function is identical. The two parameterizations sit at the *same point* on the landscape (same training loss, same outputs), but a plot of $\mathcal{L}(\theta + \alpha\,d)$ around them looks completely different: one appears "sharp", the other "flat", at random. \citeauthor{dinh2017sharpness} (\citeyear{dinh2017sharpness}) exploited this to build equivalent networks with arbitrarily large "sharpness". The standard sharpness measure was broken. BatchNorm \cite{ioffe2015batchnorm} makes the symmetry even stronger: rescaling any filter by any positive factor leaves the network unchanged.

The fix from \citeauthor{li2018losslandscape}: instead of a random Gaussian direction $d$, rescale each *filter* of $d$ so it has the same Frobenius norm as the corresponding filter of $\theta^\star$. Only then is a 2-D plot comparable across architectures and across runs.

</div>

<div class="md" data-mathlevel="55" data-optionaltitle="Non-convexity comes from the non-linearities, not from depth">

### Non-convexity comes from the non-linearities, not from depth

A purely linear deep network, just stacked matrices with no activation function between them, has a loss surface with no spurious local minima at all. Every critical point is either a global minimum or a saddle. \citeauthor{saxe2014deep} (\citeyear{saxe2014deep}) showed this analytically for deep linear networks; \citeauthor{kawaguchi2016deep} (\citeyear{kawaguchi2016deep}) and \citeauthor{telgarsky2016wars} (\citeyear{telgarsky2016wars}) extended the result.

So where does the non-convexity of real networks come from? From the activation functions. ReLU, sigmoid, GELU: every nonlinearity bends the function and creates the possibility of bad local minima. Depth alone is harmless. This is why residual connections help so much: each residual block is asked to learn only a small adjustment to the running state, so the overall transformation stays close to linear, and the loss surface stays well-behaved. \citeauthor{lu2017expressive} (\citeyear{lu2017expressive}) reviews the broader picture.

</div>

<div class="md" data-mathlevel="50" data-optionaltitle="Saddles outnumber minima in high dimensions">

### Saddles outnumber minima in high dimensions

For a long time, the worry was that local minima would trap gradient descent. \citeauthor{dauphin2014saddle} (\citeyear{dauphin2014saddle}) showed this worry is mostly backwards. In a high-dimensional non-convex function:

* local minima are exponentially rare (proportional to $e^{-c\,d}$),
* saddles (curving up in some directions, down in others) are exponentially common (proportional to $e^{+c\,d}$).

A "stuck plateau" is almost never a valley floor. It is a saddle whose gradient happens to be tiny. Newton-class methods slow down at saddles too, which is why classical second-order optimizers struggle on deep nets. \citeauthor{dauphin2014saddle}'s **Saddle-Free Newton** escapes them by ignoring the negative eigenvalues of the Hessian. Plain SGD escapes them for free, because the stochastic noise of mini-batches is exactly the kick needed to dislodge the ball off a saddle along its descending direction. That is the modern view of deep-net optimization.

The mini-batch noise does more than kick the ball off saddles. Each mini-batch gives a slightly different gradient, so the surface SGD effectively optimizes is the true loss convolved with the noise distribution. This smoothed surface has fewer saddles, fewer sharp minima, flatter basins. \citeauthor{smithle2018bayesian} (\citeyear{smithle2018bayesian}) and \citeauthor{mandt2017variational} (\citeyear{mandt2017variational}) made this precise: small-batch SGD is approximately sampling from a Boltzmann-like distribution $p(\theta) \propto e^{-\mathcal{L}(\theta)/T}$ where the temperature $T$ is set by the learning rate and batch size. Higher temperature (smaller batch, larger learning rate) flattens the effective surface and biases the trajectory toward wide basins. This is the deepest reason mini-batch noise is a feature, not a bug.

<figure>
<img src="saddle_hyperbolic_paraboloid.png" alt="The hyperbolic paraboloid z = x^2 - y^2, the canonical saddle surface">
<figcaption class="md">
The hyperbolic paraboloid $z = x^2 - y^2$: a surface that goes up in one direction and down in another, the canonical shape of a high-dimensional saddle point. \cite[Hyperbolic paraboloid, Wikimedia Commons, CC0]{hyperbolic_paraboloid_saddle}
</figcaption>
</figure>

</div>

<div class="md" data-mathlevel="55" data-optionaltitle="Sharp minima, flat minima, and the oldest debate in deep learning">

### Sharp minima, flat minima, and the oldest debate in deep learning

The intuition goes back to \citeauthor{hochreiter1991vanishing}'s \citeyear{hochreiter1991vanishing} diploma thesis: a minimum inside a wide, flat basin should generalize, because small perturbations of $\theta$ keep the loss low. A narrow, sharp minimum memorizes the training set but blows up on test.

\citetitle{keskar2016largebatch} (\citeyear{keskar2016largebatch}) sharpened this empirically: large-batch SGD finds sharper minima than small-batch SGD, and the sharp-minimum runs generalize *worse* on ImageNet. The story is not so clean once \citeauthor{dinh2017sharpness} (\citeyear{dinh2017sharpness}) is added. Because of the ReLU and BatchNorm rescaling symmetry above, every sharp minimum can be reparameterized into an equivalent flat one. "Sharp" was not a property of the minimum. It was an artifact of the parameterization. \citeauthor{smithle2018bayesian} (\citeyear{smithle2018bayesian}) reframed SGD as approximate Bayesian inference: small-batch noise is not a bug but a prior that biases the trajectory toward wide valleys.

The live descendants of this debate are **Sharpness-Aware Minimization** \cite{foret2021sam}, which explicitly adds a "be flat" penalty to the loss. Too flat, and the gradient signal vanishes; too sharp, and the optimizer oscillates. SAM works because the loss depends on the data and parameters; a step that is locally flat on the training set may not be flat on the test set, so SAM evaluates the loss at a small perturbation around the current point and descends from there.

</div>

<div class="md" data-mathlevel="60" data-optionaltitle="Skip connections reshape the landscape">

### Skip connections reshape the landscape

The two surface plots at the top of this chapter are the same architecture, ResNet-56 on CIFAR-10, trained the same way. The only difference is whether the residual connections are present. With them, the landscape is a single smooth basin. Without them, the landscape is chaotic, full of competing peaks, and the test error roughly *doubles*.

The mechanism is concrete. A residual block computes

$$h_{\ell+1} \;=\; h_\ell \;+\; F_\ell(h_\ell),$$

so the *change* across the block is just $F_\ell(h_\ell)$, the small adjustment the layer learned. During backprop, the gradient signal has two paths back to the input: through $F_\ell$ and through the skip path. As long as the layer's learned adjustment stays bounded, the skip path keeps the gradient flowing even when the other path is near zero. \citeauthor{he2016identity} (\citeyear{he2016identity}) showed this empirically with a pre-activation analysis: a 1001-layer ResNet trains without difficulty because the skip path preserves the signal layer to layer.

\citetitle{li2018losslandscape}'s contribution was to see the consequence on the landscape. A 110-layer ResNet and a 20-layer ResNet have nearly the same low-loss contour width when skip connections are present. Without skips, the 110-layer net has no usable basin at all. The skip connection does not just help optimization. It changes the geometry of the surface the optimizer walks on.

</div>

<div class="md" data-mathlevel="55" data-optionaltitle="Wide networks have flatter landscapes">

### Wide networks have flatter landscapes

In the same paper, doubling only the number of filters per layer of ResNet-56 ($k=1 \to 2 \to 4 \to 8$, Wide-ResNet) makes the basin flatter and the test error drop monotonically ($5.89\% \to 5.07\% \to 4.34\% \to 3.93\%$ on CIFAR-10). \citeauthor{choromanska2015loss} (\citeyear{choromanska2015loss}) gave a statistical-physics argument for this: in a deep random network, the loss behaves like a disordered physical system in high dimension, and the number of bad local minima drops exponentially with width while the number of good ones barely changes. \citeauthor{nguyen2017loss} (\citeyear{nguyen2017loss}) proved a related result: a deep network with enough width has no bad local minima at all.

</div>

<div class="md" data-mathlevel="60" data-optionaltitle="Minima are connected by flat paths">

### Minima are connected by flat paths

Train two ResNets independently on CIFAR-10 from different random initializations. They land in *different* minima, with different test errors and different predictions on hard examples. Now draw a straight line between them in weight space and plot the loss along the line. \citeauthor{garipov2018mode} (\citeyear{garipov2018mode}) found that the loss along this line is almost flat. The two minima are not separated by a mountain pass. They are connected by a low-loss valley. With a small bend in the line (a "polygonal chain"), every point along the path has nearly training-set error.

The set of well-performing weights is connected. The landscape is one big basin, full of curvature ripples and small ridges but without barriers. This is also why "model ensembling", averaging several independently-trained nets, works so well: every ensemble member is somewhere along this single low-loss manifold, and their disagreements are just different local orientations.

### Grokking: the optimizer slowly switches basins

A small transformer trained on modular arithmetic (like $a \times b \bmod p$) does something striking \cite{grokking}. For the first few hundred steps it memorizes the training examples. Training accuracy reaches 100%, but test accuracy stays near zero. Then, over many thousands of additional steps, the test accuracy suddenly jumps to 100%. The network has swapped a sharp memorizing basin for a flat generalizing one. The architecture did not change. The data did not change. The loss function did not change. The optimizer simply had time to migrate from one basin to another, crossing a barrier that the early-training dynamics could not cross.

This shows two things about the landscape. First, the same initialization sits inside the catchment of many basins, some sharp, some flat, with barriers between them. Second, weight decay (the only thing distinguishing the two basins in this experiment) is what biases the long-time trajectory toward the flat basin. The geometry is fixed; the optimizer's path through it is shaped by regularizers.

</div>

<div class="md" data-mathlevel="60" data-optionaltitle="Skip connections reshape the landscape">

The "one big valley" claim needs a caveat. Swap two neurons in any hidden layer and the network computes exactly the same function, but its position in weight space changes by a large distance. This permutation symmetry means every "true" minimum corresponds to an astronomical number of equivalent positions in raw weight space. A 50-layer net with 256 neurons per layer has roughly $(256!)^{50}$ equivalent positions for each minimum, more than the number of atoms in the observable universe. The landscape is full of copies of the same minimum, scattered across weight space like reflections in a hall of mirrors.

This is why \citeauthor{garipov2018mode} (\citeyear{garipov2018mode}) had to align the neurons of the two networks before drawing the line between their minima. Without alignment, the line passes through garbage (random mismatches between equivalent copies), not through the low-loss valley. The "one connected valley" claim is true in the symmetry-reduced parameter space, where equivalent copies are identified as the same point. In raw parameter space the same statement is false; the same minimum has many disconnected copies. \citeauthor{amit1989modeling} (\citeyear{amit1989modeling}) reviews the broader symmetry structure of neural-network landscapes.

</div>

<div class="md" data-mathlevel="60" data-optionaltitle="SGD travels in an almost one-dimensional subspace">

### SGD travels in an almost one-dimensional subspace

To plot an optimizer's trajectory, you would naturally project it onto a 2-D plane of random directions. \citeauthor{li2018losslandscape}'s section 7 shows this fails almost completely: the trajectory sits in a subspace that random directions do not span. Two random Gaussian vectors in $d$ dimensions are nearly orthogonal; their expected cosine similarity is $\sqrt{2/(\pi d)}$, roughly $10^{-4}$ for a 10-million-parameter model. Projecting onto them collapses the trajectory to a single dot.

PCA on the iterates $\theta_0, \theta_1, \ldots, \theta_T$ recovers what is actually happening. For both SGD and Adam on VGG-9, the first PCA direction captures roughly **99%** of the motion; the second PCA direction captures a small orbit around it. Gradient descent is effectively one-dimensional. There is a single dominant direction in weight space that the optimizer follows, and the rest of the billion dimensions are nearly silent.

</div>

<div class="md">

### Putting it together

The picture that survives the most careful empirical work \cite{li2018losslandscape,garipov2018mode,choromanska2015loss} is roughly this:

1. The landscape is one connected valley. Local minima are exponentially rare. Saddles dominate but are easy to escape with stochastic noise. Independent runs find different points, all connected by low-loss paths (once permutation symmetries are factored out).
2. Skip connections reshape the topology. They replace chaotic multi-basin terrain with one smooth basin. As a side effect, trainable 100-layer nets exist.
3. Width flattens. Wider networks have wider basins. Sharpness and generalization error track each other when measured with filter normalization.
4. Optimizers are nearly one-dimensional. The trajectory lives in a subspace spanned by a handful of PCA directions; the other $10^{10}$ coordinates are nearly constant. The optimizer sees a noise-smoothed version of the surface, not the raw one, which is why small batches help \cite{mandt2017variational}.
5. Flat generalizes, sharp memorizes, but only when "flat/sharp" is defined by a scale-invariant measure (filter-normalized Hessian, local entropy \cite{chaudhari2016entropysgd}, or SAM \cite{foret2021sam}). The naive measures are broken by ReLU rescaling.
6. Architecture determines what basins exist. A plain feedforward net and a ResNet have different loss surfaces over the same data, because they have different reachable weight configurations. Choosing an architecture is choosing which family of basins the optimizer can land in.
7. The same basin can be reached by very different paths. SGD, Adam, momentum, and SAM all settle into basins of comparable quality on a given architecture; the regularizer (weight decay) and the noise (mini-batch size) decide which basin wins over long training \cite{grokking}.

</div>

<div class="optional md" data-headline="Origins of the word 'landscape'">
The metaphor "energy landscape" entered physics through \citeauthor{wales2003energy} (\citeyear{wales2003energy}) and was first applied to neural networks by \citeauthor{hopfield1982} (\citeyear{hopfield1982}), whose associative-memory networks literally used the energy of a physical spin system as the loss function. The systematic 2-D visualization that turned the metaphor into a diagnostic tool is \citeauthor{li2018losslandscape} (\citeyear{li2018losslandscape}); their `tomgoldstein/loss-landscape` GitHub repo is the de-facto standard for loss-landscape plots today.
</div>
