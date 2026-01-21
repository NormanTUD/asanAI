<?php include_once("functions.php"); ?>

<div class="md">
# Understanding Positional Embeddings

In a Transformer, words are processed in parallel. Without **Positional Encoding (PE)**, the model would treat the sentence *"The dog bit the man"* exactly the same as *"The man bit the dog."*

To fix this, we add a unique mathematical "signature" to each word's vector based on its position ($pos$). We use sine and cosine functions of different frequencies:

$$PE_{(pos, 2i)} = \sin\left(\frac{pos}{10000^{2i/d_{model}}}\right)$$
$$PE_{(pos, 2i+1)} = \cos\left(\frac{pos}{10000^{2i/d_{model}}}\right)$$

### Why this works:
* **Boundedness:** Every value stays between $[-1, 1]$.
* **Unique Signatures:** Each position gets a unique combination of values across dimensions.
* **Relative Distance:** The model can learn that certain positions are a fixed distance apart because of trigonometric identities.


</div>

<div style="margin-bottom: 20px; font-family: sans-serif;">
    <strong>Adjust Sequence Length:</strong> 
    <input type="range" id="pe-len" min="1" max="20" value="5" oninput="PositionalLab.update(this.value)">
    <span id="pe-val">5</span> tokens
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
