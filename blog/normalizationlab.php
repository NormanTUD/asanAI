<?php include_once("functions.php"); ?>

<section style="font-family: 'Segoe UI', system-ui, sans-serif; width: 100%; padding: 20px; color: #1e293b; box-sizing: border-box;">

    <div class="md">
        <h1>⚖️ Layer Normalization Mechanics</h1>
        <p>Layer Normalization (LN) is a technique used to stabilize the hidden state dynamics of deep neural networks. While Batch Normalization operates vertically across a batch of samples, Layer Normalization operates **horizontally** across the feature dimension for each individual sample.</p>

        <h3>Core Objectives:</h3>
        <ul>
            <li><strong>Eliminating Internal Covariate Shift:</strong> By fixing the mean and variance (or min-max range) of layer inputs, we prevent the "drifting" of distributions.</li>
            <li><strong>Sequence Invariance:</strong> LN is the standard for NLP because it treats each word or token independently.</li>
            <li><strong>Numerical Stability:</strong> It prevents gradients from vanishing or exploding by ensuring activations don't grow exponentially.</li>
        </ul>
    </div>

    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <div style="background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <h3 style="margin-top:0;">1. Input (Raw Magnitudes)</h3>
            <div id="input-plot" style="height: 350px;"></div>
        </div>
        <div style="background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <h3 style="margin-top:0;">2. Output (Layer Normalized: -1 to 1)</h3>
            <div id="output-plot" style="height: 350px;"></div>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 350px 1fr; gap: 30px; align-items: start;">
        <aside>
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1;">
                <h4 style="margin-top:0;">⚙️ Execution</h4>
                <button onclick="NormLab.process()" style="width:100%; padding:14px; background:#10b981; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; font-size: 1rem;">Run Layer Norm</button>
                <div style="margin-top:20px; font-size: 0.85rem; line-height: 1.4; color: #475569;">
                    <strong>Input Data Matrix:</strong>
                    <table id="input-table" style="width:100%; margin-top:10px; border-collapse: collapse; text-align: center; background: white; border: 1px solid #e2e8f0;"></table>
                </div>
            </div>
        </aside>

        <article>
            <div id="math-display" style="background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; min-height: 400px; margin-bottom: 20px;">
                <div style="color: #94a3b8; margin-top: 40px;">
                    <p style="font-size: 1.2rem;">Detailed mathematical steps will be displayed here upon execution.</p>
                </div>
            </div>
            <div style="background: #f1f5f9; padding: 30px; border-radius: 12px; line-height: 1.6;">
                <h3 style="margin-top:0;">Intuition behind the transformation</h3>
                <p>By applying Layer Normalization, we force both samples into the same range while preserving the <strong>relative importance</strong> of each feature within that sample.</p>
            </div>
        </article>
    </div>
</section>
