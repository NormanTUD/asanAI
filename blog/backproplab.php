<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Backpropagation: How a Neural Network Learns From Its Mistakes
description: The 1986 algorithm that made deep learning possible — see forward pulses, backward error flow, and drill into every equation.
icon: &#8634;
part: 2
order: 5
color: coral
topics: math-i, programming, training
-->

<div class="md">

Backpropagation, introduced to the field of AI in \citeyear{rumelhart1986}, is how a neural network **learns from its own mistakes**. It has two heartbeats:

1. **Forward Pass** — inputs flow *left → right* through the layers, producing a prediction.
2. **Backward Pass** — the error flows *right → left*, telling each weight exactly how much to change.

In the demo further down you can *watch* both flows as glowing pulses along the wires, click any neuron or weight to unfold its equations, and click any symbol *inside* an equation to substitute its definition — drilling all the way down to raw inputs.

## The Network You'll Play With

Instead of a toy 2‑2‑2 net, the demo below runs a **4-layer network** with shape **3 → 4 → 4 → 2**. That's small enough to hand‑trace, deep enough to show how error signals *cascade* backward layer by layer — the exact behaviour that makes "deep" learning deep.

$$
\underbrace{\mathbf{x} \in \mathbb{R}^3}_{\text{inputs}}
\;\longrightarrow\;
\underbrace{\mathbf{h}^{(1)} \in \mathbb{R}^4}_{\text{hidden 1}}
\;\longrightarrow\;
\underbrace{\mathbf{h}^{(2)} \in \mathbb{R}^4}_{\text{hidden 2}}
\;\longrightarrow\;
\underbrace{\mathbf{o} \in \mathbb{R}^2}_{\text{outputs}}
$$

Every arrow between layers is a **weight** $w$; every neuron also owns a **bias** $b$.

## One Neuron, In Slow Motion

Each neuron does two things:

$$
z \;=\; \underbrace{\sum_j w_j \cdot \text{in}_j}_{\text{weighted sum}} \;+\; \underbrace{b}_{\text{bias}}
\qquad\qquad
a \;=\; \sigma(z) \;=\; \frac{1}{1 + e^{-z}}
$$

The **sigmoid** squashes any real number into $(0, 1)$. Its derivative — which we'll need for backprop — is delightfully cheap once you already know $\sigma(z)$:

$$
\sigma'(z) \;=\; \sigma(z)\,\bigl(1 - \sigma(z)\bigr)
$$

Hover the plot below to see the tangent slope at any point:

<div id="sigmoid-plot" style="width: 100%; height: 460px;"></div>

## The Loss — "How Wrong Are We?"

We measure error with the **half sum-of-squares**:

$$
E \;=\; \sum_i \tfrac{1}{2}\,(t_i - o_i)^2
$$

The $\tfrac{1}{2}$ is a convenience — it cancels when we differentiate. (The standard **MSE** used elsewhere in the course is the same shape, just averaged over the batch.)

## The Chain Rule Is All You Need

To learn, we need $\partial E / \partial w$ for every weight $w$ in the network. Instead of computing each one from scratch, backprop reuses work by pushing an **error signal** $\delta$ backward, layer by layer.

**At the output layer** (sigmoid + half-SSE):

$$
\delta_{o_i} \;=\; -\bigl(t_i - o_i\bigr)\cdot o_i\,(1 - o_i)
$$

**At any hidden layer** (chain rule):

$$
\delta^{(\ell)} \;=\; \Bigl(W^{(\ell+1)\,\top}\,\delta^{(\ell+1)}\Bigr) \;\odot\; \sigma'\!\bigl(z^{(\ell)}\bigr)
$$

That's the whole trick. Once you have $\delta$ at a neuron, the gradient for any weight *feeding into* it is trivial:

$$
\frac{\partial E}{\partial w} \;=\; \delta_{\text{receiver}} \,\cdot\, \text{activation}_{\text{sender}}
$$

And the update is a small step downhill:

$$
w \;\leftarrow\; w \;-\; \eta \cdot \frac{\partial E}{\partial w}
$$

where $\eta$ is the **learning rate**.

## Now Watch It Happen

Below is a live network. Try this in order:

1. **Press ▶ Forward** — watch cyan pulses travel left→right, thickness ∝ activation magnitude.
2. **Press ◀ Backward** — watch red pulses travel right→left, thickness ∝ $|\delta|$ magnitude.
3. **Hover any neuron** — a *cone of influence* lights up every weight it touches, colored by that weight's contribution.
4. **Click any neuron or weight** — the side panel expands the full equation.
5. **Inside the equation, click any coloured symbol** (e.g. $h_1^{(2)}$) — it *expands in place* into its own definition. Click again to collapse. Chain expansions arbitrarily deep to unfold the entire computation graph from a single symbol down to raw $x_i$.
6. **Press ↻ Train 100** — watch the loss bar shrink as the whole network adapts.

</div>

<div id="bp-visual"></div>
