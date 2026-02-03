<?php include_once("functions.php"); ?>

<div class="md">

\category{history,philosophy}
## The Abstraction of Labor: From Wheels to Thought

<div class="smart-quote" data-cite="wheelerindirection">
<div class="full-quote">We can solve any problem by introducing an extra level of indirection.</div>
<div class="short-quote">Any problem in computer science can be solved by adding another layer of abstraction [except, maybe, having too many abstractions].</div>
</div>

The history of machines is fundamentally a history of **abstraction**, where human effort is "drawn away" (**abstrahere**) from the direct task. This began with the **wheel**, which abstracted the friction of the terrain by placing a rotating interface between the load and the ground. This concept of mechanical mediation was radically advanced by **Heron of Alexandria**, whose "automata" and steam-powered *aeolipile* demonstrated that task sequences could be outsourced to the physical logic of a machine (\citeauthor{livingdolls}, p. 16). By introducing these layers, humans stopped performing the action and began managing the mechanism that performs it.

This trajectory eventually crossed from the physical to the cognitive. As identified by **David Wheeler**, "any problem in computer science can be solved by another layer of abstraction". Just as the wheel abstracts movement, modern computation abstracts thought, treating reasoning as a formal calculus that can be executed by a machine. Thus, the machine serves as the ultimate "extra level of indirection," distancing the human from the raw labor of both hand and mind.

\category{philosophy}

## The Roots of Formal Logic

<figure>
    <img style="width: 100%" src="Sanzio_01_Plato_Aristotle.jpg" alt="Ars Magna" />
    <figcaption class="md">\citealternativetitle{aristotleandplato} by \citeauthor{aristotleandplato} (\citeyear{aristotleandplato})</figcaption>
</figure>

While \citeauthor{aristotleanalytics} is the father of formal logic, his work was the culmination of a tradition beginning with **Zeno of Elea** (c. 460 BC). Zeno is often regarded as the first "logician" for his use of *reductio ad absurdum* to defend his paradoxes. This analytical foundation was further refined by the dialectic methods of **Socrates** and the categorization of ideas by **Plato** (see \citetitle{bochenski}, p. 26f).

Aristotle synthesized these influences to create the **Syllogism**, the first system to decouple an argument’s structure from its content:

$$
\begin{aligned}
&\text{Major Premise: All } M \text{ are } P. \\
&\text{Minor Premise: } S \text{ is } M. \\
&\text{Conclusion: Therefore, } S \text{ is } P.
\end{aligned}
$$

Or, with concrete details:

$$
\begin{aligned}
&\text{Major Premise: All men are mortal.} \\
&\text{Minor Premise: Socrates is a man.} \\
&\text{Conclusion: Therefore, Socrates is mortal.}
\end{aligned}
$$

By proving that truth could be derived through the mechanical application of formal rules, Aristotle provided the blueprint for everything from medieval scholasticism to modern computation.

This transition from philosophical dialogue to a rigid logical calculus paved the way for thinkers to treat thought as a form of algebra, leading directly to the work of \citeauthor{arsmagna}.

## The Antikythera Mechanism: Ancient Analog Computing

<figure>
    <img style="width: 100%" src="antikythera.jpg" alt="Antikythera Mechanism" />
    <figcaption class="md">\citealternativetitle{antikytheraimage}</figcaption>
</figure>

The \citealternativetitle{antikytherasciam} is an ancient Greek hand-powered orrery, often described as the world's oldest known analog computer. It was used to predict astronomical positions and eclipses for calendar and astrological purposes decades in advance. It could also track the four-year cycle of athletic games, including the ancient Olympic Games.

* **Circumstances:** The device was discovered in 1901 among wreckage retrieved from a shipwreck off the coast of the Greek island Antikythera. It is believed to have been constructed between 200 BC and 60 BC. Following the wreck, the advanced technology required to build such complex geared mechanisms was lost to Western civilization for over a millennium, not reappearing until the development of mechanical astronomical clocks in the 14th century.
* **Technical Sophistication:** It contained at least 30 meshing bronze gears housed in a wooden case covered in inscriptions. These inscriptions acted as a user manual, explaining the cycles of the sun, moon, and at least five planets.
* **Significance:** It proves that the "Computer Era" has roots in mechanical simulation. While Zuse and Aiken used gears or relays for abstract math, the Antikythera mechanism used them to model the physical universe through mechanical ratios.



\category{hardware,history,philosophy}
## The idea that logical thought can be mechanically calculated

### The earliest medieval attempt: \citeauthor{arsmagna}

<figure>
    <img style="width: 100%" src="arsmagna.jpg" alt="Ars Magna" />
    <figcaption class="md">\citealternativetitle{arsmagna}, written in \citeyear{arsmagna}: perhaps the first attempt to create combinations of ideas mechanically, and therefore, a precursor to the idea of artificial intelligence, where a physical device can calculate answers through logical means</figcaption>
</figure>

Long before silicon chips or even the most basic calculators, the 13th-century Majorcan mystic \citeauthor{arsmagna} attempted to mechanize thought itself. In his seminal work `\citealternativetitle{arsmagna}`, he designed a system of rotating, concentric paper circles inscribed with letters representing fundamental philosophical and theological concepts. By turning these wheels, one could generate every logically possible combination of ideas.

While it may look like a curious mix of medieval mysticism and combinatorics, it represents the first documented attempt to create a **universal logical language** that generates new knowledge through mechanical operations. Llull believed that by systematically exploring every possible connection between symbols, one could "calculate" the absolute truth, a direct ancestor to the idea that intelligence can be understood as the manipulation of symbols according to fixed rules.

When we observe a modern Transformer model calculating the relationship between billions of vectors to predict the next word, we are essentially witnessing Llull's rotating circles operating at an unimaginable scale. He was the first "outsider" to realize that if you can map the world into a set of symbols and define the rules for their combination, the machine can do the "thinking" for you.

The work of \citeauthor{arsmagna} inspired \citeauthor{leibniz1685calculus} with the philosophical conviction that human reason itself is a form of computation. In \citetitle{leibniz1685calculus}, Leibniz proposed a universal logical language that would reduce all human reasoning to a series of calculations. 

\category{hardware,philosophy}
### Gottfried Wilhelm Leibniz 

<div class="smart-quote" data-cite="leibniz1685calculus">
    <div class="full-quote">
        If controversies were to arise, there would be no more need of disputation between two philosophers than between two accountants. For it would suffice to take their pencils in their hands, to sit down to their slates, and to say to each other: Let us calculate! (Calculemus!)
    </div>
    <div class="short-quote">Let us calculate! (Calculemus!)</div>
</div>

\category{hardware}

<figure>
    <img style="width: 100%" src="Leibnizrechenmaschine.jpg" alt="Rechenmaschine by Leibniz" />
    <figcaption class="md">\citealternativetitle{leibnizrechenmaschine}</figcaption>
</figure>

Leibniz’s vision was revolutionary: he sought to mechanize thought by creating a symbolic system
where every concept was represented by a unique number, allowing complex arguments to be
resolved with the same algebraic certainty as a math problem. This "Mathesis Universalis"
represents the true birth of the mechanical philosophy that underpins AI. Crucially, Leibniz
also formalized the binary system, reducing all mathematical logic to the interplay of 0 and 1,
providing the literal alphabet for the digital age. It shifted the quest for intelligence from
the mystical to the mathematical, providing the logical foundation that would eventually be
realized in \citealternativetitle{turing1950computing}.

### The Physical Manifestation: Babbage’s Analytical Engine

<figure>
    <img style="width: 100%" src="babbage.jpg" alt="Ars Magna" />
    <figcaption class="md">\citealternativetitle{babbage}</figcaption>
</figure>

The transition from Leibniz’s theoretical calculus to physical machinery found its most ambitious expression in the work of **Charles Babbage**. Moving beyond his earlier Difference Engine, Babbage conceived of the **Analytical Engine** (c. 1837), a machine that mirrored the architecture of modern computers nearly a century before the electronic age. 

The Engine was designed to be powered by steam and constructed from brass and iron. Most importantly, it separated the "Store" (memory) from the "Mill" (the central processing unit). Babbage realized that for a machine to be truly universal, it needed to be programmable via punched cards, a technique borrowed from the Jacquard loom. This allowed the machine to perform different tasks without physical reconfiguration, effectively decoupling the hardware from the logical "software" it executed.



#### Ada Lovelace: The First Software Architect

While Babbage focused on the mechanical engineering, **Ada Lovelace** provided the conceptual breakthrough that transformed the Engine from a calculator into a computer. In her 1843 "Notes," she recognized that the Engine's ability to manipulate symbols according to rules meant it could process anything from music to scientific logic.

Lovelace authored what is recognized as the first complex algorithm intended for a machine: a method for calculating **Bernoulli numbers** ($B_n$). She broke the calculation down into a series of iterative steps, anticipating the concept of the "loop." Mathematically, she approached the Bernoulli sequence through the identity:

$$ 0 = -\frac{1}{2}(m+1) + B_1^+(m+1) + \sum_{k=2}^{m} \binom{m+1}{k} B_k $$

Lovelace’s genius lay in her understanding of the "Science of Operations." She saw that the hardware was merely a vessel for the logic, famously stating that the Analytical Engine "weaves algebraic patterns just as the Jacquard-loom weaves flowers and leaves" (\citetitle{lovelacequote}).

### Konrad Zuse: The Engineer

<div class="smart-quote" data-cite="zusetoolazy" data-page=62>
I was too lazy to calculate by hand.
</div>

<figure>
    <img style="width: 100%" src="zuse.jpg" alt="Zuses Z1" />
    <figcaption class="md">\citealternativetitle{zusez1}</figcaption>
</figure>

\citeauthor{zusebook}, a civil engineer tired of manual arithmetic, spent 1936 to 1945 building the first binary computers in his parents' Berlin living room. His Z-series evolved from the mechanical **Z1**, which used sliding metal plates but suffered from frequent jams, to the **Z3** (1941), the world’s first functional, programmable, and fully automatic digital computer. By switching from mechanical parts to 2,000 electromagnetic telephone relays, Zuse proved that binary electricity was the future of calculation. He even pioneered the first high-level programming language, **Plankalkül**, while hiding his **Z4** model in the Alps to survive WWII, eventually launching the world's first commercial computer company (\citetitle{zusebook}, p. 72ff, 156ff).

Zuse did not directly work on modern AI systems, but together with people like Aiken, based on earlier ideas of Leibniz, Babbage, Llull, and, in parts, of Aristotle, he helped to create the *hardware* AI can run on.

### Scaling Abstraction: From Bits to Frameworks

As hardware matured from relays to vacuum tubes and finally to silicon, the bottleneck shifted from physical construction to the management of "Software." To handle the growing complexity of these systems, computer science adopted a strategy of increasing abstraction. As **David J. Wheeler** famously noted, all problems in computer science can be resolved by another level of indirection.

This evolution moved from:
1. **Machine Logic:** Managing individual bits and relays (Zuse).
2. **Operating Systems:** Managing hardware resources so the human doesn't have to.
3. **High-Level Frameworks:** Tools like **TensorFlow** or **Keras** that allow researchers to treat complex neural operations as "simple boxes."
4. **Graphical User Interfaces:** They move the abstraction even further away from what the hardware is doing when the user can, for example, just speak to control the computer.

Today, a developer can invoke a convolutional layer with a single command, such as `model.conv2d`. Under the hood, the system manages millions of matrix multiplications, a level of complexity that would have been impossible for a human to track manually, but which fulfills the trajectory started by Lovelace: reducing the mechanics of thought to a manageable, symbolic architecture.

Operating Systems, later frameworks, growing complexity on the system side to reduce complexity on the human side, until progress could be made by just moving simple boxes like in asanAI or TensorFlow like model.Dense or model.conv2d. Very important to think that level of abstraction

\category{history}
## The earliest roots of modern AI

<div class="image-row">
	<figure>
		<img src="mcculloch.png" alt="Warren McCulloch" />
		<figcaption>Neurophysiologist Warren McCulloch, \citeyear{mccullochpittsimage}</figcaption>
	</figure>
	<figure>
		<img src="pitts.jpg" alt="Walter Pitts" />
		<figcaption>Logician and psychologist Walter Pitts, \citeyear{mccullochpittsimage}</figcaption>
	</figure>
</div>

The mathematical birth of Artificial Intelligence did not start with silicon or vacuum tubes, but with the realization that biological processes could be described as logical calculi. Before \citeauthorlastnameand{darthmouthartificialintelligence} even named the field, neurophysiologist and neuroscientist team of \citeauthor{mccullochpitts1943} laid the very bedrock foundation for modern AI in their seminal work \citetitle{mccullochpitts1943}.

They proved that a simplified model of a biological neuron, often called the **McCulloch-Pitts cell**, could perform complex logical operations. Such a neuron computes a weighted sum of its inputs $x_i$ and "fires" if it exceeds a threshold $\theta$:

$$y = \begin{cases} 1 & \text{if } \sum_{i=1}^{n} w_i x_i \geq \theta \\ 0 & \text{otherwise} \end{cases}$$

This breakthrough allowed the brain to be viewed not just as a mysterious organ, but as a computational engine. Parallel to this, \citeauthor{wiener1948cybernetics} defined the field of **\citealternativetitle{wiener1948cybernetics}** in \citeyear{wiener1948cybernetics}. Wiener recognized that both machines and living organisms operate on principles of feedback loops and information transmission. This synthesis of biology, logic, and engineering provided the fertile soil from which modern AI would eventually grow.

This was the conceptual shift from "calculating machines" to the idea that cognition itself might be formalized.

\category{hardware,history,computer_science}
## Further developments of Computer Hardware and Computing Theory

### Howard Aiken & The Harvard Mark I (1944)

<figure>
    <img style="width: 100%" src="aiken.jpg" alt="Howard Aiken" />
    <figcaption class="md">\citealternativetitle{aikenphoto}</figcaption>
</figure>

Inspired by Babbage’s Analytical Engine, Aiken designed the **ASCC (Mark I)**. While Zuse used binary, Aiken stuck to **decimal** wheels. It was a massive, 50-foot long mechanical beast synchronized by a long rotating shaft.
* **Significance:** It was the first large-scale automatic digital computer in the USA. He described it first in \citetitle{aiken} in \citeyear{aiken}.

### John von Neumann & The Stored-Program Concept (1945)
Before von Neumann, computers like the ENIAC had to be physically rewired to change tasks. His \citetitle{vonneumann} proposed the **Von Neumann Architecture**.

His **Big Idea:** Data and instructions are stored in the same memory. This allowed the computer to be "reprogrammed" via software rather than hardware switches.

### Alan Turing: Theory and the Universal Machine (1936-1950)
\citeauthor{turing1937} provided the mathematical proof for what a computer *could* do.
* **Turing Machine (1936):** A theoretical model showing that a simple machine reading symbols on a tape could simulate any algorithmic logic.
* **ACE & Enigma:** Beyond theory, he designed the Automatic Computing Engine (ACE) and led the cryptanalysis at Bletchley Park using the "Bombe."

\category{hardware,history}
### The Imitation Game

Before the term "Artificial Intelligence" even existed, **Alan Turing** laid the philosophical groundwork in \citeyear{turing1950computing} with his paper *\citetitle{turing1950computing}*.
<div class="smart-quote" data-cite="turing1950computing" data-page=1>
I propose to consider the question, 'Can machines think?
</div>

Turing argued that defining "thinking" was too ambiguous. Instead, he proposed the **Imitation Game** (now known as the Turing Test), a practical standard where a computer is considered intelligent if it can converse indistinguishably from a human. This shifted the goal of AI from replicating biological mechanics to replicating observable behavior.

\category{history}
## The term "Artificial Intelligence"

The term "Artificial Intelligence" was coined in \citeyear{darthmouthartificialintelligence} when **John McCarthy**, along with Marvin Minsky, Nathaniel Rochester, and Claude Shannon, submitted a proposal for the \citealternativetitle{darthmouthartificialintelligence}. The workshop was founded on the conjecture that "every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it," marking the official birth of the field.

\category{history,hardware,psychology}
## The Beginning of Neural Networks

<figure>
	<img style="max-width: 100%" src="FrankRosenblattWiringPerceptron.webp" alt="Perceptron Wiring" />
	<figcaption>\citetitle{perceptronimagewiring}</figcaption>
</figure>

<div class="smart-quote" data-cite="hebb1949organizationofbehaviour" data-page=62>
<div class="full-quote">When an axon of cell A is near enough to excite a cell B and repeatedly or persistently takes part in firing it... some growth process or metabolic change takes place in one or both cells such that A's efficiency, as one of the cells firing B, is increased.</div>
<div class="short-quote">What wires together, fires together</div>
</div>

Based on the \citealternativetitle{hebb1949organizationofbehaviour}, idea of the canadian psychology professor \citeauthor{hebb1949organizationofbehaviour} published that neurons in the brain get a stronger connection to each other when they often fire together, which is often expressed as "neurons that fire together, wire together", in \citeyear{rosenblatt1958perceptron}, **\citeauthor{rosenblatt1958perceptron}** introduced the **Perceptron**, the biological-inspired ancestor of the modern neuron. Shifting away from rigid symbolic logic, he proposed a system that could "learn" by automatically adjusting its weights in response to errors. This marked a pivotal transition from hard-coded programming to the foundational principles of machine learning.

This project was funded by the *Office of Naval Research*, under the codename *Project Para*, first written about by \citeauthor{rosenblattperceptron} in \citeyear{rosenblattperceptron}.


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


Rosenblatt's Mark I Perceptron (\cite{perceptronresults}, p. 136) achieved up to 100% accuracy on binary classification tasks like shape and letter recognition using single-layer architectures of 500 to 1,000 neurons. Across various experiments, it processed training sets of 20 to 10,000 images, maintaining high performance (80%–100%) despite variations in position and rotation (\cite{rosenblattperceptronresults}).

It, basically, worked the same as modern neural networks. It was automatically executing the equation $f(x) = Ax + B$, with $A$ and $B$ being tensors of weights. The only things that were missing were the concepts of non-linear activation functions and backpropagation for it to be classified a modern *Dense*-layer network (although a lot of other stuff was also missing, like numerical stability, regularization, loss functions, hardware, ...).

These early neural networks were extremely limited by today's standards, but they introduced the core idea of learning from data rather than hard-coded rules. This is called *connectionist approach*, instead of the *symbolic approach*. In the *symbol approach*, like the *Rechenmaschine* by Leibniz, the rules are all set from the beginning on. In connectionist approaches, the rules are not set by humans, but trained on by data. Modern LLMs are connectionist rather than symbolic.

\category{history}
### The Perceptron and the First AI Winter

\category{history}
#### The Hype (1958)

<figure style="float: right; width: 45%; max-width: 300px; margin: 0 0 1em 1em;">
    <img style="width: 100%; height: auto; display: block;" src="navy.png" alt="New York Times article about the Perceptron" />
    <figcaption class="md">\citealternativetitle{newyorktimesperceptron}, \citeyear{newyorktimesperceptron}</figcaption>
</figure>

When Frank Rosenblatt introduced the \citealternativetitle{rosenblattperceptron}, the first hardware implementation of a neural network. It was hailed by the \citealternativetitle{newyorktimesperceptron} as the beginning of a machine that would eventually be able to walk, talk, and think like humans, and even translate languages into another. All of Rosenblatts predictions were astoundly accurate.

Between the invention of the Perceptron in 1958 and the release of chatGPT, were 64 years of development, until all Rosenblatt envisioned became true. As such, this is a case of a \citealternativetitle{sleepingbeauty} invention.

\category{history}
#### The Critique (1969)
Marvin Minsky and Seymour Papert published their book \citetitle{minskyperceptrons}, which provided a mathematical proof of the architecture's limitations. They demonstrated that a single-layer perceptron could not solve the **XOR (Exclusive OR)** problem because it was not "linearly separable."

To understand why the XOR problem was so significant, we first need to look at how a computer processes logic. We can represent logical gates as functions that take an input matrix (representing all possible combinations of two inputs) and map them to an output vector.

In these examples:
* **False** is represented as $0$ (red) and
* **True** is represented $1$ (green)

#### The OR Gate
The **OR** gate is "True" if at least one input is "True."

$f_\text{OR} \begin{pmatrix} \text{\color{#ef4444}{False}} & \text{\color{#ef4444}{False}} \\ \text{\color{#ef4444}{False}} & \text{\color{#22c55e}{True}} \\ \text{\color{#22c55e}{True}} & \text{\color{#ef4444}{False}} \\ \text{\color{#22c55e}{True}} & \text{\color{#22c55e}{True}} \end{pmatrix} = \begin{pmatrix} \text{\color{#ef4444}{False}} \\ \text{\color{#22c55e}{True}} \\ \text{\color{#22c55e}{True}} \\ \text{\color{#22c55e}{True}} \end{pmatrix}$

#### The XOR Gate (Exclusive OR)
The **XOR** gate is "True" *only* if the inputs are different.

$f_\text{XOR} \begin{pmatrix} \text{\color{#ef4444}{False}} & \text{\color{#ef4444}{False}} \\ \text{\color{#ef4444}{False}} & \text{\color{#22c55e}{True}} \\ \text{\color{#22c55e}{True}} & \text{\color{#ef4444}{False}} \\ \text{\color{#22c55e}{True}} & \text{\color{#22c55e}{True}} \end{pmatrix} = \begin{pmatrix} \text{\color{#ef4444}{False}} \\ \text{\color{#22c55e}{True}} \\ \text{\color{#22c55e}{True}} \\ \text{\color{#ef4444}{False}} \end{pmatrix}$

Minsky and Papert demonstrated that while a single-layer perceptron can draw a line to separate the results of an OR gate, it is mathematically impossible to do so for XOR because the "True" and "False" results are not **linearly separable**.

<div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; margin-top: 20px;">
    <div id="plot-or-gate" style="width:400px; height:400px; border:1px solid #eee; border-radius: 8px;"></div>
    <div id="plot-xor-gate" style="width:400px; height:400px; border:1px solid #eee; border-radius: 8px;"></div>
</div>

It was only understood in \citeyear{rumelhart1986} that using multi-layer Perceptrons could solve the XOR-problem, which reignited interest in connectionist models and paved the way for modern deep learning.

The XOR problem was the ultimate litmus test for **non-linear complexity**. Since early Perceptrons could only classify data separable by a single straight line, they were mathematically incapable of solving XOR, where "True" results sit diagonally across from "False" results. This failure proved that connectionist AI could not handle basic binary addition or complex logic, leading to the **First AI Winter**. It wasn't until the 1980s that multi-layer networks and **Backpropagation** provided the "curved" mathematical logic needed to break through this linear wall.

\category{history}
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

\category{history,software}
### The Architectural Precursors: Neocognitron and Backprop

Before LeCun perfected the CNN, the architectural blueprints were drawn by **Kunihiko Fukushima**. in \citeyear{neocognitron}, he developed the **\citealternativetitle{neocognitron}**, a hierarchical network inspired by the visual cortex. It introduced the two key layers of modern vision AI: "S-cells" (simple) for feature extraction and "C-cells" (complex) for pooling, which allowed the machine to recognize objects even if they were shifted in position.

However, these deep structures were difficult to train until the popularization of **Backpropagation** by \citeauthor{rumelhart1986} in \citeyear{rumelhart1986}. This mathematical technique allowed the "error" of a network to be sent backward through the layers, adjusting the weights with precision. The combination of Fukushima’s architecture and Rumelhart’s training algorithm set the stage for the deep learning revolution.

\category{hardware,history}
## The Silicon Engine: Moore’s Law

While AI research suffered through funding winters, the physical substrate of computing was undergoing an explosion. \citealternativetitle{mooreslaw} describes the observation made by Gordon Moore that the number of transistors in a dense integrated circuit doubles about every two years.

This relentless exponential growth meant that while algorithms remained largely unchanged for decades, the machinery running them became millions of times more powerful. This "free" improvement in performance is the engine behind \citetitle{sutton2019bitter}: methods that scale with computation (like neural networks) were destined to eventually overtake methods that relied on human cleverness, simply because the hardware kept getting faster.

\category{history,software,psychology}
## The Illusion of Empathy: The ELIZA-Effect

<div class="smart-quote" data-cite="weizenbaum1976computer" data-page=7>
I had not realized ... that extremely short exposures to a relatively simple computer program could induce powerful delusional thinking in quite normal people.
</div>

In the era of Symbolic AI, before machines played chess at a master level, they attempted conversation. In 1966, **\citeauthor{weizenbaum1976computer}** created **ELIZA**, a program designed to parody a Rogerian psychotherapist.

Unlike modern LLMs which calculate probabilities, ELIZA relied on simple pattern matching and substitution scripts. If a user typed "My mother hates me," ELIZA might use a decomposition rule to transform "My X Y me" into "Who else in your family Y you?"

Despite having no understanding of the world, users, including Weizenbaum's own secretary, attributed genuine human emotions and wisdom to the machine. Weizenbaum was so disturbed by this tendency of humans to project humanity onto code that he wrote \citetitle{weizenbaum1976computer} to warn against the reliance on "deciding" machines over "choosing" humans.

## The Triumph of Symbolic AI

While Perceptrons attempted to mimic the brain's structure, a different approach focused on logic and brute-force search. This "Symbolic AI" reached its zenith in \citeyear{deepblue} with **Deep Blue**.

<figure>
    <img style="width: 100%" src="deep_blue_kasparov.jpg" alt="Kasparov vs Deep Blue" />
    <figcaption>\citetitle{deepblue}</figcaption>
</figure>

In a historic six-game rematch, IBM's Deep Blue defeated the reigning world chess champion, **Garry Kasparov**.  unlike the learning-based Perceptron, Deep Blue relied on massive parallel processing capable of evaluating 200 million positions per second. It proved that for well-defined logical problems, a machine could exceed human capability not through intuition, but through sheer computational calculation.

However, Deep Blue's victory represented the pinnacle of specific, hand-crafted logic rather than general intelligence. While effective for the rigid rules of chess, relying on human-designed strategies proved to be a bottleneck for more complex, unstructured problems. This realization leads directly to a fundamental, and somewhat painful, observation about the trajectory of AI progress.

## Bridging the Gap: Long Short-Term Memory (LSTM)

### The "Vanishing Gradient" Problem
Before the late 1990s, Recurrent Neural Networks (RNNs) struggled to learn long-range dependencies. As errors were backpropagated through time, the mathematical signal (the gradient) would shrink exponentially, effectively "vanishing". This meant machines had a very short "memory" and could not connect information at the start of a long sentence to the end.

### The Innovation (1997)
Sepp Hochreiter and Jürgen Schmidhuber introduced the **\citetitle{lstm} (LSTM)** architecture to solve this.
* **The Gating Mechanism**: LSTMs use "gates" (Input, Forget, and Output) to regulate the flow of information.
* **The Constant Error Carousel**: This internal mechanism allows the gradient to flow across long sequences without disappearing, enabling the network to "remember" information for thousands of steps.

### The Bridge to Modern AI
LSTMs were the "workhorse" of AI for two decades (approx. 1997–2017).
* **Era of Dominance**: They powered the first truly functional versions of Google Translate, Apple's Siri, and Amazon's Alexa.
* **Connectionist Victory**: While the "Bitter Lesson" suggests scale is key, the LSTM was a rare "clever" architectural breakthrough that allowed neural networks to remain viable for language tasks until the **Transformer** and **Self-Attention** took over in 2017.

### Significance
Without the LSTM, the "AI Winter" for natural language processing likely would have lasted much longer. It proved that connectionist models could handle the sequential, complex nature of human speech by mimicking a form of persistent memory.

\category{history,software}
## Convolutional Neural Networks and LeNet-5 (1989-1998)

While early neural networks were limited, **Yann LeCun et al** revolutionized computer vision by developing the first practical **Convolutional Neural Network (CNN)**. In \citeyear{lecun1998gradientbased}, he introduced **LeNet-5**, an architecture specifically designed to recognize handwritten digits for the US Postal Service. Unlike standard networks, CNNs use small, learnable filters to automatically extract spatial features like edges and shapes. This proved that biological inspiration, mimicking the visual cortex, could solve complex pattern recognition tasks that traditional logic-based AI could not.

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

## What this tells us about the world and ourselves
<div class="smart-quote" data-cite="heraclitus500fragments">
Nature loves to hide herself.
</div>

If the models that mirror our own cognitive processes only achieve peak generalization once they become too complex to decode, then we’ve hit a biological version of an event horizon. We turned to AI as a mirror to understand ourselves, yet the "Bitter Lesson" suggests that the more accurate the reflection becomes, the more it retreats into a shroud of uninterpretable complexity. It’s as if nature has placed a cosmic limit on self-observation: just as there is a visual boundary to the observable universe or a point in quantum scales where looking closer inherently blurs the view, the architecture of thought seems to veil itself the moment it becomes functional. In our attempt to build ourselves, we’ve discovered that intelligence is most "human" only when it remains an enigma, proving that the closer we get to the source, the more nature insists on its right to hide.

\category{data}
## Scaling Laws: From Encyclopedias to the Digital Ocean

The breakthrough of modern AI was predicated on a shift in data philosophy: moving from "quality" (hand-curated expert knowledge) to "quantity" (the total sum of digital footprints). Early AI failed because the world was not yet sufficiently digitized. The current era of 2020s AI only became possible once the internet provided a large enough corpus, petabytes of text, code, and images, to allow models to internalize the latent structures of human logic. In this context, data is the "terrain" that the machine's "wheels" must traverse; without a world-scale digital ocean, the abstraction of thought would have had nothing to grip.

\category{philosophy,data}
### Data Pollution and the "Low-Background Steel" Paradox

The rapid proliferation of AI-generated content introduces a new risk: data pollution. As future models are trained on the output of current models, they risk "model collapse," where errors and biases are recursively amplified. This mirrors the \citealternativetitle{preaiinternet} phenomenon: for highly sensitive radiation detectors, scientists must harvest steel from sunken pre-1945 warships (like the *SMS Kronprinz Wilhelm*) because any steel produced after the Trinity nuclear test is contaminated with atmospheric radionuclides. Similarly, "clean" human data from the pre-AI era (pre-2022) may become a finite, precious resource, necessary to calibrate the "radioactive" synthetic datasets of the future.

\category{hardware}
## From CPU to GPU: The Realization of the "Bitter Lesson"

The shift from the Central Processing Unit (CPU) to the Graphics Processing Unit (GPU) represents the most significant architectural pivot in AI history. While the CPU is designed for deep, sequential logic, a direct descendant of the von Neumann architecture, the GPU utilizes thousands of simple cores to perform matrix multiplications simultaneously. This hardware shift validates the core thesis of \citetitle{sutton2019bitter}: that methods leveraging massive computation eventually outcompete those relying on human-centric heuristics. By abstracting away complex conditional logic in favor of "brute-force" parallel math, the GPU provided the raw power necessary to turn neural networks from theoretical models into dominant technologies.

## The Deep Learning Revolution (\citeyear{krizhevsky2012imagenet})
After the second AI winter, the field shifted back to connectionism. In \citeyear{krizhevsky2012imagenet}, the \citealternativetitle{krizhevsky2012imagenet} paper demonstrated that deep convolutional neural networks, when powered by **GPUs** and massive datasets like ImageNet, could outperform all traditional methods. This validated the \citealternativetitle{sutton2019bitter}: scale and computation ultimately triumph over hand-coded human intuition.

\category{hardware,history}
## The Hardware Lottery: How Gamers Saved AI

While the theoretical foundations of deep learning were laid in the 1980s, the field remained dormant largely due to a lack of computing power. The solution came from an unlikely source: the video game industry.

In the mid-2000s, researchers began to realize that the mathematical operations required to render 3D video games, specifically, the manipulation of massive matrices of pixels, were mathematically identical to the operations required to train neural networks.

### The "Why": SIMD vs. MIMD
The fundamental difference lies in architecture. A **CPU** (Central Processing Unit) is designed for **latency**: it has a few powerful cores optimized to do complex, sequential logic (MIMD: Multiple Instruction, Multiple Data). It is like a professor who can solve difficult calculus problems one by one.

A **GPU** (Graphics Processing Unit), conversely, is designed for **throughput**: it has thousands of smaller, simpler cores designed to perform the same instruction on massive amounts of data simultaneously (SIMD: Single Instruction, Multiple Data). It is like a thousand elementary school students who can all perform simple addition at the exact same time.

Since training a neural network involves multiplying billions of floating-point numbers (weights) by billions of other numbers (inputs), the GPU's architecture allowed for speedups of **70x to 100x** over CPUs.

### The Discovery
While early attempts to use GPUs for neural networks date back to **Oh & Jung** in \citeyear{oh2004gpu}, the breakthrough required a bridge between hardware and code. This arrived with NVIDIA's release of **CUDA** in 2007, which allowed researchers to program GPUs without translating everything into "graphics" language.

* **The Scientific Proof:** In \citeyear{raina2009large}, a team at Stanford led by **Rajat Raina** and **Andrew Ng** published \citetitle{raina2009large}. They demonstrated that off-the-shelf consumer GPUs (like the NVIDIA GeForce GTX 280) could train Deep Belief Networks orders of magnitude faster than multicore CPUs. This paper quantified the "Bitter Lesson": cheap hardware could replace complex algorithmic optimizations.
* **The Practical Proof:** In \citeyear{ciresan2011flexible}, **Dan Cireşan** and **Jürgen Schmidhuber** at IDSIA used this power to push the boundaries of what was possible. Their system, "DanNet," was the first pure GPU-based CNN to win international pattern recognition contests, beating human performance on tasks like traffic sign recognition years before the more famous AlexNet.

This hardware lottery, the fact that AI researchers could piggyback on the massive R&D budget of the gaming industry, is likely the single most important factor in the 21st-century AI boom.

## The Transformer and Attention (\citeyear{vaswani2017attention})
The most significant modern breakthrough was the \citealternativetitle{vaswani2017attention}. By utilizing a mechanism called **Self-Attention**, models could process entire sequences of data in parallel rather than word-by-word. This solved the "vanishing gradient" problem and allowed models to understand long-range context in text. The further text will lead you through every step you need to understand this Self-Attention-Mechanism on a basic level.

In this context, "attention" is a mathematical mechanism for weighting information, not a form of awareness or intent.

The Attention Mechanism will be explained in detail later on.

## The Rise of Generative AI
Today, the focus has shifted to **Large Language Models (LLMs)** like GPT. These models are "pre-trained" on nearly the entire internet to predict the next token in a sequence. By scaling these architectures to billions of parameters, AI has moved from simple classification to generating human-like text, code, and reasoning and even video and music.

What changed since the early days was not the basic ideas, but the availability of data, computing power, and practical training techniques.

\category{history,philosophy,hardware}
## The Great Convergence: From Syllogisms to Silicon

The emergence of ChatGPT represents the "Great Convergence" of a multi-millennial effort to decouple human thought from biology and translate it into formal abstraction. This journey began with **Aristotle’s** syllogisms and was radicalized by **Llull’s** mechanical knowledge wheels and **Leibniz’s** binary alphabet, the idea that all reasoning could be reduced to a series of calculations. From **Babbage and Lovelace’s** "algebraic patterns" to **McCulloch and Pitts’** mathematical neurons, the lineage of AI has always sought to treat thought as a formal calculus.

However, the final transition required more than logic; it required a physical substrate of sufficient scale. As noted in \citetitle{sutton2019bitter}, the "Bitter Lesson" of AI history is that raw computation eventually outpaces human intuition. This was made possible by **Moore’s Law** \cite{mooreslaw} and the revolutionary discovery that the massiv-parallel **SIMD** architecture of **GPUs**, originally forged for the sensory demands of video games, provided the perfect engine for neural matrix operations (\cite{oh2004gpu}, \cite{raina2009large}).



Today’s models are the ultimate synthesis: the combinatorial logic of the ancients finally meeting the brute-force scaling of the modern era. We have reached a point where the machine "weaves" language by calculating billions of vectors across silicon clusters, proving that when enough compute meets enough abstraction, the machine does not just mimic thought, it executes it.


\category{culture}
## The Cultural Mirror: AI in Imagination

The conceptualization of artificial intelligence has always been a dialogue between technical possibility and cultural anxiety. Long before the first line of code was written, the silhouette of the **Maschinenmensch** in \citeauthor{maschinenmensch}'s *Metropolis* (\citeyear{maschinenmensch}) established the archetype of the "artificial other", a metallic reflection of human form that serves as both a marvel of engineering and a vessel for societal fears.

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

Science fiction did not exactly predict modern AI, but it shaped the metaphors and fears through which we still talk about it.

</div>
