<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="A ten-minute interactive tour of the transformer block: tokens, positions, attention, feed-forward, residual stream, logits, and sampling.">
	<meta name="theme-color" content="#ffffff">
	<title>The Whole Machine | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css">
	<link rel="stylesheet" href="../Temml-Local.min.css">
	<link rel="stylesheet" href="assets/full/demos.css">
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
						transformer. Step through the pipeline, then slide through the layers and watch
						a word change its meaning under context.
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
					</div>
					<section class="section-block" id="before">
						<div class="section-kicker"><span class="sk-num">01</span> Before 2017</div>
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
						<div class="section-kicker"><span class="sk-num">02</span> The pipeline</div>
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

						<div class="demo" id="pipeline-demo" data-arrow-nav>
							<div class="demo-head">
								<div>
									<p class="demo-title">The transformer pipeline <span>· demo 01</span></p>
									<p class="demo-sub">Start with “the cat sat”. Step through the six stages, predict the next token, append it, and run the loop again: on → the → mat → . Stages 04-05 are the transformer block; real models stack that block dozens to hundreds of times.</p>
								</div>
								<span class="demo-badge">click / step</span>
							</div>
							<div class="demo-body">
								<div class="pipe-tokens" id="pipe-tokens"></div>
								<div class="flow flow--six" id="pipe-flow" role="group" aria-label="Transformer stages"></div>
								<div class="flow-repeat">04 + 05 repeat × N blocks · often 32-100+ layers</div>
								<div class="flow-detail" id="pipe-detail">
									<h4 id="pipe-title">Tokenize</h4>
									<p id="pipe-text"></p>
									<p class="pipe-shape" id="pipe-shape"></p>
								</div>
								<div class="pipe-prediction" id="pipe-prediction">Next token: <b>...</b></div>
								<div class="demo-controls">
									<button class="btn-demo btn-demo--green" type="button" id="pipe-next" data-arrow-next>Next step in pipeline →</button>
									<button class="btn-demo" type="button" id="pipe-run">Run the loop ▶</button>
									<button class="btn-demo" type="button" id="pipe-mask-toggle">Show causal mask</button>
									<button class="btn-demo" type="button" id="pipe-reset">Reset</button>
									<span class="pipe-note" id="pipe-counter" style="margin:0">Stage 1 of 6</span>
								</div>
								<div class="causal-mask" id="pipe-mask" hidden>
									<div class="cm-grid" id="cm-grid" aria-label="Causal attention mask: rows are queries, columns are keys"></div>
									<p>Rows are queries, columns are keys. A decoder may attend only to itself and the past; the future is masked. That is what makes next-token prediction causal during training.</p>
								</div>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Attention mixes across positions; the feed-forward network computes per position; the residual stream carries everything forward.</span></div>
							<div class="demo-foot">
								The pipeline is the GPT-style decoder route. An encoder such as BERT keeps the
								same block but removes the causal mask and trains with masked tokens instead
								of next-token prediction.
							</div>
						</div>

						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">It predicts locally, and can still build a world model.</p>
							<p class="aha-sub">The model has no explicit paragraph plan: it predicts one token, appends it, and predicts again. But next-token prediction can require a 								structured internal state. In the Othello (Reversi) experiment (<a href="https://arxiv.org/abs/2210.13382" rel="noopener">Li et al., 2022</a>), a transformer trained only on legal moves (with no board and no rules) spontaneously represented the board; intervening on that representation changed its next move. Coherence can therefore come from a learned world model in the residual stream, not only from a chain of surface bets. The model is still fallible, that world model is partial, and small errors can compound.</p>
						</div>

						<div class="trythis">
							<b>Try this</b>
							<ol>
								<li>Step to <strong>Attention</strong>. Which stage is the only one where information moves <em>between</em> positions?</li>
								<li>Step to <strong>Feed-forward</strong>. Why is it “per-token” while attention is “across tokens”?</li>
								<li>Run to the end. At which point does the model commit to one token, and what decides it?</li>
							</ol>
						</div>
					</section>

					<section class="section-block" id="layerlens">
						<div class="section-kicker"><span class="sk-num">03</span> The layer lens</div>
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
								The layer lens below is a deliberately simple story: context pulls the word
								toward one of two clusters. With “river” in the sentence, “bank” drifts toward
								the river cluster; with “loan”, toward finance. It never lands exactly on the
								cluster centre: the lexical word is still part of the sum. Every token in the
								sentence contributes a little, so the path is not a clean straight line; it
								picks up a small amount of noise along the way. Drag the layer slider and switch
								the context. Real trajectories are high-dimensional and much messier; the
								qualitative idea (context accumulates with depth) is the point.
							</p>
							<p>
								<strong>The word does not travel from layer to layer.</strong> The stream stays;
								each block writes an update into it. That is why a late layer can still recover
								the original lexical sense: nothing was replaced.
							</p>
						</div>

						<div class="demo" id="layer-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">The layer lens <span>· demo 02</span></p>
									<p class="demo-sub">Pick a context, then drag through layers 0-11.</p>
								</div>
								<span class="demo-badge">illustrative</span>
							</div>
							<div class="demo-body">
								<canvas class="demo-canvas" id="layer-canvas" style="height:320px" aria-label="A word moving between two semantic clusters across layers"></canvas>
								<div class="demo-readout">
									<div><b>Layer</b><span id="layer-num">0 / 11</span></div>
									<div><b>Context</b><span id="layer-context">river bank</span></div>
									<div><b>Pull</b><span id="layer-pull">neutral</span></div>
								</div>
								<div class="demo-controls">
									<div class="chip-row" id="layer-contexts">
										<button class="chip is-on" type="button" data-ctx="river">“the river bank”</button>
										<button class="chip" type="button" data-ctx="loan">“the bank loan”</button>
										<button class="chip" type="button" data-ctx="none">no context</button>
									</div>
									<label>Layer <input type="range" id="layer-slider" min="0" max="11" step="1" value="0"><output id="layer-out">0</output></label>
								</div>
								<p class="meadow-caption" id="layer-caption" style="color:var(--tm-muted)">At the input, “bank” sits between the clusters. Context has not pulled it yet.</p>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Depth assembles context. The word is not looked up in a dictionary; it is moved by the evidence in the sentence.</span></div>
							<div class="demo-foot">
								This is a 2-D cartoon of a high-dimensional residual stream. The real lesson is
								in the architecture: every layer reads the stream, computes an update, and adds
								it back.
							</div>
						</div>

						<div class="trythis">
							<b>Try this</b>
							<ol>
								<li>Set the layer to 11 for “the bank loan”. Why does “bank” stop short of the finance cluster?</li>
								<li>Switch to “the river bank” without moving the slider. What changes, and what stays the same?</li>
								<li>Choose “no context”. Why is there no target at all?</li>
							</ol>
						</div>
					</section>

					<section class="section-block" id="inputlab">
						<div class="section-kicker"><span class="sk-num">04</span> Preparing the input</div>
						<h2 class="section-title">From text to a stream of vectors.</h2>
						<div class="prose">
							<p>
								Tokens become integers, integers become vectors, and position tags each
								vector with its place in the sequence. Change the corpus or the tokenizer
								and the token stream, embedding map, and positional waves update.
							</p>
						</div>
<div class="viz-container" id="transformer-viz-bpe"></div>
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
<div id="transformer-pe-wave-plot" style="width: 100%; height: 300px; margin-top: 20px; background: var(--mn-surface, white); border-radius: 12px; border: 1px solid #e2e8f0;"></div>
<div id="transformer-pe-shift-plot" style="width: 100%; height: 600px; margin-top: 20px; background: var(--mn-surface, white); border-radius: 12px; border: 1px solid #e2e8f0;"></div>
<div id="transformer-pe-integration-results" style="margin-top: 20px;"></div>
						<div class="md" id="ifscalfactornotone" style="display:none">In this example, we're using a scaling factor of <span id="posEmbedScaleFactor">0.1</span> because of the low dimensionality of our space.</div>
					</section>

					<section class="section-block" id="block">
						<div class="section-kicker"><span class="sk-num">05</span> Inside the block</div>
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
						<div class="section-kicker"><span class="sk-num">06</span> From vectors to words</div>
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
<div>
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
<input class="bw-cell" id="transformer-master-token-input" style="width: 90%; font-size: 1.1rem;" type="text" value="the"/>
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

					<section class="section-block" id="realmodel">
						<div class="section-kicker"><span class="sk-num">07</span> The real model</div>
						<h2 class="section-title">Train a tiny transformer.</h2>
						<div class="prose">
							<p>
								Everything above is a real computation, not a cartoon. The demo below is a
								word-level decoder: token and position embeddings, one or two
								multi-head attention blocks, a feed-forward network, a residual stream, layer
								normalisation, an unembedding, and a cross-entropy loss. TensorFlow.js
								computes the gradients, so the Train button really updates the weights. The
								model is tiny (a few thousand parameters), but the operations and the
								formulas are the same as in a large transformer.
							</p>
							<p>
								The forward pass, written out for one block, is below. Each line is an
								operation the code performs; the underbraces name the part that a large model
								scales up.
							</p>
							<p>
								The training card below is the original interactive training demo. Change the
								architecture or the corpus, start training, and watch the loss, the attention
								heads, and the per-layer panels update. The long prose and the code block stay in
								the original lesson; here you get the compact route and the live demos.
							</p>
						</div>
						<div class="formula" data-tex="\underbrace{\begin{aligned} x_i &amp;= \underbrace{E[t_i]}_{\text{token}} + \underbrace{P_i}_{\text{position}} \\ Q &amp;= XW_Q,\quad K = XW_K,\quad V = XW_V \\ S &amp;= \underbrace{\frac{QK^\top}{\sqrt{d_k}}}_{\text{similarity}} \\ A &amp;= \operatorname{softmax}(\operatorname{mask}(S)) \\ H &amp;= \underbrace{AV}_{\text{context}} \\ X &amp;\leftarrow X + \underbrace{\operatorname{Concat}(H_1,\dots,H_h)W_O}_{\text{multi-head attention}} \\ X &amp;\leftarrow X + \underbrace{\operatorname{GELU}(XW_1+b_1)W_2+b_2}_{\text{feed-forward}} \\ z &amp;= \operatorname{LN}(X)W_U \end{aligned}}_{\text{one tiny decoder block, repeated}}">x_i = E[t_i] + P_i; Q=XW_Q, K=XW_K, V=XW_V; S=QKᵀ/√d_k; A=softmax(mask(S)); H=AV; X←X+Concat(H_i)W_O; X←X+GELU(XW_1+b_1)W_2+b_2; z=LN(X)W_U</div>
						<div class="formula" data-tex="\underbrace{\underbrace{\mathcal L = -\frac{1}{T}\sum_{t=1}^{T}\log\operatorname{softmax}(z_t)_{y_t}}_{\text{cross-entropy loss}} \qquad \underbrace{\theta \leftarrow \theta - \eta\frac{\hat m}{\sqrt{\hat v}+\epsilon}}_{\text{Adam update}}}_{\text{what the Train button does}}">L = -1/T Σ log softmax(z_t)[y_t]; θ ← θ − η m̂/(√v̂+ε)</div>
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
<span id="depth-val" style="font-weight: bold; color: #3b82f6;">4</span>
<p style="font-size: 0.8rem; color: #64748b; margin: 4px 0;">How many transformer blocks are stacked. More layers allow more abstract reasoning.</p>
<input id="transformer-depth" max="12" min="1" oninput="document.getElementById('depth-val').innerText = this.value; debounced_run_transformer_demo();" style="width: 100%;" type="range" value="4"/>
</div>
<div style="margin-bottom: 15px;">
<label style="font-weight: bold;">Context Size: </label>
<span id="context-val" style="font-weight: bold; color: #3b82f6;">128</span>
<p style="font-size: 0.75rem; color: #64748b; margin: 2px 0;">
<b>Effect:</b> Sets the maximum number of tokens the model can “see” at once during training and inference.<br/>
<b>Reason:</b> A larger context window lets the model capture longer-range dependencies, but the attention score matrix has size $\text{Context}^2$, so a full forward pass costs quadratically in context length. A <i>KV-Cache</i> avoids recomputing past keys and values during generation — it lowers per-step work and trades it for linear memory — but it does not make attention sub-quadratic.
	    </p>
<input id="transformer-context-size" max="256" min="2" oninput="document.getElementById('context-val').innerText = this.value; debounced_run_transformer_demo();" step="1" style="width: 100%;" type="range" value="128"/>
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
<textarea id="transformer-training-data" oninput="debounced_run_transformer_demo('transformer-training-data')" style="width: 90%; height: 60px; font-family: 'Courier New', monospace; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; background: var(--mn-surface, white); color: var(--mn-text, #1e293b);">the king rules the land and the queen rules the sea</textarea>
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
#tda-toggle-training-windows {
	padding: 4px 12px;
	border-radius: 6px;
	border: 1px solid var(--mn-border, #cbd5e1);
	background: var(--mn-surface, #fff);
	color: var(--mn-text, #0f172a);
	cursor: pointer;
	font-weight: 600;
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
<div id="transformer-train-card">
<div class="transformer-train-controls">
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
<div class="transformer-train-actions">
<button class="btn train-btn" onclick="train_transformer()" type="button">Train Model</button>
<button class="btn" id="tda-toggle-training-windows" onclick="toggleTrainingWindows()" type="button">Show training windows</button>
</div>
</div>
<div class="transformer-train-status" id="training-status"></div>
<div id="training-loss-plot"></div>
</div>
<div id="show_training_sentences" style="display: none">
<p>Current Training Windows: <span id="current_training_sentence"></span></p><br/>
</div>
						<div id="transformer_site"></div>
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


	<script src="assets/site.js"></script>
	<script src="../temml.min.js"></script>
	<script>
	(function () {
		"use strict";

		/* ── pipeline ────────────────────────────────────────── */
		var stages = [
			{
				name: "Tokenize",
				title: "Tokenize",
				text: "Text is cut into subword tokens and mapped to integer IDs. The vocabulary is fixed before training. In GPT-2 byte-level BPE, “the cat sat” becomes [262, 3797, 3332].",
				shape: "\\text{text} \\to [T]"
			},
			{
				name: "Embed",
				title: "Embed",
				text: "Each token ID indexes a row of the embedding matrix W_E, producing a dense vector of dimension d_model. Similar meanings end up near each other in this space, but this is only the first layer.",
				shape: "[T] \\to [T, d_{\\text{model}}]"
			},
			{
				name: "Position",
				title: "Add position",
				text: "								A position signal is added to each embedding (sinusoidal in the original; modern models often use rotary/RoPE, which rotates queries and keys instead). Without it, “dog bites man” and “man bites dog” would be an unordered bag of the same vectors.",
				shape: "[T, d_{\\text{model}}] + [T, d_{\\text{model}}] \\to [T, d_{\\text{model}}]"
			},
			{
				name: "Attention",
				repeat: true,
				title: "Attention + residual",
				text: "Each token projects to a query, key, and value. Scaled dot products decide who attends to whom; softmax normalizes the weights; values are averaged. A causal mask in a decoder hides the future. The result is added back to the residual stream. This is one block in a stack of N blocks; real models repeat that block dozens to hundreds of times, often 32-100+ layers.",
				shape: "[T, d_{\\text{model}}] \\to [T, d_{\\text{model}}]"
			},
			{
				name: "Feed-forward",
				repeat: true,
				title: "Feed-forward + residual",
				text: "A per-token MLP expands the vector (usually 4×), applies a nonlinearity such as GELU or SwiGLU, and contracts it back. Attention routes information; the FFN computes with it. The result is added to the stream again. The attention + feed-forward block repeats N times; the demo shows one pass.",
				shape: "[T, d_{\\text{model}}] \\to [T, 4d_{\\text{model}}] \\to [T, d_{\\text{model}}]"
			},
			{
				name: "Unembed",
				title: "Unembed + sample",
				text: "The final hidden state is multiplied by an unembedding matrix, giving a logit for every vocabulary token. Softmax turns logits into probabilities; a decoding rule samples or takes the argmax; the token is appended and the loop repeats until EOS.",
				shape: "[T, d_{\\text{model}}] \\to [T, |V|] \\to \\text{one distribution}"
			}
		];
		var flow = document.getElementById("pipe-flow");
		var detailTitle = document.getElementById("pipe-title");
		var detailText = document.getElementById("pipe-text");
		var detailShape = document.getElementById("pipe-shape");
		var counter = document.getElementById("pipe-counter");
		var pipeTokens = document.getElementById("pipe-tokens");
		var nextBtn = document.getElementById("pipe-next");
		var resetBtn = document.getElementById("pipe-reset");
		var currentStage = 0;
		var baseTokens = [
			{ w: "the", id: 262 },
			{ w: "cat", id: 3797 },
			{ w: "sat", id: 3332 }
		];
		var continuation = [
			{ w: "on", id: 319 },
			{ w: "the", id: 262 },
			{ w: "mat", id: 2603 },
			{ w: ".", id: 13 }
		];
		var tokens = baseTokens.map(function (t) { return { w: t.w, id: t.id }; });
		var genIndex = 0;
		var runTimer = null;
		var prediction = document.getElementById("pipe-prediction");
		var runBtn = document.getElementById("pipe-run");

		function sentence() {
			return tokens.map(function (t) { return t.w; }).join(" ").replace(/ ([.,!?])/g, "$1");
		}
		function renderTokens(stage) {
			if (!pipeTokens) return;
			pipeTokens.innerHTML = "";
			tokens.forEach(function (t, i) {
				var span = document.createElement("span");
				span.className = "pipe-token" +
					(stage === 0 && i === tokens.length - 1 ? " is-active" : "") +
					(t.isNew ? " is-new" : "");
				span.textContent = t.w + " · " + t.id;
				pipeTokens.appendChild(span);
			});
		}
		function updatePrediction() {
			if (!prediction) return;
			if (currentStage === stages.length - 1) {
				if (genIndex < continuation.length) {
					prediction.innerHTML = 'Next token: <b>' + continuation[genIndex].w + '</b> · predict to append and loop';
				} else {
					prediction.innerHTML = 'Sequence complete: <b>' + sentence() + '</b>';
				}
			} else {
				prediction.innerHTML = 'Next token: <b>...</b> · run to Unembed to predict';
			}
		}
		function selectStage(i) {
			currentStage = TM.clamp(i, 0, stages.length - 1);
			var stage = stages[currentStage];
			if (detailTitle) detailTitle.textContent = stage.title;
			if (detailText) detailText.textContent = stage.text;
			if (detailShape) {
				if (window.temml) {
					try { detailShape.innerHTML = "Shape: " + temml.renderToString(stage.shape, { displayMode: false }); }
					catch (e) { detailShape.textContent = "Shape: " + stage.shape; }
				} else {
					detailShape.textContent = "Shape: " + stage.shape;
				}
			}
			if (counter) counter.textContent = "Stage " + (currentStage + 1) + " of " + stages.length;
			flow.querySelectorAll(".flow-step").forEach(function (b) {
				b.classList.toggle("is-active", parseInt(b.getAttribute("data-stage"), 10) === currentStage);
			});
			renderTokens(currentStage);
			updatePrediction();
			if (nextBtn) {
				if (currentStage < stages.length - 1) nextBtn.textContent = "Next step in pipeline →";
				else if (genIndex < continuation.length) nextBtn.textContent = 'Predict "' + continuation[genIndex].w + '" & append →';
				else nextBtn.textContent = "Start over ↺";
			}
		}
		function stopRun() {
			if (runTimer) { clearInterval(runTimer); runTimer = null; }
			if (runBtn) runBtn.textContent = "Run the loop ▶";
		}
		function appendPrediction() {
			if (genIndex >= continuation.length) { resetLoop(); return; }
			var next = continuation[genIndex];
			tokens.forEach(function (t) { t.isNew = false; });
			tokens.push({ w: next.w, id: next.id, isNew: true });
			genIndex++;
			if (genIndex >= continuation.length) {
				selectStage(stages.length - 1);
				stopRun();
				return;
			}
			currentStage = 0;
			selectStage(0);
			if (prediction) prediction.innerHTML = 'Appended: <b>' + next.w + '</b> · run the loop again';
		}
		function resetLoop() {
			stopRun();
			tokens = baseTokens.map(function (t) { return { w: t.w, id: t.id }; });
			genIndex = 0;
			currentStage = 0;
			selectStage(0);
		}
		if (flow) {
			stages.forEach(function (stage, i) {
				var b = document.createElement("button");
				b.type = "button";
				b.className = "flow-step" + (i === 0 ? " is-active" : "") + (stage.repeat ? " is-loop" : "");
				b.setAttribute("data-stage", i);
				b.innerHTML = '<span class="fs-num">0' + (i + 1) + "</span><b>" + stage.name + "</b>" + (stage.repeat ? '<span class="fs-repeat">× N</span>' : "");
				b.addEventListener("click", function () { stopRun(); selectStage(i); });
				flow.appendChild(b);
			});
			selectStage(0);
		}
		if (nextBtn) {
			nextBtn.addEventListener("click", function () {
				stopRun();
				if (currentStage < stages.length - 1) selectStage(currentStage + 1);
				else if (genIndex < continuation.length) appendPrediction();
				else resetLoop();
			});
		}
		if (runBtn) {
			runBtn.addEventListener("click", function () {
				if (runTimer) { stopRun(); return; }
				runBtn.textContent = "Pause ⏸";
				runTimer = setInterval(function () {
					if (currentStage < stages.length - 1) {
						selectStage(currentStage + 1);
					} else if (genIndex < continuation.length) {
						appendPrediction();
					} else {
						stopRun();
					}
				}, 700);
			});
		}
		if (resetBtn) resetBtn.addEventListener("click", resetLoop);
		var maskToggle = document.getElementById("pipe-mask-toggle");
		var maskWrap = document.getElementById("pipe-mask");
		var cmGrid = document.getElementById("cm-grid");
		if (cmGrid) {
			for (var mi = 0; mi < 6; mi++) {
				for (var mj = 0; mj < 6; mj++) {
					var cell = document.createElement("span");
					cell.className = "cm-cell" + (mj > mi ? " is-masked" : "");
					cell.textContent = mj > mi ? "×" : "•";
					cell.setAttribute("aria-label", "query " + (mi + 1) + ", key " + (mj + 1) + (mj > mi ? ": masked" : ": allowed"));
					cmGrid.appendChild(cell);
				}
			}
		}
		if (maskToggle && maskWrap) {
			maskToggle.addEventListener("click", function () {
				maskWrap.hidden = !maskWrap.hidden;
				maskToggle.textContent = maskWrap.hidden ? "Show causal mask" : "Hide causal mask";
			});
		}

		/* ── layer lens ──────────────────────────────────────── */
		var canvas = document.getElementById("layer-canvas");
		if (!canvas) return;
		var context = "river";
		var layer = 0;
		var slider = document.getElementById("layer-slider");
		var layerNum = document.getElementById("layer-num");
		var layerContext = document.getElementById("layer-context");
		var layerPull = document.getElementById("layer-pull");
		var layerCaption = document.getElementById("layer-caption");
		var clusters = {
			river: { x: 0.25, y: 0.66, label: "river / water", color: "#5c9baf" },
			finance: { x: 0.76, y: 0.34, label: "finance / money", color: "#9f9700" }
		};
		var start = { x: 0.5, y: 0.5 };
		var maxPull = 0.8;
		var api = TM.initCanvas(canvas, function (ctx, w, h) {
			var c = TM.colors();
			ctx.clearRect(0, 0, w, h);
			ctx.strokeStyle = c.dark ? "rgba(92, 155, 175, .1)" : "rgba(0,75,111,.07)";
			ctx.lineWidth = 1;
			for (var gx = 0; gx < w; gx += 44) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
			for (var gy = 0; gy < h; gy += 44) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
			Object.keys(clusters).forEach(function (key) {
				var cl = clusters[key];
				var x = cl.x * w, y = cl.y * h;
				var g = ctx.createRadialGradient(x, y, 2, x, y, 90);
				g.addColorStop(0, cl.color + "55");
				g.addColorStop(1, cl.color + "00");
				ctx.beginPath(); ctx.arc(x, y, 90, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
				ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fillStyle = cl.color; ctx.fill();
				ctx.font = "600 10px Barlow, system-ui, sans-serif";
				ctx.fillStyle = c.muted;
				ctx.textAlign = "center";
				ctx.fillText(cl.label, x, y + 20);
			});
			var path = [];
			for (var i = 0; i <= 11; i++) {
				var t = i / 11;
				var target = context === "river" ? clusters.river : context === "loan" ? clusters.finance : start;
				var curve = context === "none" ? 0 : maxPull * (1 - Math.cos(t * Math.PI)) / 2;
				var other = context === "river" ? clusters.finance : context === "loan" ? clusters.river : start;
				var noise = context === "none" ? 0 : 0.035 * Math.sin(i * 2.4 + 0.8) * Math.sin(t * Math.PI) * curve;
				path.push({
					x: TM.lerp(start.x, target.x, curve) + (other.x - target.x) * noise,
					y: TM.lerp(start.y, target.y, curve * (1 + 0.18 * Math.sin(t * Math.PI))) + (other.y - target.y) * noise
				});
			}
			ctx.beginPath();
			path.forEach(function (p, i) {
				if (i === 0) ctx.moveTo(p.x * w, p.y * h);
				else ctx.lineTo(p.x * w, p.y * h);
			});
			ctx.strokeStyle = c.dark ? "rgba(238,247,244,.28)" : "rgba(0,75,111,.25)";
			ctx.setLineDash([3, 4]);
			ctx.lineWidth = 1.2;
			ctx.stroke();
			ctx.setLineDash([]);
			path.forEach(function (p, i) {
				ctx.beginPath();
				ctx.arc(p.x * w, p.y * h, i === layer ? 7 : 2.5, 0, Math.PI * 2);
				ctx.fillStyle = i === layer ? c.green : c.lineStrong;
				ctx.fill();
				if (i === layer) {
					ctx.strokeStyle = c.card;
					ctx.lineWidth = 2;
					ctx.stroke();
				}
			});
			var cur = path[layer];
			ctx.font = "700 12px Barlow, system-ui, sans-serif";
			ctx.fillStyle = c.ink;
			ctx.textAlign = "center";
			ctx.fillText("bank", cur.x * w, cur.y * h - 12);
			if (layerNum) layerNum.textContent = layer + " / 11";
			if (layerContext) layerContext.textContent = context === "river" ? "river bank" : context === "loan" ? "bank loan" : "no context";
			var pull = context === "none" ? 0 : maxPull * (1 - Math.cos((layer / 11) * Math.PI)) / 2;
			if (layerPull) layerPull.textContent = context === "none" ? "neutral" : Math.round(pull * 100) + "% " + (context === "river" ? "water" : "finance");
			if (layerCaption) {
				if (layer === 0) layerCaption.textContent = "At the input, “bank” sits between the clusters. Context has not pulled it yet.";
				else if (context === "none") layerCaption.textContent = "Without context, the word has no target to move toward. The sentence is what gives it one.";
				else if (layer > 7) layerCaption.textContent = "Deep in the stack, the pull is strong, but “bank” still keeps its lexical sense; it approaches the " + (context === "river" ? "river" : "finance") + " cluster without becoming that prototype. The small wobble is the rest of the sentence contributing.";
				else layerCaption.textContent = "Each layer reads the residual stream, computes an update, and adds it back. The path wobbles a little: every token contributes, not only the word that sets the main direction.";
			}
		});
		document.querySelectorAll("[data-ctx]").forEach(function (btn) {
			btn.addEventListener("click", function () {
				document.querySelectorAll("[data-ctx]").forEach(function (x) { x.classList.remove("is-on"); });
				btn.classList.add("is-on");
				context = btn.getAttribute("data-ctx");
				api.redraw();
			});
		});
		if (slider) {
			slider.addEventListener("input", function () {
				layer = parseInt(slider.value, 10);
				var out = document.getElementById("layer-out");
				if (out) out.textContent = layer;
				api.redraw();
			});
		}
		window.addEventListener("tm:theme", function () { api.redraw(); });
	})();
	</script>


	<script src="assets/full/vendor/jquery-3.7.1.min.js"></script>
	<script src="assets/full/vendor/plotly-2.24.1.min.js"></script>
	<script src="assets/full/vendor/echarts.min.js"></script>
	<script src="assets/full/vendor/echarts-gl.min.js"></script>
	<script src="assets/full/vendor/tf.min.js"></script>
	<script src="assets/full/shim.js"></script>
	<script src="assets/full/transformer.js"></script>
	<script src="assets/full/attention_engine.js"></script>
	<script src="assets/full/llm_river.js"></script>
	<script src="assets/full/provenance.js"></script>
	<script src="assets/full/transformer_layer_summary.js"></script>
	<script src="assets/full/demo-render.js"></script>
	<script>
	document.addEventListener("DOMContentLoaded", function () {
		if (typeof loadTransformerModule === "function") loadTransformerModule();
	});
	</script>
</body>
</html>
