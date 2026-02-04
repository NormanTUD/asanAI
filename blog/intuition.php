<?php include_once("functions.php"); ?>

<div class="md">
\category{machine_learning}
# From Words to Waves: The Geometry and Physics of LLMs

## 1. The Bottleneck: Translating Human Thought
Humans have a vast amount of "unstructured" knowledge—books, conversations, and ideas. Computers, however, only understand "structured" data (numbers and logic). To bridge this gap, an LLM treats language like a physical territory that it can navigate.

## 2. The Map: Language as Geometry
The first step for an LLM is to turn every word into a coordinate. This is called **Embedding**. 

Imagine a giant 3D room. In this room:
* Words like "Apple" and "Pear" are placed very close to each other.
* Words like "Apple" and "Microchip" are further apart, but still connected in certain directions.
* The "distance" between these points is calculated using **Cosine Similarity**—a method from linear algebra used to see how much two vectors point in the same direction.

By doing this, the LLM creates a **Geometric Space** where "meaning" is simply "proximity." When you ask a question, you are placing a point in this space, and the LLM looks at the neighbors to find the answer.



## 3. The Choice: Boltzmann and the Energy of Logic
Once we have a map, how does the LLM decide which word to pick next? This is where the physics of **Ludwig Boltzmann** (\citeyear{boltzmann_thermo}) comes in \cite{boltzmann_thermo}.

In physics, a system (like a gas or a ball on a hill) wants to reach its **Ground State**—the point of lowest energy. In an LLM, we define **Energy ($E$)** as **Loss** (or "Wrongness").
* A word that makes no sense has **High Energy** (it is unstable).
* A word that fits the context perfectly has **Low Energy** (it is stable).

The LLM uses the **Boltzmann Distribution** to turn these energy levels into probabilities:
$$P(\text{word}) \approx e^{-\frac{\text{Energy}}{\text{Temperature}}}$$

### Why the "Ball" Matters
The simulation you see is a visualization of this decision-making process:
1. **The Ball** represents the LLM’s current "thought" or "sentence state."
2. **The Landscape** is the sum of all human knowledge it learned during training. The "deepest valleys" are the most truthful or logical responses.
3. **The Roll**: When the LLM "predicts" the next word, it is mathematically letting the ball roll into the nearest valley of low energy (low error). 
4. **Temperature**: If we want the AI to be creative, we add "Heat." In physics, heat makes particles jump; in an LLM, heat allows the ball to jump out of a "boring" valley into a more "interesting" one.

In summary: **Geometry** gives the AI a map to move on, and **Boltzmann's Physics** gives it the rules for how to choose the best path toward a logical conclusion.
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
