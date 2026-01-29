<?php include_once("functions.php"); ?>

<div class="md">
Now, we'll try to let an AI learn a repeating pattern: $y = \sin(x)$. 
* **The Dotted Line** represents the "Universal Truth" (the full sine wave).
* **The Grey Box** is the "Training Window." The AI **only** sees the data points (dots) inside this box. Measures in real life always have some noise, so they this is added here to simulate this.
* **The Red Line** is the AI's attempt to reconstruct the entire universe based only on that small window.
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

* **L1 Regularization (Lasso\footcite{tibshirani1996lasso}):** Adds the absolute sum of the weights. This often forces the least important weights to exactly 0, effectively performing "feature selection."
    $$\text{Loss with L1} = \text{Loss} + \lambda \sum |w_j|$$
* **L2 Regularization (Ridge\footcite{hoerl1970ridge}):** Adds the sum of the squares of the weights. It forces weights to be small, creating a smooth "average" curve.
    $$\text{Loss with L2} = \text{Loss} + \lambda \sum w_j^2$$

### Dropout
Introduced in \citeyear{srivastava2014dropout} by Nitish Srivastava et. al.\footcite{srivastava2014dropout}, Dropout is a brute-force way to ensure the model doesn't become over-reliant on any single input value. During each training step, we randomly set a percentage of the inputs to **0**.

**Concrete Example:**
When you want to train a model, the values passed during training may look like this:
$$\text{Original Inputs} = \begin{pmatrix} 2.0 & 4.0 & 8.0 & 16.0 \end{pmatrix}$$

With a **50% Dropout**, the computer randomly strikes out half the values:
$$\text{Training Inputs} = \begin{pmatrix} 2.0 & \mathbf{0} & \mathbf{0} & 16.0 \end{pmatrix}$$

By zeroing out these values during training, the model is forced to learn the pattern using only "half the information" at any given time. This makes the resulting red line much more robust and less likely to freak out when it leaves the training window, but it requires more total training data.
</div>
