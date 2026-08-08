<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Attention: The Semantic Tug-of-War
description: How Transformers overcome RNN signal decay, direct access across any distance.
icon: &#128269;
part: 4
order: 21
color: sky
topics: architecture, math-i, math-ii
-->

<div class="md">
## Long Distance Dependencies

RNNs propagate information **step by step**, a signal from token 1 to token 50 must survive 49 sequential multiplications. If the weight matrix has spectral radius $< 1$, the signal decays exponentially:

$$\text{Signal}_{1 \to 50} \approx \lambda^{49}, \quad \lambda < 1$$

Self-attention bypasses this entirely. Every token attends to every other in **one step**:

$$\alpha_{i,j} = \text{softmax}\!\left(\frac{\mathbf{q}_i \cdot \mathbf{k}_j}{\sqrt{d_k}}\right)$$

The score depends on **semantic compatibility**, not positional distance. Token 1 can attend to token 500 with the same directness as token 1 attending to token 2.

Drag the slider below to insert distractor tokens between a subject and its pronoun. The Transformer's attention remains flat; an RNN's signal decays with every added step.
</div>

<div style="background:var(--mn-surface, #f8fafc); padding:20px; border-radius:12px; border:1px solid var(--mn-border, #e2e8f0);
            margin:15px 0; max-width:720px; margin-left:auto; margin-right:auto;">

    <div style="text-align:center; margin-bottom:8px;">
        <span style="font-size:1.05rem; font-weight:bold; color:var(--mn-text, #1e293b);">
            Long Distance: Transformer vs. RNN signal strength
        </span>
    </div>

    <div id="ldd-sentence" style="padding:10px 16px; margin-bottom:14px; background: var(--mn-surface, #fff);
         border-left:4px solid #2563eb; border-radius:6px; font-style:italic; color:var(--mn-text, #334155);
         transition: border-color 0.2s; min-height:50px; line-height:1.6; overflow-x:auto; white-space:nowrap;"></div>

    <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
        <span style="font-size:0.85rem; color:var(--mn-text-secondary, #64748b); font-weight:bold;">0</span>
        <input type="range" id="ldd-distance" min="0" max="15" step="1" value="3"
               style="flex:1; accent-color:#2563eb;" oninput="updateLDD()">
        <span style="font-size:0.85rem; color:var(--mn-text-secondary, #64748b); font-weight:bold;">15</span>
        <span id="ldd-distance-val"
              style="font-size:1.2rem; font-weight:bold; color:#2563eb; min-width:30px; text-align:right;">3</span>
        <span style="font-size:0.8rem; color:var(--mn-text-secondary, #64748b);">distractors</span>
    </div>

    <canvas id="ldd-canvas" width="700" height="260"
            style="display:block; width:100%; height:260px; border:1px solid var(--mn-border, #e2e8f0); border-radius:8px; background: var(--mn-surface, #fff);"></canvas>

    <div id="ldd-math" style="margin-top:12px; padding:10px; background: var(--mn-surface, #fff); border-radius:8px;
         border:1px dashed var(--mn-border, #cbd5e1); overflow-x:auto;"></div>
</div>

<div class="md">
This costs $O(L^2)$ memory and compute, doubling context quadruples cost. But for capturing dependencies across distance, **direct access beats sequential propagation**.

In a Transformer model, words don't live in a dictionary; they live in a **Semantic Universe**. Every concept, from "apple" to "existentialism", is assigned a specific coordinate in a high-dimensional map. However, some words suffer from a serious identity crisis.

Even though in this example, we treat tokens as words, they can also be parts of words or single characters like a comma or a semicolon due to *Byte-Pair-Encodings*, invented by \citeauthor{gage1994bpe}.

In the history of linguistics, the work of \citeauthor{firth1957distributive} (\citeyear{firth1957distributive}) provides the theoretical bedrock for modern word embeddings. Known as the Distributional Hypothesis, his famous maxim, "You shall know a word by the company it keeps", suggests that words occurring in similar contexts share similar meanings. This shift away from fixed dictionary definitions to context-based identity allowed later researchers like \citeauthor{mikolov2013word2vec} (\citeyear{mikolov2013word2vec}) to mathematically map language into the vector spaces we see in modern LLMs today.

## The Semantic GPS
Take the word **"Bank."** In isolation, its vector sits in a "neutral" zone, mathematically halfway between a nature walk and a trip to the vault. It is ambiguous because its coordinate hasn't been "anchored" yet.

The **Self-Attention mechanism** acts as a semantic GPS. It looks at the surrounding words to calculate a "pull" that drags a word toward its intended meaning:

* **The Vector Shift:** If the word "river" is nearby, it exerts a gravitational force on "bank," dragging its coordinates away from finance and toward nature.
* **The Resulting Embedding:** The final position (represented by the **blue diamond** in the plot below) is the "contextualized" version of the word, informed by its neighbors.

## Geometric Intuition: Why *That* Equation?

The attention equation looks deceptively simple:

$$\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^T}{\sqrt{d_k}}\right) V$$

We divide by $\sqrt{d_k}$ for a very specific reason: **variance control**.

If $Q$ and $K$ have entries drawn from a distribution with mean 0 and variance 1, then their dot product $Q \cdot K = \sum_{i=1}^{d_k} q_i k_i$ has:
$$\text{Var}(Q \cdot K) = d_k$$

As the dimensionality $d_k$ increases, the standard deviation grows as $\sqrt{d_k}$. Dividing by $\sqrt{d_k}$ normalizes the variance back to 1:
$$\text{Var}\left(\frac{Q \cdot K}{\sqrt{d_k}}\right) = 1$$

**The "Aha!" Moment:** Without this scaling, if $d_k = 64$, your dot products would have a standard deviation of ~8. Applying Softmax over values spread across a wide range (like $[-24, +24]$) produces "near-one-hot" outputs, where one token gets ~100% of the weight and everything else gets ~0%. This causes gradients to vanish and learning to die.

The $\sqrt{d_k}$ division keeps scores in the **"Goldilocks zone"** where softmax produces soft distributions that gradients can flow through. It is the difference between asking "rate this restaurant 1–10" (useful) vs. "rate it 1–10,000,000" (where nuance is lost).

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right) V$$

But *why* this specific formula? Why dot products? Why softmax? Why $\sqrt{d_k}$?

The best way to understand is to **see it working** in spaces small enough to visualize. The interactive demo below builds the equation **from the inside out**: every click of *Next* reveals one more piece of the formula and shows you exactly what that piece does to the vectors in 3D space.

### Anatomy of Attention: An Interactive Walkthrough

You will see each part of the equation appear one layer at a time, with the corresponding geometric operation highlighted in the 3D plot above. The underbraces below the equation track which piece is currently being computed. Drag the 3D plot to rotate the scene and watch the vectors from any angle.

The walkthrough proceeds through these eight steps:

1. **The Cast** — introduce the Query $\mathbf{q}$ and the three Keys $\mathbf{k}_1, \mathbf{k}_2, \mathbf{k}_3$ in $d_k=3$ dimensional space.
2. **Element-wise product** — the dot product is built from three scalar products, one per dimension.
3. **The dot product** — sum the products into a single scalar score per key.
4. **Scale by $1/\sqrt{d_k}$** — variance control to keep softmax in its usable range.
5. **Exponentiate** — amplify differences between scores.
6. **Normalize via softmax** — turn raw scores into a probability distribution.
7. **Switch to value vectors** — bring in the $\mathbf{v}_j$ that carry the actual semantic content.
8. **Weighted sum** — combine the values into the final output $\mathbf{z}$.

This is the **mechanical truth** of attention. Every other interpretation — the tug-of-war, the database lookup, the Hopfield retrieval — is a metaphor layered on top of these concrete operations.
</div>

<!-- ===================== ANATOMY OF ATTENTION: STEP-BY-STEP ===================== -->
<style>
/* Hover tooltip — appears when the user mouses over an arrow in the
   2D plot. Shows the exact Temml formula + a plain-language
   explanation of where that vector comes from mathematically. */
.attn-vector-tooltip {
	position: fixed;
	display: none;
	background: var(--mn-surface, #fff);
	border: 1px solid #2563eb;
	border-radius: 10px;
	padding: 14px 18px;
	box-shadow: 0 6px 20px rgba(15, 23, 42, 0.20);
	z-index: 10000;
	pointer-events: none;
	max-width: 600px;
	width: max-content;
	min-width: 280px;
	color: var(--mn-text, #1e293b);
}
.attn-vector-tooltip.active {
	display: block;
}
.attn-vector-tooltip .tt-name {
	font-weight: bold;
	color: #2563eb;
	margin-bottom: 8px;
	font-size: 0.95rem;
	letter-spacing: 0.2px;
}
/* Plain-language "what this MEANS" headline — shown first, above the
   math, so the intuition is never buried under formulas. */
.attn-vector-tooltip .tt-intuition {
	background: #eff6ff;
	border-left: 3px solid #2563eb;
	padding: 10px 12px;
	border-radius: 0 6px 6px 0;
	margin: 0 0 10px 0;
	font-size: 0.9rem;
	line-height: 1.5;
	color: var(--mn-text, #1e293b);
}
.attn-vector-tooltip .tt-intuition math {
	background: transparent !important;
}
/* Concrete equation box with underbrace-style label. The equation is
   now rendered as real Temml math with a \underbrace, so the label
   below the box border is decorative only. */
.attn-vector-tooltip .tt-concrete {
	margin: 0 0 10px 0;
	padding: 12px 16px 8px;
	background: var(--mn-surface-raised, #f1f5f9);
	border: 1px solid var(--mn-border, #cbd5e1);
	border-radius: 6px;
	text-align: center;
	color: var(--mn-text, #1e293b);
	/* Formulas size to their content — the tooltip clamps to the
	   viewport in JS so a long chain still stays on screen. */
	white-space: nowrap;
}
.attn-vector-tooltip .tt-formula {
	margin: 0 0 10px 0;
	padding: 14px 16px;
	background: var(--mn-surface-raised, #f1f5f9);
	border: 1px solid var(--mn-border, #cbd5e1);
	border-radius: 6px;
	text-align: center;
	font-size: 1rem;
	color: var(--mn-text, #1e293b);
	white-space: nowrap;
}
.attn-vector-tooltip .tt-desc {
	max-width: 380px;
}
.attn-vector-tooltip .tt-formula math,
.attn-vector-tooltip .tt-concrete math {
	background: transparent !important;
}
.attn-vector-tooltip .tt-formula::-webkit-scrollbar,
.attn-vector-tooltip .tt-concrete::-webkit-scrollbar {
	height: 6px;
}
.attn-vector-tooltip .tt-formula::-webkit-scrollbar-thumb,
.attn-vector-tooltip .tt-concrete::-webkit-scrollbar-thumb {
	background: var(--mn-border, #cbd5e1);
	border-radius: 3px;
}
/* Dark-mode fallback for both concrete box and formula box */
body.theme-dark .attn-vector-tooltip .tt-concrete,
.dark .attn-vector-tooltip .tt-concrete,
[data-theme="dark"] .attn-vector-tooltip .tt-concrete,
body.theme-dark .attn-vector-tooltip .tt-formula,
.dark .attn-vector-tooltip .tt-formula,
[data-theme="dark"] .attn-vector-tooltip .tt-formula {
	background: #1e293b;
	border-color: #475569;
	color: #f1f5f9;
}
body.theme-dark .attn-vector-tooltip .tt-intuition,
.dark .attn-vector-tooltip .tt-intuition,
[data-theme="dark"] .attn-vector-tooltip .tt-intuition {
	background: #172554;
	border-left-color: #3b82f6;
	color: #dbeafe;
}
.attn-vector-tooltip .tt-desc {
	color: var(--mn-text, #1e293b);
	line-height: 1.5;
	font-size: 0.88rem;
}

/* Header strip with step controls (sits AT THE TOP so it never moves) */
.attn-anatomy-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	padding: 8px 12px;
	background: var(--mn-surface, #fff);
	border: 1px solid var(--mn-border, #e2e8f0);
	border-radius: 10px;
	margin-bottom: 14px;
	flex-wrap: wrap;
}

/* Grid: equation spans FULL WIDTH on the first row. Below it,
   computation goes on the left and the 2D plot goes on the right —
    tall, uses the full remaining vertical space. */
.attn-anatomy-grid {
	display: grid;
	grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
	grid-template-rows: auto auto auto 1fr;
	gap: 12px;
	width: 100%;
}
@media (max-width: 880px) {
	.attn-anatomy-grid {
		grid-template-columns: 1fr;
		grid-template-rows: auto auto auto auto 1fr;
	}
}
.attn-grid-equation {
	grid-column: 1 / -1;
	grid-row: 1;
	margin-bottom: 0;
}
.attn-grid-debug {
	grid-column: 1 / -1;
	grid-row: 2;
	margin: 0;
}
.attn-grid-computation {
	grid-column: 1;
	grid-row: 3 / span 2;
	min-width: 0;
	overflow: hidden;
}
.attn-anatomy-2d-wrap {
	grid-column: 2;
	grid-row: 3;
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 0;
	min-height: 0;
	overflow: hidden;
}
/* When the 2D SVG is collapsed (step 10 matrix / step 11 selfattn) the
   computation panel takes the full width so the table / plots get
   all the horizontal space. The 2D wrap is hidden entirely. */
.attn-anatomy-grid.attn-grid-svg-collapsed .attn-grid-computation {
	grid-column: 1 / -1;
	grid-row: 3 / span 2;
}
.attn-anatomy-grid.attn-grid-svg-collapsed .attn-anatomy-equation {
	grid-column: 1 / -1;
}
.attn-anatomy-grid.attn-grid-svg-collapsed .attn-anatomy-2d-wrap {
	display: none;
}
/* Custom SVG-based 2D plot. Replaces Plotly entirely so we have
   full control over mouse events (no more swallowed events). The
   plot keeps its square aspect ratio (height:auto from the viewBox);
   the geometric intuition panel for the current step sits right
   beneath it, inside the plot column. */
#attn-anatomy-2d-svg {
	flex: 1 1 auto;
	width: 100%;
	height: 100%;
	min-height: 380px;
	min-width: 0;
	display: block;
	background: var(--mn-surface, #fff);
	transition: opacity 0.18s ease, max-height 0.18s ease, min-height 0.18s ease, margin 0.18s ease;
	overflow: hidden;
	border: 1px solid var(--mn-border, #e2e8f0);
	border-radius: 8px;
}
/* In step 10 (matrix) and step 11 (selfattn) the actual visualisation
   lives in the computation panel. Collapse the 2D SVG so it doesn't
   take up vertical space and the table / plots get the full width. */
#attn-anatomy-2d-svg.attn-svg-collapsed {
	opacity: 0;
	max-height: 0;
	min-height: 0;
	margin: 0;
	padding: 0;
	border: 0;
	pointer-events: none;
}
	border: 1px solid var(--mn-border, #e2e8f0);
	border-radius: 8px;
	cursor: crosshair;
	user-select: none;
	-webkit-user-select: none;
	touch-action: none;
	-webkit-tap-highlight-color: transparent;
	-webkit-user-drag: none;
	user-drag: none;
}

/* Sentence display — one box per token, hover to focus on its vectors. */
.attn-sentence {
	text-align: center;
	font-family: 'Inter', -apple-system, sans-serif;
	font-size: 1.15rem;
	padding: 6px 0 8px 0;
	line-height: 1.6;
	letter-spacing: 0.5px;
}
.attn-sentence .attn-token {
	display: inline-block;
	padding: 3px 10px;
	margin: 0 3px;
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.15s ease;
	border: 1px solid transparent;
	font-weight: 600;
}
.attn-sentence .attn-token:hover {
	background: rgba(37, 99, 235, 0.12);
	border-color: rgba(37, 99, 235, 0.45);
	transform: translateY(-1px);
	box-shadow: 0 2px 6px rgba(37, 99, 235, 0.15);
}
.attn-sentence .attn-token.it { color: #ef4444; }
.attn-sentence .attn-token.t1 { color: #2563eb; }
.attn-sentence .attn-token.t2 { color: #3b82f6; }
.attn-sentence .attn-token.t3 { color: #60a5fa; }

/* Bar-plots SVG — sits under the 2D scene, its own space. */
#attn-bar-plots-svg {
	width: 100%;
	height: 110px;
	display: none;  /* Hidden by default — JS shows it only when bars exist */
	background: var(--mn-surface, #fff);
	margin-top: 4px;
	border: 1px solid var(--mn-border, #e2e8f0);
	border-radius: 8px;
}

/* Live debug panel — shows hover state, step, tokens, errors.
   user-select:all so the user can select-all and paste into a
   bug report without manually selecting each line.
   Constrained to the right column on wide screens so it doesn't
   overlap the sentence row. */
.attn-debug-panel {
	font-family: 'SF Mono','Menlo','Consolas','Courier New',monospace;
	font-size: 0.78rem;
	line-height: 1.5;
	color: #f1f5f9;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 6px;
	padding: 8px 12px;
	margin: 0;
	max-width: 100%;
	white-space: pre-wrap;
	word-break: break-word;
	user-select: all;
	-webkit-user-select: all;
	max-height: 180px;
	overflow-y: auto;
	position: relative;
	z-index: 5;
}
.attn-debug-panel .dbg-err {
	color: #fca5a5;
	font-weight: 700;
}
.attn-debug-panel .dbg-ok {
	color: #86efac;
}
.attn-debug-panel .dbg-label {
	color: #93c5fd;
}

/* Token info / formula cone panel — inline below the sentence, sits
   BETWEEN the sentence and the 2D plot. min-height is set large enough
   to hold the tallest possible content (light cone with 8+ formula
   lines) so the plot NEVER shifts when the user hovers different things. */
.attn-token-info {
	position: relative;
	display: block;
	margin: 6px auto 4px auto;
	max-width: 780px;
	min-height: 200px;
	padding: 10px 16px;
	background: var(--mn-surface, #fff);
	border: 1px solid rgba(37, 99, 235, 0.35);
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
	font-family: 'Inter', -apple-system, sans-serif;
	font-size: 0.92rem;
	line-height: 1.5;
	color: var(--mn-text, #1e293b);
	opacity: 1;
	transition: opacity 0.18s ease;
}
.attn-token-info.is-empty {
	opacity: 0;
	pointer-events: none;
}
.attn-token-info h4 {
	margin: 0 0 8px 0;
	font-size: 1.05rem;
	font-weight: 700;
	color: #1e3a8a;
}
.attn-token-info .ti-row {
	display: block;
	margin: 4px 0;
	padding: 3px 0;
}
.attn-token-info .ti-cone {
	margin-top: 8px;
	padding-top: 8px;
	border-top: 1px dashed rgba(37,99,235,0.35);
	font-size: 0.92rem;
	color: var(--mn-text, #1e293b);
}
.attn-token-info .ti-cone b {
	color: #1e3a8a;
}
.attn-token-info .ti-cone-line {
	padding: 3px 0;
}
.attn-token-info .ti-cone {
	font-size: 0.78rem;
	color: var(--mn-text-muted, #64748b);
	border-top: 1px dashed rgba(37,99,235,0.25);
	margin-top: 6px;
	padding-top: 6px;
}
.attn-token-info .ti-cone-line {
	padding: 2px 0;
}
.attn-token-info .ti-cone-step {
	color: #1d4ed8;
	font-weight: 600;
	margin-top: 4px;
	padding: 2px 0;
	border-top: 1px dotted rgba(37,99,235,0.15);
}
.attn-token-info .ti-cone-step:first-child {
	border-top: none;
	margin-top: 0;
}

/* ── Hover highlight on 2D arrows ──────────────────────────────────── */
/* (CSS animations removed — they were causing ugly pulsing and the
   transform-box scale was moving SVG lines to wrong coordinates.) */

.attn-token-info h4 {
	margin: 0 0 8px 0;
	font-size: 0.95rem;
	color: #2563eb;
	font-weight: 700;
}
.attn-token-info .ti-row {
	display: inline-block;
	margin: 0 12px 0 0;
	padding: 0;
	border-bottom: none;
}
.attn-token-info .ti-row .ti-label {
	color: var(--mn-text-muted, #64748b);
	font-weight: 700;
	font-size: 0.78rem;
	margin-right: 3px;
}
.attn-token-info .ti-row .ti-val {
	font-family: 'SF Mono','Menlo','Consolas','Courier New',monospace;
	color: var(--mn-text, #1e293b);
}
.attn-token-info .ti-row .ti-val {
	font-family: 'SF Mono','Menlo','Consolas',monospace;
	color: var(--mn-text, #1e293b);
}
#attn-anatomy-2d-svg * {
	user-select: none !important;
	-webkit-user-select: none !important;
	-webkit-user-drag: none !important;
	pointer-events: all;
}
/* Invisible fat hover-target lines for each arrow — wider stroke
   means a more forgiving hover region. */
.attn-arrow-hit {
	cursor: pointer;
}

/* When clicking a section label, the browser scrolls the target to the
   top of the viewport. This margin keeps the section from being hidden
   behind the labels bar / controls at the very top of the demo. */
#attn-section-output,
#attn-section-weight,
#attn-section-computation,
#attn-section-intuition {
	scroll-margin-top: 8px;
}
.attn-anatomy-header .step-info {
	flex: 1;
	text-align: center;
	font-weight: bold;
	color: var(--mn-text, #1e293b);
	font-size: 0.95rem;
	letter-spacing: 0.2px;
}
.attn-anatomy-header .step-info .step-num {
	color: #2563eb;
	margin-right: 8px;
}
.attn-anatomy-header .step-info .step-total {
	color: var(--mn-text-muted, #94a3b8);
	font-weight: normal;
	margin: 0 4px;
}
.attn-anatomy-header button {
	padding: 6px 14px;
	border-radius: 8px;
	border: 1px solid var(--mn-border, #cbd5e1);
	background: var(--mn-surface, #fff);
	color: var(--mn-text, #1e293b);
	cursor: pointer;
	font-size: 0.88rem;
	font-family: inherit;
	font-weight: 600;
	transition: all 0.15s;
	min-width: 80px;
	white-space: nowrap;
}
.attn-anatomy-header button:hover:not(:disabled) {
	background: #eff6ff;
	border-color: #2563eb;
	color: #2563eb;
	transform: translateY(-1px);
	box-shadow: 0 3px 8px rgba(37, 99, 235, 0.15);
}
.attn-anatomy-header button:disabled {
	opacity: 0.35;
	cursor: not-allowed;
	transform: none;
	box-shadow: none;
}
.attn-anatomy-header button:active:not(:disabled) {
	transform: translateY(0);
	background: #dbeafe;
}
.attn-anatomy-header #attn-anatomy-reset {
	background: #fef3c7;
	border-color: #f59e0b;
	color: #92400e;
}
.attn-anatomy-header #attn-anatomy-reset:hover:not(:disabled) {
	background: #fde68a;
	border-color: #d97706;
	color: #78350f;
}

/* Token-count selector: start at the simplest case (2 tokens), add
   more to watch the attention budget spread out. */
.attn-token-select {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	margin-bottom: 14px;
	background: var(--mn-surface, #fff);
	border: 1px dashed var(--mn-border, #cbd5e1);
	border-radius: 8px;
	font-size: 0.85rem;
	color: var(--mn-text-secondary, #64748b);
}
.attn-token-select .label {
	font-weight: bold;
	margin-right: 4px;
	color: var(--mn-text, #1e293b);
}
.attn-token-select button {
	background: var(--mn-surface-raised, #f1f5f9);
	border: 1px solid var(--mn-border, #cbd5e1);
	color: var(--mn-text, #1e293b);
	border-radius: 6px;
	padding: 2px 10px;
	cursor: pointer;
	font-weight: 600;
}
.attn-token-select button.active {
	background: #2563eb;
	border-color: #2563eb;
	color: #fff;
}
.attn-token-select .hint {
	margin-left: auto;
	font-size: 0.8rem;
}
@media (max-width: 880px) {
	.attn-token-select .hint {
		display: none;
	}
}

/* Predefined token-set dropdown. Sits next to the token-count selector. */
.attn-set-select {
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 4px 0 2px 0;
	padding: 0 8px;
	font-size: 0.85rem;
	color: var(--mn-text, #1e293b);
}
.attn-set-select .label {
	font-weight: 600;
	color: var(--mn-text-muted, #64748b);
	font-size: 0.8rem;
	min-width: 90px;
}
.attn-set-select select {
	flex: 1;
	max-width: 320px;
	padding: 3px 6px;
	border: 1px solid var(--mn-border, #cbd5e1);
	border-radius: 4px;
	background: var(--mn-surface, #fff);
	color: var(--mn-text, #1e293b);
	font-size: 0.85rem;
	font-family: inherit;
}

/* Fade transition when changing steps — gives a brief flash instead
   of an instant content swap, which makes the change feel intentional. */
.attn-anatomy-equation,
.attn-anatomy-computation,
.attn-anatomy-intuition,
.attn-anatomy-2d {
	transition: opacity 0.18s ease;
}

/* Full equation panel — Temml-rendered display math, one block per
   line. The currently-active sub-expression is boxed + coloured blue
   by the LaTeX itself. */
.attn-anatomy-equation {
	padding: 22px 24px 18px;
	background: var(--mn-surface, #fff);
	border: 1px solid var(--mn-border, #e2e8f0);
	border-radius: 10px;
	margin-bottom: 12px;
	color: var(--mn-text, #1e293b);
	overflow-x: auto;
}
.attn-anatomy-equation .eq-line {
	display: block;
	text-align: center;
	margin: 14px 0;
}
.attn-anatomy-equation .eq-label {
	display: block;
	color: #2563eb;
	font-weight: bold;
	font-size: 0.82rem;
	letter-spacing: 1px;
	text-transform: uppercase;
	margin-bottom: 8px;
	text-align: center;
}
.attn-anatomy-equation mjx-container {
	display: block !important;
	margin: 0.4em auto !important;
	font-size: 1.2rem !important;
}
.attn-anatomy-equation mjx-container[display="true"] {
	display: block !important;
}

/* Each equation line is now a row of small INLINE-math fragments
   (one per hoverable sub-expression) joined by plain symbols. Flex
   keeps them on one baseline; long lines wrap instead of overflowing. */
.attn-anatomy-equation .eq-formula {
	display: flex;
	align-items: center;
	justify-content: center;
	flex-wrap: wrap;
	column-gap: 4px;
	row-gap: 6px;
	margin: 6px 0;
}
.attn-anatomy-equation .eq-formula .eq-tip {
	cursor: help;
	border-radius: 5px;
	padding: 1px 3px;
	transition: background 0.15s ease;
}
.attn-anatomy-equation .eq-formula .eq-tip:hover {
	background: rgba(37, 99, 235, 0.10);
}
.attn-anatomy-equation .eq-formula .eq-sym {
	font-size: 1.15rem;
	font-weight: 600;
	color: var(--mn-text, #1e293b);
	padding: 0 1px;
}

/* "Currently computing" panel — shows the actual numbers being used */
.attn-anatomy-computation {
	background: var(--mn-surface, #fff);
	border: 1px solid var(--mn-border, #e2e8f0);
	border-radius: 10px;
	padding: 16px 20px;
	margin-bottom: 12px;
}
.attn-anatomy-computation .comp-header {
	font-weight: bold;
	color: #2563eb;
	margin-bottom: 12px;
	font-size: 1.05rem;
}
.attn-anatomy-computation .comp-body {
	font-size: 1.02rem;
	line-height: 1.9;
	color: var(--mn-text, #1e293b);
}
.attn-anatomy-computation .comp-row {
	display: flex;
	gap: 14px;
	padding: 4px 0;
	align-items: center;
	flex-wrap: wrap;
}
.attn-anatomy-computation .comp-var {
	color: #2563eb;
	font-weight: bold;
	min-width: 130px;
	flex-shrink: 0;
}
.attn-anatomy-computation .comp-calc {
	color: var(--mn-text, #1e293b);
	flex: 1;
	min-width: 180px;
}
.attn-anatomy-computation .comp-result {
	color: #059669;
	font-weight: bold;
	min-width: 140px;
	text-align: right;
	flex-shrink: 0;
}
.attn-anatomy-computation .comp-extra {
	color: var(--mn-text-muted, #94a3b8);
	font-size: 0.85rem;
	font-style: italic;
	margin-left: 4px;
}
.attn-anatomy-computation .comp-body mjx-container {
	margin: 0 !important;
	font-size: 1em !important;
	display: inline-block !important;
}
.attn-anatomy-computation .comp-note {
	margin-top: 12px;
	padding-top: 12px;
	border-top: 1px dashed var(--mn-border, #e2e8f0);
	color: var(--mn-text-muted, #64748b);
	font-style: italic;
	font-size: 0.95rem;
}

/* Each numeric row is now a full underbraced Temml equation. Each row
   scrolls horizontally on its own, so a wide 4-token line never forces
   the panel to grow and bleed under the plot. */
.attn-anatomy-computation .comp-eq {
	padding: 7px 4px;
	margin: 2px -4px;
	text-align: center;
	overflow-x: auto;
	overflow-y: hidden;
	cursor: help;
	border-radius: 6px;
	scrollbar-width: thin;
	transition: background 0.15s ease;
}
.attn-anatomy-computation .comp-eq:hover {
	background: rgba(37, 99, 235, 0.06);
}
.attn-anatomy-computation .comp-eq math {
	display: block;
	margin: 0 auto;
	font-size: 1rem;
}
.attn-anatomy-computation .comp-eq::-webkit-scrollbar {
	height: 6px;
}
.attn-anatomy-computation .comp-eq::-webkit-scrollbar-thumb {
	background: var(--mn-border, #cbd5e1);
	border-radius: 3px;
}
.attn-anatomy-computation .comp-row.highlighted {
	background: rgba(37, 99, 235, 0.06);
	border-radius: 6px;
	padding: 6px 10px;
	margin: 2px -6px;

/* ── New HTML-mode formulas (no Temml) ────────────────────────────
   The computation rows are now plain HTML so each number is a
   click-to-edit <span.ed>. Two-column layout: the formula on the
   left, the variable name + where-it-came-from on the right. */
.attn-anatomy-computation .comp-eq .comp-name {
	display: inline-block;
	font-family: 'SF Mono','Menlo','Consolas','Courier New',monospace;
	font-size: 0.88rem;
	color: var(--mn-text, #1e293b);
	padding: 1px 4px;
}
.attn-anatomy-computation .comp-eq .comp-name strong {
	color: #059669;
	font-weight: 700;
}
.attn-anatomy-computation .comp-eq .comp-where {
	display: inline-block;
	margin-left: 10px;
	font-size: 0.78rem;
	color: var(--mn-text-muted, #94a3b8);
	font-style: italic;
	vertical-align: middle;
}
.attn-anatomy-computation .comp-eq .ed-static {
	color: var(--mn-text-muted, #64748b);
	padding: 0 1px;
}

/* Click-to-edit number. Looks like normal text; on hover reveals the
   edit affordance; on click it becomes a number input. */
.attn-anatomy-computation span.ed,
.attn-anatomy-computation .comp-live span.ed {
	display: inline-block;
	min-width: 2.4em;
	padding: 0 3px;
	margin: 0 1px;
	border-radius: 4px;
	border: 1px solid transparent;
	background: rgba(37, 99, 235, 0.06);
	color: #2563eb;
	font-family: 'SF Mono','Menlo','Consolas','Courier New',monospace;
	font-weight: 600;
	cursor: text;
	transition: background 0.12s ease, border-color 0.12s ease;
}
.attn-anatomy-computation span.ed:hover {
	background: rgba(37, 99, 235, 0.18);
	border-color: rgba(37, 99, 235, 0.45);
}
.attn-anatomy-computation span.ed:focus,
.attn-anatomy-computation span.ed input {
	outline: none;
	background: #fff;
	border-color: #2563eb;
}
.attn-anatomy-computation span.ed input {
	font-family: 'SF Mono','Menlo','Consolas','Courier New',monospace;
	font-size: 0.88rem;
	color: #1e293b;
	border: 1px solid #2563eb;
	border-radius: 4px;
	padding: 0 3px;
	width: 4.5em;
}

/* Multi-line formula groups (one per token in the dot / weights /
   output steps). Each group is 3 compact lines: the expression, the
   sum, the final result. Groups are separated by a thin divider so
   they read as distinct blocks when there are >1 tokens. */
.attn-anatomy-computation .comp-eq-group {
	padding: 4px 0;
	border-top: 1px solid var(--mn-border, #e2e8f0);
	margin-top: 6px;
	cursor: help;
	background: rgba(37,99,235,0.02);
	border-radius: 4px;
	padding-left: 6px;
	padding-right: 6px;
	transition: background 0.12s;
}
.attn-anatomy-computation .comp-eq-group:hover {
	background: rgba(37,99,235,0.08);
}
.attn-anatomy-computation .comp-eq-group.first {
	border-top: none;
	margin-top: 0;
	padding-top: 0;
}
.attn-anatomy-computation .comp-eq-line {
	padding: 2px 4px;
	font-size: 0.95rem;
	color: var(--mn-text, #1e293b);
}
.attn-anatomy-computation .comp-eq-line math {
	margin: 0 !important;
	font-size: 1rem !important;
}

/* Matrix (2×2) shown inline next to the W^X label. */
.attn-anatomy-computation .comp-matrix {
	display: inline-block;
	white-space: nowrap;
	padding: 2px 4px;
	margin: 0 4px;
	border: 1px solid var(--mn-border, #cbd5e1);
	border-radius: 6px;
	background: rgba(37, 99, 235, 0.04);
}

/* Full attention-matrix table — used in step 10. Each cell is a
   hoverable α_{ij} with the exact computation on hover. */
.attn-matrix-wrap {
	overflow-x: auto;
	margin: 8px auto;
	max-width: 100%;
	padding: 4px;
	border: 1px solid var(--mn-border, #e2e8f0);
	border-radius: 8px;
	background: rgba(37, 99, 235, 0.03);
}
.attn-matrix-table {
	border-collapse: separate;
	border-spacing: 3px;
	margin: 0 auto;
	font-family: 'Inter', sans-serif;
	table-layout: fixed;
	width: auto;
	min-width: 0;
	max-width: 100%;
}
.attn-matrix-corner {
	background: transparent;
}
.attn-matrix-colhead,
.attn-matrix-rowhead {
	background: var(--mn-surface, #fff);
	border: 1px solid var(--mn-border, #e2e8f0);
	border-radius: 6px;
	padding: 6px 10px;
	vertical-align: middle;
	text-align: center;
	font-weight: 600;
	min-width: 60px;
	max-width: 100px;
	cursor: help;
	transition: background 0.12s ease;
}
.attn-matrix-colhead:hover,
.attn-matrix-rowhead:hover {
	background: rgba(37, 99, 235, 0.08);
}
.attn-matrix-colhead-name,
.attn-matrix-rowhead-name {
	font-size: 0.78rem;
	font-weight: 700;
}
.attn-matrix-colhead-form,
.attn-matrix-rowhead-form {
	font-size: 0.7rem;
	color: var(--mn-text-muted, #64748b);
	margin-top: 3px;
}
.attn-matrix-cell {
	padding: 6px 8px;
	text-align: center;
	border-radius: 6px;
	font-size: 0.82rem;
	font-weight: 600;
	min-width: 60px;
	max-width: 90px;
	cursor: help;
	transition: transform 0.12s ease, box-shadow 0.12s ease;
	border: 2px solid transparent;
	word-break: break-word;
}
.attn-matrix-cell:hover {
	transform: scale(1.08);
	border-color: #1e3a8a;
	box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
	z-index: 2;
	position: relative;
}

/* ── Live values overview panel ────────────────────────────────── */
/* Now lives in the 2d wrap container (beside the plot), not in the
   computation panel. */
.attn-live-values-container {
	margin: 0;
	padding: 0;
}
.attn-live-values-container .attn-live-panel {
	margin-bottom: 0;
	padding: 8px 12px;
	background: linear-gradient(180deg, rgba(37,99,235,0.04), rgba(37,99,235,0.01));
	border: 1px solid rgba(37, 99, 235, 0.25);
	border-radius: 8px;
	max-height: 260px;
	overflow-y: auto;
}
.attn-anatomy-computation .attn-live-panel {
	/* Legacy selector — keep for backwards compat but no longer used */
}
.attn-live-panel .attn-live-header {
	font-weight: 700;
	color: #2563eb;
	font-size: 0.82rem;
	margin-bottom: 6px;
	letter-spacing: 0.1px;
}
.attn-live-panel .attn-live-row {
	padding: 4px 0;
	font-size: 0.85rem;
	line-height: 1.55;
}
.attn-live-panel .attn-live-row-sep {
	border-top: 1px dashed rgba(37, 99, 235, 0.25);
	margin-top: 2px;
	padding-top: 6px;
}
.attn-live-panel .attn-live-row-first {
	border-top: none;
}
.attn-anatomy-computation .attn-live-row {
	display: flex;
	align-items: baseline;
	gap: 8px;
	padding: 2px 0;
	font-family: 'SF Mono','Menlo','Consolas','Courier New',monospace;
	font-size: 0.82rem;
	flex-wrap: wrap;
}
.attn-anatomy-computation .attn-live-label {
	color: #2563eb;
	font-weight: 700;
	min-width: 38px;
}
.attn-anatomy-computation .attn-live-vals {
	color: var(--mn-text, #1e293b);
}
.attn-anatomy-computation .attn-live-grid {
	display: inline-block;
	margin: 0 4px;
	padding: 0 4px;
	border: 1px solid rgba(37, 99, 235, 0.3);
	border-radius: 4px;
	vertical-align: middle;
}
.attn-anatomy-computation .attn-live-grid-row {
	display: block;
}
.attn-anatomy-computation .attn-live-grid-row span.ed {
	margin: 0 2px;
	min-width: 2em;
}
}

/* Geometric intuition panel — rendered with Temml math, explains what
   the current step is doing geometrically and how it fits the whole.
   Lives inside the plot column, directly beneath the 2D scene.
   Uses theme variables so it reads correctly in both light and dark mode. */
.attn-anatomy-intuition {
	background: var(--mn-surface, #fff);
	border: 1px solid var(--mn-border, #e2e8f0);
	border-radius: 10px;
	padding: 12px 16px;
	margin-top: 10px;
	color: var(--mn-text, #1e293b);
}
.attn-anatomy-intuition .intuition-header {
	font-weight: bold;
	color: #2563eb;
	margin-bottom: 10px;
	font-size: 0.95rem;
	letter-spacing: 0.2px;
}
.attn-anatomy-intuition .intuition-math {
	background: var(--mn-surface-raised, #f1f5f9);
	border-radius: 8px;
	padding: 10px 12px;
	text-align: center;
	margin-bottom: 10px;
	border: 1px solid var(--mn-border, #cbd5e1);
	color: var(--mn-text, #1e293b);
	overflow-x: auto;
}
.attn-anatomy-intuition .intuition-math mjx-container {
	margin: 0 !important;
}
.attn-anatomy-intuition .intuition-section {
	margin-bottom: 8px;
	line-height: 1.5;
	font-size: 0.88rem;
	color: var(--mn-text, #1e293b);
}
.attn-anatomy-intuition .intuition-section:last-child {
	margin-bottom: 0;
}
.attn-anatomy-intuition .intuition-section strong {
	color: #2563eb;
}
.attn-anatomy-intuition .intuition-where {
	color: var(--mn-text-secondary, #64748b);
	font-style: italic;
	padding: 6px 12px;
	border-left: 3px solid var(--mn-border, #cbd5e1);
	background: var(--mn-surface-raised, rgba(241, 245, 249, 0.4));
	border-radius: 0 6px 6px 0;
}
.attn-anatomy-intuition .intuition-why {
	background: rgba(37, 99, 235, 0.10);
	padding: 10px 14px;
	border-radius: 6px;
	border-left: 3px solid #2563eb;
	color: var(--mn-text, #1e293b);
}
.attn-anatomy-intuition .intuition-why strong {
	color: #2563eb;
}
</style>

<div style="background:var(--mn-surface, #f8fafc); padding:20px; border-radius:12px; border:1px solid var(--mn-border, #e2e8f0);
            margin:15px 0; max-width:880px; margin-left:auto; margin-right:auto;">

	<div style="text-align:center; margin-bottom:14px;">
		<span style="font-size:1.08rem; font-weight:bold; color:var(--mn-text, #1e293b);">
			Build the Attention Equation from the Inside Out
		</span>
		<div style="font-size:0.8rem; color:var(--mn-text-secondary, #64748b); margin-top:4px;">
			Formulas and intuition on the left, geometric scene on the right. Use <b>←</b> / <b>→</b> keys or buttons to peel each layer of the formula.
		</div>
	</div>

	<!-- Controls sit AT THE TOP — they never move because content changes happen below -->
	<div class="attn-anatomy-header">
		<button id="attn-anatomy-prev">← Prev</button>
		<div class="step-info">
			<span class="step-num" id="attn-anatomy-step-num">Step 1</span>
			<span class="step-total">of ?</span>
			<span id="attn-anatomy-step-title">— From embeddings to Q, K, V</span>
		</div>
		<button id="attn-anatomy-reset" title="Reset all q, k, v values to defaults for the current token-set">↺ Reset</button>
		<button id="attn-anatomy-next">Next →</button>
	</div>

	<!-- Number of tokens in the scene. Starts at 2 (query + one other
	     token) so the simplest case is what you see first; add more to
	     watch the attention spread out. -->
	<div class="attn-token-select">
		<span class="label">Tokens</span>
		<button data-attn-tokens="2" class="active" title="The simplest case: query + one key">2</button>
		<button data-attn-tokens="3" title="Adds a 2nd key">3</button>
		<button data-attn-tokens="4" title="Adds a 3rd key">4</button>
		<span class="hint">Hover an arrow for the math, hover the arc between two arrows for what it means.</span>
	</div>

	<!-- Predefined token sets. Each set has its own keys/values so the
	     user can see how different attention regimes play out: a clear
	     winner, a two-way race, nothing relating to the query, and a
	     strong winner. -->
	<div class="attn-set-select">
		<span class="label">Example</span>
		<select id="attn-set-select">
		</select>
	</div>

	<!-- Grid: equation spans full width on top, then computation (left) +
	     plot (right, tall, uses the full vertical space below). -->
	<div class="attn-anatomy-grid">
		<div id="attn-anatomy-equation" class="attn-anatomy-equation attn-grid-equation"></div>

		<!-- Debug panel — lives OUTSIDE the 2D wrap so it's always
		     visible, even when the SVG is collapsed (step 10/11).
		     Spans the full width below the equation. -->
		<div id="attn-debug" class="attn-debug-panel attn-grid-debug" title="Live debug state — hover anything to update. Select-all and copy into a bug report."></div>

		<div id="attn-section-computation" class="attn-anatomy-computation attn-grid-computation"></div>
			<div class="attn-anatomy-2d-wrap">
			<!-- The sentence — hover over any token to focus on its
			     vectors in the plot and see its full info in the popup. -->
			<div id="attn-sentence" class="attn-sentence"></div>

			<!-- Token info popup — SITS BETWEEN the sentence and the
			     2D plot, so it's always visible without overlapping the
			     plot. Reserves space (min-height) so the plot never
			     shifts when content changes. -->
			<div id="attn-token-info" class="attn-token-info is-empty"></div>

			<!-- Live values container — lives in the 2d wrap so it sits
			     BESIDE the plot, not below the computation panel. -->
			<div id="attn-live-values-container" class="attn-live-values-container"></div>

			<svg id="attn-anatomy-2d-svg" viewBox="-1.5 -1.5 3 2.7" preserveAspectRatio="xMidYMid meet">
				<g class="attn-grid"></g>
				<g class="attn-axes"></g>
				<g class="attn-construction"></g>
				<g class="attn-arrows"></g>
				<g class="attn-angles"></g>
				<g class="attn-labels"></g>
			</svg>

			<!-- Bar plots live BELOW the 2D scene in their own SVG so
			     they never overlap the vectors or the angle arcs.
			     Hidden (display:none) when empty so no dead space. -->
			<svg id="attn-bar-plots-svg" viewBox="0 -0.3 3 1" preserveAspectRatio="xMidYMid meet" style="width:100%; height:120px; display:none;">
				<g class="attn-bar-construction"></g>
				<g class="attn-bar-labels"></g>
			</svg>

			<!-- Geometric intuition panel — INSIDE the plot column, right
			     below the scene, so the picture and its meaning stay
			     together. Content is auto-rendered per step. -->
			<div id="attn-section-intuition" class="attn-anatomy-intuition"></div>
		</div>
	</div>
</div>

<!-- Hover tooltip for vector formulas. Appears when the user mouses
     over an arrow in the 2D plot; shows the exact Temml formula
     explaining where that vector comes from mathematically. The JS
     rebuilds the inner content on every hover. -->
<div id="attn-vector-tooltip" class="attn-vector-tooltip"></div>

<div class="md">
### Summary: Why *That* Equation?

$$\boxed{\text{Attention} = \underbrace{\text{softmax}}_{\text{normalize to convex weights}}\!\left(\frac{\overbrace{QK^T}^{\text{directional alignment}}}{\underbrace{\sqrt{d_k}}_{\text{variance control}}}\right) \underbrace{V}_{\text{information to blend}}}$$

1. **Dot product** $QK^T$: It's the natural measure of directional alignment. In 1D it's just multiplication (same sign = agree). In 2D/3D it's $\|\mathbf{q}\|\|\mathbf{k}\|\cos\theta$, the projection of one vector onto another. No other simple operation captures "how much do these vectors point the same way?"

2. **$\sqrt{d_k}$ scaling**: Without it, as $d_k$ grows, the expected magnitude of dot products grows as $\sqrt{d_k}$, pushing softmax toward hard one-hot outputs. The scaling keeps the variance of scores constant regardless of dimension, preserving smooth gradients.

3. **Softmax**: Turns raw scores into a **probability distribution**, non-negative weights that sum to 1. This means the output is a **convex combination** of values, geometrically trapped inside their convex hull. It's the minimal assumption: "blend the available information proportionally to relevance."

4. **Weighted sum of Values**: The output is an interpolation, not a lookup. This is differentiable everywhere, enabling gradient-based learning. The FFN layer that follows provides the non-linearity needed to "escape" the convex hull and create genuinely new representations.

## The Physics of the "Handshake"
To decide how much "pull" one word has on another, the model performs a mathematical handshake using three specific projections:

1.  **Query ($\mathbf{q}$):** The word looking for context (e.g., "What kind of Bank am I?").
2.  **Key ($\mathbf{k}$):** The words offering context (e.g., "I am a River, I have water and banks.").
3.  **Value ($\mathbf{v}$):** The actual semantic "content" to be shared.

The model calculates an alignment score using the scaled dot product:
$$\text{score}_{i,j} = \frac{\mathbf{q}_i \cdot \mathbf{k}_j^T}{\sqrt{d_k}}$$
The $\sqrt{d_k}$ term is critical — without it, the dot-product magnitudes scale with the head dimension and the softmax saturates. If the Query and Key point in a similar direction, the connection is strong.

In modern NLP, words are not merely strings; they are high-dimensional vectors. **Self-Attention** is the operation that allows a model to dynamically re-weight these vectors based on their contextual relevance to one another.

## From Embeddings to Q, K, V
Each input word is first converted into an embedding vector $\mathbf{x}_i$. To compute attention, we project these embeddings into three distinct subspaces using learned weight matrices $W^Q, W^K,$ and $W^V$:

$$
\underbrace{\mathbf{q}_i}_{\text{Query}} = \mathbf{x}_i W^Q, \quad \underbrace{\mathbf{k}_i}_{\text{Key}} = \mathbf{x}_i W^K, \quad \underbrace{\mathbf{v}_i}_{\text{Value}} = \mathbf{x}_i W^V
$$

* **Query ($\mathbf{q}$):** Represents the current token's "search criteria."
* **Key ($\mathbf{k}$):** Acts as a "descriptor" or index of what information the token contains.
* **Value ($\mathbf{v}$):** The actual semantic information to be propagated forward.

## The Interaction: Dot-Product Scoring
To determine how much "attention" word $i$ should pay to word $j$, we calculate the scaled dot product of their respective Query and Key vectors. This measures their geometric alignment in the feature space:

$$
\text{score}_{i,j} = \frac{\mathbf{q}_i \cdot \mathbf{k}_j^T}{\sqrt{d_k}}
$$

If the vectors $\mathbf{q}_i$ and $\mathbf{k}_j$ point in a similar direction, the product is large, indicating high relevance.

### The Core Mechanism: Generating Q, K, and V
To allow a token to "scout" the rest of the sequence, we derive three distinct representations from each token's hidden state by multiplying it by three learned weight matrices: $W^Q, W^K,$ and $W^V$.

* **Query ($\mathbf{q}_i = \mathbf{x}_i W^Q$)**: Represents "What am I looking for?"
* **Key ($\mathbf{k}_i = \mathbf{x}_i W^K$)**: Represents "What information do I contain?"
* **Value ($\mathbf{v}_i = \mathbf{x}_i W^V$)**: Represents "What is the actual content I offer?"

A subtle but important detail: **$Q$ and $K$ have dimension $d_k$, while $V$ has dimension $d_v$**. In the original paper, $W^Q, W^K \in \mathbb{R}^{d_{\text{model}} \times d_k}$ and $W^V \in \mathbb{R}^{d_{\text{model}} \times d_v}$. Splitting the value dimension off from the key dimension lets the network learn "what to retrieve" ($V$) independently of "what to match against" ($K$). The three projections all live as subspaces inside the full $d_{\text{model}}$-dimensional embedding space, so each one captures a different slice of the token's meaning.
</div>

<div id="qkv-subspace-projection-viz"
     style="width:100%; min-height:520px; border:2px solid var(--mn-border, #e2e8f0); border-radius:12px; background:var(--mn-surface, #f8fafc); align-items:center; justify-content:center; margin:20px 0;">
    <div style="color:var(--mn-text-muted, #94a3b8); font-size:0.95rem; padding:20px; text-align:center;">
        ⏳ Loading the Q, K, V subspace projection visualization...
    </div>
</div>

<div class="md">

In a real Transformer, every token lives as a $d_{\text{model}}$-dimensional vector — $d_{\text{model}} = 512$ in the original paper. The matrices $W^Q, W^K, W^V$ are **linear projections** that map each token from $d_{\text{model}}$ down into a smaller subspace ($d_k = d_v = 64$ in the original paper). They are linear, so a 2D plane through the origin is faithful to what happens in 512 dimensions: every projection is a shadow of the original onto some lower-dimensional subspace.

- **Grey points**: Original 3D token embeddings (the toy version of $d_{\text{model}}$).
- **Coloured diamonds on the plane**: Where each token lands after being multiplied by the weight matrix. The coloured lines show the projection "shadow" from 3D down to the plane.
- **The translucent plane**: The 2D subspace that the weight matrix projects onto. Each of Q, K, V has a *different* plane, meaning each one "sees" the tokens from a different angle.

The same set of token vectors is viewed through three different "lenses" (Q, K, V). Because each lens projects onto a different subspace, the same word can appear close to different neighbours depending on whether you're asking "What am I looking for?" (Q), "What do I contain?" (K), or "What do I offer?" (V). In this 3D toy version we set $d_k = d_v = 2$ for visual clarity; in production these would be $64$-dimensional subspaces of a $512$-dimensional embedding.

## Multi-Head Attention: Many Lenses at Once

A single attention head can only attend from **one perspective** at a time. The Transformer instead runs $h$ heads in parallel, each with its own $W^Q, W^K, W^V$, and concatenates their outputs:

$$
\text{MultiHead}(Q, K, V) = \text{Concat}(\text{head}_1, \dots, \text{head}_h)\, W^O, \quad \text{head}_i = \text{Attention}(Q W_i^Q,\ K_i^K,\ V_i^V)
$$

with $W_i^Q, W_i^K \in \mathbb{R}^{d_{\text{model}} \times d_k}$, $W_i^V \in \mathbb{R}^{d_{\text{model}} \times d_v}$, and $W^O \in \mathbb{R}^{h \cdot d_v \times d_{\text{model}}}$. In the original paper, $h = 8$, $d_{\text{model}} = 512$, so each head works in a $d_k = d_v = 64$-dimensional subspace. The total per-head cost equals that of one big $512$-dim head, but the model gains the ability to **jointly attend to information from different representation subspaces** — one head can chase syntactic dependencies while another tracks coreference.

The final projection $W^O$ is what lets the heads' outputs mix back together into a single $d_{\text{model}}$-dimensional representation.

## The Scaling Factor and Softmax
As the dimensionality $d_k$ increases, the magnitude of the dot products grows, which can push the Softmax function into regions with extremely small gradients. To counteract this, we scale by $\sqrt{d_k}$:
</div>

$$
\alpha_{i,j} = \text{Softmax}\left( \frac{\mathbf{q}_i \mathbf{k}_j^T}{\sqrt{d_k}} \right) = \frac{\exp(\frac{\mathbf{q}_i \mathbf{k}_j^T}{\sqrt{d_k}})}{\sum_{n=1}^{L} \exp(\frac{\mathbf{q}_i \mathbf{k}_n^T}{\sqrt{d_k}})}
$$

<div class="md">
This produces a probability distribution where $\sum_j \alpha_{i,j} = 1$, representing the "attention weights" word $i$ assigns to every word in the sequence.

## The Final Contextual Output
The output for each position is the weighted sum of all Value vectors. This "context vector" $\mathbf{z}_i$ is a version of the original word that has been "informed" by its neighbors:
</div>

$$
\mathbf{z}_i = \sum_{j} \alpha_{i,j} \mathbf{v}_j
$$

<div class="md">
In matrix form, the entire operation for the sequence is computed efficiently as:
$$\text{Attention}(Q, K, V) = \text{Softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$
</div>

        <h2>The Connectivity Web</h2>
        <p>Hover over the words to see the invisible threads of meaning.</p>
        
        <div id="sa-attention-container" style="position: relative; height: 300px; margin-top: 20px; background: var(--mn-surface, #fcfdfe); border: 1px solid var(--mn-border, #e2e8f0); border-radius: 8px;">
            <canvas id="sa-attn-canvas" style="position: absolute; top: 0; left: 0; pointer-events: none; z-index: 5;"></canvas>
            <div id="sa-token-stream" style="display: flex; justify-content: center; gap: 30px; position: absolute; bottom: 60px; width: 100%;">
                </div>
        </div>

            <h2 style="color:var(--mn-heading, #1e293b)">The Attention Matrix</h2>
<div class="md">

Keep in mind that this is an oversimplification. Usually, the connections are not that easily interpretable.

Think of this matrix as a **Scoreboard**. In a sentence, words aren't just sitting next to each other; they are actively "talking" to find out how they relate to one another.

## The Dot Product: Measuring "Similarity"
Behind every number in this table, two words are performing a mathematical handshake. The **Query** $\mathbf{q}$ (the word looking for context) and the **Key** $\mathbf{k}$ (the word being looked at) multiply their values together.
* **High Scores:** If the vectors point in a similar direction, the product is large, meaning the words are highly relevant to each other (like **hunter** and **bear**).
* **Low Scores:** If the vectors are "orthogonal" (pointing in different directions), the score stays low, meaning the words have little to do with each other in this context.

Now that we know vectors are just lists of numbers (or arrows in space), we need a way to compare them. In AI, we constantly ask: *“How similar is the word 'Apple' to the word 'Banana'?”* The **Dot Product** is the tool we use to get a single number that represents this relationship.

## Keeping it Fair (The Scaling & Softmax)
We don't just use the raw scores because they can get too huge to handle, making the model "stubborn." We use two steps to clean them up:
* **The Scale:** We divide by $\sqrt{d_k}$ to keep the numbers small and manageable.
* **The Softmax:** We apply the formula $\text{Softmax}(x_i) = \frac{\exp(x_i)}{\sum \exp(x_j)}$ to turn those scores into percentages.

This forces all the attention for a single word to add up to exactly **100%**. If a word gives 85% of its focus to one neighbor, it only has 15% left to split among everyone else.

When you see a dark blue square with **85%**, you are seeing the model "linking" those concepts. For example, when the word **"hunter"** looks at **"bear,"** it isn't just looking at a string of letters; it is pulling the "Value" ($\mathbf{v}$) of the bear into its own meaning. This is how the model understands that this specific hunter is currently interacting with a predator.
</div>
<div id="sa-matrix-container" style="overflow-x: auto;"></div>

<div class="md">
## Summary: The Vector Tug-of-War

In the world of Transformers, meaning is **movement**. Instead of looking up a word in a static dictionary, the model calculates a new position for that word based on the "gravitational pull" of its neighbours in the embedding space. This creates a vector that is near the *meaning* of the word in the context it is used in, not the mere embedding of the word itself.

The classic illustration: the word **"apple"** is ambiguous in isolation, but in *I ate a juicy apple* the word **"juicy"** pulls the apple vector toward the fruit cluster — the same dot-product mechanism this page demonstrates geometrically with the step-by-step walkthrough above.

## Attention Heads as Differentiable Turing Machine Read Heads

In \citeyear{neuralturingmachines}, the concept of Neural Turing Machine (NTM) was introduced by \citeauthorlastnameand{neuralturingmachines}, demonstrating that a neural network coupled with an external memory and differentiable read/write heads could learn algorithms end-to-end via gradient descent. The critical mechanism enabling this was an *attentional process* over memory locations, the read head produces a weighting vector with one component per memory cell, determining what to retrieve.

What has gone largely unacknowledged is that a standard Transformer during autoregressive generation **is** this architecture. The KV-cache, the growing matrix of past Keys and Values, serves as the external memory tape. Each attention head functions as a differentiable read head: the **Query** is the address request ("what am I looking for?"), the **Keys** are the address tags stored at each memory location, and the **Values** are the content to be retrieved. The causal mask enforces that the head can only look backward along the sequence, mirroring a unidirectional tape. A Transformer with $h$ attention heads is therefore a learned Turing machine with $h$ parallel read heads, where the "program", what to read and how to combine it, is acquired from data rather than hand-coded.

This explains both why Transformers can learn algorithmic tasks (sorting, addition, in-context learning) and why they sometimes fail: the read heads emit *soft*, probabilistic weightings via softmax, meaning they can approximate but never perfectly execute the discrete, hard-addressed steps a classical Turing machine performs.

### Attention as Retrieval-Augmented Memory

The attention mechanism can be understood as a **differentiable database lookup**. The Query is the search query, the Keys form the index, and the Values are the stored records. This perspective reveals deep connections to several practical systems:

* **Why RAG works:** Retrieval-Augmented Generation extends the Key-Value store beyond the model's weights to an external vector database. The same attention mechanism that retrieves from the KV-cache is repurposed to attend to retrieved documents in the context window, effectively giving the model access to a memory that is not bounded by its parameter count.

* **Why KV-caching is essential:** During inference, the growing KV-cache is precisely the model's "external memory tape." Without it, every new token would require recomputing attention over the entire history, an operation that scales quadratically with sequence length. The cache linearizes this cost.

* **The Hopfield Network connection:** \citeauthor{ramsauer2021hopfield} (\citeyear{ramsauer2021hopfield}) proved that the attention mechanism is mathematically equivalent to an energy-based associative memory (a modern Hopfield network). In this view, the Keys are stored patterns, and the output of attention is a retrieval from this associative memory that converges to the stored pattern closest to the Query. This means Transformers are not just "inspired by" associative memory; they are a differentiable, scalable instantiation of it.

## The Context Window: The Model's Short-Term Memory

The **context window** defines the maximum number of tokens a Transformer can "see" and reason about in a single forward pass. It is, in effect, the model's field of vision: any token that falls within the window can participate in the attention mechanism, while anything outside it simply does not exist to the model. Because the self-attention matrix has dimensions $\text{Context} \times \text{Context}$, both memory consumption and computation scale **quadratically** with the window size, doubling the context quadruples the cost. This is the fundamental engineering constraint that prevents context windows from being infinitely large.

But the context window is more than a technical parameter, it maps onto a powerful cognitive analogy. The **weights** of the model are its **long-term memory**: everything the model learned during training is crystallized into these fixed parameters, and they do not change during inference. The **context window**, by contrast, is the model's **working memory** or **short-term memory**: it is constructed fresh for every conversation, holds only what has been provided in the current prompt, and is entirely volatile. This maps directly to the psychological distinction between **declarative memory** (stable, accumulated knowledge) and **working memory** (temporary, capacity-limited, actively maintained). When the context window overflows, when a conversation or document exceeds the token limit, the model experiences something analogous to **cognitive overload**: it literally cannot hold all the information simultaneously, and earlier tokens are dropped or truncated. The deeper implication is striking: an LLM has **amnesia between conversations** (no persistent short-term memory carries over) and a **frozen worldview** (no weight updates occur during inference). Every interaction begins from the same fixed long-term knowledge, with no recollection of yesterday. It is, in a sense, like speaking to someone who wakes up every morning with the same education but no memory of any previous conversation.

## The Bottom Line
Mathematically, the "contextualized" word is just a weighted average of the information (Values) around it:
</div>

$$\mathbf{z}_{i} = \sum_{j} \alpha_{i,j} \mathbf{v}_j$$

<div class="md">
The diamond you see in the plot is the result of this physics, a word finding its true north by listening to its neighbors.

It is important to note that attention does not only disambiguate words with multiple meanings like "bank" or "apple." It operates over **every token in the sequence**, refining **all** representations simultaneously. A word like "the" gets contextualized just as much as "bank" does — attention captures syntactic relationships (subject-verb agreement), coreference (linking "she" to "Maria"), temporal reasoning ("before" relating two events), adjectival binding ("red" attaching to "car" rather than "house"), and countless other structural dependencies. The disambiguation examples above are simply the most *visually dramatic* illustration of what is, in reality, a universal mechanism: every word's representation is reshaped by every other word it attends to, regardless of whether the word is ambiguous in isolation.

### The Attention Matrix: A Zero-Sum Economy

Each row of the attention matrix sums to 1 (due to softmax), making it **right-stochastic**. But the columns generally do **not** sum to 1. This asymmetry reveals something profound: some tokens are "attended to" much more than others — they become **information hubs**.

In BERT, the `[CLS]` token often accumulates massive column-sums, acting as a sink that aggregates information from the entire sequence. In GPT-style models, the last (most recent) token plays a similar role. These tokens become gravitational centers that the entire sequence orbits around.

The zero-sum nature of attention (each row sums to exactly 1) means attention is a **finite resource**. When one token receives more attention from a given query, every other token necessarily receives less. This is not a design choice — it is a mathematical consequence of the softmax normalization. It creates a competitive economy within every forward pass: tokens compete for attention the way organisms compete for resources in an ecosystem. A highly salient token (a proper noun, a negation word) can "starve" surrounding tokens of attention, causing the model to effectively ignore them.

The deeper implication: the model cannot attend to everything equally — it must always choose, and every choice is a sacrifice. This mirrors the human condition of finite attention: we cannot listen to all voices simultaneously, and every act of focus is an act of exclusion.
</div>
