<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="The text diet behind a frontier model: web, code, books, papers, filtering, deduplication, and contamination.">
	<meta name="theme-color" content="#ffffff">
	<title>What a Model Reads | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
</head>
<body data-lesson="training_data" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>A model is <em>what it reads.</em></h1>
					<p class="hero-deck">Architecture gets the headlines; data decides much of the behaviour. The mixture, quality, and cleanliness of the training corpus are half the secret.</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="idea">
						<div class="section-kicker"><span class="sk-num">01</span> The scale and the mix</div>
						<h2 class="section-title">Trillions of tokens.</h2>
						<div class="prose">
							<p>Learning was about the learner. Its diet is the next question. Frontier models are trained on trillions of tokens. The bulk comes from the web, with code, books, scientific papers, and reference text mixed in. Each source brings a different style and a different kind of knowledge. To make the number concrete: a token is roughly three quarters of an English word, so ten trillion tokens is on the order of seven trillion words: more than any person could read in a thousand lifetimes, and on the order of large estimates of all the books ever published.</p>
							<p>The mixture is a design choice. Too much web text and the model learns noise and spam; too little code and it cannot program; too little long-form text and it struggles with structure. The word “choice” is literal: labs tune the proportions, and changing them changes what the model is good at.</p>
						</div>
					</section>

					<section class="section-block" id="detail">
						<div class="section-kicker"><span class="sk-num">02</span> Cleaning is part of the model</div>
						<h2 class="section-title">Quality, dedupe, decontamination.</h2>
						<div class="prose">
							<p>Raw web text is messy. Pipelines filter for quality, remove duplicates, and try to remove test sets that would contaminate later benchmarks (<a href="https://arxiv.org/abs/2104.08758" rel="noopener">Dodge et al., 2021</a>; <a href="https://arxiv.org/abs/2107.06499" rel="noopener">Lee et al., 2021</a>). Deduplication matters because repeated text can make a model memorize instead of generalize, if the same paragraph appears a thousand times, the cheapest way to reduce loss is to store it, not to learn the pattern behind it. Duplicates also waste compute and make the corpus look larger than its effective diversity.</p>
							<p>Contamination is the benchmark version of the same problem (<a href="https://arxiv.org/abs/2310.17589" rel="noopener">Li et al., 2023</a>). If examples from a test set appear in training, a high score may measure recall rather than ability. The leak can be direct (the exact question) or indirect (a paraphrase, a solution posted online, or the same underlying document). Detecting it is hard, which is why benchmark claims deserve a second look.</p>
							<p>Data recipes are closely guarded. The same architecture trained on a better corpus can outperform a larger model trained on a worse one. Synthetic data can fill gaps, but it can also amplify the generator's biases and, at the limit, cause model collapse (<a href="https://arxiv.org/abs/2305.17493" rel="noopener">Shumailov et al., 2023</a>). Much web text is also copyrighted, some of it personal; whether training on it is fair use is a live dispute, not a settled technical detail.</p>
							<p>How is “quality” scored? Usually by a stack of imperfect proxies: length, punctuation, and repetition heuristics; a classifier trained on pages humans rated as useful; perplexity under a reference model; and spot checks. None is neutral: a filter trained on one kind of writing quietly prefers that kind, which is one way a corpus acquires a house style. When a model behaves strangely, the training data is often part of the explanation.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Scale</b><span>Modern corpora are measured in trillions of tokens.</span></div>
							<div class="keypoint"><b>Mixture</b><span>Web, code, books, papers, and reference text each add something different.</span></div>
							<div class="keypoint"><b>Quality filtering</b><span>Cleaning removes spam, boilerplate, and low-value text.</span></div>
							<div class="keypoint"><b>Contamination</b><span>Test data leaking into training makes benchmarks less trustworthy.</span></div>
						</div>
					</section>

					<section class="section-block" id="coherence">
						<div class="section-kicker"><span class="sk-num">03</span> Coherence and noise</div>
						<h2 class="section-title">Perfect data would be coherent.</h2>
						<div class="prose">
							<p>Two perfectly neutral observers describing the same fact from different perspectives should agree wherever their views overlap. Think of a panorama photo taken with a phone: the overlapping strips must match, or the seam is visible. Perfect data would have that property everywhere.</p>
							<p>Real data does not. People have different opinions, make mistakes, lie, measure badly, and cannot always say exactly what they mean. Sometimes all at once. A corpus is therefore full of contradictions, gaps, and noise.</p>
							<p>That does not make it useless. It is like Gauß and Ceres: individual observations scatter around the true orbit, but their errors cancel on average. A model trained on the corpus learns the middle of the cloud, not any single voice. It finds something between the measurements; the fit is the compromise, not a transcript.</p>
							<p>The choice of training data is therefore also the choice of what the network does. A corpus is a worldview: what it includes, what it leaves out, and which voices it treats as normal.</p>
						</div>
						<figure class="coherence-figure">
							<svg viewBox="0 0 420 220" role="img" aria-label="Noisy measurements around a fitted path">
							  <g><line x1="44" y1="24" x2="44" y2="188" class="coh-grid"/><line x1="88" y1="24" x2="88" y2="188" class="coh-grid"/><line x1="132" y1="24" x2="132" y2="188" class="coh-grid"/><line x1="176" y1="24" x2="176" y2="188" class="coh-grid"/><line x1="220" y1="24" x2="220" y2="188" class="coh-grid"/><line x1="264" y1="24" x2="264" y2="188" class="coh-grid"/><line x1="308" y1="24" x2="308" y2="188" class="coh-grid"/><line x1="352" y1="24" x2="352" y2="188" class="coh-grid"/><line x1="396" y1="24" x2="396" y2="188" class="coh-grid"/><line x1="44" y1="24" x2="396" y2="24" class="coh-grid"/><line x1="44" y1="57" x2="396" y2="57" class="coh-grid"/><line x1="44" y1="90" x2="396" y2="90" class="coh-grid"/><line x1="44" y1="123" x2="396" y2="123" class="coh-grid"/><line x1="44" y1="156" x2="396" y2="156" class="coh-grid"/></g>
							  <line x1="44" y1="188" x2="396" y2="188" class="coh-axis"/>
							  <line x1="44" y1="24" x2="44" y2="188" class="coh-axis"/>
							  <path d="M44.0 80.7 L47.5 83.7 L51.0 86.7 L54.6 89.8 L58.1 93.0 L61.6 96.2 L65.1 99.5 L68.6 102.7 L72.2 106.0 L75.7 109.3 L79.2 112.5 L82.7 115.8 L86.2 119.0 L89.8 122.2 L93.3 125.3 L96.8 128.3 L100.3 131.3 L103.8 134.2 L107.4 136.9 L110.9 139.6 L114.4 142.2 L117.9 144.6 L121.4 146.9 L125.0 149.1 L128.5 151.1 L132.0 152.9 L135.5 154.6 L139.0 156.1 L142.6 157.5 L146.1 158.7 L149.6 159.6 L153.1 160.4 L156.6 161.1 L160.2 161.5 L163.7 161.7 L167.2 161.8 L170.7 161.6 L174.2 161.3 L177.8 160.7 L181.3 160.0 L184.8 159.1 L188.3 158.0 L191.8 156.7 L195.4 155.3 L198.9 153.6 L202.4 151.8 L205.9 149.9 L209.4 147.8 L213.0 145.6 L216.5 143.2 L220.0 140.7 L223.5 138.0 L227.0 135.3 L230.6 132.5 L234.1 129.5 L237.6 126.5 L241.1 123.4 L244.6 120.3 L248.2 117.1 L251.7 113.9 L255.2 110.6 L258.7 107.3 L262.2 104.1 L265.8 100.8 L269.3 97.5 L272.8 94.3 L276.3 91.1 L279.8 88.0 L283.4 84.9 L286.9 81.9 L290.4 79.0 L293.9 76.2 L297.4 73.5 L301.0 70.9 L304.5 68.4 L308.0 66.0 L311.5 63.8 L315.0 61.7 L318.6 59.8 L322.1 58.1 L325.6 56.5 L329.1 55.0 L332.6 53.8 L336.2 52.7 L339.7 51.9 L343.2 51.2 L346.7 50.7 L350.2 50.4 L353.8 50.2 L357.3 50.3 L360.8 50.6 L364.3 51.0 L367.8 51.7 L371.4 52.5 L374.9 53.6 L378.4 54.8 L381.9 56.1 L385.4 57.7 L389.0 59.4 L392.5 61.3 L396.0 63.3" class="coh-fit"/>
							  <g><circle cx="160.5" cy="149.7" r="3.2" class="coh-dot"/><circle cx="75.5" cy="92.7" r="3.2" class="coh-dot"/><circle cx="232.1" cy="134.4" r="3.2" class="coh-dot"/><circle cx="222.5" cy="135.2" r="3.2" class="coh-dot"/><circle cx="63.7" cy="103.0" r="3.2" class="coh-dot"/><circle cx="81.7" cy="112.7" r="3.2" class="coh-dot"/><circle cx="194.5" cy="152.3" r="3.2" class="coh-dot"/><circle cx="126.5" cy="156.3" r="3.2" class="coh-dot"/><circle cx="263.1" cy="86.0" r="3.2" class="coh-dot"/><circle cx="185.1" cy="164.9" r="3.2" class="coh-dot"/><circle cx="380.9" cy="29.3" r="3.2" class="coh-dot"/><circle cx="148.9" cy="151.5" r="3.2" class="coh-dot"/><circle cx="99.8" cy="122.0" r="3.2" class="coh-dot"/><circle cx="326.8" cy="47.9" r="3.2" class="coh-dot"/><circle cx="112.1" cy="157.9" r="3.2" class="coh-dot"/><circle cx="176.9" cy="170.6" r="3.2" class="coh-dot"/><circle cx="236.1" cy="123.3" r="3.2" class="coh-dot"/><circle cx="120.6" cy="144.5" r="3.2" class="coh-dot"/><circle cx="281.0" cy="97.9" r="3.2" class="coh-dot"/><circle cx="248.9" cy="111.1" r="3.2" class="coh-dot"/><circle cx="204.2" cy="158.5" r="3.2" class="coh-dot"/><circle cx="287.2" cy="58.0" r="3.2" class="coh-dot"/><circle cx="133.5" cy="168.9" r="3.2" class="coh-dot"/><circle cx="346.8" cy="58.3" r="3.2" class="coh-dot"/><circle cx="297.5" cy="82.6" r="3.2" class="coh-dot"/><circle cx="90.9" cy="85.3" r="3.2" class="coh-dot"/></g>
							  <g class="coh-legend">
							    <circle cx="52" cy="20" r="3.2" class="coh-dot"/>
							    <text x="60" y="23">MEASUREMENTS</text>
							    <line x1="152" y1="20" x2="170" y2="20" class="coh-fit"/>
							    <text x="176" y="23">FIT</text>
							  </g>
							</svg>
							<figcaption>Noisy measurements (blue) and the fitted path (green). The fit is not any single observation; it is the compromise between all of them.</figcaption>
						</figure>
					</section>


					<div class="demo demo--paper" data-demo="datamix">
						<div class="demo-head">
							<div>
								<p class="demo-title">The training mix <span>· demo</span></p>
								<p class="demo-sub">A frontier corpus is a designed mixture, not a random dump. The bars below use illustrative values, not any one lab's recipe; tap a source to see what it contributes.</p>
							</div>
							<span class="demo-badge">approximate</span>
						</div>
						<div class="demo-body">
							<div class="mix-bar" data-mix-bar></div>
							<div class="mix-legend" data-mix-legend></div>
							<p class="mix-note" data-mix-note>Illustrative values, not a published recipe: web 55%, code 13%, books 8%, papers 4%, Wikipedia 2%, math 4%, conversation 4%, multimodal 10%. Tap a source to see what it contributes.</p>
							<div class="demo-readout">
								<div><b>Scale</b><span>10-15T tokens</span></div>
								<div><b>Sources</b><span>web · code · books · multimodal</span></div>
								<div><b>Key step</b><span>filtering</span></div>
							</div>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>Architecture and data are not separate choices. A better mixture can make a smaller model competitive, but scale still matters.</span></div>
						<div class="demo-foot">Illustrative values, not a published recipe. Anchor: GPT-3 used 60% Common Crawl, 22% WebText2, 8% Books1, 8% Books2, 3% Wikipedia (<a href="https://arxiv.org/abs/2005.14165" rel="noopener">Brown et al., 2020</a>, Table 2.2). Labs do not publish exact recipes.</div>
					</div>

					<div class="demo demo--paper" data-demo="filter">
						<div class="demo-head">
							<div>
								<p class="demo-title">Filter the corpus <span>· demo</span></p>
								<p class="demo-sub">Raise the minimum quality and watch the kept set shrink. The goal is a corpus that is both large enough and clean enough.</p>
							</div>
							<span class="demo-badge">illustrative</span>
						</div>
						<div class="demo-body">
							<div class="filter-stream" data-filter-stream></div>
							<div class="demo-controls">
								<label>Minimum quality <input type="range" data-filter-strength min="0" max="3" step="1" value="1"><output data-filter-strength-out>1</output></label>
							</div>
							<div class="demo-readout demo-readout--4">
								<div><b>Kept</b><span data-filter-kept>...</span></div>
								<div><b>Dropped</b><span data-filter-dropped>...</span></div>
								<div><b>Avg quality</b><span data-filter-quality>...</span></div>
								<div><b>Web left (rough)</b><span data-filter-size>...</span></div>
							</div>
							<p class="demo-hint">Rough estimate: 100 PB of raw web text before deduplication. The rest of the pipeline shrinks it further.</p>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>Quality and quantity pull in different directions. The useful recipe is the one that keeps enough scale without teaching the model noise.</span></div>
					</div>






					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">04</span> Takeaway</div>
						<h2 class="section-title">The short version.</h2>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">A model is a compressed reflection of its data.</p>
							<p class="aha-sub">Architecture sets the shape; data fills it with the world.</p>
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
