<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: From World to Model: Coherent Representation
description: Partial observations, admissible transitions, and descent: a careful bridge from perception to sheaves, ∞-descent, model theory, and AI.
icon: 🧩
part: 4
order: 22
color: accent
topics: philosophy, math-i, math-ii, category-theory, sheaves, type-theory, model-theory, ai, epistemology
-->

<div class="md">

## The question

No inquirer has unmediated access to its subject matter. A physicist never grasps an electron *as it is in itself*; a mathematician never inspects an abstract structure from a *view from nowhere*; a listener can touch the speaker, but what their fingers meet is already a transformed trace, never the sound source as it would be apart from any perception. A historian never enters the past. In every domain we work with *transformed traces*: measurements, sense-data, formal reports, proof scripts, embeddings, archival documents.

**Definition (trace).** A *trace* is whatever an *access function* $O : W \to R$ leaves behind when applied to a region $w$ of a subject matter $W$. Formally, a trace is a point $r \in R$ such that $r = O(w)$ for some $w \in W$. Concretely: an electron leaves a track in a cloud chamber; a tree leaves a shadow on the ground; a past event leaves a document in an archive; an abstract structure leaves a proof in a published paper. Here $W$ is the *subject matter with internal structure* (regions, points, or sub-systems); $R$ is the *codomain* (a set, a metric space, an $\infty$-groupoid, or whatever the access function lands in). Four properties follow:

1. *Transformed.* The trace is *not* $w$ but the result of an access procedure applied to $w$. We hold the output of the procedure, never the input.
2. *Mediated.* The trace carries the marks of $O$. Different access functions on the same $w$ produce different traces. An unmediated trace is a contradiction in terms.
3. *Underdetermined.* Many $(w, O)$ pairs can yield the same $r$. From the trace alone, neither the source $w$ nor the procedure $O$ is uniquely determined; recovering them is the whole task of inference.
4. *Possibly indexical.* A trace *may* point beyond itself to a source, but not every trace does. A genuine measurement of a specific system is indexical; a hallucination that has the form of a measurement is not; pure noise is not; a free pattern in a derivation points only to the derivation itself. Whether a trace is *of* something, and *what* it is of, is a substantive question, not given in advance. Establishing indexicality is most of the work of inference. A trace without indexicality is not yet evidence; it is data awaiting a source.

Note on properties (1)-(3): they hold given our commitment to indirect realism. A direct realist or qualia-primary view would not accept them as universal; for them the trace may *be* the world.

**Our commitments** (each is debatable; the dispute is *foundational*, not internal to the chapter):

1. *Indirect realism.* There is a subject matter distinct from any access to it; traces are outputs of access, not the thing itself.
2. *Internal structure.* $W$ has regions, points, or sub-systems to which access can be applied.
3. *Admissible transitions exist.* A non-trivial class $\mathcal{T}$ of arrows — observation arrows $O : W \to R$, inter-representation arrows $R_i \to R_j$, and inter-context arrows in $\mathrm{Hom}(\mathcal{C})$ (refinements between contexts) — is justified independently of any specific dataset. Membership in $\mathcal{T}$ is a licence to compare, not a guarantee that the comparison is correct.
4. *Coherence is necessary but not sufficient.* A model whose parts contradict each other is not a description of any single subject matter.
5. *Correspondence is separate.* Even a perfectly coherent model is not yet a true one; contact with the world is a second, distinct test.

What we receive is *almost always already mediated*: this is our default commitment, not a universal claim. The redness of red, the pain of a headache, the taste of coffee are, on this account, the final output of a long pipeline (photoreceptors, retinal processing, lateral geniculate nucleus, visual cortex, attentional and mnemonic modulation, ...) applied to the world; they *feel* immediate only because we do not consciously witness the pipeline; the redness is the brain's construction, not the photon's revelation.

There is a rare limit case: **wordless introspection**. In the immediate, pre-conceptual awareness of one's own experience, before it is named, categorised, or compared, the trace and the topic coincide. The experience is not *of* something else; it is its own subject matter. The machinery we have built (admissible transitions, covers, sheaf conditions) was built for mediated traces, where the trace is *of* a distinct source; here the distinction collapses, and the apparatus has nothing to operate on.

In this limit, the machinery changes shape. The access function $O$ is no longer external-to-the-trace but intrinsic to it; indexicality becomes trivial (the trace IS of itself); underdetermination fails (there is nothing to recover, since trace and source coincide); *transformed* and *mediated* weaken, since there is no external-to-internal pipeline to traverse. Wordless introspection marks a *boundary*: inside it, productive machinery for working with mediated reports; outside it, experience without representation, where the question "is the model true?" does not arise.

The limit case is fragile and not stable. As soon as the experience enters *language*, it is re-mediated by conceptual scheme, by contrast-class, by the public vocabulary of colour ("red" already presupposes a contrast with green, yellow, blue). The moment we *describe* the wordless introspection, it becomes languaged, and the mediation reasserts itself. So the limit case exists only as long as we do not speak about it: a fragile fact about introspection that any philosopher of mind has had to wrestle with.

A philosopher who holds qualia to be primary, for whom the redness *is* the world's redness, not a brain construction, and for whom wordless introspection is the *primary* mode of experience, will say we have mis-described the boundary. They will read the present chapter as a useful tool for *communicated* experience but a poor account of *lived* experience, and they will refuse to grant that the mediated case is "default" rather than the limit. We take the mediated, communicable case as our default, openly: it is the case where epistemology, science, and language work, and where our machinery is productive. The dispute with qualia-primary views is *foundational*, acknowledged at the door, not settled inside.

Inside our default, there is no Archimedean point from which the world shows itself untransformed. Kant's name for what is forever on the other side of this mediation is the *thing in itself* (*Ding an sich*), first introduced in the *Critique of Pure Reason* at KrV A26/B40–42 (the Transcendental Exposition of the Concept of Space, the second part of §1 of the Transcendental Aesthetic) and developed systematically in the chapter "Of Phenomena and Noumena" at A235/B294 \cite{kant_critique_pure_reason}; the technical term here is **the subject matter as it would be independent of any access**. We never get there. The right question is therefore not "how do we reach it?" but "what can we honestly do with the traces we have?"

$$
\boxed{
\begin{aligned}
&\text{When does a collection of partial, differently-transformed traces}\\
&\text{deserve to be called a description of \emph{one} subject matter?}
\end{aligned}}
$$

The answer, in the vocabulary of *Coherent Difference*: **when the traces cohere**, two complementary halves of one principle:

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

**1. The world-level: $W_1 \neq W_2$.** Two *subjects* genuinely differ: two distinct stones, two historical events, two specific classical objects. Reports disagree because the world itself is different at the two accesses.

*Example.* Alice weighs stone A; Bob weighs stone B (a different stone). Their data need not match, and the right response is not to reconcile them, but to note that they are about different things.

*Caveat.* Identical quantum particles (electrons, photons) are *literally indistinguishable*: there is no fact of the matter about "this electron" versus "that electron", and asking whose data matches whose has no answer at the particle level. For such systems the world-level difference is the difference of *spacetime region* or *quantum state*, not of individual particles.

**2. The channel-level: $I_1 \neq I_2$.** Two *instruments* read the same world differently: thermometer vs. thermocouple, eye vs. microphone, uncalibrated vs. calibrated telescope.

*Example.* Two thermometers placed at the same point read $20.01$ and $20.02$. At that point the room has one temperature; the difference must be in the instruments: at least one, possibly both, is miscalibrated. The remedy is calibration against each other, against an external standard, or via a third instrument to adjudicate.

*Co-location matters.* If the thermometers are at *different positions* in a non-uniform temperature field (one near a window, one near a heater), they may legitimately report different values, and that would be a *world-level* difference (different points in the field), not a channel-level one.

**3. The processing-level: $\nu_1 \neq \nu_2$.** Two *interpretations* of the same trace yield different conclusions: a classical and a quantum reading of the same detector output, a literal and a metaphorical reading of the same text, an outdated and a current taxonomy applied to the same specimen.

*Example.* The same Doppler-shifted spectrum is read by one physicist as evidence for a moving source, by another as evidence for an expanding universe. The trace is fixed; the interpretive framework differs.

$$
\boxed{
\begin{aligned}
&\text{Two reports disagreeing does not, by itself,}\\
&\text{tell you which level is responsible.}\\
&\text{Locate the difference at the right level.}
\end{aligned}}
$$

The distinction between channels and interpretation is in part the moral of \citeauthor{cartwright1983laws}'s (\citeyear{cartwright1983laws}) *How the Laws of Physics Lie*: the equations of fundamental physics are *true* of the highly idealized model setups in which they were derived — a frictionless plane, an isolated system, an exactly spherical earth — and *approximately* true of many real systems, but often false of the messy, multifactorial, *dappled* world in which we actually use them \cite{cartwright1983laws} \cite{cartwright1999dappled}. The right model is rarely the one whose equations are most elegant; it is the one that respects which factors actually matter for the phenomenon at hand and which are genuinely absent. Conflating "the law is true" (a statement about a clean laboratory model) with "the law applies here" (a statement about a real situation) is one of the most common forms of silent upgrade between world-level and channel-level difference.</div>

<div class="md">

## Notions of sameness

Not everything called "the same" is the same *kind* of same. The vocabulary of *Coherent Difference* gave us a hierarchy. Here it is again, strongest to weakest:

**Terminology.** A *witness* of a sameness claim is whatever evidence backs the claim — a certificate, a proof, an inhabitant of an identity type, a 2-morphism filling between two routes. Different sameness relations demand different kinds of witness: equality needs a literal identification; isomorphism needs an invertible map; homotopy equivalence needs a deformation; approximation needs a quantitative bound; statistical agreement needs a probabilistic model and a high likelihood; model-theoretic compatibility needs a common model. A witness of a stronger relation is automatically a witness of every weaker one (a literal identification trivially gives the invertible map, the deformation, the bound, …); the converse is false, and silently promoting a weaker witness to a stronger claim is the chapter's standing category error. The contemporary philosophical form of this observation is \citeauthor{brandom1994making}'s (\citeyear{brandom1994making}) *inferentialism*: the meaning of a concept is fixed by its inferential role — by what it commits you to and what it commits you against \cite{brandom1994making} \cite{brandom2000articulating}. The hierarchy that follows is the explicit unfolding of that idea: each row of the table fixes a *different* set of inferential commitments, and moving silently from one row to the next is the chapter's forbidden move.

- $x = y$: *literal*. The very same object, the very same datum.
- $x \cong y$: *isomorphism*. Structurally indistinguishable; an invertible map carries one to the other.
- $x \simeq y$: *homotopy equivalence*. Related by a deformation that can be undone, up to coherent witnesses.
- $d(x, y) \le \varepsilon$: *approximation*. Close enough for current purposes, with a quantified residual.
- $P(D_1, D_2 \mid M)$ high: *statistical*. Agreement under a probabilistic model, not on the nose.
- $\exists M : M \models \mathcal{S}_{\text{all}}$: *model-theoretic*. The two theories admit a common interpretation, a model that satisfies both.

Each form has a parallel in **sense data**, **measurement**, and **mathematics**:

|                       | Sense data                              | Measurement                                | Mathematics                       |
|-----------------------|-----------------------------------------|--------------------------------------------|-----------------------------------|
| $x = y$               | the same rod, one photon tracked through time           | two clocks show the same tick              | $2 + 2 = 4$                       |
| $x \cong y$           | two indistinguishable coins             | two calibrated meters, same reading        | $\mathbb{Z}/6 \cong \mathbb{Z}/2 \times \mathbb{Z}/3$ |
| $x \simeq y$          | flash and bang from one strike          | two experiments, one phenomenon            | cup $\simeq$ donut                |
| $d(x,y) \le \varepsilon$ | $20.01$ vs $20.02$ on a thermometer  | within tolerance                           | $\|f_n - f\|_\infty < \varepsilon$ |
| $P$ high              | eyewitness and CCTV agree               | two studies reject the same $H_0$          | Monte-Carlo agrees with theorem   |
| $\exists M$           | two witnesses agree on a single story   | two labs' data fit one shared model        | two axiomatisations admit a common model |

In **dependent type theory** these are *literally different types*. To say $x = y$ in a type $A$ is to inhabit the type $\mathsf{Id}_A(x, y)$, a *space* of witnesses. To say $x \cong y$ is to inhabit $\mathsf{Iso}(x, y)$, a different space. To say $x \simeq y$ is yet another type.

In **Homotopy Type Theory (HoTT)** the equality type is itself a space: its points are *paths* from $x$ to $y$, and these paths may themselves be related by higher paths. Under the **univalence axiom** this becomes literal: for types in a universe $\mathcal{U}$, an equality in $\mathcal{U}$ *is* an equivalence, so $(x =_{\mathcal{U}} y) \simeq (x \simeq y)$. A claim like "$R_A =_x R_B$" is not a proposition (yes/no) but a *space of answers*: paths from $R_A$ to $R_B$, possibly homotopic to each other or genuinely distinct. Asking "are these the same?" may have a whole space of witnesses, not one.

This is why **silent upgrades between rows** are the most common category error in "world model" talk:

- *Treating an approximation as equality.* Two temperature readings within tolerance are not the same temperature; they are *within* $\varepsilon$ of each other.
- *Treating an isomorphism as identity.* Two indistinguishable coins are not the same coin; exchange them and the world changes if anything depends on the swap.
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

For any two finite sets of equal size, *some* bijection exists. So the bare claim "there is a transformation" is empty; it carries no information. The real content is **a constrained class** $\mathcal{T}$, justified independently of the data it is later applied to. $\mathcal{T}$ is a *licence*: membership in $\mathcal{T}$ says we have an independent reason to take a comparison seriously, not that the comparison is correct in any given instance. Whether a given $T \in \mathcal{T}$ actually delivers (whether Tarski's if-and-only-if holds at $T$, whether the sensor still reads true) is a separate empirical check that the licence permits but does not perform:

$$
\underbrace{\mathcal{T}}_{\text{admissible transitions (licensed)}} \;\subseteq\; \underbrace{\{W \to R_i\} \cup \{R_i \to R_j\} \cup \mathrm{Hom}(\mathcal{C})}_{\text{observation, inter-representation, and inter-context arrows}}.
$$

What can belong in $\mathcal{T}$: the list is open; what matters is the justification, not exhaustiveness:

- **sensor calibration** (measurement)
- **coordinate change** (geometry)
- **physical law** (propagation, signal transport)
- **proof-preserving translation** (mathematics)
- **validated decoder** (machine learning)
- **documented archival transmission** (history)
- $\vdots$ *(any other map whose licence has been argued for in advance)*

$$
\boxed{
\begin{aligned}
&\text{More transformation freedom}\\
&\Rightarrow \text{ more evidence required.}
\end{aligned}}
$$

$\mathcal{T}$ plays three roles at once: a **subcategory** constraint (only certain morphisms allowed), a **Bayesian prior** (some hypotheses are favoured a priori), and an **Occam penalty** (an unjustifiably large $\mathcal{T}$ is its own kind of over-fitting). Three presentations of one restriction. The contrast with the classical foundationalist picture — there *must* be a privileged class of transitions that need no prior justification — is exactly the picture \citeauthor{sellars1956empiricism} (\citeyear{sellars1956empiricism}) rejects in his critique of the "myth of the given" \cite{sellars1956empiricism}:

<div class="smart-quote" data-cite="sellars1956empiricism">
One seems forced to choose between the picture of an elephant which rests on a tortoise (What supports the tortoise?) and the picture of a great Hegelian serpent of knowledge with its tail in its mouth (Where does it begin?). Neither will do. For empirical knowledge, like its sophisticated extension, science, is rational, not because it has a foundation but because it is a self-correcting enterprise which can put any claim in jeopardy, though not all at once.
</div>

Sellars's "self-correcting enterprise" is exactly the picture of a global model $G$ that we have been building: $G$ is not the foundation of the observations $R_i$ (that would make the $R_i$ depend on $G$ in the wrong direction), nor is it the snake-tail-in-mouth picture in which every claim is supported only by other claims (the strict coherentist trap); it is the *self-correcting* enterprise, the one that gets to put *any* of its arrows in jeopardy when an admissible $T \in \mathcal{T}$ fails at the contact point. The structure of $\mathcal{T}$ is exactly the structure of the Sellarsian "space of reasons": a network of licences that justify local moves without being themselves grounded in a foundational layer, but that can be re-justified (or refused) at any contact point where Tarski's condition fails.

</div>

<div class="md">

## Contexts as a site

Following *Coherent Difference*, **context** is used in the widest possible sense: anything that can index data points counts as a "space". A context specifies the conditions under which a report was made:

- *where*: place, system, domain
- *when*: time, duration, dynamical regime
- *who*: observer, agent, instrument
- *how*: method, apparatus, procedure
- *in what terms*: language, framework, formalism
- *in what tradition*: culture, era, paradigm

A historical period is a context. A laboratory setup is a context. A formal system is a context. A culture at a given moment is a context. The "spaces" of *Coherent Difference* all count.

Between two contexts there are *refinements*: from "Tuesday afternoon" to "between 3 pm and 4 pm"; from "European philosophy" to "Kant circa 1781"; from "classical mechanics" to "the Lagrangian formulation on a configuration manifold". Morphisms in the context-category $\mathcal{C}$ are exactly these refinements: narrower, more specific, more constrained.

A **cover** of a context is a family of sub-contexts whose images together capture everything relevant about it. The everyday picture: overlapping photographs cover a room when every point of the room appears in at least one of them. In a topological space this is an **open cover**: a family of open sets whose union contains the whole. In category theory, the most general version (due to Grothendieck) is a *designated rule* saying which families of sub-objects count as covers; this rule is a **Grothendieck topology**, and the category equipped with it is a **site**. The name sounds forbidding, but the content is just: *here is how we decide when a family of smaller views "covers" a larger one*. The rule must respect refinements (narrowing a cover still covers) and composition (covers of covers are covers).

In plain English, an **admissible cover** of a context $c$ is just a family of smaller views $\{c_i\}_{i\in I}$, together with morphisms $f_i : c_i \to c$ putting each view back into $c$, such that two things hold at once:

1. **The cover condition.** Every part of $c$ that matters is captured by at least one view. In symbols: the union of the images $\bigcup_i \mathrm{im}(f_i)$ is the whole of $c$. (Topological version: the open sets cover the space. Picture version: the photographs together capture every point of the room.)
2. **The admissibility condition.** Every morphism $f_i$ in the cover is a licensed transition: $f_i \in \mathcal{T}$. The maps that put the views back into $c$ are ones we have an independent reason to trust — calibration, coordinate change, physical law, validated decoding, documented transmission, anything that has earned its place in $\mathcal{T}$.

Formally:

$$
\{c_i \xrightarrow{\,f_i\,} c\}_{i \in I}\ :\ f_i \in \mathcal{T}\ \text{for every }i,\quad
\text{and}\quad \bigcup_{i\in I} \mathrm{im}(f_i) \;=\; c.
$$

The two conditions are independent. A family of sub-views can satisfy the cover condition with maps we have no business trusting (raw, uncalibrated readings), and a family of trusted maps can fail to cover what matters. An *admissible* cover is the intersection: a covering whose maps are licensed. Only on admissible covers does the sheaf condition (compatible local data ⟹ unique global data) carry content; the next paragraph explains why.

The adjective matters. Without the admissibility filter, *any* family of sub-contexts could be declared a "cover", and the demand that local data cohere would become vacuous: pick the most convenient family, declare it a cover, and coherence is automatic. By restricting to admissible covers, we turn the sheaf condition into a *meaningful* question about a specific modelling setup: the family is not chosen for our convenience; it is constrained by the licences we have actually earned.

Equipping $\mathcal{C}$ with a rule for which families count as covers (one that closes under refinement and under composition) is a **Grothendieck topology** $J$; the pair $(\mathcal{C}, J)$ is a **site** (as sketched in *Coherent Difference*).

A **representation scheme** assigns to every context a set of "sections" (the things one can write down *on* that context):

$$
\underbrace{F}_{\text{rep. assignment}}\ :\ 
\underbrace{\mathcal{C}^{\mathrm{op}}}_{\text{contexts, refinements reversed}} 
\longrightarrow 
\underbrace{\mathcal{V}}_{\text{target category}}.
$$

$\mathcal{V}$ can be $\mathbf{Set}$, metric spaces, probability spaces, chain complexes, or $\infty$-groupoids, depending on how much homotopy is needed.

</div>

<div class="md">

## Sheaves: coherence = descent

In plain English first. A presheaf $F$ assigns a set of "local sections" to every context: $F(c)$ is the data one can write down *on* $c$. Sheaf-ness is the rule that turns *compatible* local data into *unique* global data — but only on covers the modelling setup is willing to license.

$$
\boxed{\;\text{compatible local data on an admissible cover} \;\Longrightarrow\; \text{unique global data}.\;}
$$

A family $\{s_i \in F(c_i)\}$ is **compatible** when, on every pairwise overlap $c_i \times_c c_j$, the two restrictions of $s_i$ and $s_j$ agree. A sheaf says: that condition alone is enough; there is exactly one global section in $F(c)$ whose restriction to each patch is $s_i$. The condition is only asked of admissible covers; an unrestricted "every cover" statement is a different, sharper claim that we do not need here.

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

3. **The equalizer.** Out of all tuples in $\prod_i F(c_i)$, keep only those on which the two arrows give the same answer. Those are precisely the compatible tuples, and the sheaf condition says there is a *unique* global section in $F(c)$ sitting above each compatible tuple.

The $\varprojlim$ in older presentations does exactly the same job; the equalizer is just its name when the diagram is a single parallel pair. (For covers of more than two patches, $\varprojlim$ runs over the full *Čech nerve*; see "Higher coherence" below.)

The isomorphism $F(c) \simeq \mathrm{Eq}(\cdots)$ is the **sheaf condition**: the smallest, sharpest statement of the local-to-global principle.

Reading in plain English, one more time: **for every admissible cover and every family of local sections on it that agree on every overlap, there is one and only one global section restricting to them.**

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

Five representations, five channels (visual, auditory, radar, linguistic, archival), each a different kind of trace produced by its own access function. The site $\mathcal{C}$ contains their contexts; the **admissible cover** of "the event" is the family $\{c_v, c_a, c_r, c_\ell, c_h\} \to c$ (each arrow admissible, the patches together recovering everything relevant about $c$). $\mathcal{T}$ contains sensor calibration, physical propagation (sound delay, Doppler), validated linguistic reporting, and archival transmission with error bounds. A global $G \in F(c)$ exists iff descent holds.

The same shape governs **mathematical data**: a group presented by generators-and-relations, by a Cayley table, by a permutation action, by a matrix representation, by a character table. Five presentations, five channels, one group, provided the transitions between presentations are admissible (isomorphisms of the appropriate kind).

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

Two thermometers report a temperature over time: the equalizer is the *times* at which they agree exactly. Two proofs of the same theorem produce numeric outputs by two different routes: the equalizer is the inputs on which the outputs literally match. In an $(\infty,1)$-category the equalizer is a *space of paths of agreement*: same idea, more room.

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
- **Homotopical regime.** They agree *up to a witness*, a **2-morphism** $\alpha_{ABC} : \phi_{BC} \phi_{AB} \Rightarrow \phi_{AC}$. Think of $\alpha_{ABC}$ as a "filler" that says the two routes are not the same path but can be *continuously deformed* into one another. The 2-morphism itself is data; you can ask further questions about *it*.
- **Four representations.** Add $D$, with its own transitions. Now the fillers $\alpha_{ABC}$, $\alpha_{BCD}$, $\alpha_{ACD}$, $\alpha_{ABD}$ may themselves disagree, and you need a **3-morphism** filling between the fillers to certify higher-order consistency. And so on.

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

*Mathematical example.* Three equivalent categories $\mathcal{A} \simeq \mathcal{B} \simeq \mathcal{C}$ do not satisfy $\phi_{BC} \circ \phi_{AB} = \phi_{AC}$ on the nose; they satisfy it up to a natural isomorphism. With $n$ equivalent categories, the isomorphisms-between-isomorphisms are the higher data.

</div>

<div class="md">

## The observer is part of the diagram

So far the discussion has been structural: equalizers, pullbacks, Čech nerves, higher cells. The diagrams have had *objects* and *morphisms*, but no *agents*. The next step is to put the inquirer back in: every structural claim about subject matter $W$ is made by *someone*, through *some* access pipeline, encoded in *some* report.

Every access to a subject matter is a composite, in every domain:

$$
\underbrace{W}_{\text{subject}}
\xrightarrow{\;I\;}\underbrace{S}_{\text{stimulus/signal}}
\xrightarrow{\;N\;}\underbrace{\rho}_{\text{internal rep.}}
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

So far everything has been a *specification*: a list of conditions that a coherent world model must satisfy. This section asks the converse question: does any part of modern machine learning *already* realise these conditions, even informally?

The question is older than AI. \citeauthor{hacking1983representing} (\citeyear{hacking1983representing}) reopened the philosophy of science by insisting that representing is not the only epistemic relation we have to the world; *intervening* — doing something to the world, observing the difference, and so getting evidence about what is really there — is the other half \cite{hacking1983representing}. A trained neural network is, in Hacking's sense, *both* a representation and an intervention: it is a representation in that the parameters $\theta$ encode statistical structure in the data, and it is an intervention in that the model is *used* — its outputs change the world (a search query, a code suggestion, a medical diagnosis). The contact points $T \in \mathcal{T}$ of the previous section are, when applied to AI, exactly Hacking's "intervening" relation: not "is the model's output *true*?" in some abstract sense, but "does applying the model *make a difference* in the world in the way it says it will?". A representation that does not pay its debts in intervention is exactly the "self-consistent fantasy" the chapter has been diagnosing throughout.

Neural networks compose **parametric maps**, functions of the form $f_\theta : X \to Y$ that depend on a parameter vector $\theta$ learnable from data. Composing such maps is not just function composition, because the parameters compose too; several frameworks make this precise:

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
\underbrace{H_{\ell+1} = H_\ell + F_\theta(H_\ell)}_{\text{residual update: keep old, add correction}}
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

None of this makes a network a sheaf. What the chapter *does* buy for AI:

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
&\not\Rightarrow\text{ descent from grounded contexts.}
\end{aligned}}
$$

</div>

<div class="md">

## Invariants: what survives a change of representation

The previous section argued that no current AI architecture is a sheaf in the strict sense, and that hallucination is the predictable consequence of internal coherence without grounded descent. The natural question is then: *what does survive the change of representation*? Even an imperfect model preserves *something*. Picking out what is preserved, against what is discarded, is the practical test of a representation.

For each admissible transition $T \in \mathcal{T}$, ask what is preserved and what is discarded. The catalogue of invariants is open, but every entry must be defended:

- *causal order*: what comes before / after
- *adjacency*: what touches what
- *symmetry actions*: groups acting on the object
- *conservation laws*: energy, charge, count
- *statistical dependence*: correlations, information flow
- *homotopy type*: shape up to deformation
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

## The hierarchy: never upgrade silently

The forms of sameness form a tower from strongest to weakest. The arrow on each line means "implies the row below": a witness of a stronger row is automatically a witness of every weaker one; the converse is false.

- **strict** ($s_i|_U = s_j|_U$): *same on overlap*. Implies iso.
- **iso** ($s_i \cong s_j$): *invertible comparison*. Implies homotopy equivalence.
- **homotopy** ($s_i \simeq s_j$): *coherent deformation*. Implies approximation under any compatible metric.
- **approx** ($d(s_i, s_j) \le \varepsilon$): *within tolerance*. Implies statistical agreement under any reasonable model.
- **stat** ($P(D_i, D_j \mid M)$ high): *probabilistic agreement*. Implies model-theoretic compatibility.
- **model-theoretic** ($\exists M : M \models \mathcal{S}_{\text{all}}$): *common interpretation of the theories*.

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
&&\underbrace{G = \varprojlim F}_{\text{coherent global model}}&&\qquad T_i \in \mathcal{T}
\end{array}
$$

Three views shown; the cover can have any number. Replace the index by an arbitrary set $I$ (finite, countable, or uncountable) and add as many $R_i$, $O_i$, $T_i$ as you like:

$$
\cdots \;\xrightarrow{\,O_{i-1}\,}\; R_{i-1}\; \xleftarrow{\,O_i\,}\; W\; \xrightarrow{\,O_{i+1}\,}\; R_{i+1}\; \xrightarrow{\,O_{i+2}\,}\;\cdots
$$

and analogously for the $T_i$. The global model becomes the element $G \in F(c)$ obtained as the limit over *all* views in $I$ (three, a thousand, or uncountably many) — formally the equalizer of the Čech nerve applied to the family $\{s_i\}_{i\in I} \subseteq \prod_i F(c_i)$. The three-view picture above is the smallest non-trivial case; the machinery scales to covers of any size.

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

Different mathematics; one shape. The unification is not a metaphor. It is the explicit programme of \citeauthor{caramello2017theories}'s (\citeyear{caramello2017theories}) *toposes-as-bridges* programme \cite{caramello2017theories}: the same topos can be presented as a sheaf topos, as a classifying topos of a geometric theory, and as a model category; facts and constructions provable in one presentation transfer to the others by the descent machinery. The diagram above is the one shape that all five rows exhibit; the rows differ only in the underlying category.

</div>

<div class="md">

## What is forbidden

$$
\boxed{
\begin{aligned}
&\text{1. Silent upgrade of a weak sameness}\\
&\quad\text{into a stronger one.}\\
&\text{2. An unconstrained }\mathcal{T}\text{: coherence}\\
&\quad\text{becomes vacuous.}\\
&\text{3. Identifying }G\text{ with }W.\\
&\text{4. Internal coherence mistaken for}\\
&\quad\text{descent from grounded contexts.}\\
&\text{5. Treating a suggestive analogy}\\
&\quad\text{(attention, residuals, embeddings)}\\
&\quad\text{as a theorem in the borrowed category.}
\end{aligned}}
$$

A useful analogy is not a theorem.

</div>

<div class="md">

## A practical procedure

Compressed into nine steps you can run through on any dataset, in any domain. Each step has a question; the discipline is asking them in order.

Given complicated evidence, in any domain:

1. **Take the raw datum $D$.** What is actually in front of you?
2. **Interpret it as $I(D)$.** What reading are you imposing?
3. **Draw the chain $W \to D \to I$.** Where in the chain could disagreement enter?
4. **Identify overlaps.** Where do independent channels meet?
5. **Specify admissible transitions $T_{ij} \in \mathcal{T}$.** What licenses each comparison?
6. **Decide which sameness.** $=$, $\cong$, $\simeq$, $\le \varepsilon$, statistical, model-theoretic; pick the right one and refuse to upgrade.
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
&\text{invariance} && \text{(what survives }\mathcal{T}\text{)}
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
\underbrace{\{T_{ij}\in\mathcal{T}\}}_{\text{admissible transitions}}\to
\underbrace{G}_{\text{coherent whole}}.
$$

The chain has a direct counterpart in contemporary ontology of science. \citeauthor{worrall1989structural} (\citeyear{worrall1989structural}) proposed \emph{structural realism} as the philosophical position that takes seriously the chain's signature fact: across theory change (Fresnel → Maxwell, classical → relativistic), what is preserved is not the ontology of unobservables but the *structure* of the equations that relate them \cite{worrall1989structural}. The move was sharpened by \citeauthor{ladyman1998what} (\citeyear{ladyman1998what}) into \emph{ontic structural realism}: not "we only know the structure" but "there *is* nothing but the structure" — the world *is* the chain of admissible cover systems, not a thing-in-itself behind them \cite{ladyman1998what} \cite{ladymanross2007everything}. The present chapter's position is weaker and more operational: it does not commit to OSR, but it does commit to the structural-relational claim that any successful world model is the *global section of some admissible cover*, and that what survives an admissible change of cover is precisely the structural content.

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
&\textbf{A world model is the global section recovered from local}\\
&\textbf{descent data along an admissible cover,}\\
&\textbf{provisionally, revisably, and never identical}\\
&\textbf{to the subject matter it represents.}
\end{aligned}}
$$

Everything else (perception, measurement, physics, mathematics, model theory, neural networks) is a choice of:

$$
\underbrace{\mathcal{C}}_{\text{site of contexts}}\ ,\quad 
\underbrace{\mathcal{V}}_{\text{target of representations}}\ ,\quad 
\underbrace{\mathcal{T}}_{\text{admissible transitions}}.
$$

And the safeguard, once more:

$$
\boxed{
\begin{aligned}
&\text{Coherence is evidence for a model's}\\
&\text{structural adequacy, not proof that}\\
&\text{the model is true.}
\end{aligned}}
$$

</div>

<div class="md">

## Truth: coherence and correspondence

The "One sentence" above names what a coherent world model *is*. It does not yet say when one is *true*. Coherence is necessary: a model whose parts contradict each other is not a description of any single subject matter. But coherence is not *sufficient*: a self-consistent fantasy is still a fantasy, and a hallucinating language model that satisfies its own internal regularities is still hallucinating. The next question is what coherence alone cannot answer:

$$
\boxed{
\begin{aligned}
&\text{When does a coherent model actually correspond}\\
&\text{to the subject matter it is about?}
\end{aligned}}
$$

The answer has two names: *correspondence* (Tarski) and *coherence* (Bradley, Blanshard). The proper synthesis is to require *both*, jointly, at every admissible contact point. There is also a third position, well worth naming: \citeauthor{goodman1978ways}'s (\citeyear{goodman1978ways}) *irrealism* \cite{goodman1978ways}, which argues that the correspondence/coherence debate presupposes too much. On Goodman's reading, there are no "ready-made worlds" *and* no minds constructing them from nothing — there are *many* worlds, made by different symbol systems, each as legitimate in its own right as any other. Truth, on this picture, is not a relation between a model and a pre-given world; it is the property a symbol system has of *working* in the right way — of rightness, not of copying. Goodman's position is in deep sympathy with the present chapter: the world model $G$ is not a mirror of $W$; it is one among many possible right symbol systems that agree on overlaps with other admissible cover systems. The Tarskian addition this chapter makes is to insist that "rightness" must, somewhere, cash out in *contact points* $T \in \mathcal{T}$ where the model is constrained by the world; without that, Goodman's "right" can drift into any self-consistent fantasy. With it, the synthesis of all three positions is the standing practice: models are made, not found; their rightness is structural; and the structure must meet the world at every licenced contact.

</div>

<div class="md">

### Tarski's Convention T

In 1936 (the German-language paper "Der Wahrheitsbegriff in den formalisierten Sprachen", published in *Studia Philosophica*; the Polish original "Pojęcie prawdy w językach nauk dedukcyjnych" had appeared in 1933), Alfred Tarski \citeauthor{tarski1935wahrheitsbegriff}\citeyear{tarski1935wahrheitsbegriff}\citetitle{tarski1935wahrheitsbegriff} set out one of the most consequential short papers in the history of logic. (An accessible English rendering is the 1944 lecture \citetitle{tarski1944semantic}; the standard English translation appears in the 1956 collection \citetitle{tarski1956logic}.) Tarski's target was the *vagueness* of the classical correspondence intuition ("a sentence is true when it agrees with reality"), which, as he pointed out, uses the very word it tries to define. His replacement is the semantic Convention T:

<div class="smart-quote" data-cite="tarski1956logic">
<div class="full-quote">A sentence $\boldsymbol{x}$ of a language $\mathcal{L}$ is *true in $\mathcal{L}$* if, and only if, $p$, where $p$ is any sentence of the meta-language which "expresses the same meaning" as $\boldsymbol{x}$.</div>
<div class="short-quote">A sentence $S$ is true if, and only if, $p$, where $p$ is the meta-language sentence that translates $S$.</div>
</div>

Four pieces:

1. **The object-language** $\mathcal{L}$ in which the sentence $S$ is *written*: the formal language inside the model.
2. **The meta-language** in which we *talk about* $S$ and assert $p$: a richer language in which we can refer to the object-sentence and to the world.
3. **The quotation-name** of $S$ in the meta-language (Tarski uses quotation marks). The name is the *handle* by which the object-sentence is gripped from outside.
4. **The proposition $p$** in the meta-language: the same content, now stated as a claim *about the world*.

Truth, for Tarski, is a *correlation* between a formal artefact inside the model and a fact outside it.

The classical illustration:

<div class="smart-quote" data-cite="tarski1935wahrheitsbegriff">
<div class="full-quote">Thus for instance the sentence "snow is white" is true if, and only if, snow is white.</div>
<div class="short-quote">„Schnee ist weiß" is true if, and only if, Schnee weiß ist.</div>
</div>

The right-hand side is not inside quotation marks: it is not the *name* of a sentence, it is the sentence's *content*, asserted as a fact about the world. Convention T: **a model is true exactly at the points where it touches the world, and at those points the touch must hold**.

$$
\underbrace{S}_{\text{claim, inside the model}}
\;\;\text{is true iff}\;\;
\underbrace{p}_{\text{fact, in the meta-language about the world}}.
$$

This is correspondence, not as a metaphor, but as a precise, formally statable condition.

</div>

<div class="md">

### Why Tarski's correspondence is structural

Tarski proved that for any formalised language rich enough to express its own semantics, the T-schema "$\boldsymbol{x}$ is true iff $p$" can be satisfied by a recursive construction (using his notion of *satisfaction*). Three consequences:

1. **Truth is not a primitive.** It is *defined* in terms of satisfaction, reference, and quotation. The definition replaces every informal axiom about truth with a precise procedure; there is no need for a separate "truth axiom".
2. **Truth is semantic, not syntactic.** Two sentences with the same syntactic form may differ in truth-value; the value depends on what the symbols *refer to* in the world. Tarski is explicit about this in \citeyear{tarski1944semantic}, calling his account the *semantic* conception precisely to contrast it with formalist or syntactic theories.
3. **The T-schema is conservative.** Adding "$\boldsymbol{x}$ is true iff $\boldsymbol{p}$" to a formalised language does not let you prove anything you could not already prove in the meta-language. Truth is content, not new deductive power.

For this chapter: Tarski turns truth from a metaphysical mystery into an *interface condition*. At every point where the model's claim meets the world, an *if-and-only-if* must hold. The T-schema is, in effect, the empirical *content* of every check we perform at a licensed transition in $\mathcal{T}$: $\mathcal{T}$ catalogues the arrows we are *licensed* to test; the T-schema says what *passing* the test at such an arrow amounts to. Licencing is necessary for the test to be meaningful; passing the test is a separate, empirical matter.

$$
\underbrace{T\in\mathcal{T}}_{\text{licensed transition (this chapter)}}
\;\;\text{is tested by}\;\;\;
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

Bradley's claim is not, on the most charitable reading, that coherence is *sufficient* on its own: the qualifier "*such coherence being determined ultimately by ... the reality which the idea endeavours to represent*" makes coherence's standing depend on its contact with reality. Read carefully, Bradley is saying coherence *of the right kind* (coherence grounded in reality) is what truth is, and a model whose coherence is detached from reality is not yet true — it is internally consistent without being in contact. A claim is not true by accident; it is true because it *fits into* a larger system of beliefs that hangs together *and* that system is anchored to its subject matter. Bradley gives coherence pride of place but does not, on this reading, separate it from correspondence. Brand Blanshard in *The Nature of Thought*\citeauthor{blanshard1939nature}\citeyear{blanshard1939nature}\citetitle{blanshard1939nature} develops the position more formally:

<div class="smart-quote" data-cite="blanshard1939nature">
<div class="full-quote">The truth of a proposition is nothing but its coherence with the whole of experience, and ultimately with the whole of reality.</div>
<div class="short-quote">Truth is coherence with the whole of experience and of reality.</div>
</div>

The Stanford Encyclopedia of Philosophy entry on coherence \citeauthor{walker2019coherence}\citeyear{walker2019coherence}\citetitle{walker2019coherence} traces the lineage further: H. H. Joachim's *The Nature of Truth*\citeauthor{joachim1906nature}\citeyear{joachim1906nature}\citetitle{joachim1906nature}; into twentieth-century epistemology (BonJour's *The Structure of Empirical Knowledge*\citeauthor{bonjour1985structure}\citeyear{bonjour1985structure}\citetitle{bonjour1985structure}); and into contemporary analytic philosophy where it appears in modified form under the labels *holism*, *structural realism*, and *coherentist epistemology*.

What the coherence tradition gives us, in the language of this chapter, is **the sheaf condition**: a coherent model is one whose local sections agree on overlaps. Coherence is the structural heart of descent.

$$
\boxed{\;\text{coherence} = \text{descent on admissible covers}.\;}
$$

</div>

<div class="md">

### The synthesis: coherence and correspondence

The two traditions look opposed only if read carelessly. Read carefully, they are *complementary*: each names a necessary condition that the other ignores. (A footnote on Bradley and Blanshard: both of them, on the most careful reading, *do* gesture toward correspondence — Bradley's "coherence determined ultimately by ... the reality which the idea endeavours to represent", Blanshard's "coherence with the whole of experience, and ultimately with the whole of reality". The tradition they founded is often read in their slipstream as *pure* coherence, and the table below follows that common reading; the slippage is the inheritance.)

| Tradition                          | What it certifies                          | What it leaves unchecked                |
|------------------------------------|--------------------------------------------|-----------------------------------------|
| Correspondence (Tarski)            | at each contact point, model ↔ world       | whether the model's parts fit together  |
| Coherence (Bradley / Blanshard)    | the model's parts cohere on their overlaps | whether the parts cohere with the world |

A purely correspondence-based theory has no criterion for *which* claims to check: it can say "claim $S$ corresponds to fact $p$" but it has no story for whether $S$ itself hangs together with the rest of the model. A purely coherence-based theory has no anchor in the world: it can certify that a model is internally consistent, and nothing else.

The proper synthesis (and the position implicit in Tarski's own writing on the *adequacy* of a formalised language to a domain) is **both, simultaneously, at every admissible contact point**:

$$
\boxed{
\begin{aligned}
&\underbrace{\text{coherence}}_{\text{descent on every admissible cover}}
\;\;\wedge\;\;
\underbrace{\text{correspondence}}_{\text{Tarski at every }T\in\mathcal{T}}\\
&\qquad\qquad\Longleftrightarrow\qquad\qquad
\underbrace{G\text{ is true}}_{\text{its every admissible claim matches the world}}
\end{aligned}}
$$

This is the precise statement of what it means to say that a coherent world model is *true*. Not true as a slogan, true as the conjunction of two formally checkable conditions, one structural and one empirical.

</div>

<div class="md">

### The diagram, completed

Return to the running picture from earlier. A subject matter $W$, observed by instruments to give representations $R_i$, glued through admissible transitions $T_i\in\mathcal{T}$ into a coherent global model $G$. Now overlay Tarski:

$$
\begin{array}{ccccccccc}
&&\underbrace{W}_{\text{subject matter}}\!\nwarrow{\scriptstyle\text{claim}}&&&&&\\
{}^{O_1}\!\swarrow&{}^{O_2}\!\downarrow&{}^{O_3}\!\searrow&\cdots&{}^{O_i}\!\downarrow&\cdots&\\
\underbrace{R_1}_{\text{view 1}}&&\underbrace{R_2}_{\text{view 2}}&&\underbrace{R_3}_{\text{view 3}}&\cdots&\underbrace{R_i}_{\text{view }i}&\cdots&\\
{}^{T_1}\!\searrow&{}^{T_2}\!\downarrow&{}^{T_3}\!\swarrow&\cdots&{}^{T_i}\!\downarrow&\cdots&\\
&&\underbrace{G}_{\text{coherent global model}}\uparrow&&&&\\
\end{array}
$$

Three sorts of arrows, each with a separate *condition* — but only two of those conditions are truth conditions proper; the first is a prerequisite that makes the test meaningful.

$$
\begin{array}{c|c|c}
\text{Arrow} & \text{Role} & \text{Condition}\\
\hline
W \xrightarrow{\,O_i\,} R_i & \text{observation} & O_i \in \mathcal{T} \text{ (licence — prerequisite)}\\
R_i \xrightarrow{\,T_i\,} G & \text{gluing} & \text{coherence on overlaps (sheaf) — truth condition}\\
G \xrightarrow{\;\text{claim about }W\;} W & \text{use} & \text{Tarski at the contact point, via } T \in \mathcal{T} \text{ — truth condition}
\end{array}
$$

- **The $O_i$ arrows** ($W \to R_i$) are observation arrows. They are *inside* the modelling setup, not correspondence arrows; the act of observing already distorts. We do not require them to satisfy Tarski directly; we require only that they are licensed, $O_i \in \mathcal{T}$, so that the comparison between world and trace is one we are entitled to make. This is a *prerequisite*: an unlicensed arrow gives no standing to ask whether the model is true.
- **The $T_i$ arrows** ($R_i \to G$) are admissible transitions. They do their *coherence* work: the sheaf condition is checked along them, agreement on overlaps is verified. This is the first truth condition.
- **The $G \to W$ arrow** (a claim from the model about the world) is the correspondence row, the new addition. Each specific claim $S$ produced by $G$ about $W$ must satisfy Tarski's if-and-only-if at its contact point: $S$ is true iff the corresponding fact $p$ holds. The check is performed via the licensed transitions $T \in \mathcal{T}$ that calibrate between the trace $R_i$ and the world; the if-and-only-if is the truth condition on the model's claim, applied at those bridges. This is the second truth condition.

The model $G$ is true when the *two* truth conditions (coherence and correspondence) hold simultaneously at every licensed contact, with the licensing assumed throughout. The third row of the table above is the new addition this section makes; the second row was already the substance of "Sheaves: coherence = descent" above.

</div>

<div class="md">

### Three pathologies

Each failure mode breaks exactly one of the two conditions.

**1. The self-consistent fantasy.** The model $G$ satisfies the sheaf condition: every local section agrees on every overlap, descent holds, the global section is unique. The maps $O_i$ and $T_i$ all belong to $\mathcal{T}$, so the modelling setup is *licensed* throughout. But the licence was granted carelessly, or the system has been allowed to drift: Tarski's if-and-only-if fails at the contact points even though every arrow in the diagram is licensed. Result: a perfectly coherent fiction.

$$
\underbrace{G\text{ self-consistent}}_{\text{descent holds}}
\;\;\not\Rightarrow\;\;
\underbrace{G\approx W}_{\text{contact with the world}}.
$$

Failure: *correspondence*.

**2. The contact-point junkie.** Every claim $S$ made by the model is individually checked against the world and found true; Tarski holds at every point. But the model has no internal structure: its claims do not fit together, descent fails, the "global model" is a heap of disconnected facts. Result: a factbook.

$$
\underbrace{\text{every }S_i\text{ corresponds}}_{\text{Tarski at each }T_i}
\;\;\not\Rightarrow\;\;
\underbrace{G\text{ exists}}_{\text{coherent whole}}.
$$

Failure: *coherence*.

**3. The contact-point liar.** A special, important sub-case of (1): the model's *internal* logic is consistent, the maps $T_i\in\mathcal{T}$ are all licensed, but the system has been trained on data that does not actually reflect $W$. With enough data and enough fitting, descent holds internally; but the model's predictions at the contact points systematically miss because the licence does not deliver empirical contact. Result: the **hallucinating language model** of the section "Where AI actually enters".

$$
\underbrace{\text{hallucination}}_{\text{the dangerous case}} \;\;:=\;\;
\underbrace{M_{\text{internal}}\text{ self-consistent}}_{\text{coherence holds internally}}
\;\;\wedge\;\;
\underbrace{\text{no }T\in\mathcal{T}\text{ passes Tarski}}_{\text{licence without empirical contact}}.
$$

Failure: *correspondence* (the same as (1), not a new failure mode). The diagnosis is that $\mathcal{T}$ has been chosen wrongly — i.e., the licensing was too permissive and admitted procedures that did not actually constrain the data to track $W$. The "both" reading some readers will reach is shorthand for *both the licensing setup and the correspondence at contact points are broken*; the truth-condition failure is correspondence alone.

</div>

<div class="md">

### Tarski's discipline, applied

For a model $G$ to be true, every admissible transition $T\in\mathcal{T}$ must function as a Tarskian correlation. Four disciplines:

1. **Every claim has a contact point.** A claim that is not anchored to any admissible transition is not a claim about the world; it is at best an internal regularity of the model. Refuse to call it "true".
2. **Every contact point has a calibration.** The instrument, the translation, the proof, whatever bridges the model and the world, must be *itself* checkable. A Tarski arrow is only as good as the calibration that supports it.
3. **Every calibration is itself admissible.** Calibration procedures belong in $\mathcal{T}$. A model whose calibration depends on a procedure outside $\mathcal{T}$ is using an undisclosed premise.
4. **The sheaf condition is checked on every admissible cover.** Descent is not a one-time audit; it must hold for *every* admissible cover the data admits. A model that passes descent on one cover and fails on another is half-coherent.

$$
\boxed{
\begin{aligned}
&\textbf{For a model to be true:}\\
&\textbf{(a) it must be coherent (descent on every admissible cover);}\\
&\textbf{(b) every contact point must be calibrated (Tarski at every }T\in\mathcal{T}\text{).}
\end{aligned}}
$$

</div>

<div class="md">

### A practical protocol

A six-step audit, applicable to any model (mathematical, physical, ML, historical, scientific):

1. **Name every claim.** Make the implicit explicit.
2. **Name every contact point.** Where could Tarski apply?
3. **Check the calibration of each $T \in \mathcal{T}$.** Is the bridge between model and world itself justified?
4. **Check descent on every admissible cover.** Do the parts of the model fit together?
5. **Apply Tarski at every contact.** For each contact point: is the model's claim true iff the corresponding fact holds?
6. **Record residuals.** What remains unexplained?

If step 5 fails, the model is *false at that contact point*. If step 4 fails, the model is *incoherent*. If step 3 fails, the model is *using an undisclosed premise*. Each failure mode has a different remedy, and the diagnosis matters, because the fix for incoherence is not the fix for falsehood.

</div>

<div class="md">

### The closing synthesis

Two conditions, each necessary and jointly sufficient:

1. *Coherence*: a model is true only insofar as its parts hang together (the sheaf condition, descent on every admissible cover). Bradley, Blanshard, BonJour, in their different vocabularies.
2. *Correspondence*: a model is true only insofar as its claims track the world (Tarski's Convention T, the if-and-only-if at every licensed contact point). Tarski, 1935.

And one discipline that lives with both: *honesty about the gaps*. A model is true *only insofar as*. The discipline of recording residuals, of refusing to identify $G$ with $W$, of noting when the contact points are imperfect. Honesty is not a third condition; it is the standing acknowledgement that the conjunction above is provisional, that residual mismatches must be visible, and that "without remainder" describes the *aim* of the audit (every admissible contact tested) rather than a guarantee that the audit is complete.

$$
\boxed{
\begin{aligned}
&\textbf{A world model is true when, and only when,}\\
&\textbf{its internal coherence and its external correspondence}\\
&\textbf{hold simultaneously at every licensed contact,}\\
&\textbf{on every admissible cover, with every residual recorded.}
\end{aligned}}
$$

A useful analogy is not a theorem. Tarski's Convention T *is* a theorem (of formal semantics). The use we make of it, here and now, is a *discipline* about how to live with models.

</div>
