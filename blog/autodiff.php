<?php include_once("functions.php"); ?>

<div class="md">
\category{math,software}
At the heart of every modern neural network lies a deceptively simple question: *"How much did each weight contribute to the error?"* The answer is computed by a technique called **Automatic Differentiation (AD)**, specifically its *reverse mode*, which underpins the backpropagation algorithm used to train virtually every deep learning model today.

Automatic differentiation is neither symbolic differentiation (manipulating algebraic expressions like a CAS) nor numerical differentiation (using finite differences like $\frac{f(x+h) - f(x)}{h}$). Instead, it is an *exact* method that computes derivatives by systematically applying the **chain rule** to elementary operations recorded on a computational graph, often called a **tape**.

## Historical Origins

The earliest work on what we now call automatic differentiation dates to \citeauthor{wengert1964} in \citeyear{wengert1964}. In his paper \citetitle{wengert1964}, Wengert described a procedure for the automatic evaluation of total and partial derivatives of arbitrary algebraic functions by decomposing them into sequences of elementary expressions, without ever developing symbolic derivative formulas. This forward-mode technique laid the conceptual groundwork for all later AD systems.

The critical extension to **reverse mode** was made by \citeauthor{linnainmaa1976} in his \citeyear{linnainmaa1976} \cite[master's thesis]{linnainmaa1976}. Linnainmaa's original motivation was not neural networks at all, he sought an efficient way to track how rounding errors accumulate through long chains of floating-point computations. His key insight was that by recording each elementary operation and then traversing that record in reverse, one could compute the partial derivatives of the final result with respect to *every* intermediate variable in a single backward pass. Where Wengert's forward mode required one pass per input variable, Linnainmaa's reverse mode required only one pass per *output*, an asymmetry that would prove decisive for training neural networks with millions of parameters and a single scalar loss.

This technique was later independently rediscovered and applied to neural network training by \citeauthor{werbos1974} in his \citeyear{werbos1974} doctoral thesis \citetitle{werbos1974}, where he proposed using reverse-mode AD to compute gradients for multi-layer networks. However, it was the landmark \citeyear{rumelhart1986} paper by \citeauthor{rumelhart1986}, \citetitle{rumelhart1986}, that popularized the method under the name **backpropagation** and demonstrated its practical effectiveness, reigniting interest in connectionist models after the first AI winter.

## Why Not Symbolic or Numerical Differentiation?

Before understanding *how* AD works, it helps to understand *why* the alternatives fail at scale:

**Symbolic Differentiation** (like what Mathematica or Wolfram Alpha does) manipulates algebraic expressions directly. For a simple function like $f(x) = x^2 \sin(x)$, it produces an exact symbolic derivative. However, for a neural network with millions of parameters and deeply nested compositions, the resulting symbolic expressions grow exponentially, a phenomenon called **expression swell**. The derivative of a 100-layer network would be an algebraic expression larger than any computer could store.

**Numerical Differentiation** approximates derivatives using finite differences:

$$\frac{\partial f}{\partial x_i} \approx \frac{f(x_1, \dots, x_i + h, \dots, x_n) - f(x_1, \dots, x_i, \dots, x_n)}{h}$$

This requires **one forward pass per parameter** to compute each partial derivative. For a model with $n$ parameters, that means $n + 1$ forward passes. GPT-3 has 175 billion parameters, numerical differentiation would require 175 billion forward passes per training step. It is also numerically unstable: too large an $h$ introduces truncation error, too small an $h$ introduces floating-point cancellation error.

**Automatic Differentiation** computes exact derivatives (up to floating-point precision) in at most a constant factor more work than the original function evaluation. Reverse-mode AD, specifically, computes the gradient of a scalar output with respect to *all* inputs in a single backward pass, regardless of how many parameters there are.

## The Chain Rule: The Mathematical Engine

The entire machinery of AD rests on the **chain rule** of calculus. If a function $y$ is computed through a chain of intermediate steps:

$$x \xrightarrow{f} u \xrightarrow{g} y$$

Then the derivative of $y$ with respect to $x$ is:

$$\frac{dy}{dx} = \frac{dy}{du} \cdot \frac{du}{dx}$$

For a longer chain $x \to v_1 \to v_2 \to \cdots \to v_k \to y$:

$$\frac{dy}{dx} = \frac{dy}{dv_k} \cdot \frac{dv_k}{dv_{k-1}} \cdots \frac{dv_2}{dv_1} \cdot \frac{dv_1}{dx}$$

AD automates this process by recording each elementary operation and its local derivative, then chaining them together.

## Forward Mode vs. Reverse Mode

There are two "directions" in which the chain rule can be evaluated:

**Forward Mode** propagates derivatives *alongside* the computation, from inputs to outputs. It computes $\frac{\partial v_i}{\partial x}$ for a chosen input $x$ at each step. This is efficient when there are **few inputs and many outputs** (e.g., computing the Jacobian column by column).

**Reverse Mode** first completes the entire forward computation, then propagates derivatives *backward* from the output to all inputs. It computes $\frac{\partial y}{\partial v_i}$ for all intermediate variables $v_i$ in one pass. This is efficient when there are **many inputs and few outputs**, exactly the situation in neural network training, where we have millions of weights (inputs) and a single scalar loss (output).

$$\text{Forward mode cost:} \quad \mathcal{O}(n) \text{ passes for } n \text{ inputs}$$
$$\text{Reverse mode cost:} \quad \mathcal{O}(m) \text{ passes for } m \text{ outputs}$$

Since training always reduces to minimizing a single scalar loss $L$, reverse mode requires only **one** backward pass to get $\frac{\partial L}{\partial w_i}$ for every weight $w_i$. This is why reverse-mode AD (backpropagation) is the universal choice for deep learning.

## The Tape: Recording the Computation

The central data structure in reverse-mode AD is the **computational graph**, colloquially called the **tape** (by analogy with a magnetic tape that records operations sequentially). During the forward pass, every elementary operation, addition, multiplication, exponentiation, activation functions, is recorded on this tape along with its inputs and the local partial derivatives.

## A Concrete Example

Consider the function:

$$f(x, y) = (x + y) \cdot \sin(x)$$

Evaluated at $x = \frac{\pi}{2}, \; y = 1$:

**Step 1 (Forward Pass):** Break the computation into elementary operations and record each one.

| Step | Operation | Result | Local Derivatives |
|------|-----------|--------|-------------------|
| $v_0$ | input $x$ | $\frac{\pi}{2} \approx 1.5708$ | 1 (constant) |
| $v_1$ | input $y$ | $1$ | 1 (constant) |
| $v_2 = v_0 + v_1$ | add | $2.5708$ | $\frac{\partial v_2}{\partial v_0} = 1, \quad \frac{\partial v_2}{\partial v_1} = 1$ |
| $v_3 = \sin(v_0)$ | sin | $1.0$ | $\frac{\partial v_3}{\partial v_0} = \cos(v_0) = 0$ |
| $v_4 = v_2 \cdot v_3$ | multiply | $2.5708$ | $\frac{\partial v_4}{\partial v_2} = v_3 = 1, \quad \frac{\partial v_4}{\partial v_3} = v_2 = 2.5708$ |

**Step 2 (Backward Pass):** Starting from the output $v_4$, propagate the gradient $\bar{v}_i = \frac{\partial f}{\partial v_i}$ backward through the tape.

We use the notation $\bar{v}_i$ (called the **adjoint**) to denote $\frac{\partial f}{\partial v_i}$.

| Step | Adjoint Computation | Value |
|------|---------------------|-------|
| $\bar{v}_4$ | $\frac{\partial f}{\partial v_4} = 1$ (seed) | $1$ |
| $\bar{v}_2$ | $\bar{v}_4 \cdot \frac{\partial v_4}{\partial v_2} = 1 \cdot v_3 = 1 \cdot 1$ | $1$ |
| $\bar{v}_3$ | $\bar{v}_4 \cdot \frac{\partial v_4}{\partial v_3} = 1 \cdot v_2 = 1 \cdot 2.5708$ | $2.5708$ |
| $\bar{v}_0$ | $\bar{v}_2 \cdot \frac{\partial v_2}{\partial v_0} + \bar{v}_3 \cdot \frac{\partial v_3}{\partial v_0} = 1 \cdot 1 + 2.5708 \cdot 0$ | $1$ |
| $\bar{v}_1$ | $\bar{v}_2 \cdot \frac{\partial v_2}{\partial v_1} = 1 \cdot 1$ | $1$ |

**Result:**

$$\frac{\partial f}{\partial x} = \bar{v}_0 = 1, \qquad \frac{\partial f}{\partial y} = \bar{v}_1 = 1$$

We can verify: $f(x,y) = (x+y)\sin(x)$, so $\frac{\partial f}{\partial x} = \sin(x) + (x+y)\cos(x) = 1 + 2.5708 \cdot 0 = 1$ and $\frac{\partial f}{\partial y} = \sin(x) = 1$. ✓

You can explore this process interactively below. Adjust $x$ and $y$ and watch the tape being built and then unwound.
</div>

<!-- ═══════════ Interactive Tape Demo ═══════════ -->
<div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin: 20px 0;">
    <p style="margin-top:0; font-weight: 700;">Interactive: Tape-Based Reverse-Mode AD</p>
    <p style="color:#64748b; font-size:0.9em;">Compute $f(x, y) = (x + y) \cdot \sin(x)$ and watch the forward and backward passes step by step.</p>

    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 15px;">
        <div>
            <strong>$x$:</strong> <span id="disp-ad-x" style="font-family:monospace; font-weight:bold; color:#2563eb;">1.57</span><br>
            <input type="range" id="slider-ad-x" min="-3.14" max="3.14" step="0.01" value="1.57" style="width:200px;">
        </div>
        <div>
            <strong>$y$:</strong> <span id="disp-ad-y" style="font-family:monospace; font-weight:bold; color:#db2777;">1.00</span><br>
            <input type="range" id="slider-ad-y" min="-5" max="5" step="0.01" value="1.00" style="width:200px;">
        </div>
    </div>

    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <button class="btn" id="ad-btn-forward" style="background:#2563eb; color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:600;">▶ Forward Pass</button>
        <button class="btn" id="ad-btn-backward" style="background:#ef4444; color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:600;">◀ Backward Pass</button>
        <button class="btn" id="ad-btn-reset" style="background:#64748b; color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:600;">↺ Reset</button>
    </div>

    <div id="ad-tape-display" style="font-family: monospace; font-size: 0.88rem; line-height: 2; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; min-height: 120px; overflow-x: auto;"></div>

    <div id="ad-result-display" style="text-align: center; font-size: 1.2em; margin-top: 15px; background: #f0fdf4; padding: 12px; border-radius: 8px; border: 1px solid #bbf7d0; min-height: 50px;"></div>
</div>

<div class="md">
## The Computational Graph: Visualizing the Tape

The tape can also be visualized as a **directed acyclic graph (DAG)**, where each node is an operation and each edge carries a value and a local derivative. The forward pass flows left-to-right, and the backward pass flows right-to-left, accumulating gradients via the chain rule at each node.

Below is an interactive visualization of the computational graph for $f(x, y) = (x + y) \cdot \sin(x)$. Hover over any node to see its forward value and backward adjoint.
</div>

<!-- ═══════════ Computational Graph Visualization ═══════════ -->
<div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin: 20px 0;">
    <p style="margin-top:0; font-weight: 700;">Computational Graph</p>
    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 15px;">
        <div>
            <strong>$x$:</strong>
            <input type="range" id="slider-graph-x" min="-3.14" max="3.14" step="0.01" value="1.57" style="width:180px;">
            <span id="disp-graph-x" style="font-family:monospace; font-weight:bold;">1.57</span>
        </div>
        <div>
            <strong>$y$:</strong>
            <input type="range" id="slider-graph-y" min="-5" max="5" step="0.01" value="1.00" style="width:180px;">
            <span id="disp-graph-y" style="font-family:monospace; font-weight:bold;">1.00</span>
        </div>
    </div>
    <svg id="ad-graph-svg" width="100%" viewBox="0 0 750 320" style="background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0; display:block;"></svg>
    <div id="ad-graph-info" style="margin-top: 10px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; min-height: 40px; color: #64748b;">
        Hover over a node to see its details.
    </div>
</div>

<div class="md">
## Gradient Descent on a Loss Landscape

In practice, automatic differentiation is used to compute the gradient $\nabla L(\mathbf{w})$ of a loss function $L$ with respect to all model weights $\mathbf{w}$. The optimizer then updates the weights in the direction that reduces the loss:

$$\mathbf{w}^{(t+1)} = \mathbf{w}^{(t)} - \eta \cdot \nabla L(\mathbf{w}^{(t)})$$

where $\eta$ is the learning rate. This is **gradient descent**, first described by \citeauthor{cauchy1847} in \citeyear{cauchy1847} in \citetitle{cauchy1847}.

The interactive demo below shows gradient descent on a simple 2D loss landscape $L(w_1, w_2) = w_1^2 + w_2^2$ (a paraboloid). The gradient at any point $(w_1, w_2)$ is $\nabla L = (2w_1, 2w_2)$, which always points toward the minimum at the origin. You can adjust the learning rate and starting position to see how the optimizer converges.
</div>

<!-- ═══════════ Gradient Descent Visualization ═══════════ -->
<div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin: 20px 0;">
    <p style="margin-top:0; font-weight: 700;">Interactive: Gradient Descent on $L(w_1, w_2) = w_1^2 + w_2^2$</p>

    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 15px;">
        <div>
            <strong>Learning Rate $\eta$:</strong> <span id="disp-gd-lr" style="font-family:monospace; font-weight:bold; color:#8b5cf6;">0.10</span><br>
            <input type="range" id="slider-gd-lr" min="0.01" max="0.95" step="0.01" value="0.10" style="width:200px;">
        </div>
        <div>
            <strong>Start $w_1$:</strong> <span id="disp-gd-w1" style="font-family:monospace; font-weight:bold;">4.00</span><br>
            <input type="range" id="slider-gd-w1" min="-5" max="5" step="0.1" value="4.0" style="width:200px;">
        </div>
        <div>
            <strong>Start $w_2$:</strong> <span id="disp-gd-w2" style="font-family:monospace; font-weight:bold;">3.00</span><br>
            <input type="range" id="slider-gd-w2" min="-5" max="5" step="0.1" value="3.0" style="width:200px;">
        </div>
    </div>

    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <button class="btn" id="gd-btn-step" style="background:#10b981; color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:600;">Step</button>
        <button class="btn" id="gd-btn-run" style="background:#2563eb; color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:600;">▶ Run 50 Steps</button>
        <button class="btn" id="gd-btn-reset" style="background:#64748b; color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:600;">↺ Reset</button>
    </div>

    <div id="gd-equation" style="text-align: center; font-size: 1.1em; margin-bottom: 10px; min-height: 40px;"></div>

    <div id="plot-gd-landscape" class="plot-container" style="width:100%; height:450px;"></div>

    <div id="gd-loss-readout" style="margin-top: 10px; text-align: center; font-family: monospace; font-size: 1rem; color: #475569;"></div>
</div>

<div class="md">
## Tape-Based AD in Practice: TensorFlow and PyTorch

Modern deep learning frameworks implement reverse-mode AD as a core feature. The two dominant frameworks, \citealternativetitle{tensorflow2016} and \citealternativetitle{pytorch}, take slightly different approaches to building the computational graph, but both ultimately implement the same mathematical principle.

### TensorFlow: Explicit Tape with `GradientTape`

\citealternativetitle{tensorflow2016} uses an **explicit tape** via the `tf.GradientTape()` context manager. You must explicitly tell TensorFlow to start recording operations. This gives you fine-grained control over what gets differentiated.

### PyTorch: Implicit Tape with `autograd`

\citealternativetitle{pytorch} uses an **implicit tape**, any tensor created with `requires_grad=True` automatically records operations performed on it. The tape is built dynamically during the forward pass (this is called **define-by-run** or **eager mode**), which makes debugging more intuitive.

Both approaches produce identical mathematical results. The choice between them is largely a matter of API preference and ecosystem.
</div>

<?php
$autodiffcodetabs = array(
    "PyTorch" => '
<div class="md">
**PyTorch** builds the computational graph implicitly. Any operation on a tensor with `requires_grad=True` is automatically recorded. Calling `.backward()` traverses the tape in reverse to compute all gradients.
</div>
<pre><code class="language-python">import torch

# ── 1. Define inputs as tensors that track gradients ──
x = torch.tensor(2.0, requires_grad=True)
y = torch.tensor(3.0, requires_grad=True)

# ── 2. Forward pass: build the tape implicitly ──
# Every operation on x and y is recorded automatically.
u = x + y          # u = 5.0
v = torch.sin(x)   # v = sin(2.0) ≈ 0.9093
f = u * v          # f = 5.0 * 0.9093 ≈ 4.5465

print(f"f(x, y) = (x + y) * sin(x) = {f.item():.4f}")

# ── 3. Backward pass: unwind the tape ──
# Computes df/dx and df/dy in a single reverse traversal.
f.backward()

print(f"df/dx = {x.grad.item():.4f}")  # sin(x) + (x+y)*cos(x)
print(f"df/dy = {y.grad.item():.4f}")  # sin(x)

# ── 4. Verify analytically ──
import math
analytic_dfdx = math.sin(2.0) + 5.0 * math.cos(2.0)
analytic_dfdy = math.sin(2.0)
print(f"\nAnalytic df/dx = {analytic_dfdx:.4f}")
print(f"Analytic df/dy = {analytic_dfdy:.4f}")

# ── 5. Practical example: one gradient descent step ──
w = torch.tensor([4.0, 3.0], requires_grad=True)
lr = 0.1

loss = (w ** 2).sum()   # L(w) = w1² + w2²
loss.backward()          # dL/dw = [2*w1, 2*w2] = [8.0, 6.0]

with torch.no_grad():
    w -= lr * w.grad     # w_new = [4 - 0.8, 3 - 0.6] = [3.2, 2.4]

print(f"\nAfter 1 step: w = {w.tolist()}, loss = {(w**2).sum().item():.4f}")</code></pre>
',
    "TensorFlow" => '
<div class="md">
**TensorFlow** requires you to explicitly open a `GradientTape` context. Operations inside this context are recorded on the tape. You then call `tape.gradient()` to compute derivatives.
</div>
<pre><code class="language-python">import tensorflow as tf

# ── 1. Define inputs as TF Variables (automatically watched) ──
x = tf.Variable(2.0)
y = tf.Variable(3.0)

# ── 2. Forward pass: record operations on the tape ──
with tf.GradientTape() as tape:
    u = x + y            # u = 5.0
    v = tf.sin(x)        # v = sin(2.0) ≈ 0.9093
    f = u * v            # f = 5.0 * 0.9093 ≈ 4.5465

print(f"f(x, y) = (x + y) * sin(x) = {f.numpy():.4f}")

# ── 3. Backward pass: unwind the tape ──
# Computes df/dx and df/dy in a single reverse traversal.
grad_x, grad_y = tape.gradient(f, [x, y])

print(f"df/dx = {grad_x.numpy():.4f}")  # sin(x) + (x+y)*cos(x)
print(f"df/dy = {grad_y.numpy():.4f}")  # sin(x)

# ── 4. Verify analytically ──
import math
analytic_dfdx = math.sin(2.0) + 5.0 * math.cos(2.0)
analytic_dfdy = math.sin(2.0)
print(f"\nAnalytic df/dx = {analytic_dfdx:.4f}")
print(f"Analytic df/dy = {analytic_dfdy:.4f}")

# ── 5. Practical example: one gradient descent step ──
w = tf.Variable([4.0, 3.0])
lr = 0.1

with tf.GradientTape() as tape:
    loss = tf.reduce_sum(w ** 2)   # L(w) = w1² + w2²

grads = tape.gradient(loss, w)      # dL/dw = [2*w1, 2*w2] = [8.0, 6.0]
w.assign_sub(lr * grads)            # w_new = [4 - 0.8, 3 - 0.6] = [3.2, 2.4]

print(f"\nAfter 1 step: w = {w.numpy().tolist()}, loss = {tf.reduce_sum(w**2).numpy():.4f}")</code></pre>
',
);

render_gem_tabs($autodiffcodetabs, "autodiff");
?>

<div class="md">
### Key Differences at a Glance

| Feature | PyTorch | TensorFlow |
|---------|---------|------------|
| **Tape creation** | Implicit (automatic for `requires_grad=True` tensors) | Explicit (`with tf.GradientTape()`) |
| **Graph mode** | Define-by-run (dynamic) | Eager by default; `@tf.function` for static graphs |
| **Trigger backward** | `loss.backward()` | `tape.gradient(loss, variables)` |
| **Access gradients** | `tensor.grad` attribute | Returned by `tape.gradient()` |
| **Tape persistence** | Consumed after `.backward()` (use `retain_graph=True` to keep) | Consumed after `.gradient()` (use `persistent=True` to keep) |
| **Higher-order derivatives** | Nest `.backward()` calls or use `torch.autograd.grad` | Nest `GradientTape` contexts |

Both frameworks produce mathematically identical gradients. The choice is primarily about API ergonomics and ecosystem preferences.

## Building a Minimal Autograd Engine

To truly understand tape-based Autodifferentiation, it helps to build one from scratch. The following is a minimal but complete implementation of a reverse-mode autograd engine in pure Python. It supports addition, multiplication, and the sine function, enough to differentiate our example $f(x, y) = (x + y) \cdot \sin(x)$.
</div>

<pre><code class="language-python"><?php print get_string_of_file_or_die("py/autodiff/custom.py"); ?></code></pre>

<div class="md">
This minimal engine implements the exact same algorithm that PyTorch and TensorFlow use internally, just without the GPU acceleration, operator overloading for hundreds of operations, and memory optimizations.

## The Vanishing and Exploding Gradient Problem

One critical consequence of tape-based Autodifferentiation in deep networks is the **vanishing gradient problem**, first identified by \citeauthor{hochreiter1991vanishing} in \citeyear{hochreiter1991vanishing} and further analyzed by \citeauthor{bengio1994learning} in \citeyear{bengio1994learning}.

When the chain rule is applied through many layers, the gradient is a product of many local derivatives:

$$\frac{\partial L}{\partial w_1} = \frac{\partial L}{\partial a_n} \cdot \frac{\partial a_n}{\partial z_n} \cdot \frac{\partial z_n}{\partial a_{n-1}} \cdots \frac{\partial a_1}{\partial z_1} \cdot \frac{\partial z_1}{\partial w_1}$$

This is a product of $n$ local derivatives. If each factor is small (say, less than 1), the product shrinks **exponentially** toward zero as $n$ grows, the gradient **vanishes**. Conversely, if each factor is greater than 1, the product **explodes** toward infinity.

### Vanishing Gradients

Consider a network using the sigmoid activation $\sigma(z) = \frac{1}{1+e^{-z}}$. Its derivative is:

$$\sigma'(z) = \sigma(z)(1 - \sigma(z))$$

The maximum value of $\sigma'(z)$ is $0.25$, occurring at $z = 0$. This means that at **every layer**, the gradient is multiplied by a factor of at most $0.25$. For a 10-layer network:

$$\left(0.25\right)^{10} \approx 9.5 \times 10^{-7}$$

The gradient reaching the first layer is less than one millionth of the gradient at the output. The early layers effectively stop learning, they receive no useful signal about how to update their weights.

### Exploding Gradients

The opposite problem occurs when the local derivatives are consistently greater than 1. In recurrent neural networks processing long sequences, the gradient can grow exponentially, causing weight updates so large that the model diverges to $\text{NaN}$.

### Solutions

Several architectural innovations have been developed to combat these problems:

1. **ReLU Activation** (\citeauthor{relupaper}, \citeyear{relupaper}): The Rectified Linear Unit $\text{ReLU}(z) = \max(0, z)$ has a derivative of exactly $1$ for positive inputs, preventing the multiplicative shrinkage that plagues sigmoid networks.

2. **Residual Connections** (\citeauthor{he2015resnet}, \citeyear{he2015resnet}): Skip connections add the input of a block directly to its output: $\mathbf{y} = F(\mathbf{x}) + \mathbf{x}$. This creates a "gradient highway" that allows gradients to bypass problematic layers entirely.

3. **Layer Normalization** (\citeauthor{ba2016layernorm}, \citeyear{ba2016layernorm}): Normalizing activations at each layer keeps values in a well-behaved range, preventing both vanishing and exploding gradients.

4. **Gradient Clipping**: A simple but effective technique that caps the gradient norm at a maximum value, preventing explosions while preserving direction.

You can explore the vanishing gradient problem interactively below. Adjust the number of layers and the activation function to see how the gradient magnitude decays (or explodes) as it propagates backward.
</div>

<!-- ═══════════ Vanishing Gradient Demo ═══════════ -->
<div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin: 20px 0;">
    <p style="margin-top:0; font-weight: 700;">Interactive: Vanishing & Exploding Gradients</p>
    <p style="color:#64748b; font-size:0.9em;">See how the gradient magnitude changes as it flows backward through $n$ layers, each multiplying by the maximum activation derivative.</p>

    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 15px;">
        <div>
            <strong>Layers $n$:</strong> <span id="disp-vg-layers" style="font-family:monospace; font-weight:bold; color:#2563eb;">10</span><br>
            <input type="range" id="slider-vg-layers" min="1" max="50" step="1" value="10" style="width:200px;">
        </div>
        <div>
            <strong>Activation:</strong><br>
            <select id="select-vg-activation" style="padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem;">
                <option value="sigmoid" selected>Sigmoid (max deriv = 0.25)</option>
                <option value="tanh">Tanh (max deriv = 1.0)</option>
                <option value="relu">ReLU (deriv = 1.0 for z > 0)</option>
                <option value="explode">Unstable (deriv = 1.5)</option>
            </select>
        </div>
    </div>

    <div id="vg-formula" style="text-align: center; font-size: 1.1em; margin-bottom: 10px; background: #f8fafc; padding: 10px; border-radius: 8px; min-height: 40px;"></div>

    <div id="plot-vg-gradient" class="plot-container" style="width:100%; height:350px;"></div>

    <div id="vg-verdict" style="margin-top: 10px; text-align: center; font-size: 1rem; padding: 10px; border-radius: 8px; min-height: 40px;"></div>
</div>

<div class="md">
## Dynamic vs. Static Computational Graphs

An important distinction in modern AD frameworks is whether the computational graph is built **statically** (before execution) or **dynamically** (during execution).

**Static Graphs** (TensorFlow 1.x, early Theano): The entire computation is defined symbolically before any data flows through it. This allows aggressive compiler-level optimizations but makes debugging difficult, you cannot simply insert a `print()` statement to inspect intermediate values.

**Dynamic Graphs** (PyTorch, TensorFlow 2.x eager mode): The graph is built on-the-fly as operations execute. Each forward pass constructs a fresh tape, which is then consumed during the backward pass. This "define-by-run" approach is more intuitive and Pythonic, allowing standard control flow (`if`, `for`, `while`) to be used naturally within the model.

The Transformer architecture, released in \citeyear{vaswani2017attention}, which powers modern LLMs like GPT, relies heavily on dynamic computation patterns (variable-length sequences, masked attention), making dynamic graphs the natural choice. This is one reason PyTorch became the dominant framework in research.

## Summary

| Concept | Key Idea |
|---------|----------|
| **Automatic Differentiation** | Exact derivatives via systematic chain rule application |
| **The Tape** | A record of all elementary operations during the forward pass |
| **Reverse Mode** | Computes gradients of one output w.r.t. all inputs in one backward pass |
| **Forward Mode** | Computes derivatives of all outputs w.r.t. one input per pass |
| **Vanishing Gradients** | Product of small derivatives → gradient dies in deep networks |
| **Exploding Gradients** | Product of large derivatives → gradient diverges |
| **Dynamic Graphs** | Tape built during execution (PyTorch, TF2 eager) |
| **Static Graphs** | Tape defined before execution (TF1, compiled mode) |

Automatic differentiation is the invisible engine of modern AI. Every time a model learns, every weight update, every gradient descent step, every backpropagation pass, it is the tape being built and unwound, the chain rule being applied mechanically and exactly, at a scale that \citeauthor{linnainmaa1976} could never have imagined when he first described the algorithm in \citeyear{linnainmaa1976}.
</div>
