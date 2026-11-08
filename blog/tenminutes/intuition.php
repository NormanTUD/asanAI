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
		.traj-metric-switch { flex: 0 0 auto; }
		.traj-loading { display: flex; align-items: center; justify-content: center; gap: 10px; height: 100%; color: var(--tm-muted); font: 400 0.86rem/1.4 var(--tm-ui); }
		.traj-loader-spinner { width: 18px; height: 18px; border: 2px solid var(--tm-line-strong); border-top-color: var(--tm-green); border-radius: 50%; animation: trajSpin 0.8s linear infinite; }
		@keyframes trajSpin { to { transform: rotate(360deg); } }
		.traj-candidates { visibility: hidden; opacity: 0; transition: opacity 0.2s ease; }
		.traj-candidates.is-visible { visibility: visible; opacity: 1; }
		.traj-next-btn { padding: 0.7em 1.2em; font-size: 0.82rem; }
		.oned-formula { min-height: 4.2em; margin-top: 6px; }
		.traj-plotly-host { width: 100%; height: 460px; min-height: 360px; }
		.traj-candidate-metric { color: var(--tm-muted); font-size: 0.68rem; font-weight: 600; }
		@media (max-width: 760px) { .traj-plotly-host { height: 340px; min-height: 300px; } }
		.traj-metric-note { width: 100%; max-width: none; margin: 8px 0 0; font: 400 0.76rem/1.45 var(--tm-ui); color: var(--tm-muted); }
		.iso-note { width: 100%; max-width: none; margin: 0 0 8px; font: 400 0.84rem/1.55 var(--tm-prose); color: var(--tm-ink-soft); }
		.iso-main { min-width: 0; }
		.tt-plot-wrap { position: relative; min-width: 0; }
		.tt-echarts-host { width: 100%; height: 520px; min-height: 420px; background: radial-gradient(circle at 50% 42%, var(--tm-wash), transparent 66%); }
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
			padding: 1px 4px;
			border: 1px solid var(--tm-line-strong);
			background: var(--tm-paper);
			box-shadow: var(--tm-shadow);
			color: var(--tm-ink);
			font: 700 0.62rem/1.05 var(--tm-ui);
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
		@media (max-width: 760px) {
			.tt-point-label { font-size: 0.58rem; padding: 0 3px; }
		}
		@keyframes ttBallPulse {
			0%, 100% { opacity: 0.35; transform: scale(0.92); }
			50% { opacity: 0.9; transform: scale(1.12); }
		}
		@media (prefers-reduced-motion: reduce) {
			.tt-ball::after { animation: none; }
		}
		.tt-fallback { display: flex; align-items: center; justify-content: center; gap: 10px; height: 100%; padding: 24px; text-align: center; color: var(--tm-muted); font: 0.86rem/1.5 var(--tm-ui); }
		.tt-loader-spinner { width: 16px; height: 16px; border: 2px solid var(--tm-line-strong); border-top-color: var(--tm-green); border-radius: 50%; flex: 0 0 auto; animation: ttLoaderSpin 0.8s linear infinite; }
		@keyframes ttLoaderSpin { to { transform: rotate(360deg); } }
		.tt-legend { display: flex; flex-wrap: wrap; gap: 5px 14px; margin-top: 8px; font: 600 0.7rem/1.35 var(--tm-ui); color: var(--tm-muted); }
		.tt-legend-item { display: inline-flex; align-items: center; gap: 5px; }
		.tt-swatch { width: 10px; height: 10px; border-radius: 2px; border: 1px solid var(--tm-line-strong); flex: 0 0 auto; }
		.tt-swatch--deep { background: var(--tm-blue); }
		.tt-swatch--side { background: var(--tm-gold); }
		.tt-swatch--base { background: var(--tm-gold); opacity: 0.6; }
		.tt-swatch--filler { width: 7px; height: 7px; border-radius: 50%; background: var(--tm-gold); opacity: 0.65; }
		.tt-token-row { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
		.tt-token { appearance: none; border: 1px solid var(--tm-line-strong); background: var(--tm-paper-2); color: var(--tm-muted); font: 600 0.72rem/1.2 var(--tm-mono); padding: 0.32em 0.55em; cursor: pointer; }
		.tt-token:hover { border-color: var(--tm-blue); color: var(--tm-ink); }
		.tt-token.is-current { border-color: var(--tm-green); background: var(--tm-green); color: #ffffff; }
		@media (max-width: 720px) {
			.traj-demo-grid { grid-template-columns: 1fr; }
			.traj-panel canvas { height: 260px; }
			.tt-echarts-host { height: 380px; min-height: 340px; }
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
									<div class="code-demo-terminal" id="code-demo-terminal" aria-live="polite">
										<div class="code-demo-bar"><span class="code-demo-dot is-green"></span><span class="code-demo-dot is-gold"></span><span class="code-demo-dot is-sky"></span><span class="code-demo-name">Terminal</span></div>
										<div class="code-demo-term-body" id="code-demo-term">
											<div class="code-demo-cmd"><span class="code-demo-dollar">$</span> <span id="code-demo-command" data-en="python3 sky.py" data-de="python3 himmel.py">python3 sky.py</span></div>
											<div class="code-demo-output" id="code-demo-output" data-en="Blue is 4.35× more strongly scattered than red." data-de="Blau wird 4,35× stärker gestreut als Rot.">Blue is 4.35× more strongly scattered than red.</div>
										</div>
									</div>
								</div>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>The model wrote the program; the program computed the ratio. Code is another sequence the loop can predict, one token at a time.</span></div>
						</div>
					</section>

					<section class="section-block" id="loop" data-chapter="The loop" data-chapter-de="Die Schleife">
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
									<p class="iso-note"><?php if (function_exists('tm_lang') && tm_lang() === 'de'): ?>Stell dir jeden Punkt in dieser Landschaft als Embedding vor: ein Vektor, der für ein Wort oder eine Fortsetzung steht. Nachbarpunkte sind sich in der Bedeutung ähnlich, und die Tiefe eines Tals ist die Wahrscheinlichkeit, die das Modell dieser Fortsetzung gibt. Der blaue Pfad ist nur eine mögliche Route durch diesen Raum. Die anderen Pfade sind die Alternativen, die das Modell gelernt hat zu erwägen; sie sind seine Erfahrung, komprimiert in die Geometrie des Raums. Der Kontext ist der Teil der Landschaft, den das Modell gerade sieht: Er verschiebt die Täler und schließt Routen, die nicht mehr passen. Das Bild ist eine Abstraktion. Ein echtes Modell arbeitet in Tausenden von Dimensionen, mit weit mehr Pfaden, als hier gezeichnet werden können. Die Energie-Landschaft folgt dem Energy-Based-Learning-Rahmen von <a href="http://yann.lecun.com/exdb/publis/pdf/lecun-06.pdf" target="_blank" rel="noopener">LeCun et al., A Tutorial on Energy-Based Learning (2006)</a>.<?php else: ?>Think of every point in this landscape as an embedding: a vector that stands for a word or a continuation. Neighbouring points are similar in meaning, and the depth of a valley is the probability the model gives that continuation. The blue path is only one possible route through this space. The other paths are the alternatives the model has learned to consider; they are its experience compressed into the geometry of the space. The context is the part of the landscape the model can see right now: it shifts the valleys and closes routes that no longer fit. This picture is an abstraction. A real model works in thousands of dimensions, with far more paths than can be drawn here. The energy-landscape view follows the energy-based learning framework of <a href="http://yann.lecun.com/exdb/publis/pdf/lecun-06.pdf" target="_blank" rel="noopener">LeCun et al., A Tutorial on Energy-Based Learning (2006)</a>.<?php endif; ?></p>
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

					<section class="section-block" id="inside" data-chapter="Inside the transformer" data-chapter-de="Im Transformer">
						<div class="section-kicker"><span class="sk-num">03</span> Inside the model</div>
						<h2 class="section-title">The transformer: six steps, one running vector.</h2>
						<div class="prose">
							<p>The model moves points in a high-dimensional space. Training shapes those points so that the final context vector has smaller angles to words that plausibly come next than to words that do not. Because the decision is about angles, not straight-line distances, this page uses the great-circle metric by default. The model works on a hypersphere of directions; to draw it, we project that sphere down to three dimensions. Plausible here means the continuation occurred in the training data; it does not mean that the model has a separate notion of truth.</p>
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
								<p class="meadow-caption" id="oned-result" aria-live="polite" style="color:var(--tm-muted)"></p>
								<div class="prose-math oned-formula" id="oned-formula" data-tex-display="true"></div>
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
							<p>The points form a manifold: locally flat, globally curved. The relations are similar enough to translate: the path from one word to another can be transformed into the corresponding path in another language. Feed-forward networks learn such transformations. This is an approximation. In a real model the geometry is much messier: relations overlap, exceptions are common, and translation is learned from huge amounts of text rather than read off a clean map. The intuition still points in the right direction.</p>
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
								<p>The curve is a small, readable slice of that geometry. A real model is far more complex, but it follows the same geometric principles in thousands of dimensions.</p>
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

					<section class="section-block" id="layer-stack" data-chapter="Inside the transformer" data-chapter-de="Im Transformer">
						<?php $layer_de = function_exists('tm_lang') && tm_lang() === 'de'; ?>
						<div class="section-kicker"><span class="sk-num">04</span> <?php echo $layer_de ? 'Der Stapel' : 'The stack'; ?></div>
						<h2 class="section-title"><?php echo $layer_de ? 'Ein Modell ist ein Stapel von Funktionen.' : 'A model is a stack of functions.'; ?></h2>
						<div class="prose">
							<?php if ($layer_de): ?>
							<p>Ein neuronales Netz entsteht, indem man Funktionen nacheinander anwendet. Eine Schicht transformiert ihre Eingabe, die nächste transformiert dieses Ergebnis, und der Stapel macht aus einer kleinen Operation ein tiefes Modell. Tiefe ist Komposition: viele einfache Schritte, jeder füttert den nächsten.</p>
							<?php else: ?>
							<p>A neural network is built by applying functions one after another. One layer transforms its input, the next layer transforms that result, and the stack turns a small operation into a deep model. The depth is composition: many simple steps, each feeding the next.</p>
							<?php endif; ?>
							<div class="prose-math layer-stack-formula" data-tex="\underbrace{ \text{output} = \text{layer}_3\!\left( \underbrace{ \text{layer}_2\!\left( \underbrace{\text{layer}_1(\text{input})}_{\text{first transformation}} \right) }_{\text{second transformation}} \right) }_{\text{a stack of functions, each feeding the next}}" data-tex-de="\underbrace{ \text{output} = \text{layer}_3\!\left( \underbrace{ \text{layer}_2\!\left( \underbrace{\text{layer}_1(\text{input})}_{\text{erste Transformation}} \right) }_{\text{zweite Transformation}} \right) }_{\text{ein Stapel von Funktionen, jede füttert die nächste}}" data-tex-display="true"></div>
							<h4 class="layer-subhead"><?php echo $layer_de ? 'Eine Schicht ist eine kleine Funktion' : 'One layer is a small function'; ?></h4>
							<?php if ($layer_de): ?>
							<p>Eine einfache Schicht muss nicht kompliziert sein. Sie multipliziert ihre Eingabe mit einer gelernten Matrix W, addiert einen gelernten Vektor b und schickt das Ergebnis durch eine Aktivierungsfunktion. Die Aktivierung bringt eine Krümmung ins Spiel, eine Nichtlinearität. Ohne sie würde jede Anzahl von Dense-Einheiten zu einer einzigen linearen Abbildung zusammenfallen.</p>
							<p>So kann eine einfache Schicht aussehen: eine Matrix, ein Bias, eine Aktivierung. Das ist eine Dense-Einheit. Sie ist der grundlegende Baustein; eine Transformer-Schicht kombiniert später Attention und ein FFN.</p>
							<p>Echte Netze kombinieren Bausteine unterschiedlich. Eine Convolutional-Schicht ist für Bilder gebaut, eine Attention-Schicht für Sequenzen, eine Dense-Schicht für Tabellen mit Zahlen. Eine Transformer-Schicht ist keine einzelne Dense-Einheit: Sie kombiniert Attention, die Information zwischen Tokens mischt, mit einem FFN, das selbst ein kleiner Stapel von Dense-Einheiten ist. Sie teilen dieselbe Idee: Funktionen mit Parametern, die mit Trainingsdaten so trainiert werden, dass ihre Ausgabe näher an der richtigen Antwort liegt.</p>
							<?php else: ?>
							<p>A simple layer does not need to be complicated. It multiplies its input by a learned matrix W, adds a learned vector b, and passes the result through an activation function. The activation adds a bend, a nonlinearity. Without it, any number of dense units would collapse into one linear map.</p>
							<p>A simple layer can look like this: one matrix, one bias, one activation. That is a dense unit. It is the basic building block; a transformer layer later combines attention and an FFN.</p>
							<p>Real networks combine building blocks differently. A convolutional layer is built for images, an attention layer for sequences, a dense layer for tables of numbers. A transformer layer is not one dense unit: it combines attention, which mixes information between tokens, with an FFN, which is itself a small stack of dense units. They share the same idea: functions with parameters, trained on data so that their output gets closer to the right answer.</p>
							<?php endif; ?>
							<div class="layer-formula-grid">
								<div class="layer-formula-card">
									<div class="layer-card-title"><?php echo $layer_de ? 'Dense-Einheit' : 'Dense unit'; ?></div>
									<div class="prose-math" data-tex="\underbrace{\text{dense}(x) = \text{activation}\!\left(\underbrace{W x + b}_{\text{learned linear map}}\right)}_{\text{a function with parameters } W,\ b}" data-tex-de="\underbrace{\text{dense}(x) = \text{Aktivierung}\!\left(\underbrace{W x + b}_{\text{gelernte lineare Abbildung}}\right)}_{\text{eine Funktion mit Parametern } W,\ b}" data-tex-display="true"></div>
								</div>
								<div class="layer-formula-card">
									<div class="layer-card-title">Self-attention</div>
									<div class="prose-math" data-tex="\underbrace{\text{self-attention}(x)_i = \sum_j \underbrace{\alpha_{ij}}_{\text{self-attention}} \underbrace{v_j}_{\text{value vector}}}_{\text{token } i \text{ mixes in the visible context}}" data-tex-de="\underbrace{\text{Self-Attention}(x)_i = \sum_j \underbrace{\alpha_{ij}}_{\text{Self-Attention}} \underbrace{v_j}_{\text{Value-Vektor}}}_{\text{Token } i \text{ mischt den sichtbaren Kontext ein}}" data-tex-display="true"></div>
								</div>
								<div class="layer-formula-card">
									<div class="layer-card-title">FFN</div>
									<div class="prose-math" data-tex="\underbrace{\text{FFN}(x) = \text{dense}_2(\text{activation}(\text{dense}_1(x)))}_{\text{the simplest view: two dense units with an activation between them}}" data-tex-de="\underbrace{\text{FFN}(x) = \text{dense}_2(\text{Aktivierung}(\text{dense}_1(x)))}_{\text{die einfachste Sicht: zwei Dense-Einheiten mit einer Aktivierung dazwischen}}" data-tex-display="true"></div>
								</div>
								<div class="layer-formula-card layer-formula-card--layer">
									<div class="layer-card-title"><?php echo $layer_de ? 'Transformer-Schicht' : 'Transformer layer'; ?></div>
									<div class="prose-math" data-tex="\underbrace{ \text{layer}(X) = \begin{pmatrix} \text{FFN}(A_1) \\ \vdots \\ \text{FFN}(A_n) \end{pmatrix}, \quad \begin{pmatrix} A_1 \\ \vdots \\ A_n \end{pmatrix} = \text{self-attention}(X) }_{\text{self-attention mixes all tokens; FFN sees one row at a time}}" data-tex-de="\underbrace{ \text{layer}(X) = \begin{pmatrix} \text{FFN}(A_1) \\ \vdots \\ \text{FFN}(A_n) \end{pmatrix}, \quad \begin{pmatrix} A_1 \\ \vdots \\ A_n \end{pmatrix} = \text{Self-Attention}(X) }_{\text{Self-Attention mischt alle Tokens; das FFN sieht eine Zeile auf einmal}}" data-tex-display="true"></div>
								</div>
							</div>
							<p class="layer-formula-note"><?php echo $layer_de ? 'W, b, W1 und W2 sind Parameter. Das Training passt sie an, damit der Fehler auf den Trainingsdaten kleiner wird. Aktivierung() ist eine Nichtlinearität wie ReLU oder GELU; sie ist der Knick, der einen tiefen Stapel erst möglich macht. In der Attention-Formel ist α gelernt und v der Vektor, den ein Token anbietet; die Summe ist ein gewichteter Durchschnitt der sichtbaren Tokens. In der Schicht-Formel ist X die ganze Matrix und A_i die Zeile für Token i. Attention liest alle Zeilen; das FFN wird auf eine Zeile auf einmal angewendet.' : 'W, b, W1, and W2 are parameters. Training adjusts them to reduce the error on the training data. activation() is a nonlinearity such as ReLU or GELU; it is the bend that makes a deep stack possible. In the attention formula, α is learned and v is the vector a token offers; the sum is a weighted average of the visible tokens. In the layer formula, X is the whole matrix and A_i is the row for token i. Attention reads all rows; the FFN is applied to one row at a time.'; ?></p>
							<?php if ($layer_de): ?>
							<p>Das ist ein grobes Bild. Darunter steckt bei jedem Schritt eine Matrix von Zahlen; die Formeln zeigen die Form der Berechnung, nicht die Implementierung.</p>
							<?php else: ?>
							<p>This is a coarse picture. Underneath, every step is a matrix of numbers; the formulas show the shape of the computation, not the implementation.</p>
							<?php endif; ?>
							<h4 class="layer-subhead"><?php echo $layer_de ? 'Ein Sprachmodell kombiniert diese und weitere Bausteine' : 'A language model combines these and other building blocks'; ?></h4>
							<?php if ($layer_de): ?>
							<p>Ein Sprachmodell kombiniert diese Bausteine zu einem Transformer-Block: Zuerst fragt Attention, wie stark jedes Wort mit jedem anderen Wort im Kontext verbunden ist; diese Verbindungen lernt das Modell aus den Daten. Ein FFN entwirrt das Ergebnis dann: Es faltet die Vektoren in einen höherdimensionalen Raum, trennt Merkmale und faltet sie wieder zurück. Eine echte Transformer-Schicht enthält außerdem LayerNorm, Residualverbindungen und andere Teile. Sie sind hier weggelassen, damit das Bild lesbar bleibt; die späteren Abschnitte, darunter der <a href="#step-residual-section">Residual-Abschnitt</a>, behandeln sie im Detail.</p>
							<p>Am Anfang geht eine Matrix X hinein: eine Zeile pro Token, jede Zeile ein Vektor. Am Ende kommt eine Matrix mit derselben Form heraus, aber die Werte haben sich verändert. Das letzte Token hat die Bedeutung des ganzen Kontexts aufgenommen. Das Unembedding macht aus seinem Vektor Scores für jedes Vokabular-Token; diese Scores zeigen auf eine Region von Token-Richtungen mit kleinen Winkeln, und Softmax zieht eines daraus. Der aktuelle Aufbau von ChatGPT ist nicht veröffentlicht, aber die öffentlichen Zahlen vergleichbarer Flagship-Modelle zeigen die Größenordnung: GPT-3 175B hatte 96 Transformer-Schichten, Llama 3 405B hat 126. Der Stapel läuft also wirklich ungefähr hundertmal.</p>
							<div class="layer-count-note">
								<div><b>96</b><span><a href="https://arxiv.org/abs/2005.14165" target="_blank" rel="noopener">Transformer-Schichten in GPT-3 175B</a></span></div>
								<div><b>126</b><span><a href="https://arxiv.org/abs/2407.21783" target="_blank" rel="noopener">Transformer-Schichten in Llama 3 405B</a></span></div>
							</div>
							<?php else: ?>
							<p>A language model combines these building blocks into a transformer block: attention first asks how strongly each word is connected to every other word in the context, and the model learns those connections from data. An FFN then untangles the result: it folds the vectors into a higher-dimensional space, separates features, and folds them back. A real transformer layer also contains layer normalization, residual connections, and other pieces. They are left out here so the picture stays readable; the later sections, including the <a href="#step-residual-section">residual section</a>, cover them in detail.</p>
							<p>At the start, a matrix X goes in: one row per token, each row a vector. At the end, a matrix of the same shape comes out, but the values have changed. The last token has absorbed the meaning of the whole context. The unembedding turns its vector into scores for every vocabulary token; those scores point to a region of token directions with small angles, and softmax draws one. ChatGPT's current architecture is not published, but public numbers for comparable flagship models show the scale: GPT-3 175B used 96 transformer layers, and Llama 3 405B uses 126. The stack really does run roughly a hundred times.</p>
							<div class="layer-count-note">
								<div><b>96</b><span><a href="https://arxiv.org/abs/2005.14165" target="_blank" rel="noopener"><?php echo $layer_de ? 'Transformer-Schichten in GPT-3 175B' : 'transformer layers in GPT-3 175B'; ?></a></span></div>
								<div><b>126</b><span><a href="https://arxiv.org/abs/2407.21783" target="_blank" rel="noopener"><?php echo $layer_de ? 'Transformer-Schichten in Llama 3 405B' : 'transformer layers in Llama 3 405B'; ?></a></span></div>
							</div>
							<?php endif; ?>
							<div class="prose-math layer-stack-formula" data-tex="\underbrace{ \text{next word} = \text{unembed}\!\left( \underbrace{ \text{layer}_n\!\left(\cdots \text{layer}_2\!\left(\text{layer}_1\!\left( \underbrace{\text{embedding}(\text{tokenizer}(\text{context}))}_{\text{text becomes vectors}} \right)\right)\cdots\right) }_{\text{each layer mixes and rewrites the vectors}} \right) }_{\text{the whole model: text in, next token out}}" data-tex-de="\underbrace{ \text{nächstes Wort} = \text{unembed}\!\left( \underbrace{ \text{layer}_n\!\left(\cdots \text{layer}_2\!\left(\text{layer}_1\!\left( \underbrace{\text{embedding}(\text{tokenizer}(\text{context}))}_{\text{Text wird zu Vektoren}} \right)\right)\cdots\right) }_{\text{jede Schicht mischt und schreibt die Vektoren um}} \right) }_{\text{das ganze Modell: Text rein, nächstes Token raus}}" data-tex-display="true"></div>
							<div class="prose-math layer-stack-formula" data-tex="\underbrace{X_{\text{out}} = \text{layer}_n(\cdots \text{layer}_1(\underbrace{X_{\text{in}}}_{\text{one row per token}}))}_{\text{same shape, new values}}" data-tex-de="\underbrace{X_{\text{out}} = \text{layer}_n(\cdots \text{layer}_1(\underbrace{X_{\text{in}}}_{\text{eine Zeile pro Token}}))}_{\text{dieselbe Form, neue Werte}}" data-tex-display="true"></div>
							<div class="layer-flow" role="img" aria-label="<?php echo $layer_de ? 'Der Aufbau als Stapel: Tokenizer, Embedding, N Transformer-Schichten, Unembedding' : 'The model as a stack: tokenizer, embedding, N transformer layers, unembedding'; ?>">
								<div class="lf-stage lf-stage--token"><span class="lf-num">01</span><b>Tokenizer</b><span><?php echo $layer_de ? 'Kontext → Tokens' : 'context → tokens'; ?></span></div>
								<span class="lf-arrow" aria-hidden="true">→</span>
								<div class="lf-stage lf-stage--embed"><span class="lf-num">02</span><b>Embedding</b><span><?php echo $layer_de ? 'Tokens → Vektoren' : 'tokens → vectors'; ?></span></div>
								<span class="lf-arrow" aria-hidden="true">→</span>
								<div class="lf-stage lf-stage--layers"><span class="lf-num">03</span><b><?php echo $layer_de ? 'Schichten × N' : 'Layers × N'; ?></b><span>Attention + FFN</span><span class="lf-stack-bars" aria-hidden="true"><i></i><i></i><i></i></span></div>
								<span class="lf-arrow" aria-hidden="true">→</span>
								<div class="lf-stage lf-stage--unembed"><span class="lf-num">04</span><b>Unembedding</b><span><?php echo $layer_de ? 'Vektor → Scores' : 'vector → scores'; ?></span></div>
							</div>
							<h4 class="layer-subhead"><?php echo $layer_de ? 'Wie der Kontext gemischt wird' : 'How the context is mixed'; ?></h4>
							<?php if ($layer_de): ?>
							<p>In einer Schicht schaut Attention auf den ganzen Kontext. Für jedes Token bewertet sie, wie viel es von jedem anderen sichtbaren Token übernehmen soll. Die Scores bilden eine Token-für-Token-Matrix: eine Zeile für das fragende Token, eine Spalte für das antwortende Token. Die <a href="#step-attention-section">Attention-Demo unten</a> zeigt einen Head dabei.</p>
							<?php else: ?>
							<p>Inside a layer, attention looks at the whole context. For every token, it scores how much that token should take from every other visible token. The scores form a token-by-token matrix: one row for the token asking, one column for the token answering. The <a href="#step-attention-section">attention demo below</a> shows one head doing this.</p>
							<?php endif; ?>
							<div class="layer-mix">
								<div class="layer-matrix-card">
									<div class="layer-card-title"><?php echo $layer_de ? 'Kausale Attention' : 'Causal attention'; ?></div>
									<?php
									$layer_tokens = $layer_de ? ['Die', 'Hauptstadt', 'von', 'Frankreich'] : ['The', 'capital', 'of', 'France'];
									$layer_weights = [
										[1.0, null, null, null],
										[0.8, 0.2, null, null],
										[0.1, 0.3, 0.6, null],
										[0.05, 0.45, 0.1, 0.4],
									];
									?>
									<div class="layer-attn-matrix" role="img" aria-label="<?php echo $layer_de ? 'Token-für-Token-Aufmerksamkeitsmatrix mit maskierter oberer Dreiecksfläche' : 'Token-by-token attention matrix with a masked upper triangle'; ?>">
										<div class="lam-corner">Token</div>
										<?php foreach ($layer_tokens as $layer_token): ?>
										<div class="lam-head"><?php echo htmlspecialchars($layer_token, ENT_QUOTES, 'UTF-8'); ?></div>
										<?php endforeach; ?>
										<?php foreach ($layer_tokens as $layer_i => $layer_token): ?>
										<div class="lam-label"><?php echo htmlspecialchars($layer_token, ENT_QUOTES, 'UTF-8'); ?></div>
										<?php foreach ($layer_tokens as $layer_j => $layer_other): ?>
										<?php $layer_w = $layer_weights[$layer_i][$layer_j]; ?>
										<?php if ($layer_w === null): ?>
										<div class="lam-cell is-masked" aria-hidden="true">—</div>
										<?php else: ?>
										<div class="lam-cell" style="--w:<?php echo $layer_w; ?>"><?php echo (int) round($layer_w * 100); ?>%</div>
										<?php endif; ?>
										<?php endforeach; ?>
										<?php endforeach; ?>
									</div>
									<div class="layer-matrix-legend">
										<span><i></i><?php echo $layer_de ? 'Zeile = Token fragt' : 'row = token asking'; ?></span>
										<span><i></i><?php echo $layer_de ? 'Spalte = Token antwortet' : 'column = token answering'; ?></span>
										<span><i class="is-mask"></i><?php echo $layer_de ? 'maskiert = zukünftiges Token' : 'masked = future token'; ?></span>
									</div>
								</div>
								<div class="layer-mix-card">
									<div class="layer-card-title"><?php echo $layer_de ? 'Die Mischung' : 'The mix'; ?></div>
									<div class="prose-math" data-tex="\underbrace{ \text{new}_2 = \underbrace{0.2\,\text{token}_2 + 0.8\,\text{token}_1}_{\text{weighted mix of visible vectors}} }_{\text{token 2 after attention}}" data-tex-de="\underbrace{ \text{neu}_2 = \underbrace{0.2\,\text{token}_2 + 0.8\,\text{token}_1}_{\text{gewichtete Mischung der sichtbaren Vektoren}} }_{\text{Token 2 nach Attention}}" data-tex-display="true"></div>
									<p class="layer-mix-note"><?php echo $layer_de ? 'Token 2 liest Token 1 und sich selbst. Token 3 kann es nicht lesen, weil Token 3 erst später kommt. Das obere Dreieck ist maskiert.' : 'Token 2 reads token 1 and itself. It cannot read token 3, because token 3 comes later. The upper triangle is masked.'; ?></p>
								</div>
							</div>
							<?php if ($layer_de): ?>
							<p>Die erste Schicht mischt die ursprünglichen Token-Vektoren. Spätere Schichten mischen Vektoren, die frühere Schichten bereits verändert haben; jeder Durchlauf sieht also einen anderen Kontext. In einem autoregressiven Modell ist die Matrix unterdreieckig: Ein Token kann auf sich und frühere Tokens achten, nie auf Tokens, die erst später kommen. Diese Kausalmaskierung erlaubt es, mit jedem Präfix eines Satzes zu trainieren und das nächste Token vorherzusagen, ohne die Zukunft zu sehen.</p>
							<p>Nach der Attention geht der neue Vektor jedes Tokens durch ein Feed-Forward-Netz. Das FFN arbeitet mit einem Token auf einmal: Es trennt Merkmale und schreibt den Vektor um. Attention bewegt Information zwischen Tokens; das FFN transformiert, was jedes Token trägt. Der <a href="#step-ffn-section">FFN-Abschnitt</a> öffnet diesen Schritt.</p>
							<h4 class="layer-subhead">Lokale Bedeutung, dann weiterer Kontext</h4>
							<p>Frühe Schichten können lokale Muster lernen. Eine Schicht kann bemerken, dass „new“ und „york“ zusammengehören; eine spätere Schicht kann diese kombinierte Bedeutung als neue Einheit nutzen und mit einem breiteren Kontext mischen. Eine einzelne Schicht kann eine kleine Aufgabe lösen, oder mehrere Schichten lösen eine gemeinsam. Tiefe Modelle arbeiten, indem sie diese kleinen Transformationen zusammensetzen.</p>
							<p>Der Stapel wiederholt sich. Jede Schicht hat ihre eigenen gelernten Gewichte; die Struktur ist geteilt, die Parameter nicht. Nach der letzten Schicht liest das Unembedding den Vektor des letzten Tokens und erzeugt eine Verteilung über das nächste Token. Die <a href="#block-repeat">echten GPT-2-Trajektorien unten</a> zeigen die Bewegung durch 12 dieser Blöcke; <a href="#last-step">der letzte Schritt</a> macht aus dem letzten Vektor ein Wort.</p>
							<?php else: ?>
							<p>The first layer mixes the original token vectors. Later layers mix vectors that earlier layers have already changed, so every pass sees a different context. In an autoregressive model the matrix is lower-triangular: a token can attend to itself and earlier tokens, never to tokens that come later. That causal mask is what lets the model train on every prefix of a sentence and predict the next token without seeing the future.</p>
							<p>After attention, each token's new vector goes through a feed-forward network. The FFN works on one token at a time: it separates features and rewrites the vector. Attention moves information between tokens; the FFN transforms what each token carries. The <a href="#step-ffn-section">FFN section</a> opens that step.</p>
							<h4 class="layer-subhead">Local meaning, then wider context</h4>
							<p>Early layers can learn local patterns. One layer may notice that “new” and “york” belong together; a later layer can use that combined meaning as a new unit and mix it with a wider context. A single layer can solve a small task, or several layers can solve one together. Deep models work by composing these small transformations.</p>
							<p>The stack repeats. Each layer has its own learned weights, so the structure is shared but the parameters are not. After the last layer, the unembedding reads the last token's vector and produces a distribution over the next token. The <a href="#block-repeat">real GPT-2 trajectories below</a> show the movement through 12 of these blocks; <a href="#last-step">the last step</a> turns the final vector into a word.</p>
							<?php endif; ?>
							<div class="prose-math layer-stack-formula" data-tex="\underbrace{p(\text{next} \mid \text{context}) = \text{softmax}(\underbrace{W_U\, h_{\text{last}}}_{\text{scores for every token}})}_{\text{the vector points to a region of token directions, then one is drawn}}" data-tex-de="\underbrace{p(\text{nächstes} \mid \text{Kontext}) = \text{softmax}(\underbrace{W_U\, h_{\text{letztes}}}_{\text{Scores für jedes Token}})}_{\text{der Vektor zeigt auf eine Region von Token-Richtungen, dann wird eines gezogen}}" data-tex-display="true"></div>
						</div>
					</section>

					<section class="section-block" id="block-repeat" data-chapter="Inside the transformer" data-chapter-de="Im Transformer">
						<div class="section-kicker"><span class="sk-num">05</span> The block repeats</div>
						<h2 class="section-title">The whole block: attention + FFN, again and again</h2>
						<div class="prose">
							<p>Attention and the FFN are one transformer block. The same architecture runs again and again, but each layer has its own learned weights and its own learned vectors. The block repeats in structure, not in parameters. Each pass lets every token look at the context, then moves it through its own MLP.</p>
							<p>Below, real GPT-2 trajectories show the same movement. Each line is one token, each bend is one block. The vectors live in 768 dimensions; the plot is their 3D PCA shadow. The angular view is the default because the model compares directions, and “plausible” means the continuation is frequent in its training data, not that it is true.</p>
						</div>

						<div class="demo demo--paper demo--canvas" id="block-trajectory-real">
							<div class="demo-head">
								<div>
									<p class="demo-title">Token trajectories through GPT-2 <span>· real PCA</span></p>
									<p class="demo-sub">Real hidden states from GPT-2 small for “The capital of France is”. Each line follows one token through the embedding and 12 blocks. PCA finds the three directions where the 768-dimensional states change most and projects everything onto them; the 3D points are a shadow of the real motion.</p>
								</div>
								<span class="demo-badge">GPT-2 · PCA</span>
							</div>
							<div class="demo-body">
								<div id="real-trajectory-3d" class="traj-plotly-host" role="img" aria-label="3D token trajectories through GPT-2, PCA-reduced to three dimensions"><div class="traj-loading"><span class="traj-loader-spinner" aria-hidden="true"></span><span><?php echo function_exists("tm_lang") && tm_lang() === "de" ? "GPT-2-Trajektorien werden geladen …" : "Loading GPT-2 trajectories …"; ?></span></div></div>
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

					<section class="section-block" id="last-step" data-chapter="From vector to word" data-chapter-de="Vom Vektor zum Wort">
						<div class="section-kicker"><span class="sk-num">06</span> The last step</div>
						<h2 class="section-title">The final vector picks a word.</h2>
						<div class="prose">
							<?php $tm_de = function_exists('tm_lang') && tm_lang() === 'de'; ?>
							<?php if ($tm_de): ?>
							<p>Das letzte Token trägt den gesamten Kontext in seinem finalen Vektor <span class="nt-formula" data-tex="\mathbf{h}" data-tex-display="false"></span>. Eine gelernte Unembedding-Matrix <span class="nt-formula" data-tex="W_U" data-tex-display="false"></span> macht daraus einen Score für jedes Vokabular-Token.</p>
							<p><span class="nt-formula" data-tex="W_U" data-tex-display="false"></span> hat eine Zeile <span class="nt-formula" data-tex="\mathbf{w}_i" data-tex-display="false"></span> pro Token. Das Skalarprodukt <span class="nt-formula" data-tex="\mathbf{h} \cdot \mathbf{w}_i" data-tex-display="false"></span> ist der Logit <span class="nt-formula" data-tex="z_i" data-tex-display="false"></span>; der Vektor <span class="nt-formula" data-tex="\mathbf{z}" data-tex-display="false"></span> sammelt alle Logits. Nach der Normierung ist dieses Skalarprodukt der Kosinus des Winkels zwischen <span class="nt-formula" data-tex="\mathbf{h}" data-tex-display="false"></span> und <span class="nt-formula" data-tex="\mathbf{w}_i" data-tex-display="false"></span>; die Großkreis-Ansicht zeigt diesen Winkel.</p>
							<p>Bei GPT-2 ist <span class="nt-formula" data-tex="W_U" data-tex-display="false"></span> oft an die Eingabe-Embedding-Matrix gebunden, aber sie bleibt eine gelernte Matrix.</p>
							<?php else: ?>
							<p>The last token carries the whole context in its final vector <span class="nt-formula" data-tex="\mathbf{h}" data-tex-display="false"></span>. A learned unembedding matrix <span class="nt-formula" data-tex="W_U" data-tex-display="false"></span> turns it into one score per vocabulary token.</p>
							<p><span class="nt-formula" data-tex="W_U" data-tex-display="false"></span> has one row <span class="nt-formula" data-tex="\mathbf{w}_i" data-tex-display="false"></span> per token. The dot product <span class="nt-formula" data-tex="\mathbf{h} \cdot \mathbf{w}_i" data-tex-display="false"></span> is the logit <span class="nt-formula" data-tex="z_i" data-tex-display="false"></span>; the vector <span class="nt-formula" data-tex="\mathbf{z}" data-tex-display="false"></span> collects all logits. After normalization, that dot product is the cosine of the angle between <span class="nt-formula" data-tex="\mathbf{h}" data-tex-display="false"></span> and <span class="nt-formula" data-tex="\mathbf{w}_i" data-tex-display="false"></span>; the great-circle view shows that angle.</p>
							<p>In GPT-2 <span class="nt-formula" data-tex="W_U" data-tex-display="false"></span> is often tied to the input embedding matrix, but it is still a learned matrix.</p>
							<?php endif; ?>
							<div class="prose-math" data-tex="\underbrace{ \underbrace{\mathbf{z}}_{\text{all vocabulary logits}} = \underbrace{\mathbf{h}}_{\text{final context vector}} \underbrace{W_U^{\top}}_{\substack{\text{transpose of }W_U\\\text{the learned unembedding matrix}}} }_{\text{one matrix-vector product gives a score for every token}}" data-tex-de="\underbrace{ \underbrace{\mathbf{z}}_{\text{alle Vokabular-Logits}} = \underbrace{\mathbf{h}}_{\text{finaler Kontextvektor}} \underbrace{W_U^{\top}}_{\substack{\text{Transponierte von }W_U\\\text{der gelernten Unembedding-Matrix}}} }_{\text{ein Matrix-Vektor-Produkt gibt einen Score für jedes Token}}" data-tex-display="true"></div>
							<div class="prose-math" data-tex="\underbrace{z_i = \underbrace{\mathbf{h}}_{\text{final context vector}} \cdot \underbrace{\mathbf{w}_i}_{\text{row }i\text{ of }W_U}}_{\text{logit for token }i}" data-tex-de="\underbrace{z_i = \underbrace{\mathbf{h}}_{\text{finaler Kontextvektor}} \cdot \underbrace{\mathbf{w}_i}_{\text{Zeile }i\text{ von }W_U}}_{\text{Logit für Token }i}" data-tex-display="true"></div>
							<?php if ($tm_de): ?>
							<p>Softmax macht aus den Logits Wahrscheinlichkeiten: <span class="nt-formula" data-tex="p_i = \exp(z_i)/Z" data-tex-display="false"></span>, wobei <span class="nt-formula" data-tex="Z" data-tex-display="false"></span> über das ganze Vokabular summiert. Die größte Wahrscheinlichkeit gewinnt, aber die Alternativen bleiben möglich.</p>
							<?php else: ?>
							<p>Softmax turns the logits into probabilities: <span class="nt-formula" data-tex="p_i = \exp(z_i)/Z" data-tex-display="false"></span>, where <span class="nt-formula" data-tex="Z" data-tex-display="false"></span> sums over the whole vocabulary. The largest probability wins, but the alternatives remain possible.</p>
							<?php endif; ?>
							<div class="prose-math" data-tex="\underbrace{p_i = \frac{\exp(z_i)}{\underbrace{Z}_{\text{normalizer}}}, \qquad \underbrace{Z = \sum_{j=1}^{V} \exp(z_j)}_{\text{sum over all }V\text{ vocabulary entries}}}_{\text{softmax: a distribution over the vocabulary}}" data-tex-de="\underbrace{p_i = \frac{\exp(z_i)}{\underbrace{Z}_{\text{Normalisierer}}}, \qquad \underbrace{Z = \sum_{j=1}^{V} \exp(z_j)}_{\text{Summe über alle }V\text{ Vokabular-Einträge}}}_{\text{Softmax: eine Verteilung über das Vokabular}}" data-tex-display="true"></div>
							<?php if ($tm_de): ?>
							<p>Geometrisch zeigt <span class="nt-formula" data-tex="\mathbf{h}" data-tex-display="false"></span> auf eine Region von Token-Richtungen. Jedes Token besitzt eine Region; nahe einer Naht sind zwei Wörter fast gleich wahrscheinlich. Mehr Tokens verkleinern die Zellen, aber die Nähte schließen sich nie. <a href="https://arxiv.org/abs/2603.22301" rel="noopener">Mabrok (2026)</a> nennt das Band um eine Naht die Expressibility Gap.</p>
							<?php else: ?>
							<p>Geometrically, <span class="nt-formula" data-tex="\mathbf{h}" data-tex-display="false"></span> points to a region of token directions. Each token owns a region; near a seam two words are almost equally likely. More tokens shrink the cells, but the seams never close. <a href="https://arxiv.org/abs/2603.22301" rel="noopener">Mabrok (2026)</a> calls the band around a seam the expressibility gap.</p>
							<?php endif; ?>
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

					<section class="section-block" id="whole" data-chapter="From vector to word" data-chapter-de="Vom Vektor zum Wort">
						<div class="section-kicker"><span class="sk-num">07</span> The whole loop</div>
						<h2 class="section-title">Text in, geometry, one word out.</h2>
						<?php $tm_de = function_exists('tm_lang') && tm_lang() === 'de'; ?>
						<div class="prose">
							<?php if ($tm_de): ?>
							<p>Die Teile fügen sich in fester Reihenfolge zusammen: <strong>Text → Tokens → Vektoren → Position → Attention + Residual → FFN → Verteilung → Ziehen → Anhängen</strong>. Die Schleife endet, wenn das Modell das spezielle Token <strong>&lt;|endoftext|&gt;</strong> ausgibt.</p>
							<p>Kein Schritt hat eine ordentliche Fakten-Datenbank. Wissen ist über die Gewichte verteilt, und Bedeutung lebt in der Geometrie. Ein Haufen Zahlen wird Token für Token zu einem Satz.</p>
							<?php else: ?>
							<p>The pieces fit in a fixed order: <strong>text → tokens → vectors → position → attention + residual → FFN → distribution → draw → append</strong>. The loop ends when the model emits the special token <strong>&lt;|endoftext|&gt;</strong>.</p>
							<p>No step has a tidy fact database. Knowledge is distributed across the weights, and meaning lives in the geometry. A pile of numbers becomes a sentence one token at a time.</p>
							<?php endif; ?>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>What it is</b><span>A next-token predictor: one distribution, one draw, one append, repeated.</span></div>
							<div class="keypoint"><b>Why it works</b><span>More context and more layers narrow the distribution, so the next token becomes easier to choose.</span></div>
							<div class="keypoint"><b>Its limits</b><span>It predicts plausible text. It can be fluent and wrong, and it offers no guarantee of truth.</span></div>
							<?php if ($tm_de): ?>
							<div class="keypoint"><b>Die feste Reihenfolge</b><span><strong>Text → Tokens → Vektoren → Position → Attention + Residual → FFN → Verteilung → Ziehen → Anhängen</strong>. Die Schleife endet, wenn das Modell das spezielle Token <strong>&lt;|endoftext|&gt;</strong> ausgibt.</span></div>
							<?php else: ?>
							<div class="keypoint"><b>The fixed order</b><span><strong>text → tokens → vectors → position → attention + residual → FFN → distribution → draw → append</strong>. The loop ends when the model emits <strong>&lt;|endoftext|&gt;</strong>.</span></div>
							<?php endif; ?>
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
		var isoBackward = false;
		var isoLoading = false;
		var isoDrawn = false;
		var isoBallPos = null;
		var isoBallRaf = null;
		var isoTempRaf = null;
		var isoBallEl = document.getElementById("tt-ball");
		var isoBallLabel = document.getElementById("tt-ball-label");
		var isoStepGap = 1.35;
		var isoYMax = 1.18;
		var isoPits = [
			{ x: 2.35, y: -0.88, depth: 0.24, width: 0.11, rim: 0.045, rimR: 0.18 },
			{ x: 5.55, y: 0.92, depth: 0.21, width: 0.10, rim: 0.040, rimR: 0.17 },
			{ x: 4.15, y: -0.70, depth: 0.18, width: 0.08, rim: 0.035, rimR: 0.14 },
			{ x: 1.25, y: 0.95, depth: 0.20, width: 0.09, rim: 0.040, rimR: 0.15 },
			{ x: 3.15, y: -0.98, depth: 0.18, width: 0.09, rim: 0.040, rimR: 0.14 },
			{ x: 6.35, y: 0.55, depth: 0.16, width: 0.08, rim: 0.035, rimR: 0.13 }
		];
		var isoBumps = [
			{ x: 1.60, y: 0.35, amp: 0.07, r: 0.18 },
			{ x: 2.90, y: -0.45, amp: 0.06, r: 0.20 },
			{ x: 4.70, y: 0.40, amp: 0.08, r: 0.17 },
			{ x: 6.10, y: -0.35, amp: 0.06, r: 0.19 }
		];
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
		var isoAltSequences = DE ? [
			{ branchStep: 2, altIndex: 0, tokens: ["ist", "Berlin"], color: "green" },
			{ branchStep: 2, altIndex: 1, tokens: ["ist", "Rom"], color: "coral" }
		] : [
			{ branchStep: 2, altIndex: 0, tokens: ["is", "Berlin"], color: "green" },
			{ branchStep: 2, altIndex: 1, tokens: ["is", "Rome"], color: "coral" }
		];
		var isoFillerLabels = DE
			? ["der", "jetzt", "eine", "in", "auch", "nicht", "und", "war"]
			: ["the", "now", "a", "in", "also", "not", "and", "was"];
		var isoFillerPositions = [
			[1.1, 0.72], [1.9, -0.68], [2.7, 0.86], [3.4, -0.52],
			[4.4, 0.62], [5.2, -0.84], [6.0, 0.76], [6.9, -0.58]
		];
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
			return Math.max(0.12, 0.26 + 0.30 * (2.0 - isoTemp) / 1.95);
		}
		function isoMainDepthAt(x) {
			var entropy = isoEntropyAt(x);
			return isoMainDepth() * (0.78 + 0.22 * (1 - entropy));
		}
		function isoMainWidth(x) {
			var entropy = isoEntropyAt(x);
			var tempW = 0.40 + 0.90 * (isoTemp / (isoTemp + 1.2));
			return 0.14 + 0.55 * (0.25 + entropy) * tempW;
		}
		function isoAltY(alt) {
			return (alt.path.y - 0.4) * 2.2;
		}
		function isoAltEndY(alt) {
			return (isoAltY(alt) >= 0 ? 1 : -1) * 1.12;
		}
		function isoAltSlope(branch, alt) {
			var sign;
			if (branch.atStep < 1.5) sign = 1;
			else if (branch.atStep > 4.5) sign = -1;
			else sign = Math.sin(branch.atStep * 1.7 + alt.entropy * 12) >= 0 ? 1 : -1;
			var mag = 0.65 + 0.35 * Math.abs(alt.entropy - 0.45) * 2
				+ 0.10 * Math.sin(branch.atStep * 2.1 + alt.path.x * 14);
			return sign * isoClamp(mag, 0.55, 1.15);
		}
		function isoAltEndGeometry(branch, alt) {
			var bx = branch.atStep + 0.52;
			var startY = isoCenter(bx);
			var endY = isoAltEndY(alt) * 0.97
				+ 0.03 * Math.sin(branch.atStep * 2.3 + alt.entropy * 10);
			var slope = isoAltSlope(branch, alt);
			var stepX = bx + slope * (endY - startY)
				+ 0.04 * Math.sin(branch.atStep * 1.4 + alt.entropy * 20);
			stepX = Math.max(0.1, Math.min(isoTokens.length - 1, stepX));
			return { bx: bx, startY: startY, endY: endY, y: endY, slope: slope, stepX: stepX, x: stepX * isoStepGap };
		}
		function isoAltEndKind(branch, alt) {
			var code = (branch.atStep * 7 + Math.round(alt.entropy * 100)) % 5;
			return code === 0 || code === 3 ? "hill" : "valley";
		}
		function isoAltEndPoint(branch, alt) {
			var g = isoAltEndGeometry(branch, alt);
			return [g.x, g.y, isoSurfaceHeight(g.stepX, g.y) + 0.06];
		}
		function isoSequenceData(seq) {
			var branch = null;
			for (var i = 0; i < isoBranches.length; i++) {
				if (isoBranches[i].atStep === seq.branchStep) { branch = isoBranches[i]; break; }
			}
			if (!branch) return null;
			var alt = branch.alternatives[seq.altIndex];
			if (!alt) return null;
			var g = isoAltEndGeometry(branch, alt);
			var dir = g.y >= 0 ? 1 : -1;
			var dirX = g.slope >= 0 ? 1 : -1;
			var points = [];
			for (var p = 0; p < seq.tokens.length; p++) {
				var stepX = g.stepX + dirX * (p + 1) * 0.9;
				stepX = Math.max(0.1, Math.min(isoTokens.length - 1, stepX));
				var y = dir * (0.92 - p * 0.20)
					+ 0.03 * Math.sin(branch.atStep * 1.3 + p * 2.1);
				points.push({
					name: seq.tokens[p],
					stepX: stepX,
					y: y,
					point: [stepX * isoStepGap, y, isoSurfaceHeight(stepX, y) + 0.06]
				});
			}
			return {
				branch: branch,
				alt: alt,
				start: { stepX: g.stepX, y: g.y, point: isoAltEndPoint(branch, alt) },
				points: points
			};
		}
		function isoSurfaceLine(points, offset) {
			var out = [];
			for (var i = 0; i < points.length - 1; i++) {
				var a = points[i];
				var b = points[i + 1];
				for (var j = 0; j < 8; j++) {
					var t = j / 8;
					var stepX = isoLerp(a.stepX, b.stepX, t);
					var y = isoLerp(a.y, b.y, t);
					out.push([stepX * isoStepGap, y, isoSurfaceHeight(stepX, y) + offset]);
				}
			}
			var last = points[points.length - 1];
			out.push([last.stepX * isoStepGap, last.y, isoSurfaceHeight(last.stepX, last.y) + offset]);
			return out;
		}
		function isoAltDepth(alt, mainDepth) {
			var factor = 0.42 + 0.42 * (1 - alt.entropy) + 0.12 * isoTemp;
			return mainDepth * Math.min(0.95, factor);
		}
		function isoValleyDepth(x, y) {
			var centre = isoCenter(x);
			var mainWidth = isoMainWidth(x);
			var mainDepth = isoMainDepthAt(x);
			var depth = Math.exp(-Math.pow((y - centre) / mainWidth, 2)) * mainDepth;
			isoBranches.forEach(function (branch) {
				var bx = branch.atStep + 0.52;
				var startY = isoCenter(bx);
				branch.alternatives.forEach(function (alt) {
					var endY = isoAltEndY(alt);
					var t = (y - startY) / (endY - startY);
					if (t < 0 || t > 1) return;
					var channelX = bx + isoAltSlope(branch, alt) * (y - startY);
					var dx = x - channelX;
					var sx = 0.30 + 0.12 * alt.entropy;
					var gate = 0.5 + 0.5 * Math.sin(Math.PI * t);
					var d = isoAltDepth(alt, mainDepth)
						* Math.exp(-Math.pow(dx / sx, 2)) * gate;
					if (d > depth) depth = d;
				});
			});
			var sideOffsets = [-1.20, -0.90, -0.60, -0.30, 0.30, 0.60, 0.90, 1.20];
			for (var si = 0; si < sideOffsets.length; si++) {
				var sy = centre + sideOffsets[si] + 0.05 * Math.sin(x * 1.25 + si * 1.7);
				var sw = 0.10 + 0.14 * (0.5 + 0.5 * Math.sin(x * 0.95 + si * 2.1)) * (0.5 + 0.9 * (isoTemp / (isoTemp + 1.5)));
				var sd = mainDepth * (0.22 + 0.26 * (0.5 + 0.5 * Math.sin(x * 1.6 + si * 2.3))) * Math.min(1.25, 0.65 + 0.35 * isoTemp);
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
			var ripple = 0.014 * Math.sin(x * 1.8 + y * 3.1) * Math.cos(y * 2.2 - x * 1.25)
				+ 0.006 * Math.sin(x * 3.1 - y * 2.6) * Math.cos(y * 3.4 + x * 1.1);
			var edgeDrop = 0.05 * Math.pow(Math.abs(y) / isoYMax, 2);
			var z = -depth + (ripple - edgeDrop) * (1 - Math.min(1, depth));
			var centre = isoCenter(stepX);
			var rough = (0.012 * Math.sin(stepX * 16.0)
				+ 0.006 * Math.sin(stepX * 27.0 + 1.3))
				* Math.exp(-Math.pow((y - centre) / 0.13, 2));
			z += rough;
			isoBranches.forEach(function (branch) {
				branch.alternatives.forEach(function (alt) {
					if (isoAltEndKind(branch, alt) !== "hill") return;
					var g = isoAltEndGeometry(branch, alt);
					z += 0.12 * Math.exp(-Math.pow((x - g.x) / 0.20, 2)
						- Math.pow((y - g.y) / 0.20, 2));
				});
			});
			isoBumps.forEach(function (bump) {
				var bdx = stepX - bump.x;
				var bdy = y - bump.y;
				z += bump.amp * Math.exp(-(bdx * bdx + bdy * bdy) / (bump.r * bump.r));
			});
			isoPits.forEach(function (pit) {
				var dx = stepX - pit.x;
				var dy = y - pit.y;
				var dist = Math.sqrt(dx * dx + dy * dy);
				z -= pit.depth * Math.exp(-Math.pow(dist / pit.width, 2));
				z += pit.rim * Math.exp(-Math.pow((dist - pit.rimR) / 0.09, 2));
			});
			return z;
		}
		function isoTokenPoint(index) {
			var jx = 0.05 * Math.sin(index * 2.1 + 0.7);
			var jy = 0.05 * Math.sin(index * 1.7 + 1.9);
			var stepX = index + jx / isoStepGap;
			var x = stepX * isoStepGap;
			var y = isoCenter(index) + jy;
			return [x, y, isoSurfaceHeight(stepX, y) + 0.06];
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
			var altCount = 0;
			isoBranches.forEach(function (branch) { altCount += branch.alternatives.length; });
			isoAltSequences.forEach(function (seq) { altCount += seq.tokens.length; });
			for (var a = 0; a < altCount; a++) {
				var alt = document.createElement("span");
				alt.className = "tt-point-label tt-point-label--alt";
				alt.setAttribute("data-alt-index", a);
				alt.style.display = "none";
				container.appendChild(alt);
			}
			container.dataset.ready = "1";
			return container;
		}
		function isoLayoutLabels(entries) {
			entries.sort(function (a, b) { return a.screen[1] - b.screen[1]; });
			var placed = [];
			var hostW = isoHost ? isoHost.clientWidth : 1e9;
			var hostH = isoHost ? isoHost.clientHeight : 1e9;
			entries.forEach(function (entry) {
				var el = entry.el;
				var w = el.offsetWidth;
				var h = el.offsetHeight;
				var sx = entry.screen[0];
				var sy = entry.screen[1];
				var gap = 4;
				var candidates = [];
				[0, 18, 36, 54, 72, 90, 108, 126, 150, 180].forEach(function (shift) {
					candidates.push({ dx: 0, dy: -gap - h - shift });
					candidates.push({ dx: 0, dy: gap + shift });
					candidates.push({ dx: gap + shift, dy: -h / 2 });
					candidates.push({ dx: -w - gap - shift, dy: -h / 2 });
					candidates.push({ dx: gap + shift, dy: -gap - h });
					candidates.push({ dx: -w - gap - shift, dy: -gap - h });
					candidates.push({ dx: gap + shift, dy: gap });
					candidates.push({ dx: -w - gap - shift, dy: gap });
				});
				var bestBox = null;
				var bestScore = Infinity;
				candidates.forEach(function (cand) {
					var box = { x: sx + cand.dx, y: sy + cand.dy, w: w, h: h };
					var overlap = 0;
					for (var i = 0; i < placed.length; i++) {
						var p = placed[i];
						var ox = Math.min(box.x + box.w, p.x + p.w) - Math.max(box.x, p.x);
						var oy = Math.min(box.y + box.h, p.y + p.h) - Math.max(box.y, p.y);
						if (ox > 0 && oy > 0) overlap += ox * oy;
					}
					var outside = 0;
					if (box.x < 0) outside += -box.x;
					if (box.x + box.w > hostW) outside += box.x + box.w - hostW;
					if (box.y < 0) outside += -box.y;
					if (box.y + box.h > hostH) outside += box.y + box.h - hostH;
					var dist = Math.abs(cand.dx) + Math.abs(cand.dy);
					var score = overlap * 1000 + outside * 2 + dist * 0.1;
					if (score < bestScore) {
						bestScore = score;
						bestBox = box;
					}
				});
				el.style.left = bestBox.x + "px";
				el.style.top = bestBox.y + "px";
				el.style.transform = "none";
				placed.push(bestBox);
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
				var screen = isoProjectPoint(isoTokenPoint(i));
				if (!screen) {
					el.style.display = "none";
					return;
				}
				el.style.display = "";
				el.style.left = screen[0] + "px";
				el.style.top = screen[1] + "px";
				el.classList.toggle("is-current", i === step);
				el.classList.toggle("is-future", i > step);
				entries.push({ el: el, screen: screen, mode: i % 2 === 0 ? "above" : "below" });
			});
			var altEls = container.querySelectorAll("[data-alt-index]");
			altEls.forEach(function (el) { el.style.display = "none"; });
			var altIndex = 0;
			isoBranches.forEach(function (branch) {
				branch.alternatives.forEach(function (alt) {
					var el = altEls[altIndex];
					var mode = altIndex % 2 === 0 ? "below" : "above";
					altIndex++;
					if (!el) return;
					var screen = isoProjectPoint(isoAltEndPoint(branch, alt));
					if (!screen) return;
					el.style.display = "";
					el.textContent = isoAltLabel(alt.token);
					el.style.left = screen[0] + "px";
					el.style.top = screen[1] + "px";
					el.classList.toggle("is-current", branch.atStep === step);
					entries.push({ el: el, screen: screen, mode: mode });
				});
			});
			isoAltSequences.forEach(function (seq) {
				var data = isoSequenceData(seq);
				if (!data) return;
				data.points.forEach(function (p) {
					var el = altEls[altIndex];
					var mode = altIndex % 2 === 0 ? "below" : "above";
					altIndex++;
					if (!el) return;
					var screen = isoProjectPoint(p.point);
					if (!screen) return;
					el.style.display = "";
					el.textContent = p.name;
					el.style.left = screen[0] + "px";
					el.style.top = screen[1] + "px";
					el.classList.toggle("is-current", seq.branchStep === step);
					entries.push({ el: el, screen: screen, mode: mode });
				});
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
			var g = isoAltEndGeometry(branch, alt);
			var points = [];
			for (var t = 0; t <= 1.0001; t += 0.1) {
				var y = isoLerp(g.startY, g.endY, t);
				var stepX = g.bx + g.slope * (y - g.startY);
				points.push([stepX * isoStepGap, y, isoSurfaceHeight(stepX, y) + 0.14]);
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
					symbolSize: current ? 14 : 7.5,
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
				lineStyle: { width: 16, color: c.blue, opacity: 0.18 },
				silent: true
			});
			series.push({
				id: "path",
				name: "path",
				type: "line3D",
				data: hasTrail ? trail : [],
				lineStyle: { width: 4.5, color: c.blue, opacity: 0.98 },
				silent: true
			});
			var detours = isoPossibleDetours();
			for (var di = 0; di < 4; di++) {
				series.push(isoDetourSeries(c, di, detours[di]));
			}
			var seqColors = { green: c.green, coral: c.coral };
			var seqTokens = [];
			isoAltSequences.forEach(function (seq, si) {
				var data = isoSequenceData(seq);
				var color = seqColors[seq.color] || c.green;
				series.push({
					id: "alt-seq-" + si,
					name: "alt-sequence",
					type: "line3D",
					data: data ? isoSurfaceLine([data.start].concat(data.points), 0.14) : [],
					lineStyle: { width: 2.5, color: color, opacity: 0.82 },
					silent: true
				});
				if (data) {
					data.points.forEach(function (p) {
						seqTokens.push({
							name: p.name,
							value: p.point,
							itemStyle: { color: color, borderColor: c.paper, borderWidth: 1 }
						});
					});
				}
			});
			series.push({
				id: "alt-seq-tokens",
				name: "alt-seq-tokens",
				type: "scatter3D",
				data: seqTokens,
				symbol: "circle",
				symbolSize: 7,
				tooltip: { formatter: function (p) { return p.name; } }
			});
			var filler = [];
			isoFillerPositions.forEach(function (pos, fi) {
				var stepX = pos[0] + 0.04 * Math.sin(fi * 1.9 + 0.3);
				var y = pos[1] + 0.04 * Math.sin(fi * 2.3 + 1.1);
				filler.push({
					name: isoFillerLabels[fi],
					value: [stepX * isoStepGap, y, isoSurfaceHeight(stepX, y) + 0.05],
					itemStyle: { color: mixRgb(c.gold, c.paper, 0.35), opacity: 0.62 }
				});
			});
			series.push({
				id: "filler-tokens",
				name: "filler-tokens",
				type: "scatter3D",
				data: filler,
				symbol: "circle",
				symbolSize: 4,
				tooltip: { formatter: function (p) { return p.name; } }
			});
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
			var hasMomentum = step < isoTokens.length - 1 && !isoBackward;
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
		function isoSurfaceColor(t, colors) {
			return mixRgb(colors.deep, colors.base, Math.max(0, Math.min(1, t)));
		}
		function isoSurfaceData(colors) {
			var points = [];
			var xCount = 141, yCount = 101;
			var xMin = 0, xMax = (isoTokens.length - 1) * isoStepGap;
			var yMin = -isoYMax, yMax = isoYMax;
			var minZ = Infinity, maxZ = -Infinity;
			for (var yi = 0; yi <= yCount; yi++) {
				var y = isoLerp(yMin, yMax, yi / yCount);
				for (var xi = 0; xi <= xCount; xi++) {
					var x = isoLerp(xMin, xMax, xi / xCount);
					var z = isoSurfaceHeight(x / isoStepGap, y);
					if (z < minZ) minZ = z;
					if (z > maxZ) maxZ = z;
					points.push([x, y, z]);
				}
			}
			var colorMin = Infinity;
			for (var s = 0; s <= 80; s++) {
				var sampleX = (s / 80) * (isoTokens.length - 1);
				var sampleZ = isoSurfaceHeight(sampleX, isoCenter(sampleX));
				if (sampleZ < colorMin) colorMin = sampleZ;
			}
			colorMin -= 0.02;
			var span = Math.max(1e-6, maxZ - colorMin);
			var data = points.map(function (p) {
				var t = Math.pow(Math.max(0, Math.min(1, (p[2] - colorMin) / span)), 1.35);
				return {
					value: [Number(p[0].toFixed(3)), Number(p[1].toFixed(3)), Number(p[2].toFixed(4))],
					itemStyle: { color: isoSurfaceColor(t, colors) }
				};
			});
			return { data: data, shape: [yCount + 1, xCount + 1], minZ: minZ, maxZ: maxZ };
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
			var deepSurface = mixRgb(c.blue, c.ink, c.dark ? 0.28 : 0.52);
			var baseSurface = mixRgb(c.paper2, c.gold, c.dark ? 0.55 : 0.65);
			var surface = isoSurfaceData({ deep: deepSurface, base: baseSurface });
			var zMin = surface.minZ - 0.03;
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
						alpha: 34, beta: 42, distance: 210,
						autoRotate: false, damping: 0.9,
						rotateSensitivity: 1.2, zoomSensitivity: 1.2
					},
					light: {
						main: { intensity: 1.22, shadow: false, alpha: 38, beta: 16 },
						ambient: { intensity: 0.52 }
					},
					environment: c.paper2,
					boxWidth: 135, boxHeight: 30, boxDepth: 112,
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
			var previous = isoStep;
			var next = Math.max(0, Math.min(isoTokens.length - 1, index));
			isoBackward = next < previous;
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
			if (isoHost) isoHost.innerHTML = '<div class="tt-fallback"><span class="tt-loader-spinner" aria-hidden="true"></span><span>' + isoLabels.loading + '</span></div>';
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
					if (isoTempRaf) return;
					isoTempRaf = requestAnimationFrame(function () {
						isoTempRaf = null;
						if (isoLoaded) drawIso();
						else updateIsoSide();
					});
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
			if (document.fonts && document.fonts.ready) {
				document.fonts.ready.then(function () {
					if (isoLoaded) requestAnimationFrame(isoUpdateOverlayLabels);
				});
			}
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
					if (embApi) embApi.redraw({ spinner: false });
				}
			});
			embCanvas.addEventListener("pointerleave", function () {
				if (embHover) {
					embHover = null;
					if (embApi) embApi.redraw({ spinner: false });
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
			var posVisible = !("IntersectionObserver" in window);
			var posRaf = null;
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
						posApi.redraw({ spinner: false });
					}
				}
				if (posVisible && !document.hidden) posRaf = requestAnimationFrame(posTick);
				else posRaf = null;
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
				if (posApi) posApi.redraw({ spinner: false });
			});
			posCanvas.addEventListener("pointerup", posEndDrag);
			posCanvas.addEventListener("pointercancel", posEndDrag);
			if ("IntersectionObserver" in window) {
				new IntersectionObserver(function (entries) {
					posVisible = entries[0].isIntersecting;
					if (posVisible && posRaf === null && !document.hidden) posRaf = requestAnimationFrame(posTick);
				}, { threshold: 0.01 }).observe(posCanvas);
			}
			window.addEventListener("tm:theme", function () {
				if (posApi) posApi.redraw();
			});
			if (posCountOut) posCountOut.textContent = String(pos);
			posRenderOut();
			if (posApi) posApi.redraw();
			if (posVisible) posRaf = requestAnimationFrame(posTick);
		}

		/* ── attention ───────────────────────────────────────── */
		var attCanvas = document.getElementById("iatt-canvas");
		var attSentence = document.getElementById("iatt-sentence");
		var attOut = document.getElementById("iatt-out");
		var attApi = null;
		var attIndex = 0;
		var attShown = [5, 5];
		var attRaf = null;
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
			ctx.lineTo(ax(attShown[0]), ay(attShown[1]));
			ctx.strokeStyle = c.dark ? "rgba(238,247,244,.6)" : "rgba(0,75,111,.55)";
			ctx.lineWidth = 2;
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(ax(attShown[0]) - 6, ay(attShown[1]));
			ctx.lineTo(ax(attShown[0]), ay(attShown[1]) - 6);
			ctx.lineTo(ax(attShown[0]) + 6, ay(attShown[1]));
			ctx.lineTo(ax(attShown[0]), ay(attShown[1]) + 6);
			ctx.closePath();
			ctx.fillStyle = c.dark ? "#9185be" : "#9f9700";
			ctx.fill();
			ctx.strokeStyle = c.card;
			ctx.lineWidth = 2;
			ctx.stroke();
			var moved = Math.hypot(attShown[0] - bank[0], attShown[1] - bank[1]) > 0.15;
			if (moved) {
				var label = DE ? "Bank (mit Kontext)" : "bank (with context)";
				ctx.font = "700 10px Barlow, system-ui, sans-serif";
				var tw = ctx.measureText(label).width;
				var tx = ax(attShown[0]), ty = ay(attShown[1]) - 14;
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
		function animateAttTo(target) {
			var to = [target[0], target[1]];
			if (attRaf) {
				cancelAnimationFrame(attRaf);
				attRaf = null;
			}
			var from = attShown.slice();
			if (window.__tmHeightReserving || TM.prefersReduced() || Math.hypot(to[0] - from[0], to[1] - from[1]) < 0.01) {
				attShown = to;
				if (attApi) attApi.redraw({ spinner: false });
				return;
			}
			var start = performance.now();
			var duration = 260;
			function tick(now) {
				var t = Math.min(1, (now - start) / duration);
				var e = TM.ease(t);
				attShown = [from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e];
				if (attApi) attApi.redraw({ spinner: false });
				if (t < 1) {
					attRaf = requestAnimationFrame(tick);
				} else {
					attShown = to;
					attRaf = null;
					if (attApi) attApi.redraw({ spinner: false });
				}
			}
			attRaf = requestAnimationFrame(tick);
		}
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
				attMatrix.innerHTML = html;
			}
			if (attSum) {
				var words = ["bank", "river", "money"].filter(function (word) {
					return ex.weights[word] > 0;
				});
				var firstTerms = words.map(function (word) {
					return ex.weights[word].toFixed(2) + "\\,v_{\\text{" + attLabel(word) + "}}";
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
				var tex = "\\underbrace{\\begin{aligned} \\text{out}_{\\text{" + attLabel("bank") + "}} &= " + firstTerms.join(" + ") + " & \\\\ & = \\underbrace{" + arithmetic + "}_{\\text{" + (DE ? "Aufmerksamkeitsgewichte mal die Vektoren der sichtbaren Tokens" : "attention weights times the visible token vectors") + "}} = \\underbrace{" + outTex + "}_{\\text{" + (DE ? "der neue Vektor" : "the new vector") + "}} \\end{aligned}}_{\\text{" + (DE ? "was Bank aus dem Kontext mitnimmt" : "what bank takes from the context") + "}}";
				attSum.setAttribute("data-tex", tex);
				attSum.removeAttribute("data-tex-rendered");
				if (TM.typesetMath) TM.typesetMath(attSum.parentNode);
			}
			animateAttTo(ex.shift);
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
				var attPane = document.getElementById("step-attention");
				var attBounds = attPane ? attPane.getBoundingClientRect() : null;
				var attVisible = !!(attBounds && attBounds.bottom > 0 && attBounds.top < window.innerHeight);
				if (!attVisible) {
					var activeAtt = attChips.filter(function (c) { return c.classList.contains("is-on"); })[0] || attChips[0];
					var maxSent = 0, maxOut = 0, maxSum = 0;
					window.__tmHeightReserving = true;
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
					window.__tmHeightReserving = false;
					setMin("#iatt-sentence", maxSent);
					setMin("#iatt-out", maxOut);
					setMin("#iatt-sum", maxSum);
				}
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
		if (!line || !TM.numberLine) return;
		var c = TM.colors();
		var labels = de ? {
			freezing: "Gefrierpunkt", cold: "Kalt", lukewarm: "Lauwarm", warm: "Warm", hot: "Heiß"
		} : {
			freezing: "Freezing", cold: "Cold", lukewarm: "Lukewarm", warm: "Warm", hot: "Hot"
		};
		var pointDefs = [
			{ key: "freezing", value: -30, label: labels.freezing, color: c.sky },
			{ key: "cold", value: 5, label: labels.cold, color: c.blue },
			{ key: "lukewarm", value: 30, label: labels.lukewarm, color: c.green },
			{ key: "warm", value: 55, label: labels.warm, color: c.lime },
			{ key: "hot", value: 100, label: labels.hot, color: c.gold }
		];
		var lineApi = TM.numberLine(line, {
			min: -40, max: 110,
			points: pointDefs.map(function (p) { return { value: p.value, label: p.label, color: p.color }; })
		});
		var examples = [
			{ a: "cold", b: "warm" },
			{ a: "cold", b: "hot" },
			{ a: "freezing", b: "hot" },
			{ a: "freezing", b: "warm" }
		];
		var row = document.getElementById("oned-examples");
		var result = document.getElementById("oned-result");
		function byKey(key) {
			for (var i = 0; i < pointDefs.length; i++) if (pointDefs[i].key === key) return pointDefs[i];
			return pointDefs[0];
		}
		function nearest(value) {
			var best = pointDefs[0];
			for (var i = 1; i < pointDefs.length; i++) {
				if (Math.abs(pointDefs[i].value - value) < Math.abs(best.value - value)) best = pointDefs[i];
			}
			return best;
		}
		function apply(example, button) {
			var a = byKey(example.a), b = byKey(example.b);
			var avg = (a.value + b.value) / 2;
			var near = nearest(avg);
			var sym = Math.abs(avg - near.value) < 0.5 ? "=" : "≈";
			if (result) result.textContent = a.label + " + " + b.label + " " + sym + " " + avg.toFixed(1) + " → " + near.label + " (" + near.value + ")";
			if (lineApi && lineApi.setHighlight) {
				lineApi.setHighlight({ value: avg, label: near.label, color: near.color, showVector: true, vectorLabel: de ? "Ergebnisvektor" : "result vector" });
			}
			var formulaEl = document.getElementById("oned-formula");
			if (formulaEl && window.TM && TM.typesetMath) {
				var tex = "\\frac{\\underbrace{" + a.value + "}_{\\text{" + a.label + "}} + \\underbrace{" + b.value + "}_{\\text{" + b.label + "}}}{\\underbrace{2}_{\\text{" + (de ? "Anzahl" : "count") + "}}} = \\underbrace{" + avg.toFixed(1) + "}_{\\text{" + (de ? "Mittelwert" : "midpoint") + "}}";
				tex += sym === "=" ? " = \\underbrace{" + near.value + "}_{\\text{" + near.label + "}}" : " \\approx \\underbrace{" + near.value + "}_{\\text{" + near.label + "}}";
				formulaEl.setAttribute("data-tex", tex);
				formulaEl.removeAttribute("data-tex-rendered");
				TM.typesetMath(formulaEl);
			}
			if (row) row.querySelectorAll("button").forEach(function (other) {
				other.classList.toggle("is-on", other === button);
				other.setAttribute("aria-pressed", other === button ? "true" : "false");
			});
		}
		if (row) {
			examples.forEach(function (example, i) {
				var a = byKey(example.a), b = byKey(example.b);
				var button = document.createElement("button");
				button.type = "button";
				button.className = "chip" + (i === 0 ? " is-on" : "");
				button.setAttribute("aria-pressed", i === 0 ? "true" : "false");
				button.textContent = a.label + " + " + b.label;
				button.addEventListener("click", function () { apply(example, button); });
				row.appendChild(button);
				if (i === 0) apply(example, button);
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
		var terminalRevealed = false;
		function showTerminal() {
			if (terminalRevealed || !output) return;
			terminalRevealed = true;
			timers.push(setTimeout(function () {
				output.classList.add("is-visible");
			}, 180));
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
			if (output && !output.classList.contains("is-visible")) revealAll();
		}, 15000));
	})();
	</script>

	<script>
	(function () {
		"use strict";
		var host = document.getElementById("real-trajectory-3d");
		var dataEl = document.getElementById("gpt2-pca-data");
		if (!host || !dataEl || !window.Plotly) return;
		var data;
		try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
		var de = TM.lang() === "de";
		var step = 0;
		var metric = "angular";
		var loaded = false;
		var camera = null;

		function displayToken(token) { return token.replace(/^ /, "␣"); }
		function layerLabel(i) {
			if (i === 0) return de ? "Embedding + Position" : "Embedding + position";
			return "Block " + i;
		}
		function palette() {
			var c = TM.colors();
			return {
				ink: c.ink, muted: c.muted, line: c.line, lineStrong: c.lineStrong,
				paper: c.paper, dark: c.dark,
				series: [c.green, c.blue, c.gold, c.coral, c.sky]
			};
		}
		function norm3(v) {
			var n = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
			return [v[0] / n, v[1] / n, v[2] / n];
		}
		function transform(v) {
			return metric === "angular" ? norm3(v) : [v[0], v[1], v[2]];
		}
		function transformedPoints(ti) { return data.points[ti].map(transform); }
		function transformedLandmarks() {
			return (data.landmarks || []).slice(0, 5).map(function (item) {
				return { word: item.word, value: transform(item.value), p: item.p };
			});
		}
		function lastTokenPoint() {
			var pts = transformedPoints(data.tokens.length - 1);
			return pts[pts.length - 1];
		}
		function metricValue(value) {
			var last = lastTokenPoint();
			var p = transform(value);
			if (metric === "angular") {
				var dot = last[0] * p[0] + last[1] * p[1] + last[2] * p[2];
				dot = Math.max(-1, Math.min(1, dot));
				return (Math.acos(dot) * 180 / Math.PI).toFixed(0) + "°";
			}
			var dx = last[0] - p[0], dy = last[1] - p[1], dz = last[2] - p[2];
			return "d " + Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(2);
		}
		function sphereTrace(c) {
			var n = 32, x = [], y = [], z = [];
			for (var i = 0; i <= n; i++) {
				var theta = i * Math.PI / n;
				var xr = [], yr = [], zr = [];
				for (var j = 0; j <= n; j++) {
					var phi = j * 2 * Math.PI / n;
					xr.push(Math.sin(theta) * Math.cos(phi));
					yr.push(Math.sin(theta) * Math.sin(phi));
					zr.push(Math.cos(theta));
				}
				x.push(xr); y.push(yr); z.push(zr);
			}
			return {
				type: "surface", x: x, y: y, z: z,
				opacity: 0.06,
				colorscale: [[0, c.blue], [1, c.sky]],
				showscale: false, hoverinfo: "skip", name: "unit sphere",
				lighting: { ambient: 1, diffuse: 0.15, specular: 0.05 }
			};
		}
		function sceneLayout(c) {
			var angular = metric === "angular";
			function axis(name) {
				return {
					title: { text: name, font: { size: 10, color: c.ink } },
					color: c.muted, gridcolor: c.line, zerolinecolor: c.line,
					showbackground: false, tickfont: { size: 9, color: c.muted }
				};
			}
			return {
				bgcolor: "rgba(0,0,0,0)",
				aspectmode: "cube",
				xaxis: axis(angular ? (de ? "Richtung 1" : "direction 1") : "PC 1"),
				yaxis: axis(angular ? (de ? "Richtung 2" : "direction 2") : "PC 2"),
				zaxis: axis(angular ? (de ? "Richtung 3" : "direction 3") : "PC 3"),
				camera: camera || { eye: { x: 1.55, y: 1.35, z: 1.2 } },
				dragmode: "orbit"
			};
		}
		function draw() {
			if (!loaded) return;
			var c = palette();
			var traces = [];
			if (metric === "angular") traces.push(sphereTrace(c));
			var showChoice = step >= data.layers.length - 1;
			var landmarks = showChoice ? transformedLandmarks() : [];
			if (landmarks.length) {
				traces.push({
					type: "scatter3d", mode: "markers+text",
					x: landmarks.map(function (l) { return l.value[0]; }),
					y: landmarks.map(function (l) { return l.value[1]; }),
					z: landmarks.map(function (l) { return l.value[2]; }),
					text: landmarks.map(function (l) { return displayToken(l.word); }),
					textposition: "top center",
					textfont: { size: 10, color: c.muted },
					marker: {
						size: landmarks.map(function (l) { return l.word === data.chosen ? 10 : 6; }),
						symbol: "diamond",
						color: landmarks.map(function (l) { return l.word === data.chosen ? c.green : "rgba(100,116,139,.68)"; }),
						line: { width: 1, color: c.ink }
					},
					name: de ? "Kandidaten" : "Candidates",
					customdata: landmarks.map(function (l) { return (l.p * 100).toFixed(2); }),
					hovertemplate: "%{text}<br>%{customdata}%<extra></extra>"
				});
			}
			data.tokens.forEach(function (token, ti) {
				var pts = transformedPoints(ti);
				var last = Math.min(step, pts.length - 1);
				var shown = pts.slice(0, last + 1);
				var color = c.series[ti % c.series.length];
				var label = displayToken(token) + " (" + (ti + 1) + ")";
				traces.push({
					type: "scatter3d", mode: "lines+markers+text",
					x: shown.map(function (p) { return p[0]; }),
					y: shown.map(function (p) { return p[1]; }),
					z: shown.map(function (p) { return p[2]; }),
					name: label,
					line: { width: 4, color: color },
					marker: {
						size: shown.map(function (_, i) { return i === last ? 6 : 3; }),
						color: color,
						opacity: 0.78,
						line: { width: 0 }
					},
					text: shown.map(function (_, i) { return i === last ? displayToken(token) : ""; }),
					textposition: "top center",
					textfont: { size: 10, color: color },
					hovertemplate: label + "<br>%{text}<extra></extra>"
				});
			});
			if (showChoice && data.chosen && landmarks.length) {
				var chosen = landmarks.find(function (l) { return l.word === data.chosen; });
				var lastPts = transformedPoints(data.tokens.length - 1);
				var last = lastPts[lastPts.length - 1];
				if (chosen && last) {
					traces.push({
						type: "scatter3d", mode: "lines",
						x: [last[0], chosen.value[0]],
						y: [last[1], chosen.value[1]],
						z: [last[2], chosen.value[2]],
						line: { width: 2, color: c.green, dash: "dash" },
						showlegend: false, hoverinfo: "skip"
					});
				}
			}
			var layout = {
				paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
				margin: { l: 0, r: 0, t: 28, b: 28 },
				showlegend: true,
				legend: { orientation: "h", x: 0, y: -0.04, font: { size: 10, color: c.ink }, bgcolor: "rgba(0,0,0,0)" },
				font: { family: "Barlow, system-ui, sans-serif", color: c.ink },
				title: {
					text: metric === "angular"
						? (de ? "Einheitskugel / Winkel" : "Unit sphere / angle")
						: (de ? "PCA-Raum" : "PCA space"),
					font: { size: 12, color: c.ink }, x: 0.5, y: 0.98
				},
				scene: sceneLayout(c)
			};
			var config = { displayModeBar: false, responsive: true };
			if (!host._plotlyDrawn) {
				var p = Plotly.newPlot(host, traces, layout, config);
				host._plotlyDrawn = true;
				if (p && p.then) p.then(function () { attachCamera(); clearLoading(); });
				else { attachCamera(); clearLoading(); }
			} else {
				Plotly.react(host, traces, layout, config);
				clearLoading();
			}
		}
		function attachCamera() {
			if (host._cameraBound || !host.on) return;
			host._cameraBound = true;
			host.on("plotly_relayout", function (ev) {
				if (ev && ev["scene.camera"]) camera = ev["scene.camera"];
			});
		}
		function captureCamera() {
			if (host.layout && host.layout.scene && host.layout.scene.camera) camera = host.layout.scene.camera;
		}
		function clearLoading() {
			var loading = host.querySelector(".traj-loading");
			if (loading) loading.remove();
		}
		function renderCandidates() {
			var el = document.getElementById("traj-candidates");
			if (!el) return;
			var show = step >= data.layers.length - 1;
			el.classList.toggle("is-visible", show);
			var lmMap = {};
			(data.landmarks || []).forEach(function (l) { lmMap[l.word] = l; });
			el.innerHTML = (data.top || []).slice(0, 5).map(function (item) {
				var chosen = item.token === data.chosen;
				var lm = lmMap[item.token];
				var mv = lm ? metricValue(lm.value) : "";
				return '<span class="traj-candidate' + (chosen ? " is-chosen" : "") + '">' +
					'<b>' + displayToken(item.token) + '</b>' +
					'<span class="pct">' + (item.p * 100).toFixed(2) + ' %</span>' +
					(mv ? '<span class="traj-candidate-metric">' + mv + '</span>' : '') +
					(chosen ? '<span>' + (de ? "gewählt" : "chosen") + '</span>' : '') +
					'</span>';
			}).join("");
		}
		function updateStepLabel() {
			var el = document.getElementById("traj-layer-label");
			if (el) el.textContent = step === 0 ? "Embedding" : (de ? "Schicht " : "Layer ") + step + " / " + (data.layers.length - 1);
			var nextBtn = document.getElementById("traj-next-layer");
			if (nextBtn) {
				var atEnd = step >= data.layers.length - 1;
				nextBtn.textContent = atEnd
					? (de ? "Zum Anfang ↺" : "To the beginning ↺")
					: (de ? "Nächste Schicht →" : "Next layer →");
				nextBtn.disabled = false;
			}
		}
		function start() {
			if (loaded) return;
			loaded = true;
			draw();
			renderCandidates();
			updateStepLabel();
		}
		var slider = document.getElementById("traj-layer-slider");
		var nextBtn = document.getElementById("traj-next-layer");
		var metricEl = document.getElementById("traj-metric");
		if (slider) slider.addEventListener("input", function () {
			step = parseInt(slider.value, 10) || 0;
			updateStepLabel();
			renderCandidates();
			if (loaded) draw();
		});
		if (nextBtn) nextBtn.addEventListener("click", function () {
			step = step >= data.layers.length - 1 ? 0 : step + 1;
			if (slider) slider.value = String(step);
			updateStepLabel();
			renderCandidates();
			if (loaded) draw();
		});
		if (metricEl) metricEl.addEventListener("click", function (ev) {
			var btn = ev.target.closest("[data-metric]");
			if (!btn) return;
			metric = btn.getAttribute("data-metric") === "angular" ? "angular" : "euclidean";
			metricEl.querySelectorAll("button").forEach(function (b) {
				var on = b === btn;
				b.classList.toggle("is-on", on);
				b.setAttribute("aria-pressed", on ? "true" : "false");
			});
			captureCamera();
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
		window.addEventListener("resize", function () { if (loaded) Plotly.Plots.resize(host); });
		window.addEventListener("tm:theme", function () { if (loaded) { captureCamera(); draw(); } });
	})();
	</script>
</body>
</html>
