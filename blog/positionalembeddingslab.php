<?php include_once("functions.php"); ?>

<div class="smart-quote" data-cite="vaswani2017attention" data-page=6>
Since our model contains no recurrence and no convolution, in order for the model to make use of the
order of the sequence, we must inject some information about the relative or absolute position of the
tokens in the sequence. To this end, we add "positional encodings" to the input embeddings at the
bottoms of the encoder and decoder stacks. The positional encodings have the same dimension $d_\text{model}$
as the embeddings, so that the two can be summed.
</div>

<div class="md">
In a Transformer, words are processed in parallel. Without **Positional Encoding (PE)**, the model would treat the sentence *"The dog bit the man"* exactly the same as *"The man bit the dog"*. The semantic vectors alone don't know who is doing the biting.

To fix this, we **add** a unique mathematical "signature" to each word's vector based on its position ($\text{pos}$). 

## Concrete Example: Nudging the "King"
In our Lab, the word **"king"** is represented by the vector:
$$\text{king} = [1.688, -0.454, 0, 0]$$

When "king" is at **Position 1**, we calculate a PE vector and add it. This "nudges" the king's position in 4D space.
$$\text{king}_\text{final} = \begin{pmatrix} 1.688 \\ -0.454 \\ 0 \\ 0 \end{pmatrix} + \begin{pmatrix} \text{PE}_{\text{pos}1, \text{dim}0} \\ \text{PE}_{\text{pos}1, \text{dim}1} \\ \text{PE}_{\text{pos}1, \text{dim}2} \\ \text{PE}_{\text{pos}1, \text{dim}3} \end{pmatrix}$$

### How the Waves work
We use sine and cosine functions of different frequencies to ensure every position is unique (with $i$ being the position and $d_\text{model}$ being the dimensionality of the embedding space):

$$\text{PE}_{(\text{pos}, 2i)} = \sin\left(\frac{\text{pos}}{10000^{2i/d_\text{model}}}\right)$$
$$\text{PE}_{(\text{pos}, 2i+1)} = \cos\left(\frac{\text{pos}}{10000^{2i/d_\text{model}}}\right)$$

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
### Why are some lines straight?

You might notice that **Dim 0** and **Dim 1** wiggle quickly, while **Dim 2** and **Dim 3** look like nearly straight lines. This is intentional:

* **Frequency Scaling:** Each pair of dimensions uses a different frequency. The "speed" of the wave is determined by the divisor $10000^{2i/d_\text{model}}$.
* **The "Slow" Dimensions:** For a small $d_\text{model}$ like 4, the second pair of dimensions (indices 2 and 3) has a much larger divisor, making the wave stretch out over thousands of positions.
* **The Purpose:** The fast waves help the model distinguish between immediate neighbors, while the slow waves act like a "slow clock," helping the model track position across very long sequences.

If you were to expand the slider to **Position 1000**, you would see those straight lines finally start to curve into waves!

### The Geometry of Certainty

When you look at the **Semantic Embedding Space** plot in the panel below, you are seeing a 2D projection of a 4D world.

1. **Alignment:** When the **Query** of "wise" aligns with the **Key** of "king," their vectors point in the same direction. This creates a high dot-product score.
2. **The Softmax Filter:** The Softmax function turns these scores into a probability distribution. If the model is "sure" about a relationship, you will see one bar dominate the **Next Token Prediction** chart.
3. **Residual Connections:** Notice the "Layer Flow & Residuals" panel. We don't just transform $X$; we add the transformation *back* to the original $X$.
   $$X_\text{new} = X + \text{Attention}(X)$$
   This ensures that the model doesn't "forget" the original word while it's busy calculating the context.

### The Invention of the Transformer & Positional Encoding
The challenge of processing text in parallel (instead of word-by-word like older RNNs) required a new way to inject "time" or "order" into the model.

* **The "\citetitle{vaswani2017attention}" Paper (\citeyear{vaswani2017attention}):** This landmark work by Vaswani et al. replaced sequential processing with the Transformer architecture. Since Transformers have no inherent sense of order, the authors introduced **Sinusoidal Positional Encodings**.
* **Why Waves?** The researchers chose alternating sine and cosine functions because they allow the model to attend to relative positions. The different frequencies, ranging from "fast" wiggles to "slow" curves, act like a multi-scale clock, marking every position in a sequence with a unique, bounded mathematical signature.
* **Residual Connections (X + Attention):** The idea of "Residual Connections" ($X_{new} = X + f(X)$) used in the Transformer was actually pioneered earlier by **Kaiming He et al. (\citeyear{he2015resnet})** in the **ResNet** architecture for computer vision. The Transformer team adapted this to ensure that gradients could flow through dozens of layers without the model "forgetting" the original input tokens.
</div>
