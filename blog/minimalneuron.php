<?php include_once("functions.php"); ?>

<div class="md">
In this lab, our "AI" is actually a very simple mathematical model called a **Neuron**. At its core, it is just a linear function:

$$y = f(x) = ax + b$$

This is *the smallest possible neural network* already. Just that simple function equation, with $a$ and $b$ being *Parameters* for the function.

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

## The Genesis of Space: Weights and Initializers

Before a network begins to learn, its internal world is a mathematical void. In a dense layer, every relationship is governed by a fundamental linear transformation.

$$f(x) = ax + b$$

In this "toy" network equation:
* **$x$**: Represents the input signal (the initial coordinate).
* **$a$** (Weights): The scaling or rotation factor that determines the trajectory of data through the system.
* **$b$** (Bias): The translation factor that shifts the position of the output.

### Breaking Symmetry

<div class="smart-quote" data-cite="nietzsche1883zarathustra">
One must have chaos in one's self to give birth to a dancing star.
</div>

If we were to initialize every weight and bias at the exact same value—such as $0$—the network would suffer from perfect symmetry. In this state, every neuron would calculate the exact same gradient during training, and the model would be unable to differentiate between different features. 

To solve this, we use **Random Initialization**. By scattering the starting values of $a$ and $b$ across a distribution, we ensure that:
* **Unique Starting Points**: Each path in the network begins at a different location in the coordinate space.
* **Gradient Variance**: As the network processes data, it can "pull" and "push" these random points into meaningful clusters.

By starting with "noise," we give the network the mathematical flexibility it needs to reorganize that chaos into a structured map of logical relationships.
</div>

Learning Rate: <input type="number" id="lin-lr" value="0.001" step="0.01" style="width: 200px">
Epochs: <input type="number" id="lin-epochs" value="1000" style="width: 200px">
<div>
	<button id="btn-lin-train" class="btn btn-train" onclick="toggleTraining('lin')">🚀 Start Training</button>
	<button class="btn" style="background:#64748b; color:white; width:100%" onclick="initBlock('lin')">🔄 Reset Model</button>
	<div style="padding:15px; margin-top:10px;"><div style="text-align:center; font-size:1.2em;">$$\text{Real equation}: y = f(x) = 2x + 0$$</div></div>
	<div id="lin-math-monitor" style="padding:15px; margin-top:10px;"></div><br>
	<div id="lin-data-chart" class="plot-container"></div>
	<div id="lin-loss-chart" class="plot-container"></div>
	<div id="lin-console" class="status-console">Click 'Start Training'</div>
</div>
<script>train_onload();</script>

<div class="md">
## Python implementation
Here are two example scripts, the first one using TensorFlow, the second one using PyTorch, that train a one-layer neural network in Python on the 'and' dataset.
</div>

<pre><code class="language-python">import numpy as np
import tensorflow as tf

# --- THE DATA ---
# Inputs: [X1, X2], Outputs: [Y]
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=np.float32)
Y = np.array([[0], [1], [1], [0]], dtype=np.float32) # XOR Logic

def build_tf_nn(layers=1):
    if layers == 1:
        # Simple Linear Model / Perceptron
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(units=1, input_shape=(2,), activation='sigmoid')
        ])
    else:
        # 2-Layered Neural Network
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(units=4, input_shape=(2,), activation='relu'), # Hidden
            tf.keras.layers.Dense(units=1, activation='sigmoid')                # Output
        ])
    
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model

# Train and Test
tf_model = build_tf_nn(layers=2)
tf_model.fit(X, Y, epochs=500)
print(f"TF Prediction for [0,0]: {tf_model.predict(np.array([[0,0]]))}")
print(f"TF Prediction for [0,1]: {tf_model.predict(np.array([[0,1]]))}")
print(f"TF Prediction for [1,0]: {tf_model.predict(np.array([[1,0]]))}")
print(f"TF Prediction for [1,1]: {tf_model.predict(np.array([[1,0]]))}")
</code></pre>

<div class="md">
And the same one in PyTorch:
</div>

<pre><code class="language-python">import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np

# --- THE DATA ---
# PyTorch uses Tensors. We convert NumPy arrays to torch.float32 tensors.
X = torch.tensor([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=torch.float32)
Y = torch.tensor([[0], [1], [1], [0]], dtype=torch.float32) # XOR Logic

class NeuralNet(nn.Module):
    def __init__(self, layers=1):
        super(NeuralNet, self).__init__()
        if layers == 1:
            # Simple Linear Model / Perceptron
            self.model = nn.Sequential(
                nn.Linear(2, 1),
                nn.Sigmoid()
            )
        else:
            # 2-Layered Neural Network
            self.model = nn.Sequential(
                nn.Linear(2, 4), # Layer 1: 2 inputs -> 4 hidden units
                nn.ReLU(),       # Activation
                nn.Linear(4, 1), # Layer 2: 4 hidden units -> 1 output
                nn.Sigmoid()     # Output Activation
            )

    def forward(self, x):
        return self.model(x)

# --- TRAINING SETUP ---
# Choose layers=1 or layers=2
model = NeuralNet(layers=2)

# Loss and Optimizer (Binary Cross Entropy and Adam)
criterion = nn.BCELoss()
optimizer = optim.Adam(model.parameters(), lr=0.01)

# --- THE TRAINING LOOP ---
# This replaces tf_model.fit()
epochs = 500
for epoch in range(epochs):
    # 1. Forward pass
    outputs = model(X)
    loss = criterion(outputs, Y)

    # 2. Backward pass and optimization
    optimizer.zero_grad() # Clear existing gradients
    loss.backward()       # Compute gradients (backpropagation)
    optimizer.step()      # Update weights

    if (epoch + 1) % 100 == 0:
        print(f'Epoch [{epoch+1}/{epochs}], Loss: {loss.item():.4f}')

# --- PREDICTION ---
# model.eval() sets the model to evaluation mode
model.eval()
with torch.no_grad(): # Disable gradient calculation for inference
    test_inputs = [
        [0, 0], [0, 1], [1, 0], [1, 1]
    ]
    for inp in test_inputs:
        input_tensor = torch.tensor([inp], dtype=torch.float32)
        prediction = model(input_tensor)
        print(f"PT Prediction for {inp}: {prediction.item():.4f}")
</code></pre>

<div class="md">
## The Beginning of Neural Networks

In \citeyear{rosenblatt1958perceptron}, **\citeauthor{rosenblatt1958perceptron}** introduced the **Perceptron**, the biological-inspired ancestor of the modern neuron. Shifting away from rigid symbolic logic, he proposed a system that could "learn" by automatically adjusting its weights in response to errors. This marked a pivotal transition from hard-coded programming to the foundational principles of machine learning.

<div class="image-row">
    <figure>
        <img src="Mark_I_perceptron.jpeg" alt="Mark I Perceptron Cables" />
        <figcaption>\citetitle{perceptronimagecables}</figcaption>
    </figure>

    <figure>
        <img src="perceptron2.jpg" alt="Perceptron Detection" />
        <figcaption>\citetitle{perceptronimagedetection}</figcaption>
    </figure>
</div>

His physical implementation, the **Mark I Perceptron**, was a massive hardware system at Cornell University that used electric motors to turn potentiometers (the "weights"). While limited to learning simple linear relationships—a constraint that eventually contributed to the first AI Winter—it established the fundamental architecture of weighted inputs and thresholds that powers every neural network today.

<figure>
	<img style="max-width: 100%" src="FrankRosenblattWiringPerceptron.webp" alt="Perceptron Wiring" />
	<figcaption>\citetitle{perceptronimagewiring}</figcaption>
</figure>

Rosenblatt's Mark I Perceptron (\citeyear{perceptronresults}) achieved up to 100% accuracy on binary classification tasks like shape and letter recognition using single-layer architectures of 500 to 1,000 neurons. Across various experiments, it processed training sets of 20 to 10,000 images, maintaining high performance (80%–100%) despite variations in position and rotation ().
</div>
