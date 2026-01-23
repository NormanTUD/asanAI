<?php include_once("functions.php"); ?>

<div class="md">
In this lab, our "AI" is actually a very simple mathematical model called a **Neuron**. At its core, it is just a linear function:

$$y = f(x) = ax + b$$

In AI terminology, we give these parameters specific names:
* **Weight ($a$):** This determines the "tilt" of the line. It defines how much the input $x$ influences the output $y$.
* **Bias ($b$):** This allows the model to shift the line up or down, regardless of the input.

Instead of us moving the sliders to find $a$ and $b$, the computer will search for these values itself.

To help the computer find the right values, we provide a **Dataset** (a set of "correct" pairs):
* **Input $(x) \rightarrow$ Output $(y)$**
* $1 \rightarrow 2$
* $2 \rightarrow 4$
* $3 \rightarrow 6$

Our goal is for the computer to find a function where $f(1) \approx 2$, $f(2) \approx 4$, and so on. You might notice the "perfect" rule here is $y = 2x + 0$.

When you click **🚀 Start Training**, the computer performs a loop:

1.  **Prediction:** The model takes an input $x$ and calculates a guess using its current $a$ and $b$.
2.  **Loss Calculation:** The computer calculates the **Loss** (the error). If the model guesses $5$ but the real answer is $6$, the loss tells the AI "you are off by 1".
3.  **Optimization:** The AI uses a math trick called *Gradient Descent* to slightly nudge $a$ and $b$ in the direction that makes the Loss smaller.

Watch it in real time:

* **Loss History:** Watch the red chart. As the AI learns, the "Loss" (error) should drop toward zero.
* **Linear Regression:** Watch the orange line. It starts at a random position and gradually "tilts" until it passes through the blue data points.
* **Math Monitor:** This shows the internal state of the neuron. Watch how $a$ (weight) and $b$ (bias) change as the AI fits the data!

A single neuron can only learn a straight line. However, complex AI systems group many of these neurons together into **Layers**. By stacking these layers—where the output of one neuron becomes the input for the next—the model evolves into a **Neural Network** capable of recognizing complex patterns far beyond a simple line. But this will come later on, in this example we'll deal with the simplest form of neural networks (one layer, one neuron).
</div>
    <h2>Minimal Neuron Lab</h2>
    <div class="grid-layout">
	<div class="layers-vertical">
	    <div class="layer-box" style="border-color:#10b981"><span class="layer-badge">INPUT</span>1 Node (x)</div>
	    <div class="layer-box" style="border-color:#8b5cf6"><span class="layer-badge">OUTPUT</span>1 Node (y)</div>
	    LR: <input type="number" id="lin-lr" value="0.001" step="0.01">
	    Epochs: <input type="number" id="lin-epochs" value="1000">
	</div>
	<div>
	    <div style="display: flex; gap: 15px; flex-wrap: wrap;">
		<div id="lin-loss-chart" class="plot-container"></div>
		<div id="lin-data-chart" class="plot-container"></div>
	    </div>
	    <div id="lin-math-monitor" style="padding:15px; margin-top:10px;"></div>
	    <button id="btn-lin-train" class="btn btn-train" onclick="toggleTraining('lin')">🚀 Start Training</button>
	    <button class="btn" style="background:#64748b; color:white; width:100%" onclick="initBlock('lin')">🔄 Reset Model</button>
	    <div id="lin-console" class="status-console"></div>
	</div>
    </div>
<script>train_onload();</script>
