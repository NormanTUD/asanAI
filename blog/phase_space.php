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
## The question the last chapter left open

In <a href="coherent_difference">Coherent Difference</a> we saw that meaning is *glued together* from local differences. In <a href="coherent_world_models">Coherent World Models</a> we saw that a model is a *global section recovered from local descent data* — and that its honest scope is not the whole of the world but only the *accessible region* $c_{\mathrm{acc}}$ its instruments can reach. That chapter stated the limit but did not yet explain it: *why* is what a model can cover a **slice** of the world, rather than the world? Why does "the model knows the interface" have to be *less* than "the model knows the thing"?

This chapter answers that with a word that has two thousand years of mechanics behind it: **energy**. An AI, in the only region where it is *useful*, lives on a thin slice of the space of all its possible inputs and outputs. The rest of that space — the overwhelming, essentially measure-zero complement — is where it says nothing true. A scalar function called the *energy* is what draws the line between the two.

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
## What a phase space is

**Plain.** Every system you can talk about has a *configuration space*: the space of everything that could be "set up" — every knob, every coordinate, every way the thing might be arranged. A pendulum's configuration space is a circle (its angle). A five-jointed robot arm's is a five-dimensional torus (its five angles). A neural network's is the space of all its possible weight vectors — and, once we let the *data* vary too, the space of all possible (input, output) pairs it might be handed. Formally, a configuration is a point $q$ of a manifold $Q$ \cite[nLab]{nlab_configspace_physics}.

**The upgrade to phase space.** A *state* needs more than a position; it needs *how the thing is moving*. So to each position $q$ you attach a *momentum* $p$ — a covector, an element of the cotangent space $T^{*}_{q}Q$ at that point. A point of the **phase space** is a pair $(q,p)$ \cite[nLab]{nlab_phasespace}:

$$
\text{phase space} \;=\; T^{*}Q \;=\; \bigl\{\, (q,p)\;:\; q\in Q,\; p\in T^{*}_{q}Q \,\bigr\}.
$$

For $N$ particles in ordinary 3-space, $Q \cong \mathbb{R}^{3N}$ and the phase space is $\mathbb{R}^{6N}$: all positions and all momenta, laid side by side. *That* is the "space of all possibilities" — every location and every velocity, all at once, before anything has been ruled out.

The phase space is not just a set; it carries a canonical geometric object, a **symplectic form** $\omega$ (in flat coordinates $\omega = \sum_{i} dq_{i}\wedge dp_{i}$), which is precisely what makes the motion reversible and volume-preserving \cite[nLab]{nlab_symplectic_manifold}. A phase space is a *symplectic manifold* \cite[nLab]{nlab_symplectic_manifold}; the study of its motion is *Hamiltonian mechanics* \cite[nLab]{nlab_hamiltonian_mechanics}.

**Two "spaces of all possibilities", kept apart.** There are two distinct spaces it is tempting to call "all the possibilities", and the argument depends on not conflating them:

$$
\begin{array}{c|c|c}
& \textbf{full phase space} & \textbf{the shell} \\
\hline
\text{what it is} & T^{*}Q:\ \text{every }(q,p) & \text{solutions of the equations of motion} \\
\text{a.k.a.} & \text{all configurations, on- and off-shell} & \text{the on-shell (covariant) phase space} \\
\text{the system is} & allowed to be anywhere & actually on it, as a trajectory \\
\end{array}
$$

The *full* phase space is the room. The *shell* is where the furniture stands. \cite[nLab]{nlab_phasespace}
</div>

<div class="md">
## What shape is the space — and what can be said about it

So far phase space has been *defined*. Now the sharper question: what is its **shape**, and what can actually be *proved* about that shape? Three facts, each with a different weight.

**The shape is inherited from the configuration space.** $T^{*}Q$ is a *bundle* over $Q$: to each configuration you attach a whole vector space of momenta. Topologically it "remembers" $Q$. If $Q$ is flat and open ($Q=\mathbb{R}^{n}$, the free particles) then $T^{*}Q \cong \mathbb{R}^{2n}$ — trivial and simply connected. If $Q$ is a circle (the pendulum's angle) then $T^{*}Q \cong S^{1}\times\mathbb{R}$, a *cylinder*: the position wraps around, the momentum does not. The "space of all possibilities" can therefore carry holes and wrap-around, inherited from the geometry of the thing being modelled \cite{symplectic_manifold_wiki}.

**Darboux's theorem: there is no *local* shape.** The deep and slightly surprising fact is that *every* symplectic manifold looks, near every point, exactly like flat $\mathbb{R}^{2n}$ with the standard form $\omega=\sum_{i}dp_{i}\wedge dq^{i}$ \cite{symplectic_manifold_wiki}. This is the symplectic antithesis of Riemannian geometry, where local curvature is the whole story. A symplectic manifold has **no local invariant at all**: you cannot detect any "bending" of phase space by zooming in.

$$
\boxed{
\begin{aligned}
&\text{Phase space has no local shape. Every neighbourhood looks identical.}\\
&\text{All of its shape is \emph{global} — in how the space wraps, and in its topology.}
\end{aligned}
}
$$

**Liouville's theorem: the flow preserves a volume.** The symplectic form defines a canonical volume $\omega^{n}/n!$, and the Hamiltonian flow *preserves* it — the dynamics are incompressible; phase-space volume is neither created nor destroyed \cite{symplectic_manifold_wiki}. A direct consequence: the flow cannot collapse onto a point (that would shrink volume to zero). This is one reason the *dynamics* keep a state moving *on* the shell rather than letting it settle into a single configuration.

**What the topology can force: the Arnold conjecture.** This is the strongest "what can be said about the shape" result in the subject. On a *closed* phase space, the topology — the Betti numbers, the counts of holes in each dimension — *lower-bounds* the number of fixed points (and, in the periodic form, of periodic orbits) of *any* Hamiltonian placed on it \cite{arnold_conjecture_wiki}:

$$
\boxed{
\#\{\text{fixed points}\}\;\ge\; \sum_{i=0}^{2n}\dim H_{i}(M) \;\ge\; \text{the Morse number of } M.
}
$$

In words: **the shape of the space forces a minimum number of rest-states.** No matter how you choose the energy, the system cannot have fewer equilibria — or periodic orbits — than the topology demands. The topology is a *hard constraint on the dynamics*: the rare case where the *shape of the arena* provably dictates a feature of the *motion inside it*.

<div class="optional md" data-headline="Where the physics phase space is richer than the AI 'phase space'">
Hold this distinction, because it decides what is a theorem and what is a lens. A *physical* phase space $T^{*}Q$ arrives equipped with a canonical symplectic form — and therefore with Darboux flatness, a Liouville volume, and the Arnold constraint. A neural network's *configuration / input space* has **none of that**: no canonical $\omega$, no incompressible flow, no topological lower bound on its critical points. It is just a (usually high-dimensional, noncompact) space, and the only structure it carries is what the *data and the loss* put there. So when this course says "the AI's phase space," it is *borrowing the word*. The rigorous shape theorems above apply to the physical $T^{*}Q$; to the machine, only the looser statement — "a scalar field selects a thin slice" — carries over. The analogy is *structural*, and this is exactly where that word earns its keep.
</div>
</div>

<div class="md">
## The energy function is the selector

**Plain.** Not every point of phase space is equally "alive". A single number, the **energy** $H(q,p)$, tells you which. $H$ is the *Hamiltonian*; for a mechanical system it is kinetic plus potential energy \cite[nLab]{nlab_hamiltonian_mechanics}:

$$
H(q,p) \;=\; \tfrac{1}{2m}\,\lVert p\rVert^{2} \;+\; V(q).
$$

The laws of motion move the state *along* the level sets of $H$. With no dissipation, $H$ is conserved, so a state never leaves the single surface $H = E$ on which it began. Even the most free physical system is therefore *already* confined to a slice: the **energy shell** $\{H = E\}$.

Statistical mechanics sharpens the point. A system in a heat bath does not sit at one energy; it *samples* the whole phase space with the **Boltzmann (canonical) distribution** \cite{boltzmann_distribution_wiki} \cite{canonical_ensemble_wiki}:

$$
P(q,p) \;=\; \frac{e^{-\beta\, H(q,p)}}{Z}, \qquad Z \;=\; \int e^{-\beta\, H(q,p)}\,dq\,dp,
$$

where $\beta = 1/(k_{B}T)$ is the inverse temperature and $Z$ is the **partition function** \cite{partition_function_wiki}. The whole argument of this chapter is sitting in that formula:

$$
\boxed{
\text{low energy} \;\Rightarrow\; \text{high probability}; \qquad\qquad \text{high energy} \;\Rightarrow\; \text{almost never.}
}
$$

The factor $e^{-\beta H}$ is a *selector*. It does not delete the high-energy part of phase space — that part is still *there*, still part of the space of all possibilities — but it assigns it vanishing weight. The system is found, with overwhelming probability, in the **low-energy slice**. That slice is where the stable, reproducible, *interesting* behaviour lives; everything else is *possible* but *empty*. The microcanonical version states the same thing more starkly: fix $E$ and the state is uniform *on the shell* $\{H=E\}$ and *nowhere else* \cite{canonical_ensemble_wiki}. Either way:

$$
\boxed{\text{the living part of phase space is a thin slice, selected by energy.}}
$$
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

**Why a *slice* and not "low energy blobs scattered everywhere"?** Because the useful configurations are not spread through the space. They lie on a **manifold**: a surface of much lower dimension than the space around it. This is the **manifold hypothesis** \cite[Sindhwani, Belkin & Niyogi, 2006]{sindhwani2006geometric} \cite[manifold learning]{manifold_learning_wiki}: natural data — faces, digits, sentences, audio — although it lives in a huge ambient vector space, is actually produced by a small number of free parameters, so it occupies a *low-dimensional* manifold *inside* that space.

The standard example. All images of the letter "A", scaled and rotated, are each a 1024-dimensional pixel vector, so the ambient space is $\mathbb{R}^{1024}$. But the only things that vary are two numbers — scale and rotation. The data lies on a **two-dimensional** surface curving through $\mathbb{R}^{1024}$ \cite[manifold learning]{manifold_learning_wiki}. Its *intrinsic* dimension is $2$; its *ambient* dimension is $1024$. For a language model the same fact is true and more extreme still: the space of all possible $100$-token outputs has size $\lvert V\rvert^{100}$ (for vocabulary size $\lvert V\rvert$) — a number with more digits than atoms in the observable universe. The set of outputs that are *grammatical and on-topic* is a measure-thin slice of it. The model is useful **on that slice, and only on that slice.**

<div class="optional md" data-headline="Making 'thin' precise: the measure-zero fact">
Make "thin" exact. A $k$-dimensional smooth manifold embedded in $\mathbb{R}^{N}$, with $k < N$, has **$N$-dimensional Lebesgue measure zero**. Sketch: cover the manifold by coordinate patches, each the image of a $C^{1}$ map from $\mathbb{R}^{k}$ into $\mathbb{R}^{N}$; such an image has $N$-measure zero, because the Jacobian has rank at most $k < N$. Consequences, two of them:

1. The useful slice is not "a smaller blob" — it is *measure zero*. A point drawn uniformly from the full phase space lands on the slice with probability *exactly* $0$.
2. Usefulness is a **knife-edge**. The model is correct precisely *because* it has been made to live on a measure-zero set, while a random configuration is correct with probability zero. "Just try random inputs" is not a strategy; the space is, almost entirely, *not* where the model works.

This is the precise sense in which "the AI only works on a slice": the slice is *all* of where it works, and it is *almost none* of the space.
</div>

**The phase-space form of the same fact.** An **attracting invariant manifold** in phase space — a surface that nearby trajectories flow onto and then stay on, indefinitely — is the dynamical-systems home of this idea \cite[manifold learning]{manifold_learning_wiki}. If such an attracting surface exists, the long-time behaviour of the system *is* that surface; the rest of phase space is only where the transients live before they decay into it. "The system only really does something on the attractor." That is the phase-space form of "the model only works on the slice."
</div>

<div class="md">
## The shape of the slices

We now know the useful slice is (i) *low-energy*, (ii) *low-dimensional*, and (iii) *measure-zero* in the ambient space. But what is its **shape**? Three answers — one from physics, one from measure theory, one from the machine — and they are not competing; they are three directions on the same slice.

**1. When the system is integrable, the slice is a *torus*.** The **Liouville–Arnold theorem** is one of the cleanest shape results in all of mechanics \cite[Liouville–Arnold]{liouville_arnold_wiki}. Take a Hamiltonian system with $n$ degrees of freedom that is *integrable* — it carries $n$ independent conserved quantities (the energy among them) that all Poisson-commute. At a regular point the state is confined to the *common level set* of those $n$ conserved quantities, and if that level set is compact and connected it is **diffeomorphic to the $n$-torus $\mathbb{T}^{n}$**. The motion on it is a simple quasi-periodic flow — the state winds around the torus at $n$ fixed frequencies. So for the idealised, well-behaved system, the useful slice has a *precise* shape:

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

**2. As a place where mass lands, the slice is a *thin shell*.** The measure-zero fact said the slice is "empty" for a *uniform* random point. The *dynamics* say almost the opposite: the Boltzmann/Gibbs measure piles essentially all of its weight onto the slice. In high dimension this is not an approximation but a theorem — the **concentration of measure** phenomenon, the "thin shell" result behind the equivalence of the ensembles of statistical physics \cite[concentration of measure]{concentration_of_measure_wiki}. The typical energy, and a thin band around it, capture almost all the probability; as temperature drops the mass collapses onto the ground state. So there are **two independent senses of "thin," and both hold at once**:

$$
\boxed{
\begin{aligned}
&\text{measure-zero for a \emph{uniform} point\ \ \ \ (nothing is there);}\\
&\text{yet carrying \emph{all} the mass under the \emph{dynamics}\ \ \ \ (everything is there).}\\
&\text{The useful slice is, at once, empty and full.}
\end{aligned}
}
$$

**3. As the machine sees it, the slice is a *manifold* — and even the solutions have a shape.** The data manifold $M^{k}\subset\mathbb{R}^{N}$ is not assumed to be one smooth flat surface. Real data manifolds are **curved** (they carry intrinsic Riemannian curvature), can be **branched** or **multi-modal** (a union of patches — the "two moons," the "Swiss roll," an S-curve), and can carry **nontrivial topology** (holes, handles) \cite[manifold learning]{manifold_learning_wiki}.

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

**Status.** As with the previous two chapters, this is a *lens*, not a theorem. The physics is exact about *itself*: phase space, the symplectic form, the Boltzmann selector, the measure-zero slice — each is a fact. The transfer to machines is *structural*. What carries over is the **shape** — a scalar field selecting a measure-thin, low-complexity subset of a vast space of possibilities — not the literal apparatus (no $\omega$, no conservation law, no temperature in a frozen LLM). The standing rule of the course applies here without exception: **a useful analogy is not a theorem.** Where this chapter's energy is the loss and the slice is the data manifold, that is a precise structural claim. Where it would require a GPU to conserve a Hamiltonian, it is not — and it does not.
</div>
