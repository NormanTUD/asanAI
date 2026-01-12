<?php include_once("functions.php"); ?>

<div id="loss-intro" class="md">
    # The Loss Lab: Tuning the AI
    To "train" an AI, we calculate the slope (derivative) of the Loss. 
    * In **MSE**, we want the "AI Marble" to sit at the very bottom of the bowl.
    * In **Cross-Entropy**, we want to push the "Correct" category toward 100% confidence.
</div>

<hr>

<div class="lab-section">
    <div class="md">
        ## 1. Regression: Mean Squared Error (MSE)
        The objective is to move the **<span style="color:#ef4444">Red AI Marble</span>** until it sits exactly on top of the **<span style="color:#10b981">Green Truth Dot</span>**. 
        $$\text{Loss} = (y_{\text{target}} - \hat{y}_{\text{pred}})^2$$
    </div>

    <div style="display: flex; gap: 20px; align-items: center; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="flex: 1;">
            <label><b>Target Number ($y$):</b> <small>(The Truth)</small></label>
            <input type="range" id="mse-true" min="0" max="10" step="1" value="7" style="width:100%">
            <br><br>
            <label><b>AI Guess ($\hat{y}$):</b> <small>(The Prediction)</small></label>
            <input type="range" id="mse-pred" min="0" max="10" step="0.1" value="2" style="width:100%">
        </div>
        <div id="mse-math" style="flex: 1; font-size: 1.1em; border-left: 3px solid #3b82f6; padding-left: 20px;"></div>
    </div>
    <div id="plot-mse" style="height: 350px;"></div>
</div>

<hr>

<div class="lab-section">
    <div class="md">
        ## 2. Classification: Cross-Entropy
        The AI outputs a probability for every category. We calculate loss based on how far the **Target Category** is from 1.0.
        $$\text{Loss}_{\text{Total}} = -\ln(P_{\text{target}})$$
    </div>

    <div style="display: flex; flex-direction: column; gap: 15px; background: #fff7ed; padding: 20px; border-radius: 12px; border: 1px solid #ffedd5;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
                <p>Target Class: <span style="color: #f59e0b; font-weight: bold;">CAT</span></p>
                <div style="display: grid; grid-template-columns: 100px 150px 100px; gap: 15px; align-items: center;">
                    <b style="font-size:0.8em">Class</b> <b style="font-size:0.8em">Confidence</b> <b style="font-size:0.8em">Loss</b>
                    
                    <span>Cat (Target)</span>
                    <input type="range" id="cce-target" min="0.05" max="0.99" step="0.01" value="0.3">
                    <span id="loss-target" style="font-family: monospace; font-weight: bold; color: #10b981;">-</span>
                    
                    <span>Dog</span>
                    <div id="bar-dog" style="height: 15px; background: #94a3b8; border-radius: 4px; transition: width 0.2s;"></div>
                    <span id="loss-dog" style="font-family: monospace; color: #ef4444;">-</span>
                    
                    <span>Bird</span>
                    <div id="bar-bird" style="height: 15px; background: #94a3b8; border-radius: 4px; transition: width 0.2s;"></div>
                    <span id="loss-bird" style="font-family: monospace; color: #ef4444;">-</span>
                </div>
            </div>

            <div style="background: #1e293b; color: #38bdf8; padding: 15px; border-radius: 8px; font-family: monospace; min-width: 180px;">
                <div style="color: #94a3b8; margin-bottom: 5px; font-size: 0.8em;">Output Vector $\hat{y}$</div>
                [ <span id="vec-dog">0.00</span>, <span id="vec-cat" style="color: #fbbf24; font-weight: bold;">0.00</span>, <span id="vec-bird">0.00</span> ]
                <div style="margin-top: 10px; color: #94a3b8; font-size: 0.8em;">Target Vector $y$</div>
                [ 0.00, <span style="color: #10b981;">1.00</span>, 0.00 ]
            </div>
        </div>
        
        <div id="cce-math" style="margin-top: 10px; font-size: 1.1em; border-top: 1px solid #ffedd5; padding-top:10px;"></div>
    </div>
    <div id="plot-cce" style="height: 380px;"></div>
</div>
