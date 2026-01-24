<?php include_once("functions.php"); ?>

<div class="md">
# The Extrapolation Test: Multiple Sine Periods

In this lab, the AI tries to learn a repeating pattern: $y = \sin(x)$. 
* **The Dotted Line** represents the "Universal Truth" (the full sine wave).
* **The Grey Box** is the "Training Window." The AI **only** sees the data points inside this box.
* **The Red Line** is the AI's attempt to reconstruct the entire universe based only on that small window.

### Mathematical Identity
The model is a high-degree polynomial:
<div id="equation-monitor" style="background: #fff; padding: 20px; border-radius: 12px; font-family: 'Times New Roman', serif; font-size: 1.1rem; text-align: center; border: 2px solid #3b82f6; margin: 20px 0; min-height: 50px; overflow-x: auto;">
    $$\dots$$
</div>
</div>

<div class="lab-controls" style="background: #f8fafc; padding: 25px; border-radius: 15px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
        <div>
            <label><strong>Polynomial Degree:</strong> <span id="label-degree" style="font-weight:bold; color:#ef4444;">4</span></label>
            <input type="range" id="slider-degree" min="1" max="20" step="1" value="4" style="width: 100%; margin: 15px 0;">
            
            <label><strong>Point Noise:</strong> <span id="label-noise">0.1</span></label>
            <input type="range" id="slider-noise" min="0" max="0.5" step="0.05" value="0.1" style="width: 100%;">
        </div>
        <div style="background: #fff; padding: 15px; border-radius: 10px; border: 1px solid #cbd5e0; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-family: monospace; font-size: 0.9rem; margin-bottom: 10px;">
                Status: <span id="train-status">Idle</span><br>
                MSE Loss: <span id="loss-train">0.0000</span>
            </div>
            <button id="btn-toggle-train" style="width:100%; background: #22c55e; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1rem;">
                🚀 Start Training
            </button>
        </div>
    </div>
</div>



<div id="fitting-plot" style="width:100%; height:600px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;"></div>

<div class="md">
### Observations
1.  **Inside the Box:** Notice how as you increase the **Degree**, the red line gets better at hitting the black dots.
2.  **Outside the Box:** Even if the fit is perfect inside, look at the edges ($x < 0$ or $x > 6$). A high-degree polynomial will "flick" up or down violently. It "memorized" the segment but failed to learn that a sine wave repeats forever.
3.  **The Underfit:** At Degree 1 or 2, the model can't even represent a single wave correctly.
</div>
