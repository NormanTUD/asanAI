<?php include_once("functions.php"); ?>

<div class="md">
Backpropagation is a method to improve a neural network by systematically adjusting its weights and biases based on the error it makes. It uses two main steps:

1. **Forward Pass**: Inputs are passed through the network layer by layer, producing outputs (predictions).
2. **Backward Pass**: The error (difference between prediction and target) is sent backward through the network, and each weight is updated to reduce the error.

## Our Example Network

We use a simple neural network with:

- **2 Inputs**: $x_1$ and $x_2$
- **2 Hidden Neurons**: $h_1$ and $h_2$
- **2 Outputs**: $o_1$ and $o_2$

Each connection has a weight (e.g., $w_1, w_2$) and each neuron has a bias (e.g., $b_1$).

$$
\mathbf{x} = \begin{pmatrix} x_1 \\ x_2 \end{pmatrix}
\longrightarrow \mathbf{h} = \begin{pmatrix} h_1 \\ h_2 \end{pmatrix}
\longrightarrow \mathbf{o} = \begin{pmatrix} o_1 \\ o_2 \end{pmatrix}
$$

## Mathematics Behind the Network

At each layer, the neurons first calculate a weighted sum of their inputs (plus a bias) and then apply the **sigmoid function**:

$$
z = w \cdot x + b \quad \text{and} \quad \sigma(z) = \frac{1}{1 + e^{-z}}
$$

The sigmoid function "squashes" any number into the range (0, 1), which is useful for keeping values bounded and for computing smooth gradients.

## The Sigmoid Derivative

The derivative of the sigmoid function is simple and efficient to calculate:

$$
\sigma'(z) = \sigma(z) \cdot (1 - \sigma(z))
$$

This means that once we know the output of a sigmoid neuron, we can instantly compute its derivative.

<div id="sigmoid-plot" style="width: 100%; height: 500px;"></div>

## Loss Function

The network's error is measured using the **Mean Squared Error (MSE)**:

$$
E_{\text{total}} = \sum_i \frac{1}{2}(t_i - o_i)^2
$$

Here, $t_i$ is the target value, and $o_i$ is the network's output. The factor $\frac{1}{2}$ is included for convenience, as it cancels out when taking derivatives.

## Backward Pass: Updating Weights

The backward pass uses the **chain rule** to compute how much each weight contributed to the total error. For any weight $w$, the change is proportional to:

$$
\frac{\partial E}{\partial w} = \delta \cdot \text{input}
$$

Where:

- $\delta$ is the **error signal** at the receiving neuron.
- **input** is the value that flowed through the weight during the forward pass.

## What is $\delta$?

The term $\delta$ quantifies how much a neuron contributed to the total error:

**For Output Neurons:** $\delta_{\text{output}} = -(t - o) \cdot o \cdot (1 - o)$

**For Hidden Neurons:** $\delta_{\text{hidden}} = (\delta_{\text{next}} \cdot w_{\text{next}}) \cdot h \cdot (1 - h)$

## Weight Updates

Once we calculate $\delta$, we update the weights to reduce the error:

$$
w_{\text{new}} = w - \eta \cdot \frac{\partial E}{\partial w}
$$

Where $\eta$ is the learning rate.

## Example Calculations

### For a weight $w_5$ connecting $h_1$ to $o_1$:

1. Compute $\delta_{\text{o1}}$:
   $$
   \delta_{o_1} = -(t_1 - o_1) \cdot o_1 \cdot (1 - o_1)
   $$

2. Compute the gradient:
   $$
   \frac{\partial E}{\partial w_5} = \delta_{o_1} \cdot h_1
   $$

3. Update the weight:
   $$
   w_5^{\text{new}} = w_5 - \eta \cdot \frac{\partial E}{\partial w_5}
   $$

## Key Insights

- Errors flow backward through the network, layer by layer.
- Each weight gets updated based on its contribution to the error.
- The process can be calculated step by step by hand to understand how backpropagation works.

</div>

<div id="bp-visual"></div>
