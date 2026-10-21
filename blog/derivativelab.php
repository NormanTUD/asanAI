<?php include_once("functions.php"); ?>
<?php js("fog_game"); ?>
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

<div class="md">
### Mini game: the foggy mountain

This is the situation every learning algorithm is in: it cannot see the whole landscape, only the height and the slope where it stands. Find the lowest point with eight probes — then compare yourself with gradient descent, which gets exactly the same information.
</div>

<style>
#fog-game { --lab-accent: var(--mn-accent); --lab-accent-2: var(--mn-emerald); }
#fog-game canvas { display: block; width: 100%; border-radius: 12px; border: 1px solid var(--mn-border); cursor: crosshair; background: color-mix(in srgb, var(--mn-bg) 60%, var(--mn-surface)); }
#fog-game .fg-pips { display: flex; gap: 5px; }
#fog-game .fg-pip { width: 14px; height: 14px; border-radius: 50%; background: var(--mn-accent); box-shadow: 0 0 8px color-mix(in srgb, var(--mn-accent) 60%, transparent); transition: all .3s ease; }
#fog-game .fg-pip.is-used { background: color-mix(in srgb, var(--mn-text-muted) 30%, transparent); box-shadow: none; transform: scale(.75); }
#fog-game .fg-stars { text-align: center; font-size: 2rem; letter-spacing: 6px; color: color-mix(in srgb, var(--mn-text-muted) 35%, transparent); }
#fog-game .fg-stars .is-on { color: #fbbf24; text-shadow: 0 0 14px rgba(251, 191, 36, .6); animation: fg-star .6s cubic-bezier(.2, 1.6, .4, 1) both; }
#fog-game .fg-stars .is-on:nth-child(2) { animation-delay: .15s; }
#fog-game .fg-stars .is-on:nth-child(3) { animation-delay: .3s; }
@keyframes fg-star { from { transform: scale(0) rotate(-90deg); } }
#fog-game .fg-res { display: grid; gap: 6px; margin-top: 8px; }
#fog-game .fg-row { display: grid; grid-template-columns: 12px minmax(0, 9em) minmax(0, 1fr) 3ch; gap: 10px; align-items: center; font-size: .86rem; }
#fog-game .fg-row b { color: var(--mn-heading); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#fog-game .fg-dot { width: 12px; height: 12px; border-radius: 50%; }
#fog-game .fg-bar { height: 10px; border-radius: 99px; background: color-mix(in srgb, var(--mn-text-muted) 18%, transparent); overflow: hidden; }
#fog-game .fg-bar i { display: block; height: 100%; border-radius: inherit; }
#fog-game .fg-num { font: 700 .86rem var(--mn-font-mono); text-align: right; color: var(--mn-heading); }
#fog-game .fg-verdict { text-align: center; margin: 10px 0 0; color: var(--mn-text-secondary); }
</style>
<div class="mnlab" id="fog-game" data-interactive>
	<div class="mnlab-head">
		<div>
			<div class="mnlab-kicker">Mini game</div>
			<div class="mnlab-title">Foggy Mountain</div>
			<p class="mnlab-sub">Somewhere under the fog is the lowest point. You have 8 probes. Each one shows the height — and which way the ground slopes. Then you race gradient descent with the same budget.</p>
		</div>
		<div class="mnlab-row"><span class="mnlab-hint">probes</span><div class="fg-pips" data-fg="left"></div></div>
	</div>
	<div><canvas data-fg="canvas" aria-label="Foggy landscape: click to probe"></canvas></div>
	<div class="mnlab-row" style="margin-top: 12px; justify-content: space-between;">
		<div class="mnlab-row">
			<button type="button" class="mnlab-btn mnlab-btn--ghost" data-fg="reveal" disabled>Lift the fog</button>
			<button type="button" class="mnlab-btn" data-fg="next">⟳ New mountain</button>
		</div>
		<button type="button" class="mnlab-chip" data-fg="slopes" aria-pressed="true">↘ show slopes</button>
	</div>
	<div class="mnlab-grid mnlab-grid--3" style="margin-top: 12px;">
		<div class="mnlab-stat"><span class="k">Round</span><span class="v" data-fg="roundv">1</span></div>
		<div class="mnlab-stat"><span class="k">Lowest found</span><span class="v" data-fg="bestv">–</span></div>
		<div class="mnlab-stat"><span class="k">Personal best</span><span class="v" data-fg="pb">–</span></div>
	</div>
	<div data-fg="result" aria-live="polite" style="margin-top: 12px;"></div>
</div>

<div class="md" data-mathlevel="45">
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

<div class="md" data-mathlevel="60">
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

<div class="mn-quiz" data-quiz="derivativelab"><script type="application/json">{"title": "Slopes & gradient descent", "questions": [{"q": "For f(x) = x², what does the look-ahead estimate (f(x+h) − f(x)) / h give at x = 3 with h = 1?", "options": ["7", "6", "9", "3"], "answer": 0, "explain": "(16 − 9) / 1 = 7. The true derivative 2x = 6; the secant overshoots by exactly h, because (x+h)² − x² = 2xh + h²."}, {"q": "Gradient descent on f(x) = x² multiplies x by (1 − 2η) every step. What happens with η = 1.2?", "options": ["It diverges: |1 − 2.4| = 1.4 > 1", "It converges smoothly", "It stops after one step", "It zig-zags but converges"], "answer": 0, "explain": "Each step multiplies the distance to the minimum by −1.4: the sign flips (overshoot) and the size grows, so the ball flies away."}, {"q": "The slope at some point is exactly 0. What can you conclude?", "options": ["It is a flat point — a minimum, a maximum or a saddle", "It is certainly the global minimum", "It is certainly a local minimum", "The learning rate is too small"], "answer": 0, "explain": "A zero slope only says “no downhill direction right here”. Hilltops and saddle points are flat too, and a local minimum need not be the deepest one."}, {"q": "The slope at the current position is −2.5. Which way does gradient descent move x?", "options": ["To larger x (right)", "To smaller x (left)", "It does not move", "It depends on the loss value"], "answer": 0, "explain": "x_new = x − η · slope = x + 2.5η. A negative slope means the ground falls to the right, so descent goes right."}]}</script></div>
