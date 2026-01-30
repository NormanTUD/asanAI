<?php include_once("functions.php"); ?>

<div class="md">
AI doesn't think in certainties; it thinks in **probabilities**. To understand how a Transformer predicts the next word, we must look at the math developed by astronomers and gamblers centuries ago.

## The Normal Distribution (Gauss)
In 1809, **Carl Friedrich Gauss** noticed that errors in observations tended to cluster around a central value. In AI, we use this "Bell Curve" to initialize the weights of a brain before it has learned anything.

Experiment with the **Mean ($\mu$)** (center) and **Standard Deviation ($\sigma$)** (spread):
</div>

<div style="display: flex; gap: 20px; align-items: center; background: #f8fafc; padding: 20px; border-radius: 12px;">
    <div>
        $\mu$: <input type="range" id="slider-mu" min="-2" max="2" step="0.1" value="0"><br>
        $\sigma$: <input type="range" id="slider-sigma" min="0.1" max="2" step="0.1" value="1">
    </div>
    <div id="plot-gaussian" style="width: 100%; height: 300px;"></div>
</div>

<div class="md">
## Correlation: The "Attention" Ancestor
In 1895, **Karl Pearson** gave us a way to calculate if two things move together. 

In a Transformer (like GPT), the **Attention** mechanism calculates the "Correlation" between every word in your prompt. If you type "The bank of the...", the model checks the correlation of "bank" with surrounding words. If "river" is nearby, the correlation with the concept of "water" spikes.

**Experiment:** Slide to change the correlation ($r$). Watch the **Covariance Matrix**—this is how AI stores relationships between concepts.
</div>

<div style="display: flex; gap: 20px; background: #fdf2f8; padding: 20px; border-radius: 15px;">
    <div style="flex: 1;">
        <strong>Correlation ($r$):</strong> <span id="r-val">0</span><br>
        <input type="range" id="corr-strength" min="-1" max="1" step="0.01" value="0" style="width:100%;">
        <p><strong>Covariance Matrix:</strong></p>
        <pre id="cov-matrix" style="background:#1e293b; color:#38bdf8; padding:15px; border-radius:8px; font-family: monospace;"></pre>
    </div>
    <div id="plot-correlation" style="flex: 2; height: 300px;"></div>
</div>

<div class="md">
## Bayesian Thinking: How AI Updates its Mind
In 1763, **Thomas Bayes** asked: *How should we change our mind when we see new evidence?*

Training an AI is the process of starting with a **Prior** belief (random weights) and using **Evidence** (data) to reach a **Posterior** (a trained model).

**Interactive: The Spam Filter**
Imagine your "Prior" belief that an email is spam is 10%. You then see the word **"WINNER"**. 
If "Winner" appears in 80% of Spam but only 5% of Real mail, how does the probability change?
</div>

<div style="display: flex; align-items: center; justify-content: space-around; background: #f0f9ff; padding: 30px; border-radius: 15px; border: 1px solid #bae6fd;">
    <div>
        <strong>Prior Probability:</strong> <span id="prior-text">10%</span><br>
        <input type="range" id="bay-prior" min="0.01" max="0.99" step="0.01" value="0.1"><br><br>
        <strong>Evidence Strength:</strong><br>
        (Likelihood of word in Spam)<br>
        <input type="range" id="bay-likeli" min="0.01" max="0.99" step="0.01" value="0.8">
    </div>
    
    <div style="text-align: center;">
        <div style="width: 80px; height: 180px; border: 3px solid #334155; position: relative; background: white; margin: 0 auto;">
            <div id="bay-result-box" style="position: absolute; bottom: 0; width: 100%; background: #22c55e; transition: height 0.5s;"></div>
        </div>
        <p>Chance it's Spam:<br><strong id="bay-text" style="font-size: 1.5em; color: #166534;">0%</strong></p>
    </div>
</div>
