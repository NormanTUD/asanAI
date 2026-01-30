<?php include_once("functions.php"); ?>

<style>
    .concept-card { background: white; padding: 25px; border-radius: 15px; margin-bottom: 30px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
    .math-box { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 10px 0; font-family: 'serif'; }
    .flex-row { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; }
    input[type=range] { width: 100%; }
    .ctrl-panel { flex: 1; min-width: 250px; }
    .plot-panel { flex: 2; min-width: 300px; height: 300px; }
</style>

<div class="intro" style="padding: 20px; text-align: center;">
    <h1>The Statistics of AI</h1>
    <p>AI doesn't "know" things like humans do. It calculates <strong>probabilities</strong>. Think of AI as a giant calculator that guesses the most likely answer based on patterns. Here is the math that makes it work.</p>
</div>

<div class="concept-card">
    <h2>1. The Normal Distribution (The Bell Curve)</h2>
    <p>Imagine measuring the height of every 16-year-old in Germany. Most are "average," and very few are extremely tall or short. This shape is the "Normal Distribution."</p>
    <div class="flex-row">
        <div class="ctrl-panel">
            $\mu$ (Average): <input type="range" id="slider-mu" min="-2" max="2" step="0.1" value="0">
            $\sigma$ (Spread): <input type="range" id="slider-sigma" min="0.1" max="2" step="0.1" value="1">
            <div id="gauss-formula" class="math-box"></div>
        </div>
        <div id="plot-gaussian" class="plot-panel"></div>
    </div>
</div>

<div class="concept-card">
    <h2>2. Correlation ($r$)</h2>
    <p>Does "Time spent studying" relate to "Exam grades"? If yes, they are correlated. AI uses this to see which words in a sentence "belong" together.</p>
    <div class="flex-row">
        <div class="ctrl-panel">
            <strong>Correlation ($r$):</strong> <span id="r-val">0</span>
            <input type="range" id="corr-strength" min="-1" max="1" step="0.01" value="0">
            <pre id="cov-matrix" style="background:#1e293b; color:#38bdf8; padding:10px;"></pre>
        </div>
        <div id="plot-correlation" class="plot-panel"></div>
    </div>
</div>

<div class="concept-card">
    <h2>3. Bayesian Updating</h2>
    <p>If you see clouds, the chance of rain goes up. You <strong>update</strong> your belief based on evidence. AI does this to filter spam emails.</p>
    <div class="flex-row">
        <div class="ctrl-panel">
            Prior (Chance of Spam anyway): <input type="range" id="bay-prior" min="0.01" max="0.99" step="0.01" value="0.1">
            Evidence (Word "WINNER" in Spam): <input type="range" id="bay-likeli" min="0.01" max="0.99" step="0.01" value="0.8">
            <div id="bay-math-step" class="math-box"></div>
        </div>
        <div style="text-align: center; flex:1;">
            <div style="width: 60px; height: 150px; border: 2px solid #334155; position: relative; margin: 0 auto;">
                <div id="bay-result-box" style="position: absolute; bottom:0; width:100%; background:#22c55e;"></div>
            </div>
            <p>New Probability: <strong id="bay-text">0%</strong></p>
        </div>
    </div>
</div>

<div class="concept-card">
    <h2>4. Softmax (The "Decider")</h2>
    <p>AI gives scores to different options (e.g., Cat, Dog, Bird). Softmax turns these scores into percentages that add up to 100%.</p>
    <div class="ctrl-panel">
        Option A: <input type="number" class="softmax-input" value="2" step="0.5"> <div style="background:#ddd; width:100%;"><div id="softmax-bar-0" style="background:blue; height:10px;"></div></div> <span id="softmax-text-0"></span><br>
        Option B: <input type="number" class="softmax-input" value="1" step="0.5"> <div style="background:#ddd; width:100%;"><div id="softmax-bar-1" style="background:green; height:10px;"></div></div> <span id="softmax-text-1"></span><br>
        <div class="math-box">$$\sigma(z)_i = \frac{e^{z_i}}{\sum e^{z_j}}$$</div>
    </div>
</div>

<div class="concept-card">
    <h2>5. Linear Regression (Mean Squared Error)</h2>
    <p>Trying to draw a straight line through points. The "Error" (MSE) is how far the line is from the points. AI wants to make this error zero.</p>
    <div class="flex-row">
        <div class="ctrl-panel">
            Line Slope: <input type="range" id="reg-m" min="0" max="2" step="0.1" value="0.5">
            <div id="mse-val" class="math-box"></div>
        </div>
        <div id="plot-reg" class="plot-panel"></div>
    </div>
</div>

<div class="concept-card">
    <h2>6. Entropy (The Messiness Scale)</h2>
    <p>If a coin is fair (50/50), entropy is high (maximum surprise). If it's rigged (100% Heads), entropy is 0. AI uses this to measure how "confused" it is.</p>
    <div class="ctrl-panel">
        Probability of Event: <input type="range" id="ent-p" min="0" max="1" step="0.01" value="0.5">
        <p>Entropy: <strong id="ent-val">1.0</strong></p>
        <div id="ent-formula" class="math-box"></div>
    </div>
</div>

<div class="concept-card">
    <h2>7. Central Limit Theorem</h2>
    <p>Roll 10 dice and take the average. Do it many times. Even though a single die is "flat," the averages will always form a Bell Curve! This is why statistics works everywhere.</p>
    <button id="clt-roll" style="padding:10px 20px; background:#f59e0b; border:none; color:white; border-radius:5px; cursor:pointer;">Roll 50 Averages</button>
    <div id="plot-clt" class="plot-panel" style="height:200px;"></div>
</div>

<div class="concept-card">
    <h2>8. Log Loss</h2>
    <p>If the AI is 99% sure it's a dog, but it's actually a cat, we punish it heavily. Log Loss is the "Penalty" for being confidently wrong.</p>
    <div class="ctrl-panel">
        Certainty: <input type="range" id="logloss-p" min="0.01" max="0.99" step="0.01" value="0.5">
        <p>Penalty: <strong id="logloss-val"></strong></p>
        <div id="logloss-math" class="math-box"></div>
    </div>
</div>

<div class="concept-card">
    <h2>9. Standardizing (Z-Score)</h2>
    <p>How do you compare a math grade (out of 15) with an IQ score (out of 200)? You calculate how many "steps" (Standard Deviations) they are from the average.</p>
    <div class="ctrl-panel">
        Value (e.g. IQ): <input type="range" id="z-val-in" min="70" max="130" value="100">
        <div id="z-res" class="math-box"></div>
    </div>
</div>

<div class="concept-card">
    <h2>10. Gradient Descent (The Valley)</h2>
    <p>AI learns by "rolling down a hill" to find the lowest error. The "Gradient" tells the AI which way is down.</p>
    <div class="flex-row">
        <div class="ctrl-panel">
            Current Position ($x$): <input type="range" id="gd-step" min="-2" max="2" step="0.1" value="1.5">
            <div id="gd-math" class="math-box"></div>
        </div>
        <div id="plot-gd" class="plot-panel"></div>
    </div>
</div>

<div class="concept-card">
    <h2>11. Bias vs. Variance</h2>
    <p><strong>Bias:</strong> The AI is too simple (ignores data). <strong>Variance:</strong> The AI is too jittery (overreacts to noise).</p>
    <select id="vb-select" style="padding:10px;">
        <option value="bias">High Bias (Too simple)</option>
        <option value="var">High Variance (Overreacting)</option>
    </select>
    <div id="plot-vb" class="plot-panel"></div>
</div>

<div class="concept-card">
    <h2>12. Chi-Square ($\chi^2$)</h2>
    <p>Is the result just luck? If we expect 50 heads but get 60, is the coin rigged? $\chi^2$ measures the difference between "Expected" and "Actual."</p>
    <div class="ctrl-panel">
        Observed Value: <input type="range" id="chi-a" min="0" max="100" value="50">
        <div id="chi-res" class="math-box"></div>
    </div>
</div>
