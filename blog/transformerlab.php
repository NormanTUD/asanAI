<?php include_once("functions.php"); ?>

<div class="md">
    <h2>Transformer Explorer: Deep Dive</h2>
    <p>Verfolge, wie Text durch die Schichten eines Transformers wandert. Jede Matrix ist real berechnet.</p>
</div>

<div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
    <div style="display: flex; gap: 10px; align-items: flex-end;">
        <div style="flex-grow: 1;">
            <label style="font-weight: bold;">Input Sequenz:</label>
            <input type="text" id="tf-input" class="bw-cell" style="width: 100%;" value="The king" oninput="TransformerLab.run()">
        </div>
        <button class="btn" onclick="TransformerLab.appendNext()">Next Token anfügen</button>
        <button class="btn" onclick="TransformerLab.loadPreset('The queen')">Reset</button>
    </div>
    <div id="token-stream" style="margin-top:10px; display:flex; gap:5px;"></div>
</div>

<div class="transformer-grid" style="display: grid; gap: 20px;">

    <div class="panel">
        <h4>1. Input Embeddings (3D Semantic Space)</h4>
        <p>Dimensionen: X=Macht, Y=Alter, Z=Geschlecht</p>
        <div id="plot-embeddings" style="height: 400px;"></div>
    </div>

    <div class="panel">
        <h4>2. Multi-Head Attention (Self-Attention)</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div id="plot-attn-heatmap" style="height: 300px;"></div>
            <div id="math-attn-details" class="math-tex" style="font-size: 0.85rem;"></div>
        </div>
    </div>

    <div class="panel">
        <h4>3. Residual Connection (ResNet) & Layer Norm</h4>
        <div id="resnet-viz" style="display: flex; justify-content: space-around; align-items: center; padding: 20px; background: #fffbeb;">
            <div id="res-in" class="math-tex"></div>
            <div style="font-size: 2rem;">+</div>
            <div id="res-f" class="math-tex"></div>
            <div style="font-size: 2rem;">=</div>
            <div id="res-out" class="math-tex"></div>
        </div>
    </div>

    <div class="panel">
        <h4>4. Position-wise Feed Forward (FFN)</h4>
        <div id="ffn-viz" class="math-tex"></div>
    </div>

    <div class="panel" style="border: 2px solid #3b82f6;">
        <h4>5. Final Softmax (Prediction)</h4>
        <div id="plot-softmax" style="height: 250px;"></div>
    </div>
</div>

<style>
    .panel { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
    .math-tex { background: #f1f5f9; padding: 10px; border-radius: 6px; font-family: 'Courier New', monospace; overflow-x: auto; }
    .transformer-grid { grid-template-columns: 1fr; }
    .badge-tk { background: #3b82f6; color: white; padding: 4px 10px; border-radius: 15px; font-size: 0.8rem; font-weight: bold; }
</style>
