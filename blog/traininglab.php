<?php include_once("functions.php"); ?>
<style>
    :root { --panel-bg: #f8fafc; --border-clr: #e2e8f0; }
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
        display: flex;
        flex-direction: column;
    }
    .header-full { grid-column: 1 / span 3; display: flex; justify-content: space-between; align-items: center; }
    .plot-container { flex: 1; min-height: 0; background: white; border-radius: 8px; margin-bottom: 5px; }
    .math-tex { font-size: 0.85em; background: white; padding: 10px; border-radius: 6px; border: 1px solid var(--border-clr); }
    input:disabled, button:disabled { opacity: 0.5; cursor: not-allowed; }
    .table-scroll { max-height: 200px; overflow-y: auto; margin-bottom: 10px; }
</style>

<div class="lab-dashboard">
    <div class="header-full">
        <h2 style="margin:0;">🧠 Das finale Labor: Datenformung</h2>
        <div>
            <button id="btn-deep-train" class="btn btn-train" onclick="toggleTraining('deep')">🚀 Start Gradient Descent</button>
            <button class="btn btn-stop" onclick="configs.deep.isTraining = false">⏹️ Stop</button>
        </div>
    </div>

    <div class="panel">
        <h3>🎛️ Data Factory</h3>
        <div class="table-scroll">
            <table id="deep-train-table" class="table">
                <thead><tr id="deep-thr"></tr></thead>
                <tbody></tbody>
            </table>
        </div>
        <button class="btn" onclick="addRow('deep')" style="width:100%; margin-bottom:15px;">+ Datenpunkt</button>
        
        <hr>
        
        <h3>⚙️ Hyperparameter</h3>
        <label>Learning Rate: <span id="lr-val">0.1</span></label>
        <input type="range" id="deep-lr" min="0.01" max="0.5" step="0.01" value="0.1" 
               oninput="document.getElementById('lr-val').innerText = this.value">
        
        <label>Epochen pro Klick</label>
        <input type="number" id="deep-epochs" value="500" style="width: 100%;">
        
        <button class="btn" style="margin-top:10px;" onclick="initBlock('deep')">🔄 Modell Reset</button>
    </div>

    <div class="panel" style="background: white;">
        <div id="deep-data-chart" class="plot-container"></div>
        <div id="master-loss-landscape" class="plot-container"></div>
    </div>

    <div class="panel">
        <h3>🏗️ KI-Struktur</h3>
        <div id="deep-gui" style="margin-bottom: 10px;"></div>
        
        <h3>📡 Gewicht-Heatmaps</h3>
        <div id="deep-tensor-viz" style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 15px;"></div>

        <hr>
        
        <h3>📓 Mathematisches Modell</h3>
        <div id="deep-math-monitor" class="math-tex"></div>
    </div>
</div>

<script>train_onload();</script>
