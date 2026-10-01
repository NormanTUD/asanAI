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
