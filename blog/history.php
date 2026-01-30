<?php include_once("functions.php"); ?>

<div class="md">
## The Imitation Game

Before the term "Artificial Intelligence" even existed, **Alan Turing** laid the philosophical groundwork in \citeyear{turing1950computing} with his paper *\citetitle{turing1950computing}*.
<div class="smart-quote" data-cite="turing1950computing" data-page=1>
I propose to consider the question, 'Can machines think?
</div>

Turing argued that defining "thinking" was too ambiguous. Instead, he proposed the **Imitation Game** (now known as the Turing Test), a practical standard where a computer is considered intelligent if it can converse indistinguishably from a human. This shifted the goal of AI from replicating biological mechanics to replicating observable behavior.

## The term "Artificial Intelligence"

The term "Artificial Intelligence" was coined in \citeyear{darthmouthartificialintelligence} when **John McCarthy**, along with Marvin Minsky, Nathaniel Rochester, and Claude Shannon, submitted a proposal for the \citealternativetitle{darthmouthartificialintelligence}. The workshop was founded on the conjecture that "every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it," marking the official birth of the field.

## The Beginning of Neural Networks

<div class="smart-quote" data-cite="hebb1949organizationofbehaviour" data-page=62>
<div class="full-quote">When an axon of cell A is near enough to excite a cell B and repeatedly or persistently takes part in firing it... some growth process or metabolic change takes place in one or both cells such that A's efficiency, as one of the cells firing B, is increased.</div>
<div class="short-quote">What wires together, fires together</div>
</div>

Based on the \citealternativetitle{hebbianlearningrule}, idea of \citeauthor{hebb1949organizationofbehaviour} published that neurons in the brain get a stronger connection to each other when they often fire together, which is often expressed as "neurons that fire together, wire together", in \citeyear{rosenblatt1958perceptron}, **\citeauthor{rosenblatt1958perceptron}** introduced the **Perceptron**, the biological-inspired ancestor of the modern neuron. Shifting away from rigid symbolic logic, he proposed a system that could "learn" by automatically adjusting its weights in response to errors. This marked a pivotal transition from hard-coded programming to the foundational principles of machine learning.

<div class="image-row">
    <figure>
        <img src="Mark_I_perceptron.jpeg" alt="Mark I Perceptron Cables" />
        <figcaption>\citetitle{perceptronimagecables}</figcaption>
    </figure>

    <figure>
        <img src="perceptron2.jpg" alt="Perceptron Detection" />
        <figcaption>\citetitle{perceptronimagedetection}</figcaption>
    </figure>
</div>

His physical implementation, the **Mark I Perceptron**, was a massive hardware system at Cornell University that used electric motors to turn potentiometers (the "weights"). While limited to learning simple linear relationships, a constraint that eventually contributed to the first AI Winter, it established the fundamental architecture of weighted inputs and thresholds that powers every neural network today.

<figure>
	<img style="max-width: 100%" src="FrankRosenblattWiringPerceptron.webp" alt="Perceptron Wiring" />
	<figcaption>\citetitle{perceptronimagewiring}</figcaption>
</figure>

Rosenblatt's Mark I Perceptron (\cite{perceptronresults}, p. 136) achieved up to 100% accuracy on binary classification tasks like shape and letter recognition using single-layer architectures of 500 to 1,000 neurons. Across various experiments, it processed training sets of 20 to 10,000 images, maintaining high performance (80%–100%) despite variations in position and rotation.

### The Perceptron and the First AI Winter

#### The Hype (1958)
Frank Rosenblatt introduced the \citealternativetitle{perceptronswiki}, the first hardware implementation of a neural network. It was hailed by the \citealternativetitle{newyorktimesperceptron} as the beginning of a machine that would eventually be able to walk, talk, and think like humans.

#### The Critique (1969)
Marvin Minsky and Seymour Papert published their book \citetitle{minskyperceptrons}, which provided a mathematical proof of the architecture's limitations. They demonstrated that a single-layer perceptron could not solve the **XOR (Exclusive OR)** problem because it was not "linearly separable."

To understand why the XOR problem was so significant, we first need to look at how a computer processes logic. We can represent logical gates as functions that take an input matrix (representing all possible combinations of two inputs) and map them to an output vector.

In these examples:
* $0$ represents **False** (red)
* $1$ represents **True** (green)

#### The OR Gate
The **OR** gate is "True" if at least one input is "True."
$$f_{OR} \begin{pmatrix} 0 & 0 \\ 0 & 1 \\ 1 & 0 \\ 1 & 1 \end{pmatrix} = \begin{pmatrix} \color{#ef4444}{0} \\ \color{#22c55e}{1} \\ \color{#22c55e}{1} \\ \color{#22c55e}{1} \end{pmatrix}$$

#### The XOR Gate (Exclusive OR)
The **XOR** gate is "True" *only* if the inputs are different.
$$f_{XOR} \begin{pmatrix} 0 & 0 \\ 0 & 1 \\ 1 & 0 \\ 1 & 1 \end{pmatrix} = \begin{pmatrix} \color{#ef4444}{0} \\ \color{#22c55e}{1} \\ \color{#22c55e}{1} \\ \color{#ef4444}{0} \end{pmatrix}$$

Minsky and Papert demonstrated that while a single-layer perceptron can draw a line to separate the results of an OR gate, it is mathematically impossible to do so for XOR because the "True" and "False" results are not **linearly separable**.

<div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; margin-top: 20px;">
    <div id="plot-or-gate" style="width:400px; height:400px; border:1px solid #eee; border-radius: 8px;"></div>
    <div id="plot-xor-gate" style="width:400px; height:400px; border:1px solid #eee; border-radius: 8px;"></div>
</div>

#### The Lighthill Report (\citeyear{lighthillreport})

<div class="smart-quote" data-cite="lighthillreport" data-page=8>
In no part of the field have the discoveries made so far produced the
major impact that was then promised.
</div>

The \citealternativetitle{lighthillreport}, published in the UK, was a devastating critique that shattered confidence in AI research. It led to a "deep freeze" in the field known as the **First AI Winter**.

* **Shattered Confidence:** Combined with mathematical proofs of neural network limitations, the report destroyed institutional trust in the field.
* **Funding Collapse:** Major agencies like DARPA slashed research budgets following its release.
* **Shift in Focus:** Research into connectionism (neural networks) stopped for a decade, shifting instead toward "symbolic AI" and expert systems.

#### The Collapse (1974–1980)
The realization that simple neural networks couldn't handle basic logic gates, combined with the \citealternativetitle{lighthillreport} in the UK, shattered confidence in the field.

* **Funding Dried Up:** DARPA and other agencies slashed research budgets.
* **The "Winter":** Connectionism (neural network research) entered a deep freeze for a decade, as the industry shifted toward "symbolic AI" and expert systems.

The field only recovered in the 1980s with the popularization of \citealternativetitle{rumelhart1986}, which allowed multi-layer networks to finally solve the XOR problem.

## The Triumph of Symbolic AI

While Perceptrons attempted to mimic the brain's structure, a different approach focused on logic and brute-force search. This "Symbolic AI" reached its zenith in \citeyear{deepblue} with **Deep Blue**.

<figure>
    <img style="width: 100%" src="deep_blue_kasparov.jpg" alt="Kasparov vs Deep Blue" />
    <figcaption>\citetitle{deepblue}</figcaption>
</figure>

In a historic six-game rematch, IBM's Deep Blue defeated the reigning world chess champion, **Garry Kasparov**.  unlike the learning-based Perceptron, Deep Blue relied on massive parallel processing capable of evaluating 200 million positions per second. It proved that for well-defined logical problems, a machine could exceed human capability not through intuition, but through sheer computational calculation.

However, Deep Blue's victory represented the pinnacle of specific, hand-crafted logic rather than general intelligence. While effective for the rigid rules of chess, relying on human-designed strategies proved to be a bottleneck for more complex, unstructured problems. This realization leads directly to a fundamental, and somewhat painful, observation about the trajectory of AI progress.

## The Bitter Lesson: Scale over Strategy

<div class="smart-quote" data-cite="sutton2019bitter">
The biggest lesson that can be read from 70 years of AI research is that general methods that leverage computation are ultimately the most effective, and by a large margin [...] We have to learn the bitter lesson that building in how we think we think does not work in the long run. 
</div>

The **Bitter Lesson** is a famous observation by AI researcher \citeauthor{sutton2019bitter}. It argues that for decades, scientists tried to make AI smart by "teaching" it human rules, like teaching a computer the specific rules of chess or how human grammar works. 

However, history shows that this approach usually fails in the long run. The "bitter" truth is that **raw \citealternativetitle{mooreslaw} (computational power)** and **massive data** almost always beat human-designed cleverness.

**Key Takeaways:**
* **The Power of Search and Learning:** Instead of hand-coding "knowledge," the most successful AIs simply use massive amounts of calculation to "search" for the best answer or "learn" from trillions of examples.
* **Don't Hard-Code Intuition:** Our human "intuition" about how we solve problems is often a bottleneck for machines. When we remove our human-centric rules and let the computer use its own math at scale, it performs better.
* **Scaling Wins:** Simple algorithms that can grow and take advantage of more powerful hardware will eventually overtake complex, specialized programs.

</div>
