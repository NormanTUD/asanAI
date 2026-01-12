<?php include_once("functions.php"); ?>

<div class="md">
    <h2>Transformer Explorer: Neural Flow</h2>
    <p>Click on the predictions at the end to build the sentence.</p>

    <div id="top-prediction-bar" style="display: flex; gap: 10px; margin-bottom: 15px; align-items: center;">
        <span style="font-weight: bold; color: #3b82f6;">Next:</span>
        <div id="top-tokens-container" style="display: flex; gap: 8px;"></div>
    </div>
</div>

<div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
    <div style="display: flex; gap: 10px; align-items: flex-end;">
        <div style="flex-grow: 1;">
            <label style="font-weight: bold;">Input Sequence:</label>
            <div id="tf-input-container" style="position: relative;">
                <input type="text" id="tf-input" class="bw-cell" style="width: 100%; font-family: monospace; background: transparent; position: relative; z-index: 2;" value="The king is" oninput="TransformerLab.run()">
                <div id="tf-input-overlay" style="position: absolute; top: 11px; left: 11px; width: 100%; font-family: monospace; color: transparent; pointer-events: none; white-space: pre; z-index: 1;"></div>
            </div>
        </div>
        <button class="btn" onclick="TransformerLab.loadPreset('The queen is')">Reset</button>
    </div>
</div>

<div class="transformer-grid" style="display: grid; gap: 20px;">
    
    <div class="panel" style="border-left: 5px solid #64748b;">
        <h4>0. Tokenization</h4>
        <div id="viz-tokens" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 15px;"></div>
        <div id="token-table-container"></div>
    </div>

    <div class="panel">
        <h4>1. Semantic Embedding Space</h4>
        <div style="display: flex; gap: 15px; font-size: 0.75rem; margin-bottom: 10px; flex-wrap: wrap;">
            <span><b style="color: #ec4899;">●</b> Noun</span>
            <span><b style="color: #8b5cf6;">●</b> Verb</span>
            <span><b style="color: #f59e0b;">●</b> Adjective</span>
            <span><b style="color: #94a3b8;">●</b> Other</span>
            <span><b style="color: #10b981;">▲</b> Next Prediction</span>
        </div>
        <div id="plot-embeddings" style="height: 400px;"></div>
    </div>

    <div class="panel">
        <h4>2. Attention (Contextual Mixing)</h4>
        <div style="display: flex; gap: 30px; align-items: flex-start; flex-wrap: wrap;">
            <div id="attn-matrix-container" style="min-width: 250px;"></div>
            <div id="vector-details" style="flex-grow: 1;">
                <div class="math-tex" id="math-attn-base"></div>
            </div>
        </div>
    </div>

    <div class="panel" style="border-left: 5px solid #f59e0b;">
        <h4>3. The Feed-Forward Matrix ($W_{ffn}$)</h4>
        <div style="display: flex; gap: 30px; align-items: center; flex-wrap: wrap;">
            <div id="ffn-matrix-container"></div>

<div style="flex-grow: 1; font-size: 0.85rem; background: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fef3c7;">
    <p>The matrix $W_{ffn}$ acts as the model's <b>"knowledge bank."</b> It maps the semantic traits of the current word to the expected traits of the next word:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px; background: white; font-size: 0.8rem;">
        <thead>
            <tr style="border-bottom: 2px solid #fef3c7; text-align: left;">
                <th style="padding: 8px; color: #92400e;">Input Feature</th>
                <th style="padding: 8px; color: #92400e;">Action</th>
                <th style="padding: 8px; color: #92400e;">Logic & Grammatical Goal</th>
            </tr>
        </thead>
        <tbody>
            <tr style="border-bottom: 1px solid #fffbeb;">
                <td style="padding: 8px;"><b>Power</b> (Row 0)</td>
                <td style="padding: 8px;">$\rightarrow$ <b>Status</b> (1.0)</td>
                <td style="padding: 8px;">When a "Powerful" noun (King/Queen) is detected, the model shifts focus heavily to <b>Status/Age</b> to find a fitting verb or state.</td>
            </tr>
            <tr style="border-bottom: 1px solid #fffbeb;">
                <td style="padding: 8px;"><b>Status</b> (Row 1)</td>
                <td style="padding: 8px;">$\rightarrow$ <b>Type</b> (0.8)</td>
                <td style="padding: 8px;">Verbs (which carry status/time info) signal that a <b>Function word</b> (like "in" or "a") is likely to follow next.</td>
            </tr>
            <tr style="border-bottom: 1px solid #fffbeb;">
                <td style="padding: 8px;"><b>Gender</b> (Row 2)</td>
                <td style="padding: 8px;">$\rightarrow$ <b>Type</b> (0.9) & <b>Power</b> (0.8)</td>
                <td style="padding: 8px;">Adjectives (carrying gender/description) look for <b>Power</b> (the noun they describe) or <b>Type</b> (conjunctions like "and").</td>
            </tr>
            <tr>
                <td style="padding: 8px;"><b>Type</b> (Row 3)</td>
                <td style="padding: 8px;">$\rightarrow$ <b>Power</b> (0.8)</td>
                <td style="padding: 8px;">Function words (like "The") are the strongest predictors for a <b>High-Power Noun</b> (the subject of the sentence).</td>
            </tr>
        </tbody>
    </table>

    <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 6px; border: 1px dashed #f59e0b;">
        <small><b>Why the Zeros?</b> Values of <b>0.00</b> (like Status $\rightarrow$ Power) act as logical gates. They prevent the model from making illegal moves, such as predicting a subject immediately after an action without proper context.</small>
    </div>
</div>

        </div>
    </div>

    <div class="panel" style="background: #f0f9ff;">
        <h4>4. Layer Flow & Residuals</h4>
        <div id="res-ffn-viz" class="math-tex"></div>
    </div>

    <div class="panel" style="border: 2px solid #3b82f6;">
        <h4>5. Next Token Prediction (Softmax)</h4>
        <div id="prob-bars-container"></div>
    </div>
</div>

<style>
    .panel { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .math-tex { background: #f1f5f9; padding: 15px; border-radius: 8px; font-family: 'Times New Roman', serif; overflow-x: auto; border: 1px solid #e2e8f0; line-height: 2.2; }
    .attn-table { border-collapse: collapse; margin-top: 10px; }
    .attn-table th { font-size: 0.8rem; padding: 10px; color: #64748b; font-weight: bold; }
    .attn-table td { width: 60px; height: 50px; border: 2px solid #fff; text-align: center; font-size: 0.75rem; font-weight: bold; border-radius: 4px; }
    .row-label { text-align: right !important; padding-right: 15px !important; font-weight: bold; color: #64748b !important; font-size: 0.85rem; border: none !important; }
    .prob-item { cursor: pointer; padding: 10px; border-radius: 8px; transition: background 0.2s; border: 1px solid transparent; }
    .prob-item:hover { background: #eff6ff; border-color: #3b82f6; }
    .token-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; background: white; margin-top: 10px; }
    .token-table th { text-align: left; padding: 8px; border-bottom: 2px solid #e2e8f0; color: #64748b; }
    .token-table td { padding: 8px; border-bottom: 1px solid #f1f5f9; font-family: monospace; }
#prob-bars-container {
    max-height: 400px;
    overflow-y: auto;
    padding-right: 10px;
}
</style>
