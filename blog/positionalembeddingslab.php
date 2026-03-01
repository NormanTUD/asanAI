<?php include_once("functions.php"); ?>

<div class="smart-quote" data-cite="vaswani2017attention" data-page=6>
Since our model contains no recurrence and no convolution, in order for the model to make use of the
order of the sequence, we must inject some information about the relative or absolute position of the
tokens in the sequence. To this end, we add "positional encodings" to the input embeddings at the
bottoms of the encoder and decoder stacks. The positional encodings have the same dimension $d_\text{model}$
as the embeddings, so that the two can be summed.
</div>

<div class="md">
In a Transformer, words are processed in parallel. Without **Positional Encoding (PE)**, the model would treat the sentence *"The dog bit the man"* exactly the same as *"The man bit the dog"* (and also the same as *"dog the The man bit"* and all other combinations of these words).

To fix this, we **add** a unique mathematical "signature" to each word's vector based on its position ($\text{pos}$). 

## Sine and Cosine

Imagine a circle with radius $1$ centered at the origin (the **unit circle**). Pick a point on it by sweeping an angle $\theta$ counter-clockwise from the right. The coordinates of that point are:

$$(\cos\theta,\;\sin\theta)$$

That's it: $\cos\theta$ is the horizontal position, $\sin\theta$ is the vertical position. They convert an **angle** into **coordinates**.

**A note on angles:** We measure $\theta$ in **radians**, not degrees. One full circle is $2\pi$ radians (about $6.28$), so $\pi$ radians $= 180°$. Radians are simply the arc length on a unit circle for a given angle, which makes many formulas cleaner.
</div>

<!-- ─── Interactive: Unit Circle ─── -->
<div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin: 20px 0;">
    <p style="color:#64748b; font-size:0.9em;">Drag the angle and watch the point move on the unit circle. Its $x$-coordinate is $\cos\theta$ (<span style="color:#2563eb;font-weight:bold;">blue</span>) and its $y$-coordinate is $\sin\theta$ (<span style="color:#ef4444;font-weight:bold;">red</span>).</p>

    <div style="margin-bottom:10px;">
        <strong>Angle $\theta$:</strong>
        <input type="range" id="slider-sc-theta" min="0" max="6.2832" step="0.01" value="0.78" style="width:300px;">
        <span id="disp-sc-theta" style="font-family:monospace; font-weight:bold; color:#2563eb;">0.78</span> rad
        (<span id="disp-sc-deg" style="font-family:monospace;">44.7°</span>)
    </div>

    <div id="sc-equation-display" style="text-align:center; font-size:1.2em; margin:10px 0; background:#f8fafc; padding:10px; border-radius:6px; min-height:50px;"></div>

    <div id="plot-unit-circle" class="plot-container" style="width:100%; height:450px;"></div>
</div>

<div class="optional md" data-headline="History and Etymology of Sine and Cosine">
The concept originates in ancient Indian astronomy. Indian Astronomer \citeauthor{indianastronomer} (476-550 CE) used the Sanskrit *jyā* ("bowstring") to describe the half-chord of a circle, which is exactly what sine measures geometrically. He needed it to compute planetary positions and predict eclipses in his treatise *\citetitle{indianastronomer}* (\citetitle{indianastronomer}, ch. 1-2). Arab scholars later transliterated this as *jiba*, which, due to the lack of vowels in written Arabic, was misread as *jayb* ("pocket" or "fold"). See the paper \citetitle{indianastronomerconstruction} if you want to know how \citeauthor{indianastronomer} constructed his tables.

In \citeyear{chester1145}, \citeauthor{chester1145}, who also produced the first Latin translation of \citealternativetitle{alkwarizma}'s foundational work on algebra that also inspired the term *algebra* (from 'Al-Jabr'; his personal name also inspired the term *algorithm*), translated *jayb* into the Latin ***sinus*** ("curve," "bay," or "fold").

**Cosine** ("complement's sine") was later coined by \citeauthor{gunter1620} in his \citeyear{gunter1620} work \citetitle{gunter1620}. It describes the sine of the complementary angle:

$$\sin(\theta) = \cos(90^\circ - \theta)$$

$$\cos(\theta) = \sin\!\left(\tfrac{\pi}{2} - \theta\right)$$
</div>

<div class="md">
### Key Properties of Sine and Cosine

**Periodicity:** Both repeat every $2\pi$: $\sin(\theta + 2\pi) = \sin\theta$

**Pythagorean Identity:** $\sin^2\theta + \cos^2\theta = 1$ (the point always lies on the unit circle)

**Symmetry:** $\sin$ is odd, $\cos$ is even: $\sin(-\theta) = -\sin\theta$, $\cos(-\theta) = \cos\theta$

**Bounded:** Both always stay between $-1$ and $1$

**Derivatives:** $\frac{d}{d\theta}\sin\theta = \cos\theta$, $\frac{d}{d\theta}\cos\theta = -\sin\theta$

Transformers process all words at once, so they need a way to encode each word's **position**. The original Transformer paper (\citetitle{vaswani2017attention}) uses sine and cosine to create a unique positional fingerprint:

$$PE_{(\text{pos}, 2i)} = \sin\!\left(\frac{\text{pos}}{10000^{2i/d}}\right), \qquad PE_{(\text{pos}, 2i+1)} = \cos\!\left(\frac{\text{pos}}{10000^{2i/d}}\right)$$

This gives each position a distinct pattern the model can learn to interpret.
</div>

<!-- ─── Interactive: Sine & Cosine Waves ─── -->
<div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin: 20px 0;">
    <p style="color:#64748b; font-size:0.9em;">See how amplitude $A$, frequency $\omega$, and phase shift $\varphi$ change the wave: $f(\theta) = A \sin(\omega\theta + \varphi)$.</p>

    <div style="display:flex; flex-wrap:wrap; gap:20px; margin-bottom:10px;">
        <div>
            <strong>Amplitude $A$:</strong> <span id="disp-wave-amp" style="font-family:monospace; font-weight:bold;">1.0</span><br>
            <input type="range" id="slider-wave-amp" min="0.1" max="3" step="0.1" value="1.0" style="width:180px;">
        </div>
        <div>
            <strong>Frequency $\omega$:</strong> <span id="disp-wave-freq" style="font-family:monospace; font-weight:bold;">1.0</span><br>
            <input type="range" id="slider-wave-freq" min="0.1" max="5" step="0.1" value="1.0" style="width:180px;">
        </div>
        <div>
            <strong>Phase $\varphi$:</strong> <span id="disp-wave-phase" style="font-family:monospace; font-weight:bold;">0.0</span><br>
            <input type="range" id="slider-wave-phase" min="0" max="6.28" step="0.05" value="0" style="width:180px;">
        </div>
    </div>

    <div id="wave-formula" style="text-align:center; font-size:1.1em; margin:10px 0; background:#f8fafc; padding:10px; border-radius:6px; min-height:40px;"></div>

    <div id="plot-sincos-wave" class="plot-container" style="width:100%; height:350px;"></div>
</div>

<div class="md">
* **Boundedness:** Values stay between $[-1, 1]$, so they don't "overpower" the original word meaning.
* **Relative Distance:** The model can learn that words are 2 or 3 spots apart because the waves change predictably.

## Concrete Example: Nudging the "King"
In our Lab, the word **"king"** is represented by the vector:
$$\text{king} = [1.688, -0.454, 0, 0]$$

When "king" is at **Position 1**, we calculate a PE vector and add it. This "nudges" the king's position in 4D space.
$$\text{king}_\text{final} = \begin{pmatrix} 1.688 \\ -0.454 \\ 0 \\ 0 \end{pmatrix} + \begin{pmatrix} \text{PE}_{\text{pos}1, \text{dim}0} \\ \text{PE}_{\text{pos}1, \text{dim}1} \\ \text{PE}_{\text{pos}1, \text{dim}2} \\ \text{PE}_{\text{pos}1, \text{dim}3} \end{pmatrix}$$
</div>

<div style="margin-bottom: 20px; font-family: sans-serif;">
    <strong>Move "king" to a different position:</strong> 
    <input type="range" id="pe-len" min="0" max="10" value="1" oninput="PositionalLab.update(this.value)">
    <span id="pe-val">Position 1</span>
</div>

<div id="pe-chart" style="width:100%; height:350px; margin-bottom: 20px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0;"></div>

<div id="pe-viz-container" style="overflow-x: auto; background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 10px;"></div>

<div class="md">
### Why do some lines seem straight?

You might notice that **Dim 0** and **Dim 1** wiggle quickly, while **Dim 2** and **Dim 3** look like nearly straight lines. This is intentional:

* **Frequency Scaling:** Each pair of dimensions uses a different frequency. The "speed" of the wave is determined by the divisor $10000^{2i/d_\text{model}}$, which is the dimensions Frequency $\omega$.
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

<div class="md">
## The Repetition Starburst: One Word, Many Positions

What happens when you repeat the same word hundreds of times in a sequence? The **semantic embedding** is identical every time — but the **positional encoding** nudges each copy to a slightly different point in space.

The plot below places the **raw embedding** of "king" (with no positional encoding) at the center. From it, **hundreds of lines** radiate outward to the final embedding of "king" at each position (0 through 199). The result is a starburst that reveals the geometry of positional encoding itself:

- **Short lines** mean the PE at that position barely moved the vector.
- **The pattern of directions** shows how the sine/cosine waves systematically sweep the word through embedding space.
- **No two endpoints are the same** — every position is unique, even though the word is identical.
</div>

<div id="repetition-starburst" style="width:100%; height:600px; margin: 20px 0; background:#fff; border-radius:8px; border:1px solid #e2e8f0;"></div>

<div class="md">
## Positional Encoding Creates a Group Structure

We've shown that a position shift by a fixed offset $k$ corresponds to multiplying by a rotation matrix $M_k$. But these matrices aren't just a convenient trick, they form a **mathematical group**, and that algebraic fact is the deepest reason sinusoidal PE works so well.

### What Is a Group?

A **group** is one of the most fundamental structures in all of mathematics: the formal language of *symmetry*. It is a set $G$ equipped with a single combining operation "$\cdot$" that satisfies exactly four axioms:

| Axiom | Statement | PE Rotation Example |
|---|---|---|
| **Closure** | If $a, b \in G$ then $a \cdot b \in G$ | $M_3 \cdot M_5 = M_8$, still a valid offset matrix |
| **Associativity** | $(a \cdot b) \cdot c = a \cdot (b \cdot c)$ | $(M_2 \cdot M_3) \cdot M_4 = M_2 \cdot (M_3 \cdot M_4) = M_9$ |
| **Identity** | $\exists\; e$ such that $e \cdot a = a \cdot e = a$ | $M_0 = I$, zero offset changes nothing |
| **Inverse** | $\forall\; a$, $\exists\; a^{-1}$ with $a \cdot a^{-1} = e$ | $M_k \cdot M_{-k} = M_0 = I$, every shift is reversible |

The simplest everyday example is **clock arithmetic**: the 12 hours form a group under addition mod 12. Going forward 5 hours then 9 hours is the same as going forward 2 hours ($5+9=14\equiv2\pmod{12}$). The identity is $+0$ hours, and the inverse of $+5$ is $+7$ (since $5+7\equiv0$). The first interactive below lets you explore this directly.

\citeauthor{galoisgroup} introduced the concept of a group to decode the hidden structural properties of algebraic equations. His primary objective was to determine why equations of the fifth degree and higher lack general solutions involving radicals (roots). He discovered that an equation is solvable by radicals if and only if the **symmetry group of its roots**, now known as the Galois group, possesses a specific internal architecture, categorized today as a **solvable group**.

### The PE Rotation Group

Recall the rotation matrix for each sine-cosine pair at frequency $\omega$:

$$M_k = \begin{pmatrix} \cos(k\omega) & \sin(k\omega) \\ -\sin(k\omega) & \cos(k\omega) \end{pmatrix}$$

The set $\{M_k : k \in \mathbb{R}\}$ satisfies all four axioms, it is the **circle group** $SO(2)$, the group of all 2D rotations. Since a full PE vector is a stack of independent sine-cosine pairs at different frequencies, the complete positional encoding lives in a **product of circle groups, a torus**, the same manifold we visualised as a helix above.

### Why the Group Structure Matters for Attention

1. **"3 apart" is always the same $M_3$**, whether you start at position 2 or position 2000.
2. **Compositions compose predictably**: "3 forward, then 5 forward" equals "8 forward" ($M_3 \cdot M_5 = M_8$).
3. **Reversibility**: the model can ask "what was 3 positions *before* me?" via $M_{-3}$.

The attention mechanism learns these rotations through its $Q$ and $K$ linear projections. The group structure guarantees that once the model learns the "shape" of an offset, it **generalises to every position in the sequence for free**. No special circuitry, no lookup tables, just linear algebra riding on top of algebraic symmetry.

**The aha-moment:** Positional encoding doesn't just *label* positions, it gives the model an **algebraic compass** that works identically everywhere in the sequence.
</div>

<!-- ── Group Axioms Interactive ── -->
<div style="margin: 20px 0; font-family: sans-serif;">
    <strong>Explore: Group Axioms on a Clock (ℤ₁₂)</strong>
    <div style="display:flex; gap:16px; flex-wrap:wrap; margin-top:8px;">
        <div>
            <label><b>Element a:</b></label>
            <input type="range" id="group-a-slider" min="0" max="11" value="3" style="width:130px;vertical-align:middle;">
            <span id="group-a-label" style="font-weight:bold;">3</span>
        </div>
        <div>
            <label><b>Element b:</b></label>
            <input type="range" id="group-b-slider" min="0" max="11" value="5" style="width:130px;vertical-align:middle;">
            <span id="group-b-label" style="font-weight:bold;">5</span>
        </div>
    </div>
</div>
<div id="group-axioms-chart" style="width:100%; height:460px; background:#fff; border-radius:8px; border:1px solid #e2e8f0;"></div>

<div class="md">
### Reading the Compass Plot

Each **filled dot** is a starting position on the unit circle (determined by its PE angle $\text{pos}\cdot\omega_0$). Each **open dot** is the result after applying $M_k$. The arrow between them is *the same rotation* in every case, the arrow length and arc angle never change, only the starting point moves. This is exactly the translation-invariance that lets a Transformer generalise "3 tokens apart" to any location it has never seen.
</div>

<!-- ── Cayley Table ── -->
<div style="margin: 24px 0 8px; font-family: sans-serif;">
    <strong class="md">\cite[Cayley Table]{caleygroups} (Group Multiplication Table for ℤ₁₂)</strong>
</div>
<div id="group-cayley-chart" style="width:100%; max-width:600px; height:520px; background:#fff; border-radius:8px; border:1px solid #e2e8f0;"></div>

<div class="md">
### Reading the Caley Table

The heatmap shows every possible composition $M_i \cdot M_j = M_{(i+j)\bmod 12}$. Notice the **diagonal stripe pattern**: each row is just the previous row shifted one step to the left. That perfect regularity *is* the group structure, it means the combining rule is completely uniform, with no exceptions or special cases. Hover over any cell to see the composition.
</div>
