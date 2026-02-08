<?php include_once("functions.php"); ?>

<div class="md">
## 1. Tokenization
The journey of a sentence begins with **Byte-Pair Encoding** (**BPE**), which decomposes raw text into subword units. This approach strikes a balance between whole-word vocabularies and character-level models by representing rare or unseen words as compositions of frequent fragments. In doing so, BPE keeps the vocabulary size manageable while maintaining broad coverage of natural language.

## 2. Embedding & The Feature Space
</div>

<div class="smart-quote" data-cite="heraclitus500fragments" data-after="B 54">
	The hidden harmony is better than the obvious one
</div>

<div class="md">
Once tokenized, these units are converted into vectors. It is crucial to distinguish between the **Embedding Space** and the **Feature Space**:

* **Embedding Space (Static):** This is the initial lookup table where each token is assigned a fixed vector. At this stage, the vector for "bank" is always the same, regardless of context. This is where the **Hidden State** $h_0$ starts at the beginning of the process.
* **Feature Space (Dynamic):** As vectors pass through the layers, they enter the Feature Space. Here, the representation of a word is no longer fixed; it "migrates" based on the surrounding tokens. The hidden states $h_0, h_1, \dots, h_n$ represent the coordinates of the word as it is refined by the model's internal logic. The **Feature Space** is highly abstract, and not humanly interpretable anymore.
 
## 3. Positional Encoding
To fix the lack of sequence order, we add a "position signal" to each token's embedding. This results in our initial hidden state, $h_{0}$:

$$h_{0} = \underbrace{\text{Embedding}(\text{Token})}_{\in \mathbb{R}^{\text{Batch} \times \text{Length} \times d_{\text{model}}}} + \underbrace{\text{PositionalEncoding}(\text{pos})}_{\in \mathbb{R}^{\text{Batch} \times \text{Length} \times d_{\text{model}}}}$$

For each dimension $i$ in a vector of size $d_\text{model}$, we calculate a specific "wave" value:

$$PE_{(\text{pos}, 2i)} = \sin(\text{pos} / 10000^{2i/d_\text{model}})$$
$$PE_{(\text{pos}, 2i+1)} = \cos(\text{pos} / 10000^{2i/d_\text{model}})$$

This positional signal allows the model to infer relative positions if it learns to, while the Feed-Forward Network (FFN) utilizes these unique 'geometric fingerprints' to apply position-specific logic.

### Does Positional Encoding "Break" the Word's Meaning?
When you add "random" values to a vector, you change its location in the multidimensional embedding space. However, this doesn't "break" the word for two specific reasons:

1. **High-Dimensional Space:** In real models, the embedding space is massive. Adding a positional vector moves the word "King" to a new location, but it remains in a "neighborhood" that the model still recognizes as "King."
2. **Is it ever removed again?:** It is not explicitly removed: Positional information is added to token embeddings at the input and is subsequently transformed and mixed through the network’s layers. Rather than being preserved as a separable signal, positional and semantic information become increasingly entangled through learned linear projections and non-linear transformations, allowing the model to jointly reason about content and position.

### The Risk of Overlapping
During training, the model learns to set the "scale" of the embeddings much larger than the "scale" of the positional encodings. This ensures the position "nudges" the meaning without overwriting it.

## 4. Structural Pillars: The Encoder and Decoder
To understand how the **hidden state** $h$ is constructed, it is useful to examine the two canonical components introduced in the original Transformer architecture: the encoder and the decoder. These are not auxiliary modules but structural patterns that define how attention and computation are organized.

* The **Encoder** (The Understanding Engine): In the original "\citetitle{vaswani2017attention}" (Vaswani et al., \citeyear{vaswani2017attention}) framework, the encoder was the first half of a translation pipeline. It processes the entire input sequence simultaneously using unmasked self-attention, allowing every token to "see" every other token. This creates a bidirectional context where the word "bank" can be disambiguated by words appearing later in the sentence (e.g., "...river" vs. "...money"). While less common in generative models today, this architecture remains the gold standard for non-generative tasks like sentiment analysis, entity recognition, and search (e.g., the BERT family).
* The **Decoder** (The Generative Standard): While originally designed to take "hints" from an encoder via cross-attention, the modern Generative AI era is dominated by the Decoder-only architecture. This engine is autoregressive, it predicts the next token based strictly on the sequence that came before it. It employs Masked Self-Attention, a causal constraint that prevents a token from "cheating" by looking at future words during training. Today’s LLMs (GPT, Claude, Gemini) have effectively discarded the separate Encoder, proving that a stack of Decoders alone can both understand context and generate coherent, long-form text.

### Masked self-attention

In the current demonstration, the model uses "encoder-style" attention. This means when the model processes the word "king," it can see the word "wise" even if "wise" comes later in the sentence. For a generative model like ChatGPT to work, it must be **Autoregressive**, meaning it predicts the future based only on the past.

#### The Causal Mask
In a real GPT architecture, we must prevent the model from "looking into the future" during training. If the model is trying to predict the third word in a sentence, it shouldn't be allowed to see the third, fourth, or fifth words.

We achieve this by applying a **Causal Mask** to the attention scores before the Softmax operation. This mask is a lower-triangular matrix filled with $-\infty$ in the upper-right section.

Mathematically, the attention calculation becomes:

$$\text{Attention}(Q, K, V) = \text{softmax} \left( \frac{QK^\top}{\sqrt{d_k}} + M \right) V$$

Where $M$ is the mask. When we add $-\infty$ to the "future" positions, the Softmax function turns those values into $0$. Consequently, the model's "focus" for any given word is restricted to itself and the words preceding it.

#### The Causal Mask Matrix

For the 4-token sequence "the king is wise", the look-ahead mask $M$ is defined as a lower-triangular matrix. The values of $0$ allow the signal to pass through, while $-\infty$ effectively blocks it.

$$
M = \begin{pmatrix}
0 & -\infty & -\infty & -\infty \\
0 & 0 & -\infty & -\infty \\
0 & 0 & 0 & -\infty \\
0 & 0 & 0 & 0
\end{pmatrix}
$$

##### Why -∞?

When we calculate the attention weights, we use the Softmax function:

$$\sigma(\mathbf{z})_i = \frac{e^{z_i}}{\sum_{j=1}^K e^{z_j}}$$

Because $e^{-\infty}$ approaches $0$, any score that has been masked will result in a $0\%$ attention weight after the Softmax step.

## 5. The Core Mechanism: Generating Q, K, and V
To allow a token to "scout" the rest of the sequence, we derive three distinct representations from the hidden state $h_0$ by multiplying it by three weight matrices: $W^Q, W^K,$ and $W^V$.

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
Instead of one massive attention operation, we use **Multi-Head Attention**. We split the hidden state's $d_{\text{model}}$ into $h$ different "heads." Each head $i$ has its own set of projection matrices $\{W_i^Q, W_i^K, W_i^V\}$, allowing the model to focus on different linguistic aspects (e.g., syntax vs. logic) simultaneously.

$$\text{head}_i = \text{Attention}(h_0 W_i^Q, h_0 W_i^K, h_0 W_i^V)$$

## 7. Mathematical Assembly: Concatenation and $h_1$
After the heads process the sequence, they are **concatenated** and multiplied by a final output matrix $W^O$. We then create the next stage, **$h_1$**, using a Residual Connection and normalization:

$$\text{MultiHead}(h_0) = \text{Concat}(\text{head}_1, \dots, \text{head}_h) \cdot W^O$$
$$h_{1} = h_{0} + \text{LayerNorm}(\text{MultiHead}(h_{0}))$$

## 8. The Feed-Forward Network: Knowledge Retrieval and $h_2$
While self-attention enables information exchange across the sequence, the Feed-Forward Network (FFN) applies a learned, non-linear transformation independently to each token’s representation. In this sense, it functions as the model’s primary per-token computational stage, complementing attention’s role in information routing and aggregation.

Empirical studies (\cite{keyvalmem}) suggest that FFN layers are a major locus of memorized associations and factual patterns, although such knowledge is distributed across the network rather than localized to a single component.

To calculate the transformation of a contextual vector through the FFN, you apply two linear transformations with a non-linear activation and biases:

$$\text{FFN}(h_1) = \sigma(h_1 W_1 + b_1)W_2 + b_2$$

Where:
- $W_1$ is the first weight matrix (expansion to $d_{ff}$, usually $4 \times d_{\text{model}}$).
- $b_1$ is the bias vector for the first layer.
- $\sigma$ is the activation function (like ReLU or GELU).
- $W_2$ is the second weight matrix (compression back to $d_{\text{model}}$).
- $b_2$ is the bias vector for the second layer.

The final state of this block, **$h_2$**, is formed by another residual connection:
$$h_{2} = h_{1} + \text{LayerNorm}(\text{FFN}(h_1))$$

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

### The Illusion of Locality: Beyond the Grandmother Neuron
Meaning in a Transformer is **holistic and distributed**. In classical neuroscience, the \citealternativetitle{grandmotherneuron} refers to a singular neuron triggering for a complex concept. In the Transformer, no such neuron exists. Meaning is an emergent property of the entire vector space; it is held in the collective ratios of the hidden states. They don't inherently *mean* anything; they simply function to produce the desired output.

## 10. From Hidden States to Probabilities
After passing through $N$ layers, we reach the final hidden state, **$h_{\text{final}}$**. To turn this into a word, we project it against the entire vocabulary:

$$\text{Logits} = h_{\text{final}} \cdot W_{\text{Vocab}}^T$$

**The Transformation:**
1. **Logits**: Raw scores for every word in the dictionary.
2. **SoftMax**: Normalizes scores into probabilities (0 to 1).
3. **Temperature ($T$)**: Modifies the SoftMax: $\sigma(z)_i = \frac{e^{z_i/T}}{\sum e^{z_j/T}}$.

This architecture subordinates to the Bitter Lesson by \citeauthor{sutton2019bitter}: computation and general-purpose learning eventually outperform hand-crafted linguistic rules.

## Key Intuitions about LLMs

At no point does the model manipulate symbols or rules, like non-connectionist AI systems tried to do. Everything is:

- vector projection
- geometric alignment
- weighted averaging
- non-linear transformation

Meaning emerges not from words themselves, but from how vectors **move, align, and combine** in space.

## Try it out and follow it live

Click on the predictions at the end to build the sentence.

    <div id="top-prediction-bar" style="display: flex; gap: 10px; margin-bottom: 15px; align-items: center;">
	<span style="font-weight: bold; color: #3b82f6;">Next:</span>
	<div id="top-tokens-container" style="display: flex; gap: 8px;"></div>
    </div>
</div>

<div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
    <div style="display: flex; gap: 10px; align-items: flex-end;">
	<div style="flex-grow: 1;">
	    <label style="font-weight: bold;">Input Sequence:</label>
	    <div id="tf-input-container" style="position: relative;">
		<input type="text" id="tf-input" class="bw-cell" style="width: 90%; font-family: monospace; background: transparent; position: relative; z-index: 2;" value="The" oninput="TransformerLab.run()">
		<div id="tf-input-overlay" style="position: absolute; top: 11px; left: 11px; width: 100%; font-family: monospace; color: transparent; pointer-events: none; white-space: pre; z-index: 1;"></div>
	    </div>
	</div>
	<button class="btn" onclick="TransformerLab.loadPreset('The')">Reset</button>
    </div>
</div>

<div class="transformer-grid" style="display: grid; gap: 20px;">

	<div class="panel" style="border-left: 5px solid #64748b;">
	    <i>Tokenization & Attention Flow</i>
	    <div style="position: relative; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow-x: auto; width: 100%; overflow-y: clip;">
		<div id="canvas-container" style="position: relative; min-width: 100%;">
		    <canvas id="attention-canvas" style="position: absolute; top: 0; left: 0; pointer-events: none;"></canvas>
		    
		    <div id="token-stream" style="display: flex; gap: 10px; justify-content: flex-start; padding: 60px 20px 20px 20px; white-space: nowrap; width: max-content;">
			</div>
		</div>
	    </div>
	    <div id="viz-tokens" style="display: none; gap: 8px; flex-wrap: wrap; margin-bottom: 15px;"></div>
	    <div id="token-table-container"></div>
	</div>

    <div class="panel">
	<i>Semantic Embedding Space</i>
	<div style="display: flex; gap: 15px; font-size: 0.75rem; margin-bottom: 10px; flex-wrap: wrap;">
	    <span><b style="color: #10b981;">&#11088;</b> Next Prediction</span>
	</div>
	<div id="plot-embeddings" style="height: 400px;"></div>
    </div>

<div class="panel" style="border-left: 5px solid #8b5cf6;">
    <i>Projection Matrix Lab ($W_q$ & $W_k$)</i>
    <p style="font-size: 0.85rem; color: #64748b;">
	Adjust the weights below to see how <b>Query</b> and <b>Key</b> transformations shift attention focus.
    </p>
    <div style="justify-content: center;">
	<div>
	    <span style="font-weight: bold; color: #8b5cf6;">Query Matrix ($W_q$)</span>
	    <div id="wq-editor" class="matrix-grid"></div>
	</div>
	<div>
	    <span style="font-weight: bold; color: #ec4899;">Key Matrix ($W_k$)</span>
	    <div id="wk-editor" class="matrix-grid"></div>
	</div>
    </div>
    <div style="margin-top: 15px; text-align: center;">
	<button class="btn" onclick="TransformerLab.resetMatrices()">Reset All Matrices</button>
    </div>
</div>

    <div class="panel" style="max-width: 800px;">
	<i>Attention (Contextual Mixing)</i>
	<div style="flex-grow: 1; font-size: 0.85rem; background: #f0f7ff; padding: 15px; border-radius: 8px; border: 1px solid #bae6fd; margin-bottom: 20px;">
	    <p>
	    The <b>Attention Layer</b> is the model's communication hub. While individual word embeddings only know their own meaning, Attention allows them to "look" at other words in the sequence to gain <b>context</b>.
	    </p>
	</div>
	<div style="display: flex; flex-direction: column; gap: 30px;">
	    <div id="attn-matrix-container" style="overflow-x: auto; width: 100%;"></div>
	    <div id="vector-details">
		<div class="math-tex" id="math-attn-base"></div>
	    </div>
	</div>
    </div>

<div class="panel" style="border-left: 5px solid #f59e0b;">
    <i>The Feed-Forward Matrix ($W_{ffn}$)</i>
    <div style="display: flex; gap: 30px; align-items: start; flex-wrap: wrap;">
	<div>
	    <span style="font-weight: bold; color: #f59e0b;">Edit Weights:</span>
	    <div id="ffn-editor" style="margin-top: 10px; background: #f8fafc; padding: 10px; border-radius: 8px;"></div>
	</div>
	<div>
	    <span style="font-weight: bold; color: #64748b;">Heatmap:</span>
	    <div id="ffn-matrix-container"></div>
	</div>
	<div style="flex-grow: 1; font-size: 0.85rem; background: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fef3c7;">
		<p>The matrix $W_{ffn}$ acts as the model's <b>"knowledge bank."</b> It maps the semantic traits of the current word to the expected traits of the next word. Here, our Feed-Forward-Network only has one layer, and no activation function for keeping it as simple as possible. In real LLMs, it can me multiple models with activation functions.</p>
	</div>
    </div>
	    <div style="margin-top: 15px; text-align: center;">
		<button class="btn" onclick="TransformerLab.resetMatrices()">Reset to Identity</button>
	    </div>
	</div>
</div>

    <div class="panel" style="background: #f0f9ff;">
	<i>Layer Flow & Residuals</i>
	<div id="res-ffn-viz" class="math-tex"></div>
    </div>

    <div class="panel" style="border: 2px solid #3b82f6;">
	<i>Next Token Prediction (Softmax)</i>
	<div id="prob-bars-container"></div>
    </div>

<div class="panel" style="border: 2px solid #10b981; background: #f0fdf4;">
    <i>Deep Training Lab (Full Backpropagation)</i>
	<button onclick="TransformerLab.exportData()" class="btn">Export Model</button>
	<button onclick="TransformerLab.randomizeWeights()" class="btn" style="background: #64748b; color: white;">🎲 Randomize Weights</button>
    <p style="font-size: 0.85rem; color: #1e293b;">
	Trainiert <b>Embeddings</b>, <b>Attention ($W_q, W_k$)</b> und <b>FFN</b> gleichzeitig. 
    </p>

    <div style="margin-bottom: 15px;">
	<label style="font-size: 0.8rem; font-weight: bold; color: #065f46;">Learning Rate: <span id="lr-value">0.1</span></label>
	<input type="range" id="lr-slider" min="0.001" max="0.5" step="0.001" value="0.1" 
	       style="width: 100%; accent-color: #10b981;" 
	       oninput="document.getElementById('lr-value').innerText = this.value">
    </div>

    <textarea id="training-input" style="width: 100%; height: 80px; padding: 10px; border-radius: 8px; border: 1px solid #10b981; font-family: monospace; font-size: 0.8rem; margin-bottom: 10px;">
The king is brave and The queen is wise and The king is wise and The princess is brave and the prince is wise and the wise prince is brave and the brave king is wise and the brave queen is wise and the wise queen is brave
	</textarea>

    <div style="display: flex; gap: 10px; align-items: center;">
	<button id="train-btn" onclick="TransformerLab.toggleTraining()" style="background: #10b981; color: white; padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer; font-weight: bold; flex-grow: 1; transition: all 0.2s;">
	    🚀 Start Full Training
	</button>
	<div id="training-status" style="font-size: 0.85rem; font-weight: bold; min-width: 150px;">Bereit.</div>
    </div>

    <div style="width: 100%; background: #e2e8f0; height: 4px; margin-top: 10px; border-radius: 2px;">
	<div id="train-progress" style="width: 0%; background: #10b981; height: 100%; transition: width 0.1s;"></div>
    </div>

    <div id="loss-chart-container" style="display: none; margin-top: 15px;">
        <div id="loss-plot" style="height: 200px; width: 100%;"></div>
    </div>

</div>

<div class="md">
## From LM to LLM: Scaling Intelligence

A **Language Model (LM)** is a mathematical function that predicts the next "token" in a sequence based on probability. It treats language like a giant puzzle where it calculates the likelihood of the next piece based on the pieces already on the board.

### The Core Difference: Scale and Capability

The "Large" in **Large Language Model (LLM)** refers to a massive increase in two specific areas: **Parameters** and **Training Data**.

* **Standard LM:** Often trained on specific datasets (like medical journals or a small library) to perform narrow tasks like translation or basic autocomplete.
* **LLM:** Trained on the "digital commons", snapshots of the entire public internet (Wikipedia, GitHub, books, and forums). This scale allows the model to capture complex nuances like sarcasm, professional tone, and logic.

It is also called *large* language model because it doesn't only have a few hundreds or thousands of parameters, but billions of them. The Feed-Forward-Matrix of a transformer, for example, is at least as large as the number of dimensions. And LLMs have hundreds or thousands of those in parallel.

## Understanding "Context"
In the architecture of Large Language Models, **Context** refers to the specific window of information the model can "see" and process at any given moment. Technically, it is a finite sequence of **tokens** (words, characters, or chunks) held in the model's short-term working memory during a single inference pass. Because LLMs are **stateless**, meaning they do not "remember" previous interactions once a session ends, every new prompt must feed the entire relevant conversation history back into the model. Anything outside this "Context Window" effectively ceases to exist for the model's mathematical calculations.

### In-Context Learning (ICL)
In-Context Learning is the ability of a model to "learn" new tasks or formats during a conversation without any updates to its underlying neural weights (no gradient descent). 

#### The Mathematics of Contextual Learning
Mathematically, ICL can be viewed as a form of **implicit Bayesian inference**. When you provide examples $(x_1, y_1, x_2, y_2)$, the model calculates the conditional probability $P(y_\text{test} \mid x_\text{test}, C)$, where $C$ is the provided context. Recent research suggests that during the forward pass, the **Attention layers** simulate a mini-optimization process. The examples in the context act as Keys ($K$) and Values ($V$), while your query acts as the Query ($Q$).

In this equation, the model isn't just retrieving data; it is using the relationships defined in the context to "map" the new input to an output, effectively performing a temporary linear regression or gradient descent within the activation space of the transformer.

## The Needle In A Haystack
This is the industry-standard benchmark for testing a model's long-context retrieval capabilities.
* **The Test:** A tiny, unrelated fact (the needle) is buried deep inside a massive corpus of text (the haystack), such as a series of legal documents or a long novel. The model is then asked a question that can only be answered using that specific fact.
* **Key Finding:** Many models suffer from "Lost in the Middle" syndrome. While they excel at recalling information from the very beginning or very end of their context window, their accuracy often dips significantly for information buried in the middle, revealing limitations in how Transformer architectures distribute attention over long sequences.

### Logical Breakdown by Row:
* **Row 1:** $Q_{\text{the}}$ is compared against $K_{\text{the}}$, $K_{\text{king}}$, $K_{\text{is}}$, and $K_{\text{wise}}$. The mask keeps only the first connection.
* **Row 2:** $Q_{\text{king}}$ can "see" the keys for "the" and "king".
* **Row 3:** $Q_{\text{is}}$ can "see" "the", "king", and "is".
* **Row 4:** $Q_{\text{wise}}$ (the current word being generated) can "see" the entire context.

This triangular structure is what allows ChatGPT to generate text one word at a time without "cheating" by looking at the words it hasn't written yet.

### The Autoregressive Loop (Generation)
A generative model doesn't produce a full sentence at once. It works in a loop:

1.  **Input:** The user prompt (e.g., "The king is").
2.  **Forward Pass:** The model processes the sequence and produces a probability distribution for the *very next* token.
3.  **Sampling:** The model picks a token (e.g., "wise") based on that distribution.
4.  **Feedback:** The word "wise" is appended to the input, and the new sequence ("The king is wise") is fed back into the model to predict the next token (e.g., a period).

This continues until the model generates a special `|endoftext|` token, which signifies that the text generation has reached it's end.
</div>
