<?php include_once("functions.php"); ?>

<div class="md">
    <h2>Transformer Explorer: Neural Flow</h2>
    <p>Klicke auf die Vorhersagen, um den Satz zu bauen. Unbekannte Wörter werden <span style="color:red; text-decoration:underline;">rot markiert</span>.</p>
</div>

<div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
    <div style="display: flex; gap: 10px; align-items: flex-end;">
        <div style="flex-grow: 1;">
            <label style="font-weight: bold;">Input Sequenz:</label>
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
        <h4>0. Tokenisierung & ID-Mapping</h4>
        <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 10px;">
            In diesem Lab nutzen wir <b>Word-Level Tokenisierung</b> für bessere Lesbarkeit. In echten LLMs käme BPE zum Einsatz.
        </p>
        <div id="viz-tokens" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 15px;"></div>
        <div id="token-table-container"></div>
    </div>

    <div class="panel">
        <h4>1. Embedding Space (X: Macht, Y: Alter, Z: Geschlecht)</h4>
        <div id="plot-embeddings" style="height: 450px;"></div>
    </div>

    <div class="panel">
        <h4>2. Attention Matrix (Kontext-Beziehungen)</h4>
        <div style="display: flex; gap: 30px; align-items: flex-start;">
            <div id="attn-matrix-container" style="min-width: 250px;"></div>
            <div id="vector-details" style="flex-grow: 1;">
                <div class="math-tex" id="math-attn-base"></div>
                <div id="vector-list" style="margin-top:10px;"></div>
            </div>
        </div>
    </div>

    <div class="panel" style="background: #f0f9ff;">
        <h4>3. Volle Transformer-Gleichung (Forward Pass)</h4>
        <div id="res-ffn-viz" class="math-tex"></div>
    </div>

    <div class="panel" style="border: 2px solid #3b82f6;">
        <h4>4. Next Token Prediction (Softmax)</h4>
        <div id="prob-bars-container"></div>
    </div>

    <div class="panel" style="background: #fdf2f8; border: 1px dashed #ec4899;">
        <h4>5. De-Tokenisierung (Output Generierung)</h4>
        <div id="detokenize-output" style="font-family: 'Courier New', monospace; font-size: 1.1rem; padding: 10px; background: white; border-radius: 6px; border: 1px solid #f9a8d4;">
            </div>
    </div>
</div>

<style>
    .panel { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .math-tex { background: #f1f5f9; padding: 15px; border-radius: 8px; font-family: 'Times New Roman', serif; overflow-x: auto; border: 1px solid #e2e8f0; line-height: 1.6; }
    
    .attn-table { border-collapse: collapse; margin-top: 10px; }
    .attn-table th { font-size: 0.8rem; padding: 10px; color: #64748b; font-weight: bold; }
    .attn-table td { width: 50px; height: 50px; border: 2px solid #fff; text-align: center; font-size: 0.75rem; color: white; font-weight: bold; border-radius: 4px; }
    .row-label { text-align: right !important; padding-right: 15px !important; font-weight: bold; color: #1e293b; font-size: 0.85rem; border: none !important; }
    
    .prob-item { cursor: pointer; padding: 10px; border-radius: 8px; transition: background 0.2s; border: 1px solid transparent; }
    .prob-item:hover { background: #eff6ff; border-color: #3b82f6; }
    .vec-item { font-size: 0.8rem; padding: 5px; border-bottom: 1px solid #e2e8f0; font-family: monospace; }

    /* Token Table Style */
    .token-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; background: white; }
    .token-table th { text-align: left; padding: 8px; border-bottom: 2px solid #e2e8f0; color: #64748b; }
    .token-table td { padding: 8px; border-bottom: 1px solid #f1f5f9; font-family: monospace; }
</style>
