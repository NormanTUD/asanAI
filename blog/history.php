<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Brief History of AI
description: From stone tools to computation, the shifting currents that merged into modern AI.
icon: &#128220;
part: 1
order: 2
color: accent
topics: history, philosophy
-->
<!--
TODO https://people.idsia.ch/~juergen/who-invented-backpropagation.html
TODO https://en.wikipedia.org/wiki/History_of_artificial_neural_networks
TODO https://stats.stackexchange.com/questions/530925/history-of-the-term-early-stopping
TODO https://people.idsia.ch/~juergen//who-invented-convolutional-neural-networks-28aug2025.html
-->

<div class="smart-quote" data-cite="processandreality">
“The universe is a process of reaching out into the multi-colored world, and drawing it together into a single, new unity.”
</div>

<div class="md">
The history of AI is not a straight line leading inevitably to the Large Language Model. It is a convergence of ideas from unrelated fields that were never intended to meet. Statistical methods developed by astronomers to map the stars now weigh the next word in a sequence. For example, GPU architectures designed for video games provide the parallel computation required for neural networks, which was never intended for AI use but worked out in the end in favour of it. This document traces the lineage that produced modern LLMs, and tries to check out all paths that lead to it (and where else they lead to).

## The Abstraction of Labor: From Wheels to Thought

<div class="smart-quote" data-cite="wheelerindirection">
<div class="full-quote">We can solve any problem by introducing an extra level of indirection.</div>
<div class="short-quote">Any problem in computer science can be solved by adding another layer of abstraction [except, maybe, having too many abstractions].</div>
</div>

The history of machines is fundamentally a history of **abstraction**, where human effort is “drawn away” (\cite[from latin **abstrahere**]{kleinetymology}, [p. 4]) from the direct task. This began roughly 3.3 million years ago with the \citealternativetitle{lomekwi}, the first stone tools created by ancestors of humans, that later lead to the invention of the wheel, which abstracted the friction of the terrain by placing a rotating interface between the load and the ground. This concept of mechanical mediation was radically advanced by **Heron of Alexandria**, whose “automata” and steam-powered *aeolipile* demonstrated that task sequences could be outsourced to the physical logic of a machine (\citeauthor{livingdolls}, p. 16). By introducing these layers, humans stopped performing the action and began managing the mechanism that performs it.

This trajectory eventually crossed from the physical to the cognitive. As identified by **David Wheeler**, “any problem in computer science can be solved by another layer of abstraction”. Just as the wheel abstracts movement, modern computation abstracts thought, treating reasoning as a formal calculus that can be executed by a machine. Thus, the machine serves as the ultimate “extra level of indirection,” distancing the human from the raw labor of both hand and mind.
</div>





<div class="md">
## Early Math

### Prehistoric Math

#### The Lebombo Bone

<figure>
    <img style="width: 100%" src="lebombo.jpg" alt="Lebombo Bone" />
    <figcaption class="md">\citealternativetitle{lebombobone}, found in the 1970s, is the oldest object that was used for mathematical purposes</figcaption>
</figure>

The Lebombo bone, a baboon fibula discovered by \citeauthor{lebomboboneoriginal} in \citeyear{lebomboboneoriginal} in the Lebombo Mountains of Eswatini and dated to approximately c. 41,000 BCE, represents the earliest known instance of “outsourcing mathematical thought to physical objects”. Featuring 29 distinct notches, the artifact is widely interpreted as a tally stick or lunar calendar, probably used to track the moon's phases or menstrual cycles. As a foundational example of “spatial abstraction,” it serves as a prehistoric precursor to modern computation by mapping abstract numbers onto a physical medium.

It can be thought of as the earliest surviving external mathematical memory of early humans.

#### The Ishango Bone
<figure style="float: right; width: 30%; max-width: 200px; margin: 0 0 1em 1em;">
    <img style="width: 100%; height: auto; display: block;" src="ishango.jpg" alt="Ishango Bone" />
    <figcaption class="md">The \citealternativetitle{ishangobonephoto} is one of the earliest known attempts of outsourcing mathematical thought to physical objects</figcaption>
</figure>

The **Ishango bone** is a Paleolithic artifact discovered in 1950 by Belgian geologist \citeauthor{ishangobone} in what is now the Democratic Republic of the Congo. Dated to approximately **c. 18,000 BCE**, this baboon fibula predates the Sumerian and Babylonian mathematical records by over 15,000 years. It features three columns of grouped notches that exhibit curious mathematical properties, such as a column of prime numbers (11, 13, 17, 19) and groups that sum to 60 or 48, though it is not clear whether the prime numbers are intentional of coincidental.

Researchers have long debated whether the artifact served as a simple tally, a **lunar calendar** as suggested by \citeauthor{marshackishango}, or a more complex mathematical tool. De Heinzelin's original 1957 publication, \citetitle{ishangobone}, introduced the bone to the scientific community, sparking decades of inquiry into the “mathematical Out of Africa” theory. Modern scholars like \citeauthor{ishango12} continue to investigate its potential use as a primitive “slide rule” or evidence of a base-12 counting system, marking it as a critical precursor to later mechanical calculation aids. It could also have been a counting system, where quantities of something have been represented by notches in the bone. It is not clear exactly what it was used for, though.

Ultimately, the Ishango bone represents the most significant archaeological indicator of prehistoric mathematical reasoning, and thus is a *very* early precursor to modern computers and AI systems.

### The Salamis Tablet and the Abacus

<div class="image-row">
	<figure>
		<img src="salamic_table.jpg" alt="The Salamis Tablet" />
		<figcaption>The \citealternativetitle{salamictablet} from ca. 300 BC, the earliest known surviving counting board</figcaption>
	</figure>
	<figure>
		<img src="abacus.jpg" alt="The earliest depiction of an Abacus" />
		<figcaption class="md">\citealternativetitle{earliestabacusphoto} contains the earliest known depiction of an Abacus</figcaption>
	</figure>
</div>

The **Salamis Tablet** (c. 300 BC), discovered in 1846 and preserved at the **Epigraphical Museum in Athens**, is the oldest surviving counting board. It utilized a marble slab with etched lines and pebbles, **calculi**, to execute arithmetic through physical manipulation.

* **Spatial Abstraction:** It represents a foundational “level of indirection,” mapping abstract numbers to physical grid coordinates.
* **Mechanical Logic:** By utilizing a grid for units and tens, it outsourced mental labor to a rule-based physical system, a precursor to algorithmic processing.
* **External Memory:** Like the “Store” in **Babbage's** designs, the slab functioned as an external memory bank for intermediate sums.
* **The “Calculus” Root:** The use of pebbles (*calculi*) illustrates the reduction of reasoning to symbol manipulation, a concept later formalized by **Leibniz** and **Boole**.
* **Evolution of the Abacus:** While the Salamis Tablet was a stationary counting board, it paved the way for the portable **Roman Hand Abacus** and the eventual bead-and-wire **Suanpan** (China) and **Soroban** (Japan). This transition represents the evolution from “loose” hardware (pebbles on a table) to “integrated” hardware (sliding beads), optimizing calculation speed and portability for merchants.

As noted by \citeauthor{salminictablesource} (\citetitle{salminictablesource}, 1899, p. 393f), this device confirms that modern computation began by reducing thought to a formal calculus executed via a physical interface.

## The Roots of Formal Logic

<figure>
    <img style="width: 100%" src="Sanzio_01_Plato_Aristotle.jpg" alt="Ars Magna" />
    <figcaption class="md">\citealternativetitle{aristotleandplato} by \citeauthor{aristotleandplato} (\citeyear{aristotleandplato})</figcaption>
</figure>

While \citeauthor{aristotleanalytics} is the father of formal logic, his work was the culmination of a tradition beginning with **Zeno of Elea** (c. 460 BC). Zeno is often regarded as the first “logician” for his use of *reductio ad absurdum* to defend his paradoxes. This analytical foundation was further refined by the dialectic methods of **Socrates** and the categorization of ideas by **Plato** (see \citetitle{bochenski}, p. 26f). Aristotle wrote about Syllogisms extensively in \citetitle{aristotleanalytics}, *25b 27* - *26a 2*.

Aristotle synthesized these influences to create the **Syllogism**, the first system to decouple an argument's structure from its content:

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

This transition from philosophical dialogue to a rigid logical calculus paved the way for thinkers to treat thought as a form of algebra.

## The Antikythera Mechanism: Ancient Analog Computing

<figure>
    <img style="width: 100%" src="antikythera.jpg" alt="Antikythera Mechanism" />
    <figcaption class="md">\citealternativetitle{antikytheraimage}</figcaption>
</figure>

The \citealternativetitle{antikytherasciam} is an ancient Greek hand-powered orrery, often described as the world's oldest known analog computer. It was used to predict astronomical positions and eclipses for calendar and astrological purposes decades in advance. It could also track the four-year cycle of athletic games, including the ancient Olympic Games.

* **Circumstances:** The device was discovered in 1901 among wreckage retrieved from a shipwreck off the coast of the Greek island Antikythera. It is believed to have been constructed between 200 BC and 60 BC. Following the wreck, the advanced technology required to build such complex geared mechanisms was lost to Western civilization for over a millennium, not reappearing until the development of mechanical astronomical clocks in the 14th century.
* **Technical Sophistication:** It contained at least 30 meshing bronze gears housed in a wooden case covered in inscriptions. These inscriptions acted as a user manual, explaining the cycles of the sun, moon, and at least five planets.
* **Significance:** It proves that the “Computer Era” has roots in mechanical simulation. While Zuse and Aiken used gears or relays for abstract math, the Antikythera mechanism used them to model the physical universe through mechanical ratios.

## The idea that logical thought can be mechanically calculated

### The earliest attempt: \citeauthor{arsmagna}

<figure>
    <img style="width: 100%" src="FigurScheiben.jpg" alt="Ars Magna" />
    <figcaption class="md">Based on earlier ideas (ie. \citetitle{tractatusdespheara}, for displaying astronomical data and inspired by the early-arabic astrological Zairja, as described by \citeauthor{volvelles}), the volvelle by \citeauthor{arsmagnavolvelle}, released in \citeyear{arsmagnavolvelle} was perhaps the first attempt to create combinations of <i>ideas</i> mechanically, and therefore, a precursor to the idea of artificial intelligence, where a physical device can calculate answers through logical means</figcaption>
</figure>

Long before silicon chips, the 13th-century Majorcan mystic \citeauthor{arsmagna} attempted to mechanize thought itself. In his seminal work \citealternativetitle{arsmagna}, he designed a system of rotating, concentric paper circles inscribed with letters representing fundamental philosophical and theological concepts. By turning these wheels, one could generate every logically possible combination of ideas.

While it looks like a curious mix of mysticism and combinatorics, it is the first documented attempt to create a universal logical language that generates new knowledge through mechanical operations. Llull believed that systematically combining symbols could “calculate” truth, a direct ancestor of the symbol-manipulation view of intelligence. A Transformer's billions of vector operations are the same principle at an unimaginable scale.

A complete guide on how to use the Llullian **Volvelle** as intended by Llull can be found in \cite[Collins, 2017]{artandlogicofllull}.

Medieval scholar Ramon Llull had quite an interesting life, and has done many things. One of the earliest novels in medieval Europe after antiquity, \citetitle{blanquerna}, was by him: it was about the rise of a monk to the ranks of the pope. He was also the only person whose works were condemned as heretical by one pope (Gregor XI.), \cite[yet whose legacy was later honored by another]{arsmagnavolvelle} (Pius IX.).

Eight centuries later, a \citeyear{zhao2025thinkingmachine} paper \cite{zhao2025thinkingmachine} directly reconstructed Llull's thinking machine for the age of large language models. By mining three compositional axes, Theme, Domain, and Method, from conference papers and combining them via templates inspired by Llull's combinatorial wheels, the authors built a pipeline that generates diverse, grounded research ideas automatically. This modern incarnation demonstrates that Llull's fundamental insight, that new knowledge can be produced through systematic symbolic recombination, remains productive even in the era of deep learning.

The work of \citeauthor{arsmagna} inspired \citeauthor{leibniz1686calculus} with the philosophical conviction that human reason itself is a form of computation. In his \citeyear{leibniz1686calculus} work \citetitle{leibniz1686calculus}, Leibniz proposed a universal logical language that would reduce all human reasoning to a series of calculations. 

### Gottfried Wilhelm Leibniz 

<div class="smart-quote" data-cite="leibniz1686calculus">
    <div class="full-quote">
	If controversies were to arise, there would be no more need of disputation between two philosophers than between two accountants. For it would suffice to take their pencils in their hands, to sit down to their slates, and to say to each other: Let us calculate! (Calculemus!)
</div>

    <div class="short-quote">Let us calculate! (Calculemus!)</div>
</div>

<figure>
    <img style="width: 100%" src="Leibnizrechenmaschine.jpg" alt="Rechenmaschine by Leibniz" />
    <figcaption class="md">\citealternativetitle{leibnizcc}, invented in 1672 and built in 1700, is the first mechanical working automatic calculation machine</figcaption>
</figure>

Leibniz's vision was revolutionary: he sought to mechanize thought by creating a symbolic system
where every concept was represented by a unique number, allowing complex arguments to be
resolved with the same algebraic certainty as a math problem. This “Mathesis Universalis”
represents the true birth of the mechanical philosophy that underpins AI. Crucially, Leibniz
also formalized the binary system, reducing all mathematical logic to the interplay of 0 and 1,
providing the literal alphabet for the digital age. It shifted the quest for intelligence from
the mystical to the mathematical, providing the logical foundation that would eventually be
realized in \citealternativetitle{turing1950computing}.

### The Physical Manifestation: Babbage's Analytical Engine

<figure>
    <img style="width: 100%" src="babbage.jpg" alt="Ars Magna" />
    <figcaption class="md">\citealternativetitle{babbage}</figcaption>
</figure>

The transition from Leibniz's theoretical calculus to physical machinery found its most ambitious expression in the work of **Charles Babbage**. Moving beyond his earlier Difference Engine, Babbage conceived of the **Analytical Engine** (c. 1837), a machine that mirrored the architecture of modern computers nearly a century before the electronic age. 

The Engine was designed to be powered by steam and constructed from brass and iron. Most importantly, it separated the “Store” (memory) from the “Mill” (the central processing unit). Babbage realized that for a machine to be truly universal, it needed to be programmable via punched cards, a technique borrowed from the Jacquard loom. This allowed the machine to perform different tasks without physical reconfiguration, effectively decoupling the hardware from the logical “software” it executed.

#### Ada Lovelace: The First Software Architect

While Babbage focused on the mechanical engineering, **Ada Lovelace** provided the conceptual breakthrough that transformed the Engine from a calculator into a computer. In her 1843 “Notes,” she recognized that the Engine's ability to manipulate symbols according to rules meant it could process anything from music to scientific logic.

Lovelace authored what is recognized as the first complex algorithm intended for a machine: a method for calculating **Bernoulli numbers**. She broke the calculation down into a series of iterative steps, anticipating the concept of the “loop”.

Lovelace's genius lay in her understanding of the “Science of Operations.” She saw that the hardware was merely a vessel for the logic, famously stating that the Analytical Engine “weaves algebraic patterns just as the Jacquard-loom weaves flowers and leaves” (\citetitle{lovelacequote}).

### The Algebra of Reason: George Boole's Binary Breakthrough

\citeauthor{bool1854} achieved what Leibniz had only dreamed of: a formal calculus of the mind. In \citetitle{bool1854}, he reduced Aristotelian logic to algebraic equations, treating truth and falsity as binary variables. This is why `true`/`false` types are still called **booleans**.

### Konrad Zuse: The Engineer

<div class="smart-quote" data-cite="zusetoolazy" data-page=62>
I was too lazy to calculate by hand.
</div>

<figure>
    <img style="width: 100%" src="zuse.jpg" alt="Zuses Z1" />
    <figcaption class="md">\citealternativetitle{zusez1}, the first fully automatic programmable Computer, completed in 1938</figcaption>
</figure>

\citeauthor{zusebook}, a civil engineer tired of manual arithmetic, spent 1936 to 1945 building the first binary computers in his parents' Berlin living room. His Z-series evolved from the mechanical **Z1**, which used sliding metal plates but suffered from frequent jams, to the **Z3** (1941), the world's first functional, programmable, and fully automatic digital computer. By switching from mechanical parts to 2,000 electromagnetic telephone relays, Zuse proved that binary electricity was the future of calculation. He even pioneered the first high-level programming language, **Plankalkül**, while hiding his **Z4** model in the Alps to survive WWII, eventually launching the world's first commercial computer company (\citetitle{zusebook}, p. 72ff, 156ff).

Zuse did not directly work on modern AI systems, but together with people like Aiken, based on earlier ideas of Leibniz, Babbage, Llull, and, in parts, of Aristotle, he helped to create the *hardware* AI can run on.
</div>

<div class="optional md" data-headline="Prerequisite for artificial Neurons: the discovery of the natural neuron">
The foundation of AI rests upon the *Neuron Doctrine*, established by the Spanish neuroanatomist \citeauthor{cajaltextura}. Working in the late 19th century, he used specialized staining techniques to prove that the brain was composed of discrete, individual cells rather than a continuous web, a concept known as the Reticular Theory. His discovery that neurons are the fundamental signaling units of the nervous system earned him the *Nobel Prize in Physiology or Medicine* in 1906.

This shift provided the physical blueprint that would later be digitized into the first artificial neural models.
</div>

<div class="md">
## Frege & Russell: The Longing for Determinism

With \citeauthor{uebersinnundbedeutung} and his work \citetitle{uebersinnundbedeutung}, the project of distilling natural language through the sieve of formal logic began. He created the foundation of analytic philosophy: the conviction that thinking is the manipulation of logical symbols.

This “Symbolic AI” dominated the field for nearly forty years. It was believed that if we provided the machine with enough “if-then” rules and logical predicates, intelligence would emerge. LLMs are the radical antithesis to this dream: they prove that “sense” (in \citeauthor{uebersinnundbedeutung}'s Meaning) can be simulated through statistical association without ever explicitly defining a single logical rule.

## The earliest roots of modern AI

### The First Practical AI (1914)

<figure>
    <img style="width: 100%" src="gonzalo.jpg" alt="Gonzalo showing El Ajedrecista to Norbert Wiener" />
    <figcaption class="md">The \citealternativetitle{wienerajedrecista}, a chess playing machine first demonstrated in 1914, invented by Leonardo Torres Quevedo.</figcaption>
</figure>

Before the term “Artificial Intelligence” existed, the Spanish engineer \citeauthor{torres1914} built the first working AI system: **El Ajedrecista**, an electromechanical chess endgame player capable of automatically checkmating a human opponent with king and rook against king \cite{torres1914}. Back then, chess was considered an activity restricted to the realm of intelligent creatures. Torres Quevedo wanted to redefine what we mean by “thinking,” demonstrating that machines could make choices from a complex set of relational possibilities without human intervention \cite{ieeespectrum2023chess}.

The machine's sensing system used a chessboard where each of the 64 squares consisted of three metallic pieces separated by insulating material: a circular central piece connected to the positive terminal and two triangular side pieces connected to horizontal and vertical conductors. The black king's silver mesh base closed two electrical circuits upon placement, driving sliding bars to positions encoding its coordinates; four additional bars tracked the white pieces similarly. The decision logic, implemented via battery-driven relays in a tree structure, partitioned the board into three zones (left: a–c files; center: d–e files; right: f–h files) and selected one of six operations based on the relative positions of the pieces, whether the black king shared a zone with the rook, the vertical distance between pieces, and the parity of horizontal separation \cite{torres1914}. Actuation was achieved through eight electro-mechanical actuators using a disc-and-pawl mechanism: when an electromagnet released the pawl, one full disc rotation executed a mechanical “microprogram” for a specific piece movement. In the upgraded 1920 version, electromagnets concealed beneath an ordinary chessboard moved the white pieces, and a gramophone announced *jaque al rey* (check) or *mate* (checkmate). If the opponent made three illegal moves, the machine shut down \cite{ieeespectrum2023chess}.

While the algorithm was suboptimal, it guaranteed checkmate in fewer than 63 moves against any defense \cite{ieeespectrum2023chess}. The machine was still considered impressive decades later when AI pioneer Norbert Wiener played against it at the 1951 Paris conference on calculating machines and human thought \cite{torres1914} \cite{ieeespectrum2023chess}.

### The formalization of Neurons

<div class="optional md" data-headline="The First Mathematical Neuron: Lapicque's Integrate-and-Fire Model (1907)">
<figure style="float: right; width: 22%; max-width: 160px; margin: 0 0 1em 1em;">
    <img style="width: 100%; height: auto; display: block;" src="lapicque.jpg" alt="Louis Lapicque" />
    <figcaption class="md">Louis Lapicque, 1866–1952</figcaption>
</figure>

The mathematical birth of the neuron model predates McCulloch and Pitts by 36 years. In \citeyear{lapicque1907}, French neuroscientist \citeauthor{lapicque1907} published \citealternativetitle{lapicque1907}, the paper that introduced what we now call the **integrate-and-fire** neuron. Working at the Sorbonne, Lapicque replaced the messy biophysics of the nerve membrane with the simplest possible electrical analogue: a parallel capacitor–resistor circuit representing the membrane's capacitance and leakage resistance, charged by an input current until its voltage crosses a fixed threshold, at which point a “spike” is emitted and the capacitor discharges back to rest. In modern notation, the non-leaky form he wrote down is

$$ I(t) = C \,\frac{dV(t)}{dt}, \qquad V(t) \;\mapsto\; V_\text{rest} \;\;\text{whenever}\;\; V(t) \geq V_\text{th}, $$

and the **leaky** variant he added later, $C\,\dot V = I(t) - V/R$, is essentially the equation that, more than a century on, still powers large-scale spiking neural network simulations. With this model Lapicque computed the firing frequency of a nerve fiber resistively coupled to a stimulating electrode held at fixed voltage, a calculation that \citeauthor{abbott1999lapicque}, writing in \citeyear{abbott1999lapicque} \cite{abbott1999lapicque}, calls a “remarkable achievement” given that it was made long before the mechanisms responsible for action-potential generation were known. The achievement, Abbott argues, “stresses that, in neural modeling, studies of function do not necessarily require an understanding of mechanism”: significant progress is possible if a phenomenon is adequately described, even if its biophysical basis cannot yet be modeled. He further notes that the model's enduring utility comes from the **separation of time scales** between the extremely rapid action potential and the slower processes, synaptic integration, bursting, and adaptation, so that today one avoids recomputing the voltage trajectory during a spike and concentrates instead on the computation-relevant dynamics. Even with Hodgkin and Huxley's 1952 conductance-based models available, the simple integrate-and-fire cell remains adequate for many purposes and has been used in simulations of networks containing hundreds of thousands of neurons; Abbott observed at the close of the twentieth century that “the utility of this model, devised early in the 20th century, is likely to last well into the 21st” \cite{abbott1999lapicque}. So strictly speaking, the often-cited McCulloch-Pitts cell of 1943 is *not* the first artificial neuron; it is the first **logical** one. Lapicque's integrate-and-fire came first, and is still the workhorse of modern spiking networks.
</div>

<div class="optional md" data-headline="The First Recurrent Network Architecture: The Lenz-Ising Model (1920-25)">
Long before digital computers existed, physicists \citeauthor{lenz1920} and his student \citeauthor{ising1925} introduced what is now recognized as the first <b>recurrent neural network architecture</b>. The Ising model describes a lattice of nodes (spins) with feedback connections, where each node influences its neighbors, and the system settles into an equilibrium state in response to input conditions. While it was designed to model ferromagnetism, not computation, its mathematical structure is identical to that of later associative memory networks. In \citeyear{amari1972}, \citeauthor{amari1972} made this recurrent architecture <b>adaptive</b>, enabling it to learn to associate input patterns with output patterns by changing its connection weights, creating the first published learning recurrent neural network. Ten years later, the basic equations of Amari's network were republished and its storage capacity analyzed under the name “Hopfield Network.”
</div>

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

The mathematical birth of Artificial Intelligence did not start with silicon or vacuum tubes, but with the realization that biological processes could be described as logical calculi. Strictly speaking, the very first formal neuron model was \citeauthor{lapicque1907}'s integrate-and-fire cell of \citeyear{lapicque1907} (see the aside above); the work of \citeauthor{mccullochpitts1943} that follows is the first **logical** neuron, which is what most histories of AI mean when they speak of “the first artificial neuron.” Before \citeauthorlastnameand{darthmouthartificialintelligence} even named the field, neurophysiologist and neuroscientist team of \citeauthor{mccullochpitts1943} laid the very bedrock foundation for modern AI in their seminal work \citetitle{mccullochpitts1943}. They based their research on the research of \citeauthor{steadystates}, who they extensively cited in their first paper \citetitle{pittsfirstpaper}, in which Pitts demonstrated how circular chains of neurons mathematically settle into predictable firing patterns or constant inactivity based on their connection strengths, proving neurons are not just some biological mess, but a logical, deterministical machine.

They proved that a simplified model of a biological neuron, often called the **McCulloch-Pitts cell**, could perform complex logical operations. Such a neuron computes a weighted sum of its inputs $x_i$ and “fires” if it exceeds a threshold $\theta$:

$$y = \begin{cases} 1 & \text{if } \sum_{i=1}^{n} w_i x_i \geq \theta \\ 0 & \text{otherwise} \end{cases}$$

This breakthrough allowed the brain to be viewed not just as a mysterious organ, but as a computational engine. Parallel to this, \citeauthor{wiener1948cybernetics} defined the field of **\citealternativetitle{wiener1948cybernetics}** in \citeyear{wiener1948cybernetics}. Wiener recognized that both machines and living organisms operate on principles of feedback loops and information transmission. This synthesis of biology, logic, and engineering provided the fertile soil from which modern AI would eventually grow.

This was the conceptual shift from “calculating machines” to the idea that cognition itself might be formalized (see the work of \citeauthor{piccini} for more details).

### The SNARC: The First Physical Neural Network (1951)
</div>

<figure class="md">
    <img style="width: 100%" src="snarc.jpg" alt="SNARC" />
    <figcaption class="md">\citealternativetitle{snarcphoto}</figcaption>
</figure>

<div class="md">
Built by **Marvin Minsky** and **Dean Edmonds** in 1951, the **SNARC** (Stochastic Neural Analog Reinforcement Calculator) was the world's first physical artificial neural network. Inspired directly by the theoretical logic calculus of \citeauthorlastnameand{mccullochpitts1943} (\citeyear{mccullochpitts1943}), the SNARC translated abstract mathematical neurons into stochastic, learning hardware. It consisted of a randomly connected network of 40 artificial neurons constructed from vacuum tubes, salvaged B-24 bomber gyropilots, and magnetic clutches, designed to simulate a rat learning to navigate a virtual maze.

Rather than relying on explicit programming, the machine learned via mechanical reinforcement. When the network made a random but “correct” move, a reinforcement signal engaged the clutches to turn potentiometers, physically altering the electrical resistance of the active connections. This increased the probability that those specific, successful pathways would fire again. By mechanically formalizing trial-and-error learning, concepts Minsky later detailed in his Princeton dissertation, *\citetitle{minsky1954}* (\citeyear{minsky1954}), the SNARC proved that a decentralized network of McCulloch-Pitts cells could autonomously calculate behavioral adaptation.

## Further developments of Computer Hardware and Computing Theory

### Howard Aiken & The Harvard Mark I (1944)

<figure>
    <img style="width: 100%" src="aiken.jpg" alt="Howard Aiken" />
    <figcaption class="md">\citealternativetitle{aikenphoto}, officially named as Automatic Sequence Controlled Calculator</figcaption>
</figure>

Inspired by Babbage's Analytical Engine, Aiken designed the **ASCC (Mark I)**. While Zuse used binary, Aiken stuck to **decimal** wheels. It was a massive, 50-foot long mechanical beast synchronized by a long rotating shaft.
* **Significance:** It was the first large-scale automatic digital computer in the USA. He described it first in \citetitle{aiken} in \citeyear{aiken}.

### John von Neumann & The Stored-Program Concept (1945)
Before von Neumann, computers like the ENIAC had to be physically rewired to change tasks. His \citetitle{vonneumann} proposed the **Von Neumann Architecture**.

One of his **Big Ideas** for **Computing**: Data and instructions are stored in the same memory. This allowed the computer to be “reprogrammed” via software rather than hardware switches.

### Alan Turing: Theory and the Universal Machine (1936-1950)

<figure>
    <img style="width: 100%" src="turing.jpg" alt="Alan Turing" />
    <figcaption class="md">\citetitle{turingimage}, c. 1930</figcaption>
</figure>

\citeauthor{turing1937} provided the mathematical proof for what a computer *could* do.
* **Turing Machine (1937):** A theoretical model showing that a simple machine reading symbols on a tape could simulate any algorithmic logic.
* **ACE & Enigma:** Beyond theory, he designed the Automatic Computing Engine (ACE) and led the cryptanalysis at Bletchley Park using the “Bombe.”

### The Imitation Game

Before the term “Artificial Intelligence” even existed, **Alan Turing** laid the philosophical groundwork in \citeyear{turing1950computing} with his paper *\citetitle{turing1950computing}*.
<div class="smart-quote" data-cite="turing1950computing" data-page=1>
I propose to consider the question, 'Can machines think?'
</div>

Turing argued that defining “thinking” was too ambiguous. Instead, he proposed the **Imitation Game** (now known as the Turing Test), a practical standard where a computer is considered intelligent if it can converse indistinguishably from a human. This shifted the goal of AI from replicating biological mechanics to replicating observable behavior.

### IBM 702: The First Commercial Business Computer (1953)

<figure>
    <img style="width: 100%" src="1280px-BRL61-IBM_702.jpg" alt="IBM 702 system" />
    <figcaption class="md">\citealternativetitle{ibm702image}</figcaption>
</figure>

The \citealternativetitle{ibm702} (\citeyear{ibm702}) was IBM's first commercial electronic computer aimed at business data processing, and a direct response to Remington Rand's UNIVAC. It introduced **magnetic-core memory** for random-access applications and weighted roughly 24,645 pounds. The memory was character-oriented, Williams-tube based (later retrofitted to core), with capacities ranging from 2,000 to 10,000 characters \cite{ibm702}.

### The Personal Computer: Ed Roberts and the Altair 8800 (1974-1975)

While MIT, Bell Labs, and IBM were building million-dollar mainframes, an Air Force veteran named **Henry Edward “Ed” Roberts** (\citeauthor{edroberts}, 1941–2010), running a small kit company called **MITS** out of Albuquerque, was rebuilding his calculator business after a brutal price war with Texas Instruments had driven it into 300,000 US Dollar of debt. The result, the **\citealternativetitle{altair8800}** (\citeyear{altair8800}), was the first commercially successful personal computer: a 397 US Dollar mail-order kit based on the new Intel 8080 microprocessor, featured on the cover of the January 1975 issue of *Popular Electronics* \cite{edroberts}. Roberts is most often remembered as “[the father of the personal computer](https://en.wikipedia.org/wiki/List_of_people_considered_father_or_mother_of_a_field#Computing)” \cite{edroberts_bbc}.

What the Altair lacked (no keyboard, no display, no operating system, programs entered by toggle switches) was less important than what it started: an industry. \citeauthor{historyofpc} documents how the Altair spawned the **S-100 bus clone industry** (including the IMSAI 8080), the **Homebrew Computer Club**, and ultimately the founding of **Microsoft** when **Bill Gates** and **Paul Allen** wrote **Altair BASIC** \cite{historyofpc} as the company's first product.

For competing claims to the title “father of the personal computer,” \citeauthor{historyofpc} lists:
* **Chuck Peddle**, designed the **MOS 6502** microprocessor, the **KIM-1**, and the **Commodore PET** (\citeyear{commodorepet}), the cheapest of the famous “1977 Trinity” \cite{chuckpeddle} \cite{mos6502}.
* **André Truong Trong Thi**, co-created the **Micral N** (\citeyear{micral}), one of the earliest microcomputers (1972) \cite{historyofpc}.

### VisiCalc and the Killer App (1979)

In 1979, **Dan Bricklin** watched a Harvard Business School professor erase and redraw an entire spreadsheet on the blackboard after changing a single number. Bricklin's \citealternativetitle{visicalc} (\citeyear{visicalc}) automated exactly that: a “killer app” that, by being Apple-II-exclusive for its first year, is credited with single-handedly selling the Apple II to the business market \cite{visicalc} \cite{historyofpc}. It is widely considered the first “killer application” in computer history.

### The IBM PC (1981)

Released August 12, 1981, the **IBM PC** used the Intel 8088 CPU and Microsoft-supplied **PC-DOS** (later **MS-DOS**), since IBM's negotiations with Digital Research for CP/M had failed \cite{ibmpc} \cite{historyofpc}. IBM's failure to patent the BIOS led, via clean-room reverse engineering, to a clone industry that ultimately overwhelmed IBM itself, establishing the Wintel architecture as the dominant PC standard for decades.

## The term “Artificial Intelligence”

The term “Artificial Intelligence” was coined in \citeyear{darthmouthartificialintelligence} when **John McCarthy**, along with Marvin Minsky, Nathaniel Rochester, and Claude Shannon, submitted a proposal for the \citealternativetitle{darthmouthartificialintelligence}. The workshop was founded on the conjecture that “every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it,” marking the official birth of the field.

### The First AI Programs (1956)

The Dartmouth workshop catalyzed the first wave of AI programs. **Allen Newell**, **John Cliff Shaw**, and **Herbert A. Simon** presented the **Logic Theorist** (LT), a program that could prove symbolic logic theorems by searching a space of possible proof steps. LT successfully proved 38 of the first 52 theorems in the second chapter of Whitehead and Russell's *\citetitle{russell1910principia}* \cite{newell1956logictheorist}, and even discovered a proof for one theorem that was shorter than the one in the original text. This was the first program to deliberately separate human problem-solving into manipulable symbolic representations, establishing the “physical symbol system” hypothesis that would dominate AI for decades.

Around the same time, **Arthur Samuel** at IBM developed a **checker-playing program** that learned through self-play using what we now recognize as **reinforcement learning**. The program evaluated board positions through a weighted sum of features (piece advantage, center control, etc.) and adjusted these weights based on game outcomes, improving over time until it could play at an intermediate level, better than its own creator \cite{samuel1959checkers}. Samuel's work demonstrated that a machine could improve its performance through experience, a foundational principle of modern machine learning.

### The Symbolic Path: Newell and Simon's General Problem Solver

Building on the Logic Theorist, Newell and Simon released the **General Problem Solver (GPS)** in 1957, designed to mimic the problem-solving protocols of the human brain through “means-ends analysis” \cite{newell1957gps}. GPS could solve a range of well-defined tasks, from proving logical theorems to solving puzzles, by recursively decomposing the difference between the current state and the goal state into subgoals. While limited to “toy” problems, GPS embodied the “thinking humanly” approach and remained influential for decades.

<div class="optional md" data-headline="The internal split of Symbolic AI: Neats vs Scruffies">
A \citeyear{poirier2025neat} historical study \cite{poirier2025neat} shows that the Symbolic AI program was never unified to begin with. From the 1960s through the 1990s, knowledge-representation researchers sorted themselves into two camps that Poirier traces back to a methodological, then an aesthetic, opposition. The **logicists** (“neats”) gathered around \citeauthor{uebersinnundbedeutung} at Stanford and pursued McCarthy's program of expressing everyday knowledge in formal, declarative logic and drawing conclusions by predicate calculus. The **proceduralists** (“scruffies”) gathered around Minsky at MIT and were willing to tolerate paradox, hand-coded heuristics, and incomplete representations in exchange for systems that actually worked on messy problems. Patrick Hayes, interviewed by Poirier, summarizes the split bluntly: the classical line-up was Minsky versus McCarthy, and he adds that this is very much an oversimplification. Minsky's 1974 paper “A Framework for Representing Knowledge,” which introduced **frames** as stereotyped data structures, was the scruffy camp's counter-move to pure logic. By the 1990s most knowledge architects concluded both approaches were necessary, but by then the field had spent two decades unable to deliver commonsense reasoning, and the resulting loss of confidence, not the Perceptrons book alone, is what tipped AI into its first winter. The neat/scruffy split is also why the Minsky who co-authored the devastating critique of perceptrons was *not*, in this earlier frame, an enemy of neural networks; he was the champion of the *procedural* wing of symbolic AI against McCarthy's *logicist* wing.
</div>

## The Beginning of Artificial Neural Networks

<figure>
	<img style="max-width: 100%" src="FrankRosenblattWiringPerceptron.jpg" alt="Perceptron Wiring" />
	<figcaption>\citetitle{perceptronimagewiring}</figcaption>
</figure>

<div class="smart-quote" data-cite="hebb1949organizationofbehaviour" data-page=62>
<div class="full-quote">When an axon of cell A is near enough to excite a cell B and repeatedly or persistently takes part in firing it [...] some growth process or metabolic change takes place in one or both cells such that A's efficiency, as one of the cells firing B, is increased.</div>
<div class="short-quote">What wires together, fires together</div>
</div>

In his \citeyear{bain} work \citetitle{bain}, \citeauthor{bain} proposed the concept of Neural Groupings (p. 89ff) to explain how the brain physically organizes complex thoughts and coordinated movements. Bain was a pioneer in “Association Psychology,” and he sought to bridge the gap between abstract mental associations and biological structures. He argued that when we learn a new skill or memorize a sequence, specific clusters of neurons, or “groupings”, become structurally linked through repeated stimulation. These groupings allow the brain to trigger a complex “aggregate” of actions or ideas through a single nervous impulse, essentially laying the groundwork for what modern neuroscience would eventually call **Hebbian Theory**.

Based on the \citealternativetitle{hebb1949organizationofbehaviour}, idea of the canadian psychology professor \citeauthor{hebb1949organizationofbehaviour} published that neurons in the brain get a stronger connection to each other when they often fire together, which is often expressed as “neurons that fire together, wire together”, and the idea of neurons proposed by \citeauthorlastnameand{mccullochpitts1943}, in \citeyear{rosenblatt1958perceptron}, **\citeauthor{rosenblatt1958perceptron}** introduced the **Perceptron**, the biological-inspired ancestor of the modern neuron. Shifting away from rigid symbolic logic, he proposed a system that could “learn” by automatically adjusting its weights in response to errors. This marked a pivotal transition from hard-coded programming to the foundational principles of machine learning.

<figure>
	<img style="max-width: 100%" src="rosenblatt_ad.png" alt="Perceptron" />
	<figcaption>\citetitle{rosenblattad}</figcaption>
</figure>

This project was funded by the *Office of Naval Research*, under the codename *Project Para*, first written about by \citeauthor{rosenblattperceptron} in \citeyear{rosenblattperceptron}.

<div class="image-row">
	<figure>
		<img src="Mark_I_perceptron.jpeg" alt="Mark I Perceptron Cables" />
		<figcaption>\citetitle{perceptronimagecables}</figcaption>
	</figure>
	<figure>
		<img src="perceptron2.jpg" alt="Perceptron Detection" />
		<figcaption>\citealternativetitle{perceptronimagedetection} detecting letters, showing engineer Perceptron project engineer Charles Wightman</figcaption>
	</figure>
</div>

His physical implementation, the **Mark I Perceptron**, was a massive hardware system at Cornell University that used electric motors to turn potentiometers (the “weights”). While limited to learning simple linear relationships, a constraint that eventually contributed to the first AI Winter, it established the fundamental architecture of weighted inputs and thresholds that powers every neural network today.

<div class="optional md" data-headline="An eyewitness account of building the Mark I">
A \citeyear{jensen2026perceptron} \cite{jensen2026perceptron} by the historian George Osborn Jensen and the Smithsonian curator David E. Dunning reconstructs the Mark I from the perspective of Thomas Osborn, a Cornell undergraduate hired as a “worker bee” at the Cornell Aeronautical Laboratory in Buffalo to solder its six-foot racks in the fall of 1959. The architecture mapped a 20×20 grid of photocell “S-units” onto **512** association units, whose connections were generated as genuinely random numbers on CAL's IBM 704 and then wired by hand. Each A-unit's output passed through a motor-driven potentiometer whose wiper voltage could swing continuously between −11 and +11 V, so “between zero and one there was any number in-between”: the “memory” of the machine was literally the angle of 512 little motors, updated automatically by the feedback loop. The single most striking finding from the testing phase was empirical: introducing a deliberate rate of **forgetting** (resistors allowed to decay slightly between iterations) dramatically sped up learning by preventing the network from overfitting idiosyncrasies of the first few examples, an early, hardware-level instance of what would later be formalized as weight decay. The Mark I never served its intended Pentagon mission of spotting Soviet missile sites from aerial photographs, but Osborn could train it to around 90–95% accuracy on letter recognition, and the team agreed it had done “what it said it was going to do.” After Osborn left Buffalo, “no one said one word to me about it”; he went on to become a quantum physicist at the University of Manitoba, a quiet reminder that landmark devices are also the product of anonymous assembly work.
</div>

<div class="optional md" data-headline="Why the perceptron was always meant to be strange">
A \citeyear{lindquist2026weirdai} \cite{lindquist2026weirdai} in the same “Think Piece” department argues that midcentury neural-AI architects (Rosenblatt, then Rumelhart, Hinton, McClelland and the PDP group in the 1980s) deliberately engineered **nonrationality** into their machines rather than stumbling onto it. Lindquist reads the perceptron, and later PDP, as part of a Romantic countercurrent inside computing, a refusal to reduce thought to logical manipulation. In the original \citeyear{darthmouthartificialintelligence} proposal, IBM engineer **Nathaniel Rochester** himself argued that introducing randomness into neural networks could foster originality, comparing the effect to dreaming or intoxication. When Minsky and Papert wrote in \citetitle{minskyperceptrons} that perceptron work was “romantic,” they meant it as a *critique*; the PDP community later wore the label as a badge of pride. What we now dismiss as LLM “hallucinations,” Lindquist points out, is essentially the same property midcentury researchers deliberately prized: outputs landing in the thin tails of the probability distribution, the unreliability from which surprising new associations were supposed to emerge. Modern accounts that frame today's neural nets as a product of “big data and GPUs” alone miss that the original appeal of the architecture was never just pattern-matching; it was a wager that a machine which occasionally did the unexpected could be more useful than one which never did.
</div>

<figure style="float: right; width: 45%; max-width: 300px; margin: 0 0 1em 1em;">
    <img style="width: 100%; height: auto; display: block;" src="navy.png" alt="New York Times article about the Perceptron" />
    <figcaption class="md">\citealternativetitle{newyorktimesperceptron}, \citeyear{newyorktimesperceptron}</figcaption>
</figure>

Rosenblatt's \cite[Mark I Perceptron]{perceptronresults} (p. 136) achieved up to 100% accuracy on binary classification tasks like shape and letter recognition using single-layer architectures of 500 to 1,000 neurons. Across various experiments, it processed training sets of 20 to 10,000 images, maintaining high performance (80%–100%) despite variations in position and rotation (\cite{rosenblattperceptronresults}).

While this system shared the structural logic of a modern neural network, it functioned strictly as a **linear transducer** by executing the affine transformation $f(x) = Ax + b$. Although it utilized tensors for weights ($A$) and biases ($b$), it lacked the **non-linear activation functions** and **backpropagation** required to be classified as a modern “Dense” network. Without non-linearity, any attempt at adding “depth” was mathematically redundant, as multiple linear layers simply collapse into a single equivalent matrix multiplication; furthermore, the system lacked the modern ecosystem of loss functions, regularization, and gradient-based optimization that allows for automated learning.

### The Hidden Connection: Hebb's Rule and the Perceptron Learning Rule

The Perceptron learning rule $\Delta w = \eta \cdot (\text{target} - \text{output}) \cdot \text{input}$ is not a fundamentally new idea, it is Hebb's rule made precise by adding an error signal.

Hebb's rule states: “Neurons that fire together, wire together.” The weight between two neurons increases when they activate simultaneously. This is an unsupervised, purely correlation-based rule, it strengthens connections regardless of whether the result is correct or not.

Rosenblatt's Perceptron learning rule takes the same biological intuition but adds a critical component: **error correction**. When the output matches the target, $\Delta w = 0$, no change occurs, just as Hebb would predict (the firing pattern is consistent, so no adjustment is needed). But when there is an error, the weight changes in proportion to the input, scaled by the learning rate $\eta$:

$$\Delta w = \eta \cdot (\underbrace{\text{target} - \text{output}}_{\text{error signal}}) \cdot \underbrace{\text{input}}_{\text{Hebb term}}$$

Rosenblatt did not invent a new biological principle; he gave Hebb's intuitive idea a mathematical error-correction mechanism.

This connection foreshadows a deeper pattern in deep learning: nearly every major advance can be understood as taking a simple, intuitive principle (correlation, smoothness, sparsity) and making it differentiable. Hebb's correlation becomes the Perceptron; the smoothness prior becomes weight decay; sparsity becomes ReLU.

These early neural networks were extremely limited by today's standards, but they introduced the core idea of learning from data rather than hard-coded rules. This is called *connectionist approach*, instead of the *symbolic approach*. In the *symbol approach*, like the *Rechenmaschine* by Leibniz, the rules are all set from the beginning on. In connectionist approaches, the rules are not set by humans, but trained on by data. Modern LLMs are connectionist rather than symbolic.

### The Perceptron and the First AI Winter

#### The Hype (1958)

When Frank Rosenblatt introduced the \citealternativetitle{rosenblattperceptron}, it was hailed by the \citealternativetitle{newyorktimesperceptron} as the beginning of a machine that would eventually be able to walk, talk, and think like humans, and even translate languages. Most of Rosenblatt's predictions were surprisingly accurate.

Between the invention of the Perceptron in 1958 and the release of ChatGPT, were 64 years of development, until all Rosenblatt envisioned became true. As such, this is a case of a \citealternativetitle{sleepingbeauty} invention.

### The First Deep Learning (1965)

While the Anglosphere was still debating the limitations of single-layer perceptrons, deep learning was already being born in the Soviet Union. In \citeyear{ivakhnenko1965}, \citeauthorlastnameand{ivakhnenko1965} published the first general, working learning algorithms for deep multi-layer perceptrons with arbitrarily many hidden layers. Their method, known as the **Group Method of Data Handling (GMDH)**, incrementally grew and trained layers using regression analysis, pruning superfluous units via regularization on a separate validation set. By \citeyear{ivakhnenko1971}, Ivakhnenko described a deep learning network with **8 layers**, trained when compute was millions of times more expensive than today. Their networks learned hierarchical, distributed internal representations of incoming data, two decades before the term “connectionism” became fashionable in the 1980s. This work remained highly cited and popular well into the new millennium, especially in Eastern Europe, yet was largely overlooked in Anglophone accounts of AI history.

### Deep Learning by Stochastic Gradient Descent (1967-68)

Two years after Ivakhnenko's layer-by-layer approach (so around 1967), \citeauthor{adaptivepattern} proposed training multi-layer perceptrons with many layers in end-to-end fashion using stochastic gradient descent (SGD). His student Saito implemented this in a **five-layer MLP with two modifiable layers**, which learned internal representations to classify non-linearly separable pattern classes, demonstrating that hidden units could discover useful features without explicit human engineering. This was achieved when compute was billions of times more expensive than today, and predates the popularization of backpropagation by nearly two decades.

<div class="optional md" data-headline="The 1990-91 Annus Mirabilis at TU Munich">
A widely cited critique, advanced most prominently by \citeauthor{schmidhuber2022deep}, argues that the standard Anglophone narrative of deep learning systematically omits the priorities of researchers outside the English-speaking world. The twelve months from early 1990 to mid 1991 at Jürgen Schmidhuber's lab at TU Munich are singled out as especially dense. In that window the group published the principles for what we now call **generative adversarial networks** (a controller network in a zero-sum game with a predictor, February 1990); the first **subgoal-generating** networks for hierarchical reinforcement learning; and in 1991 a *fast-weight programmer* in which one neural network learns to slowly modify the weights of another, the abstract ancestor of what eventually became the **Transformer**'s learned key-query-value projections. The same period saw unsupervised **pre-training** of deep neural networks (later rediscovered and rebranded in the Anglosphere); neural-network **distillation**, in which a small network is trained to mimic a larger one (the technique that underpins DeepSeek's compression of much larger frontier models); the formal identification of the **vanishing/exploding gradient** problem in Hochreiter's 1991 diploma thesis; and the **Long Short-Term Memory** architecture, gated recurrent residual connections that have since become the most cited AI paper of the twentieth century. A quarter century later, almost every major product of deep learning, from CNNs to LSTMs to GANs to Transformers to LLM pre-training to model distillation, can trace a clear technical line back to papers published in this single window by a small group at a Bavarian technical university. Schmidhuber's reading is polemical and contested: he explicitly accuses the 2018 Turing Award and the 2024 Nobel Prize in Physics (Hopfield, Hinton) of republishing methods whose inventors were not cited. Whatever one makes of the rhetoric, the technical lineage is well-documented in the original papers and worth knowing, because every modern AI system you use today stands on it.
</div>

#### The Critique (1969)
Marvin Minsky and Seymour Papert published their book \citetitle{minskyperceptrons}, which provided a mathematical proof of the architecture's limitations. They demonstrated that a single-layer perceptron could not solve the **XOR (Exclusive OR)** problem because it was not “linearly separable.”

To understand why the XOR problem was so significant, we first need to look at how a computer processes logic. We can represent logical gates as functions that take an input matrix (representing all possible combinations of two inputs) and map them to an output vector.

In these examples:
* **False** is represented as $0$ (red) and
* **True** is represented $1$ (green)

#### The OR Gate
The **OR** gate is “True” if at least one input is “True.”

$$ f_\text{OR} \begin{pmatrix} \text{\color{#ef4444}{False}} & \text{\color{#ef4444}{False}} \\ \text{\color{#ef4444}{False}} & \text{\color{#22c55e}{True}} \\ \text{\color{#22c55e}{True}} & \text{\color{#ef4444}{False}} \\ \text{\color{#22c55e}{True}} & \text{\color{#22c55e}{True}} \end{pmatrix} = \begin{pmatrix} \text{\color{#ef4444}{False}} \\ \text{\color{#22c55e}{True}} \\ \text{\color{#22c55e}{True}} \\ \text{\color{#22c55e}{True}} \end{pmatrix} $$

#### The XOR Gate (Exclusive OR)
The **XOR** gate is “True” *only* if the inputs are different.

$$ f_\text{XOR} \begin{pmatrix} \text{\color{#ef4444}{False}} & \text{\color{#ef4444}{False}} \\ \text{\color{#ef4444}{False}} & \text{\color{#22c55e}{True}} \\ \text{\color{#22c55e}{True}} & \text{\color{#ef4444}{False}} \\ \text{\color{#22c55e}{True}} & \text{\color{#22c55e}{True}} \end{pmatrix} = \begin{pmatrix} \text{\color{#ef4444}{False}} \\ \text{\color{#22c55e}{True}} \\ \text{\color{#22c55e}{True}} \\ \text{\color{#ef4444}{False}} \end{pmatrix} $$

Minsky and Papert demonstrated that while a single-layer perceptron can draw a line to separate the results of an OR gate, it is mathematically impossible to do so for XOR because the “True” and “False” results are not **linearly separable**.

<div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; margin-top: 20px;">
    <div id="plot-or-gate" style="flex: 1 1 280px; max-width: 400px; aspect-ratio: 1; border:1px solid #eee; border-radius: 8px;"></div>
    <div id="plot-xor-gate" style="flex: 1 1 280px; max-width: 400px; aspect-ratio: 1; border:1px solid #eee; border-radius: 8px;"></div>
</div>

Even though Minsky realized that having a Multi-Layer-Perceptron with non-linear activation functions would be able to solve this problem, there was no way to efficiently train those until in \citeyear{rumelhart1986} Rumelhart et al. popularized \citealternativetitle{rumelhart1986}, which reignited interest in connectionist models and paved the way for modern deep learning.

The neurons Rosenblatt studied only had discrete outputs, as suggested by \citeauthorlastnameand{mccullochpitts1943}, which had a derivative of 0 and thus, modern Backpropagation algorithms wouldn't work. He suggested the term 'back-propagating errors' already in \citeyear{rosenblattbackprop}, but didn't know how to implement it.

Since early Perceptrons could only classify linearly separable data, they could not solve XOR. This limitation contributed to the **First AI Winter**. Multi-layer networks and **Backpropagation** later overcame this.

An important nuance: **Minsky and Papert knew multi-layer networks could solve XOR.** They said so in \citetitle{minskyperceptrons}. Their argument was not that neural networks were fundamentally flawed, but that **no one knew how to train multi-layer networks efficiently**. Backpropagation was already being developed by \citeauthor{linnainmaa1970} (\citeyear{linnainmaa1970}), but it took two decades to be rediscovered and popularized.

#### The Lighthill Report (\citeyear{lighthillreport}) and The Collapse (1974–1980)

<div class="smart-quote" data-cite="lighthillreport" data-page=8>
In no part of the field have the discoveries made so far produced the
major impact that was then promised.
</div>

The \citealternativetitle{lighthillreport}, published in the UK, was a devastating critique that shattered confidence in AI research. It led to a “deep freeze” in the field known as the **First AI Winter**.

The realization that simple neural networks couldn't handle basic logic gates, combined with the \citealternativetitle{lighthillreport} in the UK, shattered confidence in the field.

* **Shattered Confidence:** Combined with mathematical proofs of neural network limitations, the report destroyed institutional trust in the field.
* **Funding Collapse:** Major agencies like DARPA slashed research budgets following its release.
* **Shift in Focus:** Research into connectionism (neural networks) stopped for a decade, shifting instead toward “symbolic AI” and expert systems.
* **The “Winter”:** Connectionism (neural network research) entered a deep freeze for a decade, as the industry shifted toward “symbolic AI” and expert systems.

It is worth noting that this “AI Winter” was primarily an **Anglosphere phenomenon**. Deep learning research remained alive and productive throughout the 1960s and 70s outside the English-speaking world, particularly in the Soviet Union (Ivakhnenko), Japan (Amari, Fukushima), and continental Europe, where funding for such “blue skies” mathematical research continued.

The Lighthill debate had a specific date and venue: on **9 May 1973**, at the **Royal Institution** in London, the BBC broadcast a 90-minute televised debate in which Lighthill faced off against **Donald Michie** (Edinburgh), **John McCarthy** (Stanford) and the psychologist **Richard Gregory** (Bristol). The transcripts show the AI researchers struggling to rebut Lighthill's central claim that **Category B** (his name for robotics and integrated common-sense reasoning) had produced nothing of substance; McCarthy in particular was put on the defensive about his own laboratory's modest progress. The audience poll, taken before and after the debate, shifted decisively against AI. Within a year, the British Science Research Council had moved to cut AI funding in most UK universities, giving the Anglosphere winter its sharpest edge.

The field only recovered in the 1980s with the popularization of \citealternativetitle{rumelhart1986}, which allowed multi-layer networks to finally solve the XOR problem.

<div class="optional md" data-headline="The philosopher who saw the winter coming">
Long before Lighthill's report, a Heideggerian philosopher at Berkeley had been telling AI researchers that their entire program was misconceived. \citeauthor{dreyfus1972what}'s 1972 \citetitle{dreyfus1972what} attacked symbolic AI from the side of phenomenology: expert skill, Dreyfus argued, is not a collection of rules the expert could in principle articulate, but a holistic, situated, often pre-reflective responsiveness to context. The 1960s AI optimism that “thinking” could be formalized as symbol manipulation therefore missed what thinking actually is, a position he sharpened in seminars at Berkeley that AI faculty and graduate students were essentially required to attend, since Dreyfus taught in the Philosophy Department next door. The AI community's classical counter (that AI would succeed once enough rules were collected) looks, in retrospect, like the precise pattern Sutton would later diagnose as the loser in the bitter lesson. Dreyfus's 1992 *What Computers Still Can't Do*, written after the second AI winter, was widely read as a vindication.
</div>

### The Architectural Precursors: Neocognitron and Backprop

Before LeCun perfected the CNN, the architectural blueprints were drawn by **Kunihiko Fukushima** (who, in turn, based his work in the work of \citeauthorlastnameand{hubelwiesel}, who researched the cat's visual cortex), in \citeyear{neocognitron}, he developed the **\citealternativetitle{neocognitron}**, a hierarchical network inspired by the visual cortex. It introduced the two key layers of modern vision AI: “S-cells” (simple) for feature extraction and “C-cells” (complex) for pooling, which allowed the machine to recognize objects even if they were shifted in position.

However, these deep structures were difficult to train until the popularization of **Backpropagation** by \citeauthor{rumelhart1986} in \citeyear{rumelhart1986}. This mathematical technique allowed the “error” of a network to be sent backward through the layers, adjusting the weights with precision. The combination of Fukushima's architecture and Rumelhart's training algorithm set the stage for the deep learning revolution.
</div>

<div class="optional md" data-headline="How calculating Flight Paths helped to pave the way to modern AI systems">
### The Problem
Traditional methods for finding optimal flight paths relied on complex differential equations (**Euler-Lagrange**) that were nearly impossible to solve for real-world missions. They often failed to satisfy “two-point boundary conditions”, meaning you couldn't easily force the math to start at Point A and end exactly at Point B.

### The Solution: Method of Gradients
\citeauthor{kelley} proposed a **“Direct Method”** (Steepest Descent):
1. **Start with a guess:** Pick any flight path that hits the start and end points.
2. **Find the Gradient:** Calculate the direction of steepest improvement (e.g., less time/fuel).
3. **Stepwise Update:** Shift the path slightly in that direction.
4. **Iterate:** Repeat until the path converges to the mathematical optimum.

### Relation to Modern AI (Neural Networks)
This paper is a foundational application of **Gradient Descent**, the engine of modern AI:
* **Loss Minimization:** In the paper, the “Error” is extra flight time; in NNs, “Loss” is the prediction error.
* **Weight Updates:** Just as Kelley adjusted flight parameters (thrust/angle) in small steps, NNs adjust their weights using the same “steepest descent” logic.
* **Learning Rate:** The paper's “step size” ($\Delta\sigma$) is exactly what we now call the **Learning Rate** in deep learning.

This paper is now recognized as a direct **precursor of backpropagation**. Kelley's method backpropagated derivative information through standard Jacobian matrix calculations from one “stage” to the previous one, anticipating the core logic of the algorithm that would later be generalized by \citeauthor{linnainmaa1970} in \citeyear{linnainmaa1970} and eventually become the foundation of all modern deep learning. See also the related early 1960s work of Stuart Dreyfus and Arthur E. Bryson in control theory.
</div>

<div class="md">
## The Silicon Engine: Moore's Law

While AI research suffered through funding winters, the physical substrate of computing was undergoing an explosion. \citealternativetitle{mooreslaw} describes the observation made by Gordon Moore that the number of transistors in a dense integrated circuit doubles about every two years.

This relentless exponential growth meant that while algorithms remained largely unchanged for decades, the machinery running them became millions of times more powerful. This “free” improvement in performance is the engine behind \citetitle{sutton2019bitter}: methods that scale with computation (like neural networks) were destined to eventually overtake methods that relied on human cleverness, simply because the hardware kept getting faster.

## Automatic differentiation (1970)

While the popularization of backpropagation is often credited to the 1980s, its mathematical genesis lies in the 1970 master's thesis of \citeauthor{linnainmaa1970}. He developed the “automatic differentiation” method, specifically the *reverse mode*, originally to efficiently manage rounding errors in complex computer calculations. Without explicitly intending it for neural networks, Linnainmaa created the highly efficient algorithm required to calculate gradients in nested functions. This work serves as the invisible mathematical backbone of modern Deep Learning, allowing error signals to be propagated backward through billions of parameters with minimal computational overhead.

## The Illusion of Empathy: The ELIZA-Effect

<div class="smart-quote" data-cite="weizenbaum1976computer" data-page=7>
I had not realized ... that extremely short exposures to a relatively simple computer program could induce powerful delusional thinking in quite normal people.
</div>

In the era of Symbolic AI, before machines played chess at a master level, they attempted conversation. In 1966, **\citeauthor{weizenbaum1976computer}** created **ELIZA**, a program designed to parody a Rogerian psychotherapist.

Unlike modern LLMs which calculate probabilities, ELIZA relied on simple pattern matching and substitution scripts. If a user typed “My mother hates me,” ELIZA might use a decomposition rule to transform “My X Y me” into “Who else in your family Y you?”

Despite having no understanding of the world, users, including Weizenbaum's own secretary, attributed genuine human emotions and wisdom to the machine. Weizenbaum was so disturbed by this tendency of humans to project humanity onto code that he wrote \citealternativetitle{weizenbaum1976computer} to warn against the reliance on “deciding” machines over “choosing” humans.

<div class="optional md" data-headline="The original ELIZA was lost — and found">
A \citeyear{lane2025eliza} \cite{lane2025eliza} reveals a surprising fact about ELIZA's history: the original program is not the version most historians have been writing about. Weizenbaum wrote ELIZA in MAD-SLIP at MIT's Project MAC, but the Lisp clone made soon after by Bernie Cosell at BBN, distributed through the ARPANet, supplanted the original within a few years; the BASIC re-implementation by Jeff Shrager in 1977 was what the wider public ever met. For decades the original MAD-SLIP source was assumed lost. In 2021, Shrager (coincidentally the same Jeff Shrager who wrote the 1977 BASIC version) and the MIT archivist Myles Crowley located a fan-fold printout of the original ELIZA, an early DOCTOR script, and substantial parts of MAD-SLIP itself in Weizenbaum's papers at the MIT Institute Archives. The rediscovered code differs in informative ways from the 1966 CACM paper: the preliminary “PRE” reassembly pattern is missing, the keyword stack and “NEWKEY” rule are not implemented, and reassembly-level calls between rules are not supported. A team led by Rupert Lane, David Berry, Anthony Hay, Arthur Schwarz and Shrager hand-transcribed the roughly 2600 lines of MAD and Fortran Assembly Program, brought up CTSS on an emulator of the IBM 7094 (the same 36-bit, 32 K-word, ~450 kHz machine Weizenbaum had used), debugged a single-character typo deep in the FAP, and on 21 December 2024 at 10:54 GMT got ELIZA running again after more than sixty years. The reconstructed system nearly exactly reproduces the famous “Men are all alike” conversation from the original paper; the entire stack is open source, so any Unix user can now run the world's earliest chatbot on its original timesharing system. This means the “ELIZA” cited in most AI textbooks is, strictly speaking, Cosell's Lisp clone; Weizenbaum's own program is now the better-documented of the two.
</div>

## The Triumph of Symbolic AI

While Perceptrons attempted to mimic the brain's structure, a different approach focused on logic and brute-force search. This “Symbolic AI” reached its zenith in \citeyear{deepblue} with **Deep Blue**.

<figure>
    <img style="width: 100%" src="deep_blue_kasparov.jpg" alt="Kasparov vs Deep Blue" />
    <figcaption>\citetitle{deepblue}</figcaption>
</figure>

In a historic six-game rematch, IBM's Deep Blue defeated the reigning world chess champion, **Garry Kasparov**.  unlike the learning-based Perceptron, Deep Blue relied on massive parallel processing capable of evaluating 200 million positions per second. It proved that for well-defined logical problems, a machine could exceed human capability not through intuition, but through sheer computational calculation.

However, Deep Blue's victory represented the pinnacle of specific, hand-crafted logic rather than general intelligence. While effective for the rigid rules of chess, relying on human-designed strategies proved to be a bottleneck for more complex, unstructured problems. This realization leads directly to a fundamental, and somewhat painful, observation about the trajectory of AI progress.

## Bridging the Gap: Long Short-Term Memory (LSTM)

### The “Vanishing Gradient” Problem (1991)
The Fundamental Deep Learning Problem was identified and analyzed in \citeyear{hochreiter1991vanishing} by \citeauthor{hochreiter1991vanishing} in his diploma thesis supervised by Jürgen Schmidhuber. He showed that in typical deep or recurrent networks, back-propagated error signals either shrink rapidly (vanish) or grow out of bounds (explode), making learning impossible for long sequences. Crucially, Hochreiter derived from first principles the concept of a **recurrent residual connection**: a neural unit with the identity activation function connected to itself with weight 1.0, ensuring constant error flow across arbitrarily many time steps.

### The Architecture (1995-2000)
Building on this analysis, Schmidhuber coined the term **\citetitle{lstm}** in a 1995 tech report. The main peer-reviewed publication of \citeyear{lstm} by \citeauthorlastnameand{lstm} is now the most cited AI paper of the 20th century. A critical milestone was the **“vanilla LSTM” architecture with forget gates** (\citeyear{lstm_vanilla}), the variant that everybody uses today (e.g., in Google's TensorFlow). It features gated recurrent residual connections whose gates are initially open (1.0), allowing the network to start with plain residual connections.

### CTC and the Speech Revolution (2006-2015)
In \citeyear{ctc2006}, the training method **Connectionist Temporal Classification (CTC)** was introduced for simultaneous alignment and recognition of sequences. CTC-trained LSTM was successfully applied to speech in 2007 and became the first superior end-to-end neural speech recognizer. In 2015, this CTC-LSTM combination **dramatically improved Google's speech recognition** on Android smartphones. Google Translate (2016), whose technical paper mentions LSTM over 50 times, was based on two connected LSTMs. By 2017, LSTM also powered Facebook's machine translation (over 30 billion translations per week), Apple's Quicktype on roughly 1 billion iPhones, and the voice of Amazon's Alexa.

### The Bridge to Modern AI
LSTMs were the “workhorse” of AI for two decades (approx. 1997–2017). Without the LSTM, the second AI Winter (early 1990s, triggered by the expert-systems bust) likely would have dragged neural NLP along with it for much longer. It proved that connectionist models could handle the sequential, complex nature of human speech by implementing a form of persistent memory. The most widely used neural language models of that era were based on LSTM as well, the transformer-based Large Language Models (LLMs) in the modern sense only arrived with GPT in 2018.

## Convolutional Neural Networks and LeNet-5 (1989-1998)

While early neural networks were limited, **Yann LeCun et al** revolutionized computer vision by developing the first practical **Convolutional Neural Network (CNN)**. In \citeyear{lecun1989backpropagation}, LeCun combined convolutions with backpropagation to recognize handwritten ZIP codes for the U.S. Postal Service, the first commercially deployed convolutional network. In \citeyear{lecun1998gradientbased}, he introduced **LeNet-5**, the refined architecture for recognizing handwritten digits (and, later, bank checks). Unlike standard networks, CNNs use small, learnable filters to automatically extract spatial features like edges and shapes. This proved that biological inspiration, mimicking the visual cortex, could solve complex pattern recognition tasks that traditional logic-based AI could not.

<div class="optional md" data-headline="LeCun did not invent the CNN">
The popular attribution to LeCun obscures a longer Japanese prior art, which \citeauthor{schmidhuber2025cnn} documents in detail. **Kunihiko Fukushima** introduced **rectified linear units (ReLUs)** in \citeyear{fukushima1969relu} — the same activation function that powers essentially every modern Transformer — and the basic **Neocognitron** architecture with alternating convolutional and downsampling layers in \citeyear{neocognitron}, inspired by Hubel and Wiesel's cat visual-cortex work. **Alex Waibel**, a German researcher in Japan, trained supervised one-dimensional convolutional NNs with weight-sharing (TDNNs) on Linnainmaa's 1970 backpropagation in \citeyear{waibel1987tdnn} for speech recognition, and introduced the term *convolution* into NNs. **Wei Zhang** at Osaka then built the first *modern* two-dimensional CNN trained by backpropagation in \citeyear{zhang1988cnn}, applied to character recognition — one year *before* LeCun's 1989 Bell Labs paper. LeCun's later 1998 survey, widely read as the canonical CNN reference, does not cite Zhang. Schmidhuber reads this as a recurring Anglosphere pattern: real innovations made in Ukraine, Japan, Finland or Switzerland get re-popularized from Toronto or New York with the original authors omitted. Whether or not one accepts his polemical framing, the technical timeline is well-attested in the original papers.
</div>

## The Neural Turn

In 2003, **“\citetitle{neuralprobabilistic}”** by **Yoshua Bengio** and co-authors revived backpropagation for language modeling. Their model replaced sparse n-gram tables with dense **word embeddings** \cite[first formalized in]{rumelhart1986pdp}, mapping semantic relationships into a continuous vector space.

## The Democratization of ML Research

Frameworks like **\cite[Torch]{collobert2002}**, **\cite[TensorFlow]{tensorflow2016}** and **\cite[PyTorch]{pytorch}** abstracted away manual differentiation and GPU memory management, allowing researchers to focus on architecture rather than implementation.

## The Bitter Lesson: Scale over Strategy

<div class="smart-quote" data-cite="sutton2019bitter">
The biggest lesson that can be read from 70 years of AI research is that general methods that leverage computation are ultimately the most effective, and by a large margin [...] We have to learn the bitter lesson that building in how we think we think does not work in the long run. 
</div>

The **Bitter Lesson** (\citeauthor{sutton2019bitter}) argues that for decades, AI researchers tried to teach computers human rules (chess strategies, grammar). History shows this approach usually fails: **compute** and **data** almost always beat human-designed cleverness.

\citeauthorlastnameand{jelinek}'s aphorism **“Every time I fire a linguist, the performance of the speech recognizer goes up”** captures the same principle: general-purpose algorithms at scale outperform hand-crafted knowledge.

<div class="optional md" data-headline="What training a neural network actually looks like">
Sutton writes from the perspective of a research director surveying decades of failed research programs. The view from inside the lab, on any given afternoon, is much messier. \citeauthor{karpathy2019recipe}'s 2019 \citetitle{karpathy2019recipe}, written by an OpenAI co-founder and former Tesla AI head, describes the everyday experience of trying to make a neural network work, and it is surprisingly downbeat. Two facts dominate, he says. First, **neural net training is a leaky abstraction**: frameworks advertise 30-line plug-and-play miracles, but backprop + SGD does not in fact magically make a network converge. Second, **neural net training fails silently**: a mislabeled augmentation, an off-by-one in an autoregressive model, a learning-rate decay secretly driving the rate to zero before convergence — none of these produces an exception. The network trains happily, only worse. Karpathy's counter-recipe is to spend hours simply looking at the data before touching code, build a tiny model first, overfit one batch to confirm the pipeline is wired correctly, and only then add complexity one ingredient at a time. *“The qualities that correlate most strongly with success in deep learning,”* he writes, *“are patience and attention to detail.”* His favourite anecdote: he once accidentally left a model training over the winter break and returned in January to a new state of the art. The bitter lesson is true in the long run; getting there is mostly debugging.
</div>



## From Language Models to LLMs

The idea of modeling language statistically predates computers themselves. In the 1940s, \citeauthor{shannon1948communication} applied information theory to English text, treating language as a stochastic process and showing that **n-gram models**, which predict the next word from the previous *n* words, could capture statistical regularities in language. His 1948 paper, \citetitle{shannon1948communication}, laid the mathematical foundation for all subsequent language modeling. Through the 1980s and 1990s, n-gram-based statistical language models dominated speech recognition and machine translation, championed by researchers like Frederick Jelinek at IBM. Meanwhile, **ELIZA** (1966), created by \citeauthorlastnameand{weizenbaum1976computer}, demonstrated early natural language interaction through simple pattern matching, but had no statistical understanding of language whatsoever.

The neural revolution in language modeling began with Bengio et al.'s \citeyear{neuralprobabilistic} paper \citetitle{neuralprobabilistic}, which replaced sparse n-gram tables with dense, continuous **word embeddings**, learned vector representations capturing semantic similarity. This was supercharged in 2013 by \citealternativetitle{mikolov2013word2vec}, which efficiently trained embeddings on large corpora and revealed striking algebraic properties of language (e.g., $\text{king} - \text{man} + \text{woman} \approx \text{queen}$). In \citeyear{elmo}, \citealternativetitle{elmo} introduced **contextualized embeddings** that changed depending on surrounding context, finally addressing polysemy, ie. the idea that one word can have multiple meanings.

The concept of a neural probabilistic text model was first published by \citeauthorlastnameand{schmidhuber1996nplm} in \citeyear{schmidhuber1996nplm}, who used a neural network to predict the next character in a text sequence for the purpose of text compression, effectively creating the first neural language model. The basic concepts of this approach were later reused and extended in the more widely known 2003 work by Bengio et al.

The real inflection point came with the \citealternativetitle{vaswani2017attention}, which replaced sequential processing with parallelizable **self-attention**. Two competing branches emerged almost simultaneously. \citealternativetitle{bert} used the Transformer's *encoder* with **Masked Language Modeling**, hiding random words and predicting them from both directions, to produce deeply bidirectional representations. A single pre-trained BERT model, fine-tuned with minimal data, shattered nearly every NLP benchmark overnight and popularized the **pre-train then fine-tune** paradigm. In parallel, OpenAI pursued the *decoder-only* path: \citealternativetitle{firstgpt} showed that autoregressive next-token prediction over a large Transformer could learn powerful representations. \citealternativetitle{gpt2} demonstrated emergent zero-shot abilities, and \citealternativetitle{brown2020gpt3}, with 175 billion parameters, proved that sheer scale could produce remarkably flexible few-shot learners.

A crucial refinement came with the **Chinchilla scaling laws** (\citeauthor{hoffmann2022chinchilla}, \citeyear{hoffmann2022chinchilla}), which showed that most large models were undertrained: for a given compute budget, the optimal strategy is to train a smaller model on far more data. This insight directly influenced the design of models like LLaMA (\citeauthor{touvron2023llama}, \citeyear{touvron2023llama}), which deliberately used more tokens (1.0–1.4 trillion) with a moderately sized 7B–65B parameter architecture, instead of pushing raw parameter counts higher. LLaMA's release was a pivotal moment for the democratization of AI: by showing that smaller, efficiently trained models could compete with GPT-3, it made advanced language modeling accessible to the broader research community, enabling fine-tuning on consumer hardware and sparking the open-source LLM movement.

Combined with \citetitle[Deep-Reinforcement-Learning]{christiano2017rlhf}, as described in the \citealternativetitle{ouyang2022instructgpt} paper, this lineage culminated in **ChatGPT** in November 2022, the moment large language models crossed from research artifact into mainstream cultural phenomenon.

The trajectory from Shannon's n-grams to ChatGPT vindicates a consistent theme: each generation traded hand-crafted linguistic knowledge for greater scale and more general learning, raw computation and data, given the right architecture, eventually surpassing human-designed heuristics, again proving the \citealternativetitle{sutton2019bitter}.

## Computer-Generated Text: Early Examples


<div class="smart-quote" data-cite="racter1984">
More than iron, more than lead, more than gold I need electricity.
I need it more than I need lamb or pork or lettuce or cucumber.
I need it for my dreams.
</div>

\citetitle{racter1984} (\citeyear{racter1984}) is widely cited as the first book
to be entirely written by a computer program. It was generated by **Racter**, a
text-generation program created by William Chamberlain and Thomas Etter, running on a
Z80 microprocessor. Racter used a system of templates,
grammatical rules, and randomized word selection to produce prose and poetry that was
syntactically coherent but semantically surreal, lines like “More than iron, more
than lead, more than gold I need electricity“ became iconic examples of early machine
creativity.

However, Racter was not the first instance of computer-generated text. Earlier examples
include **Christopher Strachey's** \citetitle{strachey1952} (\citeyear{strachey1952}), which ran on the
Manchester Mark I computer and used templates to produce randomized romantic letters,
arguably the earliest known computer-generated literary text.

The earliest of these examples is **Theo Lutz** (1932–2010), a German computer
scientist, student of the philosopher-cyberneticist **Max Bense**, and one of the
pioneers of what is now called *digital poetry* \cite{lutzobituary}. His \citetitle{lutz1959}
(\citeyear{lutz1959}) ran on a Zuse Z22 at the TH Stuttgart computer center and recombined
words from Kafka's *The Castle* according to probabilistic rules, producing what he
explicitly called “stochastic texts”:

<div class="smart-quote" data-cite="lutz1959">
<div class="full-quote">Nicht jeder Blick ist nah. Kein Dorf ist spät.<br>
Ein Schloss ist frei und jeder Bauer ist fern.</div>
<div class="short-quote">Not every look is near. No village is late.<br>
A castle is free and every farmer is far.</div>
</div>

Remarkably, Lutz even sketched how such a program could learn: by raising the transition
probabilities between subject and predicate whenever a generated sentence was judged
“meaningful”, \cite[“the machine has 'learned' in a certain way”]{lutz1959}, preferring
certain word combinations over time, essentially a trainable n-gram-style language model
proposed in 1959. These experiments predate
Racter by decades and sit at the intersection of combinatorics and language that traces
back through \cite[Shannon's]{shannon1948communication} information-theoretic treatment
of English as a stochastic process.



## Scaling Laws: From Encyclopedias to the Digital Ocean

The breakthrough of modern AI was predicated on a shift in data philosophy: moving from “quality” (hand-curated expert knowledge) to “quantity” (the total sum of digital footprints). Early AI failed because the world was not yet sufficiently digitized. The current era of 2020s AI only became possible once the internet provided a large enough corpus, petabytes of text, code, and images, to allow models to internalize the latent structures of human logic. In this context, data is the “terrain” that the machine's “wheels” must traverse; without a world-scale digital ocean, the abstraction of thought would have had nothing to grip.

### Taming the Stochastic Parrot: The Alignment Era

The final layer of abstraction in the history of LLMs is not mathematical, but teleological. As explored in \citetitle{ouyang2022instructgpt}, the raw statistical power of a base model often results in “hallucinations” or unhelpful outputs because the machine is merely predicting the next likely word, not the user's intent. By introducing **Reinforcement Learning from Human Feedback (RLHF)**, researchers moved beyond the “Black Box” of raw data ingestion into the realm of social alignment. This process essentially acts as a cultural filter, rewarding the model for being helpful, honest, and harmless. This represents the moment where the machine ceased to be a mere calculator of probabilities and began to function as a conversational agent, transitioning from a mirror of the internet's chaos to a tool that respects the subjective constraints of human interaction.

<div class="optional md" data-headline="Does a stochastic parrot understand Chinese?">
The “stochastic parrot” framing reopens the oldest wound in the philosophy of AI. In 1980, \citeauthor{searle1980minds} had proposed the **Chinese Room** thought experiment: imagine a person locked in a room who follows an English rule-book to shuffle incoming Chinese characters into outgoing Chinese characters. From outside, the room behaves indistinguishably from a fluent Chinese speaker. Yet the person inside understands nothing. By Searle's argument, no amount of clever symbol-shuffling is sufficient for *understanding*; minds require specific biological machinery, what he calls *biological naturalism*. The standard rebuttals in the AI literature (the *systems reply*: the room-plus-rules understands; the *robot reply*: grounding in a body fixes the problem; the *connectionist reply*: a neural net would not have the problem) all attempt to push the “understanding” somewhere outside the formal manipulation. \citeauthor{russell2021aima} point out that Searle's argument is *not* an argument against AI as a field: even if no digital computer literally understands Chinese, AI systems can still be made to behave as if they do, and that behaviour is what the field optimises for. The question the Chinese Room leaves unresolved is whether there is a meaningful difference between these two outcomes, and whether the distinction, if it exists, can be settled empirically at all. LLMs in 2026 have not answered it; they have only made the question louder.
</div>

## The Dream of Structure: Recursive Neural Networks
For decades, it was considered an axiom that language possesses an inherent hierarchical architecture. In \citeyear{socher2011}, Richard Socher et al. argued that neural networks must explicitly map this structure to succeed. Rather than treating words as beads on a string, these models used parsers to combine semantic vectors within a tree-like hierarchy.

This represents a pivotal moment in the intellectual history of LLMs: the eventual departure from the idea that we must impose human syntax on the machine. The Transformer did not prevail because it possessed “better” linguistics, but because it ignored rigid structure in favor of patterns learned implicitly through massive scaling.

## From CPU to GPU: The Realization of the “Bitter Lesson”

The shift from the Central Processing Unit (CPU) to the Graphics Processing Unit (GPU) represents the most significant hardware pivot in AI history. While the CPU is designed for deep, sequential logic, a direct descendant of the von Neumann architecture, the GPU utilizes thousands of simple cores to perform matrix multiplications simultaneously. This hardware shift validates the core thesis of \citetitle{sutton2019bitter}: that methods leveraging massive computation eventually outcompete those relying on human-centric heuristics. By abstracting away complex conditional logic in favor of “brute-force” parallel math, the GPU provided the raw power necessary to turn neural networks from theoretical models into dominant technologies.

## The Deep Learning Revolution (\citeyear{krizhevsky2012imagenet})
After the second AI winter, the field shifted back to connectionism. In \citeyear{krizhevsky2012imagenet}, the \citealternativetitle{krizhevsky2012imagenet} paper demonstrated that deep convolutional neural networks, when powered by **GPUs** and massive datasets like ImageNet, could outperform all traditional methods. This validated the \citealternativetitle{sutton2019bitter}: scale and computation ultimately triumph over hand-coded human intuition.

### Highway Networks: The First Very Deep Feedforward NNs (2015)

While LSTM had made recurrent networks very deep through residual connections since the 1990s, feedforward networks remained limited to roughly 20-30 layers until 2015. In May 2015, \citeauthorlastnameand{highway2015} published **Highway Networks**, the first working, truly deep gradient-based feedforward neural networks with **hundreds of layers**, over ten times deeper than any previous feedforward network. They achieved this by transferring the 1999 LSTM principle of gated residual connections (gates initially open at 1.0) from recurrent to feedforward architectures. Seven months later, in December 2015, Microsoft's **ResNet** won the ImageNet competition. ResNet can be described as a Highway Network variant whose gates are always open (i.e., an open-gated Highway Net), a framing most strongly associated with the Schmidhuber group, though He et al. developed ResNet independently and their contribution is broader than this reduction suggests: it combined open-gated residual connections with a deeper empirical exploration (training a 152-layer network end-to-end on ImageNet), a specific initialization scheme, and a bottleneck block design that made the architecture practical at scale. Both descriptions are accurate; neither is the whole story. The Highway Net principle, constant error flow through residual connections, is now the core of virtually all modern deep learning architectures.

The architectural lineage from LSTM to ResNet can be traced as a clear sequence of innovations transferring the same core principle, constant error flow through residual connections:

- **1991:** Hochreiter's recurrent residual connections solve the vanishing gradient problem
- **1997:** LSTM introduces plain recurrent residual connections (weight 1.0)
- **1999-2000:** Vanilla LSTM adds gated recurrent residual connections (gates initially open at 1.0)
- **2005:** Unfolding LSTM leads from recurrent to feedforward residual NNs
- **May 2015:** Highway Networks apply gated feedforward residual connections (initially 1.0)
- **Dec 2015:** ResNet adopts the principle as an open-gated Highway Net

This timeline demonstrates that the most cited neural network of the 21st century (ResNet) is a direct descendant of the most cited neural network of the 20th century (LSTM), connected through the Highway Network.

## The Hardware Lottery: How Gamers Saved AI

We tend to view the progress of AI as a purely mathematical evolution. However, \citeauthor{hooker2020} reminds us of a grounded reality in \citetitle{hooker2020}: the success of an algorithm is often dictated by available hardware rather than intellectual superiority.

Ideas win when they are “hardware-friendly.” Because GPUs were optimized for parallel matrix multiplication (due to the gaming industry), models that relied on these operations, like Deep Learning and Transformers, surpassed their rivals. Highly efficient but difficult-to-parallelize approaches were relegated to the “researcher's graveyard.” We conduct our research in the shadow of the computing architectures we happened to inherit.

While the theoretical foundations of deep learning were laid in the 1980s, the field remained dormant largely due to a lack of computing power. The solution came from an unlikely source: the video game industry.

In the mid-2000s, researchers began to realize that the mathematical operations required to render 3D video games, specifically, the manipulation of massive matrices of pixels, were mathematically identical to the operations required to train neural networks.

### The “Why”: SIMD vs. MIMD
The fundamental difference lies in architecture. A **CPU** (Central Processing Unit) is designed for **latency**: it has a few powerful cores optimized to do complex, sequential logic (MIMD: Multiple Instruction, Multiple Data). It is like a professor who can solve difficult calculus problems one by one.

A **GPU** (Graphics Processing Unit), conversely, is designed for **throughput**: it has thousands of smaller, simpler cores designed to perform the same instruction on massive amounts of data simultaneously (SIMD: Single Instruction, Multiple Data). It is like a thousand elementary school students who can all perform simple addition at the exact same time.

Since training a neural network involves multiplying billions of floating-point numbers (weights) by billions of other numbers (inputs), the GPU's architecture allowed for speedups of **70x to 100x** over CPUs.

### The Discovery
While early attempts to use GPUs for neural networks date back to **Oh & Jung** in \citeyear{oh2004gpu}, the breakthrough required a bridge between hardware and code. This arrived with NVIDIA's release of **CUDA** in 2006, which allowed researchers to program GPUs without translating everything into “graphics” language.

* **The Scientific Proof:** In \citeyear{raina2009large}, a team at Stanford led by **Rajat Raina** and **Andrew Ng** published \citetitle{raina2009large}. They demonstrated that off-the-shelf consumer GPUs (like the NVIDIA GeForce GTX 280) could train Deep Belief Networks orders of magnitude faster than multicore CPUs. This paper quantified the “Bitter Lesson”: cheap hardware could replace complex algorithmic optimizations.
* **The Practical Proof:** In \citeyear{ciresan2011flexible}, **Dan Cireşan** and **Jürgen Schmidhuber** at IDSIA used this power to push the boundaries of what was possible. Their system, “DanNet,” was the first pure GPU-based CNN to win international pattern recognition contests, beating human performance on tasks like traffic sign recognition years before the more famous AlexNet.

This hardware lottery, the fact that AI researchers could piggyback on the massive R&D budget of the gaming industry, is likely the single most important factor in the 21st-century AI boom.

The “Hardware Lottery” describes how the success of an idea depends less on its brilliance and more on whether it fits existing technology. This is perfectly illustrated by **\citeauthor{weatherfactory}'s** **“\citealternativetitle{weatherfactory}”** (\citeyear{weatherfactory}). Richardson envisioned a massive theater filled with 64,000 humans performing manual calculations (then called “computers”) in parallel to predict global weather. While mathematically sound, it was a practical failure because human “hardware” was too slow and expensive to outpace the actual weather.

Just as Richardson's vision remained a “researcher's graveyard” until electronic computers arrived, **Deep Learning** remained relatively dormant in the 1980s. The breakthrough wasn't mainly a new mathematical discovery, but the realization that **GPUs**, built for the gaming industry, were essentially Richardson's “Weather Factory” on a chip. By using **SIMD (Single Instruction, Multiple Data)** architecture, a single GPU could perform the work of thousands of sequential processors simultaneously. This shifted AI from the slow, logical processing of a CPU to the massive throughput required for modern **LLMs**, finally providing the “hardware-friendly” environment Richardson's numerical methods always required.

### CUDA

**CUDA** (**Compute Unified Device Architecture**), introduced by NVIDIA in \citeyear{cuda}, revolutionized AI by enabling GPUs to perform general-purpose computations using standard C code. This innovation unlocked GPUs' potential for parallel processing, crucial for tasks like matrix multiplications in neural networks. For instance, AlexNet (2012) leveraged CUDA-enabled GPUs to train in days instead of years, marking a turning point in deep learning. CUDA exemplifies the “Bitter Lesson” that scalable, compute-heavy methods outperform handcrafted algorithms over time.

### Breaking the Bottleneck: The Birth of Attention

Before the modern Transformer, neural networks suffered from a “representational bottleneck.” Systems like the LSTM attempted to compress the entire meaning of a long sentence into a single, fixed-length vector, a task as impossible as summarizing a complex novel into a single word without losing the nuance. The philosopher-engineer *\cite[Dzmitry Bahdanau]{bahdanau2014}* shattered this constraint by introducing the **Attention Mechanism**. Instead of forcing the model to remember everything at once, Bahdanau proposed a system that allows the decoder to “look back” at the input sequence and selectively focus on the most relevant words for each step of the translation. This shift from static compression to dynamic alignment was the pivotal moment that allowed machines to handle long-range dependencies. Without this breakthrough, the later “Self-Attention” of the Transformer would have had no foundation; Bahdanau taught the machine not just to see, but to observe what matters.

## The Transformer and Attention (\citeyear{vaswani2017attention})
Then came another breakthrough, the \citealternativetitle{vaswani2017attention}. By utilizing a mechanism called **Self-Attention**, models could process entire sequences of data in parallel rather than word-by-word. This solved the “vanishing gradient” problem and allowed models to understand long-range context in text. The further text will lead you through every step you need to understand this Self-Attention-Mechanism on a basic level. The original goal of the Attention paper was not to build a chatbot, but to improve translation systems by a lot.

In this context, “attention” is a mathematical mechanism for weighting information, not a form of awareness or intent.

The Attention Mechanism will be explained in detail later on.

## The Rise of Generative AI
Today, the focus has shifted to **Large Language Models (LLMs)** like GPT (first introduced by the paper \citetitle{firstgpt} in \citeyear{firstgpt}). These models are “pre-trained” on nearly the entire internet to predict the next token in a sequence. By scaling these architectures to billions of parameters, AI has moved from simple classification to generating human-like text, code, and reasoning and even video and music.

What changed since the early days was not the basic ideas, but the availability of data, computing power, and practical training techniques.

## The Great Convergence: From Syllogisms to Silicon

The emergence of ChatGPT represents the “Great Convergence” of a multi-millennial effort to decouple human thought from biology and translate it into formal abstraction. This journey began with **Aristotle's** syllogisms and was radicalized by **Llull's** mechanical knowledge wheels and **Leibniz's** binary alphabet, the idea that all reasoning could be reduced to a series of calculations. From **Babbage and Lovelace's** “algebraic patterns” to **McCulloch and Pitts'** mathematical neurons, the lineage of AI has always sought to treat thought as a formal calculus.

However, the final transition required more than logic; it required a physical substrate of sufficient scale. As noted in \citetitle{sutton2019bitter}, the “Bitter Lesson” of AI history is that raw computation eventually outpaces human intuition. This was made possible by Moore's Law \cite[Moore's Law]{mooreslaw} and the revolutionary discovery that the massive-parallel SIMD architecture of GPUs, originally forged for the sensory demands of video games, provided the perfect engine for neural matrix operations, as demonstrated by \cite[Oh et al.]{oh2004gpu} and \cite[Raina et al.]{raina2009large}.

Today's models are the ultimate synthesis: the combinatorial logic of the ancients finally meeting the brute-force scaling of the modern era. We have reached a point where the machine “weaves” language by calculating billions of vectors across silicon clusters, proving that when enough compute meets enough abstraction, the machine does not just mimic thought, it executes it.

### The Cycles of AI: Learning from the Winters

The history of AI, viewed through a wider lens, reveals a pattern of repeated boom-and-bust cycles \cite{toosi2021history}. The first summer (1956–1969) was fueled by the Dartmouth workshop and Rosenblatt's Perceptron, producing early milestones: **Arthur Samuel's** checker player (1959), the first reinforcement-learning-based AI program; **Newell and Simon's Logic Theorist** (1956), which proved theorems from *Principia Mathematica*; McCarthy's **LISP** language (1958); the **Unimate** industrial robot (1961); the **ELIZA** chatbot (1966); and the **Shakey** mobile robot (1966), the first omni-purpose platform with environment reasoning.

The first winter was triggered by three interconnected failures: (1) the “thinking humanly” approach replicated human problem-solving without analyzing task complexity; (2) AI systems succeeded on toy problems but proved intractable on real-world tasks; (3) Minsky and Papert's 1969 critique of the single-layer Perceptron's XOR limitation, which, despite not being a general critique, contributed to global funding cuts. Two government reports sealed the decline: the US **ALPAC** report (1966) and the UK **Lighthill** report (1973), leading DARPA and other agencies to drastically reduce support. The revived expert systems era (1980s) created a second summer, but unfulfilled promises led to a second winter by the early 1990s. The emerging **neuro-symbolic AI** paradigm \cite{toosi2021history} aims to bridge the historic divide between connectionist and symbolic approaches, combining the trainability of neural networks with the explainability of symbolic systems. As Toosi et al. note, a key lesson is that exaggerated claims and failure to appreciate computational complexity have repeatedly triggered downturns, a warning relevant to today's AI boom.
</div>




<div class="optional md" data-headline="Early work on pattern classification algorithms">
In 1967, Shunichi Amari made a foundational contribution to the theory of adaptive
pattern classifiers in \citetitle{adaptivepattern}.

His work addressed the problem of determining the optimal weight vector of linear
pattern classifiers under general, potentially non-separable pattern distributions.
Amari proposed a “probabilistic-descent method,” in which a correction vector is
associated with each misclassified pattern such that, on average, the correction
moves the discriminant function toward the optimum, even though any individual
trial may worsen it. He proved that the weight vector converges to the optimal
solution and revealed an important tradeoff between the speed and accuracy of
convergence: a larger learning constant accelerates convergence but reduces
final accuracy, while a smaller one improves accuracy at the cost of slower
learning. He further generalized the theory to multicategory classifiers,
piecewise-linear discriminant functions, and general nonlinear classifiers,
and even introduced an adaptive scheme for learning the learning rule itself.
</div>




<div class="optional md" data-headline="Scaling Abstraction: From Bits to Frameworks">
As hardware matured from relays to vacuum tubes and finally to silicon, the bottleneck shifted from physical construction to the management of “Software.” To handle the growing complexity of these systems, computer science adopted a strategy of increasing abstraction.

This evolution moved from:
1. **Machine Logic:** Managing individual bits and relays (Zuse).
2. **Operating Systems:** Managing hardware resources so the human doesn't have to.
3. **High-Level Frameworks:** Tools like **TensorFlow** or **Keras** that allow researchers to treat complex neural operations as “simple boxes.”
4. **Graphical User Interfaces:** They move the abstraction even further away from what the hardware is doing when the user can, for example, just speak to control the computer.
5. **AI**: Abstracting away the non-human interaction part of using computers by simulating *meaning* (as in transformers do, for example).

Today, a developer can invoke a convolutional layer with a single command, such as `model.conv2d`. Under the hood, the system manages millions of matrix multiplications, a level of complexity that would have been impossible for a human to track manually, but which fulfills the trajectory started by Lovelace: reducing the mechanics of thought to a manageable, symbolic architecture.
Operating Systems, later frameworks, growing complexity on the system side to reduce complexity on the human side, until progress could be made by just moving simple boxes like in asanAI or TensorFlow like model.Dense or model.conv2d. Very important to think that level of abstraction
</div>

<div class="optional md" data-headline="Shannon's Bridge: Boolean Algebra and Electrical Circuits">
In 1937, a 21-year-old MIT graduate student named Claude Elwood Shannon submitted his master's thesis, \cite[*A Symbolic Analysis of Relay and Switching Circuits*]{shannon1937switching}, which demonstrated that the two-valued Boolean algebra developed by \citeauthor{bool1854} in 1854 could serve as a theoretical foundation for the design of electrical switching circuits. Shannon recognized that the binary states of electrical relay switches, open or closed, on or off, were isomorphic to the truth values of Boolean logic: true and false, 1 and 0. Any arrangement of series and parallel switches could be described by a Boolean expression, and conversely, any Boolean expression could be physically realized as a circuit of relays. His thesis laid the foundations for all digital computing and digital circuits. The utilization of the binary properties of electrical switches to perform logic functions is the basic concept that underlies all electronic digital computer designs, from the earliest relay computers to the GPU clusters training today's large language models.
</div>
