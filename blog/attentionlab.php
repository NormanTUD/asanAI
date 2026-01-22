<?php include_once("functions.php"); ?>

<div class="panel">
    
<div class="md">
# The Scaled Dot-Product Attention Mechanism

In modern NLP, words are not merely strings; they are high-dimensional vectors. **Self-Attention** is the operation that allows a model to dynamically re-weight these vectors based on their contextual relevance to one another.

### From Embeddings to Q, K, V
Each input word is first converted into an embedding vector $\mathbf{x}_i$. To compute attention, we project these embeddings into three distinct subspaces using learned weight matrices $W^Q, W^K,$ and $W^V$:

$$
\underbrace{\mathbf{q}_i}_{\text{Query}} = \mathbf{x}_i W^Q, \quad \underbrace{\mathbf{k}_i}_{\text{Key}} = \mathbf{x}_i W^K, \quad \underbrace{\mathbf{v}_i}_{\text{Value}} = \mathbf{x}_i W^V
$$

* **Query ($\mathbf{q}$):** Represents the current token's "search criteria."
* **Key ($\mathbf{k}$):** Acts as a "descriptor" or index of what information the token contains.
* **Value ($\mathbf{v}$):** The actual semantic information to be propagated forward.

### The Interaction: Dot-Product Scoring
To determine how much "attention" word $i$ should pay to word $j$, we calculate the scalar dot product of their respective Query and Key vectors. This measures their geometric alignment in the feature space:

$$
\text{score}_{i,j} = \mathbf{q}_i \cdot \mathbf{k}_j^T
$$

If the vectors $\mathbf{q}_i$ and $\mathbf{k}_j$ point in a similar direction, the product is large, indicating high relevance.


### The Scaling Factor and Softmax
As the dimensionality $d_k$ increases, the magnitude of the dot products grows, which can push the Softmax function into regions with extremely small gradients. To counteract this, we scale by $\sqrt{d_k}$:

$$
\alpha_{i,j} = \text{Softmax}\left( \frac{\mathbf{q}_i \mathbf{k}_j^T}{\sqrt{d_k}} \right) = \frac{\exp(\frac{\mathbf{q}_i \mathbf{k}_j^T}{\sqrt{d_k}})}{\sum_{n=1}^{L} \exp(\frac{\mathbf{q}_i \mathbf{k}_n^T}{\sqrt{d_k}})}
$$

This produces a probability distribution where $\sum_j \alpha_{i,j} = 1$, representing the "attention weights" word $i$ assigns to every word in the sequence.

### The Final Contextual Output
The output for each position is the weighted sum of all Value vectors. This "context vector" $\mathbf{z}_i$ is a version of the original word that has been "informed" by its neighbors:

$$
\mathbf{z}_i = \sum_{j} \alpha_{i,j} \mathbf{v}_j
$$

In matrix form, the entire operation for the sequence is computed efficiently as:
$$\text{Attention}(Q, K, V) = \text{Softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$
</div>

        <h2>The Connectivity Web</h2>
        <p class="sa-small-desc">Hover over the words to see the invisible threads of meaning.</p>
        
        <div id="sa-attention-container" style="position: relative; height: 300px; margin-top: 20px; background: #fcfdfe;">
            <canvas id="sa-attn-canvas" style="position: absolute; top: 0; left: 0; pointer-events: none; z-index: 5;"></canvas>
            <div id="sa-token-stream" style="display: flex; justify-content: center; gap: 30px; position: absolute; bottom: 60px; width: 100%;">
                </div>
        </div>

            <h2 style="color:#1e293b">The Attention Matrix</h2>
<div class="md">

### The Attention Matrix: The Brain’s "Compatibility Scorecard"

Think of this matrix as a **Scoreboard**. In a sentence, words aren’t just sitting next to each other; they are actively "talking" to find out how they relate to one another.

#### The "Handshake" (The Dot Product)
Behind every number in this table, two words are performing a mathematical handshake. The **Query** $\mathbf{q}$ (the word looking for context) and the **Key** $\mathbf{k}$ (the word being looked at) multiply their values together.
* **High Scores:** If the vectors point in a similar direction, the product is large, meaning the words are highly relevant to each other (like **hunter** and **bear**).
* **Low Scores:** If the vectors are "orthogonal" (pointing in different directions), the score stays low, meaning the words have little to do with each other in this context.

#### Keeping it Fair (The Scaling & Softmax)
We don't just use the raw scores because they can get too huge to handle, making the model "stubborn." We use two steps to clean them up:
* **The Scale:** We divide by $\sqrt{d_k}$ to keep the numbers small and manageable.
* **The Softmax:** We apply the formula $\text{Softmax}(x_i) = \frac{\exp(x_i)}{\sum \exp(x_j)}$ to turn those scores into percentages.

This forces all the attention for a single word to add up to exactly **100%**. If a word gives 85% of its focus to one neighbor, it only has 15% left to split among everyone else.

#### Why This Matters
When you see a dark blue square with **85%**, you are seeing the model "linking" those concepts. For example, when the word **"hunter"** looks at **"bear,"** it isn't just looking at a string of letters; it is pulling the "Value" ($\mathbf{v}$) of the bear into its own meaning. This is how the model understands that this specific hunter is currently interacting with a predator.

</div>
	<div id="sa-matrix-container" style="overflow-x: auto;"></div>
</div>

<div class="md">
A Transformer doesn't just look at a word's vector; it looks at the **entire sentence**. 
It asks: *"Which other words should I pay attention to?"*
</div>

<div class="md" style="margin-top:20px;">
Type **"bank river"** (Nature) or **"bank money"** (Finance) into the field below. The AI will "pull" the word **Bank** towards the meaning of its neighbor.
</div>

<div class="grid-layout">
    <div class="layers-vertical">
        <h2>Context Input</h2>
        <input type="text" id="trans-input" class="bw-cell" style="width: 100%; padding: 10px; font-weight: bold;" 
               value="bank river" oninput="runAttention()">
        
        <div id="trans-console" class="status-console" style="height: 120px;">
            Ready. Type 'bank river' or 'bank money'...
        </div>

        <p style="font-size: 0.8rem; color: #64748b;">
            *Orange line = Attention. The diamond shows where "Bank" moves in context.*
        </p>
    </div>
    <div id="transformer-plot" class="plot-container" style="height: 450px; background: #fff;"></div>
</div>
