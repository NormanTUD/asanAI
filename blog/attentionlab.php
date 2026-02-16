<?php include_once("functions.php"); ?>

<div class="md">

# The Semantic Tug-of-War: How Transformers "Think"

In a Transformer model, words don't live in a dictionary; they live in a **Semantic Universe**. Every concept, from "apple" to "existentialism", is assigned a specific coordinate in a high-dimensional map. However, some words suffer from a serious identity crisis.

## The Semantic GPS
Take the word **"Bank."** In isolation, its vector sits in a "neutral" zone, mathematically halfway between a nature walk and a trip to the vault. It is ambiguous because its coordinate hasn't been "anchored" yet.

The **Self-Attention mechanism** acts as a semantic GPS. It looks at the surrounding words to calculate a "pull" that drags a word toward its intended meaning:

* **The Vector Shift:** If the word "river" is nearby, it exerts a gravitational force on "bank," dragging its coordinates away from finance and toward nature.
* **The Resulting Embedding:** The final position (represented by the **blue diamond** in the plot below) is the "contextualized" version of the word, informed by its neighbors.
</div>

<div class="md">
## Geometric Intuition Lab: Why *That* Equation?

The attention equation looks deceptively simple:

$$\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^T}{\sqrt{d_k}}\right) V$$

But *why* this specific formula? Why dot products? Why softmax? Why $\sqrt{d_k}$? 

The best way to understand is to **see it working** in spaces small enough to visualize. We'll build up from 1D scalars to 3D vectors, and at each stage, the geometric meaning of every piece of the equation will become obvious.
</div>

<!-- ===================== SECTION 1: 1D ===================== -->
<div class="md">
### 1D: Attention on a Number Line

In one dimension, every embedding is just a **single number**. The Query $q$, Key $k$, and Value $v$ are all scalars. The dot product $q \cdot k$ is just ordinary multiplication.

$$\text{score}_{j} = q \cdot k_j$$

This is the simplest possible "similarity measure": two numbers agree if they have the **same sign and large magnitude**. If $q = 3$ and $k_1 = 4$, the score is $12$ (strong agreement). If $k_2 = -2$, the score is $-6$ (disagreement). After softmax, the output is a **weighted average** of the values:

$$\text{output} = \sum_j \alpha_j \, v_j, \quad \alpha_j = \frac{e^{q \cdot k_j}}{\sum_n e^{q \cdot k_n}}$$

In 1D, $\sqrt{d_k} = 1$, so scaling does nothing. Drag the sliders below to see how the query "chooses" which values to attend to, purely based on sign and magnitude agreement on a single number line.
</div>

<!-- ===================== 1D: "How Financial Is It?" ===================== -->
<div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0;
            margin:15px 0; max-width:720px; margin-left:auto; margin-right:auto;">

    <div style="text-align:center; margin-bottom:8px;">
        <span style="font-size:1.05rem; font-weight:bold; color:#1e293b;">
            1D: Where does "bank" land on the Nature ↔ Finance axis?
        </span>
    </div>

    <!-- Live sentence -->
    <div id="attn1d-sentence" style="padding:10px 16px; margin-bottom:14px; background:#fff;
         border-left:4px solid #cbd5e1; border-radius:6px; font-style:italic; color:#334155;
         transition: border-color 0.2s;height:50px;"></div>

    <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
        <span style="font-size:0.85rem; color:#10b981; font-weight:bold;">🌿 −1</span>
        <input type="range" id="attn1d-q" min="-1" max="1" step="0.1" value="2.0"
               style="flex:1; accent-color:#2563eb;" oninput="updateAttn1D()">
        <span style="font-size:0.85rem; color:#f59e0b; font-weight:bold;">+1 🏦</span>
        <span id="attn1d-q-val"
              style="font-size:1.2rem; font-weight:bold; color:#2563eb; min-width:40px; text-align:right;">2.0</span>
    </div>

    <canvas id="attn1d-canvas" width="700" height="220"
            style="display:block; width:100%; height:220px; border:1px solid #e2e8f0; border-radius:8px; background:#fff;"></canvas>

    <div id="attn1d-math" style="margin-top:12px; padding:10px; background:#fff; border-radius:8px;
         border:1px dashed #cbd5e1; overflow-x:auto;"></div>
</div>



<!-- ===================== SECTION 2: 2D ===================== -->
<div class="md">
### 2D: Attention in a Plane, The Dot Product as Angular Alignment

Now each vector lives in $\mathbb{R}^2$. The dot product $\mathbf{q} \cdot \mathbf{k} = \|\mathbf{q}\|\|\mathbf{k}\|\cos\theta$ measures **angular alignment** weighted by magnitude. Two vectors pointing the same way produce a large positive score; perpendicular vectors score zero; opposing vectors score negative.

$$\text{score}_j = \frac{\mathbf{q} \cdot \mathbf{k}_j}{\sqrt{d_k}} = \frac{\mathbf{q} \cdot \mathbf{k}_j}{\sqrt{2}}$$

Here $\sqrt{d_k} = \sqrt{2} \approx 1.41$. This scaling **prevents the scores from growing too large** as dimensionality increases, which would push softmax into near-one-hot territory and kill gradients.

The output is a **weighted average of the value vectors**, geometrically, it's a point inside the **convex hull** (the polygon formed by the value points). Attention can only **interpolate**, never **extrapolate** beyond the values.

Drag the query arrow below. Watch how rotating it toward a key increases that key's attention weight, and the output point slides toward the corresponding value.
</div>

<!-- ===================== 2D: "Where Does Bank Belong?" ===================== -->
<div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0;
            margin:15px 0; max-width:720px; margin-left:auto; margin-right:auto;">

    <div style="text-align:center; margin-bottom:8px;">
        <span style="font-size:1.05rem; font-weight:bold; color:#1e293b;">
            2D: Drag "bank" through the semantic plane
        </span>
    </div>

    <!-- Live sentence -->
    <div id="attn2d-sentence" style="padding:10px 16px; margin-bottom:14px; background:#fff;
         border-left:4px solid #cbd5e1; border-radius:6px; font-style:italic; color:#334155;
	 transition: border-color 0.2s; height: 80px;"></div>

    <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:14px;">
        <div style="flex:1; min-width:200px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:0.8rem; color:#10b981; font-weight:bold;">🌿</span>
                <input type="range" id="attn2d-qx" min="-3" max="3" step="0.1" value="1.5"
                       style="flex:1; accent-color:#2563eb;" oninput="updateAttn2D()">
                <span style="font-size:0.8rem; color:#f59e0b; font-weight:bold;">🏦</span>
                <span id="attn2d-qx-val" style="font-weight:bold; color:#2563eb; min-width:32px; text-align:right;">1.5</span>
            </div>
            <div style="text-align:center; font-size:0.75rem; color:#64748b;">Nature ← x → Finance</div>
        </div>
        <div style="flex:1; min-width:200px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:0.8rem; color:#3b82f6; font-weight:bold;">😌</span>
                <input type="range" id="attn2d-qy" min="-3" max="3" step="0.1" value="0.5"
                       style="flex:1; accent-color:#2563eb;" oninput="updateAttn2D()">
                <span style="font-size:0.8rem; color:#ef4444; font-weight:bold;">⚡</span>
                <span id="attn2d-qy-val" style="font-weight:bold; color:#2563eb; min-width:32px; text-align:right;">0.5</span>
            </div>
            <div style="text-align:center; font-size:0.75rem; color:#64748b;">Calm ← y → Urgent</div>
        </div>
    </div>

    <canvas id="attn2d-canvas" width="500" height="500"
            style="display:block; margin:0 auto; max-width:100%; border:1px solid #e2e8f0;
                   border-radius:8px; background:#fff;"></canvas>

    <div id="attn2d-math" style="margin-top:12px; padding:10px; background:#fff; border-radius:8px;
         border:1px dashed #cbd5e1; overflow-x:auto;"></div>
</div>

<div class="md">
### Summary: Why *That* Equation?

$$\boxed{\text{Attention} = \underbrace{\text{softmax}}_{\text{normalize to convex weights}}\!\left(\frac{\overbrace{QK^T}^{\text{directional alignment}}}{\underbrace{\sqrt{d_k}}_{\text{variance control}}}\right) \underbrace{V}_{\text{information to blend}}}$$

Having played with all three dimensions, the design choices become clear:

1. **Dot product** $QK^T$: It's the natural measure of directional alignment. In 1D it's just multiplication (same sign = agree). In 2D/3D it's $\|\mathbf{q}\|\|\mathbf{k}\|\cos\theta$, the projection of one vector onto another. No other simple operation captures "how much do these vectors point the same way?"

2. **$\sqrt{d_k}$ scaling**: Without it, as $d_k$ grows, the expected magnitude of dot products grows as $\sqrt{d_k}$, pushing softmax toward hard one-hot outputs. The scaling keeps the variance of scores constant regardless of dimension, preserving smooth gradients.

3. **Softmax**: Turns raw scores into a **probability distribution**, non-negative weights that sum to 1. This means the output is a **convex combination** of values, geometrically trapped inside their convex hull. It's the minimal assumption: "blend the available information proportionally to relevance."

4. **Weighted sum of Values**: The output is an interpolation, not a lookup. This is differentiable everywhere, enabling gradient-based learning. The FFN layer that follows provides the non-linearity needed to "escape" the convex hull and create genuinely new representations.
</div>

<div class="md">
## The Physics of the "Handshake"
To decide how much "pull" one word has on another, the model performs a mathematical handshake using three specific projections:

1.  **Query ($\mathbf{q}$):** The word looking for context (e.g., "What kind of Bank am I?").
2.  **Key ($\mathbf{k}$):** The words offering context (e.g., "I am a River, I have water and banks.").
3.  **Value ($\mathbf{v}$):** The actual semantic "content" to be shared.

The model calculates an alignment score using the dot product:
$$\text{score}_{i,j} = \mathbf{q}_i \cdot \mathbf{k}_j^T$$
If the Query and Key point in a similar direction, the connection is strong. This produces the **orange "Handshake" lines** you see in the simulation.

## Interactive Lab: Mapping Meaning
Type **"bank river"** or **"bank money"** below. Notice how the diamond, the contextualized "Bank", leaps toward the neighbor that defines it. You are literally watching the model resolve an identity crisis in real-time.

</div>

    <div class="layers-vertical">
        <h2>Context Input</h2>
	<p>Ready. Type 'bank river' or 'bank money'...</p>
        <input type="text" id="trans-input" class="bw-cell" style="width: 90%;" 
               value="bank river" oninput="runAttention()">
        

        <p style="font-size: 0.8rem; color: #64748b;">
            *Orange line = Attention. The diamond shows where "Bank" moves in context.*
        </p>
    </div>
    <div id="transformer-plot" class="plot-container" style="height: 450px; background: #fff;"></div>

<div class="md">

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
To determine how much "attention" word $i$ should pay to word $j$, we calculate the scalar dot product of their respective Query and Key vectors. This measures their geometric alignment in the feature space:

$$
\text{score}_{i,j} = \mathbf{q}_i \cdot \mathbf{k}_j^T
$$

If the vectors $\mathbf{q}_i$ and $\mathbf{k}_j$ point in a similar direction, the product is large, indicating high relevance.


## The Scaling Factor and Softmax
As the dimensionality $d_k$ increases, the magnitude of the dot products grows, which can push the Softmax function into regions with extremely small gradients. To counteract this, we scale by $\sqrt{d_k}$:

$$
\alpha_{i,j} = \text{Softmax}\left( \frac{\mathbf{q}_i \mathbf{k}_j^T}{\sqrt{d_k}} \right) = \frac{\exp(\frac{\mathbf{q}_i \mathbf{k}_j^T}{\sqrt{d_k}})}{\sum_{n=1}^{L} \exp(\frac{\mathbf{q}_i \mathbf{k}_n^T}{\sqrt{d_k}})}
$$

This produces a probability distribution where $\sum_j \alpha_{i,j} = 1$, representing the "attention weights" word $i$ assigns to every word in the sequence.

## The Final Contextual Output
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

## Why This Matters
When you see a dark blue square with **85%**, you are seeing the model "linking" those concepts. For example, when the word **"hunter"** looks at **"bear,"** it isn't just looking at a string of letters; it is pulling the "Value" ($\mathbf{v}$) of the bear into its own meaning. This is how the model understands that this specific hunter is currently interacting with a predator.
</div>
<div id="sa-matrix-container" style="overflow-x: auto;"></div>

<div class="md">
## Summary: The Vector Tug-of-War

In the world of Transformers, meaning is **movement**. Instead of looking up a word in a static dictionary, the model calculates a new position for that word based on the "gravitational pull" of its neighbors in the embedding space. This creates a vector that is near the *meaning* of the word in the context it's used in, not the mere embedding of the word itself.

## The Intuition: Contextual Gravity
Think of a word as a point floating in a high-dimensional space. In isolation, it sits in a "neutral" zone. Self-attention allows other words in the sentence to act like magnets, dragging that point toward a more specific meaning.

## Example 1: The "Apple" Shift
</div>
<div id="apple-shift-plot" style="height:400px;"></div>

<div class="md" style="padding: 15px; border-left: 5px solid #2e7d32; background-color: #f9f9f9; font-style: italic; margin-bottom: 20px;">
The person was eating the *juicy* **apple**.
</div>

<div class="md">
* **Neutral State:** "Apple" sits between *Technology* and *Fruit*.
* **The Context:** "I ate a juicy **apple**."
* **The Pull:** The word "juicy" exerts a high attention score.
* **The Result:** The vector for "apple" is pulled toward the *Fruit* coordinate, away from the *iPhone* coordinate.

## Example 2: The "Key" Shift
</div>
<div id="key-shift-plot" style="height:400px;"></div>

<div class="md" style="padding: 15px; border-left: 5px solid #2e7d32; background-color: #f9f9f9; font-style: italic; margin-bottom: 20px;">
The pianist played the entire piece of **music** in the wrong **key**.
</div>

<div class="md">
* **Neutral State:** "Key" sits between *Music*, *Security*, and *Data*.
* **The Context:** "The pianist hit the wrong **key**."
* **The Pull:** The word "pianist" creates a mathematical "handshake" with "key".
* **The Result:** The final output vector ($\mathbf{z}$) for "key" is now 90% "Music" and 10% "Security," resolving its identity crisis in real-time.

## The Bottom Line
Mathematically, the "contextualized" word is just a weighted average of the information (Values) around it:
$$\mathbf{z}_{i} = \sum_{j} \alpha_{i,j} \mathbf{v}_j$$
The diamond you see in the plot is the result of this physics, a word finding its true north by listening to its neighbors.
## The Calculation
To find the dot product of two vectors, you multiply the numbers in the same positions and then add all those results together.

If we have two vectors $\vec{A}$ and $\vec{B}$:
$$\vec{A} = \begin{pmatrix} a_1 \\ a_2 \end{pmatrix}, \vec{B} = \begin{pmatrix} b_1 \\ b_2 \end{pmatrix}$$

The Dot Product ($\vec{A} \cdot \vec{B}$) is:
$$\vec{A} \cdot \vec{B} = (a_1 \times b_1) + (a_2 \times b_2)$$

The Dot Product has a beautiful geometric property:
* **High Positive Number:** The arrows point in roughly the same direction (They are "Similar").
* **Zero:** The arrows are at a right angle (They are "Unrelated").
* **Negative Number:** The arrows point in opposite directions (They are "Opposites").

In a Transformer (like ChatGPT), this is the "Handshake." When a word "looks" at another word, it calculates the Dot Product. If the result is high, the AI knows those words are contextually related. This will be explained in more detail later on.
</div>

<div class="lab-container">
    <div id="dot-product-plot" style="width:100%; max-width:500px; height:400px; margin: 0 auto;"></div>
    <div class="controls" style="text-align: center; padding: 20px;">
        <label>Vector A: <input type="range" id="angle-a" min="0" max="360" value="45"> <span id="val-a">45</span>°</label><br>
        <label>Vector B: <input type="range" id="angle-b" min="0" max="360" value="90"> <span id="val-b">90</span>°</label>
    </div>
    <div id="dot-product-result" style="font-family: monospace; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 10px;">
        </div>
</div>
