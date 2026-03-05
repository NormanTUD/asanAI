<?php include_once("functions.php"); ?>

<div class="md">
## Derivatives: The Mathematics of Change

The concept of a **derivative** is one of the most important ideas in all of mathematics. It answers a deceptively simple question: *How fast is something changing at this exact moment?*

If you drive a car and your speedometer reads 60 km/h, that number is a derivative, it tells you the instantaneous rate of change of your position with respect to time. But how do we define "instantaneous" mathematically, when an instant has zero duration?

This question puzzled mathematicians for centuries, and its resolution gave birth to an entire branch of mathematics: **Calculus**.

### A Brief History: Who Invented Derivatives?

The development of calculus is one of the most famous (and contentious) stories in the history of science. Two towering figures independently developed the core ideas in the late 17th century.

**Isaac Newton** (1642–1727) developed his "method of fluxions" around 1665–1666, motivated by problems in physics, he needed a way to describe the motion of planets and falling objects. He thought of quantities as "flowing" and their rates of change as "fluxions." Newton's approach was deeply rooted in the physical world: velocity is the fluxion of position, and acceleration is the fluxion of velocity. However, Newton was notoriously secretive and did not publish his methods until decades later.

**Gottfried Wilhelm Leibniz** (1646–1716), working independently in the 1670s and 1680s, developed his own version of calculus with a focus on notation and formal manipulation. His notation, the $\frac{dy}{dx}$ that we still use today, was published in \citeyear{leibniz1684nova} in his paper \citetitle{leibniz1684nova}. Leibniz's genius lay in creating a symbolic language so powerful and intuitive that it made calculus accessible and practical. As \citeauthor{historyofmathematicalnotation} notes (Vol. 2, p. 197ff), Leibniz's differential notation proved far more influential than Newton's dot notation for the long-term development of analysis.

The bitter priority dispute between Newton and Leibniz, fueled by nationalistic pride between England and continental Europe, overshadowed the fact that both men made monumental contributions. Today, historians recognize that both arrived at the fundamental ideas independently. We use Leibniz's notation ($\frac{dy}{dx}$, $\int$) almost universally, while Newton's physical intuition shaped the application of calculus to science.

Before both of them, \citeauthor{oevresdeformat} had already explored the idea of finding tangent lines to curves using algebraic methods in the 1630s (see \citetitle{oevresdeformat}), and the concept of infinitesimals was discussed by mathematicians like Bonaventura Cavalieri and John Wallis (\citetitle{wallis1655}, \citeyear{wallis1655}). But it was Newton and Leibniz who unified these scattered ideas into a coherent, general framework.

### The Limit Definition of the Derivative

The derivative is built on the concept of a **limit**, which we introduced earlier. The key idea is to start with something we *can* compute, the average rate of change over an interval, and then shrink that interval to zero.

#### The Average Rate of Change (The Secant Line)

Given a function $f(x)$, the **average rate of change** between two points $x$ and $x + h$ is:

$$\frac{f(x + h) - f(x)}{h}$$

Geometrically, this is the slope of the **secant line** connecting the two points $(x, f(x))$ and $(x+h, f(x+h))$ on the graph of $f$.

#### The Instantaneous Rate of Change (The Tangent Line)

The **derivative** is what happens when we let $h$ approach zero. The secant line becomes a **tangent line**, touching the curve at exactly one point:

$$f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}$$

This is the **limit definition of the derivative**, sometimes called the definition "from first principles." The notation $f'(x)$ (read "f prime of x") was introduced by \citeauthor{lagrange1797theorie} in \citetitle{lagrange1797theorie} (\citeyear{lagrange1797theorie}). Leibniz wrote the same concept as $\frac{df}{dx}$.

You can explore this visually below. Drag the slider to move the second point closer to the first and watch the secant line become the tangent line:
</div>

<!-- ─── Interactive: Secant → Tangent ─── -->
<div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin: 20px 0;">
    <p style="margin-top:0;"><strong>From Secant to Tangent</strong></p>
    <p style="color:#64748b; font-size:0.9em;">The function is $f(x) = x^2$. Drag $h$ towards zero and watch the secant line become the tangent line at $x = 1$.</p>

    <div style="margin-bottom:10px;">
        <strong>$h$:</strong>
        <input type="range" id="slider-deriv-h" min="0.01" max="3" step="0.01" value="2" style="width:300px;">
        <span id="disp-deriv-h" style="font-family:monospace; font-weight:bold; color:#2563eb;">2.00</span>
    </div>

    <div id="deriv-secant-formula" style="text-align:center; font-size:1.1em; margin:10px 0; background:#f8fafc; padding:10px; border-radius:6px; min-height:50px; font-size: 0.8em;"></div>

    <div id="plot-secant-tangent" class="plot-container" style="width:100%; height:400px;"></div>
</div>

<div class="md">
#### A Concrete Example: Deriving $f(x) = x^2$ from First Principles

Let's apply the limit definition to $f(x) = x^2$ step by step:

$$f'(x) = \lim_{h \to 0} \frac{(x+h)^2 - x^2}{h}$$

Expand $(x+h)^2 = x^2 + 2xh + h^2$:

$$= \lim_{h \to 0} \frac{x^2 + 2xh + h^2 - x^2}{h} = \lim_{h \to 0} \frac{2xh + h^2}{h}$$

Factor out $h$:

$$= \lim_{h \to 0} (2x + h) = 2x$$

So the derivative of $x^2$ is $2x$. At $x = 3$, the slope of the tangent line is $2 \cdot 3 = 6$. This means that at $x = 3$, the function is increasing at a rate of 6 units of $y$ per unit of $x$.

### Derivative Rules

Computing derivatives from the limit definition every time would be tedious. Fortunately, mathematicians have derived a set of **rules** that let us differentiate most functions quickly. These rules were developed by Newton, Leibniz, and their successors (notably \citeauthor{euler1755} in \citetitle{euler1755}, \citeyear{euler1755}, who systematized much of the notation and theory).

#### The Constant Rule

The derivative of a constant is zero. A constant doesn't change, so its rate of change is zero:

$$\frac{d}{dx}[c] = 0$$

#### The Power Rule

For any real number $n$:

$$\frac{d}{dx}[x^n] = n \cdot x^{n-1}$$

This is the workhorse of differentiation. For example:
- $\frac{d}{dx}[x^3] = 3x^2$
- $\frac{d}{dx}[x^{-1}] = -x^{-2} = -\frac{1}{x^2}$
- $\frac{d}{dx}[\sqrt{x}] = \frac{d}{dx}[x^{1/2}] = \frac{1}{2}x^{-1/2} = \frac{1}{2\sqrt{x}}$

#### The Constant Multiple Rule

$$\frac{d}{dx}[c \cdot f(x)] = c \cdot f'(x)$$

You can "pull out" constants. For example: $\frac{d}{dx}[5x^3] = 5 \cdot 3x^2 = 15x^2$.

#### The Sum Rule

$$\frac{d}{dx}[f(x) + g(x)] = f'(x) + g'(x)$$

The derivative of a sum is the sum of the derivatives.

#### The Product Rule

When two functions are multiplied, the derivative is not simply the product of the derivatives. Instead:

$$\frac{d}{dx}[f(x) \cdot g(x)] = f'(x) \cdot g(x) + f(x) \cdot g'(x)$$

#### The Quotient Rule

$$\frac{d}{dx}\left[\frac{f(x)}{g(x)}\right] = \frac{f'(x) \cdot g(x) - f(x) \cdot g'(x)}{[g(x)]^2}$$

#### The Chain Rule

The **Chain Rule** is arguably the most important rule for AI and deep learning. It tells us how to differentiate **composed functions**, functions inside functions:

$$\frac{d}{dx}[f(g(x))] = f'(g(x)) \cdot g'(x)$$

Or in Leibniz notation, if $y = f(u)$ and $u = g(x)$:

$$\frac{dy}{dx} = \frac{dy}{du} \cdot \frac{du}{dx}$$

This is the mathematical foundation of **backpropagation** in neural networks. When a neural network chains together many layers of functions, the chain rule lets us compute how the final error depends on each individual weight, no matter how deep the network is.

You can explore the derivative rules interactively below. Choose a function and see its derivative computed and plotted in real time:
</div>

<!-- ─── Interactive: Derivative Rules Explorer ─── -->
<div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin: 20px 0;">
    <p style="margin-top:0;"><strong>Derivative Rules Explorer</strong></p>
    <p style="color:#64748b; font-size:0.9em;">Select a function to see its derivative. The <span style="color:#2563eb;font-weight:bold;">blue</span> curve is $f(x)$ and the <span style="color:#ef4444;font-weight:bold;">red</span> curve is $f'(x)$.</p>

    <div style="margin-bottom:10px;">
        <strong>Function:</strong>
        <select id="select-deriv-rule" style="padding:5px 10px; border-radius:4px; border:1px solid #cbd5e1; font-size:0.95em;">
		<option value="x2">Power Rule: f(x) = x²</option>
		<option value="x3">Power Rule: f(x) = x³</option>
		<option value="sqrt">Power Rule: f(x) = sqrt(x)</option>
		<option value="sin">Trig: f(x) = sin(x)</option>
		<option value="cos">Trig: f(x) = cos(x)</option>
		<option value="ex">Exponential: f(x) = eˣ</option>
		<option value="ln">Logarithm: f(x) = ln(x)</option>
		<option value="product">Product Rule: f(x) = x² sin(x)</option>
		<option value="chain">Chain Rule: f(x) = sin(x²)</option>
	</select>

    </div>

    <div id="deriv-rule-formula" style="text-align:center; font-size:1.15em; margin:10px 0; background:#f8fafc; padding:12px; border-radius:6px; min-height:50px;"></div>

    <div id="plot-deriv-rules" class="plot-container" style="width:100%; height:400px;"></div>
</div>

<div class="md">
### Special Derivatives Worth Knowing

Some derivatives appear so frequently in AI and science that they are worth memorizing:

| Function $f(x)$ | Derivative $f'(x)$ | Notes |
|---|---|---|
| $x^n$ | $nx^{n-1}$ | Power Rule |
| $e^x$ | $e^x$ | The only function equal to its own derivative! |
| $\ln(x)$ | $\frac{1}{x}$ | Natural logarithm |
| $\sin(x)$ | $\cos(x)$ | |
| $\cos(x)$ | $-\sin(x)$ | |
| $\sigma(x) = \frac{1}{1+e^{-x}}$ | $\sigma(x)(1-\sigma(x))$ | The sigmoid, crucial for neural networks |

The fact that $e^x$ is its own derivative is not a coincidence, it is essentially the *definition* of $e$. The number $e$ is the unique base for which the exponential function has this self-replicating property.

### The Geometric Meaning: Tangent Lines

The derivative $f'(a)$ gives the **slope of the tangent line** to the graph of $f$ at the point $x = a$. The equation of this tangent line is:

$$y = f(a) + f'(a)(x - a)$$

This is the best **linear approximation** of $f$ near $x = a$. In fact, this idea generalizes: the Taylor series (which we saw earlier for $\sin$ and $e$) is built by adding higher-order derivatives to get better and better polynomial approximations.

You can explore the tangent line interactively below. Move the point along the curve and see how the tangent line changes:
</div>

<!-- ─── Interactive: Tangent Line Explorer ─── -->
<div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin: 20px 0;">
    <p style="margin-top:0;"><strong>Tangent Line Explorer</strong></p>
    <p style="color:#64748b; font-size:0.9em;">Move the point along $f(x) = x^3 - 3x$ and see the tangent line. Notice where the derivative is zero (horizontal tangent), these are the local maxima and minima!</p>

    <div style="margin-bottom:10px;">
        <strong>$x = $</strong>
        <input type="range" id="slider-tangent-x" min="-2.5" max="2.5" step="0.01" value="1.5" style="width:300px;">
        <span id="disp-tangent-x" style="font-family:monospace; font-weight:bold; color:#2563eb;">1.50</span>
    </div>

    <div id="tangent-info" style="text-align:center; font-size:1.1em; margin:10px 0; background:#f8fafc; padding:10px; border-radius:6px; min-height:50px; font-size: 0.8em;"></div>

    <div id="plot-tangent-line" class="plot-container" style="width:100%; height:400px;"></div>
</div>

<div class="md">
### The Chain Rule Visualized

The chain rule is so important for AI that it deserves its own interactive demonstration. When we compose two functions $f(g(x))$, the chain rule tells us:

$$\frac{d}{dx}[f(g(x))] = \underbrace{f'(g(x))}_{\text{outer derivative}} \cdot \underbrace{g'(x)}_{\text{inner derivative}}$$

Think of it as peeling an onion: differentiate the outer layer, leaving the inner part untouched, then multiply by the derivative of the inner part.

In a neural network with layers $L_1, L_2, \dots, L_n$, the chain rule extends naturally:

$$\frac{\partial \text{Loss}}{\partial w_1} = \frac{\partial \text{Loss}}{\partial L_n} \cdot \frac{\partial L_n}{\partial L_{n-1}} \cdots \frac{\partial L_2}{\partial L_1} \cdot \frac{\partial L_1}{\partial w_1}$$

This is exactly what **backpropagation** computes, the chain rule applied layer by layer from the output back to the input.
</div>

<!-- ─── Interactive: Chain Rule Demo ─── -->
<div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin: 20px 0;">
    <p style="margin-top:0;"><strong>Chain Rule: Composing Functions</strong></p>
    <p style="color:#64748b; font-size:0.9em;">See how $f(g(x)) = \sin(ax)$ is differentiated using the chain rule. The outer function is $\sin(u)$ and the inner function is $u = ax$.</p>

    <div style="margin-bottom:10px;">
        <strong>$a$ (inner multiplier):</strong>
        <input type="range" id="slider-chain-a" min="0.5" max="4" step="0.1" value="2" style="width:250px;">
        <span id="disp-chain-a" style="font-family:monospace; font-weight:bold; color:#2563eb;">2.0</span>
    </div>

    <div id="chain-rule-formula" style="text-align:center; font-size:1.1em; margin:10px 0; background:#f8fafc; padding:12px; border-radius:6px; min-height:60px;"></div>

    <div id="plot-chain-rule" class="plot-container" style="width:100%; height:400px;"></div>
</div>

<div class="md">
### Why Derivatives Matter for AI

Derivatives are not just an abstract mathematical concept, they are the **engine** that drives all of modern machine learning. Here is why:

1. **Gradient Descent**: To train a neural network, we need to minimize a **loss function** that measures how wrong the model's predictions are. The derivative (or **gradient**, in multiple dimensions) tells us which direction to adjust the weights to reduce the loss. This is the algorithm called **Gradient Descent**, first described by \citeauthor{cauchy1847} in \citeyear{cauchy1847}.

2. **Backpropagation**: As we saw, the **chain rule** allows us to compute the gradient of the loss with respect to every single weight in a deep network, no matter how many layers it has. This algorithm, popularized by \citeauthor{rumelhart1986} in \citeyear{rumelhart1986}, is what makes deep learning possible.

3. **Optimization Landscape**: The derivative tells us about the "shape" of the loss function, where it slopes up, where it slopes down, and where it is flat (critical points). Understanding this landscape is key to training models effectively.

4. **The Sigmoid Derivative**: As we saw in the backpropagation section, the sigmoid function $\sigma(z) = \frac{1}{1+e^{-z}}$ has the elegant derivative $\sigma'(z) = \sigma(z)(1-\sigma(z))$. This means once you compute the forward pass, the backward pass is nearly free, you already have all the values you need.

In summary, without derivatives, there would be no way to train neural networks, and modern AI as we know it would not exist.

### Partial Derivatives: Functions of Multiple Variables

In AI, we almost never deal with functions of a single variable. A neural network's loss depends on millions of weights simultaneously. A **partial derivative** measures how the function changes when we vary *one* variable while holding all others constant.

For a function $f(x, y)$, the partial derivatives are:

$$\frac{\partial f}{\partial x} \quad \text{(vary } x \text{, hold } y \text{ constant)}$$
$$\frac{\partial f}{\partial y} \quad \text{(vary } y \text{, hold } x \text{ constant)}$$

The collection of all partial derivatives forms the **gradient vector**:

$$\nabla f = \begin{pmatrix} \frac{\partial f}{\partial x} \\ \frac{\partial f}{\partial y} \end{pmatrix}$$

The gradient points in the direction of **steepest ascent**. To minimize a function (like a loss function), we move in the *opposite* direction of the gradient, this is **gradient descent**.

The symbol $\partial$ for partial derivatives was introduced by \citeauthor{legendre1805} in \citetitle{legendre1805} (\citeyear{legendre1805}).
</div>

<!-- ─── Interactive: Gradient on a 3D Surface ─── -->
<div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin: 20px 0;">
    <p style="margin-top:0;"><strong>Gradient Descent on a Surface</strong></p>
    <p style="color:#64748b; font-size:0.9em;">The surface is $f(x,y) = x^2 + y^2$ (a simple "bowl"). The red arrow shows the negative gradient direction, the direction gradient descent would move. Drag the point to see how the gradient changes.</p>

    <div style="display:flex; flex-wrap:wrap; gap:20px; margin-bottom:10px;">
        <div>
            <strong>$x$:</strong>
            <input type="range" id="slider-grad-x" min="-3" max="3" step="0.1" value="2" style="width:180px;">
            <span id="disp-grad-x" style="font-family:monospace; font-weight:bold;">2.0</span>
        </div>
        <div>
            <strong>$y$:</strong>
            <input type="range" id="slider-grad-y" min="-3" max="3" step="0.1" value="1.5" style="width:180px;">
            <span id="disp-grad-y" style="font-family:monospace; font-weight:bold;">1.5</span>
        </div>
    </div>

    <div id="gradient-info" style="text-align:center; font-size:1.05em; margin:10px 0; background:#f8fafc; padding:10px; border-radius:6px; min-height:50px;"></div>

    <div id="plot-gradient-surface" class="plot-container" style="width:100%; height:450px;"></div>
</div>

<div class="md">
### Summary

| Concept | Notation | Meaning |
|---|---|---|
| Derivative | $f'(x)$ or $\frac{df}{dx}$ | Instantaneous rate of change |
| Limit definition | $\lim_{h \to 0} \frac{f(x+h)-f(x)}{h}$ | Formal definition |
| Chain rule | $\frac{dy}{dx} = \frac{dy}{du} \cdot \frac{du}{dx}$ | Derivatives of composed functions |
| Partial derivative | $\frac{\partial f}{\partial x}$ | Rate of change in one variable |
| Gradient | $\nabla f$ | Vector of all partial derivatives |

The derivative is the bridge between static mathematics and dynamic change. It is the tool that lets us ask "what happens next?" and, in the context of AI, "how should we adjust?" Without it, machines could not learn.
</div>
