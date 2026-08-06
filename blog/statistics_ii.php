<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Statistics II — Inference and Information
description: Bayesian updating, entropy, the Dirichlet distribution, EM, Markov chains, Zipf.
icon: &#128200;
part: 1
order: 4
color: accent
topics: math-ii, math-iii, statistics
-->

<div class="md">
This second statistics chapter covers **inference**: how we update our beliefs given new data, and how we measure uncertainty. These are the tools that turn raw distributions into actionable predictions.

By the end, you will understand Bayesian reasoning, Shannon entropy, latent variable models (including EM), and Markov chains — all central to modern machine learning.
</div>

<div class="statlab-container">
<div class="statlab-container">


<div class="md">
## Bayesian Updating: The Logic of Science

While Gauß sought the "True Path" of planets among noisy observations, the Reverend **Thomas Bayes** was interested in a deeper philosophical question: how do we update our beliefs when we encounter new evidence?

His essay, that published posthumously in the year \citeyear{bayes1763essay}, provides the mathematical engine for **induction**. In modern AI, this is how a machine "changes its mind." It doesn't just see a pixel; it calculates how that pixel changes its confidence in what it is looking at.

### The Anatomy of an Update
The goal of Bayesian inference is to calculate the **Posterior**, your updated degree of belief in a hypothesis ($H$) after seeing evidence ($E$).

$$P(H|E) = \frac{\overbrace{P(E|H)}^{\text{Likelihood}} \cdot \overbrace{P(H)}^{\text{Prior}}}{\underbrace{P(E|H)P(H) + P(E|\neg H)P(\neg H)}_{\text{Total Evidence } P(E)}}$$

* **The Prior $P(H)$**: Your initial strength of belief before the new data arrives.
* **The Likelihood $P(E|H)$**: The probability that you would see this specific evidence if your hypothesis were actually true.
* **The Marginal Likelihood $P(E)$**: The "Total Evidence", the probability of seeing this data under *all* possible scenarios (both when $H$ is true and when it is false).

### The "Spam Filter" Logic
Imagine your "Prior" belief that any random email is spam is 20%. You then see the word **"WINNER"**.

1.  If the email *is* spam, the word "WINNER" appears 90% of the time (**Likelihood**).
2.  If the email *is not* spam, the word "WINNER" still appears 10% of the time (**False Positive**).

Bayesian updating allows us to weigh these possibilities to find the new probability that the email is spam.
</div>

<div class="statlab-interactive-zone">
    <div class="statlab-controls">
        <div class="control-group">
            <label>Initial Belief (Prior) $P(H)$:</label>
            <input type="range" id="bay-prior-new" min="0.01" max="0.99" step="0.01" value="0.20">
        </div>
        <div class="control-group">
            <label>Signal Strength (Likelihood) $P(E|H)$:</label>
            <input type="range" id="bay-tp" min="0.01" max="0.99" step="0.01" value="0.90">
            <p style="font-size:0.8em; color:gray;">(Prob. evidence appears if H is TRUE)</p>
        </div>
        <div class="control-group">
            <label>Noise/False Alarms $P(E|\neg H)$:</label>
            <input type="range" id="bay-fp" min="0.01" max="0.99" step="0.01" value="0.10">
            <p style="font-size:0.8em; color:gray;">(Prob. evidence appears if H is FALSE)</p>
        </div>

        <div id="bay-math-complex" class="statlab-math-display" style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;"></div>
    </div>
    <div id="plot-bayesian-migration" class="statlab-visual" style="height: 400px;"></div>
</div>

<div class="md">
When you start a prompt, the LLM is in a state of **Statistical Superposition**. It doesn't know if you are a coder, a poet, or a chef. Every word you type provides **Evidence** that collapses the probability space.

This is **Bayesian Inference**. Named after **Thomas Bayes**, this method allows the model to update its "Internal Map" ($P$) based on new data ($D$).
</div>

<div class="statlab-interactive-zone">
    <div class="md">
    Type a sentence in English, French, or German (e.g., *"Hello"* vs *"Bonjour"* vs *"Guten Tag"*). Watch how the model's "Belief" shifts in real-time as it processes each word.
    </div>
    
    <div class="statlab-controls">
        <input type="text" id="bayes-text-input" placeholder="Type here (Hello, Bonjour, Guten Tag...)" style="width: 100%; padding: 10px; font-size: 1.2rem;">
    </div>

    <div id="plot-bayesian-languages" style="width:100%; height:400px;"></div>
</div>

<div class="md">
## Entropy (The Messiness Scale)

While Gauß sought to minimize error in orbits, **Claude Shannon** in \citeyear{shannon1948communication} aimed to find the mathematical limit of communication. His goal was to quantify "Information" itself. He realized that information isn't about what is said, but about how **surprising** the outcome is.

If we toss a coin, each outcome is a state $x_i$. 
</div>

$$H(X) = - \sum_{i=1}^{n} \underbrace{P(x_i)}_{\text{Probability}} \cdot \underbrace{\log_2 P(x_i)}_{\text{The "Surprise" (Bits)}}$$

<div class="md">
* **$x_i$ Explained:** This represents the $i$-th possible outcome. For our coin, $x_1 = \text{Heads}$ and $x_2 = \text{Tails}$.
* **The Goal:** Shannon wanted a measure that was maximal when uncertainty was highest. If a coin is "fair" ($0.5/0.5$), you are maximally surprised by the result. If a coin is "weighted" ($1.0/0.0$), there is no surprise, so Entropy is zero.
</div>

<div class="statlab-interactive-zone">
    <div class="statlab-controls" style="max-width: 600px; margin: 0 auto;">
        
        <div class="control-group" style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
            <svg width="60" height="60" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="#ffd700" stroke="#b8860b" stroke-width="3" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#b8860b" stroke-width="1" stroke-dasharray="2,2" />
                <text x="50" y="65" font-family="Arial" font-size="40" font-weight="bold" fill="#b8860b" text-anchor="middle">🙂</text>
            </svg>
            
            <div style="flex-grow: 1;">
                <label style="font-size: 1.1em;"><strong>Head:</strong> <span id="label-head">50</span> / 100</label>
                <input type="range" id="entropy-p1" min="0" max="100" step="1" value="50" style="width: 100%; cursor: pointer;">
            </div>
        </div>
        
        <div class="control-group" style="display: flex; align-items: center; gap: 20px;">
            <svg width="60" height="60" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="#ffd700" stroke="#b8860b" stroke-width="3" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#b8860b" stroke-width="1" stroke-dasharray="2,2" />
                <text x="50" y="65" font-family="Arial" font-size="40" font-weight="bold" fill="#b8860b" text-anchor="middle">1€</text>
            </svg>
            
            <div style="flex-grow: 1;">
                <label style="font-size: 1.1em;"><strong>Tail:</strong> <span id="label-tail">50</span> / 100</label>
                <input type="range" id="entropy-p2" min="0" max="100" step="1" value="50" style="width: 100%; cursor: pointer;">
            </div>
        </div>
    </div>

    <div id="entropy-math-complex" class="statlab-math-display" style="padding: 25px; background: #fdfaf2; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0;">
        </div>

    <div id="plot-entropy" style="width: 100%; height: 350px;"></div>
</div>

<div class="md">
This concept is the backbone of modern AI. When a model like GPT predicts the next word, it calculates the **Cross-Entropy** between its guess and the actual word. The lower this cross-entropy, the more "certain" and accurate the model has become.
</div>

<div class="md">
## The Dirichlet Distribution: The Probability of Probabilities

While Zipf's Law tells us how common words are, it doesn't explain how they "clump" together. To understand how an AI chooses a "topic" before it chooses a word, we need the **Dirichlet Distribution**.

### History & The "Urn" Motivation
Named after **Peter Gustav Lejeune Dirichlet** in the 19th century, this distribution was a generalization of the Beta distribution.

Imagine an urn filled with marbles of $K$ different colors. If you start with a few marbles and every time you pick one, you put it back along with *more* marbles of the same color, you create a "rich-get-richer" effect. This is the **Pólya Urn Model**, and the Dirichlet distribution describes the resulting proportions of colors in the limit.

Mathematically, for a probability vector $p = (p_1, \dots, p_K)$, the density is:
$$f(p_1, \dots, p_K; \alpha_1, \dots, \alpha_K) = \frac{1}{\text{B}(\alpha)} \prod_{i=1}^{K} p_i^{\alpha_i - 1}$$
Where $\alpha$ is the **concentration parameter**.

In AI, we use this to solve the "Bag of Words" problem. Before a Transformer generates text, it is essentially sampling from a Dirichlet distribution to decide the "mixture" of the text.
* Is this 80% "Technical Manual" and 20% "Friendly Tutorial"?
* The $\alpha$ values represent the model's "prior knowledge" about how words group together in the training dataset.

When $\alpha < 1$, the distribution pushes probabilities toward the corners (the model becomes very "certain" and chooses one specific topic). When $\alpha > 1$, it pushes everything toward the center (a "vague" mixture of everything).
</div>

<div class="statlab-interactive-zone">
    <div class="md">
    Adjust the $\alpha$-parameters for three potential "Topics" (e.g., Science, Art, Sports). Watch how the "Probability Space" (represented as a 3D simplex) shifts.
    * **Low Alpha (< 1):** The AI is decisive; it picks one topic.
    * **High Alpha (> 1):** The AI is "blending" topics together.
    </div>

    <div class="statlab-controls">
        <label>Topic A Alpha (Science):</label>
        <input type="range" id="diri-a1" min="0.1" max="5.0" step="0.1" value="1.0">

        <label>Topic B Alpha (Art):</label>
        <input type="range" id="diri-a2" min="0.1" max="5.0" step="0.1" value="1.0">

        <label>Topic C Alpha (Sports):</label>
        <input type="range" id="diri-a3" min="0.1" max="5.0" step="0.1" value="1.0">
    </div>

    <div id="plot-dirichlet-simplex" style="width:100%; height:500px;"></div>
</div>

<div class="md">
## Latent Variables: The Hidden Logic of Context

When an AI reads a word, it faces a **Disambiguation Problem**. In statistics, we model this using **Gaussian Mixture Models (GMMs)**. This theory suggests that the data we see (tokens) is actually generated by several hidden (latent) distributions.

### Expectation-Maximization (EM)
The algorithm used to solve this was formalized by **Arthur Dempster, Laird, and Rubin** in 1977. It works in two steps that mirror how a Transformer processes context:
1.  **Expectation (E):** Based on the current words, what is the probability that we are in "Topic A" vs "Topic B"?
2.  **Maximization (M):** Adjust the internal "weights" to favor the words that fit that topic.

### The Statistical "Vibe"
In LLMs, this is why a prompt works. By typing "Import torch," you are statistically forcing the model's **Hidden State** to move its "Expectation" entirely into the "Coding" cluster, making "print" infinitely more likely than "reproduction" (the biology cluster).
</div>

<div class="statlab-interactive-zone">
    <div class="md">
    Adjust the "Cluster Separation." When clusters overlap, the AI's "Choice" is statistically noisy (uncertain). As the Transformer sees more context, it effectively "pushes" these distributions apart to make a clear choice.
    </div>

    <div class="statlab-controls">
        <label>Topic Separation (Distance):</label>
        <input type="range" id="gmm-dist" min="0.5" max="5.0" step="0.1" value="2.0">

        <label>Cluster Variance (Noise):</label>
        <input type="range" id="gmm-var" min="0.1" max="1.5" step="0.1" value="0.5">
    </div>

    <div id="plot-gmm-clusters" style="width:100%; height:450px;"></div>

    <div class="md">
    Mathematically, the probability of a word $x$ given the mixture is:
    $$P(x) = \sum_{k=1}^{K} \pi_k \mathcal{N}(x | \mu_k, \Sigma_k)$$
    Where $\pi_k$ is the weight of topic $k$, and $\mathcal{N}$ is the Normal Distribution (the Bell Curve) you learned about in the Statistics section.
    </div>
</div>

<div class="md">
## The Law of Large Numbers

In the real world, language is a **Non-Stationary Process**. If you only read the first page of \citetitle{nietzsche1883zarathustra}, your statistical "Prior" is heavily biased by the opening scene. 

The **Law of Large Numbers** ensures that as our sample size $n$ grows, the observed frequency $\bar{X}_n$ of words like "the" or "God" converges to their true mathematical mean $\mu$ within the entire corpus.
</div>

$$ \bar{X}_n = \frac{1}{n} \sum_{i=1}^{n} X_i \xrightarrow{n \to \infty} \mu $$

<div class="statlab-interactive-zone">
	<div class="statlab-controls">
		<label>Reading Window (Tokens):</label>
		<input type="range" id="lln-zarathustra-n" min="10" max="10000" step="50" value="500" disabled>
		<span id="lln-count-display">500</span> / <span id="lln-total-tokens">0</span> words
	</div>
    
	<div id="plot-zarathustra-convergence"></div>
</div>

<div class="md">
## Markovian Transitions (The Probability of "Next")

An LLM is not just a list of word counts; it is a map of **Conditional Probabilities**. This is the logic of **Andrey Markov** (1906). He proposed that we can predict the future state of a system based solely on its current state.

In linguistics, we call this an **N-Gram**.
* A **Unigram** is just the chance of a word appearing ($P(w)$).
* A **Bigram** is the chance of a word appearing *given* the previous word ($P(w_n | w_{n-1})$).

$$ P(A|B) = \frac{P(A \cap B)}{P(B)} $$

If Nietzsche wrote "Thus spake" 100 times, but "Thus thought" only 5 times, the Markov-Chain "chooses" based on this statistical skew.
</div>

<div class="statlab-interactive-zone">
    <div class="md">
    Select a word found in the \citetitle{nietzsche1883zarathustra} by \citeauthor{nietzsche1883zarathustra} to show you every word that ever followed it and how likely they are depending on their real statistics.
    </div>

    <div class="statlab-controls">
        <label>Select a "Current" Word:</label>
        <select id="markov-word-select" style="padding: 10px; border-radius: 5px;">
            <option value="thus">thus</option>
            <option value="spake">spake</option>
            <option value="zarathustra">zarathustra</option>
            <option value="and">and</option>
            <option value="the">the</option>
            <option value="world">world</option>
            <option value="is">is</option>
            <option value="the">the</option>
            <option value="earth">earth</option>
            <option value="great">great</option>
            <option value="will">will</option>
            <option value="man">man</option>
        </select>
    </div>

    <div id="plot-markov-transitions" style="width:100%; height:400px;"></div>
</div>

<div class="md">
Now, we visualize the transition probabilities $P(w_n | w_{n-1})$. The training process creates a map where each word points to its potential successors, weighted by their frequency in the source text.
</div>

<div class="statlab-interactive-zone" style="background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0;">
    
    <div class="md">**Source Text**:</div>
    <textarea id="markov-corpus" onchange="trainMarkovModel()" style="width: 100%; height: 100px; padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-family: monospace; margin-bottom: 10px;">
When Zarathustra was thirty years old, he left his home and the lake of
his home, and went into the mountains. There he enjoyed his spirit and
solitude, and for ten years did not weary of it. But at last his heart
changed, and rising one morning with the rosy dawn, he went before the
sun, and spake thus unto it:

Thou great star! What would be thy happiness if thou hadst not those for
whom thou shinest!

For ten years hast thou climbed hither unto my cave: thou wouldst have
wearied of thy light and of the journey, had it not been for me, mine
eagle, and my serpent.

But we awaited thee every morning, took from thee thine overflow and
blessed thee for it.

Lo! I am weary of my wisdom, like the bee that hath gathered too much
honey; I need hands outstretched to take it.

I would fain bestow and distribute, until the wise have once more become
joyous in their folly, and the poor happy in their riches.

Therefore must I descend into the deep: as thou doest in the
evening, when thou goest behind the sea, and givest light also to the
nether-world, thou exuberant star!

Like thee must I GO DOWN, as men say, to whom I shall descend.

Bless me, then, thou tranquil eye, that canst behold even the greatest
happiness without envy!

Bless the cup that is about to overflow, that the water may flow golden
out of it, and carry everywhere the reflection of thy bliss!

Lo! This cup is again going to empty itself, and Zarathustra is again
going to be a man.

Thus began Zarathustra's down-going.
    </textarea>

    <div style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
        <div class="md" style="margin-bottom: 10px;">**Live Predictions**:</div>
        
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <input type="text" id="seed-word" placeholder="Enter word (e.g., 'zarathustra')" style="flex-grow: 1; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1;">
            <button onclick="generatePredictions()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Predict</button>
            <button onclick="resetSequence()" style="padding: 10px 15px; background: #64748b; color: white; border: none; border-radius: 6px; cursor: pointer;">Reset</button>
        </div>

        <div style="min-height: 140px; border: 1px solid #f1f5f9; padding: 15px; background: #ffffff; border-radius: 8px; margin-bottom: 15px;">
            <div class="md" style="margin-bottom: 10px;"><small>**Likely next words (Likelihood %):**</small></div>
            <div id="word-suggestions" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px;">
                </div>
        </div>

        <div style="padding: 15px; background: #f1f5f9; border-left: 4px solid #10b981; border-radius: 4px;">
            <div class="md" style="margin-bottom: 5px;"><small>**Generated Sequence:**</small></div>
            <div id="sequence-output" style="font-family: serif; font-size: 1.25em; color: #1e293b; min-height: 1.5em; line-height: 1.4;">...</div>
        </div>
    </div>
</div>

<div class="statlab-section">
    <div class="md">
        ## Boltzmann Distributions
	
        Originally formulated by **\citeauthor{boltzmann}** (c. \citeyear{boltzmann}) in his work on *Statistical Mechanics*, this was designed to solve the problem of **Molecular Velocity**. He wanted to know: in a room full of gas, how many molecules are moving fast versus slow?

        In LLMs, we apply this to the "vocabulary" instead of "molecules." The **Temperature** ($T$) determines how much energy is in the system.
        - **The Graph:** Shows the probability of picking specific tokens.
        - **Live Logic:** At high $T$, the distribution flattens (Entropy increases). At low $T$, the "cold" model only picks the most certain word.
    </div>
    <div class="statlab-interactive-zone">
        <p>Enter 5 raw scores (Logits) separated by commas:</p>
        <input type="text" id="boltz-input" value="10, 8, 5, 2, 1" style="width:100%" oninput="LLMStatsLab.renderBoltzmann()">
        <label>Temperature ($T$): <input type="range" id="boltz-temp" min="0.1" max="5" step="0.1" value="1.0" oninput="LLMStatsLab.renderBoltzmann()"></label>
        <div id="boltz-eqn" style="padding:10px; background:#f8fafc; margin:10px 0; font-family:serif;"></div>
        <div id="boltz-plot"></div>
    </div>
</div>

<div class="statlab-section">
    <div class="md">
        ## Maximum Likelihood Estimation (MLE): The Fisherian Fit

        Popularized by **Sir \citeauthor{fisher1922}**, MLE was created to solve the problem of **Parameter Estimation**. If you see 10 tall people, what is the "most likely" average height of the whole population?

        LLMs use this to find the best weights ($\theta$) for the model.
        - **The Graph:** The red dots are your "observed data." The blue curve is your model.
        - **The Goal:** Move the slider to align the peak of the curve with the cluster of dots to maximize the "Likelihood" value.
    </div>
    <div class="statlab-interactive-zone">
        <p>Enter your observed data points (e.g., -1, 0.5, 2):</p>
        <input type="text" id="mle-input" value="-1.5, -0.5, 0, 0.5, 1.5" style="width:100%" oninput="LLMStatsLab.renderMLE()">
        <label>Hypothesized Mean ($\mu$): <input type="range" id="mle-mu" min="-5" max="5" step="0.1" value="0" oninput="LLMStatsLab.renderMLE()"></label>
        <div id="mle-eqn" style="padding:10px; background:#f8fafc; margin:10px 0;"></div>
        <div id="mle-plot"></div>
    </div>
</div>

<div class="statlab-section">
    <div class="md">
        ## The Chain Rule of Probability: Kolmogorov's Logic

        Formalized by **\citeauthor{kolmogorov1933}** in *\citetitle{kolmogorov1933}* (\citeyear{kolmogorov1933}), the Chain Rule of Probability solves the problem of **Sequential Dependencies**. (It is distinct from the calculus chain rule that powers backpropagation.) It explains how to calculate the probability of a complex event by breaking it into a series of conditional steps.
        
        In an LLM, the probability of the sentence "The cat sat" is calculated as:
        $P(\text{The}) \times P(\text{cat} | \text{The}) \times P(\text{sat} | \text{The cat})$
    </div>
    <div class="statlab-interactive-zone">
        <p>Enter 3 conditional probabilities (e.g., 0.1 for a common word, 0.001 for rare):</p>
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; margin-bottom:10px;">
            <div>
                <small>P(Word 1)</small>
                <input type="number" id="cr-p1" value="0.5" step="0.05" min="0" max="1" style="width:100%" oninput="LLMStatsLab.renderChainRule()">
            </div>
            <div>
                <small>P(Word 2 | W1)</small>
                <input type="number" id="cr-p2" value="0.3" step="0.05" min="0" max="1" style="width:100%" oninput="LLMStatsLab.renderChainRule()">
            </div>
            <div>
                <small>P(Word 3 | W1, W2)</small>
                <input type="number" id="cr-p3" value="0.8" step="0.05" min="0" max="1" style="width:100%" oninput="LLMStatsLab.renderChainRule()">
            </div>
        </div>
        <div id="cr-eqn" style="padding:15px; background:#f1f5f9; border-radius:8px; margin:10px 0; font-family: monospace; font-size: 0.9em;"></div>
        <div id="cr-plot" style="height:350px;"></div>
    </div>
</div>

<div class="statlab-section">
    <div class="md">
        ## KL Divergence: Information Gain

        Introduced in \citeauthorlastnameand{leiblerkullback} *\citetitle{leiblerkullback}* (\citeyear{leiblerkullback}), this was originally used for **Cryptanalysis** and military intelligence. It measures the "surprise" or extra bits of info needed if you use Distribution Q to approximate Distribution P.

        - **The Graph:** Shows the overlap between P (Truth) and Q (Model).
        - **Live Logic:** The divergence $D_{KL}$ is 0 only when the distributions are identical.
    </div>
    <div class="statlab-interactive-zone">
        <label>Shift Model (Q) Mean: <input type="range" id="kl-q-mu" min="-4" max="4" step="0.1" value="2" oninput="LLMStatsLab.renderKL()"></label>
        <div id="kl-eqn" style="padding:10px; background:#f8fafc; margin:10px 0;"></div>
        <div id="kl-plot"></div>
    </div>
</div>

<div class="statlab-section">
    <div class="md">
        ## Bag of Words (BoW): The Linguistic Atom
        The "Distributional Hypothesis", the idea that words occurring in similar contexts have similar meanings, was popularized by **\citeauthor{zelligharris}** in his \citeyear{zelligharris} article *\citetitle{zelligharris}*. It treats a document not as a sequence, but as a "bag": you lose the grammar, the order, and the syntax, keeping only the raw counts.

        This was the primary method for **Spam Filtering** and early **Search Engines** before LLMs.
        - **The Graph:** Visualizes the "Vector" of your text. Each unique word is a dimension.
        - **Live Logic:** Watch how "The cat sat" and "Sat the cat" produce the exact same statistical signature, demonstrating the model's "blindness" to word order.
    </div>
    <div class="statlab-interactive-zone">
        <p>Type or paste text to see its "Bag of Words" representation:</p>
        <textarea id="bow-input" style="width:100%; height:80px; padding:10px; border-radius:8px; border:1px solid #cbd5e1; font-family: sans-serif;" oninput="renderBoW()">The quick brown fox jumps over the lazy dog. The dog was not so lazy after all.</textarea>

        <div id="bow-eqn" style="padding:15px; background:#f8fafc; border-radius:8px; margin:10px 0; font-family: serif; border-left: 4px solid #10b981;"></div>

        <div id="bow-plot" style="height:350px;"></div>
    </div>
</div>

</div>
</div>
