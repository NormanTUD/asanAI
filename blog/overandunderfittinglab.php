<?php include_once("functions.php"); ?>

<div class="md">
# The Extrapolation Test: Multiple Sine Periods

In this lab, the AI tries to learn a repeating pattern: $y = \sin(x)$. 
* **The Dotted Line** represents the "Universal Truth" (the full sine wave).
* **The Grey Box** is the "Training Window." The AI **only** sees the data points (dots) inside this box. Measures in real life always have some noise, so they this is added here to simulate this.
* **The Red Line** is the AI's attempt to reconstruct the entire universe based only on that small window.
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
                MSE Loss: <span id="loss-train">0.0000</span>
            </div>
            <button id="btn-toggle-train" style="width:100%; background: #22c55e; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1rem;">
                🚀 Start Training
            </button>
        </div>
    </div>
</div>

<div id="equation-monitor">
    $$\dots$$
</div>

<div id="fitting-plot" style="width:100%; height:600px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;"></div>

<div class="md" style="margin-top: 40px; line-height: 1.6;">
    ## Understanding the Results

    ### 1. The Extrapolation Failure
    Note how the **Red Line** behaves outside the **Grey Training Zone**.
    * **The AI's Logic:** "I found a polynomial that perfectly matches the dots I was given."
    * **The Reality:** The AI has no concept of "periodicity" (the wave repeating). It assumes the trend continues as a polynomial, which always leads to $\pm\infty$ as $x$ increases.
    * **Lesson:** Machine Learning models are often "interpolators" (good at guessing between known points) but terrible "extrapolators" (guessing outside the range of training data).

    ### 2. Underfitting vs. Overfitting

    * **Low Degree (1-3):** The model is too "stiff." It can't bend enough to follow the sine wave even inside the box. This is **High Bias**.
    * **High Degree (10+):** The model is too "wiggly." It starts chasing the **Noise** (the random scattering of dots) rather than the underlying sine wave. This is **High Variance**.

    ### 3. Runge's Phenomenon
    When you use high-degree polynomials to fit data, you often see wild oscillations at the edges of the training interval. This is known as **Runge's Phenomenon**. Even if the fit is perfect in the middle, the "tails" of the equation will whip around violently, making the model useless for prediction.
</div>
