<?php include_once("functions.php"); ?>

<div class="md">
## From Linear Units to Deep Architectures

As we saw in the discussion on the **Minimal Neuron**, a single unit performs a linear transformation followed by an activation. However, the true power of Modern AI, what we call **Deep Learning**, emerges when we stack these neurons into multiple successive layers.

### The Hidden Layer
In a simple model, we go directly from input to output. In a Deep Network, we introduce "Hidden Layers." These are intermediate steps where the data is transformed into abstract representations. Instead of just a single weight $a$, we now use a **Weight Tensor** $W$ to handle multiple signals simultaneously.

If the first layer is $L_1$, its output (the hidden state $\mathbf{h}$) is calculated as:

$$\mathbf{h} = \sigma(W_n \mathbf{x} + \mathbf{b}_n)$$

Where $\sigma$ is the Activation Function, $W_n$ is a tensor with the weights from layer $n$ and $b_n$ is a vector with the biases of layer $n$.

### Stacking and Composition
"Deep" simply means that the output of one layer becomes the input for the next. Mathematically, this is known as **Function Composition**. To get to the final prediction $\hat{y}$ in a two-layer network, we pass the data through a chain of operations:

$$\text{Result} = \sigma_2(W_2 (\sigma_1(W_1 \mathbf{x} + \mathbf{b}_1)) + \mathbf{b}_2)$$

Each layer $L_n$ has its own set of weights $W_n$ and biases $\mathbf{b}_n$. This hierarchy allows the network to learn a "ladder" of features: the first layer might detect simple lines, the second detects shapes, and the third detects complex objects like faces or cars.

The operation can be split as well. The following equations are equal to the one equation, but spread out more:

**Layer 1 (Hidden Layer)**:
$$h = \sigma\left({W_1 \mathbf{x} + \mathbf{b}_1}\right)$$

**Layer 2 (Output Layer)**:
$$\text{Result} = \sigma\left({W_2 \mathbf{h} + \mathbf{b}}_2\right)$$

Or, as a commuting diagram:

<?php
	include("layer_commutating_diagram.html");
?>

### The Role of Non-Linearity
The activation function $\sigma$ (such as **ReLU** or **Sigmoid**) is the "glue" that makes stacking work. If we didn't use $\sigma$ between layers, the entire stack would mathematically collapse into a single linear function, because a "linear function of a linear function" is still just a linear function.

By keeping the non-linear "gates" between the stacks, we allow the network to warp and fold the coordinate space, enabling it to solve complex problems like the **XOR** gate.

## Tip:

Try changing the activation function of the hidden layer.
</div>

<div style="margin-bottom: 15px; display: flex; gap: 10px;">
	<button class="btn" onclick="DeepLab.loadPreset('AND')">AND</button>
	<button class="btn" onclick="DeepLab.loadPreset('XOR')">XOR</button>
	LR: <input type="number" id="deep-lr" value="0.05" step="0.01" style="width: 100px;">
	Epochs: <input type="number" id="deep-epochs" value="100" style="width: 100px;">
</div>
<div id="deep-gui" class="layers-vertical"></div>
<div>
	<div id="fcnn_wrapper">
		<canvas id="fcnn_canvas"></canvas>
	</div>
	<div style="display: flex; gap: 15px; flex-wrap: wrap;">
		<div id="deep-loss-chart" class="dll-plot-container"></div>
		<div id="deep-data-chart" class="dll-plot-container"></div>
	</div>
	<div style="margin-top: 10px;">
		<b>Weights (Live):</b>
		<div id="deep-tensor-viz" style="display:flex; gap:5px; flex-wrap: wrap;"></div>
	</div>
	<div id="deep-math-monitor" style="padding:15px; margin-top:10px;"></div>
	<table id="deep-train-table">
		<thead><tr id="deep-thr"></tr></thead>
		<tbody></tbody>
	</table>
	<button class="btn" style="background:#10b981; color:white; width:100%" onclick="DeepLab.addRow('deep')">+ Add New Data Row</button>
	<div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top:10px;">
		<div id="manual-input-area" style="display:inline-block; margin: 0 10px;"></div>
		<span>→ <strong id="manual-result" style="color:#b45309">0.00</strong></span>
	</div>
	<button id="btn-deep-train" class="btn btn-train" onclick="DeepLab.toggleTraining('deep')">🚀 Start Training</button>
	<button class="btn" style="background:#64748b; color:white; width:100%" onclick="DeepLab.init('deep')">🔄 Reset Model</button>
	<div id="deep-console" class="status-console"></div>
</div>
