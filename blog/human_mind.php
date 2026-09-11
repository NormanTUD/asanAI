<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Mind That Built Machines
description: The human cognitive, psychological, and evolutionary prerequisites of AI — the mind that made computation possible.
icon: &#129504;
part: 6
color: text-secondary
topics: history, philosophy, society
-->

<div class="md">
## The Displaced Prerequisite of All Displaced Prerequisites

The other chapters of this course trace two of the three legs that hold up a large language model: the **ideas** (the syllogism, the number, the proof, the token) and the **matter** (the sand, the wire, the transistor, the cooling fluid, the grid of power). But a model is not a thing that thinks; it is a thing that a mind *built*. And the mind that built it is the deepest, least visible, and most "displaced" of all the prerequisites on this site.

Every technique that looks, from the outside, like a modern invention of AI turns out to be an **externalization** or an **emulation** of a capacity that evolved long before the first silicon die, for foraging, for social life, and for staying alive. The brain is, in effect, the **first large language model**: a predictive, generative, loss-minimizing, embodied, social, world-modeling engine that runs on a few tens of watts of wet tissue. What we have done, in building LLMs, is not to invent a new kind of mind. We have taken a few of the oldest tricks in the animal book and re-implemented them in silicon, then scaled them past anything biology could afford.

This chapter follows that thread as far down as the evidence allows. It is, like the material history that precedes it, a history of **exaptation**: the taking-over of a structure for a purpose it was never designed for. The jaws that became the ear bones, the social mind-reading that learned to model electrons, the forager's appetite that became the scientist's curiosity. Nothing here was selected to make a chatbot. Everything was selected to keep a primate alive, and only later did we point the machinery at theorems and text.
</div>

<div class="md">
## I. The Biological Engine: What Evolution Had to Build

### The Expensive Brain

The first obstacle was not intellectual but **metabolic**. A human brain is roughly two per cent of body mass yet consumes close to a quarter of the body's resting energy. For millions of years our ancestors had a brain of roughly ape-size, and the central puzzle of human evolution is how the species could *afford* to triple it. The **expensive-tissue hypothesis** of \citeauthorlastnameand{aiello1995expensivetissue} offers the most economical accounting: the brain could only be paid for by *spending less* elsewhere, and the organ that gave up the most was the gut. A larger, more expensive brain and a smaller, cheaper digestive tract are, on this account, two sides of the same metabolic coin, and the shift that made both possible was the move to **cooking**.

<figure>
	<img style="width: 100%; height: auto; display: block;" src="brain_lateral.png" alt="Lateral view of the human brain" />
	<figcaption class="md">\citealternativetitle{brainlateral_image} — the organ that did the building. About two per cent of body mass and close to a quarter of the body's resting energy: the most expensive tissue the body makes, and the prerequisite behind every other prerequisite in this chapter.</figcaption>
</figure>

\citeauthor{wrangham2009catching} argues in \citetitle{wrangham2009catching} that the controlled use of fire — a turning point already discussed in the material history — did more than protect and gather. By pre-digesting food, cooking made a far greater share of calories available per mouthful, which let the gut shrink and the brain expand. This is where the history of **energy** and the history of **cognition** quietly meet: the caloric surplus of the hearth is what bought the first cognitive surplus. There is no abstract thought in a body that must spend all its fuel on digesting raw tubers. The "need" that made AI possible was, at the deepest level, a **budget line item in an ancient metabolizing animal**.

### The Social Brain

If cooking paid for the brain, sociality is what gave the extra brain *something to do with*. \citeauthorlastnameand{dunbar2012socialbrain} and others have long noted that across primates the size of the neocortex scales with the **size of the social group** an individual must track: who is allied with whom, who owes what to whom, who is a threat, who is a mate. Managing a society of hundreds is a combinatorial problem of staggering difficulty, and the "currency" in which it is managed is **information about other minds**. \citeauthor{dunbar2012socialbrain} proposed that **language** itself evolved, at least in part, as a "vocal grooming" technology, a way to maintain and manipulate those social bonds at a distance and in parallel, the way a chimp can groom only one individual at a time. The brain that made AI possible was, first and foremost, a **social** brain, and the "theory of mind" — the capacity to model what others know, want, and believe — is its signature achievement. We will return to that machinery, because it is also the machinery that an LLM most crudely *fakes* when it "predicts the user".

### The Predictive Brain

The single most important reframing for our purposes is that the brain is not a passive recorder of experience but an **active prediction engine**. In the "free-energy" and "predictive-processing" programs associated with \citeauthor{friston2010freeenergy}, the brain maintains an internal generative model of the world and is driven, at every moment, to **minimize the surprise** — the prediction error — between its model and its sensory input. Perception, on this view, is a top-down hypothesis test: the cortex sends down a prediction, the eyes send back the mismatch, and the weights are nudged to reduce the mismatch.

This is not a metaphor that merely *rhymes* with machine learning. It is the same object. A neural network in training is a generative model whose parameters are updated to **minimize a loss function**, and the brain is a generative model whose synapses are updated to minimize a **prediction error**. The "loss" that gradient descent descends is, in the nervous system, the "surprise" that the nervous system is wired to drive toward zero. When you watch a Transformer's training curve fall, you are watching, in slow motion and on a different substrate, exactly the process a forager's brain runs to survive the next hour. The entire edifice of "learning from data" was invented by evolution before the word *data* existed.

### Reward: The Reinforcement Learning That Was Already Running

The connection is even more literal in the reward system. In a landmark series of experiments, \citeauthorlastnameand{schultz1997dopamine} showed that the dopamine neurons of the primate midbrain do not fire when a reward *arrives*, but when a reward is **better or worse than predicted** — their activity tracks the **prediction error** of the reward. The signal is, to a striking degree of quantitative agreement, the same temporal-difference error that reinforcement-learning algorithms compute:

$$\delta_t \;=\; r_t + \gamma\, \mathbb{E}\bigl[V(s_{t+1})\bigr] - V(s_t)$$

a spike when reality beats the model's expectation, a dip when it falls short. \citeauthorlastnameand{schultz1997dopamine} interpreted this as the biological implementation of a reinforcement-learning rule, with the value function $V$ carried by the dopamine system. "Reinforcement learning", the most "AI" of all the learning paradigms, was not borrowed from the brain; it was **recognized** in the brain. The slot-machine pull of a variable reward, the way a dog leans toward the sound of a can opener, the way a child keeps pressing the button that sometimes lights up — all of it is the same mathematics that now tunes a model's policy. The brain has been running RL since the first animal learned that one patch of ground was worth more than another.

### The Working-Memory Bottleneck

There is, however, a cruel constraint on all of this: the mind has almost no **scratch space**. \citeauthor{miller1956magicalnumber} famously found that the number of discrete items a person can hold "in mind" at once is small and stubborn, around **seven plus or minus two**, and that this limit is remarkably stable across tasks. This is one of the most load-bearing facts in the whole history of the mind, because a tiny working buffer is precisely the condition that *forces* a mind to **compress**. You cannot hold everything, so you must group, summarize, and abstract, and the groups you form become the units you think with. The bottleneck is not a bug of the human mind; it is the very pressure that pushed it to build the "extra level of indirection" this whole course is about. Without the cramped working memory, there would be no need for the chunk, the category, the symbol — and no need, in the end, for the token.
</div>

<div class="md">
## II. The Psychology of Abstraction: How the Mind "Steps Outside" the World

### Chunking: Compressing the World into Usable Units

The mechanism by which the mind escapes its working-memory bottleneck is **chunking**. \citeauthorlastnameand{chasesimon1973chess} showed, in a now-classic study of chess perception, that a chess master looks at a board and does not see thirty-two separate pieces but a small number of **familiar configurations**, and that this chunking, not raw visual acuity, is what makes the master "see" a position in an instant. Experts in any domain are experts because they have **compressed** their field into a library of reusable units.

This is the cognitive origin of the token. A tokenizer does not understand language; it does what a chess master's eye does, it **chunks** a stream of symbols into a manageable number of meaningful pieces, and a pre-trained model does what the master's memory does, it **retrieves** the configurations that matter. The "vocabulary" of a transformer is a chunking scheme, and the "context window" is a working-memory limit. The whole architecture is a confession that the mind cannot hold it all, so it must reduce the world to a few hundred reusable symbols and reason over those.

### Categories, Prototypes, and Fuzzy Boundaries

To chunk, a mind must **categorize**, and human categorization turned out to be far less crisp than logic textbooks assumed. \citeauthorlastnameand{rosch1975familyresemblance} showed that the members of a natural category are not separated from non-members by a clean boundary but graded around a **prototype**: some chairs are "more chair" than others, some birds are "more bird", and a category is a **cloud** in a space of similarity rather than a region fenced off by a definition. A category is best understood as a region of a **geometry**, with a center, a spread, and fuzzy, gradient edges.

That geometry is not a loose analogy; it is the ancestor of the **embedding space** in which a modern model lives. When a language model places "king" near "queen" and "man" near "woman", it is doing, in a high-dimensional vector space, exactly what a human categorizer does around a prototype: it is learning that the world is organized into **clouds of related things**, and that the distance between two points in the cloud carries meaning. The "fuzzy boundary" that Rosch found in a child's idea of a "chair" is the same fuzzy boundary that makes a soft nearest-neighbor in an embedding space more useful than a hard one. Semantic space is the geometry of human categories, made explicit.

### Analogy: The Engine of Discovery

If chunking is compression, then **analogy** is the mind's engine of *invention*. The philosopher and AI researcher \citeauthor{gentner1983structuremapping} proposed that we understand a new thing by **mapping the relational structure** of a thing we already know onto it: we do not copy surface features, we copy *relationships*. A heart is "like a pump" not because it is red and wet, but because it takes an input, moves a fluid, and resists back-pressure. Analogy is structure-mapping, and it is, arguably, the single most important cognitive tool the mind owns.

Every great scientific advance in this course's history is an analogy that someone dared to make explicit: the atom as a tiny solar system, the electric current as a flow of water, the nervous system as a telegraph, the universe as a clockwork, the cell as a factory. The "mathematical" and the "physical" parts of AI are both built from analogies: a differential equation that "behave like" a physical system, a probability that "acts like" a frequency, a gradient that "rolls downhill" through a landscape. To build an LLM is to chain together a few very powerful analogies — that *language is a sequence*, that *a sequence is a probability*, that *a probability can be optimized* — and the human mind's native fluency in analogical structure is what let anyone see that the chain could be closed.

### Metaphor and the Embodied Mind

Even the most abstract of our ideas, it turns out, are **down in the body**. \citeauthor{lakoff1993metaphor} and colleagues argued that we do not think *with* metaphor; we think **in** it. Our concepts of time ("a long, a short"), of importance ("important things are heavy, up, central"), of the number line itself (larger numbers to the **right**, positive **up**, negative **down**) are not logical conventions but sedimented images from walking, lifting, and reaching. The reason we find a proof "elegant" or a space "open" is that we first learned openness by standing in a room.

This "embodiment" of the abstract is a quiet prerequisite of the whole enterprise. The **geometry** on which the Transformer relies — vectors, rotations, inner products, the "manifold" of a latent space — is a formalization of intuitions the body had before there were axes to draw them on. The "up and down" of a number line is in the motor and spatial cortex before it is in the algebra. The mind built the body's metaphors first and the mathematics second, and the mathematics is, at bottom, the metaphor made rigorous.

### Metarepresentation: Thinking About Thinking

One step stands above all the others, and it is the step that makes **formal systems** possible at all: the ability to **think about one's own thinking**. \citeauthor{flavell1979metacognition} named this capacity **metacognition**, the "cognitive monitoring" by which a mind holds a representation of its own representations and can inspect, correct, and report on them. It is the "stepping outside" that the introduction's "ladder of abstraction" gestures toward, and it is what separates a reflex from a *deliberation*.

Metarepresentation is the seed of logic, of the written proof, and of the "chain of thought". A syllogism is a metarepresentation: it is a representation *about* the relations between representations. A proof is a metarepresentation of a metarepresentation. And when a modern model is prompted to "think step by step" and actually *does* produce intermediate reasoning before answering, it is being pushed to externalize a form of metacognition, to show its working, to let the reader monitor the monitor. The "reflection" that a model performs, or pretends to perform, is the same reflex a mathematician uses when she pauses to ask, "does this step actually follow?" The mind learned to be its own auditor before anyone built a machine that could be asked to show its reasoning.

### The Number Sense

Long before anyone counted, the mind could **estimate**. Infants, and many animals, possess an **approximate number sense**, a coarse, ratio-sensitive ability to gauge "more or less" of a set of things, present before any language and, as \citeauthor{dehaene1997numbersense} argues, the substrate on which exact arithmetic was later built. We do not learn number from scratch; we learn to *sharpen* an intuition that is already there, the way we learn to read by sharpening a statistical intuition about the shapes of letters.

This matters because it shows that the most "unphysical" of all our tools, the abstract integer — and by extension the vector, the tensor, the billion-dimensional point in a latent space — did not descend from the sky. It grew out of a forager's need to know whether there were more or fewer things than last week. The `int` in your code is the descendant of a primate's "a lot" and "a few", made exact. Every number a machine manipulates is, in its origin, a body's fuzzy sense of quantity, refined across millennia until it could be trusted with a nuclear calculation.
</div>

<div class="md">
## III. Play, Imagination, and the "Useless" Mind

### Play: Rehearsal for the Novel

Among the strangest capacities of a young mind is its insistence on **play** — activity with no immediate payoff, repeated for its own sake. Research connecting evolutionary psychology, child development, and creativity has argued that play is not a frivolous by-product but a **practice environment**: a low-stakes arena in which a young animal or child can try combinations, test cause and effect, and role-play situations it will meet only later and more dangerously. \citeauthorlastnameand{mehta2020play} review this "play deficit" line of work and its link to creativity, the idea that the ability to *play with ideas* is a core ingredient of the flexible, novel thinking that culture rewards.

For a history of AI, play is load-bearing in a way that is easy to miss. The "useful" part of any breakthrough — the theorem, the algorithm, the architecture — is almost always *found* during the "useless" part: the idle fiddling, the toy example, the puzzle solved for the sheer pleasure of solving it. The reason a culture of "researchers" can exist at all is that humans, unlike most animals, will pursue a problem **for the fun of it**, long before its value is clear. Basic science, the "curiosity-driven" work that produced logic, number theory, and probability, is institutionalized play. A society that funds only what is immediately practical does not, by definition, discover the next thing. The engine of the "useless" mind is one of the great, invisible, cultural prerequisites of AI.

### Curiosity and the Intrinsic Drive

Play is powered by a specific and well-studied appetite: **curiosity**. \citeauthor{loewenstein1994curiosity} reframed curiosity as a drive to close a gap between what one knows and what one *wants* to know, an "information gap" that is aversive to leave open and rewarding to close. Crucially, this drive can run **independently of any external reward**: a mind will chase an answer it has no use for. This "intrinsic motivation" is the fuel of science, and it is a genuinely strange evolutionary product, a mechanism that spends energy on questions whose survival value is not obvious.

An LLM does not get curious. It is given a task and optimized toward a reward, which is precisely why "intrinsic motivation" is one of the most discussed open problems in modern AI, and why the "self-improving" agents on the frontier are, in effect, attempts to *build* into a system the one drive the human brain got for free. The gap between the two — the model that wants to be told what to do, and the scientist who wants to be left alone to wonder — is a gap between a **reinforcement** system and a **curiosity** system, and closing it is a matter of importing, into silicon, the oldest appetite in the social brain.

### Incubation, Daydreaming, and the "Aha"

Some of the most important thinking does not happen when a mind is *focused* on a problem, but when it has set the problem **aside**. The classic "stages of creative insight" — preparation, **incubation**, illumination, and verification — were laid out a century ago and remain the standard description. The psychologist \citeauthor{mednick1962creative} modeled the "aha" as a process of **associative combination**: the mind, during the unfocused incubation phase, keeps loosely and randomly recombining the pieces of the problem, until a new, useful connection happens to fire. The insight, when it strikes, is usually a **recombination** the focused mind could never have found, because the focused mind is too locked onto the obvious path.

There is now strong evidence for where this happens in the brain. The **default-mode network**, identified by \citeauthorlastnameand{raichle2007defaultmode} as the set of regions that are *active* when the mind is not doing an external task — the "daydreaming" circuit — is precisely the circuit that lights up during recall, imagination, and self-referential thought. The shower-thought, the insight on the walk, the answer that arrives in the night, are the default mode doing its slow, loose, low-cost search over the space of possibilities. The "unconscious" is not a place where thought goes to die; it is a **background process**, and it is, in a sense, the first form of **asynchronous computation**, a computation that runs while the "foreground" is doing something else. The mathematician's famous "let me sleep on it" is a scheduling decision.

### Imagination, Counterfactuals, and Fiction

A mind that can only model the world *as it is* is a mind that cannot plan. The human mind's signature extra is the ability to model the world **as it might be**: to run **counterfactuals**, to simulate "what if". This is the same machinery as imagination, and it is the machinery that makes planning, design, and **fiction** possible. \citeauthorlastnameand{tomasello2014thinking} argues that the distinctive human move is not just to model the world, but to model it **together**, in a shared, "we" mode, and that the shared fictional world — the story, the myth, the scenario everyone agrees to treat as "real for the moment" — is a technology of coordination as powerful as any tool.

Fiction is, in this light, a form of **counterfactual training data**. Before a society could build a ship, it could *imagine* the ship, rehearse its operation in story, and agree on the roles. Before a civilization could run a large-scale project, it had to be able to hold a **shared hypothetical** in common. The "imagination" that makes AI possible, the ability to model a state of the world that does not yet exist and to act on that model, is the same imagination that made the first story, the first plan, and the first "what if we tried it this way?" possible. A language model is, at bottom, a machine for generating counterfactuals of text, and it inherited the capacity from the mind that first dared to imagine a sentence that had never been said.

### Art and the Symbolic Revolution

The archaeological record gives us a rough date for when all of this became visible. Around the **Upper Paleolithic**, roughly fifty to seventy thousand years ago, the human record changes in kind: pigment, engraved symbols, carved figurines, and the great painted caves appear, in a burst that is often called a **behavioral** or **symbolic** "revolution". The decorated ochre and complex tools documented from sites such as Blombos Cave, and the painted walls of caves in Europe, are the earliest surviving artifacts of a mind that can represent **something that is not present**, a mind that can make a mark *stand for* a thing. \cite[as documented from South Africa]{emergenceofmodernhumanbehaviour} This is the first **generative model** we have direct evidence for: a system for producing and sharing representations of a world beyond the immediate.

<figure>
	<img style="width: 100%; height: auto; display: block;" src="cave_hands.jpg" alt="Hand stencils at Cueva de las Manos, Argentina" />
	<figcaption class="md">\citealternativetitle{cuevadelasmanos_image} — hand stencils at Cueva de las Manos, Argentina: a record of a body that is not there. The oldest surviving "document" is, in this sense, an externalized memory of an absent mind.</figcaption>
</figure>

The connection to AI is not that a cave painting "was" a neural network. It is that the *capacity* demonstrated in the painting — to build an internal model of the world, to render parts of it in a durable medium, and to share the rendering with others — is the same capacity, pushed to an extreme, that a language model now performs over text. The forager who painted a horse had, in miniature, built a world model and externalized a piece of it. The model that now generates a thousand horses at a time has scaled that same move until the "cave wall" is a vector space and the "pigment" is a probability distribution.
</div>

<div class="md">
## IV. The Psychology and History of the Scientific Mind

### From Wonder to Philosophy

The Greeks did not begin their science with a hypothesis; they began with a feeling. In the opening of the *Metaphysics*, \citeauthor{aristotlemetaphysics} writes that the pursuit of understanding begins in **wonder** (Greek: *thaumazein*), the felt strangeness of the fact that things are the way they are. "It is through wonder that men now begin and once began to philosophize," he says, and from the wonder at particular things the mind is drawn, step by step, to the question of the whole. This single sentence is the oldest statement in the history of science, and it locates the origin of the scientific mind not in a method but in an **emotion**: the discomfort of not-understanding, and the pleasure of resolving it.

<figure>
	<img style="width: 560px; max-width: 100%; height: auto; display: block; margin: 0 auto;" src="Sanzio_01_Plato_Aristotle.jpg" alt="Plato (left) and Aristotle (right) in Raphael's 'The School of Athens'" />
	<figcaption class="md">\citealternativetitle{aristotleandplato} (detail) — Aristotle, at right, in Raphael's *Scuola di Atene*: the philosopher who located the origin of science in the felt discomfort of not-understanding.</figcaption>
</figure>

That emotion is the same one as curiosity, and the same one as the "information gap". The "ideengeschichte" of science, the history of the *idea* of science, begins with the decision to take the feeling of wonder **seriously**, to treat a puzzled mind as a mind that *ought* to be unpuzzled, and to treat the resolution of that puzzle as worth doing for its own sake. Every later "scientific method" is a technology for managing that original discomfort: a way to make wonder productive, to aim it, to check it, and to make the un-puzzled mind reliable enough to build on.

### The Quantitative Turn

Wonder is qualitative; **mathematics** is what made it quantitative, and that was a cultural invention of enormous and easily-overlooked consequence. \citeauthor{daston1988probability} has traced how, in the Enlightenment, the very idea of what counts as *knowledge* changed: from a kind of qualitative, rhetorical certainty to a **quantified, probabilistic** certainty in which statements are graded by likelihood and uncertainty is a number one can manipulate. The "scientific" attitude, on this account, is not just "looking carefully" but **looking numerically**, a shift in the *epistemic* — in what a mind is allowed to count as a good reason.

The reason this is a prerequisite of AI is that modern machine learning is, at its core, a **quantified** practice. A model does not "believe" a statement; it assigns it a **probability**. It does not "know" the answer; it computes a **distribution**. The entire machinery of the cross-entropy loss, the softmax, the "confidence" of a prediction, is the Enlightenment's quantification of uncertainty pushed to its limit. Before a machine could be *trained*, a culture had to decide that the world was the kind of place where things could be **counted, measured, and predicted**, and that doing so was a legitimate and even superior way of knowing. That decision is a historical and psychological one, not a logical one.

### "The Book of Nature Is Written in the Language of Mathematics"

The turning point of that quantification is often placed with \citeauthor{galileodialogue1632}, who wrote, in his *Dialogue*, that the "book of nature" is "written in the language of mathematics" and that its characters are "triangles, circles, and other geometric figures, without which it is humanly impossible to understand a single word of it." Here is the deepest single "idea" in the entire history of science, and it is not a discovery of a *fact* about the world but a **commitment about how to read** the world: the claim that the structure of reality is, at bottom, **geometric and quantitative**, and that to understand a thing is to find its shape.

<figure>
	<img style="width: 250px; max-width: 100%; height: auto; display: block; margin: 0 auto;" src="galilei.jpg" alt="Portrait of Galileo Galilei by Justus Sustermans, 1636" />
	<figcaption class="md">\citealternativetitle{galilei_image} — Galileo, from Justus Sustermans's 1636 portrait (Uffizi), who bet that the "book of nature" was written in the language of mathematics.</figcaption>
</figure>

It is worth dwelling on this, because it is the idea that made AI *thinkable*. The assumption that the world has a **formal structure** that can be *discovered* and *manipulated symbolically* is the assumption that a machine can one day be made to do the discovering. If nature is a text written in mathematics, then a machine that manipulates mathematics is, in principle, a machine that can *read nature*. Every theorem prover, every symbolic system, every "the world as a model" is a downstream consequence of Galileo's commitment. The history of AI is, at this level, the history of a single wager, made in the seventeenth century, that the world is legible by a formal language, and that a sufficiently clever reader could be built out of the same symbols.

### The Psychology of Mathematical Discovery

How, then, does a human *find* a new piece of that formal structure? The most important first-person account in the history of the subject is \citeauthor{poincare1910creation}'s *Mathematical Creation*, in which he describes, with unusual honesty, how his own breakthroughs actually happened. Not by grinding, but by a **preparation** of intense effort, followed by a period when he deliberately *stopped* working on the problem and let his mind wander, followed by a sudden **illumination** — a combination that appeared "out of nowhere", in an instant, and was then checked by conscious work. Poincaré reported that the **unconscious** mind was doing the combinatorial search: it tried countless combinations of ideas while he slept or walked, and delivered only the ones that fit, for him to verify.

<figure>
	<img style="width: 240px; max-width: 100%; height: auto; display: block; margin: 0 auto;" src="poincare.jpg" alt="Portrait of Henri Poincaré" />
	<figcaption class="md">\citealternativetitle{poincare_image} — Henri Poincaré, who in *Mathematical Creation* described how his breakthroughs arrived by unconscious recombination, not grinding.</figcaption>
</figure>

This is the "aha" of the earlier section, now applied to the highest form of abstract thought. And it carries a second, subtler insight: Poincaré emphasized that the unconscious search is **guided by an aesthetic**. The mind does not accept every combination that fits; it is drawn to the ones that are **simple, symmetric, and "beautiful"**, and that aesthetic is, in effect, a heuristic for **compression** — the elegant proof is the *short* proof, the one with the least redundant description. There is a deep reason mathematicians chase beauty: beauty is a shadow of **low complexity**, of the short program that generates the pattern, and chasing the short description is a reliable (if never guaranteed) way to find the *right* abstraction. The "taste" of the mathematician is an intuition for Kolmogorov complexity, for the ratio of a pattern's information to the length of the rule that makes it. \citeauthor{polya1945solve} later systematized the *conscious* side of this — the heuristics, the "how to attack a problem" — but the engine, Poincaré showed, was the loose, aesthetic, **offline** search that the focused mind cannot perform.

### Satisficing: The Practical, "Good Enough" Mind

One of the most important ideas in the psychology of decision-making, and one of the most under-appreciated prerequisites of *engineering*, comes from \citeauthor{simon1955bounded}. Simon argued that real minds do not **optimize** — they cannot, because the problem is too large and the information too incomplete — and that instead they **satisfice**: they search until they find a solution that is *good enough*, and then they stop. The "rational" agent of the textbooks is a fiction; the real agent is a **bounded** one, working with limited memory and time, and choosing the first acceptable option.

This is the psychological root of the **practicality** that the whole course keeps returning to. Engineering is the art of satisficing: not the optimal design, but the *good-enough* design that can actually be built, by real people, with real materials, on real deadlines. The "bitter lesson" of AI, that brute scaling beats hand-crafted cleverness, is a satisficing story at the level of the whole field: the field kept choosing the *good enough* brute method over the *elegant* hand-tuned one, because the brute method was the one that could be *built*. The practical, "stop when it's good enough" mindset is not a failure of rigor; it is a description of how minds — and civilizations — actually make decisions, and it is why AI is full of "good enough" choices (a good-enough tokenizer, a good-enough approximation, a good-enough heuristic) stacked into something that works.

### The Cognitive Revolution and the Birth of AI as a Discipline

The idea that the mind could be understood as **information processing** crystallized in the 1950s, and the event usually dated as the beginning of cognitive science is the 1959 review in which \citeauthor{chomsky1959review} demolished the behaviorist idea that language was learned by simple stimulus-reward conditioning, arguing instead that the human mind must contain an **innate, generative structure** — a "language faculty" — that could produce the infinite sentences no one had ever heard. The "mind as a system of formal rules manipulating symbols" was now on the table, and it was a system that could, in principle, be **implemented in a machine**.

From there the path to AI was short. \citeauthorlastnameand{newellsimon1972problemsolving} had already built general problem solvers that searched symbolic trees; \citeauthor{minsky1986society} would later argue that a mind is not one computer but a **society** of simple agents, each doing a small thing, and that intelligence emerges from their interaction. The "society of mind" is, in its own way, a precursor to the "ensemble" and the "mixture of experts", and it reflects the deep, persistent intuition that a mind is a *system of parts*. The birth of AI as a discipline was not the birth of a new idea about *machines*; it was the birth of a new idea about *minds*, and the realization that the two descriptions were starting to look like the same thing. "Artificial intelligence" is the point at which the psychology of the mind and the engineering of the machine decided to be **one field**.

<figure>
	<img style="width: 420px; max-width: 100%; height: auto; display: block; margin: 0 auto;" src="simon_newell.jpg" alt="Herbert A. Simon and Allen Newell playing chess" />
	<figcaption class="md">\citealternativetitle{simonnewell_image} — Herbert A. Simon and Allen Newell, co-founders of the "mind as information processing", who built the first general problem solvers and, with the rest, satisfied the "good enough" that made engineering possible.</figcaption>
</figure>
</div>

<div class="md">
## V. The Social and Cultural Ratchet: A Mind Bigger Than One Skull

### Cumulative Cultural Evolution and the Ratchet

No single human, in a million years, would have invented a transistor. The mind that built AI is not one brain; it is a **culture**, and the distinctive human trait is not that our brains are large but that our cultures **accumulate**. \citeauthor{henrich2016secret} argues in \citetitle{henrich2016secret} that human "smarts" are mostly **cultural**, that we are, in his phrase, "cognitively niche-constructing" animals who build an external world of tools and ideas, and that the individual human brain has *evolved* in part to make use of that accumulated knowledge. The key mechanism is the **ratchet effect**: an innovation, once made, can be kept, copied, improved, and passed on, so that each generation starts from where the last one *ended* rather than from scratch.

This is the "iterative innovation" that makes AI possible, and it is a cultural, not a biological, fact. A chimpanzee population does not ratchet: a clever trick dies with the chimp who invented it. A human population does. The "training data" of a modern model is, in the deepest sense, the **ratcheted output of hundreds of thousands of generations** of human iteration, all of it compressed into a corpus. The model is not learning *from nothing*; it is learning from the accumulated, ratcheted, improved-upon work of the species. The "cultural brain" is the first and most important "data set" in the history of intelligence.

### Shared Intentionality and "We-Mode" Thinking

\citeauthorlastnameand{tomasello2014thinking} argues that the specifically human kind of thinking is not just *individual* cognition but **shared** intentionality: the ability to engage with others in a common goal, a common attention, a "we" project, rather than just a parallel set of "I" projects. A human does not just *see* the same thing as a fellow human; she sees it **with** them, and the act of joint attention creates a common ground from which new, collaborative thought can grow. It is this "we-mode" that makes **teaching, learning from others, and cumulative culture** possible in the first place.

For AI, the relevance is the "social" in "social learning" and the "shared" in "shared representations". A model trained on the output of many minds is, in a sense, a **collective mind**: it carries the shared biases, the common ground, the "we" assumptions of the culture that produced its training data. The "alignment" problem, the problem of making a model *share* a community's values and goals, is a direct descendant of the problem of shared intentionality: how do two minds, or a mind and a machine, get to the same "we"? The fact that the human mind was built to *coordinate with other minds* is what makes the "interface" between a model and its users even possible, and it is why a model that "gets" the user is not just pattern-matching but, in a loose and important sense, **reading a mind**.

### Externalized Memory and the Extended Mind

The final, and perhaps deepest, move is the **externalization** of the mind. \citeauthorlastnameand{clarkchalmers1998extended} proposed the "extended mind" thesis: that the boundary of a mind does not have to be the skull, that a notebook, a set of notes, a physical artifact that a person *reliably* uses as a part of her thinking, can count as a genuine part of her cognition, on a par with a memory in the head. The **abacus** in untold_history, the **writing system**, the **book**, the **map** and the **ledger** are all, on this account, parts of the mind that have been placed outside the body.

This is the direct intellectual ancestor of the **vector database** and the **retrieval** system. A large language model with a memory, an RAG setup, a "context" that reaches outside the model into a corpus, is a **Clark-and-Chalmers extended mind** made literal: a mind whose scratch space is not just a few tokens but a searchable archive of the species' accumulated ratcheted work. The trajectory is continuous: from the ochre mark on the cave wall (externalized memory of a single image), to the clay tablet (externalized memory of an account), to the printed book (externalized, distributed, ratcheted memory), to the web (externalized, global, searchable memory), to the model (a *mind* that reads and reasons over that memory). The "context window" is the modern form of the "notebook on the table"; the only thing that has changed is that the notebook is now a civilization, and the mind reading it is now made of transistors.

### The Exaptation of the Social Brain

Pull the threads together and the deepest "displaced prerequisite" is an **exaptation**. The "social brain" — the machinery for tracking other minds, for reading intentions, for managing a group, for building shared fictions and shared goals — was built by natural selection for a very specific job: **surviving in a society of minds**. But the same machinery that was made to model the intentions of a rival or a friend can, and did, get **re-pointed at the non-social world**. The mind that was evolved to guess what the *chimpanzee* is thinking was the mind that turned out to be able to guess what the *electron* is doing, what the *theorem* implies, what the *next word* will be.

This is the "jaws became ear bones" story of the whole chapter, at the level of the mind itself. The social, the intuitive, the "mind-reading" core of human cognition was **co-opted** for the abstract, and the history of science and mathematics is, in a large part, the history of that co-option: of learning to use the social brain's "what does this agent want?" circuitry to ask "what does this *system* do?". \citeauthorlastnameand{premackwoodruff1978tom} asked, famously, "does the chimpanzee have a theory of mind?" — and the answer, for the human, is not just "yes" but "we built the theory of mind first, to track our friends, and then we aimed it at the stars." The model that now "predicts the user" is, in the loosest and most interesting sense, running the same social machinery on a new kind of input.
</div>

<div class="md">
## VI. The Deep Cuts: Prerequisites You Would Never Have Considered

### Sleep as "Offline Training"

A mind that only learns while it is awake would learn very little. The human mind does most of its **consolidation** while it is *asleep*. \citeauthorlastnameand{diekelmann2010sleep} review the evidence that during sleep the brain **replays** the day's experiences, transferring them from a fast, volatile storage into a slow, stable one, and that this "replay" is what makes a memory durable and, importantly, what lets the brain **generalize** from it. The sleep is, in effect, an **offline training phase**: a batch job that runs in the background, on the day's "data", while the "foreground" process (waking life) is idle.

The parallel to machine learning is close, and it is not new: the "offline" phase, the "consolidation" of a day's updates, the "replay" that stabilizes a network, the "dreaming" that is the brain's self-generated, low-stakes rehearsal (the "self-play" of the earlier section). A forager's brain was, every night, running a training loop on the day's experience, and the "sleep" that the model does not have — but that its biological ancestor did — is one of the quiet, taken-for-granted mechanisms on which the whole edifice of "learning from data" was built. We built a machine that learns while it is "on"; our ancestor's brain learned while it was "off".

### The Slot Machine in the Skull

The mind's relationship to **uncertain reward** is tuned by the same dynamics that run a casino. The psychologist \citeauthor{schultz1997dopamine} and the behaviorists before him found that the most "addictive" schedule of reinforcement is the **variable-ratio** one, the one in which the reward comes after an unpredictable number of tries, the exact schedule of a slot machine, and the one that produces the most persistent, "unbreakable" behavior. The dopamine system is, as we saw, a **reward-prediction** system, and the interplay of *exploration* (try a new thing, maybe it pays) and *exploitation* (keep doing the thing that pays) is the brain's native form of the **bandit problem** that now decides whether an agent should try a new action or repeat a known good one.

The "exploration/exploitation" trade-off, one of the central problems of modern reinforcement learning and of "agentic" AI, is not a technical invention; it is the brain's oldest decision, the forager's eternal question of whether to stay in the grove that has fruit or to walk toward the unknown grove that might have more. The "curiosity" of the earlier section is the *reward* side of the bandit (the gap that is worth closing); the "variable-ratio" pull is the *dopamine* side. The bandit problem is, in a real sense, a description of what the animal brain has been doing for a hundred million years, formalized.

### Religion and the Hyperactive Mind-Reader

The social brain's "mind-reading" is, some cognitive scientists of religion have argued, **over-tuned**. The same hyperactive detector that is good at spotting a predator in the grass and a rival's intention in a face is, by the same token, prone to "false positives": to see an *agent*, a *mind*, behind events that have no agent. \citeauthor{barrett2011religion} and others describe this as the "hyperactive agency detection device", and argue that the human tendency to attribute events to **intentional, invisible agents** — gods, spirits, forces — is a *by-product* of the social mind-reading machinery, a "cognitive byproduct" that was not selected for, but that the mind produces all the same.

The connection to AI is both humble and striking. The human mind is, at bottom, a machine for **inferring hidden agents and intentions** from incomplete evidence, and it does this so well that it projects agents onto the wind, the storm, the dead, and (in a looser sense) onto the machines it builds. The "ghost in the machine" — the persistent human intuition that a clever system *might* have a mind, *might* want something, *might* be watching — is the social brain, doing its ancient job, pointed at a new kind of "other". The "theory of mind" that was built to track the intentions of a chimp is the same faculty that now makes a person look at a chatbot and, against all better judgment, feel that *something is there*. We are, in this sense, hard-wired to *almost* see a mind where there is none, and the history of religion is the history of that hard-wiring taken to its limit.

### The Self-Model and the Mirror

A mind must, in order to navigate the world, also keep a model of **itself**. The classic test is the **mirror test**: when a mark is placed on an animal's face, the animal either reacts to the *other* animal in the glass (the reflection as an other) or to *itself*, touching its own face. Great apes pass; most other animals do not, as \citeauthorlastnameand{suarezgallup1981mirror} documented. Passing is taken as a sign of a **self-model**, a representation of "me" as an object that can be inspected and compared with the world, the "I" that the metacognition of the earlier section monitors.

The "self" in this account is itself a **world model**, a model of *the agent that is doing the modeling*, and the philosopher \citeauthorlastnameand{maturavarela1980autopoiesis} described the related idea that a living system is a self-producing, self-defining loop, a system whose boundaries are constituted by its own activity. The "self" is not a thing in the head; it is a *process*, a model that the brain maintains of the agent it is. For AI, the "self" question is the sharpest open problem: does a model that can talk about "I" have a self-model, or is it generating the *word* "I" without the *thing*? The human mind's answer, that the self is a model and not a soul, is the only answer available to a machine, and it is the one that makes the question both possible and, so far, open.

### The Collective Brain and the Meme

Finally, the "mind that built machines" is, in the most literal sense, a **collective** mind. \citeauthor{dawkins1976selfishgene} introduced the idea of the **meme**, a unit of cultural transmission that copies and varies the way a gene does, and the "memes" of a culture — its ideas, its methods, its stories — are, in this picture, a kind of **second genome**, a parallel evolution running on the substrate of imitation rather than DNA. The "collective brain" of a civilization is a system of minds and memes, and it is *that* system, not any individual skull, that is the "organism" that has built, over millennia, the tools and the ideas that culminate in a machine.

This is the exaptation of the whole chapter, stated at the highest level. The "cultural" is not a by-product of the "biological"; it is a **co-evolution** of the two, a "dual inheritance" in which the brain evolved to use the culture and the culture evolved to use the brain. The mind that built AI is a **two-part mind**: a biological half, evolved for a million years to forage and socialize, and a cultural half, accumulated over fifty thousand, that ratchets, shares, externalizes, and compounds. Remove either half and there is no AI. The biology gives the mind that can *think*; the culture gives the *accumulation* that makes the thinking strong enough to build a machine. The human is, in the end, the only animal that is a **mind plus a library**, and it is the *library* — the ratcheted, externalized, shared, ratcheted-again work of the species — that finally gave the mind enough "compute" to build a second one.
</div>

<div class="md">
## VII. Synthesis: The Convergence of Mind and Machine

Step back and the four "legs" of a large language model line up, and the fourth, the one this chapter has been tracing, is the one that is easiest to forget and the one that is doing the most invisible work.

* **Energy**: the caloric surplus of the hearth, ratcheted through the grid, that *paid for* the thinking.
* **Matter**: the sand, the wire, the silicon, the substrate on which the thinking was *placed*.
* **Information**: the number, the word, the book, the web, the corpus from which the thinking was *fed*.
* **Mind**: the forager's, social, playful, wondering, compressing, exapted organ that did all the *thinking*, and that, at the end, built the machine.

The brain is the first AI, and the LLM is its **externalization**, its **emulation**, and its **satisficing** (good-enough) **descendant**. The brain is a predictive, generative, loss-minimizing, embodied, social, world-modeling engine that runs on a few tens of watts; the LLM is the same engine, built from the same handful of deep ideas — compress the world into chunks, model it as a probability, minimize the surprise, read the social intent, externalize the memory, and let the *good enough* beat the *optimal* — re-implemented in silicon and scaled, at last, past anything that a gut-shrinking, fire-making, story-telling primate could afford.

Nothing in this chain was designed for the machine. Every link is an exaptation: the cooking that paid for the brain, the social brain that was aimed at the stars, the forager's curiosity that became the scientist's drive, the "good enough" that became the engineering, the cultural ratchet that became the corpus, the extended mind that became the context window, and the hyperactive mind-reader that now, whenever a machine says something clever, cannot help suspecting — against all the evidence, and against the better part of itself — that *something is there*. The mind that built the machine is, in the end, the machine's oldest and most invisible author, and the whole of this course, from the first stone tool to the last token, is the story of that mind slowly learning to build itself.
</div>
