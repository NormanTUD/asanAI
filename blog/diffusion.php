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
Most of AI's image generators used to be delicate. GANs collapsed, VAEs blurred, and training them was an art. Then in 2020, a paper called **DDPM** \cite[Ho et al., 2020]{ho2020ddpm} — built on a 2019 idea from Yang Song and Stefano Ermon \cite[Song & Ermon, 2019]{song2019score} — quietly opened a new path. Within two years, Stable Diffusion, DALL·E 2, Imagen, and Midjourney had made **diffusion** the dominant way to generate images. By 2024 it had spread to video (Sora, Veo), audio, music, and even 3D protein structures.

The idea is almost paradoxical: instead of generating an image in one forward pass, **destroy an image with noise step by step, then learn to undo the destruction, one tiny step at a time**. It is a different paradigm from the autoregressive next-token prediction that drives LLMs, even though both produce staggering results.

<figure style="max-width:720px; margin:1.5em auto; text-align:center;">
	<img src="diffusion_astronaut.webp" alt="An AI-generated image of an astronaut riding a horse, produced by Stable Diffusion 3.5 from the prompt 'a photograph of an astronaut riding a horse'" style="width:100%; height:auto; border-radius:6px;" />
	<figcaption>A single text prompt — "a photograph of an astronaut riding a horse" — and a diffusion model produced this image in seconds. Image: <a href="https://commons.wikimedia.org/wiki/File:Astronaut_Riding_a_Horse_(SD3.5).webp">VulcanSphere</a>, generated with Stable Diffusion 3.5, released under <a href="https://creativecommons.org/publicdomain/zero/1.0/deed.en">CC0</a>.</figcaption>
</figure>
</div>

<div class="md">
## The central trick: destroy, then learn to undo

Imagine dropping a clear photograph into a glass of water and slowly stirring in drops of black ink. After each drop the picture becomes a little less recognizable. After enough drops, all you see is uniform grey.

Now imagine the reverse: starting with grey water, learn to *remove* exactly the right amount of ink, drop by drop, until a coherent photograph reappears. If you can learn that reverse process well enough, you can start from *any* grey water and turn it into a fresh, novel photograph.

That is what a diffusion model does. The forward process (ink going in) is a hand-designed procedure with no learned parameters. The reverse process (ink coming out) is what a neural network has to learn.
</div>

<div class="md">
## The forward process: a controlled demolition

Concretely, the forward process takes a clean image $x_0$ and at each of $T$ small timesteps sprinkles in a little Gaussian noise. After $T = 1000$ steps nothing of the original picture survives.

The math is short, and the intuition is shorter: **noise accumulates gradually**. A useful shortcut is that at any intermediate timestep $t$, you can jump straight from the clean image to $x_t$ in one step:

$$
x_t \;=\; \sqrt{\bar\alpha_t}\, x_0 \;+\; \sqrt{1 - \bar\alpha_t}\, \epsilon, \qquad \epsilon \sim \mathcal{N}(0, \mathbf{I})
$$

For $T = 1000$, the first term has essentially vanished and $x_T$ is pure Gaussian noise. Crucially, **every step of the forward process is fixed in advance** — no learning required. The forward chain is just a way to manufacture training data for the model that does the hard work.
</div>

<div id="forward-process" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## The reverse process: the part that learns

The reverse process starts from pure noise $x_T$ and runs backward. At each step, the network looks at the current noisy image and asks: *what noise should I subtract to make this slightly more recognizable?* A thousand such tiny denoising steps, and out pops a clean image.

This is the formulation introduced by DDPM. The training objective is almost laughably simple. For a randomly chosen timestep $t$:

1. Take a real image $x_0$.
2. Add the corresponding amount of noise, producing a noisy $x_t$.
3. Ask the network to predict *what that noise was*.
4. Train by mean-squared error between the predicted and the true noise.

That is it. No adversarial game, no careful balancing. Just MSE between predicted and true noise. This stability is one of the big reasons diffusion displaced GANs so quickly.
</div>

<div id="reverse-process" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
The picture below shows what the reverse process actually looks like for a real diffusion model (Stable Diffusion using the DDIM sampler). Read it from left to right, top to bottom: the network starts from pure noise and gradually reveals a coherent image, adding detail with each step.

<figure style="max-width:100%; margin:1.5em auto; text-align:center;">
	<img src="diffusion_ddim_steps.jpg" alt="An X/Y plot of denoising steps showing a European-style castle in Japan becoming progressively more detailed as noise is removed, generated using Stable Diffusion V1-5 with DDIM sampling" style="width:100%; height:auto; border-radius:6px;" />
	<figcaption>Each frame is one denoising step of a Stable Diffusion 1.5 model using DDIM sampling. Early steps establish rough shapes and color fields; later steps refine texture and fine detail. Image: <a href="https://commons.wikimedia.org/wiki/File:X-Y_plot_of_algorithmically-generated_AI_art_of_European-style_castle_in_Japan_demonstrating_DDIM_diffusion_steps.png">Benlisquare</a>, licensed <a href="https://creativecommons.org/licenses/by-sa/4.0">CC BY-SA 4.0</a>.</figcaption>
</figure>
</div>

<div class="md">
## Why does this work? Two ways to look at it

Two complementary views explain why this recipe produces a good generator, and they turn out to be mathematically the same thing.

**The coarse-to-fine view.** In the very first denoising steps, the image is almost entirely noise — only the largest-scale structure of the data distribution is recoverable. The network first sketches out rough shapes and color fields, and only later refines fine detail. Generation is hierarchical *by construction*: layout first, then texture, then the tiny highlights on a piece of fruit.

**The score-matching view** \cite[Song & Ermon, 2019]{song2019score}. The denoiser is secretly learning the *score function* of the data distribution — the gradient of the log probability density, telling you which direction in image-space increases the "naturalness" of the image. Sampling by following that gradient is equivalent to running Langevin dynamics on the data distribution, slowly drifting toward high-probability regions. The two views turn out to be mathematically equivalent: a denoiser is a score estimator in disguise.

Either way, the practical conclusion is the same: train a network to predict the noise, and you get a generator for free.
</div>

<div class="md">
## Telling the model what to draw

To make a model draw *what you want*, you have to feed it some signal. For text-to-image, that signal is a text prompt, first encoded into a vector by a separate text encoder (typically CLIP or T5).

The trick that made text-to-image *actually work* is **classifier-free guidance** \cite[Ho & Salimans, 2022]{ho2022cfg}. At training time, the network is shown the text prompt 90% of the time and *nothing* 10% of the time, learning both a conditional and an unconditional denoiser in one model. At inference, you amplify the gap between them:

$$
\tilde\epsilon_\theta(x_t, t, c) \;=\; \epsilon_\theta(x_t, t, \varnothing) \;+\; w \cdot \big(\epsilon_\theta(x_t, t, c) - \epsilon_\theta(x_t, t, \varnothing)\big)
$$

The factor $w$ is a knob. Around $w \approx 7$ is the modern default. Higher values follow the prompt more literally but produce more generic-looking images. Lower values give variety but might drift away from what you asked for.
</div>

<div id="cfg-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## Stable Diffusion: doing it in a compressed space

Doing all this in raw pixel space at $512 \times 512$ resolution is brutally expensive. Each image is roughly 786,000 numbers, and the network must process hundreds of millions of them per step.

The breakthrough of **Latent Diffusion Models** \cite[Rombach et al., 2022]{rombach2022ldm} — the technology behind Stable Diffusion — was to *first* compress the image into a much smaller latent representation using a pretrained autoencoder, *then* do all the diffusion work in that compressed space, *then* decode the result back to pixels. The U-Net never sees a pixel; it only sees a $64 \times 64$ latent map. This makes training and inference roughly 64× cheaper.

<figure style="max-width:880px; margin:1.5em auto; text-align:center;">
	<img src="diffusion_architecture.png" alt="Diagram of the Stable Diffusion latent diffusion architecture, showing the text encoder, U-Net denoiser with cross-attention, and VAE encoder/decoder" style="width:100%; height:auto; border-radius:6px;" />
	<figcaption>The Stable Diffusion pipeline: a text encoder turns your prompt into vectors, the U-Net denoises a latent tensor conditioned on those vectors, and a frozen VAE decoder turns the clean latent back into pixels. Image: <a href="https://commons.wikimedia.org/wiki/File:Stable_Diffusion_architecture.png">Machine Vision and Learning Group, LMU Munich</a>, licensed <a href="https://opensource.org/licenses/MIT">MIT</a>.</figcaption>
</figure>

The text prompt goes through CLIP, the latent goes through the U-Net, and at the end a frozen VAE decoder turns the clean latent back into an image. The VAE is never trained alongside the diffusion model — it was learned earlier as an ordinary autoencoder and frozen in place.
</div>

<div class="md">
## Beyond images

The same recipe works anywhere you can define a "noising" process and a network that can reverse it:

* **Video**: Sora, Veo, Stable Video Diffusion — same idea, with an extra time dimension and attention layers that keep frames consistent.
* **Audio**: AudioLDM, DiffSinger — diffuse a spectrogram, then a vocoder turns it back into sound.
* **Music**: Riffusion, MusicLDM.
* **Proteins**: RFdiffusion, Chroma — diffuse over 3D atomic coordinates of new proteins.
* **Robotics**: Diffuser — diffuse over action sequences.
* **Time-series**: TimeGrad — diffuse over weather, financial, or sensor data.

The general principle is almost embarrassingly simple: **if you can blur it, you can unblur it; and if you can unblur it, you can generate it from scratch.**
</div>

<div class="md">
## Where the field is now

By 2025, the diffusion community has largely moved on to **flow matching** \cite[Lipman et al., 2023]{lipman2023flow} — a more general framework where the "noising" path between data and noise can be a straight line instead of a curved one. FLUX, Stable Diffusion 3, and most 2024+ models use it.

The dominant backbone is no longer the U-Net but the **Diffusion Transformer (DiT)** \cite[Peebles & Xie, 2023]{peebles2023dit} — a vanilla Vision Transformer scaled up. Sora, FLUX, and Stable Diffusion 3 all use DiT-style backbones. The pattern is familiar: U-Net worked, then Transformers worked better once they were big enough.

Practical models have also become fast. Modern systems generate images in **1–8 network evaluations** through clever solvers (DPM-Solver, EDM) and adversarial distillation (SDXL-Turbo, LCM). Diffusion is no longer slow.

In five years, the technique went from "diffusion as a curiosity" to "diffusion as the universal generative recipe" for images, video, audio, and molecules.
</div>

<div class="md">
## Try it yourself

* **Stable Diffusion Web UI** on Hugging Face Spaces — no installation.
* **ComfyUI** or **Automatic1111** for local runs.
* **ControlNet** \cite[Zhang et al., 2023]{zhang2023controlnet} for spatial control from edge maps, depth maps, or pose skeletons — without retraining the base model.
* **LoRA** \cite[Hu et al., 2021]{hu2021lora} adapters to fine-tune the U-Net's attention layers on a few hundred images of your own style, in minutes on a single GPU.

If you would rather read the foundational papers, the trio that started it all is Sohl-Dickstein's 2015 thermodynamic framing \cite[Sohl-Dickstein et al., 2015]{sohl2015deep}, Song & Ermon's score-based 2019 paper \cite[Song & Ermon, 2019]{song2019score}, and Ho's DDPM in 2020 \cite[Ho et al., 2020]{ho2020ddpm}.
</div>

<script>
function getThemeFg() {
	return getComputedStyle(document.documentElement).getPropertyValue('--mn-text').trim() || '#1e293b';
}

// Forward process: clean signal gradually replaced by noise
(function() {
	const c = document.getElementById('forward-process');
	if (!c) return;

	const T = 200, nShow = 8;
	const x0 = [];
	for (let i = 0; i < 32; i++) {
		const r = Math.sin(i * 0.3) * 0.4 + Math.cos(i * 0.7) * 0.3 + (i % 7 === 0 ? 0.3 : 0);
		x0.push(0.5 + r * 0.4);
	}

	const alphas = [];
	let a = 1;
	for (let t = 0; t < T; t++) {
		const beta = 1e-4 + (0.02 - 1e-4) * (t / T);
		a *= (1 - beta);
		alphas.push(a);
	}

	const traces = [];
	const showSteps = [0, 20, 50, 100, 150, 180, 195, 199];
	for (const s of showSteps) {
		const aBar = alphas[s];
		const sigma = Math.sqrt(1 - aBar);
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

// Reverse process: noise gradually replaced by structured signal
(function() {
	const c = document.getElementById('reverse-process');
	if (!c) return;
	const N = 64;
	const trueSignal = Array.from({length: N}, (_, i) => Math.sin(i * 0.3) * 0.6 + Math.sin(i * 0.13) * 0.4);

	function reconstruct(step) {
		const alpha = 1 - step;
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

// Classifier-free guidance effect
(function() {
	const c = document.getElementById('cfg-viz');
	if (!c) return;

	const w = [0, 3, 7, 15];
	const N = 64;
	const colors = ['#94a3b8', '#3b82f6', '#8b5cf6', '#ef4444'];
	const traces = [];

	w.forEach((wi, idx) => {
		const y = Array.from({length: N}, (_, i) => {
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
