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

What is a *world model*? A physicist never grasps an electron *as it is in itself*; a mathematician never inspects an abstract structure from a *view from nowhere*; a historian never enters the past. Even the listener who reaches out to touch the speaker meets only a transformed trace — never the sound source as it would be apart from any perception. What arrives in every domain — empirical, formal, archival — is the same: *transformed traces*. Measurements, sense-data, formal reports, proof scripts, embeddings, archival documents.

**What this chapter is.** A single machinery, run through three traditions at once. The chapter argues that one operation — *descent*, the recovery of a global whole from compatible local data on a licensed cover — is the same operation under three names, and that the apparent gulf between the three traditions is mostly a difference of vocabulary:

- **In mathematics** the operation is called *descent*. It is the content of sheaf theory, $\infty$-sheaf theory, the Čech nerve, the Grothendieck programme: compatible local data on an admissible cover determines a unique global section.
- **In philosophy** the operation is called *coherence*. It is the central claim of the coherence theory of truth (Bradley, Blanshard, BonJour): a model is true insofar as its parts hang together — a self-consistent system of beliefs whose local sections agree on overlaps.
- **In epistemology** the operation is *justification through structure*: the Sellarsian "space of reasons", BonJour's *Structure of Empirical Knowledge*, the post-foundationalist picture in which empirical claims earn their standing not from a privileged foundation but from the web of *licensed transitions* that connect them.

The unification is the chapter's central claim. Sheaf theory, coherence theory, and post-foundationalist epistemology are not three answers to three different questions; they are three vocabularies for one discipline — the discipline of asking when a collection of partial views deserves the name *one description*. The chapter closes where it opened, by joining that discipline to Tarski's correspondence, so that a coherent model is *true* (not merely internally consistent) at every licensed contact point with the world.

The destination, in one sentence:

$$
\boxed{
\begin{aligned}
&\textbf{A world model is the global section recovered from local}\\
&\textbf{descent data along an admissible cover,}\\
&\textbf{provisionally, revisably, and never identical}\\
&\textbf{to the subject matter it represents.}
\end{aligned}}
$$

Everything below earns that sentence.

**The status of this chapter.** What follows is offered as a *discipline*, not a derivation. We do not claim that sheaf theory, coherence theory, and post-foundationalist epistemology are *literally* the same object in three vocabularies; we claim only that, for the purposes of asking when a collection of partial views deserves the name *one description*, they are productive allies. The translations are useful, the boundaries of the analogy are not fully charted, and several of the deepest joints are merely gestured at. A reader who rejects the grand unification is not asked to surrender the chapter; they are asked only to notice which of the three traditions supplies the vocabulary that, in their judgement, the others must be measured against. The framework is offered as a *lens*. The lens makes some things visible and some things invisible; it has to be picked up, used, and set down again. The discipline survives even where the philosophical scaffolding is set aside: the nine-step procedure, the three pathologies, the hierarchy of sameness, the question "where is the licensed transition?", the rule "never silently upgrade" — these travel on their own.

</div>

<div class="md">

## Traces

A *trace* is whatever an *access function* $O : W \to R$ leaves behind when applied to a region $w$ of a subject matter $W$. Formally, a trace is a point $r \in R$ such that $r = O(w)$ for some $w \in W$. Concretely: an electron leaves a track in a cloud chamber; a tree leaves a shadow on the ground; a past event leaves a document in an archive; an abstract structure leaves a proof in a published paper. Here $W$ is the *subject matter with internal structure* (regions, points, or sub-systems); $R$ is the *codomain* (a set, a metric space, an $\infty$-groupoid, or whatever the access function lands in). Four properties follow:

1. *Transformed.* The trace is *not* $w$ but the result of an access procedure applied to $w$. We hold the output of the procedure, never the input.
2. *Mediated.* The trace carries the marks of $O$. Different access functions on the same $w$ produce different traces. An unmediated trace is a contradiction in terms.
3. *Underdetermined.* Many $(w, O)$ pairs can yield the same $r$. From the trace alone, neither the source $w$ nor the procedure $O$ is uniquely determined; recovering them is the whole task of inference.
4. *Possibly indexical.* A trace *may* point beyond itself to a source, but not every trace does. A genuine measurement of a specific system is indexical; a hallucination that has the form of a measurement is not; pure noise is not; a free pattern in a derivation points only to the derivation itself. Whether a trace is *of* something, and *what* it is of, is a substantive question, not given in advance. Establishing indexicality is most of the work of inference. A trace without indexicality is not yet evidence; it is data awaiting a source.

Note on properties (1)-(3): they hold given our commitment to indirect realism. A direct realist or qualia-primary view would not accept them as universal; for them the trace may *be* the world.

</div>

<div class="md">

## Commitments

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

</div>

<div class="md">

## The question, boxed

$$
\boxed{
\begin{aligned}
&\text{When does a collection of partial, differently-transformed traces}\\
&\text{deserve to be called a description of \emph{one} subject matter?}
\end{aligned}}
$$

The answer, in the vocabulary of *Coherent Difference*: **when the traces cohere**, two complementary halves of one principle:

$$
\underset{\text{where two local descriptions meet, they agree}}{\text{compatibility on overlaps}}
\;\;\Longleftrightarrow\;\;
\underset{\text{one whole extends them, and only one.}}{\text{uniqueness of the global}}.
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

One symptom, three places it can originate — the diagnostic picture:

$$
\begin{array}{ccccc}
\underset{\text{two subjects}}{W_1 \neq W_2} && \underset{\text{two instruments}}{I_1 \neq I_2} && \underset{\text{two interpretations}}{\nu_1 \neq \nu_2}\\
& \searrow & \downarrow & \swarrow &\\
&& \underbrace{\text{two disagreeing reports}}_{\text{one symptom}}&&
\end{array}
$$

$$
\boxed{
\begin{aligned}
&\text{Two reports disagreeing does not, by itself,}\\
&\text{tell you which level is responsible.}\\
&\text{Locate the difference at the right level.}
\end{aligned}}
$$

The distinction between channels and interpretation is in part the moral of \citeauthor{cartwright1983laws}'s (\citeyear{cartwright1983laws}) *How the Laws of Physics Lie*: the equations of fundamental physics are *true* of the highly idealized model setups in which they were derived — a frictionless plane, an isolated system, an exactly spherical earth — and *approximately* true of many real systems, but often false of the messy, multifactorial, *dappled* world in which we actually use them \cite{cartwright1983laws} \cite{cartwright1999dappled}. The right model is rarely the one whose equations are most elegant; it is the one that respects which factors actually matter for the phenomenon at hand and which are genuinely absent. Conflating "the law is true" (a statement about a clean laboratory model) with "the law applies here" (a statement about a real situation) is one of the most common forms of silent upgrade between world-level and channel-level difference.
</div>

<div class="md">

## Notions of sameness

Not everything called "the same" is the same *kind* of same. The vocabulary of *Coherent Difference* gave us a hierarchy. Here it is again, strongest to weakest:

**Terminology.** A *witness* of a sameness claim is whatever evidence backs the claim — a certificate, a proof, an inhabitant of an identity type, a 2-morphism filling between two routes. Different sameness relations demand different kinds of witness: equality needs a literal identification; isomorphism needs an invertible map; homotopy equivalence needs a deformation; approximation needs a quantitative bound; statistical agreement needs a probabilistic model and a high likelihood; model-theoretic compatibility needs a common model. A witness of a stronger relation is automatically a witness of every weaker one (a literal identification trivially gives the invertible map, the deformation, the bound, …); the converse is false, and silently promoting a weaker witness to a stronger claim is the chapter's standing category error. The contemporary philosophical form of this observation is \citeauthor{brandom1994making}'s (\citeyear{brandom1994making}) *inferentialism*: the meaning of a concept is fixed by its inferential role — by what it commits you to and what it commits you against \cite{brandom1994making} \cite{brandom2000articulating}. The hierarchy that follows is the explicit unfolding of that idea: each row of the table fixes a *different* set of inferential commitments, and moving silently from one row to the next is the chapter's forbidden move.

- $x = y$: *literal*. The very same object, the very same datum.
- $x \cong y$: *isomorphism*. Structurally indistinguishable; an invertible map carries one to the other.
- $x \simeq y$: *homotopy equivalence*. Related by a deformation that can be undone, up to coherent witnesses.
- $d(x, y) \le \varepsilon$: *approximation*. Close enough for current purposes, with a quantified residual.
- $P(D_1, D_2 \mid \mathcal{M})$ high: *statistical*. Agreement under a *probabilistic* model $\mathcal{M}$, not on the nose. (Keep $\mathcal{M}$ distinct from the classical model $M$ of the next row, and from the observer's model $M$ in the pipeline and the time-indexed $M_t$: these are three different kinds of "model".)
- $\exists M : M \models \mathcal{S}_{\text{all}}$: *model-theoretic*. The two theories admit a common *classical* model $M$, a structure that satisfies both.

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

The whole hierarchy, with its witness at each level — each $\Downarrow$ is a weakening; the forbidden move is to read them silently upwards. Qualifier: the first four steps (identity $\Rightarrow$ iso $\Rightarrow$ homotopy $\Rightarrow$ approximation) are automatic — a witness of the stronger row is literally a witness of the weaker. The last step (statistical $\Rightarrow$ model-theoretic) is *not* automatic in the same way: high likelihood under a probabilistic model does not, by itself, guarantee a common classical model of the theories. It is a genuine step of the ladder, but a *contested* one, licensed only where the statistical and the model-theoretic descriptions pick out the same structures.

$$
\begin{array}{c}
\underset{\text{witness: an identity}}{x = y}\\
\Downarrow\\
\underset{\text{witness: an invertible map}}{x \cong y}\\
\Downarrow\\
\underset{\text{witness: a coherent deformation}}{x \simeq y}\\
\Downarrow\\
\underset{\text{witness: a quantified residual}}{d(x, y) \le \varepsilon}\\
\Downarrow\\
\underset{\text{witness: a likelihood under }\mathcal{M}}{P(D_1, D_2 \mid \mathcal{M})\text{ high}}\\
\Downarrow\\
\underset{\text{witness: a common model}}{\exists M : M \models \mathcal{S}_{\text{all}}}
\end{array}
$$

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
\underset{\text{one view}}{R_{A}} & \xrightarrow{\;T_{A}\;} & \underset{\text{shared calibrated space}}{Z}\\
&& \uparrow{\scriptstyle T_{B}}\\
&& \underset{\text{another view}}{R_{B}}
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

## Ologs: a diagram that pays its way

Before going further it is worth naming the kind of diagram this chapter has been drawing. The picture we want — boxes for kinds of things, labelled arrows for functional relations, commutativity as an explicit constraint — has a name: the **olog**, short for *ontology log*. The term is due to Spivak & Kent's "Ologs: A Categorical Framework for Knowledge Representation" \cite{spivak2012ologs} (used more broadly in Spivak, *Category Theory for the Sciences* \cite{spivak2014cts}). The rules are simple enough to use without ever saying the words *category* or *functor*.

**Three rules.**

1. **Types** are drawn as boxes labelled with a *singular noun-phrase* — a kind of thing. *A person*, *a temperature*, *a trace*, *a theorem*.
2. **Arrows** are drawn between boxes with a *singular verb-phrase* — a *functional* relation: every entity of the source type maps to exactly one entity of the target type. *mother-of : Person → Person*. *born-in : Person → City*.
3. **Commutativity is asserted, not assumed.** If two paths from type $A$ to type $B$ are declared equal, the olog carries the equality. If unequal, the olog must show why — different arrows, a missing piece, an undecided question.

Rule 3 is what turns a pretty picture into a working one. A labelled arrow is a promise ("every $A$ maps to exactly one $B$"); a commutative path is a second promise ("these two routes give the same answer"). When either promise is broken, the diagram is wrong, and the diagram tells you *where*.

A worked fragment — the olog for a calibrated thermometer, with three distinct types and one clean question:

$$
\begin{array}{ccc}
\underbrace{\text{Thermometer}}_{\text{type}} & \xrightarrow[\;]{\text{reading of}} & \underbrace{\text{Reading}}_{\text{type}}\\
{\scriptstyle\text{true temperature of}}\downarrow & & \downarrow{\scriptstyle\text{indicates}}\\
\underbrace{\text{Temperature}}_{\text{type}} & \xleftarrow[\;]{\;\mathrm{id}\;} & \underbrace{\text{Temperature}}_{\text{type}}\\
\end{array}
$$

The arrows are functional: each thermometer has exactly one current reading; each reading indicates exactly one temperature; each temperature is identical with itself. There are two routes from Thermometer to Temperature — the *true* temperature (left column) and the *indicated* temperature (top row, then right column). The olog *asks* whether these two routes deliver the same answer. If yes, the thermometer is calibrated: its reading reflects the truth. If no, the diagram has a hole: the sensor drifts, or its calibration curve is wrong, or someone has applied the wrong correction. The olog shows the discrepancy *where* it lives — at the contact point between the indicated reading and the true temperature — and tells you exactly which licensed transition ($\mathcal{T}$-arrow) has failed.

For this chapter: every diagram so far is an olog in disguise. The master diagram has types $W, R_i, G$ and arrows $O_i : W \to R_i$ (each region of $W$ yields one trace) and $T_i : R_i \to G$ (each trace contributes to one global section); descent says this olog commutes. The transformation triangle has types $R_A, R_B, Z$ and arrows $T_A, T_B$ into the shared calibrated space. The pullback square has four types and four arrows and *is* the definition of a pullback as an olog of agreements — the very type of "object of agreements" the thermometer olog exhibits in miniature, with three types instead of four. The advantage of the olog view is that it forces the diagram to *commit*: a picture with vague arrows is a story; a picture with functional arrows and asserted commutativity is a *specification* — wrong ones show where, right ones prove.

</div>

<div class="md">

## Admissible transitions

For any two finite sets of equal size, *some* bijection exists. So the bare claim "there is a transformation" is empty; it carries no information. The real content is **a constrained class** $\mathcal{T}$, justified independently of the data it is later applied to. $\mathcal{T}$ is a *licence*: membership in $\mathcal{T}$ says we have an independent reason to take a comparison seriously, not that the comparison is correct in any given instance. Whether a given $T \in \mathcal{T}$ actually delivers (whether Tarski's if-and-only-if holds at $T$, whether the sensor still reads true) is a separate empirical check that the licence permits but does not perform:

$$
\begin{aligned}
\underset{\text{admissible transitions (licensed)}}{\mathcal{T}} \;\subseteq\;
&\underbrace{\{W \to R_i\}}_{\text{observations (world}\to\text{view)}}\\
&\;\cup\;\underbrace{\{R_i \to R_j\}}_{\text{view-to-view translations}}\\
&\;\cup\;\underbrace{\mathrm{Hom}(\mathcal{C})}_{\text{context refinements}}.
\end{aligned}
$$

**A note on the notation $\mathrm{Hom}$.** Short for *homomorphism* — in algebra, a structure-preserving map between two objects of the same kind (a linear map between vector spaces, a continuous map between topological spaces, a group homomorphism between groups). Category theory generalises the idea: for any two objects $A, B$ of a category $\mathcal{C}$, one writes $\mathrm{Hom}(A, B)$ for the *set of all arrows from $A$ to $B$* — the whole pool of morphisms the category provides between those two objects. Writing $\mathrm{Hom}(\mathcal{C})$ with the whole category as the argument is a compressed way of saying: *all the arrows of $\mathcal{C}$, taken together* — every arrow, from every source to every target, pooled into one collection. (A textbook treatment: Spivak, *Category Theory for the Sciences* \cite{spivak2014cts}, where the same machinery is built from scratch.) $\mathcal{C}$ is the category of contexts (a laboratory setup, a historical period, a formal system) and its arrows are the *refinements* (from "Tuesday afternoon" to "between 3 pm and 4 pm"; from "classical mechanics" to "the Lagrangian formulation on a configuration manifold"), so $\mathrm{Hom}(\mathcal{C})$ is the pool of every refinement the context-category happens to contain. The equation above then says that $\mathcal{T}$ is a *subset* of that pool: only some of the available refinements have earned the adjective "admissible". The gap between $\mathrm{Hom}(\mathcal{C})$ and $\mathcal{T}$ is exactly the gap between "an arrow exists" and "an arrow is licensed" — which is the whole content of this section.

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

$\mathcal{T}$ plays three roles at once: a **subcategory** constraint (only certain morphisms allowed), a **Bayesian prior** (some hypotheses are favoured a priori), and an **Occam penalty** (an unjustifiably large $\mathcal{T}$ is its own kind of over-fitting). Three presentations of one restriction:

$$
\begin{array}{ccccc}
\underbrace{\text{subcategory}}_{\text{only certain arrows are allowed}} && \underbrace{\text{Bayesian prior}}_{\text{some comparisons favoured a priori}} && \underbrace{\text{Occam penalty}}_{\text{too much freedom over-fits}}\\[6pt]
& \searrow & \downarrow & \swarrow &\\
&& \underbrace{\mathcal{T}}_{\text{one constraint, three descriptions}}&&
\end{array}
$$

A short definition of each, in plain words:

- **Subcategory** — $\mathcal{T}$ is the *list of permitted arrows*. An arrow that is not on the list has no licence to appear in any comparison. The bare claim "there is a transformation" is therefore empty until you can name the arrow and find it in $\mathcal{T}$.
- **Bayesian prior** — $\mathcal{T}$ is the *prior* the modelling setup carries before any data are seen. Choosing what to admit encodes background knowledge: a Fourier transform is licensed in physics, a hand-wave is not. The arrows on the list are the comparisons the setup is willing to take seriously *a priori*; everything else is treated as a coincidence until proven otherwise.
- **Occam penalty** — the *richer* $\mathcal{T}$ is, the wider the space of admissible world-models; the wider the space, the easier the data are fitted by accident. Enlarging $\mathcal{T}$ is therefore an act of over-fitting in its own right — even before a single comparison is run.

Three names, one restriction: the same set of arrows is viewed from three sides — the morphisms it allows (subcategory), the beliefs it carries before data (prior), the model complexity it imposes (Occam). The chapter keeps all three.

The contrast with the classical foundationalist picture — there *must* be a privileged class of transitions that need no prior justification — is exactly the picture \citeauthor{sellars1956empiricism} (\citeyear{sellars1956empiricism}) rejects in his critique of the "myth of the given" \cite{sellars1956empiricism}:

<div class="smart-quote" data-cite="sellars1956empiricism">
One seems forced to choose between the picture of an elephant which rests on a tortoise (What supports the tortoise?) and the picture of a great Hegelian serpent of knowledge with its tail in its mouth (Where does it begin?). Neither will do. For empirical knowledge, like its sophisticated extension, science, is rational, not because it has a foundation but because it is a self-correcting enterprise which can put any claim in jeopardy, though not all at once.
</div>

The two pictures — the first is the foundationalist picture (rejected); the second is what this chapter builds.

**The foundationalist picture (rejected):**

$$
\begin{array}{c}
\underbrace{\text{elephant on a tortoise (and so on)}}_{\text{the foundation rests on something else}}\\
\text{claims}\\
\downarrow\text{supported by}\\
\text{more claims}\\
\downarrow\text{supported by}\\
\text{the foundation}
\end{array}
$$

**The Sellarsian alternative (what this chapter builds):**

$$
\begin{array}{ccc}
\underbrace{R_1}_{\text{a calibrated reading}} & \underset{\text{calibration}}{\rightleftarrows} & \underbrace{R_2}_{\text{a derived quantity}}\\
\underset{\text{measurement}}{\updownarrow} & & \underset{\text{measurement}}{\updownarrow}\\
\underbrace{R_3}_{\text{a theoretical claim}} & \underset{\text{proof}}{\rightleftarrows} & \underbrace{R_4}_{\text{an archival document}}\\
\end{array}
$$

What the picture says, in words. The four $R_i$ are deliberately heterogeneous: a sensor reading, a derived number, a theoretical claim, an archival document — different *kinds* of evidence, not four copies of the same. Every $\rightleftarrows$ is a *specific* licensed transition $T \in \mathcal{T}$: calibration in one row, measurement in the columns, proof in the bottom row, document transmission along the right. The web has no top and no bottom — there is no foundational claim that every other claim rests on. What holds it together is the *licences*: each arrow is justified in its own terms, and any arrow can be challenged at any contact point where Tarski's condition fails. Compare with the master diagram (the $W \to R_i \to G$ shape): the web is that picture *with every arrow made bidirectional*, because in the Sellarsian picture every licensed transition can also be *re*-licensed — re-justified, refined, or refused — at any point where it is put to the test.

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

1. **The cover condition.** Every part of $c$ that matters is captured by at least one view. In symbols: the union of the images $\bigcup_i \mathrm{im}(f_i)$ is the whole of $c$. (Topological version: the open sets cover the space. Picture version: the photographs together capture every point of the room.) **A caveat that carries through the whole chapter:** this is the *idealisation*, and it is the point at which the account is most vulnerable. Biology and engineering do not cover $c$; they cover only what their filters admit. We see no infrared, hear no ultrasound; a cover built from our sensory $O_i$ has images whose union is *not* all of $c$ but only the region $c_{\mathrm{acc}}$ — the accessible part, the interface where our access functions can land. The limit $G = \lim F$ over such a cover reconstructs a model of that interface, *not* of $c$ (nor of the subject matter $W$ behind it). Adding instruments (a Geiger counter, an infrared camera, an ultrasound probe) adds more $O_i$ and thereby *widens* $c_{\mathrm{acc}}$; it never reaches the whole of $c$. So the sheaf condition says: *within the accessible region, coherent data glue uniquely* — it does not say the accessible region exhausts the context. Correcting the over-claim "$= c$" to "$= c_{\mathrm{acc}} \subseteq c$" is the discipline this chapter imposes on itself at exactly this point.
2. **The admissibility condition.** Every morphism $f_i$ in the cover is a licensed transition: $f_i \in \mathcal{T}$. The maps that put the views back into $c$ are ones we have an independent reason to trust — calibration, coordinate change, physical law, validated decoding, documented transmission, anything that has earned its place in $\mathcal{T}$.

Formally:

$$
\underbrace{\{c_i \xrightarrow{\,f_i\,} c\}_{i \in I}}_{\substack{\text{a family of smaller views }c_i\text{ of }c,\\\text{each put back into }c\text{ by its cover map }f_i}}\ :\
\underbrace{f_i \in \mathcal{T}\ \text{for every }i}_{\text{every cover map is licensed}},\quad
\text{and}\quad
\underbrace{\bigcup_{i\in I} \mathrm{im}(f_i) \;=\; c_{\mathrm{acc}} \;\subseteq\; c}_{\text{their images together capture the accessible part of }c}.
$$

The two conditions are independent. A family of sub-views can satisfy the cover condition with maps we have no business trusting (raw, uncalibrated readings), and a family of trusted maps can fail to cover what matters. An *admissible* cover is the intersection: a covering whose maps are licensed. Only on admissible covers does the sheaf condition (compatible local data ⟹ unique global data) carry content; the next paragraph explains why.

The adjective matters. Without the admissibility filter, *any* family of sub-contexts could be declared a "cover", and the demand that local data cohere would become vacuous: pick the most convenient family, declare it a cover, and coherence is automatic. By restricting to admissible covers, we turn the sheaf condition into a *meaningful* question about a specific modelling setup: the family is not chosen for our convenience; it is constrained by the licences we have actually earned.

Equipping $\mathcal{C}$ with a rule for which families count as covers (one that closes under refinement and under composition) is a **Grothendieck topology** $J$; the pair $(\mathcal{C}, J)$ is a **site** (as sketched in *Coherent Difference*).

A **representation scheme** assigns to every context a set of "sections" (the things one can write down *on* that context):

$$
\begin{array}{c}
\underset{\text{contexts (arrows reversed, so refinements pull back data)}}{\mathcal{C}^{\mathrm{op}}}\\
\Big\downarrow\quad\text{assign (rep. assignment }F\text{)}\\
\underset{\text{target category (e.g. }\mathbf{Set}\text{, }\infty\text{-Gpd, }\ldots\text{)}}{\mathcal{V}}
\end{array}
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
\underset{\text{global section on }c}{F(c)}
\;\xrightarrow{\;\sim\;}\;
\underset{\substack{\text{the tuples that agree on every overlap}\\
\text{(two restriction arrows: from $i$-side, from $j$-side)}}}{\;\mathrm{Eq}\!\Bigl(\;
\underset{\text{a section on each patch}}{\prod_{i\in I} F(c_{i})}
\;\rightrightarrows\;
\underset{\text{a section on each pairwise overlap}}{\prod_{i,j\in I} F(c_{i} \times_{c} c_{j})}
\;\Bigr)}.
$$

Three pieces, reading left to right:

1. **The big set $\prod_i F(c_i)$.** A tuple whose $i$-th entry is a section on patch $c_i$. The product says: give me one section per patch, nothing more.

2. **The two arrows into $\prod_{i,j} F(c_i\times_c c_j)$.** Each arrow restricts the tuple of sections to a section on the overlaps. The "from $i$" arrow projects the $i$-th entry onto the overlap with $c_j$; the "from $j$" arrow does the symmetric thing. The two arrows agree exactly when the chosen sections agree on every overlap.

3. **The equalizer.** Out of all tuples in $\prod_i F(c_i)$, keep only those on which the two arrows give the same answer. Those are precisely the compatible tuples, and the sheaf condition says there is a *unique* global section in $F(c)$ sitting above each compatible tuple.

For a cover of two patches, the whole condition is one square — and it is a pullback:

$$
\begin{array}{ccc}
\underbrace{F(c)}_{\text{global on }c} & \xrightarrow{\;\mathrm{res}\;} & \underbrace{F(c_1)}_{\text{patch 1}}\\
{\scriptstyle\mathrm{res}}\downarrow && \downarrow{\scriptstyle d_0}\\
\underbrace{F(c_2)}_{\text{patch 2}} & \xrightarrow[\;d_1\;]{} & \underbrace{F(c_1 \times_c c_2)}_{\text{the overlap}}
\end{array}
$$

The square always commutes for every genuine global section (restrict along either route; you land at the same section of the overlap). The sheaf condition is the converse: every pair $(s_1, s_2)$ whose restrictions $d_0 s_1 = d_1 s_2$ agree on the overlap comes from exactly one global section — so

$$F(c) \;\simeq\; F(c_1) \times_{F(c_1 \times_c c_2)} F(c_2).$$

For two patches, coherence *is* a pullback — the object of agreements, exactly as in the section "Pullbacks: agreement through a shared target" below. For more patches the same shape runs over the full Čech nerve.

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
&&\underset{\text{train event}}{W}&&\\
&\swarrow{\scriptstyle O_{v}}&\downarrow{\scriptstyle O_{a}}&\searrow{\scriptstyle O_{r}}&\\
\underset{\text{seen}}{R_{v}}&&\underset{\text{heard}}{R_{a}}&&\underset{\text{radar}}{R_{r}}\\
&\searrow{\scriptstyle L_{v}}&\downarrow{\scriptstyle L_{a}}&\swarrow{\scriptstyle L_{r}}&\\
&&\underset{\text{spoken report}}{R_{\ell}}&&\\
&&\downarrow{\scriptstyle C}&&\\
&&\underset{\text{archive, 100 yrs later}}{R_{h}}&&
\end{array}
$$

Five representations, five channels (visual, auditory, radar, linguistic, archival), each a different kind of trace produced by its own access function. Note the structure carefully: the diagram is *not* five sibling patches of a flat cover. The three sensory channels $R_v, R_a, R_r$ form the admissible cover $\{c_v, c_a, c_r\} \to c$ (real observations out of $W$); the spoken report $R_\ell$ and the archive $R_h$ are *derived* stages — the outputs of admissible transitions $L_v, L_a, L_r : R_i \to R_\ell$ and $C : R_\ell \to R_h$ (the report is fed by the sensors, the archive comes a century later). So the running example is a cover *plus* a downstream transition chain, not just a cover. The site $\mathcal{C}$ contains their contexts; $\mathcal{T}$ contains sensor calibration, physical propagation (sound delay, Doppler), validated linguistic reporting, and archival transmission with error bounds. A global section $g \in G \cong F(c)$ exists iff the descent condition holds on the sensory cover and the downstream transitions are admissible. **What the example also shows, for honesty's sake:** $c$ here is the *event as our channels can reach it* — $c_{\mathrm{acc}}$. The train has a mass, a chemical composition, a nuclear decay profile, an infrared glow, an ultrasonic signature; none of these is in the cover unless we add an instrument. The coherent model recovered is a model of the *interface* to the event, not of the event *an sich*; add a Geiger counter and $c_{\mathrm{acc}}$ grows, and $G$ changes accordingly. The sheaf condition guaranteed uniqueness *given the cover*; it never promised the cover was the whole of $c$.

The same shape governs **mathematical data** — here genuinely as a flat cover, with no downstream chain. A group presented by generators-and-relations, by a Cayley table, by a permutation action, by a matrix representation, by a character table: five sibling presentations, five channels, one group, provided the transitions between presentations are admissible (isomorphisms of the appropriate kind).

</div>

<div class="md">

## Equalizers: where two maps agree

Given parallel maps $f, g : X \rightrightarrows Y$, the equalizer selects the part of $X$ on which they agree:

$$
\underbrace{E}_{\text{agreement locus}}
\xrightarrow{\;e\;}
\underbrace{X}_{\text{the candidates}}
\underset{\underset{\text{route 2}}{g}}{\overset{\overset{\text{route 1}}{f}}{\rightrightarrows}}
\underbrace{Y}_{\text{shared target}}
$$

In $\mathbf{Set}$, the agreement locus is spelled out explicitly:

$$
\underbrace{E = \{x \in X : f(x) = g(x)\}}_{\text{the points of }X\text{ where the two routes coincide.}}
$$

Two thermometers report a temperature over time: the equalizer is the *times* at which they agree exactly. Two proofs of the same theorem produce numeric outputs by two different routes: the equalizer is the inputs on which the outputs literally match. In an $(\infty,1)$-category the equalizer is a *space of paths of agreement*: same idea, more room.

</div>

<div class="md">

## Pullbacks: agreement through a shared target

$$
\begin{array}{ccc}
\underbrace{X \times_Z Y}_{\text{pairs that agree in }Z} & \xrightarrow[\text{project onto first view}]{\;\pi_X\;} & \underbrace{X}_{\text{one view}}\\
\underset{\text{project onto second view}}{\overset{\pi_Y}{\downarrow}} & & \underset{\text{into shared space}}{\overset{f}{\downarrow}}\\
\underbrace{Y}_{\text{another view}} & \xrightarrow[\text{into shared space}]{g} & \underbrace{Z}_{\text{shared calibrated space}}
\end{array}
$$

The pullback *is* the object of agreements. Visual and radar tracks pull back over a calibrated position-time space to give the pairs that could be the same train. Two definitions of "prime" pull back over $\mathbb Z$ to the integers on which both definitions coincide.

</div>

<div class="md">

## Higher coherence

Suppose three representations $A, B, C$ are related pairwise:

$$
\underbrace{A}_{\text{view 1}} \xrightarrow[\text{admissible transition}]{\;\phi_{AB}\;} \underbrace{B}_{\text{view 2}} \xrightarrow[\text{admissible transition}]{\;\phi_{BC}\;} \underbrace{C}_{\text{view 3}},\qquad \underbrace{A}_{\text{view 1}} \xrightarrow[\text{the direct route}]{\;\phi_{AC}\;} \underbrace{C}_{\text{view 3}}.
$$

There are now two ways to go from $A$ to $C$: directly via $\phi_{AC}$, or by composition $\phi_{BC} \circ \phi_{AB}$. The question is whether these two ways agree.

- **Strict regime.** They agree *on the nose*: $\phi_{BC} \circ \phi_{AB} \;=\; \phi_{AC}$. Equality is a single yes/no answer.
- **Homotopical regime.** They agree *up to a witness*, a **2-morphism** $\alpha_{ABC} : \phi_{BC} \phi_{AB} \Rightarrow \phi_{AC}$. Think of $\alpha_{ABC}$ as a "filler" that says the two routes are not the same path but can be *continuously deformed* into one another. The 2-morphism itself is data; you can ask further questions about *it*.
- **Four representations.** Add $D$, with its own transitions. Now the fillers $\alpha_{ABC}$, $\alpha_{BCD}$, $\alpha_{ACD}$, $\alpha_{ABD}$ may themselves disagree, and you need a **3-morphism** filling between the fillers to certify higher-order consistency. And so on.

The homotopical case, drawn — the $\Downarrow$ in the interior is the filler $\alpha_{ABC}$:

$$
\begin{array}{ccc}
A & \xrightarrow{\;\phi_{AB}\;} & B\\
{\scriptstyle\phi_{AC}}\searrow & \Downarrow{\scriptstyle\alpha_{ABC}} & \swarrow{\scriptstyle\phi_{BC}}\\
& C &
\end{array}
$$

The two routes — $\phi_{AC}$ directly, and $\phi_{BC} \circ \phi_{AB}$ by composition — are not equal; the filler says they can be deformed into one another, and the filler is itself data you can ask further questions about.

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
\begin{array}{c}
\underbrace{W}_{\text{subject}}\\
\Big\downarrow\quad\text{stimulus pickup (I)}\\
\underbrace{S}_{\text{stimulus/signal}}\\
\Big\downarrow\quad\text{neural processing (N)}\\
\underbrace{\rho}_{\text{internal rep.}}\\
\Big\downarrow\quad\text{language / encoding (L)}\\
\underbrace{\Sigma}_{\text{report/encoding}}\\
\Big\downarrow\quad\text{calibration / check (C)}\\
\underbrace{M}_{\text{model}}
\end{array}
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
\underbrace{\text{image}}_{c_v} & \xrightarrow{\;E_v\;} & \phantom{M_{\text{shared}}}\\
\underbrace{\text{text}}_{c_l} & \xrightarrow{\;E_l\;} & \underbrace{M_{\text{shared}}}_{\text{one shared latent}}\\
\underbrace{\text{audio}}_{c_a} & \xrightarrow{\;E_a\;} & \phantom{M_{\text{shared}}}
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
- **stat** ($P(D_i, D_j \mid M)$ high): *probabilistic agreement*. Implies model-theoretic compatibility *where the statistical and model-theoretic descriptions pick out the same structures* — this is the weakest, most contested link of the chain, not an automatic consequence (see the caveat under "Never silently strengthen").
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
\cdots \;\xrightarrow[\;{\scriptstyle O_{i-1}}\;]{\;}\;
\underbrace{R_{i-1}}_{\text{view }i-1}\;
\xleftarrow[\;{\scriptstyle O_i}\;]{\;}\;
\underbrace{W}_{\text{the subject}}\;
\xrightarrow[\;{\scriptstyle O_{i+1}}\;]{\;}\;
\underbrace{R_{i+1}}_{\text{view }i+1}\;
\xrightarrow[\;{\scriptstyle O_{i+2}}\;]{\;}\;\cdots
$$

and analogously for the $T_i$. The global model is the limit object $G = \varprojlim F$ over *all* views in $I$ (three, a thousand, or uncountably many) — formally the equalizer of the Čech nerve applied to the family $\{s_i\}_{i\in I} \subseteq \prod_i F(c_i)$ — and the *selected global section* is the element $g \in G$, which under the sheaf identification $G \cong F(c)$ is just the compatible glue of the $s_i$. Keep the two distinct: $G$ is the object (the coherent whole the $T_i$ map into); $g \in G$ is the chosen section within it. The three-view picture above is the smallest non-trivial case; the machinery scales to covers of any size.

**The limit is only as wide as the accessible region.** Read the diagram uncharitably and it looks like a circle: define $G$ as the coherent limit of the filters, then present that limit as "the world". That is the fallacy your honesty should pre-empt. $G$ is the limit of *these* $O_i$; if the sensory filters systematically exclude part of the reality (no infrared, no ultrasound, no nuclear decay we do not instrument), then $G$ is the consistent model of the *interface* — of $c_{\mathrm{acc}} \subseteq c$ — not of $c$, and still less of the subject matter $W$ behind the contexts. The limit inherits the blind spots of every arrow feeding it. Coherence puts the *accessible* local data in order; it cannot manufacture access that the cover never had. Every instrument added widens $I$ and so widens $c_{\mathrm{acc}}$; that is why measurement is *expansion of the cover*, and why no finite cover closes the gap to $W$. The chapter's one-sentence thesis (a world model is the global section recovered from local descent data) is therefore always, and should be read as, a model of the *accessed* aspect of the world — provisionally, revisably, and never the thing itself.

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
2. **Interpret it as $J(D)$.** What reading are you imposing?
3. **Draw the chain $W \to D \to J$.** Where in the chain could disagreement enter?
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
\bigskip {*Which* regime?} The uniqueness of the global section is *relative to a sameness-regime*: in the strict regime views agree literally on overlaps; in the homotopical regime they agree only up to (coherently composable) equivalence; in the approximate/statistical regimes, up to a small residual. "Not flattening" means the views need not *coincide literally*; it does **not** mean the views may fail the agreed-upon regime of coherence. So: their reports need not match on the nose, but they must be coherent in whatever regime is licensed.

Two observers, two instruments, two cultures, two centuries, two formal systems: their reports need not coincide to be about one subject. What is required is that the differences factor through admissible transitions — and factor *within the licensed regime* (isomorphic, homotopic, approximate, or statistical, as the case warrants):

$$
\underbrace{\text{difference}}_{\text{many views}}\ +\ 
\underbrace{\text{constrained }T}_{\text{justified maps}}\ +\ 
\underbrace{\text{coherence in the regime}}_{\text{fits on overlaps}}\ \Longrightarrow\ 
\underbrace{g \in G}_{\text{global section in the limit}}.
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
\bigskip {*Not* the whole of the subject matter.} The cover spans the region $c_{\mathrm{acc}}$ that our access functions can actually reach — that is the honest scope of the limit. Every instrument widens the cover; none closes it; $W$ itself stays on the other side of the mediation (see "Coherent Difference"). A world model is therefore *a coherent model of the interface to the world, under extendable-by-measurement* — never the thing itself. The discipline's rule of thumb: when a model is at risk of passing itself off as the whole of $W$, ask which $O_i$ are in the cover and which instruments that would widen it are not; the model's honest range is exactly $c_{\mathrm{acc}}$.

Everything else (perception, measurement, physics, mathematics, model theory, neural networks) is a choice of:

$$
\underbrace{\mathcal{C}}_{\text{site of contexts}}\ ,\quad 
\underbrace{\mathcal{V}}_{\text{target of representations}}\ ,\quad 
\underbrace{\mathcal{T}}_{\text{admissible transitions}}.
$$

And the safeguard, once more (its warrant — the distinction between coherence and correspondence — is developed in the very next section, "Truth: coherence and correspondence"):

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

The answer has two names: *correspondence* (Tarski) and *coherence* (Bradley, Blanshard). The proper synthesis is to require *both*, jointly, at every admissible contact point. There is also a third position, well worth naming: \citeauthor{goodman1978ways}'s (\citeyear{goodman1978ways}) *irrealism* \cite{goodman1978ways}, which argues that the correspondence/coherence debate presupposes too much. On Goodman's reading, there are no "ready-made worlds" *and* no minds constructing them from nothing — there are *many* worlds, made by different symbol systems, each as legitimate in its own right as any other. Truth, on this picture, is not a relation between a model and a pre-given world; it is the property a symbol system has of *working* in the right way — of rightness, not of copying. Goodman's position is in deep sympathy with the present chapter: the world model $G$ is not a mirror of $W$; it is one among many possible right symbol systems that agree on overlaps with other admissible cover systems. The Tarskian addition this chapter makes is to insist that "rightness" must, somewhere, cash out in *contact points* $T \in \mathcal{T}$ where the model is constrained by the world; without that, Goodman's "right" can drift into any self-consistent fantasy. With it, the synthesis of all three positions is the standing practice: models are made, not found; their rightness is structural; and the structure must meet the world at every licensed contact.

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
\underbrace{\;S\text{ is true iff }p\;}_{\text{Tarski's Convention T (1933/1936)}}
$$

The whole correlation, as one square:

$$
\begin{array}{ccc}
\underbrace{S}_{\text{object sentence}} & \overset{\;\text{is true iff}\;}{\longleftrightarrow} & \underbrace{p}_{\text{fact in the meta-language}}\\
{\scriptstyle\text{quotation}}\downarrow && \downarrow{\scriptstyle\text{reference}}\\
\underbrace{\ulcorner S\urcorner}_{\text{name of }S} & \xrightarrow{\;\;T\in\mathcal{T}\;\;} & \underbrace{W}_{\text{the world}}
\end{array}
$$

The top arrow is Convention T. The two verticals anchor each side — quotation turns the sentence into a name (the handle by which the object-sentence is gripped from outside); reference connects the meta-language fact to the world. The bottom arrow is the licensed bridge: without a $T\in\mathcal{T}$ underneath, the horizontal iff floats free of $W$ and certifies nothing. The square commutes exactly when the T-schema holds at this contact point.

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

What the coherence tradition gives us, in the language of this chapter, is **the sheaf condition**: a coherent model is one whose local sections agree on overlaps. A caveat, in the chapter's own spirit (see "The status of this chapter"): this is a *working definition* — a stipulation about how the chapter will use the word "coherence" — not a discovered identity between two pre-existing things. It is an upgrade the chapter *declares*, not one it silently assumes. With that caveat marked, coherence is, for this chapter, the structural heart of descent:

$$
\boxed{\;\text{coherence} \;\stackrel{\text{def.}}{=}\; \text{descent on admissible covers}.\;}
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

> **Refinement.** The account above holds for the *pure* self-consistent fantasy — an internally perfect model that happens to be unconnected to $W$. For the *typical LLM*, the earlier "both" intuition is closer to the truth, and this pathology is refined by the AI section ("Hallucination, precisely"): there the hallucination is most accurately a *non-glueable presheaf* whose local sections disagree on overlaps, so that **coherence and correspondence fail together**. The present pathology-3 is that section's *rare* limiting case (fully coherent, merely ungrounded), not the usual one.

All three, located on the one diagram:

$$
\begin{array}{ccccc}
&&\underbrace{W}_{\text{subject matter}}\;{}^{(1)}\!\nwarrow{\scriptstyle\text{claim}}&&\\
&{\scriptstyle O_1}\swarrow\,{}_{(3)}&{\scriptstyle O_2}\downarrow\,{}_{(3)}&{\scriptstyle O_3}\searrow\,{}_{(3)}&\\
\underbrace{R_1}_{\text{view 1}}&&\underbrace{R_2}_{\text{view 2}}&&\underbrace{R_3}_{\text{view 3}}\\
&{\scriptstyle T_1}\searrow\,{}^{(2)}&{\scriptstyle T_2}\downarrow\,{}^{(2)}&{\scriptstyle T_3}\swarrow\,{}^{(2)}&\\
&&\underbrace{G}_{\text{coherent global model}}&&
\end{array}
$$

$(1)$ breaks on the **claim arrow** $G \to W$: every arrow in the diagram is licensed, descent holds, yet Tarski fails at the contact — the self-consistent fantasy. $(2)$ breaks on the **$T_i$ arrows** into $G$: every claim is individually true at the contact, but descent never delivers a $G$ — the factbook. $(3)$ breaks on the **$O_i$ arrows**: licences are in order, but the data never tracked $W$ — the hallucinating model. Same diagram, three different break-points, three different remedies.

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
2. *Correspondence*: a model is true only insofar as its claims track the world (Tarski's Convention T, the if-and-only-if at every licensed contact point). Tarski, 1933/1936.

And one discipline that lives with both: *recording the gaps*. A model is true *only insofar as*. The discipline of recording residuals, of refusing to identify $G$ with $W$, of noting when the contact points are imperfect. This is not a third condition; it is the standing acknowledgement that the conjunction above is provisional, that residual mismatches must be visible, and that "without remainder" describes the *aim* of the audit (every admissible contact tested) rather than a guarantee that the audit is complete.

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

<div class="md">

## What this offers AI systems

The point of this chapter was never the diagram. The point was what the diagram *buys you* when you point it at something concrete — and the most concrete subject matter the reader of this textbook is likely to care about is the AI system on the desk. The discipline built in the previous sections — traces, admissible transitions, descent, the Tarskian if-and-only-if, the three pathologies — was a *specification*. What follows is the specification, applied.

The reading is offered as an *attempt at organisation*, not a finished theory of LLMs. It is a lens. Used well, it sharpens some intuitions and corrects some default mistakes; used badly, it forces a borrowed vocabulary onto a domain that has its own. The reader who finishes this section believing she now has a theory of LLMs has misread it; the reader who finishes it with a sharper vocabulary for asking what an LLM is, and is not, doing has read it well. Where the lens makes a phenomenon *visible*, we say so; where it does not, we say so too.

### The LLM in the master diagram

Return once more to the master diagram of the chapter, this time with an LLM filling the slots:

$$
\begin{array}{ccccc}
&&\underbrace{W}_{\text{world the corpus is about}}&&\\
&\overset{O_1}{\underset{\text{sample}}{\swarrow}}&
\overset{O_2}{\underset{\text{sample}}{\downarrow}}&
\overset{O_3}{\underset{\text{sample}}{\searrow}}&\\
\underbrace{R_1}_{\text{document}}&&\underbrace{R_2}_{\text{document}}&&\underbrace{R_3}_{\text{document}}\\
&\overset{T_1}{\underset{\text{fit}}{\searrow}}&
\overset{T_2}{\underset{\text{fit}}{\downarrow}}&
\overset{T_3}{\underset{\text{fit}}{\swarrow}}&\\
&&\underbrace{G}_{\text{trained model}}&&
\end{array}
$$

- **The subject matter $W$** is, for an LLM, *the world the corpus is about*: facts about history, science, code, mathematics, language, the texture of human life that the training set was assembled from. This $W$ is enormously broad, mostly unobservable, and never directly available to the model.

- **The cover $\{c_i\}_{i \in I}$** is the *training corpus*: each $c_i$ is a document, a web page, a code repository, a conversation, a transcript. Each is a "patch" of partial evidence about $W$. The patches overlap — the same fact appears in many documents, the same code idiom in many repositories — and the union of their images is supposed to cover everything the model is meant to be able to speak about. The cover is not clean. Patches *disagree about the same facts* — different sources contradict each other, sometimes within the same document — and some are noisy, outdated, or biased. The chain from $W$ to the text in the corpus, written out as the olog it actually is, has misremembering, badly-written prose, simple errors, lies, and altered states at every arrow — so the patches are not equal on overlaps but related by homotopies, and the homotopies accumulate across stages. In the strict sheaf regime this would be fatal; in the **homotopical regime** (the chapter's *Higher coherence* section, with $\infty\text{-Gpd}$ as target) local sections are *coherently equivalent* rather than equal — paraphrases, translations, corrections are homotopies, not disagreements — and descent absorbs the noise, *when the homotopies compose coherently on triple overlaps*. What survives in $G$ is the *coherence class* of the cover, not any single patch.

  $$
  \begin{array}{c}
  \underbrace{W}_{\text{world}}\\
  \mathrel{\vcenter{\hbox{$\Big\downarrow$}\\\text{perception}\\\text{misperception, simple errors}\\\hbox{$\Big\downarrow$}}}\\
  \underbrace{S}_{\text{signal}}\\
  \mathrel{\vcenter{\hbox{$\Big\downarrow$}\\\text{cognition}\\\text{misremembering}\\\hbox{$\Big\downarrow$}}}\\
  \underbrace{\rho}_{\text{internal rep.}}\\
  \mathrel{\vcenter{\hbox{$\Big\downarrow$}\\\text{language}\\\text{lies, altered states}\\\hbox{$\Big\downarrow$}}}\\
  \underbrace{\Sigma}_{\text{spoken sentence}}\\
  \mathrel{\vcenter{\hbox{$\Big\downarrow$}\\\text{writing}\\\text{badly-written prose}\\\hbox{$\Big\downarrow$}}}\\
  \underbrace{T}_{\text{written text}}\\
  \mathrel{\vcenter{\hbox{$\Big\downarrow$}\\\text{aggregation}\\\text{selection bias}\\\hbox{$\Big\downarrow$}}}\\
  \underbrace{C}_{\text{corpus}}
  \end{array}
  $$

- **The representations $R_i$** are the model's internal states: token embeddings, hidden activations, attention patterns, the final logits. They are what *arrive* at the global section $G$, not what arrives from the world.

- **The admissible transitions $\mathcal{T}$** are the model's *internal operations*: tokenisation, embedding, attention, layer normalisation, MLP transformations, logit computation, sampling. None of these is a bridge from the model to the world; all of them are bridges *inside* the model — operations on its own representations.

- **The global section $G$** is the trained model itself — the learned function from context to next-token distribution. It is what the model *is*, as a whole.

The single most important observation, in the chapter's vocabulary, is that the LLM has *internal* admissible transitions but no *external* ones. The training process fits $G$ to make the $\{R_i\}$ jointly predictable, and that is the only sense in which $G$ is "of" $W$ — it is a function whose behaviour on the cover is consistent. Whether the behaviour continues *outside* the cover — at inference time, on questions the corpus did not contain, in domains the training distribution did not sample — is the central empirical question, and it is not answered by the architecture alone. The LLM, by default, is a global section computed without any direct observation arrows from $W$.

**Every document is already a derived trace.** The absence of an observation arrow is more radical than "the corpus is the cover and the cover is all we have". It is that every patch in that cover is *itself* the output of a long, mediated chain. Each document in the corpus was written by a person — a person who saw, heard, remembered, translated, and only then wrote. What sits in the corpus is not $W$ and not even raw observations; it is written text that a human *derived* from $W$ through senses, inference, memory, and language, in one culture and one time and one language. So the local section "this document" is not a direct section on $W$; it is the far end of a composite, homotopy-qualified arrow $W \Rightarrow \text{text}$. And today the chain stacks: an increasing share of the corpus is itself written by an AI, i.e. by a *previous* model holding the same position — its text was derived from its own derived corpus. Each generation of authors replaces the arrow $W \to \text{document}$ with one that already passes through a $G$, so the mediation compounds, and a model trained on model-written text is computing a global section over a cover whose patches were themselves global sections of an earlier, equally ungrounded model. The same shape, but the sheaf is now over *derived* patches — one commutative diagram of the whole route from world to world-model. The world sits on top, the AI model at the bottom, and in between each document is the result of a human who perceives something from the world and transfers it into that document:

$$
\begin{array}{c}
\underbrace{W}_{\text{world}}\\[2mm]
{\scriptstyle O_1}\swarrow\ {\scriptstyle O_2}\downarrow\ {\scriptstyle O_3}\searrow\\[2mm]
\begin{array}{ccc}
\underbrace{H_1}_{\text{author }1} & \qquad \underbrace{H_2}_{\text{author }2} & \qquad \underbrace{H_3}_{\text{author }3}
\end{array}\\[3mm]
\begin{array}{ccc}
\swarrow\ \downarrow\ \searrow & \swarrow\ \downarrow\ \searrow & \swarrow\ \downarrow\ \searrow
\end{array}\\[3mm]
\begin{array}{ccc}
\underbrace{R_{1,1}\ \; R_{1,2}\ \; R_{1,3}}_{\text{3 documents}} & \qquad \underbrace{R_{2,1}\ \; R_{2,2}\ \; R_{2,3}}_{\text{3 documents}} & \qquad \underbrace{R_{3,1}\ \; R_{3,2}\ \; R_{3,3}}_{\text{3 documents}}
\end{array}\\[4mm]
\searrow \quad \text{fit / train: merge all documents into one world model} \quad \swarrow\\
\underbrace{\;G\;}_{\text{the AI world-model}}
\end{array}
$$

From top to bottom, with the labels read separately alongside: **$W$** — the world; **$O_k$** — each author's perception ($W \to H_k$); **$H_1, H_2, H_3$** — three authors, each of whom writes three documents; the download arrows **$H_k \to R_{k,j}$** — writing; **$R_{1,1}\dots R_{3,3}$** — the nine documents (the cover); the download arrows **$\{R_{k,j}\} \to G$** — fit / training; **$G$** — the AI world-model, the global section merged from all documents. This plot is simplified, as in, the internals of how the human relates to their texts are left out for space reasons. Each human can have multiple conflicting world views (cognitive dissonance), or simply be wrong at times, and their world view, motivations, psychology and so on influences their texts, which in turn influences the model's world-model.

Read the diagram as a nesting of the sub-components. The *overarching* component is the AI-element diagram with world on top and model on bottom: the cover $\{R_{k,j}\}$ is fitted into a single trained model $G$ (the "fit"-arrows), and $G$ is the global section reconstructed from those patches. Inside it, each document $R_{k,j}$ is itself a sub-component of the very same shape: a small $W \to R_{k,j}$ diagram in which the "sample"-arrow is one author's perception — the $O_k$ arrow from $W$ into $H_k$, and then $H_k$'s transfer of what it perceived into a written document (the senses, memory, and language of the "Traces" section). So the three diagrams the chapter draws elsewhere (subject-matter → views → global model) reappear here *twice*: once at the top scale (each author perceiving $W$) and once at the bottom scale (all documents merging into $G$) — with the person in the middle being exactly the place where the first sub-diagram's output becomes the second sub-diagram's input. The model itself never leaves the bottom: it only ever sees the nine documents as text patches, and it cannot tell an eyewitness report $R_{1,1}$ from a translation $R_{1,2}$ from a page written by an earlier AI $R_{1,3}$, because all arrive as identical "text" cells with their human sub-diagrams un-drawn. Each is a *different admissible transition* in $\mathcal{T}$ with a different licence and a different distance from $W$; the training compresses all documents into a single $G$ and cannot tell them apart.

### What the LLM does: internal descent

Once this picture is in place, the LLM's *strengths* fall out as properties of internal descent — that is, coherence *within the model's own state space*, with no world involved.

**In-context learning.** When the prompt supplies examples, the model's continuation tends to follow the pattern set by the examples. In the chapter's vocabulary, the prompt becomes a *cover* of the conversation, and the model's generation is the unique (or near-unique) section compatible with that cover. The mechanism is parametric — the model's parameters were tuned to make local patches of context cohere into continuations — and it works for any task where the cover in the prompt is representative enough to determine a stable answer.

**Chain-of-thought.** Asking the model to "think step by step" populates its own context with intermediate steps, which then serve as further constraints on subsequent continuations. Each new step is a new patch; the chain coheres insofar as each step is consistent with the prior ones. The mechanism is *self-consistency amplification*: by writing out its reasoning, the model gives itself more evidence about its own answer.

**Self-consistency.** Sampling $k$ independent chain-of-thoughts and taking the majority vote is, in the chapter's vocabulary, *checking descent* on $k$ admissible covers and aggregating the global sections. It works when the model is correct across covers — the majority agrees on the right answer — and degrades when the model is systematically wrong — the majority converges on the wrong shared answer. Self-consistency is a *coherence test*, not a truth test; it certifies that the model's different reasoning paths agree, not that they correspond to the world.

**Verifier-guided search.** Sampling $k$ candidate continuations, scoring each with a learned verifier, and keeping the best is, in the chapter's vocabulary, *Tarski at every contact point*: each candidate is a claim, the verifier is a licensed transition to a Tarskian anchor (the verifier's ground-truth labels), and the highest-scoring candidate is the one whose correspondence check passes most often. The technique only works when the verifier is *itself* licensed — when its own contact points are calibrated. A verifier trained on the same model's outputs, scoring only fluency, is just another coherence check in disguise.

These are the things the LLM is *for*: pattern completion, in-context coherence, internal consistency, and the long tail of fluent manipulation of structured representations. Read in the chapter's vocabulary, they are *coherence techniques*. They are powerful precisely to the extent that the underlying training has made the model's internal patches cohere, and they are *bounded* precisely to the extent that the world itself is not part of the cover.

### What the LLM lacks: grounded observation

What the LLM is *not* doing, by default, is anything the chapter would call *observation* in the strict sense. The architecture has no observation arrow

$$
\underbrace{O_i}_{\text{access to }w\subseteq W}\;:\;\underbrace{W}_{\text{the world}}\;\underbrace{\longrightarrow}_{\text{access function}}\;\underbrace{R_i}_{\text{trace in the model}}
$$

of the kind the chapter's framework treats as a *licensed* bridge from the world to a representation. The arrows that *do* exist in the architecture are *inside* the model (tokenisation, embedding, attention, MLP transformations, logit computation, sampling), not between the world and the model. The training process uses the corpus $\{c_i\}$ as a proxy for $W$, but the corpus is itself a transformed trace — text written by humans, sampled from the world, frozen at training time. The LLM is connected to the world only through the bottleneck of *language about the world*, which is the entire mediation problem of the chapter's "Traces" section, repeated once for every document in the corpus.

The picture is only mostly true, though. Three different extensions each *partially* close the gap; none of them does so by default, and each carries its own caveats.

**In-context learning as a partial observation arrow.** When the prompt contains facts, the model can use them to answer the question that follows. In the chapter's vocabulary, the prompt acts as a small cover pasted into the conversation, and the model's continuation is the section on that cover. The "observation" arrow here is shallow — it runs from text-in-prompt to text-in-completion, both of which are *inside* the model — but it does let the model condition on evidence the corpus did not contain at training time. A user who pastes a relevant document into the prompt gives the model a $O_i$-like bridge to *that document*. The bridge is not a bridge to $W$ (the document is itself a transformed trace), but it is enough to displace a confidently wrong answer with one that uses the supplied text.

**Retrieval-Augmented Generation (RAG).** A retriever pulls passages from an external knowledge base and injects them into the prompt. The knowledge base can be updated continuously, so the model effectively gets fresh observation arrows at inference time — a partial mitigation of the training cutoff. The bridge still terminates in $R_i$ (passages as text), not directly in $W$, but the passages can be closer to $W$ than the model's parameters are (e.g., a documentation site that is updated nightly). This is the engineering reality: a partial observation arrow, licensed by the retrieval pipeline.

**Tools and formal verification as $T \in \mathcal{T}$ for the world.** When the model is allowed to *act* on the world — to run code, query a database, call an API, write and check a proof — it acquires genuine observation arrows. Running a Python snippet and observing the output is a $W \to R_i$ arrow whose $R_i$ is the program's actual behaviour. Writing a proof in a proof assistant such as **Coq** \cite{bertot2013coq} or **Lean** \cite{moura2015lean} and type-checking it is, in the chapter's vocabulary, the strongest available Tarski check: the proof's type-correctness is the meta-language fact $p$ that licenses the claim $S$ ("such-and-such follows from these axioms"). An LLM that emits a Coq script the user runs and verifies has performed a real *correspondence check* — not because the model itself knows Coq, but because the licensed transition from the model's output to the world's facts is now end-to-end. Code execution is a coarse-grained observation; formal verification is the finest-grained one in current use. The two together cover the spectrum from "does it run?" to "does the proof type-check?". The catch: the model has to *know how to call* these tools, and the tools have to be calibrated against the questions asked. A calculator that mishandles a domain error is no observation arrow; it is just noise. The chapter's nine-step procedure applies to the tools the same way it applies to the model.

The reading, then: the LLM, *by default*, has only internal arrows. With augmentation — in-context evidence, retrieval, tool use, code execution, formal proof — it acquires partial external ones, with the licensing earned piecemeal and audited per tool. None of this removes the structural gap; it narrows it. And the gap is *structural*: it lives in the architecture, not in any particular model's training, and it is the reason the next subsection's diagnosis (hallucination) reads the way it does.

### Hallucination, precisely

In the chapter's vocabulary, a *hallucination* is most accurately a **non-glueable presheaf with external correspondence failures**, though the cleaner *self-consistent fantasy* — internally consistent yet lacking correspondence — is also possible. The terminology matters: a *presheaf* assigns a section to each patch, but the *sheaf condition* — that compatible local sections glue into a unique global section — need not hold. The training corpus, as the previous section argued, contains contradictory patches: the same facts, different answers; the same code idiom, different conventions; the same historical event, different framings. The local sections are therefore *not* compatible on overlaps in the strict sense. They cannot be glued into a single coherent global section; at best, an $\infty$-sheaf gluing recovers a coherence class when the homotopies compose coherently on triple overlaps, which is a strong assumption that the corpus does not satisfy in general.

A more accurate diagnosis:

- *Local sections disagree.* The model can produce a fluent continuation on each local patch — locally, the section is fine — but the local sections do not agree with each other on overlaps, because the corpus's patches do not agree. The model often *forces* a global section by averaging conflicting patches, picking one and ignoring the others, or stitching incompatible pieces together with confident connective tissue. Each of these moves is a coherence failure on top of a correspondence failure.
- *The model's outputs are not internally consistent.* A model that contradicts itself mid-paragraph, that invents a citation that does not exist, that gives three different answers to the same factual question across a single conversation, is *not* a self-consistent fantasy. It is a broken presheaf. Its outputs read fluently on any short window, but the longer windows accumulate contradictions. Hallucination, in the typical case, is *both* a coherence failure (the model's parts don't glue) *and* a correspondence failure (the model's claims don't track $W$).
- *Licensing was granted, but the licence does not deliver contact.* The model's internal operations are licensed — they are admissible in $\mathcal{T}$ — but no transition inside the model reaches from the model's claims to the world. The Tarski if-and-only-if never gets evaluated, *except* in the partial ways the previous section described: in-context learning, retrieval, tool use, formal verification. In those cases the licence is real, and so is the Tarski check, but only at the augmented contact points; everywhere else, the licence is just a permit for the model to keep talking.

This is a more accurate diagnosis than the chapter's default *self-consistent fantasy*, and it changes the failure-mode table:

| Chapter's pathology | LLM failure mode | What's broken | Typical remedy |
| :--- | :--- | :--- | :--- |
| Non-glueable presheaf | Confident hallucination, local incoherence | Coherence + correspondence | Retrieval, RAG, tools, calibration of training data |
| Self-consistent fantasy (rare) | Fluent nonsense with internal consistency | Correspondence only | Grounding in actual sources |
| Factbook | Disconnected reasoning: correct facts but no synthesis | Coherence | Better reasoning, chain-of-thought, structured scratchpads |
| Calibrated error | Subtle, plausible-sounding mistakes | Correspondence | Re-calibrated licences (better calibration of the existing bridges, formal verification where applicable) |

The diagnosis matters because the *remedy* differs in each case. The typical hallucination needs *both* more coherence (cleaner training data, better reasoning) *and* more correspondence (retrieval, tools, verification). The pure self-consistent fantasy needs grounding. The factbook needs more coherence. The calibrated error needs re-licensing. A single fix does not address all four, and conflating them is one of the most common ways to talk uselessly about AI safety.

### What helps: adding admissible transitions

The chapter's vocabulary translates the standard remedies into moves in the diagram. Each remedy is, in the chapter's terms, *adding an admissible transition* that the system was missing. The augmented LLM, in olog form, looks like this:

$$
\begin{array}{c}
\underbrace{\text{User query}}_{\text{type}}\\
\downarrow\scriptstyle{\text{feeds into}}\\
\underbrace{\text{LLM}}_{\text{type}}\\
\downarrow\scriptstyle{\text{emits}}\\
\underbrace{\text{Output}}_{\text{type}}\\
\downarrow\scriptstyle{\text{is checked by}}\\
\underbrace{\text{Tool / verifier }(T\in\mathcal{T})}_{\text{type}}\\
\downarrow\scriptstyle{\text{calibrates against}}\\
\underbrace{\text{World fact (licensed contact point)}}_{\text{type}}
\end{array}
$$

The new row — the tool/verifier between the LLM's output and the world fact — is what each remedy below installs. The arrow from the tool to the world fact is the licensed transition that closes the loop. Without it, the diagram is the baseline LLM: a coherence engine with no correspondence check.

**Retrieval-Augmented Generation (RAG).** Before the model generates, an external retriever pulls relevant passages from a knowledge base and injects them into the prompt. In the diagram, the passages become *new patches* of the cover, and the licensing

$$
\underbrace{T}_{\text{licensed transition}}\;\in\;\underbrace{\mathcal{T}}_{\text{admissible set}}
$$

that connects the model's output to the passage text is now available. The model's claim "$X$" can be checked against the passage: is "$X$" supported by the retrieved evidence? If yes, the model has a *correspondence check* at a contact point. If the retrieval is good and the licensing is trusted, the hallucination rate on those queries drops sharply. The catch: the licence has to be earned. The retriever itself can be wrong (irrelevant passages, outdated knowledge base, poisoned documents), and a model that trusts a bad retriever is no better grounded than a model that trusts its own parameters. The chapter's nine-step procedure applies to the retriever the same way it applies to the model.

**Tool use and agents.** When the model can call external tools — a web search, a calculator, a code interpreter, a database query, an HTTP endpoint — it acquires new observation arrows

$$
\underbrace{O_i}_{\text{newly licensed}}\;:\;\underbrace{W}_{\text{the world}}\;\underbrace{\longrightarrow}_{\text{access function}}\;\underbrace{R_i}_{\text{trace in the model}}
$$

that were not available in its training. Each tool call is a *licensed transition* to a fresh source of evidence; the model's claim "$X$" can now be checked against the tool's response. The technique is powerful exactly because it expands $\mathcal{T}$ at inference time, in a controlled way. The catch: each tool is a new surface for error. A web search returns propaganda; a calculator mishandles a domain error; a code interpreter runs buggy code; an agent loops. The chapter's discipline applies to each: every tool needs its own calibration, its own licence, its own audit. The chapter's notion of *admissible cover* becomes the operational notion of a *bounded tool budget*: the agent is allowed a specified number of

$$
\underbrace{T}_{\text{licensed transition}}\;\in\;\underbrace{\mathcal{T}}_{\text{admissible set}}
$$

transitions, and the cover must be specified in advance.

**Code execution and formal verification as the strongest Tarski check.** When the model writes a Python snippet and the result is run, the user observes whether the program does what it should. That observation arrow is real: the program's actual behaviour is an $R_i$ produced from the hardware $W$. For mathematical claims, the strongest Tarski check currently available is type-checking a proof in an interactive theorem prover: **Coq** \cite{bertot2013coq} or **Lean** \cite{moura2015lean}. The model's claim "$S$: such-and-such follows from these axioms" is licensed by the proof assistant's small kernel, and the kernel's "yes" is the meta-language fact $p$ of Convention T. A model that emits a Lean proof the user runs is performing a real correspondence check; a model that only *describes* the proof in prose is not. Code execution is the coarse end of this spectrum ("does it run?"); formal verification is the fine end ("does the proof type-check under a checked kernel?"). The two together are the chapter's licensed transition to mathematical and computational reality.

**Reinforcement Learning from Human Feedback (RLHF).** RLHF adds admissible transitions to *human preferences*. The reward model encodes what humans find helpful and harmless; the policy is tuned to maximise that reward. In the chapter's vocabulary, RLHF installs a *Tarskian anchor* at the human rater's preference — and this is not a degenerate case. The raters' preferences, as observed, are real *facts in $W$*. The phenomenological tradition, in the line from \citeauthor{schmitz_neo_phenomenology}'s (\citeyear{schmitz_neo_phenomenology}) *Neue Phänomenologie* \cite{schmitz_neo_phenomenology}, takes subjective facts (feelings, preferences, situations) to be objective facts about the world — observable states of affairs that any witness can report on. The raters' preferences are simply facts of a kind the classical "objective" tradition underweighted; the chapter's $W$ is broad enough to include them. This is why RLHF-trained models are better at being *helpful*: the correspondence has been moved from the world-at-large to the rater's preference, but the rater's preference is a real, observable, licensable part of the world. The discipline: treat the human rater as a calibrated instrument, audit the rater's calibration periodically (do raters agree with each other? do raters' preferences track external ground truth where it is available?), and refuse to upgrade "the rater prefers this" to "this is true" without further licence. The rater is *one* licensed transition among many; not all transitions go through the rater; the rater's preferences are world facts, but not the only ones.

**Chain-of-thought and self-consistency.** These are *coherence techniques* (the previous section), not correspondence techniques. They sharpen the model's internal consistency; they do not, by themselves, ground the model in the world. Their value is to *expose* the model's failures: when self-consistency collapses — the model's $k$ sampled continuations disagree — that is a diagnostic flag that the underlying claim is not robustly supported. They tell you when to be suspicious; they do not tell you when to trust. The chapter's hierarchy of sameness is the right ladder: a chain-of-thought that is internally consistent is *coherent*; that coherence does not entail *correspondence*.

**Verifier-guided search.** This is the technique that comes closest to *adding a Tarskian check at every candidate*. Each candidate is a claim; the verifier is a licensed bridge from the candidate to a ground truth (or a proxy); the highest-scoring candidate is the one whose correspondence check passes most often. The technique only works if the verifier is itself licensed. A verifier trained on the same model, on the same corpus, scoring only fluency, is just another coherence check. A verifier trained against external ground truth, with its own calibration audit, is a real correspondence check. The Fitness-Beats-Truth result (a system that maximises a fitness payoff without estimating the true world state beats a system that estimates it) is, in the chapter's vocabulary, *the formal statement that an internal coherence engine, without licensed correspondence transitions, will beat a correspondence engine on fitness metrics* — and explains why the baseline LLM hallucinates rather than tracking truth.

**Reading the table the other way.** The chapter's diagnosis predicts which remedies will and will not work, before trying them. The typical LLM hallucination involves *both* coherence and correspondence failures (the previous section's revised diagnosis). Coherence techniques (longer chains of thought, self-consistency, scratchpads, cleaner training data) help on the coherence side; correspondence techniques (retrieval, tools, formal verification, calibrated raters) help on the correspondence side. Both are usually needed. Treating hallucination as a purely coherence problem (just scale up the model) or a purely correspondence problem (just retrieve more) systematically undershoots the diagnosis.

### The nine-step audit, applied to an LLM

The chapter's nine-step procedure, applied to a deployed LLM answering a user query:

1. **Take the raw datum $D$.** What is the model's input? The prompt, the context window, the system message, the available tools, the temperature, the sampling parameters.
2. **Interpret it as $J(D)$.** What reading is the model imposing? What is its parsing of the instruction, the format, the implicit task? The system prompt and the few-shot examples are part of $J(D)$.
3. **Draw the chain $W \to \text{corpus} \to \text{parameters} \to \text{prompt} \to \text{output}$.** Where in the chain could disagreement enter? Each arrow is a place things can go wrong.
4. **Identify overlaps.** Where do independent channels meet? In an LLM, overlaps include: multiple documents in the corpus that mention the same fact, multiple reasoning paths in chain-of-thought, multiple sampled continuations in self-consistency, multiple tools that could verify the same claim, multiple human raters who could rate the same output.
5. **Specify admissible transitions $T_{ij} \in \mathcal{T}$.** What licences each comparison? Tokenisation? Attention? Retrieval? Tool call? Calibration of an external sensor? Each needs to be named and audited.
6. **Decide which sameness.** $=$, $\cong$, $\simeq$, $\le \varepsilon$, statistical, model-theoretic. For a factual query, equality is what we want. For a paraphrase, isomorphism. For a fuzzy comparison, approximation. Pick the right one and refuse to upgrade.
7. **Build the candidate global model $G$.** Does descent hold on every admissible cover? For an LLM, this means: does the model produce a single, coherent answer that is consistent with all its available evidence? Are the chain-of-thought steps internally consistent? Do the self-consistency samples agree? Does the retrieved evidence support the claim?
8. **Record residuals.** What is preserved, not erased? What does the model know that it did not say? What does it say that it should not? Where did the chain break?
9. **Plan the next observation.** What evidence would discriminate? A second tool call? A different sampling temperature? A different prompt? An external verification? A human rater?

The procedure is the same for any model — scientific, mathematical, historical, LLM — because the chapter's claim is that the *shape* is the same.

### Where this framework reaches its limits

A framework aware of its reach must be clear about where it stops helping. The chapter's machinery, applied to LLMs, runs out of steam in at least four directions:

**Emergent capabilities.** Some LLM behaviours appear discontinuously at scale: few-shot in-context learning, chain-of-thought reasoning, code generation, instruction following, the long tail of surprising competencies the literature has catalogued since GPT-3. The chapter's vocabulary can *name* these as phenomena — they are local sections that begin to cohere at a critical scale — but it does not *explain* them. The mathematics of why descent becomes qualitatively different at scale is the open problem of modern deep learning theory, and this chapter has nothing to say about it.

**In-context learning as a meta-phenomenon.** The chapter treats in-context learning as *descent within the prompt*: the prompt is a cover, the continuation is the unique section compatible with it. This is descriptively right but explanatorily thin. Why does a fixed-parameter model perform *more* in-context learning at scale, with no architectural change? Why does the same model sometimes use the cover well and sometimes badly? The chapter's framework does not say.

**The training dynamics.** The chapter's diagram is *static*: it shows the trained model, not the process that produced it. The dynamic counterpart, treated properly in the *Backpropagation*, *Optimisers*, and *Deep Learning* chapters, is the composition of arrows that commute by the chain rule:

$$
\begin{array}{ccccc}
\underbrace{D}_{\text{dataset}} & \xrightarrow{\text{sample batch}} & \underbrace{B}_{\text{batch at }t} & \xrightarrow[\theta_t]{\text{forward + loss}} & \underbrace{L(\theta_t; B)}_{\text{loss value}} \\
& & & & \big\downarrow\scriptstyle{\text{backward}} \\
& & & & \underbrace{\nabla_\theta L}_{\text{gradient}} \\
& & & & \big\downarrow\scriptstyle{\eta\text{-SGD}} \\
& & & & \underbrace{\theta_{t+1}}_{\text{updated parameters}} \\
\end{array}
$$

The diagram commutes because the four operations compose to one step of gradient descent:

$$
\theta_t \xrightarrow{\text{forward} \circ \text{loss} \circ \text{backward} \circ \text{SGD}} \theta_{t+1}, \qquad \theta_{t+1} = \theta_t - \eta\,\nabla_\theta L,
$$

and the chain rule says the backward step is exactly the differential of the forward-plus-loss step. The other training-side phenomena factor through the same diagram. *Data quality* and *scale* enter at the top edge ($D \to B$): a cleaner or larger dataset reshapes the loss landscape before training touches it. *Backpropagation* is the chain-rule implementation of the implicit backward arrow. *Gradient descent* and the *loss landscape* enter as the geometry the SGD arrow follows. *SGD regularisation* is what happens when the implicit noise in $B$ (sampling from $D$) keeps the parameters from settling exactly on the noise — the source of the gap between training loss and generalisation.

**The value-alignment problem in the strong sense.** The chapter can diagnose the *epistemic* failure modes — hallucination, factbook, contact-point liar — but it has nothing to say about the *value-alignment* problem: how to ensure that a system with the right epistemic standing still pursues goals we want it to pursue. That is a separate problem, with separate tools (preference learning, Constitutional AI, debate, scalable oversight, formal verification), and the chapter's vocabulary does not extend to it.

These limits are not failings of the chapter; they are the *boundary* of what the chapter's machinery is competent to address. The framework is offered as a lens for the *epistemic* structure of world models; it is not a general theory of intelligence.

### An honest closing

Three honest claims, to leave the chapter with.

**This framework is a useful lens, not a finished theory.** It organises some intuitions, predicts some failure modes, suggests some remedies. It does not derive the architecture of a working LLM, and it does not replace the technical chapters of this book. The reader who finishes the chapter believing that she now has a theory of LLMs has misread it; the reader who finishes it with a sharper vocabulary for asking what an LLM is, and is not, doing has read it well.

**The unification of mathematics, philosophy, and epistemology is a hypothesis.** We have argued that the same shape shows up in three traditions, and that the argument is productive. The argument is not a derivation. A reader who finds the unification forced, partial, or misleading is not asked to surrender the rest of the chapter; the individual diagnoses — hallucination as a non-glueable presheaf, in-context learning as descent within the prompt, retrieval and tool use as adding admissible transitions, code execution and formal verification as the strongest Tarski check — stand on their own technical content, independent of the grand unification.

**The discipline is portable.** The nine-step procedure, the pathologies (including the more accurate *non-glueable presheaf* version of hallucination), the hierarchy of sameness, the question "where is the licensed transition?", the rule "never silently upgrade" — these survive even where the philosophical scaffolding is set aside. They are the practical content of the chapter. Take them into the next technical chapter, and into the next AI system you meet.

A useful analogy is not a theorem. The framework in this chapter is, on the author's own admission, mostly analogy — carefully drawn, repeatedly tested, but not derived. Where the analogy bites, it is because the underlying structural shape really is the same across domains. Where it does not, the reader is invited to notice, and to say so. Two corrections to the LLM diagnosis are worth flagging here, because they show the framework being applied to itself. First, code execution and formal verification count as observation arrows that an earlier version of the analysis underweighted. Second, hallucinations are usually *non-glueable presheaves*, not the cleaner self-consistent fantasies a closing synthesis might suggest. Both corrections are the same move: locate the difference at the right level, and refuse to upgrade a weaker sameness into a stronger one.

$$
\boxed{
\begin{aligned}
&\textbf{A world model is the global section recovered from local}\\
&\textbf{descent data along an admissible cover,}\\
&\textbf{provisionally, revisably, and never identical}\\
&\textbf{to the subject matter it represents.}\\
&\textbf{An LLM is a world model of a kind: a global section computed}\\
&\textbf{on a noisy, partially contradictory cover, without observation arrows}\\
&\textbf{of its own, kept coherent by training on the one resource it has —}\\
&\textbf{language about the world.}\\
&\textbf{The fix is not to ask it to also do correspondence.}\\
&\textbf{The fix is to attach correspondence, piecemeal, auditable, licensed:}\\
&\textbf{retrieval, tools, code execution, formal verification,}\\
&\textbf{calibrated raters — each transition earned and recorded.}
\end{aligned}}
$$

</div>
