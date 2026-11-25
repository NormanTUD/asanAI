<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Activation Functions: The Neural Decision Makers
description: The neural decision makers, why without non-linearity, a network collapses to nothing.
icon: &#9889;
part: 2
order: 10
color: coral
topics: math-i, programming
tags: code-heavy
-->

<div class="md" data-mathlevel="45">
## The Necessity of Activation Functions

Activation functions serve as the mathematical **“gates”** of a neural network. Without them, a network would be nothing more than a series of linear transformations, essentially collapsing into one giant linear equation.

By introducing **non-linearity**, these functions allow the model to learn complex patterns, from the specific curve of a cat's ear to the subtle nuances of human speech.

### The Linear Layer
In neural networks, one of the most basic building blocks is the **Dense layer** (referred to as **Linear** in PyTorch). It performs a simple linear transformation of its input:

$$y = Wx + b$$

Where:
* $W$ is the **weight matrix**.
* $b$ is the **bias vector**.

### The Problem: Mathematical Collapse
If we stack two Dense layers without an activation function, the operations combine mathematically:

$$y = \text{Dense}_2(\text{Dense}_1(x))$$

Substituting the linear equation:
$$y = W_2(W_1x + b_1) + b_2$$

Expanding the terms:
$$y = (W_2W_1)x + (W_2b_1 + b_2)$$

See? We end up with another linear transformation like $Wx + b$, where $ W = W_2W_1 $ and $b = (W_2b_1 + b_2)$. This way, adding more layers, doesn't add more functionality to the neural network. This is where activation functions come into play.

Because a product of two matrices $(W_2W_1)$ is simply another matrix, and the remaining term is just a new bias vector, the multi-layer network behaves exactly like a **single-layer** model. Without non-linear activation functions — the non-differentiable Heaviside threshold $H(x)=\mathbf{1}_{x>0}$ of the early Perceptron, which \citeauthor{rosenblatt1958perceptron} trained with a discrete error-correction rule rather than gradient descent; the rectifier $\max(0,x)$ used by \citeauthor{relufirst} in \citeyear{relufirst} and popularised by \citeauthorlastnameand{relupaper} in \citeyear{relupaper}; the logistic sigmoid; or tanh — stacking layers adds no extra “intelligence” or power to the model.

With enough width, ReLU networks can represent every continuous piecewise-linear function on a compact domain, and every function such a network computes is itself continuous and piecewise-linear. The exact version is proved in \citeauthor{petersen2024mathdl} (\citeyear{petersen2024mathdl}), Ch.\ 5.
</div>

<div class="activation-lab-container" style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #dcfce7; margin-top: 20px;">
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
            <label style="display: block; margin-bottom: 8px;"><b>Select Activation Function:</b></label>
            <select id="pure-act-type" class="btn" style="border: 1px solid #ccc; width: 100%; padding: 10px;">
                <option value="relu">ReLU (The Classic Workhorse)</option>
                <option value="gelu">GELU (The Transformer Standard)</option>
                <option value="silu">SiLU (The Diffusion Smooth Gate)</option>
                <option value="sigmoid">Sigmoid (The Classic S-Curve)</option>
                <option value="tanh">Tanh (Zero-Centered)</option>
                <option value="leaky_relu">Leaky ReLU (Death Prevention)</option>
                <option value="identity">Identity (Linear)</option>
            </select>
        </div>
        <div id="pure-math-box" style="padding: 15px; background: var(--mn-surface, white); border-radius: 8px; border: 1px solid #dcfce7; font-size: 1.2em; display: flex; align-items: center; justify-content: center; min-height: 60px;">
        </div>
    </div>
    <div id="plot-pure-activation" style="height: 350px; background: var(--mn-surface, white); border-radius: 8px; width: 100%;"></div>
    
    <div id="act-analysis-box" style="margin-top: 20px; padding: 20px; background: #f8fafc; border-left: 5px solid #22c55e; border-radius: 4px; width: 100%; box-sizing: border-box;">
        <i id="act-title" style="margin-top:0; color: #166534; font-size: 1.3em;">Function Name</i>
        <div id="act-description" class="md" style="font-size: 1em; line-height: 1.6;">
        </div>
    </div>
</div>

<div class="md" data-mathlevel="50">
## SoftMax: The “Multi-Class” Gate

While ReLU and Sigmoid deal with individual neurons, **SoftMax** is a team player. The formula is older than machine learning: it is the **Boltzmann distribution** of statistical mechanics, with the logits playing the role of negative energies \cite{boltzmann_distribution_wiki}, and \citeauthor{luce1959individualchoice} derived it from his choice axiom in \citeyear{luce1959individualchoice}. The name "softmax" comes from \citeauthor{bridle1990softmax}, who used it for a normalised exponential in a 1989 conference paper published in \citeyear{bridle1990softmax}. It is used when you want to have percentages instead of absolute numbers, especially in the **output layer** of a neural network designed for multi-class classification (e.g., identifying if an image is a cat, dog, or bird, or at the end of a Transformer module, which returns a list of words with a given probability).

### Why the name “Soft” Max?
* **Hard Max:** A standard “Maximum” function (like `argmax`) is “hard.” It returns 1 for the largest value and 0 for everything else. It is not differentiable, which means we can't train a network with it with Backpropagation.
* **Soft Max:** This is a “softened” version. It turns the largest value into the highest probability, but it still assigns smaller probabilities to the “losers.” This allows the network to express **uncertainty**.

### The Math
For an input vector $z$ (called **logits**), the SoftMax value for the $i$-th element is:
</div>

<div class="topic-block" data-optionaltitle="The SoftMax formula" data-mathlevel="50">
$$ \sigma(z)_i = \frac{e^{z_i}}{\sum_{j=1}^{K} e^{z_j}} $$
</div>

<div class="md" data-mathlevel="50">
1.  **Exponentials ($e^z$):** We raise $e$ to the power of each input. This ensures every output is positive.
2.  **Normalization:** We divide each result by the sum of all results. This ensures the final values **always sum to 1.0 (100%)**.

### Why it's not a simple percentage (The “Non-Linear” Secret)

If you input 0.1 and 0.9, you might expect 10% and 90%. Instead, you get roughly 31% and 69%. This is because SoftMax is **not a linear scaling**; it is an **exponential normalization**.

#### The Exponential “Contrast”
SoftMax uses the function $e^x$ to transform inputs.
* **Linear thinking:** 0.9 is 9x larger than 0.1.
* **SoftMax thinking:** $e^{0.9}$ (2.46) is only ~2.2x larger than $e^{0.1}$ (1.11).
The exponential does not simply widen every gap: it converts an additive difference between logits into a multiplicative ratio of probabilities. A logit gap of $1$ becomes a ratio of $e \approx 2.7$, a gap of $2$ becomes $e^2 \approx 7.4$. That is why the sharpness depends on the scale of the logits, not on their raw ratio: for $0.1$ and $0.9$ the ratio falls from $9:1$ to about $2.2:1$, while for $2$ and $4$ it rises from $2:1$ to about $7.4:1$. SoftMax is shift-invariant, and a temperature parameter can soften or sharpen the distribution.

#### Temperature: sharpening and flattening

The formula above is the $\tau=1$ case of a one-parameter family, $\sigma_\tau(z)_i = e^{z_i/\tau}/\sum_j e^{z_j/\tau}$. A small $\tau$ divides the logits by a small number, magnifying their differences and sharpening the distribution; a large $\tau$ flattens it toward uniform.

Temperature appears in two different places in a Transformer. **Attention** uses a fixed temperature $\tau=\sqrt{d_k}$ inside every attention head at every layer: it controls how sharply a query spreads its weight over the keys. The **sampling temperature** you set in a chat API (0.7, 1.2, …) is a second, separate knob applied once to the final vocabulary logits, just before the next token is sampled. Same mathematics, different point in the network.

#### Handling Negative Numbers
A simple percentage calculation fails if you have negative scores (e.g., -2.0 and 1.0). You cannot have a negative probability. SoftMax solves this because $e^x$ is **always positive**. Even $e^{-5.0}$ results in a tiny, positive number (0.0067).

#### Why is this the standard for AI?
Because $e$ represents the “most natural” way to describe growth, the function $e^x$ is uniquely simple to work with in calculus. In SoftMax, we are essentially saying: *“Let's treat the scores (logits) as continuous growth rates.”* By using $e$, the math of learning (calculus) becomes as smooth and efficient as possible, because the derivative of $e^x$ is just $e^x$. This “cleanliness” is what allows us to train massive AI models without the math becoming a tangled mess.

#### Why is $e$ the perfect choice for SoftMax?
Neural networks don't use $e$ just because it's famous; they use it because of **Calculus**.

* **The Derivative Property:** $e^x$ is the only function (up to a constant multiple) whose derivative is itself: $\frac{d}{dx}e^x = e^x$.
    * *Why this matters:* In backpropagation, we calculate “gradients” (slopes). When we combine the SoftMax function with Cross-Entropy Loss, the complex calculus simplifies into a incredibly elegant term: $(y_{pred} - y_{true})$. This efficiency makes training deep networks computationally feasible.

* **The Positivity Constraint:** Probabilities cannot be negative. However, raw neural network outputs (logits) can be any real number from $-\infty$ to $+\infty$. Since $e^x$ is strictly positive for all real $x$, it maps negative numbers into the positive space required for probability.

* **Non-Linear Contrast (The “Amplifier”):**
    If we have Logits $x_1=2$ and $x_2=4$, the difference is only 2 units (linear).
    But $e^4 \approx 54.6$ and $e^2 \approx 7.4$.
    The exponential transformation increases the ratio from $2:1$ to roughly $7:1$. This forces the network to pick a “winner,” making the classification decision much more distinct.

#### The Motivation in SoftMax
The SoftMax formula $\sigma(z)_i = \frac{e^{z_i}}{\sum e^{z_j}}$ is essentially a **normalization of growth**.

By exponentiating the logits, we are measuring the “total growth energy” of all classes combined and then asking: *“What percentage of the total energy belongs to Class A?”* This ensures that even if a score is negative, it still represents a physical “share” of the total probability, and that the sum of all shares always equals exactly 1.0 (100%).
</div>

<div class="softmax-lab-container" style="background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 20px;">
    <div>

        <div style="background:var(--mn-surface, white); padding:15px; border-radius:8px; border:1px solid #cbd5e1; display: flex; flex-direction: column; min-width: 0;">
            <p>Logit Scores:</p>
            <div id="softmax-controls"></div>
            <button id="add-class-btn" style="margin-top:10px; padding:8px; background:#6366f1; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">+ Add Class</button>
        </div>

        <div id="softmax-bar-plot" style="background:var(--mn-surface, white); border-radius:8px; border:1px solid #e2e8f0; min-width: 0; width: 100%;"></div>
        <div id="softmax-pie-plot" style="background:var(--mn-surface, white); border-radius:8px; border:1px solid #e2e8f0; min-width: 0; width: 100%;"></div>
    </div>

    <div id="softmax-math" style="margin-top:20px; padding:15px; background:#f1f5f9; border-radius:8px; min-height:50px;"></div>
</div>

<div class="md">
## The Evolution of Differentiability: From Step Functions to Sigmoids

The realization that activation functions needed to be differentiable was born from the necessity of **gradient-based optimization**. In early models like the Perceptron (by \citeauthor{rosenblatt1958perceptron}), the **Heaviside step function** was used. Because its derivative is zero almost everywhere, it was impossible to use calculus to “nudge” weights in the right direction. To solve this, researchers turned to smooth, continuous functions that allowed for the application of the chain rule, the mathematical backbone of **backpropagation**.

Before it was an activation, the sigmoid was a **population law**. In \citeyear{verhulst1838logistic}, \citeauthor{verhulst1838logistic} proposed $dP/dt = rP(1-P/K)$: a population $P$ grows at rate $r$ when small, but the term $(1-P/K)$ slows it as it approaches the carrying capacity $K$. The solution is the logistic curve, an S-shape that starts exponentially and then flattens. The same curve later became the workhorse of bio-assay and logistic regression (\cite{berkson1944logistic}; \cite{cox1958logistic}), and only then was it borrowed as a differentiable "firing probability" for neural units.

### The Reign of Sigmoid and Tanh

During the 1980s and 90s, the **Sigmoid** and **Hyperbolic Tangent (Tanh)** functions became the standard “decision makers” for neural networks. 

* **Sigmoid**: This function squashes input values into a range of $(0, 1)$, which made it natural to read an output as the probability of a neuron “firing” — though the curve itself was not invented for that purpose. The early backpropagation experiments on handwritten zip codes actually used a scaled hyperbolic tangent in the hidden layers, not the logistic sigmoid \cite{lecun1989backpropagation}.
* **Tanh**: As researchers like \citeauthor{lecun1998gradientbased} (in '\citetitle{lecun1998gradientbased}', published in \citeyear{lecun1998gradientbased}) pushed for better performance, **Tanh** became preferred over Sigmoid because it is zero-centered, mapping inputs to a range of $(-1, 1)$. This helped keep the updates to the network's weights more balanced during training, a technique notably applied to document recognition systems.


Tanh is a rescaled logistic curve: $\tanh(x) = 2\sigma(2x)-1$. The rescaling makes it zero-centred, so a unit's gradient is not biased in one direction simply because its output is always positive — the reason \cite[LeCun et al. (1989)]{lecun1989backpropagation} used a scaled hyperbolic tangent in every node of their zip-code network. The price is the same saturation at both ends: for large $|x|$ the derivative tends to zero, and stacking many such units multiplies those small numbers together. That is the vanishing-gradient problem in its simplest form.

### The Breaking Point: Vanishing Gradients

The era of S-shaped curves eventually reached a limit. Because both **Sigmoid** and **Tanh** “flatten out” (saturate) at high and low input values, their derivatives become nearly zero. In deep networks, multiplying these tiny numbers together during backpropagation caused the signal to disappear before it reached the earliest layers, a phenomenon known as the **vanishing gradient problem**.

The problem was diagnosed precisely in the early 1990s. \citeauthor{hochreiter1991vanishing}'s \citeyear{hochreiter1991vanishing} diploma thesis analysed the repeated multiplication of Jacobians in backpropagation and showed that the error signal can shrink exponentially with depth; \cite[Bengio et al. (1994)]{bengio1994learning} made the result general and connected it to the difficulty of learning long-range dependencies. The fix is not a single trick: ReLU keeps the derivative from vanishing on the active side, residual connections give the gradient a short path around a block, and gated recurrent architectures such as the LSTM and GRU learn to hold information across time.

This bottleneck was finally bypassed when the community embraced the **Rectified Linear Unit (ReLU)**, the piecewise-linear function $\max(0,x)$. \citeauthor{relufirst} had used a rectifier-like response as an activation in a multilayered network as early as \citeyear{relufirst}, but the unit entered mainstream deep learning in 2010, when \citeauthorlastnameand{relupaper} showed that rectified units could train better than sigmoid units in restricted Boltzmann machines. By keeping a constant gradient of 1 for all positive inputs ($x > 0$), ReLU let gradients flow through dozens of layers without fading; \cite[Glorot et al. (2011)]{glorot2011deep} then demonstrated why this made deep supervised networks trainable. The 2012 ImageNet result \cite{krizhevsky2012imagenet} made rectifier networks the default, and the modern deep-learning era followed.
</div>

<div class="md">
The name "rectifier" comes from electronics: a half-wave rectifier passes the positive half of a signal and blocks the negative half, and $\max(0,x)$ is exactly that operation. In the 2010 RBM experiments that brought it back, the rectified unit was not just a cheaper sigmoid; it changed the sparsity of the learned representations, with many units sitting exactly at zero \cite{relupaper}. That sparsity is the subject of the next section.

### Why ReLU Works: Sparse Representations

The most common explanation for ReLU's success is that its derivative is 1 for positive inputs and 0 for negative ones, which prevents the vanishing gradient problem. But there is a deeper insight: ReLU creates **sparsity**.

For any given input, roughly half of ReLU's neurons output exactly zero. This means the network is effectively using a **different sparse subnetwork** for each input. A neuron that activates for “dog” may be silent for “cat,” and vice versa. Over the entire dataset, each neuron specializes in a subset of patterns, and every input activates only a fraction of the available neurons.

This connects directly to the \cite[Lottery Ticket Hypothesis]{frankle2019lottery}: within a large, randomly initialized network, there exist smaller subnetworks (“winning tickets”) that, when trained in isolation, can match the performance of the full network. ReLU makes these subnetworks easier to find because its sparsity naturally partitions the network into overlapping but distinct computational pathways.

The “aha-moment”: ReLU doesn't just prevent vanishing gradients, it forces the network to use a different “team” of neurons for every input, creating **implicit specialization**. No neuron needs to be a generalist; each can become an expert on a narrow pattern because it only fires when that pattern appears.
</div>

<div class="md" data-mathlevel="50">
### GELU: The Smooth Transformer Gate

While ReLU became the workhorse of CNNs, the **Gaussian Error Linear Unit (GELU)**, introduced by \citeauthorlastnameand{hendrycks2016gelu} in \citeyear{hendrycks2016gelu}, became the standard activation in many **Transformer** feed-forward networks — GPT-1, BERT and their descendants — although the original Transformer used ReLU \cite{vaswani2017attention}. This is the activation used in the FFN of the nanoGPT model we train in this course:

$$\text{GELU}(x) = x \cdot \Phi(x) = 0.5\, x \left(1 + \text{erf}\!\left(\frac{x}{\sqrt{2}}\right)\right)$$

Where $\Phi(x)$ is the standard normal cumulative distribution function and $\text{erf}$ is the error function.

In \citeyear{hendrycks2016gelu}, \citeauthorlastnameand{hendrycks2016gelu} did not simply fit a curve: they derived GELU as the expectation of a stochastic regulariser. Multiply the input $x$ by a Bernoulli mask that keeps it with probability $\Phi(x)$ and drops it otherwise; the expected value of that random gate is $x\Phi(x)$, the GELU. The Gaussian CDF enters for a reason — it is the probability that a standard-normal noise variable stays below $x$ — and the function inherits a smooth, slightly non-monotonic dip near $x\approx-0.75$ instead of ReLU's hard corner.

GELU is often described as a “smooth ReLU”: it behaves approximately like $\max(0, x)$ but is **everywhere differentiable** and keeps a small non-zero gradient for negative inputs. This means the gradient is rarely exactly zero for negative inputs, so a detector can keep contributing a small signal during backpropagation. It is this smoothness, combined with its superior performance on language modeling, that made GELU the natural choice for the Transformer's FFN.
</div>

<div class="md" data-mathlevel="50">
### SiLU: The Diffusion Smooth Gate

The **Sigmoid Linear Unit (SiLU)** — introduced by \cite[Elfwing et al. (2017)]{elfwing2017silu} and independently found as **Swish** by \cite[Ramachandran et al. (2017)]{ramachandran2017swish} — is the activation inside the **U-Net denoiser of Stable Diffusion** \cite{rombach2022ldm} and in many modern vision models:

$$\text{SiLU}(x) \;=\; x \cdot \sigma(x) \;=\; \frac{x}{1 + e^{-x}}$$

Both names describe the same self-gating trick: the input multiplies a gate that is a function of itself, so the unit can pass a signal, suppress it, or output a small negative value. \cite[Elfwing et al. (2017)]{elfwing2017silu} approached it from reinforcement-learning value functions, while \cite[Ramachandran et al. (2017)]{ramachandran2017swish} found it by architecture search; the two papers arrived at the same curve from different directions. That is a different mechanism from GELU's probabilistic gate, even though the two curves are nearly indistinguishable.

A *self-gated* function: each input is multiplied by its own sigmoid. Looks like a smoothed ReLU, strongly positive for large $x$, weakly negative for large negative $x$ (minimum $\approx -0.28$), zero at $x = 0$. Like GELU it is everywhere differentiable and retains a small gradient for moderately negative inputs; unlike GELU it needs only one sigmoid (no error function), so deep vision stacks prefer it. Inside Stable Diffusion, each ResBlock applies `GroupNorm → SiLU → Conv` twice, with a residual connection around the pair \cite{rombach2022ldm}.
</div>

<div class="mn-quiz" data-quiz="activationlab"><script type="application/json">{"title": "Activation functions", "questions": [{"q": "What happens to a deep network without non-linear activation functions?", "options": ["It collapses to a single linear (affine) map", "It becomes more powerful than a shallow network", "It stops being trainable on modern GPUs", "It turns into a shallow decision tree"], "answer": 0, "explain": "A composition of linear maps is linear, no matter how many layers."}, {"q": "What is ReLU(x)?", "options": ["max(0, x)", "min(0, x)", "1/(1+e⁻ˣ)", "tanh(x)"], "answer": 0, "explain": "ReLU passes positive values unchanged and sets negative ones to zero."}, {"q": "Why was the original step function replaced by smooth functions like the sigmoid?", "options": ["Its derivative is zero almost everywhere, so gradient descent gets no signal", "It was too slow to compute on the hardware that was available then", "It produced negative outputs that broke the whole loss function during training", "It could only output values that lie strictly between 0 and 1"], "answer": 0, "explain": "Backpropagation needs useful derivatives; a flat step gives none."}, {"q": "Where is softmax typically used?", "options": ["At the output of a multi-class classifier, giving probabilities", "Between every pair of layers, to normalise every single activation", "In the tokenizer, to split the text into subword units", "To initialise weights, so they all start small and random"], "answer": 0, "explain": "Softmax turns the final scores into a probability distribution over the classes."}]}</script></div>
