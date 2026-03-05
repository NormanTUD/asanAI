<?php include_once("functions.php"); ?>
<div class="md">
In machine learning, a model learns by adjusting its internal settings — called **Weights** and **Biases** — to minimize a **Loss Function**, which is a mathematical measure of how wrong the model's predictions are.

The interactive simulation below lets you experience this process firsthand. Think of the graph as a **landscape of errors**:

* **The Height (Y-axis):** Represents the **Loss** — the model's total error. Peaks are terrible performance; valleys are where the model makes the fewest mistakes.
* **The Position (X-axis):** Represents a single **Weight** or parameter of the model. Sliding left or right changes the model's behavior.
* **The Green Dot:** This is your model's current state. Your job is to guide it into the deepest valley — the **global minimum**.
* **The Red Path:** Shows the history of every step the optimizer has taken, so you can see its strategy unfold in real time.

### How Does an Optimizer Work?

At each step, the optimizer:
1. **Calculates the gradient** — the slope of the landscape at the current position. A steep downhill slope means "move this way, fast!" A flat area means "we might be close."
2. **Updates the position** — it takes a step in the direction that reduces the loss, scaled by the **learning rate**.

Different optimizers use different strategies for step 2:

* **SGD (\cite[Stochastic Gradient Descent]{sgd}):** The simplest strategy. It looks at the current slope and takes a proportional step downhill. It's reliable but can be slow on flat terrain, and it has no memory of previous steps — every decision is made in isolation.
* **\cite[Momentum]{momentum}:** Adds a "memory" of past gradients, like a heavy ball rolling downhill. If the ball has been rolling in one direction for a while, it builds up speed (velocity) and can power through small bumps and flat regions that would stall plain SGD.
* **\cite[Adam]{adam}:** The most sophisticated of the three. It tracks *two* running averages: the **mean of recent gradients** (like Momentum) and the **mean of recent squared gradients** (which measures how volatile the gradient has been). This lets it automatically tune the effective learning rate for each parameter — cautious where the landscape is noisy, aggressive where it's smooth. It's the industry standard for training modern neural networks.

> **💡 Try this:** Run SGD with a low learning rate (0.05) from x = −3.5. Watch it crawl. Then switch to Adam with the same settings and watch it accelerate through the flat region. That difference is why Adam dominates modern AI.

### Parameters You Can Control

| Parameter | What It Does | Too Low | Too High |
|---|---|---|---|
| **Learning Rate** | The size of each step. Controls how aggressively the optimizer moves. | Convergence is painfully slow; may stall. | The optimizer "overshoots" and bounces around the minimum, or even diverges. |
| **Epochs (Steps)** | How many update steps the optimizer is allowed to take. | May stop before reaching the minimum. | Wastes computation if the minimum was already found. |
| **Start Position** | Where on the x-axis the optimizer begins its journey. | — | — |

> **💡 Try this:** Set the learning rate to 0.5 with SGD and watch the optimizer overshoot wildly. Then lower it to 0.05 and see how it stabilizes but slows down. Finding the right learning rate is one of the most important skills in machine learning.
</div>

<div style="display: flex; flex-direction: column; gap: 20px; background: #f1f5f9; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1;">

    <!-- Info Banner for current optimizer -->
    <div id="opt-info-banner" style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 6px; font-size: 0.92em; line-height: 1.5;">
        <b>📘 SGD (Stochastic Gradient Descent):</b> The simplest optimizer. It computes the gradient at the current position and takes a fixed-size step downhill. No memory of past steps.
        <br><b>Update rule:</b> <code>x ← x − lr × gradient</code>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
            <label><b>Optimizer Strategy:</b></label>
            <select id="opt-type" class="btn" style="background: white; color: black; border: 1px solid #ccc; width: 100%; margin-bottom: 10px;">
                <option value="sgd">SGD (Stochastic Gradient Descent)</option>
                <option value="momentum">SGD + Momentum</option>
                <option value="adam">Adam (Adaptive Moment Estimation)</option>
            </select>

            <label><b>Learning Rate:</b></label>
            <input type="range" id="opt-lr" min="0.01" max="0.5" step="0.01" value="0.1" style="width: 100%;">
            <span id="opt-lr-val" style="font-family: monospace;">LR = 0.1</span>

            <div id="opt-lr-warning" style="display: none; color: #dc2626; font-size: 0.85em; margin-top: 4px;">
                ⚠️ Very high learning rate — the optimizer may overshoot or diverge!
            </div>
        </div>

        <div>
            <label><b>Start Position (x):</b></label>
            <input type="range" id="opt-start-x" min="-4" max="4" step="0.1" value="-3.5" style="width: 100%; margin-bottom: 4px;">
            <span id="opt-start-val" style="font-family: monospace; font-size: 0.9em;">x₀ = -3.5</span>

            <label style="margin-top: 8px; display: block;"><b>Steps (Epochs):</b></label>
            <input type="number" id="opt-epochs" value="50" min="1" max="500" class="btn" style="background: white; color: black; border: 1px solid #ccc; width: 100%;">

            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button id="btn-run-opt" class="btn btn-train" style="flex: 2;" onclick="toggleOptimizer()">
                    ▶ Start Simulation
                </button>
                <button id="btn-restart-opt" class="btn" style="flex: 1; display: none; background: #94a3b8; color: white;" onclick="resetOptimizer()">
                    ↺ Restart
                </button>
            </div>
        </div>
    </div>

    <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 0;">

    <!-- Live Stats Dashboard -->
    <div id="opt-stats" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center;">
        <div style="background: white; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.78em; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Current x</div>
            <div id="stat-x" style="font-size: 1.3em; font-weight: bold; font-family: monospace; color: #0f172a;">-3.500</div>
        </div>
        <div style="background: white; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.78em; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Current Loss</div>
            <div id="stat-loss" style="font-size: 1.3em; font-weight: bold; font-family: monospace; color: #0f172a;">—</div>
        </div>
        <div style="background: white; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.78em; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Gradient</div>
            <div id="stat-grad" style="font-size: 1.3em; font-weight: bold; font-family: monospace; color: #0f172a;">—</div>
        </div>
        <div style="background: white; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.78em; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Steps Taken</div>
            <div id="stat-steps" style="font-size: 1.3em; font-weight: bold; font-family: monospace; color: #0f172a;">0</div>
        </div>
    </div>

    <div style="position: relative;">
        <div id="plot-optimizer" style="height: 420px; background: white; border-radius: 8px;"></div>
        <div id="opt-console" class="status-console" style="height: 120px; margin-top: 10px; font-family: monospace; font-size: 0.88em;">Adjust the parameters above and click <b>'Start Simulation'</b> to begin.</div>
    </div>
</div>

<div class="md">
### What's Happening Under the Hood?

Each optimizer uses a different **update rule** to decide how to change the weight at each step. Here's the math:

#### SGD (Stochastic Gradient Descent)
The simplest rule. Compute the gradient $g_t$ and step in the opposite direction:
$$x_{t+1} = x_t - \eta \cdot g_t$$
where $\eta$ is the learning rate. That's it — no memory, no adaptation.

#### SGD with Momentum
Momentum introduces a **velocity** term $v_t$ that accumulates past gradients, smoothing out noisy updates:
$$v_t = \beta \cdot v_{t-1} + (1 - \beta) \cdot g_t$$
$$x_{t+1} = x_t - \eta \cdot v_t$$
The hyperparameter $\beta$ (typically 0.9) controls how much "inertia" the optimizer has. A higher $\beta$ means the optimizer remembers more of its past trajectory and is harder to deflect.

#### Adam (Adaptive Moment Estimation)
Adam tracks *two* exponential moving averages — the **first moment** $m_t$ (mean of gradients) and the **second moment** $v_t$ (mean of squared gradients):
$$m_t = \beta_1 m_{t-1} + (1 - \beta_1) g_t$$
$$v_t = \beta_2 v_{t-1} + (1 - \beta_2) g_t^2$$

Because these are initialized at zero, they are **bias-corrected**:
$$\hat{m}_t = \frac{m_t}{1 - \beta_1^t}, \quad \hat{v}_t = \frac{v_t}{1 - \beta_2^t}$$

The final update divides the corrected first moment by the square root of the corrected second moment:
$$x_{t+1} = x_t - \eta \cdot \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon}$$

This division is the key insight: parameters with large, consistent gradients get *smaller* effective steps (because $\sqrt{\hat{v}_t}$ is large), while parameters with small or rare gradients get *larger* effective steps. The optimizer automatically adapts.

---

### History of Optimizers

In \citeyear{sgd}, **Herbert Robbins** and **Sutton Monro** published their paper "\citetitle{sgd}", introducing the **Robbins-Monro Process**. This was the first formalization of **Stochastic Approximation**, which allows finding roots or optima using noisy samples.

The modern **SGD** update rule is a direct application of their iterative formula:

$$x_{n+1} = x_n + a_n(\alpha - y_n)$$

While Robbins and Monro added the "Stochastic" element, the core concept of **Gradient Descent** was introduced over a century earlier by \citeauthor{cauchy1847} in \citeyear{cauchy1847}. He used it to solve non-linear equations in astronomy.

### The Bridge to Modern AI: Backpropagation

While Cauchy provided the "map" for downhill movement, the challenge for AI was applying this to complex, multi-layered networks. This required a way to distribute the blame for an error across millions of internal "neurons."

* **\citeauthor{werbos1974} (\citeyear{werbos1974}):** In his PhD thesis, *Beyond Regression*, Werbos first described the process of "Backpropagation." He found a way to calculate how much each weight in a system contributes to the final error by working backward from the output. It was a revolutionary bridge between classical calculus and automated learning.
* **Rumelhart, Hinton, & Williams (\citeyear{rumelhart1986}):** Despite Werbos's discovery, the technique remained obscure until the mid-80s. David Rumelhart, Geoffrey Hinton, and Ronald Williams published a landmark paper in *Nature* showing that backpropagation could allow neural networks to learn internal representations of data. This proved that "Deep Learning" wasn't just a dream, but a mathematically solvable problem.

### Why Adam Dominates

To understand *why* Adam has become the industry standard, consider its key difference from SGD. SGD applies a single, global learning rate to every parameter in the model, whether that parameter is updated thousands of times per batch or only once in a blue moon. Adam, short for **Adaptive Moment Estimation**, maintains a *per-parameter* running estimate of both the **first moment** (the mean of gradients) and the **second moment** (the mean of squared gradients).

This means parameters that receive sparse, infrequent gradient signals — like the embeddings for rare words — automatically get larger effective learning rates, because their second moment estimate stays small. Conversely, parameters that are updated densely and frequently get smaller effective steps, preventing them from overshooting. In essence, Adam doesn't just navigate the loss landscape — it *reshapes* the landscape to appear more uniform for each parameter independently.

This is especially critical in NLP, where token frequencies follow a **\cite[Zipf distribution]{zipf1949human}**: a few words like "the" appear constantly, while most words are rare. Without Adam, rare tokens would be starved of meaningful updates, and common tokens would dominate the optimization. Adam's per-parameter adaptivity elegantly solves this imbalance, which is a major reason it is the default optimizer for training modern large language models.

### Common Pitfalls & Practical Tips

| Problem | Symptom | Solution |
|---|---|---|
| **Learning rate too high** | Loss oscillates wildly or explodes to infinity | Reduce LR by a factor of 10; use a learning rate scheduler |
| **Learning rate too low** | Loss decreases painfully slowly; training takes forever | Increase LR; consider warmup schedules |
| **Stuck in local minimum** | Loss plateaus at a suboptimal value | Try Momentum or Adam; increase LR temporarily; restart from a different position |
| **Overfitting** | Training loss is low but validation loss rises | Add regularization (dropout, weight decay); reduce model size; get more data |

> **💡 Experiment:** Try starting from x = 3.5 with SGD at LR = 0.05 and watch it descend into the right side of the valley. Then restart from x = −3.5 — does it find the same minimum? This illustrates how **initialization** affects the final result.
</div>
