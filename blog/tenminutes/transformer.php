<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="A ten-minute interactive tour of the transformer block: tokens, positions, attention, feed-forward, residual stream, logits, and sampling.">
	<meta name="theme-color" content="#ffffff">
	<title>The Whole Machine | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
	<link rel="stylesheet" href="../Temml-Local.min.css">
	<link rel="stylesheet" href="assets/full/demos.css">
	<link rel="stylesheet" href="../transformer_steps.css?v=<?php echo (int) @filemtime(__DIR__ . '/../transformer_steps.css'); ?>">
</head>
<body data-lesson="transformer" data-page="lesson" data-no-full-article>
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>The whole <em>machine.</em></h1>
					<p class="hero-deck">
						Six ideas snap together: <strong>tokens</strong> become vectors,
						<strong>positions</strong> give them order, <strong>attention</strong> lets them
						exchange information, <strong>feed-forward</strong> transforms them,
						<strong>residuals</strong> carry the past forward, and <strong>logits</strong>
						turn the result into a bet on the next token. Stack the block and you have the
						transformer. See the token stream, then follow the real model from embeddings to
						the next-token distribution.
					</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<div class="prose chapter-note">
						<p>
							This chapter is mathematically heavy today: matrices, dot products,
							softmax, residual vectors, logits, cross-entropy and Adam. The demos are
							there so you can see the equations and the numbers move together. Read the
							prose for the route, and use the live panels when you want the detail.
						</p>
						<p>
							This is the hardest chapter in the calendar. The following days become
							lighter again.
						</p>
						<p>
							This model is browser-sized on purpose. A browser is far too weak to train a
							good language model; the point is to inspect and follow every calculation,
							step by step. A model worth using needs terabytes of data and compute.
							<strong>Play with the sliders:</strong> moving the width, the heads, the depth
							and the context is part of understanding what the architecture does.
						</p>
					</div>

					<section class="section-block" id="realmodel">
						<div class="section-kicker"><span class="sk-num">01</span> The real model</div>
						<h2 class="section-title">Train a tiny transformer.</h2>
<div id="transformer-train-card">
<div class="transformer-train-controls">
<div class="transformer-train-actions">
<button class="btn train-btn" onclick="train_transformer()" type="button">Train Model</button>
</div>
<label class="transformer-train-field">
<span class="transformer-train-label">Epochs</span>
<input id="train-epochs" min="1" step="1" type="number" value="200"/>
</label>
<label class="transformer-train-field">
<span class="transformer-train-label">Learning Rate</span>
<input id="train-lr" min="0" step="0.01" type="number" value="0.01"/>
</label>
<div class="transformer-train-field">
<span class="transformer-train-label">Optimizer</span>
<div aria-label="Optimizer" class="transformer-opt-group" id="train-optimizer" role="radiogroup">
<label class="transformer-opt">
<input checked="" name="train-optimizer-choice" type="radio" value="adam"/>
<span class="glossary-term" data-tooltip-id="tt-train-adam">Adam<span class="glossary-tooltip" data-tooltip-id="tt-train-adam">An adaptive optimizer that gives every parameter its own learning rate based on the history of its gradients.</span></span>
</label>
<label class="transformer-opt">
<input name="train-optimizer-choice" type="radio" value="sgd"/>
<span class="glossary-term" data-tooltip-id="tt-train-sgd">SGD<span class="glossary-tooltip" data-tooltip-id="tt-train-sgd">Stochastic Gradient Descent, gradient descent performed on small random batches of data rather than the full dataset.</span></span>
</label>
<label class="transformer-opt">
<input name="train-optimizer-choice" type="radio" value="rmsprop"/>
<span class="glossary-term" data-tooltip-id="tt-train-rmsprop">RMSProp<span class="glossary-tooltip" data-tooltip-id="tt-train-rmsprop">Root Mean Square Propagation, adapts the learning rate per parameter using a moving average of recent squared gradients, which keeps updates stable even when gradients vary wildly in magnitude.</span></span>
</label>
</div>
</div>

</div>
<div class="transformer-train-status" id="training-status"></div>
<div id="training-loss-plot"></div>
</div>
<div id="transformer_config">
<div style="margin-bottom: 15px;">
<label style="font-weight: bold;">Model Dimension ($d_{\text{model}}$): </label>
<span id="dim-val" style="font-weight: bold; color: #3b82f6;">3</span>
<p style="font-size: 0.75rem; color: #64748b; margin: 2px 0;">
<b>Dependency:</b> Must be a multiple of Heads.<br/>
<b>Reason:</b> Each head needs an equal integer-sized slice ($d_k = \frac{d_{\text{model}}}{h}$) of the vector to perform dot products.
        </p>
<input id="transformer-dimension-model" max="16" min="2" oninput="syncTransformerSettings('dim')" step="1" style="width: 100%;" type="range" value="3"/>
</div>
<div style="margin-bottom: 15px;">
<label style="font-weight: bold;">Attention Heads ($h$): </label>
<span id="heads-val" style="font-weight: bold; color: #3b82f6;">3</span>
<p style="font-size: 0.75rem; color: #64748b; margin: 2px 0;">
<b>Dependency:</b> $d_{\text{model}}$ must be a multiple of $h$.<br/>
<b>Reason:</b> Multi-head attention splits the main vector into $h$ parallel “viewpoints.” If $d_{\text{model}}$ is 4 and $h$ is 2, each head looks at 2 dimensions.
        </p>
<input id="transformer-heads" max="8" min="1" oninput="syncTransformerSettings('heads')" style="width: 100%;" type="range" value="3"/>
</div>
<div style="margin-bottom: 15px;">
<label style="font-weight: bold;">Network Depth ($N$ layers): </label>
<span id="depth-val" style="font-weight: bold; color: #3b82f6;">2</span>
<p style="font-size: 0.8rem; color: #64748b; margin: 4px 0;">How many transformer blocks are stacked. More layers allow more abstract reasoning.</p>
<input id="transformer-depth" max="12" min="1" oninput="document.getElementById('depth-val').innerText = this.value; debounced_run_transformer_demo();" style="width: 100%;" type="range" value="2"/>
</div>
<div style="margin-bottom: 15px;">
<label style="font-weight: bold;">Context Size: </label>
<span id="context-val" style="font-weight: bold; color: #3b82f6;">32</span>
<p style="font-size: 0.75rem; color: #64748b; margin: 2px 0;">
<b>Effect:</b> Sets the maximum number of tokens the model can “see” at once during training and inference.<br/>
<b>Reason:</b> A larger context window lets the model capture longer-range dependencies, but the attention score matrix has size $\text{Context}^2$, so a full forward pass costs quadratically in context length. A KV-Cache avoids recomputing past keys and values during generation — it lowers per-step work and trades it for linear memory — but it does not make attention sub-quadratic.
	    </p>
<input id="transformer-context-size" max="256" min="2" oninput="document.getElementById('context-val').innerText = this.value; debounced_run_transformer_demo();" step="1" style="width: 100%;" type="range" value="32"/>
</div>
<div style="display: none">
<label style="font-weight: bold;">Tokenizer: </label>
<select id="transformer-tokenizer-type" onchange="debounced_run_transformer_demo()" style="padding: 4px; border-radius: 4px; border: 1px solid #cbd5e1;">
<option selected="" value="regex">Words (Non-Alphanumeric Split)</option>
<option value="bpe">Byte-Pair Encoding (BPE)</option>
</select>
</div>
<div id="nr_params" style="display: none"></div>
<div id="param-breakdown-toggle" style="display: none; margin-top: 8px;">
<button id="param-breakdown-btn" onclick="toggleParamBreakdown()" style="background: none; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 16px;
		       cursor: pointer; font-size: 0.85rem; color: #3b82f6; font-weight: 600;
		       display: flex; align-items: center; gap: 6px; transition: all 0.15s;">
<span id="param-breakdown-arrow" style="transition: transform 0.2s;">▶</span>
		Show Parameter Breakdown
	    </button>
</div>
<div id="param-breakdown-chart" style="display: none; margin-top: 10px; padding: 15px;
	     background: var(--mn-bg-subtle, #f8fafc); border: 1px solid #e2e8f0; border-radius: 10px;">
<div id="param-breakdown-plotly" style="width: 100%; height: 350px;"></div>
<div id="param-breakdown-table" style="margin-top: 10px; font-size: 0.82rem; overflow-x: auto;"></div>
</div>
</div>
<div class="transformer_corpus">
<label style="font-weight: bold; display: block; margin-bottom: 8px;">Training Data (Corpus):</label>
    <p style="font-size: 0.78rem; color: #64748b; margin: 0 0 8px;">The token <code>&lt;|endoftext|&gt;</code> is appended automatically.</p>
<textarea id="transformer-training-data" oninput="debounced_run_transformer_demo('transformer-training-data')" style="width: 90%; height: 60px; font-family: 'Courier New', monospace; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; background: var(--mn-surface, white); color: var(--mn-text, #1e293b);"><?php echo function_exists("tm_lang") && tm_lang() === "de" ? "der könig herrscht über das land und die königin herrscht über das meer" : "the king rules the land and the queen rules the sea"; ?></textarea>
</div>
<style>
#transformer-train-card {
	background: var(--mn-emerald-light, #f0fdf4);
	border: 1px solid var(--mn-emerald, #10b981);
	border-radius: 10px;
	margin: 15px 0;
	padding: 14px 16px;
}
.transformer-train-controls {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-end;
	gap: 14px 22px;
}
.transformer-train-field {
	display: flex;
	flex-direction: column;
	gap: 5px;
}
.transformer-train-field > .transformer-train-label {
	font-weight: 600;
	font-size: 0.8rem;
	color: var(--mn-text-secondary, #475569);
}
.transformer-train-field input[type="number"] {
	width: 72px;
	padding: 5px 8px;
	font-size: 0.9rem;
	background: var(--mn-surface, #fff);
	color: var(--mn-text, #1e293b);
	border: 1px solid var(--mn-border, #cbd5e1);
	border-radius: 6px;
}
.transformer-train-field input[type="number"]:focus {
	outline: 2px solid var(--mn-emerald, #10b981);
	outline-offset: 1px;
}
.transformer-opt-group {
	display: flex;
	gap: 2px;
	padding: 3px;
	background: var(--mn-surface, #fff);
	border: 1px solid var(--mn-border, #cbd5e1);
	border-radius: 8px;
}
.transformer-opt {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 4px 10px;
	border-radius: 6px;
	font-size: 0.85rem;
	font-weight: 500;
	color: var(--mn-text-secondary, #475569);
	cursor: pointer;
	white-space: nowrap;
	transition: background-color 0.15s ease, color 0.15s ease;
}
.transformer-opt:hover {
	background: var(--mn-bg-subtle, #f1f5f9);
}
.transformer-opt input[type="radio"] {
	margin: 0;
	accent-color: var(--mn-emerald, #10b981);
	cursor: pointer;
}
.transformer-opt:has(input:checked) {
	background: var(--mn-emerald-light, #d1fae5);
	color: var(--mn-text, #0f172a);
}
.transformer-opt input:checked + .glossary-term {
	font-weight: 600;
}
.transformer-opt .glossary-term {
	background: transparent;
	padding: 0;
}
.transformer-train-actions {
	display: flex;
	gap: 8px;
	margin-left: auto;
}
.transformer-train-status {
	min-height: 20px;
	margin-top: 10px;
	font-size: 0.85rem;
	color: var(--mn-emerald, #047857);
}
#training-loss-plot {
	width: 100%;
	height: 200px;
	margin-top: 10px;
	border: 1px solid var(--mn-border, #e2e8f0);
	border-radius: 8px;
	background: var(--mn-surface, #fff);
	user-select: none;
	-webkit-user-select: none;
	-webkit-user-drag: none;
	touch-action: pan-y;
}
#training-loss-plot .nsewdrag {
	cursor: default;
}
@media (max-width: 640px) {
	.transformer-train-actions {
		margin-left: 0;
		width: 100%;
	}
}
</style>

						<div class="prose">
							<p>
								The demo above is a word-level decoder: token and position
								embeddings, one or more multi-head attention blocks, a feed-forward
								network, a residual stream, layer normalisation, an unembedding, and a
								cross-entropy loss. TensorFlow.js computes the gradients, so the Train
								button really updates the weights. The model is tiny, but the operations
								and the formulas are the same as in a large transformer.
							</p>
							<p>
								Change the architecture, the corpus, or the optimizer above, then train.
								The loss, the attention heads, and the per-layer panels update live.
							</p>
						</div>
					</section>
					<section class="section-block" id="six-steps">
						<div class="section-kicker"><span class="sk-num">02</span> The six steps</div>
						<h2 class="section-title">The whole route, visible at once.</h2>
						<div class="prose">
							<p>
								These are the six steps from the intuition chapter, now driven by the real
								numbers of the tiny model above. Read the heading, then look at the picture.
								The layer cards below repeat the attention, feed-forward and residual steps
								for every layer, with the full formulas one level deeper.
							</p>
						</div>
<div class="demo-loader-status" id="demo-loader-status">
<div class="demo-loader-head">
<span class="demo-loader-title" id="demo-loader-title">The interactive demos load when you reach this section.</span>
<span class="demo-loader-count" id="demo-loader-count"></span>
</div>
<div class="demo-loader-track" id="demo-loader-track" hidden><div class="demo-loader-fill" id="demo-loader-fill"></div></div>
<div class="demo-loader-meta" id="demo-loader-meta" hidden>
<span id="demo-loader-current"></span>
<span id="demo-loader-percent"></span>
</div>
</div>
						<div class="tm-step-grid lg-widescroll" id="transformer-step-visuals">
							<section class="tm-step">
				<div class="tm-step-head">
					<h3>1 · Tokenize</h3>
					<button class="tm-step-toggle" type="button" aria-expanded="true" data-no-height-test aria-label="Collapse step">−</button>
				</div>
				<p>Text becomes tokens. The order is the sentence; the number under each token is its vocabulary index in this demo.</p>
				<div class="tm-step-body"><canvas class="tm-step-canvas" id="tm-step-tokenize" aria-label="The token stream in reading order"></canvas>
				<p class="tm-step-more">The tokenizer is a separate program trained before the model. It decides which strings become one id; the model itself only sees numbers.</p>
				<div class="tm-step-formula" data-tex="T = [t_0,\, t_1,\, \dots,\, t_{n-1}]"></div>
				<details class="tm-step-detail">
					<summary>Tokenizer in detail</summary>
					<div class="tm-step-detail-body">
						<p>Tokens become integers, integers become vectors, and position tags each vector with its place in the sequence. Change the corpus or the tokenizer and the token stream, embedding map, and positional waves update.</p>
						<div class="viz-container" id="transformer-viz-bpe"></div>
					</div>
				</details></div>
			</section>
							<section class="tm-step">
				<div class="tm-step-head">
					<h3>2 · Embed</h3>
					<button class="tm-step-toggle" type="button" aria-expanded="true" data-no-height-test aria-label="Collapse step">−</button>
				</div>
				<p>Each token becomes a point in the learned embedding space. The line follows the sentence; the faint cloud is the rest of the vocabulary.</p>
				<div class="tm-step-body"><canvas class="tm-step-canvas" id="tm-step-embed" aria-label="The embedding space with the sentence path"></canvas>
				<div class="tm-step-modes" data-step-modes="embed"></div>
				<p class="tm-step-more">The embedding table is a learned matrix; each row is a token's starting vector. The positions are added in the next step.</p>
				<div class="tm-step-formula" data-tex="h_0 = E[t] + p_i"></div>
				<details class="tm-step-detail">
					<summary>Embedding in detail</summary>
					<div class="tm-step-detail-body">
						<p>The embedding table maps each token id to a vector. The position is added after this lookup; the vector math below works on the current vocabulary.</p>
						<div style="background: var(--mn-bg-subtle, #f8fafc); padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
<div id="transformer-plotly-space" style="width: 100%; height: 500px; background: var(--mn-surface, white); border-radius: 8px;"></div>
<div id="transformer-viz-embeddings" style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px;"></div>
<div class="embedding-table-container" id="tled-editor-container" style="margin-top: 20px; max-height: 420px; overflow-y: auto;"></div>
<p style="font-size: 0.9rem; color: #64748b; margin-bottom: 15px;">Perform math on the current vocabulary tokens to see how concepts align in the dynamic vector space.</p>
<input id="transformer-vector-math-input" oninput="debounced_vector_math()" onkeydown="if(event.key==='Enter'){event.preventDefault(); immediate_vector_math();}" placeholder="e.g., king - man + woman" style="width: 100%; padding: 10px; font-size: 1.1rem; border-radius: 8px; border: 1px solid #cbd5e1; background: var(--mn-surface, white); color: var(--mn-text, #1e293b);" type="text"/>
<div id="transformer-vector-math-result" style="margin-top: 15px; padding: 15px; background: var(--mn-surface, white); border-radius: 8px; border: 1px dashed #cbd5e1; overflow-x: auto;">
<em style="color: #94a3b8;">Enter an equation and press Enter...</em>
</div>
</div>
					</div>
				</details></div>
			</section>
							<section class="tm-step">
				<div class="tm-step-head">
					<h3>3 · Position</h3>
					<button class="tm-step-toggle" type="button" aria-expanded="true" data-no-height-test aria-label="Collapse step">−</button>
				</div>
				<p>The same token at a different slot gets a different fingerprint. Each row is a position; the waves are the sinusoidal encoding.</p>
				<div class="tm-step-body"><canvas class="tm-step-canvas" id="tm-step-position" aria-label="A heatmap of positional encodings"></canvas>
				<div class="tm-step-modes" data-step-modes="position"></div>
				<p class="tm-step-more">Without a position signal, the same tokens in a different order would look identical. The waves give every slot a unique fingerprint.</p>
				<div class="tm-step-formula" data-tex="PE_{(i,2k)} = \sin\left(\frac{i}{10000^{2k/d}}\right),\quad PE_{(i,2k+1)} = \cos\left(\frac{i}{10000^{2k/d}}\right)"></div>
				<details class="tm-step-detail">
					<summary>Positional encoding in detail</summary>
					<div class="tm-step-detail-body">
						<p>The heatmap above shows the pattern as a flat slice. The plots below show the same sinusoidal encoding as waves and as one vector per position.</p>
						<div id="transformer-pe-wave-plot" style="width: 100%; height: 300px; margin-top: 20px; background: var(--mn-surface, white); border-radius: 12px; border: 1px solid #e2e8f0;"></div>
<div id="transformer-pe-shift-plot" style="width: 100%; height: 600px; margin-top: 20px; background: var(--mn-surface, white); border-radius: 12px; border: 1px solid #e2e8f0;"></div>
<div id="transformer-pe-integration-results" style="margin-top: 20px;"></div>
						<div class="md" id="ifscalfactornotone" style="display:none">In this example, we're using a scaling factor of <span id="posEmbedScaleFactor">0.1</span> because of the low dimensionality of our space.</div>
					</div>
				</details></div>
			</section>
							<section class="tm-step">
				<div class="tm-step-head">
					<h3>4 · Attend</h3>
					<button class="tm-step-toggle" type="button" aria-expanded="true" data-no-height-test aria-label="Collapse step">−</button>
				</div>
				<p>Attention lets every token read the others. Each arc is a weighted connection; a thicker line carries more information.</p>
				<div class="tm-step-body"><canvas class="tm-step-canvas" id="tm-step-attend" aria-label="Attention arcs between tokens"></canvas>
				<div class="tm-step-modes" data-step-modes="attend"></div>
				<p class="tm-step-more">Attention is the only step where information moves between tokens. Everything else in the block works on one token at a time.</p>
				<div class="tm-step-formula" data-tex="\operatorname{Attention}(Q,K,V) = \operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V"></div>
				<details class="tm-step-detail"><summary>Attention in detail</summary><div class="tm-step-detail-body"><p>Attention is the only operation in the block that moves information between tokens. Each token projects its vector into a query, a key and a value. The dot product of a query and a key is a score; softmax turns the row of scores into weights that sum to one; the output is the weighted sum of the value vectors.</p><p>A layer runs several heads in parallel, each in its own subspace. Every head has one unit of attention to spend: if it puts 80% on one word, only 20% remains for the others. The layer cards below show the real weights and the attention web for each head.</p></div></details></div>
			</section>
							<section class="tm-step">
				<div class="tm-step-head">
					<h3>5 · Feed-forward</h3>
					<button class="tm-step-toggle" type="button" aria-expanded="true" data-no-height-test aria-label="Collapse step">−</button>
				</div>
				<p>The FFN transforms one token at a time. The heatmap shows the hidden activations for every token: the pattern the layer writes back.</p>
				<div class="tm-step-body"><canvas class="tm-step-canvas" id="tm-step-ffn" aria-label="Feed-forward hidden activations"></canvas>
				<p class="tm-step-more">The FFN expands the vector, applies a nonlinearity, and contracts it. It cannot see other positions; attention has already copied their information in.</p>
				<div class="tm-step-formula" data-tex="\operatorname{FFN}(x) = W_2\,\operatorname{GELU}(W_1x+b_1)+b_2"></div>
				<details class="tm-step-detail"><summary>Feed-forward in detail</summary><div class="tm-step-detail-body"><p>The FFN works on one token at a time. It expands the vector to a wider hidden layer, applies GELU, and contracts it back. Attention decides what to look at; the FFN decides what to do with it.</p><p>Most of the model's parameters and much of its factual recall live in these matrices, but knowledge is distributed. The layer cards below show the real expansion, activation and compression for every layer.</p></div></details></div>
			</section>
							<section class="tm-step">
				<div class="tm-step-head">
					<h3>6 · Residual</h3>
					<button class="tm-step-toggle" type="button" aria-expanded="true" data-no-height-test aria-label="Collapse step">−</button>
				</div>
				<p>Every layer adds an attention update and an FFN update to the running stream. The heatmap shows how much each layer writes for each token.</p>
				<div class="tm-step-body"><canvas class="tm-step-canvas" id="tm-step-residual" aria-label="Residual stream updates per layer and token"></canvas>
				<p class="tm-step-more">The residual stream is the running vector. Every layer reads it and writes an update; nothing is overwritten, so late layers can still use the original token.</p>
				<div class="tm-step-formula" data-tex="x_{n+1} = x_n + \operatorname{layer}_{n+1}(x_n)"></div>
				<details class="tm-step-detail"><summary>Residual stream in detail</summary><div class="tm-step-detail-body"><p>Each sublayer computes an update and adds it to the running vector: x_{n+1} = x_n + layer_{n+1}(x_n). Nothing is overwritten, so the original token stays available and gradients have a short path back.</p><p>The per-layer residual preview above shows how much attention and the FFN write for each token. The last layer's level 2 also shows the final h_last vector.</p></div></details></div>
			</section>
							<section class="tm-step">
				<div class="tm-step-head">
					<h3>7 · Unembed</h3>
					<button class="tm-step-toggle" type="button" aria-expanded="true" data-no-height-test aria-label="Collapse step">−</button>
				</div>
				<p>The final vector is compared with every vocabulary embedding. The bars are the model's shortlist for the next token.</p>
				<div class="tm-step-body"><canvas class="tm-step-canvas" id="tm-step-unembed" aria-label="Top next-token logits"></canvas>
				<p class="tm-step-more">The final vector is compared with every vocabulary embedding. Softmax turns the scores into probabilities; a decoding rule chooses one token.</p>
				<div class="tm-step-formula" data-tex="p = \operatorname{softmax}(h_L W_U^\top)"></div>
				<div class="tm-unembed-controls">
					<label class="tm-unembed-temp">Temperature <input type="range" id="tm-unembed-temp" min="0.1" max="2" step="0.1" value="1"><output id="tm-unembed-temp-out">1.0</output></label>
					<div class="tm-unembed-tokens" id="tm-unembed-tokens" role="group" aria-label="Append a token"></div>
				</div>
				<div class="tm-unembed-topk-row">
					<label class="tm-unembed-topk">Top-k <input type="range" id="tm-unembed-topk" min="1" max="20" step="1" value="5"><output id="tm-unembed-topk-out">5</output></label>
					<button type="button" class="tm-unembed-sample" id="tm-unembed-sample">Sample</button>
					<span class="tm-unembed-sample-out" id="tm-unembed-sample-out"></span>
				</div>
				<div class="tm-unembed-sentence-wrap">
					<span class="tm-unembed-sentence-label">Tokenized input</span>
					<div class="tm-unembed-sentence" id="tm-unembed-sentence"></div>
				</div>
				<details class="tm-step-detail"><summary>From vectors to words</summary><div class="tm-step-detail-body"><p>The final vector is multiplied by the unembedding matrix, producing one logit per vocabulary entry. Softmax turns the logits into probabilities; temperature sharpens or flattens the distribution.</p><p>The output section below lets you change the temperature and click tokens to append them. The layer cards show the logit lens for every layer.</p></div></details></div>
			</section>
						</div>
						<div id="inputlab" hidden></div>
					</section>

					<section class="section-block" id="before">
						<div class="section-kicker"><span class="sk-num">03</span> Before 2017</div>
						<h2 class="section-title">The problem was the queue.</h2>
						<div class="prose">
							<p>
								Attention, context, position, and fact lookup supplied the parts. Now they assemble
								into one block. Recurrent networks read a sequence one step at a time. Information about the
								beginning had to survive a long chain of updates before it could influence the
								end. Convolutions could parallelize, but the path between distant tokens still
								grew with distance.
							</p>
							<p>
								The transformer made that path short: in one attention step, every token can
								read every other token, or every earlier token, in a decoder. The price is
								<strong>quadratic work</strong> (each token compares with each other token) but the comparison is a matrix multiplication, and matrix multiplications fill
								a GPU. That trade is what made scale practical.
							</p>
						</div>
						<div class="pullquote">
							Attention is not a metaphor for looking. It is a learned, differentiable routing
							operation: a query asks, keys answer, values travel.
							<cite>The core of the architecture</cite>
						</div>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">The transformer did not merely make language models deeper. It made them parallel.</p>
							<p class="aha-sub">Every token can look at every other token in the same step. That one change turned a sequential bottleneck into a matrix multiplication, and made scale practical.</p>
						</div>
					</section>

					<section class="section-block" id="pipeline">
						<div class="section-kicker"><span class="sk-num">04</span> The pipeline</div>
						<h2 class="section-title">From text to a distribution.</h2>
						<div class="prose">
							<p>
								Here is the whole machine as a route. Start with “the cat sat”, step through
								the block, predict the next token, then append it and run the loop again. The
								block in the middle repeats <em>N</em> times; everything else happens once.
							</p>
							<p>
								Training and generation share this route. In training, the model is shown the
								next token and must make it more likely. In generation, it chooses one token,
								appends it to the context, and starts again. <strong>The model never sees the
								sentence it is about to write</strong>: only the tokens already on the page.
							</p>
							<p>
								One detail confuses many readers: during training the model produces a
								distribution at <em>every</em> position, not only the last. The causal mask
								ensures that the prediction at position <em>i</em> sees only positions up to
								<em>i</em>, so a single forward pass supplies a training signal for every
								next-token pair in the sequence. At generation time only the last position
								matters; the earlier distributions are discarded. This is why training can use
								a whole document in parallel while generation still has to go one token at a
								time.
							</p>
						</div>

						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">It predicts locally, and can still build a world model.</p>
							<p class="aha-sub">The model has no explicit paragraph plan: it predicts one token, appends it, and predicts again. But next-token prediction can require a 								structured internal state. In the Othello (Reversi) experiment (<a href="https://arxiv.org/abs/2210.13382" rel="noopener">Li et al., 2022</a>), a transformer trained only on legal moves (with no board and no rules) spontaneously represented the board; intervening on that representation changed its next move. Coherence can therefore come from a learned world model in the residual stream, not only from a chain of surface bets. The model is still fallible, that world model is partial, and small errors can compound.</p>
						</div>

					</section>

					<section class="section-block" id="layerlens">
						<div class="section-kicker"><span class="sk-num">05</span> The layer lens</div>
						<h2 class="section-title">A word changes its meaning with depth.</h2>
						<div class="prose">
							<p>
								At the input, “bank” is already a vector. Then each block edits it. The
								residual stream: the running vector from <a href="intuition#inside">the six-step demo</a>: carries the
								old representation forward and adds a new one on
								top: <span data-tex="z = x + \operatorname{Attention}(\operatorname{Norm}(x))" data-tex-display="false"></span>, then
								<span data-tex="y = z + \operatorname{FFN}(\operatorname{Norm}(z))" data-tex-display="false"></span>. Nothing is overwritten; everything
								accumulates.
							</p>
							<p>
								A simple mental picture: context pulls the word toward one of two clusters.
								With “river” in the sentence, “bank” drifts toward the river cluster; with
								“loan”, toward finance. It never lands exactly on the cluster centre: the
								lexical word is still part of the sum. Every token in the sentence contributes
								a little, so the path is not a clean straight line. Real trajectories are
								high-dimensional and much messier; the qualitative idea, that context
								accumulates with depth, is the point.
							</p>
							<p>
								<strong>The word does not travel from layer to layer.</strong> The stream stays;
								each block writes an update into it. That is why a late layer can still recover
								the original lexical sense: nothing was replaced.
							</p>
						</div>

						</section>

					<section class="section-block" id="block">
						<div class="section-kicker"><span class="sk-num">06</span> Inside the block</div>
						<h2 class="section-title">Two sublayers, one residual stream.</h2>
						<div class="prose">
							<p>
								<strong>Attention</strong> mixes information across positions. Each token is
								projected into a <strong>query</strong>, a <strong>key</strong>, and a
								<strong>value</strong>. The query asks “what am I looking for?”, the key says
								“what do I contain?”, and the value carries the content that gets moved.
							</p>
							<p>
								The dot product of a query and a key is a similarity score. Softmax turns the
								scores into weights that sum to one, and the output is a weighted average of
								the values. The scaling factor <span data-tex="1/\sqrt{d_k}" data-tex-display="false"></span> keeps those scores from
								growing too large as the head dimension grows; without it, softmax saturates
								and the gradients shrink.
							</p>
							<p>
								<strong>Attention has no fixed grammar.</strong> It follows no hand-written tree;
								it learns which positions should exchange information. Position is handled
								before attention: the original block adds sinusoidal vectors, while modern
								blocks often rotate queries and keys by position instead (<a href="https://arxiv.org/abs/2104.09864" rel="noopener">Su et al., 2021</a>). The link between “it” and
								a noun is computed, not looked up, which is why the same head can resolve it
								differently in different sentences. Several heads run in parallel in
								lower-dimensional subspaces, so one head can track a pronoun while another
								tracks a verb or a nearby adjective.
							</p>
							<p>
								<strong>Feed-forward</strong> transforms each position independently: expand
								to a wider hidden dimension, apply a nonlinearity, contract back. Attention
								decides <em>what to look at</em>; the FFN decides <em>what to do with it</em>.
								The wide hidden layer gives the network room to combine features, and much of
								the model’s factual recall is associated with these weights, though knowledge
								is distributed, not stored in one place. The usual expansion factor is four;
								it is an empirical convention, not a law. Modern models often use gated
								variants such as SwiGLU with a different ratio, but the shape is the same:
								wide, nonlinear, then narrow again.
							</p>
							<p>
								<strong>Residual connections</strong> (<a href="https://arxiv.org/abs/1512.03385" rel="noopener">He et al., 2015</a>) give the gradient an identity path
								around each sublayer, so a deep stack can still learn. They also make the
								block additive: the branch computes an update, and the update is added to the
								running stream. Nothing is overwritten.
							</p>
							<p>
								<strong>Layer normalization</strong> (<a href="https://arxiv.org/abs/1607.06450" rel="noopener">Ba, Kiros &amp; Hinton, 2016</a>) keeps activations in a healthy range. The
								2017 block normalized after the residual addition; modern stacks usually
								normalize <em>inside</em> the branch (pre-norm), leaving the stream unbroken,
								and often replace LayerNorm with RMSNorm, which rescales by the root mean
								square without subtracting the mean. Gated feed-forward variants such as
								SwiGLU are a separate change (<a href="https://arxiv.org/abs/2002.05202" rel="noopener">Shazeer, 2020</a>). The stream stays simple; each branch
								arrives already scaled.
							</p>
							<p>
								Where do the parameters actually live? In a typical decoder, most are in the
								attention projections and the FFN matrices; the embedding and unembedding
								tables can be large, and are sometimes tied. That is why a “7B” model is not a
								container of seven billion facts. It is seven billion numbers whose joint
								action produces the behaviour, with facts spread across many of them.
							</p>
						</div>
						<div class="formula-grid">
							<div class="formula-card">
								<div class="fc-kicker">Attention · what it does</div>
								<div class="fc-formula" data-tex="\operatorname{Attention}(Q,K,V) = \operatorname{softmax}\left(\frac{QK^{\mathsf{T}}}{\sqrt{d_k}}\right)V" data-tex-display="false"></div>
								<p><b>Q</b> is what a token is looking for, <b>K</b> is what each token offers, and <b>V</b> is the content that travels. The dot product scores every pair, softmax turns the row into weights, and the output is a weighted mix of values. The <span data-tex="\sqrt{d_k}" data-tex-display="false"></span> keeps the scores from exploding as heads get wider.</p>
							</div>
							<div class="formula-card">
								<div class="fc-kicker">Residual · why depth works</div>
								<div class="fc-formula" data-tex="\begin{aligned} z &amp;= x + \operatorname{Attention}(\operatorname{Norm}(x)) \\ y &amp;= z + \operatorname{FeedForward}(\operatorname{Norm}(z)) \end{aligned}"></div>
								<p>The plus sign is the residual stream. Each sublayer computes an <b>update</b> and adds it to what is already there. The identity path carries gradients backwards and gives every layer a shared workspace. Pre-norm moves the normalization into the branch so the main stream stays clean.</p>
							</div>
							<div class="formula-card">
								<div class="fc-kicker">Feed-forward · what it computes</div>
								<div class="fc-formula" data-tex="\operatorname{FFN}(x) = W_2 \cdot \operatorname{act}(W_1 x + b_1) + b_2" data-tex-display="false"></div>
								<p>The first matrix expands the vector, the nonlinearity lets the model combine features, and the second matrix contracts it back. This is per-token computation: no information moves between positions here. Much of the model’s stored association memory lives in these weights.</p>
							</div>
						</div>
<div id="ffn-equations-container"></div>
<div id="transformer-migration-plots-container"></div>
						<div class="fieldnotes">
							<h4>Why the block works at all</h4>
							<p>The block is a division of labour. Attention supplies content-based routing; the FFN supplies per-token computation; the residual stream supplies a shared, additive workspace; normalization keeps the scale stable. The causal mask turns the same machinery into an autoregressive predictor. These pieces work because they compose, and because the whole stack is trained end-to-end on next-token prediction.</p>
						</div>
						<div class="fieldnotes">
							<h4>Decoder only, or encoder too?</h4>
							<p>BERT kept the encoder and trained bidirectionally with masked tokens; GPT kept the decoder and trained autoregressively with a causal mask. The same block, two contracts with the data.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Multi-head</b><span>Several attention heads run in parallel, each in a lower-dimensional subspace, then concatenate.</span></div>
							<div class="keypoint"><b>Causal mask</b><span>In a decoder, token i may only attend to tokens ≤ i. The future is not available.</span></div>
							<div class="keypoint"><b>Residual</b><span>The stream is a highway for information and gradients; each layer adds a small update.</span></div>
							<div class="keypoint"><b>Pre-norm</b><span>Normalizing the branch instead of the stream makes deep stacks easier to train.</span></div>
						</div>
					</section>

					<section class="section-block" id="output">
						<div class="section-kicker"><span class="sk-num">07</span> From vectors to words</div>
						<h2 class="section-title">Logits, softmax, and the stop token.</h2>
						<div class="prose">
							<p>
								The final hidden state of the last token is multiplied by an unembedding matrix,
								producing a <strong>logit</strong> for every token in the vocabulary. A logit
								is not a probability; it is an unnormalized score. Adding the same constant to
								every logit changes nothing after softmax, so only differences between logits
								matter. Softmax turns them into a probability distribution. A decoding rule
								chooses one token: greedy takes the maximum, sampling draws from the
								distribution, temperature scales the logits, top-k/top-p restrict the pool. The
								chosen token is appended to the context and the loop runs again.
							</p>
							<p>
								How does it stop? There is no separate stop detector. The end-of-sequence token
								is an ordinary vocabulary entry; “stopping” means the distribution puts enough
								mass on EOS at a natural boundary. Instruction-tuned models may also carry a
								rough sense of how long an answer should be, but that is a learned estimate,
								not an odometer.
							</p>
						</div>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">There is no stop button.</p>
							<p class="aha-sub">EOS is just another token. The model stops when the next-token distribution has learned that a natural boundary is the most likely next move.</p>
						</div>
						<div class="formula" data-tex="\operatorname{P}(\text{token}) = \operatorname{softmax}\left(\frac{\text{logits}}{T}\right)"></div>
						<div class="prose">
							<p>
								Temperature <span data-tex="T" data-tex-display="false"></span> changes the shape of the distribution without
								changing the model. At <span data-tex="T = 1" data-tex-display="false"></span> the softmax uses the logits as
								they are. Lower values sharpen the distribution toward the top token; higher
								values flatten it and give rare tokens more room.
								<strong>Temperature is a dial on diversity.</strong> The knowledge sits in
								the logits; temperature changes how widely the model explores them, and a
								different early token sends the text down a different path.
							</p>
						</div>
						<div class="myth-grid">
							<div class="myth">
								<b>Common misreading</b>
								<span>“Attention is all you need, literally.” Attention routes; the FFN computes; residuals carry; normalization stabilizes. Remove any one and the machine changes.</span>
							</div>
							<div class="myth myth--ok">
								<b>Better frame</b>
								<span>“The block is a division of labour.” Attention moves information; the FFN transforms it; the residual stream keeps a shared workspace.</span>
							</div>
							<div class="myth">
								<b>Common misreading</b>
								<span>“The model builds a syntax tree and then reads it.” Syntax is distributed across heads and layers, not stored as one object.</span>
							</div>
							<div class="myth myth--ok">
								<b>Better frame</b>
								<span>“Depth builds structure bottom-up.” Lower layers assemble local units; higher layers integrate larger relations.</span>
							</div>
						</div>
<div id="transformer-temperature-block">
<label style="font-weight: bold;">Temperature ($T$): <span id="temp-val" style="font-weight: bold; color: #3b82f6;">1.0</span></label>
<p style="font-size: 0.75rem; color: #64748b; margin: 2px 0;">
<b>Effect:</b> Controls the “sharpness” of the probability distribution.<br/>
<b>Reason:</b> Low values ($T &lt; 1$) force the model to be deterministic; high values ($T &gt; 1$) increase diversity by making unlikely words more probable.
	</p>
<input id="transformer-temperature" max="2.0" min="0.1" oninput="document.getElementById('temp-val').innerText = this.value; rerender_temperature_only();" step="0.1" style="width: 100%; vertical-align: middle;" type="range" value="1.0"/>
</div>
<div id="transformer-output-projection" style="background: var(--mn-surface, white); padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px; margin-top: 20px;"></div>
<div>
<label style="font-weight: bold; display: block; margin-top: 15px; margin-bottom: 8px;">Input (Inference):</label>
<input id="transformer-master-token-input" type="hidden" value="<?php echo function_exists('tm_lang') && tm_lang() === 'de' ? 'der' : 'the'; ?>"/>
<div class="tm-token-builder" id="transformer-token-builder">
	<div class="tm-token-builder-head">
		<span class="tm-token-builder-label">Token-only input</span>
		<button type="button" id="transformer-token-picker-clear">Clear</button>
	</div>
	<div class="tm-token-builder-chips" id="transformer-token-picker-chips" aria-label="Prompt tokens"></div>
	<div class="tm-token-builder-palette-label">Available tokens</div>
	<div class="tm-token-builder-palette" id="transformer-token-picker-palette" aria-label="Available tokens"></div>
	<p class="tm-token-builder-note">Space is shown as ␣; <code>&lt;|endoftext|&gt;</code> is appended automatically.</p>
	<p class="tm-token-builder-note">Click a token to append it. The result chips in the calculation above are clickable too.</p>
</div>
</div>
						

<div class="prose">
							<p>
								One last surprise from recent research: in a simplified setting, a linear
								attention layer can implement a step of gradient descent on the examples in the
								prompt (<a href="https://arxiv.org/abs/2212.07677" rel="noopener">von Oswald et al., 2022</a>). That reframes in-context learning as an optimizer the model learned to
								run inside its forward pass. The result is suggestive, not a complete
								explanation; it is one of the most interesting open threads in the field.
							</p>
						</div>
					</section>

					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">08</span> Takeaway</div>
						<h2 class="section-title">The short version.</h2>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">A transformer is a stack of small, reusable edits to one shared vector.</p>
							<p class="aha-sub">Attention routes information between tokens; the FFN transforms each token; the residual stream keeps everything that came before. Scale that block and you get a language model.</p>
						</div>
					</section>


				</article>
			</div>
		</div>
	</main>

	<div id="tm-inference-busy" hidden aria-live="polite" aria-busy="true">
		<div class="tm-inference-busy-card">
			<span class="tm-inference-spinner" aria-hidden="true"></span>
			<span id="tm-inference-busy-text">Computing the next step…</span>
		</div>
	</div>


	<script src="assets/site.js?v=<?php echo filemtime(__DIR__.'/assets/site.js'); ?>"></script>
	<script src="../temml.min.js"></script>
	<script src="../transformer_steps.js?v=<?php echo (int) @filemtime(__DIR__ . '/../transformer_steps.js'); ?>"></script>
	<script>
	(function () {
		var host = document.getElementById('transformer-step-visuals');
		if (!host || !window.TransformerSteps) return;
		var ready = false;
		function init() {
			if (ready) return;
			ready = true;
			window.TransformerSteps.init('transformer-step-visuals');
		}
		if ('IntersectionObserver' in window) {
			var io = new IntersectionObserver(function (entries) {
				if (entries.some(function (e) { return e.isIntersecting; })) {
					io.disconnect();
					init();
				}
			}, { rootMargin: '400px 0px' });
			io.observe(host);
		} else {
			init();
		}
	})();
	</script>




	<?php
	$tmDemoFiles = [
		'assets/full/shim.js',
		'assets/full/transformer.js',
		'assets/full/vendor/echarts.min.js',
		'assets/full/vendor/echarts-gl.min.js',
		'assets/full/attention_engine.js',
	];
	$tmDemoSizes = [];
	$tmDemoTotal = 0;
	foreach ($tmDemoFiles as $tmFile) {
		$tmSize = @filesize(__DIR__ . '/' . $tmFile);
		$tmDemoSizes[$tmFile] = $tmSize ?: 0;
		$tmDemoTotal += $tmSize ?: 0;
	}
	?>
	<script>
	(function () {
		"use strict";
		var files = <?php echo json_encode($tmDemoFiles, JSON_UNESCAPED_SLASHES); ?>;
		var sizes = <?php echo json_encode($tmDemoSizes, JSON_UNESCAPED_SLASHES); ?>;
		var totalBytes = <?php echo (int) $tmDemoTotal; ?> || 1;
		var perfOnly = /[?&]demo_perf=1(?:&|$)/.test(location.search);
		var fetchOnly = /[?&]demo_perf=fetch(?:&|$)/.test(location.search);
		var engineOnly = /[?&]demo_perf=engine(?:&|$)/.test(location.search);
		var labels = {
			"echarts.min.js": ["ECharts (position waves)", "ECharts (Positionswellen)"],
			"echarts-gl.min.js": ["ECharts GL (3D)", "ECharts GL (3D)"],
			"shim.js": ["Demo shim", "Demo-Shim"],
			"transformer.js": ["Transformer engine", "Transformer-Engine"],
			"attention_engine.js": ["Attention engine", "Attention-Engine"],
			"demo-i18n.js": ["German demo texts", "Deutsche Demo-Texte"],
			"demo-render.js": ["Formula renderer", "Formel-Renderer"]
		};
		var started = false, done = false;
		var hosts = ["inputlab", "block", "output", "realmodel"].map(function (id) { return document.getElementById(id); }).filter(Boolean);
		if (!hosts.length) hosts = [document.body];
		var status = document.getElementById("demo-loader-status");
		var titleEl = document.getElementById("demo-loader-title");
		var countEl = document.getElementById("demo-loader-count");
		var trackEl = document.getElementById("demo-loader-track");
		var fillEl = document.getElementById("demo-loader-fill");
		var metaEl = document.getElementById("demo-loader-meta");
		var currentEl = document.getElementById("demo-loader-current");
		var percentEl = document.getElementById("demo-loader-percent");
		var completedBytes = 0, completedFiles = 0, currentBytes = 0, currentFile = "";
		var frame = null;
		var perf = { start: performance.now(), files: [], totalBytes: totalBytes };
		function t(en, de) { return (window.TM && TM.lang && TM.lang() === "de") ? de : en; }
		function fmtMB(bytes) {
			var mb = bytes / 1048576;
			return (mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)) + " MB";
		}
		function labelFor(file) {
			var base = file.split("/").pop();
			var pair = labels[base];
			if (!pair) return base;
			return TM.lang && TM.lang() === "de" ? pair[1] : pair[0];
		}
		function paint() {
			frame = null;
			if (!status) return;
			var loaded = Math.min(totalBytes, completedBytes + currentBytes);
			var pct = Math.max(0, Math.min(100, Math.round(loaded / totalBytes * 100)));
			fillEl.style.width = pct + "%";
			percentEl.textContent = pct + "%";
			countEl.textContent = completedFiles + " / " + files.length + " " + t("files", "Dateien");
			currentEl.textContent = (currentFile ? labelFor(currentFile) + " · " : "") + fmtMB(loaded) + " / " + fmtMB(totalBytes);
		}
		function schedulePaint() {
			if (frame) return;
			frame = requestAnimationFrame(paint);
		}
		function showLoading() {
			if (!status) return;
			status.style.display = "block";
			status.classList.add("is-loading");
			titleEl.textContent = t("Loading the interactive transformer demos…", "Interaktive Transformer-Demos werden geladen…");
			trackEl.hidden = false;
			metaEl.hidden = false;
			countEl.hidden = false;
			paint();
		}
		function setCurrent(file) {
			currentFile = file;
			currentBytes = 0;
			schedulePaint();
		}
		function addBytes(n) {
			currentBytes += n;
			schedulePaint();
		}
		function finishFile(file, bytes, fetchMs, execMs, cached) {
			completedBytes += bytes || sizes[file] || 0;
			completedFiles++;
			perf.files.push({ file: file, bytes: bytes || sizes[file] || 0, fetchMs: fetchMs, execMs: execMs, cached: !!cached });
			currentFile = "";
			currentBytes = 0;
			schedulePaint();
		}
		function initializeFile(file, text, fetchMs, bytes) {
			if (fetchOnly) { finishFile(file, bytes, fetchMs, 0, false); return Promise.resolve(); }
			if (titleEl) titleEl.textContent = t("Initializing ", "Initialisiere ") + labelFor(file) + "…";
			schedulePaint();
			return new Promise(function (resolve) {
				requestAnimationFrame(function () {
					var t0 = performance.now();
					var script = document.createElement("script");
					script.textContent = text;
					document.body.appendChild(script);
					finishFile(file, bytes, fetchMs, performance.now() - t0, false);
					resolve();
				});
			});
		}
		function loadScript(file) {
			return new Promise(function (resolve, reject) {
				var script = document.createElement("script");
				script.src = file;
				script.async = false;
				script.onload = resolve;
				script.onerror = function () { reject(new Error(file)); };
				document.body.appendChild(script);
			});
		}
		function loadFile(file) {
			setCurrent(file);
			var t0 = performance.now();
			return fetch(file, { credentials: "same-origin" }).then(function (response) {
				if (!response.ok) throw new Error(file + " " + response.status);
				var reader = response.body && response.body.getReader ? response.body.getReader() : null;
				if (!reader) {
					return response.text().then(function (text) {
						return initializeFile(file, text, performance.now() - t0, sizes[file] || 0);
					});
				}
				var chunks = [], loaded = 0;
				function pump() {
					return reader.read().then(function (result) {
						if (result.done) return;
						chunks.push(result.value);
						loaded += result.value.length;
						addBytes(result.value.length);
						return pump();
					});
				}
				return pump().then(function () {
					return new Blob(chunks).text();
				}).then(function (text) {
					return initializeFile(file, text, performance.now() - t0, loaded);
				});
			}).catch(function () {
				return loadScript(file).then(function () {
					finishFile(file, sizes[file] || 0, null, null, false);
				});
			});
		}
		var tfPromise = null;
		function loadTF() {
			if (window.tf) return Promise.resolve();
			if (tfPromise) return tfPromise;
			var box = document.getElementById("training-status");
			if (box) {
				box.style.display = "block";
				box.textContent = t("Loading TensorFlow.js…", "TensorFlow.js wird geladen…");
			}
			tfPromise = loadScript("assets/full/vendor/tf.min.js").then(function () {
				if (!window.tf) throw new Error("TensorFlow.js missing");
				var ready = tf.setBackend ? tf.setBackend("cpu") : Promise.resolve();
				return Promise.resolve(ready).then(function () { return tf.ready ? tf.ready() : null; });
			});
			return tfPromise;
		}
		function wireTrain() {
			var btn = document.querySelector(".train-btn");
			if (!btn || btn._tmTfWired) return;
			btn._tmTfWired = true;
			btn.addEventListener("click", function (event) {
				if (window.tf) return;
				event.preventDefault();
				event.stopImmediatePropagation();
				loadTF().then(function () {
					if (typeof train_transformer === "function") train_transformer();
				}).catch(function () {
					var box = document.getElementById("training-status");
					if (box) box.textContent = t("TensorFlow.js could not load.", "TensorFlow.js konnte nicht geladen werden.");
				});
			}, true);
		}
		function finish() {
			done = true;
			perf.totalMs = performance.now() - perf.start;
			window.__tmDemoPerf = perf;
			if (status) {
				titleEl.textContent = t("Interactive demos ready.", "Interaktive Demos bereit.");
				fillEl.style.width = "100%";
				percentEl.textContent = "100%";
				countEl.textContent = files.length + " / " + files.length + " " + t("files", "Dateien");
				currentEl.textContent = t("Done", "Fertig") + " · " + fmtMB(totalBytes);
				setTimeout(function () { if (status) status.style.display = "none"; }, 1200);
			}
		}
		function showPerf() {
			var pre = document.createElement("pre");
			pre.id = "demo-perf-out";
			pre.style.cssText = "white-space:pre-wrap;font-size:11px;background:#fff;border:1px solid #ccc;padding:8px;margin:8px 0;";
			pre.textContent = JSON.stringify(perf, null, 2);
			document.body.appendChild(pre);
		}
		function loadAll() {
			if (started) return;
			started = true;
			showLoading();
			files.reduce(function (p, file, index) {
				return p.then(function () { return loadFile(file); }).then(function () {
					if (index === 1) {
						try {
							var corpus = document.getElementById("transformer-training-data");
							if (corpus && typeof transformer_tokenize_render === "function") {
								transformer_tokenize_render(corpus.value, "transformer-viz-bpe");
							}
						} catch (e) {}
					}
				});
			}, Promise.resolve()).then(function () {
				perf.scriptsMs = performance.now() - perf.start;
				window.__tmDemoPerf = perf;
				if (perfOnly || fetchOnly) { showPerf(); finish(); return; }
				try {
					var ifs = document.getElementById("ifscalfactornotone");
					if (ifs) ifs.style.display = "none";
					if (titleEl) titleEl.textContent = t("Starting the transformer engine…", "Starte die Transformer-Engine…");
					schedulePaint();
					requestAnimationFrame(function () {
						var t0 = performance.now();
						var result = typeof loadTransformerModule === "function" ? loadTransformerModule() : null;
						Promise.resolve(result).then(function () {
							perf.engineMs = performance.now() - t0;
							wireTrain();
							if (engineOnly) { showPerf(); finish(); return; }
							finish();
							loadScript("assets/full/demo-i18n.js").then(function () {
								return loadScript("assets/full/demo-render.js");
							}).catch(function () {});
						}).catch(function () {
							perf.engineMs = performance.now() - t0;
							window.__tmDemoPerf = perf;
							if (status) titleEl.textContent = t("The demos could not start.", "Die Demos konnten nicht starten.");
						});
					});
				} catch (e) {
					if (status) titleEl.textContent = t("The demos could not start.", "Die Demos konnten nicht starten.");
				}
			}).catch(function () {
				if (status) titleEl.textContent = t("The demos could not load.", "Die Demos konnten nicht geladen werden.");
			});
		}
		function near() {
			if (started) return true;
			var limit = (window.innerHeight || 800) + 900;
			for (var i = 0; i < hosts.length; i++) if (hosts[i].getBoundingClientRect().top < limit) return true;
			return false;
		}
		if ("IntersectionObserver" in window) {
			var io = new IntersectionObserver(function (entries) {
				if (entries.some(function (entry) { return entry.isIntersecting; })) {
					io.disconnect();
					loadAll();
				}
			}, { rootMargin: "900px 0px" });
			hosts.forEach(function (host) { io.observe(host); });
		}
		window.addEventListener("scroll", function () { if (near()) loadAll(); }, { passive: true });
		var watch = setInterval(function () {
			if (near()) { clearInterval(watch); loadAll(); }
		}, 800);
		if (near()) { clearInterval(watch); loadAll(); }
	})();
	</script>
</body>
</html>
