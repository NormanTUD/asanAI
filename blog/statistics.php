<?php include_once("functions.php"); ?>

<div class="statlab-container">

<figure>
    <img style="width: 100%" src="flammarion.jpg" alt="The Flammarion Engraving" />
    <figcaption><span class="md">\citetitle{flammarion}: A symbol for man's will to venture beyond the horizon of current understanding for the sake of discovery alone</span></figcaption>
</figure>

<div class="statlab-container">

<div class="md">
## The Normal Distribution: From the Stars to AI

Artificial Intelligence is often described as "Applied Statistics." At its core, every decision an AI makes is a sophisticated calculation of likelihoods. Below is the story of a mathematical framework, originally designed to map the heavens, that now enables machines to learn from the chaos of data.

### The Astronomical Origin: Hunting Ceres

On January 1, 1801, the dwarf planet **Ceres** was spotted by \citeauthor{ceresdiscovery}. It was a monumental find, but the victory was short-lived; Ceres soon vanished into the sun's glare, leaving astronomers with only 41 days of "noisy" and uncertain data. To find it again, the world turned to **Carl Friedrich Gauss**.

<figure>
    <img style="width: 100%" src="ceres_path.png" alt="The apparant path of Ceres in the Night Sky" />
    <figcaption>\citealternativetitle{cerespath}</figcaption>
</figure>

To find Ceres, Gauss didn't just look at the sky; he looked at the **errors** of the measurements. He assumed that while the planet follows a perfect path, the telescope readings follow a **Glockenkurve** (bell curve) centered on that path.
</div>

<div class="statlab-interactive-zone">
    <div id="plot-astro" style="width:100%; height:500px;"></div>
    
    <div class="statlab-controls">
        <strong>Telescope Precision (σ):</strong>
        <input type="range" id="astro-sigma" min="0.1" max="2.0" step="0.1" value="0.5">
        <p>Lower σ = Better Telescope. The points cluster tighter to the "Truth".</p>
    </div>
</div>

<div class="md">
### The Mathematical Foundation: The Law of Errors

Gauss solved the mystery of Ceres by treating every measurement as a composite of a "True Path" and random error. He realized that the problem was "more than determined" ($n > v$); when you have more observations than variables, a perfect fit is impossible because human observation is never free from error.

To bridge the gap between discovery and mathematical permanence, he developed the **Method of Least Squares**. He sought the "Most Probable" path, not a line that touched every noisy data point, but one that minimized the sum of the squares of the errors.
</div>

<div class="statlab-interactive-zone">
    <div id="plot-gaussian" class="statlab-visual"></div>

    <div class="statlab-controls">
        <span class="md">Instead of a perfect line, let's generate **real random points** using the \citealternativetitle{boxmueller}.</span>
        Points: <input type="range" id="gauss-points" min="10" max="2000" value="500">
        Mean ($\mu$): <input type="range" id="slider-mu" min="-2" max="2" step="0.1" value="0">
        Std Dev ($\sigma$): <input type="range" id="slider-sigma" min="0.1" max="2" step="0.1" value="1">
        <div id="gauss-formula" class="statlab-math-display"></div>
    </div>
</div>

<div class="md">
### Mathematical Details of the Gaussian Framework

This concept was first formalized by \citeauthor{gauss1809} in his \citeyear{gauss1809} work \citetitle{gauss1809} (§ 175-177, p. 208-213). Gauss concluded that the most probable system of values for unknown quantities is the one that maximizes the product of their individual probabilities:
$$\Omega = \phi(\Delta) \cdot \phi(\Delta') \cdot \phi(\Delta'') \dots$$

**Key Principles:**
* **The Probability of Error**: The likelihood of a specific error $\Delta$ is defined by a function $\phi(\Delta)$.
* **Maximum Likelihood**: The function must reach its maximum value when the error is zero ($\Delta = 0$).
* **Symmetry**: The probability of an error is generally equal for equal errors in opposite directions.
* **Asymptotic Decay**: As an error becomes infinitely large, the probability $\phi(\Delta)$ must vanish toward zero.
* **The Sum of Probability**: The total integral of the probability function from $-\infty$ to $+\infty$ must equal 1.

This led to the derivation of the **Normal Distribution** formula, the bedrock for how modern machines distinguish signal from noise:
$$\phi(\Delta) = \frac{h}{\sqrt{\pi}} e^{-h^2 \Delta^2}$$
</div>

</div>

<div class="md">
## Pearson’s Biological Link: The Father-Son Study

In 1801, \citeauthor{gauss1809} used the "Normal Distribution" to find a planet; in 1895, \citeauthor{pearson1895correlation} used it to map the human race. Pearson collected heights from over 1,000 fathers and their adult sons to answer a fundamental question: *How much does one variable actually tell us about another?*



### The "Scale" Problem
Pearson noticed that while a father's height clearly influenced his son's, the raw data was messy. If you measured the father in inches and the son in centimeters, the **Covariance** (the shared direction) would change purely because of the units. 

Pearson solved this by creating the **Correlation Coefficient ($r$)**. By dividing the covariance by the product of both standard deviations ($\sigma_X \sigma_Y$), he "standardized" the relationship. This creates a pure number, independent of units, between **-1.0 and +1.0**.

### Key Findings:
* **The Shared Signal**: He found a correlation of approximately **$r \approx 0.5$** for height. This meant that while there is a strong link, it isn't a 1:1 "perfect" copy.
* **Regression to the Mean**: He observed that exceptionally tall fathers often had sons who were slightly shorter (closer to the average), and vice versa. 
* **Modern AI Utility**: In Machine Learning, we use Pearson's $r$ for **Feature Selection**. If two inputs (like "Price in USD" and "Price in EUR") have an $r$ of 1.0, they are "collinear." To an AI, this is redundant noise; we drop one to prevent the model from becoming unstable
</div>

<div class="statlab-interactive-zone">
    <div class="statlab-controls">
        <div class="control-group">
            <label>Relationship ($r$):</label>
            <input type="range" id="corr-strength" min="-1" max="1" step="0.01" value="0.7">
        </div>
        <div class="control-group">
            <label>Scale $X$ ($\sigma_X$):</label>
            <input type="range" id="corr-sigma-x" min="0.5" max="5" step="0.1" value="1.0">
        </div>
        <div class="control-group">
            <label>Scale $Y$ ($\sigma_Y$):</label>
            <input type="range" id="corr-sigma-y" min="0.5" max="5" step="0.1" value="1.0">
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
## Bayesian Updating: The Logic of Science

While Gauss sought the "True Path" of planets among noisy observations, the Reverend **Thomas Bayes** was interested in a deeper philosophical question: how do we update our beliefs when we encounter new evidence?

His work, published posthumously in \citeyear{bayes1763essay} as \citetitle{bayes1763essay}, provides the mathematical engine for **induction**. In modern AI, this is how a machine "changes its mind." It doesn't just see a pixel; it calculates how that pixel changes its confidence in what it is looking at.

### The Anatomy of an Update
The goal of Bayesian inference is to calculate the **Posterior**, your updated degree of belief in a hypothesis ($H$) after seeing evidence ($E$).

$$P(H|E) = \frac{\overbrace{P(E|H)}^{\text{Likelihood}} \cdot \overbrace{P(H)}^{\text{Prior}}}{\underbrace{P(E|H)P(H) + P(E|\neg H)P(\neg H)}_{\text{Total Evidence } P(E)}}$$

* **The Prior $P(H)$**: Your initial strength of belief before the new data arrives.
* **The Likelihood $P(E|H)$**: The probability that you would see this specific evidence if your hypothesis were actually true.
* **The Marginal Likelihood $P(E)$**: The "Total Evidence", the probability of seeing this data under *all* possible scenarios (both when $H$ is true and when it is false).

### The "Spam Filter" Logic
Imagine your "Prior" belief that any random email is spam is 20%. You then see the word **"WINNER"**.

1.  If the email *is* spam, the word "WINNER" appears 90% of the time (**Likelihood**).
2.  If the email *is not* spam, the word "WINNER" still appears 10% of the time (**False Positive**).

Bayesian updating allows us to weigh these possibilities to find the new probability that the email is spam.
</div>

<div class="statlab-interactive-zone">
    <div class="statlab-controls">
        <div class="control-group">
            <label>Initial Belief (Prior) $P(H)$:</label>
            <input type="range" id="bay-prior-new" min="0.01" max="0.99" step="0.01" value="0.20">
        </div>
        <div class="control-group">
            <label>Signal Strength (Likelihood) $P(E|H)$:</label>
            <input type="range" id="bay-tp" min="0.01" max="0.99" step="0.01" value="0.90">
            <p style="font-size:0.8em; color:gray;">(Prob. evidence appears if H is TRUE)</p>
        </div>
        <div class="control-group">
            <label>Noise/False Alarms $P(E|\neg H)$:</label>
            <input type="range" id="bay-fp" min="0.01" max="0.99" step="0.01" value="0.10">
            <p style="font-size:0.8em; color:gray;">(Prob. evidence appears if H is FALSE)</p>
        </div>

        <div id="bay-math-complex" class="statlab-math-display" style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;"></div>
    </div>
    <div id="plot-bayesian-migration" class="statlab-visual" style="height: 400px;"></div>
</div>

<div class="md">
## Entropy (The Messiness Scale)
\citeauthor{shannon1948communication} introduced this in his \citeyear{shannon1948communication} paper \citetitle{shannon1948communication}. It measures uncertainty. If you are 100% sure what happens next, Entropy is 0. If you are totally clueless, Entropy is high.
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
Proved by \citeauthor{laplace1810clt} (1810). It says that if you add enough random things together, you always get a Bell Curve. Even if the original thing (like a die) isn't a curve!
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
Introduced by \citeauthor{pearson1894zscore}.

How do we compare a student's height (170cm) with their test score (80/100)? We turn them into "Z-Scores", how many standard deviations they are from the average.
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

<div class="md">
## Least Squares: The Gauss-Legendre Rivalry

The foundation of AI training (Gradient Descent) was born from an 18th-century race to map the stars. **Adrien-Marie Legendre** \citeyear{legendre1805} published the method first, but **Carl Friedrich Gauss** \citeyear{gauss1809} proved why it worked by inventing the **Normal Distribution**.

### The Principle of Least Squares
When we have "noisy" data points, we find the best-fitting line by minimizing the area of the squares formed by the distance between the data and the line.

$$S = \sum_{i=1}^{n} \underbrace{(y_i - f(x_i))^2}_{\text{The Squared Residual}}$$

* **The Residual:** The distance between the "Truth" and the "Observation."
* **Squaring the Error:** This ensures that large errors are punished more severely than small ones (a core principle of modern Loss Functions).
* **The Normal Link:** Gauss proved that if your errors are distributed as $\mathcal{N}(0, \sigma^2)$, then the line that minimizes these squares is the **Maximum Likelihood Estimate**.


</div>

<div class="statlab-interactive-zone">
    <div class="statlab-controls">
        <div class="control-group">
            <label>Measurement Noise ($\sigma$):</label>
            <input type="range" id="gl-noise-new" min="0" max="5" step="0.1" value="1.5">
        </div>
        <div class="control-group">
            <label>Observation Count ($n$):</label>
            <input type="range" id="gl-n-new" min="5" max="50" step="1" value="10">
        </div>

        <div id="gl-math-complex" class="statlab-math-display" style="background: #fdfaf2; padding: 20px; border-radius: 12px; border: 1px solid #fef3c7;"></div>
    </div>
    <div id="plot-gauss-legendre" class="statlab-visual" style="height: 450px;"></div>
</div>
