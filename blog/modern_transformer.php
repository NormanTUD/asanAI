<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Modern Transformer Lab: RoPE, RMSNorm, GQA, SwiGLU
description: Rotate positions with RoPE and switch the modern block pieces, then watch one forward pass change.
icon: &#129516;
part: 4
order: 19
color: emerald
topics: architecture, math-ii, programming
tags: math-heavy, code-heavy
math: 60
-->

<style>
.mtl-wrap { display: grid; gap: 16px; }
.mtl-hero {
	position: relative; overflow: hidden; border-radius: 18px; padding: 22px 24px;
	background:
		radial-gradient(circle at 12% 10%, rgba(59,130,246,.22), transparent 34%),
		radial-gradient(circle at 88% 20%, rgba(16,185,129,.20), transparent 32%),
		linear-gradient(135deg, var(--mn-surface, #fff), var(--mn-bg-subtle, #f8fafc));
	border: 1px solid var(--mn-border, #cbd5e1);
	box-shadow: 0 14px 40px rgba(15, 23, 42, .08);
}
.mtl-hero h2 { margin: 0 0 6px; font-size: clamp(1.25rem, 2.2vw, 1.7rem); }
.mtl-hero p { margin: 0; color: var(--mn-text-secondary, #475569); max-width: 74ch; }
.mtl-panel {
	border: 1px solid var(--mn-border, #cbd5e1);
	border-radius: 16px; padding: 16px;
	background: color-mix(in srgb, var(--mn-surface, #fff) 88%, var(--mn-bg-subtle, #f8fafc));
	box-shadow: 0 8px 26px rgba(15, 23, 42, .06);
}
.mtl-controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px 14px; align-items: end; }
.mtl-control { display: grid; gap: 4px; font-size: .84rem; }
.mtl-control label { font-weight: 700; color: var(--mn-text, #0f172a); }
.mtl-control select, .mtl-control input[type="range"] { width: 100%; }
.mtl-readout { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.mtl-chip {
	display: inline-flex; align-items: center; gap: 6px; padding: 5px 9px;
	border-radius: 999px; border: 1px solid var(--mn-border, #cbd5e1);
	background: var(--mn-surface, #fff); color: var(--mn-text-secondary, #475569);
	font: 700 .72rem/1.2 "Open Sans", system-ui, sans-serif;
}
.mtl-chip b { color: var(--mn-text, #0f172a); }
.mtl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 900px) { .mtl-grid { grid-template-columns: 1fr; } }
.mtl-plot { width: 100%; min-height: 360px; }
.mtl-small { min-height: 250px; }
.mtl-note { font-size: .8rem; line-height: 1.5; color: var(--mn-text-secondary, #475569); margin: 8px 0 0; }
.mtl-swatch { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
.mtl-code {
	font-family: "Courier New", monospace; font-size: .78rem; line-height: 1.55;
	background: var(--mn-bg-subtle, #f1f5f9); border: 1px solid var(--mn-border, #cbd5e1);
	border-radius: 10px; padding: 10px 12px; color: var(--mn-text, #0f172a);
}
.mtl-pill { display: inline-block; padding: 2px 7px; border-radius: 999px; background: rgba(59,130,246,.12); color: #2563eb; font-weight: 700; }
</style>

<div class="md" data-lesson-id="modern_transformer">
<div class="mtl-hero">
<h2>Modern Transformer Lab</h2>
<p>One forward pass, many design choices. Switch the block components that separate the 2017 Transformer from a modern LLaMA/Qwen/DeepSeek-style model, then look at the same sentence through each setting. The weights are random and fixed; this page is for seeing the computation, not for training a useful model.</p>
</div>
</div>

<div class="md">
## The block is no longer just attention plus an MLP

The 2017 baseline is the original Transformer (\cite[Vaswani et al., 2017]{vaswani2017attention}); modern open-weight models keep its residual skeleton but replace several parts: RMSNorm instead of LayerNorm, RoPE instead of additive position vectors, SwiGLU instead of GELU, grouped-query attention instead of full MHA, and usually a final normalization with a separate output head. The controls below change one forward pass of a four-token sentence.
</div>

<div class="mtl-panel">
	<div class="mtl-controls">
		<div class="mtl-control">
			<label for="mtl-norm">Normalization</label>
			<select id="mtl-norm">
				<option value="rms" selected>RMSNorm (modern)</option>
				<option value="ln">LayerNorm (2017 / GPT-2)</option>
			</select>
		</div>
		<div class="mtl-control">
			<label for="mtl-pos">Position</label>
			<select id="mtl-pos">
				<option value="rope" selected>RoPE (rotary)</option>
				<option value="sin">Sinusoidal absolute</option>
			</select>
		</div>
		<div class="mtl-control">
			<label for="mtl-attn">Attention</label>
			<select id="mtl-attn">
				<option value="gqa" selected>GQA (shared K/V heads)</option>
				<option value="mha">MHA (one K/V per query head)</option>
			</select>
		</div>
		<div class="mtl-control">
			<label for="mtl-ffn">Feed-forward</label>
			<select id="mtl-ffn">
				<option value="swiglu" selected>SwiGLU (gated)</option>
				<option value="gelu">GELU dense</option>
				<option value="moe">MoE, 2 experts (toy)</option>
			</select>
		</div>
		<div class="mtl-control">
			<label for="mtl-final">Final normalization</label>
			<select id="mtl-final">
				<option value="on" selected>On (production)</option>
				<option value="off">Off (toy demo)</option>
			</select>
		</div>
		<div class="mtl-control">
			<label for="mtl-head">Output head</label>
			<select id="mtl-head">
				<option value="untied" selected>Separate (modern)</option>
				<option value="tied">Tied to embeddings (GPT-2)</option>
			</select>
		</div>
		<div class="mtl-control">
			<label for="mtl-qk">Q/K normalization</label>
			<select id="mtl-qk">
				<option value="on" selected>On (Qwen3-style)</option>
				<option value="off">Off</option>
			</select>
		</div>
		<div class="mtl-control">
			<label for="mtl-bias">Attention bias</label>
			<select id="mtl-bias">
				<option value="off" selected>Off (Llama/Qwen3/DeepSeek)</option>
				<option value="on">On (GPT-2/Qwen2)</option>
			</select>
		</div>
	</div>
	<div class="mtl-readout" id="mtl-readout"></div>
	<p class="mtl-note">The settings are independent. “Modern” below means the first option in every select: RMSNorm + RoPE + GQA + SwiGLU + final norm + separate head + QK norm + no attention bias. That is the modern block used in this lab; the scale (4 tokens, d_model = 8) is deliberately tiny.</p>
</div>

<div class="mtl-grid" style="margin-top:14px;">
	<div class="mtl-panel">
		<h3 style="margin:0 0 6px;">Attention pattern</h3>
		<div id="mtl-attention" class="mtl-plot"></div>
		<p class="mtl-note" id="mtl-attention-note"></p>
	</div>
	<div class="mtl-panel">
		<h3 style="margin:0 0 6px;">Final next-token scores</h3>
		<div id="mtl-logits" class="mtl-plot"></div>
		<p class="mtl-note" id="mtl-logits-note"></p>
	</div>
</div>

<div class="md">
### RoPE: position is a rotation, not an addition

Sinusoidal and learned schemes *add* a position vector to the token embedding. RoPE leaves the embedding alone and rotates the query and key vectors by an angle proportional to their position. The dot product of two rotated vectors depends on the **difference** of their angles, so the attention score becomes naturally relative (\cite[Su et al., 2021]{su2021rope}).

<div>
$$ \underbrace{q_m = R_{\Theta,m} W_q x_m}_{\text{rotate the query by its position}},\qquad \underbrace{q_m^\top k_n = \left(R_{\Theta,m}W_q x_m\right)^\top\left(R_{\Theta,n}W_k x_n\right)}_{\text{only the angle difference }(m-n)\text{ survives}} $$
</div>
</div>

<div class="mtl-panel" id="mtl-rope-lab">
	<div class="mtl-controls">
		<div class="mtl-control">
			<label for="mtl-m">Query position m: <b id="mtl-m-val">3</b></label>
			<input type="range" id="mtl-m" min="0" max="15" value="3">
		</div>
		<div class="mtl-control">
			<label for="mtl-n">Key position n: <b id="mtl-n-val">1</b></label>
			<input type="range" id="mtl-n" min="0" max="15" value="1">
		</div>
		<div class="mtl-control">
			<label for="mtl-pair">Frequency pair: <b id="mtl-pair-val">0</b></label>
			<input type="range" id="mtl-pair" min="0" max="3" value="0">
		</div>
		<div class="mtl-control">
			<label for="mtl-theta">RoPE base theta: <b id="mtl-theta-val">10000</b></label>
			<input type="range" id="mtl-theta" min="100" max="100000" step="100" value="10000">
		</div>
	</div>
	<div class="mtl-grid" style="margin-top:12px;">
		<div>
			<div id="mtl-rope-vectors" class="mtl-plot mtl-small"></div>
		</div>
		<div>
			<div id="mtl-rope-score" class="mtl-plot mtl-small"></div>
			<p class="mtl-note" id="mtl-rope-readout"></p>
		</div>
	</div>
	<p class="mtl-note">The vectors are drawn in one two-dimensional frequency plane. RoPE rotates the query by <span class="mtl-pill">m·ω</span> and the key by <span class="mtl-pill">n·ω</span>. The dot product is <span class="mtl-pill">cos((m−n)·ω)</span>: only the relative offset survives. The second plot shows that relative score as the distance changes.</p>
</div>

<div class="md">
### What changed, and what stayed the same

| Piece | 2017 / GPT-2-style | Modern open-weight block |
|---|---|---|
| Normalization | LayerNorm (mean, gamma, beta) | RMSNorm (no mean, no beta) (\cite[Zhang & Sennrich, 2019]{zhang2019rmsnorm}) |
| Position | added sinusoidal or learned vector | RoPE applied to Q and K |
| Attention | MHA, one K/V head per query head | GQA (\cite[Ainslie et al., 2023]{ainslie2023gqa}); DeepSeek uses MLA instead |
| Feed-forward | dense GELU, often 4× width | SwiGLU gate, no biases, narrower width (\cite[Shazeer, 2020]{shazeer2020glu}); large models may replace it with MoE |
| Final norm | one final LayerNorm | final RMSNorm |
| Output head | often tied to embeddings | usually separate |

The residual stream, causal mask, next-token cross-entropy and the idea “attention mixes, the FFN transforms” remain the same. This is why the modern block still reads as a Transformer, even though several named parts changed.
</div>

<div class="mn-quiz" data-quiz="modern_transformer"><script type="application/json">{"title": "Modern transformer", "questions": [{"q": "What does RoPE rotate?", "options": ["The query and key vectors by position-dependent angles", "The token embedding before the first layer, like a positional vector", "Only the value vectors, leaving queries and keys unchanged", "The final residual stream just before the output head"], "answer": 0, "explain": "Rotating Q and K makes their dot product depend on the relative offset."}, {"q": "How does RMSNorm differ from LayerNorm?", "options": ["It divides by the root mean square and subtracts no mean", "It normalizes across the batch instead of each token", "It removes the learned scale parameter entirely from every layer", "It applies only after the final transformer block"], "answer": 0, "explain": "RMSNorm keeps the per-token scale but drops mean subtraction and the shift."}, {"q": "What does GQA share?", "options": ["One key/value head across a group of query heads", "The same query vector across every token position", "The feed-forward weights between all layers", "The output head with the token embedding matrix"], "answer": 0, "explain": "GQA reduces the KV cache while keeping several query heads."}, {"q": "What makes SwiGLU a gated feed-forward layer?", "options": ["One branch is activated and multiplied by another linear branch", "It concatenates the attention output directly onto the feed-forward output", "It uses a softmax over the hidden width before the second matrix", "It replaces the residual connection with a learned gate"], "answer": 0, "explain": "The gate branch controls how much of each expanded feature reaches the output."}]}</script></div>
