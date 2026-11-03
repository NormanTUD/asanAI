<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="Benchmarks, contamination, judge bias, and how to measure an LLM without fooling yourself.">
	<meta name="theme-color" content="#ffffff">
	<title>Measuring What It Can Do | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css">
</head>
<body data-lesson="evaluation" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>A score is <em>not understanding.</em></h1>
					<p class="hero-deck">Benchmarks are useful, but they shape what models optimize for. The hardest part of evaluation is knowing whether you measured the thing you care about.</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="idea">
						<div class="section-kicker"><span class="sk-num">01</span> Four families of tests</div>
						<h2 class="section-title">Different tests, different blind spots.</h2>
						<div class="prose">
							<p>Local inference was about where a model runs. Evaluation is how we know whether it works. Multiple-choice benchmarks measure recognition (<a href="https://arxiv.org/abs/2009.03300" rel="noopener">Hendrycks et al., 2021</a>). Verifiable-answer benchmarks check a solution that can be tested, such as code against unit tests (<a href="https://arxiv.org/abs/2107.03374" rel="noopener">Chen et al., 2021</a>). LLM-as-judge benchmarks score open-ended text by giving a strong model the rubric and asking it to grade another model's output (<a href="https://arxiv.org/abs/2306.05685" rel="noopener">Zheng et al., 2023</a>). Human preference tests ask people which answer they prefer.</p>
							<p>Each family has failure modes. Multiple choice can be gamed by guessing patterns: a model can exploit the position of the correct option, the length of the options, or the fact that “all of the above” is often right. Exact match can miss a correct answer in a different form; judges inherit biases; human ratings are noisy and expensive.</p>
						</div>
					</section>

					<section class="section-block" id="detail">
						<div class="section-kicker"><span class="sk-num">02</span> Contamination and the real task</div>
						<h2 class="section-title">Measure your problem.</h2>
						<div class="prose">
							<p>Benchmark contamination is the central problem, if the test data appeared in training, a high score may measure memorization rather than capability. Deduplication helps, but it is hard to prove a negative. Leaderboard pressure makes it worse. Goodhart's law applies (<a href="https://books.google.de/books?id=OMe6UQxu1KcC&amp;pg=PA111&amp;redir_esc=y#v=onepage&amp;q&amp;f=false" rel="noopener">Goodhart, 1975</a>), when a measure becomes a target, it stops being a good measure.</p>
							<p>For your own use case, build a small evaluation that reflects the real task. Define a rubric, collect examples, measure agreement, and check whether the difference you see is larger than the noise. A general benchmark is a starting point, not a verdict.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Benchmark types</b><span>Recognition, exact match, judged quality, and human preference measure different things.</span></div>
							<div class="keypoint"><b>Contamination</b><span>Training on the test set inflates scores.</span></div>
							<div class="keypoint"><b>Judge bias</b><span>An LLM judge can prefer style over correctness.</span></div>
							<div class="keypoint"><b>Your task</b><span>The most useful evaluation is the one built for your problem.</span></div>
						</div>
					</section>


					<figure>
						<img src="../canary_coal_mine.jpg" alt="A foreman holding a canary in a coal mine" loading="lazy">
						<figcaption>A foreman with a canary, the miners' carbon-monoxide detector (U.S. Bureau of Mines, 1928). Photo: <a href="https://commons.wikimedia.org/wiki/File:Canary_coal_mine.jpg" rel="noopener">public domain</a>.</figcaption>
					</figure>

					<div class="demo demo--paper" data-demo="contamination">
						<div class="demo-head">
							<div>
								<p class="demo-title">A score can be contaminated <span>· demo</span></p>
								<p class="demo-sub">Slide the contamination up. The reported score rises while the true skill stays the same: the benchmark starts measuring memory.</p>
							</div>
							<span class="demo-badge">illustrative</span>
						</div>
						<div class="demo-body">
							<div class="dist-bars">
								<div class="dist-row" style="grid-template-columns:92px minmax(0,1fr)">
									<span class="dist-label">Reported</span>
									<span class="dist-track"><span class="dist-fill" data-contam-score style="background:var(--tm-coral)"></span></span>
								</div>
								<div class="dist-row" style="grid-template-columns:92px minmax(0,1fr)">
									<span class="dist-label">True skill</span>
									<span class="dist-track"><span class="dist-fill" data-contam-skill style="background:var(--tm-green)"></span></span>
								</div>
							</div>
							<div class="demo-controls">
								<label>Contamination <input type="range" data-contam min="0" max="100" step="1" value="0"><output data-contam-out>0%</output></label>
							</div>
							<div class="demo-readout">
								<div><b>Lesson</b><span>check the data</span></div>
								<div><b>Reported</b><span data-contam-score-val>...</span></div>
								<div><b>True skill</b><span data-contam-skill-val>...</span></div>
							</div>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>A benchmark is a proxy. If the test data leaked into training, a high score may measure memory rather than capability.</span></div>
					</div>





					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">03</span> Takeaway</div>
						<h2 class="section-title">The short version.</h2>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">Measure the task you care about, not just the leaderboard.</p>
							<p class="aha-sub">A benchmark is a proxy; it becomes dangerous when you forget what it is a proxy for.</p>
						</div>
					</section>
				</article>
			</div>
		</div>
	</main>

	<script src="assets/site.js"></script>
	<script src="assets/demos.js"></script>
</body>
</html>
