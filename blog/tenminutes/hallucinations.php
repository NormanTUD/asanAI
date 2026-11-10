<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="Why a language model can invent a study, a date, or a quote, how to recognize the failure, and how to check claims against reality and for consistency.">
	<meta name="theme-color" content="#ffffff">
	<title>When the Model Does Not Know | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
</head>
<body data-lesson="hallucinations" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>Plausible is <em>not the same as true.</em></h1>
					<p class="hero-deck">A model can invent a study, a date, or a quote in the same confident tone as a fact. This page shows how to spot the failure, why it happens, and how to check claims against reality and against themselves.</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="idea">
						<div class="section-kicker"><span class="sk-num">01</span> The idea</div>
						<h2 class="section-title">It completes patterns.</h2>
						<div class="prose">
							<p>Ask for three papers on a niche topic. You may get back three titles, the right venues, the right author initials, and not one identifier that resolves. How can an answer be so specific and so empty at once? By the end of this page you will have a test that separates a fabricated answer from a real one before you use it.</p>
							<p>A DOI is a persistent identifier for an article, an ISBN for a book, an ISSN for a journal, and an arXiv ID for a preprint. A real identifier leads to something. The model never does that lookup. It predicts token by token, so it has learned which words usually follow which contexts. A well-formed but invented reference is a very likely continuation of “a 2019 study in <em>Nature</em> found…”. The training objective contains no variable for truth.</p>
							<p>That is not lying. The model has no intention to deceive and no internal fact-checker; nothing would mark the empty reference as empty. Some researchers prefer “confabulation”: <a href="https://arxiv.org/abs/2406.04175" rel="noopener">Sui et al. (2024)</a> use it for the narrative character of the output, and <a href="https://arxiv.org/abs/2312.03729" rel="noopener">Liu et al. (2024)</a> use it for an answer that disagrees with the model’s own internal representation of truth. Whatever the name, the failure is real.</p>
							<p>Harry Frankfurt’s essay <a href="https://web.archive.org/web/20250201061311/https://www2.csudh.edu/ccauthen/576f12/frankfurt__harry_-_on_bullshit.pdf" rel="noopener">“On Bullshit” (1986)</a> draws the line: a liar knows the truth and works against it, while a bullshitter is indifferent to how things really are and says what suits the purpose. By that account, a fluent hallucination is bullshit, not a lie. The model chooses what fits the pattern, not what fits the world.</p>
							<p>Meaning in the model is a position in a vector space, not a set of logical symbols. Negation is another context that moves the vector a little; it does not flip it to the opposite. A 2-D sketch shows the effect: “not sad” sits near “sad”, not near “happy”. Real embeddings are messier, but the measured failure is the same: universal text embedding models often score a negated sentence and its original as semantically similar (<a href="https://arxiv.org/abs/2504.00584" rel="noopener">Cao, 2025</a>).</p>
						</div>

						<div class="demo demo--paper" data-demo="negation" data-neg-variant="sad">
							<div class="demo-head">
								<div>
									<p class="demo-title">Where “not sad” lives <span>· demo</span></p>
									<p class="demo-sub">The phrase “not sad” stays near “sad” and far from “happy”. Negation nudges the vector; it does not flip it to the opposite.</p>
								</div>
								<span class="demo-badge">2-D schematic</span>
							</div>
							<div class="demo-body">
								<canvas class="demo-canvas demo-canvas--md" data-negation-canvas aria-label="A two-dimensional schematic with sad, not sad, and happy; not sad sits near sad and far from happy"></canvas>
								<div class="demo-readout">
									<div><b>Nearest to “not sad”</b><span>sad</span></div>
									<div><b>Distance to “sad”</b><span>0.34</span></div>
									<div><b>Distance to “happy”</b><span>1.16</span></div>
								</div>
								<p class="demo-hint">Toy coordinates in arbitrary units. The measured failure is real: negated and original sentences often score as similar (<a href="https://arxiv.org/abs/2504.00584" rel="noopener">Cao, 2025</a>).</p>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>A negation names the concept you want to suppress. It does not move the model to the opposite.</span></div>
						</div>

						<div class="prose">
							<p>Keep three failures apart. A summary can add a detail that is not in the source (faithfulness), a factual answer can be wrong about the world (factuality), and a model can contradict itself in one conversation (self-consistency). The distinction is standard in the literature (<a href="https://arxiv.org/abs/2202.03629" rel="noopener">Ji et al., 2023</a>). Each failure has its own test. The next section starts with the one people trust most: the confident tone.</p>
						</div>
					</section>

					<section class="section-block" id="confident">
						<div class="section-kicker"><span class="sk-num">02</span> Why it sounds confident</div>
						<h2 class="section-title">Confidence is not evidence.</h2>
						<div class="prose">
							<p>Confidence is a property of the text, not of the model’s knowledge. Temperature makes this worse: a higher temperature flattens the distribution and can push the model toward less likely, more inventive continuations (<a href="https://arxiv.org/abs/1904.09751" rel="noopener">Holtzman et al., 2020</a>). A lower temperature makes the likely token dominate, but the likely token can still be false. Decoding changes the odds, not the facts.</p>
							<p>Why not say “I don’t know”? Sometimes it does, but that is learned in post-training, not read from a truth meter. One common failure is sycophancy: the model accepts a false premise and invents a justification (<a href="https://arxiv.org/abs/2310.13548" rel="noopener">Sharma et al., 2023</a>). Ask “Why did the 2024 study show that X causes Y?” and the model may explain the premise instead of checking it.</p>
						</div>

						<div class="demo demo--paper" data-demo="sampling">
							<div class="demo-head">
								<div>
									<p class="demo-title">The distribution behind the sentence <span>· demo</span></p>
									<p class="demo-sub">The model has just read “The capital of France is”. Change the temperature and the candidate filter. Top-p is a cumulative probability between 0 and 1, so decimals are meaningful; top-k would be the integer count. After top-p, the surviving bars are renormalized to 100%; cut tokens are shown in grey and do not count.</p>
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

						<div class="prose">
							<p>Models are most reliable where the pattern is dense and redundant, least reliable where it is sparse or rare (<a href="https://arxiv.org/abs/2211.08411" rel="noopener">Kandpal et al., 2023</a>). Long context adds a quieter failure: evidence at the beginning and end is used more reliably than evidence in the middle (<a href="https://arxiv.org/abs/2307.03172" rel="noopener">Liu et al., 2023</a>). Scale improves many benchmark scores (<a href="https://arxiv.org/abs/2005.14165" rel="noopener">Brown et al., 2020</a>), but it does not install a guarantee.</p>
							<p>Arithmetic is a special case. The model predicts digits, it does not calculate. Numbers are split into tokens, so “1234.56” may become “12”, “34”, “.”, and “56” (see the <a href="tokenizerlab">tokenizer lab</a>), and the model must carry the digits without a scratchpad. The split does not follow place value: in the public GPT-2 vocabulary, 12345 becomes “123” + “45” while 12346 becomes “12” + “346” (Radford et al., 2019; <a href="https://github.com/openai/gpt-2/blob/master/vocab.bpe" rel="noopener">vocab.bpe</a>). For exact work, use a calculator or code.</p>
						</div>

						<div class="demo demo--paper" data-demo="numtokens">
							<div class="demo-head">
								<div>
									<p class="demo-title">The same number, different pieces <span>· demo</span></p>
									<p class="demo-sub">Adjacent numbers can cross different token boundaries. The model receives token IDs, not digits lined up in columns.</p>
								</div>
								<span class="demo-badge">GPT-2 BPE</span>
							</div>
							<div class="demo-body">
								<div class="chip-row">
									<button class="chip is-on" type="button" data-numtokens-pair="0" aria-pressed="true">12345 vs 12346</button>
									<button class="chip" type="button" data-numtokens-pair="1" aria-pressed="false">1234.56 vs 1234.57</button>
									<button class="chip" type="button" data-numtokens-pair="2" aria-pressed="false">2023 vs 2024</button>
								</div>
								<div class="numtokens-pair">
									<p class="numtokens-label"><span data-numtokens-label-a>12345</span></p>
									<div class="token-stream" data-numtokens-a aria-live="polite"></div>
								</div>
								<div class="numtokens-pair">
									<p class="numtokens-label"><span data-numtokens-label-b>12346</span></p>
									<div class="token-stream" data-numtokens-b aria-live="polite"></div>
								</div>
								<p class="demo-hint" data-numtokens-note>The boundary moves: 123 | 45 against 12 | 346. The digits do not line up.</p>
								<div class="demo-readout">
									<div><b>Difference</b><span data-numtokens-diff>1</span></div>
									<div><b>Shared tokens</b><span data-numtokens-shared>0 / 2</span></div>
								</div>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Arithmetic over these chunks is a learned pattern, not column addition. For an exact result, use code or a calculator.</span></div>
							<div class="demo-foot">Splits computed with the public GPT-2 byte-level BPE vocabulary (<a href="https://github.com/openai/gpt-2/blob/master/vocab.bpe" rel="noopener">openai/gpt-2</a>; Radford et al., 2019). Other tokenizers differ in the details, not in the mechanism.</div>
						</div>
					</section>

					<section class="section-block" id="tests">
						<div class="section-kicker"><span class="sk-num">03</span> Reality, consistency, and your knowledge</div>
						<h2 class="section-title">Check it against the world, itself, and what you know.</h2>
						<div class="prose">
							<p>Reality does not contradict itself. If two claims about the same thing cannot both be true, at least one is wrong. That gives a cheap first test: coherence. Does the answer fit with itself, with the documents you gave it, and with what you can check? A contradiction is a warning, not a detail to smooth over.</p>
							<p>Coherence is necessary but not enough. A story can be internally perfect and never touch the world. The second test is correspondence: does the claim meet reality at a point where it could fail? For example, a DOI that leads to a real paper, a quote that appears on the page, a calculation that checks out. A fluent fabrication passes the first test and fails the second.</p>
							<p>A model can build an argument that is logically coherent from the first sentence to the last and still be nonsense, because every premise was invented to fit the next one. Nothing inside the text disagrees, so it feels solid. This self-contained coherence is harder to catch than a broken sentence: there is no obvious error to point at, only a closed loop that never touches the world. The disagreement has to come from outside, from an anchor: a measurement, a document you can open, a source you can look up, a test that fails. Without an anchor in reality, coherence is the shape of the answer, not its truth.</p>
							<p>Your own knowledge is a third test. If a claim contradicts something you know well, that is a signal. Your knowledge can be outdated or wrong, but it catches errors that are internally consistent. Treat it as a source, not as a verdict.</p>
							<p>Every factual claim needs a contact point. If you cannot name the observation that would make it true or false, you have a sentence, not a fact. Comparisons also need a trusted bridge: a title that looks like a paper is not a paper, a search result is not support, and two samples that agree are not two independent witnesses. Name the bridge and ask what would make it fail.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Coherent and grounded</b><span>A good indicator. Still not proof: the next check can fail.</span></div>
							<div class="keypoint"><b>Coherent, not grounded</b><span>The main hallucination: a fluent story with no contact.</span></div>
							<div class="keypoint"><b>Incoherent</b><span>Certainly wrong as a description of one thing.</span></div>
							<div class="keypoint"><b>Grounded, not coherent</b><span>A pile of true facts without a model.</span></div>
						</div>
						<div class="prose">
							<p>When the tests disagree, reality decides. A coherent answer that fails a check is wrong at that point. A pile of checked facts that does not fit together is not yet an explanation. The goal is a story that survives contact.</p>
						</div>
					</section>

					<section class="section-block" id="diagnosis">
						<div class="section-kicker"><span class="sk-num">04</span> Diagnosis</div>
						<h2 class="section-title">Five failure modes, five fixes.</h2>
						<div class="prose">
							<p>Hallucination is an umbrella word. The failure decides the fix. A fluent wrong answer needs grounding; a self-contradicting answer needs coherence; an answer outside the evidence needs to stop. Treating every failure as one problem gives one ineffective fix: more text, more confidence, more scale.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Self-consistent fantasy</b><span>Fluent, wrong, coherent. Test: correspondence. Fix: retrieve and verify.</span></div>
							<div class="keypoint"><b>Self-contradiction</b><span>Two answers to one question. Test: coherence. Fix: re-ask, structured steps.</span></div>
							<div class="keypoint"><b>Facts without a model</b><span>Correct details, no synthesis. Test: coherence. Fix: outline, chain-of-thought.</span></div>
							<div class="keypoint"><b>Calibrated bias</b><span>Plausible, systematically off. Test: known values. Fix: audit and recalibrate.</span></div>
							<div class="keypoint"><b>Out of reach</b><span>Confident about recent, private, or niche topics. Test: coverage. Fix: abstain, retrieve, ask a human.</span></div>
						</div>
						<div class="prose">
							<p>Four forces make these failures likely. The objective rewards likelihood, not truth. The corpus contains errors, stale facts, contradictions, and model-written text. The prompt can carry a false premise (<a href="https://arxiv.org/abs/2310.13548" rel="noopener">Sharma et al., 2023</a>), and the decoder can sample a rare continuation (<a href="https://arxiv.org/abs/1904.09751" rel="noopener">Holtzman et al., 2020</a>). None is a bug in one component. They are the price of compressing text into a function (<a href="https://arxiv.org/abs/2202.03629" rel="noopener">Ji et al., 2023</a>).</p>
							<p>One cause is easy to miss. A model trained on text written by earlier models sees a copy of a copy. Over repeated generations, errors can compound and contact with the original distribution can drop (<a href="https://www.nature.com/articles/s41586-024-07566-y" rel="noopener">Shumailov et al., 2024</a>). Consistency can rise while correspondence falls. Coherence is not a substitute for fresh contact with the world.</p>
						</div>
					</section>

					<section class="section-block" id="recognize">
						<div class="section-kicker"><span class="sk-num">05</span> Recognizing</div>
						<h2 class="section-title">Signals, not vibes.</h2>
						<div class="prose">
							<p>No detector is reliable. A model can invent 3 references in one paragraph, each with a plausible author and venue. Watermarks can be removed and classifiers fooled (<a href="https://arxiv.org/abs/2303.11156" rel="noopener">Sadasivan et al., 2023</a>); an LLM judge has its own biases (<a href="https://arxiv.org/abs/2306.05685" rel="noopener">Zheng et al., 2023</a>). Look for the conditions where hallucination is likely and run a few checks.</p>
							<p>Start with the question. Is the topic recent, private, niche, or contested? Is the answer unusually specific: a date, a number, a name, a quote, a citation? Does the model never say “I don’t know”? Does it accept a false premise? Does it answer differently when you rephrase?</p>
							<p>Then check the text against itself. Ask for the same fact twice and compare. Ask for the passage that supports each claim; a quote that is not in the source is a direct failure. Ask for the assumptions; contradictory steps undermine the conclusion. Self-consistency sampling (<a href="https://arxiv.org/abs/2203.11171" rel="noopener">Wang et al., 2022</a>), SelfCheckGPT, or semantic entropy can flag uncertainty, but agreement can be shared bias.</p>
							<p>Then check it against the world. Open the DOI. Search the exact quote. Run the code. Recompute the number. Ask someone who knows the domain. Use a primary source, not a summary of a summary. A DOI that works proves the paper exists, not that it says what the model claims. Even with a model, you still have to research the topic.</p>
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
							<div class="demo-insight"><b>Takeaway</b><span>A plausible title, venue, and author list are cheap to generate. A DOI that resolves is a contact point, not a proof.</span></div>
							<div class="demo-foot">The real references are real; the fabricated ones are invented for the exercise. Verify any citation before you use it, and open the paper before you trust what it says.</div>
						</div>

						<details class="collapse-card">
							<summary class="cc-label">Worked example: the citation that looked real</summary>
							<p>A model writes a citation that looks real. Coherence passes: the claim fits what you know about sleep and memory. Correspondence fails: search the title, check the authors, resolve the DOI. If none exist, the claim has no contact point. The right conclusion is “no evidence”, not “probably true”.</p>
							<p>Ask for a source you can open, then open it. If the model cannot produce one, treat the claim as a hypothesis, not a fact.</p>
						</details>
					</section>

					<section class="section-block" id="prevent">
						<div class="section-kicker"><span class="sk-num">06</span> Prevention</div>
						<h2 class="section-title">Build the check in.</h2>
						<div class="prose">
							<p>Prevention starts before the prompt. Use the model where a wrong answer is cheap to catch, and keep a human in the loop where it is not. Give it the documents and ask it to answer from them. Make “I don’t know” acceptable. For exact work, use a calculator, code, or a database. A tool is not grounding by default, but it gives you a checkable point. One unchecked number can ruin a table.</p>
							<p>Four techniques do most of the work. Retrieval puts evidence in the context (<a href="https://arxiv.org/abs/2005.11401" rel="noopener">Lewis et al., 2020</a>). Tools replace a prediction with an observation. Chain-of-verification drafts, asks verification questions, answers them independently, and revises (<a href="https://arxiv.org/abs/2309.11495" rel="noopener">Dhuliawala et al., 2023</a>). Decomposition breaks a long claim into atomic facts (<a href="https://arxiv.org/abs/2305.14251" rel="noopener">Min et al., 2023</a>). Each adds a contact point; none adds a guarantee.</p>
							<p>Prompting can make failure more likely. A leading question invites agreement. A demand for confidence removes the option to abstain. A long context buries evidence. A request for a citation can produce a fake one. Ask for evidence first, then the answer; ask for uncertainty; ask what would change the model’s mind.</p>
							<p>Evaluation is part of prevention. Keep a small test set with known answers, including “not enough information”. Test after every change. Measure calibration: when the model sounds confident, is it right more often (<a href="https://arxiv.org/abs/2207.05221" rel="noopener">Kadavath et al., 2022</a>)? A model that knows the edge of its evidence is safer.</p>
							<p>Work in small steps. A single large prompt hides its errors. Write down the state, check each step, and make it visible as a table, plot, diagram, or trace. For small programming problems, use an external judge: a type checker, a test suite, or a proof assistant such as <a href="https://rocq-prover.org/" rel="noopener">Rocq</a> (formerly Coq), <a href="https://lean-lang.org/" rel="noopener">Lean</a>, or <a href="https://agda.readthedocs.io/" rel="noopener">Agda</a>. Run the checker, feed the error back, repeat; an agent can run the loop. The checker is relentless, but it only checks what you gave it: the model can assume a false premise, state a vacuous theorem, or formalize the wrong problem. It is a help, not a guarantee.</p>
						</div>
					</section>

					<section class="section-block" id="checklist">
						<div class="section-kicker"><span class="sk-num">07</span> Checklist and takeaway</div>
						<h2 class="section-title">Before you trust an answer.</h2>
						<div class="trythis">
							<b>Run these checks</b>
							<ol>
								<li>Is the question inside the model’s evidence: public, old enough, well documented, not contested?</li>
								<li>Is the answer specific about a name, number, date, quotation, or citation? If yes, can you check it?</li>
								<li>Does the model admit uncertainty, or does it sound equally confident everywhere?</li>
								<li>Does it agree with a premise you know is false when you phrase the question that way?</li>
								<li>Does it contradict itself when you ask the same thing twice or in a different order?</li>
								<li>Can it quote the passage that supports each claim, and does the quote actually appear in the source?</li>
								<li>Have you opened the source, resolved the DOI, run the code, or recomputed the number?</li>
								<li>Is there a human, a test, or a tool that catches the error before it matters?</li>
							</ol>
						</div>
						<div class="prose">
							<p>The 8 answers are not proof. They are a filter. Make the cheap checks routine, so the expensive mistake does not reach the reader.</p>
						</div>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">The model is not lying. It is completing a pattern.</p>
							<p class="aha-sub">Truth is a property of your workflow, not a promise from the model.</p>
						</div>
						<div class="prose">
							<p>Next time an answer sounds perfect, ask 2 questions: does it fit together, and does it touch reality? If you can answer both, you can use it. If only the first, you have a story. The model is a good start. It is a bad place to stop.</p>
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
