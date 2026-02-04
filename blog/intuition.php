<?php include_once("functions.php"); ?>

<div class="md">
\category{machine_learning}
# The Entropy Engine: Bridging Language and Logic

## 1. The Human Bottleneck: Unstructured Information
The world’s knowledge is trapped in "unstructured" forms—books, research papers, and conversations. While humans navigate these intuitively, computers historically require "structured" data like spreadsheets and databases. To unlock this information, we need a machine that can translate human thought into mathematical patterns. 

The Large Language Model (LLM) solves this by treating language as a **statistical sequence**. It doesn't "understand" a fact; it predicts the most likely next word. As **Claude Shannon** (\citeyear{shannon1948}) demonstrated in *A Mathematical Theory of Communication*, information is essentially the reduction of uncertainty \cite{shannon1948}. If a machine can guess the next word correctly, it has effectively "decoded" the structure of the information.



## 2. The Geometry of Meaning
Before it can predict, the machine must map words into a physical space. This is done through **Embeddings**. 
Following the principle of **J.R. Firth** (\citeyear{firth1957})—*"You shall know a word by the company it keeps"* \cite{firth1957}—words with similar roles are placed near each other in a high-dimensional landscape. 
* "London" and "Paris" are vectors pointing in similar directions. 
* The distance between words is measured using **Cosine Similarity**, turning semantic meaning into pure geometry.

## 3. The Object and the Field: Physics of Context
When an LLM prepares to speak, it treats the **next word** as a physical object and the **preceding group of words** as a gravitational field.

The "Group" (your prompt and the history of the chat) defines the environment. Every word you have already typed acts like a mass that warps the landscape. If the group is *"The capital of France is..."*, it creates a massive "gravity well" (a point of low energy) at the coordinates for the word **"Paris."**

### The Boltzmann Distribution
To choose the next word, the machine calculates the "Energy" ($E$) of every possible word within this field. A word that fits the group perfectly has low energy; a word that makes no sense has high energy. We use the **Boltzmann Distribution** \cite{boltzmann_thermo} to convert this energy into probability ($P$):

$$P(\text{word}) = \frac{e^{-E / T}}{Z}$$

In this equation:
* **$E$ (Energy):** Represents the "Error" or "Surprise." 
* **$T$ (Temperature):** Represents the "Heat." Higher heat allows the "Ball" (the machine's focus) to jump out of the most obvious valley and explore more creative, less likely words.
* **$Z$ (Normalization):** Ensures all word probabilities add up to 100%.



## 4. The Simulation: Watching the Machine "Think"
The interactive plot below visualizes this physics-based search:
1. **The Landscape:** This is the Energy Surface shaped by the context of the conversation.
2. **The Ball:** This is the "Object"—the next potential word. 
3. **The Roll:** The ball follows **Gravity** (Gradient Descent) toward the lowest energy point. This represents the machine narrowing down its choices to the most logical next step.

By treating a group of words as a force field and the next word as a particle, we turn the act of writing into a process of physical optimization.
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
