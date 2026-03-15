<?php include_once("functions.php"); ?>

<div class="md">
In an LLM, words and concepts are mapped to high-dimensional vectors. However, these vectors don't fill the space uniformly. They tend to lie on a **Manifold**, a lower-dimensional surface embedded in the high-dimensional space. Understanding the *shape* of this manifold, its holes, its twists, its branches, is the domain of **topology**.

## What Is Topology?

Topology is the branch of mathematics that studies properties of shapes that are preserved under continuous deformation, stretching, bending, twisting, but **not** tearing or gluing. A coffee mug and a donut are topologically identical (both have exactly one hole); a sphere and a donut are not. While geometry asks *"how far apart are these two points?"*, topology asks *"are these two regions connected? Is there a hole between them? Can I smoothly deform one structure into the other?"*

Formally, two spaces are **homeomorphic** (topologically equivalent) if there exists a continuous bijection between them whose inverse is also continuous. This means:

$$ X \cong Y \iff \exists\, f: X \to Y \text{ continuous, bijective, with } f^{-1} \text{ continuous} $$

## Why Does Topology Matter for AI?

The reason topology matters for understanding LLMs is that the **semantic manifold**, the surface on which meaningful token representations live, has rich topological structure. This structure directly affects what the model can and cannot represent:

1. **Connectivity and Clustering:** Topology tells us whether two concept regions are connected (reachable from each other via smooth interpolation) or separated by a void. If "science" and "pseudoscience" live on disconnected components of the manifold, the model treats them as categorically different; if they're connected, there's a smooth gradient between them.

2. **Holes as Impossibilities:** As explored in the \cite[Persistent Homology]{persistenthomology} section of the embedding space, topological holes represent regions where **no coherent concept exists**, logical contradictions, semantic voids, the "unsayable." These holes are not bugs; they are the negative imprint of the model's world-knowledge.

3. **Attention as Navigation:** The \cite[attention mechanism]{vaswani2017attention} can be understood as a tool for navigating the manifold's topology, finding which regions are "nearby" in the model's learned geometry, even if they appear distant in raw Euclidean space.

4. **Feature Extraction via Persistent Homology:** By computing the \cite[persistent homology]{persistenthomology} of activation patterns, researchers can determine whether a model has learned genuine topological structure (robust loops, clusters, cavities) or is merely memorizing surface-level correlations. Features with high **persistence**, topological signatures that survive across a wide range of scales, correspond to robust, generalizable knowledge.

## Topological Invariants in Practice

The key topological invariants used in AI research are the **Betti numbers** $\beta_0, \beta_1, \beta_2, \ldots$:

- $\beta_0$: the number of **connected components** (clusters)
- $\beta_1$: the number of **1-dimensional holes** (loops)
- $\beta_2$: the number of **2-dimensional voids** (cavities)

These numbers are invariant under homeomorphism, they don't change when you stretch or bend the space, only when you tear it or fill in a hole. This makes them powerful tools for comparing the *structure* of different models' learned representations, independent of the arbitrary coordinate frames those models use.

$$\text{Persistence}(h) = r_{\text{death}}(h) - r_{\text{birth}}(h)$$

A topological feature with high persistence is a real structural property of the data; one with low persistence is noise.
</div>

<!-- ═══════════════════════════════════════════════════════ -->
<!-- SECTION 1: Latent Space Manifold with Persistence Barcode -->
<!-- ═══════════════════════════════════════════════════════ -->

<div style="margin-bottom: 10px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
    <strong>Latent Space Manifold:</strong><br>
    Adjust the <b>Warp Factor</b> to see how the manifold deforms while maintaining its underlying topological connectivity.
    The surface can stretch and ripple, but its fundamental structure, the number of peaks, valleys, and the way regions connect, is preserved under smooth deformation. This is topology in action.
    The <b>persistence barcode</b> below the surface shows which topological features (components, loops, voids) survive across scales.
    <br><br>
    <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
        Warp Factor:
        <input type="range" id="topo-warp" min="0" max="1" step="0.05" value="0.3" style="width: 240px; vertical-align: middle;">
        <span id="topo-warp-val" style="font-weight: bold; color: #8b5cf6;">0.30</span>
    </label>
</div>

<div id="topology-plot" class="plot-container" style="height: 500px; margin-bottom: 10px;"></div>

<!-- Persistence Barcode -->
<div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 40px;">
    <div style="font-weight: bold; font-size: 0.95em; color: #1e293b; margin-bottom: 8px;">📊 Persistence Barcode</div>
    <div style="font-size: 0.8em; color: #64748b; margin-bottom: 10px;">
        Each bar represents a topological feature. Longer bars = more persistent = more "real." Short bars are noise.
        Colors: <span style="color:#3b82f6; font-weight:bold;">β₀ (components)</span>,
        <span style="color:#10b981; font-weight:bold;">β₁ (loops)</span>,
        <span style="color:#f59e0b; font-weight:bold;">β₂ (voids)</span>
    </div>
    <canvas id="canvas-persistence-barcode" style="width: 100%; height: 160px; border-radius: 8px; background: #f8fafc;"></canvas>
</div>

<!-- ═══════════════════════════════════════════════════════ -->
<!-- SECTION 2: Draw Your Own Manifold, Live Betti Numbers -->
<!-- ═══════════════════════════════════════════════════════ -->

<div class="md">
## Draw Your Own Manifold

Experience topology hands-on. **Draw a shape** on the canvas below and watch its Betti numbers computed in real time. Draw a circle, you'll see $\beta_1 = 1$ (one loop). Draw two separate blobs, $\beta_0 = 2$ (two components). Draw a figure-eight, $\beta_1 = 2$ (two loops). Can you draw a shape with $\beta_0 = 3$?
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="display: grid; grid-template-columns: 1fr 260px; gap: 20px; align-items: start;">
        <div>
            <canvas id="canvas-draw-manifold" style="width: 100%; height: 400px; background: #fff; border-radius: 8px; border: 2px solid #e2e8f0; cursor: crosshair;"></canvas>
            <div style="display: flex; gap: 10px; margin-top: 10px; justify-content: center; flex-wrap: wrap;">
                <button onclick="clearDrawManifold()" style="background: #ef4444; color: white; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">🗑 Clear</button>
                <button onclick="undoDrawManifold()" style="background: #f59e0b; color: white; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">↩ Undo</button>
                <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; display: flex; align-items: center; gap: 6px;">
                    Brush:
                    <input type="range" id="draw-brush-size" min="2" max="20" step="1" value="6" style="width: 80px;">
                    <span id="draw-brush-size-val">6</span>px
                </label>
                <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; display: flex; align-items: center; gap: 6px;">
                    <input type="checkbox" id="draw-eraser-mode"> Eraser
                </label>
            </div>
        </div>
        <div id="betti-panel" style="background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; font-family: sans-serif;">
            <div style="font-weight: bold; font-size: 1em; color: #1e293b; margin-bottom: 12px;">🔢 Live Betti Numbers</div>
            <div id="betti-display" style="text-align: center;">
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 0.75em; color: #64748b;">β₀, Connected Components</div>
                    <div id="betti-0" style="font-size: 2.5em; font-weight: bold; color: #3b82f6;">0</div>
                </div>
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 0.75em; color: #64748b;">β₁, Loops (Holes)</div>
                    <div id="betti-1" style="font-size: 2.5em; font-weight: bold; color: #10b981;">0</div>
                </div>
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 0.75em; color: #64748b;">Euler Characteristic χ</div>
                    <div id="euler-char" style="font-size: 2.5em; font-weight: bold; color: #8b5cf6;">0</div>
                    <div style="font-size: 0.7em; color: #94a3b8;">χ = β₀ − β₁</div>
                </div>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 12px 0;">
            <div style="font-size: 0.8em; color: #94a3b8; line-height: 1.5;">
                <b>Try drawing:</b><br>
                • A circle → β₁ = 1<br>
                • Two separate dots → β₀ = 2<br>
                • A figure-8 → β₁ = 2<br>
                • A filled disk → β₁ = 0<br>
            </div>
        </div>
    </div>
</section>

<!-- ═══════════════════════════════════════════════════════ -->
<!-- SECTION 3: Topology Quiz -->
<!-- ═══════════════════════════════════════════════════════ -->

<div class="md">
## Topology Challenge

Test your topological intuition! For each pair, decide: **are they homeomorphic?** (Can you smoothly deform one into the other without tearing or gluing?)
</div>

<section id="topology-quiz-section" style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="font-weight: bold; font-size: 1.1em; color: #1e293b; margin-bottom: 12px; font-family: sans-serif;">🧩 Are These Homeomorphic?</div>
    <div id="quiz-container" style="text-align: center; margin-bottom: 16px;">
        <canvas id="canvas-quiz" style="width: 100%; max-width: 600px; height: 220px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0;"></canvas>
    </div>
    <div id="quiz-question" style="text-align: center; font-family: sans-serif; font-size: 1em; color: #334155; margin-bottom: 12px;"></div>
    <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 12px;">
        <button onclick="answerQuiz(true)" id="quiz-yes-btn" style="background: #10b981; color: white; border: none; padding: 12px 32px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1.05em;">✅ Yes, Homeomorphic</button>
        <button onclick="answerQuiz(false)" id="quiz-no-btn" style="background: #ef4444; color: white; border: none; padding: 12px 32px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1.05em;">❌ No, Different</button>
    </div>
    <div id="quiz-feedback" style="text-align: center; font-family: sans-serif; font-size: 0.95em; color: #64748b; min-height: 60px; padding: 10px;"></div>
    <div style="display: flex; justify-content: center; gap: 20px; margin-top: 8px;">
        <div style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            Score: <span id="quiz-score" style="font-weight: bold; color: #10b981;">0</span> / <span id="quiz-total" style="font-weight: bold;">0</span>
        </div>
        <button onclick="nextQuizQuestion()" id="quiz-next-btn" style="background: #3b82f6; color: white; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; display: none;">Next →</button>
    </div>
</section>

<div class="md">
## Feature Spaces and Topological Curves

A **Feature Space** is a specific slice of the manifold. For example, a model might learn a "Sentiment" dimension. By moving a vector along that specific topological curve, we can change a sentence from "sad" to "happy" without losing the original meaning of the words. The curve itself is a 1-dimensional manifold embedded in the high-dimensional space, and its topology (is it a line? a loop? a helix?) determines what kinds of transformations are possible.

## Helices, Attention Heads, and Turing Machines

One of the most profound connections between topology and computation in LLMs involves **helical structure**. As explored in the embedding lab's section on the emergent time axis, ordered or sequential concepts, dates, sizes, intensities, tend to form **helices** in the embedding space:

$$ \mathbf{v}(t) \approx \mathbf{a} \cdot t + r \cdot \cos(\omega t) \cdot \hat{e}_1 + r \cdot \sin(\omega t) \cdot \hat{e}_2 $$

where $\mathbf{a}$ is the linear progression direction, $r$ is the helix radius (strength of cyclical patterns), and $\omega$ controls the winding frequency. This structure emerges purely from statistical co-occurrence, nobody programs it.

### Why Helices?

A helix is a topologically elegant structure because it encodes **two kinds of information simultaneously**:

1. **Linear progression** along the helix axis (e.g., time moving forward, size increasing)
2. **Cyclical recurrence** via the rotation around the axis (e.g., decades repeating patterns, seasons cycling)

This dual encoding is not merely a curiosity, it is computationally powerful. A helix is essentially a **one-dimensional manifold embedded in three or more dimensions**, and its winding number (how many times it loops per unit of linear progression) is a topological invariant.

### Attention Heads Discover Helices

Individual attention heads in a Transformer have been shown to specialize in detecting and utilizing specific geometric structures in the residual stream. Some heads learn to track **positional information** by attending to tokens based on their position along a helical curve in activation space. The dot-product attention mechanism:

$$ \text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^T}{\sqrt{d_k}}\right) V $$

naturally computes **angular similarity** between query and key vectors. When tokens are arranged along a helix, the dot product between a query token and a key token depends on both their **linear separation** (how far apart they are in the sequence) and their **phase relationship** (where they fall in the cyclical pattern). This allows a single attention head to implement a form of **periodic gating**, attending strongly to tokens that are a fixed number of "cycles" away.

### The Connection to Turing Machines

A \cite[Turing machine]{turing1937} is defined by:
- A **tape** (infinite sequence of cells, each containing a symbol)
- A **head** (reads and writes symbols, moves left or right)
- A **state register** (finite set of internal states)
- A **transition function** $\delta: Q \times \Gamma \to Q \times \Gamma \times \{L, R\}$

The key insight is that a helix can **encode the state-transition graph** of a Turing machine. Each point on the helix represents a (state, symbol) pair. The linear axis encodes the **tape position** (where the head is), and the angular position encodes the **internal state**. A transition $\delta(q_i, a) = (q_j, b, R)$ corresponds to:

1. **Reading**: The attention head attends to the current position on the helix (state $q_i$, symbol $a$)
2. **State transition**: The activation rotates around the helix axis from the angular position of $q_i$ to that of $q_j$, a **rotation** in the embedding space
3. **Writing**: The residual stream update modifies the token representation at the current position (changing $a$ to $b$)
4. **Moving**: The linear component shifts along the helix axis (moving the head right)

This is not merely an analogy. \citeauthorlastnameand{perez2021attention} proved that Transformers are **Turing-complete**: given sufficient depth and precision, a Transformer can simulate any Turing machine. The helical structure in the embedding space is one geometric mechanism by which this simulation occurs. Each layer of the Transformer performs one "step" of the Turing machine:

$$ \underbrace{\text{Attention}}_{\text{Read + Route}} + \underbrace{\text{MLP}}_{\text{Write + Transition}} = \underbrace{\text{One TM Step}}_{\delta(q, a) \to (q', b, D)} $$

The attention mechanism identifies which (state, symbol) pair is currently active by computing dot products along the helix, and the MLP layer applies the transition function by rotating the activation vector to the new state and updating the symbol.

### Topological Constraints on Computation

This helical picture reveals a deep connection between **topology** and **computational capacity**:

- **Winding number as memory**: The number of distinct states a helix can encode depends on its winding number, how many distinguishable angular positions exist per unit of linear progression. More winding = more states = more computational power. This is a topological invariant.

- **Helix radius as precision**: The radius $r$ determines how well-separated different states are in the embedding space. Larger radius means cleaner state discrimination, but requires more dimensions. This connects to the well-known result that Transformer computational power scales with embedding dimension.

- **Continuity constraints**: Because the Transformer operates via continuous functions (softmax, matrix multiplication), it cannot implement arbitrary discrete jumps between states. The transitions must be **topologically continuous**, you can't "tear" the helix. This is why Transformers sometimes struggle with tasks requiring sharp discrete transitions (e.g., exact counting, parity checking) unless given sufficient depth to approximate the discontinuity.

Below, you can explore this connection interactively. The visualization shows a helix encoding Turing machine states. Adjust the **number of states** to see how the helix winds tighter to accommodate more states. Toggle the **transition arrows** to see how the attention mechanism routes between states. The **tape display** shows the simulated Turing machine execution, with each step corresponding to one "rotation + translation" along the helix.
</div>

<!-- ═══════════════════════════════════════════════════════ -->
<!-- SECTION 4: Helix-Turing Machine Explorer (Enhanced) -->
<!-- ═══════════════════════════════════════════════════════ -->

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="display: grid; grid-template-columns: 1fr 280px; gap: 20px; align-items: start; margin-bottom: 15px;">
        <canvas id="canvas-helix-turing" style="width: 100%; height: 560px; background: #0f172a; border-radius: 8px; border: 1px solid #1e293b; cursor: grab;"></canvas>
        <div id="helix-turing-panel" style="background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; font-family: sans-serif; font-size: 0.85em; color: #475569; line-height: 1.7; max-height: 560px; overflow-y: auto;">
            <div style="font-weight: bold; font-size: 1em; color: #1e293b; margin-bottom: 8px;">🧬 Helix–Turing Explorer</div>
            <div id="helix-turing-info">
                Each point on the helix encodes a (state, symbol) pair. The linear axis is the tape position; the angular position is the internal state. Watch how attention "reads" the current state and the MLP "writes" the transition.
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 10px 0;">
            <div style="font-weight: bold; font-size: 0.9em; color: #1e293b; margin-bottom: 6px;">🔧 Tape</div>
            <div id="helix-tape-display" style="font-family: monospace; font-size: 1.1em; letter-spacing: 2px; padding: 8px; background: #f1f5f9; border-radius: 6px; text-align: center; overflow-x: auto; white-space: nowrap;">
                ...0 0 1 1 0 1 0 0...
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 10px 0;">
            <div style="font-weight: bold; font-size: 0.9em; color: #1e293b; margin-bottom: 6px;">🔬 State Info</div>
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
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>Speed:</b>
            <input type="range" id="helix-anim-speed" min="50" max="800" step="50" value="300" style="width: 120px; vertical-align: middle;">
            <span id="helix-anim-speed-val" style="font-weight: bold; color: #64748b;">300</span>ms
        </label>
    </div>

    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <button onclick="stepHelixTuring()" id="helix-step-btn" style="background: #3b82f6; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">⏩ Step</button>
        <button onclick="runHelixTuring()" id="helix-run-btn" style="background: #10b981; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">▶ Run</button>
        <button onclick="resetHelixTuring()" style="background: #64748b; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">⟲ Reset</button>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="helix-sound-enabled" checked> 🔊 Sound
        </label>
        <span id="helix-turing-status" style="font-size: 0.85em; color: #64748b; font-family: sans-serif;">Ready, click Step or Run.</span>
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
        <span style="color:#ef4444; font-weight:bold;">Red arrows</span> show the <b>transition function</b> $\delta$, the path the activation takes when the attention head "reads" the current state and the MLP "writes" the new one.
        The <span style="color:#10b981; font-weight:bold;">green highlight</span> marks the <b>current configuration</b>.
        Click <b>Step</b> to execute one transition, or <b>Run</b> to animate.
        🔊 <b>Sound</b>: each state maps to a pentatonic tone, listen to the computation!
        Notice how each step is a <b>rotation</b> (state change) + <b>translation</b> (head movement) along the helix, the same geometric operations the Transformer performs in its residual stream.
    </div>
</section>

<!-- ═══════════════════════════════════════════════════════ -->
<!-- SECTION 5: Design Your Own Turing Machine -->
<!-- ═══════════════════════════════════════════════════════ -->

<div class="md">
## Design Your Own Turing Machine

Define a custom transition table and watch it execute on the helix. Can you build a machine that writes all 1s? One that oscillates forever? One that halts in exactly 5 steps?
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="font-weight: bold; font-size: 1.05em; color: #1e293b; margin-bottom: 12px; font-family: sans-serif;">🎮 Custom Turing Machine Designer</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; margin-bottom: 16px;">
        <div>
            <div style="font-size: 0.85em; color: #64748b; margin-bottom: 8px; font-family: sans-serif;">
                Edit the transition table below. Format: <code>newState, writeSymbol, direction (L/R)</code>. Leave blank for HALT.
            </div>
            <div id="custom-tm-table" style="font-family: monospace; font-size: 0.85em;"></div>
        </div>
        <div>
            <div style="font-size: 0.85em; color: #64748b; margin-bottom: 8px; font-family: sans-serif;">
                Initial tape (comma-separated 0s and 1s):
            </div>
            <input type="text" id="custom-tm-tape" value="0,0,1,1,0,1,0,0,0,0,0" style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-family: monospace; font-size: 0.9em; margin-bottom: 10px;">
            <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; display: block; margin-bottom: 8px;">
                Number of states:
                <select id="custom-tm-num-states" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.9em;">
                    <option value="2">2</option>
                    <option value="3" selected>3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                </select>
            </label>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="applyCustomTM()" style="background: #8b5cf6; color: white; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">🚀 Load Machine</button>
                <button onclick="loadPresetTM('binary-increment')" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 0.85em;">📦 Binary Increment</button>
                <button onclick="loadPresetTM('busy-beaver-3')" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 0.85em;">🦫 Busy Beaver (3)</button>
                <button onclick="loadPresetTM('oscillator')" style="background: #f59e0b; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 0.85em;">🔄 Oscillator</button>
            </div>
        </div>
    </div>
    <div id="custom-tm-feedback" style="text-align: center; font-family: sans-serif; font-size: 0.9em; color: #64748b; min-height: 30px; padding: 8px;"></div>
</section>

<!-- ═══════════════════════════════════════════════════════ -->
<!-- SECTION 6: Summary Table -->
<!-- ═══════════════════════════════════════════════════════ -->

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

The Transformer doesn't just process sequences of tokens, it navigates a topological landscape, and the shape of that landscape *is* the model's understanding of the world.
</div>

<div class="md">
## The Torus: When Two Cycles Meet

A **torus** is the product of two circles: $T^2 = S^1 \times S^1$. Imagine taking a circle and sweeping it around another circle, you get a donut shape. But the real power of the torus is what it *represents*: any system with **two independent cyclic variables**.

### Why This Matters for Understanding

Many real-world concepts are governed by two independent cycles:

- **Day of week** (7-day cycle) × **Time of day** (24-hour cycle) = a torus of "when things happen"
- **Monthly budget cycle** × **Weekly spending cycle** = a torus of financial behavior
- **Verb tense** × **Grammatical aspect** = a torus of temporal expression

When an LLM encodes "Sunday morning" vs. "Wednesday midnight," it's placing points on a toroidal manifold. The key insight is that on a torus, you can have paths that **wrap around in both directions simultaneously**, a diagonal path that goes around the donut *and* through the hole at the same time.

### The Flat Torus Representation

A torus can be represented as a **flat square with opposite edges identified**:

$$T^2 = [0,1]^2 / \sim$$

where $(x, 0) \sim (x, 1)$ and $(0, y) \sim (1, y)$. This means if you walk off the right edge, you reappear on the left. Walk off the top, you reappear at the bottom. This is exactly how many video games work, and it's exactly how cyclic embeddings behave in neural networks.

### Betti Numbers of the Torus

$$\beta_0 = 1, \quad \beta_1 = 2, \quad \beta_2 = 1$$

- $\beta_0 = 1$: The torus is one connected piece
- $\beta_1 = 2$: There are **two independent loops** that can't be shrunk to a point, one going "around the donut" and one going "through the hole"
- $\beta_2 = 1$: The torus encloses one void (the hollow interior)

The Euler characteristic is:

$$\chi = \beta_0 - \beta_1 + \beta_2 = 1 - 2 + 1 = 0$$

### Connection to LLM Embeddings

When a language model learns that "saving money" peaks on certain days and follows a monthly cycle, it's effectively learning a function $f: T^2 \to \mathbb{R}$, a scalar field on a torus. The two fundamental loops of the torus ($\beta_1 = 2$) correspond to the two independent periodicities the model must capture. Attention heads that specialize in temporal reasoning are, in a topological sense, learning the **fundamental group** of this torus:

$$\pi_1(T^2) = \mathbb{Z} \times \mathbb{Z}$$

Two independent integer-valued winding numbers, one for each cycle.
</div>

<div id="torus-viz"></div>

<div class="md">
## The Möbius Strip: Non-Orientability and Meaning Reversal

Take a strip of paper, give it a **half-twist**, and glue the ends together. You've just created a **Möbius strip**, one of the most famous objects in topology. It has only **one side** and **one edge**. If you start painting one side and keep going, you'll paint the "other side" too without ever lifting your brush.

### Non-Orientability

The defining property of the Möbius strip is that it is **non-orientable**. On an ordinary surface (like a cylinder), you can consistently define "clockwise" everywhere. On a Möbius strip, if you carry a small clockwise arrow around the loop, it comes back **counter-clockwise**. There is no consistent notion of left and right.

Formally, the Möbius strip is the quotient:

$$M = [0,1] \times [0,1] \;/\; (0, y) \sim (1, 1-y)$$

Notice the **flip** in the $y$-coordinate, that's the half-twist.

### Betti Numbers

$$\beta_0 = 1, \quad \beta_1 = 1$$

- $\beta_0 = 1$: It's connected
- $\beta_1 = 1$: There is one independent loop (the central circle)

Note: a cylinder *also* has $\beta_0 = 1, \beta_1 = 1$. The Betti numbers alone **cannot distinguish** a Möbius strip from a cylinder! This is a crucial lesson: Betti numbers capture *homology*, but non-orientability is a subtler property. You need the **first Stiefel-Whitney class** $w_1 \neq 0$ or equivalently, the fact that $H_1(M; \mathbb{Z}) = \mathbb{Z}$ but the orientation double cover is non-trivial.

### Semantic Analogy: Sarcasm and Meaning Reversal

Some semantic dimensions are non-orientable. Consider the word **"great"**:

- "That's great!" (sincere) → positive meaning
- "Oh, that's *great*." (sarcastic) → negative meaning

As you traverse the "tone" manifold from sincere through deadpan to sarcastic and back, the **meaning flips**, just like orientation flips on a Möbius strip. The words are identical, but their semantic content has been reversed by the journey through context space.

This is not just a metaphor. If you plot the embedding vectors of sarcastic vs. sincere uses of the same phrase, the manifold they trace out is genuinely non-orientable, there's no continuous way to assign a consistent "positive/negative" label as you move through the space of tonal contexts.

### Why LLMs Struggle with Sarcasm

An LLM that models tone as a **cylinder** (orientable) will always be able to separate "positive" from "negative." But if the true manifold is a **Möbius strip** (non-orientable), then any classifier that tries to draw a consistent boundary will fail somewhere, there will always be a context where the boundary is on the wrong side. This is a topological obstruction to sarcasm detection, not just a data problem.
</div>

<div id="mobius-viz"></div>

<div class="md">
## Covering Spaces: Unwinding Ambiguity

A **covering space** is a topological space $\hat{X}$ that maps onto a base space $X$ via a map $p: \hat{X} \to X$ such that every point in $X$ has a neighborhood that is "evenly covered", its preimage consists of disjoint copies stacked above it.

### The Classic Example

The simplest covering space is the **real line covering the circle**:

$$p: \mathbb{R} \to S^1, \quad p(t) = e^{2\pi i t}$$

The circle $S^1$ has a loop that can't be shrunk. But when you "lift" that loop to $\mathbb{R}$, it becomes a path from $0$ to $1$, no longer a loop! The covering space **unwinds** the topology of the base.

The fundamental group of the circle is $\pi_1(S^1) = \mathbb{Z}$, but the fundamental group of the real line is $\pi_1(\mathbb{R}) = 0$ (trivial). The covering map "kills" the loops.

### Polysemy as a Topological Loop

Consider the word **"bank"**. It has multiple meanings:
- 🏦 Financial institution
- 🌊 River bank
- ✈️ Banking (turning) of an aircraft
- 🎰 Bank (in gambling)

In a simple embedding space, these meanings live on a **loop**, as you move through different contexts, "bank" cycles through its meanings. This loop is non-trivial in $\pi_1$ of the embedding manifold.

### Transformer Layers as Covering Maps

Here's the key insight: each layer of a Transformer acts like a **partial covering map**. The input embedding lives on the base space (ambiguous, with loops). As the signal passes through attention layers, the representation is **lifted** to a covering space where the loops are unwound:

$$\text{Layer } 0: \quad \text{"bank"} \in S^1 \quad (\text{ambiguous, loopy})$$
$$\text{Layer } 6: \quad \text{"bank"} \in \mathbb{R} \quad (\text{meanings separated})$$

The attention mechanism computes the **lift** by using context to determine which sheet of the covering space the current meaning lives on. "I went to the bank to deposit money" lifts to the financial sheet. "I sat on the bank of the river" lifts to the geographical sheet.

### The Deck Transformation Group

The **deck transformations** of a covering space are the symmetries that permute the sheets while preserving the covering map. For the universal cover $\mathbb{R} \to S^1$, the deck group is $\mathbb{Z}$, integer translations.

For polysemy, the deck transformations correspond to **meaning shifts**: operations that swap one meaning of "bank" for another while preserving the syntactic structure. The sentence "I went to the ___ to deposit money" has a deck transformation that replaces "bank" with... well, there's no other word that fits, which is why the covering space successfully disambiguates.

### Formal Statement

If $X$ is the manifold of contextual word embeddings and $\hat{X}$ is the manifold of disambiguated representations, then:

$$|\text{sheets}| = |\pi_1(X) / p_*(\pi_1(\hat{X}))| = \text{number of distinct meanings}$$

The number of meanings of a polysemous word equals the index of the image of the covering space's fundamental group in the base space's fundamental group.
</div>

<div id="covering-viz"></div>

<div class="md">
## The Real Projective Plane: Concepts Without Direction

The **real projective plane** $\mathbb{R}P^2$ is the space of all lines through the origin in $\mathbb{R}^3$. Equivalently, it's a sphere with **antipodal points identified**:

$$\mathbb{R}P^2 = S^2 / (x \sim -x)$$

Every point on the northern hemisphere is glued to its mirror point on the southern hemisphere. This means a direction and its opposite are the **same point** in $\mathbb{R}P^2$.

### Why Directions Without Signs Matter

Many concepts are inherently **unsigned** — they have magnitude but no natural positive/negative orientation:

- **Emotional intensity**: "very happy" and "very sad" are both *very*. The intensity axis doesn't care about valence.
- **Formality level**: "exceedingly" and "super" differ in formality, not in some signed direction.
- **Semantic similarity**: the similarity between "cat" and "dog" is the same as between "dog" and "cat" — it's an unsigned quantity.

In linear algebra terms, if we care about the **direction** of a vector but not its **sign**, we're working in projective space. The vector $v$ and $-v$ represent the same concept.

### Connection to Attention Heads

When a Transformer attention head computes:

$$\text{attention}(Q, K) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)$$

the dot product $QK^T$ measures **alignment** between query and key vectors. But alignment is almost projective — $q \cdot k$ and $(-q) \cdot (-k)$ give the same score. The attention mechanism is, in a sense, operating on a projective space of directions.

Some research has shown that attention heads learn to represent **axes of variation** (like tense, number, formality) as directions in embedding space. These axes are inherently projective — the "tense axis" doesn't have a natural positive end. Whether "past" is positive and "future" is negative, or vice versa, is an arbitrary convention.

### Betti Numbers of $\mathbb{R}P^2$

Over $\mathbb{Z}_2$ coefficients (which is natural for non-orientable spaces):

$$\beta_0 = 1, \quad \beta_1 = 1, \quad \beta_2 = 1 \quad (\text{with } \mathbb{Z}_2 \text{ coefficients})$$

Over $\mathbb{Z}$ coefficients:

$$\beta_0 = 1, \quad \beta_1 = 0, \quad \beta_2 = 0$$

The discrepancy between $\mathbb{Z}$ and $\mathbb{Z}_2$ Betti numbers is itself informative — it signals **torsion** in the homology, which is the algebraic signature of non-orientability.

### Euler Characteristic

$$\chi(\mathbb{R}P^2) = 1$$

This is unusual — most familiar surfaces have $\chi \leq 2$. The projective plane is the simplest **non-orientable closed surface**.
</div>

<div id="projective-viz"></div>

<div class="md">
## Fiber Bundles: How Context Twists Meaning

A **fiber bundle** is a space $E$ (the total space) that locally looks like a product $B \times F$ of a **base space** $B$ and a **fiber** $F$, but globally may be twisted. Formally, there is a projection $\pi: E \to B$ such that every point $b \in B$ has a neighborhood $U$ where $\pi^{-1}(U) \cong U \times F$.

### The Simplest Examples

- **Cylinder** $= S^1 \times [0,1]$: A fiber bundle over the circle with fiber $[0,1]$. It's **trivial** — the product structure is global, not just local.
- **Möbius strip**: Also a fiber bundle over $S^1$ with fiber $[0,1]$, but **non-trivial** — the fiber gets flipped as you go around the base.

The key question is always: **is the bundle trivial (a simple product) or twisted?**

### Meaning as a Fiber Bundle

Consider the word **"run"** in different contexts:

| Context (Base $B = S^1$) | Meaning (Fiber $F$) |
|---|---|
| "I **run** every morning" | Physical locomotion |
| "**Run** the program" | Execute software |
| "A **run** in her stockings" | A tear/defect |
| "The **run** of the show" | Duration/sequence |
| "**Run** for office" | Campaign/compete |

The base space is the **context** — it varies continuously as you read through different texts. The fiber at each point is the **space of possible meanings**. Locally, in any given paragraph, "run" has a stable meaning (the bundle looks like a product). But globally, as you traverse all possible contexts, the meaning fiber **twists**.

### The Structure Group

The **structure group** $G$ of a fiber bundle describes the symmetries that relate fibers at different points. For a trivial bundle, $G$ acts trivially. For a Möbius strip, $G = \mathbb{Z}_2$ (the fiber can be flipped or not).

For word meaning:
- If a word has $n$ discrete meanings, the structure group is (a subgroup of) the **symmetric group** $S_n$ — permutations of meanings.
- If meaning varies continuously, the structure group is a **Lie group** acting on the meaning space.

### Attention Heads as Local Trivializations

A **local trivialization** is a choice of coordinates that makes the bundle look like a product in some neighborhood. Different trivializations are related by **transition functions** $g_{ij}: U_i \cap U_j \to G$.

Each attention head provides a **local trivialization** of the meaning bundle:
- Head 1 might trivialized "run" in sports contexts (physical meaning is the "zero section")
- Head 2 might trivialize "run" in computing contexts (execution meaning is the "zero section")

The transition functions between these trivializations encode how meaning shifts when context changes — and these are precisely the **attention patterns** that the Transformer learns.

### The Connection (Parallel Transport)

A **connection** on a fiber bundle tells you how to "parallel transport" a fiber element along a path in the base. In our analogy:

$$\text{Connection} = \text{how meaning evolves as context changes}$$

If you start with "run" meaning "jog" and slowly shift the context from sports to computing, the connection tells you the trajectory through meaning space. The **curvature** of the connection measures how much meaning changes when you take different contextual paths to the same endpoint — this is the **holonomy**, and it's non-trivial precisely when the bundle is non-trivial.

$$\text{Holonomy} \neq 0 \iff \text{meaning depends on the path through context, not just the endpoint}$$

This is why the same word in the same final context can mean different things depending on what came before — the bundle has non-trivial holonomy.
</div>

<div id="fiber-viz"></div>

<div class="md">
## Winding Numbers: Detecting Circular Reasoning

The **winding number** of a closed curve $\gamma$ around a point $p$ counts how many times the curve wraps around that point. It's one of the most fundamental invariants in topology.

### Formal Definition

For a closed curve $\gamma: [0,1] \to \mathbb{R}^2 \setminus \{p\}$, the winding number is:

$$n(\gamma, p) = \frac{1}{2\pi} \oint_\gamma d\theta = \frac{1}{2\pi i} \oint_\gamma \frac{dz}{z - p}$$

where $\theta$ is the angle from $p$ to the curve. The winding number is always an **integer** — this is a topological fact. It's invariant under continuous deformations of the curve (as long as the curve doesn't cross $p$).

### Properties

- $n = 0$: The curve doesn't encircle the point. It can be continuously shrunk to a point without crossing $p$.
- $n = 1$: The curve goes around once counterclockwise.
- $n = -1$: The curve goes around once clockwise.
- $|n| > 1$: The curve wraps around multiple times.

The winding number is a **homomorphism** from the fundamental group of the punctured plane to the integers:

$$n: \pi_1(\mathbb{R}^2 \setminus \{p\}) \to \mathbb{Z}$$

In fact, this is an **isomorphism**: $\pi_1(\mathbb{R}^2 \setminus \{p\}) \cong \mathbb{Z}$, and the winding number is the complete invariant.

### Circular Reasoning as Winding

Consider an argument as a path through "claim space." The central point $p$ is the **thesis** — the claim being argued for. The path represents the chain of reasoning.

- **Winding number 0**: The argument never actually engages with the thesis. It wanders around but doesn't address the central claim. This is a **non sequitur**.
- **Winding number 1**: The argument makes one complete circuit around the thesis, engaging with it from all sides. This is a **sound argument**.
- **Winding number > 1**: The argument circles back to the same assumptions multiple times. This is **circular reasoning** — the argument passes through the same premises repeatedly, each time assuming what it's trying to prove.
- **Winding number −1**: The argument engages with the thesis but in the "wrong direction" — it actually argues against its own conclusion. This is a **self-defeating argument**.

### Connection to LLM Reasoning

When an LLM generates a chain-of-thought, we can (conceptually) plot the trajectory of its hidden states in embedding space. If the trajectory has:

- **Low winding number** around the answer: The model is exploring but not converging. It may give a wrong or irrelevant answer.
- **Winding number ≈ 1**: The model is building a coherent argument that addresses the question from multiple angles.
- **High winding number**: The model is going in circles — repeating the same reasoning steps, a known failure mode of autoregressive generation.

### The Argument Principle

In complex analysis, the **argument principle** states that for a meromorphic function $f$:

$$\frac{1}{2\pi i} \oint_\gamma \frac{f'(z)}{f(z)} dz = Z - P$$

where $Z$ is the number of zeros and $P$ the number of poles of $f$ inside $\gamma$. This connects winding numbers to the **structure of solutions** — how many times an argument "resolves" (zeros) vs. "blows up" (poles) inside the region of discourse.
</div>

<div id="winding-viz"></div>
