<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: How Algorithms Work: From Euclid to the Transformer
description: What makes a procedure an algorithm, the 1936 question that built the theory of computation, and how a modern transformer actually executes algorithms — from grokking the Discrete Fourier Transform to running code that only exists in the prompt.
icon: &#128295;
part: 4
order: 12
color: sky
topics: programming, architecture, math-i, math-ii, history
tags: math-heavy, code-heavy
math: 50
-->

<div class="md" data-lesson-id="algorithms">
## The idea of an algorithm

### Two Lessons in One

This chapter has two halves. The first asks a question that took two thousand years to be *asked*: **what makes a procedure an *algorithm*?** — and follows the answer through Euclid's gcd, the Sieve of Eratosthenes, and the 1928 decision problem that forced the entire theory of computation to be invented. The second shows a modern transformer *executing* algorithms on its own: grokking the Discrete Fourier Transform without being told it, and running code that exists only in the prompt. Read the first half to understand the object being executed; the second is the machine that runs it.
</div>

<div class="md">
You have used the word *algorithm* so many times it has lost all meaning. A sorting step is an algorithm. A search is an algorithm. The way your coffee machine cycles through its modes is, in the strict sense, an algorithm. But there is a question almost nobody asks, and it is the one this whole field was eventually built around: **what makes a procedure an *algorithm* — as opposed to just a set of steps you happen to run?**

Two properties, and they are the entire game.

* **It must terminate.** An algorithm is not an infinite loop. It must *finish*, in a finite number of steps, for every input it promises to handle.
* **It must be correct — by construction.** Not "it usually works," not "we tested a few cases," but *guaranteed* right, by an argument that holds for *every* input.

A procedure that has both is an algorithm. The rest of this half is the story of those two properties — and of how, in a single decade, they went from being quietly *practiced* for two thousand years to being rigorously *studied*.
</div>

<div class="md">
### The first non-trivial algorithm: Euclid (c. 300 BC)

The oldest algorithm still in use every day sits in Euclid's *Elements*, Book VII \cite[Euclidean algorithm]{euclideanalgorithm} \cite[The Elements]{euclidelements}. Given two whole numbers, find their **greatest common divisor** — the largest number that divides both. The procedure:

> Divide the larger by the smaller. Replace the pair by *(the smaller, the remainder)*. Repeat until the remainder is zero. The last non-zero remainder is the answer.

It is an algorithm in the full, strong sense — and the *why* is the point, because it is the earliest example we have of someone *checking the two properties*.

* **Termination.** Each remainder is smaller than the divisor it came from, and a remainder is always smaller than the divisor. So the second number of the pair, the divisor, strictly shrinks at every step. A list of positive integers that keeps shrinking cannot go on forever — it *must* reach zero. That is not a hope that it will stop; it is a proof that it will.
* **Correctness.** The load-bearing fact is $gcd(a, b) = gcd(b, a - qb)$: taking away a multiple of one number from the other never changes the two numbers' common divisor. Every single step preserves the answer; and when the process ends, the answer is sitting in the last non-zero remainder.

For the next two thousand years, this was just *the way you found a common divisor*. Nobody wrote "this procedure provably terminates and is provably correct," because the idea of checking those two things **in general** had not yet occurred to anyone.
</div>

<div id="gcd-lab" style="max-width: var(--mn-col-width); margin: 1.5em auto; padding: 20px; border: 1px solid var(--mn-border); border-radius: 12px; background: var(--mn-surface);">
	<h3 style="margin-top:0; color: var(--mn-text);">Watch it terminate</h3>
	<p style="color: var(--mn-text); line-height:1.5;">Pick two positive integers and run the algorithm. Watch the middle column shrink — that shrinking is the *proof* the process has to stop.</p>
	<div style="display:flex; gap:14px; align-items:center; flex-wrap:wrap; margin: 12px 0;">
		<label style="color:var(--mn-text);">a <input type="number" id="gcd-a" value="462" min="1" style="width:90px; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-surface); color:var(--mn-text);"></label>
		<label style="color:var(--mn-text);">b <input type="number" id="gcd-b" value="132" min="1" style="width:90px; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-surface); color:var(--mn-text);"></label>
		<button id="gcd-run" class="btn btn-train" onclick="GCD.run()">Run the algorithm</button>
	</div>
	<table id="gcd-steps" style="width:100%; border-collapse:collapse;"></table>
	<p id="gcd-result" style="font-family:monospace; color:var(--mn-text);"></p>
</div>

<div class="md">
#### Another shape of algorithm: the Sieve of Eratosthenes (c. 240 BC)

A little later, and a little further east, the same two millennia-old craft produced a different *shape* of procedure: the \cite[Sieve of Eratosthenes]{sieveoferatosthenes}. Given a limit $n$, list every number from 2 to $n$, then cross off every multiple of 2, then every multiple of 3, then 5, and so on. What is left standing is exactly the set of primes.

Where Euclid's algorithm *reduces* a problem step by step, the sieve **filters** a finite set. It is still an algorithm, for the same two reasons: it *terminates* (once the smallest number you have not crossed off, $p$, satisfies $p^2 > n$, nothing below $n$ can still be composite, so you are done), and it is *correct by construction* (a number survives the sieve only if none of the primes below it divide it, which is precisely what being prime means). Two algorithms, separated by a few decades and a city, both defined long before the word *computer* existed, both pinned down by the identical pair: **it stops, and it is right.**

\marginfig{eratosthenes.jpg}{Eratosthenes of Cyrene (c. 276–194 BC), from a later engraving. Public domain.}
</div>

<div class="md">
### The gap: two thousand years of *doing*, none of *studying*

Here is the gap the rest of the course has been circling. For all that, the algorithm was never a **thing**. It was a **verb**. People *did* algorithms; no one *studied* them as objects with properties you could check.

The name is itself a fossil of that gap. *Algorithm* is the Latinized form of the name of the Persian mathematician al-Khwarizmi, whose ninth-century arithmetic gave us the word \cite[the etymology of "algorithm" (Wikipedia)]{historyofmath_wikipedia} — the course traces al-Khwarizmi himself in [The Brief History of AI](history.php). But al-Khwarizmi *named and catalogued* procedures — he did not ask the question that actually matters, and that nobody had asked before:

> Is there a **general, universal** procedure? Can one machine, running one rule, decide the answer to *any* problem in a class — not just *this* gcd, or *this* sieve, but *any* instance, for all time?

Naming a class of things is not the same as asking whether the class has a single procedure that handles all of it. That question — and it is *the* question — sat unasked until the twentieth century.
</div>

<div class="md">
### The question that built everything: the Entscheidungsproblem (1928)

In 1928 the mathematician David Hilbert (\cite[Hilbert & Ackermann, 1928]{hilbert1928entscheidung}) posed a question that had been waiting, unasked, for two thousand years. In German it is the **Entscheidungsproblem**, the decision problem:

> Given any statement of arithmetic — or, more generally, any formula of logic — does there exist a **general, mechanical procedure** that decides, in a finite number of steps, whether the statement is provable?

This is exactly the question Euclid's two properties had been pointing at all along. An *algorithm* was, quietly, a candidate *answer*: a mechanical procedure that terminates and is correct. The Entscheidungsproblem asks whether such a procedure exists **in general** — not for this problem, but for the whole class. Hilbert was confident the answer was **yes**; he was actively looking for the procedure.

The answer, delivered eight years later by two independent mathematicians wielding two tools that looked nothing alike, was **no**.

\marginfig{hilbert_1907.jpg}{David Hilbert (1862–1943), 1907. Public domain.}
</div>

<div class="md">
### 1936: two machines, one answer

Kurt Gödel had already delivered the first blow in 1931 with his incompleteness theorems \cite[Gödel's incompleteness theorems (1931)]{godel1931incompleteness}: no consistent system strong enough for arithmetic can prove every true statement in it. But incompleteness left a door open — it says some truths escape *proof*, not that no *procedure* could still decide which statements are decidable. The decision problem was still, as far as anyone could tell, on the table.

In 1936, independently, and to the best of our knowledge unaware of each other's work, **Alonzo Church** and **Alan Turing** each wrote down a rigorous formalism for "mechanical procedure," and each used it to answer the 1928 question with a proof that the answer is **no** \cite[The Church–Turing Thesis (SEP)]{churchturing1936}.

* **Church** worked with the λ-calculus: pure rewriting of symbols, a formalism that reads like algebra.
* **Turing** built a *machine* — a finite controller that reads one symbol at a time from, and writes symbols to, an infinite strip of tape, moving left or right according to its current state \cite[Turing, On Computable Numbers (1936)]{turing1937}.

The two formalisms look nothing alike. One is a calculus; the other is a physical picture of a head on a tape. And yet they compute *exactly* the same set of functions — every problem one can solve, the other can solve too. That coincidence is so load-bearing that it has its own name: the \cite[Church–Turing thesis (SEP)]{churchturing1936}.

And the upshot for the 1928 question: within this shared class of "what a machine can do," there are true statements of arithmetic for which **no** decision procedure exists. The Entscheidungsproblem has *no solution* — not because no one was clever enough to find the procedure, but because the procedure is provably *not there*. The question itself has no "yes."

<figure>
	<img style="max-width: 100%; width: 100%; height: auto; display: block; margin: 0 auto;" src="turing_machine_2a.svg" alt="A Turing machine: states reading and writing symbols on a tape" />
	<figcaption class="md">A Turing machine: a finite set of states reading and writing symbols on an infinite tape, moving left or right. Public domain diagram.</figcaption>
</figure>
</div>

<div class="md">
### The payoff: the algorithm becomes an object

Step back, and the whole chapter is one turning point.

* For two millennia, people **ran** procedures — Euclid's gcd, the sieve — and never asked *what made them work*.
* One question — *is there a general method?* (the Entscheidungsproblem, 1928) — forced the procedure itself to become a **mathematical object** with checkable properties: *does it terminate? is it correct? what is it even able to reach?*
* Answering that question (Church, Turing, 1936) did not merely settle a logic puzzle. It **invented the theory of computation** — the study of *computation as a thing you can reason about*, not just a thing you do.

That is the "displaced prerequisite" this first half is filling. Everything in the second half of this chapter, and in [Software](software.php) — the idea that a computation has a *cost*, a *guarantee*, and a *limit* — rests on the fact that, in 1936, the algorithm stopped being a verb and became a noun. You can now hold one in your hand and take it apart: ask whether it stops, prove whether it is right, and measure how much work it does. Euclid had the algorithm. Hilbert asked the question. Church and Turing built the machine that *is* the answer.

> A procedure becomes an **algorithm** when two things hold: it **terminates** for every input it promises to handle, and it is **correct by construction**. The question "is there a *general* procedure?" — the Entscheidungsproblem, 1928 — is what turned that property from a verb into an object, and forced the entire theory of computation to be built.
</div>

<script>
GCD = {
	run() {
		var a = parseInt(document.getElementById("gcd-a").value, 10);
		var b = parseInt(document.getElementById("gcd-b").value, 10);
		if (isNaN(a) || isNaN(b) || a < 1 || b < 1) {
			document.getElementById("gcd-result").textContent = "Enter two positive integers.";
			return;
		}
		var steps = [];
		var x = a, y = b, n = 0;
		while (y !== 0 && n < 100000) {
			var r = x % y;
			steps.push([x, y, r]);
			x = y;
			y = r;
			n++;
		}
		var cell = "padding:6px 10px; border:1px solid var(--mn-border); color:var(--mn-text); font-family:monospace; text-align:center;";
		var head = "padding:6px 10px; border:1px solid var(--mn-border); color:var(--mn-text-secondary); text-align:center; font-size:0.9em;";
		var html = "<tr><th style='" + head + "'>dividend (a)</th><th style='" + head + "'>divisor (b)</th><th style='" + head + "'>remainder</th></tr>";
		steps.forEach(function (s) {
			html += "<tr><td style='" + cell + "'>" + s[0] + "</td><td style='" + cell + "'>" + s[1] + "</td><td style='" + cell + "'>" + s[2] + "</td></tr>";
		});
		document.getElementById("gcd-steps").innerHTML = html;
		document.getElementById("gcd-result").textContent = "gcd(" + a + ", " + b + ") = " + x + "  ·  " + steps.length + " step" + (steps.length === 1 ? "" : "s") + "  ·  it stopped because the divisor reached 0.";
	}
};
(function () { GCD.run(); })();
</script>

<div class="md">
## A transformer executes algorithms

### How a Transformer Executes Algorithms

The concept is settled: an algorithm is a procedure that terminates and is correct, and since 1936 we can *reason* about algorithms — their cost, their guarantees, their limits. The second half of this chapter asks a concrete question: can a *neural network* actually *run* one?

It can. A transformer trained on a toy arithmetic task does two things that look almost impossible. It **groks** an algorithm it was never explicitly taught — it rediscovers the Discrete Fourier Transform on its own. And it **executes code that only exists in the prompt** — an algorithm it has never seen before, following it step by step with no interpreter and no CPU. Both are real, measured, and explained below, starting with how a tiny network computes modular addition by rotating points on a circle.
</div>

<div class="md">
When we train a neural network on a simple task like modular addition, something remarkable happens. The network doesn't just memorize the answers, it *discovers* an algorithm. Specifically, it learns to use the **Discrete Fourier Transform** to convert addition into wave interference, as described by (\cite[Nanda et al., 2023]{nanda2023grokking}).

This section walks through, step by step, exactly *how* a tiny one-layer Transformer computes:

$$a + b \mod P$$

where $P = 113$ is a prime number. The network's vocabulary is just the numbers $\{0, 1, 2, \ldots, 112\}$, and it must output the correct sum modulo 113.

### The Core Insight

The network learns that **modular arithmetic is circular**. After $P$, you wrap around to 0, just like an angle wrapping around a circle. So the network represents each number as a **point on a circle**, and performs addition by **rotating angles**.

But a single circle (a single frequency) has too many ambiguities. So the network uses **5 different frequencies** simultaneously, and combines them via **constructive interference**, the same principle that makes noise-cancelling headphones work, but in reverse.

<div id="wave-interference-container"></div>
</div>

<div class="md" data-mathlevel="55">
### The Algorithm in Five Steps

The trained network implements the following algorithm (\cite[Nanda et al., 2023, Section 4]{nanda2023grokking}):

1. **Embedding:** Map each input number to points on 5 different circles (5 Fourier components)
2. **Attention:** Bring the representations of $a$ and $b$ together
3. **MLP:** Apply trigonometric addition theorems to compute $\cos(\omega_k(a+b))$ and $\sin(\omega_k(a+b))$
4. **Unembedding:** Compare the result against all 113 possible output tokens using cosine similarity
5. **Interference:** The 5 frequencies constructively interfere *only* at the correct answer

The key formula that the MLP neurons compute is the **addition theorem**:

<p>$$\cos(\omega_k(a+b)) = \underbrace{\cos(\omega_k a)}_{\text{from embedding of } a} \cdot \underbrace{\cos(\omega_k b)}_{\text{from embedding of } b} - \underbrace{\sin(\omega_k a)}_{\text{from embedding of } a} \cdot \underbrace{\sin(\omega_k b)}_{\text{from embedding of } b}$$</p>

And the final logit for each candidate answer $c$ is:

$$\text{Logit}(c) = \sum_{k \in \{14,35,41,42,52\}} \alpha_k \cdot \underbrace{\cos\left(\omega_k \cdot (a + b - c)\right)}_{\substack{= 1 \text{ when } c = (a+b) \bmod P \\ < 1 \text{ otherwise}}}$$

This is maximal when $c = (a+b) \bmod P$, because then *all five* cosine terms equal 1 simultaneously.
</div>

<div class="md" data-mathlevel="50">
### Connection to Grokking

This algorithm is not present at the start of training. The phenomenon is called **grokking**: a model suddenly transitions from **memorization** to **generalization** long after it seems to have plateaued. Originally identified by \cite[Power et al. (2022)]{power2022grokking}, this “aha moment” occurs when a model achieves 100% training accuracy but 0% validation accuracy for an extended period, only to have validation accuracy jump to 100% within a few epochs. This indicates a shift from high-frequency noise-fitting to the discovery of an underlying algorithmic pattern, and structurally it is often marked by a transition in **attention matrices** from messy, uniform distributions to clean, highly structured representations.

Here the network first **memorizes** the training data (achieving 100% train accuracy but ca. 0% test accuracy). Then, after many more epochs, it suddenly “groks” the addition pattern, test accuracy jumping from 0% to 100% in a few hundred steps. Weight decay forces the network to find this compact Fourier solution instead of maintaining a large lookup table.

### Interactive Exploration

Below you can explore each step of the algorithm interactively. Change the input numbers, toggle frequencies on and off, and watch how the interference pattern changes.
</div>

<div id="fourier-algorithm-container"></div>

<div class="md" data-mathlevel="60">
### The Neuron-Logit Map $W_L$

The matrix $W_L = W_U W_{\text{out}}$ maps MLP activations directly to logits. It is approximately **rank 10**, with each direction corresponding to the cosine or sine of one of the 5 key frequencies (\cite[Nanda et al., 2023, Section 4.2, Equation 2]{nanda2023grokking}):

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
        margin: { t: 40, b: 50, l: 55, r: 10 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
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
        margin: { t: 40, b: 50, l: 55, r: 10 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
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
        }],
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    }, { responsive: true });
})();
</script>

<div class="md" data-mathlevel="50">
### The Embedding Space: Fourier Sparsity

The embedding matrix $W_E$ is a $P \times d_{\text{model}} = 113 \times 128$ matrix. When we take a Discrete Fourier Transform along the token dimension and compute the $\ell_2$-norm along the model dimension, we find that $W_E$ is **sparse in the Fourier basis** (\cite[Nanda et al., 2023, Section 4.1, Figure 3]{nanda2023grokking}).

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
                The embedding matrix is <strong>128-dimensional</strong>, but only ca. 10 dimensions (5 frequencies × 2 for sin/cos) carry meaningful signal.
                The remaining ca. 118 dimensions are effectively unused after training. This sparsity emerges during the "cleanup" phase of grokking.
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
        margin: { t: 40, b: 50, l: 55, r: 10 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
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
        margin: { t: 40, b: 50, l: 55, r: 10 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
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
        showlegend: true, legend: { x: 0.02, y: 0.85 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    }, { responsive: true });
})();
</script>


<div class="md">
## In-context algorithm execution

### In-Context Algorithm Execution: How LLMs Run Code That Only Exists in the Prompt

Everything above describes an algorithm **baked into the weights** during training. But something far stranger happens every day: you paste pseudocode into a prompt, say “now execute `add(128, 367)`“, and the model produces the correct answer, despite never having been trained on *your* algorithm.

This is **in-context algorithm execution**. The algorithm is not in the weights. It exists only as tokens in the context window. Yet the model follows it step by step.

#### The Puzzle

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
The model has no Python interpreter. It has no CPU. It has no variable registers. Yet it produces “495”, and if you ask it to show its work, it traces through the loop iterations correctly.

**How?**

#### What the Weights Actually Encode: A Meta-Algorithm

The key insight from \cite[Garg et al. (2022)]{garg2022incontext} is that Transformers trained on diverse data don't memorize specific algorithms, they learn a **meta-algorithm**: a general-purpose procedure for extracting and executing patterns from context.

Formally, given a prompt structured as:

$$P = (x_1, f(x_1), x_2, f(x_2), \ldots, x_k, f(x_k), x_{\text{query}})$$

a trained Transformer can predict $f(x_{\text{query}})$ for functions $f$ it has **never seen during training**, with performance matching the optimal estimator for that function class. This is not memorization: with $2d$ in-context examples, the model achieves error < 0.001, while the best memorized weight vector from 32M training vectors would yield error ca. 0.216 \cite[Appendix B.7]{garg2022incontext}.

But your algorithm prompt isn't input-output pairs, it's *code*. So what's happening?

#### The Three Things the Weights Encode

The weights don't contain your algorithm. They contain three capabilities that *together* allow execution:

**1. Pattern Recognition (Attention Layers)**
The attention mechanism identifies structural patterns in the prompt: loop constructs, variable assignments, conditional branches, function signatures. Induction heads (\cite[Olsson et al., 2022]{olsson2022induction}), the same circuits that do pattern completion like “[A][B]...[A] → predict [B]”, generalize to matching algorithmic patterns: “when I see `carry = s // 10` followed by a state where s=15, the next value of carry is 1.“

**2. State Simulation (Residual Stream)**
The residual stream maintains an implicit “execution state.” As the model generates each token of output, the residual stream encodes something analogous to:
- Current values of variables (carry, digit_a, digit_b, etc.)
- Current position in the loop
- Accumulated partial results

This is not a literal register file, it's a distributed representation across hundreds of dimensions. But it functions as one.

**3. Step-by-Step Generation (Autoregressive Decoding)**
Each generated token advances the computation by one micro-step. The model doesn't execute the entire algorithm in a single forward pass, it executes one step per generated token, using its own output as “scratch space” for the next step.

#### Why Ambiguity Kills: The Algorithmic Prompting Discovery

\cite[Zhou et al. (2022)]{zhou2022algorithmic} proved something crucial: **how you describe the algorithm determines whether the model can execute it.**

Consider teaching addition. A scratchpad-style prompt shows:
```
1 2 8 + 3 6 7 , C: 0
1 2 + 3 6 , 5 C: 1
1 + 3 , 9 5 C: 0
, 4 9 5 C: 0
```

The model sees that 8+7 generates carry 1 and 2+6 generates carry 0. But it could conclude: “carry is 1 when both digits are even” or “first pair always has carry 1.” The rules are **ambiguous** from examples alone (\cite[Section 2]{zhou2022algorithmic}).

An algorithmic prompt removes this ambiguity by making every computational step explicit:

```
FN[3]=8. SN[3]=7. C[3]=0. Since 8+7+0=15, 15>10, 15%10=5.
Length of A is 1. Thus A=[5]. Since (15-5)/10=1, C[2]=1.
```

The result: **90.5% accuracy on 19-digit addition** vs. 9.5% for few-shot baselines, a 9× error reduction \cite[Table 2]{zhou2022algorithmic}.

#### Proof That the Model Actually Follows the In-Context Algorithm

Is the model truly executing the algorithm from context, or just pattern-matching the output format? \cite[Zhou et al. (2022)]{zhou2022algorithmic} prove it's genuine execution through three tests:

**Test 1: Intermediate step correctness.** For every addition question where the final answer was correct, ALL intermediate steps were also correct. The model doesn't skip steps, it traces through the algorithm as written (\cite[Section 3.1]{zhou2022algorithmic}).

**Test 2: Systematic errors destroy performance.** When ALL carry calculations in the prompt examples are wrong (e.g., always using the wrong digit), accuracy drops to ca. 0%. If the model were relying on its pretrained knowledge of addition, wrong examples wouldn't matter. But it's actually learning the rule from context \cite[Figure 3b]{zhou2022algorithmic}.

**Test 3: Irregular errors cause only minor degradation.** When only SOME steps have errors, the model can still extrapolate the correct rule from the unchanged steps. This shows it's generalizing from the pattern, not memorizing specific examples.

This is in stark contrast to chain-of-thought prompting, where providing wrong reasoning patterns barely affects performance, suggesting those models rely on pretraining knowledge, not in-context learning (\cite[Madaan and Yazdanbakhsh, 2022]{madaan2022textpatterns}).

#### The Mechanism: Layer by Layer

Combining insights from both papers, here's what happens during a single forward pass when the model encounters “Execute: add(128, 367)” after seeing the algorithm:

**Layers 1–4 (Algorithm Parsing):**
Attention heads identify the structure of the algorithm in the prompt. Key patterns recognized:
- Loop structure (`while` → iteration pattern)
- Variable bindings (`carry = ...` → state tracking)
- Arithmetic operations (`s = digit_a + digit_b + carry`→ computation rule)

The QK circuits of these heads have learned to match structural tokens (`while`, `if`, `=`) regardless of the specific variable names or values.

**Layers 5–8 (State Binding):**
The model binds the query inputs (128, 367) to the algorithm's parameters (a, b). This is analogous to what \cite[Garg et al. (2022)]{garg2022incontext} call “computing sufficient statistics”, the attention layers aggregate information from the in-context algorithm description and the specific inputs into a unified representation.

**Layers 9–12 (Step Execution):**
MLP layers transform the bound state into the next output token. For each generated token, the model:
1. Reads the current “state” from the residual stream
2. Applies the transformation rule extracted from the algorithm description
3. Writes the updated state back

This is why **autoregressive generation is essential**: the model can only execute one step per forward pass. Complex algorithms require many generated tokens (the “scratchpad”), with each token advancing the state by one micro-step.

#### The Critical Role of the Scratchpad

The model cannot execute a 19-digit addition in a single forward pass, that would require maintaining ca. 19 loop iterations worth of state simultaneously. Instead, it generates intermediate tokens that serve as **external memory**:

<p>$$\underbrace{\text{Step 1 output}}_{\text{generated tokens}} \rightarrow \underbrace{\text{becomes input}}_{\text{for next forward pass}} \rightarrow \underbrace{\text{Step 2 output}}_{\text{generated tokens}} \rightarrow \cdots$$</p>

Each forward pass reads the previously generated tokens (which encode the current state) and produces the next step. The context window acts as a tape, exactly like a Turing machine's tape, but with the constraint that it can only be written left-to-right.

This is why \cite[Zhou et al. (2022)]{zhou2022algorithmic} find that **context length is the primary bottleneck**: the model can only execute as many steps as fit in its context window.

#### The Four Stages of Teaching Algorithms In-Context

\cite[Zhou et al. (2022)]{zhou2022algorithmic} identify a hierarchy of capabilities:

1. **Teaching an Algorithm as a Skill:** Provide a detailed, non-ambiguous description of the algorithm execution on running examples. Result: 90.5% on 19-digit addition (\cite[Section 3]{zhou2022algorithmic}).

2. **Skill Accumulation:** Teaching multiple algorithms simultaneously (e.g., addition AND subtraction in one prompt). The model learns to select the correct algorithm based on the input (\cite[Section 4]{zhou2022algorithmic}).

3. **Skill Composition:** Teaching how to combine skills (e.g., multiplication as repeated addition). Previously learned algorithms become subroutines (\cite[Section 5]{zhou2022algorithmic}).

4. **Skills as Tools:** Using learned algorithms as subroutines within broader reasoning (e.g., using the addition algorithm inside a word problem). This reveals an **interference phenomenon**: mixing formal algorithm execution with informal reasoning in the same context degrades both (\cite[Section 6]{zhou2022algorithmic}).

#### What the Model Cannot Do

Despite these capabilities, there are hard limits:

- **Context length bounds computation:** The model can only execute as many steps as fit in its context window.
- **Ambiguity kills performance:** If the algorithm description allows multiple interpretations, the model may follow the wrong one. Uncommon operations (like indexing a variable position) are harder than common ones (like always taking the last element) (\cite[Zhou et al., 2022, Section 3.1]{zhou2022algorithmic}).
- **Interference between skills:** Mixing very different types of reasoning (e.g., informal math reasoning + formal algorithm execution) in one prompt causes performance degradation (\cite[Zhou et al., 2022, Section 6]{zhou2022algorithmic}).
- **No true compilation:** The model doesn't “compile” your code into an internal representation. It simulates execution token by token. This means execution speed is O(output_tokens), not O(algorithm_complexity).

#### Interactive Exploration

Below you can explore how an LLM executes an addition algorithm step by step. Provide two numbers, and watch the model trace through the algorithm, showing how each generated token advances the computational state.
</div>

<div id="icl-execution-container" style="max-width:900px; margin:0 auto;"></div>

<div class="md">
### Algorithmic Prompting: Why Specificity Unlocks Execution

The discovery by \cite[Zhou et al. (2022)]{zhou2022algorithmic} that changed how we think about in-context algorithm execution is deceptively simple: **the more precisely you describe each step, the better the model executes it.** But the mechanism behind this is subtle and reveals something deep about how Transformers process instructions.

#### The Specificity Spectrum

Consider teaching a model to add two numbers. There's a spectrum of how explicitly you can describe the algorithm:

| Level | Prompt Style | Accuracy (19-digit) |
|-------|-------------|-------------------|
| **Zero-shot** | “What is 1234567890123456789 + 9876543210987654321?” | ca. 0% |
| **Few-shot** | Show 3 examples of addition with answers | 9.5% |
| **Chain-of-thought** | Show examples with informal reasoning (“carry the 1...”) | ca. 25% |
| **Algorithmic prompting** | Show the *exact* algorithm with every micro-step explicit | **90.5%** |

The 9× improvement from few-shot to algorithmic prompting isn't just “more detail helps.” It reveals that the model's attention heads can only reliably extract rules when those rules are **unambiguous from the context** (\cite[Section 2]{zhou2022algorithmic}).

#### The Ambiguity Problem (Visualized)

When you show the model `8 + 7 = 15, write 5, carry 1` followed by `2 + 6 = 8, write 8, carry 0`, the model must infer the carry rule. But from just these two examples, multiple rules are consistent:

- ✅ “Carry = 1 when sum ≥ 10” (correct)
- ❌ “Carry = 1 when both digits are ≥ 7” (consistent with examples!)
- ❌ “Carry = 1 on the first iteration only” (also consistent!)

Algorithmic prompting eliminates this by making the rule explicit: `Since 8+7+0=15 and 15≥10, carry = (15-5)/10 = 1`.

#### The Four Stages of Algorithmic Teaching

Zhou et al. discovered that algorithmic reasoning can be taught progressively through four stages, each building on the last:

1. **Single Skill:** Teach one algorithm with full step-by-step specificity
2. **Skill Accumulation:** Teach multiple algorithms in one prompt (the model learns to select the right one)
3. **Skill Composition:** Teach how to chain algorithms (multiplication = repeated addition)
4. **Skills as Tools:** Use algorithms as subroutines within broader reasoning tasks

Each stage introduces new challenges. Stage 3 (composition) is particularly interesting: the model must recognize when to “call” a sub-algorithm and correctly pass state between them.
</div>

<div id="algorithmic-prompting-container" style="max-width:960px; margin:0 auto;"></div>

<div class="md" data-mathlevel="45">
## Beyond modular arithmetic

### Beyond Modular Arithmetic: Magnitude, Comparison, and Counting

The circular representations above solve a very specific problem: **modular** addition, where the answer wraps around a fixed modulus ($\bmod N$). That is a *bounded, cyclic* task — there is no "carry out to infinity," and no question of how *big* a number is. Once you leave that world, the model hits two different walls, and understanding them clarifies what a "number" actually is inside the network.

**Magnitude, not value.** The natural question is how the model represents *size* — how does it "know" that $7 > 3$ so it can compare two numbers? (\cite[Levy & Geva, 2024]{levy2024numbers}) probed and intervened on Llama-3-8B and Mistral-7B and found that they do **not** store a single ordered "number line." Instead **each digit is stored as its own circular (angular) code in base 10**: the value of a digit $d$ sits at the angle $\theta = 2\pi d / 10$ around a small circle, held in a *pair* of dimensions as $(\cos\theta,\; \sin\theta)$. So a digit is a 2-D rotary code — the same kind of Fourier feature the modular-addition section used, just applied one digit at a time. Crucially, each *digit position* (units, tens, hundreds, …) gets its **own separate** circle in its own (roughly orthogonal) 2-D subspace, so the digits do not bleed into each other. "13" is therefore not a point between 12 and 14 — it is a "1" on the *tens* circle plus a "3" on the *units* circle.

Where does this live? In the **hidden states (the residual stream) of the later layers**, not in the input embedding. The circular probes decode the digits reliably from about the **third layer onward** (the first couple of layers are still busy "contextualizing" a multi-digit number, whose several tokens have to be combined first), and a causal intervention that rotates one digit's angle by $+5 \bmod 10$ modifies that digit in the model's answer — the exact intended result appears in only about 10–15% of cases (roughly half are "close"), so the code is genuinely *used*, not merely readable. (The paper's honest caveat: this is one strong, causally-active representation; it may be one of several redundant ones packed in superposition, not the only numeracy signal.) The tell-tale signature is the *error pattern*: arithmetic mistakes cluster on a **single digit** of the answer (the model emits "633" or "823" instead of "833"), exactly what a digit-wise code predicts — not the value-adjacent slips ("831", "834") a real number-line representation would produce. There is no clean, monotonic magnitude to "read off" and compare, which is why comparing small numbers is so error-prone: the model holds a digit-by-digit code, not a quantity.

\cite[Cacioli (2026)]{cacioli2026weber} brought the formal tools of psychophysics to the question. First, **Weber's law** — a 19th-century finding about human perception: the smallest difference you can notice between two stimuli is a constant *fraction* of their size, not a constant *amount*. You tell 10 from 11 instantly, but not 1000 from 1001, because the gap (1) shrinks relative to the magnitude. The consequence is that magnitudes are spaced **logarithmically** in perception: a fixed *ratio* (×1.1) is a fixed *distance*, whether you are near 10 or near 1000. (\cite[Cacioli, 2026]{cacioli2026weber}) found the transformer's magnitude geometry has exactly this **log-compressive, Weber-law** structure (a 10% step is a constant distance), which also resolves a live disagreement in the literature (linear spacing? log? per-digit?). But the decisive finding is a **dissociation**: a model can *have* this logarithmic magnitude geometry and *still* perform at chance on discrimination tasks. Representing magnitude and being *able to use it to compare* are not the same thing — the geometry is necessary but not sufficient.

**Counting: recognizing is not counting.** "How many r's are in strawberry?" is the canonical failing. (\cite[Fu et al., 2024]{fu2024count}) showed that models **recognize the letters but do not count them**: errors track the number of letters/tokens in the word, and the dominant failure is that *most models break once a symbol repeats more than twice*. Word frequency in the training data barely matters — this is a computation they are performing on the fly, not a lookup they failed to memorize. (\cite[Conde et al., 2025]{conde2025count}) confirmed exact counting is not intrinsic; it only becomes reliable when the model is given a scratchpad (a chain-of-thought it can increment).

**Why it is hard, in principle.** The difference from modular addition is not training data — it is the *shape of the state required*. Mod-$N$ addition lives on a finite circle, so it needs only a bounded, cyclic representation (exactly the Fourier features above \cite[Ding et al., 2024]{ding2024fittest} \cite[Engels et al., 2025]{engels2024multidim}). Exact counting, by contrast, needs an **unbounded integer** that increments and is read out at the end — a state that grows with the input. \cite[Hahn (2020)]{hahn2020limitations} proved the matching impossibility: a fixed-size transformer's self-attention **cannot model periodic finite-state languages** (counting to $n$, parity, "how many times does $x$ appear") **unless the number of layers or heads grows with the sequence length.** In other words, a fixed network has no reliable exact-integer counter, and the depth that would supply one is exactly what is fixed. Modular arithmetic is easy because it is bounded and circular; comparison needs an ordered code the model does not cleanly have, and counting needs unbounded state it cannot hold. Different failures, and neither is "just train it more."
</div>

<div class="md" data-mathlevel="50">
### A Transformer as a State Machine: How a Stateless Network Keeps State

Here is a tension worth sitting with. An RNN keeps its state in a single hidden vector that it updates one token at a time, carrying everything forward. A transformer has **no such carried-over hidden vector**: within a single forward pass it is a *parallel* function applied to the whole context at once, with no step-by-step evolution. You are right that "time" barely exists for the network inside one forward pass — the only real notion of order is the **sequence position** of the tokens (and, during generation, the autoregressive step-by-step decoding). So "state across time" below means **state across the token positions / decode steps**, not an internal clock. Given that, the puzzle is sharper, not softer: how can a network with no carried-over memory do anything *sequential* or *stateful* — parse a sentence, follow a procedure, track a running count — when it has nowhere to keep the running total?

The reframe is that the state is **not absent, it is distributed**. The "state" is the **residual stream plus the Key/Value vectors of every past token**. Each past token's hidden state is a register that the current token can read from through attention, and each new token writes a fresh entry. The whole sequence is, in effect, a **work tape / register file** that the model re-reads every step. (\cite[Katharopoulos et al., 2020]{katharopoulos2020linear}) made the relationship to recurrence literal: a *linear*-attention transformer has an exact **iterative (RNN-like) implementation**, where a single accumulated matrix plays the role of the hidden state. "Stateless" is therefore a misnomer; the state is just stored *in the context* rather than in a vector.

Formally, this is enough to run a state machine. A single attention layer can implement the transitions of a **finite-state automaton** — softly, through the softmax, or exactly under a hardmax. (\cite[Adriaensen & Maene, 2024]{adriaensen2024moore}) took this concretely: they trained transformers on regular languages and then **extracted the finite-state (Moore) machine the network had implicitly built**, using queries and counterexamples rather than reading the states out of the weights. You can pull the state machine *out* of the transformer.

But the power is bounded, and (\cite[Hahn, 2020]{hahn2020limitations}) pins down where. Because the context length is fixed, the number of distinct "states" a single forward pass can hold is finite — a fixed-size, fixed-context transformer is a **finite-state machine**, and it cannot model periodic or truly hierarchical languages unless its depth or head-count scales with the input. The mechanistic engine behind the sequential behavior is the **induction head** (\cite[Olsson et al., 2022]{olsson2022induction}) — find $[A][B]\ldots[A]$, copy the successor $[B]$ — which is a primitive form of **recurrence** (copy what followed a repeated pattern). And (\cite[von Oswald et al., 2022]{vonoswald2022indc}) read the whole forward pass as **in-context gradient descent**, with the residual stream holding an *evolving in-context model*. So "recurrence" in a transformer is not a stored hidden vector being updated; it is attention **re-reading an ever-growing store of past states** and refining them layer by layer, a hand-off between specialized heads in successive layers that is carried by thin low-rank "channels" in the residual stream (\cite[Merullo et al., 2024]{merullo2024talkingheads}).

The honest summary: a transformer performs sequential, stateful computation by treating the context itself as state — a soft state machine whose state space is bounded by its (fixed) depth and context window. That bound is precisely what limits the arithmetic and counting of the previous section, and the binding limits you meet in the fact-retrieval chapter.
</div>
