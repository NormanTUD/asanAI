<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="Images as grids of numbers, convolutions as sliding filters, and the hierarchy from edges to objects.">
	<meta name="theme-color" content="#ffffff">
	<title>How Machines See | Ten Minutes</title>
	<link rel="stylesheet" href="../Temml-Local.min.css">
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
</head>
<body data-lesson="computer_vision" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>Seeing is <em>layered pattern detection.</em></h1>
					<p class="hero-deck">A computer does not see a cat. It sees a grid of numbers. Convolution learns small local patterns, and depth combines them into edges, parts, and objects.</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="idea">
						<div class="section-kicker"><span class="sk-num">01</span> A filter that slides</div>
						<h2 class="section-title">Local patterns, shared weights.</h2>
						<div class="prose">
							<p>Training data was text. Now the data is a grid of pixels. A convolution (<a href="https://galileo-unbound.blog/wp-content/uploads/2025/02/lecun.neco_.1989.1.4.541.pdf" rel="noopener">LeCun et al., 1989</a>) applies a small kernel to every local patch of the image. The kernel is a set of learned weights; it responds strongly to a particular pattern, such as a vertical edge or a patch of colour. An image itself is just a grid of numbers: each pixel is a brightness or a set of colour values, usually red, green, and blue. There is no cat in the pixels; there are only numbers that a trained hierarchy can interpret.</p>
							<p>Why not connect every pixel to every neuron? Because that would need an enormous number of weights and would have to relearn the same edge detector at every location. A convolution shares one small kernel across the whole image, so it learns a pattern once and applies it everywhere. That is the built-in assumption: nearby pixels belong together, and a pattern is the same pattern wherever it appears.</p>
							<p>Stack convolutions and the hierarchy grows. Early layers detect edges and textures; middle layers combine them into parts; later layers respond to whole objects. That is the feature hierarchy behind modern vision: the 2012 AlexNet result made it hard to ignore (<a href="https://proceedings.neurips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf" rel="noopener">Krizhevsky et al., 2012</a>); its ReLU activations and dropout were as important as its depth. Pooling between stages lowers the resolution, so later layers see a larger region of the image (their receptive field grows) and the representation becomes less sensitive to small shifts.</p>
						</div>
					</section>

					<section class="section-block" id="detail">
						<div class="section-kicker"><span class="sk-num">02</span> From classification to space</div>
						<h2 class="section-title">The task stack.</h2>
						<div class="prose">
							<p>The basic task is classification: what is in the image? Detection asks where; segmentation asks which pixels belong to which object; 3D understanding adds depth and geometry. Each task needs a different output, but the feature extractor is often shared.</p>
							<p>Vision Transformers (<a href="https://arxiv.org/abs/2010.11929" rel="noopener">Dosovitskiy et al., 2020</a>) replace the sliding kernel with attention over image patches, but the idea is similar: turn the image into tokens and let the model learn relationships between them. A convolution brings a strong assumption that nearby pixels belong together; a ViT has less built-in locality, needs more data, but can connect distant regions.</p>
							<p>Both approaches need data, augmentation, and careful evaluation. A model can be excellent at recognising a pattern and still fail on a new viewpoint, a rare object, or a misleading context. The sharpest version is the adversarial example: a small, often invisible change to the pixels can flip a confident classification. The decision boundary is geometric, and a point near it can be pushed across without changing what a human sees. Seeing is not the same as understanding.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Pixels</b><span>An image is a grid of numbers, not a picture of a cat.</span></div>
							<div class="keypoint"><b>Convolution</b><span>A small learned filter slides over the image and detects local patterns.</span></div>
							<div class="keypoint"><b>Hierarchy</b><span>Edges become parts; parts become objects.</span></div>
							<div class="keypoint"><b>Task stack</b><span>Classification, detection, segmentation, and 3D ask progressively harder questions.</span></div>
						</div>
					</section>


					<figure>
						<img src="../image.php?f=sam_demo.png&amp;w=900&amp;q=82&amp;fmt=jpg" alt="Segment Anything Model segmentation examples" loading="lazy">
						<figcaption>One image, several prompts: SAM segments whatever you point at, zero-shot. Image: Alexander Kirillov et al. (Meta AI), <a href="https://github.com/facebookresearch/segment-anything" rel="noopener">Apache-2.0</a>.</figcaption>
					</figure>

					<div class="demo demo--paper demo--canvas" data-demo="convolution">
						<div class="demo-head">
							<div>
								<p class="demo-title">A filter slides over the stop sign <span>· demo</span></p>
								<p class="demo-sub">The kernel is a tiny learned pattern. Pick one and move the mouse across the real stop sign.</p>
							</div>
							<span class="demo-badge">live</span>
						</div>
						<div class="demo-body">
							<canvas class="demo-canvas demo-canvas--md" data-conv-canvas aria-label="A convolution applied to a small grid"></canvas>
							<div class="demo-controls">
								<button class="btn-demo btn-demo--green" type="button" data-conv-scan>Scan the kernel ▶</button>
							</div>
							<p class="demo-hint" data-conv-hint>Move the pointer over the stop sign. The kernel follows it, and the feature map on the right is the actual output, colored by RGB channel.</p>
							<div class="chip-row" style="margin-top:12px">
								<button class="chip is-on" type="button" data-kernel="edge">edge</button>
								<button class="chip" type="button" data-kernel="blur">blur</button>
								<button class="chip" type="button" data-kernel="sharpen">sharpen</button>
								<button class="chip" type="button" data-kernel="sobel-h">Sobel H</button>
								<button class="chip" type="button" data-kernel="sobel-v">Sobel V</button>
								<button class="chip" type="button" data-kernel="emboss">emboss</button>
							</div>
							<div class="demo-readout">
								<div><b>Input</b><span data-conv-input-size>128 × 132</span></div>
								<div><b>Kernel</b><span>3 × 3</span></div>
								<div><b>Feature map</b><span data-conv-output-size>126 × 130</span></div>
							</div>
							<div class="conv-kernel-show">
								<span class="conv-kernel-label">Kernel</span>
								<div class="conv-kernel-grid" data-conv-kernel-grid></div>
							</div>
							<div class="conv-formula" id="conv-formula" data-tex-display="true"></div>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>A convolution shares one small filter across the whole image. Depth stacks those filters into a hierarchy: edges, parts, objects.</span></div>
						<div class="demo-foot">Source image: a stop sign in Victoria, Australia. Photo: Matthew Paul Argall, <a href="https://commons.wikimedia.org/wiki/File:Stop_Sign_in_Australia_(cropped).jpg" rel="noopener">CC0</a>.</div>
					</div>

					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">03</span> Takeaway</div>
						<h2 class="section-title">The short version.</h2>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">A machine sees by building patterns on top of patterns.</p>
							<p class="aha-sub">The cat is never in the pixels; it is in the hierarchy the network learns.</p>
						</div>
					</section>
				</article>
			</div>
		</div>
	</main>

	<script src="../temml.min.js"></script>
	<script src="assets/site.js?v=<?php echo filemtime(__DIR__.'/assets/site.js'); ?>"></script>
	<script src="assets/demos.js?v=<?php echo filemtime(__DIR__.'/assets/demos.js'); ?>"></script>
</body>
</html>
