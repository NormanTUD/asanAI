<?php include_once("functions.php"); ?>
<div class="md">

## The Necessity of Activation Functions

Activation functions serve as the mathematical **"gates"** of a neural network. Without them, a network would be nothing more than a series of linear transformations—essentially collapsing into one giant linear equation.

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
## Softmax: The "Multi-Class" Gate

While ReLU and Sigmoid deal with individual neurons, **Softmax** is a team player. It is almost exclusively used in the **output layer** of a neural network designed for multi-class classification (e.g., identifying if an image is a cat, dog, or bird).

### Why the name "Soft" Max?
* **Hard Max:** A standard "Maximum" function (like `argmax`) is "hard." It returns 1 for the largest value and 0 for everything else. It is not differentiable, which means we can't train a network with it.
* **Soft Max:** This is a "softened" version. It turns the largest value into the highest probability, but it still assigns smaller probabilities to the "losers." This allows the network to express **uncertainty**.

### The Math
For an input vector $z$ (called **logits**), the Softmax value for the $i$-th element is:

$$ \sigma(z)_i = \frac{e^{z_i}}{\sum_{j=1}^{K} e^{z_j}} $$

1.  **Exponentials ($e^z$):** We raise $e$ to the power of each input. This ensures every output is positive.
2.  **Normalization:** We divide each result by the sum of all results. This ensures the final values **always sum to 1.0 (100%)**.

</div>

<div class="softmax-lab-container" style="background: #eff6ff; padding: 25px; border-radius: 12px; border: 1px solid #bfdbfe; margin-top: 20px;">
    <h3>Interactive Softmax Lab</h3>
    <p>Adjust the <b>Logits</b> (raw scores) below to see how the Softmax distribution shifts. Notice how even a small increase in one logit can drastically "pull" the probability away from others.</p>

    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
        <div id="softmax-inputs" style="display: flex; flex-direction: column; gap: 15px;">
            <div>
                <label>Logit 1 (Class A)</label>
                <input type="number" class="softmax-input" value="2.0" step="0.5" style="width:100%; padding:8px; border-radius:5px; border:1px solid #ccc;">
            </div>
            <div>
                <label>Logit 2 (Class B)</label>
                <input type="number" class="softmax-input" value="1.0" step="0.5" style="width:100%; padding:8px; border-radius:5px; border:1px solid #ccc;">
            </div>
            <div>
                <label>Logit 3 (Class C)</label>
                <input type="number" class="softmax-input" value="0.1" step="0.5" style="width:100%; padding:8px; border-radius:5px; border:1px solid #ccc;">
            </div>
        </div>

        <div id="softmax-plot" style="background: white; border-radius: 8px; height: 300px;"></div>
    </div>

    <div id="softmax-math" style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px; border: 1px solid #bfdbfe; text-align: center;">
    </div>
</div>
