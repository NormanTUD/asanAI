<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Derivatives: How AI "Learns" to get better
description: Understanding gradients, the simplest form of the learning signal, and how AI finds its way downhill.
icon: &#9889;
part: 2
order: 2
color: coral
topics: math-i, programming
tags: math-heavy, code-heavy
-->

<div class="md" data-mathlevel="55">
    In AI, we don't always know the right answer immediately. Instead, we use a **Loss Function**, think of this as a “Scoreboard” that tells us how many mistakes the AI is making. 

    The goal of an AI is to get the lowest score possible (zero mistakes). To do that, the AI has to figure out which direction to move to find the bottom of the valley.

    ## Finding the Way Down
    Imagine you are standing on a foggy mountain. You can't see the bottom, but you can feel the ground under your feet. To find the way down, you:
    1.  **Look Ahead:** Take a tiny “probe” step ($h$) to the side.
    2.  **Check the Change:** See if that step made your height go up or down.
    3.  **Calculate the Slope:** This tells you how steep the hill is right where you are standing.
    
    In math, we write this simple “steepness check” like this:
    
    $$\text{Slope} \approx \frac{f(x + h) - f(x)}{h}$$
    
    ### Moving Toward the Goal: Gradient Descent
    Once the AI knows which way is “downhill,” it updates its position. This is called **Gradient Descent**. 
    
    * **The Slope:** Tells us the direction.
    * **The Learning Rate:** Tells us how big of a step to take.
    * **The Update:** If the slope is positive (going up), the AI moves the opposite way to go down.

    $$x_{\text{new}} = x_{\text{old}} - (\text{Learning Rate} \times \text{Slope})$$
</div>

<style>
#slope-lab { --lab-accent: var(--mn-accent); --lab-accent-2: var(--mn-emerald); }
#slope-lab .sl-plot { height: 380px; width: 100%; }
#slope-lab .mnlab-stat[data-tone="bad"] .v { color: var(--mn-rose); }
#slope-lab .mnlab-stat[data-tone="good"] .v { color: var(--mn-emerald); }
#slope-lab .sl-key { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; vertical-align: 0; }
#slope-lab .sl-math { display: flex; flex-direction: column; gap: 10px; font-family: var(--mn-font-mono); font-size: .9rem; color: var(--mn-heading); font-variant-numeric: tabular-nums; }
#slope-lab .sl-eq { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; }
#slope-lab .sl-lbl { color: var(--mn-text-secondary); min-width: 5.5ch; }
#slope-lab .sl-frac { display: inline-flex; flex-direction: column; align-items: center; text-align: center; line-height: 1.25; }
#slope-lab .sl-frac > span:first-child { border-bottom: 1.5px solid currentColor; padding: 0 4px 2px; }
#slope-lab .sl-frac > span:last-child { padding: 2px 4px 0; }
#slope-lab .sl-hi { color: var(--mn-accent); font-size: 1.05em; }
@container mnlab (max-width: 620px) {
	#slope-lab .sl-plot { height: 300px; }
	#slope-lab .sl-math { font-size: .8rem; }
}
</style>

<div class="mnlab" id="slope-lab" data-interactive>
	<div class="mnlab-head">
		<div>
			<div class="mnlab-kicker">Interactive lab</div>
			<div class="mnlab-title">Slope Explorer</div>
			<p class="mnlab-sub">Measure the steepness with a look-ahead step, then let gradient descent walk downhill on that measurement. Click anywhere on the curve to drop the ball there.</p>
		</div>
		<div class="mnlab-chips" role="group" aria-label="Landscape">
			<button type="button" class="mnlab-chip" data-land="valley" aria-pressed="true">Valley x²</button>
			<button type="button" class="mnlab-chip" data-land="waves" aria-pressed="false">Waves cos x</button>
			<button type="button" class="mnlab-chip" data-land="hills" aria-pressed="false">Two valleys</button>
		</div>
	</div>

	<div class="mnlab-well" style="padding: 8px 6px 4px;">
		<div class="sl-plot" data-sl="plot" data-plot-theme="self"></div>
	</div>
	<div class="mnlab-legend" style="margin: 8px 2px 0;">
		<span><i style="background: var(--mn-accent);"></i>loss landscape f(x)</span>
		<span><i style="background: var(--mn-coral);"></i>secant = your slope estimate</span>
		<span><i style="background: repeating-linear-gradient(90deg, var(--mn-emerald) 0 5px, transparent 5px 8px);"></i>true tangent f′(x)</span>
		<span><i style="background: var(--mn-sky);"></i>descent path</span>
	</div>

	<div class="mnlab-grid mnlab-grid--3" style="margin-top: 16px; gap: 6px 22px;">
		<label class="mnlab-ctrl">
			<span class="mnlab-ctrl-top"><span class="mnlab-label">Position</span><span class="mnlab-val" data-sl="xv">x = 0</span></span>
			<input type="range" data-sl="x" min="-4" max="4" step="0.01" value="2.6" aria-label="Position x">
			<span class="mnlab-hint">where the ball stands</span>
		</label>
		<label class="mnlab-ctrl">
			<span class="mnlab-ctrl-top"><span class="mnlab-label">Look-ahead</span><span class="mnlab-val" data-sl="hv">h</span></span>
			<input type="range" data-sl="h" min="0" max="100" step="0.5" value="88" aria-label="Look-ahead distance h (logarithmic)">
			<span class="mnlab-hint">logarithmic: 0.0001 … 2</span>
		</label>
		<label class="mnlab-ctrl">
			<span class="mnlab-ctrl-top"><span class="mnlab-label">Learning rate</span><span class="mnlab-val" data-sl="lrv">η</span></span>
			<input type="range" data-sl="lr" min="0.01" max="1.1" step="0.01" value="0.15" aria-label="Learning rate">
			<span class="mnlab-hint">step size per update</span>
		</label>
	</div>

	<div class="mnlab-row" style="margin-top: 12px;">
		<button type="button" class="mnlab-btn" data-sl="step">Take one step ↓</button>
		<button type="button" class="mnlab-btn mnlab-btn--ghost" data-sl="run" aria-pressed="false">▶ Run descent</button>
		<button type="button" class="mnlab-btn mnlab-btn--ghost" data-sl="reset" title="Back to the start position">↺ Reset</button>
	</div>

	<div class="mnlab-grid mnlab-grid--4" style="margin-top: 16px;">
		<div class="mnlab-stat"><span class="k">Loss f(x)</span><span class="v" data-sl="fx">–</span></div>
		<div class="mnlab-stat"><span class="k"><span class="sl-key" style="background: var(--mn-coral);"></span>Estimated slope</span><span class="v" data-sl="sec">–</span></div>
		<div class="mnlab-stat"><span class="k"><span class="sl-key" style="background: var(--mn-emerald);"></span>True slope f′(x)</span><span class="v" data-sl="tru">–</span></div>
		<div class="mnlab-stat"><span class="k">Estimate error</span><span class="v" data-sl="err">–</span></div>
	</div>

	<div class="mnlab-well sl-math mnlab-math" style="margin-top: 14px;" data-sl="math"></div>
	<div class="mnlab-note" data-sl="note" aria-live="polite"></div>
</div>

<div class="md" style="margin-top: 30px;">
### What to Watch For
1.  **The “probe” step:** The orange secant is what the AI actually measures: it compares $f(x)$ with $f(x+h)$. With a big $h$ it averages the steepness over a wide stretch and misses the true slope (the green tangent). Drag the look-ahead slider to the left and watch the error shrink until the two lines coincide — that limit is the derivative.
2.  **Learning in action:** Click **“Take one step”** or **“Run descent.”** Each update moves $x$ by $-\eta \cdot \text{slope}$, so the ball takes big steps where the ground is steep and tiny ones near the bottom.
3.  **The learning rate matters:** On the valley $x^2$, push $\eta$ above $0.5$: the ball starts to zig-zag across the bottom. Above $1.0$ every step overshoots by more than it gains and the ball flies off — the same instability that makes real training runs “diverge.”
4.  **Getting stuck:** Try **“Two valleys.”** Starting on the right, descent settles in the shallow valley and stops, because the slope there is zero — even though the valley on the left is deeper. The ball only feels the ground under its feet.

</div>

<div class="md" data-mathlevel="45" data-optionaltitle="Partial derivatives and the gradient vector">
### Understanding the Partial Derivative ($\partial$)

Above, we looked at a function with only one input ($x$). For that, we use the standard $d$ to represent a derivative. However, AI models usually have millions of inputs. When we deal with multiple variables, we use the **partial derivative** symbol: $\partial$.

The symbol $\partial$ for partial derivatives was introduced by the Marquis de Condorcet in \citeyear{condorcet1770}; the modern $\partial/\mathrm{d}x$ notation was created by \citeauthor{legendre1786} in \citetitle{legendre1786} (\citeyear{legendre1786}) — a suggestion he later abandoned — and was only popularized after Jacobi reintroduced it in 1841 (according to \citeauthor{historyofmathematicalnotation}, Vol. 2, p. 225).

#### The Theory: Isolation
The partial derivative is a way to measure how a single variable affects the final result while ignoring everything else.

* **The Problem:** In a complex system, changing two things at once makes it impossible to know which change caused the result.
* **The Solution:** We “freeze” all variables except one. We treat those frozen variables as if they were plain, unmoving numbers (constants).
* **The Symbol:** We write $\frac{\partial f}{\partial x}$ to say: “Find the slope of function $f$, but only look at the $x$ direction.”

#### The Practical Example: Minimizing Prediction Error

Imagine an AI trying to predict house prices. To improve, the AI needs to minimize its **Loss** ($f$), which represents the mathematical “distance” between its guess and the actual price. In this scenario, the Loss depends on two internal settings the AI is adjusting: the weight given to **Size** ($x$) and the weight given to **Age** ($y$).

Let's define the **Loss Function** as:
$$f(x, y) = x^2 + 3y$$

To reduce the error, the AI needs to know which direction to “step” by calculating partial derivatives.

**Step A: Find the influence of the Size weight ($\frac{\partial f}{\partial x}$)**
To do this, we treat the **Age weight** ($y$) as a constant.
* The derivative of $x^2$ is $2x$.
* Since $3y$ is treated as a constant, its derivative is $0$.
* **Result:** $\frac{\partial f}{\partial x} = 2x$.
* **Concrete Number:** If the current weight for size is $x = 4$, the gradient is $2(4) = \mathbf{8}$. This tells the AI that increasing this weight will significantly increase the error, so it should move in the opposite direction.

**Step B: Find the influence of the Age weight ($\frac{\partial f}{\partial y}$)**
Now, we treat the **Size weight** ($x$) as the constant.
* Since $x^2$ is now a constant, its derivative is $0$.
* The derivative of $3y$ is $3$.
* **Result:** $\frac{\partial f}{\partial y} = \mathbf{3}$.
* **Concrete Number:** The gradient is a constant 3. This means for every unit we increase the age weight, the error increases by 3 units. To minimize loss, the AI knows it must decrease this weight.

#### Why it Matters for AI
The AI combines these individual slopes into a **Gradient Vector**:
$$\nabla f = [8, 3]$$

This vector tells the AI exactly how much to adjust each “knob” (Size and Age) to reach the goal. Just like the **“Take 1 Step Down”** button, the AI uses these numbers to move toward the minimum error by updating each variable independently:
* $x_\text{new} = x_\text{old} - (\text{Learning Rate} \times 8)$
* $y_\text{new} = y_\text{old} - (\text{Learning Rate} \times 3)$

</div>

<div class="md" data-mathlevel="60" data-optionaltitle="The backpropagation chain rule">
### The “Backpropagation” Bridge: The Chain Rule

You've learned how to find the slope of one hill. But a Deep AI is like a **chain of hills**. When the AI makes a mistake at the very end (the output), it has to figure out which “knob” at the very beginning (the input) caused it.

This is called **Backpropagation**, and it relies on the **Chain Rule**.

#### The Message Passing
Imagine three gears connected in a line: Gear A, Gear B, and Gear C.
* If you turn Gear A, it turns Gear B.
* If Gear B turns, it turns Gear C.

If you want to know how fast Gear C moves when you touch Gear A, you just multiply the ratios:
$$\frac{\partial \text{Output}}{\partial \text{Input}} = \frac{\partial \text{Node B}}{\partial \text{Input}} \times \frac{\partial \text{Output}}{\partial \text{Node B}}$$

#### Why “Back”?
In AI, we calculate the error at the end first. We then pass that “error message” backward through the chain. Each layer multiplies the incoming message by its own local slope.
</div>
