<?php include_once("functions.php"); ?>
<style>
    :root { --panel-bg: #f8fafc; --border-clr: #e2e8f0; --accent: #3b82f6; }
    .lab-dashboard {
        display: grid;
        grid-template-columns: 320px 1fr 320px;
        grid-template-rows: auto 1fr;
        gap: 15px;
        height: 98vh;
        padding: 10px;
        box-sizing: border-box;
        overflow: hidden;
    }
    .panel { 
        background: var(--panel-bg); 
        border: 1px solid var(--border-clr); 
        border-radius: 12px; 
        padding: 15px; 
        overflow-y: auto;
    }
    .header-full { grid-column: 1 / span 3; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border-clr); padding-bottom: 5px; }
    .plot-container { height: 300px; background: white; border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--border-clr); }
    .math-container { background: white; padding: 15px; border-radius: 8px; border: 1px solid var(--border-clr); margin-top: 10px; }
    .predict-box { background: #eff6ff; padding: 10px; border-radius: 8px; border: 1px solid #bfdbfe; margin-top: 10px; display: flex; align-items: center; gap: 10px; font-weight: bold; }
    .math-tex { font-size: 0.85em; line-height: 1.5; }
    input:disabled, button:disabled { opacity: 0.5; cursor: not-allowed; }
    .slider-group { margin-bottom: 8px; font-size: 0.8em; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    .slider-group input { width: 100%; accent-color: var(--accent); }
    .heatmap-canvas { border: 1px solid #ccc; width: 100%; height: 60px; image-rendering: pixelated; margin-bottom: 10px; }
</style>

<div class="lab-dashboard">
    <div class="header-full">
        <h2 style="margin:0;">🧠 KI-Labor: Live-Inferenz & Training</h2>
        <div>
            <button id="btn-deep-train" class="btn btn-train" onclick="toggleTraining('deep')">🚀 Start Training</button>
            <button class="btn btn-stop" onclick="configs.deep.isTraining = false">⏹️ Stop</button>
        </div>
    </div>

    <div class="panel">
        <h3>🎛️ Daten & Hyperparameter</h3>
        <div style="max-height: 180px; overflow-y: auto; margin-bottom: 10px;">
            <table id="deep-train-table" class="table">
                <thead><tr id="deep-thr"></tr></thead>
                <tbody></tbody>
            </table>
        </div>
        <button class="btn" onclick="addRow('deep')" style="width:100%; margin-bottom:10px;">+ Datenpunkt</button>
        <hr>
        <label>Learning Rate: <span id="lr-val">0.1</span></label>
        <input type="range" id="deep-lr" min="0.01" max="0.5" step="0.01" value="0.1" oninput="document.getElementById('lr-val').innerText = this.value">
        <label>Epochen</label>
        <input type="number" id="deep-epochs" value="500" style="width: 100%; margin-bottom: 10px;">
        <button class="btn" style="width:100%;" onclick="initBlock('deep')">🔄 Modell Reset</button>
    </div>

    <div class="panel" style="background: white;">
        <div id="deep-data-chart" class="plot-container"></div>
        
        <div class="math-container">
            <h4 style="margin-top:0;">📓 Modell-Zustand</h4>
            <div id="deep-math-monitor" class="math-tex"></div>
            
            <div class="predict-box">
                <span>🔮 Live Test:</span>
                <input type="number" id="pred-x1" value="0.5" step="0.1" style="width:50px;" oninput="updateLivePrediction()">
                <input type="number" id="pred-x2" value="0.5" step="0.1" style="width:50px;" oninput="updateLivePrediction()">
                <span>➝ Ergebnis:</span>
                <span id="pred-output" style="color: var(--accent); font-size: 1.2em;">0.00</span>
            </div>
        </div>
        
        <div id="master-loss-landscape" class="plot-container" style="margin-top:15px; height: 200px;"></div>
    </div>

    <div class="panel">
        <h3>📍 Gewichte (Live)</h3>
        <div id="manual-weight-sliders"></div>
        <hr>
        <h3>📡 Schicht-Heatmaps</h3>
        <div id="deep-tensor-viz"></div>
    </div>
</div>

<script src="train.js"></script>
<script>train_onload();</script>
