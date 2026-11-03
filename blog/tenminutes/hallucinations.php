<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="Why a next-token predictor can sound certain and still be wrong, and how to use it without trusting it blindly.">
	<meta name="theme-color" content="#ffffff">
	<title>When the Model Does Not Know | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css">
</head>
<body data-lesson="hallucinations" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>Plausible is <em>not the same as true.</em></h1>
					<p class="hero-deck">A language model is a pattern completion engine, not a database. That is the source of its fluency and the source of its most dangerous failure.</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="idea">
						<div class="section-kicker"><span class="sk-num">01</span> The idea</div>
						<h2 class="section-title">It completes patterns.</h2>
						<div class="prose">
							<p>The next-token loop is a pattern completer. The same property that makes it fluent also makes it capable of confident nonsense. The model does not look up facts in a table. It has learned, from a very large amount of text, which continuations usually follow which contexts. Ask for a medical study and it knows what a study title looks like; it can produce a convincing one that does not exist. The reason is structural: there is no separate “truth” variable in the objective. The training signal rewards a likely continuation, and a well-formed fake citation is often a very likely continuation of “a 2019 study in <em>Nature</em> found…”.</p>
							<p>This is not lying in the human sense. The model has no intention to deceive and no internal fact-checker. It is doing the only thing it was trained to do: assigning probability to the next token. The word “hallucination” is itself a metaphor: the model is not perceiving something that is not there; it is completing a pattern. Some researchers prefer “confabulation”, which at least captures the sense of a confident story built to fit.</p>
						</div>
					</section>

					<section class="section-block" id="detail">
						<div class="section-kicker"><span class="sk-num">02</span> Why it sounds confident</div>
						<h2 class="section-title">Confidence is not evidence.</h2>
						<div class="prose">
							<p>Confidence is a property of the text, not of the model's knowledge. A fluent answer with a plausible citation can be wrong in every detail. Temperature makes this worse: a higher temperature flattens the distribution and can push the model toward less likely, more inventive continuations (<a href="https://arxiv.org/abs/1904.09751" rel="noopener">Holtzman et al., 2020</a>). Why doesn't the model simply say “I don't know”? Sometimes it does, but that is a behaviour learned in post-training, not a reading from an internal truth meter. One common failure is <strong>sycophancy</strong>: the model agrees with a false premise and invents a justification (<a href="https://arxiv.org/abs/2310.13548" rel="noopener">Sharma et al., 2023</a>). There is no dial inside the model labelled certainty.</p>
							<p>Hallucination is not uniform. Models are most reliable where the pattern is dense and redundant (common syntax, well-known facts, code idioms) and least reliable where the pattern is sparse, recent, private, or contradictory. Scale lowers the error rate on many benchmarks, but it also makes a wrong answer sound better; it shifts the odds, it does not install a guarantee.</p>
							<p>Use the model as a draft, a tutor, or a search aid, not as an oracle. Verify names, numbers, quotes, and citations. Give it documents with retrieval, ask it to show its sources, and keep a human in the loop for anything that matters. Retrieval helps because it changes the task: instead of recalling a fact from compressed weights, the model can copy a passage that is present in the context. It is not a guarantee (the model can still misread the passage) but it makes “where did this come from?” a question with an answer.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Pattern completion</b><span>The model predicts plausible text; it does not consult a truth database.</span></div>
							<div class="keypoint"><b>Fluency</b><span>Confident tone is a property of the writing, not evidence of correctness.</span></div>
							<div class="keypoint"><b>Temperature</b><span>More randomness can increase invention and error.</span></div>
							<div class="keypoint"><b>Verification</b><span>Check claims and sources; use retrieval and tools for grounding.</span></div>
						</div>
					</section>


					<div class="demo demo--paper" data-demo="sampling">
						<div class="demo-head">
							<div>
								<p class="demo-title">The distribution behind the sentence <span>· demo</span></p>
								<p class="demo-sub">The model has just read “The capital of France is”. Change the temperature and the candidate filter. After top-p, the surviving bars are renormalized to 100%; cut tokens are shown in grey and do not count.</p>
							</div>
							<span class="demo-badge">live</span>
						</div>
						<div class="demo-body">
							<div class="dist-bars" data-sampling-bars></div>
							<div class="demo-controls">
								<label>Temperature <input type="range" data-sampling-temp min="0.1" max="2" step="0.05" value="0.8"><output data-sampling-temp-out>0.80</output></label>
								<label>Top-p <input type="range" data-sampling-topp min="0.1" max="1" step="0.05" value="1"><output data-sampling-topp-out>1.00</output></label>
							</div>
							<div class="demo-readout">
								<div><b>Likely choice</b><span data-sampling-choice>Paris</span></div>
								<div><b>Surviving tokens</b><span data-sampling-count>5 / 5</span></div>
								<div><b>Entropy</b><span data-sampling-entropy>...</span></div>
							</div>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>A confident tone is just a sharp distribution. Lower temperature makes the likely token dominate; top-p removes the long tail. Neither makes the answer true.</span></div>
						<div class="demo-foot">Top-p changes the candidate set, not the model’s knowledge. The bright bars are the renormalized distribution; the grey rows are the tokens that were cut.</div>
					</div>

					<div class="demo demo--paper" data-demo="citecheck">
						<div class="demo-head">
							<div>
								<p class="demo-title">Real paper or convincing fake? <span>· demo</span></p>
								<p class="demo-sub">Models produce references that look exactly like real ones. Guess, then check. The point is not intuition: it is provenance.</p>
							</div>
							<span class="demo-badge">spot the fake</span>
						</div>
						<div class="demo-body">
							<div class="cc-list" data-citecheck-list></div>
							<div class="cc-actions">
								<button class="btn-demo" type="button" data-citecheck-reset>New round</button>
								<span class="nt-temp" style="margin-left:auto">Score <b data-citecheck-score>...</b></span>
							</div>
							<p class="cc-verdict" data-citecheck-verdict></p>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>A plausible title, venue, and author list are cheap to generate. A DOI that resolves is not.</span></div>
						<div class="demo-foot">The real references are real; the fabricated ones are invented for the exercise. Verify any citation before you use it.</div>
					</div>




					<section class="section-block" id="mitigate">
						<div class="section-kicker"><span class="sk-num">03</span> Detection and mitigation</div>
						<h2 class="section-title">A workflow, not a detector.</h2>
						<div class="prose">
							<p>No single detector is reliable. A watermark can be removed, a classifier can be fooled, and an LLM asked to grade its own answer can be confidently wrong. The practical response is a chain: retrieve documents and ask for citations, cross-check names, numbers, and quotes, run self-consistency or a second model, and use tools for arithmetic and code. For high-stakes work, a human reads the evidence.</p>
							<p>It helps to separate <strong>bullshit</strong> from lying in Harry Frankfurt's sense: a liar knows the truth and tries to hide it, while the model is indifferent to truth and produces what fits the context. The output can be fluent, useful, and false at the same time. Sycophancy and length bias make it worse: the model may agree with a false premise or pad an answer because longer, agreeable text is a common pattern in the training data.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Retrieve</b><span>Put the evidence in the context and ask for citations.</span></div>
							<div class="keypoint"><b>Cross-check</b><span>Verify names, numbers, quotes, and DOIs independently.</span></div>
							<div class="keypoint"><b>Use tools</b><span>Let code, search, or a calculator do the exact part.</span></div>
							<div class="keypoint"><b>Abstain</b><span>Make “I don't know” an acceptable answer.</span></div>
						</div>
					</section>

					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">04</span> Takeaway</div>
						<h2 class="section-title">The short version.</h2>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">The model is not lying. It is completing a pattern.</p>
							<p class="aha-sub">Truth is a property of your workflow, not a promise from the model.</p>
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
