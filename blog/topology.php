<?php include_once("functions.php"); ?>

<div class="md">
## Topology and the Geometry of Thought

In an LLM, words and concepts are mapped to high-dimensional vectors. However, these vectors don't fill the space uniformly. They tend to lie on a **Manifold** — a lower-dimensional surface embedded in the high-dimensional space. Understanding the *shape* of this manifold — its holes, its twists, its branches — is the domain of **topology**.

### What Is Topology?

Topology is the branch of mathematics that studies properties of shapes that are preserved under continuous deformation — stretching, bending, twisting — but **not** tearing or gluing. A coffee mug and a donut are topologically identical (both have exactly one hole); a sphere and a donut are not. While geometry asks *"how far apart are these two points?"*, topology asks *"are these two regions connected? Is there a hole between them? Can I smoothly deform one structure into the other?"*

Formally, two spaces are **homeomorphic** (topologically equivalent) if there exists a continuous bijection between them whose inverse is also continuous. This means:

$$ X \cong Y \iff \exists\, f: X \to Y \text{ continuous, bijective, with } f^{-1} \text{ continuous} $$

### Why Does Topology Matter for AI?

The reason topology matters for understanding LLMs is that the **semantic manifold** — the surface on which meaningful token representations live — has rich topological structure. This structure directly affects what the model can and cannot represent:

1. **Connectivity and Clustering:** Topology tells us whether two concept regions are connected (reachable from each other via smooth interpolation) or separated by a void. If "science" and "pseudoscience" live on disconnected components of the manifold, the model treats them as categorically different; if they're connected, there's a smooth gradient between them.

2. **Holes as Impossibilities:** As explored in the \cite[Persistent Homology]{persistenthomology} section of the embedding space, topological holes represent regions where **no coherent concept exists** — logical contradictions, semantic voids, the "unsayable." These holes are not bugs; they are the negative imprint of the model's world-knowledge.

3. **Attention as Navigation:** The \cite[attention mechanism]{vaswani2017attention} can be understood as a tool for navigating the manifold's topology — finding which regions are "nearby" in the model's learned geometry, even if they appear distant in raw Euclidean space.

4. **Feature Extraction via Persistent Homology:** By computing the \cite[persistent homology]{persistenthomology} of activation patterns, researchers can determine whether a model has learned genuine topological structure (robust loops, clusters, cavities) or is merely memorizing surface-level correlations. Features with high **persistence** — topological signatures that survive across a wide range of scales — correspond to robust, generalizable knowledge.

### Topological Invariants in Practice

The key topological invariants used in AI research are the **Betti numbers** $\beta_0, \beta_1, \beta_2, \ldots$:

- $\beta_0$: the number of **connected components** (clusters)
- $\beta_1$: the number of **1-dimensional holes** (loops)
- $\beta_2$: the number of **2-dimensional voids** (cavities)

These numbers are invariant under homeomorphism — they don't change when you stretch or bend the space, only when you tear it or fill in a hole. This makes them powerful tools for comparing the *structure* of different models' learned representations, independent of the arbitrary coordinate frames those models use.

$$\text{Persistence}(h) = r_{\text{death}}(h) - r_{\text{birth}}(h)$$

A topological feature with high persistence is a real structural property of the data; one with low persistence is noise.
</div>

<div style="margin-bottom: 10px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
    <strong>Latent Space Manifold:</strong><br>
    Adjust the <b>Warp Factor</b> to see how the manifold deforms while maintaining its underlying topological connectivity.
    The surface can stretch and ripple, but its fundamental structure — the number of peaks, valleys, and the way regions connect — is preserved under smooth deformation. This is topology in action.
    <br><br>
    Warp Factor: <input type="range" id="topo-warp" min="0" max="1" step="0.05" value="0.3">
</div>

<div id="topology-plot" class="plot-container" style="height: 500px; margin-bottom: 40px;"></div>

<div class="md">
## Feature Spaces and Topological Curves

A **Feature Space** is a specific slice of the manifold. For example, a model might learn a "Sentiment" dimension. By moving a vector along that specific topological curve, we can change a sentence from "sad" to "happy" without losing the original meaning of the words. The curve itself is a 1-dimensional manifold embedded in the high-dimensional space, and its topology (is it a line? a loop? a helix?) determines what kinds of transformations are possible.

## Helices, Attention Heads, and Turing Machines

One of the most profound connections between topology and computation in LLMs involves **helical structure**. As explored in the embedding lab's section on the emergent time axis, ordered or sequential concepts — dates, sizes, intensities — tend to form **helices** in the embedding space:

$$ \mathbf{v}(t) \approx \mathbf{a} \cdot t + r \cdot \cos(\omega t) \cdot \hat{e}_1 + r \cdot \sin(\omega t) \cdot \hat{e}_2 $$

where $\mathbf{a}$ is the linear progression direction, $r$ is the helix radius (strength of cyclical patterns), and $\omega$ controls the winding frequency. This structure emerges purely from statistical co-occurrence — nobody programs it.

### Why Helices?

A helix is a topologically elegant structure because it encodes **two kinds of information simultaneously**:

1. **Linear progression** along the helix axis (e.g., time moving forward, size increasing)
2. **Cyclical recurrence** via the rotation around the axis (e.g., decades repeating patterns, seasons cycling)

This dual encoding is not merely a curiosity — it is computationally powerful. A helix is essentially a **one-dimensional manifold embedded in three or more dimensions**, and its winding number (how many times it loops per unit of linear progression) is a topological invariant.

### Attention Heads Discover Helices

Individual attention heads in a Transformer have been shown to specialize in detecting and utilizing specific geometric structures in the residual stream. Some heads learn to track **positional information** by attending to tokens based on their position along a helical curve in activation space. The dot-product attention mechanism:

$$ \text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^T}{\sqrt{d_k}}\right) V $$

naturally computes **angular similarity** between query and key vectors. When tokens are arranged along a helix, the dot product between a query token and a key token depends on both their **linear separation** (how far apart they are in the sequence) and their **phase relationship** (where they fall in the cyclical pattern). This allows a single attention head to implement a form of **periodic gating** — attending strongly to tokens that are a fixed number of "cycles" away.

### The Connection to Turing Machines

A \cite[Turing machine]{turing1937} is defined by:
- A **tape** (infinite sequence of cells, each containing a symbol)
- A **head** (reads and writes symbols, moves left or right)
- A **state register** (finite set of internal states)
- A **transition function** $\delta: Q \times \Gamma \to Q \times \Gamma \times \{L, R\}$

The key insight is that a helix can **encode the state-transition graph** of a Turing machine. Each point on the helix represents a (state, symbol) pair. The linear axis encodes the **tape position** (where the head is), and the angular position encodes the **internal state**. A transition $\delta(q_i, a) = (q_j, b, R)$ corresponds to:

1. **Reading**: The attention head attends to the current position on the helix (state $q_i$, symbol $a$)
2. **State transition**: The activation rotates around the helix axis from the angular position of $q_i$ to that of $q_j$ — a **rotation** in the embedding space
3. **Writing**: The residual stream update modifies the token representation at the current position (changing $a$ to $b$)
4. **Moving**: The linear component shifts along the helix axis (moving the head right)

This is not merely an analogy. \citeauthorlastnameand{perez2021attention} proved that Transformers are **Turing-complete**: given sufficient depth and precision, a Transformer can simulate any Turing machine. The helical structure in the embedding space is one geometric mechanism by which this simulation occurs. Each layer of the Transformer performs one "step" of the Turing machine:

$$ \underbrace{\text{Attention}}_{\text{Read + Route}} + \underbrace{\text{MLP}}_{\text{Write + Transition}} = \underbrace{\text{One TM Step}}_{\delta(q, a) \to (q', b, D)} $$

The attention mechanism identifies which (state, symbol) pair is currently active by computing dot products along the helix, and the MLP layer applies the transition function by rotating the activation vector to the new state and updating the symbol.

### Topological Constraints on Computation

This helical picture reveals a deep connection between **topology** and **computational capacity**:

- **Winding number as memory**: The number of distinct states a helix can encode depends on its winding number — how many distinguishable angular positions exist per unit of linear progression. More winding = more states = more computational power. This is a topological invariant.

- **Helix radius as precision**: The radius $r$ determines how well-separated different states are in the embedding space. Larger radius means cleaner state discrimination, but requires more dimensions. This connects to the well-known result that Transformer computational power scales with embedding dimension.

- **Continuity constraints**: Because the Transformer operates via continuous functions (softmax, matrix multiplication), it cannot implement arbitrary discrete jumps between states. The transitions must be **topologically continuous** — you can't "tear" the helix. This is why Transformers sometimes struggle with tasks requiring sharp discrete transitions (e.g., exact counting, parity checking) unless given sufficient depth to approximate the discontinuity.

Below, you can explore this connection interactively. The visualization shows a helix encoding Turing machine states. Adjust the **number of states** to see how the helix winds tighter to accommodate more states. Toggle the **transition arrows** to see how the attention mechanism routes between states. The **tape display** shows the simulated Turing machine execution, with each step corresponding to one "rotation + translation" along the helix.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="display: grid; grid-template-columns: 1fr 280px; gap: 20px; align-items: start; margin-bottom: 15px;">
        <canvas id="canvas-helix-turing" style="width: 100%; height: 560px; background: #0f172a; border-radius: 8px; border: 1px solid #1e293b; cursor: grab;"></canvas>
        <div id="helix-turing-panel" style="background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; font-family: sans-serif; font-size: 0.85em; color: #475569; line-height: 1.7; max-height: 560px; overflow-y: auto;">
            <div style="font-weight: bold; font-size: 1em; color: #1e293b; margin-bottom: 8px;">🌀 Helix–Turing Explorer</div>
            <div id="helix-turing-info">
                Each point on the helix encodes a (state, symbol) pair. The linear axis is the tape position; the angular position is the internal state. Watch how attention "reads" the current state and the MLP "writes" the transition.
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 10px 0;">
            <div style="font-weight: bold; font-size: 0.9em; color: #1e293b; margin-bottom: 6px;">📼 Tape</div>
            <div id="helix-tape-display" style="font-family: monospace; font-size: 1.1em; letter-spacing: 2px; padding: 8px; background: #f1f5f9; border-radius: 6px; text-align: center; overflow-x: auto; white-space: nowrap;">
                ...0 0 1 1 0 1 0 0...
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 10px 0;">
            <div style="font-weight: bold; font-size: 0.9em; color: #1e293b; margin-bottom: 6px;">📊 State Info</div>
            <div id="helix-state-info"></div>
        </div>
    </div>

    <!-- Controls -->
    <div style="display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>States (Q):</b>
            <input type="range" id="helix-num-states" min="2" max="8" step="1" value="3" style="width: 160px; vertical-align: middle;">
            <span id="helix-num-states-val" style="font-weight: bold; color: #8b5cf6;">3</span>
        </label>
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>Helix Radius:</b>
            <input type="range" id="helix-tm-radius" min="0.1" max="1.0" step="0.05" value="0.6" style="width: 160px; vertical-align: middle;">
            <span id="helix-tm-radius-val" style="font-weight: bold; color: #f59e0b;">0.60</span>
        </label>
    </div>

    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <button onclick="stepHelixTuring()" id="helix-step-btn" style="background: #3b82f6; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">⏭ Step</button>
        <button onclick="runHelixTuring()" id="helix-run-btn" style="background: #10b981; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">▶ Run</button>
        <button onclick="resetHelixTuring()" style="background: #64748b; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">↺ Reset</button>
        <span id="helix-turing-status" style="font-size: 0.85em; color: #64748b; font-family: sans-serif;">Ready — click Step or Run.</span>
    </div>

    <div style="display: flex; gap: 16px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="helix-show-transitions" checked onchange="renderHelixTuring()"> Show transition arrows
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="helix-show-helix-thread" checked onchange="renderHelixTuring()"> Show helix thread
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="helix-show-shadow" checked onchange="renderHelixTuring()"> Show 2D shadow
        </label>
    </div>

    <!-- Stats -->
    <div id="helix-turing-stats" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; max-width: 800px; margin: 0 auto 15px auto;"></div>

    <!-- Description -->
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>What you're seeing:</b> A helix in 3D activation space encoding a simple Turing machine.
        The <b>linear axis</b> (left → right) represents <b>tape position</b>.
        The <b>angular position</b> around the axis represents the <b>internal state</b> ($q_0, q_1, \ldots$).
        Each <span style="color:#f59e0b; font-weight:bold;">gold marker</span> is a (state, symbol) configuration.
        <span style="color:#ef4444; font-weight:bold;">Red arrows</span> show the <b>transition function</b> $\delta$ — the path the activation takes when the attention head "reads" the current state and the MLP "writes" the new one.
        The <span style="color:#10b981; font-weight:bold;">green highlight</span> marks the <b>current configuration</b>.
        Click <b>Step</b> to execute one transition, or <b>Run</b> to animate.
        Notice how each step is a <b>rotation</b> (state change) + <b>translation</b> (head movement) along the helix — the same geometric operations the Transformer performs in its residual stream.
    </div>
</section>

<div class="md">
## Summary: Topology as the Grammar of Geometry

Topology provides the deepest level of structural analysis for understanding how LLMs organize knowledge. While geometry tells us *where* concepts are, topology tells us *how they're connected*. The manifold hypothesis, persistent homology, helical encodings, and their connection to Turing-complete computation form a unified picture:

| Topological Feature | What It Means in the LLM |
|---|---|
| Connected components ($\beta_0$) | Distinct concept clusters |
| Loops ($\beta_1$) | Cyclical relationships (tense, seasons, analogies) |
| Voids ($\beta_2$) | Semantic impossibilities, logical contradictions |
| Helix winding number | Computational state capacity |
| Manifold dimension | Intrinsic complexity of the data |
| Homeomorphism | Cross-lingual / cross-modal alignment |

The Transformer doesn't just process sequences of tokens — it navigates a topological landscape, and the shape of that landscape *is* the model's understanding of the world.
</div>
