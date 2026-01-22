<?php include_once("functions.php"); ?>

<div class="md">
## A Concrete Walkthrough: Attention on “the king is wise”

To make the attention mechanism tangible, let us walk through a concrete example
using the simplified 4-dimensional embeddings shown in this demo.

We consider the sentence:

**“the king is wise”**

Each word is first mapped to its embedding vector from an embedding space that has been automatically trained:

$$
\text{the} =
\begin{pmatrix}
-0.009 \\
-0.423 \\
-0.025 \\
1.295
\end{pmatrix},
\quad
\text{king} =
\begin{pmatrix}
1.688 \\
-0.454 \\
0 \\
0
\end{pmatrix},
\quad
\text{is} =
\begin{pmatrix}
0.439 \\
2.008 \\
0 \\
0.292
\end{pmatrix},
\quad
\text{wise} =
\begin{pmatrix}
0.593 \\
1.747 \\
1.747 \\
0.256
\end{pmatrix}
$$

These vectors form the input matrix $X$ for the attention layer. The concrete dimensions don't mean anything here, as they are chosen not by meaning, but by how well they work mathematically alone.

The whole sentence then is the Tensor $X$, such that $
X =
\begin{pmatrix}
\text{the} \\
\text{king} \\
\text{is} \\
\text{wise}
\end{pmatrix}
=
\begin{pmatrix}
-0.009 & -0.423 & -0.025 & 1.295 \\
\;\;1.688 & -0.454 & \;\;0.000 & \;\;0.000 \\
\;\;0.439 & \;\;2.008 & \;\;0.000 & \;\;0.292 \\
\;\;0.593 & \;\;1.747 & \;\;1.747 & \;\;0.256
\end{pmatrix}
$.

These are very much simplified versions of real matrices and a real Feed-Forward-Network that would be used in LLMs, but it gets the basic idea.

## From Embeddings to Queries, Keys, and Values

Each embedding is projected into three different spaces using 3 learned matrices:

$$
Q = X W^Q, \quad
K = X W^K, \quad
V = X W^V
$$

Using the example matrices provided, the projection matrices are:

$$
W_Q =
\begin{pmatrix}
0.478 & 0 & 0 & 0 \\
0 & 0 & 0 & 0 \\
0 & 0 & 0 & 0 \\
2 & 0 & 0 & 0
\end{pmatrix},
\quad
W_K =
\begin{pmatrix}
2 & 0 & 0 & 0 \\
0 & 0 & 0 & 0 \\
0 & 0 & 0 & 0 \\
0 & 0 & 0 & 0
\end{pmatrix},
\quad
W_{\text{FFN}} =
\begin{pmatrix}
0.589 & 8.985 & 1.350 & -0.589 \\
1.409 & -0.044 & 8.956 & 0.438 \\
0.097 & 1.289 & 0.012 & 10.436 \\
10.923 & 0.306 & -0.178 & 0.122
\end{pmatrix}
$$

These matrices do not inherently *mean* anything, they are learned, just as the weights of a Dense layer is learned, during the training of a neural network in such a way that it *works*. But it's important to note they do not *mean* anything, and could be very different numbers as well. The number of dimensions of these matrices is dependent only on the dimensionality of the embedding space, not the number of input words.

Conceptually:

- **Queries** ($Q$) represent what each word is asking for
- **Keys** ($K$) represent what each word offers
- **Values** ($V$) represent the information to be shared

Even though all three originate from the same embedding,
the different projection matrices cause them to occupy **different geometric orientations**.

## Example: How “king” Attends to Other Words

Let us focus on the word **“king”**.

Its Query vector $Q_{\text{king}}$ is compared to the Key vectors of *all* words:

$$
\begin{aligned}
\text{Score}(\text{king}, \text{the}) &= Q_{\text{king}} \cdot K_{\text{the}} \\
\text{Score}(\text{king}, \text{king}) &= Q_{\text{king}} \cdot K_{\text{king}} \\
\text{Score}(\text{king}, \text{is}) &= Q_{\text{king}} \cdot K_{\text{is}} \\
\text{Score}(\text{king}, \text{wise}) &= Q_{\text{king}} \cdot K_{\text{wise}}
\end{aligned}
$$

These dot products measure **directional alignment**.
If two vectors point in similar directions, the score is high.
If they are orthogonal or opposed, the score is low or negative.

All scores are then scaled and normalized, and divided by the square root of the number of dimensions in the Embedding space $d_k$ ($=4$ in this example):

$$
\alpha_{\text{king}}
=
\underbrace{
\text{softmax}
\left(
\frac{Q_{\text{king}} K^\top}{\sqrt{d_k}}
\right)
}_{\text{Attention weights over all words}}
$$

This produces weights such as:

- low weight for **“the”** (function word, little semantic content)
- moderate weight for **“is”** (syntactic relation)
- high weight for **“wise”** (semantic attribute of “king”)

<div id="transformer_explanation_chart"></div>

Different attention heads may produce totally different attention matrices, though. Every attention head learns to focus on different patterns in the embedding space. One may focus on time (i.e. past-present-future), another one on gender (female, male), another one on the relation between noun and adjective and so on. Usually, there are hundreds of attention heads focussing on all kinds of different things in LLMs. For simplicity, we only do one attention head though.

In the architecture of a Transformer, the **0.6 (60%)** score between **"wise"** (Query) and **"king"** (Key) is the mechanism of **contextual intelligence**.

* **Linguistic Mapping:** It represents the model's "discovery" that the abstract property of *wisdom* is physically anchored to the *king*. It successfully resolves the dependency between an adjective and its noun.
* **Information Filtering:** Since in the Softmax function all weights must sum to 1.0, assigning 0.6 to "king" means the model is intentionally **ignoring noise**. It treats "the" and "is" as background structural elements, focusing its "computational energy" where the semantic meaning is densest.
* **Vector Transformation:** Mathematically, this 0.6 acts as a gate. When calculating the final output for the word "wise," the model takes 60% of the data from the **Value ($V$)** vector of "king." This creates a **context-aware embedding**, ensuring that in the next layer of the network, the model isn't just processing "wise," but specifically *"kingly-wisdom."*

**Summary:** The 0.6 score is the mathematical bridge that turns a sequence of isolated words into a coherent, relational thought.

## Mixing Information: The Attention Output

The attention weights are applied to the Value vectors:

$$
\text{Attention Output}_{\text{king}} = \sum_i \underbrace{\alpha_i}_{\text{Importance}} 
( \underbrace{E_{w_i}}_{\substack{\text{Word} \\ \text{Embedding}}} + \underbrace{P_i}_{\substack{\text{Position} \\ \text{Encoding}}} )
$$

Geometrically, this is a **weighted average of value vectors**.
The resulting vector represents:

“king, understood in the context of being wise”

This output is already **context-aware**,
but it is still not a word — it is a refined vector.

## What the Feed-Forward Network Really Does

After attention, each token has a contextual vector of size $d_{\text{model}}$.
In real models, this is often $512$.

The Feed-Forward Network operates **independently on each token**:

$$
\text{FFN}(x)
=
\underbrace{
\text{Activation}\left(W_1x + b_1\right)
}_{\text{First layer}}
\;
\cdot
\;
\underbrace{W_2 + b_2}_{\text{Second layer}}
$$

Typical dimensions for real-world-examples:

- Input: $1 \times 1024 \times 512$
- First layer: $512 \rightarrow 2048$
- Activation function (e.g. ReLU or GELU)
- Second layer: $2048 \rightarrow 512$

Interpretation:

- The first layer **fans out** the vector, exposing many latent features
- The non-linearity allows conditional feature activation
- The second layer **compresses** the result back into model space

This step is where **complex feature interactions** are computed.

## Final Projection: From Meaning to Words

After the Feed-Forward Network (FFN), each token has a **hidden state** $h$,
which encodes the word *in context* — its meaning after attention and processing.

To turn this hidden state into a word prediction, the model compares it
to the embeddings of all words in the vocabulary.
These embeddings are stored in a matrix $W_{\text{vocab}}$, where each **row** corresponds to one word:

$$
W_{\text{vocab}} =
\begin{pmatrix}
\text{Embedding}_{\text{the}} \\
\text{Embedding}_{\text{king}} \\
\text{Embedding}_{\text{is}} \\
\text{Embedding}_{\text{wise}} \\
\vdots
\end{pmatrix}
$$

The logits are computed as a dot product between the hidden state $h$ and every word embedding:

$$
\text{Logits} =
\underbrace{h}_{\text{contextual meaning}}
\cdot
\underbrace{W_{\text{vocab}}^\top}_{\text{all word embeddings}}
$$

- Each entry in $\text{Logits}$ is a **score** for a specific word, measuring
  how aligned that word's embedding is with the hidden state's direction.
- Applying **softmax** converts these scores into probabilities:

$$
P(\text{next word}) = \text{softmax}(\text{Logits})
$$

### Concrete Example (using simplified embeddings)

Suppose the hidden state for our token “king” after FFN is:

$$
h =
\begin{pmatrix}
1.5 \\
-0.2 \\
0.1 \\
0.0
\end{pmatrix}
$$

And the embeddings of candidate next words are:

$$
\text{Embedding}_{\text{wise}} =
\begin{pmatrix}
0.593 \\
1.747 \\
1.747 \\
0.256
\end{pmatrix},
\quad
\text{Embedding}_{\text{prince}} =
\begin{pmatrix}
0.415 \\
0.0 \\
1.053 \\
0.0
\end{pmatrix}
$$

The dot product gives:

$$
\text{Logit}_{\text{wise}} = h \cdot \text{Embedding}_{\text{wise}}
= \underbrace{
\begin{pmatrix}
1.5 \\
-0.2 \\
0.1 \\
0.0
\end{pmatrix}
}_{h}
\;\cdot\;
\underbrace{
\begin{pmatrix}
0.593 \\
1.747 \\
1.747 \\
0.256
\end{pmatrix}
}_{\text{Embedding for wise}}
= 1.5 \cdot 0.593 + (-0.2) \cdot 1.747 + 0.1 \cdot 1.747 + 0 \cdot 0.256 \approx 0.7148
$$

$$
\text{Logit}_{\text{prince}} = h \cdot \text{Embedding}_{\text{prince}}
= \underbrace{
\begin{pmatrix}
1.5 \\
-0.2 \\
0.1 \\
0.0
\end{pmatrix}
}_{h}
\;\cdot\;
\underbrace{
\begin{pmatrix}
0.415 \\
0.0 \\
1.053 \\
0.0
\end{pmatrix}
}_{\text{Embedding for prince}}

= 1.5 \cdot 0.415 + (-0.2) \cdot 0 + 0.1 \cdot 1.053 + 0 \cdot 0 \approx 0.7278
$$

The softmax over all candidates converts these logits into probabilities.
The model selects the word with the **highest probability** — the word whose embedding
is most aligned with the hidden state’s meaning.

Key intuition: the hidden state is a **direction in semantic space**, and the model
chooses the word whose usual position in that space is closest to this direction.

## Key Intuition

At no point does the model manipulate symbols or rules.

Everything is:

- vector projection
- geometric alignment
- weighted averaging
- non-linear transformation

Meaning emerges not from words themselves,
but from how vectors **move, align, and combine** in space.

## Injecting Order (Positional Encoding)
Before the vectors enter the attention layer, we add a positional wave. If we didn't do this, the model wouldn't know if "king" came before or after "wise".

$$ \vec{x}_{\text{pos}} = \text{Embedding} + \text{PE}(\text{pos}) $$

For the word **"king"** at Position 1 ($\text{pos}=1$):
$$
\underbrace{\begin{pmatrix} 1.688 \\ -0.454 \\ 0 \\ 0 \end{pmatrix}}_{\text{Semantic}} + 
\underbrace{\begin{pmatrix} 0.841 \\ 0.540 \\ 0.0001 \\ 1.000 \end{pmatrix}}_{\text{Position 1}} =
\underbrace{\begin{pmatrix} 2.529 \\ 0.086 \\ 0.0001 \\ 1.000 \end{pmatrix}}_{\text{Input to Attention}}
$$

## Injecting Order: Positional Encoding
Because Transformers process all words at once, they have no innate sense of which word comes first. To fix this, we **add** a "positional vector" to each word embedding.

$$ \text{Input Vector} = \text{Embedding} + \text{Positional Encoding} $$

For each dimension $i$ in a vector of size $d_{model}$, we calculate a specific "wave" value:
$$ PE_{(\text{pos}, 2i)} = \sin(\text{pos} / 10000^{2i/d_{model}}) $$
$$ PE_{(\text{pos}, 2i+1)} = \cos(\text{pos} / 10000^{2i/d_{model}}) $$

### Example: Nudging the "King" at Position 1
If "king" is the second word ($\text{pos}=1$), its original vector $[1.688, -0.454, 0, 0]$ is "nudged" by the sine/cosine waves for position 1:
$$
\begin{pmatrix} 1.688 \\ -0.454 \\ 0 \\ 0 \end{pmatrix} +
\begin{pmatrix} 0.841 \\ 0.540 \\ 0.0001 \\ 1.000 \end{pmatrix} =
\begin{pmatrix} 2.529 \\ 0.086 \\ 0.0001 \\ 1.000 \end{pmatrix}
$$

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
		<input type="text" id="tf-input" class="bw-cell" style="width: 100%; font-family: monospace; background: transparent; position: relative; z-index: 2;" value="The" oninput="TransformerLab.run()">
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
    <div style="display: flex; gap: 250px; flex-wrap: wrap; justify-content: center;">
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

    <div class="panel">
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
		<p>The matrix $W_{ffn}$ acts as the model's <b>"knowledge bank."</b> It maps the semantic traits of the current word to the expected traits of the next word.</p>
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
