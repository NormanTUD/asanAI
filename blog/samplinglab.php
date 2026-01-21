<?php include_once("functions.php"); ?>

<div class="md">
    <p>Adjust the temperature to change the model's "confidence" before the Top-$k$ filter is applied.</p>
</div>

<div class="panel" style="margin-bottom: 20px; background: #f8fafc; display: flex; gap: 30px; flex-wrap: wrap;">
    <div style="flex: 1; min-width: 250px;">
        <label style="font-weight: bold; display: block; margin-bottom: 8px;">
            Temperature ($T$): <span id="temp-display" style="color: #ef4444;">1.0</span>
        </label>
        <input type="range" id="slider-temp" min="0.1" max="2.0" step="0.1" value="1.0" style="width: 100%;">
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; margin-top: 4px;">
            <span>Focused (Cold)</span>
            <span>Creative (Hot)</span>
        </div>
    </div>
    
    <div style="flex: 1; min-width: 250px;">
        <label style="font-weight: bold; display: block; margin-bottom: 8px;">
            Top-$k$: <span id="k-display" style="color: #3b82f6;">5</span>
        </label>
        <input type="range" id="slider-k" min="1" max="10" step="1" value="5" style="width: 100%;">
        <small style="color: #64748b;">Only top $k$ words survive the cut.</small>
    </div>
    
    <div style="display: flex; align-items: flex-end;">
        <button class="btn" onclick="Sampler.rollDice()">Roll for Next Word</button>
    </div>
</div>

<div class="transformer-grid" style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px;">
    <div class="panel">
        <h2>Probability Distribution</h2>
        <div id="sampling-plot" style="height: 400px;"></div>
    </div>

    <div class="panel">
        <h2>Sampling Results</h2>
        <div id="results-table" style="margin-top: 10px;">
            </div>
    </div>
</div>

<style>
    .panel { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .result-row { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #f1f5f9; align-items: center; }
    .result-row.selected { background: #fef9c3; border: 2px solid #facc15; border-radius: 6px; font-weight: bold; transform: scale(1.02); }
    .result-row.discarded { opacity: 0.4; text-decoration: line-through; color: #94a3b8; }
    .bar-label { font-size: 0.8rem; font-weight: bold; }
</style>
