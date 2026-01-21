<?php include_once("functions.php"); ?>

<div class="md">
## The Problem: Why AI Lies to You

One of the biggest dangers of modern AI (Large Language Models) is that they can sound incredibly confident while saying something completely untrue. We call this a **Hallucination**.

To understand why this happens, we have to stop thinking of AI as a "Database of Knowledge" and start thinking of it as a **Pattern Completion Engine**.

The AI does not "know" that the capital of France is Paris. It simply knows that in the millions of books it read, the word "Paris" appears extremely often after the phrase "The capital of France is".

## The Mechanism: Next-Token Prediction

At its core, an LLM is a giant mathematical function that calculates probabilities. It looks at the text you have written so far (the Context) and calculates a probability score for every single word in its vocabulary to see which one should come next.

$$ P(w_{next} | \text{context}) $$

Imagine the AI is trying to finish the sentence: *"The sky is..."*
Here is what the internal probabilities might look like:
</div>

<div id="token-prediction-plot" style="width:100%; max-width:600px; height:400px; margin: 0 auto 40px auto;"></div>

<div class="md">
In this case, the AI will likely pick "Blue". But notice that "Green" and "Cheese" are not zero. They are just unlikely. If the AI is forced to be "creative," it might pick them.

## The Role of Temperature

How do we control this? We use a parameter called **Temperature ($T$)**.

Mathematically, the AI produces a "Raw Score" (called a Logit, $z$) for every word. To turn these scores into percentages (probabilities), we use the **Softmax Function** with Temperature:

$$ P(i) = \frac{e^{z_i / T}}{\sum e^{z_j / T}} $$

* **Low Temperature ($T \to 0$):** The most likely word gets nearly 100% probability. The AI becomes robotic, factual, and repetitive.
* **High Temperature ($T \to \infty$):** The probabilities flatten out. "Paris" and "Frog" become almost equally likely. The AI becomes "creative," but also starts **Hallucinating**.

Try it yourself below. The context is: *"The capital of France is..."*
Watch how increasing the Temperature makes the AI more likely to say something wrong ("Frog").
</div>

<div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
    <div style="margin-bottom: 10px; font-weight: bold;">
        Temperature ($T$): <span id="temp-value-display">1.0</span>
    </div>
    <input type="range" id="slider-temperature" min="0.1" max="5.0" step="0.1" value="1.0" style="width: 100%;">
    
    <div id="temperature-plot" style="width:100%; height:350px;"></div>
    
    <div id="temp-output-text" style="padding: 10px; background: #fff; border-left: 4px solid #3b82f6;"></div>
</div>

<div class="md">
## The Dangers of Blind Trust

Because the AI is just predicting the next word based on style and syntax, it can generate **Plausible-Sounding Nonsense**.

1.  **Fake Citations:** If you ask for a medical study, the AI knows what a study title *looks* like. It will invent a title, invent author names that sound real, and give you a link that doesn't exist. It isn't lying on purpose; it's just completing the pattern of "What a bibliography looks like."
2.  **Code Vulnerabilities:** AI can write code, but it often guesses libraries or functions that don't exist (hallucination) or uses outdated, insecure patterns because they were common in the training data.
3.  **Confidence:** The most dangerous part is the tone. The AI does not hesitate. It does not say "I think...". It says "The answer is X," even when X is wrong.

## How to use AI Safely

You should treat an LLM like a **very eager, very well-read, but occasionally drunk intern.**

* **Human in the Loop:** Never automate a system where the AI takes critical action (like sending money or medical advice) without a human checking it first.
* **Verify Facts:** Use AI for summarization, drafting, and brainstorming. Do **not** use it as a search engine for facts without verifying the output via Google or a trusted source.
* **RAG (Retrieval Augmented Generation):** This is a technique where we give the AI a specific text (like a manual) and say "Only answer using this text." This reduces hallucinations significantly because the AI doesn't have to rely on its "fuzzy memory."

> **Rule of Thumb:** If the output *looks* right, be suspicious. Always check the math, run the code, and click the links.

## Philosophical Context: Understanding the "Mind" of the Machine

To truly understand why hallucinations happen, it helps to look at AI through the lens of philosophy. These concepts explain why an AI can speak perfect English yet have no idea what it is talking about.

### 1. The Chinese Room Argument (John Searle)
In 1980, philosopher John Searle proposed a famous thought experiment called the **Chinese Room**.

Imagine a person who speaks only English sitting inside a locked room. They have a rulebook (the "program") that says: *"If you see this shape (Chinese character), output that shape."*
If you slip a question in Chinese under the door, the person can follow the rulebook and slide a perfect answer back out.

* **The Result:** To the person outside, it looks like the person in the room understands Chinese.
* **The Reality:** The person inside is just manipulating symbols based on syntax (rules) without any semantics (meaning).
* **The Lesson:** AI is the person in the room. It has a perfect rulebook for English, but it doesn't *understand* the words "Paris" or "France." It just knows they go together.

### 2. "Bullshit" vs. Lying (Harry G. Frankfurt)
We often say the AI is "lying," but that isn't technically true. To lie, you must know the truth and choose to hide it.

In his essay *On Bullshit* (1986/2005), philosopher Harry G. Frankfurt defines "bullshit" not as false, but as **phony**.
> "The essence of bullshit is not that it is false but that it is phony... [The bullshitter] does not care whether the things he says describe reality correctly. He just picks them out, or makes them up, to suit his purpose."

This is the perfect definition of an AI Hallucination. The AI is indifferent to the truth; it is only trying to satisfy the pattern.

### 3. Stochastic Parrots (Emily M. Bender et al.)
In a landmark 2021 paper, computational linguist Emily M. Bender and her colleagues described Large Language Models (LLMs) as **"Stochastic Parrots"**.

* **Stochastic:** Randomly determined; having a random probability distribution.
* **Parrot:** An animal that can mimic the *sounds* of human speech without accessing the *meaning* behind them.

Bender argues that because these models learn only from the statistical likelihood of word sequences, they are merely "haphazardly stitching together sequences of linguistic forms... without any reference to meaning". When an AI hallucinates, it is just "parroting" a pattern it saw somewhere else, regardless of whether it makes sense in the real world.
</div>
