<?php include_once("functions.php"); ?>

<div class="md">
In a Transformer, words are processed in parallel. Without **Positional Encoding (PE)**, the model would treat the sentence *"The dog bit the man"* exactly the same as *"The man bit the dog"*. The semantic vectors alone don't know who is doing the biting.

To fix this, we **add** a unique mathematical "signature" to each word's vector based on its position ($\text{pos}$). 

### Concrete Example: Nudging the "King"
In our Lab, the word **"king"** is represented by the vector:
$$\text{king} = [1.688, -0.454, 0, 0]$$

When "king" is at **Position 1**, we calculate a PE vector and add it. This "nudges" the king's position in 4D space.
$$\text{king}_\text{final} = \begin{pmatrix} 1.688 \\ -0.454 \\ 0 \\ 0 \end{pmatrix} + \begin{pmatrix} \text{PE}_{pos1, dim0} \\ \text{PE}_{pos1, dim1} \\ \text{PE}_{pos1, dim2} \\ \text{PE}_{pos1, dim3} \end{pmatrix}$$

### How the Waves work
We use sine and cosine functions of different frequencies to ensure every position is unique:

$$PE_{(\text{pos}, 2i)} = \sin\left(\frac{\text{pos}}{10000^{2i/d_\text{model}}}\right)$$
$$PE_{(\text{pos}, 2i+1)} = \cos\left(\frac{\text{pos}}{10000^{2i/d_\text{model}}}\right)$$

* **Boundedness:** Values stay between $[-1, 1]$, so they don't "overpower" the original word meaning.
* **Relative Distance:** The model can learn that words are 2 or 3 spots apart because the waves change predictably.
</div>

<div style="margin-bottom: 20px; font-family: sans-serif;">
    <strong>Move "king" to a different position:</strong> 
    <input type="range" id="pe-len" min="0" max="10" value="1" oninput="PositionalLab.update(this.value)">
    <span id="pe-val">Position 1</span>
</div>

<div id="pe-chart" style="width:100%; height:350px; margin-bottom: 20px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0;"></div>

<div id="pe-viz-container" style="overflow-x: auto; background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 10px;"></div>

<div class="md">
### The Geometry of Certainty

When you look at the **Semantic Embedding Space** plot in the panel below, you are seeing a 2D projection of a 4D world.

1. **Alignment:** When the **Query** of "wise" aligns with the **Key** of "king," their vectors point in the same direction. This creates a high dot-product score.
2. **The Softmax Filter:** The Softmax function turns these scores into a probability distribution. If the model is "sure" about a relationship, you will see one bar dominate the **Next Token Prediction** chart.
3. **Residual Connections:** Notice the "Layer Flow & Residuals" panel. We don't just transform $X$; we add the transformation *back* to the original $X$.
   $$X_{new} = X + \text{Attention}(X)$$
   This ensures that the model doesn't "forget" the original word while it's busy calculating the context.
</div>
