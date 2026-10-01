<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Loss Landscape
description: The high-dimensional surface every optimizer walks on — why it is non-convex but mostly benign, how skip connections flatten it, and how the saddles outnumber the minima.
icon: &#127956;
part: 2
order: 5
color: sky
topics: training, math-i, math-ii
tags: math-heavy
math: 55
-->

<div class="md">

## The Loss Landscape

A neural network is a parameterized function $f(x;\theta)$ with parameters $\theta \in \mathbb{R}^d$ (for a modern LLM, $d$ is in the billions). Training means finding the $\theta$ that makes $f$ predict the data. We measure "predicts well" with a scalar **loss** $\mathcal{L}(\theta)$ that averages a per-example error $\ell$ over the training set:

$$\mathcal{L}(\theta) \;=\; \frac{1}{m}\sum_{i=1}^{m}\ell\!\left(x_i,\,y_i,\,\theta\right).$$

Think of $\theta$ as a single point in a $d$-dimensional space. The value $\mathcal{L}(\theta)$ is the *height* of a landscape above that point. **Training is rolling a ball downhill on this landscape** until it settles into a low valley — that ball's path is the optimizer's trajectory. The whole question of "why does deep learning work?" reduces to the geometry of this landscape: how many valleys it has, how steep they are, how they connect, and which ones generalize.

The phrase "loss landscape" was popularised by \citeauthor{li2018losslandscape} (\citeyear{li2018losslandscape}), who gave the field its first systematic visualizations. The underlying mathematics — non-convex optimization in $10^7$ dimensions — goes back further: \citeauthor{rumelhart1986learning} already noted in \citeyear{rumelhart1986learning} that gradient descent on a non-convex loss works "surprisingly often", and \citeauthor{hochreiter1991vanishing} (\citeyear{hochreiter1991vanishing}) had already linked the geometry to trainability.

</div>

<figure>
<img src="loss_landscape_resnet56_noskip.png" alt="Loss surface of ResNet-56 without skip connections: highly chaotic terrain with sharp cliffs">
<figcaption class="md">
**ResNet-56, no skip connections** — the loss surface is highly chaotic, with steep cliffs and many competing basins. The test error is $\sim 13\%$. \cite[Figure 1a, Li et al., 2018 — MIT-licensed code repo at \texttt{tomgoldstein/loss-landscape}]{li2018losslandscape}
</figcaption>
</figure>

<figure>
<img src="loss_landscape_resnet56_skip.png" alt="Loss surface of ResNet-56 with skip connections: a single smooth convex-ish basin">
<figcaption class="md">
**ResNet-56, with skip connections** — the same architecture, the same training run, but the landscape is now a single smooth near-convex basin. Test error drops to $\sim 6\%$. \cite[Figure 1b, Li et al., 2018 — MIT-licensed code repo at \texttt{tomgoldstein/loss-landscape}]{li2018losslandscape}
</figcaption>
</figure>

<div class="md" data-mathlevel="50" data-optionaltitle="The landscape is a function on a million-dimensional space">

### The landscape is a function on a million-dimensional space

A modern LLM has $\sim 10^{10}$ parameters. The loss is one scalar value at each point of this space. The "landscape" is the graph $\{(\theta, \mathcal{L}(\theta)) : \theta \in \mathbb{R}^d\}$ — a $d{+}1$-dimensional hypersurface that we can never draw. What we *can* do is take a 2-D slice through it: pick a center $\theta^\star$ (a trained minimum) and two random directions $d_1, d_2$, then plot

$$g(\alpha, \beta) \;=\; \mathcal{L}\!\left(\theta^\star + \alpha\, d_1 + \beta\, d_2\right).$$

That is how every figure in this chapter was made.

</div>

<div class="md" data-mathlevel="65" data-optionaltitle="The Aha: scale invariance makes naive plots lie">

### Aha #1 — Scale invariance makes naive plots lie \cite{li2018losslandscape}

A ReLU network $f(x;\theta)$ satisfies an embarrassing symmetry. Multiply the weights of layer $\ell$ by $c > 0$ and divide layer $\ell{+}1$ by $c$:

$$f\!\left(x;\,\theta\right) \;=\; f\!\left(x;\;\theta\text{ with } W_\ell \mapsto c\,W_\ell,\; W_{\ell+1}\mapsto \tfrac{1}{c}W_{\ell+1}\right).$$

The function is identical. The two parameterizations sit at the *same point* on the landscape (same training loss, same outputs), but a plot of $\mathcal{L}(\theta + \alpha\,d)$ around them looks completely different — one appears "sharp", the other "flat", at random. \citeauthor{dinh2017sharpness} (\citeyear{dinh2017sharpness}) exploited this to build equivalent networks with arbitrarily large "sharpness" — the standard sharpness measure was broken. BatchNorm \cite{ioffe2015batchnorm} makes the symmetry even more aggressive: rescaling any filter by any positive factor leaves the network unchanged.

**Li et al.'s fix: filter normalization.** Instead of using a random Gaussian direction $d$, rescale each *filter* of $d$ so it has the same Frobenius norm as the corresponding filter of $\theta^\star$. Only then is a 2-D plot comparable across architectures and across runs. This is why every figure below uses filter-normalized directions and why "sharp vs flat" can finally be discussed honestly.

</div>

<div class="md" data-mathlevel="50" data-optionaltitle="Aha #2: saddles outnumber minima in high dimensions">

### Aha #2 — Saddles outnumber minima in high dimensions \cite{dauphin2014saddle,pascanu2014saddle}

For a long time, the worry was "local minima will trap gradient descent." \citeauthor{dauphin2014saddle} (\citeyear{dauphin2014saddle}) showed this worry is mostly backwards. Apply random-matrix theory to the Hessian $\nabla^2 \mathcal{L}$ of a generic high-dimensional non-convex function:

* the number of *local minima* is exponentially small (proportional to $e^{-c\,d}$),
* the number of *saddles* (curving up in some directions, down in others) is exponentially large (proportional to $e^{+c\,d}$).

A "stuck plateau" is almost never a valley floor — it is a saddle whose gradient happens to be tiny. Newton-class methods slow down at saddles too (the negative Hessian eigenvalue pulls the step sideways), which is why classical second-order optimizers struggle on deep nets. \citeauthor{dauphin2014saddle}'s **Saddle-Free Newton** escapes them by ignoring the negative eigenvalues of the Hessian. Plain SGD escapes them for free, because the stochastic noise of mini-batches is exactly the kick needed to dislodge the ball off a saddle along its descending direction. \citeyear{dauphin2014saddle} was the paper that turned "saddle points are the real obstacle" into the modern view of deep-net optimization.

\sideimage[float]{saddle_hyperbolic_paraboloid.png}{The hyperbolic paraboloid $z = x^2 - y^2$: a surface that goes up in one direction and down in another — the canonical shape of a high-dimensional saddle point. \cite[Hyperbolic paraboloid, Wikimedia Commons, CC0]{hyperbolic_paraboloid_saddle}}

</div>

<div class="md" data-mathlevel="55" data-optionaltitle="Aha #3: sharp vs flat — the oldest, messiest debate in deep learning">

### Aha #3 — Sharp vs flat: the oldest, messiest debate in deep learning \cite{hochreiter1991vanishing,keskar2016largebatch,dinh2017sharpness,smithle2018bayesian}

The intuition goes back to \citeauthor{hochreiter1991vanishing}'s \citeyear{hochreiter1991vanishing} diploma thesis: a minimum inside a wide, flat basin should generalize, because small perturbations of $\theta$ (i.e., small differences between train and test) keep the loss low. A narrow, sharp minimum memorizes the training set but blows up on test.

\citetitle{keskar2016largebatch} (\citeyear{keskar2016largebatch}) sharpened this empirically: large-batch SGD (thousands of examples per step) finds sharper minima than small-batch SGD (tens of examples), and the sharp-minimum runs generalize *worse* on ImageNet. The story is not so clean once \citeauthor{dinh2017sharpness} (\citeyear{dinh2017sharpness}) is added: because of the ReLU/BatchNorm rescaling symmetry above, *every* sharp minimum can be reparameterized into an equivalent flat one. "Sharp" was not a property of the minimum — it was an artifact of the parameterization. \citeauthor{smithle2018bayesian} (\citeyear{smithle2018bayesian}) reframed SGD as approximate Bayesian inference: small-batch noise is not a bug but a prior that biases the trajectory toward wide valleys.

The live descendants of this debate are \textbf{Sharpness-Aware Minimization} \cite{foret2021sam}, which explicitly adds a "be flat" penalty to the loss, and the **Edge of Stability** phenomenon \cite{cohen2021edgeofstability}, where the sharpness hovers at $2/\eta$ (the inverse of the learning rate) throughout training — too flat, and the gradient signal vanishes; too sharp, and the optimizer oscillates.

</div>

<div class="md" data-mathlevel="60" data-optionaltitle="Aha #4: skip connections are topological surgery on the landscape">

### Aha #4 — Skip connections are topological surgery on the landscape \cite{li2018losslandscape,he2015resnet,he2016identity}

The two surface plots at the top of this chapter are the same architecture, ResNet-56 on CIFAR-10, trained the same way. The only difference is whether the residual connections are present. With them, the landscape is a single smooth basin. Without them, the landscape is chaotic, full of competing peaks, and the test error roughly *doubles*.

The mechanism is exact, not mystical. A residual block computes

$$h_{\ell+1} \;=\; h_\ell \;+\; F_\ell(h_\ell).$$

The Jacobian through the block is $\mathbf{I} + \nabla F_\ell$, not $\nabla F_\ell$. The eigenvalues of $\mathbf{I} + \nabla F_\ell$ are bounded away from zero as long as $\nabla F_\ell$ has bounded entries — the gradient cannot vanish through the skip path. \citeauthor{he2016identity} (\citeyear{he2016identity}) showed this empirically by pre-activation analysis: a 1001-layer ResNet trains without difficulty because the "gradient highway" preserves the signal layer-to-layer.

\citetitle{li2018losslandscape}'s contribution was to *see* the consequence on the landscape: skip connections do not just help optimization — they *reshape the topology*. A 110-layer ResNet and a 20-layer ResNet have nearly the same 0.1-loss contour width; without skips, the 110-layer net has no usable basin at all.

</div>

<div class="md" data-mathlevel="55" data-optionaltitle="Aha #5: wide networks are smoother than narrow ones">

### Aha #5 — Wide networks are smoother than narrow ones \cite{li2018losslandscape,nguyen2017loss}

The same paper, doubling only the number of filters per layer of ResNet-56 ($k=1\to 2 \to 4 \to 8$, Wide-ResNet), makes the basin flatter and the test error drop monotonically ($5.89\% \to 5.07\% \to 4.34\% \to 3.93\%$ on CIFAR-10). Wider is smoother. \citeauthor{choromanska2015loss} (\citeyear{choromanska2015loss}) had earlier given a statistical-physics argument for this: the loss of a *deep* random network lives on the same universality class as a **spherical spin glass** in high dimension, and in that class the number of bad local minima decays exponentially with width while the number of good ones barely changes.

</div>

<div class="md" data-mathlevel="60" data-optionaltitle="Aha #6: minima are connected — one big valley, not isolated islands">

### Aha #6 — Minima are connected. One big valley, not isolated islands. \cite{garipov2018mode}

Train two ResNets independently on CIFAR-10 from different random initializations. They land in *different* minima — different test errors, different predictions on hard examples. Now draw a straight line between them in weight space and plot the loss along the line. \citeauthor{garipov2018mode} (\citeyear{garipov2018mode}) found that the loss along this line is almost flat: the two minima are not separated by a mountain pass; they are connected by a low-loss valley. With a tiny bend in the line (a "polygonal chain"), every point along the path has nearly training-set error.

This is the deepest aha of the field: **the set of well-performing weights is connected**. The landscape is not a Swiss cheese of trapped valleys; it is one big basin, full of curvature ripples and small ridges but without barriers. This is also why "model ensembling" (averaging several independently-trained nets) works so well — every ensemble member is somewhere along this single low-loss manifold, and their disagreements are just different local orientations.

</div>

<div class="md" data-mathlevel="60" data-optionaltitle="Aha #7: SGD lives in an almost 1-D subspace of the landscape">

### Aha #7 — SGD lives in an almost 1-D subspace of the landscape \cite{li2018losslandscape}

To plot an optimizer's trajectory, you would naturally project it onto a 2-D plane of random directions. \citeauthor{li2018losslandscape}'s §7 shows this fails almost completely: the trajectory sits in a subspace that random directions do not span. Two random Gaussian vectors in $d$ dimensions are nearly orthogonal; their expected cosine similarity is $\sqrt{2/(\pi d)}$ — about $10^{-4}$ for a 10-million-parameter model. Projecting onto them collapses the trajectory to a single dot.

PCA on the iterates $\theta_0, \theta_1, \ldots, \theta_T$ recovers what is actually happening. The result is striking: for both SGD and Adam on VGG-9, the first PCA direction captures roughly **99%** of the motion; the second PCA direction captures a small orbit around it. **Gradient descent is effectively one-dimensional.** The "low-frequency" intuition is now rigorous: there is a single dominant direction in weight space that the optimizer follows, and the rest of the billion dimensions are nearly silent.

</div>

<div class="md" data-mathlevel="40" data-optionaltitle="Walk it yourself">

### Walk it yourself

Below is a small non-convex 2-D landscape that captures the essential geometry: one wide basin (a flat, generalizing minimum) and one narrow spike (a sharp, memorizing minimum). Drag the ball — it follows $-\nabla \mathcal{L}$, the direction of steepest descent. Watch how it almost always escapes the spike and settles into the wide basin.

<div id="loss-landscape-3d" class="plot-container" data-plot-theme="self" style="height: 420px;"></div>

<div style="display:flex; gap:15px; flex-wrap:wrap; align-items:center; background:#f8fafc; padding:14px; border-radius:8px; margin-top:8px;">
<button class="btn" onclick="LossLandscape3D.reset()">&#8634; Reset ball</button>
<label>Learning rate $\eta$:&nbsp;
<input type="range" id="ll-lr" min="0.005" max="0.4" step="0.005" value="0.08" oninput="LossLandscape3D.setLr(this.value)" style="width:160px;">
<span id="ll-lr-val" style="font-family:monospace;">0.08</span>
</label>
<label><input type="checkbox" id="ll-noise" onchange="LossLandscape3D.setNoise(this.checked)"> mini-batch noise</label>
<span id="ll-status" style="margin-left:auto; font-family:monospace;"></span>
</div>

</div>

<div class="md">

### Putting it together

The picture that survives the most careful empirical work \cite{li2018losslandscape,garipov2018mode,choromanska2015loss} is roughly this:

1. **The landscape is one connected valley.** Local minima are exponentially rare; saddles dominate but are easy to escape with stochastic noise. Independent runs find different points, all connected by low-loss paths.
2. **Skip connections reshape the topology.** They replace chaotic multi-basin terrain with one smooth, convex-ish basin — and as a side effect, trainable 100-layer nets exist.
3. **Width flattens.** Wider networks have wider basins; sharpness and generalization error track each other when measured with filter normalization.
4. **Optimizers are nearly one-dimensional.** The trajectory lives in a subspace spanned by a handful of PCA directions; the other $10^{10}$ coordinates are nearly constant.
5. **Flat generalizes, sharp memorizes.** But only when "flat/sharp" is defined by a scale-invariant measure (filter-normalized Hessian, local entropy \cite{chaudhari2016entropysgd}, or SAM \cite{foret2021sam}) — the naive measures are broken by ReLU rescaling.

The empirical landscape of deep learning is not a swamp; it is a single, well-connected, mostly-smooth valley that gets smoother the wider and deeper the network is — *provided* it has skip connections. That is the geometric reason "just gradient descent on a giant non-convex function" works in practice.

</div>

<div class="optional md" data-headline="Origins of the word 'landscape'">
The metaphor "energy landscape" entered physics through \citeauthor{wales2003energy} (\citeyear{wales2003energy}) and was first applied to neural loss functions informally by \citeauthor{baldi1989landscape} (\citeyear{baldi1989landscape}). The systematic 2-D visualization that turned it from a metaphor into a diagnostic tool is \citeauthor{li2018losslandscape} (\citeyear{li2018losslandscape}) — their \texttt{tomgoldstein/loss-landscape} GitHub repo is the de-facto standard for loss-landscape plots today.
</div>
