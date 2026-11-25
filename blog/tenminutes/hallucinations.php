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
							<p>Keep three failures apart. A summary can contradict its source (intrinsic) or add a detail the source neither supports nor contradicts (extrinsic); both are failures of faithfulness. A factual answer can be wrong about the world (factuality), and a model can contradict itself in one conversation (self-consistency). The distinction is standard in the literature (<a href="https://arxiv.org/abs/2202.03629" rel="noopener">Ji et al., 2023</a>).</p>
							<p>The extrinsic case is easy to misread. The added detail can be true and still fail the source test, so the right conclusion is “unsupported”, not “false”. Each failure has its own test. The next section starts with the one people trust most: the confident tone.</p>
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
								<p class="demo-hint">Bright bars count; grey bars are cut by top-p. Before you move the slider: what happens to “Paris” when you lower top-p to 0.5?</p>
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

						<div class="demo demo--paper demo--canvas" id="hl-landscape-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">When the sources split in half <span>· demo</span></p>
									<p class="demo-sub">The question is contested: about half the sources say yes, half say no, and nothing in them settles it. Both continuations sit in equally deep valleys. The model samples one and then writes as if it were the answer.</p>
								</div>
								<span class="demo-badge">3-D landscape</span>
							</div>
							<div class="demo-body">
								<p class="demo-hint">Question: “Did the company really recall the product in 2023?” The corpus agrees only on the disagreement. Rotate the surface and compare the two basins.</p>
								<div id="hl-3d" class="hl-echarts-host" role="img" aria-label="A three-dimensional landscape with two equally deep valleys, one for the answer yes and one for the answer no"></div>
								<div class="demo-controls hl-controls">
									<button class="btn-demo" type="button" data-hl-rerun>Sample again</button>
									<span class="hl-choice">Chosen continuation: <b data-hl-choice>“Yes, it did.”</b></span>
								</div>
								<div class="demo-readout hl-readout">
									<div><b>“Yes” path</b><span>about half the sources</span></div>
									<div><b>“No” path</b><span>about half the sources</span></div>
									<div><b>Reality</b><span>not settled by the corpus</span></div>
								</div>
								<p class="demo-hint hl-status" data-hl-status></p>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Two paths can be equally likely and still only one is written. The landscape shows the model's preference, not the world's answer.</span></div>
							<div class="demo-foot">Schematic, not a measurement. The energy-landscape view follows the energy-based learning framework of <a href="http://yann.lecun.com/exdb/publis/pdf/lecun-06.pdf" rel="noopener">LeCun et al., A Tutorial on Energy-Based Learning (2006)</a>. Deeper means more likely; the two valleys have the same depth.</div>
						</div>

						<div class="prose">
							<p>Models are most reliable where the pattern is dense and redundant, least reliable where it is sparse or rare (<a href="https://arxiv.org/abs/2211.08411" rel="noopener">Kandpal et al., 2023</a>). Long context adds a quieter failure: evidence at the beginning and end is used more reliably than evidence in the middle (<a href="https://arxiv.org/abs/2307.03172" rel="noopener">Liu et al., 2023</a>). Scale improves many benchmark scores (<a href="https://arxiv.org/abs/2005.14165" rel="noopener">Brown et al., 2020</a>), but it does not install a guarantee.</p>
							<p>Arithmetic is a special case. The model predicts digits, it does not calculate. Numbers are split into tokens, so “1234.56” may become “12”, “34”, “.”, and “56” (see the <a href="tokenizerlab">tokenizer lab</a>), and the model must carry the digits without a scratchpad. The split does not follow place value: in the public GPT-2 vocabulary, 12345 becomes “123” + “45” while 12346 becomes “12” + “346” (<a href="https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf" rel="noopener">Radford et al., 2019</a>; <a href="https://openaipublic.blob.core.windows.net/gpt-2/models/117M/vocab.bpe" rel="noopener">vocab.bpe</a>). <a href="https://arxiv.org/abs/2202.03629" rel="noopener">Ji et al. (2023)</a> list hallucinations in numerals as a problem in its own right. For exact work, use a calculator or code.</p>
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
									<button class="chip" type="button" data-numtokens-pair="1" aria-pressed="false">9998 vs 9999</button>
									<button class="chip" type="button" data-numtokens-pair="2" aria-pressed="false">1234.56 vs 1234.57</button>
									<button class="chip" type="button" data-numtokens-pair="3" aria-pressed="false">9999.99 vs 10000.00</button>
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
									<div><b>Tokens</b><span data-numtokens-count>2 / 2</span></div>
									<div><b>Shared tokens</b><span data-numtokens-shared>0 / 2</span></div>
								</div>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Arithmetic over these chunks is a learned pattern, not column addition. For an exact result, use code or a calculator.</span></div>
							<div class="demo-foot">Splits computed with the public GPT-2 byte-level BPE vocabulary (<a href="https://openaipublic.blob.core.windows.net/gpt-2/models/117M/vocab.bpe" rel="noopener">vocab.bpe</a>; <a href="https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf" rel="noopener">Radford et al., 2019</a>). Tokens with the same colour are the same token. Other tokenizers differ in the details, not in the mechanism.</div>
						</div>
					</section>

					<section class="section-block" id="tests">
						<div class="section-kicker"><span class="sk-num">03</span> Reality, consistency, and your knowledge</div>
						<h2 class="section-title">Check it against the world, itself, and what you know.</h2>
						<div class="prose">
							<p>Reality does not contradict itself. If two claims about the same thing cannot both be true, at least one is wrong. That gives a cheap first test: coherence. Does the answer fit with itself, with the documents you gave it, and with what you can check? A contradiction is a warning, not a detail to smooth over.</p>
							<p>Coherence is necessary but not enough. A story can be internally perfect and never touch the world. The second test is correspondence: does the claim meet reality at a point where it could fail? For example, a DOI that leads to a real paper, a quote that appears on the page, a calculation that checks out. A fluent fabrication passes the first test and fails the second. Two answers show the difference. A: “A 2019 Nature study (Smith et al., DOI 10.…) found X.” It is internally coherent, but the DOI goes nowhere. B: “The study was small (n = 12) and did not replicate (link).” It passes both tests, even though the result is inconvenient. A passes coherence and fails correspondence; B passes both.</p>
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
							<p>Each diagnosis maps to one check below: self-consistent fantasy → open the DOI or quote; self-contradiction → ask twice; facts without a model → ask for an outline; calibrated bias → compare with known values; out of reach → check coverage. The checklist turns each diagnosis into a test.</p>
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
							<p>Then check the text against itself. Ask for the same fact twice and compare. Ask for the passage that supports each claim; a quote that is not in the source is a direct failure. Ask for the assumptions; contradictory steps undermine the conclusion. Self-consistency sampling (<a href="https://arxiv.org/abs/2203.11171" rel="noopener">Wang et al., 2022</a>), <a href="https://arxiv.org/abs/2303.08896" rel="noopener">SelfCheckGPT</a> (Manakul et al., 2023), or <a href="https://arxiv.org/abs/2302.09664" rel="noopener">semantic entropy</a> (Kuhn et al., 2023) can flag uncertainty, but agreement can be shared bias.</p>
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
	<script>
	(function () {
		var host = document.getElementById("hl-3d");
		if (!host) return;
		var DE = !!(window.TM && TM.lang && TM.lang() === "de");
		var labels = DE ? {
			yes: "„Ja, das hat es.“",
			no: "„Nein, das hat es nicht.“",
			initial: "Beide Täler sind gleich tief. Eine Ziehung wählt einen Pfad.",
			sampled: "Gezogen: ",
			sampledTail: " Die Fläche hat sich nicht geändert, nur die Ziehung.",
			axisStep: "Kontextschritt",
			axisAnswer: "Antwort",
			axisProb: "tiefer = wahrscheinlicher",
			failed: "Die 3D-Bibliothek konnte nicht geladen werden."
		} : {
			yes: "“Yes, it did.”",
			no: "“No, it did not.”",
			initial: "Both valleys are equally deep. One draw picks one path.",
			sampled: "Sampled: ",
			sampledTail: " The surface did not change; only the draw did.",
			axisStep: "context step",
			axisAnswer: "answer",
			axisProb: "deeper = more likely",
			failed: "The 3D library could not be loaded."
		};
		var choiceEl = document.querySelector("[data-hl-choice]");
		var statusEl = document.querySelector("[data-hl-status]");
		var rerunEl = document.querySelector("[data-hl-rerun]");
		var choice = "yes";
		var chart = null;
		var drawn = false;
		var xMax = 6.2;
		var yMax = 1.15;

		function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
		function smooth(a, b, x) {
			var t = clamp((x - a) / (b - a), 0, 1);
			return t * t * (3 - 2 * t);
		}
		function parseColor(value) {
			var s = String(value || "").trim();
			if (s.charAt(0) === "#") {
				var h = s.slice(1);
				if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
				var n = parseInt(h, 16);
				return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
			}
			var m = s.match(/rgba?\(([^)]+)\)/);
			if (m) {
				var parts = m[1].split(",").map(function (x) { return parseFloat(x) || 0; });
				return [parts[0], parts[1], parts[2]];
			}
			return [100, 116, 139];
		}
		function mix(a, b, t) {
			var A = parseColor(a), B = parseColor(b);
			return "rgb(" + Math.round(A[0] + (B[0] - A[0]) * t) + "," + Math.round(A[1] + (B[1] - A[1]) * t) + "," + Math.round(A[2] + (B[2] - A[2]) * t) + ")";
		}
		function separation(x) {
			return 0.34 + 0.46 * smooth(0.10, 0.82, x / xMax);
		}
		function surfaceHeight(x, y) {
			var t = clamp(x / xMax, 0, 1);
			var sep = separation(x);
			var width = 0.25 + 0.10 * t;
			var right = Math.exp(-Math.pow((y - sep) / width, 2));
			var left = Math.exp(-Math.pow((y + sep) / width, 2));
			var depth = 0.28 * (0.34 + 0.66 * smooth(0.10, 0.86, t));
			var valley = Math.max(right, left);
			var ripple = 0.012 * Math.sin(x * 2.1 + y * 3.7) * (1 - valley);
			return -depth * valley + ripple;
		}
		function surfaceData(colors) {
			var xCount = 121, yCount = 81;
			var points = [];
			var minZ = Infinity, maxZ = -Infinity;
			for (var yi = 0; yi <= yCount; yi++) {
				var y = -yMax + (2 * yMax) * (yi / yCount);
				for (var xi = 0; xi <= xCount; xi++) {
					var x = xMax * (xi / xCount);
					var z = surfaceHeight(x, y);
					if (z < minZ) minZ = z;
					if (z > maxZ) maxZ = z;
					points.push([x, y, z]);
				}
			}
			var colorMin = -0.30;
			var span = Math.max(1e-6, maxZ - colorMin);
			var data = points.map(function (p) {
				var t = Math.pow(clamp((p[2] - colorMin) / span, 0, 1), 1.35);
				return {
					value: [Number(p[0].toFixed(3)), Number(p[1].toFixed(3)), Number(p[2].toFixed(4))],
					itemStyle: { color: mix(colors.deep, colors.base, t) }
				};
			});
			return { data: data, shape: [yCount + 1, xCount + 1], minZ: minZ };
		}
		function pathData(sign) {
			var points = [];
			for (var i = 0; i <= 48; i++) {
				var x = xMax * (i / 48);
				var y = sign * separation(x);
				points.push([x, y, surfaceHeight(x, y) + 0.045]);
			}
			return points;
		}
		function buildSeries(c) {
			var deep = mix(c.blue, c.ink, c.dark ? 0.30 : 0.52);
			var base = mix(c.paper2, c.gold, c.dark ? 0.55 : 0.65);
			var surface = surfaceData({ deep: deep, base: base });
			var chosenColor = c.blue;
			var otherColor = c.gold;
			var yesColor = choice === "yes" ? chosenColor : otherColor;
			var noColor = choice === "no" ? chosenColor : otherColor;
			var yesWidth = choice === "yes" ? 7 : 4;
			var noWidth = choice === "no" ? 7 : 4;
			var yesOpacity = choice === "yes" ? 0.95 : 0.48;
			var noOpacity = choice === "no" ? 0.95 : 0.48;
			var chosenY = separation(3.5) * (choice === "yes" ? 1 : -1);
			return {
				data: surface.data,
				shape: surface.shape,
				minZ: surface.minZ,
				series: [
					{
						id: "hl-surface",
						name: "landscape",
						type: "surface",
						data: surface.data,
						dataShape: surface.shape,
						shading: "lambert",
						wireframe: { show: false },
						itemStyle: { opacity: 1 }
					},
					{
						id: "hl-yes",
						name: labels.yes,
						type: "line3D",
						data: pathData(1),
						lineStyle: { width: yesWidth, color: yesColor, opacity: yesOpacity }
					},
					{
						id: "hl-no",
						name: labels.no,
						type: "line3D",
						data: pathData(-1),
						lineStyle: { width: noWidth, color: noColor, opacity: noOpacity }
					},
					{
						id: "hl-fork",
						name: DE ? "unklare Frage" : "open question",
						type: "scatter3D",
						data: [{ value: [1.7, 0, surfaceHeight(1.7, 0) + 0.06] }],
						symbol: "diamond",
						symbolSize: 10,
						itemStyle: { color: c.gold, borderColor: c.paper, borderWidth: 1.2 }
					},
					{
						id: "hl-choice",
						name: DE ? "Ziehung" : "sample",
						type: "scatter3D",
						data: [{ value: [3.5, chosenY, surfaceHeight(3.5, chosenY) + 0.09] }],
						symbol: "circle",
						symbolSize: 15,
						itemStyle: { color: chosenColor, borderColor: c.paper, borderWidth: 2 }
					}
				]
			};
		}
		function updateLabels() {
			if (choiceEl) choiceEl.textContent = choice === "yes" ? labels.yes : labels.no;
			if (statusEl) statusEl.textContent = labels.initial;
		}
		function draw() {
			if (!window.TM || !TM.ensureECharts) return;
			TM.ensureECharts(function () {
				var c = TM.colors();
				var built = buildSeries(c);
				if (!chart) {
					host.innerHTML = "";
					try {
						chart = echarts.init(host);
					} catch (e) {
						host.innerHTML = '<div class="traj-echarts-fallback">' + labels.failed + "</div>";
						return;
					}
				}
				var option = {
					backgroundColor: "transparent",
					tooltip: {
						trigger: "item", confine: true,
						backgroundColor: c.dark ? "rgba(10,34,44,.96)" : "rgba(255,255,255,.98)",
						borderColor: c.lineStrong,
						textStyle: { color: c.ink, fontSize: 12 }
					},
					xAxis3D: {
						type: "value", name: labels.axisStep,
						min: 0, max: xMax, interval: 1,
						nameTextStyle: { color: c.ink, fontSize: 12, fontWeight: 600 },
						nameGap: 16,
						axisLabel: { textStyle: { color: c.inkSoft || c.ink, fontSize: 10, fontWeight: 600 } },
						axisLine: { lineStyle: { color: c.lineStrong } },
						splitLine: { lineStyle: { color: c.line } }
					},
					yAxis3D: {
						type: "value", name: labels.axisAnswer,
						min: -yMax, max: yMax, interval: 0.575,
						nameTextStyle: { color: c.ink, fontSize: 12, fontWeight: 600 },
						nameGap: 14,
						axisLabel: { show: false },
						axisLine: { lineStyle: { color: c.lineStrong } },
						splitLine: { lineStyle: { color: c.line } }
					},
					zAxis3D: {
						type: "value", name: labels.axisProb,
						min: built.minZ - 0.02, max: 0.04,
						nameTextStyle: { color: c.ink, fontSize: 12, fontWeight: 600 },
						nameGap: 12,
						axisLabel: { show: false },
						axisLine: { lineStyle: { color: c.lineStrong } },
						splitLine: { lineStyle: { color: c.line } }
					},
					grid3D: {
						viewControl: {
							projection: "perspective",
							alpha: 30, beta: 38, distance: 200,
							autoRotate: false, damping: 0.9,
							rotateSensitivity: 1.2, zoomSensitivity: 1.2
						},
						light: {
							main: { intensity: 1.2, shadow: false, alpha: 38, beta: 16 },
							ambient: { intensity: 0.54 }
						},
						environment: c.paper2,
						boxWidth: 132, boxHeight: 30, boxDepth: 108,
						axisLine: { lineStyle: { color: c.lineStrong } },
						splitLine: { lineStyle: { color: c.line } },
						axisPointer: { show: false }
					},
					series: built.series
				};
				if (drawn) delete option.grid3D.viewControl;
				try {
					chart.setOption(option, { replaceMerge: ["series"], lazyUpdate: false });
					chart.resize();
					drawn = true;
				} catch (e) {
					host.innerHTML = '<div class="traj-echarts-fallback">' + labels.failed + "</div>";
				}
				updateLabels();
			}, function () {
				host.innerHTML = '<div class="traj-echarts-fallback">' + labels.failed + "</div>";
			});
		}
		if (rerunEl) {
			rerunEl.addEventListener("click", function () {
				choice = choice === "yes" ? "no" : "yes";
				if (choiceEl) choiceEl.textContent = choice === "yes" ? labels.yes : labels.no;
				if (statusEl) statusEl.textContent = labels.sampled + (choice === "yes" ? labels.yes : labels.no) + labels.sampledTail;
				try {
					var c = TM.colors();
					var built = buildSeries(c);
					if (chart) chart.setOption({ series: built.series }, { replaceMerge: ["series"], lazyUpdate: false });
				} catch (e) {}
			});
		}
		window.addEventListener("tm:theme", function () {
			if (chart) { chart.dispose(); chart = null; drawn = false; }
			draw();
		});
		draw();
	})();
	</script>
</body>
</html>
