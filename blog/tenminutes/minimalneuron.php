<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="One input, one output, two numbers to adjust: the smallest possible learner and the loop behind every neural network.">
	<meta name="theme-color" content="#ffffff">
	<title>A Tiny Example Network | Ten Minutes</title>
	<link rel="stylesheet" href="../Temml-Local.min.css">
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
	<style>
		#sinfit-train-btn {
			min-width: 232px;
			height: 42px;
			box-sizing: border-box;
			white-space: nowrap;
			font-weight: 700;
		}
		#sinfit-train-btn.is-training {
			background: #b3261e;
			border-color: #b3261e;
			color: #ffffff;
		}
		#sinfit-train-btn.is-training:hover,
		#sinfit-train-btn.is-training:focus-visible {
			background: #8c1d18;
			border-color: #8c1d18;
		}
	</style>
</head>
<body data-lesson="minimalneuron" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>A tiny <em>example network.</em></h1>
					<p class="hero-deck">Before attention and transformers, there is a line. A single neuron learns by adjusting two numbers until its guess is less wrong.</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="idea">
						<div class="section-kicker"><span class="sk-num">01</span> The idea</div>
						<h2 class="section-title">A line with two knobs.</h2>
						<div class="prose">
							<p>Hallucination showed the failure mode. The smallest learner starts with a line. The first formal neuron model was Lapicque’s integrate-and-fire cell of 1907 (<a href="https://archive.org/details/journaldephysiol0000vari_l4e0/page/n639/mode/2up" rel="noopener">Lapicque, 1907, p. 620</a>). McCulloch and Pitts added the logical neuron in 1943 (<a href="https://www.cs.cmu.edu/~epxing/Class/10715/reading/McCulloch.and.Pitts.pdf" rel="noopener">McCulloch &amp; Pitts, 1943</a>); the perceptron added the learning rule in 1958.</p>
							<p>Take one input x, multiply it by a weight a, add a bias b, and you have a prediction <span data-tex="y = ax + b" data-tex-display="false"></span>. The weight decides the slope; the bias shifts the line. That is the entire model. Why bother with a line instead of just predicting the average? Because the average is the best constant guess; the line adds a relationship. It can say that when x rises, y tends to rise too, and by how much.</p>
							<p>Learning is the search for better a and b. Show the model an example, compare its prediction with the target, and measure the error. The error is a number; the learning algorithm uses it to nudge the two knobs. A weight is simply a number the model is allowed to change; “parameter” is the general name for all such numbers. Neither knob has a physical meaning (they are not “the importance of x” in any human sense. They are coordinates in a space of possible lines, and learning is a walk through that space. The biological inspiration is Hebb’s rule) neurons that fire together wire together (<a href="https://archive.org/details/in.ernet.dli.2015.226341" rel="noopener">Hebb, 1949</a>).</p>
						</div>
					</section>

					<section class="section-block" id="detail">
						<div class="section-kicker"><span class="sk-num">02</span> From one line to a network</div>
						<h2 class="section-title">The loop repeats.</h2>
						<div class="prose">
							<p>A single affine map is not yet a full neural network. Stack many of these maps, put a nonlinearity between them, and you get a network that can bend. Without the nonlinearity, the stack collapses back into one line: two affine maps compose into a third affine map, so depth would buy nothing.</p>
							<p>The smallest learner is still the right place to start. Every larger model repeats the same loop at a different scale: predict, measure the error, adjust the parameters. What changes is the shape of the error surface. For a line, the mean squared error is a bowl with one bottom, so with a suitable learning rate gradient descent converges to it. For a deep network, the surface has plateaus, valleys, and saddle points, which is why initialization, learning rate, and architecture start to matter.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Affine map</b><span>One weight and one bias define a line.</span></div>
							<div class="keypoint"><b>Loss</b><span>The error turns a guess into a learning signal.</span></div>
							<div class="keypoint"><b>Gradient</b><span>The slope of the loss tells the knobs which way to move.</span></div>
							<div class="keypoint"><b>Nonlinearity</b><span>Without a bend, stacked layers collapse into one.</span></div>
						</div>
					</section>

					<section class="section-block" id="loss">
						<div class="section-kicker"><span class="sk-num">03</span> The loss</div>
						<h2 class="section-title">How wrong is the model?</h2>
						<div class="prose">
							<p>To learn, a model needs a number that says how wrong it is. That number is the <strong>loss</strong>. For a line through noisy points, the usual choice is the <strong>mean squared error</strong> (MSE): the average of the squared vertical distances between the points and the line. Gauß used the same idea for Ceres in 1801, as the <a href="history">history chapter</a> tells it. Squaring punishes a large miss much more than a small one, and it makes the slope smooth.</p>
							<p>MSE has a useful shape for learning. Far from the best line the error surface is steep, so a gradient step can move a long way and quickly reach the right region. Close to the bottom the surface flattens, so the same step size would overshoot; the learning rate has to become smaller, or the optimizer has to adapt it, to do the fine work. Early progress is coarse, late progress is detailed.</p>
							<p>Not every task is a curve. A classifier chooses among categories, and there the usual loss is <strong>categorical cross-entropy</strong>. It asks two questions: was the right category chosen, and how confident was the model? A confident correct answer is rewarded; an uncertain correct answer is rewarded less; a confident wrong answer is punished much more. The model’s outputs are treated as probabilities over the categories, and the loss measures how much probability the correct category received.</p>
							<p>The network’s output is scored with that function, and <strong>backpropagation</strong> computes how each weight contributed to the loss. An <strong>optimizer</strong> then changes the weights a little. The details belong to the backpropagation and optimizer chapters; here the shape is enough: the loss defines a landscape, every weight is one direction, and the height is the error.</p>
							<p>In a large network that landscape lives in millions of dimensions. The image below is a real loss landscape reduced to three dimensions so that it can be drawn. You start somewhere on the surface and look for the direction in which the ball rolls downhill. That direction is the negative gradient, and the loss is the error: the height tells you how wrong the model is.</p>
						</div>
						<div class="demo demo--paper" data-demo="surprise">
							<div class="demo-head">
								<div>
									<p class="demo-title">Loss: surprise as a scalar <span>· demo</span></p>
									<p class="demo-sub">Pick the true class and move the probability it receives. The curve on the right is the cross-entropy loss for one example.</p>
								</div>
								<span class="demo-badge">cross-entropy</span>
							</div>
							<div class="demo-body">
								<div class="seg" data-surprise-target>
									<button class="is-on" type="button" data-surprise-class="0">cat</button>
									<button type="button" data-surprise-class="1">dog</button>
									<button type="button" data-surprise-class="2">mat</button>
								</div>
								<canvas class="demo-canvas demo-canvas--md" data-surprise-canvas aria-label="Class probabilities and the cross-entropy loss curve"></canvas>
								<div class="demo-controls">
									<label>p(true) <input type="range" data-surprise-p min="0.001" max="1" step="0.001" value="0.72"><output data-surprise-p-out>72.0 %</output></label>
								</div>
								<div class="demo-readout demo-readout--4">
									<div><b>True class</b><span data-surprise-true>...</span></div>
									<div><b>p(true)</b><span data-surprise-pt>...</span></div>
									<div><b>Loss −ln p</b><span data-surprise-loss>...</span></div>
									<div><b>Surprise</b><span data-surprise-bits>...</span></div>
								</div>
								<p class="demo-hint" data-surprise-note></p>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Categorical cross-entropy is one scalar: the negative log-probability of the true class. Confident mistakes are expensive.</span></div>
						</div>

						<figure>
							<img src="loss_landscape_resnet56_noskip.png" alt="A three-dimensional loss landscape of ResNet-56 without skip connections, reduced from many dimensions for plotting" loading="lazy">
							<figcaption>Loss landscape of ResNet-56 without skip connections, reduced to three dimensions for plotting. The vertical axis is the loss; the two horizontal axes are directions in weight space. Figure: Hao Li, Zheng Xu, Gavin Taylor, Christoph Studer and Tom Goldstein, <a href="https://arxiv.org/abs/1712.09913" rel="noopener">Visualizing the Loss Landscape of Neural Nets</a> (2018), from the <a href="https://github.com/tomgoldstein/loss-landscape" rel="noopener">loss-landscape repository</a>, MIT licence.</figcaption>
						</figure>
					</section>

					<section class="section-block" id="extra">
						<div class="section-kicker"><span class="sk-num">04</span> The learning loop</div>
						<h2 class="section-title">Gradient descent in miniature.</h2>
						<div class="prose">
							<p>Remember the number from section 03: for a line, the error is the height on a surface, and every choice of a and b gives a point on it.</p>
							<p>The gradient is the slope of that surface. It tells you which way to move a and b to make the error smaller. The learning rate decides how far you move. Too small and learning is slow; too large and you overshoot the minimum. In a network with many layers, that slope is computed by <strong>backpropagation</strong>: the chain rule applied from the output back to every parameter. The single neuron is the same idea with one link in the chain.</p>
							<p>Real training uses batches, epochs, regularisation, and many more parameters, but the loop is the same: predict, measure the error, compute the gradient, nudge the parameters. An epoch is one pass over the training set; a batch is the subset used for one gradient step. The historical perceptron (<a href="https://psycnet.apa.org/record/1959-09865-001" rel="noopener">Rosenblatt, 1958</a>) adjusted its weights directly from the error; backpropagation (<a href="https://doi.org/10.1038/323533a0" rel="noopener">Rumelhart et al., 1986</a>) extended the same idea to many layers.</p>
							<p>The toy is small enough to see the loop, not a miniature of a frontier model. One thing the toy cannot show is the difference between fitting the data you have and predicting data you have not seen; that is the overfitting problem, and it arrives as soon as the model has more knobs than the pattern requires.</p>
						</div>
					</section>

					<div class="demo demo--paper" data-demo="linefit">
						<div class="demo-head">
							<div>
								<p class="demo-title">Fit one line <span>· demo</span></p>
								<p class="demo-sub">Drag the weight and the bias. The green line is the current prediction; the dashed gold line is a good fit. The readout is the mean squared error.</p>
							</div>
							<span class="demo-badge">live</span>
						</div>
						<div class="demo-body">
							<canvas class="demo-canvas demo-canvas--md" data-linefit-canvas aria-label="Points and a line fitted by weight and bias"></canvas>
							<div class="demo-controls">
								<label>Weight a <input type="range" data-linefit-w min="-1" max="2.5" step="0.05" value="0.40"><output data-linefit-w-out>0.40</output></label>
								<label>Bias b <input type="range" data-linefit-b min="-1" max="1.5" step="0.05" value="0.20"><output data-linefit-b-out>0.20</output></label>
								<button class="btn-demo btn-demo--green" type="button" data-linefit-step>Train one step →</button>
								<button class="btn-demo" type="button" data-linefit-best>Jump to best fit</button>
							</div>
							<div class="demo-readout">
								<div><b>Model</b><span data-tex="y = ax + b" data-tex-display="false"></span></div>
								<div><b>Training error</b><span data-linefit-loss>...</span></div>
								<div><b>Good fit</b><span data-linefit-best-val>...</span></div>
							</div>
							<canvas class="demo-canvas" data-linefit-loss-chart style="height:110px;margin-top:10px" aria-label="Training loss over steps"></canvas>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>Learning is the search for a and b that make the error smaller. A larger network repeats this loop with many more numbers.</span></div>
					</div>

					<div class="prose">
						<p>The perceptron is the smallest classifier. It draws one straight line and puts each point on one side. That works when the classes are linearly separable, and fails when they are not: XOR is the classic failure (<a href="https://www.deeplearningbook.org/" rel="noopener">Goodfellow et al., 2016</a>). Train it below and switch to XOR to see the line get stuck.</p>
					</div>
					<figure class="perceptron-figure">
						<img src="../rosenblatt_perceptron_cc.png" alt="Rosenblatt's perceptron: inputs, weights, a summing unit, and a threshold output" loading="lazy">
						<figcaption>Rosenblatt's perceptron. The inputs are multiplied by weights, summed, and passed through a threshold. Image: Mitchell, <em>Machine Learning</em>, p. 87, via <a href="https://commons.wikimedia.org/wiki/File:Rosenblattperceptron.png" rel="noopener">Wikimedia Commons</a>, CC BY-SA 3.0.</figcaption>
					</figure>
					<div class="demo demo--paper" data-demo="perceptron">
						<div class="demo-head">
							<div>
								<p class="demo-title">The perceptron draws a border <span>· demo</span></p>
								<p class="demo-sub">Two classes, one straight line. Train the weights and watch the border move. Then switch to XOR and watch the line get stuck: the failure that makes hidden layers necessary.</p>
							</div>
							<span class="demo-badge">interactive</span>
						</div>
						<div class="demo-body">
							<div class="pc-wrap">
								<div>
									<div class="seg" style="margin-bottom:10px" data-perceptron-mode>
										<button class="is-on" type="button" data-perceptron-dataset="separable">Separable</button>
										<button type="button" data-perceptron-dataset="xor">XOR</button>
									</div>
									<canvas class="demo-canvas demo-canvas--md" data-perceptron-canvas aria-label="Two classes of points and a learned decision boundary"></canvas>
									<div class="demo-controls">
										<button class="btn-demo btn-demo--green" type="button" data-perceptron-train>Train one update →</button>
										<button class="btn-demo" type="button" data-perceptron-run>Train 20</button>
										<button class="btn-demo" type="button" data-perceptron-reset>Reset</button>
									</div>
									<canvas class="demo-canvas" data-perceptron-loss-chart style="height:110px;margin-top:10px" aria-label="Training loss over updates"></canvas>
								</div>
								<div class="pc-legend">
									<div class="pc-class"><i></i>Class A <b data-perceptron-acc-a>...</b></div>
									<div class="pc-class b"><i></i>Class B <b data-perceptron-acc-b>...</b></div>
									<div class="demo-kpis">
										<div class="demo-kpi"><b>Accuracy</b><span data-perceptron-acc>...</span></div>
										<div class="demo-kpi"><b>Error</b><span data-perceptron-loss>...</span></div>
										<div class="demo-kpi"><b>Weights</b><span data-perceptron-w>...</span></div>
										<div class="demo-kpi"><b>Bias</b><span data-perceptron-b>...</span></div>
									</div>
									<p class="demo-hint" data-perceptron-note></p>
								</div>
							</div>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>A perceptron can separate only what a straight line can separate. That limit is why nonlinearity and depth are not decoration.</span></div>
						<div class="demo-foot">A misclassified point gets a lilac ring. The rule is the original perceptron update: nudge the line toward the correct side, one mistake at a time.</div>
					</div>


					<section class="section-block" id="overfitting">
						<div class="section-kicker"><span class="sk-num">05</span> The extrapolation test</div>
						<h2 class="section-title">Fit the band, miss the world.</h2>
						<div class="prose">
							<p>The model only sees points of a sine wave between -10 and 10. It can fit them perfectly and still know nothing about what happens outside. It starts training as soon as it is in view; watch the curve leave the sine behind.</p>
						</div>
						<div class="demo demo--paper" id="sinfit-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">A sine learned inside a band <span>· demo</span></p>
									<p class="demo-sub">A real dense network sees only the blue band. Train it and see what it does outside its training range.</p>
								</div>
								<span class="demo-badge">extrapolation</span>
							</div>
							<div class="demo-body">
								<canvas class="demo-canvas demo-canvas--lg" id="sinfit-canvas" style="height:360px" aria-label="A dense neural network fitted to sine points inside a narrow band, and its behaviour outside the band"></canvas>
								<p class="demo-hint sinfit-loss-label">Training loss (MSE): <b id="sinfit-loss-value">—</b></p>
								<canvas class="demo-canvas sinfit-loss-canvas" id="sinfit-loss" style="height:96px" aria-label="Training loss over epochs"></canvas>
								<div class="demo-controls">
									<label>Noise (optional) <input type="range" id="sinfit-noise" min="0" max="0.6" step="0.05" value="0"><output id="sinfit-noise-out">0.00</output></label>
									<button class="btn-demo btn-demo--green" type="button" id="sinfit-train-btn">Train 100 epochs →</button>
									<button class="btn-demo" type="button" id="sinfit-resample">New sample</button>
								</div>
								<div class="demo-readout demo-readout--4">
									<div><b>Training error</b><span id="sinfit-train">—</span></div>
									<div><b>Inside the band</b><span id="sinfit-test">—</span></div>
									<div><b>Outside the band</b><span id="sinfit-outside">—</span></div>
									<div><b>Verdict</b><span id="sinfit-verdict">—</span></div>
								</div>
								<p class="demo-hint" id="sinfit-hint">The blue band is all the model ever sees. Train it a few times: the fit can improve inside the band while drifting away outside. The best training error is not a good model. <span id="sinfit-epochs"></span></p>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Generalization is what happens where the data is not. A model can be perfect on its training points and useless outside them.</span></div>
						</div>
						<div class="prose">
							<p>The same pattern appears in large language models. Ask about something far outside the training data and the model can still produce a confident continuation. Some hallucinations are extrapolation in a region where the model has no data: it has learned a smooth, plausible-looking surface, and it keeps extending it where nothing anchors it. The output is text, not a curve, so the failure is harder to see.</p>
						</div>
					</section>

					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">06</span> Takeaway</div>
						<h2 class="section-title">The short version.</h2>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">Learning is adjusting numbers to make the error smaller.</p>
							<p class="aha-sub">A transformer is this loop repeated billions of times, with a much richer representation.</p>
						</div>
					</section>
				</article>
			</div>
		</div>
	</main>

	<script src="../temml.min.js"></script>
	<script src="../tf.min.js"></script>
	<script src="assets/site.js?v=<?php echo filemtime(__DIR__.'/assets/site.js'); ?>"></script>
	<script src="assets/demos.js?v=<?php echo filemtime(__DIR__.'/assets/demos.js'); ?>"></script>
	<script>
	(function () {
		"use strict";
		var canvas = document.getElementById("sinfit-canvas");
		if (!canvas) return;
		window.__tmLiveLang = true;
		var DE = TM.lang() === "de";
		var noiseSlider = document.getElementById("sinfit-noise");
		var noiseOut = document.getElementById("sinfit-noise-out");
		var trainBtn = document.getElementById("sinfit-train-btn");
		var resampleBtn = document.getElementById("sinfit-resample");
		var trainEl = document.getElementById("sinfit-train");
		var testEl = document.getElementById("sinfit-test");
		var outsideEl = document.getElementById("sinfit-outside");
		var verdictEl = document.getElementById("sinfit-verdict");
		var epochsEl = document.getElementById("sinfit-epochs");
		var hintEl = document.getElementById("sinfit-hint");
		var lossCanvas = document.getElementById("sinfit-loss");
		var lossValueEl = document.getElementById("sinfit-loss-value");
		if (!window.tf) {
			if (hintEl) hintEl.textContent = DE ? "TF.js konnte nicht geladen werden." : "TF.js could not be loaded.";
			return;
		}
		var state = {
			noise: 0, points: [], model: null, training: false, epochs: 0, stopRequested: false,
			seed: 1234567, api: null, lossApi: null, maxOut: 0,
			lossHistory: [], currentLoss: null,
			fullX: [], fullY: [], bandX: [], bandY: [], trainPred: []
		};

		function rng() {
			state.seed |= 0;
			state.seed = (state.seed + 0x6D2B79F5) | 0;
			var t = Math.imul(state.seed ^ (state.seed >>> 15), 1 | state.seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		}
		function gauss() {
			var u = 0, v = 0;
			while (u === 0) u = rng();
			while (v === 0) v = rng();
			return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
		}
		function makeModel() {
			var m = tf.sequential();
			m.add(tf.layers.dense({ units: 32, activation: "relu", inputShape: [1] }));
			m.add(tf.layers.dense({ units: 32, activation: "relu" }));
			m.add(tf.layers.dense({ units: 32, activation: "relu" }));
			m.add(tf.layers.dense({ units: 1 }));
			m.compile({ optimizer: tf.train.adam(0.01), loss: "meanSquaredError" });
			return m;
		}
		function makePoints() {
			state.points = [];
			var count = 500;
			for (var i = 0; i < count; i++) {
				var x = -10 + i * 20 / (count - 1);
				state.points.push({ x: x, y: Math.sin(x) + state.noise * gauss() });
			}
		}
		function predictArray(xs) {
			if (!state.model || !xs.length) return [];
			return tf.tidy(function () {
				var input = tf.tensor2d(xs.map(function (x) { return [x / 10]; }), [xs.length, 1]);
				var out = state.model.predict(input);
				return Array.from(out.dataSync()).map(function (v) { return isFinite(v) ? v : 0; });
			});
		}
		function refreshPredictions() {
			state.fullX = [];
			for (var x = -50; x <= 50.0001; x += 0.25) state.fullX.push(x);
			state.fullY = predictArray(state.fullX);
			state.bandX = [];
			for (var x2 = -10; x2 <= 10.0001; x2 += 0.1) state.bandX.push(x2);
			state.bandY = predictArray(state.bandX);
			state.trainPred = predictArray(state.points.map(function (p) { return p.x; }));
		}
		function fmtErr(v) {
			if (!isFinite(v)) return DE ? "riesig" : "huge";
			if (v > 1000) return ">1000";
			if (v > 9.95) return v.toFixed(1);
			return v.toFixed(2);
		}
		function updateReadout() {
			if (!state.points.length || !state.model) return;
			var train = 0;
			state.points.forEach(function (p, i) {
				var e = (state.trainPred[i] || 0) - p.y;
				train += e * e;
			});
			train = Math.sqrt(train / state.points.length);
			var inside = 0;
			state.bandX.forEach(function (x, i) {
				var e = state.bandY[i] - Math.sin(x);
				inside += e * e;
			});
			inside = Math.sqrt(inside / state.bandX.length);
			var outside = 0, count = 0, maxOut = 0;
			state.fullX.forEach(function (x, i) {
				if (x >= -10 && x <= 10) return;
				var e = state.fullY[i] - Math.sin(x);
				outside += e * e;
				count++;
				if (Math.abs(e) > maxOut) maxOut = Math.abs(e);
			});
			outside = Math.sqrt(outside / Math.max(1, count));
			state.maxOut = maxOut;
			if (trainEl) trainEl.textContent = fmtErr(train);
			if (testEl) testEl.textContent = fmtErr(inside);
			if (outsideEl) outsideEl.textContent = fmtErr(outside);
			var verdict;
			if (state.epochs < 30) verdict = DE ? "Noch nicht trainiert" : "Not trained yet";
			else if (inside > 0.45) verdict = "Underfitting";
			else if (outside > 1.5 || outside > inside * 6) verdict = "Overfitting";
			else verdict = DE ? "Gute Anpassung" : "Good fit";
			if (verdictEl) verdictEl.textContent = verdict;
			if (epochsEl) epochsEl.textContent = (DE ? " Epochen: " : " Epochs: ") + state.epochs;
		}
		function setTrainButton(mode) {
			if (!trainBtn) return;
			trainBtn.classList.toggle("is-training", mode === "training");
			trainBtn.disabled = false;
			trainBtn.textContent = mode === "training"
				? (DE ? "Training stoppen" : "Stop training")
				: (DE ? "100 Epochen trainieren →" : "Train 100 epochs →");
		}
		function train(epochs) {
			if (state.training || !state.model) return Promise.resolve();
			state.training = true;
			state.stopRequested = false;
			setTrainButton("training");
			var startEpoch = state.epochs;
			var completed = 0;
			var xs = tf.tensor2d(state.points.map(function (p) { return [p.x / 10]; }), [state.points.length, 1]);
			var ys = tf.tensor2d(state.points.map(function (p) { return [p.y]; }), [state.points.length, 1]);
			return state.model.fit(xs, ys, {
				epochs: epochs,
				batchSize: 32,
				shuffle: true,
				verbose: 0,
				yieldEvery: "epoch",
				callbacks: {
					onEpochEnd: function (epoch, logs) {
						completed = epoch + 1;
						if (state.stopRequested) state.model.stopTraining = true;
						state.epochs = startEpoch + completed;
						state.lossHistory.push(logs.loss);
						state.currentLoss = logs.loss;
						if (lossValueEl) lossValueEl.textContent = logs.loss.toFixed(4);
						refreshPredictions();
						updateReadout();
						if (state.api) state.api.redraw();
						if (state.lossApi) state.lossApi.redraw();
					}
				}
			}).then(function () {
				xs.dispose();
				ys.dispose();
				state.epochs = startEpoch + completed;
				state.training = false;
				setTrainButton("idle");
				refreshPredictions();
				updateReadout();
				if (state.api) state.api.redraw();
				if (state.lossApi) state.lossApi.redraw();
			}).catch(function (err) {
				xs.dispose();
				ys.dispose();
				state.training = false;
				setTrainButton("idle");
				if (hintEl) hintEl.textContent = DE ? "Training fehlgeschlagen: " + err.message : "Training failed: " + err.message;
			});
		}
		function resetAndTrain(epochs) {
			if (state.training) return;
			if (state.model) state.model.dispose();
			state.model = makeModel();
			state.epochs = 0;
			state.lossHistory = [];
			state.currentLoss = null;
			if (lossValueEl) lossValueEl.textContent = "—";
			makePoints();
			refreshPredictions();
			updateReadout();
			if (state.api) state.api.redraw();
			if (state.lossApi) state.lossApi.redraw();
			train(epochs);
		}
		function draw(ctx, w, h) {
			var c = TM.colors();
			var padL = 58, padR = 24, padT = 22, padB = 40;
			var pw = w - padL - padR, ph = h - padT - padB;
			var xMin = -50, xMax = 50, yMin = -4, yMax = 4;
			function X(x) { return padL + (x - xMin) / (xMax - xMin) * pw; }
			function Y(y) { return padT + (yMax - y) / (yMax - yMin) * ph; }
			ctx.clearRect(0, 0, w, h);
			var bg = ctx.createLinearGradient(0, 0, 0, h);
			bg.addColorStop(0, c.paper2);
			bg.addColorStop(1, c.paper);
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, w, h);

			ctx.strokeStyle = c.dark ? "rgba(238,247,244,.07)" : "rgba(0,75,111,.07)";
			ctx.lineWidth = 1;
			for (var gx = -50; gx <= 50; gx += 10) {
				ctx.beginPath(); ctx.moveTo(X(gx), padT); ctx.lineTo(X(gx), padT + ph); ctx.stroke();
			}
			for (var gy = -4; gy <= 4; gy += 1) {
				ctx.beginPath(); ctx.moveTo(padL, Y(gy)); ctx.lineTo(padL + pw, Y(gy)); ctx.stroke();
			}
			ctx.fillStyle = c.muted;
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.textAlign = "center";
			[-50, -25, 0, 25, 50].forEach(function (v) { ctx.fillText(String(v), X(v), h - 16); });
			ctx.textAlign = "right";
			[-4, -2, 0, 2, 4].forEach(function (v) { ctx.fillText(String(v), padL - 8, Y(v) + 3); });
			ctx.textAlign = "center";

			ctx.fillStyle = c.dark ? "rgba(92,155,175,.16)" : "rgba(18,117,172,.10)";
			ctx.fillRect(X(-10), padT, X(10) - X(-10), ph);
			ctx.strokeStyle = c.blue;
			ctx.setLineDash([4, 4]);
			ctx.lineWidth = 1.2;
			ctx.strokeRect(X(-10), padT, X(10) - X(-10), ph);
			ctx.setLineDash([]);
			ctx.fillStyle = c.blue;
			ctx.font = "700 9px Barlow, system-ui, sans-serif";
			ctx.textAlign = "left";
			ctx.fillText(DE ? "Gesehenes Band" : "seen band", X(-10) + 6, padT + 14);

			ctx.beginPath();
			for (var i = 0; i <= 900; i++) {
				var x = xMin + (xMax - xMin) * i / 900;
				if (i === 0) ctx.moveTo(X(x), Y(Math.sin(x))); else ctx.lineTo(X(x), Y(Math.sin(x)));
			}
			ctx.strokeStyle = c.dark ? "rgba(238,247,244,.30)" : "rgba(0,75,111,.26)";
			ctx.lineWidth = 1.4;
			ctx.setLineDash([5, 5]);
			ctx.stroke();
			ctx.setLineDash([]);

			ctx.save();
			ctx.beginPath();
			ctx.rect(padL, padT, pw, ph);
			ctx.clip();
			ctx.beginPath();
			for (var j = 0; j < state.fullX.length; j++) {
				var yy = state.fullY[j];
				if (j === 0) ctx.moveTo(X(state.fullX[j]), Y(yy)); else ctx.lineTo(X(state.fullX[j]), Y(yy));
			}
			ctx.strokeStyle = c.gold;
			ctx.lineWidth = 2.6;
			ctx.stroke();
			ctx.restore();


			var insetW = Math.min(286, pw * 0.34), insetH = 132;
			var ix = padL + pw - insetW - 12, iy = padT + 12;
			ctx.fillStyle = c.paper;
			ctx.globalAlpha = 0.96;
			ctx.fillRect(ix, iy, insetW, insetH);
			ctx.globalAlpha = 1;
			ctx.strokeStyle = c.lineStrong;
			ctx.lineWidth = 1;
			ctx.strokeRect(ix, iy, insetW, insetH);
			var ipL = ix + 30, ipR = ix + insetW - 10, ipT = iy + 22, ipB = iy + insetH - 22;
			function IX(x) { return ipL + (x + 10) / 20 * (ipR - ipL); }
			function IY(y) { return ipB - (y + 2) / 4 * (ipB - ipT); }
			ctx.strokeStyle = c.dark ? "rgba(238,247,244,.07)" : "rgba(0,75,111,.07)";
			for (var gx2 = -10; gx2 <= 10; gx2 += 5) { ctx.beginPath(); ctx.moveTo(IX(gx2), ipT); ctx.lineTo(IX(gx2), ipB); ctx.stroke(); }
			for (var gy2 = -2; gy2 <= 2; gy2 += 1) { ctx.beginPath(); ctx.moveTo(ipL, IY(gy2)); ctx.lineTo(ipR, IY(gy2)); ctx.stroke(); }
			ctx.beginPath();
			for (var ii = 0; ii <= 200; ii++) {
				var xx = -10 + 20 * ii / 200;
				if (ii === 0) ctx.moveTo(IX(xx), IY(Math.sin(xx))); else ctx.lineTo(IX(xx), IY(Math.sin(xx)));
			}
			ctx.strokeStyle = c.dark ? "rgba(238,247,244,.34)" : "rgba(0,75,111,.30)";
			ctx.lineWidth = 1.2;
			ctx.setLineDash([4, 4]);
			ctx.stroke();
			ctx.setLineDash([]);
			ctx.save();
			ctx.beginPath();
			ctx.rect(ipL, ipT, ipR - ipL, ipB - ipT);
			ctx.clip();
			ctx.beginPath();
			state.bandX.forEach(function (x, k) {
				if (k === 0) ctx.moveTo(IX(x), IY(state.bandY[k])); else ctx.lineTo(IX(x), IY(state.bandY[k]));
			});
			ctx.strokeStyle = c.gold;
			ctx.lineWidth = 2;
			ctx.stroke();
			ctx.restore();
			ctx.fillStyle = c.blue;
			ctx.font = "700 8px Barlow, system-ui, sans-serif";
			ctx.textAlign = "left";
			ctx.fillText(DE ? "IM BAND" : "INSIDE THE BAND", ix + 8, iy + 13);

			ctx.font = "600 9px Barlow, system-ui, sans-serif";
			ctx.textAlign = "left";
			ctx.fillStyle = c.muted;
			ctx.fillText("sin(x)", padL + 4, padT + ph + 20);
			ctx.fillStyle = c.gold;
			ctx.fillText(DE ? "Modell" : "model", padL + 54, padT + ph + 20);
			if (state.maxOut > 8) {
				ctx.fillStyle = c.coral;
				ctx.textAlign = "right";
				ctx.fillText(DE ? "Der Fit verlässt das Bild" : "the fit leaves the view", padL + pw, padT + ph - 10);
			}
			ctx.textAlign = "left";
		}
		function drawLoss(ctx, w, h) {
			var c = TM.colors();
			ctx.clearRect(0, 0, w, h);
			var bg = ctx.createLinearGradient(0, 0, 0, h);
			bg.addColorStop(0, c.paper2);
			bg.addColorStop(1, c.paper);
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, w, h);
			var padL = 44, padR = 16, padT = 14, padB = 22;
			var pw = w - padL - padR, ph = h - padT - padB;
			var vals = state.lossHistory;
			ctx.strokeStyle = c.dark ? "rgba(238,247,244,.07)" : "rgba(0,75,111,.07)";
			ctx.lineWidth = 1;
			for (var gy = 0; gy <= 4; gy++) {
				ctx.beginPath();
				ctx.moveTo(padL, padT + ph * gy / 4);
				ctx.lineTo(padL + pw, padT + ph * gy / 4);
				ctx.stroke();
			}
			if (vals.length > 1) {
				var logs = vals.map(function (v) { return Math.log10(Math.max(v, 1e-6)); });
				var lo = Math.min.apply(null, logs);
				var hi = Math.max.apply(null, logs);
				if (hi - lo < 0.1) hi = lo + 0.1;
				ctx.beginPath();
				for (var i = 0; i < logs.length; i++) {
					var x = padL + (i / (logs.length - 1)) * pw;
					var y = padT + (hi - logs[i]) / (hi - lo) * ph;
					if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
				}
				ctx.strokeStyle = c.blue;
				ctx.lineWidth = 2;
				ctx.stroke();
				var lastY = padT + (hi - logs[logs.length - 1]) / (hi - lo) * ph;
				ctx.beginPath();
				ctx.arc(padL + pw, lastY, 3.2, 0, Math.PI * 2);
				ctx.fillStyle = c.gold;
				ctx.fill();
			}
			ctx.fillStyle = c.muted;
			ctx.font = "600 9px Barlow, system-ui, sans-serif";
			ctx.textAlign = "left";
			ctx.fillText(DE ? "Loss (log)" : "loss (log)", padL + 4, padT - 3);
			ctx.textAlign = "right";
			ctx.fillText(DE ? "Epochen" : "epochs", padL + pw, h - 6);
			ctx.textAlign = "left";
		}
		if (noiseSlider) {
			var noiseTimer = null;
			noiseSlider.addEventListener("input", function () {
				state.noise = Math.max(0, Math.min(0.6, parseFloat(noiseSlider.value) || 0));
				if (noiseOut) noiseOut.textContent = state.noise.toFixed(2);
				clearTimeout(noiseTimer);
				noiseTimer = setTimeout(function () { resetAndTrain(150); }, 220);
			});
		}
		if (trainBtn) trainBtn.addEventListener("click", function () {
			if (state.training) {
				state.stopRequested = true;
				if (state.model) state.model.stopTraining = true;
				return;
			}
			train(100);
		});
		if (resampleBtn) resampleBtn.addEventListener("click", function () {
			if (state.training) return;
			state.seed = (Math.random() * 0xffffffff) | 0;
			resetAndTrain(150);
		});
		if (noiseOut) noiseOut.textContent = state.noise.toFixed(2);
		function start() {
			state.model = makeModel();
			makePoints();
			state.api = TM.initCanvas(canvas, draw);
			if (lossCanvas) state.lossApi = TM.initCanvas(lossCanvas, drawLoss);
			refreshPredictions();
			updateReadout();
			if (state.api) state.api.redraw();
			if (state.lossApi) state.lossApi.redraw();
			var demo = document.getElementById("sinfit-demo");
			if (demo && "IntersectionObserver" in window) {
				var io = new IntersectionObserver(function (entries) {
					if (entries.some(function (e) { return e.isIntersecting; })) {
						io.disconnect();
						if (!state.training) train(100);
					}
				}, { threshold: 0.25 });
				io.observe(demo);
			} else {
				setTimeout(function () { train(100); }, 300);
			}
		}
		tf.setBackend("cpu").then(function () { return tf.ready(); }).then(start).catch(function (err) {
			if (hintEl) hintEl.textContent = DE ? "TF.js konnte nicht initialisiert werden: " + err.message : "TF.js could not be initialized: " + err.message;
		});
		window.addEventListener("tm:theme", function () {
			if (state.api) state.api.redraw();
			if (state.lossApi) state.lossApi.redraw();
		});
		window.addEventListener("tm:lang", function () {
			DE = TM.lang() === "de";
			updateReadout();
			if (state.api) state.api.redraw();
			if (state.lossApi) state.lossApi.redraw();
		});
	})();
	</script>
</body>
</html>
