<?php include_once("functions.php"); ?>

<div class="statlab-container">

<div class="md">
Artificial Intelligence is essentially "Applied Statistics." Every decision an AI makes is a numerical calculation of likelihoods. Below is the math that allows machines to learn from chaos.

## The Normal Distribution (The Law of Errors)

Artificial Intelligence is essentially "Applied Statistics". Every decision an AI makes is a numerical calculation of likelihoods. Below is the mathematical framework—originally designed to map the stars—that now allows machines to learn from data.

First popularized by \citeauthor{gausstheoriamotus} in his \citeyear{gausstheoriamotus} work \citetitle{gausstheoriamotus} (§ 175-177, p. 208-213). He used it to predict where planets would be. In AI, we assume most data follows this curve.

### The Astronomical Origin: Hunting Ceres
The Normal Distribution wasn't born in a lab, but in the stars. In 1801, the dwarf planet **Ceres** was discovered, then lost behind the sun's glare. Astronomers had only a few "noisy" observations to find it again.

Gauss solved this by viewing every measurement as a mix of **truth + random error**. He realized:
* **Redundancy is Key:** When you have more data than variables ($n > v$), a perfect fit is impossible because observations are never error-free.
* **The "Most Probable" Path:** Instead of a line that hits every point, he sought the path where the sum of the squares of the errors was minimized—assuming errors follow a bell curve.

In AI, we do the same: we treat data points like Gauss treated star sightings, using the **Normal Distribution** to find the most likely "truth" hidden inside noisy data.

First formalized by **Carl Friedrich Gauss** in his 1809 work *Theoria Motus Corporum Coelestium* (§ 175-177). Gauss moved from specific problems to a general inquiry into the application of calculus to natural philosophy. He noted that when we have multiple observations for unknown values, the problem becomes "more than determined" ($n > v$), and a perfect representation is impossible because observations are never absolutely free from error.


### Key Principles from Gauss:
* **The Probability of Error**: The probability of a specific error $\Delta$ is expressed by a function $\phi(\Delta)$.
* **Maximum Likelihood**: While the precise function may be difficult to assign, its value must be maximum when the error is zero ($\Delta = 0$).
* **Symmetry**: The probability is generally equal for equal opposite errors.
* **Asymptotic Decay**: As the error becomes very large, the probability $\phi(\Delta)$ must vanish or converge to zero.
* **The Sum of Probability**: The integral of the probability function from $-\infty$ to $+\infty$ must necessarily equal 1.

Gauss famously concluded that the most probable system of values for unknown quantities is the one that maximizes the product of their individual probabilities:
$$\Omega = \phi(\Delta) \cdot \phi(\Delta') \cdot \phi(\Delta'') \dots$$

This led to the derivation of the **Normal Distribution** formula:
$$\phi(\Delta) = \frac{h}{\sqrt{\pi}} e^{-h^2 \Delta^2}$$

In modern AI, we still assume most natural data follows this "Bell Curve". It serves as the bedrock for how machines distinguish between meaningful signals and random noise.
</div>

<div class="statlab-interactive-zone">
    <div class="statlab-controls">
        <p>Instead of a perfect line, let's generate <strong>real random points</strong> using the Box-Muller transform.</p>
        Points: <input type="range" id="gauss-points" min="10" max="2000" value="500">
        Mean ($\mu$): <input type="range" id="slider-mu" min="-2" max="2" step="0.1" value="0">
        Std Dev ($\sigma$): <input type="range" id="slider-sigma" min="0.1" max="2" step="0.1" value="1">
        <div id="gauss-formula" class="statlab-math-display"></div>
    </div>
    <div id="plot-gaussian" class="statlab-visual"></div>
</div>

<div class="md">
## Correlation & Covariance
Developed by **Karl Pearson** (1895). It measures how much two variables "dance together." If $r=1$, they move in perfect sync. If $r=0$, they ignore each other.
</div>

<div class="statlab-interactive-zone">
    <div class="statlab-controls">
        Strength ($r$): <input type="range" id="corr-strength" min="-1" max="1" step="0.01" value="0.7">
        <p>Matrix representation:</p>
        <pre id="cov-matrix" class="statlab-matrix-pre"></pre>
    </div>
    <div id="plot-correlation" class="statlab-visual"></div>
</div>

<div class="md">
## Bayesian Updating: Changing Your Mind
Named after **Thomas Bayes** (published posthumously in 1763). It is the logic of science: $P(A|B)$ is your "New Belief" after seeing evidence $B$.

$$P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}$$

**Scenario:** You get an email with the word "WINNER". 
$P(A)$ is the chance any email is spam (Prior). $P(B|A)$ is how often "WINNER" appears in spam (Likelihood).
</div>

<div class="statlab-interactive-zone">
    <div class="statlab-controls">
        Prior $P(Spam)$: <input type="range" id="bay-prior" min="0.01" max="0.99" step="0.01" value="0.2">
        Likelihood $P(Win|Spam)$: <input type="range" id="bay-likeli" min="0.01" max="0.99" step="0.01" value="0.9">
        <div id="bay-eq-dynamic" class="statlab-math-display"></div>
    </div>
    <div style="text-align: center; flex: 0.5;">
        <div class="statlab-bay-meter">
            <div id="bay-result-box" class="statlab-bay-fill"></div>
        </div>
        <p>Probability it is Spam:<br><strong id="bay-text" style="font-size: 1.5em;">0%</strong></p>
    </div>
</div>

<div class="md">
## Entropy (The Messiness Scale)
**Claude Shannon** introduced this in his 1948 paper *A Mathematical Theory of Communication*. It measures uncertainty. If you are 100% sure what happens next, Entropy is 0. If you are totally clueless, Entropy is high.
</div>

<div class="statlab-interactive-zone">
    <div class="statlab-controls">
        Probability of Outcome ($p$): <input type="range" id="ent-p" min="0.01" max="0.99" step="0.01" value="0.5">
        <p>Surprise Factor: <strong id="ent-val"></strong></p>
        <div id="ent-math" class="statlab-math-display"></div>
    </div>
</div>

<div class="md">
## Central Limit Theorem
Proved by **Pierre-Simon Laplace** (1810). It says that if you add enough random things together, you always get a Bell Curve. Even if the original thing (like a die) isn't a curve!
</div>

<div class="statlab-interactive-zone">
    <div class="statlab-controls">
        <button id="clt-roll" class="statlab-btn-action">Roll 12 Dice (100 times)</button>
        <p>Each bar represents the average of 12 random dice rolls. Watch it become Gaussian!</p>
    </div>
    <div id="plot-clt" class="statlab-visual"></div>
</div>

<div class="md">
## Standardizing: Z-Scores
How do we compare a student's height (170cm) with their test score (80/100)? We turn them into "Z-Scores"—how many standard deviations they are from the average.
</div>

<div class="statlab-interactive-zone">
    <div class="statlab-controls">
        Value ($x$): <input type="range" id="z-x" min="0" max="200" value="120">
        Mean ($\mu$): <input type="range" id="z-mu" min="0" max="200" value="100">
        Std Dev ($\sigma$): <input type="range" id="z-sigma" min="1" max="50" value="15">
        <div id="z-math" class="statlab-math-display"></div>
    </div>
</div>

<div class="md">
## Bias vs. Variance
A fundamental trade-off in learning. 
**Bias** is when your model is too "stiff" (like a straight line for a curve). 
**Variance** is when it's too "jumpy" (tracking every random bit of noise).
</div>

<div class="statlab-interactive-zone">
    <div id="plot-vb" style="width:100%; height:400px;"></div>
</div>

<div class="md">
## Chi-Square ($\chi^2$): The Independence Test
Invented by **Karl Pearson** (1900). It checks if a difference is real or just a fluke. If we expect 50 "Heads" but get 70, is the coin broken?
</div>

<div class="statlab-interactive-zone">
    <div class="statlab-controls">
        Observed "Heads": <input type="range" id="chi-obs" min="0" max="100" value="70">
        <p>Expected was 50.</p>
        <div id="chi-math" class="statlab-math-display"></div>
    </div>
</div>

</div>
