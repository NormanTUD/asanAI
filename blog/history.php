<?php include_once("functions.php"); ?>

<div class="md">
## The term "Artificial Intelligence"

The term "Artificial Intelligence" was coined in \citeyear{darthmouthartificialintelligence} when **John McCarthy**, along with Marvin Minsky, Nathaniel Rochester, and Claude Shannon, submitted a proposal for the **Dartmouth Summer Research Project**. The workshop was founded on the conjecture that "every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it," marking the official birth of the field.

## The Imitation Game

Before the term "AI" even existed, **Alan Turing** laid the philosophical groundwork in \citeyear{turing1950computing} with his paper *\citetitle{turing1950computing}*.
<div class="smart-quote" data-cite="turing1950computing">
I propose to consider the question, 'Can machines think?
</div>

Turing argued that defining "thinking" was too ambiguous. Instead, he proposed the **Imitation Game** (now known as the Turing Test), a practical standard where a computer is considered intelligent if it can converse indistinguishably from a human. This shifted the goal of AI from replicating biological mechanics to replicating observable behavior.

## The Beginning of Neural Networks

<div class="smart-quote" data-cite="hebb1949organizationofbehaviour">
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

## The Triumph of Symbolic AI

While Perceptrons attempted to mimic the brain's structure, a different approach focused on logic and brute-force search. This "Symbolic AI" reached its zenith in \citeyear{deepblue1997} with **Deep Blue**.

<figure>
    <img src="deep_blue_kasparov.jpg" alt="Kasparov vs Deep Blue" />
    <figcaption>\citetitle{deepblueimage}</figcaption>
</figure>

In a historic six-game rematch, IBM's Deep Blue defeated the reigning world chess champion, **Garry Kasparov**.  unlike the learning-based Perceptron, Deep Blue relied on massive parallel processing capable of evaluating 200 million positions per second. It proved that for well-defined logical problems, a machine could exceed human capability not through intuition, but through sheer computational calculation.
</div>
