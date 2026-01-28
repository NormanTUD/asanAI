<?php include_once("functions.php"); ?>

<div class="md">
## Building a Simple Neural Network
In the previous sections, we learned about **Tensors** (the data containers) and **Activation Functions** (the decision gates). Now, we combine them into a **Model**.

A Model is essentially a complex function with "knobs" called **Weights**. Training is the process where an **Optimizer** (like Adam) automatically turns these knobs to minimize the **Loss** (the error).

In this lab, you can see how a small network tries to learn a pattern. 
* **The Decision Boundary**: Shows the "map" of what the AI thinks. Red areas represent one classification, blue the other.
* **Weights (Live)**: These are the actual numerical values inside the first layer of the network.
* **Activation Patterns**: These heatmaps show how data flows through the specific "gates" (ReLU or Sigmoid) you've defined.

Since the network weights are randomly initialized, you may need to **reset** the model and restart training a few times to get decent results.
</div>

<style>
    .lab-dashboard {
        display: grid;
        grid-template-rows: auto;
        gap: 12px;
        width: 750px;
        margin: 0 auto;
        padding: 10px;
    }
    .header-full, .full-width-panel { grid-column: 1 / span 3; }
    .panel { 
        background: white; border: 1px solid var(--border-clr); border-radius: 12px;
        display: flex; flex-direction: column;
    }
    
    /* REMOVED: Max-height and overflow to prevent scrolling */
    #manual-weight-sliders { overflow: visible !important; }
    
    /* Crystal Clear Heatmaps */
    .heatmap-canvas { 
        border: 1px solid #cbd5e1; 
        width: 100%; 
        height: 60px; 
        image-rendering: pixelated; /* Essential for sharp edges */
        image-rendering: crisp-edges;
        margin-top: 4px; 
        border-radius: 4px; 
    }
    .heatmap-label { font-size: 10px; color: #64748b; margin-top: 8px; text-transform: uppercase; font-weight: bold; }

    .formula-block { background: #fff7ed; padding: 10px; border-radius: 8px; border: 1px solid #fed7aa; margin-bottom: 8px; font-size: 0.85em; }
    .predict-box { background: #eff6ff; padding: 12px; border-radius: 8px; border: 1px solid #bfdbfe; margin-top: 10px; }
    
    input[type="number"] { border: 1px solid #ddd; padding: 2px; border-radius: 4px; font-family: monospace; }
</style>

<div class="lab-dashboard">
    <div class="header-full panel" style="flex-direction:row; justify-content:space-between; align-items:center;">
        <div class="config-bar" style="display:flex; gap:15px; align-items:center;">
            <label>LR: <input type="range" id="deep-lr" min="0.01" max="0.5" step="0.01" value="0.1" oninput="document.getElementById('lr-val').innerText = this.value"> <b id="lr-val">0.1</b></label>
            <label>Epochs: <input type="number" id="deep-epochs" value="500" style="width: 60px;"></label>
        </div>
        <div>
            <button id="deep-train-btn" onclick="TrainLab.toggleTraining('deep')" style="background:#22c55e; color:white; border:none; padding:8px 20px; border-radius:6px; cursor:pointer; font-weight:bold; transition: 0.2s;">🚀 START</button>
            <button onclick="TrainLab.init('deep')" style="background:#64748b; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; margin-left:5px;">RESET</button>
        </div>
    </div>

    <div class="panel">
        <p>Training Data</p>
        <div class="table-wrapper">
            <table id="deep-train-table" style="width:100%; font-size:0.8em;">
                <thead><tr id="deep-thr"></tr></thead>
                <tbody></tbody>
            </table>
            <button onclick="TrainLab.addRow('deep')" style="width:100%; margin-top:5px; cursor:pointer; border:1px dashed #ccc; background:none; font-size:0.8em;">+ Add Row</button>
        </div>

        <p>Decision Boundary</p>
        <div id="deep-data-chart" class="plot-container"></div>
	    <div id="deep-math-monitor" class="math-tex"></div>
    </div>

    <div class="panel">
        <div id="manual-weight-sliders"></div>
        <div id="deep-tensor-viz"></div>
    </div>

    <div class="math-panel full-width-panel panel" style="background: #f8fafc;">
        <div>
            <div class="predict-box">
                <div style="margin-bottom:8px; font-weight:bold;">Live Inference:</div>
                $x_1$: <input type="number" id="pred-x1" value="0.5" step="0.1" style="width:45px;" oninput="TrainLab.updateLivePrediction()">
                $x_2$: <input type="number" id="pred-x2" value="0.5" step="0.1" style="width:45px;" oninput="TrainLab.updateLivePrediction()">
                <div style="margin-top:10px; font-size:1.1em;">Result $\hat{y} = $ <b id="pred-output" style="color:#3b82f6;">0.00</b></div>
            </div>
        </div>
    </div>

    <div class="panel full-width-panel">
	<div style="margin-bottom:8px; font-weight:bold;">Error History (Loss):</div>
        <div id="master-loss-landscape" class="plot-container"></div>
    </div>
</div>

<script>train_onload();</script>
