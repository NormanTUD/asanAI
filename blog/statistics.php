<?php include_once("functions.php"); ?>

<div class="md">
Artificial Intelligence is often described as "Applied Statistics." At its core, every decision an AI makes is a sophisticated calculation of likelihoods. Below are the background stories of some mathematical frameworks, originating from all kinds of research, for example, playing games, and mapping the heavens, that now enables machines to learn from the chaos of data.
</div>

<div class="statlab-container">

<figure>
    <img style="width: 100%" src="flammarion.jpg" alt="The Flammarion Engraving" />
    <figcaption><span class="md">\citetitle{flammarion}: A symbol for man's will to venture beyond the horizon of current understanding for the sake of discovery alone</span></figcaption>
</figure>

<div class="statlab-container">
<div class="statlab-section">
    <div class="md">
## Distributions

The key takeaway when studying distributions is not to memorize them, but to understand how large datasets behave. In real-world scenarios, it’s rare to find data that perfectly matches a theoretical distribution. However, exploring these distributions encourages you to think about data differently, not as isolated points, but as a cohesive whole.

In practice, many real-world datasets approximate theoretical distributions closely enough to make these models useful. This allows us to apply statistical methods effectively, even if the match isn’t perfect. By doing so, we gain insights into the underlying patterns and behaviors of the data, which is essential for making informed decisions and predictions.

Methods used here are also applied in many areas of Machine Learning, such as **initializing neural networks**, **generating synthetic data**, **modeling uncertainty in predictions**, and **optimizing algorithms**. Understanding distributions is a foundational skill that bridges statistical theory and practical applications in AI and data science.

### How knowing about distributions help in developing AI systems

The observation of these "distributions" in real-world data, from the photons captured by a telescope to the pixel intensities in medical imaging, is fundamental to AI because it allows machines to model uncertainty. Most natural phenomena are not random chaos but follow mathematical patterns; by recognizing a Gaussian distribution, an AI can distinguish between meaningful "signal" and background noise. For example, in autonomous driving, sensors must decide if a blurred shape is a pedestrian or a lens flare. By knowing the distribution of typical sensor errors, the AI can apply what David Wheeler famously noted: "We can solve any problem by introducing an extra level of indirection." Here, the abstraction of the data into a probability curve allows the machine to make a calculated "guess" rather than stalling on an exact match.

Furthermore, these distributions are the backbone of the "scaling laws" that drive modern large language models. As described in \citetitle{sutton2019bitter} by Rich Sutton, progress in AI often comes from "massive amounts of compute" applied to general statistical patterns rather than hand-coded human rules. When an AI is trained on vast datasets, it is essentially learning to map the distribution of human language. Practical applications like predictive text or weather forecasting rely on the fact that the next word or the next storm front follows a predictable frequency distribution. Knowing these patterns allows developers to initialize neural networks more effectively, ensuring that the model "expects" the right kind of variation in the data it encounters.
</div>

<div class="statlab-section">
    <div class="md">
        ### The Bernoulli Distribution: The Atom of Probability
        In \citetitle{arsconjectandi} (\citeyear{arsconjectandi}), \citeauthor{arsconjectandi} defined the simplest possible random variable. It models a single experiment with two outcomes: Success ($1$) and Failure ($0$). It is the "atom" because all complex discrete distributions (like Binomial or Geometric) are just sequences of Bernoulli trials.

        The probability $p$ is the only parameter. If $p=0.8$, you have an $80\%$ chance of success. The math is expressed as:
        $$P(X=x) = p^x (1-p)^{1-x} \quad \text{for } x \in \{0, 1\}$$



        This determines the "Expected Value" $E[X] = p$. In simple terms, if you flip a biased coin, this distribution tells you exactly how "unbalanced" the world is for that one flip.
    </div>
    <div class="statlab-interactive-zone">
        <label>Probability of Success ($p$):</label>
        <input type="range" id="bern-p" min="0" max="1" step="0.01" value="0.7">
        <span id="bern-p-val">0.70</span>
        <div id="bernoulli-chart"></div>
    </div>
</div>

<div class="md">

#### The Binomial Distribution

While people have rolled dice for millennia, the math of *sums* was long misunderstood. For centuries, gamblers thought all sums were equally likely.


##### The Medieval Insight (c. 1250)
The earliest known mention of the differing frequencies of dice sums appears in a Latin poem called \citetitle{devetula} (p. 32), whose author is not certain. The author correctly identified that there are only 16 ways to get sums with three dice that result in a specific value, noting for the first time that some totals occur more often than others.

##### The Gambler's Manual: Gerolamo Cardano (1564)

The first truly scientific treatment came from **Gerolamo Cardano**, who also invented the cardan shaft, a brilliant physician and a degenerate gambler. In his book *\citetitle{liberludo}* (chapter 13, *On Composite Numbers Up to Six and Beyond and for Two and Three Dice*), he was probably the first to realize that for two dice, the "circuit" is **36**, and he used this to calculate the odds for the lucky throw.

##### The Great Correspondence: Pascal & Fermat (1654)

The context that solidified this into modern science was the **"Problem of Points."** The **Chevalier de Méré** asked **Blaise Pascal** how to fairly split a prize pot if a game of dice is interrupted.

Pascal wrote to **Pierre de Fermat**, and their exchange of letters is considered the founding moment of probability theory. They moved beyond mere counting and began using the **Binomial Coefficients** (Pascal's Triangle) to predict outcomes for any number of dice (\cite{oevresdeformat}, p. 288ff).
</div>

    <div class="statlab-interactive-zone" style="display: block !important">
        <div id="dice-matrix-container" style="background: #f1f5f9; padding: 15px; border-radius: 12px; border: 1px dashed #cbd5e1;">
            </div>
        
        <div id="dice-distribution-plot" style="margin-top: 20px;"></div>
    </div>

    <div class="md">

    </div>
</div>

<div class="md">
### The Normal Distribution: From the Stars to AI
</div>

<figure>
    <img style="width: 100%" src="ceres.jpg" alt="The Dwarf Planet Ceres" />
    <figcaption class="md">\citetitle{ceresimage} in \citeyear{ceresimage}</figcaption>
</figure>

<div class="md">
#### The Astronomical Origin: Hunting Ceres

On January 1, 1801, the dwarf planet **Ceres** was spotted by \citeauthor{ceresdiscovery}. It was a monumental find, but the victory was short-lived; Ceres soon vanished into the sun's glare, leaving astronomers with only 41 days of "noisy" and uncertain data. To find it again, the world turned to **Carl Friedrich Gauß**. He, in \citeyear{gauss1809} his work \citetitle{gauss1809} (§ 175-177, p. 208-213), solved this problem, by looking not at single data points, but the whole group of data points as a whole, and the idea that the truth must be somewhere in between.
</div>

<figure>
    <img style="width: 100%" src="ceres_path.png" alt="The apparant path of Ceres in the Night Sky" />
    <figcaption class="md">\citealternativetitle{cerespath}</figcaption>
</figure>

<div class="md">
To find Ceres, Gauß didn't just look at the sky; he looked at the **errors** of the measurements. He assumed that while the planet follows a perfect path (green line), the telescope readings (blue dots) follow a **Bell Curve** centered on that path.
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
#### The Mathematical Foundation: The Law of Errors

Gauß solved the mystery of Ceres by treating every measurement as a composite of a "True Path" and random error. He realized that the problem was "more than determined" ($n > v$); when you have more observations than variables, a perfect fit is impossible because human observation is never free from error.

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
### The Central Limit Theorem (CLT)
The **Central Limit Theorem** is the bridge between randomness and order. It explains why, even when individual events are chaotic or "flat," their collective averages inevitably form the **Normal Distribution** (the "Bell Curve"). It was proven by \citeauthor{laplace1810clt} (\citeyear{laplace1810clt}).

The origins of CLT lie in the 18th-century struggle for precision in the physical sciences. **\citeauthor{laplace1810clt}** formalized the theorem in \citeyear{laplace1810clt} to solve the "Problem of Errors." 

Astronomers of the era faced a dilemma: every measurement taken via telescope or pendulum was slightly "noisy" due to atmospheric disturbances or human imperfection. Laplace proved that the **average** of these independent errors would always follow a bell curve, regardless of the nature of the individual mistakes. This realization allowed scientists to mathematically "filter" chaos to find the true position of celestial bodies. By aggregating thousands of imprecise data points, Laplace turned statistical noise into scientific certainty, a method that remains the foundation for how machines learn from "imperfect" real-world data today.

#### The Mechanics of the Simulation
1.  **Individual Randomness**: A single die follows a **Uniform Distribution**; every face ($1$ to $6$) has an equal $1/6$ probability.
2.  **Aggregation**: When you roll $n$ dice and calculate their **average**, the probability shifts. It is much more likely to get an average near $3.5$ than to roll all $1$s or all $6$s.
3.  **The Convergence**: As $n$ increases, the distribution of these averages tightens around the mean ($\mu = 3.5$).
4.  **The Red Line**: This represents the **Probability Density Function (PDF)** for a Normal Distribution, calculated as:
    $$f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$$
    where the standard deviation $\sigma$ decreases as more dice are added ($\sigma = \sqrt{\frac{35}{12n}}$).

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
            <input type="range" id="clt-n" min="2" max="50" value="10" style="width: 100%; cursor: pointer;" oninput="document.getElementById('clt-n-label').innerText = this.value">
            <p style="font-size: 0.85em; color: #64748b; margin-top: 10px;">
                We are tracking the <strong>average</strong> of these $n$ dice. Current samples in chart: <span id="clt-count" style="font-weight: bold; color: #1e293b;">0</span>
            </p>
        </div>

	    <div id="dice-container" style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; min-height: 50px; padding: 15px; background: #fff; border: 1px dashed #cbd5e1; border-radius: 8px;">
		<span style="color: #94a3b8; font-style: italic;">Roll the dice to see individual results here...</span>
	    </div>
        
        <div style="display: flex; gap: 10px;">
            <button onclick="rollCLT()" style="background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; flex: 2; transition: background 0.2s;">Roll Dice & Add to Plot</button>
            <button onclick="resetCLT()" style="background: #ef4444; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; flex: 1;">Reset Data</button>
        </div>
    </div>

</div>

<div class="md">
#### Least Squares: The Gauß-Legendre Rivalry

**Adrien-Marie Legendre** \citeyear{legendre1805} published the method first, but **Carl Friedrich Gauß** \citeyear{gauss1809} proved why it worked by inventing the **Normal Distribution**.

#### The Principle of Least Squares
When we have "noisy" data points, we find the best-fitting line by minimizing the area of the squares formed by the distance between the data and the line.

$$S = \sum_{i=1}^{n} \underbrace{(y_i - f(x_i))^2}_{\text{The Squared Residual}}$$

* **The Residual:** The distance between the "Truth" and the "Observation."
* **Squaring the Error:** This ensures that large errors are punished more severely than small ones (a core principle of modern Loss Functions).
* **The Normal Link:** Gauß proved that if your errors are distributed as $\mathcal{N}(0, \sigma^2)$, then the line that minimizes these squares is the **Maximum Likelihood Estimate**.


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

<div class="statlab-section">
    <div class="md">
        ### The Gumbel Distribution: The Math of Disasters
        While the Normal Distribution describes the "average" person, **Emil Gumbel** (1954) wanted to describe the "exceptional" event. If you record the maximum river level every year for 50 years, those maximums will not follow a Bell Curve; they follow a Gumbel Distribution.

        It is **asymmetrical** (skewed) because while there is a limit to how "small" a maximum can be, the "worst-case scenario" (the tail) can theoretically stretch very far. The PDF is:
        $$f(x; \mu, \beta) = \frac{1}{\beta} \exp\left(-\left(z + e^{-z}\right)\right), \quad z = \frac{x - \mu}{\beta}$$



        - **$\mu$ (Location):** Where the "most likely" extreme value sits.
        - **$\beta$ (Scale):** How unpredictable the extremes are (the "fatness" of the disaster tail).
    </div>
    <div class="statlab-interactive-zone">
        <div style="display: flex; gap: 20px;">
            <div>
                <label>Location ($\mu$):</label>
                <input type="range" id="gum-mu" min="-5" max="5" step="0.1" value="0">
            </div>
            <div>
                <label>Scale ($\beta$):</label>
                <input type="range" id="gum-beta" min="0.5" max="5" step="0.1" value="1.5">
            </div>
        </div>
        <div id="gumbel-chart"></div>
    </div>
</div>

<div class="statlab-section">
    <div class="md">
        ### The Poisson Distribution: The Law of Rare Events
        In \citeyear{poisson}, **\citeauthor{poisson}** published \citetitle{poisson} (section 41-42), where he derived a limit for the Binomial distribution when the number of trials is very large ($n \to \infty$) and the probability is very small ($p \to 0$).

        It became famous as the **"Law of Small Numbers"** after \citeauthor{gesetzderkleinenzahlen} used it to model the likelihood of Prussian soldiers getting killed by their own horse's kicks (p. 23f, §12), events that are rare but occur at a constant average rate $\lambda$.

        The math is expressed as:
        $$P(X=k) = \frac{\lambda^k e^{-\lambda}}{k!}$$

        Where $\lambda$ represents the average number of events in a given interval. In modern AI, this is used to model everything from website traffic spikes to the arrival of tokens in a sequence.
    </div>
    <div class="statlab-interactive-zone">
        <label>Rate of Occurrence ($\lambda$):</label>
        <input type="range" id="poisson-lambda" min="0.1" max="100" step="0.1" value="4" oninput="renderPoissonLab()">
        <span id="poisson-lambda-val">4.0</span>
        <div id="poisson-chart"></div>
    </div>
</div>

<div class="md">
## Pearson's Biological Link: The Father-Son Study

In 1801, \citeauthor{gauss1809} used the "Normal Distribution" to find a planet; in 1895, \citeauthor{pearson1895correlation} used it to map the human race. Pearson collected heights from over 1,000 fathers and their adult sons to answer a fundamental question: *How much does one variable actually tell us about another?*

**The "Scale" Problem:** Pearson noticed that while a father's height clearly influenced his son's, the raw data was messy. If you measured the father in inches and the son in centimeters, the **Covariance** (the shared direction) would change purely because of the units. 

Pearson solved this by creating the **Correlation Coefficient ($r$)**. By dividing the covariance by the product of both standard deviations ($\sigma_X \sigma_Y$), he "standardized" the relationship. This creates a pure number, independent of units, between **-1.0 and +1.0**.

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

    <div id="plot-correlation" class="statlab-visual"></div>

	<div class="math-grid-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
	    <div class="math-card">
		<p><strong>1. Inputs:</strong></p>
		<div id="var-definitions" class="statlab-math-display"></div>
	    </div>

	    <div class="math-card">
		<p><strong>2. Center:</strong></p>
		<div id="mu-calculation" class="statlab-math-display"></div>
	    </div>

	    <div class="math-card">
		<p><strong>3. Covariance:</strong></p>
		<div id="cov-definition" class="statlab-math-display"></div>
	    </div>

	    <div class="math-card">
		<p><strong>4. Result:</strong></p>
		<div id="corr-math-breakdown" class="statlab-math-display"></div>
	    </div>
	</div>
    </div>
</div>

<div class="md">
## Bayesian Updating: The Logic of Science

While Gauß sought the "True Path" of planets among noisy observations, the Reverend **Thomas Bayes** was interested in a deeper philosophical question: how do we update our beliefs when we encounter new evidence?

His essay, that published posthumously in the year \citeyear{bayes1763essay}, provides the mathematical engine for **induction**. In modern AI, this is how a machine "changes its mind." It doesn't just see a pixel; it calculates how that pixel changes its confidence in what it is looking at.

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
When you start a prompt, the LLM is in a state of **Statistical Superposition**. It doesn't know if you are a coder, a poet, or a chef. Every word you type provides **Evidence** that collapses the probability space.

This is **Bayesian Inference**. Named after **Thomas Bayes**, this method allows the model to update its "Internal Map" ($P$) based on new data ($D$).
</div>

<div class="statlab-interactive-zone">
    <div class="md">
    Type a sentence in English, French, or German (e.g., *"Hello"* vs *"Bonjour"* vs *"Guten Tag"*). Watch how the model's "Belief" shifts in real-time as it processes each word.
    </div>
    
    <div class="statlab-controls">
        <input type="text" id="bayes-text-input" placeholder="Type here (Hello, Bonjour, Guten Tag...)" style="width: 100%; padding: 10px; font-size: 1.2rem;">
    </div>

    <div id="plot-bayesian-languages" style="width:100%; height:400px;"></div>
</div>

<div class="md">
## Entropy (The Messiness Scale)

While Gauß sought to minimize error in orbits, **Claude Shannon** in \citeyear{shannon1948communication} aimed to find the mathematical limit of communication. His goal was to quantify "Information" itself. He realized that information isn't about what is said, but about how **surprising** the outcome is.

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

<!--
<div class="md">
## Chi-Square ($\chi^2$): The Test of Independence
Invented by \citeauthor{chisquared} in \citeyear{chisquared} (p. 157-175), the $\chi^2$ test was originally designed to solve a problem in evolutionary biology: how to determine if the variation between observed groups is a result of a real relationship or merely the "noise" of random chance. Pearson sought to quantify the "goodness of fit" between a theoretical model and actual data.

1. **Hypothesize ($H_0$):** Assume no relationship exists (e.g., the coin is fair).
2. **Determine Expectations ($E$):** Calculate what counts you should see under $H_0$.
3. **Observe Reality ($O$):** Collect the actual data.
4. **Calculate Deviation:** Measure how far reality is from expectation.
5. **Normalize & Sum:** Divide by expectation to weight the deviations fairly.

### The Equation of "Surprise"
The abstract formula represents the total sum of weighted squared differences:

$$\chi^2 = \sum_{i=1}^{k} \underbrace{\frac{(\overbrace{O_i}^{\text{Observed}} - \overbrace{E_i}^{\text{Expected}})^2}{\underbrace{E_i}_{\text{Scaling Factor}}}}_{\text{Weighted squared error for category } i}$$

**Practical Example:**
If you flip a coin 100 times, you expect 50 Heads ($E$). If you observe 70 Heads ($O$), the "surprise" factor is:
$$\chi^2 = \underbrace{\frac{(70 - 50)^2}{50}}_{\text{Heads deviation}} + \underbrace{\frac{(30 - 50)^2}{50}}_{\text{Tails deviation}} = \frac{400}{50} + \frac{400}{50} = \mathbf{16}$$
A score of 16 is much higher than the standard threshold (3.84), proving the coin is likely biased.

### Why 3.84?
The threshold **3.84** is derived from the requirement that the probability of a "false alarm" ($\alpha$) is exactly 5%. For a system with 1 degree of freedom, the relationship between the critical value and the normal distribution is:

$$\underbrace{\chi^2_{0.05}}_{\text{Critical Value}} = \underbrace{(Z_{0.025})^2}_{\text{Squared Z-score}} \approx 1.96^2 = \mathbf{3.84}$$

If your calculated $\chi^2$ is higher than this, the area remaining in the "tail" of the distribution, known as the **p-value**, is smaller than 0.05. We define the p-value abstractly as:

$$p = P(\chi^2_1 > \text{your score})$$

### The General Critical Value Equation
The threshold for "significance" is not fixed; it changes based on how many categories you are testing (**Degrees of Freedom**) and how much risk you are willing to take ($\alpha$).

$$\underbrace{\chi^2_{\alpha, k}}_{\text{Critical Value}} = \underbrace{F^{-1}(1 - \alpha, k)}_{\text{Inverse CDF for } k \text{ degrees of freedom}}$$

For a coin flip ($k=1$) at 95% confidence ($\alpha=0.05$), this settles at:
$$\chi^2_{0.05, 1} \approx \mathbf{3.84}$$

### Deep Dive: The Error Function ($erf$)
#### What is it?
The **Error Function** is a mathematical bridge. It translates a "Score" (like $Z$ or $\chi^2$) into a "Probability" ($p$-value). It measures the area of the Bell Curve to tell us how "normal" or "weird" a result is.

#### History & Origin
* **Who:** First named and analyzed by \citeauthor{kramp1799} in \citeyear{kramp1799}.
* **Why:** Kramp was studying **atmospheric refraction**, how light bends through the air. He needed a way to calculate the probability of measurement errors. 
* **When:** While Kramp defined it, \citeauthor{gauss1809} later made it the cornerstone of statistics in the early 1800s while predicting the orbits of planets.

#### How it is calculated
Because the exact area under a bell curve has no simple formula, we use **Taylor Series** or **Numerical Approximations** (like the one in our code) to "slice" the curve into thousands of tiny pieces and add them up instantly.

Now, we're trying to calculate the $p$-value using the standard normal distribution approximation. If $p < 0.05$, the "surprise" is high enough to reject the idea that the coin is fair.
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

<div id="chi-plotly-chart" style="width:100%; height:350px;"></div>
-->

<div class="md">
## The Statistical Soul: Dataset Distributions

Before a Transformer can "choose" a word, it must understand the landscape of human language. This landscape is not flat; it is a jagged mountain range of probabilities. LLMs are trained to mimic the **Natural Language Distribution** found in massive datasets like Common Crawl.

## Zipf's Law: The Physics of Language

Why can an AI guess the next word so effectively? Because human language is not random; it follows a power law. Named after **George Kingsley Zipf**, the law states that the most frequent word occurs twice as often as the second most frequent, three times as often as the third, and so on.

$$P(r) = \frac{1}{r^s \cdot H_{N,s}}$$

Where $r$ is the rank of the word and $s$ is the exponent (typically close to 1). If we plot this on a **Log-Log scale**, Zipf's Law appears as a near-perfect straight line. This statistical "backbone" is what allows LLMs to allocate their "attention" efficiently, focusing on the few words that carry the most structural weight.
</div>

<div class="statlab-interactive-zone">
    <div class="md">
    Below, we analyze the actual word distribution of \citetitle{nietzsche1883zarathustra}. 
    - **Linear Scale:** Shows the "Long Tail" (a few words dominate everything).
    - **Log-Log Scale:** Reveals the underlying mathematical "straight line" of the language.
    </div>
    
    <div class="statlab-controls">
        <button onclick="ZarathustraLab.toggleZipfScale()" class="statlab-btn">Toggle Log-Log Scale</button>
        <span id="zipf-status" style="margin-left:10px; font-size:0.9em; color:#636efa;"></span>
    </div>

    <div id="plot-zipf-zarathustra" style="width:100%; height:500px;"></div>
</div>

<div class="md">
## The Dirichlet Distribution: The Probability of Probabilities

While Zipf's Law tells us how common words are, it doesn't explain how they "clump" together. To understand how an AI chooses a "topic" before it chooses a word, we need the **Dirichlet Distribution**.

### History & The "Urn" Motivation
Named after **Peter Gustav Lejeune Dirichlet** in the 19th century, this distribution was a generalization of the Beta distribution.

Imagine an urn filled with marbles of $K$ different colors. If you start with a few marbles and every time you pick one, you put it back along with *more* marbles of the same color, you create a "rich-get-richer" effect. This is the **Pólya Urn Model**, and the Dirichlet distribution describes the resulting proportions of colors in the limit.

Mathematically, for a probability vector $p = (p_1, \dots, p_K)$, the density is:
$$f(p_1, \dots, p_K; \alpha_1, \dots, \alpha_K) = \frac{1}{\text{B}(\alpha)} \prod_{i=1}^{K} p_i^{\alpha_i - 1}$$
Where $\alpha$ is the **concentration parameter**.

In AI, we use this to solve the "Bag of Words" problem. Before a Transformer generates text, it is essentially sampling from a Dirichlet distribution to decide the "mixture" of the text.
* Is this 80% "Technical Manual" and 20% "Friendly Tutorial"?
* The $\alpha$ values represent the model's "prior knowledge" about how words group together in the training dataset.

When $\alpha < 1$, the distribution pushes probabilities toward the corners (the model becomes very "certain" and chooses one specific topic). When $\alpha > 1$, it pushes everything toward the center (a "vague" mixture of everything).
</div>

<div class="statlab-interactive-zone">
    <div class="md">
    Adjust the $\alpha$-parameters for three potential "Topics" (e.g., Science, Art, Sports). Watch how the "Probability Space" (represented as a 3D simplex) shifts.
    * **Low Alpha (< 1):** The AI is decisive; it picks one topic.
    * **High Alpha (> 1):** The AI is "blending" topics together.
    </div>

    <div class="statlab-controls">
        <label>Topic A Alpha (Science):</label>
        <input type="range" id="diri-a1" min="0.1" max="5.0" step="0.1" value="1.0">

        <label>Topic B Alpha (Art):</label>
        <input type="range" id="diri-a2" min="0.1" max="5.0" step="0.1" value="1.0">

        <label>Topic C Alpha (Sports):</label>
        <input type="range" id="diri-a3" min="0.1" max="5.0" step="0.1" value="1.0">
    </div>

    <div id="plot-dirichlet-simplex" style="width:100%; height:500px;"></div>
</div>

<div class="md">
## Latent Variables: The Hidden Logic of Context

When an AI reads a word, it faces a **Disambiguation Problem**. In statistics, we model this using **Gaussian Mixture Models (GMMs)**. This theory suggests that the data we see (tokens) is actually generated by several hidden (latent) distributions.

### Expectation-Maximization (EM)
The algorithm used to solve this was formalized by **Arthur Dempster, Laird, and Rubin** in 1977. It works in two steps that mirror how a Transformer processes context:
1.  **Expectation (E):** Based on the current words, what is the probability that we are in "Topic A" vs "Topic B"?
2.  **Maximization (M):** Adjust the internal "weights" to favor the words that fit that topic.

### The Statistical "Vibe"
In LLMs, this is why a prompt works. By typing "Import torch," you are statistically forcing the model's **Hidden State** to move its "Expectation" entirely into the "Coding" cluster, making "print" infinitely more likely than "reproduction" (the biology cluster).
</div>

<div class="statlab-interactive-zone">
    <div class="md">
    Adjust the "Cluster Separation." When clusters overlap, the AI's "Choice" is statistically noisy (uncertain). As the Transformer sees more context, it effectively "pushes" these distributions apart to make a clear choice.
    </div>

    <div class="statlab-controls">
        <label>Topic Separation (Distance):</label>
        <input type="range" id="gmm-dist" min="0.5" max="5.0" step="0.1" value="2.0">

        <label>Cluster Variance (Noise):</label>
        <input type="range" id="gmm-var" min="0.1" max="1.5" step="0.1" value="0.5">
    </div>

    <div id="plot-gmm-clusters" style="width:100%; height:450px;"></div>

    <div class="md">
    Mathematically, the probability of a word $x$ given the mixture is:
    $$P(x) = \sum_{k=1}^{K} \pi_k \mathcal{N}(x | \mu_k, \Sigma_k)$$
    Where $\pi_k$ is the weight of topic $k$, and $\mathcal{N}$ is the Normal Distribution (the Bell Curve) you learned about in the Statistics section.
    </div>
</div>

<div class="md">
## The Law of Large Numbers

In the real world, language is a **Non-Stationary Process**. If you only read the first page of \citetitle{nietzsche1883zarathustra}, your statistical "Prior" is heavily biased by the opening scene. 

The **Law of Large Numbers** ensures that as our sample size $n$ grows, the observed frequency $\bar{X}_n$ of words like "the" or "God" converges to their true mathematical mean $\mu$ within the entire corpus.

$$ \bar{X}_n = \frac{1}{n} \sum_{i=1}^{n} X_i \xrightarrow{n \to \infty} \mu $$
</div>

<div class="statlab-interactive-zone">
	<div class="statlab-controls">
		<label>Reading Window (Tokens):</label>
		<input type="range" id="lln-zarathustra-n" min="10" max="10000" step="50" value="500" disabled>
		<span id="lln-count-display">500</span> / <span id="lln-total-tokens">0</span> words
	</div>
    
	<div id="plot-zarathustra-convergence"></div>
</div>

<div class="md">
## Markovian Transitions (The Probability of "Next")

An LLM is not just a list of word counts; it is a map of **Conditional Probabilities**. This is the logic of **Andrey Markov** (1906). He proposed that we can predict the future state of a system based solely on its current state.

In linguistics, we call this an **N-Gram**.
* A **Unigram** is just the chance of a word appearing ($P(w)$).
* A **Bigram** is the chance of a word appearing *given* the previous word ($P(w_n | w_{n-1})$).

$$ P(A|B) = \frac{P(A \cap B)}{P(B)} $$

If Nietzsche wrote "Thus spake" 100 times, but "Thus thought" only 5 times, the Markov-Chain "chooses" based on this statistical skew.
</div>

<div class="statlab-interactive-zone">
    <div class="md">
    Select a word found in the \citetitle{nietzsche1883zarathustra} by \citeauthor{nietzsche1883zarathustra} to show you every word that ever followed it and how likely they are depending on their real statistics.
    </div>

    <div class="statlab-controls">
        <label>Select a "Current" Word:</label>
        <select id="markov-word-select" style="padding: 10px; border-radius: 5px;">
            <option value="thus">thus</option>
            <option value="spake">spake</option>
            <option value="zarathustra">zarathustra</option>
            <option value="and">and</option>
            <option value="the">the</option>
            <option value="world">world</option>
            <option value="is">is</option>
            <option value="the">the</option>
            <option value="earth">earth</option>
            <option value="great">great</option>
            <option value="will">will</option>
            <option value="man">man</option>
        </select>
    </div>

    <div id="plot-markov-transitions" style="width:100%; height:400px;"></div>
</div>

<div class="md">
Now, we visualize the transition probabilities $P(w_n | w_{n-1})$. The training process creates a map where each word points to its potential successors, weighted by their frequency in the source text.
</div>

<div class="statlab-interactive-zone" style="background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0;">
    
    <div class="md">**Source Text**:</div>
    <textarea id="markov-corpus" onchange="trainMarkovModel()" style="width: 100%; height: 100px; padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-family: monospace; margin-bottom: 10px;">
When Zarathustra was thirty years old, he left his home and the lake of
his home, and went into the mountains. There he enjoyed his spirit and
solitude, and for ten years did not weary of it. But at last his heart
changed, and rising one morning with the rosy dawn, he went before the
sun, and spake thus unto it:

Thou great star! What would be thy happiness if thou hadst not those for
whom thou shinest!

For ten years hast thou climbed hither unto my cave: thou wouldst have
wearied of thy light and of the journey, had it not been for me, mine
eagle, and my serpent.

But we awaited thee every morning, took from thee thine overflow and
blessed thee for it.

Lo! I am weary of my wisdom, like the bee that hath gathered too much
honey; I need hands outstretched to take it.

I would fain bestow and distribute, until the wise have once more become
joyous in their folly, and the poor happy in their riches.

Therefore must I descend into the deep: as thou doest in the
evening, when thou goest behind the sea, and givest light also to the
nether-world, thou exuberant star!

Like thee must I GO DOWN, as men say, to whom I shall descend.

Bless me, then, thou tranquil eye, that canst behold even the greatest
happiness without envy!

Bless the cup that is about to overflow, that the water may flow golden
out of it, and carry everywhere the reflection of thy bliss!

Lo! This cup is again going to empty itself, and Zarathustra is again
going to be a man.

Thus began Zarathustra's down-going.
    </textarea>

    <div style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
        <div class="md" style="margin-bottom: 10px;">**Live Predictions**:</div>
        
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <input type="text" id="seed-word" placeholder="Enter word (e.g., 'zarathustra')" style="flex-grow: 1; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1;">
            <button onclick="generatePredictions()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Predict</button>
            <button onclick="resetSequence()" style="padding: 10px 15px; background: #64748b; color: white; border: none; border-radius: 6px; cursor: pointer;">Reset</button>
        </div>

        <div style="min-height: 140px; border: 1px solid #f1f5f9; padding: 15px; background: #ffffff; border-radius: 8px; margin-bottom: 15px;">
            <div class="md" style="margin-bottom: 10px;"><small>**Likely next words (Likelihood %):**</small></div>
            <div id="word-suggestions" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px;">
                </div>
        </div>

        <div style="padding: 15px; background: #f1f5f9; border-left: 4px solid #10b981; border-radius: 4px;">
            <div class="md" style="margin-bottom: 5px;"><small>**Generated Sequence:**</small></div>
            <div id="sequence-output" style="font-family: serif; font-size: 1.25em; color: #1e293b; min-height: 1.5em; line-height: 1.4;">...</div>
        </div>
    </div>
</div>

<div class="statlab-section">
    <div class="md">
        ## Boltzmann Distributions
	
        Originally formulated by **\citeauthor{boltzmann}** (c. \citeyear{boltzmann}) in his work on *Statistical Mechanics*, this was designed to solve the problem of **Molecular Velocity**. He wanted to know: in a room full of gas, how many molecules are moving fast versus slow?

        In LLMs, we apply this to the "vocabulary" instead of "molecules." The **Temperature** ($T$) determines how much energy is in the system.
        - **The Graph:** Shows the probability of picking specific tokens.
        - **Live Logic:** At high $T$, the distribution flattens (Entropy increases). At low $T$, the "cold" model only picks the most certain word.
    </div>
    <div class="statlab-interactive-zone">
        <p>Enter 5 raw scores (Logits) separated by commas:</p>
        <input type="text" id="boltz-input" value="10, 8, 5, 2, 1" style="width:100%" oninput="LLMStatsLab.renderBoltzmann()">
        <label>Temperature ($T$): <input type="range" id="boltz-temp" min="0.1" max="5" step="0.1" value="1.0" oninput="LLMStatsLab.renderBoltzmann()"></label>
        <div id="boltz-eqn" style="padding:10px; background:#f8fafc; margin:10px 0; font-family:serif;"></div>
        <div id="boltz-plot"></div>
    </div>
</div>

<div class="statlab-section">
    <div class="md">
        ## Maximum Likelihood Estimation (MLE): The Fisherian Fit

        Popularized by **Sir \citeauthor{fisher1922}** in \citetitle{fisher1922}, MLE was created to solve the problem of **Parameter Estimation**. If you see 10 tall people, what is the "most likely" average height of the whole population?

        LLMs use this to find the best weights ($\theta$) for the model.
        - **The Graph:** The red dots are your "observed data." The blue curve is your model.
        - **The Goal:** Move the slider to align the peak of the curve with the cluster of dots to maximize the "Likelihood" value.
    </div>
    <div class="statlab-interactive-zone">
        <p>Enter your observed data points (e.g., -1, 0.5, 2):</p>
        <input type="text" id="mle-input" value="-1.5, -0.5, 0, 0.5, 1.5" style="width:100%" oninput="LLMStatsLab.renderMLE()">
        <label>Hypothesized Mean ($\mu$): <input type="range" id="mle-mu" min="-5" max="5" step="0.1" value="0" oninput="LLMStatsLab.renderMLE()"></label>
        <div id="mle-eqn" style="padding:10px; background:#f8fafc; margin:10px 0;"></div>
        <div id="mle-plot"></div>
    </div>
</div>

<div class="statlab-section">
    <div class="md">
        ## The Chain Rule: Kolmogorov's Logic

        Formalized by **\citeauthor{kolgomorov1933}** in *\citetitle{kolgomorov1933}* (\citeyear{kolgomorov1933}), the Chain Rule solves the problem of **Sequential Dependencies**. It explains how to calculate the probability of a complex event by breaking it into a series of conditional steps.
        
        In an LLM, the probability of the sentence "The cat sat" is calculated as:
        $P(\text{The}) \times P(\text{cat} | \text{The}) \times P(\text{sat} | \text{The cat})$
    </div>
    <div class="statlab-interactive-zone">
        <p>Enter 3 conditional probabilities (e.g., 0.1 for a common word, 0.001 for rare):</p>
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; margin-bottom:10px;">
            <div>
                <small>P(Word 1)</small>
                <input type="number" id="cr-p1" value="0.5" step="0.05" min="0" max="1" style="width:100%" oninput="LLMStatsLab.renderChainRule()">
            </div>
            <div>
                <small>P(Word 2 | W1)</small>
                <input type="number" id="cr-p2" value="0.3" step="0.05" min="0" max="1" style="width:100%" oninput="LLMStatsLab.renderChainRule()">
            </div>
            <div>
                <small>P(Word 3 | W1, W2)</small>
                <input type="number" id="cr-p3" value="0.8" step="0.05" min="0" max="1" style="width:100%" oninput="LLMStatsLab.renderChainRule()">
            </div>
        </div>
        <div id="cr-eqn" style="padding:15px; background:#f1f5f9; border-radius:8px; margin:10px 0; font-family: monospace; font-size: 0.9em;"></div>
        <div id="cr-plot" style="height:350px;"></div>
    </div>
</div>

<div class="statlab-section">
    <div class="md">
        ## KL Divergence: Information Gain

        Introduced in \citeauthorlastnameand{leiblerkullback} *\citetitle{leiblerkullback}* (\citeyear{leiblerkullback}), this was originally used for **Cryptanalysis** and military intelligence. It measures the "surprise" or extra bits of info needed if you use Distribution Q to approximate Distribution P.

        - **The Graph:** Shows the overlap between P (Truth) and Q (Model).
        - **Live Logic:** The divergence $D_{KL}$ is 0 only when the distributions are identical.
    </div>
    <div class="statlab-interactive-zone">
        <label>Shift Model (Q) Mean: <input type="range" id="kl-q-mu" min="-4" max="4" step="0.1" value="2" oninput="LLMStatsLab.renderKL()"></label>
        <div id="kl-eqn" style="padding:10px; background:#f8fafc; margin:10px 0;"></div>
        <div id="kl-plot"></div>
    </div>
</div>

<div class="statlab-section">
    <div class="md">
        ## Bag of Words (BoW): The Linguistic Atom
        The "Distributional Hypothesis", the idea that words occurring in similar contexts have similar meanings, was popularized by **\citeauthor{zelligharris}** in his \citeyear{zelligharris} article *\citetitle{zelligharris}*. It treats a document not as a sequence, but as a "bag": you lose the grammar, the order, and the syntax, keeping only the raw counts.

        This was the primary method for **Spam Filtering** and early **Search Engines** before LLMs.
        - **The Graph:** Visualizes the "Vector" of your text. Each unique word is a dimension.
        - **Live Logic:** Watch how "The cat sat" and "Sat the cat" produce the exact same statistical signature, demonstrating the model's "blindness" to word order.
    </div>
    <div class="statlab-interactive-zone">
        <p>Type or paste text to see its "Bag of Words" representation:</p>
        <textarea id="bow-input" style="width:100%; height:80px; padding:10px; border-radius:8px; border:1px solid #cbd5e1; font-family: sans-serif;" oninput="renderBoW()">The quick brown fox jumps over the lazy dog. The dog was not so lazy after all.</textarea>

        <div id="bow-eqn" style="padding:15px; background:#f8fafc; border-radius:8px; margin:10px 0; font-family: serif; border-left: 4px solid #10b981;"></div>

        <div id="bow-plot" style="height:350px;"></div>
    </div>
</div>
