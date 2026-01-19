<?php include_once("functions.php"); ?>

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
    #prob-bars-container { max-height: 400px; overflow-y: auto; padding-right: 10px; }

    /* Token Chip Styles from PredictionLab */
    .token-chip { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; min-width: 80px; cursor: pointer; transition: 0.2s; position: relative; z-index: 10; }
    .token-chip:hover { border-color: #3b82f6; background: #eff6ff; transform: translateY(-2px); }
    .token-id { font-size: 0.65rem; color: #94a3b8; margin-bottom: 2px; }
    .token-word { font-weight: bold; color: #1e293b; }
</style>

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
		<input type="text" id="tf-input" class="bw-cell" style="width: 100%; font-family: monospace; background: transparent; position: relative; z-index: 2;" value="The" oninput="TransformerLab.run()">
		<div id="tf-input-overlay" style="position: absolute; top: 11px; left: 11px; width: 100%; font-family: monospace; color: transparent; pointer-events: none; white-space: pre; z-index: 1;"></div>
	    </div>
	</div>
	<button class="btn" onclick="TransformerLab.loadPreset('The')">Reset</button>
    </div>
</div>

<div class="transformer-grid" style="display: grid; gap: 20px;">

	<div class="panel" style="border-left: 5px solid #64748b;">
	    <h4>Tokenization & Attention Flow</h4>
	    <div style="position: relative; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow-x: auto; width: 100%; overflow-y: clip;">
		<div id="canvas-container" style="position: relative; min-width: 100%;">
		    <canvas id="attention-canvas" style="position: absolute; top: 0; left: 0; pointer-events: none;"></canvas>
		    
		    <div id="token-stream" style="display: flex; gap: 10px; justify-content: flex-start; padding: 60px 20px 20px 20px; white-space: nowrap; width: max-content;">
			</div>
		</div>
	    </div>
	    <div id="viz-tokens" style="display: none; gap: 8px; flex-wrap: wrap; margin-bottom: 15px;"></div>
	    <div id="token-table-container"></div>
	</div>

    <div class="panel">
	<h4>Semantic Embedding Space</h4>
	<div style="display: flex; gap: 15px; font-size: 0.75rem; margin-bottom: 10px; flex-wrap: wrap;">
	    <span><b style="color: #10b981;">&#11088;</b> Next Prediction</span>
	</div>
	<div id="plot-embeddings" style="height: 400px;"></div>
    </div>

<div class="panel" style="border: 2px solid #10b981; background: #f0fdf4;">
    <h4>Deep Training Lab (Full Backpropagation)</h4>
	<button onclick="TransformerLab.exportData()" class="btn">Export Model</button>
	<button onclick="TransformerLab.randomizeWeights()" class="btn" style="background: #64748b; color: white;">🎲 Randomize Weights</button>
    <p style="font-size: 0.85rem; color: #1e293b;">
	Trainiert <b>Embeddings</b>, <b>Attention ($W_q, W_k$)</b> und <b>FFN</b> gleichzeitig. 
    </p>

    <div style="margin-bottom: 15px;">
	<label style="font-size: 0.8rem; font-weight: bold; color: #065f46;">Learning Rate: <span id="lr-value">0.1</span></label>
	<input type="range" id="lr-slider" min="0.001" max="0.5" step="0.001" value="0.1" 
	       style="width: 100%; accent-color: #10b981;" 
	       oninput="document.getElementById('lr-value').innerText = this.value">
    </div>

    <textarea id="training-input" style="width: 100%; height: 80px; padding: 10px; border-radius: 8px; border: 1px solid #10b981; font-family: monospace; font-size: 0.8rem; margin-bottom: 10px;">
The king is brave and The queen is wise and The king is wise and The princess is brave and the prince is wise and the wise prince is brave and the brave king is wise and the brave queen is wise and the wise queen is brave
	</textarea>

    <div style="display: flex; gap: 10px; align-items: center;">
	<button id="train-btn" onclick="TransformerLab.toggleTraining()" style="background: #10b981; color: white; padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer; font-weight: bold; flex-grow: 1; transition: all 0.2s;">
	    🚀 Start Full Training
	</button>
	<div id="training-status" style="font-size: 0.85rem; font-weight: bold; min-width: 150px;">Bereit.</div>
    </div>

    <div style="width: 100%; background: #e2e8f0; height: 4px; margin-top: 10px; border-radius: 2px;">
	<div id="train-progress" style="width: 0%; background: #10b981; height: 100%; transition: width 0.1s;"></div>
    </div>

	<div id="loss-chart-container" style="display: none; margin-top: 15px;">
	    <div id="loss-plot" style="height: 200px; width: 100%;"></div>
	</div>

	<div style="width: 100%; background: #e2e8f0; height: 4px; margin-top: 10px; border-radius: 2px;">
	    <div id="train-progress" style="width: 0%; background: #10b981; height: 100%; transition: width 0.1s;"></div>
	</div>
</div>




<div class="panel" style="border-left: 5px solid #8b5cf6;">
    <h4>Projection Matrix Lab ($W_q$ & $W_k$)</h4>
    <p style="font-size: 0.85rem; color: #64748b;">
	Adjust the weights below to see how <b>Query</b> and <b>Key</b> transformations shift attention focus.
    </p>
    <div style="display: flex; gap: 250px; flex-wrap: wrap; justify-content: center;">
	<div>
	    <span style="font-weight: bold; color: #8b5cf6;">Query Matrix ($W_q$)</span>
	    <div id="wq-editor" class="matrix-grid"></div>
	</div>
	<div>
	    <span style="font-weight: bold; color: #ec4899;">Key Matrix ($W_k$)</span>
	    <div id="wk-editor" class="matrix-grid"></div>
	</div>
    </div>
    <div style="margin-top: 15px; text-align: center;">
	<button class="btn" onclick="TransformerLab.resetMatrices()">Reset All Matrices</button>
    </div>
</div>

<div class="panel" style="border-left: 5px solid #f59e0b;">
    <h4>The Feed-Forward Matrix ($W_{ffn}$)</h4>
    <div style="display: flex; gap: 30px; align-items: start; flex-wrap: wrap;">
	<div>
	    <span style="font-weight: bold; color: #f59e0b;">Edit Weights:</span>
	    <div id="ffn-editor" style="margin-top: 10px; background: #f8fafc; padding: 10px; border-radius: 8px;"></div>
	</div>
	<div>
	    <span style="font-weight: bold; color: #64748b;">Heatmap:</span>
	    <div id="ffn-matrix-container"></div>
	</div>
	<div style="flex-grow: 1; font-size: 0.85rem; background: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fef3c7;">
		<p>The matrix $W_{ffn}$ acts as the model's <b>"knowledge bank."</b> It maps the semantic traits of the current word to the expected traits of the next word.</p>
	</div>
    </div>


	    <div style="margin-top: 15px; text-align: center;">
		<button class="btn" onclick="TransformerLab.resetMatrices()">Reset to Identity</button>
	    </div>
	</div>
</div>

    <div class="panel">
	<h4>Attention (Contextual Mixing)</h4>
	<div style="flex-grow: 1; font-size: 0.85rem; background: #f0f7ff; padding: 15px; border-radius: 8px; border: 1px solid #bae6fd; margin-bottom: 20px;">
	    <p>
	    The <b>Attention Layer</b> is the model's communication hub. While individual word embeddings only know their own meaning, Attention allows them to "look" at other words in the sequence to gain <b>context</b>.
	    </p>
	</div>
	<div style="display: flex; flex-direction: column; gap: 30px;">
	    <div id="attn-matrix-container" style="overflow-x: auto; width: 100%;"></div>
	    <div id="vector-details">
		<div class="math-tex" id="math-attn-base"></div>
	    </div>
	</div>
    </div>

    <div class="panel" style="background: #f0f9ff;">
	<h4>Layer Flow & Residuals</h4>
	<div id="res-ffn-viz" class="math-tex"></div>
    </div>

    <div class="panel" style="border: 2px solid #3b82f6;">
	<h4>Next Token Prediction (Softmax)</h4>
	<div id="prob-bars-container"></div>
    </div>

</div>
