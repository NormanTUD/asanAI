<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="How an LLM turns 'The capital of France is' into 'Paris': residual streams, attention, MLP memory, and the limits of the explanation.">
	<meta name="theme-color" content="#ffffff">
	<title>Where a Fact Lives | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css">
</head>
<body data-lesson="fact_lookup" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>A fact is <em>a pattern, not a row.</em></h1>
					<p class="hero-deck">The model has no table called 'countries'. 'Paris' emerges from the interaction of weights, attention, and a residual stream. The picture is partial, and that limit matters.</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="idea">
						<div class="section-kicker"><span class="sk-num">01</span> A forward pass, not a lookup</div>
						<h2 class="section-title">The computation produces the fact.</h2>
						<div class="prose">
							<p>Positional encoding put tokens in order. Where does a fact live in the resulting computation? The prompt becomes tokens, then vectors. Each transformer block reads from a residual stream, lets attention route information between positions, and lets the MLP write an update back into the stream. The final vector is scored against the vocabulary.</p>
							<p>The residual stream is a shared scratchpad. Attention can move the meaning of 'France' to the final position; the MLP can act like a learned key-value memory. The fact is distributed across many weights, not stored in one place.</p>
						</div>
					</section>

					<section class="section-block" id="detail">
						<div class="section-kicker"><span class="sk-num">02</span> What we know and what we do not</div>
						<h2 class="section-title">Partial maps, real limits.</h2>
						<div class="prose">
							<p>Mechanistic interpretability has found circuits (<a href="https://arxiv.org/abs/2209.11895" rel="noopener">Olsson et al., 2022</a>): small sets of attention heads and MLP neurons that implement a behaviour. Induction heads, for example, learn to complete a pattern of the form A B … A → B. The linear representation hypothesis (<a href="https://arxiv.org/abs/2311.03658" rel="noopener">Park et al., 2024</a>) adds that many features are directions in the residual stream, which is why a method like ROME can edit a fact by changing specific weights.</p>
							<p>The picture is still partial. Features can be superposed, neurons can be polysemantic, and editing one fact can have side effects. The practical lesson is not that the model has a tidy database; it is that knowledge is entangled with computation. That is why a model can be confident and wrong, and why the full blueprint is unknown even to the people who build it.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Forward pass</b><span>The fact emerges from the whole computation, not one lookup.</span></div>
							<div class="keypoint"><b>Residual stream</b><span>A shared workspace that each layer reads and updates.</span></div>
							<div class="keypoint"><b>MLP memory</b><span>Feed-forward layers can act like learned key-value associations.</span></div>
							<div class="keypoint"><b>Open question</b><span>Interpretability gives partial maps, not the complete blueprint.</span></div>
						</div>
					</section>


					<div class="demo demo--paper timeline-shell" data-demo="timeline" data-arrow-nav>
						<div class="demo-head">
							<div>
								<p class="demo-title">A forward pass in five steps <span>· demo</span></p>
								<p class="demo-sub">Walk from tokens to the next-token distribution. Each step is a different kind of computation, not a database lookup.</p>
							</div>
							<span class="demo-badge">step through</span>
						</div>
						<div class="demo-body">
							<div class="timeline-scroller">
								<button class="tl-scroll-btn" type="button" data-timeline-prev data-arrow-prev aria-label="Scroll left">‹</button>
								<div class="timeline-track" data-timeline-track role="group" aria-label="A forward pass in five steps">
									<button class="tl-node is-active" type="button" data-meta="01 · Tokens" data-title="Tokens" data-body="The prompt becomes token IDs. The model still has no idea what a country is."><span class="tl-dot"></span><span class="tl-date">01</span><span class="tl-name">Tokens</span></button>
									<button class="tl-node" type="button" data-meta="02 · Vectors" data-title="Embeddings" data-body="Each token becomes a vector. Similar meanings sit near each other, but no single number is a fact."><span class="tl-dot"></span><span class="tl-date">02</span><span class="tl-name">Vectors</span></button>
									<button class="tl-node" type="button" data-meta="03 · Routing" data-title="Attention" data-body="Attention moves information between positions. It can bring the meaning of “France” to the final token."><span class="tl-dot"></span><span class="tl-date">03</span><span class="tl-name">Routing</span></button>
									<button class="tl-node" type="button" data-meta="04 · Memory" data-title="MLP" data-body="The feed-forward layer writes an update into the residual stream. It can act like a learned key-value memory."><span class="tl-dot"></span><span class="tl-date">04</span><span class="tl-name">Memory</span></button>
									<button class="tl-node" type="button" data-meta="05 · Scores" data-title="Logits" data-body="The final vector is scored against the vocabulary. “Paris” wins because the whole computation made it likely."><span class="tl-dot"></span><span class="tl-date">05</span><span class="tl-name">Scores</span></button>
								</div>
								<button class="tl-scroll-btn" type="button" data-timeline-next data-arrow-next aria-label="Scroll right">›</button>
							</div>
							<div class="tl-panel no-figure" data-timeline-panel aria-live="polite"></div>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>A fact is computed, not looked up.</span></div>
					</div>

					<div class="demo demo--paper" data-demo="logitlens">
						<div class="demo-head">
							<div>
								<p class="demo-title">Watch the answer form <span>· demo</span></p>
								<p class="demo-sub">The logit lens reads the residual stream at each layer. Early layers are undecided; the final layers concentrate on the answer.</p>
							</div>
							<span class="demo-badge">illustrative</span>
						</div>
						<div class="demo-body">
							<div class="dist-bars" data-lens-bars></div>
							<div class="demo-controls">
								<label>Layer <input type="range" data-lens-layer min="0" max="6" step="1" value="0"><output data-lens-layer-out>0</output></label>
							</div>
							<div class="demo-readout">
								<div><b>Top token</b><span data-lens-top>...</span></div>
								<div><b>Paris probability</b><span data-lens-paris>...</span></div>
								<div><b>Layer</b><span data-lens-layer-name>embedding</span></div>
							</div>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>The answer is not present all at once. It sharpens as the residual stream passes through the layers.</span></div>
					</div>






					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">03</span> Takeaway</div>
						<h2 class="section-title">The short version.</h2>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">'Paris' is a pattern in the weights, not a row in a table.</p>
							<p class="aha-sub">The model computes an answer; it does not look one up.</p>
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
