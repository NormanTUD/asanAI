<?php include_once("functions.php"); ?>

<!--
TODO https://stats.stackexchange.com/questions/499109/who-invented-the-concept-of-over-fitting
-->

<div class="md">

We are giving an Artificial Intelligence, specifically, a single-layer neural network, one deceptively simple task: **"Learn the pattern of a sine wave."**

By adjusting the controls below you will witness, in real time, why AI models sometimes *hallucinate* or collapse when they encounter something new.

## The Maths: How the Model "Thinks"

We construct a function $f(x)$ of the form

$$
f(x) \;=\; w_n\, x^{n} + w_{n-1}\, x^{n-1} + \cdots + w_1\, x + b
\;=\; \sum_{i=1}^{n} w_i\, x^{i} \;+\; b
$$

This is **Polynomial Regression**. Rather than "knowing" the answer is a sine wave, the model assembles an equation by combining different powers of $x$.

<div class="optional md" data-headline="What the Symbols Mean">

| Symbol | Role |
|--------|------|
| $n$, **Polynomial Degree** | Controlled by the *Complexity* slider. Degree 1 → straight line ($w_1 x + b$). Degree 10 → a curve that can bend up to 9 times. |
| $w_i$, **Weights** | Coefficients the AI adjusts during training to reshape the curve. |
| $b$, **Bias term** | A constant that shifts the entire curve up or down. Not to be confused with "high bias" (underfitting). |

</div>

### The Loss Function

The **MSE** (Mean Squared Error) is the AI's measure of "how wrong am I?":

$$
\text{MSE} = \frac{1}{N}\sum_{i=1}^{N}\bigl(y_{\text{observed}}^{(i)} - y_{\text{predicted}}^{(i)}\bigr)^{2}
$$

* **Low loss** → the model's curve hugs the training dots closely.
* **High loss** → the model hasn't yet found a curve that fits the data.

### How the Model Learns: Gradient Descent

Knowing "how wrong am I?" is not enough, the model also needs a strategy for getting *less wrong*. This is the job of **gradient descent**.

At each training step the model:

1. Computes the loss (MSE) on the current batch of data.
2. Calculates the **gradient**, the direction in which each weight $w_i$ should change to reduce the loss the fastest.
3. Updates every weight by a small step in that direction:

$$
w_i \;\leftarrow\; w_i \;-\; \eta \,\frac{\partial\,\text{MSE}}{\partial\, w_i}
$$

The scalar $\eta$ is the **learning rate**, it controls how large each step is. Too large and the model overshoots; too small and training takes forever. We use the **Adam** optimizer (a popular variant of gradient descent that adapts the learning rate automatically) with $\eta = 0.01$.

One complete pass through the entire training dataset is called an **epoch**. The epoch counter in the control panel shows how many full passes the model has completed.

<div class="optional md" data-headline="Why Adam Instead of Plain Gradient Descent?">

Plain (vanilla) gradient descent uses the same learning rate $\eta$ for every weight. **Adam** (\citeauthor{adam}, \citeyear{adam}) maintains a per-weight running average of both the gradient and its squared magnitude, effectively giving each weight its own adaptive step size. This makes training faster and more stable, especially for loss landscapes with many flat regions or sharp valleys, which is exactly what polynomial regression with high degrees produces.

</div>

### The Bias–Variance Tradeoff

Every predictive model faces a fundamental tension between two sources of error:

* **Bias**, error from overly simplistic assumptions. A straight line ($n = 1$) *cannot* represent a sine wave no matter how much data it sees. High bias → **underfitting**.
* **Variance**, error from excessive sensitivity to the training data. A degree-10 polynomial has so much freedom that it contorts itself to pass through every noisy dot, and a different random sample would produce a wildly different curve. High variance → **overfitting**.

The **total error** on unseen data is approximately:

$$
\text{Total Error} \;=\; \text{Bias}^2 \;+\; \text{Variance} \;+\; \text{Irreducible Noise}
$$

As model complexity increases, bias falls but variance rises. The sweet spot, the lowest total error, lies somewhere in between. The idea here is to let you *see* that tradeoff in action.

<div class="optional md" data-headline="Why Can't We Just Measure This Directly?">

In practice, we never know the true function (here we do, it's $\sin(x)$). Instead, practitioners split their data into a **training set** (used to fit the model) and a **test set** (held back, never seen during training). The test-set error is an unbiased estimate of how the model will perform on new data. More sophisticated approaches like **$k$-fold cross-validation** repeat this split $k$ times and average the results. We skip the train/test split to keep things visual, but every real-world ML pipeline relies on it.

</div>

## Try It Yourself

1. **Underfitting (High Bias):** Set the **Degree** to **1** or **2** and train. The red line is too rigid to follow the wave, even inside the training window.
2. **Overfitting (High Variance):** Set the **Degree** to **10**, crank the **Noise** up, and train. Watch the red line contort itself to touch every noisy dot.
3. **The Extrapolation Trap:** No matter how good the fit looks *inside* the blue box, observe what happens *outside* it. The red line almost always rockets toward $\pm\infty$.
4. **Regularization:** Toggle **L2 Regularization** on and repeat experiment 2. Notice how the curve becomes smoother and the weights stay smaller, even at high degree.

</div>

<!-- ═══════════════════════════════════════════════════════════
     CONTROLS
     ═══════════════════════════════════════════════════════════ -->
<div class="lab-controls" style="background:#f8fafc; padding:25px; border-radius:15px; border:1px solid #e2e8f0; margin-bottom:20px;">
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:30px;">

        <!-- Left column: sliders -->
        <div>
            <label style="display:block; margin-bottom:6px;">
                <strong>Polynomial Degree:</strong>
                <span id="label-degree" style="font-weight:bold; color:#ef4444;">4</span>
            </label>
            <input type="range" id="slider-degree" min="1" max="10" step="1" value="4"
                   style="width:100%; margin-bottom:18px;">

            <label style="display:block; margin-bottom:6px;">
                <strong>Observation Noise (σ):</strong>
                <span id="label-noise" style="font-weight:bold; color:#6366f1;">0.15</span>
            </label>
            <input type="range" id="slider-noise" min="0" max="0.6" step="0.05" value="0.15"
                   style="width:100%; margin-bottom:18px;">

            <label style="display:block; margin-bottom:6px;">
                <strong>L2 Regularization (λ):</strong>
                <span id="label-lambda" style="font-weight:bold; color:#22c55e;">0.000</span>
            </label>
            <input type="range" id="slider-lambda" min="0" max="0.1" step="0.001" value="0"
                   style="width:100%;">
        </div>

        <!-- Right column: metrics + buttons -->
        <div style="background:#fff; padding:15px; border-radius:10px; border:1px solid #cbd5e0;
                     display:flex; flex-direction:column; justify-content:center; gap:10px;">
            <div style="font-family:monospace; font-size:0.9rem;">
                Training MSE: <strong><span id="loss-train">0.000000</span></strong>
            </div>
            <div style="font-family:monospace; font-size:0.9rem;">
                Test MSE: <strong><span id="loss-test">0.000000</span></strong>
            </div>
            <div style="font-family:monospace; font-size:0.9rem;">
                Epochs: <strong><span id="epoch-count">0</span></strong>
            </div>
            <div style="display:flex; gap:10px;">
                <button id="btn-toggle-train"
                        style="flex:1; background:#22c55e; color:#fff; border:none; padding:12px;
                               border-radius:8px; cursor:pointer; font-weight:bold; font-size:1rem;">
                    🚀 Start Training
                </button>
                <button id="btn-reset"
                        style="flex:0 0 auto; background:#64748b; color:#fff; border:none; padding:12px 18px;
                               border-radius:8px; cursor:pointer; font-weight:bold; font-size:1rem;"
                        title="Reset model & data">
                    🔄 Reset
                </button>
            </div>
        </div>
    </div>
</div>

<div id="equation-monitor" style="margin-bottom:12px; width: 100%; overflow: auto; padding-bottom: 14px;">
    $$\dots$$
</div>

<div id="fitting-plot"
     style="width:100%; height:600px; background:#fff; border-radius:12px; border:1px solid #e2e8f0;">
</div>

<!-- ═══════════════════════════════════════════════════════════
     ANALYSIS
     ═══════════════════════════════════════════════════════════ -->
<div class="md">

## What You're Seeing

| Element | Meaning |
|---------|---------|
| **Dotted grey line**, *Universal Truth* | A perfect sine wave, $y = \sin(x)$. This is the true underlying pattern we want the AI to learn. |
| **Blue-shaded region**, *Training Window* | The slice of reality the model is allowed to observe. In practice we never have *all* the data, only a small, noisy sample. |
| **Black dots**, *Noisy Observations* | The specific data points the AI can "see." Notice they scatter around the true curve; real-world measurements are never perfect. |
| **Red line**, *AI's Hypothesis* | The model's current best guess. It tries to draw a curve that passes as close to the black dots as possible. |
| **Green dots**, *Test Data* | Data points the model has **never** seen during training. The test MSE measures how well the model generalises. |

## Understanding the Results

### The Extrapolation Failure

Look at how the **Red Line** behaves *outside* the **Blue Training Zone**:

* **The AI's logic:** *"I found a polynomial that perfectly matches the dots I was given."*
* **The reality:** The AI has no concept of *periodicity*, it doesn't know the wave repeats. It assumes the local polynomial trend continues, which inevitably sends $f(x) \to \pm\infty$.
* **Lesson:** Machine-learning models are typically strong **interpolators** (they guess well *between* known points) but poor **extrapolators** (they guess badly *outside* the range of training data).

### Underfitting vs. Overfitting

| Regime | Degree | Training MSE | Test MSE | Behaviour |
|--------|--------|-------------|----------|-----------|
| **Underfitting** (High Bias) | 1 – 3 | High | High | The curve is too stiff to follow the sine wave. Both training and test error are large. |
| **Reasonable fit** | 4 – 6 | Low | Low | Acceptable inside the training window. Test MSE is close to training MSE. |
| **Overfitting** (High Variance) | 8 – 10 | Very low | High | The curve contorts wildly to pass through every noisy dot. Training MSE drops but test MSE climbs, the classic signature of overfitting. |

**Key insight:** Watch the **two MSE numbers** as you increase the degree. When training MSE keeps falling but test MSE starts rising, the model has crossed from learning the signal to memorizing the noise. This gap between training and test performance is the most reliable diagnostic for overfitting in practice.

### From Polynomial Regression to Neural Networks

We use polynomial regression, but the lessons apply directly to neural networks. Here's why:

A single-layer neural network with $n$ neurons computes a weighted sum of *learned features*, conceptually identical to our weighted sum of polynomial terms. Adding more neurons (or more layers) is analogous to raising the polynomial degree: it increases the model's **capacity** to represent complex functions. The \citetitle{hornik1989universal} (\citeauthor{hornik1989universal}, \citeyear{hornik1989universal}) proves that a sufficiently wide neural network can approximate *any* continuous function, just as a sufficiently high-degree polynomial can. But "can approximate anything" is precisely the problem: with enough capacity, the model will fit the noise, not just the signal.

Large Language Models (LLMs) are neural networks with billions of parameters, polynomial degree cranked to an astronomical level. They perform brilliantly on tasks similar to their training data (*interpolation*) but can produce plausible-sounding nonsense on topics outside that distribution (*extrapolation*). The red line rocketing to $\pm\infty$ outside the blue box is a visual metaphor for hallucination.

### Runge's Phenomenon

When you use high-degree polynomials to fit data, you often see violent oscillations near the edges of the training interval. This is known as \citealternativetitle{rungesphenomenon} (pp. 224–243). Even when the fit is excellent in the center, the tails of the polynomial whip around unpredictably, rendering the model useless for prediction beyond its training window.

<div class="optional md" data-headline="Runge's Original Example (1901)">

\citeauthor{rungesphenomenon} demonstrated the phenomenon using the innocent-looking function

$$
f(x) = \frac{1}{1 + 25x^2}
$$

on the interval $[-1, 1]$ with equidistant interpolation nodes. As the number of nodes increases, the interpolating polynomial converges at the center but diverges wildly near $x = \pm 1$. The maximum error actually *grows* without bound.
</div>

## Taming the "Wiggle": Regularization & Dropout

To prevent a model from chasing noise or exhibiting \citealternativetitle{rungesphenomenon}, developers impose mathematical constraints that reward *simplicity* over perfect memorization.

### L1 & L2 Regularization (Weight Penalties)

Without constraints, the weight vector $\mathbf{w}$ can explode to enormous values just to force the curve through every noisy dot. Regularization adds a **penalty term** to the loss:

| Method | Penalty | Effect |
|--------|---------|--------|
| **L1, Lasso** (\citeauthor{tibshirani1996lasso}, \citeyear{tibshirani1996lasso}) | $\lambda \sum_{j} \| w_j \|$ | Drives unimportant weights to **exactly zero** → automatic feature selection. |
| **L2, Ridge** (first described by \citeauthor{hoerl1970ridge} in \citeyear{hoerl1970ridge}) | $\lambda \displaystyle\sum_{j} w_j^{2}$ | Shrinks all weights toward zero → produces a **smoother** curve. |

The regularized losses therefore become:
</div>

$$
\mathcal{L}_{\text{L1}} = \text{MSE} + \lambda \sum_{j} |w_j|
\qquad\qquad
\mathcal{L}_{\text{L2}} = \text{MSE} + \lambda \sum_{j} w_j^{2}
$$

<div class="md">
**Try it now:** Use the **L2 Regularization (λ)** slider above. Set the degree to 10, add noise, train, then gradually increase $\lambda$. Watch the red curve smooth out and the test MSE drop, even as training MSE rises slightly. That's the tradeoff: you sacrifice a little training accuracy for much better generalization.

<div class="optional md" data-headline="The History of Regularization">

The idea of penalizing solution complexity predates machine learning by decades. **\citeauthor{earlyl2}** (\citeyear{earlyl2}) independently developed what we now call L2 regularization in the context of solving ill-posed integral equations, problems where small perturbations in the input cause enormous changes in the output. In statistics, \citeauthor{hoerl1970ridge} and Kennard reintroduced the technique in \citeyear{hoerl1970ridge} as **Ridge Regression**. \citeauthor{tibshirani1996lasso}'s **LASSO** (\citeyear{tibshirani1996lasso}) added the L1 variant, whose key innovation was producing *sparse* solutions, models that automatically ignore irrelevant features by setting their weights to exactly zero.

</div>

### Dropout

**Dropout**, as introduced by *Nitish Srivastava et al.* in \citeyear{srivastava2014dropout} in their work \citetitle{srivastava2014dropout}, randomly zeroes out a fraction of the layer's inputs during each training step, forcing the network to learn redundant representations rather than relying on any single feature.

<div class="optional md" data-headline="Concrete Example: 50% Dropout">

$$
\text{Original inputs} = \begin{pmatrix} 2.0 & 4.0 & 8.0 & 16.0 \end{pmatrix}
\;\;\xrightarrow{\text{50\% dropout}}\;\;
\begin{pmatrix} 2.0 & \mathbf{0} & \mathbf{0} & 16.0 \end{pmatrix}
$$

Because the model must learn the pattern with only *partial* information at every step, the resulting approximation is far more robust, and far less likely to "freak out" when it leaves the training window. The trade-off: dropout requires **more training data** and **longer training** to converge.

</div>

### Over- and Underfitting in LLMs & Modern AI

The curve's behaviour outside the blue box mirrors a core challenge of modern AI:

**Symptoms:**
* Within familiar patterns (*interpolation*), LLMs appear brilliant.
* On novel logic puzzles or niche topics (*extrapolation*), they *hallucinate*: much like the red line, they invent facts that fit the statistical pattern but have no basis in reality.
* The root cause is identical, the model has no concept of the underlying "periodicity" or universal truth; it only sees the local trend of its training window.

**Technical mitigation:**
* **regularization** (L1 / L2) penalizes overly complex internal representations, keeping the model's "curve" smoother in uncharted territory.
* **Dropout** prevents co-adaptation of features, improving robustness to distribution shift.
* Together, they ensure the model does not "chase the noise" (high variance), which is precisely what makes high-degree polynomials, and over-parameterized neural networks, so erratic at the edges.

<div class="optional md" data-headline="Double Descent: When More Parameters Help Again">

The classical bias–variance tradeoff predicts a clean U-shaped test-error curve: error falls as complexity increases, hits a minimum, then rises as the model overfits. But recent research has revealed a surprising twist called **double descent**.

When models become *extremely* overparameterized, far past the point where they can perfectly interpolate the training data, test error can start *decreasing again*. This has been observed in deep neural networks, random forests, and even simple linear models.

The intuition: once a model has vastly more parameters than data points, there are many possible perfect-fit solutions, and gradient descent tends to find the "simplest" one (in a minimum-norm sense), which generalises well. This challenges the simple "more parameters = more overfitting" narrative and is an active area of research.

Here, double descent is not visible because our polynomial degrees stay low. But it explains why modern LLMs with billions of parameters can generalise well despite being massively overparameterized, provided they are trained with enough data and appropriate regularization.

</div>

</div>
