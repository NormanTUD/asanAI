<?php include_once("functions.php"); ?>
<style>
    :root { --panel-bg: #f8fafc; --border-clr: #e2e8f0; --accent: #3b82f6; }
    .lab-dashboard {
        display: grid;
        grid-template-columns: 320px 1fr 320px;
        grid-template-rows: auto 1fr;
        gap: 15px;
        height: 95vh;
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
    .header-full { grid-column: 1 / span 3; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border-clr); padding-bottom: 10px; }
    .plot-container { height: 45%; background: white; border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--border-clr); }
    .math-tex { font-size: 0.82em; background: white; padding: 10px; border-radius: 6px; border: 1px solid var(--border-clr); line-height: 1.4; }
    input:disabled, button:disabled { opacity: 0.5; cursor: not-allowed; }
    .slider-group { margin-bottom: 10px; font-size: 0.85em; }
    .slider-group label { display: block; margin-bottom: 2px; }
    .slider-group input { width: 100%; accent-color: var(--accent); }
</style>

<div class="lab-dashboard">
    <div class="header-full">
        <h2 style="margin:0;">🧠 Labor: Manuelle Initialisierung & Optimierung</h2>
        <div>
            <button id="btn-deep-train" class="btn btn-train" onclick="toggleTraining('deep')">🚀 Start Gradient Descent</button>
            <button class="btn btn-stop" onclick="configs.deep.isTraining = false">⏹️ Stop</button>
        </div>
    </div>

    <div class="panel">
        <h3>🎛️ Data Factory</h3>
        <div style="max-height: 180px; overflow-y: auto; margin-bottom: 10px;">
            <table id="deep-train-table" class="table">
                <thead><tr id="deep-thr"></tr></thead>
                <tbody></tbody>
            </table>
        </div>
        <button class="btn" onclick="addRow('deep')" style="width:100%; margin-bottom:15px;">+ Datenpunkt</button>
        
        <hr>
        
        <h3>⚙️ Training</h3>
        <label>Learning Rate: <span id="lr-val">0.1</span></label>
        <input type="range" id="deep-lr" min="0.01" max="0.5" step="0.01" value="0.1" 
               oninput="document.getElementById('lr-val').innerText = this.value">
        
        <label>Epochen</label>
        <input type="number" id="deep-epochs" value="500" style="width: 100%; margin-bottom: 10px;">
        
        <button class="btn" style="width:100%;" onclick="initBlock('deep')">🔄 Modell Reset</button>
    </div>

    <div class="panel" style="background: white; display: flex; flex-direction: column;">
        <div id="deep-data-chart" class="plot-container"></div>
        <div id="master-loss-landscape" class="plot-container"></div>
    </div>

    <div class="panel">
        <h3>📍 Startposition (Gewichte)</h3>
        <div id="manual-weight-sliders" style="margin-bottom: 20px;">
            </div>

        <hr>
        
        <h3>📓 Mathematisches Modell</h3>
        <div id="deep-math-monitor" class="math-tex"></div>
        
        <h3 style="margin-top:15px;">📡 Layer Heatmaps</h3>
        <div id="deep-tensor-viz" style="display: flex; flex-wrap: wrap; gap: 5px;"></div>
    </div>
</div>

<script src="train.js"></script>
<script>train_onload();</script>
