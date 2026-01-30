<?php include_once("functions.php"); ?>

<style>
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #334155; max-width: 900px; margin: 0 auto; padding: 20px; }
    h2 { border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 50px; }
    .math-display { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6; }
    .interactive-zone { display: flex; gap: 30px; align-items: flex-start; margin-bottom: 40px; flex-wrap: wrap; }
    .controls { flex: 1; min-width: 300px; }
    .visual { flex: 1.5; min-width: 300px; height: 300px; }
    input[type=range] { width: 100%; margin: 10px 0; }
</style>

<h1>Statistical Foundations of Intelligence</h1>
<p>Artificial Intelligence is essentially "Applied Statistics." Every decision an AI makes is a numerical calculation of likelihoods. Below is the math that allows machines to learn from chaos.</p>

<hr>

<h2>The Normal Distribution (The Law of Errors)</h2>
<p>First popularized by <strong>Carl Friedrich Gauss</strong> in his 1809 work <em>Theoria Motus Corporum Coelestium</em>. He used it to predict where planets would be. In AI, we assume most data follows this curve. </p>
<div class="interactive-zone">
    <div class="controls">
        <p>Instead of a perfect line, let's generate <strong>real random points</strong> using the Box-Muller transform.</p>
        Points: <input type="range" id="gauss-points" min="10" max="2000" value="500">
        Mean ($\mu$): <input type="range" id="slider-mu" min="-2" max="2" step="0.1" value="0">
        Std Dev ($\sigma$): <input type="range" id="slider-sigma" min="0.1" max="2" step="0.1" value="1">
        <div id="gauss-formula" class="math-display"></div>
    </div>
    <div id="plot-gaussian" class="visual"></div>
</div>

<h2>Correlation & Covariance</h2>
<p>Developed by <strong>Karl Pearson</strong> (1895). It measures how much two variables "dance together." If $r=1$, they move in perfect sync. If $r=0$, they ignore each other.</p>
<div class="interactive-zone">
    <div class="controls">
        Strength ($r$): <input type="range" id="corr-strength" min="-1" max="1" step="0.01" value="0.7">
        <p>Matrix representation:</p>
        <pre id="cov-matrix" style="background:#1e293b; color:#38bdf8; padding:15px; border-radius:8px;"></pre>
    </div>
    <div id="plot-correlation" class="visual"></div>
</div>

<h2>Bayesian Updating: Changing Your Mind</h2>
<p>Named after <strong>Thomas Bayes</strong> (published posthumously in 1763). It is the logic of science: $P(A|B)$ is your "New Belief" after seeing evidence $B$.</p>
<div class="math-display">
    $$P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}$$
</div>
<p><strong>Scenario:</strong> You get an email with the word "WINNER". 
$P(A)$ is the chance any email is spam (Prior). $P(B|A)$ is how often "WINNER" appears in spam (Likelihood).</p>
<div class="interactive-zone">
    <div class="controls">
        Prior $P(Spam)$: <input type="range" id="bay-prior" min="0.01" max="0.99" step="0.01" value="0.2">
        Likelihood $P(Win|Spam)$: <input type="range" id="bay-likeli" min="0.01" max="0.99" step="0.01" value="0.9">
        <div id="bay-eq-dynamic" class="math-display"></div>
    </div>
    <div style="text-align: center; flex: 0.5;">
        <div style="width: 80px; height: 180px; border: 3px solid #334155; position: relative; margin: 0 auto;">
            <div id="bay-result-box" style="position: absolute; bottom: 0; width: 100%; background: #22c55e; transition: height 0.3s;"></div>
        </div>
        <p>Probability it is Spam:<br><strong id="bay-text" style="font-size: 1.5em;">0%</strong></p>
    </div>
</div>

<h2>Entropy (The Messiness Scale)</h2>
<p><strong>Claude Shannon</strong> introduced this in his 1948 paper <em>A Mathematical Theory of Communication</em>. It measures uncertainty. If you are 100% sure what happens next, Entropy is 0. If you are totally clueless, Entropy is high.</p>
<div class="interactive-zone">
    <div class="controls">
        Probability of Outcome ($p$): <input type="range" id="ent-p" min="0.01" max="0.99" step="0.01" value="0.5">
        <p>Surprise Factor: <strong id="ent-val"></strong></p>
        <div id="ent-math" class="math-display"></div>
    </div>
</div>

<h2>Central Limit Theorem</h2>
<p>Proved by <strong>Pierre-Simon Laplace</strong> (1810). It says that if you add enough random things together, you always get a Bell Curve. Even if the original thing (like a die) isn't a curve!</p>
<div class="interactive-zone">
    <div class="controls">
        <button id="clt-roll" style="padding:15px; width:100%; cursor:pointer;">Roll 12 Dice (100 times)</button>
        <p>Each bar represents the average of 12 random dice rolls. Watch it become Gaussian!</p>
    </div>
    <div id="plot-clt" class="visual"></div>
</div>

<h2>Standardizing: Z-Scores</h2>
<p>How do we compare a student's height (170cm) with their test score (80/100)? We turn them into "Z-Scores"—how many standard deviations they are from the average.</p>
<div class="interactive-zone">
    <div class="controls">
        Value ($x$): <input type="range" id="z-x" min="0" max="200" value="120">
        Mean ($\mu$): <input type="range" id="z-mu" min="0" max="200" value="100">
        Std Dev ($\sigma$): <input type="range" id="z-sigma" min="1" max="50" value="15">
        <div id="z-math" class="math-display"></div>
    </div>
</div>

<h2>Bias vs. Variance</h2>
<p>A fundamental trade-off in learning. 
<strong>Bias</strong> is when your model is too "stiff" (like a straight line for a curve). 
<strong>Variance</strong> is when it's too "jumpy" (tracking every random bit of noise).</p>
<div class="interactive-zone">
    <div id="plot-vb" style="width:100%; height:400px;"></div>
</div>

<h2>Chi-Square ($\chi^2$): The Independence Test</h2>
<p>Invented by <strong>Karl Pearson</strong> (1900). It checks if a difference is real or just a fluke. If we expect 50 "Heads" but get 70, is the coin broken?</p>
<div class="interactive-zone">
    <div class="controls">
        Observed "Heads": <input type="range" id="chi-obs" min="0" max="100" value="70">
        <p>Expected was 50.</p>
        <div id="chi-math" class="math-display"></div>
    </div>
</div>
