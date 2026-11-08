<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="A ten-minute interactive introduction to next-token prediction, the loop behind large language models.">
	<meta name="theme-color" content="#ffffff">
	<title>One Word at a Time | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
	<link rel="stylesheet" href="../Temml-Local.min.css">
	<style>
		.traj-demo-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr); gap: 12px; }
		.traj-panel { border: 1px solid var(--tm-line); background: var(--tm-paper); padding: 10px 10px 6px; min-width: 0; }
		.traj-panel-title { margin: 0 0 6px; font: 700 0.72rem/1.2 var(--tm-display); letter-spacing: 0.06em; text-transform: uppercase; color: var(--tm-muted); }
		.traj-panel canvas { display: block; width: 100%; height: 300px; }
		.traj-quote { margin: 8px 0 0; font: italic 0.82rem/1.4 var(--tm-prose); color: var(--tm-muted); }
		.traj-quote span { font-style: normal; color: var(--tm-faint); }
		.traj-angle-list { display: flex; flex-wrap: wrap; gap: 4px 10px; margin-top: 6px; font: 600 0.72rem/1.4 var(--tm-ui); color: var(--tm-muted); }
		.traj-angle-list .is-chosen { color: var(--tm-green); font-weight: 700; }
		.iso-main { min-width: 0; }
		.tt-plot-wrap { position: relative; min-width: 0; }
		.tt-echarts-host { width: 100%; height: 380px; min-height: 320px; background: radial-gradient(circle at 50% 42%, var(--tm-wash), transparent 66%); }
		.tt-echarts-host canvas { display: block; }
		.tt-ball {
			position: absolute;
			left: 0;
			top: 0;
			width: 18px;
			height: 18px;
			border-radius: 50%;
			background: radial-gradient(circle at 32% 26%, #ffffff 0 16%, var(--tm-green) 40%, var(--tm-blue) 100%);
			box-shadow: 0 0 0 2px var(--tm-paper),
				0 0 14px color-mix(in srgb, var(--tm-green) 65%, transparent),
				0 0 34px color-mix(in srgb, var(--tm-blue) 45%, transparent);
			transform: translate(-50%, -50%);
			opacity: 0;
			pointer-events: none;
			z-index: 2;
			transition: opacity 0.25s ease;
		}
		.tt-ball.is-visible { opacity: 1; }
		.tt-ball::after {
			content: "";
			position: absolute;
			inset: -7px;
			border: 1px solid color-mix(in srgb, var(--tm-green) 45%, transparent);
			border-radius: 50%;
			animation: ttBallPulse 2.6s ease-in-out infinite;
		}
		.tt-ball-label {
			position: absolute;
			left: 50%;
			top: 50%;
			transform: translate(15px, -50%);
			padding: 0.18em 0.38em;
			border: 1px solid var(--tm-green);
			background: var(--tm-paper);
			box-shadow: var(--tm-shadow);
			color: var(--tm-ink);
			font: 700 0.62rem/1 var(--tm-ui);
			letter-spacing: 0.04em;
			text-transform: uppercase;
			white-space: nowrap;
		}
		.tt-labels { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
		.tt-point-label {
			position: absolute;
			left: 0;
			top: 0;
			transform: translate(-50%, calc(-100% - 8px));
			padding: 2px 5px;
			border: 1px solid var(--tm-line-strong);
			background: var(--tm-paper);
			box-shadow: var(--tm-shadow);
			color: var(--tm-ink);
			font: 700 0.66rem/1.1 var(--tm-ui);
			white-space: nowrap;
		}
		.tt-point-label.is-current { border-color: var(--tm-green); color: var(--tm-green-deep); }
		.tt-point-label.is-future { color: var(--tm-muted); }
		.tt-point-label--alt {
			transform: translate(-50%, 8px);
			border-color: var(--tm-gold);
			color: var(--tm-ink);
			font-weight: 600;
		}
		@keyframes ttBallPulse {
			0%, 100% { opacity: 0.35; transform: scale(0.92); }
			50% { opacity: 0.9; transform: scale(1.12); }
		}
		@media (prefers-reduced-motion: reduce) {
			.tt-ball::after { animation: none; }
		}
		.tt-fallback { display: flex; align-items: center; justify-content: center; height: 100%; padding: 24px; text-align: center; color: var(--tm-muted); font: 0.86rem/1.5 var(--tm-ui); }
		.tt-legend { display: flex; flex-wrap: wrap; gap: 5px 14px; margin-top: 8px; font: 600 0.7rem/1.35 var(--tm-ui); color: var(--tm-muted); }
		.tt-legend-item { display: inline-flex; align-items: center; gap: 5px; }
		.tt-swatch { width: 10px; height: 10px; border-radius: 2px; border: 1px solid var(--tm-line-strong); flex: 0 0 auto; }
		.tt-swatch--deep { background: var(--tm-blue); }
		.tt-swatch--side { background: var(--tm-gold); }
		.tt-swatch--base { background: var(--tm-paper-2); }
		.tt-token-row { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
		.tt-token { appearance: none; border: 1px solid var(--tm-line-strong); background: var(--tm-paper-2); color: var(--tm-muted); font: 600 0.72rem/1.2 var(--tm-mono); padding: 0.32em 0.55em; cursor: pointer; }
		.tt-token:hover { border-color: var(--tm-blue); color: var(--tm-ink); }
		.tt-token.is-current { border-color: var(--tm-green); background: var(--tm-green); color: #ffffff; }
		@media (max-width: 720px) {
			.traj-demo-grid { grid-template-columns: 1fr; }
			.traj-panel canvas { height: 260px; }
			.tt-echarts-host { height: 320px; min-height: 280px; }
		}
	</style>
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
					<section class="section-block" id="idea" data-chapter="The loop" data-chapter-de="Die Schleife">
						<div class="section-kicker"><span class="sk-num">01</span> The idea</div>
						<h2 class="section-title">A first intuition: predict the next word.</h2>
						<div class="prose">
							<p>Ask your phone a question. The answer appears one word at a time. Under the hood, the model is doing one thing: predicting the next token.</p>
							<p>A large language model is a program trained on text. It returns a probability for every possible next token. Pick one, append it, and run again. That is the autoregressive loop. How does a pile of numbers become a sentence? Follow one token through the machine.</p>
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

					<section class="section-block" id="code" data-chapter="The loop" data-chapter-de="Die Schleife">
						<div class="section-kicker">Next step · code</div>
						<h2 class="section-title">It also writes code.</h2>
						<div class="prose">
							<p>The same loop writes code. The model predicts the tokens; Python runs the program. Code is just another sequence with strong regularities.</p>
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
										<div class="code-demo-bar"><span class="code-demo-dot is-green"></span><span class="code-demo-dot is-gold"></span><span class="code-demo-dot is-sky"></span><span class="code-demo-name" data-en="sky.py" data-de="himmel.py">sky.py</span></div>
										<div class="code-demo-chat">
											<div class="code-demo-msg is-user">Write a Python program that calculates how strongly blue and red light are scattered in the atmosphere.</div>
											<div class="code-demo-msg is-ai">Sure. The program computes the Rayleigh scattering ratio for 450 nm and 650 nm.</div>
										</div>
										<pre class="code-demo-code" aria-label="Generated Python program"><code><span class="cd-com" data-en="# Rayleigh scattering in air" data-de="# Rayleigh-Streuung in Luft"># Rayleigh scattering in air</span>
k_B = <span class="cd-num">1.380649e-23</span>   <span class="cd-com" data-en="# J/K" data-de="# J/K"># J/K</span>

<span class="cd-kw">def</span> <span class="cd-fn">scattering</span>(wavelength, pressure, temperature):
    density = pressure / (k_B * temperature)
    <span class="cd-kw">return</span> density / wavelength ** <span class="cd-num">4</span>

blue = <span class="cd-fn">scattering</span>(<span class="cd-num">450e-9</span>, <span class="cd-num">1e5</span>, <span class="cd-num">293</span>)
red  = <span class="cd-fn">scattering</span>(<span class="cd-num">650e-9</span>, <span class="cd-num">1e5</span>, <span class="cd-num">293</span>)
<span class="cd-fn">print</span>(f<span class="cd-str" data-en="&quot;Blue is {blue / red:.2f}x more strongly scattered than red&quot;" data-de="&quot;Blau wird {blue / red:.2f}× stärker gestreut als Rot&quot;">"Blue is {blue / red:.2f}x more strongly scattered than red"</span>)</code></pre>
									</div>
									<div class="code-demo-terminal" id="code-demo-terminal" aria-live="polite" hidden>
										<div class="code-demo-bar"><span class="code-demo-dot is-green"></span><span class="code-demo-dot is-gold"></span><span class="code-demo-dot is-sky"></span><span class="code-demo-name">Terminal</span></div>
										<div class="code-demo-term-body" id="code-demo-term">
											<div class="code-demo-output" id="code-demo-output" hidden data-en="Blue is 4.35× more strongly scattered than red." data-de="Blau wird 4,35× stärker gestreut als Rot.">Blue is 4.35× more strongly scattered than red.</div>
										</div>
									</div>
								</div>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>The model wrote the program; the program computed the ratio. Code is another sequence the loop can predict, one token at a time.</span></div>
						</div>
					</section>

					<section class="section-block" id="loop" data-chapter="The loop" data-chapter-de="Die Schleife">
						<div class="section-kicker"><span class="sk-num">02</span> Play the loop</div>
						<h2 class="section-title">Write a sentence, one word at a time.</h2>
						<div class="prose">
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
										<p class="demo-sub">A single prediction is one slice through a landscape of plausible continuations. The most likely path is the deepest blue valley; every other option sits in its own side basin, sometimes almost as deep as the main path. Step through the sentence and watch the valley narrow as the context closes the options, then turn up the temperature and watch it widen again. Drag to rotate.</p>
									</div>
									<span class="demo-badge">live</span>
								</div>
								<div class="demo-body">
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
												<span class="tt-legend-item"><i class="tt-swatch tt-swatch--base"></i><span>pale plane = all other tokens</span></span>
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
											<input type="range" id="tt-temp" min="0.05" max="2.0" step="0.05" value="0.8">
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

					<section class="section-block" id="inside" data-chapter="Inside the transformer" data-chapter-de="Im Transformer">
						<div class="section-kicker"><span class="sk-num">03</span> Inside the model</div>
						<h2 class="section-title">The transformer: six steps, one running vector.</h2>
						<div class="demo demo--paper demo--canvas" id="block-trajectory-real">
							<div class="demo-head">
								<div>
									<p class="demo-title">Token trajectories through GPT-2 <span>· real PCA</span></p>
									<p class="demo-sub">Real hidden states from GPT-2 small for “The capital of France is”. Each line follows one token through the embedding and 12 blocks. PCA finds the three directions where the 768-dimensional states change most and projects everything onto them; the 3D points are a shadow of the real motion.</p>
								</div>
								<span class="demo-badge">GPT-2 · PCA</span>
							</div>
							<div class="demo-body">
								<div id="real-trajectory-3d" class="traj-echarts-host" role="img" aria-label="3D token trajectories through GPT-2, PCA-reduced to three dimensions"></div>
								<div class="demo-controls traj-step-controls">
									<label class="traj-slider-label" for="traj-layer-slider">Layer
										<input type="range" id="traj-layer-slider" min="0" max="12" step="1" value="0">
										<output id="traj-layer-label">Embedding</output>
									</label>
									<button class="btn-demo" type="button" id="traj-reset">Reset</button>
								</div>
								<div class="traj-candidates" id="traj-candidates" aria-live="polite" hidden></div>
							</div>
							<div class="demo-foot">Real GPT-2 small hidden states, normalized per layer and PCA-reduced to 3D. Drag the slider to move through the layers. The next-token candidates appear at the final layer; the highlighted one is the model's top choice.</div>
						</div>
						<div class="prose">
							<p>This is the transformer. For every token, again and again, it asks how that token stands in context to all the other tokens right now. Attention lets it look around, a dense layer and an activation function transform each token, and LayerNorm keeps the numbers in a stable range. A few other parts do their jobs along the way.</p>
							<p>Each pass shifts the token's point in the space. The directions follow meaning paths and become clearer, so the last token ends up at a small angle to the tokens that are likely next in this context. That is the trick.</p>
							<div class="prose-math" data-tex="\begin{aligned} x_1 &amp;= x_0 + \underbrace{\operatorname{layer}_1(\underbrace{x_0}_{\text{token vector}})}_{\text{what layer 1 adds}} \\ x_2 &amp;= x_1 + \underbrace{\operatorname{layer}_2(\underbrace{x_1}_{\text{running vector}})}_{\text{what layer 2 adds}} \end{aligned}" data-tex-de="\begin{aligned} x_1 &amp;= x_0 + \underbrace{\operatorname{layer}_1(\underbrace{x_0}_{\text{Token-Vektor}})}_{\text{was Schicht 1 hinzufügt}} \\ x_2 &amp;= x_1 + \underbrace{\operatorname{layer}_2(\underbrace{x_1}_{\text{laufender Vektor}})}_{\text{was Schicht 2 hinzufügt}} \end{aligned}" data-tex-display="true"></div>
							<p>The new state is the old state plus what the layer adds. The demos are simplified; the order is the real architecture.</p>
						</div>
					</section>


					<section class="section-block" id="step-tokenize-section" data-chapter="Inside the transformer" data-chapter-de="Im Transformer">
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

					<section class="section-block" id="step-embed-section" data-chapter="Inside the transformer" data-chapter-de="Im Transformer">
						<div class="section-kicker">Step 2 · Embed</div>
						<h2 class="section-title">Embed: IDs become points in meaning space</h2>
						<h4 class="layer-subhead">Meaning becomes geometry</h4>
						<div class="prose">
							<p>Each token ID points to a learned vector. A real model uses thousands of dimensions; the demo uses two so you can see it. Similar words sit close, and a direction can carry a relationship: man → woman is the same arrow as king → queen. The axes here are labelled for humans; a real model's axes are unlabelled.</p>
						</div>
						<div class="demo demo--paper demo--plot" id="oned-twod-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">From one axis to two <span>· demo</span></p>
									<p class="demo-sub">One axis orders words by temperature. The embedding demo below adds a second direction, so the same words can carry more relations.</p>
								</div>
							</div>
							<div class="demo-body">
								<div class="oned-twod-grid">
									<div>
										<canvas id="i1d-canvas" class="demo-canvas" style="height:170px" aria-label="A temperature line with Freezing at -30, Cold at 5, Lukewarm at 30, and Hot at 100"></canvas>
										<p class="meadow-caption" style="color:var(--tm-muted)">1D: temperature</p>
									</div>

								</div>
							</div>
						</div>
						<div class="step-pane" id="step-embed">
							<div class="step-stage">
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
						<h4 class="layer-subhead">From relations to translation</h4>
						<div class="prose">
							<p>The points form a manifold: locally flat, globally curved. The relations are similar enough to translate: the path from one word to another can be transformed into the corresponding path in another language. Feed-forward networks learn such transformations.</p>
						</div>
						<div class="demo demo--paper demo--canvas" id="tm-dual-manifold-demo">
							<div class="demo-body">
								<div id="tm-dual-manifolds" style="width:100%;height:420px;">
									<div class="tm-manifold-loading">
										<span class="tm-spinner" aria-hidden="true"></span>
										<span><?php echo function_exists('tm_lang') && tm_lang() === 'de' ? 'Lade die Mannigfaltigkeiten …' : 'Loading the manifolds …'; ?></span>
									</div>
								</div>
								<div id="tm-dual-controls" style="max-width:520px;margin:8px auto 0;min-height:118px;"></div>
							</div>
						</div>
					</section>

					<section class="section-block" id="step-position-section" data-chapter="Inside the transformer" data-chapter-de="Im Transformer">
						<div class="section-kicker">Step 3 · Positional embedding</div>
						<h2 class="section-title">Position: every slot gets its own fingerprint</h2>
						<div class="prose">
							<p>Attention has no sense of order. Without a position signal, “man bites dog” and “dog bites man” are the same bag of vectors. A sinusoidal encoding adds a fingerprint to every slot: each pair of dimensions oscillates at a different frequency.</p>
						</div>
						<div class="prose-math pos-formula" data-tex="\underbrace{\begin{aligned} PE_{(\text{pos},2i)} &amp;= \sin\left(\frac{\underbrace{\text{pos}}_{\text{position}}}{\underbrace{10000^{2i/d}}_{\text{frequency}}}\right) \\ PE_{(\text{pos},2i+1)} &amp;= \cos\left(\frac{\text{pos}}{10000^{2i/d}}\right) \end{aligned}}_{\text{each dimension gets its own wave}}" data-tex-de="\underbrace{\begin{aligned} PE_{(\text{pos},2i)} &amp;= \sin\left(\frac{\underbrace{\text{pos}}_{\text{Position}}}{\underbrace{10000^{2i/d}}_{\text{Frequenz}}}\right) \\ PE_{(\text{pos},2i+1)} &amp;= \cos\left(\frac{\text{pos}}{10000^{2i/d}}\right) \end{aligned}}_{\text{jede Dimension bekommt ihre eigene Welle}}" data-tex-display="true"></div>
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
								<p>The 3D curve is the same fingerprint with d = 3; a real model uses thousands of dimensions.</p>
								<p class="pos-bridge-flow" aria-hidden="true"><span>position × dimension</span><i>→</i><span>3D curve</span><i>→</i><span>N dimensions</span></p>
							</div>
							<div class="step-stage">
								<div class="step-toolbar">
									<label>Position
										<input type="range" id="ipe-pos" min="0" max="1000" step="1" value="7">
										<output id="ipe-pos-out">7</output>
									</label>
									<button class="chip is-on" type="button" id="ipe-autorotate" aria-pressed="true">Auto-rotate view</button>
								</div>
								<p class="step-note pos-drag-hint">Move the slider to travel along the curve; drag the view to rotate it.</p>
								<canvas class="step-canvas" id="ipe-canvas" style="height:380px" aria-label="A single sinusoidal positional-encoding vector for one token: three dimensions as axes, one point on the curve"></canvas>
								<div class="step-out" id="ipe-out">One token at position <b>7</b>.</div>
							</div>
							<p class="step-note">The three axes are the first three dimensions; the blue sphere is the word, the arrow its position. Drag to rotate. A real model uses thousands of dimensions.</p>
						</div>
					</section>

					<section class="section-block" id="step-attention-section" data-chapter="Inside the transformer" data-chapter-de="Im Transformer">
						<div class="section-kicker">Step 4 · Attend</div>
						<h2 class="section-title">Attention: context pulls the word into place</h2>
						<div class="prose">
							<p>How does a word know which neighbours matter? Attention lets each token look at the others, decide which matter, and pull their information into its vector. That is how “bank” moves toward the river or money reading. A real layer has many heads; the demo shows one.</p>
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
																<canvas class="step-canvas" id="iatt-canvas" aria-label="Attention moving the embedding of bank toward the context"></canvas>
																<div class="step-out" id="iatt-out">No unambiguous context: bank stays in the middle, ambiguous.</div>
																<div class="attn-matrix" id="iatt-matrix" aria-live="polite"></div>
																<div class="prose-math attn-sum" id="iatt-sum" data-tex-display="true"></div>
															</div>
															<p class="step-note"><b>This is an intuition, not a real head.</b> A real head computes query, key, and value vectors, turns their dot products into weights with a softmax, and sums the value vectors.</p>
															<p class="step-note">Each head has one unit of attention. If it puts 80% on one word, only 20% remains for the others. Many heads can attend to different things.</p>
														</div>
					</section>

					<section class="section-block" id="layer-detail-section" data-chapter="Inside the transformer" data-chapter-de="Im Transformer">
						<div class="section-kicker">The layer in detail · the MLP</div>
						<h2 class="section-title">FFN: a projection, a bias, a bend</h2>
						<div class="prose">
							<p>After attention, each token passes through its own small network, the MLP. It projects the vector, applies a nonlinearity, and projects back. The bend is what lets a straight cut separate what was inseparable.</p>
						</div>
						<div class="step-pane layer-pane" id="layer-detail">
															<div class="layer-formula" data-tex="\operatorname{layer}(x) = \operatorname{activation}\!\left(\underbrace{W}_{\substack{\text{weight}\\\text{matrix}}}\,x + \underbrace{b}_{\text{bias}}\right)" data-tex-de="\operatorname{layer}(x) = \operatorname{activation}\!\left(\underbrace{W}_{\substack{\text{Gewichts-}\\\text{Matrix}}}\,x + \underbrace{b}_{\text{Bias}}\right)"></div>
															<div class="collapse-card">
																<div class="cc-label">Worked example · 2 inputs, 2 outputs</div>
																<div class="collapse-math" data-tex="\begin{aligned} W &amp;= \begin{pmatrix} 1 &amp; 2 \\ 0 &amp; -1 \end{pmatrix}, \quad x = \begin{pmatrix} 3 \\ 1 \end{pmatrix}, \quad b = \begin{pmatrix} 0 \\ -2 \end{pmatrix} \\[6pt] Wx &amp;= \begin{pmatrix} 1\cdot 3 + 2\cdot 1 \\ 0\cdot 3 + (-1)\cdot 1 \end{pmatrix} = \begin{pmatrix} 5 \\ -1 \end{pmatrix} \\[6pt] z = Wx + b &amp;= \begin{pmatrix} 5 \\ -1 \end{pmatrix} + \begin{pmatrix} 0 \\ -2 \end{pmatrix} = \begin{pmatrix} 5 \\ -3 \end{pmatrix} \\[6pt] \operatorname{ReLU}(z) &amp;= \begin{pmatrix} 5 \\ 0 \end{pmatrix} \end{aligned}"></div>
																<p>Each output is a dot product plus a bias, then the activation. The matrix above shows the arithmetic.</p>
															</div>
															<h4 class="layer-subhead">Depth without a nonlinearity</h4>
															<div class="collapse-card">
																<div class="cc-label">two dense layers without a nonlinearity</div>
																<div class="collapse-math" id="collapse-math" data-tex="\begin{aligned} \operatorname{dense}_2(\operatorname{dense}_1(x)) &amp;= W_2(W_1 x + b_1) + b_2 \\ &amp;= (W_2 W_1)x + (W_2 b_1 + b_2) \\ &amp;= Wx + b \\[4pt] W &amp;= W_2 W_1, \qquad b = W_2 b_1 + b_2 \end{aligned}"></div>
																<p>Without a nonlinearity, two layers collapse into one. Depth adds no expressive power.</p>
															</div>
															<h4 class="layer-subhead">Nonlinear activation functions</h4>
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
															<h4 class="layer-subhead">Where the bend happens</h4>
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
															<p class="step-note">Real models do this in thousands of dimensions. Separation and translation are two views of the same learned transformation.</p>
															<p class="step-note curve-source">Visual idea after C. Keup &amp; M. Helias, <em>Origami in N dimensions</em> (<a href="https://arxiv.org/abs/2203.11355" rel="noopener">arXiv:2203.11355</a>).</p>
														</div>
					</section>

					<section class="section-block" id="step-ffn-section" data-chapter="Inside the transformer" data-chapter-de="Im Transformer">
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
					</section>

					<section class="section-block" id="step-residual-section" data-chapter="Inside the transformer" data-chapter-de="Im Transformer">
						<div class="section-kicker">Step 6 · Residual</div>
						<h2 class="section-title">Residual stream: every layer adds to the same stream</h2>
						<div class="prose">
							<p>Every layer reads the same running vector, computes an update, and adds it back. Think of a shared notebook: earlier notes stay, later layers read them and add more. The new state is the old state plus a change.</p>
						</div>
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
																		<div class="prose-math" data-tex="\underbrace{x_{n+1}}_{\text{new stream}} = \underbrace{x_n}_{\text{running stream}} + \underbrace{\operatorname{layer}_{n+1}(x_n)}_{\text{what this layer writes}}" data-tex-de="\underbrace{x_{n+1}}_{\text{neuer Stream}} = \underbrace{x_n}_{\text{laufender Stream}} + \underbrace{\operatorname{layer}_{n+1}(x_n)}_{\text{was diese Schicht schreibt}}" data-tex-display="true"></div>
																	</div>
																</div>
															</div>
															<p class="step-note">Nothing is overwritten, so the original signal survives and gradients have a short path back. That is why deep networks train.</p>
														</div>
					</section>

					<section class="section-block" id="block-repeat" data-chapter="Inside the transformer" data-chapter-de="Im Transformer">
						<div class="section-kicker"><span class="sk-num">04</span> The block repeats</div>
						<h2 class="section-title">The whole block: attention + FFN, again and again</h2>
						<div class="prose">
							<p>Attention and the FFN are one transformer block. The same block runs again and again. Each pass lets every token look at the context, then moves it through its own MLP.</p>
							<p>The picture is 3D; a real model works in thousands of dimensions. Follow five words through four blocks, then watch the last token choose the next one.</p>
						</div>

						<div class="demo demo--paper demo--canvas" id="block-trajectory-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">From token to token <span>· demo 10</span></p>
									<p class="demo-sub">Five words from a Ringelnatz line. Attention mixes context; the FFN moves each token. After four blocks, the last token's angle to a candidate word decides the next token. The smallest angles are the actual next words: “am”, then “Sieb”.</p>
								</div>
								<span class="demo-badge">simplified 3D</span>
							</div>
							<div class="demo-body">
								<div class="traj-demo-grid">
									<div class="traj-panel">
										<p class="traj-panel-title">Token trajectory · 4 blocks</p>
										<canvas id="traj-3d" aria-label="Five token trajectories through four transformer blocks"></canvas>
									</div>
									<div class="traj-panel">
										<p class="traj-panel-title">Angle to the next word</p>
										<canvas id="traj-angles" aria-label="Angles from the last token to candidate next words"></canvas>
										<div id="traj-angle-list" class="traj-angle-list" aria-live="polite"></div>
									</div>
								</div>
								<div class="demo-controls">
									<button class="btn-demo btn-demo--green" type="button" id="traj-next">Next block →</button>
									<button class="btn-demo" type="button" id="traj-angles-btn">Show angles</button>
									<button class="btn-demo" type="button" id="traj-choose">Choose next word →</button>
									<button class="btn-demo" type="button" id="traj-reset">Reset</button>
								</div>
								<div class="demo-readout demo-readout--3">
									<div><b>Step</b><span id="traj-step">Embedding</span></div>
									<div><b>Block</b><span id="traj-block">0 / 4</span></div>
									<div><b>Next word</b><span id="traj-next-word">–</span></div>
								</div>
								<p class="demo-hint" id="traj-note">The tokens start as separate points.</p>
								<p class="traj-quote">„Die Löcher sind das Wichtigste …“ <span>Joachim Ringelnatz (zugeschrieben)</span></p>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Attention contextualizes, the FFN moves. The last token's angle to the vocabulary picks the next word, and the loop starts again.</span></div>
							<div class="demo-foot">The 3D vectors are a toy model, not GPT-2. The angles are computed from those vectors. Quote: <a href="https://www.aphorismen.de/zitat/60074" rel="noopener">Joachim Ringelnatz (zugeschrieben), „Die Löcher sind das Wichtigste am Sieb“</a>; the attribution is common but not secure.</div>
						</div>
					</section>

					<section class="section-block" id="last-step" data-chapter="From vector to word" data-chapter-de="Vom Vektor zum Wort">
						<div class="section-kicker"><span class="sk-num">05</span> The last step</div>
						<h2 class="section-title">The final vector picks a word.</h2>
						<div class="prose">
							<p>How does the final vector become a probability? The last token carries the whole context. The model takes the dot product of its final vector h with every token embedding, producing logits: one raw score per vocabulary entry.</p>
							<div class="prose-math" data-tex="\underbrace{\text{logit}_i = \underbrace{h}_{\text{context vector}} \cdot \underbrace{w_i}_{\text{token direction}}}_{\text{how much the context points toward token }i}" data-tex-de="\underbrace{\text{logit}_i = \underbrace{h}_{\text{Kontextvektor}} \cdot \underbrace{w_i}_{\text{Token-Richtung}}}_{\text{wie stark der Kontext auf Token }i\text{ zeigt}}" data-tex-display="true"></div>
							<p>Softmax turns the logits into a distribution: exponentiate, divide by the sum. The largest score becomes the most likely next token, but the alternatives stay alive.</p>
							<div class="prose-math" data-tex="p_i = \frac{\exp(\text{logit}_i)}{Z}" data-tex-de="p_i = \frac{\exp(\text{Logit}_i)}{Z}" data-tex-display="true"></div>
						</div>

						<div class="demo demo--paper demo--plot softmax-demo" id="softmax-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">From logits to a probability distribution <span>· demo 08</span></p>
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

					<section class="section-block" id="meadow" data-chapter="From vector to word" data-chapter-de="Vom Vektor zum Wort">
						<div class="section-kicker"><span class="sk-num">06</span> The meadow</div>
						<h2 class="section-title">The same step, seen as geometry.</h2>
						<div class="prose">
							<p>The meadow looks at the same step geometrically. Every token owns a region of the thought space; the next word is the region the thought falls into. Near a seam, two words are almost equally likely.</p>
							<p>More tokens make the cells smaller, but the seams never close. The model can represent a distinction more finely than it can express it in one token. <a href="https://arxiv.org/abs/2603.22301" rel="noopener">Mabrok (2026)</a> calls the band around a seam the expressibility gap.</p>
						</div>

						<div class="demo demo--paper demo--canvas" id="meadow-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">The meadow of words <span>· demo 09</span></p>
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
								<p class="meadow-caption" id="md-caption">Move the pointer across the meadow.</p>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Words divide the space of thoughts into cells. Certainty is being deep inside a cell; uncertainty is standing on a seam or right at the edge. The model can think more finely than one word can say.</span></div>
							<div class="demo-foot">More words make smaller cells and thinner seams, but the ambiguous share never reaches zero. In a real model the space has thousands of dimensions and the vocabulary has tens of thousands of tokens.</div>
						</div>

					</section>

					<section class="section-block" id="whole" data-chapter="From vector to word" data-chapter-de="Vom Vektor zum Wort">
						<div class="section-kicker"><span class="sk-num">07</span> The whole loop</div>
						<h2 class="section-title">Text in, geometry, one word out.</h2>
						<div class="prose">
							<p>The pieces fit in a fixed order: text → tokens → vectors → position → attention + residual → FFN → distribution → draw → append. The loop ends when the model emits the special token &lt;|endoftext|&gt;.</p>
							<p>No step has a tidy fact database. Knowledge is distributed across the weights, and meaning lives in the geometry. Whether fluent prediction amounts to understanding is still contested. A pile of numbers becomes a sentence one token at a time.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>What it is</b><span>A next-token predictor: one distribution, one draw, one append, repeated.</span></div>
							<div class="keypoint"><b>Why it works</b><span>More context and more layers narrow the distribution, so the next token becomes easier to choose.</span></div>
							<div class="keypoint"><b>Its limits</b><span>It predicts plausible text. It can be fluent and wrong, and it offers no guarantee of truth.</span></div>
							<div class="keypoint"><b>The contested part</b><span>Whether fluent prediction is genuine world knowledge or “stochastic parroting” is not settled.</span></div>
						</div>
					</section>


				</article>
			</div>
		</div>
	</main>

	<script type="application/json" id="gpt2-pca-data">{"sentence": "The capital of France is", "tokens": ["The", " capital", " of", " France", " is"], "ids": [464, 3139, 286, 4881, 318], "layers": ["Embedding + position", "Block 1", "Block 2", "Block 3", "Block 4", "Block 5", "Block 6", "Block 7", "Block 8", "Block 9", "Block 10", "Block 11", "Block 12"], "points": [[[-0.3471, -0.8096, 0.2115], [-0.6593, -0.211, -0.0394], [-0.6764, -0.2625, -0.0394], [-0.6951, 0.2452, -0.1424], [-0.6972, 0.2442, -0.1426], [-0.696, 0.2454, -0.1423], [-0.6931, 0.2477, -0.1418], [-0.6907, 0.2495, -0.1408], [-0.6888, 0.2513, -0.1391], [-0.6866, 0.2531, -0.1371], [-0.6848, 0.2545, -0.1361], [-0.682, 0.2568, -0.1333], [-0.6187, 0.2614, -0.1182]], [[-0.195, -0.9765, 0.1725], [0.2369, -0.2199, -0.21], [0.3837, -0.3651, -0.166], [0.3464, -0.2752, -0.1477], [0.3655, -0.287, -0.1155], [0.3446, -0.2389, -0.1081], [0.2728, -0.1175, -0.0563], [0.245, -0.0504, 0.0138], [0.2098, 0.0315, 0.1633], [0.1878, 0.0924, 0.246], [0.1908, 0.1183, 0.3141], [0.1422, 0.1851, 0.4405], [0.1004, 0.1329, 0.5923]], [[-0.3086, -0.9404, 0.2736], [0.1635, -0.0193, -0.3349], [0.2698, -0.0905, -0.386], [0.2752, -0.0491, -0.4003], [0.2486, -0.019, -0.3708], [0.2426, 0.001, -0.3648], [0.2252, 0.0445, -0.3008], [0.2276, 0.106, -0.1669], [0.1847, 0.1751, -0.0311], [0.1776, 0.2134, 0.1308], [0.1543, 0.2291, 0.2199], [0.1041, 0.2664, 0.3978], [0.0668, 0.1677, 0.5828]], [[-0.2823, -1.0, 0.2055], [0.1891, -0.1032, -0.2037], [0.2811, -0.1456, -0.1811], [0.2504, -0.0774, -0.1711], [0.267, -0.074, -0.1515], [0.2118, 0.0111, -0.1282], [0.1711, 0.0978, -0.065], [0.1564, 0.164, 0.0575], [0.1507, 0.1971, 0.169], [0.1315, 0.2047, 0.2125], [0.1408, 0.2132, 0.2665], [0.1317, 0.2466, 0.4238], [0.0686, 0.1452, 0.6055]], [[-0.3328, -0.9319, 0.2659], [0.1792, 0.0099, -0.3359], [0.2581, -0.0296, -0.3701], [0.2418, 0.0081, -0.3782], [0.1909, 0.0754, -0.3472], [0.1545, 0.137, -0.2952], [0.1915, 0.1396, -0.2517], [0.2004, 0.2089, -0.073], [0.1698, 0.2453, 0.0444], [0.1587, 0.264, 0.1754], [0.1483, 0.2599, 0.2912], [0.1308, 0.2486, 0.462], [0.0943, 0.1445, 0.6255]]], "explained": [0.225, 0.1785, 0.1349], "landmarks": [{"word": " the", "value": [-0.3445, -0.2858, 0.2668], "p": 0.084654}, {"word": " now", "value": [-0.2676, -0.4073, 0.1668], "p": 0.047577}, {"word": " a", "value": [-0.3457, -0.3141, 0.2525], "p": 0.04621}, {"word": " France", "value": [-0.2629, -0.5878, 0.1754], "p": 0.031875}, {"word": " Paris", "value": [-0.2537, -0.5461, 0.1589], "p": 0.031726}, {"word": " in", "value": [-0.362, -0.3362, 0.3113], "p": 0.02672}, {"word": " also", "value": [-0.291, -0.4294, 0.1881], "p": 0.026292}, {"word": " not", "value": [-0.3338, -0.3821, 0.1969], "p": 0.023788}], "top": [{"id": 262, "token": " the", "p": 0.084654}, {"id": 783, "token": " now", "p": 0.047577}, {"id": 257, "token": " a", "p": 0.04621}, {"id": 4881, "token": " France", "p": 0.031875}, {"id": 6342, "token": " Paris", "p": 0.031726}, {"id": 287, "token": " in", "p": 0.02672}, {"id": 635, "token": " also", "p": 0.026292}, {"id": 407, "token": " not", "p": 0.023788}], "chosen": " the"}
</script>
	<script src="../temml.min.js"></script>
	<script src="assets/site.js?v=<?php echo filemtime(__DIR__.'/assets/site.js'); ?>"></script>
	<script src="assets/demos.js?v=<?php echo filemtime(__DIR__.'/assets/demos.js'); ?>"></script>
	<script src="assets/space-morph.js?v=<?php echo filemtime(__DIR__.'/assets/space-morph.js'); ?>"></script>
	<script src="assets/word-meadow.js?v=20261105c"></script>
	<script>
	(function () {
		"use strict";
		var root = document.getElementById("block-trajectory-demo");
		if (!root || !window.TM || !TM.initCanvas) return;

		var DE = TM.lang() === "de";
		function t(en, de) { return DE ? de : en; }

		var TOKENS = ["Die", "Löcher", "sind", "das", "Wichtigste"];
		var TRAJ = [
			[[0.9,0.2,0.1],[0.85,0.225,0.175],[0.8,0.25,0.25],[0.75,0.275,0.325],[0.7,0.3,0.4]],
			[[0.2,0.9,0.2],[0.3066,0.8326,0.3033],[0.38,0.79,0.39],[0.4066,0.7826,0.4533],[0.4,0.8,0.5]],
			[[0.2,0.3,0.9],[0.1896,0.4066,0.8788],[0.2,0.48,0.87],[0.2396,0.5066,0.8788],[0.3,0.5,0.9]],
			[[0.8,0.1,0.6],[0.7924,0.1533,0.5755],[0.76,0.19,0.58],[0.6924,0.2033,0.6255],[0.6,0.2,0.7]],
			[[0.3,0.6,0.8],[0.2267,0.4696,0.8849],[0.17,0.36,0.945],[0.1367,0.2796,0.9699],[0.12,0.22,0.97]]
		];
		var LAST = [0.12, 0.22, 0.97];
		var CANDS = [
			["am", [0.10, 0.20, 1.00]],
			["wichtig", [0.55, 0.55, 0.45]],
			["und", [0.30, 0.90, 0.30]],
			["Sieb", [0.95, 0.10, 0.15]]
		];
		var LAST2 = [0.80, 0.10, 0.25];
		var CANDS2 = [
			["Sieb", [0.95, 0.05, 0.15]],
			["wichtig", [0.50, 0.50, 0.50]],
			["am", [0.10, 0.20, 1.00]]
		];

		var state = { step: 0, phase: "traj", chosen: "" };
		var left = document.getElementById("traj-3d");
		var right = document.getElementById("traj-angles");
		if (!left || !right) return;

		function colors() {
			var c = TM.colors();
			return {
				ink: c.ink, muted: c.muted, faint: c.faint,
				line: c.line, lineStrong: c.lineStrong,
				green: c.green, blue: c.blue, gold: c.gold,
				coral: c.coral, teal: c.teal || c.sky || c.blue,
				paper: c.paper, dark: c.dark
			};
		}
		var TOKEN_COLORS = null;
		function tokenColors(c) {
			return [c.green, c.blue, c.gold, c.coral, c.teal];
		}

		function project(p, w, h) {
			var cx = w * 0.50, cy = h * 0.58;
			var scale = Math.min(w, h) * 0.58;
			var x = p[0] - 0.5, y = p[1] - 0.5, z = p[2] - 0.5;
			var yaw = -0.65, pitch = 0.38;
			var x1 = x * Math.cos(yaw) - z * Math.sin(yaw);
			var z1 = x * Math.sin(yaw) + z * Math.cos(yaw);
			var y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
			var z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
			var f = 2.0 / (2.0 + z2 * 0.55);
			return [cx + x1 * scale * f, cy - y2 * scale * f];
		}

		function line(ctx, a, b, color, width, dash) {
			ctx.save();
			ctx.strokeStyle = color;
			ctx.lineWidth = width || 1;
			if (dash) ctx.setLineDash(dash);
			ctx.beginPath();
			ctx.moveTo(a[0], a[1]);
			ctx.lineTo(b[0], b[1]);
			ctx.stroke();
			ctx.restore();
		}

		function dot(ctx, p, color, r) {
			ctx.beginPath();
			ctx.arc(p[0], p[1], r || 3.5, 0, Math.PI * 2);
			ctx.fillStyle = color;
			ctx.fill();
		}

		function label(ctx, text, p, color, font, align) {
			ctx.save();
			ctx.fillStyle = color;
			ctx.font = font || "600 10px Barlow, system-ui, sans-serif";
			ctx.textAlign = align || "left";
			ctx.textBaseline = "middle";
			ctx.fillText(text, p[0], p[1]);
			ctx.restore();
		}

		function drawAxes(ctx, w, h, c) {
			var origin = project([0, 0, 0], w, h);
			var axes = [
				[[1.25, 0, 0], "dim 1"],
				[[0, 1.25, 0], "dim 2"],
				[[0, 0, 1.25], "dim 3"]
			];
			axes.forEach(function (axis) {
				var p = project(axis[0], w, h);
				line(ctx, origin, p, c.lineStrong, 1);
				label(ctx, axis[1], [p[0] + 4, p[1] - 4], c.faint, "600 9px Barlow, system-ui, sans-serif");
			});
		}

		function drawLeft(ctx, w, h) {
			var c = colors();
			var cols = tokenColors(c);
			ctx.clearRect(0, 0, w, h);
			drawAxes(ctx, w, h, c);

			var activeCands = state.phase === "after" ? CANDS2 : CANDS;
			var activeLast = state.phase === "after" ? LAST2 : LAST;
			var chosen = state.phase === "after" ? "Sieb" : state.chosen;
			var origin = project([0, 0, 0], w, h);

			if (state.phase !== "traj") {
				var lp = project(activeLast, w, h);
				line(ctx, origin, lp, c.ink, 2, [4, 4]);
				label(ctx, t("last token", "letztes Token"), [lp[0] + 6, lp[1] - 8], c.ink, "700 10px Barlow, system-ui, sans-serif");
				activeCands.forEach(function (cand) {
					var cp = project(cand[1], w, h);
					var isChosen = cand[0] === chosen;
					line(ctx, origin, cp, isChosen ? c.green : c.lineStrong, isChosen ? 2.2 : 1, [3, 5]);
					label(ctx, cand[0], [cp[0] + 5, cp[1] - 5], isChosen ? c.green : c.muted, isChosen ? "700 10px Barlow, system-ui, sans-serif" : "600 9px Barlow, system-ui, sans-serif");
				});
			}

			TOKENS.forEach(function (token, ti) {
				var path = TRAJ[ti];
				var color = cols[ti];
				var lastIdx = Math.min(state.step, path.length - 1);
				ctx.save();
				ctx.globalAlpha = 0.20;
				for (var s = 1; s < path.length; s++) {
					line(ctx, project(path[s - 1], w, h), project(path[s], w, h), color, 1.4);
				}
				ctx.restore();
				for (var a = 1; a <= lastIdx; a++) {
					line(ctx, project(path[a - 1], w, h), project(path[a], w, h), color, 2.2);
				}
				for (var d = 0; d <= lastIdx; d++) {
					dot(ctx, project(path[d], w, h), color, d === lastIdx ? 4.5 : 2.5);
				}
				var cur = project(path[lastIdx], w, h);
				var isLast = ti === TOKENS.length - 1;
				if (isLast) {
					ctx.save();
					ctx.strokeStyle = c.ink;
					ctx.lineWidth = 1.2;
					ctx.beginPath();
					ctx.arc(cur[0], cur[1], 7, 0, Math.PI * 2);
					ctx.stroke();
					ctx.restore();
				}
				label(ctx, token, [cur[0] + 7, cur[1] + (ti % 2 ? 10 : -9)], color, isLast ? "700 10px Barlow, system-ui, sans-serif" : "600 10px Barlow, system-ui, sans-serif");
			});

			if (state.phase === "after") {
				var p4 = project(LAST, w, h);
				var p5 = project(LAST2, w, h);
				line(ctx, p4, p5, c.green, 2.2, [3, 4]);
				dot(ctx, p5, c.green, 4.5);
				label(ctx, t("after 'am'", "nach „am“"), [p5[0] + 7, p5[1] + 12], c.green, "700 10px Barlow, system-ui, sans-serif");
			}

			label(ctx, t("3D schematic; the real model uses thousands of dimensions", "3D-Schema; das echte Modell nutzt Tausende Dimensionen"), [12, h - 12], c.faint, "600 9px Barlow, system-ui, sans-serif");
		}

		function angleDeg(a, b) {
			var dot = a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
			var na = Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]);
			var nb = Math.sqrt(b[0]*b[0] + b[1]*b[1] + b[2]*b[2]);
			var cos = Math.max(-1, Math.min(1, dot / (na * nb)));
			return Math.acos(cos) * 180 / Math.PI;
		}

		function renderAngleList(angles, chosen) {
			var el = document.getElementById("traj-angle-list");
			if (!el) return;
			el.innerHTML = angles.map(function (item) {
				var cls = item.word === chosen ? "is-chosen" : "";
				return '<span class="' + cls + '">' + item.word + " · " + item.angle.toFixed(1) + "°</span>";
			}).join("");
		}

		function drawRight(ctx, w, h) {
			var c = colors();
			ctx.clearRect(0, 0, w, h);
			var listEl = document.getElementById("traj-angle-list");
			if (listEl && state.step < 4) listEl.textContent = "";
			if (state.step < 4) {
				label(ctx, t("Run four blocks, then show the angles.", "Vier Blöcke laufen lassen, dann die Winkel zeigen."), [w * 0.5, h * 0.5], c.faint, "600 11px Barlow, system-ui, sans-serif", "center");
				return;
			}
			var after = state.phase === "after";
			var last = after ? LAST2 : LAST;
			var cands = after ? CANDS2 : CANDS;
			var chosen = after ? "Sieb" : state.chosen;
			var ox = w * 0.10, oy = h * 0.58, R = Math.min(w * 0.72, h * 0.42);
			var angles = cands.map(function (cand) { return { word: cand[0], vec: cand[1], angle: angleDeg(last, cand[1]) }; });
			angles.sort(function (a, b) { return a.angle - b.angle; });
			renderAngleList(angles, chosen);

			ctx.save();
			ctx.strokeStyle = c.line;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.arc(ox, oy, R, -Math.PI / 2, 0);
			ctx.stroke();
			ctx.restore();
			for (var tick = 0; tick <= 90; tick += 30) {
				var a = tick * Math.PI / 180;
				var x = ox + Math.cos(a) * R;
				var y = oy - Math.sin(a) * R;
				line(ctx, [ox, oy], [x, y], c.line, 0.7);
				label(ctx, tick + "°", [x + 2, y - 6], c.faint, "600 9px Barlow, system-ui, sans-serif");
			}
			line(ctx, [ox, oy], [ox + R, oy], c.ink, 2.2);
			label(ctx, t("last token", "letztes Token"), [ox + R - 2, oy + 12], c.ink, "700 10px Barlow, system-ui, sans-serif", "right");

			angles.forEach(function (item) {
				var a = item.angle * Math.PI / 180;
				var x = ox + Math.cos(a) * R;
				var y = oy - Math.sin(a) * R;
				var isChosen = item.word === chosen;
				line(ctx, [ox, oy], [x, y], isChosen ? c.green : c.lineStrong, isChosen ? 2.4 : 1.1);
				dot(ctx, [x, y], isChosen ? c.green : c.muted, isChosen ? 4 : 2.6);
				label(ctx, item.word + " · " + item.angle.toFixed(1) + "°", [x + 5, y - 7], isChosen ? c.green : c.muted, isChosen ? "700 10px Barlow, system-ui, sans-serif" : "600 9px Barlow, system-ui, sans-serif");
			});
			label(ctx, t("smallest angle wins", "der kleinste Winkel gewinnt"), [ox, h - 12], c.green, "700 10px Barlow, system-ui, sans-serif");
		}

		var chartLeft = TM.initCanvas(left, drawLeft);
		var chartRight = TM.initCanvas(right, drawRight);

		function setText(id, text) {
			var el = document.getElementById(id);
			if (el) el.textContent = text;
		}
		function updateUI() {
			var stepLabel = state.phase === "after" ? t("After am", "Nach „am“") : (state.phase === "angles" ? t("Angles", "Winkel") : (state.step === 0 ? t("Embedding", "Embedding") : t("Block ", "Block ") + state.step));
			setText("traj-step", stepLabel);
			setText("traj-block", state.step + " / 4");
			setText("traj-next-word", state.phase === "after" ? "Sieb" : (state.chosen || "–"));
			var note = "";
			if (state.phase === "traj") {
				if (state.step === 0) note = t("The tokens start as separate points.", "Die Tokens starten als getrennte Punkte.");
				else if (state.step < 4) note = t("Block " + state.step + ": attention mixes context; the FFN moves each token.", "Block " + state.step + ": Attention mischt Kontext; das FFN bewegt jedes Token.");
				else note = t("Four blocks done. The last token is the query for the next word.", "Vier Blöcke fertig. Das letzte Token ist die Query für das nächste Wort.");
			} else if (state.phase === "angles") {
				note = t("Angles from the last token to candidate words. The smallest angle wins.", "Winkel vom letzten Token zu den Kandidatenwörtern. Der kleinste Winkel gewinnt.");
			} else {
				note = t("The model chose “am”. The loop continues; now “Sieb” has the smallest angle.", "Das Modell hat „am“ gewählt. Die Schleife läuft weiter; jetzt hat „Sieb“ den kleinsten Winkel.");
			}
			setText("traj-note", note);
			var nextBtn = document.getElementById("traj-next");
			var anglesBtn = document.getElementById("traj-angles-btn");
			var chooseBtn = document.getElementById("traj-choose");
			if (nextBtn) nextBtn.disabled = state.phase !== "traj" || state.step >= 4;
			if (anglesBtn) anglesBtn.disabled = state.phase !== "traj" || state.step < 4;
			if (chooseBtn) chooseBtn.disabled = state.phase !== "angles";
			if (chartLeft) chartLeft.redraw();
			if (chartRight) chartRight.redraw();
		}

		var nextBtn = document.getElementById("traj-next");
		var anglesBtn = document.getElementById("traj-angles-btn");
		var chooseBtn = document.getElementById("traj-choose");
		var resetBtn = document.getElementById("traj-reset");
		if (nextBtn) nextBtn.addEventListener("click", function () {
			if (state.phase !== "traj") return;
			state.step = Math.min(4, state.step + 1);
			updateUI();
		});
		if (anglesBtn) anglesBtn.addEventListener("click", function () {
			if (state.step < 4 || state.phase !== "traj") return;
			state.phase = "angles";
			state.chosen = "am";
			updateUI();
		});
		if (chooseBtn) chooseBtn.addEventListener("click", function () {
			if (state.phase !== "angles") return;
			state.phase = "after";
			state.chosen = "Sieb";
			updateUI();
		});
		if (resetBtn) resetBtn.addEventListener("click", function () {
			state.step = 0;
			state.phase = "traj";
			state.chosen = "";
			updateUI();
		});
		window.addEventListener("tm:theme", function () { updateUI(); });
		updateUI();
	})();
	</script>

	<script src="../plotly-2.24.1.min.js"></script>
	<script src="../manifold_scenes.js?v=<?php echo filemtime(__DIR__.'/../manifold_scenes.js'); ?>"></script>
	<script>
	(function () {
		var host = document.getElementById('tm-dual-manifolds');
		if (!host || !window.ManifoldScenes) return;
		var drawn = false;
		function draw() {
			if (drawn) return;
			drawn = true;
			ManifoldScenes.renderDualPlotly('tm-dual-manifolds', 'tm-dual-controls');
		}
		if ('IntersectionObserver' in window) {
			var io = new IntersectionObserver(function (entries) {
				if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); draw(); }
			}, { rootMargin: '400px 0px' });
			io.observe(host);
		} else { draw(); }
		window.addEventListener('tm:theme', function () { drawn = false; draw(); });
	})();
	</script>
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
			{ t: "Drache", l: 3.4 }, { t: "Ritter", l: 1.1 }, { t: "Roboter", l: 0.7 }, { t: "Schloss", l: 0.4 }, { t: "Fluss", l: 0.2 }
		] : [
			{ t: "dragon", l: 3.4 }, { t: "princess", l: 1.1 }, { t: "robot", l: 0.7 }, { t: "castle", l: 0.4 }, { t: "river", l: 0.2 }
		];
		var ACTIONS = DE ? {
			Drache: [{ t: "fliegen", l: 3.5 }, { t: "brüllen", l: 1.5 }, { t: "schlafen", l: 0.8 }, { t: "schwimmen", l: 0.5 }, { t: "singen", l: 0.3 }],
			Ritter: [{ t: "kämpfen", l: 3.4 }, { t: "reiten", l: 1.5 }, { t: "singen", l: 0.9 }, { t: "schlafen", l: 0.5 }, { t: "tanzen", l: 0.3 }],
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
			Ritter: [{ t: "der", l: 3.6 }],
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
			return "ein";
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
			html += '<span class="cursor' + (stage >= MAX_STEPS ? " is-done" : "") + '" aria-hidden="true"></span>';
			if (stage >= MAX_STEPS) {
				html += ' <span class="given" style="opacity:.55">' + (DE ? "Sequenz vollständig" : "sequence complete") + '</span>';
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
		function measureWhyHeight() {
			var why = document.getElementById("nt-why");
			if (!why) return;
			var previous = why.textContent;
			why.style.minHeight = "0px";
			var candidates = DE ? [
				"Greedy ist der Grenzfall T → 0: Es nimmt immer das wahrscheinlichste Wort, deshalb ist der Temperaturregler bei 0,05 fixiert. Der Text ist deterministisch und oft repetitiv.",
				"Die Temperatur formt zuerst die Verteilung; Top-p behält dann die kleinste Menge der sortierten Wörter, deren kumulierte Wahrscheinlichkeit 90 % erreicht, und zieht daraus. Die blassen Balken liegen außerhalb dieser Menge.",
				"Sampling zieht aus der ganzen Verteilung nach der Temperaturformung. Niedriges T verhält sich fast gierig; hohes T flacht die Verteilung ab und tauscht Kohärenz gegen Überraschung.",
				"Hier ergibt nur eine Fortsetzung Sinn: „supercalifragilisticexpialidocious“. Der Baum hat sich auf einen Zweig verengt."
			] : [
				"Greedy is the limit T → 0: it always takes the highest-probability word, so the temperature slider is pinned at 0.05. The text is deterministic and often repetitive.",
				"Temperature reshapes the distribution first; top-p then keeps the smallest set of sorted words whose cumulative probability reaches 90%, and samples among them. The faded bars are outside that set.",
				"Sampling draws from the whole distribution after temperature has shaped it. Low T behaves almost greedily; high T flattens the distribution and trades coherence for surprise.",
				"Only one continuation makes sense here: “supercalifragilisticexpialidocious”. The tree has narrowed to a single branch."
			];
			var max = 0;
			candidates.forEach(function (text) {
				why.textContent = text;
				max = Math.max(max, why.getBoundingClientRect().height);
			});
			why.textContent = previous;
			if (max) why.style.minHeight = (Math.ceil(max) + 1) + "px";
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
		measureWhyHeight();
		window.addEventListener("resize", measureWhyHeight);
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureWhyHeight);

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

		/* ── probability tunnel ───────────────────────────────── */
		var isoHost = document.getElementById("tt-3d");
		var isoNextEl = document.getElementById("tt-next");
		var isoAltEl = document.getElementById("tt-alt");
		var isoMetaEl = document.getElementById("tt-meta");
		var isoAdvance = document.getElementById("tt-advance");
		var isoTempEl = document.getElementById("tt-temp");
		var isoTempOut = document.getElementById("tt-temp-out");
		var isoStep = 0;
		var isoTemp = 0.8;
		var isoChart = null;
		var isoLoaded = false;
		var isoLoading = false;
		var isoDrawn = false;
		var isoBallPos = null;
		var isoBallRaf = null;
		var isoBallEl = document.getElementById("tt-ball");
		var isoBallLabel = document.getElementById("tt-ball-label");
		var isoStepGap = 1.35;
		var isoYMax = 1.18;
		var isoLabelZ = 0.0;
		var isoLabels = DE ? {
			certain: "fast sicher", likely: "wahrscheinlich", open: "offen", wide: "sehr offen", width: "Tunnelbreite",
			axisStep: "Kontextschritt", axisMeaning: "andere Fortsetzungen", axisProb: "tiefer = wahrscheinlicher",
			deepest: "blaues Tal = Weg des geringsten Widerstands",
			loading: "Die 3D-Landschaft wird geladen …",
			failed: "Die 3D-Bibliothek konnte nicht geladen werden."
		} : {
			certain: "near-certain", likely: "likely", open: "open", wide: "wide open", width: "tunnel width",
			axisStep: "context step", axisMeaning: "other continuations", axisProb: "deeper = more likely",
			deepest: "blue valley = path of least resistance",
			loading: "Loading the 3D landscape …",
			failed: "The 3D library could not be loaded."
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
		function mixRgb(a, b, t) {
			var A = parseColor(a), B = parseColor(b);
			var r = Math.round(A[0] + (B[0] - A[0]) * t);
			var g = Math.round(A[1] + (B[1] - A[1]) * t);
			var bl = Math.round(A[2] + (B[2] - A[2]) * t);
			return "rgb(" + r + "," + g + "," + bl + ")";
		}
		function isoClamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
		function isoLerp(a, b, t) { return a + (b - a) * t; }
		function isoCenter(x) {
			var lo = Math.max(0, Math.min(isoPath.length - 1, Math.floor(x)));
			var hi = Math.min(isoPath.length - 1, lo + 1);
			var y = isoLerp(isoPath[lo].y, isoPath[hi].y, x - lo);
			return (y - 0.4) * 2.2;
		}
		function isoEntropyAt(x) {
			var lo = Math.max(0, Math.min(isoEntropy.length - 1, Math.floor(x)));
			var hi = Math.min(isoEntropy.length - 1, lo + 1);
			return isoLerp(isoEntropy[lo], isoEntropy[hi], x - lo);
		}
		function isoMainDepth() {
			return 0.26 + 0.30 * (2.0 - isoTemp) / 1.95;
		}
		function isoMainDepthAt(x) {
			var entropy = isoEntropyAt(x);
			return isoMainDepth() * (0.78 + 0.22 * (1 - entropy));
		}
		function isoMainWidth(x) {
			var entropy = isoEntropyAt(x);
			return 0.14 + 0.55 * (0.25 + entropy) * (0.40 + isoTemp / 1.7);
		}
		function isoAltY(alt) {
			return (alt.path.y - 0.4) * 2.2;
		}
		function isoAltEndY(alt) {
			return (isoAltY(alt) >= 0 ? 1 : -1) * 1.12;
		}
		function isoAltEndPoint(branch, alt) {
			var bx = branch.atStep + 0.52;
			var endY = isoAltEndY(alt) * 0.97;
			return [bx * isoStepGap, endY, isoSurfaceHeight(bx, endY) + 0.06];
		}
		function isoAltDepth(alt, mainDepth) {
			return mainDepth * (0.42 + 0.42 * (1 - alt.entropy) + 0.12 * isoTemp);
		}
		function isoValleyDepth(x, y) {
			var centre = isoCenter(x);
			var mainWidth = isoMainWidth(x);
			var mainDepth = isoMainDepthAt(x);
			var depth = Math.exp(-Math.pow((y - centre) / mainWidth, 2)) * mainDepth;
			isoBranches.forEach(function (branch) {
				var bx = branch.atStep + 0.52;
				var dx = x - bx;
				var startY = isoCenter(bx);
				branch.alternatives.forEach(function (alt) {
					var endY = isoAltEndY(alt);
					var t = (y - startY) / (endY - startY);
					if (t < 0 || t > 1) return;
					var sx = 0.30 + 0.12 * alt.entropy;
					var gate = 0.5 + 0.5 * Math.sin(Math.PI * t);
					var d = isoAltDepth(alt, mainDepth)
						* Math.exp(-Math.pow(dx / sx, 2)) * gate;
					if (d > depth) depth = d;
				});
			});
			var sideOffsets = [-1.20, -0.90, -0.60, -0.30, 0.30, 0.60, 0.90, 1.20];
			for (var si = 0; si < sideOffsets.length; si++) {
				var sy = centre + sideOffsets[si] + 0.08 * Math.sin(x * 1.25 + si * 1.7);
				var sw = 0.10 + 0.14 * (0.5 + 0.5 * Math.sin(x * 0.95 + si * 2.1)) * (0.5 + isoTemp / 1.8);
				var sd = mainDepth * (0.18 + 0.22 * (0.5 + 0.5 * Math.sin(x * 1.6 + si * 2.3))) * (0.65 + 0.35 * isoTemp);
				var ds = sd * Math.exp(-Math.pow((y - sy) / sw, 2));
				if (ds > depth) depth = ds;
			}
			var rimValley = mainDepth * 0.46 * Math.exp(-Math.pow((Math.abs(y) - isoYMax) / 0.26, 2));
			if (rimValley > depth) depth = rimValley;
			return depth;
		}
		function isoSurfaceHeight(stepX, y) {
			var depth = isoValleyDepth(stepX, y);
			var x = stepX * isoStepGap;
			var ripple = 0.022 * Math.sin(x * 1.8 + y * 3.1) * Math.cos(y * 2.2 - x * 1.25)
				+ 0.010 * Math.sin(x * 3.1 - y * 2.6) * Math.cos(y * 3.4 + x * 1.1);
			var edgeDrop = 0.05 * Math.pow(Math.abs(y) / isoYMax, 2);
			return -depth + (ripple - edgeDrop) * (1 - Math.min(1, depth));
		}
		function isoTokenPoint(index) {
			var x = index * isoStepGap;
			var y = isoCenter(index);
			return [x, y, isoSurfaceHeight(index, y) + 0.06];
		}
		function isoStopBall() {
			if (isoBallRaf) {
				cancelAnimationFrame(isoBallRaf);
				isoBallRaf = null;
			}
		}
		function isoMulMat4Vec4(m, v) {
			return [
				m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3],
				m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3],
				m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3],
				m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3]
			];
		}
		function isoProjectPoint(point) {
			if (!isoChart || !isoHost) return null;
			var series = isoChart.getModel().getSeriesByIndex(0);
			var cs = series && series.coordinateSystem;
			if (!cs || !cs.viewGL || !cs.dataToPoint) return null;
			var viewGL = cs.viewGL;
			var camera = viewGL.camera;
			var viewport = viewGL.viewport;
			var view = camera.viewMatrix.array || camera.viewMatrix;
			var proj = camera.projectionMatrix.array || camera.projectionMatrix;
			var world = cs.dataToPoint(point);
			var eye = isoMulMat4Vec4(view, [world[0], world[1], world[2], 1]);
			var clip = isoMulMat4Vec4(proj, eye);
			if (clip[3] <= 1e-6) return null;
			var ndcX = clip[0] / clip[3];
			var ndcY = clip[1] / clip[3];
			var scale = isoHost.clientWidth / viewport.width;
			return [
				(ndcX * 0.5 + 0.5) * viewport.width * scale,
				(1 - (ndcY * 0.5 + 0.5)) * viewport.height * scale
			];
		}
		function isoInsideHost(screen) {
			return !!screen && isFinite(screen[0]) && isFinite(screen[1])
				&& screen[0] >= -24 && screen[0] <= isoHost.clientWidth + 24
				&& screen[1] >= -24 && screen[1] <= isoHost.clientHeight + 24;
		}
		function isoEnsureOverlayLabels() {
			var container = document.getElementById("tt-labels");
			if (!container || container.dataset.ready === "1") return container;
			isoTokens.forEach(function (token, i) {
				var el = document.createElement("span");
				el.className = "tt-point-label";
				el.setAttribute("data-token-index", i);
				el.textContent = token;
				container.appendChild(el);
			});
			for (var a = 0; a < 2; a++) {
				var alt = document.createElement("span");
				alt.className = "tt-point-label tt-point-label--alt";
				alt.setAttribute("data-alt-index", a);
				alt.style.display = "none";
				container.appendChild(alt);
			}
			for (var d = 0; d < 4; d++) {
				var detour = document.createElement("span");
				detour.className = "tt-point-label tt-point-label--alt";
				detour.setAttribute("data-detour-index", d);
				detour.style.display = "none";
				container.appendChild(detour);
			}
			container.dataset.ready = "1";
			return container;
		}
		function isoLayoutLabels(entries) {
			entries.sort(function (a, b) { return a.screen[1] - b.screen[1]; });
			var placed = [];
			entries.forEach(function (entry) {
				var el = entry.el;
				var w = el.offsetWidth;
				var h = el.offsetHeight;
				var shift = 0;
				var box = { x: entry.screen[0] - w / 2, y: 0, w: w, h: h };
				function setBox() {
					box.y = entry.mode === "above"
						? entry.screen[1] - 8 - h - shift
						: entry.screen[1] + 8 + shift;
				}
				setBox();
				var moved = true;
				while (moved) {
					moved = false;
					for (var i = 0; i < placed.length; i++) {
						var p = placed[i];
						if (box.x < p.x + p.w + 3 && box.x + box.w + 3 > p.x
							&& box.y < p.y + p.h + 3 && box.y + box.h + 3 > p.y) {
							shift += h + 3;
							setBox();
							moved = true;
							break;
						}
					}
				}
				if (entry.mode === "above") {
					el.style.transform = "translate(-50%, calc(-100% - " + (8 + shift) + "px))";
				} else {
					el.style.transform = "translate(-50%, " + (8 + shift) + "px)";
				}
				placed.push(box);
			});
		}
		function isoUpdateOverlayLabels() {
			if (!isoChart || !isoHost) return;
			var container = isoEnsureOverlayLabels();
			if (!container) return;
			var entries = [];
			var step = Math.min(isoStep, isoTokens.length - 1);
			container.querySelectorAll("[data-token-index]").forEach(function (el) {
				var i = Number(el.getAttribute("data-token-index"));
				var point = isoTokenPoint(i);
				var screen = isoProjectPoint([point[0], point[1], isoLabelZ]);
				if (!screen) {
					el.style.display = "none";
					return;
				}
				el.style.display = "";
				el.style.left = screen[0] + "px";
				el.style.top = screen[1] + "px";
				el.classList.toggle("is-current", i === step);
				el.classList.toggle("is-future", i > step);
				entries.push({ el: el, screen: screen, mode: "above" });
			});
			var altEls = container.querySelectorAll("[data-alt-index]");
			altEls.forEach(function (el) { el.style.display = "none"; });
			var branch = null;
			for (var bi = 0; bi < isoBranches.length; bi++) {
				if (isoBranches[bi].atStep === step) { branch = isoBranches[bi]; break; }
			}
			if (branch) {
				branch.alternatives.forEach(function (alt, j) {
					var el = altEls[j];
					if (!el) return;
					var point = isoAltEndPoint(branch, alt);
					var screen = isoProjectPoint([point[0], point[1], isoLabelZ]);
					if (!screen) return;
					el.style.display = "";
					el.textContent = isoAltLabel(alt.token);
					el.style.left = screen[0] + "px";
					el.style.top = screen[1] + "px";
					entries.push({ el: el, screen: screen, mode: "below" });
				});
			}
			var detourEls = container.querySelectorAll("[data-detour-index]");
			detourEls.forEach(function (el) { el.style.display = "none"; });
			isoPossibleDetours().forEach(function (detour, j) {
				if (detour.branch.atStep === step) return;
				var el = detourEls[j];
				if (!el) return;
				var point = isoAltEndPoint(detour.branch, detour.alt);
				var screen = isoProjectPoint([point[0], point[1], isoLabelZ]);
				if (!screen) return;
				el.style.display = "";
				el.textContent = isoAltLabel(detour.alt.token);
				el.style.left = screen[0] + "px";
				el.style.top = screen[1] + "px";
				entries.push({ el: el, screen: screen, mode: "below" });
			});
			isoLayoutLabels(entries);
		}
		function isoUpdateBallOverlay() {
			if (!isoBallEl || !isoBallPos) return;
			var screen = isoProjectPoint(isoBallPos);
			if (!isoInsideHost(screen)) {
				isoBallEl.classList.remove("is-visible");
				return;
			}
			isoBallEl.style.left = screen[0] + "px";
			isoBallEl.style.top = screen[1] + "px";
			isoBallEl.classList.add("is-visible");
		}
		function isoSetBall(point) {
			isoBallPos = point.slice();
			isoUpdateBallOverlay();
		}
		function isoRollBallTo(index) {
			isoStopBall();
			var target = isoTokenPoint(index);
			if (!isoLoaded || !isoChart || TM.prefersReduced()) {
				isoSetBall(target);
				return;
			}
			var start = isoBallPos ? isoBallPos.slice() : target.slice();
			var begin = 0;
			var last = 0;
			function frame(now) {
				if (!isoChart) return;
				if (!begin) begin = now;
				if (now - last < 32) {
					isoBallRaf = requestAnimationFrame(frame);
					return;
				}
				last = now;
				var t = Math.min(1, (now - begin) / 680);
				var e = 1 - Math.pow(1 - t, 3);
				var x = isoLerp(start[0], target[0], e);
				var y = isoLerp(start[1], target[1], e);
				var z = isoSurfaceHeight(x / isoStepGap, y) + 0.10;
				isoSetBall([x, y, z]);
				if (t < 1) {
					isoBallRaf = requestAnimationFrame(frame);
				} else {
					isoBallRaf = null;
					isoBallPos = target;
				}
			}
			isoBallRaf = requestAnimationFrame(frame);
		}
		function isoArrowheadSeries(from, to, color, active) {
			var empty = [
				{ id: "momentum-head-a", type: "line3D", data: [], lineStyle: { width: 4, color: color, opacity: 0 }, silent: true },
				{ id: "momentum-head-b", type: "line3D", data: [], lineStyle: { width: 4, color: color, opacity: 0 }, silent: true }
			];
			if (!active || !from || !to) return empty;
			var dx = to[0] - from[0];
			var dy = to[1] - from[1];
			var dz = to[2] - from[2];
			var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
			var ux = dx / len, uy = dy / len, uz = dz / len;
			var head = Math.min(0.24, len * 0.45);
			var bx = to[0] - ux * head;
			var by = to[1] - uy * head;
			var bz = to[2] - uz * head;
			var px = -uy, py = ux;
			var pl = Math.sqrt(px * px + py * py) || 1;
			px /= pl; py /= pl;
			var spread = head * 0.45;
			return [
				{
					id: "momentum-head-a",
					type: "line3D",
					data: [[bx + px * spread, by + py * spread, bz], to.slice()],
					lineStyle: { width: 4, color: color, opacity: 0.85 },
					silent: true
				},
				{
					id: "momentum-head-b",
					type: "line3D",
					data: [[bx - px * spread, by - py * spread, bz], to.slice()],
					lineStyle: { width: 4, color: color, opacity: 0.85 },
					silent: true
				}
			];
		}
		function isoPossibleDetours() {
			var candidates = [];
			isoBranches.forEach(function (branch) {
				branch.alternatives.forEach(function (alt) {
					var score = (1 - alt.entropy) * (0.75 + 0.25 * isoTemp);
					if (score >= 0.35) {
						candidates.push({ branch: branch, alt: alt, score: score });
					}
				});
			});
			candidates.sort(function (a, b) { return b.score - a.score; });
			return candidates.slice(0, isoTemp >= 1.2 ? 4 : 3);
		}
		function isoDetourSeries(c, index, detour) {
			if (!detour) {
				return {
					id: "detour-" + index,
					name: "possible-path",
					type: "line3D",
					data: [],
					lineStyle: { width: 2, color: c.gold, opacity: 0 },
					silent: true
				};
			}
			var branch = detour.branch;
			var alt = detour.alt;
			var bx = branch.atStep + 0.52;
			var x = bx * isoStepGap;
			var startY = isoCenter(bx);
			var endY = isoAltEndY(alt) * 0.97;
			var points = [];
			for (var t = 0; t <= 1.0001; t += 0.1) {
				var y = isoLerp(startY, endY, t);
				points.push([x, y, isoSurfaceHeight(bx, y) + 0.14]);
			}
			return {
				id: "detour-" + index,
				name: "possible-path",
				type: "line3D",
				data: points,
				lineStyle: { width: 2, color: c.gold, opacity: 0.62, type: "dashed" },
				silent: true
			};
		}
		function isoBuildDynamicSeries(c, step) {
			var series = [];
			var tokens = isoTokens.map(function (token, i) {
				var current = i === step;
				var visited = i <= step;
				return {
					name: token,
					tokenIndex: i,
					value: isoTokenPoint(i),
					symbolSize: current ? 13 : 7,
					itemStyle: {
						color: current ? c.green : c.blue,
						borderColor: c.paper,
						borderWidth: current ? 2 : 1,
						opacity: visited ? 1 : 0.55
					}
				};
			});
			series.push({
				id: "tokens",
				name: "tokens",
				type: "scatter3D",
				data: tokens,
				symbol: "circle",
				tooltip: { formatter: function (p) { return p.name; } }
			});
			var trail = [];
			for (var ti = 0; ti <= step; ti++) trail.push(isoTokenPoint(ti));
			var hasTrail = trail.length > 1;
			series.push({
				id: "path-glow",
				name: "path-glow",
				type: "line3D",
				data: hasTrail ? trail : [],
				lineStyle: { width: 12, color: c.blue, opacity: 0.16 },
				silent: true
			});
			series.push({
				id: "path",
				name: "path",
				type: "line3D",
				data: hasTrail ? trail : [],
				lineStyle: { width: 3.5, color: c.blue, opacity: 0.95 },
				silent: true
			});
			var detours = isoPossibleDetours();
			for (var di = 0; di < 4; di++) {
				series.push(isoDetourSeries(c, di, detours[di]));
			}
			var altPoints = [];
			isoBranches.forEach(function (branch) {
				var currentBranch = branch.atStep === step;
				branch.alternatives.forEach(function (alt) {
					altPoints.push({
						name: isoAltLabel(alt.token),
						value: isoAltEndPoint(branch, alt),
						symbolSize: currentBranch ? 9 : 6,
						itemStyle: {
							color: currentBranch ? c.gold : mixRgb(c.gold, c.paper, 0.35),
							borderColor: c.paper,
							borderWidth: currentBranch ? 1.5 : 1,
							opacity: currentBranch ? 1 : 0.72
						}
					});
				});
			});
			series.push({
				id: "other-tokens",
				name: "other-tokens",
				type: "scatter3D",
				data: altPoints,
				symbol: "diamond",
				tooltip: { formatter: function (p) { return p.name; } }
			});
			var hasMomentum = step < isoTokens.length - 1;
			var arrowTo = null;
			if (hasMomentum) {
				var arrowStepX = Math.min(isoTokens.length - 1, step + 0.52);
				var arrowX = arrowStepX * isoStepGap;
				var arrowY = isoCenter(arrowStepX);
				arrowTo = [arrowX, arrowY, isoSurfaceHeight(arrowStepX, arrowY) + 0.11];
			}
			var momentumData = hasMomentum ? [isoBallPos.slice(), arrowTo] : [];
			series.push({
				id: "momentum-glow",
				name: "momentum-glow",
				type: "line3D",
				data: momentumData,
				lineStyle: { width: 14, color: c.green, opacity: 0.14 },
				silent: true
			});
			series.push({
				id: "momentum",
				name: "momentum",
				type: "line3D",
				data: momentumData,
				lineStyle: { width: 5, color: c.green, opacity: 0.85 },
				silent: true
			});
			var arrows = isoArrowheadSeries(isoBallPos, arrowTo, c.green, hasMomentum);
			series.push(arrows[0], arrows[1]);
			return series;
		}
		function isoSurfaceData() {
			var data = [];
			var xCount = 65, yCount = 45;
			var xMin = 0, xMax = (isoTokens.length - 1) * isoStepGap;
			var yMin = -isoYMax, yMax = isoYMax;
			for (var yi = 0; yi <= yCount; yi++) {
				var y = isoLerp(yMin, yMax, yi / yCount);
				for (var xi = 0; xi <= xCount; xi++) {
					var x = isoLerp(xMin, xMax, xi / xCount);
					var z = isoSurfaceHeight(x / isoStepGap, y);
					data.push([Number(x.toFixed(3)), Number(y.toFixed(3)), Number(z.toFixed(4))]);
				}
			}
			return { data: data, shape: [yCount + 1, xCount + 1] };
		}
		function isoFallback(message) {
			if (isoChart) { isoChart.dispose(); isoChart = null; }
			if (isoHost) isoHost.innerHTML = '<div class="tt-fallback">' + message + '</div>';
		}
		function ensureIsoLibs(cb) {
			if (TM.ensureECharts) TM.ensureECharts(cb, function () { isoFallback(isoLabels.failed); });
			else isoFallback(isoLabels.failed);
		}
		function drawIso() {
			if (!isoHost || !window.echarts || !window.echarts.init) return;
			var c = TM.colors();
			var surface = isoSurfaceData();
			var zMin = 0;
			for (var zi = 0; zi < surface.data.length; zi++) {
				if (surface.data[zi][2] < zMin) zMin = surface.data[zi][2];
			}
			zMin -= 0.03;
			var deepSurface = mixRgb(c.blue, c.ink, c.dark ? 0.28 : 0.52);
			var baseSurface = mixRgb(c.paper2, c.gold, c.dark ? 0.16 : 0.22);
			if (!isoChart) {
				isoHost.innerHTML = "";
				try {
					isoChart = echarts.init(isoHost);
				} catch (e) {
					isoFallback(isoLabels.failed);
					return;
				}
				isoChart.on("click", function (params) {
					var idx = null;
					if (params && params.data && typeof params.data.tokenIndex === "number") idx = params.data.tokenIndex;
					else if (params && params.value && params.value.length >= 1) idx = Math.round(params.value[0] / isoStepGap);
					if (idx !== null && idx >= 0 && idx < isoTokens.length) {
						isoSetStep(idx);
					}
				});
				isoChart.on("rendered", isoUpdateBallOverlay);
				isoChart.on("rendered", isoUpdateOverlayLabels);
			}
			var step = Math.min(isoStep, isoTokens.length - 1);
			if (!isoBallPos) isoBallPos = isoTokenPoint(step);
			var surfaceSeries = {
				id: "landscape",
				name: "landscape",
				type: "surface",
				data: surface.data,
				dataShape: surface.shape,
				shading: "lambert",
				wireframe: { show: false },
				itemStyle: { opacity: 1 }
			};
			var ballSize = Math.round(14 + isoTemp * 5);
			if (isoBallEl) {
				isoBallEl.style.width = ballSize + "px";
				isoBallEl.style.height = ballSize + "px";
			}
			if (isoBallLabel) isoBallLabel.textContent = DE ? "Kontext" : "context";
			var series = [surfaceSeries].concat(isoBuildDynamicSeries(c, step));
			var option = {
				backgroundColor: "transparent",
				tooltip: {
					trigger: "item", confine: true,
					backgroundColor: c.dark ? "rgba(10,34,44,.96)" : "rgba(255,255,255,.98)",
					borderColor: c.lineStrong,
					textStyle: { color: c.ink, fontSize: 12 }
				},
				visualMap: {
					show: false,
					dimension: 2,
					min: zMin,
					max: 0.03,
					inRange: { color: [deepSurface, c.blue, c.sky, c.green, c.gold, baseSurface] }
				},
				xAxis3D: {
					type: "value", name: isoLabels.axisStep,
					min: 0, max: (isoTokens.length - 1) * isoStepGap, interval: isoStepGap,
					nameTextStyle: { color: c.ink, fontSize: 12, fontWeight: 600 },
					nameGap: 16,
					axisLabel: {
						interval: 0,
						formatter: function (v) {
							var i = Math.round(v / isoStepGap);
							return i >= 0 && i < isoTokens.length ? String(i) : "";
						},
						textStyle: { color: c.inkSoft || c.ink, fontSize: 10, fontWeight: 600 }
					},
					axisLine: { lineStyle: { color: c.lineStrong } },
					splitLine: { lineStyle: { color: c.line } }
				},
				yAxis3D: {
					type: "value", name: isoLabels.axisMeaning,
					min: -isoYMax, max: isoYMax, interval: 0.59,
					nameTextStyle: { color: c.ink, fontSize: 12, fontWeight: 600 },
					nameGap: 14,
					axisLabel: { show: false },
					axisLine: { lineStyle: { color: c.lineStrong } },
					splitLine: { lineStyle: { color: c.line } }
				},
				zAxis3D: {
					type: "value", name: isoLabels.axisProb,
					min: zMin, max: 0.03,
					nameTextStyle: { color: c.ink, fontSize: 12, fontWeight: 600 },
					nameGap: 12,
					axisLabel: { show: false },
					axisLine: { lineStyle: { color: c.lineStrong } },
					splitLine: { lineStyle: { color: c.line } }
				},
				grid3D: {
					viewControl: {
						projection: "perspective",
						alpha: 34, beta: 42, distance: 205,
						autoRotate: false, damping: 0.9,
						rotateSensitivity: 1.2, zoomSensitivity: 1.2
					},
					light: {
						main: { intensity: 1.22, shadow: false, alpha: 38, beta: 16 },
						ambient: { intensity: 0.52 }
					},
					environment: c.paper2,
					boxWidth: 125, boxHeight: 28, boxDepth: 105,
					axisLine: { lineStyle: { color: c.lineStrong } },
					splitLine: { lineStyle: { color: c.line } },
					axisPointer: { show: false }
				},
				series: series
			};
			if (isoDrawn) delete option.grid3D.viewControl;
			try {
				isoChart.setOption(option, { replaceMerge: ["series"], lazyUpdate: false });
				isoChart.resize();
				isoDrawn = true;
			} catch (e) {
				isoFallback(isoLabels.failed);
			}
			requestAnimationFrame(isoUpdateBallOverlay);
			requestAnimationFrame(isoUpdateOverlayLabels);
			updateIsoSide();
		}
		function isoUpdateStepSeries() {
			if (!isoChart) return;
			var c = TM.colors();
			var step = Math.min(isoStep, isoTokens.length - 1);
			try {
				isoChart.setOption({ series: isoBuildDynamicSeries(c, step) }, { lazyUpdate: false });
			} catch (e) {}
			requestAnimationFrame(isoUpdateBallOverlay);
			requestAnimationFrame(isoUpdateOverlayLabels);
			updateIsoSide();
		}
		function isoSetStep(index) {
			var next = Math.max(0, Math.min(isoTokens.length - 1, index));
			isoStep = next;
			if (isoLoaded) {
				isoUpdateStepSeries();
				isoRollBallTo(next);
			} else {
				isoBallPos = null;
				updateIsoSide();
			}
		}
		function isoRenderTokens() {
			var row = document.getElementById("tt-token-row");
			if (!row) return;
			row.innerHTML = isoTokens.map(function (token, i) {
				return '<button class="tt-token" type="button" data-index="' + i + '">' + token + '</button>';
			}).join("");
			row.querySelectorAll("button").forEach(function (btn) {
				btn.addEventListener("click", function () {
					isoSetStep(parseInt(btn.getAttribute("data-index"), 10) || 0);
				});
			});
		}
		function isoMarkCurrentToken(step) {
			var row = document.getElementById("tt-token-row");
			if (!row) return;
			row.querySelectorAll(".tt-token").forEach(function (btn, i) {
				btn.classList.toggle("is-current", i === step);
				btn.setAttribute("aria-pressed", i === step ? "true" : "false");
			});
		}
		function updateIsoSide() {
			var step = Math.min(isoStep, isoTokens.length - 1);
			isoMarkCurrentToken(step);
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
				+ '<div style="margin-top:.55em">' + isoLabels.width + ' <b>' + eff.toFixed(2) + '</b></div>'
				+ '<div style="margin-top:.55em;color:var(--tm-muted)">' + isoLabels.deepest + '</div>';
		}
		function startIso() {
			if (isoLoaded || isoLoading) return;
			isoLoading = true;
			if (isoHost) isoHost.innerHTML = '<div class="tt-fallback">' + isoLabels.loading + '</div>';
			ensureIsoLibs(function () {
				isoLoading = false;
				isoLoaded = true;
				drawIso();
			});
		}
		if (isoHost) {
			if ("IntersectionObserver" in window) {
				var isoObserver = new IntersectionObserver(function (entries) {
					if (entries.some(function (e) { return e.isIntersecting; })) {
						isoObserver.disconnect();
						startIso();
					}
				}, { rootMargin: "400px 0px" });
				isoObserver.observe(isoHost);
			} else {
				startIso();
			}
			if (isoTempEl) {
				isoTempEl.addEventListener("input", function () {
					isoTemp = parseFloat(isoTempEl.value) || 0.8;
					isoStopBall();
					isoBallPos = isoTokenPoint(isoStep);
					if (isoLoaded) drawIso();
					else updateIsoSide();
				});
			}
			if (isoAdvance) {
				isoAdvance.addEventListener("click", function () {
					isoSetStep((isoStep + 1) % isoTokens.length);
				});
			}
			window.addEventListener("tm:theme", function () {
				if (!isoLoaded) return;
				isoStopBall();
				isoBallPos = isoTokenPoint(isoStep);
				drawIso();
			});
			window.addEventListener("resize", function () {
				if (!isoChart) return;
				isoChart.resize();
				requestAnimationFrame(isoUpdateBallOverlay);
				requestAnimationFrame(isoUpdateOverlayLabels);
			});
			isoRenderTokens();
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
				? 'Der Raum hat in dieser Demo zwei gelernte Richtungen. Wähle ein Beispiel, um zu sehen, wo es landet.'
				: 'The space has two learned directions in this demo. Choose an example to see where it lands.';
		}
		function embDirText(mode) {
			if (mode === "gender") return DE
				? 'Eine gelernte Richtung verbindet Mann und Frau sowie König und Königin. Sie ist eine Richtung im Raum, keine benannte Achse.'
				: 'One learned direction connects man and woman, and king and queen. It is a direction in the space, not a named axis.';
			if (mode === "power") return DE
				? 'Eine andere gelernte Richtung führt von Mann zu Prinz zu König und von Frau zu Prinzessin zu Königin. Das Modell lernt sie aus den Daten.'
				: 'Another learned direction moves from man to prince to king and from woman to princess to queen. The model learns it from the data.';
			return DE
				? 'Zwei gelernte Richtungen: Eine verbindet Mann und Frau, König und Königin; eine andere führt von Mann zu Prinz zu König. Bedeutung lebt in Positionen und Richtungen.'
				: 'Two learned directions: one connects man and woman, king and queen; another moves from man to prince to king. Meaning lives in positions and in directions.';
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
			ctx.fillText((DE ? "Richtung A" : "direction A") + " →", mx(embRange.x1) - 72, my(0) - 8);
			ctx.save();
			ctx.translate(mx(0) - 8, my(embRange.y0) + 40);
			ctx.rotate(-Math.PI / 2);
			ctx.fillText((DE ? "Richtung B" : "direction B") + " →", 0, 0);
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
					arrow(embSpace.Man, embSpace.Woman, green, DE ? "Richtung B" : "direction B");
					arrow(embSpace.King, embSpace.Queen, green, "");
				}
				if (embDirMode === "power" || embDirMode === "all") {
					arrow(embSpace.Man, embSpace.Prince, gold, DE ? "Richtung A" : "direction A");
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
		var POS_D_MODEL = 3;
		var POS_CURVE_STEP = 0.75;
		var POS_COLORS = ["green", "blue", "gold"];
		var POS_LABELS = ["d0", "d1", "d2"];
		var posReduce = TM.prefersReduced();
		var posAuto = !posReduce;
		var posClock = 0;
		var posYaw = 0;
		var posPitch = 0;
		var posDrag = null;
		function posPE(position, dim) {
			var pair = Math.floor(dim / 2) * 2;
			var denom = Math.pow(10000, pair / POS_D_MODEL);
			return dim % 2 === 0 ? Math.sin(position / denom) : Math.cos(position / denom);
		}
		function posRgba(hex, alpha) {
			var rgb = hexToRgb(hex);
			return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + alpha + ")";
		}
		function posProjector(w, h) {
			var t = posClock * 0.00018;
			var az = -0.62 + posYaw + (posAuto ? Math.sin(t) * 0.26 : 0);
			var el = TM.clamp(0.34 + posPitch + (posAuto ? Math.sin(t * 0.7) * 0.035 : 0), -1.2, 1.2);
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
		function posVector(position) {
			return [posPE(position, 0), posPE(position, 1), posPE(position, 2)];
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

			var pillData = [];
			POS_LABELS.forEach(function (label, i) {
				var plus = [0, 0, 0];
				var minus = [0, 0, 0];
				plus[i] = 1.08;
				minus[i] = -1.08;
				var a = project(plus);
				var b = project(minus);
				ctx.beginPath();
				ctx.moveTo(a.x, a.y);
				ctx.lineTo(b.x, b.y);
				ctx.strokeStyle = posRgba(c[POS_COLORS[i]], 0.5);
				ctx.lineWidth = 1.4;
				ctx.stroke();
				pillData.push({ x: a.x, y: a.y, color: c[POS_COLORS[i]], text: label });
			});

			var primitives = [];
			function addLine(ax, ay, az, bx, by, bz, color, width, dash, cap) {
				primitives.push({
					z: (az + bz) / 2,
					draw: function (ctx) {
						ctx.save();
						if (dash) ctx.setLineDash(dash);
						ctx.beginPath();
						ctx.moveTo(ax, ay);
						ctx.lineTo(bx, by);
						ctx.strokeStyle = color;
						ctx.lineWidth = width;
						ctx.lineCap = cap || "round";
						ctx.stroke();
						ctx.restore();
					}
				});
			}
			function addCircle(x, y, z, r, fill, stroke, strokeWidth) {
				primitives.push({
					z: z,
					draw: function (ctx) {
						ctx.beginPath();
						ctx.arc(x, y, r, 0, Math.PI * 2);
						if (fill) { ctx.fillStyle = fill; ctx.fill(); }
						if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeWidth || 1; ctx.stroke(); }
					}
				});
			}

			if (posShown > 0.01) {
				var steps = Math.max(2, Math.min(1600, Math.ceil(posShown / POS_CURVE_STEP)));
				var prev = project(posVector(0));
				for (var i = 1; i <= steps; i++) {
					var t = posShown * i / steps;
					var q = project(posVector(t));
					addLine(prev.x, prev.y, prev.z, q.x, q.y, q.z, posRgba(c.sky, 0.42), 1.6, null, "butt");
					prev = q;
				}
			}

			var v = posVector(posShown);
			var tip = project(v);
			var origin = project([0, 0, 0]);
			v.forEach(function (val, i) {
				var foot = [0, 0, 0];
				foot[i] = val;
				var f = project(foot);
				var last = tip;
				for (var k = 1; k <= 16; k++) {
					var u = k / 16;
					var p = {
						x: tip.x + (f.x - tip.x) * u,
						y: tip.y + (f.y - tip.y) * u,
						z: tip.z + (f.z - tip.z) * u
					};
					addLine(last.x, last.y, last.z, p.x, p.y, p.z, posRgba(c[POS_COLORS[i]], 0.55), 1, [4, 4]);
					last = p;
				}
				addCircle(f.x, f.y, f.z, 2.6, c[POS_COLORS[i]], null, 0);
			});

			var last = origin;
			for (var k = 1; k <= 20; k++) {
				var u = k / 20;
				var p = {
					x: origin.x + (tip.x - origin.x) * u,
					y: origin.y + (tip.y - origin.y) * u,
					z: origin.z + (tip.z - origin.z) * u
				};
				addLine(last.x, last.y, last.z, p.x, p.y, p.z, posRgba(c.green, 0.9), 2.6);
				last = p;
			}

			primitives.push({
				z: tip.z,
				draw: function (ctx) {
					posGlow(ctx, tip.x, tip.y, 22, c.green, 0.3);
					ctx.beginPath();
					ctx.arc(tip.x, tip.y, 6, 0, Math.PI * 2);
					ctx.fillStyle = c.green;
					ctx.fill();
					ctx.strokeStyle = c.card;
					ctx.lineWidth = 2;
					ctx.stroke();
				}
			});

			var ballRadius = Math.max(10, unit * 0.12);
			primitives.push({
				z: origin.z,
				draw: function (ctx) {
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
			});

			primitives.sort(function (a, b) { return a.z - b.z; });
			primitives.forEach(function (p) { p.draw(ctx); });

			pillData.forEach(function (p) { posPill(ctx, c, w, h, p.x, p.y, p.color, p.text); });

			ctx.textAlign = "center";
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.fillStyle = c.muted;
			ctx.fillText(DE ? "Token (Originalwort)" : "token (original word)", cx, cy + ballRadius + 16);
			ctx.textAlign = "left";
		}
		if (posCanvas) {
			posApi = TM.initCanvas(posCanvas, drawPos);
			var posSlider = document.getElementById("ipe-pos");
			var posCountOut = document.getElementById("ipe-pos-out");
			var posVisible = true;
			posClock = (window.performance && performance.now) ? performance.now() : 0;
			function posFormat(value) {
				return value.toFixed(2).replace(".", DE ? "," : ".");
			}
			function posRenderOut() {
				if (!posOut) return;
				posOut.innerHTML = (DE ? 'Ein Token an Position ' : 'One token at position ') + '<b>' + pos + '</b>' +
					' · d0 <b>' + posFormat(posPE(pos, 0)) + '</b>' +
					' · d1 <b>' + posFormat(posPE(pos, 1)) + '</b>' +
					' · d2 <b>' + posFormat(posPE(pos, 2)) + '</b>.';
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
			function posEndDrag(ev) {
				if (!posDrag) return;
				posDrag = null;
				posCanvas.classList.remove("is-dragging");
				if (posCanvas.hasPointerCapture && posCanvas.hasPointerCapture(ev.pointerId)) {
					posCanvas.releasePointerCapture(ev.pointerId);
				}
			}
			posCanvas.addEventListener("pointerdown", function (ev) {
				if (ev.button !== undefined && ev.button !== 0) return;
				posDrag = { x: ev.clientX, y: ev.clientY };
				posCanvas.classList.add("is-dragging");
				if (posAuto) {
					var t = posClock * 0.00018;
					posYaw += Math.sin(t) * 0.26;
					posPitch = TM.clamp(posPitch + Math.sin(t * 0.7) * 0.035, -1.2, 1.2);
					posAuto = false;
					if (posAutoBtn) {
						posAutoBtn.classList.remove("is-on");
						posAutoBtn.setAttribute("aria-pressed", "false");
					}
				}
				if (posCanvas.setPointerCapture) posCanvas.setPointerCapture(ev.pointerId);
			});
			posCanvas.addEventListener("pointermove", function (ev) {
				if (!posDrag) return;
				posYaw += (ev.clientX - posDrag.x) * 0.01;
				posPitch = TM.clamp(posPitch + (ev.clientY - posDrag.y) * 0.01, -1.2, 1.2);
				posDrag = { x: ev.clientX, y: ev.clientY };
				if (posApi) posApi.redraw();
			});
			posCanvas.addEventListener("pointerup", posEndDrag);
			posCanvas.addEventListener("pointercancel", posEndDrag);
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
			{ sentence: 'Ich gehe zur <span class="aw-bank">Bank</span>.', contexts: [], shift: [5, 5], weights: { bank: 1, river: 0, money: 0 }, caption: 'Ohne eindeutigen Kontext: <b>Bank</b> bleibt in der Mitte, mehrdeutig.' },
			{ sentence: 'Ich sitze im <span class="aw-river">Park</span> auf der <span class="aw-bank">Bank</span>.', contexts: ['river'], shift: [3.2, 6.8], weights: { bank: 0.35, river: 0.65, money: 0 }, caption: '<b>Park</b> ist der Nachbar → Bank bewegt sich zur Sitzbank-Bedeutung.' },
			{ sentence: 'Ich bringe mein <span class="aw-money">Geld</span> zur <span class="aw-bank">Bank</span>.', contexts: ['money'], shift: [7.2, 3.2], weights: { bank: 0.3, river: 0, money: 0.7 }, caption: '<b>Geld</b> ist der Nachbar → Bank bewegt sich zur Finanzbedeutung.' },
			{ sentence: 'Nach dem Spaziergang im <span class="aw-river">Park</span> gehe ich zur <span class="aw-bank">Bank</span>, um mein <span class="aw-money">Geld</span> einzuzahlen.', contexts: ['river', 'money'], shift: [6.6, 5.6], weights: { bank: 0.25, river: 0.35, money: 0.4 }, caption: 'Beide Nachbarn ziehen; <b>Geld</b> bleibt etwas stärker, <b>Park</b> hebt die Bedeutung an.' }
		] : [
			{ sentence: 'I walk to the <span class="aw-bank">bank</span>.', contexts: [], shift: [5, 5], weights: { bank: 1, river: 0, money: 0 }, caption: 'No unambiguous context: <b>bank</b> stays in the middle, ambiguous.' },
			{ sentence: 'I sit on the sandy <span class="aw-river">river</span> <span class="aw-bank">bank</span>.', contexts: ['river'], shift: [3.2, 6.8], weights: { bank: 0.35, river: 0.65, money: 0 }, caption: '<b>River</b> is the neighbour → bank moves toward the water sense.' },
			{ sentence: 'I bring my <span class="aw-money">money</span> to the <span class="aw-bank">bank</span>.', contexts: ['money'], shift: [7.2, 3.2], weights: { bank: 0.3, river: 0, money: 0.7 }, caption: '<b>Money</b> is the neighbour → bank moves toward finance.' },
			{ sentence: 'After the walk by the <span class="aw-river">river</span> I go to the <span class="aw-bank">bank</span> to deposit my <span class="aw-money">money</span>.', contexts: ['river', 'money'], shift: [6.6, 5.6], weights: { bank: 0.25, river: 0.35, money: 0.4 }, caption: 'Both neighbours pull; <b>money</b> stays slightly stronger, <b>river</b> lifts the meaning.' }
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
		var attMatrix = document.getElementById("iatt-matrix");
		var attSum = document.getElementById("iatt-sum");
		function renderAtt() {
			var ex = attExamples[attIndex];
			if (attSentence) attSentence.innerHTML = ex.sentence;
			if (attOut) attOut.innerHTML = ex.caption;
			document.querySelectorAll("[data-att]").forEach(function (b) {
				b.classList.toggle("is-on", parseInt(b.getAttribute("data-att"), 10) === attIndex);
			});
			var outv = [0, 0];
			["bank", "river", "money"].forEach(function (word) {
				var w = ex.weights[word];
				var p = attPos[word];
				outv[0] += w * p[0];
				outv[1] += w * p[1];
			});
			if (attMatrix) {
				var cols = ["bank", "river", "money"];
				var html = '<div class="am-title">' + (DE ? "Aufmerksamkeit von " : "attention from ") + attLabel("bank") + (DE ? ": wie stark sie auf jedes Wort achtet" : ": how strongly it looks at each word") + "</div>";
				html += '<div class="am-row">';
				cols.forEach(function (word) {
					var pct = Math.round(ex.weights[word] * 100);
					html += '<div class="am-cell"><b>' + attLabel(word) + "</b><span>" + pct + (DE ? " %" : "%") + '</span><span class="am-bar"><i style="width:' + pct + "%;background:" + attColors[word] + '"></i></span></div>';
				});
				html += "</div>";
				html += '<div style="margin-top:8px;font-size:0.68rem;color:var(--tm-muted);display:flex;flex-wrap:wrap;gap:6px 14px;">';
				cols.forEach(function (word) {
					var p = attPos[word];
					html += '<span><b>v<sub>' + attLabel(word) + "</sub></b> = (" + p[0].toFixed(2) + ", " + p[1].toFixed(2) + ")</span>";
				});
				html += "</div>";
				attMatrix.innerHTML = html;
			}
			if (attSum) {
				function vec(word) {
					var p = attPos[word];
					return "\\begin{pmatrix}" + p[0].toFixed(2) + "\\\\" + p[1].toFixed(2) + "\\end{pmatrix}";
				}
				var words = ["bank", "river", "money"].filter(function (word) {
					return ex.weights[word] > 0;
				});
				var weighted = words.map(function (word) {
					return "\\underbrace{" + Math.round(ex.weights[word] * 100) + "\\%}_{\\text{" + (DE ? "Aufmerksamkeit" : "attention") + "}}\\," + "\\underbrace{" + vec(word) + "}_{v_{\\text{" + attLabel(word) + "}}}";
				});
				var xTerms = [], yTerms = [];
				words.forEach(function (word) {
					var w = ex.weights[word].toFixed(2);
					var p = attPos[word];
					xTerms.push(w + "\\cdot " + p[0].toFixed(2));
					yTerms.push(w + "\\cdot " + p[1].toFixed(2));
				});
				var arithmetic = "\\begin{pmatrix}" + xTerms.join(" + ") + "\\\\" + yTerms.join(" + ") + "\\end{pmatrix}";
				var outTex = "\\begin{pmatrix}" + outv[0].toFixed(2) + "\\\\" + outv[1].toFixed(2) + "\\end{pmatrix}";
				var tex = "\\underbrace{\\begin{aligned} \\text{out}_{\\text{" + attLabel("bank") + "}} &= " + weighted.join(" \\\\ &\\quad + ") + " \\\\ &= " + arithmetic + " = \\underbrace{" + outTex + "}_{\\text{" + (DE ? "gewichtete Summe" : "weighted sum") + "}} \\end{aligned}}_{\\text{" + (DE ? "was Bank aus dem Kontext mitnimmt" : "what bank takes from the context") + "}}";
				attSum.setAttribute("data-tex", tex);
				attSum.removeAttribute("data-tex-rendered");
				if (TM.typesetMath) TM.typesetMath(attSum.parentNode);
			}
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
			if (embApi) embApi.redraw();
			if (posApi) posApi.redraw();
			if (attApi) attApi.redraw();
		});
	})();
	</script>
	<script>
	(function () {
		"use strict";
		var stage = document.getElementById("softmax-stage");
		if (!stage) return;
		var DE = TM.lang() === "de";
		var PROMPTS = {
			spaceship: {
				text: "“As the spaceship was approaching <b>the</b>”",
				rows: [
					{ token: "planet", logit: -92.8636474609375 },
					{ token: "surface", logit: -94.18270874023438 },
					{ token: "station", logit: -94.41707611083984 },
					{ token: "moon", logit: -94.45668029785156 },
					{ token: "Earth", logit: -94.46949005126953 },
					{ token: "end", logit: -94.54924774169922 },
					{ token: "ship", logit: -94.74138641357422 },
					{ token: "edge", logit: -94.87800598144531 },
					{ token: "star", logit: -94.9022216796875 },
					{ token: "asteroid", logit: -94.97351837158203 }
				]
			},
			planet: {
				text: "“On the deserted planet they discovered <b>a</b>”",
				rows: [
					{ token: "strange", logit: -89.01858520507812 },
					{ token: "mysterious", logit: -89.26126861572266 },
					{ token: "planet", logit: -89.26339721679688 },
					{ token: "large", logit: -89.2662124633789 },
					{ token: "massive", logit: -89.29888916015625 },
					{ token: "small", logit: -89.4354476928711 },
					{ token: "new", logit: -89.59513092041016 },
					{ token: "vast", logit: -89.6324462890625 },
					{ token: "huge", logit: -89.85299682617188 },
					{ token: "giant", logit: -90.060302734375 }
				]
			}
		};
		var logitsEl = document.getElementById("softmax-logits");
		var probsEl = document.getElementById("softmax-probs");
		var ribbons = document.getElementById("softmax-ribbons");
		var tempInput = document.getElementById("softmax-temp");
		var tempOut = document.getElementById("softmax-temp-out");
		var contextEl = document.getElementById("softmax-context-text");
		var readout = {
			token: document.getElementById("softmax-token"),
			logit: document.getElementById("softmax-logit"),
			exp: document.getElementById("softmax-exp"),
			prob: document.getElementById("softmax-prob")
		};
		var state = { key: "spaceship", temp: 1, hovered: 0 };
		var lrows = [], lfills = [], prows = [], pfills = [], probs = [], exps = [];
		function softmaxFor() {
			var rows = PROMPTS[state.key].rows;
			var logits = rows.map(function (d) { return d.logit; });
			var max = Math.max.apply(null, logits);
			var min = Math.min.apply(null, logits);
			var t = state.temp || 1;
			var ex = logits.map(function (v) { return Math.exp((v - max) / t); });
			var sum = ex.reduce(function (a, b) { return a + b; }, 0);
			return { max: max, min: min, ex: ex, sum: sum, probs: ex.map(function (e) { return e / sum; }) };
		}
		function makeRow(side, i) {
			var row = document.createElement("div");
			row.className = "softmax-row";
			row.setAttribute("tabindex", "0");
			var label = document.createElement("span");
			label.className = "softmax-row-label";
			var bar = document.createElement("span");
			bar.className = "softmax-bar";
			var fill = document.createElement("i");
			bar.appendChild(fill);
			var value = document.createElement("span");
			value.className = "softmax-value";
			if (side === "left") {
				row.appendChild(label);
				row.appendChild(bar);
				row.appendChild(value);
			} else {
				row.appendChild(value);
				row.appendChild(bar);
				row.appendChild(label);
			}
			row.addEventListener("mouseenter", function () { setHover(i); });
			row.addEventListener("focus", function () { setHover(i); });
			row.addEventListener("blur", function () { setHover(0); });
			row.addEventListener("click", function () { setHover(i); });
			return { row: row, label: label, fill: fill };
		}
		function build() {
			var rows = PROMPTS[state.key].rows;
			logitsEl.innerHTML = "";
			probsEl.innerHTML = "";
			lrows = []; lfills = []; prows = []; pfills = [];
			rows.forEach(function (d, i) {
				var l = makeRow("left", i);
				l.label.textContent = d.token;
				logitsEl.appendChild(l.row);
				lrows.push(l.row);
				lfills.push(l.fill);
				var p = makeRow("right", i);
				p.label.textContent = d.token;
				probsEl.appendChild(p.row);
				prows.push(p.row);
				pfills.push(p.fill);
			});
			contextEl.innerHTML = PROMPTS[state.key].text;
		}
		function fmt(v, n) { return Number(v).toFixed(n); }
		function update() {
			var res = softmaxFor();
			var rows = PROMPTS[state.key].rows;
			var maxP = Math.max.apply(null, res.probs) || 1;
			var span = res.max - res.min || 1;
			probs = res.probs;
			exps = res.ex;
			rows.forEach(function (d, i) {
				lfills[i].style.width = (6 + (d.logit - res.min) / span * 94) + "%";
				lrows[i].setAttribute("aria-label", d.token + " logit " + fmt(d.logit, 2));
				pfills[i].style.width = (res.probs[i] / maxP * 100) + "%";
				prows[i].querySelector(".softmax-value").textContent = (res.probs[i] * 100).toFixed(1) + "%";
				prows[i].setAttribute("aria-label", d.token + " probability " + (res.probs[i] * 100).toFixed(1) + "%");
			});
			var matrix = document.getElementById("softmax-logit-matrix");
			if (matrix) {
				var vals = rows.map(function (d) { return d.logit; });
				var tex = "\\underbrace{\\begin{pmatrix}\\underbrace{" + fmt(vals[0], 2) + "}_{\\text{" + (DE ? "höchster Logit" : "top logit") + "}}\\\\" + fmt(vals[1], 2) + "\\\\" + fmt(vals[2], 2) + "\\\\\\vdots\\\\" + fmt(vals[vals.length - 1], 2) + "\\end{pmatrix}}_{\\text{" + (DE ? "echte GPT-2-Logits, die zehn höchsten von 50.257" : "real GPT-2 logits, top 10 of 50,257") + "}}";
				matrix.setAttribute("data-tex", tex);
				matrix.removeAttribute("data-tex-rendered");
				if (TM.typesetMath) TM.typesetMath(matrix.parentNode);
			}
			updateReadout();
			var start = performance.now();
			function loop(now) {
				drawRibbons();
				if (now - start < 360) requestAnimationFrame(loop);
			}
			requestAnimationFrame(loop);
		}
		function setHover(i) {
			state.hovered = i;
			lrows.forEach(function (r, j) { r.classList.toggle("is-hot", j === i); });
			prows.forEach(function (r, j) { r.classList.toggle("is-hot", j === i); });
			updateReadout();
			drawRibbons();
		}
		function updateReadout() {
			var d = PROMPTS[state.key].rows[state.hovered];
			if (!d) return;
			readout.token.textContent = d.token;
			readout.logit.textContent = fmt(d.logit, 2);
			readout.exp.textContent = exps[state.hovered] != null ? fmt(exps[state.hovered], 3) : "—";
			readout.prob.textContent = probs[state.hovered] != null ? (probs[state.hovered] * 100).toFixed(1) + "%" : "—";
		}
		function drawRibbons() {
			if (!lfills.length) return;
			var sr = stage.getBoundingClientRect();
			var out = '<defs><linearGradient id="softmax-ribbon-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="var(--tm-green)"></stop><stop offset="100%" stop-color="var(--tm-petrol-mid)"></stop></linearGradient></defs>';
			var maxP = Math.max.apply(null, probs) || 1;
			lfills.forEach(function (fill, i) {
				var lf = fill.getBoundingClientRect();
				var pf = pfills[i].getBoundingClientRect();
				var x1 = lf.right - sr.left;
				var y1 = lf.top + lf.height / 2 - sr.top;
				var x2 = pf.left - sr.left;
				var y2 = pf.top + pf.height / 2 - sr.top;
				var mid = (x1 + x2) / 2;
				var p = probs[i] / maxP;
				var w = 0.7 + p * 6.5;
				var o = 0.12 + p * 0.78;
				out += '<path d="M' + x1 + ' ' + y1 + ' C' + mid + ' ' + y1 + ' ' + mid + ' ' + y2 + ' ' + x2 + ' ' + y2 + '" stroke-width="' + w + '" opacity="' + o + '"' + (i === state.hovered ? ' class="is-hot"' : '') + '></path>';
			});
			ribbons.innerHTML = out;
		}
		function renderPrompt(key) {
			state.key = key;
			state.hovered = 0;
			document.querySelectorAll("[data-softmax-prompt]").forEach(function (b) {
				b.classList.toggle("is-on", b.getAttribute("data-softmax-prompt") === key);
			});
			build();
			update();
		}
		document.querySelectorAll("[data-softmax-prompt]").forEach(function (b) {
			b.addEventListener("click", function () { renderPrompt(b.getAttribute("data-softmax-prompt")); });
		});
		if (tempInput) {
			tempInput.addEventListener("input", function () {
				state.temp = Math.max(0.05, parseFloat(tempInput.value) || 1);
				tempOut.textContent = state.temp.toFixed(2);
				update();
			});
		}
		window.addEventListener("resize", function () { drawRibbons(); });
		window.addEventListener("tm:theme", function () { drawRibbons(); });
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { drawRibbons(); });
		build();
		update();
	})();
	</script>
	<script>
	(function () {
		"use strict";
		window.__tmHeightsReserved = false;
		function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
		function setMin(selector, height) {
			var el = document.querySelector(selector);
			if (el && height > 0) el.style.minHeight = Math.ceil(height) + "px";
		}
		function clearMin() {
			["#itok-out", "#itok-stats", "#iemb-out", "#iemb-formula", "#ipe-heat-out", "#ipe-out", "#iatt-sentence", "#iatt-out", "#iatt-sum", "#softmax-logit-matrix"].forEach(function (selector) {
				var el = document.querySelector(selector);
				if (el) el.style.minHeight = "";
			});
		}
		async function reserve() {
			clearMin();
			var dualControls = document.getElementById("tm-dual-controls");
			if (dualControls) dualControls.style.minHeight = "210px";
			var tokChips = Array.prototype.slice.call(document.querySelectorAll("[data-tok]"));
			if (tokChips.length) {
				var activeTok = tokChips.filter(function (c) { return c.classList.contains("is-on"); })[0] || tokChips[0];
				var maxTokOut = 0, maxTokStats = 0;
				for (var t = 0; t < tokChips.length; t++) {
					tokChips[t].click();
					await sleep(30);
					var tokOut = document.getElementById("itok-out");
					var tokStats = document.getElementById("itok-stats");
					if (tokOut) maxTokOut = Math.max(maxTokOut, tokOut.offsetHeight);
					if (tokStats) maxTokStats = Math.max(maxTokStats, tokStats.offsetHeight);
				}
				if (activeTok) activeTok.click();
				setMin("#itok-out", maxTokOut);
				setMin("#itok-stats", maxTokStats);
			}
			var embChips = Array.prototype.slice.call(document.querySelectorAll("[data-emb]"));
			if (embChips.length) {
				var activeEmb = embChips.filter(function (c) { return c.classList.contains("is-on"); })[0] || embChips[0];
				var maxEmbOut = 0, maxEmbFormula = 0;
				for (var e = 0; e < embChips.length; e++) {
					embChips[e].click();
					await sleep(30);
					var embOut = document.getElementById("iemb-out");
					var embFormula = document.getElementById("iemb-formula");
					if (embOut) maxEmbOut = Math.max(maxEmbOut, embOut.offsetHeight);
					if (embFormula) maxEmbFormula = Math.max(maxEmbFormula, embFormula.offsetHeight);
				}
				if (activeEmb) activeEmb.click();
				setMin("#iemb-out", maxEmbOut);
				setMin("#iemb-formula", maxEmbFormula);
			}
			var posSliders = ["#ipe-heat-context", "#ipe-heat-dims", "#ipe-pos"];
			var maxHeatOut = 0, maxPosOut = 0, maxPosPane = 0;
			var posPane = document.getElementById("step-position");
			for (var ps = 0; ps < posSliders.length; ps++) {
				var slider = document.querySelector(posSliders[ps]);
				if (!slider) continue;
				var original = slider.value;
				var states = [slider.min, original, slider.max];
				for (var st = 0; st < states.length; st++) {
					slider.value = states[st];
					slider.dispatchEvent(new Event("input", { bubbles: true }));
					await sleep(30);
					var heatOut = document.getElementById("ipe-heat-out");
					var posOut = document.getElementById("ipe-out");
					if (heatOut) maxHeatOut = Math.max(maxHeatOut, heatOut.offsetHeight);
					if (posOut) maxPosOut = Math.max(maxPosOut, posOut.offsetHeight);
					if (posPane) maxPosPane = Math.max(maxPosPane, posPane.offsetHeight);
				}
				slider.value = original;
				slider.dispatchEvent(new Event("input", { bubbles: true }));
			}
			var mobile = window.innerWidth < 640;
			setMin("#ipe-heat-out", Math.max(maxHeatOut, mobile ? 150 : 90));
			setMin("#ipe-out", Math.max(maxPosOut, mobile ? 120 : 80));
			if (maxPosPane) setMin("#step-position", maxPosPane + (mobile ? 180 : 80));
			var attChips = Array.prototype.slice.call(document.querySelectorAll("[data-att]"));
			if (attChips.length) {
				var activeAtt = attChips.filter(function (c) { return c.classList.contains("is-on"); })[0] || attChips[0];
				var maxSent = 0, maxOut = 0, maxSum = 0;
				for (var i = 0; i < attChips.length; i++) {
					attChips[i].click();
					await sleep(30);
					var sent = document.getElementById("iatt-sentence");
					var out = document.getElementById("iatt-out");
					var sum = document.getElementById("iatt-sum");
					if (sent) maxSent = Math.max(maxSent, sent.offsetHeight);
					if (out) maxOut = Math.max(maxOut, out.offsetHeight);
					if (sum) maxSum = Math.max(maxSum, sum.offsetHeight);
				}
				if (activeAtt) activeAtt.click();
				setMin("#iatt-sentence", maxSent);
				setMin("#iatt-out", maxOut);
				setMin("#iatt-sum", maxSum);
			}
			var softChips = Array.prototype.slice.call(document.querySelectorAll("[data-softmax-prompt]"));
			if (softChips.length) {
				var activeSoft = softChips.filter(function (c) { return c.classList.contains("is-on"); })[0] || softChips[0];
				var maxMatrix = 0;
				for (var j = 0; j < softChips.length; j++) {
					softChips[j].click();
					await sleep(40);
					var matrix = document.getElementById("softmax-logit-matrix");
					if (matrix) maxMatrix = Math.max(maxMatrix, matrix.offsetHeight);
				}
				if (activeSoft) activeSoft.click();
				setMin("#softmax-logit-matrix", maxMatrix);
			}
		}
		async function start() {
			window.__tmHeightsReserved = false;
			if (document.fonts && document.fonts.ready) await document.fonts.ready;
			await sleep(700);
			await reserve();
			await sleep(700);
			await reserve();
			window.__tmHeightsReserved = true;
		}
		window.addEventListener("load", start);
		var timer = null;
		window.addEventListener("resize", function () {
			clearTimeout(timer);
			timer = setTimeout(async function () {
				window.__tmHeightsReserved = false;
				if (document.fonts && document.fonts.ready) await document.fonts.ready;
				await reserve();
				window.__tmHeightsReserved = true;
			}, 220);
		});
	})();
	</script>
	<script>
	(function () {
		"use strict";
		var de = TM.lang() === "de";
		var line = document.getElementById("i1d-canvas");
		if (line && TM.numberLine) {
			var c = TM.colors();
			TM.numberLine(line, {
				min: -40,
				max: 110,
				points: [
					{ value: -30, label: de ? "Gefrierpunkt" : "Freezing", color: c.sky },
					{ value: 5, label: de ? "Kalt" : "Cold", color: c.blue },
					{ value: 30, label: de ? "Lauwarm" : "Lukewarm", color: c.green },
					{ value: 100, label: de ? "Heiß" : "Hot", color: c.gold }
				],
				ops: [
					{ from: 30, to: 100, label: de ? "Heiß − Lauwarm = 70" : "Hot − Lukewarm = 70", color: c.gold },
					{ from: 5, to: 30, label: de ? "Lauwarm − Kalt = 25" : "Lukewarm − Cold = 25", color: c.green }
				]
			});
		}
	})();
	</script>
	<script>
	(function () {
		"use strict";
		var demo = document.getElementById("code-demo");
		if (!demo) return;
		var de = TM.lang() === "de";
		demo.querySelectorAll("[data-en][data-de]").forEach(function (el) {
			el.textContent = de ? el.getAttribute("data-de") : el.getAttribute("data-en");
		});
		var codeBox = demo.querySelector(".code-demo-code");
		var codeEl = codeBox ? codeBox.querySelector("code") : null;
		var terminal = document.getElementById("code-demo-terminal");
		var output = document.getElementById("code-demo-output");
		if (!codeBox || !codeEl || !terminal) return;

		var tokens = [];
		function pushText(text, cls) {
			var parts = text.match(/\s+|[^\s]+/g) || [];
			parts.forEach(function (part) {
				tokens.push({ text: part, cls: cls });
			});
		}
		function walk(node, cls) {
			if (node.nodeType === 3) {
				pushText(node.nodeValue, cls);
				return;
			}
			if (node.nodeType !== 1) return;
			var nextCls = node.className || cls;
			for (var child = node.firstChild; child; child = child.nextSibling) {
				walk(child, nextCls);
			}
		}
		for (var child = codeEl.firstChild; child; child = child.nextSibling) {
			walk(child, "");
		}

		codeEl.innerHTML = "";
		var tokenEls = [];
		tokens.forEach(function (tok) {
			var span = document.createElement("span");
			span.className = "cd-token" + (tok.cls ? " " + tok.cls : "");
			span.textContent = tok.text;
			codeEl.appendChild(span);
			tokenEls.push(span);
		});
		var cursor = document.createElement("span");
		cursor.className = "cd-cursor";
		cursor.setAttribute("aria-hidden", "true");
		codeEl.insertBefore(cursor, codeEl.firstChild);
		codeBox.classList.add("is-typing");

		var timers = [];
		var started = false;
		function showTerminal() {
			if (!terminal.hidden && terminal.classList.contains("is-revealed")) return;
			terminal.hidden = false;
			requestAnimationFrame(function () {
				terminal.classList.add("is-revealed");
			});
			if (output) {
				timers.push(setTimeout(function () {
					output.hidden = false;
					requestAnimationFrame(function () {
						output.classList.add("is-visible");
					});
				}, 420));
			}
		}
		function revealAll() {
			timers.forEach(clearTimeout);
			timers = [];
			started = true;
			tokenEls.forEach(function (el) {
				el.classList.add("is-visible");
			});
			codeBox.classList.remove("is-typing");
			if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
			showTerminal();
		}
		function typeNext(index) {
			if (index >= tokenEls.length) {
				codeBox.classList.remove("is-typing");
				if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
				timers.push(setTimeout(showTerminal, 280));
				return;
			}
			var el = tokenEls[index];
			el.classList.add("is-visible");
			if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
			if (el.nextSibling) codeEl.insertBefore(cursor, el.nextSibling);
			else codeEl.appendChild(cursor);
			var text = el.textContent;
			var delay = /^\s+$/.test(text) ? 0 : (text.length > 8 ? 52 : 34);
			timers.push(setTimeout(function () {
				typeNext(index + 1);
			}, delay));
		}
		function start() {
			if (started) return;
			if (TM.prefersReduced()) {
				revealAll();
				return;
			}
			started = true;
			timers.push(setTimeout(function () {
				typeNext(0);
			}, 520));
		}
		if ("IntersectionObserver" in window) {
			var io = new IntersectionObserver(function (entries) {
				if (entries.some(function (e) { return e.isIntersecting; })) {
					io.disconnect();
					start();
				}
			}, { rootMargin: "0px 0px -12% 0px", threshold: 0.2 });
			io.observe(demo);
		} else {
			start();
		}
		timers.push(setTimeout(function () {
			if (!started) revealAll();
		}, 9000));
		timers.push(setTimeout(function () {
			if (terminal.hidden) revealAll();
		}, 15000));
	})();
	</script>

	<script>
	(function () {
		"use strict";
		var host = document.getElementById("real-trajectory-3d");
		var dataEl = document.getElementById("gpt2-pca-data");
		if (!host || !dataEl) return;
		var data;
		try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
		var de = TM.lang() === "de";
		var loaded = false;
		var loading = false;
		var chart = null;

		function displayToken(token) { return token.replace(/^ /, "␣"); }
		function layerLabel(i) {
			if (i === 0) return de ? "Embedding + Position" : "Embedding + position";
			return "Block " + i;
		}
		function palette() {
			var c = TM.colors();
			return {
				ink: c.ink, muted: c.muted, line: c.line, lineStrong: c.lineStrong, paper: c.paper, dark: c.dark,
				series: [c.green, c.blue, c.gold, c.coral, c.teal || c.sky]
			};
		}
		function fallback(message) {
			host.innerHTML = '<div class="traj-echarts-fallback">' + message + '</div>';
		}
		function ensureLibs(cb) {
			if (TM.ensureECharts) TM.ensureECharts(cb, function () {
				fallback(de ? "Die 3D-Bibliothek konnte nicht geladen werden." : "The 3D library could not be loaded.");
			});
			else fallback(de ? "Die 3D-Bibliothek konnte nicht geladen werden." : "The 3D library could not be loaded.");
		}
				function computePerpendicularVectors(nx, ny, nz) {
			var ax, ay, az;
			if (Math.abs(nx) < 0.9) { ax = 1; ay = 0; az = 0; }
			else { ax = 0; ay = 1; az = 0; }
			var p1x = ny * az - nz * ay;
			var p1y = nz * ax - nx * az;
			var p1z = nx * ay - ny * ax;
			var p1mag = Math.sqrt(p1x * p1x + p1y * p1y + p1z * p1z) || 1;
			p1x /= p1mag; p1y /= p1mag; p1z /= p1mag;
			var p2x = ny * p1z - nz * p1y;
			var p2y = nz * p1x - nx * p1z;
			var p2z = nx * p1y - ny * p1x;
			var p2mag = Math.sqrt(p2x * p2x + p2y * p2y + p2z * p2z) || 1;
			p2x /= p2mag; p2y /= p2mag; p2z /= p2mag;
			return { perp1: { x: p1x, y: p1y, z: p1z }, perp2: { x: p2x, y: p2y, z: p2z } };
		}
		function computeArrowheadBase(from3, to3, maxHeadLen) {
			var dx = to3[0] - from3[0];
			var dy = to3[1] - from3[1];
			var dz = to3[2] - from3[2];
			var mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
			if (mag < 1e-10) return [to3[0], to3[1], to3[2]];
			var headLen = Math.min(mag * 0.3, maxHeadLen || 0.5);
			var nx = dx / mag, ny = dy / mag, nz = dz / mag;
			return [to3[0] - nx * headLen, to3[1] - ny * headLen, to3[2] - nz * headLen];
		}
		function add3DArrowheadSeries(series, from3, to3, color, name) {
			var dx = to3[0] - from3[0];
			var dy = to3[1] - from3[1];
			var dz = to3[2] - from3[2];
			var mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
			if (mag < 1e-10) return;
			var nx = dx / mag, ny = dy / mag, nz = dz / mag;
			var headLen = Math.min(mag * 0.3, 0.4);
			var perp = computePerpendicularVectors(nx, ny, nz);
			var spread = headLen * 0.35;
			var bx = to3[0] - nx * headLen;
			var by = to3[1] - ny * headLen;
			var bz = to3[2] - nz * headLen;
			var p = perp.perp1;
			series.push({
				type: "line3D", name: name, silent: true,
				data: [[bx + p.x * spread, by + p.y * spread, bz + p.z * spread], to3, [bx - p.x * spread, by - p.y * spread, bz - p.z * spread]],
				lineStyle: { width: 6, color: color }
			});
			p = perp.perp2;
			series.push({
				type: "line3D", name: name, silent: true,
				data: [[bx + p.x * spread, by + p.y * spread, bz + p.z * spread], to3, [bx - p.x * spread, by - p.y * spread, bz - p.z * spread]],
				lineStyle: { width: 6, color: color }
			});
		}

		var step = 0;
		function updateStepLabel() {
			var el = document.getElementById("traj-layer-label");
			if (!el) return;
			el.textContent = step === 0 ? "Embedding" : (de ? "Schicht " : "Layer ") + step + " / " + (data.layers.length - 1);
		}
		function renderCandidates() {
			var el = document.getElementById("traj-candidates");
			if (!el) return;
			var show = step >= data.layers.length - 1;
			el.hidden = !show;
			if (!show) {
				el.innerHTML = "";
				return;
			}
			var top = (data.top || []).slice(0, 5);
			el.innerHTML = top.map(function (item) {
				var chosen = item.token === data.chosen;
				return '<span class="traj-candidate' + (chosen ? " is-chosen" : "") + '">' +
					'<b>' + displayToken(item.token) + '</b>' +
					'<span class="pct">' + (item.p * 100).toFixed(2) + ' %</span>' +
					(chosen ? '<span>' + (de ? "gewählt" : "chosen") + '</span>' : '') +
					'</span>';
			}).join("");
		}
		function layerExtent() {
			var xs = [], ys = [], zs = [];
			data.points.forEach(function (pts) {
				pts.forEach(function (p) {
					xs.push(p[0]); ys.push(p[1]); zs.push(p[2]);
				});
			});
			(data.landmarks || []).slice(0, 5).forEach(function (item) {
				xs.push(item.value[0]); ys.push(item.value[1]); zs.push(item.value[2]);
			});
			function mm(values) {
				var mn = Math.min.apply(null, values);
				var mx = Math.max.apply(null, values);
				var d = (mx - mn) || 1;
				var pad = d * 0.10;
				return [mn - pad, mx + pad];
			}
			return { x: mm(xs), y: mm(ys), z: mm(zs) };
		}
		var extent = layerExtent();

		function draw() {
			var firstDraw = !chart;
			var c = palette();
			if (!chart) {
				try {
					chart = echarts.init(host);
				} catch (e) {
					fallback(de ? "Die 3D-Ansicht konnte nicht initialisiert werden." : "The 3D view could not be initialized.");
					return;
				}
			}
			var series = [];
			var legendData = [];
			var topLandmarks = (data.landmarks || []).slice(0, 5);
			var showChoice = step >= data.layers.length - 1;
			if (topLandmarks.length) {
				legendData.push(de ? "Kandidaten" : "Candidates");
				series.push({
					name: de ? "Kandidaten" : "Candidates",
					type: "scatter3D",
					data: topLandmarks.map(function (item) {
						var chosen = showChoice && item.word === data.chosen;
						return {
							name: displayToken(item.word),
							value: item.value,
							p: item.p,
							symbol: chosen ? "star" : "diamond",
							symbolSize: chosen ? 18 : 9,
							itemStyle: {
								color: chosen ? c.green : "rgba(100,116,139,0.8)",
								borderWidth: 1,
								borderColor: chosen ? c.green : "#334155"
							},
							label: {
								show: true,
								position: "top",
								distance: 5,
								formatter: chosen
									? (de ? "gewählt: " : "chosen: ") + displayToken(item.word) + " " + (item.p * 100).toFixed(1) + " %"
									: displayToken(item.word),
								textStyle: {
									fontSize: chosen ? 12 : 10,
									color: chosen ? c.green : c.muted,
									fontWeight: chosen ? 700 : 600
								}
							}
						};
					}),
					tooltip: {
						formatter: function (p) {
							return p.name + "<br>" + (p.data.p * 100).toFixed(2) + " %";
						}
					}
				});
			}
			data.tokens.forEach(function (token, ti) {
				var color = c.series[ti % c.series.length];
				var pts = data.points[ti];
				var tokenLabel = displayToken(token) + " (" + (ti + 1) + ")";
				legendData.push(tokenLabel);
				var last = Math.min(step, pts.length - 1);
				for (var i = 0; i < last; i++) {
					var from3 = pts[i];
					var to3 = pts[i + 1];
					var shaftEnd = computeArrowheadBase(from3, to3, 0.4);
					series.push({
						name: tokenLabel,
						type: "line3D",
						data: [from3, shaftEnd],
						lineStyle: { width: 4, color: color, opacity: 0.85 },
						silent: true
					});
					add3DArrowheadSeries(series, from3, to3, color, tokenLabel);
				}
				var markerData = [];
				for (var j = 0; j <= last; j++) {
					var isStart = j === 0;
					var isCurrent = j === last;
					markerData.push({
						value: pts[j],
						name: layerLabel(j),
						symbolSize: isCurrent ? 9 : (isStart ? 5 : 4),
						itemStyle: {
							color: color,
							borderWidth: isCurrent ? 2 : 0,
							borderColor: isCurrent ? c.paper : c.ink,
							opacity: isCurrent ? 1 : (isStart ? 0.35 : 0.22)
						},
						label: {
							show: isCurrent,
							formatter: displayToken(token),
							position: "top",
							distance: 6,
							textStyle: { color: color, fontSize: 11, fontWeight: 700 }
						}
					});
				}
				series.push({
					name: tokenLabel,
					type: "scatter3D",
					data: markerData,
					symbol: "circle",
					tooltip: {
						formatter: function (p) {
							return tokenLabel + "<br>" + p.name + "<br>PC1 " + p.value[0].toFixed(2) + " · PC2 " + p.value[1].toFixed(2) + " · PC3 " + p.value[2].toFixed(2);
						}
					}
				});
			});
			if (step >= data.layers.length - 1 && data.chosen && topLandmarks.length) {
				var chosen = topLandmarks.find(function (item) { return item.word === data.chosen; });
				var lastToken = data.points[data.tokens.length - 1];
				if (chosen && lastToken) {
					series.push({
						name: "__chosen__",
						type: "line3D",
						data: [lastToken[lastToken.length - 1], chosen.value],
						lineStyle: { width: 2, color: c.green, type: "dashed", opacity: 0.8 },
						silent: true
					});
				}
			}
			try {
				var option = {
					backgroundColor: "transparent",
					title: {
						text: de ? "Token-Trajektorie: Embedding → +Position → Layer-Ausgaben" : "Token Trajectory: Embedding → +Position → Layer Outputs",
						left: "center", top: 10,
						textStyle: { fontSize: 14, fontWeight: "bold", color: c.ink }
					},
					tooltip: {
						trigger: "item", confine: true,
						backgroundColor: c.dark ? "rgba(10,34,44,.96)" : "rgba(255,255,255,.98)",
						borderColor: c.lineStrong,
						textStyle: { color: c.ink, fontSize: 12 }
					},
					legend: {
						data: legendData,
						orient: "horizontal",
						bottom: 5, left: "center",
						textStyle: { fontSize: 12, color: c.ink },
						itemWidth: 12, itemHeight: 10
					},
					xAxis3D: { type: "value", name: "PC 1", min: extent.x[0], max: extent.x[1], nameTextStyle: { color: c.muted }, axisLabel: { formatter: function (v) { return Number(v).toFixed(1); }, textStyle: { color: c.muted, fontSize: 9 } } },
					yAxis3D: { type: "value", name: "PC 2", min: extent.y[0], max: extent.y[1], nameTextStyle: { color: c.muted }, axisLabel: { formatter: function (v) { return Number(v).toFixed(1); }, textStyle: { color: c.muted, fontSize: 9 } } },
					zAxis3D: { type: "value", name: "PC 3", min: extent.z[0], max: extent.z[1], nameTextStyle: { color: c.muted }, axisLabel: { formatter: function (v) { return Number(v).toFixed(1); }, textStyle: { color: c.muted, fontSize: 9 } } },
					grid3D: {
						viewControl: { projection: "perspective", alpha: 30, beta: 40, distance: 200, autoRotate: false, damping: 0.9 },
						light: { main: { intensity: 1.2, shadow: false }, ambient: { intensity: 0.3 } },
						environment: c.paper,
						boxWidth: 100, boxHeight: 100, boxDepth: 100,
						axisLine: { lineStyle: { color: c.lineStrong } },
						splitLine: { lineStyle: { color: c.line } },
						axisPointer: { show: false }
					},
					series: series
				};
				if (!firstDraw) {
					delete option.grid3D.viewControl;
				}
				chart.setOption(option, { replaceMerge: ["series"], lazyUpdate: false });
				chart.resize();
			} catch (e) {
				fallback(de ? "Die 3D-Ansicht konnte nicht gezeichnet werden." : "The 3D view could not be drawn.");
			}
		}

		function start() {
			if (loaded || loading) return;
			loading = true;
			ensureLibs(function () {
				loaded = true;
				loading = false;
				draw();
			});
		}
		var slider = document.getElementById("traj-layer-slider");
		var resetBtn = document.getElementById("traj-reset");
		if (slider) slider.addEventListener("input", function () {
			step = parseInt(slider.value, 10) || 0;
			updateStepLabel();
			renderCandidates();
			if (loaded) draw();
		});
		if (resetBtn) resetBtn.addEventListener("click", function () {
			step = 0;
			if (slider) slider.value = "0";
			updateStepLabel();
			renderCandidates();
			if (loaded) draw();
		});
		renderCandidates();
		updateStepLabel();
		if ("IntersectionObserver" in window) {
			var io = new IntersectionObserver(function (entries) {
				if (entries.some(function (e) { return e.isIntersecting; })) {
					io.disconnect();
					start();
				}
			}, { rootMargin: "400px 0px" });
			io.observe(host);
		} else {
			start();
		}
		window.addEventListener("resize", function () { if (chart) chart.resize(); });
		window.addEventListener("tm:theme", function () { if (loaded) draw(); });
	})();
	</script>
</body>
</html>
