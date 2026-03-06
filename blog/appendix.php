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

<div class="md">
## The Interference Pattern of Layers: Wave Geometry

Information doesn't flow through a transformer in a smooth, monotonic stream. It **pulses**. If you track the activation patterns of a hidden state as it passes through all layers of a model — from layer 0 to layer 96 — you see something that looks less like a pipeline and more like a **wave**: expansion, compression, expansion, compression, in a rhythmic cycle that resembles a beating mechanical heart.

### The Three Phases

Researchers have observed that transformer layers tend to organize into three broad phases:

1. **Expansion (Early Layers):** The input embedding is "opened up." The model broadens the representation, activating many dimensions, exploring many possible interpretations of the input. The activation vector becomes **wide and diffuse** — high entropy, low certainty. This is the model asking: "What could this input mean?"

2. **Compression (Middle Layers):** The representation suddenly **contracts**. The model narrows down, suppressing irrelevant dimensions, sharpening the signal. This is the "logic check" — the phase where the model commits to an interpretation, resolves ambiguities, and performs the core reasoning. The activation vector becomes **tight and focused** — low entropy, high certainty.

3. **Re-expansion (Late Layers):** The representation opens up again, but differently. Now the model is preparing to **generate output** — it needs to fan out from a single sharp interpretation into a probability distribution over the entire vocabulary. The vector broadens again, but this time in a structured way that maps onto token probabilities.

### The Heartbeat Analogy

This expansion-compression-expansion cycle is strikingly similar to a **heartbeat**: diastole (expansion, filling with possibilities), systole (compression, pumping a decision), diastole again (expansion, distributing the result). When visualized as a waveform across layers, it literally looks like a cardiac rhythm — a **mechanical heart made of data**.

The wave pattern is not a single pulse. In deep models (96+ layers), you often see **multiple cycles** — the model performs several rounds of expansion and compression, like a heart beating multiple times per inference. Each cycle refines the representation further, and the interference between cycles creates complex patterns reminiscent of wave interference in physics [[3]] [[4]].

$$ \text{Activation Width}(l) \approx A_0 + \sum_{k=1}^{K} A_k \cdot \cos\left(\frac{2\pi k \cdot l}{L} + \phi_k\right) $$

where $l$ is the layer index, $L$ is the total number of layers, and $K$ is the number of harmonic cycles. The activation width oscillates as a superposition of harmonics — literally a wave equation applied to neural network depth.

Below, you can explore this interactively. A simulated transformer processes a token through all its layers. The **wave visualization** shows the activation width (number of strongly active dimensions) at each layer. Watch the heartbeat pattern emerge. Adjust the **model depth**, **number of cycles**, and **input complexity** to see how the wave pattern changes.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="display: grid; grid-template-columns: 1fr 260px; gap: 20px; align-items: start; margin-bottom: 15px;">
        <div>
            <div style="font-family: sans-serif; font-size: 0.8em; color: #64748b; text-align: center; margin-bottom: 4px; font-weight: bold;">Activation Wave Across Layers</div>
            <canvas id="canvas-layer-wave" style="width: 100%; height: 520px; background: #0f172a; border-radius: 8px; border: 1px solid #1e293b;"></canvas>
        </div>
        <div id="wave-info-panel" style="background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; font-family: sans-serif; font-size: 0.85em; color: #475569; line-height: 1.7; max-height: 520px; overflow-y: auto;">
            <div style="font-weight: bold; font-size: 1em; color: #1e293b; margin-bottom: 8px;">💓 Layer Heartbeat</div>
            <div id="wave-phase-info">
                The activation pattern pulses through expansion, compression, and re-expansion phases — like a beating heart made of data.
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 10px 0;">
            <div style="font-weight: bold; font-size: 0.9em; color: #1e293b; margin-bottom: 6px;">📊 Current Layer</div>
            <div id="wave-layer-detail"></div>
        </div>
    </div>

    <!-- Controls -->
    <div style="display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>Scan Layer:</b>
            <input type="range" id="wave-scan-layer" min="0" max="95" step="1" value="0" style="width: 220px; vertical-align: middle;">
            <span id="wave-scan-val" style="font-weight: bold; color: #8b5cf6;">0 / 95</span>
        </label>
    </div>

    <div style="display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569;">
            <b>Depth:</b>
            <input type="range" id="wave-depth" min="12" max="128" step="4" value="96" style="width: 140px; vertical-align: middle;">
            <span id="wave-depth-val" style="font-weight: bold; color: #3b82f6;">96</span>
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569;">
            <b>Cycles:</b>
            <input type="range" id="wave-cycles" min="1" max="5" step="0.5" value="2.5" style="width: 140px; vertical-align: middle;">
            <span id="wave-cycles-val" style="font-weight: bold; color: #f59e0b;">2.5</span>
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569;">
            <b>Complexity:</b>
            <input type="range" id="wave-complexity" min="0.2" max="1.0" step="0.05" value="0.7" style="width: 140px; vertical-align: middle;">
            <span id="wave-complexity-val" style="font-weight: bold; color: #10b981;">0.70</span>
        </label>
    </div>

    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <span style="font-family: sans-serif; font-size: 0.9em; color: #475569; font-weight: bold;">Input:</span>
        <button onclick="loadWaveInput('simple')" class="wave-input-btn" id="wi-simple" style="background: #8b5cf6; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">📝 Simple Fact</button>
        <button onclick="loadWaveInput('reasoning')" class="wave-input-btn" id="wi-reasoning" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">🧠 Reasoning</button>
        <button onclick="loadWaveInput('creative')" class="wave-input-btn" id="wi-creative" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">🎨 Creative</button>
        <button onclick="loadWaveInput('ambiguous')" class="wave-input-btn" id="wi-ambiguous" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">🔀 Ambiguous</button>
    </div>

    <div style="display: flex; gap: 16px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="wave-show-phases" checked onchange="renderLayerWave()"> Phase regions
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="wave-show-harmonics" onchange="renderLayerWave()"> Show harmonics
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="wave-show-heatmap" checked onchange="renderLayerWave()"> Dimension heatmap
        </label>
        <button onclick="animateWaveScan()" id="wave-animate-btn" style="background: #10b981; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">▶ Scan</button>
    </div>

    <!-- Stats -->
    <div id="wave-stats" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; max-width: 800px; margin: 0 auto 15px auto;"></div>

    <!-- Description -->
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>What you're seeing:</b> The <b>top section</b> shows a <b>dimension heatmap</b> — each column is a layer,
        each row is a dimension of the hidden state. Bright pixels = strongly active dimensions.
        The <b>wave curve</b> below it traces the <b>activation width</b> (how many dimensions are strongly active) at each layer.
        <span style="color:#3b82f6;">Blue regions</span> = <b>expansion</b> (broad, exploratory).
        <span style="color:#ef4444;">Red regions</span> = <b>compression</b> (narrow, decisive).
        <span style="color:#10b981;">Green regions</span> = <b>re-expansion</b> (output preparation).
        The <span style="color:#f59e0b; font-weight:bold;">golden scan line</span> shows the currently inspected layer.
        Use <b>▶ Scan</b> to watch the pulse travel through the network in real time.
    </div>
</section>
