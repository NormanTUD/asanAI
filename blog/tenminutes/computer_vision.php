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
							<h3 class="matrix-subtitle">An image is a matrix</h3>
							<p>A grayscale image is a two-dimensional matrix. Its rows and columns are pixel positions, and each entry is one brightness value, usually 0 for black and 255 for white. A 1920 × 1080 photo has 2,073,600 entries. The network receives this table, not a picture.</p>
							<p>A colour image is three such matrices, one for red, one for green, one for blue. Each pixel is a vector of three numbers, and the image has shape height × width × 3. A batch adds a fourth dimension: batch × height × width × 3. Inside the network, a feature map is again a stack of matrices, with channels instead of colours.</p>
							<p>A convolution is matrix arithmetic on a small window. The kernel is a 3 × 3 matrix. At each position, multiply the nine entries of the image patch by the nine kernel weights, add the products, and write the result into the feature map. For an RGB image the kernel has three channels, and the products for all channels are summed into one output value per position. Pooling is another matrix operation: replace each 2 × 2 block with its maximum or its mean.</p>
							<figure class="matrix-figure">
								<div class="matrix-visual">
									<div class="matrix-card">
										<p class="matrix-label">Grayscale · one matrix</p>
										<div class="matrix-grid" style="--cols:4" aria-label="A 4 by 4 grayscale matrix">
											<span style="background:rgb(0,0,0);color:#fff">0</span><span style="background:rgb(32,32,32);color:#fff">32</span><span style="background:rgb(64,64,64);color:#fff">64</span><span style="background:rgb(96,96,96);color:#fff">96</span>
											<span style="background:rgb(128,128,128);color:#000">128</span><span style="background:rgb(160,160,160);color:#000">160</span><span style="background:rgb(192,192,192);color:#000">192</span><span style="background:rgb(224,224,224);color:#000">224</span>
											<span style="background:rgb(255,255,255);color:#000">255</span><span style="background:rgb(220,220,220);color:#000">220</span><span style="background:rgb(180,180,180);color:#000">180</span><span style="background:rgb(140,140,140);color:#000">140</span>
											<span style="background:rgb(100,100,100);color:#fff">100</span><span style="background:rgb(60,60,60);color:#fff">60</span><span style="background:rgb(20,20,20);color:#fff">20</span><span style="background:rgb(0,0,0);color:#fff">0</span>
										</div>
										<p class="matrix-note">Each entry is brightness, 0–255.</p>
									</div>
									<div class="matrix-card">
										<p class="matrix-label">RGB · three matrices</p>
										<div class="matrix-rgb">
											<div class="matrix-channel"><span class="matrix-ch is-r">R</span><div class="matrix-grid matrix-grid--sm" style="--cols:3" aria-label="Red channel matrix"><span>255</span><span>128</span><span>0</span><span>64</span><span>200</span><span>32</span><span>16</span><span>90</span><span>240</span></div></div>
											<div class="matrix-channel"><span class="matrix-ch is-g">G</span><div class="matrix-grid matrix-grid--sm" style="--cols:3" aria-label="Green channel matrix"><span>0</span><span>160</span><span>255</span><span>128</span><span>64</span><span>200</span><span>32</span><span>240</span><span>90</span></div></div>
											<div class="matrix-channel"><span class="matrix-ch is-b">B</span><div class="matrix-grid matrix-grid--sm" style="--cols:3" aria-label="Blue channel matrix"><span>0</span><span>32</span><span>128</span><span>255</span><span>64</span><span>160</span><span>200</span><span>16</span><span>90</span></div></div>
										</div>
										<p class="matrix-note">Same height and width; each pixel is a vector of three values.</p>
									</div>
								</div>
								<figcaption>A grayscale image is one matrix. A colour image is three matrices stacked into a tensor. Original diagram: Ten Minutes, <a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="noopener">CC BY-SA 4.0</a>.</figcaption>
							</figure>

							<p>Why not connect every pixel to every neuron? Because that would need an enormous number of weights and would have to relearn the same edge detector at every location. A convolution shares one small kernel across the whole image, so it learns a pattern once and applies it everywhere. That is the built-in assumption: nearby pixels belong together, and a pattern is the same pattern wherever it appears.</p>
							<p>The design has two ancestors. David Hubel and Torsten Wiesel recorded from the cat’s visual cortex and found neurons tuned to oriented edges and moving bars, with simple cells feeding complex cells in a hierarchy (<a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1359523/" rel="noopener">Hubel &amp; Wiesel, 1962</a>). Kunihiko Fukushima’s <strong>Neocognitron</strong> (1980) turned that into a layered network of convolution-like and pooling-like stages that tolerated small shifts (<a href="https://doi.org/10.1007/BF00344251" rel="noopener">Fukushima, 1980</a>). Modern CNNs keep the same ingredients: local filters, shared weights, and depth.</p>
							<p>Stack convolutions and the hierarchy grows. Early layers detect edges and textures; middle layers combine them into parts; later layers respond to whole objects. That is the feature hierarchy behind modern vision: the 2012 AlexNet result made it hard to ignore (<a href="https://proceedings.neurips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf" rel="noopener">Krizhevsky et al., 2012</a>); its ReLU activations and dropout were as important as its depth. Pooling between stages lowers the resolution, so later layers see a larger region of the image (their receptive field grows) and the representation becomes less sensitive to small shifts.</p>
						</div>
					
						<div class="split-figure">
							<figure>
								<img src="../hubel_wiesel_orientation.jpg" alt="Orientation-selective neural responses in the cat visual cortex" loading="lazy">
								<figcaption>Orientation-selective responses of neurons in the cat visual cortex, after Hubel and Wiesel. Image: Jimmierock, <a href="https://commons.wikimedia.org/wiki/File:Hubel%2Bwiesel.jpg" rel="noopener">CC BY-SA 3.0</a>, via Wikimedia Commons.</figcaption>
							</figure>
							<figure>
								<img src="../neocognitron_lazofson.png" alt="A layered biologically motivated convolutional network diagram" loading="lazy">
								<figcaption>A biologically motivated convolutional architecture, after Hubel and Wiesel and Fukushima’s Neocognitron. Diagram: Laurence E. Lazofson, U.S. Navy thesis, p. 45, <a href="https://commons.wikimedia.org/wiki/File:A_Biologically-Inspired_Neural_Network_Architecture_for_Image_Processing_(IA_abiologicallyins1094530625).pdf" rel="noopener">public domain</a>, via Wikimedia Commons.</figcaption>
							</figure>
						</div>
</section>

					<section class="section-block" id="detail">
						<div class="section-kicker"><span class="sk-num">02</span> From classification to space</div>
						<h2 class="section-title">The task stack.</h2>
						<div class="prose">
							<p>The basic task is classification: what is in the image? Detection asks where; segmentation asks which pixels belong to which object; 3D understanding adds depth and geometry. Each task needs a different output, but the feature extractor is often shared.</p>
							<p>For practical work, one family covers much of this stack. <strong>YOLO</strong> (“You Only Look Once”) detects objects and their boxes in a single forward pass (<a href="https://arxiv.org/abs/1506.02640" rel="noopener">Redmon et al., 2016</a>). Modern Ultralytics releases add instance segmentation, pose estimation, tracking, and oriented boxes, so one model family can handle detection and several related tasks in real time (<a href="https://docs.ultralytics.com/" rel="noopener">Ultralytics, 2026</a>). It is not a general solution to every vision problem, but it is the default when latency matters.</p>
							<p>Vision Transformers (<a href="https://arxiv.org/abs/2010.11929" rel="noopener">Dosovitskiy et al., 2020</a>) replace the sliding kernel with attention over image patches, but the idea is similar: turn the image into tokens and let the model learn relationships between them. A convolution brings a strong assumption that nearby pixels belong together; a ViT has less built-in locality, needs more data, but can connect distant regions.</p>
							<p>Both approaches need data, augmentation, and careful evaluation. A model can be excellent at recognising a pattern and still fail on a new viewpoint, a rare object, or a misleading context. The sharpest version is the adversarial example: a small, often invisible change to the pixels can flip a confident classification. The decision boundary is geometric, and a point near it can be pushed across without changing what a human sees. Seeing is not the same as understanding.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Pixels</b><span>An image is a grid of numbers, not a picture of a cat.</span></div>
							<div class="keypoint"><b>Matrix</b><span>A grayscale image is one table; an RGB image is three.</span></div>
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
							<p class="demo-hint" data-conv-hint>Move the pointer over the stop sign. The kernel follows it. Each pixel is an RGB vector; the formula shows the 3×3 patch and the kernel, and sums them to one RGB output vector. The feature map is the RGB composite.</p>
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

					<section class="section-block" id="pooling">
						<div class="section-kicker"><span class="sk-num">03</span> Pooling</div>
						<h2 class="section-title">Shrink the map, keep the signal.</h2>
						<div class="prose">
							<p>Pooling compresses the map. A 2×2 window with stride 2 replaces each block with one number: max pooling keeps the strongest activation, average pooling keeps the mean. The map shrinks, the receptive field grows, and small shifts inside a window matter less. The price is exact position.</p>
						</div>
						<div class="demo demo--paper" data-demo="pooling">
							<div class="demo-head">
								<div>
									<p class="demo-title">Pooling: shrink the map <span>· demo</span></p>
									<p class="demo-sub">A 2×2 window with stride 2 turns four numbers into one. Max keeps the strongest; average keeps the mean. Click a block to inspect it.</p>
								</div>
								<span class="demo-badge">2×2 · stride 2</span>
							</div>
							<div class="demo-body">
								<div class="pool-wrap">
									<div>
										<p class="pool-label">Input · 4×4</p>
										<div class="pool-grid" data-pool-input></div>
									</div>
									<span class="pool-arrow" aria-hidden="true">→</span>
									<div>
										<p class="pool-label">Output · 2×2</p>
										<div class="pool-grid pool-grid--out" data-pool-output></div>
									</div>
								</div>
								<div class="chip-row" data-pool-modes>
									<button class="chip is-on" type="button" data-pool-mode="max">Max</button>
									<button class="chip" type="button" data-pool-mode="avg">Average</button>
								</div>
								<p class="pool-readout" data-pool-readout>Block 1: max(3, 1, 5, 9) = 9</p>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Pooling trades spatial detail for a smaller map and a little shift tolerance. Max keeps evidence, average keeps the summary.</span></div>
						</div>
					</section>

					<section class="section-block" id="vit">
						<div class="section-kicker"><span class="sk-num">04</span> Patches as tokens</div>
						<h2 class="section-title">The image becomes a sequence.</h2>
						<div class="prose">
							<p>A Vision Transformer (ViT) does not slide a kernel. It cuts the image into fixed patches, for example 16×16 pixels, flattens each patch into a vector, adds a position embedding, and treats the patches as tokens (<a href="https://arxiv.org/abs/2010.11929" rel="noopener">Dosovitskiy et al., 2020</a>). Self-attention lets every patch look at every other patch; the feed-forward network transforms each patch vector. A class token or a task head then reads the result.</p>
							<p>Convolution is one inductive bias: locality and shared weights. A ViT has less built-in locality, so it usually needs more data or strong augmentation, but it can connect distant regions from the first layer. Modern systems often combine both: a convolutional stem before a transformer, or transformer blocks over patch tokens. The choice is a design trade-off, not a replacement.</p>
						</div>
						<figure class="vit-figure">
							<svg viewBox="0 0 340 210" role="img" aria-label="An image split into a 4 by 4 grid of patches; the selected patch attends to the other patches">
								<g><rect x="20" y="20" width="36" height="36" fill="#63a44b" opacity="0.82"/><rect x="66" y="20" width="36" height="36" fill="#5c9baf" opacity="0.82"/><rect x="112" y="20" width="36" height="36" fill="#009299" opacity="0.82"/><rect x="158" y="20" width="36" height="36" fill="#9f9700" opacity="0.82"/><rect x="20" y="66" width="36" height="36" fill="#869b55" opacity="0.82"/><rect x="66" y="66" width="36" height="36" fill="#1275ac" opacity="0.82"/><rect x="112" y="66" width="36" height="36" fill="#9185be" opacity="0.82"/><rect x="158" y="66" width="36" height="36" fill="#92a19a" opacity="0.82"/><rect x="20" y="112" width="36" height="36" fill="#63a44b" opacity="0.82"/><rect x="66" y="112" width="36" height="36" fill="#5c9baf" opacity="0.82"/><rect x="112" y="112" width="36" height="36" fill="#009299" opacity="0.82"/><rect x="158" y="112" width="36" height="36" fill="#9f9700" opacity="0.82"/><rect x="20" y="158" width="36" height="36" fill="#869b55" opacity="0.82"/><rect x="66" y="158" width="36" height="36" fill="#1275ac" opacity="0.82"/><rect x="112" y="158" width="36" height="36" fill="#9185be" opacity="0.82"/><rect x="158" y="158" width="36" height="36" fill="#92a19a" opacity="0.82"/></g>
								<g><line x1="84" y1="84" x2="38" y2="38" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="84" y2="38" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="130" y2="38" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="176" y2="38" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="38" y2="84" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="130" y2="84" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="176" y2="84" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="38" y2="130" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="84" y2="130" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="130" y2="130" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="176" y2="130" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="38" y2="176" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="84" y2="176" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="130" y2="176" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="176" y2="176" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/></g>
								<rect x="66" y="66" width="36" height="36" fill="none" stroke="#004b6f" stroke-width="2.4"/>
								<text x="20" y="202" font-family="Barlow, system-ui, sans-serif" font-size="11" fill="#627476">4 × 4 patches</text>
								<text x="240" y="202" font-family="Barlow, system-ui, sans-serif" font-size="11" fill="#627476">one token each</text>
							</svg>
							<figcaption>An image is cut into patches. Each patch becomes a token, and self-attention lets every token read every other token before the feed-forward network transforms it. Diagram: Ten Minutes, <a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="noopener">CC BY-SA 4.0</a>.</figcaption>
						</figure>
					</section>

					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">05</span> Takeaway</div>
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
