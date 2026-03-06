<?php include_once("functions.php"); ?>

<script src="attention_engine.js"></script>

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
            <b>Dependency:</b> Must be dividable by Dimension.<br>
            <b>Reason:</b> Multi-head attention splits the main vector into $h$ parallel "viewpoints." If $d_{\text{model}}$ is 4 and $h$ is 2, each head looks at 2 dimensions.
        </p>
		<input type="range" id="transformer-heads" min="1" max="8" value="3"
			style="width: 100%;" oninput="syncTransformerSettings('heads')">
	</div>

	<div style="margin-bottom: 15px;">
		<label style="font-weight: bold;">Network Depth ($N$ layers): </label>
		<span id="depth-val" style="font-weight: bold; color: #3b82f6;">3</span>
		<p style="font-size: 0.8rem; color: #64748b; margin: 4px 0;">How many transformer blocks are stacked. More layers allow more abstract reasoning.</p>
		<input type="range" id="transformer-depth" min="1" max="12" value="3"
			style="width: 100%;" oninput="document.getElementById('depth-val').innerText = this.value; debounced_run_transformer_demo();">
	</div>

	<div style="margin-bottom: 15px;">
	    <label style="font-weight: bold;">Context Size: </label>
	    <span id="context-val" style="font-weight: bold; color: #3b82f6;">64</span>
	    <p style="font-size: 0.75rem; color: #64748b; margin: 2px 0;">
		<b>Effect:</b> Sets the maximum number of tokens the model can "see" at once during training and inference.<br>
		<b>Reason:</b> A larger context window allows the model to capture longer-range dependencies between words, but increases memory and computation cost quadratically due to the attention matrix being of size $\text{Context}^2$ (this can me mitigated through the <i>KV-Cache</i>).
	    </p>
	    <input type="range" id="transformer-context-size" min="2" max="128" step="1" value="64"
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
	     background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
	    <div id="param-breakdown-plotly" style="width: 100%; height: 350px;"></div>
	    <div id="param-breakdown-table" style="margin-top: 10px; font-size: 0.82rem; overflow-x: auto;"></div>
	</div>
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

	<button class="btn train-btn" onclick="train_transformer()">Train Model</button>

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
	<button id="view-toggle-train" onclick="setVisualizationMode('train')" style="padding: 6px 18px; border-radius: 6px; border: 2px solid #3b82f6; background: #3b82f6; color: white; font-weight: bold; cursor: pointer; transition: all 0.15s;">
		Training Data
	</button>
	<button id="view-toggle-inference" onclick="setVisualizationMode('inference')" style="padding: 6px 18px; border-radius: 6px; border: 2px solid #3b82f6; background: white; color: #3b82f6; font-weight: bold; cursor: pointer; transition: all 0.15s;">
		Inference Data
	</button>
	<span style="font-size: 0.78rem; color: #64748b; margin-left: 10px;">
		Controls which token sequence is shown in all plots. Does not affect training or inference computation.
	</span>
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

<div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
	<div id="transformer-plotly-space" style="width: 100%; height: 500px; background: white; border-radius: 8px;"></div>
	<div id="transformer-viz-embeddings" style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px;"></div>

	<div class="embedding-table-container" id="tled-editor-container" style="margin-top: 20px;"></div>

	<p style="font-size: 0.9rem; color: #64748b; margin-bottom: 15px;">Perform math on the current vocabulary tokens to see how concepts align in the dynamic vector space.</p>
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
## Positional Encoding

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

<div id="transformer-pe-shift-plot" style="width: 100%; height: 600px; margin-top: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;"></div>

<div id="transformer-pe-integration-results" style="margin-top: 20px;"></div>

<div class="optional md" data-headline="Does Positional Encoding 'break' the Word's Meaning?">
When you add "random" values to a vector, you change its location in the multidimensional embedding space. However, this doesn't "break" the word:

- **High-Dimensional Space:** In real models, the embedding space is massive. Adding a positional vector moves the word "King" to a new location, but it remains in a "neighborhood" that the model still recognizes as "King."
- **Is it ever removed again?:** It is not explicitly removed: Positional information is added to token embeddings at the input and is subsequently transformed and mixed through the network’s layers. Rather than being preserved as a separable signal, positional and semantic information become increasingly entangled through learned linear projections and non-linear transformations, allowing the model to jointly reason about content and position.
- **The Risk of Overlapping**: During training, the model learns to set the "scale" of the embeddings much larger than the "scale" of the positional encodings. This ensures the position "nudges" the meaning without overwriting it.
</div>

<div class="md">
## The Decoder-Only Architecture

Here, we do **not** use the original Encoder-Decoder architecture from Vaswani et al. (\citeyear{vaswani2017attention}). Instead, this example implements a **Decoder-only** Transformer with **Pre-Layer Normalization**, the same structural family that powers today's leading LLMs (GPT, Claude, Gemini and so on). The entire model is a stack of identical Decoder (with different weights) blocks, each containing:

1. **Pre-LN**: Layer Normalization is applied *before* each sublayer (attention and FFN), rather than after. This is a more modern convention (see \citetitle{xiong2020}) that improves gradient flow and training stability through deep stacks.
2. **Masked (Causal) Self-Attention**: Every token can only attend to itself and the tokens that came before it. This is enforced by setting the upper triangle of the attention score matrix to $-\infty$ before the SoftMax. This causal constraint is what makes the model **autoregressive**: to predict token $t_{n+1}$, the model processes $[t_1, t_2, \ldots, t_n]$ and prevents any token from "cheating" by looking at future positions.
3. **A Feed-Forward Network (FFN)** with ReLU activation and its own Pre-LN and residual connection.

This is the architecture you are interacting with in every visualization here. When you see the attention heatmaps, the causal mask is the reason the upper-right triangle is always zero.

## The Residual Stream

<div class="smart-quote" data-cite="heraclitus500fragments" data-after="B 12">
Everything is in flux.
</div>

In the Transformer, the Residual Stream embodies Heraclitus’ flux, serving as a shared "notebook" where the original identity $h_0$ is preserved through \cite[additive skip connections]{he2015resnet} like in **ResNet**, $x_{\text{new}} = x + \text{layer}(x)$, which serve two purposes:

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

The job of of a Single Attention Head is to find some form of relation between all the input tokens after they've been multiplied with the $Q$, $K$ and $V$-matrices. This could be, for example, to detect which part of a sentence is a verb and which object it attends to. Usually, in real transformers, it rarely is that interpretable, though.

$$\text{Attention}(Q, K, V) = \text{Softmax}\left(\frac{Q \cdot K^T}{\sqrt{d_k}}\right) \cdot V$$

### Multi-Head Attention: Lateral Parallelism
Instead of one massive attention operation, we use **Multi-Head Attention**. We split the hidden state's $d_{\text{model}}$ into $h$ different "heads." Each head $i$ has its own set of projection matrices $\{W_i^Q, W_i^K, W_i^V\}$, allowing the model to focus on different linguistic aspects (e.g., syntax vs. logic, but also very abstract features, for which human language doesn't have any names) simultaneously.

* $B = \text{Batch Size}$ (The number of independent sequences processed in a single forward pass)
* $T = \text{Sequence Length}$ (The number of tokens/words in each sequence)
* $d_v = \text{Head Dimension}$ (The dimensionality of the projected keys, queries, and values; usually $d_\text{model} / h$)

For a single head, we say:

$$\underbrace{\text{head}_{i+1}}_{(B, T, d_v)} = \text{Attention}(\underbrace{h_i W_i^Q}_{Q}, \underbrace{h_i W_i^K}_{K}, \underbrace{h_i W_i^V}_{V})$$

Which transforms the input in the shape of $(B, T, h \cdot d_v)$ to $(B, T, d_{\text{model}})$.

The multi-head is then just running different heads simultaneously and concatenating their results.

$$\text{MultiHead}(Q, K, V) = \text{Concat}(\text{head}_1, \dots, \text{head}_h)W^O$$

The association between *Query* and *Key* and concrete tokens is only true in the first layer, where it is taken from the concrete embeddings. In further layers, it works on the abstract feature space instead.

In this stage, it is already abstracted away from the concrete Embedding Space (for example, by positional encoding), and thus, the numbers do not inherently 'mean' anything anymore.
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
described in Voita et al. (\citeyear{incontextlearninghead}). While a standard positional head might only look at
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
linear to constant time relative to sequence length.
</div>

<div class="md">
## Mathematical Assembly: Concatenation and $h_1$

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

After the heads process the sequence, they are **concatenated** and multiplied by a final output matrix $W^O$. We then create the next stage, **$h_1$**, using a **Residual Connection** and **Normalization**:

$$\text{MultiHead}(h_0) = \text{Concat}(\text{head}_1, \dots, \text{head}_h) \cdot W^O$$
$$h_{1} = h_{0} + \text{LayerNorm}(\text{MultiHead}(h_{0}))$$

This Layer Normalization ensures that the values don't 'explode' and get too large, since they are, after being normalized, always in around 0 with a variance of 1. Without it, the values might get bigger and bigger with many layers.
</div>

<div class="md">
## The Feed-Forward Network
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

While attention decides *what to look at*, the FFN decides *what to do with it*.

The final state of this block, **$h_2$**, is formed by another residual connection:

$$h_{2} = h_{1} + \text{LayerNorm}(\text{FFN}(h_1))$$
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
## The $N$-Layer Recurrence
In practice, a Transformer is not just two steps; it is a stack of $N$ structurally identical but independently weighted blocks, each moving the representation further through the Feature Space to refine meaning.

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
## From Hidden States to Probabilities

After passing through $N$ layers, we reach the final hidden state, **$h_{\text{final}}$**. To turn this into a word, we project it against the entire vocabulary:

$$\text{Logits} = h_{\text{final}} \cdot W_{\text{Vocab}}^T$$

**The Transformation:**
1. **Logits**: Raw scores for every word in the dictionary.
2. **SoftMax**: Normalizes scores into probabilities (0 to 1).
3. **Temperature ($T$)**: Modifies the SoftMax: $\sigma(z)_i = \frac{e^{z_i/T}}{\sum e^{z_j/T}}$.

This architecture subordinates to the Bitter Lesson by \citeauthor{sutton2019bitter}: computation and general-purpose learning eventually outperform hand-crafted linguistic rules.

We have arrived at the final vector $h_{\text{final}}$ for the last token. To convert this abstract geometric location back into a specific word from our vocabulary, we perform a dot product against the **Unembedding Matrix** ($W_\text{vocab}$). This effectively asks: "How similar is our current thought vector to every known word vector?"
</div>

<div>
	<label style="font-weight: bold;">Temperature ($T$): <span id="temp-val" style="font-weight: bold; color: #3b82f6;">1.0</span></label>
	<p style="font-size: 0.75rem; color: #64748b; margin: 2px 0;">
	    <b>Effect:</b> Controls the "sharpness" of the probability distribution.<br>
	    <b>Reason:</b> Low values ($T < 1$) force the model to be deterministic; high values ($T > 1$) increase diversity by making unlikely words more probable.
	</p>
	<input type="range" id="transformer-temperature" min="0.1" max="2.0" step="0.1" value="1.0" style="width: 100%; vertical-align: middle;" oninput="document.getElementById('temp-val').innerText = this.value; debounced_run_transformer_demo();">
</div>

<div id="transformer-output-projection" style="background: #fff; padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px; margin-top: 20px;"></div>

<div>
	<label style="font-weight: bold; display: block; margin-top: 15px; margin-bottom: 8px;">Input (Inference):</label>
	<input type="text" id="transformer-master-token-input" class="bw-cell" style="width: 90%; font-size: 1.1rem;" value="the">
</div>

<div class="md">
## Key Intuitions about LLMs

At no point does the model manipulate symbols or rules, like non-connectionist AI systems tried to do. Everything is:

- vector projection,
- geometric alignment,
- weighted averaging,
- non-linear transformation.

Meaning emerges not from words themselves, but from how vectors **move, align, and combine** in space.
</div>
</div>
