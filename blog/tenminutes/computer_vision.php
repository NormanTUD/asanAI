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
						<div class="demo demo--paper" id="sunflower-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">A sunflower is a matrix <span>· demo 01</span></p>
									<p class="demo-sub">The photo is millions of numbers. The 4×4 grid is a real crop from a petal edge; each cell shows its R, G, B values.</p>
								</div>
								<span class="demo-badge">RGB · 0–255</span>
							</div>
							<div class="demo-body">
								<div class="pixel-demo">
									<figure class="pixel-photo">
										<div class="pixel-photo-frame">
											<img src="../sunflower_pixels.jpg" alt="A sunflower against a blue sky" loading="lazy">
											<span class="pixel-crop-marker" aria-hidden="true"></span>
										</div>
										<figcaption>Photo: Jonson22, <a href="https://commons.wikimedia.org/wiki/File:Son%C4%8Dnica_na_modrem_nebu_-_Sunflower_in_blue_sky_-_Helianthus_annuus.JPG" rel="noopener">CC0</a>, via Wikimedia Commons.</figcaption>
									</figure>
									<div class="pixel-grid-wrap">
										<p class="pixel-grid-label">4 × 4 pixels from a petal edge</p>
										<div class="pixel-grid" role="img" aria-label="A 4 by 4 grid of RGB values from the sunflower">
											<span style="background:rgb(94,144,197);color:#000" title="R 94, G 144, B 197" aria-label="R 94, G 144, B 197">94<br>144<br>197</span><span style="background:rgb(97,144,200);color:#000" title="R 97, G 144, B 200" aria-label="R 97, G 144, B 200">97<br>144<br>200</span><span style="background:rgb(97,144,200);color:#000" title="R 97, G 144, B 200" aria-label="R 97, G 144, B 200">97<br>144<br>200</span><span style="background:rgb(99,144,199);color:#000" title="R 99, G 144, B 199" aria-label="R 99, G 144, B 199">99<br>144<br>199</span>
										<span style="background:rgb(116,143,164);color:#000" title="R 116, G 143, B 164" aria-label="R 116, G 143, B 164">116<br>143<br>164</span><span style="background:rgb(117,144,165);color:#000" title="R 117, G 144, B 165" aria-label="R 117, G 144, B 165">117<br>144<br>165</span><span style="background:rgb(120,145,167);color:#000" title="R 120, G 145, B 167" aria-label="R 120, G 145, B 167">120<br>145<br>167</span><span style="background:rgb(125,147,170);color:#000" title="R 125, G 147, B 170" aria-label="R 125, G 147, B 170">125<br>147<br>170</span>
										<span style="background:rgb(211,189,150);color:#000" title="R 211, G 189, B 150" aria-label="R 211, G 189, B 150">211<br>189<br>150</span><span style="background:rgb(211,190,145);color:#000" title="R 211, G 190, B 145" aria-label="R 211, G 190, B 145">211<br>190<br>145</span><span style="background:rgb(213,190,146);color:#000" title="R 213, G 190, B 146" aria-label="R 213, G 190, B 146">213<br>190<br>146</span><span style="background:rgb(216,193,149);color:#000" title="R 216, G 193, B 149" aria-label="R 216, G 193, B 149">216<br>193<br>149</span>
										<span style="background:rgb(255,216,120);color:#000" title="R 255, G 216, B 120" aria-label="R 255, G 216, B 120">255<br>216<br>120</span><span style="background:rgb(254,215,112);color:#000" title="R 254, G 215, B 112" aria-label="R 254, G 215, B 112">254<br>215<br>112</span><span style="background:rgb(252,213,110);color:#000" title="R 252, G 213, B 110" aria-label="R 252, G 213, B 110">252<br>213<br>110</span><span style="background:rgb(252,210,108);color:#000" title="R 252, G 210, B 108" aria-label="R 252, G 210, B 108">252<br>210<br>108</span>
										</div>
										<p class="pixel-note">Each cell lists R, G, B from top to bottom; the background is the resulting colour. A 1000 × 1000 image has one million such vectors.</p>
									</div>
								</div>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>The network never receives a picture. It receives this table of numbers.</span></div>
						</div>

						<div class="prose">
							<p>Start with the sunflower. The photo is a grid of pixels; the 4×4 sample shows how each pixel becomes three numbers. A convolution (<a href="https://galileo-unbound.blog/wp-content/uploads/2025/02/lecun.neco_.1989.1.4.541.pdf" rel="noopener">LeCun et al., 1989</a>) applies a small kernel to every local patch of the image. The kernel is a set of learned weights; it responds strongly to a particular pattern, such as a vertical edge or a patch of colour. There is no flower in the numbers; there is only structure that a trained hierarchy can interpret.</p>
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
</section>


					
					<section class="section-block" id="detail">
						<div class="section-kicker"><span class="sk-num">02</span> From one label to a scene</div>
						<h2 class="section-title">The task stack.</h2>
						<div class="prose">
							<p>The sunflower demo asks the simplest question: what is in the image? A classifier reduces the whole matrix to a short vector of class scores, for example five numbers for five categories. The information is already in the pixels; the network learns which differences matter.</p>
							<p>Detection asks where. The output is a list of boxes with class scores. Segmentation asks which pixels belong to the object; the output is a mask with the same height and width as the image. Depth adds a distance per pixel. The questions change, but the input is always a tensor.</p>
							<p>That is why the task stack shares a backbone. Early layers learn edges and textures that are useful for every task; a small head turns those features into labels, boxes, masks, or depth. <strong>YOLO</strong> is the real-time detection default and now covers segmentation, pose, and tracking in one family (<a href="https://arxiv.org/abs/1506.02640" rel="noopener">Redmon et al., 2016</a>; <a href="https://docs.ultralytics.com/" rel="noopener">Ultralytics, 2026</a>). <strong>SAM</strong> takes a prompt and returns a mask for the object you point at (<a href="https://arxiv.org/abs/2304.02643" rel="noopener">Kirillov et al., 2023</a>).</p>
							<p>The shared backbone also explains the failure mode. A small change to the input can move a point across the decision boundary without changing what a human sees. The model is not reading the scene; it is separating feature vectors. Seeing is not the same as understanding.</p>
						</div>
						<figure>
							<img src="../image.php?f=sam_demo.png&amp;w=900&amp;q=82&amp;fmt=jpg" alt="Segment Anything Model segmentation examples" loading="lazy">
							<figcaption>One image, several prompts: SAM segments whatever you point at, zero-shot. Image: Alexander Kirillov et al. (Meta AI), <a href="https://github.com/facebookresearch/segment-anything" rel="noopener">Apache-2.0</a>.</figcaption>
						</figure>
						<div class="keypoints">
							<div class="keypoint"><b>One input</b><span>Every task starts from the same tensor of pixels.</span></div>
							<div class="keypoint"><b>Backbone</b><span>Early layers learn features that many tasks can share.</span></div>
							<div class="keypoint"><b>Heads</b><span>A label, a box, a mask, or a depth map is a different output shape.</span></div>
							<div class="keypoint"><b>Task stack</b><span>Classification, detection, segmentation, and 3D ask progressively harder questions.</span></div>
							<div class="keypoint"><b>Adversarial</b><span>A tiny pixel change can flip a confident label.</span></div>
						</div>
					</section>

					<section class="section-block" id="pooling">
						<div class="section-kicker"><span class="sk-num">03</span> Pooling</div>
						<h2 class="section-title">Shrink the map, keep the signal.</h2>
						<div class="prose">
							<p>Pooling compresses the map. A 2×2 window with stride 2 replaces each block with one number: max pooling keeps the strongest activation, average pooling keeps the mean. The map shrinks, the receptive field grows, and small shifts inside a window matter less. The price is exact position.</p>
							<p>Why do this? A 1000×1000 image has one million pixels. If the task is classification into five categories, the network must end with five scores. The information that decides the class is already in the image; the job is to distill it, not to preserve every pixel. Convolution learns features; pooling is a fixed compression step between them.</p>
							<p>Max pooling keeps the strongest activation in each window and discards the weaker ones. It does not know which pixel is semantically important; it applies the same rule everywhere. That is the point: no weights to learn, no extra parameters, and a smaller map for the next layer. The cost is position. Two different 2×2 windows with the same maximum become indistinguishable, so after pooling the map no longer knows where the maximum was. For “is there an edge?” that does not matter; for “where exactly is the edge?” it is fatal. That is why segmentation and pose estimation often avoid coarse pooling and keep the resolution high.</p>
							<p>The reduction compounds. Four 2×2 poolings shrink a 1000×1000 map to about 62×62; the receptive field grows, and the final dense layers see a compact summary instead of a million numbers.</p>
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
							<p>A Vision Transformer starts in the same place as the text models from the previous chapters: it turns the input into a sequence of tokens. It cuts the image into fixed patches, for example 16×16 pixels. A 224×224 image becomes 14×14 = 196 patches. Each patch is flattened into a vector (16×16×3 = 768 numbers) and projected to the model width with a learned matrix, just as a token id is mapped to an embedding vector (<a href="https://arxiv.org/abs/2010.11929" rel="noopener">Dosovitskiy et al., 2020</a>).</p>
							<p>The patches are now tokens, but they have lost their order. The model adds a position embedding to each patch vector, just as a text transformer adds a position vector to each token embedding. In the earlier dense layers, the position embedding told the network where a token sat; here it tells the network where a patch came from. A special class token is prepended, and its final vector is used for classification.</p>
							<p>The rest is the transformer block from the previous chapters: multi-head self-attention lets every patch read every other patch; a residual connection adds the update; layer normalization stabilizes it; the feed-forward network transforms each patch. Stack the blocks and the representation becomes contextual: a patch of petal can be interpreted together with the seeds, the stem, and the background.</p>
							<p>The trade-off is inductive bias. A convolution assumes locality and shared weights; a ViT assumes less and must learn those regularities from data. That is why ViTs often need more data or strong augmentation, and why hybrid models put a convolutional stem before the transformer. Hierarchical ViTs such as <strong>Swin</strong> add local windows and patch merging to recover some of the convolutional prior (<a href="https://arxiv.org/abs/2103.14030" rel="noopener">Liu et al., 2021</a>). The sequence view is the same idea as text; the difference is what a token is.</p>
							<p>Patch size is a design choice. Smaller patches preserve detail but make the sequence longer and the attention cost grow; larger patches are cheaper but coarser. At high resolution, window attention and hierarchical merging keep the sequence manageable.</p>
							</div>
						<figure class="vit-figure">
							<svg viewBox="0 0 340 210" role="img" aria-label="An image split into a 4 by 4 grid of patches; the selected patch attends to the other patches">
								<g><rect x="20" y="20" width="36" height="36" fill="#63a44b" opacity="0.82"/><rect x="66" y="20" width="36" height="36" fill="#5c9baf" opacity="0.82"/><rect x="112" y="20" width="36" height="36" fill="#009299" opacity="0.82"/><rect x="158" y="20" width="36" height="36" fill="#9f9700" opacity="0.82"/><rect x="20" y="66" width="36" height="36" fill="#869b55" opacity="0.82"/><rect x="66" y="66" width="36" height="36" fill="#1275ac" opacity="0.82"/><rect x="112" y="66" width="36" height="36" fill="#9185be" opacity="0.82"/><rect x="158" y="66" width="36" height="36" fill="#92a19a" opacity="0.82"/><rect x="20" y="112" width="36" height="36" fill="#63a44b" opacity="0.82"/><rect x="66" y="112" width="36" height="36" fill="#5c9baf" opacity="0.82"/><rect x="112" y="112" width="36" height="36" fill="#009299" opacity="0.82"/><rect x="158" y="112" width="36" height="36" fill="#9f9700" opacity="0.82"/><rect x="20" y="158" width="36" height="36" fill="#869b55" opacity="0.82"/><rect x="66" y="158" width="36" height="36" fill="#1275ac" opacity="0.82"/><rect x="112" y="158" width="36" height="36" fill="#9185be" opacity="0.82"/><rect x="158" y="158" width="36" height="36" fill="#92a19a" opacity="0.82"/></g>
								<g><line x1="84" y1="84" x2="38" y2="38" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="84" y2="38" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="130" y2="38" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="176" y2="38" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="38" y2="84" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="130" y2="84" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="176" y2="84" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="38" y2="130" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="84" y2="130" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="130" y2="130" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="176" y2="130" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="38" y2="176" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="84" y2="176" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="130" y2="176" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/><line x1="84" y1="84" x2="176" y2="176" stroke="#1275ac" stroke-width="1.1" opacity="0.35"/></g>
								<rect x="66" y="66" width="36" height="36" fill="none" stroke="#004b6f" stroke-width="2.4"/>
								<text x="20" y="202" font-family="Barlow, system-ui, sans-serif" font-size="11" fill="#627476">4 × 4 patches</text>
								<text x="240" y="202" font-family="Barlow, system-ui, sans-serif" font-size="11" fill="#627476">one token each</text>
							</svg>
							<figcaption>An image is cut into patches. Each patch is flattened, projected to a token vector, and given a position embedding; a class token is added. Self-attention lets every token read every other token. Diagram: Ten Minutes, <a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="noopener">CC BY-SA 4.0</a>.</figcaption>
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
