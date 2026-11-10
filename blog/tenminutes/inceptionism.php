<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="How Inceptionism turns a frozen classifier around: gradient ascent on the input, layer by layer, to see what the network has learned.">
	<meta name="theme-color" content="#ffffff">
	<title>What the Network Dreams | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
</head>
<body data-lesson="inceptionism" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>Turn the network <em>around.</em></h1>
					<p class="hero-deck">Normally we adjust the weights to fit an image. Inceptionism flips the direction: freeze the weights and adjust the image until it becomes what the network recognizes. The result is a picture of the network's learned features, not a photograph it has stored. What has the network learned to expect?</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="idea">
						<div class="section-kicker"><span class="sk-num">01</span> The idea</div>
						<h2 class="section-title">The reverse direction.</h2>
						<div class="prose">
							<p>The tiny learner fitted a line. A deep vision network learns features; turn the network around to see them. A classifier is trained to map an image to a label. If you freeze its weights and run gradient ascent on a class score, the pixels change instead of the parameters. Start from noise, ask for “banana”, and the noise slowly organizes into banana-like shapes.</p>
							<p>The procedure is gradient ascent on the input. For a chosen layer and channel, compute the gradient of the mean activation with respect to the pixels, add a small step to the image, blur the result a little, and repeat. For a class visualization, maximize the class score instead. The blur keeps the optimization from collapsing into high-frequency noise and makes the patterns readable. Mordvintsev, Olah and Tyka describe exactly this loop in the 2015 Inceptionism essay (<a href="https://research.google/blog/inceptionism-going-deeper-into-neural-networks/" rel="noopener">Mordvintsev et al., 2015</a>).</p>
							<p>The result looks surreal because the network is not drawing a photograph. It is projecting its learned features back into pixel space. Lower layers produce edges, strokes, and textures; higher layers assemble parts and whole objects. Freezing the weights is the point: the question is not “what would a good image look like?” but “what does this fixed detector respond to?” The image is the answer, read backwards.</p>
							<p>A concrete case from the original essay: asked to visualize a dumbbell, the network adds an arm holding it, because dumbbells in the training data usually came with people (<a href="https://research.google/blog/inceptionism-going-deeper-into-neural-networks/" rel="noopener">Mordvintsev et al., 2015</a>). The image shows the co-occurrence, not the object.</p>
							<p>The picture is a map of associations, not a photograph of a concept.</p>
							<p>Starting from noise matters too. A blank or natural image already contains structure the network can latch onto; noise is neutral enough that the gradient has to supply the shape. In DeepDream, a real photo is fed in, the gradient amplifies whatever a chosen layer already detects, and the result is fed back in. That loop (recognize, amplify, repeat) is what turns a faint preference into a full-blown hallucination, and why a cloud can become a bird.</p>
						</div>
					</section>

					<section class="section-block" id="detail">
						<div class="section-kicker"><span class="sk-num">02</span> What the dreams reveal</div>
						<h2 class="section-title">A window into learned features.</h2>
						<div class="prose">
							<p>Inceptionism (<a href="https://research.google/blog/inceptionism-going-deeper-into-neural-networks/" rel="noopener">Mordvintsev et al., 2015</a>) is a simple interpretability tool. It shows that the network's knowledge is distributed across layers and can be visualized by optimizing the input. It also explains pareidolia: like a child seeing animals in clouds, the network finds its templates in noise.</p>
							<p>The dreams also reveal associations in the training data. A dumbbell may appear with an arm because the two co-occur; a tower may grow fractal copies of itself because the network has learned a texture. These are not symbols the model understands; they are patterns it has learned to expect. The images are not evidence that the model is conscious or dreaming in the human sense. They are a picture of what the weights have learned to respond to. Inceptionism interrogates a classifier that was never trained to make images at all. That is why its “dreams” look like the inside of a feature detector rather than a photograph.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Freeze the weights</b><span>The parameters stay fixed; the input becomes the variable.</span></div>
							<div class="keypoint"><b>Gradient ascent</b><span>Optimize the image toward a chosen class score.</span></div>
							<div class="keypoint"><b>Layer hierarchy</b><span>Early layers see edges; later layers see objects.</span></div>
							<div class="keypoint"><b>Interpretability</b><span>The dreams are a window into learned features.</span></div>
						</div>
					</section>


					<div class="split-figure">
						<figure>
							<img src="../noise_to_banana.png" alt="Random noise gradually turning into a banana" loading="lazy">
							<figcaption>Left: random noise. Right: the same pixels after maximizing the “banana” class. Image: Mordvintsev, Olah &amp; Tyka, <a href="https://research.google/blog/inceptionism-going-deeper-into-neural-networks/" rel="noopener">Inceptionism</a>, CC BY 4.0.</figcaption>
						</figure>
						<figure>
							<img src="../inceptionism_classvis.png" alt="Class visualizations from the Inceptionism essay" loading="lazy">
							<figcaption>Row after row of class visualizations from the original essay. Image: Mordvintsev, Olah &amp; Tyka, <a href="https://research.google/blog/inceptionism-going-deeper-into-neural-networks/" rel="noopener">Inceptionism</a>, CC BY 4.0.</figcaption>
						</figure>
					</div>

					<div class="split-figure">
						<figure>
							<img src="../inceptionism_ibis.png" alt="A photo of grazing addax antelopes next to a low-layer deep dream that turns the scene into strokes and ornaments" loading="lazy">
							<figcaption>A low layer reads the photo as strokes and ornament, not as antelopes. Composite: Mordvintsev, Olah &amp; Tyka, <a href="https://research.google/blog/inceptionism-going-deeper-into-neural-networks/" rel="noopener">Inceptionism</a>, CC BY 4.0. Original photo by Zachi Evenor; low-layer processing by Günther Noack.</figcaption>
						</figure>
						<figure>
							<img src="../inceptionism_sky_arrow.png" alt="A blue sky with clouds next to a deep dream that turns the clouds into bird-like forms" loading="lazy">
							<figcaption>Clouds become birds. The loop is the lesson: recognize a hint of a pattern, amplify it, recognize it again. Image: Mordvintsev, Olah &amp; Tyka, <a href="https://research.google/blog/inceptionism-going-deeper-into-neural-networks/" rel="noopener">Inceptionism</a>, CC BY 4.0.</figcaption>
						</figure>
					</div>

					<div class="split-figure">
						<figure>
							<img src="../inceptionism_funny_animals.png" alt="Four deep-dream panels with hybrid animals named Admiral Dog, Pig-Snail, Camel-Bird, and Dog-Fish" loading="lazy">
							<figcaption>Admiral Dog, Pig-Snail, Camel-Bird, Dog-Fish. The network remixes learned features into hybrids. Image: Mordvintsev, Olah &amp; Tyka, <a href="https://research.google/blog/inceptionism-going-deeper-into-neural-networks/" rel="noopener">Inceptionism</a>, CC BY 4.0.</figcaption>
						</figure>
						<figure>
							<img src="../inceptionism_dumbbells.png" alt="A deep-dream dumbbell held by a weightlifter's arm" loading="lazy">
							<figcaption>Asked to dream a dumbbell, the network adds a weightlifter holding it, because the training data rarely showed one alone. Image: Mordvintsev, Olah &amp; Tyka, <a href="https://research.google/blog/inceptionism-going-deeper-into-neural-networks/" rel="noopener">Inceptionism</a>, CC BY 4.0.</figcaption>
						</figure>
					</div>

					<figure>
						<img src="../inceptionism_dream_map.png" alt="A transformed photograph with the object labels the network assigns to different regions" loading="lazy">
						<figcaption>Start from a real photo and the network edits where it already sees something: towers here, animals there. Image: Mordvintsev, Olah &amp; Tyka, <a href="https://research.google/blog/inceptionism-going-deeper-into-neural-networks/" rel="noopener">Inceptionism</a>, CC BY 4.0.</figcaption>
					</figure>

					<div class="prose">
						<h3>More dreams, public domain</h3>
						<p>Not every useful example comes from the original essay. The images below are CC0: their authors dedicated them to the public domain. They were made with the same loop: start from a photograph or from white noise, freeze a trained network, and optimize the input until a layer's preferred pattern fills the frame.</p>
					</div>

					<div class="split-figure">
						<figure>
							<img src="../inceptionism_mona_lisa_deepdream.jpg" alt="Mona Lisa with a DeepDream effect" loading="lazy">
							<figcaption>Mona Lisa through a VGG16 network trained on ImageNet. The model was not asked to copy the painting; it was asked to amplify what it already detected. Image: P.J. Finlay, <a href="https://commons.wikimedia.org/wiki/File:%22Mona_Lisa%22_with_DeepDream_effect_using_VGG16_network_trained_on_ImageNet.jpg" rel="noopener">CC0</a>, via Wikimedia Commons.</figcaption>
						</figure>
						<figure>
							<img src="../inceptionism_white_noise_0036.jpg" alt="A DeepDream image generated from white noise" loading="lazy">
							<figcaption>A DeepDream run that started from white noise. No photograph tells the network what to see; the chosen layer supplies the pattern. Image: Martin Thoma, <a href="https://commons.wikimedia.org/wiki/File:Deep-dream-white-noise-0036.jpg" rel="noopener">CC0</a>, via Wikimedia Commons.</figcaption>
						</figure>
					</div>

					<div class="split-figure">
						<figure>
							<img src="../inceptionism_white_noise_0040.jpg" alt="A DeepDream image generated from white noise" loading="lazy">
							<figcaption>Another run from white noise. Different seeds and layers grow different textures; the loop is the same. Image: Martin Thoma, <a href="https://commons.wikimedia.org/wiki/File:Deep-dream-white-noise-0040.jpg" rel="noopener">CC0</a>, via Wikimedia Commons.</figcaption>
						</figure>
						<figure>
							<img src="../inceptionism_white_noise_0012.jpg" alt="A DeepDream image generated from white noise" loading="lazy">
							<figcaption>A third run from white noise. The result is a picture of the layer's preferences, not a stored image. Image: Martin Thoma, <a href="https://commons.wikimedia.org/wiki/File:Deep-dream-white-noise-0012.jpg" rel="noopener">CC0</a>, via Wikimedia Commons.</figcaption>
						</figure>
					</div>

					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">03</span> Takeaway</div>
						<h2 class="section-title">The short version.</h2>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">Freeze the weights. Optimize the pixels. See what the network responds to.</p>
							<p class="aha-sub">Inceptionism runs a classifier backwards: gradient ascent on the input, layer by layer. The images are not stored pictures; they are a readable projection of learned features.</p>
						</div>
					</section>
				</article>
			</div>
		</div>
	</main>

	<script src="assets/site.js?v=<?php echo filemtime(__DIR__.'/assets/site.js'); ?>"></script>
</body>
</html>
