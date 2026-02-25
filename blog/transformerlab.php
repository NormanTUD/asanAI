<?php include_once("functions.php"); ?>

<script src="attention_engine.js"></script>
<script src="attention_path_visualizer.js"></script>

<!--
https://nlp.seas.harvard.edu/2018/04/03/attention.html

https://arxiv.org/html/2505.11611v1
-->

<div class="smart-quote" data-cite="heraclitus500fragments" data-after="B 54">
	The hidden harmony is better than the obvious one
</div>

<div id="transformer_config">
	<div style="margin-bottom: 15px;">
		<label style="font-weight: bold;">Model Dimension ($d_{\text{model}}$): </label>
		<span id="dim-val" style="font-weight: bold; color: #3b82f6;">3</span>
		<p style="font-size: 0.75rem; color: #64748b; margin: 2px 0;">
            <b>Dependency:</b> Must be a multiple of Heads.
            <i>Reason:</i> Each head needs an equal integer-sized slice ($d_k = d_{\text{model}} / h$) of the vector to perform dot products.
        </p>
		<input type="range" id="transformer-dimension-model" min="2" max="16" step="1" value="3"
			style="width: 100%;" oninput="syncTransformerSettings('dim')">
	</div>

	<div style="margin-bottom: 15px;">
		<label style="font-weight: bold;">Attention Heads ($h$): </label>
		<span id="heads-val" style="font-weight: bold; color: #3b82f6;">3</span>
		<p style="font-size: 0.75rem; color: #64748b; margin: 2px 0;">
            <b>Dependency:</b> Must divide into Dimension.
            <i>Reason:</i> Multi-head attention splits the main vector into $h$ parallel "viewpoints." If $d_{\text{model}}$ is 4 and $h$ is 2, each head looks at 2 dimensions.
        </p>
		<input type="range" id="transformer-heads" min="1" max="8" value="3"
			style="width: 100%;" oninput="syncTransformerSettings('heads')">
	</div>

	<div style="margin-bottom: 15px;">
		<label style="font-weight: bold;">Network Depth ($N$ layers): </label>
		<span id="depth-val" style="font-weight: bold; color: #3b82f6;">3</span>
		<p style="font-size: 0.8rem; color: #64748b; margin: 4px 0;">How many transformer blocks are stacked. More layers allow more abstract reasoning.</p>
		<input type="range" id="transformer-depth" min="1" max="96" value="3"
			style="width: 100%;" oninput="document.getElementById('depth-val').innerText = this.value; debounced_run_transformer_demo();">
	</div>

	<div>
		<label style="font-weight: bold;">Temperature ($T$): </label>
		<p style="font-size: 0.75rem; color: #64748b; margin: 2px 0;">
		    <b>Effect:</b> Controls the "sharpness" of the probability distribution.
		    <i>Reason:</i> Low values ($T < 1$) force the model to be deterministic; high values ($T > 1$) increase diversity by making unlikely words more probable.
		</p>
		<span id="temp-val" style="font-weight: bold; color: #3b82f6;">1.0</span>
		<input type="range" id="transformer-temperature" min="0.1" max="2.0" step="0.1" value="1.0" style="width: 200px; vertical-align: middle;" oninput="document.getElementById('temp-val').innerText = this.value; debounced_run_transformer_demo();">
	</div>

	<div style="margin-bottom: 15px;">
	    <label style="font-weight: bold;">Context Size: </label>
	    <span id="context-val" style="font-weight: bold; color: #3b82f6;">64</span>
	    <p style="font-size: 0.75rem; color: #64748b; margin: 2px 0;">
		<b>Effect:</b> Sets the maximum number of tokens the model can "see" at once during training and inference.
		<i>Reason:</i> A larger context window allows the model to capture longer-range dependencies between words, but increases memory and computation cost quadratically due to the attention matrix being of size $\text{Context}^2$.
	    </p>
	    <input type="range" id="transformer-context-size" min="2" max="128" step="1" value="64"
		style="width: 100%;" oninput="document.getElementById('context-val').innerText = this.value; debounced_run_transformer_demo();">
	</div>

	<div>
	    <label style="font-weight: bold;">Tokenizer: </label>
	    <select id="transformer-tokenizer-type" style="padding: 4px; border-radius: 4px; border: 1px solid #cbd5e1;" onchange="debounced_run_transformer_demo()">
		<option value="regex" selected>Words (Non-Alphanumeric Split)</option>
		<option value="bpe">Byte-Pair Encoding (BPE)</option>
	    </select>
	</div>
	<div id="nr_params" style="display: none"></div>
</div>

<div class="transformer_corpus">
    <label style="font-weight: bold; display: block; margin-bottom: 8px;">Training Data (Corpus):</label>
    <textarea
        id="transformer-training-data"
        style="width: 90%; height: 60px; font-family: 'Courier New', monospace; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;"
        oninput="debounced_run_transformer_demo('transformer-training-data')">the king rules the land and the queen rules the sea</textarea>
</div>

<div style="background: #f0fdf4; padding: 15px; border: 1px solid #10b981; border-radius: 8px; margin-top: 15px; margin-bottom: 15px;">
    <div style="display: flex; gap: 15px; flex-wrap: wrap; align-items: center;">
        <div>
            <label style="font-weight: bold; font-size: 0.9rem;">Epochs:</label>
            <input type="number" id="train-epochs" value="100" style="width: 60px; padding: 4px;">
        </div>
        <div>
            <label style="font-weight: bold; font-size: 0.9rem;">Learning Rate:</label>
            <input type="number" id="train-lr" value="0.01" step="0.01" style="width: 70px; padding: 4px;">
        </div>
        <div>
            <label style="font-weight: bold; font-size: 0.9rem;">Optimizer:</label>
            <select id="train-optimizer" style="padding: 4px;">
                <option value="adam">Adam</option>
                <option value="sgd">SGD</option>
                <option value="rmsprop">RMSProp</option>
            </select>
        </div>

	<button class="train-btn" onclick="train_transformer()">Train Model</button>

	<div id="training-status" style="margin-top: 10px; font-size: 0.85rem; color: #047857; min-height: 20px; display: none"></div>
	<div id="training-loss-plot" style="width: 100%; height: 200px; margin-top: 10px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; display: none"></div>
    </div>
</div>

<div id="show_training_sentences" style="display: none">
	<p>Current Training Windows: <span id="current_training_sentence"></span></p><br>
</div>

<!-- Data View Toggle -->
<div id="data-view-toggle" style="margin-bottom: 15px; padding: 10px 15px; background: #f0f4ff; border: 1px solid #3b82f6; border-radius: 8px; display: flex; align-items: center; gap: 15px;">
    <label style="font-weight: bold; font-size: 0.95rem; color: #1e40af;">Visualize:</label>
    <button id="view-toggle-train" onclick="setVisualizationMode('train')"
        style="padding: 6px 18px; border-radius: 6px; border: 2px solid #3b82f6; background: #3b82f6; color: white; font-weight: bold; cursor: pointer; transition: all 0.15s;">
        Training Data
    </button>
    <button id="view-toggle-inference" onclick="setVisualizationMode('inference')"
        style="padding: 6px 18px; border-radius: 6px; border: 2px solid #3b82f6; background: white; color: #3b82f6; font-weight: bold; cursor: pointer; transition: all 0.15s;">
        Inference Data
    </button>
    <span style="font-size: 0.78rem; color: #64748b; margin-left: 10px;">
        Controls which token sequence is shown in all plots. Does not affect training or inference computation.
    </span>
</div>

<div class="md">
## 1. Tokenization
The journey of a sentence begins with **Tokenization**, which decomposes raw text into **tokens**. In real LLMs, you would use **Byte-Pair Encoding** (**BPE**), this approach strikes a balance between whole-word vocabularies and character-level models by representing rare or unseen words as compositions of frequent fragments. In doing so, BPE keeps the vocabulary size manageable while maintaining broad coverage of natural language. But since our embedding space and the amount of data browsers can process is too small, we stick with word-wise tokenization by default. 
</div>

<div id="transformer-viz-bpe" class="viz-container"></div>

<div class="md">
## 2. Embedding & The Feature Space

Once tokenized, these units are converted into vectors. It is crucial to distinguish between the **Embedding Space** and the **Feature Space**:

* **Embedding Space (Static):** This is the initial lookup table where each token is assigned a fixed vector. At this stage, the vector for "bank" is always the same, regardless of context. This is where the **Hidden State** $h_0$ starts at the beginning of the process.
* **Feature Space (Dynamic):** As vectors pass through the layers, they enter the Feature Space. Here, the representation of a word is no longer fixed; it "migrates" based on the surrounding tokens. The hidden states $h_0, h_1, \dots, h_n$ represent the coordinates of the word as it is refined by the model's internal logic. The **Feature Space** is highly abstract, and not humanly interpretable anymore.
</div>

<div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
	<div id="transformer-plotly-space" style="width: 100%; height: 500px; background: white; border-radius: 8px;"></div>
	<div id="transformer-viz-embeddings" style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px;"></div>

	<div class="embedding-table-container" id="tled-editor-container" style="margin-top: 20px;"></div>

    <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 15px;">
        Perform math on the current vocabulary tokens to see how concepts align in the dynamic vector space.
    </p>
    <input
        type="text"
        id="transformer-vector-math-input"
        style="width: 100%; padding: 10px; font-size: 1.1rem; border-radius: 8px; border: 1px solid #cbd5e1;"
        placeholder="e.g., king - man + woman"
        onkeyup="calculate_vector_math()"
    >
    <div id="transformer-vector-math-result" style="margin-top: 15px; padding: 15px; background: #fff; border-radius: 8px; border: 1px dashed #cbd5e1; overflow-x: auto;">
        <em style="color: #94a3b8;">Enter an equation and press Enter...</em>
    </div>
</div>

<div class="md">
## 3. Positional Encoding

To address the lack of sequence order in transformers, a "position signal" is added to each token's embedding, forming the initial hidden state $h_{0}$:

$$h_{0} = \underbrace{\text{Embedding}(\text{Token})}_{\in \mathbb{R}^{\text{Batch} \times \text{Length} \times d_{\text{model}}}} + \underbrace{\text{PositionalEncoding}(\text{pos})}_{\in \mathbb{R}^{\text{Batch} \times \text{Length} \times d_{\text{model}}}}$$

The positional encoding is calculated using sine and cosine functions, which provide smooth, periodic patterns for each position. For each dimension $i$ in a vector of size $d_\text{model}$, the encoding is defined as:

$$PE_{(\text{pos}, 2i)} = \sin\left(\frac{\text{pos}}{10000^{2i/d_\text{model}}}\right)$$

$$PE_{(\text{pos}, 2i+1)} = \cos\left(\frac{\text{pos}}{10000^{2i/d_\text{model}}}\right)$$

These functions were chosen because they create unique, continuous patterns for each position, enabling the model to infer both absolute and relative positions. The periodicity of sine and cosine ensures that the encodings generalize to sequences longer than those seen during training. Additionally, their multi-frequency nature allows the model to capture both local and global positional relationships. The Feed-Forward Network (FFN) learns to interpret these fixed "geometric fingerprints" by adjusting its weights, enabling the model to apply position-specific logic and reason about sequence structure effectively.

The key to how the FFN learns from positional encodings lies in the mathematical properties of sine and cosine. For any fixed offset $k$, the positional encoding at position $\text{pos} + k$ can be expressed as a linear transformation of the encoding at position $\text{pos}$. This linearity allows the FFN to infer relative positions by learning simple transformations that map positional relationships to meaningful patterns. Over multiple layers, the FFN entangles positional and semantic information, enabling the model to reason about sequence structure and relationships effectively. This process ensures that the model can generalize to unseen sequences and maintain positional understanding even when tokens are shifted or reordered.
</div>

<div class="md" id="ifscalfactornotone" style="display: none">
In this example, we're using a scaling factor of <span id="posEmbedScaleFactor">0.1</span> because of the low dimensionality of our space.
</div>

<div id="transformer-pe-wave-plot" style="width: 100%; height: 300px; margin-top: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;"></div>

<div id="transformer-pe-shift-plot" style="width: 100%; height: 300px; margin-top: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;"></div>

<div id="transformer-pe-integration-results" style="margin-top: 20px;"></div>

<div class="md">
### Does Positional Encoding "Break" the Word's Meaning?
When you add "random" values to a vector, you change its location in the multidimensional embedding space. However, this doesn't "break" the word for two specific reasons:

1. **High-Dimensional Space:** In real models, the embedding space is massive. Adding a positional vector moves the word "King" to a new location, but it remains in a "neighborhood" that the model still recognizes as "King."
2. **Is it ever removed again?:** It is not explicitly removed: Positional information is added to token embeddings at the input and is subsequently transformed and mixed through the network’s layers. Rather than being preserved as a separable signal, positional and semantic information become increasingly entangled through learned linear projections and non-linear transformations, allowing the model to jointly reason about content and position.
3. **The Risk of Overlapping**: During training, the model learns to set the "scale" of the embeddings much larger than the "scale" of the positional encodings. This ensures the position "nudges" the meaning without overwriting it.

## 4. Structural Pillar: The Decoder-Only Architecture

To understand how the **hidden state** $h$ is constructed, it is important to clarify what this lab implements and how it relates to the historical Transformer design.

This lab does **not** use the original Encoder-Decoder architecture from Vaswani et al. (2017). Instead, it implements a **Decoder-only** Transformer with **Pre-Layer Normalization** — the same structural family that powers today's leading LLMs (GPT, Claude, Gemini and so on). There is no separate Encoder, and there is no cross-attention. The entire model is a stack of identical Decoder blocks, each containing:

1.  **Pre-LN**: Layer Normalization is applied *before* each sublayer (attention and FFN), rather than after. This is a more modern convention (Xiong et al., 2020) that improves gradient flow and training stability through deep stacks, compared to the original Post-LN design.
2.  **Masked (Causal) Self-Attention**: Every token can only attend to itself and the tokens that came before it. This is enforced by setting the upper triangle of the attention score matrix to $-\infty$ (in practice, $-10^9$) before the softmax. This causal constraint is what makes the model **autoregressive**: to predict token $t_{n+1}$, the model processes $[t_1, t_2, \ldots, t_n]$ and prevents any token from "cheating" by looking at future positions.
3.  **A Feed-Forward Network (FFN)** with ReLU activation and its own Pre-LN and residual connection.

This is the architecture you are interacting with in every visualization in this lab. When you see the attention heatmaps, the causal mask is the reason the upper-right triangle is always dark (near-zero weights).

### Historical Context: The Original Encoder-Decoder (What We Don't Use)

To appreciate *why* the Decoder-only design dominates, it helps to understand what came before it:

* **The Encoder (The Understanding Engine)**: In the original 2017 framework, the Encoder was the first half of a translation pipeline. It processes the entire input sequence simultaneously using **unmasked** self-attention, allowing every token to "see" every other token. This creates a bidirectional context where the word "bank" can be disambiguated by words appearing later in the sentence (e.g., "...river" vs. "...money"). While we do not use it here, this architecture remains the gold standard for non-generative tasks like sentiment analysis, entity recognition, and search (e.g., the BERT family).
* **The Decoder with Cross-Attention (The Original Generator)**: The Decoder was originally designed to take "hints" from the Encoder via **cross-attention** — an additional attention sublayer where the Decoder's queries attend to the Encoder's key-value representations. Its self-attention was already masked (causal), just as in our lab, but it also had this second attention mechanism to "read" the Encoder's output. This full Encoder-Decoder design is still used in sequence-to-sequence tasks like machine translation (e.g., the T5 and BART families).

### Why Decoder-Only Is the Modern Standard

The modern Generative AI era has effectively proven that a stack of Decoder layers alone can both understand context *and* generate coherent, long-form text — no separate Encoder is required. The key reasons are:

1.  **Simplicity**: One repeated block type (rather than two different block types plus cross-attention) drastically simplifies training infrastructure, model parallelism, and engineering effort.
2.  **Unified capability**: The causal self-attention in the Decoder is sufficient for learning rich contextual representations. During training, the model learns to "encode" the meaning of earlier tokens into the hidden state implicitly, without needing a dedicated bidirectional Encoder.
3.  **Scalability**: Decoder-only models exhibit more predictable scaling behavior, which is critical when training models with hundreds of billions of parameters across thousands of accelerators.

This is why this lab implements a Decoder-only, Pre-LN Transformer: it is the architecture behind virtually every modern large language model, and it lets us study the core mechanisms — causal attention, residual streams, and layer-by-layer transformation — in their most contemporary form.

### Masked self-attention

The model here uses "encoder-style" attention. This means when the model processes the word "king," it can see the word "wise" even if "wise" comes later in the sentence. For a generative model like ChatGPT to work, it must be **Autoregressive**, meaning it predicts the future based only on the past.

#### The Causal Mask
In a real GPT architecture, we must prevent the model from "looking into the future" during training. If the model is trying to predict the third word in a sentence, it shouldn't be allowed to see the third, fourth, or fifth words.

We achieve this by applying a **Causal Mask** to the attention scores before the Softmax operation. This mask is a lower-triangular matrix filled with $-\infty$ in the upper-right section.

Mathematically, the attention calculation becomes:

$$\text{Attention}(Q, K, V) = \text{softmax} \left( \frac{QK^\top}{\sqrt{d_k}} + M \right) V$$

Where $M$ is the mask. When we add $-\infty$ to the "future" positions, the Softmax function turns those values into $0$. Consequently, the model's "focus" for any given word is restricted to itself and the words preceding it.

For a sequence of length $n$, the look-ahead mask $M$ is defined as a
lower-triangular matrix where the entry $M_{i,j}$ determines if the
token at position $i$ can attend to the token at position $j$.

Mathematically, the mask is defined as:
$$M_{i,j} = \begin{cases} 0 & \text{if } i \geq j \\ -\infty & \text{if } i < j \end{cases}$$

In an LLM, this <b>Causal Mask</b> ensures that the self-attention mechanism
maintains the autoregressive property. Since the model is trained to predict
the next token, it must not "see" into the future. By setting future
positions to $-\infty$, the $\text{exp}(M_{i,j})$ term in the Softmax function
becomes $0$, effectively neutralizing the connection.

For a 4-token sequence, the causal mask $M$ is represented as:
$$M = \begin{pmatrix}
	0 & -\infty & -\infty & -\infty \\
	0 & 0 & -\infty & -\infty \\
	0 & 0 & 0 & -\infty \\
	0 & 0 & 0 & 0
\end{pmatrix}$$
</div>

<div class="md" id="transformer-mask-logic-breakdown">
    <div id="mask-rows-container"></div>
</div>

<div class="md">

**Why $-\infty$**? When we calculate the attention weights, we use the Softmax function:

$$\sigma(\mathbf{z})_i = \frac{e^{z_i}}{\sum_{j=1}^K e^{z_j}}$$

Because $e^{-\infty}$ approaches $0$, any score that has been masked will result in a $0\%$ attention weight after the Softmax step.

## 5. The Core Mechanism: Generating Q, K, and V
To allow a token to "scout" the rest of the sequence, we derive three distinct representations from the hidden state $h_0$ by multiplying it by three learned weight matrices: $W^Q, W^K,$ and $W^V$.

* **Query ($Q = h_0 W^Q$)**: Represents "What am I looking for?"
* **Key ($K = h_0 W^K$)**: Represents "What information do I contain?"
* **Value ($V = h_0 W^V$)**: Represents "What is the actual content I offer?"

**The Shapes:**
* **Hidden State ($h_0$)**: $(\text{Batch}, \text{Length}, d_{\text{model}})$
* **Weights ($W^Q, W^K, W^V$)**: $(d_{\text{model}}, d_{k})$
* **Resulting $Q, K, V$**: $(\text{Batch}, \text{Length}, d_{k})$

The **Single-Head Attention** output:
$$\text{Attention}(Q, K, V) = \text{Softmax}\left(\frac{Q \cdot K^T}{\sqrt{d_k}}\right) \cdot V$$

## 6. Multi-Head Attention: Lateral Parallelism
Instead of one massive attention operation, we use **Multi-Head Attention**. We split the hidden state's $d_{\text{model}}$ into $h$ different "heads." Each head $i$ has its own set of projection matrices $\{W_i^Q, W_i^K, W_i^V\}$, allowing the model to focus on different linguistic aspects (e.g., syntax vs. logic, but also very abstract features, for which human language doesn't have any names) simultaneously.

* $B = \text{Batch Size}$ (The number of independent sequences processed in a single forward pass)
* $T = \text{Sequence Length}$ (The number of tokens/words in each sequence)
* $d_v = \text{Head Dimension}$ (The dimensionality of the projected keys, queries, and values; usually $d_\text{model} / h$)

For a single head, we say:

$$\underbrace{\text{head}_i}_{(B, T, d_v)} = \text{Attention}(\underbrace{h_{i-1} W_i^Q}_{Q}, \underbrace{h_{i-1} W_i^K}_{K}, \underbrace{h_{i-1} W_i^V}_{V})$$

Which transforms the input in the shape of $(B, T, h \cdot d_v)$ to $(B, T, d_{\text{model}})$.

The multi-head is then just running different heads simultaneously and concatenating their results.

$$\text{MultiHead}(Q, K, V) = \text{Concat}(\text{head}_1, \dots, \text{head}_h)W^O$$

The association between *Query* and *Key* and concrete tokens is only true in the first layer, where it is taken from the concrete embeddings. In further layers, it works on the abstract feature space instead.

In this stage, it is already abstracted away from the concrete Embedding Space (for example, by positional encoding), and thus, the numbers don't inherently 'mean' anything anymore.
</div>

<div id="mha-calculation-details" style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #3b82f6; margin-top: 20px;">
<i>Please wait, while the <b>Multi-Attention-Head</b>-equations are loading...</i>
</div>

<div class="md">
## Attention Path Visualizer
Hover over tokens to see where each head focuses its attention.
Toggle individual heads on/off. Switch between Head View and Matrix View.
</div>

<div id="attention-path-viz" style="margin: 20px 0;"></div>

<div class="md">
## 7. Mathematical Assembly: Concatenation and $h_1$

### Concatenation Definition
For $h$ heads, where each head has dimension $d_v$:

$$\text{Concat}(\text{head}_1, \dots, \text{head}_h) = [ \text{head}_1, \text{head}_2, \dots, \text{head}_h ]$$

If $d_\text{model} = 512$ and we have $h = 8$ heads:
* **Each head:** $d_v = \frac{512}{8} = 64$
* **Shapes:** $\underbrace{(B, T, 64)}_{\text{head}_1} + \dots + \underbrace{(B, T, 64)}_{\text{head}_8} \xrightarrow{\text{Concat}} \underbrace{(B, T, 512)}_{\text{Full Tensor}}$

If $h_1 = [1, 2]$ and $h_2 = [3, 4]$:
$$\text{Concat}(h_1, h_2) = [1, 2, 3, 4]$$
The output width is simply the sum of the input widths.

### The Multi-Attention-Head

After the heads process the sequence, they are **concatenated** and multiplied by a final output matrix $W^O$. We then create the next stage, **$h_1$**, using a Residual Connection and normalization:

$$\text{MultiHead}(h_0) = \text{Concat}(\text{head}_1, \dots, \text{head}_h) \cdot W^O$$
$$h_{1} = h_{0} + \text{LayerNorm}(\text{MultiHead}(h_{0}))$$
</div>

<div id="transformer-concat-viz" style="margin-top: 20px; padding: 20px; border: 1px solid #3b82f6; border-radius: 12px; background: #f0f4f8; overflow: auto;">
</div>

<div id="transformer-h1-layernorm-viz" style="margin-top: 20px; padding: 20px; border: 1px solid #10b981; border-radius: 12px; background: #ecfdf5; overflow-x: auto;">
</div>

<div id="transformer-h1-final-viz" style="margin-top: 20px; padding: 20px; border: 1px solid #8b5cf6; border-radius: 12px; background: #f5f3ff; overflow-x: auto;">
</div>

<div class="md">
## 8. The Feed-Forward Network: Knowledge Retrieval and $h_2$
While self-attention enables information exchange across the sequence, the Feed-Forward Network (FFN) applies a learned, non-linear transformation independently to each token’s representation. In this sense, it functions as the model’s primary per-token computational stage, complementing attention’s role in information routing and aggregation.

\cite[Empirical studies]{keyvalmem} suggest that FFN layers are a major locus of memorized associations and factual patterns, although such knowledge is distributed across the network rather than localized to a single component.

To calculate the transformation of a contextual vector through the FFN, you apply two linear transformations with a non-linear activation and biases:

$$\text{FFN}(h_1) = \sigma(h_1 W_1 + b_1)W_2 + b_2$$

Where:
- $W_1$ is the first weight matrix (expansion to $d_\text{ff}$, usually $4 \times d_{\text{model}}$).
- $b_1$ is the bias vector for the first layer.
- $\sigma$ is the activation function (like ReLU or GELU).
- $W_2$ is the second weight matrix (compression back to $d_{\text{model}}$).
- $b_2$ is the bias vector for the second layer.

The final state of this block, **$h_2$**, is formed by another residual connection:
$$h_{2} = h_{1} + \text{LayerNorm}(\text{FFN}(h_1))$$
</div>

<div id="ffn-step-1" class="math_transformer"></div>
<div id="ffn-step-2" class="math_transformer"></div>
<div id="ffn-step-3" class="math_transformer"></div>

<div class="md">
## 9. Generalizing the Flow: The $N$-Layer Recurrence
In practice, a Transformer is not just two steps ($h_0 \to h_2$); it is a stack of $N$ structurally identical but independently weighted blocks, each moving the representation further through the Feature Space to refine meaning.

For any layer $n$, the transition to the next hidden state $h_{n+1}$ can be generalized as:

$$
\begin{aligned}
z_n &= h_n + \text{LayerNorm}(\text{MultiHeadAttention}(h_n)) \\
h_{n+1} &= z_n + \text{LayerNorm}(\text{FeedForward}(z_n))
\end{aligned}
$$

As $h$ progresses from $h_0$ to $h_{96}$, the vector for "apple" might move from being near "fruit" to being near "tech company" based on the contextual "nudges" received in the Feature Space during each Attention and FFN cycle.
</div>

<div class="md">
### Feature Space Migration
The following plots visualize how each layer "nudges" the token vectors. Each arrow represents the transition from $h_n$ (start) to $h_{n+1}$ (head).
</div>

<div class="md">
## 10. From Hidden States to Probabilities

<div class="smart-quote" data-cite="heraclitus500fragments" data-after="B 12">
Everything is in flux.
</div>


After passing through $N$ layers, we reach the final hidden state, **$h_{\text{final}}$**. To turn this into a word, we project it against the entire vocabulary:

$$\text{Logits} = h_{\text{final}} \cdot W_{\text{Vocab}}^T$$

**The Transformation:**
1. **Logits**: Raw scores for every word in the dictionary.
2. **SoftMax**: Normalizes scores into probabilities (0 to 1).
3. **Temperature ($T$)**: Modifies the SoftMax: $\sigma(z)_i = \frac{e^{z_i/T}}{\sum e^{z_j/T}}$.

This architecture subordinates to the Bitter Lesson by \citeauthor{sutton2019bitter}: computation and general-purpose learning eventually outperform hand-crafted linguistic rules.
</div>

<div id="transformer-migration-plots-container"></div>

<div class="md">
    We have arrived at the final vector $h_{\text{final}}$ for the last token. To convert this abstract geometric location back into a specific word from our vocabulary, we perform a dot product against the **Unembedding Matrix** ($W_\text{vocab}$). This effectively asks: "How similar is our current thought vector to every known word vector?"
</div>

<div id="transformer-temperature-config" style="margin-top: 20px;"></div>

<div id="transformer-output-projection" style="background: #fff; padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px; margin-top: 20px;"></div>

<div>
	<label style="font-weight: bold; display: block; margin-top: 15px; margin-bottom: 8px;">Input (Inference):</label>
	<input type="text" id="transformer-master-token-input" class="bw-cell" style="width: 90%; font-size: 1.1rem;" value="the">
</div>

<div class="md">
## Key Intuitions about LLMs

At no point does the model manipulate symbols or rules, like non-connectionist AI systems tried to do. Everything is:

- vector projection
- geometric alignment
- weighted averaging
- non-linear transformation

Meaning emerges not from words themselves, but from how vectors **move, align, and combine** in space.
</div>
