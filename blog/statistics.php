<?php include_once("functions.php"); ?>

<div class="statlab-container">

<figure>
    <img style="width: 100%" src="flammarion.jpg" alt="The Flammarion Engraving" />
    <figcaption><span class="md">\citetitle{flammarion}: A symbol for man's will to venture beyond the horizon of current understanding for the sake of discovery alone</span></figcaption>
</figure>

<div class="statlab-container">

<div class="md">
## The Normal Distribution: From the Stars to AI

<figure>
    <img style="width: 100%" src="ceres.jpg" alt="The Dwarf Planet Ceres" />
    <figcaption>\citetitle{ceresimage} in \citeyear{ceresimage}</figcaption>
</figure>

Artificial Intelligence is often described as "Applied Statistics." At its core, every decision an AI makes is a sophisticated calculation of likelihoods. Below is the story of a mathematical framework, originally designed to map the heavens, that now enables machines to learn from the chaos of data.

### The Astronomical Origin: Hunting Ceres

On January 1, 1801, the dwarf planet **Ceres** was spotted by \citeauthor{ceresdiscovery}. It was a monumental find, but the victory was short-lived; Ceres soon vanished into the sun's glare, leaving astronomers with only 41 days of "noisy" and uncertain data. To find it again, the world turned to **Carl Friedrich Gauss**. He, in \citeyear{gauss1809} his work \citetitle{gauss1809} (§ 175-177, p. 208-213), solved this problem, by looking not at single data points, but the whole group of data points as a whole, and the idea that the truth must be somewhere in between.

<figure>
    <img style="width: 100%" src="ceres_path.png" alt="The apparant path of Ceres in the Night Sky" />
    <figcaption>\citealternativetitle{cerespath}</figcaption>
</figure>

To find Ceres, Gauss didn't just look at the sky; he looked at the **errors** of the measurements. He assumed that while the planet follows a perfect path (green line), the telescope readings (blue dots) follow a **Bell Curve** centered on that path.
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
</div>

<div class="md">
## Least Squares: The Gauss-Legendre Rivalry

**Adrien-Marie Legendre** \citeyear{legendre1805} published the method first, but **Carl Friedrich Gauss** \citeyear{gauss1809} proved why it worked by inventing the **Normal Distribution**.

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
### Entropy (The Messiness Scale)

While Gauss sought to minimize error in orbits, **Claude Shannon** in \citeyear{shannon1948communication} aimed to find the mathematical limit of communication. His goal was to quantify "Information" itself. He realized that information isn't about what is said, but about how **surprising** the outcome is.

If we toss a coin, each outcome is a state $x_i$. 

$$H(X) = - \sum_{i=1}^{n} \underbrace{P(x_i)}_{\text{Probability}} \cdot \underbrace{\log_2 P(x_i)}_{\text{The "Surprise" (Bits)}}$$

* **$x_i$ Explained:** This represents the $i$-th possible outcome. For our coin, $x_1 = \text{Heads}$ and $x_2 = \text{Tails}$.
* **The Goal:** Shannon wanted a measure that was maximal when uncertainty was highest. If a coin is "fair" ($0.5/0.5$), you are maximally surprised by the result. If a coin is "weighted" ($1.0/0.0$), there is no surprise, so Entropy is zero.


</div>

<div class="statlab-interactive-zone">
    <div class="statlab-controls" style="max-width: 600px; margin: 0 auto;">
        
        <div class="control-group" style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
            <svg width="60" height="60" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="#ffd700" stroke="#b8860b" stroke-width="3" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#b8860b" stroke-width="1" stroke-dasharray="2,2" />
                <text x="50" y="65" font-family="Arial" font-size="40" font-weight="bold" fill="#b8860b" text-anchor="middle">🙂</text>
            </svg>
            
            <div style="flex-grow: 1;">
                <label style="font-size: 1.1em;"><strong>Head:</strong> <span id="label-head">50</span> / 100</label>
                <input type="range" id="entropy-p1" min="0" max="100" step="1" value="50" style="width: 100%; cursor: pointer;">
            </div>
        </div>
        
        <div class="control-group" style="display: flex; align-items: center; gap: 20px;">
            <svg width="60" height="60" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="#ffd700" stroke="#b8860b" stroke-width="3" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#b8860b" stroke-width="1" stroke-dasharray="2,2" />
                <text x="50" y="65" font-family="Arial" font-size="40" font-weight="bold" fill="#b8860b" text-anchor="middle">1€</text>
            </svg>
            
            <div style="flex-grow: 1;">
                <label style="font-size: 1.1em;"><strong>Tail:</strong> <span id="label-tail">50</span> / 100</label>
                <input type="range" id="entropy-p2" min="0" max="100" step="1" value="50" style="width: 100%; cursor: pointer;">
            </div>
        </div>
    </div>

    <div id="entropy-math-complex" class="statlab-math-display" style="padding: 25px; background: #fdfaf2; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0;">
        </div>

    <div id="plot-entropy" style="width: 100%; height: 350px;"></div>
</div>

<div class="md">
This concept is the backbone of modern AI. When a model like GPT predicts the next word, it calculates the **Cross-Entropy** between its guess and the actual word. The lower the entropy, the more "certain" and accurate the model has become.
</div>

<div class="md">
## The Central Limit Theorem (CLT)
The **Central Limit Theorem** is the bridge between randomness and order. It explains why, even when individual events are chaotic or "flat," their collective averages inevitably form the **Normal Distribution** (the "Bell Curve"). It was proven by \citeauthor{laplace1810clt} (\citeyear{laplace1810clt}).

The origins of CLT lie in the 18th-century struggle for precision in the physical sciences. **Pierre-Simon Laplace** formalized the theorem in \citetitle{laplace1812} to solve the "Problem of Errors." 

Astronomers of the era faced a dilemma: every measurement taken via telescope or pendulum was slightly "noisy" due to atmospheric disturbances or human imperfection. Laplace proved that the **average** of these independent errors would always follow a bell curve, regardless of the nature of the individual mistakes. This realization allowed scientists to mathematically "filter" chaos to find the true position of celestial bodies. By aggregating thousands of imprecise data points, Laplace turned statistical noise into scientific certainty—a method that remains the foundation for how machines learn from "imperfect" real-world data today.

### The Mechanics of the Simulation
1.  **Individual Randomness**: A single die follows a **Uniform Distribution**; every face ($1$ to $6$) has an equal $1/6$ probability.
2.  **Aggregation**: When you roll $n$ dice and calculate their **average**, the probability shifts. It is much more likely to get an average near $3.5$ than to roll all $1$s or all $6$s.
3.  **The Convergence**: As $n$ increases, the distribution of these averages tightens around the mean ($\mu = 3.5$).
4.  **The Red Line**: This represents the **Probability Density Function (PDF)** for a Normal Distribution, calculated as:
    $$f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$$
    where the standard deviation $\sigma$ decreases as more dice are added ($\sigma = \sqrt{\frac{35}{12n}}$), as noted in \citetitle{laplace1810clt}.

### Interactive Laboratory
* **Adjust $n$**: Choose how many dice to roll at once. Higher $n$ creates a thinner, sharper curve.
* **Accrue Data**: Click "Roll" repeatedly. The blue bars represent your real-world samples, while the red line shows the mathematical ideal.
* **Reset**: Clear the history to start a new experiment with a different $n$.
</div>

<div class="statlab-interactive-zone" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: #fff; display: flex; flex-direction: column; gap: 20px;">
    
    <div id="plot-clt" style="width:100%; height:380px;"></div>
    
    <div class="statlab-controls" style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 8px;">
                <span>Number of dice per roll ($n$):</span>
                <span id="clt-n-label" style="color: #2563eb; font-size: 1.2em;">10</span>
            </div>
            <input type="range" id="clt-n" min="1" max="50" value="10" style="width: 100%; cursor: pointer;" oninput="document.getElementById('clt-n-label').innerText = this.value">
            <p style="font-size: 0.85em; color: #64748b; margin-top: 10px;">
                We are tracking the <strong>average</strong> of these $n$ dice. Current samples in chart: <span id="clt-count" style="font-weight: bold; color: #1e293b;">0</span>
            </p>
        </div>
        
        <div style="display: flex; gap: 10px;">
            <button onclick="rollCLT()" style="background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; flex: 2; transition: background 0.2s;">Roll Dice & Add to Plot</button>
            <button onclick="resetCLT()" style="background: #ef4444; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; flex: 1;">Reset Data</button>
        </div>
    </div>

    <div id="dice-container" style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; min-height: 50px; padding: 15px; background: #fff; border: 1px dashed #cbd5e1; border-radius: 8px;">
        <span style="color: #94a3b8; font-style: italic;">Roll the dice to see individual results here...</span>
    </div>
</div>

<div class="md">
## Standardizing: Z-Scores & The Pearson Problem
In the late 19th century, \citeauthor{pearson1894zscore} faced a biological puzzle: How do you compare the variation of a small organ in a crab to the variation of a large bone in a human? A 1cm difference is massive for a crab but negligible for a human.

Pearson realized that to compare "variation" across different scales, he had to divide the distance from the average by the "standard" unit of spread for that specific group. This created the **Z-score**: a dimensionless number that represents how "extreme" an observation is, regardless of its original units.


</div>

<div class="statlab-interactive-zone">
    <div class="statlab-controls">
        <label>Observation ($x$):</label> 
        <input type="range" id="z-x" min="0" max="200" value="130">
        
        <label>Population Mean ($\mu$):</label> 
        <input type="range" id="z-mu" min="0" max="200" value="100">
        
        <label>Standard Deviation ($\sigma$):</label> 
        <input type="range" id="z-sigma" min="1" max="50" value="15">
        
        <div id="z-math" class="statlab-math-display"></div>
    </div>
</div>

<div class="md">
## Chi-Square ($\chi^2$): The Test of Independence
Invented by \citeauthor{chisquared} in \citeyear{chisquared} (p 157-175), the $\chi^2$ test was originally designed to solve a problem in evolutionary biology: how to determine if the variation between observed groups is a result of a real relationship or merely the "noise" of random chance. Pearson sought to quantify the "goodness of fit" between a theoretical model and actual data.

### The Action Plan
1. **Hypothesize ($H_0$):** Assume no relationship exists (e.g., the coin is fair).
2. **Determine Expectations ($E$):** Calculate what counts you should see under $H_0$.
3. **Observe Reality ($O$):** Collect the actual data.
4. **Calculate Deviation:** Measure how far reality is from expectation.
5. **Normalize & Sum:** Divide by expectation to weight the deviations fairly.

### The Equation of "Surprise"
The abstract formula represents the total sum of weighted squared differences:

$$\chi^2 = \sum \frac{(O_i - E_i)^2}{E_i}$$

To understand the mechanics, we can break down the components using $\underbrace{\dots}_{\text{explanation}}$:

$$\chi^2 = \sum_{i=1}^{k} \underbrace{\frac{(\overbrace{O_i}^{\text{Observed}} - \overbrace{E_i}^{\text{Expected}})^2}{\underbrace{E_i}_{\text{Scaling Factor}}}}_{\text{Weighted squared error for category } i}$$

**Practical Example:**
If you flip a coin 100 times, you expect 50 Heads ($E$). If you observe 70 Heads ($O$), the "surprise" factor is:
$$\chi^2 = \underbrace{\frac{(70 - 50)^2}{50}}_{\text{Heads deviation}} + \underbrace{\frac{(30 - 50)^2}{50}}_{\text{Tails deviation}} = \frac{400}{50} + \frac{400}{50} = \mathbf{16}$$
A score of 16 is much higher than the standard threshold (3.84), proving the coin is likely biased.
</div>

<div class="statlab-interactive-zone">
    <div class="statlab-controls">
        <label>Observed Heads ($O$):</label> 
        <input type="range" id="chi-obs-a" min="0" max="100" value="70">
        
        <label>Expected Heads ($E$):</label> 
        <input type="range" id="chi-exp-a" min="1" max="100" value="50">
        
        <div id="chi-math-result" class="statlab-math-display"></div>
    </div>
</div>
