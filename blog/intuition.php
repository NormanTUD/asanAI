<?php include_once("functions.php"); ?>

<div class="md">
## The Physics of Language: LLMs as Energy Landscapes

To understand why a Large Language Model (LLM) chooses one word over another, we can look at it through the lens of classical physics. Imagine a vast, hilly landscape where every possible sentence is a specific coordinate $(x, y)$. In this analogy, the "meaning" or semantic relationship between words is represented by their proximity in this space—this is the **geometric embedding**. However, geometry alone doesn't tell us what to say; for that, we need the third dimension: **Altitude ($z$)**.

In physics, a ball naturally rolls toward the lowest point to minimize its **Potential Energy ($E_p$)**. LLMs function identically. We define the "Energy" of a sentence as its **Negative Log-Likelihood**:

$$E(x) = -\ln(P(x))$$

When the model processes a sequence like *"The dog chases the..."*, it isn't just guessing; it is looking for the "deepest valley" in its learned landscape. A likely word like *"ball"* sits in a deep trench (low energy), while an unlikely word like *"bicycle"* sits on a high peak (high energy).



The "Statistical Machine" aspect comes from how we bridge energy and probability using the **Boltzmann Distribution**, a fundamental concept from thermodynamics:

$$P(x) \propto e^{-E(x)}$$

This equation tells us that states with low energy are exponentially more probable. Training a Transformer is essentially the process of "terraforming": we use a massive text corpus to carve deep valleys into the landscape for correct grammar and facts, while pushing up mountains for nonsense. Thus, the model's geometric internal space is simply the map it uses to navigate a statistical goal: finding the path of least resistance (lowest energy) to predict the next most likely token.
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
