<?php include_once("functions.php"); ?>

<div class="md">
## The Core Idea

You've already learned how **gradient descent** finds the bottom of a valley, and how the **chain rule** lets us pass error signals through a chain of operations. **Backpropagation** is the algorithm that puts these two ideas together to train an entire neural network.

The word "backpropagation" literally means **"propagating errors backward."** Here's the intuition:

1. **Forward Pass:** Data flows *forward* through the network — input → hidden layer → output → prediction.
2. **Compute Loss:** We compare the prediction to the true answer and get a single number: the **error** (loss).
3. **Backward Pass:** That error signal flows *backward* through every layer. Each neuron asks: *"How much did I contribute to this mistake?"* and adjusts its weights accordingly.

The mathematical engine behind step 3 is the **chain rule**, applied systematically from the output layer all the way back to the first layer.

## The Network We'll Use

We'll work with the simplest possible network that still demonstrates every concept: **2 inputs, 2 hidden neurons, 2 outputs**. This is the same architecture used in Matt Mazur's classic walkthrough, and it's enough to see every moving part.

$$
\text{Input } \mathbf{x} = \begin{pmatrix} x_1 \\ x_2 \end{pmatrix}
\xrightarrow{W^{(1)}, b^{(1)}}
\text{Hidden } \mathbf{h} = \begin{pmatrix} h_1 \\ h_2 \end{pmatrix}
\xrightarrow{W^{(2)}, b^{(2)}}
\text{Output } \mathbf{o} = \begin{pmatrix} o_1 \\ o_2 \end{pmatrix}
$$

Each arrow represents a **linear transformation** followed by the **sigmoid activation function**:

$$
\sigma(z) = \frac{1}{1 + e^{-z}}
$$

The sigmoid squashes any number into the range $(0, 1)$, which is essential for keeping values bounded and for computing smooth gradients.

## The Sigmoid Derivative (Key Identity)

One reason sigmoid is pedagogically useful is that its derivative has an elegant closed form:

$$
\sigma'(z) = \sigma(z) \cdot (1 - \sigma(z))
$$

This means once we know the *output* of a sigmoid neuron, we instantly know its derivative — no extra computation needed. You'll see this identity used at every neuron during the backward pass.

## The Loss Function

We use the **Mean Squared Error (MSE)** to measure how wrong the network is:

$$
E_{\text{total}} = \sum_{i} \frac{1}{2}(t_i - o_i)^2
$$

where $t_i$ is the target (true value) and $o_i$ is the network's output. The $\frac{1}{2}$ is a mathematical convenience — it cancels with the exponent when we take the derivative:

$$
\frac{\partial}{\partial o_i} \left[ \frac{1}{2}(t_i - o_i)^2 \right] = -(t_i - o_i)
$$

## What "Information Flows Back" Really Means

During the **forward pass**, numbers flow left-to-right: inputs get multiplied by weights, summed, and squeezed through activation functions to produce outputs.

During the **backward pass**, a single number — the **error gradient** — flows right-to-left. At each node, the chain rule **splits** this gradient and distributes it to every incoming connection. Each weight receives a specific "blame signal" proportional to how much it contributed to the error.

Concretely, for any weight $w$:

$$
\frac{\partial E}{\partial w} = \underbrace{\frac{\partial E}{\partial o}}_{\text{error at output}} \times \underbrace{\frac{\partial o}{\partial z}}_{\text{activation slope}} \times \underbrace{\frac{\partial z}{\partial w}}_{\text{input to this node}}
$$

This is the chain rule applied link by link. The backward pass computes these products starting from the output and working toward the input — that's why it's called **back**propagation.

## What is $\delta$ (delta)? — The Reusable Error Signal

When you hover over neurons in the lab below, you'll see values like $\delta_{o_1}$ or $\delta_{h_1}$. These are **not** a new concept — they are just a **shorthand name** for a product of two things that gets reused many times. Here's exactly what they mean:

### At an output neuron (e.g., $\delta_{o_1}$):

$$
\delta_{o_1} = \underbrace{-(t_1 - o_1)}_{\substack{\text{How wrong is the output?} \\ \text{(derivative of the loss)}}} \times \underbrace{o_1 \cdot (1 - o_1)}_{\substack{\text{How steep is the sigmoid here?} \\ \text{(derivative of the activation)}}}
$$

That's it — **two numbers multiplied together**. The first number says "how far off are we from the target?" and the second says "how sensitive is the sigmoid at this point?" Their product tells us: **if we nudge the input to this neuron by a tiny amount, how much does the total error change?**

**Concrete example** (with default values): $o_1 \approx 0.7514$, target $t_1 = 0.01$:
$$\delta_{o_1} = -(0.01 - 0.7514) \times 0.7514 \times (1 - 0.7514) = 0.7414 \times 0.1868 \approx 0.1385$$

The positive sign means: "the output is **too high** — we need to push it down."

### At a hidden neuron (e.g., $\delta_{h_1}$):

Hidden neurons don't have their own target, so they receive **blame from every output neuron they connect to**, weighted by the connection strength:

$$
\delta_{h_1} = \underbrace{\Big(\delta_{o_1} \cdot w_5 + \delta_{o_2} \cdot w_7\Big)}_{\substack{\text{Total blame arriving at } h_1 \\ \text{from both outputs, weighted} \\ \text{by the connection strengths}}} \times \underbrace{h_1 \cdot (1 - h_1)}_{\substack{\text{Sigmoid slope at } h_1}}
$$

This is the key insight: **the error is distributed proportionally through the same weights that carried the signal forward**. If $w_5$ is large, then $h_1$ contributed a lot to $o_1$'s value, so it receives more blame from $o_1$.

### Why bother giving it a name?

Because $\delta$ gets reused. Once you know $\delta_{o_1}$, you use it to compute the gradient for **every** weight feeding into $o_1$:

$$
\frac{\partial E}{\partial w_5} = \delta_{o_1} \times h_1 \qquad \frac{\partial E}{\partial w_6} = \delta_{o_1} \times h_2 \qquad \frac{\partial E}{\partial b_3} = \delta_{o_1} \times 1
$$

Without the shorthand, you'd have to write out $-(t_1 - o_1) \cdot o_1(1-o_1)$ every single time. The $\delta$ is just a **time-saver**, not a new concept.

## How Each Weight Gradient Is Calculated

Once you have the $\delta$ for a node, the gradient for any weight feeding into that node follows a dead-simple pattern:

$$
\frac{\partial E}{\partial w} = \delta_{\text{node}} \times \text{(whatever value flowed through this weight)}
$$

For output weights, the "value that flowed through" is the hidden neuron's output:
$$\frac{\partial E}{\partial w_5} = \delta_{o_1} \times h_1$$

For hidden weights, the "value that flowed through" is the input:
$$\frac{\partial E}{\partial w_1} = \delta_{h_1} \times x_1$$

For biases, the "value that flowed through" is always 1 (biases have no input multiplier):
$$\frac{\partial E}{\partial b_3} = \delta_{o_1} \times 1 = \delta_{o_1}$$

## Interactive Lab

Below is a complete neural network. Every weight, bias, and intermediate value is visible. Click **"Forward Pass"** to see data flow through the network, then click **"Backward Pass"** to watch the error gradient propagate back through every connection. Finally, click **"Update Weights"** to apply gradient descent.

**Hover over any neuron** to see the exact arithmetic for that node. The weights involved in that calculation will **light up and animate** on the diagram so you can see exactly which connections carry the data.

You can edit any weight, bias, input, target, or learning rate and re-run the process to build intuition.
</div>

<!-- Animation styles for weight highlighting on hover -->
<style>
    @keyframes bp-pulse-flow {
        0%   { stroke-opacity: 0.3; stroke-width: 2; }
        50%  { stroke-opacity: 1.0; stroke-width: 6; }
        100% { stroke-opacity: 0.3; stroke-width: 2; }
    }
    .bp-highlight-line {
        animation: bp-pulse-flow 0.8s ease-in-out infinite;
    }
    @keyframes bp-dash-flow-forward {
        to { stroke-dashoffset: -30; }
    }
    @keyframes bp-dash-flow-backward {
        to { stroke-dashoffset: 30; }
    }
    .bp-flow-forward {
        stroke-dasharray: 12, 6;
        animation: bp-dash-flow-forward 0.5s linear infinite;
    }
    .bp-flow-backward {
        stroke-dasharray: 12, 6;
        animation: bp-dash-flow-backward 0.5s linear infinite;
    }
    .bp-dim-line {
        opacity: 0.15 !important;
        transition: opacity 0.2s ease;
    }
    .bp-connection {
        transition: opacity 0.2s ease, stroke 0.2s ease;
    }
    .bp-weight-label {
        transition: opacity 0.2s ease;
    }
    .bp-dim-label {
        opacity: 0.1 !important;
        transition: opacity 0.2s ease;
    }
</style>

<div id="backprop-lab-container" style="padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; flex-direction: column; gap: 20px; background: #fff;">

    <!-- Controls Row -->
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
        <div>
            <label><b>Inputs</b></label>
            <div style="display:flex; gap:8px; margin-top:5px;">
                <div>
                    <label style="font-size:0.75rem;">$x_1$</label>
                    <input type="number" id="bp-x1" value="0.05" step="0.01" style="width:70px;" class="bw-cell">
                </div>
                <div>
                    <label style="font-size:0.75rem;">$x_2$</label>
                    <input type="number" id="bp-x2" value="0.10" step="0.01" style="width:70px;" class="bw-cell">
                </div>
            </div>
        </div>
        <div>
            <label><b>Targets</b></label>
            <div style="display:flex; gap:8px; margin-top:5px;">
                <div>
                    <label style="font-size:0.75rem;">$t_1$</label>
                    <input type="number" id="bp-t1" value="0.01" step="0.01" style="width:70px;" class="bw-cell">
                </div>
                <div>
                    <label style="font-size:0.75rem;">$t_2$</label>
                    <input type="number" id="bp-t2" value="0.99" step="0.01" style="width:70px;" class="bw-cell">
                </div>
            </div>
        </div>
        <div>
            <label><b>Learning Rate ($\eta$)</b></label>
            <div style="margin-top:5px;">
                <input type="number" id="bp-lr" value="0.5" step="0.05" min="0.01" max="5" style="width:70px;" class="bw-cell">
            </div>
        </div>
        <div>
            <label><b>Epoch: <span id="bp-epoch-count">0</span></b></label>
            <div style="margin-top:5px; display:flex; gap:6px; flex-wrap:wrap;">
                <button id="bp-btn-forward" class="btn" style="background:#3b82f6; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem;">1. Forward Pass →</button>
                <button id="bp-btn-backward" class="btn" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem;" disabled>2. Backward Pass ←</button>
                <button id="bp-btn-update" class="btn" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem;" disabled>3. Update Weights</button>
                <button id="bp-btn-auto" class="btn" style="background:#8b5cf6; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem;">▶ Auto-Train 100 Epochs</button>
                <button id="bp-btn-reset" class="btn" style="background:#64748b; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem;">↺ Reset</button>
            </div>
        </div>
    </div>

    <!-- Network Visualization -->
    <div style="gap: 20px; flex-wrap: wrap; align-items: flex-start;">
        <!-- SVG Network Diagram -->
        <div style="flex: 2; min-width: 450px;">
            <b>Network Diagram</b>
            <div style="font-size:0.75rem; color:#64748b; margin-bottom:8px;">
                <span style="color:#3b82f6;">● Blue = forward signal</span> &nbsp;
                <span style="color:#ef4444;">● Red = backward gradient</span> &nbsp;
                <span style="color:#10b981;">● Green = updated</span> &nbsp;
                <span style="color:#f59e0b;">● Gold pulsing = weights used in hovered calculation</span>
            </div>
            <svg id="bp-network-svg" width="100%" viewBox="0 0 900 560"
                 style="background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
            </svg>
        </div>

        <!-- Weight Editor -->
        <div style="flex: 1; min-width: 250px;">
            <b>Weights & Biases</b>
            <div style="font-size:0.75rem; color:#64748b; margin-bottom:8px;">Edit any value, then re-run forward pass.</div>
            <table id="bp-weight-table" style="width:100%; font-size:0.8rem; border-collapse:collapse;">
                <thead>
                    <tr style="border-bottom:2px solid #e2e8f0;">
                        <th style="text-align:left; padding:4px;">Param</th>
                        <th style="text-align:center; padding:4px;">Value</th>
                        <th style="text-align:center; padding:4px;">$\frac{\partial E}{\partial w}$</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>$w_1$ (x₁→h₁)</td><td><input type="number" id="bp-w1" value="0.15" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gw1" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr><td>$w_2$ (x₂→h₁)</td><td><input type="number" id="bp-w2" value="0.20" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gw2" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr><td>$w_3$ (x₁→h₂)</td><td><input type="number" id="bp-w3" value="0.25" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gw3" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr><td>$w_4$ (x₂→h₂)</td><td><input type="number" id="bp-w4" value="0.30" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gw4" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr style="border-top:1px solid #e2e8f0;"><td>$b_1$ (h₁ bias)</td><td><input type="number" id="bp-b1" value="0.35" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gb1" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr><td>$b_2$ (h₂ bias)</td><td><input type="number" id="bp-b2" value="0.35" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gb2" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr style="border-top:2px solid #e2e8f0;"><td>$w_5$ (h₁→o₁)</td><td><input type="number" id="bp-w5" value="0.40" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gw5" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr><td>$w_6$ (h₂→o₁)</td><td><input type="number" id="bp-w6" value="0.45" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gw6" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr><td>$w_7$ (h₁→o₂)</td><td><input type="number" id="bp-w7" value="0.50" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gw7" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr><td>$w_8$ (h₂→o₂)</td><td><input type="number" id="bp-w8" value="0.55" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gw8" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr style="border-top:1px solid #e2e8f0;"><td>$b_3$ (o₁ bias)</td><td><input type="number" id="bp-b3" value="0.60" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gb3" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr><td>$b_4$ (o₂ bias)</td><td><input type="number" id="bp-b4" value="0.60" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gb4" style="font-family:monospace; text-align:center;">—</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Math Step-by-Step Display -->
    <div id="bp-math-display" style="padding: 24px; background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1px solid #cbd5e0; border-radius: 10px; font-size: 1.0rem; overflow-x: auto; min-height: 120px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.04);">
        <span style="color:#94a3b8; font-style:italic;">Click "Forward Pass" to begin. Every computation will be shown here step by step.</span>
    </div>

    <!-- Detailed Walkthrough Panel (new) -->
    <details id="bp-detailed-walkthrough" style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 0;">
        <summary style="padding: 14px 18px; cursor: pointer; font-weight: bold; background: #f8fafc; border-radius: 10px; user-select: none;">
            📖 Show Detailed Hand-Calculation Walkthrough (every single multiplication)
        </summary>
        <div id="bp-detailed-content" class="md" style="padding: 18px; font-size: 0.95rem; line-height: 2.0;">
            <span style="color:#94a3b8; font-style:italic;">Run a forward pass first, then expand this to see every single arithmetic step written out so you can verify with a calculator.</span>
        </div>
    </details>

    <!-- Loss Chart -->
    <div>
        <b>Loss Over Time</b>
        <div id="bp-loss-chart" style="width:100%; height:250px;"></div>
    </div>
</div>

<div class="md" style="margin-top: 30px;">
## What to Watch For

1. **Forward Pass:** Watch the blue signals propagate left-to-right. Each neuron computes a weighted sum, adds a bias, and applies the sigmoid. The final outputs $o_1$ and $o_2$ are compared to the targets to compute the total error.

2. **Backward Pass:** Watch the red gradient signals flow right-to-left. Starting from the loss, each connection receives a gradient computed via the chain rule. Notice how the gradient at each weight is the product of three terms: the upstream error, the local activation derivative, and the input that fed into that weight.

3. **Hover over any neuron:** The weights involved in that neuron's calculation will **pulse gold** on the diagram. During the forward pass, you'll see the incoming weights light up. During the backward pass, you'll see both the incoming weights (that carried the signal forward) and the outgoing weights (that carry the error backward). This makes it visually obvious which connections are involved in each calculation.

4. **Weight Update:** Each weight is nudged in the direction that reduces the error: $w_{\text{new}} = w_{\text{old}} - \eta \cdot \frac{\partial E}{\partial w}$. After updating, run another forward pass to see the loss decrease.

5. **Auto-Train:** Click "Auto-Train 100 Epochs" to watch the loss curve drop. The network will learn to map $(0.05, 0.10)$ to $(0.01, 0.99)$ — watch the outputs converge toward the targets.

6. **Experiment:** Try changing the learning rate. Too high ($> 2$) and the network may overshoot and diverge. Too low ($< 0.01$) and learning is painfully slow. Try changing the initial weights to see how different starting points affect convergence.

## The Full Chain Rule, Expanded — Every Single Step

### For an output-layer weight (e.g., $w_5$ connecting $h_1$ to $o_1$):

We want $\frac{\partial E}{\partial w_5}$. The chain rule says: trace the path from $E$ back to $w_5$ and multiply the derivatives along the way.

**Link 1:** How does $E$ change when $o_1$ changes?
$$\frac{\partial E}{\partial o_1} = \frac{\partial}{\partial o_1}\left[\frac{1}{2}(t_1 - o_1)^2\right] = -(t_1 - o_1)$$

**Link 2:** How does $o_1$ change when $z_{o_1}$ changes? (sigmoid derivative)
$$\frac{\partial o_1}{\partial z_{o_1}} = o_1 \cdot (1 - o_1)$$

**Link 3:** How does $z_{o_1}$ change when $w_5$ changes?
$$\frac{\partial z_{o_1}}{\partial w_5} = h_1 \quad \text{(because } z_{o_1} = w_5 \cdot h_1 + w_6 \cdot h_2 + b_3\text{)}$$

**Multiply all three links together:**
$$\frac{\partial E}{\partial w_5} = \underbrace{-(t_1 - o_1)}_{\text{Link 1}} \cdot \underbrace{o_1(1 - o_1)}_{\text{Link 2}} \cdot \underbrace{h_1}_{\text{Link 3}}$$

**Notice:** Links 1 and 2 together are exactly $\delta_{o_1}$! So:
$$\frac{\partial E}{\partial w_5} = \delta_{o_1} \cdot h_1$$

### For a hidden-layer weight (e.g., $w_1$ connecting $x_1$ to $h_1$):

This is harder because $h_1$ affects **both** $o_1$ and $o_2$, so the error flows back through **two paths**:

**Path A** (through $o_1$): $E \to o_1 \to z_{o_1} \to h_1$
$$\frac{\partial E}{\partial h_1}\bigg|_{\text{via }o_1} = \delta_{o_1} \cdot w_5$$

**Path B** (through $o_2$): $E \to o_2 \to z_{o_2} \to h_1$
$$\frac{\partial E}{\partial h_1}\bigg|_{\text{via }o_2} = \delta_{o_2} \cdot w_7$$

**Total error arriving at $h_1$** (add both paths):
$$\frac{\partial E}{\partial h_1} = \delta_{o_1} \cdot w_5 + \delta_{o_2} \cdot w_7$$

**Then continue the chain through $h_1$'s sigmoid and down to $w_1$:**
$$\frac{\partial E}{\partial w_1} = \underbrace{\left( \delta_{o_1} \cdot w_5 + \delta_{o_2} \cdot w_7 \right)}_{\text{total error at } h_1} \cdot \underbrace{h_1(1 - h_1)}_{\text{sigmoid derivative at } h_1} \cdot \underbrace{x_1}_{\text{input through } w_1}$$

Again, the first two factors together are $\delta_{h_1}$:
$$\frac{\partial E}{\partial w_1} = \delta_{h_1} \cdot x_1$$

## Summary of the $\delta$ Pattern

| Symbol | What it equals | In plain English |
|---|---|---|
| $\delta_{o_1}$ | $-(t_1 - o_1) \times o_1(1-o_1)$ | "How wrong is $o_1$?" × "How steep is the sigmoid at $o_1$?" |
| $\delta_{o_2}$ | $-(t_2 - o_2) \times o_2(1-o_2)$ | Same thing for $o_2$ |
| $\delta_{h_1}$ | $(\delta_{o_1} \cdot w_5 + \delta_{o_2} \cdot w_7) \times h_1(1-h_1)$ | "Total blame from both outputs" × "sigmoid slope at $h_1$" |
| $\delta_{h_2}$ | $(\delta_{o_1} \cdot w_6 + \delta_{o_2} \cdot w_8) \times h_2(1-h_2)$ | "Total blame from both outputs" × "sigmoid slope at $h_2$" |
| $\frac{\partial E}{\partial w}$ | $\delta_{\text{node}} \times \text{input through this weight}$ | "Error signal at the node" × "what flowed through this weight" |
| $w^+ = w - \eta \cdot \frac{\partial E}{\partial w}$ | | "Nudge the weight to reduce the error" |
</div>
