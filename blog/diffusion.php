<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Diffusion Models
description: How Denoising Diffusion Probabilistic Models (DDPM) and Latent Diffusion (Stable Diffusion) generate images by reversing noise.
icon: &#127912;
part: 4
order: 28
color: sky
topics: multimodal, vision, architecture, programming
-->

<div class="md">
For most of AI history, generation meant GANs or VAEs — fragile, mode-collapsing, hard to train. In 2020, **DDPM** (Ho et al.) — building on **score-based models** introduced by Song & Ermon in 2019 — opened a new path: **diffusion**. By 2022, Stable Diffusion, DALL-E 2, Imagen, and Midjourney had made diffusion the dominant paradigm for image, video, audio, and even protein generation.

The core idea is elegant and almost paradoxical: instead of generating an image in one forward pass, **destroy an image with noise step by step, then learn to reverse the destruction one step at a time**. Diffusion is **not** the autoregressive next-token prediction that drives LLMs (see the Intuition chapter); the two are different generative paradigms, and speech/audio systems can use either (see the Speech & Audio chapter).
</div>

<div class="md">
## The Forward Process: Destroying Information

Given a clean image $x_0 \sim q(x_0)$, the forward process adds a small amount of Gaussian noise at each of $T$ timesteps:

$$
q(x_t \mid x_{t-1}) = \mathcal{N}\!\left(x_t;\; \sqrt{1-\beta_t}\, x_{t-1},\; \beta_t\, \mathbf{I}\right)
$$

where $\beta_1 < \beta_2 < \dots < \beta_T$ is a **noise schedule** (linear or cosine), typically ranging from $10^{-4}$ to $0.02$.

The closed-form marginal at any timestep $t$ is obtained by reparametrization:

$$
x_t = \sqrt{\bar\alpha_t}\, x_0 + \sqrt{1-\bar\alpha_t}\, \epsilon, \quad \epsilon \sim \mathcal{N}(0, \mathbf{I})
$$

where $\alpha_t = 1 - \beta_t$ and $\bar\alpha_t = \prod_{s=1}^{t} \alpha_s$. For $T=1000$, $\bar\alpha_T \approx 0$, so $x_T$ is pure Gaussian noise.
</div>

<div id="forward-process" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
This is a **fixed, hand-designed** Markov chain — no learnable parameters. It is the **reverse direction** that is learned.
</div>

<div class="md">
## The Reverse Process: Learning to Denoise

The reverse process is also a Gaussian Markov chain, but its means and variances are predicted by a neural network $\theta$:

$$
p_\theta(x_{t-1} \mid x_t) = \mathcal{N}\!\left(x_{t-1};\; \mu_\theta(x_t, t),\; \Sigma_\theta(x_t, t)\right)
$$

In DDPM, the variance $\Sigma_\theta$ is fixed; only the mean $\mu_\theta$ is predicted. A simpler reparametrization predicts the **noise** $\epsilon$ that was added:

$$
\mathcal{L}_{\text{simple}} = \mathbb{E}_{t, x_0, \epsilon}\!\left[ \left\| \epsilon - \epsilon_\theta\!\left(\sqrt{\bar\alpha_t}\, x_0 + \sqrt{1-\bar\alpha_t}\, \epsilon,\; t\right) \right\|^2 \right]
$$

This is just **mean-squared error between the true noise and the network's prediction**. Train a U-Net to denoise; sample by starting from $x_T \sim \mathcal{N}(0, \mathbf{I})$ and iteratively applying the learned denoiser.
</div>

<div id="reverse-process" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
At inference, the **DDPM sampler** is:

$$
x_{t-1} = \frac{1}{\sqrt{\alpha_t}}\!\left(x_t - \frac{1-\alpha_t}{\sqrt{1-\bar\alpha_t}}\, \epsilon_\theta(x_t, t)\right) + \sigma_t z, \quad z \sim \mathcal{N}(0, \mathbf{I})
$$

The first term is the predicted clean image; the second is Gaussian noise scaled by $\sigma_t$ — this is what gives diffusion its **stochasticity and diversity**.
</div>

<div class="md">
## Architectural Choices

### U-Net backbone

The denoiser $\epsilon_\theta(x_t, t)$ is a **U-Net**: an encoder that downsamples to a bottleneck, then a decoder that upsamples back. Skip connections between encoder and decoder at the same resolution preserve high-frequency detail. Each block contains:

* 2D convolutions (or, in newer models, transformer blocks)
* **Sinusoidal time embeddings** $t \mapsto \mathbb{R}^d$ that tell the network *which* timestep it is denoising (different noise levels need different denoising strategies)
* **Group normalization** and **SiLU** activation
* **Self-attention** at lower resolutions (16×16, 8×8) where global context matters

For $512 \times 512$ images, the U-Net has ~860M parameters (Stable Diffusion 1.5). For 1024×1024, the parameter count roughly doubles.

### Conditioning: From Class-Conditional to Text-Conditional

To generate images **from text**, the noise prediction must depend on a text embedding. The classifier-free guidance (CFG) approach (\cite[Ho & Salimans, 2022]{ho2022cfg} trains a single network with two modes:

* $\epsilon_\theta(x_t, t, c)$ — conditional on text embedding $c$
* $\epsilon_\theta(x_t, t, \varnothing)$ — unconditional (10% of training time, drop the text)

At inference, **amplify** the conditional signal:

$$
\tilde\epsilon_\theta(x_t, t, c) = \epsilon_\theta(x_t, t, \varnothing) + w \cdot \bigl(\epsilon_\theta(x_t, t, c) - \epsilon_\theta(x_t, t, \varnothing)\bigr)
$$

where $w$ (guidance scale) is typically 5–15. Higher $w$ → images match the prompt more literally but lose diversity. The diagram below shows the effect:
</div>

<div id="cfg-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## Latent Diffusion: Stable Diffusion

Pixel-space diffusion at $512 \times 512 \times 3$ is prohibitively expensive. **Latent Diffusion Models** (LDM, \cite[Rombach et al., 2022]{rombach2022ldm} — the paper behind Stable Diffusion) solve this by:

1. **Encode** the image into a lower-dimensional latent $z = E(x) \in \mathbb{R}^{h \times w \times c}$ using a pretrained VAE encoder (typically $8\times$ spatial compression, so $512 \times 512 \to 64 \times 64 \times 4$).
2. **Diffuse** in latent space (much cheaper: $64^2 \times 4 = 16{,}384$ dims vs. $786{,}432$).
3. **Decode** the denoised latent back to pixels: $\hat{x} = D(z)$.

This $8\times$ spatial compression makes training and inference ~$64\times$ cheaper. The VAE is frozen; only the U-Net diffusion model is trained.
</div>

<div class="md">
## Text Encoders

The U-Net is conditioned on a text embedding produced by a separate text encoder:

| Model | Text encoder | Output dim | Notes |
|-------|-------------|------------|-------|
| **Stable Diffusion 1.5** | CLIP ViT-L/14 (text tower) | 768 | Frozen during diffusion training |
| **Stable Diffusion 2/2.1** | OpenCLIP-ViT-H | 1024 | |
| **Stable Diffusion 3** | T5-XXL + CLIP-G + OpenCLIP | 4096 (T5) | Three text encoders, much stronger text adherence |
| **DALL-E 2** | CLIP text tower + prior network | — | Two-stage: prior maps text → CLIP image embedding, then diffusion from that |
| **Imagen** | T5-XXL | 4096 | Google's model; pure T5 conditioning |
| **FLUX** | T5-XXL + CLIP-L | — | Current SOTA, rectified-flow formulation |

A **prior model** (DALL-E 2's distinctive feature) maps the text embedding to a CLIP image embedding first; the diffusion model then generates an image whose CLIP embedding matches. This produces more diverse but sometimes less faithful outputs.
</div>

<div class="md">
## Beyond Image Generation

Diffusion is no longer just for pixels:

* **Video**: Sora, Veo, Stable Video Diffusion — same recipe, with temporal attention layers and 3D convolutions.
* **Audio**: AudioLDM, DiffSinger — spectrogram diffusion or latent audio diffusion.
* **Music**: Riffusion, MusicLDM — spectrogram → audio.
* **Proteins**: DiffDock, RFdiffusion, Chroma — diffusion over 3D atomic coordinates or sequence space.
* **Robotics**: Diffuser, Decision Diffuser — diffusion over action sequences.
* **Time-series**: TimeGrad, ScoreGrad — diffusion over financial, weather, or sensor data.

The recipe generalizes: **if you can define a forward noising process and a neural network that can reverse it, you can diffuse over that domain**.
</div>

<div class="md">
## Sampling Accelerators

DDPM's iterative sampler is slow (50–1000 steps). Modern solvers dramatically reduce this:

| Sampler | Steps | Quality | Idea |
|---------|-------|---------|------|
| **DDPM** | 1000 | High | Original ancestral sampling |
| **DDIM** | 50–100 | High | Deterministic, non-Markovian |
| **DPM-Solver** | 10–20 | High | Higher-order ODE solver |
| **EDM** | 18–50 | High | Heuristic step-size schedule |
| **LCM / SDXL-Turbo / SD-Turbo** | 1–8 | Good | Adversarial distillation to few-step models |
| **Consistency Models** | 1 | Good | Self-consistency training |

Modern Stable Diffusion XL Turbo generates images in **1–4 network evaluations** — close to GAN speed but with diffusion's diversity and stability.
</div>

<div class="md">
## Conditioning Tricks

* **Image-to-image**: encode the source image to latent, add noise to some timestep $t_0$, then denoise from $t_0$ back to 0. The amount of $t_0$ controls how much the model preserves vs regenerates.
* **Inpainting**: mask a region of the latent, denoise with the mask conditioning. The model fills in the masked area consistent with the unmasked context.
* **ControlNet** \cite[Zhang et al., 2023]{zhang2023controlnet}: train a small network that outputs residuals added to each U-Net block, conditioned on extra signals like edge maps (Canny), depth maps, human pose skeletons. This gives spatial control without retraining the base model.
* **LoRA**: \cite[Hu et al., 2021]{hu2021lora} adapters on the U-Net's attention layers, enabling fine-tuning on a few hundred images in minutes on consumer GPUs.
</div>

<div class="md">
## Why Diffusion Works (Intuition)

Two complementary views explain why denoising yields a generator:

1. **Signal-to-noise view**: at high noise levels, only large-scale structure survives. The network first learns the coarse layout, then progressively adds detail. This is hierarchical generation by construction.
2. **Score-matching view** (Song & Ermon, 2019): the denoiser implicitly learns the **score** $\nabla_x \log p(x)$, the gradient of the log-density. Sampling by following the score is equivalent to Langevin dynamics on the data distribution. The two frameworks are mathematically equivalent.

Diffusion is also remarkably stable to train: no adversarial game, no mode collapse, no careful balancing. Just MSE between predicted and true noise.
</div>

<div class="md">
## Current Frontiers

* **Flow matching / Rectified flow** (\cite[Lipman et al., 2023]{lipman2023flow}: a more general framework where diffusion is a special case. FLUX, Stable Diffusion 3, and most 2024+ models use it. Trains on a straight-line interpolation between noise and data, often giving better sample quality.
* **Consistency models**: 1-step generation via a self-consistency loss.
* **Diffusion Transformers (DiT)**: replace the U-Net with a pure Transformer (similar to ViT), enabling scaling laws and unified architecture. Sora, FLUX, and Stable Diffusion 3 all use DiT-style backbones.
* **Cascaded diffusion**: generate a low-res image, then upsample with a second diffusion model. Google's Imagen, OpenAI's early DALL-E 2.

The field has moved from "diffusion as a curiosity" (2020) to "diffusion as the universal generative recipe" (2025) in five years.
</div>

<div class="md">
## Summary

| Concept | Formula | Intuition |
|---------|---------|-----------|
| Forward process | $x_t = \sqrt{\bar\alpha_t}\, x_0 + \sqrt{1-\bar\alpha_t}\, \epsilon$ | Add a known amount of noise |
| Training objective | $\mathcal{L} = \mathbb{E}[\|\epsilon - \epsilon_\theta(x_t, t, c)\|^2]$ | Predict the noise that was added |
| DDPM sampling | $x_{t-1} = \frac{1}{\sqrt{\alpha_t}}(x_t - \frac{1-\alpha_t}{\sqrt{1-\bar\alpha_t}}\epsilon_\theta) + \sigma_t z$ | Iteratively denoise |
| Classifier-free guidance | $\tilde\epsilon = \epsilon_\varnothing + w (\epsilon_c - \epsilon_\varnothing)$ | Amplify conditioning |
| Latent diffusion | Train in VAE latent $z = E(x)$ | Cheaper than pixel space |
| U-Net | Encoder–decoder with skip connections | Standard denoiser backbone |

Diffusion turned generative modeling from an adversarial art into a tractable, scalable recipe — and in doing so, transformed creative tooling, science, and entertainment.
</div>

<script>
function getThemeFg() {
	return getComputedStyle(document.documentElement).getPropertyValue('--mn-text').trim() || '#1e293b';
}

// Forward process: x0 → x_T
(function() {
	const c = document.getElementById('forward-process');
	if (!c) return;

	const T = 200, nShow = 8;
	const x0 = [];
	for (let i = 0; i < 32; i++) {
		// Synthetic "cat" pattern
		const r = Math.sin(i * 0.3) * 0.4 + Math.cos(i * 0.7) * 0.3 + (i % 7 === 0 ? 0.3 : 0);
		x0.push(0.5 + r * 0.4);
	}

	const alphas = [];
	let a = 1;
	for (let t = 0; t < T; t++) {
		const beta = 1e-4 + (0.02 - 1e-4) * (t / T);  // linear schedule
		a *= (1 - beta);
		alphas.push(a);
	}

	const traces = [];
	const showSteps = [0, 20, 50, 100, 150, 180, 195, 199];
	for (const s of showSteps) {
		const aBar = alphas[s];
		const sigma = Math.sqrt(1 - aBar);
		// Pseudo-random for visualization (deterministic per step)
		const seed = s * 17 + 1;
		const noise = Array.from({length: 32}, (_, i) => {
			const r = Math.sin(seed + i * 2.1) * 43758.5453;
			return ((r - Math.floor(r)) - 0.5) * 2;
		});
		const y = x0.map((v, i) => Math.sqrt(aBar) * v + sigma * noise[i]);
		traces.push({
			y, mode: 'lines', name: 't = ' + s + (s === 0 ? ' (clean)' : s === T - 1 ? ' (pure noise)' : ''),
			line: { width: 2 }
		});
	}

	const layout = {
		title: { text: 'Forward diffusion: signal gradually replaced by noise', font: { size: 13 } },
		xaxis: { title: 'pixel index', range: [0, 31] },
		yaxis: { title: 'intensity', range: [-2, 2] },
		margin: { t: 50, b: 50, l: 50, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		font: { color: getThemeFg() }
	};
	Plotly.newPlot('forward-process', traces, layout, { responsive: true });
})();

// Reverse process: x_T → x_0
(function() {
	const c = document.getElementById('reverse-process');
	if (!c) return;
	const N = 64;
	const trueSignal = Array.from({length: N}, (_, i) => Math.sin(i * 0.3) * 0.6 + Math.sin(i * 0.13) * 0.4);

	function reconstruct(step) {
		// Reconstruct from full noise back
		const alpha = 1 - step;  // step from 0 (noise) to 1 (signal)
		const noiseSeed = step * 1000;
		const noise = Array.from({length: N}, (_, i) => {
			const r = Math.sin(noiseSeed + i * 2.3) * 43758.5453;
			return ((r - Math.floor(r)) - 0.5) * 2;
		});
		return trueSignal.map((s, i) => Math.sqrt(alpha) * s + Math.sqrt(1 - alpha) * noise[i] * (1 - step * 0.8));
	}

	const steps = [0, 0.1, 0.25, 0.45, 0.65, 0.8, 0.95, 1.0];
	const colors = ['#94a3b8', '#64748b', '#475569', '#334155', '#0ea5e9', '#3b82f6', '#6366f1', '#22c55e'];
	const traces = [];
	steps.forEach((s, idx) => {
		const y = reconstruct(s);
		traces.push({
			y, mode: 'lines', name: 'denoising step ' + (idx + 1),
			line: { color: colors[idx], width: 2 }
		});
	});
	traces.push({
		y: trueSignal, mode: 'lines', name: 'true signal',
		line: { color: '#ef4444', width: 3, dash: 'dash' }
	});

	const layout = {
		title: { text: 'Reverse process: noise → structured signal (each curve is one denoising step)', font: { size: 13 } },
		xaxis: { range: [0, N - 1] },
		yaxis: { range: [-1.8, 1.8] },
		margin: { t: 50, b: 40, l: 50, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		font: { color: getThemeFg() }
	};
	Plotly.newPlot('reverse-process', traces, layout, { responsive: true });
})();

// CFG effect
(function() {
	const c = document.getElementById('cfg-viz');
	if (!c) return;

	const w = [0, 3, 7, 15];
	const N = 64;
	const colors = ['#94a3b8', '#3b82f6', '#8b5cf6', '#ef4444'];
	const traces = [];

	w.forEach((wi, idx) => {
		const y = Array.from({length: N}, (_, i) => {
			// Higher guidance: more peaky, less diverse
			const peak = Math.exp(-Math.pow((i - N/2) / (10 / (1 + wi * 0.1)), 2));
			const noise = (Math.sin(i * 7.3 + wi) * 0.1) / (1 + wi);
			return peak + noise - 0.5;
		});
		traces.push({
			y, mode: 'lines', name: 'w = ' + wi + (wi === 0 ? ' (unconditional)' : ''),
			line: { color: colors[idx], width: 2 + wi / 5 }
		});
	});

	const layout = {
		title: { text: 'Classifier-free guidance strength: how strongly to follow the prompt', font: { size: 13 } },
		xaxis: { title: 'output distribution (probability over classes/tokens)' },
		yaxis: { range: [-0.6, 1.2] },
		margin: { t: 50, b: 50, l: 50, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		font: { color: getThemeFg() }
	};
	Plotly.newPlot('cfg-viz', traces, layout, { responsive: true });
})();


async function loadDiffusionModule() {
	updateLoadingStatus("Loading section about Diffusion Models...");
	return Promise.resolve();
}
</script>
