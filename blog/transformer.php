<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Transformer Architecture
description: A deep interactive dive, configure heads, layers, and dimensions, then watch it compute.
icon: &#129516;
part: 4
order: 24
color: sky
topics: architecture, math, programming
featured: true
-->

<script src="llm_river.js"></script>
<script src="stickybar_transformer.js"></script>
<script src="attention_engine.js"></script>
<script src="provenance.js"></script>
<script src="tda_live.js"></script>

<!--
https://nlp.seas.harvard.edu/2018/04/03/attention.html

https://arxiv.org/html/2505.11611v1
-->
<div id="transformer_site">
<div class="smart-quote" data-cite="heraclitus500fragments" data-after="B 54">
	The hidden harmony is better than the obvious one
</div>

<div id="transformer_config">
	<div style="margin-bottom: 15px;">
		<label style="font-weight: bold;">Model Dimension ($d_{\text{model}}$): </label>
		<span id="dim-val" style="font-weight: bold; color: #3b82f6;">3</span>
		<p style="font-size: 0.75rem; color: #64748b; margin: 2px 0;">
            <b>Dependency:</b> Must be a multiple of Heads.<br>
            <b>Reason:</b> Each head needs an equal integer-sized slice ($d_k = \frac{d_{\text{model}}}{h}$) of the vector to perform dot products.
        </p>
		<input type="range" id="transformer-dimension-model" min="2" max="16" step="1" value="3"
			style="width: 100%;" oninput="syncTransformerSettings('dim')">
	</div>

	<div style="margin-bottom: 15px;">
		<label style="font-weight: bold;">Attention Heads ($h$): </label>
		<span id="heads-val" style="font-weight: bold; color: #3b82f6;">3</span>
		<p style="font-size: 0.75rem; color: #64748b; margin: 2px 0;">
	    <b>Dependency:</b> $d_{\text{model}}$ must be a multiple of $h$.<br>
            <b>Reason:</b> Multi-head attention splits the main vector into $h$ parallel "viewpoints." If $d_{\text{model}}$ is 4 and $h$ is 2, each head looks at 2 dimensions.
        </p>
		<input type="range" id="transformer-heads" min="1" max="8" value="3"
			style="width: 100%;" oninput="syncTransformerSettings('heads')">
	</div>

	<div style="margin-bottom: 15px;">
		<label style="font-weight: bold;">Network Depth ($N$ layers): </label>
		<span id="depth-val" style="font-weight: bold; color: #3b82f6;">4</span>
		<p style="font-size: 0.8rem; color: #64748b; margin: 4px 0;">How many transformer blocks are stacked. More layers allow more abstract reasoning.</p>
		<input type="range" id="transformer-depth" min="1" max="12" value="4"
			style="width: 100%;" oninput="document.getElementById('depth-val').innerText = this.value; debounced_run_transformer_demo();">
	</div>

	<div style="margin-bottom: 15px;">
	    <label style="font-weight: bold;">Context Size: </label>
	    <span id="context-val" style="font-weight: bold; color: #3b82f6;">128</span>
	    <p style="font-size: 0.75rem; color: #64748b; margin: 2px 0;">
		<b>Effect:</b> Sets the maximum number of tokens the model can "see" at once during training and inference.<br>
		<b>Reason:</b> A larger context window allows the model to capture longer-range dependencies between words, but increases memory and computation cost quadratically due to the attention matrix being of size $\text{Context}^2$ (this can be mitigated through the <i>KV-Cache</i>).
	    </p>
	    <input type="range" id="transformer-context-size" min="2" max="256" step="1" value="128"
		style="width: 100%;" oninput="document.getElementById('context-val').innerText = this.value; debounced_run_transformer_demo();">
	</div>

	<div style="display: none">
	    <label style="font-weight: bold;">Tokenizer: </label>
	    <select id="transformer-tokenizer-type" style="padding: 4px; border-radius: 4px; border: 1px solid #cbd5e1;" onchange="debounced_run_transformer_demo()">
		<option value="regex" selected>Words (Non-Alphanumeric Split)</option>
		<option value="bpe">Byte-Pair Encoding (BPE)</option>
	    </select>
	</div>
	<div id="nr_params" style="display: none"></div>

	<div id="param-breakdown-toggle" style="display: none; margin-top: 8px;">
	    <button id="param-breakdown-btn" onclick="toggleParamBreakdown()"
		style="background: none; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 16px;
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
    <textarea
        id="transformer-training-data"
        style="width: 90%; height: 60px; font-family: 'Courier New', monospace; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; background: var(--mn-surface, white); color: var(--mn-text, #1e293b);"
        oninput="debounced_run_transformer_demo('transformer-training-data')">the king rules the land and the queen rules the sea</textarea>
</div>

<div style="background: #f0fdf4; padding: 15px; border: 1px solid #10b981; border-radius: 8px; margin-top: 15px; margin-bottom: 15px;">
    <div style="display: flex; gap: 15px; flex-wrap: wrap; align-items: center;">
        <div>
            <label style="font-weight: bold; font-size: 0.9rem;">Epochs:</label>
            <input type="number" id="train-epochs" value="200" style="width: 60px; padding: 4px; background: var(--mn-surface, white); color: var(--mn-text, #1e293b); border: 1px solid var(--mn-border, #cbd5e1); border-radius: 4px;">
        </div>
        <div>
            <label style="font-weight: bold; font-size: 0.9rem;">Learning Rate:</label>
            <input type="number" id="train-lr" value="0.01" step="0.01" style="width: 70px; padding: 4px; background: var(--mn-surface, white); color: var(--mn-text, #1e293b); border: 1px solid var(--mn-border, #cbd5e1); border-radius: 4px;">
        </div>
        <div>
            <label style="font-weight: bold; font-size: 0.9rem;">Optimizer:</label>
            <div id="train-optimizer" style="display: inline-flex; gap: 12px; align-items: center; font-size: 0.9rem; padding: 4px 0;">
                <label style="display: inline-flex; align-items: center; gap: 4px; font-weight: normal; cursor: pointer;">
                    <input type="radio" name="train-optimizer-choice" value="adam" checked>
                    <span class="glossary-term">Adam<span class="glossary-tooltip">An adaptive optimizer that gives every parameter its own learning rate based on the history of its gradients.</span></span>
                </label>
                <label style="display: inline-flex; align-items: center; gap: 4px; font-weight: normal; cursor: pointer;">
                    <input type="radio" name="train-optimizer-choice" value="sgd">
                    <span class="glossary-term">SGD<span class="glossary-tooltip">Stochastic Gradient Descent — gradient descent performed on small random batches of data rather than the full dataset.</span></span>
                </label>
                <label style="display: inline-flex; align-items: center; gap: 4px; font-weight: normal; cursor: pointer;">
                    <input type="radio" name="train-optimizer-choice" value="rmsprop">
                    <span class="glossary-term">RMSProp<span class="glossary-tooltip">Root Mean Square Propagation — adapts the learning rate per parameter using a moving average of recent squared gradients, which keeps updates stable even when gradients vary wildly in magnitude.</span></span>
                </label>
            </div>
        </div>

	<button class="btn train-btn" onclick="train_transformer()">Train Model</button>
	<button class="btn" id="tda-toggle-training-windows" onclick="toggleTrainingWindows()" style="padding: 4px 12px; border-radius: 6px; border: 1px solid #cbd5e1; background: var(--mn-surface, #fff); color: var(--mn-text, #0f172a); cursor: pointer; font-weight: 600; margin-left: 6px;">Show training windows</button>

	<div id="training-status" style="margin-top: 10px; font-size: 0.85rem; color: #047857; min-height: 20px;"></div>
	<div id="training-loss-plot" style="width: 100%; height: 200px; margin-top: 10px; border: 1px solid #e2e8f0; border-radius: 8px; background: var(--mn-surface, white);"></div>
    </div>
</div>
<script>
(function () {
	// Keep the loss panel a fixed height from the start so training never
	// shifts the page; draw an empty placeholder chart until the first epoch.
	const box = document.getElementById('training-loss-plot');
	if (!box || typeof Plotly === 'undefined') return;
	try {
		Plotly.react(box, [], {
			title: { text: 'Loss over epochs — press Train Model to start', font: { size: 12, color: '#94a3b8' } },
			margin: { t: 28, b: 24, l: 46, r: 14 },
			paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
			xaxis: { visible: false }, yaxis: { visible: false },
		}, { responsive: true });
	} catch (e) { /* Plotly unavailable */ }
})();
</script>

<div id="show_training_sentences" style="display: none">
	<p>Current Training Windows: <span id="current_training_sentence"></span></p><br>
</div>

<div class="md">
## Tokenization
The journey of a sentence begins with **Tokenization**, which decomposes raw text into **tokens**. Real LLMs would use **Byte-Pair Encoding** (**BPE**), as this approach strikes a balance between whole-word vocabularies and character-level models by representing rare or unseen words as compositions of frequent fragments. In doing so, BPE keeps the vocabulary size manageable while maintaining broad coverage of natural language. But since our embedding space and the amount of data browsers can process is too small for **BPE**, we stick with word-wise tokenization.
</div>

<div id="transformer-viz-bpe" class="viz-container"></div>

<div class="md">
## Embedding & The Feature Space

Once tokenized, these units are converted into vectors. It is crucial to distinguish between the **Embedding Space** and the **Feature Space**:

* **Embedding Space (Static):** This is the initial lookup table where each token is assigned a fixed vector. At this stage, the vector for "bank" is always the same, regardless of context. This is where the **Hidden State** $h_0$ starts at the beginning of the process.
* **Feature Space (Dynamic):** As vectors pass through the layers, they enter the Feature Space. Here, the representation of a word is no longer fixed; it "migrates" based on the surrounding tokens. The hidden states $h_0, h_1, \dots, h_n$ represent the coordinates of the word as it is refined by the model's internal logic. The **Feature Space** is highly abstract, and not humanly interpretable anymore.
</div>

<div style="background: var(--mn-bg-subtle, #f8fafc); padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
	<div id="transformer-plotly-space" style="width: 100%; height: 500px; background: var(--mn-surface, white); border-radius: 8px;"></div>
	<div id="transformer-viz-embeddings" style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px;"></div>

	<div class="embedding-table-container" id="tled-editor-container" style="margin-top: 20px; max-height: 420px; overflow-y: auto;"></div>

	<p style="font-size: 0.9rem; color: #64748b; margin-bottom: 15px;">Perform math on the current vocabulary tokens to see how concepts align in the dynamic vector space.</p>
	<input
	    type="text"
	    id="transformer-vector-math-input"
	    style="width: 100%; padding: 10px; font-size: 1.1rem; border-radius: 8px; border: 1px solid #cbd5e1; background: var(--mn-surface, white); color: var(--mn-text, #1e293b);"
	    placeholder="e.g., king - man + woman"
	    oninput="debounced_vector_math()"
	    onkeydown="if(event.key==='Enter'){event.preventDefault(); immediate_vector_math();}"
	>
	<div id="transformer-vector-math-result" style="margin-top: 15px; padding: 15px; background: var(--mn-surface, white); border-radius: 8px; border: 1px dashed #cbd5e1; overflow-x: auto;">
		<em style="color: #94a3b8;">Enter an equation and press Enter...</em>
	</div>
</div>

<div class="md">
## Positional Encoding

To address the lack of sequence order in transformers, a "position signal" is added to each token's embedding, forming the initial hidden state $h_{0}$:
</div>

$$h_{0} = \underbrace{\text{Embedding}(\text{Token})}_{\in \mathbb{R}^{\text{Batch} \times \text{Length} \times d_{\text{model}}}} + \underbrace{\text{PositionalEncoding}(\text{pos})}_{\in \mathbb{R}^{\text{Batch} \times \text{Length} \times d_{\text{model}}}}$$

<div class="md">
The positional encoding is calculated using sine and cosine functions, which provide smooth, periodic patterns for each position.

For each dimension $i$ in a vector of size $d_\text{model}$, the encoding is defined as:

$$PE_{(\text{pos}, 2i)} = \sin\left(\frac{\text{pos}}{10000^{2i/d_\text{model}}}\right)$$

$$PE_{(\text{pos}, 2i+1)} = \cos\left(\frac{\text{pos}}{10000^{2i/d_\text{model}}}\right)$$

These functions were chosen because they create unique, continuous patterns for each position, enabling the model to infer both absolute and relative positions. The periodicity of sine and cosine ensures that the encodings generalize to sequences longer than those seen during training. Additionally, their multi-frequency nature allows the model to capture both local and global positional relationships. The Feed-Forward Network (FFN) learns to interpret these fixed "geometric fingerprints" by adjusting its weights, enabling the model to apply position-specific logic and reason about sequence structure effectively.

The key to how the FFN learns from positional encodings lies in the mathematical properties of sine and cosine. For any fixed offset $k$, the positional encoding at position $\text{pos} + k$ can be expressed as a linear transformation of the encoding at position $\text{pos}$. This linearity allows the FFN to infer relative positions by learning simple transformations that map positional relationships to meaningful patterns. Over multiple layers, the FFN entangles positional and semantic information, enabling the model to reason about sequence structure and relationships effectively. This process ensures that the model can generalize to unseen sequences and maintain positional understanding even when tokens are shifted or reordered.

This is required because the network looks at all words simultaneously, instead of after another. Since the matrix can be permuted and the output doesn't change (except the permutation), having the order in the matrices alone isn't enough.
</div>

<div class="md" id="ifscalfactornotone" style="display: none">
In this example, we're using a scaling factor of <span id="posEmbedScaleFactor">0.1</span> because of the low dimensionality of our space.
</div>

<div id="transformer-pe-wave-plot" style="width: 100%; height: 300px; margin-top: 20px; background: var(--mn-surface, white); border-radius: 12px; border: 1px solid #e2e8f0;"></div>

<div id="transformer-pe-shift-plot" style="width: 100%; height: 600px; margin-top: 20px; background: var(--mn-surface, white); border-radius: 12px; border: 1px solid #e2e8f0;"></div>

<div id="transformer-pe-integration-results" style="margin-top: 20px;"></div>

<div class="optional md" data-headline="Does Positional Encoding 'break' the Word's Meaning?">
When you add "random" values to a vector, you change its location in the multidimensional embedding space. However, this doesn't "break" the word:

- **High-Dimensional Space:** In real models, the embedding space is massive. Adding a positional vector moves the word "King" to a new location, but it remains in a "neighborhood" that the model still recognizes as "King."
- **Is it ever removed again?:** It is not explicitly removed: Positional information is added to token embeddings at the input and is subsequently transformed and mixed through the network's layers. Rather than being preserved as a separable signal, positional and semantic information become increasingly entangled through learned linear projections and non-linear transformations, allowing the model to jointly reason about content and position.
- **The Risk of Overlapping**: During training, the model learns to set the "scale" of the embeddings much larger than the "scale" of the positional encodings. This ensures the position "nudges" the meaning without overwriting it.
</div>

<div class="optional md" data-headline="The Decoder-Only Architecture">
Here, we do **not** use the original Encoder-Decoder architecture from Vaswani et al. (\citeyear{vaswani2017attention}). Instead, this example implements a **Decoder-only** Transformer with **Pre-Layer Normalization**, the same structural family that powers today's leading LLMs (GPT, Claude, Gemini and so on). The entire model is a stack of identical Decoder (with different weights) blocks, each containing:

1. **Pre-LN**: Layer Normalization is applied *before* each sublayer (attention and FFN), rather than after. This is a more modern convention (see \citetitle{xiong2020}) that improves gradient flow and training stability through deep stacks.
2. **Masked (Causal) Self-Attention**: Every token can only attend to itself and the tokens that came before it. This is enforced by setting the upper triangle of the attention score matrix to $-\infty$ before the SoftMax. This causal constraint is what makes the model **autoregressive**: to predict token $t_{n+1}$, the model processes $[t_1, t_2, \ldots, t_n]$ and prevents any token from "cheating" by looking at future positions.
3. **A Feed-Forward Network (FFN)** with GELU activation and its own Pre-LN and residual connection.

This is the architecture you are interacting with in every visualization here. When you see the attention heatmaps, the causal mask is the reason the upper-right triangle is always zero.
</div>

<div class="md">
## The Residual Stream

<div class="smart-quote" data-cite="heraclitus500fragments" data-after="B 12">
Everything is in flux.
</div>

In the Transformer, the Residual Stream embodies Heraclitus' flux, serving as a shared "notebook" where the original identity $h_0$ is preserved through \cite[additive skip connections]{he2015resnet} like in **ResNet**, $x_{\text{new}} = x + \text{layer}(x)$, which serve two purposes:

1. It allows very deep networks without the **Vanishing Gradient**-problem.
2. It serves as a shared notebook where, at each layer, the "experts" at that layer write down their results in the original stream, so it becomes a \cite[communication bus]{elhage2021mathematical} for all **Attention Heads** and **Feed-Forward-Networks**, where they perform "collaborative editing" by adding insights rather than overwriting the signal.

This architecture is governed by the \cite[Information Bottleneck principle]{tishby2000informationbottleneck}; because the dimensionality $d_{\text{model}}$ is fixed, the stream forces a transition from surface-level features to task-relevant abstractions as depth increases. Ultimately, this constrained "river width" acts as an implicit regularizer, necessitating that token-level noise distill into conceptual structure to survive the journey through the layers.

## Masked Self-Attention

To ensure the model learns to generate text autoregressively, we prevent it from "looking into the future" during training. For any token $i$, we restrict its focus to itself and preceding tokens $\{1, \dots, i\}$.

We enforce this constraint by adding a **Causal Mask** ($M$) to the attention scores before the Softmax operation. This lower-triangular matrix is defined as:

$$M_{i,j} = \begin{cases} 0 & \text{if } i \geq j \\ -\infty & \text{if } i < j \end{cases}$$

For a 4-token sequence, $M$ is:
$$M = \begin{pmatrix} 0 & -\infty & -\infty & -\infty \\ 0 & 0 & -\infty & -\infty \\ 0 & 0 & 0 & -\infty \\ 0 & 0 & 0 & 0 \end{pmatrix}$$

The modified attention calculation then is:
$$\text{Attention}(Q, K, V) = \text{softmax} \left( \frac{QK^\top}{\sqrt{d_k}} + M \right) V$$

Since $e^{-\infty}$ approaches $0$, the Softmax function nullifies the weights for all "future" positions ($i < j$), effectively neutralizing those connections.

The causal mask creates an **information gradient** across the sequence. Because later tokens attend to more preceding context, their representations are richer than those of earlier, "impoverished" tokens. This **information funnel** makes the last token uniquely privileged, as it is the only position that has "seen" the entire context, which is why its hidden state is used for next-token prediction.

This is also important for **prompt engineering**:
* **Position matters:** Token position acts as a form of informational privilege.
* **Context accumulation:** Placing critical instructions at the *end* of a prompt ensures they are built from the full preceding context, whereas instructions at the *beginning* can only be passively attended to (and potentially diluted) by later tokens.

### The **Single-Head Attention**

The job of a Single Attention Head is to find some form of relation between all the input tokens after they've been multiplied with the $Q$, $K$ and $V$-matrices. This could be, for example, to detect which part of a sentence is a verb and which object it attends to. In real transformers, it rarely is *that* interpretable, though.

$$\text{Attention}(Q, K, V) = \text{Softmax}\left(\frac{Q \cdot K^T}{\sqrt{d_k}}\right) \cdot V$$

#### Concatenation Definition
Instead of one massive attention operation, we use **Multi-Head Attention**. We split the hidden state's $d_{\text{model}}$ into $h$ different "heads." Each head $i$ has its own set of projection matrices $\{W_i^Q, W_i^K, W_i^V\}$, allowing the model to focus on different aspects (e.g., syntax, or resolving long-distance dependencies, but also very abstract features, for which human language doesn't have any names) simultaneously.

For $h$ heads, where each head has dimension $d_k$ (for keys and queries) and $d_v$ (for values):

$$\text{Concat}(\text{head}_1, \dots, \text{head}_h) = [ \text{head}_1, \text{head}_2, \dots, \text{head}_h ]$$

If $d_\text{model} = 512$ and we have $h = 8$ heads (with $d_k = d_v = 64$ in the original Transformer):
* **Each head:** $d_k = d_v = \frac{512}{8} = 64$
* **Shapes:** $\underbrace{(B, T, 64)}{\substack{\text{head } 1}} + \dots + \underbrace{(B, T, 64)}{\substack{\text{head } 8}} \xrightarrow{\text{Concat}} \underbrace{(B, T, 512)}{\substack{\text{Full Tensor}}}$

If $h_1 = [1, 2]$ and $h_2 = [3, 4]$:
$$\text{Concat}(h_1, h_2) = [1, 2, 3, 4]$$
The output width is simply the sum of the input widths.

#### Multi-Head Attention: Lateral Parallelism

After the heads process the sequence, they are **concatenated** and multiplied by a final output matrix $W^O$. The intermediate state after the attention sub-layer (but before the FFN) is denoted $z_0$ — the recurrence below uses $z_n$ for the same intermediate state at layer $n$, while $h_{n+1}$ denotes the *block-output* state after both attention and FFN:
</div>

$$\text{MultiHead}(h_0) = \text{Concat}(\text{head}_1, \dots, \text{head}_h) \cdot W^O$$
$$z_{0} = h_{0} + \text{MultiHead}(\text{LayerNorm}(h_{0}))$$

<div class="md">
This Layer Normalization ensures that the values don't 'explode' and get too large, since they are, after being normalized, always in around 0 with a variance of 1. Without it, the values might get bigger and bigger with many layers.

* $B = \text{Batch Size}$ (The number of independent sequences processed in a single forward pass)
* $T = \text{Sequence Length}$ (The number of tokens/words in each sequence; **note**: $T$ is reused as the *temperature* symbol in the Sampling section — context disambiguates.)
* $d_k = \text{Key/Query Head Dimension}$ (dimensionality of the projected keys and queries in each head; usually $d_\text{model} / h$)
* $d_v = \text{Value Head Dimension}$ (dimensionality of the projected values in each head; in the original Transformer $d_v = d_k$, but the two can differ in general)

For a single head, we say:
</div>

$$\underbrace{\text{head}_{i+1}}_{(B, T, d_v)} = \text{Attention}(\underbrace{h_i W_i^Q}_{Q \in \mathbb{R}^{d_k}}, \underbrace{h_i W_i^K}_{K \in \mathbb{R}^{d_k}}, \underbrace{h_i W_i^V}_{V \in \mathbb{R}^{d_v}})$$

<div class="md">
Which transforms the input in the shape of $(B, T, h \cdot d_v)$ to $(B, T, d_{\text{model}})$.

The association between *Query* and *Key* and concrete tokens is only true in the first layer, where it is taken from the concrete embeddings. In further layers, it works on the abstract feature space instead.

In this stage, it is already abstracted away from the concrete Embedding Space (for example, by positional encoding).
</div>

<div class="optional md" data-headline="Gradient Clipping: The Immune System of Training">
Layer Normalization keeps activations stable, but during backpropagation, gradients can still explode. A single pathological training example can produce a gradient so large that it destroys all learned weights in one step — the **exploding gradient** problem.

Gradient clipping is the complementary defense: it caps the magnitude of gradients so that no single update can change the model by more than a fixed amount. Mathematically, if the gradient vector $\mathbf{g}$ has elements larger than a threshold $\tau$, each element is rescaled:

$$g_i' = \begin{cases} g_i & \text{if } |g_i| \leq \tau \\ \tau \cdot \text{sign}(g_i) & \text{if } |g_i| > \tau \end{cases}$$

In this implementation, gradients are clipped to the range $[-1, 1]$. This is the numerical equivalent of an immune system: the body allows gradual adaptation (learning) but violently rejects sudden massive changes. Without clipping, one bad sentence in the training data could corrupt the entire model. With it, the damage is bounded.

However, like an immune system, it is imperfect — it can also suppress legitimate large updates that the model actually needs, slowing learning on genuinely novel patterns.
</div>

<div class="optional md" data-headline="Why Gradients Vanish or Explode: The Chain Rule">
The root cause of both vanishing and exploding gradients is the **chain rule** of calculus. During backpropagation, the gradient at layer $l$ is the product of all gradients from layer $L$ down to $l$:

$$\frac{\partial \mathcal{L}}{\partial W_l} = \frac{\partial \mathcal{L}}{\partial h_L} \cdot \prod_{k=l}^{L-1} \frac{\partial h_{k+1}}{\partial h_k}$$

Each term $\frac{\partial h_{k+1}}{\partial h_k}$ contains the weight matrix $W_k$. If the eigenvalues (spectral radius) of these weight matrices are consistently less than 1, the product shrinks exponentially with depth, causing the gradient to **vanish** — early layers receive near-zero updates and stop learning. If the eigenvalues are greater than 1, the product grows exponentially, causing the gradient to **explode** — early layers receive destructive updates.

This is why simple deep networks without residual connections and normalization are so hard to train: the product of 100 matrices, each with spectral radius 0.9, decays as $0.9^{100} \approx 0.00003$, effectively killing learning in the first layers. The residual connection solves this by providing an additive identity path $x_{l+1} = x_l + F(x_l)$, which ensures that the gradient can flow backward through the skip connection without passing through any weight matrices:

$$\frac{\partial x_{l+1}}{\partial x_l} = I + \frac{\partial F}{\partial x_l}$$

The identity term $I$ ensures that the gradient has a "highway" that bypasses the multiplicative chain, preventing both vanishing and explosion regardless of depth.
</div>

<div class="optional md" data-headline="What the heads actually react to">
In the paper \citealternativetitle{analyzingmultiheads}, the study identified that the most "important" heads in encoder models often perform three specific, interpretable functions:

* **Positional Heads**: These heads attend to adjacent tokens, usually the previous or the next token in the sequence. They are essential for capturing the local structural order of the sentence.
* **Syntactic Heads**: These heads align with specific syntactic dependencies. They show a high success rate in identifying grammatical relationships, such as the relation between a verb and its direct object.
* **Rare Words Heads**: Typically found in the first layer of the encoder, these heads specifically attend to the most infrequent tokens in a sentence, helping the model manage low-frequency vocabulary.

However, research into larger Decoder-only models from \cite[Elhage et al., 2021]{elhage2021mathematical} and \cite[Olsson et al., 2022]{incontextlearninghead} and recent discoveries in mechanistic interpretability have revealed even more specialized mechanisms:

* **Induction Heads**: These specialized heads develop in the middle layers and are responsible for pattern matching. If they see a sequence like [A][B] and later encounter [A], they "induce" that [B] should follow. This is considered the primary mechanism behind a model's ability to follow instructions in a prompt.
* **Successor Heads**: Identified as universal circuits across various architectures \cite[Gould et al., 2024]{successorheads}, these heads perform logical incrementation. They map tokens to their ordinal successors, such as "Monday" to "Tuesday", "January" to "February", or "1" to "2".
* **Name Mover Heads**: Observed in tasks like Indirect Object Identification by \cite[Wang et al., 2022]{interpretabilityinwild}, these heads extract specific entities (like names) from the earlier context and "move" them to the final token position to ensure logical consistency in the output.
* **Negative / Copy Suppression Heads**: These heads, identified by \cite[McDougall et al., 2023]{copysuppression}, actively suppress tokens that are over-predicted by other circuits. They act as a corrective mechanism to prevent the model from repeating itself or making common probabilistic errors.
* **Safety / Refusal Heads**: Recent research by \cite[Zhou et al.]{safetyheads} suggests that specific heads act as "gatekeepers" for safety alignment. When these heads are ablated, models may lose their ability to refuse harmful prompts, indicating they are key feature extractors for safety boundaries.
* **S-Inhibition / Delimiter Heads**: These heads act as structural anchors, often attending to punctuation or special tokens. They help the model manage signal-to-noise ratios by providing a "resting place" for attention when no relevant semantic information is found.
</div>

<div class="optional md" data-headline="Attention-Heads and In-Context-Learning">
Induction heads represent a specialized evolutionary step beyond the "Positional Heads"
described in Voita et al. (\citeyear{analyzingmultiheads}). While a standard positional head might only look at
the token immediately before it, the Induction Head circuit uses that information
to perform algorithmic copying.

In a sequence like "Harry Potter ... Harry", the process unfolds as follows:

- **Step 1: The Previous Token Head (Early Layer):** This functions like the
  "Positional Head". At the first instance of [Potter], it looks back
  at [Harry] and encodes that "Harry preceded me."
- **Step 2: The Induction Head (Later Layer):** When the model sees [Harry]
  a second time, this head searches the entire context for previous [Harry]
  tokens. It ignores the current position and instead "attends" to the
  [Potter] token because [Potter] carries the signal that it follows [Harry].
- **The Result:** The model copies [Potter] into its current prediction.

This discovery is significant because it shows that models don't just learn
static "Syntactic" rules; they learn to build dynamic "search engines" that
allow them to learn new patterns in real-time during a single prompt.
</div>

<div class="optional md" data-headline="Layer-Depth Progression and Abstraction in Transformers">
The progression of data through the layers of a Transformer follows a systematic evolution that mirrors the hierarchical structure of Convolutional Neural Networks. In a CNN, the initial layers focus on raw pixels while subsequent layers analyze the output of those earlier stages to form abstract concepts. Similarly, Transformer attention heads in the first layer look at the concrete sentence data itself. As information moves deeper, each layer processes the results of the previous one, gradually abstracting away from the specific training and inference data toward higher-level representations.

This systematic change in attention patterns can be categorized as follows:

- **Early Layers:** Local and positional patterns dominate. The model focuses on the actual data tokens, looking at diagonal or adjacent positions similar to how a CNN identifies basic edges or pixels.
- **Middle Layers:** Semantic and syntactic patterns emerge. Here, the model begins to identify dependency arcs and coreference resolution, focusing on the structural relationships between tokens.
- **Late Layers:** Focus becomes diffuse or highly task-specific. These layers concentrate on tokens relevant to the final prediction, representing a high level of abstraction that is far removed from the concrete input values.

By switching between layers in a visualization, you can observe this transition from raw data processing to complex, abstracted analysis.
</div>

<div class="optional md" data-headline="Why calculating the Query-Key-Values is not as expensive as it looks like">
The **KV-Cache** (**Key-Value-Cache**) is an optimization that prevents $\mathcal{O}(T^2)$ redundancy during generation. This would happen because every token needs to look at every other tokens, but it can be prevented:
Since the Transformer is autoregressive, the hidden states of past tokens remain static once computed. Instead of re-processing the entire sequence for every new word, we store the Key ($K$) and Value ($V$) vectors in a dedicated cache.

During each step of inference:
1. Only the newest token is projected into its $Q$, $K$, and $V$ components.
2. This new $K$ and $V$ pair is added to the cache history.
3. The current Query ($Q$) performs a dot-product attention against all
   cached Keys to determine relevance.
4. The result is used to weigh the cached Values, producing the next
   hidden state without re-calculating the past.

This reduces the computational complexity of the projection phase from
quadratic to $\mathcal{O}(T)$ relative to sequence length $T$.

## The Feed-Forward Network
While self-attention enables information exchange across the sequence, the Feed-Forward Network (FFN) applies a learned, non-linear transformation independently to each token's representation. In this sense, it functions as the model's primary per-token computational stage, complementing attention's role in information routing and aggregation.

\cite[Empirical studies]{keyvalmem} suggest that FFN layers are a major locus of memorized associations and factual patterns, although such knowledge is distributed across the network rather than localized to a single component.

To calculate the transformation of a contextual vector through the FFN, you apply two linear transformations with a non-linear activation and biases:

$$\text{FFN}(h_1) = \sigma(h_1 W_1 + b_1)W_2 + b_2$$

Where:
- $W_1$ is the first weight matrix (expansion to $d_\text{ff}$, usually $4 \times d_{\text{model}}$).
- $b_1$ is the bias vector for the first layer.
- $\sigma$ is the activation function (like GELU, which the nanoGPT architecture uses, replacing the original ReLU).
- $W_2$ is the second weight matrix (compression back to $d_{\text{model}}$).
- $b_2$ is the bias vector for the second layer.

While attention decides *what to look at*, the FFN decides *what to do with it*.

The final state of this block, **$h_1$**, is formed by another residual connection:

$$h_{1} = z_{0} + \text{FFN}(\text{LayerNorm}(z_0))$$

## The $N$-Layer Recurrence
In practice, a Transformer is not just two steps; it is a stack of $N$ structurally identical but independently weighted blocks, each moving the representation further through the Feature Space to refine meaning.

For any layer $n$, the transition to the next hidden state $h_{n+1}$ can be generalized as:

$$
\begin{aligned}
z_n &= h_n + \text{MultiHeadAttention}(\text{LayerNorm}(h_n)) \\
h_{n+1} &= z_n + \text{FeedForward}(\text{LayerNorm}(z_n))
\end{aligned}
$$

As $h$ progresses from $h_0$ to $h_{N}$, the vector for "apple" might move from being near "fruit" to being near "tech company" based on the contextual "nudges" received in the Feature Space during each Attention and FFN cycle.
</div>

<div id="ffn-equations-container"></div>

<div id="transformer-migration-plots-container"></div>

<div class="optional md" data-headline="Why the Diagonal Gets Weaker: It's Just 1/n">
In a causal attention matrix, token $i$ can attend to tokens $0, 1, \dots, i$, exactly $i + 1$ candidates. Since softmax forces each row to sum to 1:

$$\sum_{j=0}^{i} \alpha_{i,j} = 1$$

When the model is **untrained**, $W_Q$ and $W_K$ are randomly initialized, so all dot-product scores $Q_i \cdot K_j^T$ are roughly similar. Softmax over nearly-equal values produces a **near-uniform distribution**, meaning the self-attention weight on the diagonal is approximately:

$$\alpha_{i,i} \;\approx\; \frac{1}{i+1}$$

Here is the theoretical attention matrix for a 5-token sequence under uniform attention:

$$A = \begin{pmatrix} \mathbf{1.000} & 0 & 0 & 0 & 0 \\ 0.500 & \mathbf{0.500} & 0 & 0 & 0 \\ 0.333 & 0.333 & \mathbf{0.333} & 0 & 0 \\ 0.250 & 0.250 & 0.250 & \mathbf{0.250} & 0 \\ 0.200 & 0.200 & 0.200 & 0.200 & \mathbf{0.200} \end{pmatrix}$$

The diagonal reads $\frac{1}{1},\; \frac{1}{2},\; \frac{1}{3},\; \frac{1}{4},\; \frac{1}{5}$. The small deviations come from the random weights not producing *perfectly* identical scores, but they're close enough that softmax still spreads probability nearly uniformly. After training, $W_Q$ and $W_K$ learn to produce sharply different scores, so attention concentrates on semantically important tokens and this uniform $\frac{1}{n}$ pattern disappears.
</div>

<div class="optional md" data-headline="Mixture of Experts (MoE)">
The Feed-Forward Network (FFN) described above applies the same dense
transformation to every token: $\text{FFN}(x) = \sigma(xW_1 + b_1)W_2 + b_2$.
This example uses exactly that standard, dense FFN. However, modern
large-scale systems replace it with a **Mixture of Experts** (MoE)
layer to increase model capacity without proportionally
increasing compute cost. The core idea, first proposed in
\cite[Adaptive Mixtures of Local Experts]{jacobs1991moe}, is to maintain
multiple parallel FFN sub-networks (experts) alongside a learned gating
network that routes each input to the most relevant expert, a
"divide and conquer" approach where specialised networks handle
different regions of the input space.

This concept remained difficult to
scale until \cite[the Sparsely-Gated MoE layer]{shazeer2017moe}
introduced the critical principle of **sparsity**: instead of
activating all experts for every token, a sparse gating function selects
only the top one or two, so the output becomes
$\sum_{i \in \text{TopK}} G(x)_i \cdot \text{FFN}_i(x)$ over just the
chosen experts. This allows models to scale to trillions of total
parameters while keeping per-token compute roughly constant, since only
a small fraction of parameters are active for any given input.
</div>

<div class="md">
## From Hidden States to Probabilities

After passing through $N$ layers, we reach the final hidden state, **$h_{\text{final}}$**. To turn this into a word, we project it against the entire vocabulary:

$$\text{Logits} = h_{\text{final}} \cdot W_{\text{Vocab}}^T$$

**The Transformation:**
1. **Logits**: Raw scores for every word in the dictionary.
2. **SoftMax**: Normalizes scores into probabilities (0 to 1).
3. **Temperature ($T$)**: Modifies the SoftMax: $\sigma(z)_i = \frac{e^{z_i/T}}{\sum e^{z_j/T}}$.

This architecture subordinates to the Bitter Lesson by \citeauthor{sutton2019bitter}: computation and general-purpose learning eventually outperform hand-crafted linguistic rules.

We have arrived at the final vector $h_{\text{final}}$ for the last token. To convert this abstract geometric location back into a specific word from our vocabulary, we perform a dot product against the **Unembedding Matrix** ($W_\text{vocab}$). This effectively asks: "How similar is our current thought vector to every known word vector?"

## Step-by-Step Logit Calculation

To get the logit for each word, we calculate the dot product between the final hidden state vector $h_\text{last}$ and the word's learned embedding row $w_\text{row}$ from the Unembedding Matrix $W_\text{vocab}$. It really only uses the last row of the last calculation of the network, as that one is the last word the transformer has seen, and this one is used for the next word. The previous numbers in the last matrix are not used here per se, but they were needed to calculate this one in the attention and $W_\text{FFN}$ matrices. They are just ignored in the last step, yet calculated because that is required by the structure.


The hidden state vector $\mathbf{h}_{\text{last}}$ (represented by `h[pos]`) is dotted against each row $\mathbf{e}_w$ of the unembedding matrix $W \substack{\text{vocab}}$ to produce the logit for word $w$:
</div>

$$\text{logit}_w = \mathbf{h}_{\text{last}} \cdot \mathbf{e}_w = \sum_{k=0}^{d-1} h_k \cdot e_{w,k}$$

<div class="md">
This operation computes the entire logit vector $\mathbf{L}$ simultaneously. If $W_{\text{vocab}}$ is a matrix where each row is a word embedding, the operation is a matrix-vector multiplication:

$$\mathbf{L} = W_{\text{vocab}} \mathbf{h}_{\text{last}}$$

This essentially iterates through the rows of $W_{\text{vocab}}$, calculating the similarity of each word to the models final internal state.

To get from the long matrix to the single vector, the model performs a **Terminal Selection**

If we represent the output of the last transformer block as a matrix $H$:
$$H = \begin{pmatrix}
	h_0 \\
	h_1 \\
	\vdots \\
	h_{n}
\end{pmatrix} \in \mathbb{R}^{n \times d_{\text{model}}}$$

The "Migration Map" prints the entire flattened matrix because it wants to show the path of every word. However, the final projection is only interested in the **prediction**:

$$h_{\text{last}} = H[n]$$

Remember that the $n$ is the number of tokens in the **Inference**-sequence, not in the training sequence, even though the $h_\text{after}$ may be from the training data.

This single row $h_{\text{last}}$ is a vector in $d_{\text{model}}$ space. When the model is, for example, $d_{\text{model}}=3$, it is always exactly 3 numbers (but in general, it's always $d_\text{model}$). These 3 numbers are a "compressed summary" of the entire sequence's context, which is why the previous tokens can be "ignored" at this specific final stage, their influence is already baked into that last vector.
</div>

<div class="optional md" data-headline="The Unembedding Matrix as a Dual Space">
The unembedding matrix $W_U$ (often equal to $W_E^T$ due to weight tying) does more than just produce logits. It defines a **dual space** where every direction in the residual stream has a direct linguistic interpretation. Each row of $W_U$ is a "detector" for a specific token: moving the residual stream vector in the direction of $W_U[\text{"Paris"}]$ literally increases the probability of outputting "Paris."

This leads to the **logit lens** technique: by applying $W_U$ to the residual stream at any intermediate layer (not just the final one), you can see what the model "would predict" at that point. Research shows that the model's belief about the next token evolves continuously through the layers, often settling on the correct answer many layers before the output. The attention heads and FFN layers are not performing abstract, uninterpretable operations — they are nudging the residual stream toward or away from specific words, and the unembedding matrix lets us read off what they are doing at every step.
</div>

<div class="optional md" data-headline="From Logits to Probabilities: A numerically stable Softmax">
The softmax function converts raw logits into a probability distribution. It uses the **numerically stable** version by first subtracting the maximum logit $m = \max(\mathbf{L})$ to prevent overflow:

$$P(w) = \text{softmax}(\text{logit}_w) = \frac{e^{\text{logit}_w - m}}{\displaystyle\sum_{w'} e^{\text{logit}_{w'} - m}}$$

**Why subtract $m$?** Without this trick, $e^{\text{logit}}$ can overflow to `Infinity` for large logits. Subtracting $m$ ensures the largest exponent is $e^0 = 1$, keeping all values in a safe numerical range.
</div>

<div class="optional md" data-headline="Logits, Probits, and Related Link Functions">
The **logit** and **probit** models are foundational tools in statistical modeling for
binary and categorical outcomes. The **logit function**, defined as
$\log\left(\frac{p}{1 - p}\right)$, was first introduced by \citeauthor{logitorigin} in his \citeyear{logitorigin} paper
"\citetitle{logitorigin}". Berkson coined the term "logit" as an
analogy to the already-established "probit." The **probit model**, which uses the
inverse of the standard normal cumulative distribution function $\phi^{-1}\left(p\right)$ as its link
function, was developed earlier by \citeauthor{probitorigin} in his \citeyear{probitorigin} paper "\citetitle{probitorigin}".

Beyond logits and probits, several other link functions serve similar purposes in
**generalized linear models (GLMs)**, a framework formalized by \citeauthorlastnameand{generalizedlinearmodels}
in their seminal \citeyear{generalizedlinearmodels} paper "\citetitle{generalizedlinearmodels}". The **complementary log-log
($\text{cloglog}$)** link, defined as $\log\left(−\log\left(1 − p\right)\right)$, is useful for modeling asymmetric
binary outcomes and is closely tied to extreme value distributions, as explored by
\citeauthor{statisticsofextremes} in his \citeyear{statisticsofextremes} work
"\citetitle{statisticsofextremes}".

The **cauchit** link uses the inverse of the Cauchy CDF and is more robust to outliers in the latent
variable, as discussed by \citeauthorlastnameand{parametriclinks} in their
\citeyear{parametriclinks} paper "\citetitle{parametriclinks}".
Additionally, the **log-log link**, defined as $-\log\left(-\log\left(p\right)\right)$, mirrors the
$\text{cloglog}$ for the opposite tail of the distribution, as detailed by
\citeauthorlastnameand{glmsecondedition} in \citeyear{glmsecondedition} in "\citetitle{glmsecondedition}".
</div>

<div class="optional md" data-headline="Temperature and the Shannon-Entropy">
The **\citeauthorlastnameand{shannon1951communication} entropy** $H = -\sum_w P(w) \log_2 P(w)$ measures the "randomness" of the distribution. Lower temperature decreases entropy (more confident), higher temperature increases it (more exploratory). Maximum entropy $H_{\max} = \log_2(|V|)$ corresponds to a perfectly uniform distribution.
</div>

<div class="optional md" data-headline="Temperature Scaling">
Temperature controls the **sharpness** of the probability distribution by scaling the logits *before* the softmax. The modified softmax with temperature is:

$$P(w) = \text{softmax}\!\left(\frac{\text{logit}_w}{T}\right) = \frac{e^{\,\text{logit}_w \,/\, T}}{\displaystyle\sum_{w'} e^{\,\text{logit}_{w'} \,/\, T}}$$

Dividing by $T$ rescales the logit differences. When $T < 1$, the differences are *amplified*, making the distribution sharper (more deterministic). When $T > 1$, the differences are *compressed*, making the distribution flatter (more random). At $T = 1$, it behaves as the standard SoftMax.

| Temperature | Effect | Behavior |
|---|---|---|
| $T \to 0^+$ (Greedy) | $\frac{z_i}{T} \to \pm\infty$ | All probability mass on the argmax. Deterministic output. |
| $T = 1$ (Standard) | $\frac{z_i}{T} = z_i$ | Unmodified softmax. The model's learned distribution. |
| $T \to \infty$ (Uniform) | $\frac{z_i}{T} \to 0$ | All logits collapse to 0. |
</div>


<div>
	<label style="font-weight: bold;">Temperature ($T$): <span id="temp-val" style="font-weight: bold; color: #3b82f6;">1.0</span></label>
	<p style="font-size: 0.75rem; color: #64748b; margin: 2px 0;">
		<b>Effect:</b> Controls the "sharpness" of the probability distribution.<br>
		<b>Reason:</b> Low values ($T < 1$) force the model to be deterministic; high values ($T > 1$) increase diversity by making unlikely words more probable.
	</p>
	<input type="range" id="transformer-temperature" min="0.1" max="2.0" step="0.1" value="1.0" style="width: 100%; vertical-align: middle;" oninput="document.getElementById('temp-val').innerText = this.value; rerender_temperature_only();">
</div>

<div id="transformer-output-projection" style="background: var(--mn-surface, white); padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px; margin-top: 20px;"></div>

<div>
	<label style="font-weight: bold; display: block; margin-top: 15px; margin-bottom: 8px;">Input (Inference):</label>
	<input type="text" id="transformer-master-token-input" class="bw-cell" style="width: 90%; font-size: 1.1rem;" value="the">
</div>

<div class="md">
## How ChatGPT Actually Works: The Full Pipeline

Here is the complete path a prompt takes through the system, from raw text to generated response:

1. **Tokenization** — The input string is chopped into subword tokens using BPE. Each token is mapped to an integer ID. "The cat sat" might become `[1996, 4937, 4021]`.

2. **Embedding** — Each token ID is looked up in the embedding matrix $W_E$, producing a dense vector of dimension $d_{\text{model}}$. These vectors live in a semantic space where similar words are close together.

3. **Positional Encoding** — A position signal is added to each embedding so the model knows the order of tokens. Without this, "dog bites man" and "man bites dog" would be identical to the model.

4. **Transformer Layers ($N \times$)** — Each layer applies two sub-modules, with **residual connections** so the original information is never lost:
   - **Multi-Head Self-Attention:** Each token queries all others, computes relevance scores, and gathers contextual information. Multiple heads run in parallel, each specializing in different linguistic relationships (syntax, semantics, coreference).
   - **Feed-Forward Network (FFN):** Each token is processed independently through an expanding activation layer (detectors) and a contracting projection layer (knowledge retrieval). This is where memorized facts and patterns are applied.

5. **Unembedding** — The final hidden state of the last token is multiplied by the unembedding matrix $W_U$ (often the transpose of $W_E$), producing a logit score for every word in the vocabulary.

6. **Sampling** — Logits are scaled by temperature and passed through softmax to produce probabilities. A token is sampled from this distribution (greedy: pick the max; stochastic: sample proportionally). The sampled token is appended to the input, and the process repeats from step 1 until the model emits an end-of-sequence token.

Every step is differentiable, every transformation is a matrix operation, and no component has access to anything beyond the current context window. The entire architecture is a single, differentiable function $f_\theta(\text{prompt}) \to \text{next token distribution}$.

## Key Intuitions about LLMs

At no point does the model manipulate symbols or rules, like non-connectionist AI systems tried to do. Everything is:

- vector projection,
- geometric alignment,
- weighted averaging,
- non-linear transformation.

Meaning emerges not from words themselves, but from how vectors **move, align, and combine** in space.

## Inference vs. Training: Two Modes of Operation

While the architecture is identical in both modes, the behavior of the model differs fundamentally between **inference** and **training**:

| Aspect | Inference | Training |
|--------|-----------|----------|
| **Goal** | Generate text | Update weights to minimize loss |
| **Weights** | Frozen, never change | Updated via gradient descent |
| **Dropout** | Disabled (all neurons active) | Enabled (randomly drops neurons) |
| **Batch Normalization** | Uses running statistics | Uses batch statistics |
| **KV Cache** | Active (stores past K/V for speed) | Not used (full sequence processed at once) |
| **Gradients** | Not computed | Computed via backpropagation |
| **Memory** | O(context) for KV cache | O(context²) for attention matrix + all intermediate activations |
| **Parallelism** | Sequential (one token at a time) | Parallel (all tokens in the batch processed simultaneously) |
| **Randomness** | Controlled by temperature / top-p | Controlled by dropout / data shuffling |

**The key distinction:** During training, the model sees the entire target sequence and learns to predict each token conditioned on all previous tokens, computing gradients to update weights. During inference, the model has no target — it generates tokens one at a time, using its own previous outputs as context for the next prediction. This is why inference is inherently sequential while training can be parallelized across the sequence length.

</div>

<div id="tda-live-section" class="tda-live-section" style="margin: 20px 0; padding: 18px; background: var(--mn-bg-subtle, #f8fafc); border: 1px solid #e2e8f0; border-radius: 12px;">
	<details open>
	<summary style="cursor: pointer; font-size: 1.05rem; font-weight: 700; color: var(--mn-text, #0f172a); padding: 6px 0;">
		🧭 TDA Live — Attractors in the Residual Stream
	</summary>
	<p style="font-size: 0.85rem; color: var(--mn-text-muted, #64748b); margin: 6px 0 12px 0; max-width: 900px;">
		A <b>topological data analysis</b> of the residual stream and the weight deltas (weights minus their previous
		values). Tokens drift through a phase space; over epochs the drift field reorganizes into <b>attractors</b> (stable
		sinks where states settle, blue) and <b>repellers</b> (unstable points the flow pushes away from, red — not
		necessarily sources of the flow, just points of locally positive divergence). The phase diagram shows the flow
		vectors, the basin of attraction, and the <b>persistence</b> (shape) of the resulting structures via H₀
		components and H₁ loops.
	</p>

	<!-- Controls -->
	<div id="tda-live-controls" style="display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; margin-bottom: 12px; font-size: 0.86rem;">
		<select id="tda-live-mode" title="What to analyze" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: var(--mn-surface, #fff); color: var(--mn-text, #0f172a);">
			<option value="residual" selected>Residual stream</option>
			<option value="delta">Weight deltas (ΔW)</option>
			<option value="weights">Weights (W)</option>
		</select>
		<select id="tda-live-dim" title="View dimension" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: var(--mn-surface, #fff); color: var(--mn-text, #0f172a);">
			<option value="3d" selected>3D (drag to rotate)</option>
			<option value="2d">2D</option>
		</select>
		<select id="tda-live-projection" title="Projection method" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: var(--mn-surface, #fff); color: var(--mn-text, #0f172a);">
			<option value="auto" selected>Auto (native / PCA)</option>
			<option value="pca">Force PCA</option>
			<option value="native">Native dims</option>
			<option value="slice">Slice dims (choose axes)</option>
		</select>
		<span id="tda-live-slice-controls" title="Model-space axes to plot as x / y / z" style="display: none; gap: 6px; align-items: center; font-size: 0.8rem; color: var(--mn-text-muted, #475569);">
			axes
			<input type="number" id="tda-live-axis0" value="0" min="0" max="63" style="width: 44px; padding: 2px 4px; border-radius: 6px; border: 1px solid #cbd5e1; background: var(--mn-surface, #fff); color: var(--mn-text, #0f172a);">
			,
			<input type="number" id="tda-live-axis1" value="1" min="0" max="63" style="width: 44px; padding: 2px 4px; border-radius: 6px; border: 1px solid #cbd5e1; background: var(--mn-surface, #fff); color: var(--mn-text, #0f172a);">
			,
			<input type="number" id="tda-live-axis2" value="2" min="0" max="63" style="width: 44px; padding: 2px 4px; border-radius: 6px; border: 1px solid #cbd5e1; background: var(--mn-surface, #fff); color: var(--mn-text, #0f172a);">
		</span>
			<span style="display: inline-flex; gap: 5px; align-items: center; font-size: 0.8rem; color: var(--mn-text-muted, #64748b);">Layer:
			<select id="tda-live-layer" title="Which residual layer the phase plot shows. 'All layers' stacks every layer; a number shows only that layer as an epoch trail." style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: var(--mn-surface, #fff); color: var(--mn-text, #0f172a);"></select>
		</span>
		<select id="tda-live-colorby" title="Color the point cloud by" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: var(--mn-surface, #fff); color: var(--mn-text, #0f172a);">
			<option value="token" selected>Token</option>
			<option value="layer">Layer</option>
			<option value="density">Density (attractor)</option>
			<option value="velocity">Flow magnitude</option>
		</select>
		<select id="tda-live-flow" title="Vector field source" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: var(--mn-surface, #fff); color: var(--mn-text, #0f172a);">
			<option value="solo" selected>Solo point (phase map)</option>
			<option value="context">In context (sentence)</option>
		</select>

		<label><input type="checkbox" id="tda-live-vf" checked> Vector field</label>
		<label><input type="checkbox" id="tda-live-stream" checked> Streamlines</label>
		<label><input type="checkbox" id="tda-live-trails" checked> Epoch trails</label>
		<label><input type="checkbox" id="tda-live-attractors" checked> Attractor / repeller</label>
		<label><input type="checkbox" id="tda-live-basins"> Basins (2D)</label>
		<label><input type="checkbox" id="tda-live-attn"> Attention flow</label>
		<label><input type="checkbox" id="tda-live-auto" checked> Auto-update</label>

		<span style="display: inline-flex; gap: 6px; align-items: center;">
			Grid <input type="range" id="tda-live-grid" min="3" max="14" value="9" style="width: 90px;">
			<span id="tda-live-grid-val">9</span>
		</span>
		<span style="display: inline-flex; gap: 6px; align-items: center;">
			Eps steps <input type="range" id="tda-live-eps" min="10" max="80" value="40" style="width: 90px;">
			<span id="tda-live-eps-val">40</span>
		</span>
		<span style="display: inline-flex; gap: 6px; align-items: center;">
			History <input type="range" id="tda-live-hist" min="5" max="60" value="30" style="width: 90px;">
			<span id="tda-live-hist-val">30</span>
		</span>

		<button id="tda-live-recompute" style="padding: 4px 12px; border-radius: 6px; border: 1px solid #3b82f6; background: #eff6ff; color: #1d4ed8; cursor: pointer; font-weight: 600;">⟳ Recompute</button>
		<button id="tda-live-retrace" title="Restart the epoch trail from the current state — follow training from here, again and again" style="padding: 4px 12px; border-radius: 6px; border: 1px solid #10b981; background: #ecfdf5; color: #047857; cursor: pointer; font-weight: 600;">↺ Trace from now</button>
		<button id="tda-live-reset" style="padding: 4px 12px; border-radius: 6px; border: 1px solid #ef4444; background: #fef2f2; color: #b91c1c; cursor: pointer; font-weight: 600;">Clear history</button>
		<span id="tda-live-status" style="color: var(--mn-text-muted, #64748b); font-size: 0.8rem;"></span>
	</div>

	<!-- Explainer (live, updated by tda_live.js) -->
	<div id="tda-live-explain" style="font-size: 0.88rem; line-height: 1.5; color: var(--mn-text, #334155); background: var(--mn-bg-subtle, #f1f5f9); border-left: 3px solid #3b82f6; padding: 10px 14px; border-radius: 0 8px 8px 0; margin-bottom: 10px;"></div>

	<!-- Stats -->
	<div id="tda-live-stats" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; font-size: 0.85rem;"></div>

	<!-- Legend -->
	<div id="tda-live-legend" style="display: flex; flex-wrap: wrap; gap: 10px 4px; margin-bottom: 10px; line-height: 1.45;"></div>

	<!-- Main phase space -->
	<div id="tda-live-phase" style="width: 100%; height: 540px; background: var(--mn-surface, white); border-radius: 10px; border: 1px solid #e2e8f0;"></div>

	<!-- Attractor / repeller emergence across layers -->
	<div style="margin-top: 14px;">
		<div style="font-size: 0.8rem; font-weight: 700; color: var(--mn-text-muted, #475569); margin-bottom: 6px;">Attractor &amp; repeller emergence across layers</div>
		<div id="tda-live-sweep-summary" style="font-size: 0.78rem; color: var(--mn-text-muted, #64748b); margin-bottom: 6px; line-height: 1.5;"></div>
		<div id="tda-live-sweep" style="width: 100%; height: 300px; background: var(--mn-surface, white); border-radius: 10px; border: 1px solid #e2e8f0;"></div>
	</div>

	<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px;">
		<div>
			<div style="font-size: 0.8rem; font-weight: 700; color: var(--mn-text-muted, #475569); margin-bottom: 6px;">Persistence diagram — shape of attractors (H₀ red, H₁ blue)</div>
			<div id="tda-live-persistence" style="width: 100%; height: 260px; background: var(--mn-surface, white); border-radius: 10px; border: 1px solid #e2e8f0;"></div>
		</div>
		<div>
			<div style="font-size: 0.8rem; font-weight: 700; color: var(--mn-text-muted, #475569); margin-bottom: 6px;">Persistence barcode</div>
			<div id="tda-live-barcode" style="width: 100%; height: 260px; background: var(--mn-surface, white); border-radius: 10px; border: 1px solid #e2e8f0;"></div>
		</div>
		<div>
			<div style="font-size: 0.8rem; font-weight: 700; color: var(--mn-text-muted, #475569); margin-bottom: 6px;">Betti curves β₀ / β₁ over scale ε</div>
			<div id="tda-live-betti" style="width: 100%; height: 260px; background: var(--mn-surface, white); border-radius: 10px; border: 1px solid #e2e8f0;"></div>
		</div>
		<div>
			<div style="font-size: 0.8rem; font-weight: 700; color: var(--mn-text-muted, #475569); margin-bottom: 6px;">Topology by layer — β₀ / β₁</div>
			<div id="tda-live-topo" style="width: 100%; height: 260px; background: var(--mn-surface, white); border-radius: 10px; border: 1px solid #e2e8f0;"></div>
		</div>
		<div>
			<div style="font-size: 0.8rem; font-weight: 700; color: var(--mn-text-muted, #475569); margin-bottom: 6px;">Learning field — ‖ΔW‖ per matrix (weight deltas)</div>
			<div id="tda-live-weights" style="width: 100%; height: 260px; background: var(--mn-surface, white); border-radius: 10px; border: 1px solid #e2e8f0;"></div>
		</div>
	</div>

	<details style="margin-top: 14px; font-size: 0.85rem; color: var(--mn-text-muted, #475569);">
		<summary style="cursor: pointer; font-weight: 700; color: var(--mn-text, #334155);">❓ How to read the phase diagram</summary>
		<div style="padding: 10px 14px; background: var(--mn-bg-subtle, #f8fafc); border-radius: 8px; line-height: 1.6;">
			<p style="margin: 0 0 8px 0;"><b>The idea:</b> run a point (a token's hidden state) through one more transformer layer and look at the "push" it gets. Repeat this on a grid of points and you get a <b>vector field</b> — a map of how the network moves states around.</p>
			<ul style="margin: 0; padding-left: 20px;">
				<li><b style="color:#2563eb;">Blue cones / arrows</b> = the state is <i>pulled in</i> (negative divergence → an <b>attractor</b>). Hidden states that get pulled in and stay = the "meanings" the model converges to.</li>
				<li><b style="color:#dc2626;">Red cones / arrows</b> = the state is <i>pushed away</i> (positive divergence → a <b>repeller</b>). Unstable points the model keeps everything away from.</li>
				<li><b>Thin colored lines</b> = <b>streamlines</b>: follow one state starting anywhere — it drifts along these lines. Green = it settled into an attractor.</li>
				<li><b>Colored dots</b> = the actual residual states of the words in your sentence (one per token per layer, color = token). See how they sit relative to attractors.</li>
				<li><b>Blue diamond</b> = detected attractor center, <b>red ✕</b> = repeller center.</li>
				<li><b>Persistence / Barcode / Betti:</b> the "shape" of the cloud of states. β₀ = number of separate clusters, β₁ = number of loops/holes in the structure. Hover over any element in the plot for details.</li>
			</ul>
			<p style="margin: 8px 0 0 0;">Tip: switch <b>Projection → Slice dims</b> to look at raw 2D/3D slices of the higher-dimensional state space (choose the axes), or <b>Force PCA</b> if the plot looks flat. To inspect one layer, pick it in the <b>Layer</b> menu in the controls above (or click a layer in the emergence summary) — the phase plot then shows only that layer's states as an epoch trail. Toggle <b>2D/3D</b>, enable <b>Basins (2D)</b> to color the region each attractor "owns", and watch the <b>Attractor &amp; repeller emergence</b> panel to see where each one is born across layers. The plot is interactive — drag to rotate while training runs.</p>
		</div>
	</details>
	</details>
</div>
</div>
