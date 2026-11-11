<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: An Intuition of how Large Language Models (LLMs) work
description: Large Language Models are next-word prediction machines. Follow one token through the whole machine, from text to a probability and back.
icon: &#128161;
part: 1
order: 1
color: accent
topics: history, philosophy, society, architecture, math-i
tags: interested-layman
math: 35
-->

<?php css("intuition_tm"); ?>
<?php js("intuition_tm"); ?>
<?php js("intuition_space_morph"); ?>
<?php js("manifold_scenes"); ?>

<div id="tm-intuition">
<article class="lesson-main">
					<section class="section-block" id="idea" data-chapter="The loop">
						<div class="section-kicker"><span class="sk-num">01</span> The idea</div>
						<h2 class="section-title">A first intuition: predict the next word.</h2>
						<div class="prose">
							<p>Ask your phone a question. The answer appears one word at a time. Under the hood, the model is doing one thing: predicting the next token.</p>
							<p>A large language model is a program trained on text. It returns a probability for every possible next token. Pick one, append it, and run again. That is the autoregressive loop: auto because the model feeds its own output back in, regressive because each prediction is a regression on the sequence so far. How does a pile of numbers become a sentence? Follow one token through the machine.</p>
						</div>

						<div class="demo demo--paper demo--interactive" id="phone-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">The model in your pocket <span>· demo 01a</span></p>
									<p class="demo-sub">A search box, a voice query, an AI answer and the links below it. The animation runs once when the demo comes into view.</p>
								</div>
								
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
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>The search engine does not look up a stored answer. The summary is written one token at a time, and the same loop runs in the data centre behind it.</span></div>
						</div>

						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">At its heart, it is a loop: one word after another.</p>
							<p class="aha-sub">Pick a likely next word, append it to the input, and run the whole thing again. A sentence, an answer, or a program emerges from that repeated step.</p>
						</div>
					</section>

					<section class="section-block" id="code" data-chapter="The loop">
						<div class="section-kicker">Next step · code</div>
						<h2 class="section-title">It writes text and code.</h2>
						<div class="prose">
							<p>The same loop writes prose and code; Python runs the program.</p>
						</div>

						<div class="demo demo--paper demo--interactive code-demo--console" id="code-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">From a request to a program <span>· demo 01a · code</span></p>
									<p class="demo-sub">The model writes the code; Python runs it.</p>
								</div>
							</div>
							<div class="demo-body">
								<div class="code-demo-grid">
									<div class="code-demo-window">
										<div class="code-demo-bar"><span class="code-demo-dot is-green"></span><span class="code-demo-dot is-gold"></span><span class="code-demo-dot is-sky"></span><span class="code-demo-name">sky.py</span></div>
										<div class="code-demo-chat">
											<div class="code-demo-msg is-user">Write a Python program that calculates how strongly blue and red light are scattered in the atmosphere.</div>
											<div class="code-demo-msg is-ai">Sure. The program computes the Rayleigh scattering ratio for 450 nm and 650 nm.</div>
										</div>
										<pre class="code-demo-code" aria-label="Generated Python program"><code><span class="cd-com"># Rayleigh scattering in air</span>
k_B = <span class="cd-num">1.380649e-23</span>   <span class="cd-com"># J/K</span>

<span class="cd-kw">def</span> <span class="cd-fn">scattering</span>(wavelength, pressure, temperature):
    density = pressure / (k_B * temperature)
    <span class="cd-kw">return</span> density / wavelength ** <span class="cd-num">4</span>

blue = <span class="cd-fn">scattering</span>(<span class="cd-num">450e-9</span>, <span class="cd-num">1e5</span>, <span class="cd-num">293</span>)
red  = <span class="cd-fn">scattering</span>(<span class="cd-num">650e-9</span>, <span class="cd-num">1e5</span>, <span class="cd-num">293</span>)
<span class="cd-fn">print</span>(f<span class="cd-str">"Blue is {blue / red:.2f}x more strongly scattered than red"</span>)</code></pre>
									</div>
									<div class="code-demo-terminal" id="code-demo-terminal" aria-live="polite">
										<div class="code-demo-bar"><span class="code-demo-dot is-green"></span><span class="code-demo-dot is-gold"></span><span class="code-demo-dot is-sky"></span><span class="code-demo-name">Terminal</span></div>
										<div class="code-demo-term-body" id="code-demo-term">
											<div class="code-demo-cmd"><span class="code-demo-dollar">$</span> <span id="code-demo-command">python3 sky.py</span></div>
											<div class="code-demo-output" id="code-demo-output">Blue is 4.35× more strongly scattered than red.</div>
										</div>
									</div>
								</div>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>The model wrote the program; the program computed the ratio. Code is another sequence the loop can predict, one token at a time.</span></div>
						</div>
					</section>

					<section class="section-block" id="loop" data-chapter="The loop">
						<div class="section-kicker"><span class="sk-num">02</span> Play the loop</div>
						<h2 class="section-title">One Word After Another</h2>
						<div class="prose">
							<p>Context is everything the model can see when it predicts the next token: the text in the input field, the conversation so far, and the instructions or examples that frame the exchange. Training taught it how to read such a frame, so a prompt can bring out a role, a tone, or a way of answering. The model has no other working memory.</p>
							<p>One word after another is a slow feeling-forward in a complex world. At every step very much is possible, but not all of it makes sense; the loop is how the model narrows that space.</p>
							<p>The demo shows the idea, not a trained model. The next token is drawn from a distribution, appended, and the loop repeats. Temperature controls how far the model drifts from the most likely path.</p>
							<p>Why not always take the top token? Greedy does. Top-p keeps the smallest set whose cumulative probability reaches p, then samples. Low temperature sharpens the distribution; high temperature flattens it.</p>
						</div>

						<div class="demo demo--generative" id="next-token-demo">
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

						<div class="demo demo--paper demo--canvas" id="truth-tunnel-demo">
								<div class="demo-head">
									<div>
										<p class="demo-title">The probability tunnel <span>· demo 01b</span></p>
										<p class="demo-sub">A single prediction is one slice through a landscape of plausible continuations. The main path is the deepest blue valley, the route the model finds most likely. Every other option sits in its own side basin, close enough to remain possible. Step through the sentence and watch the valley narrow as context closes options; turn up the temperature and watch it widen again. Drag to rotate.</p>
									</div>
									<span class="demo-badge">live</span>
								</div>
								<div class="demo-body">
									<p class="iso-note">Think of every point in this landscape as an embedding: a vector that stands for a word or a continuation. Neighbouring points are similar in meaning, and the depth of a valley is the probability the model gives that continuation. The blue path is only one possible route through this space. The other paths are the alternatives the model has learned to consider; they are its experience compressed into the geometry of the space. The context is the part of the landscape the model can see right now: it shifts the valleys and closes routes that no longer fit. This picture is an abstraction. A real model works in thousands of dimensions, with far more paths than can be drawn here. The energy-landscape view follows the energy-based learning framework of <a href="http://yann.lecun.com/exdb/publis/pdf/lecun-06.pdf" target="_blank" rel="noopener">LeCun et al., A Tutorial on Energy-Based Learning (2006)</a>.</p>
									<div class="iso-grid">
										<div class="iso-main">
											<div class="tt-plot-wrap">
												<div id="tt-3d" class="tt-echarts-host" role="img" aria-label="A three-dimensional landscape of plausible continuations, with the most likely path carved as a deep blue valley"></div>
												<div id="tt-ball" class="tt-ball" aria-hidden="true"><span class="tt-ball-label" id="tt-ball-label">context</span></div>
												<div id="tt-labels" class="tt-labels" aria-hidden="true"></div>
											</div>
											<div class="tt-legend">
												<span class="tt-legend-item"><i class="tt-swatch tt-swatch--deep"></i><span>deep blue = likely path</span></span>
												<span class="tt-legend-item"><i class="tt-swatch tt-swatch--side"></i><span>gold = possible exits</span></span>
												<span class="tt-legend-item"><i class="tt-swatch tt-swatch--base"></i><span>gold plane = all other tokens</span></span>
												<span class="tt-legend-item"><i class="tt-swatch tt-swatch--filler"></i><span>small dots = other plausible tokens</span></span>
											</div>
											<div class="tt-token-row" id="tt-token-row" aria-label="Jump to a token"></div>
										</div>
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
											<input type="range" id="tt-temp" min="0.05" max="5.0" step="0.05" value="0.8">
											<output id="tt-temp-out">0.80</output>
										</label>
									</div>
								</div>
								<div class="demo-foot">The green ball is the current context. Each token gives it direction and momentum; it rolls into the deepest valley, the path of least resistance. The gold dashed lines are plausible exits out of the main valley. Raise the temperature and the ridges flatten, so even more of those exits become reachable.</div>
								<div class="demo-insight"><b>Takeaway</b><span>The model never decides that something is right. It builds a distribution from its training data and draws from it; the landscape shows how context narrows that distribution.</span></div>
							</div>
						<p class="step-note">The model does not jump to an answer. It feels its way through this space, one token at a time. Click a word below the landscape, or use Next word, to jump to that step.</p>
						<div class="prose">
							<p>Training is the process that shapes this landscape. The model moves its coarse points, the token and context representations, into relations with one another so that meaning can be stored in compressed form inside the network. Attention and dense layers are trained together. In the high-dimensional space behind the projection, the loss makes the ball move faster along paths that continue the training text and slower along paths that do not. The landscape is therefore learned, not given: what counts as plausible is defined entirely by the training data.</p>
						</div>
					</section>

					<section class="section-block" id="inside" data-chapter="Inside the transformer">
						<div class="section-kicker"><span class="sk-num">03</span> Inside the model</div>
						<h2 class="section-title">A model is a stack of functions.</h2>
						<div class="prose">
														<p>A neural network is built by applying functions one after another. One layer transforms its input, the next layer transforms that result, and the stack turns a small operation into a deep model. The depth is composition: many simple steps, each feeding the next.</p>
							<p>Classical programming starts with the procedure: you write down every step, and the computer executes it. AI reverses that: you provide enough examples with matching outputs, and training searches for the function in between. The layers are the shape that function takes; the data decides what it does.</p>
														<div class="prose-math layer-stack-formula" data-tex="\underbrace{ \text{output} = \text{layer}_3\!\left( \underbrace{ \text{layer}_2\!\left( \underbrace{\text{layer}_1(\text{input})}_{\text{first transformation}} \right) }_{\text{second transformation}} \right) }_{\text{a stack of functions, each feeding the next}}" data-tex-display="true"></div>
							
						</div>
						<h2 class="section-title">The transformer: six steps, one running vector.</h2>
						<div class="prose">
							<p>The stack of functions above is the transformer. For every token, it runs the same six steps, again and again. The model moves points in a high-dimensional space. Training shapes those points so that the final context vector has smaller angles to words that plausibly come next than to words that do not. Because the decision is about angles, not straight-line distances, this page uses the great-circle metric by default. The model works on a hypersphere of directions; to draw it, we project that sphere down to three dimensions. Plausible here means the continuation occurred in the training data; it does not mean that the model has a separate notion of truth.</p>
							<p>For every token, again and again, it asks how that token stands in context to all the other tokens right now. Attention lets it look around, a dense layer and an activation function transform each token, and LayerNorm keeps the numbers in a stable range. A few other parts do their jobs along the way.</p>
							<p>Each pass shifts the token's point in the space. The directions follow meaning paths and become clearer, so the last token ends up at a small angle to the tokens that are likely next in this context. That is the trick.</p>
						</div>
						<div class="prose">
														<p>Now we explain these building blocks step by step: tokenize, embed, add position, attend, feed-forward, and the residual stream. The order is the real architecture; the demos are simplified.</p>
													</div>
					</section>


					<section class="section-block" id="step-tokenize-section" data-chapter="Inside the transformer">
						<div class="section-kicker">Step 1 · Tokenize</div>
						<h2 class="section-title">Tokenize: text becomes a sequence of IDs</h2>
						<div class="prose">
							<p>A token is not a word. Text is encoded as numbers: every character has a code point, and a byte-level tokenizer starts from 256 bytes, so every string is representable. Rare words split into subwords: “unbelievable” becomes “un”, “believ”, “able”, and the same “un” appears in “unhappy” and “unmarried”. A space can be a token too.</p>
						</div>
						<div class="step-pane" id="step-tokenize">
															<div class="step-stage">
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
															<p class="step-note">A real tokenizer learns its merge table from text. IDs are addresses into an embedding table.</p>
														</div>
					</section>

					<section class="section-block" id="step-embed-section" data-chapter="Inside the transformer">
						<div class="section-kicker">Step 2 · Embed</div>
						<h2 class="section-title">Embed: IDs become points in meaning space</h2>
						<h3 class="layer-subhead">Meaning becomes geometry</h4>
						<div class="prose">
							<p>Each token ID points to a learned vector. A real model uses thousands of dimensions; the demo uses two so you can see it. Similar words sit close, and a direction can carry a relationship: man → woman is the same arrow as king → queen. The axes here are labelled for humans; a real model's axes are unlabelled. Sometimes the relation does not come out exactly; an approximate direction is already enough to be useful.</p>
						</div>
						<div class="demo demo--paper demo--plot" id="oned-twod-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">From one axis to two <span>· demo</span></p>
									<p class="demo-sub">One axis orders words by temperature. Pick two words and see where their midpoint lands; the embedding demo below adds a second direction, so the same words can carry more relations.</p>
								</div>
							</div>
							<div class="demo-body">
								<div class="oned-twod-grid">
									<div>
										<canvas id="i1d-canvas" class="demo-canvas" style="height:210px" aria-label="A temperature line with Freezing at -30, Cold at 5, Lukewarm at 30, Warm at 55, and Hot at 100"></canvas>
										<p class="meadow-caption" style="color:var(--tm-muted)">1D: temperature</p>
									</div>

								</div>
								<div class="chip-row" id="oned-examples" aria-label="Temperature examples"></div>
								<div class="prose-math oned-formula" id="oned-formula" data-tex-display="true" aria-live="polite"></div>
							</div>
						</div>
						<div class="prose">
							<p>In the same space, word vectors add and subtract. Treat each word as an arrow from the origin: add two arrows and the result lands near the word that combines their meanings.</p>
						</div>
						<div class="demo demo--paper demo--canvas" id="step-embed">
							<div class="demo-head">
								<div>
									<p class="demo-title">Embedding arithmetic <span>· demo</span></p>
									<p class="demo-sub">Pick an example. The vectors add and subtract in the same two-dimensional space, and the result lands near a word.</p>
								</div>
							</div>
							<div class="demo-body">
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
								<canvas class="step-canvas" id="iemb-canvas" aria-label="A two-dimensional embedding space with two learned directions"></canvas>
								<div class="step-out" id="iemb-out">The space has two learned directions in this demo. Choose an example to see where it lands.</div>
							</div>
						</div>
						<h3 class="layer-subhead">From relations to translation</h4>
						<div class="prose-demo-split">
							<div class="prose">
								<p>The points form a manifold: locally flat, globally curved. The relations are similar enough to translate: the path from one word to another can be transformed into the corresponding path in another language. Feed-forward networks learn such transformations. This is an approximation. In a real model the geometry is much messier: relations overlap, exceptions are common, and translation is learned from huge amounts of text rather than read off a clean map. The intuition still points in the right direction.</p>
							</div>
							<div class="demo demo--paper demo--canvas" id="tm-dual-manifold-demo">
								<div class="demo-body">
									<div id="tm-dual-manifolds" style="width:100%;height:360px;">
										<div class="tm-manifold-loading">
											<span class="tm-spinner" aria-hidden="true"></span>
											<span>Loading the manifolds …</span>
										</div>
									</div>
									<div id="tm-dual-controls" style="max-width:520px;margin:8px auto 0;min-height:118px;"></div>
								</div>
							</div>
						</div>
					</section>

					<section class="section-block" id="step-position-section" data-chapter="Inside the transformer">
						<div class="section-kicker">Step 3 · Positional embedding</div>
						<h2 class="section-title">Position: every slot gets its own fingerprint</h2>
						<div class="prose">
							<p>Attention has no sense of order. Without a position signal, “man bites dog” and “dog bites man” are the same bag of vectors. A sinusoidal encoding adds a fingerprint to every slot: each pair of dimensions oscillates at a different frequency.</p>
						</div>
						<div class="prose-math pos-formula" data-tex="\underbrace{\begin{aligned} PE_{(\text{pos},2i)} &amp;= \sin\left(\frac{\underbrace{\text{pos}}_{\text{position}}}{\underbrace{10000^{2i/d}}_{\text{frequency}}}\right) \\ PE_{(\text{pos},2i+1)} &amp;= \cos\left(\frac{\text{pos}}{10000^{2i/d}}\right) \end{aligned}}_{\text{each dimension gets its own wave}}" data-tex-display="true"></div>
						<div class="step-pane" id="step-position">
							<div class="step-stage">
								<div class="step-toolbar">
									<label>Context length
										<input type="range" id="ipe-heat-context" min="16" max="128" step="8" value="64">
										<output id="ipe-heat-context-out">64</output>
									</label>
									<label>Visible dimensions
										<input type="range" id="ipe-heat-dims" min="2" max="64" step="2" value="24">
										<output id="ipe-heat-dims-out">24</output>
									</label>
								</div>
								<p class="step-note">Each position gets a fingerprint built from slow and fast waves.</p>
								<canvas class="step-canvas" id="ipe-heatmap" style="height:220px" aria-label="A heatmap of classic sinusoidal positional encodings for a long context"></canvas>
								<div class="pos-legend" aria-hidden="true">
									<span><i class="pl-neg"></i>−1</span>
									<span><i class="pl-zero"></i>0</span>
									<span><i class="pl-pos"></i>+1</span>
								</div>
								<div class="step-out" id="ipe-heat-out">Each row is one position; each column is one dimension.</div>
							</div>
							<div class="prose">
								<p class="pos-bridge-kicker">Same pattern, one dimension higher</p>
								<h3>From the flat slice to the 3D curve</h3>
								<p>The curve is a small, readable slice of that geometry. A real model is far more complex, but it follows the same geometric principles in thousands of dimensions.</p>
								<p>In the first three dimensions the curve is a spiral: the first two dimensions turn in a circle, while the third drifts slowly. The Euclidean view measures the straight-line chord from the token to the current point on that spiral. Switch to the angle view and the same points are projected onto the unit sphere, and in a real model onto a hypersphere: the distance is now the great-circle arc, the angle between the token direction and the position direction. The spiral stays, but the question changes from how far apart the two points are to how far their directions have turned.</p>
								<p class="pos-bridge-flow" aria-hidden="true"><span>position × dimension</span><i>→</i><span>3D curve</span><i>→</i><span>N dimensions</span></p>
							</div>
							<div class="step-stage">
								<div class="step-toolbar">
									<label>Position
										<input type="range" id="ipe-pos" min="0" max="10000" step="1" value="7">
										<output id="ipe-pos-out">7</output>
									</label>
									<div class="step-chips" id="ipe-metric" aria-label="Distance metric">
										<button class="chip is-on" type="button" data-pos-metric="euclid" aria-pressed="true">Euclidean length</button>
										<button class="chip" type="button" data-pos-metric="angle" aria-pressed="false">Angle to the word</button>
									</div>
									<button class="chip is-on" type="button" id="ipe-autorotate" aria-pressed="true">Auto-rotate view</button>
								</div>
								<p class="step-note pos-drag-hint">Move the slider to travel along the curve; drag the view to rotate it. The switch shows the straight chord between token and position, or normalizes both to the unit sphere and measures the great-circle arc.</p>
								<canvas class="step-canvas" id="ipe-canvas" style="height:380px" aria-label="A single sinusoidal positional-encoding vector for one token: three dimensions as axes, one point on the curve"></canvas>
								<div class="step-out" id="ipe-out">One token at position <b>7</b>.</div>
							</div>
							<p class="step-note">The three axes are the first three dimensions; the blue sphere is the word, the arrow its position. Drag to rotate. A real model adds the position vector to the token embedding and compares the resulting context vectors; the demo keeps the two vectors separate so the angle stays visible. A real model uses thousands of dimensions.</p>
						</div>
					</section>

					<section class="section-block" id="step-attention-section" data-chapter="Inside the transformer">
						<div class="section-kicker">Step 4 · Attend</div>
						<h2 class="section-title">Self-attention: context pulls the word into place</h2>
						<div class="prose">
							<p>How does a word know which neighbours matter? Self-attention lets each token look at the others, decide which matter, and pull their information into its vector. That is how “bank” moves toward the river or money reading. A real layer has many heads; the demo shows one.</p>
						</div>
						<div class="step-pane" id="step-attention">
															<div class="step-stage">
																<div class="step-toolbar">
																	<div class="step-chips" id="iatt-examples">
																		<button class="chip is-on" type="button" data-att="0">no unambiguous context</button>
																		<button class="chip" type="button" data-att="1">river in context</button>
																		<button class="chip" type="button" data-att="2">money in context</button>
																		<button class="chip" type="button" data-att="3">both in context</button>
																	</div>
																</div>
																<div class="attn-sentence" id="iatt-sentence">I walk to the <span class="aw-bank">bank</span>.</div>
																<canvas class="step-canvas" id="iatt-canvas" aria-label="Self-attention moving the embedding of bank toward the context"></canvas>
																<div class="step-out" id="iatt-out">No unambiguous context: bank stays in the middle, ambiguous.</div>
																<div class="attn-matrix" id="iatt-matrix" aria-live="polite"></div>
																<div class="prose-math attn-sum" id="iatt-sum" data-tex-display="true"></div>
															</div>
															<p class="step-note"><b>This is an intuition, not a real head.</b> A real head computes query, key, and value vectors, turns their dot products into weights with a softmax, and sums the value vectors.</p>
															<p class="step-note">Each head has one unit of attention. If it puts 80% on one word, only 20% remains for the others. Many heads can attend to different things.</p>
														</div>
					</section>

					<section class="section-block" id="layer-detail-section" data-chapter="Inside the transformer">
						<div class="section-kicker">The layer in detail · the MLP</div>
						<h2 class="section-title">FFN: a projection, a bias, a bend</h2>
						<div class="prose">
							<p>After attention, each token passes through its own small network, the MLP. It projects the vector, applies a nonlinearity, and projects back. The bend is what lets a straight cut separate what was inseparable.</p>
						</div>
						<div class="step-pane layer-pane" id="layer-detail">
															<div class="layer-formula-grid">
																<div class="layer-formula-card">
																	<div class="layer-card-title">Dense unit</div>
																	<div class="prose-math" data-tex="\underbrace{\text{dense}(x) = \text{activation}\!\left(\underbrace{W x + b}_{\text{learned linear map}}\right)}_{\text{a function with parameters } W,\ b}" data-tex-display="true"></div>
																</div>
																<div class="layer-formula-card">
																	<div class="layer-card-title">FFN</div>
																	<div class="prose-math" data-tex="\underbrace{\text{FFN}(x) = \text{dense}_2(\text{activation}(\text{dense}_1(x)))}_{\text{two dense units with an activation between them}}" data-tex-display="true"></div>
																</div>
															</div>
																														<details class="collapse-card">
																<summary class="cc-label">Worked example · 2 inputs, 2 outputs</summary>
																<div class="collapse-math" data-tex="\begin{aligned} W &amp;= \begin{pmatrix} 1 &amp; 2 \\ 0 &amp; -1 \end{pmatrix}, \quad x = \begin{pmatrix} 3 \\ 1 \end{pmatrix}, \quad b = \begin{pmatrix} 0 \\ -2 \end{pmatrix} \\[6pt] Wx &amp;= \begin{pmatrix} 1\cdot 3 + 2\cdot 1 \\ 0\cdot 3 + (-1)\cdot 1 \end{pmatrix} = \begin{pmatrix} 5 \\ -1 \end{pmatrix} \\[6pt] z = Wx + b &amp;= \begin{pmatrix} 5 \\ -1 \end{pmatrix} + \begin{pmatrix} 0 \\ -2 \end{pmatrix} = \begin{pmatrix} 5 \\ -3 \end{pmatrix} \\[6pt] \operatorname{ReLU}(z) &amp;= \begin{pmatrix} 5 \\ 0 \end{pmatrix} \end{aligned}"></div>
																<p>Each output is a dot product plus a bias, then the activation. The matrix above shows the arithmetic.</p>
															</details>
															<h3 class="layer-subhead">Depth without a nonlinearity</h4>
																														<details class="collapse-card">
																<summary class="cc-label">two dense layers without a nonlinearity</summary>
																<div class="collapse-math" id="collapse-math" data-tex="\begin{aligned} \operatorname{dense}_2(\operatorname{dense}_1(x)) &amp;= W_2(W_1 x + b_1) + b_2 \\ &amp;= (W_2 W_1)x + (W_2 b_1 + b_2) \\ &amp;= Wx + b \\[4pt] W &amp;= W_2 W_1, \qquad b = W_2 b_1 + b_2 \end{aligned}"></div>
																<p>Without a nonlinearity, two layers collapse into one. Depth adds no expressive power.</p>
															</details>
															<h3 class="layer-subhead">Nonlinear activation functions</h4>
															<div class="activation-card">
																<div class="activation-copy">
																	<p>A nonlinearity is applied to each coordinate after the projection. ReLU folds at zero; sigmoid and tanh bend smoothly; GELU is smooth but not monotonic.</p>
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
															<h3 class="layer-subhead">Where the bend happens</h4>
															<p class="step-note curve-intro">After attention, the MLP moves the token toward a region where the next token is easier to separate.</p>
															<div class="demo demo--paper demo--canvas ism-panel" data-arrow-nav style="margin-top:14px">
																<div class="demo-head">
																	<div>
																		<p class="demo-title">Watch the MLP bend the space <span>· demo 07</span></p>
																		<p class="demo-sub">A straight line is the easiest separator, but it is not always possible in the original space. The MLP lifts the points into a new plane where it becomes possible. In an LLM the same idea runs in thousands of dimensions and helps the model isolate and represent internal states.</p>
																	</div>
										</div>
																<div class="demo-body">
																	<div id="ism-copy" class="ism-copy" aria-live="polite">
																		<div id="ism-title" class="ism-title"></div>
																		<div id="ism-body" class="ism-body"></div>
																	</div>
																	<div class="ism-stage" id="ism-stage">
																		<div id="ism-wrap" class="ism-wrap" style="height:clamp(360px, 55vw, 480px)">
																			<canvas id="ism-canvas" style="display:block;width:100%;height:100%" aria-label="An animated point cloud: a coral core inside a blue ring is lifted into a curved shell until a flat plane separates the two classes">An animated point cloud shows a coral core inside a blue ring being bent into a curved shell until a flat plane separates them.</canvas>
																		<div id="ism-canvas-status" class="ism-canvas-status" aria-live="polite" hidden></div>
																		</div>
																		<aside id="ism-side" class="ism-side">
																			<div id="ism-dense-controls" class="ism-dense-controls" hidden></div>
																			<div id="ism-formulas" class="ism-formulas" aria-live="polite"></div>
																		</aside>
																	</div>
																	<div class="ism-controls">
																		<button type="button" id="ism-prev" data-arrow-prev class="ism-btn ism-btn--nav" aria-label="Previous step">← Back</button>
																		<button type="button" id="ism-next" data-arrow-next class="ism-btn ism-btn--nav" disabled aria-label="Next step">Next →</button>
																		<button type="button" id="ism-reset-camera" class="ism-btn" aria-label="Reset view" title="Reset view">⟲</button>
																		<div id="ism-dots" class="ism-dots" role="group" aria-label="Slides"></div>
																		<span id="ism-counter" class="ism-counter">1 / 9</span>
																	</div>
																</div>
																<div class="demo-insight"><b>Takeaway</b><span>The layers in an MLP lift the points into a higher-dimensional space where a straight line can separate what was inseparable before. They change the space in which the cut is made.</span></div>
															</div>
															<p class="step-note">Real models do this in thousands of dimensions. Separation and translation are two views of the same learned transformation.</p>
															<p class="step-note curve-source">Visual idea after C. Keup &amp; M. Helias, <em>Origami in N dimensions</em> (<a href="https://arxiv.org/abs/2203.11355" rel="noopener">arXiv:2203.11355</a>).</p>
														</div>
					</section>

					<section class="section-block" id="step-ffn-section" data-chapter="Inside the transformer">
						<div class="section-kicker">Step 5 · Feed-forward</div>
						<h2 class="section-title">FFN: a pattern matches, a value is written</h2>
						<div class="prose">
							<p>The feed-forward network works on each token separately. It expands the vector, applies an activation, and projects back. Attention mixes tokens; the FFN computes within a token.</p>
						</div>
						<div class="step-pane" id="step-ffn">
															<div class="step-stage">
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
																		<div class="ffn-pill is-fire">richer or more specific vector</div>
																	</div>
																</div>
																<div class="step-out" id="iffn-out"></div>
																<p class="step-note ffn-caveat"><b>What is simplified:</b> a real FFN has no labelled keys or values. The patterns are learned directions in W₁; the pull is a learned direction in W₂.</p>
															</div>
														</div>
						<div class="prose">
							<h3 class="layer-subhead">One layer is a small function</h4>
														<p>A simple layer does not need to be complicated. It multiplies its input by a learned matrix W, adds a learned vector b, and passes the result through an activation function. The activation adds a bend, a nonlinearity. Without it, any number of dense units would collapse into one linear map.</p>
							<p>A simple layer can look like this: one matrix, one bias, one activation. That is a dense unit. It is the basic building block; a transformer layer later combines self-attention and an FFN.</p>
							<p>Real networks combine building blocks differently. A convolutional layer is built for images, an attention layer for sequences, a dense layer for tables of numbers. A transformer layer is not one dense unit: it combines self-attention, which mixes information between tokens, with an FFN, which is itself a small stack of dense units. They share the same idea: functions with parameters, trained on data so that their output gets closer to the right answer.</p>
														<div class="layer-formula-dense">
								<div class="layer-card-title">Dense unit</div>
								<div class="prose-math" data-tex="\underbrace{\text{dense}(x) = \text{activation}\!\left(\underbrace{W x + b}_{\text{learned linear map}}\right)}_{\text{a function with parameters } W,\ b}" data-tex-display="true"></div>
							</div>
						</div>
					</section>

					<section class="section-block" id="layer-stack" data-chapter="Inside the transformer">
						<div class="section-kicker"><span class="sk-num">04</span> The stack</div>
						<h2 class="section-title">One layer, then the stack.</h2>
						<div class="prose-math layer-stack-formula" data-tex="\underbrace{ \text{next word} = \text{unembed}\!\left( \underbrace{ \text{layer}_n\!\left(\cdots \text{layer}_2\!\left(\text{layer}_1\!\left( \underbrace{\text{embedding}(\text{tokenizer}(\text{context}))}_{\text{text becomes vectors}} \right)\right)\cdots\right) }_{\text{each layer mixes and rewrites the vectors}} \right) }_{\text{the whole model: text in, next token out}}" data-tex-display="true"></div>
						<div class="prose-math layer-stack-formula" data-tex="\underbrace{X_{\text{out}} = \text{layer}_n(\cdots \text{layer}_1(\underbrace{X_{\text{in}}}_{\text{one row per token}}))}_{\text{same shape, new values}}" data-tex-display="true"></div>
						<div class="layer-flow" role="img" aria-label="The model as a stack: tokenizer, embedding, N transformer layers, unembedding">
							<div class="lf-stage lf-stage--token"><span class="lf-num">01</span><b>Tokenizer</b><span>context → tokens</span></div>
							<span class="lf-arrow" aria-hidden="true">→</span>
							<div class="lf-stage lf-stage--embed"><span class="lf-num">02</span><b>Embedding</b><span>tokens → vectors</span></div>
							<span class="lf-arrow" aria-hidden="true">→</span>
							<div class="lf-stage lf-stage--layers"><span class="lf-num">03</span><b>Layers × N</b><span>Self-attention + FFN</span><span class="lf-stack-bars" aria-hidden="true"><i></i><i></i><i></i></span></div>
							<span class="lf-arrow" aria-hidden="true">→</span>
							<div class="lf-stage lf-stage--unembed"><span class="lf-num">04</span><b>Unembedding</b><span>vector → scores</span></div>
						</div>
						<div class="prose">
														<ol class="layer-flow-walk">
								<li><b>01 Tokenizer.</b> The context is split into tokens, and each token gets an ID. The <a href="#step-tokenize-section">tokenize demo</a> shows the step.</li>
								<li><b>02 Embedding.</b> Each ID points to a learned vector. The <a href="#step-embed-section">embedding demo</a> shows how meaning becomes geometry.</li>
								<li><b>03 Layers × N.</b> One layer is self-attention plus an FFN: attention mixes tokens, the FFN rewrites each vector. The same shape runs N times, each layer with its own weights. The <a href="#step-attention-section">attention demo</a> shows one head; the composition below shows the whole layer.</li>
								<li><b>04 Unembedding.</b> The last vector becomes scores over the vocabulary, and softmax turns them into a distribution. <a href="#last-step">The last step</a> shows the move from vector to word.</li>
							</ol>
													</div>
						<div class="prose">
							<h3 class="layer-subhead">Why scores become probabilities</h4>
														<p>Softmax turns arbitrary scores into something that behaves like a probability distribution. It exponentiates every score, so all values become positive, then divides by the sum. The exponential is monotone, so the largest score stays the largest; the division makes the results sum to one. Shifting every score by the same constant cancels in the ratio, so the absolute range of the scores does not matter. The base <span data-tex="e" data-tex-display="false"></span> is a convention: any positive base gives a valid distribution, but with <span data-tex="e" data-tex-display="false"></span> the derivative stays clean and the training signal well behaved. The name “softmax” comes from <a href="https://proceedings.neurips.cc/paper/1989/hash/0336dcbab05b9d5ad24f4333c7658a0e-Abstract.html" target="_blank" rel="noopener">Bridle (1990)</a>.</p>
														<div class="layer-formula-grid layer-formula-grid--three">
								<div class="layer-formula-card">
									<div class="layer-card-title">Self-attention</div>
									<div class="prose-math" data-tex="\underbrace{\text{self-attention}(X)_i = \sum_{\underbrace{j}_{\text{visible token }j}} \underbrace{\alpha_{ij}}_{\substack{\text{self-attention}\\\text{from }j\text{ to }i}} \underbrace{v_j}_{\text{value of token }j}}_{\text{token with number }i\text{ mixes in all visible tokens }j}" data-tex-display="true"></div>
									<div class="prose-math" data-tex="\alpha_{ij}\in[0,1], \qquad \sum_j \alpha_{ij}=1" data-tex-display="true"></div>
								</div>
								<div class="layer-formula-card">
									<div class="layer-card-title">FFN</div>
									<div class="prose-math" data-tex="\underbrace{\text{FFN}(x) = \text{dense}_2(\text{activation}(\text{dense}_1(x)))}_{\text{the simplest view: two dense units with an activation between them}}" data-tex-display="true"></div>
								</div>
								<div class="layer-formula-card">
									<div class="layer-card-title">Softmax</div>
									<div class="prose-math" data-tex="\underbrace{p_i = \frac{\exp(z_i)}{\sum_{j=1}^{V}\exp(z_j)}}_{\text{a positive distribution over the vocabulary}}" data-tex-display="true"></div>
								</div>
							</div>
							<p class="layer-formula-note">W, b, W1, and W2 are parameters; training adjusts them. activation() is a nonlinearity such as ReLU or GELU. Self-attention takes the whole matrix X (one row per token) and returns A with one row per token. The weights α_ij lie in [0,1] and sum to 1 for each i. The FFN then transforms each row A_i separately; it never receives the whole matrix. Softmax turns the final scores into a distribution over the vocabulary; it preserves their ranking.</p>
														<p>This is a coarse picture. Underneath, every step is a matrix of numbers; the formulas show the shape of the computation, not the implementation.</p>
														<div class="layer-formula-card layer-formula-card--layer layer-formula-wide">
								<div class="layer-card-title">The layer is the whole composition</div>
								<p class="layer-formula-wide-intro">A layer is not just attention and not just an FFN. It is the composition: attention mixes the tokens into A, then the FFN rewrites each row of A. The result is the next matrix X with the same shape. In a real block, residual connections and normalization wrap both steps; the formula keeps the shape visible.</p>
								<div class="prose-math" data-tex="\underbrace{\begin{aligned} A &= \text{self-attention}(X) \\ \text{layer}(X) &= \left. \begin{pmatrix} \text{FFN}(A_1) \\ \text{FFN}(A_2) \\ \text{FFN}(A_3) \\ \vdots \\ \text{FFN}(A_n) \end{pmatrix} \right\} \begin{matrix} \text{token 1} \\ \text{token 2} \\ \text{token 3} \\ \vdots \\ \text{token }n \end{matrix} \end{aligned}}_{\text{self-attention turns X into A; the FFN works on one row at a time}}" data-tex-display="true"></div>
							</div>
							<h3 class="layer-subhead">A language model combines these and other building blocks</h4>
														<p>A language model combines these building blocks into a transformer block: self-attention first asks how strongly each word is connected to every other word in the context, and the model learns those connections from data. An FFN then untangles the result: it folds the vectors into a higher-dimensional space, separates features, and folds them back. A real transformer layer also contains layer normalization, residual connections, and other pieces. They are left out here so the picture stays readable; the <a href="#step-residual-section">residual section</a> at the end of this chapter covers them in detail.</p>
							<p>At the start, a matrix X goes in: one row per token, each row a vector. At the end, a matrix of the same shape comes out, but the values have changed. The last token has absorbed the meaning of the whole context. The unembedding turns its vector into scores for every vocabulary token; those scores point to a region of token directions with small angles, and softmax draws one.</p>
														<h3 class="layer-subhead">How the context is mixed</h4>
														<p>Inside a layer, self-attention looks at the whole context. For every token, it scores how much that token should take from every other visible token. The scores form a token-by-token matrix: one row for the token asking, one column for the token answering. The <a href="#step-attention-section">self-attention demo below</a> shows one head doing this.</p>
														<div class="layer-mix">
								<div class="layer-matrix-card">
									<div class="layer-card-title">Causal self-attention</div>
																		<div class="layer-attn-matrix" role="img" aria-label="Token-by-token attention matrix with a masked upper triangle">
										<div class="lam-corner">Token</div>
																				<div class="lam-head">The</div>
																				<div class="lam-head">capital</div>
																				<div class="lam-head">of</div>
																				<div class="lam-head">France</div>
																														<div class="lam-label">The</div>
																																								<div class="lam-cell" style="--w:1">100%</div>
																																																		<div class="lam-cell is-masked" aria-hidden="true">—</div>
																																																		<div class="lam-cell is-masked" aria-hidden="true">—</div>
																																																		<div class="lam-cell is-masked" aria-hidden="true">—</div>
																																								<div class="lam-label">capital</div>
																																								<div class="lam-cell" style="--w:0.8">80%</div>
																																																		<div class="lam-cell" style="--w:0.2">20%</div>
																																																		<div class="lam-cell is-masked" aria-hidden="true">—</div>
																																																		<div class="lam-cell is-masked" aria-hidden="true">—</div>
																																								<div class="lam-label">of</div>
																																								<div class="lam-cell" style="--w:0.1">10%</div>
																																																		<div class="lam-cell" style="--w:0.3">30%</div>
																																																		<div class="lam-cell" style="--w:0.6">60%</div>
																																																		<div class="lam-cell is-masked" aria-hidden="true">—</div>
																																								<div class="lam-label">France</div>
																																								<div class="lam-cell" style="--w:0.05">5%</div>
																																																		<div class="lam-cell" style="--w:0.45">45%</div>
																																																		<div class="lam-cell" style="--w:0.1">10%</div>
																																																		<div class="lam-cell" style="--w:0.4">40%</div>
																																							</div>
									<div class="layer-matrix-legend">
										<span><i></i>row = token asking</span>
										<span><i></i>column = token answering</span>
										<span><i class="is-mask"></i>masked = future token</span>
									</div>
								</div>
								<div class="layer-mix-card">
									<div class="layer-card-title">The mix</div>
									<div class="prose-math" data-tex="\underbrace{ \text{new}_2 = \underbrace{0.2 \cdot \text{token}_2 + 0.8 \cdot \text{token}_1}_{\text{weighted mix of visible vectors}} }_{\text{token 2 after attention}}" data-tex-display="true"></div>
									<p class="layer-mix-note">Token 2 reads token 1 and itself. It cannot read token 3, because token 3 comes later. The upper triangle is masked.</p>
								</div>
							</div>
							<h3 class="layer-subhead">Each head looks from a different perspective</h4>
														<p>Attention does not choose its weights from a fixed list. It learns, from the loss, which aspects of the visible tokens help predict the next token. With enough data, memorizing every training sentence is not an option, so the model is pushed toward reusable structure: gender, age, syntactic role, topic, or whatever else lowers the loss. Each head can look at the same tokens from a different perspective: one head can track a pronoun, another a verb, another the topic, and each can ignore what the others use.</p>
														<div class="attention-aspects" role="img" aria-label="Three heads look at the same tokens from different perspectives: pronoun, verb, and topic">
								<div class="attention-aspect"><span class="aa-head">Head 1</span><b>pronoun</b><span>“it” → “bank”</span></div>
								<div class="attention-aspect"><span class="aa-head">Head 2</span><b>verb</b><span>“sat” → “bank”</span></div>
								<div class="attention-aspect"><span class="aa-head">Head 3</span><b>topic</b><span>“river” → “bank”</span></div>
							</div>
							<p class="attention-aspects-note">A sketch, not measured weights: the heads see the same tokens, but each can attend to something else.</p>
														<div class="pullquote">
								“To think is to forget a difference, to generalize, to abstract. In the overly replete world of Funes there were nothing but details, almost contiguous details.”
								<cite>Jorge Luis Borges, “Funes the Memorious” (1942) · <a href="https://bvpadreseijas.files.wordpress.com/2013/05/funeselmemorioso.pdf" target="_blank" rel="noopener">Spanish original</a></cite>
							</div>
							<p>Borges's Funes remembers everything and therefore cannot think. To think, he has to forget differences, generalize, and abstract; the story's point is not that memory is bad, but that thinking needs a cut. An LLM does the same at two scales. The model as a whole does not store every fact; it learns compressed regularities. A single head does not need to represent everything at once; it can focus on one aspect and ignore the rest. The stack then recombines the cuts into a rich context.</p>
																					<p>The first layer mixes the original token vectors. Later layers mix vectors that earlier layers have already changed, so every pass sees a different context. In an autoregressive model the matrix is lower-triangular: a token can attend to itself and earlier tokens, never to tokens that come later. That causal mask is what lets the model train on every prefix of a sentence and predict the next token without seeing the future.</p>
							<p>After attention, each token's new vector goes through a feed-forward network. The FFN works on one token at a time: it separates features and rewrites the vector. Attention moves information between tokens; the FFN transforms what each token carries. The <a href="#step-ffn-section">FFN section</a> opens that step.</p>
							<h3 class="layer-subhead">Local meaning, then wider context</h4>
							<p>Early layers can learn local patterns. One layer may notice that “new” and “york” belong together; a later layer can use that combined meaning as a new unit and mix it with a wider context. A single layer can solve a small task, or several layers can solve one together. Deep models work by composing these small transformations.</p>
							<p>The stack repeats. Each layer has its own learned weights, so the structure is shared but the parameters are not. After the last layer, the unembedding reads the last token's vector and produces a distribution over the next token. The <a href="#block-repeat">real GPT-2 trajectories below</a> show the movement through 12 of these blocks; <a href="#last-step">the last step</a> turns the final vector into a word.</p>
														<div class="prose-math layer-stack-formula" data-tex="\underbrace{p(\text{next} \mid \text{context}) = \text{softmax}(\underbrace{W_U\, h_{\text{last}}}_{\text{scores for every token}})}_{\text{the vector points to a region of token directions, then one is drawn}}" data-tex-display="true"></div>
						</div>
						<div id="step-residual-section">
							<div class="section-kicker">Step 6 · Residual</div>
							<h3 class="section-title">Residual stream: every layer adds to the same stream</h3>
							<div class="prose">
								<p>Every layer reads the same running vector, computes an update, and adds it back. Think of a shared notebook: earlier notes stay, later layers read them and add more. The new state is the old state plus a change.</p>
							</div>
							<div class="prose-math" data-tex="\begin{aligned} x_1 &amp;= x_0 + \underbrace{\operatorname{layer}_1(\underbrace{x_0}_{\text{token vector}})}_{\text{what layer 1 adds}} \\ x_2 &amp;= x_1 + \underbrace{\operatorname{layer}_2(\underbrace{x_1}_{\text{running vector}})}_{\text{what layer 2 adds}} \end{aligned}" data-tex-display="true"></div>
							<p>The new state is the old state plus what the layer adds. The demos are simplified; the order is the real architecture.</p>
							<div class="step-pane" id="step-residual">
								<div class="step-stage">
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
											<div class="prose-math" data-tex="\underbrace{x_{n+1}}_{\text{new stream}} = \underbrace{x_n}_{\text{running stream}} + \underbrace{\operatorname{layer}_{n+1}(x_n)}_{\text{what this layer writes}}" data-tex-display="true"></div>
										</div>
									</div>
								</div>
								<p class="step-note">Nothing is overwritten, so the original signal survives and gradients have a short path back. That is why deep networks train.</p>
							</div>
						</div>
					</section>

					<section class="section-block" id="block-repeat" data-chapter="Inside the transformer">
						<div class="section-kicker"><span class="sk-num">05</span> The block repeats</div>
						<h2 class="section-title">The whole block: attention + FFN, again and again</h2>
						<div class="prose">
							<p>Attention and the FFN are one transformer block. The same architecture runs again and again, but each layer has its own learned weights and its own learned vectors. The block repeats in structure, not in parameters. Each pass lets every token look at the context, then moves it through its own MLP.</p>
							<p>Below, real GPT-2 trajectories show the same movement. Each line is one token, each bend is one block. The vectors live in 768 dimensions, too many to picture, so the plot projects them down to three. What you see is not the real motion but its PCA shadow. The angular view is the default because the model compares directions, and “plausible” means the continuation is frequent in its training data, not that it is true.</p>
						</div>

						<div class="demo demo--paper demo--canvas" id="block-trajectory-real">
							<div class="demo-head">
								<div>
									<p class="demo-title">Token trajectories through GPT-2 <span>· real PCA</span></p>
									<p class="demo-sub">Real hidden states from GPT-2 small for “The capital of France is”. Each line follows one token through the embedding and 12 blocks. Each state has 768 dimensions, too many to picture, so this is not the real motion: PCA keeps the three directions where the states change most and flattens everything onto them. The 3D points are a shadow. Lines that cross here need not touch in the full space, and a flat-looking bend can hide a large move.</p>
								</div>
								<span class="demo-badge">GPT-2 · PCA</span>
							</div>
							<div class="demo-body">
								<div id="real-trajectory-3d" class="traj-plotly-host" role="img" aria-label="3D token trajectories through GPT-2, PCA-reduced to three dimensions"><div class="traj-loading"><span class="traj-loader-spinner" aria-hidden="true"></span><span>Loading GPT-2 trajectories …</span></div></div>
								<div class="demo-controls traj-step-controls">
									<label class="traj-slider-label" for="traj-layer-slider">Layer
										<input type="range" id="traj-layer-slider" min="0" max="12" step="1" value="0">
										<output id="traj-layer-label">Embedding</output>
									</label>
									<div class="seg traj-metric-switch" id="traj-metric" role="group" aria-label="Distance metric">
										<button type="button" data-metric="euclidean" aria-pressed="false">Euclidean (PCA)</button>
										<button class="is-on" type="button" data-metric="angular" aria-pressed="true">Great-circle / angle</button>
									</div>
									<button class="btn-demo btn-demo--green traj-next-btn" type="button" id="traj-next-layer">Next layer →</button>
								</div>
								<p class="traj-metric-note">Euclidean distance measures the straight-line gap, like a tape measure. The model compares directions: in the angular view every vector is normalized to the unit sphere, where the angle is the metric that matters. The real model does this in 768 dimensions; the 3D sphere is its PCA shadow.</p>
								<div class="traj-candidates" id="traj-candidates" aria-live="polite"></div>
							</div>
							<div class="demo-foot">Real GPT-2 small hidden states, normalized per layer and PCA-reduced to 3D. Drag the slider to move through the layers. The next-token candidates appear at the final layer; the highlighted one is the model's top choice.</div>
						</div>
					</section>

					<section class="section-block" id="last-step" data-chapter="From vector to word">
						<div class="section-kicker"><span class="sk-num">06</span> The last step</div>
						<h2 class="section-title">The final vector picks a word.</h2>
						<div class="prose">
																					<p>The last token carries the whole context in its final vector <span class="nt-formula" data-tex="\mathbf{h}" data-tex-display="false"></span>. A learned unembedding matrix <span class="nt-formula" data-tex="W_U" data-tex-display="false"></span> turns it into one score per vocabulary token.</p>
							<p><span class="nt-formula" data-tex="W_U" data-tex-display="false"></span> has one row <span class="nt-formula" data-tex="\mathbf{w}_i" data-tex-display="false"></span> per token. The dot product <span class="nt-formula" data-tex="\mathbf{h} \cdot \mathbf{w}_i" data-tex-display="false"></span> is the logit <span class="nt-formula" data-tex="z_i" data-tex-display="false"></span>; the vector <span class="nt-formula" data-tex="\mathbf{z}" data-tex-display="false"></span> collects all logits. After normalization, that dot product is the cosine of the angle between <span class="nt-formula" data-tex="\mathbf{h}" data-tex-display="false"></span> and <span class="nt-formula" data-tex="\mathbf{w}_i" data-tex-display="false"></span>; the great-circle view shows that angle.</p>
							<p>In GPT-2 <span class="nt-formula" data-tex="W_U" data-tex-display="false"></span> is often tied to the input embedding matrix, but it is still a learned matrix.</p>
														<div class="prose-math" data-tex="\underbrace{ \underbrace{\mathbf{z}}_{\text{all vocabulary logits}} = \underbrace{\mathbf{h}}_{\text{final context vector}} \underbrace{W_U^{\top}}_{\substack{\text{transpose of }W_U\\\text{the learned unembedding matrix}}} }_{\text{one matrix-vector product gives a score for every token}}" data-tex-display="true"></div>
							<div class="prose-math" data-tex="\underbrace{z_i = \underbrace{\mathbf{h}}_{\text{final context vector}} \cdot \underbrace{\mathbf{w}_i}_{\text{row }i\text{ of }W_U}}_{\text{logit for token }i}" data-tex-display="true"></div>
														<p>Softmax turns the logits into probabilities: <span class="nt-formula" data-tex="p_i = \exp(z_i)/Z" data-tex-display="false"></span>, where <span class="nt-formula" data-tex="Z" data-tex-display="false"></span> sums over the whole vocabulary. Why not simply divide each logit by the sum? Logits can be negative or zero, so the result would not be a probability. The exponential makes every value positive and preserves the order; dividing by the sum gives numbers between 0 and 1 that add to 1. It also turns differences into ratios: adding the same constant to every logit changes nothing. The largest score gets the most mass, but the alternatives keep some.</p>
														<div class="prose-math" data-tex="\underbrace{p_i = \frac{\exp(z_i)}{\underbrace{Z}_{\text{normalizer}}}, \qquad \underbrace{Z = \sum_{j=1}^{V} \exp(z_j)}_{\text{sum over all }V\text{ vocabulary entries}}}_{\text{softmax: a distribution over the vocabulary}}" data-tex-display="true"></div>
														<p>Geometrically, <span class="nt-formula" data-tex="\mathbf{h}" data-tex-display="false"></span> points to a region of token directions. Each token owns a region; near a seam two words are almost equally likely. More tokens shrink the cells, but the seams never close. <a href="https://arxiv.org/abs/2603.22301" rel="noopener">Mabrok (2026)</a> calls the band around a seam the expressibility gap.</p>
													</div>

						<div class="demo demo--paper demo--canvas" id="meadow-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">The map of words <span>· demo 08</span></p>
									<p class="demo-sub">Every word owns a cell. Move the pointer; the thought falls into the nearest cell. The golden seams are where two words are equally near.</p>
								</div>
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
								<p class="meadow-caption" id="md-caption">Move the pointer across the map.</p>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Words divide the space of thoughts into cells. Certainty is being deep inside a cell; uncertainty is standing on a seam or right at the edge. The model can think more finely than one word can say.</span></div>
							<div class="demo-foot">More words make smaller cells and thinner seams, but the ambiguous share never reaches zero. In a real model the space has thousands of dimensions and the vocabulary has tens of thousands of tokens.</div>
						</div>

						<div class="demo demo--paper demo--plot softmax-demo" id="softmax-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">From logits to a probability distribution <span>· demo 09</span></p>
									<p class="demo-sub">Real GPT-2 small scores for two prompts. The left side is the raw logit from each dot product; the right side is what softmax makes of it. Switch the context and watch the whole distribution change.</p>
								</div>
								<span class="demo-badge">real GPT-2</span>
							</div>
							<div class="demo-body">
								<div class="chip-row softmax-prompts" id="softmax-prompts">
									<button class="chip is-on" type="button" data-softmax-prompt="spaceship">spaceship</button>
									<button class="chip" type="button" data-softmax-prompt="planet">deserted planet</button>
								</div>
								<p class="softmax-context"><span class="softmax-context-label">context</span> <span id="softmax-context-text">“As the spaceship was approaching <b>the</b>”</span></p>
								<div class="prose-math softmax-logit-matrix" id="softmax-logit-matrix" data-tex-display="true"></div>
								<div class="softmax-stage" id="softmax-stage">
									<div class="softmax-col softmax-col--logits">
										<div class="softmax-col-head"><span>token</span><span>logit</span></div>
										<div id="softmax-logits"></div>
									</div>
									<svg class="softmax-ribbons" id="softmax-ribbons" aria-hidden="true">
										<defs>
											<linearGradient id="softmax-ribbon-grad" x1="0" y1="0" x2="1" y2="0">
												<stop offset="0%" style="stop-color:var(--tm-green)"></stop>
												<stop offset="100%" style="stop-color:var(--tm-petrol-mid)"></stop>
											</linearGradient>
										</defs>
									</svg>
									<div class="softmax-col softmax-col--probs">
										<div class="softmax-col-head"><span>probability</span><span>softmax</span></div>
										<div id="softmax-probs"></div>
									</div>
								</div>
								<div class="demo-controls">
									<label>Temperature <input type="range" id="softmax-temp" min="0.2" max="2" step="0.05" value="1"><output id="softmax-temp-out">1.00</output></label>
								</div>
								<div class="demo-readout demo-readout--4">
									<div><b>Hovered token</b><span id="softmax-token">—</span></div>
									<div><b>Logit</b><span id="softmax-logit">—</span></div>
									<div><b>exp((logit − max) / T)</b><span id="softmax-exp">—</span></div>
									<div><b>Probability</b><span id="softmax-prob">—</span></div>
								</div>
								<p class="demo-hint">Hover a token. The ribbon shows how its score becomes probability. The temperature slider changes only the softmax, not the logits.</p>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Softmax does not create the ranking; the dot products do. It turns scores into a distribution that sums to one, and temperature decides how sharply the winner is favoured.</span></div>
							<div class="demo-foot">Real GPT-2 small logits for “As the spaceship was approaching the”, from the <a href="https://poloclub.github.io/transformer-explainer/" rel="noopener">Transformer Explainer</a> (Polo Club, Georgia Tech). The absolute logit offset is arbitrary; softmax depends only on differences.</div>
						</div>
					</section>

					<section class="section-block" id="whole" data-chapter="From vector to word">
						<div class="section-kicker"><span class="sk-num">07</span> The whole loop</div>
						<h2 class="section-title">Text in, geometry, one word out.</h2>
												<div class="prose">
														<p>The pieces fit in a fixed order: <strong>text → tokens → vectors → position → attention + residual → FFN → distribution → draw → append</strong>. The loop ends when the model emits the special token <strong>&lt;|endoftext|&gt;</strong>.</p>
							<p>No step has a tidy fact database. Knowledge is distributed across the weights, and meaning lives in the geometry. A pile of numbers becomes a sentence one token at a time.</p>
													</div>
						<div class="keypoints">
							<div class="keypoint"><b>What it is</b><span>A next-token predictor: one distribution, one draw, one append, repeated.</span></div>
							<div class="keypoint"><b>Why it works</b><span>More context and more layers narrow the distribution, so the next token becomes easier to choose.</span></div>
							<div class="keypoint"><b>Its limits</b><span>It predicts plausible text. It can be fluent and wrong, and it offers no guarantee of truth.</span></div>
														<div class="keypoint"><b>The fixed order</b><span><strong>text → tokens → vectors → position → attention + residual → FFN → distribution → draw → append</strong>. The loop ends when the model emits <strong>&lt;|endoftext|&gt;</strong>.</span></div>
													</div>
					</section>

<div class="mn-quiz" data-quiz="intuition"><script type="application/json">{"title": "How an LLM writes", "questions": [{"q": "At its core, what does a large language model do at every step?", "options": ["Predict a probability for every possible next token", "Look the likely answer up in a large text database", "Plan the entire answer first, then write it down", "Translate the question into formal logic and solve it"], "answer": 0, "explain": "An LLM is a next-token predictor: it outputs a probability distribution over its vocabulary, picks one token, and repeats."}, {"q": "What happens to a token right after the model has produced it?", "options": ["It is appended to the input as context for the next prediction", "It is discarded once the next token has been chosen by the model", "It is checked against a dictionary of allowed words and meanings", "It is sent back into the training data for another update pass"], "answer": 0, "explain": "This is the autoregressive loop: the output becomes part of the input, one step later."}, {"q": "What is the first step that turns raw text into something the network can compute with?", "options": ["Tokenization — splitting the text into pieces with numeric ids", "Attention — weighting each word by its relevance to the query", "Sampling — drawing the most likely next word from the distribution", "Back-propagation — adjusting the weights from the loss gradient"], "answer": 0, "explain": "Text is first cut into tokens; each token id is then mapped to an embedding vector."}, {"q": "Inside each transformer layer, which part lets a word take information from the *other* words in the context?", "options": ["The attention mechanism", "The feed-forward network", "The input tokenizer stage", "The final softmax layer"], "answer": 0, "explain": "Attention asks “which other words matter for this word?”; the feed-forward part then works on each position separately."}]}</script></div>

</article>
</div>

<script type="application/json" id="gpt2-pca-data">{"sentence": "The capital of France is", "tokens": ["The", " capital", " of", " France", " is"], "ids": [464, 3139, 286, 4881, 318], "layers": ["Embedding + position", "Block 1", "Block 2", "Block 3", "Block 4", "Block 5", "Block 6", "Block 7", "Block 8", "Block 9", "Block 10", "Block 11", "Block 12"], "points": [[[-0.3471, -0.8096, 0.2115], [-0.6593, -0.211, -0.0394], [-0.6764, -0.2625, -0.0394], [-0.6951, 0.2452, -0.1424], [-0.6972, 0.2442, -0.1426], [-0.696, 0.2454, -0.1423], [-0.6931, 0.2477, -0.1418], [-0.6907, 0.2495, -0.1408], [-0.6888, 0.2513, -0.1391], [-0.6866, 0.2531, -0.1371], [-0.6848, 0.2545, -0.1361], [-0.682, 0.2568, -0.1333], [-0.6187, 0.2614, -0.1182]], [[-0.195, -0.9765, 0.1725], [0.2369, -0.2199, -0.21], [0.3837, -0.3651, -0.166], [0.3464, -0.2752, -0.1477], [0.3655, -0.287, -0.1155], [0.3446, -0.2389, -0.1081], [0.2728, -0.1175, -0.0563], [0.245, -0.0504, 0.0138], [0.2098, 0.0315, 0.1633], [0.1878, 0.0924, 0.246], [0.1908, 0.1183, 0.3141], [0.1422, 0.1851, 0.4405], [0.1004, 0.1329, 0.5923]], [[-0.3086, -0.9404, 0.2736], [0.1635, -0.0193, -0.3349], [0.2698, -0.0905, -0.386], [0.2752, -0.0491, -0.4003], [0.2486, -0.019, -0.3708], [0.2426, 0.001, -0.3648], [0.2252, 0.0445, -0.3008], [0.2276, 0.106, -0.1669], [0.1847, 0.1751, -0.0311], [0.1776, 0.2134, 0.1308], [0.1543, 0.2291, 0.2199], [0.1041, 0.2664, 0.3978], [0.0668, 0.1677, 0.5828]], [[-0.2823, -1.0, 0.2055], [0.1891, -0.1032, -0.2037], [0.2811, -0.1456, -0.1811], [0.2504, -0.0774, -0.1711], [0.267, -0.074, -0.1515], [0.2118, 0.0111, -0.1282], [0.1711, 0.0978, -0.065], [0.1564, 0.164, 0.0575], [0.1507, 0.1971, 0.169], [0.1315, 0.2047, 0.2125], [0.1408, 0.2132, 0.2665], [0.1317, 0.2466, 0.4238], [0.0686, 0.1452, 0.6055]], [[-0.3328, -0.9319, 0.2659], [0.1792, 0.0099, -0.3359], [0.2581, -0.0296, -0.3701], [0.2418, 0.0081, -0.3782], [0.1909, 0.0754, -0.3472], [0.1545, 0.137, -0.2952], [0.1915, 0.1396, -0.2517], [0.2004, 0.2089, -0.073], [0.1698, 0.2453, 0.0444], [0.1587, 0.264, 0.1754], [0.1483, 0.2599, 0.2912], [0.1308, 0.2486, 0.462], [0.0943, 0.1445, 0.6255]]], "explained": [0.225, 0.1785, 0.1349], "landmarks": [{"word": " the", "value": [-0.3445, -0.2858, 0.2668], "p": 0.084654}, {"word": " now", "value": [-0.2676, -0.4073, 0.1668], "p": 0.047577}, {"word": " a", "value": [-0.3457, -0.3141, 0.2525], "p": 0.04621}, {"word": " France", "value": [-0.2629, -0.5878, 0.1754], "p": 0.031875}, {"word": " Paris", "value": [-0.2537, -0.5461, 0.1589], "p": 0.031726}, {"word": " in", "value": [-0.362, -0.3362, 0.3113], "p": 0.02672}, {"word": " also", "value": [-0.291, -0.4294, 0.1881], "p": 0.026292}, {"word": " not", "value": [-0.3338, -0.3821, 0.1969], "p": 0.023788}], "top": [{"id": 262, "token": " the", "p": 0.084654}, {"id": 783, "token": " now", "p": 0.047577}, {"id": 257, "token": " a", "p": 0.04621}, {"id": 4881, "token": " France", "p": 0.031875}, {"id": 6342, "token": " Paris", "p": 0.031726}, {"id": 287, "token": " in", "p": 0.02672}, {"id": 635, "token": " also", "p": 0.026292}, {"id": 407, "token": " not", "p": 0.023788}], "chosen": " the"}
</script>
<?php js("intuition_word_meadow"); ?>
<?php js("intuition_tm_page"); ?>
