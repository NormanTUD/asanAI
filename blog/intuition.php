<?php include_once("functions.php"); ?>

<div class="md">
## Deep Dive: The High-Dimensional Geometry of Probability

While we visualize a 3D landscape with hills and valleys, the reality of an LLM is a **High-Dimensional Manifold**. In a 3D world, a point is defined by $(x, y, z)$. In a Transformer like GPT-4, a single word (token) is defined by thousands of coordinates $(x_1, x_2, ..., x_{4096})$. 

### 1. The Dimensions: What are $x$ and $y$ really?
In our analogy, the horizontal axes represent the **Semantic Space**. Each dimension captures a specific feature of language (e.g., gender, tense, sentiment, or abstract logic). 
* **Geometry = Similarity:** If two word-sequences are geometrically close in this space, they share similar contexts in the training data.
* **The Manifold:** The "floor" of our landscape isn't flat; it’s a complex shape where only certain areas represent "human-like" language.

### 2. The $z$-Axis: Why the Logarithm?
We define Energy ($z$) as $E = -\ln(P)$. Why not just use raw probability $P$? 
In language, the probability of a sentence is the product of its words: $P(Word_1) \times P(Word_2) \dots$. Multiplying thousands of tiny decimals leads to "arithmetic underflow" (numbers becoming effectively zero). By taking the **Natural Logarithm ($\ln$)**, we transform multiplication into **addition**:

$$\ln(A \times B) = \ln(A) + \ln(B)$$

This makes it mathematically possible to calculate the "cost" of long texts. This connection was famously bridged by **Claude Shannon**, who linked the statistical surprise of data to its entropy.



### 3. Energy as "Training Echo"
In this system, **Low Energy** does not just mean "correct"; it means **"High Density in Training Data."**
* **Low Energy (Deep Valleys):** These represent patterns the model saw millions of times (e.g., "The sky is blue"). The model has "carved" a deep path here because the Maximum Likelihood Estimation (MLE) forced it to minimize the "loss" (energy) for these examples.
* **High Energy (Mountain Peaks):** These represent sequences that never occurred or contradicted the corpus (e.g., "The sky is square"). To the model, these are "physically difficult" to generate because they require moving "uphill" against the statistical gravity of the training data.

### 4. The Statistical Goal
The LLM uses **Geometry** (dot-products in embedding space) to calculate these distances, but the **Goal** is purely **Statistical**: to ensure that the generated text stays in the "valleys" of the probability distribution it inherited from humanity's collective writing.
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
