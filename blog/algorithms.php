<?php include_once("functions.php"); ?>

<div class="md">
When we train a neural network on a simple task like modular addition, something remarkable happens. The network doesn't just memorize the answers, it *discovers* an algorithm. Specifically, it learns to use the **Discrete Fourier Transform** to convert addition into wave interference \cite[Nanda et al., 2023]{nanda2023grokking}.

This section walks through, step by step, exactly *how* a tiny one-layer Transformer computes:

$$a + b \mod P$$

where $P = 113$ is a prime number. The network's vocabulary is just the numbers $\{0, 1, 2, \ldots, 112\}$, and it must output the correct sum modulo 113.

### The Core Insight

The network learns that **modular arithmetic is circular**. After $P$, you wrap around to 0, just like an angle wrapping around a circle. So the network represents each number as a **point on a circle**, and performs addition by **rotating angles**.

But a single circle (a single frequency) has too many ambiguities. So the network uses **5 different frequencies** simultaneously, and combines them via **constructive interference**, the same principle that makes noise-cancelling headphones work, but in reverse.

### The Algorithm in Five Steps

The trained network implements the following algorithm \cite[Section 4]{nanda2023grokking}:

1. **Embedding:** Map each input number to points on 5 different circles (5 Fourier components)
2. **Attention:** Bring the representations of $a$ and $b$ together
3. **MLP:** Apply trigonometric addition theorems to compute $\cos(\omega_k(a+b))$ and $\sin(\omega_k(a+b))$
4. **Unembedding:** Compare the result against all 113 possible output tokens using cosine similarity
5. **Interference:** The 5 frequencies constructively interfere *only* at the correct answer

The key formula that the MLP neurons compute is the **addition theorem**:

$$\cos(\omega_k(a+b)) = \underbrace{\cos(\omega_k a)}_{\text{from embedding of } a} \cdot \underbrace{\cos(\omega_k b)}_{\text{from embedding of } b} - \underbrace{\sin(\omega_k a)}_{\text{from embedding of } a} \cdot \underbrace{\sin(\omega_k b)}_{\text{from embedding of } b}$$

And the final logit for each candidate answer $c$ is:

$$\text{Logit}(c) = \sum_{k \in \{14,35,41,42,52\}} \alpha_k \cdot \underbrace{\cos\left(\omega_k \cdot (a + b - c)\right)}_{\substack{= 1 \text{ when } c = (a+b) \bmod P \\ < 1 \text{ otherwise}}}$$

This is maximal when $c = (a+b) \bmod P$, because then *all five* cosine terms equal 1 simultaneously.

### Connection to Grokking

This algorithm is not present at the start of training. The network first **memorizes** the training data (achieving 100% train accuracy but ~0% test accuracy). Then, after many more epochs, it suddenly "groks" the pattern, test accuracy jumps from 0% to 100% in a few hundred steps \cite[Figure 1]{nanda2023grokking}. Weight decay forces the network to find this compact Fourier solution instead of maintaining a large lookup table.

### Interactive Exploration

Below you can explore each step of the algorithm interactively. Change the input numbers, toggle frequencies on and off, and watch how the interference pattern changes.
</div>

<div id="fourier-algorithm-container"></div>

<script src="fourier_algorithm.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    if (typeof renderFourierAlgorithm === 'function') {
        renderFourierAlgorithm('fourier-algorithm-container', { a: 42, b: 80, P: 113 });
    }
});
</script>
