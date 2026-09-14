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

Ask a modern AI something a little outside what it was trained on, and watch what happens. It does not say "I don't know." It does not hesitate. It *glides* into a smooth, confident answer — to a question it actually has no idea about. The moment it stops being reliable is invisible.

This chapter makes that moment visible. It borrows an idea from physics that is two thousand years old, and that, almost word for word, also describes a neural network:

$$
\boxed{
\begin{aligned}
&\text{An AI only really works in a thin, special slice}\\
&\text{of the huge space of everything it could be asked.}\\
&\text{A single number — its \emph{energy} — draws the line.}
\end{aligned}
}
$$

"Everything it could be asked" is called the **phase space**. The thing that picks out the thin, reliable slice is called the **energy**. We build both from scratch below, using only the math and physics you already have — slopes, energy, a swinging pendulum. The small fold-out boxes marked *for the curious* hold the advanced version; the main text stands on its own, so you can safely skip every box and still follow.
</div>

<div class="md">
## To describe a moving thing, you need two numbers

**"Where" is not the same as "where it's going."** Put a bead on a wire. Tell me where it is along the wire — fine, I can point to it. But I still can't predict its future: at that very spot it could be resting, or flying straight through. Same place, two completely different stories.

So to pin down a moving thing, you need *two* numbers together:

- **where** it is (a position), and
- **how it's moving** (a speed, and a direction).

Physicists call the second one the **momentum** $p$ — for something with mass $m$ it is just mass times velocity, $p = m\,v$. A **state** is the pair "where + how moving." The set of all the "where's" is called the *configuration space* \cite[nLab]{nlab_configspace_physics}; if you glue a "how moving" onto each one, the result is the **phase space** — simply *all the states at once*, every possible place paired with every possible motion \cite[nLab]{nlab_phasespace}. (Its formal name is the *cotangent bundle* $T^{*}Q$; don't worry about that word — the picture above is the whole content.) You can't copy a system by copying where things are; you have to copy where they are *going* too.

**Now the key picture.** For our single bead, a state is one point in a flat graph — position across the bottom, momentum up the side. The bead's entire life is a *path traced inside that graph*, and at any instant it sits at exactly one point of it. Draw the graph and you can see, at a glance, what the bead will do next. (One bead → a 2-D graph. $N$ particles → $6N$ numbers, three "where" and three "how moving" each. The idea doesn't change.)

**The space can have a shape.** The "where" part might itself be curved or wrapped. A straight wire gives a flat space. But hang the bead from a string and you have a **pendulum** \cite{simple_pendulum_wiki}: its "where" is an *angle* that wraps all the way around and comes back to itself. So the position part is a circle, and the whole phase space is a **cylinder** — angle around, momentum up \cite{symplectic_manifold_wiki}. The "space of everything possible" can therefore have wrap-arounds and holes, inherited from the thing being modelled.

$$
\boxed{
\text{phase space} \;=\; \text{“every place, paired with every way of moving.”}
}
$$
</div>

<div class="md">
## Energy: the one number that runs everything

**The Hamiltonian is just the total energy.** There is a name for the single number that assigns an amount to every state — the **Hamiltonian** $H$ — and for anything that moves it is exactly the total energy \cite[nLab]{nlab_hamiltonian_mechanics}:

$$
\underbrace{H}_{\text{total energy}}
\;=\;
\underbrace{\tfrac{1}{2}\,m\,v^{2}}_{\text{kinetic: the “how fast” part}}
\;+\;
\underbrace{V(q)}_{\text{potential: the “where it costs” part}}.
$$

You already know both halves. **Kinetic energy** $\tfrac{1}{2}mv^{2}$ is the energy of motion — more of it when the thing moves faster. **Potential energy** $V$ is stored energy from a position — a ball held high has more, a stretched spring has more. Add the two and you have one number: the state's energy.

**Picture it as a landscape.** Lay the position axis out as the ground, and let $V$ be the height of some hilly terrain. The bead is a ball resting on that terrain. **Kinetic energy is how fast it is rolling; potential energy is how high up it is.** That's the entire picture.

**The rule of motion is just "roll downhill."** The ball speeds up going down the slope, slows going up, and turns around at the top. Written down, this is exactly Newton's laws rearranged:

$$
\underbrace{v \;=\; \frac{p}{m}}_{\text{speed is momentum divided by mass}}
\qquad\text{and}\qquad
\underbrace{\frac{dp}{dt} \;=\; -\,V'(q)}_{\text{momentum changes by the \emph{slope} of the terrain — it rolls downhill}}.
$$

That minus sign *is* the physics: the ball always moves the way the terrain slopes down.

**The energy never changes — so the bead is trapped on one curve.** With no friction, the total energy $H$ is *conserved*: the bead can trade kinetic for potential and back, but the sum never changes. So it can never climb off the one curve in the phase graph where the energy equals its starting value. That curve is the **energy slice**:

$$
\underbrace{\{\,(q,p)\;:\;H(q,p)=E\,\}}_{\text{“all the states that cost exactly the energy }E\text{” }=\text{ one curve in the phase graph}}.
$$

Even the freest system in the universe is, from the moment it starts, confined to a single slice. Everywhere else is where it *cannot* be.

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

Because the energy is fixed, the bead is welded to one curve. Now draw *all* the curves at once — one for every possible energy — and you get one of the most beautiful pictures in all of physics: the **phase portrait** of a pendulum \cite{simple_pendulum_wiki}.

Hold a pendulum a little to the side and let go. In its phase graph (angle across, momentum up — and the angle wraps, so it's a cylinder) it traces:

- **A small swing:** a small closed loop near the bottom. It goes back and forth on the *same* loop, forever.
- **A bigger swing:** a bigger loop. Still closed.
- **Just enough to reach the very top:** a special knife-edge curve (the *separatrix*). Below it the pendulum swings back and forth; above it, it goes all the way over the top and keeps spinning.

Here is the quiet magic. The whole cylinder is "everything that could happen." But a pendulum with a *fixed* energy lives on **one loop** inside it. One number — the energy — picked out one thin curve, and that curve is where *all* the action is. Everything else on the cylinder is still possible, but the pendulum will never touch it.

$$
\boxed{
\text{one number (the energy) picks one thin curve out of a huge space —}
\quad\text{and that curve is where everything happens.}
}
$$

An AI's usefulness is a higher-dimensional version of exactly this picture.
</div>

<div class="md">
## Temperature: when the energy is allowed to wiggle

A frictionless bead sits on one exact curve. But a real, warm system *wiggles* — its energy drifts a little now and then. Then the question becomes: **which state does it actually sit in?** The answer is one rule, the **Boltzmann distribution** \cite{boltzmann_distribution_wiki} \cite{canonical_ensemble_wiki}:

$$
\underbrace{P \;=\; \frac{e^{-\beta H}}{Z}}_{\text{probability of a state}}
\qquad\text{where}\qquad
\underbrace{\beta \;=\; \tfrac{1}{\text{temperature}}}_{\text{how “stingy” the system is}}.
$$

Read it plainly. Every state gets a **weight** $e^{-\beta H}$: the bigger its energy $H$, the *smaller* its weight. $Z$ is just the total of all the weights, and we divide by it so the probabilities add up to $1$ (the **partition function** \cite{partition_function_wiki}). That's the whole rule:

$$
\boxed{
\text{low energy} \;\Rightarrow\; \text{likely.} \qquad\qquad \text{high energy} \;\Rightarrow\; \text{almost never.}
}
$$

The high-energy states are not deleted — they are still *there*, still part of the space of all possibilities — they have just been given almost no weight. So the system is found, almost always, in the **low-energy slice**.

**This is the knob on your chatbot.** "Temperature" in a language model is borrowed straight from here. **Low temperature = stingy:** it does almost nothing but the single safest, most-likely thing — correct, but dull. **High temperature = generous:** it explores, trying unusual, higher-energy things — some delightful, some nonsense. *Creativity, in this picture, is literally turning the temperature up* and letting the selector relax. (The <a href="samplinglab">Temperature &amp; Sampling</a> chapter turns this knob in detail.)

**And the slice is astonishingly thin.** In a big system the energy barely wiggles at all. Whenever a total is the sum of $N$ independent little contributions, the size of the wiggle is about $1/\sqrt{N}$ — the same fact behind the statistics rule "the bigger the sample, the tighter the average." For a mole of gas ($N\approx6\times10^{23}$ particles) that comes out to

$$
\underbrace{\tfrac{1}{\sqrt{N}} \;\approx\; 10^{-12}}_{\text{“pinned to about one part in a trillion”}}.
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

We've said the phase space can have a shape — wrap-arounds, holes — inherited from the positions. Here is the surprising part: **all of that shape is *global*.**

Stand on the Earth and the ground looks flat. That does not mean the Earth is flat — it means its shape is too big to see up close. Phase space is the same. Zoom in on it *anywhere* and it looks like ordinary flat space; there is no local "bend" you can find by looking closely. The shape lives only in the big picture — how the space wraps around, whether it has holes, how it fits together. A pendulum's phase space is a cylinder (one wrap-around); free particles' is flat (none) \cite{symplectic_manifold_wiki}. You have to see the whole thing to see the shape.

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

Here is the bridge, and it is almost word for word. A line of papers by Yann LeCun and co-workers describes a neural network not as a function you feed in and read out, but as an **energy over all its possible inputs and outputs** \cite[LeCun et al., 2007]{lecun2007ebm} \cite[LeCun et al., 1998]{lecun1998gradient}.

Take the space of every possible configuration — for a classifier, every (input, label) pair; for a generator, every possible input — and put one number, an **energy** $E(x)$, on each point. The whole paper is really one sentence:

<div class="smart-quote" data-cite="ebm_wiki" data-after="Energy-based model">
Essentially, the model learns a function that associates low energies to correct values, and higher energies to incorrect values.
</div>

The probability is the same Boltzmann rule as before, $P(x)\propto e^{-E(x)}$ \cite{ebm_wiki} \cite[LeCun et al., 2007]{lecun2007ebm}. So the physics picture lands on machines in one stroke:

$$
\boxed{
\begin{aligned}
&\textbf{phase space} &&= \text{all possible inputs / (input, output) pairs;}\\
&\textbf{energy }E &&= \text{a number the training has made \emph{small} on the good, useful ones;}\\
&\textbf{useful slice} &&= \{x : E(x)\text{ is small}\},\ \text{where the model actually \emph{works}.}
\end{aligned}
}
$$

Three verbs do all the work \cite[LeCun et al., 2007]{lecun2007ebm}:

- **Training** = shaping $E$ so the good cases sink into low-energy valleys and everything else sits high.
- **Inference** = sliding to the lowest energy: given part of an input, find the low-energy completion.
- **Usefulness** = the low-energy slice itself.

**It is an old trick in the field.** **Hopfield networks** literally *are* energy systems: the dynamics slide the state down the energy until it parks in a minimum — a stored memory \cite{hopfield1982}. **Boltzmann machines** add temperature: the state is drawn from the Boltzmann rule, and learning pushes the good cases down and the rest up \cite[Ackley, Hinton & Sejnowski, 1985]{ackley1985boltzmann}. In both, "the network only makes sense in the low-energy region" is not an accident — it is the *definition*. LeCun returns to it in his 2022 position paper, where the whole proposed brain is a stack of modules each driven toward low energy, the "world model" being the low-energy region of all possible world states \cite[LeCun, 2022]{lecun2022autonomous}.

<div class="optional md" data-headline="What “energy” means for a real LLM (the honest boundary)">
In a modern language model the "energy" is *not* a physical Hamiltonian. There is no conserved quantity, no pendulum swinging, no real temperature in a frozen model at inference. The energy is the **loss** — for a language model, roughly the *surprise* of the tokens (the negative log-likelihood). But its *job* is identical: a single number over all possible (input, output) sequences that training has made small exactly on the sequences that are *coherent, fluent, and in-distribution*. The physics is a *picture of the geometry*, not a claim that a GPU is swinging a pendulum. The rule for the whole course: where the analogy is *structural* it is useful; where it would be *literal*, it is not.
</div>
</div>

<div class="md">
## Why a *slice* — and why it is so thin

So far: the useful states are the *low-energy* ones. But why a thin *slice*, and not "low-energy blobs scattered all over the place"? Because the useful states are not scattered. They lie on a **low-dimensional surface** floating inside the huge space. That is the **manifold hypothesis** \cite[Sindhwani, Belkin & Niyogi, 2006]{sindhwani2006geometric} \cite[manifold learning]{manifold_learning_wiki}: real data, though it lives in a space with a huge number of coordinates, is really controlled by only a few free knobs.

**The face example — the most vivid one.** Take every photograph of every human face. Each is a point in a giant space of pixel values. But "all faces" is not the whole space — it is a *surface* floating inside it. Slide smoothly along that surface and you morph one face into another (change the jaw, the eyes, the light), and *every step of the way is still a real face*. The classic picture even has a **hole** in it: you can go all the way around from "eyes open" to "eyes closed" and back, never leaving a real face — the surface is shaped like the inside of a bagel \cite[Olah, 2014]{olah2014manifolds}.

**A number you can feel.** Every scaled-and-rotated picture of the letter "A" is a 1,024-number vector, so the space is $\mathbb{R}^{1024}$. But only *two* knobs actually move — size and rotation. The data sits on a **two-dimensional** surface inside a 1,024-dimensional space \cite[manifold learning]{manifold_learning_wiki}. For a language model it is more extreme still: the number of possible 100-token answers is $\lvert V\rvert^{100}$ (with $\lvert V\rvert$ words in the vocabulary) — for $\lvert V\rvert=10{,}000$ that is $(10^{4})^{100}=10^{400}$, a 1 followed by four hundred zeros. The observable universe contains only about $10^{80}$ atoms. The space of possible answers has roughly **320 more digits** than there are atoms in the cosmos. The answers that are *grammatical and on-topic* are a measure-thin sliver of it. The model works **on that sliver — and only on that sliver.**

<div class="optional md" data-headline="Why “thin” is the right word (for the curious)">
Make "thin" exact. A smooth surface of dimension $k$ sitting inside a space of dimension $N$ (with $k < N$) has **$N$-dimensional measure zero** — the same reason a line has zero *area*. So a point picked uniformly from the full space lands on the slice with probability *exactly* $0$. Usefulness is a knife-edge: the model is right precisely *because* it has been made to live on a measure-zero set, while a random input is right with probability zero.

Two honesty notes. First, it is a *hypothesis*, not a theorem — and it can fail. Fefferman, Mitter and Narayanan wrote a whole paper on how to *test* whether a data set really does lie on a low-dimensional surface, and found the question is genuinely hard to verify, and sometimes the answer is "no" (noise, in particular, *inflates* the apparent dimension) \cite[Fefferman, Mitter & Narayanan, 2016]{fefferman2016testing}. Second, real data is usually not *one* surface but a **union of several** — cats, dogs, cars, each its own sheet \cite[Brown et al., 2023]{brown2023union}. The safe statement is "a low-complexity, low-dimensional region of a huge space" — exactly what we need, and no more.
</div>

**In the pendulum language:** the low-energy slice is like a surface that nearby paths flow *onto* and then stay on — an **attractor** \cite[manifold learning]{manifold_learning_wiki}. Once the dust settles, the system is *on* the surface; the rest of the space is only where the settling-down happens. "The system only really does something on the attractor" is the phase-space form of "the model only works on the slice."
</div>

<div class="md">
## What shape is the slice?

We've said the slice is low-energy, low-dimensional, and measure-thin. But what does it actually *look like*? Three pictures — one from physics, one from probability, one from the machine — and they are not rivals; they are three angles on the same slice.

**1. A donut (when the motion is orderly).** When a system's motion is simple enough — no chaos, just several independent little oscillations — its long-run behaviour winds around a **donut-shaped** surface in phase space, one hole per independent oscillation. That orderly case is the shape named by the **Liouville–Arnold theorem** \cite[Liouville–Arnold]{liouville_arnold_wiki}: one free circle per independent motion, so the slice's *shape* literally counts the independent motions. (A donut and a coffee mug are the same shape, once you squish the handle — that is all a "torus" is.)

**2. A thin shell (where the weight sits).** We saw in the temperature section that in a big system the energy locks onto one value to within about $1/\sqrt{N}$. So almost all the probability sits in a thin band around one energy — a **shell**. Here is the lovely paradox: the slice is *measure-zero* for a uniform random point (nothing is there), yet it carries *essentially all* the weight under the dynamics (everything is there). Empty and full at the same time.

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
\text{full phase space} & \text{every place + every way of moving} & \text{all of it} \\
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
