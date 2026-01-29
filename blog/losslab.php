<?php include_once("functions.php"); ?>

<div class="md">
In the previous section, we saw how AI represents data as **Tensors**. But how does a model actually learn to give the right answer? It uses a **Loss Function**.

A Loss Function is a mathematical way of measuring "how wrong" the AI is. If the AI's guess is far from the truth, the Loss is a high number. If the guess is perfect, the Loss is zero. Training an AI is essentially the process of turning knobs (parameters) to make this Loss number as small as possible.

## Regression: Mean Squared Error (MSE)

When we want the AI to predict a specific number, like the price of a house or the temperature tomorrow, we use **Regression**. 

The most common tool here is **Mean Squared Error**. We take the difference between the Truth ($y$) and the Guess ($\hat{y}$) and square it. Squaring is important because:
1. It makes all errors **positive** (you can't have "negative" wrongness).
2. It **punishes large mistakes** much harder than small ones.

$$\text{Loss} = (y_{\text{target}} - \hat{y}_{\text{pred}})^2$$

In the plot below, the loss creates a "bowl" shape. To train the AI, we calculate the **slope** (the derivative). If the slope is negative, the AI needs to increase its guess. If the slope is positive, it needs to decrease it.
</div>

<div style="display: flex; gap: 20px; align-items: center; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
	<div style="flex: 1;">
		<label><b>Target Number ($y$):</b> <small>(The Truth)</small></label>
		<input type="range" id="mse-true" min="0" max="10" step="1" value="7" style="width:100%">
		<br><br>
		<label><b>AI Guess ($\hat{y}$):</b> <small>(The Prediction)</small></label>
		<input type="range" id="mse-pred" min="0" max="10" step="0.1" value="2" style="width:100%">
	</div>
	<div id="mse-math" style="flex: 1; font-size: 1.1em; border-left: 3px solid #3b82f6; padding-left: 20px;"></div>
</div>

<div id="plot-mse" style="height: 350px;"></div>

<div class="md">
## Classification: Cross-Entropy

When an AI has to choose between categories (like "Cat" vs "Dog"), it doesn't just pick one; it outputs a **probability** for each. This is represented as a vector where all numbers add up to $1.0$ ($100\%$).

**Cross-Entropy Loss** looks at the probability the AI gave to the *correct* answer. 
* If the AI is $99\%$ sure it's a cat (and it is), the loss is almost $0$.
* If the AI is only $1\%$ sure it's a cat, the loss becomes **extremely high**.

The math uses a logarithm ($-\ln(P)$), which creates a steep "wall" as confidence approaches zero. This forces the AI to be very "uncomfortable" when it is wrong.
</div>

<div style="display: flex; flex-direction: column; gap: 15px; background: #fff7ed; padding: 20px; border-radius: 12px; border: 1px solid #ffedd5;">
	<div style="display: flex; justify-content: space-between; align-items: flex-start;">
		<p>Target Class: <span style="color: #f59e0b; font-weight: bold;">CAT</span></p>
		<div style="display: grid; grid-template-columns: 100px 150px 100px; gap: 15px; align-items: center;">
			<b style="font-size:0.8em">Class</b> <b style="font-size:0.8em">Confidence</b> <b style="font-size:0.8em">Loss</b>

			<span>Cat (Target)</span>
			<input type="range" id="cce-target" min="0.01" max="0.99" step="0.01" value="0.3">
			<span id="loss-target" style="font-family: monospace; font-weight: bold; color: #10b981;">-</span>

			<span>Dog</span>
			<div id="bar-dog" style="height: 15px; background: #94a3b8; border-radius: 4px; transition: width 0.2s;"></div>
			<span id="loss-dog" style="font-family: monospace; color: #ef4444;">-</span>

			<span>Bird</span>
			<div id="bar-bird" style="height: 15px; background: #94a3b8; border-radius: 4px; transition: width 0.2s;"></div>
			<span id="loss-bird" style="font-family: monospace; color: #ef4444;">-</span>
		</div>

		<div style="background: #1e293b; color: #38bdf8; padding: 15px; border-radius: 8px; font-family: monospace; min-width: 180px;">
			<div style="color: #94a3b8; margin-bottom: 5px; font-size: 0.8em;">Output Vector $\hat{y}$</div>
			[ <span id="vec-dog">0.00</span>, <span id="vec-cat" style="color: #fbbf24; font-weight: bold;">0.00</span>, <span id="vec-bird">0.00</span> ]
			<div style="margin-top: 10px; color: #94a3b8; font-size: 0.8em;">Target Vector $y$</div>
			[ 0.00, <span style="color: #10b981;">1.00</span>, 0.00 ]
		</div>
	</div>
        
	<div id="cce-math" style="margin-top: 10px; font-size: 1.1em; border-top: 1px solid #ffedd5; padding-top:10px;"></div>
</div>

<div id="plot-cce" style="height: 380px;"></div>

<div class="md">
## Beware of Goodhart's Law

Goodhart's Law states that every measure which becomes a target becomes a bad measure\footcite{goodhartslaw}. That is, 
when we focus solely on optimizing a single metric, we often lose sight of the actual goal. 
In the context of Language Models, this manifests as the gap between "Loss" and "True Intelligence."

While a model is trained to minimize **Loss** (predicting the next token), a low loss doesn't 
inherently mean the model is "smart" or "truthful." If we only optimize for mathematical 
probability, we risk creating a "Stochastic Parrot", a model that is statistically perfect 
but logically hollow, or worse, one that learns to "game" the benchmarks.

To truly evaluate success, we must look beyond the loss curve and use diverse benchmarks:
* **Perplexity:** Measures how well the model predicts a sample, but it can be misleadingly low 
if the model just memorizes data.
* **Benchmarks (MMLU, HumanEval):** Tests for reasoning and coding, though even these can 
fall victim to Goodhart's Law if the test data "leaks" into the training set.
* **Human Evaluation:** Ultimately, the best version of an Language Models is determined by whether 
it is actually helpful, safe, and accurate in real-world use.
</div>
