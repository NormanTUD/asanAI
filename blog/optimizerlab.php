<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Optimizer: Navigating the Loss Landscape
description: Navigating the loss landscape, SGD, Momentum, and Adam compared interactively.
icon: &#127757;
part: 2
order: 7
color: coral
topics: training, math-i, math-ii, programming
tags: math-heavy, code-heavy
math: 65
-->
<div class="md">
In machine learning, a model learns by adjusting its internal settings, called **Weights** and **Biases**, to minimize a **Loss Function**, which is a mathematical measure of how wrong the model's predictions are.

The interactive simulation below lets you experience this process firsthand. Think of the graph as a **landscape of errors**:

* **The Height (Y-axis):** Represents the **Loss**, the model's total error. Peaks are terrible performance; valleys are where the model makes the fewest mistakes.
* **The Position (X-axis):** Represents a single **Weight** or parameter of the model. Sliding left or right changes the model's behavior.
* **The Green Dot:** This is your model's current state. Your job is to guide it into the deepest valley, the **global minimum**.
* **The Red Path:** Shows the history of every step the optimizer has taken, so you can see its strategy unfold in real time.

## How Does an Optimizer Work?

At each step, the optimizer:
1. **Calculates the gradient**, the slope of the landscape at the current position. A steep downhill slope means “move this way, fast!” A flat area means “we might be close.”
2. **Updates the position**, it takes a step in the direction that reduces the loss, scaled by the **learning rate**.

Different optimizers use different strategies for step 2:

* **SGD (\cite[Stochastic Gradient Descent]{sgd}):** The simplest strategy. It looks at the current slope and takes a proportional step downhill. It's reliable but can be slow on flat terrain, and it has no memory of previous steps, every decision is made in isolation.
* **\cite[Momentum]{momentum}:** Adds a “memory” of past gradients, like a heavy ball rolling downhill. If the ball has been rolling in one direction for a while, it builds up speed (velocity) and can power through small bumps and flat regions that would stall plain SGD.
* **\cite[Adam]{adam}:** The most sophisticated of the three. It tracks *two* running averages: the **mean of recent gradients** (like Momentum) and the **mean of recent squared gradients** (which measures how volatile the gradient has been). This lets it automatically tune the effective learning rate for each parameter, cautious where the landscape is noisy, aggressive where it's smooth. It's the industry standard for training modern neural networks.

The three optimizers above are only a sample. \citeauthor{ruder2016overview}'s overview article (\citeyear{ruder2016overview}) surveys the full family in active use — Batch, SGD, Mini-batch, Momentum, Nesterov accelerated gradient, Adagrad, Adadelta, RMSprop, Adam, AdaMax, Nadam, and AMSGrad — with derivations and the practitioner choices between them. Almost a decade on, it remains the most-cited practitioner-facing reference for the optimizer zoo.

**💡 Try this:** Run SGD with a low learning rate (0.05) from x = −3.5. Watch it crawl. Then switch to Adam with the same settings and watch it accelerate through the flat region. That difference is why Adam dominates modern AI.

### Parameters You Can Control

| Parameter | What It Does | Too Low | Too High |
|---|---|---|---|
| **Learning Rate** | The size of each step. Controls how aggressively the optimizer moves. | Convergence is painfully slow; may stall. | The optimizer “overshoots” and bounces around the minimum, or even diverges. |
| **Epochs (Steps)** | How many update steps the optimizer is allowed to take. | May stop before reaching the minimum. | Wastes computation if the minimum was already found. |
| **Start Position** | Where on the x-axis the optimizer begins its journey. | — |, |
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
            <select id="opt-type" class="btn" style="border: 1px solid #ccc; width: 100%; margin-bottom: 10px;">
                <option value="sgd">SGD (Stochastic Gradient Descent)</option>
                <option value="momentum">SGD + Momentum</option>
                <option value="adam">Adam (Adaptive Moment Estimation)</option>
            </select>

            <label><b>Learning Rate:</b></label>
            <input type="range" id="opt-lr" min="0.01" max="0.5" step="0.01" value="0.1" style="width: 100%;">
            <span id="opt-lr-val" style="font-family: monospace;">LR = 0.1</span>

            <div id="opt-lr-warning" style="display: none; color: #dc2626; font-size: 0.85em; margin-top: 4px;">
                ⚠️ Very high learning rate, the optimizer may overshoot or diverge!
            </div>
        </div>

        <div>
            <label><b>Start Position (x):</b></label>
            <input type="range" id="opt-start-x" min="-4" max="4" step="0.1" value="-3.5" style="width: 100%; margin-bottom: 4px;">
            <span id="opt-start-val" style="font-family: monospace; font-size: 0.9em;">x₀ = -3.5</span>

            <label style="margin-top: 8px; display: block;"><b>Steps (Epochs):</b></label>
            <input type="number" id="opt-epochs" value="50" min="1" max="500" class="btn" style="border: 1px solid #ccc; width: 100%;">

		<div style="display: flex; gap: 10px; margin-top: 15px;">
		    <button id="btn-run-opt" class="btn btn-train" style="flex: 2;" onclick="toggleOptimizer()">
			▶ Start Simulation
		    </button>
		    <button id="btn-restart-opt" class="btn" style="flex: 1; visibility: hidden; background: #94a3b8; color: white;" onclick="resetOptimizer()">
			↺ Restart
		    </button>
		</div>

        </div>
    </div>

    <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 0;">

    <!-- Live Stats Dashboard -->
    <div id="opt-stats" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center;">
        <div style="background: var(--mn-surface, white); padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.78em; color: var(--mn-text-secondary, #64748b); text-transform: uppercase; letter-spacing: 0.05em;">Current x</div>
            <div id="stat-x" style="font-size: 1.3em; font-weight: bold; font-family: monospace; color: var(--mn-heading, #0f172a);">-3.500</div>
        </div>
        <div style="background: var(--mn-surface, white); padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.78em; color: var(--mn-text-secondary, #64748b); text-transform: uppercase; letter-spacing: 0.05em;">Current Loss</div>
            <div id="stat-loss" style="font-size: 1.3em; font-weight: bold; font-family: monospace; color: var(--mn-heading, #0f172a);">—</div>
        </div>
        <div style="background: var(--mn-surface, white); padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.78em; color: var(--mn-text-secondary, #64748b); text-transform: uppercase; letter-spacing: 0.05em;">Gradient</div>
            <div id="stat-grad" style="font-size: 1.3em; font-weight: bold; font-family: monospace; color: var(--mn-heading, #0f172a);">—</div>
        </div>
        <div style="background: var(--mn-surface, white); padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.78em; color: var(--mn-text-secondary, #64748b); text-transform: uppercase; letter-spacing: 0.05em;">Steps Taken</div>
            <div id="stat-steps" style="font-size: 1.3em; font-weight: bold; font-family: monospace; color: var(--mn-heading, #0f172a);">0</div>
        </div>
    </div>

    <div style="position: relative;">
        <div id="plot-optimizer" data-plot-theme="self" style="height: 420px; background: var(--mn-surface, white); border-radius: 8px;"></div>
        <div id="opt-console" class="status-console" style="height: 120px; margin-top: 10px; font-family: monospace; font-size: 0.88em;">Adjust the parameters above and click <b>'Start Simulation'</b> to begin.</div>
    </div>
</div>

<div class="md" data-mathlevel="65" data-optionaltitle="What's Happening Under the Hood?">
### What's Happening Under the Hood?

Each optimizer uses a different **update rule** to decide how to change the weight at each step. Here's the math:

#### SGD (Stochastic Gradient Descent)
The simplest rule. Compute the gradient $g_t$ and step in the opposite direction:
$$x_{t+1} = x_t - \eta \cdot g_t$$
where $\eta$ is the learning rate (written `lr` in the interactive demo above). That's it, no memory, no adaptation.

#### SGD with Momentum
Momentum introduces a **velocity** term $v_t$ that accumulates past gradients, smoothing out noisy updates:
$$v_t = \beta \cdot v_{t-1} + (1 - \beta) \cdot g_t$$
$$x_{t+1} = x_t - \eta \cdot v_t$$
The hyperparameter $\beta$ (typically 0.9) controls how much “inertia” the optimizer has. A higher $\beta$ means the optimizer remembers more of its past trajectory and is harder to deflect.

#### Adam (Adaptive Moment Estimation)
Adam tracks *two* exponential moving averages, the **first moment** $m_t$ (mean of gradients) and the **second moment** $v_t$ (mean of squared gradients):
$$m_t = \beta_1 m_{t-1} + (1 - \beta_1) g_t$$
$$v_t = \beta_2 v_{t-1} + (1 - \beta_2) g_t^2$$

Because these are initialized at zero, they are **bias-corrected**:
$$\hat{m}_t = \frac{m_t}{1 - \beta_1^t}, \quad \hat{v}_t = \frac{v_t}{1 - \beta_2^t}$$

The final update divides the corrected first moment by the square root of the corrected second moment:
$$x_{t+1} = x_t - \eta \cdot \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon}$$

This division is the key insight: parameters with large, consistent gradients get *smaller* effective steps (because $\sqrt{\hat{v}_t}$ is large), while parameters with small or rare gradients get *larger* effective steps. The optimizer automatically adapts.

</div>

<div class="md" data-mathlevel="70" data-optionaltitle="The Rest of the Optimizer Family">

### The Rest of the Optimizer Family

SGD, Momentum, and Adam are the headliners, but the zoo is bigger. Each of the optimizers below was invented to fix a specific failure of the previous one. Reading them in order is reading the most productive argument in modern optimization.

#### Nesterov Accelerated Gradient (NAG)

Plain momentum is a heavy ball rolling downhill: it builds up speed from past gradients, which is great, until it overshoots a valley. The ball doesn't know to slow down before the slope reverses.

Nesterov's fix is small but clever: instead of measuring the slope *where you are*, measure it *where you're about to be*. You take the momentum step first (a guess about your future position), then correct based on the gradient there:

$$v_t = \beta \cdot v_{t-1} + \eta \cdot \nabla_\theta J\!\left(\theta - \beta v_{t-1}\right)$$
$$\theta := \theta - v_t$$

Compare this with plain momentum — the only difference is that the gradient is now evaluated at $\theta - \beta v_{t-1}$ instead of at $\theta$. It's a one-line change, but the ball is now noticeably more responsive: it slows down when it sees the slope curving up ahead, instead of running off the cliff and catching itself on the rebound. \citeauthor{nesterov2004introductory} (\citeyear{nesterov2004introductory}) wrote down the modern form; in practice NAG typically shaves a few percent off training time on RNNs and other models with strong gradient curvature (\cite[Ruder, 2016]{ruder2016overview}).

#### Adagrad — The Per-Parameter GPS

SGD uses one global learning rate for every parameter. But the world isn't uniform. In a language model, the embedding for "the" gets a gradient signal on almost every batch; the embedding for "quokka" gets one gradient per million tokens. Treating them the same is wasteful: "the" gets over-updated and "quokka" gets starved.

In \citeyear{duchi2011adagrad}, \citeauthor{duchi2011adagrad} introduced a simple idea: each parameter gets its own learning rate, scaled by how much it has been updated so far. Let $G_{t,ii}$ be the sum of squared gradients for parameter $i$ up to step $t$. Then:

$$\theta_{t+1,i} = \theta_{t,i} - \frac{\eta}{\sqrt{G_{t,ii}} + \epsilon}\, g_{t,i}$$

Parameters that have received large or frequent gradients get *smaller* effective steps (the denominator is large); parameters that have received small or rare gradients get *larger* effective steps. The $\epsilon$ (usually $10^{-8}$) is just a guard against dividing by zero on the very first step. Think of it as a per-parameter GPS that slows down for crowded streets and speeds up on empty roads. This was the optimizer Google used in 2012 to find cats in raw YouTube frames — the first large-scale demonstration that unsupervised feature learning actually works at scale.

#### Adadelta and RMSprop — Stop the Shrink

Adagrad has a quiet flaw. Because $G_t$ only ever grows (every squared gradient is positive and gets added forever), the denominator $\sqrt{G_{t,ii}}$ grows without bound. Eventually the effective learning rate shrinks to near zero, and the optimizer stops learning. Adagrad is great early in training and dies slowly of starvation.

**RMSprop** (\citeauthor{hinton2012rmsprop}'s \citeyear{hinton2012rmsprop} Coursera lecture) and **Adadelta** (\citealternativetitle{zeiler2012adadelta}) fix this the same way: replace the *sum* of past squared gradients with an *exponentially decaying average*. The sum has infinite memory; the EMA has finite memory, so old gradients fade.

$$E[g^2]_t = \gamma \cdot E[g^2]_{t-1} + (1 - \gamma) \cdot g_t^2$$

with $\gamma \approx 0.9$. This is exactly the "second moment" $v_t$ that Adam will reuse later. The update then looks just like Adagrad's, with the EMA replacing the sum:

$$\theta_{t+1} = \theta_t - \frac{\eta}{\sqrt{E[g^2]_t} + \epsilon}\, g_t$$

RMSprop and Adadelta were developed independently around the same time and are nearly identical — RMSprop is exactly the first update rule of Adadelta, with $\gamma = 0.9$ and $\eta = 0.001$ as the suggested defaults. Adadelta goes one step further: Zeiler noticed that the *units* of this update don't match the units of $\theta$ (we're multiplying a unitless gradient by a learning rate, which has units of $\theta$). He fixes this by replacing $\eta$ with the RMS of past parameter updates, $\mathrm{RMS}[\Delta\theta]_{t-1}$, so the update has the right units. The practical upshot: Adadelta doesn't need a learning-rate hyperparameter at all.

#### AdaMax — A More Stable Denominator

Adam uses $\sqrt{v_t}$ in the denominator, where $v_t$ is an EMA of squared gradients. But there's nothing sacred about the choice of "squared". You could write the EMA as an $\ell_p$ norm: $v_t = \beta_2 v_{t-1} + (1 - \beta_2)\, |g_t|^p$, and Adam picks $p = 2$.

What happens if you pick $p = \infty$? Then $v_t$ converges to $\max(\beta_2 v_{t-1}, |g_t|)$ — the running *maximum* of past gradient magnitudes, not their mean square. That's **AdaMax**, also from \citeauthor{adam} (\citeyear{adam}):

$$\theta_{t+1} = \theta_t - \frac{\eta}{u_t}\, \hat{m}_t \quad\text{with}\quad u_t = \max(\beta_2 u_{t-1}, |g_t|)$$

Because $u_t$ is a max rather than an average, it doesn't suffer from the zero-bias that $m_t$ and $v_t$ do, so we skip the bias correction. In practice AdaMax is more numerically stable than Adam when gradients have very large outliers — it never lets the denominator get close to zero.

#### Nadam — Adam, but Look Ahead

Nadam is what you get when you apply the Nesterov trick to Adam. The fix from \citeauthor{dozat2016nadam} (\citeyear{dozat2016nadam}) is one line: replace the previous momentum vector $\hat{m}_{t-1}$ in the Adam update with the *current* one $\hat{m}_t$:

$$\theta_{t+1} = \theta_t - \frac{\eta}{\sqrt{\hat{v}_t} + \epsilon}\!\left( \beta_1 \hat{m}_t + \frac{(1 - \beta_1)\, g_t}{1 - \beta_1^t} \right)$$

It's a one-line modification, but it makes Adam's momentum term "look ahead" the same way Nesterov does, which tends to give modestly faster convergence on tasks with strong gradient curvature.

#### AMSGrad — Fixing a Convergence Flaw

Adam isn't always the best. Practitioners noticed that on some tasks — especially object recognition and machine translation — Adam sometimes fails to converge to a minimum as good as SGD-with-momentum's. The cause was pinned down by \citeauthor{reddi2018amsgrad} (\citeyear{reddi2018amsgrad}): the EMA of squared gradients can *forget* large but rare gradients that would have been informative.

Their fix: instead of using the EMA directly, use the **running maximum** of past $v_t$ values:

$$\hat{v}_t = \max(\hat{v}_{t-1}, v_t)$$

This guarantees a non-increasing effective step size, which restores the convergence guarantees that Adam lacks. In practice AMSGrad sometimes matches Adam, sometimes loses to it; the empirical comparison was messier than the theory suggested, and most practitioners stuck with Adam.

#### AdamW — Fixing the Weight Decay Bug

Adam has a quiet problem with weight decay. In the original paper, $L_2$ regularization is added to the *loss*, which means it shows up inside the gradient $g_t$, which means the EMA in $v_t$ averages it in. The result: the regularization effect depends on the magnitude of recent gradients — exactly the wrong behavior. You want weight-decay strength to be a fixed hyperparameter, not coupled to the optimizer's running statistics.

\citetitle{loshchilov2019adamw} (\citealternativetitle{loshchilov2019adamw}) decouples them. Weight decay is applied *directly* to the weights, not through the gradient:

$$\theta_{t+1} = \theta_t - \eta\!\left( \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon} + \lambda\, \theta_t \right)$$

It's a one-line change, but it makes weight decay behave the way every other optimizer's weight decay does, and it decouples the optimal $\lambda$ from the learning rate. **AdamW is now the default optimizer for training transformers** in practice — every modern recipe for GPT, BERT, Llama, or Stable Diffusion uses AdamW, not Adam.

#### When Adam Doesn't Win

The cleanest family tree above doesn't mean Adam (or AdamW) is always the right choice. \citeauthor{ruder2016overview}'s survey (\citeyear{ruder2016overview}) already noted the wrinkle: for convolutional networks on ImageNet, SGD with momentum and a careful learning-rate schedule often matches or beats Adam. The intuition is sharp — SGD's noisier updates act as an implicit regularizer (they keep the ball bouncing, which helps it escape sharp minima), and a cosine or step-decay schedule gives the optimizer more chances to settle into a flat basin over time.

The pragmatic rule of thumb: **start with AdamW**. If you have the compute for a careful learning-rate sweep and you need every last fraction of a percent of accuracy, try SGD-with-momentum with a cosine schedule. For transformers and large language models specifically, AdamW dominates, because the per-parameter adaptivity genuinely matters when individual weights (especially in token embeddings) see wildly different gradient magnitudes. Don't reach for anything else unless you have a specific reason to.

</div>

<div class="md" data-mathlevel="55" data-optionaltitle="History of Optimizers">
### History of Optimizers

In \citeyear{sgd}, **Herbert Robbins** and **Sutton Monro** published their paper “\citetitle{sgd}”, introducing the **Robbins-Monro Process**. This was the first formalization of **Stochastic Approximation**, which allows finding roots or optima using noisy samples.

The modern **SGD** update rule is a direct application of their iterative formula:

$$x_{n+1} = x_n + a_n(\alpha - y_n)$$

where $a_n$ is the step size (the historical ancestor of today's learning rate $\eta$) and $\alpha$ is the target value being estimated from noisy observations $y_n$. While Robbins and Monro added the “Stochastic” element, the core concept of **Gradient Descent** was introduced over a century earlier by \citeauthor{cauchy1847} in \citeyear{cauchy1847}. He used it to solve systems of non-linear equations.

</div>

<div class="md">
### The Bridge to Modern AI: Backpropagation

While Cauchy provided the “map” for downhill movement, the challenge for AI was applying this to complex, multi-layered networks. This required a way to distribute the blame for an error across millions of internal “neurons.”

* **\citeauthor{werbos1974} (\citeyear{werbos1974}):** In his PhD thesis, *Beyond Regression*, Werbos first described the process of “Backpropagation.” He found a way to calculate how much each weight in a system contributes to the final error by working backward from the output. It was a revolutionary bridge between classical calculus and automated learning.
* **Rumelhart, Hinton, & Williams (\citeyear{rumelhart1986}):** Despite Werbos's discovery, the technique remained obscure until the mid-80s. David Rumelhart, Geoffrey Hinton, and Ronald Williams published a landmark paper in *Nature* showing that backpropagation could allow neural networks to learn internal representations of data. This proved that “Deep Learning” wasn't just a dream, but a mathematically solvable problem.

### Why Adam Dominates

To understand *why* Adam has become the industry standard, consider its key difference from SGD. SGD applies a single, global learning rate to every parameter in the model, whether that parameter is updated thousands of times per batch or only once in a blue moon. Adam, short for **Adaptive Moment Estimation**, maintains a *per-parameter* running estimate of both the **first moment** (the mean of gradients) and the **second moment** (the mean of squared gradients).

This means parameters that receive sparse, infrequent gradient signals, like the embeddings for rare words, automatically get larger effective learning rates, because their second moment estimate stays small. Conversely, parameters that are updated densely and frequently get smaller effective steps, preventing them from overshooting. In essence, Adam doesn't just navigate the loss landscape, it *reshapes* the landscape to appear more uniform for each parameter independently.

This is especially critical in NLP, where token frequencies follow a **\cite[Zipf distribution]{zipf1949human}**: a few words like “the” appear constantly, while most words are rare. Without Adam, rare tokens would be starved of meaningful updates, and common tokens would dominate the optimization. Adam's per-parameter adaptivity elegantly solves this imbalance, which is a major reason it is the default optimizer for training modern large language models.

The lineage that leads here is the cleanest story in the optimizer zoo. Adagrad introduced per-parameter learning rates; Adadelta and RMSprop fixed Adagrad's flaw that the accumulated denominator shrank the effective step toward zero; Adam added a bias-corrected first moment (essentially momentum with a different normalization) on top. \citeauthor{ruder2016overview} (\citeyear{ruder2016overview}) walks through each derivation, and that genealogy is the one this lesson has been climbing toward.

### Common Pitfalls & Practical Tips

| Problem | Symptom | Solution |
|---|---|---|
| **Learning rate too high** | Loss oscillates wildly or explodes to infinity | Reduce LR by a factor of 10; use a learning rate scheduler |
| **Learning rate too low** | Loss decreases painfully slowly; training takes forever | Increase LR; consider warmup schedules |
| **Stuck in local minimum** | Loss plateaus at a suboptimal value | Try Momentum or Adam; increase LR temporarily; restart from a different position |
| **Overfitting** | Training loss is low but validation loss rises | Add regularization (dropout, weight decay); reduce model size; get more data |

### The Edge of Stability: why the best learning rate sits on a knife-edge

You may have seen the advice that the *best* learning rate is the largest one that "just barely" doesn't diverge. That is not folklore; it names a sharp, studied regime called the **edge of stability**. When the learning rate $\eta$ is large enough that a single step would overshoot a sharp region, gradient descent does **not** blow up. Instead it **locks** onto that sharp region and *oscillates* at its rim, with the largest curvature (the sharpness, the top Hessian eigenvalue) settling right around $\lambda_{\max} \approx 2/\eta$ while the loss still drifts downward (\cite[Arora et al., 2022]{arora2022edgeofstability}). The optimizer is balancing on the knife-edge of a sharp minimum, and — surprisingly — it *prefers* those edges over the flat bottoms it would otherwise settle into.

This reframes the "learning rate too high" row in the table above. A high $\eta$ that makes the loss *oscillate but keep falling* is not a bug to fix — it is the network running at the edge of stability, a regime many modern training curves actually live in. The practical read: if your loss oscillates but trends steadily down, you are on the edge, and you can often stay there or push a little further rather than immediately dialing the learning rate back.
</div>
