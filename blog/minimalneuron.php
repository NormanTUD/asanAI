<?php include_once("functions.php"); ?>
<div class="md">
## From Functions to Learning: The Minimal Neuron

In the previous section, we played with the function $f(x) = ax + b$. We manually moved sliders to change the **slope** ($a$) and the **intercept** ($b$) to change how the line looks.

In AI, we don't move the sliders ourselves. Instead, we create a **Model** (a simple "neuron") and let the computer find the best values for $a$ and $b$ based on data.

### The Goal: Mapping Inputs to Outputs
In this lab, we have a small **Dataset** (a set of pairs):
* $ \text{Input } (x) \rightarrow \text{Outputs } (y) $
* $ 1 \rightarrow 2 $
* $ 2 \rightarrow 4 $
* $ 3 \rightarrow 6 $

Mathematically, our goal is to find a function $f(x)$ such that $f(1) \approx 2$, $f(2) \approx 4$, and so on. You might notice that the "perfect" rule here is $y = 2x + 0$.

### The Building Blocks: Weights and Biases
In AI terminology, we rename our parameters:
* **Weight ($w$):** This is our $a$. it determines how much "weight" or importance the input $x$ has.
* **Bias ($b$):** This is our $b$. It allows the model to shift the output up or down, regardless of the input.

The model calculates: $$ y = w \cdot x + b $$


### How the AI "Learns"
When you click **🚀 Start Training**, the computer performs a loop:

1.  **Prediction:** The model takes the input $x$ (as a **Tensor**) and guesses the output using its current $w$ and $b$.
2.  **Loss Calculation:** The computer calculates the **Loss** (or error). If the model guesses $5$ but the real answer is $6$, the loss tells the AI "you are off by 1."
3.  **Optimization:** The AI uses a math trick called *Gradient Descent* to slightly nudge $w$ and $b$ in the direction that makes the Loss smaller.

### Watching it in Real-Time
* **Loss History:** Watch the red chart. As the AI learns, the "Loss" (error) should go down toward zero.
* **Linear Regression:** Watch the blue line. It starts at a random position and gradually "tilts" until it passes through the actual data points.
* **Math Monitor:** This shows you the internal state of the neuron. Watch how $w$ (the weight) and $b$ (the bias) change as the AI gets smarter!
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
