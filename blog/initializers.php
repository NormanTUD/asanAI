<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Initializers: Starting a Network in the Right Regime
description: Why weight initialization decides whether signals and gradients survive deep stacks, and how the standard schemes differ.
icon: &#127793;
part: 2
order: 14
color: emerald
topics: training, architecture, math-ii
tags: math-heavy
math: 45
-->

<link rel="stylesheet" href="initializers.css?v=<?php echo (int) @filemtime(__DIR__ . '/initializers.css'); ?>">

<div class="md">
<div class="init-hero">
<h2>Initializers: Starting a Network in the Right Regime</h2>
<p>Before the first gradient step, every weight matrix needs a starting distribution. That choice decides whether activations and gradients stay in a usable range through depth, or collapse or explode before learning starts.</p>
</div>

## Why initialization matters

A linear layer mixes its inputs: each output is a weighted sum over the fan-in. If the weights are too large, the variance grows layer after layer; if they are too small, it shrinks toward zero. With a nonlinearity in between, the same argument applies to the derivative that carries the gradient backward. The goal is a **critical regime**: variance roughly preserved from layer to layer.

Initialization also breaks symmetry. If every weight were zero, every hidden unit in a layer would receive the same gradient and stay identical. Random values make units start different. The question is not “random or not”, but **which variance and which correlations** the random values should have.
</div>

<div class="init-controls">
	<div class="init-control">
		<label for="init-scheme">Initializer</label>
		<select id="init-scheme">
			<option value="lecun">LeCun normal</option>
			<option value="xavier" selected>Xavier / Glorot uniform</option>
			<option value="he">He normal</option>
			<option value="orthogonal">Orthogonal</option>
			<option value="gpt2">GPT-2 normal (σ = 0.02)</option>
			<option value="uniform">Uniform ±1/√fan_in</option>
		</select>
	</div>
	<div class="init-control">
		<label for="init-act">Activation</label>
		<select id="init-act">
			<option value="tanh">tanh</option>
			<option value="relu">ReLU</option>
			<option value="gelu" selected>GELU</option>
		</select>
	</div>
	<div class="init-control">
		<label for="init-fan">Fan-in: <b id="init-fan-val">256</b></label>
		<input type="range" id="init-fan" min="16" max="2048" step="16" value="256">
	</div>
	<div class="init-control">
		<label for="init-depth">Depth: <b id="init-depth-val">24</b></label>
		<input type="range" id="init-depth" min="2" max="64" step="2" value="24">
	</div>
</div>

<div class="init-grid">
	<div class="init-card"><div id="init-variance-plot" class="init-plot"></div><p class="init-note" id="init-variance-note"></p></div>
	<div class="init-card"><canvas id="init-hist" class="init-hist" aria-label="Histogram of initial weights"></canvas><p class="init-note" id="init-hist-note"></p></div>
</div>

<div class="md">
## The historical ladder

**LeCun (1998).** LeCun's efficient backprop recipe normalized each layer's weights so that outputs start with a sensible variance, using a standard deviation proportional to $1/\sqrt{\text{fan-in}}$ (\cite[LeCun et al., 1998]{lecun1998gradient}). The idea was practical: keep the sigmoid/tanh units out of saturation.

**Xavier / Glorot (2010).** Glorot and Bengio analyzed variance propagation through tanh layers and proposed a compromise between fan-in and fan-out, usually written as a uniform limit $\sqrt{6/(\text{fan-in}+\text{fan-out})}$ (\cite[Glorot & Bengio, 2010]{glorot2010understanding}). It keeps forward variance roughly stable and is still a sensible default for symmetric activations.

**Orthogonal (2013).** Saxe, McClelland and Ganguli showed that deep linear networks have exact learning dynamics and that orthogonal initializations avoid the shrinking/exploding of singular values during training (\cite[Saxe et al., 2014]{saxe2014deep}). Orthogonal rows or columns start with independent directions and are popular for recurrent or very deep models.

**He (2015).** ReLU zeroes half of its inputs, so a tanh-calibrated scheme loses variance. He et al. compensated with $\sqrt{2/\text{fan-in}}$, doubling the Xavier variance for rectifiers (\cite[He et al., 2015]{he2015delving}). GELU is smoother, but the same intuition often applies.

**GPT-2 and modern stacks (2019–).** GPT-2 initialized weights from a normal distribution with $\sigma = 0.02$ and scaled the residual projections by $1/\sqrt{N}$ (here $1/\sqrt{2N}$ for two projections per block) so that the residual sum does not grow with depth (\cite[Radford et al., 2019]{gpt2}). Modern Llama/Qwen/DeepSeek stacks combine their own normal or framework defaults with pre-normalization and RMSNorm; the exact recipe is implementation-specific, but the critical-regime reasoning is the same.
</div>

<div class="md">
## What to choose today

For a small pre-LN Transformer, **Xavier** is a safe default for tanh-like activations, **He** for ReLU/GELU, and **orthogonal** when you care about stable singular values. GPT-2's $\sigma=0.02$ with scaled residual projections is a useful reminder that initialization and residual scaling are a package: changing one without the other can push the stream off balance. Framework defaults (for example PyTorch's Kaiming-uniform Linear initialization) are reasonable starting points, not laws; the validation loss is the referee.

The page above is a variance model, not a substitute for training. It shows the mechanism: change the activation or the fan-in and watch the variance trajectory bend.
</div>

<div class="mn-quiz" data-quiz="initializers"><script type="application/json">{"title": "Initializers", "questions": [{"q": "What is the main goal of a variance-preserving initializer?", "options": ["Keep signal and gradient variance usable through depth", "Make every weight matrix exactly orthogonal at every step", "Remove the need for normalization layers in the network", "Guarantee that the training loss decreases every epoch"], "answer": 0, "explain": "The critical regime keeps signal and gradient variance roughly stable."}, {"q": "Why does He initialization use a larger variance than Xavier?", "options": ["ReLU zeroes half its inputs, so it needs extra variance", "It is designed only for recurrent networks with shared weights", "It assumes the input data has already been normalized to zero", "It compensates for the absence of any bias parameters"], "answer": 0, "explain": "The rectifier drops negative activations; He scaling compensates."}, {"q": "What does orthogonal initialization control?", "options": ["Control the starting matrix's singular directions", "The exact token vocabulary used by the language model", "The number of attention heads in each transformer block", "The temperature used when sampling the next token"], "answer": 0, "explain": "Orthogonal rows or columns start with independent directions."}]}</script></div>
