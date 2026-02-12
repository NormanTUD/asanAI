<?php include_once("functions.php"); ?>

<div class="md">
## From LM to LLM: Scaling Intelligence

A **Language Model (LM)** is a mathematical function that predicts the next "token" in a sequence based on probability. It treats language like a giant puzzle where it calculates the likelihood of the next piece based on the pieces already on the board.

### The Core Difference: Scale and Capability

The "Large" in **Large Language Model (LLM)** refers to a massive increase in two specific areas: **Parameters** and **Training Data**.

* **Standard LM:** Often trained on specific datasets (like medical journals or a small library) to perform narrow tasks like translation or basic autocomplete.
* **LLM:** Trained on the "digital commons", snapshots of the entire public internet (Wikipedia, GitHub, books, and forums). This scale allows the model to capture complex nuances like sarcasm, professional tone, and logic.

It is also called *large* language model because it doesn't only have a few hundreds or thousands of parameters, but billions of them. The Feed-Forward-Matrix of a transformer, for example, is at least as large as the number of dimensions. And LLMs have hundreds or thousands of those in parallel.

## Understanding "Context"
In the architecture of Large Language Models, **Context** refers to the specific window of information the model can "see" and process at any given moment. Technically, it is a finite sequence of **tokens** (words, characters, or chunks) held in the model's short-term working memory during a single inference pass. Because LLMs are **stateless**, meaning they do not "remember" previous interactions once a session ends, every new prompt must feed the entire relevant conversation history back into the model. Anything outside this "Context Window" effectively ceases to exist for the model's mathematical calculations.

### In-Context Learning (ICL)
In-Context Learning is the ability of a model to "learn" new tasks or formats during a conversation without any updates to its underlying neural weights (no gradient descent). 

#### The Mathematics of Contextual Learning
Mathematically, ICL can be viewed as a form of **implicit Bayesian inference**. When you provide examples $(x_1, y_1, x_2, y_2)$, the model calculates the conditional probability $P(y_\text{test} \mid x_\text{test}, C)$, where $C$ is the provided context. Recent research suggests that during the forward pass, the **Attention layers** simulate a mini-optimization process. The examples in the context act as Keys ($K$) and Values ($V$), while your query acts as the Query ($Q$).

In this equation, the model isn't just retrieving data; it is using the relationships defined in the context to "map" the new input to an output, effectively performing a temporary linear regression or gradient descent within the activation space of the transformer.

### The Autoregressive Loop (Generation)
A generative model doesn't produce a full sentence at once. It works in a loop:

1.  **Input:** The user prompt (e.g., "The king is").
2.  **Forward Pass:** The model processes the sequence and produces a probability distribution for the *very next* token.
3.  **Sampling:** The model picks a token (e.g., "wise") based on that distribution.
4.  **Feedback:** The word "wise" is appended to the input, and the new sequence ("The king is wise") is fed back into the model to predict the next token (e.g., a period).

This continues until the model generates a special `|endoftext|` token, which signifies that the text generation has reached it's end.

## The Universal Compressor: Statistical Inference through Geometry

An LLM is a high-order **statistical machine**. Its primary goal is the optimization of an objective function, the mathematical "target" that defines its behavior. To reach this goal, the model employs a variety of methodologies, treating **meaning as geometry** and using mechanisms **akin to a physics simulation** to resolve logic.

### The Abstract Goal: Sequence Completion
The model's overarching objective $\mathcal{O}$ is to find the most likely next element in a sequence:

$$\mathcal{O} = \arg\max_{y \in \mathcal{V}} P(y \mid x_{1}, x_{2}, \dots, x_{n})$$

Or, in plain English: The goal is to find the **best possible word** ($y$) from the entire **dictionary** ($\mathcal{V}$) that has the **highest probability** ($P$) of coming next, given the **specific sequence of words** ($x_1 \dots x_n$) we have seen so far.

**Variable Definitions:**
* $\mathcal{O}$: The **Objective** or the predicted output.
* $\arg\max$: The operation of finding the argument ($y$) that results in the **maximum** value of the probability function.
* $y$: The **Target Token**; the specific word or piece of information being predicted from the vocabulary $\mathcal{V}$.
* $\mathcal{V}$: The **Vocabulary**; the complete set of all possible tokens (words, symbols, or characters) that the model is capable of outputting.
* $P$: The **Probability** assigned by the model's internal weights.
* $x_{1}, \dots, x_{n}$: The **Context Window**; the sequence of preceding tokens (input) that the model uses as evidence.
* $\mid$: The mathematical symbol for **Conditional Probability** (read as "given that").

### The Methods: Geometry and "Physics"
To solve the equation above, the model doesn't just look at word frequencies; it builds an internal map of reality.

* **Geometry of Meaning**: Words are mapped to high-dimensional vectors. Logic is solved through **Semantic Arithmetic**:
    $$\text{Vector}(\text{King}) - \text{Vector}(\text{Man}) + \text{Vector}(\text{Woman}) \approx \text{Vector}(\text{Queen})$$
    
* **The Physics Mechanism**: The model processes information using a system akin to a **physics simulation**. It treats the "Residual Stream" (the flow of data) as a conveyor belt and uses **Attention** as a form of **Gravitational Relevance**. 
    * Tokens exert a "pull" on each other. If the context contains "The orbit of the...", the word "planet" exerts a gravitational influence on the next-token prediction, pulling the model's internal state toward that specific coordinate in geometric space.

### Energy-Based Decision Making
The model uses an approach similar to **statistical mechanics** to decide which word is "right." It assigns an **Energy** ($E$) value to every possible next word.

* **Low Energy**: Represents high logic and statistical consistency.
* **High Energy**: Represents "hallucinations" or illogical continuations.

To convert these abstract energy levels into usable probabilities, it uses the **Gibbs Distribution**:
$$P(y \mid x) = \frac{e^{-\beta E(y,x)}}{Z}$$

**Variable Definitions:**
* $E(y,x)$: The **Energy Function**; a scalar value representing the incompatibility between the input $x$ and the potential output $y$.
* $e$: Euler's number (approx. 2.718), used to create an exponential relationship where low energy results in exponentially higher probability.
* $\beta$: The **Inverse Temperature** ($1/T$). It controls how "strictly" the model follows the lowest energy path.
* $Z$: The **Partition Function** ($\sum e^{-E}$); a normalization constant that ensures all probabilities sum up to 1.0 (100%).

**Summary**: By viewing the LLM as a statistical machine that solves $\mathcal{O}$ through geometric mapping and energy-based physics, we see that "understanding" is simply the byproduct of extreme statistical compression.

### Energy-Based Perspective on Inference

In the framework of **Energy-Based Models (EBMs)**, we move away from the strict requirement of normalized probabilities to focus on a scalar **Energy Function** $E(x, y)$. This function measures the "incompatibility" between an input $x$ and a potential output $y$. As established by the paper **\citetitle{lecun2006}**, the objective of the model is to associate low energy values with correct configurations and high energy values with incorrect ones. This approach is highly efficient because it avoids the "partition function problem", the computationally expensive task of ensuring all possible outcomes sum to exactly one.

## Application to Large Language Models (LLMs)

While LLMs are typically trained as probabilistic classifiers, they function as EBMs during the inference process:

* **Logits as Negative Energy:** The raw scores (logits) produced by the Transformer before the final softmax layer can be viewed as negative energy. A high logit corresponds to low energy $E(x, y)$, indicating high compatibility with the preceding context.
* **The Gibbs Bridge:** The softmax function acts as the bridge between energy and probability via the **Gibbs Distribution**:
    $$P(y \mid x) = \frac{e^{-E(x, y) / T}}{\sum_{y' \in \mathcal{V}} e^{-E(x, y') / T}}$$
    Here, the **Temperature ($T$)** controls the "sharpness" of the energy landscape. At low temperatures, the model becomes "greedy," strictly favoring the global energy minimum (the most logical token). At higher temperatures, the landscape flattens, allowing for "higher energy" (less probable but more creative) transitions.
* **Geometric Reasoning:** In this view, generating text is not just counting words; it is an act of **navigating a high-dimensional energy surface**, where the model "flows" toward the states of lowest energetic tension to maintain logical and linguistic consistency.

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

<div class="md">
## Understanding the Gibbs Distribution

In the 3D map above, we see **Energy** ($E$), a measure of how "wrong" or "unlikely" a state is. But an LLM needs to output a **Probability** ($P$) to choose the next word. The **Gibbs Distribution** is the bridge between these two worlds.


### How it works:
* **Energy to Probability**: We take the negative exponent of the energy: $e^{-E}$. This ensures that **lower energy** (better logic) results in **higher probability**.
* **The Role of Temperature ($T$)**:
    * **Low Heat ($T \to 0$):** The model becomes "greedy." It only cares about the absolute lowest energy state, making the distribution very peaky.
    * **High Heat ($T \to \infty$):** The differences in energy matter less. The distribution flattens out, allowing the model to pick "higher energy" (more creative or random) words.

**Summary**: The LLM turns language into a map, simulates a temporary logic circuit based on your prompt, and navigates the result using energy functions to flow toward the most meaningful destination.

## Outlook

This is just a general outlook on what LLMs do without going into details. This article will go into a lot of different details, some technical, some historical, some philosophical ones, to try to tackle LLMs from all sides.
</div>
