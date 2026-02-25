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

* **The "\citetitle{vaswani2017attention}" Paper:** This landmark work by Vaswani et al. replaced sequential processing with the Transformer architecture. Since Transformers have no inherent sense of order, the authors introduced **Sinusoidal Positional Encodings**.
* **Why Waves?** The researchers chose alternating sine and cosine functions because they allow the model to attend to relative positions. The different frequencies, ranging from "fast" wiggles to "slow" curves, act like a multi-scale clock, marking every position in a sequence with a unique, bounded mathematical signature.
* **Residual Connections (X + Attention):** The idea of "Residual Connections" ($X_{new} = X + f(X)$) used in the Transformer was actually pioneered earlier by **\cite[Kaiming He et al.]{he2015resnet}** in the **\cite[ResNet]{he2015resnet}** architecture for computer vision. The Transformer team adapted this to ensure that gradients could flow through dozens of layers without the model "forgetting" the original input tokens.

## Why Sinusoidal Positional Encodings Work: A Fourier Perspective

Each dimension pair $(2i, 2i+1)$ in the positional encoding is a **sine cosine pair at a specific frequency**, exactly one term in a Fourier series:

$$\text{PE}_{(\text{pos}, 2i)} = \sin\left(\frac{\text{pos}}{10000^{2i/d_\text{model}}}\right), \quad \text{PE}_{(\text{pos}, 2i+1)} = \cos\left(\frac{\text{pos}}{10000^{2i/d_\text{model}}}\right)$$

Instead of *decomposing* a signal into frequencies (analysis), the encoding **constructs a unique vector per position** by sampling across a bank of geometrically spaced frequencies (synthesis). Each position gets a unique spectral fingerprint.

### Why Sine and Cosine Specifically?

**Shift = Rotation.** The angle addition identities give us:

$$\text{PE}(\text{pos} + k) = M_k \cdot \text{PE}(\text{pos}), \quad M_k = \begin{pmatrix} \cos(k\omega) & \sin(k\omega) \\ -\sin(k\omega) & \cos(k\omega) \end{pmatrix}$$

A fixed offset $k$ is a **fixed rotation matrix** independent of $\text{pos}$. The model can learn relative distances via simple linear operations. This is the same reason Fourier bases dominate signal processing: time shifts become phase rotations in frequency space.

**Orthogonality.** Different frequency components are orthogonal, so each dimension encodes **independent** positional information with zero redundancy.

### The Binary Clock Analogy

The encoding is a **smooth, continuous version of binary counting**:

- **Dim 0, 1** (high freq) flips fast like the least significant bit
- **Dim 2, 3** (low freq) barely moves like the most significant bit

Fast waves distinguish neighbors; slow waves track long range position. Together, every position maps to a unique point on a high dimensional torus (product of circles).
</div>

<div id="pe-fourier-demo"></div>

<div class="md">
## Positional Encoding Creates a Manifold, Not Just Labels

The wave plots above show each dimension's projection individually, flat curves on a screen. But the PE formula actually maps each position to a point on a **high-dimensional helix**. The visualization below reconstructs this by plotting the first three PE dimensions as 3D coordinates:

- **Dims 0, 1** (fastest sin/cos pair) trace a **circle**, the cross-section of the helix
- **Dim 2** (next slower frequency) provides **axial drift**, stretching the circle into a helix

### What to look for

**Adjacent positions are close together.** Neighboring points sit right next to each other on the curve. The model does not memorize "position 5 is special", nearness is encoded geometrically.

**Translational symmetry.** The **blue segment** (pos 5 to 8) and the **red segment** (pos 105 to 108) have the **same length and direction**. A fixed offset $k$ corresponds to a fixed rotation matrix $M_k$ independent of absolute position, just like a clock face lets you compute "3 hours from now" regardless of what time it currently is.

**Generalization to unseen lengths.** Because the geometry of "nearby" vs "far away" is baked into the encoding rather than memorized, Transformers can generalize to sequence lengths they were never trained on.

**Try rotating the 3D plot**, from directly above you will see the circular cross-section (Dims 0, 1). From the side you will see the axial drift (Dim 2). The two colored segments always subtend the same arc.
</div>

<div id="helix-manifold" style="width:100%; height:500px; margin: 20px 0; background:#fff; border-radius:8px; border:1px solid #e2e8f0;"></div>
