<?php include_once("functions.php"); ?>
<div class="md">
### The Optimizer: Navigating the Loss Landscape
In machine learning, we want to find the settings (**Weights and Biases**) that result in the fewest mistakes. We measure these mistakes using a **Loss Function**. 

Think of this graph as a "Mountain of Errors":
* **The Height (Y-axis):** Represents the **Loss**. High peaks mean many errors; the valley at the bottom means the model is accurate.
* **The Position (X-axis):** Represents a **Weight** or parameter. Moving left or right changes how the model interprets the training data.
* **The Goal:** Use the optimizer to find the "global minimum"—the lowest point in the valley.

There are different strategies how to optimize:

* **SGD (Stochastic Gradient Descent):** Takes simple, direct steps. It’s consistent but can be slow or get stuck in small "potholes" (local minima).
* **Momentum:** Like a heavy ball, it gains speed as it rolls down long slopes, helping it plow through flat spots and small bumps.
* **Adam:** The "smart" navigator. It tracks the history of previous steps to adjust the speed for each parameter individually, making it the industry standard for complex data.

In most situations, *Adam* is the optimizer that works best, as it combines the speed of momentum with the ability to automatically adjust the learning rate for every individual parameter, allowing it to handle noisy data and complex architectures with minimal manual tuning.

### Interactive Training
* **Epochs:** How many steps the optimizer takes to adjust the weights based on the data.
* **Learning Rate (LR):** The size of each step. Too large, and you might jump over the valley; too small, and you'll never reach the bottom.
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
