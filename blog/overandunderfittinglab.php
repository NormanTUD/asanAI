<?php include_once("functions.php"); ?>

<div class="md">

We are giving an Artificial Intelligence, specifically, a single-layer neural network, one deceptively simple task: **"Learn the pattern of a sine wave."**

By adjusting the controls below you will witness, in real time, why AI models sometimes *hallucinate* or collapse when they encounter something new.

## What You're Seeing

| Element | Meaning |
|---------|---------|
| **Dotted grey line**, *Universal Truth* | A perfect sine wave, $y = \sin(x)$. This is the true underlying pattern we want the AI to learn. |
| **Blue-shaded region**, *Training Window* | The slice of reality the model is allowed to observe. In practice we never have *all* the data, only a small, noisy sample. |
| **Black dots**, *Noisy Observations* | The specific data points the AI can "see." Notice they scatter around the true curve; real-world measurements are never perfect. |
| **Red line**, *AI's Hypothesis* | The model's current best guess. It tries to draw a curve that passes as close to the black dots as possible. |

## The Maths: How the Model "Thinks"

We construct a function $f(x)$ of the form

$$
f(x) \;=\; w_n\, x^{n} + w_{n-1}\, x^{n-1} + \cdots + w_1\, x + b
\;=\; \sum_{i=1}^{n} w_i\, x^{i} \;+\; b
$$

This is **Polynomial Regression**. Rather than "knowing" the answer is a sine wave, the model assembles an equation by combining different powers of $x$.

| Symbol | Role |
|--------|------|
| $n$, **Polynomial Degree** | Controlled by the *Complexity* slider. Degree 1 → straight line ($w_1 x + b$). Degree 10 → a curve that can bend up to 9 times. |
| $w_i$, **Weights** | Coefficients the AI adjusts during training to reshape the curve. |
| $b$, **Bias** | A constant that shifts the entire curve up or down. |

### The Loss Function

The **MSE** (Mean Squared Error) is the AI's measure of "how wrong am I?":

$$
\text{MSE} = \frac{1}{N}\sum_{i=1}^{N}\bigl(y_{\text{observed}}^{(i)} - y_{\text{predicted}}^{(i)}\bigr)^{2}
$$

* **Low loss** → the model's curve hugs the training dots closely.
* **High loss** → the model hasn't yet found a curve that fits the data.

## Try It Yourself

1. **Underfitting (High Bias):** Set the **Degree** to **1** or **2** and train. The red line is too rigid to follow the wave, even inside the training window.
2. **Overfitting (High Variance):** Set the **Degree** to **10**, crank the **Noise** up, and train. Watch the red line contort itself to touch every noisy dot.
3. **The Extrapolation Trap:** No matter how good the fit looks *inside* the blue box, observe what happens *outside* it. The red line almost always rockets toward $\pm\infty$.

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
                   style="width:100%;">
        </div>

        <!-- Right column: metrics + buttons -->
        <div style="background:#fff; padding:15px; border-radius:10px; border:1px solid #cbd5e0;
                     display:flex; flex-direction:column; justify-content:center; gap:10px;">
            <div style="font-family:monospace; font-size:0.9rem;">
                MSE Loss: <strong><span id="loss-train">0.000000</span></strong>
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

<div id="equation-monitor" style="margin-bottom:12px;">
    $$\dots$$
</div>

<div id="fitting-plot"
     style="width:100%; height:600px; background:#fff; border-radius:12px; border:1px solid #e2e8f0;">
</div>

<!-- ═══════════════════════════════════════════════════════════
     ANALYSIS
     ═══════════════════════════════════════════════════════════ -->
<div class="md">

## Understanding the Results

### The Extrapolation Failure

Look at how the **Red Line** behaves *outside* the **Blue Training Zone**:

* **The AI's logic:** *"I found a polynomial that perfectly matches the dots I was given."*
* **The reality:** The AI has no concept of *periodicity*, it doesn't know the wave repeats. It assumes the local polynomial trend continues, which inevitably sends $f(x) \to \pm\infty$.
* **Lesson:** Machine-learning models are typically strong **interpolators** (they guess well *between* known points) but poor **extrapolators** (they guess badly *outside* the range of training data).

### Underfitting vs. Overfitting

| Regime | Degree | Behaviour |
|--------|--------|-----------|
| **Underfitting** (High Bias) | 1 – 3 | The curve is too stiff to follow the sine wave, even inside the training window. |
| **Reasonable fit** | 4 – 8 | Acceptable inside the training window; still diverges outside it. |
| **Overfitting** (High Variance) | 9 – 10+ | The curve contorts wildly to pass through every noisy dot, destroying generalisation. |

> **Key insight:** *No matter the degree*, the polynomial only approximates $\sin(x)$ well within the region it has seen. This principle extends to all neural-network-based AI, including Large Language Models, which perform well on tasks similar to their training data but can produce plausible-sounding nonsense ("hallucinations") on topics outside that distribution.

### Runge's Phenomenon

When you use high-degree polynomials to fit data, you often see violent oscillations near the edges of the training interval. This is known as \citealternativetitle{rungesphenomenon} (pp. 224–243). Even when the fit is excellent in the centre, the tails of the polynomial whip around unpredictably, rendering the model useless for prediction beyond its training window.

## Taming the "Wiggle": Regularisation & Dropout

To prevent a model from chasing noise or exhibiting \citealternativetitle{rungesphenomenon}, developers impose mathematical constraints that reward *simplicity* over perfect memorisation.

### L1 & L2 Regularisation (Weight Penalties)

Without constraints, the weight vector $\mathbf{w}$ can explode to enormous values just to force the curve through every noisy dot. Regularisation adds a **penalty term** to the loss:

| Method | Penalty | Effect |
|--------|---------|--------|
| **L1, Lasso** (first described by \citeauthor{tibshirani1996lasso} in \citeyear{tibshirani1996lasso}) | $\lambda \displaystyle\sum_{j} \lvert w_j \rvert$ | Drives unimportant weights to **exactly zero** → automatic feature selection. |
| **L2, Ridge** (first described by \citeauthor{hoerl1970ridge} in \citeyear{hoerl1970ridge}) | $\lambda \displaystyle\sum_{j} w_j^{2}$ | Shrinks all weights toward zero → produces a **smoother** curve. |

The regularised losses therefore become:

$$
\mathcal{L}_{\text{L1}} = \text{MSE} + \lambda \sum_{j} |w_j|
\qquad\qquad
\mathcal{L}_{\text{L2}} = \text{MSE} + \lambda \sum_{j} w_j^{2}
$$

### Dropout

Introduced in \citeyear{srivastava2014dropout} by Nitish Srivastava et al. in \citetitle{srivastava2014dropout}, **Dropout** randomly zeroes out a fraction of the layer's inputs during each training step, forcing the network to learn redundant representations rather than relying on any single feature.

**Concrete example, 50 % Dropout:**

$$
\text{Original inputs} = \begin{pmatrix} 2.0 & 4.0 & 8.0 & 16.0 \end{pmatrix}
\;\;\xrightarrow{\text{50\% dropout}}\;\;
\begin{pmatrix} 2.0 & \mathbf{0} & \mathbf{0} & 16.0 \end{pmatrix}
$$

Because the model must learn the pattern with only *partial* information at every step, the resulting approximation is far more robust, and far less likely to "freak out" when it leaves the training window. The trade-off: dropout requires **more training data** and **longer training** to converge.

### Over- and Underfitting in LLMs & Modern AI

The curve's behaviour outside the blue box mirrors a core challenge of modern AI:

**Symptoms:**
* Within familiar patterns (*interpolation*), LLMs appear brilliant.
* On novel logic puzzles or niche topics (*extrapolation*), they *hallucinate*: much like the red line, they invent facts that fit the statistical pattern but have no basis in reality.
* The root cause is identical, the model has no concept of the underlying "periodicity" or universal truth; it only sees the local trend of its training window.

**Technical mitigation:**
* **Regularisation** (L1 / L2) penalises overly complex internal representations, keeping the model's "curve" smoother in uncharted territory.
* **Dropout** prevents co-adaptation of features, improving robustness to distribution shift.
* Together, they ensure the model does not "chase the noise" (high variance), which is precisely what makes high-degree polynomials, and over-parameterised neural networks, so erratic at the edges.

</div>
