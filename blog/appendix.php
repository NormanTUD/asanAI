<?php include_once("functions.php"); ?>

<div class="md">
## Training
### Grokking

**\cite[Grokking]{grokking}** is a phenomenon in deep learning where a model suddenly transitions from **memorization** to **generalization** long after it seems to have plateaued.
Originally identified by **Power et al. (2022)**, this "aha moment" occurs when a model achieves 100% training accuracy but 0% validation accuracy for an extended period,
only to have validation accuracy jump to 100% within a few epochs. This indicates a shift from high-frequency noise-fitting to the discovery of an underlying algorithmic pattern.
Structurally, this is often marked by a transition in **attention matrices** from messy, uniform distributions to clean, highly structured representations.

## Math

### How are Sine and Cosine calculated?

Computers evaluate sine and cosine using **Taylor Series** (infinite polynomial approximations):

$$\sin\theta = \theta - \frac{\theta^3}{3!} + \frac{\theta^5}{5!} - \frac{\theta^7}{7!} + \dots \qquad \cos\theta = 1 - \frac{\theta^2}{2!} + \frac{\theta^4}{4!} - \frac{\theta^6}{6!} + \dots$$

The more terms you include, the better the approximation. You can explore this below.

</div>
<!-- ─── Interactive: Taylor Series Approximation ─── -->
<div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin: 20px 0;">
    <p style="color:#64748b; font-size:0.9em;">Increase the number of terms to see how the polynomial converges to the true $\sin$ curve. With just 5 terms, the match is nearly perfect over $[-2\pi, 2\pi]$!</p>

    <div style="margin-bottom:10px;">
        <strong>Number of Taylor terms $N$:</strong>
        <input type="range" id="slider-taylor-n" min="1" max="10" step="1" value="1" style="width:250px;">
        <span id="disp-taylor-n" style="font-family:monospace; font-weight:bold; color:#2563eb;">1</span>
    </div>

    <div id="taylor-formula" style="text-align:center; font-size:1.1em; margin:10px 0; background:#f8fafc; padding:10px; border-radius:6px; min-height:40px; overflow-x:auto; white-space:nowrap;"></div>

    <div id="plot-taylor" class="plot-container" style="width:100%; height:350px;"></div>
</div>

<div class="md">
## Positional Embeddings Creates a Group Structure

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
