<?php include_once("functions.php"); ?>

<div class="md">
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
</div>

<div id="bp-visual"></div>


<div class="md">
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
</div>
