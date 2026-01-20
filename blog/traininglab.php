<?php include_once("functions.php"); ?>

<div class="md">
## Building a Simple Neural Network
In the previous sections, we learned about **Tensors** (the data containers) and **Activation Functions** (the decision gates). Now, we combine them into a **Model**.

A Model is essentially a complex function with "knobs" called **Weights**. Training is the process where an **Optimizer** (like Adam) automatically turns these knobs to minimize the **Loss** (the error).

In this lab, you can see how a small network tries to learn a pattern. 
* **The Decision Boundary**: Shows the "map" of what the AI thinks. Red areas represent one classification, blue the other.
* **Weights (Live)**: These are the actual numerical values inside the first layer of the network.
* **Activation Patterns**: These heatmaps show how data flows through the specific "gates" (ReLU or Sigmoid) you've defined.
</div>

<style>
    .lab-dashboard { 
        display: grid; 
        /* Structure: Data (left) | Center (Middle) | Technical (right) */
        grid-template-columns: 280px 1fr 300px; 
        grid-template-rows: auto 1fr; 
        gap: 12px; 
        height: 100vh; 
        padding: 12px; 
        box-sizing: border-box; 
    }

    .header-full { 
        grid-column: 1 / span 3; 
        display: flex; justify-content: space-between; align-items: center; 
        background: white; padding: 10px 20px; border-radius: 12px; border: 1px solid var(--border-clr);
    }

    .panel { 
        background: white; border: 1px solid var(--border-clr); border-radius: 12px; 
        padding: 15px; display: flex; flex-direction: column; overflow: hidden;
    }

    /* Center Stack */
    .center-column { display: flex; flex-direction: column; gap: 12px; overflow-y: auto; padding-right: 5px; overflow-y: clip; }
    .plot-container { min-height: 280px; width: 100%; background: white; border-radius: 8px; }
    .math-panel { background: var(--math-bg); border: 1px solid #fed7aa; min-height: fit-content; padding: 15px; border-radius: 12px; }
    
    .config-bar { display: flex; gap: 15px; align-items: center; font-size: 0.9em; }
    .math-tex { font-size: 0.9em; line-height: 1.4; }
    .formula-block { background: white; padding: 10px; border-radius: 8px; border: 1px solid #fed7aa; margin-bottom: 10px; }

    .predict-box { background: #eff6ff; padding: 12px; border-radius: 8px; border: 1px solid #bfdbfe; margin-top: 10px; }
    .heatmap-canvas { border: 1px solid #ccc; width: 100%; height: 45px; image-rendering: pixelated; margin-top: 5px; border-radius: 4px; }
    .table-wrapper { flex-grow: 1; overflow-y: auto; border: 1px solid #eee; border-radius: 4px; }
    
    h4 { margin: 0 0 10px 0; font-size: 0.85em; color: #64748b; text-transform: uppercase; }
    input[type="number"] { border: 1px solid #ddd; padding: 3px; border-radius: 4px; }
</style>

<div class="lab-dashboard">
    <div class="header-full">
        <div class="config-bar">
            <strong>Optimizer: Adam</strong>
            <label>LR: <input type="range" id="deep-lr" min="0.001" max="0.5" step="0.005" value="0.1" oninput="document.getElementById('lr-val').innerText = this.value"> <b id="lr-val">0.1</b></label>
            <label>Epochs: <input type="number" id="deep-epochs" value="500" style="width: 55px;"></label>
            <button onclick="TrainLab.toggleTraining('deep')" style="background:#22c55e; color:white; border:none; padding:6px 15px; border-radius:6px; cursor:pointer; font-weight:bold;">🚀 START TRAINING</button>
            <button onclick="TrainLab.configs.deep.isTraining = false" style="background:#ef4444; color:white; border:none; padding:6px 15px; border-radius:6px; cursor:pointer;">STOP</button>
            <button onclick="TrainLab.init('deep')" style="background:#64748b; color:white; border:none; padding:6px 15px; border-radius:6px; cursor:pointer;">RESET</button>
        </div>
    </div>

<div class="panel">
    <h4>📊 Training Data</h4>
    <button onclick="TrainLab.addRow('deep')" 
            style="margin-bottom:10px; cursor:pointer; width: 100%; padding: 5px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px;">
        + Add Data Point
    </button>
    
<div class="table-wrapper">
    <table id="deep-train-table" style="width:100%; font-size:0.85em; border-collapse: collapse;">
        <thead><tr id="deep-thr"></tr></thead>
        <tbody></tbody>
    </table>
</div>
</div>

    <div class="center-column">
        <div class="panel" style="flex: 0 0 auto;">
            <h4>📈 Decision Boundary</h4>
            <div id="deep-data-chart" class="plot-container"></div>
        </div>

        <div class="math-panel">
            <h4>📓 Math & Architecture</h4>
            <div id="deep-math-monitor" class="math-tex"></div>
            
            <div class="predict-box">
                <strong>🔮 Live Test (Inference):</strong><br>
                <div style="margin-top:8px;">
                    $x_1$: <input type="number" id="pred-x1" value="0.5" step="0.1" style="width:45px;" oninput="TrainLab.updateLivePrediction()">
                    $x_2$: <input type="number" id="pred-x2" value="0.5" step="0.1" style="width:45px;" oninput="TrainLab.updateLivePrediction()">
                    <span style="margin-left:15px;">$\text{Predicted Output } (\hat{y}) = $ <b id="pred-output" style="color:var(--accent); font-size:1.2em;">0.00</b></span>
                </div>
            </div>
        </div>

        <div class="panel" style="flex: 0 0 auto;">
            <h4>📉 Error History (Loss)</h4>
            <div id="master-loss-landscape" class="plot-container" style="min-height:200px;"></div>
        </div>
    </div>

    <div class="panel">
        <h4>📍 Weights (Live)</h4>
        <div id="manual-weight-sliders" style="flex-grow: 1; overflow-y: auto; margin-bottom:15px;"></div>
        <hr style="border:0; border-top:1px solid #eee; margin:10px 0;">
        <h4>📡 Activation Patterns</h4>
        <div id="deep-tensor-viz"></div>
    </div>
</div>

<script>train_onload();</script>
