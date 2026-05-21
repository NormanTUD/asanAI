<?php include_once("functions.php"); ?>

<div class="md">
When we train a neural network on a simple task like modular addition, something remarkable happens. The network doesn't just memorize the answers, it *discovers* an algorithm. Specifically, it learns to use the **Discrete Fourier Transform** to convert addition into wave interference, as described by \cite[Nanda et al., 2023]{nanda2023grokking}.

This section walks through, step by step, exactly *how* a tiny one-layer Transformer computes:

$$a + b \mod P$$

where $P = 113$ is a prime number. The network's vocabulary is just the numbers $\{0, 1, 2, \ldots, 112\}$, and it must output the correct sum modulo 113.

## The Core Insight

The network learns that **modular arithmetic is circular**. After $P$, you wrap around to 0, just like an angle wrapping around a circle. So the network represents each number as a **point on a circle**, and performs addition by **rotating angles**.

But a single circle (a single frequency) has too many ambiguities. So the network uses **5 different frequencies** simultaneously, and combines them via **constructive interference**, the same principle that makes noise-cancelling headphones work, but in reverse.

## The Algorithm in Five Steps

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

## Connection to Grokking

This algorithm is not present at the start of training. The network first **memorizes** the training data (achieving 100% train accuracy but ~0% test accuracy). Then, after many more epochs, it suddenly "groks" the pattern, test accuracy jumps from 0% to 100% in a few hundred steps. Weight decay forces the network to find this compact Fourier solution instead of maintaining a large lookup table.

## Interactive Exploration

Below you can explore each step of the algorithm interactively. Change the input numbers, toggle frequencies on and off, and watch how the interference pattern changes.
</div>

<div id="fourier-algorithm-container"></div>

<div class="md">
## The Neuron-Logit Map $W_L$

The matrix $W_L = W_U W_{\text{out}}$ maps MLP activations directly to logits. It is approximately **rank 10**, with each direction corresponding to the cosine or sine of one of the 5 key frequencies \cite[Section 4.2, Equation 2]{nanda2023grokking}:

$$W_L \approx \sum_{k \in \{14,35,41,42,52\}} \cos(\omega_k) \cdot u_k^T + \sin(\omega_k) \cdot v_k^T$$

The residual after this approximation has Frobenius norm under **0.55%** of the norm of $W_L$.
</div>

<div id="neuron-logit-container" style="max-width:900px; margin:0 auto;"></div>

<script>
(function() {
    const P = 113;
    const keyFreqs = [14, 35, 41, 42, 52];
    const nNeurons = 512;

    // Simulate neuron frequency assignments (based on paper: 433/512 neurons assigned)
    // Each neuron is assigned to one frequency with >85% FVE
    const neuronAssignments = [];
    const neuronsPerFreq = [44, 88, 95, 110, 96]; // Approximate distribution
    let idx = 0;
    keyFreqs.forEach((k, fi) => {
        for (let i = 0; i < neuronsPerFreq[fi]; i++) {
            neuronAssignments.push({ neuron: idx++, freq: k, freqIdx: fi });
        }
    });
    // Remaining neurons are unassigned
    while (idx < nNeurons) {
        neuronAssignments.push({ neuron: idx++, freq: null, freqIdx: -1 });
    }

    const container = document.getElementById('neuron-logit-container');
    container.innerHTML = `
        <div id="wl-heatmap" style="height:350px; margin:20px 0;"></div>
        <div>
            <div id="wl-neuron-dist" style="height:280px;"></div>
            <div id="wl-fve-hist" style="height:280px;"></div>
        </div>
        <div style="background:#f0f9ff; border:1px solid #bfdbfe; border-radius:10px; padding:20px; margin:15px 0;">
            <h3 style="margin:0 0 10px 0; color:#1e40af;">How the unembedding "reads off" the answer</h3>
            <p style="margin:0; line-height:1.8;">
                For each key frequency k, there exist directions u<sub>k</sub> and v<sub>k</sub> in the 512-dimensional neuron space such that:
            </p>
            <ul style="margin:8px 0; padding-left:20px; line-height:1.8;">
                <li><strong>u<sub>k</sub><sup>T</sup> · MLP(a,b)</strong> ≈ α<sub>k</sub> · cos(ω<sub>k</sub>(a+b)) — with >93% FVE</li>
                <li><strong>v<sub>k</sub><sup>T</sup> · MLP(a,b)</strong> ≈ β<sub>k</sub> · sin(ω<sub>k</sub>(a+b)) — with >93% FVE</li>
            </ul>
            <p style="margin:8px 0 0 0; font-size:0.9em; color:#64748b;">
                The unembedding then multiplies these by cos(ω<sub>k</sub>c) and sin(ω<sub>k</sub>c) respectively,
                giving cos(ω<sub>k</sub>(a+b-c)) by the cosine subtraction identity.
            </p>
        </div>
    `;

    // Heatmap: simulate W_L structure for frequency k=14 neurons (like Figure 5 right)
    const freqLabels = Array.from({length: 57}, (_, i) => `k=${i}`);
    const numK14Neurons = neuronsPerFreq[0]; // 44 neurons
    // Each neuron's W_L column has significant values only at sin(w14) and cos(w14)
    const heatmapData = [];
    for (let f = 0; f < 57; f++) {
        const row = [];
        for (let n = 0; n < numK14Neurons; n++) {
            if (f === 14) {
                row.push(0.3 + 0.15 * Math.sin(n * 0.5)); // cos component
            } else if (f === 13) {
                row.push(-0.2 - 0.1 * Math.cos(n * 0.3)); // sin component (adjacent)
            } else {
                row.push((Math.random() - 0.5) * 0.02); // noise
            }
        }
        heatmapData.push(row);
    }

    Plotly.newPlot('wl-heatmap', [{
        z: heatmapData,
        type: 'heatmap',
        colorscale: [[0, '#3b82f6'], [0.5, '#ffffff'], [1, '#ef4444']],
        zmin: -0.5, zmax: 0.5,
        x: Array.from({length: numK14Neurons}, (_, i) => i),
        y: freqLabels,
    }], {
        title: { text: 'W_L columns for k=14 neurons (only sin/cos at k=14 are non-trivial)', font: { size: 12 } },
        xaxis: { title: 'Neuron index (within k=14 cluster)' },
        yaxis: { title: 'Fourier component', range: [0, 30] },
        margin: { t: 40, b: 50, l: 55, r: 10 }
    }, { responsive: true });

    // Neuron distribution by frequency
    const freqColors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
    Plotly.newPlot('wl-neuron-dist', [{
        x: keyFreqs.map(k => `k=${k}`),
        y: neuronsPerFreq,
        type: 'bar',
        marker: { color: freqColors },
        text: neuronsPerFreq.map(n => `${n} neurons`),
        textposition: 'auto',
        hoverinfo: 'text'
    }], {
        title: { text: 'Neuron assignment by frequency (433/512 assigned)', font: { size: 12 } },
        xaxis: { title: 'Key frequency' },
        yaxis: { title: 'Number of neurons', range: [0, 130] },
        margin: { t: 40, b: 50, l: 55, r: 10 }
    }, { responsive: true });

    // FVE histogram (simulated based on Figure 5 left)
    const fveValues = [];
    // 433 neurons with >85% FVE
    for (let i = 0; i < 433; i++) {
        fveValues.push(0.85 + Math.random() * 0.15); // 85%-100%
    }
    // Remaining 79 neurons with lower FVE
    for (let i = 0; i < 79; i++) {
        fveValues.push(0.3 + Math.random() * 0.55); // 30%-85%
    }

    Plotly.newPlot('wl-fve-hist', [{
        x: fveValues,
        type: 'histogram',
        xbins: { start: 0.3, end: 1.0, size: 0.025 },
        marker: { color: '#3b82f6', line: { color: '#1e40af', width: 0.5 } },
        hoverinfo: 'x+y'
    }], {
        title: { text: 'FVE by degree-2 polynomial of single frequency (per neuron)', font: { size: 12 } },
        xaxis: { title: 'Fraction of Variance Explained', range: [0.3, 1.02] },
        yaxis: { title: 'Number of neurons' },
        margin: { t: 40, b: 50, l: 55, r: 10 },
        shapes: [{
            type: 'line', x0: 0.85, x1: 0.85, y0: 0, y1: 200,
            line: { color: '#ef4444', width: 2, dash: 'dash' }
        }],
        annotations: [{
            x: 0.86, y: 180, text: '85% threshold<br>(433 neurons above)',
            showarrow: false, font: { size: 10, color: '#ef4444' }, xanchor: 'left'
        }]
    }, { responsive: true });
})();
</script>

<div class="md">
## The Embedding Space: Fourier Sparsity

The embedding matrix $W_E$ is a $P \times d_{\text{model}} = 113 \times 128$ matrix. When we take a Discrete Fourier Transform along the token dimension and compute the $\ell_2$-norm along the model dimension, we find that $W_E$ is **sparse in the Fourier basis** \cite[Section 4.1, Figure 3]{nanda2023grokking}.

Only 5-6 frequencies have significant norm. These are the **key frequencies** that the network uses for its computation.

This is the first line of evidence that the network operates in a Fourier basis: the embedding itself is already organized as sine/cosine waves at specific frequencies.
</div>

<div id="fourier-sparsity-container" style="max-width:900px; margin:0 auto;"></div>

<script>
(function() {
    const P = 113;
    const keyFreqs = [14, 35, 41, 42, 52];
    const extraFreq = 21; // The 6th frequency visible in W_E but not used later

    // Simulate the Fourier component norms (based on paper's Figure 3)
    // In reality you'd load actual weights; here we approximate the shape
    const numFreqs = Math.floor(P / 2); // 56 unique frequencies
    const freqs = Array.from({length: numFreqs}, (_, i) => i + 1);

    // Generate approximate norms matching Figure 3's pattern
    function generateNorms(keyFreqs, extraFreq) {
        return freqs.map(k => {
            if (keyFreqs.includes(k)) return 1.4 + Math.random() * 0.5; // Key freqs: high norm
            if (k === extraFreq) return 0.8 + Math.random() * 0.2; // Extra freq in W_E
            return Math.random() * 0.15; // Everything else: near zero
        });
    }

    const cosNorms = generateNorms(keyFreqs, extraFreq);
    const sinNorms = generateNorms(keyFreqs, extraFreq);

    // Color bars by whether they're key frequencies
    const colors = freqs.map(k => {
        if (keyFreqs.includes(k)) return '#ef4444';
        if (k === extraFreq) return '#f59e0b';
        return '#94a3b8';
    });

    const container = document.getElementById('fourier-sparsity-container');
    container.innerHTML = `
        <div>
            <div id="we-fourier-cos" style="height:300px;"></div>
            <div id="we-fourier-sin" style="height:300px;"></div>
        </div>
        <div id="we-sparsity-explanation" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:20px; margin:15px 0;">
            <h3 style="margin:0 0 10px 0; color:#1e293b;">What this means:</h3>
            <ul style="margin:0; padding-left:20px; line-height:1.8;">
                <li><span style="color:#ef4444; font-weight:bold;">Red bars</span>: Key frequencies (k ∈ {${keyFreqs.join(', ')}}) — used by the full algorithm</li>
                <li><span style="color:#f59e0b; font-weight:bold;">Orange bar</span>: Present in W<sub>E</sub> but not significantly used in later layers</li>
                <li><span style="color:#94a3b8;">Gray bars</span>: Near-zero norm — the embedding ignores these frequencies</li>
            </ul>
            <p style="margin:10px 0 0 0; font-size:0.9em; color:#64748b;">
                The embedding matrix is <strong>128-dimensional</strong>, but only ~10 dimensions (5 frequencies × 2 for sin/cos) carry meaningful signal.
                The remaining ~118 dimensions are effectively unused after training. This sparsity emerges during the "cleanup" phase of grokking.
            </p>
        </div>
        <div id="we-gini-plot" style="height:280px; margin:20px 0;"></div>
    `;

    // Cosine components
    Plotly.newPlot('we-fourier-cos', [{
        x: freqs, y: cosNorms, type: 'bar',
        marker: { color: colors },
        hovertext: freqs.map((k, i) => `k=${k}, norm=${cosNorms[i].toFixed(3)}${keyFreqs.includes(k) ? ' (KEY)' : ''}`),
        hoverinfo: 'text'
    }], {
        title: { text: 'Cosine components of W_E', font: { size: 13 } },
        xaxis: { title: 'Frequency k', range: [0, 57] },
        yaxis: { title: 'Norm of Fourier component', range: [0, 2.2] },
        margin: { t: 40, b: 50, l: 55, r: 10 }
    }, { responsive: true });

    // Sine components
    Plotly.newPlot('we-fourier-sin', [{
        x: freqs, y: sinNorms, type: 'bar',
        marker: { color: colors },
        hovertext: freqs.map((k, i) => `k=${k}, norm=${sinNorms[i].toFixed(3)}${keyFreqs.includes(k) ? ' (KEY)' : ''}`),
        hoverinfo: 'text'
    }], {
        title: { text: 'Sine components of W_E', font: { size: 13 } },
        xaxis: { title: 'Frequency k', range: [0, 57] },
        yaxis: { title: 'Norm of Fourier component', range: [0, 2.2] },
        margin: { t: 40, b: 50, l: 55, r: 10 }
    }, { responsive: true });

    // Gini coefficient over training (simulated based on Figure 7)
    const epochs = Array.from({length: 300}, (_, i) => i * 100);
    const giniWE = epochs.map(e => {
        if (e < 1400) return 0.15 + 0.05 * Math.random(); // Memorization: low sparsity
        if (e < 9400) return 0.15 + (e - 1400) / 8000 * 0.25 + 0.03 * Math.random(); // Circuit formation: slow increase
        if (e < 14000) return 0.4 + (e - 9400) / 4600 * 0.4 + 0.02 * Math.random(); // Cleanup: sharp increase
        return 0.78 + 0.02 * Math.random(); // Stable
    });
    const giniWL = epochs.map(e => {
        if (e < 1400) return 0.2 + 0.05 * Math.random();
        if (e < 9400) return 0.2 + (e - 1400) / 8000 * 0.3 + 0.03 * Math.random();
        if (e < 14000) return 0.5 + (e - 9400) / 4600 * 0.35 + 0.02 * Math.random();
        return 0.83 + 0.02 * Math.random();
    });

    Plotly.newPlot('we-gini-plot', [
        { x: epochs, y: giniWE, mode: 'lines', line: { color: '#3b82f6', width: 2 }, name: 'Gini(W_E)' },
        { x: epochs, y: giniWL, mode: 'lines', line: { color: '#ef4444', width: 2 }, name: 'Gini(W_L)' },
    ], {
        title: { text: 'Fourier Sparsity During Training (Gini Coefficient)', font: { size: 13 } },
        xaxis: { title: 'Epoch' },
        yaxis: { title: 'Gini coefficient (higher = sparser)', range: [0, 1] },
        margin: { t: 40, b: 50, l: 55, r: 20 },
        shapes: [
            { type: 'line', x0: 1400, x1: 1400, y0: 0, y1: 1, line: { color: '#94a3b8', width: 1, dash: 'dash' } },
            { type: 'line', x0: 9400, x1: 9400, y0: 0, y1: 1, line: { color: '#94a3b8', width: 1, dash: 'dash' } },
            { type: 'line', x0: 14000, x1: 14000, y0: 0, y1: 1, line: { color: '#94a3b8', width: 1, dash: 'dash' } },
        ],
        annotations: [
            { x: 700, y: 0.95, text: 'Memorization', showarrow: false, font: { size: 10, color: '#64748b' } },
            { x: 5400, y: 0.95, text: 'Circuit Formation', showarrow: false, font: { size: 10, color: '#64748b' } },
            { x: 11700, y: 0.95, text: 'Cleanup', showarrow: false, font: { size: 10, color: '#64748b' } },
        ],
        showlegend: true, legend: { x: 0.02, y: 0.85 }
    }, { responsive: true });
})();
</script>


<div class="md">
## In-Context Algorithm Execution: How LLMs Run Code That Only Exists in the Prompt

Everything above describes an algorithm **baked into the weights** during training. But something far stranger happens every day: you paste pseudocode into a prompt, say "now execute `add(128, 367)`", and the model produces the correct answer — despite never having been trained on *your* algorithm.

This is **in-context algorithm execution**. The algorithm is not in the weights. It exists only as tokens in the context window. Yet the model follows it step by step.

### The Puzzle

Consider this prompt:
</div>

<pre>
Here is my algorithm for addition:

def add(a, b):
    carry = 0
    result = []
    while a or b or carry:
        digit_a = a % 10
        digit_b = b % 10
        s = digit_a + digit_b + carry
        result.append(s % 10)
        carry = s // 10
        a //= 10
        b //= 10
    return reversed(result)

Execute: add(128, 367)
</pre>

<div class="md">
The model has no Python interpreter. It has no CPU. It has no variable registers. Yet it produces "495" — and if you ask it to show its work, it traces through the loop iterations correctly.

**How?**

### What the Weights Actually Encode: A Meta-Algorithm

The key insight from \cite[Garg et al. (2022)]{garg2022incontext} is that Transformers trained on diverse data don't memorize specific algorithms — they learn a **meta-algorithm**: a general-purpose procedure for extracting and executing patterns from context.

Formally, given a prompt structured as:

$$P = (x_1, f(x_1), x_2, f(x_2), \ldots, x_k, f(x_k), x_{\text{query}})$$

a trained Transformer can predict $f(x_{\text{query}})$ for functions $f$ it has **never seen during training**, with performance matching the optimal estimator for that function class. This is not memorization: with $2d$ in-context examples, the model achieves error < 0.001, while the best memorized weight vector from 32M training vectors would yield error ~0.216 \cite[Appendix B.7]{garg2022incontext}.

But your algorithm prompt isn't input-output pairs — it's *code*. So what's happening?

### The Three Things the Weights Encode

The weights don't contain your algorithm. They contain three capabilities that *together* allow execution:

**1. Pattern Recognition (Attention Layers)**
The attention mechanism identifies structural patterns in the prompt: loop constructs, variable assignments, conditional branches, function signatures. Induction heads \cite[Olsson et al., 2022]{olsson2022induction} — the same circuits that do pattern completion like "[A][B]...[A] → predict [B]" — generalize to matching algorithmic patterns: "when I see `carry = s // 10` followed by a state where s=15, the next value of carry is 1."

**2. State Simulation (Residual Stream)**
The residual stream maintains an implicit "execution state." As the model generates each token of output, the residual stream encodes something analogous to:
- Current values of variables (carry, digit_a, digit_b, etc.)
- Current position in the loop
- Accumulated partial results

This is not a literal register file — it's a distributed representation across hundreds of dimensions. But it functions as one.

**3. Step-by-Step Generation (Autoregressive Decoding)**
Each generated token advances the computation by one micro-step. The model doesn't execute the entire algorithm in a single forward pass — it executes one step per generated token, using its own output as "scratch space" for the next step.

### Why Ambiguity Kills: The Algorithmic Prompting Discovery

\cite[Zhou et al. (2022)]{zhou2022algorithmic} proved something crucial: **how you describe the algorithm determines whether the model can execute it.**

Consider teaching addition. A scratchpad-style prompt shows:
```
1 2 8 + 3 6 7 , C: 0
1 2 + 3 6 , 5 C: 1
1 + 3 , 9 5 C: 0
, 4 9 5 C: 0
```

The model sees that 8+7 generates carry 1 and 2+6 generates carry 0. But it could conclude: "carry is 1 when both digits are even" or "first pair always has carry 1." The rules are **ambiguous** from examples alone \cite[Section 2]{zhou2022algorithmic}.

An algorithmic prompt removes this ambiguity by making every computational step explicit:

```
FN[3]=8. SN[3]=7. C[3]=0. Since 8+7+0=15, 15>10, 15%10=5.
Length of A is 1. Thus A=[5]. Since (15-5)/10=1, C[2]=1.
```

The result: **90.5% accuracy on 19-digit addition** vs. 9.5% for few-shot baselines — a 9× error reduction \cite[Table 2]{zhou2022algorithmic}.

### Proof That the Model Actually Follows the In-Context Algorithm

Is the model truly executing the algorithm from context, or just pattern-matching the output format? \cite[Zhou et al. (2022)]{zhou2022algorithmic} prove it's genuine execution through three tests:

**Test 1: Intermediate step correctness.** For every addition question where the final answer was correct, ALL intermediate steps were also correct. The model doesn't skip steps — it traces through the algorithm as written \cite[Section 3.1]{zhou2022algorithmic}.

**Test 2: Systematic errors destroy performance.** When ALL carry calculations in the prompt examples are wrong (e.g., always using the wrong digit), accuracy drops to ~0%. If the model were relying on its pretrained knowledge of addition, wrong examples wouldn't matter. But it's actually learning the rule from context \cite[Figure 3b]{zhou2022algorithmic}.

**Test 3: Irregular errors cause only minor degradation.** When only SOME steps have errors, the model can still extrapolate the correct rule from the unchanged steps. This shows it's generalizing from the pattern, not memorizing specific examples.

This is in stark contrast to chain-of-thought prompting, where providing wrong reasoning patterns barely affects performance — suggesting those models rely on pretraining knowledge, not in-context learning \cite[Madaan and Yazdanbakhsh, 2022]{zhou2022algorithmic}.

### The Mechanism: Layer by Layer

Combining insights from both papers, here's what happens during a single forward pass when the model encounters "Execute: add(128, 367)" after seeing the algorithm:

**Layers 1–4 (Algorithm Parsing):**
Attention heads identify the structure of the algorithm in the prompt. Key patterns recognized:
- Loop structure (`while` → iteration pattern)
- Variable bindings (`carry = ...` → state tracking)
- Arithmetic operations (`s = digit_a + digit_b + carry`→ computation rule)

The QK circuits of these heads have learned to match structural tokens (`while`, `if`, `=`) regardless of the specific variable names or values.

**Layers 5–8 (State Binding):**
The model binds the query inputs (128, 367) to the algorithm's parameters (a, b). This is analogous to what \cite[Garg et al. (2022)]{garg2022incontext} call "computing sufficient statistics" — the attention layers aggregate information from the in-context algorithm description and the specific inputs into a unified representation.

**Layers 9–12 (Step Execution):**
MLP layers transform the bound state into the next output token. For each generated token, the model:
1. Reads the current "state" from the residual stream
2. Applies the transformation rule extracted from the algorithm description
3. Writes the updated state back

This is why **autoregressive generation is essential**: the model can only execute one step per forward pass. Complex algorithms require many generated tokens (the "scratchpad"), with each token advancing the state by one micro-step.

### The Critical Role of the Scratchpad

The model cannot execute a 19-digit addition in a single forward pass — that would require maintaining ~19 loop iterations worth of state simultaneously. Instead, it generates intermediate tokens that serve as **external memory**:

$$\underbrace{\text{Step 1 output}}_{\text{generated tokens}} \rightarrow \underbrace{\text{becomes input}}_{\text{for next forward pass}} \rightarrow \underbrace{\text{Step 2 output}}_{\text{generated tokens}} \rightarrow \cdots$$

Each forward pass reads the previously generated tokens (which encode the current state) and produces the next step. The context window acts as a tape — exactly like a Turing machine's tape, but with the constraint that it can only be written left-to-right.

This is why \cite[Zhou et al. (2022)]{zhou2022algorithmic} find that **context length is the primary bottleneck**: the model can only execute as many steps as fit in its context window.

### The Four Stages of Teaching Algorithms In-Context

\cite[Zhou et al. (2022)]{zhou2022algorithmic} identify a hierarchy of capabilities:

1. **Teaching an Algorithm as a Skill:** Provide a detailed, non-ambiguous description of the algorithm execution on running examples. Result: 90.5% on 19-digit addition \cite[Section 3]{zhou2022algorithmic}.

2. **Skill Accumulation:** Teaching multiple algorithms simultaneously (e.g., addition AND subtraction in one prompt). The model learns to select the correct algorithm based on the input \cite[Section 4]{zhou2022algorithmic}.

3. **Skill Composition:** Teaching how to combine skills (e.g., multiplication as repeated addition). Previously learned algorithms become subroutines \cite[Section 5]{zhou2022algorithmic}.

4. **Skills as Tools:** Using learned algorithms as subroutines within broader reasoning (e.g., using the addition algorithm inside a word problem). This reveals an **interference phenomenon**: mixing formal algorithm execution with informal reasoning in the same context degrades both \cite[Section 6]{zhou2022algorithmic}.

### What the Model Cannot Do

Despite these capabilities, there are hard limits:

- **Context length bounds computation:** The model can only execute as many steps as fit in its context window.
- **Ambiguity kills performance:** If the algorithm description allows multiple interpretations, the model may follow the wrong one. Uncommon operations (like indexing a variable position) are harder than common ones (like always taking the last element) \cite[Section 3.1]{zhou2022algorithmic}.
- **Interference between skills:** Mixing very different types of reasoning (e.g., informal math reasoning + formal algorithm execution) in one prompt causes performance degradation \cite[Section 6]{zhou2022algorithmic}.
- **No true compilation:** The model doesn't "compile" your code into an internal representation. It simulates execution token by token. This means execution speed is O(output_tokens), not O(algorithm_complexity).

### Interactive Exploration

Below you can explore how an LLM executes an addition algorithm step by step. Provide two numbers, and watch the model trace through the algorithm — showing how each generated token advances the computational state.
</div>

<div id="icl-execution-container" style="max-width:900px; margin:0 auto;"></div>
