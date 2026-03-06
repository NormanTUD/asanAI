<?php include_once("functions.php"); ?>

<div class="md">
Layer Normalization (LN), introduced by Jimmy Lei Ba et al in \citeyear{ba2016layernorm} (in their paper '\citetitle{ba2016layernorm}'), ensures that the inputs to each layer have a consistent mean and variance. This prevents "internal covariate shift" and allows for much higher learning rates and faster convergence.

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
In models like **GPT-3** and **GPT-4**, Layer Normalization is the "glue" that keeps the deep stack of blocks stable.

* **Pre-Norm Architecture:** In modern GPT models, LN is applied *before* the Multi-Head Attention and Feed-Forward networks. This creates a "clean" residual path, allowing gradients to flow through 100+ layers without exploding or vanishing (together with residual skips).
* **Independence from Batch Size:** Unlike Batch Norm, LN does not depend on other samples in the batch. This is vital for GPT because:
    * Inference often happens one sequence at a time (Batch Size = 1).
    * Sequence lengths can vary significantly.

## Usage in Other Model Types
* **RNNs / LSTMs:** LN is the preferred normalization for Recurrent Neural Networks because it can be applied to each time step independently, whereas Batch Norm struggles with the temporal dependency.
* **Computer Vision (ViT):** While standard CNNs use Batch Norm, **Vision Transformers (ViTs)** use Layer Normalization to treat image patches like tokens in a sequence.
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
        background: linear-gradient(160deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,0.9) 100%);
        backdrop-filter: blur(12px);
        padding: 24px;
        border-radius: 20px;
        border: 1px solid rgba(99,102,241,0.1);
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
        <p style="font-size: 0.78rem; color: #94a3b8; margin: 0 0 16px 0;">Click cells to edit values interactively</p>

        <table id="input-table" style="
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            text-align: center;
            background: white;
            border: 1px solid #e2e8f0;
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
                    color: #475569;
                    margin-bottom: 6px;
                    letter-spacing: 0.03em;
                ">Gamma <span style="color:#6366f1;">(γ)</span> — Gain</label>
                <input type="number" id="gamma-input" value="1.0" step="0.1" style="
                    width: 100%;
                    padding: 12px 14px;
                    border: 2px solid rgba(99,102,241,0.2);
                    border-radius: 12px;
                    background: rgba(255,255,255,0.8);
                    font-size: 1.05rem;
                    font-weight: 600;
                    color: #1e293b;
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
                    color: #475569;
                    margin-bottom: 6px;
                    letter-spacing: 0.03em;
                ">Beta <span style="color:#10b981;">(β)</span> — Bias</label>
                <input type="number" id="beta-input" value="0.0" step="0.1" style="
                    width: 100%;
                    padding: 12px 14px;
                    border: 2px solid rgba(16,185,129,0.2);
                    border-radius: 12px;
                    background: rgba(255,255,255,0.8);
                    font-size: 1.05rem;
                    font-weight: 600;
                    color: #1e293b;
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
        background: linear-gradient(160deg, #ffffff 0%, #f8fafc 100%);
        padding: 22px;
        border-radius: 20px;
        border: 1px solid rgba(99,102,241,0.12);
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
        background: linear-gradient(160deg, #ffffff 0%, #f0fdf4 100%);
        padding: 22px;
        border-radius: 20px;
        border: 1px solid rgba(16,185,129,0.12);
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
    background: linear-gradient(160deg, #ffffff 0%, #fafbff 100%);
    padding: 32px;
    border-radius: 20px;
    border: 1px solid rgba(99,102,241,0.08);
    max-height: 550px;
    overflow-y: auto;
    box-shadow: 0 4px 24px -4px rgba(0,0,0,0.05);
    scrollbar-width: thin;
    scrollbar-color: #c7d2fe transparent;
"></div>
