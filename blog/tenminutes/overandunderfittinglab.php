<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="Why a model can fit the training data perfectly and still fail on the next example.">
	<meta name="theme-color" content="#ffffff">
	<title>Pattern or Memorization? | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
</head>
<body data-lesson="overandunderfittinglab" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>Fit the pattern, <em>not the noise.</em></h1>
					<p class="hero-deck">A model can be too simple to see the rule or so flexible that it memorizes every accident. Generalization lives between those two failures.</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="idea">
						<div class="section-kicker"><span class="sk-num">01</span> The two failures</div>
						<h2 class="section-title">Too simple or too flexible.</h2>
						<div class="prose">
							<p>The tiny learner had two knobs. With many knobs, the danger shifts from underfitting to memorization. Underfitting is a model that is too simple. It misses the real pattern and performs badly on both training and new data. Overfitting is the opposite: the model is flexible enough to memorize the training examples, including their noise, and then fails when the noise changes.</p>
							<p>The classic demonstration is a polynomial fit. A straight line underfits a sine wave; a very high-degree polynomial can pass through every training point and still <a href="https://archive.org/details/zeitschriftfrma12runggoog" rel="noopener">oscillate wildly</a> between them (the Runge phenomenon, 1901). The oscillations are not the model “discovering” a wiggle; they are the price of having enough freedom to satisfy every point at once. Between the data points, nothing constrains it, so it invents motion.</p>
						</div>
					</section>

					<section class="section-block" id="detail">
						<div class="section-kicker"><span class="sk-num">02</span> How to tell the difference</div>
						<h2 class="section-title">Test on what it has not seen.</h2>
						<div class="prose">
							<p>Measure performance on data the model did not train on. If training improves while validation gets worse, you are overfitting. If both stay bad, you are underfitting. Interpolation (a test point between known examples) is the easy case. Extrapolation, outside the training range, is where a low training error can hide a confident failure.</p>
							<p>The fix is not always “more data” or “a bigger model”. It can be a simpler model, regularization, early stopping, or a training set that better represents the world. More data helps only if it is representative; weight decay, dropout, and early stopping make the model work harder to fit the same points. And very large networks often generalize well despite having enough parameters to memorize: the so-called double-descent curve (<a href="https://arxiv.org/abs/1803.08785" rel="noopener">Belkin et al., 2019</a>). The classical trade-off is a first map, not the whole territory. And a low test error on one dataset is not a guarantee: a model trained on one hospital's scans can fail at another hospital with different machines. Distribution shift is often invisible until deployment, so test the cases you actually care about.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Underfitting</b><span>Too simple: the model misses the pattern.</span></div>
							<div class="keypoint"><b>Overfitting</b><span>Too flexible: the model memorizes the noise.</span></div>
							<div class="keypoint"><b>Validation</b><span>Only held-out data tells you whether the model generalizes.</span></div>
							<div class="keypoint"><b>Extrapolation</b><span>A model can look excellent inside its data and fail outside it.</span></div>
						</div>
					</section>


					<div class="demo demo--paper" data-demo="polyfit">
						<div class="demo-head">
							<div>
								<p class="demo-title">Fit the pattern, not the noise <span>· demo</span></p>
								<p class="demo-sub">Raise the polynomial degree. Green points are training data, blue points are held-out data. Watch the curve fit the training set while the test error tells a different story.</p>
							</div>
							<span class="demo-badge">live</span>
						</div>
						<div class="demo-body">
							<canvas class="demo-canvas demo-canvas--md" data-polyfit-canvas aria-label="Polynomial fits to training and test points"></canvas>
							<div class="gd-loss" style="margin-top:12px">
								<svg data-polyfit-chart viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Training and test error as a function of polynomial degree"></svg>
								<div class="legend-dots">
									<span><i style="background:var(--tm-green)"></i>training error</span>
									<span><i style="background:var(--tm-coral)"></i>test error</span>
									<span>degree →</span>
								</div>
							</div>
							<div class="demo-controls">
								<label>Degree <input type="range" data-polyfit-degree min="1" max="11" step="1" value="2"><output data-polyfit-degree-out>2</output></label>
							</div>
							<div class="demo-readout">
								<div><b>Training error</b><span data-polyfit-train>...</span></div>
								<div><b>Test error</b><span data-polyfit-test>...</span></div>
								<div><b>What to watch</b><span>the gap</span></div>
							</div>
							<p class="demo-hint" data-polyfit-note></p>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>Watch the gap between training and test error: it grows when the curve starts memorizing.</span></div>
					</div>





					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">03</span> Takeaway</div>
						<h2 class="section-title">The short version.</h2>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">A perfect training score can be a warning sign.</p>
							<p class="aha-sub">What matters is performance on examples the model has never seen.</p>
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
