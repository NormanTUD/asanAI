<?php include_once("functions.php"); ?>

<div class="md">
\category{machine_learning}
# Geometry as the Solution to a Statistical Problem

## The Core Paradox of AI

We often think of Large Language Models (LLMs) as "intelligent," but fundamentally, they are solving a strict statistical task introduced by **R.A. Fisher** in \citeyear{fisher1922} (\citetitle{fisher1922}): **Maximum Likelihood Estimation (MLE)**.

The goal is purely statistical:
$$ \text{Maximize } \mathcal{L}(\theta) = \prod_{i=1}^{N} P(\text{next word} | \text{context}; \theta) $$

However, we cannot solve this using simple counting (like we did with the dice in the previous chapter) because the number of possible sentences is effectively infinite. We cannot make a list of every possible sentence to count frequencies.

**The Solution:** We convert this statistical problem into a **Geometric Problem**. We turn "probability" into "height" and "words" into "locations" in a high-dimensional space.

## 1. The Energy Landscape (The Physics of Language)

To understand how an LLM learns, we must borrow a concept from thermodynamics, originally formulated by **Ludwig Boltzmann** (\citeyear{boltzmann_thermo}): the **Energy Function**.

In physics, a system prefers to be in a state of **Low Energy**. A ball rolls down a hill; hot coffee cools down.
In AI, we define **"Energy" ($E$)** as the "Unnaturalness" or "Surprise" of a sentence.

* **Low Energy ($E \downarrow$):** "The cat sat on the mat." (Common, Likely, Stable).
* **High Energy ($E \uparrow$):** "The cat sat on the sky." (Rare, Unlikely, Unstable).

The probability $P(x)$ of a text sequence $x$ is inversely related to its energy, a relationship defined by the **Boltzmann Distribution**:

$$ P(x) = \frac{e^{-E(x)}}{Z} $$

*(Where $Z$ is the partition function, a normalizing constant to ensure probabilities sum to 1).*

## 2. Gradient Descent: Learning is Falling

If language is a landscape, "Training" an AI is simply the act of finding the lowest point in that landscape.

When we initialize a neural network, it knows nothing. It is standing on top of a high mountain of error (High Energy). To learn, it must find the valley.
It does this using **Gradient Descent**, a method attributed to **Augustin-Louis Cauchy** in \citeyear{cauchy1847} (\citetitle{cauchy1847}).

The model doesn't need to see the whole map. It only needs to feel the slope under its feet and take a step downhill.

$$ \theta_{new} = \theta_{old} - \eta \cdot \nabla E(\theta) $$

* $\theta$: The coordinates (parameters) of the model.
* $\nabla E$: The Gradient (the steepness of the hill).
* $\eta$: The Learning Rate (how big of a step to take).

</div>

<div class="statlab-interactive-zone" style="padding: 20px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;">
    <div class="md">
    ### Interactive: The Loss Landscape
    Visualize the "Brain" of the AI as a ball.
    * **The Surface:** The landscape of all possible language combinations. High peaks are "nonsense," valleys are "coherent text."
    * **The Ball:** The current state of the model.
    * **The Goal:** Roll into the deepest valley (Minimize Loss) to find the best statistical prediction.
    </div>

    <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 15px;">
        <div style="flex: 1; min-width: 200px;">
            <label><strong>Learning Rate ($\eta$):</strong> <span id="lr-display">0.05</span></label>
            <input type="range" id="energy-lr" min="0.01" max="0.2" step="0.01" value="0.05" style="width:100%">
            <p style="font-size: 0.8rem; color: #64748b;">(Step size: Too small = slow, Too large = overshooting)</p>
        </div>
        <div style="flex: 1; min-width: 200px;">
            <label><strong>Randomness (Temperature):</strong> <span id="temp-display">0</span></label>
            <input type="range" id="energy-temp" min="0" max="1.5" step="0.1" value="0" style="width:100%">
             <p style="font-size: 0.8rem; color: #64748b;">(Stochastic Gradient Descent / Noise)</p>
        </div>
        <button onclick="EnergyLab.resetBall()" style="padding: 10px 20px; height: 40px; align-self: center; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">Drop Ball (Reset)</button>
    </div>

    <div id="energy-plot" style="width:100%; height:500px;"></div>
    
    <div id="status-readout" style="font-family: monospace; color: #334155; margin-top: 10px; text-align: center;">
        Status: Waiting...
    </div>
</div>

<div class="md">
## 3. Embeddings: Statistics frozen in Geometry

How does the model actually "move" words? It converts discrete symbols (words) into continuous vectors. This concept, often linked to **J.R. Firth's** distributional semantics ("*You shall know a word by the company it keeps*", \citeyear{firth1957}), allows us to treat meaning as a physical location.

If we calculate the statistical co-occurrence of words, we find that "King" and "Queen" appear in similar contexts. In the geometric vector space, this statistical similarity becomes **Euclidean Distance**.

$$ \text{dist}(x, y) = \sqrt{\sum (x_i - y_i)^2} $$

The **Transformer** architecture (\citeauthor{vaswani2017}, \citeyear{vaswani2017}) takes this further using **Attention**. Attention is essentially a geometric measurement of alignment. It calculates the **Dot Product** (the angle) between query and key vectors:

$$ \text{Attention}(Q, K) = \text{softmax}\left(\frac{Q K^T}{\sqrt{d_k}}\right) $$

If two vectors point in the same direction (geometrically), the result is a large number. The Softmax function then converts this large geometric number back into a high **statistical probability**.

## Summary

1.  **The Goal is Statistical:** Minimize the surprise of the next token ($-\log P$).
2.  **The Medium is Geometric:** We treat parameters as coordinates on a surface.
3.  **The Process is Physical:** We "roll" the parameters down the energy landscape using gradients.

The LLM is not "thinking" in the biological sense; it is a ball rolling through a billion-dimensional valley, settling into the grooves carved by the statistics of human language.
</div>
