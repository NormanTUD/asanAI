<?php include_once("functions.php"); ?>

<div class="md">
# How "The King" Gets His Seat: Positional Embeddings

In our Lab, the word **"king"** is represented by the vector:
$$\text{king} = [1.688, -0.454, 0, 0]$$

Without Positional Encoding, this vector is the same whether he is the first word or the last. To fix this, we **add** a unique signature to these 4 dimensions based on his position ($pos$).

### The Math of the Nudge
We use alternating sine and cosine waves. In our 4D model ($d_{model}=4$):
- **Dim 0 (sin):** Fast wave.
- **Dim 1 (cos):** Fast wave (offset).
- **Dim 2 (sin):** Slow wave.
- **Dim 3 (cos):** Slow wave (offset).

$$PE_{(pos, i)} = \begin{cases} \sin(pos / 10000^{i/d_{model}}) & i \text{ even} \\ \cos(pos / 10000^{(i-1)/d_{model}}) & i \text{ odd} \end{cases}$$

### Visualizing the Shift
If **"king"** is at **Position 1**, we calculate $PE_{pos=1}$ and add it:
$$\text{king}_{at\_pos\_1} = \begin{bmatrix} 1.688 \\ -0.454 \\ 0 \\ 0 \end{bmatrix} + \begin{bmatrix} \sin(1) \\ \cos(1) \\ \sin(1/100) \\ \cos(1/100) \end{bmatrix} \approx \begin{bmatrix} 2.53 \\ 0.09 \\ 0.01 \\ 1.00 \end{bmatrix}$$

This new vector still contains the "kingly" information, but it is now physically shifted in the 4D space so the model knows he is at the beginning of the sentence.
</div>

<div style="margin-bottom: 20px; font-family: sans-serif;">
    <strong>Move "king" along the sentence:</strong> 
    <input type="range" id="pe-len" min="0" max="10" value="1" oninput="PositionalLab.update(this.value)">
    <span id="pe-val">Position 1</span>
</div>

<div id="pe-chart" style="width:100%; height:350px; margin-bottom: 20px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0;"></div>
<div id="pe-viz-container"></div>

<div class="md">
### The Geometry of Certainty

When you look at the **Semantic Embedding Space** plot in the panel below, you are seeing a 2D projection of a 4D world.

1. **Alignment:** When the **Query** of "wise" aligns with the **Key** of "king," their vectors point in the same direction. This creates a high dot-product score.
2. **The Softmax Filter:** The Softmax function turns these scores into a probability distribution. If the model is "sure" about a relationship, you will see one bar dominate the **Next Token Prediction** chart.
3. **Residual Connections:** Notice the "Layer Flow & Residuals" panel. We don't just transform $X$; we add the transformation *back* to the original $X$.
   $$X_{new} = X + \text{Attention}(X)$$
   This ensures that the model doesn't "forget" the original word while it's busy calculating the context.
</div>
