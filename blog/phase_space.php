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

Try a modern AI on something a little outside what it was trained on, and watch what it does. It does not shrug. It does not say "I don't know." It *slides off* into fluent, confident invention — a plausible-sounding answer to a question it has no business answering. The failure is so smooth that it's easy to miss the moment it happened.

This chapter finds that moment, and gives it a coordinate. The idea is old — two thousand years of physics — and it transfers to machines almost verbatim. An AI is useful only in a thin, low-energy slice of the space of all its possible inputs and outputs. Everything else in that space is still *possible* — but essentially empty. The word for the full space is **phase space**; the word for the thing that carves out the slice is **energy**.

We build both from scratch below. No prior physics, and every equation gets a plain-English gloss on its key symbols.

$$
\boxed{
\begin{aligned}
&\text{An AI's \emph{phase space} is the space of \emph{all} of its}\\
&\text{possible inputs and outputs. Usefulness is not a property}\\
&\text{of that space; it is a property of a thin low-energy slice of it.}
\end{aligned}
}
$$

Everything below earns that sentence.
</div>

<div class="md">
## Start here: what it takes to fully describe a moving system

**Where something is is not the same as where it is going.** Put a bead on a wire. Tell me its *position* $x$ along the wire — fine, I can point to it. But I still can't predict its future: at that exact spot it could be resting, or racing straight through. Same $x$, two very different lives.

So a full description of a moving thing needs two numbers *at once*:

- a **position** $q$ — where it is;
- a **momentum** $p$ — how it is moving (speed, and which way).

A **state** is the pair $(q,p)$. The **phase space** is the set of *all* states — every position with every possible motion glued to it, laid out at once, before anything has been ruled out \cite[nLab]{nlab_configspace_physics} \cite[nLab]{nlab_phasespace}. You cannot copy a system by copying where things are; you have to copy where they are *going* too.

**Watch one bead.** Let a bead slide on a one-dimensional wire. Its state is a single point $(x,p)$ in a **two-dimensional plane** — position across, momentum up. Its whole life is a *curve traced inside that plane*, and at any instant it sits at exactly one point of it. That one picture — one point wandering a plane of all-possible-states — is the entire idea. (The plane *is* the phase space.)

Scale it up. $N$ particles in ordinary 3-D space have three positions and three momenta each, so the phase space is $\mathbb{R}^{6N}$: every position and every momentum, side by side. The phase space of the *whole universe* — one axis for the position of every atom, one for its momentum — is a dimension you cannot even write down. For a neural network, "position" is the arrangement of its weights plus the (input, output) it is handed; its phase space is the space of all of those.

**The shape is inherited from the positions.** The momenta sit *on top of* the positions, one little vector space of motions at each position. So the phase space "remembers" the shape of the position space, plus a direction. Flat positions give a flat (just bigger) phase space. But if the position has a wrap-around — the angle of a **pendulum**, which is really just a bead on a curved wire \cite{simple_pendulum_wiki} — the position wraps around while the momentum does not, and the phase space becomes a **cylinder** \cite{symplectic_manifold_wiki}. The "space of all possibilities" can therefore carry holes and wrap-arounds, inherited from the thing being modelled. Formally the phase space is the **cotangent bundle** $T^{*}Q$ of the position space $Q$:

$$
\underbrace{T^{*}Q}_{\text{“positions, each with a momentum glued on”}}
\;=\;
\underbrace{\bigl\{\, (q,p)\;:\; q\in \underbrace{Q}_{\text{all positions}},\; p\in \underbrace{T^{*}_{q}Q}_{\text{momenta at that position}} \,\bigr\}}_{\text{a state }=\text{ a position \emph{plus} how it is moving}}.
$$

$$
\boxed{
\text{phase space} \;=\; \text{“every position, with every possible motion at that position.”}
}
$$
</div>

<div class="md">
## The Hamiltonian: the one number that runs the system

**What is a Hamiltonian?** One number assigned to every state. For a moving mechanical thing, that number is just the **total energy** of the state \cite[nLab]{nlab_hamiltonian_mechanics}:

$$
\underbrace{H(q,p)}_{\text{the energy of a state}}
\;=\;
\underbrace{\tfrac{1}{2m}\,\lVert p\rVert^{2}}_{\text{kinetic: the price of \emph{moving fast}}}
\;+\;
\underbrace{V(q)}_{\text{potential: the price of \emph{where you are}}}.
$$

Read the two pieces like a landscape. **Potential** energy $V(q)$ is the *shape of the terrain*: a ball held high, a stretched spring, a bead high on a wire — all *cost*. **Kinetic** energy is how fast you are moving *through* that terrain — zero at rest, large when racing ($\tfrac{1}{2}m\lVert v\rVert^{2}$, and with momentum $p=mv$ that is $\tfrac{1}{2m}\lVert p\rVert^{2}$). Add terrain-cost to motion and you have one number: the state's energy. *That* is the **Hamiltonian** $H$ — think of it as the height in a landscape the state is always trying to stay low in.

**The Hamiltonian manufactures the motion.** Given $H$, the rules of motion are two short lines, **Hamilton's equations** \cite[nLab]{nlab_hamiltonian_mechanics}:

$$
\underbrace{\dot q_{i} \;=\; +\,\frac{\partial H}{\partial p_{i}}}_{\text{position moves the way energy \emph{rises} with momentum}}
\;\;\text{and}\;\;
\underbrace{\dot p_{i} \;=\; -\,\frac{\partial H}{\partial q_{i}}}_{\text{momentum moves the way energy \emph{falls} with position}}.
$$

**Feel it with the bead.** Write $H=\tfrac{1}{2m}p^{2}+V(x)$. The first line gives $\dot x = \partial H/\partial p = p/m$: the bead moves at exactly the speed its momentum says. The second gives $\dot p = -\,\partial H/\partial x = -V'(x)$: its momentum changes by the *slope of the terrain* — it accelerates *downhill*, slows *uphill*. So the bead rolls to the bottom, overshoots, slows, and comes back: a swing, with the $+$ and the $-$ as the two halves of a tug-of-war. *Things drift toward what they want (low potential) and are turned around by what holds them (the slope).* That give-and-take is the whole subject, written down.

**Energy is conserved, so the bead is trapped on a slice.** With no friction, the total $H$ never changes as it swings. So the bead cannot climb off the one surface it began on: it stays on the **energy shell**

$$
\underbrace{\{\, (q,p)\;:\;H(q,p)=E\,\}}_{\text{“all the states that cost exactly the energy }E\text{”}}.
$$

Even the freest physical system is *already confined to a slice*. The rest of phase space is where it *cannot be*.

<div class="optional md" data-headline="The coordinate-free version (for the curious)">
The two coordinate lines above have a form that does not depend on choosing coordinates at all, and it is the cleanest statement in the subject. Phase space carries a canonical area form, the **symplectic form** $\omega$, built from the **canonical (Liouville) 1-form** $\theta$ \cite[nLab]{nlab_phasespace} \cite[nLab]{nlab_symplectic_manifold}:

$$
\underbrace{\theta \;=\; \sum_{i} p_{i}\,dq_{i}}_{\text{each momentum }p_{i}\text{ is the covector measuring “change in position }q_{i}\text{”}}
\qquad\Longrightarrow\qquad
\underbrace{\omega \;=\; -\,d\theta \;=\; \sum_{i} dq_{i}\wedge dp_{i}}_{\text{an infinitesimal area element }dq\wedge dp\text{ for every pair }(q_{i},p_{i})}.
$$

The Hamiltonian $H$ then determines a unique velocity field $X_{H}$ — the **Hamiltonian vector field** — by the single rule \cite[nLab]{nlab_symplectic_manifold}:

$$
\underbrace{\iota_{X_{H}}\,\omega \;=\; dH}_{\text{“turn the gradient of the energy into a direction”}}.
$$

Hamilton's equations are just this rule written out in coordinates. A phase space with this structure is a **symplectic manifold**, and the study of its motion is **Hamiltonian mechanics** \cite[nLab]{nlab_symplectic_manifold} \cite[nLab]{nlab_hamiltonian_mechanics}.
</div>
</div>

<div class="md">
## Watch the bead move — the picture that makes it click

Because the bead's energy $H$ is fixed, it is welded to one energy shell — and when you draw *all* the shells on the phase plane, you get one of the most beautiful pictures in all of physics: the **phase portrait** of a pendulum \cite{simple_pendulum_wiki}.

Picture the plane: position $x$ across — and because the bead's position wraps around a circle, the left and right edges are really glued, so the plane is a cylinder — with momentum $p$ up. Now trace every possible energy level as a curve:

- **Low energy.** Small closed ovals near the bottom — the bead swings a little, back and forth. Each oval is *one* energy shell: a bead starting on it stays on it, forever, tracing the same loop.
- **Higher energy.** Bigger ovals — wider swings. Still closed, still one shell each.
- **Just enough to reach the top.** A knife-edge curve called the **separatrix**: the bead can climb to the very top and hover there forever. It divides the small swings (below) from the big rounds (above).
- **More than that.** The bead goes *over the top* and keeps going — it spins around the cylinder instead of swinging. These are the open, wrapping orbits.

Now look at what this has quietly done. The "space of all possibilities" is the whole cylinder. But the bead — at a fixed energy — lives on **one closed curve** inside it. *That curve is the slice.* Everything else on the cylinder is still *there*, still *possible* — but the bead will never visit it. One number, $E$, selected one thin loop out of an enormous space, and that loop is where all the action is.

$$
\boxed{
\text{one number (the energy) selects one thin curve out of a vast space —}
\qquad\text{and that curve is where everything happens.}
}
$$

Everything about an AI's usefulness is a higher-dimensional version of this picture.
</div>

<div class="md">
## Temperature: when the energy is not pinned down

A bead in a frictionless field sits on one exact shell $H=E$. But a real system in a warm bath is *not* at one energy — it sloshes around, sometimes higher, sometimes lower. How is the state chosen? By one formula, the **Boltzmann (canonical) distribution** \cite{boltzmann_distribution_wiki} \cite{canonical_ensemble_wiki}:

$$
\underbrace{P(q,p) \;=\; \frac{e^{-\beta\, H(q,p)}}{Z}}_{\text{the probability of a state}}
\quad=\quad
\underbrace{e^{-\beta\, H(q,p)}}_{\text{the selector: }H\text{ small}\Rightarrow\text{ weight}\approx1;\ H\text{ large}\Rightarrow\text{ weight}\approx0}
\;\Big/\;
\underbrace{Z \;=\; \int e^{-\beta\, H(q,p)}\,dq\,dp}_{\text{the normaliser: total weight of \emph{everything}, forcing the probabilities to add to }1}.
$$

Here $\beta = 1/(k_{B}T)$ is the **inverse temperature** (bigger $T$, smaller $\beta$, more willing to climb), and $Z$ is the **partition function** \cite{partition_function_wiki} — the total weight of the whole space, present only so the probabilities sum to one. The whole argument of this chapter is sitting in that formula:

$$
\boxed{
\text{low energy} \;\Rightarrow\; \text{high probability}; \qquad\qquad \text{high energy} \;\Rightarrow\; \text{almost never.}
}
$$

The factor $e^{-\beta H}$ is a *selector*. It does not delete the high-energy part of phase space — that part is still *there*, still part of the space of all possibilities — but it assigns it vanishing weight. The system is found, with overwhelming probability, in the **low-energy slice**; everything else is *possible* but *empty*.

**"Temperature" is the knob you already know.** This is exactly the temperature on a chatbot, borrowed straight from here. **Low temperature: stingy** — the selector barely relaxes, so the system does almost nothing but the single lowest-energy thing: safe, and repetitive. **High temperature: generous** — the selector relaxes and the system explores, trying weird, high-energy states: some surprising, some nonsense. *Creativity, in this picture, is literally raising the temperature* and letting the selector loosen. (The <a href="samplinglab">Temperature &amp; Sampling</a> chapter turns this knob in detail.)

**How thick is the slice?** The **density of states** counts how much room there is at a given energy \cite{canonical_ensemble_wiki}:

$$
\underbrace{\Omega(E) \;=\; \int \delta\!\big(H(q,p)-E\big)\,dq\,dp}_{\text{“how much room there is at energy }E\text{” }=\text{ the thickness of the shell }H=E}.
$$

The system settles where there is the most room to sit: the typical energy is where $\Omega(E)$ — or, in the warm case, $\Omega(E)\,e^{-\beta E}$ — is largest. And in a big system that "typical energy" is *pinned* to a single value with astonishing precision. For a mole of gas ($N\approx6\times10^{23}$ particles) the relative wiggle in the total energy is about

$$
\underbrace{\frac{\sqrt{\operatorname{Var}(H)}}{\mathbb{E}[H]} \;\sim\; \frac{1}{\sqrt{N}} \;\approx\; 10^{-12}}_{\text{“the energy is pinned to about one part in a trillion”}}.
$$

Not "roughly the same" — *one part in a trillion*. So:

$$
\boxed{\text{the living part of phase space is a thin slice, selected by energy.}}
$$
</div>

<div class="md">
## What shape is the space — and what can be said about it

So far phase space has been *described*. Now the sharper question: what is its **shape**, and what can actually be *proved* about it?

**The main line, in plain terms.** The shape is inherited from the position space, and — here is the surprise — it is all *global*. Stand on the Earth and the ground looks flat. That does not mean the Earth has no shape; it means the shape is too big to see up close. Phase space is the same: zoom in on it at *any* point and you see flat space with one standard form — there is nothing local, no curvature, to read off by looking closely. All the shape that exists lives in the *large-scale* structure: how the space wraps around, whether it has holes, how it fits together. A pendulum's phase space is a cylinder (one wrap-around); a set of free particles' is flat and open (none). The "space of all possibilities" can carry holes and wrap-arounds, and those are what the geometry of the thing being modelled dictates \cite{symplectic_manifold_wiki}. The three results that pin this down are the hard part, so they are tucked away:

<div class="optional md" data-headline="Three theorems about the shape (the hard part)">
Each of the three has a different weight.

**Darboux — there is no *local* shape.** Every symplectic manifold, no matter how bent, looks — near every point — exactly like flat space with one standard form \cite{symplectic_manifold_wiki}:

$$
\underbrace{\omega \;=\; \sum_{i} dq_{i}\wedge dp_{i}}_{\text{“everywhere, phase space is a stack of flat little area elements }dq\wedge dp\text{”}}.
$$

This is the symplectic version of "the Earth looks flat up close." A symplectic manifold has **no local invariant** — no curvature to read off by zooming in. So:

$$
\boxed{
\begin{aligned}
&\text{Phase space has no local shape. Every neighbourhood looks identical.}\\
&\text{All of its shape is \emph{global} — in how the space wraps, and in its topology.}
\end{aligned}
}
$$

**Liouville — the flow preserves a volume.** The symplectic form defines a canonical volume, and the motion *preserves* it — the dynamics are incompressible, like an ideal fluid with no way to be squeezed \cite{symplectic_manifold_wiki}:

$$
\underbrace{\mathcal{L}_{X_{H}}\,\omega \;=\; 0}_{\text{“the motion neither stretches nor squeezes the area form”}}
\quad\Longrightarrow\quad
\underbrace{\operatorname{vol}\bigl(S\bigr) \;=\; \operatorname{vol}\bigl(\Phi_{t}(S)\bigr)}_{\text{a cloud of states keeps exactly its phase-space volume, for all time }t}.
$$

A direct consequence: the flow cannot collapse onto a point (that would shrink a volume to zero). This is one reason the *dynamics* keep a state moving *on* the shell rather than letting it settle into a single configuration.

**Arnold — the shape forces a minimum number of rest-states.** On a *closed* phase space $M$, the topology — the counts of holes in each dimension — *lower-bounds* the number of fixed points (and, in the periodic form, of periodic orbits) of *any* Hamiltonian placed on it \cite{arnold_conjecture_wiki}:

$$
\boxed{
\underbrace{\#\{\text{fixed points of }X_{H}\}}_{\text{how many rest-states the motion admits}}
\;\ge\;
\underbrace{\operatorname{Mor}(M)}_{\text{fewest critical points any height function on }M\text{ can have}}
\;\ge\;
\underbrace{\sum_{i=0}^{2n}\dim H_{i}(M)}_{\text{the total number of holes of }M\text{, counted in every dimension}}.
}
$$

In words: **no matter how you choose the energy, the system cannot have fewer equilibria — or periodic orbits — than the topology demands.** The shape of the arena provably dictates a feature of the motion inside it.
</div>

<div class="optional md" data-headline="Where the physics phase space is richer than the AI 'phase space'">
Hold this distinction, because it decides what is a theorem and what is a lens. A *physical* phase space $T^{*}Q$ arrives equipped with a canonical symplectic form — and therefore with Darboux flatness, a Liouville volume, and the Arnold constraint. A neural network's *configuration / input space* has **none of that**: no canonical $\omega$, no incompressible flow, no topological lower bound on its critical points. It is just a (usually high-dimensional, noncompact) space, and the only structure it carries is what the *data and the loss* put there. So when this course says "the AI's phase space," it is *borrowing the word*. The rigorous shape theorems above apply to the physical $T^{*}Q$; to the machine, only the looser statement — "a scalar field selects a thin slice" — carries over. The analogy is *structural*, and that is exactly where the word earns its keep.
</div>
</div>

<div class="md">
## The LeCun energy paper

**The turn to machines.** The bridge from physics to neural networks is a short line of papers by Yann LeCun and collaborators, in which a neural network is described not as a function you evaluate but as an **energy function over a space of configurations** \cite[LeCun et al., 2007]{lecun2007ebm} \cite[LeCun et al., 1998]{lecun1998gradient}.

The move is the physics move, verbatim. Take the space of all configurations a system could be in — for a classifier, the pairs (input, label); for a generator, all possible inputs — and put a scalar **energy** $E(x)$ on every point of it. The paper lives on one sentence:

<div class="smart-quote" data-cite="ebm_wiki" data-after="Energy-based model">
Essentially, the model learns a function that associates low energies to correct values, and higher energies to incorrect values.
</div>

The probability over configurations is again Boltzmann, $P(x)\propto e^{-E_{\theta}(x)}$, normalised by a partition function $Z = \sum_{x} e^{-E_{\theta}(x)}$ \cite{ebm_wiki} \cite[LeCun et al., 2007]{lecun2007ebm}. And that is the "phase-space selection of useful spaces" in a single stroke:

$$
\boxed{
\begin{aligned}
&\textbf{phase space} &&=\; \text{the space of \emph{all} configurations (all inputs, all (input, output) pairs);}\\
&\textbf{energy }E_{\theta} &&=\; \text{the learned scalar, \emph{sculpted} to be low on the useful/correct/data-like ones;}\\
&\textbf{useful slice} &&=\; \{x : E_{\theta}(x) \text{ is small}\},\ \text{the region where the model actually \emph{works}.}
\end{aligned}
}
$$

Three verbs do all the work \cite[LeCun et al., 2007]{lecun2007ebm}:

- **Training = sculpting** $E_{\theta}$ so that the data sit in low-energy basins and the rest of the space sits high.
- **Inference = minimising** $E_{\theta}$: given a partial input, find the low-energy completion.
- **Usefulness = the low-energy slice** — the set of configurations the sculpted energy has made probable.

**The idea is old inside the field.** **Hopfield networks** are literally physical systems: the weights define an energy, and the dynamics *descend* that energy until the state settles into a minimum — a stored memory \cite{hopfield1982}. **Boltzmann machines** add the temperature: the state is drawn from the Boltzmann distribution over configurations, and learning pushes the data *down* in energy and everything else *up* \cite[Ackley, Hinton & Sejnowski, 1985]{ackley1985boltzmann}. In both, "the network only makes sense in the low-energy region" is not an accident; it is the *definition*.

LeCun returns to the energy point in his 2022 position paper, where the whole proposed intelligence is a hierarchy of modules each driven toward low energy, the "world model" being the low-energy region of the space of all possible world states \cite[LeCun, 2022]{lecun2022autonomous}. The slogan of that paper — *find the lowest-energy state consistent with what you observe* — is the Boltzmann selector rewritten as an engineering goal.

<div class="optional md" data-headline="What 'energy' means for a modern LLM (honest boundary)">
In a modern large language model the "energy" is *not* a physical Hamiltonian. There is no symplectic form, no conserved quantity, no Hamilton's equations, no literal temperature in a frozen model at inference. The energy is the **loss** — for a language model, the (negative) log-likelihood of the tokens, summed over a sequence. But its *structural* role is identical: a scalar field over the space of all possible (input, output) sequences that training has made small exactly on the sequences that are *coherent, fluent, factual, and in-distribution*. The physics is a *model of the geometry*, not a claim that a GPU integrates Hamiltonian flow. The discipline, held throughout this course: where the analogy is *structural* it is useful; where it would be *literal* it is not.
</div>
</div>

<div class="md">
## The slice is thin — the manifold hypothesis

**Why a *slice* and not "low-energy blobs scattered everywhere"?** Because the useful configurations are not spread through the space. They lie on a **manifold**: a surface of much lower dimension than the space around it. This is the **manifold hypothesis** \cite[Sindhwani, Belkin & Niyogi, 2006]{sindhwani2006geometric} \cite[manifold learning]{manifold_learning_wiki}: natural data — faces, digits, sentences, audio — although it lives in a huge ambient vector space, is actually produced by a small number of free parameters, so it occupies a *low-dimensional* manifold *inside* that space.

**The face example.** Take every photograph of every human face; each is a point in a huge space of pixel values. But "all faces" is not the whole space — it is a *surface* floating inside it. Move along that surface smoothly and you morph one face into another (shift the jaw, the eyes, the lighting), and *every point on the way is still a real face*. Olah's classic picture puts a **hole** in this face-manifold: you can loop from "eyes open" all the way around to "eyes closed" without ever leaving a real face — the surface has a hole in it, like the inside of a bagel \cite[Olah, 2014]{olah2014manifolds}.

The standard number. All images of the letter "A", scaled and rotated, are each a 1024-dimensional pixel vector, so the ambient space is $\mathbb{R}^{1024}$. But only two numbers vary — scale and rotation. The data lies on a **two-dimensional** surface curving through $\mathbb{R}^{1024}$ \cite[manifold learning]{manifold_learning_wiki}: *intrinsic* dimension $2$, *ambient* dimension $1024$. For a language model it is more extreme still: the space of all $100$-token outputs has size $\lvert V\rvert^{100}$ (vocabulary size $\lvert V\rvert$) — for a 10,000-word vocabulary that is $10^{400}$, a 1 with four hundred zeros, while the entire observable universe is only about a $10^{80}$-digit number of atoms. The outputs that are *grammatical and on-topic* are a measure-thin slice of it. The model is useful **on that slice, and only on that slice.**

<div class="optional md" data-headline="Making 'thin' precise: the measure-zero fact">
Make "thin" exact. A $k$-dimensional smooth manifold embedded in $\mathbb{R}^{N}$, with $k < N$, has **$N$-dimensional Lebesgue measure zero**. Sketch: cover the manifold by coordinate patches, each the image of a $C^{1}$ map from $\mathbb{R}^{k}$ into $\mathbb{R}^{N}$; such an image has $N$-measure zero, because the Jacobian has rank at most $k < N$. Two consequences:

1. The useful slice is not "a smaller blob" — it is *measure zero*. A point drawn uniformly from the full phase space lands on the slice with probability *exactly* $0$.
2. Usefulness is a **knife-edge**. The model is correct precisely *because* it has been made to live on a measure-zero set, while a random configuration is correct with probability zero. "Just try random inputs" is not a strategy; the space is, almost entirely, *not* where the model works.

This is the precise sense in which "the AI only works on a slice": the slice is *all* of where it works, and it is *almost none* of the space.
</div>

<div class="optional md" data-headline="An honest note: it is a *hypothesis*">
Note the name — *hypothesis*. It is a conjecture about the world, not a theorem, and it can fail. Fefferman, Mitter and Narayanan wrote a whole paper on how to *test* whether a data set genuinely lies on a low-dimensional manifold, and found the question is genuinely hard to answer and sometimes the answer is "no" — noise in particular *inflates* the apparent dimension \cite[Fefferman, Mitter & Narayanan, 2016]{fefferman2016testing}. And the modern refinement is that real data is usually not *one* smooth manifold but a **union of several** — cats, dogs, cars, each its own sheet \cite[Brown et al., 2023]{brown2023union}. So the honest statement is: the useful region is a *low-complexity, low-dimensional* subset (a manifold, or a union of them) of a vast space — which is exactly the shape claim this chapter needs, and nothing stronger.
</div>

**The phase-space form of the same fact.** An **attracting invariant manifold** in phase space — a surface that nearby trajectories flow onto and then stay on, indefinitely — is the dynamical-systems home of this idea \cite[manifold learning]{manifold_learning_wiki}. If such an attracting surface exists, the long-time behaviour of the system *is* that surface; the rest of phase space is only where the transients live before they decay into it. "The system only really does something on the attractor." That is the phase-space form of "the model only works on the slice."
</div>

<div class="md">
## The shape of the slices

We now know the useful slice is (i) *low-energy*, (ii) *low-dimensional*, and (iii) *measure-zero* in the ambient space. But what is its **shape**? Three answers — one from physics, one from measure theory, one from the machine — and they are not competing; they are three directions on the same slice.

**1. When the system is integrable, the slice is a *torus*.** A torus is a donut — or, better, a coffee mug, since a mug squished flat *is* a donut. The **Liouville–Arnold theorem** is one of the cleanest shape results in all of mechanics \cite[Liouville–Arnold]{liouville_arnold_wiki}. Take a Hamiltonian system with $n$ degrees of freedom that is *integrable* — it carries $n$ independent conserved quantities (the energy among them) that all Poisson-commute. At a regular point the state is confined to the *common level set* of those $n$ conserved quantities, and if that level set is compact and connected it is **diffeomorphic to the $n$-torus $\mathbb{T}^{n}$**: one donut-hole per independent oscillation. In **action–angle coordinates** the motion becomes nothing more than $n$ circles turning at constant speeds:

$$
\underbrace{\dot{\theta}_{i} \;=\; \omega_{i}(I) \;=\; \frac{\partial H}{\partial I_{i}}}_{\text{“angle }\theta_{i}\text{ winds around its circle at a \emph{constant} rate, set by the action }I_{i}\text{”}}
\qquad\Longrightarrow\qquad
\underbrace{\theta_{i}(t) \;=\; \theta_{i}(0) + \omega_{i}\,t}_{\text{the state is a point drifting around }\mathbb{T}^{n}\text{, never leaving it}}.
$$

So for the idealised, well-behaved system, the useful slice has a *precise* shape:

$$
\boxed{
\begin{aligned}
&\text{integrable system}\ \Longrightarrow\ \text{the useful slice is a torus }\mathbb{T}^{n},\\
&\text{one free circle per degree of freedom. The \emph{shape} of the slice}\\
&\text{\emph{is} the count of the independent motions.}
\end{aligned}
}
$$

Not an arbitrary blob, not a random region: a torus, whose topology literally encodes how many independent oscillations the system has.

**2. As a place where mass lands, the slice is a *thin shell*.** Remember the thin-shell fact from the temperature section: the energy of a large system locks onto one value to within about $1/\sqrt{N}$. That is not an approximation; it is a theorem — the **concentration of measure** phenomenon, the result behind the equivalence of the ensembles of statistical physics \cite[concentration of measure]{concentration_of_measure_wiki}. So the Boltzmann/Gibbs measure piles essentially all of its weight onto a thin band around the typical energy. There are thus **two independent senses of "thin," and both hold at once**:

$$
\boxed{
\begin{aligned}
&\text{measure-zero for a \emph{uniform} point\ \ \ \ (nothing is there);}\\
&\text{yet carrying \emph{all} the mass under the \emph{dynamics}\ \ \ \ (everything is there).}\\
&\text{The useful slice is, at once, empty and full.}
\end{aligned}
}
$$

**3. As the machine sees it, the slice is a *manifold* — and even the solutions have a shape.** The data manifold $M^{k}\subset\mathbb{R}^{N}$ is not assumed to be one smooth flat surface. Real data manifolds are **curved** (they carry intrinsic Riemannian curvature), can be **branched** or **multi-modal** (a union of patches — the "two moons," the "Swiss roll," an S-curve), and can carry **nontrivial topology** (holes, handles — the bagel in the face example) \cite[manifold learning]{manifold_learning_wiki}.

And the *model's own* phase space — **weight space** — has its own slice geometry, with the loss as its energy. A body of work on the loss landscape, beginning with the analysis of deep *linear* networks \cite[Saxe, McClelland & Ganguli, 2014]{saxe2014deep}, found that the set of *global* minima is not a scatter of isolated points: it has **basins and plateaus** — structure, not dust. On top of that, a network's function is unchanged by permuting the units of a layer (and, for sign-symmetric activations, by flipping them), so the *same* solution is represented by many weight vectors. The minima therefore come in whole **families**, forming flat, symmetry-generated "groves" rather than a dust of points:

$$
\boxed{
\begin{aligned}
&\text{even the set of \emph{solutions} has a shape: flat, connected,}\\
&\text{symmetry-generated — \emph{groves} of minima, not a dust of points.}
\end{aligned}
}
$$

<div class="optional md" data-headline="Three shapes, one slice — and which one is 'the' shape">
The three shapes describe the slice from three directions at once, and they agree on the *form* even where they differ in the details. The **torus** is the shape the *dynamics* impose when the system is integrable — the geometric skeleton of the motion. The **thin shell** is the shape the *measure* imposes — where the probability actually sits, which is where the torus lives, concentrated. The **manifold / grove** is the shape *learning* imposes — the low-dimensional, low-energy, symmetry-structured set a trained model is built to live on. The physics gives the torus and the shell as *theorems*; the machine gives the manifold and the grove as *empirical, structural* facts. The honest claim of this chapter is the common **form** — a thin, low-complexity, low-energy subset of a vast space of possibilities — *not* the claim that a trained network is literally a torus in $\mathbb{R}^{6N}$.
</div>
</div>

<div class="md">
## What breaks off the slice

Everything that goes *wrong* with a model is, in this language, one thing: the input — or the internal state — has drifted **off the slice**, into a high-energy region.

- **Out-of-distribution input.** The input is a point the manifold does not pass through. The model is asked to evaluate on a configuration it was never sculpted for; the energy there is high and uncontrolled, and the output is whatever the landscape happens to do there — often *confident* nonsense, because the network has no signal that it is off-slice.
- **Adversarial examples.** A tiny perturbation moves a data point just off the manifold and, because the energy between two neighbouring basins can be steep, over a cliff into a basin with the *wrong* label. The point is *nearly* on the slice; the answer is *completely* off it.
- **Temperature and sampling.** The Boltzmann selector is governed by $\beta$. Low temperature keeps the sampler glued to the minima — you get almost nothing but the argmin. High temperature lets it wander up the energy surface, drawing from far-off, high-energy regions — you get the incoherent. The <a href="samplinglab">Temperature &amp; Sampling</a> chapter is a study of exactly this knob.
- **Hallucination.** The model has drifted to a configuration that is *locally* low-energy — it sounds fluent, it is a minimum of its *own* internal energy — but that does not descend from a grounded cover. In energy terms it is a **spurious local minimum**: a low-energy pocket the data did not put there. This is exactly the "locally coherent, not true" case of the <a href="coherent_world_models">Coherent World Models</a> chapter, now given a coordinate.

$$
\boxed{
\begin{aligned}
&\text{on the slice} \quad\Rightarrow\quad \text{low energy, coherent, (usually) true;}\\
&\text{off the slice} \quad\Rightarrow\quad \text{high / uncontrolled energy, incoherent, hallucinated.}
\end{aligned}
}
$$
</div>

<div class="md">
## The one diagram

Each row is a stricter slice of the one above it, and a model's *useful* behaviour lives on the bottom rows:

$$
\begin{array}{c|c|c}
\textbf{layer} & \textbf{the space} & \textbf{where the system actually is} \\
\hline
\text{full phase space} & T^{*}Q,\ \text{all }(q,p) & \text{all of it} \\
\text{energy shell} & \{H = E\} & \text{one level set} \\
\text{data manifold} & M^{k}\subset \mathbb{R}^{N},\ k\ll N & \text{the low-energy slice} \\
\text{basin / trajectory} & \text{one attractor} & \text{the particular run} \\
\end{array}
$$

**Where the rest of the course lives on this picture.**

- **Coherent Difference.** The embedding space *is* the configuration space; the directions that carry meaning are the *data manifold inside it*, not the whole $\mathbb{R}^{d}$. The geometry of an embedding is, in this language, a low-energy slice made visible.
- **Coherent World Models.** The "accessible region" $c_{\mathrm{acc}}$ was introduced there as an honest limit on what a model covers. This chapter gives it a name and a mechanism: $c_{\mathrm{acc}}$ *is* the low-energy slice of the world's phase space — the part the learned energy makes probable. The model is a global section *over that slice*, no more, exactly as the earlier chapter insisted.
- **The Optimizer and the loss landscape.** Training *is* the sculpting of the energy: descending the loss so that the data manifold becomes the low-energy set. Every gradient step is a move of the *energy function*, not of the data.

$$
\boxed{
\begin{aligned}
&\text{one shape, three chapters:}\\
&\text{meaning is glued (difference), the model is a slice (world),}\\
&\text{and the slice is \emph{selected} by energy (here).}
\end{aligned}
}
$$
</div>

<div class="md">
## One sentence, and the status of the chapter

$$
\boxed{
\begin{aligned}
&\textbf{Usefulness is not a property of a model's whole space of possibilities;}\\
&\textbf{it is a property of the thin, low-energy, low-dimensional slice}\\
&\textbf{of it that the learned energy function has made probable.}
\end{aligned}
}
$$

**Status.** As with the previous two chapters, this is a *lens*, not a theorem. The physics is exact about *itself*: phase space, the Hamiltonian, the Boltzmann selector, the measure-zero slice — each is a fact. The transfer to machines is *structural*. What carries over is the **shape** — a scalar field selecting a measure-thin, low-complexity subset of a vast space of possibilities — not the literal apparatus (no $\omega$, no conservation law, no temperature in a frozen LLM). The standing rule of the course applies here without exception: **a useful analogy is not a theorem.** Where this chapter's energy is the loss and the slice is the data manifold, that is a precise structural claim. Where it would require a GPU to conserve a Hamiltonian, it is not — and it does not.
</div>
