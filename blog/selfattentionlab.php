<?php include_once("functions.php"); ?>

<div class="panel" style="background: white; padding: 40px 0; width: 100%; margin: 0;">
    
<div class="md">
# The Scaled Dot-Product Attention Mechanism

In modern NLP, words are not merely strings; they are high-dimensional vectors. **Self-Attention** is the operation that allows a model to dynamically re-weight these vectors based on their contextual relevance to one another.

### 1. From Embeddings to Q, K, V
Each input word is first converted into an embedding vector $\mathbf{x}_i$. To compute attention, we project these embeddings into three distinct subspaces using learned weight matrices $W^Q, W^K,$ and $W^V$:

$$
\underbrace{\mathbf{q}_i}_{\text{Query}} = \mathbf{x}_i W^Q, \quad \underbrace{\mathbf{k}_i}_{\text{Key}} = \mathbf{x}_i W^K, \quad \underbrace{\mathbf{v}_i}_{\text{Value}} = \mathbf{x}_i W^V
$$

* **Query ($\mathbf{q}$):** Represents the current token's "search criteria."
* **Key ($\mathbf{k}$):** Acts as a "descriptor" or index of what information the token contains.
* **Value ($\mathbf{v}$):** The actual semantic information to be propagated forward.

### 2. The Interaction: Dot-Product Scoring
To determine how much "attention" word $i$ should pay to word $j$, we calculate the scalar dot product of their respective Query and Key vectors. This measures their geometric alignment in the feature space:

$$
\text{score}_{i,j} = \mathbf{q}_i \cdot \mathbf{k}_j^T
$$

If the vectors $\mathbf{q}_i$ and $\mathbf{k}_j$ point in a similar direction, the product is large, indicating high relevance.


### 3. The Scaling Factor and Softmax
As the dimensionality $d_k$ increases, the magnitude of the dot products grows, which can push the Softmax function into regions with extremely small gradients. To counteract this, we scale by $\sqrt{d_k}$:

$$
\alpha_{i,j} = \text{Softmax}\left( \frac{\mathbf{q}_i \mathbf{k}_j^T}{\sqrt{d_k}} \right) = \frac{\exp(\frac{\mathbf{q}_i \mathbf{k}_j^T}{\sqrt{d_k}})}{\sum_{n=1}^{L} \exp(\frac{\mathbf{q}_i \mathbf{k}_n^T}{\sqrt{d_k}})}
$$

This produces a probability distribution where $\sum_j \alpha_{i,j} = 1$, representing the "attention weights" word $i$ assigns to every word in the sequence.

### 4. The Final Contextual Output
The output for each position is the weighted sum of all Value vectors. This "context vector" $\mathbf{z}_i$ is a version of the original word that has been "informed" by its neighbors:

$$
\mathbf{z}_i = \sum_{j} \alpha_{i,j} \mathbf{v}_j
$$

In matrix form, the entire operation for the sequence is computed efficiently as:
$$\text{Attention}(Q, K, V) = \text{Softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$
</div>

    <div class="sa-lab-card" style="margin-top: 40px; position: relative; overflow: hidden; padding-top: 80px; border: none; box-shadow: none;">
        <h2 style="color:#2563eb; margin-bottom: 0; padding-left: 20px;">1. The Connectivity Web</h2>
        <p class="sa-small-desc" style="padding-left: 20px;">Hover over the words to see the invisible threads of meaning.</p>
        
        <div id="sa-attention-container" style="position: relative; height: 300px; margin-top: 20px; background: #fcfdfe;">
            <canvas id="sa-attn-canvas" style="position: absolute; top: 0; left: 0; pointer-events: none; z-index: 5;"></canvas>
            <div id="sa-token-stream" style="display: flex; justify-content: center; gap: 30px; position: absolute; bottom: 60px; width: 100%;">
                </div>
        </div>
    </div>

    <div style="padding: 0 40px;">
        <div class="sa-lab-card" style="margin-top: 30px; border: 1px solid #f1f5f9;">
            <h2 style="color:#1e293b">2. The Attention Matrix</h2>
            <p class="sa-small-desc">This is the "Brain's Spreadsheet." It shows exactly how much focus (0-100%) each word gives to the others.</p>
            <div id="sa-matrix-container" style="overflow-x: auto;"></div>
        </div>
    </div>
</div>

<style>
    .sa-lab-card { background: #ffffff; border-radius: 12px; padding: 25px; }
    .sa-small-desc { font-size: 0.95rem; color: #64748b; margin-bottom: 20px; }
    
    .sa-token-block {
        padding: 15px 30px;
        background: white;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        font-family: 'Courier New', monospace;
        font-size: 1.2rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        z-index: 10;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .sa-token-block:hover {
        border-color: #3b82f6;
        color: #2563eb;
        transform: scale(1.1);
        box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.2);
    }

    .sa-attn-table { border-collapse: collapse; width: 100%; border-radius: 8px; overflow: hidden; }
    .sa-attn-table th { padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; }
    .sa-attn-table td { height: 70px; text-align: center; border: 1px solid #e2e8f0; font-size: 1.1rem; font-weight: 600; }
    .sa-row-label { font-weight: bold; background: #f8fafc; color: #1e293b; width: 120px; }
</style>
