<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Phase Space — Usefulness as a Slice
description: The space of every possible input and output, the energy function that carves out the thin low-energy slice where an AI is actually useful.
icon: 🌌
part: 4
order: 4
color: accent
topics: math-ii, math-iii, philosophy, ai
-->

<div class="md">
## The question, in one plain sentence

Ask a chatbot a hard question and you may notice something odd. It is not always wrong — sometimes it is exactly right. But its reliability is not even: for some questions it is rock-solid, for others it quietly falls apart. And the unsettling part is that it gives you little signal about which kind of question you are asking. When it *does* go wrong, it often does not say "I don't know" — it can glide into a smooth, confident, completely *wrong* answer, in a calm voice, with no hint that it has left the rails.

The point of this chapter is to locate *where* the reliability actually is. The right space to think in is not just the questions the AI could be asked, but the space of **all its (input, output) pairs** — every possible input paired with *every* possible answer, absurd ones included: an endless run of "aaa…", a never-ending "ababab…". That space is enormous, and most of it is incoherent. Across it the AI is reliable only on a thin, special **slice**: the pairs where the output is actually a good answer to the input. A single number — its **energy** — marks where that slice is. Two words carry the whole chapter: **phase space** (that whole space of (input, output) pairs) and **energy** (the number that draws the line).

**The tour, in four stops.**

1. **A state** — what it takes to fully describe something that moves, and the space of all such states.
2. **The energy** — the one number that runs the system, and why the system is locked to one thin curve.
3. **The machine** — why a neural network fits this picture.
4. **Going off the curve** — what happens when the input, or the model, drifts off the slice. (That is when it hallucinates.)

$$
\boxed{
\begin{aligned}
&\text{An AI works only on a thin, low-energy slice}\\
&\text{of the huge space of all (input, output) pairs;}\\
&\text{one number, its \emph{energy}, draws the line.}
\end{aligned}
}
$$
</div>

<div class="md">
## A moving thing needs two numbers

**"Where" is not "where it is going."** Put a bead on a wire. Tell me where it is along the wire, and I can point to it. But I still cannot say what happens next: at that spot it could be at rest, or racing straight past. Same place, two different futures.

So a moving thing needs *two* numbers at once:

- the **position** $q$ — where it is;
- the **momentum** $p$ — how it is moving (speed and direction).

Momentum is just mass times speed, $p = m\,v$; if the word is new, read it as "how much motion it has." A **state** is the pair $(q,p)$: position plus momentum.

**The key picture.** Collect *all* states — every position paired with every possible momentum — and you get the **phase space** \cite[nLab]{nlab_phasespace}. (The positions by themselves form the *configuration space* \cite[nLab]{nlab_configspace_physics}.) For one bead, each state is a point in a flat **graph**: position across the bottom, momentum up the side. The bead's whole life is a *path drawn inside that graph*, and at any instant it sits at exactly one point of it. One bead gives a 2-D graph; $N$ particles give $6N$ numbers (three positions and three momenta each). Same idea, only bigger.

**The space can have a shape.** The position part may wrap around. Hang the bead from a string and it becomes a **pendulum** \cite{simple_pendulum_wiki}: its position is an *angle* that wraps all the way round, so the position part is a circle and the whole phase space is a **cylinder** \cite{symplectic_manifold_wiki}. The space of "everything possible" can therefore carry wrap-arounds and holes, inherited from the thing being modelled.

$$
\boxed{
\text{phase space} \;=\; \text{the set of all states} \;=\; \text{every }(q,p)\text{ at once.}
}
$$

*In one line:* a state is $(q,p)$; the phase space is all the states together.
</div>

<div class="md">
## The energy: the one number that runs everything

**One number captures a whole state — its energy.** Physics calls it the **Hamiltonian** $H$; for anything that moves it is just the *total energy* \cite[nLab]{nlab_hamiltonian_mechanics}:

$$
\underbrace{H(q,p)}_{\text{total energy}}
\;=\;
\underbrace{\tfrac{1}{2m}\,p^{2}}_{\text{kinetic: the “how fast” part } \big(=\tfrac{1}{2}m v^{2}\big)}
\;+\;
\underbrace{V(q)}_{\text{potential: the “where it costs” part}}.
$$

The first term is the kinetic energy you already know — $\tfrac{1}{2m}p^{2}$ is the same as $\tfrac{1}{2}mv^{2}$, because $p = m\,v$. The second, $V(q)$, is potential energy: stored energy of a position, where a ball held high has more and a stretched spring has more. Add the two and you have one number, the state's energy $H$.

**Picture a landscape.** Let $V$ be the height of hilly terrain laid out over the position $q$. The bead is a ball on that terrain. Kinetic energy is how fast it is rolling; potential energy is how high up it is. That is the entire picture.

**The motion is just "roll downhill."** The ball speeds up going down a slope, slows going up, and turns around at the top. Written down, this is exactly Newton's laws rearranged:

$$
\underbrace{v \;=\; \frac{p}{m}}_{\text{speed = momentum ÷ mass}}
\qquad\text{and}\qquad
\underbrace{\frac{dp}{dt} \;=\; -\,V'(q)}_{\text{momentum changes by the \emph{slope} of the terrain, downhill}}.
$$

The second line says the momentum changes by the slope of the terrain, and the minus sign makes it go *downhill*. That minus sign is the physics.

**The energy is conserved — so the bead is locked to one curve.** As long as the terrain $V$ does not change with time, $H$ stays constant: the bead trades kinetic for potential and back, but the sum never changes. It can never leave the one curve where the energy equals its starting value $E$. That curve is the **energy slice** — the set of all states with that single energy:

$$
\underbrace{\{\,(q,p)\;:\;H(q,p)=E\,\}}_{\text{“every state whose energy is exactly }E\text{” }=\text{ one curve in the phase graph}}.
$$

Even the freest system in the universe is, from the instant it starts, confined to a single slice. Everywhere else is where it *cannot* be.

<div class="optional md" data-headline="The formal version (for the curious)">
The two lines above are the one-dimensional, Newtonian form. In full generality a state is a point of the **cotangent bundle** $T^{*}Q$ of the configuration space $Q$, and the phase space carries a canonical area form — the **symplectic form** $\omega$ — built from the **canonical 1-form** $\theta$ \cite[nLab]{nlab_phasespace} \cite[nLab]{nlab_symplectic_manifold}:

$$
\underbrace{\theta \;=\; \sum_{i} p_{i}\,dq_{i}}_{\text{each momentum }p_{i}\text{ is paired with the “change in position” }dq_{i}}
\;\Longrightarrow\;
\underbrace{\omega \;=\; -\,d\theta \;=\; \sum_{i} dq_{i}\wedge dp_{i}}_{\text{one area element }dq\wedge dp\text{ for each pair }(q_{i},p_{i})}.
$$

The energy $H$ then picks out a unique velocity field $X_{H}$, the **Hamiltonian vector field**, by the single rule \cite[nLab]{nlab_symplectic_manifold}

$$
\underbrace{\iota_{X_{H}}\,\omega \;=\; dH}_{\text{“turn the slope of the energy into a direction”}},
$$

which written out in coordinates is **Hamilton's equations**, $\dot q_{i}=\partial H/\partial p_{i}$ and $\dot p_{i}=-\partial H/\partial q_{i}$ \cite[nLab]{nlab_hamiltonian_mechanics}. The subject is **Hamiltonian mechanics** on a **symplectic manifold** \cite[nLab]{nlab_symplectic_manifold}. The coordinate-free version is cleaner and more general; the "roll downhill" version in the main text is the same thing in one dimension.
</div>
</div>

<div class="md">
## The picture that makes it click

The bead's energy is fixed, so it is locked to one curve. Now draw *every* curve at once — one for each possible energy — and you get one of the most beautiful pictures in all of physics: the **phase portrait** of a pendulum \cite{simple_pendulum_wiki}.

Pull a pendulum a little to the side and let go. In its phase graph (angle across, momentum up — and the angle wraps, so it is a cylinder) it draws:

- **a small swing** → a small closed loop near the bottom. It keeps circling the *same* loop, forever.
- **a bigger swing** → a bigger loop, still closed.
- **just enough to reach the very top** → a knife-edge curve (the *separatrix*). Below it the pendulum swings back and forth; above it, it goes over the top and keeps spinning.

The point: the whole cylinder is "everything that could happen," but a pendulum with a *fixed* energy lives on **one loop**. One number — the energy — selected one thin curve out of all of it, and that loop is where *all* the action is. Everything else on the cylinder is still possible, but the pendulum never visits it.

$$
\boxed{
\text{one number (the energy) selects one thin curve of a huge space —}
\quad\text{and that curve is where everything happens.}
}
$$

An AI's usefulness is the higher-dimensional version of this.

*In one line:* fix the energy → one curve → one slice.
</div>

<div class="md">
## Temperature: when the energy can vary

A frictionless bead sits on one exact curve. But a real, warm system *wobbles* — its energy drifts a little now and then. So the question becomes: **which state does it actually occupy?** One rule answers — the **Boltzmann distribution** \cite{boltzmann_distribution_wiki} \cite{canonical_ensemble_wiki}:

$$
\underbrace{P(q,p)}_{\text{probability of a state}}
\;=\;
\underbrace{e^{-\beta\, H(q,p)}}_{\text{the weight: \emph{small} when the energy }H\text{ is big}}
\;\Big/\;
\underbrace{Z}_{\text{the total of all the weights}}
\qquad\text{with}\qquad
\underbrace{\beta \;=\; \tfrac{1}{\text{temperature}}}_{\text{how “stingy” the system is}}.
$$

In pieces. Each state gets a **weight** $e^{-\beta H}$: a number that *shrinks* as the energy $H$ grows — a penalty for being high up. $\beta$ is the inverse of temperature: cold = stingy (barely leaves the bottom), hot = generous (climbs high). $Z$ is the sum of all the weights, and we divide by it so the probabilities add up to $1$ \cite{partition_function_wiki}. In one line:

$$
\boxed{
\text{low energy} \;\Rightarrow\; \text{likely.} \qquad\qquad \text{high energy} \;\Rightarrow\; \text{almost never.}
}
$$

The high-energy states are not removed — they are still *there*, still part of the space of all possibilities — they have simply been given almost no weight. So the system is found, almost always, in the **low-energy slice**.

**This is the knob on your chatbot.** "Temperature" in a language model is borrowed straight from here. **Low = stingy:** it does almost nothing but the single safest, most likely thing — correct, but dull. **High = generous:** it explores unusual, higher-energy options — some delightful, some nonsense. *Creativity, in this picture, is turning the temperature up* and loosening the selector. (The <a href="samplinglab">Temperature &amp; Sampling</a> chapter turns this knob in detail.)

**And the slice is astonishingly thin.** In a large system the energy barely wobbles at all. Whenever a total is the sum of $N$ independent contributions, the relative size of the wobble is about $1/\sqrt{N}$ — the same fact behind the statistics rule "the bigger the sample, the tighter the average." For a mole of gas ($N\approx6\times10^{23}$ particles) that comes out to

$$
\underbrace{\tfrac{1}{\sqrt{N}} \;\approx\; 10^{-12}}_{\text{“locked to about one part in a trillion”}}.
$$

Not "roughly the same" — *one part in a trillion*.

<div class="optional md" data-headline="The precise statement (for the curious)">
"Thin" can be made exact in two ways. First, the **density of states** counts how much room there is at a given energy \cite{canonical_ensemble_wiki}
$$
\underbrace{\Omega(E) \;=\; \int \delta\!\big(H-E\big)\,dq\,dp}_{\text{“how much room is there at energy }E\text{?”}}
$$
and the system settles where that room (multiplied by the Boltzmann weight) is largest. Second, the thinness is not a guess but a theorem — **concentration of measure** \cite[concentration of measure]{concentration_of_measure_wiki}: in high dimensions the energy of a large system concentrates so tightly around one value that its relative wiggle goes to $0$ like $1/\sqrt{N}$. That result is what lies behind the equivalence of the ensembles of statistical physics.
</div>
</div>

<div class="md">
## What shape is the space?

We have said the phase space can have a shape — wrap-arounds, holes — inherited from the positions. Here is the surprising part: **all of that shape is *global*.**

Stand on the Earth and the ground looks flat. The Earth is not flat; its shape is just too large to see up close. Phase space is the same. Zoom in on it *anywhere* and it looks like ordinary flat space — there is no local "bend" you can find by looking closely. The shape lives only in the large picture: how the space wraps around, whether it has holes, how it fits together. A pendulum's phase space is a cylinder (one wrap-around); free particles' is flat (none) \cite{symplectic_manifold_wiki}. You must see the whole thing to see the shape.

<div class="optional md" data-headline="Three theorems about the shape (the hard part)">
The claim "the shape is all global" has three precise versions, each with its own weight.

**Darboux — there is no *local* shape.** Every symplectic phase space, however bent, looks locally like flat space with one standard area form \cite{symplectic_manifold_wiki}:
$$
\underbrace{\omega \;=\; \sum_{i} dq_{i}\wedge dp_{i}}_{\text{“locally, just flat area elements”}}.
$$
The symplectic version of "the Earth looks flat up close." There is no local curvature to read off by zooming in.

**Liouville — the flow preserves a volume.** The motion is *incompressible*, like an ideal fluid that cannot be squeezed \cite{symplectic_manifold_wiki}:
$$
\underbrace{\mathcal{L}_{X_{H}}\,\omega \;=\; 0}_{\text{“the flow neither stretches nor squeezes area”}}
\;\Longrightarrow\;
\underbrace{\operatorname{vol}(S) \;=\; \operatorname{vol}\bigl(\Phi_{t}(S)\bigr)}_{\text{a cloud of states keeps its volume, always}}.
$$
So the motion cannot collapse onto a single point (that would shrink a volume to zero) — which is one reason it keeps a state *moving on* the slice rather than letting it settle down.

**Arnold — the shape forces a minimum number of rest-states.** On a *closed* phase space $M$, the topology — the number of holes — *lower-bounds* how many rest-states *any* energy placed on it can have \cite{arnold_conjecture_wiki}:
$$
\underbrace{\#\{\text{rest-states}\}}_{\text{fixed points of the motion}}
\;\ge\;
\underbrace{\operatorname{Mor}(M)}_{\text{fewest critical points any height function can have}}
\;\ge\;
\underbrace{\text{(total number of holes of }M)}_{\text{counted in every dimension}}.
$$
No matter how you choose the energy, the topology forces a minimum number of equilibria. The shape of the arena dictates a feature of the motion inside it.
</div>

<div class="optional md" data-headline="Physics phase space vs. the AI “phase space”">
One caution, because it decides what is a theorem and what is a metaphor. A *physical* phase space comes with that symplectic structure — and so gets the Darboux, Liouville, and Arnold results for free. A neural network's input/weight space has **none of that**: no special area form, no incompressible flow, no topological lower bound. It is just a (usually huge) space, and the only structure it carries is what the *data and the loss* put there. So "the AI's phase space" *borrows* the word. The theorems above are true of the physical space; for the machine only the looser idea — "a number picks out a thin slice" — carries over. The analogy is structural, and that is exactly where it earns its keep.
</div>
</div>

<div class="md">
## The same idea, now for a neural network

The bridge is almost word for word. A line of papers by Yann LeCun and co-workers describes a neural network not as a function you feed in and read out, but as an **energy over all its possible inputs and outputs** \cite[LeCun et al., 2007]{lecun2007ebm} \cite[LeCun et al., 1998]{lecun1998gradient}.

Make "configuration" concrete. For a chatbot, a configuration is a **(question, answer) pair**; for an image generator, a **possible picture**. There are a vast number of them. The model assigns one number — an **energy** $E$ — to each one, and training simply does this:

<div class="smart-quote" data-cite="ebm_wiki" data-after="Energy-based model">
Essentially, the model learns a function that associates low energies to correct values, and higher energies to incorrect values.
</div>

Good answers get pushed to *low* energy; bad ones to *high*. The probability is the same Boltzmann rule as before, $P(x)\propto e^{-E(x)}$ \cite{ebm_wiki} \cite[LeCun et al., 2007]{lecun2007ebm}. So the physics picture lands on machines in one stroke:

$$
\boxed{
\begin{aligned}
&\textbf{phase space} &&= \text{all possible (question, answer) pairs / pictures;}\\
&\textbf{energy }E &&= \text{a number training has made \emph{small} on the good, useful ones;}\\
&\textbf{useful slice} &&= \{x : E(x)\text{ is small}\},\ \text{where the model actually \emph{works}.}
\end{aligned}
}
$$

Three verbs do all the work \cite[LeCun et al., 2007]{lecun2007ebm}:

- **Training** = shaping the energy so the good cases sink into low valleys and the rest sits high.
- **Inference** = sliding to the lowest energy: given a question, find the low-energy answer.
- **Usefulness** = the low-energy slice itself.

**It is an old trick.** **Hopfield networks** are literally energy systems that slide down until they park on a stored memory \cite{hopfield1982}; **Boltzmann machines** add temperature and push the good cases down and the rest up \cite[Ackley, Hinton & Sejnowski, 1985]{ackley1985boltzmann}. In both, "the network only makes sense in the low-energy region" is not an accident — it is the *definition*. LeCun returns to it in his 2022 position paper, where the whole proposed brain is a stack of modules each driven to low energy, the "world model" being the low-energy region of all possible world states \cite[LeCun, 2022]{lecun2022autonomous}.

*In one line:* the machine is the same picture — a space of all possibilities, a number (the energy), and a thin low-energy slice where it works.

<div class="optional md" data-headline="What “energy” means for a real LLM (the honest boundary)">
In a modern language model the "energy" is *not* a physical Hamiltonian. There is no conserved quantity, no pendulum swinging, no real temperature in a frozen model at inference. The energy is the **loss** — for a language model, roughly the *surprise* of the tokens (the negative log-likelihood). But its *job* is identical: a single number over all possible (input, output) sequences that training has made small exactly on the sequences that are *coherent, fluent, and in-distribution*. The physics is a *picture of the geometry*, not a claim that a GPU is swinging a pendulum. The rule for the whole course: where the analogy is *structural* it is useful; where it would be *literal*, it is not.
</div>
</div>

<div class="md">
## Why a *slice* — and why it is so thin

So far, the useful states are the *low-energy* ones. Why a thin *slice*, and not "low-energy blobs scattered everywhere"? Because the useful states are not scattered: they lie on a **low-dimensional surface** floating inside the huge space. That is the **manifold hypothesis** \cite[Sindhwani, Belkin & Niyogi, 2006]{sindhwani2006geometric} \cite[manifold learning]{manifold_learning_wiki} — real data, though it lives in a space with a huge number of coordinates, is really controlled by only a few free knobs.

**The face example.** Every photograph of every human face is a point in a giant space of pixel values. But "all faces" is not the whole space — it is a *surface* inside it. Slide smoothly along that surface and you morph one face into another (change the jaw, the eyes, the light), and *every step of the way is still a real face*. The classic picture even has a **hole**: you can go all the way round from "eyes open" to "eyes closed" and back without ever leaving a real face, so the surface is shaped like the inside of a bagel \cite[Olah, 2014]{olah2014manifolds}.

**A number you can feel.** Every scaled-and-rotated image of the letter "A" is a 1,024-number vector, so the space is $\mathbb{R}^{1024}$. You cannot draw 1,024 axes, but the 2-D picture you *can* draw has the same shape — the extra dimensions only make the space bigger and emptier. Only *two* knobs move a letter "A" (size and rotation), so the data sits on a **two-dimensional surface** inside that 1,024-dimensional space \cite[manifold learning]{manifold_learning_wiki}. A language model is more extreme still: the number of possible 100-token answers is $\lvert V\rvert^{100}$ (for a vocabulary of $\lvert V\rvert$); with $\lvert V\rvert=10{,}000$ that is $(10^{4})^{100}=10^{400}$, a 1 followed by four hundred zeros. The observable universe contains only about $10^{80}$ atoms. The space of possible answers has roughly **320 more digits** than there are atoms in the cosmos — and the *grammatical, on-topic* answers are a measure-thin sliver of it. The model works **on that sliver, and only on that sliver.**

<div class="optional md" data-headline="Why “thin” is the right word (for the curious)">
Make "thin" exact. A smooth surface of dimension $k$ sitting inside a space of dimension $N$ (with $k < N$) has **$N$-dimensional measure zero** — the same reason a line has zero *area*. So a point picked uniformly from the full space lands on the slice with probability *exactly* $0$. Usefulness is a knife-edge: the model is right precisely *because* it has been made to live on a measure-zero set, while a random input is right with probability zero.

Two honesty notes. First, it is a *hypothesis*, not a theorem — and it can fail. Fefferman, Mitter and Narayanan wrote a whole paper on how to *test* whether a data set really does lie on a low-dimensional surface, and found the question is genuinely hard to verify, and sometimes the answer is "no" (noise, in particular, *inflates* the apparent dimension) \cite[Fefferman, Mitter & Narayanan, 2016]{fefferman2016testing}. Second, real data is usually not *one* surface but a **union of several** — cats, dogs, cars, each its own sheet \cite[Brown et al., 2023]{brown2023union}. The safe statement is "a low-complexity, low-dimensional region of a huge space" — exactly what we need, and no more.
</div>

**The dynamical-systems version of the same idea.** For a system that *does* lose energy to friction, there is a precise object that plays this role: an **attractor** — a set that nearby trajectories flow onto and then stay on \cite[manifold learning]{manifold_learning_wiki}. Once the transients have decayed, the long-run behaviour is *on* the attractor; the rest of the space is only where the settling-down happens. (The frictionless pendulum is the limiting case with no attractor — it stays on its energy curve forever — which is exactly why the *slice* is the right word.) "The system only really does something on the attractor" is the dynamical-systems form of "the model only works on the slice."
</div>

<div class="md">
## What shape is the slice?

We know the slice is low-energy, low-dimensional, and measure-thin. But what does it actually *look like*? Three pictures — one from physics, one from probability, one from the machine — and they are not rivals; they are three angles on the same slice.

**1. A donut (orderly motion).** When the motion is simple enough — no chaos, just several independent little oscillations — its long-run behaviour winds around a **donut-shaped** surface in phase space, one hole per independent oscillation. That orderly case is the shape named by the **Liouville–Arnold theorem** \cite[Liouville–Arnold]{liouville_arnold_wiki}: one free circle per independent motion, so the slice's *shape* literally counts the independent motions. (A donut and a coffee mug are the same shape once you squish the handle — that is all a "torus" is.)

**2. A thin shell (where the weight sits).** From the temperature section: in a large system the energy locks onto one value to within about $1/\sqrt{N}$. So almost all the probability sits in a thin band around one energy — a **shell**. Here is the paradox, stated cleanly: the slice is *measure-zero* for a uniform random point (nothing is there), yet it carries *essentially all* the weight under the dynamics (everything is there). Empty and full at the same time.

**3. Groves of solutions (what the machine sees).** A trained network's own "phase space" is its *weight space*, with the loss as its energy. A famous study of this landscape \cite[Saxe, McClelland & Ganguli, 2014]{saxe2014deep} found that the set of *best* answers is not a scatter of isolated dots: it has **valleys and flat plains** — structure, not dust. And there is a simple reason it is connected: **rearranging the neurons inside a layer does not change what the network does**, so the same answer is represented by many different weight vectors. The solutions come in whole *families*, forming flat, symmetry-made **groves** rather than a dust of points.

<div class="optional md" data-headline="Three shapes, one slice — which one is “the” shape">
All three describe the same slice from three directions. The **donut** is the shape the *motion* imposes (the geometry of the dynamics). The **shell** is the shape the *probability* imposes (where the weight actually sits — which is where the donut lives, concentrated). The **surface / grove** is the shape *learning* imposes (the low-dimensional, low-energy, symmetry-structured set a trained model is built to live on). Physics gives the donut and the shell as *theorems*; the machine gives the surface and the grove as *empirical, structural* facts. The honest claim is the shared **form** — a thin, low-complexity, low-energy corner of a vast space of possibilities — *not* that a trained network literally is a donut in a 6N-dimensional space.
</div>
</div>

<div class="md">
## What happens when it drifts off the slice

In this language, everything that goes *wrong* is one thing: the input — or the model's internal state — has drifted **off the slice**, into a high-energy region.

- **Out-of-distribution input.** The input is a point the surface does not pass through. The model is asked about something it was never shaped for; the energy there is high and uncontrolled, and the answer is whatever the landscape happens to do there — often *confident* nonsense, because the model has no built-in alarm that it is off-slice.
- **Adversarial examples.** A tiny nudge moves an input just off the surface and, because the energy can change *fast* between two neighbouring valleys, over the rim into a valley with the *wrong* label. The input is *nearly* on the slice; the answer is *completely* off it.
- **Temperature and sampling.** The Boltzmann selector is controlled by temperature. Low: the sampler stays glued to the valleys — almost nothing but the single best answer. High: it wanders up into high-energy regions — you get the incoherent. (See the <a href="samplinglab">Temperature &amp; Sampling</a> chapter.)
- **Hallucination.** The model drifts to a spot that is *locally* low-energy — it sounds smooth and confident, a minimum of its *own* internal energy — but that spot was never created by real data. It is a **fake valley**: a low pocket the data did not put there. This is the "sounds right, isn't true" case, now with a coordinate — the same case the <a href="coherent_world_models">Coherent World Models</a> chapter met as "locally coherent, not true."

$$
\boxed{
\begin{aligned}
&\text{on the slice}\ \Rightarrow\ \text{low energy, coherent, (usually) true;}\\
&\text{off the slice}\ \Rightarrow\ \text{high / uncontrolled energy, incoherent, made up.}
\end{aligned}
}
$$
</div>

<div class="md">
## The whole thing, in one picture

Each row is a narrower slice of the one above it, and the model's *useful* behaviour lives on the bottom rows:

$$
\begin{array}{c|c|c}
\textbf{row} & \textbf{the space} & \textbf{where the system actually is} \\
\hline
\text{full phase space} & \text{every }(q,p)\text{ at once} & \text{all of it} \\
\text{energy slice} & \text{one fixed energy }H & \text{one curve / level set} \\
\text{data surface} & \text{a low-dimensional surface in a huge space} & \text{the useful slice} \\
\text{one run} & \text{one valley / one path} & \text{this particular answer} \\
\end{array}
$$

**How this ties the earlier chapters together.**

- **Coherent Difference** said meaning comes from the *differences* between things, arranged in a space. In this language: that space is the configuration space, and the directions that actually carry meaning are the *data surface inside it*, not the whole space.
- **Coherent World Models** said a model only covers the part of the world it can actually reach (it called that region the "accessible region"). This chapter names and mechanises it: that reachable region *is* the low-energy slice — the part the learned energy makes likely.
- **The Optimizer / loss landscape.** *Training* is exactly the act of shaping the energy: sliding the loss down until the data surface *becomes* the low-energy set. Every step moves the *energy function*, not the data.

$$
\boxed{
\begin{aligned}
&\text{one idea, three chapters:}\\
&\text{meaning is built from differences, the model is a slice of the world,}\\
&\text{and the slice is \emph{picked out} by an energy.}
\end{aligned}
}
$$
</div>

<div class="md">
## In one sentence — and an honest word about it

$$
\boxed{
\begin{aligned}
&\textbf{An AI is not “useful everywhere in its space of possibilities.”}\\
&\textbf{It is useful on one thin, low-energy, low-dimensional slice of it —}\\
&\textbf{the slice its learned energy has made likely.}
\end{aligned}
}
$$

**The honest word.** The physics in this chapter is *exactly true about itself*: the phase space, the energy, conservation, the Boltzmann rule, the thin slice — each is a real fact. The step from physics to a machine is a *metaphor*, not a theorem. What carries over is the **shape** — a single number picking out a tiny, low-complexity corner of a huge space of possibilities. What does *not* carry over is the literal machinery: a frozen language model has no pendulum, no conserved energy, no real temperature. The course's standing rule applies: **a useful analogy is not a theorem.** Where the energy is the loss and the slice is the data surface, that is a precise structural claim. Where it would require a GPU to conserve a Hamiltonian, it is not — and it does not.
</div>
