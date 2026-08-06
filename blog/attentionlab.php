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
/* Header strip with step controls (sits ABOVE the plot) */
.attn-anatomy-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 10px 14px;
	background: var(--mn-surface, #fff);
	border: 1px solid var(--mn-border, #e2e8f0);
	border-radius: 10px;
	margin-bottom: 12px;
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
	padding: 8px 18px;
	border-radius: 8px;
	border: 1px solid var(--mn-border, #cbd5e1);
	background: var(--mn-surface, #fff);
	color: var(--mn-text, #1e293b);
	cursor: pointer;
	font-size: 0.9rem;
	font-family: inherit;
	font-weight: 600;
	transition: all 0.15s;
	min-width: 110px;
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

/* Full equation panel — Temml-rendered math, the currently-active
   sub-expression is coloured blue by the LaTeX itself. */
.attn-anatomy-equation {
	padding: 22px 24px 20px;
	background: var(--mn-surface, #fff);
	border: 1px solid var(--mn-border, #e2e8f0);
	border-radius: 10px;
	margin-bottom: 12px;
	text-align: center;
	line-height: 2.4;
	overflow-x: auto;
	color: var(--mn-text, #1e293b);
}
.attn-anatomy-equation .eq-line {
	margin: 10px 0;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 14px;
	flex-wrap: wrap;
}
.attn-anatomy-equation .eq-line b {
	color: var(--mn-heading, #1e293b);
	margin-right: 4px;
	letter-spacing: 0.2px;
}
.attn-anatomy-equation mjx-container {
	margin: 0 !important;
	font-size: 1.15rem !important;
}
.attn-anatomy-equation mjx-container[display="true"] {
	display: inline-block !important;
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
	font-size: 0.95rem;
}
.attn-anatomy-computation .comp-body {
	font-family: 'JetBrains Mono', 'SF Mono', 'Menlo', 'Consolas', monospace;
	font-size: 0.88rem;
	line-height: 1.7;
}
.attn-anatomy-computation .comp-row {
	display: flex;
	gap: 12px;
	padding: 2px 0;
	align-items: baseline;
	flex-wrap: wrap;
}
.attn-anatomy-computation .comp-var {
	color: #2563eb;
	font-weight: bold;
	min-width: 140px;
	flex-shrink: 0;
}
.attn-anatomy-computation .comp-calc {
	color: var(--mn-text, #1e293b);
	flex: 1;
	min-width: 200px;
}
.attn-anatomy-computation .comp-result {
	color: #059669;
	font-weight: bold;
	min-width: 130px;
	text-align: right;
	flex-shrink: 0;
}
.attn-anatomy-computation .comp-note {
	margin-top: 10px;
	padding-top: 10px;
	border-top: 1px dashed var(--mn-border, #e2e8f0);
	color: var(--mn-text-muted, #64748b);
	font-family: inherit;
	font-style: italic;
	font-size: 0.85rem;
}
.attn-anatomy-computation .comp-row.highlighted {
	background: rgba(37, 99, 235, 0.06);
	border-radius: 6px;
	padding: 4px 8px;
	margin: 2px -4px;
}

/* Geometric intuition panel — rendered with Temml math, explains what
   the current step is doing geometrically and how it fits the whole.
   Uses theme variables so it reads correctly in both light and dark mode. */
.attn-anatomy-intuition {
	background: var(--mn-surface, #fff);
	border: 1px solid var(--mn-border, #e2e8f0);
	border-radius: 10px;
	padding: 18px 22px;
	margin-bottom: 12px;
	color: var(--mn-text, #1e293b);
}
.attn-anatomy-intuition .intuition-header {
	font-weight: bold;
	color: #2563eb;
	margin-bottom: 12px;
	font-size: 0.98rem;
	letter-spacing: 0.2px;
}
.attn-anatomy-intuition .intuition-math {
	background: var(--mn-surface-raised, #f1f5f9);
	border-radius: 8px;
	padding: 14px 12px;
	text-align: center;
	margin-bottom: 14px;
	border: 1px solid var(--mn-border, #cbd5e1);
	color: var(--mn-text, #1e293b);
	overflow-x: auto;
}
.attn-anatomy-intuition .intuition-math mjx-container {
	margin: 0 !important;
}
.attn-anatomy-intuition .intuition-section {
	margin-bottom: 10px;
	line-height: 1.55;
	font-size: 0.9rem;
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
			Each click reveals the next layer of the formula. The active sub-expression is coloured in the equation, the actual numbers appear in the <b>Currently computing</b> panel, and the 2D vector scene shows the geometry.
		</div>
	</div>

	<!-- 1) Full equation, always visible, with the active part highlighted -->
	<div id="attn-anatomy-equation" class="attn-anatomy-equation"></div>

	<!-- 2) Currently computing panel: shows the actual numbers for this step -->
	<div id="attn-anatomy-computation" class="attn-anatomy-computation"></div>

	<!-- 3) Geometric intuition: Temml-rendered math + human interpretation -->
	<div id="attn-anatomy-intuition" class="attn-anatomy-intuition"></div>

	<!-- 4) 2D vector plot: the geometric view -->
	<div id="attn-anatomy-2d" style="height: 400px; background: var(--mn-surface, #fff);
									border:1px solid var(--mn-border, #e2e8f0); border-radius:8px; margin-bottom:12px;"></div>

	<!-- 5) Score bars: numeric state of the computation -->
	<div id="attn-anatomy-bars" style="height: 200px; background: var(--mn-surface, #fff);
									   border:1px solid var(--mn-border, #e2e8f0); border-radius:8px; margin-bottom:12px;"></div>

	<!-- 6) Controls sit BELOW the plot so the user can see the visualization while clicking -->
	<div class="attn-anatomy-header">
		<button id="attn-anatomy-prev">← Previous</button>
		<div class="step-info">
			<span class="step-num" id="attn-anatomy-step-num">Step 1</span>
			<span class="step-total">of 8</span>
			<span id="attn-anatomy-step-title">— The Players</span>
		</div>
		<button id="attn-anatomy-next">Next →</button>
	</div>
</div>

<div class="md">
### Summary: Why *That* Equation?
</div>

$$\boxed{\text{Attention} = \underbrace{\text{softmax}}_{\text{normalize to convex weights}}\!\left(\frac{\overbrace{QK^T}^{\text{directional alignment}}}{\underbrace{\sqrt{d_k}}_{\text{variance control}}}\right) \underbrace{V}_{\text{information to blend}}}$$

<div class="md">
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
</div>

$$
\underbrace{\mathbf{q}_i}_{\text{Query}} = \mathbf{x}_i W^Q, \quad \underbrace{\mathbf{k}_i}_{\text{Key}} = \mathbf{x}_i W^K, \quad \underbrace{\mathbf{v}_i}_{\text{Value}} = \mathbf{x}_i W^V
$$

<div class="md">
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
