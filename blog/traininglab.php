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

.table-wrapper {
    flex-grow: 1;
    overflow-y: auto;
    overflow-x: hidden; /* Verhindert das seitliche Scrollen */
    border: 1px solid #eee;
    border-radius: 4px;
    width: 100%; /* Nutzt die volle Breite des Panels */
}

#deep-train-table {
    width: 100%;
    table-layout: fixed; /* Zwingt die Spalten in die verfügbare Breite */
}

#deep-train-table th, #deep-train-table td {
    padding: 4px 2px; /* Extrem schmale Polsterung */
    text-align: center;
    overflow: hidden;
    white-space: nowrap;
}

#deep-train-table input {
    width: 100%; /* Input füllt die schmale Spalte aus */
    box-sizing: border-box;
    font-size: 0.8em;
    padding: 2px;
}

/* Update these sections in traininglab.php */


/* Slimmer Weight Sliders */
.w-slider {
    height: 8px; /* Thinner slider track */
    margin: 2px 0;
}

.manual-weight-item {
    margin-bottom: 4px;
    padding-bottom: 2px;
    border-bottom: 1px solid #f1f5f9;
}

.manual-weight-item label {
    font-size: 0.7em;
    color: #475569;
}

.lab-dashboard {
    display: grid;
    /* Maintain the 3-column layout for the top/middle section */
    grid-template-columns: 220px 340px 220px;
    grid-template-rows: auto;
    gap: 12px;
    width: 800px;
    margin: 0 auto;
    padding: 10px;
    box-sizing: border-box;
}

.header-full, .full-width-panel {
    grid-column: 1 / span 3;
    width: 100%;
}

.panel {
    background: white; border: 1px solid var(--border-clr); border-radius: 12px;
    padding: 15px; display: flex; flex-direction: column;
}

/* Ensure plots inside full-width panels stretch */
.full-width-panel .plot-container {
    width: 100% !important;
}
</style>

<div class="lab-dashboard">
    <div class="header-full">
        <div class="config-bar">
            <strong>Optimizer: Adam</strong>
            <label>LR: <input type="range" id="deep-lr" min="0.001" max="0.5" step="0.005" value="0.1" oninput="document.getElementById('lr-val').innerText = this.value"> <b id="lr-val">0.1</b></label>
            <label>Epochs: <input type="number" id="deep-epochs" value="500" style="width: 50px;"></label>
            <button onclick="TrainLab.toggleTraining('deep')" style="background:#22c55e; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold;">🚀 START</button>
            <button onclick="TrainLab.init('deep')" style="background:#64748b; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">RESET</button>
        </div>
    </div>

    <div class="panel">
        <h4>Training Data</h4>
        <div class="table-wrapper">
            <table id="deep-train-table" style="width:100%; font-size:0.8em;">
                <thead><tr id="deep-thr"></tr></thead>
                <tbody></tbody>
            </table>
        </div>
    </div>

    <div class="panel">
        <h4>Decision Boundary</h4>
        <div id="deep-data-chart" class="plot-container" style="height:250px;"></div>
    </div>

    <div class="panel">
        <h4>Weights & Heatmaps</h4>
        <div id="manual-weight-sliders" style="max-height:150px; overflow-y:auto;"></div>
        <div id="deep-tensor-viz"></div>
    </div>

    <div class="math-panel full-width-panel">
        <h4>Math & Architecture</h4>
        <div id="deep-math-monitor" class="math-tex"></div>
        
        <div class="predict-box">
            <strong>Live Inference:</strong>
            $x_1$: <input type="number" id="pred-x1" value="0.5" step="0.1" style="width:40px;" oninput="TrainLab.updateLivePrediction()">
            $x_2$: <input type="number" id="pred-x2" value="0.5" step="0.1" style="width:40px;" oninput="TrainLab.updateLivePrediction()">
            <span style="margin-left:20px;">$\hat{y} = $ <b id="pred-output" style="color:var(--accent); font-size:1.2em;">0.00</b></span>
        </div>
    </div>

    <div class="panel full-width-panel">
        <h4>Error History (Loss)</h4>
        <div id="master-loss-landscape" class="plot-container" style="height:180px;"></div>
    </div>
</div>

<script>train_onload();</script>
