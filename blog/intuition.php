<?php include_once("functions.php"); ?>

<div class="md">
## The Statistical Mechanics of Language: A High-Dimensional Gravity Map

To understand a Transformer, you must look past the code and see a **Statistical Machine** that speaks the language of Physics. While the implementation uses geometry (vectors and matrices), the "soul" of the system is a probability distribution modeled as an **Energy Landscape**.

### 1. Beyond 3D: The Manifold of Meaning
In high school physics, we track a ball in 3D space $(x, y, z)$. In an LLM, a "point" is not a physical location, but a **Sequence of Tokens** (like *"Der Hund jagt den Ball"*).
* **The Dimensions (The "Knobs")**: Instead of just two axes, the model has thousands of dimensions—think of them as 4,096 different "knobs" that define a word's gender, tense, or abstract logic.
* **The Manifold**: Most combinations of these knobs produce nonsense; valid human language exists only on a thin, twisty "sheet" floating in that giant space, called a **Manifold**.
* **Geometry as Compressed Statistics**: These coordinates are learned from **Co-occurrence Statistics**. Tokens land near each other because they statistically appear together in similar contexts.

### 2. The $z$-Axis: Energy vs. Probability
In this analogy, the height ($z$) is the **Energy ($E$)**. In Physics, systems naturally fall into low-energy states. In LLMs, we define Energy as the **Negative Log-Likelihood**:
$$E(x) = -\ln(P(x))$$

**Why use Energy (Logarithms) instead of raw Probability?**
* **Additivity**: In physics, total energy is the sum of its parts. By using logs, the probability of a whole sentence becomes the **sum** of the "energy cost" of each word.
* **Mathematical Stability**: Multiplying thousands of tiny probabilities leads to "underflow" (numbers becoming zero); adding "energy" scores stays stable for computers.

### 3. Training as "Landscape Sculpting" (MLE)
The goal of training is **Maximum Likelihood Estimation (MLE)**. This is the process of adjusting the landscape so that real human text sits in the deepest possible valleys.
* **Low Energy (Valleys)**: These represent high-density areas in the training data (e.g., "The sky is blue").
* **High Energy (Peaks)**: These represent sequences that contradict the training corpus (e.g., "The sky is square").



### 4. The Decision Engine: Softmax and Heat
To pick the next word, the model uses the **Softmax Function**, which is mathematically identical to the **Boltzmann Distribution** in thermodynamics:
$$P(x) = \frac{e^{-E(x)/T}}{Z}$$
* **$T$ (Temperature/Heat)**: High heat makes the "ball" jitter and jump over mountains, leading to creative or chaotic text. Low heat makes the ball roll strictly into the deepest, most predictable valley.
* **$Z$ (Partition Function)**: This ensures all probabilities sum to 1.0 (100%), balancing the "depth" of the valleys against the "height" of the peaks.

**Summary**: The Transformer is a machine that calculates the "Physical Energy" of a sentence based on the statistical gravity of billions of human-written books.
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
