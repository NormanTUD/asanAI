<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="A ten-minute interactive guide to attention: queries, keys, values, softmax, multi-head attention, and what attention maps do not tell you.">
	<meta name="theme-color" content="#ffffff">
	<title>The Semantic Tug-of-War | Ten Minutes</title>
	<link rel="stylesheet" href="../Temml-Local.min.css">
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
</head>
<body data-lesson="attentionlab" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>The semantic <em>tug-of-war.</em></h1>
					<p class="hero-deck">
						Attention is the one place inside a transformer where a token can take information
						from another token. <strong>Query, key, value</strong>: what am I looking for, what
						do you contain, what will I carry away? Click a word and watch the sentence decide
						what it means.
					</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="problem">
						<div class="section-kicker"><span class="sk-num">01</span> The problem</div>
						<h2 class="section-title">A word is not a meaning until it has neighbours.</h2>
						<div class="prose">
							<p>
								Embeddings gave every token a vector. Attention lets those vectors exchange information.
								“Apple” in isolation is ambiguous. In <em>I ate a juicy apple</em>, the word
								“juicy” pulls its vector toward the fruit cluster. In <em>Apple released a
								new chip</em>, “released” pulls it toward the company cluster. A static
								embedding cannot do that; it gives every occurrence of “apple” the same
								vector. Attention is how the model rewrites the vector using the other words
								in the context.
							</p>
							<p>
								The classic case is <strong>“bank”</strong>: river bank or money bank? The
								sentence must decide. Attention lets each token ask the rest of the sequence:
								<em>which of you matters to me right now?</em> The answer is a weighted
								average, not a dictionary lookup.
							</p>
						</div>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">Meaning is movement.</p>
							<p class="aha-sub">The contextual vector of “bank” is not its dictionary entry; it is a new position produced by the gravitational pull of the words it attends to.</p>
						</div>
					</section>

					<section class="section-block" id="qkv">
						<div class="section-kicker"><span class="sk-num">02</span> The handshake</div>
						<h2 class="section-title">Query, key, value.</h2>
						<div class="prose">
							<p>
								For every token, the model computes three vectors by multiplying its hidden
								state with three learned matrices:
							</p>
							<ul>
								<li><strong>Query (q)</strong>: what this token is looking for.</li>
								<li><strong>Key (k)</strong>: what this token offers as a descriptor.</li>
								<li><strong>Value (v)</strong>: the content this token will pass on if chosen.</li>
							</ul>
							<p>
								The separation is the point. If the model compared raw token vectors, it would
								have only one notion of similarity. Query and key let it learn two roles: a
								token can advertise something different from what it is looking for. A pronoun
								can search for a noun without itself looking like a noun. Value is separate for
								the same reason: what a token is matched on need not be what it hands over.
							</p>
							<p>
								The score between a query and a key is their dot product, scaled by the square
								root of the key dimension (<a href="https://arxiv.org/abs/1706.03762" rel="noopener">Vaswani et al., 2017</a>). A large score means the vectors point in a similar
								direction: “you are relevant to my search.” Softmax turns all the scores in a
								row into weights that sum to one. The output is the weighted sum of the value
								vectors. The row summing to one is not a technicality: it makes attention a
								finite budget, so a head that spends more on one token has less to spend on the
								others.
							</p>
						</div>
						<div class="formula" data-tex="\begin{aligned} \operatorname{score}_{i,j} &amp;= \frac{q_i \cdot k_j^{\mathsf{T}}}{\sqrt{d_k}} \\ \alpha_{i,j} &amp;= \operatorname{softmax}_j(\operatorname{score}_{i,j}) \\ z_i &amp;= \sum_j \alpha_{i,j} v_j \end{aligned}">score(i,j) = (q_i · k_j^T) / √d_k; α(i,j) = softmax_j(score(i,j)); z_i = Σ_j α(i,j) v_j</div>
						<div class="fieldnotes">
							<h4>Why divide by <span data-tex="\sqrt{d_k}" data-tex-display="false">√d_k</span>?</h4>
							<p>As the dimension grows, dot products grow in magnitude and push softmax into a saturated regime with tiny gradients. The scaling keeps the scores in a healthy range. It changes the sharpness, not the meaning of the comparison.</p>
						</div>
					</section>

					<section class="section-block" id="explorer">
						<div class="section-kicker"><span class="sk-num">03</span> The explorer</div>
						<h2 class="section-title">Who is talking to whom?</h2>
						<div class="prose">
							<p>
								Below is an illustrative attention map for one sentence. Pick a query word and
								a head. The bars under the words show how much of the query’s attention each
								key receives. The numbers are hand-tuned to make the qualitative behaviour
								visible; a real model’s heads are messier and only partly interpretable.
							</p>
						</div>

						<div class="demo demo--interactive" id="attention-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">Attention explorer <span>· demo 01</span></p>
									<p class="demo-sub">Click a query word. Switch heads. Then open the matrix to see all rows at once.</p>
								</div>
								<span class="demo-badge">illustrative</span>
							</div>
							<div class="demo-body">
								<div class="att-heads" id="att-heads" role="group" aria-label="Attention heads">
									<button class="chip is-on" type="button" data-head="coref">Coreference</button>
									<button class="chip" type="button" data-head="syntax">Syntax</button>
									<button class="chip" type="button" data-head="meaning">Meaning</button>
								</div>
								<div class="chip-row" style="margin-bottom:14px" id="att-presets">
									<button class="chip" type="button" data-att-preset="coref">she → Maria</button>
									<button class="chip" type="button" data-att-preset="syntax">repay → would</button>
									<button class="chip" type="button" data-att-preset="meaning">bank → loan</button>
								</div>
								<div class="att-sentence" id="att-sentence"></div>
								<div class="att-budget" id="att-budget" aria-hidden="true"></div>
								<p class="vec-note att-budget-note">One row's attention budget: the segments sum to 100%.</p>
								<div class="demo-readout demo-readout--4">
									<div><b>Query</b><span id="att-query">she</span></div>
									<div><b>Top attended</b><span id="att-top">Maria</span></div>
									<div><b>Weight</b><span id="att-weight">0.48</span></div>
									<div><b>Row sum</b><span>1.00</span></div>
								</div>
								<p class="vec-note" id="att-top3" style="color:var(--tm-muted)">Top 3: Maria 60% · she 14% · bank 12%. Every row sums to 1: attention is a finite budget.</p>
								<div class="att-matrix" id="att-matrix">
									<canvas id="att-matrix-canvas" aria-label="Attention matrix: rows are queries, columns are keys"></canvas>
									<p class="pipe-note">Rows = query, columns = key. The causal mask is always on: each row can see itself and the past, never the future. The row is renormalized over those positions only.</p>
								</div>
								<p class="meadow-caption" id="att-caption" style="color:var(--tm-muted)">The coreference head links “she” back to “Maria”. The pronoun needs a referent; the head retrieves it.</p>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Attention routes information; it does not explain the answer. The weights show where a head looked, not what the rest of the network did with it.</span></div>
							<div class="demo-foot">
								The sentence: “Maria told the bank that she would repay the loan tomorrow.”
								The toy is designed to show three different kinds of relation, not to reproduce
								a specific trained head.
							</div>
						</div>

						<div class="trythis">
							<b>Try this</b>
							<ol>
								<li>Select <strong>“she”</strong> under the <strong>Coreference</strong> head. Where does it look? Now switch to <strong>Syntax</strong>. What changes?</li>
								<li>Select <strong>“bank”</strong> under <strong>Meaning</strong>. Which words pull it toward finance?</li>
								<li>Open the matrix. Why is the upper-right triangle empty? What would that mean during generation?</li>
							</ol>
						</div>
						<div class="prose">
							<p>
								The causal mask is the answer to the third question. A model that writes left
								to right must not attend to tokens that do not exist yet, or it would be
								reading its own answer during training. Masking sets the score for every future
								position to negative infinity before the softmax, so those weights become
								zero and the row is renormalized over the past only. Nothing about the
								mechanism changes; the future is simply not in the budget.
							</p>
						</div>
					</section>

					<section class="section-block" id="multi">
						<div class="section-kicker"><span class="sk-num">04</span> Many heads</div>
						<h2 class="section-title">One sentence, many lenses.</h2>
						<div class="prose">
							<p>
								A single head can only attend from one perspective. The transformer runs
								several heads in parallel, each with its own
								projection matrices, and concatenates their outputs. In the original paper
								(<a href="https://arxiv.org/abs/1706.03762" rel="noopener">Vaswani et al., 2017</a>) there are 8 heads over a 512-dimensional model, so each head works in a
								64-dimensional subspace. One head can chase syntax while another tracks
								coreference; the final output projection mixes them back together.
							</p>
							<p>
								Think of each head as having a fixed <strong>budget of attention</strong>: for
								one query token, its softmax row sums to exactly 1. If the head gives 0.8 to
								one token, only 0.2 is left for every other token. It cannot look strongly at
								everything at once. That is why multiple heads exist: each head gets its own
								budget, its own query/key/value projections, and its own idea of what matters.
								One head can spend most of its budget on coreference, another on syntax, another
								on nearby punctuation. The budgets are separate, so heads do not compete with
								each other, but inside one head, they do.
							</p>
							<p>
								This is <strong>not</strong> redundancy. Studies of BERT find that a small
								number of heads do most of the work, some specialize in dependency relations,
								and many can be pruned with little loss. But no single head is a clean parser,
								and much attention lands on punctuation or special tokens. The picture is
								distributed: syntax is partitioned across heads and depth, built bottom-up,
								not read off one tidy tree.
							</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Softmax is zero-sum</b><span>Each row sums to one. If one key gets more attention, every other key gets less. Attention is a finite budget.</span></div>
							<div class="keypoint"><b>Columns are not zero-sum</b><span>Some tokens become information hubs, receiving attention from many queries.</span></div>
							<div class="keypoint"><b>Context window</b><span>Attention can only see tokens inside the window. Memory and compute grow quadratically with window size.</span></div>
							<div class="keypoint"><b>KV cache</b><span>During generation, past keys and values are cached so each new query need not recompute the whole prefix.</span></div>
						</div>

						<div class="demo demo--paper" data-demo="headbudget">
							<div class="demo-head">
								<div>
									<p class="demo-title">One head, one budget <span>· demo 02</span></p>
									<p class="demo-sub">Each head has exactly 1.00 to spend per query. Click a token to move 0.20 of the budget to it; every other token gives up its share. Switch heads and watch a different token win.</p>
								</div>
								<span class="demo-badge">zero-sum row</span>
							</div>
							<div class="demo-body">
								<div class="chip-row" role="group" aria-label="Attention heads">
									<button class="chip is-on" type="button" data-hb-head="coref">Coreference</button>
									<button class="chip" type="button" data-hb-head="syntax">Syntax</button>
									<button class="chip" type="button" data-hb-head="meaning">Meaning</button>
								</div>
								<div class="dist-bars" data-hb-bars style="margin-top:12px"></div>
								<div class="demo-controls">
									<span style="font-size:.66rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--tm-muted)">Budget</span>
									<div class="meter" style="flex:1 1 160px"><span style="width:100%"></span></div>
									<b data-hb-budget style="font-family:var(--tm-mono);font-size:.78rem">1.00 / 1.00</b>
									<button class="btn-demo" type="button" data-hb-reset>Reset head</button>
									<button class="btn-demo" type="button" data-hb-spread>Spread evenly</button>
								</div>
								<div class="demo-readout">
									<div><b>Head</b><span data-hb-head-name>Coreference</span></div>
									<div><b>Top token</b><span data-hb-top>Maria</span></div>
									<div><b>Concentration</b><span data-hb-conc>...</span></div>
								</div>
								<p class="demo-hint" data-hb-note></p>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>A head cannot attend strongly to everything: the row is a fixed budget. Multi-head attention works because each head brings a separate budget and a separate question.</span></div>
						</div>

						<div class="prose">
							<p>
								Two beautiful connections are worth knowing. The attention operation is a
								<strong>differentiable read head</strong> over a memory tape: query = address
								request, keys = address tags, values = content (<a href="https://arxiv.org/abs/1410.5401" rel="noopener">Graves et al., 2014</a>). And modern Hopfield networks
								show that attention is mathematically an associative memory retrieval (<a href="https://arxiv.org/abs/2008.02217" rel="noopener">Ramsauer et al., 2021</a>). RAG
								extends the same idea outside the model: retrieve documents by similarity and
								put them in the context window.
							</p>
							<p>
								There is also a strange corner case: <strong>attention sinks</strong> (<a href="https://arxiv.org/abs/2309.17453" rel="noopener">Xiao et al., 2023</a>). In many
								decoder-only models, a large share of attention flows to the first token even
								when it carries no content. When streaming with a sliding window, evicting
								that first token can collapse the model; keeping a few sink tokens pinned fixes
								it. The model is not remembering their meaning: it is using them as a resting
								place for the attention budget.
							</p>
							<p>
								The cost of all this is the score matrix: every query is compared with every
								key, so doubling the context roughly quadruples that part of the work. That is
								why long context is an engineering problem, not just a setting, and why a lot
								of research goes into making attention cheaper rather than merely larger.
							</p>
						</div>
					</section>

					<section class="section-block" id="transport">
						<div class="section-kicker"><span class="sk-num">05</span> Optimal transport</div>
						<h2 class="section-title">Softmax solves a transport problem.</h2>
						<div class="prose">
							<p>
								Argmax returns the index of the largest number and throws away the rest of
								the distribution. Softmax keeps every score and turns it into a weight, so
								nothing disappears; it is a soft, temperature-controlled version of that
								choice. There is a stronger description of what it computes.
							</p>
							<p>
								Softmax is often introduced as a smooth argmax. There is a stronger
								description. For one query, the attention row is the exact solution to a
								one-sided entropic optimal transport problem (<a href="https://arxiv.org/abs/2508.08369" rel="noopener">Litman, 2025</a>).
								The cost of sending attention to key <span data-tex="j" data-tex-display="false"></span>
								is the negative similarity,
								<span data-tex="C_j = -\langle q, k_j\rangle" data-tex-display="false"></span>.
								The row <span data-tex="p" data-tex-display="false"></span> is a distribution over
								keys. The problem is to minimize the expected cost while keeping the
								distribution's entropy high. The temperature <span data-tex="\tau" data-tex-display="false"></span>
								is the weight on entropy.
							</p>
							<div class="formula" data-tex="\underbrace{ \underbrace{C_j = -\langle q,k_j\rangle}_{\text{cost of key }j} \quad \underbrace{p^\star = \arg\min_{p\in\Delta^{m-1}} \sum_{j=1}^{m} p_j C_j - \tau H(p)}_{\text{expected cost minus entropy}} \;\Longrightarrow\; \underbrace{p_j^\star = \frac{\exp(\langle q,k_j\rangle/\tau)}{\sum_{l=1}^{m}\exp(\langle q,k_l\rangle/\tau)}}_{\text{the softmax row}} }_{\text{one query, one-sided entropic optimal transport}}">C_j = -<q,k_j>; p* = argmin Σ p_j C_j - τ H(p); p_j* = exp(<q,k_j>/τ) / Σ exp(<q,k_l>/τ)</div>
							<p>
								The entropy term is why softmax is smooth: it stops the row from collapsing
								onto one key. High <span data-tex="\tau" data-tex-display="false"></span> buys more
								entropy and spreads the budget; low <span data-tex="\tau" data-tex-display="false"></span>
								approaches the argmax. The dual potential is the log-sum-exp; its gradient is
								the attention row, and its Hessian is
								<span data-tex="\tau" data-tex-display="false"></span> times the Fisher
								information of the attention distribution. That is why the backward pass is
								not an arbitrary chain rule: the standard gradient is the natural gradient in
								disguise, and the update is an advantage-based policy gradient (Litman, 2025).
							</p>
							<div class="formula" data-tex="\underbrace{ \underbrace{\phi^\star(s) = \tau \log\sum_{j=1}^{m} e^{s_j/\tau}, \qquad \nabla_s\phi^\star = p^\star}_{\text{dual potential and its gradient}} \quad \underbrace{\nabla_s^2\phi^\star = \tau F(s), \quad F(s) = \frac{1}{\tau^2}\left(\operatorname{diag}(p^\star)-p^\star(p^\star)^\top\right)}_{\text{Hessian is Fisher information}} \quad \underbrace{\frac{\partial\mathcal L}{\partial s_j}=p_j^\star(u_j-\bar u), \quad \bar u=\sum_k p_k^\star u_k}_{\text{advantage-based update}} }_{\text{forward inference and backward learning share one geometry}}">φ*(s) = τ log Σ exp(s_j/τ), ∇φ* = p*; ∇²φ* = τ F(s), F(s) = (diag(p*) - p*p*ᵀ)/τ²; ∂L/∂s_j = p_j*(u_j - ū)</div>
						</div>

						<div class="demo demo--paper demo--plot" id="eot-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">Temperature is entropy <span>· demo 03</span></p>
									<p class="demo-sub">The scores are fixed. Change τ and watch the softmax move between a sharp argmax and a spread-out row.</p>
								</div>
								<span class="demo-badge">one-sided EOT</span>
							</div>
							<div class="demo-body">
								<div class="dist-bars" id="eot-bars"></div>
								<div class="demo-controls">
									<label>Temperature τ <input type="range" id="eot-temp" min="0.1" max="3" step="0.05" value="1"><output id="eot-temp-out">1.00</output></label>
								</div>
								<div class="demo-readout">
									<div><b>Entropy H(p)</b><span id="eot-entropy">...</span></div>
									<div><b>Expected similarity</b><span id="eot-sim">...</span></div>
									<div><b>Objective J</b><span id="eot-obj">...</span></div>
									<div><b>Top token</b><span id="eot-top">...</span></div>
								</div>
								<p class="demo-hint" id="eot-note">Higher τ spreads the budget; lower τ concentrates it. The EOT objective trades similarity against entropy.</p>
							</div>
						</div>
					</section>

					<section class="section-block" id="limits">
						<div class="section-kicker"><span class="sk-num">06</span> The limits</div>
						<h2 class="section-title">An attention map is not an explanation.</h2>
						<div class="prose">
							<p>
								It is tempting to read attention weights as “the model looked here.” That is
								only partly true. The weights show where information was routed at one layer
								and one head; they do not show what the feed-forward network did with it, how
								the residual stream carried it, or whether the head is causally important.
								Attention is a mechanism, not a confession.
							</p>
							<p>
								The short summary: attention is a learned, soft, differentiable routing
								scheme. It is powerful because it lets every token see every other token in
								one step, and it is limited because the routing is probabilistic, the context
								is finite, and the weights are not a human-readable explanation.
							</p>
						</div>
						<div class="myth-grid">
							<div class="myth">
								<b>Common misreading</b>
								<span>“The model builds a syntax tree and then reads it.” Syntax is distributed across heads and layers, not stored as one parse object.</span>
							</div>
							<div class="myth myth--ok">
								<b>Better frame</b>
								<span>“Many specialist heads, coordinated through the residual stream, build structure bottom-up.” The representation is relational and distributed.</span>
							</div>
							<div class="myth">
								<b>Common misreading</b>
								<span>“High attention weight means the model used that token.” The value path and the rest of the network decide what actually matters.</span>
							</div>
							<div class="myth myth--ok">
								<b>Better frame</b>
								<span>“Attention routes information; the FFN and residual stream compute with it.” Interpretability needs both the routing and the computation.</span>
							</div>
						</div>
					</section>


				</article>
			</div>
		</div>
	</main>


	<script src="../temml.min.js"></script>
	<script src="assets/site.js?v=<?php echo filemtime(__DIR__.'/assets/site.js'); ?>"></script>
	<script src="assets/demos.js?v=<?php echo filemtime(__DIR__.'/assets/demos.js'); ?>"></script>
	<script>
	(function () {
		"use strict";

		var ATT_DE = TM.lang() === "de";
		var TOKENS_EN = ["Maria", "told", "the", "bank", "that", "she", "would", "repay", "the", "loan", "tomorrow"];
		var TOKENS_DE = ["Maria", "told", "the", "bank", "that", "she", "the", "loan", "tomorrow", "repay", "would"];
		var tokens = ATT_DE ? TOKENS_DE : TOKENS_EN;
		var LABELS = ATT_DE ? ["Maria", "sagte", "der", "Bank", "dass", "sie", "den", "Kredit", "morgen", "zurückzahlen", "würde"] : TOKENS_EN.slice();
		function label(i) { return LABELS[i] || tokens[i]; }
		var rules = {
			coref: [
				["she", "Maria", 0.50], ["Maria", "she", 0.18], ["she", "bank", 0.08],
				["she", "loan", 0.06], ["bank", "she", 0.08], ["tomorrow", "she", 0.12]
			],
			syntax: [
				["told", "Maria", 0.22], ["told", "that", 0.16], ["repay", "would", 0.30],
				["repay", "loan", 0.20], ["would", "repay", 0.18], ["the", "bank", 0.18],
				["the", "loan", 0.18], ["bank", "that", 0.12], ["loan", "tomorrow", 0.18]
			],
			meaning: [
				["bank", "loan", 0.34], ["bank", "repay", 0.18], ["bank", "tomorrow", 0.08],
				["loan", "bank", 0.26], ["repay", "loan", 0.24], ["tomorrow", "repay", 0.14],
				["told", "bank", 0.10], ["Maria", "told", 0.18]
			]
		};
		var heads = ["coref", "syntax", "meaning"];
		var head = "coref";
		var query = 5;
		var causal = true;
		var sentenceEl = document.getElementById("att-sentence");
		var headsEl = document.getElementById("att-heads");
		var queryEl = document.getElementById("att-query");
		var topEl = document.getElementById("att-top");
		var weightEl = document.getElementById("att-weight");
		var captionEl = document.getElementById("att-caption");
		var matrixWrap = document.getElementById("att-matrix");
		var matrixCanvas = document.getElementById("att-matrix-canvas");
		var matrixApi = null;

		function weights(h, qi) {
			var w = tokens.map(function (_, j) {
				var base = 0.025;
				if (j === qi) base += 0.10;
				if (Math.abs(j - qi) === 1) base += 0.05;
				return base;
			});
			rules[h].forEach(function (rule) {
				if (rule[0] === tokens[qi]) {
					var j = tokens.indexOf(rule[1]);
					if (j !== -1) w[j] += rule[2];
				}
			});
			if (causal) {
				for (var j = qi + 1; j < tokens.length; j++) w[j] = 0;
			}
			var sum = w.reduce(function (a, b) { return a + b; }, 0) || 1;
			return w.map(function (x) { return x / sum; });
		}
		function renderSentence() {
			if (!sentenceEl) return;
			var w = weights(head, query);
			var top = 0;
			w.forEach(function (x, i) { if (x > w[top]) top = i; });
			sentenceEl.innerHTML = "";
			tokens.forEach(function (tok, i) {
				var b = document.createElement("button");
				b.type = "button";
				b.className = "att-word" + (i === query ? " is-query" : "") + (i !== query && w[i] > 0.12 ? " attended" : "");
				b.setAttribute("aria-label", label(i) + (ATT_DE ? ", Aufmerksamkeit " : ", attention ") + (w[i] * 100).toFixed(0) + (ATT_DE ? " Prozent" : " percent"));
				b.textContent = label(i);
				var bar = document.createElement("span");
				bar.className = "att-bar";
				bar.style.height = (3 + w[i] * 22).toFixed(1) + "px";
				b.appendChild(bar);
				if (i !== query) b.style.background = "rgba(99, 164, 75, " + (0.04 + w[i] * 0.3).toFixed(3) + ")";
				b.addEventListener("click", function () {
					query = i;
					document.querySelectorAll("[data-att-preset]").forEach(function (x) { x.classList.remove("is-on"); });
					renderSentence();
					if (matrixApi) matrixApi.redraw();
				});
				sentenceEl.appendChild(b);
			});
			if (queryEl) queryEl.textContent = label(query);
			if (topEl) topEl.textContent = label(top);
			if (weightEl) weightEl.textContent = (w[top] * 100).toFixed(0) + "%";
			var top3El = document.getElementById("att-top3");
			if (top3El) {
				var ranked = w.map(function (p, i) { return { i: i, p: p }; }).sort(function (a, b) { return b.p - a.p; }).slice(0, 3);
				top3El.textContent = (ATT_DE ? "Top 3: " : "Top 3: ") + ranked.map(function (x) { return label(x.i) + " " + Math.round(x.p * 100) + (ATT_DE ? " %" : "%"); }).join(" · ") + (ATT_DE ? ". Jede Zeile summiert zu 1: Attention ist ein endliches Budget." : ". Every row sums to 1: attention is a finite budget.");
			}
			var budgetEl = document.getElementById("att-budget");
			if (budgetEl) {
				var c = TM.colors();
				var palette = [c.green, c.sky, c.gold, c.coral, c.blue, c.lime, c.petrol, c.muted];
				budgetEl.innerHTML = w.map(function (p, i) {
					return '<span title="' + label(i) + ": " + Math.round(p * 100) + '%" style="width:' + (p * 100).toFixed(2) + '%;background:' + palette[i % palette.length] + '"></span>';
				}).join("");
			}
			if (captionEl) {
				var headName = ATT_DE ? { coref: "Koreferenz", syntax: "Syntax", meaning: "Bedeutung" }[head] : { coref: "Coreference", syntax: "Syntax", meaning: "Meaning" }[head];
				if (head === "coref" && tokens[query] === "she") captionEl.textContent = ATT_DE
					? "Der Koreferenz-Head verknüpft „sie“ mit „Maria“. Das Pronomen braucht einen Bezug; der Head holt ihn."
					: "The coreference head links “she” back to “Maria”. The pronoun needs a referent; the head retrieves it.";
				else if (head === "syntax" && tokens[query] === "repay") captionEl.textContent = ATT_DE
					? "Der Syntax-Head bevorzugt „würde“ und „Kredit“: Hilfsverb und Objekt rahmen das Verb."
					: "The syntax head favours “would” and “loan”: the auxiliary and the object frame the verb.";
				else if (head === "meaning" && tokens[query] === "bank") captionEl.textContent = ATT_DE
					? "Der Bedeutungs-Head zieht „Bank“ zu „Kredit“ und „zurückzahlen“: In diesem Satz gewinnt die finanzielle Bedeutung."
					: "The meaning head pulls “bank” toward “loan” and “repay”: in this sentence, the financial sense wins.";
				else captionEl.textContent = ATT_DE
					? "Head: " + headName + ". Query „" + label(query) + "“ achtet am stärksten auf „" + label(top) + "“ (" + Math.round(w[top] * 100) + " %). Jede Zeile summiert zu 1."
					: "Head: " + headName + ". Query “" + label(query) + "” attends most to “" + label(top) + "” (" + Math.round(w[top] * 100) + "%). Every row sums to 1.";
			}
		}
		function drawMatrix(ctx, w, h) {
			var c = TM.colors();
			var n = tokens.length;
			var pad = 6;
			var size = Math.min((w - 2 * pad) / n, (h - 2 * pad) / n);
			var ox = (w - size * n) / 2;
			var oy = (h - size * n) / 2;
			ctx.clearRect(0, 0, w, h);
			for (var i = 0; i < n; i++) {
				var row = weights(head, i);
				for (var j = 0; j < n; j++) {
					var v = row[j];
					var x = ox + j * size;
					var y = oy + i * size;
					ctx.fillStyle = v === 0 ? "rgba(120,140,150,.08)" : "rgba(92, 155, 175, " + (0.08 + v * 0.9).toFixed(3) + ")";
					ctx.fillRect(x, y, size - 1, size - 1);
					if (i === query) {
						ctx.strokeStyle = c.green;
						ctx.lineWidth = 1.5;
						ctx.strokeRect(x, y, size - 1, size - 1);
					}
				}
			}
			ctx.font = "500 8px ui-monospace, monospace";
			ctx.textAlign = "center";
			ctx.fillStyle = c.muted;
			for (var k = 0; k < n; k++) {
				ctx.fillText(label(k).slice(0, 4), ox + k * size + size / 2, oy - 3);
				ctx.textAlign = "right";
				ctx.fillText(label(k).slice(0, 4), ox - 3, oy + k * size + size / 2 + 3);
				ctx.textAlign = "center";
			}
		}
		if (sentenceEl) {
			headsEl.querySelectorAll("[data-head]").forEach(function (btn) {
				btn.addEventListener("click", function () {
					headsEl.querySelectorAll("[data-head]").forEach(function (x) { x.classList.remove("is-on"); });
					btn.classList.add("is-on");
					head = btn.getAttribute("data-head");
					document.querySelectorAll("[data-att-preset]").forEach(function (x) { x.classList.remove("is-on"); });
					renderSentence();
					if (matrixApi) matrixApi.redraw();
				});
			});
			document.querySelectorAll("[data-att-preset]").forEach(function (btn) {
				btn.addEventListener("click", function () {
					var preset = btn.getAttribute("data-att-preset");
					if (preset === "coref") { head = "coref"; query = tokens.indexOf("she"); }
					if (preset === "syntax") { head = "syntax"; query = tokens.indexOf("repay"); }
					if (preset === "meaning") { head = "meaning"; query = tokens.indexOf("bank"); }
					headsEl.querySelectorAll("[data-head]").forEach(function (x) { x.classList.toggle("is-on", x.getAttribute("data-head") === head); });
					document.querySelectorAll("[data-att-preset]").forEach(function (x) { x.classList.remove("is-on"); });
					btn.classList.add("is-on");
					renderSentence();
					if (matrixApi) matrixApi.redraw();
				});
			});
			if (matrixCanvas) {
				matrixApi = TM.initCanvas(matrixCanvas, drawMatrix);
				matrixCanvas.addEventListener("click", function (ev) {
					var rect = matrixCanvas.getBoundingClientRect();
					var n = tokens.length;
					var size = Math.min((rect.width - 12) / n, (rect.height - 12) / n);
					var oy = (rect.height - size * n) / 2;
					var i = Math.floor((ev.clientY - rect.top - oy) / size);
					if (i >= 0 && i < n) {
						query = i;
						renderSentence();
						matrixApi.redraw();
					}
				});
			}
			window.addEventListener("tm:theme", function () { if (matrixApi) matrixApi.redraw(); });
			renderSentence();
			if (matrixApi) matrixApi.redraw();
			if (window.TM && TM.typesetMath) TM.typesetMath();
		}

		/* ── EOT temperature demo ───────────────────────────── */
		var eotBars = document.getElementById("eot-bars");
		if (eotBars) {
			var eotTokens = ATT_DE ? ["Maria", "Bank", "Kredit", "sie", "zurückzahlen", "morgen"] : ["Maria", "bank", "loan", "she", "repay", "tomorrow"];
			var eotScores = [3.0, 1.2, 2.2, 0.8, 2.6, 0.5];
			var eotTemp = document.getElementById("eot-temp");
			var eotTempOut = document.getElementById("eot-temp-out");
			var eotEntropy = document.getElementById("eot-entropy");
			var eotSim = document.getElementById("eot-sim");
			var eotObj = document.getElementById("eot-obj");
			var eotTop = document.getElementById("eot-top");
			var eotNote = document.getElementById("eot-note");
			function escapeEot(s) {
				return String(s).replace(/[&<>"]/g, function (c) {
					return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
				});
			}
			function renderEot() {
				var tau = Math.max(0.1, parseFloat(eotTemp.value) || 1);
				var exps = eotScores.map(function (s) { return Math.exp(s / tau); });
				var sum = exps.reduce(function (a, b) { return a + b; }, 0);
				var p = exps.map(function (e) { return e / sum; });
				var entropy = -p.reduce(function (a, x) { return a + (x > 0 ? x * Math.log(x) : 0); }, 0);
				var sim = p.reduce(function (a, x, i) { return a + x * eotScores[i]; }, 0);
				var obj = -sim + tau * entropy;
				var top = 0;
				p.forEach(function (x, i) { if (x > p[top]) top = i; });
				eotBars.innerHTML = eotTokens.map(function (tok, i) {
					var pct = Math.round(p[i] * 100);
					return '<div class="dist-row">' +
						'<span class="dist-label">' + escapeEot(tok) + '</span>' +
						'<span class="dist-track"><span class="dist-fill" style="width:' + pct + '%;background:' + (i === top ? "var(--tm-green)" : "var(--tm-sky)") + '"></span></span>' +
						'<span class="dist-val">' + pct + '%</span></div>';
				}).join("");
				if (eotEntropy) eotEntropy.textContent = entropy.toFixed(2) + " nats";
				if (eotSim) eotSim.textContent = sim.toFixed(2);
				if (eotObj) eotObj.textContent = obj.toFixed(2);
				if (eotTop) eotTop.textContent = eotTokens[top];
				if (eotTempOut) eotTempOut.textContent = tau.toFixed(2);
				if (eotNote) eotNote.textContent = ATT_DE
					? "Höheres τ verteilt das Budget; niedrigeres τ konzentriert es. Die EOT-Zielfunktion handelt Ähnlichkeit gegen Entropie."
					: "Higher τ spreads the budget; lower τ concentrates it. The EOT objective trades similarity against entropy.";
			}
			if (eotTemp) eotTemp.addEventListener("input", renderEot);
			renderEot();
		}
	})();
	</script>
</body>
</html>
