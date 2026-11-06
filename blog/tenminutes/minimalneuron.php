<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="One input, one output, two numbers to adjust: the smallest possible learner and the loop behind every neural network.">
	<meta name="theme-color" content="#ffffff">
	<title>A Tiny Example Network | Ten Minutes</title>
	<link rel="stylesheet" href="../Temml-Local.min.css">
	<link rel="stylesheet" href="assets/site.css">
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
							<p>To learn, a model needs a number that says how wrong it is. That number is the <strong>loss</strong>. For a line through noisy points, the usual choice is the <strong>mean squared error</strong> (MSE): the average of the squared vertical distances between the points and the line. Gauß used the same idea for Ceres in 1801, as the history chapter tells it. Squaring punishes a large miss much more than a small one, and it makes the slope smooth.</p>
							<p>MSE has a useful shape for learning. Far from the best line the error surface is steep, so a gradient step can move a long way and quickly reach the right region. Close to the bottom the surface flattens, so the same step size would overshoot; the learning rate has to become smaller, or the optimizer has to adapt it, to do the fine work. Early progress is coarse, late progress is detailed.</p>
							<p>Not every task is a curve. A classifier chooses among categories, and there the usual loss is <strong>categorical cross-entropy</strong>. It asks two questions: was the right category chosen, and how confident was the model? A confident correct answer is rewarded; an uncertain correct answer is rewarded less; a confident wrong answer is punished much more. The model’s outputs are treated as probabilities over the categories, and the loss measures how much probability the correct category received.</p>
							<p>The network’s output is scored with that function, and <strong>backpropagation</strong> computes how each weight contributed to the loss. An <strong>optimizer</strong> then changes the weights a little. The details belong to the backpropagation and optimizer chapters; here the shape is enough: the loss defines a landscape, every weight is one direction, and the height is the error.</p>
							<p>In a large network that landscape lives in millions of dimensions. The image below is a real loss landscape reduced to three dimensions so that it can be drawn. You start somewhere on the surface and look for the direction in which the ball rolls downhill. That direction is the negative gradient, and the loss is the error: the height tells you how wrong the model is.</p>
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
							<p>The error is a number. For a line, the mean squared error is the average of the squared vertical distances between the points and the line. Why squared? Because it punishes large misses much more than small ones, and because its slope is smooth and easy to compute. Absolute error is also a valid choice; the squared version is simply the default that makes the gradient a clean linear function. That number defines a surface: every choice of a and b gives a point on the surface, and the height is the error.</p>
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






					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">05</span> Takeaway</div>
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
	<script src="assets/site.js"></script>
	<script src="assets/demos.js"></script>
</body>
</html>
