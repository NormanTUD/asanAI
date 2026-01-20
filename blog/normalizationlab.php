<?php include_once("functions.php"); ?>

<section style="font-family: 'Segoe UI', system-ui, sans-serif; width: 100%; padding: 20px; color: #1e293b; box-sizing: border-box;">

<div class="md">

## Understanding Layer Normalization

Layer Normalization (LN) ensures that the inputs to each layer have a consistent mean and variance. This prevents "internal covariate shift" and allows for much higher learning rates and faster convergence.

### The Mathematical Process
For a specific layer input vector $x$ with $d$ dimensions, the normalization follows these four steps:

* **Calculate Mean ($\mu$):** The average value across all features in that single layer.
    $$\mu = \frac{1}{d} \sum_{i=1}^{d} x_i$$
* **Calculate Variance ($\sigma^2$):** The average squared distance from the mean.
    $$\sigma^2 = \frac{1}{d} \sum_{i=1}^{d} (x_i - \mu)^2$$
* **Standardize:** Transform the features to have zero mean and unit variance ($\epsilon$ is a tiny constant for numerical stability).
    $$\hat{x}_i = \frac{x_i - \mu}{\sqrt{\sigma^2 + \epsilon}}$$
* **Scale and Shift:** Apply learnable parameters $\gamma$ (gain) and $\beta$ (bias) to allow the model to undo the normalization if that helps performance.
    $$y_i = \gamma \hat{x}_i + \beta$$

### Integration in Transformer Models (GPT)
In models like **GPT-3** and **GPT-4**, Layer Normalization is the "glue" that keeps the deep stack of blocks stable.

* **Pre-Norm Architecture:** In modern GPT models, LN is applied *before* the Multi-Head Attention and Feed-Forward networks. This creates a "clean" residual path, allowing gradients to flow through 100+ layers without exploding or vanishing.
* **Independence from Batch Size:** Unlike Batch Norm, LN does not depend on other samples in the batch. This is vital for GPT because:
    * Inference often happens one sequence at a time (Batch Size = 1).
    * Sequence lengths can vary significantly.

### Usage in Other Model Types
* **RNNs / LSTMs:** LN is the preferred normalization for Recurrent Neural Networks because it can be applied to each time step independently, whereas Batch Norm struggles with the temporal dependency.
* **Computer Vision (ViT):** While standard CNNs use Batch Norm, **Vision Transformers (ViTs)** use Layer Normalization to treat image patches like tokens in a sequence.


</div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <div style="background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <h3 style="margin-top:0;">1. Input (Raw Magnitudes)</h3>
            <div id="input-plot" style="height: 350px;"></div>
        </div>
        <div style="background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <h3 style="margin-top:0;">2. Output (Layer Normalized)</h3>
            <div id="output-plot" style="height: 350px;"></div>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 350px 1fr; gap: 30px; align-items: start;">
        <aside>
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1;">
                <h4 style="margin-top:0;">⚙️ Data Matrix</h4>
                <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 10px;">Click and type in the cells below to edit data:</p>
                <table id="input-table" style="width:100%; border-collapse: collapse; text-align: center; background: white; border: 1px solid #e2e8f0;"></table>
                <button onclick="NormLab.process()" style="width:100%; margin-top:15px; padding:12px; background:#10b981; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">Refresh Calculations</button>
            </div>
        </aside>

        <article>
            <div id="math-display" style="background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; min-height: 400px;">
                </div>
        </article>
    </div>
</section>
