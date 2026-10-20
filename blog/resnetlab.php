<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Deep Learning Mechanics: ResNets & Vanishing Gradients
description: Why plain networks fail at depth, and the elegant residual shortcut that fixed everything.
icon: &#128739;
part: 3
order: 3
color: emerald
topics: math-i, math-ii, architecture
tags: math-heavy
math: 60
-->

<div class="md" data-mathlevel="60" data-optionaltitle="The Vanishing Gradient Problem">

## The Vanishing Gradient Problem

To train a neural network, we use **Backpropagation**. This algorithm calculates how much each weight contributed to the final error (loss) so we can adjust the weights to reduce that error.

Mathematically, we use the **Chain Rule** of calculus. In a standard “Plain” network (like VGG or AlexNet), the input $x$ passes through a series of layers to produce output $y$.

$$ y = f_L(f_{L-1}(... f_1(x)...)) $$

During backpropagation, to find the gradient of the loss $\mathcal{L}$ with respect to the first layer's weights, we must multiply the derivatives of *every* layer in the network:

$$ \frac{\partial \mathcal{L}}{\partial x_0} = \frac{\partial \mathcal{L}}{\partial x_L} \cdot \underbrace{\frac{\partial x_L}{\partial x_{L-1}} \cdot \frac{\partial x_{L-1}}{\partial x_{L-2}} \cdots \frac{\partial x_1}{\partial x_0}}_{\text{Multiplicative Chain}} $$

**Why “Vanishing”?** If the derivatives (gradients) in this chain are small (e.g., $< 1$), multiplying many of them together causes the result to shrink exponentially.

* **Plain Network:** $0.9 \times 0.9 \times 0.9 \dots \approx 0$
* **Result:** The early layers stop learning because their gradient update is effectively zero. Deep networks become impossible to train.

This was first mathematically accurately described by \citeauthor{hochreiter1991vanishing} in his \cite[Diplomarbeit]{hochreiter1991vanishing}, while the term 'Vanishing Gradient' was first coined by Yoshua Bengio et al. in their \citeyear{bengio1994learning} paper '\citetitle{bengio1994learning}'.

## The Residual Solution

ResNet (short for *Residual Network*) was introduced by Kaiming He et al. in \citeyear{he2015resnet} in their paper '\citetitle{he2015resnet}', and won the ImageNet competition in December 2015. The skip-connection idea itself, however, did not originate there: Hochreiter's \citeyear{hochreiter1991vanishing} analysis already contained the germ of the idea, and \citeauthor{highway2015}'s **Highway Networks** \citeyear{highway2015} (May 2015, seven months earlier) introduced learnable gating on top of skip connections and demonstrated training of truly deep feedforward networks with hundreds of layers. ResNet can be viewed as the special case of a Highway Network whose gates are always open (see the History chapter). ResNet changes the fundamental building block of the convolution. Instead of trying to learn the mapping $H(x)$ directly, we ask the network to learn the **residual** (the *difference*) $F(x) := H(x) - x$. The original mapping is reconstructed as:

$$ y = F(x, \{W_i\}) + x $$

Where:
* $x$ is the input to the block (the “Identity Connection”).
* $F(x)$ is the learned transformation (usually 2 or 3 convolution layers).

**The Gradient “Superhighway”:** Let's look at the gradient of this new block during backpropagation:

$$ \frac{\partial y}{\partial x} = \frac{\partial (F(x) + x)}{\partial x} = \frac{\partial F(x)}{\partial x} + \mathbf{I} $$

The **$+\mathbf{I}$** term is the magic. It ensures that the gradient can flow *directly* from the later layers to the earlier layers without being multiplied by the weights of the intermediate layers. Even if the weights in $F(x)$ are very small (causing $\frac{\partial F}{\partial x} \approx 0$), the gradient signal is preserved by the identity term. Formally, the backpropagation recursion through a residual block involves the factor $\mathbf{I} + J_F$ (where $J_F$ is the Jacobian of the residual function) rather than $J_F$ alone — so the gradient is never *multiplied by* a potentially tiny matrix, only *shifted* by one. The full analysis is in \citeauthor{petersen2024mathdl} (\citeyear{petersen2024mathdl}), Ch.\ 17.1.

## Handling Dimension Mismatches ($1 \times 1$ Convs)

The equation $y = F(x) + x$ requires that the dimensions of $x$ and $F(x)$ be identical so they can be added element-wise. However, Convolutional Neural Networks (CNNs) often change dimensions to process features at different scales:
1.  **Downsampling:** Reducing Height/Width (Stride > 1).
2.  **Channel Expansion:** Increasing the number of filters (Depth).

When the dimensions don't match, we cannot simply add $x$. We must transform $x$ using a **projection shortcut** ($W_s$):

$$ y = F(x, \{W_i\}) + W_s x $$

**The $1 \times 1$ Convolution:** The most common way to implement $W_s$ is a **$1 \times 1$ Convolution**.
* **Spatial:** A $1 \times 1$ kernel does not look at neighboring pixels; it preserves the spatial height and width ($H \times W$).
* **Depth:** It acts as a linear projection across the channels. If input $x$ has $C_\text{in}$ channels and we need $C_\text{out}$ channels, the $1 \times 1$ layer performs a weighted sum of the input channels to produce the desired output depth.


**Mathematical Operation at a single pixel $(i, j)$:** If input $x \in \mathbb{R}^{H \times W \times C_\text{in}}$ and we want output $y \in \mathbb{R}^{H \times W \times C_\text{out}}$:

$$ y_{i,j,k} = \sum_{c=0}^{C_\text{in}-1} w_{k,c} \cdot x_{i,j,c} $$

This allows the network to match the “shape” of the main path $F(x)$ so the residual connection can still function, keeping the flow of gradients intact.

</div>

<style>
#gradient-highway { --lab-accent: var(--mn-emerald); --lab-accent-2: var(--mn-sky); }
#gradient-highway .gh-plot { width: 100%; height: 320px; }
#gradient-highway .gh-net svg { display: block; width: 100%; height: auto; overflow: visible; }
#gradient-highway .gh-edge { stroke: var(--mn-text-muted); stroke-width: 2; opacity: .45; }
#gradient-highway .gh-skip { fill: none; stroke: var(--mn-emerald); stroke-width: 1.8; stroke-dasharray: 4 3; opacity: .8; }
#gradient-highway .gh-node { stroke: var(--mn-surface); stroke-width: 2; transition: opacity .35s ease; }
#gradient-highway .gh-node.is-plain { fill: var(--mn-rose); }
#gradient-highway .gh-node.is-res { fill: var(--mn-emerald); }
#gradient-highway .gh-plus { fill: #fff; font: 700 10px var(--mn-font-mono); text-anchor: middle; pointer-events: none; }
#gradient-highway .gh-lbl { fill: var(--mn-heading); font: 700 11px var(--mn-font-body); }
#gradient-highway .gh-cap { fill: var(--mn-text-muted); font: 10px var(--mn-font-body); }
#gradient-highway .mnlab-stat[data-tone="bad"] .v { color: var(--mn-rose); }
#gradient-highway .mnlab-stat[data-tone="good"] .v { color: var(--mn-emerald); }
#gradient-highway .gh-shape { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; font-size: .82rem; }
#gradient-highway .gh-shape b { font-family: var(--mn-font-mono); text-align: right; color: var(--mn-heading); }
#gradient-highway .gh-shape .is-sum { border-top: 1px solid var(--mn-border); padding-top: 4px; color: var(--mn-emerald); }
#gradient-highway .gh-shape .is-in { color: var(--mn-coral); }
#gradient-highway .gh-cardtitle { font-size: .68rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--mn-text-muted); margin-bottom: 8px; }
@container mnlab (max-width: 620px) { #gradient-highway .gh-plot { height: 260px; } }
</style>

<div class="mnlab" id="gradient-highway" data-interactive>
	<div class="mnlab-head">
		<div>
			<div class="mnlab-kicker">Interactive lab</div>
			<div class="mnlab-title">The Gradient Highway</div>
			<p class="mnlab-sub">An error signal of size 1 starts at the loss and is sent back through every layer. A plain layer multiplies it by its local derivative; a residual block multiplies it by 1 + ∂F/∂x. Make the network deeper and see who still hears the signal.</p>
		</div>
	</div>

	<div class="mnlab-well gh-net" data-gh="net"></div>

	<div class="mnlab-well" style="margin-top: 12px; padding: 6px 4px 2px;">
		<div class="gh-plot" data-gh="plot" data-plot-theme="self"></div>
	</div>
	<div class="mnlab-legend" style="margin: 8px 2px 0;">
		<span><i style="background: var(--mn-rose);"></i>plain network: ∏ a<sub>l</sub></span>
		<span><i style="background: var(--mn-emerald);"></i>residual network: ∏ (1 + b<sub>l</sub>)</span>
		<span>node brightness = gradient size at that layer</span>
	</div>

	<div class="mnlab-grid mnlab-grid--2" style="margin-top: 14px; gap: 6px 24px;">
		<label class="mnlab-ctrl">
			<span class="mnlab-ctrl-top"><span class="mnlab-label">Network depth</span><span class="mnlab-val" data-gh="depthv">20</span></span>
			<input type="range" data-gh="depth" min="2" max="100" step="1" value="20" aria-label="Network depth">
		</label>
		<label class="mnlab-ctrl">
			<span class="mnlab-ctrl-top"><span class="mnlab-label">Local derivative per plain layer</span><span class="mnlab-val" data-gh="gainv">0.9</span></span>
			<input type="range" data-gh="gain" min="0.5" max="1.3" step="0.01" value="0.8" aria-label="Local derivative per layer">
		</label>
	</div>
	<div class="mnlab-row" style="margin-top: 8px;">
		<button type="button" class="mnlab-btn mnlab-btn--ghost" data-gh="reseed">🎲 New random initialization</button>
	</div>

	<div class="mnlab-grid mnlab-grid--3" style="margin-top: 14px;">
		<div class="mnlab-stat"><span class="k">Plain: gradient at layer 1</span><span class="v" data-gh="gp">–</span></div>
		<div class="mnlab-stat"><span class="k">Residual: gradient at layer 1</span><span class="v" data-gh="gr">–</span></div>
		<div class="mnlab-stat"><span class="k">Residual / plain</span><span class="v" data-gh="ratio">–</span></div>
	</div>
	<div class="mnlab-note" data-gh="note" aria-live="polite"></div>

	<div class="mnlab-grid mnlab-grid--2" style="margin-top: 16px;">
		<div class="mnlab-well">
			<div class="gh-cardtitle">Identity shortcut — shapes match</div>
			<div class="gh-shape">
				<span>Input x</span><b>[64, 64, 3]</b>
				<span>Conv path F(x)</span><b>[64, 64, 3]</b>
				<span class="is-sum">Output F(x) + x</span><b class="is-sum">[64, 64, 3]</b>
			</div>
		</div>
		<div class="mnlab-well">
			<div class="gh-cardtitle">Projection shortcut — 4 → 2 channels</div>
			<div class="gh-shape">
				<span>Source x</span><b class="is-in">[H, W, 4]</b>
				<span>1×1 conv W<sub>s</sub></span><b>[1, 1, 4, 2]</b>
				<span class="is-sum">Projected W<sub>s</sub>x</span><b class="is-sum">[H, W, 2]</b>
			</div>
			<p class="mnlab-hint" style="margin: 8px 0 0;">y = F(x, {W<sub>i</sub>}) + W<sub>s</sub>x — the 1×1 kernel mixes channels at each pixel without looking at its neighbours.</p>
		</div>
	</div>
</div>
