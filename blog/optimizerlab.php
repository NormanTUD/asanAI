<?php include_once("functions.php"); ?>
<div class="md">
    ### The Optimizer: How we descend the mountain
    The derivative only tells us the direction. The optimizer decides on the strategy. 
    Imagine you are rolling a ball down a hill:
    
    * **SGD (Stochastic Gradient Descent):** One simple step at a time.
    * **Momentum:** The ball picks up speed when it goes downhill (it keeps its momentum).
    * **Adam:** A more advanced and modern optimizer. It adjusts the speed for each parameter individually.
</div>

<div class="md">
    ### Interactive Training
    In this version, the optimizer won't stop until it completes the set number of steps.
    * **Epochs:** Set how many steps to take in one run.
    * **Continue:** Clicking continue will run for *another* set of epochs from the current position.
</div>

<div class="grid-layout" style="background: #f1f5f9; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
            <label><b>Optimizer Strategy:</b></label>
            <select id="opt-type" class="btn" style="background: white; color: black; border: 1px solid #ccc; width: 100%; margin-bottom: 10px;">
                <option value="sgd">SGD</option>
                <option value="momentum">Momentum</option>
                <option value="adam">Adam</option>
            </select>

            <label><b>Learning Rate:</b></label>
            <input type="range" id="opt-lr" min="0.01" max="0.5" step="0.01" value="0.1" style="width: 100%;">
            <span id="opt-lr-val">LR = 0.1</span>
        </div>
        
        <div>
            <label><b>Start Position (x):</b></label>
            <input type="range" id="opt-start-x" min="-4" max="4" step="0.1" value="-3.5" style="width: 100%; margin-bottom: 10px;">
            
            <label><b>Epochs (Steps to run):</b></label>
            <input type="number" id="opt-epochs" value="50" min="1" max="500" class="btn" style="background: white; color: black; border: 1px solid #ccc; width: 100%;">

            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button id="btn-run-opt" class="btn btn-train" style="flex: 2;" onclick="toggleOptimizer()">
                    ▶ Start Simulation
                </button>
                <button id="btn-restart-opt" class="btn" style="flex: 1; display: none; background: #94a3b8; color: white;" onclick="resetOptimizer()">
                    Restart
                </button>
            </div>
        </div>
    </div>

    <div style="position: relative;">
        <div id="plot-optimizer" style="height: 400px; background: white; border-radius: 8px;"></div>
        <div id="opt-console" class="status-console" style="height: 100px; margin-top: 10px;"></div>
    </div>
</div>
