<?php include_once("functions.php"); ?>

<div class="md">

## The idea that logical thought can be calculated

<figure>
    <img style="width: 100%" src="arsmagna.jpg" alt="Ars Magna" />
    <figcaption class="md">\citealternativetitle{arsmagna}, written in \citeyear{arsmagna}: perhaps the first precursor to something akin to <i>computer science</i></figcaption>
</figure>

Long before silicon chips or even the most basic calculators, the 13th-century Majorcan mystic \citeauthor{arsmagna} attempted to mechanize thought itself. In his seminal work `\citealternativetitle{arsmagna}`, he designed a system of rotating, concentric paper circles inscribed with letters representing fundamental philosophical and theological concepts. By turning these wheels, one could generate every logically possible combination of ideas.

While it may look like a curious mix of medieval mysticism and combinatorics, it represents the first documented attempt to create a **universal logical language** that generates new knowledge through mechanical operations. Llull believed that by systematically exploring every possible connection between symbols, one could "calculate" the absolute truth—a direct ancestor to the idea that intelligence can be understood as the manipulation of symbols according to fixed rules.

When we observe a modern Transformer model calculating the relationship between billions of vectors to predict the next word, we are essentially witnessing Llull's rotating circles operating at an unimaginable scale. He was the first "outsider" to realize that if you can map the world into a set of symbols and define the rules for their combination, the machine can do the "thinking" for you.

<div class="smart-quote" data-cite="leibniz1685calculus">
    <div class="full-quote">
        If controversies were to arise, there would be no more need of disputation between two philosophers than between two accountants. For it would suffice to take their pencils in their hands, to sit down to their slates, and to say to each other: Let us calculate! (Calculemus!)
    </div>
    <div class="short-quote">Let us calculate! (Calculemus!)</div>
</div>

The work of \citeauthor{arsmagna} inspired \citeauthor{leibniz1685calculus} with the philosophical conviction that human reason itself is a form of computation. In \citetitle{leibniz1685calculus}, Leibniz proposed a universal logical language that would reduce all human reasoning to a series of calculations. 

Leibniz’s vision was revolutionary: he sought to mechanize thought by creating a symbolic system where every concept was represented by a unique number, allowing complex arguments to be resolved with the same algebraic certainty as a math problem. This "Mathesis Universalis" represents the true birth of the mechanical philosophy that underpins AI. It shifted the quest for intelligence from the mystical to the mathematical, providing the logical foundation that would eventually be realized in the \citealternativetitle{turing1950computing}.

## The earliest roots of modern AI

The mathematical birth of Artificial Intelligence did not start with silicon, but with the realization that biological processes could be described as logical calculi. Before \citeauthor{darthmouthartificialintelligence} even named the field, \citeauthor{mccullochpitts1943} laid the absolute foundation in their seminal work \citetitle{mccullochpitts1943}.

They proved that a simplified model of a biological neuron—often called the **McCulloch-Pitts cell**—could perform complex logical operations. Such a neuron computes a weighted sum of its inputs $x_i$ and "fires" if it exceeds a threshold $\theta$:

$$y = \begin{cases} 1 & \text{if } \sum_{i=1}^{n} w_i x_i \geq \theta \\ 0 & \text{otherwise} \end{cases}$$

This breakthrough allowed the brain to be viewed not just as a mysterious organ, but as a computational engine. Parallel to this, \citeauthor{wiener1948cybernetics} defined the field of **Cybernetics** in \citeyear{wiener1948cybernetics}. Wiener recognized that both machines and living organisms operate on principles of feedback loops and information transmission. This synthesis of biology, logic, and engineering provided the fertile soil from which modern AI would eventually grow.

This was the conceptual shift from "calculating machines" to the idea that cognition itself might be formalized.

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

Based on the \citealternativetitle{hebbianlearningrule}, idea of the canadian psychology professor \citeauthor{hebb1949organizationofbehaviour} published that neurons in the brain get a stronger connection to each other when they often fire together, which is often expressed as "neurons that fire together, wire together", in \citeyear{rosenblatt1958perceptron}, **\citeauthor{rosenblatt1958perceptron}** introduced the **Perceptron**, the biological-inspired ancestor of the modern neuron. Shifting away from rigid symbolic logic, he proposed a system that could "learn" by automatically adjusting its weights in response to errors. This marked a pivotal transition from hard-coded programming to the foundational principles of machine learning.

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

These early neural networks were extremely limited by today's standards, but they introduced the core idea of learning from data rather than hard-coded rules.

### The Perceptron and the First AI Winter

#### The Hype (1958)
When Frank Rosenblatt introduced the \citealternativetitle{perceptronswiki}, the first hardware implementation of a neural network. It was hailed by the \citealternativetitle{newyorktimesperceptron} as the beginning of a machine that would eventually be able to walk, talk, and think like humans.

#### The Critique (1969)
Marvin Minsky and Seymour Papert published their book \citetitle{minskyperceptrons}, which provided a mathematical proof of the architecture's limitations. They demonstrated that a single-layer perceptron could not solve the **XOR (Exclusive OR)** problem because it was not "linearly separable."

To understand why the XOR problem was so significant, we first need to look at how a computer processes logic. We can represent logical gates as functions that take an input matrix (representing all possible combinations of two inputs) and map them to an output vector.

In these examples:
* **False** is represented as $0$ (red) and
* **True** is represented $1$ (green)

#### The OR Gate
The **OR** gate is "True" if at least one input is "True."

$$f_\text{OR} \begin{pmatrix} \text{\color{#ef4444}{False}} & \text{\color{#ef4444}{False}} \\ \text{\color{#ef4444}{False}} & \text{\color{#22c55e}{True}} \\ \text{\color{#22c55e}{True}} & \text{\color{#ef4444}{False}} \\ \text{\color{#22c55e}{True}} & \text{\color{#22c55e}{True}} \end{pmatrix} = \begin{pmatrix} \text{\color{#ef4444}{False}} \\ \text{\color{#22c55e}{True}} \\ \text{\color{#22c55e}{True}} \\ \text{\color{#22c55e}{True}} \end{pmatrix}$$

#### The XOR Gate (Exclusive OR)
The **XOR** gate is "True" *only* if the inputs are different.

$$f_\text{XOR} \begin{pmatrix} \text{\color{#ef4444}{False}} & \text{\color{#ef4444}{False}} \\ \text{\color{#ef4444}{False}} & \text{\color{#22c55e}{True}} \\ \text{\color{#22c55e}{True}} & \text{\color{#ef4444}{False}} \\ \text{\color{#22c55e}{True}} & \text{\color{#22c55e}{True}} \end{pmatrix} = \begin{pmatrix} \text{\color{#ef4444}{False}} \\ \text{\color{#22c55e}{True}} \\ \text{\color{#22c55e}{True}} \\ \text{\color{#ef4444}{False}} \end{pmatrix}$$

Minsky and Papert demonstrated that while a single-layer perceptron can draw a line to separate the results of an OR gate, it is mathematically impossible to do so for XOR because the "True" and "False" results are not **linearly separable**.

<div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; margin-top: 20px;">
    <div id="plot-or-gate" style="width:400px; height:400px; border:1px solid #eee; border-radius: 8px;"></div>
    <div id="plot-xor-gate" style="width:400px; height:400px; border:1px solid #eee; border-radius: 8px;"></div>
</div>

It was only understood in \citeyear{rumelhart1986} that using multi-layer Perceptrons could solve the XOR-problem, which reignited interest in connectionist models and paved the way for modern deep learning.

#### The Lighthill Report (\citeyear{lighthillreport}) and The Collapse (1974–1980)

<div class="smart-quote" data-cite="lighthillreport" data-page=8>
In no part of the field have the discoveries made so far produced the
major impact that was then promised.
</div>

The \citealternativetitle{lighthillreport}, published in the UK, was a devastating critique that shattered confidence in AI research. It led to a "deep freeze" in the field known as the **First AI Winter**.

The realization that simple neural networks couldn't handle basic logic gates, combined with the \citealternativetitle{lighthillreport} in the UK, shattered confidence in the field.

* **Shattered Confidence:** Combined with mathematical proofs of neural network limitations, the report destroyed institutional trust in the field.
* **Funding Collapse:** Major agencies like DARPA slashed research budgets following its release.
* **Shift in Focus:** Research into connectionism (neural networks) stopped for a decade, shifting instead toward "symbolic AI" and expert systems.
* **The "Winter":** Connectionism (neural network research) entered a deep freeze for a decade, as the industry shifted toward "symbolic AI" and expert systems.

The field only recovered in the 1980s with the popularization of \citealternativetitle{rumelhart1986}, which allowed multi-layer networks to finally solve the XOR problem.

## Convolutional Neural Networks and LeNet-5 (1989-1998)

While early neural networks were limited, **Yann LeCun et al** revolutionized computer vision by developing the first practical **Convolutional Neural Network (CNN)**. In \citeyear{lecun1998gradientbased}, he introduced **LeNet-5**, an architecture specifically designed to recognize handwritten digits for the US Postal Service. Unlike standard networks, CNNs use small, learnable filters to automatically extract spatial features like edges and shapes. This proved that biological inspiration—mimicking the visual cortex—could solve complex pattern recognition tasks that traditional logic-based AI could not.

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

## The Deep Learning Revolution (\citeyear{krizhevsky2012imagenet})
After the second AI winter, the field shifted back to connectionism. In \citeyear{krizhevsky2012imagenet}, the \citealternativetitle{krizhevsky2012imagenet} paper demonstrated that deep convolutional neural networks, when powered by **GPUs** and massive datasets like ImageNet, could outperform all traditional methods. This validated the \citealternativetitle{sutton2019bitter}: scale and computation ultimately triumph over hand-coded human intuition.

## The Transformer and Attention (\citeyear{vaswani2017attention})
The most significant modern breakthrough was the \citealternativetitle{vaswani2017attention}. By utilizing a mechanism called **Self-Attention**, models could process entire sequences of data in parallel rather than word-by-word. This solved the "vanishing gradient" problem and allowed models to understand long-range context in text. The further text will lead you through every step you need to understand this Self-Attention-Mechanism on a basic level.

## The Rise of Generative AI
Today, the focus has shifted to **Large Language Models (LLMs)** like GPT. These models are "pre-trained" on nearly the entire internet to predict the next token in a sequence. By scaling these architectures to billions of parameters, AI has moved from simple classification to generating human-like text, code, and reasoning and even video and music.

What changed since the early days was not the basic ideas, but the availability of data, computing power, and practical training techniques.

## TODO! ADVANCEMENTS IN HARDWARE AND SOFTWARE SOURROUNDING

## The Cultural Mirror: AI in Imagination

The conceptualization of artificial intelligence has always been a dialogue between technical possibility and cultural anxiety. Long before the first line of code was written, the silhouette of the **Maschinenmensch** in \citeauthor{maschinenmensch}'s *Metropolis* (\citeyear{maschinenmensch}) established the archetype of the "artificial other"—a metallic reflection of human form that serves as both a marvel of engineering and a vessel for societal fears.

<figure>
    <img style="width: 100%" src="maschinenmensch.jpg" alt="Metropolis: Maschinenmensch Maria" />
    <figcaption>\citetitle{maschinenmensch}</figcaption>
</figure>

As the field progressed from mechanical dreams to electronic reality, the depiction of AI shifted toward disembodied, cold logic. This is most famously captured in the character of **HAL 9000** from the 1968 film *2001: A Space Odyssey*. HAL represented a shift in cultural tracking: the machine was no longer a physical threat because of its strength, but a psychological one because of its unwavering, lethal adherence to its own programmed objectives.

<figure>
    <img style="width: 100%" src="hal.jpg" alt="HAL 9000 red eye" />
    <figcaption class="md">\citealternativetitle{hal9000}: The personification of algorithmic logic in '2001: A Space Odyssey'</figcaption>
</figure>

Russian thinkers and authors have been particularly instrumental in exploring the ethical and social dimensions of these "thinking machines." \citeauthor{asimovlaws}, born in Russia before moving to the US, fundamentally altered the cultural trajectory of AI by introducing the *Three Laws of Robotics*, moving the narrative away from "Frankensteinian" monsters toward machines as tools governed by ethical safeguards. Similarly, the \citeauthor{strugatsky} (Arkady and Boris Strugatsky) often explored the intersection of advanced technology and human morality, questioning whether a truly superior intelligence could ever be compatible with human progress.

This cultural tracking was further refined by philosophers like \citeauthor{searle1980minds}, who used thought experiments to challenge the notion that cultural depictions of "thinking" machines actually equated to understanding. These narratives serve as the "pre-history" to \citetitle{sutton2019bitter}, reminding us that while we imagine AI as human-like entities, its actual development often follows the colder, more efficient path of raw computation.

</div>
