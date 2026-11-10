<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="How CLIP and multimodal LLMs align pixels with language, and what that alignment can and cannot do.">
	<meta name="theme-color" content="#ffffff">
	<title>Connecting Images and Words | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
</head>
<body data-lesson="multimodal" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>Two worlds, <em>one space.</em></h1>
					<p class="hero-deck">A text model lives in a language space; a vision model lives in a visual space. Multimodal models learn to put them in the same room. How can pixels and words meet in one space?</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="idea">
						<div class="section-kicker"><span class="sk-num">01</span> The alignment problem</div>
						<h2 class="section-title">Pull matching pairs together.</h2>
						<div class="prose">
							<p>Computer vision gave images their own encoder. The next step is to join that visual space to the embedding space. An image encoder turns a picture into a vector; a text encoder turns a caption into another vector. The two spaces are different, so you cannot compare them directly. Contrastive learning pulls matched image-caption pairs together and pushes mismatched pairs apart. In a batch of images and captions, every correct pair is a positive and every other combination is a negative; the loss rewards the model for making the diagonal of that similarity matrix stand out.</p>
							<p>CLIP (<a href="https://arxiv.org/abs/2103.00020" rel="noopener">Radford et al., 2021</a>), trained on roughly 400 million image-text pairs, made this practical at scale. After alignment, a picture of a dog and the word “dog” are close in a shared space, and the model can do zero-shot classification by comparing an image with candidate captions. “Zero-shot” means the model was not trained on that particular label set; it generalises because the label is just another piece of text to embed.</p>
							<p>A concrete test: give CLIP one image and the texts “a photo of a dog” and “a photo of a cat”. It compares the image vector with each text vector; the closer one wins, with no dog-specific classifier (<a href="https://arxiv.org/abs/2103.00020" rel="noopener">Radford et al., 2021</a>). The model was not trained on that label set; the label is just another sentence.</p>
							<p>Alignment is the trick: different modalities become comparable vectors, and the label becomes just another sentence.</p>
						</div>
					</section>

					<section class="section-block" id="detail">
						<div class="section-kicker"><span class="sk-num">02</span> From alignment to conversation</div>
						<h2 class="section-title">Pixels become tokens.</h2>
						<div class="prose">
							<p>A multimodal LLM goes further. Pixels are turned into visual tokens (<a href="https://arxiv.org/abs/2304.08485" rel="noopener">Liu et al., 2023</a>), projected into the language model's embedding space, and then processed together with text tokens. The model can answer questions about an image, describe it, or use it as context. Architectures differ: some concatenate visual tokens with text, others use cross-attention so the text can query the image (<a href="https://arxiv.org/abs/2204.14198" rel="noopener">Alayrac et al., 2022</a>). Either way, the trick is to make vision look like another language the model already knows how to read.</p>
							<p>The alignment is not perfect. The model can miss small details, misread text in images, or inherit biases from its training data. Reading text in an image is a good example of why: a visual encoder often works on coarse patches (<a href="https://arxiv.org/abs/2010.11929" rel="noopener">Dosovitskiy et al., 2020</a>), so the fine strokes of a label or a receipt may simply not survive the tokenization. Multimodality adds a new input, not a guarantee of understanding. Evaluation is hard too: a model can score well on a benchmark and still fail on a new viewpoint, a rare object, or a misleading caption. Use it as an assistant, not as an oracle.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Two encoders</b><span>Images and text are embedded separately before they can be compared.</span></div>
							<div class="keypoint"><b>Contrastive learning</b><span>Matched pairs are pulled together; mismatched pairs are pushed apart.</span></div>
							<div class="keypoint"><b>Visual tokens</b><span>Pixels can be projected into the language model's token space.</span></div>
							<div class="keypoint"><b>Limits</b><span>Alignment is statistical and can miss details or inherit bias.</span></div>
						</div>
					</section>


					<div class="demo demo--paper timeline-shell" data-demo="timeline" data-arrow-nav>
						<div class="demo-head">
							<div>
								<p class="demo-title">Two towers, one answer <span>· demo</span></p>
								<p class="demo-sub">Multimodal models align separate spaces and then use them together. Select a stage.</p>
							</div>
						</div>
						<div class="demo-body">
							<div class="timeline-scroller">
								<button class="tl-scroll-btn" type="button" data-timeline-prev data-arrow-prev aria-label="Scroll left">‹</button>
								<div class="timeline-track" data-timeline-track role="group" aria-label="Two towers, one answer">
									<button class="tl-node is-active" type="button" data-meta="01 · Image" data-title="Image encoder" data-body="A vision model turns pixels into a vector in a visual embedding space."><span class="tl-dot"></span><span class="tl-date">01</span><span class="tl-name">Image</span></button>
									<button class="tl-node" type="button" data-meta="02 · Text" data-title="Text encoder" data-body="A language model turns a caption into a vector in a different space."><span class="tl-dot"></span><span class="tl-date">02</span><span class="tl-name">Text</span></button>
									<button class="tl-node" type="button" data-meta="03 · Align" data-title="Contrastive alignment" data-body="Matched image-text pairs are pulled together; mismatched pairs are pushed apart."><span class="tl-dot"></span><span class="tl-date">03</span><span class="tl-name">Align</span></button>
									<button class="tl-node" type="button" data-meta="04 · Tokens" data-title="Visual tokens" data-body="Pixels are projected into the language model's token space, where they can be read with text."><span class="tl-dot"></span><span class="tl-date">04</span><span class="tl-name">Tokens</span></button>
									<button class="tl-node" type="button" data-meta="05 · Answer" data-title="Multimodal answer" data-body="The model answers from the image and the question together. Alignment is statistical, not a guarantee."><span class="tl-dot"></span><span class="tl-date">05</span><span class="tl-name">Answer</span></button>
								</div>
								<button class="tl-scroll-btn" type="button" data-timeline-next data-arrow-next aria-label="Scroll right">›</button>
							</div>
							<div class="tl-panel no-figure" data-timeline-panel aria-live="polite"></div>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>Alignment is statistical: matched pairs are pulled together, mismatched pairs pushed apart.</span></div>
					</div>

					<div class="demo demo--paper" data-demo="align">
						<div class="demo-head">
							<div>
								<p class="demo-title">Two spaces, one answer <span>· demo</span></p>
								<p class="demo-sub">Images and text start in different embedding spaces. Alignment pulls matched pairs together so the model can compare them.</p>
							</div>
							<span class="demo-badge">live</span>
						</div>
						<div class="demo-body">
							<canvas class="demo-canvas demo-canvas--md" data-align-canvas aria-label="Image and text embeddings before and after alignment"></canvas>
							<div class="demo-controls">
								<button class="btn-demo btn-demo--green" type="button" data-align-toggle>Align the spaces →</button>
							</div>
							<div class="demo-readout">
								<div><b>State</b><span data-align-state>separate</span></div>
								<div><b>Matched pairs</b><span>5</span></div>
								<div><b>Similarity</b><span data-align-sim>low</span></div>
							</div>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>Alignment is a learned geometry. It makes a picture and its caption comparable without making them the same thing.</span></div>
					</div>






					<section class="section-block" id="generate">
						<div class="section-kicker"><span class="sk-num">03</span> From noise to image</div>
						<h2 class="section-title">Destroy a picture. Learn to undo it.</h2>
						<div class="prose">
							<p>Multimodal systems can also go the other way: from text to an image. A diffusion model starts with random noise and learns to reverse a fixed noising process. During training, a photo is corrupted step by step with noise; the network learns to predict and subtract one step. At generation time it starts from fresh noise and denoises repeatedly, guided by a text embedding. That is how Stable Diffusion, DALL·E 2, and Imagen turn a prompt into pixels (<a href="https://arxiv.org/abs/2006.11239" rel="noopener">Ho et al., 2020</a>; <a href="https://arxiv.org/abs/2112.10752" rel="noopener">Rombach et al., 2022</a>).</p>
							<p>This is not the same as Inceptionism. Inceptionism interrogates a frozen classifier; diffusion learns the distribution of images. The connection is the image side of the shared space: CLIP-style text embeddings can steer the denoising process.</p>
						</div>
						<figure>
							<img src="../diffusion_ddim_steps.jpg" alt="A grid of denoising steps, from noisy colour fields to a detailed castle" loading="lazy">
							<figcaption>Denoising steps from a Stable Diffusion model. Each frame is one step from noise toward a finished image. Image: Benlisquare, <a href="https://commons.wikimedia.org/wiki/File:X-Y_plot_of_algorithmically-generated_AI_art_of_European-style_castle_in_Japan_demonstrating_DDIM_diffusion_steps.png" rel="noopener">CC BY-SA 4.0</a>, via Wikimedia Commons.</figcaption>
						</figure>
					</section>

					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">04</span> Takeaway</div>
						<h2 class="section-title">The short version.</h2>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">The bridge between seeing and speaking is a shared embedding space.</p>
							<p class="aha-sub">Once an image becomes tokens, the language model can treat it as context.</p>
						</div>
					</section>
				</article>
			</div>
		</div>
	</main>

	<script src="assets/site.js?v=<?php echo filemtime(__DIR__.'/assets/site.js'); ?>"></script>
	<script src="assets/demos.js?v=<?php echo filemtime(__DIR__.'/assets/demos.js'); ?>"></script>
</body>
</html>
