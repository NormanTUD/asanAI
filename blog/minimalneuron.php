<?php include_once("functions.php"); ?>

<div class="md">
The simplest AI is actually a very simple mathematical model called a **Neuron**. At its core, it is just a linear function:

$$y = f(x) = ax + b$$

This is *the smallest possible neural network* already. Just that simple function equation, with $a$ and $b$ being *Parameters* for the function. In this case, $a$ and $b$ are just simple floating point numbers, but usually they are not numbers but tensors, ie. large lists of numbers, such that it can be that they can look like 

$$ \begin{bmatrix} y_1 \\ y_2 \end{bmatrix} = \begin{bmatrix} 0.5 & -0.2 & 0.1 \\ 0.8 & 0.4 & -0.9 \end{bmatrix} \begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix} + \begin{bmatrix} 0.1 \\ -0.5 \end{bmatrix}. $$

But since normal numbers are tensors as well, this holds true. Given $a$ and $b$ are tensors, is the exact mathematical structure of the \citealternativetitle{rosenblatt1958perceptron}.

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

A single neuron can only learn a straight line. However, complex AI systems group many of these neurons together into **Layers**. By stacking these layers, where the output of one neuron becomes the input for the next, the model evolves into a **Neural Network** capable of recognizing complex patterns far beyond a simple line. But this will come later on, in this example we'll deal with the simplest form of neural networks (one layer, one neuron).
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

If we were to initialize every weight and bias at the exact same value, such as $0$, the network would suffer from perfect symmetry. In this state, every neuron would calculate the exact same gradient during training, and the model would be unable to differentiate between different features. 

To solve this, we use **Random Initialization**. By scattering the starting values of $a$ and $b$ across a distribution, we ensure that:
* **Unique Starting Points**: Each path in the network begins at a different location in the coordinate space.
* **Gradient Variance**: As the network processes data, it can "pull" and "push" these random points into meaningful clusters.

By starting with "noise," we give the network the mathematical flexibility it needs to reorganize that chaos into a structured map of logical relationships.

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
## Output Layer: The Mirror of the Target

The final layer of a neural network is not arbitrary; it is a mathematical mirror of the data you want to predict. Its shape, the number of neurons it contains, must match the dimensionality of your "Labels" (the ground truth).

### Categorical Data and One-Hot Encoding
If you are classifying objects (e.g., Cat, Dog, Bird), the computer cannot easily work with text. However, we also cannot simply assign them numbers like $1, 2,$ and $3$, because the math would assume a Dog ($2$) is "twice as much" as a Cat ($1$).

To solve this, we use **One-Hot Encoding**. Each category becomes its own dimension in a vector:
* **Cat**: $[1, 0, 0]$
* **Dog**: $[0, 1, 0]$
* **Bird**: $[0, 0, 1]$

In this case, your output layer **must have exactly 3 neurons**. To turn the raw numbers from these neurons into something we can understand, we use the **Softmax** activation function. Think of Softmax as a "percentage generator": it squashes the outputs so they all sum up to $1.0$ ($100\%$), allowing the network to say "I am 90% sure this is a Dog". Details are more complicated, but we will come back to them later.

### Spatial and Complex Outputs
The rule of "matching the data" extends to every domain:
* **Binary Classification**: If the answer is just Yes/No (0 or 1), a single neuron with a Sigmoid activation is enough.
* **Image Generation**: If the model is supposed to output a grayscale image of $28 \times 28$ pixels and is a single channel only (black and white), the output layer must contain $784$ neurons (one for every pixel) or be reshaped to match that specific width and height.
* **Coordinates**: If you are predicting the $(x, y)$ location of an object, you need exactly $2$ output neurons.

If the output layer's dimensions do not match the target data's dimensions, the **Loss Function** will be unable to compare the prediction to the reality, and the "loop" of learning will break.

**The Golden Rule:** Your model's output layer must be a mirror of your data's constraints. If the data cannot be negative, your activation function must prevent negative numbers. If the data is categorical, your loss function must be probabilistic (i.e., softmax).
</div>

<div class="md">
## The Statistical Nature of Learning

We often think of Neural Networks as "learning" in the way a human student learns: by understanding concepts. However, mathematically, a Neural Network is simply a statistical machine trying to fit a curve to a distribution.

### Data is not just Numbers; it is a Distribution
In the **Normal Distribution** part of the **Statistics** section, we learned about the difference between a "Sample" and a "Population." When we train the neuron above on points like $(1, 2)$ or $(2, 4)$, we are not teaching it just those specific numbers. We are asking it to approximate the **Underlying Distribution** that generated those numbers.

This relies on the **Law of Large Numbers**:
$$ \bar{X}_n \xrightarrow{n \to s} \mu $$

Or, in plain English: **"As the number of times you repeat an experiment ($n$) grows towards real number of cases (which may be $\infty$), the average of your actual results ($\bar{X}_n$) will eventually settle down and equal the true theoretical average ($\mu$)."**

In simpler terms:
* **The Left Side ($\bar{X}_n$):** This is the "Sample Average." It represents what you actually observed in your data (e.g., the average height of 100 people you measured).
* **The Arrow ($\to$):** This represents "convergence." It means "gets closer and closer to".
* **The Right Side ($\mu$):** This is the "Population Mean." It is the "true" hidden reality (e.g., the average height of every human on Earth).

**Why it matters for your Neural Network:**
This law is the reason why more data usually leads to a better model. With only a few data points, your "average" (the weights the network learns) might be skewed by luck or noise. But as you feed it thousands of examples, the Law of Large Numbers ensures that the noise cancels itself out, allowing the network to find the "true" underlying pattern ($\mu$) of the data.

If our training data is a "representative sample" (meaning it follows the same statistical distribution as the real world example you're trying to model), the weights of the network will converge to the "True" relationship. If the data is biased (a bad sample), the model learns a skewed reality. This is why knowing your data's distribution is critical. You cannot fit a straight line to a circle; you must choose a model architecture that matches the geometry of your data's distribution.

### Initialization: Controlled Chaos
We previously mentioned initializing weights "randomly." But "random" is a dangerous word in engineering. If we pick weights from a **Uniform Distribution** between $-1000$ and $1000$, the signal will explode towards infinity (NaN). If we pick them between $-0.0001$ and $0.0001$, the signal will vanish to zero.

To solve this, we use the **Normal Distribution** ($\mathcal{N}$) we saw in the **Statistics** part.
Modern networks use "Xavier" or "He" initialization, which are just fancy ways of saying: *pick random numbers from a Gaussian Bell Curve where the width ($\sigma$) is carefully calculated based on the size of the network.*

$$ W \sim \mathcal{N}\left(0, \sqrt{\frac{2}{n_\text{inputs}}}\right) $$

This ensures that the "energy" (variance) of the data stays constant as it flows through the network, preventing the math from breaking before learning even begins.
</div>
