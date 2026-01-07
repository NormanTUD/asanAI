    <h2>Deep Learning Lab</h2>
    <div style="margin-bottom: 15px; display: flex; gap: 10px;">
        <button class="btn" onclick="loadPreset('AND')">AND</button>
        <button class="btn" onclick="loadPreset('XOR')">XOR</button>
        LR: <input type="number" id="deep-lr" value="0.05" step="0.01">
        Epochs: <input type="number" id="deep-epochs" value="100">
    </div>
    <div class="grid-layout">
        <div id="deep-gui" class="layers-vertical"></div>
        <div>
            <div id="fcnn_wrapper">
                <canvas id="fcnn_canvas"></canvas>
            </div>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <div id="deep-loss-chart" class="plot-container"></div>
                <div id="deep-data-chart" class="plot-container"></div>
            </div>
            <div style="margin-top: 10px;">
                <b>Weights (Live):</b>
                <div id="deep-tensor-viz" style="display:flex; gap:5px; flex-wrap: wrap;"></div>
            </div>
            <div id="deep-math-monitor" style="padding:15px; margin-top:10px;"></div>
            <table id="deep-train-table">
                <thead><tr id="deep-thr"></tr></thead>
                <tbody></tbody>
            </table>
            <button class="btn" style="background:#10b981; color:white; width:100%" onclick="addRow('deep')">+ Neue Datenzeile</button>
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top:10px;">
                <div id="manual-input-area" style="display:inline-block; margin: 0 10px;"></div>
                <span>→ <strong id="manual-result" style="color:#b45309">0.00</strong></span>
            </div>
            <button id="btn-deep-train" class="btn btn-train" onclick="toggleTraining('deep')">🚀 Training Starten</button>
            <button class="btn" style="background:#64748b; color:white; width:100%" onclick="initBlock('deep')">🔄 Reset Modell</button>
            <div id="deep-console" class="status-console"></div>
        </div>
    </div>

