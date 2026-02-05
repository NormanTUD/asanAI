<?php include_once("functions.php"); ?>

<div class="md">

## The Universal Compressor: Geometry as Logic

An LLM is not merely a statistical machine; it is a **Universal Compressor**. By learning to predict the next piece of information, it is forced to internalize the logic and reasoning of the world that generated that information. It converts "meaning" into "geometry" and "reasoning" into a physics simulation.

### Prediction as Understanding (Information Theory)
* **Lossless Compression**: To perfectly predict the next word in a mystery novel, the model must implicitly track the detective, the clues, and the killer. It minimizes **Cross-Entropy Loss**, effectively compressing the logic of the world into its weights.
* **The Probability Engine**: The model doesn't just pick one answer; it assigns a likelihood to *every possible reality* that could follow the current text.

### The Geometry of Meaning (Vector Space)
* **Semantic Arithmetic**: Words are not stored as text, but as coordinates (vectors). We discovered that meaning is defined by offsets: $\text{Vector}(\text{King}) - \text{Vector}(\text{Man}) + \text{Vector}(\text{Woman}) \approx \text{Vector}(\text{Queen})$.
* **High-Dimensional Polysemy (Superposition)**: The model uses a phenomenon called **Superposition** to simulate more concepts than it has neurons. It stores unrelated ideas (like "politics" and "geometry") in the same neurons but at nearly orthogonal angles, allowing them to exist without interference.

### The Information Highway (Residual Stream)
* **The Conveyor Belt**: Unlike a hierarchy where data changes completely at every step, the model uses a **Residual Stream**. Imagine a conveyor belt carrying a sentence; each layer of the neural network stands beside the belt and reads the sentence, adding a small "post-it note" of information (e.g., "this word is a verb") back onto the belt without destroying the original data.
* **Iterative Refinement**: The model doesn't "think" all at once. It iteratively refines its understanding, step-by-step, layer-by-layer, gradually reducing the energy of the system.

### Dynamic Routing (Attention Mechanism)
* **Gravitational Relevance**: Instead of reading left-to-right, words exert a "pull" on each other based on relevance. In "The **animal** didn't cross the **street** because **it** was too wide," the word "it" attends strongly to "street" (not "animal") because of the adjective "wide."
* **Contextual Morphing**: A word's coordinates shift based on this attention. The vector for "bank" physically moves to a different location in space when placed near "river" versus "money".

### Transient Learning (In-Context Learning)
* **Learning without Updates**: Perhaps the strangest behavior is that the model can "learn" a new rule provided in the prompt (e.g., a made-up language) without changing its permanent weights. It simulates a learning algorithm *inside* its forward pass, effectively compiling a temporary function based on your input.

### Energy-Based Inference: The Physics of Meaning
We visualize the LLM's decision process through the lens of **Energy-Based Models (EBMs)**. In this framework, the model associates a scalar **Energy**—a measure of "badness" or incompatibility—to every possible sequence of tokens.

* **The Global Minimum**: A coherent, logical sentence represents the configuration $(X, Y)$ with the lowest energy. Prediction is essentially an **Inference Procedure**: searching the massive space of possible words to find the $Y^*$ that minimizes the energy function $E(W, Y, X)$.
* **The Loss Functional**: During training, we don't just "teach" the model facts; we use a **Loss Functional** to shape the entire energy surface. The goal is to "push down" on the energy of the ground-truth text and "pull up" on the energy of hallucinations (incorrect answers).

### From Energy to Probability: The Gibbs Distribution
To turn these uncalibrated energy values into the probabilities we see in the "Next Token" list, the model employs the **Gibbs Distribution**:
$$P(Y|X) = \frac{e^{-\beta E(Y,X)}}{\int_{y\in\mathcal{Y}} e^{-\beta E(y,X)}}$$

* **The Partition Function ($Z$)**: The denominator (the integral over all possible realities) acts as a normalization constant. While often intractable in complex EBMs, the LLM approximates this "sum of all worlds" to calibrate its confidence.
* **Temperature as Inverse $\beta$**: By adjusting the inverse temperature $\beta$, we control the "peakiness" of the distribution.
    * **Low Temperature**: The model is forced into the global minimum (the deepest valley of logic).
    * **High Temperature**: The energy surface flattens, allowing the model to escape the lowest valley and explore "higher energy" creative configurations.
</div>

<div class="statlab-interactive-zone" style="padding: 20px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;">
    <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 15px;">
        <button id="toggle-roll" onclick="EnergyLab.toggle()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            Pause Animation
        </button>
        <button onclick="EnergyLab.resetBall()" style="padding: 10px 20px; background: #0f172a; color: white; border: none; border-radius: 6px; cursor: pointer;">
            Drop New Ball
        </button>
        <div style="padding: 0 10px;">
            <label>Gravity: <input type="range" id="energy-lr" min="0.005" max="0.05" step="0.001" value="0.02"></label>
            <label>Heat: <input type="range" id="energy-temp" min="0" max="1.0" step="0.05" value="0.1"></label>
        </div>
    </div>

    <div id="energy-plot" style="width:100%; height:500px;"></div>
</div>

<div class="md">
## Understanding the Gibbs Distribution

In the 3D map above, we see **Energy** ($E$)—a measure of how "wrong" or "unlikely" a state is. But an LLM needs to output a **Probability** ($P$) to choose the next word. The **Gibbs Distribution** is the bridge between these two worlds.


### How it works:
* **Energy to Probability**: We take the negative exponent of the energy: $e^{-E}$. This ensures that **lower energy** (better logic) results in **higher probability**.
* **The Role of Temperature ($T$)**:
    * **Low Heat ($T \to 0$):** The model becomes "greedy." It only cares about the absolute lowest energy state, making the distribution very peaky.
    * **High Heat ($T \to \infty$):** The differences in energy matter less. The distribution flattens out, allowing the model to pick "higher energy" (more creative or random) words.
</div>

<div id="gibbs-lab" style="padding: 20px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 20px;">
    <h2 style="margin-top:0;">Token Probability Distribution</h2>
    <div id="gibbs-plot" style="width:100%; height:300px;"></div>
    <div id="temp-readout" style="font-family: monospace; text-align: center; color: #64748b;"></div>
</div>

<div class="md">
**Summary**: The LLM turns language into a map, simulates a temporary logic circuit based on your prompt, and navigates the result using energy functions to flow toward the most meaningful destination.

</div>
