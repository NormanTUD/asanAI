<?php include_once("functions.php"); ?>

<div id="loss-intro" class="md">
    # The Loss Lab: Measuring "Wrongness"
    A Loss Function is a "Mountain of Error." To train an AI, we calculate the slope of this mountain (the derivative) and "roll" downwards until we find the lowest point.
</div>

<hr>

<div class="lab-section">
    <div class="md">
        ## 1. Mean Squared Error (MSE)
        **Why a Parabola?** MSE squares the difference. If the error is 2, loss is 4. If error is 10, loss is 100! This forces the AI to prioritize fixing **big** mistakes first.
        $$\text{MSE} = (y - \hat{y})^2$$
    </div>

    <div style="display: flex; gap: 20px; align-items: center; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="flex: 1;">
            <label><b>Target Value ($y$):</b> <span id="mse-target-val">7</span></label>
            <input type="range" id="mse-true" min="0" max="10" step="1" value="7" style="width: 100%;">
            <br><br>
            <label><b>AI Prediction ($\hat{y}$):</b></label>
            <input type="range" id="mse-pred" min="0" max="10" step="0.1" value="3" style="width: 100%;">
        </div>
        <div id="mse-math" style="flex: 1; font-size: 1.1em; border-left: 3px solid #3b82f6; padding-left: 20px;"></div>
    </div>
    <div id="plot-mse" style="height: 350px;"></div>
</div>

<hr>

<div class="lab-section">
    <div class="md">
        ## 2. Categorical Cross-Entropy
        **Why this curve?** In classification (Cat, Dog, Bird), we want the AI to be confident. If the truth is "Dog" and the AI says 0.01% Dog, the loss becomes nearly **infinite** to "punish" the wrong confidence.
        $$\text{Loss} = -\ln(P_{\text{correct}})$$
    </div>

    <div style="display: flex; flex-direction: column; gap: 15px; background: #fff7ed; padding: 20px; border-radius: 12px; border: 1px solid #ffedd5;">
        <p>Target Class: <span style="color: #f59e0b; font-weight: bold;">DOG</span></p>
        <div style="display: grid; grid-template-columns: 100px 1fr 60px; gap: 10px; align-items: center;">
            <span>Dog (Correct)</span>
            <input type="range" id="cce-dog" min="0.01" max="0.98" step="0.01" value="0.4">
            <span id="val-dog">40%</span>
            
            <span>Cat</span>
            <div id="bar-cat" style="height: 20px; background: #cbd5e0; width: 30%;"></div>
            <span id="val-cat">30%</span>
            
            <span>Bird</span>
            <div id="bar-bird" style="height: 20px; background: #cbd5e0; width: 30%;"></div>
            <span id="val-bird">30%</span>
        </div>
        <div id="cce-math" style="margin-top: 10px; font-size: 1.1em; padding-top: 10px; border-top: 1px solid #ffedd5;"></div>
    </div>
    <div id="plot-cce" style="height: 350px;"></div>
</div>
