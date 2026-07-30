<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Statistics I — Distributions and Inference
description: The shape of data — Bernoulli, Binomial, Normal, CLT, Chi-Square, Z-scores, Zipf.
icon: &#128200;
part: 1
order: 4
color: accent
-->

<div class="md">
This first statistics chapter introduces the mathematical framework for reasoning under uncertainty. The core idea: real-world data is not random chaos; it follows **distributions** that we can model, sample from, and use to make decisions.

By the end, you will recognize the key distributions (Normal, Bernoulli, Binomial, Chi-Square, Zipf) and understand how **statistical inference** lets us draw conclusions from samples.
</div>

<div class="md">
Artificial Intelligence is often described as "Applied Statistics." At its core, every decision an AI makes is a sophisticated calculation of likelihoods. Below are the background stories of some mathematical frameworks, originating from all kinds of research, for example, playing games, and mapping the heavens, that now enable machines to learn from the chaos of data.
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

The key takeaway when studying distributions is not to memorize them, but to understand how large datasets behave. In real-world scenarios, it's rare to find data that perfectly matches a theoretical distribution. However, exploring these distributions encourages you to think about data differently, not as isolated points, but as a cohesive whole.

In practice, many real-world datasets approximate theoretical distributions closely enough to make these models useful. This allows us to apply statistical methods effectively, even if the match isn't perfect. By doing so, we gain insights into the underlying patterns and behaviors of the data, which is essential for making informed decisions and predictions.

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
        <div id="bernoulli-chart"></div>
    </div>
</div>

<div class="md">

#### The Binomial Distribution

While people have rolled dice for millennia, the math of *sums* was long misunderstood. For centuries, gamblers thought all sums were equally likely, but they are not. There is only one way to get the sum 2 ($1+1$), but there are $2$ ways to get the sum $3$ ($1+2$ and $2+1$), and 3 ways to get 4 ($1+3$, $2+2$, $3+1$) and so on.

Binomial coefficients, written as $\binom{n}{k}$, represent the number of ways to choose $k$ successes from $n$ independent trials. In Pascal's Triangle, each value is the sum of the two directly above it, reflecting how independent "Bernoulli trials" (simple pass/fail events) combine into more complex patterns.

$$
\begin{array}{c}
    n=0: & 1 \\\\
    n=1: & 1 \quad 1 \\\\
    n=2: & 1 \quad 2 \quad 1 \\\\
    n=3: & 1 \quad 3 \quad 3 \quad 1 \\\\
    n=4: & 1 \quad 4 \quad 6 \quad 4 \quad 1 \\\\
    n=5: & 1 \quad 5 \quad 10 \quad 10 \quad 5 \quad 1 \\\\
\end{array}
$$

The probability of achieving exactly $k$ successes is calculated using the Binomial Distribution formula, where the coefficient acts as a multiplier for the probability of a specific sequence:

$$P(X=k) = \binom{n}{k} p^k (1-p)^{n-k}$$

$$\binom{n}{k} = \frac{n!}{k!(n-k)!}$$

**The "Problem of Points" Example:**
If two players are in a game where the first to 4 points wins, but the game is interrupted when the score is 2 to 1, Pascal and Fermat used these coefficients to determine fair prize splits. By looking at the triangle, they could calculate how many future "paths" (combinations of wins/losses) led to each player winning the overall pot, moving probability theory from simple dice counting to a rigorous science.
</div>

<div class="optional md" data-headline="The History of the Binomial Distribution">
##### The Medieval Insight (c. 1250)
The earliest known mention of the differing frequencies of dice sums appears in a Latin poem called \citetitle{devetula} (p. 32), whose author is not certain. The author correctly identified that there are only 16 ways to get sums with three dice that result in a specific value, noting for the first time that some totals occur more often than others.

##### The Gambler's Manual: Gerolamo Cardano (1564)

The first truly scientific treatment came from **Gerolamo Cardano**, who also invented the cardan shaft, a brilliant physician and a degenerate gambler. In his book *\citetitle{liberludo}* (chapter 13, *On Composite Numbers Up to Six and Beyond and for Two and Three Dice*), he was probably the first to realize that for two dice, the "circuit" is **36**, and he used this to calculate the odds for the lucky throw.

##### The Great Correspondence: Pascal & Fermat (1654)

The context that solidified this into modern science was the **"Problem of Points."** The **Chevalier de Méré** asked **Blaise Pascal** how to fairly split a prize pot if a game of dice is interrupted.

Pascal wrote to **Pierre de Fermat**, and their exchange of letters is considered the founding moment of probability theory. They moved beyond mere counting and began using the **Binomial Coefficients** (Pascal's Triangle) to predict outcomes for any number of dice (\citetitle{oevresdeformat}, p. 288ff).
</div>

<div class="md">
### The Normal Distribution: From the Stars to AI

The Normal (or Gaussian) distribution is the workhorse of statistics. Its probability density function:

$$p(x) = \frac{1}{\sigma \sqrt{2\pi}} \exp\!\left(-\frac{(x - \mu)^2}{2\sigma^2}\right)$$

parameterized by mean $\mu$ (center) and standard deviation $\sigma$ (spread).

It appears everywhere: measurement errors, biological measurements (heights, weights), financial returns, attention score distributions in transformers. **Why?** By the **Central Limit Theorem** (below), the sum of many independent random variables tends to a Normal distribution regardless of the underlying distribution.

The history of the Normal distribution is intimately tied to astronomy. Carl Friedrich Gauss derived it in 1809 to model the errors in astronomical observations; the term "Gaussian" honors him. Pierre-Simon Laplace independently derived it. The bell curve dominates modern statistics precisely because errors — whether from telescopes, microscopes, or surveys — accumulate from many independent sources.
</div>

<div class="md">
### How to Calculate with the Normal Distribution

The **z-score** standardizes a value to the standard Normal:

$$z = \frac{x - \mu}{\sigma}$$

The **error function** $\text{erf}(z)$ gives the probability of being within $z$ standard deviations of the mean for a Normal variable:

$$\text{erf}(z) = \frac{2}{\sqrt{\pi}} \int_0^z e^{-t^2}\, dt$$

And the cumulative distribution function:

$$\Phi(z) = \frac{1}{2}\left[1 + \text{erf}\!\left(\frac{z}{\sqrt{2}}\right)\right]$$
</div>

<div class="md">
### The Central Limit Theorem (CLT)

One of the most important theorems in all of statistics:

**If you sum $n$ independent random variables with finite mean and variance, the sum (when standardized) converges to a Normal distribution as $n \to \infty$.**

Formally, if $X_1, \dots, X_n$ are iid with mean $\mu$ and variance $\sigma^2$:

$$\frac{\bar X - \mu}{\sigma / \sqrt{n}} \xrightarrow{d} \mathcal{N}(0, 1)$$

This is why the Normal distribution is everywhere: it's the universal limit. Errors from many independent sources aggregate into a Normal regardless of the individual source distributions.

Practical implications:

* The **standard error** of the sample mean is $\sigma / \sqrt{n}$. Quadruple the sample size to halve the standard error.
* Confidence intervals for means rely on the Normal approximation (when $n$ is large enough).
* The CLT is why **batch normalization** and **learning rate scheduling** work in deep learning — they treat per-layer activations as approximately Normal.

The CLT is also why AI "just works" on noisy data: when the noise comes from many independent sources, it's approximately Gaussian, and well-designed networks handle Gaussian noise gracefully.
</div>

<div class="md">
## Pearson's Biological Link: The Father-Son Study

**Karl Pearson** (1857–1936) and **Francis Galton** (1822–1911) pioneered the application of statistical methods to biology. Galton's study of father-son heights revealed one of the most important statistical phenomena: **regression to the mean**.

If a father is unusually tall (say, 6'3"), his son is likely to be tall — but on average closer to the population mean (say, 6'0"). The son's height regresses toward the mean. This is not because "tallness" is being bred out — it's a statistical inevitability from the joint distribution of parent and child heights.

Pearson formalized this with the **correlation coefficient** $r$:

$$r = \frac{\text{Cov}(X, Y)}{\sigma_X \sigma_Y} = \frac{\mathbb{E}[(X - \mu_X)(Y - \mu_Y)]}{\sigma_X \sigma_Y}$$

where $-1 \le r \le 1$. This single number — invented by Pearson — is the foundation of all correlation analysis.

Pearson also created the **chi-square test**, the **Pearson distribution family**, and founded the world's first university statistics department at UCL in 1911.

In AI, regression to the mean appears as **early-stopping in training**: when a model briefly achieves low loss on a batch, that performance regresses toward the average on subsequent batches. Stopping training before overfitting captures the underlying pattern before noise dominates.
</div>

<div class="md">
## Chi-Square ($\chi^2$): The Test of Independence

The chi-square distribution arises as the sum of $k$ squared standard Normal variables:

$$\chi^2_k = \sum_{i=1}^k Z_i^2, \quad Z_i \sim \mathcal{N}(0, 1)$$

It has one parameter, $k$ (degrees of freedom), and is **asymmetric** — bounded below at 0, with a long right tail.

### The Equation of "Surprise"

The chi-square statistic measures how far observed counts are from expected counts:

$$\chi^2 = \sum_{i=1}^{k} \frac{(O_i - E_i)^2}{E_i}$$

where $O_i$ is observed count and $E_i$ is expected count under the null hypothesis. Small $\chi^2$ = data consistent with hypothesis; large $\chi^2$ = data inconsistent.

### Why 3.84?

For a test with $k = 2$ categories and $\alpha = 0.05$ significance level, the critical value is $\chi^2_{1, 0.05} = 3.841$. This is the **magic number** for the famous "p < 0.05" threshold. If your $\chi^2$ exceeds 3.84, you reject the null hypothesis at the 5% level.

The 3.84 comes from inverting the chi-square CDF at the 95th percentile with 1 degree of freedom:

$$P(\chi^2_1 \leq 3.841) = 0.95$$

### The General Critical Value Equation

For $k$ degrees of freedom and significance level $\alpha$:

$$\chi^2_{k, \alpha} = \text{icdf}(\chi^2_k, 1 - \alpha)$$

(where $\text{icdf}$ is the inverse CDF). Tables or software give the values.

### Deep Dive: The Error Function ($erf$)

The error function is closely related to the Normal distribution:

$$\text{erf}(x) = \frac{2}{\sqrt{\pi}} \int_0^x e^{-t^2}\, dt$$

It has no closed form — it must be computed numerically or via series. Its derivative is $\frac{2}{\sqrt{\pi}} e^{-x^2}$, a scaled Gaussian.

The complementary error function $\text{erfc}(x) = 1 - \text{erf}(x)$ appears in diffusion models (see the Diffusion chapter), where the noise schedule often involves erfc.
</div>

<div class="md">
## Standardizing: Z-Scores & The Pearson Problem

Z-scores standardize a value to the standard Normal:

$$z = \frac{x - \mu}{\sigma}$$

A value with $z = 1.5$ is 1.5 standard deviations above the mean. By convention, $|z| > 2$ is "unusual" and $|z| > 3$ is "rare".

**Pearson's problem**: how do you standardize when you don't know $\mu$ and $\sigma$? Replace them with sample estimates $\bar x$ and $s$. The result is approximately standard Normal by the CLT.

In machine learning, **batch normalization** and **layer normalization** are continuous z-scoring applied to activations. This is what makes training deep networks tractable.
</div>

<div class="md">
## The Statistical Soul: Dataset Distributions

Real-world datasets are rarely perfectly Normal. Common patterns:

* **Long-tailed**: power-law distributions where most values are small, a few are huge (income, city size, social network followers).
* **Multimodal**: two or more peaks (heights of mixed populations).
* **Heavy-tailed**: more extreme values than a Gaussian predicts (financial returns).
* **Sparse**: many zeros, a few large values (word counts in documents).
* **Discrete**: counts or categories, not continuous (clicks, votes, ratings).

Recognizing the distribution of your data is the first step in choosing the right model. A Naive Bayes classifier assumes features are conditionally independent (often violated). A linear regression assumes Gaussian residuals (often violated). Knowing when these assumptions break down is what separates a working ML engineer from one who just imports scikit-learn.
</div>

<div class="md">
## Zipf's Law: The Physics of Language

In any natural-language corpus, the $k$-th most frequent word has frequency approximately:

$$f(k) \propto \frac{1}{k^s}$$

with $s \approx 1$. This is **Zipf's Law** (George Kingsley Zipf, 1949). For English, "the" appears ~7% of the time, "of" ~3.5%, "and" ~2.5%, and the 100th most common word ~0.05%.

Zipf's law is observed in many seemingly unrelated domains: city populations, income, web traffic, even the size of earthquakes. The mathematical reason is debated — competing theories include preferential attachment ("the rich get richer"), information-theoretic optimization, and self-organized criticality.

For LLMs, Zipf's law has two practical consequences:

* **Token imbalance**: a few tokens dominate training. Effective sampling and loss weighting must account for this.
* **Long tail of rare words**: the model rarely sees most words. Performance on the long tail is consistently worse.

The **Dirichlet distribution** (next section) is the natural probability distribution for Zipfian categorical data.
</div>

<script>
async function loadStatisticsIModule() {
	updateLoadingStatus("Loading section about Statistics I...");
	return Promise.resolve();
}
</script>
