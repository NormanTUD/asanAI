<?php include_once("functions.php"); ?>

<div class="md">
    <h2>Transformer Lab: Der Forward Pass</h2>
    <p>Verfolge live, wie ein Text durch die einzelnen Schichten eines Mini-Transformers fließt.</p>
</div>

<div style="background: #f1f5f9; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
    <div style="display: flex; gap: 10px; align-items: flex-end;">
        <div style="flex-grow: 1;">
            <label style="font-weight: bold;">Input Text (Sequenz):</label>
            <input type="text" id="tf-input" class="bw-cell" style="width: 100%;" value="Der Roboter lernt" oninput="TransformerLab.run()">
        </div>
        <button class="btn" onclick="TransformerLab.loadPreset('KI ist super')">Preset 1</button>
        <button class="btn" onclick="TransformerLab.loadPreset('Mathematik macht Spaß')">Preset 2</button>
    </div>
</div>

<div id="transformer-pipeline" style="display: flex; flex-direction: column; gap: 20px;">
    
    <div class="panel">
        <h4>1. Input Processing (Tokenizer & Embedding)</h4>
        <div id="step-embedding" class="math-tex"></div>
        <div class="viz-container" id="viz-tokens" style="display:flex; gap:5px; margin-top:10px;"></div>
    </div>

    <div class="panel">
        <h4>2. Multi-Head Attention (Self-Attention)</h4>
        <p style="font-size: 0.8rem; color: #64748b;">Berechnet die Relevanz der Wörter zueinander (Attention Scores).</p>
        <div id="step-attention" style="overflow-x: auto;"></div>
        <div id="math-attention" class="math-tex" style="margin-top:10px;"></div>
    </div>

    <div class="panel" style="background: #fffbeb;">
        <h4>3. Residual Connection & Layer Norm (Add & Norm)</h4>
        <div id="step-addnorm" class="math-tex"></div>
    </div>

    <div class="panel">
        <h4>4. Position-wise Feed Forward (Dense Layers)</h4>
        <div id="step-ffn" class="math-tex"></div>
    </div>

    <div class="panel" style="border: 2px solid #3b82f6;">
        <h4>5. Output: Linear & Softmax (Next Token Prediction)</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div id="step-logits" class="math-tex"></div>
            <div id="step-softmax">
                <div id="prob-bars-tf"></div>
            </div>
        </div>
    </div>
</div>

<style>
    .panel { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; }
    .math-tex { font-family: 'Times New Roman', serif; background: #f8fafc; padding: 10px; border-radius: 6px; overflow-x: auto; }
    .attention-grid { display: grid; gap: 2px; }
    .attn-cell { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: white; border-radius: 2px; }
</style>
