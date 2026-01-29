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

<div class="smart-quote" 
     data-author="Friedrich Nietzsche" 
     data-source="Thus Spake Zarathustra">
  I tell you: one must still have chaos within oneself to be able to give birth to a dancing star.
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
## History of neural networks

In \citeyear{rosenblatt1958perceptron}, **\citeauthor{rosenblatt1958perceptron}** introduced the **Perceptron**, the biological-inspired ancestor of the modern neuron. Shifting away from rigid symbolic logic, he proposed a system that could "learn" by automatically adjusting its weights in response to errors. This marked a pivotal transition from hard-coded programming to the foundational principles of machine learning.

<div class="image-row">
    <figure>
        <img src="Mark_I_perceptron.jpeg" alt="Mark I Perceptron Cables" />
        <figcaption>\citetitle{perceptronimagecables}\footcite{perceptronimagecables}</figcaption>
    </figure>

    <figure>
        <img src="perceptron2.jpg" alt="Perceptron Detection" />
        <figcaption>\citetitle{perceptronimagedetection}\footcite{perceptronimagedetection}</figcaption>
    </figure>
</div>

His physical implementation, the **Mark I Perceptron**, was a massive hardware system at Cornell University that used electric motors to turn potentiometers (the "weights"). While limited to learning simple linear relationships—a constraint that eventually contributed to the first AI Winter—it established the fundamental architecture of weighted inputs and thresholds that powers every neural network today.

<figure>
	<img src="FrankRosenblattWiringPerceptron.webp" alt="Perceptron Wiring" />
	<figcaption>\citetitle{perceptronimagewiring}\footcite{perceptronimagewiring}</figcaption>
</figure>

</div>
