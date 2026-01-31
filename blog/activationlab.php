<?php include_once("functions.php"); ?>
<div class="md">

## The Necessity of Activation Functions

Activation functions serve as the mathematical **"gates"** of a neural network. Without them, a network would be nothing more than a series of linear transformations, essentially collapsing into one giant linear equation.

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

Because a product of two matrices $(W_2W_1)$ is simply another matrix, and the remaining term is just a new bias vector, the multi-layer network behaves exactly like a **single-layer** model. Without non-linear activation functions (like **ReLU**, **Sigmoid**, or **Tanh**), stacking layers adds no extra "intelligence" or power to the model.
</div>

<div class="activation-lab-container" style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #dcfce7; margin-top: 20px;">
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
            <label style="display: block; margin-bottom: 8px;"><b>Select Activation Function:</b></label>
            <select id="pure-act-type" class="btn" style="background: white; color: black; border: 1px solid #ccc; width: 100%; padding: 10px;">
                <option value="relu">ReLU (The Modern Standard)</option>
                <option value="sigmoid">Sigmoid (The Classic S-Curve)</option>
                <option value="tanh">Tanh (Zero-Centered)</option>
                <option value="leaky_relu">Leaky ReLU (Death Prevention)</option>
                <option value="identity">Identity (Linear)</option>
            </select>
        </div>
        <div id="pure-math-box" style="padding: 15px; background: white; border-radius: 8px; border: 1px solid #dcfce7; font-size: 1.2em; display: flex; align-items: center; justify-content: center; min-height: 60px;">
        </div>
    </div>
    <div id="plot-pure-activation" style="height: 350px; background: white; border-radius: 8px; width: 100%;"></div>
    
    <div id="act-analysis-box" style="margin-top: 20px; padding: 20px; background: #f8fafc; border-left: 5px solid #22c55e; border-radius: 4px; width: 100%; box-sizing: border-box;">
        <i id="act-title" style="margin-top:0; color: #166534; font-size: 1.3em;">Function Name</i>
        <div id="act-description" class="md" style="font-size: 1em; line-height: 1.6;">
        </div>
    </div>
</div>

<div class="md">
## SoftMax: The "Multi-Class" Gate

While ReLU and Sigmoid deal with individual neurons, **SoftMax** (introduced in \citeyear{bridle1989probabilistic} by \citeauthor{bridle1989probabilistic}) is a team player. It is used when you want to have percentages instead of absolute numbers, especially in the **output layer** of a neural network designed for multi-class classification (e.g., identifying if an image is a cat, dog, or bird, or at the end of a Transformer module, which returns a list of words with a given probability).

### Why the name "Soft" Max?
* **Hard Max:** A standard "Maximum" function (like `argmax`) is "hard." It returns 1 for the largest value and 0 for everything else. It is not differentiable, which means we can't train a network with it.
* **Soft Max:** This is a "softened" version. It turns the largest value into the highest probability, but it still assigns smaller probabilities to the "losers." This allows the network to express **uncertainty**.

### The Math
For an input vector $z$ (called **logits**), the SoftMax value for the $i$-th element is:

$$ \sigma(z)_i = \frac{e^{z_i}}{\sum_{j=1}^{K} e^{z_j}} $$

1.  **Exponentials ($e^z$):** We raise $e$ to the power of each input. This ensures every output is positive.
2.  **Normalization:** We divide each result by the sum of all results. This ensures the final values **always sum to 1.0 (100%)**.

### Why it's not a simple percentage (The "Non-Linear" Secret)

If you input 0.1 and 0.9, you might expect 10% and 90%. Instead, you get roughly 31% and 69%. This is because SoftMax is **not a linear scaling**; it is an **exponential normalization**.

#### The Exponential "Contrast"
SoftMax uses the function $e^x$ to transform inputs.
* **Linear thinking:** 0.9 is 9x larger than 0.1.
* **SoftMax thinking:** $e^{0.9}$ (2.46) is only ~2.2x larger than $e^{0.1}$ (1.11).
This behavior acts as a **contrast amplifier**. It helps the network make a "confident" decision by widening the gap between the top scores and the noise.

#### Handling the "Underworld" (Negative Numbers)
A simple percentage calculation fails if you have negative scores (e.g., -2.0 and 1.0). You cannot have a negative probability. SoftMax solves this because $e^x$ is **always positive**. Even $e^{-5.0}$ results in a tiny, positive number (0.0067).

#### Why is this the standard for AI?
Because $e$ represents the "most natural" way to describe growth, the function $e^x$ is uniquely simple to work with in calculus. In SoftMax, we are essentially saying: *"Let's treat the scores (logits) as continuous growth rates."* By using $e$, the math of learning (calculus) becomes as smooth and efficient as possible, because the derivative of $e^x$ is just $e^x$. This "cleanliness" is what allows us to train massive AI models without the math becoming a tangled mess.

#### Why is $e$ the "Perfect" choice for SoftMax?
Neural networks don't use $e$ just because it's famous; they use it because of **Calculus**.

* **The Derivative Property:** $e^x$ is the only function where the derivative is the function itself: $\frac{d}{dx}e^x = e^x$.
    * *Why this matters:* In backpropagation, we calculate "gradients" (slopes). When we combine the SoftMax function with Cross-Entropy Loss, the complex calculus simplifies into a incredibly elegant term: $(y_{pred} - y_{true})$. This efficiency makes training deep networks computationally feasible.

* **The Positivity Constraint:** Probabilities cannot be negative. However, raw neural network outputs (logits) can be any real number from $-\infty$ to $+\infty$. Since $e^x$ is strictly positive for all real $x$, it maps the "underworld" of negative numbers into the positive space required for probability.

* **Non-Linear Contrast (The "Amplifier"):**
    If we have Logits $x_1=2$ and $x_2=4$, the difference is only 2 units (linear).
    But $e^4 \approx 54.6$ and $e^2 \approx 7.4$.
    The exponential transformation increases the ratio from $2:1$ to roughly $7:1$. This forces the network to pick a "winner," making the classification decision much more distinct.

#### The Motivation in SoftMax
The SoftMax formula $\sigma(z)_i = \frac{e^{z_i}}{\sum e^{z_j}}$ is essentially a **normalization of growth**.



By exponentiating the logits, we are measuring the "total growth energy" of all classes combined and then asking: *"What percentage of the total energy belongs to Class A?"* This ensures that even if a score is negative, it still represents a physical "share" of the total probability, and that the sum of all shares always equals exactly 1.0 (100%).
</div>

<div class="softmax-lab-container" style="background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 20px;">
    <div>

        <div style="background:white; padding:15px; border-radius:8px; border:1px solid #cbd5e1; display: flex; flex-direction: column; min-width: 0;">
            <h4 style="margin-top:0">Logit Scores</h4>
            <div id="softmax-controls"></div>
            <button id="add-class-btn" style="margin-top:10px; padding:8px; background:#6366f1; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">+ Add Class</button>
        </div>

        <div id="softmax-bar-plot" style="background:white; border-radius:8px; border:1px solid #e2e8f0; min-width: 0; width: 100%;"></div>
        <div id="softmax-pie-plot" style="background:white; border-radius:8px; border:1px solid #e2e8f0; min-width: 0; width: 100%;"></div>
    </div>

    <div id="softmax-math" style="margin-top:20px; padding:15px; background:#f1f5f9; border-radius:8px; min-height:50px;"></div>
</div>

<div class="md">
## The Evolution of Differentiability: From Step Functions to Sigmoids

The realization that activation functions needed to be differentiable was born from the necessity of **gradient-based optimization**. In early models like the Perceptron (by \citeauthor{rosenblatt1958perceptron}), the **Heaviside step function** was used. Because its derivative is zero almost everywhere, it was impossible to use calculus to "nudge" weights in the right direction. To solve this, researchers turned to smooth, continuous functions that allowed for the application of the chain rule, the mathematical backbone of **backpropagation**.

### The Reign of Sigmoid and Tanh

During the 1980s and 90s, the **Sigmoid** and **Hyperbolic Tangent (Tanh)** functions became the standard "decision makers" for neural networks. 

* **Sigmoid**: This function squashes input values into a range of $(0, 1)$, which was originally favored because it could be interpreted as the probability of a neuron "firing". Key historical implementations, such as the early backpropagation experiments on handwritten zip code recognition, utilized sigmoid activations in the hidden layers.
* **Tanh**: As researchers like \citeauthor{lecun1998gradientbased} (in '\citetitle{lecun1998gradientbased}', published in \citeyear{lecun1998gradientbased}) pushed for better performance, **Tanh** became preferred over Sigmoid because it is zero-centered, mapping inputs to a range of $(-1, 1)$. This helped keep the updates to the network's weights more balanced during training, a technique notably applied to document recognition systems.


### The Breaking Point: Vanishing Gradients

The era of S-shaped curves eventually reached a limit. Because both **Sigmoid** and **Tanh** "flatten out" (saturate) at high and low input values, their derivatives become nearly zero. In deep networks, multiplying these tiny numbers together during backpropagation caused the signal to disappear before it reached the earliest layers, a phenomenon known as the **vanishing gradient problem**.



This bottleneck was finally bypassed when the community embraced the **Rectified Linear Unit (ReLU)**. By maintaining a constant gradient of 1 for all positive inputs ($x > 0$), ReLU allowed gradients to flow through dozens of layers without fading, a breakthrough that \citeauthor{glorot2011deep} (\citeyear{glorot2011deep}) demonstrated was essential for training deep supervised networks. While earlier works like the Neocognitron by \citeauthor{neocognitron} explored similar structures, the formal validation of ReLU in \citeyear{glorot2011deep} effectively launched the modern age of Deep Learning.
</div>
