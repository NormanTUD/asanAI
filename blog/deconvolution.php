<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Pixels and Checkerboards
description: When generative models upscale with “deconvolution”, the overlaps bake a checkerboard pattern into their images — and into their gradients.
icon: &#10024;
part: 3
order: 6
color: rose
topics: architecture, generative, math-ii
-->

<div class="md">
## Drawing a Bigger Picture

Generative models must *go the other way*: instead of shrinking an image into descriptors, they turn a small latent vector into a full-size picture. The standard building block is a **transposed convolution** — a convolution run with its input and output swapped. Transposed convolutions are necessary, but they are also the source of one of the most recognizable failure modes in deep learning: the **checkerboard artifact**.

> A transposed convolution that upscales by factor 2 with a kernel size of 3 spreads each input pixel over a *square* of the output — and leaves some output pixels darker where those squares overlap.

Neural upsampling has a geometric story: a transposed convolution with stride 2 places each input pixel's “stamp” at 2-pixel intervals. With a $3\times 3$ kernel, those stamps are wide — each one is a **smeared square** on the output, traditionally called a deconvolution, a name that flatters it: a transposed convolution is *not* an inverse of a convolution. \citeauthor{odena2016deconvolution} (\citeyear{odena2016deconvolution}) demonstrated that incorrect naming is a real source of confusion \cite{odena2016deconvolution}.

## Where the Checkerboard Comes From

In one dimension the mechanism is easy to see. Transpose a $3$-wide kernel $\{w_0, w_1, w_2\}$ and walk it across the output with stride 2. Some output positions receive one kernel tap; their neighbors receive two, because the 3-wide kernel “overlaps” itself across the 2-wide stride. With all weights equal, the 1D pattern alternates **1, 2, 1, 2, …**:

$$\text{1D overlap (k=3, s=2):}\quad \dots\quad w_0,\quad w_0{+}w_2,\quad w_1,\quad w_0{+}w_2,\quad \dots$$

In two dimensions the pattern is the outer product of two such 1D stripes — and since the stride factorizes, you get intensity differences that repeat in a **checkerboard** with a $2\times 2$ tile. The general law, stated by \citeauthor{odena2016deconvolution}: whenever the kernel size is **not divisible by the stride**, the upsampling is uneven — some output positions end up brighter than others \cite{odena2016deconvolution}:

* **$2\times 2$ kernels, stride 2:** every input pixel's stamp is exactly one output cell — uniform, no artifact.
* **$4\times 4$ kernels, stride 2:** uniform too — divisible.
* **$3\times 3, 5\times 5$ kernels, stride 2:** the classic harmful sizes — the checkerboard appears with period 2.

The two panels below are the same style-transfer result produced by \citeauthor{odena2016deconvolution}: upsampled with a deconvolution on the left, with a resize + plain convolution on the right \cite{odena2016deconvolution}.
</div>

<div style="display:flex; gap:16px; flex-wrap:wrap; justify-content:center; margin:16px 0;">
	<figure style="margin:0; flex:1 1 300px; max-width:420px; background:var(--mn-surface, #f8fafc); padding:14px; border-radius:12px; border:1px solid var(--mn-border, #e2e8f0);">
		<img src="deconv_style_artifacts.png" style="width:100%; border-radius:6px;" alt="Perceptual style transfer output with checkerboard artifacts caused by deconvolution upsampling" />
		<figcaption style="font-size:0.8rem; margin-top:8px; color:var(--mn-text-secondary, #64748b);">Deconvolution upsampling: the checkerboard is visible as a repeating square grid over the whole image.</figcaption>
	</figure>
	<figure style="margin:0; flex:1 1 300px; max-width:420px; background:var(--mn-surface, #f8fafc); padding:14px; border-radius:12px; border:1px solid var(--mn-border, #e2e8f0);">
		<img src="deconv_style_clean.png" style="width:100%; border-radius:6px;" alt="The same style transfer result, upsampled with resize and regular convolution, showing no checkerboard" />
		<figcaption style="font-size:0.8rem; margin-top:8px; color:var(--mn-text-secondary, #64748b);">Resize + regular convolution: the stripes and grid are gone. \cite[Figures from the Distill article, CC BY 2.0]{odena2016deconvolution}</figcaption>
	</figure>
</div>

<div class="md">
## It's in the Gradients, Not Just the Pixels

The artifact does **not** wait for training — even a randomly-initialized transposed convolution already draws a checkerboard. And it does **not** stop at the output image. The authors' sharpest observation: the *gradient* of a regular convolution, computed by the backpropagation that trains the network, is itself a transposed convolution — so **every method that looks at gradients inherits the pattern** \cite{odena2016deconvolution}. Feature visualizations, adversarial noise, style transfer, and GAN training all see it, even when the final image is clean.

Three consequences follow \cite{odena2016deconvolution}:

* **Color matters:** the artifact is strongest in **bright**, saturated regions and weakest on black, because the bias term dominates where the image is dark and nearly constant.
* **Layering compounds it:** stacked deconvolutions overlap each decoder stage's pattern, multiplying the checkerboard into a fractal, multi-period grid.
* **The Internet's favorite workaround** — the one DeepDream already used — is **jitter**: shifting the image by a random number of pixels each iteration and averaging. Averaging over shifts *cancels* the periodic pattern.
</div>

<figure style="background:var(--mn-surface, #f8fafc); padding:16px; border-radius:12px; border:1px solid var(--mn-border, #e2e8f0); margin:16px 0; max-width:680px; margin-left:auto; margin-right:auto;">
	<img src="deconv_deepdream_jitter.png" style="width:100%; border-radius:6px;" alt="A DeepDream image rendered at full resolution with eight-by-eight random shifts (jitter), which cancels the deconvolution checkerboard artifacts" />
	<figcaption style="font-size:0.8rem; margin-top:8px; color:var(--mn-text-secondary, #64748b); text-align:center;">DeepDream, rendered with 8×8 random shifts per iteration: the deconvolution artifact is a periodic error, so randomized shifting cancels it out. \cite[Figure from the Distill article, CC BY 2.0]{odena2016deconvolution}</figcaption>
</figure>

<div class="md">
## The Two Fixes

\citeauthor{odena2016deconvolution} offer a recommendation, not a decree: *deconvolution is not inherently bad*, but the easiest way to be safe is to stop using it for upsampling entirely \cite{odena2016deconvolution}.

1. **Resize-conv (or “re-size convolution”):** upsample with an interpolation (nearest-neighbour or bilinear) and then apply a **regular** 3×3 convolution. Because the interpolation is uniform, no periodic overlap pattern is introduced. This is the modern default in image generators \cite{odena2016deconvolution}.
2. **Plan for it:** if a deconvolution is unavoidable, a network can learn to suppress the artifacts — but the standard advice is to prefer the simpler, artifact-free path.

The pattern lesson generalizes far beyond upsampling: whenever a periodic operation (a fixed kernels size, a fixed stride) is applied across a domain, its *overlap structure* becomes part of what the model learns — and part of what it shows. That same hidden structure, turned **inward** instead of outward, is what the [Inceptionism chapter](inceptionism.php) exploits: a network's gradients can be read back as images, revealing the shapes and colors it secretly expects.
</div>