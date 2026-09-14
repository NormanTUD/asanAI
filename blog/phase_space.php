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

The space this chapter lives in is the space of **all (input, output) pairs** — every possible input paired with *every* possible answer, absurd ones included; for an image generator, every possible picture: a real image, or a real image with noise added, at every possible state — clean faces, and all the static, corruption, and half-formed junk in between. In physics, a space of "every possible state" has a name, **phase space** \cite[nLab]{nlab_phasespace}; here the "state" is simply a pair, and the name is borrowed for the same idea — *the space of everything that could possibly be the case*.

It is **enormous and high-dimensional**. Even a small image is a vector with thousands of numbers, so its space has thousands of dimensions — far too many to draw, and the extra dimensions only make the space bigger and emptier. For a sequence model the count is wilder still: the number of possible 100-token answers is $\lvert V\rvert^{100}$, which for a vocabulary of $\lvert V\rvert = 10{,}000$ is $10^{400}$ — a 1 followed by four hundred zeros.

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

**The face example.** Every photograph of a human face is a point in a giant space of pixel values, but "all faces" is not the whole space — it is a *surface* inside it. Sliding smoothly along that surface morphs one face into another — change the jaw, the eyes, the light — and *every step of the way is still a real face*. The classic picture even has a **hole**: going all the way round from "eyes open" to "eyes closed" and back never leaves a real face, so the surface is shaped like the inside of a bagel \cite[Olah, 2014]{olah2014manifolds}.

**A number one can feel.** A scaled-and-rotated letter "A" is still just one point in that huge space, and only *two* knobs — size and rotation — move it. So every letter "A" sits on a **two-dimensional surface** floating inside a space with thousands of dimensions \cite[manifold learning]{manifold_learning_wiki}: a sheet with two degrees of freedom inside an enormous arena. A language model is more extreme still: the number of possible 100-token answers is $10^{400}$ for a realistic vocabulary — roughly **320 more digits** than the atoms in the observable universe ($\sim10^{80}$). And yet the *grammatical, on-topic* answers are a measure-thin sliver of that space. The model works **on that sliver, and only on that sliver.**

**What shape it is.** Three pictures — one from physics, one from probability, one from the machine — are not rivals but three angles on the same sheet:

- **A donut (orderly motion).** When a system's long-run behaviour is just several independent little oscillations, it winds around a **donut-shaped** surface — one hole per independent motion. That shape is the **Liouville–Arnold theorem** \cite[Liouville–Arnold]{liouville_arnold_wiki}: the reachable surface literally *counts* the independent motions. (A donut and a coffee mug are the same shape once you squish the handle — that is all a "torus" is.)
- **A thin shell — and the thickness comes from the temperature.** The probability is not glued to the sheet; it spreads a little around it, so the reachable region is the sheet *plus a thin halo* hugging it. That thickness is the temperature: **warm** gives a fatter halo, **cold** a thinner one, and at **zero temperature** the halo vanishes and all the mass collapses onto the sheet itself (the ground state). In a large system the halo is extremely thin, a **concentration of measure** effect \cite{concentration_of_measure_wiki}.
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

**A dynamical-systems name for it.** In a system that loses energy to friction, the long-run behaviour is a set that nearby trajectories flow onto and then stay on — an **attractor** \cite[manifold learning]{manifold_learning_wiki}. "The system only really does something on the attractor" is the dynamical-systems form of "the model only works on the reachable region."
</div>

<div class="md">
## The unreachable region: how it forms, and its shape

Now the high wilderness that surrounds the thin, lit-up ground.

**How it forms.** It is simply the *complement* — every (input, output) pair the data did not make likely. And it is not *blocked*; it is **starved**. The model is never *forbidden* from producing a nonsense output — nothing in its wiring blocks that string. It has simply been given almost zero *weight* there, because the data almost never pairs that output with a sensible input. That is the "it could always reply 'aaaa…', as long as the context allows, but it does not" point made precise: the *context* — the training distribution — is exactly what made the bad pairs high-energy, so the sampling never reaches them. The wilderness is empty for a *statistical* reason, not a *structural* one.

**What shape it is.** If the reachable region is a thin sheet, the unreachable region is *everything else* — and by raw count, "everything else" is *almost the whole space*. In high dimensions the raw volume of a region does not sit near its middle at all: it concentrates in a thin shell far out toward the edges, so the data's thin sliver (measure-zero, all the weight) is wrapped inside a vast bulk that is, by volume, nearly everything \cite{concentration_of_measure_wiki}. That is the paradox, stated cleanly:

$$
\boxed{
\begin{aligned}
&\text{the reachable sliver is measure-zero (nothing, for a random point)}\\
&\text{yet carries almost all the weight (everything, under the model);}\\
&\text{the unreachable bulk is almost all the volume}\\
&\text{yet carries almost no weight (nothing, under the model).}
\end{aligned}
}
$$

Empty and full, at the same time, for opposite reasons.

**Why it stays empty — the precise reason.** The bad regions are not merely *unlikely*; they are unlikely in the *strongest* way. As an output grows, the chance of landing far from the typical set does not just shrink — it shrinks **exponentially fast** \cite{large_deviations_wiki}. The exponent is a single number, the **rate function**, and for a whole region that rate is just the region's *distance from the data*, measured by **KL divergence** (Sanov's theorem) \cite{sanov_theorem_wiki}\cite{kl_divergence_wiki}. The farther a region is from what the data looks like, the faster its probability dies.

<div class="optional md" data-headline="The precise statement (for the curious)">
The model has learned an (approximate) distribution $p(\text{input},\text{output})$ from the training data; the reachable region is where $p$ is large, the wilderness where $p\approx 0$. Three precise names for that region, and the theorem behind the thinness. *Support:* the largest set in which every neighbourhood still carries positive probability — topologically, the whole space minus the (open) set of measure zero \cite{support_measure_wiki}. *Typical set:* for long outputs of length $n$, the sequences with probability near $2^{-nH}$, $H$ the entropy; by the **asymptotic equipartition property** (a law of large numbers) the typical set has total probability $\to 1$ yet size only $\sim 2^{nH}$, against $2^{n\log_2|\mathcal{X}|}$ possible sequences. The typical *fraction* is $2^{nH}/2^{n\log_2|\mathcal{X}|}=2^{-n(\log_2|\mathcal{X}|-H)}\to 0$ exponentially — a vanishing share of the space carrying (almost) all the mass \cite{aep_wiki}\cite{typical_set_wiki}. *Modes and ground state:* the density's peaks and their basins; at zero temperature the Boltzmann measure collapses entirely onto the lowest-energy states, the ground state(s) \cite{mode_wiki}\cite{ground_state_wiki}. One caveat: a real softmax network has $p>0$ *everywhere*, so its topological support is technically the whole space — for a net the thin slice is not the support but the **high-density / typical** part of it (probability above some threshold). And "meaningful" means *typical under the training data*, a statistical rather than logical notion: different data lay down a different slice. The deepest statement is the **large-deviation** one: the probability of a region decays as $\exp(-n\,I)$ with $I$ the **rate function**, and for the empirical statistics that rate is the **KL divergence** from the data \cite{sanov_theorem_wiki}\cite{large_deviations_wiki}. The rate function is the Legendre dual of the entropy — the same free-energy/entropy duality of statistical mechanics that holds this whole chapter together \cite{kl_divergence_wiki}.
</div>
</div>

<div class="md">
## The line between them

Finally, the boundary between the two regions.

There is **no wall** — only a *scale*. "Reachable" versus "unreachable" is decided by a **threshold on the energy**, not by a geometric border. The line is the **level set** of the energy at some height,

$$
\underbrace{\{\,x \,:\, E(x) = E_0\,\}}_{\text{the contour of the height map at height }E_0},
$$

a smooth contour hugging the sheets — the outer surface of the thin shell. The model could in principle step over it; it simply has almost no weight on the far side. The boundary is a **cliff in probability, not a wall in the space**.

And the story closes its circle here. That height, read as a function of position, *is* the rate function — the distance from the data — and its average over the data is the **cross-entropy**, the surprise per token, that the model is *trained to minimize* \cite{cross_entropy_wiki}. Lowering the energy of the data is literally *fitting the data*. So the line is not drawn by some external rule; it is the level set of the very quantity the training optimizes. The machine-learning name for crossing it — for wandering from the low-energy ground into the high wilderness — is simply going **out-of-distribution** \cite[covariate shift]{covariate_shift_wiki}.

$$
\boxed{
\begin{aligned}
&\text{the line between the two regions}\\
&\;=\; \text{a level set of the energy}\\
&\;=\; \text{a contour of the rate function (the distance from the data)}\\
&\;=\; \text{the cross-entropy surface that training minimizes.}
\end{aligned}
}
$$
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
\textbf{region} & \textbf{what it is} & \textbf{volume \quad / \quad probability} \\
\hline
\text{full space} & \text{every (input, output) pair} & \text{all of it \quad / \quad 1} \\
\text{reachable} & \text{a thin low-dimensional sheet, + a halo} & \text{\approx none \quad / \quad \approx all} \\
\text{unreachable} & \text{the rest: the high wilderness} & \text{\approx all \quad / \quad \approx none} \\
\text{the line} & \text{a level set of the energy (the cliff)} & \text{a threshold} \\
\end{array}
$$

**How this ties the earlier chapters together.**

- **Coherent Difference** said meaning comes from the *differences* between things, arranged in a space. In this language: that space is the space of all (input, output) pairs, and the directions that actually carry meaning are the *reachable sheet inside it*, not the whole space.
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

**The honest word.** The core of this chapter is a statement about the space of (input, output) pairs, and that statement is the real part: the space is enormous and high-dimensional; the useful pairs form a thin, low-dimensional region of it — tiny by volume, yet carrying almost all the probability — while the overwhelming rest is high and empty and carries almost none; and a single number, the energy (set by the data), is what separates the two. What is *borrowed* from physics is the vocabulary — "energy," "phase space," "temperature" — which makes the picture easier to hold. But a frozen language model has no conserved quantity and no real temperature. The course's standing rule applies: **a useful analogy is not a theorem.** Where the energy is the loss and the reachable region is the data surface, that is a precise structural claim; where it would require a GPU to conserve a Hamiltonian, it is not — and it does not.
</div>
