<?php include_once("functions.php"); ?>

<div class="md">
In the previous sections, we learned about **Tensors** (the data containers) and **Activation Functions** (the decision gates). Now, we combine them into a **Model**.

A Model is essentially a complex function with "knobs" called **Weights**. Training is the process where an **Optimizer** (like Adam) automatically turns these knobs to minimize the **Loss** (the error).

Here, you can see how a small network tries to learn a pattern. 
* **The Decision Boundary**: Shows the "map" of what the AI thinks. Red areas represent one classification, blue the other.
* **Weights (Live)**: These are the actual numerical values inside the first layer of the network.
* **Activation Patterns**: These heatmaps show how data flows through the specific "gates" (ReLU or Sigmoid) you've defined.

Since the network weights are randomly initialized, you may need to **reset** the model and restart training a few times to get decent results.
</div>

<div class="lab-dashboard">
    <!-- Row 1: Full-width header -->
    <div class="header-full panel" style="grid-area:header; flex-direction:row; justify-content:space-between; align-items:center;">
        <div class="config-bar" style="display:flex; gap:20px; align-items:center;">
            <label class="config-label">
                <span class="config-label-text">Learning Rate</span>
                <div class="range-wrapper">
                    <input type="range" id="traininglab-lr" min="0.01" max="0.5" step="0.01" value="0.1" oninput="document.getElementById('lr-val').innerText = this.value">
                    <b id="lr-val" class="range-value">0.1</b>
                </div>
            </label>
            <label class="config-label">
                <span class="config-label-text">Epochs</span>
                <input type="number" id="traininglab-epochs" value="500" class="epochs-input">
            </label>
        </div>
        <div class="control-buttons">
            <button id="traininglab-train-btn" onclick="TrainLab.toggleTraining('traininglab')" class="btn btn-start">
                <span class="btn-icon">▶</span> START
            </button>
            <button onclick="TrainLab.init('traininglab')" class="btn btn-reset">
                <span class="btn-icon">↺</span> RESET
            </button>
        </div>
    </div>

    <!-- Row 2 Left: Training Data + Decision Boundary + Loss -->
    <div class="panel" style="grid-area:main;">
        <p class="panel-title">Training Data</p>
        <div class="table-wrapper">
            <table id="traininglab-train-table" class="training-table">
                <thead><tr id="traininglab-thr"></tr></thead>
                <tbody></tbody>
            </table>
            <button onclick="TrainLab.addRow('traininglab')" class="btn-add-row">
                <span>+</span> Add Row
            </button>
        </div>

        <p class="panel-title">Decision Boundary</p>
        <div id="traininglab-data-chart" class="plot-container"></div>
        <div id="train-math-monitor" class="math-tex"></div>

        <p class="panel-title">Loss History</p>
        <div id="master-loss-landscape" class="plot-container"></div>
    </div>

    <!-- Row 2 Right: Weights + Heatmaps -->
    <div class="panel" style="grid-area:side;">
        <p class="panel-title">Weight Controls</p>
        <div id="manual-weight-sliders"></div>
        <p class="panel-title">Activation Heatmaps</p>
        <div id="traininglab-tensor-viz"></div>
    </div>

    <!-- Row 3: Full-width inference -->
    <div class="math-panel full-width-panel panel" style="grid-area:inference;">
        <div class="predict-box">
            <p class="panel-title" style="margin-bottom:12px;">Live Inference</p>
            <div class="predict-inputs">
                <label class="predict-label">
                    $x_1$
                    <input type="number" id="pred-x1" value="0.5" step="0.1" class="predict-input" oninput="TrainLab.updateLivePrediction()">
                </label>
                <label class="predict-label">
                    $x_2$
                    <input type="number" id="pred-x2" value="0.5" step="0.1" class="predict-input" oninput="TrainLab.updateLivePrediction()">
                </label>
            </div>
            <div class="predict-result">
                Result: $\hat{y} = $ <b id="pred-output" class="predict-output">0.00</b>
            </div>
        </div>
    </div>
</div>

<style>
/* ── Dashboard Layout ── */
.lab-dashboard {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
        "header    header"
        "main      side"
        "inference inference";
    gap: 16px;
    width: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.lab-dashboard .panel {
    background: #ffffff;
    border: 1px solid #e8ecf0;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
    transition: box-shadow 0.25s ease;
    min-width: 0; /* prevents grid blowout from inner content */
}

.lab-dashboard .panel:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
}

/* Responsive: stack on smaller screens */
@media (max-width: 768px) {
    .lab-dashboard {
        grid-template-columns: 1fr;
        grid-template-areas:
            "header"
            "main"
            "side"
            "inference";
    }
}
/* ── Header / Config Bar ── */
.header-full {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.config-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.config-label-text {
    font-size: 0.72em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94a3b8;
}

.range-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
}

.range-wrapper input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 120px;
    height: 5px;
    background: linear-gradient(90deg, #e2e8f0, #cbd5e1);
    border-radius: 99px;
    outline: none;
    cursor: pointer;
    transition: background 0.2s;
}

.range-wrapper input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #3b82f6;
    border: 3px solid #fff;
    box-shadow: 0 1px 4px rgba(59,130,246,0.35);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.range-wrapper input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 2px 8px rgba(59,130,246,0.45);
}

.range-value {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.9em;
    color: #3b82f6;
    min-width: 32px;
    text-align: center;
}

.epochs-input {
    width: 64px;
    padding: 6px 8px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.9em;
    font-weight: 600;
    text-align: center;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.epochs-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

/* ── Buttons ── */
.control-buttons {
    display: flex;
    gap: 8px;
}

.btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 20px;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.85em;
    letter-spacing: 0.03em;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
}

.btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0);
    transition: background 0.2s;
}

.btn:hover::after {
    background: rgba(255,255,255,0.12);
}

.btn:active {
    transform: scale(0.97);
}

.btn-start {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    box-shadow: 0 2px 8px rgba(34,197,94,0.3);
}

.btn-start:hover {
    box-shadow: 0 4px 14px rgba(34,197,94,0.4);
}

.btn-reset {
    background: #f1f5f9;
    color: #64748b;
    border: 1px solid #e2e8f0;
    box-shadow: none;
}

.btn-reset:hover {
    background: #e2e8f0;
    color: #475569;
}

.btn-icon {
    font-size: 1em;
}

/* ── Training Table ── */
.training-table {
    width: 100%;
    font-size: 0.82em;
    border-collapse: separate;
    border-spacing: 0;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid #e8ecf0;
}

.training-table thead tr {
    background: #f8fafc;
}

.training-table th {
    padding: 8px 10px;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 0.85em;
    letter-spacing: 0.05em;
    color: #64748b;
    border-bottom: 2px solid #e8ecf0;
    text-align: center;
}

.training-table td {
    padding: 4px 6px;
    border-bottom: 1px solid #f1f5f9;
    text-align: center;
    vertical-align: middle;
}

.training-table tbody tr {
    transition: background 0.15s;
}

.training-table tbody tr:hover {
    background: #f8fafc;
}

.training-table tbody tr:last-child td {
    border-bottom: none;
}

.training-table input[type="number"] {
    width: 100%;
    border: 1px solid transparent;
    background: transparent;
    text-align: center;
    padding: 5px 4px;
    border-radius: 6px;
    font-size: 1em;
    font-family: 'SF Mono', 'Fira Code', monospace;
    transition: all 0.2s;
    outline: none;
}

.training-table input[type="number"]:hover {
    background: #f1f5f9;
}

.training-table input[type="number"]:focus {
    border-color: #3b82f6;
    background: #fff;
    box-shadow: 0 0 0 2px rgba(59,130,246,0.1);
}

.btn-add-row {
    width: 100%;
    margin-top: 8px;
    padding: 8px;
    cursor: pointer;
    border: 2px dashed #e2e8f0;
    border-radius: 8px;
    background: transparent;
    font-size: 0.82em;
    color: #94a3b8;
    font-weight: 600;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.btn-add-row:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: rgba(59,130,246,0.03);
}

.btn-add-row span {
    font-size: 1.2em;
    line-height: 1;
}

/* ── Weight Sliders ── */
.manual-weight-item {
    margin-bottom: 14px;
    padding: 10px 12px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #f1f5f9;
    transition: border-color 0.2s;
}

.manual-weight-item:hover {
    border-color: #e2e8f0;
}

.manual-weight-item label {
    font-size: 0.82em;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.manual-weight-item b {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.85em;
    color: #3b82f6;
}

.w-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #fca5a5, #e2e8f0 50%, #93c5fd);
    border-radius: 99px;
    outline: none;
    cursor: pointer;
    margin-top: 6px;
}

.w-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    border: 2.5px solid #3b82f6;
    box-shadow: 0 1px 4px rgba(0,0,0,0.12);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.w-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 2px 8px rgba(59,130,246,0.3);
}

/* ── Heatmap ── */
.heatmap-label {
    font-size: 0.78em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    margin: 14px 0 6px 0;
}

.heatmap-canvas {
    width: 100%;
    height: 50px;
    border-radius: 6px;
    border: 1px solid #e8ecf0;
    image-rendering: pixelated;
}

/* ── Prediction Box ── */
.predict-box {
    text-align: center;
}

.predict-inputs {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-bottom: 14px;
}

.predict-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #475569;
}

.predict-input {
    width: 60px;
    padding: 7px 8px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    text-align: center;
    font-size: 0.95em;
    font-family: 'SF Mono', 'Fira Code', monospace;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.predict-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

.predict-result {
    font-size: 1.1em;
    font-weight: 600;
    color: #334155;
    padding: 10px 16px;
    background: #f8fafc;
    border-radius: 8px;
    display: inline-block;
}

.predict-output {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 1.15em;
    transition: color 0.3s ease;
}

/* ── Math Formula Blocks ── */
.formula-block {
    margin: 10px 0;
    padding: 12px 14px;
    background: #f8fafc;
    border-left: 3px solid #3b82f6;
    border-radius: 0 8px 8px 0;
    font-size: 0.9em;
    overflow-x: auto;
}

.formula-block b {
    color: #334155;
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

/* ── Plot containers ── */
.plot-container {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #f1f5f9;
}

/* ── Delete button in table ── */
.training-table .btn-delete {
    color: #cbd5e1;
    border: none;
    background: none;
    cursor: pointer;
    font-weight: bold;
    font-size: 1.15em;
    padding: 2px 6px;
    border-radius: 4px;
    transition: all 0.15s;
    line-height: 1;
}

.training-table .btn-delete:hover {
    color: #ef4444;
    background: rgba(239,68,68,0.08);
}

/* ── Smooth transitions on training state ── */
@keyframes pulse-border {
    0%, 100% { border-color: #e8ecf0; }
    50% { border-color: #3b82f6; }
}

.lab-dashboard.is-training > .panel {
    animation: pulse-border 2s ease-in-out infinite;
}
</style>
