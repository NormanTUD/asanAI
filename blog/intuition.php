<?php include_once("functions.php"); ?>

<div class="md">
\category{machine_learning}
# The Physics of Thought: LLMs as Energy Machines

## The Core Intuition: Why does the ball roll?

Imagine you are standing on a foggy mountain range at night. You want to find the village in the deepest valley, but you cannot see it. You can only feel the slope of the ground beneath your feet.

* If the ground tilts down to the right, you step right.
* If it tilts steep, you take a big step.
* If it is flat, you stop.

This is exactly how an LLM "learns." It doesn't memorize answers; it navigates a **Loss Landscape**.

### 1. The Landscape (The Error Surface)
This concept comes from **R.A. Fisher** (\citeyear{fisher1922}) and his work on *Maximum Likelihood* \cite{fisher1922}.
Imagine every possible setting of the AI's brain (its parameters) is a GPS coordinate.
* **Altitude ($Z$):** Represents "Surprise" or Error.
* **Peaks:** Coordinates where the AI speaks nonsense (High Error).
* **Valleys:** Coordinates where the AI speaks fluent English (Low Error).

### 2. The Gravity (Gradient Descent)
The "Force" that pulls the ball down is not magic; it is calculus. In \citeyear{cauchy1847}, **Augustin-Louis Cauchy** invented the method of **Gradient Descent** \cite{cauchy1847}.
The mathematical rule is simple: **Go opposite to the slope.**
$$ \theta_{t+1} = \theta_t - \eta \cdot \nabla E(\theta) $$
* $\theta$: Your position.
* $\nabla E$: The slope (Gradient).
* $\eta$: The step size (Learning Rate).

In our simulation below, the **"Learning Rate"** slider controls the strength of this gravity. If gravity is too weak, the ball barely moves. If it's too strong, the ball might overshoot the valley and fly off the map.

### 3. The Wiggle (Temperature / Entropy)
Why do we need "Temperature"?
If you simply roll a ball, it will get stuck in the first small pothole it finds (a "Local Minimum"). It will never find the *true* bottom of the ocean (the "Global Minimum").

**Ludwig Boltzmann** (\citeyear{boltzmann_thermo}) showed that adding energy (heat) to a system gives it a probability of being in a higher energy state \cite{boltzmann_thermo}.
In AI, we call this **Temperature**.
* **Low Temp:** The ball freezes in the first valley (Repetitive, boring AI).
* **High Temp:** The ball has kinetic energy. It shakes and jitters. This allows it to "jump" out of shallow valleys to find deeper, better ones (Creative, hallucinatory AI).

### 4. What about Embeddings? (The Map)
Before we can have a landscape, we need a map. We cannot do calculus on words like "King" or "Apple."
We map them into **Embedding Spaces**.
This idea, popularized by **J.R. Firth** (\citeyear{firth1957}) ("*You shall know a word by the company it keeps*" \cite{firth1957}), treats words as vectors.
* **King** might be at coordinates $[0.9, 0.1]$.
* **Queen** might be at $[0.95, 0.15]$.

Because they are close in number-space, the "Ball" treats them similarly. The landscape is smooth between them. If the AI learns something about Kings, it automatically learns it about Queens because they live in the same neighborhood on this map.
</div>

<div class="statlab-interactive-zone" style="padding: 20px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
    <div class="md">
    ### Interactive Laboratory: Gravity & Heat

    1.  **Drop:** Click **"Reset Ball"**. It will spawn high up on a peak (High Error).
    2.  **Observe:** Watch it naturally roll down the slope. This is the AI "learning."
    3.  **Intervene:** If it gets stuck in a small hole, increase **Temperature** to shake it loose!
    </div>

    <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 15px; align-items: flex-end;">
        <div style="flex: 1; min-width: 200px;">
            <label style="font-weight:600; font-size: 0.9em; color:#334155;">Gravity Strength ($\eta$): <span id="lr-display" style="color:#2563eb;">0.015</span></label>
            <input type="range" id="energy-lr" min="0.001" max="0.05" step="0.001" value="0.015" style="width:100%; cursor: pointer;">
        </div>
        <div style="flex: 1; min-width: 200px;">
            <label style="font-weight:600; font-size: 0.9em; color:#334155;">Temperature / Jitter ($T$): <span id="temp-display" style="color:#ef4444;">0.00</span></label>
            <input type="range" id="energy-temp" min="0" max="1.0" step="0.05" value="0" style="width:100%; cursor: pointer;">
        </div>
        <button onclick="EnergyLab.resetBall()" style="padding: 10px 20px; height: 38px; background: #0f172a; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: background 0.2s;">
            Reset Ball (Drop)
        </button>
    </div>

    <div id="energy-plot" style="width:100%; height:550px; border: 1px solid #e2e8f0; border-radius: 4px;"></div>

    <div id="status-readout" style="font-family: monospace; color: #334155; margin-top: 15px; text-align: center; font-size: 0.9rem; background: #f8fafc; padding: 10px; border-radius: 4px;">
        Status: Waiting...
    </div>
</div>
