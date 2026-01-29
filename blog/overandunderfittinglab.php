<?php include_once("functions.php"); ?>

<div class="md">
In this interactive lab, we are tasking an Artificial Intelligence (a neural network) with a seemingly simple challenge: **"Learn the pattern of a wave."** By adjusting the settings, you can witness firsthand why AI models sometimes "hallucinate" or fail when they encounter something new.

## What You’re Seeing
* **The Dotted Line (Universal Truth):** This is a perfect sine wave ($y = \sin(x)$). It represents the true underlying pattern of the universe that we want our AI to understand.
* **The Grey Box (The Training Window):** This represents the "known world." In reality, we never have all the data. We only have a small sample.
* **The Black Dots (Noisy Observations):** These are the specific data points the AI is allowed to "see." Notice they don't sit perfectly on the line; they include **Noise** to simulate real-world measurement errors.
* **The Red Line (The AI’s Guess):** This is the model's current theory. It tries to draw a line that passes as close to the black dots as possible.

## The Math: How the Model "Thinks"

The AI in this lab uses a **Polynomial Regression** model. Instead of "knowing" it's a sine wave, it tries to build an equation by adding together different powers of $x$.

### The General Formula
The AI builds a function $f(x)$ that looks like this:

$$f(x) = w_n x^n + w_{n-1} x^{n-1} + \dots + w_1 x^1 + b$$

Where:
* **$n$ (Polynomial Degree):** This is the "Complexity" slider.
    * A **Degree 1** model is just a straight line ($w_1 x + b$).
    * A **Degree 10** model is a complex curve that can bend up to 9 times.
* **$w$ (Weights):** These are the coefficients the AI adjusts during training to change the shape of the curve.
* **$b$ (Bias):** A constant value that allows the AI to move the entire curve up or down.

### The "Loss" (MSE)
The **MSE Loss** (Mean Squared Error) is the AI's "stress level." It calculates the average squared distance between the Red Line and the Black Dots:

$$\text{MSE} = \frac{1}{n} \sum_{i=1}^{n} (y_\text{observed} - y_\text{predicted})^2$$

* **Low Loss:** The AI is happy; it has successfully "memorized" the dots.
* **High Loss:** The AI is still confused and hasn't found a curve that fits the data yet.

## Try This Experiment:
1.  **Underfitting:** Set the **Degree** to **1** or **2**. Notice that even after training, the red line is too "stiff" to follow the wave. This is **High Bias**.
2.  **Overfitting:** Set the **Degree** to **15** and **Noise** to **0.5**. Start training. The AI will eventually "wiggle" the red line frantically to touch every single random dot.
3.  **The Extrapolation Trap:** Look at what happens to the Red Line **outside** the Grey Box. Even if it looks perfect inside the box, it usually shoots off toward infinity outside of it. This shows that the AI has "memorized" the local area but doesn't actually understand the "global" pattern of the wave.
</div>

<div class="lab-controls" style="background: #f8fafc; padding: 25px; border-radius: 15px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
        <div>
            <label><strong>Polynomial Degree:</strong> <span id="label-degree" style="font-weight:bold; color:#ef4444;">4</span></label>
            <input type="range" id="slider-degree" min="1" max="20" step="1" value="4" style="width: 100%; margin: 15px 0;">
            
            <label><strong>Point Noise:</strong> <span id="label-noise">0.1</span></label>
            <input type="range" id="slider-noise" min="0" max="0.5" step="0.05" value="0.1" style="width: 100%;">
        </div>
        <div style="background: #fff; padding: 15px; border-radius: 10px; border: 1px solid #cbd5e0; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-family: monospace; font-size: 0.9rem; margin-bottom: 10px;">
                MSE Loss: <span id="loss-train">0.0000</span>
            </div>
            <button id="btn-toggle-train" style="width:100%; background: #22c55e; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1rem;">
                🚀 Start Training
            </button>
        </div>
    </div>
</div>

<div id="equation-monitor">
    $$\dots$$
</div>

<div id="fitting-plot" style="width:100%; height:600px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;"></div>

<div class="md" style="margin-top: 40px; line-height: 1.6;">
## Understanding the Results

### The Extrapolation Failure
Note how the **Red Line** behaves outside the **Grey Training Zone**.
* **The AI's Logic:** "I found a polynomial that perfectly matches the dots I was given."
* **The Reality:** The AI has no concept of "periodicity" (the wave repeating). It assumes the trend continues as a polynomial, which always leads to $\pm\infty$ as $x$ increases.
* **Lesson:** Machine Learning models are often "interpolators" (good at guessing between known points) but terrible "extrapolators" (guessing outside the range of training data).

### Underfitting vs. Overfitting

* **Low Degree (1-3):** The model is too "stiff." It can't bend enough to follow the sine wave even inside the box. This is **High Bias**.
* **High Degree (10+):** The model is too "wiggly." It starts chasing the **Noise** (the random scattering of dots) rather than the underlying sine wave. This is **High Variance**.

### Runge's Phenomenon
When you use high-degree polynomials to fit data, you often see wild oscillations at the edges of the training interval. This is known as **<a target="_blank" href="https://en.wikipedia.org/wiki/Runge%27s_phenomenon">Runge's Phenomenon</a>**. Even if the fit is perfect in the middle, the "tails" of the equation will whip around violently, making the model useless for prediction.


### Over- and underfitting in LLMs and AI Models

The curve's behavior outside the grey box mirrors a core challenge of modern AI:

#### **How it manifests (Symptoms):**

* LLMs often exhibit "confident failure." Within familiar patterns (interpolation), they appear brilliant.
* In novel logic puzzles or niche topics (extrapolation), they "hallucinate": much like the red line in the lab, they invent facts that fit the statistical pattern but lack any basis in reality.
* This happens because the AI has no concept of the underlying "periodicity" or universal truth; it only sees the trend of its training window.

#### **Technical Mitigation:**

* To prevent this "wild swinging" (Overfitting or Runge’s Phenomenon), developers use **Regularization** and **Dropout**.
* These methods penalize overly complex "wiggles" or "tails," forcing the model to keep the curve smoother and more stable even in uncharted territory.
* This ensures the model doesn't start "chasing the noise" (High Variance), which is what makes high-degree polynomials so erratic at the edges.

## Taming the "Wiggle": Regularization and Dropout

To prevent a model from "chasing the noise" or exhibiting Runge's Phenomenon, developers use mathematical constraints to ensure the model prioritizes simplicity over perfect memorization.

### L1 and L2 Regularization (Weight Penalties)
In your lab, the model tries to find a weight vector $\mathbf{w}$ that minimizes the loss. Without constraints, these weights can explode to huge values to force the curve through every noisy dot. Regularization adds a "tax" on the size of these weights.

* **L1 Regularization (Lasso, first described by \citeauthor{tibshirani1996lasso} in \citeyear{tibshirani1996lasso}):** Adds the absolute sum of the weights. This often forces the least important weights to exactly 0, effectively performing "feature selection."
    $$\text{Loss with L1} = \text{Loss} + \lambda \sum |w_j|$$
* **L2 Regularization (Ridge, first described by \citeauthor{hoerl1970ridge} in \citeyear{hoerl1970ridge}):** Adds the sum of the squares of the weights. It forces weights to be small, creating a smooth "average" curve.
    $$\text{Loss with L2} = \text{Loss} + \lambda \sum w_j^2$$

### Dropout
Introduced in \citeyear{srivastava2014dropout} by Nitish Srivastava et al. in \citetitle{srivastava2014dropout}, Dropout is a brute-force way to ensure the model doesn't become over-reliant on any single input value. During each training step, we randomly set a percentage of the inputs to **0**.

**Concrete Example:**
When you want to train a model, the values passed during training may look like this:
$$\text{Original Inputs} = \begin{pmatrix} 2.0 & 4.0 & 8.0 & 16.0 \end{pmatrix}$$

With a **50% Dropout**, the computer randomly strikes out half the values:
$$\text{Training Inputs} = \begin{pmatrix} 2.0 & \mathbf{0} & \mathbf{0} & 16.0 \end{pmatrix}$$

By zeroing out these values during training, the model is forced to learn the pattern using only "half the information" at any given time. This makes the approximation much more robust and less likely to freak out when it leaves the training window, but it requires more total training data.
</div>
