<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Layer Normalization
description: Keeping activations stable, the math behind GPT's pre-norm architecture.
icon: &#9878;
part: 3
order: 18
color: emerald
topics: math-i, math-ii, architecture
-->

<div class="md">
Layer Normalization (LN), introduced by Jimmy Lei Ba et al in \citeyear{ba2016layernorm} (in their paper '\citetitle{ba2016layernorm}'), rescales each layer's inputs to have a consistent mean and variance. The original paper motivated this by the need to stabilize the distribution of hidden states across the layers and time steps of a network, which makes the optimization landscape better behaved and allows for much higher learning rates and faster convergence. LN is sometimes loosely said to “prevent internal covariate shift”  a term coined for BatchNorm  but the original LN paper did not rely on that explanation; the practical benefit is improved training stability.

## The Mathematical Process
For a specific layer input vector $x$ with $d$ dimensions, the normalization follows these four steps:

* **Calculate Mean ($\mu$):** The average value across all features in that single layer.
    $$\mu = \frac{1}{d} \sum_{i=1}^{d} x_i$$
* **Calculate Variance ($\sigma^2$):** The average squared distance from the mean.
    $$\sigma^2 = \frac{1}{d} \sum_{i=1}^{d} (x_i - \mu)^2$$
* **Standardize:** Transform the features to have zero mean and unit variance ($\epsilon$ is a tiny constant for numerical stability).
    $$\hat{x}_i = \frac{x_i - \mu}{\sqrt{\sigma^2 + \epsilon}}$$
* **Scale and Shift:** Apply learnable parameters $\gamma$ (gain) and $\beta$ (bias) to allow the model to undo the normalization if that helps performance.
    $$y_i = \gamma \hat{x}_i + \beta$$

## Integration in Transformer Models (GPT)
In models like **GPT-3** and **GPT-4**, Layer Normalization is the “glue” that keeps the deep stack of blocks stable.

* **Pre-Norm Architecture:** In modern GPT models, LN is applied *before* the Multi-Head Attention and Feed-Forward networks. This creates a “clean” residual path, allowing gradients to flow through 96 layers without exploding or vanishing (together with residual skips). The “96 layers” figure is specific to GPT-3 (175B); other models use different depths, e.g., LLaMA-7B has ~32, LLaMA-70B has ~80, GPT-4 family is estimated around 100+ layers.
* **Independence from Batch Size:** Unlike Batch Norm, LN does not depend on other samples in the batch. This is vital for GPT because:
    * Inference often happens one sequence at a time (Batch Size = 1).
    * Sequence lengths can vary significantly.

## Usage in Other Model Types
* **RNNs / LSTMs:** LN is the preferred normalization for Recurrent Neural Networks because it can be applied to each time step independently, whereas Batch Norm struggles with the temporal dependency.
* **Computer Vision (ViT):** While standard CNNs use Batch Norm, **Vision Transformers (ViTs)** use Layer Normalization to treat image patches like *tokens in a sequence*.
</div>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- DATA MATRIX + PARAMETERS (moved to top)                        -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div style="
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 28px;
">
    <!-- Data Matrix -->
    <div style="
        position: relative;
        background: linear-gradient(160deg, rgba(99,102,241,0.08) 0%, rgba(16,185,129,0.05) 100%);
        backdrop-filter: blur(12px);
        padding: 24px;
        border-radius: 20px;
        border: 1px solid rgba(99,102,241,0.18);
        box-shadow: 0 4px 24px -4px rgba(0,0,0,0.06);
        overflow: hidden;
    ">
        <div style="
            position: absolute; bottom: -20px; left: -20px;
            width: 80px; height: 80px;
            background: radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
        "></div>

        <p style="
            margin: 0 0 4px 0;
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #6366f1;
        ">Data Matrix</p>
        <p style="font-size: 0.78rem; color: var(--mn-text-secondary); margin: 0 0 16px 0;">Click cells to edit values interactively</p>

        <table id="input-table" style="
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            text-align: center;
            background: var(--mn-surface, white);
            border: 1px solid var(--mn-border, #e2e8f0);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        "></table>
    </div>

    <!-- Learnable Parameters -->
    <div style="
        position: relative;
        background: linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(16,185,129,0.05) 100%);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        padding: 28px 32px;
        border-radius: 20px;
        border: 1px solid rgba(99,102,241,0.15);
        box-shadow:
            0 4px 24px -4px rgba(99,102,241,0.10),
            0 0 0 1px rgba(255,255,255,0.05) inset;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;
    ">
        <div style="
            position: absolute; top: -40px; right: -40px;
            width: 120px; height: 120px;
            background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
        "></div>

        <p style="
            margin: 0 0 18px 0;
            font-size: 0.7rem;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #6366f1;
        ">Learnable Parameters</p>

        <div style="display: flex; flex-direction: column; gap: 20px;">
            <div style="position: relative;">
                <label style="
                    display: block;
                    font-size: 0.78rem;
                    font-weight: 700;
                    color: var(--mn-text-secondary);
                    margin-bottom: 6px;
                    letter-spacing: 0.03em;
                ">Gamma <span style="color:#6366f1;">(γ)</span> — Gain</label>
                <input type="number" id="gamma-input" value="1.0" step="0.1" style="
                    width: 100%;
                    padding: 12px 14px;
                    border: 2px solid rgba(99,102,241,0.2);
                    border-radius: 12px;
                    background: var(--mn-surface, rgba(255,255,255,0.8));
                    font-size: 1.05rem;
                    font-weight: 600;
                    color: var(--mn-text, #1e293b);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    outline: none;
                    box-sizing: border-box;
                " onfocus="this.style.borderColor='#6366f1'; this.style.boxShadow='0 0 0 4px rgba(99,102,241,0.12)'"
                   onblur="this.style.borderColor='rgba(99,102,241,0.2)'; this.style.boxShadow='none'">
            </div>
            <div style="position: relative;">
                <label style="
                    display: block;
                    font-size: 0.78rem;
                    font-weight: 700;
                    color: var(--mn-text-secondary);
                    margin-bottom: 6px;
                    letter-spacing: 0.03em;
                ">Beta <span style="color:#10b981;">(β)</span> — Bias</label>
                <input type="number" id="beta-input" value="0.0" step="0.1" style="
                    width: 100%;
                    padding: 12px 14px;
                    border: 2px solid rgba(16,185,129,0.2);
                    border-radius: 12px;
                    background: var(--mn-surface, rgba(255,255,255,0.8));
                    font-size: 1.05rem;
                    font-weight: 600;
                    color: var(--mn-text, #1e293b);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    outline: none;
                    box-sizing: border-box;
                " onfocus="this.style.borderColor='#10b981'; this.style.boxShadow='0 0 0 4px rgba(16,185,129,0.12)'"
                   onblur="this.style.borderColor='rgba(16,185,129,0.2)'; this.style.boxShadow='none'">
            </div>
        </div>
    </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- CHART PANELS                                                   -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div style="
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 36px;
">
    <!-- Input Chart -->
    <div style="
        position: relative;
        background: linear-gradient(160deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.03) 100%);
        padding: 22px;
        border-radius: 20px;
        border: 1px solid rgba(99,102,241,0.2);
        box-shadow:
            0 8px 32px -8px rgba(99,102,241,0.10),
            0 2px 8px -2px rgba(0,0,0,0.04);
        overflow: hidden;
    ">
        <div style="
            position: absolute; top: 0; left: 0; right: 0; height: 4px;
            background: linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa);
            border-radius: 20px 20px 0 0;
        "></div>
        <p style="
            margin: 8px 0 12px 0;
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #6366f1;
        ">Input — Raw Magnitudes</p>
        <div id="input-plot" style="height: 320px;"></div>
    </div>

    <!-- Output Chart -->
    <div style="
        position: relative;
        background: linear-gradient(160deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.03) 100%);
        padding: 22px;
        border-radius: 20px;
        border: 1px solid rgba(16,185,129,0.2);
        box-shadow:
            0 8px 32px -8px rgba(16,185,129,0.10),
            0 2px 8px -2px rgba(0,0,0,0.04);
        overflow: hidden;
    ">
        <div style="
            position: absolute; top: 0; left: 0; right: 0; height: 4px;
            background: linear-gradient(90deg, #10b981, #34d399, #6ee7b7);
            border-radius: 20px 20px 0 0;
        "></div>
        <p style="
            margin: 8px 0 12px 0;
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #10b981;
        ">Output — Layer Normalized</p>
        <div id="output-plot" style="height: 320px;"></div>
    </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- MATH DISPLAY (full width)                                      -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div id="math-display" style="
    background: linear-gradient(160deg, rgba(99,102,241,0.06) 0%, rgba(99,102,241,0.02) 100%);
    padding: 32px;
    border-radius: 20px;
    border: 1px solid rgba(99,102,241,0.18);
    max-height: 550px;
    overflow-y: auto;
    box-shadow: 0 4px 24px -4px rgba(0,0,0,0.05);
    scrollbar-width: thin;
    scrollbar-color: #c7d2fe transparent;
"></div>

<div class="md">
## Geometric Intuition: LayerNorm as Projection onto a Sphere

LayerNorm has a beautiful geometric interpretation: after centering (subtracting the mean) and normalizing by the standard deviation, the output vector $\hat{x}$ lies on the surface of a **unit sphere** in $d$-dimensional space. The learnable parameters $\gamma$ and $\beta$ then stretch and shift this sphere.

**Step 1 - Centering:** Subtracting the mean $\mu$ shifts the cloud of vectors so that their center of mass is at the origin. This removes the “DC offset”  the shared common signal across all features.

**Step 2 - Normalization:** Dividing by the standard deviation $\sigma$ scales each vector to have unit length. Every vector now lies on the surface of a $d$-dimensional hypersphere of radius 1. The direction of the vector  the relative pattern of activations  is preserved, but its magnitude is standardized.

**Step 3 - Scale and Shift:** The learnable parameters $\gamma$ (gain) and $\beta$ (bias) allow the model to deform this sphere:
- $\gamma$ stretches or compresses the sphere along each axis (an anisotropic scaling)
- $\beta$ shifts the entire sphere away from the origin

The key insight: **LayerNorm separates direction from magnitude**. Only the *direction* of the activation vector carries information about the token's identity and context. The *magnitude* is discarded because it's unreliable  it can vary due to accumulated activations, layer depth, or input length. By projecting onto the unit sphere, LayerNorm forces the model to encode all information in angular relationships alone, making learning more stable and less sensitive to the absolute scale of activations.

This is why Transformers work well with Pre-Norm: the clean spherical geometry ensures that attention patterns depend only on the *angle* between query and key vectors, not their potentially erratic magnitudes.
</div>

<div class="md">
## Group Normalization: Slice the Channels, Normalize Once per Slice

To normalize a feature map, you first have to decide **which numbers get pooled into the same average**. LayerNorm says “all channels of one token”; BatchNorm says “this channel across all samples in the batch”. **Group Normalization (GN)** \cite{wu2018groupnorm} splits the $C$ channels into $G$ slices (groups), then for each group computes **one** mean and **one** std across that group's channels × all spatial positions.

The payoff: GN is **independent of the batch**, so it works at batch size 1 (essential for high-resolution image generation, where memory forces tiny batches), while still **preserving channel structure** that LayerNorm throws away. This is why every ResBlock of Stable Diffusion ends with `Conv → GroupNorm → SiLU`.

Drag the slider below and watch the same eight channels get regrouped.
</div>

<div id="gn-lab" style="max-width: 920px; margin: 1.5em auto; padding: 22px; background: linear-gradient(160deg, rgba(99,102,241,0.05), rgba(16,185,129,0.04)); border: 1px solid rgba(99,102,241,0.18); border-radius: 14px; box-shadow: 0 4px 24px -8px rgba(99,102,241,0.12);">
    <div style="display:flex; flex-wrap:wrap; align-items:center; gap:16px; margin-bottom:18px;">
        <label style="font-weight:700; color:var(--mn-text); white-space:nowrap;">
            Groups <em>G</em> =
            <span id="gn-G-val" style="display:inline-block; min-width:28px; padding:3px 10px; margin-left:4px; background:var(--mn-surface); border:1.5px solid #6366f1; border-radius:6px; color:#6366f1; font-family:Menlo,Consolas,monospace; font-weight:700; text-align:center;">4</span>
        </label>
        <input id="gn-G" type="range" min="1" max="8" value="4" style="flex:1; min-width:220px; accent-color:#6366f1; cursor:pointer;">
        <div id="gn-hint" style="font-size:12px; color:var(--mn-text-secondary); font-style:italic;"></div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:18px; margin-bottom:16px;">
        <div>
            <div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#6366f1; margin-bottom:8px;">① Input feature map (8 channels × 16 positions)</div>
            <div id="gn-input" style="background:var(--mn-surface); border:1px solid var(--mn-border, #e2e8f0); border-radius:10px; padding:10px; overflow-x:auto;"></div>
        </div>
        <div>
            <div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#10b981; margin-bottom:8px;">② After GroupNorm (γ = 1, β = 0)</div>
            <div id="gn-output" style="background:var(--mn-surface); border:1px solid var(--mn-border, #e2e8f0); border-radius:10px; padding:10px; overflow-x:auto;"></div>
        </div>
    </div>

    <div style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#6366f1; margin-bottom:8px;">③ One (μ, σ) per group  every cell in the group gets rescaled by it</div>
    <div id="gn-stats" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:10px;"></div>

    <div style="font-size:12px; color:var(--mn-text-secondary); margin-top:14px; line-height:1.55;">
        Hover any cell in ① to see the exact arithmetic $(x - \mu_g) / \sigma_g$. Cells in the <em>same</em> colored group share a single μ and σ; cells in <em>different</em> groups are normalized independently.
    </div>
</div>

<details class="md" style="max-width:920px; margin: 1em auto;">
    <summary style="cursor:pointer; font-weight:700; color:var(--mn-text); padding:10px 14px; background:var(--mn-surface); border:1px solid var(--mn-border, #e2e8f0); border-radius:8px;">Show me the math</summary>
    <div style="padding:14px 18px; background:var(--mn-surface); border:1px solid var(--mn-border, #e2e8f0); border-top:none; border-radius:0 0 8px 8px;">

For an input activation tensor $x \in \mathbb{R}^{N \times C \times H \times W}$, split the $C$ channels into $G$ groups of size $C/G$. For each group $g$, compute mean and variance over **that group's channels × all spatial positions**:

$$
\mu_g \;=\; \frac{1}{(C/G)\,H\,W} \sum_{c \in g}\sum_{h,w} x_{nchw}, \qquad
\sigma_g^2 \;=\; \frac{1}{(C/G)\,H\,W} \sum_{c \in g}\sum_{h,w} (x_{nchw} - \mu_g)^2
$$

Then normalize and apply a per-channel affine (the only learnable parameters):

$$
\hat{x}_{nchw} \;=\; \gamma_c \, \frac{x_{nchw} - \mu_g}{\sqrt{\sigma_g^2 + \epsilon}} \;+\; \beta_c, \qquad c \in g
$$

**The two dials.**

* **Number of groups $G$.** With $C$ channels, valid choices are $G \in \{1, 2, \ldots, C\}$ that divide $C$ (or use padding). Smaller $G$ = each statistic pools more numbers = lower variance, but throws away channel structure. Larger $G$ = each statistic is more local, but with too few samples per group the estimate gets noisy. Stable Diffusion's U-Net uses $G = 32$ with $C = 320$ or $640$ channels, i.e. groups of 10 or 20 channels.

* **Affine $\gamma_c, \beta_c$.** Two learnable vectors of length $C$. They let the network *undo* the normalization if it wants  the layer starts as pure centering + unit-variance and learns to deviate only if useful.

**Why this is the diffusion default.** BatchNorm fails at batch size 1. LayerNorm discards all channel relationships, treating every channel identically. GroupNorm keeps a knob ($G$) that lets you trade those two extremes against each other, and the answer it picks ($G = 32$) empirically wins on every high-resolution image benchmark. Notice that no term in the equations depends on $N$  the batch can be any size, including 1.

</div>
</details>

<div class="md">
**The two endpoints.**

* $G = 1$: one group, every channel pooled  exactly **LayerNorm**.
* $G = C$: each channel alone  exactly **InstanceNorm** (the style-transfer default).
* $G \in (1, C)$: the sweet spot; Stable Diffusion's U-Net uses $G = 32$.
</div>
