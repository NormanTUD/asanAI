<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Multimodal & Vision-Language Models
description: How CLIP, LLaVA, and GPT-4V bridge pixels and text — visual tokens, projection, and cross-attention.
icon: &#128064;
part: 4
order: 28
color: sky
topics: multimodal, vision, architecture, programming
-->

<div class="md">
A pure text model is blind. It has never seen a colour, a face, or a curve. **Multimodal** models remove this handicap: a single network that ingests **images, text, audio, video**, and reasons across them. The 2024–2025 generation (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5, InternVL-2, LLaVA-OneVision) is multimodal by default; text-only models are increasingly a special case.

This chapter traces the technical lineage from pixels-as-tensors (see the Convolutions and Vision chapter) to **pixels-as-tokens** that an LLM can read.
</div>

<div class="md">
## The Two Towers: Why Aligning Spaces Is Hard

A trained text model lives in a **language embedding space** $\mathbb{R}^d$ where “king” and “queen” sit close together. An image encoder (a CNN or Vision Transformer) lives in a **visual embedding space** $\mathbb{R}^{d'}$ where two photographs of the same cat also sit close together. The problem: these two spaces are not the same. You cannot, in general, do $\vec{v}_\text{cat\,image} - \vec{v}_\text{dog\,image} \approx \vec{v}_\text{“cat”} - \vec{v}_\text{“dog”}$ until they have been aligned.

The simplest alignment is **contrastive learning**: pull matched (image, caption) pairs together, push mismatched pairs apart. This is exactly what **CLIP** does.
</div>

<div class="md">
## CLIP: Contrastive Language-Image Pre-training

Published by \cite[Radford et al. (OpenAI), 2021]{radford2021clip}, CLIP trains two encoders simultaneously on ~400 million (image, text) pairs scraped from the public web:

* An **image encoder** $f_\theta : \text{Image} \to \mathbb{R}^d$ (originally a ResNet-50, later a ViT-L/14).
* A **text encoder** $g_\phi : \text{Text} \to \mathbb{R}^d$ (a Transformer).

Both are L2-normalized to live on the unit sphere, so cosine similarity equals dot product. For a batch of $N$ matched pairs, CLIP computes an $N \times N$ similarity matrix and trains both encoders to maximize the diagonal (matched pairs) and minimize the off-diagonal (mismatched pairs) via a **symmetric cross-entropy loss**:

$$
\mathcal{L} = -\frac{1}{2N} \sum_{i=1}^{N} \left[ \log \frac{\exp(\mathbf{I}_i \cdot \mathbf{T}_i / \tau)}{\sum_j \exp(\mathbf{I}_i \cdot \mathbf{T}_j / \tau)} + \log \frac{\exp(\mathbf{T}_i \cdot \mathbf{I}_i / \tau)}{\sum_j \exp(\mathbf{T}_i \cdot \mathbf{I}_j / \tau)} \right]
$$

where $\mathbf{I}_i = f_\theta(\text{image}_i)$, $\mathbf{T}_i = g_\phi(\text{text}_i)$, and $\tau$ is a learnable temperature.
</div>

<div class="md">
After training, CLIP exhibits **zero-shot image classification**: write a prompt like *“a photo of a {label}”* for every candidate class, encode all prompts, encode the image, pick the prompt with highest cosine similarity. No fine-tuning, no classifier head. CLIP matched the accuracy of fully-supervised ResNet-50 on ImageNet without ever seeing an ImageNet label.

This is the foundation of every modern vision-language model.
</div>

<div class="md">
## Vision Transformers: Turning Pixels into Tokens

A Vision Transformer \cite[Dosovitskiy et al., 2021]{dosovitskiy2021vit} (ViT) treats an image as a **sequence of patches**. For an image of $H \times W \times 3$ pixels with patch size $P \times P$:

$$
\text{number of patches} \quad n = \frac{HW}{P^2}
$$

Each patch is linearly projected to a $d$-dimensional vector (the patch embedding), a learnable `[CLS]` token is prepended, and 1-D positional embeddings are added. The resulting sequence of $n+1$ vectors is fed to a standard Transformer encoder. The `[CLS]` token's final hidden state is the image representation.

For a $224 \times 224$ image with $P=16$: $n = 196$ patches. ViT-L/14 processes this with 24 layers, 16 heads, $d=1024$, yielding ~304M parameters. Modern ViTs (EVA-02, SigLIP) push to $P=14$ patches on $448 \times 448$ inputs, yielding $>1000$ tokens per image.
</div>

<div id="vit-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
This is the deep conceptual shift: **an image is no longer “a grid to be convolved”; it is a sequence to be attended to**. The same Transformer block that processes word tokens now processes visual tokens. The architecture becomes modality-agnostic.
</div>

<div class="md">
## Multimodal LLMs: How a Text Model Learns to See

The challenge: a pretrained text-only LLM has never seen a pixel. Three architectural patterns have emerged (often combined):

### Pattern 1: Projection Layer (LLaVA-style)

A pretrained vision encoder (e.g., CLIP-ViT) produces a sequence of visual tokens. A small **projection MLP** maps each visual token from the vision space into the LLM's text-token embedding space:

$$
\mathbf{h}_i^{\text{LLM}} = W_{\text{proj}} \cdot \mathbf{v}_i + \mathbf{b}_{\text{proj}}, \quad \mathbf{v}_i = \text{CLIP-ViT}(\text{image})_i
$$

The projected visual tokens are concatenated with the text-token sequence and fed to the LLM as if they were ordinary words. **Only the projection layer is trained initially**; the LLM is frozen. The visual tokens literally become “foreign-language words” the LLM learns to read.

LLaVA-1.5 \cite[Liu et al., 2023]{liu2023llava} used a 7B Vicuna LLM + CLIP-ViT-L/14 + a 2-layer MLP projector. With ~600k image-instruction pairs, it reached 85.1% on VQA, matching GPT-4 on several multimodal benchmarks.

### Pattern 2: Cross-Attention (Flamingo-style)

The vision tokens are not concatenated into the text sequence; instead, the LLM's self-attention layers are augmented with **cross-attention blocks** that read from the visual sequence at every layer. Flamingo \cite[Alayrac et al., 2022]{alayrac2022flamingo} interleaved gated cross-attention layers between frozen Transformer blocks, training only the cross-attention and a Perceiver Resampler that compressed variable-length image features into a fixed 64-token representation.

### Pattern 3: Native Multimodality (GPT-4o, Gemini)

The Transformer is trained from scratch on interleaved image, audio, text, and video tokens. There is no projection layer; the model has always seen pixels as first-class tokens. Tokens representing 1/24-second audio frames, $16 \times 16$ image patches, and BPE text tokens all flow through the same residual stream. This requires vast multimodal training data (trillions of tokens), but produces the most coherent cross-modal reasoning.
</div>

<div class="md">
## How a Multimodal LLM Answers a Question

Take the prompt *“What is unusual about this image?”* with an attached photo. The pipeline:

1. **Encode** the image with the vision tower → sequence of $n$ visual tokens.
2. **Project** them into the LLM's token space (or feed via cross-attention).
3. **Tokenize** the text prompt as usual.
4. **Concatenate**: $\text{[visual tokens] [text tokens]}$.
5. **Autoregressive generation** as in any LLM: predict the next text token conditioned on the joint sequence.

The LLM treats the visual tokens as if they were a foreign language it has been taught to read. No new attention mechanism is required, the same Q/K/V machinery already described in the Attention chapter handles the cross-modal mixing, because visual and text tokens occupy the same vector space.
</div>

<div class="md">
## Visual Question Answering Benchmarks

| Benchmark | What it tests | Why it matters |
|-----------|---------------|----------------|
| **VQA v2** | Simple visual question answering | The original VQA benchmark; saturated |
| **MMMU** | Multi-discipline college-level multimodal reasoning | Requires expert knowledge + image understanding |
| **MMVet** | Integrated multimodal capabilities | Tests composition of recognition + reasoning + OCR |
| **MathVista** | Mathematical reasoning in visual contexts | Diagrams, plots, geometric figures |
| **DocVQA** | Reading text inside images | Critical for invoices, receipts, forms |
| **MM-Bench** | Broad multimodal evaluation | Now multilingual |
| **RealWorldQA** | Real-world spatial reasoning | Self-driving, robotics |

The leaderboard has shifted dramatically: in 2022, GPT-3.5 with no vision got ~0% on MMMU. By 2025, top models (GPT-4o, Claude 3.5, Gemini 1.5 Pro) exceed 70%, and on VQA v2 they exceed 85%.
</div>

<div class="md">
## The Limits of Multimodal LLMs

Multimodal does **not** mean omnipotent:

* **Spatial reasoning**: counting objects (“how many apples?”), understanding left/right relationships, depth ordering, all surprisingly weak.
* **Hallucination amplifies**: an LLM that hallucinates text can hallucinate “the dog is brown” when no dog is present.
* **OCR is brittle**: handwritten text, unusual fonts, or cluttered scenes cause systematic failures.
* **Adversarial fragility**: imperceptible pixel perturbations (see the Security chapter) can flip a model's answer.
* **Resolution wall**: a 1024-token visual sequence compresses 1024×1024 pixels into 1024 vectors. Fine detail is lost. Mitigations: any-resolution ViTs, “image cropping” at inference, native higher resolutions.
</div>

<div class="md">
## What's Next

* **Any-to-any models**: GPT-4o, Gemini 2, and others can take image, audio, video *and* produce any of them, generating speech, singing, or video from a text prompt.
* **Video as a long sequence of patches**: video tokens are simply more frames stacked in time. Gemini 1.5 Pro accepts up to 1 hour of video at native resolution.
* **Embodied multimodal**: robots that fuse camera, lidar, proprioception, and language in one model (RT-2, PaLM-E, OpenVLA).
</div>

<div class="md">
## Summary

Multimodal LLMs are conceptually simple:

1. **Encode** each modality into a sequence of vectors.
2. **Project** all modalities into a shared token space (or use cross-attention).
3. **Train** the model as a normal next-token predictor on the joint sequence.

The hard parts are data (curating trillions of matched image-text-audio samples, see the Training Data chapter), compute (vision towers + LLMs + alignment data = massive training runs), and evaluation (the benchmarks above are still being developed). But the architectural recipe is now standard and reproducible, which is why every frontier lab ships multimodal-by-default in 2025.
</div>

<script>

// ViT patch embedding visualization
(function() {
	const c2 = document.getElementById('vit-viz');
	if (!c2) return;

	const P = 16, H = 224, W = 224;
	const n = (H/P) * (W/P);

	const colors = [];
	for (let r = 0; r < H/P; r++) {
		for (let c = 0; c < W/P; c++) {
			// Simulate image content: a stylized "cat"
			const x = c*P + P/2, y = r*P + P/2;
			const cx = W/2, cy = H/2;
			const d = Math.sqrt((x-cx)**2 + (y-cy)**2);
			// Two ear triangles + body
			const earL = Math.sqrt((x-W*0.4)**2 + (y-H*0.32)**2) < 25;
			const earR = Math.sqrt((x-W*0.6)**2 + (y-H*0.32)**2) < 25;
			const body = d < 50;
			if (earL || earR || body) colors.push(0.7 + Math.random()*0.3);
			else colors.push(0.1 + Math.random()*0.15);
		}
	}

	const data = [{
		z: Array.from({length: H/P}, (_, r) => colors.slice(r*(W/P), (r+1)*(W/P))),
		type: 'heatmap',
		colorscale: [[0, '#0f172a'], [1, '#fbbf24']],
		showscale: false,
		hoverinfo: 'skip'
	}, {
		x: [], y: [], mode: 'markers', marker: { symbol: 'square', size: P, color: 'rgba(59,130,246,0.0)', line: { color: 'rgba(59,130,246,0.7)', width: 1.5 } },
		hoverinfo: 'skip'
	}];

	const xLines = [], yLines = [];
	for (let i = 0; i <= W/P; i++) { xLines.push({ x0: i*P, x1: i*P, y0: 0, y1: H, line: { color: 'rgba(59,130,246,0.4)', width: 1 }, type: 'line' }); }
	for (let i = 0; i <= H/P; i++) { yLines.push({ x0: 0, x1: W, y0: i*P, y1: i*P, line: { color: 'rgba(59,130,246,0.4)', width: 1 }, type: 'line' }); }

	const layout = {
		title: { text: 'ViT patchification: 224×224 → ' + n + ' patches of 16×16', font: { size: 13 } },
		xaxis: { range: [0, W], showticklabels: false, zeroline: false, showgrid: false },
		yaxis: { range: [0, H], showticklabels: false, zeroline: false, showgrid: false, autorange: 'reversed', scaleanchor: 'x' },
		shapes: [...xLines, ...yLines],
		margin: { t: 50, b: 20, l: 20, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		annotations: [{
			x: W + 8, y: H/2, text: '→ flattened into a sequence of ' + n + ' tokens',
			showarrow: false, font: { size: 11 }, textangle: -90
		}]
	};

	Plotly.newPlot('vit-viz', data, layout, { responsive: true });
})();

async function loadMultimodalModule() {
	updateLoadingStatus("Loading section about Multimodal Models...");
	return Promise.resolve();
}
</script>
