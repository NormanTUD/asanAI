<?php include_once("functions.php"); ?>

<div class="statlab-container">

<figure>
    <img style="width: 100%" src="flammarion.jpg" alt="The Flammarion Engraving" />
    <figcaption><span class="md">\citetitle{flammarion}: A symbol for man's will to venture beyond the horizon of current understanding for the sake of discovery alone</span></figcaption>
</figure>

<div class="md">
## The Normal Distribution: From the Stars to AI

Artificial Intelligence is often described as "Applied Statistics." At its core, every decision an AI makes is a sophisticated calculation of likelihoods. Below is the mathematical framework—originally designed to map the heavens—that now enables machines to learn from the chaos of data.

This concept was first formalized by \citeauthor{gausstheoriamotus} in his \citeyear{gausstheoriamotus} work \citetitle{gausstheoriamotus} (§ 175-177, p. 208-213). While Gauss moved from specific astronomical problems to a general inquiry into calculus and natural philosophy, his primary breakthrough was born from a cosmic mystery.

### The Astronomical Origin: Hunting Ceres

On January 1, 1801, the dwarf planet **Ceres** was spotted by \citeauthor{ceresdiscovery}. It was a monumental find, but the victory was short-lived; Ceres soon vanished into the sun's glare, leaving astronomers with only 41 days of "noisy" and uncertain data. To find it again, the world turned to **Carl Friedrich Gauss**. 

Gauss realized that the problem was "more than determined" ($n > v$); when you have more observations than variables, a perfect fit is impossible because human observation is never free from error. To bridge the gap between discovery and mathematical permanence, he developed the **Method of Least Squares**.

Gauss solved the mystery of Ceres by treating every measurement as a composite of a "True Path" and random error. He sought the "Most Probable" path—not a line that touched every noisy data point, but one that minimized the sum of the squares of the errors. He concluded that these errors naturally cluster into a **Glockenkurve** (bell curve) centered around the truth.

### Key Principles of the Gaussian Framework:
* **The Probability of Error**: The likelihood of a specific error $\Delta$ is defined by a function $\phi(\Delta)$.
* **Maximum Likelihood**: The function must reach its maximum value when the error is zero ($\Delta = 0$).
* **Symmetry**: The probability of an error is generally equal for equal errors in opposite directions.
* **Asymptotic Decay**: As an error becomes infinitely large, the probability $\phi(\Delta)$ must vanish toward zero.
* **The Sum of Probability**: The total integral of the probability function from $-\infty$ to $+\infty$ must equal 1.

Gauss famously concluded that the most probable system of values for unknown quantities is the one that maximizes the product of their individual probabilities:
$$\Omega = \phi(\Delta) \cdot \phi(\Delta') \cdot \phi(\Delta'') \dots$$

This led to the derivation of the **Normal Distribution** formula:
$$\phi(\Delta) = \frac{h}{\sqrt{\pi}} e^{-h^2 \Delta^2}$$

In modern AI, we still treat data points exactly as Gauss treated star sightings. This formula remains the bedrock for how machines distinguish meaningful signals from random noise.
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
## Gauss & the "Law of Errors"

<figure>
    <img style="width: 100%" src="ceres_path.png" alt="The apparant path of Ceres in the Night Sky" />
    <figcaption>\citealternativetitle{cerespath}</figcaption>
</figure>

To find Ceres, Gauss didn't just look at the sky; he looked at the **errors** of the measurements. He assumed that while the planet follows a perfect path, the telescope readings follow a **Glockenkurve** centered on that path.
</div>

<div class="statlab-interactive-zone">
    <div class="statlab-controls">
        <strong>Telescope Precision (σ):</strong>
        <input type="range" id="astro-sigma" min="0.1" max="2.0" step="0.1" value="0.5">
        <p>Lower σ = Better Telescope. The points cluster tighter to the "Truth".</p>
    </div>
    <div id="plot-astro" style="width:100%; height:500px;"></div>
</div>

<div class="md">
## Correlation & Covariance: The Dance of Variables

While Gauss mapped the heavens, \citeauthor{pearson1895correlation} sought to map the relationships between biological traits. In \citeyear{pearson1895correlation}, he formalized the **Product-Moment Correlation Coefficient ($r$)** to solve a specific problem: how do we measure the "link" between two variables (like height and weight) without being misled by their different scales?

### From Direction to Strength
* **Covariance**: Measures the *direction* of a relationship. If $cov(X,Y) > 0$, they increase together. However, its value is uninterpretable because it changes if you switch from meters to centimeters.
* **Correlation ($r$)**: By dividing covariance by the product of standard deviations ($\sigma_X \sigma_Y$), Pearson "standardized" the link. This creates a pure number between **-1.0** (perfect inverse) and **+1.0** (perfect sync).

### Practical AI Use: Feature Selection
In modern AI, this math is the first line of defense against redundant data. If two inputs have $r \approx 1.0$, they are "collinear"—meaning they provide the same information. Dropping one reduces model complexity and prevents numerical instability. The **Covariance Matrix** shown below is how a machine "sees" the entire web of relationships in a dataset simultaneously.
</div>

<div class="statlab-interactive-zone">
    <div class="statlab-controls">
        <div class="control-group">
            <label>Relationship ($r$):</label>
            <input type="range" id="corr-strength" min="-1" max="1" step="0.01" value="0.7">
        </div>
        <div class="control-group">
            <label>Mean $X$ ($\mu_x$):</label>
            <input type="range" id="corr-mu-x" min="-4" max="4" step="0.1" value="0">
        </div>
        <div class="control-group">
            <label>Mean $Y$ ($\mu_y$):</label>
            <input type="range" id="corr-mu-y" min="-4" max="4" step="0.1" value="0">
        </div>

        <p><strong>1. The Inputs & Data:</strong></p>
        <div id="var-definitions" class="statlab-math-display" style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 10px;"></div>

        <p><strong>2. The Center (Means):</strong></p>
        <div id="mu-calculation" class="statlab-math-display" style="background: #edf2f7; padding: 15px; border-radius: 8px; margin-bottom: 10px;"></div>
        
        <p><strong>3. The Relationship (Covariance):</strong></p>
        <div id="cov-definition" class="statlab-math-display" style="background: #f0f4f8; padding: 15px; border-radius: 8px; margin-bottom: 10px;"></div>
        
        <p><strong>4. The Standardized Result:</strong></p>
        <div id="corr-math-breakdown" class="statlab-math-display" style="background: #fffbe6; padding: 15px; border-radius: 8px;"></div>
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
