<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Smallest possible neural network
description: The simplest AI: y = ax + b. A single neuron, linear regression, and the birth of learning.
icon: &#10024;
part: 2
order: 9
color: coral
topics: math-i, math-ii, programming
tags: code-heavy
-->

<div class="minimalneuron-page">

<div class="md" data-mathlevel="45">
The simplest AI is actually a very simple mathematical model called a **Neuron**. As a *pedagogical starting point*, we take it to be just an affine map — a linear function plus a constant shift:

$$y = f(x) = ax + b$$

**Important note:** A single affine map by itself is **not yet a full neural network**. Formally, a neural network is built by composing many such affine maps with a non-linear **activation function** $g$ between them, of the form $f(x) = (T_L \circ g \circ T_{L-1} \circ g \circ \dots \circ T_1)(x)$. Without that non-linearity, stacking affine maps collapses back into a single affine map (we will see exactly this collapse in the activation chapter, and it is the reason every real network uses an activation function). For this *first Chautauqua*, however, we keep things as simple as possible: just that single function equation, with $a$ and $b$ being *Parameters* for the function. In this case, $a$ and $b$ are just simple floating point numbers, but usually they are not numbers but tensors, ie. large lists of numbers, such that it can be that they can look like 

$$ \begin{pmatrix} y_1 \\ y_2 \end{pmatrix} = \begin{pmatrix} 0.5 & -0.2 & 0.1 \\ 0.8 & 0.4 & -0.9 \end{pmatrix} \begin{pmatrix} x_1 \\ x_2 \\ x_3 \end{pmatrix} + \begin{pmatrix} 0.1 \\ -0.5 \end{pmatrix}. $$

But since normal numbers are tensors as well, this holds true. Historically, the threshold unit predates the Perceptron. \citeauthor{mccullochpitts1943} modelled the neuron in \citeyear{mccullochpitts1943} as an all-or-none element: a weighted sum is compared with a threshold, and the unit fires $1$ when the affine map is positive and $0$ otherwise. With the Heaviside step $H(x)=\mathbf{1}_{x>0}$, that neuron computes $\hat{y}=H(ax+b)$. \citeauthor{rosenblatt1958perceptron} turned the idea into a trainable classifier in \citeyear{rosenblatt1958perceptron}; its output unit used the same threshold, but the full Perceptron also had fixed association units and a discrete learning rule.

The paper \citeauthor{mccullochpitts1943} published in \citeyear{mccullochpitts1943} was not yet a learning machine. They modelled the neuron as an **all-or-none** threshold unit: a weighted sum of excitatory and inhibitory inputs is compared with a threshold, and the unit fires only if that threshold is crossed. Because such units can implement AND, OR and NOT, the paper showed that networks of them can realise any propositional formula — a *logical calculus* of nervous activity. What it did not contain was a rule for *changing* the weights. That step — learning from examples — is the contribution of the next decade.

In AI terminology, we give these parameters specific names:
* **Weight ($a$):** This determines the “tilt” of the line. It defines how much the input $x$ influences the output $y$.
* **Bias ($b$):** This allows the model to shift the line up or down, regardless of the input.

\citeauthor{hebb1949organizationofbehaviour}'s *The Organization of Behavior* (\citeyear{hebb1949organizationofbehaviour}) proposed that learning is a change in synaptic strength: when one neuron repeatedly helps to fire another, the connection between them is strengthened. The slogan "cells that fire together, wire together" is a later summary, but the idea is his: memory is not a stored symbol but a stable pattern of weights. Rosenblatt's Perceptron learning rule \cite{rosenblatt1958perceptron} can be read as a supervised, error-correcting cousin of Hebb's principle — the weight moves only when the output is wrong.

Instead of us moving the sliders to find $a$ and $b$, the computer will search for these values itself.

To help the computer find the right values, we provide a **Dataset** (a set of “correct” pairs):

* **Input $(x) \rightarrow$ Output $(y)$**
* $1 \rightarrow 2$
* $2 \rightarrow 4$
* $3 \rightarrow 6$

Our goal is for the computer to find a function where $f(1) \approx 2$, $f(2) \approx 4$, and so on. You might notice the “perfect” rule here is $y = 2x + 0$.

Rosenblatt's first report appeared in 1957 as *The Perceptron: A Perceiving and Recognizing Automaton* \cite{rosenblattperceptron}; the better-known paper followed in 1958 \cite{rosenblatt1958perceptron}. The machine was not a thought experiment: the Mark I Perceptron used a 20×20 grid of photocells, a layer of fixed association units and a layer of trainable response units, with weights adjusted by motor-driven potentiometers \cite{rosenblatt1962neurodynamics}. In 1958 the *New York Times* reported that the Navy had demonstrated a device that "learns by doing" — a public claim of a machine that improved with experience \cite{newyorktimesperceptron}.

When you click **🚀 Start Training**, the computer performs a loop:

1.  **Prediction:** The model takes an input $x$ and calculates a guess using its current $a$ and $b$.
2.  **Loss Calculation:** The computer calculates the **Loss** (the error). If the model guesses $5$ but the real answer is $6$, the loss tells the AI “you are off by 1”.
3.  **Optimization:** The AI uses a math trick called *Gradient Descent* to slightly nudge $a$ and $b$ in the direction that makes the Loss smaller.

The linear neuron in this demo has a direct ancestor: the **ADALINE** (Adaptive Linear Neuron) of \citeauthor{widrow1960adaline}, built at Stanford in \citeyear{widrow1960adaline}. Unlike the Perceptron, its output unit was *linear*, not a step, and its weights were updated by the **delta rule** — move each weight in proportion to the error times the input. That is exactly the gradient-descent update used here, derived from the mean-squared-error loss. In other words, the single-neuron lab below is a 1960 ADALINE with a modern optimiser and a plot.

Watch it in real time:

* **Loss History:** Watch the red chart. As the AI learns, the “Loss” (error) should drop toward zero.
* **Linear Regression:** Watch the orange line. It starts at a random position and gradually “tilts” until it passes through the blue data points.
* **Math Monitor:** This shows the internal state of the neuron. Watch how $a$ (weight) and $b$ (bias) change as the AI fits the data!

A single **linear** neuron can only fit a straight line. However, complex AI systems group many of these neurons into **Layers**, and — crucially — place a non-linear activation between the layers. Stacking linear layers alone would collapse back into one affine map; with a non-linearity in between, the composition becomes a **Neural Network** capable of representing patterns far beyond a simple line. But this will come later on, in this example we'll deal with the simplest form of neural networks (one layer, one neuron).

The limits of the single unit were made precise by \citeauthor{minskyperceptrons} in *Perceptrons* (\citeyear{minskyperceptrons}). They proved that a linear threshold unit cannot compute exclusive-or, and that many simple geometric predicates are beyond a one-layer perceptron. The book is often remembered as the cause of an "AI winter", but its argument was specifically about the limits of *linear* threshold units, not about multilayer networks with hidden, non-linear units. The constructive answer — hidden layers with non-linear units — is exactly the architecture the next chapter builds.

The gradient-descent loop above trains one neuron. Training a *deep* network needed one more idea: **backpropagation**, the chain rule applied layer by layer. \cite[Werbos (1974)]{werbos1974} worked it out in his doctoral thesis, but the result became famous only when \citeauthor{rumelhart1986} showed in \citeyear{rumelhart1986} that it could learn useful internal representations. Their paper, together with the parallel-distributed-processing volumes of the same year \cite{rumelhart1986pdp}, made multilayer networks trainable and turned the "hidden layer" from a theoretical possibility into a practical tool.

The statistical idea behind this neuron is older than the neuron itself. The method of least squares — choosing parameters that minimise the sum of squared errors — was published by \citeauthor{legendre1805} in \citeyear{legendre1805} and given its probabilistic justification by \citeauthor{gauss1809} in \citeyear{gauss1809}. \citeauthor{galton} later gave the fitted line its name: studying hereditary stature in \citeyear{galton}, he observed that children of very tall or very short parents tended toward the population average, and called the phenomenon **regression toward mediocrity**. The modern single neuron is, in effect, a least-squares line with a learning algorithm attached.
</div>

<div class="controls-bar">
	<div class="control-group">
		<label for="lin-lr">Learning Rate</label>
		<input type="number" id="lin-lr" value="0.001" step="0.01">
	</div>
	<div class="control-group">
		<label for="lin-epochs">Epochs</label>
		<input type="number" id="lin-epochs" value="1000">
	</div>
</div>

<div class="action-row">
	<button id="btn-lin-train" class="btn btn-train" onclick="toggleTraining('lin')">🚀 Start Training</button>
	<button class="btn btn-reset" onclick="initBlock('lin')">🔄 Reset Model</button>
</div>

<div class="equation-card">
	<div class="equation-card-inner">
		<span class="card-label">Target Equation</span>
		$$\text{Real equation}: y = f(x) = 2x + 0$$
	</div>
</div>

<div id="lin-math-monitor" style="font-size: 0.7em;"></div>

<div id="lin-data-chart" class="plot-container" data-plot-theme="self"></div>
<div id="lin-loss-chart" class="plot-container" data-plot-theme="self"></div>
<div id="lin-console" class="status-console">Click 'Start Training'</div>

<div class="md">
## The Genesis of Space: Weights and Initializers

Before a network begins to learn, its internal world is a mathematical void. In a dense layer, every relationship is governed by a fundamental linear transformation.

$$f(x) = ax + b$$

In this “toy” network equation:
* **$x$**: Represents the input signal (the initial coordinate).
* **$a$** (Weights): The scaling factor that determines the trajectory of data through the system.
* **$b$** (Bias): The translation factor that shifts the position of the output.

### Breaking Symmetry

<div class="smart-quote" data-cite="nietzsche1883zarathustra">
One must have chaos in one's self to give birth to a dancing star.
</div>

If we were to initialize every weight and bias at the exact same value, such as $0$, the network would suffer from perfect symmetry. In this state, every neuron would calculate the exact same gradient during training, and the model would be unable to differentiate between different features. (For the **one-neuron** model in this lesson the situation is different: its loss is convex, and $a=b=0$ is a harmless starting point; symmetry breaking matters once a layer has more than one unit.) 

To solve this, we use **Random Initialization**. By scattering the starting values of $a$ and $b$ across a distribution, we ensure that:
* **Unique Starting Points**: Each path in the network begins at a different location in the coordinate space.
* **Gradient Variance**: As the network processes data, it can “pull” and “push” these random points into meaningful clusters.

By starting with “noise,” we give the network the mathematical flexibility it needs to reorganize that chaos into a structured map of logical relationships.

## Python implementation
Here are scripts that train a small network in Python. The **From Scratch** tab is pure Python with no framework at all — one weight $a$, one bias $b$, the mean-squared-error loss, and plain gradient descent: the very same neuron as the live demo above, and it checks its own analytic gradient against a numerical one. The other two build a network with TensorFlow and PyTorch.
</div>

<?php
$pytorch = get_string_of_file_or_die("py/minimalneuron/pytorch.py");
$tensorflow = get_string_of_file_or_die("py/minimalneuron/tensorflow.py");
$custom = get_string_of_file_or_die("py/minimalneuron/custom.py");

$minimalneuroncodetabs = array(
	"From Scratch" => '<div class="md">No framework at all — pure Python. This is the same neuron as the live demo above: $y = ax + b$, the mean-squared-error loss, the analytic gradient, and plain gradient descent. It even verifies the gradient against a finite-difference one.</div><pre><code class="language-python">'.$custom.'</code></pre>',
	"TensorFlow" => '<pre><code class="language-python">'.$tensorflow.'</code></pre>',
	"PyTorch"    => '<pre><code class="language-python">'.$pytorch.'</code></pre>'
);

render_gem_tabs($minimalneuroncodetabs, "minimalneuron");
?>

<div class="md">
## Output Layer: The Mirror of the Target

The final layer of a neural network is not arbitrary; it is a mathematical mirror of the data you want to predict. Its shape, the number of neurons it contains, must match the dimensionality of your “Labels” (the ground truth).

### Categorical Data and One-Hot Encoding
If you are classifying objects (e.g., Cat, Dog, Bird), the computer cannot easily work with text. However, we also cannot simply assign them numbers like $1, 2,$ and $3$, because the math would assume a Dog ($2$) is “twice as much” as a Cat ($1$).

To solve this, we use **One-Hot Encoding**. Each category becomes its own dimension in a vector:
* **Cat**: $[1, 0, 0]$
* **Dog**: $[0, 1, 0]$
* **Bird**: $[0, 0, 1]$

In this case, your output layer **must have exactly 3 neurons**. To turn the raw numbers from these neurons into something we can understand, we use the **Softmax** activation function. Think of Softmax as a “percentage generator”: it squashes the outputs so they all sum up to $1.0$ ($100\%$), allowing the network to say “I am 90% sure this is a Dog”. Details are more complicated, but we will come back to them later.

### Spatial and Complex Outputs
The rule of “matching the data” extends to every domain:
* **Binary Classification**: If the answer is just Yes/No (0 or 1), a single neuron with a Sigmoid activation is enough.
* **Image Generation**: If the model is supposed to output a grayscale image of $28 \times 28$ pixels and is a single channel only (black and white), the output layer must contain $784$ neurons (one for every pixel) or be reshaped to match that specific width and height.
* **Coordinates**: If you are predicting the $(x, y)$ location of an object, you need exactly $2$ output neurons.

If the output layer's dimensions do not match the target data's dimensions, the **Loss Function** will be unable to compare the prediction to the reality, and the “loop” of learning will break.

**The Golden Rule:** Your model's output layer must be a mirror of your data's constraints. If the data cannot be negative, your activation function must prevent negative numbers. If the data is categorical, your output activation must produce a probability distribution (i.e., softmax), paired with a cross-entropy loss.

**The mirror rule is a design consequence of a theorem, not just a convention.** In 1970, Conant and Ashby proved the **Good Regulator Theorem**: *every good regulator of a system must be a model of that system* \cite{conantashby1970}. The theorem does not dictate a particular output encoding; it says that whatever encoding the regulator uses must be rich enough to distinguish the states it has to regulate. The controller that best tames a system must internally carry a structure-preserving image of it — and no amount of tuning closes the gap when the controller's structure cannot represent the thing it controls. The output layer is the sharpest place this shows up in a network: its shape is a one-to-one image of the target it is to regulate — a thermostat "models" a room insofar as it carries a one-parameter image of its temperature, a classifier "models" its label set insofar as its output is a one-hot image of the categories. When the mirror is wrong, training cannot fix it, which is why the Golden Rule is a *structural* requirement rather than a stylistic one.

</div>

<div class="md" data-mathlevel="55">
## The Statistical Nature of Learning

We often think of Neural Networks as “learning” in the way a human student learns: by understanding concepts. However, mathematically, a Neural Network is simply a statistical machine trying to fit a curve to a distribution.

### Data is not just Numbers; it is a Distribution
In the **Normal Distribution** part of the **Statistics** section, we learned about the difference between a “Sample” and a “Population.” When we train the neuron above on points like $(1, 2)$ or $(2, 4)$, we are not teaching it just those specific numbers. We are asking it to approximate the **Underlying Distribution** that generated those numbers.

This relies on the **Law of Large Numbers**:
$$ \bar{X}_n \xrightarrow{n \to \infty} \mu $$

Or, in plain English: **“As the number of repetitions $n$ grows, the sample average $\bar{X}_n$ converges to the population mean $\mu$: for any small tolerance, the probability that the sample average lies farther than that tolerance from $\mu$ tends to zero.”**

In simpler terms:
* **The Left Side ($\bar{X}_n$):** This is the “Sample Average.” It represents what you actually observed in your data (e.g., the average height of 100 people you measured).
* **The Arrow ($\to$):** This represents “convergence.” It means “gets closer and closer to”.
* **The Right Side ($\mu$):** This is the “Population Mean.” It is the “true” hidden reality (e.g., the average height of every human on Earth).

**Why it matters for your Neural Network:**
This law is the reason why more data usually leads to a better model. With only a few data points, your “average” (the weights the network learns) might be skewed by luck or noise. But as you feed it thousands of examples, the Law of Large Numbers ensures that the noise cancels itself out, allowing the network to find the “true” underlying pattern ($\mu$) of the data.

If our training data is a “representative sample” (meaning it follows the same statistical distribution as the real world example you're trying to model), the weights of the network will converge to the “True” relationship. If the data is biased (a bad sample), the model learns a skewed reality. This is why knowing your data's distribution is critical. You cannot fit a straight line to a circle; you must choose a model architecture that matches the geometry of your data's distribution.

There is a name for this matching requirement, and it comes from cybernetics. \citeauthor{ashbyintrocybernetics1956}'s **Law of Requisite Variety** \cite{ashbyintrocybernetics1956} holds that a controller can cancel the *variety* — the number of distinct states — thrown at it only with at least as much variety of its own: *"only variety can destroy variety."* Messy, high-variety real-world data is exactly what forces the model to grow: the more distinct patterns the environment can throw at it, the more internal variety (more parameters, more neurons, more layers) the network needs to tell them apart and track each one. The law is a *lower bound*, not a slogan — it does not say "more is always better," only that the model's variety must never fall below the environment's. Under-provision a network for a messy domain and it is structurally incapable of regulating that domain, no matter how long you train.

### Initialization: Controlled Chaos
We previously mentioned initializing weights “randomly.” But “random” is a dangerous word in engineering. If we pick weights from a **Uniform Distribution** between $-1000$ and $1000$, the signal will explode towards infinity (NaN). If we pick them between $-0.0001$ and $0.0001$, the signal will vanish to zero.

To solve this, we use the **Normal Distribution** ($\mathcal{N}$) we saw in the **Statistics** part.
Modern networks use “Xavier” (Glorot) or “He” initialization: *pick random numbers from a Gaussian Bell Curve whose width is set by the size of the layer.* He initialization, designed for ReLU, uses variance $2/n_\text{inputs}$:

$$ W \sim \mathcal{N}\left(0, \frac{2}{n_\text{inputs}}\right) \quad \text{(std } \sqrt{2/n_\text{inputs}}\text{)} $$

Xavier initialization, designed for tanh and sigmoid, also takes the number of outputs into account, typically with variance $2/(n_\text{inputs}+n_\text{outputs})$.

This ensures that the “energy” (variance) of the data stays constant as it flows through the network, preventing the math from breaking before learning even begins.

</div>

<div class="md" data-mathlevel="45">
## Matrices as Parallel Processing

A single neuron computes $y = ax + b$: one input, one weight, one output. But a Transformer with $d_{\text{model}} = 4096$ processes 4096 numbers simultaneously at every step. The bridge between these two scales is the **matrix**.

Instead of computing one neuron at a time, we pack all inputs into a vector $\mathbf{x}$ and all weights into a matrix $W$. The entire layer's computation becomes:

$$\mathbf{y} = W\mathbf{x} + \mathbf{b}$$

This single line represents thousands of individual multiplications and additions, all happening in parallel. Every row of $W$ is a separate “neuron” with its own set of weights. Every row of $W$ receives the same input $\mathbf{x}$. The matrix multiplication $W\mathbf{x}$ computes the dot product of every row with $\mathbf{x}$ simultaneously.

This is why GPUs are so effective for deep learning: they are designed to perform matrix multiplications in hardware, processing thousands of operations per clock cycle. A modern GPU can execute a $4096 \times 4096$ matrix times a $4096$-dimensional vector, over 16 million individual multiplications, in a single operation. Without this parallelization, training a model like GPT-4 would be computationally impossible.

So when you see $\mathbf{h} = \text{Attention}(Q, K, V)$, remember that every letter in that equation is a **matrix**, and every operation is a **batch of thousands of parallel arithmetic operations**, each one as simple as the single neuron $y = ax + b$.
</div>
</div>

<div class="mn-quiz" data-quiz="minimalneuron"><script type="application/json">{"title": "The smallest network", "questions": [{"q": "A single linear neuron y = ax + b is the same model as…", "options": ["linear regression", "a decision tree", "a transformer", "k-means clustering"], "answer": 0, "explain": "One weight, one bias, no activation: a straight line fitted to data."}, {"q": "What do the parameters a and b mean geometrically?", "options": ["a is the slope, b is where the line crosses the y-axis", "a is the x-intercept, b is the slope of the line", "a and b are both slopes, one for each axis", "a and b are the coordinates of the data's centre point"], "answer": 0, "explain": "Learning means turning these two knobs until the line fits the points."}, {"q": "Why do initializers matter even for a tiny network?", "options": ["They choose where training starts, affecting speed and stability", "They fix the final answer before any training data is seen", "They replace the real training data with samples from a fixed prior", "They have no effect at all on a network this small and simple"], "answer": 0, "explain": "Gradient descent starts from the initial weights; bad starts can be slow or unstable, especially in deeper nets."}, {"q": "Why are matrices used to compute many neurons at once?", "options": ["One matrix multiplication computes all weighted sums in parallel", "Matrices make the network non-linear by mixing all of the inputs", "They store the training data in a compact, reusable form", "They reduce the number of weights the network must learn"], "answer": 0, "explain": "Each row of the weight matrix is one neuron; Wx gives all of their outputs in a single operation."}]}</script></div>
