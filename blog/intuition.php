<?php include_once("functions.php"); ?>

<div class="md">

## The Statistical Machine: Using Science as a Toolkit

An LLM is a **Statistical Machine** that internalizes and **uses concepts from Astronomy, Physics, and Geometry** to achieve its core objective: predicting the next word in a sequence according to the distribution of its training data.

### The Statistical Engine (The Goal)
* The model's primary task is to calculate a probability distribution for every possible next word based on the provided context.
* It uses **Maximum Likelihood Estimation (MLE)** to ensure its internal predictions align with the statistical reality of human-generated text.

### Borrowing from Astronomy (Gravitational Logic)
* **Statistical Gravity**: The model uses the concept of attraction to pull tokens that belong together in a specific context closer in its internal map.
* **Massive Data**: Much like gravity governs the movement of planets, the statistical weight of billions of words governs the "movement" and likelihood of tokens in the model's output.

### Borrowing from Physics (Energy & Thermodynamics)
* **Energy Landscapes**: The model represents the probability of a sentence as a state of **Physical Energy ($E$)**.
* **Stable Valleys**: A logical, statistically sound sentence is treated as a low-energy "valley," while a nonsensical sentence is a high-energy "peak".
* **Thermodynamic Heat**: The model uses the **Boltzmann Distribution** to manage the "Temperature" ($T$) of the output.
    $$P(x) = \frac{e^{-E(x)/T}}{Z}$$
* High heat allows the system to jitter and jump into less likely (creative) states, while low heat forces it into the most stable, predictable state.

### Borrowing from Geometry (The Manifold)
* **High-Dimensional Mapping**: To process concepts from Computer Science to History, the model uses thousands of coordinates (dimensions).
* **The Manifold Assumption**: The model uses the geometric principle that meaningful data exists on a thin, low-dimensional "sheet" (manifold) floating within the noise of the high-dimensional space.
* **Linear Operations**: It uses vector math to perform complex reasoning, assuming that logic can be navigated through geometric shifts (e.g., moving a vector from "Past Tense" to "Present Tense").

### The Execution (The Simulation)
* The act of generating text is a real-time physics simulation.
* A "ball" representing the current state is dropped into the landscape and rolls toward the next token, guided by the statistical forces the model has learned from all scientific disciplines.

**Summary**: The LLM does not "know" these fields; it **utilizes their concepts** as a mathematical language to organize, compute, and predict the statistical flow of human information.

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
