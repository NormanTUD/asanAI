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

**The tour.**

1. **The space.** The space of all (input, output) pairs — enormous, high-dimensional, and mostly incoherent.
2. **The energy.** A single number on each pair, decided by the training data; low energy = useful. Temperature turns it into a probability.
3. **The two regions.** The thin region the model *does* reach and the vast region it *never* reaches — each with its own shape, and a line between them.
4. **Off the slice.** Going wrong is going off the slice.

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
## The space: every (input, output) pair

The space this chapter lives in is the space of **all (input, output) pairs** — every possible input paired with *every* possible answer, absurd ones included; for an image generator, every possible picture. In physics, a space of "every possible state" has a name, **phase space** \cite[nLab]{nlab_phasespace}; here the "state" is simply a pair, and the name is borrowed for the same idea — *the space of everything that could possibly be the case*.

It is **enormous and high-dimensional**. Every scaled-and-rotated image of the letter "A" is a 1,024-number vector, so its space is $\mathbb{R}^{1024}$ — one cannot draw 1,024 axes, but the extra dimensions only make the space bigger and emptier. For a sequence model the count is wilder still: the number of possible 100-token answers is $\lvert V\rvert^{100}$, which for a vocabulary of $\lvert V\rvert = 10{,}000$ is $10^{400}$ — a 1 followed by four hundred zeros.

And almost none of those points is a sensible answer to its input. Yet they are all *in* the space, sitting there, perfectly valid strings. The question this chapter answers: **where, inside that enormous space, is the thin place where the outputs are actually good answers — and what shape is it?**

$$
\boxed{
\text{phase space here} \;=\; \text{all (input, output) pairs at once,} \qquad \text{enormous, high-dimensional, mostly incoherent.}
}
$$
</div>

<div class="md">
## The energy: a number the data paints

Give every (input, output) pair a single number — its **energy**. In a trained model this is not a physical energy at all; it is a *score*, and the crucial point is that **the training data decides it**. Training does essentially one thing: it pushes the good pairs — coherent, fluent, in-distribution — to *low* energy, and the bad pairs — incoherent, off-distribution — to *high* energy. That is the whole idea behind **energy-based models** \cite[LeCun et al., 2007]{lecun2007ebm} \cite[LeCun et al., 1998]{lecun1998gradient}:

<div class="smart-quote" data-cite="ebm_wiki" data-after="Energy-based model">
Essentially, the model learns a function that associates low energies to correct values, and higher energies to incorrect values.
</div>

So "useful" and "low energy" are the same statement: a pair is useful exactly when the data made it likely, that is, when its energy is low.

**Temperature turns the number into a probability.** The standard rule is the **Boltzmann distribution** \cite{boltzmann_distribution_wiki} \cite{canonical_ensemble_wiki}:

$$
\underbrace{P(x)}_{\text{probability of a pair }x}
\;=\;
\underbrace{e^{-\beta\, E(x)}}_{\text{the weight: \emph{small} when the energy is big}}
\;\Big/\;
\underbrace{Z}_{\text{the total of all the weights}}
\qquad\text{with}\qquad
\underbrace{\beta \;=\; \tfrac{1}{\text{temperature}}}_{\text{how “stingy” the sampling is}}.
$$

Each pair gets a **weight** $e^{-\beta E}$ that *shrinks* as the energy grows; divide by $Z$ (the sum of all the weights) so the probabilities add to $1$ \cite{partition_function_wiki}. In one line:

$$
\boxed{
\text{low energy} \;\Rightarrow\; \text{likely.} \qquad\qquad \text{high energy} \;\Rightarrow\; \text{almost never.}
}
$$

The high-energy pairs are **not removed** — they are still in the space, still part of the possibilities — they have simply been given almost no weight. So the model is found, almost always, in the **low-energy region**. And that region is *thin*: in a large system the energy concentrates so tightly around one value that the relative wobble is about $1/\sqrt{N}$, a consequence of **concentration of measure** \cite{concentration_of_measure_wiki}. Push the temperature to zero and the wobble dies out entirely: all the weight sits on the single lowest-energy pair — the **ground state** \cite{ground_state_wiki} — and the region narrows to a point. That one-point limit is the useful, deterministic answer a trained model gives.

**This is the knob on a chatbot.** "Temperature" in a language model is borrowed straight from here: **low** = almost nothing but the single safest, most likely thing (correct, but dull); **high** = it explores unusual, higher-energy options (some delightful, some nonsense). (The <a href="samplinglab">Temperature &amp; Sampling</a> chapter turns this knob in detail.)

**Three verbs do the work** \cite[LeCun et al., 2007]{lecun2007ebm}: **training** = shaping the energy so the good cases sit low and the rest sits high; **inference** = sliding to the low energy (given a question, find the low-energy answer); **usefulness** = the low-energy region itself. It is an old trick — **Hopfield networks** are energy systems that slide down until they park on a stored memory \cite{hopfield1982}, **Boltzmann machines** add temperature and push the good cases down and the rest up \cite[Ackley, Hinton & Sejnowski, 1985]{ackley1985boltzmann}, and LeCun returns to it in 2022, where the proposed brain is a stack of modules each driven to low energy \cite[LeCun, 2022]{lecun2022autonomous}.

*In one line:* a space of all (input, output) pairs, one number on each — set by the data, low on the useful ones — and a thin low-energy region where the model works.

<div class="optional md" data-headline="What “energy” means for a real LLM (the honest boundary)">
In a modern language model the "energy" is *not* a physical Hamiltonian. There is no conserved quantity, no pendulum swinging, no real temperature in a frozen model at inference. The energy is the **loss** — for a language model, roughly the *surprise* of the tokens (the negative log-likelihood). But its *job* is identical: a single number over all possible (input, output) sequences that training has made small exactly on the sequences that are *coherent, fluent, and in-distribution*. The physics is a *picture of the geometry*, not a claim that a GPU is swinging a pendulum. The rule for the whole course: where the analogy is *structural* it is useful; where it would be *literal*, it is not.
</div>
</div>


<div class="md">
## Temperature: the slice gets a thickness

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

Push the temperature all the way down and the wobble dies out: at $T=0$ the weight sits on the single lowest-energy state alone — the **ground state** \cite{ground_state_wiki} — and the "slice" narrows to a single point. That one-point limit is the useful, deterministic answer a trained model gives.

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
## One space, two regions

Look at the whole (input, output) space. It is full of points the model will effectively *never* produce: "write a sonnet about the sea" answered with "aaaa…", "what is 2+2?" answered with "ababab…". Those outputs are *right there* in the space — perfectly valid strings — and yet the model never lands on them.

So the question that matters: **if the whole thing is one space, what separates the region where meaning sits from the region where it does not?**

The answer — and it is the crux — is that **it is not the shape of the space.** There is no wall, no border, no separate "meaningless room." The meaningful and the meaningless live in the *same* space, side by side. What draws the line is not geometry; it is the **training data**, through the likelihood — the energy — the model learned from it. The data paints a single number, the energy, across the whole space:

$$
\underbrace{E(x)}_{\text{energy of a pair }x}
\;=\;
\underbrace{-\,\log\, P(x)}_{\text{how “unexpected” the pair is to the data}}
\;+\;
\underbrace{\text{const.}}_{\text{the same for every pair, so it never matters}}.
$$

Here $x$ is an (input, output) pair and $P(x)$ is how likely that pair is under the distribution the model learned \cite[LeCun et al., 2007]{lecun2007ebm}. A pair the data supports — "what is 2+2?" → "4" — has low energy; a pair it almost never contains — "write a sonnet" → "aaaa…" — has very high energy. The *same string* "aaaa…" is high-energy (meaningless) next to "write a sonnet about the sea," but low-energy (perfectly fine) next to "print the letter a five times." Meaning is not a property of the *output* alone; it is a property of the **pair**, and the data decides.

**Now picture the space as a height map**, with height = energy. The training data occupies a few thin, low, well-lit regions; everything else is high, empty wilderness. One space, two regions, divided by a line at some height:

$$
\boxed{
\begin{aligned}
&\text{one space holds the meaningful and the meaningless together;}\\
&\text{the training data paints an energy across it;}\\
&\text{meaning sits where that energy is low — the rest is wilderness.}
\end{aligned}
}
$$

The **reachable region** is the thin low-energy ground the model walks on. The **unreachable region** is the high wilderness around it. And between the two runs a **line** — the level set of the energy at some height. The next three sections give each its own shape: how it forms, and what it looks like.
</div>

<div class="md">
## The reachable region: how it forms, and its shape

Start with the low, well-lit ground of the height map — the region the model actually lives on.

**How it forms.** It is low-energy because that is where the data put its mass, and the data is *low-dimensional*: the useful states do not scatter through the whole space; they lie on a **low-dimensional surface** floating inside it. That is the **manifold hypothesis** \cite[Sindhwani, Belkin & Niyogi, 2006]{sindhwani2006geometric} \cite[manifold learning]{manifold_learning_wiki} — real data, though it lives in a space with a huge number of coordinates, is really controlled by only a few free knobs.

**The face example.** Every photograph of every human face is a point in a giant space of pixel values. But "all faces" is not the whole space — it is a *surface* inside it. Slide smoothly along that surface and you morph one face into another (change the jaw, the eyes, the light), and *every step of the way is still a real face*. The classic picture even has a **hole**: you can go all the way round from "eyes open" to "eyes closed" and back without ever leaving a real face, so the surface is shaped like the inside of a bagel \cite[Olah, 2014]{olah2014manifolds}.

**A number you can feel.** Every scaled-and-rotated image of the letter "A" is a 1,024-number vector, so the space is $\mathbb{R}^{1024}$. You cannot draw 1,024 axes, but the 2-D picture you *can* draw has the same shape — the extra dimensions only make the space bigger and emptier. Only *two* knobs move a letter "A" (size and rotation), so the data sits on a **two-dimensional surface** inside that 1,024-dimensional space \cite[manifold learning]{manifold_learning_wiki}. A language model is more extreme still: the number of possible 100-token answers is $\lvert V\rvert^{100}$ (for a vocabulary of $\lvert V\rvert$); with $\lvert V\rvert=10{,}000$ that is $(10^{4})^{100}=10^{400}$, a 1 followed by four hundred zeros. The observable universe contains only about $10^{80}$ atoms. The space of possible answers has roughly **320 more digits** than there are atoms in the cosmos — and the *grammatical, on-topic* answers are a measure-thin sliver of it. The model works **on that sliver, and only on that sliver.**

**What shape it is.** Three pictures — one from physics, one from probability, one from the machine — are not rivals but three angles on the same sheet:

- **A donut (orderly motion).** When a system's long-run behaviour is just several independent little oscillations, it winds around a **donut-shaped** surface — one hole per independent motion. That shape is the **Liouville–Arnold theorem** \cite[Liouville–Arnold]{liouville_arnold_wiki}: the reachable surface literally *counts* the independent motions. (A donut and a coffee mug are the same shape once you squish the handle — that is all a "torus" is.)
- **A thin shell (where the weight sits).** From the temperature section: the energy locks to one value to within $1/\sqrt{N}$, so almost all the probability sits in a thin band around one energy — a **shell** hugging the sheet.
- **Groves of solutions (what the machine sees).** A trained network's weight space has valleys and flat plains, not a scatter of dots \cite[Saxe, McClelland & Ganguli, 2014]{saxe2014deep} — and, because rearranging the neurons in a layer does not change what the network does, the good answers come in whole *families*, flat symmetry-made **groves** rather than dust.

Put together: a **low-dimensional sheet** (donut / grove) on which the mass **concentrates** in a **thin shell**, built from a few **pockets** — one for each "way the data tends to look" \cite[concentration of measure]{concentration_of_measure_wiki} \cite[mode]{mode_wiki}.

**And it has names.** Three fields each give the same thin, lit-up region a name:

- **Measure theory:** the **support** of the distribution — the place the mass lives \cite{support_measure_wiki}.
- **Information theory:** the **typical set** — the answers typical of the data \cite{typical_set_wiki}.
- **Physics:** the **ground state** — the lowest-energy configuration, what the system becomes as the temperature goes to zero \cite{ground_state_wiki}.

The thinness is a theorem, not a guess: as answers get longer, the *fraction* of the space that is typical **goes to zero exponentially** the moment the data has any structure at all — a vanishing sliver carrying (almost) all the probability (the **asymptotic equipartition property**) \cite{aep_wiki}.

<div class="optional md" data-headline="Why “thin” is the right word (for the curious)">
Make "thin" exact. A smooth surface of dimension $k$ sitting inside a space of dimension $N$ (with $k < N$) has **$N$-dimensional measure zero** — the same reason a line has zero *area*. So a point picked uniformly from the full space lands on the slice with probability *exactly* $0$. Usefulness is a knife-edge: the model is right precisely *because* it has been made to live on a measure-zero set, while a random input is right with probability zero.

Two honesty notes. First, it is a *hypothesis*, not a theorem — and it can fail. Fefferman, Mitter and Narayanan wrote a whole paper on how to *test* whether a data set really does lie on a low-dimensional surface, and found the question is genuinely hard to verify, and sometimes the answer is "no" (noise, in particular, *inflates* the apparent dimension) \cite[Fefferman, Mitter & Narayanan, 2016]{fefferman2016testing}. Second, real data is usually not *one* surface but a **union of several** — cats, dogs, cars, each its own sheet \cite[Brown et al., 2023]{brown2023union}. The safe statement is "a low-complexity, low-dimensional region of a huge space" — exactly what we need, and no more.
</div>

**The dynamical-systems version of the same idea.** For a system that *does* lose energy to friction, there is a precise object that plays this role: an **attractor** — a set that nearby trajectories flow onto and then stay on \cite[manifold learning]{manifold_learning_wiki}. Once the transients have decayed, the long-run behaviour is *on* the attractor; the rest of the space is only where the settling-down happens. (The frictionless pendulum is the limiting case with no attractor — it stays on its energy curve forever — which is exactly why the *slice* is the right word.) "The system only really does something on the attractor" is the dynamical-systems form of "the model only works on the slice."
</div>

<div class="md">
## The spaces it never reaches

Look at what surrounds the thin slice. The (input, output) space is full of points the model will effectively *never* produce — pairs where the output makes no sense for the input. It does not answer "write a sonnet about the sea" with "aaaa…", and it does not answer "what is 2+2?" with "ababab…". Those outputs are *right there* in the space, perfectly valid strings, and yet the model never lands on them. Why?

**The question that matters: if everything is one space, what separates the region where meaning sits from the region where it does not?**

The answer — and it is the crux — is that **it is not the shape of the space.** There is no wall, no border, no separate "meaningless room." The meaningful and the meaningless live in the *same* space, side by side. What draws the line is not geometry; it is the **training data**, through the likelihood the model learned from it.

**The data paints the line onto the space as a single number.** Recall the energy. For a language model the energy of a pair is essentially its *surprise* — how unlikely that output is *given that input*, according to the data \cite[LeCun et al., 2007]{lecun2007ebm}:

$$
\underbrace{E(x)}_{\text{energy of a pair }x}
\;=\;
\underbrace{-\,\log\, p(x)}_{\text{how “unexpected” the pair is to the data}}
\;+\;
\underbrace{\text{const.}}_{\text{the same for every pair, so it never matters}}.
$$

Here $x$ is an (input, output) pair and $p(x)$ is how likely that pair is under the distribution the model learned. A pair the data supports — "what is 2+2?" → "4" — has low energy. A pair the data almost never contains — "write a sonnet" → "aaaa…" — has very high energy. So *the same string* "aaaa…" is high energy (meaningless) next to "write a sonnet about the sea," but low energy (perfectly fine) next to "print the letter a five times." Meaning is not a property of the *output* alone; it is a property of the **pair**, and the training data is what decides.

**So the empty regions are empty for a statistical reason, not a structural one.** The model is never *forbidden* from saying "aaaa…" — nothing in its wiring blocks that string. It has simply been given almost zero *weight* there, because the data almost never pairs it with a sensible input. That is the "it could always reply with 'aaaa…', as long as context allows, but it doesn't" point made precise: the *context* — the training distribution — is exactly what made it high-energy, so the sampling never reaches it. The boundary is a **cliff in probability, not a wall in the space**.

$$
\boxed{
\begin{aligned}
&\text{one space holds the meaningful and the meaningless together;}\\
&\text{the training data paints an energy across it;}\\
&\text{meaning sits where that energy is low — the rest is wilderness.}
\end{aligned}
}
$$

**The spatial picture.** Paint the (input, output) space as a height map, height = energy. The training data is a thin, low ribbon winding through a vast, high, empty wilderness. The model walks only on the ribbon. The wilderness is not locked away — it is simply where there is no data, and therefore no meaning. The model could step off the ribbon at any point; it just has almost no probability mass to do so. Its effective world is the ribbon, not the whole space.

**Now name that ribbon.** The thin, lit-up region — the whole space with the unreachable wilderness subtracted out — is not nameless; three fields give it three names:

- **Measure theory** calls it the **support** of the distribution: the place the mass *lives* — the largest region in which every point still has weight around it \cite{support_measure_wiki}.
- **Information theory** calls it the **typical set**: the answers that are "typical" of what the data actually looks like \cite{typical_set_wiki}.
- **Physics** calls it the **ground state** — the lowest-energy configuration — what the system becomes as the temperature goes to zero \cite{ground_state_wiki}.

**What can be said about its form?** Four things, and each is a result, not a guess.

*It is exponentially thin.* As answers get longer, the number of *typical* answers grows only like the entropy's exponent, while the total number of possible answers grows faster still. The **fraction** of the whole space that is typical is a small number that **goes to zero exponentially fast** the moment the data has any structure at all. A vanishing sliver of the space holds (almost) all the probability — the chapter's central claim, stated as a theorem \cite{aep_wiki}.

*It is a surface, not a volume.* The meaningful pairs sit on, or very near, a **low-dimensional manifold** buried inside the enormous ambient space \cite{manifold_learning_wiki}.

*It concentrates.* In high dimensions, probability mass piles into a thin region rather than spreading out evenly \cite{concentration_of_measure_wiki}.

*It is a union of pockets.* The density has several peaks — its **modes** — and the reachable region is the set of valleys around those peaks, one pocket for each "way the data tends to look" \cite{mode_wiki}.

**Why the wilderness stays empty — the precise reason.** It is not merely that bad answers are unlikely; they are unlikely in the strongest possible way. As an answer grows, the chance of landing far from typical does not just shrink — it shrinks *exponentially fast* \cite{large_deviations_wiki}. The exponent is a single number, the **rate function**, and for a whole region that rate is just the region's **distance from the data**, measured by **KL divergence** \cite{sanov_theorem_wiki}\cite{kl_divergence_wiki}. Here the story closes its circle: that number is the **energy**, and the average energy over the data is the **cross-entropy** — the surprise per token — that the model is *trained to minimize* \cite{cross_entropy_wiki}. Lowering the energy of the data is literally fitting the data. The ML name for stepping off the slice, into the wilderness, is simply going **out-of-distribution** \cite[covariate shift]{covariate_shift_wiki}.

And one thing about its **edge**: there is no wall, only a *scale*. "Reachable" versus "unreachable" is decided by a threshold on the probability — a level of the energy — not by a border. The boundary is a smooth **level set of the energy**, and the model could in principle step over it. It simply has almost no weight on the far side.

<div class="optional md" data-headline="The precise statement (for the curious)">
The model has learned an (approximate) distribution $p(\text{input},\text{output})$ from the training data; the reachable region is where $p$ is large, the wilderness where $p\approx 0$. Three precise names for that region, and the theorem behind the thinness. *Support:* the largest set in which every neighbourhood still carries positive probability — topologically, the whole space minus the (open) set of measure zero \cite{support_measure_wiki}. *Typical set:* for long outputs of length $n$, the sequences with probability near $2^{-nH}$, $H$ the entropy; by the **asymptotic equipartition property** (a law of large numbers) the typical set has total probability $\to 1$ yet size only $\sim 2^{nH}$, against $2^{n\log_2|\mathcal{X}|}$ possible sequences. The typical *fraction* is $2^{nH}/2^{n\log_2|\mathcal{X}|}=2^{-n(\log_2|\mathcal{X}|-H)}\to 0$ exponentially — a vanishing share of the space carrying (almost) all the mass \cite{aep_wiki}\cite{typical_set_wiki}. *Modes and ground state:* the density's peaks and their basins; at zero temperature the Boltzmann measure collapses entirely onto the lowest-energy states, the ground state(s) \cite{mode_wiki}\cite{ground_state_wiki}. One caveat: a real softmax network has $p>0$ *everywhere*, so its topological support is technically the whole space — for a net the thin slice is not the support but the **high-density / typical** part of it (probability above some threshold). And "meaningful" means *typical under the training data*, a statistical rather than logical notion: different data lay down a different slice. The deepest statement is the **large-deviation** one: the probability of a region decays as $\exp(-n\,I)$ with $I$ the **rate function**, and for the empirical statistics that rate is the **KL divergence** from the data \cite{sanov_theorem_wiki}\cite{large_deviations_wiki}. The rate function is the Legendre dual of the entropy — the same free-energy/entropy duality of statistical mechanics that holds this whole chapter together \cite{kl_divergence_wiki}.
</div>
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
