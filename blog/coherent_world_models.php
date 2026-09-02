<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: From World to Model: Coherent Representation
description: Partial observations, admissible transitions, and descent — a careful bridge from perception to sheaves, ∞-descent, model theory, and AI.
icon: 🧩
part: 4
order: 22
color: accent
topics: philosophy, math-i, math-ii, category-theory, sheaves, type-theory, model-theory, ai, epistemology
-->

<div class="md">

## The question

No inquirer has unmediated access to its subject matter. A physicist never grasps an electron *as it is in itself*; a mathematician never inspects an abstract structure from a *view from nowhere*; a listener can touch the speaker, but what their fingers meet is already a transformed trace — pressure into nerve signal into percept — never the sound source as it would be apart from any perception. A historian never enters the past. In every domain, we work with *transformed traces*: measurements, sense-data, formal reports, proof scripts, embeddings, archival documents.

**Definition (trace).** A *trace* is whatever an *access function* $O : W \to R$ leaves behind when applied to (a region of) a subject matter $W$. Formally, a trace is a point $r \in R$ such that $r = O(w)$ for some $w \in W$. Concretely: an electron leaves a track in a cloud chamber; a tree leaves a shadow on the ground; a past event leaves a document in an archive; an abstract structure leaves a proof in a published paper. Four properties follow:

1. *Transformed.* Within the framework, the trace is *not* $w$ but the result of an access procedure applied to $w$. What we hold is the output of the procedure, never the input to it.
2. *Mediated.* The trace carries the marks of $O$ — different access functions on the same $w$ produce different traces. The marks of $O$ are part of the trace; *within the framework*, an unmediated trace is a contradiction in terms.
3. *Underdetermined.* Many $(w, O)$ pairs can yield the same $r$. From the trace alone, neither the source $w$ nor the procedure $O$ is uniquely determined; recovering them is the whole task of inference.
4. *Possibly indexical.* A trace *may* point beyond itself to a source — but not every trace does. A genuine measurement of a specific system is indexical; a hallucination that has the form of a measurement is not; pure noise is not; a free pattern in a derivation points only to the derivation itself, not to anything outside it. Whether a trace is *of* something, and *what* it is of, is a substantive question — not given in advance. This fourth property is conditional; establishing it is most of the work of inference. The first three are *internal* to the framework — they hold for every trace *given* the framework's commitments, and they are not asserted against positions (direct realism, qualia-primary views) that reject those commitments. A trace without indexicality is not yet evidence; it is data awaiting a source.

What we receive is *always already mediated* — this is the framework's foundational commitment, not a neutral observation. The redness of red, the pain of a headache, the taste of coffee are, on the framework's account, the final output of a long pipeline (photoreceptors → retinal processing → lateral geniculate nucleus → visual cortex → attentional and mnemonic modulation → …) applied to the world; they *feel* immediate only because we do not consciously witness the pipeline that produced them; the redness is the brain's construction, not the photon's revelation. The framework here takes the indirect-realist / representationalist side: there is a subject matter distinct from access, and a thing-in-itself distinct from any appearance. A philosopher who holds qualia to be primary — for whom the redness *is* the world's redness, not a brain construction — will not share this starting point; they will say the framework has mis-described perception. The dispute is *foundational*: it cannot be settled inside the framework, only acknowledged at the door. Inside the framework, there is no Archimedean point from which the world shows itself untransformed. Kant's name for what is forever on the other side of this mediation is the *thing in itself* (*Ding an sich*) — first introduced in the *Critique of Pure Reason* at KrV A26/B42 (§3 of Space, in the Transcendental Aesthetic) and developed systematically in the chapter "Of Phenomena and Noumena" at A235/B294 \cite{kant_critique_pure_reason}; the technical term here is **the subject matter as it would be independent of any access**. We never get there. The right question is therefore not "how do we reach it?" but "what can we honestly do with the traces we have?"

$$
\boxed{
\begin{aligned}
&\text{When does a collection of partial, differently-transformed traces}\\
&\text{deserve to be called a description of \emph{one} subject matter?}
\end{aligned}}
$$

The chapter's answer, in the vocabulary of *Coherent Difference*: **when the traces cohere** — two complementary halves of one principle:

$$
\underbrace{\text{compatibility on overlaps}}_{\text{where two local descriptions meet, they agree}}
\;\;\Longleftrightarrow\;\;
\underbrace{\text{uniqueness of the global}}_{\text{one whole extends them, and only one}.}
$$

Mathematicians call the package *descent*; the philosophical tradition has long called it *coherence*. We keep both names.

One discipline runs through the whole chapter: $\boxed{\text{locate every difference at the right level.}}$ Is the disagreement between two reports a difference in the *world*, in the *instrument*, or in the *interpretation*? Conflating these is the most common failure of "world model" talk.

</div>

<div class="md">

## Three kinds of difference

Between "subject matter $W$" and "the trace $r \in R$ I received" sit at least three independent sources of difference. They sit at *different places* in the chain and demand different remedies.

**1. The world-level — $W_1 \neq W_2$.** Two *subjects* genuinely differ: two distinct stones, two historical events, two specific classical objects. Reports disagree because the world itself is different at the two accesses.

*Example.* Alice weighs stone A; Bob weighs stone B (a different stone). Their data need not match — and the right response is not to reconcile them, but to note that they are about different things.

*Caveat.* Identical quantum particles (electrons, photons) are *literally indistinguishable* — there is no fact of the matter about "this electron" versus "that electron", and asking whose data matches whose has no answer at the particle level. For such systems the world-level difference is the difference of *spacetime region* or *quantum state*, not of individual particles.

**2. The channel-level — $I_1 \neq I_2$.** Two *instruments* read the same world differently: thermometer vs. thermocouple, eye vs. microphone, uncalibrated vs. calibrated telescope.

*Example.* Two thermometers *placed at the same point* read $20.01$ and $20.02$. A room, however, is not a single temperature but a temperature *field* — two thermometers at different positions may legitimately report different values, and that would be a *world-level* difference (different points in the field), not a channel-level one. The diagnostic is co-location: if the readings differ at the same point, the difference is in the instruments; calibrate one against the other, or both against a standard.

**3. The processing-level — $N_1 \neq N_2$.** Two *interpretations* of the same trace yield different conclusions: a classical and a quantum reading of the same detector output, a literal and a metaphorical reading of the same text, an outdated and a current taxonomy applied to the same specimen.

*Example.* The same Doppler-shifted spectrum is read by one physicist as evidence for a moving source, by another as evidence for an expanding universe. The trace is fixed; the interpretive framework differs.

$$
\boxed{
\begin{aligned}
&\text{Two reports disagreeing does not, by itself,}\\
&\text{tell you which level is responsible.}\\
&\text{Locate the difference at the right level.}
\end{aligned}}
$$

</div>

<div class="md">

## Notions of sameness

Not everything called "the same" is the same *kind* of same. The vocabulary of *Coherent Difference* gave us a hierarchy. Here it is again, strongest to weakest:

- $x = y$ — *literal*: the very same object, the very same datum.
- $x \cong y$ — *isomorphism*: structurally indistinguishable; an invertible map carries one to the other.
- $x \simeq y$ — *homotopy equivalence*: related by a deformation that can be undone, up to coherent witnesses.
- $d(x, y) \le \varepsilon$ — *approximation*: close enough for current purposes, with a quantified residual.
- $P(D_1, D_2 \mid M)$ high — *statistical*: agreement under a probabilistic model, not on the nose.

Each form has a parallel in **sense data**, **measurement**, and **mathematics**:

|                       | Sense data                              | Measurement                                | Mathematics                       |
|-----------------------|-----------------------------------------|--------------------------------------------|-----------------------------------|
| $x = y$               | the same photon, the same rod           | two clocks show the same tick              | $2 + 2 = 4$                       |
| $x \cong y$           | two indistinguishable coins             | two calibrated meters, same reading        | $\mathbb{Z}/6 \cong \mathbb{Z}/2 \times \mathbb{Z}/3$ |
| $x \simeq y$          | flash and bang from one strike          | two experiments, one phenomenon            | cup $\simeq$ donut                |
| $d(x,y) \le \varepsilon$ | $20.01$ vs $20.02$ on a thermometer  | within tolerance                           | $\|f_n - f\|_\infty < \varepsilon$ |
| $P$ high              | eyewitness and CCTV agree               | two studies reject the same $H_0$          | Monte-Carlo agrees with theorem   |

In **dependent type theory** these are not different phrases for the same thing; they are *literally different types*. To say $x = y$ in a type $A$ is to inhabit the type $\mathsf{Id}_A(x, y)$ — a *space* of witnesses. To say $x \cong y$ is to inhabit $\mathsf{Iso}(x, y)$ — a different space, with different inhabitants. To say $x \simeq y$ is yet another type.

In **Homotopy Type Theory (HoTT)** the equality type is itself a space: its points are *paths* from $x$ to $y$, and these paths may themselves be related by higher paths. Under the **univalence axiom** this becomes literal: for types in a universe $\mathcal{U}$, an equality in $\mathcal{U}$ *is* an equivalence — so $(x =_{\mathcal{U}} y) \simeq (x \simeq y)$. So a claim like "$R_A =_x R_B$" is not a proposition (yes/no) but a *space of answers*: it contains paths from $R_A$ to $R_B$, and those paths may be homotopic to each other or genuinely distinct. Asking "are these the same?" may have a whole space of witnesses, not one.

This is why **silent upgrades between rows** are the most common category error in "world model" talk:

- *Treating an approximation as equality.* Two temperature readings within tolerance are not the same temperature; they are *within* $\varepsilon$ of each other.
- *Treating an isomorphism as identity.* Two indistinguishable coins are not the same coin — exchange them and the world changes if anything depends on the swap.
- *Treating statistical agreement as proof.* Two studies rejecting the same null hypothesis agree on a single test; their underlying assumptions can still differ.
- *Treating model-theoretic consistency as truth.* A model with a common interpretation is internally consistent; it can still be the wrong model.

$$
\boxed{
\begin{aligned}
&\text{Never silently strengthen a weaker}\\
&\text{sameness into a stronger one.}
\end{aligned}}
$$

What "silent strengthening" means: passing from a witness of $\simeq$ to a claim of $=$, or from a proof of $\le\varepsilon$ to a proof of equality, without explicitly carrying the residual. Each promotion must be earned, witnessed, and recorded.

</div>

<div class="md">

## Transformation is the missing concept

Given two representations $R_A, R_B$, the naive question "$R_A = R_B$?" is usually the wrong one. Replace it with a transition, or with a common target:

$$
\begin{array}{ccc}
\underbrace{R_A}_{\text{one view}} & \xrightarrow{\;T_A\;} & \underbrace{Z}_{\text{shared calibrated space}}\\
&& \uparrow{\scriptstyle T_B}\\
&& \underbrace{R_B}_{\text{another view}}
\end{array}
$$

A coordinate change is not a new physics; a translation is not a new event; a change of basis is not a new vector space; a Fourier transform is not a new signal.

$$
\boxed{
\begin{aligned}
&\text{Difference is informative when}\\
&\text{we know what produced it.}
\end{aligned}}
$$

</div>

<div class="md">

## Admissible transitions

For any two finite sets of equal size, *some* bijection exists. So the bare claim "there is a transformation" is empty — it carries no information. The real content is **a constrained class** $\mathcal T$, justified independently of the data it is later applied to:

$$
\underbrace{\mathcal T}_{\text{admissible transitions}} \;\subseteq\; \underbrace{\mathrm{Hom}(R_i, R_j)}_{\text{all conceivable maps}}.
$$

What can belong in $\mathcal T$ — the list is open; what matters is the justification, not exhaustiveness:

- **sensor calibration** — measurement
- **coordinate change** — geometry
- **physical law** — propagation, signal transport
- **proof-preserving translation** — mathematics
- **validated decoder** — machine learning
- **documented archival transmission** — history
- $\vdots$ *(any other map whose license has been argued for in advance)*

$$
\boxed{
\begin{aligned}
&\text{More transformation freedom}\\
&\Rightarrow \text{ more evidence required.}
\end{aligned}}
$$

$\mathcal T$ plays three roles at once: a **subcategory** constraint (only certain morphisms allowed), a **Bayesian prior** (some hypotheses are favoured a priori), and an **Occam penalty** (an unjustifiably large $\mathcal T$ is its own kind of over-fitting). Three presentations of one restriction.

</div>

<div class="md">

## Contexts as a site

Following *Coherent Difference*, **context** is used in the widest possible sense: anything that can index data points counts as a "space". A context specifies the conditions under which a report was made:

- *where* — place, system, domain
- *when* — time, duration, dynamical regime
- *who* — observer, agent, instrument
- *how* — method, apparatus, procedure
- *in what terms* — language, framework, formalism
- *in what tradition* — culture, era, paradigm

A historical period is a context. A laboratory setup is a context. A formal system is a context. A culture at a given moment is a context. The "spaces" of *Coherent Difference* all count.

Between two contexts there are *refinements*: from "Tuesday afternoon" to "between 3 pm and 4 pm"; from "European philosophy" to "Kant circa 1781"; from "classical mechanics" to "the Lagrangian formulation on a configuration manifold". Morphisms in the context-category $\mathcal{C}$ are exactly these refinements — narrower, more specific, more constrained.

A **cover** of a context is a family of sub-contexts whose images together capture everything relevant about it. The everyday picture: overlapping photographs cover a room when every point of the room appears in at least one of them. In a topological space this is an **open cover**: a family of open sets whose union contains the whole. In category theory, the most general version — due to Grothendieck — is a *designated rule* saying which families of sub-objects count as covers; this rule is a **Grothendieck topology**, and the category equipped with it is a **site**. The name sounds forbidding, but the content is just: *here is how we decide when a family of smaller views "covers" a larger one*. The rule must respect refinements (narrowing a cover still covers) and composition (covers of covers are covers).

In this chapter the cover must do one further job: every morphism in it must lie in the admissible class $\mathcal T$. We call such a cover **admissible**:

$$
\{c_i \xrightarrow{\,O_i\,} c\}_{i \in I}\ :\ O_i \in \mathcal{T},\quad
\text{and the } \mathcal{T}\text{-images of the }c_i\text{ jointly determine }c.
$$

The adjective matters. Without the admissibility filter, *any* family of sub-contexts could be declared a "cover", and the demand that local data cohere would become vacuous. By restricting to admissible covers, we turn the sheaf condition into a *meaningful* question about a specific modelling setup.

Equipping $\mathcal{C}$ with a rule for which families count as covers (one that closes under refinement and under composition) is a **Grothendieck topology** $J$; the pair $(\mathcal{C}, J)$ is a **site** (as sketched in *Coherent Difference*).

A **representation scheme** assigns to every context a set of "sections" — the things one can write down *on* that context:

$$
\underbrace{F}_{\text{rep. assignment}}\ :\ 
\underbrace{\mathcal{C}^{\mathrm{op}}}_{\text{contexts, refinements reversed}} 
\longrightarrow 
\underbrace{\mathcal{V}}_{\text{target category}}.
$$

$\mathcal{V}$ can be $\mathbf{Set}$, metric spaces, probability spaces, chain complexes, or $\infty$-groupoids — depending on how much homotopy is needed.

</div>

<div class="md">

## Sheaves: coherence = descent

In plain English first. A presheaf $F$ assigns a set of "local sections" to every context: $F(c)$ is the data one can write down *on* $c$. Sheaf-ness is the rule that turns *compatible* local data into *unique* global data.

$$
\boxed{\;\text{compatible local data} \;\Longrightarrow\; \text{unique global data}.\;}
$$

A family $\{s_i \in F(c_i)\}$ is **compatible** when, on every pairwise overlap $c_i \times_c c_j$, the two restrictions of $s_i$ and $s_j$ agree. A sheaf says: that condition alone is enough — there is exactly one global section in $F(c)$ whose restriction to each patch is $s_i$.

Now the same content as an equation. For every admissible cover $\{c_i \to c\}_{i \in I}$:

$$
\underbrace{F(c)}_{\text{global section on }c}
\;\xrightarrow{\;\sim\;}\;
\underbrace{\;\mathrm{Eq}\!\Bigl(\;
\underbrace{\prod_{i\in I} F(c_i)}_{\text{a section on each patch}}
\;\rightrightarrows\;
\underbrace{\prod_{i,j\in I} F(c_i \times_c c_j)}_{\text{a section on each pairwise overlap}}
\;\Bigr)}_{\substack{\text{the tuples that agree on every overlap}\\
\text{(two restriction arrows: from $i$-side, from $j$-side)}}}
$$

Three pieces, reading left to right:

1. **The big set $\prod_i F(c_i)$.** A tuple whose $i$-th entry is a section on patch $c_i$. The product says: give me one section per patch, nothing more.

2. **The two arrows into $\prod_{i,j} F(c_i\times_c c_j)$.** Each arrow restricts the tuple of sections to a section on the overlaps. The "from $i$" arrow projects the $i$-th entry onto the overlap with $c_j$; the "from $j$" arrow does the symmetric thing. The two arrows agree exactly when the chosen sections agree on every overlap.

3. **The equalizer.** Out of all tuples in $\prod_i F(c_i)$, keep only those on which the two arrows give the same answer. Those are precisely the compatible tuples — and the sheaf condition says there is a *unique* global section in $F(c)$ sitting above each compatible tuple.

The $\varprojlim$ in older presentations does exactly the same job; the equalizer is just its name when the diagram is a single parallel pair. (For covers of more than two patches, $\varprojlim$ runs over the full *Čech nerve* — see "Higher coherence" below.)

The isomorphism $F(c) \simeq \mathrm{Eq}(\cdots)$ is the **sheaf condition**: the smallest, sharpest statement of the local-to-global principle.

Reading in plain English, one more time: **for every family of local sections that agree on every overlap, there is one and only one global section restricting to them.**

$$
\begin{array}{c|c|c}
\text{Regime} & \mathcal V & \text{"Compatible" means}\\
\hline
\text{Strict} & \mathbf{Set} & \text{equal on overlaps}\\
\text{Homotopical} & \infty\text{-groupoids} & \text{coherently equivalent}\\
\text{Empirical} & \text{metric / probability} & \text{small residual under a loss}
\end{array}
$$

The empirical row is not a theorem of sheaf theory; it is the same **shape** in a different target.

</div>

<div class="md">

## The running example (now that we have sheaves)

A train passes a platform. Channels:

$$
\begin{array}{ccccc}
&&\underbrace{W}_{\text{train event}}&&\\
&\swarrow{\scriptstyle O_v}&\downarrow{\scriptstyle O_a}&\searrow{\scriptstyle O_r}&\\
\underbrace{R_v}_{\text{seen}}&&\underbrace{R_a}_{\text{heard}}&&\underbrace{R_r}_{\text{radar}}\\
&\searrow{\scriptstyle L_v}&\downarrow{\scriptstyle L_a}&\swarrow{\scriptstyle L_r}&\\
&&\underbrace{R_\ell}_{\text{spoken report}}&&\\
&&\downarrow{\scriptstyle C}&&\\
&&\underbrace{R_h}_{\text{archive, 100 yrs later}}&&
\end{array}
$$

Five representations, five different categories. The site $\mathcal C$ contains their contexts; the **admissible cover** of "the event" is the family $\{c_v, c_a, c_r, c_\ell, c_h\} \to c$ — each arrow admissible, the patches together recovering everything relevant about $c$. $\mathcal T$ contains sensor calibration, physical propagation (sound delay, Doppler), validated linguistic reporting, and archival transmission with error bounds. A global $G \in F(c)$ exists iff descent holds.

The same shape governs **mathematical data**: a group presented by generators-and-relations, by a Cayley table, by a permutation action, by a matrix representation, by a character table. Five presentations, five categories, one group — provided the transitions between presentations are admissible (isomorphisms of the appropriate kind).

</div>

<div class="md">

## Equalizers: where two maps agree

Given parallel maps $f, g : X \rightrightarrows Y$, the equalizer selects the part of $X$ on which they agree:

$$
\underbrace{E}_{\text{agreement locus}}
\xrightarrow{\;e\;} X 
\underset{g}{\overset{f}{\rightrightarrows}} Y,
\qquad
\underbrace{E = \{x \in X : f(x) = g(x)\}}_{\text{in }\mathbf{Set}}.
$$

Two thermometers report a temperature over time: the equalizer is the *times* at which they agree exactly. Two proofs of the same theorem produce numeric outputs by two different routes: the equalizer is the inputs on which the outputs literally match. In an $(\infty,1)$-category the equalizer is a *space of paths of agreement* — same idea, more room.

</div>

<div class="md">

## Pullbacks: agreement through a shared target

$$
\begin{array}{ccc}
\underbrace{X \times_Z Y}_{\text{pairs that agree in }Z} & \xrightarrow{\;\pi_X\;} & X\\
{\scriptstyle \pi_Y}\downarrow && \downarrow{\scriptstyle f}\\
Y & \xrightarrow{\;g\;} & \underbrace{Z}_{\text{shared calibrated space}}
\end{array}
$$

The pullback *is* the object of agreements. Visual and radar tracks pull back over a calibrated position-time space to give the pairs that could be the same train. Two definitions of "prime" pull back over $\mathbb Z$ to the integers on which both definitions coincide.

</div>

<div class="md">

## Higher coherence

Suppose three representations $A, B, C$ are related pairwise:

$$
A \xrightarrow{\;\phi_{AB}\;} B \xrightarrow{\;\phi_{BC}\;} C,\qquad A \xrightarrow{\;\phi_{AC}\;} C.
$$

There are now two ways to go from $A$ to $C$: directly via $\phi_{AC}$, or by composition $\phi_{BC} \circ \phi_{AB}$. The question is whether these two ways agree.

- **Strict regime.** They agree *on the nose*: $\phi_{BC} \circ \phi_{AB} \;=\; \phi_{AC}$. Equality is a single yes/no answer.

- **Homotopical regime.** They agree *up to a witness* — a **2-morphism** $\alpha_{ABC} : \phi_{BC} \phi_{AB} \Rightarrow \phi_{AC}$. Think of $\alpha_{ABC}$ as a "filler" that says the two routes are not the same path but can be *continuously deformed* into one another. The 2-morphism itself is data; you can ask further questions about *it*.

- **Four representations.** Add $D$, with its own transitions. Now the fillers $\alpha_{ABC}$, $\alpha_{BCD}$, $\alpha_{ACD}$, $\alpha_{ABD}$ may themselves disagree — and you need a **3-morphism** filling between the fillers to certify higher-order consistency. And so on.

The generalisation is clean: an **$n$-morphism** is a cell of dimension $n$ in a higher category.

- $0$-cells: objects
- $1$-cells: morphisms between objects
- $2$-cells: morphisms between morphisms
- $3$-cells: morphisms between $2$-cells
- $\vdots$
- $n$-cells: morphisms between $(n-1)$-cells

$$
\boxed{
\begin{aligned}
&\text{Relations can themselves have relations.}\\
&\text{The tower is not decoration.}
\end{aligned}}
$$

The sheaf condition itself runs up this tower. The classical sheaf condition (Section "Sheaves") tests *equality* on pairwise overlaps. To handle homotopical targets, one builds the **Čech nerve** of the cover $\{c_i \to c\}$: a simplicial object that in degree $0$ lists the patches, in degree $1$ lists pairwise overlaps, in degree $2$ lists triple overlaps, and so on, with face and degeneracy maps encoding the combinatorial structure. The sheaf condition becomes the requirement that the limit (now a limit in $\infty$-groupoids) over the whole Čech nerve reproduces $F(c)$.

An **$\infty$-sheaf** is a sheaf-like object valued in $\infty$-groupoids instead of sets: instead of *equality* on overlaps one requires *coherent equivalence*, with the coherence tracked at every level. Sheaf = descent-data in $\mathbf{Set}$; $\infty$-sheaf = descent-data in $\infty\text{-Gpd}$.

*Physical example.* Lightning and thunder from one strike are not *equal* on their time-overlap; they are related by a *homotopy* whose parameter is the travel-time delay. Triple overlaps (add a distant echo) require the delays to *compose coherently*. An $\infty$-sheaf handles this exactly.

*Mathematical example.* Three equivalent categories $\mathcal A \simeq \mathcal B \simeq \mathcal C$ do not satisfy $\phi_{BC} \circ \phi_{AB} = \phi_{AC}$ on the nose; they satisfy it up to a natural isomorphism. With $n$ equivalent categories, the isomorphisms-between-isomorphisms are the higher data.

</div>

<div class="md">

## The observer is part of the diagram

Every access to a subject matter is a composite, in every domain:

$$
\underbrace{W}_{\text{subject}}
\xrightarrow{\;I\;}\underbrace{S}_{\text{stimulus/signal}}
\xrightarrow{\;N\;}\underbrace{R}_{\text{internal rep.}}
\xrightarrow{\;L\;}\underbrace{\Sigma}_{\text{report/encoding}}
\xrightarrow{\;C\;}\underbrace{M}_{\text{model}}.
$$

$$
\boxed{
\begin{aligned}
&\text{Which structure of the subject matter does this}\\
&\text{representation preserve, and what does it discard?}
\end{aligned}}
$$

</div>

<div class="md">

## Where AI actually enters

So far everything has been a *specification*: a list of conditions that a coherent world model must satisfy. This section asks the converse question — does any part of modern machine learning *already* realise these conditions, even informally?

Neural networks compose **parametric maps** — functions of the form $f_\theta : X \to Y$ that depend on a parameter vector $\theta$ learnable from data. Composing such maps is not just function composition, because the parameters compose too; several frameworks make this precise:

$$
\begin{array}{c|c}
\text{Framework} & \text{What it treats as the morphism}\\
\hline
\mathbf{Para} & \text{a map together with its parameter space}\\
\text{Lenses} & \text{a forward map paired with its backward "update"}\\
\text{Optics} & \text{a general forward/backward pair, subsuming both}
\end{array}
$$

The point for us is only that a network is a **composable morphism**, not a set-theoretic function. A Transformer layer:

$$
\underbrace{H_{\ell+1} = H_\ell + G_\theta(H_\ell)}_{\text{residual update: keep old, add correction}}
$$

is such a morphism whose output *retains* its input additively. In category theory, a structure with a natural "unfold-into-parts" operation is called a **coalgebra**; the residual layer looks coalgebra-like because it exposes an old-state component next to a new-state contribution. This is a structural analogy, not a theorem.

Multi-head attention:

$$
\underbrace{\mathrm{Attn}(Q,K,V) = \mathrm{softmax}\!\Bigl(\tfrac{QK^\top}{\sqrt{d_k}}\Bigr)V}_{\text{learned mixing of positions by their pairwise similarity}}
$$

with the pieces:

$$
\underbrace{QK^\top}_{\text{score: who attends to whom}} 
\xrightarrow{\mathrm{softmax}} 
\underbrace{A}_{\text{normalized relational weights}} 
\xrightarrow{\cdot V} 
\underbrace{\text{context-mixed representation}}_{\text{new } H}.
$$

None of this makes a network a sheaf. What the framework of this chapter *does* buy for AI:

**Embeddings** as functors from a discrete category of tokens to a metric target:

$$
\underbrace{E : V}_{\text{tokens}} \longrightarrow \underbrace{\mathbb R^d}_{\text{geometric representation}},
\qquad
\underbrace{\text{which token-relations become geometric?}}_{\text{the useful question}}
$$

**Multimodal alignment** as (partial) descent over a cover by modalities into *one* shared latent:

$$
\begin{array}{ccc}
\underbrace{\text{image}}_{c_v} & \xrightarrow{E_v} & \phantom{M_{\text{shared}}}\\
\underbrace{\text{text}}_{c_l} & \xrightarrow{E_l} & M_{\text{shared}}\\
\underbrace{\text{audio}}_{c_a} & \xrightarrow{E_a} & \phantom{M_{\text{shared}}}
\end{array}
$$

**Training** as constraint accumulation over overlapping examples:

$$
\underbrace{\theta^\ast = \arg\min_\theta \mathcal L(\theta; D)}_{\text{many overlapping constraints}\,\to\,\text{one parameterized function}}.
$$

**Generative models** as posterior integration of heterogeneous partials:

$$
\underbrace{x_1,\dots,x_n}_{\text{observed data}} 
\xrightarrow{\text{posterior}} 
\underbrace{P(z \mid x_1,\dots,x_n)}_{\text{latent structure integrating them}}.
$$

**Hallucination** = internal coherence without descent from a grounded cover:

$$
\underbrace{M_{\text{internal}}\text{ self-consistent}}_{\text{fits its own outputs together}} 
\;\not\Rightarrow\; 
\underbrace{M_{\text{internal}} \approx W}_{\text{grounded in the world}}.
$$

$$
\boxed{
\begin{aligned}
&\text{Internal coherence}\\
&\neq\text{ descent from grounded contexts.}
\end{aligned}}
$$

</div>

<div class="md">

## Invariants: what survives a change of representation

For each admissible transition $T \in \mathcal T$, ask what is preserved — and what is discarded. The catalogue of invariants is open, but every entry must be defended:

- *causal order* — what comes before / after
- *adjacency* — what touches what
- *symmetry actions* — groups acting on the object
- *conservation laws* — energy, charge, count
- *statistical dependence* — correlations, information flow
- *homotopy type* — shape up to deformation
- $\vdots$ *(anything else the admissible transitions of the domain preserve)*

$$
\boxed{
\begin{aligned}
&\text{Speak only of what your}\\
&\text{admissible transitions preserve.}
\end{aligned}}
$$

A representation is judged not by whether it *is* the subject matter but by *which structure* of the subject matter it preserves and which it discards.

</div>

<div class="md">

## The hierarchy — never upgrade silently

The forms of sameness form a tower from strongest to weakest. The arrow on each line means "implies the row below" — a witness of a stronger row is automatically a witness of every weaker one; the converse is false.

- **strict** ($s_i|_U = s_j|_U$) — *same on overlap*. Implies iso.
- **iso** ($s_i \cong s_j$) — *invertible comparison*. Implies homotopy equivalence.
- **homotopy** ($s_i \simeq s_j$) — *coherent deformation*. Implies approximation under any compatible metric.
- **approx** ($d(s_i, s_j) \le \varepsilon$) — *within tolerance*. Implies statistical agreement under any reasonable model.
- **stat** ($P(D_i, D_j \mid M)$ high) — *probabilistic agreement*. Implies model-theoretic compatibility.
- **model-theoretic** ($\exists M : M \models T_{\text{all}}$) — *common interpretation of the theories*.

Concrete examples in each row:

$$
\begin{array}{c|c}
\text{Level} & \text{Example}\\
\hline
\text{strict} & \text{two measurements yield the same integer count}\\
\text{iso} & \text{two coordinate charts for the same manifold patch}\\
\text{homotopy} & \text{two continuous deformations of the same curve}\\
\text{approx} & \text{two temperature sensors within tolerance}\\
\text{stat} & \text{two studies both reject the same null hypothesis}\\
\text{model-theoretic} & \text{two theories with a common model}
\end{array}
$$

Correlation is not identity. A plausible transformation is not proof. Consistency is not truth.

</div>

<div class="md">

## The one diagram

$$
\begin{array}{ccccc}
&&\underbrace{W}_{\text{subject matter}}&&\\
&{\scriptstyle O_1}\swarrow&{\scriptstyle O_2}\downarrow&{\scriptstyle O_3}\searrow&\\
\underbrace{R_1}_{\text{view 1}}&&\underbrace{R_2}_{\text{view 2}}&&\underbrace{R_3}_{\text{view 3}}\\
&{\scriptstyle T_1}\searrow&{\scriptstyle T_2}\downarrow&{\scriptstyle T_3}\swarrow&\\
&&\underbrace{G = \varprojlim F}_{\text{coherent global model}}&&\qquad T_i \in \mathcal T
\end{array}
$$

Three views shown; the cover can have any number. Replace the index by an arbitrary set $I$ (finite, countable, or uncountable) and add as many $R_i$, $O_i$, $T_i$ as you like:

$$
\cdots \;\xrightarrow{\,O_{i-1}\,}\; R_{i-1}\; \xleftarrow{\,O_i\,}\; W\; \xrightarrow{\,O_{i+1}\,}\; R_{i+1}\; \xrightarrow{\,O_{i+2}\,}\;\cdots
$$

and analogously for the $T_i$. The global model becomes $G = \varprojlim_{\,i\in I} F(R_i)$, the limit over *all* views in $I$ — three, a thousand, or uncountably many. The three-view picture above is the smallest non-trivial case; the whole framework scales to covers of any size.

Different mathematics, one shape:

$$
\begin{array}{c|c}
\text{Setting} & G \text{ is}\\
\hline
\text{Strict} & \text{a limit in } \mathbf{Set}\\
\text{Homotopical} & \text{a limit in an }(\infty,1)\text{-topos}\\
\text{Model-theoretic} & \text{an object of }\mathrm{Mod}(T_D)\\
\text{Probabilistic} & \text{a posterior mode}\\
\text{ML} & \text{a learned latent making the }R_i\text{ jointly predictable}
\end{array}
$$

Different mathematics; one shape.

</div>

<div class="md">

## What the framework forbids

$$
\boxed{
\begin{aligned}
&\text{1. Silent upgrade of a weak sameness}\\
&\quad\text{into a stronger one.}\\
&\text{2. An unconstrained }\mathcal T\text{: coherence}\\
&\quad\text{becomes vacuous.}\\
&\text{3. Identifying }G\text{ with }W.\\
&\text{4. Internal coherence mistaken for}\\
&\quad\text{descent from grounded contexts.}\\
&\text{5. Treating a suggestive analogy —}\\
&\quad\text{attention, residuals, embeddings —}\\
&\quad\text{as a theorem in the borrowed category.}
\end{aligned}}
$$

A useful analogy is not a theorem.

</div>

<div class="md">

## A practical procedure

The whole framework, compressed into nine steps you can run through on any dataset, in any domain. Each step has a question; the framework is the discipline of asking them in order.

Given complicated evidence, in any domain:

1. **Take the raw datum $D$.** What is actually in front of you?
2. **Interpret it as $I(D)$.** What reading are you imposing?
3. **Draw the chain $W \to D \to I$.** Where in the chain could disagreement enter?
4. **Identify overlaps.** Where do independent channels meet?
5. **Specify admissible transitions $T_{ij} \in \mathcal T$.** What licenses each comparison?
6. **Decide which sameness.** $=$, $\cong$, $\simeq$, $\le \varepsilon$, statistical — pick the right one and refuse to upgrade.
7. **Build the candidate global model $G$.** Does descent hold on every admissible cover?
8. **Record residuals.** What is preserved, not erased?
9. **Plan the next observation.** What evidence would discriminate?

$$
\boxed{\text{Anomalies are constraints not yet integrated, not defeats.}}
$$

</div>

<div class="md">

## Where each theory lives on one chain

$$
\boxed{
\begin{aligned}
&\text{distinction} && \text{(sets, type theory)}\\
&\quad\downarrow\\
&\text{relation} && \text{(graphs, typed identity)}\\
&\quad\downarrow\\
&\text{transformation} && \text{(categories)}\\
&\quad\downarrow\\
&\text{locality} && \text{(topology, sites)}\\
&\quad\downarrow\\
&\text{compatibility} && \text{(sheaves)}\\
&\quad\downarrow\\
&\text{coherence} && \text{($\infty$-sheaves, HoTT)}\\
&\quad\downarrow\\
&\text{gluing} && \text{(descent)}\\
&\quad\downarrow\\
&\text{globality} && \text{(model theory, ML)}\\
&\quad\downarrow\\
&\text{invariance} && \text{(what survives }\mathcal T\text{)}
\end{aligned}}
$$

$$
\begin{array}{c|c}
\text{Theory} & \text{Where it contributes}\\
\hline
\text{Set / type theory} & \text{distinction, typed sameness}\\
\text{Category theory} & \text{transformation, composition}\\
\text{Topology / sites} & \text{locality without metric}\\
\text{Sheaf theory} & \text{compatibility}\to\text{gluing}\\
\infty\text{-categories, HoTT} & \text{higher coherence}\\
\text{Model theory} & \text{structures satisfying constraints}\\
\text{Probability} & \text{approximate compatibility}\\
\text{Machine learning} & \text{learned }R,\ T,\text{ and }G
\end{array}
$$

No single discipline owns the picture; each refines one term of

$$
\underbrace{W}_{\text{one subject}}\to
\underbrace{\{R_i\}}_{\text{many views}}\to
\underbrace{\{T_{ij}\in\mathcal T\}}_{\text{admissible transitions}}\to
\underbrace{G}_{\text{coherent whole}}.
$$

</div>

<div class="md">

## Perspectival difference is not erased

$$
\boxed{
\begin{aligned}
&\text{Coherence relates perspectives;}\\
&\text{it does not flatten them.}
\end{aligned}}
$$

Two observers, two instruments, two cultures, two centuries, two formal systems: their reports need not coincide to be about one subject. What is required is that the differences factor through admissible transitions.

$$
\underbrace{\text{difference}}_{\text{many views}}\ +\ 
\underbrace{\text{constrained }T}_{\text{justified maps}}\ +\ 
\underbrace{\text{coherence}}_{\text{fits on overlaps}}\ \Longrightarrow\ 
\underbrace{G}_{\text{global model}}.
$$

</div>

<div class="md">

## Finite observers, provisional globality

Data arrive over time. A model is never final:

$$
\underbrace{M_1}_{t_1}\xrightarrow{+D_2}\underbrace{M_2}_{t_2}\xrightarrow{+D_3}\underbrace{M_3}_{t_3}\xrightarrow{\cdots}
$$

$$
\boxed{
\begin{aligned}
&M_t\text{ is not "the complete world".}\\
&M_t\text{ is the best justified coherent}\\
&\text{model available at time }t.
\end{aligned}}
$$

</div>

<div class="md">

## One sentence

$$
\boxed{
\begin{aligned}
&\textbf{A world model is a section of a representation}\\
&\textbf{presheaf that descends along an admissible cover —}\\
&\textbf{provisionally, revisably, and never identical}\\
&\textbf{to the subject matter it represents.}
\end{aligned}}
$$

Everything else — perception, measurement, physics, mathematics, model theory, neural networks — is a choice of:

$$
\underbrace{\mathcal C}_{\text{site of contexts}}\ ,\quad 
\underbrace{\mathcal V}_{\text{target of representations}}\ ,\quad 
\underbrace{\mathcal T}_{\text{admissible transitions}}.
$$

And the safeguard, once more:

$$
\boxed{
\begin{aligned}
&\text{Coherence is evidence for a model's}\\
&\text{structural adequacy — not proof that}\\
&\text{the model is true.}
\end{aligned}}
$$

</div>

<div class="md">

## Truth: coherence and correspondence

The "One sentence" above names what a coherent world model *is*. It does not yet say when one is *true*. Coherence is necessary — a model whose parts contradict each other is not a description of any single subject matter. But coherence is not *sufficient*: a self-consistent fantasy is still a fantasy, and a hallucinating language model that satisfies its own internal regularities is still hallucinating. This chapter takes up the question coherence alone cannot answer:

$$
\boxed{
\begin{aligned}
&\text{When does a coherent model actually correspond}\\
&\text{to the subject matter it is about?}
\end{aligned}}
$$

The answer has two names: *correspondence* (Tarski) and *coherence* (Bradley, Blanshard). The proper synthesis is to require *both*, jointly, at every admissible contact point.



</div>

<div class="md">

### Tarski's Convention T

In 1935, Alfred Tarski published *Der Wahrheitsbegriff in den formalisierten Sprachen*\citeauthor{tarski1935wahrheitsbegriff}\citeyear{tarski1935wahrheitsbegriff}\citetitle{tarski1935wahrheitsbegriff} — one of the most consequential short papers in the history of logic. (An accessible English rendering is the 1944 lecture \citetitle{tarski1944semantic}; the standard English translation appears in the 1956 collection \citetitle{tarski1956logic}.) Tarski's target was the *vagueness* of the classical correspondence intuition — "a sentence is true when it agrees with reality" — which, as he pointed out, uses the very word it tries to define. His replacement is the semantic Convention T, formulated below as Tarski states it in the Woodger translation:

<div class="smart-quote" data-cite="tarski1956logic">
<div class="full-quote">A sentence $\boldsymbol{x}$ of a language $\mathcal{L}$ is *true in $\mathcal{L}$* if, and only if, $p$ — where $p$ is any sentence of the meta-language which "expresses the same meaning" as $\boldsymbol{x}$.</div>
<div class="short-quote">A sentence $S$ is true if, and only if, $p$ — where $p$ is the meta-language sentence that translates $S$.</div>
</div>

Read once for the structure. The convention has four pieces:

1. **The object-language** $\mathcal{L}$ in which the sentence $S$ is *written*: the formal language inside the model.
2. **The meta-language** in which we *talk about* $S$ and assert $p$: a richer language in which we can refer to the object-sentence and to the world.
3. **The quotation-name** of $S$ in the meta-language — Tarski uses quotation marks. The name is the *handle* by which the object-sentence is gripped from outside.
4. **The proposition $p$** in the meta-language — the same content, now stated as a claim *about the world*.

The convention binds them together with the simplest possible connective: *if, and only if*. Truth, for Tarski, is not a mysterious property — it is a *correlation* between a formal artefact inside the model and a fact outside it.

The classical illustration, which Tarski uses as his running example in the 1935 paper:

<div class="smart-quote" data-cite="tarski1935wahrheitsbegriff">
<div class="full-quote">Thus for instance the sentence "snow is white" is true if, and only if, snow is white.</div>
<div class="short-quote">„Schnee ist weiß" is true if, and only if, Schnee weiß ist.</div>
</div>

What looks like a triviality is in fact a *definition*. The right-hand side is not inside quotation marks — it is not the *name* of a sentence, it is the sentence's *content*, asserted as a fact about the world. Convention T is the rule that says: **a model is true exactly at the points where it touches the world, and at those points the touch must hold**.

$$
\underbrace{S}_{\text{claim, inside the model}}
\;\;\text{is true iff}\;\;
\underbrace{p}_{\text{fact, in the meta-language about the world}}.
$$

This is correspondence — not as a metaphor, but as a precise, formally statable condition.

</div>

<div class="md">

### Why Tarski's correspondence is structural

Tarski's contribution is not a slogan — it is a *definition*. He proved that for any formalised language rich enough to express its own semantics, the T-schema "$\boldsymbol{x}$ is true iff $p$" can be satisfied by a recursive construction (using his notion of *satisfaction*). Three consequences matter here:

1. **Truth is not a primitive.** It is *defined* in terms of satisfaction, reference, and quotation. The definition replaces every informal axiom about truth with a precise procedure — there is no need for a separate "truth axiom".

2. **Truth is semantic, not syntactic.** Two sentences with the same syntactic form may differ in truth-value; the value depends on what the symbols *refer to* in the world. Tarski is explicit about this in \citeyear{tarski1944semantic}, where he calls his account the *semantic* conception precisely to contrast it with formalist or syntactic theories.

3. **The T-schema is conservative.** Adding "$\boldsymbol{x}$ is true iff $\boldsymbol{p}$" to a formalised language does not let you prove anything you could not already prove in the meta-language. Truth is content, not new deductive power.

The key consequence for this chapter: Tarski turns truth from a metaphysical mystery into an *interface condition*. At every point where the model's claim meets the world, an *if-and-only-if* must hold. The T-schema is, in effect, the categorical content of the admissible transitions $\mathcal T$ — the catalogue of which *if-and-only-if* arrows the framework licenses.

$$
\underbrace{T\in\mathcal T}_{\text{admissible transition (this chapter)}}
\;\;\longleftrightarrow\;\;\;
\underbrace{\;S\text{ is true iff }p\;}_{\text{Tarski's Convention T (1935)}}
$$

</div>

<div class="md">

### The coherence tradition

The demand that a model be *internally consistent* is older than Tarski and older than modern logic. Its modern philosophical form begins with the British idealists, in particular F. H. Bradley's *Appearance and Reality*\citeauthor{bradley1893appearance}\citeyear{bradley1893appearance}\citetitle{bradley1893appearance}:

<div class="smart-quote" data-cite="bradley1893appearance">
<div class="full-quote">Truth, we may say, is the systematic coherence of ideas, such coherence being determined ultimately by the nature of the idea itself, or by the reality which the idea endeavours to represent.</div>
<div class="short-quote">Truth is the systematic coherence of ideas.</div>
</div>

Bradley's claim is not that coherence is *sufficient* — he grounds it explicitly in *the reality which the idea endeavours to represent* — but he gives it pride of place. A claim is not true by accident; it is true because it *fits into* a larger system of beliefs that hangs together. The twentieth-century inheritors, most notably Brand Blanshard in *The Nature of Thought*\citeauthor{blanshard1939nature}\citeyear{blanshard1939nature}\citetitle{blanshard1939nature}, develop the position more formally:

<div class="smart-quote" data-cite="blanshard1939nature">
<div class="full-quote">The truth of a proposition is nothing but its coherence with the whole of experience, and ultimately with the whole of reality.</div>
<div class="short-quote">Truth is coherence with the whole of experience and of reality.</div>
</div>

The Stanford Encyclopedia of Philosophy entry on coherence \citeauthor{walker2019coherence}\citeyear{walker2019coherence}\citetitle{walker2019coherence} traces the lineage further: H. H. Joachim's *The Nature of Truth*\citeauthor{joachim1906nature}\citeyear{joachim1906nature}\citetitle{joachim1906nature}; into twentieth-century epistemology (BonJour's *The Structure of Empirical Knowledge*\citeauthor{bonjour1985structure}\citeyear{bonjour1985structure}\citetitle{bonjour1985structure}); and into contemporary analytic philosophy where it appears in modified form under the labels *holism*, *structural realism*, and *coherentist epistemology*.

For our purposes the technical content matters more than the historical lineage. What the coherence tradition gives us, in the language of this chapter, is **the sheaf condition**: a coherent model is one whose local sections agree on overlaps. Coherence is the structural heart of descent.

$$
\boxed{\;\text{coherence} = \text{descent on admissible covers}.\;}
$$

</div>

<div class="md">

### The synthesis: coherence *and* correspondence

The two traditions look opposed only if read carelessly. Read carefully, they are *complementary*: each names a necessary condition that the other ignores.

| Tradition                          | What it certifies                          | What it leaves unchecked                |
|------------------------------------|--------------------------------------------|-----------------------------------------|
| Correspondence (Tarski)            | at each contact point, model ↔ world       | whether the model's parts fit together  |
| Coherence (Bradley / Blanshard)    | the model's parts cohere on their overlaps | whether the parts cohere with the world |

A purely correspondence-based theory has no criterion for *which* claims to check: it can say "claim $S$ corresponds to fact $p$" but it has no story for whether $S$ itself hangs together with the rest of the model. A purely coherence-based theory has no anchor in the world: it can certify that a model is internally consistent, and nothing else.

The proper synthesis — and the position implicit in Tarski's own writing on the *adequacy* of a formalised language to a domain — is **both, simultaneously, at every admissible contact point**:

$$
\boxed{
\begin{aligned}
&\underbrace{\text{coherence}}_{\text{descent on every admissible cover}}
\;\;\wedge\;\;
\underbrace{\text{correspondence}}_{\text{Tarski at every }T\in\mathcal T}\\
&\qquad\qquad\Longleftrightarrow\qquad\qquad
\underbrace{G\text{ is true}}_{\text{its every admissible claim matches the world}}
\end{aligned}}
$$

This is the precise statement of what it means to say that a coherent world model is *true*. Not true as a slogan — true as the conjunction of two formally checkable conditions, one structural and one empirical.

</div>

<div class="md">

### The diagram, completed

Return to the running picture from earlier in this chapter. A subject matter $W$, observed by instruments to give representations $R_i$, glued through admissible transitions $T_i\in\mathcal T$ into a coherent global model $G$. Now overlay Tarski:

$$
\begin{array}{ccccccccc}
&&\underbrace{W}_{\text{subject matter}}&&&&&\\
{}^{O_1}\!\swarrow&{}^{O_2}\!\downarrow&{}^{O_3}\!\searrow&\cdots&{}^{O_i}\!\downarrow&\cdots&\\
\underbrace{R_1}_{\text{view 1}}&&\underbrace{R_2}_{\text{view 2}}&&\underbrace{R_3}_{\text{view 3}}&\cdots&\underbrace{R_i}_{\text{view }i}&\cdots&\\
{}^{T_1}\!\searrow&{}^{T_2}\!\downarrow&{}^{T_3}\!\swarrow&\cdots&{}^{T_i}\!\downarrow&\cdots&\\
&&\underbrace{G}_{\text{coherent global model}}&&&&&\\
\end{array}
$$

Three sorts of arrows are now in play, and each carries a separate truth-condition.

$$
\begin{array}{c|c|c}
\text{Arrow} & \text{Role} & \text{Truth-condition}\\
\hline
W \xrightarrow{\,O_i\,} R_i & \text{observation} & O_i \in \mathcal T \text{ (admissibility)}\\
R_i \xrightarrow{\,T_i\,} G & \text{gluing} & \text{coherence on overlaps (sheaf)}\\
G \xrightarrow{\;\text{claim about }W\;} W & \text{use} & \text{Tarski at the contact point}
\end{array}
$$

- **The $O_i$ arrows** ($W \to R_i$) are observation arrows. They are *inside* the modelling setup, not correspondence arrows — the act of observing already distorts. We do not require them to satisfy Tarski; we require only that they belong to $\mathcal T$.

- **The $T_i$ arrows** ($R_i \to G$) are admissible transitions. They do their *coherence* work: the sheaf condition is checked along them, agreement on overlaps is verified.

- **The implicit $W \leftrightarrow R_i$ contact.** This is what Tarski is about. Each *use* of an observation $R_i$ as a *claim* about $W$ is a Tarskian if-and-only-if: the claim is true iff the fact holds. Admissible transitions encode the calibration; the if-and-only-if encodes the truth.

The model $G$ is true when all three rows hold simultaneously for every $i\in I$ — and the third row is the new one this section adds.

</div>

<div class="md">

### Three pathologies

It is instructive to see how each failure mode breaks exactly one of the two conditions.

**1. The self-consistent fantasy.** The model $G$ satisfies the sheaf condition: every local section agrees on every overlap, descent holds, the global section is unique. The maps $O_i$ and $T_i$ all belong to $\mathcal T$. But the model is *uncalibrated*: the admissible transitions $\mathcal T$ were chosen carelessly, or the system has been allowed to drift. Result: a perfectly coherent fiction.

$$
\underbrace{G\text{ self-consistent}}_{\text{descent holds}}
\;\;\not\Rightarrow\;\;
\underbrace{G\approx W}_{\text{contact with the world}}.
$$

Failure: *correspondence*.

**2. The contact-point junkie.** Every claim $S$ made by the model is individually checked against the world and found true — Tarski holds at every point. But the model has no internal structure: its claims do not fit together, descent fails, the "global model" is a heap of disconnected facts. Result: a factbook.

$$
\underbrace{\text{every }S_i\text{ corresponds}}_{\text{Tarski at each }T_i}
\;\;\not\Rightarrow\;\;
\underbrace{G\text{ exists}}_{\text{coherent whole}}.
$$

Failure: *coherence*.

**3. The contact-point liar.** A special, important sub-case of (1): the model's *internal* logic is consistent, the maps $T_i\in\mathcal T$ are all admissible, but the system has been trained on data that does not actually reflect $W$. With enough data and enough fitting, descent holds internally; but the model's predictions at the contact points systematically miss. Result: the **hallucinating language model** of the section "Where AI actually enters".

$$
\underbrace{M_{\text{internal}}\text{ self-consistent}}_{\text{coherence}}
\;\;\wedge\;\;
\underbrace{\text{no grounded }T\in\mathcal T}_{\text{contact-point failure}}
\;\;\Longleftrightarrow\;\;
\underbrace{\text{hallucination}}_{\text{the dangerous case.}}
$$

Failure: *both* — but the diagnosis is that $\mathcal T$ has been chosen wrongly.

</div>

<div class="md">

### Tarski's discipline, applied

For a model $G$ to be true, every admissible transition $T\in\mathcal T$ must function as a Tarskian correlation. In practice this means four disciplines:

1. **Every claim has a contact point.** A claim that is not anchored to any admissible transition is not a claim about the world — it is at best an internal regularity of the model. Refuse to call it "true".

2. **Every contact point has a calibration.** The instrument, the translation, the proof — whatever bridges the model and the world — must be *itself* checkable. A Tarski arrow is only as good as the calibration that supports it.

3. **Every calibration is itself admissible.** Calibration procedures belong in $\mathcal T$. A model whose calibration depends on a procedure outside $\mathcal T$ is using an undisclosed premise.

4. **The sheaf condition is checked on every cover.** Descent is not a one-time audit; it must hold for *every* admissible cover the data admits. A model that passes descent on one cover and fails on another is half-coherent.

$$
\boxed{
\begin{aligned}
&\textbf{For a model to be true:}\\
&\textbf{(a) it must be coherent — descent on every admissible cover;}\\
&\textbf{(b) every contact point must be calibrated — Tarski at every }T\in\mathcal T.
\end{aligned}}
$$

</div>

<div class="md">
### A practical protocol

A six-step audit, applicable to any model — mathematical, physical, ML, historical, scientific:

1. **Name every claim.** Make the implicit explicit.
2. **Name every contact point.** Where could Tarski apply?
3. **Check the calibration of each $T \in \mathcal{T}$.** Is the bridge between model and world itself justified?
4. **Check descent on every admissible cover.** Do the parts of the model fit together?
5. **Apply Tarski at every contact.** For each contact point: is the model's claim true iff the corresponding fact holds?
6. **Record residuals.** What remains unexplained?

If step 5 fails, the model is *false at that contact point*. If step 4 fails, the model is *incoherent*. If step 3 fails, the model is *using an undisclosed premise*. Each failure mode has a different remedy — and the diagnosis matters, because the fix for incoherence is not the fix for falsehood.

</div>

<div class="md">

### The closing synthesis

Three sentences, each classical, each necessary:

1. *Coherence*: a model is true only insofar as its parts hang together — the sheaf condition, descent on every admissible cover. Bradley, Blanshard, BonJour, in their different vocabularies.

2. *Correspondence*: a model is true only insofar as its claims track the world — Tarski's Convention T, the if-and-only-if at every admissible contact point. Tarski, 1935.

3. *Honesty about the gaps*: a model is true *only insofar as*. The discipline of recording residuals, of refusing to identify $G$ with $W$, of noting when the contact points are imperfect. The lesson of the box just above.

$$
\boxed{
\begin{aligned}
&\textbf{A world model is true when, and only when,}\\
&\textbf{its internal coherence and its external correspondence}\\
&\textbf{hold simultaneously — at every admissible contact,}\\
&\textbf{on every admissible cover, without remainder.}
\end{aligned}}
$$

A useful analogy is not a theorem. Tarski's Convention T *is* a theorem — of formal semantics. The use we make of it, here and now, is a *discipline* about how to live with models.

</div>
