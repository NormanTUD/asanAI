<style>
    .lab-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
    .token-chip { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; min-width: 80px; cursor: pointer; transition: 0.2s; }
    .token-chip:hover { border-color: #3b82f6; background: #eff6ff; transform: translateY(-2px); }
    
    /* Ordered Prediction List Styles */
    #prob-container { display: flex; flex-direction: column; gap: 8px; margin-top: 15px; }
    .prob-row { padding: 12px; border: 1px solid #f1f5f9; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; background: #fff; }
    .prob-row:hover { border-color: #3b82f6; background: #f0f7ff; transform: translateX(5px); }
    .prob-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .prob-word { font-weight: 600; color: #1e293b; font-size: 14px; }
    .prob-value { color: #3b82f6; font-family: monospace; font-weight: bold; }
    .prob-bar-bg { background: #f1f5f9; height: 6px; border-radius: 3px; overflow: hidden; }
    .prob-bar-fill { background: #3b82f6; height: 100%; border-radius: 3px; transition: width 0.4s ease-out; }

    .btn { background: #3b82f6; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; transition: 0.2s; }
    .btn:hover { background: #2563eb; }
</style>

<div class="md">
    <h2>🧩 Neural Linguistic Playground</h2>
    <p>Explore how the Transformer architecture predicts the next token based on learned probability distributions.</p>

    <div class="grid-layout" style="display: grid; grid-template-columns: 1fr 350px; gap: 25px;">
        
        <div class="layers-vertical">
            <div class="lab-card">
                <span style="font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">1. Self-Attention Map</span>
                <canvas id="attention-canvas" style="width: 100%; height: 150px;"></canvas>
                <div id="token-stream" style="display: flex; gap: 10px; justify-content: flex-start; margin-top: 10px; flex-wrap: wrap;"></div>
            </div>

            <div class="lab-card">
                <span style="font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">2. Next Token Prediction (Sorted)</span>
                <p style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 10px;">The model calculates the most likely word to follow the current sequence.</p>
                <div id="prob-container"></div>
            </div>
        </div>

        <div class="lab-card">
            <span style="font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">3. 3D Embedding Space</span>
            <div id="embedding-plot" style="width: 100%; height: 400px;"></div>
            <div style="font-size: 0.8rem; color: #475569; margin-top: 15px; padding: 12px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <strong>Spatial Semantics:</strong> In high-dimensional space, words with similar meanings are geometrically close. This allows the model to "generalize" between concepts.
            </div>
            <button class="btn" onclick="currentSentence=['The','King']; renderAll();" style="margin-top: 20px;">Reset Session</button>
        </div>

    </div>
</div>
