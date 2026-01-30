<?php include_once("functions.php"); ?>

<div class="md">
# Statistical Foundations: The Language of AI

AI doesn't think in certainties; it thinks in **probabilities**. To understand how a Transformer predicts the next word or how a Neural Network recognizes a face, we must look at the math developed by gamblers and astronomers centuries ago.

## The Normal Distribution (The Bell Curve)
In 1809, **Carl Friedrich Gauss** noticed that errors in astronomical observations tended to cluster around a central value, thinning out as you move away. This "Bell Curve" is the heartbeat of AI.

### Why it matters for AI:
When we create a new AI model, we don't know the "weights" (the rules) yet. We usually initialize them with a **Normal Distribution**. If we set them all to zero, the model learns nothing. If we set them too high, the math breaks.

Experiment with the **Mean ($\mu$)** (the center) and **Standard Deviation ($\sigma$)** (the spread):
</div>

<div style="display: flex; gap: 20px; align-items: center;">
    <div>
        $\mu$: <input type="range" id="slider-mu" min="-2" max="2" step="0.1" value="0"><br>
        $\sigma$: <input type="range" id="slider-sigma" min="0.1" max="2" step="0.1" value="1">
    </div>
    <div id="plot-gaussian" style="width: 100%; height: 300px;"></div>
</div>

<div class="md">
## Regression: The First "Model"
In the 1880s, **Francis Galton** studied how the height of children relates to the height of their parents. He called this "Regression." In modern AI, this is essentially a single-layer Perceptron.

The goal is to find a line that minimizes the distance to all points. In AI, we call this distance the **Loss**. Learning is simply the process of moving the line to make the Loss as small as possible.

<div id="plot-regression" style="width: 100%; height: 300px; max-width: 600px; margin: 0 auto;"></div>

## The Softmax Function: How AI Decides
Imagine an AI is looking at a picture. It calculates "scores" for different labels:
* Cat: 4.0
* Dog: 1.5
* Car: 0.1

These scores are hard to compare. AI uses the **Softmax function** (based on Ludwig Boltzmann’s 19th-century work) to turn these into percentages that sum to 100%.

### Interactive Softmax
Change the "raw scores" (Logits) to see how the AI's confidence shifts. Note how a small increase in a high score "eats up" the probability of others!
</div>

<div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
    <?php for($i=0; $i<3; $i++): 
        $labels = ['Cat', 'Dog', 'Pizza'];
    ?>
    <div style="margin-bottom: 15px;">
        <label style="display:inline-block; width: 60px;"><?= $labels[$i] ?>:</label>
        <input type="number" class="softmax-input" value="<?= 2 - $i ?>" step="0.5" style="width: 60px;">
        <div style="display: inline-block; width: 200px; height: 20px; background: #e2e8f0; vertical-align: middle; margin-left: 10px; border-radius: 10px; overflow: hidden;">
            <div id="softmax-bar-<?= $i ?>" style="height: 100%; background: #3b82f6; width: 0%; transition: width 0.3s;"></div>
        </div>
        <span id="softmax-text-<?= $i ?>" style="margin-left: 10px; font-weight: bold;">0%</span>
    </div>
    <?php endfor; ?>
</div>

<div class="md">
## Entropy: The Measure of Surprise
In 1948, **Claude Shannon** defined **Entropy** as the amount of uncertainty in a message. 
* If I tell you "The sun will rise tomorrow," the entropy is **low** (no surprise).
* If I tell you "A cat just flew a plane," the entropy is **high** (very surprising).

In training LLMs like ChatGPT, we use **Cross-Entropy Loss**. We punish the model based on how "surprised" it is by the correct answer. If the model was 99% sure the next word was "Apple" but it was actually "Banana," the high entropy (surprise) triggers a large update to the model's weights.

**Next Step:** Now that we understand the numbers, let's see how we can connect these "statistical neurons" together into a **Neural Network**.
</div>
