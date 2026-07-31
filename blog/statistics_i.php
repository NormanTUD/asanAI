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

<script src="statistics.js"></script>

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

On January 1, 1801, the dwarf planet **Ceres** was spotted by \citeauthor{ceresdiscovery}. It was a monumental find, but the victory was short-lived; Ceres soon vanished into the sun's glare, leaving astronomers with only 41 days of "noisy" and uncertain data. To find it again, the world turned to **Carl Friedrich Gauß**. He, in \citeyear{gauss1809}, in his work \citetitle{gauss1809} (§ 175-177, p. 208-213), solved this problem, by looking not at single data points, but the whole group of data points as a whole, and the idea that the truth must be somewhere in between.
</div>

<figure>
    <img style="width: 100%" src="ceres_path.png" alt="The apparent path of Ceres in the Night Sky" />
    <figcaption class="md">\citealternativetitle{cerespath}</figcaption>
</figure>

<div class="md">
To find Ceres, Gauß didn't just look at the sky; he looked at the **errors** of the measurements. He assumed that while the planet follows a perfect path (green line), the telescope readings (blue dots) follow a **Bell Curve** centered on that path.
</div>

<div class="statlab-interactive-zone">
    <div id="plot-astro" style="width:100%; height:500px;"></div>
    
	<div class="statlab-controls">
	    <div class="slider-container">
		<span class="label-left">Better&nbsp;Telescopes</span>
		<input type="range" id="astro-sigma" min="0.1" max="2.0" step="0.1" value="2" style="width: 100%;">
		<span class="label-right">Worse&nbsp;Telescopes</span>
    </div>
</div>

<div class="statlab-section">
    <div class="md">
        ## Dataset Splits: Why You Can't Test on the Same Data You Trained On

        A fundamental rule in machine learning: **never evaluate your model on data it has already seen**. This is why datasets are split into separate subsets:

        * **Training Set (typically 70-80%):** Used to adjust the model's weights. The model sees this data and learns from it.
        * **Validation Set (typically 10-15%):** Used to tune hyperparameters (learning rate, architecture choices) and detect overfitting. The model does not learn from this data, but it influences human decisions about the model.
        * **Test Set (typically 10-15%):** Held back until the very end. Used only once to report final performance. If you ever use the test set to make decisions, you are cheating, and your reported accuracy will be optimistic.

        **Why three sets?** If you tune hyperparameters on the validation set, information about the validation set "leaks" into your model choices. You need a third, completely untouched set to get an honest measure of generalization. In small-data regimes (e.g., medical imaging with only hundreds of samples), **k-fold cross-validation** is used instead, where the data is repeatedly split into $k$ folds, and each fold takes a turn as the test set.
    </div>
</div>

<div class="statlab-section">
    <div class="md">
        ## Bias in Data: The Mirror of Society

        A model is only as good as the data it is trained on. If the training data contains historical biases, the model will learn and amplify them. This is not a bug in the math — it is a feature of the statistical learning process: the model faithfully reproduces the patterns it observes.

        **Common sources of bias in ML datasets:**

        * **Historical Bias:** The data reflects existing societal inequalities. A hiring model trained on historical hiring data will learn the gender and racial biases present in past decisions.
        * **Representation Bias:** Certain groups are under-represented in the dataset. A facial recognition system trained mostly on light-skinned faces will perform poorly on dark-skinned faces, as documented by \citeauthor{buolamwini2018gender} in \citeyear{buolamwini2018gender}.
        * **Measurement Bias:** The features used to represent the data are noisy or systematically wrong for certain groups.
        * **Label Bias:** Human annotators introduce their own subjective judgments into the training labels.

        **The technical consequence:** Bias in data leads to systematically different performance across subgroups. The model's overall accuracy may look good, but disaggregated by demographic group, it can reveal dramatic disparities. Detecting and mitigating these biases is an active area of research in **fairness in machine learning**.
    </div>
</div>

<div class="statlab-section">
    <div class="md">
        ## Statistical Learning Theory and Vapnik's Contribution

        The theoretical framework underpinning all of supervised learning was formalized by \citeauthor{vapnik} in the 1960s–1990s. His **Statistical Learning Theory** asks a fundamental question: given a finite set of training examples, how can we bound the error on unseen data?

        Three key concepts from this framework:

        * **VC-Dimension (Vapnik-Chervonenkis dimension):** A measure of a model's capacity or complexity. A model with higher VC-dimension can fit more complex patterns but risks overfitting. The VC-dimension of a linear classifier in $d$ dimensions is $d + 1$; for a neural network, it can be proportional to the number of parameters.
        * **Structural Risk Minimization (SRM):** Instead of minimizing only the training error (Empirical Risk Minimization), SRM minimizes a combination of training error and model complexity. This is the theoretical justification for regularization techniques like weight decay and dropout.
        * **The Bias-Variance Tradeoff:** Models with low capacity (high bias) underfit; models with high capacity (low variance, but high variance in predictions across different training sets) overfit. The optimal model balances both.

        This framework explains why large neural networks can generalize despite having far more parameters than training examples, a phenomenon known as **"benign overfitting"** that remains an active area of theoretical research.
    </div>
</div>

</div>

<div class="md">
### How to Calculate with the Normal Distribution

Just as we learned to calculate exact probabilities with the Binomial formula $\binom{n}{k} p^k (1-p)^{n-k}$, we can calculate with the Gauß distribution. However, there is one crucial difference: the Normal Distribution is **continuous**, so we never ask "What is the probability of *exactly* $x$?" (that is always 0 for a continuous variable). Instead, we ask: **"What is the probability that $X$ falls within a range?"**

#### Step 1: Know Your Parameters

Every Normal Distribution is fully defined by just two numbers:
- **$\mu$ (Mean):** The center of the bell curve.
- **$\sigma$ (Standard Deviation):** The width/spread of the curve.

$$X \sim \mathcal{N}(\mu, \sigma^2)$$

#### Step 2: Standardize with the Z-Score

To look up probabilities, we convert any value $x$ into a **Z-score**, which tells us how many standard deviations $x$ is from the mean:

$$z = \frac{x - \mu}{\sigma}$$

This transforms *any* Normal Distribution into the **Standard Normal Distribution** $\mathcal{N}(0, 1)$, which has $\mu = 0$ and $\sigma = 1$. This is the key trick: instead of needing a different table for every possible $\mu$ and $\sigma$, we only ever need one table.
</div>

<div class="ai-callout" style="background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border-left: 4px solid #22c55e; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
    <div style="display: flex; align-items: flex-start; gap: 14px;">
        <span style="font-size: 1.6em; line-height: 1;">🤖</span>
        <div class="md">
**Why This Matters for AI: Batch Normalization**, one of the most important techniques in deep learning, is essentially computing Z-scores for every layer's activations during training. At each layer, the network computes:

<p>$$\hat{x}_i = \frac{x_i - \mu_{\text{batch}}}{\sigma_{\text{batch}}}$$</p>

This is the exact same Z-score formula Pearson invented for comparing crab organs to human bones. Without it, the activations in deep networks tend to drift toward extreme values (a problem called **internal covariate shift**), causing gradients to vanish or explode and training to stall. By standardizing activations back to $\mu = 0, \sigma = 1$ at every layer, the network stays in the "sweet spot" where learning is stable and fast. Layer Normalization, used in every Transformer (including GPT), applies the same principle, Pearson's 19th-century insight keeps 21st-century language models from collapsing during training.
        </div>
    </div>
</div>

<div class="md">
#### Step 3: Use the $\Phi$-Table (CDF)

The function $\Phi(z)$ answers one simple question: **"What percentage of all values fall to the LEFT of $z$ on the bell curve?"**

The formal equation for this is:

$$\Phi(z) = \frac{1}{\sqrt{2\pi}} \int_{-\infty}^{z} e^{-\frac{t^2}{2}} \, dt$$

This looks intimidating, but here's what it actually says in plain words:

- The $\int$ symbol (called an **integral**) just means **"add up the area."** It's the same idea as counting squares on graph paper under a curve, you slice the area into thin strips and add them all together.
- The $-\infty$ to $z$ at the bottom and top of $\int$ means: start from the far left (negative infinity) and stop at the point $z$.
- The $e^{-\frac{t^2}{2}}$ part is the **shape of the bell curve** itself, it's what makes it tall in the middle and flat at the edges.
- The $\frac{1}{\sqrt{2\pi}}$ in front is just a **scaling factor** that makes the total area under the entire curve equal exactly $1$ (i.e., $100\%$).

So the whole equation says: **"Take the bell curve, and measure the area from the far left up to the point $z$. That area is your probability."**

##### How to actually calculate $\Phi(z)$, the way Gauß did it

Unlike the Binomial formula where you can get an exact answer with multiplication, this integral has **no neat algebraic shortcut**. You cannot simplify it into a clean fraction or product. But that does not mean it's impossible to calculate, it just means you have to **approximate** it numerically.

The idea is simple: **slice the area under the curve into many thin rectangles, calculate the area of each one, and add them up.** The thinner the slices, the more accurate your answer.

Let's calculate $\Phi(1.0)$ step by step, the probability that $Z \leq 1.0$:

**Step A: Define the bell curve function**

$$f(t) = \frac{1}{\sqrt{2\pi}} \cdot e^{-\frac{t^2}{2}}$$

This is just a formula you plug numbers into. For example:

$$f(0) = \frac{1}{\sqrt{2\pi}} \cdot e^{0} = \frac{1}{2.5066} \approx 0.3989$$

$$f(1) = \frac{1}{\sqrt{2\pi}} \cdot e^{-0.5} \approx 0.2420$$

**Step B: Slice the area into rectangles**

We can't start at $-\infty$, but the curve is essentially zero past $z = -4$, so we start there. Let's use a step size of $\Delta t = 0.5$ (coarse, for illustration):
</div>

<table class="stat-phi-table" style="width: 100%; max-width: 700px; margin: 20px auto; border-collapse: collapse; font-size: 0.95em;">
    <thead>
        <tr style="border-bottom: 2px solid #334155;">
            <th style="padding: 8px 12px; text-align: center; color: #475569;">$t$</th>
            <th style="padding: 8px 12px; text-align: center; color: #475569;">$f(t)$</th>
            <th style="padding: 8px 12px; text-align: center; color: #475569;">Rectangle area $f(t) \cdot \Delta t$</th>
            <th style="padding: 8px 12px; text-align: center; color: #475569;">Running total</th>
        </tr>
    </thead>
    <tbody>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$-4.0$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$0.0001$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$0.0001$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$0.0001$</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$-3.5$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$0.0009$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$0.0004$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$0.0005$</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$-3.0$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$0.0044$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$0.0022$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$0.0027$</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0; color: #94a3b8;">
            <td style="padding: 6px 12px; text-align: center;">$\vdots$</td>
            <td style="padding: 6px 12px; text-align: center;">$\vdots$</td>
            <td style="padding: 6px 12px; text-align: center;">$\vdots$</td>
            <td style="padding: 6px 12px; text-align: center;">$\vdots$</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$-0.5$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$0.3521$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$0.1760$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$0.3121$</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
            <td style="padding: 6px 12px; text-align: center; font-family: monospace; font-weight: 700;">$0.0$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace; font-weight: 700;">$0.3989$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace; font-weight: 700;">$0.1995$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace; font-weight: 700;">$0.5116$</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$0.5$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$0.3521$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$0.1760$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace;">$0.6876$</td>
        </tr>
        <tr style="background: #fefce8;">
            <td style="padding: 6px 12px; text-align: center; font-family: monospace; font-weight: 700; color: #b45309;">$1.0$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace; font-weight: 700; color: #b45309;">$0.2420$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace; font-weight: 700; color: #b45309;">$0.1210$</td>
            <td style="padding: 6px 12px; text-align: center; font-family: monospace; font-weight: 700; color: #b45309;">$\approx 0.8086$</td>
        </tr>
    </tbody>
</table>

<div class="md">

With our coarse $\Delta t = 0.5$ slices, we get $\Phi(1.0) \approx 0.8086$. The true value is $0.8413$. The difference exists because our rectangles are too wide, they don't perfectly follow the curve.

**Step C: Make the slices thinner**

If we use $\Delta t = 0.01$ instead of $0.5$, we get $\Phi(1.0) \approx 0.8413$, matching the table to 4 decimal places. Use $\Delta t = 0.001$ and you get even more precision. This is exactly what Gauß did (by hand!), and what every calculator does today.

The whole process in one line:

$$\Phi(z) \approx \sum_{t = -4}^{z} f(t) \cdot \Delta t = \sum_{t = -4}^{z} \frac{1}{\sqrt{2\pi}} \cdot e^{-\frac{t^2}{2}} \cdot \Delta t$$

That's it. The $\int$ symbol in the original equation is just the "limit" of this sum as $\Delta t$ shrinks to zero. **The integral is nothing more than a sum of rectangles, taken to perfection.**

##### The key difference from the Binomial

| | Binomial | Normal (Gauß) |
|---|---|---|
| **How you calculate** | Exact: multiply factorials and powers | Approximate: sum up thin rectangles |
| **Why** | Finite number of discrete outcomes | Infinite smooth curve, no shortcut formula |
| **Precision** | Perfect every time | As precise as you want (thinner slices = better) |
| **Lookup tool** | Pascal's Triangle | $\Phi$-Table (pre-computed rectangle sums) |

This is why $\Phi$-tables exist: Gauß and his successors did the tedious rectangle-summing once, for every $z$ from $-3.49$ to $3.49$ in steps of $0.01$, and published the results so nobody else had to repeat the work.

Here are the most important values:
</div>

<table class="stat-phi-table" style="width: 100%; max-width: 640px; margin: 20px auto; border-collapse: collapse; font-size: 0.95em;">
    <thead>
        <tr style="border-bottom: 2px solid #334155;">
            <th style="padding: 10px 16px; text-align: center; color: #475569;">$z$</th>
            <th style="padding: 10px 16px; text-align: center; color: #475569;">$\Phi(z)$</th>
            <th style="padding: 10px 16px; text-align: left; color: #475569;">Meaning</th>
        </tr>
    </thead>
    <tbody>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 16px; text-align: center; font-family: monospace;">$-3.0$</td>
            <td style="padding: 8px 16px; text-align: center; font-family: monospace;">$0.0013$</td>
            <td style="padding: 8px 16px; color: #64748b;">Only 0.13% of values are below $z = -3$</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 16px; text-align: center; font-family: monospace;">$-2.0$</td>
            <td style="padding: 8px 16px; text-align: center; font-family: monospace;">$0.0228$</td>
            <td style="padding: 8px 16px; color: #64748b;">About 2.3% are below $z = -2$</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 16px; text-align: center; font-family: monospace;">$-1.0$</td>
            <td style="padding: 8px 16px; text-align: center; font-family: monospace;">$0.1587$</td>
            <td style="padding: 8px 16px; color: #64748b;">About 15.9% are below $z = -1$</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
            <td style="padding: 8px 16px; text-align: center; font-family: monospace; font-weight: 700;">$0.0$</td>
            <td style="padding: 8px 16px; text-align: center; font-family: monospace; font-weight: 700;">$0.5000$</td>
            <td style="padding: 8px 16px; color: #334155; font-weight: 600;">Exactly half, the center!</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 16px; text-align: center; font-family: monospace;">$1.0$</td>
            <td style="padding: 8px 16px; text-align: center; font-family: monospace;">$0.8413$</td>
            <td style="padding: 8px 16px; color: #64748b;">About 84.1% are below $z = 1$</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 16px; text-align: center; font-family: monospace;">$2.0$</td>
            <td style="padding: 8px 16px; text-align: center; font-family: monospace;">$0.9772$</td>
            <td style="padding: 8px 16px; color: #64748b;">About 97.7% are below $z = 2$</td>
        </tr>
        <tr>
            <td style="padding: 8px 16px; text-align: center; font-family: monospace;">$3.0$</td>
            <td style="padding: 8px 16px; text-align: center; font-family: monospace;">$0.9987$</td>
            <td style="padding: 8px 16px; color: #64748b;">99.87%, almost everything</td>
        </tr>
    </tbody>
</table>

<div class="md">

**Reading the table:** If $\Phi(1.0) = 0.8413$, that means $84.13\%$ of all values in a standard normal distribution are less than or equal to $1.0$. The remaining $1 - 0.8413 = 15.87\%$ are above it.

Think of it like this: imagine you filled the entire area under the bell curve with sand. The total sand is exactly $1$ (i.e., $100\%$). $\Phi(z)$ tells you what **fraction of the total sand** sits to the left of the point $z$. That fraction *is* the probability.

##### But what if your $z$ is not in the table?

Real $\Phi$-tables are much larger than the one above, they typically list values for every $z$ from $-3.49$ to $3.49$ in steps of $0.01$. For example, to look up $\Phi(1.53)$:

1. Go to the row for $z = 1.5$
2. Go to the column for $0.03$
3. Read the value: $\Phi(1.53) = 0.9370$

For values between table entries, you can **interpolate** (take the average of the two nearest values). Or, in practice, you use a calculator, which is doing the exact same rectangle-summing, just very fast.

##### Worked Example: Exam Scores

Suppose exam scores follow $X \sim \mathcal{N}(70, 10^2)$ (mean $\mu = 70$, standard deviation $\sigma = 10$).

**Question:** What percentage of students scored between 60 and 85?

$$P(60 \leq X \leq 85) = \Phi\!\left(\frac{85 - 70}{10}\right) - \Phi\!\left(\frac{60 - 70}{10}\right)$$

$$= \Phi(1.5) - \Phi(-1.0)$$

$$= 0.9332 - 0.1587 = \mathbf{0.7745}$$

**Answer:** Approximately **77.5%** of students scored between 60 and 85.

##### The Empirical Rule (68-95-99.7)

A quick mental shortcut that follows directly from the $\Phi$-table:

$$
\begin{aligned}
P(\mu - 1\sigma \leq X \leq \mu + 1\sigma) &\approx 68.3\% \\
P(\mu - 2\sigma \leq X \leq \mu + 2\sigma) &\approx 95.4\% \\
P(\mu - 3\sigma \leq X \leq \mu + 3\sigma) &\approx 99.7\%
\end{aligned}
$$

This is why Gauß could predict where Ceres would reappear: he knew that the true position was almost certainly within $2\sigma$ to $3\sigma$ of his calculated estimate.

##### Comparison: Binomial vs. Gauß Calculation

| | Binomial | Normal (Gauß) |
|---|---|---|
| **Type** | Discrete (counting) | Continuous (measuring) |
| **Question** | "Exactly $k$ successes?" | "Within a range $[a, b]$?" |
| **Tool** | $\binom{n}{k} p^k (1-p)^{n-k}$ | $\Phi(z_b) - \Phi(z_a)$ |
| **Key Step** | Count combinations | Standardize to $z$ |
| **Lookup** | Pascal's Triangle | $\Phi$-Table |

As $n$ grows large, the Binomial Distribution itself approaches the Normal Distribution (this is exactly what the Central Limit Theorem below demonstrates). So the Gauß curve is not a replacement for the Binomial; it is its **natural limit**.
</div>

<div class="statlab-interactive-zone">
    <div class="md">
    **Try it yourself:** Enter a Normal Distribution and a range to calculate the probability. The shaded area under the curve shows your answer.
    </div>

    <div class="statlab-controls">
        <div class="control-group">
            <label>Mean ($\mu$):</label>
            <input type="range" id="gauss-calc-mu" min="-5" max="5" step="0.1" value="0">
        </div>
        <div class="control-group">
            <label>Std Dev ($\sigma$):</label>
            <input type="range" id="gauss-calc-sigma" min="0.5" max="3" step="0.1" value="1">
        </div>
        <div class="control-group">
            <label>Lower Bound ($a$):</label>
            <input type="range" id="gauss-calc-a" min="-5" max="5" step="0.1" value="-1">
        </div>
        <div class="control-group">
            <label>Upper Bound ($b$):</label>
            <input type="range" id="gauss-calc-b" min="-5" max="5" step="0.1" value="1">
        </div>
    </div>

    <div id="gauss-calc-math" class="statlab-math-display" style="background: #fdfaf2; padding: 20px; border-radius: 12px; border: 1px solid #fef3c7;"></div>
    <div id="plot-gauss-calc" class="statlab-visual" style="height: 400px;"></div>
</div>

<div class="md">
#### The Mathematical Foundation: The Law of Errors

Gauß solved the probable position of Ceres by treating every measurement as a composite of a "True Path" and random error. He realized that the problem was "more than determined" ($n > v$); when you have more observations than variables, a perfect fit is impossible because human observation is never free from error.

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

<div class="statlab-interactive-zone" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: var(--mn-surface, #fff); display: flex; flex-direction: column; gap: 20px;">
    
    <div id="plot-clt" style="width:100%; height:380px;"></div>

    <div id="dice-container" style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; min-height: 50px; padding: 15px; background: var(--mn-surface, #fff); border: 1px dashed #cbd5e1; border-radius: 8px;">
	<span style="color: #94a3b8; font-style: italic;">Roll the dice to see individual results here...</span>
    </div>

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
        
        <div style="display: flex; gap: 10px;">
            <button onclick="rollCLT()" style="background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; flex: 2; transition: background 0.2s;">Roll Dice & Add to Plot</button>
            <button onclick="resetCLT()" style="background: #ef4444; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; flex: 1;">Reset Data</button>
        </div>
    </div>

</div>

<div class="optional md" data-headline="Least Squares: The Gauß-Legendre Rivalry">
**Adrien-Marie Legendre** \citeyear{legendre1805} published the method first, but **Carl Friedrich Gauß** \citeyear{gauss1809} proved why it worked by inventing the **Normal Distribution**.
</div>

<div class="md">
The Normal Distribution, or Bell Curve, emerges from the **Central Limit Theorem**, which acts as the mathematical bridge between individual randomness and collective order. While a single event might be unpredictable, the average of many independent trials inevitably clusters around a central mean, forming the iconic symmetrical shape. Historically, this was used by **Carl Friedrich Gauß** to filter "noise" from astronomical data and by **Laplace** to turn statistical uncertainty into scientific certainty. In modern AI, this distribution is foundational; it allows machines to distinguish meaningful "signals" from background noise and serves as the primary method for initializing the neural networks that power large language models.

$$
\begin{array}{c}
    n=2: & 1 \quad 2 \quad 1 \\
    n=10: & \dots \text{ (Starts to curve)} \dots \\
    n \to \infty: & \text{The Bell Curve}
\end{array}
$$

$$f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$$

**Example:** If you roll a single die, the results are flat (Uniform Distribution), but as you increase the number of dice ($n$) and track their average, the distribution tightens and transforms into a smooth Bell Curve centered at 3.5.

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

<div class="ai-callout" style="background: linear-gradient(135deg, #fff1f2, #fef2f2); border-left: 4px solid #e11d48; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
    <div style="display: flex; align-items: flex-start; gap: 14px;">
        <span style="font-size: 1.6em; line-height: 1;">🤖</span>
        <div class="md">
**Why This Matters for AI:** The Gumbel distribution is the secret ingredient behind the **Gumbel-Softmax trick** (also called the Concrete distribution). In neural networks, we often need to *sample* from a categorical distribution (e.g., "pick one of 50,000 tokens"), but sampling is a discrete operation that breaks gradient-based training. The trick works by adding Gumbel-distributed noise to the logits before applying softmax, this creates a differentiable approximation of discrete sampling. It is how **Variational Autoencoders (VAEs)** with discrete latent variables and certain **reinforcement learning** methods (like RELAX and straight-through estimators) remain trainable end-to-end. The same distribution that predicts 100-year floods now enables machines to "choose" while still learning from their choices.
        </div>
    </div>
</div>

</div>

<div class="statlab-section">
    <div class="md">
        ### The Poisson Distribution: The Law of Rare Events
        In \citeyear{poisson}, **\citeauthor{poisson}** published \citetitle{poisson}, a broad work on judicial probability that included (in sections 41-42) a derivation of the limit of the Binomial distribution when the number of trials is very large ($n \to \infty$) and the probability is very small ($p \to 0$).

        It became famous as the **"Law of Small Numbers"** after \citeauthor{gesetzderkleinenzahlen} used it to model the likelihood of Prussian soldiers getting killed by their own horse's kicks (p. 23f, §12), events that are rare but occur at a constant average rate $\lambda$.

        The math is expressed as:
        $$P(X=k) = \frac{\lambda^k e^{-\lambda}}{k!}$$

        Where $\lambda$ represents the average number of events in a given interval. In modern AI, this is used to model everything from website traffic spikes to the arrival of tokens in a sequence.
    </div>
    <div class="statlab-interactive-zone">
        <label>Rate of Occurrence ($\lambda$):</label>
        <input type="range" id="poisson-lambda" min="0.1" max="50" step="0.1" value="4" oninput="renderPoissonLab()">
        <span id="poisson-lambda-val">4.0</span>
        <div id="poisson-chart"></div>
    </div>

<div class="ai-callout" style="background: linear-gradient(135deg, #eff6ff, #f5f3ff); border-left: 4px solid #6366f1; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
    <div style="display: flex; align-items: flex-start; gap: 14px;">
        <span style="font-size: 1.6em; line-height: 1;">🤖</span>
        <div class="md">
**Why This Matters for AI:** The Poisson distribution is used to model **token arrival rates in streaming and real-time AI systems**. When an LLM serves thousands of users simultaneously, the requests hitting the server per second follow a Poisson process, rare per individual user, but constant in aggregate. Understanding $\lambda$ allows engineers to provision GPU capacity, set queue depths, and design auto-scaling policies. The same math Bortkiewicz used to count horse-kick fatalities now determines how many inference servers OpenAI spins up at peak hours.
        </div>
    </div>
</div>
</div>

<div class="md">
## Pearson's Biological Link: The Father-Son Study

In 1801, \citeauthor{gauss1809} used the "Normal Distribution" to find a planet; in 1895, \citeauthor{pearson1895correlation} used it to map the human race. Building on data originally collected by \citeauthor{galton}, who measured heights from over 1,000 fathers and their adult sons, Pearson answered a fundamental question: *How much does one variable actually tell us about another?*

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

<div class="ai-callout" style="background: linear-gradient(135deg, #fefce8, #fef9c3); border-left: 4px solid #eab308; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
    <div style="display: flex; align-items: flex-start; gap: 14px;">
        <span style="font-size: 1.6em; line-height: 1;">🤖</span>
        <div class="md">
**Why This Matters for AI:** **Cosine similarity** in embedding spaces is a normalized correlation, and it is how **semantic search** works. When you type a query into a search engine powered by embeddings, both your query and every document are converted into high-dimensional vectors. The system then computes:

$$\text{cosine similarity} = \frac{\vec{A} \cdot \vec{B}}{|\vec{A}| \cdot |\vec{B}|}$$

This is structurally identical to Pearson's $r$: the dot product in the numerator captures the "shared signal" (covariance), while dividing by the magnitudes (standard deviations) removes the effect of scale. A cosine similarity of $1.0$ means the vectors point in the same direction (semantically identical), $0$ means orthogonal (unrelated), and $-1$ means opposite. This is why "king" and "monarch" score high similarity despite being different strings, their embedding vectors, shaped by billions of training examples, point in nearly the same direction. Pearson's solution to comparing crabs and humans now powers every RAG pipeline, recommendation engine, and vector database in modern AI.
        </div>
    </div>
</div>

<div class="md">
## Standardizing: Z-Scores & The Pearson Problem

Z-scores standardize a value to the standard Normal:

$$z = \frac{x - \mu}{\sigma}$$

A value with $z = 1.5$ is 1.5 standard deviations above the mean. By convention, $|z| > 2$ is "unusual" and $|z| > 3$ is "rare".

**Pearson's problem**: how do you standardize when you don't know $\mu$ and $\sigma$? Replace them with sample estimates $\bar x$ and $s$. The result is approximately standard Normal by the CLT.

In machine learning, **batch normalization** and **layer normalization** are continuous z-scoring applied to activations. This is what makes training deep networks tractable.
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

</div>
</div>

<script>
var __qt = new URLSearchParams(location.search).get('theme');
if (__qt) document.documentElement.classList.toggle('dark', __qt === 'dark');
setTimeout(async () => {
    var items = typeof _statLazyRegistry !== 'undefined' ? _statLazyRegistry : [];
    for (var i = 0; i < items.length; i++) {
        try { var p = items[i].initFn(); if (p && typeof p.then === 'function') await p; }
        catch (e) { console.log('INITFAIL', items[i].el.id, e && e.message); }
    }
    var to = new URLSearchParams(location.search).get('to');
    if (to) document.getElementById(to).scrollIntoView();
    document.title += ' [READY]';
}, 800);
</script>
