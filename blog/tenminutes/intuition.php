<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="A ten-minute interactive introduction to next-token prediction, the loop behind large language models.">
	<meta name="theme-color" content="#ffffff">
	<title>One Word at a Time | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css?v=20261105b">
	<link rel="stylesheet" href="../Temml-Local.min.css">
</head>
<body data-lesson="intuition" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>One word <em>at a time.</em></h1>
					<p class="hero-deck">
						A language model predicts the next word from the text so far. That one loop is
						the engine behind <strong>chat, code, translation, and reasoning</strong>. Work
						through this page and you will have a good intuitive picture of the transformer that
						drives it: enough to see how the parts fit together, without following every
						detail.
					</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="idea">
						<div class="section-kicker"><span class="sk-num">01</span> The idea</div>
						<h2 class="section-title">A first intuition: predict the next word.</h2>
						<div class="prose">
							<p>
								A <strong>large language model</strong> (<strong>LLM</strong>) is a program
								trained on a very large body of text: Wikipedia, books, web pages, code, and
								conversation. It learns one skill, <strong>predicting the next token</strong>,
								and that skill carries chat, translation, and much of what looks like
								reasoning. You may already use one on your phone: you type a question, and the
								answer appears one word at a time.
							</p>
						</div>

						<div class="demo demo--paper" id="phone-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">The model in your pocket <span>· demo 01a</span></p>
									<p class="demo-sub">A search box, a voice query, an AI answer and the links below it. The animation runs once on load; replay it with the button.</p>
								</div>
								<span class="demo-badge">live</span>
							</div>
							<div class="demo-body">
								<div class="ia-stage">
									<div class="ia-phone" id="ia-phone">
										<div class="ia-phone-frame"></div>
										<div class="ia-phone-notch"></div>
										<div class="ia-phone-screen">
											<div class="ia-app-logo" id="ia-logo" aria-hidden="true"></div>
											<div class="ia-search-bar" id="ia-search-bar">
												<div class="ia-search-icon" aria-hidden="true"></div>
												<div class="ia-search-text" id="ia-search-text"></div>
												<div class="ia-mic-btn" id="ia-mic-btn" aria-hidden="true">
													<div class="ia-mic-icon"></div>
												</div>
											</div>
											<div class="ia-ai-card" id="ia-ai-card">
												<div class="ia-ai-text" id="ia-ai-text"></div>
												<div class="ia-ai-thinking" id="ia-ai-thinking" aria-hidden="true">
													<span></span><span></span><span></span>
												</div>
											</div>
											<div class="ia-serp" id="ia-serp"></div>
										</div>
									</div>
									<div class="ia-waveform" id="ia-waveform" aria-hidden="true">
										<div class="ia-bar"></div><div class="ia-bar"></div><div class="ia-bar"></div>
										<div class="ia-bar"></div><div class="ia-bar"></div><div class="ia-bar"></div>
										<div class="ia-bar"></div><div class="ia-bar"></div><div class="ia-bar"></div>
										<div class="ia-bar"></div><div class="ia-bar"></div>
									</div>
								</div>
								<div class="demo-controls">
									<button class="btn-demo btn-demo--green" type="button" id="ph-replay">Replay the animation ↻</button>
								</div>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>The phone does not look up a stored answer. The summary is written one token at a time, and the same loop runs in the data centre behind it.</span></div>
						</div>

						<div class="prose">
							<p>
								Here is the core idea. A language model reads a sequence of
								tokens and returns a <strong>probability for every possible next
								token</strong>. One is chosen, appended to the input, and the whole thing
								runs again. That is the <strong>autoregressive loop</strong>.
							</p>
							<p>
								Two words in that description are doing quiet work. “Probability” means the
								model scores all candidates at once; it does not first pick an answer and
								then decide how sure it is. The other word is “token”. The demo below calls
								its tokens words because that is easiest to follow, but a token can be a
								whole word, a word fragment, a single character, a group of characters, a
								space, a punctuation mark, or an emoji. When “unbelievable” is not in the
								vocabulary, the tokenizer splits it into several pieces such as “un”,
								“believ”, and “able”. The loop does not care what the pieces are; it
								predicts the next one.
							</p>
							<p>
								This page builds a technical intuition, not the complete picture. A real
								model adds a tokenizer, layers of attention, a feed-forward network, position
								information, training data, and post-training. The loop comes first because
								every other part exists to make this one prediction possible. Each part
								supplies something the loop needs; none of them is an optional upgrade.
							</p>
							<p>
								A conversation, a poem, a Python function: in an LLM, all of it is generated
								by this loop. That sounds like a small mechanism until you see what the
								context can contain: the question, a worked example, a program's output, or
								the model's own earlier reasoning. Each new token refers to everything before
								it. Why not predict the whole answer at once? Because each step can only
								commit to one token, and every later token has to react to the ones already
								written. The loop is a slow, step-by-step approach to a plausible answer,
								not the whole solution in one shot.
							</p>
						</div>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">At its heart, it is a loop: one word after another.</p>
							<p class="aha-sub">Pick a likely next word, append it to the input, and run the whole thing again. A sentence, an answer, or a program emerges from that repeated step.</p>
						</div>
					</section>

					<section class="section-block" id="loop">
						<div class="section-kicker"><span class="sk-num">02</span> Play the loop</div>
						<h2 class="section-title">Write a sentence, one word at a time.</h2>
						<div class="prose">
							<p>
								The demo below shows the idea, not a trained model. The next token is chosen
								from a probability distribution, appended to the context, and the whole thing
								runs again. A real model computes that distribution with learned weights.
								Prediction here means nothing mystical: the model states how likely each
								candidate is.
							</p>
							<p>
								Temperature is why the text is not identical every time you ask. People do
								not repeat the same sentence word for word either, and a little randomness
								keeps generated text from sounding mechanical. Higher temperatures widen the
								field of plausible continuations. That is welcome in a story and unwelcome in
								a balance sheet, so the setting depends on the task. Temperature decides how
								far the model may drift from the most probable path.
							</p>
						</div>

						<div class="demo" id="next-token-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">The autoregressive loop <span>· demo 01</span></p>
									<p class="demo-sub">Let the demo choose the next word, or switch between sampling, greedy, and top-p. Each choice opens only the continuations that make sense from there, so the tree narrows as you go.</p>
								</div>
								<span class="demo-badge">live</span>
							</div>
							<div class="demo-body">
								<div class="prediction">
									<div class="prediction-sentence" id="nt-sentence" aria-live="polite"></div>
									<div class="nt-tree" id="nt-tree" aria-live="polite"></div>
									<div class="bars" id="nt-bars" role="group" aria-label="Next word probabilities"></div>
									<p class="meadow-caption" id="nt-why" style="color:var(--tm-muted)">Sampling draws from the whole distribution; temperature controls how concentrated it is.</p>
								</div>
								<div class="demo-controls">
									<div class="chip-row" id="nt-modes">
										<button class="chip is-on" type="button" data-decode="sample">Sample</button>
										<button class="chip" type="button" data-decode="greedy">Greedy</button>
										<button class="chip" type="button" data-decode="topp">Top-p 0.9</button>
									</div>
								</div>
								<div class="demo-controls" style="margin-top:6px">
									<button class="btn-demo btn-demo--green" type="button" id="nt-step">Let it choose →</button>
									<button class="btn-demo" type="button" id="nt-reset">Reset</button>
									<label>Temperature
										<input type="range" id="nt-temp" min="0.05" max="1.8" step="0.05" value="0.8" aria-describedby="nt-temp-note">
										<output id="nt-temp-out">0.80</output>
									</label>
								</div>
								<p class="meadow-caption nt-temp-note" id="nt-temp-note">
									<b>Why "temperature"?</b> In a gas, temperature sets how widely molecular
									speeds are spread (Maxwell-Boltzmann). Here it plays the same role for
									logits: <span class="nt-formula" data-tex="p_i \propto \exp(z_i / T)" data-tex-display="false"></span>. High T flattens the
									distribution; low T sharpens it; greedy is the limit T → 0, and exact
									zero is handled by taking the top token directly. The name is a
									metaphor: there is no gas inside the model.
								</p>
								<div class="demo-readout demo-readout--4">
									<div><b>Step</b><span id="nt-step-count">0 / 6</span></div>
									<div><b>Context length</b><span id="nt-len">7 words</span></div>
									<div><b>Top choice</b><span id="nt-top">dragon</span></div>
									<div><b>Choice</b><span id="nt-mode">sample</span></div>
								</div>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>The distribution is the model; the choice is how you draw from it. Greedy, sampling, and top-p all read the same probabilities differently.</span></div>
						</div>

						<div class="prose">
							<p>
								Sampling is one way to choose. Greedy takes the most likely token every
								time, which makes the text deterministic and often repetitive. Top-p sorts
								the tokens by probability and keeps the smallest set whose cumulative
								probability reaches the threshold p, then samples from that set. Temperature
								shapes the distribution before any of these choices: low values concentrate
								it, high values flatten it.
							</p>
							<div class="demo demo--paper" id="truth-tunnel-demo">
								<div class="demo-head">
									<div>
										<p class="demo-title">The truth tunnel <span>· demo 01b</span></p>
										<p class="demo-sub">A single prediction is one slice through a tube of plausible continuations. Step through the sentence and watch the tube narrow as the context closes the options, then turn up the temperature and watch it inflate again.</p>
									</div>
									<span class="demo-badge">live</span>
								</div>
								<div class="demo-body">
									<div class="iso-grid">
										<canvas class="demo-canvas" id="tt-canvas" style="height:340px" aria-label="A path through embedding space wrapped in a glowing probability isosurface"></canvas>
										<aside class="iso-side">
											<div class="iso-kicker">Next word</div>
											<div class="iso-next" id="tt-next">capital</div>
											<div class="iso-alt" id="tt-alt"></div>
											<div class="iso-meta" id="tt-meta"></div>
										</aside>
									</div>
									<div class="demo-controls">
										<button class="btn-demo btn-demo--green" type="button" id="tt-advance">Next word →</button>
										<label>Temperature
											<input type="range" id="tt-temp" min="0.05" max="2.0" step="0.05" value="0.8">
											<output id="tt-temp-out">0.80</output>
										</label>
									</div>
								</div>
								<div class="demo-insight"><b>Takeaway</b><span>The model never decides that something is right. It builds a distribution from its training data and draws from it; the tunnel shows how context narrows that distribution.</span></div>
							</div>
							<p>
								The formula puts <span data-tex="T" data-tex-display="false"></span> in the
								denominator, so an exact temperature of zero would mean dividing by zero. In
								practice greedy decoding is treated as the limit
								<span data-tex="T \to 0" data-tex-display="false"></span>, and
								implementations special-case zero by taking the top token directly.
							</p>
						</div>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">A good predictor compresses.</p>
							<p class="aha-sub">To predict the next word well, a model has to capture regularities in the data, and a compact description of those regularities is a form of compression. Whether that description amounts to understanding the world is a live question, not a settled fact.</p>
						</div>
					</section>

					<section class="section-block" id="inside">
						<div class="section-kicker"><span class="sk-num">03</span> Inside the model</div>
						<h2 class="section-title">Six steps, one running vector.</h2>
						<div class="prose">
							<p>
								The loop is the outside view. Inside, one token passes through a fixed
								pipeline, and each step changes its representation. The steps below
								correspond to what <a href="https://arxiv.org/abs/1706.03762" rel="noopener">Vaswani et al., 2017</a> described as a transformer: text becomes ids, ids become
								vectors, position adds where each token sits, attention adds context, the
								feed-forward network computes, and the residual stream carries the result to
								the next layer, where attention and the feed-forward network work again; at
								the end, a token is chosen.
							</p>
							<p>
								A transformer is a stack of layers. Each layer reads the running vector,
								computes an update, and adds that update back to the vector. Written out,
								the first steps look like this:
							</p>
							<div class="prose-math" data-tex="\begin{aligned} x_1 &amp;= x_0 + \underbrace{\operatorname{layer}_1(\underbrace{x_0}_{\text{token vector}})}_{\text{what layer 1 adds}} \\ x_2 &amp;= x_1 + \underbrace{\operatorname{layer}_2(\underbrace{x_1}_{\text{running vector}})}_{\text{what layer 2 adds}} \end{aligned}" data-tex-de="\begin{aligned} x_1 &amp;= x_0 + \underbrace{\operatorname{layer}_1(\underbrace{x_0}_{\text{Token-Vektor}})}_{\text{was Schicht 1 hinzufügt}} \\ x_2 &amp;= x_1 + \underbrace{\operatorname{layer}_2(\underbrace{x_1}_{\text{laufender Vektor}})}_{\text{was Schicht 2 hinzufügt}} \end{aligned}" data-tex-display="true"></div>
							<p>
								The original signal stays in the sum. Later layers read it together with
								everything the earlier layers have added.
							</p>
							<p>
								The six steps below are a technical intuition, not a complete circuit
								diagram. Each step isolates one job and shows a small, simplified version of
								it.
							</p>
						</div>

						<div class="demo" id="inside-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">Inside the model <span>· demos 02-07</span></p>
									<p class="demo-sub">Follow one token through six steps. Each step is a small simplified demo, but the order and the division of labour are the real architecture.</p>
								</div>
								<span class="demo-badge">six steps</span>
							</div>
							<div class="demo-body">
								<div class="step-pane" id="step-tokenize">
									<p class="step-note step-lead">A token is not a word. Before the model can read anything, text is encoded as numbers. Every character has a Unicode code point, and an encoding turns that number into bytes. A byte-level tokenizer starts from all 256 possible bytes, so every piece of text is representable, including characters it never saw in training. Rare words split into <strong>subwords</strong>: pieces the vocabulary already knows. The tokenizer does not care about syllables or meaning. It might split “unbelievable” into “un”, “believ”, and “able”, and the same piece reappears in other words: the “un” in “unhappy” and in “unmarried” has the same id. New emoji still work because related emoji share their first bytes: most characters in the main emoji block begin with <code>F0 9F</code>. A space is a byte too, and it can be a token of its own.</p>
									<div class="step-stage">
										<div class="step-pane-head">
											<span class="sp-kicker">Step 1 · Tokenize</span>
											<h3 class="sp-title">Text becomes a sequence of ids</h3>
										</div>
										<div class="step-toolbar">
											<div class="step-chips">
												<button class="chip" type="button" data-tok="understanding">understanding</button>
												<button class="chip" type="button" data-tok="unbreakable">unbreakable</button>
												<button class="chip is-on" type="button" data-tok="sentence">The transformer is playing greatly</button>
											</div>
										</div>
										<div class="token-chips" id="itok-out" aria-live="polite"></div>
										<div class="demo-readout demo-readout--4" id="itok-stats"></div>
									</div>
									<p class="step-note">The demo shows the pieces and their ids. A real tokenizer learns its merge table from text, so frequent pieces become single tokens and rare ones split. That is how a fixed vocabulary can cover an open-ended set of strings. The ids carry no meaning on their own; they are addresses into an embedding table.</p>
								</div>

								<div class="step-pane" id="step-embed">
									<p class="step-note step-lead">Each token id points to a vector of learned parameters. A real model uses thousands of dimensions, often around ten thousand; this demo uses two so the picture fits on screen, but the principle is the same. The vector is the token's starting representation. The model learns these points from its training data (Wikipedia, books, web pages, code) and chooses the rules itself. Related tokens end up near each other, and directions carry relationships.</p>
									<div class="step-stage">
										<div class="step-pane-head">
											<span class="sp-kicker">Step 2 · Embed</span>
											<h3 class="sp-title">Ids become points in meaning space</h3>
										</div>
										<div class="step-toolbar">
											<div class="step-chips">
												<button class="chip is-on" type="button" data-emb="King - Man + Woman">King − Man + Woman</button>
												<button class="chip" type="button" data-emb="Man + 2 * Power">Man + 2 · Power</button>
												<button class="chip" type="button" data-emb="Prince + Power">Prince + Power</button>
												<button class="chip" type="button" data-emb="gender">male ↔ female</button>
												<button class="chip" type="button" data-emb="power">power</button>
												<button class="chip" type="button" data-emb="directions">all directions</button>
											</div>
										</div>
										<canvas class="step-canvas" id="iemb-canvas" aria-label="A two-dimensional embedding space with power and gender axes"></canvas>
										<div class="step-out" id="iemb-out">The space has two semantic axes in this demo: <b>power</b> and <b>gender</b>. Choose an example to see where it lands.</div>
									</div>
									<div class="prose-math emb-equation emb-formula" id="iemb-formula" data-tex-display="true" aria-live="polite"></div>
									<p class="step-note">Meaning becomes geometry (<a href="https://arxiv.org/abs/1301.3781" rel="noopener">Mikolov et al., 2013</a>). Similar words sit close together, and a <b>direction</b> can carry a relationship: the arrow from man to woman is the same arrow as king to queen. Use the <b>gender</b> and <b>power</b> buttons to see each direction on its own; the arrows are labelled directly. A “dimension” is just one number in the vector; the axes here are labelled for humans, while a real model's axes are unlabelled directions that no single word owns. Real embeddings use thousands of dimensions; this demo uses two so you can see the idea.</p>
								</div>

								<div class="step-pane" id="step-position">
									<p class="step-note step-lead">Attention, explained in the next step, compares tokens with each other but has no built-in sense of order. Without a position signal, “man bites dog” and “dog bites man” contain exactly the same vectors and look identical. A positional encoding adds a distinct fingerprint to every slot, so order becomes part of the representation.</p>
									<div class="step-stage">
										<div class="step-pane-head">
											<span class="sp-kicker">Step 3 · Position</span>
											<h3 class="sp-title">Every slot gets its own fingerprint</h3>
										</div>
										<div class="step-toolbar">
											<label>Context length
												<input type="range" id="ipe-heat-context" min="16" max="128" step="8" value="64">
												<output id="ipe-heat-context-out">64</output>
											</label>
											<label>Dimensions
												<input type="range" id="ipe-heat-dims" min="2" max="64" step="2" value="24">
												<output id="ipe-heat-dims-out">24</output>
											</label>
										</div>
										<canvas class="step-canvas" id="ipe-heatmap" style="height:220px" aria-label="A heatmap of classic sinusoidal positional encodings for a long context"></canvas>
										<div class="pos-legend" aria-hidden="true">
											<span><i class="pl-neg"></i>−1</span>
											<span><i class="pl-zero"></i>0</span>
											<span><i class="pl-pos"></i>+1</span>
										</div>
										<div class="step-out" id="ipe-heat-out">Each row is one position; each column is one dimension.</div>
										<div class="step-toolbar">
											<label>Position
												<input type="range" id="ipe-pos" min="0" max="1000" step="1" value="7">
												<output id="ipe-pos-out">7</output>
											</label>
											<button class="chip is-on" type="button" id="ipe-autorotate" aria-pressed="true">Auto-rotate view</button>
										</div>
										<canvas class="step-canvas" id="ipe-canvas" style="height:380px" aria-label="A token at the centre of three 3D orbits: one per pair of dimensions, each wheel turning at its own speed as the position advances"></canvas>
										<div class="step-out" id="ipe-out">Position <b>7</b> · pair d0/d1 turns <b>41°</b> · pair d2/d3 turns <b>40°</b> · pair d4/d5 turns <b>4°</b>.</div>
									</div>
									<p class="step-note">The heatmap above shows the classic sinusoidal encoding: each position gets a fingerprint built from slow and fast waves. The wheels below show RoPE, a scheme used by many current models. Each pair of dimensions is a wheel, and the token sits at the axle. Moving the token forward by one position rotates every wheel by a different fixed angle, set by the RoPE frequency for that pair. The token itself stays the same; only its angle changes. The ring is only the path the pair can take; the coloured arrow is the rotated pair itself, and the faint dashed line is its unrotated state. Attention compares two tokens by the angle between their rotated keys and queries, which depends on the distance between their positions. The demo uses a narrow model width so the turns stay visible; a real model uses thousands of dimensions.</p>
								</div>

								<div class="step-pane" id="step-attention">
									<p class="step-note step-lead">Attention lets each token look at the other tokens in the context, decide which ones matter for it, and pull their information into its own vector. That is how “bank” moves toward the river reading or the money reading. The demo shows one simplified attention head. A real layer runs many heads in parallel, each attending to something different: one to the previous word, another to the subject, another to a clue far back in the context. Their results are concatenated and projected back.</p>
									<div class="step-stage">
										<div class="step-pane-head">
											<span class="sp-kicker">Step 4 · Attend</span>
											<h3 class="sp-title">Context pulls the word into place</h3>
										</div>
										<div class="step-toolbar">
											<div class="step-chips" id="iatt-examples">
												<button class="chip is-on" type="button" data-att="0">no unambiguous context</button>
												<button class="chip" type="button" data-att="1">river nearby</button>
												<button class="chip" type="button" data-att="2">money nearby</button>
												<button class="chip" type="button" data-att="3">both nearby</button>
											</div>
										</div>
										<div class="attn-sentence" id="iatt-sentence">I walk to the <span class="aw-bank">bank</span>.</div>
										<canvas class="step-canvas" id="iatt-canvas" aria-label="Attention moving the embedding of bank toward the context"></canvas>
										<div class="step-out" id="iatt-out">No unambiguous context: bank stays in the middle, ambiguous.</div>
									</div>
									<p class="step-note"><b>This step is an intuition, not a real attention head.</b> A real attention head computes query, key, and value vectors, turns their dot products into weights with a softmax, and sums the <em>value</em> vectors. It does not literally pick up the token's own embedding and slide it across the page. The moving dot is a teaching picture of the result: context changes the representation. It shows one simplified attention head, not the many heads and layers of a real model.</p>
									<p class="step-note">The query/key/value language is worth demystifying: the query is what a token is looking for, the key is what each token advertises, and the value is what it passes on when the match is good. Attention is a soft lookup, not a database. The same word can end up in a different place depending on the context, because the values it collects are different.</p>
								</div>

								<div class="step-pane layer-pane" id="layer-detail">
									<div class="step-pane-head">
										<span class="sp-kicker">The layer in detail · the MLP</span>
										<h3 class="sp-title">A projection, a bias, a bend</h3>
									</div>
									<p class="step-note step-lead">After attention, each token passes through a small network of its own: the feed-forward network, usually a multilayer perceptron (MLP). It first computes an affine projection, <span data-tex="Wx + b" data-tex-display="false"></span>, which moves the data into another vector space. The projection can rotate, scale, shear, or collapse dimensions, but on its own it maps straight lines to straight lines.</p>
									<div class="layer-formula" data-tex="\operatorname{layer}(x) = \operatorname{activation}\!\left(\underbrace{W}_{\substack{\text{weight}\\\text{matrix}}}\,x + \underbrace{b}_{\text{bias}}\right)" data-tex-de="\operatorname{layer}(x) = \operatorname{activation}\!\left(\underbrace{W}_{\substack{\text{Gewichts-}\\\text{Matrix}}}\,x + \underbrace{b}_{\text{Bias}}\right)"></div>
									<div class="collapse-card">
										<div class="cc-label">Worked example · 2 inputs, 3 outputs</div>
										<div class="collapse-math" data-tex="\begin{aligned} W &amp;= \begin{pmatrix} 1 &amp; 2 \\ 0 &amp; -1 \\ 2 &amp; 1 \end{pmatrix}, \quad x = \begin{pmatrix} 3 \\ 1 \end{pmatrix}, \quad b = \begin{pmatrix} 0 \\ 0 \\ -2 \end{pmatrix} \\[6pt] Wx &amp;= \begin{pmatrix} 1\cdot 3 + 2\cdot 1 \\ 0\cdot 3 + (-1)\cdot 1 \\ 2\cdot 3 + 1\cdot 1 \end{pmatrix} = \begin{pmatrix} 5 \\ -1 \\ 7 \end{pmatrix} \\[6pt] z = Wx + b &amp;= \begin{pmatrix} 5 \\ -1 \\ 7 \end{pmatrix} + \begin{pmatrix} 0 \\ 0 \\ -2 \end{pmatrix} = \begin{pmatrix} 5 \\ -1 \\ 5 \end{pmatrix} \\[6pt] \operatorname{ReLU}(z) &amp;= \begin{pmatrix} 5 \\ 0 \\ 5 \end{pmatrix} \end{aligned}"></div>
										<p>Read <span data-tex="W" data-tex-display="false"></span> row by row: the first output mixes the inputs as <span data-tex="1\cdot 3 + 2\cdot 1" data-tex-display="false"></span>, the second as <span data-tex="0\cdot 3 + (-1)\cdot 1" data-tex-display="false"></span>, the third as <span data-tex="2\cdot 3 + 1\cdot 1" data-tex-display="false"></span>. The bias adds <span data-tex="0" data-tex-display="false"></span>, <span data-tex="0" data-tex-display="false"></span>, and <span data-tex="-2" data-tex-display="false"></span>, so <span data-tex="z = (5, -1, 5)" data-tex-display="false"></span>. ReLU, the activation introduced below, sends the negative entry to zero and leaves the other two unchanged. A real layer runs the same dot products and the same bend with thousands of rows and columns.</p>
									</div>
									<h4 class="layer-subhead">Depth without a nonlinearity</h4>
									<div class="collapse-card">
										<div class="cc-label">two dense layers without a nonlinearity</div>
										<div class="collapse-math" id="collapse-math" data-tex="\begin{aligned} \operatorname{dense}_2(\operatorname{dense}_1(x)) &amp;= W_2(W_1 x + b_1) + b_2 \\ &amp;= (W_2 W_1)x + (W_2 b_1 + b_2) \\ &amp;= Wx + b \\[4pt] W &amp;= W_2 W_1, \qquad b = W_2 b_1 + b_2 \end{aligned}"></div>
										<p>Stack two projections, one after the other. The product <span data-tex="W_2 W_1" data-tex-display="false"></span> is itself a new single weight matrix: every row of <span data-tex="W_1" data-tex-display="false"></span> is mixed with the columns of <span data-tex="W_2" data-tex-display="false"></span>, and the result is a new matrix. If the first layer maps d inputs to h hidden units and the second maps h to k outputs, the combined <span data-tex="W" data-tex-display="false"></span> maps d inputs directly to k outputs: the hidden layer has disappeared. The biases also merge into <span data-tex="W_2 b_1 + b_2" data-tex-display="false"></span>. Without a nonlinearity, two layers are exactly one layer with a combined <span data-tex="W" data-tex-display="false"></span>; depth without a nonlinearity adds no expressive power. That is why a nonlinear activation is needed.</p>
									</div>
									<h4 class="layer-subhead">Nonlinear activation functions</h4>
									<div class="activation-card">
										<div class="activation-copy">
											<p>A <b>nonlinear activation function</b> is applied to each coordinate after the projection. It adds the nonlinearity that a stack of linear layers otherwise lacks.</p>
											<p><span data-tex="\operatorname{ReLU}(z) = \max(0, z)" data-tex-display="false"></span> passes positive values unchanged and sends the entire negative half-space to zero. The graph is flat, then a straight rise: a hard fold at <span data-tex="z = 0" data-tex-display="false"></span>. Because many inputs become the same output, ReLU is not injective; it can change the topology of the representation.</p>
											<p><b>Sigmoid</b> squashes every value into (0, 1); <b>tanh</b> squashes it into (-1, 1). Both are strictly increasing, so they bend smoothly without mapping distinct inputs to the same output. <b>GELU</b> is smooth but not monotonic: it dips slightly below zero, so it is also many-to-one. Other choices include SiLU/Swish, ELU, and gated variants such as SwiGLU.</p>
										</div>
										<div class="activation-plots" id="activation-plots">
											<figure class="ap ap-relu">
												<svg viewBox="0 0 60 44" role="img" aria-label="ReLU: zero for negative inputs, then a straight rise">
													<line class="ap-axis" x1="2" y1="28.67" x2="58" y2="28.67"></line>
													<line class="ap-axis" x1="30" y1="2" x2="30" y2="42"></line>
													<path class="ap-curve" d="M2.00,28.67 L6.67,28.67 L11.33,28.67 L16.00,28.67 L20.67,28.67 L25.33,28.67 L30.00,28.67 L34.67,24.22 L39.33,19.78 L44.00,15.33 L48.67,10.89 L53.33,6.44 L58.00,2.00"></path>
												</svg>
												<figcaption><b>ReLU</b><span>flat, then a rise</span></figcaption>
											</figure>
											<figure class="ap ap-gelu">
												<svg viewBox="0 0 60 44" role="img" aria-label="GELU: a smooth curve that dips slightly below zero">
													<line class="ap-axis" x1="2" y1="28.67" x2="58" y2="28.67"></line>
													<line class="ap-axis" x1="30" y1="2" x2="30" y2="42"></line>
													<path class="ap-curve" d="M2.00,28.70 L6.67,28.80 L11.33,29.07 L16.00,29.56 L20.67,30.08 L25.33,30.04 L30.00,28.67 L34.67,25.59 L39.33,21.19 L44.00,16.22 L48.67,11.29 L53.33,6.58 L58.00,2.04"></path>
												</svg>
												<figcaption><b>GELU</b><span>smooth, small dip</span></figcaption>
											</figure>
											<figure class="ap ap-sigmoid">
												<svg viewBox="0 0 60 44" role="img" aria-label="Sigmoid: an S-shaped curve between zero and one">
													<line class="ap-axis" x1="2" y1="28.67" x2="58" y2="28.67"></line>
													<line class="ap-axis" x1="30" y1="2" x2="30" y2="42"></line>
													<path class="ap-curve" d="M2.00,28.25 L6.67,27.99 L11.33,27.61 L16.00,27.05 L20.67,26.28 L25.33,25.31 L30.00,24.22 L34.67,23.13 L39.33,22.17 L44.00,21.40 L48.67,20.84 L53.33,20.45 L58.00,20.20"></path>
												</svg>
												<figcaption><b>Sigmoid</b><span>S-shape, 0 to 1</span></figcaption>
											</figure>
											<figure class="ap ap-tanh">
												<svg viewBox="0 0 60 44" role="img" aria-label="Tanh: an S-shaped curve between minus one and one">
													<line class="ap-axis" x1="2" y1="28.67" x2="58" y2="28.67"></line>
													<line class="ap-axis" x1="30" y1="2" x2="30" y2="42"></line>
													<path class="ap-curve" d="M2.00,37.51 L6.67,37.44 L11.33,37.24 L16.00,36.71 L20.67,35.44 L25.33,32.77 L30.00,28.67 L34.67,24.56 L39.33,21.90 L44.00,20.62 L48.67,20.10 L53.33,19.90 L58.00,19.82"></path>
												</svg>
												<figcaption><b>tanh</b><span>S-shape, -1 to 1</span></figcaption>
											</figure>
										</div>
									</div>
									<h4 class="layer-subhead">Where the bend happens</h4>
									<p class="step-note curve-intro">After attention has placed each token in context, the MLP works on that token on its own. It projects the vector, adds a bias, and applies a nonlinearity. A smooth activation bends the surrounding space instead of only stretching it; ReLU folds it along a crease at <span data-tex="z = 0" data-tex-display="false"></span>. This moves the token toward a region where the next token is easier to separate.</p>
									<div class="demo demo--paper ism-panel" data-arrow-nav style="margin-top:14px">
										<div class="demo-head">
											<div>
												<p class="demo-title">Watch the MLP bend the space <span>· demo 07</span></p>
												<p class="demo-sub">A straight line is the easiest separator, but it is not always possible in the original space. The MLP lifts the points into a new plane where it becomes possible. In an LLM the same idea runs in thousands of dimensions and helps the model isolate and represent internal states.</p>
											</div>
											<span class="demo-badge">drag / step</span>
										</div>
										<div class="demo-body">
											<div id="ism-copy" class="ism-copy" aria-live="polite">
												<div id="ism-title" class="ism-title"></div>
												<div id="ism-body" class="ism-body"></div>
											</div>
											<div id="ism-wrap" class="ism-wrap" style="height:clamp(360px, 55vw, 480px)">
												<canvas id="ism-canvas" style="display:block;width:100%;height:100%" aria-label="An animated point cloud: a coral core inside a blue ring is lifted into a curved shell until a flat plane separates the two classes">An animated point cloud shows a coral core inside a blue ring being bent into a curved shell until a flat plane separates them.</canvas>
											</div>
											<div class="ism-controls">
												<button type="button" id="ism-prev" data-arrow-prev class="ism-btn" aria-label="Previous step">←</button>
												<button type="button" id="ism-next" data-arrow-next class="ism-btn" aria-label="Next step">→</button>
												<div id="ism-dots" class="ism-dots" aria-hidden="true"></div>
												<span id="ism-counter" class="ism-counter">1 / 7</span>
											</div>
										</div>
										<div class="demo-insight"><b>Takeaway</b><span>The layers in an MLP lift the points into a higher-dimensional space where a straight line can separate what was inseparable before. They change the space in which the cut is made.</span></div>
									</div>
									<p class="step-note">Real models do this in thousands of dimensions, not two. Each layer mixes the coordinates, adds a bias, and bends the result through a nonlinearity; stacking many of these transformations lets the network turn a tangled, high-dimensional relationship into one that a straight line can separate, which in higher dimensions means a plane or hyperplane.</p>
									<p class="step-note">An MLP also translates the representation. Its affine step can move a feature into a region where the next layer can use it; separation and translation are two descriptions of the same learned transformation.</p>
									<p class="step-note curve-source">Visual idea after C. Keup &amp; M. Helias, <em>Origami in N dimensions</em> (<a href="https://arxiv.org/abs/2203.11355" rel="noopener">arXiv:2203.11355</a>).</p>
								</div>

								<div class="step-pane" id="step-ffn">
									<p class="step-note step-lead">A feed-forward network works on each token separately. It expands the vector into a wider hidden layer, applies an activation, and projects back to the original width. Attention mixes information across tokens; the feed-forward part does the per-token computation. The patterns below are a strongly simplified picture of which regions the network activates for a given context; they are not stored rules.</p>
									<div class="step-stage">
										<div class="step-pane-head">
											<span class="sp-kicker">Step 5 · Feed-forward</span>
											<h3 class="sp-title">A pattern matches, a value is written</h3>
										</div>
										<div class="step-toolbar">
											<div class="step-chips" id="iffn-scenarios">
												<button class="chip is-on" type="button" data-ffn="fruit">I ate the apple</button>
												<button class="chip" type="button" data-ffn="tech">I bought an Apple laptop</button>
											</div>
										</div>
										<div class="ffn-grid">
											<div class="ffn-col">
												<div class="ffn-col-head">Residual stream</div>
												<div class="ffn-pill is-fire">“Apple” + context</div>
											</div>
											<div class="ffn-col">
												<div class="ffn-col-head">Patterns in W₁</div>
												<div class="ffn-list" id="iffn-keys"></div>
											</div>
											<div class="ffn-col">
												<div class="ffn-col-head">Next-token pull in W₂</div>
												<div class="ffn-list" id="iffn-values"></div>
											</div>
											<div class="ffn-col">
												<div class="ffn-col-head">Written back</div>
												<div class="ffn-pill is-fire">richer vector</div>
											</div>
										</div>
										<div class="step-out" id="iffn-out"></div>
										<p class="step-note ffn-caveat"><b>What is simplified:</b> a real FFN has no labelled keys or values. The “patterns” are learned directions in W₁; the “pull” is a learned direction in W₂ that changes the next-token distribution. The labels are a simplified picture, not stored rules.</p>
									</div>
								</div>

								<div class="step-pane" id="step-residual">
									<p class="step-note step-lead">Every layer reads the same running vector, the residual stream, computes an update, and adds it back. Think of the stream as a shared notebook that any layer can write to. Earlier notes stay in place; later layers read the original entry plus everything written since. The rule is <span data-tex="x_{n+1} = x_n + \operatorname{layer}_{n+1}(x_n)" data-tex-display="false"></span>: the new state is the old state plus a change. Each attention block contains many heads, and each MLP contains several layers; the diagram folds them into one step at a time.</p>
									<div class="step-stage">
										<div class="step-pane-head">
											<span class="sp-kicker">Step 6 · Residual</span>
											<h3 class="sp-title">Every layer adds to the same stream</h3>
										</div>
										<figure class="res-notebook">
											<div class="res-nb-page">
												<p class="res-nb-sentence"><span class="res-nb-emb">The</span> <span class="res-nb-emb res-nb-att">cat</span> <span class="res-nb-emb res-nb-mlp">sat</span> on the <span class="res-nb-emb">mat</span> because <span class="res-nb-emb res-nb-att">she</span> was <span class="res-nb-emb res-nb-mlp">tired</span>.</p>
												<p class="res-nb-note res-nb-note--emb"><b>Embedding</b> every word becomes a vector.</p>
												<p class="res-nb-note res-nb-note--att"><b>Attention</b> “she” points back to “cat”.</p>
												<p class="res-nb-note res-nb-note--mlp"><b>MLP</b> “tired” explains why the cat sat.</p>
											</div>
											<figcaption>One shared page. Each layer writes in its own color, and earlier notes stay readable.</figcaption>
										</figure>
										<div class="res-stream">
											<div class="res-layers" id="ires-layers"></div>
											<div class="res-panel">
												<div class="res-bars" id="ires-bars"></div>
												<div class="res-vector" id="ires-vector" aria-live="polite"></div>
												<div class="res-legend"><span><i></i> running stream</span><span id="ires-out"></span></div>
												<div class="prose-math" data-tex="\underbrace{x_{n+1}}_{\text{new stream}} = \underbrace{x_n}_{\text{running stream}} + \underbrace{\operatorname{layer}_{n+1}(x_n)}_{\text{what this layer writes}}" data-tex-de="\underbrace{x_{n+1}}_{\text{neuer Stream}} = \underbrace{x_n}_{\text{laufender Stream}} + \underbrace{\operatorname{layer}_{n+1}(x_n)}_{\text{was diese Schicht schreibt}}" data-tex-display="true"></div>
											</div>
										</div>
									</div>
									<p class="step-note">The addition is the point. Nothing is overwritten, so the original signal survives, and gradients have a short path back through the sum. That is a large part of why very deep networks train at all. The numbers under the bars are the same sum written out one coordinate at a time.</p>
								</div>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Tokens become vectors, positions add where each token sits, attention mixes context, the feed-forward network computes, and the residual stream carries the result to the next layer.</span></div>
							<div class="demo-foot">
								The steps are small models. The real pipeline uses thousands of
								dimensions, many heads, and dozens of layers. The order and the division of
								labour stay the same.
							</div>
						</div>
					</section>

					<section class="section-block" id="meadow">
						<div class="section-kicker"><span class="sk-num">04</span> The geometry</div>
						<h2 class="section-title">Meaning becomes geometry.</h2>
						<div class="prose">
							<p>
								The model arranges every token as a point in a learned vector space, and
								relationships often show up as directions: the direction from
								<strong>man</strong> to <strong>woman</strong> is the same as
								<strong>king</strong> to <strong>queen</strong>, and a different direction
								takes <strong>man</strong> to <strong>prince</strong>. The idea that
								concepts can be read as regions and directions in a geometric space goes
								back to the conceptual spaces of
								<a href="https://en.wikipedia.org/wiki/Conceptual_space" rel="noopener">Gärdenfors (2000)</a>.
								In an LLM the space is learned from text rather than designed by hand.
							</p>
							<p>
								The plot below is a two-dimensional slice: <strong>Power</strong> on
								the horizontal axis and <strong>Gender</strong> on the vertical one.
								Nobody writes those axes down; they are a human-readable projection of
								directions the model found useful. In a real embedding the space has
								thousands of dimensions, most of them unnamed.
							</p>
							<p>
								Use the buttons to do the arithmetic. <em>King − Man + Woman</em>
								lands near <em>Queen</em>, because the gender direction is shared.
								The direction is the point, not the exact coordinates. Real
								embeddings are noisier, and the geometry inherits the biases of the
								text it was trained on.
							</p>
						</div>

						<div class="demo demo--paper" id="embedding-plot-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">Power and gender <span>· demo 08</span></p>
									<p class="demo-sub">Words are points in a learned space. The same direction carries a relationship from one pair to another.</p>
								</div>
								<span class="demo-badge">2-D slice</span>
							</div>
							<div class="demo-body">
								<div class="chip-row" id="emb-examples">
									<button class="chip is-on" type="button" data-emb-ex="King - Man + Woman">King − Man + Woman</button>
									<button class="chip" type="button" data-emb-ex="Man + Power">Man + Power</button>
									<button class="chip" type="button" data-emb-ex="Woman + 2*Power">Woman + 2·Power</button>
									<button class="chip" type="button" data-emb-ex="Prince + Power">Prince + Power</button>
									<button class="chip" type="button" data-emb-ex="directions">↗ Directions</button>
								</div>
								<canvas class="demo-canvas" id="emb-plot-canvas" style="height:340px" aria-label="A two-dimensional embedding space with Power on the x-axis and Gender on the y-axis"></canvas>
								<div class="emb-equation" id="emb-plot-equation" data-tex-display="false"></div>
								<div class="demo-readout">
									<div><b>Expression</b><span id="emb-plot-expr">King − Man + Woman</span></div>
									<div><b>Lands near</b><span id="emb-plot-nearest">Queen</span></div>
									<div><b>Distance</b><span id="emb-plot-dist">...</span></div>
								</div>
								<p class="demo-hint">The axes are a slice through a much larger space. The direction is the point, not the exact numbers.</p>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Relationships are reusable directions. “King − Man + Woman” lands near “Queen” because the gender direction is shared.</span></div>
							<div class="demo-foot">The axes are a small slice of a much larger space. Real embeddings are higher-dimensional and noisier.</div>
						</div>
						<div class="prose" style="margin-top:22px">
							<p><strong>The meadow of words.</strong> The plot above shows directions. The meadow shows how the model divides the space into cells. After all the layers, the model has a vector for each token, and every token in the vocabulary owns the region of that space closest to it. The image is two-dimensional, while a real model works in thousands of dimensions, but the principle is the same: the vocabulary forms bubbles, and every thought falls into one of them or near its border. The closer the thought is to a word's centre, the more likely that word is; near the edges the estimate becomes less precise. Temperature and top-k change how large the candidate set is. Move the pointer and the thought lands in a cell, or on a seam where two words are almost equally near.</p>
						</div>

						<div class="demo demo--paper" id="meadow-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">The meadow of words <span>· demo 09</span></p>
									<p class="demo-sub">Every word owns a cell. Move the pointer; the thought falls into the nearest cell. The golden seams are where two words are equally near.</p>
								</div>
								<span class="demo-badge">move me</span>
							</div>
							<div class="demo-body">
								<canvas class="demo-canvas" id="meadow-canvas" style="aspect-ratio:560/196;height:auto" aria-label="A Voronoi field of words. Move the pointer to place a thought."></canvas>
								<div class="demo-controls">
									<label>Words <input type="range" id="md-n" min="12" max="30" step="6" value="12"><output id="md-n-out">12</output></label>
									<label>Temperature <input type="range" id="md-temp" min="0.2" max="2.6" step="0.05" value="0.8"><output id="md-temp-out">0.80</output></label>
									<label>Top-k <input type="range" id="md-k" min="1" max="10" step="1" value="5"><output id="md-k-out">5</output></label>
								</div>
								<div class="demo-readout demo-readout--4">
									<div><b>Nearest word</b><span id="md-word">Dog</span></div>
									<div><b>Wins with</b><span id="md-chance">—</span></div>
									<div><b>Margin to seam</b><span id="md-margin">—</span></div>
									<div><b>Ambiguous share</b><span id="md-gap">—</span></div>
								</div>
								<p class="meadow-caption" id="md-caption">Move the pointer across the meadow.</p>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Words divide the space of thoughts into cells. Certainty is being deep inside a cell; uncertainty is standing on a seam or right at the edge.</span></div>
							<div class="demo-foot">More words make smaller cells and thinner seams, but the ambiguous share never reaches zero. In a real model the space has thousands of dimensions and the vocabulary has tens of thousands of tokens.</div>
						</div>

					</section>

					<section class="section-block" id="whole">
						<div class="section-kicker"><span class="sk-num">05</span> The whole loop</div>
						<h2 class="section-title">Text in, geometry, one word out.</h2>
						<div class="prose">
							<p>
								The pieces fit together in a fixed order. The real model is much
								larger, and the remaining pages fill in the details. Text is cut into
								<strong>tokens</strong>. Each token becomes a <strong>vector</strong>. A
								<strong>position signal</strong> is added. Layer after layer,
								<strong>attention</strong> lets every vector look at its neighbours while a
								<strong>residual stream</strong> keeps earlier results and enriches them with new ones. The
								final vector is scored against the vocabulary and turned into a
								distribution; one token is drawn. It is appended, and the next pass begins;
								the loop ends when the model emits the special token <strong>&lt;|endoftext|&gt;</strong>.
							</p>
							<p>
								No step has a tidy fact database, and no step “understands” in the human
								sense. Knowledge is distributed across the weights; meaning lives in the
								<strong>geometry</strong> (directions, distances, regions) and at each
								step the model places the next thought somewhere in that space. The embedding plot
								is that last step, seen up close.
							</p>
							<p>
								So where is a fact, if not in a table? Mostly in the feed-forward weights,
								and often <strong>superposed</strong> (<a href="https://arxiv.org/abs/2209.10652" rel="noopener">Elhage et al., 2022</a>; <a href="https://already-clean.goodfire.com/" rel="noopener">Goodfire</a>): several features share the same
								directions instead of each owning a private neuron. A single direction can
								therefore carry parts of several facts at once. That is why a fact can be
								partly present, why the model may know something without being able to say it
								reliably, and why editing one fact can disturb another: both are written along
								the same direction.
							</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>What it is</b><span>A next-token predictor: one distribution, one draw, one append, repeated.</span></div>
							<div class="keypoint"><b>Why it scales</b><span>Better prediction usually means better compression, and compression needs more of the world’s structure.</span></div>
							<div class="keypoint"><b>Its limits</b><span>It predicts plausible text. It can be fluent and wrong, and it offers no guarantee of truth.</span></div>
							<div class="keypoint"><b>The contested part</b><span>Whether fluent prediction is genuine world knowledge or “stochastic parroting” is not settled.</span></div>
						</div>
						<div class="prose">
							<p>
								The idea that compressing well and predicting well are related is a working
								hypothesis, not a proved identity. A good compressor has to capture regularities
								in its data; a good predictor has to capture the same regularities. Solomonoff
								made this precise by scoring each possible explanation with the length of the
								shortest program that produces it. A short program that reproduces the data
								gets a high score, so simple explanations are favoured. His convergence theorem
								says that a predictor built this way learns, in the limit, any pattern that a
								finite program can generate
								(<a href="https://doi.org/10.1109/TIT.1978.1055913" rel="noopener">Solomonoff, 1978</a>).
								That score cannot be computed in practice, so the theorem describes an ideal
								predictor rather than a particular model. It also does not settle whether a
								model grasps the world. The honest position is that the evidence is still
								catching up to the argument, and that both awe and scepticism respond to the
								same fact: a loop this simple gets this far.
							</p>
						</div>
					</section>


				</article>
			</div>
		</div>
	</main>

	<script src="../temml.min.js"></script>
	<script src="assets/site.js?v=20261104"></script>
	<script src="assets/demos.js?v=20261104c"></script>
	<script src="assets/space-morph.js?v=20261104"></script>
	<script src="assets/embedding-plot.js?v=20261104"></script>
	<script src="assets/word-meadow.js?v=20261105c"></script>
	<script>
	(function () {
		"use strict";

		/* ── demo 1: the autoregressive loop ─────────────────── */
		var MAX_STEPS = 6;
		var LANG = TM.lang();
		var DE = LANG === "de";
		if (DE) {
			document.querySelectorAll("[data-tex-de]").forEach(function (el) {
				el.setAttribute("data-tex", el.getAttribute("data-tex-de"));
				el.removeAttribute("data-tex-rendered");
			});
			TM.typesetMath();
		}
		function hexToRgb(hex) {
			var h = String(hex || "").replace("#", "");
			if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
			return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
		}
		var NOUNS = DE ? [
			{ t: "Drache", l: 3.4 }, { t: "Prinzessin", l: 1.1 }, { t: "Roboter", l: 0.7 }, { t: "Schloss", l: 0.4 }, { t: "Fluss", l: 0.2 }
		] : [
			{ t: "dragon", l: 3.4 }, { t: "princess", l: 1.1 }, { t: "robot", l: 0.7 }, { t: "castle", l: 0.4 }, { t: "river", l: 0.2 }
		];
		var ACTIONS = DE ? {
			Drache: [{ t: "fliegen", l: 3.5 }, { t: "brüllen", l: 1.5 }, { t: "schlafen", l: 0.8 }, { t: "schwimmen", l: 0.5 }, { t: "singen", l: 0.3 }],
			Prinzessin: [{ t: "singen", l: 3.4 }, { t: "tanzen", l: 1.5 }, { t: "träumen", l: 0.9 }, { t: "schlafen", l: 0.5 }, { t: "schwimmen", l: 0.3 }],
			Roboter: [{ t: "fliegen", l: 3.3 }, { t: "piepen", l: 1.5 }, { t: "singen", l: 0.9 }, { t: "schlafen", l: 0.5 }, { t: "schwimmen", l: 0.3 }],
			Schloss: [{ t: "glänzen", l: 3.2 }, { t: "leuchten", l: 1.5 }, { t: "schlafen", l: 0.8 }, { t: "singen", l: 0.4 }],
			Fluss: [{ t: "fließen", l: 3.5 }, { t: "singen", l: 1.2 }, { t: "brüllen", l: 0.8 }, { t: "gefrieren", l: 0.5 }, { t: "glänzen", l: 0.3 }]
		} : {
			dragon: [{ t: "fly", l: 3.5 }, { t: "roar", l: 1.5 }, { t: "sleep", l: 0.8 }, { t: "swim", l: 0.5 }, { t: "sing", l: 0.3 }],
			princess: [{ t: "sing", l: 3.4 }, { t: "dance", l: 1.5 }, { t: "dream", l: 0.9 }, { t: "sleep", l: 0.5 }, { t: "swim", l: 0.3 }],
			robot: [{ t: "fly", l: 3.3 }, { t: "beep", l: 1.5 }, { t: "sing", l: 0.9 }, { t: "sleep", l: 0.5 }, { t: "swim", l: 0.3 }],
			castle: [{ t: "stand", l: 3.2 }, { t: "glow", l: 1.5 }, { t: "sleep", l: 0.8 }, { t: "sing", l: 0.4 }],
			river: [{ t: "flow", l: 3.5 }, { t: "sing", l: 1.2 }, { t: "roar", l: 0.8 }, { t: "freeze", l: 0.5 }, { t: "shine", l: 0.3 }]
		};
		var RELATIVE = DE ? {
			Drache: [{ t: "der", l: 3.6 }],
			Prinzessin: [{ t: "die", l: 3.6 }],
			Roboter: [{ t: "der", l: 3.6 }],
			Schloss: [{ t: "das", l: 3.6 }],
			Fluss: [{ t: "der", l: 3.6 }]
		} : null;
		var MODALS = DE ? [
			{ t: "konnte", l: 3.0 }, { t: "wollte", l: 1.3 }, { t: "sollte", l: 0.9 }, { t: "durfte", l: 0.6 }, { t: "musste", l: 0.3 }
		] : [
			{ t: "could", l: 3.0 }, { t: "would", l: 1.3 }, { t: "loved", l: 0.9 }, { t: "tried", l: 0.6 }, { t: "wanted", l: 0.3 }
		];
		var NEGATORS = DE ? [
			{ t: "nicht", l: 3.3 }, { t: "nie", l: 1.2 }, { t: "nur", l: 0.8 }, { t: "noch", l: 0.5 }, { t: "immer", l: 0.3 }
		] : [
			{ t: "not", l: 3.3 }, { t: "never", l: 1.2 }, { t: "only", l: 0.8 }, { t: "still", l: 0.5 }, { t: "always", l: 0.3 }
		];
		function choicesFor() {
			var n = generated.length;
			if (n === 0) return NOUNS;
			if (n === 1) {
				if (DE) return RELATIVE[generated[0]] || [{ t: "der", l: 3.6 }];
				var noun = generated[0];
				if (noun === "princess") return [{ t: "that", l: 3.1 }, { t: "who", l: 1.4 }];
				if (noun === "castle" || noun === "river") return [{ t: "that", l: 3.1 }, { t: "which", l: 1.4 }];
				return [{ t: "that", l: 3.1 }, { t: "who", l: 1.4 }, { t: "which", l: 0.8 }];
			}
			if (n === 2) return MODALS;
			if (n === 3) {
				if (DE) return NEGATORS;
				var verb = generated[2];
				if (verb === "could" || verb === "would") return NEGATORS;
				return [{ t: "to", l: 4.0 }];
			}
			if (n === 4) return ACTIONS[generated[0]] || (DE ? ACTIONS.Drache : ACTIONS.dragon);
			if (n === 5) return [
				{ t: ".", l: 3.2 }, { t: "!", l: 1.1 }, { t: "…", l: 0.7 }
			];
			return [];
		}
		function nounArticle() {
			return DE && generated[0] === "Prinzessin" ? "eine" : "ein";
		}
		var base = DE ? ["Es", "war", "einmal", "ein"] : ["Once", "upon", "a", "time", "there", "was", "a"];
		var generated = [];
		var stage = 0;
		var temp = 0.8;
		var preGreedyTemp = 0.8;
		var decodeMode = "sample";
		var sentenceEl = document.getElementById("nt-sentence");
		var treeEl = document.getElementById("nt-tree");
		var barsEl = document.getElementById("nt-bars");
		var stepBtn = document.getElementById("nt-step");
		var resetBtn = document.getElementById("nt-reset");
		var tempEl = document.getElementById("nt-temp");
		var tempOut = document.getElementById("nt-temp-out");
		var stepCount = document.getElementById("nt-step-count");
		var lenEl = document.getElementById("nt-len");
		var topEl = document.getElementById("nt-top");

		function softmax(logits, t) {
			var max = Math.max.apply(null, logits);
			var exps = logits.map(function (l) { return Math.exp((l - max) / Math.max(0.05, t)); });
			var sum = exps.reduce(function (a, b) { return a + b; }, 0);
			return exps.map(function (e) { return e / sum; });
		}
		function renderTree() {
			if (!treeEl) return;
			var baseWords = base.slice();
			if (DE && generated.length) baseWords[baseWords.length - 1] = nounArticle();
			var path = ['<span class="nt-tree-base">' + escapeHtml(baseWords.join(" ")) + '</span>'];
			generated.forEach(function (tok, i) {
				path.push('<span class="nt-tree-arrow">→</span>');
				path.push('<span class="nt-tree-node">' + escapeHtml(tok) + (DE && i === 0 ? "," : "") + '</span>');
			});
			var opts = choicesFor();
			var next;
			if (opts.length) {
				next = '<span class="nt-tree-next">' + (opts.length === 1 ? (DE ? "nächstes:" : "next:") : (DE ? "nächstes:" : "next:")) + '</span> '
					+ opts.map(function (o) {
						return '<button type="button" class="nt-tree-branch" data-nt-choice="' + escapeHtml(o.t) + '" aria-label="' + escapeHtml((DE ? "Wähle " : "Choose ") + o.t) + '">' + escapeHtml(o.t) + '</button>';
					}).join('<span class="nt-tree-sep">·</span>');
			} else {
				next = '<span class="nt-tree-end">' + (DE ? "Satzende" : "end of sentence") + '</span>';
			}
			treeEl.innerHTML = '<div class="nt-tree-line">' + path.join(' ') + '</div>'
				+ '<div class="nt-tree-line nt-tree-line--next">' + next + '</div>';
		}
		function renderSentence() {
			if (!sentenceEl) return;
			var html = "";
			var all = base.map(function (tok, i) {
				if (DE && i === base.length - 1 && generated.length) tok = nounArticle();
				return { tok: tok, cls: "given" };
			}).concat(generated.map(function (tok) { return { tok: tok, cls: "pred" }; }));
			all.forEach(function (item, i) {
				var noSpace = /^[.,!?;:)\]]|^…/.test(item.tok);
				if (DE && i === base.length + 1) html += ",";
				if (i && !noSpace) html += " ";
				html += '<span class="' + item.cls + '">' + escapeHtml(item.tok) + "</span>";
			});
			if (stage >= MAX_STEPS) {
				html += ' <span class="given" style="opacity:.55">' + (DE ? "Sequenz vollständig" : "sequence complete") + '</span>';
			} else {
				html += '<span class="cursor" aria-hidden="true"></span>';
			}
			sentenceEl.innerHTML = html;
			renderTree();
		}
		function escapeHtml(s) {
			return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
		}
		function renderBars() {
			if (!barsEl) return;
			barsEl.innerHTML = "";
			if (stage >= MAX_STEPS) {
				var done = document.createElement("p");
				done.style.cssText = "margin:0;color:var(--tm-muted);font-family:var(--tm-prose);font-size:.9rem";
				done.textContent = DE ? "Das Modell würde jetzt ein End-of-Sequence-Signal ausgeben oder weiterlaufen, wenn der Kontext es zulässt." : "The model would now emit an end-of-sequence signal, or keep going if the context invited it.";
				barsEl.appendChild(done);
				if (stepBtn) { stepBtn.disabled = true; stepBtn.style.opacity = ".45"; }
				return;
			}
			if (stepBtn) { stepBtn.disabled = false; stepBtn.style.opacity = "1"; }
			var options = choicesFor();
			var probs = softmax(options.map(function (o) { return o.l; }), temp);
			var top = 0;
			probs.forEach(function (p, i) { if (p > probs[top]) top = i; });
			var kept = null;
			if (decodeMode === "topp") {
				var order = probs.map(function (p, i) { return { i: i, p: p }; }).sort(function (a, b) { return b.p - a.p; });
				var cumulative = 0;
				kept = [];
				for (var k = 0; k < order.length; k++) {
					kept.push(order[k].i);
					cumulative += order[k].p;
					if (cumulative >= 0.9) break;
				}
			}
			options.forEach(function (opt, i) {
				var row = document.createElement("button");
				row.type = "button";
				row.className = "bar-row" + (i === top ? " is-top" : "") + (kept && kept.indexOf(i) === -1 ? " is-cut" : "");
				row.setAttribute("aria-label", (DE ? "Wähle " : "Choose ") + opt.t + (DE ? ", Wahrscheinlichkeit " : ", probability ") + Math.round(probs[i] * 100) + (DE ? " Prozent" : " percent"));
				row.innerHTML = '<span class="bar-name">' + escapeHtml(opt.t === " " ? "␣" : opt.t) + '</span>'
					+ '<span class="bar-track"><span class="bar-fill" style="width:' + (probs[i] * 100).toFixed(2) + '%"></span></span>'
					+ '<span class="bar-pct">' + Math.round(probs[i] * 100) + '%</span>';
				row.addEventListener("click", function () { choose(opt.t); });
				barsEl.appendChild(row);
			});
			if (options.length < 5) {
				var note = document.createElement("p");
				note.className = "bars-note";
				note.textContent = options.length === 1
					? (DE ? "Von hier aus ergibt nur ein Zweig Sinn." : "Only one branch makes sense from this point.")
					: (DE ? "Zweige, die hier ungrammatisch wären, werden weggelassen." : "Branches that would be ungrammatical here are omitted.");
				barsEl.appendChild(note);
			}
			if (topEl) topEl.textContent = options[top].t === " " ? (DE ? "␣ (Leerzeichen)" : "␣ (space)") : options[top].t;
			updateWhy();
		}
		function choose(token) {
			if (stage >= MAX_STEPS) return;
			token.split(" ").forEach(function (piece) { generated.push(piece); });
			stage++;
			renderSentence();
			renderBars();
			updateReadout();
		}
		function sample() {
			if (stage >= MAX_STEPS) return;
			var options = choicesFor();
			var probs = softmax(options.map(function (o) { return o.l; }), temp);
			var top = 0;
			probs.forEach(function (p, i) { if (p > probs[top]) top = i; });
			if (decodeMode === "greedy") { choose(options[top].t); return; }
			var pool = probs.map(function (p, i) { return { i: i, p: p }; });
			if (decodeMode === "topp") {
				pool.sort(function (a, b) { return b.p - a.p; });
				var cumulative = 0;
				var kept = [];
				for (var k = 0; k < pool.length; k++) {
					kept.push(pool[k]);
					cumulative += pool[k].p;
					if (cumulative >= 0.9) break;
				}
				pool = kept;
				var total = pool.reduce(function (s, x) { return s + x.p; }, 0);
				pool.forEach(function (x) { x.p = x.p / total; });
			}
			var r = Math.random();
			var acc = 0;
			for (var j = 0; j < pool.length; j++) {
				acc += pool[j].p;
				if (r <= acc) { choose(options[pool[j].i].t); return; }
			}
			choose(options[pool[pool.length - 1].i].t);
		}
		function updateWhy() {
			var why = document.getElementById("nt-why");
			if (!why) return;
			var opts = choicesFor();
			if (opts.length === 1) {
				why.textContent = DE
					? "Hier ergibt nur eine Fortsetzung Sinn: „" + opts[0].t + "“. Der Baum hat sich auf einen Zweig verengt."
					: "Only one continuation makes sense here: “" + opts[0].t + "”. The tree has narrowed to a single branch.";
				return;
			}
			if (decodeMode === "greedy") why.textContent = DE
				? "Greedy ist der Grenzfall T → 0: Es nimmt immer das wahrscheinlichste Wort, deshalb ist der Temperaturregler bei 0,05 fixiert. Der Text ist deterministisch und oft repetitiv."
				: "Greedy is the limit T → 0: it always takes the highest-probability word, so the temperature slider is pinned at 0.05. The text is deterministic and often repetitive.";
			else if (decodeMode === "topp") why.textContent = DE
				? "Die Temperatur formt zuerst die Verteilung; Top-p behält dann die kleinste Menge der sortierten Wörter, deren kumulierte Wahrscheinlichkeit 90 % erreicht, und zieht daraus. Die blassen Balken liegen außerhalb dieser Menge."
				: "Temperature reshapes the distribution first; top-p then keeps the smallest set of sorted words whose cumulative probability reaches 90%, and samples among them. The faded bars are outside that set.";
			else why.textContent = DE
				? "Sampling zieht aus der ganzen Verteilung nach der Temperaturformung. Niedriges T verhält sich fast gierig; hohes T flacht die Verteilung ab und tauscht Kohärenz gegen Überraschung."
				: "Sampling draws from the whole distribution after temperature has shaped it. Low T behaves almost greedily; high T flattens the distribution and trades coherence for surprise.";
		}
		function setTemp(value) {
			temp = Math.max(0.05, Math.min(1.8, value));
			if (tempEl) tempEl.value = temp;
			if (tempOut) tempOut.textContent = temp.toFixed(2);
		}
		function setTempEnabled(enabled) {
			if (!tempEl) return;
			tempEl.disabled = !enabled;
			if (enabled) tempEl.removeAttribute("aria-disabled");
			else tempEl.setAttribute("aria-disabled", "true");
			var label = tempEl.closest("label");
			if (label) label.classList.toggle("is-disabled", !enabled);
		}
		function setDecodeMode(mode) {
			var prev = decodeMode;
			decodeMode = mode;
			if (mode === "greedy") {
				if (prev !== "greedy") preGreedyTemp = temp;
				setTemp(0.05);
				setTempEnabled(false);
			} else {
				if (prev === "greedy") setTemp(preGreedyTemp);
				setTempEnabled(true);
			}
			var modeEl = document.getElementById("nt-mode");
			if (modeEl) modeEl.textContent = mode === "topp" ? "Top-p 0.9" : (DE ? (mode === "sample" ? "Sampling" : "Greedy") : mode);
			document.querySelectorAll("[data-decode]").forEach(function (b) {
				b.classList.toggle("is-on", b.getAttribute("data-decode") === mode);
			});
			updateWhy();
			renderBars();
		}
		function updateReadout() {
			if (stepCount) stepCount.textContent = Math.min(stage, MAX_STEPS) + " / " + MAX_STEPS;
			if (lenEl) lenEl.textContent = (base.length + generated.length) + (DE ? " Wörter" : " words");
		}
		function reset() {
			generated = [];
			stage = 0;
			renderSentence();
			renderBars();
			updateReadout();
		}
		if (stepBtn) stepBtn.addEventListener("click", sample);
		if (resetBtn) resetBtn.addEventListener("click", reset);
		if (treeEl) {
			treeEl.addEventListener("click", function (ev) {
				var branch = ev.target.closest("[data-nt-choice]");
				if (!branch || !treeEl.contains(branch)) return;
				choose(branch.getAttribute("data-nt-choice"));
			});
		}
		document.querySelectorAll("[data-decode]").forEach(function (b) {
			b.addEventListener("click", function () { setDecodeMode(b.getAttribute("data-decode")); });
		});
		if (tempEl) {
			tempEl.addEventListener("input", function () {
				setTemp(parseFloat(tempEl.value));
				renderBars();
			});
		}
		setTemp(temp);
		setTempEnabled(true);
		reset();

		/* ── demo 01a: the model in your pocket ──────────────── */
		var phStage = document.getElementById("phone-demo");
		if (phStage) {
			var phLogo = document.getElementById("ia-logo");
			var phSearchBar = document.getElementById("ia-search-bar");
			var phSearchText = document.getElementById("ia-search-text");
			var phMic = document.getElementById("ia-mic-btn");
			var phWave = document.getElementById("ia-waveform");
			var phCard = document.getElementById("ia-ai-card");
			var phAiText = document.getElementById("ia-ai-text");
			var phThinking = document.getElementById("ia-ai-thinking");
			var phSerp = document.getElementById("ia-serp");
			var phReplay = document.getElementById("ph-replay");
			var PH_SATZ = DE ? "warum ist der himmel blau?" : "why is the sky blue?";
			var PH_AI = DE ? [
				{ t: "Der Himmel ist blau, weil Luftmoleküle kurzwelliges Licht stärker streuen als langwelliges. Blau (450 nm) wird etwa 4× mehr gestreut als Rot (650 nm): " },
				{ t: "Rayleigh-Streuung", c: "b" },
				{ t: "." }
			] : [
				{ t: "The sky is blue because air molecules scatter short-wavelength light more strongly than long-wavelength light. Blue (450 nm) is scattered about 4× more than red (650 nm): " },
				{ t: "Rayleigh scattering", c: "b" },
				{ t: "." }
			];
			var PH_RESULTS = DE ? [
				{ name: "Wikipedia", url: "de.wikipedia.org › Rayleigh-Jeans-Gesetz", title: "Rayleigh-Jeans-Gesetz", snippet: "Das Plancksche Strahlungsgesetz ist eine Interpolationsformel der beiden anderen Gesetze.", icon: "assets/favicon_wikipedia.ico" },
				{ name: "Wikipedia", url: "de.wikipedia.org › Rayleigh-Streuung", title: "Rayleigh-Streuung", snippet: "Die Streuung von Licht an Teilchen, die kleiner sind als seine Wellenlänge.", icon: "assets/favicon_wikipedia.ico" },
				{ name: "Leifi Physik", url: "www.leifiphysik.de › optik › streuung", title: "Warum ist der Himmel blau?", snippet: "Kurzwelliges blaues Licht wird stärker gestreut als langwelliges rotes Licht.", icon: "assets/favicon_leifiphysik.ico" }
			] : [
				{ name: "Wikipedia", url: "en.wikipedia.org › Rayleigh–Jeans law", title: "Rayleigh–Jeans law", snippet: "The Planck law interpolates between the Rayleigh–Jeans law and Wien's law.", icon: "assets/favicon_wikipedia.ico" },
				{ name: "Wikipedia", url: "en.wikipedia.org › Rayleigh scattering", title: "Rayleigh scattering", snippet: "Scattering of light by particles smaller than its wavelength.", icon: "assets/favicon_wikipedia.ico" },
				{ name: "Wikipedia", url: "en.wikipedia.org › Diffuse sky radiation", title: "Diffuse sky radiation", snippet: "Short-wavelength blue light is scattered more strongly than long-wavelength red light.", icon: "assets/favicon_wikipedia.ico" }
			];
			var phTimers = [];
			var phReduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

			function phLater(fn, ms) {
				var id = setTimeout(fn, ms);
				phTimers.push(id);
				return id;
			}
			function phClear() {
				phTimers.forEach(clearTimeout);
				phTimers = [];
			}
			function phLogoBuild() {
				var letters = DE ? "Suche".split("") : "Search".split("");
				phLogo.innerHTML = letters.map(function (ch, i) {
					return '<span class="ia-l' + (i + 1) + '">' + ch + "</span>";
				}).join("");
			}
			function phSerpBuild() {
				phSerp.innerHTML = PH_RESULTS.map(function (r, i) {
					return '<div class="ia-result r' + (i + 1) + '">' +
						'<div class="ia-res-head">' +
							'<img class="ia-res-fav" src="' + r.icon + '" alt="">' +
							'<div class="ia-res-lines">' +
								'<span class="ia-res-name">' + r.name + '</span>' +
								'<span class="ia-res-url">' + r.url + '</span>' +
							'</div>' +
						'</div>' +
						'<div class="ia-res-title">' + r.title + '</div>' +
						'<div class="ia-res-snippet">' + r.snippet + '</div>' +
					'</div>';
				}).join("");
			}
			function phSetCentered(on) {
				phSearchBar.classList.toggle("centered", !!on);
			}
			function phReset() {
				phClear();
				phSetCentered(true);
				phSearchText.textContent = "";
				phSearchText.classList.remove("typing");
				phMic.classList.remove("listening");
				phWave.classList.remove("active");
				phCard.classList.remove("on");
				phAiText.innerHTML = "";
				phThinking.classList.remove("on");
				phSerp.classList.remove("on");
			}
			function phTypeSearch(text, done) {
				if (phReduce) {
					phSearchText.textContent = text;
					done();
					return;
				}
				phSearchText.classList.add("typing");
				phSearchText.innerHTML = '<span class="ia-caret"></span>';
				var i = 0;
				var timer = setInterval(function () {
					if (i < text.length) {
						i += 1;
						phSearchText.innerHTML = text.slice(0, i) + '<span class="ia-caret"></span>';
					} else {
						clearInterval(timer);
						phSearchText.classList.remove("typing");
						phSearchText.textContent = text;
						phLater(done, 120);
					}
				}, 13);
				phTimers.push(timer);
			}
			function phTypeAnswer() {
				var spans = PH_AI.map(function (seg) {
					var el = document.createElement("span");
					if (seg.c) el.className = "ia-" + seg.c;
					phAiText.appendChild(el);
					return el;
				});
				if (phReduce) {
					spans.forEach(function (el, i) { el.textContent = PH_AI[i].t; });
					return;
				}
				var si = 0;
				var ci = 0;
				function tick() {
					var remaining = 8;
					while (remaining > 0 && si < spans.length) {
						var seg = PH_AI[si];
						var take = Math.min(remaining, seg.t.length - ci);
						ci += take;
						remaining -= take;
						spans[si].textContent = seg.t.slice(0, ci);
						if (ci >= seg.t.length) { si += 1; ci = 0; }
					}
					if (si < spans.length) phLater(tick, 16);
				}
				tick();
			}
			function phPlay() {
				phReset();
				phLogoBuild();
				phSerpBuild();
				if (phReduce) {
					phSearchText.textContent = PH_SATZ;
					phSetCentered(false);
					phCard.classList.add("on");
					phTypeAnswer();
					phSerp.classList.add("on");
					return;
				}
				phMic.classList.add("listening");
				phWave.classList.add("active");
				phTypeSearch(PH_SATZ, function () {
					phSearchText.textContent = PH_SATZ;
					phSetCentered(false);
					phLater(function () {
						phCard.classList.add("on");
						phThinking.classList.add("on");
						phLater(function () {
							phThinking.classList.remove("on");
							phMic.classList.remove("listening");
							phWave.classList.remove("active");
							phTypeAnswer();
							phSerp.classList.add("on");
						}, 240);
					}, 320);
				});
			}
			phLogoBuild();
			phSerpBuild();
			var phStarted = false;
			function phStart() {
				if (phStarted) return;
				phStarted = true;
				phPlay();
			}
			if (phReplay) phReplay.addEventListener("click", function () {
				phStarted = true;
				phPlay();
			});
			phReset();
			if (phReduce) {
				phStart();
			} else {
				var phVisible = false;
				var phQueued = false;
				var phLoadBound = false;
				function phQueue() {
					if (phQueued) return;
					phQueued = true;
					requestAnimationFrame(function () {
						requestAnimationFrame(function () {
							phLater(phStart, 180);
						});
					});
				}
				function phMaybeQueue() {
					if (!phVisible || phQueued) return;
					if (document.readyState === "complete") {
						phQueue();
						return;
					}
					if (!phLoadBound) {
						phLoadBound = true;
						window.addEventListener("load", function () {
							if (phVisible) phQueue();
						}, { once: true });
					}
				}
				if ("IntersectionObserver" in window) {
					new IntersectionObserver(function (entries) {
						if (!entries[0].isIntersecting) return;
						phVisible = true;
						phMaybeQueue();
					}, { threshold: 0.25 }).observe(phStage);
				} else {
					phVisible = true;
					phMaybeQueue();
				}
			}
		}

		/* ── truth tunnel ────────────────────────────────────── */
		var isoCanvas = document.getElementById("tt-canvas");
		var isoNextEl = document.getElementById("tt-next");
		var isoAltEl = document.getElementById("tt-alt");
		var isoMetaEl = document.getElementById("tt-meta");
		var isoAdvance = document.getElementById("tt-advance");
		var isoTempEl = document.getElementById("tt-temp");
		var isoTempOut = document.getElementById("tt-temp-out");
		var isoStep = 0;
		var isoTemp = 0.8;
		var isoApi = null;
		var isoLabels = DE ? {
			certain: "fast sicher", likely: "wahrscheinlich", open: "offen", wide: "sehr offen", width: "Tunnelbreite", certainAxis: "sicher", openAxis: "offen"
		} : {
			certain: "near-certain", likely: "likely", open: "open", wide: "wide open", width: "tunnel width", certainAxis: "certain", openAxis: "open"
		};
		var isoTokens = DE ? ["Die", "Hauptstadt", "von", "Frankreich", "ist", "Paris", "."] : ["The", "capital", "of", "France", "is", "Paris", "."];
		var isoEntropy = [0.95, 0.55, 0.20, 0.60, 0.15, 0.05, 0.10];
		var isoPath = [
			{ x: 0.08, y: 0.50 }, { x: 0.20, y: 0.42 }, { x: 0.32, y: 0.38 },
			{ x: 0.45, y: 0.35 }, { x: 0.58, y: 0.32 }, { x: 0.74, y: 0.30 }, { x: 0.88, y: 0.32 }
		];
		var isoBranches = DE ? [
			{ atStep: 0, alternatives: [
				{ token: "Stadt", path: { x: 0.20, y: 0.22 }, entropy: 0.60 },
				{ token: "Regierung", path: { x: 0.20, y: 0.62 }, entropy: 0.55 }
			] },
			{ atStep: 1, alternatives: [
				{ token: "Frankreichs", path: { x: 0.32, y: 0.20 }, entropy: 0.50 },
				{ token: "war", path: { x: 0.32, y: 0.58 }, entropy: 0.45 }
			] },
			{ atStep: 2, alternatives: [
				{ token: "Deutschland", path: { x: 0.45, y: 0.16 }, entropy: 0.55 },
				{ token: "Italien", path: { x: 0.45, y: 0.54 }, entropy: 0.50 }
			] },
			{ atStep: 3, alternatives: [
				{ token: "war", path: { x: 0.58, y: 0.14 }, entropy: 0.45 },
				{ token: "bleibt", path: { x: 0.58, y: 0.50 }, entropy: 0.40 }
			] },
			{ atStep: 4, alternatives: [
				{ token: "Lyon", path: { x: 0.74, y: 0.13 }, entropy: 0.50 },
				{ token: "Marseille", path: { x: 0.74, y: 0.48 }, entropy: 0.45 }
			] },
			{ atStep: 5, alternatives: [
				{ token: ",", path: { x: 0.88, y: 0.15 }, entropy: 0.30 },
				{ token: "und", path: { x: 0.88, y: 0.49 }, entropy: 0.25 }
			] }
		] : [
			{ atStep: 0, alternatives: [
				{ token: "city", path: { x: 0.20, y: 0.22 }, entropy: 0.60 },
				{ token: "government", path: { x: 0.20, y: 0.62 }, entropy: 0.55 }
			] },
			{ atStep: 1, alternatives: [
				{ token: "city", path: { x: 0.32, y: 0.20 }, entropy: 0.50 },
				{ token: "was", path: { x: 0.32, y: 0.58 }, entropy: 0.45 }
			] },
			{ atStep: 2, alternatives: [
				{ token: "Germany", path: { x: 0.45, y: 0.16 }, entropy: 0.55 },
				{ token: "Italy", path: { x: 0.45, y: 0.54 }, entropy: 0.50 }
			] },
			{ atStep: 3, alternatives: [
				{ token: "was", path: { x: 0.58, y: 0.14 }, entropy: 0.45 },
				{ token: "remains", path: { x: 0.58, y: 0.50 }, entropy: 0.40 }
			] },
			{ atStep: 4, alternatives: [
				{ token: "Lyon", path: { x: 0.74, y: 0.13 }, entropy: 0.50 },
				{ token: "Marseille", path: { x: 0.74, y: 0.48 }, entropy: 0.45 }
			] },
			{ atStep: 5, alternatives: [
				{ token: ",", path: { x: 0.88, y: 0.15 }, entropy: 0.30 },
				{ token: "and", path: { x: 0.88, y: 0.49 }, entropy: 0.25 }
			] }
		];
		function isoAltLabel(token) {
			if (token === ",") return DE ? "Komma" : "comma";
			if (token === ".") return DE ? "Punkt" : "full stop";
			return token;
		}
		function drawIso(ctx, w, h) {
			var c = TM.colors();
			var pad = 30;
			var plotW = Math.max(40, w - pad * 2 - 24);
			var plotH = Math.max(40, h - pad * 2);
			function at(p) {
				return { x: pad + p.x * plotW, y: pad + p.y * plotH };
			}
			ctx.clearRect(0, 0, w, h);
			ctx.fillStyle = c.paper2;
			ctx.fillRect(0, 0, w, h);
			ctx.strokeStyle = c.line;
			ctx.lineWidth = 1;
			for (var gx = pad; gx < pad + plotW; gx += 40) {
				ctx.beginPath(); ctx.moveTo(gx, pad); ctx.lineTo(gx, pad + plotH); ctx.stroke();
			}
			for (var gy = pad; gy < pad + plotH; gy += 40) {
				ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(pad + plotW, gy); ctx.stroke();
			}
			ctx.beginPath();
			isoPath.forEach(function (p, i) {
				var q = at(p);
				if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
			});
			ctx.strokeStyle = c.lineStrong;
			ctx.lineWidth = 1;
			ctx.setLineDash([4, 8]);
			ctx.stroke();
			ctx.setLineDash([]);
			var step = Math.min(isoStep, isoTokens.length - 1);
			var baseWidth = Math.min(w, h) * 0.10;
			if (step >= 1) {
				var upper = [], lower = [];
				for (var i = 0; i <= step; i++) {
					var q = at(isoPath[i]);
					var env = isoEntropy[i] * isoTemp * baseWidth;
					var dx = 0, dy = -1;
					if (i < isoPath.length - 1) {
						var n = at(isoPath[i + 1]);
						var tx = n.x - q.x, ty = n.y - q.y, len = Math.hypot(tx, ty);
						if (len > 0) { dx = -ty / len; dy = tx / len; }
					} else if (i > 0) {
						var p = at(isoPath[i - 1]);
						var tx2 = q.x - p.x, ty2 = q.y - p.y, len2 = Math.hypot(tx2, ty2);
						if (len2 > 0) { dx = -ty2 / len2; dy = tx2 / len2; }
					}
					upper.push({ x: q.x + dx * env, y: q.y + dy * env });
					lower.push({ x: q.x - dx * env, y: q.y - dy * env });
				}
				for (var layer = 3; layer >= 0; layer--) {
					var scale = 1 + layer * 0.3;
					ctx.beginPath();
					upper.forEach(function (p, i2) {
						var q2 = at(isoPath[i2]);
						var x = q2.x + (p.x - q2.x) * scale, y = q2.y + (p.y - q2.y) * scale;
						if (i2 === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
					});
					for (var i3 = lower.length - 1; i3 >= 0; i3--) {
						var q3 = at(isoPath[i3]);
						var p3 = lower[i3];
						ctx.lineTo(q3.x + (p3.x - q3.x) * scale, q3.y + (p3.y - q3.y) * scale);
					}
					ctx.closePath();
					ctx.globalAlpha = 0.03 + (3 - layer) * 0.03;
					ctx.fillStyle = c.coral;
					ctx.fill();
					ctx.globalAlpha = 1;
				}
				ctx.beginPath();
				upper.forEach(function (p, i4) { if (i4 === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
				for (var i5 = lower.length - 1; i5 >= 0; i5--) ctx.lineTo(lower[i5].x, lower[i5].y);
				ctx.closePath();
				ctx.fillStyle = c.coral;
				ctx.globalAlpha = 0.08;
				ctx.fill();
				ctx.globalAlpha = 0.35;
				ctx.strokeStyle = c.coral;
				ctx.lineWidth = 1.5;
				ctx.stroke();
				ctx.globalAlpha = 1;
			}
			isoBranches.forEach(function (branch) {
				if (step < branch.atStep) return;
				var origin = at(isoPath[branch.atStep]);
				branch.alternatives.forEach(function (alt) {
					var target = at(alt.path);
					var env = Math.max(6, alt.entropy * isoTemp * baseWidth * 0.6);
					ctx.beginPath();
					ctx.moveTo(origin.x, origin.y);
					ctx.lineTo(target.x, target.y);
					ctx.strokeStyle = c.gold;
					ctx.globalAlpha = 0.35;
					ctx.lineWidth = 1.5;
					ctx.setLineDash([3, 5]);
					ctx.stroke();
					ctx.setLineDash([]);
					ctx.globalAlpha = 1;
					ctx.beginPath();
					ctx.arc(target.x, target.y, env, 0, Math.PI * 2);
					ctx.fillStyle = c.gold;
					ctx.globalAlpha = 0.06;
					ctx.fill();
					ctx.globalAlpha = 0.3;
					ctx.strokeStyle = c.gold;
					ctx.stroke();
					ctx.globalAlpha = 1;
					ctx.font = "11px " + (getComputedStyle(document.documentElement).getPropertyValue("--tm-ui") || "system-ui");
					ctx.textAlign = "center";
					ctx.fillStyle = c.gold;
					ctx.fillText(isoAltLabel(alt.token), target.x, target.y - env - 6);
				});
			});
			if (step >= 1) {
				ctx.beginPath();
				for (var s = 0; s <= step; s++) { var qs = at(isoPath[s]); if (s === 0) ctx.moveTo(qs.x, qs.y); else ctx.lineTo(qs.x, qs.y); }
				ctx.strokeStyle = c.blue;
				ctx.lineWidth = 2.5;
				ctx.stroke();
			}
			for (var n2 = 0; n2 <= step; n2++) {
				var q4 = at(isoPath[n2]);
				var ent = isoEntropy[n2];
				var radius = 5 + ent * isoTemp * 4;
				var fill = ent < 0.3 ? c.green : ent < 0.6 ? c.gold : c.coral;
				ctx.beginPath();
				ctx.arc(q4.x, q4.y, radius, 0, Math.PI * 2);
				ctx.fillStyle = fill;
				ctx.fill();
				ctx.strokeStyle = c.card;
				ctx.lineWidth = 2;
				ctx.stroke();
				ctx.font = "700 12px " + (getComputedStyle(document.documentElement).getPropertyValue("--tm-ui") || "system-ui");
				ctx.textAlign = "center";
				ctx.fillStyle = c.ink;
				ctx.fillText(isoTokens[n2], q4.x, q4.y - radius - 8);
			}
			for (var f = step + 1; f < isoTokens.length; f++) {
				var q5 = at(isoPath[f]);
				ctx.beginPath();
				ctx.arc(q5.x, q5.y, 3, 0, Math.PI * 2);
				ctx.fillStyle = c.muted;
				ctx.globalAlpha = 0.25;
				ctx.fill();
				ctx.globalAlpha = 0.35;
				ctx.font = "10px " + (getComputedStyle(document.documentElement).getPropertyValue("--tm-ui") || "system-ui");
				ctx.textAlign = "center";
				ctx.fillStyle = c.muted;
				ctx.fillText(isoTokens[f], q5.x, q5.y - 10);
				ctx.globalAlpha = 1;
			}
			var barX = w - 36, barY = 40, barW = 12, barH = h - 86;
			if (barH > 40) {
				var grad = ctx.createLinearGradient(0, barY, 0, barY + barH);
				grad.addColorStop(0, c.blue);
				grad.addColorStop(0.5, c.coral);
				grad.addColorStop(1, c.gold);
				ctx.fillStyle = grad;
				ctx.fillRect(barX, barY, barW, barH);
				var eff = Math.min(1, isoEntropy[step] * isoTemp);
				var markerY = barY + (1 - eff) * barH;
				ctx.beginPath();
				ctx.moveTo(barX - 7, markerY);
				ctx.lineTo(barX, markerY - 4);
				ctx.lineTo(barX, markerY + 4);
				ctx.closePath();
				ctx.fillStyle = c.ink;
				ctx.fill();
				ctx.beginPath();
				ctx.moveTo(barX, markerY);
				ctx.lineTo(barX + barW, markerY);
				ctx.strokeStyle = c.ink;
				ctx.lineWidth = 2;
				ctx.stroke();
				ctx.font = "9px " + (getComputedStyle(document.documentElement).getPropertyValue("--tm-ui") || "system-ui");
				ctx.textAlign = "center";
				ctx.fillStyle = c.muted;
				ctx.fillText(isoLabels.certainAxis, barX + barW / 2, barY - 8);
				ctx.fillText(isoLabels.openAxis, barX + barW / 2, barY + barH + 14);
				ctx.font = "700 10px " + (getComputedStyle(document.documentElement).getPropertyValue("--tm-ui") || "system-ui");
				ctx.textAlign = "left";
				ctx.fillStyle = c.ink;
				ctx.fillText("H=" + eff.toFixed(2), barX + barW + 6, markerY + 4);
			}
			ctx.font = "11px " + (getComputedStyle(document.documentElement).getPropertyValue("--tm-ui") || "system-ui");
			ctx.textAlign = "left";
			ctx.fillStyle = c.muted;
			ctx.fillText("T = " + isoTemp.toFixed(2), 12, 20);
			updateIsoSide();
		}
		function updateIsoSide() {
			var step = Math.min(isoStep, isoTokens.length - 1);
			var isEnd = step >= isoTokens.length - 1;
			var nextWord = isEnd ? "|endoftext|" : isoTokens[step + 1];
			var entropy = isEnd ? 0.02 : isoEntropy[step + 1];
			var eff = Math.min(1, entropy * isoTemp);
			if (isoNextEl) {
				isoNextEl.textContent = nextWord;
				isoNextEl.classList.toggle("is-end", isEnd);
			}
			if (isoAltEl) {
				var branch = null;
				for (var bi = 0; bi < isoBranches.length; bi++) {
					if (isoBranches[bi].atStep === step) { branch = isoBranches[bi]; break; }
				}
				if (!isEnd && branch) {
					isoAltEl.textContent = (DE ? "Auch möglich: " : "Also possible: ") + branch.alternatives.map(function (a) { return isoAltLabel(a.token); }).join(", ");
				} else {
					isoAltEl.textContent = "";
				}
			}
			if (isoTempOut) isoTempOut.textContent = isoTemp.toFixed(2);
			if (!isoMetaEl) return;
			var label = isoLabels.certain, cls = "is-certain";
			if (!isEnd) {
				if (eff >= 0.6) { label = isoLabels.wide; cls = "is-wide"; }
				else if (eff >= 0.35) { label = isoLabels.open; cls = "is-open"; }
				else if (eff >= 0.12) { label = isoLabels.likely; cls = "is-likely"; }
			}
			isoMetaEl.innerHTML = '<span class="iso-badge ' + cls + '">' + label + '</span>'
				+ '<div style="margin-top:.55em">' + isoLabels.width + ' <b>' + eff.toFixed(2) + '</b></div>';
		}
		if (isoCanvas) {
			isoApi = TM.initCanvas(isoCanvas, drawIso);
			if (isoTempEl) {
				isoTempEl.addEventListener("input", function () {
					isoTemp = parseFloat(isoTempEl.value) || 0.8;
					if (isoApi) isoApi.redraw();
				});
			}
			if (isoAdvance) {
				isoAdvance.addEventListener("click", function () {
					isoStep = (isoStep + 1) % isoTokens.length;
					if (isoApi) isoApi.redraw();
				});
			}
			window.addEventListener("tm:theme", function () { if (isoApi) isoApi.redraw(); });
			updateIsoSide();
		}

		/* ── tokens ──────────────────────────────────────────── */
		var tokVocab = {
			once: 1024, upon: 2048, a: 64, time: 3072, the: 128, there: 2560,
			was: 512, dragon: 5120, under: 6001, standing: 6002, un: 7001,
			break: 7002, able: 7003, hello: 8001, world: 8002, cat: 9001,
			sat: 9002, on: 9003, mat: 9004, is: 256, good: 3500, great: 3501,
			big: 3502, small: 3503, happy: 3600, sad: 3601, love: 3700,
			play: 7010, ing: 7011, ed: 7012, er: 7013, ly: 7014, pre: 7020,
			dict: 7021, ion: 7022, trans: 7030, form: 7031, i: 40, you: 41,
			he: 42, she: 43, it: 44, we: 45, they: 46, my: 47, your: 48,
			his: 49, her: 50, this: 51, that: 52, with: 53, for: 54, not: 55,
			but: 56, and: 57, or: 58, in: 59, to: 60, of: 61, at: 62,
			by: 63, from: 65, up: 66, about: 67, into: 68, over: 69, after: 70,
			ver: 7040, ständ: 7041, nis: 7042, zerbrech: 7043, lich: 7044,
			spiel: 7045, t: 7046, groß: 7047, artig: 7048, der: 7049
		};
		var tokSplit = {
			understanding: ["under", "standing"],
			unbreakable: ["un", "break", "able"],
			prediction: ["pre", "dict", "ion"],
			transformer: ["trans", "form", "er"],
			playing: ["play", "ing"],
			played: ["play", "ed"],
			player: ["play", "er"],
			greatly: ["great", "ly"],
			verständnis: ["ver", "ständ", "nis"],
			unzerbrechlich: ["un", "zerbrech", "lich"],
			spielt: ["spiel", "t"],
			großartig: ["groß", "artig"]
		};
		var tokColors = ["#63a44b", "#5c9baf", "#9f9700", "#9185be", "#869b55", "#1275ac", "#009299", "#92a19a"];
		var tokExamples = DE ? {
			understanding: { label: "Verständnis", value: "Verständnis" },
			unbreakable: { label: "unzerbrechlich", value: "unzerbrechlich" },
			sentence: { label: "Der Transformer spielt großartig", value: "Der Transformer spielt großartig" }
		} : {
			understanding: { label: "understanding", value: "understanding" },
			unbreakable: { label: "unbreakable", value: "unbreakable" },
			sentence: { label: "The transformer is playing greatly", value: "The transformer is playing greatly" }
		};
		var tokValue = tokExamples.sentence.value;
		function idFor(word) {
			var h = 0;
			for (var i = 0; i < word.length; i++) h = (h * 31 + word.charCodeAt(i)) % 50000;
			return 10000 + h;
		}
		function greedyPieces(word) {
			var out = [];
			var i = 0;
			while (i < word.length) {
				var best = null;
				for (var len = Math.min(8, word.length - i); len >= 2; len--) {
					var sub = word.slice(i, i + len);
					if (tokVocab[sub] != null) { best = sub; break; }
				}
				if (!best) best = word.charAt(i);
				out.push(best);
				i += best.length;
			}
			return out;
		}
		function tokenize(text) {
			var pieces = text.split(/(\s+|[.,!?;:])/).filter(function (p) { return p.length; });
			var tokens = [];
			pieces.forEach(function (piece) {
				if (/^\s+$/.test(piece)) {
					tokens.push({ word: "␣".repeat(Math.min(3, piece.length)), id: 220, space: true });
					return;
				}
				if (/^[.,!?;:]$/.test(piece)) {
					tokens.push({ word: piece, id: tokVocab[piece] || idFor(piece) });
					return;
				}
				var word = piece.toLowerCase();
				var parts = tokSplit[word] || (tokVocab[word] != null ? [word] : greedyPieces(word));
				parts.forEach(function (part, idx) {
					tokens.push({
						word: part,
						id: tokVocab[part] != null ? tokVocab[part] : idFor(part),
						sub: idx > 0
					});
				});
			});
			return tokens;
		}
		function renderTokens() {
			var out = document.getElementById("itok-out");
			var stats = document.getElementById("itok-stats");
			if (!out) return;
			var tokens = tokenize(tokValue);
			out.innerHTML = tokens.map(function (tok, i) {
				return '<div class="token-chip' + (tok.sub ? " is-sub" : "") + (tok.space ? " is-space" : "") +
					'" style="border-left-color:' + tokColors[i % tokColors.length] + '">' +
					'<span class="tc-word">' + escapeHtml(tok.word) + '</span>' +
					'<span class="tc-id">id ' + tok.id + '</span></div>';
			}).join("");
			if (stats) {
				var spaces = tokens.filter(function (t) { return t.space; }).length;
				var subs = tokens.filter(function (t) { return t.sub; }).length;
				var words = tokens.length - spaces;
				stats.innerHTML =
					'<div><b>Tokens</b><span>' + tokens.length + '</span></div>' +
					'<div><b>Pieces</b><span>' + words + '</span></div>' +
					'<div><b>Subword splits</b><span>' + subs + '</span></div>' +
					'<div><b>Whitespace</b><span>' + spaces + '</span></div>';
			}
		}
		var tokButtons = document.querySelectorAll("[data-tok]");
		tokButtons.forEach(function (btn) {
			var key = btn.getAttribute("data-tok");
			var example = tokExamples[key];
			if (!example) return;
			btn.textContent = example.label;
			btn.classList.toggle("is-on", key === "sentence");
			btn.addEventListener("click", function () {
				tokValue = example.value;
				tokButtons.forEach(function (b) { b.classList.remove("is-on"); });
				btn.classList.add("is-on");
				renderTokens();
			});
		});
		renderTokens();

		/* ── embedding ───────────────────────────────────────── */
		var embSpace = {
			Man: [5, -10], Woman: [5, 10], Male: [0, -20], Female: [0, 20],
			Prince: [15, -10], Princess: [15, 10], King: [25, -10], Queen: [25, 10],
			Power: [10, 0]
		};
		var embRange = { x0: -5, x1: 40, y0: -30, y1: 30 };
		var embCanvas = document.getElementById("iemb-canvas");
		var embOut = document.getElementById("iemb-out");
		var embDirMode = null;
		var embResult = null;
		var embHover = null;
		var embApi = null;
		var embFormula = document.getElementById("iemb-formula");
		function evalEmb(expr) {
			var toks = expr.match(/[A-Za-z]+|\d+|[+\-*()/]/g) || [];
			var i = 0;
			function factor() {
				var t = toks[i++];
				if (t === "(") { var v = expression(); if (toks[i] === ")") i++; return v; }
				if (/^\d+$/.test(t)) return { kind: "num", n: parseInt(t, 10) };
				var norm = Object.keys(embSpace).find(function (w) { return w.toLowerCase() === t.toLowerCase(); });
				if (norm) return { kind: "vec", v: embSpace[norm].slice() };
				return { kind: "num", n: 0 };
			}
			function term() {
				var left = factor();
				while (toks[i] === "*" || toks[i] === "/") {
					var op = toks[i++];
					var right = factor();
					if (left.kind === "num" && right.kind === "num") {
						left.n = op === "*" ? left.n * right.n : (right.n ? left.n / right.n : 0);
					} else if (left.kind === "vec" && right.kind === "num") {
						var s = op === "*" ? right.n : (right.n ? 1 / right.n : 0);
						left.v = left.v.map(function (x) { return x * s; });
					} else if (left.kind === "num" && right.kind === "vec" && op === "*") {
						left = { kind: "vec", v: right.v.map(function (x) { return x * left.n; }) };
					}
				}
				return left;
			}
			function expression() {
				var sign = 1;
				if (toks[i] === "+") i++;
				else if (toks[i] === "-") { i++; sign = -1; }
				var left = term();
				if (left.kind === "num") left.n *= sign;
				else left.v = left.v.map(function (x) { return x * sign; });
				while (toks[i] === "+" || toks[i] === "-") {
					var op = toks[i++];
					var right = term();
					if (op === "-") {
						if (right.kind === "num") right.n = -right.n;
						else right.v = right.v.map(function (x) { return -x; });
					}
					if (left.kind === "num" && right.kind === "num") left.n += right.n;
					else if (left.kind === "vec" && right.kind === "vec") left.v = [left.v[0] + right.v[0], left.v[1] + right.v[1]];
					else if (left.kind === "vec" && right.kind === "num") left.v = left.v.map(function (x) { return x + right.n; });
					else if (left.kind === "num" && right.kind === "vec") left = { kind: "vec", v: right.v.map(function (x) { return x + left.n; }) };
				}
				return left;
			}
			return expression();
		}
		function embSteps(expr) {
			var toks = expr.match(/[A-Za-z]+|\d+|[+\-*()/]/g) || [];
			var pos = null, sign = 1, mult = 1, steps = [];
			toks.forEach(function (t) {
				if (t === "+") { sign = 1; return; }
				if (t === "-") { sign = -1; return; }
				if (t === "*") return;
				if (/^\d+$/.test(t)) { mult = parseInt(t, 10); return; }
				var norm = Object.keys(embSpace).find(function (w) { return w.toLowerCase() === t.toLowerCase(); });
				if (!norm) return;
				var v = embSpace[norm];
				var next = pos
					? [pos[0] + sign * mult * v[0], pos[1] + sign * mult * v[1]]
					: [sign * mult * v[0], sign * mult * v[1]];
				if (pos) steps.push({ from: pos.slice(), to: next.slice(), label: (sign > 0 ? "+ " : "− ") + norm });
				pos = next;
				sign = 1;
				mult = 1;
			});
			return { pos: pos, steps: steps };
		}
		function embHideFormula() {
			if (!embFormula) return;
			embFormula.removeAttribute("data-tex");
			embFormula.removeAttribute("data-tex-rendered");
			embFormula.innerHTML = "";
		}
		function embTex(expr) {
			var toks = expr.match(/[A-Za-z]+|\d+|[+\-*()/]/g) || [];
			var sign = 1, coef = 1, terms = [], bad = false;
			toks.forEach(function (t) {
				if (bad) return;
				if (t === "+") { sign = 1; return; }
				if (t === "-") { sign = -1; return; }
				if (t === "*") return;
				if (t === "/" || t === "(" || t === ")") { bad = true; return; }
				if (/^\d+$/.test(t)) { coef = parseInt(t, 10); return; }
				var norm = Object.keys(embSpace).find(function (w) { return w.toLowerCase() === t.toLowerCase(); });
				if (!norm) { bad = true; return; }
				terms.push({ sign: sign, coef: coef, word: norm });
				sign = 1;
				coef = 1;
			});
			var ev = evalEmb(expr);
			if (bad || !terms.length || !ev || ev.kind !== "vec") return "";
			var lhs = "";
			terms.forEach(function (term, idx) {
				var v = embSpace[term.word];
				var cell = "\\underbrace{\\begin{pmatrix}" + v[0] + "\\\\" + v[1] + "\\end{pmatrix}}_{\\text{" + embLabel(term.word) + "}}";
				if (term.coef !== 1) cell = term.coef + "\\cdot " + cell;
				if (idx === 0) lhs += (term.sign < 0 ? "-" : "") + cell;
				else lhs += " " + (term.sign < 0 ? "-" : "+") + " " + cell;
			});
			var near = embNearest(ev.v);
			return "\\begin{aligned} \\underbrace{" + lhs + "}_{\\text{" + (DE ? "Summe der Vektoren" : "sum of the vectors") + "}} &= \\begin{pmatrix}" + ev.v[0].toFixed(0) + "\\\\" + ev.v[1].toFixed(0) + "\\end{pmatrix} \\\\ &= \\underbrace{x_{\\text{" + embLabel(near.word) + "}}}_{\\text{" + (DE ? "Ergebnis" : "result") + "}} \\end{aligned}";
		}
		function embNearest(pos) {
			var best = null, bd = Infinity;
			Object.keys(embSpace).forEach(function (w) {
				var v = embSpace[w];
				var d = Math.hypot(pos[0] - v[0], pos[1] - v[1]);
				if (d < bd) { bd = d; best = w; }
			});
			return { word: best, dist: bd };
		}
		function embLabel(word) {
			if (!DE) return word;
			return ({
				Man: "Mann", Woman: "Frau", Male: "männlich", Female: "weiblich",
				Prince: "Prinz", Princess: "Prinzessin", King: "König", Queen: "Königin", Power: "Macht"
			})[word] || word;
		}
		function embDefault() {
			return DE
				? 'Der Raum hat in dieser Demo zwei semantische Achsen: <b>Macht</b> und <b>Geschlecht</b>. Wähle ein Beispiel, um zu sehen, wo es landet.'
				: 'The space has two semantic axes in this demo: <b>power</b> and <b>gender</b>. Choose an example to see where it lands.';
		}
		function embDirText(mode) {
			if (mode === "gender") return DE
				? 'Die <b>Geschlechtsrichtung</b> (grün) ist dieselbe von Mann zu Frau und von König zu Königin. Sie ist eine gelernte Richtung, keine benannte Achse.'
				: 'The <b>gender</b> direction (green) is the same from man to woman and from king to queen. It is a learned direction, not a named axis.';
			if (mode === "power") return DE
				? 'Die <b>Machtrichtung</b> (gold) ist dieselbe entlang Mann → Prinz → König und Frau → Prinzessin → Königin. Das Modell lernt sie aus den Daten.'
				: 'The <b>power</b> direction (gold) is the same along man → prince → king and woman → princess → queen. The model learns it from the data.';
			return DE
				? 'Die <b>Geschlechtsrichtung</b> (grün) ist dieselbe von Mann zu Frau und von König zu Königin. Die <b>Machtrichtung</b> (gold) ist dieselbe entlang Mann → Prinz → König. Bedeutung lebt in Positionen und Richtungen.'
				: 'The <b>gender</b> arrow (green) is the same from man to woman and from king to queen. The <b>power</b> arrow (gold) is the same along man → prince → king. Meaning lives in positions and in directions.';
		}
		function embDirTex(mode) {
			function vec(word) {
				return "\\vec{x}_{\\text{" + embLabel(word) + "}}";
			}
			function join(lines) {
				if (lines.length === 1) return lines[0];
				return "\\begin{aligned}" + lines.join(" \\\\ ") + "\\end{aligned}";
			}
			function equation(kind) {
				if (kind === "gender") {
					return "\\underbrace{\\underbrace{" + vec("Woman") + " - " + vec("Man") + "}_{\\text{" +
						(DE ? "Schritt von Mann zu Frau" : "step from man to woman") + "}} = " +
						"\\underbrace{" + vec("Queen") + " - " + vec("King") + "}_{\\text{" +
						(DE ? "Schritt von König zu Königin" : "step from king to queen") + "}}}_{\\text{" +
						(DE ? "dieselbe Geschlechtsrichtung" : "the same gender direction") + "}}";
				}
				return "\\underbrace{\\underbrace{" + vec("Prince") + " - " + vec("Man") + "}_{\\text{" +
					(DE ? "ein Machtschritt" : "one power step") + "}} = " +
					"\\underbrace{" + vec("King") + " - " + vec("Prince") + "}_{\\text{" +
					(DE ? "noch ein Machtschritt" : "another power step") + "}}}_{\\text{" +
					(DE ? "dieselbe Machtrichtung" : "the same power direction") + "}}";
			}
			if (mode === "gender") return equation("gender");
			if (mode === "power") return equation("power");
			return join([equation("gender"), equation("power")]);
		}
		var embProbe = null;
		var embMeasureTimer = null;
		function embProbeEl() {
			if (embProbe) return embProbe;
			if (!embFormula || !embFormula.parentNode) return null;
			embProbe = document.createElement("div");
			embProbe.className = "prose-math emb-equation emb-formula emb-formula--probe";
			embProbe.setAttribute("aria-hidden", "true");
			embFormula.parentNode.insertBefore(embProbe, embFormula.nextSibling);
			return embProbe;
		}
		function embMeasureFormula() {
			if (!embFormula || !window.temml) return;
			var width = embFormula.getBoundingClientRect().width;
			var probe = embProbeEl();
			if (!width || !probe) return;
			probe.style.width = width + "px";
			var expressions = ["King - Man + Woman", "Man + 2 * Power", "Prince + Power"];
			var texs = expressions.map(embTex).filter(Boolean);
			texs.push(embDirTex("gender"), embDirTex("power"), embDirTex("all"));
			var tallest = 0;
			texs.forEach(function (tex) {
				try {
					probe.innerHTML = temml.renderToString(tex, { displayMode: true });
					tallest = Math.max(tallest, probe.getBoundingClientRect().height);
				} catch (e) {}
			});
			probe.innerHTML = "";
			if (tallest > 0) embFormula.style.minHeight = Math.ceil(tallest) + "px";
		}
		function embSetFormula(tex) {
			if (!embFormula) return;
			if (!tex) {
				embHideFormula();
				return;
			}
			embFormula.setAttribute("data-tex", tex);
			embFormula.removeAttribute("data-tex-rendered");
			TM.typesetMath(embFormula.parentNode);
		}
		function drawEmb(ctx, w, h) {
			var c = TM.colors();
			var pad = 44;
			function mx(x) { return pad + (x - embRange.x0) / (embRange.x1 - embRange.x0) * (w - pad * 2); }
			function my(y) { return h - pad - (y - embRange.y0) / (embRange.y1 - embRange.y0) * (h - pad * 2); }
			ctx.clearRect(0, 0, w, h);
			ctx.strokeStyle = c.dark ? "rgba(238,247,244,.08)" : "rgba(0,75,111,.09)";
			ctx.lineWidth = 1;
			for (var gx = -0; gx <= 40; gx += 10) {
				ctx.beginPath(); ctx.moveTo(mx(gx), my(embRange.y0)); ctx.lineTo(mx(gx), my(embRange.y1)); ctx.stroke();
			}
			for (var gy = -30; gy <= 30; gy += 10) {
				ctx.beginPath(); ctx.moveTo(mx(embRange.x0), my(gy)); ctx.lineTo(mx(embRange.x1), my(gy)); ctx.stroke();
			}
			ctx.fillStyle = c.muted;
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.textAlign = "left";
			ctx.fillText((DE ? "Macht" : "Power") + " →", mx(embRange.x1) - 52, my(0) - 8);
			ctx.save();
			ctx.translate(mx(0) - 8, my(embRange.y0) + 40);
			ctx.rotate(-Math.PI / 2);
			ctx.fillText((DE ? "Geschlecht" : "Gender") + " →", 0, 0);
			ctx.restore();

			var highlighted = ["man", "woman", "prince", "king"];
			var palette = ["#63a44b", "#5c9baf", "#9f9700", "#9185be", "#869b55", "#009299"];
			Object.keys(embSpace).forEach(function (word) {
				var v = embSpace[word];
				var hi = highlighted.indexOf(word.toLowerCase()) !== -1;
				var idx = highlighted.indexOf(word.toLowerCase());
				var color = hi ? palette[idx % palette.length] : (c.dark ? "rgba(238,247,244,.35)" : "rgba(18,38,45,.32)");
				var x = mx(v[0]), y = my(v[1]);
				ctx.beginPath();
				ctx.arc(x, y, hi ? 6 : 3.5, 0, Math.PI * 2);
				ctx.fillStyle = color;
				ctx.fill();
				if (hi) {
					ctx.strokeStyle = c.card;
					ctx.lineWidth = 2;
					ctx.stroke();
				}
				ctx.font = (hi ? "700 12px" : "500 10px") + " Barlow, system-ui, sans-serif";
				ctx.fillStyle = hi ? color : (c.dark ? "rgba(238,247,244,.42)" : "rgba(18,38,45,.45)");
				ctx.textAlign = "center";
				ctx.fillText(embLabel(word), x, y - 11);
				if (word === embHover) {
					ctx.font = "600 10px Barlow, system-ui, sans-serif";
					ctx.fillStyle = c.muted;
					ctx.fillText("(" + v[0] + ", " + v[1] + ")", x, y + 18);
				}
			});

			if (embDirMode) {
				function arrow(a, b, color, label) {
					ctx.beginPath();
					ctx.moveTo(mx(a[0]), my(a[1]));
					ctx.lineTo(mx(b[0]), my(b[1]));
					ctx.strokeStyle = color;
					ctx.lineWidth = 2;
					ctx.stroke();
					var ang = Math.atan2(my(b[1]) - my(a[1]), mx(b[0]) - mx(a[0]));
					ctx.beginPath();
					ctx.moveTo(mx(b[0]), my(b[1]));
					ctx.lineTo(mx(b[0]) - 7 * Math.cos(ang - 0.4), my(b[1]) - 7 * Math.sin(ang - 0.4));
					ctx.lineTo(mx(b[0]) - 7 * Math.cos(ang + 0.4), my(b[1]) - 7 * Math.sin(ang + 0.4));
					ctx.closePath();
					ctx.fillStyle = color;
					ctx.fill();
					if (label) {
						var ax = mx(a[0]), ay = my(a[1]), bx = mx(b[0]), by = my(b[1]);
						var dx = bx - ax, dy = by - ay;
						var len = Math.hypot(dx, dy) || 1;
						var lx = (ax + bx) / 2 - dy / len * 12;
						var ly = (ay + by) / 2 + dx / len * 12;
						ctx.font = "700 10px Barlow, system-ui, sans-serif";
						var tw = ctx.measureText(label).width;
						ctx.fillStyle = c.dark ? "rgba(4,34,46,.84)" : "rgba(255,255,255,.92)";
						TM.roundRect(ctx, lx - tw / 2 - 5, ly - 9, tw + 10, 15, 7);
						ctx.fill();
						ctx.fillStyle = color;
						ctx.textAlign = "center";
						ctx.fillText(label, lx, ly + 2);
					}
				}
				var green = c.dark ? "#869b55" : "#63a44b";
				var gold = "#9f9700";
				if (embDirMode === "gender" || embDirMode === "all") {
					arrow(embSpace.Man, embSpace.Woman, green, DE ? "Geschlecht" : "gender");
					arrow(embSpace.King, embSpace.Queen, green, "");
				}
				if (embDirMode === "power" || embDirMode === "all") {
					arrow(embSpace.Man, embSpace.Prince, gold, DE ? "mehr Macht" : "more power");
					arrow(embSpace.Prince, embSpace.King, gold, "");
					arrow(embSpace.Woman, embSpace.Princess, gold, "");
					arrow(embSpace.Princess, embSpace.Queen, gold, "");
				}
				if (embOut) embOut.innerHTML = embDirText(embDirMode);
				return;
			}

			if (embResult) {
				embResult.steps.forEach(function (step) {
					ctx.setLineDash([4, 4]);
					ctx.beginPath();
					ctx.moveTo(mx(step.from[0]), my(step.from[1]));
					ctx.lineTo(mx(step.to[0]), my(step.to[1]));
					ctx.strokeStyle = c.dark ? "rgba(134, 155, 85, .55)" : "rgba(0, 75, 111, .55)";
					ctx.lineWidth = 1.6;
					ctx.stroke();
					ctx.setLineDash([]);
				});
				var p = embResult.pos;
				ctx.beginPath();
				ctx.moveTo(mx(p[0]) - 6, my(p[1]));
				ctx.lineTo(mx(p[0]), my(p[1]) - 6);
				ctx.lineTo(mx(p[0]) + 6, my(p[1]));
				ctx.lineTo(mx(p[0]), my(p[1]) + 6);
				ctx.closePath();
				ctx.fillStyle = c.dark ? "#9185be" : "#9f9700";
				ctx.fill();
				ctx.strokeStyle = c.card;
				ctx.lineWidth = 2;
				ctx.stroke();
				ctx.font = "700 11px Barlow, system-ui, sans-serif";
				ctx.fillStyle = c.dark ? "#9f9700" : "#004b6f";
				ctx.textAlign = "center";
				ctx.fillText("≈ " + embLabel(embResult.nearest), mx(p[0]), my(p[1]) + 20);
			}
		}
		function updateEmb(expr) {
			var ev = evalEmb(expr);
			embDirMode = null;
			if (!ev || ev.kind !== "vec") {
				embResult = null;
				if (embOut) embOut.innerHTML = '<b>Invalid expression.</b> Try “King − Man + Woman”.';
			} else {
				var near = embNearest(ev.v);
				var steps = embSteps(expr);
				embResult = { pos: ev.v, nearest: near.word, steps: steps.steps };
				if (embOut) embOut.innerHTML = '→ <b>(' + ev.v[0].toFixed(1) + ', ' + ev.v[1].toFixed(1) + ')</b> · ' + (DE ? 'nächstes Wort' : 'nearest word') + ': <b>' + embLabel(near.word) + '</b> (' + (DE ? 'Abstand ' : 'distance ') + near.dist.toFixed(2) + ')';
			}
			if (embFormula) {
				var tex = ev && ev.kind === "vec" ? embTex(expr) : "";
				embSetFormula(tex);
			}
			if (embApi) embApi.redraw();
		}
		if (embCanvas) {
			embApi = TM.initCanvas(embCanvas, drawEmb);
			embCanvas.addEventListener("pointermove", function (event) {
				var rect = embCanvas.getBoundingClientRect();
				var pad = 44;
				function px(x) { return pad + (x - embRange.x0) / (embRange.x1 - embRange.x0) * (rect.width - pad * 2); }
				function py(y) { return rect.height - pad - (y - embRange.y0) / (embRange.y1 - embRange.y0) * (rect.height - pad * 2); }
				var mxp = event.clientX - rect.left;
				var myp = event.clientY - rect.top;
				var best = null;
				var bestDist = 16;
				Object.keys(embSpace).forEach(function (word) {
					var v = embSpace[word];
					var d = Math.hypot(px(v[0]) - mxp, py(v[1]) - myp);
					if (d < bestDist) { bestDist = d; best = word; }
				});
				if (best !== embHover) {
					embHover = best;
					if (embApi) embApi.redraw();
				}
			});
			embCanvas.addEventListener("pointerleave", function () {
				if (embHover) {
					embHover = null;
					if (embApi) embApi.redraw();
				}
			});
			document.querySelectorAll("[data-emb]").forEach(function (btn) {
				btn.addEventListener("click", function () {
					var expr = btn.getAttribute("data-emb");
					if (btn.classList.contains("is-on")) {
						btn.classList.remove("is-on");
						embDirMode = null;
						embResult = null;
						if (embOut) embOut.innerHTML = embDefault();
						embHideFormula();
						if (embApi) embApi.redraw();
						return;
					}
					document.querySelectorAll("[data-emb]").forEach(function (b) { b.classList.remove("is-on"); });
					btn.classList.add("is-on");
					if (expr === "directions" || expr === "gender" || expr === "power") {
						embDirMode = expr === "directions" ? "all" : expr;
						embResult = null;
						if (embOut) embOut.innerHTML = embDirText(embDirMode);
						embSetFormula(embDirTex(embDirMode));
						if (embApi) embApi.redraw();
					} else {
						updateEmb(expr);
					}
				});
			});
			updateEmb("King - Man + Woman");
			embMeasureFormula();
			window.addEventListener("resize", function () {
				clearTimeout(embMeasureTimer);
				embMeasureTimer = setTimeout(embMeasureFormula, 160);
			});
			if (document.fonts && document.fonts.ready) {
				document.fonts.ready.then(function () { embMeasureFormula(); });
			}
		}

		/* ── position heatmap ───────────────────────────────── */
		var heatCanvas = document.getElementById("ipe-heatmap");
		var heatOut = document.getElementById("ipe-heat-out");
		var heatApi = null;
		var heatCount = 64;
		var heatDims = 24;
		var HEAT_D_MODEL = 64;
		function heatValue(position, dim) {
			var pair = Math.floor(dim / 2) * 2;
			var denom = Math.pow(10000, pair / HEAT_D_MODEL);
			return dim % 2 === 0 ? Math.sin(position / denom) : Math.cos(position / denom);
		}
		function heatColor(v, c) {
			var a = Math.pow(Math.min(1, Math.abs(v)), 0.6);
			var neutral = c.dark ? [30, 58, 74] : [226, 232, 240];
			var target = hexToRgb(v >= 0 ? c.green : c.coral);
			var r = Math.round(neutral[0] + (target[0] - neutral[0]) * a);
			var g = Math.round(neutral[1] + (target[1] - neutral[1]) * a);
			var b = Math.round(neutral[2] + (target[2] - neutral[2]) * a);
			return "rgb(" + r + "," + g + "," + b + ")";
		}
		function drawHeat(ctx, w, h) {
			var c = TM.colors();
			var dpr = (ctx.getTransform && ctx.getTransform().a) || 1;
			function edge(v) { return Math.round(v * dpr) / dpr; }
			var padL = 38, padR = 10, padT = 8;
			var heatH = Math.round(h * 0.64);
			var heatW = w - padL - padR;
			var cw = heatW / heatCount;
			var ch = heatH / heatDims;
			var stats = [];
			for (var sd = 0; sd < heatDims; sd++) {
				var vals = [];
				for (var sp = 0; sp < heatCount; sp++) vals.push(heatValue(sp, sd));
				var mean = vals.reduce(function (a, b) { return a + b; }, 0) / heatCount;
				var maxDev = Math.max.apply(null, vals.map(function (v) { return Math.abs(v - mean); })) || 1;
				stats.push({ mean: mean, maxDev: maxDev });
			}
			function cellT(position, dim) {
				return (heatValue(position, dim) - stats[dim].mean) / stats[dim].maxDev;
			}
			ctx.clearRect(0, 0, w, h);
			ctx.strokeStyle = c.dark ? "rgba(238,247,244,.18)" : "rgba(0,75,111,.18)";
			ctx.lineWidth = 1;
			ctx.strokeRect(padL, padT, heatW, heatH);
			for (var p = 0; p < heatCount; p++) {
				var x0 = edge(padL + p * cw);
				var x1 = edge(padL + (p + 1) * cw);
				for (var d = 0; d < heatDims; d++) {
					var v = cellT(p, d);
					var y0 = edge(padT + d * ch);
					var y1 = edge(padT + (d + 1) * ch);
					ctx.fillStyle = heatColor(v, c);
					ctx.fillRect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
				}
			}
			ctx.fillStyle = c.muted;
			ctx.font = "500 9px Barlow, system-ui, sans-serif";
			ctx.textAlign = "center";
			var labelStep = Math.max(4, Math.round(heatCount / 8));
			for (var p2 = 0; p2 < heatCount; p2 += labelStep) {
				ctx.fillText(String(p2), padL + p2 * cw + cw / 2, padT + heatH + 13);
			}
			ctx.textAlign = "right";
			for (var d2 = 0; d2 < heatDims; d2 += 2) {
				ctx.fillText("d" + d2, padL - 6, padT + d2 * ch + ch * 0.7);
			}
			var stripTop = padT + heatH + 30;
			var gap = 0;
			var stripW = Math.max(2, Math.min(18, (heatW - 92 - (heatDims - 1) * gap) / heatDims));
			var stripH = 12;
			ctx.textAlign = "left";
			ctx.fillStyle = c.muted;
			ctx.font = "500 9px Barlow, system-ui, sans-serif";
			ctx.fillText(DE ? "Fingerabdrücke" : "fingerprints", padL, stripTop - 6);
			[0, heatCount - 1].forEach(function (position, row) {
				var y = stripTop + row * (stripH + 6);
				ctx.textAlign = "right";
				ctx.fillStyle = position === 0 ? c.coral : c.green;
				ctx.fillText((DE ? "Pos. " : "pos ") + position, padL - 6, y + stripH - 2);
				ctx.textAlign = "left";
				for (var d3 = 0; d3 < heatDims; d3++) {
					var v3 = cellT(position, d3);
					var xx0 = edge(padL + d3 * (stripW + gap));
					var xx1 = edge(padL + (d3 + 1) * (stripW + gap));
					ctx.fillStyle = heatColor(v3, c);
					ctx.fillRect(xx0, y, Math.max(1, xx1 - xx0), stripH);
				}
			});
			if (heatOut) {
				var p0 = [], pn = [];
				for (var k = 0; k < Math.min(4, heatDims); k++) {
					p0.push(heatValue(0, k).toFixed(2));
					pn.push(heatValue(heatCount - 1, k).toFixed(2));
				}
				heatOut.innerHTML = (DE ? 'Position 0: ' : 'position 0: ') + '<b>[' + p0.join(", ") + ']</b>' +
					(DE ? ' · Position ' : ' · position ') + (heatCount - 1) + ': <b>[' + pn.join(", ") + ']</b> ' +
					'<span class="pos-note">' + (DE ? "· jede Spalte auf ihren eigenen Bereich skaliert" : "· each column scaled to its own range") + '</span>';
			}
		}
		if (heatCanvas) {
			heatApi = TM.initCanvas(heatCanvas, drawHeat);
			var heatContextSlider = document.getElementById("ipe-heat-context");
			var heatContextOut = document.getElementById("ipe-heat-context-out");
			var heatDimsSlider = document.getElementById("ipe-heat-dims");
			var heatDimsOut = document.getElementById("ipe-heat-dims-out");
			if (heatContextSlider) {
				heatContextSlider.addEventListener("input", function () {
					heatCount = TM.clamp(parseInt(heatContextSlider.value, 10) || 16, 16, 128);
					if (heatContextOut) heatContextOut.textContent = String(heatCount);
					if (heatApi) heatApi.redraw();
				});
			}
			if (heatDimsSlider) {
				heatDimsSlider.addEventListener("input", function () {
					heatDims = TM.clamp(parseInt(heatDimsSlider.value, 10) || 2, 2, 64);
					if (heatDimsOut) heatDimsOut.textContent = String(heatDims);
					if (heatApi) heatApi.redraw();
				});
			}
			window.addEventListener("tm:theme", function () {
				if (heatApi) heatApi.redraw();
			});
			if (heatContextOut) heatContextOut.textContent = String(heatCount);
			if (heatDimsOut) heatDimsOut.textContent = String(heatDims);
			if (heatApi) heatApi.redraw();
		}

		/* ── positions ───────────────────────────────────────── */
		var posCanvas = document.getElementById("ipe-canvas");
		var posOut = document.getElementById("ipe-out");
		var posApi = null;
		var pos = 7;
		var posShown = 7;
		var POS_BASE = 10000;
		var POS_DIM = 8;
		var POS_FREQ = [0, 1, 2].map(function (i) {
			return Math.pow(POS_BASE, -2 * i / POS_DIM);
		});
		var POS_COLORS = ["green", "blue", "gold"];
		var POS_LABELS = ["d0/d1", "d2/d3", "d4/d5"];
		var POS_START = 0.55;
		var posReduce = TM.prefersReduced();
		var posAuto = !posReduce;
		var posClock = 0;
		function posAngle(pair, p) {
			return p * POS_FREQ[pair];
		}
		function posOrbit(pair, theta) {
			var co = Math.cos(theta);
			var si = Math.sin(theta);
			if (pair === 0) return [co, si, 0];
			if (pair === 1) return [si, 0, co];
			return [0, co, si];
		}
		function posDegrees(theta) {
			var deg = (theta * 180 / Math.PI) % 360;
			if (deg < 0) deg += 360;
			var rounded = Math.round(deg);
			return rounded === 360 ? 0 : rounded;
		}
		function posRgba(hex, alpha) {
			var rgb = hexToRgb(hex);
			return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + alpha + ")";
		}
		function posProjector(w, h) {
			var t = posClock * 0.00018;
			var az = -0.62 + (posAuto ? Math.sin(t) * 0.26 : 0);
			var el = 0.34 + (posAuto ? Math.sin(t * 0.7) * 0.035 : 0);
			var ca = Math.cos(az), sa = Math.sin(az);
			var ce = Math.cos(el), se = Math.sin(el);
			var unit = Math.min(w * 0.29, h * 0.36);
			var cx = w / 2;
			var cy = h * 0.52;
			function project(p) {
				var x1 = p[0] * ca + p[2] * sa;
				var z1 = -p[0] * sa + p[2] * ca;
				var y1 = p[1] * ce - z1 * se;
				var z2 = p[1] * se + z1 * ce;
				var depth = z2 + 6.4;
				var scale = 5.9 / Math.max(depth, 0.6);
				return { x: cx + x1 * unit * scale, y: cy - y1 * unit * scale, z: z2 };
			}
			project.cx = cx;
			project.cy = cy;
			project.unit = unit;
			return project;
		}
		function posGlow(ctx, x, y, r, color, alpha) {
			var g = ctx.createRadialGradient(x, y, 0, x, y, r);
			g.addColorStop(0, posRgba(color, alpha));
			g.addColorStop(1, posRgba(color, 0));
			ctx.fillStyle = g;
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2);
			ctx.fill();
		}
		function posPill(ctx, c, w, h, x, y, color, text) {
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			var tw = ctx.measureText(text).width;
			var bw = tw + 12;
			var bh = 16;
			var bx = TM.clamp(x - bw / 2, 4, w - bw - 4);
			var by = TM.clamp(y - bh / 2, 4, h - bh - 4);
			ctx.fillStyle = c.dark ? "rgba(4,34,46,.88)" : "rgba(255,255,255,.94)";
			TM.roundRect(ctx, bx, by, bw, bh, 8);
			ctx.fill();
			ctx.strokeStyle = posRgba(color, 0.45);
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.fillStyle = color;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(text, bx + bw / 2, by + bh / 2 + 0.5);
			ctx.textBaseline = "alphabetic";
		}
		function drawPos(ctx, w, h) {
			var c = TM.colors();
			ctx.clearRect(0, 0, w, h);
			var project = posProjector(w, h);
			var cx = project.cx;
			var cy = project.cy;
			var unit = project.unit;

			var stageGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, unit * 1.6);
			stageGlow.addColorStop(0, posRgba(c.sky, c.dark ? 0.16 : 0.08));
			stageGlow.addColorStop(1, posRgba(c.sky, 0));
			ctx.fillStyle = stageGlow;
			ctx.beginPath();
			ctx.arc(cx, cy, unit * 1.6, 0, Math.PI * 2);
			ctx.fill();

			ctx.textAlign = "right";
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.fillStyle = c.muted;
			ctx.fillText((DE ? "Position " : "position ") + "m = " + pos, w - 14, 18);
			ctx.textAlign = "left";

			var SEGMENTS = 72;
			POS_FREQ.forEach(function (freq, pair) {
				var color = c[POS_COLORS[pair]];
				var theta = posAngle(pair, posShown);
				var i;

				var ring = [];
				for (i = 0; i <= SEGMENTS; i++) {
					ring.push(project(posOrbit(pair, i / SEGMENTS * Math.PI * 2)));
				}
				ctx.lineCap = "round";
				for (i = 0; i < SEGMENTS; i++) {
					var a = ring[i];
					var b = ring[i + 1];
					var near = (1 - (a.z + b.z) / 2) / 2;
					ctx.beginPath();
					ctx.moveTo(a.x, a.y);
					ctx.lineTo(b.x, b.y);
					ctx.strokeStyle = posRgba(color, 0.07 + near * 0.17);
					ctx.lineWidth = 1;
					ctx.stroke();
				}

				var sweep = ((theta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
				if (theta > 0.0001 && sweep < 0.0001) sweep = Math.PI * 2;
				if (sweep > 0.0001) {
					var arcStart = POS_START + Math.max(0, theta - sweep);
					var steps = Math.max(2, Math.ceil(sweep / (Math.PI * 2) * SEGMENTS));
					ctx.beginPath();
					for (i = 0; i <= steps; i++) {
						var p = project(posOrbit(pair, arcStart + sweep * i / steps));
						if (i === 0) ctx.moveTo(p.x, p.y);
						else ctx.lineTo(p.x, p.y);
					}
					ctx.strokeStyle = posRgba(color, 0.14);
					ctx.lineWidth = 7;
					ctx.stroke();
					for (i = 0; i < steps; i++) {
						var p1 = project(posOrbit(pair, arcStart + sweep * i / steps));
						var p2 = project(posOrbit(pair, arcStart + sweep * (i + 1) / steps));
						var nearArc = (1 - (p1.z + p2.z) / 2) / 2;
						ctx.beginPath();
						ctx.moveTo(p1.x, p1.y);
						ctx.lineTo(p2.x, p2.y);
						ctx.strokeStyle = posRgba(color, 0.35 + nearArc * 0.6);
						ctx.lineWidth = 2.2;
						ctx.stroke();
					}
				}

				var start = project(posOrbit(pair, POS_START));
				ctx.save();
				ctx.setLineDash([4, 4]);
				ctx.beginPath();
				ctx.moveTo(cx, cy);
				ctx.lineTo(start.x, start.y);
				ctx.strokeStyle = posRgba(color, 0.3);
				ctx.lineWidth = 1.2;
				ctx.stroke();
				ctx.restore();
				ctx.beginPath();
				ctx.arc(start.x, start.y, 3.2, 0, Math.PI * 2);
				ctx.fillStyle = c.paper;
				ctx.fill();
				ctx.strokeStyle = posRgba(color, 0.6);
				ctx.lineWidth = 1.4;
				ctx.stroke();

				var marker = project(posOrbit(pair, POS_START + theta));
				var nearMarker = (1 - marker.z) / 2;
				ctx.beginPath();
				ctx.moveTo(cx, cy);
				ctx.lineTo(marker.x, marker.y);
				ctx.strokeStyle = posRgba(color, 0.72);
				ctx.lineWidth = 3;
				ctx.stroke();
				posGlow(ctx, marker.x, marker.y, 20, color, 0.22 + nearMarker * 0.14);
				ctx.beginPath();
				ctx.arc(marker.x, marker.y, 4.6 + nearMarker * 2.6, 0, Math.PI * 2);
				ctx.fillStyle = color;
				ctx.fill();
				ctx.strokeStyle = c.card;
				ctx.lineWidth = 2;
				ctx.stroke();

				var dx = marker.x - cx;
				var dy = marker.y - cy;
				var len = Math.hypot(dx, dy) || 1;
				var label = POS_LABELS[pair] + (w >= 520 ? " · " + posDegrees(theta) + "°" : "");
				posPill(ctx, c, w, h, marker.x + dx / len * 28, marker.y + dy / len * 28, color, label);
			});

			var ballRadius = Math.max(10, unit * 0.12);
			var ball = ctx.createRadialGradient(cx - ballRadius * 0.4, cy - ballRadius * 0.45, ballRadius * 0.12, cx, cy, ballRadius);
			ball.addColorStop(0, c.dark ? "#f2fbf8" : "#ffffff");
			ball.addColorStop(0.36, c.sky);
			ball.addColorStop(0.72, c.petrol);
			ball.addColorStop(1, "#000000");
			ctx.fillStyle = ball;
			ctx.beginPath();
			ctx.arc(cx, cy, ballRadius, 0, Math.PI * 2);
			ctx.fill();
			ctx.strokeStyle = posRgba(c.sky, 0.55);
			ctx.lineWidth = 1;
			ctx.stroke();
		}
		if (posCanvas) {
			posApi = TM.initCanvas(posCanvas, drawPos);
			var posSlider = document.getElementById("ipe-pos");
			var posCountOut = document.getElementById("ipe-pos-out");
			var posVisible = true;
			posClock = (window.performance && performance.now) ? performance.now() : 0;
			function posTurnNote(theta) {
				var turns = theta / (Math.PI * 2);
				if (turns < 1.5) return "";
				var text = turns.toFixed(1).replace(".", DE ? "," : ".");
				return ' <span class="pos-note">' + text + (DE ? " Umdrehungen" : " turns") + '</span>';
			}
			function posRenderOut() {
				if (!posOut) return;
				var degs = POS_FREQ.map(function (f) {
					return posDegrees(pos * f) + "°";
				});
				posOut.innerHTML = (DE ? 'Position ' : 'position ') + '<b>' + pos + '</b>' +
					' · d0/d1 <b>' + degs[0] + '</b>' + posTurnNote(pos * POS_FREQ[0]) +
					' · d2/d3 <b>' + degs[1] + '</b>' + posTurnNote(pos * POS_FREQ[1]) +
					' · d4/d5 <b>' + degs[2] + '</b>' + posTurnNote(pos * POS_FREQ[2]) + '.';
			}
			function posTick(now) {
				if (posApi && posVisible && !document.hidden) {
					var moving = Math.abs(pos - posShown) > 0.0005;
					if (posAuto || moving) {
						posClock = now;
						if (moving) {
							posShown += (pos - posShown) * 0.18;
							if (Math.abs(pos - posShown) < 0.01) posShown = pos;
						} else {
							posShown = pos;
						}
						posApi.redraw();
					}
				}
				requestAnimationFrame(posTick);
			}
			if (posSlider) {
				posSlider.addEventListener("input", function () {
					pos = TM.clamp(parseInt(posSlider.value, 10) || 0, 0, 1000);
					if (posReduce) posShown = pos;
					if (posCountOut) posCountOut.textContent = String(pos);
					posRenderOut();
					if (posApi) posApi.redraw();
				});
			}
			var posAutoBtn = document.getElementById("ipe-autorotate");
			if (posAutoBtn) {
				posAutoBtn.classList.toggle("is-on", posAuto);
				posAutoBtn.setAttribute("aria-pressed", posAuto ? "true" : "false");
				posAutoBtn.addEventListener("click", function () {
					posAuto = !posAuto;
					posAutoBtn.classList.toggle("is-on", posAuto);
					posAutoBtn.setAttribute("aria-pressed", posAuto ? "true" : "false");
					if (posAuto) posClock = (window.performance && performance.now) ? performance.now() : 0;
					if (posApi) posApi.redraw();
				});
			}
			if ("IntersectionObserver" in window) {
				new IntersectionObserver(function (entries) {
					posVisible = entries[0].isIntersecting;
				}, { threshold: 0.01 }).observe(posCanvas);
			}
			window.addEventListener("tm:theme", function () {
				if (posApi) posApi.redraw();
			});
			if (posCountOut) posCountOut.textContent = String(pos);
			posRenderOut();
			if (posApi) posApi.redraw();
			requestAnimationFrame(posTick);
		}

		/* ── attention ───────────────────────────────────────── */
		var attCanvas = document.getElementById("iatt-canvas");
		var attSentence = document.getElementById("iatt-sentence");
		var attOut = document.getElementById("iatt-out");
		var attApi = null;
		var attIndex = 0;
		var attExamples = DE ? [
			{ sentence: 'Ich gehe zur <span class="aw-bank">Bank</span>.', contexts: [], shift: [5, 5], caption: 'Ohne eindeutigen Kontext: <b>Bank</b> bleibt in der Mitte, mehrdeutig.' },
			{ sentence: 'Ich sitze im <span class="aw-river">Park</span> auf der <span class="aw-bank">Bank</span>.', contexts: ['river'], shift: [3.2, 6.8], caption: '<b>Park</b> ist der Nachbar → Bank bewegt sich zur Sitzbank-Bedeutung.' },
			{ sentence: 'Ich bringe mein <span class="aw-money">Geld</span> zur <span class="aw-bank">Bank</span>.', contexts: ['money'], shift: [7.2, 3.2], caption: '<b>Geld</b> ist der Nachbar → Bank bewegt sich zur Finanzbedeutung.' },
			{ sentence: 'Nach dem Spaziergang im <span class="aw-river">Park</span> gehe ich zur <span class="aw-bank">Bank</span>, um mein <span class="aw-money">Geld</span> einzuzahlen.', contexts: ['river', 'money'], shift: [6.6, 3.9], caption: 'Beide Nachbarn konkurrieren; <b>Geld</b> gewinnt knapp, also kippt Bank zur Finanzbedeutung.' }
		] : [
			{ sentence: 'I walk to the <span class="aw-bank">bank</span>.', contexts: [], shift: [5, 5], caption: 'No unambiguous context: <b>bank</b> stays in the middle, ambiguous.' },
			{ sentence: 'I sit by the <span class="aw-river">river</span> on the <span class="aw-bank">bank</span>.', contexts: ['river'], shift: [3.2, 6.8], caption: '<b>River</b> is the neighbour → bank moves toward the water sense.' },
			{ sentence: 'I bring my <span class="aw-money">money</span> to the <span class="aw-bank">bank</span>.', contexts: ['money'], shift: [7.2, 3.2], caption: '<b>Money</b> is the neighbour → bank moves toward finance.' },
			{ sentence: 'After the walk by the <span class="aw-river">river</span> I go to the <span class="aw-bank">bank</span> to deposit my <span class="aw-money">money</span>.', contexts: ['river', 'money'], shift: [6.6, 3.9], caption: 'Both neighbours compete; <b>money</b> wins by a hair, so bank tilts toward finance.' }
		];
		var attPos = { bank: [5, 5], river: [0.5, 9.5], money: [10.5, 0.5] };
		var attColors = { bank: "#63a44b", river: "#5c9baf", money: "#9f9700" };
		function attLabel(word) {
			if (!DE) return word;
			return ({ bank: "Bank", river: "Park", money: "Geld" })[word] || word;
		}
		function drawAtt(ctx, w, h) {
			var c = TM.colors();
			var pad = 36;
			var x0 = -1, x1 = 12, y0 = -1, y1 = 11;
			function ax(x) { return pad + (x - x0) / (x1 - x0) * (w - pad * 2); }
			function ay(y) { return h - pad - (y - y0) / (y1 - y0) * (h - pad * 2); }
			ctx.clearRect(0, 0, w, h);
			ctx.strokeStyle = c.dark ? "rgba(238,247,244,.08)" : "rgba(0,75,111,.09)";
			ctx.lineWidth = 1;
			for (var gx = 0; gx <= 12; gx += 2) { ctx.beginPath(); ctx.moveTo(ax(gx), ay(y0)); ctx.lineTo(ax(gx), ay(y1)); ctx.stroke(); }
			for (var gy = 0; gy <= 10; gy += 2) { ctx.beginPath(); ctx.moveTo(ax(x0), ay(gy)); ctx.lineTo(ax(x1), ay(gy)); ctx.stroke(); }
			var ex = attExamples[attIndex];
			Object.keys(attPos).forEach(function (word) {
				var p = attPos[word];
				ctx.beginPath();
				ctx.arc(ax(p[0]), ay(p[1]), 5, 0, Math.PI * 2);
				ctx.fillStyle = attColors[word];
				ctx.fill();
				ctx.font = "600 11px Barlow, system-ui, sans-serif";
				ctx.fillStyle = c.dark ? "rgba(238,247,244,.72)" : "rgba(18,38,45,.7)";
				ctx.textAlign = "center";
				ctx.fillText(attLabel(word), ax(p[0]), ay(p[1]) - 11);
			});
			var bank = attPos.bank;
			ex.contexts.forEach(function (word) {
				var p = attPos[word];
				if (!p) return;
				ctx.setLineDash([3, 4]);
				ctx.beginPath();
				ctx.moveTo(ax(bank[0]), ay(bank[1]));
				ctx.lineTo(ax(p[0]), ay(p[1]));
				ctx.strokeStyle = c.dark ? "rgba(159, 151, 0, .55)" : "rgba(159, 151, 0, .5)";
				ctx.lineWidth = 1.8;
				ctx.stroke();
				ctx.setLineDash([]);
			});
			ctx.beginPath();
			ctx.moveTo(ax(bank[0]), ay(bank[1]));
			ctx.lineTo(ax(ex.shift[0]), ay(ex.shift[1]));
			ctx.strokeStyle = c.dark ? "rgba(238,247,244,.6)" : "rgba(0,75,111,.55)";
			ctx.lineWidth = 2;
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(ax(ex.shift[0]) - 6, ay(ex.shift[1]));
			ctx.lineTo(ax(ex.shift[0]), ay(ex.shift[1]) - 6);
			ctx.lineTo(ax(ex.shift[0]) + 6, ay(ex.shift[1]));
			ctx.lineTo(ax(ex.shift[0]), ay(ex.shift[1]) + 6);
			ctx.closePath();
			ctx.fillStyle = c.dark ? "#9185be" : "#9f9700";
			ctx.fill();
			ctx.strokeStyle = c.card;
			ctx.lineWidth = 2;
			ctx.stroke();
			var moved = Math.hypot(ex.shift[0] - bank[0], ex.shift[1] - bank[1]) > 0.15;
			if (moved) {
				var label = DE ? "Bank (mit Kontext)" : "bank (with context)";
				ctx.font = "700 10px Barlow, system-ui, sans-serif";
				var tw = ctx.measureText(label).width;
				var tx = ax(ex.shift[0]), ty = ay(ex.shift[1]) - 14;
				tx = TM.clamp(tx, pad + tw / 2 + 6, w - pad - tw / 2 - 6);
				TM.roundRect(ctx, tx - tw / 2 - 6, ty - 12, tw + 12, 16, 4);
				ctx.fillStyle = c.dark ? "rgba(15,23,42,.86)" : "rgba(255,255,255,.92)";
				ctx.fill();
				ctx.strokeStyle = c.dark ? "rgba(148,163,184,.38)" : "rgba(0,75,111,.2)";
				ctx.lineWidth = 1;
				ctx.stroke();
				ctx.fillStyle = c.dark ? "#9f9700" : "#004b6f";
				ctx.textAlign = "center";
				ctx.fillText(label, tx, ty);
			}
		}
		function renderAtt() {
			var ex = attExamples[attIndex];
			if (attSentence) attSentence.innerHTML = ex.sentence;
			if (attOut) attOut.innerHTML = ex.caption;
			document.querySelectorAll("[data-att]").forEach(function (b) {
				b.classList.toggle("is-on", parseInt(b.getAttribute("data-att"), 10) === attIndex);
			});
			if (attApi) attApi.redraw();
		}
		if (attCanvas) {
			attApi = TM.initCanvas(attCanvas, drawAtt);
			document.querySelectorAll("[data-att]").forEach(function (btn) {
				btn.addEventListener("click", function () {
					attIndex = parseInt(btn.getAttribute("data-att"), 10);
					renderAtt();
				});
			});
			renderAtt();
		}

		/* ── feed-forward ────────────────────────────────────── */
		var ffnScenarios = {
			fruit: {
				keys: [
					{ label: "Feature: technology brand", on: false },
					{ label: "Feature: food / edible", on: true },
					{ label: "Feature: orchard / fruit", on: true }
				],
				values: [
					{ label: "Next-token pull: pie, juice, crunch", on: true },
					{ label: "Next-token pull: Mac, iPhone, stock", on: false },
					{ label: "Next-token pull: tree, orchard, green", on: true }
				],
				desc: 'The context is <b>I ate the apple</b>. Attention has already put that context into the token vector. The food and orchard patterns match; the technology pattern stays silent. Each match writes a next-token pull into the stream.'
			},
			tech: {
				keys: [
					{ label: "Feature: technology brand", on: true },
					{ label: "Feature: food / edible", on: false },
					{ label: "Feature: orchard / fruit", on: false }
				],
				values: [
					{ label: "Next-token pull: pie, juice, crunch", on: false },
					{ label: "Next-token pull: Mac, iPhone, stock", on: true },
					{ label: "Next-token pull: tree, orchard, green", on: false }
				],
				desc: 'The context is <b>I bought an Apple laptop</b>. Now the technology pattern matches and the food and orchard patterns stay silent. The value pushes the next-token distribution toward “Mac”, “iPhone”, and “stock”.'
			}
		};
		var ffnScenariosDe = {
			fruit: {
				keys: [
					{ label: "Merkmal: Mechanik / Schlüssel", on: false },
					{ label: "Merkmal: Gebäude / Adel", on: true },
					{ label: "Merkmal: Turm / Burg", on: true }
				],
				values: [
					{ label: "Nächste-Token-Hinweis: Schlüssel, Tür, öffnen", on: false },
					{ label: "Nächste-Token-Hinweis: König, Turm, Burg", on: true },
					{ label: "Nächste-Token-Hinweis: alt, prächtig, Garten", on: true }
				],
				desc: 'Der Kontext ist <b>Ich besichtige das Schloss</b>. Attention hat diesen Kontext bereits in den Token-Vektor gelegt. Die Gebäude- und Burgmuster passen; das Mechanik-Muster bleibt still. Jeder Treffer schreibt einen Nächste-Token-Hinweis in den Stream.'
			},
			tech: {
				keys: [
					{ label: "Merkmal: Mechanik / Schlüssel", on: true },
					{ label: "Merkmal: Gebäude / Adel", on: false },
					{ label: "Merkmal: Turm / Burg", on: false }
				],
				values: [
					{ label: "Nächste-Token-Hinweis: Schlüssel, Tür, öffnen", on: true },
					{ label: "Nächste-Token-Hinweis: König, Turm, Burg", on: false },
					{ label: "Nächste-Token-Hinweis: alt, prächtig, Garten", on: false }
				],
				desc: 'Der Kontext ist <b>Ich öffne das Schloss</b>. Jetzt passt das Mechanik-Muster, und die Gebäude- und Burgmuster bleiben still. Der Value verschiebt die Nächste-Token-Verteilung in Richtung „Schlüssel“, „Tür“ und „öffnen“.'
			}
		};
		function fitFFNHeight() {
			var out = document.getElementById("iffn-out");
			if (!out) return;
			var dataSet = DE ? ffnScenariosDe : ffnScenarios;
			var prev = out.innerHTML;
			var max = 0;
			out.style.minHeight = "";
			Object.keys(dataSet).forEach(function (key) {
				out.innerHTML = dataSet[key].desc;
				max = Math.max(max, out.offsetHeight);
			});
			out.innerHTML = prev;
			if (max > 0) out.style.minHeight = max + "px";
		}
		function renderFFN(mode) {
			var data = (DE ? ffnScenariosDe : ffnScenarios)[mode];
			var keysEl = document.getElementById("iffn-keys");
			var valuesEl = document.getElementById("iffn-values");
			var out = document.getElementById("iffn-out");
			if (keysEl) keysEl.innerHTML = data.keys.map(function (k) {
				return '<div class="ffn-pill ' + (k.on ? "is-fire" : "is-idle") + '">' + k.label + '<small>' + (k.on ? (DE ? "passt" : "matches") : (DE ? "still" : "silent")) + '</small></div>';
			}).join("");
			if (valuesEl) valuesEl.innerHTML = data.values.map(function (v) {
				return '<div class="ffn-pill ' + (v.on ? (mode === "tech" ? "is-fire-tech" : "is-fire") : "is-idle") + '">' + v.label + '</div>';
			}).join("");
			if (out) out.innerHTML = data.desc;
			document.querySelectorAll("[data-ffn]").forEach(function (b) {
				b.classList.toggle("is-on", b.getAttribute("data-ffn") === mode);
			});
		}
		document.querySelectorAll("[data-ffn]").forEach(function (btn) {
			btn.addEventListener("click", function () { renderFFN(btn.getAttribute("data-ffn")); });
		});
		renderFFN("fruit");
		window.addEventListener("load", fitFFNHeight);
		window.addEventListener("resize", function () {
			clearTimeout(fitFFNHeight._timer);
			fitFFNHeight._timer = setTimeout(fitFFNHeight, 120);
		});
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitFFNHeight);

		/* ── residual stream ─────────────────────────────────── */
		var resBase = [0.35, 0.5, 0.28, 0.62, 0.44, 0.3, 0.55, 0.4, 0.33, 0.48];
		var resUpdates = [
			{ label: "Embedding", note: "The token becomes a vector.", noteDe: "Das Token wird zu einem Vektor.", add: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
			{ label: "+ Attention 1", note: "The token reads its neighbours and adds what it found.", noteDe: "Das Token liest seine Nachbarn und addiert, was es gefunden hat.", add: [0.24, 0.32, 0.14, 0.28, 0.2, 0.36, 0.12, 0.2, 0.26, 0.22] },
			{ label: "+ FFN 1", note: "A pattern match writes a next-token hint into the stream.", noteDe: "Ein Mustertreffer schreibt einen Nächste-Token-Hinweis in den Stream.", add: [0.18, 0.12, 0.3, 0.16, 0.24, 0.1, 0.28, 0.22, 0.14, 0.18] },
			{ label: "+ Attention 2", note: "A second head connects a longer-range clue.", noteDe: "Ein zweiter Head verbindet einen weiter entfernten Hinweis.", add: [0.16, 0.22, 0.18, 0.26, 0.14, 0.2, 0.24, 0.12, 0.2, 0.16] },
			{ label: "+ FFN 2", note: "More features combine; the representation sharpens.", noteDe: "Mehr Merkmale kombinieren sich; die Repräsentation wird schärfer.", add: [0.12, 0.18, 0.22, 0.12, 0.2, 0.16, 0.14, 0.24, 0.18, 0.1] },
			{ label: "+ Attention 3", note: "The last layer routes the remaining context before the output.", noteDe: "Die letzte Schicht leitet den restlichen Kontext vor die Ausgabe.", add: [0.1, 0.14, 0.12, 0.18, 0.16, 0.12, 0.2, 0.14, 0.12, 0.2] }
		];
		var resStep = 0;
		var resBars = document.getElementById("ires-bars");
		var resLayers = document.getElementById("ires-layers");
		var resOut = document.getElementById("ires-out");
		var resVector = document.getElementById("ires-vector");
		function renderRes() {
			if (resLayers) {
				resLayers.innerHTML = resUpdates.map(function (u, i) {
					return '<button class="res-layer' + (i === resStep ? " is-on" : "") + '" type="button" data-res="' + i + '">' + u.label + '</button>';
				}).join("");
				resLayers.querySelectorAll("[data-res]").forEach(function (btn) {
					btn.addEventListener("click", function () {
						resStep = parseInt(btn.getAttribute("data-res"), 10);
						renderRes();
					});
				});
			}
			var cum = resBase.slice();
			for (var i = 1; i <= resStep; i++) {
				for (var j = 0; j < cum.length; j++) cum[j] += resUpdates[i].add[j];
			}
			var max = Math.max.apply(null, cum) * 1.12;
			if (resBars) {
				resBars.innerHTML = cum.map(function (v) {
					return '<span class="res-bar" style="height:' + Math.max(6, v / max * 100) + '%"></span>';
				}).join("");
			}
			if (resOut) resOut.innerHTML = DE ? resUpdates[resStep].noteDe : resUpdates[resStep].note;
			if (resVector) resVector.textContent = "[" + cum.map(function (v) { return v.toFixed(2); }).join(", ") + "]";
		}
		renderRes();


		window.addEventListener("tm:theme", function () {
			if (isoApi) isoApi.redraw();
			if (embApi) embApi.redraw();
			if (posApi) posApi.redraw();
			if (attApi) attApi.redraw();
		});
	})();
	</script>
</body>
</html>
